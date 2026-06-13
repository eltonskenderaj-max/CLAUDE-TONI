<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://ahrpa.eu');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(['version' => 'v6-smtp', 'ok' => true]);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$prenom  = htmlspecialchars(trim($_POST['prenom']   ?? ''), ENT_QUOTES, 'UTF-8');
$nom     = htmlspecialchars(trim($_POST['nom']     ?? ''), ENT_QUOTES, 'UTF-8');
$name    = trim("$prenom $nom");
$email   = trim($_POST['email']    ?? '');
$phone   = htmlspecialchars(trim($_POST['tel']     ?? ''), ENT_QUOTES, 'UTF-8');
$hotel   = htmlspecialchars(trim($_POST['hotel']   ?? ''), ENT_QUOTES, 'UTF-8');
$rooms   = htmlspecialchars(trim($_POST['chambres']?? ''), ENT_QUOTES, 'UTF-8');
$source  = htmlspecialchars(trim($_POST['source']  ?? ''), ENT_QUOTES, 'UTF-8');
$message = htmlspecialchars(trim($_POST['message'] ?? ''), ENT_QUOTES, 'UTF-8');

if (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid data']);
    exit;
}

$email_safe = filter_var($email, FILTER_SANITIZE_EMAIL);

$subject = "Nouvelle demande audit AHRPA" . ($hotel ? " - $hotel" : '');
$body    = "Nouvelle demande via ahrpa.eu\r\n";
$body   .= str_repeat("-", 40) . "\r\n\r\n";
$body   .= "Nom         : $name\r\n";
$body   .= "Email       : $email_safe\r\n";
$body   .= "Telephone   : $phone\r\n";
$body   .= "Hotel       : $hotel\r\n";
$body   .= "Nb chambres : $rooms\r\n";
$body   .= "Source      : $source\r\n\r\n";
$body   .= "Message :\r\n$message\r\n";

$host = 'smtp.ionos.fr';
$port = 587;
$user = 'contact@ahrpa.eu';
$pass = 'Monteverdi2023domaine$';
$from = 'contact@ahrpa.eu';
$to   = 'contact@ahrpa.eu';

$fp = @fsockopen("tcp://$host", $port, $errno, $errstr, 15);
if (!$fp) { echo json_encode(['success' => false, 'error' => 'connect']); exit; }

function smtp_read($fp) {
    $r = '';
    while ($line = fgets($fp, 512)) {
        $r .= $line;
        if (substr($line, 3, 1) === ' ') break;
    }
    return $r;
}

// greeting
smtp_read($fp);
fwrite($fp, "EHLO ahrpa.eu\r\n"); smtp_read($fp);
fwrite($fp, "STARTTLS\r\n");
$r = smtp_read($fp);
if (strpos($r, '220') === false) { fclose($fp); echo json_encode(['success'=>false,'error'=>'starttls']); exit; }

stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);

fwrite($fp, "EHLO ahrpa.eu\r\n"); smtp_read($fp);
fwrite($fp, "AUTH LOGIN\r\n"); smtp_read($fp);
fwrite($fp, base64_encode($user) . "\r\n"); smtp_read($fp);
fwrite($fp, base64_encode($pass) . "\r\n");
$r = smtp_read($fp);
if (strpos($r, '235') === false) { fclose($fp); echo json_encode(['success'=>false,'error'=>'auth']); exit; }

fwrite($fp, "MAIL FROM:<$from>\r\n"); smtp_read($fp);
fwrite($fp, "RCPT TO:<$to>\r\n"); smtp_read($fp);
fwrite($fp, "DATA\r\n"); smtp_read($fp);

$msg  = "Date: " . date('r') . "\r\n";
$msg .= "From: AHRPA Contact <$from>\r\n";
$msg .= "Reply-To: $name <$email_safe>\r\n";
$msg .= "To: $to\r\n";
$msg .= "Subject: $subject\r\n";
$msg .= "MIME-Version: 1.0\r\n";
$msg .= "Content-Type: text/plain; charset=UTF-8\r\n";
$msg .= "\r\n";
$msg .= $body;
$msg .= "\r\n.\r\n";

fwrite($fp, $msg);
$r = smtp_read($fp);
fwrite($fp, "QUIT\r\n");
fclose($fp);

echo json_encode(['success' => strpos($r, '250') !== false]);
