#!/bin/bash
LAUNCHER_FILE="launcher.html"

# Find all html files (case-insensitive), excluding the launcher itself,
# and generate the list items for the HTML file.
LINKS=$(find . -type f -iname "*.html" | grep -v "launcher.html" | sed 's|^\./||' | while read -r line; do
    # Use the folder name as the link text.
    folder=$(dirname "$line")
    # If the file is in the root, use "root" as the folder name.
    if [ "$folder" = "." ]; then
        folder="root"
    fi
    echo "        <li><a href="$line" target="_blank">$folder</a><br><small>$line</small></li>"
done)

# Create the launcher.html file
cat > "$LAUNCHER_FILE" <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Launcher</title>
    <style>
        body {
            font-family: monospace;
            margin: 0 auto;
            max-width: 800px;
            padding: 2rem;
            background-color: #fff;
            color: #000;
        }
        h1 {
            font-size: 2em;
            font-weight: bold;
            border-bottom: 1px solid #000;
            padding-bottom: .3em;
            margin-bottom: 1rem;
        }
        ul {
            list-style-type: none;
            padding: 0;
        }
        li {
            margin-bottom: 1rem;
            border: 1px solid #000;
            padding: 1rem;
        }
        a {
            text-decoration: none;
            color: #000;
            font-weight: bold;
            font-size: 1.2em;
        }
        a:hover {
            text-decoration: underline;
        }
        small {
            font-size: 0.9em;
            color: #333;
        }
    </style>
</head>
<body>
    <h1>Project Launcher</h1>
    <ul>
$LINKS
    </ul>
</body>
</html>
EOF
