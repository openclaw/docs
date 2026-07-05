---
read_when:
    - Quieres saber qué significa npm shrinkwrap en una versión de OpenClaw
    - Estás revisando archivos de bloqueo de paquetes, cambios de dependencias o riesgos de la cadena de suministro
    - Estás validando paquetes npm raíz o de Plugin antes de publicarlos
summary: Explicación técnica y en lenguaje sencillo de npm shrinkwrap en las versiones de OpenClaw
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-07-05T11:22:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1e6c0d4541da9220d50cde0b9db064e5a91b81d6562cb16ac697de7d4017098
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

OpenClaw source checkouts usan `pnpm-lock.yaml`. Los paquetes npm publicados de OpenClaw usan `npm-shrinkwrap.json`, el lockfile de dependencias publicable de npm, para que las instalaciones de paquetes usen el grafo de dependencias revisado durante la release.

## Por qué importa

Shrinkwrap es un recibo del árbol de dependencias que se distribuye con un paquete npm: le indica a npm qué versiones transitivas exactas instalar.

| Archivo               | Dónde importa           | Qué significa                         |
| --------------------- | ----------------------- | ------------------------------------- |
| `pnpm-lock.yaml`      | Checkout fuente de OpenClaw | Grafo de dependencias del mantenedor |
| `npm-shrinkwrap.json` | Paquete npm publicado   | Grafo de instalación npm para usuarios |
| `package-lock.json`   | Apps npm locales        | No es el contrato de publicación de OpenClaw |

Para las releases de OpenClaw, esto significa:

- el paquete publicado no le pide a npm que invente un grafo de dependencias nuevo en el momento de la instalación;
- los cambios de dependencias son revisables porque aterrizan en una diff de lockfile;
- la validación de release prueba el mismo grafo que instalarán los usuarios;
- las sorpresas de tamaño de paquete o dependencias nativas aparecen antes de publicar.

Shrinkwrap no es un sandbox. No hace que una dependencia sea segura por sí sola, y no reemplaza el aislamiento del host, `openclaw security audit`, la procedencia del paquete ni las pruebas smoke de instalación.

OpenClaw es un gateway, host de plugins, enrutador de modelos y runtime de agentes, por lo que una instalación predeterminada afecta el tiempo de arranque, el uso de disco, las descargas de paquetes nativos y la exposición de la cadena de suministro. Shrinkwrap da a la revisión de release un límite estable: los revisores ven el movimiento de dependencias transitivas, los validadores rechazan desviaciones inesperadas del lockfile y los paquetes de plugins llevan su propio grafo de dependencias bloqueado en lugar de depender del paquete raíz.

## Generación y comprobación

El paquete npm raíz `openclaw`, los paquetes de plugins npm propiedad de OpenClaw (por ejemplo, `@openclaw/discord`) y los paquetes publicables del workspace como [`@openclaw/ai`](/reference/openclaw-ai) incluyen `npm-shrinkwrap.json` cuando se publican. Las dependencias de workspace se omiten del shrinkwrap raíz porque se publican junto al paquete raíz; en su lugar, cada paquete publicable del workspace fija su propio árbol transitivo. Los paquetes de plugins adecuados también pueden publicarse con `bundledDependencies` explícitas, llevando sus archivos de dependencias de runtime en el tarball del plugin en lugar de depender solo de la resolución en tiempo de instalación.

```bash
# All shrinkwrap-managed packages (root + publishable plugins)
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check

# Root package only
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check

# Only packages affected by the current changeset
pnpm deps:shrinkwrap:changed:generate
pnpm deps:shrinkwrap:changed:check
```

El generador resuelve el formato de lock publicable de npm, pero rechaza las versiones de paquetes generadas que no estén ya presentes en `pnpm-lock.yaml`. Eso mantiene intacto el límite de antigüedad, override y revisión de parches de dependencias de pnpm.

Revisa estos como sensibles para la seguridad:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- cargas de dependencias de plugins empaquetados
- cualquier diff de `package-lock.json`

Los validadores de paquetes de OpenClaw requieren shrinkwrap en los tarballs nuevos del paquete raíz y rechazan `package-lock.json` para paquetes publicados. La ruta de publicación npm de plugins comprueba el shrinkwrap local del plugin, instala las dependencias empaquetadas locales del paquete y luego empaqueta o publica.

## Inspeccionar un paquete publicado

Paquete raíz:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

Paquete de plugin:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

Contexto: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
