<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://ahrpa.eu');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Récupération et nettoyage des données
$name    = htmlspecialchars(trim($_POST['name']    ?? ''), ENT_QUOTES, 'UTF-8');
$email   = trim($_POST['email']   ?? '');
$phone   = htmlspecialchars(trim($_POST['phone']   ?? ''), ENT_QUOTES, 'UTF-8');
$hotel   = htmlspecialchars(trim($_POST['hotel']   ?? ''), ENT_QUOTES, 'UTF-8');
$rooms   = htmlspecialchars(trim($_POST['rooms']   ?? ''), ENT_QUOTES, 'UTF-8');
$message = htmlspecialchars(trim($_POST['message'] ?? ''), ENT_QUOTES, 'UTF-8');

// Validation
if (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid data']);
    exit;
}

$email_safe = filter_var($email, FILTER_SANITIZE_EMAIL);

// Destinataire
$to = 'contact@ahrpa.eu';

// Sujet
$subject = "=?UTF-8?B?" . base64_encode("Nouvelle demande d'audit AHRPA — $hotel") . "?=";

// Corps du message
$body  = "Nouvelle demande d'audit via ahrpa.eu\n";
$body .= str_repeat("─", 40) . "\n\n";
$body .= "Nom         : $name\n";
$body .= "Email       : $email_safe\n";
$body .= "Téléphone   : $phone\n";
$body .= "Hôtel       : $hotel\n";
$body .= "Nb chambres : $rooms\n\n";
$body .= "Message :\n$message\n\n";
$body .= str_repeat("─", 40) . "\n";
$body .= "Envoyé depuis ahrpa.eu\n";

// En-têtes
$headers  = "From: AHRPA Contact <contact@ahrpa.eu>\r\n";
$headers .= "Reply-To: $name <$email_safe>\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "Content-Transfer-Encoding: 8bit\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

// Le paramètre -f est requis par IONOS pour valider l'adresse d'enveloppe
$sent = mail($to, $subject, $body, $headers, '-f contact@ahrpa.eu');

echo json_encode(['success' => $sent]);
