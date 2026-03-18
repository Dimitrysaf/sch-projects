<?php
// Database connection details
// The socket path is determined by the onStart command in your .idx/dev.nix file
$socket = getcwd() . '/.mysql/mysql.sock';
$dbname = 'mysql'; // Default database, you can create your own
$user = 'root'; // Default user
$password = ''; // Default password is empty

try {
    // Create a PDO instance
    $pdo = new PDO("mysql:unix_socket=$socket;dbname=$dbname", $user, $password);

    // Set the PDO error mode to exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Connected successfully to the database!";

    // You can now execute queries, for example:
    // $stmt = $pdo->query("SELECT VERSION()");
    // $version = $stmt->fetchColumn();
    // echo "<br>Database version: " . $version;

} catch(PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
?>
