---
read_when:
    - Estás depurando instalaciones de paquetes de Plugin
    - Está cambiando el comportamiento de inicio de Plugin, de doctor o de instalación del gestor de paquetes
    - Mantienes instalaciones empaquetadas de OpenClaw o manifiestos de Plugin incluidos
sidebarTitle: Dependencies
summary: Cómo OpenClaw instala paquetes de Plugin y resuelve dependencias de Plugin
title: Resolución de dependencias de Plugin
x-i18n:
    generated_at: "2026-05-06T09:06:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: e06f1fdc34c8392cbf0e399484fd59af11b9b7d73c5c7e68b3617a7cfd433a36
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Resolución de dependencias de Plugin

OpenClaw mantiene el trabajo de dependencias de plugins en el momento de instalación/actualización. La carga en tiempo de ejecución no ejecuta gestores de paquetes, repara árboles de dependencias ni modifica el directorio de paquetes de OpenClaw.

## División de responsabilidades

Los paquetes de Plugin son responsables de su propio grafo de dependencias:

- las dependencias de tiempo de ejecución están en `dependencies` u `optionalDependencies` del paquete de Plugin
- las importaciones de SDK/núcleo son dependencias pares o importaciones suministradas por OpenClaw
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

- los paquetes npm se instalan en `~/.openclaw/npm`
- los paquetes git se clonan en `~/.openclaw/git`
- las instalaciones locales/de ruta/de archivo comprimido se copian o referencian sin reparación de dependencias

Las instalaciones npm se ejecutan en la raíz npm con:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` usa esa misma raíz npm gestionada para un tarball local de npm-pack. OpenClaw lee los metadatos npm del tarball, lo agrega a la raíz gestionada como una dependencia `file:` copiada, ejecuta la instalación npm normal y luego verifica los metadatos del lockfile instalado antes de confiar en el Plugin. Esto está pensado para pruebas de aceptación de paquetes y de candidatos de lanzamiento, donde un artefacto local de paquete debe comportarse como el artefacto de registro que simula.

npm puede elevar dependencias transitivas a `~/.openclaw/npm/node_modules` junto al paquete de Plugin. OpenClaw analiza la raíz npm gestionada antes de confiar en la instalación y usa npm para eliminar paquetes gestionados por npm durante la desinstalación, de modo que las dependencias de tiempo de ejecución elevadas permanecen dentro del límite de limpieza gestionado.

Los plugins que importan `openclaw/plugin-sdk/*` declaran `openclaw` como dependencia par. OpenClaw no permite que npm instale una copia separada del paquete anfitrión desde el registro en la raíz gestionada, porque los paquetes anfitriones obsoletos pueden afectar la resolución de dependencias pares de npm durante instalaciones posteriores de plugins. En su lugar, después de que npm termina de modificar la raíz compartida durante la instalación, actualización o desinstalación, OpenClaw vuelve a establecer los enlaces `node_modules/openclaw` locales al Plugin para los paquetes instalados que declaran la dependencia par del anfitrión.

Las instalaciones git clonan o actualizan el repositorio y luego ejecutan:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

El Plugin instalado se carga entonces desde ese directorio de paquete, por lo que la resolución de `node_modules` local del paquete y del directorio padre funciona igual que en un paquete Node normal.

## Plugins locales

Los plugins locales se tratan como directorios controlados por el desarrollador. OpenClaw no ejecuta `npm install`, `pnpm install` ni reparación de dependencias para ellos. Si un Plugin local tiene dependencias, instálalas en ese Plugin antes de cargarlo.

Los plugins locales de TypeScript de terceros pueden usar la ruta de emergencia de Jiti. Los plugins JavaScript empaquetados y los plugins internos incluidos se cargan mediante import/require nativo en lugar de Jiti.

## Inicio y recarga

El inicio de Gateway y la recarga de configuración nunca instalan dependencias de Plugin. Leen los registros de instalación del Plugin, calculan el punto de entrada y lo cargan.

Si falta una dependencia en tiempo de ejecución, el Plugin no se carga y el error debe indicar al operador una corrección explícita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` puede limpiar el estado de dependencias heredado generado por OpenClaw y recuperar plugins descargables que faltan en los registros de instalación locales cuando la configuración los referencia. Doctor no repara dependencias de un Plugin local ya instalado.

## Plugins incluidos

Los plugins incluidos ligeros y críticos para el núcleo se envían como parte de OpenClaw. No deben tener un árbol pesado de dependencias de tiempo de ejecución, o deben trasladarse a un paquete descargable en ClawHub/npm.

Para ver la lista generada actual de plugins que se envían en el paquete principal, se instalan externamente o permanecen solo como código fuente, consulta [Inventario de Plugin](/es/plugins/plugin-inventory).

Los manifiestos de plugins incluidos no deben solicitar preparación de dependencias. La funcionalidad de Plugin grande u opcional debe empaquetarse como un Plugin normal e instalarse mediante la misma ruta npm/git/ClawHub que los plugins de terceros.

En copias de trabajo del código fuente, OpenClaw trata el repositorio como un monorepo pnpm. Después de `pnpm install`, los plugins incluidos se cargan desde `extensions/<id>` para que las dependencias del espacio de trabajo locales al paquete estén disponibles y las ediciones se recojan directamente. El desarrollo desde una copia de trabajo del código fuente es solo con pnpm; un simple `npm install` en la raíz del repositorio no es una forma compatible de preparar las dependencias de plugins incluidos.

| Forma de instalación             | Ubicación del Plugin incluido         | Responsable de las dependencias                                      |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Árbol de tiempo de ejecución construido dentro del paquete | El paquete OpenClaw y los flujos explícitos de instalación/actualización/doctor de Plugin |
| Copia de trabajo de git con `pnpm install` | Paquetes de espacio de trabajo `extensions/<id>` | El espacio de trabajo pnpm, incluidas las dependencias propias de cada paquete de Plugin |
| `openclaw plugins install ...`   | Raíz gestionada de Plugin npm/git/ClawHub | El flujo de instalación/actualización de Plugin                      |

## Limpieza heredada

Las versiones antiguas de OpenClaw generaban raíces de dependencias de plugins incluidos al inicio o durante la reparación de doctor. La limpieza actual de doctor elimina esos directorios y enlaces simbólicos obsoletos cuando se usa `--fix`, incluidas raíces antiguas `plugin-runtime-deps`, enlaces simbólicos globales de paquetes con prefijo de Node que apuntan a destinos `plugin-runtime-deps` podados, manifiestos `.openclaw-runtime-deps*`, `node_modules` de Plugin generados, directorios de etapa de instalación y almacenes pnpm locales al paquete. El postinstall empaquetado también elimina esos enlaces simbólicos globales antes de podar las raíces de destino heredadas, para que las actualizaciones no dejen importaciones de paquetes ESM colgantes.

Estas rutas son solo residuos heredados. Las instalaciones nuevas no deben crearlas.
