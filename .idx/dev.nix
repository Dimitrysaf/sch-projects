{ pkgs, ... }: {
  channel = "unstable";

  packages = [
    pkgs.tree
    pkgs.nodejs_20
    pkgs.php
    pkgs.phpPackages.composer
    pkgs.phpPackages.php-codesniffer
    pkgs.phpExtensions.mbstring
    pkgs.phpExtensions.tokenizer
    pkgs.mariadb
    pkgs.phpExtensions.pdo_mysql
  ];

  idx = {
    extensions = [
      "ritwickdey.liveserver"
      "bmewburn.vscode-intelephense-client"
    ];

    workspace = {
      onCreate = { };
      onStart = {
        generate-launcher = "./generate_launcher.sh && node server.js";
        mysql-start = ''
          mkdir -p .mysql
          if [ ! -d ".mysql/data/mysql" ]; then
            echo "Initializing MariaDB data directory..."
            mariadb-install-db --user=$(whoami) --datadir=$(pwd)/.mysql/data
          fi
          echo "Starting MariaDB server..."
          mariadbd --no-defaults \
                   --datadir=$(pwd)/.mysql/data \
                   --socket=$(pwd)/.mysql/mysql.sock \
                   --pid-file=$(pwd)/.mysql/mysql.pid \
                   --user=$(whoami) &
        '';
      };
    };

    previews = {
      enable = true;
      previews = {
        "launcher" = {
          command = [ "npx" "live-server" "launcher.html" "--port=$PORT" ];
          manager = "web";
        };
        # The PHP server
        "php-server" = {
          command = [ "php" "-S" "0.0.0.0:$PORT" ];
          manager = "web";
        };
      };
    };
  };
}