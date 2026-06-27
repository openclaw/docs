---
read_when:
    - Agregar o modificar migraciones de doctor
    - Presentación de cambios incompatibles en la configuración
sidebarTitle: Doctor
summary: 'Comando doctor: comprobaciones de estado, migraciones de configuración y pasos de reparación'
title: Doctor
x-i18n:
    generated_at: "2026-06-27T11:27:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdb5e3fb437a8678c427dee698a0ea6004b22b71c6e38cc6f75ba674fa4fcc5e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` es la herramienta de reparación y migración de OpenClaw. Corrige configuración/estado obsoletos, comprueba la salud y proporciona pasos de reparación accionables.

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

    Acepta los valores predeterminados sin preguntar (incluidos los pasos de reparación de reinicio/servicio/sandbox cuando corresponda).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    Aplica las reparaciones recomendadas sin preguntar (reparaciones + reinicios cuando sea seguro).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    Ejecuta comprobaciones de salud estructuradas para CI o automatización previa. Este modo es
    de solo lectura: no pregunta, repara, migra configuración, reinicia servicios ni
    toca el estado.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    También aplica reparaciones agresivas (sobrescribe configuraciones personalizadas del supervisor).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Se ejecuta sin preguntas y solo aplica migraciones seguras (normalización de configuración + movimientos de estado en disco). Omite acciones de reinicio/servicio/sandbox que requieren confirmación humana. Las migraciones de estado heredado se ejecutan automáticamente cuando se detectan.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Escanea los servicios del sistema en busca de instalaciones adicionales del gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Si quieres revisar los cambios antes de escribir, abre primero el archivo de configuración:

```bash
cat ~/.openclaw/openclaw.json
```

## Modo lint de solo lectura

`openclaw doctor --lint` es el equivalente apto para automatización de
`openclaw doctor --fix`. Ambos usan las comprobaciones de salud de doctor, pero su postura es
diferente:

| Modo                     | Preguntas | Escribe configuración/estado | Salida                 | Úsalo para                         |
| ------------------------ | --------- | ---------------------------- | ---------------------- | ---------------------------------- |
| `openclaw doctor`        | sí        | no                           | informe de salud claro | una persona comprobando el estado  |
| `openclaw doctor --fix`  | a veces   | sí, con política de reparación | registro de reparación claro | aplicar reparaciones aprobadas |
| `openclaw doctor --lint` | no        | no                           | hallazgos estructurados | CI, comprobaciones previas y puertas de revisión |

Las comprobaciones de salud modernizadas pueden proporcionar una implementación opcional de `repair()`.
`doctor --fix` aplica esas reparaciones cuando existen y sigue usando el
flujo de reparación existente de doctor para las comprobaciones que aún no han migrado.
El contrato de reparación estructurado también separa el informe de reparación de la detección:
`detect()` informa los hallazgos actuales, mientras que `repair()` puede informar cambios,
diferencias de configuración/archivos y efectos secundarios que no son de archivo. Eso mantiene abierta la ruta de migración
para futuros `doctor --fix --dry-run` y salida de diferencias sin hacer que las comprobaciones lint
planifiquen mutaciones.

Ejemplos:

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

La salida JSON incluye:

- `ok`: si algún hallazgo visible cumplió el umbral de gravedad seleccionado
- `checksRun`: número de comprobaciones de salud ejecutadas
- `checksSkipped`: comprobaciones omitidas por el perfil seleccionado, `--only` o `--skip`
- `findings`: diagnósticos estructurados con `checkId`, `severity`, `message` y
  `path`, `line`, `column`, `ocPath` y `fixHint` opcionales

Códigos de salida:

- `0`: no hay hallazgos en el umbral seleccionado o por encima de él
- `1`: uno o más hallazgos cumplieron el umbral seleccionado
- `2`: fallo de comando/runtime antes de que pudieran emitirse hallazgos de lint

Usa `--severity-min info|warning|error` para controlar tanto lo que se imprime como lo que
provoca una salida lint distinta de cero. Usa `--all` para ejecutar el inventario lint completo,
incluidas comprobaciones más profundas de inclusión explícita excluidas del conjunto de automatización predeterminado. Usa `--only <id>` para puertas previas acotadas y
`--skip <id>` para excluir temporalmente una comprobación ruidosa mientras mantienes activo el resto de la
ejecución lint.
Las opciones de salida lint como `--json`, `--severity-min`, `--all`, `--only` y
`--skip` deben combinarse con `--lint`; las ejecuciones normales de doctor y reparación las rechazan.

## Qué hace (resumen)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - Actualización previa opcional para instalaciones git (solo interactivo).
    - Comprobación de frescura del protocolo de UI (recompila Control UI cuando el esquema de protocolo es más reciente).
    - Comprobación de salud + solicitud de reinicio.
    - Resumen de estado de Skills (aptas/faltantes/bloqueadas) y estado de plugins.

  </Accordion>
  <Accordion title="Config and migrations">
    - Normalización de configuración para valores heredados.
    - Migración de configuración de Talk desde campos planos heredados `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Comprobaciones de migración de navegador para configuraciones heredadas de la extensión de Chrome y preparación de Chrome MCP.
    - Advertencias de anulación del proveedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Migración de proveedor/perfil heredado de OpenAI Codex (`openai-codex` → `openai`) y advertencias de sombreado para `models.providers.openai-codex` obsoleto.
    - Comprobación de requisitos previos de TLS de OAuth para perfiles OAuth de OpenAI Codex.
    - Advertencias de lista de permitidos de Plugin/herramientas cuando `plugins.allow` es restrictivo pero la política de herramientas aún pide comodín o herramientas propiedad de plugins.
    - Migración de estado heredado en disco (sesiones/directorio de agente/autenticación de WhatsApp).
    - Migración de claves heredadas del contrato de manifiesto de plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migración del almacén Cron heredado (`jobId`, `schedule.cron`, campos de entrega/carga útil de nivel superior, `provider` de carga útil, trabajos de respaldo de webhook `notify: true`).
    - Limpieza de política de runtime heredada de agente completo; la política de runtime de proveedor/modelo es el selector de ruta activo.
    - Limpieza de configuración obsoleta de plugins cuando los plugins están habilitados; cuando `plugins.enabled=false`, las referencias obsoletas de plugins se tratan como configuración de contención inerte y se conservan.

  </Accordion>
  <Accordion title="State and integrity">
    - Inspección de archivos de bloqueo de sesión y limpieza de bloqueos obsoletos.
    - Reparación de transcripciones de sesión para ramas duplicadas de reescritura de prompts creadas por compilaciones afectadas de 2026.4.24.
    - Detección de lápidas de recuperación por reinicio de subagentes bloqueados, con soporte de `--fix` para limpiar marcas de recuperación abortada obsoletas de modo que el arranque no siga tratando al proceso hijo como abortado por reinicio.
    - Comprobaciones de integridad de estado y permisos (sesiones, transcripciones, directorio de estado).
    - Comprobaciones de permisos del archivo de configuración (chmod 600) al ejecutarse localmente.
    - Salud de autenticación del modelo: comprueba la expiración de OAuth, puede actualizar tokens próximos a expirar e informa estados de enfriamiento/deshabilitación de perfiles de autenticación.

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Reparación de imagen sandbox cuando el sandboxing está habilitado.
    - Migración de servicio heredado y detección de gateways adicionales.
    - Migración de estado heredado del canal Matrix (en modo `--fix` / `--repair`).
    - Comprobaciones de runtime del Gateway (servicio instalado pero no en ejecución; etiqueta launchd en caché).
    - Advertencias de estado de canales (sondeadas desde el gateway en ejecución).
    - Las comprobaciones de permisos específicas de canal viven bajo `openclaw channels capabilities`; por ejemplo, los permisos de canal de voz de Discord se auditan con `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Comprobaciones de capacidad de respuesta de WhatsApp para salud degradada del bucle de eventos del Gateway con clientes TUI locales aún en ejecución; `--fix` detiene solo clientes TUI locales verificados.
    - Reparación de rutas de Codex para refs de modelo heredadas `openai-codex/*` en modelos primarios, respaldos, modelos de generación de imagen/video, anulaciones de heartbeat/subagente/compaction, hooks, anulaciones de modelo por canal y fijaciones de ruta de sesión; `--fix` las reescribe a `openai/*`, migra perfiles/orden de autenticación `openai-codex:*` a `openai:*`, elimina fijaciones obsoletas de runtime de sesión/agente completo y deja refs canónicas de agentes OpenAI en el harness Codex predeterminado.
    - Auditoría de configuración de supervisor (launchd/systemd/schtasks) con reparación opcional.
    - Limpieza del entorno de proxy embebido para servicios de gateway que capturaron valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante la instalación o actualización.
    - Comprobaciones de mejores prácticas del runtime del Gateway (Node frente a Bun, rutas de gestores de versión).
    - Diagnósticos de colisión de puerto del Gateway (predeterminado `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Advertencias de seguridad para políticas de DM abiertas.
    - Comprobaciones de autenticación del Gateway para modo de token local (ofrece generación de token cuando no existe una fuente de token; no sobrescribe configuraciones SecretRef de token).
    - Detección de problemas de emparejamiento de dispositivo (solicitudes pendientes de primer emparejamiento, actualizaciones pendientes de rol/alcance, deriva obsoleta de caché local de token de dispositivo y deriva de autenticación de registros emparejados).

  </Accordion>
  <Accordion title="Workspace and shell">
    - Comprobación de linger de systemd en Linux.
    - Comprobación de tamaño de archivo de bootstrap del workspace (advertencias de truncamiento/cercanía al límite para archivos de contexto).
    - Comprobación de preparación de Skills para el agente predeterminado; informa skills permitidas con requisitos faltantes de binarios, entorno, configuración o sistema operativo, y `--fix` puede deshabilitar skills no disponibles en `skills.entries`.
    - Comprobación de estado de autocompletado de shell e instalación/actualización automática.
    - Comprobación de preparación del proveedor de embeddings de búsqueda de memoria (modelo local, clave API remota o binario QMD).
    - Comprobaciones de instalación desde código fuente (desajuste de workspace pnpm, recursos de UI faltantes, binario tsx faltante).
    - Escribe configuración actualizada + metadatos del asistente.

  </Accordion>
</AccordionGroup>

## Relleno y restablecimiento de la UI de Dreams

La escena Dreams de Control UI incluye acciones **Backfill**, **Reset** y **Clear Grounded** para el flujo de dreaming grounded. Estas acciones usan métodos RPC de estilo doctor del gateway, pero **no** forman parte de la reparación/migración de la CLI `openclaw doctor`.

Qué hacen:

- **Backfill** escanea archivos históricos `memory/YYYY-MM-DD.md` en el workspace activo, ejecuta el paso de diario REM grounded y escribe entradas de relleno reversibles en `DREAMS.md`.
- **Reset** elimina solo esas entradas marcadas de diario de relleno de `DREAMS.md`.
- **Clear Grounded** elimina solo entradas preparadas de corto plazo exclusivamente grounded que provienen de reproducción histórica y aún no han acumulado recuerdo en vivo ni soporte diario.

Qué **no** hacen por sí mismas:

- no editan `MEMORY.md`
- no ejecutan migraciones doctor completas
- no preparan automáticamente candidatos grounded en el almacén de promoción de corto plazo en vivo a menos que ejecutes explícitamente primero la ruta CLI preparada

Si quieres que la reproducción histórica grounded influya en la ruta normal de promoción profunda, usa el flujo CLI en su lugar:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Eso prepara candidatos duraderos grounded en el almacén de dreaming de corto plazo mientras mantiene `DREAMS.md` como superficie de revisión.

## Comportamiento detallado y justificación

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    Si esto es un checkout git y doctor se ejecuta de forma interactiva, ofrece actualizar (fetch/rebase/build) antes de ejecutar doctor.
  </Accordion>
  <Accordion title="1. Config normalization">
    Si la configuración contiene formas de valores heredadas (por ejemplo `messages.ackReaction` sin una anulación específica de canal), doctor las normaliza al esquema actual.

    Eso incluye campos planos heredados de Talk. La configuración pública actual de voz de Talk es `talk.provider` + `talk.providers.<provider>`, y la configuración de voz en tiempo real es `talk.realtime.*`. Doctor reescribe formas antiguas `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` en el mapa de proveedores, y reescribe selectores heredados de tiempo real de nivel superior (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) en `talk.realtime`.

    Doctor también advierte cuando `plugins.allow` no está vacío y la política de herramientas usa
    comodines o entradas de herramientas propiedad de plugins. `tools.allow: ["*"]` solo coincide con herramientas
    de plugins que realmente se cargan; no omite la lista de permitidos exclusiva de plugins.

  </Accordion>
  <Accordion title="2. Migraciones de claves de configuración heredadas">
    Cuando la configuración contiene claves obsoletas, otros comandos se niegan a ejecutarse y te piden que ejecutes `openclaw doctor`.

    Doctor hará lo siguiente:

    - Explicar qué claves heredadas se encontraron.
    - Mostrar la migración que aplicó.
    - Reescribir `~/.openclaw/openclaw.json` con el esquema actualizado.

    El inicio de Gateway rechaza formatos de configuración heredados y te pide que ejecutes `openclaw doctor --fix`; no reescribe `openclaw.json` al iniciar. Las migraciones del almacén de trabajos Cron también las gestiona `openclaw doctor --fix`.

    Migraciones actuales:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - eliminar los `channels.webchat` y `gateway.webchat` retirados
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` de nivel superior
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` heredados → `talk.provider` + `talk.providers.<provider>`
    - selectores Talk en tiempo real heredados de nivel superior (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` y `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` y `messages.tts.providers.microsoft`
    - campos de selección de hablante TTS (`voice`/`voiceName`/`voiceId`) → `speakerVoice`/`speakerVoiceId`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` y `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` y `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Para canales con `accounts` con nombre pero valores de canal de nivel superior de cuenta única aún presentes, mover esos valores con ámbito de cuenta a la cuenta promovida elegida para ese canal (`accounts.default` para la mayoría de los canales; Matrix puede conservar un destino existente con nombre/predeterminado que coincida)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - eliminar `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` para tiempos de espera de proveedor/modelo lentos, y mantén el tiempo de espera del agente/ejecución por encima de ese valor cuando toda la ejecución deba durar más
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - eliminar `browser.relayBindHost` (ajuste heredado del relé de la extensión)
    - `models.providers.*.api: "openai"` heredado → `"openai-completions"` (el inicio de Gateway también omite proveedores cuyo `api` esté configurado con un valor enum futuro o desconocido en lugar de fallar cerrado)
    - eliminar `plugins.entries.codex.config.codexDynamicToolsProfile`; el servidor de aplicación Codex siempre mantiene nativas las herramientas de espacio de trabajo nativas de Codex

    Las advertencias de Doctor también incluyen orientación de cuenta predeterminada para canales con varias cuentas:

    - Si se configuran dos o más entradas `channels.<channel>.accounts` sin `channels.<channel>.defaultAccount` ni `accounts.default`, doctor advierte que el enrutamiento de reserva puede elegir una cuenta inesperada.
    - Si `channels.<channel>.defaultAccount` está configurado con un ID de cuenta desconocido, doctor advierte y enumera los IDs de cuenta configurados.

  </Accordion>
  <Accordion title="2b. Sobrescrituras de proveedor OpenCode">
    Si agregaste `models.providers.opencode`, `opencode-zen` u `opencode-go` manualmente, eso sobrescribe el catálogo OpenCode integrado de `openclaw/plugin-sdk/llm`. Eso puede forzar modelos a la API incorrecta o reducir los costos a cero. Doctor advierte para que puedas eliminar la sobrescritura y restaurar el enrutamiento de API por modelo + costos.
  </Accordion>
  <Accordion title="2c. Migración del navegador y preparación para Chrome MCP">
    Si tu configuración del navegador todavía apunta a la ruta eliminada de la extensión de Chrome, doctor la normaliza al modelo actual de conexión Chrome MCP local al host:

    - `browser.profiles.*.driver: "extension"` se convierte en `"existing-session"`
    - `browser.relayBindHost` se elimina

    Doctor también audita la ruta Chrome MCP local al host cuando usas `defaultProfile: "user"` o un perfil `existing-session` configurado:

    - comprueba si Google Chrome está instalado en el mismo host para perfiles predeterminados de conexión automática
    - comprueba la versión detectada de Chrome y advierte cuando es inferior a Chrome 144
    - te recuerda habilitar la depuración remota en la página de inspección del navegador (por ejemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor no puede habilitar por ti el ajuste del lado de Chrome. Chrome MCP local al host aún requiere:

    - un navegador basado en Chromium 144+ en el host de gateway/nodo
    - el navegador ejecutándose localmente
    - depuración remota habilitada en ese navegador
    - aprobar el primer aviso de consentimiento de conexión en el navegador

    La preparación aquí se refiere únicamente a los prerrequisitos de conexión local. Existing-session conserva los límites actuales de rutas de Chrome MCP; las rutas avanzadas como `responsebody`, exportación de PDF, interceptación de descargas y acciones por lotes aún requieren un navegador administrado o un perfil CDP sin procesar.

    Esta comprobación **no** se aplica a Docker, sandbox, remote-browser u otros flujos headless. Esos siguen usando CDP sin procesar.

  </Accordion>
  <Accordion title="2d. Prerrequisitos TLS de OAuth">
    Cuando se configura un perfil OAuth de OpenAI Codex, doctor sondea el endpoint de autorización de OpenAI para verificar que la pila TLS local de Node/OpenSSL pueda validar la cadena de certificados. Si el sondeo falla con un error de certificado (por ejemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado caducado o certificado autofirmado), doctor imprime orientación de corrección específica de la plataforma. En macOS con un Node de Homebrew, la corrección suele ser `brew postinstall ca-certificates`. Con `--deep`, el sondeo se ejecuta incluso si el gateway está sano.
  </Accordion>
  <Accordion title="2e. Sobrescrituras de proveedor OAuth de Codex">
    Si antes agregaste ajustes heredados de transporte de OpenAI bajo `models.providers.openai-codex`, pueden ocultar la ruta integrada de proveedor OAuth de Codex que las versiones más nuevas usan automáticamente. Doctor advierte cuando ve esos ajustes de transporte antiguos junto con Codex OAuth para que puedas eliminar o reescribir la sobrescritura de transporte obsoleta y recuperar el comportamiento integrado de enrutamiento/reserva. Los proxies personalizados y las sobrescrituras solo de encabezados siguen siendo compatibles y no activan esta advertencia.
  </Accordion>
  <Accordion title="2f. Reparación de rutas de Codex">
    Doctor comprueba referencias de modelo `openai-codex/*` heredadas. El enrutamiento nativo del arnés Codex usa referencias de modelo canónicas `openai/*`; los turnos de agentes de OpenAI pasan por el arnés del servidor de aplicación Codex en lugar de la ruta del proveedor OpenAI de OpenClaw.

    En modo `--fix` / `--repair`, doctor reescribe las referencias afectadas del agente predeterminado y por agente, incluidos modelos principales, reservas, modelos de generación de imágenes/video, sobrescrituras de Heartbeat/subagente/Compaction, hooks, sobrescrituras de modelo de canal y estado persistido obsoleto de ruta de sesión:

    - `openai-codex/gpt-*` se convierte en `openai/gpt-*`.
    - La intención de Codex se mueve a entradas `agentRuntime.id: "codex"` con ámbito de proveedor/modelo para referencias de modelo de agente reparadas.
    - La configuración obsoleta de runtime de agente completo y los anclajes persistidos de runtime de sesión se eliminan porque la selección de runtime tiene ámbito de proveedor/modelo.
    - La política existente de runtime de proveedor/modelo se conserva, salvo que la referencia de modelo heredada reparada necesite enrutamiento de Codex para mantener la antigua ruta de autenticación.
    - Las listas existentes de modelos de reserva se conservan con sus entradas heredadas reescritas; los ajustes copiados por modelo se mueven de la clave heredada a la clave canónica `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, avisos de reserva y anclajes de perfil de autenticación de sesiones persistidas se reparan en todos los almacenes de sesiones de agente descubiertos.
    - `/codex ...` significa "controlar o vincular una conversación nativa de Codex desde el chat".
    - `/acp ...` o `runtime: "acp"` significa "usar el adaptador ACP/acpx externo".

  </Accordion>
  <Accordion title="2g. Limpieza de rutas de sesión">
    Doctor también analiza los almacenes de sesiones de agente descubiertos en busca de estado de ruta obsoleto creado automáticamente después de mover modelos configurados o runtime fuera de una ruta propiedad de un Plugin como Codex.

    `openclaw doctor --fix` puede borrar estado obsoleto creado automáticamente, como anclajes de modelo `modelOverrideSource: "auto"`, metadatos de modelo de runtime, IDs de arnés anclados, enlaces de sesión CLI y sobrescrituras automáticas de perfil de autenticación cuando su ruta propietaria ya no está configurada. Las elecciones explícitas de usuario o de modelos de sesión heredados se informan para revisión manual y se dejan intactas; cámbialas con `/model ...`, `/new` o restablece la sesión cuando esa ruta ya no sea la prevista.

  </Accordion>
  <Accordion title="3. Migraciones de estado heredado (diseño en disco)">
    Doctor puede migrar diseños antiguos en disco a la estructura actual:

    - Almacén de sesiones + transcripciones:
      - de `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directorio de agente:
      - de `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticación de WhatsApp (Baileys):
      - de `~/.openclaw/credentials/*.json` heredado (excepto `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de cuenta predeterminado: `default`)

    Estas migraciones son de mejor esfuerzo e idempotentes; doctor emitirá advertencias cuando deje carpetas heredadas como respaldos. Gateway/CLI también migra automáticamente el almacén de sesiones heredado + directorio de agente al iniciar para que historial/autenticación/modelos terminen en la ruta por agente sin ejecutar doctor manualmente. La autenticación de WhatsApp se migra intencionalmente solo mediante `openclaw doctor`. La normalización de proveedor/mapa de proveedores de Talk ahora compara por igualdad estructural, por lo que las diferencias solo de orden de claves ya no activan cambios no operativos repetidos de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migraciones de manifiestos de plugins heredados">
    Doctor analiza todos los manifiestos de plugins instalados en busca de claves de capacidad de nivel superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Cuando las encuentra, ofrece moverlas al objeto `contracts` y reescribir el archivo de manifiesto en el mismo lugar. Esta migración es idempotente; si la clave `contracts` ya tiene los mismos valores, la clave heredada se elimina sin duplicar los datos.
  </Accordion>
  <Accordion title="3b. Migraciones del almacén de Cron heredado">
    Doctor también comprueba el almacén de trabajos de Cron (`~/.openclaw/cron/jobs.json` de forma predeterminada, o `cron.store` cuando se sobrescribe) en busca de formas de trabajos antiguas que el planificador aún acepta por compatibilidad.

    Las limpiezas actuales de Cron incluyen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos payload de nivel superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nivel superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de entrega `provider` de payload → `delivery.channel` explícito
    - trabajos de fallback Webhook heredados `notify: true` → entrega Webhook explícita desde `cron.webhook` cuando está configurado; los trabajos de anuncio conservan su entrega de chat y obtienen `delivery.completionDestination`. Cuando `cron.webhook` no está configurado, el marcador inerte de nivel superior `notify` se elimina para los trabajos sin destino (se conserva la entrega existente, incluida la de anuncio), ya que la entrega en tiempo de ejecución nunca lo lee

    El Gateway también sanea las filas de Cron malformadas en el momento de la carga para que los trabajos válidos sigan ejecutándose. Las filas sin procesar malformadas se copian en `jobs-quarantine.json` junto al almacén activo antes de eliminarse de `jobs.json`; doctor informa las filas en cuarentena para que puedas revisarlas o repararlas manualmente.

    El inicio del Gateway normaliza la proyección de tiempo de ejecución e ignora el marcador de nivel superior `notify`, pero deja la configuración persistida de Cron para la reparación de doctor. Cuando `cron.webhook` no está configurado, doctor elimina el marcador inerte para trabajos sin destino de migración (`delivery.mode` ninguno/ausente, un destino Webhook inutilizable o una entrega existente de anuncio/chat), dejando intacta la entrega existente, por lo que las ejecuciones repetidas de `doctor --fix` ya no vuelven a advertir sobre el mismo trabajo. Si `cron.webhook` está configurado pero no es una URL HTTP(S) válida, doctor sigue advirtiendo y deja el marcador para que puedas corregir la URL.

    En Linux, doctor también advierte cuando el crontab del usuario todavía invoca el `~/.openclaw/bin/ensure-whatsapp.sh` heredado. Ese script local del host no está mantenido por el OpenClaw actual y puede escribir mensajes falsos de `Gateway inactive` en `~/.openclaw/logs/whatsapp-health.log` cuando Cron no puede alcanzar el bus de usuario de systemd. Elimina la entrada obsoleta del crontab con `crontab -e`; usa `openclaw channels status --probe`, `openclaw doctor` y `openclaw gateway status` para las comprobaciones de estado actuales.

  </Accordion>
  <Accordion title="3c. Limpieza de bloqueos de sesión">
    Doctor analiza cada directorio de sesión de agente en busca de archivos de bloqueo de escritura obsoletos: archivos que quedaron atrás cuando una sesión terminó de forma anómala. Por cada archivo de bloqueo encontrado, informa: la ruta, el PID, si el PID sigue activo, la antigüedad del bloqueo y si se considera obsoleto (PID muerto, metadatos de propietario malformados, más de 30 minutos de antigüedad o un PID activo que puede demostrarse que pertenece a un proceso que no es de OpenClaw). En modo `--fix` / `--repair`, elimina automáticamente los bloqueos con propietarios muertos, huérfanos, reciclados, malformados-antiguos o que no son de OpenClaw. Los bloqueos antiguos que aún pertenecen a un proceso de OpenClaw activo se informan, pero se dejan en su lugar para que doctor no interrumpa un escritor de transcripciones activo.
  </Accordion>
  <Accordion title="3d. Reparación de ramas de transcripción de sesión">
    Doctor analiza los archivos JSONL de sesión de agente en busca de la forma de rama duplicada creada por el error de reescritura de transcripciones de prompts de 2026.4.24: un turno de usuario abandonado con contexto de tiempo de ejecución interno de OpenClaw más un hermano activo que contiene el mismo prompt visible del usuario. En modo `--fix` / `--repair`, doctor hace una copia de seguridad de cada archivo afectado junto al original y reescribe la transcripción a la rama activa para que el historial del Gateway y los lectores de memoria ya no vean turnos duplicados.
  </Accordion>
  <Accordion title="4. Comprobaciones de integridad de estado (persistencia de sesión, enrutamiento y seguridad)">
    El directorio de estado es el tronco encefálico operativo. Si desaparece, pierdes sesiones, credenciales, registros y configuración (a menos que tengas copias de seguridad en otro lugar).

    Doctor comprueba:

    - **Falta el directorio de estado**: advierte sobre pérdida catastrófica de estado, solicita recrear el directorio y recuerda que no puede recuperar los datos faltantes.
    - **Permisos del directorio de estado**: verifica la capacidad de escritura; ofrece reparar permisos (y emite una sugerencia de `chown` cuando se detecta una discrepancia de propietario/grupo).
    - **Directorio de estado sincronizado con la nube en macOS**: advierte cuando el estado se resuelve bajo iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...`, porque las rutas respaldadas por sincronización pueden causar E/S más lenta y carreras de bloqueo/sincronización.
    - **Directorio de estado en SD o eMMC en Linux**: advierte cuando el estado se resuelve a un origen de montaje `mmcblk*`, porque la E/S aleatoria respaldada por SD o eMMC puede ser más lenta y desgastarse más rápido con escrituras de sesión y credenciales.
    - **Directorio de estado volátil en Linux**: advierte cuando el estado se resuelve a `tmpfs` o `ramfs`, porque las sesiones, credenciales, configuración y el estado de SQLite con sus archivos acompañantes WAL/journal desaparecerán al reiniciar. Los montajes `overlay` de Docker no se marcan intencionalmente porque sus capas escribibles persisten entre reinicios del host mientras el contenedor permanece.
    - **Faltan directorios de sesión**: `sessions/` y el directorio del almacén de sesiones son necesarios para persistir el historial y evitar bloqueos `ENOENT`.
    - **Discordancia de transcripción**: advierte cuando entradas de sesión recientes tienen archivos de transcripción faltantes.
    - **Sesión principal "JSONL de 1 línea"**: marca cuando la transcripción principal tiene solo una línea (el historial no se está acumulando).
    - **Múltiples directorios de estado**: advierte cuando existen varias carpetas `~/.openclaw` entre directorios de inicio o cuando `OPENCLAW_STATE_DIR` apunta a otro lugar (el historial puede dividirse entre instalaciones).
    - **Recordatorio de modo remoto**: si `gateway.mode=remote`, doctor te recuerda ejecutarlo en el host remoto (el estado vive allí).
    - **Permisos del archivo de configuración**: advierte si `~/.openclaw/openclaw.json` es legible por grupo/todo el mundo y ofrece restringirlo a `600`.

  </Accordion>
  <Accordion title="5. Salud de autenticación de modelos (caducidad de OAuth)">
    Doctor inspecciona los perfiles de OAuth en el almacén de autenticación, advierte cuando los tokens están por caducar o han caducado, y puede actualizarlos cuando es seguro. Si el perfil OAuth/token de Anthropic está obsoleto, sugiere una clave de API de Anthropic o la ruta de token de configuración de Anthropic. Los prompts de actualización solo aparecen cuando se ejecuta de forma interactiva (TTY); `--non-interactive` omite los intentos de actualización.

    Cuando una actualización de OAuth falla permanentemente (por ejemplo, `refresh_token_reused`, `invalid_grant` o un proveedor que te indica iniciar sesión de nuevo), doctor informa que se requiere volver a autenticarse e imprime el comando exacto `openclaw models auth login --provider ...` que se debe ejecutar.

    Doctor también informa perfiles de autenticación que son temporalmente inutilizables debido a:

    - enfriamientos cortos (límites de tasa/tiempos de espera/fallos de autenticación)
    - deshabilitaciones más largas (fallos de facturación/crédito)

    Los perfiles OAuth heredados de Codex cuyos tokens viven en macOS Keychain (onboarding más antiguo anterior al diseño de archivo acompañante) solo son reparados por doctor. Ejecuta `openclaw doctor --fix` una vez desde un terminal interactivo para migrar los tokens heredados respaldados por Keychain en línea a `auth-profiles.json`; después de eso, los turnos embebidos (Telegram, Cron, despacho de subagentes) los resuelven como perfiles OAuth canónicos de OpenAI.

  </Accordion>
  <Accordion title="6. Validación del modelo de hooks">
    Si `hooks.gmail.model` está configurado, doctor valida la referencia del modelo contra el catálogo y la allowlist, y advierte cuando no se resolverá o no está permitido.
  </Accordion>
  <Accordion title="7. Reparación de imagen de sandbox">
    Cuando el sandboxing está habilitado, doctor comprueba las imágenes de Docker y ofrece compilar o cambiar a nombres heredados si falta la imagen actual.
  </Accordion>
  <Accordion title="7b. Limpieza de instalación de plugins">
    Doctor elimina el estado de preparación de dependencias de plugins generado por OpenClaw heredado en modo `openclaw doctor --fix` / `openclaw doctor --repair`. Esto cubre raíces de dependencias generadas obsoletas, directorios antiguos de etapa de instalación, residuos locales de paquete de código anterior de reparación de dependencias de plugins incluidos, y copias npm gestionadas huérfanas o recuperadas de plugins `@openclaw/*` incluidos que pueden ocultar el manifiesto incluido actual. Doctor también vuelve a enlazar el paquete `openclaw` del host en plugins npm gestionados que declaran `peerDependencies.openclaw`, para que las importaciones de tiempo de ejecución locales al paquete como `openclaw/plugin-sdk/*` sigan resolviéndose después de actualizaciones o reparaciones npm.

    Doctor también puede reinstalar plugins descargables faltantes cuando la configuración los referencia pero el registro local de plugins no puede encontrarlos. Entre los ejemplos se incluyen `plugins.entries` materiales, ajustes configurados de canal/proveedor/búsqueda y runtimes de agente configurados. Durante actualizaciones de paquete, doctor evita ejecutar la reparación de plugins del gestor de paquetes mientras se intercambia el paquete core; ejecuta `openclaw doctor --fix` de nuevo después de la actualización si un plugin configurado aún necesita recuperación. El inicio del Gateway y la recarga de configuración no ejecutan gestores de paquetes; las instalaciones de plugins siguen siendo trabajo explícito de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migraciones de servicio del Gateway y sugerencias de limpieza">
    Doctor detecta servicios de Gateway heredados (launchd/systemd/schtasks) y ofrece eliminarlos e instalar el servicio de OpenClaw usando el puerto actual del Gateway. También puede buscar servicios adicionales similares al Gateway e imprimir sugerencias de limpieza. Los servicios de Gateway de OpenClaw con nombre de perfil se consideran de primera clase y no se marcan como "extra".

    En Linux, si falta el servicio de Gateway a nivel de usuario pero existe un servicio de Gateway de OpenClaw a nivel de sistema, doctor no instala automáticamente un segundo servicio a nivel de usuario. Inspecciona con `openclaw gateway status --deep` o `openclaw doctor --deep`, luego elimina el duplicado o configura `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando un supervisor del sistema sea propietario del ciclo de vida del Gateway.

  </Accordion>
  <Accordion title="8b. Migración de inicio de Matrix">
    Cuando una cuenta de canal de Matrix tiene una migración de estado heredado pendiente o accionable, doctor (en modo `--fix` / `--repair`) crea una instantánea previa a la migración y luego ejecuta los pasos de migración de mejor esfuerzo: migración de estado heredado de Matrix y preparación de estado cifrado heredado. Ambos pasos no son fatales; los errores se registran y el inicio continúa. En modo de solo lectura (`openclaw doctor` sin `--fix`), esta comprobación se omite por completo.
  </Accordion>
  <Accordion title="8c. Emparejamiento de dispositivos y deriva de autenticación">
    Doctor ahora inspecciona el estado de emparejamiento de dispositivos como parte del pase de salud normal.

    Lo que informa:

    - solicitudes pendientes de emparejamiento por primera vez
    - actualizaciones de rol pendientes para dispositivos ya emparejados
    - actualizaciones de alcance pendientes para dispositivos ya emparejados
    - reparaciones de discordancia de clave pública donde el id del dispositivo aún coincide pero la identidad del dispositivo ya no coincide con el registro aprobado
    - registros emparejados a los que les falta un token activo para un rol aprobado
    - tokens emparejados cuyos alcances se desvían fuera de la línea base de emparejamiento aprobada
    - entradas locales en caché de token de dispositivo para la máquina actual que son anteriores a una rotación de token del lado del Gateway o llevan metadatos de alcance obsoletos

    Doctor no aprueba automáticamente solicitudes de emparejamiento ni rota automáticamente tokens de dispositivo. En su lugar, imprime los próximos pasos exactos:

    - inspecciona solicitudes pendientes con `openclaw devices list`
    - aprueba la solicitud exacta con `openclaw devices approve <requestId>`
    - rota un token nuevo con `openclaw devices rotate --device <deviceId> --role <role>`
    - elimina y vuelve a aprobar un registro obsoleto con `openclaw devices remove <deviceId>`

    Esto cierra el vacío común de "ya emparejado pero todavía recibe emparejamiento requerido": doctor ahora distingue el emparejamiento por primera vez de las actualizaciones pendientes de rol/alcance y de la deriva de token/identidad de dispositivo obsoleta.

  </Accordion>
  <Accordion title="9. Advertencias de seguridad">
    Doctor emite advertencias cuando un proveedor está abierto a MD sin una lista de permitidos, o cuando una política está configurada de forma peligrosa.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Si se ejecuta como un servicio de usuario de systemd, doctor garantiza que linger esté habilitado para que el gateway siga activo después de cerrar sesión.
  </Accordion>
  <Accordion title="11. Estado del espacio de trabajo (Skills, plugins y TaskFlows)">
    Doctor imprime un resumen del estado del espacio de trabajo para el agente predeterminado:

    - **Estado de Skills**: cuenta Skills elegibles, con requisitos faltantes y bloqueadas por lista de permitidos.
    - **Estado de Plugin**: cuenta plugins habilitados/deshabilitados/con errores; lista los ID de Plugin para cualquier error; informa las capacidades de Plugin del paquete.
    - **Advertencias de compatibilidad de Plugin**: marca plugins que tienen problemas de compatibilidad con el runtime actual.
    - **Diagnósticos de Plugin**: muestra cualquier advertencia o error en tiempo de carga emitido por el registro de Plugin.
    - **Recuperación de TaskFlow**: muestra TaskFlows administrados sospechosos que requieren inspección manual o cancelación.

  </Accordion>
  <Accordion title="11b. Tamaño del archivo de arranque">
    Doctor comprueba si los archivos de arranque del espacio de trabajo (por ejemplo `AGENTS.md`, `CLAUDE.md` u otros archivos de contexto inyectados) están cerca o por encima del presupuesto de caracteres configurado. Informa, por archivo, los recuentos de caracteres sin procesar frente a inyectados, el porcentaje de truncamiento, la causa del truncamiento (`max/file` o `max/total`) y el total de caracteres inyectados como fracción del presupuesto total. Cuando los archivos están truncados o cerca del límite, doctor imprime consejos para ajustar `agents.defaults.bootstrapMaxChars` y `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpieza de plugin de canal obsoleto">
    Cuando `openclaw doctor --fix` elimina un plugin de canal faltante, también elimina la configuración colgante con alcance de canal que hacía referencia a ese plugin: entradas `channels.<id>`, objetivos de Heartbeat que nombraban el canal y sobrescrituras `agents.*.models["<channel>/*"]`. Esto evita bucles de arranque del Gateway donde el runtime del canal ya no existe, pero la configuración todavía pide al gateway que se enlace a él.
  </Accordion>
  <Accordion title="11c. Autocompletado de shell">
    Doctor comprueba si el autocompletado con tabulador está instalado para el shell actual (zsh, bash, fish o PowerShell):

    - Si el perfil de shell usa un patrón de autocompletado dinámico lento (`source <(openclaw completion ...)`), doctor lo actualiza a la variante más rápida de archivo en caché.
    - Si el autocompletado está configurado en el perfil pero falta el archivo de caché, doctor regenera la caché automáticamente.
    - Si no hay autocompletado configurado, doctor solicita instalarlo (solo en modo interactivo; se omite con `--non-interactive`).

    Ejecuta `openclaw completion --write-state` para regenerar la caché manualmente.

  </Accordion>
  <Accordion title="12. Comprobaciones de autenticación del Gateway (token local)">
    Doctor comprueba la preparación de autenticación con token del gateway local.

    - Si el modo de token necesita un token y no existe ninguna fuente de token, doctor ofrece generar uno.
    - Si `gateway.auth.token` está administrado por SecretRef pero no está disponible, doctor advierte y no lo sobrescribe con texto sin formato.
    - `openclaw doctor --generate-gateway-token` fuerza la generación solo cuando no hay ningún SecretRef de token configurado.

  </Accordion>
  <Accordion title="12b. Reparaciones de solo lectura compatibles con SecretRef">
    Algunos flujos de reparación necesitan inspeccionar credenciales configuradas sin debilitar el comportamiento de fallo rápido del runtime.

    - `openclaw doctor --fix` ahora usa el mismo modelo de resumen de SecretRef de solo lectura que los comandos de la familia de estado para reparaciones de configuración dirigidas.
    - Ejemplo: la reparación de Telegram `allowFrom` / `groupAllowFrom` `@username` intenta usar las credenciales de bot configuradas cuando están disponibles.
    - Si el token del bot de Telegram está configurado mediante SecretRef pero no está disponible en la ruta del comando actual, doctor informa que la credencial está configurada pero no disponible y omite la resolución automática en lugar de fallar o informar erróneamente que falta el token.

  </Accordion>
  <Accordion title="13. Comprobación de salud del Gateway + reinicio">
    Doctor ejecuta una comprobación de salud y ofrece reiniciar el gateway cuando parece no saludable.
  </Accordion>
  <Accordion title="13b. Preparación de búsqueda en memoria">
    Doctor comprueba si el proveedor configurado de embeddings de búsqueda en memoria está listo para el agente predeterminado. El comportamiento depende del backend y del proveedor configurados:

    - **Backend QMD**: sondea si el binario `qmd` está disponible y se puede iniciar. Si no, imprime orientación de corrección que incluye el paquete npm y una opción de ruta manual al binario.
    - **Proveedor local explícito**: comprueba si existe un archivo de modelo local o una URL de modelo remoto/descargable reconocida. Si falta, sugiere cambiar a un proveedor remoto.
    - **Proveedor remoto explícito** (`openai`, `voyage`, etc.): verifica que haya una clave de API presente en el entorno o en el almacén de autenticación. Imprime indicaciones de corrección accionables si falta.
    - **Proveedor automático heredado**: trata `memorySearch.provider: "auto"` como OpenAI, comprueba la preparación de OpenAI, y `doctor --fix` lo reescribe como `provider: "openai"`.

    Cuando hay disponible un resultado de sondeo del gateway en caché (el gateway estaba saludable en el momento de la comprobación), doctor cruza su resultado con la configuración visible para la CLI y señala cualquier discrepancia. Doctor no inicia un ping de embedding nuevo en la ruta predeterminada; usa el comando de estado profundo de memoria cuando quieras una comprobación en vivo del proveedor.

    Usa `openclaw memory status --deep` para verificar la preparación de embeddings en runtime.

  </Accordion>
  <Accordion title="14. Advertencias de estado de canal">
    Si el gateway está saludable, doctor ejecuta un sondeo de estado de canal e informa advertencias con correcciones sugeridas.
  </Accordion>
  <Accordion title="15. Auditoría + reparación de configuración del supervisor">
    Doctor comprueba la configuración instalada del supervisor (launchd/systemd/schtasks) para detectar valores predeterminados faltantes u obsoletos (por ejemplo, dependencias de systemd network-online y demora de reinicio). Cuando encuentra una discrepancia, recomienda una actualización y puede reescribir el archivo de servicio/tarea con los valores predeterminados actuales.

    Notas:

    - `openclaw doctor` solicita confirmación antes de reescribir la configuración del supervisor.
    - `openclaw doctor --yes` acepta los avisos de reparación predeterminados.
    - `openclaw doctor --fix` aplica las correcciones recomendadas sin avisos (`--repair` es un alias).
    - `openclaw doctor --fix --force` sobrescribe configuraciones personalizadas del supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor en modo de solo lectura para el ciclo de vida del servicio del gateway. Todavía informa la salud del servicio y ejecuta reparaciones que no son de servicio, pero omite la instalación/inicio/reinicio/arranque del servicio, las reescrituras de configuración del supervisor y la limpieza de servicios heredados porque un supervisor externo es propietario de ese ciclo de vida.
    - En Linux, doctor no reescribe metadatos de comando/punto de entrada mientras la unidad systemd del gateway correspondiente está activa. También ignora unidades adicionales inactivas no heredadas parecidas a gateway durante el escaneo de servicios duplicados para que los archivos de servicios complementarios no generen ruido de limpieza.
    - Si la autenticación con token requiere un token y `gateway.auth.token` está administrado por SecretRef, la instalación/reparación del servicio de doctor valida el SecretRef pero no persiste valores de token resueltos en texto sin formato en los metadatos de entorno del servicio del supervisor.
    - Doctor detecta valores de entorno de servicio administrados respaldados por `.env`/SecretRef que instalaciones antiguas de LaunchAgent, systemd o Windows Scheduled Task incrustaron en línea, y reescribe los metadatos del servicio para que esos valores se carguen desde la fuente de runtime en lugar de la definición del supervisor.
    - Doctor detecta cuando el comando del servicio todavía fija un `--port` antiguo después de cambios en `gateway.port` y reescribe los metadatos del servicio al puerto actual.
    - Si la autenticación con token requiere un token y el SecretRef de token configurado no se resuelve, doctor bloquea la ruta de instalación/reparación con orientación accionable.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está establecido, doctor bloquea la instalación/reparación hasta que el modo se establezca explícitamente.
    - Para unidades user-systemd de Linux, las comprobaciones de deriva de token de doctor ahora incluyen tanto fuentes `Environment=` como `EnvironmentFile=` al comparar metadatos de autenticación del servicio.
    - Las reparaciones de servicio de doctor se niegan a reescribir, detener o reiniciar un servicio de gateway desde un binario de OpenClaw anterior cuando la configuración fue escrita por última vez por una versión más reciente. Consulta [Solución de problemas del Gateway](/es/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Siempre puedes forzar una reescritura completa mediante `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos de runtime + puerto del Gateway">
    Doctor inspecciona el runtime del servicio (PID, último estado de salida) y advierte cuando el servicio está instalado pero no se está ejecutando realmente. También comprueba colisiones de puerto en el puerto del gateway (predeterminado `18789`) e informa causas probables (gateway ya en ejecución, túnel SSH).
  </Accordion>
  <Accordion title="17. Buenas prácticas de runtime del Gateway">
    Doctor advierte cuando el servicio del gateway se ejecuta en Bun o en una ruta de Node administrada por versiones (`nvm`, `fnm`, `volta`, `asdf`, etc.). Los canales de WhatsApp + Telegram requieren Node, y las rutas de gestores de versiones pueden romperse después de actualizaciones porque el servicio no carga la inicialización de tu shell. Doctor ofrece migrar a una instalación del sistema de Node cuando está disponible (Homebrew/apt/choco).

    Los LaunchAgents de macOS recién instalados o reparados usan un PATH de sistema canónico (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) en lugar de copiar el PATH del shell interactivo, por lo que los binarios de sistema administrados por Homebrew siguen disponibles mientras Volta, asdf, fnm, pnpm y otros directorios de gestores de versiones no cambian qué procesos hijo de Node se resuelven. Los servicios de Linux todavía conservan raíces de entorno explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) y directorios user-bin estables, pero los directorios de respaldo inferidos de gestores de versiones solo se escriben en el PATH del servicio cuando esos directorios existen en disco.

  </Accordion>
  <Accordion title="18. Escritura de configuración + metadatos del asistente">
    Doctor persiste cualquier cambio de configuración y marca metadatos del asistente para registrar la ejecución de doctor.
  </Accordion>
  <Accordion title="19. Consejos del espacio de trabajo (copia de seguridad + sistema de memoria)">
    Doctor sugiere un sistema de memoria del espacio de trabajo cuando falta e imprime un consejo de copia de seguridad si el espacio de trabajo aún no está bajo git.

    Consulta [/concepts/agent-workspace](/es/concepts/agent-workspace) para una guía completa de la estructura del espacio de trabajo y copia de seguridad con git (se recomienda GitHub o GitLab privado).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Runbook del Gateway](/es/gateway)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
