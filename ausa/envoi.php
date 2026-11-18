<?php
/**
 * AUSA — traitement des formulaires (contact, bénévolat, adhésion, partenariat).
 * Les paramètres (adresse de réception) sont dans config.php, NON versionné.
 * Copier config.exemple.php en config.php sur le serveur et le compléter.
 */
error_reporting(0);
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');

$cfgFile = __DIR__ . '/config.php';
if (!is_file($cfgFile)) { http_response_code(500); echo json_encode(['success' => false, 'error' => 'config']); exit; }
$cfg = require $cfgFile;

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'method']);
    exit;
}

// Anti-spam : champ piège invisible + délai minimal de remplissage
if (!empty($_POST['site_web'])) { echo json_encode(['success' => true]); exit; }
$started = (int)($_POST['t'] ?? 0);
if ($started && (time() - $started) < 3) { echo json_encode(['success' => true]); exit; }

function field($k, $max = 2000) {
    $v = trim((string)($_POST[$k] ?? ''));
    $v = str_replace(["\r", "\0"], '', $v);
    return mb_substr($v, 0, $max, 'UTF-8');
}
function oneline($v) { return preg_replace('/[\n\t]+/', ' ', $v); }

$types = [
    'contact'     => 'Demande de contact',
    'benevolat'   => 'Proposition de bénévolat',
    'adhesion'    => "Demande d'adhésion",
    'partenariat' => 'Proposition de partenariat',
];
$type    = field('type', 20);
if (!isset($types[$type])) $type = 'contact';
$prenom  = oneline(field('prenom', 80));
$nom     = oneline(field('nom', 80));
$email   = oneline(field('email', 160));
$tel     = oneline(field('tel', 40));
$dispo   = oneline(field('disponibilites', 300));
$message = field('message', 5000);
$interets = isset($_POST['interets']) && is_array($_POST['interets'])
    ? implode(', ', array_map(function ($x) { return oneline(mb_substr(trim((string)$x), 0, 60, 'UTF-8')); }, array_slice($_POST['interets'], 0, 10)))
    : '';
$consent = !empty($_POST['consentement']);

if ($prenom === '' || $nom === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || !$consent) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'champs']);
    exit;
}

$label   = $types[$type];
$subject = '=?UTF-8?B?' . base64_encode("[Site AUSA] $label — $prenom $nom") . '?=';
$body  = "$label reçue via le site de l'AUSA\n" . str_repeat('-', 44) . "\n\n";
$body .= "Prénom / Nom   : $prenom $nom\n";
$body .= "E-mail         : $email\n";
$body .= "Téléphone      : " . ($tel ?: '-') . "\n";
if ($interets) $body .= "Centres d'intérêt : $interets\n";
if ($dispo)    $body .= "Disponibilités : $dispo\n";
$body .= "\nMessage :\n" . ($message ?: '-') . "\n\n";
$body .= str_repeat('-', 44) . "\nConsentement RGPD donné le " . date('d/m/Y H:i') . "\n";

$to   = $cfg['destinataire'];
$from = $cfg['expediteur'];
$headers  = "From: Site AUSA <$from>\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "Content-Transfer-Encoding: 8bit\r\n";

$ok = @mail($to, $subject, $body, $headers, '-f' . $from);
echo json_encode(['success' => (bool)$ok]);
