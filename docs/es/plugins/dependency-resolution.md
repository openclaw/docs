---
read_when:
    - Estás depurando instalaciones de paquetes de Plugin
    - Estás cambiando el comportamiento de inicio, doctor o instalación del gestor de paquetes del Plugin
    - Mantienes instalaciones empaquetadas de OpenClaw o manifiestos de plugins incluidos
sidebarTitle: Dependencies
summary: Cómo OpenClaw instala paquetes de Plugin y resuelve dependencias de Plugin
title: Resolución de dependencias de Plugin
x-i18n:
    generated_at: "2026-06-27T12:12:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5d2f3efe40c50433bd44961f6f5b8d03f3c69d3f5112163613b8efbd0f17c65
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw mantiene el trabajo de dependencias de plugins en el momento de instalación/actualización. La carga en tiempo de ejecución
no ejecuta gestores de paquetes, no repara árboles de dependencias ni modifica el directorio de paquetes de OpenClaw.

## División de responsabilidades

Los paquetes de plugins son propietarios de su grafo de dependencias:

- las dependencias de tiempo de ejecución viven en `dependencies` u
  `optionalDependencies` del paquete del plugin
- las importaciones de SDK/núcleo son pares o importaciones suministradas por OpenClaw
- los plugins de desarrollo local traen sus propias dependencias ya instaladas
- los plugins de npm y git se instalan en raíces de paquetes propiedad de OpenClaw

OpenClaw solo es propietario del ciclo de vida del plugin:

- descubrir el origen del plugin
- instalar o actualizar el paquete cuando se solicite explícitamente
- registrar los metadatos de instalación
- cargar el punto de entrada del plugin
- fallar con un error accionable cuando falten dependencias

## Raíces de instalación

OpenClaw usa raíces estables por origen:

- los paquetes de npm se instalan en proyectos por plugin bajo
  `~/.openclaw/npm/projects/<encoded-package>`
- los paquetes de git se clonan bajo `~/.openclaw/git`
- las instalaciones locales/de ruta/de archivo comprimido se copian o referencian sin reparación de dependencias

Las instalaciones de npm se ejecutan en esa raíz de proyecto por plugin con:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` usa esa misma raíz de proyecto npm
por plugin para un tarball local npm-pack. OpenClaw lee los metadatos npm del tarball,
lo añade al proyecto gestionado como una dependencia `file:` copiada, ejecuta
la instalación normal de npm y luego verifica los metadatos del lockfile instalado antes
de confiar en el plugin.
Esto está pensado para pruebas de aceptación de paquetes y de candidatos de lanzamiento, donde un
artefacto pack local debe comportarse como el artefacto de registro que simula.

npm puede elevar dependencias transitivas al `node_modules` del proyecto por plugin
junto al paquete del plugin. OpenClaw escanea la raíz del proyecto gestionado
antes de confiar en la instalación y elimina ese proyecto durante la desinstalación, por lo que
las dependencias de tiempo de ejecución elevadas permanecen dentro del límite de limpieza de ese plugin.

Los paquetes de plugins npm publicados pueden enviar `npm-shrinkwrap.json`. npm usa ese
lockfile publicable durante la instalación, y la raíz de proyecto npm gestionada por OpenClaw
lo admite mediante la ruta normal de instalación de npm. Los paquetes de plugins publicables
propiedad de OpenClaw deben incluir un shrinkwrap local del paquete generado a partir del
grafo de dependencias publicado de ese paquete de plugin:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

El generador elimina las `devDependencies` del plugin, aplica la política de sobrescritura
del workspace y escribe `extensions/<id>/npm-shrinkwrap.json` para cada plugin
`publishToNpm`. Los paquetes de plugins de terceros también pueden enviar shrinkwrap;
OpenClaw no lo exige para paquetes de la comunidad, pero npm lo respetará
cuando esté presente.

Los paquetes de plugins npm propiedad de OpenClaw también pueden publicar con
`bundledDependencies` explícitas. La ruta de publicación de npm superpone la lista de nombres
de dependencias de tiempo de ejecución, elimina del manifiesto del paquete publicado los metadatos
de workspace solo de desarrollo, ejecuta una instalación npm sin scripts para las dependencias
de tiempo de ejecución locales del paquete y luego empaqueta o publica el tarball del plugin con esos archivos
de dependencias incluidos. Los paquetes con mucha carga nativa, incluidos los tiempos de ejecución de Codex y ACP,
optan por no participar con `openclaw.release.bundleRuntimeDependencies: false`; esos paquetes siguen
enviando su shrinkwrap, pero npm resuelve las dependencias de tiempo de ejecución durante la instalación
en vez de incrustar cada binario de plataforma en el tarball del plugin. El paquete raíz
`openclaw` no agrupa todo su árbol de dependencias.

Los plugins que importan `openclaw/plugin-sdk/*` declaran `openclaw` como dependencia par.
OpenClaw no permite que npm instale una copia separada del registro del paquete host
en un proyecto gestionado, porque los paquetes host obsoletos pueden afectar la resolución
de pares de npm dentro de ese plugin. Las instalaciones npm gestionadas omiten la resolución/materialización
de pares de npm y OpenClaw reafirma los enlaces `node_modules/openclaw` locales del plugin para los paquetes
instalados que declaran el par host después de instalar o actualizar.

Las instalaciones de git clonan o actualizan el repositorio y luego ejecutan:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

El plugin instalado se carga luego desde ese directorio de paquete, por lo que la resolución
de `node_modules` local del paquete y padre funciona igual que para un paquete normal de Node.

## Plugins locales

Los plugins locales se tratan como directorios controlados por el desarrollador. OpenClaw no
ejecuta `npm install`, `pnpm install` ni reparación de dependencias para ellos. Si un plugin
local tiene dependencias, instálalas en ese plugin antes de cargarlo.

Los plugins locales TypeScript de terceros pueden usar la ruta de emergencia Jiti. Los plugins
JavaScript empaquetados y los plugins internos agrupados se cargan mediante
import/require nativo en lugar de Jiti.

## Inicio y recarga

El inicio del Gateway y la recarga de configuración nunca instalan dependencias de plugins. Leen
los registros de instalación del plugin, calculan el punto de entrada y lo cargan.

Si falta una dependencia en tiempo de ejecución, el plugin no se carga y el error
debería dirigir al operador a una corrección explícita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` puede limpiar estado de dependencias heredado generado por OpenClaw y recuperar
plugins descargables que faltan en los registros de instalación locales cuando la configuración
los referencia. Doctor no repara dependencias para un plugin local ya instalado.

## Plugins agrupados

Los plugins agrupados ligeros y críticos para el núcleo se envían como parte de OpenClaw.
No deberían tener un árbol pesado de dependencias de tiempo de ejecución o deberían moverse a un
paquete descargable en ClawHub/npm.

Para la lista generada actual de plugins que se envían en el paquete del núcleo, se instalan
externamente o permanecen solo como código fuente, consulta [Inventario de plugins](/es/plugins/plugin-inventory).

Los manifiestos de plugins agrupados no deben solicitar preparación de dependencias. La funcionalidad
grande u opcional de plugins debería empaquetarse como un plugin normal e instalarse mediante
la misma ruta npm/git/ClawHub que los plugins de terceros.

En checkouts de código fuente, OpenClaw trata el repositorio como un monorepo pnpm. Después de
`pnpm install`, los plugins agrupados se cargan desde `extensions/<id>`, por lo que las dependencias
de workspace locales del paquete están disponibles y las ediciones se recogen directamente. El desarrollo
en checkout de código fuente es solo con pnpm; `npm install` simple en la raíz del repositorio no es
una forma admitida de preparar dependencias de plugins agrupados.

| Forma de instalación             | Ubicación del plugin agrupado         | Propietario de dependencias                                         |
| -------------------------------- | ------------------------------------- | ------------------------------------------------------------------- |
| `npm install -g openclaw`        | Árbol de runtime construido dentro del paquete | Paquete OpenClaw y flujos explícitos de instalación/actualización/doctor de plugins |
| Checkout de Git más `pnpm install` | Paquetes de workspace `extensions/<id>` | El workspace pnpm, incluidas las dependencias propias de cada paquete de plugin |
| `openclaw plugins install ...`   | Raíz gestionada de proyecto npm/git/ClawHub | El flujo de instalación/actualización del plugin                    |

## Limpieza heredada

Las versiones anteriores de OpenClaw generaban raíces de dependencias de plugins agrupados al inicio o
durante la reparación de doctor. La limpieza actual de doctor elimina esos directorios y
symlinks obsoletos cuando se usa `--fix`, incluidas raíces antiguas `plugin-runtime-deps`, symlinks
globales de paquetes con prefijo Node que apuntan a destinos `plugin-runtime-deps` eliminados,
manifiestos `.openclaw-runtime-deps*`, `node_modules` de plugins generados, directorios de etapa
de instalación y almacenes pnpm locales del paquete. El postinstall empaquetado también
elimina esos symlinks globales antes de podar las raíces de destino heredadas para que las actualizaciones
no dejen importaciones de paquetes ESM colgantes.

Las instalaciones npm antiguas también usaban una raíz compartida `~/.openclaw/npm/node_modules`.
Los flujos actuales de instalación, actualización, desinstalación y doctor aún reconocen esa raíz plana
heredada solo para recuperación y limpieza. Las instalaciones npm nuevas deberían crear
raíces de proyecto por plugin en su lugar.
