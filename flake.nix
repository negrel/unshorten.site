{
  inputs = {
    flake-utils.url = "github:numtide/flake-utils";

    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    # NUR Rust toolchains and rust analyzer nightly for nix.
    fenix = {
      url = "github:nix-community/fenix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, flake-utils, nixpkgs, fenix, ... }@inputs:
    flake-utils.lib.eachDefaultSystem
      (system:
        let
          pkgs = import nixpkgs {
            inherit system;
            overlays = [ fenix.overlays.default ];
          };
          lib = pkgs.lib;
          fenixPkgs = fenix.packages.${system}.default;

          pkgBuildInputs = with pkgs; [ ];
        in
        {
          devShells = {
            default = pkgs.mkShell rec {
              buildInputs = with pkgs; [
                bunyan-rs
                nodejs
              ] ++ pkgBuildInputs ++ (
                with pkgs.fenix; [
                  complete.toolchain
                  rust-analyzer-nightly
                ]
              );
            };
          };
          packages = pkgs.callPackage ./server/packages.nix { inherit pkgs fenixPkgs; }
            // pkgs.callPackage ./website/packages.nix { inherit pkgs; } // {
            docker = pkgs.dockerTools.buildImage {
              name = "unshorten.site";
              tag = "dev";

              runAsRoot = ''
                mkdir -p /usr/share/actix/static
                cp -r ${self.packages.${system}.website}/* /usr/share/actix/static
              '';

              config = {
                Cmd = [ "${self.packages.${system}.server-bin}/bin/unshorten-site" ];
                WorkingDir = "/app";
              };
            };
          };
        });
}

