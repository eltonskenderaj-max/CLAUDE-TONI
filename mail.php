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

// SMTP IONOS
$smtp_host = 'smtp.ionos.fr';
$smtp_port = 587;
$smtp_user = 'contact@ahrpa.eu';
$smtp_pass = 'Monteverdi2023domaine$';

$to      = 'contact@ahrpa.eu';
$subject = "Nouvelle demande d'audit AHRPA" . ($hotel ? " — $hotel" : '');

$body  = "Nouvelle demande d'audit via ahrpa.eu\r\n";
$body .= str_repeat("-", 40) . "\r\n\r\n";
$body .= "Nom         : $name\r\n";
$body .= "Email       : $email_safe\r\n";
$body .= "Telephone   : $phone\r\n";
$body .= "Hotel       : $hotel\r\n";
$body .= "Nb chambres : $rooms\r\n\r\n";
$body .= "Message :\r\n$message\r\n\r\n";
$body .= str_repeat("-", 40) . "\r\n";
$body .= "Envoye depuis ahrpa.eu\r\n";

function smtp_send($host, $port, $user, $pass, $from, $to, $subject, $body) {
    $fp = fsockopen("tcp://$host", $port, $errno, $errstr, 15);
    if (!$fp) return false;

    $read = function() use ($fp) {
        $r = '';
        while ($line = fgets($fp, 512)) {
            $r .= $line;
            if (substr($line, 3, 1) === ' ') break;
        }
        return $r;
    };

    $cmd = function($c) use ($fp, $read) {
        fwrite($fp, $c . "\r\n");
        return $read();
    };

    $read(); // greeting
    $cmd("EHLO ahrpa.eu");
    $cmd("STARTTLS");

    // upgrade to TLS
    stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);

    $cmd("EHLO ahrpa.eu");
    $cmd("AUTH LOGIN");
    $cmd(base64_encode($user));
    $r = $cmd(base64_encode($pass));
    if (strpos($r, '235') === false) { fclose($fp); return false; }

    $cmd("MAIL FROM:<$from>");
    $cmd("RCPT TO:<$to>");
    $cmd("DATA");

    $date    = date('r');
    $headers = "Date: $date\r\n";
    $headers .= "From: AHRPA Contact <$from>\r\n";
    $headers .= "Reply-To: $subject <" . filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL) . ">\r\n";
    $headers .= "To: $to\r\n";
    $headers .= "Subject: $subject\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: 8bit\r\n";

    fwrite($fp, $headers . "\r\n" . $body . "\r\n.\r\n");
    $r = $read();
    $cmd("QUIT");
    fclose($fp);

    return strpos($r, '250') !== false;
}

$sent = smtp_send($smtp_host, $smtp_port, $smtp_user, $smtp_pass, $smtp_user, $to, $subject, $body);

echo json_encode(['success' => $sent]);
