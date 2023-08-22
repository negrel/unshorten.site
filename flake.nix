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

  outputs = { flake-utils, nixpkgs, fenix, ... }@inputs:
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
              LD_LIBRARY_PATH = "";
            };
          };
          packages = rec {
            default = bin;
            # https://github.com/NixOS/nixpkgs/blob/HEAD/doc/languages-frameworks/rust.section.md
            bin = (pkgs.makeRustPlatform {
              inherit (fenixPkgs) cargo rustc;
            }).buildRustPackage {
              pname = "unshorten.site";
              version = "0.1.0";
              src = ./.;
              cargoSha256 = "sha256-rWPJW0nImkmECDNBcnM+fVfLgGcYwnmegBYag8j5L1Y=";
              nativeBuildInputs = with fenixPkgs; [
                clippy
                rustfmt
              ];
              buildInputs = pkgBuildInputs;

              preBuild = ''
                make lint/rust
              '';

              # Check SQL queries using sqlx-data.json
              SQLX_OFFLINE = 1;
            };

            docker = pkgs.dockerTools.buildImage {
              name = "unshorten.site";
              tag = "dev";
              config = {
                Cmd = [ "${bin}/bin/unshorten-site" ];
                WorkingDir = "/app";
              };
            };
          };
        });
}

