---
read_when:
    - Agregar o modificar migraciones de doctor
    - Introducción de cambios incompatibles en la configuración
sidebarTitle: Doctor
summary: 'Comando doctor: comprobaciones de estado, migraciones de configuración y pasos de reparación'
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-02T05:25:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff4ab00fd6a11588abe790350fe139bc49f61e688bcd741389dd63732aa4430c
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

    Analiza los servicios del sistema para detectar instalaciones adicionales del gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Si quieres revisar los cambios antes de escribirlos, abre primero el archivo de configuración:

```bash
cat ~/.openclaw/openclaw.json
```

## Qué hace (resumen)

<AccordionGroup>
  <Accordion title="Estado, UI y actualizaciones">
    - Actualización previa opcional para instalaciones de git (solo interactivo).
    - Comprobación de frescura del protocolo de la UI (recompila Control UI cuando el esquema del protocolo es más reciente).
    - Comprobación de estado + indicación de reinicio.
    - Resumen de estado de Skills (elegibles/faltantes/bloqueadas) y estado de plugins.

  </Accordion>
  <Accordion title="Configuración y migraciones">
    - Normalización de configuración para valores heredados.
    - Migración de configuración de Talk desde campos planos heredados `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Comprobaciones de migración del navegador para configuraciones heredadas de la extensión de Chrome y preparación de Chrome MCP.
    - Advertencias de sobrescritura del proveedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Advertencias de sombreado de OAuth de Codex (`models.providers.openai-codex`).
    - Comprobación de requisitos previos de TLS de OAuth para perfiles OAuth de OpenAI Codex.
    - Advertencias de lista de permitidos de Plugin/herramientas cuando `plugins.allow` es restrictiva pero la política de herramientas aún solicita comodines o herramientas propiedad de plugins.
    - Migración de estado heredado en disco (sesiones/directorio de agente/autenticación de WhatsApp).
    - Migración de claves de contrato de manifiesto de plugin heredadas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migración de almacén Cron heredado (`jobId`, `schedule.cron`, campos de entrega/carga útil de nivel superior, carga útil `provider`, trabajos de respaldo simples de webhook `notify: true`).
    - Migración heredada de política de ejecución de agente a `agents.defaults.agentRuntime` y `agents.list[].agentRuntime`.
    - Limpieza de configuración de plugin obsoleta cuando los plugins están habilitados; cuando `plugins.enabled=false`, las referencias obsoletas a plugins se tratan como configuración de contención inerte y se conservan.

  </Accordion>
  <Accordion title="Estado e integridad">
    - Inspección de archivos de bloqueo de sesión y limpieza de bloqueos obsoletos.
    - Reparación de transcripciones de sesión para ramas duplicadas de reescritura de prompts creadas por compilaciones 2026.4.24 afectadas.
    - Detección de lápidas de recuperación por reinicio de subagentes bloqueados, con soporte de `--fix` para borrar marcas obsoletas de recuperación abortada de modo que el inicio no siga tratando al hijo como abortado por reinicio.
    - Comprobaciones de integridad de estado y permisos (sesiones, transcripciones, directorio de estado).
    - Comprobaciones de permisos del archivo de configuración (chmod 600) cuando se ejecuta localmente.
    - Estado de autenticación de modelos: comprueba la expiración de OAuth, puede actualizar tokens próximos a expirar e informa estados de enfriamiento/deshabilitación de perfiles de autenticación.
    - Detección de directorio de espacio de trabajo adicional (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servicios y supervisores">
    - Reparación de imagen de sandbox cuando el sandboxing está habilitado.
    - Migración de servicio heredado y detección de gateways adicionales.
    - Migración de estado heredado del canal Matrix (en modo `--fix` / `--repair`).
    - Comprobaciones de tiempo de ejecución del Gateway (servicio instalado pero no en ejecución; etiqueta launchd en caché).
    - Advertencias de estado de canales (sondeadas desde el gateway en ejecución).
    - Auditoría de configuración de supervisor (launchd/systemd/schtasks) con reparación opcional.
    - Limpieza del entorno de proxy incrustado para servicios del gateway que capturaron valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante la instalación o actualización.
    - Comprobaciones de mejores prácticas del tiempo de ejecución del Gateway (Node frente a Bun, rutas de gestores de versiones).
    - Diagnósticos de colisión de puerto del Gateway (predeterminado `18789`).

  </Accordion>
  <Accordion title="Autenticación, seguridad y emparejamiento">
    - Advertencias de seguridad para políticas de MD abiertas.
    - Comprobaciones de autenticación del Gateway para modo de token local (ofrece generación de token cuando no existe ninguna fuente de token; no sobrescribe configuraciones SecretRef de token).
    - Detección de problemas de emparejamiento de dispositivos (solicitudes pendientes de primer emparejamiento, actualizaciones pendientes de rol/ámbito, deriva obsoleta de caché local de tokens de dispositivo y deriva de autenticación de registros emparejados).

  </Accordion>
  <Accordion title="Espacio de trabajo y shell">
    - Comprobación de linger de systemd en Linux.
    - Comprobación de tamaño del archivo de arranque del espacio de trabajo (advertencias de truncamiento/cercanía al límite para archivos de contexto).
    - Comprobación de estado de completado de shell e instalación/actualización automática.
    - Comprobación de preparación del proveedor de embeddings de búsqueda de memoria (modelo local, clave de API remota o binario QMD).
    - Comprobaciones de instalación desde código fuente (discordancia del espacio de trabajo pnpm, recursos de UI faltantes, binario tsx faltante).
    - Escribe la configuración actualizada + metadatos del asistente.

  </Accordion>
</AccordionGroup>

## Relleno y restablecimiento de Dreams UI

La escena Dreams de Control UI incluye acciones **Backfill**, **Reset** y **Clear Grounded** para el flujo de trabajo de dreaming fundamentado. Estas acciones usan métodos RPC de estilo doctor del gateway, pero **no** forman parte de la reparación/migración de la CLI `openclaw doctor`.

Qué hacen:

- **Backfill** analiza archivos históricos `memory/YYYY-MM-DD.md` en el espacio de trabajo activo, ejecuta la pasada de diario REM fundamentado y escribe entradas de relleno reversibles en `DREAMS.md`.
- **Reset** elimina solo esas entradas de diario de relleno marcadas de `DREAMS.md`.
- **Clear Grounded** elimina solo entradas de corto plazo preparadas y solo fundamentadas que provienen de la reproducción histórica y que aún no han acumulado recuerdo en vivo ni soporte diario.

Qué **no** hacen por sí mismas:

- no editan `MEMORY.md`
- no ejecutan migraciones doctor completas
- no preparan automáticamente candidatos fundamentados en el almacén de promoción de corto plazo en vivo a menos que ejecutes explícitamente primero la ruta preparada de la CLI

Si quieres que la reproducción histórica fundamentada influya en el carril normal de promoción profunda, usa el flujo de la CLI en su lugar:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Eso prepara candidatos duraderos fundamentados en el almacén de dreaming de corto plazo mientras mantiene `DREAMS.md` como superficie de revisión.

## Comportamiento detallado y justificación

<AccordionGroup>
  <Accordion title="0. Actualización opcional (instalaciones git)">
    Si se trata de un checkout de git y doctor se ejecuta de forma interactiva, ofrece actualizar (fetch/rebase/build) antes de ejecutar doctor.
  </Accordion>
  <Accordion title="1. Normalización de configuración">
    Si la configuración contiene formas de valores heredadas (por ejemplo `messages.ackReaction` sin una sobrescritura específica de canal), doctor las normaliza al esquema actual.

    Eso incluye campos planos heredados de Talk. La configuración pública actual de Talk es `talk.provider` + `talk.providers.<provider>`. Doctor reescribe las formas antiguas `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` en el mapa de proveedores.

    Doctor también advierte cuando `plugins.allow` no está vacía y la política de herramientas usa
    comodines o entradas de herramientas propiedad de plugins. `tools.allow: ["*"]` solo coincide con herramientas
    de plugins que realmente se cargan; no omite la lista de permitidos exclusiva de plugins.

  </Accordion>
  <Accordion title="2. Migraciones de claves de configuración heredadas">
    Cuando la configuración contiene claves obsoletas, otros comandos se niegan a ejecutarse y te piden ejecutar `openclaw doctor`.

    Doctor hará lo siguiente:

    - Explicar qué claves heredadas se encontraron.
    - Mostrar la migración que aplicó.
    - Reescribir `~/.openclaw/openclaw.json` con el esquema actualizado.

    El Gateway también ejecuta automáticamente migraciones de doctor al iniciar cuando detecta un formato de configuración heredado, de modo que las configuraciones obsoletas se reparan sin intervención manual. Las migraciones del almacén de trabajos Cron se gestionan con `openclaw doctor --fix`.

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
    - Para los canales con `accounts` con nombre pero valores de canal de nivel superior de una sola cuenta aún pendientes, mueve esos valores con ámbito de cuenta a la cuenta promocionada elegida para ese canal (`accounts.default` para la mayoría de los canales; Matrix puede conservar un destino con nombre/predeterminado coincidente existente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - elimina `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` para tiempos de espera de proveedores/modelos lentos
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - elimina `browser.relayBindHost` (configuración heredada del relay de extensión)
    - `models.providers.*.api: "openai"` heredado → `"openai-completions"` (el inicio del Gateway también omite proveedores cuyo `api` está establecido en un valor de enumeración futuro o desconocido en lugar de fallar en modo cerrado)

    Las advertencias de Doctor también incluyen orientación sobre cuentas predeterminadas para canales con varias cuentas:

    - Si hay dos o más entradas `channels.<channel>.accounts` configuradas sin `channels.<channel>.defaultAccount` ni `accounts.default`, Doctor advierte que el enrutamiento de reserva puede elegir una cuenta inesperada.
    - Si `channels.<channel>.defaultAccount` está establecido en un ID de cuenta desconocido, Doctor advierte y enumera los ID de cuenta configurados.

  </Accordion>
  <Accordion title="2b. Reemplazos del proveedor OpenCode">
    Si agregaste `models.providers.opencode`, `opencode-zen` u `opencode-go` manualmente, reemplaza el catálogo integrado de OpenCode de `@mariozechner/pi-ai`. Eso puede forzar modelos a la API incorrecta o poner los costos en cero. Doctor advierte para que puedas eliminar el reemplazo y restaurar el enrutamiento de API + costos por modelo.
  </Accordion>
  <Accordion title="2c. Migración del navegador y preparación para Chrome MCP">
    Si la configuración de tu navegador todavía apunta a la ruta eliminada de la extensión de Chrome, Doctor la normaliza al modelo actual de vinculación Chrome MCP local al host:

    - `browser.profiles.*.driver: "extension"` se convierte en `"existing-session"`
    - `browser.relayBindHost` se elimina

    Doctor también audita la ruta Chrome MCP local al host cuando usas `defaultProfile: "user"` o un perfil `existing-session` configurado:

    - comprueba si Google Chrome está instalado en el mismo host para perfiles predeterminados de conexión automática
    - comprueba la versión detectada de Chrome y advierte cuando es inferior a Chrome 144
    - te recuerda habilitar la depuración remota en la página de inspección del navegador (por ejemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor no puede habilitar por ti la configuración del lado de Chrome. Chrome MCP local al host aún requiere:

    - un navegador basado en Chromium 144+ en el host del gateway/nodo
    - el navegador ejecutándose localmente
    - depuración remota habilitada en ese navegador
    - aprobar el primer aviso de consentimiento de vinculación en el navegador

    La preparación aquí solo trata sobre los prerrequisitos de vinculación local. Existing-session conserva los límites actuales de ruta de Chrome MCP; las rutas avanzadas como `responsebody`, exportación de PDF, interceptación de descargas y acciones por lotes todavía requieren un navegador administrado o un perfil CDP sin procesar.

    Esta comprobación **no** se aplica a Docker, sandbox, navegador remoto ni otros flujos headless. Estos siguen usando CDP sin procesar.

  </Accordion>
  <Accordion title="2d. Prerrequisitos de TLS para OAuth">
    Cuando se configura un perfil OAuth de OpenAI Codex, Doctor prueba el endpoint de autorización de OpenAI para verificar que la pila TLS local de Node/OpenSSL pueda validar la cadena de certificados. Si la prueba falla con un error de certificado (por ejemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado vencido o certificado autofirmado), Doctor imprime orientación de solución específica para la plataforma. En macOS con un Node de Homebrew, la solución suele ser `brew postinstall ca-certificates`. Con `--deep`, la prueba se ejecuta incluso si el gateway está en buen estado.
  </Accordion>
  <Accordion title="2e. Reemplazos del proveedor OAuth de Codex">
    Si antes agregaste configuraciones heredadas de transporte de OpenAI bajo `models.providers.openai-codex`, pueden ocultar la ruta integrada del proveedor OAuth de Codex que las versiones más recientes usan automáticamente. Doctor advierte cuando detecta esas configuraciones de transporte antiguas junto con OAuth de Codex para que puedas eliminar o reescribir el reemplazo de transporte obsoleto y recuperar el comportamiento integrado de enrutamiento/reserva. Los proxies personalizados y los reemplazos solo de encabezados siguen siendo compatibles y no activan esta advertencia.
  </Accordion>
  <Accordion title="2f. Advertencias de ruta del plugin Codex">
    Cuando el plugin Codex incluido está habilitado, Doctor también comprueba si las referencias de modelo primario `openai-codex/*` todavía se resuelven mediante el ejecutor PI predeterminado. Esa combinación es válida cuando quieres autenticación OAuth/suscripción de Codex a través de PI, pero es fácil confundirla con el arnés nativo de servidor de aplicaciones de Codex. Doctor advierte y señala la forma explícita del servidor de aplicaciones: `openai/*` más `agentRuntime.id: "codex"` u `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor no repara esto automáticamente porque ambas rutas son válidas:

    - `openai-codex/*` + PI significa "usar autenticación OAuth/suscripción de Codex mediante el ejecutor normal de OpenClaw."
    - `openai/*` + `agentRuntime.id: "codex"` significa "ejecutar el turno incrustado mediante el servidor de aplicaciones nativo de Codex."
    - `/codex ...` significa "controlar o vincular una conversación nativa de Codex desde el chat."
    - `/acp ...` o `runtime: "acp"` significa "usar el adaptador externo ACP/acpx."

    Si aparece la advertencia, elige la ruta que pretendías y edita la configuración manualmente. Mantén la advertencia tal cual cuando PI Codex OAuth sea intencional.

  </Accordion>
  <Accordion title="3. Migraciones de estado heredado (diseño en disco)">
    Doctor puede migrar diseños en disco antiguos a la estructura actual:

    - Almacén de sesiones + transcripciones:
      - de `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directorio del agente:
      - de `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticación de WhatsApp (Baileys):
      - de `~/.openclaw/credentials/*.json` heredado (excepto `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de cuenta predeterminado: `default`)

    Estas migraciones son de mejor esfuerzo e idempotentes; Doctor emitirá advertencias cuando deje carpetas heredadas como respaldos. El Gateway/CLI también migra automáticamente el directorio heredado de sesiones + agente al iniciar, para que el historial/autenticación/modelos aterricen en la ruta por agente sin ejecutar Doctor manualmente. La autenticación de WhatsApp se migra intencionalmente solo mediante `openclaw doctor`. La normalización de proveedor/mapa de proveedores de Talk ahora compara por igualdad estructural, por lo que las diferencias solo de orden de claves ya no activan cambios `doctor --fix` repetidos sin efecto.

  </Accordion>
  <Accordion title="3a. Migraciones de manifiestos de plugin heredados">
    Doctor examina todos los manifiestos de plugins instalados en busca de claves de capacidad de nivel superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Cuando las encuentra, ofrece moverlas al objeto `contracts` y reescribir el archivo de manifiesto en el lugar. Esta migración es idempotente; si la clave `contracts` ya tiene los mismos valores, la clave heredada se elimina sin duplicar los datos.
  </Accordion>
  <Accordion title="3b. Migraciones de almacenes cron heredados">
    Doctor también comprueba el almacén de trabajos cron (`~/.openclaw/cron/jobs.json` de forma predeterminada, o `cron.store` cuando se reemplaza) en busca de formas antiguas de trabajos que el planificador todavía acepta por compatibilidad.

    Las limpiezas cron actuales incluyen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de payload de nivel superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nivel superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de entrega `provider` en payload → `delivery.channel` explícito
    - trabajos webhook de reserva simples heredados con `notify: true` → `delivery.mode="webhook"` explícito con `delivery.to=cron.webhook`

    Doctor solo migra automáticamente los trabajos `notify: true` cuando puede hacerlo sin cambiar el comportamiento. Si un trabajo combina la reserva heredada de notificación con un modo de entrega existente no webhook, Doctor advierte y deja ese trabajo para revisión manual.

    En Linux, Doctor también advierte cuando el crontab del usuario todavía invoca el `~/.openclaw/bin/ensure-whatsapp.sh` heredado. Ese script local al host no se mantiene en el OpenClaw actual y puede escribir mensajes falsos `Gateway inactive` en `~/.openclaw/logs/whatsapp-health.log` cuando cron no puede alcanzar el bus de usuario de systemd. Elimina la entrada obsoleta de crontab con `crontab -e`; usa `openclaw channels status --probe`, `openclaw doctor` y `openclaw gateway status` para las comprobaciones de estado actuales.

  </Accordion>
  <Accordion title="3c. Limpieza de bloqueos de sesión">
    Doctor escanea todos los directorios de sesiones de agentes en busca de archivos de bloqueo de escritura obsoletos: archivos que quedaron atrás cuando una sesión terminó de forma anómala. Por cada archivo de bloqueo encontrado informa: la ruta, el PID, si el PID sigue activo, la antigüedad del bloqueo y si se considera obsoleto (PID muerto o más de 30 minutos de antigüedad). En modo `--fix` / `--repair`, elimina automáticamente los archivos de bloqueo obsoletos; de lo contrario, imprime una nota y te indica que vuelvas a ejecutarlo con `--fix`.
  </Accordion>
  <Accordion title="3d. Reparación de ramas de transcripción de sesión">
    Doctor escanea los archivos JSONL de sesiones de agentes en busca de la forma de rama duplicada creada por el error de reescritura de transcripciones de prompts de 2026.4.24: un turno de usuario abandonado con contexto de runtime interno de OpenClaw más un hermano activo que contiene el mismo prompt de usuario visible. En modo `--fix` / `--repair`, Doctor crea una copia de seguridad de cada archivo afectado junto al original y reescribe la transcripción a la rama activa para que el historial del Gateway y los lectores de memoria ya no vean turnos duplicados.
  </Accordion>
  <Accordion title="4. Comprobaciones de integridad del estado (persistencia de sesión, enrutamiento y seguridad)">
    El directorio de estado es el tronco encefálico operativo. Si desaparece, pierdes sesiones, credenciales, registros y configuración (a menos que tengas copias de seguridad en otro lugar).

    Doctor comprueba:

    - **Falta el directorio de estado**: advierte sobre una pérdida de estado catastrófica, solicita recrear el directorio y te recuerda que no puede recuperar datos faltantes.
    - **Permisos del directorio de estado**: verifica que se pueda escribir; ofrece reparar permisos (y emite una sugerencia de `chown` cuando detecta una discrepancia de propietario/grupo).
    - **Directorio de estado sincronizado con la nube en macOS**: advierte cuando el estado se resuelve bajo iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...` porque las rutas respaldadas por sincronización pueden causar E/S más lenta y carreras de bloqueo/sincronización.
    - **Directorio de estado en SD o eMMC en Linux**: advierte cuando el estado se resuelve a un origen de montaje `mmcblk*`, porque la E/S aleatoria respaldada por SD o eMMC puede ser más lenta y desgastarse más rápido con escrituras de sesiones y credenciales.
    - **Faltan directorios de sesiones**: `sessions/` y el directorio de almacenamiento de sesiones son necesarios para persistir el historial y evitar fallos `ENOENT`.
    - **Discrepancia de transcripción**: advierte cuando entradas de sesión recientes tienen archivos de transcripción faltantes.
    - **Sesión principal "JSONL de 1 línea"**: marca cuando la transcripción principal tiene solo una línea (el historial no se está acumulando).
    - **Varios directorios de estado**: advierte cuando existen varias carpetas `~/.openclaw` en distintos directorios de inicio o cuando `OPENCLAW_STATE_DIR` apunta a otra ubicación (el historial puede dividirse entre instalaciones).
    - **Recordatorio de modo remoto**: si `gateway.mode=remote`, Doctor te recuerda ejecutarlo en el host remoto (el estado vive allí).
    - **Permisos del archivo de configuración**: advierte si `~/.openclaw/openclaw.json` es legible por el grupo o por todos y ofrece restringirlo a `600`.

  </Accordion>
  <Accordion title="5. Estado de autenticación de modelos (caducidad de OAuth)">
    Doctor inspecciona los perfiles OAuth en el almacén de autenticación, advierte cuando los tokens están por caducar o caducados, y puede actualizarlos cuando es seguro. Si el perfil OAuth/token de Anthropic está obsoleto, sugiere una clave API de Anthropic o la ruta de token de configuración de Anthropic. Los prompts de actualización solo aparecen cuando se ejecuta de forma interactiva (TTY); `--non-interactive` omite los intentos de actualización.

    Cuando una actualización OAuth falla de forma permanente (por ejemplo `refresh_token_reused`, `invalid_grant` o un proveedor que te indica iniciar sesión de nuevo), Doctor informa que se requiere volver a autenticarse e imprime el comando exacto `openclaw models auth login --provider ...` que debes ejecutar.

    Doctor también informa perfiles de autenticación que son temporalmente inutilizables debido a:

    - enfriamientos cortos (límites de tasa/tiempos de espera/fallos de autenticación)
    - deshabilitaciones más largas (fallos de facturación/crédito)

  </Accordion>
  <Accordion title="6. Validación de modelo de hooks">
    Si `hooks.gmail.model` está configurado, Doctor valida la referencia del modelo contra el catálogo y la lista de permitidos, y advierte cuando no se resolverá o no está permitido.
  </Accordion>
  <Accordion title="7. Reparación de imagen de sandbox">
    Cuando el sandboxing está habilitado, Doctor comprueba las imágenes de Docker y ofrece compilarlas o cambiar a nombres heredados si falta la imagen actual.
  </Accordion>
  <Accordion title="7b. Limpieza de instalación de Plugin">
    Doctor elimina el estado heredado de staging de dependencias de plugins generado por OpenClaw en modo `openclaw doctor --fix` / `openclaw doctor --repair`. Esto cubre raíces de dependencias generadas obsoletas, directorios antiguos de etapa de instalación y residuos locales del paquete del código anterior de reparación de dependencias de plugins incluidos.

    Doctor también puede reinstalar plugins descargables configurados cuando la configuración los referencia pero el registro local de plugins no puede encontrarlos. El inicio del Gateway y la recarga de configuración no ejecutan gestores de paquetes; las instalaciones de plugins siguen siendo trabajo explícito de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migraciones de servicio del Gateway y sugerencias de limpieza">
    Doctor detecta servicios de gateway heredados (launchd/systemd/schtasks) y ofrece eliminarlos e instalar el servicio de OpenClaw usando el puerto actual del gateway. También puede escanear servicios adicionales parecidos al gateway e imprimir sugerencias de limpieza. Los servicios de gateway de OpenClaw con nombre de perfil se consideran de primera clase y no se marcan como "extra".

    En Linux, si falta el servicio de gateway a nivel de usuario pero existe un servicio de gateway de OpenClaw a nivel de sistema, Doctor no instala automáticamente un segundo servicio a nivel de usuario. Inspecciona con `openclaw gateway status --deep` o `openclaw doctor --deep`, luego elimina el duplicado o configura `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando un supervisor del sistema posee el ciclo de vida del gateway.

  </Accordion>
  <Accordion title="8b. Migración de inicio de Matrix">
    Cuando una cuenta de canal Matrix tiene una migración de estado heredado pendiente o accionable, Doctor (en modo `--fix` / `--repair`) crea una instantánea previa a la migración y luego ejecuta los pasos de migración de mejor esfuerzo: migración de estado heredado de Matrix y preparación de estado cifrado heredado. Ambos pasos no son fatales; los errores se registran y el inicio continúa. En modo de solo lectura (`openclaw doctor` sin `--fix`), esta comprobación se omite por completo.
  </Accordion>
  <Accordion title="8c. Emparejamiento de dispositivos y deriva de autenticación">
    Doctor ahora inspecciona el estado de emparejamiento de dispositivos como parte de la pasada normal de salud.

    Qué informa:

    - solicitudes de emparejamiento inicial pendientes
    - actualizaciones de rol pendientes para dispositivos ya emparejados
    - actualizaciones de alcance pendientes para dispositivos ya emparejados
    - reparaciones de discrepancia de clave pública donde el id del dispositivo aún coincide pero la identidad del dispositivo ya no coincide con el registro aprobado
    - registros emparejados sin un token activo para un rol aprobado
    - tokens emparejados cuyos alcances derivan fuera de la línea base de emparejamiento aprobada
    - entradas locales en caché de token de dispositivo para la máquina actual que son anteriores a una rotación de token del lado del gateway o llevan metadatos de alcance obsoletos

    Doctor no aprueba automáticamente solicitudes de emparejamiento ni rota automáticamente tokens de dispositivo. En su lugar, imprime los pasos siguientes exactos:

    - inspeccionar solicitudes pendientes con `openclaw devices list`
    - aprobar la solicitud exacta con `openclaw devices approve <requestId>`
    - rotar un token nuevo con `openclaw devices rotate --device <deviceId> --role <role>`
    - eliminar y volver a aprobar un registro obsoleto con `openclaw devices remove <deviceId>`

    Esto cierra el hueco común de "ya emparejado pero aún se requiere emparejamiento": Doctor ahora distingue el emparejamiento inicial de las actualizaciones pendientes de rol/alcance y de la deriva de token/identidad de dispositivo obsoleta.

  </Accordion>
  <Accordion title="9. Advertencias de seguridad">
    Doctor emite advertencias cuando un proveedor está abierto a mensajes directos sin una lista de permitidos, o cuando una política está configurada de forma peligrosa.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Si se ejecuta como un servicio de usuario de systemd, Doctor garantiza que lingering esté habilitado para que el gateway siga activo después de cerrar sesión.
  </Accordion>
  <Accordion title="11. Estado del espacio de trabajo (skills, plugins y directorios heredados)">
    Doctor imprime un resumen del estado del espacio de trabajo para el agente predeterminado:

    - **Estado de Skills**: cuenta skills elegibles, con requisitos faltantes y bloqueadas por lista de permitidos.
    - **Directorios de espacio de trabajo heredados**: advierte cuando `~/openclaw` u otros directorios de espacio de trabajo heredados existen junto al espacio de trabajo actual.
    - **Estado de Plugin**: cuenta plugins habilitados/deshabilitados/con errores; lista IDs de plugins para cualquier error; informa capacidades de plugins de paquete.
    - **Advertencias de compatibilidad de Plugin**: marca plugins que tienen problemas de compatibilidad con el runtime actual.
    - **Diagnósticos de Plugin**: muestra cualquier advertencia o error de tiempo de carga emitido por el registro de plugins.

  </Accordion>
  <Accordion title="11b. Tamaño de archivo de arranque">
    Doctor comprueba si los archivos de arranque del espacio de trabajo (por ejemplo `AGENTS.md`, `CLAUDE.md` u otros archivos de contexto inyectados) están cerca o por encima del presupuesto de caracteres configurado. Informa recuentos de caracteres sin procesar frente a inyectados por archivo, porcentaje de truncamiento, causa de truncamiento (`max/file` o `max/total`) y caracteres inyectados totales como fracción del presupuesto total. Cuando los archivos se truncan o están cerca del límite, Doctor imprime consejos para ajustar `agents.defaults.bootstrapMaxChars` y `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpieza de Plugin de canal obsoleto">
    Cuando `openclaw doctor --fix` elimina un Plugin de canal faltante, también elimina la configuración colgante con alcance de canal que hacía referencia a ese Plugin: entradas `channels.<id>`, destinos de Heartbeat que nombraban el canal y sobrescrituras `agents.*.models["<channel>/*"]`. Esto evita bucles de arranque del Gateway donde el runtime del canal ya no existe pero la configuración todavía pide al gateway enlazarse a él.
  </Accordion>
  <Accordion title="11c. Autocompletado de shell">
    Doctor comprueba si el autocompletado con tabulación está instalado para la shell actual (zsh, bash, fish o PowerShell):

    - Si el perfil de shell usa un patrón de autocompletado dinámico lento (`source <(openclaw completion ...)`), Doctor lo actualiza a la variante más rápida de archivo en caché.
    - Si el autocompletado está configurado en el perfil pero falta el archivo de caché, Doctor regenera la caché automáticamente.
    - Si no hay ningún autocompletado configurado, Doctor solicita instalarlo (solo en modo interactivo; se omite con `--non-interactive`).

    Ejecuta `openclaw completion --write-state` para regenerar la caché manualmente.

  </Accordion>
  <Accordion title="12. Comprobaciones de autenticación del Gateway (token local)">
    Doctor comprueba la preparación de autenticación por token del gateway local.

    - Si el modo token necesita un token y no existe ninguna fuente de token, Doctor ofrece generar uno.
    - Si `gateway.auth.token` está gestionado por SecretRef pero no está disponible, Doctor advierte y no lo sobrescribe con texto plano.
    - `openclaw doctor --generate-gateway-token` fuerza la generación solo cuando no hay ningún SecretRef de token configurado.

  </Accordion>
  <Accordion title="12b. Reparaciones de solo lectura conscientes de SecretRef">
    Algunos flujos de reparación necesitan inspeccionar credenciales configuradas sin debilitar el comportamiento de fallo rápido del runtime.

    - `openclaw doctor --fix` ahora usa el mismo modelo de resumen SecretRef de solo lectura que los comandos de la familia de estado para reparaciones de configuración dirigidas.
    - Ejemplo: la reparación de `allowFrom` / `groupAllowFrom` `@username` de Telegram intenta usar credenciales de bot configuradas cuando están disponibles.
    - Si el token de bot de Telegram está configurado mediante SecretRef pero no está disponible en la ruta del comando actual, Doctor informa que la credencial está configurada pero no disponible y omite la resolución automática en lugar de fallar o informar incorrectamente que falta el token.

  </Accordion>
  <Accordion title="13. Comprobación de salud del Gateway + reinicio">
    Doctor ejecuta una comprobación de salud y ofrece reiniciar el gateway cuando parece no estar saludable.
  </Accordion>
  <Accordion title="13b. Preparación de búsqueda de memoria">
    Doctor comprueba si el proveedor de embeddings de búsqueda de memoria configurado está listo para el agente predeterminado. El comportamiento depende del backend y proveedor configurados:

    - **backend QMD**: comprueba si el binario `qmd` está disponible y se puede iniciar. Si no, muestra orientación para solucionarlo, incluido el paquete npm y una opción de ruta manual al binario.
    - **Proveedor local explícito**: comprueba si existe un archivo de modelo local o una URL reconocida de modelo remoto/descargable. Si falta, sugiere cambiar a un proveedor remoto.
    - **Proveedor remoto explícito** (`openai`, `voyage`, etc.): verifica que haya una clave de API presente en el entorno o en el almacén de autenticación. Muestra sugerencias de solución accionables si falta.
    - **Proveedor automático**: comprueba primero la disponibilidad del modelo local y luego prueba cada proveedor remoto en el orden de selección automática.

    Cuando hay disponible un resultado en caché de la comprobación del Gateway (el Gateway estaba en buen estado en el momento de la comprobación), doctor cruza su resultado con la configuración visible para la CLI y señala cualquier discrepancia. Doctor no inicia un ping nuevo de embeddings en la ruta predeterminada; usa el comando de estado de memoria profunda cuando quieras una comprobación en vivo del proveedor.

    Usa `openclaw memory status --deep` para verificar la preparación de embeddings en tiempo de ejecución.

  </Accordion>
  <Accordion title="14. Advertencias de estado del canal">
    Si el Gateway está en buen estado, doctor ejecuta una comprobación del estado del canal e informa advertencias con correcciones sugeridas.
  </Accordion>
  <Accordion title="15. Auditoría + reparación de configuración del supervisor">
    Doctor comprueba la configuración del supervisor instalada (launchd/systemd/schtasks) para detectar valores predeterminados faltantes u obsoletos (por ejemplo, dependencias de systemd network-online y retraso de reinicio). Cuando encuentra una discrepancia, recomienda una actualización y puede reescribir el archivo de servicio/tarea con los valores predeterminados actuales.

    Notas:

    - `openclaw doctor` solicita confirmación antes de reescribir la configuración del supervisor.
    - `openclaw doctor --yes` acepta las solicitudes de reparación predeterminadas.
    - `openclaw doctor --repair` aplica las correcciones recomendadas sin solicitar confirmación.
    - `openclaw doctor --repair --force` sobrescribe configuraciones personalizadas del supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor en modo de solo lectura para el ciclo de vida del servicio del Gateway. Sigue informando el estado del servicio y ejecuta reparaciones que no sean del servicio, pero omite la instalación/inicio/reinicio/bootstrap del servicio, las reescrituras de configuración del supervisor y la limpieza de servicios heredados porque un supervisor externo posee ese ciclo de vida.
    - En Linux, doctor no reescribe metadatos de comando/punto de entrada mientras la unidad systemd del Gateway correspondiente está activa. También ignora unidades inactivas adicionales no heredadas similares al Gateway durante el escaneo de servicios duplicados, para que los archivos de servicio complementarios no generen ruido de limpieza.
    - Si la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación/reparación del servicio de doctor valida el SecretRef pero no persiste los valores de token de texto sin formato resueltos en los metadatos de entorno del servicio del supervisor.
    - Doctor detecta valores de entorno de servicio gestionados por `.env`/SecretRef que instalaciones antiguas de LaunchAgent, systemd o Tareas programadas de Windows incrustaron en línea y reescribe los metadatos del servicio para que esos valores se carguen desde la fuente de tiempo de ejecución en lugar de la definición del supervisor.
    - Doctor detecta cuando el comando de servicio todavía fija un `--port` antiguo después de cambios en `gateway.port` y reescribe los metadatos del servicio al puerto actual.
    - Si la autenticación por token requiere un token y el SecretRef del token configurado no se resuelve, doctor bloquea la ruta de instalación/reparación con orientación accionable.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, doctor bloquea la instalación/reparación hasta que el modo se defina explícitamente.
    - Para unidades user-systemd de Linux, las comprobaciones de desviación de tokens de doctor ahora incluyen tanto fuentes `Environment=` como `EnvironmentFile=` al comparar metadatos de autenticación del servicio.
    - Las reparaciones de servicio de doctor rechazan reescribir, detener o reiniciar un servicio del Gateway desde un binario de OpenClaw más antiguo cuando la configuración fue escrita por última vez por una versión más nueva. Consulta [Solución de problemas del Gateway](/es/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Siempre puedes forzar una reescritura completa mediante `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos de runtime + puerto del Gateway">
    Doctor inspecciona el tiempo de ejecución del servicio (PID, último estado de salida) y advierte cuando el servicio está instalado pero no se está ejecutando realmente. También comprueba colisiones de puerto en el puerto del Gateway (predeterminado `18789`) e informa causas probables (Gateway ya en ejecución, túnel SSH).
  </Accordion>
  <Accordion title="17. Prácticas recomendadas de runtime del Gateway">
    Doctor advierte cuando el servicio del Gateway se ejecuta en Bun o en una ruta de Node gestionada por versiones (`nvm`, `fnm`, `volta`, `asdf`, etc.). Los canales WhatsApp + Telegram requieren Node, y las rutas de gestores de versiones pueden romperse después de actualizaciones porque el servicio no carga la inicialización de tu shell. Doctor ofrece migrar a una instalación de Node del sistema cuando está disponible (Homebrew/apt/choco).

    Los servicios instalados o reparados recientemente conservan raíces de entorno explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) y directorios user-bin estables, pero los directorios de reserva inferidos de gestores de versiones solo se escriben en el PATH del servicio cuando esos directorios existen en disco. Esto mantiene el PATH generado del supervisor alineado con la misma auditoría de PATH mínimo que doctor ejecuta después.

  </Accordion>
  <Accordion title="18. Escritura de configuración + metadatos del asistente">
    Doctor persiste cualquier cambio de configuración y marca metadatos del asistente para registrar la ejecución de doctor.
  </Accordion>
  <Accordion title="19. Consejos de espacio de trabajo (copia de seguridad + sistema de memoria)">
    Doctor sugiere un sistema de memoria del espacio de trabajo cuando falta y muestra un consejo de copia de seguridad si el espacio de trabajo todavía no está bajo git.

    Consulta [/concepts/agent-workspace](/es/concepts/agent-workspace) para ver una guía completa sobre la estructura del espacio de trabajo y copia de seguridad con git (se recomienda GitHub o GitLab privado).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Runbook del Gateway](/es/gateway)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
