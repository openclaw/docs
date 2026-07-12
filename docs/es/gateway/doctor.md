---
read_when:
    - Añadir o modificar migraciones de doctor
    - Introducción de cambios incompatibles en la configuración
sidebarTitle: Doctor
summary: 'Comando doctor: comprobaciones de estado, migraciones de configuración y pasos de reparación'
title: Diagnóstico
x-i18n:
    generated_at: "2026-07-12T14:30:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 39e6be1fa29f2cc0e9832a4c8e5b0ae3dd2e7de43e2466df20f7067ef5ddf0a8
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

    Acepta los valores predeterminados sin solicitar confirmación (incluidos los pasos de reinicio y reparación de servicios o del entorno aislado cuando corresponda).

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

    Ejecuta comprobaciones de estado estructuradas para CI o la automatización de comprobaciones previas. Es de solo lectura: no realiza
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

`openclaw doctor --lint` es la variante de `openclaw doctor --fix`
diseñada para la automatización. Comparten el mismo registro de reglas de Doctor, pero no
seleccionan ni aplican las reglas de la misma manera:

| Modo                     | Solicitudes de confirmación | Escribe configuración/estado        | Salida                               | Uso                                     |
| ------------------------ | --------------------------- | ----------------------------------- | ------------------------------------ | --------------------------------------- |
| `openclaw doctor`        | sí                          | no                                  | informe de estado fácil de interpretar | comprobación humana del estado           |
| `openclaw doctor --fix`  | a veces                     | sí, según la política de reparación | registro de reparación fácil de interpretar | aplicación de reparaciones aprobadas |
| `openclaw doctor --lint` | no                          | no                                  | hallazgos estructurados               | CI, comprobaciones previas y controles de revisión |

De forma predeterminada, `doctor --lint` ejecuta el perfil de automatización amplio y seguro: comprobaciones
estáticas, locales y útiles para CI o para la salida de comprobaciones previas. Omite las comprobaciones opcionales que
son informativas, dependen del entorno o de servicios activos, inventarían cuentas o espacios de trabajo,
o realizan limpieza histórica. Usa `doctor --lint --all` cuando quieras la
auditoría completa de análisis registrada, incluidas esas comprobaciones opcionales, o `--only <id>` para
una comprobación específica.

`doctor --fix` no utiliza el perfil predeterminado de análisis y no acepta
`--all`. Ejecuta la ruta de reparación ordenada de Doctor: las comprobaciones de estado modernas pueden proporcionar
una implementación opcional de `repair()`, mientras que las áreas más antiguas siguen utilizando su flujo
de reparación heredado de Doctor. Algunos hallazgos del análisis son intencionadamente solo diagnósticos, por lo que
la aparición de una comprobación en `--lint --all` no implica que `--fix` vaya a modificar esa área.
El contrato separa `detect()` (informa de los hallazgos) de `repair()` (informa de
cambios/diferencias/efectos secundarios), lo que mantiene abierta la posibilidad de incorporar en el futuro
`doctor --fix --dry-run` sin convertir las comprobaciones de análisis en planificadores de modificaciones.

Algunas comprobaciones integradas están desactivadas de forma predeterminada internamente para que sigan estando disponibles mediante
`--all`, `--only` y los flujos de reparación de Doctor sin formar parte del perfil de automatización
predeterminado de `doctor --lint`. La gravedad de cada hallazgo sigue emitiéndose
por hallazgo (`info`, `warning` o `error`); la selección predeterminada no es un nivel
de gravedad.

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

| Código | Significado                                                               |
| ------ | ------------------------------------------------------------------------- |
| `0`    | no hay hallazgos que alcancen o superen el umbral seleccionado            |
| `1`    | uno o más hallazgos alcanzaron el umbral seleccionado                     |
| `2`    | fallo del comando o del entorno de ejecución antes de poder emitir hallazgos |

Opciones:

- `--severity-min info|warning|error` (valor predeterminado: `warning`): controla tanto lo que se muestra como lo que provoca una salida distinta de cero.
- `--all`: ejecuta todas las comprobaciones de análisis registradas, incluidas las comprobaciones opcionales excluidas del conjunto de automatización predeterminado.
- `--only <id>` (repetible): ejecuta únicamente los identificadores de comprobación indicados; un identificador desconocido se notifica como un hallazgo de error.
- `--skip <id>` (repetible): excluye una comprobación y mantiene activo el resto de la ejecución.
- `--json`, `--severity-min`, `--all`, `--only` y `--skip` requieren `--lint`; las ejecuciones simples de `openclaw doctor` y `--fix` las rechazan.

## Qué hace (resumen)

<AccordionGroup>
  <Accordion title="Estado, interfaz de usuario y actualizaciones">
    - Actualización previa opcional para instalaciones mediante git (solo en modo interactivo).
    - Comprobación de vigencia del protocolo de la interfaz de usuario (recompila la interfaz de control cuando el esquema del protocolo es más reciente).
    - Comprobación de estado + solicitud de reinicio.
    - Resumen del estado de Skills (aptas/ausentes/bloqueadas) y estado de los plugins.

  </Accordion>
  <Accordion title="Configuración y migraciones">
    - Normalización de configuraciones con formatos de valores heredados.
    - Migración de la configuración de conversación desde los campos planos heredados `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Comprobaciones de migración del navegador para configuraciones heredadas de la extensión de Chrome y preparación de Chrome MCP.
    - Advertencias sobre anulaciones del proveedor OpenCode (`models.providers.opencode` / `opencode-zen` / `opencode-go`).
    - Migración del proveedor/perfil heredado de OpenAI Codex (`openai-codex` → `openai`) y advertencias de ocultamiento por `models.providers.openai-codex` obsoleto.
    - Comprobación de requisitos previos de TLS para perfiles OAuth de OpenAI Codex.
    - Advertencias sobre listas de permitidos de plugins/herramientas cuando `plugins.allow` es restrictivo, pero la política de herramientas sigue solicitando comodines o herramientas propiedad de plugins.
    - Migración del estado heredado en disco (sesiones/directorio del agente/autenticación de WhatsApp).
    - Migración de claves heredadas del contrato del manifiesto de plugins (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migración del almacén Cron heredado (`jobId`, `schedule.cron`, campos de entrega/carga útil de nivel superior, `provider` de la carga útil y tareas de respaldo de Webhook con `notify: true`).
    - Reparación de la fijación del entorno de ejecución de Codex CLI (`agentRuntime.id: "codex-cli"` → `"codex"`) en `agents.defaults`, `agents.list[]` y `models.providers.*` (incluidas las entradas específicas de cada modelo).
    - Limpieza de configuraciones obsoletas de plugins cuando estos están habilitados; cuando `plugins.enabled=false`, las referencias obsoletas a plugins se conservan como configuración de contención inerte.

  </Accordion>
  <Accordion title="Estado e integridad">
    - Inspección de archivos de bloqueo de sesiones y limpieza de bloqueos obsoletos.
    - Reparación de transcripciones de sesiones con ramas duplicadas de reescritura de instrucciones creadas por las compilaciones afectadas de 2026.4.24.
    - Detección de marcadores de recuperación tras reinicio de subagentes bloqueados, con compatibilidad de `--fix` para borrar indicadores obsoletos de recuperación abortada, de modo que el inicio no siga tratando al proceso hijo como abortado durante el reinicio.
    - Comprobaciones de integridad del estado y de permisos (sesiones, transcripciones y directorio de estado).
    - Comprobaciones de permisos del archivo de configuración (chmod 600) al ejecutarse localmente.
    - Estado de autenticación del modelo: comprueba el vencimiento de OAuth, puede renovar tokens próximos a vencer e informa de los estados de espera o deshabilitación del perfil de autenticación.

  </Accordion>
  <Accordion title="Gateway, servicios y supervisores">
    - Reparación de la imagen del entorno aislado cuando este está habilitado.
    - Migración de servicios heredados y detección de gateways adicionales.
    - Migración del estado heredado del canal Matrix (en el modo `--fix` / `--repair`).
    - Comprobaciones del entorno de ejecución del Gateway (servicio instalado pero no activo; etiqueta launchd almacenada en caché).
    - Advertencias sobre el estado de los canales (consultado desde el gateway en ejecución).
    - Las comprobaciones de permisos específicas de cada canal se encuentran en `openclaw channels capabilities`; por ejemplo, los permisos de los canales de voz de Discord se auditan con `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Comprobaciones de capacidad de respuesta de WhatsApp cuando el bucle de eventos del Gateway presenta un estado degradado y aún hay clientes TUI locales en ejecución; `--fix` detiene únicamente los clientes TUI locales verificados.
    - Reparación de rutas de Codex para referencias heredadas a modelos `openai-codex/*` en modelos principales, alternativas, modelos de generación de imágenes/vídeos, anulaciones de Heartbeat/subagentes/Compaction, hooks, anulaciones de modelos de canales y fijaciones de rutas de sesiones; `--fix` las reescribe como `openai/*`, migra los perfiles/órdenes de autenticación `openai-codex:*` a `openai:*`, elimina las fijaciones obsoletas del entorno de ejecución de sesiones/agentes completos y permite que la ruta efectiva reparada determine si Codex es compatible.
    - Auditoría de la configuración del supervisor (launchd/systemd/schtasks) con reparación opcional.
    - Limpieza de variables de entorno de proxy integradas en servicios del Gateway que capturaron valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante la instalación o actualización.
    - Comprobaciones de prácticas recomendadas del entorno de ejecución del Gateway (Node frente a Bun, rutas de gestores de versiones).
    - Diagnóstico de colisiones del puerto del Gateway (valor predeterminado: `18789`).

  </Accordion>
  <Accordion title="Autenticación, seguridad y vinculación">
    - Advertencias de seguridad para políticas de mensajes directos abiertos.
    - Comprobaciones de autenticación del Gateway para el modo de token local (ofrece generar un token cuando no existe ninguna fuente de tokens; no sobrescribe configuraciones de token SecretRef).
    - Detección de problemas de vinculación de dispositivos (solicitudes pendientes de primera vinculación, mejoras pendientes de rol/ámbito, divergencias obsoletas en la caché local de tokens de dispositivos y divergencias de autenticación en registros vinculados).

  </Accordion>
  <Accordion title="Espacio de trabajo y shell">
    - Comprobación de permanencia de systemd en Linux.
    - Comprobación del tamaño del archivo de arranque del espacio de trabajo (advertencias de truncamiento o proximidad al límite para archivos de contexto).
    - Comprobación de preparación de Skills para el agente predeterminado; informa de Skills permitidas a las que les faltan binarios, variables de entorno, configuración o requisitos del sistema operativo, y `--fix` puede deshabilitar las Skills no disponibles en `skills.entries`.
    - Comprobación del estado del completado del shell e instalación/actualización automática.
    - Comprobación de preparación del proveedor de incrustaciones para la búsqueda en memoria (modelo local, clave de API remota o binario QMD).
    - Comprobaciones de instalaciones desde el código fuente (discrepancia del espacio de trabajo de pnpm, recursos de interfaz de usuario ausentes, binario tsx ausente).
    - Escribe la configuración actualizada + metadatos del asistente.

  </Accordion>
</AccordionGroup>

## Relleno y restablecimiento de la interfaz de Dreams

La escena Dreams de la interfaz de control incluye las acciones **Rellenar**, **Restablecer** y **Borrar con base** para el flujo de Dreaming con base. Estas utilizan métodos RPC de estilo Doctor del gateway, pero **no** forman parte de la reparación/migración de la CLI `openclaw doctor`.

| Acción          | Qué hace                                                                                                                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rellenar        | Examina los archivos históricos `memory/YYYY-MM-DD.md` del espacio de trabajo activo, ejecuta la pasada de diario REM con base y escribe entradas de relleno reversibles en `DREAMS.md`.                 |
| Restablecer     | Elimina únicamente de `DREAMS.md` las entradas marcadas del diario de relleno.                                                                                                                           |
| Borrar con base | Elimina únicamente las entradas provisionales a corto plazo exclusivas del proceso con base procedentes de la reproducción histórica que todavía no han acumulado evocaciones activas ni respaldo diario. |

  Ninguna de estas opciones edita `MEMORY.md`, ejecuta migraciones completas de doctor ni incorpora por sí sola candidatos fundamentados al almacén activo de promoción a corto plazo. Para enviar la reproducción histórica fundamentada al flujo normal de promoción profunda, use en su lugar el flujo de la CLI:

  ```bash
  openclaw memory rem-backfill --path ./memory --stage-short-term
  ```

  Esto incorpora candidatos duraderos fundamentados al almacén de dreaming a corto plazo, mientras `DREAMS.md` sigue siendo la superficie de revisión.

  ## Comportamiento detallado y justificación

  <AccordionGroup>
  <Accordion title="0. Actualización opcional (instalaciones mediante git)">
    Si se trata de un checkout de git y doctor se ejecuta de forma interactiva, ofrece realizar una actualización (fetch/rebase/build) antes de ejecutar doctor.
  </Accordion>
  <Accordion title="1. Normalización de la configuración">
    Doctor normaliza las formas de valores heredadas al esquema actual. La configuración actual de voz de Talk es `talk.provider` + `talk.providers.<provider>`, con la configuración de voz en tiempo real en `talk.realtime.*`. Doctor reescribe las formas antiguas `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` en el mapa de proveedores y reescribe los selectores heredados de nivel superior para tiempo real (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) en `talk.realtime`.

    Doctor también advierte cuando `plugins.allow` no está vacío y la política de herramientas usa un comodín o entradas de herramientas pertenecientes a plugins. `tools.allow: ["*"]` solo coincide con herramientas de plugins que realmente se cargan; no omite la lista de permitidos exclusiva de plugins.

  </Accordion>
  <Accordion title="2. Migraciones de claves de configuración heredadas">
    Cuando la configuración contiene una clave obsoleta con una migración activa, los demás comandos se niegan a ejecutarse y solicitan ejecutar `openclaw doctor`. Doctor explica qué claves heredadas se encontraron, muestra la migración que aplicó y reescribe `~/.openclaw/openclaw.json` con el esquema actualizado. El inicio de Gateway rechaza los formatos de configuración heredados y solicita ejecutar `openclaw doctor --fix`; no reescribe `openclaw.json` al iniciarse. `openclaw doctor --fix` también se encarga de las migraciones del almacén de trabajos Cron.

    <Note>
      Doctor solo mantiene migraciones automáticas durante aproximadamente dos meses después de retirar una
      clave. Las claves heredadas más antiguas (por ejemplo, las claves originales
      `routing.queue`, `routing.bindings`, `routing.agents`/`defaultAgentId`,
      `routing.transcribeAudio`, `agent.*` de nivel superior o `identity` de nivel superior
      de la estructura de configuración anterior a la compatibilidad con varios agentes) ya no disponen de una ruta de migración;
      la configuración que las utiliza ahora no supera la validación en lugar de reescribirse. Corrija
      esas claves manualmente según la referencia de configuración actual antes de que Doctor
      pueda continuar.
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
    | selectores de Talk en tiempo real heredados de nivel superior (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) | `talk.realtime`                                                              |
    | `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)                             | `messages.tts.providers.<provider>`                                          |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                  | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`   |
    | campos de voz de TTS `voice`/`voiceName`/`voiceId`                                                 | `speakerVoice`/`speakerVoiceId`                                              |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>` (todos los canales excepto Discord)                                          | `...tts.providers.<provider>`                                                |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>` (todos los canales, incluido Discord)                          | `...voice.tts.providers.<provider>`                                          |
    | `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)     | `plugins.entries.voice-call.config.tts.providers.<provider>`                |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                | `provider: "microsoft"` / `...tts.providers.microsoft`                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                              | `"mock"`                                                                      |
    | `plugins.entries.voice-call.config.twilio.from`                                                  | `plugins.entries.voice-call.config.fromNumber`                              |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                        | `plugins.entries.voice-call.config.streaming.provider`                      |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"` (el inicio de Gateway también omite los proveedores cuyo valor `api` sea un valor de enumeración futuro o desconocido, en lugar de cerrarse ante el fallo) |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | eliminada (configuración heredada del relé de la extensión de Chrome)                             |
    | `mcp.servers.*.type` (alias nativos de CLI)                                                        | `mcp.servers.*.transport`                                                    |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | eliminada (el servidor de aplicaciones de Codex siempre conserva como nativas las herramientas del espacio de trabajo propias de Codex) |
    | `commands.modelsWrite`                                                                           | eliminada (`/models add` está obsoleto)                                       |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                     | eliminada (el valor exacto `NO_REPLY` ya no se reescribe como texto alternativo visible)  |
    | `agents.defaults/list[].systemPromptOverride`                                                    | eliminada (OpenClaw controla el mensaje del sistema generado)                        |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | eliminada (use `models.providers.<id>.timeoutSeconds` para los tiempos de espera de modelos o proveedores lentos, manteniéndolos por debajo del límite de tiempo de espera del agente o la ejecución) |
    | `memorySearch` de nivel superior                                                                         | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path` (en cualquier nivel)                                                            | eliminada (los índices de memoria residen en la base de datos de cada agente)                       |
    | `heartbeat` de nivel superior                                                                            | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | identificadores de política `plugins.openai-codex`                                                                | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                 | eliminadas (obsoletas)                                                        |
    | `diagnostics.memoryPressureBundle`                                                               | `diagnostics.memoryPressureSnapshot`                                        |

    <Note>
      Las filas `plugins.entries.voice-call.config.*` anteriores las normaliza
      el propio Plugin Voice Call cada vez que se carga la configuración, no `openclaw
      doctor`. El Plugin también registra una advertencia de inicio que remite a `openclaw
      doctor --fix`, pero Doctor no reescribe actualmente
      `openclaw.json` para estas claves; la propia normalización del Plugin es la que
      aplica el cambio en tiempo de ejecución.
    </Note>

    Orientación sobre la cuenta predeterminada para canales con varias cuentas:

    - Si se configuran dos o más entradas `channels.<channel>.accounts` sin `channels.<channel>.defaultAccount` ni `accounts.default`, Doctor advierte que el enrutamiento alternativo puede seleccionar una cuenta inesperada.
    - Si `channels.<channel>.defaultAccount` se establece en un ID de cuenta desconocido, Doctor muestra una advertencia y enumera los ID de cuenta configurados.

  </Accordion>
  <Accordion title="2b. Anulaciones del proveedor OpenCode">
    Si ha añadido manualmente `models.providers.opencode`, `opencode-zen` u `opencode-go`, esto anula el catálogo integrado de OpenCode de `openclaw/plugin-sdk/llm`. Esto puede hacer que los modelos usen la API incorrecta o que sus costes se establezcan en cero. Doctor muestra una advertencia para que pueda eliminar la anulación y restaurar el enrutamiento de API y los costes por modelo.
  </Accordion>
  <Accordion title="2c. Migración del navegador y preparación de Chrome MCP">
    Si la configuración del navegador todavía apunta a la ruta eliminada de la extensión de Chrome, Doctor la normaliza al modelo actual de conexión de Chrome MCP local al host (`browser.profiles.*.driver: "extension"` → `"existing-session"`; se elimina `browser.relayBindHost`).

    Doctor también audita la ruta de Chrome MCP local al host cuando se usa `defaultProfile: "user"` o un perfil `existing-session` configurado:

    - comprueba si Google Chrome está instalado en el mismo host para los perfiles predeterminados de conexión automática
    - comprueba la versión de Chrome detectada y muestra una advertencia cuando es anterior a Chrome 144
    - recuerda que se debe habilitar la depuración remota en la página de inspección del navegador (por ejemplo, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor no puede habilitar la configuración de Chrome. Chrome MCP local al host sigue requiriendo un navegador basado en Chromium 144+ en el host del gateway/nodo, ejecutándose localmente, con la depuración remota habilitada y la primera solicitud de consentimiento de conexión aprobada en el navegador.

    La preparación descrita aquí solo abarca los requisitos previos de conexión local. Existing-session mantiene los límites actuales de las rutas de Chrome MCP; las rutas avanzadas como `responsebody`, la exportación a PDF, la interceptación de descargas y las acciones por lotes siguen requiriendo un navegador administrado o un perfil CDP sin procesar. Esta comprobación no se aplica a Docker, sandbox, navegadores remotos ni otros flujos sin interfaz gráfica, que siguen usando CDP sin procesar.

  </Accordion>
  <Accordion title="2d. Requisitos previos de TLS para OAuth">
    Cuando se configura un perfil OAuth de OpenAI Codex, Doctor comprueba el punto de conexión de autorización de OpenAI para verificar que la pila TLS local de Node/OpenSSL puede validar la cadena de certificados. Si la comprobación falla con un error de certificado (por ejemplo, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado caducado o certificado autofirmado), Doctor muestra instrucciones de corrección específicas para la plataforma. En macOS con un Node de Homebrew, la solución suele ser `brew postinstall ca-certificates`. Con `--deep`, la comprobación se ejecuta incluso si el gateway funciona correctamente.
  </Accordion>
  <Accordion title="2e. Anulaciones del proveedor OAuth de Codex">
    Si anteriormente añadió configuraciones de transporte heredadas de OpenAI en `models.providers.openai-codex`, estas pueden ocultar la ruta integrada del proveedor OAuth de Codex. Doctor muestra una advertencia cuando detecta esas configuraciones de transporte antiguas junto con OAuth de Codex, para que pueda eliminar o reescribir la anulación de transporte obsoleta y restaurar el comportamiento de enrutamiento actual. Los proxies personalizados y las anulaciones que solo contienen encabezados siguen siendo compatibles y no activan esta advertencia, pero esas rutas de solicitud definidas no son aptas para la selección implícita de Codex.
  </Accordion>
  <Accordion title="2f. Reparación de rutas de Codex">
    Doctor comprueba si hay referencias de modelos `openai-codex/*` heredadas. El enrutamiento del entorno nativo de Codex usa referencias de modelos `openai/*` canónicas, pero el prefijo por sí solo nunca selecciona Codex. Si la política del entorno de ejecución no está configurada o es `auto`, solo son aptas las rutas oficiales HTTPS exactas de Platform Responses o ChatGPT Responses sin ninguna anulación de solicitud definida. Consulte [entorno de ejecución implícito del agente de OpenAI](/es/providers/openai#implicit-agent-runtime).

    En el modo `--fix` / `--repair`, Doctor reescribe las referencias afectadas del agente predeterminado y de cada agente, incluidos los modelos principales, las alternativas, los modelos de generación de imágenes/vídeos, las anulaciones de Heartbeat/subagente/Compaction, los enlaces, las anulaciones de modelos de canales y el estado de ruta obsoleto de las sesiones persistentes:

    - `openai-codex/gpt-*` se convierte en `openai/gpt-*`.
    - La intención de Codex se traslada a entradas `agentRuntime.id: "codex"` con ámbito de proveedor/modelo para las referencias de modelos de agente reparadas.
    - Se eliminan la configuración obsoleta del entorno de ejecución de todo el agente y las fijaciones persistentes del entorno de ejecución de la sesión, porque la selección del entorno de ejecución tiene ámbito de proveedor/modelo.
    - La política existente del entorno de ejecución del proveedor/modelo se conserva, salvo que la referencia de modelo heredada reparada necesite el enrutamiento de Codex para mantener la antigua ruta de autenticación.
    - Las listas existentes de modelos alternativos se conservan con sus entradas heredadas reescritas; la configuración copiada de cada modelo se traslada de la clave heredada a la clave canónica `openai/*`.
    - Las fijaciones persistentes de sesión de `modelProvider`/`providerOverride`, `model`/`modelOverride`, los avisos de alternativas y los perfiles de autenticación se reparan en todos los almacenes de sesiones de agentes detectados.
    - Doctor repara por separado las fijaciones obsoletas `agentRuntime.id: "codex-cli"` (un identificador de entorno de ejecución heredado distinto) y las cambia a `"codex"` en `agents.defaults`, `agents.list[]` y las entradas de modelos `models.providers.*`.
    - `/codex ...` significa «controlar o vincular una conversación nativa de Codex desde el chat».
    - `/acp ...` o `runtime: "acp"` significa «usar el adaptador externo ACP/acpx».

  </Accordion>
  <Accordion title="2g. Limpieza de rutas de sesión">
    Doctor también analiza los almacenes de sesiones de agentes detectados en busca de estados de ruta obsoletos creados automáticamente después de trasladar los modelos configurados o el entorno de ejecución fuera de una ruta perteneciente a un Plugin, como Codex.

    `openclaw doctor --fix` puede borrar estados obsoletos creados automáticamente, como fijaciones de modelos `modelOverrideSource: "auto"`, metadatos de modelos del entorno de ejecución, identificadores fijados del entorno, vinculaciones de sesiones de CLI y anulaciones automáticas de perfiles de autenticación cuando la ruta propietaria ya no está configurada. Las elecciones explícitas del usuario o heredadas de modelos de sesión se notifican para su revisión manual y no se modifican; cámbielas con `/model ...`, `/new` o restablezca la sesión cuando ya no se quiera usar esa ruta.

  </Accordion>
  <Accordion title="3. Migraciones de estado heredado (disposición en disco)">
    Doctor puede migrar disposiciones antiguas del disco a la estructura actual:

    - Almacén de sesiones y transcripciones: de `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directorio del agente: de `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticación de WhatsApp (Baileys): de los archivos heredados `~/.openclaw/credentials/*.json` (excepto `oauth.json`) a `~/.openclaw/credentials/whatsapp/<accountId>/...` (identificador de cuenta predeterminado: `default`)

    Estas migraciones se realizan con el mejor esfuerzo y son idempotentes; Doctor emite advertencias cuando deja alguna carpeta heredada como copia de seguridad. El Gateway/CLI también migra automáticamente las sesiones heredadas y el directorio del agente al iniciarse, de modo que el historial, la autenticación y los modelos se guarden en la ruta de cada agente sin ejecutar Doctor manualmente. La autenticación de WhatsApp se migra intencionadamente solo mediante `openclaw doctor`. La normalización del proveedor/mapa de proveedores de conversación compara mediante igualdad estructural, por lo que las diferencias debidas únicamente al orden de las claves ya no activan cambios nulos repetidos de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migraciones de manifiestos de Plugin heredados">
    Doctor analiza todos los manifiestos de Plugin instalados en busca de claves de capacidad de nivel superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Cuando las encuentra, ofrece trasladarlas al objeto `contracts` y reescribir el archivo de manifiesto en el mismo lugar. Esta migración es idempotente; si `contracts` ya contiene los mismos valores, se elimina la clave heredada sin duplicar los datos.
  </Accordion>
  <Accordion title="3b. Migraciones del almacén de Cron heredado">
    Doctor también comprueba el almacén de trabajos de Cron (`~/.openclaw/cron/jobs.json` de forma predeterminada, o `cron.store` cuando se anula) en busca de formatos de trabajo antiguos que el planificador aún acepta por compatibilidad.

    Las limpiezas actuales de Cron incluyen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de carga útil de nivel superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nivel superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de entrega `provider` de la carga útil → `delivery.channel` explícito
    - trabajos de Webhook alternativos heredados con `notify: true` → entrega explícita mediante Webhook desde `cron.webhook` cuando está configurado; los trabajos de anuncio conservan su entrega por chat y reciben `delivery.completionDestination`. Cuando `cron.webhook` no está configurado, se elimina el marcador de nivel superior inerte `notify` de los trabajos sin destino (se conserva la entrega existente, incluidos los anuncios), ya que la entrega en tiempo de ejecución nunca lo lee.

    El Gateway también depura las filas de Cron con formato incorrecto durante la carga para que los trabajos válidos sigan ejecutándose. Las filas sin procesar con formato incorrecto se copian en `jobs-quarantine.json`, junto al almacén activo, antes de eliminarlas de `jobs.json`; Doctor informa de las filas en cuarentena para que pueda revisarlas o repararlas manualmente.

    Al iniciarse, el Gateway normaliza la proyección del entorno de ejecución e ignora el marcador de nivel superior `notify`, pero deja la configuración persistente de Cron para que Doctor la repare. Cuando `cron.webhook` no está configurado, Doctor elimina el marcador inerte de los trabajos sin destino de migración (`delivery.mode` ausente o con valor none, un destino de Webhook inutilizable o una entrega existente por anuncio/chat), sin modificar la entrega existente, para que las ejecuciones repetidas de `doctor --fix` dejen de advertir sobre el mismo trabajo. Si `cron.webhook` está configurado pero no es una URL HTTP(S) válida, Doctor sigue mostrando una advertencia y conserva el marcador para que pueda corregir la URL.

    En Linux, Doctor también muestra una advertencia cuando el crontab del usuario todavía invoca el archivo heredado `~/.openclaw/bin/ensure-whatsapp.sh`. Ese script local al host no recibe mantenimiento en la versión actual de OpenClaw y puede escribir mensajes falsos `Gateway inactive` en `~/.openclaw/logs/whatsapp-health.log` cuando Cron no puede acceder al bus de usuario de systemd. Elimine la entrada obsoleta del crontab con `crontab -e`; use `openclaw channels status --probe`, `openclaw doctor` y `openclaw gateway status` para las comprobaciones de estado actuales.

  </Accordion>
  <Accordion title="3c. Limpieza de bloqueos de sesión">
    Doctor analiza cada directorio de sesiones de agentes en busca de archivos de bloqueo de escritura obsoletos que hayan quedado tras la finalización anormal de una sesión. Para cada archivo de bloqueo encontrado, informa de lo siguiente: la ruta, el PID, si el PID sigue activo, la antigüedad del bloqueo y si se considera obsoleto (PID inactivo, metadatos de propietario con formato incorrecto, antigüedad superior a 30 minutos o un PID activo que se haya demostrado que pertenece a un proceso ajeno a OpenClaw). En el modo `--fix` / `--repair`, elimina automáticamente los bloqueos con propietarios inactivos, huérfanos, reciclados, antiguos con formato incorrecto o ajenos a OpenClaw. Los bloqueos antiguos que todavía pertenecen a un proceso activo de OpenClaw se notifican, pero se mantienen para que Doctor no interrumpa un escritor de transcripciones activo.
  </Accordion>
  <Accordion title="3d. Reparación de ramas de transcripciones de sesión">
    Doctor analiza los archivos JSONL de las sesiones de agentes en busca de la estructura de rama duplicada creada por el error de reescritura de transcripciones de solicitudes de 2026.4.24: un turno de usuario abandonado con contexto interno del entorno de ejecución de OpenClaw y un elemento hermano activo que contiene la misma solicitud visible del usuario. En el modo `--fix` / `--repair`, Doctor crea una copia de seguridad de cada archivo afectado junto al original y reescribe la transcripción para conservar la rama activa, de modo que el historial del Gateway y los lectores de memoria dejen de ver turnos duplicados.
  </Accordion>
  <Accordion title="4. Comprobaciones de integridad del estado (persistencia de sesiones, enrutamiento y seguridad)">
    El directorio de estado es el tronco encefálico operativo. Si desaparece, se pierden las sesiones, las credenciales, los registros y la configuración, a menos que existan copias de seguridad en otro lugar.

    Doctor comprueba:

    - **Falta el directorio de estado**: advierte sobre una pérdida catastrófica del estado, solicita volver a crear el directorio y recuerda que no puede recuperar los datos que faltan.
    - **Permisos del directorio de estado**: verifica que se pueda escribir en él; ofrece reparar los permisos (y muestra una sugerencia de `chown` cuando detecta que el propietario o el grupo no coinciden).
    - **Directorio de estado sincronizado con la nube en macOS**: advierte cuando el estado se resuelve dentro de iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...`, porque las rutas respaldadas por sincronización pueden provocar operaciones de E/S más lentas y condiciones de carrera de bloqueo o sincronización.
    - **Directorio de estado en SD o eMMC en Linux**: advierte cuando el estado se resuelve en un origen de montaje `mmcblk*`, porque las operaciones de E/S aleatorias respaldadas por SD/eMMC pueden ser más lentas y causar un desgaste más rápido al escribir sesiones y credenciales.
    - **Directorio de estado volátil en Linux**: advierte cuando el estado se resuelve en `tmpfs` o `ramfs`, porque las sesiones, las credenciales, la configuración y el estado de SQLite (con archivos auxiliares WAL/diario) desaparecen al reiniciar. Los montajes `overlay` de Docker no se señalan intencionalmente porque sus capas con capacidad de escritura persisten tras reiniciar el host mientras el contenedor permanezca.
    - **Faltan directorios de sesiones**: `sessions/` y el directorio del almacén de sesiones son necesarios para conservar el historial y evitar fallos `ENOENT`.
    - **Discordancia de transcripciones**: advierte cuando faltan archivos de transcripción para entradas de sesión recientes.
    - **Sesión principal con «JSONL de 1 línea»**: señala cuando la transcripción principal solo tiene una línea (el historial no se está acumulando).
    - **Varios directorios de estado**: advierte cuando existen varias carpetas `~/.openclaw` en distintos directorios personales o cuando `OPENCLAW_STATE_DIR` apunta a otra ubicación (el historial puede quedar dividido entre instalaciones).
    - **Recordatorio del modo remoto**: si `gateway.mode=remote`, doctor recuerda que debe ejecutarse en el host remoto (el estado se encuentra allí).
    - **Permisos del archivo de configuración**: advierte si `~/.openclaw/openclaw.json` permite la lectura por parte del grupo o de cualquier usuario y ofrece restringirlo a `600`.

  </Accordion>
  <Accordion title="5. Estado de la autenticación del modelo (caducidad de OAuth)">
    Doctor inspecciona los perfiles de OAuth del almacén de autenticación, advierte cuando los tokens están a punto de caducar o ya han caducado y puede renovarlos cuando sea seguro. Si el perfil de OAuth/token de Anthropic está obsoleto, sugiere una clave de API de Anthropic o la ruta del token de configuración de Anthropic. Las solicitudes de renovación solo aparecen durante la ejecución interactiva (TTY); `--non-interactive` omite los intentos de renovación.

    Cuando una renovación de OAuth falla permanentemente (por ejemplo, `refresh_token_reused`, `invalid_grant` o un proveedor indica que debe iniciarse sesión de nuevo), doctor informa que es necesario volver a autenticarse e imprime el comando exacto `openclaw models auth login --provider ...` que debe ejecutarse.

    Doctor también informa sobre los perfiles de autenticación que no pueden utilizarse temporalmente debido a períodos de espera breves (límites de frecuencia, tiempos de espera o fallos de autenticación) o desactivaciones más prolongadas (fallos de facturación o crédito).

    Los perfiles de OAuth heredados de Codex cuyos tokens se encuentran en el llavero de macOS (incorporación anterior a la disposición de archivos auxiliares) solo los repara doctor. Ejecute `openclaw doctor --fix` una vez desde un terminal interactivo para migrar en línea los tokens heredados respaldados por el llavero a `auth-profiles.json`; después, los turnos integrados (Telegram, cron, envío a subagentes) los resolverán como perfiles canónicos de OAuth de OpenAI.

  </Accordion>
  <Accordion title="6. Validación del modelo de hooks">
    Si se establece `hooks.gmail.model`, doctor valida la referencia del modelo con respecto al catálogo y la lista de permitidos, y advierte cuando no pueda resolverse o no esté permitida.
  </Accordion>
  <Accordion title="7. Reparación de la imagen del entorno aislado">
    Cuando el aislamiento está habilitado, doctor comprueba las imágenes de Docker y ofrece compilarlas o cambiar a nombres heredados si falta la imagen actual.
  </Accordion>
  <Accordion title="7b. Limpieza de instalaciones de plugins">
    En el modo `openclaw doctor --fix` / `openclaw doctor --repair`, doctor elimina el estado heredado de preparación de dependencias de plugins generado por OpenClaw: raíces de dependencias generadas obsoletas, directorios antiguos de las etapas de instalación, residuos locales de paquetes procedentes de código anterior de reparación de dependencias de plugins incluidos y copias npm administradas huérfanas o recuperadas de plugins `@openclaw/*` incluidos que puedan ocultar el manifiesto incluido actual. Doctor también vuelve a enlazar el paquete `openclaw` del host dentro de los plugins npm administrados que declaran `peerDependencies.openclaw`, para que las importaciones locales del entorno de ejecución del paquete, como `openclaw/plugin-sdk/*`, sigan resolviéndose después de actualizaciones o reparaciones de npm.

    Doctor también puede reinstalar plugins descargables que falten cuando la configuración hace referencia a ellos, pero el registro local de plugins no puede encontrarlos (`plugins.entries` con contenido, configuración de canales/proveedores/búsqueda y entornos de ejecución de agentes configurados). Durante las actualizaciones de paquetes, doctor evita reinstalar paquetes de plugins mientras se sustituye el paquete principal; ejecute de nuevo `openclaw doctor --fix` después de la actualización si un plugin configurado todavía necesita recuperarse. Fuera de la excepción de inicio de imágenes de contenedor que se describe a continuación, el inicio del gateway y la recarga de la configuración no ejecutan reparaciones de paquetes; las instalaciones de plugins siguen siendo tareas explícitas de doctor, instalación o actualización.

    El inicio del gateway en contenedores tiene una excepción limitada para actualizaciones: cuando `openclaw gateway run` se inicia con una nueva versión de OpenClaw, ejecuta migraciones de estado seguras y la convergencia existente de plugins posterior a la actualización del núcleo antes de quedar listo; después, registra un punto de control por versión. Esta pasada de inicio puede limpiar registros obsoletos de plugins incluidos, reparar enlaces locales de plugins, reinstalar paquetes de plugins configurados cuando lo requiera la ruta de convergencia y comprobar las cargas útiles de los plugins activos. Si el inicio no puede realizar la reparación de forma segura, ejecute una vez la misma imagen con `openclaw doctor --fix` sobre el mismo estado y la misma configuración montados antes de reiniciar el contenedor normalmente.

  </Accordion>
  <Accordion title="8. Migraciones del servicio del gateway y sugerencias de limpieza">
    Doctor detecta servicios heredados del gateway (launchd/systemd/schtasks) y ofrece eliminarlos e instalar el servicio de OpenClaw con el puerto actual del gateway. También puede buscar otros servicios similares al gateway e imprimir sugerencias de limpieza. Los servicios del gateway de OpenClaw con nombre de perfil se consideran de primera clase y no se señalan como «adicionales».

    En Linux, si falta el servicio del gateway en el nivel de usuario, pero existe un servicio del gateway de OpenClaw en el nivel del sistema, doctor no instala automáticamente un segundo servicio en el nivel de usuario. Inspeccione la situación con `openclaw gateway status --deep` o `openclaw doctor --deep`; después, elimine el duplicado o establezca `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando un supervisor del sistema controle el ciclo de vida del gateway.

  </Accordion>
  <Accordion title="8b. Migración de Matrix durante el inicio">
    Cuando una cuenta de canal de Matrix tiene pendiente una migración de estado heredado o existe una migración aplicable, doctor (en el modo `--fix` / `--repair`) crea una instantánea previa a la migración y después ejecuta, con el máximo esfuerzo posible, los pasos de migración: la migración del estado heredado de Matrix y la preparación del estado cifrado heredado. Ninguno de los dos pasos es fatal; los errores se registran y el inicio continúa. En el modo de solo lectura (`openclaw doctor` sin `--fix`), esta comprobación se omite por completo.
  </Accordion>
  <Accordion title="8c. Emparejamiento de dispositivos y desviaciones de autenticación">
    Doctor inspecciona el estado de emparejamiento de dispositivos como parte de la comprobación normal de estado e informa de:

    - solicitudes pendientes de emparejamiento inicial
    - mejoras pendientes de rol o ámbito para dispositivos ya emparejados
    - reparaciones de discordancias de claves públicas cuando el identificador del dispositivo todavía coincide, pero la identidad del dispositivo ya no coincide con el registro aprobado
    - registros emparejados a los que les falta un token activo para un rol aprobado
    - tokens emparejados cuyos ámbitos se desvían de la referencia de emparejamiento aprobada
    - entradas locales almacenadas en caché de tokens de dispositivo para la máquina actual que son anteriores a una rotación del token en el gateway o contienen metadatos de ámbito obsoletos

    Doctor no aprueba automáticamente las solicitudes de emparejamiento ni rota automáticamente los tokens de dispositivo. Imprime los pasos siguientes exactos:

    - inspeccionar las solicitudes pendientes con `openclaw devices list`
    - aprobar la solicitud exacta con `openclaw devices approve <requestId>`
    - rotar un token nuevo con `openclaw devices rotate --device <deviceId> --role <role>`
    - eliminar y volver a aprobar un registro obsoleto con `openclaw devices remove <deviceId>`

    Esto distingue el emparejamiento inicial de las mejoras pendientes de rol o ámbito y de las desviaciones de tokens obsoletos o de la identidad del dispositivo, lo que soluciona el problema frecuente de que «el dispositivo ya está emparejado, pero sigue apareciendo el aviso de emparejamiento obligatorio».

  </Accordion>
  <Accordion title="9. Advertencias de seguridad">
    Doctor muestra advertencias cuando un proveedor está abierto a mensajes directos sin una lista de permitidos o cuando una política está configurada de forma peligrosa.
  </Accordion>
  <Accordion title="10. Permanencia de systemd (Linux)">
    Si se ejecuta como un servicio de usuario de systemd, doctor se asegura de que la permanencia esté habilitada para que el gateway siga activo después de cerrar la sesión.
  </Accordion>
  <Accordion title="11. Estado del espacio de trabajo (Skills, plugins y TaskFlows)">
    Doctor imprime un resumen del estado del espacio de trabajo del agente predeterminado:

    - **Estado de Skills**: cuenta las Skills aptas, las que no cumplen requisitos y las bloqueadas por la lista de permitidos.
    - **Estado de los plugins**: cuenta los plugins habilitados, deshabilitados y con errores; enumera los identificadores de los plugins que tengan errores e informa de las capacidades de los plugins del paquete.
    - **Advertencias de compatibilidad de plugins**: señala los plugins que tienen problemas de compatibilidad con el entorno de ejecución actual.
    - **Diagnósticos de plugins**: muestra las advertencias o los errores emitidos por el registro de plugins durante la carga.
    - **Recuperación de TaskFlow**: muestra los TaskFlows administrados sospechosos que requieren inspección manual o cancelación.

  </Accordion>
  <Accordion title="11b. Tamaño de los archivos de arranque">
    Doctor comprueba si los archivos de arranque del espacio de trabajo (por ejemplo, `AGENTS.md`, `CLAUDE.md` u otros archivos de contexto insertados) están cerca del límite de caracteres configurado o lo superan. Informa, por archivo, de los recuentos de caracteres sin procesar frente a los insertados, el porcentaje de truncamiento, su causa (`max/file` o `max/total`) y el total de caracteres insertados como fracción del límite total. Cuando los archivos están truncados o cerca del límite, doctor imprime consejos para ajustar `agents.defaults.bootstrapMaxChars` y `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Autocompletado del shell">
    Doctor comprueba si el autocompletado mediante tabulación está instalado para el shell actual (zsh, bash, fish o PowerShell):

    - Si el perfil del shell utiliza un patrón lento de autocompletado dinámico (`source <(openclaw completion ...)`), doctor lo actualiza a la variante más rápida basada en un archivo almacenado en caché.
    - Si el autocompletado está configurado en el perfil, pero falta el archivo de caché, doctor vuelve a generar la caché automáticamente.
    - Si el autocompletado no está configurado, doctor solicita instalarlo (solo en el modo interactivo; se omite con `--non-interactive`).

    Ejecute `openclaw completion --write-state` para volver a generar la caché manualmente.

  </Accordion>
  <Accordion title="11d. Limpieza de plugins de canales obsoletos">
    Cuando `openclaw doctor --fix` elimina un plugin de canal que falta, también elimina la configuración huérfana del ámbito del canal que hacía referencia a ese plugin: entradas `channels.<id>`, destinos de Heartbeat que nombraban el canal y anulaciones `agents.*.models["<channel>/*"]`. Esto evita bucles de arranque del Gateway en los que el entorno de ejecución del canal ya no existe, pero la configuración todavía solicita al gateway que se vincule a él.
  </Accordion>
  <Accordion title="12. Comprobaciones de autenticación del Gateway (token local)">
    Doctor comprueba que la autenticación mediante token del gateway local esté preparada.

    - Si el modo de token requiere uno y no existe ninguna fuente de tokens, doctor ofrece generar uno.
    - Si `gateway.auth.token` está administrado mediante SecretRef, pero no está disponible, doctor advierte de ello y no lo sobrescribe con texto sin formato.
    - `openclaw doctor --generate-gateway-token` fuerza la generación solo cuando no hay ningún SecretRef de token configurado.

  </Accordion>
  <Accordion title="12b. Reparaciones de solo lectura compatibles con SecretRef">
    Algunos flujos de reparación necesitan inspeccionar las credenciales configuradas sin debilitar el comportamiento de fallo rápido del entorno de ejecución.

    - `openclaw doctor --fix` usa el mismo modelo de resumen de SecretRef de solo lectura que los comandos de la familia de estado para reparaciones específicas de la configuración.
    - Ejemplo: la reparación de `@username` de `allowFrom` / `groupAllowFrom` de Telegram intenta usar las credenciales del bot configuradas cuando están disponibles.
    - Si el token del bot de Telegram está configurado mediante SecretRef, pero no está disponible en la ruta del comando actual, doctor informa que la credencial está configurada pero no disponible y omite la resolución automática en lugar de bloquearse o indicar erróneamente que falta el token.

  </Accordion>
  <Accordion title="13. Comprobación de estado y reinicio del Gateway">
    Doctor ejecuta una comprobación de estado y ofrece reiniciar el Gateway cuando parece presentar problemas.
  </Accordion>
  <Accordion title="13b. Preparación de la búsqueda en memoria">
    Doctor comprueba si el proveedor de embeddings configurado para la búsqueda en memoria está listo para el agente predeterminado. El comportamiento depende del backend y del proveedor configurados:

    - **Backend QMD**: comprueba si el binario `qmd` está disponible y puede iniciarse. Si no es así, muestra instrucciones para corregirlo, incluido `npm install -g @tobilu/qmd` (o el equivalente de Bun), y una opción para especificar manualmente la ruta del binario.
    - **Proveedor local explícito**: comprueba si existe un archivo de modelo local o una URL reconocida de un modelo remoto o descargable. Si falta, sugiere cambiar a un proveedor remoto.
    - **Proveedor remoto explícito** (`openai`, `voyage`, etc.): verifica que haya una clave de API en el entorno o en el almacén de autenticación. Si falta, muestra sugerencias prácticas para corregirlo.
    - **Proveedor automático heredado**: trata `memorySearch.provider: "auto"` como OpenAI, comprueba la preparación de OpenAI y `doctor --fix` lo reescribe como `provider: "openai"`.

    Cuando hay disponible un resultado almacenado en caché de la comprobación del Gateway (el Gateway estaba en buen estado en el momento de la comprobación), doctor contrasta su resultado con la configuración visible desde la CLI e indica cualquier discrepancia. Doctor no inicia una nueva comprobación de embeddings en la ruta predeterminada; use el comando de estado profundo de la memoria cuando desee realizar una comprobación en vivo del proveedor.

    Use `openclaw memory status --deep` para verificar la preparación de los embeddings en tiempo de ejecución.

  </Accordion>
  <Accordion title="14. Advertencias de estado de los canales">
    Si el Gateway está en buen estado, doctor ejecuta una comprobación del estado de los canales e informa de las advertencias con correcciones sugeridas.
  </Accordion>
  <Accordion title="15. Auditoría y reparación de la configuración del supervisor">
    Doctor comprueba si faltan valores predeterminados o están desactualizados en la configuración del supervisor instalada (launchd/systemd/schtasks), por ejemplo, las dependencias de red activa y el retraso de reinicio de systemd. Cuando detecta una discrepancia, recomienda una actualización y puede reescribir el archivo de servicio o la tarea con los valores predeterminados actuales.

    Notas:

    - `openclaw doctor` solicita confirmación antes de reescribir la configuración del supervisor.
    - `openclaw doctor --yes` acepta las solicitudes de reparación predeterminadas.
    - `openclaw doctor --fix` aplica las correcciones recomendadas sin solicitar confirmación (`--repair` es un alias).
    - `openclaw doctor --fix --force` sobrescribe las configuraciones personalizadas del supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor en modo de solo lectura para el ciclo de vida del servicio del Gateway. Sigue informando del estado del servicio y ejecuta reparaciones no relacionadas con el servicio, pero omite la instalación, el inicio, el reinicio y el arranque inicial del servicio, la reescritura de la configuración del supervisor y la limpieza de servicios heredados, porque un supervisor externo gestiona ese ciclo de vida.
    - En Linux, doctor no reescribe los metadatos del comando o del punto de entrada mientras la unidad systemd correspondiente del Gateway está activa. También ignora las unidades adicionales inactivas similares al Gateway que no sean heredadas durante la búsqueda de servicios duplicados, para que los archivos de servicios complementarios no generen avisos de limpieza innecesarios.
    - Si la autenticación por token requiere un token y `gateway.auth.token` está gestionado mediante SecretRef, la instalación o reparación del servicio mediante doctor valida la SecretRef, pero no conserva los valores resueltos del token en texto sin formato en los metadatos del entorno del servicio del supervisor.
    - Doctor detecta los valores del entorno del servicio gestionados mediante `.env` o SecretRef que las instalaciones anteriores de LaunchAgent, systemd o las tareas programadas de Windows incorporaron en línea, y reescribe los metadatos del servicio para que esos valores se carguen desde la fuente de tiempo de ejecución en lugar de la definición del supervisor.
    - Doctor detecta cuando el comando del servicio sigue fijando un valor antiguo de `--port` después de que cambie `gateway.port` y reescribe los metadatos del servicio para usar el puerto actual.
    - Si la autenticación por token requiere un token y la SecretRef configurada para el token no se puede resolver, doctor bloquea la ruta de instalación o reparación y proporciona instrucciones prácticas.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, doctor bloquea la instalación o reparación hasta que se defina explícitamente el modo.
    - Para las unidades systemd de usuario en Linux, las comprobaciones de divergencia de tokens de doctor incluyen tanto las fuentes `Environment=` como `EnvironmentFile=` al comparar los metadatos de autenticación del servicio.
    - Las reparaciones de servicios de doctor se niegan a reescribir, detener o reiniciar un servicio del Gateway desde un binario anterior de OpenClaw cuando una versión más reciente escribió la configuración por última vez. Consulte [Solución de problemas del Gateway](/es/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Siempre puede forzar una reescritura completa mediante `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos del tiempo de ejecución y del puerto del Gateway">
    Doctor inspecciona el tiempo de ejecución del servicio (PID y estado de la última salida) y advierte cuando el servicio está instalado, pero no se está ejecutando realmente. También comprueba si hay conflictos de puertos en el puerto del Gateway (el predeterminado es `18789`) e informa de las causas probables (el Gateway ya está en ejecución o hay un túnel SSH).
  </Accordion>
  <Accordion title="17. Prácticas recomendadas para el tiempo de ejecución del Gateway">
    Doctor advierte cuando el servicio del Gateway se ejecuta en Bun o desde una ruta de Node gestionada por un administrador de versiones (`nvm`, `fnm`, `volta`, `asdf`, etc.). Los canales de WhatsApp y Telegram requieren Node, y las rutas de administradores de versiones pueden dejar de funcionar después de las actualizaciones porque el servicio no carga la inicialización del shell. Doctor ofrece migrar a una instalación de Node del sistema cuando está disponible (Homebrew/apt/choco).

    Los LaunchAgents de macOS recién instalados o reparados usan una PATH canónica del sistema (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) en lugar de copiar la PATH del shell interactivo, de modo que los binarios del sistema gestionados por Homebrew siguen disponibles, mientras que los directorios de Volta, asdf, fnm, pnpm y otros administradores de versiones no cambian qué procesos secundarios de Node se resuelven. Los servicios de Linux siguen conservando raíces de entorno explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) y directorios estables de binarios de usuario, pero los directorios alternativos inferidos de administradores de versiones solo se escriben en la PATH del servicio cuando existen en el disco.

  </Accordion>
  <Accordion title="18. Escritura de la configuración y metadatos del asistente">
    Doctor conserva los cambios de configuración y registra metadatos del asistente para dejar constancia de la ejecución de doctor.
  </Accordion>
  <Accordion title="19. Consejos sobre el espacio de trabajo (copia de seguridad y sistema de memoria)">
    Doctor sugiere un sistema de memoria para el espacio de trabajo cuando falta y muestra un consejo sobre copias de seguridad si el espacio de trabajo todavía no está gestionado mediante git.

    Consulte [/concepts/agent-workspace](/es/concepts/agent-workspace) para obtener una guía completa sobre la estructura del espacio de trabajo y las copias de seguridad con git (se recomienda un repositorio privado de GitHub o GitLab).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Manual de operaciones del Gateway](/es/gateway)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
