---
read_when:
    - Estás depurando instalaciones de paquetes de Plugin
    - Está modificando el comportamiento de inicio de Plugin, de doctor o de instalación del gestor de paquetes
    - Mantienes instalaciones empaquetadas de OpenClaw o manifiestos de Plugin incluidos
sidebarTitle: Dependencies
summary: Cómo OpenClaw instala paquetes de plugins y resuelve dependencias de plugins
title: Resolución de dependencias de Plugin
x-i18n:
    generated_at: "2026-05-02T20:51:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9476529ad1d44ed1b17caca628c58acfbb1d8c73393f58fa7d3d76944a71aea
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Resolución de dependencias de Plugin

OpenClaw mantiene el trabajo de dependencias de Plugin en el momento de instalación/actualización. La carga en tiempo de ejecución
no ejecuta gestores de paquetes, repara árboles de dependencias ni muta el directorio de paquetes de OpenClaw.

## División de responsabilidades

Los paquetes de Plugin son dueños de su grafo de dependencias:

- las dependencias en tiempo de ejecución viven en `dependencies` o
  `optionalDependencies` del paquete de Plugin
- las importaciones de SDK/core son importaciones peer o suministradas por OpenClaw
- los plugins de desarrollo local traen sus propias dependencias ya instaladas
- los plugins npm y git se instalan en raíces de paquetes propiedad de OpenClaw

OpenClaw solo es dueño del ciclo de vida de Plugin:

- descubrir el origen del Plugin
- instalar o actualizar el paquete cuando se solicite explícitamente
- registrar los metadatos de instalación
- cargar el punto de entrada del Plugin
- fallar con un error accionable cuando falten dependencias

## Raíces de instalación

OpenClaw usa raíces estables por origen:

- los paquetes npm se instalan bajo `~/.openclaw/npm`
- los paquetes git se clonan bajo `~/.openclaw/git`
- las instalaciones locales/de ruta/de archivo se copian o referencian sin reparación de dependencias

Las instalaciones npm se ejecutan en la raíz npm con:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm puede elevar dependencias transitivas a `~/.openclaw/npm/node_modules` junto al
paquete de Plugin. OpenClaw escanea la raíz npm administrada antes de confiar en la
instalación y usa npm para eliminar paquetes administrados por npm durante la desinstalación, por lo que las dependencias
en tiempo de ejecución elevadas permanecen dentro del límite de limpieza administrado.

Las instalaciones git clonan o actualizan el repositorio y luego ejecutan:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

El Plugin instalado se carga entonces desde ese directorio de paquete, por lo que la resolución
de `node_modules` local al paquete y padre funciona igual que en un paquete
Node normal.

## Plugins locales

Los plugins locales se tratan como directorios controlados por desarrolladores. OpenClaw no
ejecuta `npm install`, `pnpm install` ni reparación de dependencias para ellos. Si un
Plugin local tiene dependencias, instálalas en ese Plugin antes de cargarlo.

Los plugins locales TypeScript de terceros pueden usar la ruta de emergencia Jiti. Los plugins
JavaScript empaquetados y los plugins internos incluidos se cargan mediante
import/require nativo en lugar de Jiti.

## Inicio y recarga

El inicio de Gateway y la recarga de configuración nunca instalan dependencias de Plugin. Leen
los registros de instalación de Plugin, calculan el punto de entrada y lo cargan.

Si falta una dependencia en tiempo de ejecución, el Plugin no se carga y el error
debe indicar al operador una corrección explícita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` puede limpiar el estado de dependencias heredado generado por OpenClaw e instalar
plugins descargables configurados que falten en los registros de instalación locales.
No repara dependencias de un Plugin local ya instalado.

## Plugins incluidos

Los plugins incluidos ligeros y críticos para el core se envían como parte de OpenClaw.
Deben no tener un árbol pesado de dependencias en tiempo de ejecución o trasladarse a un
paquete descargable en ClawHub/npm.

Para la lista generada actual de plugins que se envían en el paquete core, se instalan
externamente o permanecen solo en código fuente, consulta [Inventario de Plugin](/es/plugins/plugin-inventory).

Los manifiestos de Plugin incluidos no deben solicitar preparación de dependencias. La funcionalidad
grande u opcional de Plugin debe empaquetarse como un Plugin normal e instalarse mediante
la misma ruta npm/git/ClawHub que los plugins de terceros.

En checkouts de código fuente, OpenClaw trata el repositorio como un monorepo pnpm. Después de
`pnpm install`, los plugins incluidos se cargan desde `extensions/<id>` para que las dependencias
workspace locales al paquete estén disponibles y las ediciones se recojan directamente. El desarrollo
en checkout de código fuente es solo con pnpm; `npm install` simple en la raíz del repositorio no es
una forma compatible de preparar las dependencias de plugins incluidos.

| Forma de instalación             | Ubicación del Plugin incluido          | Dueño de las dependencias                                            |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Árbol de ejecución construido dentro del paquete | Paquete OpenClaw y flujos explícitos de instalación/actualización/doctor de Plugin |
| Checkout git más `pnpm install` | Paquetes workspace `extensions/<id>`  | El workspace pnpm, incluidas las propias dependencias de cada paquete de Plugin |
| `openclaw plugins install ...`   | Raíz de Plugin administrada npm/git/ClawHub | El flujo de instalación/actualización de Plugin                      |

## Limpieza heredada

Las versiones anteriores de OpenClaw generaban raíces de dependencias de Plugin incluido al inicio o
durante la reparación de doctor. La limpieza actual de doctor elimina esos directorios y
symlinks obsoletos cuando se usa `--fix`, incluidas las antiguas raíces `plugin-runtime-deps`,
manifiestos `.openclaw-runtime-deps*`, `node_modules` de Plugin generados, directorios de
etapa de instalación y almacenes pnpm locales al paquete.

Estas rutas son solo residuos heredados. Las nuevas instalaciones no deben crearlas.
