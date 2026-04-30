---
read_when:
    - Añadir o modificar migraciones de doctor
    - Introducción de cambios incompatibles en la configuración
sidebarTitle: Doctor
summary: 'Comando doctor: comprobaciones de estado, migraciones de configuración y pasos de reparación'
title: Doctor
x-i18n:
    generated_at: "2026-04-30T16:28:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89150fe2b2848f1f168b42ca6b240bc0e6a0edee4f1bcad7f79d297face9c95e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` es la herramienta de reparación y migración de OpenClaw. Corrige configuración/estado obsoletos, comprueba el estado de salud y proporciona pasos de reparación accionables.

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

    Acepta los valores predeterminados sin preguntar (incluidos los pasos de reparación de reinicio/servicio/sandbox cuando correspondan).

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

    Aplica también reparaciones agresivas (sobrescribe configuraciones de supervisor personalizadas).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Se ejecuta sin avisos y solo aplica migraciones seguras (normalización de configuración + movimientos de estado en disco). Omite acciones de reinicio/servicio/sandbox que requieren confirmación humana. Las migraciones de estado legado se ejecutan automáticamente cuando se detectan.

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
  <Accordion title="Health, UI, and updates">
    - Actualización previa opcional para instalaciones git (solo interactivo).
    - Comprobación de frescura del protocolo de la UI (reconstruye Control UI cuando el esquema del protocolo es más nuevo).
    - Comprobación de salud + aviso de reinicio.
    - Resumen de estado de Skills (aptas/faltantes/bloqueadas) y estado de plugins.

  </Accordion>
  <Accordion title="Config and migrations">
    - Normalización de configuración para valores legados.
    - Migración de configuración Talk desde campos planos legados `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Comprobaciones de migración del navegador para configuraciones legadas de la extensión de Chrome y preparación de Chrome MCP.
    - Advertencias de sobrescritura del proveedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Advertencias de sombreado de OAuth de Codex (`models.providers.openai-codex`).
    - Comprobación de requisitos previos de OAuth TLS para perfiles OAuth de OpenAI Codex.
    - Migración de estado legado en disco (sesiones/directorio de agente/autenticación de WhatsApp).
    - Migración de claves legadas del contrato de manifiesto de plugins (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migración del almacén Cron legado (`jobId`, `schedule.cron`, campos de entrega/carga útil de nivel superior, `provider` de carga útil, trabajos simples de fallback de Webhook `notify: true`).
    - Migración legada de la política de tiempo de ejecución de agentes a `agents.defaults.agentRuntime` y `agents.list[].agentRuntime`.
    - Limpieza de configuración obsoleta de plugins cuando los plugins están habilitados; cuando `plugins.enabled=false`, las referencias obsoletas a plugins se tratan como configuración de contención inerte y se conservan.

  </Accordion>
  <Accordion title="State and integrity">
    - Inspección de archivos de bloqueo de sesión y limpieza de bloqueos obsoletos.
    - Reparación de transcripciones de sesión para ramas duplicadas de reescritura de prompts creadas por compilaciones afectadas de 2026.4.24.
    - Detección de lápidas de recuperación por reinicio de subagentes bloqueados, con compatibilidad de `--fix` para limpiar indicadores obsoletos de recuperación abortada, de modo que el inicio no siga tratando al hijo como abortado por reinicio.
    - Comprobaciones de integridad de estado y permisos (sesiones, transcripciones, directorio de estado).
    - Comprobaciones de permisos del archivo de configuración (chmod 600) al ejecutarse localmente.
    - Salud de autenticación del modelo: comprueba el vencimiento de OAuth, puede refrescar tokens por vencer e informa estados de enfriamiento/deshabilitación del perfil de autenticación.
    - Detección de directorio de espacio de trabajo adicional (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Reparación de imagen de sandbox cuando el sandboxing está habilitado.
    - Migración de servicios legados y detección adicional de Gateway.
    - Migración de estado legado del canal Matrix (en modo `--fix` / `--repair`).
    - Comprobaciones del tiempo de ejecución del Gateway (servicio instalado pero no en ejecución; etiqueta launchd en caché).
    - Advertencias de estado de canales (sondeadas desde el Gateway en ejecución).
    - Auditoría de configuración del supervisor (launchd/systemd/schtasks) con reparación opcional.
    - Limpieza del entorno de proxy incrustado para servicios del Gateway que capturaron valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante la instalación o actualización.
    - Comprobaciones de mejores prácticas del tiempo de ejecución del Gateway (Node frente a Bun, rutas de gestores de versiones).
    - Diagnósticos de colisiones de puerto del Gateway (predeterminado `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Advertencias de seguridad para políticas de DM abiertas.
    - Comprobaciones de autenticación del Gateway para el modo de token local (ofrece generación de token cuando no existe una fuente de token; no sobrescribe configuraciones SecretRef de token).
    - Detección de problemas de emparejamiento de dispositivos (solicitudes pendientes de primer emparejamiento, actualizaciones pendientes de rol/alcance, divergencia obsoleta de caché local de token de dispositivo y divergencia de autenticación del registro emparejado).

  </Accordion>
  <Accordion title="Workspace and shell">
    - Comprobación de linger de systemd en Linux.
    - Comprobación del tamaño del archivo de arranque del espacio de trabajo (advertencias de truncamiento/cerca del límite para archivos de contexto).
    - Comprobación de estado de autocompletado de shell e instalación/actualización automática.
    - Comprobación de preparación del proveedor de embeddings de búsqueda de memoria (modelo local, clave de API remota o binario QMD).
    - Comprobaciones de instalación desde código fuente (discordancia de espacio de trabajo pnpm, recursos de UI faltantes, binario tsx faltante).
    - Escribe configuración actualizada + metadatos del asistente.

  </Accordion>
</AccordionGroup>

## Relleno y restablecimiento de la UI de Dreams

La escena Dreams de Control UI incluye acciones **Backfill**, **Reset** y **Clear Grounded** para el flujo de trabajo de grounded dreaming. Estas acciones usan métodos RPC de estilo doctor del Gateway, pero **no** forman parte de la reparación/migración de la CLI `openclaw doctor`.

Qué hacen:

- **Backfill** escanea archivos históricos `memory/YYYY-MM-DD.md` en el espacio de trabajo activo, ejecuta el pase de diario REM anclado y escribe entradas reversibles de relleno en `DREAMS.md`.
- **Reset** elimina solo esas entradas marcadas del diario de relleno de `DREAMS.md`.
- **Clear Grounded** elimina solo entradas de corto plazo preparadas y solo ancladas que provinieron de la reproducción histórica y que aún no han acumulado recuerdo en vivo ni respaldo diario.

Qué **no** hacen por sí solas:

- no editan `MEMORY.md`
- no ejecutan migraciones completas de doctor
- no preparan automáticamente candidatos anclados en el almacén de promoción de corto plazo en vivo a menos que ejecutes explícitamente primero la ruta CLI preparada

Si quieres que la reproducción histórica anclada influya en la vía normal de promoción profunda, usa en su lugar el flujo de la CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Eso prepara candidatos duraderos anclados en el almacén de dreaming de corto plazo, manteniendo `DREAMS.md` como superficie de revisión.

## Comportamiento detallado y justificación

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    Si esto es un checkout de git y doctor se ejecuta de forma interactiva, ofrece actualizar (fetch/rebase/build) antes de ejecutar doctor.
  </Accordion>
  <Accordion title="1. Config normalization">
    Si la configuración contiene formas de valores legadas (por ejemplo `messages.ackReaction` sin una sobrescritura específica de canal), doctor las normaliza al esquema actual.

    Eso incluye los campos planos legados de Talk. La configuración pública actual de Talk es `talk.provider` + `talk.providers.<provider>`. Doctor reescribe las formas antiguas `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` en el mapa de proveedores.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    Cuando la configuración contiene claves obsoletas, otros comandos se niegan a ejecutarse y te piden ejecutar `openclaw doctor`.

    Doctor hará lo siguiente:

    - Explicar qué claves legadas se encontraron.
    - Mostrar la migración que aplicó.
    - Reescribir `~/.openclaw/openclaw.json` con el esquema actualizado.

    El Gateway también ejecuta automáticamente migraciones de doctor al iniciar cuando detecta un formato de configuración legado, por lo que las configuraciones obsoletas se reparan sin intervención manual. Las migraciones del almacén de trabajos Cron las gestiona `openclaw doctor --fix`.

    Migraciones actuales:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` de nivel superior
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` legados → `talk.provider` + `talk.providers.<provider>`
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
    - Para canales con `accounts` con nombre pero valores de canal de nivel superior de cuenta única persistentes, mueve esos valores con alcance de cuenta a la cuenta promovida elegida para ese canal (`accounts.default` para la mayoría de los canales; Matrix puede conservar un destino con nombre/predeterminado coincidente existente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - elimina `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` para tiempos de espera de proveedores/modelos lentos
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - elimina `browser.relayBindHost` (configuración legada de relay de la extensión)
    - `models.providers.*.api: "openai"` legado → `"openai-completions"` (el inicio del Gateway también omite proveedores cuyo `api` esté configurado con un valor de enumeración futuro o desconocido en lugar de fallar cerrado)

    Las advertencias de doctor también incluyen orientación sobre cuentas predeterminadas para canales multicuenta:

    - Si se configuran dos o más entradas `channels.<channel>.accounts` sin `channels.<channel>.defaultAccount` ni `accounts.default`, doctor advierte que el enrutamiento de reserva puede elegir una cuenta inesperada.
    - Si `channels.<channel>.defaultAccount` se establece en un ID de cuenta desconocido, doctor advierte y lista los ID de cuenta configurados.

  </Accordion>
  <Accordion title="2b. Sobrescrituras del proveedor OpenCode">
    Si agregaste `models.providers.opencode`, `opencode-zen` u `opencode-go` manualmente, eso sobrescribe el catálogo integrado de OpenCode de `@mariozechner/pi-ai`. Eso puede forzar modelos hacia la API equivocada o poner los costos en cero. Doctor advierte para que puedas eliminar la sobrescritura y restaurar el enrutamiento por API y los costos por modelo.
  </Accordion>
  <Accordion title="2c. Migración del navegador y preparación para Chrome MCP">
    Si tu configuración del navegador todavía apunta a la ruta eliminada de la extensión de Chrome, doctor la normaliza al modelo actual de conexión Chrome MCP local al host:

    - `browser.profiles.*.driver: "extension"` se convierte en `"existing-session"`
    - `browser.relayBindHost` se elimina

    Doctor también audita la ruta Chrome MCP local al host cuando usas `defaultProfile: "user"` o un perfil `existing-session` configurado:

    - comprueba si Google Chrome está instalado en el mismo host para los perfiles predeterminados de conexión automática
    - comprueba la versión detectada de Chrome y advierte cuando está por debajo de Chrome 144
    - te recuerda habilitar la depuración remota en la página de inspección del navegador (por ejemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor no puede habilitar por ti la configuración del lado de Chrome. Chrome MCP local al host todavía requiere:

    - un navegador basado en Chromium 144+ en el host del gateway/nodo
    - el navegador ejecutándose localmente
    - depuración remota habilitada en ese navegador
    - aprobar el primer aviso de consentimiento de conexión en el navegador

    La preparación aquí solo trata sobre los requisitos previos de conexión local. Existing-session conserva los límites actuales de rutas de Chrome MCP; las rutas avanzadas como `responsebody`, la exportación a PDF, la interceptación de descargas y las acciones por lotes todavía requieren un navegador administrado o un perfil CDP sin procesar.

    Esta comprobación **no** se aplica a Docker, sandbox, remote-browser u otros flujos headless. Esos continúan usando CDP sin procesar.

  </Accordion>
  <Accordion title="2d. Requisitos previos de TLS para OAuth">
    Cuando se configura un perfil OAuth de OpenAI Codex, doctor sondea el endpoint de autorización de OpenAI para verificar que la pila TLS local de Node/OpenSSL pueda validar la cadena de certificados. Si el sondeo falla con un error de certificado (por ejemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado caducado o certificado autofirmado), doctor imprime orientación de corrección específica de la plataforma. En macOS con un Node de Homebrew, la corrección suele ser `brew postinstall ca-certificates`. Con `--deep`, el sondeo se ejecuta incluso si el gateway está correcto.
  </Accordion>
  <Accordion title="2e. Sobrescrituras del proveedor OAuth de Codex">
    Si antes agregaste ajustes heredados de transporte de OpenAI bajo `models.providers.openai-codex`, pueden ocultar la ruta integrada del proveedor OAuth de Codex que las versiones más recientes usan automáticamente. Doctor advierte cuando ve esos ajustes antiguos de transporte junto con OAuth de Codex para que puedas eliminar o reescribir la sobrescritura de transporte obsoleta y recuperar el comportamiento integrado de enrutamiento/reserva. Los proxies personalizados y las sobrescrituras solo de encabezados siguen siendo compatibles y no activan esta advertencia.
  </Accordion>
  <Accordion title="2f. Advertencias de rutas del plugin Codex">
    Cuando el plugin Codex incluido está habilitado, doctor también comprueba si las referencias de modelo primario `openai-codex/*` todavía se resuelven mediante el ejecutor PI predeterminado. Esa combinación es válida cuando quieres autenticación OAuth/suscripción de Codex mediante PI, pero es fácil confundirla con el arnés nativo de servidor de aplicación de Codex. Doctor advierte y señala la forma explícita de servidor de aplicación: `openai/*` más `agentRuntime.id: "codex"` u `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor no repara esto automáticamente porque ambas rutas son válidas:

    - `openai-codex/*` + PI significa "usar autenticación OAuth/suscripción de Codex mediante el ejecutor normal de OpenClaw."
    - `openai/*` + `runtime: "codex"` significa "ejecutar el turno incrustado mediante el servidor de aplicación nativo de Codex."
    - `/codex ...` significa "controlar o enlazar una conversación nativa de Codex desde el chat."
    - `/acp ...` o `runtime: "acp"` significa "usar el adaptador externo ACP/acpx."

    Si aparece la advertencia, elige la ruta que pretendías y edita la configuración manualmente. Mantén la advertencia tal cual cuando OAuth de PI Codex sea intencional.

  </Accordion>
  <Accordion title="3. Migraciones de estado heredado (diseño en disco)">
    Doctor puede migrar diseños antiguos en disco a la estructura actual:

    - Almacén de sesiones + transcripciones:
      - de `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directorio del agente:
      - de `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticación de WhatsApp (Baileys):
      - de `~/.openclaw/credentials/*.json` heredado (excepto `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de cuenta predeterminado: `default`)

    Estas migraciones son de mejor esfuerzo e idempotentes; doctor emitirá advertencias cuando deje carpetas heredadas como copias de seguridad. El Gateway/CLI también migra automáticamente las sesiones heredadas y el directorio del agente al iniciar, para que el historial, la autenticación y los modelos terminen en la ruta por agente sin una ejecución manual de doctor. La autenticación de WhatsApp se migra intencionalmente solo mediante `openclaw doctor`. La normalización del proveedor de conversación/mapa de proveedores ahora compara por igualdad estructural, por lo que las diferencias solo de orden de claves ya no activan cambios repetidos sin efecto de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migraciones de manifiestos de plugins heredados">
    Doctor escanea todos los manifiestos de plugins instalados en busca de claves de capacidad de nivel superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Cuando las encuentra, ofrece moverlas al objeto `contracts` y reescribir el archivo de manifiesto in situ. Esta migración es idempotente; si la clave `contracts` ya tiene los mismos valores, la clave heredada se elimina sin duplicar los datos.
  </Accordion>
  <Accordion title="3b. Migraciones de almacén Cron heredado">
    Doctor también comprueba el almacén de trabajos cron (`~/.openclaw/cron/jobs.json` de forma predeterminada, o `cron.store` cuando se sobrescribe) en busca de formas antiguas de trabajos que el planificador todavía acepta por compatibilidad.

    Las limpiezas actuales de cron incluyen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de payload de nivel superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nivel superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de entrega `provider` del payload → `delivery.channel` explícito
    - trabajos de reserva de webhook heredados simples `notify: true` → `delivery.mode="webhook"` explícito con `delivery.to=cron.webhook`

    Doctor solo migra automáticamente trabajos `notify: true` cuando puede hacerlo sin cambiar el comportamiento. Si un trabajo combina la reserva heredada de notificación con un modo de entrega existente que no es webhook, doctor advierte y deja ese trabajo para revisión manual.

  </Accordion>
  <Accordion title="3c. Limpieza de bloqueos de sesión">
    Doctor escanea todos los directorios de sesiones de agentes en busca de archivos de bloqueo de escritura obsoletos: archivos que quedan cuando una sesión terminó anómalamente. Para cada archivo de bloqueo encontrado informa: la ruta, el PID, si el PID sigue activo, la antigüedad del bloqueo y si se considera obsoleto (PID muerto o más antiguo que 30 minutos). En modo `--fix` / `--repair`, elimina automáticamente los archivos de bloqueo obsoletos; de lo contrario, imprime una nota y te indica volver a ejecutarlo con `--fix`.
  </Accordion>
  <Accordion title="3d. Reparación de ramas de transcripciones de sesión">
    Doctor escanea los archivos JSONL de sesiones de agentes en busca de la forma de rama duplicada creada por el error de reescritura de transcripciones de prompts de 2026.4.24: un turno de usuario abandonado con contexto de runtime interno de OpenClaw más un hermano activo que contiene el mismo prompt visible de usuario. En modo `--fix` / `--repair`, doctor hace una copia de seguridad de cada archivo afectado junto al original y reescribe la transcripción a la rama activa para que el historial del gateway y los lectores de memoria ya no vean turnos duplicados.
  </Accordion>
  <Accordion title="4. Comprobaciones de integridad de estado (persistencia de sesiones, enrutamiento y seguridad)">
    El directorio de estado es el tronco operativo. Si desaparece, pierdes sesiones, credenciales, registros y configuración (a menos que tengas copias de seguridad en otro lugar).

    Doctor comprueba:

    - **Directorio de estado faltante**: advierte sobre pérdida catastrófica de estado, solicita recrear el directorio y te recuerda que no puede recuperar datos faltantes.
    - **Permisos del directorio de estado**: verifica la capacidad de escritura; ofrece reparar permisos (y emite una sugerencia de `chown` cuando detecta una discrepancia de propietario/grupo).
    - **Directorio de estado sincronizado con la nube en macOS**: advierte cuando el estado se resuelve bajo iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...` porque las rutas respaldadas por sincronización pueden causar E/S más lenta y carreras de bloqueo/sincronización.
    - **Directorio de estado en SD o eMMC en Linux**: advierte cuando el estado se resuelve a una fuente de montaje `mmcblk*`, porque la E/S aleatoria respaldada por SD o eMMC puede ser más lenta y desgastarse más rápido bajo escrituras de sesiones y credenciales.
    - **Directorios de sesión faltantes**: `sessions/` y el directorio del almacén de sesiones son necesarios para persistir el historial y evitar bloqueos `ENOENT`.
    - **Discrepancia de transcripción**: advierte cuando entradas recientes de sesión tienen archivos de transcripción faltantes.
    - **Sesión principal "JSONL de 1 línea"**: marca cuando la transcripción principal tiene solo una línea (el historial no se está acumulando).
    - **Múltiples directorios de estado**: advierte cuando existen varias carpetas `~/.openclaw` en distintos directorios personales o cuando `OPENCLAW_STATE_DIR` apunta a otro lugar (el historial puede dividirse entre instalaciones).
    - **Recordatorio de modo remoto**: si `gateway.mode=remote`, doctor te recuerda ejecutarlo en el host remoto (el estado vive allí).
    - **Permisos del archivo de configuración**: advierte si `~/.openclaw/openclaw.json` es legible por grupo/mundo y ofrece ajustarlo a `600`.

  </Accordion>
  <Accordion title="5. Salud de autenticación de modelos (caducidad de OAuth)">
    Doctor inspecciona los perfiles OAuth en el almacén de autenticación, advierte cuando los tokens están por caducar o caducados, y puede actualizarlos cuando sea seguro. Si el perfil OAuth/token de Anthropic está obsoleto, sugiere una clave de API de Anthropic o la ruta de token de configuración de Anthropic. Los avisos de actualización solo aparecen cuando se ejecuta de forma interactiva (TTY); `--non-interactive` omite los intentos de actualización.

    Cuando una actualización de OAuth falla permanentemente (por ejemplo `refresh_token_reused`, `invalid_grant` o un proveedor que te indica iniciar sesión de nuevo), doctor informa que se requiere volver a autenticarse e imprime el comando exacto `openclaw models auth login --provider ...` que debes ejecutar.

    Doctor también informa perfiles de autenticación que son temporalmente inutilizables debido a:

    - tiempos de espera breves (límites de tasa/timeouts/fallos de autenticación)
    - deshabilitaciones más largas (fallos de facturación/crédito)

  </Accordion>
  <Accordion title="6. Validación del modelo de hooks">
    Si `hooks.gmail.model` está definido, doctor valida la referencia del modelo contra el catálogo y la allowlist, y advierte cuando no se pueda resolver o no esté permitida.
  </Accordion>
  <Accordion title="7. Reparación de imagen de sandbox">
    Cuando el sandboxing está habilitado, doctor comprueba las imágenes de Docker y ofrece compilarlas o cambiar a nombres heredados si falta la imagen actual.
  </Accordion>
  <Accordion title="7b. Dependencias de runtime de Plugins incluidos">
    Doctor verifica las dependencias de runtime solo para Plugins incluidos que están activos en la configuración actual o habilitados por el valor predeterminado de su manifiesto incluido; por ejemplo, `plugins.entries.discord.enabled: true`, el heredado `channels.discord.enabled: true`, `models.providers.*` configurados / referencias de modelos de agentes, o un Plugin incluido habilitado de forma predeterminada sin propiedad de proveedor. Si falta alguna, doctor informa los paquetes y los instala en modo `openclaw doctor --fix` / `openclaw doctor --repair`. Los Plugins externos siguen usando `openclaw plugins install` / `openclaw plugins update`; doctor no instala dependencias para rutas arbitrarias de Plugins.

    Durante la reparación de doctor, las instalaciones npm de dependencias de runtime incluidas informan progreso con spinner en sesiones TTY y progreso periódico por líneas en salidas canalizadas/sin interfaz. El Gateway y la CLI local también pueden reparar bajo demanda las dependencias de runtime de Plugins incluidos activos antes de importar un Plugin incluido. Estas instalaciones se limitan a la raíz de instalación del runtime del Plugin, se ejecutan con scripts deshabilitados, no escriben un package lock y están protegidas por un bloqueo de raíz de instalación para que inicios concurrentes de la CLI o del Gateway no muten el mismo árbol `node_modules` al mismo tiempo.

  </Accordion>
  <Accordion title="8. Migraciones de servicio Gateway y sugerencias de limpieza">
    Doctor detecta servicios Gateway heredados (launchd/systemd/schtasks) y ofrece eliminarlos e instalar el servicio de OpenClaw usando el puerto Gateway actual. También puede buscar servicios adicionales similares a Gateway e imprimir sugerencias de limpieza. Los servicios Gateway de OpenClaw con nombre de perfil se consideran de primera clase y no se marcan como "extra."

    En Linux, si falta el servicio Gateway de nivel de usuario pero existe un servicio Gateway de OpenClaw de nivel de sistema, doctor no instala automáticamente un segundo servicio de nivel de usuario. Inspecciona con `openclaw gateway status --deep` o `openclaw doctor --deep`, luego elimina el duplicado o define `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando un supervisor del sistema posee el ciclo de vida del Gateway.

  </Accordion>
  <Accordion title="8b. Migración de Startup Matrix">
    Cuando una cuenta de canal Matrix tiene una migración de estado heredado pendiente o accionable, doctor (en modo `--fix` / `--repair`) crea una instantánea previa a la migración y luego ejecuta los pasos de migración de mejor esfuerzo: migración de estado Matrix heredado y preparación de estado cifrado heredado. Ambos pasos no son fatales; los errores se registran y el arranque continúa. En modo de solo lectura (`openclaw doctor` sin `--fix`), esta comprobación se omite por completo.
  </Accordion>
  <Accordion title="8c. Emparejamiento de dispositivos y desviación de autenticación">
    Doctor ahora inspecciona el estado de emparejamiento de dispositivos como parte de la comprobación normal de salud.

    Lo que informa:

    - solicitudes pendientes de emparejamiento por primera vez
    - actualizaciones de rol pendientes para dispositivos ya emparejados
    - actualizaciones de alcance pendientes para dispositivos ya emparejados
    - reparaciones de discrepancia de clave pública donde el id del dispositivo aún coincide pero la identidad del dispositivo ya no coincide con el registro aprobado
    - registros emparejados sin un token activo para un rol aprobado
    - tokens emparejados cuyos alcances se desvían de la línea base de emparejamiento aprobada
    - entradas locales en caché de tokens de dispositivo para la máquina actual que son anteriores a una rotación de token del lado del Gateway o llevan metadatos de alcance obsoletos

    Doctor no aprueba automáticamente solicitudes de emparejamiento ni rota automáticamente tokens de dispositivo. En su lugar imprime los siguientes pasos exactos:

    - inspeccionar solicitudes pendientes con `openclaw devices list`
    - aprobar la solicitud exacta con `openclaw devices approve <requestId>`
    - rotar un token nuevo con `openclaw devices rotate --device <deviceId> --role <role>`
    - eliminar y volver a aprobar un registro obsoleto con `openclaw devices remove <deviceId>`

    Esto cierra el hueco común de "ya emparejado pero sigue pidiendo emparejamiento": doctor ahora distingue el emparejamiento por primera vez de las actualizaciones pendientes de rol/alcance y de la desviación de token/identidad del dispositivo obsoleta.

  </Accordion>
  <Accordion title="9. Advertencias de seguridad">
    Doctor emite advertencias cuando un proveedor está abierto a mensajes directos sin una allowlist, o cuando una política está configurada de forma peligrosa.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Si se ejecuta como servicio de usuario de systemd, doctor se asegura de que linger esté habilitado para que el Gateway siga activo después de cerrar sesión.
  </Accordion>
  <Accordion title="11. Estado del espacio de trabajo (Skills, Plugins y directorios heredados)">
    Doctor imprime un resumen del estado del espacio de trabajo para el agente predeterminado:

    - **Estado de Skills**: cuenta Skills elegibles, con requisitos faltantes y bloqueadas por allowlist.
    - **Directorios heredados del espacio de trabajo**: advierte cuando `~/openclaw` u otros directorios heredados del espacio de trabajo existen junto al espacio de trabajo actual.
    - **Estado de Plugins**: cuenta Plugins habilitados/deshabilitados/con error; lista los ID de Plugins para cualquier error; informa capacidades de Plugins de paquete.
    - **Advertencias de compatibilidad de Plugins**: marca Plugins que tienen problemas de compatibilidad con el runtime actual.
    - **Diagnósticos de Plugins**: muestra cualquier advertencia o error de carga emitido por el registro de Plugins.

  </Accordion>
  <Accordion title="11b. Tamaño de archivo de arranque">
    Doctor comprueba si los archivos de arranque del espacio de trabajo (por ejemplo `AGENTS.md`, `CLAUDE.md` u otros archivos de contexto inyectados) están cerca o por encima del presupuesto de caracteres configurado. Informa recuentos de caracteres por archivo sin procesar frente a inyectados, porcentaje de truncamiento, causa de truncamiento (`max/file` o `max/total`) y caracteres inyectados totales como fracción del presupuesto total. Cuando los archivos se truncan o están cerca del límite, doctor imprime consejos para ajustar `agents.defaults.bootstrapMaxChars` y `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpieza de Plugins de canal obsoletos">
    Cuando `openclaw doctor --fix` elimina un Plugin de canal faltante, también elimina la configuración colgante con alcance de canal que hacía referencia a ese Plugin: entradas `channels.<id>`, objetivos de Heartbeat que nombraban el canal y sobrescrituras `agents.*.models["<channel>/*"]`. Esto evita bucles de arranque del Gateway donde el runtime del canal ya no existe pero la configuración aún pide al Gateway que se vincule a él.
  </Accordion>
  <Accordion title="11c. Autocompletado de shell">
    Doctor comprueba si el autocompletado con tabulador está instalado para el shell actual (zsh, bash, fish o PowerShell):

    - Si el perfil del shell usa un patrón de autocompletado dinámico lento (`source <(openclaw completion ...)`), doctor lo actualiza a la variante más rápida de archivo en caché.
    - Si el autocompletado está configurado en el perfil pero falta el archivo de caché, doctor regenera la caché automáticamente.
    - Si no hay ningún autocompletado configurado, doctor solicita instalarlo (solo en modo interactivo; se omite con `--non-interactive`).

    Ejecuta `openclaw completion --write-state` para regenerar la caché manualmente.

  </Accordion>
  <Accordion title="12. Comprobaciones de autenticación de Gateway (token local)">
    Doctor comprueba la preparación de autenticación del token local del Gateway.

    - Si el modo de token necesita un token y no existe ninguna fuente de token, doctor ofrece generar uno.
    - Si `gateway.auth.token` está gestionado por SecretRef pero no está disponible, doctor advierte y no lo sobrescribe con texto sin formato.
    - `openclaw doctor --generate-gateway-token` fuerza la generación solo cuando no hay ningún SecretRef de token configurado.

  </Accordion>
  <Accordion title="12b. Reparaciones de solo lectura conscientes de SecretRef">
    Algunos flujos de reparación necesitan inspeccionar credenciales configuradas sin debilitar el comportamiento fail-fast del runtime.

    - `openclaw doctor --fix` ahora usa el mismo modelo de resumen SecretRef de solo lectura que los comandos de la familia de estado para reparaciones de configuración dirigidas.
    - Ejemplo: la reparación de Telegram `allowFrom` / `groupAllowFrom` `@username` intenta usar credenciales de bot configuradas cuando están disponibles.
    - Si el token del bot de Telegram está configurado mediante SecretRef pero no está disponible en la ruta del comando actual, doctor informa que la credencial está configurada pero no disponible y omite la resolución automática en lugar de fallar o informar erróneamente que falta el token.

  </Accordion>
  <Accordion title="13. Comprobación de salud del Gateway + reinicio">
    Doctor ejecuta una comprobación de salud y ofrece reiniciar el Gateway cuando parece no estar saludable.
  </Accordion>
  <Accordion title="13b. Preparación de búsqueda de memoria">
    Doctor comprueba si el proveedor configurado de embeddings para búsqueda de memoria está listo para el agente predeterminado. El comportamiento depende del backend y del proveedor configurados:

    - **Backend QMD**: prueba si el binario `qmd` está disponible y se puede iniciar. Si no, imprime orientación de corrección que incluye el paquete npm y una opción de ruta binaria manual.
    - **Proveedor local explícito**: comprueba si existe un archivo de modelo local o una URL de modelo remota/descargable reconocida. Si falta, sugiere cambiar a un proveedor remoto.
    - **Proveedor remoto explícito** (`openai`, `voyage`, etc.): verifica que haya una clave de API presente en el entorno o el almacén de autenticación. Imprime sugerencias de corrección accionables si falta.
    - **Proveedor automático**: comprueba primero la disponibilidad del modelo local y luego prueba cada proveedor remoto en el orden de selección automática.

    Cuando está disponible un resultado de prueba de Gateway en caché (el Gateway estaba saludable en el momento de la comprobación), doctor contrasta su resultado con la configuración visible para la CLI y señala cualquier discrepancia. Doctor no inicia un ping de embedding nuevo en la ruta predeterminada; usa el comando de estado profundo de memoria cuando quieras una comprobación en vivo del proveedor.

    Usa `openclaw memory status --deep` para verificar la preparación de embeddings en runtime.

  </Accordion>
  <Accordion title="14. Advertencias de estado de canales">
    Si el Gateway está saludable, doctor ejecuta una prueba de estado de canales e informa advertencias con correcciones sugeridas.
  </Accordion>
  <Accordion title="15. Auditoría y reparación de configuración de supervisor">
    Doctor comprueba la configuración instalada del supervisor (launchd/systemd/schtasks) en busca de valores predeterminados faltantes u obsoletos (por ejemplo, dependencias de systemd network-online y demora de reinicio). Cuando encuentra una discrepancia, recomienda una actualización y puede reescribir el archivo de servicio/tarea a los valores predeterminados actuales.

    Notas:

    - `openclaw doctor` solicita confirmación antes de reescribir la configuración del supervisor.
    - `openclaw doctor --yes` acepta las solicitudes de reparación predeterminadas.
    - `openclaw doctor --repair` aplica las correcciones recomendadas sin solicitudes.
    - `openclaw doctor --repair --force` sobrescribe configuraciones personalizadas del supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor en modo de solo lectura para el ciclo de vida del servicio de gateway. Sigue informando el estado del servicio y ejecutando reparaciones que no son de servicio, pero omite la instalación/inicio/reinicio/bootstrap del servicio, las reescrituras de configuración del supervisor y la limpieza de servicios heredados porque un supervisor externo es propietario de ese ciclo de vida.
    - En Linux, doctor no reescribe los metadatos de comando/entrypoint mientras la unidad systemd de gateway correspondiente está activa. También ignora unidades inactivas adicionales similares a gateway que no son heredadas durante el escaneo de servicios duplicados, para que los archivos de servicio complementarios no generen ruido de limpieza.
    - Si la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación/reparación del servicio de doctor valida el SecretRef, pero no conserva valores de token en texto plano resueltos en los metadatos de entorno del servicio supervisor.
    - Doctor detecta valores de entorno de servicio gestionados mediante `.env`/SecretRef que instalaciones antiguas de LaunchAgent, systemd o Windows Scheduled Task incrustaban en línea, y reescribe los metadatos del servicio para que esos valores se carguen desde la fuente de runtime en lugar de la definición del supervisor.
    - Doctor detecta cuando el comando del servicio aún fija un `--port` antiguo después de cambios en `gateway.port` y reescribe los metadatos del servicio al puerto actual.
    - Si la autenticación por token requiere un token y el SecretRef del token configurado no se puede resolver, doctor bloquea la ruta de instalación/reparación con orientación accionable.
    - Si `gateway.auth.token` y `gateway.auth.password` están configurados y `gateway.auth.mode` no está establecido, doctor bloquea la instalación/reparación hasta que el modo se establezca explícitamente.
    - Para unidades systemd de usuario en Linux, las comprobaciones de divergencia de token de doctor ahora incluyen fuentes `Environment=` y `EnvironmentFile=` al comparar metadatos de autenticación del servicio.
    - Las reparaciones de servicio de doctor se niegan a reescribir, detener o reiniciar un servicio de gateway desde un binario de OpenClaw anterior cuando la configuración fue escrita por última vez por una versión más reciente. Consulta [Solución de problemas de Gateway](/es/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Siempre puedes forzar una reescritura completa mediante `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos de runtime + puerto del Gateway">
    Doctor inspecciona el runtime del servicio (PID, último estado de salida) y advierte cuando el servicio está instalado, pero en realidad no está en ejecución. También comprueba colisiones de puerto en el puerto del gateway (predeterminado `18789`) e informa causas probables (gateway ya en ejecución, túnel SSH).
  </Accordion>
  <Accordion title="17. Buenas prácticas de runtime del Gateway">
    Doctor advierte cuando el servicio de gateway se ejecuta en Bun o en una ruta de Node gestionada por versiones (`nvm`, `fnm`, `volta`, `asdf`, etc.). Los canales de WhatsApp + Telegram requieren Node, y las rutas de gestores de versiones pueden romperse después de actualizaciones porque el servicio no carga tu inicialización de shell. Doctor ofrece migrar a una instalación de Node del sistema cuando está disponible (Homebrew/apt/choco).

    Los servicios recién instalados o reparados conservan raíces de entorno explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) y directorios estables de binarios de usuario, pero los directorios alternativos inferidos de gestores de versiones solo se escriben en el PATH del servicio cuando esos directorios existen en disco. Esto mantiene el PATH del supervisor generado alineado con la misma auditoría de PATH mínimo que doctor ejecuta después.

  </Accordion>
  <Accordion title="18. Escritura de configuración + metadatos del asistente">
    Doctor conserva cualquier cambio de configuración y marca los metadatos del asistente para registrar la ejecución de doctor.
  </Accordion>
  <Accordion title="19. Consejos de workspace (copia de seguridad + sistema de memoria)">
    Doctor sugiere un sistema de memoria de workspace cuando falta e imprime un consejo de copia de seguridad si el workspace aún no está bajo git.

    Consulta [/concepts/agent-workspace](/es/concepts/agent-workspace) para ver una guía completa sobre la estructura del workspace y la copia de seguridad con git (se recomienda GitHub o GitLab privado).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Runbook de Gateway](/es/gateway)
- [Solución de problemas de Gateway](/es/gateway/troubleshooting)
