---
read_when:
    - Agregar o modificar migraciones de doctor
    - Introducción de cambios incompatibles en la configuración
sidebarTitle: Doctor
summary: 'Comando doctor: comprobaciones de estado, migraciones de configuración y pasos de reparación'
title: Doctor
x-i18n:
    generated_at: "2026-04-30T05:41:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: c27b8e85eb0a577e676f0e6e205262775ff37303453e64fc1bc2adaf8b51147c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` es la herramienta de reparación + migración para OpenClaw. Corrige configuración/estado obsoletos, comprueba el estado y proporciona pasos de reparación accionables.

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

    Se ejecuta sin solicitudes y solo aplica migraciones seguras (normalización de configuración + movimientos de estado en disco). Omite acciones de reinicio/servicio/sandbox que requieren confirmación humana. Las migraciones de estado heredado se ejecutan automáticamente cuando se detectan.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Escanea servicios del sistema en busca de instalaciones adicionales del Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Si quieres revisar los cambios antes de escribir, abre primero el archivo de configuración:

```bash
cat ~/.openclaw/openclaw.json
```

## Qué hace (resumen)

<AccordionGroup>
  <Accordion title="Estado, UI y actualizaciones">
    - Actualización previa opcional para instalaciones de git (solo interactiva).
    - Comprobación de vigencia del protocolo de UI (reconstruye Control UI cuando el esquema de protocolo es más nuevo).
    - Comprobación de estado + solicitud de reinicio.
    - Resumen de estado de Skills (elegibles/faltantes/bloqueadas) y estado de plugins.

  </Accordion>
  <Accordion title="Configuración y migraciones">
    - Normalización de configuración para valores heredados.
    - Migración de configuración de Talk desde campos planos heredados `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Comprobaciones de migración de navegador para configuraciones heredadas de extensión de Chrome y preparación de Chrome MCP.
    - Advertencias de sobrescritura del proveedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Advertencias de sombreado de OAuth de Codex (`models.providers.openai-codex`).
    - Comprobación de prerrequisitos de TLS de OAuth para perfiles de OAuth de OpenAI Codex.
    - Migración de estado heredado en disco (sessions/agent dir/WhatsApp auth).
    - Migración de claves de contrato de manifiesto de plugin heredadas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migración de almacén Cron heredado (`jobId`, `schedule.cron`, campos de entrega/carga útil de nivel superior, `provider` de carga útil, trabajos de reserva de Webhook simples `notify: true`).
    - Migración heredada de política de runtime de agente a `agents.defaults.agentRuntime` y `agents.list[].agentRuntime`.
    - Limpieza de configuración obsoleta de plugins cuando los plugins están habilitados; cuando `plugins.enabled=false`, las referencias obsoletas a plugins se tratan como configuración de contención inerte y se conservan.

  </Accordion>
  <Accordion title="Estado e integridad">
    - Inspección de archivos de bloqueo de sesión y limpieza de bloqueos obsoletos.
    - Reparación de transcripciones de sesión para ramas duplicadas de reescritura de prompts creadas por builds afectados de 2026.4.24.
    - Comprobaciones de integridad de estado y permisos (sesiones, transcripciones, directorio de estado).
    - Comprobaciones de permisos del archivo de configuración (chmod 600) al ejecutarse localmente.
    - Estado de autenticación de modelos: comprueba la caducidad de OAuth, puede actualizar tokens que están por caducar e informa estados de enfriamiento/deshabilitación de perfiles de autenticación.
    - Detección de directorio de workspace adicional (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servicios y supervisores">
    - Reparación de imagen de sandbox cuando el sandboxing está habilitado.
    - Migración de servicios heredados y detección de Gateways adicionales.
    - Migración de estado heredado del canal Matrix (en modo `--fix` / `--repair`).
    - Comprobaciones de runtime del Gateway (servicio instalado pero no en ejecución; etiqueta launchd en caché).
    - Advertencias de estado de canales (probadas desde el Gateway en ejecución).
    - Auditoría de configuración de supervisor (launchd/systemd/schtasks) con reparación opcional.
    - Limpieza del entorno de proxy incrustado para servicios de Gateway que capturaron valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante la instalación o actualización.
    - Comprobaciones de buenas prácticas del runtime del Gateway (Node frente a Bun, rutas de gestores de versiones).
    - Diagnósticos de colisión de puerto del Gateway (predeterminado `18789`).

  </Accordion>
  <Accordion title="Autenticación, seguridad y emparejamiento">
    - Advertencias de seguridad para políticas de DM abiertas.
    - Comprobaciones de autenticación del Gateway para modo de token local (ofrece generación de token cuando no existe ninguna fuente de token; no sobrescribe configuraciones SecretRef de token).
    - Detección de problemas de emparejamiento de dispositivos (solicitudes pendientes de primer emparejamiento, actualizaciones pendientes de rol/alcance, deriva de caché local obsoleta de token de dispositivo y deriva de autenticación de registros emparejados).

  </Accordion>
  <Accordion title="Workspace y shell">
    - Comprobación de systemd linger en Linux.
    - Comprobación de tamaño del archivo de bootstrap del workspace (advertencias de truncamiento/cercanía al límite para archivos de contexto).
    - Comprobación de estado de autocompletado de shell e instalación/actualización automática.
    - Comprobación de preparación del proveedor de embeddings de búsqueda de memoria (modelo local, clave de API remota o binario QMD).
    - Comprobaciones de instalación desde código fuente (desajuste de workspace pnpm, assets de UI faltantes, binario tsx faltante).
    - Escribe configuración actualizada + metadatos del asistente.

  </Accordion>
</AccordionGroup>

## Relleno y restablecimiento de la UI de Dreams

La escena Dreams de Control UI incluye acciones **Rellenar**, **Restablecer** y **Limpiar fundamentadas** para el flujo de trabajo de Dreaming fundamentado. Estas acciones usan métodos RPC de estilo Gateway doctor, pero **no** forman parte de la reparación/migración de la CLI `openclaw doctor`.

Qué hacen:

- **Rellenar** escanea archivos históricos `memory/YYYY-MM-DD.md` en el workspace activo, ejecuta la pasada de diario REM fundamentada y escribe entradas de relleno reversibles en `DREAMS.md`.
- **Restablecer** elimina solo esas entradas de diario de relleno marcadas de `DREAMS.md`.
- **Limpiar fundamentadas** elimina solo entradas provisionales de corto plazo, solo fundamentadas, que provinieron de la reproducción histórica y aún no han acumulado recuperación en vivo ni respaldo diario.

Qué **no** hacen por sí mismas:

- no editan `MEMORY.md`
- no ejecutan migraciones completas de doctor
- no preparan automáticamente candidatos fundamentados en el almacén de promoción de corto plazo en vivo a menos que ejecutes explícitamente primero la ruta CLI preparada

Si quieres que la reproducción histórica fundamentada influya en el carril normal de promoción profunda, usa en su lugar el flujo de CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Eso prepara candidatos duraderos fundamentados en el almacén de Dreaming de corto plazo mientras mantiene `DREAMS.md` como superficie de revisión.

## Comportamiento detallado y justificación

<AccordionGroup>
  <Accordion title="0. Actualización opcional (instalaciones de git)">
    Si esto es un checkout de git y doctor se está ejecutando interactivamente, ofrece actualizar (fetch/rebase/build) antes de ejecutar doctor.
  </Accordion>
  <Accordion title="1. Normalización de configuración">
    Si la configuración contiene formas de valores heredadas (por ejemplo `messages.ackReaction` sin una sobrescritura específica del canal), doctor las normaliza al esquema actual.

    Eso incluye campos planos heredados de Talk. La configuración pública actual de Talk es `talk.provider` + `talk.providers.<provider>`. Doctor reescribe formas antiguas `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` al mapa de proveedores.

  </Accordion>
  <Accordion title="2. Migraciones de claves de configuración heredadas">
    Cuando la configuración contiene claves obsoletas, otros comandos se niegan a ejecutarse y te piden que ejecutes `openclaw doctor`.

    Doctor hará lo siguiente:

    - Explicar qué claves heredadas se encontraron.
    - Mostrar la migración que aplicó.
    - Reescribir `~/.openclaw/openclaw.json` con el esquema actualizado.

    El Gateway también ejecuta automáticamente migraciones de doctor al iniciar cuando detecta un formato de configuración heredado, de modo que las configuraciones obsoletas se reparan sin intervención manual. Las migraciones del almacén de trabajos Cron las gestiona `openclaw doctor --fix`.

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
    - Para canales con `accounts` nombradas pero valores de canal de nivel superior de una sola cuenta persistentes, mueve esos valores con alcance de cuenta a la cuenta promovida elegida para ese canal (`accounts.default` para la mayoría de los canales; Matrix puede preservar un destino nombrado/predeterminado coincidente existente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - elimina `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` para tiempos de espera de proveedor/modelo lentos
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - elimina `browser.relayBindHost` (configuración heredada de relé de extensión)
    - `models.providers.*.api: "openai"` heredado → `"openai-completions"` (el arranque del Gateway también omite proveedores cuyo `api` esté configurado con un valor enum futuro o desconocido en lugar de fallar cerrado)

    Las advertencias de doctor también incluyen orientación sobre cuentas predeterminadas para canales con múltiples cuentas:

    - Si dos o más entradas `channels.<channel>.accounts` están configuradas sin `channels.<channel>.defaultAccount` o `accounts.default`, doctor advierte que el enrutamiento de reserva puede elegir una cuenta inesperada.
    - Si `channels.<channel>.defaultAccount` está configurado con un ID de cuenta desconocido, doctor advierte y lista los ID de cuenta configurados.

  </Accordion>
  <Accordion title="2b. Anulaciones del proveedor OpenCode">
    Si has añadido `models.providers.opencode`, `opencode-zen` u `opencode-go` manualmente, esto anula el catálogo OpenCode integrado de `@mariozechner/pi-ai`. Eso puede forzar modelos hacia la API incorrecta o dejar los costes en cero. doctor advierte para que puedas eliminar la anulación y restaurar el enrutamiento de API por modelo + los costes.
  </Accordion>
  <Accordion title="2c. Migración del navegador y preparación de Chrome MCP">
    Si tu configuración del navegador todavía apunta a la ruta eliminada de la extensión de Chrome, doctor la normaliza al modelo actual de conexión Chrome MCP local al host:

    - `browser.profiles.*.driver: "extension"` pasa a ser `"existing-session"`
    - `browser.relayBindHost` se elimina

    doctor también audita la ruta Chrome MCP local al host cuando usas `defaultProfile: "user"` o un perfil `existing-session` configurado:

    - comprueba si Google Chrome está instalado en el mismo host para los perfiles predeterminados de conexión automática
    - comprueba la versión de Chrome detectada y advierte cuando es inferior a Chrome 144
    - te recuerda que habilites la depuración remota en la página de inspección del navegador (por ejemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    doctor no puede habilitar por ti la opción del lado de Chrome. Chrome MCP local al host todavía requiere:

    - un navegador basado en Chromium 144+ en el host del gateway/nodo
    - el navegador ejecutándose localmente
    - depuración remota habilitada en ese navegador
    - aprobar el primer aviso de consentimiento de conexión en el navegador

    La preparación aquí solo trata los requisitos previos de conexión local. Existing-session mantiene los límites de ruta actuales de Chrome MCP; las rutas avanzadas como `responsebody`, exportación a PDF, interceptación de descargas y acciones por lotes todavía requieren un navegador gestionado o un perfil CDP sin procesar.

    Esta comprobación **no** se aplica a Docker, sandbox, remote-browser ni otros flujos sin interfaz. Esos siguen usando CDP sin procesar.

  </Accordion>
  <Accordion title="2d. Requisitos previos de TLS para OAuth">
    Cuando se configura un perfil OAuth de OpenAI Codex, doctor sondea el endpoint de autorización de OpenAI para verificar que la pila TLS local de Node/OpenSSL pueda validar la cadena de certificados. Si el sondeo falla con un error de certificado (por ejemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado caducado o certificado autofirmado), doctor imprime orientación de corrección específica de la plataforma. En macOS con un Node de Homebrew, la corrección suele ser `brew postinstall ca-certificates`. Con `--deep`, el sondeo se ejecuta incluso si el Gateway está sano.
  </Accordion>
  <Accordion title="2e. Anulaciones del proveedor OAuth de Codex">
    Si anteriormente añadiste opciones de transporte heredadas de OpenAI bajo `models.providers.openai-codex`, pueden eclipsar la ruta integrada del proveedor OAuth de Codex que las versiones más recientes usan automáticamente. doctor advierte cuando ve esas opciones de transporte antiguas junto a OAuth de Codex para que puedas eliminar o reescribir la anulación de transporte obsoleta y recuperar el comportamiento integrado de enrutamiento/respaldo. Los proxies personalizados y las anulaciones solo de encabezados siguen siendo compatibles y no activan esta advertencia.
  </Accordion>
  <Accordion title="2f. Advertencias de ruta del Plugin Codex">
    Cuando el Plugin Codex incluido está habilitado, doctor también comprueba si las referencias de modelo principal `openai-codex/*` todavía se resuelven mediante el ejecutor PI predeterminado. Esa combinación es válida cuando quieres autenticación OAuth/suscripción de Codex mediante PI, pero es fácil confundirla con el arnés nativo del servidor de aplicación de Codex. doctor advierte y apunta a la forma explícita de servidor de aplicación: `openai/*` más `agentRuntime.id: "codex"` u `OPENCLAW_AGENT_RUNTIME=codex`.

    doctor no repara esto automáticamente porque ambas rutas son válidas:

    - `openai-codex/*` + PI significa "usar autenticación OAuth/suscripción de Codex mediante el ejecutor normal de OpenClaw."
    - `openai/*` + `runtime: "codex"` significa "ejecutar el turno incrustado mediante el servidor de aplicación nativo de Codex."
    - `/codex ...` significa "controlar o vincular una conversación nativa de Codex desde el chat."
    - `/acp ...` o `runtime: "acp"` significa "usar el adaptador externo ACP/acpx."

    Si aparece la advertencia, elige la ruta que pretendías y edita la configuración manualmente. Mantén la advertencia tal cual cuando PI Codex OAuth sea intencional.

  </Accordion>
  <Accordion title="3. Migraciones de estado heredado (diseño en disco)">
    doctor puede migrar diseños antiguos en disco a la estructura actual:

    - Almacén de sesiones + transcripciones:
      - de `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directorio del agente:
      - de `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticación de WhatsApp (Baileys):
      - desde el heredado `~/.openclaw/credentials/*.json` (excepto `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (id de cuenta predeterminado: `default`)

    Estas migraciones son de mejor esfuerzo e idempotentes; doctor emitirá advertencias cuando deje carpetas heredadas como copias de seguridad. El Gateway/CLI también migra automáticamente el almacén de sesiones heredado + el directorio del agente al iniciar, para que el historial/autenticación/modelos lleguen a la ruta por agente sin una ejecución manual de doctor. La autenticación de WhatsApp se migra intencionalmente solo mediante `openclaw doctor`. La normalización de proveedores/mapa de proveedores de conversación ahora compara por igualdad estructural, por lo que las diferencias solo de orden de claves ya no activan cambios repetidos sin efecto de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migraciones de manifiestos Plugin heredados">
    doctor escanea todos los manifiestos Plugin instalados en busca de claves de capacidad de nivel superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Cuando las encuentra, ofrece moverlas al objeto `contracts` y reescribir el archivo de manifiesto en el sitio. Esta migración es idempotente; si la clave `contracts` ya tiene los mismos valores, la clave heredada se elimina sin duplicar los datos.
  </Accordion>
  <Accordion title="3b. Migraciones de almacenes Cron heredados">
    doctor también comprueba el almacén de trabajos Cron (`~/.openclaw/cron/jobs.json` de forma predeterminada, o `cron.store` cuando se anula) en busca de formas de trabajo antiguas que el programador todavía acepta por compatibilidad.

    Las limpiezas Cron actuales incluyen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de carga útil de nivel superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nivel superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de entrega `provider` de la carga útil → `delivery.channel` explícito
    - trabajos heredados simples de respaldo de Webhook `notify: true` → `delivery.mode="webhook"` explícito con `delivery.to=cron.webhook`

    doctor solo migra automáticamente trabajos `notify: true` cuando puede hacerlo sin cambiar el comportamiento. Si un trabajo combina el respaldo heredado de notificación con un modo de entrega existente que no es Webhook, doctor advierte y deja ese trabajo para revisión manual.

  </Accordion>
  <Accordion title="3c. Limpieza de bloqueos de sesión">
    doctor escanea cada directorio de sesión de agente en busca de archivos de bloqueo de escritura obsoletos: archivos que quedan cuando una sesión finalizó de forma anómala. Por cada archivo de bloqueo encontrado informa: la ruta, PID, si el PID sigue activo, antigüedad del bloqueo y si se considera obsoleto (PID muerto o más antiguo que 30 minutos). En modo `--fix` / `--repair`, elimina automáticamente los archivos de bloqueo obsoletos; de lo contrario imprime una nota y te indica que vuelvas a ejecutarlo con `--fix`.
  </Accordion>
  <Accordion title="3d. Reparación de ramas de transcripción de sesión">
    doctor escanea archivos JSONL de sesiones de agente en busca de la forma de rama duplicada creada por el error de reescritura de transcripciones de prompts de 2026.4.24: un turno de usuario abandonado con contexto de runtime interno de OpenClaw más un hermano activo que contiene el mismo prompt visible del usuario. En modo `--fix` / `--repair`, doctor crea una copia de seguridad de cada archivo afectado junto al original y reescribe la transcripción a la rama activa para que el historial del gateway y los lectores de memoria ya no vean turnos duplicados.
  </Accordion>
  <Accordion title="4. Comprobaciones de integridad del estado (persistencia de sesión, enrutamiento y seguridad)">
    El directorio de estado es el tronco encefálico operativo. Si desaparece, pierdes sesiones, credenciales, registros y configuración (a menos que tengas copias de seguridad en otro lugar).

    doctor comprueba:

    - **Directorio de estado faltante**: advierte sobre pérdida catastrófica de estado, solicita recrear el directorio y te recuerda que no puede recuperar datos faltantes.
    - **Permisos del directorio de estado**: verifica la capacidad de escritura; ofrece reparar permisos (y emite una sugerencia de `chown` cuando detecta una discrepancia de propietario/grupo).
    - **Directorio de estado sincronizado con la nube en macOS**: advierte cuando el estado se resuelve bajo iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...` porque las rutas respaldadas por sincronización pueden causar E/S más lenta y carreras de bloqueo/sincronización.
    - **Directorio de estado en SD o eMMC en Linux**: advierte cuando el estado se resuelve a una fuente de montaje `mmcblk*`, porque la E/S aleatoria respaldada por SD o eMMC puede ser más lenta y desgastarse más rápido con escrituras de sesiones y credenciales.
    - **Directorios de sesión faltantes**: `sessions/` y el directorio del almacén de sesiones son necesarios para persistir el historial y evitar fallos `ENOENT`.
    - **Discrepancia de transcripción**: advierte cuando entradas de sesión recientes tienen archivos de transcripción faltantes.
    - **Sesión principal "JSONL de 1 línea"**: marca cuando la transcripción principal tiene solo una línea (el historial no se está acumulando).
    - **Múltiples directorios de estado**: advierte cuando existen varias carpetas `~/.openclaw` en distintos directorios de inicio o cuando `OPENCLAW_STATE_DIR` apunta a otro lugar (el historial puede dividirse entre instalaciones).
    - **Recordatorio de modo remoto**: si `gateway.mode=remote`, doctor te recuerda ejecutarlo en el host remoto (el estado vive allí).
    - **Permisos del archivo de configuración**: advierte si `~/.openclaw/openclaw.json` es legible por grupo/todo el mundo y ofrece ajustarlo a `600`.

  </Accordion>
  <Accordion title="5. Salud de autenticación de modelos (caducidad de OAuth)">
    doctor inspecciona los perfiles OAuth en el almacén de autenticación, advierte cuando los tokens están por caducar o caducados, y puede actualizarlos cuando es seguro. Si el perfil OAuth/token de Anthropic está obsoleto, sugiere una clave API de Anthropic o la ruta de token de configuración de Anthropic. Los prompts de actualización solo aparecen cuando se ejecuta interactivamente (TTY); `--non-interactive` omite los intentos de actualización.

    Cuando una actualización OAuth falla de forma permanente (por ejemplo `refresh_token_reused`, `invalid_grant` o un proveedor que te indica iniciar sesión de nuevo), doctor informa que se requiere volver a autenticar e imprime el comando exacto `openclaw models auth login --provider ...` que debes ejecutar.

    doctor también informa perfiles de autenticación temporalmente inutilizables por:

    - tiempos de espera breves (límites de tasa/timeouts/fallos de autenticación)
    - deshabilitaciones más largas (fallos de facturación/crédito)

  </Accordion>
  <Accordion title="6. Validación del modelo de hooks">
    Si `hooks.gmail.model` está definido, doctor valida la referencia del modelo frente al catálogo y la lista de permitidos, y advierte cuando no se resolverá o está desautorizada.
  </Accordion>
  <Accordion title="7. Reparación de imagen de sandbox">
    Cuando el sandboxing está habilitado, doctor comprueba imágenes de Docker y ofrece compilar o cambiar a nombres heredados si falta la imagen actual.
  </Accordion>
  <Accordion title="7b. Dependencias de runtime de Plugins incluidos">
    doctor verifica las dependencias de runtime solo para Plugins incluidos que están activos en la configuración actual o habilitados por el valor predeterminado de su manifiesto incluido, por ejemplo `plugins.entries.discord.enabled: true`, el heredado `channels.discord.enabled: true`, `models.providers.*` configurados / referencias de modelo de agente, o un Plugin incluido habilitado de forma predeterminada sin propiedad de proveedor. Si falta alguna, doctor informa los paquetes y los instala en modo `openclaw doctor --fix` / `openclaw doctor --repair`. Los Plugins externos siguen usando `openclaw plugins install` / `openclaw plugins update`; doctor no instala dependencias para rutas arbitrarias de Plugins.

    Durante la reparación de doctor, las instalaciones npm de dependencias de tiempo de ejecución incluidas muestran progreso con spinner en sesiones TTY y progreso periódico por líneas en salidas canalizadas/headless. El Gateway y la CLI local también pueden reparar bajo demanda las dependencias activas de tiempo de ejecución de plugins incluidos antes de importar un plugin incluido. Estas instalaciones se limitan a la raíz de instalación de tiempo de ejecución del plugin, se ejecutan con scripts deshabilitados, no escriben un bloqueo de paquetes y están protegidas por un bloqueo de raíz de instalación para que los inicios concurrentes de la CLI o el Gateway no muten el mismo árbol `node_modules` al mismo tiempo.

  </Accordion>
  <Accordion title="8. Migraciones del servicio Gateway y sugerencias de limpieza">
    Doctor detecta servicios gateway heredados (launchd/systemd/schtasks) y ofrece eliminarlos e instalar el servicio OpenClaw usando el puerto gateway actual. También puede buscar servicios adicionales similares a gateway e imprimir sugerencias de limpieza. Los servicios gateway de OpenClaw con nombre de perfil se consideran de primera clase y no se marcan como "adicionales".

    En Linux, si falta el servicio gateway de nivel de usuario pero existe un servicio gateway de OpenClaw de nivel de sistema, doctor no instala automáticamente un segundo servicio de nivel de usuario. Inspecciona con `openclaw gateway status --deep` u `openclaw doctor --deep`, luego elimina el duplicado o define `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando un supervisor del sistema gestiona el ciclo de vida del gateway.

  </Accordion>
  <Accordion title="8b. Migración de inicio de Matrix">
    Cuando una cuenta de canal Matrix tiene una migración de estado heredada pendiente o accionable, doctor (en modo `--fix` / `--repair`) crea una instantánea previa a la migración y luego ejecuta los pasos de migración de mejor esfuerzo: migración de estado heredado de Matrix y preparación de estado cifrado heredado. Ambos pasos no son fatales; los errores se registran y el inicio continúa. En modo de solo lectura (`openclaw doctor` sin `--fix`) esta comprobación se omite por completo.
  </Accordion>
  <Accordion title="8c. Emparejamiento de dispositivos y deriva de autenticación">
    Doctor ahora inspecciona el estado de emparejamiento de dispositivos como parte de la revisión de salud normal.

    Lo que informa:

    - solicitudes de emparejamiento inicial pendientes
    - actualizaciones de rol pendientes para dispositivos ya emparejados
    - actualizaciones de alcance pendientes para dispositivos ya emparejados
    - reparaciones de discrepancia de clave pública donde el id del dispositivo aún coincide pero la identidad del dispositivo ya no coincide con el registro aprobado
    - registros emparejados a los que les falta un token activo para un rol aprobado
    - tokens emparejados cuyos alcances se desvían de la línea base de emparejamiento aprobada
    - entradas locales en caché de token de dispositivo para la máquina actual que son anteriores a una rotación de token del lado del gateway o llevan metadatos de alcance obsoletos

    Doctor no aprueba automáticamente solicitudes de emparejamiento ni rota automáticamente tokens de dispositivo. En su lugar, imprime los pasos exactos siguientes:

    - inspecciona solicitudes pendientes con `openclaw devices list`
    - aprueba la solicitud exacta con `openclaw devices approve <requestId>`
    - rota un token nuevo con `openclaw devices rotate --device <deviceId> --role <role>`
    - elimina y vuelve a aprobar un registro obsoleto con `openclaw devices remove <deviceId>`

    Esto cierra el caso común de "already paired but still getting pairing required": doctor ahora distingue el emparejamiento inicial de las actualizaciones pendientes de rol/alcance y de la deriva de token/identidad de dispositivo obsoletos.

  </Accordion>
  <Accordion title="9. Advertencias de seguridad">
    Doctor emite advertencias cuando un proveedor está abierto a mensajes directos sin una lista de permitidos, o cuando una política está configurada de forma peligrosa.
  </Accordion>
  <Accordion title="10. Permanencia de systemd (Linux)">
    Si se ejecuta como servicio de usuario de systemd, doctor se asegura de que la permanencia esté habilitada para que el gateway siga activo después de cerrar sesión.
  </Accordion>
  <Accordion title="11. Estado del espacio de trabajo (skills, plugins y directorios heredados)">
    Doctor imprime un resumen del estado del espacio de trabajo para el agente predeterminado:

    - **Estado de Skills**: cuenta skills elegibles, con requisitos faltantes y bloqueadas por lista de permitidos.
    - **Directorios de espacio de trabajo heredados**: advierte cuando `~/openclaw` u otros directorios de espacio de trabajo heredados existen junto al espacio de trabajo actual.
    - **Estado de Plugin**: cuenta plugins habilitados/deshabilitados/con errores; enumera los ID de plugin para cualquier error; informa las capacidades de plugins incluidos.
    - **Advertencias de compatibilidad de Plugin**: marca plugins que tienen problemas de compatibilidad con el tiempo de ejecución actual.
    - **Diagnósticos de Plugin**: muestra cualquier advertencia o error de tiempo de carga emitido por el registro de plugins.

  </Accordion>
  <Accordion title="11b. Tamaño del archivo de bootstrap">
    Doctor comprueba si los archivos de bootstrap del espacio de trabajo (por ejemplo `AGENTS.md`, `CLAUDE.md` u otros archivos de contexto inyectado) están cerca o por encima del presupuesto de caracteres configurado. Informa los recuentos de caracteres sin procesar frente a inyectados por archivo, el porcentaje de truncamiento, la causa de truncamiento (`max/file` o `max/total`) y el total de caracteres inyectados como fracción del presupuesto total. Cuando los archivos se truncan o están cerca del límite, doctor imprime consejos para ajustar `agents.defaults.bootstrapMaxChars` y `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpieza de plugins de canal obsoletos">
    Cuando `openclaw doctor --fix` elimina un plugin de canal faltante, también elimina la configuración colgante con alcance de canal que hacía referencia a ese plugin: entradas `channels.<id>`, destinos de Heartbeat que nombraban el canal y anulaciones `agents.*.models["<channel>/*"]`. Esto evita bucles de arranque del Gateway donde el tiempo de ejecución del canal ya no existe pero la configuración aún solicita al gateway enlazarse a él.
  </Accordion>
  <Accordion title="11c. Autocompletado de shell">
    Doctor comprueba si el autocompletado con tabulación está instalado para la shell actual (zsh, bash, fish o PowerShell):

    - Si el perfil de shell usa un patrón de autocompletado dinámico lento (`source <(openclaw completion ...)`), doctor lo actualiza a la variante más rápida de archivo en caché.
    - Si el autocompletado está configurado en el perfil pero falta el archivo de caché, doctor regenera la caché automáticamente.
    - Si no hay ningún autocompletado configurado, doctor solicita instalarlo (solo en modo interactivo; se omite con `--non-interactive`).

    Ejecuta `openclaw completion --write-state` para regenerar la caché manualmente.

  </Accordion>
  <Accordion title="12. Comprobaciones de autenticación del Gateway (token local)">
    Doctor comprueba la preparación de autenticación con token del gateway local.

    - Si el modo token necesita un token y no existe ninguna fuente de token, doctor ofrece generar uno.
    - Si `gateway.auth.token` está gestionado por SecretRef pero no está disponible, doctor advierte y no lo sobrescribe con texto plano.
    - `openclaw doctor --generate-gateway-token` fuerza la generación solo cuando no está configurado ningún SecretRef de token.

  </Accordion>
  <Accordion title="12b. Reparaciones de solo lectura conscientes de SecretRef">
    Algunos flujos de reparación necesitan inspeccionar credenciales configuradas sin debilitar el comportamiento de fallo rápido del tiempo de ejecución.

    - `openclaw doctor --fix` ahora usa el mismo modelo de resumen de SecretRef de solo lectura que los comandos de la familia de estado para reparaciones de configuración específicas.
    - Ejemplo: la reparación de `allowFrom` / `groupAllowFrom` `@username` de Telegram intenta usar las credenciales del bot configuradas cuando están disponibles.
    - Si el token del bot de Telegram está configurado mediante SecretRef pero no está disponible en la ruta de comando actual, doctor informa que la credencial está configurada pero no disponible y omite la resolución automática en lugar de fallar o informar erróneamente que falta el token.

  </Accordion>
  <Accordion title="13. Comprobación de salud del Gateway + reinicio">
    Doctor ejecuta una comprobación de salud y ofrece reiniciar el gateway cuando parece no estar saludable.
  </Accordion>
  <Accordion title="13b. Preparación de búsqueda de memoria">
    Doctor comprueba si el proveedor configurado de embeddings de búsqueda de memoria está listo para el agente predeterminado. El comportamiento depende del backend y proveedor configurados:

    - **Backend QMD**: prueba si el binario `qmd` está disponible y puede iniciarse. Si no, imprime orientación de corrección que incluye el paquete npm y una opción de ruta manual al binario.
    - **Proveedor local explícito**: comprueba si hay un archivo de modelo local o una URL reconocida de modelo remoto/descargable. Si falta, sugiere cambiar a un proveedor remoto.
    - **Proveedor remoto explícito** (`openai`, `voyage`, etc.): verifica que haya una clave de API presente en el entorno o en el almacén de autenticación. Imprime sugerencias de corrección accionables si falta.
    - **Proveedor automático**: comprueba primero la disponibilidad del modelo local y luego prueba cada proveedor remoto en el orden de selección automática.

    Cuando hay disponible un resultado de prueba del gateway en caché (el gateway estaba saludable en el momento de la comprobación), doctor cruza su resultado con la configuración visible para la CLI y señala cualquier discrepancia. Doctor no inicia un ping nuevo de embeddings en la ruta predeterminada; usa el comando de estado profundo de memoria cuando quieras una comprobación en vivo del proveedor.

    Usa `openclaw memory status --deep` para verificar la preparación de embeddings en tiempo de ejecución.

  </Accordion>
  <Accordion title="14. Advertencias de estado de canal">
    Si el gateway está saludable, doctor ejecuta una prueba de estado de canal e informa advertencias con correcciones sugeridas.
  </Accordion>
  <Accordion title="15. Auditoría y reparación de configuración del supervisor">
    Doctor comprueba la configuración del supervisor instalada (launchd/systemd/schtasks) en busca de valores predeterminados faltantes u obsoletos (por ejemplo, dependencias de systemd de network-online y retraso de reinicio). Cuando encuentra una discrepancia, recomienda una actualización y puede reescribir el archivo de servicio/tarea a los valores predeterminados actuales.

    Notas:

    - `openclaw doctor` solicita confirmación antes de reescribir la configuración del supervisor.
    - `openclaw doctor --yes` acepta los prompts de reparación predeterminados.
    - `openclaw doctor --repair` aplica las correcciones recomendadas sin prompts.
    - `openclaw doctor --repair --force` sobrescribe configuraciones personalizadas del supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor en solo lectura para el ciclo de vida del servicio gateway. Aún informa la salud del servicio y ejecuta reparaciones que no son de servicio, pero omite instalación/inicio/reinicio/bootstrap de servicio, reescrituras de configuración del supervisor y limpieza de servicios heredados porque un supervisor externo gestiona ese ciclo de vida.
    - En Linux, doctor no reescribe metadatos de comando/punto de entrada mientras la unidad gateway de systemd correspondiente está activa. También ignora unidades adicionales similares a gateway inactivas no heredadas durante el escaneo de servicios duplicados para que los archivos de servicio complementarios no generen ruido de limpieza.
    - Si la autenticación con token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación/reparación del servicio por doctor valida el SecretRef pero no persiste valores de token en texto plano resueltos en los metadatos de entorno del servicio supervisor.
    - Doctor detecta valores de entorno de servicio gestionados respaldados por `.env`/SecretRef que instalaciones antiguas de LaunchAgent, systemd o Windows Scheduled Task incrustaron en línea y reescribe los metadatos del servicio para que esos valores se carguen desde la fuente de tiempo de ejecución en lugar de la definición del supervisor.
    - Doctor detecta cuando el comando del servicio todavía fija un `--port` antiguo después de cambios en `gateway.port` y reescribe los metadatos del servicio al puerto actual.
    - Si la autenticación con token requiere un token y el SecretRef de token configurado no está resuelto, doctor bloquea la ruta de instalación/reparación con orientación accionable.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, doctor bloquea la instalación/reparación hasta que el modo se defina explícitamente.
    - Para unidades user-systemd de Linux, las comprobaciones de deriva de token de doctor ahora incluyen fuentes `Environment=` y `EnvironmentFile=` al comparar los metadatos de autenticación del servicio.
    - Las reparaciones de servicio de doctor se niegan a reescribir, detener o reiniciar un servicio gateway desde un binario OpenClaw antiguo cuando la configuración fue escrita por última vez por una versión más nueva. Consulta [Solución de problemas del Gateway](/es/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Siempre puedes forzar una reescritura completa mediante `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos del runtime del Gateway + puertos">
    Doctor inspecciona el runtime del servicio (PID, último estado de salida) y advierte cuando el servicio está instalado pero no se está ejecutando realmente. También comprueba si hay colisiones de puertos en el puerto del gateway (predeterminado `18789`) e informa de las causas probables (gateway ya en ejecución, túnel SSH).
  </Accordion>
  <Accordion title="17. Buenas prácticas del runtime del Gateway">
    Doctor advierte cuando el servicio de gateway se ejecuta en Bun o en una ruta de Node gestionada por versiones (`nvm`, `fnm`, `volta`, `asdf`, etc.). Los canales de WhatsApp + Telegram requieren Node, y las rutas de gestores de versiones pueden romperse después de las actualizaciones porque el servicio no carga la inicialización de tu shell. Doctor ofrece migrar a una instalación de Node del sistema cuando está disponible (Homebrew/apt/choco).

    Los servicios recién instalados o reparados conservan raíces de entorno explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) y directorios user-bin estables, pero los directorios de reserva de gestores de versiones deducidos solo se escriben en el PATH del servicio cuando esos directorios existen en el disco. Esto mantiene el PATH del supervisor generado alineado con la misma auditoría de PATH mínimo que Doctor ejecuta después.

  </Accordion>
  <Accordion title="18. Escritura de configuración + metadatos del asistente">
    Doctor conserva cualquier cambio de configuración y marca los metadatos del asistente para registrar la ejecución de Doctor.
  </Accordion>
  <Accordion title="19. Consejos de espacio de trabajo (copia de seguridad + sistema de memoria)">
    Doctor sugiere un sistema de memoria de espacio de trabajo cuando falta e imprime un consejo de copia de seguridad si el espacio de trabajo aún no está bajo git.

    Consulta [/concepts/agent-workspace](/es/concepts/agent-workspace) para ver una guía completa sobre la estructura del espacio de trabajo y la copia de seguridad con git (se recomienda GitHub o GitLab privado).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Runbook del Gateway](/es/gateway)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
