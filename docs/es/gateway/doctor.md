---
read_when:
    - Añadir o modificar migraciones de doctor
    - Introducción de cambios incompatibles en la configuración
sidebarTitle: Doctor
summary: 'Comando doctor: comprobaciones de estado, migraciones de configuración y pasos de reparación'
title: Doctor
x-i18n:
    generated_at: "2026-07-22T10:34:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 383a3e53d5f914b5b734b07f7b38c180f3064cbba0134738ec9d112864937763
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` es la herramienta de reparación y migración de OpenClaw. Corrige configuraciones y estados obsoletos, comprueba el estado del sistema y proporciona pasos de reparación prácticos.

## Inicio rápido

```bash
openclaw doctor
```

### Modos sin interfaz y de automatización

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Acepta los valores predeterminados sin solicitar confirmación (incluidos los pasos de reinicio y reparación del servicio o del entorno aislado cuando corresponda).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    Aplica las reparaciones recomendadas sin solicitar confirmación (`--repair` es un alias).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    Ejecuta comprobaciones estructuradas del estado para la Pipeline de CI o la automatización previa. Es de solo lectura: no realiza
    solicitudes de confirmación, reparaciones, migraciones, reinicios ni escrituras de estado.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    También aplica reparaciones agresivas (sobrescribe las configuraciones personalizadas del supervisor).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Se ejecuta sin solicitar confirmación y aplica únicamente migraciones seguras (normalización de la configuración +
    traslado del estado en disco). Omite las acciones de reinicio, servicio y entorno aislado que requieren
    confirmación humana. Las migraciones de estados heredados siguen ejecutándose automáticamente cuando se detectan.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Examina los servicios del sistema en busca de instalaciones adicionales del Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Para revisar los cambios antes de escribirlos, abra primero el archivo de configuración:

```bash
cat ~/.openclaw/openclaw.json
```

## Modo de análisis de solo lectura

`openclaw doctor --lint` es la variante orientada a la automatización de
`openclaw doctor --fix`. Ambos comparten el mismo registro de reglas de Doctor, pero
no seleccionan ni aplican las reglas de la misma manera:

| Modo                     | Solicita confirmación   | Escribe configuración/estado     | Salida                 | Uso recomendado                      |
| ------------------------ | --------- | ----------------------- | ---------------------- | ------------------------------- |
| `openclaw doctor`        | sí       | no                      | informe de estado accesible | comprobación humana del estado         |
| `openclaw doctor --fix`  | a veces | sí, según la política de reparación | registro de reparación accesible    | aplicación de reparaciones aprobadas       |
| `openclaw doctor --lint` | no        | no                      | hallazgos estructurados    | Pipeline de CI, comprobaciones previas y controles de revisión |

De forma predeterminada, `doctor --lint` ejecuta el perfil de automatización amplio y seguro: comprobaciones
estáticas, locales y útiles para la Pipeline de CI o la salida de comprobaciones previas. Omite las comprobaciones opcionales
que son informativas, sensibles al entorno, dependientes de servicios activos, relacionadas con el inventario
de cuentas o espacios de trabajo, o destinadas a la limpieza histórica. Utilice `doctor --lint --all` para realizar la
auditoría completa de análisis registrada, incluidas esas comprobaciones opcionales, o `--only <id>` para
una comprobación específica.

`doctor --fix` no utiliza el perfil predeterminado de análisis ni acepta
`--all`. Ejecuta la ruta ordenada de reparación de Doctor: las comprobaciones de estado modernas pueden proporcionar
una implementación opcional de `repair()`, mientras que las áreas más antiguas siguen utilizando su flujo heredado de
reparación de Doctor. Algunos hallazgos del análisis son deliberadamente solo diagnósticos, por lo que la
aparición de una comprobación en `--lint --all` no implica que `--fix` vaya a modificar esa área.
El contrato separa `detect()` (informa de hallazgos) de `repair()` (informa de
cambios, diferencias y efectos secundarios), lo que mantiene abierta la posibilidad de un futuro
`doctor --fix --dry-run` sin convertir las comprobaciones de análisis en planificadores de modificaciones.

Algunas comprobaciones integradas están desactivadas de forma predeterminada internamente para que sigan estando disponibles para
`--all`, `--only` y los flujos de reparación de Doctor sin formar parte del perfil de automatización
predeterminado de `doctor --lint`. La gravedad de cada hallazgo se sigue indicando como
`info`, `warning` o `error`; la selección predeterminada no es un nivel de gravedad.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

Campos de la salida JSON:

- `ok`: indica si algún hallazgo alcanzó el umbral de gravedad seleccionado
- `checksRun` / `checksSkipped`: recuentos (omitidos por el perfil, `--only` o `--skip`)
- `findings`: diagnósticos estructurados con `checkId`, `severity`, `message` y, opcionalmente, `path`, `line`, `column`, `ocPath`, `source`, `target`, `requirement`, `fixHint`

Códigos de salida:

| Código | Significado                                                  |
| ---- | -------------------------------------------------------- |
| `0`  | no hay hallazgos que alcancen o superen el umbral seleccionado           |
| `1`  | uno o más hallazgos alcanzaron el umbral seleccionado          |
| `2`  | fallo del comando o del entorno de ejecución antes de que pudieran emitirse los hallazgos |

Opciones:

- `--severity-min info|warning|error` (valor predeterminado: `warning`): controla tanto lo que se muestra como lo que provoca una salida distinta de cero.
- `--all`: ejecuta todas las comprobaciones de análisis registradas, incluidas las comprobaciones opcionales excluidas del conjunto de automatización predeterminado.
- `--only <id>` (repetible): ejecuta únicamente los identificadores de comprobación indicados; un identificador desconocido se notifica como hallazgo de error.
- `--skip <id>` (repetible): excluye una comprobación y mantiene activo el resto de la ejecución.
- `--json`, `--severity-min`, `--all`, `--only` y `--skip` requieren `--lint`; las ejecuciones simples de `openclaw doctor` y `--fix` las rechazan.

## Qué hace (resumen)

<AccordionGroup>
  <Accordion title="Estado, interfaz de usuario y actualizaciones">
    - Actualización previa opcional para instalaciones mediante git (solo en modo interactivo).
    - Comprobación de vigencia del protocolo de la interfaz de usuario (recompila la interfaz de control cuando el esquema del protocolo es más reciente).
    - Comprobación del estado + solicitud de reinicio.
    - Notas únicamente sobre Skills y plugins con problemas; el inventario en buen estado permanece en `openclaw skills check` y `openclaw plugins list`.

  </Accordion>
  <Accordion title="Configuración y migraciones">
    - Normalización de la configuración para formatos de valores heredados.
    - Migración de la configuración de conversación desde los campos planos heredados de `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Comprobaciones de migración del navegador para configuraciones heredadas de la extensión de Chrome y preparación de Chrome MCP.
    - Advertencias sobre sustituciones del proveedor OpenCode (`models.providers.opencode` / `opencode-zen` / `opencode-go`).
    - Migración del proveedor o perfil heredado de OpenAI Codex (`openai-codex` → `openai`) y advertencias de ocultamiento por `models.providers.openai-codex` obsoletos.
    - Comprobación de los requisitos previos de TLS para perfiles OAuth de OpenAI Codex.
    - Advertencias de la lista de permitidos de plugins y herramientas cuando `plugins.allow` es restrictivo, pero la política de herramientas sigue solicitando comodines o herramientas propiedad de plugins.
    - Migración del estado heredado en disco (sesiones, directorio del agente y autenticación de WhatsApp).
    - Migración de claves del contrato de manifiesto de plugins heredados (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migración del almacén Cron heredado (`jobId`, `schedule.cron`, campos de entrega y carga útil de nivel superior, carga útil `provider`, tareas Webhook alternativas de `notify: true`).
    - Reparación de la versión fijada del entorno de ejecución de la CLI de Codex (`agentRuntime.id: "codex-cli"` → `"codex"`) en `agents.defaults`, `agents.entries.*` y `models.providers.*` (incluidas las entradas por modelo).
    - Limpieza de configuraciones obsoletas de plugins cuando estos están habilitados; cuando `plugins.enabled=false`, las referencias obsoletas a plugins se conservan como configuración de contención inerte.

  </Accordion>
  <Accordion title="Estado e integridad">
    - Inspección de archivos de bloqueo de sesión y limpieza de bloqueos obsoletos.
    - Reparación de transcripciones de sesión para ramas duplicadas de reescritura de solicitudes creadas por compilaciones afectadas de 2026.4.24.
    - Detección de lápidas de recuperación tras reinicios para sesiones principales y subagentes bloqueados. Doctor informa de las sesiones bloqueadas y solo repara indicadores de cancelación obsoletos que entran en conflicto con una lápida existente; no vuelve a habilitar la recuperación automática.
    - Comprobaciones de integridad del estado y permisos (sesiones, transcripciones y directorio de estado).
    - Comprobaciones de permisos del archivo de configuración (chmod 600) cuando se ejecuta localmente.
    - Estado de autenticación del modelo: comprueba el vencimiento de OAuth, puede actualizar los tokens próximos a vencer e informa de los estados de espera o deshabilitación de los perfiles de autenticación.

  </Accordion>
  <Accordion title="Gateway, servicios y supervisores">
    - Reparación de la imagen del entorno aislado cuando este está habilitado.
    - Migración de servicios heredados y detección de gateways adicionales.
    - Migración del estado heredado del canal Matrix (en modo `--fix` / `--repair`).
    - Comprobaciones del entorno de ejecución del Gateway (servicio instalado pero no iniciado; etiqueta de launchd almacenada en caché).
    - Advertencias sobre el estado de los canales (consultado desde el Gateway en ejecución).
    - Las comprobaciones de permisos específicas de cada canal se encuentran en `openclaw channels capabilities`; por ejemplo, los permisos de los canales de voz de Discord se auditan con `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Comprobaciones de capacidad de respuesta de WhatsApp para detectar un estado degradado del bucle de eventos del Gateway cuando aún hay clientes TUI locales en ejecución; `--fix` detiene únicamente los clientes TUI locales verificados.
    - Reparación de rutas de Codex para referencias de modelos heredadas de `openai-codex/*` en modelos principales, alternativas, modelos de generación de imágenes y vídeo, sustituciones de Heartbeat, subagentes y Compaction, enlaces, sustituciones de modelos de canales y rutas fijadas de sesiones; `--fix` las reescribe como `openai/*`, migra los perfiles y el orden de autenticación de `openai-codex:*` a `openai:*`, elimina las versiones fijadas obsoletas del entorno de ejecución de sesiones o agentes completos y permite que la ruta efectiva reparada determine si Codex es compatible.
    - Auditoría de la configuración del supervisor (launchd/systemd/schtasks) con reparación opcional.
    - Limpieza del entorno del proxy integrado para servicios del Gateway que capturaron valores de `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` del shell durante la instalación o actualización.
    - Comprobaciones del entorno de ejecución del Gateway (servicios Bun heredados no compatibles y rutas de gestores de versiones).
    - Diagnósticos de colisiones de puertos del Gateway (valor predeterminado: `18789`).

  </Accordion>
  <Accordion title="Autenticación, seguridad y vinculación">
    - Advertencias de seguridad para políticas de mensajes directos abiertos.
    - Comprobaciones de autenticación del Gateway para el modo de token local (ofrece generar un token cuando no existe ninguna fuente de tokens; no sobrescribe las configuraciones SecretRef de tokens).
    - Detección de problemas de vinculación de dispositivos (solicitudes pendientes de primera vinculación, actualizaciones pendientes de roles o ámbitos, divergencias obsoletas de la caché local de tokens de dispositivos y divergencias de autenticación en registros vinculados).

  </Accordion>
  <Accordion title="Espacio de trabajo y shell">
    - Comprobación de persistencia de systemd en Linux.
    - Comprobación del tamaño de los archivos de arranque del espacio de trabajo (advertencias de truncamiento o proximidad al límite para archivos de contexto).
    - Comprobación de preparación de Skills para el agente predeterminado; informa de las Skills permitidas a las que les faltan binarios, variables de entorno, configuración o requisitos del sistema operativo, y `--fix` puede deshabilitar las Skills no disponibles en `skills.entries`.
    - Comprobación del estado del autocompletado del shell e instalación o actualización automática.
    - Comprobación de preparación del proveedor de incrustaciones para la búsqueda en memoria (modelo local, clave de API remota o binario QMD).
    - Comprobaciones de instalaciones desde el código fuente (discrepancia del espacio de trabajo de pnpm, recursos de interfaz de usuario ausentes y binario tsx ausente).
    - Escribe la configuración actualizada + los metadatos del asistente.

  </Accordion>
</AccordionGroup>

## Relleno y restablecimiento de la interfaz de usuario de sueños

  La escena Dreams de la interfaz de control incluye las acciones **Rellenar**, **Restablecer** y **Borrar anclados** para el flujo de trabajo de Dreaming anclado. Estas usan métodos RPC de estilo doctor del Gateway, pero **no** forman parte de la reparación/migración de la CLI de `openclaw doctor`.

  | Acción          | Qué hace                                                                                                                                                                             |
  | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | Rellenar        | Escanea los archivos históricos `memory/YYYY-MM-DD.md` del espacio de trabajo activo, ejecuta la pasada de diario REM anclada y escribe entradas de relleno reversibles en `DREAMS.md`. |
  | Restablecer     | Elimina únicamente las entradas de diario de relleno marcadas de `DREAMS.md`.                                                                                                 |
  | Borrar anclados | Elimina únicamente las entradas provisionales a corto plazo exclusivas del contenido anclado procedentes de la reproducción histórica que aún no han acumulado recuperación en vivo ni respaldo diario. |

  Ninguna de estas acciones edita `MEMORY.md`, ejecuta migraciones completas de doctor ni incorpora por sí sola candidatos anclados en el almacén de promoción a corto plazo en vivo. Para introducir la reproducción histórica anclada en la vía normal de promoción profunda, use en su lugar el flujo de la CLI:

  ```bash
  openclaw memory rem-backfill --path ./memory --stage-short-term
  ```

  Esto incorpora candidatos duraderos anclados en el almacén de Dreaming a corto plazo, mientras que `DREAMS.md` sigue siendo la superficie de revisión.

  ## Comportamiento detallado y justificación

  <AccordionGroup>
  <Accordion title="0. Actualización opcional (instalaciones de git)">
    Si se trata de un checkout de git y doctor se ejecuta de forma interactiva, ofrece actualizar (fetch/rebase/build) antes de ejecutar doctor.
  </Accordion>
  <Accordion title="1. Normalización de la configuración">
    Doctor normaliza las formas de valores heredadas al esquema actual. La configuración actual de voz de Talk es `talk.provider` + `talk.providers.<provider>`, con la configuración de voz en tiempo real en `talk.realtime.*`. Doctor reescribe las formas antiguas `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` en el mapa de proveedores y reescribe los selectores heredados de nivel superior para tiempo real (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) en `talk.realtime`.

    Doctor también advierte cuando `plugins.allow` no está vacío y la política de herramientas usa entradas comodín o de herramientas pertenecientes a plugins. `tools.allow: ["*"]` solo coincide con herramientas de plugins que realmente se cargan; no elude la lista exclusiva de plugins permitidos.

  </Accordion>
  <Accordion title="2. Migraciones de claves de configuración heredadas">
    Cuando la configuración contiene una clave obsoleta con una migración activa, los demás comandos se niegan a ejecutarse y solicitan ejecutar `openclaw doctor`. Doctor explica qué claves heredadas se encontraron, muestra la migración aplicada y reescribe `~/.openclaw/openclaw.json` con el esquema actualizado. El inicio del Gateway rechaza los formatos de configuración heredados y solicita ejecutar `openclaw doctor --fix`; no reescribe `openclaw.json` durante el inicio. `openclaw doctor --fix` también gestiona las migraciones del almacén de trabajos de Cron.

    <Note>
      Doctor solo conserva migraciones automáticas durante aproximadamente dos
      meses después de retirar una clave. Las claves heredadas más antiguas (por
      ejemplo, las originales `routing.queue`, `routing.bindings`,
      `routing.agents`/`defaultAgentId`, `routing.transcribeAudio`, la
      `agent.*` de nivel superior o la `identity` de nivel
      superior de la forma de configuración anterior a múltiples agentes) ya no
      disponen de una ruta de migración; la configuración que las usa ahora no
      supera la validación en lugar de reescribirse. Corrija esas claves
      manualmente conforme a la referencia de configuración actual antes de que
      doctor pueda continuar.
    </Note>

    Migraciones activas:

    | Clave heredada                                                                                    | Clave actual                                                                 |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`, `gateway.webchat`                                                            | eliminada (WebChat se ha retirado)                                                 |
    | `channels.feishu.accounts.<accountId>.botName`                                                   | `channels.feishu.accounts.<accountId>.name`                                 |
    | `session.threadBindings.ttlHours`, `channels.<id>.threadBindings.ttlHours` (y por cuenta)      | `...threadBindings.idleHours`                                               |
    | `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` heredadas        | `talk.provider` + `talk.providers.<provider>`                               |
    | selectores heredados de Talk en tiempo real de nivel superior (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) | `talk.realtime`                                                              |
    | `messages.tts`                                                                                  | `tts` de nivel superior                                                              |
    | `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)                             | `tts.providers.<provider>`                                                   |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                  | `tts.provider: "microsoft"` / `tts.providers.microsoft`                    |
    | `tools.exec.security` + `tools.exec.ask`                                                         | `tools.exec.mode`                                                            |
    | `session.idleMinutes`                                                                            | `session.reset.idleMinutes`                                                  |
    | `messages.responsePrefix` con bloques de canal explícitos                                           | se copia en `responsePrefix` del canal o la cuenta configurados; se conserva la alternativa global para canales implícitos o personalizados |
    | `web.enabled`                                                                                    | `channels.whatsapp.enabled`                                                  |
    | `meta.lastTouchedAt`, instalaciones de hooks, almacén de Cron, detección integrada, ruta global de preferencias de TTS            | estado SQLite compartido                                                       |
    | campos de voz de TTS `voice`/`voiceName`/`voiceId`                                                 | `speakerVoice`/`speakerVoiceId`                                              |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>` (todos los canales excepto Discord)                                          | `...tts.providers.<provider>`                                                |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>` (todos los canales, incluido Discord)                          | `...voice.tts.providers.<provider>`                                          |
    | `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)     | `plugins.entries.voice-call.config.tts.providers.<provider>`                |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                | `provider: "microsoft"` / `...tts.providers.microsoft`                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                              | `"mock"`                                                                      |
    | `plugins.entries.voice-call.config.twilio.from`                                                  | `plugins.entries.voice-call.config.fromNumber`                              |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                        | `plugins.entries.voice-call.config.streaming.provider`                      |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"` (el inicio del Gateway también omite los proveedores cuyo `api` es un valor de enumeración futuro o desconocido, en lugar de fallar de forma cerrada) |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | eliminada (configuración heredada del relé de la extensión de Chrome)                             |
    | `mcp.servers.*.type` (alias nativos de la CLI)                                                        | `mcp.servers.*.transport`                                                    |
    | `mcp.servers.*.disabled`                                                                         | `mcp.servers.*.enabled` inversa                                              |
    | alias de tiempo de espera de MCP `connectTimeout`/`connect_timeout`/`timeout`                                 | `connectionTimeoutMs`/`requestTimeoutMs`                                    |
    | campos de servidor MCP en snake_case                                                                     | campos de servidor MCP en camelCase                                                   |
    | `tools.media.image/audio/video.models`                                                           | `tools.media.models` con etiqueta de capacidad                                        |
    | `tools.media.asyncCompletion`                                                                    | eliminada                                                                       |
    | `tools.message.allowCrossContextSend`                                                            | `tools.message.crossContext`                                                  |
    | opciones `deepgram` del modelo multimedia                                                                   | `providerOptions.deepgram`                                                    |
    | `talk.realtime.voice`, `voice` de tiempo real de Discord                                                 | `speakerVoice`                                                                |
    | `agents.defaults.pdfMaxBytesMb`                                                                  | `agents.defaults.pdfMaxMb`                                                    |
    | `tools.exec.timeoutSec`                                                                          | `tools.exec.timeoutSeconds`                                                   |
    | `browser.ssrfPolicy.hostnameAllowlist`                                                           | `browser.ssrfPolicy.allowedHostnames` compatible con comodines                          |
    | `enableNoVnc` del navegador del sandbox                                                                    | `noVncEnabled`                                                                |
    | `media` raíz                                                                                     | `attachments`                                                                |
    | bloques de visibilidad `heartbeat` de canal o cuenta                                                   | `heartbeatVisibility`                                                         |
    | `channels.slack.identity`                                                                        | `channels.slack.postAs`                                                       |
    | `audit` raíz                                                                                     | `logging.audit`                                                               |
    | `gateway.nodes.skills.enabled`                                                                   | `gateway.nodes.allowSkills`                                                   |
    | `gateway.nodes.allowCommands`/`denyCommands`                                                    | `gateway.nodes.commands.allow`/`deny`                                         |
    | valores predeterminados del modelo de generación                                                                       | `agents.defaults.mediaModels.{image,video,music}`                              |
    | controles retirados de ajuste del diseño final                                                               | comportamiento predeterminado integrado                                                     |
    | `channels.whatsapp.messagePrefix` y `messages.messagePrefix` heredada                            | `channels.whatsapp.responsePrefix`                                            |
    | `channels.whatsapp.ackReaction`                                                                  | `messages.ackReaction` global y `ackReactionScope` donde se puedan traducir        |
    | `cron.failureDestination`                                                                        | campos de destino en `cron.failureAlert`                                     |
    | `gateway.controlUi.chatMessageMaxWidth`                                                          | `ui.prefs.chatMessageMaxWidth`                                                |
    | `agents.list`                                                                                    | `agents.entries` con clave                                                        |
    | `defaultModel` de nivel superior                                                                         | `agents.defaults.model`                                                      |
    | `messages.messagePrefix`                                                                         | `channels.whatsapp.responsePrefix`                                            |
    | `session.maintenance.pruneDays`, `session.resetByType.dm`                                        | `session.maintenance.pruneAfter`, `session.resetByType.direct`               |
    | `tui` de nivel superior                                                                                  | eliminada (el pie de página de la TUI utiliza el valor predeterminado compacto)                            |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | eliminada (el servidor de aplicaciones de Codex siempre mantiene nativas las herramientas de espacio de trabajo propias de Codex) |
    | `commands.modelsWrite`                                                                           | eliminada (`/models add` está obsoleta)                                       |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                     | eliminadas (el valor exacto `NO_REPLY` ya no se reescribe como texto alternativo visible)  |
    | `agents.defaults/list[].systemPromptOverride`                                                    | eliminada (OpenClaw controla el prompt del sistema generado)                        |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | eliminada (utilice `models.providers.<id>.timeoutSeconds` para tiempos de espera prolongados de modelos o proveedores, manteniéndolos por debajo del límite de tiempo de espera del agente o la ejecución) |
    | `memorySearch`, `agents.defaults.memorySearch` de nivel superior                                         | `memory.search`                                                             |
    | `agents.entries.*.memorySearch`                                                                     | `agents.entries.*.memory.search`                                               |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path` (cualquier nivel)                                                            | eliminado (los índices de memoria residen en la base de datos de cada agente)                       |
    | `heartbeat` de nivel superior                                                                            | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | identificadores de políticas de `plugins.openai-codex`                                                                | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                 | eliminados (obsoletos)                                                        |
    | Opciones de ajuste del runtime y los canales retiradas en 2026.7                                               | eliminadas (se aplican los valores predeterminados de producción integrados)                               |

    <Note>
      Las filas `plugins.entries.voice-call.config.*` anteriores las normaliza
      el propio plugin Voice Call cada vez que se carga la configuración, no `openclaw
      doctor`. El plugin también registra una advertencia de inicio que señala a `openclaw
      doctor --fix`, pero doctor actualmente no reescribe
      `openclaw.json` para estas claves; la normalización propia del plugin es la que
      aplica el cambio en tiempo de ejecución.
    </Note>

    Orientación sobre la cuenta predeterminada para canales con varias cuentas:

    - Si se configuran dos o más entradas `channels.<channel>.accounts` sin `channels.<channel>.defaultAccount` ni `accounts.default`, doctor advierte que el enrutamiento de reserva puede elegir una cuenta inesperada.
    - Si `channels.<channel>.defaultAccount` se establece en un ID de cuenta desconocido, doctor muestra una advertencia y enumera los ID de cuenta configurados.

  </Accordion>
  <Accordion title="2b. Invalidaciones del proveedor OpenCode">
    Si se ha añadido manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`, se invalida el catálogo integrado de OpenCode de `openclaw/plugin-sdk/llm`. Esto puede forzar a los modelos a usar la API incorrecta o reducir los costes a cero. Doctor muestra una advertencia para que se pueda eliminar la invalidación y restaurar el enrutamiento de API y los costes específicos de cada modelo.
  </Accordion>
  <Accordion title="2c. Migración del navegador y preparación de Chrome MCP">
    Si la configuración del navegador aún apunta a la ruta eliminada de la extensión de Chrome, doctor la normaliza al modelo actual de conexión de Chrome MCP local al host (`browser.profiles.*.driver: "extension"` → `"existing-session"`; se elimina `browser.relayBindHost`).

    Doctor también audita la ruta de Chrome MCP local al host cuando se usa `defaultProfile: "user"` o un perfil `existing-session` configurado:

    - comprueba si Google Chrome está instalado en el mismo host para los perfiles predeterminados de conexión automática
    - comprueba la versión de Chrome detectada y muestra una advertencia cuando es anterior a Chrome 144
    - recuerda que se debe habilitar la depuración remota en la página de inspección del navegador (por ejemplo, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor no puede habilitar la opción de Chrome. Chrome MCP local al host sigue requiriendo un navegador basado en Chromium 144+ en el host del gateway/nodo, ejecutándose localmente, con la depuración remota habilitada y la primera solicitud de consentimiento de conexión aprobada en el navegador.

    La comprobación de preparación solo abarca los requisitos previos de conexión local. Existing-session mantiene los límites actuales de rutas de Chrome MCP; las rutas avanzadas como `responsebody`, la exportación a PDF, la interceptación de descargas y las acciones por lotes siguen requiriendo un navegador administrado o un perfil CDP sin procesar. Esta comprobación no se aplica a Docker, entornos aislados, navegadores remotos ni otros flujos sin interfaz gráfica, que siguen usando CDP sin procesar.

  </Accordion>
  <Accordion title="2d. Requisitos previos de TLS para OAuth">
    Cuando se configura un perfil OAuth de OpenAI Codex, doctor consulta el punto de conexión de autorización de OpenAI para verificar que la pila TLS local de Node/OpenSSL pueda validar la cadena de certificados. Si la consulta falla con un error de certificado (por ejemplo, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado caducado o certificado autofirmado), doctor muestra instrucciones de corrección específicas para la plataforma. En macOS con una instalación de Node de Homebrew, la solución suele ser `brew postinstall ca-certificates`. Con `--deep`, la consulta se ejecuta aunque el gateway esté en buen estado.
  </Accordion>
  <Accordion title="2e. Invalidaciones del proveedor OAuth de Codex">
    Si anteriormente se añadieron opciones de transporte heredadas de OpenAI en `models.providers.openai-codex`, estas pueden ocultar la ruta integrada del proveedor OAuth de Codex. Doctor muestra una advertencia cuando detecta esas opciones de transporte antiguas junto con OAuth de Codex para que se pueda eliminar o reescribir la invalidación de transporte obsoleta y restaurar el comportamiento de enrutamiento actual. Los proxies personalizados y las invalidaciones exclusivas de encabezados siguen siendo compatibles y no activan esta advertencia, pero esas rutas de solicitud definidas por el usuario no son aptas para la selección implícita de Codex.
  </Accordion>
  <Accordion title="2f. Reparación de rutas de Codex">
    Doctor comprueba si hay referencias de modelo `openai-codex/*` heredadas. El enrutamiento del entorno nativo de Codex usa referencias de modelo `openai/*` canónicas, pero el prefijo por sí solo nunca selecciona Codex. Si la política de tiempo de ejecución no está definida o es `auto`, solo es apta una ruta oficial HTTPS exacta de Platform Responses o ChatGPT Responses sin ninguna invalidación de solicitud definida por el usuario. Véase [tiempo de ejecución implícito del agente de OpenAI](/es/providers/openai#implicit-agent-runtime).

    En el modo `--fix` / `--repair`, doctor reescribe las referencias afectadas del agente predeterminado y de cada agente, incluidos los modelos principales, las alternativas, los modelos de generación de imágenes/vídeos, las invalidaciones de heartbeat/subagente/compaction, los hooks, las invalidaciones de modelos de canales y el estado obsoleto de rutas de sesión persistentes:

    - `openai-codex/gpt-*` se convierte en `openai/gpt-*`.
    - La intención de Codex se traslada a entradas `agentRuntime.id: "codex"` con ámbito de proveedor/modelo para las referencias de modelo de agente reparadas.
    - Se eliminan la configuración obsoleta del tiempo de ejecución de todo el agente y las fijaciones persistentes del tiempo de ejecución de la sesión porque la selección del tiempo de ejecución tiene ámbito de proveedor/modelo.
    - La política de tiempo de ejecución existente del proveedor/modelo se conserva, salvo que la referencia de modelo heredada reparada necesite el enrutamiento de Codex para mantener la ruta de autenticación anterior.
    - Las listas de modelos alternativos existentes se conservan con sus entradas heredadas reescritas; las opciones copiadas de cada modelo se trasladan de la clave heredada a la clave canónica `openai/*`.
    - Los `modelProvider`/`providerOverride`, `model`/`modelOverride`, avisos de alternativa y fijaciones de perfiles de autenticación persistentes de la sesión se reparan en todos los almacenes de sesiones de agentes detectados.
    - Doctor repara por separado las fijaciones `agentRuntime.id: "codex-cli"` obsoletas (un ID de tiempo de ejecución heredado distinto) a `"codex"` en las entradas de modelo `agents.defaults`, `agents.entries.*` y `models.providers.*`.
    - `/codex ...` significa «controlar o vincular una conversación nativa de Codex desde el chat».
    - `/acp ...` o `runtime: "acp"` significa «usar el adaptador externo ACP/acpx».

  </Accordion>
  <Accordion title="2g. Limpieza de rutas de sesión">
    Doctor también examina los almacenes de sesiones de agentes detectados en busca de estados de rutas obsoletos creados automáticamente después de trasladar los modelos configurados o el tiempo de ejecución fuera de una ruta perteneciente a un plugin, como Codex.

    `openclaw doctor --fix` puede borrar estados obsoletos creados automáticamente, como fijaciones de modelos `modelOverrideSource: "auto"`, metadatos de modelos de tiempo de ejecución, ID de entornos fijados, vinculaciones de sesiones de CLI e invalidaciones automáticas de perfiles de autenticación cuando la ruta propietaria deja de estar configurada. Las elecciones explícitas del usuario o heredadas sobre el modelo de la sesión se notifican para su revisión manual y no se modifican; se pueden cambiar con `/model ...`, `/new` o restableciendo la sesión cuando esa ruta ya no sea necesaria.

  </Accordion>
  <Accordion title="3. Migraciones de estados heredados (disposición en disco)">
    Doctor puede migrar disposiciones antiguas en disco a la estructura actual:

    - Almacén de sesiones y transcripciones: de `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directorio del agente: de `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticación de WhatsApp (Baileys): del `~/.openclaw/credentials/*.json` heredado (excepto `oauth.json`) a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de cuenta predeterminado: `default`)
    - Identidad firmada del dispositivo: de `~/.openclaw/identity/device.json` a la fila `device_identities` de `primary` en `state/openclaw.sqlite`; el archivo independiente de autenticación del dispositivo no se modifica

    Estas migraciones son de mejor esfuerzo e idempotentes; doctor emite advertencias cuando deja carpetas heredadas como copias de seguridad. El Gateway/CLI también migra automáticamente el directorio heredado de sesiones y agentes durante el inicio, de modo que el historial, la autenticación y los modelos se almacenen en la ruta específica de cada agente sin tener que ejecutar doctor manualmente. La autenticación de WhatsApp solo se migra intencionadamente mediante `openclaw doctor`. La normalización del proveedor/mapa de proveedores de Talk compara mediante igualdad estructural, por lo que las diferencias debidas únicamente al orden de las claves ya no activan cambios `doctor --fix` repetidos sin efecto.

  </Accordion>
  <Accordion title="3a. Migraciones de manifiestos de plugins heredados">
    Doctor examina todos los manifiestos de plugins instalados en busca de claves de capacidad de nivel superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Cuando las encuentra, ofrece trasladarlas al objeto `contracts` y reescribir el archivo de manifiesto en el mismo lugar. Esta migración es idempotente; si `contracts` ya contiene los mismos valores, la clave heredada se elimina sin duplicar los datos.
  </Accordion>
  <Accordion title="3b. Migraciones del almacén de Cron heredado">
    Doctor también comprueba si el almacén heredado de trabajos de Cron (`~/.openclaw/cron/jobs.json`) contiene formatos antiguos de trabajos antes de importar las filas canónicas a SQLite.

    Las limpiezas actuales de Cron incluyen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de carga útil de nivel superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nivel superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de entrega `provider` de la carga útil → `delivery.channel` explícito
    - trabajos heredados de reserva del webhook `notify: true` → entrega explícita mediante webhook a partir del valor `cron.webhook` sin procesar y retirado cuando sea válido; los trabajos de anuncio mantienen su entrega por chat y reciben `delivery.completionDestination`. Después, doctor elimina la clave de configuración antigua. Si no hay un webhook heredado utilizable, se elimina el marcador inerte de nivel superior `notify` para los trabajos sin destino (se conserva la entrega existente, incluidos los anuncios), ya que la entrega en tiempo de ejecución nunca lo lee.

    El Gateway también depura las filas de Cron mal formadas al cargarlas para que los trabajos válidos sigan ejecutándose. Las filas sin procesar mal formadas se copian en `jobs-quarantine.json`, junto al almacén activo, antes de eliminarlas de `jobs.json`; doctor informa de las filas puestas en cuarentena para que se puedan revisar o reparar manualmente.

    Al iniciarse, el Gateway normaliza la proyección del tiempo de ejecución e ignora el marcador de nivel superior `notify`, pero conserva el estado persistente de Cron para que doctor lo repare. Doctor elimina los marcadores inertes de los trabajos sin un destino de migración (`delivery.mode` ninguno/ausente, un destino de webhook heredado inutilizable o una entrega existente de anuncio/chat), sin modificar la entrega existente, por lo que las ejecuciones repetidas de `doctor --fix` ya no vuelven a advertir sobre el mismo trabajo.

    En Linux, doctor también muestra una advertencia cuando el crontab del usuario aún invoca el `~/.openclaw/bin/ensure-whatsapp.sh` heredado. Ese script local al host no recibe mantenimiento por parte de la versión actual de OpenClaw y puede escribir mensajes `Gateway inactive` falsos en `~/.openclaw/logs/whatsapp-health.log` cuando Cron no puede acceder al bus de usuario de systemd. Elimine la entrada obsoleta del crontab con `crontab -e`; use `openclaw channels status --probe`, `openclaw doctor` y `openclaw gateway status` para las comprobaciones de estado actuales.

  </Accordion>
  <Accordion title="3c. Limpieza de bloqueos de sesión">
    Doctor analiza cada directorio de sesiones de agente en busca de archivos obsoletos de bloqueo de escritura que hayan quedado después de que una sesión terminara de forma anómala. Por cada archivo de bloqueo encontrado, informa de: la ruta, el PID, si el PID sigue activo, la antigüedad del bloqueo y si se considera obsoleto (PID inactivo, metadatos del propietario con formato incorrecto, más de 30 minutos de antigüedad o un PID activo que se ha demostrado que pertenece a un proceso ajeno a OpenClaw). En el modo `--fix` / `--repair`, elimina automáticamente los bloqueos cuyos propietarios estén inactivos, huérfanos, reciclados, tengan metadatos antiguos con formato incorrecto o no pertenezcan a OpenClaw. Los bloqueos antiguos que aún pertenecen a un proceso activo de OpenClaw se notifican, pero se dejan en su lugar para que doctor no interrumpa un escritor de transcripciones activo.
  </Accordion>
  <Accordion title="3d. Reparación de ramas de transcripciones de sesión">
    Doctor analiza los archivos JSONL de sesiones de agente en busca de la estructura de ramas duplicadas creada por el error de reescritura de transcripciones de prompts de la versión 2026.4.24: un turno de usuario abandonado con contexto interno de ejecución de OpenClaw y un elemento hermano activo que contiene el mismo prompt visible del usuario. En el modo `--fix` / `--repair`, doctor crea una copia de seguridad de cada archivo afectado junto al original y reescribe la transcripción para conservar la rama activa, de modo que el historial del Gateway y los lectores de memoria dejen de ver turnos duplicados.
  </Accordion>
  <Accordion title="4. Comprobaciones de integridad del estado (persistencia de sesiones, enrutamiento y seguridad)">
    El directorio de estado es el centro neurálgico operativo. Si desaparece, se pierden las sesiones, las credenciales, los registros y la configuración, a menos que existan copias de seguridad en otro lugar.

    Doctor comprueba:

    - **Falta el directorio de estado**: advierte sobre una pérdida catastrófica del estado, solicita volver a crear el directorio y recuerda que no puede recuperar los datos ausentes.
    - **Permisos del directorio de estado**: verifica que se pueda escribir en él; ofrece reparar los permisos (y muestra una indicación `chown` cuando detecta una discrepancia de propietario o grupo).
    - **Directorio de estado sincronizado con la nube en macOS**: advierte cuando el estado se resuelve dentro de iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...`, porque las rutas respaldadas por sincronización pueden provocar operaciones de E/S más lentas y condiciones de carrera entre bloqueos y sincronización.
    - **Directorio de estado en SD o eMMC en Linux**: advierte cuando el estado se resuelve en una fuente de montaje `mmcblk*`, porque la E/S aleatoria respaldada por SD/eMMC puede ser más lenta y desgastar el medio con mayor rapidez durante las escrituras de sesiones y credenciales.
    - **Directorio de estado volátil en Linux**: advierte cuando el estado se resuelve en `tmpfs` o `ramfs`, porque las sesiones, las credenciales, la configuración y el estado de SQLite (con archivos auxiliares WAL o de diario) desaparecen al reiniciar. Los montajes `overlay` de Docker no se marcan intencionadamente porque sus capas escribibles persisten entre reinicios del host mientras el contenedor siga existiendo.
    - **Faltan directorios de sesiones**: `sessions/` y el directorio del almacén de sesiones son necesarios para conservar el historial y evitar fallos de `ENOENT`.
    - **Discrepancia de transcripción**: advierte cuando las entradas de sesiones recientes no tienen sus archivos de transcripción.
    - **Sesión principal con «JSONL de 1 línea»**: marca los casos en los que la transcripción principal solo tiene una línea (el historial no se está acumulando).
    - **Varios directorios de estado**: advierte cuando existen varias carpetas `~/.openclaw` en distintos directorios personales o cuando `OPENCLAW_STATE_DIR` apunta a otro lugar (el historial puede dividirse entre instalaciones).
    - **Recordatorio del modo remoto**: si `gateway.mode=remote`, doctor recuerda que debe ejecutarse en el host remoto (el estado reside allí).
    - **Permisos del archivo de configuración**: advierte si `~/.openclaw/openclaw.json` permite la lectura al grupo o a cualquier usuario y ofrece restringirlo a `600`.

  </Accordion>
  <Accordion title="5. Estado de la autenticación de modelos (caducidad de OAuth)">
    Doctor inspecciona los perfiles OAuth del almacén de autenticación, advierte cuando los tokens están a punto de caducar o ya han caducado y puede renovarlos cuando sea seguro. Si el perfil OAuth o de token de Anthropic está obsoleto, sugiere una clave de API de Anthropic o la ruta del token de configuración de Anthropic. Las solicitudes de renovación solo aparecen cuando se ejecuta de forma interactiva (TTY); `--non-interactive` omite los intentos de renovación.

    Cuando una renovación de OAuth falla de forma permanente (por ejemplo, `refresh_token_reused`, `invalid_grant` o un proveedor indica que es necesario volver a iniciar sesión), doctor informa de que se requiere volver a autenticarse y muestra el comando exacto `openclaw models auth login --provider ...` que debe ejecutarse.

    Doctor también informa de los perfiles de autenticación que no pueden utilizarse temporalmente debido a periodos breves de espera (límites de frecuencia, tiempos de espera o fallos de autenticación) o inhabilitaciones más prolongadas (fallos de facturación o crédito).

    Los perfiles OAuth heredados de Codex cuyos tokens residen en el llavero de macOS (incorporación anterior al diseño de archivos auxiliares) solo se reparan mediante doctor. Ejecute `openclaw doctor --fix` una vez desde un terminal interactivo para migrar directamente los tokens heredados respaldados por el llavero a `auth-profiles.json`; después, los turnos integrados (Telegram, cron y delegación a subagentes) los resuelven como perfiles OAuth canónicos de OpenAI.

  </Accordion>
  <Accordion title="6. Validación del modelo de hooks">
    Si se establece `hooks.gmail.model`, doctor valida la referencia del modelo con el catálogo y la lista de permitidos, y advierte cuando no se pueda resolver o no esté permitida.
  </Accordion>
  <Accordion title="7. Reparación de imágenes del entorno aislado">
    Cuando el aislamiento está habilitado, doctor comprueba las imágenes de Docker y ofrece crearlas o cambiar a nombres heredados si falta la imagen actual.
  </Accordion>
  <Accordion title="7b. Limpieza de instalaciones de plugins">
    En el modo `openclaw doctor --fix` / `openclaw doctor --repair`, doctor elimina el estado heredado de preparación de dependencias de plugins generado por OpenClaw: raíces obsoletas de dependencias generadas, directorios antiguos de preparación de instalaciones, residuos locales de paquetes procedentes del código anterior de reparación de dependencias de plugins incluidos y copias npm administradas huérfanas o recuperadas de plugins `@openclaw/*` incluidos que pueden ocultar el manifiesto incluido actual. Doctor también vuelve a enlazar el paquete `openclaw` del host con los plugins npm administrados que declaran `peerDependencies.openclaw`, para que las importaciones locales del entorno de ejecución del paquete, como `openclaw/plugin-sdk/*`, sigan resolviéndose después de actualizaciones o reparaciones de npm.

    Doctor también puede reinstalar plugins descargables ausentes cuando la configuración hace referencia a ellos, pero el registro local de plugins no puede encontrarlos (`plugins.entries` material, ajustes configurados de canales, proveedores o búsqueda, y entornos de ejecución de agentes configurados). Durante las actualizaciones de paquetes, doctor evita reinstalar paquetes de plugins mientras se sustituye el paquete principal; ejecute de nuevo `openclaw doctor --fix` después de la actualización si un plugin configurado aún necesita recuperarse. Fuera de la excepción de inicio de imágenes de contenedor que se describe a continuación, el inicio del Gateway y la recarga de la configuración no ejecutan reparaciones de paquetes; las instalaciones de plugins siguen siendo tareas explícitas de doctor, instalación o actualización.

    El inicio del Gateway en contenedores tiene una excepción limitada para actualizaciones: cuando `openclaw gateway run` se inicia con una nueva versión de OpenClaw, ejecuta migraciones seguras del estado y la convergencia de plugins posterior a la actualización del núcleo antes de estar listo, y después registra un punto de control por versión. Esta pasada de inicio puede limpiar registros obsoletos de plugins incluidos, reparar enlaces locales de plugins, reinstalar paquetes de plugins configurados cuando la ruta de convergencia lo requiera y comprobar las cargas útiles de los plugins activos. Si el inicio no puede realizar la reparación de forma segura, ejecute la misma imagen una vez con `openclaw doctor --fix` sobre el mismo estado y la misma configuración montados antes de reiniciar el contenedor con normalidad.

  </Accordion>
  <Accordion title="8. Migraciones del servicio Gateway e indicaciones de limpieza">
    Doctor detecta servicios Gateway heredados (launchd/systemd/schtasks) y ofrece eliminarlos e instalar el servicio de OpenClaw con el puerto actual del Gateway. También puede buscar servicios adicionales similares al Gateway y mostrar indicaciones de limpieza. Los servicios Gateway de OpenClaw con nombre de perfil se consideran de primera clase y no se marcan como «adicionales».

    En Linux, si falta el servicio Gateway de nivel de usuario, pero existe un servicio Gateway de OpenClaw de nivel de sistema, doctor no instala automáticamente un segundo servicio de nivel de usuario. Inspecciónelo con `openclaw gateway status --deep` o `openclaw doctor --deep` y, después, elimine el duplicado o establezca `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando un supervisor del sistema gestione el ciclo de vida del Gateway.

  </Accordion>
  <Accordion title="8b. Migración de Matrix al iniciar">
    Cuando una cuenta de canal de Matrix tiene una migración de estado heredado pendiente o susceptible de realizarse, doctor, en el modo `--fix` / `--repair`, crea una instantánea previa a la migración y, después, ejecuta los pasos de migración con el máximo esfuerzo posible: la migración del estado heredado de Matrix y la preparación del estado cifrado heredado. Ninguno de los dos pasos es fatal; los errores se registran y el inicio continúa. En el modo de solo lectura (`openclaw doctor` sin `--fix`), esta comprobación se omite por completo.
  </Accordion>
  <Accordion title="8c. Vinculación de dispositivos y desviación de autenticación">
    Doctor inspecciona el estado de vinculación de dispositivos como parte de la comprobación normal de estado e informa de:

    - solicitudes pendientes de vinculación inicial
    - actualizaciones pendientes de rol o ámbito para dispositivos ya vinculados
    - reparaciones de discrepancias de clave pública en las que el identificador del dispositivo sigue coincidiendo, pero la identidad del dispositivo ya no coincide con el registro aprobado
    - registros vinculados sin un token activo para un rol aprobado
    - tokens vinculados cuyos ámbitos se desvían de la referencia aprobada de vinculación
    - entradas locales almacenadas en caché de tokens de dispositivo para la máquina actual que son anteriores a una rotación del token en el Gateway o que contienen metadatos de ámbito obsoletos

    Doctor no aprueba automáticamente las solicitudes de vinculación ni rota automáticamente los tokens de dispositivo. Muestra los siguientes pasos exactos:

    - inspeccionar las solicitudes pendientes con `openclaw devices list`
    - aprobar la solicitud exacta con `openclaw devices approve <requestId>`
    - rotar un token nuevo con `openclaw devices rotate --device <deviceId> --role <role>`
    - eliminar y volver a aprobar un registro obsoleto con `openclaw devices remove <deviceId>`

    Esto diferencia la vinculación inicial de las actualizaciones pendientes de rol o ámbito y de la desviación de tokens obsoletos o de la identidad del dispositivo, con lo que se cierra el caso habitual de «ya está vinculado, pero sigue apareciendo que se requiere vinculación».

  </Accordion>
  <Accordion title="9. Advertencias de seguridad">
    Doctor muestra una nota de seguridad solo cuando encuentra una advertencia, como un proveedor abierto a mensajes directos sin una lista de permitidos o una política configurada de forma peligrosa. Utilice `openclaw security audit` para consultar el inventario de seguridad completo.
  </Accordion>
  <Accordion title="10. Permanencia de systemd (Linux)">
    Si se ejecuta como servicio de usuario de systemd, doctor garantiza que la permanencia esté habilitada para que el Gateway siga activo después de cerrar la sesión.
  </Accordion>
  <Accordion title="11. Estado del espacio de trabajo (Skills, plugins y TaskFlows)">
    Doctor muestra los problemas y las acciones del agente predeterminado, no el inventario del estado correcto:

    - **Skills**: enumera los nombres de Skills permitidas pero inutilizables; utilice `openclaw skills check` para consultar los detalles de los requisitos y los recuentos completos.
    - **Plugins**: informa únicamente de los identificadores de plugins con errores; utilice `openclaw plugins list` para consultar el inventario de plugins cargados, importados, deshabilitados e incluidos.
    - **Advertencias de compatibilidad de plugins**: marca los plugins que tienen problemas de compatibilidad con el entorno de ejecución actual.
    - **Diagnósticos de plugins**: muestra cualquier advertencia o error emitido por el registro de plugins durante la carga.
    - **Recuperación de TaskFlow**: muestra los TaskFlows administrados sospechosos que requieren inspección manual o cancelación.
    - **CLI de Claude**: informa únicamente de problemas del binario, la autenticación, el perfil, el espacio de trabajo o el directorio del proyecto; se omiten los detalles de las comprobaciones correctas.

  </Accordion>
  <Accordion title="11b. Tamaño de los archivos de arranque">
    Doctor comprueba si los archivos de arranque del espacio de trabajo (por ejemplo, `AGENTS.md`, `CLAUDE.md` u otros archivos de contexto insertados) están cerca del presupuesto de caracteres configurado o lo superan. Informa de los recuentos de caracteres sin procesar e insertados por archivo, el porcentaje de truncamiento, la causa del truncamiento (`max/file` o `max/total`) y el total de caracteres insertados como fracción del presupuesto total. Cuando los archivos están truncados o cerca del límite, doctor muestra consejos para ajustar `agents.defaults.bootstrapMaxChars` y `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Autocompletado del shell">
    Doctor comprueba si el autocompletado con el tabulador está instalado para el shell actual (zsh, bash, fish o PowerShell):

    - Si el perfil del shell usa un patrón de completado dinámico lento (`source <(openclaw completion ...)`), doctor lo actualiza a la variante más rápida basada en un archivo en caché.
    - Si el completado está configurado en el perfil, pero falta el archivo de caché, doctor regenera automáticamente la caché.
    - Si no hay ningún completado configurado, doctor solicita instalarlo (solo en modo interactivo; se omite con `--non-interactive`).

    Ejecute `openclaw completion --write-state` para regenerar manualmente la caché.

  </Accordion>
  <Accordion title="11d. Limpieza de plugins de canal obsoletos">
    Cuando `openclaw doctor --fix` elimina un plugin de canal ausente, también elimina la configuración pendiente con ámbito de canal que hacía referencia a ese plugin: entradas `channels.<id>`, destinos de Heartbeat que nombraban el canal y anulaciones `agents.*.models["<channel>/*"]`. Esto evita bucles de arranque del Gateway en los que el runtime del canal ya no existe, pero la configuración aún solicita al Gateway que se vincule a él.
  </Accordion>
  <Accordion title="12. Comprobaciones de autenticación del Gateway (token local)">
    Doctor comprueba que la autenticación mediante token local del Gateway esté lista.

    - Si el modo de token necesita un token y no existe ninguna fuente de tokens, doctor ofrece generar uno.
    - Si `gateway.auth.token` está gestionado mediante SecretRef, pero no está disponible, doctor muestra una advertencia y no lo sobrescribe con texto sin formato.
    - `openclaw doctor --generate-gateway-token` fuerza la generación solo cuando no hay ningún SecretRef de token configurado.

  </Accordion>
  <Accordion title="12b. Reparaciones de solo lectura compatibles con SecretRef">
    Algunos flujos de reparación necesitan inspeccionar las credenciales configuradas sin debilitar el comportamiento de fallo inmediato del runtime.

    - `openclaw doctor --fix` usa el mismo modelo de resumen de SecretRef de solo lectura que los comandos de la familia de estado para realizar reparaciones específicas de la configuración.
    - Ejemplo: la reparación de `@username` de Telegram `allowFrom` / `groupAllowFrom` intenta usar las credenciales configuradas del bot cuando están disponibles.
    - Si el token del bot de Telegram está configurado mediante SecretRef, pero no está disponible en la ruta del comando actual, doctor indica que la credencial está configurada pero no disponible y omite la resolución automática en lugar de fallar o indicar erróneamente que falta el token.

  </Accordion>
  <Accordion title="13. Comprobación de estado y reinicio del Gateway">
    Doctor ejecuta una comprobación de estado y ofrece reiniciar el Gateway cuando parece no estar en buen estado.
  </Accordion>
  <Accordion title="13b. Disponibilidad de la búsqueda en memoria">
    Doctor comprueba si el proveedor de embeddings configurado para la búsqueda en memoria está listo para el agente predeterminado. El comportamiento depende del backend y del proveedor configurados:

    - **Backend QMD**: comprueba si el binario `qmd` está disponible y se puede iniciar. Si no es así, muestra indicaciones para corregirlo, incluido `npm install -g @tobilu/qmd` (o el equivalente de Bun), y una opción de ruta manual al binario.
    - **Proveedor local explícito**: comprueba si existe un archivo de modelo local o una URL reconocida de un modelo remoto o descargable. Si falta, sugiere cambiar a un proveedor remoto.
    - **Proveedor remoto explícito** (`openai`, `voyage`, etc.): verifica que haya una clave de API en el entorno o en el almacén de autenticación. Si falta, muestra sugerencias prácticas para corregirlo.
    - **Proveedor automático heredado**: trata `memorySearch.provider: "auto"` como OpenAI, comprueba la disponibilidad de OpenAI y `doctor --fix` lo reescribe como `provider: "openai"`.

    Cuando hay disponible un resultado almacenado en caché de la comprobación del Gateway (el Gateway estaba en buen estado en el momento de la comprobación), doctor compara su resultado con la configuración visible para la CLI y señala cualquier discrepancia. Doctor no inicia una nueva consulta de embeddings en la ruta predeterminada; use el comando de estado detallado de la memoria cuando necesite una comprobación en vivo del proveedor.

    Use `openclaw memory status --deep` para verificar durante el runtime que los embeddings estén listos.

  </Accordion>
  <Accordion title="14. Advertencias sobre el estado de los canales">
    Si el Gateway está en buen estado, doctor ejecuta una comprobación del estado de los canales e informa de las advertencias con sugerencias para corregirlas.
  </Accordion>
  <Accordion title="15. Auditoría y reparación de la configuración del supervisor">
    Doctor comprueba si faltan valores predeterminados o están desactualizados en la configuración del supervisor instalado (launchd/systemd/schtasks), por ejemplo, las dependencias network-online de systemd y el retraso del reinicio. Cuando encuentra una discrepancia, recomienda una actualización y puede reescribir el archivo de servicio o la tarea con los valores predeterminados actuales.

    Notas:

    - `openclaw doctor` solicita confirmación antes de reescribir la configuración del supervisor.
    - `openclaw doctor --yes` acepta las solicitudes de reparación predeterminadas.
    - `openclaw doctor --fix` aplica las correcciones recomendadas sin solicitar confirmación (`--repair` es un alias).
    - `openclaw doctor --fix --force` sobrescribe las configuraciones personalizadas del supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor en modo de solo lectura durante el ciclo de vida del servicio del Gateway. Sigue informando del estado del servicio y ejecutando reparaciones ajenas al servicio, pero omite la instalación, el inicio, el reinicio y la inicialización del servicio, la reescritura de la configuración del supervisor y la limpieza de servicios heredados, porque un supervisor externo gestiona ese ciclo de vida.
    - En Linux, doctor no reescribe los metadatos del comando o del punto de entrada mientras la unidad systemd correspondiente del Gateway esté activa. También ignora las unidades adicionales inactivas, no heredadas y similares al Gateway durante el análisis de servicios duplicados, para que los archivos de servicios complementarios no generen avisos de limpieza innecesarios.
    - Si la autenticación mediante token requiere un token y `gateway.auth.token` está gestionado mediante SecretRef, la instalación o reparación del servicio mediante doctor valida el SecretRef, pero no conserva los valores del token resueltos como texto sin formato en los metadatos del entorno del servicio del supervisor.
    - Doctor detecta los valores gestionados de `.env` o respaldados por SecretRef que las instalaciones antiguas de LaunchAgent, systemd o Tareas programadas de Windows incrustaron directamente en el entorno del servicio, y reescribe los metadatos del servicio para que esos valores se carguen desde la fuente del runtime en lugar de desde la definición del supervisor.
    - Doctor detecta cuándo el comando del servicio todavía fija un valor antiguo de `--port` después de cambios en `gateway.port` y reescribe los metadatos del servicio para usar el puerto actual.
    - Si la autenticación mediante token requiere un token y el SecretRef de token configurado no se puede resolver, doctor bloquea la ruta de instalación o reparación y proporciona indicaciones prácticas.
    - Si están configurados tanto `gateway.auth.token` como `gateway.auth.password` y `gateway.auth.mode` no está definido, doctor bloquea la instalación o reparación hasta que el modo se establezca explícitamente.
    - Para las unidades systemd de usuario en Linux, las comprobaciones de divergencia del token de doctor incluyen las fuentes `Environment=` y `EnvironmentFile=` al comparar los metadatos de autenticación del servicio.
    - Las reparaciones de servicios de doctor se niegan a reescribir, detener o reiniciar un servicio del Gateway desde un binario antiguo de OpenClaw cuando una versión más reciente escribió la configuración por última vez. Consulte [Solución de problemas del Gateway](/es/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Siempre se puede forzar una reescritura completa mediante `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos del runtime y del puerto del Gateway">
    Doctor inspecciona el runtime del servicio (PID y estado de la última salida) y muestra una advertencia cuando el servicio está instalado, pero en realidad no está en ejecución. También comprueba si hay conflictos en el puerto del Gateway (valor predeterminado: `18789`) e informa de las causas probables (el Gateway ya está en ejecución o hay un túnel SSH).
  </Accordion>
  <Accordion title="17. Prácticas recomendadas para el runtime del Gateway">
    Doctor muestra una advertencia cuando el servicio del Gateway se ejecuta en Bun o desde una ruta de Node gestionada por versiones (`nvm`, `fnm`, `volta`, `asdf`, etc.). Bun no puede abrir el almacén de estado `node:sqlite` de OpenClaw, por lo que las reparaciones migran a Node los servicios heredados que usan Bun. Las rutas de gestores de versiones pueden dejar de funcionar después de las actualizaciones porque el servicio no carga la inicialización del shell. Doctor ofrece migrar a una instalación de Node del sistema cuando hay una disponible (Homebrew/apt/choco).

    Los LaunchAgents de macOS recién instalados o reparados usan una ruta PATH canónica del sistema (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) en lugar de copiar la ruta PATH del shell interactivo. De este modo, los binarios del sistema gestionados por Homebrew permanecen disponibles, mientras que Volta, asdf, fnm, pnpm y otros directorios de gestores de versiones no cambian qué procesos secundarios de Node se resuelven. Los servicios de Linux siguen conservando raíces de entorno explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) y directorios estables de binarios de usuario, pero los directorios alternativos inferidos de gestores de versiones solo se escriben en la ruta PATH del servicio cuando existen en el disco.

  </Accordion>
  <Accordion title="18. Escritura de la configuración y metadatos del asistente">
    Doctor conserva todos los cambios de configuración y registra metadatos del asistente para dejar constancia de la ejecución de doctor.
  </Accordion>
  <Accordion title="19. Consejos sobre el espacio de trabajo (copia de seguridad y sistema de memoria)">
    Doctor sugiere un sistema de memoria para el espacio de trabajo cuando falta y muestra un consejo sobre copias de seguridad si el espacio de trabajo aún no está bajo el control de git.

    Consulte [/conceptos/espacio-de-trabajo-del-agente](/es/concepts/agent-workspace) para obtener una guía completa sobre la estructura del espacio de trabajo y las copias de seguridad con git (se recomienda un repositorio privado de GitHub o GitLab).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Guía operativa del Gateway](/es/gateway)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
