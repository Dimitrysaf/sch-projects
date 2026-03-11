#!/bin/bash

LAUNCHER_FILE="launcher.html"
CSS_FILE="launcher.css"
JS_FILE="launcher.js"

# Build an ordered list of folders that contain PHP files,
# in the same order as the HTML files are discovered.
PHP_FOLDERS_FILE=$(mktemp)
find . -type f -iname "*.html" | grep -v "launcher.html" | sed 's|^\./||' | while read -r line; do
    folder=$(dirname "$line")
    [ "$folder" = "." ] && folder="root"
    php_file=$(find "$folder" -maxdepth 1 -type f -iname "*.php" | head -n 1)
    if [ -n "$php_file" ]; then
        echo "$folder"
    fi
done > "$PHP_FOLDERS_FILE"

# Kill ALL existing PHP server processes before restarting
echo "Stopping existing PHP servers..."
pkill -f "php -S 0.0.0.0:" && echo "Stopped." || echo "None running."
sleep 1

# Start PHP servers in the same order as link generation
PHP_PORT=9002
while IFS= read -r folder; do
    echo "Starting PHP server for '$folder' on port $PHP_PORT..."
    php -S 0.0.0.0:$PHP_PORT -t "$folder" > /dev/null 2>&1 &
    PHP_PORT=$((PHP_PORT + 1))
done < "$PHP_FOLDERS_FILE"

# Generate list items, reusing the same folder order for port assignment
PHP_PORT_FILE=$(mktemp)
echo 9002 > "$PHP_PORT_FILE"

LINKS=""
while IFS= read -r line; do
    folder=$(dirname "$line")
    [ "$folder" = "." ] && folder="root"
    mod_date=$(stat -c %y "$line" | cut -d' ' -f1)
    folder_size=$(du -sh "$folder" | cut -f1)
    file_count=$(find "$folder" -type f | wc -l)

    php_file=$(find "$folder" -maxdepth 1 -type f -iname "*.php" | head -n 1)
    php_badge=""
    href="$line"
    if [ -n "$php_file" ]; then
        PHP_PORT=$(cat "$PHP_PORT_FILE")
        php_badge="<span class=\"php-badge\">PHP :$PHP_PORT</span>"
        href="__IDX_ORIGIN_${PHP_PORT}__/$line"
        echo $((PHP_PORT + 1)) > "$PHP_PORT_FILE"
    fi

    LINKS="$LINKS        <li data-name=\"$folder\" data-date=\"$mod_date\"><a href=\"$href\" target=\"_blank\">$folder</a> $php_badge<br><small>$line</small><div class=\"info\"><div class=\"info-box\">Size: $folder_size<br>Files: $file_count<br>Modified: $mod_date</div></div></li>\n"
done < <(find . -type f -iname "*.html" | grep -v "launcher.html" | sed 's|^\./||')

rm -f "$PHP_PORT_FILE" "$PHP_FOLDERS_FILE"

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
        <button id="refreshButton"> Refresh</button>
    </div>
    <ul id="linkList">
$(printf "%b" "$LINKS")
    </ul>
    <script>
    (function () {
        const hostname = window.location.hostname;
        const withoutPort = hostname.replace(/^\d+-/, '');
        document.querySelectorAll('a[href^="__IDX_ORIGIN_"]').forEach(a => {
            const match = a.getAttribute('href').match(/^__IDX_ORIGIN_(\d+)__\/(.*)$/);
            if (match) {
                const port = match[1];
                const path = match[2];
                a.href = 'https://' + port + '-' + withoutPort + '/' + path;
            }
        });
    })();
    </script>
    <script src="$JS_FILE"></script>
</body>
</html>
EOF