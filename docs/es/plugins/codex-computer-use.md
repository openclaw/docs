---
read_when:
    - Quieres que los agentes de OpenClaw en modo Codex usen Codex Computer Use
    - Estás decidiendo entre Codex Computer Use, PeekabooBridge y el MCP directo de cua-driver
    - Estás configurando computerUse para el plugin Codex incluido
    - Estás solucionando problemas con el estado o la instalación del uso de computadora de /codex
summary: Configura Codex Computer Use para agentes de OpenClaw en modo Codex
title: Uso del ordenador con Codex
x-i18n:
    generated_at: "2026-07-11T23:16:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a55ee330c4952c8bcc97c3178a85a67ea3b7964e6880277bd41d2bfc750e3138
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use es un Plugin MCP nativo de Codex para controlar el escritorio local. OpenClaw
no incluye la aplicación de escritorio, no ejecuta por sí mismo acciones de escritorio ni elude
los permisos de Codex. El Plugin `codex` incluido solo prepara Codex app-server:
habilita la compatibilidad con Plugins de Codex, busca o instala el Plugin Computer Use
configurado, comprueba que el servidor MCP `computer-use` esté disponible y, después, permite
que Codex gestione las llamadas nativas a herramientas MCP durante los turnos en modo Codex.

Use esta página cuando OpenClaw ya utilice el entorno nativo de Codex. Para consultar la
configuración del entorno de ejecución, consulte [Entorno de Codex](/es/plugins/codex-harness).

Esto es distinto de la [herramienta informática integrada respaldada por Node](/es/nodes/computer-use) de OpenClaw. Use la herramienta integrada cuando el mismo contrato de agente deba controlar un Mac emparejado, tanto si el agente se ejecuta en el Gateway como en otro Node. Use Codex Computer Use cuando Codex app-server deba gestionar la instalación local de MCP, los permisos y las llamadas nativas a herramientas.

## OpenClaw.app y Peekaboo

La integración de Peekaboo de OpenClaw.app es independiente de Codex Computer Use. La
aplicación para macOS puede alojar un socket PeekabooBridge para que la CLI `peekaboo` reutilice
los permisos locales de Accesibilidad y Grabación de pantalla de la aplicación para las propias
herramientas de automatización de Peekaboo. Ese puente no instala ni actúa como proxy de Codex Computer Use, y
Codex Computer Use no realiza llamadas a través del socket PeekabooBridge.

Use [Puente de Peekaboo](/es/platforms/mac/peekaboo) cuando quiera que OpenClaw.app sea
un host que tenga en cuenta los permisos para la automatización de la CLI de Peekaboo. Use esta página cuando un
agente de OpenClaw en modo Codex deba tener disponible el Plugin MCP `computer-use` nativo
de Codex antes de que comience el turno.

## Aplicación para iOS

La aplicación para iOS es independiente de Codex Computer Use. No instala ni actúa como proxy
del servidor MCP `computer-use` de Codex y no es un backend de control de escritorio.
En su lugar, la aplicación para iOS se conecta como un Node de OpenClaw y expone
capacidades móviles mediante comandos de Node como `canvas.*`, `camera.*`, `screen.*`,
`location.*` y `talk.*`.

Use [iOS](/es/platforms/ios) cuando quiera que un agente controle un Node iPhone
a través del Gateway. Use esta página cuando un agente en modo Codex deba controlar el
escritorio local de macOS mediante el Plugin Computer Use nativo de Codex.

## MCP directo de cua-driver

Codex Computer Use no es la única forma de exponer el control del escritorio. Si quiere
que los entornos de ejecución gestionados por OpenClaw llamen directamente al controlador de TryCua, use el servidor
`cua-driver mcp` original mediante el registro MCP de OpenClaw en lugar del
flujo del mercado específico de Codex.

Después de instalar `cua-driver`, pídale el comando de OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

o registre directamente el servidor stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Esa ruta mantiene intacta la superficie de herramientas MCP original, incluidos los esquemas
del controlador y las respuestas MCP estructuradas. Úsela cuando quiera que el controlador CUA
esté disponible como un servidor MCP normal de OpenClaw. Use la configuración de Codex Computer Use de
esta página cuando Codex app-server deba gestionar la instalación del Plugin, las recargas de MCP
y las llamadas nativas a herramientas dentro de los turnos en modo Codex.

El controlador de CUA es específico de macOS y sigue necesitando los permisos locales de macOS
que solicita su aplicación, como Accesibilidad y Grabación de pantalla. OpenClaw no
instala `cua-driver`, no concede esos permisos ni elude el modelo de seguridad
del controlador original.

## Configuración rápida

Establezca `plugins.entries.codex.config.computerUse` cuando los turnos en modo Codex deban tener
Computer Use disponible antes de que se inicie un hilo. `autoInstall: true` activa
Computer Use y permite que OpenClaw lo instale o vuelva a habilitarlo antes del turno:

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
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Con esta configuración, OpenClaw comprueba Codex app-server antes de cada turno en modo Codex.
Si falta Computer Use, pero Codex app-server ya ha detectado
un mercado instalable, OpenClaw solicita a Codex app-server que instale o
vuelva a habilitar el Plugin y recargue los servidores MCP. En macOS, cuando no hay registrado ningún
mercado coincidente y existe un paquete estándar de la aplicación de escritorio, OpenClaw
también intenta registrar el mercado de Codex incluido desde
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled`, y conserva
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`
como alternativa para instalaciones independientes antiguas. Si la configuración sigue sin poder hacer que el
servidor MCP esté disponible, el turno falla antes de que se inicie el hilo.

Después de cambiar la configuración de Computer Use, use `/new` o `/reset` en el
chat afectado antes de realizar pruebas si ya se ha iniciado un hilo de Codex existente.

En macOS, el inicio gestionado de Computer Use prioriza el binario de la aplicación de escritorio en
`/Applications/ChatGPT.app/Contents/Resources/codex` y, después, utiliza
`/Applications/Codex.app/Contents/Resources/codex` como alternativa para instalaciones
independientes antiguas. Esto también se aplica a los comandos puntuales de estado e
instalación de Computer Use que inician su propio cliente. Así, el control del escritorio permanece bajo
el paquete de la aplicación que posee los permisos locales de macOS. Si la aplicación de escritorio no está
instalada, OpenClaw utiliza como alternativa el binario gestionado de Codex instalado junto al
Plugin. Los turnos gestionados normales de Codex con el directorio de inicio aislado predeterminado del agente priorizan
ese paquete fijado para que una aplicación de escritorio antigua no pueda ocultar la compatibilidad con modelos
actuales. Los directorios de inicio con ámbito de usuario siguen priorizando el escritorio porque pueden cargar el estado
nativo de Computer Use. Un directorio de inicio aislado del agente cuya configuración efectiva de Codex habilite
Computer Use también sigue priorizando el escritorio. La configuración explícita
`appServer.command` o `OPENCLAW_CODEX_APP_SERVER_BIN` continúa prevaleciendo
sobre esta selección gestionada.

OpenClaw serializa las lecturas de la configuración nativa de Codex y la instalación de Computer Use
dentro de un único Gateway en ejecución. Un proceso de Codex independiente u otro Gateway no
forman parte de ese bloqueo. Después de cambiar la configuración nativa del Plugin de Codex fuera del
Gateway, reinicie el Gateway e inicie un chat nuevo antes de depender de la nueva
selección.

## Comandos

Use los comandos `/codex computer-use` desde cualquier superficie de chat donde esté
disponible la superficie de comandos del Plugin `codex`. Estos son comandos de chat y del entorno de ejecución
de OpenClaw, no subcomandos de la CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` es la acción predeterminada y es de solo lectura: no añade fuentes de mercados,
no instala Plugins ni habilita la compatibilidad con Plugins de Codex. Si ninguna configuración activa
Computer Use, `status` puede indicar que está deshabilitado incluso después de un comando puntual de
instalación.

`install` habilita la compatibilidad con Plugins de Codex app-server, añade opcionalmente una
fuente de mercado configurada, instala o vuelve a habilitar el Plugin configurado
mediante Codex app-server, recarga los servidores MCP y verifica que el servidor MCP
exponga herramientas. Dado que la instalación modifica recursos de confianza del host,
solo un propietario o un cliente `operator.admin` del Gateway puede ejecutar `install`. Los demás
remitentes autorizados pueden seguir usando el comando `status` de solo lectura,
incluso con anulaciones.

Las versiones anteriores aceptaban anulaciones puntuales de identidad mediante `--plugin`, `--server` y `--mcp-server`.
En su lugar, configure de forma persistente `computerUse.pluginName` y
`computerUse.mcpServerName`. Cuando se usa una opción de identidad antigua,
el comando identifica el ajuste exacto que debe persistirse y repite la
acción solicitada junto con las opciones de mercado compatibles en sus instrucciones de migración.

## Opciones de mercado

OpenClaw usa la misma API de app-server que expone el propio Codex. Los
campos de mercado eligen dónde debe buscar Codex `computer-use`.

| Campo                | Cuándo usarlo                                                        | Compatibilidad con la instalación                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Sin campo de mercado | Quiere que Codex app-server use los mercados que ya conoce. | Sí, cuando app-server devuelve un mercado local.        |
| `marketplaceSource`  | Tiene una fuente de mercado de Codex que app-server puede añadir.         | Sí, para `/codex computer-use install` explícito.         |
| `marketplacePath`    | Ya conoce la ruta local del archivo de mercado en el host.   | Sí, para la instalación explícita y la instalación automática al iniciar el turno.   |
| `marketplaceName`    | Quiere seleccionar por nombre un mercado ya registrado.  | Sí, solo cuando el mercado seleccionado tiene una ruta local. |

Los directorios de inicio nuevos de Codex pueden necesitar un breve momento para inicializar sus
mercados oficiales. Durante la instalación, OpenClaw consulta `plugin/list` durante un máximo de
`marketplaceDiscoveryTimeoutMs` milisegundos (60 segundos de forma predeterminada).

Si varios mercados conocidos contienen Computer Use, OpenClaw prioriza
`openai-bundled`, después `openai-curated` y, por último, `local`. Las coincidencias ambiguas
desconocidas fallan de forma segura y le piden que establezca `marketplaceName` o
`marketplacePath`.

## Mercado incluido de macOS

Las compilaciones actuales de escritorio de ChatGPT incluyen Computer Use aquí; las compilaciones antiguas
independientes de escritorio de Codex usan la misma estructura bajo `Codex.app`:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Cuando `computerUse.autoInstall` es true y no hay registrado ningún mercado que contenga
`computer-use`, OpenClaw intenta añadir la primera raíz estándar de mercado
incluido que exista:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

También puede registrarlo explícitamente desde un shell con Codex:

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

Si usa una ruta no estándar para la aplicación de Codex, ejecute `/codex computer-use install
--source <marketplace-root>` una vez o establezca `computerUse.marketplacePath` en una
ruta local del archivo de mercado. Use `--marketplace-path` solo cuando tenga la
ruta del archivo JSON del mercado, no la raíz del mercado incluido.

### Caché compartida de Plugins

El valor predeterminado `pluginCacheMode: "independent"` deja sin gestionar cada directorio de inicio de Codex y su
caché de Plugins. Establezca `pluginCacheMode: "shared"` para copiar el Plugin
Computer Use incluido en la caché de Plugins detectable del directorio de inicio activo de Codex
antes de iniciar app-server. El modo compartido conserva las versiones anteriores almacenadas en caché porque
los clientes de Codex en ejecución aún pueden hacer referencia a sus directorios versionados del Plugin; si
falla la copia de sustitución, también se conserva la caché activa. La configuración explícita de
`marketplaceName` o `marketplacePath` deshabilita esta
conciliación para que OpenClaw no sustituya esa selección.

## Limitación del catálogo remoto

Codex app-server puede enumerar y leer entradas de catálogo exclusivamente remotas, pero
actualmente no admite `plugin/install` remoto. Esto significa que `marketplaceName`
puede seleccionar un mercado exclusivamente remoto para las comprobaciones de estado, pero las instalaciones y
reactivaciones siguen necesitando un mercado local mediante `marketplaceSource` o
`marketplacePath`.

Si el estado indica que el Plugin está disponible en un mercado remoto de Codex, pero
la instalación remota no es compatible, ejecute la instalación con una fuente o ruta local:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Referencia de configuración

| Campo                           | Valor predeterminado | Significado                                                                                                  |
| ------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `enabled`                       | inferido             | Requiere Computer Use. El valor predeterminado es true cuando se establece otro campo de Computer Use.       |
| `autoInstall`                   | false                | Instala o vuelve a habilitar desde marketplaces ya descubiertos al inicio del turno.                          |
| `marketplaceDiscoveryTimeoutMs` | 60000                | Tiempo durante el que la instalación espera a que el servidor de aplicaciones de Codex descubra marketplaces. |
| `liveTestTimeoutMs`             | 60000                | Tiempo de espera del hilo temporal de comprobación de disponibilidad y sus solicitudes de limpieza.          |
| `toolCallTimeoutMs`             | 60000                | Tiempo de espera de la llamada a la herramienta de disponibilidad `list_apps` de Computer Use.               |
| `healthCheckEnabled`            | false                | Ejecuta comprobaciones periódicas de disponibilidad mientras el cliente propietario del servidor de aplicaciones está activo. |
| `healthCheckIntervalMinutes`    | 60                   | Frecuencia de las comprobaciones; se aceptan valores de 30, 60, 120 o 240 minutos.                           |
| `pluginCacheMode`               | `independent`        | Usa `shared` para actualizar la caché del directorio principal de Codex desde el plugin de escritorio incluido. |
| `strictReadiness`               | false                | Detiene el inicio si falla una comprobación activa, en lugar de continuar con una advertencia.               |
| `autoRepair`                    | false                | Finaliza los procesos secundarios MCP obsoletos de Computer Use dentro del ámbito y reintenta una vez una comprobación fallida. |
| `marketplaceSource`             | sin establecer       | Cadena de origen que se pasa a `marketplace/add` del servidor de aplicaciones de Codex.                      |
| `marketplacePath`               | sin establecer       | Ruta local del archivo del marketplace de Codex que contiene el plugin.                                      |
| `marketplaceName`               | sin establecer       | Nombre del marketplace de Codex registrado que se seleccionará.                                              |
| `pluginName`                    | `computer-use`       | Nombre del plugin en el marketplace de Codex.                                                                |
| `mcpServerName`                 | `computer-use`       | Nombre del servidor MCP expuesto por el plugin instalado.                                                     |

La instalación automática al inicio del turno rechaza intencionadamente los valores
configurados de `marketplaceSource`. Añadir un origen nuevo es una operación explícita
de configuración, por lo que debes usar una vez
`/codex computer-use install --source <marketplace-source>` y dejar que después
`autoInstall` gestione las futuras reactivaciones desde marketplaces locales
descubiertos. La instalación automática al inicio del turno puede usar un
`marketplacePath` configurado, porque ya es una ruta local del host.

Cada campo también acepta una sobrescritura mediante una variable de entorno, que se
comprueba cuando la clave de configuración correspondiente no está establecida:

| Campo                           | Variable de entorno                                            |
| ------------------------------- | -------------------------------------------------------------- |
| `enabled`                       | `OPENCLAW_CODEX_COMPUTER_USE`                                  |
| `autoInstall`                   | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_INSTALL`                     |
| `marketplaceDiscoveryTimeoutMs` | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_DISCOVERY_TIMEOUT_MS` |
| `liveTestTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_LIVE_TEST_TIMEOUT_MS`             |
| `toolCallTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_TOOL_CALL_TIMEOUT_MS`             |
| `healthCheckEnabled`            | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_ENABLED`             |
| `healthCheckIntervalMinutes`    | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_INTERVAL_MINUTES`    |
| `pluginCacheMode`               | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_CACHE_MODE`                |
| `strictReadiness`               | `OPENCLAW_CODEX_COMPUTER_USE_STRICT_READINESS`                 |
| `autoRepair`                    | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_REPAIR`                      |
| `marketplaceSource`             | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_SOURCE`               |
| `marketplacePath`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_PATH`                 |
| `marketplaceName`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_NAME`                 |
| `pluginName`                    | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_NAME`                      |
| `mcpServerName`                 | `OPENCLAW_CODEX_COMPUTER_USE_MCP_SERVER_NAME`                  |

## Qué comprueba OpenClaw

OpenClaw registra internamente un motivo de configuración estable y da formato al
estado mostrado al usuario en el chat:

| Motivo                       | Significado                                                                 | Paso siguiente                                      |
| ---------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------- |
| `disabled`                   | `computerUse.enabled` se resolvió como false.                               | Establece `enabled` u otro campo de Computer Use.   |
| `marketplace_missing`        | No había disponible ningún marketplace coincidente.                        | Configura el origen, la ruta o el nombre del marketplace. |
| `plugin_not_installed`       | El marketplace existe, pero el plugin no está instalado.                    | Ejecuta la instalación o habilita `autoInstall`.    |
| `plugin_disabled`            | El plugin está instalado, pero deshabilitado en la configuración de Codex.  | Ejecuta la instalación para volver a habilitarlo.   |
| `remote_install_unsupported` | El marketplace seleccionado solo está disponible de forma remota.           | Usa `marketplaceSource` o `marketplacePath`.         |
| `mcp_missing`                | El plugin está habilitado, pero el servidor MCP no está disponible.         | Comprueba Computer Use de Codex y los permisos del sistema operativo. |
| `ready`                      | El plugin y las herramientas MCP están disponibles.                         | Inicia el turno en modo Codex.                       |
| `check_failed`               | Una solicitud al servidor de aplicaciones de Codex falló durante la comprobación del estado. | Comprueba la conectividad y los registros del servidor de aplicaciones. |
| `auto_install_blocked`       | La configuración al inicio del turno necesitaría añadir un origen nuevo.    | Ejecuta primero la instalación explícita.            |

La salida del chat incluye el estado del plugin, el estado del servidor MCP, el
marketplace, las herramientas cuando están disponibles y el mensaje específico del
paso de configuración que falla.

## Permisos de macOS

Computer Use es específico de macOS. Es posible que el servidor MCP propiedad de
Codex necesite permisos locales del sistema operativo antes de poder inspeccionar o
controlar aplicaciones. Si OpenClaw indica que Computer Use está instalado, pero el
servidor MCP no está disponible, verifica primero la configuración de Computer Use
en Codex:

- El servidor de aplicaciones de Codex se está ejecutando en el mismo host donde
  debe realizarse el control del escritorio.
- El plugin de Computer Use está habilitado en la configuración de Codex.
- El servidor MCP `computer-use` aparece en el estado MCP del servidor de
  aplicaciones de Codex.
- macOS ha concedido los permisos necesarios a la aplicación de control del
  escritorio.
- La sesión actual del host puede acceder al escritorio que se está controlando.

OpenClaw falla de forma segura intencionadamente cuando `computerUse.enabled` es
true. Un turno en modo Codex no debe continuar silenciosamente sin las herramientas
nativas de escritorio requeridas por la configuración.

## Solución de problemas

**El estado indica que no está instalado.** Ejecuta
`/codex computer-use install`. Si no se descubre el marketplace, pasa `--source` o
`--marketplace-path`.

**El estado indica que está instalado, pero deshabilitado.** Vuelve a ejecutar
`/codex computer-use install`. La instalación del servidor de aplicaciones de Codex
vuelve a escribir la configuración del plugin para habilitarlo.

**El estado indica que la instalación remota no es compatible.** Usa un origen o
una ruta de marketplace local. Las entradas de catálogo disponibles solo de forma
remota se pueden inspeccionar, pero no instalar mediante la API actual del servidor
de aplicaciones.

**El estado indica que el servidor MCP no está disponible.** Vuelve a ejecutar la
instalación una vez para que se recarguen los servidores MCP. Si sigue sin estar
disponible, corrige la aplicación Computer Use de Codex, el estado MCP del servidor
de aplicaciones de Codex o los permisos de macOS.

**El estado o una comprobación agota el tiempo de espera en
`computer-use.list_apps`.** El plugin y el servidor MCP están presentes, pero el
puente local de Computer Use no respondió. Cierra o reinicia Computer Use de Codex,
vuelve a iniciar Codex Desktop si es necesario y reinténtalo en una sesión nueva de
OpenClaw. Si el host ejecutó anteriormente Computer Use mediante un servidor de
aplicaciones de Codex administrado más antiguo, actualiza el plugin instalado desde
el marketplace incluido en la aplicación de escritorio (usa la ruta de `Codex.app`
para instalaciones independientes de Codex Desktop):

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**Una herramienta de Computer Use indica `Native hook relay unavailable`.** El
enlace de herramienta nativo de Codex no pudo alcanzar un relé activo de OpenClaw a
través del puente local ni de la alternativa del Gateway. Inicia una sesión nueva de
OpenClaw con `/new` o `/reset`. Si funciona una vez y vuelve a fallar en una llamada
posterior a una herramienta, `/new` solo está descartando el intento actual;
reinicia el servidor de aplicaciones de Codex o el Gateway de OpenClaw para eliminar
los hilos y registros de enlaces antiguos y vuelve a intentarlo en una sesión nueva.

**La instalación automática al inicio del turno rechaza un origen.** Esto es
intencionado. Añade primero el origen con
`/codex computer-use install --source <marketplace-source>` de forma explícita;
después, la instalación automática al inicio de futuros turnos podrá usar el
marketplace local descubierto.

## Contenido relacionado

- [Entorno de ejecución de Codex](/es/plugins/codex-harness)
- [Puente de Peekaboo](/es/platforms/mac/peekaboo)
- [Aplicación para iOS](/es/platforms/ios)
