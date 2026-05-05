---
read_when:
    - Añadir o modificar migraciones de doctor
    - Introducción de cambios incompatibles en la configuración
sidebarTitle: Doctor
summary: 'Comando doctor: comprobaciones de estado, migraciones de configuración y pasos de reparación'
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-05T01:46:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e374f91d00d4b43a3852de6f746b044471e80af936d464a789061a31cadd09d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` es la herramienta de reparación y migración de OpenClaw. Corrige configuración/estado obsoletos, comprueba el estado general y proporciona pasos de reparación accionables.

## Inicio rápido

```bash
openclaw doctor
```

### Modos headless y de automatización

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

    Aplica las reparaciones recomendadas sin preguntar (reparaciones + reinicios cuando sea seguro).

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

    Ejecuta sin preguntas y aplica solo migraciones seguras (normalización de configuración + movimientos de estado en disco). Omite acciones de reinicio/servicio/sandbox que requieren confirmación humana. Las migraciones de estado heredado se ejecutan automáticamente cuando se detectan.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Escanea los servicios del sistema en busca de instalaciones adicionales del Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Si quieres revisar los cambios antes de escribir, abre primero el archivo de configuración:

```bash
cat ~/.openclaw/openclaw.json
```

## Qué hace (resumen)

<AccordionGroup>
  <Accordion title="Estado general, UI y actualizaciones">
    - Actualización previa opcional para instalaciones de git (solo interactiva).
    - Comprobación de actualización del protocolo de la UI (reconstruye Control UI cuando el esquema del protocolo es más reciente).
    - Comprobación de estado general + solicitud de reinicio.
    - Resumen de estado de Skills (elegibles/faltantes/bloqueadas) y estado de Plugin.

  </Accordion>
  <Accordion title="Configuración y migraciones">
    - Normalización de configuración para valores heredados.
    - Migración de configuración de Talk desde campos planos heredados `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Comprobaciones de migración del navegador para configuraciones heredadas de la extensión de Chrome y preparación de Chrome MCP.
    - Advertencias de sobrescritura del proveedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Advertencias de sombreado de OAuth de Codex (`models.providers.openai-codex`).
    - Comprobación de prerrequisitos de TLS de OAuth para perfiles de OAuth de OpenAI Codex.
    - Advertencias de lista de permitidos de Plugin/herramientas cuando `plugins.allow` es restrictiva pero la política de herramientas aún solicita comodines o herramientas propiedad de Plugin.
    - Migración de estado heredado en disco (sesiones/directorio de agentes/autenticación de WhatsApp).
    - Migración de claves heredadas del contrato de manifiesto de Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migración del almacén de cron heredado (`jobId`, `schedule.cron`, campos de entrega/carga útil de nivel superior, `provider` de carga útil, trabajos de respaldo de Webhook simples `notify: true`).
    - Migración heredada de política de runtime de agentes a `agents.defaults.agentRuntime` y `agents.list[].agentRuntime`.
    - Limpieza de configuración obsoleta de Plugin cuando los plugins están habilitados; cuando `plugins.enabled=false`, las referencias obsoletas de Plugin se tratan como configuración de contención inerte y se preservan.

  </Accordion>
  <Accordion title="Estado e integridad">
    - Inspección de archivos de bloqueo de sesión y limpieza de bloqueos obsoletos.
    - Reparación de transcripciones de sesión para ramas duplicadas de reescritura de prompts creadas por compilaciones afectadas de 2026.4.24.
    - Detección de tombstones de recuperación por reinicio de subagentes atascados, con compatibilidad de `--fix` para borrar indicadores obsoletos de recuperación abortada de modo que el arranque no siga tratando al hijo como abortado por reinicio.
    - Comprobaciones de integridad de estado y permisos (sesiones, transcripciones, directorio de estado).
    - Comprobaciones de permisos del archivo de configuración (chmod 600) cuando se ejecuta localmente.
    - Estado de autenticación de modelos: comprueba la caducidad de OAuth, puede actualizar tokens próximos a caducar e informa estados de enfriamiento/deshabilitación de perfiles de autenticación.
    - Detección de directorio de workspace adicional (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servicios y supervisores">
    - Reparación de imagen de sandbox cuando el sandboxing está habilitado.
    - Migración de servicio heredado y detección de gateways adicionales.
    - Migración de estado heredado del canal Matrix (en modo `--fix` / `--repair`).
    - Comprobaciones de runtime del Gateway (servicio instalado pero sin ejecutar; etiqueta launchd almacenada en caché).
    - Advertencias de estado de canales (sondeadas desde el gateway en ejecución).
    - Auditoría de configuración del supervisor (launchd/systemd/schtasks) con reparación opcional.
    - Limpieza del entorno de proxy embebido para servicios de gateway que capturaron valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante la instalación o actualización.
    - Comprobaciones de buenas prácticas del runtime del Gateway (Node vs Bun, rutas del gestor de versiones).
    - Diagnósticos de colisión de puertos del Gateway (predeterminado `18789`).

  </Accordion>
  <Accordion title="Autenticación, seguridad y emparejamiento">
    - Advertencias de seguridad para políticas de DM abiertas.
    - Comprobaciones de autenticación del Gateway para modo de token local (ofrece generación de token cuando no existe una fuente de token; no sobrescribe configuraciones de token SecretRef).
    - Detección de problemas de emparejamiento de dispositivos (solicitudes pendientes de primer emparejamiento, actualizaciones pendientes de rol/alcance, deriva obsoleta de caché local de tokens de dispositivo y deriva de autenticación de registros emparejados).

  </Accordion>
  <Accordion title="Workspace y shell">
    - Comprobación de linger de systemd en Linux.
    - Comprobación del tamaño del archivo de bootstrap del workspace (advertencias de truncamiento/cercanía al límite para archivos de contexto).
    - Comprobación de preparación de Skills para el agente predeterminado; informa skills permitidas con binarios, entorno, configuración o requisitos de SO faltantes, y `--fix` puede deshabilitar skills no disponibles en `skills.entries`.
    - Comprobación de estado de autocompletado de shell e instalación/actualización automática.
    - Comprobación de preparación del proveedor de embeddings de búsqueda de memoria (modelo local, clave de API remota o binario QMD).
    - Comprobaciones de instalación desde código fuente (desajuste de workspace pnpm, recursos de UI faltantes, binario tsx faltante).
    - Escribe la configuración actualizada + metadatos del asistente.

  </Accordion>
</AccordionGroup>

## Relleno y restablecimiento de la UI de Dreams

La escena Dreams de Control UI incluye acciones **Backfill**, **Reset** y **Clear Grounded** para el flujo de trabajo de dreaming con grounded. Estas acciones usan métodos RPC de estilo doctor del gateway, pero **no** forman parte de la reparación/migración de la CLI `openclaw doctor`.

Qué hacen:

- **Backfill** escanea archivos históricos `memory/YYYY-MM-DD.md` en el workspace activo, ejecuta la pasada de diario REM con grounded y escribe entradas de relleno reversibles en `DREAMS.md`.
- **Reset** elimina solo esas entradas marcadas de diario de relleno de `DREAMS.md`.
- **Clear Grounded** elimina solo entradas preparadas de corto plazo únicamente grounded que vinieron de reproducción histórica y todavía no han acumulado recuerdo en vivo ni soporte diario.

Qué **no** hacen por sí mismas:

- no editan `MEMORY.md`
- no ejecutan migraciones completas de doctor
- no preparan automáticamente candidatos grounded en el almacén de promoción de corto plazo en vivo a menos que ejecutes explícitamente primero la ruta preparada de la CLI

Si quieres que la reproducción histórica con grounded influya en la ruta normal de promoción profunda, usa en su lugar el flujo de la CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Eso prepara candidatos duraderos grounded en el almacén de dreaming de corto plazo, manteniendo `DREAMS.md` como superficie de revisión.

## Comportamiento detallado y justificación

<AccordionGroup>
  <Accordion title="0. Actualización opcional (instalaciones de git)">
    Si esto es un checkout de git y doctor se ejecuta de forma interactiva, ofrece actualizar (fetch/rebase/build) antes de ejecutar doctor.
  </Accordion>
  <Accordion title="1. Normalización de configuración">
    Si la configuración contiene formas de valores heredadas (por ejemplo `messages.ackReaction` sin una sobrescritura específica de canal), doctor las normaliza al esquema actual.

    Eso incluye campos planos heredados de Talk. La configuración pública actual de Talk es `talk.provider` + `talk.providers.<provider>`. Doctor reescribe formas antiguas de `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` en el mapa de proveedores.

    Doctor también advierte cuando `plugins.allow` no está vacía y la política de herramientas usa
    entradas de herramientas comodín o propiedad de Plugin. `tools.allow: ["*"]` solo coincide con herramientas
    de plugins que realmente se cargan; no omite la lista de permitidos exclusiva de Plugin
    . Doctor escribe `plugins.bundledDiscovery: "compat"` para configuraciones de lista de permitidos
    heredadas migradas para preservar el comportamiento existente de proveedores empaquetados, y
    luego apunta a la configuración más estricta `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migraciones de claves de configuración heredadas">
    Cuando la configuración contiene claves obsoletas, otros comandos se niegan a ejecutarse y te piden ejecutar `openclaw doctor`.

    Doctor hará lo siguiente:

    - Explicar qué claves heredadas se encontraron.
    - Mostrar la migración que aplicó.
    - Reescribir `~/.openclaw/openclaw.json` con el esquema actualizado.

    El Gateway también ejecuta automáticamente las migraciones de doctor al arrancar cuando detecta un formato de configuración heredado, de modo que las configuraciones obsoletas se reparan sin intervención manual. Las migraciones del almacén de trabajos Cron las gestiona `openclaw doctor --fix`.

    Migraciones actuales:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
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
    - Para canales con `accounts` con nombre pero valores de canal de nivel superior de cuenta única persistentes, mueve esos valores con ámbito de cuenta a la cuenta promovida elegida para ese canal (`accounts.default` para la mayoría de los canales; Matrix puede conservar un destino existente coincidente con nombre/predeterminado)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - elimina `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` para tiempos de espera de proveedor/modelo lentos
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - elimina `browser.relayBindHost` (configuración heredada de relay de extensión)
    - `models.providers.*.api: "openai"` heredado → `"openai-completions"` (el inicio del gateway también omite proveedores cuyo `api` está configurado con un valor de enumeración futuro o desconocido, en lugar de cerrarse con error)

    Las advertencias de doctor también incluyen orientación sobre cuentas predeterminadas para canales con varias cuentas:

    - Si se configuran dos o más entradas `channels.<channel>.accounts` sin `channels.<channel>.defaultAccount` ni `accounts.default`, doctor advierte que el enrutamiento de respaldo puede elegir una cuenta inesperada.
    - Si `channels.<channel>.defaultAccount` está configurado con un ID de cuenta desconocido, doctor advierte y enumera los ID de cuenta configurados.

  </Accordion>
  <Accordion title="2b. Overrides del proveedor OpenCode">
    Si agregaste `models.providers.opencode`, `opencode-zen` u `opencode-go` manualmente, eso sobrescribe el catálogo OpenCode integrado de `@mariozechner/pi-ai`. Eso puede forzar modelos a usar la API incorrecta o poner los costos en cero. Doctor advierte para que puedas eliminar el override y restaurar el enrutamiento de API por modelo + costos.
  </Accordion>
  <Accordion title="2c. Migración del navegador y preparación para Chrome MCP">
    Si tu configuración del navegador todavía apunta a la ruta eliminada de la extensión de Chrome, doctor la normaliza al modelo actual de conexión Chrome MCP local al host:

    - `browser.profiles.*.driver: "extension"` se convierte en `"existing-session"`
    - se elimina `browser.relayBindHost`

    Doctor también audita la ruta Chrome MCP local al host cuando usas `defaultProfile: "user"` o un perfil `existing-session` configurado:

    - comprueba si Google Chrome está instalado en el mismo host para perfiles predeterminados de conexión automática
    - comprueba la versión de Chrome detectada y advierte cuando es inferior a Chrome 144
    - te recuerda habilitar la depuración remota en la página de inspección del navegador (por ejemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor no puede habilitar la configuración del lado de Chrome por ti. Chrome MCP local al host aún requiere:

    - un navegador basado en Chromium 144+ en el host gateway/node
    - que el navegador se ejecute localmente
    - depuración remota habilitada en ese navegador
    - aprobar la primera solicitud de consentimiento de conexión en el navegador

    La preparación aquí solo trata sobre los prerrequisitos de conexión local. Existing-session conserva los límites actuales de ruta de Chrome MCP; las rutas avanzadas como `responsebody`, exportación a PDF, interceptación de descargas y acciones por lotes aún requieren un navegador administrado o un perfil CDP sin procesar.

    Esta comprobación **no** se aplica a Docker, sandbox, remote-browser ni a otros flujos headless. Esos continúan usando CDP sin procesar.

  </Accordion>
  <Accordion title="2d. Prerrequisitos de OAuth TLS">
    Cuando se configura un perfil OAuth de OpenAI Codex, doctor prueba el endpoint de autorización de OpenAI para verificar que la pila TLS local de Node/OpenSSL pueda validar la cadena de certificados. Si la prueba falla con un error de certificado (por ejemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado caducado o certificado autofirmado), doctor imprime orientación de corrección específica de la plataforma. En macOS con un Node de Homebrew, la corrección suele ser `brew postinstall ca-certificates`. Con `--deep`, la prueba se ejecuta incluso si el gateway está correcto.
  </Accordion>
  <Accordion title="2e. Overrides del proveedor OAuth de Codex">
    Si antes agregaste configuraciones heredadas de transporte de OpenAI en `models.providers.openai-codex`, pueden ocultar la ruta integrada del proveedor OAuth de Codex que las versiones más recientes usan automáticamente. Doctor advierte cuando ve esas configuraciones de transporte antiguas junto con OAuth de Codex para que puedas eliminar o reescribir el override de transporte obsoleto y recuperar el comportamiento integrado de enrutamiento/respaldo. Los proxies personalizados y los overrides solo de encabezados siguen siendo compatibles y no activan esta advertencia.
  </Accordion>
  <Accordion title="2f. Advertencias de ruta del Plugin de Codex">
    Cuando el Plugin de Codex incluido está habilitado, doctor también comprueba si las referencias de modelo principal `openai-codex/*` aún se resuelven mediante el ejecutor PI predeterminado. Esa combinación es válida cuando quieres autenticación OAuth/suscripción de Codex a través de PI, pero es fácil confundirla con el arnés nativo de app-server de Codex. Doctor advierte y apunta a la forma explícita de app-server: `openai/*` más `agentRuntime.id: "codex"` u `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor no repara esto automáticamente porque ambas rutas son válidas:

    - `openai-codex/*` + PI significa "usar autenticación OAuth/suscripción de Codex a través del ejecutor normal de OpenClaw."
    - `openai/*` + `agentRuntime.id: "codex"` significa "ejecutar el turno integrado mediante el app-server nativo de Codex."
    - `/codex ...` significa "controlar o vincular una conversación nativa de Codex desde el chat."
    - `/acp ...` o `runtime: "acp"` significa "usar el adaptador externo ACP/acpx."

    Si aparece la advertencia, elige la ruta que pretendías y edita la configuración manualmente. Mantén la advertencia tal como está cuando PI Codex OAuth sea intencional.

  </Accordion>
  <Accordion title="2g. Limpieza de rutas de sesión">
    Doctor también escanea el almacén de sesiones activas en busca de estado de ruta obsoleto creado automáticamente después de mover el modelo o runtime predeterminado/de respaldo configurado fuera de una ruta propiedad de un Plugin, como Codex.

    `openclaw doctor --fix` puede borrar estado obsoleto creado automáticamente, como pines de modelo `modelOverrideSource: "auto"`, metadatos de modelo de runtime, ID de arnés fijados, vinculaciones de sesión de CLI y overrides automáticos de perfiles de autenticación cuando su ruta propietaria ya no está configurada. Las elecciones explícitas de usuario o de modelo de sesión heredada se reportan para revisión manual y se dejan intactas; cámbialas con `/model ...`, `/new` o restablece la sesión cuando esa ruta ya no sea la prevista.

  </Accordion>
  <Accordion title="3. Migraciones de estado heredado (diseño en disco)">
    Doctor puede migrar diseños antiguos en disco a la estructura actual:

    - Almacén de sesiones + transcripciones:
      - de `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directorio de agente:
      - de `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticación de WhatsApp (Baileys):
      - de `~/.openclaw/credentials/*.json` heredado (excepto `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de cuenta predeterminada: `default`)

    Estas migraciones se hacen con el mejor esfuerzo y son idempotentes; doctor emitirá advertencias cuando deje carpetas heredadas como copias de seguridad. El Gateway/CLI también migra automáticamente el directorio heredado de sesiones + agente al iniciar, para que el historial/autenticación/modelos terminen en la ruta por agente sin una ejecución manual de doctor. La autenticación de WhatsApp se migra intencionalmente solo mediante `openclaw doctor`. La normalización de proveedor/mapa de proveedores de Talk ahora compara por igualdad estructural, por lo que las diferencias solo de orden de claves ya no activan cambios repetidos sin efecto de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migraciones de manifiestos de Plugin heredados">
    Doctor escanea todos los manifiestos de Plugin instalados en busca de claves de capacidades de nivel superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Cuando las encuentra, ofrece moverlas al objeto `contracts` y reescribir el archivo de manifiesto en el lugar. Esta migración es idempotente; si la clave `contracts` ya tiene los mismos valores, la clave heredada se elimina sin duplicar los datos.
  </Accordion>
  <Accordion title="3b. Migraciones del almacén Cron heredado">
    Doctor también comprueba el almacén de trabajos Cron (`~/.openclaw/cron/jobs.json` de forma predeterminada, o `cron.store` cuando se sobrescribe) en busca de formas antiguas de trabajos que el planificador todavía acepta por compatibilidad.

    Las limpiezas actuales de Cron incluyen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de payload de nivel superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nivel superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de entrega `provider` de payload → `delivery.channel` explícito
    - trabajos simples heredados de fallback de webhook `notify: true` → `delivery.mode="webhook"` explícito con `delivery.to=cron.webhook`

    Doctor solo migra automáticamente trabajos `notify: true` cuando puede hacerlo sin cambiar el comportamiento. Si un trabajo combina fallback heredado de notificación con un modo de entrega no webhook existente, doctor advierte y deja ese trabajo para revisión manual.

    En Linux, doctor también advierte cuando la crontab del usuario todavía invoca el script heredado `~/.openclaw/bin/ensure-whatsapp.sh`. Ese script local del host no lo mantiene la versión actual de OpenClaw y puede escribir mensajes falsos de `Gateway inactive` en `~/.openclaw/logs/whatsapp-health.log` cuando cron no puede alcanzar el bus de usuario de systemd. Elimina la entrada obsoleta de crontab con `crontab -e`; usa `openclaw channels status --probe`, `openclaw doctor` y `openclaw gateway status` para las comprobaciones de estado actuales.

  </Accordion>
  <Accordion title="3c. Limpieza del bloqueo de sesión">
    Doctor examina cada directorio de sesión de agente en busca de archivos de bloqueo de escritura obsoletos: archivos que quedaron cuando una sesión terminó de forma anómala. Por cada archivo de bloqueo encontrado, informa: la ruta, el PID, si el PID sigue activo, la antigüedad del bloqueo y si se considera obsoleto (PID muerto o más antiguo que 30 minutos). En modo `--fix` / `--repair`, elimina automáticamente los archivos de bloqueo obsoletos; de lo contrario, imprime una nota y te indica que vuelvas a ejecutarlo con `--fix`.
  </Accordion>
  <Accordion title="3d. Reparación de rama de transcripción de sesión">
    Doctor examina los archivos JSONL de sesión de agente en busca de la forma de rama duplicada creada por el error de reescritura de transcripción de prompts de 2026.4.24: un turno de usuario abandonado con contexto de runtime interno de OpenClaw más un hermano activo que contiene el mismo prompt de usuario visible. En modo `--fix` / `--repair`, doctor crea una copia de seguridad de cada archivo afectado junto al original y reescribe la transcripción a la rama activa para que el historial del Gateway y los lectores de memoria ya no vean turnos duplicados.
  </Accordion>
  <Accordion title="4. Comprobaciones de integridad de estado (persistencia de sesión, enrutamiento y seguridad)">
    El directorio de estado es el tronco encefálico operativo. Si desaparece, pierdes sesiones, credenciales, registros y configuración (a menos que tengas copias de seguridad en otro lugar).

    Doctor comprueba:

    - **Falta el directorio de estado**: advierte sobre una pérdida de estado catastrófica, pide recrear el directorio y te recuerda que no puede recuperar datos faltantes.
    - **Permisos del directorio de estado**: verifica que se pueda escribir; ofrece reparar permisos (y emite una sugerencia de `chown` cuando detecta una discrepancia de propietario/grupo).
    - **Directorio de estado sincronizado con la nube en macOS**: advierte cuando el estado se resuelve bajo iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...` porque las rutas respaldadas por sincronización pueden causar E/S más lenta y carreras de bloqueo/sincronización.
    - **Directorio de estado en SD o eMMC en Linux**: advierte cuando el estado se resuelve a una fuente de montaje `mmcblk*`, porque la E/S aleatoria respaldada por SD o eMMC puede ser más lenta y desgastarse más rápido con escrituras de sesiones y credenciales.
    - **Faltan directorios de sesión**: `sessions/` y el directorio del almacén de sesiones son necesarios para persistir el historial y evitar bloqueos `ENOENT`.
    - **Discrepancia de transcripción**: advierte cuando entradas recientes de sesión tienen archivos de transcripción faltantes.
    - **Sesión principal "JSONL de 1 línea"**: marca cuando la transcripción principal solo tiene una línea (el historial no se está acumulando).
    - **Múltiples directorios de estado**: advierte cuando existen varias carpetas `~/.openclaw` en distintos directorios de inicio o cuando `OPENCLAW_STATE_DIR` apunta a otro lugar (el historial puede dividirse entre instalaciones).
    - **Recordatorio de modo remoto**: si `gateway.mode=remote`, doctor te recuerda ejecutarlo en el host remoto (el estado vive allí).
    - **Permisos del archivo de configuración**: advierte si `~/.openclaw/openclaw.json` es legible por grupo/mundo y ofrece restringirlo a `600`.

  </Accordion>
  <Accordion title="5. Estado de autenticación de modelos (caducidad de OAuth)">
    Doctor inspecciona perfiles OAuth en el almacén de autenticación, advierte cuando los tokens están por caducar o caducados, y puede actualizarlos cuando es seguro. Si el perfil OAuth/token de Anthropic está obsoleto, sugiere una clave de API de Anthropic o la ruta de token de configuración de Anthropic. Los prompts de actualización solo aparecen cuando se ejecuta de forma interactiva (TTY); `--non-interactive` omite los intentos de actualización.

    Cuando una actualización de OAuth falla de forma permanente (por ejemplo `refresh_token_reused`, `invalid_grant` o un proveedor que te indica que inicies sesión de nuevo), doctor informa que se requiere volver a autenticar y muestra el comando exacto `openclaw models auth login --provider ...` que debes ejecutar.

    Doctor también informa perfiles de autenticación que no se pueden usar temporalmente debido a:

    - cooldowns cortos (límites de frecuencia/tiempos de espera/fallos de autenticación)
    - deshabilitaciones más largas (fallos de facturación/crédito)

  </Accordion>
  <Accordion title="6. Validación del modelo de hooks">
    Si `hooks.gmail.model` está configurado, doctor valida la referencia del modelo contra el catálogo y la lista de permitidos, y advierte cuando no se resolverá o no está permitido.
  </Accordion>
  <Accordion title="7. Reparación de imagen de sandbox">
    Cuando el sandboxing está habilitado, doctor comprueba las imágenes de Docker y ofrece compilarlas o cambiar a nombres heredados si falta la imagen actual.
  </Accordion>
  <Accordion title="7b. Limpieza de instalación de Plugin">
    Doctor elimina el estado heredado de preparación de dependencias de plugins generado por OpenClaw en modo `openclaw doctor --fix` / `openclaw doctor --repair`. Esto cubre raíces de dependencias generadas obsoletas, directorios antiguos de etapa de instalación, residuos locales del paquete de código de reparación de dependencias de plugins incluidos anterior, y copias npm administradas huérfanas o recuperadas de plugins `@openclaw/*` incluidos que pueden ocultar el manifiesto incluido actual.

    Doctor también puede reinstalar plugins descargables faltantes cuando la configuración los referencia pero el registro local de plugins no puede encontrarlos. Los ejemplos incluyen `plugins.entries` materiales, ajustes configurados de canal/proveedor/búsqueda y runtimes de agente configurados. Durante las actualizaciones de paquetes, doctor evita ejecutar reparación de plugins con el gestor de paquetes mientras se intercambia el paquete central; ejecuta `openclaw doctor --fix` otra vez después de la actualización si un plugin configurado aún necesita recuperación. El inicio del Gateway y la recarga de configuración no ejecutan gestores de paquetes; las instalaciones de plugins siguen siendo trabajo explícito de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migraciones de servicio de Gateway y sugerencias de limpieza">
    Doctor detecta servicios de gateway heredados (launchd/systemd/schtasks) y ofrece eliminarlos e instalar el servicio de OpenClaw usando el puerto de gateway actual. También puede buscar servicios adicionales similares a gateway e imprimir sugerencias de limpieza. Los servicios de gateway de OpenClaw con nombre de perfil se consideran de primera clase y no se marcan como "extra".

    En Linux, si falta el servicio de gateway de nivel de usuario pero existe un servicio de gateway de OpenClaw de nivel de sistema, doctor no instala automáticamente un segundo servicio de nivel de usuario. Inspecciona con `openclaw gateway status --deep` o `openclaw doctor --deep`; luego elimina el duplicado o configura `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando un supervisor de sistema posee el ciclo de vida del gateway.

  </Accordion>
  <Accordion title="8b. Migración de inicio de Matrix">
    Cuando una cuenta de canal Matrix tiene una migración de estado heredado pendiente o accionable, doctor (en modo `--fix` / `--repair`) crea una instantánea previa a la migración y luego ejecuta los pasos de migración de mejor esfuerzo: migración de estado heredado de Matrix y preparación de estado cifrado heredado. Ambos pasos no son fatales; los errores se registran y el inicio continúa. En modo de solo lectura (`openclaw doctor` sin `--fix`), esta comprobación se omite por completo.
  </Accordion>
  <Accordion title="8c. Emparejamiento de dispositivos y desviación de autenticación">
    Doctor ahora inspecciona el estado de emparejamiento de dispositivos como parte de la pasada normal de estado.

    Lo que informa:

    - solicitudes pendientes de emparejamiento inicial
    - actualizaciones de rol pendientes para dispositivos ya emparejados
    - actualizaciones de alcance pendientes para dispositivos ya emparejados
    - reparaciones de discrepancia de clave pública donde el id del dispositivo todavía coincide pero la identidad del dispositivo ya no coincide con el registro aprobado
    - registros emparejados a los que les falta un token activo para un rol aprobado
    - tokens emparejados cuyos alcances se desvían fuera de la línea base de emparejamiento aprobada
    - entradas locales en caché de token de dispositivo para la máquina actual que son anteriores a una rotación de token del lado del gateway o llevan metadatos de alcance obsoletos

    Doctor no aprueba automáticamente solicitudes de emparejamiento ni rota automáticamente tokens de dispositivo. En su lugar, imprime los pasos siguientes exactos:

    - inspeccionar solicitudes pendientes con `openclaw devices list`
    - aprobar la solicitud exacta con `openclaw devices approve <requestId>`
    - rotar un token nuevo con `openclaw devices rotate --device <deviceId> --role <role>`
    - eliminar y volver a aprobar un registro obsoleto con `openclaw devices remove <deviceId>`

    Esto cierra el hueco común de "ya emparejado pero aún recibe emparejamiento requerido": doctor ahora distingue el emparejamiento inicial de las actualizaciones pendientes de rol/alcance y de la desviación de token/identidad de dispositivo obsoletos.

  </Accordion>
  <Accordion title="9. Advertencias de seguridad">
    Doctor emite advertencias cuando un proveedor está abierto a mensajes directos sin una lista de permitidos, o cuando una política está configurada de forma peligrosa.
  </Accordion>
  <Accordion title="10. linger de systemd (Linux)">
    Si se ejecuta como un servicio de usuario de systemd, doctor garantiza que lingering esté habilitado para que el gateway permanezca activo después de cerrar sesión.
  </Accordion>
  <Accordion title="11. Estado del espacio de trabajo (skills, plugins y directorios heredados)">
    Doctor imprime un resumen del estado del espacio de trabajo para el agente predeterminado:

    - **Estado de Skills**: cuenta Skills elegibles, con requisitos faltantes y bloqueadas por lista de permitidos.
    - **Directorios de espacio de trabajo heredados**: advierte cuando `~/openclaw` u otros directorios de espacio de trabajo heredados existen junto al espacio de trabajo actual.
    - **Estado de Plugin**: cuenta plugins habilitados/deshabilitados/con errores; lista IDs de plugin para cualquier error; informa capacidades de plugins incluidos.
    - **Advertencias de compatibilidad de Plugin**: marca plugins que tienen problemas de compatibilidad con el runtime actual.
    - **Diagnósticos de Plugin**: muestra cualquier advertencia o error de tiempo de carga emitido por el registro de plugins.

  </Accordion>
  <Accordion title="11b. Tamaño del archivo de arranque">
    Doctor comprueba si los archivos de arranque del espacio de trabajo (por ejemplo `AGENTS.md`, `CLAUDE.md` u otros archivos de contexto inyectados) están cerca o por encima del presupuesto de caracteres configurado. Informa recuentos por archivo de caracteres sin procesar frente a inyectados, porcentaje de truncamiento, causa del truncamiento (`max/file` o `max/total`) y caracteres inyectados totales como fracción del presupuesto total. Cuando los archivos se truncan o están cerca del límite, doctor imprime consejos para ajustar `agents.defaults.bootstrapMaxChars` y `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpieza de plugin de canal obsoleto">
    Cuando `openclaw doctor --fix` elimina un plugin de canal faltante, también elimina la configuración colgante con alcance de canal que referenciaba ese plugin: entradas `channels.<id>`, destinos de Heartbeat que nombraban el canal y sobrescrituras `agents.*.models["<channel>/*"]`. Esto evita bucles de arranque del Gateway donde el runtime del canal ya no existe pero la configuración todavía le pide al gateway que se vincule a él.
  </Accordion>
  <Accordion title="11c. Autocompletado de shell">
    Doctor comprueba si el autocompletado con tabulador está instalado para la shell actual (zsh, bash, fish o PowerShell):

    - Si el perfil de shell usa un patrón de autocompletado dinámico lento (`source <(openclaw completion ...)`), doctor lo actualiza a la variante más rápida de archivo en caché.
    - Si el autocompletado está configurado en el perfil pero falta el archivo de caché, doctor regenera la caché automáticamente.
    - Si no hay autocompletado configurado en absoluto, doctor solicita instalarlo (solo en modo interactivo; se omite con `--non-interactive`).

    Ejecuta `openclaw completion --write-state` para regenerar la caché manualmente.

  </Accordion>
  <Accordion title="12. Comprobaciones de autenticación de Gateway (token local)">
    Doctor comprueba la preparación de autenticación con token de gateway local.

    - Si el modo de token necesita un token y no existe ninguna fuente de token, doctor ofrece generar uno.
    - Si `gateway.auth.token` está administrado por SecretRef pero no está disponible, doctor advierte y no lo sobrescribe con texto sin formato.
    - `openclaw doctor --generate-gateway-token` fuerza la generación solo cuando no hay ningún SecretRef de token configurado.

  </Accordion>
  <Accordion title="12b. Reparaciones de solo lectura conscientes de SecretRef">
    Algunos flujos de reparación necesitan inspeccionar credenciales configuradas sin debilitar el comportamiento de fallo rápido del runtime.

    - `openclaw doctor --fix` ahora usa el mismo modelo de resumen SecretRef de solo lectura que los comandos de la familia de estado para reparaciones de configuración dirigidas.
    - Ejemplo: la reparación de Telegram `allowFrom` / `groupAllowFrom` `@username` intenta usar las credenciales de bot configuradas cuando están disponibles.
    - Si el token del bot de Telegram está configurado mediante SecretRef pero no está disponible en la ruta del comando actual, doctor informa que la credencial está configurada pero no disponible y omite la resolución automática en lugar de bloquearse o informar incorrectamente que falta el token.

  </Accordion>
  <Accordion title="13. Comprobación de estado del Gateway + reinicio">
    Doctor ejecuta una comprobación de estado y ofrece reiniciar el Gateway cuando parece no estar en buen estado.
  </Accordion>
  <Accordion title="13b. Preparación de la búsqueda de memoria">
    Doctor comprueba si el proveedor de embeddings de búsqueda de memoria configurado está listo para el agente predeterminado. El comportamiento depende del backend y el proveedor configurados:

    - **Backend QMD**: comprueba si el binario `qmd` está disponible y puede iniciarse. Si no, imprime orientación de corrección que incluye el paquete npm y una opción de ruta manual al binario.
    - **Proveedor local explícito**: comprueba si existe un archivo de modelo local o una URL de modelo remota/descargable reconocida. Si falta, sugiere cambiar a un proveedor remoto.
    - **Proveedor remoto explícito** (`openai`, `voyage`, etc.): verifica que haya una clave de API en el entorno o en el almacén de autenticación. Imprime sugerencias de corrección accionables si falta.
    - **Proveedor automático**: comprueba primero la disponibilidad del modelo local y luego prueba cada proveedor remoto en el orden de selección automática.

    Cuando hay disponible un resultado de sondeo del Gateway en caché (el Gateway estaba en buen estado en el momento de la comprobación), doctor cruza su resultado con la configuración visible para la CLI y señala cualquier discrepancia. Doctor no inicia un nuevo ping de embeddings en la ruta predeterminada; usa el comando de estado de memoria profundo cuando quieras una comprobación en vivo del proveedor.

    Usa `openclaw memory status --deep` para verificar la preparación de embeddings en tiempo de ejecución.

  </Accordion>
  <Accordion title="14. Advertencias de estado de canal">
    Si el Gateway está en buen estado, doctor ejecuta un sondeo de estado de canal e informa advertencias con correcciones sugeridas.
  </Accordion>
  <Accordion title="15. Auditoría + reparación de configuración del supervisor">
    Doctor comprueba la configuración del supervisor instalada (launchd/systemd/schtasks) en busca de valores predeterminados faltantes u obsoletos (por ejemplo, dependencias de systemd network-online y retraso de reinicio). Cuando encuentra una discrepancia, recomienda una actualización y puede reescribir el archivo de servicio/tarea con los valores predeterminados actuales.

    Notas:

    - `openclaw doctor` solicita confirmación antes de reescribir la configuración del supervisor.
    - `openclaw doctor --yes` acepta las solicitudes de reparación predeterminadas.
    - `openclaw doctor --repair` aplica las correcciones recomendadas sin solicitudes.
    - `openclaw doctor --repair --force` sobrescribe configuraciones personalizadas del supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor en modo de solo lectura para el ciclo de vida del servicio del Gateway. Sigue informando el estado del servicio y ejecuta reparaciones que no son de servicio, pero omite instalación/inicio/reinicio/bootstrap del servicio, reescrituras de configuración del supervisor y limpieza de servicios heredados porque un supervisor externo posee ese ciclo de vida.
    - En Linux, doctor no reescribe metadatos de comando/punto de entrada mientras la unidad systemd del Gateway correspondiente está activa. También ignora unidades inactivas adicionales similares al Gateway que no son heredadas durante el escaneo de servicios duplicados, para que los archivos de servicio complementarios no generen ruido de limpieza.
    - Si la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación/reparación del servicio de doctor valida el SecretRef pero no persiste valores de token en texto sin formato resueltos en los metadatos de entorno del servicio del supervisor.
    - Doctor detecta valores de entorno de servicio gestionados respaldados por `.env`/SecretRef que instalaciones antiguas de LaunchAgent, systemd o Windows Scheduled Task incrustaron en línea, y reescribe los metadatos del servicio para que esos valores se carguen desde la fuente en tiempo de ejecución en lugar de la definición del supervisor.
    - Doctor detecta cuando el comando del servicio todavía fija un `--port` antiguo después de que cambia `gateway.port` y reescribe los metadatos del servicio al puerto actual.
    - Si la autenticación por token requiere un token y el SecretRef del token configurado no está resuelto, doctor bloquea la ruta de instalación/reparación con orientación accionable.
    - Si `gateway.auth.token` y `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, doctor bloquea la instalación/reparación hasta que el modo se configure explícitamente.
    - Para unidades user-systemd de Linux, las comprobaciones de desviación de token de doctor ahora incluyen tanto fuentes `Environment=` como `EnvironmentFile=` al comparar metadatos de autenticación del servicio.
    - Las reparaciones de servicio de doctor se niegan a reescribir, detener o reiniciar un servicio de Gateway desde un binario de OpenClaw anterior cuando la configuración fue escrita por última vez por una versión más nueva. Consulta [Solución de problemas del Gateway](/es/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Siempre puedes forzar una reescritura completa mediante `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos de tiempo de ejecución + puerto del Gateway">
    Doctor inspecciona el tiempo de ejecución del servicio (PID, último estado de salida) y advierte cuando el servicio está instalado pero no se está ejecutando realmente. También comprueba colisiones de puerto en el puerto del Gateway (predeterminado `18789`) e informa causas probables (Gateway ya en ejecución, túnel SSH).
  </Accordion>
  <Accordion title="17. Buenas prácticas de tiempo de ejecución del Gateway">
    Doctor advierte cuando el servicio del Gateway se ejecuta en Bun o en una ruta de Node gestionada por versiones (`nvm`, `fnm`, `volta`, `asdf`, etc.). Los canales de WhatsApp + Telegram requieren Node, y las rutas de gestores de versiones pueden romperse después de actualizaciones porque el servicio no carga tu inicialización de shell. Doctor ofrece migrar a una instalación de Node del sistema cuando está disponible (Homebrew/apt/choco).

    Los LaunchAgents de macOS instalados o reparados recientemente usan un PATH de sistema canónico (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) en lugar de copiar el PATH del shell interactivo, de modo que Volta, asdf, fnm, pnpm y otros directorios de gestores de versiones no cambien qué procesos secundarios de Node se resuelven. Los servicios de Linux aún conservan raíces de entorno explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) y directorios user-bin estables, pero los directorios de reserva inferidos de gestores de versiones solo se escriben en el PATH del servicio cuando esos directorios existen en el disco.

  </Accordion>
  <Accordion title="18. Escritura de configuración + metadatos del asistente">
    Doctor persiste cualquier cambio de configuración y marca metadatos del asistente para registrar la ejecución de doctor.
  </Accordion>
  <Accordion title="19. Consejos de espacio de trabajo (copia de seguridad + sistema de memoria)">
    Doctor sugiere un sistema de memoria de espacio de trabajo cuando falta e imprime un consejo de copia de seguridad si el espacio de trabajo aún no está bajo git.

    Consulta [/concepts/agent-workspace](/es/concepts/agent-workspace) para una guía completa de la estructura del espacio de trabajo y la copia de seguridad con git (se recomienda GitHub o GitLab privado).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Runbook del Gateway](/es/gateway)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
