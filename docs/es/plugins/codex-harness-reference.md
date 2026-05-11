---
read_when:
    - Necesitas todos los campos de configuración del arnés de Codex
    - Estás cambiando el transporte, la autenticación, el descubrimiento o el comportamiento de tiempo de espera de app-server
    - Estás depurando el arranque del arnés de Codex, el descubrimiento de modelos o el aislamiento del entorno
summary: Referencia de configuración, autenticación, descubrimiento y servidor de aplicaciones para el arnés de Codex
title: Referencia del arnés de Codex
x-i18n:
    generated_at: "2026-05-11T20:42:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72767810c9448015a1ce7f35263dba576151b18c1f4a43ba531d45728241f095
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Esta referencia cubre la configuración detallada del plugin `codex`
incluido. Para la configuración inicial y las decisiones de enrutamiento, empieza con
[arnés de Codex](/es/plugins/codex-harness).

## Superficie de configuración del Plugin

Toda la configuración del arnés de Codex está en `plugins.entries.codex.config`.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

Campos de nivel superior admitidos:

| Campo                      | Predeterminado                  | Significado                                                                                                                                   |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | habilitado                  | Configuración de descubrimiento de modelos para `model/list` del servidor de aplicación de Codex.                                                                               |
| `appServer`                | servidor de aplicación stdio gestionado | Configuración de transporte, comando, autenticación, aprobación, sandbox y tiempo de espera.                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`           | Usa `"direct"` para poner las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex.                                                  |
| `codexDynamicToolsExclude` | `[]`                     | Nombres adicionales de herramientas dinámicas de OpenClaw que se omitirán en los turnos del servidor de aplicación de Codex.                                                               |
| `codexPlugins`             | deshabilitado                 | Compatibilidad nativa de plugins/aplicaciones de Codex para plugins seleccionados instalados desde el código fuente y migrados. Consulta [plugins nativos de Codex](/es/plugins/codex-native-plugins). |
| `computerUse`              | deshabilitado                 | Configuración de Codex Computer Use. Consulta [Codex Computer Use](/es/plugins/codex-computer-use).                                                          |

## Transporte del servidor de aplicación

De forma predeterminada, OpenClaw inicia el binario gestionado de Codex incluido con el
plugin empaquetado:

```bash
codex app-server --listen stdio://
```

Esto mantiene la versión del servidor de aplicación vinculada al plugin `codex` incluido en lugar de
cualquier CLI de Codex independiente que esté instalada localmente. Define
`appServer.command` solo cuando quieras ejecutar intencionadamente un
ejecutable distinto.

Para un servidor de aplicación que ya esté en ejecución, usa transporte WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Campos `appServer` admitidos:

| Campo                         | Predeterminado                                                | Significado                                                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` genera Codex; `"websocket"` se conecta a `url`.                                                                                                                                        |
| `command`                     | binario gestionado de Codex                                   | Ejecutable para el transporte stdio. Déjalo sin definir para usar el binario gestionado.                                                                                                                          |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para el transporte stdio.                                                                                                                                                                  |
| `url`                         | sin definir                                                  | URL del servidor de aplicación WebSocket.                                                                                                                                                                       |
| `authToken`                   | sin definir                                                  | Token Bearer para el transporte WebSocket.                                                                                                                                                           |
| `headers`                     | `{}`                                                   | Encabezados WebSocket adicionales.                                                                                                                                                                        |
| `clearEnv`                    | `[]`                                                   | Nombres de variables de entorno adicionales eliminadas del proceso stdio generado del servidor de aplicación después de que OpenClaw construye su entorno heredado.                                                             |
| `requestTimeoutMs`            | `60000`                                                | Tiempo de espera para llamadas del plano de control del servidor de aplicación.                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Ventana silenciosa después de una solicitud al servidor de aplicación limitada al turno mientras OpenClaw espera `turn/completed`.                                                                                                  |
| `mode`                        | `"yolo"` salvo que los requisitos locales de Codex no permitan YOLO | Preajuste para ejecución YOLO o revisada por guardian.                                                                                                                                                 |
| `approvalPolicy`              | `"never"` o una política de aprobación guardian permitida       | Política de aprobación nativa de Codex enviada al inicio del hilo, al reanudarlo y al turno.                                                                                                                            |
| `sandbox`                     | `"danger-full-access"` o un sandbox guardian permitido  | Modo de sandbox nativo de Codex enviado al inicio del hilo y al reanudarlo.                                                                                                                                      |
| `approvalsReviewer`           | `"user"` o un revisor guardian permitido               | Usa `"auto_review"` para permitir que Codex revise las solicitudes de aprobación nativas cuando esté permitido.                                                                                                                   |
| `defaultWorkspaceDir`         | directorio del proceso actual                              | Espacio de trabajo usado por `/codex bind` cuando se omite `--cwd`.                                                                                                                                        |
| `serviceTier`                 | sin definir                                                  | Nivel de servicio opcional del servidor de aplicación de Codex. `"priority"` habilita el enrutamiento de modo rápido, `"flex"` solicita procesamiento flexible y `null` borra la anulación. El valor heredado `"fast"` se acepta como `"priority"`. |

El plugin bloquea handshakes del servidor de aplicación antiguos o sin versión. El servidor de aplicación de Codex
debe informar la versión estable `0.125.0` o una posterior.

## Modos de aprobación y sandbox

Las sesiones locales del servidor de aplicación stdio usan de forma predeterminada el modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Esta postura de operador local de confianza permite que
los turnos y heartbeats desatendidos de OpenClaw avancen sin solicitudes de aprobación
nativas que nadie esté disponible para responder.

Si el archivo de requisitos del sistema local de Codex no permite valores implícitos de aprobación,
revisor o sandbox YOLO, OpenClaw trata el valor predeterminado implícito como guardian
en su lugar y selecciona permisos guardian permitidos. Las entradas
`[[remote_sandbox_config]]` con coincidencia de nombre de host en el mismo archivo de requisitos se respetan
para la decisión predeterminada del sandbox.

Define `appServer.mode: "guardian"` para aprobaciones de Codex revisadas por guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

El preajuste `guardian` se expande a `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"` cuando esos
valores están permitidos. Los campos de política individuales anulan `mode`. El valor de revisor anterior
`guardian_subagent` todavía se acepta como alias de compatibilidad,
pero las configuraciones nuevas deben usar `auto_review`.

## Autenticación y aislamiento del entorno

La autenticación se selecciona en este orden:

1. Un perfil explícito de autenticación de Codex de OpenClaw para el agente.
2. La cuenta existente del servidor de aplicación en el directorio de inicio de Codex de ese agente.
3. Solo para lanzamientos locales del servidor de aplicación stdio, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando no hay ninguna cuenta de servidor de aplicación presente y la autenticación de OpenAI
   sigue siendo necesaria.

Cuando OpenClaw detecta un perfil de autenticación de Codex de tipo suscripción de ChatGPT, elimina
`CODEX_API_KEY` y `OPENAI_API_KEY` del proceso hijo de Codex generado. Eso
mantiene las claves de API de nivel Gateway disponibles para embeddings o modelos directos de OpenAI
sin hacer que los turnos nativos del servidor de aplicación de Codex se facturen por la API por accidente.

Los perfiles explícitos de clave de API de Codex y la alternativa local de clave de entorno stdio usan el inicio de sesión del servidor de aplicación
en lugar de variables de entorno heredadas del proceso hijo. Las conexiones WebSocket del servidor de aplicación
no reciben la alternativa de clave de API de entorno del Gateway; usa un perfil de autenticación explícito o la
propia cuenta del servidor de aplicación remoto.

Los lanzamientos del servidor de aplicación stdio heredan de forma predeterminada el entorno de proceso de OpenClaw, pero
OpenClaw controla el puente de cuenta del servidor de aplicación de Codex y establece tanto `CODEX_HOME` como
`HOME` en directorios por agente dentro del estado de OpenClaw de ese agente. El propio
cargador de skills de Codex lee `$CODEX_HOME/skills` y `$HOME/.agents/skills`, así que ambos
valores están aislados para lanzamientos locales del servidor de aplicación. Eso mantiene las
skills nativas de Codex, plugins, configuración, cuentas y estado de hilos acotados al agente de OpenClaw
en lugar de filtrarse desde el directorio personal de la CLI de Codex del operador.

Los plugins de OpenClaw y las instantáneas de Skills de OpenClaw siguen fluyendo por el propio
registro de plugins y cargador de Skills de OpenClaw. Los activos personales de la CLI de Codex no. Si tienes
Skills o plugins útiles de la CLI de Codex que deberían formar parte de un agente de OpenClaw,
haz un inventario de ellos explícitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Si un despliegue necesita aislamiento adicional del entorno, añade esas variables a
`appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` solo afecta al proceso hijo del servidor de aplicación de Codex generado.
`CODEX_HOME` y `HOME` permanecen reservados para el aislamiento de Codex
por agente de OpenClaw en lanzamientos locales.

## Herramientas dinámicas

Las herramientas dinámicas de Codex usan de forma predeterminada la carga `searchable`. OpenClaw no expone
herramientas dinámicas que duplican operaciones de espacio de trabajo nativas de Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Las herramientas de integración restantes de OpenClaw, como mensajería, sesiones, medios, cron,
navegador, nodos, gateway, `heartbeat_respond` y `web_search`, están disponibles
mediante la búsqueda de herramientas de Codex bajo el espacio de nombres `openclaw`. Esto mantiene más pequeño
el contexto inicial del modelo. `sessions_yield` y las respuestas de origen solo con herramientas de mensaje
permanecen directas porque son contratos de control de turno.

Configura `codexDynamicToolsLoading: "direct"` solo cuando te conectes a un servidor de aplicación Codex
personalizado que no pueda buscar herramientas dinámicas diferidas o cuando depures la carga útil completa
de herramientas.

## Tiempos de espera

Las llamadas a herramientas dinámicas propiedad de OpenClaw están limitadas independientemente de
`appServer.requestTimeoutMs`. Cada solicitud Codex `item/tool/call` usa el primer
tiempo de espera disponible en este orden:

- Un argumento `timeoutMs` positivo por llamada.
- Para `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Para la herramienta `image` de comprensión de medios, `tools.media.image.timeoutSeconds`
  convertido a milisegundos, o el valor predeterminado de medios de 60 segundos.
- El valor predeterminado de herramienta dinámica de 30 segundos.

Los presupuestos de herramientas dinámicas tienen un límite máximo de 600000 ms. Al agotarse el tiempo de espera, OpenClaw cancela la
señal de la herramienta cuando es compatible y devuelve una respuesta fallida de herramienta dinámica a Codex
para que el turno pueda continuar en lugar de dejar la sesión en `processing`.

Después de que OpenClaw responde a una solicitud de servidor de aplicación con alcance de turno de Codex, el arnés
también espera que Codex termine el turno nativo con `turn/completed`. Si el
servidor de aplicación queda en silencio durante `appServer.turnCompletionIdleTimeoutMs` después de esa
respuesta, OpenClaw interrumpe con el mejor esfuerzo el turno de Codex, registra un tiempo de espera
de diagnóstico y libera la vía de sesión de OpenClaw para que los mensajes de chat posteriores no
queden en cola detrás de un turno nativo obsoleto.

Cualquier notificación no terminal para el mismo turno, incluida
`rawResponseItem/completed`, desactiva ese watchdog corto porque Codex ha
demostrado que el turno sigue vivo. El watchdog terminal más largo continúa
protegiendo los turnos realmente bloqueados. Los diagnósticos de tiempo de espera incluyen el último método de notificación
del servidor de aplicación y, para elementos de respuesta sin procesar del asistente, el tipo de elemento, el rol,
el id y una vista previa acotada del texto del asistente.

## Descubrimiento de modelos

De forma predeterminada, el Plugin de Codex solicita al servidor de aplicación los modelos disponibles. La
disponibilidad de modelos pertenece al servidor de aplicación de Codex, por lo que la lista puede cambiar cuando OpenClaw
actualiza la versión de `@openai/codex` incluida o cuando una implementación apunta
`appServer.command` a un binario de Codex diferente. La disponibilidad también puede estar
delimitada por cuenta. Usa `/codex models` en un Gateway en ejecución para ver el catálogo en vivo
de ese arnés y esa cuenta.

Si el descubrimiento falla o agota el tiempo de espera, OpenClaw usa un catálogo alternativo incluido para:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

El arnés incluido actual es `@openai/codex` `0.130.0`. Una sonda `model/list`
contra ese servidor de aplicación incluido devolvió:

| Id de modelo          | Predeterminado | Oculto | Modalidades de entrada | Esfuerzos de razonamiento |
| --------------------- | -------------- | ------ | ---------------------- | ------------------------- |
| `gpt-5.5`             | Sí             | No     | texto, imagen          | bajo, medio, alto, xhigh  |
| `gpt-5.4`             | No             | No     | texto, imagen          | bajo, medio, alto, xhigh  |
| `gpt-5.4-mini`        | No             | No     | texto, imagen          | bajo, medio, alto, xhigh  |
| `gpt-5.3-codex`       | No             | No     | texto, imagen          | bajo, medio, alto, xhigh  |
| `gpt-5.3-codex-spark` | No             | No     | texto                  | bajo, medio, alto, xhigh  |
| `gpt-5.2`             | No             | No     | texto, imagen          | bajo, medio, alto, xhigh  |

El catálogo del servidor de aplicación puede devolver modelos ocultos para flujos internos o
especializados, pero no son opciones normales del selector de modelos.

Ajusta el descubrimiento bajo `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Desactiva el descubrimiento cuando quieras que el inicio evite sondear Codex y use solo el
catálogo alternativo:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Archivos de arranque del espacio de trabajo

Codex gestiona `AGENTS.md` por sí mismo mediante el descubrimiento nativo de documentación de proyecto. OpenClaw
no escribe archivos sintéticos de documentación de proyecto de Codex ni depende de nombres de archivo alternativos
de Codex para archivos de persona, porque las alternativas de Codex solo se aplican cuando
falta `AGENTS.md`.

Para la paridad del espacio de trabajo de OpenClaw, el arnés de Codex resuelve los demás archivos de arranque,
incluidos `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`,
`HEARTBEAT.md`, `BOOTSTRAP.md` y `MEMORY.md` cuando están presentes, y los reenvía
mediante instrucciones de desarrollador de Codex en `thread/start` y `thread/resume`.
Esto mantiene el contexto de persona y perfil del espacio de trabajo visible en la vía nativa de Codex
que moldea el comportamiento, sin duplicar `AGENTS.md`.

## Sobrescrituras de entorno

Las sobrescrituras de entorno siguen disponibles para pruebas locales:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario administrado cuando
`appServer.command` no está definido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Usa
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. La configuración es
preferible para implementaciones repetibles porque mantiene el comportamiento del Plugin en el
mismo archivo revisado que el resto de la configuración del arnés de Codex.

## Relacionado

- [Arnés de Codex](/es/plugins/codex-harness)
- [Tiempo de ejecución del arnés de Codex](/es/plugins/codex-harness-runtime)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Codex Computer Use](/es/plugins/codex-computer-use)
- [Proveedor OpenAI](/es/providers/openai)
- [Referencia de configuración](/es/gateway/configuration-reference)
