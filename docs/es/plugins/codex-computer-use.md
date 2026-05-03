---
read_when:
    - Quiere que los agentes de OpenClaw en modo Codex usen Codex Computer Use
    - Está decidiendo entre Codex Computer Use, PeekabooBridge y MCP directo de cua-driver
    - Estás decidiendo entre Codex Computer Use y una configuración directa de cua-driver MCP
    - Está configurando computerUse para el Plugin de Codex incluido
    - Estás solucionando problemas con /codex computer-use status o install
summary: Configura Codex Computer Use para agentes de OpenClaw en modo Codex
title: Uso de computadora de Codex
x-i18n:
    generated_at: "2026-05-03T05:29:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08383e88ca02dccc86c622c3295478e950fdd222ef16947465e0de1dacafa56c
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use es un Plugin MCP nativo de Codex para el control del escritorio local. OpenClaw
no incorpora la aplicación de escritorio, no ejecuta acciones de escritorio por sí mismo ni omite
los permisos de Codex. El Plugin incluido `codex` solo prepara el app-server de Codex:
habilita la compatibilidad con Plugins de Codex, encuentra o instala el Plugin
Codex Computer Use configurado, comprueba que el servidor MCP `computer-use` esté disponible y
luego deja que Codex sea responsable de las llamadas nativas a herramientas MCP durante los turnos en modo Codex.

Usa esta página cuando OpenClaw ya esté usando el arnés nativo de Codex. Para la
configuración del entorno de ejecución en sí, consulta [arnés de Codex](/es/plugins/codex-harness).

## OpenClaw.app y Peekaboo

La integración de Peekaboo de OpenClaw.app es independiente de Codex Computer Use. La
aplicación de macOS puede alojar un socket PeekabooBridge para que la CLI `peekaboo` pueda reutilizar los
permisos locales de Accesibilidad y Grabación de pantalla de la aplicación para las propias
herramientas de automatización de Peekaboo. Ese puente no instala ni actúa como proxy de Codex Computer Use, y
Codex Computer Use no llama a través del socket PeekabooBridge.

Usa [puente de Peekaboo](/es/platforms/mac/peekaboo) cuando quieras que OpenClaw.app sea
un host consciente de permisos para la automatización de la CLI de Peekaboo. Usa esta página cuando un
agente de OpenClaw en modo Codex deba tener el Plugin MCP nativo `computer-use` de Codex
disponible antes de que comience el turno.

## Aplicación iOS

La aplicación iOS es independiente de Codex Computer Use. No instala ni actúa como proxy
del servidor MCP `computer-use` de Codex y no es un backend de control de escritorio.
En su lugar, la aplicación iOS se conecta como un nodo de OpenClaw y expone
capacidades móviles mediante comandos de nodo como `canvas.*`, `camera.*`, `screen.*`,
`location.*` y `talk.*`.

Usa [iOS](/es/platforms/ios) cuando quieras que un agente controle un nodo iPhone mediante
el Gateway. Usa esta página cuando un agente en modo Codex deba controlar el escritorio
local de macOS mediante el Plugin nativo Computer Use de Codex.

## MCP directo de cua-driver

Codex Computer Use no es la única forma de exponer control de escritorio. Si quieres que
los entornos de ejecución administrados por OpenClaw llamen directamente al controlador de TryCua, usa el servidor
`cua-driver mcp` upstream mediante el registro MCP de OpenClaw en lugar del
flujo de marketplace específico de Codex.

Después de instalar `cua-driver`, pídele el comando de OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

o registra tú mismo el servidor stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Ese camino mantiene intacta la superficie de herramientas MCP upstream, incluidos los esquemas
del controlador y las respuestas MCP estructuradas. Úsalo cuando quieras que el controlador CUA
esté disponible como un servidor MCP normal de OpenClaw. Usa la configuración de Codex Computer Use de
esta página cuando el app-server de Codex deba encargarse de la instalación de Plugins, las recargas de MCP
y las llamadas nativas a herramientas dentro de los turnos en modo Codex.

El controlador de CUA es específico de macOS y todavía requiere los permisos locales de macOS
que solicita su aplicación, como Accesibilidad y Grabación de pantalla. OpenClaw
no instala `cua-driver`, no concede esos permisos ni omite el modelo de seguridad
del controlador upstream.

## Configuración rápida

Establece `plugins.entries.codex.config.computerUse` cuando los turnos en modo Codex deban tener
Computer Use disponible antes de que comience un hilo:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Con esta configuración, OpenClaw comprueba el app-server de Codex antes de cada turno en modo Codex.
Si falta Computer Use pero el app-server de Codex ya descubrió un
marketplace instalable, OpenClaw le pide al app-server de Codex que instale o vuelva a habilitar
el Plugin y recargue los servidores MCP. En macOS, cuando no hay ningún marketplace coincidente
registrado y existe el paquete estándar de la aplicación Codex, OpenClaw también intenta
registrar el marketplace incluido de Codex desde
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` antes de
fallar. Si la configuración todavía no puede dejar disponible el servidor MCP, el turno falla
antes de que comience el hilo.

Las sesiones existentes conservan su entorno de ejecución y la vinculación de hilo de Codex. Después de cambiar
`agentRuntime` o la configuración de Computer Use, usa `/new` o `/reset` en el chat afectado
antes de probar.

## Comandos

Usa los comandos `/codex computer-use` desde cualquier superficie de chat donde esté disponible
la superficie de comandos del Plugin `codex`. Estos son comandos de chat/entorno de ejecución de OpenClaw,
no subcomandos de CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` es de solo lectura. No agrega fuentes de marketplace, instala Plugins ni
habilita la compatibilidad con Plugins de Codex.

`install` habilita la compatibilidad con Plugins del app-server de Codex, opcionalmente agrega una
fuente de marketplace configurada, instala o vuelve a habilitar el Plugin configurado mediante el app-server de Codex,
recarga los servidores MCP y verifica que el servidor MCP exponga herramientas.

## Opciones de marketplace

OpenClaw usa la misma API de app-server que expone el propio Codex. Los
campos de marketplace eligen dónde debe encontrar Codex `computer-use`.

| Campo                | Úsalo cuando                                                        | Compatibilidad de instalación                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Sin campo de marketplace | Quieres que el app-server de Codex use marketplaces que ya conoce. | Sí, cuando el app-server devuelve un marketplace local.        |
| `marketplaceSource`  | Tienes una fuente de marketplace de Codex que el app-server puede agregar.         | Sí, para `/codex computer-use install` explícito.         |
| `marketplacePath`    | Ya conoces la ruta local del archivo de marketplace en el host.   | Sí, para instalación explícita e instalación automática al inicio del turno.   |
| `marketplaceName`    | Quieres seleccionar por nombre un marketplace ya registrado.  | Sí, solo cuando el marketplace seleccionado tiene una ruta local. |

Los directorios de inicio nuevos de Codex pueden necesitar un breve momento para inicializar sus marketplaces oficiales.
Durante la instalación, OpenClaw sondea `plugin/list` durante hasta
`marketplaceDiscoveryTimeoutMs` milisegundos. El valor predeterminado es 60 segundos.

Si varios marketplaces conocidos contienen Computer Use, OpenClaw prefiere
`openai-bundled`, luego `openai-curated` y luego `local`. Las coincidencias ambiguas desconocidas
se rechazan por seguridad y te piden establecer `marketplaceName` o `marketplacePath`.

## Marketplace de macOS incluido

Las compilaciones recientes de Codex para escritorio incluyen Computer Use aquí:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Cuando `computerUse.autoInstall` es true y no hay registrado ningún marketplace que contenga
`computer-use`, OpenClaw intenta agregar automáticamente la raíz estándar del marketplace
incluido:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

También puedes registrarlo explícitamente desde una shell con Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Si usas una ruta no estándar de la aplicación Codex, establece `computerUse.marketplacePath` en una
ruta local de archivo de marketplace o ejecuta `/codex computer-use install --source
<marketplace-source>` una vez.

## Límite del catálogo remoto

El app-server de Codex puede listar y leer entradas de catálogo solo remotas, pero actualmente no
admite `plugin/install` remoto. Eso significa que `marketplaceName` puede
seleccionar un marketplace solo remoto para comprobaciones de estado, pero las instalaciones y reactivaciones
todavía necesitan un marketplace local mediante `marketplaceSource` o `marketplacePath`.

Si el estado indica que el Plugin está disponible en un marketplace remoto de Codex pero la instalación
remota no es compatible, ejecuta la instalación con una fuente o ruta local:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Referencia de configuración

| Campo                           | Valor predeterminado        | Significado                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferido       | Requiere Computer Use. El valor predeterminado es true cuando se establece otro campo de Computer Use. |
| `autoInstall`                   | false          | Instala o vuelve a habilitar desde marketplaces ya descubiertos al inicio del turno.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Cuánto tiempo espera la instalación al descubrimiento de marketplaces del app-server de Codex.             |
| `marketplaceSource`             | sin establecer          | Cadena de fuente pasada a `marketplace/add` del app-server de Codex.                    |
| `marketplacePath`               | sin establecer          | Ruta local de archivo de marketplace de Codex que contiene el Plugin.                       |
| `marketplaceName`               | sin establecer          | Nombre de marketplace registrado de Codex que se debe seleccionar.                                   |
| `pluginName`                    | `computer-use` | Nombre del Plugin de marketplace de Codex.                                                 |
| `mcpServerName`                 | `computer-use` | Nombre del servidor MCP expuesto por el Plugin instalado.                               |

La instalación automática al inicio del turno rechaza intencionalmente los valores `marketplaceSource`
configurados. Agregar una fuente nueva es una operación de configuración explícita, así que usa
`/codex computer-use install --source <marketplace-source>` una vez y luego deja que
`autoInstall` gestione futuras reactivaciones desde marketplaces locales descubiertos.
La instalación automática al inicio del turno puede usar un `marketplacePath` configurado, porque ya es
una ruta local en el host.

## Qué comprueba OpenClaw

OpenClaw informa internamente una razón de configuración estable y da formato al estado visible
para el usuario en el chat:

| Razón                       | Significado                                                | Siguiente paso                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` se resolvió como false.               | Establece `enabled` u otro campo de Computer Use.  |
| `marketplace_missing`        | No había disponible ningún marketplace coincidente.                 | Configura fuente, ruta o nombre de marketplace.  |
| `plugin_not_installed`       | Existe un marketplace, pero el Plugin no está instalado.   | Ejecuta install o habilita `autoInstall`.          |
| `plugin_disabled`            | El Plugin está instalado pero deshabilitado en la configuración de Codex.      | Ejecuta install para volver a habilitarlo.                  |
| `remote_install_unsupported` | El marketplace seleccionado es solo remoto.                   | Usa `marketplaceSource` o `marketplacePath`. |
| `mcp_missing`                | El Plugin está habilitado, pero el servidor MCP no está disponible.  | Comprueba Codex Computer Use y los permisos del sistema operativo.  |
| `ready`                      | El Plugin y las herramientas MCP están disponibles.                    | Inicia el turno en modo Codex.                    |
| `check_failed`               | Una solicitud al app-server de Codex falló durante la comprobación de estado. | Comprueba la conectividad y los registros del app-server.       |
| `auto_install_blocked`       | La configuración al inicio del turno necesitaría agregar una fuente nueva.       | Ejecuta primero la instalación explícita.                   |

La salida del chat incluye el estado del Plugin, el estado del servidor MCP, el marketplace, las herramientas
cuando están disponibles y el mensaje específico del paso de configuración que falla.

## Permisos de macOS

Computer Use es específico de macOS. El servidor MCP gestionado por Codex puede necesitar permisos
locales del sistema operativo antes de poder inspeccionar o controlar aplicaciones. Si OpenClaw dice que Computer Use
está instalado pero el servidor MCP no está disponible, verifica primero la configuración de Computer
Use del lado de Codex:

- Codex app-server se está ejecutando en el mismo host donde debe
  realizarse el control de escritorio.
- El Plugin Computer Use está habilitado en la configuración de Codex.
- El servidor MCP `computer-use` aparece en el estado MCP de Codex app-server.
- macOS ha concedido los permisos requeridos para la aplicación de control de escritorio.
- La sesión actual del host puede acceder al escritorio que se está controlando.

OpenClaw falla de forma cerrada intencionalmente cuando `computerUse.enabled` es true. Un
turno en modo Codex no debe continuar silenciosamente sin las herramientas nativas de escritorio
que exigía la configuración.

## Solución de problemas

**El estado indica que no está instalado.** Ejecuta `/codex computer-use install`. Si no se
descubre el catálogo, pasa `--source` o `--marketplace-path`.

**El estado indica que está instalado pero deshabilitado.** Ejecuta `/codex computer-use install` de nuevo.
La instalación de Codex app-server vuelve a escribir la configuración del Plugin como habilitada.

**El estado indica que la instalación remota no es compatible.** Usa una fuente o
ruta de catálogo local. Las entradas de catálogo solo remotas pueden inspeccionarse, pero no instalarse mediante la
API actual de app-server.

**El estado indica que el servidor MCP no está disponible.** Vuelve a ejecutar la instalación una vez para que los
servidores MCP se recarguen. Si sigue sin estar disponible, corrige la app Codex Computer Use,
el estado MCP de Codex app-server o los permisos de macOS.

**El estado o un sondeo agota el tiempo de espera en `computer-use.list_apps`.** El Plugin y el servidor MCP
están presentes, pero el puente local de Computer Use no respondió. Sal o
reinicia Codex Computer Use, vuelve a iniciar Codex Desktop si es necesario y luego reintenta en una
sesión nueva de OpenClaw.

**Una herramienta de Computer Use indica `Native hook relay unavailable`.** El hook de herramienta nativo de Codex
no pudo alcanzar un relay activo de OpenClaw mediante el puente local o el
respaldo de Gateway. Inicia una sesión nueva de OpenClaw con `/new` o `/reset`. Si
sigue ocurriendo, reinicia el gateway para que se descarten los hilos antiguos de app-server y los registros de hooks,
y luego reintenta.

**La instalación automática al inicio del turno rechaza una fuente.** Esto es intencional. Añade primero la
fuente con `/codex computer-use install --source <marketplace-source>` explícito,
y entonces las futuras instalaciones automáticas al inicio del turno podrán usar el catálogo local
descubierto.
