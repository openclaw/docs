---
read_when:
    - Estás depurando las instalaciones de paquetes de plugins
    - Estás cambiando el comportamiento de inicio del plugin, de doctor o de instalación del gestor de paquetes
    - Mantienes instalaciones empaquetadas de OpenClaw o manifiestos de plugins incluidos.
sidebarTitle: Dependencies
summary: Cómo instala OpenClaw los paquetes de plugins y resuelve sus dependencias
title: Resolución de dependencias de Plugins
x-i18n:
    generated_at: "2026-07-11T23:17:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae24a82568e275399cb7b68729d2805956792852612f84d6918850305f0eb243
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw gestiona las dependencias de los plugins únicamente durante la instalación o actualización. La carga en tiempo de ejecución nunca ejecuta un gestor de paquetes, repara un árbol de dependencias ni modifica el directorio del paquete de OpenClaw.

## División de responsabilidades

Los paquetes de plugins son responsables de su grafo de dependencias:

- Las dependencias de tiempo de ejecución se incluyen en `dependencies` u `optionalDependencies` del paquete del plugin.
- Las importaciones del SDK o del núcleo son dependencias entre pares o importaciones proporcionadas por OpenClaw.
- Los plugins de desarrollo local aportan sus propias dependencias ya instaladas.
- Los plugins de npm y git se instalan en raíces de paquetes propiedad de OpenClaw.

OpenClaw solo es responsable del ciclo de vida del plugin:

- Detectar el origen del plugin.
- Instalar o actualizar el paquete cuando se solicite explícitamente.
- Registrar los metadatos de instalación.
- Cargar el punto de entrada del plugin.
- Fallar con un error que indique cómo actuar cuando falten dependencias.

## Raíces de instalación

OpenClaw utiliza raíces estables para cada origen:

- Los paquetes de npm se instalan en proyectos individuales por plugin bajo `~/.openclaw/npm/projects/<encoded-package>`.
- Los paquetes de git se clonan bajo `~/.openclaw/git`.
- Las instalaciones locales, por ruta o desde archivos se copian o se referencian sin reparar dependencias.

Las instalaciones de npm se ejecutan en la raíz del proyecto correspondiente al plugin con:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` utiliza la misma raíz de proyecto npm por plugin para un archivo tar npm-pack local: OpenClaw lee los metadatos npm del archivo tar, lo añade al proyecto gestionado como una dependencia `file:` copiada, ejecuta la instalación normal de npm indicada anteriormente y después verifica los metadatos del archivo de bloqueo instalado antes de confiar en el plugin. Esta ruta existe para las pruebas de aceptación de paquetes y de candidatos a lanzamiento, donde un artefacto empaquetado local debe comportarse como el artefacto del registro que simula.

Utilice `npm-pack:` al probar paquetes de plugins oficiales o externos antes de publicarlos. Una instalación desde un archivo sin procesar o una ruta resulta útil para la depuración local, pero no demuestra la misma ruta de dependencias que un paquete instalado desde npm o ClawHub. `npm-pack:` demuestra la estructura de instalación del paquete gestionado; por sí solo, no demuestra que el plugin sea contenido oficial vinculado al catálogo.

Cuando el comportamiento dependa del estado de plugin incluido o de plugin oficial de confianza, combine la prueba del paquete local con una instalación oficial respaldada por el catálogo o con una ruta de paquete publicado que registre la confianza oficial. El acceso a funciones auxiliares privilegiadas y la gestión del ámbito oficial de confianza deben validarse en esa ruta de instalación de confianza, no inferirse a partir de la instalación de un archivo tar local.

Si un plugin falla en tiempo de ejecución por una importación ausente, corrija el manifiesto del paquete en lugar de reparar manualmente el proyecto gestionado. Las importaciones de tiempo de ejecución deben incluirse en `dependencies` u `optionalDependencies` del paquete del plugin; las `devDependencies` no se instalan en los proyectos gestionados de tiempo de ejecución. Ejecutar localmente `npm install` dentro de `~/.openclaw/npm/projects/<encoded-package>` puede desbloquear un diagnóstico temporal, pero no constituye una prueba de aceptación del paquete, porque la siguiente instalación o actualización vuelve a crear el proyecto a partir de los metadatos del paquete.

npm puede elevar dependencias transitivas al directorio `node_modules` del proyecto por plugin, junto al paquete del plugin. OpenClaw examina la raíz del proyecto gestionado antes de confiar en la instalación y elimina ese proyecto al desinstalarlo, por lo que las dependencias de tiempo de ejecución elevadas permanecen dentro del límite de limpieza de ese plugin.

Los paquetes de plugins publicados en npm pueden incluir `npm-shrinkwrap.json`; npm utiliza ese archivo de bloqueo publicable durante la instalación y la raíz de proyecto npm gestionada por OpenClaw lo admite mediante la ruta de instalación normal. Los paquetes de plugins publicables propiedad de OpenClaw deben incluir un shrinkwrap local al paquete generado a partir del grafo de dependencias publicado de ese paquete:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

El generador elimina las `devDependencies` del plugin, aplica la política de anulaciones del espacio de trabajo y escribe `extensions/<id>/npm-shrinkwrap.json` para cada plugin con `openclaw.release.publishToNpm: true`. Los paquetes de plugins de terceros también pueden incluir un shrinkwrap; OpenClaw no lo exige para los paquetes de la comunidad, pero npm lo respeta cuando está presente.

Antes de considerar un paquete local como prueba de un candidato a lanzamiento, inspeccione el archivo tar que se instalará:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

Para los cambios de dependencias, verifique también que una instalación de producción pueda resolver los paquetes de tiempo de ejecución sin dependencias de desarrollo:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

Los paquetes de plugins npm propiedad de OpenClaw también pueden publicarse con `bundledDependencies` explícitas. La ruta de publicación de npm superpone la lista de nombres de dependencias de tiempo de ejecución, elimina del manifiesto publicado los metadatos del espacio de trabajo exclusivos del desarrollo, ejecuta una instalación de npm sin scripts para las dependencias de tiempo de ejecución locales al paquete y después empaqueta o publica el archivo tar del plugin con esos archivos de dependencias incluidos. Los paquetes con muchos componentes nativos (Codex, ACPX, Copilot, llama.cpp, memory-lancedb, Tlon) desactivan esta opción mediante `openclaw.release.bundleRuntimeDependencies: false`; aun así incluyen un shrinkwrap, pero npm resuelve las dependencias de tiempo de ejecución durante la instalación en lugar de incorporar todos los binarios de cada plataforma en el archivo tar del plugin. El paquete raíz `openclaw` no incluye todo su árbol de dependencias.

Los plugins que importan `openclaw/plugin-sdk/*` declaran `openclaw` como dependencia entre pares. OpenClaw no permite que npm instale en un proyecto gestionado una copia independiente del paquete anfitrión procedente del registro, porque un paquete anfitrión obsoleto puede afectar a la resolución de dependencias entre pares de npm dentro de ese plugin. Las instalaciones de npm gestionadas omiten la resolución y materialización de dependencias entre pares de npm, y OpenClaw vuelve a establecer los enlaces `node_modules/openclaw` locales al plugin para los paquetes instalados que declaran la dependencia entre pares del anfitrión, después de una instalación o actualización.

Las instalaciones desde git clonan o actualizan el repositorio y después ejecutan:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

El plugin instalado se carga entonces desde el directorio de ese paquete, por lo que la resolución mediante los directorios `node_modules` locales al paquete y superiores funciona igual que en un paquete Node normal.

## Plugins locales

Los plugins locales son directorios controlados por los desarrolladores. OpenClaw nunca ejecuta `npm install`, `pnpm install` ni una reparación de dependencias para ellos; si un plugin local tiene dependencias, instálelas en ese plugin antes de cargarlo.

Los plugins locales de terceros escritos en TypeScript se cargan mediante Jiti como ruta de emergencia. En cambio, los plugins JavaScript empaquetados y los plugins internos incluidos se cargan mediante importaciones nativas o `require`.

## Inicio y recarga

El inicio del Gateway y la recarga de la configuración nunca instalan dependencias de plugins. Leen los registros de instalación de los plugins, calculan el punto de entrada y lo cargan.

La ausencia de una dependencia en tiempo de ejecución provoca un error al cargar el plugin que indica al operador una corrección explícita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` limpia el estado de dependencias heredado generado por OpenClaw y puede recuperar plugins descargables ausentes de los registros de instalación locales cuando la configuración todavía hace referencia a ellos. Doctor no repara las dependencias de un plugin local ya instalado.

## Plugins incluidos

Los plugins incluidos ligeros y esenciales para el núcleo se distribuyen como parte de OpenClaw. No deben incluir un árbol pesado de dependencias de tiempo de ejecución o deben trasladarse a un paquete descargable en ClawHub/npm.

Para consultar la lista generada actual de plugins que se distribuyen en el paquete principal, se instalan externamente o permanecen únicamente en el código fuente, consulte el [inventario de plugins](/es/plugins/plugin-inventory).

Los manifiestos de los plugins incluidos no deben solicitar la preparación de dependencias. Las funcionalidades de plugins grandes u opcionales deben empaquetarse como un plugin normal e instalarse mediante la misma ruta de npm, git o ClawHub que los plugins de terceros.

En los repositorios de código fuente, OpenClaw trata el repositorio como un monorepositorio de pnpm. Después de `pnpm install`, los plugins incluidos se cargan desde `extensions/<id>`, de modo que las dependencias locales del espacio de trabajo estén disponibles y los cambios se apliquen directamente. El desarrollo desde un repositorio de código fuente solo admite pnpm; ejecutar simplemente `npm install` en la raíz del repositorio no prepara las dependencias de los plugins incluidos.

| Estructura de instalación        | Ubicación del plugin incluido          | Responsable de las dependencias                                         |
| -------------------------------- | -------------------------------------- | ----------------------------------------------------------------------- |
| `npm install -g openclaw`        | Árbol de ejecución compilado dentro del paquete | Paquete de OpenClaw y flujos explícitos de instalación, actualización y Doctor de plugins |
| Repositorio git más `pnpm install` | Paquetes del espacio de trabajo `extensions/<id>` | El espacio de trabajo de pnpm, incluidas las dependencias propias de cada paquete de plugin |
| `openclaw plugins install ...`   | Raíz gestionada de proyecto npm, git o ClawHub | El flujo de instalación y actualización del plugin                      |

## Limpieza del estado heredado

Las versiones anteriores de OpenClaw generaban raíces de dependencias para plugins incluidos durante el inicio o durante una reparación de Doctor. La limpieza actual de Doctor elimina esos directorios y enlaces simbólicos obsoletos con `--fix`, incluidas las raíces antiguas `plugin-runtime-deps`, los enlaces simbólicos globales de paquetes del prefijo de Node que apuntan a destinos `plugin-runtime-deps` eliminados, los manifiestos `.openclaw-runtime-deps*`, los directorios `node_modules` de plugins generados, los directorios de preparación de la instalación y los almacenes pnpm locales al paquete. El script posterior a la instalación del paquete también elimina esos enlaces simbólicos globales antes de depurar las raíces de destino heredadas, para que las actualizaciones no dejen importaciones de paquetes ESM sin destino.

Las instalaciones anteriores de npm también utilizaban una raíz compartida `~/.openclaw/npm/node_modules`. Los flujos actuales de instalación, actualización, desinstalación y Doctor todavía reconocen esa raíz plana heredada únicamente para su recuperación y limpieza. Las nuevas instalaciones de npm crean en su lugar raíces de proyecto individuales por plugin.
