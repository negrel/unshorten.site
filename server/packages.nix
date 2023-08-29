{ pkgs, fenixPkgs, ... }:

rec {
  # https://github.com/NixOS/nixpkgs/blob/HEAD/doc/languages-frameworks/rust.section.md
  server-bin = (pkgs.makeRustPlatform {
    inherit (fenixPkgs) cargo rustc;
  }).buildRustPackage rec {
    pname = "unshorten.site";
    version = "0.1.0";
    src = ./.;
    cargoSha256 = "sha256-Tx1cHGrOdsukzUV+MUL8moy195g70PwnmbxmDl1tnqU=";
  };
}
