# AHRPA – Automatisation Email IA (Budget 0 €)

Workflow : Formulaire site → Gmail → IA → Réponse automatique → Google Sheets

---

## Option A : Google Apps Script (la plus simple)

### Étape 1 – Préparer Gmail
1. Dans Gmail, créez un filtre pour les emails du formulaire AHRPA
2. Appliquez le label **`ahrpa-contact`** à ces emails

### Étape 2 – Obtenir une clé API Gemini gratuite
1. Allez sur https://aistudio.google.com/
2. Cliquez **"Get API key"** → **"Create API key"**
3. Copiez la clé (commence par `AIza...`)

### Étape 3 – Créer le Google Sheets
1. Créez un Google Sheets nommé **"AHRPA Leads"**
2. Colonnes : `Date | Nom | Hôtel | Chambres | Email | Température | Message | Réponse`
3. Copiez l'ID du Sheets depuis l'URL (entre `/d/` et `/edit`)

### Étape 4 – Déployer le script
1. Allez sur https://script.google.com/
2. Créez un nouveau projet : **"AHRPA Auto-Response"**
3. Copiez le contenu de `google-apps-script.js`
4. Remplacez les constantes en haut :
   - `GEMINI_API_KEY` → votre clé API
   - `SHEETS_ID` → l'ID de votre Google Sheets
   - `AHRPA_EMAIL` → votre email Gmail
5. Cliquez **Enregistrer**

### Étape 5 – Configurer le déclencheur automatique
1. Dans Apps Script : **Déclencheurs** (icône horloge) → **+ Ajouter un déclencheur**
2. Fonction : `checkNewEmails`
3. Source : **Basé sur le temps**
4. Type : **Minuteur** → toutes les **5 minutes**
5. Cliquez **Enregistrer**

### Étape 6 – Tester
1. Envoyez un email test à votre Gmail avec sujet "Audit AHRPA"
2. Attendez 5 minutes ou exécutez manuellement `checkNewEmails`
3. Vérifiez le Sheets et la réponse dans Gmail

---

## Option B : n8n Community Edition

### Installation n8n (local)
```bash
npm install -g n8n
n8n start
# Interface : http://localhost:5678
```

### Ou avec Docker
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### Import du workflow
1. Ouvrez http://localhost:5678
2. Cliquez **+** → **Import from file**
3. Importez `n8n-workflow.json`
4. Configurez les credentials :
   - **Gmail** : OAuth2 Google
   - **Google Sheets** : OAuth2 Google
   - **HTTP Request / OpenRouter** : Header Auth (`Authorization: Bearer VOTRE_CLE`)

### Obtenir une clé OpenRouter gratuite
1. https://openrouter.ai/ → Sign up
2. Dashboard → API Keys → Create key
3. Modèle gratuit utilisé : `mistralai/mistral-7b-instruct:free`

### Remplacer l'ID Google Sheets
Dans le nœud "Google Sheets Log", remplacez `VOTRE_GOOGLE_SHEETS_ID` par l'ID réel.

---

## Logique de qualification des leads

| Température | Critères | Action |
|-------------|----------|--------|
| 🔴 **CHAUD** | Hôtel nommé + nb chambres + urgence | Email prioritaire + alerte |
| 🟡 **TIÈDE** | Hôtel mentionné mais vague | Email standard + suivi J+3 |
| 🔵 **FROID** | Générique, sans détails | Enregistrement seul, pas de réponse auto |

---

## Sécurité
- Ne partagez jamais votre clé API publiquement
- Utilisez les variables d'environnement pour stocker les clés sensibles
- Activez la 2FA sur votre compte Google
- Révisez les logs Google Sheets hebdomadairement

---

## Support
Email : eltonskenderaj@gmail.com
Tel : +33 6 65 54 23 96
