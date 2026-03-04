{ pkgs, ... }: {
  # The nixpkgs channel to use.
  channel = "unstable"; # or "unstable"

  # A list of packages to install, from the channel.
  # You can search for packages on the NixOS package search: https://search.nixos.org/packages
  packages = [
    pkgs.tree
    pkgs.nodejs_20
    pkgs.php
    pkgs.phpPackages.composer
    pkgs.phpPackages.php-codesniffer
    pkgs.phpExtensions.mbstring
    pkgs.phpExtensions.tokenizer
  ];

  # A set of environment variables to be defined in the workspace.
  # env = {
  #   API_KEY = "your-secret-key";
  # };

  # A list of VS Code extensions to be installed in the workspace, from the Open VSX Registry.
  # You can search for extensions on the registry: https://open-vsx.org/
  idx.extensions = [
    "ritwickdey.liveserver" # Live Server extension
  ];

  # Specifies the workspace's lifecycle hooks.
  idx.workspace = {
    # Runs when a workspace is first created.
    onCreate = {};
    # Runs every time the workspace is (re)started.
    onStart = {
      generate-launcher = "./generate_launcher.sh";
    };
  };

  # Configures a web preview for your application.
  idx.previews = {
    enable = true;
    previews = {
      # The launcher app
      "launcher" = {
        command = ["npx" "live-server" "launcher.html" "--port=$PORT"];
        manager = "web";
      };
      # The PHP server
      "php-server" = {
        command = ["php" "-S" "0.0.0.0:$PORT"];
        manager = "web";
      };
    };
  };
}
