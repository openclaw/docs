---
read_when:
    - Quieres que los agentes de OpenClaw en modo Codex usen Codex Computer Use
    - Estás decidiendo entre Codex Computer Use, PeekabooBridge y MCP directo de cua-driver
    - Estás decidiendo entre Codex Computer Use y una configuración directa de MCP con cua-driver
    - Estás configurando computerUse para el plugin de Codex incluido
    - Estás solucionando problemas del estado o la instalación de uso de computadora de /codex
summary: Configura Codex Computer Use para agentes de OpenClaw en modo Codex
title: Uso de computadora de Codex
x-i18n:
    generated_at: "2026-06-27T12:09:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a595b8ae261c1cc9a1469217a31279cd3a116b0f11c16813ea018aab76b8c0d
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use es un plugin MCP nativo de Codex para controlar el escritorio local. OpenClaw
no incluye la aplicación de escritorio, no ejecuta acciones de escritorio por sí mismo ni omite
los permisos de Codex. El plugin `codex` incluido solo prepara Codex app-server:
habilita el soporte de plugins de Codex, encuentra o instala el plugin Codex
Computer Use configurado, comprueba que el servidor MCP `computer-use` esté disponible y
luego deja que Codex sea propietario de las llamadas nativas a herramientas MCP durante los turnos en modo Codex.

Usa esta página cuando OpenClaw ya esté usando el arnés nativo de Codex. Para la
configuración del runtime en sí, consulta [Arnés de Codex](/es/plugins/codex-harness).

## OpenClaw.app y Peekaboo

La integración de Peekaboo de OpenClaw.app es independiente de Codex Computer Use. La
aplicación de macOS puede alojar un socket PeekabooBridge para que la CLI `peekaboo` pueda reutilizar los
permisos locales de Accesibilidad y Grabación de pantalla de la aplicación para las propias
herramientas de automatización de Peekaboo. Ese puente no instala ni actúa como proxy de Codex Computer Use, y
Codex Computer Use no llama a través del socket PeekabooBridge.

Usa [Puente de Peekaboo](/es/platforms/mac/peekaboo) cuando quieras que OpenClaw.app sea
un host consciente de los permisos para la automatización de Peekaboo CLI. Usa esta página cuando un
agente de OpenClaw en modo Codex deba tener disponible el plugin MCP nativo `computer-use` de Codex
antes de que empiece el turno.

## Aplicación iOS

La aplicación iOS es independiente de Codex Computer Use. No instala ni actúa como proxy
del servidor MCP `computer-use` de Codex y no es un backend de control de escritorio.
En su lugar, la aplicación iOS se conecta como un nodo de OpenClaw y expone capacidades
móviles mediante comandos de nodo como `canvas.*`, `camera.*`, `screen.*`,
`location.*` y `talk.*`.

Usa [iOS](/es/platforms/ios) cuando quieras que un agente controle un nodo iPhone a través
del Gateway. Usa esta página cuando un agente en modo Codex deba controlar el escritorio local
de macOS mediante el plugin nativo Computer Use de Codex.

## MCP directo de cua-driver

Codex Computer Use no es la única forma de exponer el control de escritorio. Si quieres que
los runtimes gestionados por OpenClaw llamen directamente al driver de TryCua, usa el servidor
`cua-driver mcp` upstream a través del registro MCP de OpenClaw en lugar del flujo de marketplace
específico de Codex.

Después de instalar `cua-driver`, pídele el comando de OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

o registra tú mismo el servidor stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Esa ruta mantiene intacta la superficie de herramientas MCP upstream, incluidos los esquemas
del driver y las respuestas MCP estructuradas. Úsala cuando quieras que el driver CUA
esté disponible como un servidor MCP normal de OpenClaw. Usa la configuración de Codex Computer Use de
esta página cuando Codex app-server deba encargarse de la instalación del plugin, las recargas de MCP
y las llamadas nativas a herramientas dentro de los turnos en modo Codex.

El driver de CUA es específico de macOS y sigue requiriendo los permisos locales de macOS
que solicita su aplicación, como Accesibilidad y Grabación de pantalla. OpenClaw
no instala `cua-driver`, no concede esos permisos ni omite el modelo de seguridad
del driver upstream.

## Configuración rápida

Configura `plugins.entries.codex.config.computerUse` cuando los turnos en modo Codex deban tener
Computer Use disponible antes de que empiece un hilo. `autoInstall: true` activa
Computer Use y permite que OpenClaw lo instale o lo vuelva a habilitar antes del turno:

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
    },
  },
}
```

Con esta configuración, OpenClaw comprueba Codex app-server antes de cada turno en modo Codex.
Si falta Computer Use pero Codex app-server ya ha descubierto un marketplace
instalable, OpenClaw pide a Codex app-server que instale o vuelva a habilitar
el plugin y recargue los servidores MCP. En macOS, cuando no hay ningún marketplace coincidente
registrado y existe el paquete estándar de la aplicación Codex, OpenClaw también intenta
registrar el marketplace de Codex incluido desde
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` antes de que
falle. Si la configuración todavía no puede dejar disponible el servidor MCP, el turno falla
antes de que empiece el hilo.

Después de cambiar la configuración de Computer Use, usa `/new` o `/reset` en el chat afectado
antes de probar si ya ha empezado un hilo de Codex existente.

En el inicio stdio gestionado de macOS, OpenClaw prefiere el paquete firmado de la aplicación de escritorio Codex
en `/Applications/Codex.app/Contents/Resources/codex` cuando existe.
Eso mantiene Computer Use bajo el paquete de la aplicación que posee los permisos locales de control de escritorio.
Si la aplicación de escritorio no está instalada, OpenClaw recurre al binario de Codex
gestionado instalado junto al plugin. Si una aplicación de escritorio instalada
se inicializa con una versión de app-server no compatible, OpenClaw cierra ese proceso hijo
y vuelve a intentarlo con el siguiente candidato de binario gestionado en lugar de dejar que una
aplicación de escritorio obsoleta oculte la alternativa local del plugin. La configuración explícita de
`appServer.command` o `OPENCLAW_CODEX_APP_SERVER_BIN` sigue anulando esta selección
gestionada.

## Comandos

Usa los comandos `/codex computer-use` desde cualquier superficie de chat donde esté disponible la superficie de comandos
del plugin `codex`. Estos son comandos de chat/runtime de OpenClaw,
no subcomandos de la CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` es de solo lectura. No añade fuentes de marketplace, no instala plugins ni
habilita el soporte de plugins de Codex. Si ninguna configuración activa Computer Use, `status` puede
indicar deshabilitado incluso después de un comando de instalación puntual.

`install` habilita el soporte de plugins de Codex app-server, opcionalmente añade una fuente de
marketplace configurada, instala o vuelve a habilitar el plugin configurado a través de Codex
app-server, recarga los servidores MCP y verifica que el servidor MCP exponga herramientas.

## Opciones de marketplace

OpenClaw usa la misma API de app-server que expone el propio Codex. Los
campos de marketplace eligen dónde debe encontrar Codex `computer-use`.

| Campo                | Úsalo cuando                                                        | Soporte de instalación                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Sin campo de marketplace | Quieres que Codex app-server use marketplaces que ya conoce. | Sí, cuando app-server devuelve un marketplace local.        |
| `marketplaceSource`  | Tienes una fuente de marketplace de Codex que app-server puede añadir.         | Sí, para `/codex computer-use install` explícito.         |
| `marketplacePath`    | Ya conoces la ruta local del archivo de marketplace en el host.   | Sí, para instalación explícita y auto-instalación al inicio del turno.   |
| `marketplaceName`    | Quieres seleccionar por nombre un marketplace ya registrado.  | Sí, solo cuando el marketplace seleccionado tiene una ruta local. |

Los homes de Codex recién creados pueden necesitar un breve momento para inicializar sus marketplaces oficiales.
Durante la instalación, OpenClaw sondea `plugin/list` durante hasta
`marketplaceDiscoveryTimeoutMs` milisegundos. El valor predeterminado es 60 segundos.

Si varios marketplaces conocidos contienen Computer Use, OpenClaw prefiere
`openai-bundled`, luego `openai-curated` y luego `local`. Las coincidencias ambiguas desconocidas
fallan de forma cerrada y te piden configurar `marketplaceName` o `marketplacePath`.

## Marketplace de macOS incluido

Las compilaciones recientes de escritorio de Codex incluyen Computer Use aquí:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Cuando `computerUse.autoInstall` es true y no hay registrado ningún marketplace que contenga
`computer-use`, OpenClaw intenta añadir automáticamente la raíz estándar del marketplace
incluido:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

También puedes registrarlo explícitamente desde una shell con Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Si usas una ruta no estándar de la aplicación Codex, ejecuta `/codex computer-use install
--source <marketplace-root>` una vez o configura `computerUse.marketplacePath` con una
ruta de archivo de marketplace local. Usa `--marketplace-path` solo cuando tengas la
ruta del archivo JSON del marketplace, no la raíz del marketplace incluido.

## Límite del catálogo remoto

Codex app-server puede listar y leer entradas de catálogo solo remotas, pero actualmente no
admite `plugin/install` remoto. Eso significa que `marketplaceName` puede
seleccionar un marketplace solo remoto para comprobaciones de estado, pero las instalaciones y las reactivaciones
siguen necesitando un marketplace local mediante `marketplaceSource` o `marketplacePath`.

Si el estado dice que el plugin está disponible en un marketplace remoto de Codex pero la instalación
remota no está admitida, ejecuta la instalación con una fuente o ruta local:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Referencia de configuración

| Campo                           | Predeterminado        | Significado                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferido       | Requiere Computer Use. El valor predeterminado es true cuando se configura otro campo de Computer Use. |
| `autoInstall`                   | false          | Instala o vuelve a habilitar desde marketplaces ya descubiertos al inicio del turno.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Cuánto tiempo espera la instalación al descubrimiento de marketplaces de Codex app-server.             |
| `marketplaceSource`             | sin configurar          | Cadena de fuente pasada a `marketplace/add` de Codex app-server.                    |
| `marketplacePath`               | sin configurar          | Ruta de archivo local del marketplace de Codex que contiene el plugin.                       |
| `marketplaceName`               | sin configurar          | Nombre de marketplace de Codex registrado que seleccionar.                                   |
| `pluginName`                    | `computer-use` | Nombre del plugin en el marketplace de Codex.                                                 |
| `mcpServerName`                 | `computer-use` | Nombre del servidor MCP expuesto por el plugin instalado.                               |

La auto-instalación al inicio del turno rechaza intencionadamente los valores configurados de `marketplaceSource`.
Añadir una nueva fuente es una operación de configuración explícita, así que usa
`/codex computer-use install --source <marketplace-source>` una vez y luego deja que
`autoInstall` gestione futuras reactivaciones desde marketplaces locales descubiertos.
La auto-instalación al inicio del turno puede usar un `marketplacePath` configurado, porque ya es
una ruta local en el host.

## Qué comprueba OpenClaw

OpenClaw informa internamente de un motivo de configuración estable y formatea el estado visible para el usuario
para el chat:

| Motivo                       | Significado                                            | Siguiente paso                                |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` se resolvió como false.          | Define `enabled` u otro campo de Computer Use. |
| `marketplace_missing`        | No había ningún marketplace coincidente disponible.    | Configura la fuente, la ruta o el nombre del marketplace. |
| `plugin_not_installed`       | El marketplace existe, pero el plugin no está instalado. | Ejecuta la instalación o habilita `autoInstall`. |
| `plugin_disabled`            | El Plugin está instalado pero deshabilitado en la configuración de Codex. | Ejecuta la instalación para volver a habilitarlo. |
| `remote_install_unsupported` | El marketplace seleccionado es solo remoto.            | Usa `marketplaceSource` o `marketplacePath`. |
| `mcp_missing`                | El Plugin está habilitado, pero el servidor MCP no está disponible. | Revisa Computer Use de Codex y los permisos del SO. |
| `ready`                      | El Plugin y las herramientas MCP están disponibles.    | Inicia el turno en modo Codex.                |
| `check_failed`               | Una solicitud al app-server de Codex falló durante la comprobación de estado. | Revisa la conectividad y los registros del app-server. |
| `auto_install_blocked`       | La configuración al inicio del turno tendría que agregar una fuente nueva. | Ejecuta primero la instalación explícita.     |

La salida del chat incluye el estado del plugin, el estado del servidor MCP, el marketplace, las herramientas
cuando están disponibles y el mensaje específico del paso de configuración que falla.

## Permisos de macOS

Computer Use es específico de macOS. El servidor MCP propiedad de Codex puede necesitar permisos locales del SO
antes de poder inspeccionar o controlar aplicaciones. Si OpenClaw indica que Computer Use
está instalado pero el servidor MCP no está disponible, verifica primero la configuración de Computer
Use del lado de Codex:

- El app-server de Codex se está ejecutando en el mismo host donde debe ocurrir el control del escritorio.
- El plugin Computer Use está habilitado en la configuración de Codex.
- El servidor MCP `computer-use` aparece en el estado MCP del app-server de Codex.
- macOS ha concedido los permisos requeridos para la aplicación de control del escritorio.
- La sesión actual del host puede acceder al escritorio que se está controlando.

OpenClaw falla intencionalmente de forma cerrada cuando `computerUse.enabled` es true. Un
turno en modo Codex no debería continuar silenciosamente sin las herramientas nativas de escritorio
que la configuración requería.

## Solución de problemas

**El estado dice que no está instalado.** Ejecuta `/codex computer-use install`. Si no se
descubre el marketplace, pasa `--source` o `--marketplace-path`.

**El estado dice que está instalado pero deshabilitado.** Ejecuta `/codex computer-use install` de nuevo.
La instalación del app-server de Codex vuelve a escribir la configuración del plugin como habilitada.

**El estado dice que la instalación remota no es compatible.** Usa una fuente o ruta de marketplace local.
Las entradas de catálogo solo remotas se pueden inspeccionar, pero no instalar mediante la
API actual del app-server.

**El estado dice que el servidor MCP no está disponible.** Vuelve a ejecutar la instalación una vez para que se recarguen
los servidores MCP. Si sigue sin estar disponible, corrige la aplicación Codex Computer Use,
el estado MCP del app-server de Codex o los permisos de macOS.

**El estado o una sonda agota el tiempo de espera en `computer-use.list_apps`.** El plugin y el servidor MCP
están presentes, pero el puente local de Computer Use no respondió. Cierra o
reinicia Codex Computer Use, vuelve a iniciar Codex Desktop si es necesario y luego reintenta en una
sesión nueva de OpenClaw. Si el host ejecutó anteriormente Computer Use mediante un app-server de Codex
administrado más antiguo, actualiza el plugin instalado desde el marketplace incluido en la aplicación de escritorio:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Una herramienta de Computer Use dice `Native hook relay unavailable`.** El hook nativo de Codex
no pudo alcanzar un relé activo de OpenClaw mediante el puente local o el fallback del Gateway.
Inicia una sesión nueva de OpenClaw con `/new` o `/reset`. Si funciona una vez y luego
vuelve a fallar en una llamada posterior a una herramienta, `/new` solo está despejando el
intento actual; reinicia el app-server de Codex o el Gateway de OpenClaw para que se descarten los hilos antiguos
y los registros de hooks, y luego reintenta en una sesión nueva.

**La instalación automática al inicio del turno rechaza una fuente.** Esto es intencional. Agrega la
fuente primero con `/codex computer-use install --source <marketplace-source>` explícito;
después, la futura instalación automática al inicio del turno podrá usar el marketplace local
descubierto.

## Relacionado

- [Arnés de Codex](/es/plugins/codex-harness)
- [Puente Peekaboo](/es/platforms/mac/peekaboo)
- [Aplicación iOS](/es/platforms/ios)
