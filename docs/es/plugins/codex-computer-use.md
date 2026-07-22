---
read_when:
    - Quieres que los agentes de OpenClaw en modo Codex usen Codex Computer Use
    - Se está decidiendo entre Codex Computer Use, PeekabooBridge y el MCP directo de cua-driver
    - Está configurando computerUse para el plugin Codex incluido
    - Está solucionando problemas del estado o la instalación de computer-use de /codex
summary: Configura Codex Computer Use para agentes de OpenClaw en modo Codex
title: Uso del ordenador con Codex
x-i18n:
    generated_at: "2026-07-22T10:39:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 02836a6bc80bc1bd956db6cb9a7ed9be32d2192c8c95d372a4697dd24deeb2f3
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use es un plugin MCP nativo de Codex para controlar el escritorio local. OpenClaw
no incluye la aplicación de escritorio, no ejecuta por sí mismo acciones de escritorio ni elude
los permisos de Codex. El plugin `codex` incluido solo prepara Codex app-server:
habilita la compatibilidad de Codex con plugins, busca o instala el plugin Computer Use
configurado, comprueba que el servidor MCP `computer-use` esté disponible y, después, permite
que Codex controle las llamadas nativas a herramientas MCP durante los turnos en modo Codex.

Use esta página cuando OpenClaw ya utilice el entorno nativo de Codex. Para consultar la
configuración del entorno de ejecución, véase [Entorno de Codex](/es/plugins/codex-harness).

Esto es distinto de la [herramienta informática integrada respaldada por nodos](/es/nodes/computer-use) de OpenClaw. Use la herramienta integrada cuando el mismo contrato de agente deba controlar un Mac emparejado, tanto si el agente se ejecuta en el Gateway como en otro nodo. Use Codex Computer Use cuando Codex app-server deba controlar la instalación local de MCP, los permisos y las llamadas nativas a herramientas.

## OpenClaw.app y Peekaboo

La integración de Peekaboo de OpenClaw.app es independiente de Codex Computer Use. La
aplicación para macOS puede alojar un socket PeekabooBridge para que la CLI `peekaboo` reutilice las
concesiones locales de Accesibilidad y Grabación de pantalla de la aplicación para las propias
herramientas de automatización de Peekaboo. Ese puente no instala ni actúa como proxy de Codex Computer Use, y
Codex Computer Use no realiza llamadas a través del socket PeekabooBridge.

Use [Puente de Peekaboo](/es/platforms/mac/peekaboo) cuando quiera que OpenClaw.app sea
un host que tenga en cuenta los permisos para la automatización de la CLI de Peekaboo. Use esta página cuando un
agente de OpenClaw en modo Codex deba tener disponible el plugin MCP nativo `computer-use` de Codex
antes de que comience el turno.

## Aplicación para iOS

La aplicación para iOS es independiente de Codex Computer Use. No instala ni actúa como proxy
del servidor MCP `computer-use` de Codex y no es un backend de control de escritorio.
En su lugar, la aplicación para iOS se conecta como un nodo de OpenClaw y expone capacidades
móviles mediante comandos de nodo como `canvas.*`, `camera.*`, `screen.*`,
`location.*` y `talk.*`.

Use [iOS](/es/platforms/ios) cuando quiera que un agente controle un nodo de iPhone
a través del Gateway. Use esta página cuando un agente en modo Codex deba controlar el
escritorio local de macOS mediante el plugin nativo Computer Use de Codex.

## MCP directo de cua-driver

Codex Computer Use no es la única forma de exponer el control de escritorio. Si quiere que
los entornos de ejecución administrados por OpenClaw llamen directamente al controlador de TryCua, use el servidor
`cua-driver mcp` original mediante el registro MCP de OpenClaw en lugar del
flujo de marketplace específico de Codex.

Después de instalar `cua-driver`, solicítele el comando de OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

o registre directamente el servidor stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Esa vía mantiene intacta la superficie de herramientas MCP original, incluidos los esquemas del controlador
y las respuestas MCP estructuradas. Úsela cuando quiera que el controlador CUA
esté disponible como un servidor MCP normal de OpenClaw. Use la configuración de Codex Computer Use de
esta página cuando Codex app-server deba controlar la instalación del plugin, las recargas de MCP
y las llamadas nativas a herramientas dentro de los turnos en modo Codex.

El controlador de CUA distribuye compilaciones preliminares para macOS, Windows (x64 y ARM64) y
Linux (x64 y ARM64, nivel de vista previa). Sigue necesitando los permisos del sistema operativo local
que solicita su aplicación, como Accesibilidad y Grabación de pantalla en
macOS. OpenClaw no instala `cua-driver`, no concede esos permisos ni
elude el modelo de seguridad del controlador original.

## Configuración rápida

Establezca `plugins.entries.codex.config.computerUse` cuando los turnos en modo Codex deban tener
Computer Use disponible antes de que se inicie un hilo. `autoInstall: true` habilita
Computer Use y permite que OpenClaw lo instale o vuelva a habilitar antes del turno:

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

Con esta configuración, OpenClaw comprueba Codex app-server antes de cada
turno en modo Codex. Si falta Computer Use, pero Codex app-server ya ha detectado
un marketplace desde el que se puede instalar, OpenClaw solicita a Codex app-server que instale o
vuelva a habilitar el plugin y recargue los servidores MCP. En macOS, cuando no hay ningún
marketplace coincidente registrado y existe un paquete estándar de aplicación de escritorio, OpenClaw
también intenta registrar el marketplace de Codex incluido desde
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled`, manteniendo
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`
como alternativa para instalaciones independientes heredadas. Si la configuración sigue sin poder hacer que el
servidor MCP esté disponible, el turno falla antes de que se inicie el hilo.

Después de cambiar la configuración de Computer Use, use `/new` o `/reset` en el chat
afectado antes de realizar pruebas si ya se ha iniciado un hilo de Codex.

En macOS, el inicio administrado de Computer Use da prioridad al binario de la aplicación de escritorio en
`/Applications/ChatGPT.app/Contents/Resources/codex` y, después, utiliza
`/Applications/Codex.app/Contents/Resources/codex` como alternativa para instalaciones
independientes heredadas. Esto también se aplica a los comandos puntuales de estado e
instalación de Computer Use que inician su propio cliente. Así, el control de escritorio permanece bajo
el paquete de aplicaciones que posee los permisos locales de macOS. Si la aplicación de escritorio no está
instalada, OpenClaw recurre al binario administrado de Codex instalado junto al
plugin. Los turnos administrados normales de Codex con el directorio principal aislado predeterminado del agente dan prioridad
a ese paquete fijado, para que una aplicación de escritorio anterior no pueda ocultar la compatibilidad
con modelos actuales. Los directorios principales del usuario siguen dando prioridad al escritorio porque pueden cargar el estado
nativo de Computer Use. Un directorio principal aislado del agente cuya configuración efectiva de Codex habilite
Computer Use también sigue dando prioridad al escritorio. La configuración explícita
`appServer.command` o `OPENCLAW_CODEX_APP_SERVER_BIN` continúa anulando
esta selección administrada.

OpenClaw serializa las lecturas de la configuración nativa de Codex y la instalación de Computer Use
dentro de un mismo Gateway en ejecución. Un proceso de Codex independiente u otro Gateway no
forma parte de ese bloqueo. Después de cambiar la configuración nativa de plugins de Codex fuera del
Gateway, reinicie el Gateway e inicie un chat nuevo antes de depender de la nueva
selección.

## Comandos

Use los comandos `/codex computer-use` desde cualquier superficie de chat donde
esté disponible la superficie de comandos del plugin `codex`. Estos son comandos de chat y del entorno de ejecución
de OpenClaw, no subcomandos de la CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` es la acción predeterminada y es de solo lectura: no añade fuentes de marketplace,
no instala plugins ni habilita la compatibilidad de Codex con plugins. Si ninguna configuración habilita
Computer Use, `status` puede indicar que está deshabilitado incluso después de un comando de instalación
puntual.

`install` habilita la compatibilidad de Codex app-server con plugins, añade opcionalmente una
fuente de marketplace configurada, instala o vuelve a habilitar el plugin configurado
mediante Codex app-server, recarga los servidores MCP y verifica que el servidor MCP
exponga herramientas. Como la instalación modifica recursos de confianza del host,
solo un propietario o un cliente del Gateway `operator.admin` puede ejecutar `install`. Los demás
remitentes autorizados pueden seguir utilizando el comando de solo lectura `status`,
incluso con anulaciones.

Las versiones anteriores aceptaban anulaciones puntuales de identidad `--plugin`, `--server` y `--mcp-server`.
En su lugar, configure `computerUse.pluginName` y
`computerUse.mcpServerName` de forma persistente. Cuando se utiliza una marca de identidad heredada,
el comando identifica el ajuste exacto que debe persistirse y repite la
acción solicitada, junto con cualquier marca de marketplace compatible, en sus instrucciones de migración.

## Opciones de marketplace

OpenClaw utiliza la misma API de app-server que expone Codex. Los
campos de marketplace eligen dónde debe buscar Codex `computer-use`.

| Campo                | Cuándo usarlo                                                        | Compatibilidad de instalación                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Sin campo de marketplace | Quiere que Codex app-server utilice los marketplaces que ya conoce. | Sí, cuando app-server devuelve un marketplace local.        |
| `marketplaceSource`  | Tiene una fuente de marketplace de Codex que app-server puede añadir.         | Sí, para `/codex computer-use install` explícito.         |
| `marketplacePath`    | Ya conoce la ruta local del archivo de marketplace en el host.   | Sí, para la instalación explícita y la instalación automática al iniciar el turno.   |
| `marketplaceName`    | Quiere seleccionar por nombre un marketplace ya registrado.  | Sí, solo cuando el marketplace seleccionado tiene una ruta local. |

Los directorios principales nuevos de Codex pueden necesitar un breve momento para inicializar sus
marketplaces oficiales. Durante la instalación, OpenClaw consulta `plugin/list` durante un máximo de
`marketplaceDiscoveryTimeoutMs` milisegundos (60 segundos de forma predeterminada).

Si varios marketplaces conocidos contienen Computer Use, OpenClaw da prioridad a
`openai-bundled`, después a `openai-curated` y luego a `local`. Las coincidencias ambiguas
desconocidas producen un fallo seguro y solicitan que se establezca `marketplaceName` o
`marketplacePath`.

## Marketplace incluido en macOS

Las compilaciones actuales de ChatGPT para escritorio incluyen Computer Use aquí; las compilaciones de escritorio
independientes heredadas de Codex utilizan el mismo diseño en `Codex.app`:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Cuando `computerUse.autoInstall` es true y no está registrado ningún marketplace que contenga
`computer-use`, OpenClaw intenta añadir la primera raíz estándar
de marketplace incluido que exista:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

También puede registrarla explícitamente desde un shell con Codex:

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

Si utiliza una ruta no estándar para la aplicación Codex, ejecute `/codex computer-use install
--source <marketplace-root>` una vez o establezca `computerUse.marketplacePath` en una
ruta local de archivo de marketplace. Use `--marketplace-path` únicamente cuando tenga la
ruta del archivo JSON del marketplace, no la raíz del marketplace incluido.

### Caché compartida de plugins

El valor predeterminado `pluginCacheMode: "independent"` deja sin administrar cada directorio principal de Codex y su
caché de plugins. Establezca `pluginCacheMode: "shared"` para copiar el plugin
Computer Use incluido en la caché de plugins detectable del directorio principal activo de Codex
antes de iniciar app-server. El modo compartido conserva las versiones anteriores almacenadas en caché porque
los clientes de Codex en ejecución todavía pueden hacer referencia a sus directorios de plugins con versión; una
copia de reemplazo fallida también conserva la caché activa. La configuración explícita
`marketplaceName` o `marketplacePath` deshabilita esta
reconciliación para que OpenClaw no anule esa selección.

## Límite del catálogo remoto

Codex app-server puede enumerar y leer entradas de catálogo exclusivamente remotas, pero
actualmente no admite `plugin/install` remoto. Esto significa que `marketplaceName`
puede seleccionar un marketplace exclusivamente remoto para las comprobaciones de estado, pero las instalaciones y
rehabilitaciones siguen necesitando un marketplace local mediante `marketplaceSource` o
`marketplacePath`.

Si el estado indica que el plugin está disponible en un marketplace remoto de Codex, pero
la instalación remota no es compatible, ejecute la instalación con una fuente o ruta local:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Referencia de configuración

| Campo                           | Valor predeterminado | Significado                                                                        |
| ------------------------------- | -------------------- | ---------------------------------------------------------------------------------- |
| `enabled`                       | inferido             | Requiere Computer Use. El valor predeterminado es true cuando se establece otro campo de Computer Use. |
| `autoInstall`                   | false                | Instala o vuelve a habilitar desde marketplaces ya descubiertos al inicio del turno. |
| `marketplaceDiscoveryTimeoutMs` | 60000                | Tiempo que la instalación espera a que el app-server de Codex descubra marketplaces. |
| `liveTestTimeoutMs`             | 60000                | Tiempo de espera del hilo temporal de preparación y sus solicitudes de limpieza. |
| `toolCallTimeoutMs`             | 60000                | Tiempo de espera de la llamada a la herramienta de preparación `list_apps` de Computer Use. |
| `healthCheckEnabled`            | false                | Ejecuta comprobaciones periódicas de preparación mientras el cliente del app-server propietario esté activo. |
| `healthCheckIntervalMinutes`    | 60                   | Frecuencia de comprobación; los valores aceptados son 30, 60, 120 o 240 minutos. |
| `pluginCacheMode`               | `independent`  | Usa `shared` para actualizar la caché del directorio de inicio de Codex desde el plugin de escritorio incluido. |
| `strictReadiness`               | false                | Detiene el inicio si falla una comprobación en vivo, en lugar de continuar con una advertencia. |
| `autoRepair`                    | false                | Finaliza los procesos secundarios MCP obsoletos de Computer Use dentro del ámbito y reintenta una vez una comprobación fallida. |
| `marketplaceSource`             | sin establecer       | Cadena de origen que se pasa a `marketplace/add` del app-server de Codex. |
| `marketplacePath`               | sin establecer       | Ruta del archivo de marketplace local de Codex que contiene el plugin. |
| `marketplaceName`               | sin establecer       | Nombre del marketplace de Codex registrado que se seleccionará. |
| `pluginName`                    | `computer-use` | Nombre del plugin del marketplace de Codex. |
| `mcpServerName`                 | `computer-use` | Nombre del servidor MCP expuesto por el plugin instalado. |

La instalación automática al inicio del turno rechaza intencionadamente los valores
`marketplaceSource` configurados. Añadir un origen nuevo es una operación
de configuración explícita, por lo que debe usarse `/codex computer-use install --source <marketplace-source>` una vez y dejar después que
`autoInstall` gestione las futuras reactivaciones desde los marketplaces locales descubiertos.
La instalación automática al inicio del turno puede usar un `marketplacePath` configurado, porque
ya es una ruta local en el host.

Cada campo también acepta una variable de entorno que sustituye su valor y se
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

OpenClaw informa internamente de un motivo de configuración estable y da formato
al estado visible para el usuario en el chat:

| Motivo                       | Significado                                                | Siguiente paso                                     |
| ---------------------------- | ---------------------------------------------------------- | -------------------------------------------------- |
| `disabled`                   | `computerUse.enabled` se resolvió como false.               | Establezca `enabled` u otro campo de Computer Use. |
| `marketplace_missing`        | No había ningún marketplace coincidente disponible.        | Configure el origen, la ruta o el nombre del marketplace. |
| `plugin_not_installed`       | El marketplace existe, pero el plugin no está instalado.   | Ejecute la instalación o habilite `autoInstall`. |
| `plugin_disabled`            | El plugin está instalado, pero deshabilitado en la configuración de Codex. | Ejecute la instalación para volver a habilitarlo. |
| `remote_install_unsupported` | El marketplace seleccionado es exclusivamente remoto.      | Use `marketplaceSource` o `marketplacePath`. |
| `mcp_missing`                | El plugin está habilitado, pero el servidor MCP no está disponible. | Compruebe Computer Use de Codex y los permisos del sistema operativo. |
| `ready`                      | El plugin y las herramientas MCP están disponibles.        | Inicie el turno en modo Codex. |
| `check_failed`               | Una solicitud al app-server de Codex falló durante la comprobación de estado. | Compruebe la conectividad y los registros del app-server. |
| `auto_install_blocked`       | La configuración al inicio del turno tendría que añadir un origen nuevo. | Ejecute primero la instalación explícita. |

La salida del chat incluye el estado del plugin, el estado del servidor MCP, el marketplace,
las herramientas cuando están disponibles y el mensaje específico del paso de configuración que falla.

## Permisos de macOS

Esta ruta de Computer Use propiedad de Codex se ejecuta en macOS, donde el servidor MCP puede necesitar
permisos locales del sistema operativo antes de poder inspeccionar o controlar aplicaciones. (Para el control de
escritorio multiplataforma en hosts Node con Windows y Linux, consulte el
[ejecutor cua-computer](/es/nodes/computer-use#windows-and-linux-experimental-via-cua-driver).)
Si OpenClaw indica que Computer Use está instalado, pero el servidor MCP no está disponible,
compruebe primero la configuración de Computer Use del lado de Codex:

- El app-server de Codex se ejecuta en el mismo host donde debe realizarse el control
  del escritorio.
- El plugin de Computer Use está habilitado en la configuración de Codex.
- El servidor MCP `computer-use` aparece en el estado de MCP del app-server de Codex.
- macOS ha concedido los permisos necesarios para la aplicación de control del escritorio.
- La sesión actual del host puede acceder al escritorio que se está controlando.

OpenClaw falla de forma segura intencionadamente cuando `computerUse.enabled` es true. Un
turno en modo Codex no debe continuar silenciosamente sin las herramientas nativas de escritorio
requeridas por la configuración.

## Solución de problemas

**El estado indica que no está instalado.** Ejecute `/codex computer-use install`. Si el
marketplace no se descubre, proporcione `--source` o `--marketplace-path`.

**El estado indica que está instalado, pero deshabilitado.** Ejecute `/codex computer-use install`
de nuevo. La instalación del app-server de Codex vuelve a escribir la configuración del plugin como habilitada.

**El estado indica que no se admite la instalación remota.** Use un origen o una
ruta de marketplace local. Las entradas de catálogo exclusivamente remotas pueden inspeccionarse, pero no
instalarse mediante la API actual del app-server.

**El estado indica que el servidor MCP no está disponible.** Vuelva a ejecutar la instalación una vez para que los
servidores MCP se recarguen. Si sigue sin estar disponible, corrija la aplicación Computer Use de Codex,
el estado de MCP del app-server de Codex o los permisos de macOS.

**El estado o una comprobación agota el tiempo de espera en `computer-use.list_apps`.** El plugin y
el servidor MCP están presentes, pero el puente local de Computer Use no respondió.
Cierre o reinicie Computer Use de Codex, vuelva a iniciar Codex Desktop si es necesario y, a continuación,
inténtelo de nuevo en una sesión nueva de OpenClaw. Si el host ejecutó anteriormente Computer Use
mediante un app-server de Codex administrado más antiguo, actualice el plugin instalado desde
el marketplace incluido con la aplicación de escritorio (use la ruta `Codex.app` para instalaciones
independientes de Codex Desktop):

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**Una herramienta de Computer Use indica `Native hook relay unavailable`.** El
enlace de herramienta nativo de Codex no pudo acceder a un relé activo de OpenClaw mediante el
puente local o la alternativa del Gateway. Inicie una sesión nueva de OpenClaw con `/new`
o `/reset`. Si funciona una vez y vuelve a fallar en una llamada posterior a una herramienta,
`/new` solo borra el intento actual; reinicie el app-server de Codex o el
Gateway de OpenClaw para descartar los hilos y registros de enlaces antiguos y, a continuación,
inténtelo de nuevo en una sesión nueva.

**La instalación automática al inicio del turno rechaza un origen.** Es intencionado. Añada primero el
origen con `/codex computer-use install --source
<marketplace-source>` explícito; las futuras instalaciones automáticas al inicio del turno podrán usar después el
marketplace local descubierto.

## Relacionado

- [Entorno de pruebas de Codex](/es/plugins/codex-harness)
- [Puente Peekaboo](/es/platforms/mac/peekaboo)
- [Aplicación para iOS](/es/platforms/ios)
