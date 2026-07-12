---
read_when:
    - Quieres saber qué significa npm shrinkwrap en una versión de OpenClaw
    - Estás revisando archivos de bloqueo de paquetes, cambios en las dependencias o riesgos de la cadena de suministro
    - Estás validando paquetes npm raíz o de plugins antes de publicarlos
summary: Explicación sencilla y técnica del archivo shrinkwrap de npm en las versiones de OpenClaw
title: shrinkwrap de npm
x-i18n:
    generated_at: "2026-07-11T23:08:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1e6c0d4541da9220d50cde0b9db064e5a91b81d6562cb16ac697de7d4017098
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

Los repositorios de código fuente de OpenClaw usan `pnpm-lock.yaml`. Los paquetes npm publicados de OpenClaw usan `npm-shrinkwrap.json`, el archivo de bloqueo de dependencias publicable de npm, para que las instalaciones de paquetes utilicen el grafo de dependencias revisado durante el lanzamiento.

## Por qué es importante

Shrinkwrap es un comprobante del árbol de dependencias que se distribuye con un paquete npm: indica a npm qué versiones transitivas exactas debe instalar.

| Archivo               | Dónde es importante                  | Qué significa                                  |
| --------------------- | ------------------------------------ | ---------------------------------------------- |
| `pnpm-lock.yaml`      | Repositorio de código fuente de OpenClaw | Grafo de dependencias de los mantenedores      |
| `npm-shrinkwrap.json` | Paquete npm publicado                | Grafo de instalación de npm para los usuarios  |
| `package-lock.json`   | Aplicaciones npm locales             | No es el contrato de publicación de OpenClaw   |

Para los lanzamientos de OpenClaw, esto significa:

- el paquete publicado no pide a npm que genere un nuevo grafo de dependencias durante la instalación;
- los cambios de dependencias se pueden revisar porque aparecen en la diferencia de un archivo de bloqueo;
- la validación del lanzamiento prueba el mismo grafo que instalarán los usuarios;
- las sorpresas relacionadas con el tamaño del paquete o las dependencias nativas salen a la luz antes de la publicación.

Shrinkwrap no es un entorno aislado. No hace que una dependencia sea segura por sí solo ni sustituye el aislamiento del host, `openclaw security audit`, la procedencia de los paquetes ni las pruebas básicas de instalación.

OpenClaw es un Gateway, un host de plugins, un enrutador de modelos y un entorno de ejecución de agentes, por lo que una instalación predeterminada afecta al tiempo de inicio, el uso del disco, las descargas de paquetes nativos y la exposición a la cadena de suministro. Shrinkwrap proporciona a la revisión del lanzamiento un límite estable: los revisores ven los cambios en las dependencias transitivas, los validadores rechazan desviaciones inesperadas del archivo de bloqueo y los paquetes de plugins incluyen su propio grafo de dependencias bloqueado en lugar de depender del paquete raíz.

## Generación y comprobación

El paquete npm raíz `openclaw`, los paquetes npm de plugins propiedad de OpenClaw (por ejemplo, `@openclaw/discord`) y los paquetes publicables del espacio de trabajo, como [`@openclaw/ai`](/es/reference/openclaw-ai), incluyen `npm-shrinkwrap.json` cuando se publican. Las dependencias del espacio de trabajo se omiten del shrinkwrap raíz porque se publican junto con el paquete raíz; en su lugar, cada paquete publicable del espacio de trabajo fija su propio árbol transitivo. Los paquetes de plugins adecuados también pueden publicarse con `bundledDependencies` explícitas, incluyendo sus archivos de dependencias de ejecución en el archivo tar del plugin en vez de depender únicamente de la resolución durante la instalación.

```bash
# Todos los paquetes gestionados mediante shrinkwrap (raíz + plugins publicables)
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check

# Solo el paquete raíz
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check

# Solo los paquetes afectados por el conjunto de cambios actual
pnpm deps:shrinkwrap:changed:generate
pnpm deps:shrinkwrap:changed:check
```

El generador resuelve el formato de bloqueo publicable de npm, pero rechaza las versiones de paquetes generadas que aún no estén presentes en `pnpm-lock.yaml`. Esto mantiene intactos los límites de revisión de antigüedad, sustituciones y parches de las dependencias de pnpm.

Revise los siguientes elementos como sensibles para la seguridad:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- las cargas útiles de dependencias incluidas en los plugins
- cualquier diferencia de `package-lock.json`

Los validadores de paquetes de OpenClaw exigen shrinkwrap en los nuevos archivos tar del paquete raíz y rechazan `package-lock.json` para los paquetes publicados. La ruta de publicación npm de plugins comprueba el shrinkwrap local del plugin, instala las dependencias incluidas locales del paquete y, a continuación, empaqueta o publica.

## Inspección de un paquete publicado

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

Información general: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
