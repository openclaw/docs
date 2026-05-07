---
read_when:
    - Agregar o modificar migraciones de doctor
    - Introducción de cambios incompatibles en la configuración
sidebarTitle: Doctor
summary: 'Comando doctor: comprobaciones de estado, migraciones de configuración y pasos de reparación'
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-07T01:52:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: d76a31a8f2197e226894f90fb534f53acf969b75ca1dfdf438a26059880e7ab2
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

    Aplica también reparaciones agresivas (sobrescribe configuraciones personalizadas del supervisor).

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

    Analiza los servicios del sistema en busca de instalaciones adicionales de gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Si quieres revisar los cambios antes de escribirlos, abre primero el archivo de configuración:

```bash
cat ~/.openclaw/openclaw.json
```

## Qué hace (resumen)

<AccordionGroup>
  <Accordion title="Estado, interfaz de usuario y actualizaciones">
    - Actualización previa opcional para instalaciones desde git (solo interactivo).
    - Comprobación de frescura del protocolo de la interfaz de usuario (recompila Control UI cuando el esquema del protocolo es más nuevo).
    - Comprobación de estado + solicitud de reinicio.
    - Resumen de estado de Skills (elegibles/faltantes/bloqueadas) y estado de plugins.

  </Accordion>
  <Accordion title="Configuración y migraciones">
    - Normalización de configuración para valores heredados.
    - Migración de configuración de Talk desde campos planos heredados `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Comprobaciones de migración del navegador para configuraciones heredadas de la extensión de Chrome y preparación de Chrome MCP.
    - Advertencias de sobrescritura del proveedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Advertencias de solapamiento de OAuth de Codex (`models.providers.openai-codex`).
    - Comprobación de requisitos previos de TLS para perfiles OAuth de OpenAI Codex.
    - Advertencias de lista de permitidos de plugins/herramientas cuando `plugins.allow` es restrictivo pero la política de herramientas aún solicita comodines o herramientas propiedad de plugins.
    - Migración de estado heredado en disco (sesiones/directorio de agente/autenticación de WhatsApp).
    - Migración de claves heredadas del contrato del manifiesto de plugins (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migración del almacén cron heredado (`jobId`, `schedule.cron`, campos de entrega/payload de nivel superior, `provider` de payload, trabajos de respaldo de Webhook simples `notify: true`).
    - Migración de la política de runtime de agente heredada a `agents.defaults.agentRuntime` y `agents.list[].agentRuntime`.
    - Limpieza de configuración obsoleta de plugins cuando los plugins están habilitados; cuando `plugins.enabled=false`, las referencias obsoletas de plugins se tratan como configuración de contención inerte y se conservan.

  </Accordion>
  <Accordion title="Estado e integridad">
    - Inspección de archivos de bloqueo de sesión y limpieza de bloqueos obsoletos.
    - Reparación de transcripciones de sesión para ramas de reescritura de prompts duplicadas creadas por compilaciones 2026.4.24 afectadas.
    - Detección de lápidas de recuperación por reinicio de subagentes bloqueados, con soporte de `--fix` para borrar flags obsoletos de recuperación abortada, de modo que el inicio no siga tratando al hijo como abortado por reinicio.
    - Comprobaciones de integridad de estado y permisos (sesiones, transcripciones, directorio de estado).
    - Comprobaciones de permisos del archivo de configuración (chmod 600) cuando se ejecuta localmente.
    - Estado de autenticación de modelos: comprueba la caducidad de OAuth, puede actualizar tokens próximos a caducar e informa estados de enfriamiento/deshabilitación de perfiles de autenticación.
    - Detección de directorio de espacio de trabajo adicional (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servicios y supervisores">
    - Reparación de imagen de sandbox cuando el sandbox está habilitado.
    - Migración de servicios heredados y detección de gateways adicionales.
    - Migración de estado heredado del canal Matrix (en modo `--fix` / `--repair`).
    - Comprobaciones de runtime del Gateway (servicio instalado pero no en ejecución; etiqueta launchd en caché).
    - Advertencias de estado de canales (sondeadas desde el gateway en ejecución).
    - Comprobaciones de capacidad de respuesta de WhatsApp para estado degradado del bucle de eventos del Gateway con clientes TUI locales aún en ejecución; `--fix` detiene solo clientes TUI locales verificados.
    - Reparación de rutas de Codex para referencias heredadas de modelo `openai-codex/*` en modelos primarios, respaldos, sobrescrituras de heartbeat/subagente/compaction, hooks, sobrescrituras de modelo de canal y anclajes de ruta de sesión; `--fix` las reescribe a `openai/*` y selecciona `agentRuntime.id: "codex"` solo cuando el plugin Codex está instalado, habilitado, aporta el arnés `codex` y tiene OAuth utilizable. De lo contrario, selecciona `agentRuntime.id: "pi"`.
    - Auditoría de configuración de supervisor (launchd/systemd/schtasks) con reparación opcional.
    - Limpieza del entorno de proxy embebido para servicios de gateway que capturaron valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante la instalación o actualización.
    - Comprobaciones de buenas prácticas de runtime del Gateway (Node frente a Bun, rutas de gestores de versiones).
    - Diagnósticos de colisión de puerto del Gateway (predeterminado `18789`).

  </Accordion>
  <Accordion title="Autenticación, seguridad y emparejamiento">
    - Advertencias de seguridad para políticas de DM abiertas.
    - Comprobaciones de autenticación del Gateway para el modo de token local (ofrece generación de tokens cuando no existe una fuente de token; no sobrescribe configuraciones SecretRef de token).
    - Detección de problemas de emparejamiento de dispositivos (solicitudes de primer emparejamiento pendientes, actualizaciones pendientes de rol/alcance, deriva obsoleta de caché local de token de dispositivo y deriva de autenticación del registro emparejado).

  </Accordion>
  <Accordion title="Espacio de trabajo y shell">
    - Comprobación de linger de systemd en Linux.
    - Comprobación del tamaño del archivo bootstrap del espacio de trabajo (advertencias de truncamiento/cercanía al límite para archivos de contexto).
    - Comprobación de preparación de Skills para el agente predeterminado; informa skills permitidas con binarios, entorno, configuración o requisitos de sistema operativo faltantes, y `--fix` puede deshabilitar skills no disponibles en `skills.entries`.
    - Comprobación de estado de completado de shell e instalación/actualización automática.
    - Comprobación de preparación del proveedor de embeddings de búsqueda de memoria (modelo local, clave de API remota o binario QMD).
    - Comprobaciones de instalación desde código fuente (desajuste del espacio de trabajo pnpm, recursos de interfaz de usuario faltantes, binario tsx faltante).
    - Escribe configuración actualizada + metadatos del asistente.

  </Accordion>
</AccordionGroup>

## Relleno histórico y restablecimiento de la interfaz de Dreams

La escena Dreams de Control UI incluye acciones **Backfill**, **Reset** y **Clear Grounded** para el flujo de trabajo grounded dreaming. Estas acciones usan métodos RPC de estilo doctor del gateway, pero **no** forman parte de la reparación/migración de la CLI `openclaw doctor`.

Qué hacen:

- **Backfill** analiza archivos históricos `memory/YYYY-MM-DD.md` en el espacio de trabajo activo, ejecuta el pase del diario REM grounded y escribe entradas reversibles de relleno histórico en `DREAMS.md`.
- **Reset** elimina solo esas entradas marcadas del diario de relleno histórico de `DREAMS.md`.
- **Clear Grounded** elimina solo entradas staged de corto plazo, solo grounded, que proceden de la reproducción histórica y que aún no han acumulado recuerdo en vivo ni soporte diario.

Qué **no** hacen por sí mismas:

- no editan `MEMORY.md`
- no ejecutan migraciones completas de doctor
- no preparan automáticamente candidatos grounded en el almacén de promoción de corto plazo en vivo a menos que ejecutes explícitamente primero la ruta CLI staged

Si quieres que la reproducción histórica grounded influya en la ruta normal de promoción profunda, usa en su lugar el flujo CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Eso prepara candidatos duraderos grounded en el almacén de dreaming de corto plazo, manteniendo `DREAMS.md` como superficie de revisión.

## Comportamiento detallado y justificación

<AccordionGroup>
  <Accordion title="0. Actualización opcional (instalaciones git)">
    Si esto es un checkout de git y doctor se está ejecutando de forma interactiva, ofrece actualizar (fetch/rebase/build) antes de ejecutar doctor.
  </Accordion>
  <Accordion title="1. Normalización de configuración">
    Si la configuración contiene formas de valores heredadas (por ejemplo `messages.ackReaction` sin una sobrescritura específica de canal), doctor las normaliza al esquema actual.

    Eso incluye campos planos heredados de Talk. La configuración pública actual de voz de Talk es `talk.provider` + `talk.providers.<provider>`, y la configuración de voz en tiempo real es `talk.realtime.*`. Doctor reescribe las formas antiguas `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` en el mapa de proveedores, y reescribe los selectores heredados de tiempo real de nivel superior (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) en `talk.realtime`.

    Doctor también advierte cuando `plugins.allow` no está vacío y la política de herramientas usa
    entradas comodín o de herramientas propiedad de plugins. `tools.allow: ["*"]` solo coincide con herramientas
    de plugins que realmente cargan; no omite la lista exclusiva de permitidos de plugins.
    Doctor escribe `plugins.bundledDiscovery: "compat"` para configuraciones heredadas
    migradas de listas de permitidos, con el fin de preservar el comportamiento existente de proveedores incluidos, y
    luego apunta a la configuración más estricta `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migraciones de claves de configuración heredadas">
    Cuando la configuración contiene claves obsoletas, otros comandos se niegan a ejecutarse y te piden que ejecutes `openclaw doctor`.

    Doctor hará lo siguiente:

    - Explicar qué claves heredadas se encontraron.
    - Mostrar la migración que aplicó.
    - Reescribir `~/.openclaw/openclaw.json` con el esquema actualizado.

    El inicio del Gateway rechaza formatos de configuración heredados y te pide que ejecutes `openclaw doctor --fix`; no reescribe `openclaw.json` durante el inicio. Las migraciones del almacén de trabajos Cron también se gestionan mediante `openclaw doctor --fix`.

    Migraciones actuales:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - configuraciones de canales configurados sin política de respuesta visible → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` de nivel superior
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` heredados → `talk.provider` + `talk.providers.<provider>`
    - selectores Talk en tiempo real heredados de nivel superior (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Para canales con `accounts` con nombre pero valores persistentes de canal de nivel superior de una sola cuenta, mueve esos valores con alcance de cuenta a la cuenta promovida elegida para ese canal (`accounts.default` para la mayoría de los canales; Matrix puede conservar un destino con nombre/predeterminado existente que coincida)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (herramientas/elevado/exec/sandbox/subagentes)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - elimina `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` para tiempos de espera de proveedor/modelo lentos
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - elimina `browser.relayBindHost` (configuración heredada de retransmisión de extensión)
    - `models.providers.*.api: "openai"` heredado → `"openai-completions"` (el inicio de Gateway también omite los proveedores cuyo `api` esté establecido en un valor de enumeración futuro o desconocido en lugar de fallar de forma cerrada)

    Las advertencias de Doctor también incluyen orientación sobre cuentas predeterminadas para canales con varias cuentas:

    - Si se configuran dos o más entradas `channels.<channel>.accounts` sin `channels.<channel>.defaultAccount` ni `accounts.default`, Doctor advierte que el enrutamiento de reserva puede elegir una cuenta inesperada.
    - Si `channels.<channel>.defaultAccount` está establecido en un ID de cuenta desconocido, Doctor advierte y enumera los ID de cuenta configurados.

  </Accordion>
  <Accordion title="2b. Anulaciones del proveedor OpenCode">
    Si agregaste `models.providers.opencode`, `opencode-zen` u `opencode-go` manualmente, esto anula el catálogo OpenCode integrado de `@mariozechner/pi-ai`. Eso puede forzar modelos a la API incorrecta o poner los costos en cero. Doctor advierte para que puedas eliminar la anulación y restaurar el enrutamiento de API por modelo + los costos.
  </Accordion>
  <Accordion title="2c. Migración del navegador y preparación para Chrome MCP">
    Si tu configuración del navegador todavía apunta a la ruta eliminada de la extensión de Chrome, Doctor la normaliza al modelo actual de conexión Chrome MCP local al host:

    - `browser.profiles.*.driver: "extension"` se convierte en `"existing-session"`
    - `browser.relayBindHost` se elimina

    Doctor también audita la ruta Chrome MCP local al host cuando usas `defaultProfile: "user"` o un perfil `existing-session` configurado:

    - comprueba si Google Chrome está instalado en el mismo host para perfiles de conexión automática predeterminados
    - comprueba la versión detectada de Chrome y advierte cuando es inferior a Chrome 144
    - te recuerda habilitar la depuración remota en la página de inspección del navegador (por ejemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor no puede habilitar por ti la configuración del lado de Chrome. Chrome MCP local al host todavía requiere:

    - un navegador basado en Chromium 144+ en el host de Gateway/Node
    - el navegador ejecutándose localmente
    - depuración remota habilitada en ese navegador
    - aprobar el primer aviso de consentimiento de conexión en el navegador

    La preparación aquí solo trata los requisitos previos de conexión local. Existing-session conserva los límites actuales de ruta de Chrome MCP; las rutas avanzadas como `responsebody`, exportación de PDF, interceptación de descargas y acciones por lotes aún requieren un navegador administrado o un perfil CDP sin procesar.

    Esta comprobación **no** se aplica a Docker, sandbox, remote-browser ni otros flujos headless. Esos continúan usando CDP sin procesar.

  </Accordion>
  <Accordion title="2d. Requisitos previos de TLS para OAuth">
    Cuando se configura un perfil OAuth de OpenAI Codex, Doctor sondea el endpoint de autorización de OpenAI para verificar que la pila TLS local de Node/OpenSSL pueda validar la cadena de certificados. Si el sondeo falla con un error de certificado (por ejemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado caducado o certificado autofirmado), Doctor imprime orientación de corrección específica de la plataforma. En macOS con un Node de Homebrew, la corrección suele ser `brew postinstall ca-certificates`. Con `--deep`, el sondeo se ejecuta aunque Gateway esté sano.
  </Accordion>
  <Accordion title="2e. Anulaciones del proveedor OAuth de Codex">
    Si anteriormente agregaste configuraciones heredadas de transporte de OpenAI bajo `models.providers.openai-codex`, pueden ocultar la ruta integrada del proveedor OAuth de Codex que las versiones más recientes usan automáticamente. Doctor advierte cuando ve esas configuraciones antiguas de transporte junto con OAuth de Codex para que puedas eliminar o reescribir la anulación de transporte obsoleta y recuperar el comportamiento integrado de enrutamiento/reserva. Los proxies personalizados y las anulaciones solo de encabezados siguen siendo compatibles y no activan esta advertencia.
  </Accordion>
  <Accordion title="2f. Reparación de rutas de Codex">
    Doctor comprueba refs de modelo `openai-codex/*` heredadas. El enrutamiento nativo del arnés Codex usa refs de modelo canónicas `openai/*` más `agentRuntime.id: "codex"` para que el turno pase por el arnés del servidor de aplicación de Codex en lugar de la ruta OpenAI de OpenClaw PI.

    En modo `--fix` / `--repair`, Doctor reescribe las refs afectadas del agente predeterminado y por agente, incluidos modelos principales, reservas, anulaciones de heartbeat/subagente/compaction, hooks, anulaciones de modelo de canal y estado obsoleto persistido de rutas de sesión:

    - `openai-codex/gpt-*` se convierte en `openai/gpt-*`.
    - El runtime del agente coincidente se convierte en `agentRuntime.id: "codex"` solo cuando Codex está instalado, habilitado, aporta el arnés `codex` y tiene OAuth utilizable.
    - De lo contrario, el runtime del agente coincidente se convierte en `agentRuntime.id: "pi"`.
    - Las listas existentes de modelos de reserva se conservan con sus entradas heredadas reescritas; las configuraciones copiadas por modelo se mueven de la clave heredada a la clave canónica `openai/*`.
    - Los `modelProvider`/`providerOverride`, `model`/`modelOverride`, avisos de reserva, anclajes de perfil de autenticación y anclajes de arnés Codex persistidos de sesión se reparan en todos los almacenes de sesiones de agente descubiertos.
    - `/codex ...` significa "controlar o vincular una conversación nativa de Codex desde el chat".
    - `/acp ...` o `runtime: "acp"` significa "usar el adaptador externo ACP/acpx".

  </Accordion>
  <Accordion title="2g. Limpieza de rutas de sesión">
    Doctor también escanea los almacenes descubiertos de sesiones de agente en busca de estado obsoleto de rutas autocreadas después de mover modelos configurados o runtime fuera de una ruta propiedad de un Plugin, como Codex.

    `openclaw doctor --fix` puede borrar estado obsoleto autocreado, como anclajes de modelo `modelOverrideSource: "auto"`, metadatos de modelo de runtime, IDs de arnés anclados, vinculaciones de sesión CLI y anulaciones automáticas de perfil de autenticación cuando su ruta propietaria ya no está configurada. Las opciones explícitas de usuario o heredadas de modelo de sesión se reportan para revisión manual y se dejan intactas; cámbialas con `/model ...`, `/new` o restablece la sesión cuando esa ruta ya no sea la prevista.

  </Accordion>
  <Accordion title="3. Migraciones de estado heredado (diseño en disco)">
    Doctor puede migrar diseños antiguos en disco a la estructura actual:

    - Almacén de sesiones + transcripciones:
      - de `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directorio de agente:
      - de `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticación de WhatsApp (Baileys):
      - de `~/.openclaw/credentials/*.json` heredado (excepto `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (id de cuenta predeterminado: `default`)

    Estas migraciones son de mejor esfuerzo e idempotentes; Doctor emitirá advertencias cuando deje carpetas heredadas como copias de seguridad. Gateway/CLI también migra automáticamente el almacén de sesiones heredado + el directorio del agente al iniciar, de modo que el historial/autenticación/modelos lleguen a la ruta por agente sin una ejecución manual de Doctor. La autenticación de WhatsApp se migra intencionalmente solo mediante `openclaw doctor`. La normalización de proveedor/mapa de proveedores de Talk ahora compara por igualdad estructural, por lo que las diferencias solo de orden de claves ya no activan cambios repetidos no operativos de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migraciones de manifiestos de Plugin heredados">
    Doctor escanea todos los manifiestos de Plugin instalados en busca de claves de capacidad de nivel superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Cuando las encuentra, ofrece moverlas al objeto `contracts` y reescribir el archivo de manifiesto in situ. Esta migración es idempotente; si la clave `contracts` ya tiene los mismos valores, la clave heredada se elimina sin duplicar los datos.
  </Accordion>
  <Accordion title="3b. Migraciones heredadas del almacén cron">
    Doctor también comprueba el almacén de trabajos cron (`~/.openclaw/cron/jobs.json` de forma predeterminada, o `cron.store` cuando se anula) en busca de formas antiguas de trabajo que el programador aún acepta por compatibilidad.

    Las limpiezas actuales de cron incluyen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de carga útil de nivel superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nivel superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de entrega `provider` de carga útil → `delivery.channel` explícito
    - centinelas inválidos persistidos de cron `payload.model` (`"default"`, `"null"`, cadenas en blanco, JSON `null`) → anulación de modelo eliminada
    - trabajos simples heredados de reserva Webhook `notify: true` → `delivery.mode="webhook"` explícito con `delivery.to=cron.webhook`

    Doctor solo migra automáticamente los trabajos `notify: true` cuando puede hacerlo sin cambiar el comportamiento. Si un trabajo combina la reserva de notificación heredada con un modo de entrega no Webhook existente, Doctor advierte y deja ese trabajo para revisión manual.

    En Linux, Doctor también advierte cuando el crontab del usuario todavía invoca el script heredado `~/.openclaw/bin/ensure-whatsapp.sh`. Ese script local del host no lo mantiene la versión actual de OpenClaw y puede escribir mensajes falsos de `Gateway inactive` en `~/.openclaw/logs/whatsapp-health.log` cuando cron no puede alcanzar el bus de usuario de systemd. Elimina la entrada obsoleta de crontab con `crontab -e`; usa `openclaw channels status --probe`, `openclaw doctor` y `openclaw gateway status` para las comprobaciones de estado actuales.

  </Accordion>
  <Accordion title="3c. Limpieza de bloqueos de sesión">
    Doctor examina todos los directorios de sesión de agentes en busca de archivos de bloqueo de escritura obsoletos: archivos que quedan cuando una sesión termina de forma anómala. Por cada archivo de bloqueo encontrado, informa: la ruta, el PID, si el PID sigue activo, la antigüedad del bloqueo y si se considera obsoleto (PID muerto o más antiguo que 30 minutos). En modo `--fix` / `--repair`, elimina automáticamente los archivos de bloqueo obsoletos; de lo contrario, imprime una nota y te indica que vuelvas a ejecutarlo con `--fix`.
  </Accordion>
  <Accordion title="3d. Reparación de ramas de transcripción de sesión">
    Doctor examina los archivos JSONL de sesión de agentes en busca de la forma de rama duplicada creada por el error de reescritura de transcripción de prompts de 2026.4.24: un turno de usuario abandonado con contexto de runtime interno de OpenClaw más un hermano activo que contiene el mismo prompt de usuario visible. En modo `--fix` / `--repair`, Doctor hace una copia de seguridad de cada archivo afectado junto al original y reescribe la transcripción a la rama activa para que el historial del Gateway y los lectores de memoria ya no vean turnos duplicados.
  </Accordion>
  <Accordion title="4. Comprobaciones de integridad de estado (persistencia de sesiones, enrutamiento y seguridad)">
    El directorio de estado es el tronco operativo. Si desaparece, pierdes sesiones, credenciales, registros y configuración (salvo que tengas copias de seguridad en otro lugar).

    Doctor comprueba:

    - **Falta el directorio de estado**: advierte sobre una pérdida de estado catastrófica, solicita recrear el directorio y recuerda que no puede recuperar datos faltantes.
    - **Permisos del directorio de estado**: verifica que se pueda escribir; ofrece reparar permisos (y emite una sugerencia de `chown` cuando detecta una discrepancia de propietario/grupo).
    - **Directorio de estado sincronizado con la nube en macOS**: advierte cuando el estado se resuelve bajo iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...`, porque las rutas respaldadas por sincronización pueden causar E/S más lenta y carreras de bloqueo/sincronización.
    - **Directorio de estado en SD o eMMC en Linux**: advierte cuando el estado se resuelve a una fuente de montaje `mmcblk*`, porque la E/S aleatoria respaldada por SD o eMMC puede ser más lenta y desgastarse más rápido con escrituras de sesiones y credenciales.
    - **Faltan directorios de sesión**: `sessions/` y el directorio de almacenamiento de sesiones son necesarios para persistir el historial y evitar bloqueos `ENOENT`.
    - **Discrepancia de transcripción**: advierte cuando las entradas recientes de sesión tienen archivos de transcripción faltantes.
    - **Sesión principal "JSONL de 1 línea"**: marca cuando la transcripción principal tiene solo una línea (el historial no se está acumulando).
    - **Múltiples directorios de estado**: advierte cuando existen varias carpetas `~/.openclaw` en distintos directorios de inicio o cuando `OPENCLAW_STATE_DIR` apunta a otro lugar (el historial puede dividirse entre instalaciones).
    - **Recordatorio de modo remoto**: si `gateway.mode=remote`, Doctor te recuerda ejecutarlo en el host remoto (el estado vive allí).
    - **Permisos del archivo de configuración**: advierte si `~/.openclaw/openclaw.json` es legible por el grupo o por todos, y ofrece ajustarlo a `600`.

  </Accordion>
  <Accordion title="5. Estado de autenticación de modelos (caducidad de OAuth)">
    Doctor inspecciona los perfiles de OAuth en el almacén de autenticación, advierte cuando los tokens están por caducar o han caducado, y puede actualizarlos cuando es seguro. Si el perfil de OAuth/token de Anthropic está obsoleto, sugiere una clave de API de Anthropic o la ruta de token de configuración de Anthropic. Los prompts de actualización solo aparecen cuando se ejecuta de forma interactiva (TTY); `--non-interactive` omite los intentos de actualización.

    Cuando una actualización de OAuth falla de forma permanente (por ejemplo `refresh_token_reused`, `invalid_grant` o un proveedor que te indica iniciar sesión de nuevo), Doctor informa que se requiere volver a autenticar e imprime el comando exacto `openclaw models auth login --provider ...` que debes ejecutar.

    Doctor también informa perfiles de autenticación que no se pueden usar temporalmente debido a:

    - enfriamientos cortos (límites de tasa/tiempos de espera/fallos de autenticación)
    - deshabilitaciones más largas (fallos de facturación/crédito)

  </Accordion>
  <Accordion title="6. Validación del modelo de hooks">
    Si `hooks.gmail.model` está configurado, Doctor valida la referencia del modelo contra el catálogo y la lista de permitidos, y advierte cuando no se puede resolver o no está permitida.
  </Accordion>
  <Accordion title="7. Reparación de imagen de sandbox">
    Cuando el sandbox está habilitado, Doctor comprueba las imágenes de Docker y ofrece compilar o cambiar a nombres heredados si falta la imagen actual.
  </Accordion>
  <Accordion title="7b. Limpieza de instalación de Plugins">
    Doctor elimina el estado heredado de preparación de dependencias de Plugins generado por OpenClaw en modo `openclaw doctor --fix` / `openclaw doctor --repair`. Esto cubre raíces de dependencias generadas obsoletas, directorios antiguos de etapa de instalación, residuos locales del paquete de código anterior de reparación de dependencias de Plugins incluidos, y copias gestionadas de npm huérfanas o recuperadas de Plugins `@openclaw/*` incluidos que pueden ocultar el manifiesto incluido actual.

    Doctor también puede reinstalar Plugins descargables faltantes cuando la configuración los referencia pero el registro local de Plugins no puede encontrarlos. Entre los ejemplos se incluyen `plugins.entries` materiales, configuraciones de canal/proveedor/búsqueda configuradas y runtimes de agentes configurados. Durante las actualizaciones de paquetes, Doctor evita ejecutar la reparación de Plugins con el gestor de paquetes mientras se está sustituyendo el paquete principal; ejecuta `openclaw doctor --fix` de nuevo después de la actualización si un Plugin configurado todavía necesita recuperación. El inicio del Gateway y la recarga de configuración no ejecutan gestores de paquetes; las instalaciones de Plugins siguen siendo trabajo explícito de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migraciones del servicio Gateway y sugerencias de limpieza">
    Doctor detecta servicios Gateway heredados (launchd/systemd/schtasks) y ofrece eliminarlos e instalar el servicio OpenClaw usando el puerto actual del Gateway. También puede examinar servicios adicionales similares a Gateway e imprimir sugerencias de limpieza. Los servicios Gateway de OpenClaw con nombre de perfil se consideran de primera clase y no se marcan como "extra".

    En Linux, si falta el servicio Gateway de nivel de usuario pero existe un servicio Gateway de OpenClaw de nivel de sistema, Doctor no instala automáticamente un segundo servicio de nivel de usuario. Inspecciona con `openclaw gateway status --deep` u `openclaw doctor --deep`, luego elimina el duplicado o configura `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando un supervisor del sistema controla el ciclo de vida del Gateway.

  </Accordion>
  <Accordion title="8b. Migración de inicio de Matrix">
    Cuando una cuenta de canal Matrix tiene una migración de estado heredada pendiente o accionable, Doctor (en modo `--fix` / `--repair`) crea una instantánea previa a la migración y luego ejecuta los pasos de migración de mejor esfuerzo: migración de estado heredado de Matrix y preparación de estado cifrado heredado. Ambos pasos no son fatales; los errores se registran y el inicio continúa. En modo de solo lectura (`openclaw doctor` sin `--fix`), esta comprobación se omite por completo.
  </Accordion>
  <Accordion title="8c. Emparejamiento de dispositivos y desviación de autenticación">
    Doctor ahora inspecciona el estado de emparejamiento de dispositivos como parte del pase normal de salud.

    Qué informa:

    - solicitudes de emparejamiento por primera vez pendientes
    - actualizaciones de rol pendientes para dispositivos ya emparejados
    - actualizaciones de alcance pendientes para dispositivos ya emparejados
    - reparaciones de discrepancia de clave pública donde el id del dispositivo todavía coincide pero la identidad del dispositivo ya no coincide con el registro aprobado
    - registros emparejados a los que les falta un token activo para un rol aprobado
    - tokens emparejados cuyos alcances se desvían de la base de emparejamiento aprobada
    - entradas locales en caché de tokens de dispositivo para la máquina actual anteriores a una rotación de tokens del lado del Gateway o con metadatos de alcance obsoletos

    Doctor no aprueba automáticamente solicitudes de emparejamiento ni rota automáticamente tokens de dispositivo. En su lugar, imprime los pasos siguientes exactos:

    - inspeccionar solicitudes pendientes con `openclaw devices list`
    - aprobar la solicitud exacta con `openclaw devices approve <requestId>`
    - rotar un token nuevo con `openclaw devices rotate --device <deviceId> --role <role>`
    - eliminar y volver a aprobar un registro obsoleto con `openclaw devices remove <deviceId>`

    Esto cierra el hueco común de "ya emparejado pero todavía aparece emparejamiento requerido": Doctor ahora distingue el emparejamiento por primera vez de las actualizaciones pendientes de rol/alcance y de la desviación obsoleta de token/identidad de dispositivo.

  </Accordion>
  <Accordion title="9. Advertencias de seguridad">
    Doctor emite advertencias cuando un proveedor está abierto a DM sin una lista de permitidos, o cuando una política está configurada de forma peligrosa.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Si se ejecuta como servicio de usuario de systemd, Doctor garantiza que linger esté habilitado para que el Gateway siga activo después de cerrar sesión.
  </Accordion>
  <Accordion title="11. Estado del espacio de trabajo (Skills, Plugins y directorios heredados)">
    Doctor imprime un resumen del estado del espacio de trabajo para el agente predeterminado:

    - **Estado de Skills**: cuenta Skills elegibles, con requisitos faltantes y bloqueadas por lista de permitidos.
    - **Directorios de espacio de trabajo heredados**: advierte cuando `~/openclaw` u otros directorios de espacio de trabajo heredados existen junto al espacio de trabajo actual.
    - **Estado de Plugins**: cuenta Plugins habilitados/deshabilitados/con error; enumera los ID de Plugin para cualquier error; informa capacidades de Plugins del paquete.
    - **Advertencias de compatibilidad de Plugins**: marca Plugins que tienen problemas de compatibilidad con el runtime actual.
    - **Diagnósticos de Plugins**: muestra cualquier advertencia o error de tiempo de carga emitido por el registro de Plugins.

  </Accordion>
  <Accordion title="11b. Tamaño del archivo de arranque">
    Doctor comprueba si los archivos de arranque del espacio de trabajo (por ejemplo `AGENTS.md`, `CLAUDE.md` u otros archivos de contexto inyectados) están cerca o por encima del presupuesto de caracteres configurado. Informa recuentos de caracteres sin procesar frente a inyectados por archivo, porcentaje de truncamiento, causa de truncamiento (`max/file` o `max/total`) y total de caracteres inyectados como fracción del presupuesto total. Cuando los archivos se truncan o están cerca del límite, Doctor imprime consejos para ajustar `agents.defaults.bootstrapMaxChars` y `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpieza de Plugins de canal obsoletos">
    Cuando `openclaw doctor --fix` elimina un Plugin de canal faltante, también elimina la configuración colgante con alcance de canal que referenciaba ese Plugin: entradas `channels.<id>`, objetivos Heartbeat que nombraban el canal y sobrescrituras `agents.*.models["<channel>/*"]`. Esto evita bucles de arranque del Gateway donde el runtime del canal ya no existe pero la configuración todavía pide al Gateway que se enlace a él.
  </Accordion>
  <Accordion title="11c. Autocompletado de shell">
    Doctor comprueba si el autocompletado con tabulador está instalado para el shell actual (zsh, bash, fish o PowerShell):

    - Si el perfil del shell usa un patrón de autocompletado dinámico lento (`source <(openclaw completion ...)`), Doctor lo actualiza a la variante de archivo en caché más rápida.
    - Si el autocompletado está configurado en el perfil pero falta el archivo de caché, Doctor regenera la caché automáticamente.
    - Si no hay ningún autocompletado configurado, Doctor solicita instalarlo (solo en modo interactivo; se omite con `--non-interactive`).

    Ejecuta `openclaw completion --write-state` para regenerar la caché manualmente.

  </Accordion>
  <Accordion title="12. Comprobaciones de autenticación del Gateway (token local)">
    Doctor comprueba la preparación de autenticación con token local del Gateway.

    - Si el modo de token necesita un token y no existe ninguna fuente de token, Doctor ofrece generar uno.
    - Si `gateway.auth.token` está gestionado por SecretRef pero no está disponible, Doctor advierte y no lo sobrescribe con texto plano.
    - `openclaw doctor --generate-gateway-token` fuerza la generación solo cuando no hay ningún SecretRef de token configurado.

  </Accordion>
  <Accordion title="12b. Reparaciones de solo lectura compatibles con SecretRef">
    Algunos flujos de reparación necesitan inspeccionar las credenciales configuradas sin debilitar el comportamiento de fallo rápido en tiempo de ejecución.

    - `openclaw doctor --fix` ahora usa el mismo modelo de resumen SecretRef de solo lectura que los comandos de la familia de estado para reparaciones de configuración dirigidas.
    - Ejemplo: la reparación de Telegram `allowFrom` / `groupAllowFrom` `@username` intenta usar las credenciales de bot configuradas cuando están disponibles.
    - Si el token del bot de Telegram está configurado mediante SecretRef pero no está disponible en la ruta del comando actual, doctor informa que la credencial está configurada-pero-no-disponible y omite la resolución automática en lugar de fallar o informar erróneamente que falta el token.

  </Accordion>
  <Accordion title="13. Comprobación de estado del Gateway + reinicio">
    Doctor ejecuta una comprobación de estado y ofrece reiniciar el gateway cuando parece estar en mal estado.
  </Accordion>
  <Accordion title="13b. Preparación de la búsqueda de memoria">
    Doctor comprueba si el proveedor de embeddings de búsqueda de memoria configurado está listo para el agente predeterminado. El comportamiento depende del backend y el proveedor configurados:

    - **Backend QMD**: comprueba si el binario `qmd` está disponible y se puede iniciar. Si no, imprime orientación de corrección, incluido el paquete npm y una opción de ruta manual al binario.
    - **Proveedor local explícito**: comprueba si existe un archivo de modelo local o una URL de modelo remota/descargable reconocida. Si falta, sugiere cambiar a un proveedor remoto.
    - **Proveedor remoto explícito** (`openai`, `voyage`, etc.): verifica que haya una clave de API presente en el entorno o en el almacén de autenticación. Imprime sugerencias de corrección accionables si falta.
    - **Proveedor automático**: comprueba primero la disponibilidad del modelo local y luego prueba cada proveedor remoto en el orden de selección automática.

    Cuando hay disponible un resultado de sondeo del gateway en caché (el gateway estaba en buen estado en el momento de la comprobación), doctor cruza su resultado con la configuración visible para la CLI y señala cualquier discrepancia. Doctor no inicia un nuevo ping de embeddings en la ruta predeterminada; usa el comando de estado de memoria profundo cuando quieras una comprobación en vivo del proveedor.

    Usa `openclaw memory status --deep` para verificar la preparación de embeddings en tiempo de ejecución.

  </Accordion>
  <Accordion title="14. Advertencias de estado de canales">
    Si el gateway está en buen estado, doctor ejecuta un sondeo de estado de canales e informa advertencias con correcciones sugeridas.
  </Accordion>
  <Accordion title="15. Auditoría y reparación de configuración del supervisor">
    Doctor comprueba la configuración del supervisor instalado (launchd/systemd/schtasks) en busca de valores predeterminados ausentes u obsoletos (por ejemplo, dependencias de systemd network-online y retraso de reinicio). Cuando encuentra una discrepancia, recomienda una actualización y puede reescribir el archivo de servicio/tarea con los valores predeterminados actuales.

    Notas:

    - `openclaw doctor` solicita confirmación antes de reescribir la configuración del supervisor.
    - `openclaw doctor --yes` acepta las solicitudes de reparación predeterminadas.
    - `openclaw doctor --repair` aplica las correcciones recomendadas sin solicitudes de confirmación.
    - `openclaw doctor --repair --force` sobrescribe configuraciones de supervisor personalizadas.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor en modo de solo lectura para el ciclo de vida del servicio de gateway. Sigue informando del estado del servicio y ejecutando reparaciones no relacionadas con el servicio, pero omite la instalación/inicio/reinicio/arranque del servicio, las reescrituras de configuración del supervisor y la limpieza de servicios heredados porque un supervisor externo posee ese ciclo de vida.
    - En Linux, doctor no reescribe los metadatos de comando/punto de entrada mientras la unidad systemd de gateway correspondiente está activa. También ignora unidades adicionales inactivas no heredadas con aspecto de gateway durante el análisis de servicios duplicados, para que los archivos de servicio complementarios no generen ruido de limpieza.
    - Si la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación/reparación del servicio de doctor valida el SecretRef pero no conserva valores de token en texto plano resueltos en los metadatos de entorno del servicio supervisor.
    - Doctor detecta valores de entorno de servicio gestionados respaldados por `.env`/SecretRef que instalaciones antiguas de LaunchAgent, systemd o Windows Scheduled Task incrustaban en línea y reescribe los metadatos del servicio para que esos valores se carguen desde la fuente de tiempo de ejecución en lugar de la definición del supervisor.
    - Doctor detecta cuando el comando del servicio todavía fija un `--port` antiguo después de cambios en `gateway.port` y reescribe los metadatos del servicio al puerto actual.
    - Si la autenticación por token requiere un token y el SecretRef del token configurado no está resuelto, doctor bloquea la ruta de instalación/reparación con orientación accionable.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está establecido, doctor bloquea la instalación/reparación hasta que el modo se establezca explícitamente.
    - Para unidades user-systemd de Linux, las comprobaciones de desviación de token de doctor ahora incluyen fuentes `Environment=` y `EnvironmentFile=` al comparar metadatos de autenticación del servicio.
    - Las reparaciones de servicio de doctor se niegan a reescribir, detener o reiniciar un servicio de gateway desde un binario de OpenClaw anterior cuando la configuración fue escrita por última vez por una versión más reciente. Consulta [Solución de problemas del Gateway](/es/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Siempre puedes forzar una reescritura completa mediante `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos de tiempo de ejecución y puerto del Gateway">
    Doctor inspecciona el tiempo de ejecución del servicio (PID, último estado de salida) y advierte cuando el servicio está instalado pero no se está ejecutando realmente. También comprueba colisiones de puerto en el puerto del gateway (predeterminado `18789`) e informa causas probables (gateway ya en ejecución, túnel SSH).
  </Accordion>
  <Accordion title="17. Mejores prácticas de tiempo de ejecución del Gateway">
    Doctor advierte cuando el servicio de gateway se ejecuta en Bun o en una ruta de Node gestionada por versión (`nvm`, `fnm`, `volta`, `asdf`, etc.). Los canales WhatsApp + Telegram requieren Node, y las rutas de gestores de versiones pueden romperse después de actualizaciones porque el servicio no carga la inicialización de tu shell. Doctor ofrece migrar a una instalación de Node del sistema cuando está disponible (Homebrew/apt/choco).

    Los LaunchAgents de macOS recién instalados o reparados usan un PATH de sistema canónico (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) en lugar de copiar el PATH del shell interactivo, por lo que Volta, asdf, fnm, pnpm y otros directorios de gestores de versiones no cambian qué procesos hijo de Node se resuelven. Los servicios Linux siguen conservando raíces de entorno explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) y directorios user-bin estables, pero los directorios alternativos inferidos de gestores de versiones solo se escriben en el PATH del servicio cuando esos directorios existen en disco.

  </Accordion>
  <Accordion title="18. Escritura de configuración + metadatos del asistente">
    Doctor conserva cualquier cambio de configuración y marca los metadatos del asistente para registrar la ejecución de doctor.
  </Accordion>
  <Accordion title="19. Consejos de espacio de trabajo (copia de seguridad + sistema de memoria)">
    Doctor sugiere un sistema de memoria de espacio de trabajo cuando falta e imprime un consejo de copia de seguridad si el espacio de trabajo aún no está bajo git.

    Consulta [/concepts/agent-workspace](/es/concepts/agent-workspace) para ver una guía completa sobre la estructura del espacio de trabajo y la copia de seguridad con git (se recomienda GitHub o GitLab privado).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Runbook del Gateway](/es/gateway)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
