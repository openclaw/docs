---
read_when:
    - Añadir o modificar migraciones de doctor
    - Introducción de cambios incompatibles en la configuración
sidebarTitle: Doctor
summary: 'Comando doctor: comprobaciones de estado, migraciones de configuración y pasos de reparación'
title: Diagnóstico
x-i18n:
    generated_at: "2026-07-14T13:39:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: e5c37c31332a9128767ebf6a853aa618511b9eda7f5840a4f863ec705c58421a
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

    Acepta los valores predeterminados sin solicitar confirmación (incluidos los pasos de reparación de reinicio, servicio o entorno aislado cuando corresponda).

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

    Ejecuta comprobaciones estructuradas del estado del sistema para CI o automatización previa. Es de solo lectura: no realiza
    solicitudes de confirmación, reparaciones, migraciones, reinicios ni escrituras de estado.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    Aplica también reparaciones agresivas (sobrescribe las configuraciones personalizadas del supervisor).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Se ejecuta sin solicitar confirmación y aplica únicamente migraciones seguras (normalización de la configuración +
    traslado del estado en disco). Omite las acciones de reinicio, servicio o entorno aislado que requieren
    confirmación humana. Las migraciones de estados heredados se siguen ejecutando automáticamente cuando se detectan.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Examina los servicios del sistema en busca de instalaciones adicionales del Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Para revisar los cambios antes de escribirlos, abre primero el archivo de configuración:

```bash
cat ~/.openclaw/openclaw.json
```

## Modo de análisis de solo lectura

`openclaw doctor --lint` es la variante orientada a la automatización de
`openclaw doctor --fix`. Comparten el mismo registro de reglas de Doctor, pero no
seleccionan ni aplican las reglas de la misma manera:

| Modo                     | Solicita confirmación | Escribe configuración/estado | Salida                    | Uso previsto                           |
| ------------------------ | ---------------------- | ---------------------------- | ------------------------- | -------------------------------------- |
| `openclaw doctor`        | sí                     | no                           | informe de estado accesible | comprobación humana del estado         |
| `openclaw doctor --fix`  | a veces                | sí, según la política de reparación | registro de reparación accesible | aplicación de reparaciones aprobadas   |
| `openclaw doctor --lint` | no                     | no                           | hallazgos estructurados   | CI, comprobaciones previas y controles de revisión |

De forma predeterminada, `doctor --lint` ejecuta el perfil de automatización amplio y seguro: comprobaciones
estáticas, locales y útiles para la salida de CI o de comprobaciones previas. Omite las comprobaciones opcionales que
son informativas, dependen del entorno o de servicios activos, realizan inventarios de cuentas o espacios de trabajo,
o se ocupan de la limpieza histórica. Usa `doctor --lint --all` cuando se requiera la
auditoría de análisis completa registrada, incluidas esas comprobaciones opcionales, o `--only <id>` para
una comprobación específica.

`doctor --fix` no utiliza el perfil de análisis predeterminado ni acepta
`--all`. Ejecuta la ruta de reparación ordenada de Doctor: las comprobaciones modernas del estado pueden proporcionar
una implementación opcional de `repair()`, mientras que las áreas antiguas siguen utilizando su flujo de reparación
heredado de Doctor. Algunos hallazgos del análisis son intencionadamente solo diagnósticos, por lo que una
comprobación que aparezca en `--lint --all` no implica que `--fix` modifique esa área.
El contrato separa `detect()` (informa de los hallazgos) de `repair()` (informa de
cambios, diferencias y efectos secundarios), lo que deja abierta una vía para un futuro
`doctor --fix --dry-run` sin convertir las comprobaciones de análisis en planificadores de modificaciones.

Algunas comprobaciones integradas están desactivadas internamente de forma predeterminada para que sigan estando disponibles en
`--all`, `--only` y los flujos de reparación de Doctor sin pasar a formar parte del perfil de automatización
predeterminado de `doctor --lint`. La gravedad de los hallazgos se sigue indicando en cada
hallazgo (`info`, `warning` o `error`); la selección predeterminada no es un nivel de
gravedad.

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

| Código | Significado                                                      |
| ------ | ---------------------------------------------------------------- |
| `0`  | no hay hallazgos que alcancen o superen el umbral seleccionado   |
| `1`  | uno o más hallazgos alcanzaron el umbral seleccionado            |
| `2`  | fallo del comando o del entorno de ejecución antes de poder emitir los hallazgos |

Opciones:

- `--severity-min info|warning|error` (valor predeterminado: `warning`): controla tanto lo que se muestra como lo que provoca una salida distinta de cero.
- `--all`: ejecuta todas las comprobaciones de análisis registradas, incluidas las comprobaciones opcionales excluidas del conjunto de automatización predeterminado.
- `--only <id>` (repetible): ejecuta únicamente los identificadores de comprobación indicados; un identificador desconocido se notifica como hallazgo de error.
- `--skip <id>` (repetible): excluye una comprobación y mantiene activa el resto de la ejecución.
- `--json`, `--severity-min`, `--all`, `--only` y `--skip` requieren `--lint`; las ejecuciones simples de `openclaw doctor` y `--fix` los rechazan.

## Qué hace (resumen)

<AccordionGroup>
  <Accordion title="Estado del sistema, interfaz y actualizaciones">
    - Actualización previa opcional para instalaciones de Git (solo en modo interactivo).
    - Comprobación de actualización del protocolo de la interfaz (recompila la interfaz de control cuando el esquema del protocolo es más reciente).
    - Comprobación del estado del sistema + solicitud de reinicio.
    - Notas únicamente sobre problemas de Skills y plugins; el inventario sin problemas permanece en `openclaw skills check` y `openclaw plugins list`.

  </Accordion>
  <Accordion title="Configuración y migraciones">
    - Normalización de configuraciones con formatos de valores heredados.
    - Migración de la configuración de conversación desde los campos planos heredados de `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Comprobaciones de migración del navegador para configuraciones heredadas de la extensión de Chrome y la preparación de Chrome MCP.
    - Advertencias sobre sustituciones del proveedor OpenCode (`models.providers.opencode` / `opencode-zen` / `opencode-go`).
    - Migración del proveedor y del perfil heredados de OpenAI Codex (`openai-codex` → `openai`) y advertencias de ocultación para `models.providers.openai-codex` obsoleto.
    - Comprobación de requisitos previos de TLS para perfiles OAuth de OpenAI Codex.
    - Advertencias sobre las listas de permitidos de plugins y herramientas cuando `plugins.allow` es restrictivo, pero la política de herramientas aún solicita comodines o herramientas propiedad de plugins.
    - Migración del estado heredado en disco (sesiones/directorio del agente/autenticación de WhatsApp).
    - Migración de claves heredadas del contrato del manifiesto del plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migración del almacén Cron heredado (`jobId`, `schedule.cron`, campos de entrega/carga útil de nivel superior, carga útil `provider`, tareas de reserva de Webhook de `notify: true`).
    - Reparación de la fijación del entorno de ejecución de la CLI de Codex (`agentRuntime.id: "codex-cli"` → `"codex"`) en `agents.defaults`, `agents.list[]` y `models.providers.*` (incluidas las entradas por modelo).
    - Limpieza de configuraciones de plugins obsoletas cuando los plugins están habilitados; cuando `plugins.enabled=false`, las referencias de plugins obsoletas se conservan como configuración de contención inerte.

  </Accordion>
  <Accordion title="Estado e integridad">
    - Inspección de archivos de bloqueo de sesión y limpieza de bloqueos obsoletos.
    - Reparación de transcripciones de sesión para ramas duplicadas de reescritura de instrucciones creadas por compilaciones afectadas de 2026.4.24.
    - Detección de indicadores de recuperación tras reinicio de subagentes bloqueados, con compatibilidad de `--fix` para borrar indicadores obsoletos de recuperación abortada, de modo que el inicio no siga tratando al proceso secundario como abortado durante el reinicio.
    - Comprobaciones de integridad del estado y de permisos (sesiones, transcripciones y directorio de estado).
    - Comprobaciones de permisos del archivo de configuración (chmod 600) durante la ejecución local.
    - Estado de la autenticación de modelos: comprueba la caducidad de OAuth, puede renovar tokens próximos a caducar e informa sobre estados de espera o desactivación de perfiles de autenticación.

  </Accordion>
  <Accordion title="Gateway, servicios y supervisores">
    - Reparación de la imagen del entorno aislado cuando este está habilitado.
    - Migración de servicios heredados y detección de gateways adicionales.
    - Migración del estado heredado del canal Matrix (en modo `--fix` / `--repair`).
    - Comprobaciones del entorno de ejecución del Gateway (servicio instalado pero sin ejecutar; etiqueta de launchd almacenada en caché).
    - Advertencias sobre el estado de los canales (consultadas desde el Gateway en ejecución).
    - Las comprobaciones de permisos específicas de cada canal se encuentran en `openclaw channels capabilities`; por ejemplo, los permisos de los canales de voz de Discord se auditan con `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Comprobaciones de capacidad de respuesta de WhatsApp cuando el bucle de eventos del Gateway está degradado y aún hay clientes TUI locales en ejecución; `--fix` detiene únicamente los clientes TUI locales verificados.
    - Reparación de rutas de Codex para referencias de modelos heredadas de `openai-codex/*` en modelos principales, alternativas, modelos de generación de imágenes/vídeos, sustituciones de Heartbeat/subagentes/Compaction, enlaces, sustituciones de modelos de canales y fijaciones de rutas de sesión; `--fix` las reescribe como `openai/*`, migra los perfiles y el orden de autenticación de `openai-codex:*` a `openai:*`, elimina fijaciones obsoletas del entorno de ejecución de sesiones o agentes completos y permite que la ruta efectiva reparada determine si Codex es compatible.
    - Auditoría de la configuración del supervisor (launchd/systemd/schtasks) con reparación opcional.
    - Limpieza de variables de entorno del proxy incrustadas en servicios del Gateway que capturaron valores de `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` del shell durante la instalación o actualización.
    - Comprobaciones del entorno de ejecución del Gateway (servicios Bun heredados no compatibles, rutas de gestores de versiones).
    - Diagnóstico de colisiones de puertos del Gateway (valor predeterminado: `18789`).

  </Accordion>
  <Accordion title="Autenticación, seguridad y vinculación">
    - Advertencias de seguridad para políticas de mensajes directos abiertas.
    - Comprobaciones de autenticación del Gateway para el modo de token local (ofrece generar un token cuando no existe ninguna fuente de tokens; no sobrescribe configuraciones SecretRef de tokens).
    - Detección de problemas de vinculación de dispositivos (solicitudes pendientes de primera vinculación, mejoras pendientes de función o ámbito, divergencias obsoletas de la caché local de tokens de dispositivo y divergencias de autenticación en registros vinculados).

  </Accordion>
  <Accordion title="Espacio de trabajo y shell">
    - Comprobación de permanencia de systemd en Linux.
    - Comprobación del tamaño de los archivos de arranque del espacio de trabajo (advertencias de truncamiento o proximidad al límite para archivos de contexto).
    - Comprobación de disponibilidad de Skills para el agente predeterminado; informa de las Skills permitidas a las que les faltan binarios, variables de entorno, configuración o requisitos del sistema operativo, y `--fix` puede deshabilitar las Skills no disponibles en `skills.entries`.
    - Comprobación del estado de autocompletado del shell e instalación o actualización automática.
    - Comprobación de disponibilidad del proveedor de incrustaciones para la búsqueda en memoria (modelo local, clave de API remota o binario QMD).
    - Comprobaciones de la instalación desde el código fuente (discrepancia del espacio de trabajo de pnpm, recursos de interfaz ausentes, binario tsx ausente).
    - Escribe la configuración actualizada + los metadatos del asistente.

  </Accordion>
</AccordionGroup>

## Relleno retroactivo y restablecimiento de la interfaz de Dreams

La escena Dreams de la interfaz de control incluye las acciones **Rellenar**, **Restablecer** y **Borrar datos fundamentados** para el flujo de trabajo de Dreaming fundamentado. Estas utilizan métodos RPC de estilo doctor del Gateway, pero **no** forman parte de la reparación/migración de la CLI `openclaw doctor`.

| Acción                     | Qué hace                                                                                                                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rellenar                   | Examina los archivos históricos `memory/YYYY-MM-DD.md` del espacio de trabajo activo, ejecuta la pasada de diario REM fundamentado y escribe entradas de relleno reversibles en `DREAMS.md`. |
| Restablecer                | Elimina únicamente las entradas marcadas del diario de relleno de `DREAMS.md`.                                                                                                 |
| Borrar datos fundamentados | Elimina únicamente las entradas provisionales a corto plazo exclusivas de datos fundamentados de la reproducción histórica que todavía no han acumulado recuperación en vivo ni respaldo diario. |

Ninguna de estas acciones edita `MEMORY.md`, ejecuta migraciones completas de doctor ni incorpora por sí sola candidatos fundamentados al almacén activo de promoción a corto plazo. Para introducir la reproducción histórica fundamentada en la vía normal de promoción profunda, utilice en su lugar el flujo de la CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Esto incorpora los candidatos duraderos fundamentados al almacén de Dreaming a corto plazo, mientras `DREAMS.md` sigue siendo la superficie de revisión.

## Comportamiento detallado y justificación

<AccordionGroup>
  <Accordion title="0. Actualización opcional (instalaciones mediante git)">
    Si se trata de un checkout de git y doctor se ejecuta de forma interactiva, ofrece actualizar (fetch/rebase/build) antes de ejecutar doctor.
  </Accordion>
  <Accordion title="1. Normalización de la configuración">
    Doctor normaliza las estructuras de valores heredadas al esquema actual. La configuración actual de voz de Talk es `talk.provider` + `talk.providers.<provider>`, con la configuración de voz en tiempo real en `talk.realtime.*`. Doctor reescribe las estructuras antiguas `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` en el mapa de proveedores y reescribe los selectores heredados de nivel superior para tiempo real (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) en `talk.realtime`.

    Doctor también advierte cuando `plugins.allow` no está vacío y la política de herramientas utiliza entradas comodín o pertenecientes a plugins. `tools.allow: ["*"]` solo coincide con herramientas de plugins que se cargan realmente; no elude la lista de plugins permitidos exclusiva.

  </Accordion>
  <Accordion title="2. Migraciones de claves de configuración heredadas">
    Cuando la configuración contiene una clave obsoleta con una migración activa, los demás comandos se niegan a ejecutarse y solicitan que se ejecute `openclaw doctor`. Doctor explica qué claves heredadas se encontraron, muestra la migración aplicada y reescribe `~/.openclaw/openclaw.json` con el esquema actualizado. El inicio del Gateway rechaza los formatos de configuración heredados y solicita que se ejecute `openclaw doctor --fix`; no reescribe `openclaw.json` durante el inicio. `openclaw doctor --fix` también gestiona las migraciones del almacén de trabajos de Cron.

    <Note>
      Doctor solo mantiene migraciones automáticas durante aproximadamente dos meses después de que se retire una
      clave. Las claves heredadas más antiguas (por ejemplo, las originales
      `routing.queue`, `routing.bindings`, `routing.agents`/`defaultAgentId`,
      `routing.transcribeAudio`, `agent.*` de nivel superior o `identity` de nivel superior
      de la estructura de configuración anterior a los agentes múltiples) ya no tienen una ruta de migración;
      la configuración que las utiliza ahora no supera la validación, en lugar de reescribirse. Corrija
      esas claves manualmente conforme a la referencia de configuración actual antes de que doctor
      pueda continuar.
    </Note>

    Migraciones activas:

    | Clave heredada                                                                                  | Clave actual                                                                  |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`, `gateway.webchat`                                                            | eliminadas (WebChat está retirado)                                            |
    | `channels.feishu.accounts.<accountId>.botName`                                                   | `channels.feishu.accounts.<accountId>.name`                                 |
    | `session.threadBindings.ttlHours`, `channels.<id>.threadBindings.ttlHours` (y por cuenta)      | `...threadBindings.idleHours`                                               |
    | `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` heredadas        | `talk.provider` + `talk.providers.<provider>`                               |
    | selectores heredados de nivel superior para Talk en tiempo real (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) | `talk.realtime`                                                              |
    | `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)                             | `messages.tts.providers.<provider>`                                          |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                  | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`   |
    | campos de hablante TTS `voice`/`voiceName`/`voiceId`                                                 | `speakerVoice`/`speakerVoiceId`                                              |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>` (todos los canales excepto Discord)                                          | `...tts.providers.<provider>`                                                |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>` (todos los canales, incluido Discord)                          | `...voice.tts.providers.<provider>`                                          |
    | `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)     | `plugins.entries.voice-call.config.tts.providers.<provider>`                |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                | `provider: "microsoft"` / `...tts.providers.microsoft`                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                              | `"mock"`                                                                      |
    | `plugins.entries.voice-call.config.twilio.from`                                                  | `plugins.entries.voice-call.config.fromNumber`                              |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                        | `plugins.entries.voice-call.config.streaming.provider`                      |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"` (el inicio del Gateway también omite los proveedores cuyo `api` sea un valor de enumeración futuro/desconocido, en lugar de producir un fallo cerrado) |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | eliminada (configuración heredada de retransmisión de la extensión de Chrome) |
    | `mcp.servers.*.type` (alias nativos de la CLI)                                                        | `mcp.servers.*.transport`                                                    |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | eliminada (el servidor de aplicaciones de Codex siempre mantiene nativas las herramientas de espacio de trabajo propias de Codex) |
    | `commands.modelsWrite`                                                                           | eliminada (`/models add` está obsoleta)                                   |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                     | eliminadas (el valor exacto `NO_REPLY` ya no se reescribe como texto de reserva visible) |
    | `agents.defaults/list[].systemPromptOverride`                                                    | eliminada (OpenClaw controla el prompt del sistema generado)                  |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | eliminada (utilice `models.providers.<id>.timeoutSeconds` para tiempos de espera lentos del modelo/proveedor, manteniéndolos por debajo del límite máximo de tiempo de espera del agente/ejecución) |
    | `memorySearch` de nivel superior                                                                         | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path` (en cualquier nivel)                                                            | eliminada (los índices de memoria residen en la base de datos de cada agente) |
    | `heartbeat` de nivel superior                                                                            | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | identificadores de política `plugins.openai-codex`                                                                | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                 | eliminadas (obsoletas)                                                        |
    | `diagnostics.memoryPressureBundle`                                                               | `diagnostics.memoryPressureSnapshot`                                        |

    <Note>
      Las filas `plugins.entries.voice-call.config.*` anteriores las normaliza
      el propio plugin Voice Call cada vez que se carga la configuración, no `openclaw
      doctor`. El plugin también registra una advertencia de inicio que señala a `openclaw
      doctor --fix`, pero actualmente doctor no reescribe
      `openclaw.json` para estas claves; la normalización propia del plugin es la que
      aplica el cambio durante la ejecución.
    </Note>

    Orientación sobre la cuenta predeterminada para canales con varias cuentas:

    - Si se configuran dos o más entradas `channels.<channel>.accounts` sin `channels.<channel>.defaultAccount` ni `accounts.default`, doctor advierte que el enrutamiento de reserva puede seleccionar una cuenta inesperada.
    - Si `channels.<channel>.defaultAccount` se establece en un identificador de cuenta desconocido, doctor muestra una advertencia y enumera los identificadores de cuenta configurados.

  </Accordion>
  <Accordion title="2b. Anulaciones del proveedor OpenCode">
    Si ha añadido manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`, se anula el catálogo integrado de OpenCode de `openclaw/plugin-sdk/llm`. Esto puede forzar a los modelos a usar la API incorrecta o reducir los costes a cero. Doctor muestra una advertencia para que se pueda eliminar la anulación y restaurar el enrutamiento de API y los costes específicos de cada modelo.
  </Accordion>
  <Accordion title="2c. Migración del navegador y preparación de Chrome MCP">
    Si la configuración del navegador todavía apunta a la ruta eliminada de la extensión de Chrome, doctor la normaliza al modelo actual de conexión de Chrome MCP local al host (`browser.profiles.*.driver: "extension"` → `"existing-session"`; se eliminó `browser.relayBindHost`).

    Doctor también audita la ruta de Chrome MCP local al host cuando se usa `defaultProfile: "user"` o un perfil `existing-session` configurado:

    - comprueba si Google Chrome está instalado en el mismo host para los perfiles predeterminados de conexión automática
    - comprueba la versión detectada de Chrome y advierte cuando es anterior a Chrome 144
    - recuerda que se debe habilitar la depuración remota en la página de inspección del navegador (por ejemplo, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor no puede habilitar la opción de Chrome. Chrome MCP local al host sigue requiriendo un navegador basado en Chromium 144+ en el host del gateway/node, ejecutándose localmente, con la depuración remota habilitada y con la primera solicitud de consentimiento para la conexión aprobada en el navegador.

    La preparación indicada aquí solo abarca los requisitos previos para la conexión local. Existing-session mantiene los límites actuales de las rutas de Chrome MCP; las rutas avanzadas como `responsebody`, la exportación a PDF, la interceptación de descargas y las acciones por lotes siguen requiriendo un navegador administrado o un perfil CDP sin procesar. Esta comprobación no se aplica a Docker, sandbox, navegadores remotos ni otros flujos sin interfaz gráfica, que siguen usando CDP sin procesar.

  </Accordion>
  <Accordion title="2d. Requisitos previos de TLS para OAuth">
    Cuando se configura un perfil OAuth de OpenAI Codex, doctor sondea el endpoint de autorización de OpenAI para verificar que la pila TLS local de Node/OpenSSL pueda validar la cadena de certificados. Si el sondeo falla debido a un error de certificado (por ejemplo, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, un certificado caducado o un certificado autofirmado), doctor muestra instrucciones de corrección específicas para la plataforma. En macOS con un Node de Homebrew, la solución suele ser `brew postinstall ca-certificates`. Con `--deep`, el sondeo se ejecuta incluso si el gateway funciona correctamente.
  </Accordion>
  <Accordion title="2e. Anulaciones del proveedor OAuth de Codex">
    Si anteriormente se añadieron opciones de transporte heredadas de OpenAI en `models.providers.openai-codex`, estas pueden ocultar la ruta integrada del proveedor OAuth de Codex. Doctor advierte cuando detecta esas opciones de transporte antiguas junto con OAuth de Codex para que se pueda eliminar o reescribir la anulación de transporte obsoleta y restaurar el comportamiento de enrutamiento actual. Los proxies personalizados y las anulaciones que solo incluyen encabezados siguen siendo compatibles y no activan esta advertencia, pero esas rutas de solicitud definidas manualmente no son aptas para la selección implícita de Codex.
  </Accordion>
  <Accordion title="2f. Reparación de rutas de Codex">
    Doctor comprueba si hay referencias de modelo `openai-codex/*` heredadas. El enrutamiento del arnés nativo de Codex usa referencias de modelo canónicas `openai/*`, pero el prefijo por sí solo nunca selecciona Codex. Si la política de tiempo de ejecución no está establecida o es `auto`, solo es apta una ruta oficial HTTPS exacta de Platform Responses o ChatGPT Responses sin una anulación de solicitud definida manualmente. Consulte [tiempo de ejecución implícito del agente de OpenAI](/es/providers/openai#implicit-agent-runtime).

    En el modo `--fix` / `--repair`, doctor reescribe las referencias afectadas del agente predeterminado y de cada agente, incluidos los modelos principales, las alternativas, los modelos de generación de imágenes y vídeo, las anulaciones de heartbeat/subagente/compaction, los hooks, las anulaciones de modelo de los canales y el estado obsoleto de las rutas de sesión persistentes:

    - `openai-codex/gpt-*` se convierte en `openai/gpt-*`.
    - La intención de Codex se traslada a entradas `agentRuntime.id: "codex"` con ámbito de proveedor/modelo para las referencias de modelo de agente reparadas.
    - Se eliminan la configuración obsoleta del tiempo de ejecución de todo el agente y las fijaciones persistentes del tiempo de ejecución de las sesiones, ya que la selección del tiempo de ejecución tiene ámbito de proveedor/modelo.
    - Se conserva la política existente de tiempo de ejecución del proveedor/modelo, salvo que la referencia de modelo heredada reparada necesite el enrutamiento de Codex para mantener la ruta de autenticación anterior.
    - Las listas existentes de modelos alternativos se conservan y sus entradas heredadas se reescriben; las opciones copiadas de cada modelo se trasladan de la clave heredada a la clave canónica `openai/*`.
    - Se reparan `modelProvider`/`providerOverride`, `model`/`modelOverride`, los avisos de modelos alternativos y las fijaciones de perfiles de autenticación de las sesiones persistentes en todos los almacenes de sesiones de agentes detectados.
    - Doctor repara por separado las fijaciones obsoletas `agentRuntime.id: "codex-cli"` (un identificador de tiempo de ejecución heredado distinto) y las cambia a `"codex"` en las entradas de modelo `agents.defaults`, `agents.list[]` y `models.providers.*`.
    - `/codex ...` significa «controlar o vincular una conversación nativa de Codex desde el chat».
    - `/acp ...` o `runtime: "acp"` significa «usar el adaptador externo ACP/acpx».

  </Accordion>
  <Accordion title="2g. Limpieza de rutas de sesión">
    Doctor también examina los almacenes de sesiones de agentes detectados en busca de estados de ruta obsoletos creados automáticamente después de trasladar los modelos configurados o el tiempo de ejecución fuera de una ruta propiedad de un plugin, como Codex.

    `openclaw doctor --fix` puede borrar estados obsoletos creados automáticamente, como las fijaciones de modelo `modelOverrideSource: "auto"`, los metadatos del modelo de tiempo de ejecución, los identificadores de arnés fijados, las vinculaciones de sesiones de la CLI y las anulaciones automáticas de perfiles de autenticación cuando la ruta propietaria ya no está configurada. Las selecciones explícitas de modelos de sesión realizadas por el usuario o heredadas se notifican para su revisión manual y no se modifican; cámbielas con `/model ...`, `/new` o restablezca la sesión cuando ya no se pretenda usar esa ruta.

  </Accordion>
  <Accordion title="3. Migraciones de estado heredado (disposición en disco)">
    Doctor puede migrar las disposiciones antiguas en disco a la estructura actual:

    - Almacén de sesiones y transcripciones: de `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directorio del agente: de `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticación de WhatsApp (Baileys): del `~/.openclaw/credentials/*.json` heredado (excepto `oauth.json`) a `~/.openclaw/credentials/whatsapp/<accountId>/...` (identificador de cuenta predeterminado: `default`)

    Estas migraciones se realizan en la medida de lo posible y son idempotentes; doctor emite advertencias cuando deja alguna carpeta heredada como copia de seguridad. El Gateway y la CLI también migran automáticamente las sesiones heredadas y el directorio del agente al iniciarse, de modo que el historial, la autenticación y los modelos se guarden en la ruta específica del agente sin ejecutar doctor manualmente. La autenticación de WhatsApp se migra de forma intencionada únicamente mediante `openclaw doctor`. La normalización del proveedor y del mapa de proveedores de Talk compara mediante igualdad estructural, por lo que las diferencias que solo afectan al orden de las claves ya no activan repetidamente cambios `doctor --fix` sin efecto.

  </Accordion>
  <Accordion title="3a. Migraciones de manifiestos de plugins heredados">
    Doctor examina todos los manifiestos de plugins instalados en busca de claves de capacidades de nivel superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Cuando las encuentra, ofrece trasladarlas al objeto `contracts` y reescribir el archivo de manifiesto en el mismo lugar. Esta migración es idempotente; si `contracts` ya contiene los mismos valores, la clave heredada se elimina sin duplicar datos.
  </Accordion>
  <Accordion title="3b. Migraciones del almacén Cron heredado">
    Doctor también comprueba el almacén de trabajos Cron (`~/.openclaw/cron/jobs.json` de forma predeterminada, o `cron.store` cuando se anula) en busca de estructuras de trabajos antiguas que el programador sigue aceptando por compatibilidad.

    Las limpiezas actuales de Cron incluyen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de carga útil de nivel superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nivel superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de entrega `provider` de la carga útil → `delivery.channel` explícito
    - trabajos de Webhook alternativo `notify: true` heredados → entrega de Webhook explícita desde `cron.webhook` cuando está establecido; los trabajos de anuncio conservan su entrega por chat y reciben `delivery.completionDestination`. Cuando `cron.webhook` no está establecido, el marcador inerte de nivel superior `notify` se elimina de los trabajos sin destino (se conserva la entrega existente, incluidos los anuncios), ya que la entrega en tiempo de ejecución nunca lo lee.

    El Gateway también sanea las filas Cron con formato incorrecto durante la carga para que los trabajos válidos sigan ejecutándose. Las filas sin procesar con formato incorrecto se copian a `jobs-quarantine.json`, junto al almacén activo, antes de eliminarlas de `jobs.json`; doctor informa de las filas en cuarentena para que se puedan revisar o reparar manualmente.

    Al iniciarse, el Gateway normaliza la proyección del tiempo de ejecución e ignora el marcador de nivel superior `notify`, pero conserva la configuración Cron persistente para que doctor la repare. Cuando `cron.webhook` no está establecido, doctor elimina el marcador inerte de los trabajos que no tienen un destino de migración (`delivery.mode` ninguno/ausente, un destino de Webhook inutilizable o una entrega existente de anuncio/chat), sin modificar la entrega existente, por lo que las ejecuciones repetidas de `doctor --fix` ya no vuelven a advertir sobre el mismo trabajo. Si `cron.webhook` está establecido pero no es una URL HTTP(S) válida, doctor sigue mostrando una advertencia y conserva el marcador para que se pueda corregir la URL.

    En Linux, doctor también advierte cuando el crontab del usuario sigue invocando el `~/.openclaw/bin/ensure-whatsapp.sh` heredado. Ese script local al host no recibe mantenimiento en la versión actual de OpenClaw y puede escribir mensajes `Gateway inactive` falsos en `~/.openclaw/logs/whatsapp-health.log` cuando Cron no puede comunicarse con el bus de usuario de systemd. Elimine la entrada obsoleta del crontab con `crontab -e`; use `openclaw channels status --probe`, `openclaw doctor` y `openclaw gateway status` para las comprobaciones de estado actuales.

  </Accordion>
  <Accordion title="3c. Limpieza de bloqueos de sesión">
    Doctor examina todos los directorios de sesiones de agentes en busca de archivos obsoletos de bloqueo de escritura que hayan quedado tras la finalización anómala de una sesión. Para cada archivo de bloqueo encontrado, informa de la ruta, el PID, si el PID sigue activo, la antigüedad del bloqueo y si se considera obsoleto (PID inactivo, metadatos del propietario con formato incorrecto, antigüedad superior a 30 minutos o un PID activo que se haya comprobado que pertenece a un proceso ajeno a OpenClaw). En el modo `--fix` / `--repair`, elimina automáticamente los bloqueos cuyos propietarios estén inactivos, huérfanos, reciclados, sean antiguos y tengan un formato incorrecto, o no pertenezcan a OpenClaw. Los bloqueos antiguos que todavía pertenecen a un proceso activo de OpenClaw se notifican, pero se mantienen para que doctor no interrumpa un proceso activo de escritura de transcripciones.
  </Accordion>
  <Accordion title="3d. Reparación de ramas de transcripciones de sesión">
    Doctor examina los archivos JSONL de sesiones de agentes en busca de la estructura de rama duplicada creada por el error de reescritura de transcripciones de indicaciones de 2026.4.24: un turno de usuario abandonado con contexto interno del tiempo de ejecución de OpenClaw y un hermano activo que contiene la misma indicación visible del usuario. En el modo `--fix` / `--repair`, doctor crea una copia de seguridad de cada archivo afectado junto al original y reescribe la transcripción para que use la rama activa, de modo que el historial del gateway y los lectores de memoria dejen de ver turnos duplicados.
  </Accordion>
  <Accordion title="4. Comprobaciones de integridad del estado (persistencia de sesiones, enrutamiento y seguridad)">
    El directorio de estado es el centro neurálgico operativo. Si desaparece, se pierden las sesiones, las credenciales, los registros y la configuración, salvo que existan copias de seguridad en otro lugar.

    Doctor comprueba:

    - **Directorio de estado ausente**: advierte sobre una pérdida catastrófica del estado, solicita volver a crear el directorio y recuerda que no puede recuperar los datos ausentes.
    - **Permisos del directorio de estado**: verifica que se pueda escribir en él; ofrece reparar los permisos (y emite una indicación `chown` cuando detecta una discrepancia de propietario/grupo).
    - **Directorio de estado sincronizado con la nube en macOS**: advierte cuando el estado se resuelve dentro de iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...`, porque las rutas respaldadas por sincronización pueden provocar E/S más lenta y condiciones de carrera entre bloqueos y sincronización.
    - **Directorio de estado en SD o eMMC en Linux**: advierte cuando el estado se resuelve en una fuente de montaje `mmcblk*`, porque la E/S aleatoria respaldada por SD/eMMC puede ser más lenta y desgastarse más rápidamente con las escrituras de sesiones y credenciales.
    - **Directorio de estado volátil en Linux**: advierte cuando el estado se resuelve en `tmpfs` o `ramfs`, porque las sesiones, las credenciales, la configuración y el estado de SQLite (con archivos auxiliares WAL/diario) desaparecen al reiniciar. Los montajes `overlay` de Docker no se marcan intencionadamente porque sus capas con capacidad de escritura persisten entre reinicios del host mientras el contenedor siga existiendo.
    - **Directorios de sesiones ausentes**: `sessions/` y el directorio del almacén de sesiones son necesarios para conservar el historial y evitar bloqueos de `ENOENT`.
    - **Discrepancia de transcripciones**: advierte cuando las entradas de sesiones recientes no tienen sus archivos de transcripción.
    - **Sesión principal «JSONL de 1 línea»**: marca los casos en que la transcripción principal solo tiene una línea (el historial no se está acumulando).
    - **Varios directorios de estado**: advierte cuando existen varias carpetas `~/.openclaw` en distintos directorios personales o cuando `OPENCLAW_STATE_DIR` apunta a otra ubicación (el historial puede dividirse entre instalaciones).
    - **Recordatorio del modo remoto**: si `gateway.mode=remote`, doctor recuerda que debe ejecutarse en el host remoto (el estado se encuentra allí).
    - **Permisos del archivo de configuración**: advierte si `~/.openclaw/openclaw.json` puede ser leído por el grupo o por cualquier usuario y ofrece restringirlo a `600`.

  </Accordion>
  <Accordion title="5. Estado de la autenticación del modelo (caducidad de OAuth)">
    Doctor inspecciona los perfiles de OAuth del almacén de autenticación, advierte cuando los tokens están próximos a caducar o ya han caducado y puede actualizarlos cuando sea seguro. Si el perfil de OAuth/token de Anthropic está obsoleto, sugiere una clave de API de Anthropic o la ruta del token de configuración de Anthropic. Las solicitudes de actualización solo aparecen cuando se ejecuta de forma interactiva (TTY); `--non-interactive` omite los intentos de actualización.

    Cuando una actualización de OAuth falla de forma permanente (por ejemplo, `refresh_token_reused`, `invalid_grant` o un proveedor indica que es necesario volver a iniciar sesión), doctor informa de que se requiere volver a autenticarse e imprime el comando `openclaw models auth login --provider ...` exacto que debe ejecutarse.

    Doctor también informa de los perfiles de autenticación que no pueden utilizarse temporalmente debido a períodos de espera breves (límites de frecuencia, tiempos de espera o fallos de autenticación) o inhabilitaciones más prolongadas (fallos de facturación o crédito).

    Los perfiles OAuth heredados de Codex cuyos tokens se encuentran en el llavero de macOS (incorporación anterior al diseño de archivos auxiliares) solo los repara doctor. Ejecute `openclaw doctor --fix` una vez desde un terminal interactivo para migrar directamente los tokens heredados respaldados por el llavero a `auth-profiles.json`; después, los turnos integrados (Telegram, cron, envío a subagentes) los resolverán como perfiles OAuth canónicos de OpenAI.

  </Accordion>
  <Accordion title="6. Validación del modelo de los hooks">
    Si se establece `hooks.gmail.model`, doctor valida la referencia del modelo con respecto al catálogo y la lista de permitidos, y advierte cuando no pueda resolverse o no esté permitida.
  </Accordion>
  <Accordion title="7. Reparación de la imagen del entorno aislado">
    Cuando el aislamiento está habilitado, doctor comprueba las imágenes de Docker y ofrece compilarlas o cambiar a nombres heredados si falta la imagen actual.
  </Accordion>
  <Accordion title="7b. Limpieza de la instalación de plugins">
    Doctor elimina el estado heredado de preparación de dependencias de plugins generado por OpenClaw en el modo `openclaw doctor --fix` / `openclaw doctor --repair`: raíces obsoletas de dependencias generadas, antiguos directorios de preparación de instalaciones, residuos locales de paquetes procedentes del código anterior de reparación de dependencias de plugins integrados y copias npm administradas, huérfanas o recuperadas, de plugins `@openclaw/*` integrados que pueden ocultar el manifiesto integrado actual. Doctor también vuelve a enlazar el paquete `openclaw` del host con los plugins npm administrados que declaran `peerDependencies.openclaw`, para que las importaciones en tiempo de ejecución locales al paquete, como `openclaw/plugin-sdk/*`, sigan resolviéndose después de actualizaciones o reparaciones de npm.

    Doctor también puede reinstalar plugins descargables ausentes cuando la configuración hace referencia a ellos, pero el registro local de plugins no puede encontrarlos (`plugins.entries` sustancial, configuración de canales/proveedores/búsqueda y entornos de ejecución de agentes configurados). Durante las actualizaciones de paquetes, doctor evita reinstalar paquetes de plugins mientras se sustituye el paquete principal; ejecute `openclaw doctor --fix` de nuevo después de la actualización si un plugin configurado aún necesita recuperarse. Fuera de la excepción de inicio de imágenes de contenedor descrita a continuación, el inicio del Gateway y la recarga de la configuración no ejecutan reparaciones de paquetes; las instalaciones de plugins siguen siendo tareas explícitas de doctor, instalación o actualización.

    El inicio del Gateway en contenedores tiene una excepción de actualización limitada: cuando `openclaw gateway run` se inicia con una nueva versión de OpenClaw, ejecuta migraciones seguras del estado y la convergencia existente de plugins posterior al núcleo antes de quedar listo, y después registra un punto de control por versión. Este proceso de inicio puede limpiar registros obsoletos de plugins integrados, reparar enlaces locales de plugins, reinstalar paquetes de plugins configurados cuando la ruta de convergencia lo requiera y comprobar las cargas útiles de los plugins activos. Si el inicio no puede efectuar una reparación segura, ejecute una vez la misma imagen con `openclaw doctor --fix` sobre el mismo estado y configuración montados antes de reiniciar el contenedor normalmente.

  </Accordion>
  <Accordion title="8. Migraciones del servicio Gateway e indicaciones de limpieza">
    Doctor detecta servicios Gateway heredados (launchd/systemd/schtasks) y ofrece eliminarlos e instalar el servicio de OpenClaw mediante el puerto actual del Gateway. También puede buscar servicios adicionales similares al Gateway e imprimir indicaciones de limpieza. Los servicios Gateway de OpenClaw con nombre de perfil se consideran de primera clase y no se marcan como «adicionales».

    En Linux, si falta el servicio Gateway de nivel de usuario, pero existe un servicio Gateway de OpenClaw de nivel de sistema, doctor no instala automáticamente un segundo servicio de nivel de usuario. Inspecciónelo con `openclaw gateway status --deep` o `openclaw doctor --deep` y, a continuación, elimine el duplicado o establezca `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando un supervisor del sistema controle el ciclo de vida del Gateway.

  </Accordion>
  <Accordion title="8b. Migración de Matrix durante el inicio">
    Cuando una cuenta de canal de Matrix tiene una migración de estado heredado pendiente o procesable, doctor (en el modo `--fix` / `--repair`) crea una instantánea previa a la migración y, a continuación, ejecuta los pasos de migración con el mejor esfuerzo posible: la migración del estado heredado de Matrix y la preparación del estado cifrado heredado. Ninguno de los pasos es fatal; los errores se registran y el inicio continúa. En el modo de solo lectura (`openclaw doctor` sin `--fix`), esta comprobación se omite por completo.
  </Accordion>
  <Accordion title="8c. Emparejamiento de dispositivos y desviación de la autenticación">
    Doctor inspecciona el estado de emparejamiento de dispositivos como parte de la comprobación de estado normal e informa de lo siguiente:

    - solicitudes pendientes de primer emparejamiento
    - actualizaciones pendientes de roles o ámbitos para dispositivos ya emparejados
    - reparaciones de discrepancias de claves públicas en las que el identificador del dispositivo sigue coincidiendo, pero la identidad del dispositivo ya no coincide con el registro aprobado
    - registros emparejados sin un token activo para un rol aprobado
    - tokens emparejados cuyos ámbitos se desvían de la línea base de emparejamiento aprobada
    - entradas locales de tokens de dispositivo en caché para la máquina actual que son anteriores a una rotación del token en el Gateway o contienen metadatos de ámbito obsoletos

    Doctor no aprueba automáticamente las solicitudes de emparejamiento ni rota automáticamente los tokens de dispositivo. Imprime los pasos siguientes exactos:

    - inspeccionar las solicitudes pendientes con `openclaw devices list`
    - aprobar la solicitud exacta con `openclaw devices approve <requestId>`
    - rotar un token nuevo con `openclaw devices rotate --device <deviceId> --role <role>`
    - eliminar y volver a aprobar un registro obsoleto con `openclaw devices remove <deviceId>`

    Esto distingue el primer emparejamiento de las actualizaciones pendientes de roles/ámbitos y de la desviación de tokens o identidades de dispositivo obsoletos, lo que subsana el problema habitual de «ya está emparejado, pero se sigue indicando que es necesario emparejarlo».

  </Accordion>
  <Accordion title="9. Advertencias de seguridad">
    Doctor emite una nota de seguridad solo cuando encuentra una advertencia, como un proveedor abierto a mensajes directos sin una lista de permitidos o una política configurada de forma peligrosa. Utilice `openclaw security audit` para consultar el inventario de seguridad completo.
  </Accordion>
  <Accordion title="10. Permanencia de systemd (Linux)">
    Si se ejecuta como un servicio de usuario de systemd, doctor garantiza que la permanencia esté habilitada para que el Gateway siga activo después de cerrar la sesión.
  </Accordion>
  <Accordion title="11. Estado del espacio de trabajo (Skills, plugins y TaskFlows)">
    Doctor muestra problemas y acciones para el agente predeterminado, no un inventario de elementos en buen estado:

    - **Skills**: enumera los nombres de Skills permitidos pero inutilizables; utilice `openclaw skills check` para consultar los detalles de los requisitos y los recuentos completos.
    - **Plugins**: informa únicamente de los identificadores de plugins con errores; utilice `openclaw plugins list` para consultar el inventario de plugins cargados, importados, deshabilitados e integrados.
    - **Advertencias de compatibilidad de plugins**: señala los plugins que presentan problemas de compatibilidad con el entorno de ejecución actual.
    - **Diagnósticos de plugins**: muestra cualquier advertencia o error emitido por el registro de plugins durante la carga.
    - **Recuperación de TaskFlow**: muestra los TaskFlows administrados sospechosos que requieren inspección manual o cancelación.
    - **CLI de Claude**: informa únicamente de problemas del binario, la autenticación, el perfil, el espacio de trabajo o el directorio del proyecto; se omiten los detalles de las comprobaciones correctas.

  </Accordion>
  <Accordion title="11b. Tamaño del archivo de arranque">
    Doctor comprueba si los archivos de arranque del espacio de trabajo (por ejemplo, `AGENTS.md`, `CLAUDE.md` u otros archivos de contexto inyectados) están cerca del presupuesto de caracteres configurado o lo superan. Informa, para cada archivo, del número de caracteres sin procesar frente a los inyectados, el porcentaje de truncamiento, la causa del truncamiento (`max/file` o `max/total`) y el total de caracteres inyectados como fracción del presupuesto total. Cuando se truncan archivos o están cerca del límite, doctor muestra consejos para ajustar `agents.defaults.bootstrapMaxChars` y `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Autocompletado del shell">
    Doctor comprueba si el autocompletado con tabulación está instalado para el shell actual (zsh, bash, fish o PowerShell):

    - Si el perfil del shell utiliza un patrón de autocompletado dinámico lento (`source <(openclaw completion ...)`), doctor lo actualiza a la variante más rápida con archivo en caché.
    - Si el autocompletado está configurado en el perfil, pero falta el archivo de caché, doctor regenera la caché automáticamente.
    - Si no hay ningún autocompletado configurado, doctor solicita instalarlo (solo en modo interactivo; se omite con `--non-interactive`).

    Ejecute `openclaw completion --write-state` para regenerar la caché manualmente.

  </Accordion>
  <Accordion title="11d. Limpieza de plugins de canal obsoletos">
    Cuando `openclaw doctor --fix` elimina un plugin de canal ausente, también elimina la configuración huérfana limitada al canal que hacía referencia a ese plugin: entradas `channels.<id>`, destinos de Heartbeat que nombraban el canal y anulaciones `agents.*.models["<channel>/*"]`. Esto evita bucles de arranque del Gateway en los que el entorno de ejecución del canal ya no existe, pero la configuración aún solicita al Gateway que se vincule a él.
  </Accordion>
  <Accordion title="12. Comprobaciones de autenticación del Gateway (token local)">
    Doctor comprueba la preparación de la autenticación mediante token del Gateway local.

    - Si el modo de token necesita un token y no existe ninguna fuente de tokens, doctor ofrece generar uno.
    - Si `gateway.auth.token` está administrado mediante SecretRef, pero no está disponible, doctor advierte de ello y no lo sobrescribe con texto sin formato.
    - `openclaw doctor --generate-gateway-token` fuerza la generación únicamente cuando no hay ningún SecretRef de token configurado.

  </Accordion>
  <Accordion title="12b. Reparaciones de solo lectura compatibles con SecretRef">
    Algunos procesos de reparación necesitan inspeccionar las credenciales configuradas sin debilitar el comportamiento de fallo inmediato del entorno de ejecución.

    - `openclaw doctor --fix` usa el mismo modelo de resumen de SecretRef de solo lectura que los comandos de la familia de estado para reparaciones específicas de la configuración.
    - Ejemplo: la reparación de Telegram `allowFrom` / `groupAllowFrom` `@username` intenta usar las credenciales del bot configuradas cuando están disponibles.
    - Si el token del bot de Telegram está configurado mediante SecretRef, pero no está disponible en la ruta del comando actual, doctor informa que la credencial está configurada pero no disponible y omite la resolución automática en lugar de fallar o indicar erróneamente que falta el token.

  </Accordion>
  <Accordion title="13. Comprobación de estado y reinicio del Gateway">
    Doctor ejecuta una comprobación de estado y ofrece reiniciar el Gateway cuando parece no estar en buen estado.
  </Accordion>
  <Accordion title="13b. Disponibilidad de la búsqueda en memoria">
    Doctor comprueba si el proveedor de embeddings de búsqueda en memoria configurado está listo para el agente predeterminado. El comportamiento depende del backend y del proveedor configurados:

    - **Backend QMD**: comprueba si el binario `qmd` está disponible y puede iniciarse. De lo contrario, muestra instrucciones para solucionarlo, incluido `npm install -g @tobilu/qmd` (o el equivalente de Bun), y una opción de ruta manual al binario.
    - **Proveedor local explícito**: comprueba si hay un archivo de modelo local o una URL reconocida de un modelo remoto o descargable. Si falta, sugiere cambiar a un proveedor remoto.
    - **Proveedor remoto explícito** (`openai`, `voyage`, etc.): verifica que haya una clave de API en el entorno o en el almacén de autenticación. Si falta, muestra indicaciones prácticas para solucionarlo.
    - **Proveedor automático heredado**: trata `memorySearch.provider: "auto"` como OpenAI, comprueba la disponibilidad de OpenAI y `doctor --fix` lo reescribe como `provider: "openai"`.

    Cuando hay disponible un resultado almacenado en caché del sondeo del Gateway (el Gateway estaba en buen estado en el momento de la comprobación), doctor coteja su resultado con la configuración visible desde la CLI e indica cualquier discrepancia. Doctor no inicia un nuevo sondeo de embeddings en la ruta predeterminada; use el comando detallado de estado de la memoria cuando necesite una comprobación en vivo del proveedor.

    Use `openclaw memory status --deep` para verificar la disponibilidad de los embeddings durante la ejecución.

  </Accordion>
  <Accordion title="14. Advertencias sobre el estado de los canales">
    Si el Gateway está en buen estado, doctor ejecuta un sondeo del estado de los canales e informa de las advertencias con soluciones sugeridas.
  </Accordion>
  <Accordion title="15. Auditoría y reparación de la configuración del supervisor">
    Doctor comprueba si faltan valores predeterminados o si están obsoletos en la configuración del supervisor instalado (launchd/systemd/schtasks), por ejemplo, las dependencias de systemd respecto a network-online y el retraso de reinicio. Cuando encuentra una discrepancia, recomienda una actualización y puede reescribir el archivo de servicio o la tarea con los valores predeterminados actuales.

    Notas:

    - `openclaw doctor` solicita confirmación antes de reescribir la configuración del supervisor.
    - `openclaw doctor --yes` acepta las solicitudes de reparación predeterminadas.
    - `openclaw doctor --fix` aplica las correcciones recomendadas sin solicitar confirmación (`--repair` es un alias).
    - `openclaw doctor --fix --force` sobrescribe las configuraciones personalizadas del supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor en modo de solo lectura para el ciclo de vida del servicio del Gateway. Sigue informando del estado del servicio y ejecutando reparaciones no relacionadas con el servicio, pero omite la instalación, el inicio, el reinicio y la inicialización del servicio, las reescrituras de la configuración del supervisor y la limpieza de servicios heredados, porque un supervisor externo controla ese ciclo de vida.
    - En Linux, doctor no reescribe los metadatos del comando o del punto de entrada mientras la unidad systemd correspondiente del Gateway está activa. También ignora las unidades adicionales inactivas, no heredadas y similares al Gateway durante la búsqueda de servicios duplicados, para que los archivos de servicios complementarios no generen ruido de limpieza.
    - Si la autenticación mediante token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación o reparación del servicio de doctor valida el SecretRef, pero no conserva los valores del token resueltos en texto sin formato en los metadatos del entorno del servicio del supervisor.
    - Doctor detecta los valores gestionados de `.env` o respaldados por SecretRef que las instalaciones antiguas de LaunchAgent, systemd o las tareas programadas de Windows incorporaron directamente en el entorno del servicio, y reescribe los metadatos del servicio para que esos valores se carguen desde el origen de ejecución en lugar de hacerlo desde la definición del supervisor.
    - Doctor detecta cuando el comando del servicio todavía fija un `--port` antiguo después de los cambios en `gateway.port` y reescribe los metadatos del servicio con el puerto actual.
    - Si la autenticación mediante token requiere un token y el SecretRef del token configurado no se puede resolver, doctor bloquea la ruta de instalación o reparación con instrucciones prácticas.
    - Si están configurados tanto `gateway.auth.token` como `gateway.auth.password` y `gateway.auth.mode` no está definido, doctor bloquea la instalación o reparación hasta que se establezca el modo explícitamente.
    - Para las unidades systemd de usuario de Linux, las comprobaciones de divergencia del token de doctor incluyen las fuentes `Environment=` y `EnvironmentFile=` al comparar los metadatos de autenticación del servicio.
    - Las reparaciones de servicios de doctor se niegan a reescribir, detener o reiniciar un servicio del Gateway desde un binario antiguo de OpenClaw cuando la configuración fue escrita por última vez por una versión más reciente. Consulte [Solución de problemas del Gateway](/es/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Siempre se puede forzar una reescritura completa mediante `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos de ejecución y puertos del Gateway">
    Doctor inspecciona la ejecución del servicio (PID, estado de la última salida) y advierte cuando el servicio está instalado, pero en realidad no se está ejecutando. También comprueba si hay conflictos en el puerto del Gateway (predeterminado: `18789`) e informa de las causas probables (el Gateway ya está en ejecución, túnel SSH).
  </Accordion>
  <Accordion title="17. Prácticas recomendadas para la ejecución del Gateway">
    Doctor advierte cuando el servicio del Gateway se ejecuta en Bun o mediante una ruta de Node gestionada por versiones (`nvm`, `fnm`, `volta`, `asdf`, etc.). Bun no puede abrir el almacén de estado `node:sqlite` de OpenClaw, por lo que las reparaciones migran los servicios heredados de Bun a Node. Las rutas de los gestores de versiones pueden dejar de funcionar después de las actualizaciones porque el servicio no carga la inicialización del shell. Doctor ofrece migrar a una instalación de Node del sistema cuando está disponible (Homebrew/apt/choco).

    Los LaunchAgents de macOS recién instalados o reparados usan un PATH canónico del sistema (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) en lugar de copiar el PATH del shell interactivo, de modo que los binarios del sistema gestionados por Homebrew permanezcan disponibles, mientras que los directorios de Volta, asdf, fnm, pnpm y otros gestores de versiones no cambien qué Node resuelven los procesos secundarios. Los servicios de Linux siguen conservando raíces de entorno explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) y directorios estables de binarios de usuario, pero los directorios alternativos inferidos de gestores de versiones solo se escriben en el PATH del servicio cuando existen en el disco.

  </Accordion>
  <Accordion title="18. Escritura de la configuración y metadatos del asistente">
    Doctor conserva cualquier cambio de configuración y registra los metadatos del asistente para dejar constancia de la ejecución de doctor.
  </Accordion>
  <Accordion title="19. Consejos sobre el espacio de trabajo (copia de seguridad y sistema de memoria)">
    Doctor sugiere un sistema de memoria para el espacio de trabajo cuando no existe y muestra un consejo sobre copias de seguridad si el espacio de trabajo aún no está bajo el control de git.

    Consulte [/concepts/agent-workspace](/es/concepts/agent-workspace) para obtener una guía completa sobre la estructura del espacio de trabajo y las copias de seguridad con git (se recomienda un repositorio privado de GitHub o GitLab).

  </Accordion>
</AccordionGroup>

## Temas relacionados

- [Guía operativa del Gateway](/es/gateway)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
