{ pkgs, fenixPkgs, ... }:

rec {
  # https://github.com/NixOS/nixpkgs/blob/HEAD/doc/languages-frameworks/rust.section.md
  server-bin = (pkgs.makeRustPlatform {
    inherit (fenixPkgs) cargo rustc;
  }).buildRustPackage rec {
    pname = "unshorten.site";
    version = "0.1.0";
    src = ./.;
    cargoSha256 = "sha256-2m20Bq9JFEaP+jJ0zkrllPgu2BijYjAQsSyTZoaUPVA=";
  };

  server-docker = pkgs.dockerTools.buildImage {
    name = "unshorten.site";
    tag = "dev";
    config = {
      Cmd = [ "${server-bin}/bin/unshorten-site" ];
      WorkingDir = "/app";
    };
  };
}
