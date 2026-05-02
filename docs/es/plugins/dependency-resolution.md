---
read_when:
    - Estás depurando instalaciones de paquetes de Plugin
    - Estás cambiando el comportamiento de inicio de Plugin, doctor o instalación del gestor de paquetes
    - Mantienes instalaciones empaquetadas de OpenClaw o manifiestos de plugins incluidos
sidebarTitle: Dependencies
summary: Cómo OpenClaw instala paquetes de Plugin y resuelve dependencias de Plugin
title: Resolución de dependencias de Plugin
x-i18n:
    generated_at: "2026-05-02T05:31:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43d8008c837d519fd7c886f9615ad53941da340d753b559dfb0a32877716bc1f
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Resolución de dependencias de Plugin

OpenClaw mantiene el trabajo de dependencias de plugins en el momento de instalación/actualización. La carga en tiempo de ejecución
no ejecuta administradores de paquetes, no repara árboles de dependencias ni muta el directorio del paquete de OpenClaw.

## División de responsabilidades

Los paquetes de Plugin son responsables de su propio grafo de dependencias:

- las dependencias en tiempo de ejecución viven en `dependencies` u
  `optionalDependencies` del paquete de Plugin
- las importaciones de SDK/core son importaciones peer o suministradas por OpenClaw
- los plugins de desarrollo local aportan sus propias dependencias ya instaladas
- los plugins de npm y git se instalan en raíces de paquetes propiedad de OpenClaw

OpenClaw es responsable solo del ciclo de vida del plugin:

- descubrir el origen del plugin
- instalar o actualizar el paquete cuando se solicite explícitamente
- registrar los metadatos de instalación
- cargar el punto de entrada del plugin
- fallar con un error accionable cuando falten dependencias

## Raíces de instalación

OpenClaw usa raíces estables por origen:

- los paquetes npm se instalan bajo `~/.openclaw/npm`
- los paquetes git se clonan bajo `~/.openclaw/git`
- las instalaciones locales/de ruta/de archivo se copian o se referencian sin reparación de dependencias

Las instalaciones npm se ejecutan en la raíz npm con:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm puede elevar dependencias transitivas a `~/.openclaw/npm/node_modules` junto
al paquete de Plugin. OpenClaw escanea la raíz npm gestionada antes de confiar en la
instalación y usa npm para eliminar paquetes gestionados por npm durante la desinstalación, por lo que las dependencias
en tiempo de ejecución elevadas permanecen dentro del límite de limpieza gestionado.

Las instalaciones git clonan o actualizan el repositorio y luego ejecutan:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

El plugin instalado se carga después desde ese directorio de paquete, por lo que la resolución de `node_modules`
local al paquete y del padre funciona igual que en un paquete Node normal.

## Plugins locales

Los plugins locales se tratan como directorios controlados por desarrolladores. OpenClaw no
ejecuta `npm install`, `pnpm install` ni reparación de dependencias para ellos. Si un
plugin local tiene dependencias, instálalas en ese plugin antes de cargarlo.

Los plugins locales TypeScript de terceros pueden usar la ruta de emergencia de Jiti. Los plugins
JavaScript empaquetados y los plugins internos incluidos se cargan mediante
import/require nativo en lugar de Jiti.

## Inicio y recarga

El inicio del Gateway y la recarga de configuración nunca instalan dependencias de plugins. Leen
los registros de instalación del plugin, calculan el punto de entrada y lo cargan.

Si falta una dependencia en tiempo de ejecución, el plugin no se carga y el error
debe indicar al operador una corrección explícita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` puede limpiar estado de dependencias heredado generado por OpenClaw e instalar
plugins descargables configurados que falten en los registros de instalación locales.
No repara dependencias de un plugin local ya instalado.

## Plugins incluidos

Los plugins incluidos ligeros y críticos para el core se distribuyen como parte de OpenClaw.
No deben tener un árbol pesado de dependencias en tiempo de ejecución o deben moverse a un
paquete descargable en ClawHub/npm.

Los manifiestos de plugins incluidos no deben solicitar preparación de dependencias. La funcionalidad
grande u opcional de un plugin debe empaquetarse como un plugin normal e instalarse mediante
la misma ruta npm/git/ClawHub que los plugins de terceros.

En checkouts de código fuente, OpenClaw trata el repositorio como un monorepo pnpm. Después de
`pnpm install`, los plugins incluidos se cargan desde `extensions/<id>`, de modo que las dependencias
workspace locales al paquete están disponibles y las ediciones se recogen directamente. El desarrollo
en checkout de código fuente es solo con pnpm; `npm install` simple en la raíz del repositorio no es
una forma admitida de preparar dependencias de plugins incluidos.

| Forma de instalación             | Ubicación del plugin incluido         | Responsable de dependencias                                          |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Árbol de runtime compilado dentro del paquete | El paquete de OpenClaw y los flujos explícitos de instalación/actualización/doctor de plugins |
| Checkout de git más `pnpm install` | Paquetes workspace de `extensions/<id>` | El workspace pnpm, incluidas las dependencias propias de cada paquete de Plugin |
| `openclaw plugins install ...`   | Raíz gestionada de plugin npm/git/ClawHub | El flujo de instalación/actualización del plugin                     |

## Limpieza heredada

Versiones anteriores de OpenClaw generaban raíces de dependencias de plugins incluidos al inicio o
durante la reparación de doctor. La limpieza actual de doctor elimina esos directorios y
symlinks obsoletos cuando se usa `--fix`, incluidas las raíces antiguas `plugin-runtime-deps`,
los manifiestos `.openclaw-runtime-deps*`, los `node_modules` de plugin generados, los directorios
de etapa de instalación y los almacenes pnpm locales al paquete.

Estas rutas son solo residuos heredados. Las instalaciones nuevas no deben crearlas.
