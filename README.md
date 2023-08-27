# `unshorten.site` - URLs unshortener

This repository hosts source code of [unshorten.site](https://unshorten.site/) web-app and backend.

## Why ?

To learn how to build an industrialized web server in Rust with :
* tracing
* metrics
* access logs
* tests
* benchmarks (TODO)

**Deployments** and **builds** are made reproductible using [Docker](https://www.docker.com) and [Nix](https://www.nixos.org).

## Getting started

### Building the project

```shell
make server/docker/build website/build/website
```

### Running the tests

```shell
make server/tests
```

## Contributing

If you want to contribute to `unshorten.site` to add a feature or improve the code contact
me at [negrel.dev@protonmail.com](mailto:negrel.dev@protonmail.com), open an
[issue](https://github.com/negrel/unshorten.site/issues) or make a
[pull request](https://github.com/negrel/unshorten.site/pulls).

## :stars: Show your support

Please give a :star: if this project helped you!

[![buy me a coffee](.github/images/bmc-button.png)](https://www.buymeacoffee.com/negrel)

## :scroll: License

MIT © [Alexandre Negrel](https://www.negrel.dev/)
