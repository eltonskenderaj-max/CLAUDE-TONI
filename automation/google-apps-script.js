/**
 * ============================================================
 * AHRPA – Automatisation Email IA
 * ============================================================
 * Ce script automatise le traitement des demandes de contact
 * reçues via le formulaire AHRPA ou par email direct.
 *
 * Il classe les leads (CHAUD / TIÈDE / FROID), génère une
 * réponse personnalisée via l'API Gemini, l'envoie depuis
 * Gmail, et enregistre tout dans Google Sheets.
 *
 * ============================================================
 * INSTALLATION – ÉTAPE PAR ÉTAPE
 * ============================================================
 *
 * 1. Ouvrez https://script.google.com
 * 2. Créez un nouveau projet : "AHRPA Email Automation"
 * 3. Collez l'intégralité de ce code dans l'éditeur
 * 4. Configurez les constantes dans la section CONFIG ci-dessous :
 *    - GEMINI_API_KEY : obtenez-le sur https://aistudio.google.com/app/apikey (gratuit)
 *    - SHEET_ID : l'ID de votre Google Sheets de log (voir étape 7)
 *    - SENDER_EMAIL : votre email Gmail expéditeur
 *    - SENDER_NAME : le nom affiché dans les réponses
 *
 * 5. Créez un label Gmail nommé "ahrpa-contact" dans Gmail
 *    (Gmail > à gauche > "Créer un label")
 *
 * 6. Configurez un filtre Gmail pour ajouter le label :
 *    - Paramètres Gmail > Filtres > Créer un filtre
 *    - Sujet contient : AHRPA OU audit OU "demande hotel"
 *    - Action : Appliquer le label "ahrpa-contact"
 *
 * 7. Créez un Google Sheets et copiez son ID depuis l'URL :
 *    https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
 *    Nommez le premier onglet "Leads AHRPA"
 *
 * 8. Dans l'éditeur Apps Script :
 *    - Cliquez sur "Exécuter" > "setupTrigger" pour installer le déclencheur
 *    - Autorisez les permissions demandées
 *
 * 9. Le script s'exécutera automatiquement toutes les 5 minutes.
 *
 * ============================================================
 * SÉCURITÉ
 * ============================================================
 * - Stockez votre clé API dans les Propriétés du Script
 *   (Projet > Paramètres > Propriétés de script)
 *   plutôt que dans le code pour les environnements de production.
 * - Ne partagez jamais votre fichier Apps Script avec la clé API visible.
 * ============================================================
 */

// ============================================================
// CONFIGURATION – À MODIFIER AVANT UTILISATION
// ============================================================
var CONFIG = {
  // Clé API Gemini (gratuite sur https://aistudio.google.com/app/apikey)
  GEMINI_API_KEY: 'VOTRE_CLE_GEMINI_ICI',

  // ID du Google Sheets de journalisation
  // Trouvez-le dans l'URL : docs.google.com/spreadsheets/d/[CET_ID]/edit
  SHEET_ID: 'VOTRE_SHEET_ID_ICI',

  // Nom de l'onglet Google Sheets
  SHEET_TAB_NAME: 'Leads AHRPA',

  // Nom du label Gmail à surveiller
  GMAIL_LABEL: 'ahrpa-contact',

  // Email de l'expéditeur (votre Gmail)
  SENDER_EMAIL: 'contact@ahrpa.com',

  // Nom affiché dans les emails de réponse
  SENDER_NAME: 'Elton Skenderaj – AHRPA',

  // Nombre maximal d'emails à traiter par exécution
  MAX_EMAILS_PER_RUN: 10,

  // Délai minimum entre deux traitements du même email (en ms)
  ALREADY_PROCESSED_LABEL: 'ahrpa-processed'
};

// ============================================================
// POINT D'ENTRÉE PRINCIPAL
// Fonction appelée par le déclencheur temporel
// ============================================================
function processNewContactEmails() {
  Logger.log('=== AHRPA Email Automation – Démarrage ' + new Date().toISOString() + ' ===');

  try {
    // Récupérer les emails non traités avec le label ahrpa-contact
    var threads = getUnprocessedThreads();

    if (threads.length === 0) {
      Logger.log('Aucun nouvel email à traiter.');
      return;
    }

    Logger.log('Emails trouvés à traiter : ' + threads.length);

    // Initialiser la feuille Google Sheets
    initializeSheet();

    var processed = 0;
    for (var i = 0; i < threads.length && processed < CONFIG.MAX_EMAILS_PER_RUN; i++) {
      try {
        processThread(threads[i]);
        processed++;
        // Pause courte pour éviter les limites de débit API
        Utilities.sleep(1500);
      } catch (err) {
        Logger.log('Erreur lors du traitement du thread ' + threads[i].getId() + ' : ' + err.toString());
      }
    }

    Logger.log('=== Traitement terminé : ' + processed + ' email(s) traité(s) ===');

  } catch (err) {
    Logger.log('ERREUR CRITIQUE : ' + err.toString());
    // Notification d'erreur par email à l'administrateur
    sendErrorNotification(err);
  }
}

// ============================================================
// RÉCUPÉRATION DES EMAILS NON TRAITÉS
// ============================================================
function getUnprocessedThreads() {
  var threads = [];

  // Méthode 1 : Chercher dans le label dédié
  try {
    var label = GmailApp.getUserLabelByName(CONFIG.GMAIL_LABEL);
    if (label) {
      var labelThreads = label.getThreads(0, CONFIG.MAX_EMAILS_PER_RUN);
      for (var i = 0; i < labelThreads.length; i++) {
        if (!isAlreadyProcessed(labelThreads[i])) {
          threads.push(labelThreads[i]);
        }
      }
    }
  } catch (e) {
    Logger.log('Avertissement : label "' + CONFIG.GMAIL_LABEL + '" introuvable. Utilisation de la recherche par sujet.');
  }

  // Méthode 2 : Recherche par mots-clés dans le sujet si pas de résultat
  if (threads.length === 0) {
    var queries = [
      'subject:(AHRPA) is:unread newer_than:1d',
      'subject:(audit) subject:(hotel) is:unread newer_than:1d',
      'subject:(revenue management) subject:(Albania) is:unread newer_than:1d'
    ];

    for (var q = 0; q < queries.length; q++) {
      try {
        var found = GmailApp.search(queries[q], 0, 5);
        for (var j = 0; j < found.length; j++) {
          if (!isAlreadyProcessed(found[j]) && !containsThread(threads, found[j])) {
            threads.push(found[j]);
          }
        }
      } catch (searchErr) {
        Logger.log('Erreur de recherche : ' + searchErr);
      }
    }
  }

  return threads;
}

// ============================================================
// VÉRIFIER SI UN THREAD A DÉJÀ ÉTÉ TRAITÉ
// ============================================================
function isAlreadyProcessed(thread) {
  var labels = thread.getLabels();
  for (var i = 0; i < labels.length; i++) {
    if (labels[i].getName() === CONFIG.ALREADY_PROCESSED_LABEL) {
      return true;
    }
  }
  return false;
}

// ============================================================
// ÉVITER LES DOUBLONS DANS LE TABLEAU DE THREADS
// ============================================================
function containsThread(array, thread) {
  for (var i = 0; i < array.length; i++) {
    if (array[i].getId() === thread.getId()) return true;
  }
  return false;
}

// ============================================================
// TRAITEMENT D'UN THREAD EMAIL
// ============================================================
function processThread(thread) {
  var messages = thread.getMessages();
  var firstMessage = messages[0];

  Logger.log('Traitement du thread : ' + thread.getId());
  Logger.log('Sujet : ' + firstMessage.getSubject());

  // 1. Extraire les données du message
  var contactData = extractContactData(firstMessage);
  Logger.log('Contact extrait : ' + JSON.stringify(contactData));

  // 2. Classifier le lead avec Gemini
  var classification = classifyLeadWithGemini(contactData);
  Logger.log('Classification : ' + classification.temperature + ' (score: ' + classification.score + ')');

  // 3. Générer la réponse personnalisée
  var response = generatePersonalizedResponse(contactData, classification);

  // 4. Envoyer la réponse
  sendAutoResponse(firstMessage, contactData, response, classification);

  // 5. Logger dans Google Sheets
  logToSheet(contactData, classification, response);

  // 6. Marquer le thread comme traité
  markAsProcessed(thread);

  Logger.log('Thread traité avec succès : ' + thread.getId());
}

// ============================================================
// EXTRACTION DES DONNÉES DU MESSAGE
// ============================================================
function extractContactData(message) {
  var body = message.getPlainBody();
  var from = message.getFrom();
  var subject = message.getSubject();
  var date = message.getDate();

  // Extraire le nom depuis l'adresse "Prénom Nom <email@example.com>"
  var nameMatch = from.match(/^([^<]+)/);
  var emailMatch = from.match(/<([^>]+)>/);
  var senderName = nameMatch ? nameMatch[1].trim() : 'Inconnu';
  var senderEmail = emailMatch ? emailMatch[1] : from.trim();

  // Patterns pour extraire les champs du formulaire
  var patterns = {
    hotelName: [
      /(?:nom\s+de\s+votre?\s+h[oô]tel|hotel\s+name|name\s+of\s+hotel|emri\s+i\s+hotelit)\s*[:=\-]?\s*([^\n\r]+)/i,
      /h[oô]tel\s*[:=]\s*([^\n\r]+)/i,
      /(?:établissement|property)\s*[:=]\s*([^\n\r]+)/i
    ],
    rooms: [
      /(?:nombre\s+de\s+chambres|number\s+of\s+rooms|numri\s+i\s+dhomave|chambres?)\s*[:=\-]?\s*([\d\-\+]+)/i,
      /(\d+)\s*(?:chambres?|rooms?|dhoma)/i,
      /(?:10-19|20-29|30-49|50-80|80\+)/
    ],
    phone: [
      /(?:t[eé]l[eé]phone|phone|tel)\s*[:=\-]?\s*([\+\d\s\(\)\-]+)/i,
      /((?:\+|00)\d[\d\s\-]{8,})/
    ]
  };

  var hotelName = extractField(body, patterns.hotelName);
  var rooms = extractField(body, patterns.rooms);
  var phone = extractField(body, patterns.phone);

  // Chercher dans le sujet si pas trouvé dans le corps
  if (!hotelName || hotelName.length < 2) {
    var subjectHotel = subject.match(/(?:hotel|hôtel|hotel)\s+([A-Z][^\s,]+(?:\s+[A-Z][^\s,]+)?)/i);
    if (subjectHotel) hotelName = subjectHotel[1];
  }

  return {
    name: senderName,
    email: senderEmail,
    subject: subject,
    body: body,
    hotelName: hotelName || 'Non précisé',
    rooms: rooms || 'Non précisé',
    phone: phone || 'Non précisé',
    date: date,
    messageId: message.getId(),
    language: detectLanguage(body + ' ' + subject)
  };
}

// ============================================================
// EXTRACTION D'UN CHAMP AVEC PLUSIEURS PATTERNS
// ============================================================
function extractField(text, patterns) {
  for (var i = 0; i < patterns.length; i++) {
    var match = text.match(patterns[i]);
    if (match && match[1]) {
      return match[1].trim().substring(0, 100); // Limiter à 100 caractères
    }
  }
  return null;
}

// ============================================================
// DÉTECTION DE LA LANGUE DU MESSAGE
// ============================================================
function detectLanguage(text) {
  var lower = text.toLowerCase();
  var frWords = (lower.match(/\b(le|la|les|un|une|des|et|est|pour|vous|hôtel|chambre|réservation|bonjour)\b/g) || []).length;
  var enWords = (lower.match(/\b(the|and|is|for|you|hotel|room|booking|hello|revenue)\b/g) || []).length;
  var sqWords = (lower.match(/\b(dhe|është|për|ju|hotel|dhomë|rezervim|mirëdita|faleminderit|shqipëri)\b/g) || []).length;

  if (sqWords > frWords && sqWords > enWords) return 'sq';
  if (enWords > frWords) return 'en';
  return 'fr'; // Français par défaut
}

// ============================================================
// CLASSIFICATION DU LEAD AVEC GEMINI API
// ============================================================
function classifyLeadWithGemini(contactData) {
  var prompt = buildClassificationPrompt(contactData);

  try {
    var response = callGeminiAPI(prompt);
    return parseClassificationResponse(response, contactData);
  } catch (err) {
    Logger.log('Erreur Gemini API, classification de secours : ' + err.toString());
    // Classification de secours basée sur des règles simples
    return fallbackClassification(contactData);
  }
}

// ============================================================
// CONSTRUCTION DU PROMPT DE CLASSIFICATION
// ============================================================
function buildClassificationPrompt(data) {
  return 'Tu es un expert en revenue management hôtelier pour AHRPA, spécialisé sur les hôtels albanais.\n\n' +
    'Analyse ce message et classifie le lead en CHAUD, TIÈDE ou FROID selon ces critères :\n\n' +
    'CHAUD : Lead très qualifié. Contient :\n' +
    '- Nom spécifique de l\'hôtel ET nombre de chambres mentionnés\n' +
    '- Urgence exprimée (saison qui arrive, problème actuel, délai précis)\n' +
    '- Budget mentionné ou prêt à investir signalé\n' +
    '- Question précise sur les tarifs ou la mise en place\n\n' +
    'TIÈDE : Lead modérément qualifié. Contient :\n' +
    '- Nom de l\'hôtel OU nombre de chambres (pas les deux)\n' +
    '- Intérêt général pour le revenue management\n' +
    '- Demande d\'informations sans urgence apparente\n\n' +
    'FROID : Lead peu qualifié. Contient :\n' +
    '- Aucune information sur l\'hôtel\n' +
    '- Message très générique\n' +
    '- Demande hors sujet ou spam probable\n\n' +
    '---\n' +
    'Nom : ' + data.name + '\n' +
    'Email : ' + data.email + '\n' +
    'Sujet : ' + data.subject + '\n' +
    'Hôtel extrait : ' + data.hotelName + '\n' +
    'Chambres extraites : ' + data.rooms + '\n' +
    'Message :\n' + data.body.substring(0, 1500) + '\n' +
    '---\n\n' +
    'Réponds UNIQUEMENT avec ce format JSON strict (pas de markdown, pas d\'explication):\n' +
    '{"temperature":"CHAUD","score":85,"raison":"Explique en 1-2 phrases pourquoi","nom_hotel_confirme":"Nom détecté","nb_chambres_confirme":"Nombre détecté"}';
}

// ============================================================
// APPEL À L'API GEMINI (modèle gratuit gemini-1.5-flash)
// ============================================================
function callGeminiAPI(prompt) {
  var apiKey = CONFIG.GEMINI_API_KEY;

  // Utiliser les Propriétés de script si la clé n'est pas dans CONFIG
  if (apiKey === 'VOTRE_CLE_GEMINI_ICI') {
    var props = PropertiesService.getScriptProperties();
    apiKey = props.getProperty('GEMINI_API_KEY');
    if (!apiKey) throw new Error('Clé API Gemini non configurée. Ajoutez GEMINI_API_KEY dans les Propriétés de script.');
  }

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey;

  var payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 512
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
    ]
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var responseCode = response.getResponseCode();

  if (responseCode !== 200) {
    throw new Error('Gemini API erreur HTTP ' + responseCode + ' : ' + response.getContentText().substring(0, 200));
  }

  var data = JSON.parse(response.getContentText());

  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Réponse Gemini invalide : ' + JSON.stringify(data).substring(0, 200));
  }

  return data.candidates[0].content.parts[0].text;
}

// ============================================================
// ANALYSE DE LA RÉPONSE DE CLASSIFICATION
// ============================================================
function parseClassificationResponse(responseText, contactData) {
  try {
    // Nettoyer le texte (supprimer les éventuels backticks markdown)
    var cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    var parsed = JSON.parse(cleaned);

    return {
      temperature: parsed.temperature || 'TIÈDE',
      score: parsed.score || 50,
      raison: parsed.raison || 'Classification automatique',
      hotelName: parsed.nom_hotel_confirme || contactData.hotelName,
      rooms: parsed.nb_chambres_confirme || contactData.rooms
    };
  } catch (e) {
    Logger.log('Erreur parsing réponse Gemini : ' + e + '\nRéponse : ' + responseText.substring(0, 200));
    return fallbackClassification(contactData);
  }
}

// ============================================================
// CLASSIFICATION DE SECOURS (SANS API)
// ============================================================
function fallbackClassification(contactData) {
  var score = 0;
  var body = contactData.body.toLowerCase();

  // Critères positifs
  if (contactData.hotelName !== 'Non précisé') score += 25;
  if (contactData.rooms !== 'Non précisé') score += 20;
  if (contactData.phone !== 'Non précisé') score += 10;
  if (/urgent|dès que|rapide|maintenant|saison|semaine|mois prochain/i.test(body)) score += 20;
  if (/budget|invest|payer|tarif|prix|coût/i.test(body)) score += 15;
  if (/problème|problème|difficile|perd|baisse/i.test(body)) score += 10;

  var temperature = 'FROID';
  if (score >= 60) temperature = 'CHAUD';
  else if (score >= 30) temperature = 'TIÈDE';

  return {
    temperature: temperature,
    score: score,
    raison: 'Classification automatique (API indisponible) – Score basé sur les données extraites.',
    hotelName: contactData.hotelName,
    rooms: contactData.rooms
  };
}

// ============================================================
// GÉNÉRATION DE LA RÉPONSE PERSONNALISÉE
// ============================================================
function generatePersonalizedResponse(contactData, classification) {
  var lang = contactData.language;
  var temp = classification.temperature;

  var templates = getResponseTemplates();
  var template = templates[lang] && templates[lang][temp] ? templates[lang][temp] : templates['fr'][temp];

  // Remplacer les variables dans le template
  return template
    .replace(/\{\{nom\}\}/g, getFirstName(contactData.name))
    .replace(/\{\{hotel\}\}/g, classification.hotelName !== 'Non précisé' ? classification.hotelName : 'votre hôtel')
    .replace(/\{\{chambres\}\}/g, classification.rooms !== 'Non précisé' ? classification.rooms : '')
    .replace(/\{\{date_proposition\}\}/g, getAuditProposalDate());
}

// ============================================================
// EXTRAIRE LE PRÉNOM
// ============================================================
function getFirstName(fullName) {
  if (!fullName || fullName === 'Inconnu') return 'là';
  return fullName.split(' ')[0];
}

// ============================================================
// DATE PROPOSÉE POUR L'AUDIT (prochain jour ouvré)
// ============================================================
function getAuditProposalDate() {
  var date = new Date();
  date.setDate(date.getDate() + 1);
  // Sauter les week-ends
  if (date.getDay() === 6) date.setDate(date.getDate() + 2);
  if (date.getDay() === 0) date.setDate(date.getDate() + 1);
  var days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  return days[date.getDay()] + ' ' + date.getDate() + '/' + (date.getMonth() + 1);
}

// ============================================================
// TEMPLATES DE RÉPONSE PAR LANGUE ET TEMPÉRATURE
// ============================================================
function getResponseTemplates() {
  return {
    'fr': {
      'CHAUD': 'Bonjour {{nom}},\n\n' +
        'Merci pour votre message concernant {{hotel}}. Je suis Elton Skenderaj, fondateur d\'AHRPA.\n\n' +
        'Votre projet m\'intéresse beaucoup — j\'ai analysé rapidement votre situation et je pense que nous avons un réel potentiel à exploiter ensemble.\n\n' +
        'Je vous propose un audit complet de 45 minutes dès {{date_proposition}} pour :\n' +
        '• Analyser votre performance actuelle (RevPAR, ADR, taux d\'occupation)\n' +
        '• Comparer avec votre set concurrentiel\n' +
        '• Calculer le gain de revenus réalisable dans votre contexte\n' +
        '• Vous présenter notre plan d\'action personnalisé\n\n' +
        'Cet audit est 100% gratuit et sans engagement.\n\n' +
        'Pouvez-vous me confirmer votre disponibilité le {{date_proposition}} ? Ou indiquez-moi les créneaux qui vous conviennent le mieux.\n\n' +
        'À très vite,\n\n' +
        'Elton Skenderaj\n' +
        'Fondateur – AHRPA | Revenue Management Albania\n' +
        'Tél : +33 6 65 54 23 96\n' +
        'contact@ahrpa.com | www.ahrpa.com',

      'TIÈDE': 'Bonjour {{nom}},\n\n' +
        'Merci de nous avoir contactés au sujet de {{hotel}}. Je suis Elton Skenderaj, fondateur d\'AHRPA.\n\n' +
        'Nous sommes spécialisés dans le Revenue Management pour les hôtels albanais — nous aidons concrètement les établissements indépendants à augmenter leurs revenus de +12% à +25% en optimisant leur stratégie tarifaire.\n\n' +
        'Pour mieux vous aider, je serais ravi de vous proposer un audit gratuit de 45 minutes. Nous analysons ensemble votre situation actuelle, vos défis principaux et les opportunités de revenus non exploitées.\n\n' +
        'Ce qui est inclus dans l\'audit gratuit :\n' +
        '✓ Analyse de votre RevPAR, ADR et taux d\'occupation\n' +
        '✓ Comparaison avec vos concurrents directs\n' +
        '✓ Estimation du gain mensuel potentiel\n' +
        '✓ Plan d\'action prioritaire\n\n' +
        'Aucun engagement, aucune condition.\n\n' +
        'Souhaitez-vous qu\'on planifie cet appel dès cette semaine ?\n\n' +
        'Cordialement,\n\n' +
        'Elton Skenderaj\n' +
        'Fondateur – AHRPA | Revenue Management Albania\n' +
        'Tél : +33 6 65 54 23 96\n' +
        'contact@ahrpa.com | www.ahrpa.com',

      'FROID': 'Bonjour {{nom}},\n\n' +
        'Merci pour votre message. Je suis Elton Skenderaj, fondateur d\'AHRPA.\n\n' +
        'AHRPA est un cabinet de Revenue Management spécialisé pour les hôtels en Albanie. Nous aidons les hôtels indépendants de 10 à 80 chambres à optimiser leurs prix et maximiser leurs revenus.\n\n' +
        'Pour découvrir comment nous pouvons vous aider, je vous invite à :\n' +
        '• Consulter notre site : www.ahrpa.com\n' +
        '• Réserver un audit gratuit de 45 minutes (aucun engagement)\n' +
        '• Nous écrire à contact@ahrpa.com\n\n' +
        'N\'hésitez pas à nous contacter si vous avez des questions sur notre service.\n\n' +
        'Cordialement,\n\n' +
        'Elton Skenderaj\n' +
        'Fondateur – AHRPA | Revenue Management Albania\n' +
        'Tél : +33 6 65 54 23 96\n' +
        'contact@ahrpa.com | www.ahrpa.com'
    },

    'en': {
      'CHAUD': 'Hello {{nom}},\n\n' +
        'Thank you for your message about {{hotel}}. I am Elton Skenderaj, founder of AHRPA.\n\n' +
        'Your project looks very promising — I have quickly reviewed your situation and believe we have significant revenue potential to unlock together.\n\n' +
        'I would like to schedule a free 45-minute audit call on {{date_proposition}} to:\n' +
        '• Analyse your current performance (RevPAR, ADR, occupancy)\n' +
        '• Compare against your competitive set\n' +
        '• Calculate the revenue uplift achievable for your property\n' +
        '• Present a personalised action plan\n\n' +
        'This audit is 100% free and with no obligation.\n\n' +
        'Can you confirm your availability on {{date_proposition}}? Or let me know your preferred time slots.\n\n' +
        'Best regards,\n\n' +
        'Elton Skenderaj\n' +
        'Founder – AHRPA | Revenue Management Albania\n' +
        'Tel: +33 6 65 54 23 96\n' +
        'contact@ahrpa.com | www.ahrpa.com',

      'TIÈDE': 'Hello {{nom}},\n\n' +
        'Thank you for reaching out about {{hotel}}. I am Elton Skenderaj, founder of AHRPA.\n\n' +
        'We specialise in Revenue Management for Albanian hotels — helping independent properties increase their revenue by +12% to +25% through optimised pricing strategy.\n\n' +
        'I would love to offer you a free 45-minute audit call where we can review your current situation, identify your main challenges and uncover untapped revenue opportunities.\n\n' +
        'What is included in the free audit:\n' +
        '✓ Analysis of your RevPAR, ADR and occupancy rate\n' +
        '✓ Comparison with your direct competitors\n' +
        '✓ Estimated monthly revenue gain\n' +
        '✓ Priority action plan\n\n' +
        'No commitment, no conditions.\n\n' +
        'Shall we schedule this call this week?\n\n' +
        'Kind regards,\n\n' +
        'Elton Skenderaj\n' +
        'Founder – AHRPA | Revenue Management Albania\n' +
        'Tel: +33 6 65 54 23 96\n' +
        'contact@ahrpa.com | www.ahrpa.com',

      'FROID': 'Hello {{nom}},\n\n' +
        'Thank you for your message. I am Elton Skenderaj, founder of AHRPA.\n\n' +
        'AHRPA is a Revenue Management firm specialised for hotels in Albania. We help independent hotels with 10 to 80 rooms optimise their pricing and maximise revenue.\n\n' +
        'To find out how we can help you:\n' +
        '• Visit our website: www.ahrpa.com\n' +
        '• Book a free 45-minute audit (no obligation)\n' +
        '• Email us at contact@ahrpa.com\n\n' +
        'Please do not hesitate to contact us if you have any questions.\n\n' +
        'Kind regards,\n\n' +
        'Elton Skenderaj\n' +
        'Founder – AHRPA | Revenue Management Albania\n' +
        'Tel: +33 6 65 54 23 96\n' +
        'contact@ahrpa.com | www.ahrpa.com'
    },

    'sq': {
      'CHAUD': 'Përshëndetje {{nom}},\n\n' +
        'Faleminderit për mesazhin tuaj rreth {{hotel}}. Jam Elton Skenderaj, themelues i AHRPA.\n\n' +
        'Projekti juaj duket shumë premtues — kam shqyrtuar shpejt situatën tuaj dhe besoj se kemi potencial të konsiderueshëm të ardhurash që mund ta zhbllokojmë bashkë.\n\n' +
        'Do të doja të planifikoja një auditim falas 45-minutësh {{date_proposition}} për:\n' +
        '• Analizuar performancën tuaj aktuale (RevPAR, ADR, norma e zënies)\n' +
        '• Krahasuar me grupin tuaj konkurrues\n' +
        '• Llogaritur rritjen e mundshme të të ardhurave\n' +
        '• Paraqitur një plan veprimi të personalizuar\n\n' +
        'Ky auditim është 100% falas dhe pa asnjë angazhim.\n\n' +
        'A mund të konfirmoni disponueshmërinë tuaj {{date_proposition}}?\n\n' +
        'Respektueshëm,\n\n' +
        'Elton Skenderaj\n' +
        'Themelues – AHRPA | Menaxhimi i të Ardhurave – Shqipëri\n' +
        'Tel: +33 6 65 54 23 96\n' +
        'contact@ahrpa.com | www.ahrpa.com',

      'TIÈDE': 'Përshëndetje {{nom}},\n\n' +
        'Faleminderit që na kontaktuat rreth {{hotel}}. Jam Elton Skenderaj, themelues i AHRPA.\n\n' +
        'Jemi të specializuar në Menaxhimin e të Ardhurave për hotelet shqiptare — ndihmojmë hotelet e pavarura të rrisin të ardhurat me +12% deri +25%.\n\n' +
        'Do të doja t\'ju ofroja një auditim falas 45-minutësh pa asnjë angazhim.\n\n' +
        'A dëshironi ta planifikojmë këtë telefonatë këtë javë?\n\n' +
        'Me respekt,\n\n' +
        'Elton Skenderaj\n' +
        'Themelues – AHRPA\n' +
        'Tel: +33 6 65 54 23 96\n' +
        'contact@ahrpa.com | www.ahrpa.com',

      'FROID': 'Përshëndetje {{nom}},\n\n' +
        'Faleminderit për mesazhin tuaj. Jam Elton Skenderaj, themelues i AHRPA.\n\n' +
        'AHRPA është një kabinet i Menaxhimit të të Ardhurave i specializuar për hotelet në Shqipëri.\n\n' +
        'Vizitoni faqen tonë www.ahrpa.com ose na shkruani në contact@ahrpa.com për më shumë informacion.\n\n' +
        'Me respekt,\n\n' +
        'Elton Skenderaj\n' +
        'Themelues – AHRPA\n' +
        'Tel: +33 6 65 54 23 96\n' +
        'contact@ahrpa.com | www.ahrpa.com'
    }
  };
}

// ============================================================
// ENVOI DE LA RÉPONSE AUTOMATIQUE
// ============================================================
function sendAutoResponse(originalMessage, contactData, responseText, classification) {
  var originalSubject = originalMessage.getSubject();

  // Déterminer le préfixe de réponse selon la langue
  var replyPrefix = 'Re: ';
  if (contactData.language === 'en') replyPrefix = 'Re: ';

  var subject = originalSubject.startsWith('Re:') ? originalSubject : replyPrefix + originalSubject;

  // Ajouter un marqueur de température dans le sujet pour le tracking interne
  // (visible uniquement dans Sent/Envoyés, pas pour le destinataire)
  var internalNote = '[AHRPA-' + classification.temperature + '-' + classification.score + ']';
  Logger.log('Envoi de réponse ' + internalNote + ' à : ' + contactData.email);

  // Envoyer la réponse au thread original
  originalMessage.reply(responseText, {
    subject: subject,
    name: CONFIG.SENDER_NAME,
    replyTo: CONFIG.SENDER_EMAIL
  });

  Logger.log('Réponse envoyée avec succès à : ' + contactData.email);
}

// ============================================================
// ENREGISTREMENT DANS GOOGLE SHEETS
// ============================================================
function logToSheet(contactData, classification, response) {
  try {
    var sheetId = CONFIG.SHEET_ID;
    if (sheetId === 'VOTRE_SHEET_ID_ICI') {
      var props = PropertiesService.getScriptProperties();
      sheetId = props.getProperty('SHEET_ID');
      if (!sheetId) {
        Logger.log('AVERTISSEMENT : SHEET_ID non configuré. Log non enregistré.');
        return;
      }
    }

    var spreadsheet = SpreadsheetApp.openById(sheetId);
    var sheet = spreadsheet.getSheetByName(CONFIG.SHEET_TAB_NAME);

    // Créer l'onglet s'il n'existe pas
    if (!sheet) {
      sheet = spreadsheet.insertSheet(CONFIG.SHEET_TAB_NAME);
      // Écrire les en-têtes
      sheet.appendRow([
        'Date/Heure',
        'Nom',
        'Email',
        'Téléphone',
        'Hôtel',
        'Chambres',
        'Langue',
        'Température',
        'Score IA',
        'Raison Classification',
        'Extrait Message',
        'Réponse Envoyée',
        'Statut',
        'ID Message'
      ]);

      // Formater les en-têtes
      var headerRange = sheet.getRange(1, 1, 1, 14);
      headerRange.setBackground('#0a1628');
      headerRange.setFontColor('#c9a84c');
      headerRange.setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    // Déterminer la couleur de ligne selon la température
    var rowData = [
      new Date(),
      contactData.name,
      contactData.email,
      contactData.phone,
      classification.hotelName,
      classification.rooms,
      contactData.language.toUpperCase(),
      classification.temperature,
      classification.score,
      classification.raison,
      contactData.body.substring(0, 300) + (contactData.body.length > 300 ? '...' : ''),
      response.substring(0, 200) + '...',
      'Réponse envoyée',
      contactData.messageId
    ];

    sheet.appendRow(rowData);

    // Colorer la ligne selon la température
    var lastRow = sheet.getLastRow();
    var rowRange = sheet.getRange(lastRow, 1, 1, 14);
    if (classification.temperature === 'CHAUD') {
      rowRange.setBackground('#1a3a1a'); // Vert foncé
      sheet.getRange(lastRow, 8).setFontColor('#5cb85c').setFontWeight('bold');
    } else if (classification.temperature === 'TIÈDE') {
      rowRange.setBackground('#3a2a0a'); // Orange foncé
      sheet.getRange(lastRow, 8).setFontColor('#f0ad4e').setFontWeight('bold');
    } else {
      rowRange.setBackground('#1a1a2a'); // Bleu foncé
      sheet.getRange(lastRow, 8).setFontColor('#7a7aaa');
    }

    Logger.log('Enregistré dans Google Sheets : ligne ' + lastRow);

  } catch (sheetErr) {
    Logger.log('Erreur Google Sheets : ' + sheetErr.toString());
    // Ne pas bloquer le processus si Sheets échoue
  }
}

// ============================================================
// INITIALISER LA FEUILLE (CRÉER HEADERS SI NÉCESSAIRE)
// ============================================================
function initializeSheet() {
  // Cette fonction est appelée au début de processNewContactEmails
  // Elle vérifie la connexion à Sheets si l'ID est configuré
  try {
    var sheetId = CONFIG.SHEET_ID;
    if (sheetId !== 'VOTRE_SHEET_ID_ICI') {
      SpreadsheetApp.openById(sheetId);
      Logger.log('Google Sheets connecté : ' + sheetId);
    }
  } catch (e) {
    Logger.log('Avertissement Sheets : ' + e.toString());
  }
}

// ============================================================
// MARQUER LE THREAD COMME TRAITÉ
// ============================================================
function markAsProcessed(thread) {
  // Créer le label "ahrpa-processed" s'il n'existe pas
  var processedLabel = GmailApp.getUserLabelByName(CONFIG.ALREADY_PROCESSED_LABEL);
  if (!processedLabel) {
    processedLabel = GmailApp.createLabel(CONFIG.ALREADY_PROCESSED_LABEL);
  }

  // Appliquer le label
  thread.addLabel(processedLabel);

  // Marquer comme lu
  thread.markRead();

  Logger.log('Thread marqué comme traité : ' + thread.getId());
}

// ============================================================
// NOTIFICATION D'ERREUR À L'ADMINISTRATEUR
// ============================================================
function sendErrorNotification(error) {
  try {
    GmailApp.sendEmail(
      CONFIG.SENDER_EMAIL,
      '[AHRPA] Erreur Automatisation Email – ' + new Date().toLocaleDateString('fr-FR'),
      'Une erreur s\'est produite dans le script d\'automatisation AHRPA :\n\n' +
      'Erreur : ' + error.toString() + '\n\n' +
      'Date : ' + new Date().toISOString() + '\n\n' +
      'Vérifiez les logs dans : Apps Script > Mon projet > Exécutions'
    );
  } catch (e) {
    Logger.log('Impossible d\'envoyer la notification d\'erreur : ' + e.toString());
  }
}

// ============================================================
// INSTALLER LE DÉCLENCHEUR TEMPOREL (EXÉCUTER UNE FOIS MANUELLEMENT)
// ============================================================
function setupTrigger() {
  // Supprimer les déclencheurs existants pour ce script
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'processNewContactEmails') {
      ScriptApp.deleteTrigger(triggers[i]);
      Logger.log('Ancien déclencheur supprimé.');
    }
  }

  // Créer un nouveau déclencheur toutes les 5 minutes
  ScriptApp.newTrigger('processNewContactEmails')
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log('Déclencheur installé : processNewContactEmails toutes les 5 minutes.');
}

// ============================================================
// SUPPRIMER TOUS LES DÉCLENCHEURS (UTILITAIRE)
// ============================================================
function deleteTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  Logger.log('Tous les déclencheurs supprimés.');
}

// ============================================================
// TESTER LE SCRIPT AVEC UN EMAIL FICTIF
// ============================================================
function testWithFakeEmail() {
  Logger.log('=== TEST AVEC EMAIL FICTIF ===');

  var fakeContactData = {
    name: 'Agim Hoxha',
    email: 'agim@hotelriviera-sarande.al',
    subject: 'Demande d\'informations Revenue Management - Hotel Riviera Sarandë',
    body: 'Bonjour,\n\nJe suis directeur du Hotel Riviera Sarandë, 42 chambres. Nous avons actuellement un taux d\'occupation de 65% en haute saison mais seulement 30% en basse saison. Nos prix sont fixes toute l\'année et nous dépendons à 90% de Booking.com.\n\nNous souhaitons améliorer notre stratégie tarifaire avant la saison estivale qui commence dans 2 mois. Pouvez-vous nous aider rapidement ?\n\nMerci,\nAgim',
    hotelName: 'Hotel Riviera Sarandë',
    rooms: '42',
    phone: '+355 69 123 4567',
    date: new Date(),
    messageId: 'test_' + Date.now(),
    language: 'fr'
  };

  Logger.log('Données extraites : ' + JSON.stringify(fakeContactData));

  // Test classification
  var classification = classifyLeadWithGemini(fakeContactData);
  Logger.log('Classification : ' + JSON.stringify(classification));

  // Test génération de réponse
  var response = generatePersonalizedResponse(fakeContactData, classification);
  Logger.log('Réponse générée :\n' + response);

  Logger.log('=== FIN DU TEST ===');
}
