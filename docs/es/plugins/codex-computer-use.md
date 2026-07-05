---
read_when:
    - Quieres que los agentes de OpenClaw en modo Codex usen Codex Computer Use
    - Estás decidiendo entre Codex Computer Use, PeekabooBridge y MCP directo de cua-driver
    - Está decidiendo entre Codex Computer Use y una configuración directa de MCP de cua-driver
    - Estás configurando computerUse para el plugin Codex incluido
    - Estás solucionando problemas del estado o la instalación de /codex computer-use
summary: Configurar Codex Computer Use para agentes OpenClaw en modo Codex
title: Uso de computadora de Codex
x-i18n:
    generated_at: "2026-07-05T11:28:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8ce6ef3a14f359b64855fee933425f40fc9f34e94572b68c7dee605ac896983f
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Uso de computadora es un Plugin MCP nativo de Codex para el control del escritorio local. OpenClaw
no incluye la aplicación de escritorio como proveedor, no ejecuta acciones de escritorio por sí mismo ni omite
los permisos de Codex. El Plugin incluido `codex` solo prepara el servidor de aplicaciones de Codex:
habilita el soporte de plugins de Codex, encuentra o instala el Plugin de Uso de computadora
configurado, verifica que el servidor MCP `computer-use` esté disponible y luego deja que
Codex sea dueño de las llamadas nativas a herramientas MCP durante los turnos en modo Codex.

Usa esta página cuando OpenClaw ya esté usando el arnés nativo de Codex. Para la
configuración del runtime en sí, consulta [Arnés de Codex](/es/plugins/codex-harness).

## OpenClaw.app y Peekaboo

La integración de Peekaboo de OpenClaw.app está separada de Uso de computadora de Codex. La
aplicación de macOS puede alojar un socket PeekabooBridge para que la CLI `peekaboo` pueda reutilizar las
concesiones locales de Accesibilidad y Grabación de pantalla de la aplicación para las propias
herramientas de automatización de Peekaboo. Ese puente no instala ni hace proxy de Uso de computadora de Codex, y
Uso de computadora de Codex no llama a través del socket PeekabooBridge.

Usa [Puente de Peekaboo](/es/platforms/mac/peekaboo) cuando quieras que OpenClaw.app sea
un host consciente de permisos para la automatización de la CLI de Peekaboo. Usa esta página cuando un
agente de OpenClaw en modo Codex deba tener disponible el Plugin MCP `computer-use` nativo de Codex
antes de que empiece el turno.

## Aplicación iOS

La aplicación iOS está separada de Uso de computadora de Codex. No instala ni hace proxy
del servidor MCP `computer-use` de Codex, y no es un backend de control de escritorio.
En su lugar, la aplicación iOS se conecta como un nodo de OpenClaw y expone capacidades
móviles mediante comandos de nodo como `canvas.*`, `camera.*`, `screen.*`,
`location.*` y `talk.*`.

Usa [iOS](/es/platforms/ios) cuando quieras que un agente controle un nodo iPhone
a través del Gateway. Usa esta página cuando un agente en modo Codex deba controlar el
escritorio local de macOS mediante el Plugin nativo Computer Use de Codex.

## MCP directo de cua-driver

Uso de computadora de Codex no es la única forma de exponer control de escritorio. Si quieres
que los runtimes gestionados por OpenClaw llamen directamente al controlador de TryCua, usa el servidor
`cua-driver mcp` upstream a través del registro MCP de OpenClaw en lugar del
flujo de marketplace específico de Codex.

Después de instalar `cua-driver`, pídele el comando de OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

o registra directamente el servidor stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Esa ruta mantiene intacta la superficie de herramientas MCP upstream, incluidos los esquemas
del controlador y las respuestas MCP estructuradas. Úsala cuando quieras que el controlador CUA
esté disponible como un servidor MCP normal de OpenClaw. Usa la configuración de Uso de computadora de Codex de
esta página cuando el servidor de aplicaciones de Codex deba hacerse cargo de la instalación de plugins, las recargas de MCP
y las llamadas nativas a herramientas dentro de turnos en modo Codex.

El controlador de CUA es específico de macOS y aún requiere los permisos locales de macOS
que solicita su aplicación, como Accesibilidad y Grabación de pantalla. OpenClaw no
instala `cua-driver`, no concede esos permisos ni omite el modelo de seguridad del
controlador upstream.

## Configuración rápida

Define `plugins.entries.codex.config.computerUse` cuando los turnos en modo Codex deban tener
Uso de computadora disponible antes de que empiece un hilo. `autoInstall: true` activa
Uso de computadora y permite que OpenClaw lo instale o lo vuelva a habilitar antes del turno:

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

Con esta configuración, OpenClaw verifica el servidor de aplicaciones de Codex antes de cada turno en modo Codex.
Si falta Uso de computadora pero el servidor de aplicaciones de Codex ya descubrió
un marketplace instalable, OpenClaw le pide al servidor de aplicaciones de Codex que instale o
vuelva a habilitar el Plugin y recargue los servidores MCP. En macOS, cuando no hay ningún
marketplace coincidente registrado y existe el paquete estándar de la aplicación Codex, OpenClaw
también intenta registrar el marketplace de Codex incluido desde
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` antes de
fallar. Si la configuración aún no puede hacer disponible el servidor MCP, el turno falla
antes de que empiece el hilo.

Después de cambiar la configuración de Uso de computadora, usa `/new` o `/reset` en el chat
afectado antes de probar si ya se inició un hilo de Codex existente.

En el inicio stdio gestionado en macOS, OpenClaw prefiere el paquete firmado de la aplicación de escritorio Codex
en `/Applications/Codex.app/Contents/Resources/codex` cuando existe.
Eso mantiene Uso de computadora bajo el paquete de la aplicación que posee los permisos locales
de control de escritorio. Si la aplicación de escritorio no está instalada, OpenClaw
recurre al binario gestionado de Codex instalado junto al Plugin. Si una
aplicación de escritorio instalada se inicializa con una versión de servidor de aplicaciones no compatible,
OpenClaw cierra ese proceso hijo y reintenta con el siguiente candidato de binario gestionado
en lugar de permitir que una aplicación de escritorio obsoleta oculte la alternativa local del Plugin.
La configuración explícita `appServer.command` o `OPENCLAW_CODEX_APP_SERVER_BIN` aún
anula esta selección gestionada.

## Comandos

Usa los comandos `/codex computer-use` desde cualquier superficie de chat donde la
superficie de comandos del Plugin `codex` esté disponible. Estos son comandos de chat/runtime
de OpenClaw, no subcomandos de la CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` es la acción predeterminada y es de solo lectura: no agrega fuentes de marketplace,
no instala plugins ni habilita el soporte de plugins de Codex. Si ninguna configuración activa
Uso de computadora, `status` puede informar que está deshabilitado incluso después de un comando
de instalación puntual.

`install` habilita el soporte de plugins del servidor de aplicaciones de Codex, agrega opcionalmente una
fuente de marketplace configurada, instala o vuelve a habilitar el Plugin configurado
mediante el servidor de aplicaciones de Codex, recarga los servidores MCP y verifica que el servidor MCP
exponga herramientas. Como la instalación cambia recursos de host de confianza,
solo un propietario o un cliente Gateway `operator.admin` puede ejecutar `install`. Otros
remitentes autorizados pueden seguir usando el comando `status` de solo lectura,
incluido con anulaciones.

## Opciones de marketplace

OpenClaw usa la misma API de servidor de aplicaciones que expone el propio Codex. Los
campos de marketplace eligen dónde debe encontrar Codex `computer-use`.

| Campo                | Úsalo cuando                                                        | Soporte de instalación                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Sin campo de marketplace | Quieres que el servidor de aplicaciones de Codex use marketplaces que ya conoce. | Sí, cuando el servidor de aplicaciones devuelve un marketplace local.        |
| `marketplaceSource`  | Tienes una fuente de marketplace de Codex que el servidor de aplicaciones puede agregar.         | Sí, para `/codex computer-use install` explícito.         |
| `marketplacePath`    | Ya conoces la ruta local del archivo de marketplace en el host.   | Sí, para instalación explícita y autoinstalación al inicio del turno.   |
| `marketplaceName`    | Quieres seleccionar por nombre un marketplace ya registrado.  | Sí, solo cuando el marketplace seleccionado tiene una ruta local. |

Los hogares de Codex nuevos pueden necesitar un breve momento para sembrar sus
marketplaces oficiales. Durante la instalación, OpenClaw sondea `plugin/list` durante hasta
`marketplaceDiscoveryTimeoutMs` milisegundos (valor predeterminado: 60 segundos).

Si varios marketplaces conocidos contienen Uso de computadora, OpenClaw prefiere
`openai-bundled`, luego `openai-curated` y luego `local`. Las coincidencias ambiguas
desconocidas fallan de forma cerrada y te piden definir `marketplaceName` o
`marketplacePath`.

## Marketplace incluido de macOS

Las compilaciones recientes de escritorio de Codex incluyen Uso de computadora aquí:

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

Si usas una ruta no estándar para la aplicación Codex, ejecuta una vez `/codex computer-use install
--source <marketplace-root>`, o define `computerUse.marketplacePath` con una
ruta local de archivo de marketplace. Usa `--marketplace-path` solo cuando tengas la
ruta del archivo JSON del marketplace, no la raíz del marketplace incluido.

## Límite del catálogo remoto

El servidor de aplicaciones de Codex puede listar y leer entradas de catálogo solo remotas, pero actualmente
no admite `plugin/install` remoto. Eso significa que `marketplaceName`
puede seleccionar un marketplace solo remoto para verificaciones de estado, pero las instalaciones y
rehabilitaciones aún necesitan un marketplace local mediante `marketplaceSource` o
`marketplacePath`.

Si el estado dice que el Plugin está disponible en un marketplace remoto de Codex pero
la instalación remota no es compatible, ejecuta la instalación con una fuente o ruta local:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Referencia de configuración

| Campo                           | Predeterminado        | Significado                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferido       | Requiere Uso de computadora. El valor predeterminado es true cuando se define otro campo de Uso de computadora. |
| `autoInstall`                   | false          | Instala o vuelve a habilitar desde marketplaces ya descubiertos al inicio del turno.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Cuánto tiempo espera la instalación al descubrimiento de marketplaces del servidor de aplicaciones de Codex.             |
| `marketplaceSource`             | sin definir          | Cadena de fuente pasada a `marketplace/add` del servidor de aplicaciones de Codex.                    |
| `marketplacePath`               | sin definir          | Ruta local del archivo de marketplace de Codex que contiene el Plugin.                       |
| `marketplaceName`               | sin definir          | Nombre de marketplace de Codex registrado que se seleccionará.                                   |
| `pluginName`                    | `computer-use` | Nombre del Plugin en el marketplace de Codex.                                                 |
| `mcpServerName`                 | `computer-use` | Nombre del servidor MCP expuesto por el Plugin instalado.                               |

La autoinstalación al inicio del turno rechaza intencionalmente los valores configurados de `marketplaceSource`.
Agregar una fuente nueva es una operación de configuración explícita, así que usa
`/codex computer-use install --source <marketplace-source>` una vez y luego deja que
`autoInstall` gestione futuras rehabilitaciones desde marketplaces locales descubiertos.
La autoinstalación al inicio del turno puede usar un `marketplacePath` configurado, porque esa
ya es una ruta local en el host.

Cada campo también acepta una anulación mediante variable de entorno, verificada cuando la
clave de configuración correspondiente no está definida:

| Campo                           | Variable de entorno                                                        |
| ------------------------------- | -------------------------------------------------------------- |
| `enabled`                       | `OPENCLAW_CODEX_COMPUTER_USE`                                  |
| `autoInstall`                   | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_INSTALL`                     |
| `marketplaceDiscoveryTimeoutMs` | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_DISCOVERY_TIMEOUT_MS` |
| `marketplaceSource`             | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_SOURCE`               |
| `marketplacePath`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_PATH`                 |
| `marketplaceName`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_NAME`                 |
| `pluginName`                    | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_NAME`                      |
| `mcpServerName`                 | `OPENCLAW_CODEX_COMPUTER_USE_MCP_SERVER_NAME`                  |

## Qué comprueba OpenClaw

OpenClaw informa internamente de un motivo de configuración estable y da formato al estado visible para el usuario en el chat:

| Motivo                       | Significado                                           | Siguiente paso                                |
| ---------------------------- | ----------------------------------------------------- | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` se resolvió en false.           | Define `enabled` u otro campo de Computer Use. |
| `marketplace_missing`        | No había ningún marketplace coincidente disponible.   | Configura el origen, la ruta o el nombre del marketplace. |
| `plugin_not_installed`       | El marketplace existe, pero el plugin no está instalado. | Ejecuta la instalación o habilita `autoInstall`. |
| `plugin_disabled`            | El Plugin está instalado, pero deshabilitado en la configuración de Codex. | Ejecuta la instalación para volver a habilitarlo. |
| `remote_install_unsupported` | El marketplace seleccionado es solo remoto.           | Usa `marketplaceSource` o `marketplacePath`. |
| `mcp_missing`                | El Plugin está habilitado, pero el servidor MCP no está disponible. | Comprueba Computer Use de Codex y los permisos del SO. |
| `ready`                      | El Plugin y las herramientas MCP están disponibles.   | Inicia el turno en modo Codex.                |
| `check_failed`               | Falló una solicitud al servidor de aplicaciones de Codex durante la comprobación de estado. | Comprueba la conectividad y los registros del servidor de aplicaciones. |
| `auto_install_blocked`       | La configuración al inicio del turno tendría que añadir un origen nuevo. | Ejecuta primero una instalación explícita.    |

La salida del chat incluye el estado del plugin, el estado del servidor MCP, el marketplace, las herramientas cuando están disponibles y el mensaje específico del paso de configuración que falla.

## Permisos de macOS

Computer Use es específico de macOS. Es posible que el servidor MCP propiedad de Codex necesite permisos locales del SO antes de poder inspeccionar o controlar aplicaciones. Si OpenClaw indica que Computer Use está instalado, pero el servidor MCP no está disponible, verifica primero la configuración de Computer Use del lado de Codex:

- El servidor de aplicaciones de Codex se está ejecutando en el mismo host donde debe producirse el control del escritorio.
- El plugin Computer Use está habilitado en la configuración de Codex.
- El servidor MCP `computer-use` aparece en el estado MCP del servidor de aplicaciones de Codex.
- macOS ha concedido los permisos necesarios para la aplicación de control de escritorio.
- La sesión actual del host puede acceder al escritorio que se está controlando.

OpenClaw falla de forma cerrada intencionadamente cuando `computerUse.enabled` es true. Un turno en modo Codex no debería continuar silenciosamente sin las herramientas nativas de escritorio que exigía la configuración.

## Solución de problemas

**El estado indica que no está instalado.** Ejecuta `/codex computer-use install`. Si no se descubre el marketplace, pasa `--source` o `--marketplace-path`.

**El estado indica que está instalado pero deshabilitado.** Ejecuta `/codex computer-use install` de nuevo. La instalación del servidor de aplicaciones de Codex vuelve a escribir la configuración del plugin como habilitada.

**El estado indica que la instalación remota no es compatible.** Usa un origen o una ruta de marketplace local. Las entradas de catálogo solo remotas se pueden inspeccionar, pero no instalar mediante la API actual del servidor de aplicaciones.

**El estado indica que el servidor MCP no está disponible.** Vuelve a ejecutar la instalación una vez para que los servidores MCP se recarguen. Si sigue sin estar disponible, corrige la aplicación Codex Computer Use, el estado MCP del servidor de aplicaciones de Codex o los permisos de macOS.

**El estado o una sonda agota el tiempo de espera en `computer-use.list_apps`.** El plugin y el servidor MCP están presentes, pero el puente local de Computer Use no respondió. Cierra o reinicia Codex Computer Use, reinicia Codex Desktop si es necesario y vuelve a intentarlo en una sesión nueva de OpenClaw. Si el host ejecutó antes Computer Use mediante un servidor de aplicaciones de Codex administrado antiguo, actualiza el plugin instalado desde el marketplace incluido en el escritorio:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Una herramienta de Computer Use indica `Native hook relay unavailable`.** El hook de herramienta nativo de Codex no pudo alcanzar un relay activo de OpenClaw a través del puente local o del fallback del Gateway. Inicia una sesión nueva de OpenClaw con `/new` o `/reset`. Si funciona una vez y vuelve a fallar en una llamada de herramienta posterior, `/new` solo está limpiando el intento actual; reinicia el servidor de aplicaciones de Codex o el Gateway de OpenClaw para que se descarten los hilos antiguos y los registros de hooks, y vuelve a intentarlo en una sesión nueva.

**La instalación automática al inicio del turno rechaza un origen.** Esto es intencionado. Añade primero el origen con `/codex computer-use install --source
<marketplace-source>` explícito; después, futuras instalaciones automáticas al inicio del turno podrán usar el marketplace local descubierto.

## Relacionado

- [Arnés de Codex](/es/plugins/codex-harness)
- [Puente Peekaboo](/es/platforms/mac/peekaboo)
- [Aplicación iOS](/es/platforms/ios)
