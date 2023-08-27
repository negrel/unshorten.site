{ pkgs, ... }:

rec {
  website = pkgs.buildNpmPackage {
    name = "unshorten.site";

    buildInputs = with pkgs; [
      nodejs
    ];

    src = ./.;
    npmDepsHash = "sha256-5eoAU3BPGvSQmMEjWnEjkjAZso4HYjhRY8U1p0R80To";

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
}
