{ pkgs, ... }:
{
  # Specifies the Nixpkgs channel to use.
  channel = "stable-24.05"; 

  # A list of packages to make available in your environment.
  packages = [
    pkgs.nodejs_20
    pkgs.nodePackages.nodemon 
  ];

  # VS Code extensions to install.
  idx = {
    extensions = [
      "google.gemini-cli-vscode-ide-companion"
      "Vue.volar"
      "ritwickdey.LiveServer"
    ];

    # Web previews for your application.
    previews = {
      enable = true;
      previews = {
        web = {
          command = [ "npm" "run" "dev" ];
          manager = "web";
        };
      };
    };

    # Workspace lifecycle hooks.
    workspace = {
      # Runs when a workspace is first created.
      onCreate = {
        "npm-install" = "npm install";
        default.openFiles = [ ".idx/dev.nix" "README.md" ];
      };
    };
  };
}