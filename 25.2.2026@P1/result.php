<?php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("HTTP/1.1 405 Method Not Allowed");
    echo "<h1>405 Method Not Allowed</h1>";
    echo "<p>This page can only be accessed by submitting the form.</p>";
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Form Results</title>
</head>
<body>
    <?php
        // Determine checkbox state to simplify HTML
        $is_male = (isset($_POST['gender']) && $_POST['gender'] === 'Άνδρας');
        $is_female = (isset($_POST['gender']) && $_POST['gender'] === 'Γυναίκα');
    ?>
    <h3>Form Submission Results</h3>
    <form>
        <label for="name">Όνομα: </label>
        <input type="text" id="name" name="name" value="<?php echo htmlspecialchars($_POST['name'] ?? ''); ?>" disabled>
        <br><br>
        <label for="pass">Κωδικός: </label>
        <input type="text" id="pass" name="pass" value="<?php echo htmlspecialchars($_POST['pass'] ?? ''); ?>" disabled>
        <br><br>
        <label for="email">Email: </label>
        <input type="email" id="email" name="email" value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>" disabled>
        <br><br>
        <label for="age">Ηλικία: </label>
        <input type="number" id="age" name="age" value="<?php echo htmlspecialchars($_POST['age'] ?? ''); ?>" disabled>
        <br><br>
        <label for="phone">Τηλέφωνο: </label>
        <input type="tel" id="phone" name="phone" value="<?php echo htmlspecialchars($_POST['phone'] ?? ''); ?>" disabled>
        <br><br>
        <label for="website">Ιστοσελίδα: </label>
        <input type="url" id="website" name="website" value="<?php echo htmlspecialchars($_POST['website'] ?? ''); ?>" disabled>
        <br><br>
        <label for="dob">Ημεροηνία Γέννησης: </label>
        <input type="date" id="dob" name="dob" value="<?php echo htmlspecialchars($_POST['dob'] ?? ''); ?>" disabled>
        <br><br>
        <label for="time">Ώρα: </label>
        <input type="time" id="time" name="time" value="<?php echo htmlspecialchars($_POST['time'] ?? ''); ?>" disabled>
        <br><br>
        <label for="color">Επίλεξε Χρώμα: </label>
        <input type="color" id="color" name="color" value="<?php echo htmlspecialchars($_POST['color'] ?? ''); ?>" disabled>
        <br><br>
        <label for="volume">Ένταση: </label>
        <input type="range" id="volume" name="volume" value="<?php echo htmlspecialchars($_POST['volume'] ?? ''); ?>" disabled>
        <br><br>
        <label for="gender">Φύλο: </label>
        <br><br>
        <input type="radio" id="male" name="gender" value="Άνδρας" <?php if ($is_male) echo 'checked'; ?> disabled>
        <label for="male">Άνδρας</label>
        <input type="radio" id="female" name="gender" value="Γυναίκα" <?php if ($is_female) echo 'checked'; ?> disabled>
        <label for="female">Γυναίκα</label>
        <br><br>
        <input type="checkbox" id="checkbox" name="checkbox" <?php if (isset($_POST['checkbox'])) echo 'checked'; ?> disabled>
        <label for="checkbox">Αποδέχομαι τους όρους </label>
        <br><br>
        <label for="fileup">Ανέβασμα αρχείου: </label>
        <?php
            if (isset($_FILES['fileup']['name']) && !empty($_FILES['fileup']['name'])) {
                echo '<span>' . htmlspecialchars($_FILES['fileup']['name']) . '</span>';
            } else {
                echo '<span>No file uploaded.</span>';
            }
        ?>
        <br><br>
        <label for="country">Χώρα: </label>
        <select id="country" name="country" disabled>
            <option value="gr" <?php if (isset($_POST['country']) && $_POST['country'] == 'gr') echo 'selected'; ?>>Ελλάδα</option>
            <option value="else" <?php if (isset($_POST['country']) && $_POST['country'] == 'else') echo 'selected'; ?>>Αλλού</option>
        </select>
        <br><br>
        <label for="textarea">Μήνυμα: </label><br>
        <textarea id="textarea" name="textarea" disabled><?php echo htmlspecialchars($_POST['textarea'] ?? ''); ?></textarea>
        <br><br>
    </form>
</body>
</html>
