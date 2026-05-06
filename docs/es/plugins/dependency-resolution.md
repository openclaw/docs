---
read_when:
    - Estás depurando instalaciones de paquetes de Plugin
    - Estás cambiando el comportamiento de inicio de Plugin, doctor o instalación del gestor de paquetes
    - Mantienes instalaciones empaquetadas de OpenClaw o manifiestos de Plugin incluidos
sidebarTitle: Dependencies
summary: Cómo OpenClaw instala paquetes de Plugin y resuelve dependencias de Plugin
title: Resolución de dependencias del Plugin
x-i18n:
    generated_at: "2026-05-06T19:35:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: d51785b67d491d09e3a7a3ffcd6c991f7415c46b207596151dbc29b0c43e9341
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw mantiene el trabajo de dependencias de plugins en el momento de instalación/actualización. La carga en tiempo de ejecución
no ejecuta gestores de paquetes, no repara árboles de dependencias ni modifica el directorio de paquetes de OpenClaw.

## División de responsabilidades

Los paquetes de plugins son dueños de su grafo de dependencias:

- las dependencias de tiempo de ejecución viven en `dependencies` u
  `optionalDependencies` del paquete del plugin
- las importaciones del SDK/núcleo son pares o importaciones proporcionadas por OpenClaw
- los plugins de desarrollo local traen sus propias dependencias ya instaladas
- los plugins de npm y git se instalan en raíces de paquetes propiedad de OpenClaw

OpenClaw solo posee el ciclo de vida del plugin:

- descubrir el origen del plugin
- instalar o actualizar el paquete cuando se solicite explícitamente
- registrar los metadatos de instalación
- cargar el punto de entrada del plugin
- fallar con un error accionable cuando falten dependencias

## Raíces de instalación

OpenClaw usa raíces estables por origen:

- los paquetes npm se instalan bajo `~/.openclaw/npm`
- los paquetes git se clonan bajo `~/.openclaw/git`
- las instalaciones locales/de ruta/de archivo se copian o referencian sin reparación de dependencias

Las instalaciones npm se ejecutan en la raíz npm con:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` usa esa misma raíz npm gestionada
para un tarball npm-pack local. OpenClaw lee los metadatos npm del tarball, lo añade
a la raíz gestionada como una dependencia `file:` copiada, ejecuta la instalación npm normal
y luego verifica los metadatos del lockfile instalado antes de confiar en el plugin.
Esto está pensado para pruebas de aceptación de paquetes y candidatos de lanzamiento en las que un
artefacto pack local debe comportarse como el artefacto de registro que simula.

npm puede elevar dependencias transitivas a `~/.openclaw/npm/node_modules` junto
al paquete del plugin. OpenClaw escanea la raíz npm gestionada antes de confiar en la
instalación y usa npm para eliminar paquetes gestionados por npm durante la desinstalación, de modo que las dependencias
de tiempo de ejecución elevadas permanecen dentro del límite de limpieza gestionado.

Los plugins que importan `openclaw/plugin-sdk/*` declaran `openclaw` como dependencia
par. OpenClaw no permite que npm instale una copia separada del paquete host desde el registro
en la raíz gestionada, porque los paquetes host obsoletos pueden afectar la resolución de pares
de npm durante instalaciones posteriores de plugins. Las instalaciones npm gestionadas omiten la resolución/materialización
de pares de npm para la raíz compartida y OpenClaw reafirma los enlaces
`node_modules/openclaw` locales del plugin para los paquetes instalados que declaran
el par host después de instalar, actualizar o desinstalar.

Las instalaciones git clonan o actualizan el repositorio y luego ejecutan:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

El plugin instalado se carga entonces desde ese directorio de paquete, por lo que la resolución
de `node_modules` local del paquete y padre funciona igual que para un paquete
Node normal.

## Plugins locales

Los plugins locales se tratan como directorios controlados por desarrolladores. OpenClaw no
ejecuta `npm install`, `pnpm install` ni reparación de dependencias para ellos. Si un
plugin local tiene dependencias, instálalas en ese plugin antes de cargarlo.

Los plugins locales TypeScript de terceros pueden usar la ruta Jiti de emergencia. Los plugins
JavaScript empaquetados y los plugins internos incluidos se cargan mediante
import/require nativo en lugar de Jiti.

## Inicio y recarga

El inicio de Gateway y la recarga de configuración nunca instalan dependencias de plugins. Leen
los registros de instalación del plugin, calculan el punto de entrada y lo cargan.

Si falta una dependencia en tiempo de ejecución, el plugin no se carga y el error
debe indicar al operador una corrección explícita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` puede limpiar el estado de dependencias heredado generado por OpenClaw y recuperar
plugins descargables que faltan en los registros de instalación locales cuando la configuración
los referencia. Doctor no repara dependencias de un plugin local ya instalado.

## Plugins incluidos

Los plugins incluidos ligeros y críticos para el núcleo se distribuyen como parte de OpenClaw.
No deben tener un árbol pesado de dependencias de tiempo de ejecución o deben trasladarse a un
paquete descargable en ClawHub/npm.

Para ver la lista generada actual de plugins que se distribuyen en el paquete del núcleo, se instalan
externamente o permanecen solo como código fuente, consulta [Inventario de plugins](/es/plugins/plugin-inventory).

Los manifiestos de plugins incluidos no deben solicitar preparación de dependencias. La funcionalidad
grande u opcional de plugins debe empaquetarse como un plugin normal e instalarse mediante
la misma ruta npm/git/ClawHub que los plugins de terceros.

En checkouts de código fuente, OpenClaw trata el repositorio como un monorepo pnpm. Después de
`pnpm install`, los plugins incluidos se cargan desde `extensions/<id>` para que las dependencias
workspace locales del paquete estén disponibles y los cambios se recojan directamente. El desarrollo en
checkout de código fuente es solo con pnpm; `npm install` simple en la raíz del repositorio no es
una forma admitida de preparar dependencias de plugins incluidos.

| Forma de instalación             | Ubicación del plugin incluido         | Propietario de dependencias                                           |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Árbol de runtime compilado dentro del paquete | Paquete OpenClaw y flujos explícitos de instalación/actualización/doctor de plugins |
| Checkout de Git más `pnpm install` | Paquetes workspace en `extensions/<id>` | El workspace pnpm, incluidas las dependencias propias de cada paquete de plugin |
| `openclaw plugins install ...`   | Raíz de plugin gestionada por npm/git/ClawHub | El flujo de instalación/actualización del plugin                     |

## Limpieza heredada

Las versiones anteriores de OpenClaw generaban raíces de dependencias de plugins incluidos al inicio o
durante la reparación de doctor. La limpieza actual de doctor elimina esos directorios y enlaces simbólicos
obsoletos cuando se usa `--fix`, incluidas las raíces antiguas `plugin-runtime-deps`, los enlaces simbólicos
de paquetes con prefijo global de Node que apuntan a destinos `plugin-runtime-deps` podados,
los manifiestos `.openclaw-runtime-deps*`, los `node_modules` de plugins generados, los directorios de
etapa de instalación y los almacenes pnpm locales del paquete. El postinstall empaquetado también
elimina esos enlaces simbólicos globales antes de podar las raíces de destino heredadas para que las actualizaciones
no dejen importaciones de paquetes ESM colgantes.

Estas rutas son solo restos heredados. Las instalaciones nuevas no deben crearlas.
