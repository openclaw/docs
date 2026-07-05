---
read_when:
    - Estás depurando instalaciones de paquetes de plugins
    - Estás cambiando el comportamiento de inicio de Plugin, doctor o instalación del gestor de paquetes
    - Mantienes instalaciones empaquetadas de OpenClaw o manifiestos de Plugin incluidos
sidebarTitle: Dependencies
summary: Cómo OpenClaw instala paquetes de Plugin y resuelve dependencias de Plugin
title: Resolución de dependencias de Plugin
x-i18n:
    generated_at: "2026-07-05T11:31:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae24a82568e275399cb7b68729d2805956792852612f84d6918850305f0eb243
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw gestiona las dependencias de plugins solo durante la instalación/actualización. La carga en tiempo de ejecución nunca ejecuta un gestor de paquetes, repara un árbol de dependencias ni muta el directorio del paquete de OpenClaw.

## División de responsabilidades

Los paquetes de plugins son propietarios de su grafo de dependencias:

- Las dependencias de tiempo de ejecución viven en `dependencies` u
  `optionalDependencies` del paquete del plugin.
- Las importaciones del SDK/núcleo son importaciones peer o suministradas por OpenClaw.
- Los plugins de desarrollo local traen sus propias dependencias ya instaladas.
- Los plugins de npm y git se instalan en raíces de paquetes propiedad de OpenClaw.

OpenClaw solo es propietario del ciclo de vida del plugin:

- Descubrir el origen del plugin.
- Instalar o actualizar el paquete cuando se solicite explícitamente.
- Registrar los metadatos de instalación.
- Cargar el punto de entrada del plugin.
- Fallar con un error accionable cuando falten dependencias.

## Raíces de instalación

OpenClaw usa raíces estables por origen:

- Los paquetes npm se instalan en proyectos por plugin bajo
  `~/.openclaw/npm/projects/<encoded-package>`.
- Los paquetes git se clonan bajo `~/.openclaw/git`.
- Las instalaciones locales/de ruta/de archivo se copian o referencian sin
  reparación de dependencias.

Las instalaciones npm se ejecutan en esa raíz de proyecto por plugin con:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` usa la misma raíz de proyecto npm
por plugin para un tarball npm-pack local: OpenClaw lee los metadatos npm del
tarball, lo agrega al proyecto gestionado como una dependencia `file:` copiada,
ejecuta la instalación npm normal anterior y luego verifica los metadatos del
lockfile instalado antes de confiar en el plugin. Esta ruta existe para la prueba
de aceptación de paquetes y de candidatos de lanzamiento, donde un artefacto pack
local debe comportarse como el artefacto de registro que simula.

Usa `npm-pack:` al probar paquetes de plugins oficiales o externos antes de
publicarlos. Una instalación desde archivo sin procesar o ruta es útil para
depuración local, pero no prueba la misma ruta de dependencias que un paquete npm
o ClawHub instalado. `npm-pack:` prueba la forma de instalación del paquete
gestionado; por sí sola, no es prueba de que el plugin sea contenido oficial
vinculado al catálogo.

Cuando el comportamiento dependa del estado de plugin incluido o plugin oficial
de confianza, combina la prueba del paquete local con una instalación oficial
respaldada por catálogo o una ruta de paquete publicado que registre la confianza
oficial. El acceso a ayudantes privilegiados y el manejo de alcance oficial de
confianza deben validarse en esa ruta de instalación de confianza, no inferirse
de una instalación de tarball local.

Si un plugin falla en tiempo de ejecución por una importación faltante, corrige
el manifiesto del paquete en lugar de reparar manualmente el proyecto gestionado.
Las importaciones de tiempo de ejecución pertenecen a `dependencies` u
`optionalDependencies` del paquete del plugin; `devDependencies` no se instalan
para proyectos de tiempo de ejecución gestionados. Un `npm install` local dentro
de `~/.openclaw/npm/projects/<encoded-package>` puede desbloquear un diagnóstico
temporal, pero no es prueba de aceptación de paquetes porque la siguiente
instalación o actualización vuelve a crear el proyecto desde los metadatos del
paquete.

npm puede elevar dependencias transitivas al `node_modules` del proyecto por
plugin junto al paquete del plugin. OpenClaw escanea la raíz del proyecto
gestionado antes de confiar en la instalación y elimina ese proyecto al
desinstalar, por lo que las dependencias de tiempo de ejecución elevadas
permanecen dentro del límite de limpieza de ese plugin.

Los paquetes npm de plugins publicados pueden incluir `npm-shrinkwrap.json`; npm
usa ese lockfile publicable durante la instalación, y la raíz de proyecto npm
gestionada por OpenClaw lo admite mediante la ruta de instalación normal. Los
paquetes de plugins publicables propiedad de OpenClaw deben incluir un shrinkwrap
local al paquete generado desde el grafo de dependencias publicado de ese paquete:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

El generador elimina `devDependencies` del plugin, aplica la política de
sobrescrituras del workspace y escribe `extensions/<id>/npm-shrinkwrap.json` para
cada plugin con `openclaw.release.publishToNpm: true`. Los paquetes de plugins de
terceros también pueden incluir un shrinkwrap; OpenClaw no exige uno para
paquetes de la comunidad, pero npm lo respeta cuando está presente.

Antes de tratar un paquete local como prueba de candidato de lanzamiento,
inspecciona el tarball que se instalará:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

Para cambios de dependencias, verifica también que una instalación de producción
pueda resolver los paquetes de tiempo de ejecución sin dependencias de desarrollo:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

Los paquetes npm de plugins propiedad de OpenClaw también pueden publicarse con
`bundledDependencies` explícitas. La ruta de publicación npm superpone la lista
de nombres de dependencias de tiempo de ejecución, elimina metadatos de workspace
solo de desarrollo del manifiesto publicado, ejecuta una instalación npm sin
scripts para las dependencias de tiempo de ejecución locales al paquete y luego
empaqueta o publica el tarball del plugin con esos archivos de dependencias
incluidos. Los paquetes con mucho código nativo (Codex, ACPX, Copilot, llama.cpp,
memory-lancedb, Tlon) optan por no hacerlo con
`openclaw.release.bundleRuntimeDependencies: false`; siguen incluyendo un
shrinkwrap, pero npm resuelve las dependencias de tiempo de ejecución durante la
instalación en lugar de incrustar cada binario de plataforma en el tarball del
plugin. El paquete raíz `openclaw` no incluye todo su árbol de dependencias.

Los plugins que importan `openclaw/plugin-sdk/*` declaran `openclaw` como
dependencia peer. OpenClaw no permite que npm instale una copia separada del
paquete host desde el registro en un proyecto gestionado, porque un paquete host
obsoleto puede afectar la resolución peer de npm dentro de ese plugin. Las
instalaciones npm gestionadas omiten la resolución/materialización peer de npm, y
OpenClaw reafirma los enlaces `node_modules/openclaw` locales al plugin para
paquetes instalados que declaran el peer del host, después de instalar o
actualizar.

Las instalaciones git clonan o refrescan el repositorio y luego ejecutan:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

El plugin instalado se carga entonces desde ese directorio de paquete, por lo que
la resolución de `node_modules` local al paquete y padre funciona igual que para
un paquete Node normal.

## Plugins locales

Los plugins locales son directorios controlados por el desarrollador. OpenClaw
nunca ejecuta `npm install`, `pnpm install` ni reparación de dependencias para
ellos; si un plugin local tiene dependencias, instálalas en ese plugin antes de
cargarlo.

Los plugins locales TypeScript de terceros se cargan mediante Jiti como ruta de
emergencia. Los plugins JavaScript empaquetados y los plugins internos incluidos
se cargan mediante import/require nativo en su lugar.

## Inicio y recarga

El inicio del Gateway y la recarga de configuración nunca instalan dependencias
de plugins. Leen los registros de instalación del plugin, calculan el punto de
entrada y lo cargan.

Una dependencia faltante en tiempo de ejecución hace fallar la carga del plugin
con un error que indica al operador una corrección explícita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` limpia el estado de dependencias heredado generado por OpenClaw y
puede recuperar plugins descargables que faltan en los registros de instalación
locales cuando la configuración todavía los referencia. Doctor no repara
dependencias de un plugin local ya instalado.

## Plugins incluidos

Los plugins incluidos ligeros y críticos para el núcleo se distribuyen como parte
de OpenClaw. Deben no llevar un árbol pesado de dependencias de tiempo de
ejecución, o moverse a un paquete descargable en ClawHub/npm.

Para la lista generada actual de plugins que se distribuyen en el paquete del
núcleo, se instalan externamente o permanecen solo como código fuente, consulta
[Inventario de plugins](/es/plugins/plugin-inventory).

Los manifiestos de plugins incluidos no deben solicitar preparación de
dependencias. La funcionalidad de plugin grande u opcional debe empaquetarse como
un plugin normal e instalarse mediante la misma ruta npm/git/ClawHub que los
plugins de terceros.

En checkouts de código fuente, OpenClaw trata el repositorio como un monorepo
pnpm. Después de `pnpm install`, los plugins incluidos se cargan desde
`extensions/<id>` para que las dependencias de workspace locales al paquete estén
disponibles y las ediciones se recojan directamente. El desarrollo en checkout de
código fuente es solo con pnpm; un `npm install` simple en la raíz del repositorio
no prepara las dependencias de plugins incluidos.

| Forma de instalación             | Ubicación del plugin incluido         | Propietario de dependencias                                           |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Árbol de runtime compilado dentro del paquete | Paquete OpenClaw y flujos explícitos de instalación/actualización/doctor de plugins |
| Checkout git más `pnpm install` | Paquetes de workspace `extensions/<id>` | El workspace pnpm, incluidas las dependencias propias de cada paquete de plugin |
| `openclaw plugins install ...`   | Raíz gestionada de proyecto npm/git/ClawHub | El flujo de instalación/actualización del plugin                    |

## Limpieza heredada

Las versiones antiguas de OpenClaw generaban raíces de dependencias de plugins
incluidos al inicio o durante la reparación de doctor. La limpieza actual de
doctor elimina esos directorios y symlinks obsoletos con `--fix`, incluidas
raíces antiguas `plugin-runtime-deps`, symlinks de paquetes de prefijo global de
Node que apuntan a objetivos `plugin-runtime-deps` podados, manifiestos
`.openclaw-runtime-deps*`, `node_modules` de plugins generados, directorios de
etapa de instalación y stores pnpm locales al paquete. El postinstall empaquetado
también elimina esos symlinks globales antes de podar las raíces objetivo
heredadas, por lo que las actualizaciones no dejan importaciones de paquetes ESM
colgantes.

Las instalaciones npm antiguas también usaban una raíz compartida
`~/.openclaw/npm/node_modules`. Los flujos actuales de instalación,
actualización, desinstalación y doctor todavía reconocen esa raíz plana heredada
solo para recuperación y limpieza. Las nuevas instalaciones npm crean raíces de
proyecto por plugin en su lugar.
