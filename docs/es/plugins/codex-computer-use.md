---
read_when:
    - Quiere que los agentes de OpenClaw en modo Codex utilicen Codex Computer Use
    - Está eligiendo entre Codex Computer Use, PeekabooBridge y el MCP directo de cua-driver
    - Estás configurando computerUse para el plugin Codex incluido
    - Estás solucionando problemas con el estado o la instalación del uso del ordenador de /codex
summary: Configura Codex Computer Use para agentes de OpenClaw en modo Codex
title: Uso del ordenador con Codex
x-i18n:
    generated_at: "2026-07-12T14:39:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a55ee330c4952c8bcc97c3178a85a67ea3b7964e6880277bd41d2bfc750e3138
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use es un plugin MCP nativo de Codex para el control del escritorio local. OpenClaw
no incluye la aplicación de escritorio, no ejecuta por sí mismo acciones de escritorio ni elude
los permisos de Codex. El plugin `codex` incluido solo prepara Codex app-server:
habilita la compatibilidad con plugins de Codex, busca o instala el plugin Computer Use
configurado, comprueba que el servidor MCP `computer-use` esté disponible y, a continuación, permite
que Codex gestione las llamadas nativas a herramientas MCP durante los turnos en modo Codex.

Use esta página cuando OpenClaw ya utilice el entorno nativo de Codex. Para la
configuración del runtime, consulte [Entorno de Codex](/es/plugins/codex-harness).

Esto es distinto de la [herramienta informática respaldada por Node](/es/nodes/computer-use) integrada de OpenClaw. Use la herramienta integrada cuando el mismo contrato del agente deba controlar un Mac emparejado, tanto si el agente se ejecuta en el Gateway como en otro Node. Use Codex Computer Use cuando Codex app-server deba gestionar la instalación local de MCP, los permisos y las llamadas nativas a herramientas.

## OpenClaw.app y Peekaboo

La integración de Peekaboo de OpenClaw.app es independiente de Codex Computer Use. La
aplicación para macOS puede alojar un socket PeekabooBridge para que la CLI `peekaboo` reutilice las
concesiones locales de Accesibilidad y Grabación de pantalla de la aplicación para las propias
herramientas de automatización de Peekaboo. Ese puente no instala ni actúa como proxy de Codex Computer Use, y
Codex Computer Use no realiza llamadas a través del socket PeekabooBridge.

Use [Puente de Peekaboo](/es/platforms/mac/peekaboo) cuando desee que OpenClaw.app sea
un host que tenga en cuenta los permisos para la automatización mediante la CLI de Peekaboo. Use esta página cuando un
agente de OpenClaw en modo Codex deba tener disponible el plugin MCP nativo
`computer-use` de Codex antes de que comience el turno.

## Aplicación para iOS

La aplicación para iOS es independiente de Codex Computer Use. No instala ni actúa como proxy
del servidor MCP `computer-use` de Codex y no es un backend de control del escritorio.
En su lugar, la aplicación para iOS se conecta como un Node de OpenClaw y expone capacidades
móviles mediante comandos de Node como `canvas.*`, `camera.*`, `screen.*`,
`location.*` y `talk.*`.

Use [iOS](/es/platforms/ios) cuando desee que un agente controle un Node de iPhone
a través del Gateway. Use esta página cuando un agente en modo Codex deba controlar el
escritorio local de macOS mediante el plugin Computer Use nativo de Codex.

## MCP directo de cua-driver

Codex Computer Use no es la única forma de exponer el control del escritorio. Si desea que
los runtimes administrados por OpenClaw llamen directamente al controlador de TryCua, use el servidor
`cua-driver mcp` del proyecto original mediante el registro MCP de OpenClaw, en lugar del
flujo de marketplace específico de Codex.

Después de instalar `cua-driver`, solicítele el comando de OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

o registre directamente el servidor stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Esa vía conserva intacta la superficie de herramientas MCP del proyecto original, incluidos los esquemas
del controlador y las respuestas MCP estructuradas. Úsela cuando desee que el controlador CUA
esté disponible como un servidor MCP normal de OpenClaw. Use la configuración de Codex Computer Use de
esta página cuando Codex app-server deba gestionar la instalación del plugin, las recargas de MCP
y las llamadas nativas a herramientas dentro de los turnos en modo Codex.

El controlador de CUA es específico de macOS y sigue necesitando los permisos locales de macOS
que solicita su aplicación, como Accesibilidad y Grabación de pantalla. OpenClaw no
instala `cua-driver`, no concede esos permisos ni elude el modelo de seguridad
del controlador original.

## Configuración rápida

Establezca `plugins.entries.codex.config.computerUse` cuando los turnos en modo Codex deban tener
Computer Use disponible antes de que se inicie un hilo. `autoInstall: true` activa
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

Con esta configuración, OpenClaw comprueba Codex app-server antes de cada turno
en modo Codex. Si falta Computer Use, pero Codex app-server ya ha detectado
un marketplace desde el que se puede instalar, OpenClaw solicita a Codex app-server que instale o
vuelva a habilitar el plugin y recargue los servidores MCP. En macOS, cuando no hay ningún
marketplace coincidente registrado y existe un paquete estándar de aplicación de escritorio, OpenClaw
también intenta registrar el marketplace de Codex incluido desde
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled`, y conserva
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` como
alternativa para instalaciones independientes heredadas. Si la configuración sigue sin poder hacer que el
servidor MCP esté disponible, el turno falla antes de que se inicie el hilo.

Después de cambiar la configuración de Computer Use, use `/new` o `/reset` en el chat
afectado antes de realizar pruebas si ya se ha iniciado un hilo de Codex existente.

En macOS, el inicio administrado de Computer Use prioriza el binario de la aplicación de escritorio en
`/Applications/ChatGPT.app/Contents/Resources/codex` y, a continuación, recurre
a `/Applications/Codex.app/Contents/Resources/codex` para instalaciones
independientes heredadas. Esto también se aplica a los comandos puntuales de estado e
instalación de Computer Use que inician su propio cliente. Mantiene el control del escritorio bajo
el paquete de aplicación que posee los permisos locales de macOS. Si la aplicación de escritorio no está
instalada, OpenClaw recurre al binario administrado de Codex instalado junto al
plugin. Los turnos administrados normales de Codex con el directorio de inicio aislado predeterminado del agente priorizan
primero ese paquete fijado, de modo que una aplicación de escritorio más antigua no pueda ocultar la compatibilidad con modelos
actuales. Los directorios de inicio con ámbito de usuario mantienen la prioridad de la aplicación de escritorio porque pueden cargar el
estado nativo de Computer Use. Un directorio de inicio aislado del agente cuya configuración efectiva de Codex habilita
Computer Use también mantiene la prioridad de la aplicación de escritorio. La configuración explícita de
`appServer.command` o `OPENCLAW_CODEX_APP_SERVER_BIN` sigue prevaleciendo
sobre esta selección administrada.

OpenClaw serializa las lecturas de la configuración nativa de Codex y la instalación de Computer Use
dentro de un Gateway en ejecución. Un proceso de Codex separado u otro Gateway no
forma parte de esa exclusión mutua. Después de cambiar la configuración nativa del plugin de Codex fuera del
Gateway, reinicie el Gateway e inicie un chat nuevo antes de depender de la nueva
selección.

## Comandos

Use los comandos `/codex computer-use` desde cualquier superficie de chat donde esté
disponible la superficie de comandos del plugin `codex`. Estos son comandos de chat/runtime
de OpenClaw, no subcomandos de la CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` es la acción predeterminada y es de solo lectura: no añade fuentes de marketplace,
no instala plugins ni habilita la compatibilidad con plugins de Codex. Si ninguna configuración activa
Computer Use, `status` puede indicar que está deshabilitado incluso después de un comando
de instalación puntual.

`install` habilita la compatibilidad con plugins de Codex app-server, añade opcionalmente una
fuente de marketplace configurada, instala o vuelve a habilitar el plugin configurado
mediante Codex app-server, recarga los servidores MCP y verifica que el servidor MCP
exponga herramientas. Como la instalación modifica recursos de confianza del host,
solo un propietario o un cliente del Gateway con `operator.admin` puede ejecutar `install`. Otros
remitentes autorizados pueden seguir usando el comando `status` de solo lectura,
incluso con anulaciones.

Las versiones anteriores aceptaban anulaciones puntuales de identidad mediante `--plugin`, `--server` y
`--mcp-server`. En su lugar, configure de forma persistente `computerUse.pluginName` y
`computerUse.mcpServerName`. Cuando se utiliza una marca de identidad heredada,
el comando identifica la configuración exacta que debe conservarse y repite la
acción solicitada junto con las marcas de marketplace compatibles en sus instrucciones de migración.

## Opciones de marketplace

OpenClaw utiliza la misma API de app-server que expone el propio Codex. Los
campos de marketplace determinan dónde debe encontrar Codex `computer-use`.

| Campo                | Cuándo usarlo                                                        | Compatibilidad con la instalación                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Ningún campo de marketplace | Desea que Codex app-server use los marketplaces que ya conoce. | Sí, cuando app-server devuelve un marketplace local.        |
| `marketplaceSource`  | Tiene una fuente de marketplace de Codex que app-server puede añadir.         | Sí, para `/codex computer-use install` explícito.         |
| `marketplacePath`    | Ya conoce la ruta local del archivo de marketplace en el host.   | Sí, para la instalación explícita y la instalación automática al inicio del turno.   |
| `marketplaceName`    | Desea seleccionar por nombre un marketplace ya registrado.  | Sí, solo cuando el marketplace seleccionado tiene una ruta local. |

Los directorios de inicio nuevos de Codex pueden necesitar un breve momento para inicializar sus
marketplaces oficiales. Durante la instalación, OpenClaw consulta `plugin/list` durante un máximo de
`marketplaceDiscoveryTimeoutMs` milisegundos (60 segundos de forma predeterminada).

Si varios marketplaces conocidos contienen Computer Use, OpenClaw prioriza
`openai-bundled`, después `openai-curated` y, por último, `local`. Las coincidencias ambiguas
desconocidas fallan de forma segura y solicitan que se establezca `marketplaceName` o
`marketplacePath`.

## Marketplace incluido de macOS

Las versiones actuales de escritorio de ChatGPT incluyen Computer Use aquí; las versiones independientes
heredadas de Codex para escritorio usan la misma estructura dentro de `Codex.app`:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Cuando `computerUse.autoInstall` es true y no hay registrado ningún marketplace que contenga
`computer-use`, OpenClaw intenta añadir la primera raíz estándar de
marketplace incluido que exista:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

También puede registrarlo explícitamente desde un shell con Codex:

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

Si utiliza una ruta no estándar para la aplicación Codex, ejecute `/codex computer-use install
--source <marketplace-root>` una vez o establezca `computerUse.marketplacePath` en una
ruta local del archivo de marketplace. Use `--marketplace-path` solo cuando tenga la
ruta del archivo JSON del marketplace, no la raíz del marketplace incluido.

### Caché compartida de plugins

El valor predeterminado `pluginCacheMode: "independent"` deja sin administrar cada directorio de inicio de Codex y su
caché de plugins. Establezca `pluginCacheMode: "shared"` para copiar el plugin
Computer Use incluido en la caché de plugins detectable del directorio de inicio activo de Codex
antes de iniciar app-server. El modo compartido conserva las versiones almacenadas en caché más antiguas porque
los clientes de Codex en ejecución todavía pueden hacer referencia a sus directorios de plugins versionados; un
fallo al copiar el reemplazo también conserva la caché activa. La configuración explícita de
`marketplaceName` o `marketplacePath` deshabilita esta
conciliación para que OpenClaw no sobrescriba esa selección.

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

| Campo                           | Valor predeterminado | Significado                                                                                                      |
| ------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `enabled`                       | inferido             | Requiere Uso del ordenador. El valor predeterminado es true cuando se establece otro campo de Uso del ordenador. |
| `autoInstall`                   | false                | Instala o vuelve a habilitar desde marketplaces ya detectados al inicio del turno.                                |
| `marketplaceDiscoveryTimeoutMs` | 60000                | Tiempo durante el cual la instalación espera la detección de marketplaces por parte de Codex app-server.          |
| `liveTestTimeoutMs`             | 60000                | Tiempo de espera del hilo temporal de preparación y sus solicitudes de limpieza.                                 |
| `toolCallTimeoutMs`             | 60000                | Tiempo de espera de la llamada a la herramienta de preparación `list_apps` de Uso del ordenador.                  |
| `healthCheckEnabled`            | false                | Ejecuta comprobaciones periódicas de preparación mientras el cliente de app-server propietario está activo.      |
| `healthCheckIntervalMinutes`    | 60                   | Frecuencia de comprobación; los valores aceptados son 30, 60, 120 o 240 minutos.                                 |
| `pluginCacheMode`               | `independent`        | Usa `shared` para actualizar la caché del directorio de inicio de Codex desde el Plugin de escritorio incluido.   |
| `strictReadiness`               | false                | Detiene el inicio si falla una comprobación en vivo, en lugar de continuar con una advertencia.                   |
| `autoRepair`                    | false                | Finaliza los procesos secundarios MCP obsoletos y delimitados de Uso del ordenador y reintenta una vez una comprobación fallida. |
| `marketplaceSource`             | sin establecer       | Cadena de origen que se pasa a `marketplace/add` de Codex app-server.                                             |
| `marketplacePath`               | sin establecer       | Ruta local del archivo de marketplace de Codex que contiene el Plugin.                                           |
| `marketplaceName`               | sin establecer       | Nombre del marketplace de Codex registrado que se seleccionará.                                                  |
| `pluginName`                    | `computer-use`       | Nombre del Plugin del marketplace de Codex.                                                                      |
| `mcpServerName`                 | `computer-use`       | Nombre del servidor MCP expuesto por el Plugin instalado.                                                        |

La instalación automática al inicio del turno rechaza intencionadamente los valores
configurados de `marketplaceSource`. Añadir un nuevo origen es una operación de
configuración explícita, por lo que debe usarse
`/codex computer-use install --source <marketplace-source>` una vez y, después, dejar que
`autoInstall` gestione las reactivaciones futuras desde los marketplaces locales detectados.
La instalación automática al inicio del turno puede usar un `marketplacePath` configurado,
porque ya es una ruta local del host.

Cada campo también acepta una variable de entorno que lo sustituye y que se comprueba cuando
la clave de configuración correspondiente no está establecida:

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

OpenClaw comunica internamente un motivo de configuración estable y da formato al
estado mostrado al usuario en el chat:

| Motivo                       | Significado                                                                 | Siguiente paso                                        |
| ---------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------- |
| `disabled`                   | `computerUse.enabled` se resolvió como false.                               | Establezca `enabled` u otro campo de Uso del ordenador. |
| `marketplace_missing`        | No había ningún marketplace coincidente disponible.                        | Configure el origen, la ruta o el nombre del marketplace. |
| `plugin_not_installed`       | El marketplace existe, pero el Plugin no está instalado.                   | Ejecute la instalación o habilite `autoInstall`.      |
| `plugin_disabled`            | El Plugin está instalado, pero deshabilitado en la configuración de Codex. | Ejecute la instalación para volver a habilitarlo.     |
| `remote_install_unsupported` | El marketplace seleccionado solo está disponible de forma remota.          | Use `marketplaceSource` o `marketplacePath`.           |
| `mcp_missing`                | El Plugin está habilitado, pero el servidor MCP no está disponible.        | Compruebe Uso del ordenador de Codex y los permisos del SO. |
| `ready`                      | El Plugin y las herramientas MCP están disponibles.                        | Inicie el turno en modo Codex.                        |
| `check_failed`               | Una solicitud de Codex app-server falló durante la comprobación del estado. | Compruebe la conectividad y los registros de app-server. |
| `auto_install_blocked`       | La configuración al inicio del turno tendría que añadir un nuevo origen.   | Ejecute primero una instalación explícita.            |

La salida del chat incluye el estado del Plugin, el estado del servidor MCP, el marketplace,
las herramientas cuando están disponibles y el mensaje específico del paso de configuración
que ha fallado.

## Permisos de macOS

Uso del ordenador es específico de macOS. El servidor MCP gestionado por Codex puede necesitar
permisos locales del SO antes de poder inspeccionar o controlar aplicaciones. Si OpenClaw indica
que Uso del ordenador está instalado, pero el servidor MCP no está disponible, compruebe primero
la configuración de Uso del ordenador en Codex:

- Codex app-server se ejecuta en el mismo host donde debe realizarse el control del
  escritorio.
- El Plugin de Uso del ordenador está habilitado en la configuración de Codex.
- El servidor MCP `computer-use` aparece en el estado de MCP de Codex app-server.
- macOS ha concedido los permisos necesarios a la aplicación de control del escritorio.
- La sesión actual del host puede acceder al escritorio que se está controlando.

OpenClaw falla de forma segura intencionadamente cuando `computerUse.enabled` es true. Un
turno en modo Codex no debe continuar silenciosamente sin las herramientas nativas de escritorio
requeridas por la configuración.

## Solución de problemas

**El estado indica que no está instalado.** Ejecute `/codex computer-use install`. Si no se
detecta el marketplace, proporcione `--source` o `--marketplace-path`.

**El estado indica que está instalado, pero deshabilitado.** Ejecute de nuevo
`/codex computer-use install`. La instalación de Codex app-server vuelve a escribir la configuración del Plugin como habilitada.

**El estado indica que la instalación remota no es compatible.** Use una fuente o ruta
de marketplace local. Las entradas del catálogo que solo son remotas se pueden inspeccionar, pero no
se pueden instalar mediante la API actual de app-server.

**El estado indica que el servidor MCP no está disponible.** Vuelva a ejecutar la instalación una vez para que se recarguen los
servidores MCP. Si sigue sin estar disponible, corrija la aplicación Codex Computer Use,
el estado de MCP de Codex app-server o los permisos de macOS.

**El estado o una prueba agota el tiempo de espera en `computer-use.list_apps`.** El Plugin y el
servidor MCP están presentes, pero el puente local de Computer Use no respondió.
Cierre o reinicie Codex Computer Use, vuelva a iniciar Codex Desktop si es necesario y, a continuación,
vuelva a intentarlo en una nueva sesión de OpenClaw. Si el host ejecutó anteriormente Computer Use
mediante una versión anterior administrada de Codex app-server, actualice el Plugin instalado desde
el marketplace incluido con la aplicación de escritorio (use la ruta `Codex.app` para instalaciones independientes
de Codex Desktop):

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**Una herramienta de Computer Use indica `Native hook relay unavailable`.** El
hook de herramienta nativo de Codex no pudo acceder a un relé activo de OpenClaw mediante el
puente local ni la alternativa del Gateway. Inicie una nueva sesión de OpenClaw con `/new`
o `/reset`. Si funciona una vez y vuelve a fallar en una llamada posterior a una herramienta,
`/new` solo borra el intento actual; reinicie Codex app-server o el
Gateway de OpenClaw para descartar los hilos antiguos y los registros de hooks y, a continuación,
vuelva a intentarlo en una nueva sesión.

**La instalación automática al inicio del turno rechaza una fuente.** Esto es intencionado. Añada primero la
fuente explícitamente con `/codex computer-use install --source
<marketplace-source>`; a partir de entonces, la instalación automática al inicio de futuros turnos podrá usar el
marketplace local detectado.

## Contenido relacionado

- [Entorno de ejecución de Codex](/es/plugins/codex-harness)
- [Puente Peekaboo](/es/platforms/mac/peekaboo)
- [Aplicación para iOS](/es/platforms/ios)
