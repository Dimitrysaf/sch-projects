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
        href="__IDX_ORIGIN_${PHP_PORT}__/"
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
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/monokai.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/sql/sql.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/edit/matchbrackets.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/edit/closebrackets.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/comment/comment.min.js"></script>
</head>
<body>
    <h1>Launcher</h1>
    <div class="tabs">
        <button class="tab-btn active" data-tab="projects">Projects</button>
        <button class="tab-btn" data-tab="database">Database</button>
    </div>
    <div id="tab-projects" class="tab-content active">
        <div class="filter-container">
            <input type="text" id="nameFilter" placeholder="Filter by name...">
            <input type="date" id="dateFilter">
            <button id="sortButton">Newest</button>
            <button id="refreshButton"> Refresh</button>
        </div>
        <ul id="linkList">
$(printf "%b" "$LINKS")
        </ul>
    </div>
    <div id="tab-database" class="tab-content">
        <div class="db-selector-row">
            <span class="db-selector-label">Database:</span>
            <select id="dbSelect"><option value="">— select —</option></select>
            <span id="dbStatus"></span>
        </div>
        <div class="db-query-area">
            <textarea id="sqlInput" rows="4" placeholder="SELECT * FROM users;&#10;INSERT INTO users (name) VALUES ('Alice');"></textarea>
            <div style="display:flex;flex-direction:column;gap:0.5rem;">
                <button id="runQuery">Run</button>
                <button id="cheatBtn">? Cheat</button>
            </div>
        </div>
        <div id="queryResults"></div>
        <hr class="db-divider">
        <div id="dbTree"></div>
    </div>
    <div class="modal-overlay" id="cheatOverlay">
        <div class="modal">
            <div class="modal-header">
                <h2>MySQL Cheat Sheet</h2>
                <button id="closeCheat">✕ Close</button>
            </div>
            <div class="cheat-section">
                <h3>Databases</h3>
                <div class="cheat-row"><span class="cheat-cmd">SHOW DATABASES;</span><span class="cheat-desc">List all databases</span></div>
                <div class="cheat-row"><span class="cheat-cmd">CREATE DATABASE name;</span><span class="cheat-desc">Create a new database</span></div>
                <div class="cheat-row"><span class="cheat-cmd">DROP DATABASE name;</span><span class="cheat-desc">Delete a database</span></div>
            </div>
            <div class="cheat-section">
                <h3>Tables</h3>
                <div class="cheat-row"><span class="cheat-cmd">SHOW TABLES;</span><span class="cheat-desc">List tables in current DB</span></div>
                <div class="cheat-row"><span class="cheat-cmd">DESCRIBE table;</span><span class="cheat-desc">Show columns of a table</span></div>
                <div class="cheat-row"><span class="cheat-cmd">CREATE TABLE t (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255));</span><span class="cheat-desc">Create a table</span></div>
                <div class="cheat-row"><span class="cheat-cmd">DROP TABLE t;</span><span class="cheat-desc">Delete a table</span></div>
                <div class="cheat-row"><span class="cheat-cmd">ALTER TABLE t ADD col INT;</span><span class="cheat-desc">Add a column</span></div>
                <div class="cheat-row"><span class="cheat-cmd">ALTER TABLE t DROP COLUMN col;</span><span class="cheat-desc">Remove a column</span></div>
            </div>
            <div class="cheat-section">
                <h3>Querying</h3>
                <div class="cheat-row"><span class="cheat-cmd">SELECT * FROM t;</span><span class="cheat-desc">Select all rows</span></div>
                <div class="cheat-row"><span class="cheat-cmd">SELECT col1, col2 FROM t WHERE col = 'val';</span><span class="cheat-desc">Filter rows</span></div>
                <div class="cheat-row"><span class="cheat-cmd">SELECT * FROM t ORDER BY col DESC LIMIT 10;</span><span class="cheat-desc">Sort and limit</span></div>
                <div class="cheat-row"><span class="cheat-cmd">SELECT * FROM a JOIN b ON a.id = b.a_id;</span><span class="cheat-desc">Inner join</span></div>
                <div class="cheat-row"><span class="cheat-cmd">SELECT col, COUNT(*) FROM t GROUP BY col;</span><span class="cheat-desc">Group and count</span></div>
            </div>
            <div class="cheat-section">
                <h3>Inserting / Updating / Deleting</h3>
                <div class="cheat-row"><span class="cheat-cmd">INSERT INTO t (col1, col2) VALUES ('a', 'b');</span><span class="cheat-desc">Insert a row</span></div>
                <div class="cheat-row"><span class="cheat-cmd">UPDATE t SET col = 'val' WHERE id = 1;</span><span class="cheat-desc">Update rows</span></div>
                <div class="cheat-row"><span class="cheat-cmd">DELETE FROM t WHERE id = 1;</span><span class="cheat-desc">Delete rows</span></div>
                <div class="cheat-row"><span class="cheat-cmd">TRUNCATE TABLE t;</span><span class="cheat-desc">Delete all rows, keep structure</span></div>
            </div>
            <div class="cheat-section">
                <h3>Users &amp; Permissions</h3>
                <div class="cheat-row"><span class="cheat-cmd">SELECT User, Host FROM mysql.user;</span><span class="cheat-desc">List users</span></div>
                <div class="cheat-row"><span class="cheat-cmd">CREATE USER 'u'@'localhost' IDENTIFIED BY 'pw';</span><span class="cheat-desc">Create a user</span></div>
                <div class="cheat-row"><span class="cheat-cmd">GRANT ALL ON db.* TO 'u'@'localhost';</span><span class="cheat-desc">Grant privileges</span></div>
                <div class="cheat-row"><span class="cheat-cmd">FLUSH PRIVILEGES;</span><span class="cheat-desc">Apply privilege changes</span></div>
                <div class="cheat-row"><span class="cheat-cmd">DROP USER 'u'@'localhost';</span><span class="cheat-desc">Delete a user</span></div>
            </div>
            <div class="cheat-section">
                <h3>Misc</h3>
                <div class="cheat-row"><span class="cheat-cmd">SHOW PROCESSLIST;</span><span class="cheat-desc">Active queries</span></div>
                <div class="cheat-row"><span class="cheat-cmd">SHOW VARIABLES LIKE 'max_%';</span><span class="cheat-desc">Server variables</span></div>
                <div class="cheat-row"><span class="cheat-cmd">SELECT VERSION();</span><span class="cheat-desc">MariaDB version</span></div>
                <div class="cheat-row"><span class="cheat-cmd">SELECT DATABASE();</span><span class="cheat-desc">Current database</span></div>
            </div>
            <small>Click any command to paste it into the query box.</small>
        </div>
    </div>
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