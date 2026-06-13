<?php
header('Content-Type: text/plain; charset=utf-8');

echo "=== TEST SMTP IONOS ===\n\n";

$host = 'smtp.ionos.fr';
$port = 587;
$user = 'contact@ahrpa.eu';
$pass = 'Monteverdi2023domaine$';

echo "Connexion à $host:$port ... ";
$fp = fsockopen("tcp://$host", $port, $errno, $errstr, 15);
if (!$fp) {
    echo "ECHEC: $errno $errstr\n";

    // Essai port 465
    echo "Essai port 465 (SSL)... ";
    $fp = fsockopen("ssl://$host", 465, $errno, $errstr, 15);
    if (!$fp) {
        echo "ECHEC: $errno $errstr\n";

        // Essai smtp.ionos.com
        echo "Essai smtp.ionos.com:587... ";
        $fp = fsockopen("tcp://smtp.ionos.com", 587, $errno, $errstr, 15);
        if (!$fp) {
            echo "ECHEC: $errno $errstr\n";
            echo "\nLes connexions SMTP sortantes sont bloquées sur cet hébergement.\n";
            exit;
        } else {
            echo "OK\n";
            $host = 'smtp.ionos.com';
        }
    } else {
        echo "OK (port 465)\n";
        $port = 465;
    }
} else {
    echo "OK\n";
}

$read = function() use ($fp) {
    $r = '';
    while ($line = fgets($fp, 512)) {
        $r .= $line;
        if (substr($line, 3, 1) === ' ') break;
    }
    return trim($r);
};

$cmd = function($c, $hide = false) use ($fp, $read) {
    if (!$hide) echo ">>> $c\n";
    else echo ">>> [hidden]\n";
    fwrite($fp, $c . "\r\n");
    $r = $read();
    echo "<<< $r\n";
    return $r;
};

echo "\n--- Dialogue SMTP ---\n";
$greeting = $read();
echo "<<< $greeting\n";

$cmd("EHLO ahrpa.eu");

if ($port === 587) {
    $r = $cmd("STARTTLS");
    if (strpos($r, '220') !== false) {
        $ok = stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        echo "TLS upgrade: " . ($ok ? "OK" : "ECHEC") . "\n";
        $cmd("EHLO ahrpa.eu");
    }
}

$cmd("AUTH LOGIN");
$cmd(base64_encode($user));
$r = $cmd(base64_encode($pass), true);

if (strpos($r, '235') !== false) {
    echo "\nAuthentification: SUCCES\n";
} else {
    echo "\nAuthentification: ECHEC\n";
}

$cmd("QUIT");
fclose($fp);
