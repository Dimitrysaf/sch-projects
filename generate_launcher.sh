#!/bin/bash

LAUNCHER_FILE="launcher.html"
CSS_FILE="launcher.css"
JS_FILE="launcher.js"

# Find all html files (case-insensitive), excluding the launcher itself,
# and generate the list items for the HTML file.
LINKS=$(find . -type f -iname "*.html" | grep -v "launcher.html" | sed 's|^\./||' | while read -r line; do
    folder=$(dirname "$line")
    if [ "$folder" = "." ]; then
        folder="root"
    fi
    # Get modification date in YYYY-MM-DD format
    mod_date=$(stat -c %y "$line" | cut -d' ' -f1)
    # Get folder size
    folder_size=$(du -sh "$folder" | cut -f1)
    # Get file count
    file_count=$(find "$folder" -type f | wc -l)
    echo "        <li data-name=\"$folder\" data-date=\"$mod_date\"><a href=\"$line\" target=\"_blank\">$folder</a><br><small>$line</small><div class=\"info\"><div class=\"info-box\">Size: $folder_size<br>Files: $file_count<br>Modified: $mod_date</div></div></li>"
done)

# Create the launcher.html file
cat > "$LAUNCHER_FILE" <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Launcher</title>
    <link rel="stylesheet" href="$CSS_FILE">
</head>
<body>
    <h1>Launcher</h1>
    <div class="filter-container">
        <input type="text" id="nameFilter" placeholder="Filter by name...">
        <input type="date" id="dateFilter">
        <button id="sortButton">Newest</button>
    </div>
    <ul id="linkList">
$LINKS
    </ul>
    <script src="$JS_FILE"></script>
</body>
</html>
EOF
