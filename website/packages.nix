{ pkgs, ... }:

rec {
  website = pkgs.buildNpmPackage {
    name = "unshorten.site";

    buildInputs = with pkgs; [
      nodejs
    ];

    src = ./.;
    npmDepsHash = "sha256-u4rZNRsk/2wq/EoiThJ0aCRu32c3bK1Vs+HBomtxP2Y=";

    installPhase = ''
      runHook preInstall

      mkdir -p $out
      cp -r dist/* $out/

      runHook postInstall
    '';
  };

  website-devserver = pkgs.dockerTools.buildImage {
    name = "website-devserver";
    tag = "dev";

    copyToRoot = pkgs.buildEnv {
      name = "image-root";
      paths = with pkgs; [ nodejs coreutils bash ];
      pathsToLink = [ "/bin" ];
    };

    runAsRoot = ''
      mkdir -p /usr
      ln -s /bin /usr/bin
    '';

    config = {
      Cmd = [ "${pkgs.bash}/bin/bash" "-c" "npm install && npm start" ];
    };
  };
}
