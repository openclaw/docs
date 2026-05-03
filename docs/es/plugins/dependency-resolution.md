---
read_when:
    - Estás depurando instalaciones de paquetes de Plugin
    - Está cambiando el comportamiento de inicio del Plugin, de doctor o de instalación del gestor de paquetes
    - Mantienes instalaciones empaquetadas de OpenClaw o manifiestos de Plugin incluidos
sidebarTitle: Dependencies
summary: Cómo OpenClaw instala paquetes de Plugin y resuelve dependencias de Plugin
title: Resolución de dependencias del Plugin
x-i18n:
    generated_at: "2026-05-03T21:36:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 46af62ff866d50cb53bb2761d9928f0fd2a25bdb945040885ec6bfb85be35c6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Resolución de dependencias de Plugin

OpenClaw mantiene el trabajo de dependencias de Plugin en el momento de instalación/actualización. La carga en tiempo de ejecución
no ejecuta gestores de paquetes, no repara árboles de dependencias ni muta el directorio de paquetes de OpenClaw.

## División de responsabilidades

Los paquetes de Plugin son responsables de su grafo de dependencias:

- las dependencias de tiempo de ejecución viven en `dependencies` u
  `optionalDependencies` del paquete de Plugin
- las importaciones de SDK/núcleo son pares o importaciones suministradas por OpenClaw
- los plugins de desarrollo local traen sus propias dependencias ya instaladas
- los plugins de npm y git se instalan en raíces de paquetes propiedad de OpenClaw

OpenClaw solo es responsable del ciclo de vida del Plugin:

- descubrir el origen del Plugin
- instalar o actualizar el paquete cuando se solicite explícitamente
- registrar los metadatos de instalación
- cargar el punto de entrada del Plugin
- fallar con un error accionable cuando falten dependencias

## Raíces de instalación

OpenClaw usa raíces estables por origen:

- los paquetes de npm se instalan bajo `~/.openclaw/npm`
- los paquetes de git se clonan bajo `~/.openclaw/git`
- las instalaciones locales/de ruta/de archivo se copian o se referencian sin reparación de dependencias

Las instalaciones de npm se ejecutan en la raíz de npm con:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm puede elevar dependencias transitivas a `~/.openclaw/npm/node_modules` junto al
paquete de Plugin. OpenClaw examina la raíz de npm gestionada antes de confiar en la
instalación y usa npm para eliminar paquetes gestionados por npm durante la desinstalación, por lo que las dependencias de tiempo de ejecución elevadas permanecen dentro del límite de limpieza gestionado.

Las instalaciones de git clonan o actualizan el repositorio y luego ejecutan:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

El Plugin instalado se carga después desde ese directorio de paquete, por lo que la resolución de
`node_modules` local del paquete y del padre funciona igual que para un paquete normal de
Node.

## Plugins locales

Los plugins locales se tratan como directorios controlados por el desarrollador. OpenClaw no
ejecuta `npm install`, `pnpm install` ni reparación de dependencias para ellos. Si un
Plugin local tiene dependencias, instálalas en ese Plugin antes de cargarlo.

Los plugins locales de TypeScript de terceros pueden usar la ruta de emergencia de Jiti. Los plugins
JavaScript empaquetados y los plugins internos incluidos se cargan mediante
import/require nativo en lugar de Jiti.

## Inicio y recarga

El inicio de Gateway y la recarga de configuración nunca instalan dependencias de Plugin. Leen
los registros de instalación de Plugin, calculan el punto de entrada y lo cargan.

Si falta una dependencia en tiempo de ejecución, el Plugin no se carga y el error
debería indicar al operador una corrección explícita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` puede limpiar estado de dependencias heredado generado por OpenClaw e instalar
plugins descargables configurados que falten en los registros de instalación locales.
No repara dependencias de un Plugin local ya instalado.

## Plugins incluidos

Los plugins incluidos ligeros y críticos para el núcleo se entregan como parte de OpenClaw.
Deberían no tener un árbol pesado de dependencias de tiempo de ejecución o moverse a un
paquete descargable en ClawHub/npm.

Para la lista generada actual de plugins que se entregan en el paquete principal, se instalan
externamente o permanecen solo como código fuente, consulta [Inventario de Plugin](/es/plugins/plugin-inventory).

Los manifiestos de plugins incluidos no deben solicitar preparación de dependencias. La funcionalidad de
Plugin grande u opcional debería empaquetarse como un Plugin normal e instalarse mediante
la misma ruta npm/git/ClawHub que los plugins de terceros.

En copias de código fuente, OpenClaw trata el repositorio como un monorepo de pnpm. Después de
`pnpm install`, los plugins incluidos se cargan desde `extensions/<id>`, por lo que las dependencias
de workspace locales del paquete están disponibles y las ediciones se recogen directamente. El desarrollo
en una copia de código fuente es solo con pnpm; `npm install` simple en la raíz del repositorio no es
una forma admitida de preparar dependencias de Plugin incluidas.

| Forma de instalación             | Ubicación del Plugin incluido         | Responsable de dependencias                                          |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Árbol de tiempo de ejecución construido dentro del paquete | Paquete de OpenClaw y flujos explícitos de instalación/actualización/doctor de Plugin |
| Copia de git más `pnpm install` | Paquetes de workspace `extensions/<id>` | El workspace de pnpm, incluidas las dependencias propias de cada paquete de Plugin |
| `openclaw plugins install ...`   | Raíz de Plugin gestionada de npm/git/ClawHub | El flujo de instalación/actualización de Plugin                      |

## Limpieza heredada

Versiones anteriores de OpenClaw generaban raíces de dependencias de plugins incluidos al inicio o
durante la reparación de doctor. La limpieza actual de doctor elimina esos directorios y
enlaces simbólicos obsoletos cuando se usa `--fix`, incluidas raíces antiguas de `plugin-runtime-deps`, enlaces simbólicos de paquetes de prefijo global de
Node que apuntan a destinos `plugin-runtime-deps` podados,
manifiestos `.openclaw-runtime-deps*`, `node_modules` de Plugin generados, directorios de
preparación de instalación y almacenes pnpm locales del paquete. El postinstall empaquetado también
elimina esos enlaces simbólicos globales antes de podar las raíces de destino heredadas para que las actualizaciones
no dejen importaciones colgantes de paquetes ESM.

Estas rutas son solo restos heredados. Las instalaciones nuevas no deberían crearlas.
