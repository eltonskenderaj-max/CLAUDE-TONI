<?php
// Simule exactement un appel POST a mail.php
// Appelé en GET depuis le navigateur pour tester

header('Content-Type: text/plain; charset=utf-8');

// Données de test simulées
$_POST['name']    = 'Test Utilisateur';
$_POST['email']   = 'contact@ahrpa.eu';
$_POST['phone']   = '0600000000';
$_POST['hotel']   = 'Hotel Test';
$_POST['rooms']   = '20';
$_POST['message'] = 'Test depuis mailtest3';
$_SERVER['REQUEST_METHOD'] = 'POST';

echo "=== SIMULATION mail.php ===\n\n";

$name    = htmlspecialchars(trim($_POST['name']    ?? ''), ENT_QUOTES, 'UTF-8');
$email   = trim($_POST['email']   ?? '');
$phone   = htmlspecialchars(trim($_POST['phone']   ?? ''), ENT_QUOTES, 'UTF-8');
$hotel   = htmlspecialchars(trim($_POST['hotel']   ?? ''), ENT_QUOTES, 'UTF-8');
$rooms   = htmlspecialchars(trim($_POST['rooms']   ?? ''), ENT_QUOTES, 'UTF-8');
$message = htmlspecialchars(trim($_POST['message'] ?? ''), ENT_QUOTES, 'UTF-8');

echo "name=$name, email=$email\n";

if (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo "ECHEC: validation name/email\n"; exit;
}
echo "Validation OK\n";

$email_safe = filter_var($email, FILTER_SANITIZE_EMAIL);
$subject = "Nouvelle demande audit AHRPA" . ($hotel ? " - $hotel" : '');
$body    = "Test\r\n";

$host = 'smtp.ionos.fr';
$port = 587;
$user = 'contact@ahrpa.eu';
$pass = 'Monteverdi2023domaine$';
$from = 'contact@ahrpa.eu';
$to   = 'contact@ahrpa.eu';

echo "Connexion SMTP...\n";
$fp = @fsockopen("tcp://$host", $port, $errno, $errstr, 15);
if (!$fp) { echo "ECHEC connexion: $errno $errstr\n"; exit; }
echo "OK\n";

function smtp_read($fp) {
    $r = '';
    while ($line = fgets($fp, 512)) {
        $r .= $line;
        if (substr($line, 3, 1) === ' ') break;
    }
    return $r;
}

smtp_read($fp);
fwrite($fp, "EHLO ahrpa.eu\r\n"); smtp_read($fp);
fwrite($fp, "STARTTLS\r\n");
$r = smtp_read($fp);
echo "STARTTLS: $r\n";
if (strpos($r, '220') === false) { fclose($fp); echo "ECHEC STARTTLS\n"; exit; }

stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
echo "TLS OK\n";

fwrite($fp, "EHLO ahrpa.eu\r\n"); smtp_read($fp);
fwrite($fp, "AUTH LOGIN\r\n"); smtp_read($fp);
fwrite($fp, base64_encode($user) . "\r\n"); smtp_read($fp);
fwrite($fp, base64_encode($pass) . "\r\n");
$r = smtp_read($fp);
echo "AUTH: $r\n";
if (strpos($r, '235') === false) { fclose($fp); echo "ECHEC AUTH\n"; exit; }

fwrite($fp, "MAIL FROM:<$from>\r\n"); $r = smtp_read($fp); echo "MAIL FROM: $r\n";
fwrite($fp, "RCPT TO:<$to>\r\n"); $r = smtp_read($fp); echo "RCPT TO: $r\n";
fwrite($fp, "DATA\r\n"); $r = smtp_read($fp); echo "DATA: $r\n";

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
echo "SEND result: $r\n";
fwrite($fp, "QUIT\r\n");
fclose($fp);

echo "\nRESULTAT: " . (strpos($r, '250') !== false ? "SUCCES !" : "ECHEC") . "\n";
