---
read_when:
    - Añadir o modificar migraciones de doctor
    - Introducir cambios incompatibles en la configuración
sidebarTitle: Doctor
summary: 'Comando doctor: comprobaciones de estado, migraciones de configuración y pasos de reparación'
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-03T21:32:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20b2cb3c3cd88e01050cb285a08a020603642439bd35668b7414360801fc03ff
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` es la herramienta de reparación + migración de OpenClaw. Corrige configuración/estado obsoletos, comprueba el estado y proporciona pasos de reparación accionables.

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

    Acepta valores predeterminados sin solicitar confirmación (incluidos pasos de reparación de reinicio/servicio/sandbox cuando corresponda).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Aplica las reparaciones recomendadas sin solicitar confirmación (reparaciones + reinicios cuando sea seguro).

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

    Se ejecuta sin prompts y solo aplica migraciones seguras (normalización de configuración + movimientos de estado en disco). Omite acciones de reinicio/servicio/sandbox que requieren confirmación humana. Las migraciones de estado heredadas se ejecutan automáticamente cuando se detectan.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Escanea servicios del sistema en busca de instalaciones adicionales de Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Si quieres revisar los cambios antes de escribirlos, abre primero el archivo de configuración:

```bash
cat ~/.openclaw/openclaw.json
```

## Qué hace (resumen)

<AccordionGroup>
  <Accordion title="Estado, interfaz de usuario y actualizaciones">
    - Actualización previa opcional para instalaciones de git (solo interactivo).
    - Comprobación de actualización del protocolo de la interfaz de usuario (recompila Control UI cuando el esquema del protocolo es más reciente).
    - Comprobación de estado + prompt de reinicio.
    - Resumen de estado de Skills (aptas/faltantes/bloqueadas) y estado de plugins.

  </Accordion>
  <Accordion title="Configuración y migraciones">
    - Normalización de configuración para valores heredados.
    - Migración de configuración de Talk desde campos planos heredados `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Comprobaciones de migración de navegador para configuraciones heredadas de extensión de Chrome y preparación de Chrome MCP.
    - Advertencias de sobrescritura del proveedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Advertencias de sombreado de OAuth de Codex (`models.providers.openai-codex`).
    - Comprobación de requisitos previos de OAuth TLS para perfiles OAuth de OpenAI Codex.
    - Advertencias de lista de permitidos de Plugin/herramientas cuando `plugins.allow` es restrictivo pero la política de herramientas aún solicita comodín o herramientas propiedad del Plugin.
    - Migración de estado heredado en disco (sessions/directorio de agente/autenticación de WhatsApp).
    - Migración de claves heredadas del contrato de manifiesto de Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migración de almacén Cron heredado (`jobId`, `schedule.cron`, campos superiores delivery/payload, payload `provider`, trabajos Webhook de respaldo simples `notify: true`).
    - Migración heredada de política de tiempo de ejecución de agente a `agents.defaults.agentRuntime` y `agents.list[].agentRuntime`.
    - Limpieza de configuración obsoleta de Plugin cuando los plugins están habilitados; cuando `plugins.enabled=false`, las referencias obsoletas de Plugin se tratan como configuración de contención inerte y se conservan.

  </Accordion>
  <Accordion title="Estado e integridad">
    - Inspección de archivo de bloqueo de sesión y limpieza de bloqueos obsoletos.
    - Reparación de transcripciones de sesión para ramas duplicadas de reescritura de prompt creadas por compilaciones 2026.4.24 afectadas.
    - Detección de tombstone de recuperación por reinicio de subagente atascado, con soporte de `--fix` para borrar indicadores de recuperación abortada obsoletos para que el inicio no siga tratando al hijo como abortado por reinicio.
    - Comprobaciones de integridad de estado y permisos (sessions, transcripciones, directorio de estado).
    - Comprobaciones de permisos del archivo de configuración (chmod 600) al ejecutarse localmente.
    - Estado de autenticación de modelos: comprueba expiración de OAuth, puede actualizar tokens próximos a expirar e informa estados de enfriamiento/deshabilitación de perfiles de autenticación.
    - Detección de directorio de espacio de trabajo adicional (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servicios y supervisores">
    - Reparación de imagen de sandbox cuando el sandboxing está habilitado.
    - Migración de servicio heredado y detección adicional de Gateway.
    - Migración de estado heredado del canal Matrix (en modo `--fix` / `--repair`).
    - Comprobaciones de tiempo de ejecución de Gateway (servicio instalado pero no en ejecución; etiqueta launchd en caché).
    - Advertencias de estado de canal (sondeadas desde el Gateway en ejecución).
    - Auditoría de configuración de supervisor (launchd/systemd/schtasks) con reparación opcional.
    - Limpieza de entorno de proxy integrado para servicios Gateway que capturaron valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante la instalación o actualización.
    - Comprobaciones de buenas prácticas de tiempo de ejecución de Gateway (Node frente a Bun, rutas de gestores de versiones).
    - Diagnósticos de colisión de puerto de Gateway (predeterminado `18789`).

  </Accordion>
  <Accordion title="Autenticación, seguridad y emparejamiento">
    - Advertencias de seguridad para políticas de DM abiertas.
    - Comprobaciones de autenticación de Gateway para modo de token local (ofrece generación de token cuando no existe fuente de token; no sobrescribe configuraciones SecretRef de token).
    - Detección de problemas de emparejamiento de dispositivos (solicitudes pendientes de primer emparejamiento, actualizaciones pendientes de rol/alcance, deriva de caché local obsoleta de token de dispositivo y deriva de autenticación de registro emparejado).

  </Accordion>
  <Accordion title="Espacio de trabajo y shell">
    - Comprobación de linger de systemd en Linux.
    - Comprobación de tamaño del archivo de arranque del espacio de trabajo (advertencias de truncamiento/casi límite para archivos de contexto).
    - Comprobación de preparación de Skills para el agente predeterminado; informa skills permitidas con bins, env, configuración o requisitos de SO faltantes, y `--fix` puede deshabilitar skills no disponibles en `skills.entries`.
    - Comprobación de estado de completado de shell e instalación/actualización automática.
    - Comprobación de preparación del proveedor de embeddings de búsqueda de memoria (modelo local, clave de API remota o binario QMD).
    - Comprobaciones de instalación desde código fuente (discordancia de espacio de trabajo pnpm, recursos de interfaz de usuario faltantes, binario tsx faltante).
    - Escribe la configuración actualizada + metadatos del asistente.

  </Accordion>
</AccordionGroup>

## Relleno y reinicio de la interfaz Dreams

La escena Dreams de Control UI incluye acciones **Rellenar**, **Restablecer** y **Borrar Fundamentado** para el flujo de trabajo de Dreaming fundamentado. Estas acciones usan métodos RPC de estilo Gateway doctor, pero **no** forman parte de la reparación/migración de la CLI `openclaw doctor`.

Qué hacen:

- **Rellenar** escanea archivos históricos `memory/YYYY-MM-DD.md` en el espacio de trabajo activo, ejecuta el pase de diario REM fundamentado y escribe entradas de relleno reversibles en `DREAMS.md`.
- **Restablecer** elimina solo esas entradas de diario de relleno marcadas de `DREAMS.md`.
- **Borrar Fundamentado** elimina solo entradas preparadas de corto plazo exclusivamente fundamentadas que provienen de reproducción histórica y aún no han acumulado recuerdo en vivo ni soporte diario.

Qué **no** hacen por sí mismas:

- no editan `MEMORY.md`
- no ejecutan migraciones completas de doctor
- no preparan automáticamente candidatos fundamentados en el almacén de promoción de corto plazo en vivo salvo que ejecutes explícitamente primero la ruta CLI preparada

Si quieres que la reproducción histórica fundamentada influya en el carril normal de promoción profunda, usa en su lugar el flujo de CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Eso prepara candidatos fundamentados duraderos en el almacén de Dreaming de corto plazo mientras mantiene `DREAMS.md` como superficie de revisión.

## Comportamiento detallado y justificación

<AccordionGroup>
  <Accordion title="0. Actualización opcional (instalaciones de git)">
    Si esto es un checkout de git y doctor se ejecuta de forma interactiva, ofrece actualizar (fetch/rebase/build) antes de ejecutar doctor.
  </Accordion>
  <Accordion title="1. Normalización de configuración">
    Si la configuración contiene formas de valores heredadas (por ejemplo `messages.ackReaction` sin una sobrescritura específica de canal), doctor las normaliza al esquema actual.

    Eso incluye campos planos heredados de Talk. La configuración pública actual de Talk es `talk.provider` + `talk.providers.<provider>`. Doctor reescribe formas antiguas `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` en el mapa de proveedores.

    Doctor también advierte cuando `plugins.allow` no está vacío y la política de herramientas usa
    entradas de herramienta comodín o propiedad del Plugin. `tools.allow: ["*"]` solo coincide con herramientas
    de plugins que realmente cargan; no omite la lista de permitidos exclusiva de plugins.

  </Accordion>
  <Accordion title="2. Migraciones de claves de configuración heredadas">
    Cuando la configuración contiene claves obsoletas, otros comandos se niegan a ejecutarse y te piden ejecutar `openclaw doctor`.

    Doctor hará lo siguiente:

    - Explicar qué claves heredadas se encontraron.
    - Mostrar la migración que aplicó.
    - Reescribir `~/.openclaw/openclaw.json` con el esquema actualizado.

    El Gateway también ejecuta automáticamente migraciones de doctor al iniciarse cuando detecta un formato de configuración heredado, de modo que las configuraciones obsoletas se reparan sin intervención manual. Las migraciones del almacén de trabajos Cron son gestionadas por `openclaw doctor --fix`.

    Migraciones actuales:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - configuraciones de canal configurado sin política de respuesta visible → `messages.groupChat.visibleReplies: "message_tool"`
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
    - Para canales con `accounts` con nombre pero valores de canal de nivel superior de una sola cuenta persistentes, mueve esos valores con ámbito de cuenta a la cuenta promovida elegida para ese canal (`accounts.default` para la mayoría de los canales; Matrix puede conservar un destino con nombre/predeterminado coincidente existente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - elimina `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` para tiempos de espera de proveedor/modelo lentos
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - elimina `browser.relayBindHost` (configuración heredada del relay de la extensión)
    - `models.providers.*.api: "openai"` heredado → `"openai-completions"` (el inicio del Gateway también omite los proveedores cuyo `api` está configurado con un valor de enumeración futuro o desconocido, en lugar de fallar de forma cerrada)

    Las advertencias de doctor también incluyen orientación de cuenta predeterminada para canales con varias cuentas:

    - Si dos o más entradas `channels.<channel>.accounts` están configuradas sin `channels.<channel>.defaultAccount` ni `accounts.default`, doctor advierte que el enrutamiento de reserva puede elegir una cuenta inesperada.
    - Si `channels.<channel>.defaultAccount` está configurado con un ID de cuenta desconocido, doctor advierte y enumera los ID de cuenta configurados.

  </Accordion>
  <Accordion title="2b. Sustituciones del proveedor OpenCode">
    Si agregaste `models.providers.opencode`, `opencode-zen` u `opencode-go` manualmente, sustituye el catálogo integrado de OpenCode de `@mariozechner/pi-ai`. Eso puede forzar modelos a la API incorrecta o poner los costos en cero. Doctor advierte para que puedas quitar la sustitución y restaurar el enrutamiento de API + costos por modelo.
  </Accordion>
  <Accordion title="2c. Migración del navegador y preparación para Chrome MCP">
    Si tu configuración del navegador todavía apunta a la ruta eliminada de la extensión de Chrome, doctor la normaliza al modelo actual de conexión Chrome MCP host-local:

    - `browser.profiles.*.driver: "extension"` se convierte en `"existing-session"`
    - `browser.relayBindHost` se elimina

    El diagnóstico también audita la ruta MCP de Chrome local del host cuando usas `defaultProfile: "user"` o un perfil `existing-session` configurado:

    - comprueba si Google Chrome está instalado en el mismo host para los perfiles predeterminados de conexión automática
    - comprueba la versión de Chrome detectada y advierte cuando es inferior a Chrome 144
    - te recuerda que habilites la depuración remota en la página de inspección del navegador (por ejemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    El diagnóstico no puede habilitar por ti la configuración del lado de Chrome. Chrome MCP local del host sigue requiriendo:

    - un navegador basado en Chromium 144+ en el host de Gateway/Node
    - el navegador ejecutándose localmente
    - la depuración remota habilitada en ese navegador
    - aprobar el primer aviso de consentimiento de conexión en el navegador

    La preparación aquí se refiere únicamente a los requisitos previos de conexión local. Existing-session conserva los límites actuales de rutas de Chrome MCP; las rutas avanzadas como `responsebody`, la exportación a PDF, la interceptación de descargas y las acciones por lotes siguen requiriendo un navegador gestionado o un perfil CDP sin procesar.

    Esta comprobación **no** se aplica a Docker, sandbox, remote-browser ni a otros flujos sin interfaz gráfica. Estos siguen usando CDP sin procesar.

  </Accordion>
  <Accordion title="2d. Requisitos previos de OAuth TLS">
    Cuando se configura un perfil OAuth de OpenAI Codex, doctor sondea el endpoint de autorización de OpenAI para verificar que la pila TLS local de Node/OpenSSL pueda validar la cadena de certificados. Si el sondeo falla con un error de certificado (por ejemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado vencido o certificado autofirmado), doctor imprime una guía de corrección específica de la plataforma. En macOS con un Node de Homebrew, la corrección suele ser `brew postinstall ca-certificates`. Con `--deep`, el sondeo se ejecuta incluso si el Gateway está en buen estado.
  </Accordion>
  <Accordion title="2e. Invalidaciones del proveedor OAuth de Codex">
    Si antes agregaste ajustes heredados de transporte de OpenAI en `models.providers.openai-codex`, pueden eclipsar la ruta del proveedor OAuth de Codex integrado que las versiones más recientes usan automáticamente. Doctor advierte cuando ve esos ajustes de transporte antiguos junto con OAuth de Codex para que puedas eliminar o reescribir la invalidación de transporte obsoleta y recuperar el comportamiento integrado de enrutamiento/respaldo. Los proxies personalizados y las invalidaciones solo de encabezados siguen siendo compatibles y no activan esta advertencia.
  </Accordion>
  <Accordion title="2f. Advertencias de ruta del Plugin de Codex">
    Cuando el Plugin de Codex incluido está habilitado, doctor también comprueba si las referencias de modelo primario `openai-codex/*` todavía se resuelven mediante el ejecutor PI predeterminado. Esa combinación es válida cuando quieres autenticación OAuth/suscripción de Codex mediante PI, pero es fácil confundirla con el arnés nativo del servidor de aplicación de Codex. Doctor advierte y apunta a la forma explícita de servidor de aplicación: `openai/*` más `agentRuntime.id: "codex"` u `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor no repara esto automáticamente porque ambas rutas son válidas:

    - `openai-codex/*` + PI significa "usar autenticación OAuth/suscripción de Codex mediante el ejecutor normal de OpenClaw".
    - `openai/*` + `agentRuntime.id: "codex"` significa "ejecutar el turno integrado mediante el servidor de aplicación nativo de Codex".
    - `/codex ...` significa "controlar o enlazar una conversación nativa de Codex desde el chat".
    - `/acp ...` o `runtime: "acp"` significa "usar el adaptador externo ACP/acpx".

    Si aparece la advertencia, elige la ruta que pretendías y edita la configuración manualmente. Conserva la advertencia tal cual cuando OAuth de Codex mediante PI sea intencional.

  </Accordion>
  <Accordion title="3. Migraciones de estado heredado (diseño en disco)">
    Doctor puede migrar diseños en disco más antiguos a la estructura actual:

    - Almacén de sesiones + transcripciones:
      - de `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directorio del agente:
      - de `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticación de WhatsApp (Baileys):
      - de `~/.openclaw/credentials/*.json` heredado (excepto `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (id. de cuenta predeterminado: `default`)

    Estas migraciones son de esfuerzo razonable e idempotentes; doctor emitirá advertencias cuando deje carpetas heredadas como copias de seguridad. El Gateway/CLI también migra automáticamente el directorio heredado de sesiones + agente al iniciar, de modo que el historial/la autenticación/los modelos terminen en la ruta por agente sin ejecutar doctor manualmente. La autenticación de WhatsApp se migra intencionalmente solo mediante `openclaw doctor`. La normalización del proveedor/mapa de proveedores de conversación ahora compara por igualdad estructural, por lo que las diferencias solo en el orden de las claves ya no desencadenan cambios repetidos sin efecto de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migraciones de manifiestos de Plugin heredados">
    Doctor analiza todos los manifiestos de Plugin instalados en busca de claves de capacidad de nivel superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Cuando las encuentra, ofrece moverlas al objeto `contracts` y reescribir el archivo de manifiesto in situ. Esta migración es idempotente; si la clave `contracts` ya tiene los mismos valores, la clave heredada se elimina sin duplicar los datos.
  </Accordion>
  <Accordion title="3b. Migraciones de almacén Cron heredadas">
    Doctor también comprueba el almacén de trabajos Cron (`~/.openclaw/cron/jobs.json` de forma predeterminada, o `cron.store` cuando se sobrescribe) en busca de formas de trabajos antiguas que el planificador sigue aceptando por compatibilidad.

    Las limpiezas actuales de Cron incluyen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de carga útil de nivel superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nivel superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de entrega `provider` de la carga útil → `delivery.channel` explícito
    - trabajos de Webhook de reserva heredados simples con `notify: true` → `delivery.mode="webhook"` explícito con `delivery.to=cron.webhook`

    Doctor solo migra automáticamente trabajos con `notify: true` cuando puede hacerlo sin cambiar el comportamiento. Si un trabajo combina la reserva de notificación heredada con un modo de entrega no Webhook existente, doctor advierte y deja ese trabajo para revisión manual.

    En Linux, doctor también advierte cuando el crontab del usuario todavía invoca el `~/.openclaw/bin/ensure-whatsapp.sh` heredado. Ese script local del host no recibe mantenimiento en la versión actual de OpenClaw y puede escribir mensajes falsos de `Gateway inactive` en `~/.openclaw/logs/whatsapp-health.log` cuando Cron no puede alcanzar el bus de usuario de systemd. Elimina la entrada obsoleta del crontab con `crontab -e`; usa `openclaw channels status --probe`, `openclaw doctor` y `openclaw gateway status` para las comprobaciones de estado actuales.

  </Accordion>
  <Accordion title="3c. Limpieza de bloqueos de sesión">
    El comando doctor analiza cada directorio de sesión de agente en busca de archivos de bloqueo de escritura obsoletos: archivos que quedan cuando una sesión terminó de forma anómala. Por cada archivo de bloqueo encontrado informa: la ruta, el PID, si el PID sigue activo, la antigüedad del bloqueo y si se considera obsoleto (PID inactivo o más antiguo que 30 minutos). En modo `--fix` / `--repair`, elimina automáticamente los archivos de bloqueo obsoletos; de lo contrario, imprime una nota y te indica que vuelvas a ejecutarlo con `--fix`.
  </Accordion>
  <Accordion title="3d. Reparación de rama de transcripción de sesión">
    El comando doctor analiza los archivos JSONL de sesión de agente en busca de la forma de rama duplicada creada por el error de reescritura de transcripciones de prompts de 2026.4.24: un turno de usuario abandonado con contexto interno de runtime de OpenClaw más un hermano activo que contiene el mismo prompt visible del usuario. En modo `--fix` / `--repair`, doctor respalda cada archivo afectado junto al original y reescribe la transcripción a la rama activa para que el historial del Gateway y los lectores de memoria ya no vean turnos duplicados.
  </Accordion>
  <Accordion title="4. Comprobaciones de integridad del estado (persistencia de sesión, enrutamiento y seguridad)">
    El directorio de estado es el centro operativo. Si desaparece, pierdes sesiones, credenciales, registros y configuración (a menos que tengas copias de seguridad en otro lugar).

    Doctor comprueba:

    - **Falta el directorio de estado**: advierte sobre una pérdida catastrófica de estado, solicita recrear el directorio y recuerda que no puede recuperar datos faltantes.
    - **Permisos del directorio de estado**: verifica que se pueda escribir; ofrece reparar permisos (y emite una sugerencia de `chown` cuando detecta una discrepancia de propietario/grupo).
    - **Directorio de estado sincronizado con la nube en macOS**: advierte cuando el estado se resuelve bajo iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...` porque las rutas respaldadas por sincronización pueden causar E/S más lenta y carreras de bloqueo/sincronización.
    - **Directorio de estado en SD o eMMC en Linux**: advierte cuando el estado se resuelve a una fuente de montaje `mmcblk*`, porque la E/S aleatoria respaldada por SD o eMMC puede ser más lenta y desgastarse más rápido bajo escrituras de sesión y credenciales.
    - **Faltan directorios de sesión**: `sessions/` y el directorio de almacenamiento de sesiones son necesarios para persistir el historial y evitar bloqueos `ENOENT`.
    - **Discrepancia de transcripción**: advierte cuando entradas recientes de sesión tienen archivos de transcripción faltantes.
    - **Sesión principal "JSONL de 1 línea"**: marca cuando la transcripción principal tiene una sola línea (el historial no se está acumulando).
    - **Varios directorios de estado**: advierte cuando existen varias carpetas `~/.openclaw` en distintos directorios de inicio o cuando `OPENCLAW_STATE_DIR` apunta a otro lugar (el historial puede dividirse entre instalaciones).
    - **Recordatorio de modo remoto**: si `gateway.mode=remote`, doctor te recuerda ejecutarlo en el host remoto (el estado vive allí).
    - **Permisos del archivo de configuración**: advierte si `~/.openclaw/openclaw.json` es legible por grupo/todos y ofrece restringirlo a `600`.

  </Accordion>
  <Accordion title="5. Estado de autenticación de modelos (caducidad de OAuth)">
    Doctor inspecciona perfiles OAuth en el almacén de autenticación, advierte cuando los tokens están por caducar o ya caducaron, y puede actualizarlos cuando es seguro. Si el perfil OAuth/token de Anthropic está obsoleto, sugiere una clave de API de Anthropic o la ruta setup-token de Anthropic. Las solicitudes de actualización solo aparecen cuando se ejecuta de forma interactiva (TTY); `--non-interactive` omite los intentos de actualización.

    Cuando una actualización OAuth falla de forma permanente (por ejemplo `refresh_token_reused`, `invalid_grant` o un proveedor que te indica iniciar sesión de nuevo), doctor informa que se requiere volver a autenticarse e imprime el comando exacto `openclaw models auth login --provider ...` que debes ejecutar.

    Doctor también informa perfiles de autenticación que no se pueden usar temporalmente debido a:

    - enfriamientos cortos (límites de tasa/tiempos de espera/fallos de autenticación)
    - desactivaciones más largas (fallos de facturación/crédito)

  </Accordion>
  <Accordion title="6. Validación de modelo de hooks">
    Si `hooks.gmail.model` está configurado, doctor valida la referencia del modelo contra el catálogo y la lista de permitidos, y advierte cuando no se resolverá o no está permitido.
  </Accordion>
  <Accordion title="7. Reparación de imagen de sandbox">
    Cuando el sandboxing está habilitado, doctor comprueba las imágenes de Docker y ofrece compilar o cambiar a nombres heredados si falta la imagen actual.
  </Accordion>
  <Accordion title="7b. Limpieza de instalación de Plugin">
    Doctor elimina el estado heredado de preparación de dependencias de plugins generado por OpenClaw en modo `openclaw doctor --fix` / `openclaw doctor --repair`. Esto cubre raíces de dependencias generadas obsoletas, directorios antiguos de etapa de instalación y residuos locales del paquete de código anterior de reparación de dependencias de plugins incluidos.

    Doctor también puede reinstalar plugins descargables configurados cuando la configuración los referencia pero el registro local de plugins no puede encontrarlos. Para la externalización de plugins incluidos de 2026.5.2, doctor instala automáticamente plugins descargables que la configuración existente ya usa y luego se apoya en `meta.lastTouchedVersion` para ejecutar esa pasada de versión solo una vez. El arranque del Gateway y la recarga de configuración no ejecutan gestores de paquetes; las instalaciones de plugins siguen siendo trabajo explícito de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migraciones de servicio Gateway y sugerencias de limpieza">
    Doctor detecta servicios Gateway heredados (launchd/systemd/schtasks) y ofrece eliminarlos e instalar el servicio OpenClaw usando el puerto Gateway actual. También puede buscar servicios adicionales similares a Gateway e imprimir sugerencias de limpieza. Los servicios Gateway de OpenClaw con nombre de perfil se consideran de primera clase y no se marcan como "extra".

    En Linux, si falta el servicio Gateway de nivel de usuario pero existe un servicio Gateway de OpenClaw de nivel de sistema, doctor no instala automáticamente un segundo servicio de nivel de usuario. Inspecciona con `openclaw gateway status --deep` o `openclaw doctor --deep`, luego elimina el duplicado o configura `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando un supervisor de sistema es dueño del ciclo de vida del Gateway.

  </Accordion>
  <Accordion title="8b. Migración de Matrix de inicio">
    Cuando una cuenta de canal Matrix tiene una migración de estado heredada pendiente o accionable, doctor (en modo `--fix` / `--repair`) crea una instantánea previa a la migración y luego ejecuta los pasos de migración de mejor esfuerzo: migración de estado heredado de Matrix y preparación de estado cifrado heredado. Ambos pasos no son fatales; los errores se registran y el inicio continúa. En modo de solo lectura (`openclaw doctor` sin `--fix`), esta comprobación se omite por completo.
  </Accordion>
  <Accordion title="8c. Emparejamiento de dispositivos y deriva de autenticación">
    Doctor ahora inspecciona el estado de emparejamiento de dispositivos como parte de la pasada normal de estado.

    Lo que informa:

    - solicitudes pendientes de emparejamiento por primera vez
    - actualizaciones de rol pendientes para dispositivos ya emparejados
    - actualizaciones de alcance pendientes para dispositivos ya emparejados
    - reparaciones de discrepancia de clave pública donde el id del dispositivo aún coincide pero la identidad del dispositivo ya no coincide con el registro aprobado
    - registros emparejados a los que les falta un token activo para un rol aprobado
    - tokens emparejados cuyos alcances derivan fuera de la línea base de emparejamiento aprobada
    - entradas locales en caché de token de dispositivo para la máquina actual que son anteriores a una rotación de token del lado del Gateway o llevan metadatos de alcance obsoletos

    Doctor no aprueba automáticamente solicitudes de emparejamiento ni rota automáticamente tokens de dispositivo. En su lugar imprime los siguientes pasos exactos:

    - inspeccionar solicitudes pendientes con `openclaw devices list`
    - aprobar la solicitud exacta con `openclaw devices approve <requestId>`
    - rotar un token nuevo con `openclaw devices rotate --device <deviceId> --role <role>`
    - eliminar y volver a aprobar un registro obsoleto con `openclaw devices remove <deviceId>`

    Esto cierra el hueco común de "ya emparejado pero todavía aparece emparejamiento requerido": doctor ahora distingue el emparejamiento por primera vez de las actualizaciones pendientes de rol/alcance y de la deriva obsoleta de token/identidad de dispositivo.

  </Accordion>
  <Accordion title="9. Advertencias de seguridad">
    Doctor emite advertencias cuando un proveedor está abierto a mensajes directos sin una lista de permitidos, o cuando una política está configurada de forma peligrosa.
  </Accordion>
  <Accordion title="10. Persistencia systemd linger (Linux)">
    Si se ejecuta como un servicio de usuario de systemd, doctor garantiza que lingering esté habilitado para que el Gateway permanezca activo después de cerrar sesión.
  </Accordion>
  <Accordion title="11. Estado del workspace (Skills, plugins y directorios heredados)">
    Doctor imprime un resumen del estado del workspace para el agente predeterminado:

    - **Estado de Skills**: cuenta Skills aptas, con requisitos faltantes y bloqueadas por lista de permitidos.
    - **Directorios de workspace heredados**: advierte cuando `~/openclaw` u otros directorios de workspace heredados existen junto al workspace actual.
    - **Estado de Plugin**: cuenta plugins habilitados/deshabilitados/con errores; lista los IDs de plugins para cualquier error; informa capacidades de plugins del paquete.
    - **Advertencias de compatibilidad de Plugin**: marca plugins que tienen problemas de compatibilidad con el runtime actual.
    - **Diagnósticos de Plugin**: expone cualquier advertencia o error de tiempo de carga emitido por el registro de plugins.

  </Accordion>
  <Accordion title="11b. Tamaño de archivo de arranque">
    Doctor comprueba si los archivos de arranque del workspace (por ejemplo `AGENTS.md`, `CLAUDE.md` u otros archivos de contexto inyectados) están cerca o por encima del presupuesto de caracteres configurado. Informa recuentos de caracteres sin procesar frente a inyectados por archivo, porcentaje de truncamiento, causa del truncamiento (`max/file` o `max/total`) y caracteres inyectados totales como fracción del presupuesto total. Cuando los archivos se truncan o están cerca del límite, doctor imprime consejos para ajustar `agents.defaults.bootstrapMaxChars` y `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpieza de plugins de canal obsoletos">
    Cuando `openclaw doctor --fix` elimina un plugin de canal faltante, también elimina la configuración colgante con alcance de canal que hacía referencia a ese plugin: entradas `channels.<id>`, destinos de Heartbeat que nombraban el canal y sobrescrituras `agents.*.models["<channel>/*"]`. Esto evita bucles de arranque del Gateway donde el runtime del canal ya no existe pero la configuración todavía le pide al Gateway que se vincule a él.
  </Accordion>
  <Accordion title="11c. Autocompletado de shell">
    Doctor comprueba si el autocompletado con tabulación está instalado para la shell actual (zsh, bash, fish o PowerShell):

    - Si el perfil de shell usa un patrón de autocompletado dinámico lento (`source <(openclaw completion ...)`), doctor lo actualiza a la variante más rápida de archivo en caché.
    - Si el autocompletado está configurado en el perfil pero falta el archivo de caché, doctor regenera la caché automáticamente.
    - Si no hay ningún autocompletado configurado, doctor solicita instalarlo (solo en modo interactivo; se omite con `--non-interactive`).

    Ejecuta `openclaw completion --write-state` para regenerar la caché manualmente.

  </Accordion>
  <Accordion title="12. Comprobaciones de autenticación del Gateway (token local)">
    Doctor comprueba la preparación de autenticación con token del Gateway local.

    - Si el modo token necesita un token y no existe ninguna fuente de token, doctor ofrece generar uno.
    - Si `gateway.auth.token` está gestionado por SecretRef pero no está disponible, doctor advierte y no lo sobrescribe con texto plano.
    - `openclaw doctor --generate-gateway-token` fuerza la generación solo cuando no hay ningún token SecretRef configurado.

  </Accordion>
  <Accordion title="12b. Reparaciones de solo lectura conscientes de SecretRef">
    Algunos flujos de reparación necesitan inspeccionar credenciales configuradas sin debilitar el comportamiento fail-fast del runtime.

    - `openclaw doctor --fix` ahora usa el mismo modelo de resumen SecretRef de solo lectura que los comandos de la familia de estado para reparaciones de configuración dirigidas.
    - Ejemplo: la reparación de `allowFrom` / `groupAllowFrom` `@username` de Telegram intenta usar credenciales de bot configuradas cuando están disponibles.
    - Si el token del bot de Telegram está configurado mediante SecretRef pero no está disponible en la ruta del comando actual, doctor informa que la credencial está configurada pero no disponible y omite la resolución automática en lugar de fallar o informar incorrectamente que falta el token.

  </Accordion>
  <Accordion title="13. Comprobación de estado del Gateway + reinicio">
    Doctor ejecuta una comprobación de estado y ofrece reiniciar el Gateway cuando parece estar en mal estado.
  </Accordion>
  <Accordion title="13b. Preparación de la búsqueda de memoria">
    Doctor comprueba si el proveedor de incrustaciones de búsqueda de memoria configurado está listo para el agente predeterminado. El comportamiento depende del backend y del proveedor configurados:

    - **Backend QMD**: comprueba si el binario `qmd` está disponible y puede iniciarse. Si no, imprime una guía de corrección que incluye el paquete npm y una opción de ruta manual al binario.
    - **Proveedor local explícito**: comprueba si existe un archivo de modelo local o una URL de modelo remoto/descargable reconocida. Si falta, sugiere cambiar a un proveedor remoto.
    - **Proveedor remoto explícito** (`openai`, `voyage`, etc.): verifica que haya una clave de API presente en el entorno o en el almacén de autenticación. Imprime sugerencias de corrección accionables si falta.
    - **Proveedor automático**: comprueba primero la disponibilidad del modelo local y luego prueba cada proveedor remoto en el orden de selección automática.

    Cuando hay disponible un resultado de sondeo del Gateway en caché (el Gateway estaba en buen estado en el momento de la comprobación), doctor compara su resultado con la configuración visible para la CLI y señala cualquier discrepancia. Doctor no inicia un nuevo ping de incrustaciones en la ruta predeterminada; usa el comando de estado profundo de memoria cuando quieras una comprobación en vivo del proveedor.

    Usa `openclaw memory status --deep` para verificar la preparación de las incrustaciones en tiempo de ejecución.

  </Accordion>
  <Accordion title="14. Advertencias de estado del canal">
    Si el Gateway está en buen estado, doctor ejecuta un sondeo de estado del canal e informa advertencias con correcciones sugeridas.
  </Accordion>
  <Accordion title="15. Auditoría + reparación de configuración del supervisor">
    Doctor comprueba la configuración instalada del supervisor (launchd/systemd/schtasks) en busca de valores predeterminados faltantes u obsoletos (por ejemplo, dependencias network-online de systemd y demora de reinicio). Cuando encuentra una discrepancia, recomienda una actualización y puede reescribir el archivo de servicio/tarea con los valores predeterminados actuales.

    Notas:

    - `openclaw doctor` solicita confirmación antes de reescribir la configuración del supervisor.
    - `openclaw doctor --yes` acepta las solicitudes de reparación predeterminadas.
    - `openclaw doctor --repair` aplica las correcciones recomendadas sin solicitudes de confirmación.
    - `openclaw doctor --repair --force` sobrescribe configuraciones personalizadas del supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor en modo de solo lectura para el ciclo de vida del servicio del Gateway. Sigue informando el estado del servicio y ejecutando reparaciones que no son de servicio, pero omite instalación/inicio/reinicio/bootstrap del servicio, reescrituras de configuración del supervisor y limpieza de servicios heredados porque un supervisor externo posee ese ciclo de vida.
    - En Linux, doctor no reescribe metadatos de comando/punto de entrada mientras la unidad systemd del Gateway correspondiente está activa. También ignora unidades adicionales inactivas no heredadas similares a Gateway durante el escaneo de servicios duplicados para que los archivos de servicio complementarios no generen ruido de limpieza.
    - Si la autenticación por token requiere un token y `gateway.auth.token` está administrado por SecretRef, la instalación/reparación del servicio de doctor valida el SecretRef pero no persiste valores de token de texto plano resueltos en los metadatos de entorno del servicio del supervisor.
    - Doctor detecta valores de entorno de servicio administrados respaldados por `.env`/SecretRef que instalaciones antiguas de LaunchAgent, systemd o Windows Scheduled Task incrustaron en línea y reescribe los metadatos del servicio para que esos valores se carguen desde la fuente de tiempo de ejecución en lugar de la definición del supervisor.
    - Doctor detecta cuando el comando del servicio aún fija un `--port` antiguo después de cambios en `gateway.port` y reescribe los metadatos del servicio al puerto actual.
    - Si la autenticación por token requiere un token y el SecretRef del token configurado no se puede resolver, doctor bloquea la ruta de instalación/reparación con una guía accionable.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, doctor bloquea la instalación/reparación hasta que el modo se establezca explícitamente.
    - Para unidades systemd de usuario en Linux, las comprobaciones de deriva de token de doctor ahora incluyen tanto fuentes `Environment=` como `EnvironmentFile=` al comparar metadatos de autenticación del servicio.
    - Las reparaciones de servicio de doctor se niegan a reescribir, detener o reiniciar un servicio de Gateway desde un binario antiguo de OpenClaw cuando la configuración fue escrita por última vez por una versión más nueva. Consulta [Solución de problemas del Gateway](/es/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Siempre puedes forzar una reescritura completa mediante `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos de tiempo de ejecución + puerto del Gateway">
    Doctor inspecciona el tiempo de ejecución del servicio (PID, último estado de salida) y advierte cuando el servicio está instalado pero no se está ejecutando realmente. También comprueba colisiones de puerto en el puerto del Gateway (predeterminado `18789`) e informa causas probables (Gateway ya en ejecución, túnel SSH).
  </Accordion>
  <Accordion title="17. Prácticas recomendadas de tiempo de ejecución del Gateway">
    Doctor advierte cuando el servicio del Gateway se ejecuta en Bun o en una ruta de Node administrada por versiones (`nvm`, `fnm`, `volta`, `asdf`, etc.). Los canales WhatsApp + Telegram requieren Node, y las rutas de administradores de versiones pueden romperse después de actualizaciones porque el servicio no carga la inicialización de tu shell. Doctor ofrece migrar a una instalación de Node del sistema cuando está disponible (Homebrew/apt/choco).

    Los LaunchAgents de macOS instalados o reparados recientemente usan un PATH de sistema canónico (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) en lugar de copiar el PATH del shell interactivo, de modo que Volta, asdf, fnm, pnpm y otros directorios de administradores de versiones no cambian qué procesos secundarios de Node se resuelven. Los servicios de Linux siguen conservando raíces de entorno explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) y directorios user-bin estables, pero los directorios alternativos inferidos de administradores de versiones solo se escriben en el PATH del servicio cuando esos directorios existen en disco.

  </Accordion>
  <Accordion title="18. Escritura de configuración + metadatos del asistente">
    Doctor persiste cualquier cambio de configuración y marca metadatos del asistente para registrar la ejecución de doctor.
  </Accordion>
  <Accordion title="19. Consejos de espacio de trabajo (copia de seguridad + sistema de memoria)">
    Doctor sugiere un sistema de memoria de espacio de trabajo cuando falta e imprime un consejo de copia de seguridad si el espacio de trabajo aún no está bajo git.

    Consulta [/concepts/agent-workspace](/es/concepts/agent-workspace) para ver una guía completa de la estructura del espacio de trabajo y la copia de seguridad con git (se recomienda GitHub o GitLab privado).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Runbook del Gateway](/es/gateway)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
