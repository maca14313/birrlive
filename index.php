<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://birrlive.flexdivs.com');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');


$dsn = 'mysql:host=localhost';
$user = 'flexdiqg_birrlive';
$password = '0925090339*#';

// Create a new PDO instance
$pdo = new PDO($dsn, $user, $password);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Create the flexdiqg_BirrLive database
$pdo->exec('CREATE DATABASE IF NOT EXISTS flexdiqg_BirrLive');
$pdo->exec('USE flexdiqg_BirrLive');

// Create the Banks table
$pdo->exec('
    CREATE TABLE IF NOT EXISTS Banks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL
    )
');

// Create the Currencies table
$pdo->exec('
    CREATE TABLE IF NOT EXISTS Currencies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        country_code VARCHAR(10) NOT NULL,
        buying DECIMAL(10, 4) NOT NULL,
        selling DECIMAL(10, 4) NOT NULL,
        bank_id INT,
        FOREIGN KEY (bank_id) REFERENCES Banks(id)
    )
');

// Handle OPTIONS requests for preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Handle incoming requests
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestUri = trim($_SERVER['REQUEST_URI'], '/'); // Remove leading and trailing slashes

// Debugging line to check the actual request URI
error_log("Request URI: $requestUri");

// Hello World Endpoint
if ($requestMethod === 'GET' && $requestUri === 'phpbackend/index.php/hello') {
    echo json_encode(['message' => 'Hello, World!']);
    exit;
}

// Add a New Bank
if ($requestMethod === 'POST' && $requestUri === 'phpbackend/index.php/banks') {
    $data = json_decode(file_get_contents('php://input'), true);
    $name = $data['name'] ?? null;

    if (!$name) {
        http_response_code(400);
        echo json_encode(['message' => 'Bank name is required']);
        exit;
    }

    // Check if the bank name already exists
    $stmt = $pdo->prepare('SELECT * FROM Banks WHERE name = ?');
    $stmt->execute([$name]);
    $results = $stmt->fetchAll();

    if (count($results) > 0) {
        http_response_code(400);
        echo json_encode(['message' => 'Bank name already exists']);
        exit;
    }

    // Fetch existing currencies
    $stmt = $pdo->query('SELECT * FROM Currencies');
    $currencies = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Remove duplicate currencies by name
    $uniqueCurrencies = [];
    $currencyNames = [];

    foreach ($currencies as $currency) {
        if (!in_array($currency['name'], $currencyNames)) {
            $uniqueCurrencies[] = $currency;
            $currencyNames[] = $currency['name'];
        }
    }

    // Insert the new bank
    $stmt = $pdo->prepare('INSERT INTO Banks (name) VALUES (?)');
    $stmt->execute([$name]);
    $newBankId = $pdo->lastInsertId();

    // Insert unique currencies
    if (count($uniqueCurrencies) > 0) {
        $pdo->beginTransaction();

        try {
            $stmt = $pdo->prepare('INSERT INTO Currencies (name, country_code, buying, selling, bank_id) VALUES (?, ?, ?, ?, ?)');

            foreach ($uniqueCurrencies as $currency) {
                $stmt->execute([$currency['name'], $currency['country_code'], 0.0, 0.0, $newBankId]);
            }

            $pdo->commit();
            echo json_encode(['message' => 'Bank added successfully', 'id' => $newBankId]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['message' => 'Error creating currencies for new bank']);
        }
    } else {
        echo json_encode(['message' => 'Bank added successfully', 'id' => $newBankId]);
    }

    exit;
}

// Add a New Currency
if ($requestMethod === 'POST' && $requestUri === 'phpbackend/index.php/currencies') {
    $data = json_decode(file_get_contents('php://input'), true);
    $name = $data['name'] ?? null;
    $country_code = $data['country_code'] ?? null;

    if (!$name || !$country_code) {
        http_response_code(400);
        echo json_encode(['message' => 'Currency name and country code are required']);
        exit;
    }

    // Check if currency already exists
    $stmt = $pdo->prepare('SELECT * FROM Currencies WHERE name = ?');
    $stmt->execute([$name]);
    $currency = $stmt->fetch();

    if (!$currency) {
        // Get all banks
        $stmt = $pdo->query('SELECT id FROM Banks');
        $banks = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if (count($banks) === 0) {
            http_response_code(404);
            echo json_encode(['message' => 'No banks found']);
            exit;
        }

        // Insert new currency for each bank
        $values = [];
        foreach ($banks as $bankId) {
            $values[] = [$name, $country_code, 0.0, 0.0, $bankId];
        }

        $stmt = $pdo->prepare('INSERT INTO Currencies (name, country_code, buying, selling, bank_id) VALUES (?, ?, ?, ?, ?)');

        foreach ($values as $value) {
            $stmt->execute($value);
        }

        echo json_encode(['message' => 'Currency added successfully']);
    } else {
        http_response_code(404);
        echo json_encode(['message' => 'Currency already exists']);
    }

    exit;
}

// Get Banks with Currencies
if ($requestMethod === 'GET' && $requestUri === 'phpbackend/index.php/banks-with-currencies') {
    $query = '
        SELECT b.id AS bank_id, b.name AS bank_name,
               c.id AS currency_id, c.name AS currency_name, c.country_code, c.buying, c.selling
        FROM Banks b
        LEFT JOIN Currencies c ON b.id = c.bank_id
    ';

    $stmt = $pdo->query($query);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $banks = [];

    foreach ($results as $row) {
        if (!isset($banks[$row['bank_id']])) {
            $banks[$row['bank_id']] = [
                'id' => $row['bank_id'],
                'name' => $row['bank_name'],
                'currencies' => []
            ];
        }

        if ($row['currency_id']) {
            $banks[$row['bank_id']]['currencies'][] = [
                'id' => $row['currency_id'],
                'name' => $row['currency_name'],
                'country_code' => $row['country_code'],
                'buying' => $row['buying'],
                'selling' => $row['selling']
            ];
        }
    }

    echo json_encode(array_values($banks));
    exit;
}

// Get All Currencies
if ($requestMethod === 'GET' && $requestUri === 'phpbackend/index.php/currencies') {
    $stmt = $pdo->query('SELECT * FROM Currencies');
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($results);
    exit;
}

// Update Currency
if ($requestMethod === 'PUT' && preg_match('/^phpbackend\/index.php\/currencies\/(\d+)$/', $requestUri, $matches)) {
    $id = $matches[1];
    $data = json_decode(file_get_contents('php://input'), true);
    $buying = $data['buying'] ?? null;
    $selling = $data['selling'] ?? null;

    if ($buying === null || $selling === null) {
        http_response_code(400);
        echo json_encode(['message' => 'Buying and selling values are required']);
        exit;
    }

    $stmt = $pdo->prepare('UPDATE Currencies SET buying = ?, selling = ? WHERE id = ?');
    $stmt->execute([$buying, $selling, $id]);

    echo json_encode(['message' => 'Currency updated successfully']);
    exit;
}

http_response_code(404);
echo json_encode(['message' => 'Endpoint not found']);
?>
