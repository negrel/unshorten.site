{ pkgs, fenixPkgs, ... }:

rec {
  # https://github.com/NixOS/nixpkgs/blob/HEAD/doc/languages-frameworks/rust.section.md
  server-bin = (pkgs.makeRustPlatform {
    inherit (fenixPkgs) cargo rustc;
  }).buildRustPackage rec {
    pname = "unshorten.site";
    version = "0.1.0";
    src = ./.;
    cargoSha256 = "sha256-dZ/Mu+IiGlVShU5gek7p+iG610Z4orXb+YN2Ix0egBs=";
  };
}
