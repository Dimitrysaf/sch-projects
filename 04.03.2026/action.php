<?php
$a1=$_POST['ar1'];
$a2=$_POST['ar2'];
$g=$a1*$a2;

echo "Το γινόμενο είναι: ", $g, "<br>";

if ($a2==0){
    echo "Αδύνατη διαίρεση!<br>";
}

else {
    $p=$a1/$a2;
    echo "Το πηλίκο είναι: ", $p, "<br>";
}

echo "<br><br>";

echo "<a href='index.html'>Επιστροφή<a>";
?>