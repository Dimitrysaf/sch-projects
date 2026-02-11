{ pkgs, ... }:
{
  # Specifies the Nixpkgs channel to use.
  channel = "stable-24.05"; 

  # A list of packages to make available in your environment.
  packages = [
  ];

  # VS Code extensions to install.
  idx = {
    extensions = [
      "google.gemini-cli-vscode-ide-companion"
      "Vue.volar"
      "ritwickdey.LiveServer"
    ];

    # Web previews for your application.
    # The npm-based preview has been removed. You can use the Live Server extension
    # by right-clicking an HTML file and selecting "Open with Live Server".
    previews = {
      enable = false;
      previews = {};
    };

    # Workspace lifecycle hooks.
    workspace = {
      # Runs when a workspace is first created.
      onCreate = {
        default.openFiles = [ ".idx/dev.nix" "README.md" ];
      };
      # Runs every time the workspace is (re)started.
      onStart = {
        "generate-launcher" = "./generate_launcher.sh";
      };
    };
  };
}
