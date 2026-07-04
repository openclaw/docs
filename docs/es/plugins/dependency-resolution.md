---
read_when:
    - Estás depurando instalaciones de paquetes de Plugin
    - Estás cambiando el comportamiento de arranque de plugins, doctor o instalación del gestor de paquetes
    - Mantienes instalaciones empaquetadas de OpenClaw o manifiestos de Plugin incluidos
sidebarTitle: Dependencies
summary: Cómo OpenClaw instala paquetes de plugins y resuelve dependencias de plugins
title: Resolución de dependencias de Plugin
x-i18n:
    generated_at: "2026-07-04T15:08:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc6cc80bfe4e4c06ca0e99877c0d4148861ff88366ae233c254aac56c7cdf6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw mantiene el trabajo de dependencias de plugins en el momento de instalación/actualización. La carga en tiempo de ejecución
no ejecuta gestores de paquetes, repara árboles de dependencias ni muta el directorio de paquetes de OpenClaw.

## División de responsabilidades

Los paquetes de plugins son dueños de su grafo de dependencias:

- las dependencias de tiempo de ejecución viven en `dependencies` u
  `optionalDependencies` del paquete de Plugin
- las importaciones de SDK/núcleo son peer o importaciones suministradas por OpenClaw
- los plugins de desarrollo local traen sus propias dependencias ya instaladas
- los plugins de npm y git se instalan en raíces de paquetes propiedad de OpenClaw

OpenClaw solo es dueño del ciclo de vida del plugin:

- descubrir el origen del Plugin
- instalar o actualizar el paquete cuando se solicite explícitamente
- registrar los metadatos de instalación
- cargar el punto de entrada del Plugin
- fallar con un error accionable cuando falten dependencias

## Raíces de instalación

OpenClaw usa raíces estables por origen:

- los paquetes npm se instalan en proyectos por Plugin bajo
  `~/.openclaw/npm/projects/<encoded-package>`
- los paquetes git se clonan bajo `~/.openclaw/git`
- las instalaciones locales/por ruta/archivo se copian o referencian sin reparación de dependencias

Las instalaciones npm se ejecutan en esa raíz de proyecto por Plugin con:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` usa esa misma raíz de proyecto npm
por Plugin para un tarball npm-pack local. OpenClaw lee los metadatos npm del tarball,
lo agrega al proyecto gestionado como una dependencia `file:` copiada, ejecuta
la instalación npm normal y luego verifica los metadatos del lockfile instalado antes de
confiar en el Plugin.
Esto está pensado para pruebas de aceptación de paquetes y candidatos de lanzamiento donde un
artefacto pack local debe comportarse como el artefacto de registro que simula.

Usa `npm-pack:` al probar paquetes de plugins oficiales o externos antes de
publicar. Una instalación de archivo o ruta sin procesar es útil para la depuración local, pero
no prueba la misma ruta de dependencias que un paquete npm o ClawHub instalado.
`npm-pack:` prueba la forma de instalación de paquete gestionado; no es, por sí solo,
prueba de que el Plugin sea contenido oficial enlazado al catálogo.

Cuando el comportamiento dependa del estado de Plugin incluido o de Plugin oficial de confianza, combina
la prueba de paquete local con una instalación oficial respaldada por catálogo o una ruta de
paquete publicado que registre confianza oficial. El acceso a ayudantes privilegiados y el
manejo de alcance oficial de confianza deben validarse en esa ruta de instalación de confianza,
no inferirse de una instalación de tarball local.

Si un Plugin falla en tiempo de ejecución con una importación faltante, corrige el manifiesto del paquete
en lugar de reparar el proyecto gestionado a mano. Las importaciones de tiempo de ejecución pertenecen a
`dependencies` u `optionalDependencies` del paquete de Plugin; `devDependencies` no se
instalan para proyectos de tiempo de ejecución gestionados. Un `npm install` local dentro de
`~/.openclaw/npm/projects/<encoded-package>` puede desbloquear un diagnóstico temporal,
pero no es prueba de aceptación de paquete porque la siguiente instalación o actualización
recreará el proyecto a partir de los metadatos del paquete.

npm puede elevar dependencias transitivas al `node_modules` del proyecto
por Plugin junto al paquete de Plugin. OpenClaw escanea la raíz del proyecto gestionado
antes de confiar en la instalación y elimina ese proyecto durante la desinstalación, por lo que
las dependencias de tiempo de ejecución elevadas permanecen dentro del límite de limpieza de ese Plugin.

Los paquetes de plugins npm publicados pueden incluir `npm-shrinkwrap.json`. npm usa ese
lockfile publicable durante la instalación, y la raíz del proyecto npm gestionado por OpenClaw
lo admite mediante la ruta normal de instalación npm. Los paquetes de plugins publicables
propiedad de OpenClaw deben incluir un shrinkwrap local al paquete generado a partir del
grafo de dependencias publicado de ese paquete de Plugin:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

El generador elimina `devDependencies` del Plugin, aplica la política de overrides del workspace
y escribe `extensions/<id>/npm-shrinkwrap.json` para cada Plugin
`publishToNpm`. Los paquetes de plugins de terceros también pueden incluir shrinkwrap;
OpenClaw no lo exige para paquetes comunitarios, pero npm lo respetará
cuando esté presente.

Antes de tratar un paquete local como prueba de candidato de lanzamiento, inspecciona el tarball
que se instalará:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

Para cambios de dependencias, verifica también que una instalación de producción pueda resolver los
paquetes de tiempo de ejecución sin dependencias de desarrollo:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

Los paquetes de plugins npm propiedad de OpenClaw también pueden publicar con
`bundledDependencies` explícitas. La ruta de publicación npm superpone la lista de nombres de
dependencias de tiempo de ejecución, elimina del manifiesto del paquete publicado los metadatos de workspace
solo de desarrollo, ejecuta una instalación npm sin scripts para las dependencias de tiempo de ejecución
locales al paquete y luego empaqueta o publica el tarball del Plugin con esos archivos de
dependencias incluidos. Los paquetes con muchas dependencias nativas, incluidos los tiempos de ejecución
de Codex y ACP, optan por no participar con `openclaw.release.bundleRuntimeDependencies: false`;
esos paquetes siguen enviando su shrinkwrap, pero npm resuelve las dependencias de tiempo de ejecución durante la instalación
en lugar de incrustar cada binario de plataforma en el tarball del Plugin. El paquete raíz
`openclaw` no incluye todo su árbol de dependencias.

Los plugins que importan `openclaw/plugin-sdk/*` declaran `openclaw` como dependencia peer.
OpenClaw no permite que npm instale una copia separada del registro del paquete
host en un proyecto gestionado, porque los paquetes host obsoletos pueden afectar la resolución de peers de npm
dentro de ese Plugin. Las instalaciones npm gestionadas omiten la resolución/materialización de peers de npm
y OpenClaw reafirma enlaces `node_modules/openclaw` locales al Plugin
para los paquetes instalados que declaran el peer host después de la instalación o actualización.

Las instalaciones git clonan o actualizan el repositorio y luego ejecutan:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

El Plugin instalado luego se carga desde ese directorio de paquete, por lo que la resolución de
`node_modules` local al paquete y padre funciona igual que para un paquete Node normal.

## Plugins locales

Los plugins locales se tratan como directorios controlados por el desarrollador. OpenClaw no
ejecuta `npm install`, `pnpm install` ni reparación de dependencias para ellos. Si un Plugin
local tiene dependencias, instálalas en ese Plugin antes de cargarlo.

Los plugins locales TypeScript de terceros pueden usar la ruta de emergencia Jiti. Los plugins
JavaScript empaquetados y los plugins internos incluidos se cargan mediante
import/require nativo en lugar de Jiti.

## Inicio y recarga

El inicio de Gateway y la recarga de configuración nunca instalan dependencias de plugins. Leen
los registros de instalación del Plugin, calculan el punto de entrada y lo cargan.

Si falta una dependencia en tiempo de ejecución, el Plugin no se carga y el error
debe indicar al operador una corrección explícita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` puede limpiar estado de dependencias heredado generado por OpenClaw y recuperar
plugins descargables que falten en los registros de instalación locales cuando la configuración
los referencia. Doctor no repara dependencias de un Plugin local ya instalado.

## Plugins incluidos

Los plugins incluidos ligeros y críticos para el núcleo se envían como parte de OpenClaw.
Deben no tener un árbol pesado de dependencias de tiempo de ejecución o moverse a un
paquete descargable en ClawHub/npm.

Para la lista generada actual de plugins que se envían en el paquete central, se instalan
externamente o permanecen solo como fuente, consulta [Inventario de plugins](/es/plugins/plugin-inventory).

Los manifiestos de plugins incluidos no deben solicitar preparación de dependencias. La funcionalidad de Plugin
grande u opcional debe empaquetarse como un Plugin normal e instalarse mediante
la misma ruta npm/git/ClawHub que los plugins de terceros.

En checkouts de código fuente, OpenClaw trata el repositorio como un monorepo pnpm. Después de
`pnpm install`, los plugins incluidos se cargan desde `extensions/<id>` para que las dependencias de workspace
locales al paquete estén disponibles y las ediciones se recojan directamente. El desarrollo en checkout
de código fuente es solo pnpm; `npm install` simple en la raíz del repositorio no es
una forma admitida de preparar dependencias de plugins incluidos.

| Forma de instalación             | Ubicación del Plugin incluido         | Propietario de dependencias                                           |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Árbol de tiempo de ejecución compilado dentro del paquete | Paquete OpenClaw y flujos explícitos de instalación/actualización/doctor de plugins |
| Checkout git más `pnpm install` | Paquetes de workspace `extensions/<id>` | El workspace pnpm, incluidas las dependencias propias de cada paquete de Plugin |
| `openclaw plugins install ...`   | Raíz gestionada de proyecto npm/git/ClawHub | El flujo de instalación/actualización del Plugin                     |

## Limpieza heredada

Las versiones anteriores de OpenClaw generaban raíces de dependencias de plugins incluidos al inicio o
durante la reparación de doctor. La limpieza actual de doctor elimina esos directorios y
symlinks obsoletos cuando se usa `--fix`, incluidas las raíces antiguas `plugin-runtime-deps`, symlinks
de paquetes de prefijo global de Node que apuntan a destinos `plugin-runtime-deps` podados,
manifiestos `.openclaw-runtime-deps*`, `node_modules` de plugins generados, directorios de
etapa de instalación y almacenes pnpm locales al paquete. El postinstall empaquetado también
elimina esos symlinks globales antes de podar las raíces de destino heredadas para que las actualizaciones
no dejen importaciones de paquetes ESM colgantes.

Las instalaciones npm más antiguas también usaban una raíz compartida `~/.openclaw/npm/node_modules`.
Los flujos actuales de instalación, actualización, desinstalación y doctor todavía reconocen esa raíz plana
heredada solo para recuperación y limpieza. Las nuevas instalaciones npm deben crear
raíces de proyecto por Plugin en su lugar.
