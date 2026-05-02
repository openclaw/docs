---
read_when:
    - Añadir o modificar migraciones de doctor
    - Introducción de cambios incompatibles en la configuración
sidebarTitle: Doctor
summary: 'Comando doctor: comprobaciones de estado, migraciones de configuración y pasos de reparación'
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-02T20:47:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 504cf06e8457315eb1df4970a877b88fdc2e32f34974ce789875373e9e030234
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` es la herramienta de reparación y migración de OpenClaw. Corrige configuración/estado obsoletos, comprueba el estado y proporciona pasos de reparación accionables.

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
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Aplica las reparaciones recomendadas sin preguntar (reparaciones y reinicios cuando sea seguro).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Aplica también reparaciones agresivas (sobrescribe configuraciones personalizadas del supervisor).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Se ejecuta sin indicaciones y solo aplica migraciones seguras (normalización de configuración y movimientos de estado en disco). Omite acciones de reinicio/servicio/sandbox que requieren confirmación humana. Las migraciones de estado heredado se ejecutan automáticamente cuando se detectan.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Escanea los servicios del sistema en busca de instalaciones adicionales de Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Si quieres revisar los cambios antes de escribir, abre primero el archivo de configuración:

```bash
cat ~/.openclaw/openclaw.json
```

## Qué hace (resumen)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - Actualización previa opcional para instalaciones desde git (solo interactiva).
    - Comprobación de frescura del protocolo de la UI (recompila Control UI cuando el esquema del protocolo es más reciente).
    - Comprobación de estado e indicación de reinicio.
    - Resumen de estado de Skills (elegibles/faltantes/bloqueadas) y estado de plugins.

  </Accordion>
  <Accordion title="Config and migrations">
    - Normalización de configuración para valores heredados.
    - Migración de configuración de Talk desde campos planos heredados `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Comprobaciones de migración del navegador para configuraciones heredadas de la extensión de Chrome y preparación de Chrome MCP.
    - Advertencias de sobrescritura del proveedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Advertencias de solapamiento de Codex OAuth (`models.providers.openai-codex`).
    - Comprobación de requisitos previos de TLS para perfiles de OAuth de OpenAI Codex.
    - Advertencias de lista de permitidos de Plugin/herramientas cuando `plugins.allow` es restrictivo pero la política de herramientas aún pide comodines o herramientas propiedad de plugins.
    - Migración de estado heredado en disco (sesiones/directorio de agente/autenticación de WhatsApp).
    - Migración de claves heredadas del contrato del manifiesto de Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migración del almacén Cron heredado (`jobId`, `schedule.cron`, campos de entrega/carga útil de nivel superior, carga útil `provider`, tareas de respaldo simples de Webhook `notify: true`).
    - Migración heredada de la política de tiempo de ejecución del agente a `agents.defaults.agentRuntime` y `agents.list[].agentRuntime`.
    - Limpieza de configuración obsoleta de plugins cuando los plugins están habilitados; cuando `plugins.enabled=false`, las referencias obsoletas a plugins se tratan como configuración de contención inerte y se conservan.

  </Accordion>
  <Accordion title="State and integrity">
    - Inspección de archivos de bloqueo de sesión y limpieza de bloqueos obsoletos.
    - Reparación de transcripciones de sesión para ramas duplicadas de reescritura de prompts creadas por compilaciones afectadas de 2026.4.24.
    - Detección de lápidas de recuperación de reinicio de subagentes bloqueados, con compatibilidad de `--fix` para borrar marcas obsoletas de recuperación abortada para que el inicio no siga tratando al hijo como abortado por reinicio.
    - Comprobaciones de integridad y permisos de estado (sesiones, transcripciones, directorio de estado).
    - Comprobaciones de permisos del archivo de configuración (chmod 600) al ejecutarse localmente.
    - Estado de autenticación de modelos: comprueba la expiración de OAuth, puede renovar tokens próximos a expirar e informa estados de enfriamiento/deshabilitación de perfiles de autenticación.
    - Detección de directorio de espacio de trabajo adicional (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Reparación de imagen de sandbox cuando el sandbox está habilitado.
    - Migración de servicio heredado y detección de Gateways adicionales.
    - Migración de estado heredado del canal Matrix (en modo `--fix` / `--repair`).
    - Comprobaciones de tiempo de ejecución de Gateway (servicio instalado pero no en ejecución; etiqueta launchd almacenada en caché).
    - Advertencias de estado de canales (sondeadas desde el Gateway en ejecución).
    - Auditoría de configuración del supervisor (launchd/systemd/schtasks) con reparación opcional.
    - Limpieza del entorno de proxy incrustado para servicios de Gateway que capturaron valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante la instalación o actualización.
    - Comprobaciones de mejores prácticas del tiempo de ejecución de Gateway (Node frente a Bun, rutas de administradores de versiones).
    - Diagnóstico de colisiones de puerto de Gateway (predeterminado `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Advertencias de seguridad para políticas de DM abiertas.
    - Comprobaciones de autenticación de Gateway para el modo de token local (ofrece generación de token cuando no existe una fuente de token; no sobrescribe configuraciones SecretRef de token).
    - Detección de problemas de emparejamiento de dispositivos (solicitudes pendientes de primer emparejamiento, actualizaciones pendientes de rol/alcance, deriva obsoleta de caché local de token de dispositivo y deriva de autenticación de registros emparejados).

  </Accordion>
  <Accordion title="Workspace and shell">
    - Comprobación de systemd linger en Linux.
    - Comprobación de tamaño de archivos de arranque del espacio de trabajo (advertencias de truncamiento/casi límite para archivos de contexto).
    - Comprobación de preparación de Skills para el agente predeterminado; informa Skills permitidas con bins, entorno, configuración o requisitos del sistema operativo faltantes, y `--fix` puede deshabilitar Skills no disponibles en `skills.entries`.
    - Comprobación del estado de autocompletado de shell e instalación/actualización automática.
    - Comprobación de preparación del proveedor de embeddings de búsqueda de memoria (modelo local, clave de API remota o binario QMD).
    - Comprobaciones de instalación desde código fuente (desajuste del espacio de trabajo pnpm, recursos de UI faltantes, binario tsx faltante).
    - Escribe la configuración actualizada y los metadatos del asistente.

  </Accordion>
</AccordionGroup>

## Relleno y restablecimiento de la UI de Dreams

La escena Dreams de Control UI incluye las acciones **Backfill**, **Reset** y **Clear Grounded** para el flujo de trabajo de dreaming fundamentado. Estas acciones usan métodos RPC de estilo doctor de Gateway, pero **no** forman parte de la reparación/migración de CLI de `openclaw doctor`.

Qué hacen:

- **Backfill** escanea archivos históricos `memory/YYYY-MM-DD.md` en el espacio de trabajo activo, ejecuta la pasada del diario REM fundamentado y escribe entradas de relleno reversibles en `DREAMS.md`.
- **Reset** elimina solo esas entradas marcadas de diario de relleno de `DREAMS.md`.
- **Clear Grounded** elimina solo entradas temporales de corto plazo, preparadas y solo fundamentadas, que provienen de la repetición histórica y todavía no han acumulado recuperación en vivo ni soporte diario.

Qué **no** hacen por sí mismas:

- no editan `MEMORY.md`
- no ejecutan migraciones completas de doctor
- no preparan automáticamente candidatos fundamentados en el almacén activo de promoción de corto plazo a menos que ejecutes explícitamente primero la ruta preparada de CLI

Si quieres que la repetición histórica fundamentada influya en la ruta normal de promoción profunda, usa en su lugar el flujo de CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Eso prepara candidatos duraderos fundamentados en el almacén de dreaming de corto plazo y mantiene `DREAMS.md` como superficie de revisión.

## Comportamiento detallado y justificación

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    Si esto es un checkout de git y doctor se ejecuta de forma interactiva, ofrece actualizar (fetch/rebase/build) antes de ejecutar doctor.
  </Accordion>
  <Accordion title="1. Config normalization">
    Si la configuración contiene formas de valor heredadas (por ejemplo `messages.ackReaction` sin una sobrescritura específica del canal), doctor las normaliza al esquema actual.

    Eso incluye campos planos heredados de Talk. La configuración pública actual de Talk es `talk.provider` + `talk.providers.<provider>`. Doctor reescribe las formas antiguas `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` en el mapa de proveedores.

    Doctor también advierte cuando `plugins.allow` no está vacío y la política de herramientas usa
    entradas de comodín o de herramientas propiedad de plugins. `tools.allow: ["*"]` solo coincide con herramientas
    de plugins que realmente cargan; no omite la lista exclusiva de permitidos de plugins.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    Cuando la configuración contiene claves obsoletas, otros comandos se niegan a ejecutarse y te piden ejecutar `openclaw doctor`.

    Doctor hará lo siguiente:

    - Explicar qué claves heredadas se encontraron.
    - Mostrar la migración que aplicó.
    - Reescribir `~/.openclaw/openclaw.json` con el esquema actualizado.

    El Gateway también ejecuta automáticamente las migraciones de doctor al iniciar cuando detecta un formato de configuración heredado, de modo que las configuraciones obsoletas se reparan sin intervención manual. Las migraciones del almacén de tareas Cron se gestionan mediante `openclaw doctor --fix`.

    Migraciones actuales:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` de nivel superior
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` heredados → `talk.provider` + `talk.providers.<provider>`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` y `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` y `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` y `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` y `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Para los canales con `accounts` con nombre, pero con valores de canal de nivel superior de cuenta única persistentes, mueve esos valores con ámbito de cuenta a la cuenta promovida elegida para ese canal (`accounts.default` para la mayoría de los canales; Matrix puede conservar un destino con nombre/predeterminado coincidente existente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - elimina `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` para tiempos de espera de proveedor/modelo lentos
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - elimina `browser.relayBindHost` (configuración heredada de retransmisión de extensión)
    - `models.providers.*.api: "openai"` heredado → `"openai-completions"` (el inicio del Gateway también omite proveedores cuyo `api` está establecido en un valor de enumeración futuro o desconocido en lugar de fallar de forma cerrada)

    Las advertencias de doctor también incluyen orientación sobre cuentas predeterminadas para canales con varias cuentas:

    - Si se configuran dos o más entradas de `channels.<channel>.accounts` sin `channels.<channel>.defaultAccount` ni `accounts.default`, doctor advierte que el enrutamiento de reserva puede elegir una cuenta inesperada.
    - Si `channels.<channel>.defaultAccount` está establecido en un ID de cuenta desconocido, doctor advierte y enumera los ID de cuenta configurados.

  </Accordion>
  <Accordion title="2b. Sobrescrituras de proveedores de OpenCode">
    Si agregaste `models.providers.opencode`, `opencode-zen` u `opencode-go` manualmente, esto sobrescribe el catálogo integrado de OpenCode de `@mariozechner/pi-ai`. Eso puede forzar modelos a usar la API incorrecta o poner los costos en cero. Doctor advierte para que puedas eliminar la sobrescritura y restaurar el enrutamiento de API y los costos por modelo.
  </Accordion>
  <Accordion title="2c. Migración del navegador y preparación de Chrome MCP">
    Si tu configuración del navegador todavía apunta a la ruta eliminada de la extensión de Chrome, doctor la normaliza al modelo actual de conexión Chrome MCP local del host:

    - `browser.profiles.*.driver: "extension"` se convierte en `"existing-session"`
    - `browser.relayBindHost` se elimina

    Doctor también audita la ruta de Chrome MCP local del host cuando usas `defaultProfile: "user"` o un perfil `existing-session` configurado:

    - comprueba si Google Chrome está instalado en el mismo host para perfiles de conexión automática predeterminados
    - comprueba la versión de Chrome detectada y advierte cuando es anterior a Chrome 144
    - te recuerda habilitar la depuración remota en la página de inspección del navegador (por ejemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor no puede habilitar por ti la configuración del lado de Chrome. Chrome MCP local del host todavía requiere:

    - un navegador basado en Chromium 144+ en el host del Gateway/Node
    - el navegador ejecutándose localmente
    - depuración remota habilitada en ese navegador
    - aprobar la primera solicitud de consentimiento de conexión en el navegador

    La preparación aquí solo trata sobre los requisitos previos de conexión local. Existing-session conserva los límites actuales de rutas de Chrome MCP; las rutas avanzadas como `responsebody`, exportación a PDF, interceptación de descargas y acciones por lotes todavía requieren un navegador administrado o un perfil CDP sin procesar.

    Esta comprobación **no** se aplica a Docker, sandbox, remote-browser ni otros flujos sin interfaz gráfica. Esos siguen usando CDP sin procesar.

  </Accordion>
  <Accordion title="2d. Requisitos previos de TLS para OAuth">
    Cuando se configura un perfil OAuth de OpenAI Codex, doctor sondea el endpoint de autorización de OpenAI para verificar que la pila TLS local de Node/OpenSSL pueda validar la cadena de certificados. Si el sondeo falla con un error de certificado (por ejemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado caducado o certificado autofirmado), doctor imprime orientación de corrección específica de la plataforma. En macOS con un Node de Homebrew, la corrección suele ser `brew postinstall ca-certificates`. Con `--deep`, el sondeo se ejecuta incluso si el Gateway está en buen estado.
  </Accordion>
  <Accordion title="2e. Sobrescrituras de proveedor OAuth de Codex">
    Si antes agregaste configuraciones heredadas de transporte de OpenAI bajo `models.providers.openai-codex`, pueden eclipsar la ruta integrada de proveedor OAuth de Codex que las versiones más nuevas usan automáticamente. Doctor advierte cuando ve esas configuraciones de transporte antiguas junto a Codex OAuth para que puedas eliminar o reescribir la sobrescritura de transporte obsoleta y recuperar el comportamiento integrado de enrutamiento/reserva. Los proxies personalizados y las sobrescrituras solo de encabezados siguen siendo compatibles y no activan esta advertencia.
  </Accordion>
  <Accordion title="2f. Advertencias de rutas del Plugin Codex">
    Cuando el Plugin Codex incluido está habilitado, doctor también comprueba si las referencias de modelo principal `openai-codex/*` todavía se resuelven mediante el ejecutor predeterminado PI. Esa combinación es válida cuando quieres autenticación OAuth/suscripción de Codex mediante PI, pero es fácil confundirla con el arnés nativo de servidor de aplicaciones de Codex. Doctor advierte y señala la forma explícita de servidor de aplicaciones: `openai/*` más `agentRuntime.id: "codex"` u `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor no repara esto automáticamente porque ambas rutas son válidas:

    - `openai-codex/*` + PI significa “usar autenticación OAuth/suscripción de Codex mediante el ejecutor normal de OpenClaw”.
    - `openai/*` + `agentRuntime.id: "codex"` significa “ejecutar el turno integrado mediante el servidor de aplicaciones nativo de Codex”.
    - `/codex ...` significa “controlar o vincular una conversación nativa de Codex desde el chat”.
    - `/acp ...` o `runtime: "acp"` significa “usar el adaptador ACP/acpx externo”.

    Si aparece la advertencia, elige la ruta que pretendías y edita la configuración manualmente. Mantén la advertencia tal cual cuando PI Codex OAuth sea intencional.

  </Accordion>
  <Accordion title="3. Migraciones de estado heredado (diseño en disco)">
    Doctor puede migrar diseños antiguos en disco a la estructura actual:

    - Almacén de sesiones + transcripciones:
      - de `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directorio de agente:
      - de `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticación de WhatsApp (Baileys):
      - desde `~/.openclaw/credentials/*.json` heredados (excepto `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de cuenta predeterminado: `default`)

    Estas migraciones son de mejor esfuerzo e idempotentes; doctor emitirá advertencias cuando deje carpetas heredadas como copias de seguridad. El Gateway/CLI también migra automáticamente el almacén de sesiones heredado y el directorio del agente al iniciar, para que el historial/la autenticación/los modelos queden en la ruta por agente sin ejecutar doctor manualmente. La autenticación de WhatsApp se migra intencionalmente solo mediante `openclaw doctor`. La normalización del proveedor/mapa de proveedores de Talk ahora compara por igualdad estructural, por lo que las diferencias solo de orden de claves ya no activan cambios repetidos sin efecto de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migraciones de manifiestos de Plugin heredados">
    Doctor escanea todos los manifiestos de Plugin instalados en busca de claves de capacidad de nivel superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Cuando las encuentra, ofrece moverlas al objeto `contracts` y reescribir el archivo de manifiesto in situ. Esta migración es idempotente; si la clave `contracts` ya tiene los mismos valores, la clave heredada se elimina sin duplicar los datos.
  </Accordion>
  <Accordion title="3b. Migraciones de almacén Cron heredado">
    Doctor también comprueba el almacén de trabajos cron (`~/.openclaw/cron/jobs.json` de forma predeterminada, o `cron.store` cuando se sobrescribe) en busca de formas antiguas de trabajo que el planificador todavía acepta por compatibilidad.

    Las limpiezas actuales de Cron incluyen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de payload de nivel superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nivel superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de entrega `provider` de payload → `delivery.channel` explícito
    - trabajos simples heredados de reserva de Webhook con `notify: true` → `delivery.mode="webhook"` explícito con `delivery.to=cron.webhook`

    Doctor solo migra automáticamente trabajos `notify: true` cuando puede hacerlo sin cambiar el comportamiento. Si un trabajo combina la reserva de notificación heredada con un modo de entrega no Webhook existente, doctor advierte y deja ese trabajo para revisión manual.

    En Linux, doctor también advierte cuando la crontab del usuario todavía invoca `~/.openclaw/bin/ensure-whatsapp.sh` heredado. Ese script local del host no está mantenido por el OpenClaw actual y puede escribir mensajes falsos de `Gateway inactive` en `~/.openclaw/logs/whatsapp-health.log` cuando cron no puede alcanzar el bus de usuario de systemd. Elimina la entrada obsoleta de crontab con `crontab -e`; usa `openclaw channels status --probe`, `openclaw doctor` y `openclaw gateway status` para las comprobaciones de estado actuales.

  </Accordion>
  <Accordion title="3c. Limpieza de bloqueos de sesión">
    Doctor escanea cada directorio de sesión de agente en busca de archivos de bloqueo de escritura obsoletos: archivos que quedaron cuando una sesión terminó de forma anómala. Por cada archivo de bloqueo encontrado informa: la ruta, el PID, si el PID sigue activo, la antigüedad del bloqueo y si se considera obsoleto (PID muerto o más antiguo que 30 minutos). En modo `--fix` / `--repair`, elimina automáticamente los archivos de bloqueo obsoletos; de lo contrario, imprime una nota y te indica que vuelvas a ejecutarlo con `--fix`.
  </Accordion>
  <Accordion title="3d. Reparación de ramas de transcripción de sesión">
    Doctor escanea los archivos JSONL de sesión de agente en busca de la forma de rama duplicada creada por el error de reescritura de transcripciones de prompts de 2026.4.24: un turno de usuario abandonado con contexto interno de runtime de OpenClaw y un hermano activo que contiene el mismo prompt de usuario visible. En modo `--fix` / `--repair`, doctor hace una copia de seguridad de cada archivo afectado junto al original y reescribe la transcripción a la rama activa para que el historial del gateway y los lectores de memoria ya no vean turnos duplicados.
  </Accordion>
  <Accordion title="4. Comprobaciones de integridad de estado (persistencia de sesión, enrutamiento y seguridad)">
    El directorio de estado es el tronco operativo. Si desaparece, pierdes sesiones, credenciales, registros y configuración (a menos que tengas copias de seguridad en otro lugar).

    Doctor comprueba:

    - **Directorio de estado ausente**: advierte sobre una pérdida catastrófica de estado, solicita recrear el directorio y te recuerda que no puede recuperar datos ausentes.
    - **Permisos del directorio de estado**: verifica que se pueda escribir; ofrece reparar permisos (y emite una sugerencia de `chown` cuando detecta una discrepancia de propietario/grupo).
    - **Directorio de estado sincronizado con la nube en macOS**: advierte cuando el estado se resuelve bajo iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...` porque las rutas respaldadas por sincronización pueden causar E/S más lenta y carreras de bloqueo/sincronización.
    - **Directorio de estado en SD o eMMC en Linux**: advierte cuando el estado se resuelve en un origen de montaje `mmcblk*`, porque la E/S aleatoria respaldada por SD o eMMC puede ser más lenta y desgastarse más rápido con escrituras de sesión y credenciales.
    - **Directorios de sesión ausentes**: `sessions/` y el directorio del almacén de sesiones son necesarios para conservar el historial y evitar bloqueos `ENOENT`.
    - **Discrepancia de transcripción**: advierte cuando entradas recientes de sesión tienen archivos de transcripción ausentes.
    - **Sesión principal "JSONL de 1 línea"**: marca cuando la transcripción principal tiene solo una línea (el historial no se está acumulando).
    - **Múltiples directorios de estado**: advierte cuando existen varias carpetas `~/.openclaw` en directorios personales o cuando `OPENCLAW_STATE_DIR` apunta a otro lugar (el historial puede dividirse entre instalaciones).
    - **Recordatorio de modo remoto**: si `gateway.mode=remote`, doctor te recuerda ejecutarlo en el host remoto (el estado vive allí).
    - **Permisos del archivo de configuración**: advierte si `~/.openclaw/openclaw.json` es legible por grupo/todos y ofrece restringirlo a `600`.

  </Accordion>
  <Accordion title="5. Salud de autenticación de modelos (caducidad de OAuth)">
    Doctor inspecciona los perfiles OAuth en el almacén de autenticación, advierte cuando los tokens están por caducar o han caducado, y puede actualizarlos cuando es seguro. Si el perfil OAuth/token de Anthropic está obsoleto, sugiere una clave de API de Anthropic o la ruta de token de configuración de Anthropic. Las solicitudes de actualización solo aparecen cuando se ejecuta de forma interactiva (TTY); `--non-interactive` omite los intentos de actualización.

    Cuando una actualización OAuth falla permanentemente (por ejemplo `refresh_token_reused`, `invalid_grant` o un proveedor que te indica iniciar sesión de nuevo), doctor informa que se requiere volver a autenticarse e imprime el comando exacto `openclaw models auth login --provider ...` que debes ejecutar.

    Doctor también informa perfiles de autenticación que no se pueden usar temporalmente debido a:

    - periodos de espera cortos (límites de tasa/tiempos de espera/fallos de autenticación)
    - desactivaciones más largas (fallos de facturación/crédito)

  </Accordion>
  <Accordion title="6. Validación del modelo de hooks">
    Si `hooks.gmail.model` está configurado, doctor valida la referencia del modelo con el catálogo y la lista de permitidos, y advierte cuando no se resolverá o no está permitido.
  </Accordion>
  <Accordion title="7. Reparación de imagen de sandbox">
    Cuando el sandbox está habilitado, doctor comprueba las imágenes de Docker y ofrece compilarlas o cambiar a nombres heredados si falta la imagen actual.
  </Accordion>
  <Accordion title="7b. Limpieza de instalación de Plugin">
    Doctor elimina el estado heredado de staging de dependencias de Plugin generado por OpenClaw en modo `openclaw doctor --fix` / `openclaw doctor --repair`. Esto cubre raíces de dependencias generadas obsoletas, antiguos directorios de etapa de instalación y restos locales del paquete de código anterior de reparación de dependencias de Plugins incluidos.

    Doctor también puede reinstalar Plugins descargables configurados cuando la configuración los referencia pero el registro local de Plugins no puede encontrarlos. Para la externalización de Plugins incluidos de 2026.5.2, doctor instala automáticamente los Plugins descargables que la configuración existente ya usa y luego depende de `meta.lastTouchedVersion` para ejecutar esa pasada de versión solo una vez. El arranque del Gateway y la recarga de configuración no ejecutan gestores de paquetes; las instalaciones de Plugins siguen siendo trabajo explícito de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migraciones de servicio Gateway y sugerencias de limpieza">
    Doctor detecta servicios Gateway heredados (launchd/systemd/schtasks) y ofrece eliminarlos e instalar el servicio de OpenClaw usando el puerto actual del Gateway. También puede escanear servicios adicionales similares a Gateway e imprimir sugerencias de limpieza. Los servicios Gateway de OpenClaw con nombre de perfil se consideran de primera clase y no se marcan como "adicionales".

    En Linux, si falta el servicio Gateway de nivel de usuario pero existe un servicio Gateway de OpenClaw de nivel de sistema, doctor no instala automáticamente un segundo servicio de nivel de usuario. Inspecciona con `openclaw gateway status --deep` o `openclaw doctor --deep`, luego elimina el duplicado o configura `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando un supervisor del sistema posee el ciclo de vida del Gateway.

  </Accordion>
  <Accordion title="8b. Migración de inicio de Matrix">
    Cuando una cuenta de canal Matrix tiene una migración de estado heredada pendiente o accionable, doctor (en modo `--fix` / `--repair`) crea una instantánea previa a la migración y luego ejecuta los pasos de migración de mejor esfuerzo: migración de estado heredado de Matrix y preparación de estado cifrado heredado. Ambos pasos no son fatales; los errores se registran y el inicio continúa. En modo de solo lectura (`openclaw doctor` sin `--fix`) esta comprobación se omite por completo.
  </Accordion>
  <Accordion title="8c. Emparejamiento de dispositivos y deriva de autenticación">
    Doctor ahora inspecciona el estado de emparejamiento de dispositivos como parte de la pasada normal de salud.

    Lo que informa:

    - solicitudes de emparejamiento inicial pendientes
    - actualizaciones de rol pendientes para dispositivos ya emparejados
    - actualizaciones de alcance pendientes para dispositivos ya emparejados
    - reparaciones de discrepancia de clave pública donde el id del dispositivo todavía coincide, pero la identidad del dispositivo ya no coincide con el registro aprobado
    - registros emparejados sin un token activo para un rol aprobado
    - tokens emparejados cuyos alcances se desvían de la referencia de emparejamiento aprobada
    - entradas locales en caché de token de dispositivo para la máquina actual anteriores a una rotación de token del lado del Gateway o con metadatos de alcance obsoletos

    Doctor no aprueba automáticamente solicitudes de emparejamiento ni rota automáticamente tokens de dispositivo. En su lugar, imprime los pasos siguientes exactos:

    - inspecciona las solicitudes pendientes con `openclaw devices list`
    - aprueba la solicitud exacta con `openclaw devices approve <requestId>`
    - rota un token nuevo con `openclaw devices rotate --device <deviceId> --role <role>`
    - elimina y vuelve a aprobar un registro obsoleto con `openclaw devices remove <deviceId>`

    Esto cierra el hueco común de "ya emparejado, pero sigue apareciendo que se requiere emparejamiento": doctor ahora distingue el emparejamiento inicial de las actualizaciones pendientes de rol/alcance y de la desviación de token obsoleto/identidad del dispositivo.

  </Accordion>
  <Accordion title="9. Advertencias de seguridad">
    Doctor emite advertencias cuando un proveedor está abierto a mensajes directos sin una lista de permitidos, o cuando una política está configurada de forma peligrosa.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Si se ejecuta como un servicio de usuario de systemd, doctor se asegura de que la permanencia esté habilitada para que el Gateway siga activo después de cerrar sesión.
  </Accordion>
  <Accordion title="11. Estado del espacio de trabajo (Skills, plugins y directorios heredados)">
    Doctor imprime un resumen del estado del espacio de trabajo para el agente predeterminado:

    - **Estado de Skills**: cuenta Skills aptas, con requisitos faltantes y bloqueadas por lista de permitidos.
    - **Directorios heredados del espacio de trabajo**: advierte cuando `~/openclaw` u otros directorios heredados del espacio de trabajo existen junto al espacio de trabajo actual.
    - **Estado de Plugin**: cuenta plugins habilitados/deshabilitados/con errores; enumera los ID de Plugin para cualquier error; informa las capacidades de los plugins de paquete.
    - **Advertencias de compatibilidad de Plugin**: marca plugins que tienen problemas de compatibilidad con el runtime actual.
    - **Diagnósticos de Plugin**: muestra cualquier advertencia o error de tiempo de carga emitido por el registro de plugins.

  </Accordion>
  <Accordion title="11b. Tamaño del archivo de arranque">
    El diagnóstico comprueba si los archivos de arranque del espacio de trabajo (por ejemplo `AGENTS.md`, `CLAUDE.md` u otros archivos de contexto inyectados) están cerca o por encima del presupuesto de caracteres configurado. Informa los recuentos de caracteres sin procesar frente a los inyectados por archivo, el porcentaje de truncamiento, la causa del truncamiento (`max/file` o `max/total`) y el total de caracteres inyectados como fracción del presupuesto total. Cuando los archivos se truncan o están cerca del límite, el diagnóstico imprime consejos para ajustar `agents.defaults.bootstrapMaxChars` y `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpieza de Plugins de canal obsoletos">
    Cuando `openclaw doctor --fix` elimina un Plugin de canal faltante, también elimina la configuración colgante con ámbito de canal que hacía referencia a ese Plugin: entradas `channels.<id>`, destinos de Heartbeat que nombraban el canal y anulaciones `agents.*.models["<channel>/*"]`. Esto evita bucles de arranque del Gateway en los que el entorno de ejecución del canal ya no existe, pero la configuración aún le pide al gateway que se vincule a él.
  </Accordion>
  <Accordion title="11c. Autocompletado de shell">
    El diagnóstico comprueba si el autocompletado con tabulación está instalado para la shell actual (zsh, bash, fish o PowerShell):

    - Si el perfil de shell usa un patrón de finalización dinámica lento (`source <(openclaw completion ...)`), doctor lo actualiza a la variante más rápida de archivo en caché.
    - Si la finalización está configurada en el perfil pero falta el archivo de caché, doctor regenera la caché automáticamente.
    - Si no hay ninguna finalización configurada, doctor solicita instalarla (solo en modo interactivo; se omite con `--non-interactive`).

    Ejecuta `openclaw completion --write-state` para regenerar la caché manualmente.

  </Accordion>
  <Accordion title="12. Comprobaciones de autenticación del Gateway (token local)">
    Doctor comprueba la preparación de la autenticación con token local del Gateway.

    - Si el modo de token necesita un token y no existe ninguna fuente de token, el diagnóstico ofrece generar uno.
    - Si `gateway.auth.token` está gestionado por SecretRef pero no está disponible, el diagnóstico advierte y no lo sobrescribe con texto plano.
    - `openclaw doctor --generate-gateway-token` fuerza la generación solo cuando no hay ningún SecretRef de token configurado.

  </Accordion>
  <Accordion title="12b. Read-only SecretRef-aware repairs">
    Algunos flujos de reparación necesitan inspeccionar las credenciales configuradas sin debilitar el comportamiento de fallo rápido del runtime.

    - `openclaw doctor --fix` ahora usa el mismo modelo de resumen de SecretRef de solo lectura que los comandos de la familia de estado para reparaciones de configuración específicas.
    - Ejemplo: la reparación de `allowFrom` / `groupAllowFrom` `@username` de Telegram intenta usar las credenciales de bot configuradas cuando están disponibles.
    - Si el token del bot de Telegram está configurado mediante SecretRef pero no está disponible en la ruta del comando actual, doctor informa que la credencial está configurada pero no disponible y omite la resolución automática en lugar de bloquearse o informar erróneamente que falta el token.

  </Accordion>
  <Accordion title="13. Comprobación de estado del Gateway + reinicio">
    Doctor ejecuta una comprobación de estado y ofrece reiniciar el Gateway cuando parece no estar en buen estado.
  </Accordion>
  <Accordion title="13b. Preparación de la búsqueda de memoria">
    Doctor comprueba si el proveedor de embeddings de búsqueda de memoria configurado está listo para el agente predeterminado. El comportamiento depende del backend y el proveedor configurados:

    - **Backend QMD**: prueba si el binario `qmd` está disponible y se puede iniciar. Si no, imprime orientación de corrección que incluye el paquete npm y una opción de ruta manual al binario.
    - **Proveedor local explícito**: comprueba si hay un archivo de modelo local o una URL de modelo remota/descargable reconocida. Si falta, sugiere cambiar a un proveedor remoto.
    - **Proveedor remoto explícito** (`openai`, `voyage`, etc.): verifica que haya una clave de API presente en el entorno o en el almacén de autenticación. Imprime sugerencias de corrección accionables si falta.
    - **Proveedor automático**: comprueba primero la disponibilidad del modelo local y luego prueba cada proveedor remoto en el orden de selección automática.

    Cuando hay disponible un resultado de prueba del Gateway en caché (el Gateway estaba en buen estado en el momento de la comprobación), doctor contrasta su resultado con la configuración visible para la CLI y señala cualquier discrepancia. Doctor no inicia un ping de embedding nuevo en la ruta predeterminada; usa el comando profundo de estado de memoria cuando quieras una comprobación en vivo del proveedor.

    Usa `openclaw memory status --deep` para verificar la preparación de embeddings en tiempo de ejecución.

  </Accordion>
  <Accordion title="14. Advertencias de estado del canal">
    Si el Gateway está en buen estado, doctor ejecuta una prueba de estado del canal e informa advertencias con correcciones sugeridas.
  </Accordion>
  <Accordion title="15. Auditoría + reparación de la configuración del supervisor">
    Doctor comprueba la configuración instalada del supervisor (launchd/systemd/schtasks) para detectar valores predeterminados faltantes u obsoletos (por ejemplo, dependencias network-online de systemd y retardo de reinicio). Cuando encuentra una discrepancia, recomienda una actualización y puede reescribir el archivo de servicio/tarea con los valores predeterminados actuales.

    Notas:

    - `openclaw doctor` solicita confirmación antes de reescribir la configuración del supervisor.
    - `openclaw doctor --yes` acepta las solicitudes de reparación predeterminadas.
    - `openclaw doctor --repair` aplica las correcciones recomendadas sin solicitudes.
    - `openclaw doctor --repair --force` sobrescribe configuraciones personalizadas del supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor en modo de solo lectura para el ciclo de vida del servicio del Gateway. Sigue informando el estado del servicio y ejecutando reparaciones que no son del servicio, pero omite la instalación/inicio/reinicio/bootstrap del servicio, las reescrituras de configuración del supervisor y la limpieza de servicios heredados porque un supervisor externo posee ese ciclo de vida.
    - En Linux, doctor no reescribe metadatos de comando/punto de entrada mientras la unidad systemd del Gateway correspondiente está activa. También ignora unidades adicionales inactivas no heredadas parecidas a Gateway durante el análisis de servicios duplicados para que los archivos de servicio acompañantes no generen ruido de limpieza.
    - Si la autenticación por token requiere un token y `gateway.auth.token` está administrado por SecretRef, la instalación/reparación del servicio de doctor valida el SecretRef pero no conserva los valores de token en texto plano resueltos dentro de los metadatos de entorno del servicio del supervisor.
    - Doctor detecta valores de entorno de servicio administrados respaldados por `.env`/SecretRef que instalaciones anteriores de LaunchAgent, systemd o Windows Scheduled Task incrustaron en línea, y reescribe los metadatos del servicio para que esos valores se carguen desde la fuente de tiempo de ejecución en lugar de la definición del supervisor.
    - Doctor detecta cuando el comando del servicio todavía fija un `--port` antiguo después de cambios en `gateway.port` y reescribe los metadatos del servicio al puerto actual.
    - Si la autenticación por token requiere un token y el SecretRef de token configurado no se puede resolver, doctor bloquea la ruta de instalación/reparación con orientación accionable.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, doctor bloquea la instalación/reparación hasta que el modo se establezca explícitamente.
    - Para unidades user-systemd de Linux, las comprobaciones de deriva de token de doctor ahora incluyen tanto fuentes `Environment=` como `EnvironmentFile=` al comparar metadatos de autenticación del servicio.
    - Las reparaciones del servicio de Doctor se niegan a reescribir, detener o reiniciar un servicio de Gateway desde un binario anterior de OpenClaw cuando la configuración fue escrita por última vez por una versión más nueva. Consulta [Solución de problemas del Gateway](/es/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Siempre puedes forzar una reescritura completa mediante `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos de tiempo de ejecución + puerto del Gateway">
    Doctor inspecciona el tiempo de ejecución del servicio (PID, último estado de salida) y advierte cuando el servicio está instalado pero no se está ejecutando realmente. También comprueba colisiones de puerto en el puerto del Gateway (predeterminado `18789`) e informa causas probables (Gateway ya en ejecución, túnel SSH).
  </Accordion>
  <Accordion title="17. Mejores prácticas de tiempo de ejecución del Gateway">
    Doctor advierte cuando el servicio de Gateway se ejecuta en Bun o en una ruta de Node administrada por versiones (`nvm`, `fnm`, `volta`, `asdf`, etc.). Los canales WhatsApp + Telegram requieren Node, y las rutas de administradores de versiones pueden romperse después de actualizaciones porque el servicio no carga la inicialización de tu shell. Doctor ofrece migrar a una instalación de Node del sistema cuando está disponible (Homebrew/apt/choco).

    Los LaunchAgents de macOS recién instalados o reparados usan un PATH del sistema canónico (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) en lugar de copiar el PATH del shell interactivo, por lo que Volta, asdf, fnm, pnpm y otros directorios de administradores de versiones no cambian qué procesos secundarios de Node se resuelven. Los servicios de Linux todavía conservan raíces de entorno explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) y directorios user-bin estables, pero los directorios de reserva inferidos de administradores de versiones solo se escriben en el PATH del servicio cuando esos directorios existen en el disco.

  </Accordion>
  <Accordion title="18. Escritura de configuración + metadatos del asistente">
    Doctor conserva cualquier cambio de configuración y marca los metadatos del asistente para registrar la ejecución de doctor.
  </Accordion>
  <Accordion title="19. Consejos de espacio de trabajo (copia de seguridad + sistema de memoria)">
    Doctor sugiere un sistema de memoria del espacio de trabajo cuando falta e imprime un consejo de copia de seguridad si el espacio de trabajo aún no está bajo git.

    Consulta [/concepts/agent-workspace](/es/concepts/agent-workspace) para obtener una guía completa de la estructura del espacio de trabajo y la copia de seguridad con git (se recomienda GitHub o GitLab privado).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Runbook del Gateway](/es/gateway)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
