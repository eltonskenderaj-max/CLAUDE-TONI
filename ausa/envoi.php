<?php
/**
 * AUSA — traitement des formulaires du site :
 *   - contact, bénévolat, partenariat (formulaire court)
 *   - bulletin d'adhésion (formulaire complet + copie envoyée à l'adhérent)
 *
 * Les adresses e-mail sont dans config.php (NON versionné).
 * Sur le serveur : copier config.exemple.php en config.php et le compléter.
 */
error_reporting(0);
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');

function reponse($ok, $err = null, $code = 200) {
    http_response_code($code);
    echo json_encode($err ? ['success' => $ok, 'error' => $err] : ['success' => $ok]);
    exit;
}

$cfgFile = __DIR__ . '/config.php';
if (!is_file($cfgFile)) reponse(false, 'config', 500);
$cfg = require $cfgFile;

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') reponse(false, 'method', 405);

// Anti-spam : champ piège invisible + délai minimal de remplissage
if (!empty($_POST['site_web'])) reponse(true);
$started = (int)($_POST['t'] ?? 0);
if ($started && (time() - $started) < 3) reponse(true);

function field($k, $max = 2000) {
    $v = $_POST[$k] ?? '';
    if (is_array($v)) {
        $v = implode(', ', array_map(function ($x) { return trim((string)$x); }, array_slice($v, 0, 15)));
    }
    $v = trim(str_replace(["\r", "\0"], '', (string)$v));
    return mb_substr($v, 0, $max, 'UTF-8');
}
function oneline($v) { return trim(preg_replace('/\s+/', ' ', $v)); }
function f1($k, $max = 200) { return oneline(field($k, $max)); }
function ligne($label, $val) { return $label . str_repeat(' ', max(1, 26 - mb_strlen($label, 'UTF-8'))) . ': ' . ($val !== '' ? $val : '-') . "\n"; }

$types = [
    'contact'     => 'Demande de contact',
    'benevolat'   => 'Proposition de bénévolat',
    'adhesion'    => "Bulletin d'adhésion",
    'partenariat' => 'Proposition de partenariat',
];
$type = f1('type', 20);
if (!isset($types[$type])) $type = 'contact';

$prenom = f1('prenom', 80);
$nom    = f1('nom', 80);
$email  = f1('email', 160);
if ($prenom === '' || $nom === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || empty($_POST['consentement'])) {
    reponse(false, 'champs', 400);
}

$label = $types[$type];
$sep   = str_repeat('-', 50) . "\n";
$body  = "$label reçu(e) via le site de l'AUSA le " . date('d/m/Y à H:i') . "\n" . $sep;

if ($type === 'adhesion') {
    // Champs obligatoires du bulletin
    $oblig = ['date_naissance', 'adresse', 'code_postal', 'ville', 'tel', 'formule', 'statut_adhesion',
              'reglement', 'droit_image', 'statuts', 'exactitude', 'signature', 'fait_a'];
    foreach ($oblig as $k) { if (f1($k) === '') reponse(false, 'champs', 400); }

    $naissance = f1('date_naissance', 10);
    $age = null;
    $dn = DateTime::createFromFormat('Y-m-d', $naissance);
    if ($dn) { $age = $dn->diff(new DateTime())->y; $naissance = $dn->format('d/m/Y'); }
    $mineur = $age !== null && $age < 18;
    if ($mineur && (f1('rl_nom') === '' || f1('rl_tel') === '' || f1('rl_autorisation') === '')) reponse(false, 'champs', 400);
    if (f1('formule') === 'Adhésion famille' && field('membres_foyer') === '') reponse(false, 'champs', 400);

    $body .= "\n1. TYPE D'ADHÉSION\n";
    $body .= ligne('Formule', f1('formule'));
    $body .= ligne('Première / renouvellement', f1('statut_adhesion'));

    $body .= "\n2. ADHÉRENT\n";
    $body .= ligne('Civilité', f1('civilite'));
    $body .= ligne('Nom', mb_strtoupper($nom, 'UTF-8'));
    $body .= ligne('Prénom', $prenom);
    $body .= ligne('Date de naissance', $naissance . ($age !== null ? " ($age ans)" : ''));
    $body .= ligne('Profession / situation', f1('profession'));
    $body .= ligne('Adresse', f1('adresse', 250));
    $body .= ligne('Code postal / Ville', f1('code_postal', 10) . ' ' . f1('ville', 100));
    $body .= ligne('Téléphone', f1('tel', 40));
    $body .= ligne('E-mail', $email);

    if ($mineur) {
        $body .= "\nREPRÉSENTANT LÉGAL (adhérent mineur)\n";
        $body .= ligne('Nom et prénom', f1('rl_nom'));
        $body .= ligne('Lien', f1('rl_lien'));
        $body .= ligne('Téléphone', f1('rl_tel', 40));
        $body .= ligne('E-mail', f1('rl_email'));
        $body .= ligne('Autorisation parentale', f1('rl_autorisation'));
    }
    if (f1('formule') === 'Adhésion famille') {
        $body .= "\nMEMBRES DU FOYER\n" . field('membres_foyer', 1500) . "\n";
    }

    $body .= "\n3. ENGAGEMENT\n";
    $body .= ligne('Bénévolat', f1('benevole'));
    $body .= ligne('Domaines', f1('interets', 400));
    $body .= ligne('Compétences', f1('competences', 300));
    $body .= ligne('A connu l\'AUSA par', f1('connu'));

    $body .= "\n4. COTISATION\n";
    $body .= ligne('Mode de règlement', f1('reglement'));

    $body .= "\n5. AUTORISATIONS\n";
    $body .= ligne('Droit à l\'image', f1('droit_image'));
    $body .= ligne('Infos par e-mail', f1('infos_email') ?: 'Non');

    $body .= "\n6. ENGAGEMENT ET SIGNATURE\n";
    $body .= ligne('Adhère aux statuts', f1('statuts'));
    $body .= ligne('Certifie l\'exactitude', f1('exactitude'));
    $body .= ligne('Signature', f1('signature'));
    $body .= ligne('Fait à / le', f1('fait_a') . ', le ' . date('d/m/Y'));
    $body .= "\n" . $sep . "Statut : EN ATTENTE DE RÈGLEMENT DE LA COTISATION\n";
} else {
    $body .= ligne('Prénom / Nom', "$prenom $nom");
    $body .= ligne('E-mail', $email);
    $body .= ligne('Téléphone', f1('tel', 40));
    if (f1('interets') !== '')       $body .= ligne("Centres d'intérêt", f1('interets', 400));
    if (f1('disponibilites') !== '') $body .= ligne('Disponibilités', f1('disponibilites', 300));
    $body .= "\nMessage :\n" . (field('message', 5000) ?: '-') . "\n";
}
$body .= $sep . "Consentement RGPD donné le " . date('d/m/Y à H:i') . "\n";

function envoyer($to, $sujet, $texte, $from, $replyTo) {
    $subject  = '=?UTF-8?B?' . base64_encode($sujet) . '?=';
    $headers  = "From: =?UTF-8?B?" . base64_encode('Association AUSA') . "?= <$from>\r\n";
    $headers .= "Reply-To: $replyTo\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: 8bit\r\n";
    return @mail($to, $subject, $texte, $headers, '-f' . $from);
}

$from = $cfg['expediteur'];
$dest = $cfg['destinataire'];
if ($type === 'adhesion' && !empty($cfg['destinataire_adhesions'])) $dest = $cfg['destinataire_adhesions'];

$ok = envoyer($dest, "[Site AUSA] $label — $prenom $nom", $body, $from, $email);

// Copie à l'adhérent
if ($ok && $type === 'adhesion' && !empty($cfg['copie_adherent'])) {
    $copie  = "Bonjour $prenom,\n\n";
    $copie .= "Merci pour votre demande d'adhésion à l'Association Union & Solidarité Antibes (AUSA).\n";
    $copie .= "Nous l'avons bien reçue. Un membre du bureau vous contactera prochainement pour finaliser\n";
    $copie .= "votre adhésion et le règlement de la cotisation.\n\n";
    $copie .= "Voici le récapitulatif de votre bulletin :\n\n" . $body;
    $copie .= "\nPour toute correction, répondez simplement à cet e-mail.\n\nL'équipe de l'AUSA\n";
    envoyer($email, "Votre bulletin d'adhésion à l'AUSA", $copie, $from, $dest);
}

reponse((bool)$ok);
