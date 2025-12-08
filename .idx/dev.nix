{ pkgs, ... }: {
  channel = "stable-24.05";
  packages = [ pkgs.nodejs_20 ];
  idx = {
    extensions = [ "google.gemini-cli-vscode-ide-companion" "Vue.volar"  "ritwickdey.LiveServer"];
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "--port" "$PORT"];
          manager = "web";
        };
      };
    };
    workspace = {
      onCreate = {
        npm-install = "npm install";
        default.openFiles = [ ".idx/dev.nix" "README.md" ];
      };
      onStart = {
        api-server = "node server.js";
        dev-server = "npm run dev";
      };
    };
  };
}
