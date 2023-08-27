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
            };
          };
          packages = rec {
            # https://github.com/NixOS/nixpkgs/blob/HEAD/doc/languages-frameworks/rust.section.md
            bin = (pkgs.makeRustPlatform {
              inherit (fenixPkgs) cargo rustc;
            }).buildRustPackage {
              pname = "unshorten.site";
              version = "0.1.0";
              src = ./.;
              cargoSha256 = "sha256-2m20Bq9JFEaP+jJ0zkrllPgu2BijYjAQsSyTZoaUPVA=";
              nativeBuildInputs = with fenixPkgs; [
                clippy
                rustfmt
              ];
              buildInputs = pkgBuildInputs;

              preBuild = ''
                make lint/rust
              '';
            };

            docker = pkgs.dockerTools.buildImage {
              name = "unshorten.site";
              tag = "dev";
              config = {
                Cmd = [ "${bin}/bin/unshorten-site" ];
                WorkingDir = "/app";
              };
            };

            website = pkgs.buildNpmPackage
              {
                name = "unshorten.site";

                buildInputs = with pkgs; [
                  nodejs
                ];

                src = ./website;
                npmDepsHash = "sha256-5eoAU3BPGvSQmMEjWnEjkjAZso4HYjhRY8U1p0R80To";

                installPhase = ''
                  runHook preInstall

                  mkdir -p $out
                  cp -r dist/* $out/

                  runHook postInstall
                '';
              };

            website-docker = pkgs.dockerTools.buildImage {
              name = "nginx-unshorten.site";
              tag = "dev";

              fromImage = pkgs.dockerTools.pullImage {
                imageName = "docker.io/library/nginx";
                imageDigest =
                  "sha256:cac882be2b7305e0c8d3e3cd0575a2fd58f5fde6dd5d6299605aa0f3e67ca385";
                sha256 = "sha256-eGZpg+x7c8ZQk5mPctNFGQbVzE+n3SXJRa7ZORINgH8=";
              };

              runAsRoot = ''
                mkdir -p /usr/share/nginx/html
                cp -r ${website}/* /usr/share/nginx/html
              '';

              config = {
                Cmd = [ "nginx" "-g" "daemon off;" ];
              };
            };
          };
        });
}

