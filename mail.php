<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://ahrpa.eu');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$name    = htmlspecialchars(trim($_POST['name']    ?? ''), ENT_QUOTES, 'UTF-8');
$email   = trim($_POST['email']   ?? '');
$phone   = htmlspecialchars(trim($_POST['phone']   ?? ''), ENT_QUOTES, 'UTF-8');
$hotel   = htmlspecialchars(trim($_POST['hotel']   ?? ''), ENT_QUOTES, 'UTF-8');
$rooms   = htmlspecialchars(trim($_POST['rooms']   ?? ''), ENT_QUOTES, 'UTF-8');
$message = htmlspecialchars(trim($_POST['message'] ?? ''), ENT_QUOTES, 'UTF-8');

if (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid data']);
    exit;
}

$email_safe = filter_var($email, FILTER_SANITIZE_EMAIL);

$subject = "Nouvelle demande d'audit AHRPA" . ($hotel ? " - $hotel" : '');
$body    = "Nouvelle demande d'audit via ahrpa.eu\r\n";
$body   .= str_repeat("-", 40) . "\r\n\r\n";
$body   .= "Nom         : $name\r\n";
$body   .= "Email       : $email_safe\r\n";
$body   .= "Telephone   : $phone\r\n";
$body   .= "Hotel       : $hotel\r\n";
$body   .= "Nb chambres : $rooms\r\n\r\n";
$body   .= "Message :\r\n$message\r\n\r\n";
$body   .= str_repeat("-", 40) . "\r\n";
$body   .= "Envoye depuis ahrpa.eu\r\n";

// SMTP
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
function smtp_cmd($fp, $cmd) {
    fwrite($fp, $cmd . "\r\n");
    return smtp_read($fp);
}

smtp_read($fp);                          // greeting
smtp_cmd($fp, "EHLO ahrpa.eu");
$r = smtp_cmd($fp, "STARTTLS");
if (strpos($r, '220') === false) { fclose($fp); echo json_encode(['success'=>false,'error'=>'starttls']); exit; }

stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);

smtp_cmd($fp, "EHLO ahrpa.eu");
smtp_cmd($fp, "AUTH LOGIN");
smtp_cmd($fp, base64_encode($user));
$r = smtp_cmd($fp, base64_encode($pass));
if (strpos($r, '235') === false) { fclose($fp); echo json_encode(['success'=>false,'error'=>'auth']); exit; }

smtp_cmd($fp, "MAIL FROM:<$from>");
smtp_cmd($fp, "RCPT TO:<$to>");
smtp_cmd($fp, "DATA");

$msg  = "Date: " . date('r') . "\r\n";
$msg .= "From: AHRPA Contact <$from>\r\n";
$msg .= "Reply-To: $name <$email_safe>\r\n";
$msg .= "To: $to\r\n";
$msg .= "Subject: $subject\r\n";
$msg .= "MIME-Version: 1.0\r\n";
$msg .= "Content-Type: text/plain; charset=UTF-8\r\n";
$msg .= "Content-Transfer-Encoding: 8bit\r\n";
$msg .= "\r\n";
$msg .= $body;
$msg .= "\r\n.\r\n";

fwrite($fp, $msg);
$r = smtp_read($fp);
smtp_cmd($fp, "QUIT");
fclose($fp);

echo json_encode(['success' => strpos($r, '250') !== false]);
