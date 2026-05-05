---
read_when:
    - Estás depurando instalaciones de paquetes de Plugin
    - Estás cambiando el comportamiento de inicio de Plugin, doctor o instalación del gestor de paquetes
    - Mantienes instalaciones empaquetadas de OpenClaw o manifiestos de plugins incluidos
sidebarTitle: Dependencies
summary: Cómo OpenClaw instala paquetes de Plugin y resuelve dependencias de Plugin
title: Resolución de dependencias de Plugin
x-i18n:
    generated_at: "2026-05-05T01:48:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a832f705e51bba8ac77e2a8715a7213fd2caf10bfa42059d53db4a6d5ad8c20
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Resolución de dependencias de Plugin

OpenClaw mantiene el trabajo de dependencias de plugins en el momento de instalación/actualización. La carga en tiempo de ejecución
no ejecuta gestores de paquetes, no repara árboles de dependencias ni modifica el directorio del paquete de OpenClaw.

## División de responsabilidades

Los paquetes de plugins son responsables de su grafo de dependencias:

- las dependencias de tiempo de ejecución viven en `dependencies` u
  `optionalDependencies` del paquete del plugin
- las importaciones de SDK/núcleo son pares o importaciones suministradas por OpenClaw
- los plugins de desarrollo local traen sus propias dependencias ya instaladas
- los plugins de npm y git se instalan en raíces de paquetes propiedad de OpenClaw

OpenClaw solo es responsable del ciclo de vida del plugin:

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
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm puede elevar dependencias transitivas a `~/.openclaw/npm/node_modules` junto
al paquete del plugin. OpenClaw escanea la raíz npm gestionada antes de confiar en la
instalación y usa npm para eliminar paquetes gestionados por npm durante la desinstalación, de modo que las dependencias
de tiempo de ejecución elevadas permanezcan dentro del límite de limpieza gestionado.

Las instalaciones git clonan o actualizan el repositorio y luego ejecutan:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

El plugin instalado se carga entonces desde ese directorio de paquete, por lo que la resolución
de `node_modules` local del paquete y padre funciona igual que en un paquete
Node normal.

## Plugins locales

Los plugins locales se tratan como directorios controlados por desarrolladores. OpenClaw no
ejecuta `npm install`, `pnpm install` ni reparación de dependencias para ellos. Si un
plugin local tiene dependencias, instálalas en ese plugin antes de cargarlo.

Los plugins locales TypeScript de terceros pueden usar la ruta de emergencia Jiti. Los plugins
JavaScript empaquetados y los plugins internos incluidos se cargan mediante
import/require nativos en lugar de Jiti.

## Inicio y recarga

El inicio del Gateway y la recarga de configuración nunca instalan dependencias de plugins. Leen
los registros de instalación del plugin, calculan el punto de entrada y lo cargan.

Si falta una dependencia en tiempo de ejecución, el plugin no se carga y el error
debería indicar al operador una corrección explícita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` puede limpiar el estado de dependencias heredado generado por OpenClaw y recuperar
plugins descargables que faltan en los registros de instalación locales cuando la configuración
los referencia. Doctor no repara dependencias para un plugin local ya instalado.

## Plugins incluidos

Los plugins incluidos ligeros y críticos para el núcleo se distribuyen como parte de OpenClaw.
No deberían tener un árbol pesado de dependencias de tiempo de ejecución o deberían moverse a un
paquete descargable en ClawHub/npm.

Para ver la lista generada actual de plugins que se distribuyen en el paquete principal, se instalan
externamente o permanecen solo como código fuente, consulta [Inventario de plugins](/es/plugins/plugin-inventory).

Los manifiestos de plugins incluidos no deben solicitar preparación de dependencias. La funcionalidad
grande u opcional de plugins debería empaquetarse como un plugin normal e instalarse mediante
la misma ruta npm/git/ClawHub que los plugins de terceros.

En checkouts de código fuente, OpenClaw trata el repositorio como un monorepo pnpm. Después de
`pnpm install`, los plugins incluidos se cargan desde `extensions/<id>` para que las dependencias
locales del paquete en el workspace estén disponibles y las ediciones se recojan directamente. El desarrollo
en checkout de código fuente es solo con pnpm; ejecutar `npm install` sin más en la raíz del repositorio
no es una forma admitida de preparar dependencias de plugins incluidos.

| Forma de instalación             | Ubicación del plugin incluido         | Responsable de dependencias                                            |
| -------------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| `npm install -g openclaw`        | Árbol de tiempo de ejecución compilado dentro del paquete | Paquete de OpenClaw y flujos explícitos de instalación/actualización/doctor de plugins |
| Checkout git más `pnpm install` | Paquetes de workspace `extensions/<id>` | El workspace pnpm, incluidas las dependencias propias de cada paquete de plugin |
| `openclaw plugins install ...`   | Raíz de plugin gestionada npm/git/ClawHub | El flujo de instalación/actualización del plugin                       |

## Limpieza heredada

Versiones anteriores de OpenClaw generaban raíces de dependencias de plugins incluidos al iniciar o
durante la reparación con doctor. La limpieza actual de doctor elimina esos directorios obsoletos y
enlaces simbólicos cuando se usa `--fix`, incluidas antiguas raíces `plugin-runtime-deps`, enlaces simbólicos
de paquetes de prefijo global de Node que apuntan a destinos `plugin-runtime-deps` podados,
manifiestos `.openclaw-runtime-deps*`, `node_modules` de plugins generados, directorios de etapa
de instalación y almacenes pnpm locales del paquete. El postinstall empaquetado también
elimina esos enlaces simbólicos globales antes de podar las raíces de destino heredadas para que las actualizaciones
no dejen importaciones colgantes de paquetes ESM.

Estas rutas son solo residuos heredados. Las instalaciones nuevas no deberían crearlas.
