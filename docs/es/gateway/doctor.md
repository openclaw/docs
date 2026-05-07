---
read_when:
    - Añadir o modificar migraciones de doctor
    - Introducir cambios incompatibles en la configuración
sidebarTitle: Doctor
summary: 'Comando doctor: comprobaciones de estado, migraciones de configuración y pasos de reparación'
title: Doctor
x-i18n:
    generated_at: "2026-05-07T13:16:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7826cb4f3e97e56b07a5ba3b1c61860b15d6831d29012a0a16fe8f5f7014d1d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` es la herramienta de reparación y migración de OpenClaw. Corrige configuración/estado obsoletos, comprueba el estado general y proporciona pasos de reparación accionables.

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

    Aplica también reparaciones agresivas (sobrescribe configuraciones personalizadas del supervisor).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Ejecuta sin prompts y solo aplica migraciones seguras (normalización de configuración + movimientos de estado en disco). Omite acciones de reinicio/servicio/sandbox que requieren confirmación humana. Las migraciones de estado heredado se ejecutan automáticamente cuando se detectan.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Escanea los servicios del sistema en busca de instalaciones adicionales del Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Si quieres revisar los cambios antes de escribirlos, abre primero el archivo de configuración:

```bash
cat ~/.openclaw/openclaw.json
```

## Qué hace (resumen)

<AccordionGroup>
  <Accordion title="Estado, IU y actualizaciones">
    - Actualización opcional previa para instalaciones de git (solo interactiva).
    - Comprobación de vigencia del protocolo de la IU (recompila la IU de Control cuando el esquema del protocolo es más reciente).
    - Comprobación de estado + prompt de reinicio.
    - Resumen de estado de Skills (elegibles/faltantes/bloqueadas) y estado de plugins.

  </Accordion>
  <Accordion title="Configuración y migraciones">
    - Normalización de configuración para valores heredados.
    - Migración de configuración de Talk desde campos planos heredados `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Comprobaciones de migración de navegador para configuraciones heredadas de la extensión de Chrome y preparación de Chrome MCP.
    - Advertencias de overrides del proveedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Advertencias de sombreado de OAuth de Codex (`models.providers.openai-codex`).
    - Comprobación de requisitos previos de TLS de OAuth para perfiles OAuth de OpenAI Codex.
    - Advertencias de lista de permitidos de plugins/herramientas cuando `plugins.allow` es restrictivo pero la política de herramientas aún solicita comodines o herramientas propiedad de plugins.
    - Migración de estado heredado en disco (sesiones/directorio de agente/autenticación de WhatsApp).
    - Migración de claves heredadas del contrato de manifiesto de plugins (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migración del almacén de cron heredado (`jobId`, `schedule.cron`, campos de entrega/carga útil de nivel superior, `provider` de carga útil, trabajos fallback simples de webhook `notify: true`).
    - Migración de política de runtime de agente heredada a `agents.defaults.agentRuntime` y `agents.list[].agentRuntime`.
    - Limpieza de configuración obsoleta de plugins cuando los plugins están habilitados; cuando `plugins.enabled=false`, las referencias obsoletas a plugins se tratan como configuración de contención inerte y se conservan.

  </Accordion>
  <Accordion title="Estado e integridad">
    - Inspección de archivos de bloqueo de sesión y limpieza de bloqueos obsoletos.
    - Reparación de transcripciones de sesión para ramas duplicadas de reescritura de prompts creadas por compilaciones afectadas de 2026.4.24.
    - Detección de lápidas de recuperación de reinicio de subagentes bloqueados, con compatibilidad de `--fix` para limpiar banderas obsoletas de recuperación abortada de modo que el arranque no siga tratando al hijo como abortado por reinicio.
    - Comprobaciones de integridad de estado y permisos (sesiones, transcripciones, directorio de estado).
    - Comprobaciones de permisos del archivo de configuración (chmod 600) al ejecutar localmente.
    - Estado de autenticación de modelos: comprueba la caducidad de OAuth, puede actualizar tokens próximos a caducar e informa estados de enfriamiento/deshabilitación de perfiles de autenticación.
    - Detección de directorio de workspace adicional (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servicios y supervisores">
    - Reparación de imagen de sandbox cuando sandboxing está habilitado.
    - Migración de servicios heredados y detección de gateways adicionales.
    - Migración de estado heredado del canal Matrix (en modo `--fix` / `--repair`).
    - Comprobaciones de runtime del Gateway (servicio instalado pero no en ejecución; etiqueta launchd en caché).
    - Advertencias de estado de canales (sondeadas desde el gateway en ejecución).
    - Las comprobaciones de permisos específicas de canal viven bajo `openclaw channels capabilities`; por ejemplo, los permisos de canales de voz de Discord se auditan con `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Comprobaciones de capacidad de respuesta de WhatsApp para estado degradado del bucle de eventos del Gateway con clientes TUI locales aún en ejecución; `--fix` detiene solo clientes TUI locales verificados.
    - Reparación de rutas de Codex para refs de modelos heredados `openai-codex/*` en modelos primarios, fallbacks, overrides de heartbeat/subagente/compaction, hooks, overrides de modelo de canal y pines de ruta de sesión; `--fix` los reescribe a `openai/*` y selecciona `agentRuntime.id: "codex"` solo cuando el Plugin Codex está instalado, habilitado, aporta el arnés `codex` y tiene OAuth utilizable. De lo contrario, selecciona `agentRuntime.id: "pi"`.
    - Auditoría de configuración de supervisores (launchd/systemd/schtasks) con reparación opcional.
    - Limpieza de entorno de proxy integrado para servicios de gateway que capturaron valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante la instalación o actualización.
    - Comprobaciones de buenas prácticas del runtime del Gateway (Node frente a Bun, rutas de gestores de versiones).
    - Diagnóstico de colisiones de puerto del Gateway (predeterminado `18789`).

  </Accordion>
  <Accordion title="Autenticación, seguridad y emparejamiento">
    - Advertencias de seguridad para políticas de DM abiertos.
    - Comprobaciones de autenticación del Gateway para modo de token local (ofrece generación de token cuando no existe ninguna fuente de token; no sobrescribe configuraciones de token SecretRef).
    - Detección de problemas de emparejamiento de dispositivos (solicitudes pendientes de primer emparejamiento, actualizaciones pendientes de rol/alcance, deriva obsoleta de caché local de token de dispositivo y deriva de autenticación de registros emparejados).

  </Accordion>
  <Accordion title="Workspace y shell">
    - Comprobación de linger de systemd en Linux.
    - Comprobación de tamaño del archivo de arranque del workspace (advertencias de truncamiento/cerca del límite para archivos de contexto).
    - Comprobación de preparación de Skills para el agente predeterminado; informa Skills permitidas con bins, env, configuración o requisitos de SO faltantes, y `--fix` puede deshabilitar Skills no disponibles en `skills.entries`.
    - Comprobación de estado de autocompletado de shell e instalación/actualización automática.
    - Comprobación de preparación del proveedor de embeddings de búsqueda de memoria (modelo local, clave de API remota o binario QMD).
    - Comprobaciones de instalación desde código fuente (desajuste de workspace pnpm, assets de IU faltantes, binario tsx faltante).
    - Escribe la configuración actualizada + metadatos del asistente.

  </Accordion>
</AccordionGroup>

## Relleno retrospectivo y restablecimiento de la IU de Dreams

La escena Dreams de la IU de Control incluye acciones **Backfill**, **Reset** y **Clear Grounded** para el flujo de trabajo de dreaming fundamentado. Estas acciones usan métodos RPC de estilo gateway doctor, pero **no** forman parte de la reparación/migración de la CLI `openclaw doctor`.

Qué hacen:

- **Backfill** escanea archivos históricos `memory/YYYY-MM-DD.md` en el workspace activo, ejecuta la pasada de diario REM fundamentado y escribe entradas reversibles de relleno retrospectivo en `DREAMS.md`.
- **Reset** elimina solo esas entradas de diario de relleno retrospectivo marcadas de `DREAMS.md`.
- **Clear Grounded** elimina solo entradas de corto plazo preparadas y únicamente fundamentadas que proceden de la reproducción histórica y que aún no han acumulado recuperación en vivo ni soporte diario.

Qué **no** hacen por sí mismas:

- no editan `MEMORY.md`
- no ejecutan migraciones completas de doctor
- no preparan automáticamente candidatos fundamentados en el almacén de promoción de corto plazo en vivo a menos que ejecutes explícitamente primero la ruta preparada de la CLI

Si quieres que la reproducción histórica fundamentada influya en el carril normal de promoción profunda, usa el flujo de la CLI en su lugar:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Eso prepara candidatos duraderos fundamentados en el almacén de dreaming de corto plazo, manteniendo `DREAMS.md` como superficie de revisión.

## Comportamiento detallado y justificación

<AccordionGroup>
  <Accordion title="0. Actualización opcional (instalaciones de git)">
    Si esto es un checkout de git y doctor se ejecuta interactivamente, ofrece actualizar (fetch/rebase/build) antes de ejecutar doctor.
  </Accordion>
  <Accordion title="1. Normalización de configuración">
    Si la configuración contiene formas de valores heredadas (por ejemplo `messages.ackReaction` sin un override específico de canal), doctor las normaliza al esquema actual.

    Eso incluye campos planos heredados de Talk. La configuración pública actual de voz de Talk es `talk.provider` + `talk.providers.<provider>`, y la configuración de voz en tiempo real es `talk.realtime.*`. Doctor reescribe formas antiguas `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` al mapa de proveedores, y reescribe selectores heredados de tiempo real de nivel superior (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) a `talk.realtime`.

    Doctor también advierte cuando `plugins.allow` no está vacío y la política de herramientas usa
    entradas de herramientas comodín o propiedad de plugins. `tools.allow: ["*"]` solo coincide con herramientas
    de plugins que realmente se cargan; no omite la lista de permitidos exclusiva de plugins.
    Doctor escribe `plugins.bundledDiscovery: "compat"` para configuraciones heredadas de listas de permitidos migradas con el fin de conservar el comportamiento existente de proveedores agrupados, y
    luego apunta al ajuste más estricto `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migraciones de claves de configuración heredadas">
    Cuando la configuración contiene claves obsoletas, otros comandos se niegan a ejecutarse y te piden que ejecutes `openclaw doctor`.

    Doctor hará lo siguiente:

    - Explicar qué claves heredadas se encontraron.
    - Mostrar la migración que aplicó.
    - Reescribir `~/.openclaw/openclaw.json` con el esquema actualizado.

    El arranque del Gateway rechaza formatos de configuración heredados y te pide que ejecutes `openclaw doctor --fix`; no reescribe `openclaw.json` durante el arranque. Las migraciones del almacén de trabajos Cron también las gestiona `openclaw doctor --fix`.

    Migraciones actuales:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - configuraciones de canales configurados sin política visible de respuesta → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` de nivel superior
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` heredados → `talk.provider` + `talk.providers.<provider>`
    - selectores de Talk en tiempo real heredados de nivel superior (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Para canales con `accounts` con nombre pero valores de canal de nivel superior de una sola cuenta aún presentes, mueve esos valores con ámbito de cuenta a la cuenta promocionada elegida para ese canal (`accounts.default` para la mayoría de los canales; Matrix puede conservar un destino con nombre/predeterminado coincidente existente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - elimina `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` para tiempos de espera de proveedores/modelos lentos
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - elimina `browser.relayBindHost` (configuración heredada del relé de extensión)
    - `models.providers.*.api: "openai"` heredado → `"openai-completions"` (el inicio del Gateway también omite los proveedores cuyo `api` está configurado con un valor enum futuro o desconocido en lugar de fallar cerrado)

    Las advertencias de Doctor también incluyen orientación sobre cuentas predeterminadas para canales con varias cuentas:

    - Si se configuran dos o más entradas `channels.<channel>.accounts` sin `channels.<channel>.defaultAccount` ni `accounts.default`, Doctor advierte que el enrutamiento de reserva puede elegir una cuenta inesperada.
    - Si `channels.<channel>.defaultAccount` está configurado con un ID de cuenta desconocido, Doctor advierte y enumera los IDs de cuenta configurados.

  </Accordion>
  <Accordion title="2b. Anulaciones de proveedor OpenCode">
    Si has agregado `models.providers.opencode`, `opencode-zen` u `opencode-go` manualmente, anula el catálogo OpenCode integrado de `@mariozechner/pi-ai`. Eso puede forzar modelos a la API incorrecta o poner los costos en cero. Doctor advierte para que puedas eliminar la anulación y restaurar el enrutamiento de API + costos por modelo.
  </Accordion>
  <Accordion title="2c. Migración del navegador y preparación para Chrome MCP">
    Si tu configuración del navegador aún apunta a la ruta eliminada de la extensión de Chrome, Doctor la normaliza al modelo actual de conexión Chrome MCP local al host:

    - `browser.profiles.*.driver: "extension"` se convierte en `"existing-session"`
    - `browser.relayBindHost` se elimina

    Doctor también audita la ruta Chrome MCP local al host cuando usas `defaultProfile: "user"` o un perfil `existing-session` configurado:

    - comprueba si Google Chrome está instalado en el mismo host para los perfiles predeterminados de conexión automática
    - comprueba la versión de Chrome detectada y advierte cuando es inferior a Chrome 144
    - te recuerda habilitar la depuración remota en la página de inspección del navegador (por ejemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor no puede habilitar la configuración del lado de Chrome por ti. Chrome MCP local al host aún requiere:

    - un navegador basado en Chromium 144+ en el host del gateway/nodo
    - el navegador ejecutándose localmente
    - depuración remota habilitada en ese navegador
    - aprobar el primer mensaje de consentimiento de conexión en el navegador

    La preparación aquí solo trata de los prerrequisitos de conexión local. Existing-session conserva los límites actuales de rutas de Chrome MCP; las rutas avanzadas como `responsebody`, exportación de PDF, interceptación de descargas y acciones por lotes aún requieren un navegador administrado o un perfil CDP sin procesar.

    Esta comprobación **no** se aplica a Docker, sandbox, remote-browser ni a otros flujos headless. Esos siguen usando CDP sin procesar.

  </Accordion>
  <Accordion title="2d. Prerrequisitos de OAuth TLS">
    Cuando se configura un perfil de OpenAI Codex OAuth, Doctor sondea el endpoint de autorización de OpenAI para verificar que la pila TLS local de Node/OpenSSL pueda validar la cadena de certificados. Si el sondeo falla con un error de certificado (por ejemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado caducado o certificado autofirmado), Doctor imprime orientación de corrección específica de la plataforma. En macOS con un Node de Homebrew, la corrección suele ser `brew postinstall ca-certificates`. Con `--deep`, el sondeo se ejecuta aunque el gateway esté en buen estado.
  </Accordion>
  <Accordion title="2e. Anulaciones de proveedor Codex OAuth">
    Si anteriormente agregaste configuraciones de transporte heredadas en `models.providers.openai-codex`, pueden ocultar la ruta de proveedor Codex OAuth integrada que las versiones más nuevas usan automáticamente. Doctor advierte cuando ve esas configuraciones de transporte antiguas junto con Codex OAuth para que puedas eliminar o reescribir la anulación de transporte obsoleta y recuperar el comportamiento integrado de enrutamiento/reserva. Los proxies personalizados y las anulaciones solo de encabezados siguen siendo compatibles y no activan esta advertencia.
  </Accordion>
  <Accordion title="2f. Reparación de rutas Codex">
    Doctor comprueba referencias de modelo `openai-codex/*` heredadas. El enrutamiento nativo del arnés Codex usa referencias de modelo canónicas `openai/*`; los turnos del agente OpenAI pasan por el arnés de servidor de aplicación Codex en lugar de la ruta OpenClaw PI OpenAI.

    En modo `--fix` / `--repair`, Doctor reescribe las referencias afectadas del agente predeterminado y por agente, incluidos modelos primarios, reservas, anulaciones de heartbeat/subagente/compaction, hooks, anulaciones de modelo de canal y estado de ruta de sesión persistido obsoleto:

    - `openai-codex/gpt-*` se convierte en `openai/gpt-*`.
    - El runtime de agente coincidente se convierte en `agentRuntime.id: "codex"` solo cuando Codex está instalado, habilitado, aporta el arnés `codex` y tiene OAuth utilizable.
    - De lo contrario, el runtime de agente coincidente se convierte en `agentRuntime.id: "pi"`.
    - Las listas de reserva de modelos existentes se conservan con sus entradas heredadas reescritas; las configuraciones por modelo copiadas se mueven de la clave heredada a la clave canónica `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, avisos de reserva, pines de perfil de autenticación y pines de arnés Codex de sesión persistida se reparan en todos los almacenes de sesión de agente descubiertos.
    - `/codex ...` significa "controlar o vincular una conversación nativa de Codex desde el chat".
    - `/acp ...` o `runtime: "acp"` significa "usar el adaptador externo ACP/acpx".

  </Accordion>
  <Accordion title="2g. Limpieza de rutas de sesión">
    Doctor también analiza los almacenes de sesión de agente descubiertos en busca de estado de ruta obsoleto creado automáticamente después de que mueves modelos configurados o el runtime fuera de una ruta propiedad de un Plugin, como Codex.

    `openclaw doctor --fix` puede borrar estado obsoleto creado automáticamente, como pines de modelo `modelOverrideSource: "auto"`, metadatos de modelo de runtime, IDs de arnés fijados, vinculaciones de sesión CLI y anulaciones automáticas de perfil de autenticación cuando su ruta propietaria ya no está configurada. Las elecciones explícitas de usuario o de modelos de sesión heredados se notifican para revisión manual y se dejan intactas; cámbialas con `/model ...`, `/new` o restablece la sesión cuando esa ruta ya no esté prevista.

  </Accordion>
  <Accordion title="3. Migraciones de estado heredado (distribución en disco)">
    Doctor puede migrar distribuciones antiguas en disco a la estructura actual:

    - Almacén de sesiones + transcripciones:
      - de `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directorio de agente:
      - de `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticación de WhatsApp (Baileys):
      - de `~/.openclaw/credentials/*.json` heredado (excepto `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (id de cuenta predeterminado: `default`)

    Estas migraciones se realizan con el mejor esfuerzo y son idempotentes; Doctor emitirá advertencias cuando deje carpetas heredadas como copias de seguridad. El Gateway/CLI también migra automáticamente el directorio heredado de sesiones + agente al iniciar, para que el historial/la autenticación/los modelos queden en la ruta por agente sin ejecutar Doctor manualmente. La autenticación de WhatsApp se migra intencionalmente solo mediante `openclaw doctor`. La normalización del proveedor/mapa de proveedores de Talk ahora compara por igualdad estructural, de modo que las diferencias solo de orden de claves ya no activan cambios `doctor --fix` repetidos sin efecto.

  </Accordion>
  <Accordion title="3a. Migraciones de manifiestos de Plugin heredados">
    Doctor analiza todos los manifiestos de Plugin instalados en busca de claves de capacidades de nivel superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Cuando las encuentra, ofrece moverlas al objeto `contracts` y reescribir el archivo de manifiesto en el lugar. Esta migración es idempotente; si la clave `contracts` ya tiene los mismos valores, la clave heredada se elimina sin duplicar los datos.
  </Accordion>
  <Accordion title="3b. Migraciones del almacén Cron heredado">
    Doctor también comprueba el almacén de trabajos Cron (`~/.openclaw/cron/jobs.json` de forma predeterminada, o `cron.store` cuando se anula) en busca de formas antiguas de trabajo que el planificador aún acepta por compatibilidad.

    Las limpiezas actuales de Cron incluyen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de payload de nivel superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nivel superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de entrega `provider` de payload → `delivery.channel` explícito
    - trabajos de reserva de Webhook heredados simples `notify: true` → `delivery.mode="webhook"` explícito con `delivery.to=cron.webhook`

    Doctor solo migra automáticamente trabajos con `notify: true` cuando puede hacerlo sin cambiar el comportamiento. Si un trabajo combina la reserva de notificación heredada con un modo de entrega no Webhook existente, doctor avisa y deja ese trabajo para revisión manual.

    En Linux, doctor también avisa cuando el crontab del usuario todavía invoca el script heredado `~/.openclaw/bin/ensure-whatsapp.sh`. Ese script local del host no recibe mantenimiento en la versión actual de OpenClaw y puede escribir mensajes falsos de `Gateway inactive` en `~/.openclaw/logs/whatsapp-health.log` cuando cron no puede alcanzar el bus de usuario de systemd. Elimina la entrada obsoleta del crontab con `crontab -e`; usa `openclaw channels status --probe`, `openclaw doctor` y `openclaw gateway status` para las comprobaciones de estado actuales.

  </Accordion>
  <Accordion title="3c. Limpieza de bloqueos de sesión">
    Doctor escanea todos los directorios de sesiones de agentes en busca de archivos de bloqueo de escritura obsoletos: archivos que quedaron atrás cuando una sesión terminó de forma anómala. Para cada archivo de bloqueo encontrado informa: la ruta, el PID, si el PID sigue activo, la antigüedad del bloqueo y si se considera obsoleto (PID muerto o más de 30 minutos). En modo `--fix` / `--repair`, elimina automáticamente los archivos de bloqueo obsoletos; de lo contrario, imprime una nota y te indica que vuelvas a ejecutarlo con `--fix`.
  </Accordion>
  <Accordion title="3d. Reparación de ramas de transcripción de sesión">
    Doctor escanea archivos JSONL de sesiones de agentes para detectar la forma de rama duplicada creada por el error de reescritura de transcripciones de prompts de 2026.4.24: un turno de usuario abandonado con contexto de ejecución interno de OpenClaw más un hermano activo que contiene el mismo prompt de usuario visible. En modo `--fix` / `--repair`, doctor respalda cada archivo afectado junto al original y reescribe la transcripción a la rama activa para que el historial del Gateway y los lectores de memoria ya no vean turnos duplicados.
  </Accordion>
  <Accordion title="4. Comprobaciones de integridad de estado (persistencia de sesión, enrutamiento y seguridad)">
    El directorio de estado es el tronco encefálico operativo. Si desaparece, pierdes sesiones, credenciales, registros y configuración (a menos que tengas copias de seguridad en otro lugar).

    Doctor comprueba:

    - **Falta el directorio de estado**: advierte sobre pérdida catastrófica de estado, solicita recrear el directorio y recuerda que no puede recuperar datos faltantes.
    - **Permisos del directorio de estado**: verifica que sea escribible; ofrece reparar permisos (y emite una sugerencia de `chown` cuando detecta una discrepancia de propietario/grupo).
    - **Directorio de estado sincronizado con la nube en macOS**: advierte cuando el estado se resuelve bajo iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...` porque las rutas respaldadas por sincronización pueden causar E/S más lenta y carreras de bloqueo/sincronización.
    - **Directorio de estado en SD o eMMC en Linux**: advierte cuando el estado se resuelve en un origen de montaje `mmcblk*`, porque la E/S aleatoria respaldada por SD o eMMC puede ser más lenta y desgastarse más rápido con escrituras de sesiones y credenciales.
    - **Faltan directorios de sesión**: `sessions/` y el directorio de almacenamiento de sesiones son necesarios para persistir el historial y evitar fallos `ENOENT`.
    - **Discrepancia de transcripción**: advierte cuando entradas de sesión recientes no tienen archivos de transcripción.
    - **Sesión principal "JSONL de 1 línea"**: marca cuando la transcripción principal solo tiene una línea (el historial no se está acumulando).
    - **Varios directorios de estado**: advierte cuando existen varias carpetas `~/.openclaw` entre directorios home o cuando `OPENCLAW_STATE_DIR` apunta a otro lugar (el historial puede dividirse entre instalaciones).
    - **Recordatorio de modo remoto**: si `gateway.mode=remote`, doctor te recuerda ejecutarlo en el host remoto (el estado vive allí).
    - **Permisos del archivo de configuración**: advierte si `~/.openclaw/openclaw.json` es legible por grupo/todos y ofrece restringirlo a `600`.

  </Accordion>
  <Accordion title="5. Estado de autenticación de modelos (caducidad de OAuth)">
    Doctor inspecciona perfiles OAuth en el almacén de autenticación, advierte cuando los tokens están por caducar o han caducado, y puede renovarlos cuando es seguro hacerlo. Si el perfil OAuth/token de Anthropic está obsoleto, sugiere una clave de API de Anthropic o la ruta de setup-token de Anthropic. Las solicitudes de renovación solo aparecen cuando se ejecuta de forma interactiva (TTY); `--non-interactive` omite los intentos de renovación.

    Cuando una renovación de OAuth falla de forma permanente (por ejemplo `refresh_token_reused`, `invalid_grant` o un proveedor que te indica iniciar sesión de nuevo), doctor informa que se requiere volver a autenticarse e imprime el comando exacto `openclaw models auth login --provider ...` que debes ejecutar.

    Doctor también informa perfiles de autenticación que no se pueden usar temporalmente debido a:

    - esperas breves (límites de tasa/tiempos de espera/fallos de autenticación)
    - deshabilitaciones más largas (fallos de facturación/crédito)

  </Accordion>
  <Accordion title="6. Validación del modelo de hooks">
    Si `hooks.gmail.model` está configurado, doctor valida la referencia del modelo contra el catálogo y la lista de permitidos, y advierte cuando no se resolverá o no está permitido.
  </Accordion>
  <Accordion title="7. Reparación de imagen de sandbox">
    Cuando el sandboxing está habilitado, doctor comprueba imágenes de Docker y ofrece construirlas o cambiar a nombres heredados si falta la imagen actual.
  </Accordion>
  <Accordion title="7b. Limpieza de instalación de Plugin">
    Doctor elimina el estado heredado de preparación de dependencias de plugins generado por OpenClaw en modo `openclaw doctor --fix` / `openclaw doctor --repair`. Esto cubre raíces de dependencias generadas obsoletas, directorios antiguos de etapa de instalación, restos locales de paquetes de código anterior de reparación de dependencias de plugins integrados, y copias administradas de npm huérfanas o recuperadas de plugins `@openclaw/*` integrados que pueden eclipsar el manifiesto integrado actual.

    Doctor también puede reinstalar plugins descargables faltantes cuando la configuración los referencia pero el registro local de plugins no puede encontrarlos. Los ejemplos incluyen `plugins.entries` materiales, ajustes configurados de canal/proveedor/búsqueda y runtimes de agentes configurados. Durante actualizaciones de paquetes, doctor evita ejecutar la reparación de plugins del gestor de paquetes mientras se está intercambiando el paquete central; ejecuta `openclaw doctor --fix` de nuevo después de la actualización si un plugin configurado aún necesita recuperación. El inicio del Gateway y la recarga de configuración no ejecutan gestores de paquetes; las instalaciones de plugins siguen siendo trabajo explícito de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migraciones del servicio Gateway y sugerencias de limpieza">
    Doctor detecta servicios Gateway heredados (launchd/systemd/schtasks) y ofrece eliminarlos e instalar el servicio de OpenClaw usando el puerto de Gateway actual. También puede escanear servicios adicionales similares al Gateway e imprimir sugerencias de limpieza. Los servicios Gateway de OpenClaw con nombre de perfil se consideran de primera clase y no se marcan como "extra."

    En Linux, si falta el servicio Gateway de nivel de usuario pero existe un servicio Gateway de OpenClaw de nivel de sistema, doctor no instala automáticamente un segundo servicio de nivel de usuario. Inspecciona con `openclaw gateway status --deep` o `openclaw doctor --deep`, luego elimina el duplicado o establece `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando un supervisor del sistema posee el ciclo de vida del Gateway.

  </Accordion>
  <Accordion title="8b. Migración de inicio de Matrix">
    Cuando una cuenta de canal Matrix tiene una migración de estado heredado pendiente o accionable, doctor (en modo `--fix` / `--repair`) crea una instantánea previa a la migración y luego ejecuta los pasos de migración de mejor esfuerzo: migración de estado heredado de Matrix y preparación de estado cifrado heredado. Ambos pasos no son fatales; los errores se registran y el inicio continúa. En modo de solo lectura (`openclaw doctor` sin `--fix`) esta comprobación se omite por completo.
  </Accordion>
  <Accordion title="8c. Emparejamiento de dispositivos y deriva de autenticación">
    Doctor ahora inspecciona el estado de emparejamiento de dispositivos como parte del pase normal de estado.

    Lo que informa:

    - solicitudes pendientes de primer emparejamiento
    - actualizaciones de rol pendientes para dispositivos ya emparejados
    - actualizaciones de alcance pendientes para dispositivos ya emparejados
    - reparaciones de discrepancia de clave pública donde el id del dispositivo todavía coincide, pero la identidad del dispositivo ya no coincide con el registro aprobado
    - registros emparejados sin un token activo para un rol aprobado
    - tokens emparejados cuyos alcances derivan fuera de la línea base de emparejamiento aprobada
    - entradas de token de dispositivo en caché local para la máquina actual que son anteriores a una rotación de token del lado del Gateway o contienen metadatos de alcance obsoletos

    Doctor no aprueba automáticamente solicitudes de emparejamiento ni rota automáticamente tokens de dispositivo. En su lugar imprime los pasos siguientes exactos:

    - inspecciona solicitudes pendientes con `openclaw devices list`
    - aprueba la solicitud exacta con `openclaw devices approve <requestId>`
    - rota un token nuevo con `openclaw devices rotate --device <deviceId> --role <role>`
    - elimina y vuelve a aprobar un registro obsoleto con `openclaw devices remove <deviceId>`

    Esto cierra el hueco común de "ya emparejado pero sigue apareciendo emparejamiento requerido": doctor ahora distingue el primer emparejamiento de las actualizaciones pendientes de rol/alcance y de la deriva obsoleta de token/identidad de dispositivo.

  </Accordion>
  <Accordion title="9. Advertencias de seguridad">
    Doctor emite advertencias cuando un proveedor está abierto a mensajes directos sin una lista de permitidos, o cuando una política está configurada de forma peligrosa.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Si se ejecuta como servicio de usuario de systemd, doctor asegura que linger esté habilitado para que el Gateway siga activo después de cerrar sesión.
  </Accordion>
  <Accordion title="11. Estado del espacio de trabajo (Skills, plugins y directorios heredados)">
    Doctor imprime un resumen del estado del espacio de trabajo para el agente predeterminado:

    - **Estado de Skills**: cuenta skills elegibles, con requisitos faltantes y bloqueadas por la lista de permitidos.
    - **Directorios de espacio de trabajo heredados**: advierte cuando `~/openclaw` u otros directorios de espacio de trabajo heredados existen junto al espacio de trabajo actual.
    - **Estado de Plugin**: cuenta plugins habilitados/deshabilitados/con errores; enumera los ID de plugins para cualquier error; informa las capacidades de plugins del paquete.
    - **Advertencias de compatibilidad de Plugin**: marca plugins que tienen problemas de compatibilidad con el runtime actual.
    - **Diagnósticos de Plugin**: muestra cualquier advertencia o error de tiempo de carga emitido por el registro de plugins.

  </Accordion>
  <Accordion title="11b. Tamaño del archivo de arranque">
    Doctor comprueba si los archivos de arranque del espacio de trabajo (por ejemplo `AGENTS.md`, `CLAUDE.md` u otros archivos de contexto inyectados) están cerca o por encima del presupuesto de caracteres configurado. Informa recuentos de caracteres sin procesar frente a inyectados por archivo, porcentaje de truncamiento, causa de truncamiento (`max/file` o `max/total`) y total de caracteres inyectados como fracción del presupuesto total. Cuando los archivos están truncados o cerca del límite, doctor imprime consejos para ajustar `agents.defaults.bootstrapMaxChars` y `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpieza de plugins de canal obsoletos">
    Cuando `openclaw doctor --fix` elimina un plugin de canal faltante, también elimina la configuración colgante con alcance de canal que referenciaba ese plugin: entradas `channels.<id>`, objetivos de Heartbeat que nombraban el canal y overrides `agents.*.models["<channel>/*"]`. Esto evita bucles de arranque del Gateway donde el runtime del canal ya no existe, pero la configuración aún pide al Gateway que se vincule a él.
  </Accordion>
  <Accordion title="11c. Autocompletado de shell">
    Doctor comprueba si el autocompletado por tabulación está instalado para el shell actual (zsh, bash, fish o PowerShell):

    - Si el perfil del shell usa un patrón de autocompletado dinámico lento (`source <(openclaw completion ...)`), doctor lo actualiza a la variante más rápida de archivo en caché.
    - Si el autocompletado está configurado en el perfil pero falta el archivo de caché, doctor regenera la caché automáticamente.
    - Si no hay autocompletado configurado en absoluto, doctor solicita instalarlo (solo en modo interactivo; se omite con `--non-interactive`).

    Ejecuta `openclaw completion --write-state` para regenerar la caché manualmente.

  </Accordion>
  <Accordion title="12. Comprobaciones de autenticación del Gateway (token local)">
    Doctor comprueba la preparación de autenticación por token del Gateway local.

    - Si el modo token necesita un token y no existe ninguna fuente de token, doctor ofrece generar uno.
    - Si `gateway.auth.token` está administrado por SecretRef pero no está disponible, doctor advierte y no lo sobrescribe con texto plano.
    - `openclaw doctor --generate-gateway-token` fuerza la generación solo cuando no hay ningún token SecretRef configurado.

  </Accordion>
  <Accordion title="12b. Reparaciones de solo lectura compatibles con SecretRef">
    Algunos flujos de reparación necesitan inspeccionar las credenciales configuradas sin debilitar el comportamiento de fallo rápido del runtime.

    - `openclaw doctor --fix` ahora usa el mismo modelo de resumen SecretRef de solo lectura que los comandos de la familia de estado para reparaciones de configuración específicas.
    - Ejemplo: la reparación de Telegram `allowFrom` / `groupAllowFrom` `@username` intenta usar las credenciales de bot configuradas cuando están disponibles.
    - Si el token del bot de Telegram está configurado mediante SecretRef pero no está disponible en la ruta del comando actual, doctor informa que la credencial está configurada pero no disponible y omite la resolución automática en lugar de fallar o informar erróneamente que falta el token.

  </Accordion>
  <Accordion title="13. Comprobación de estado del Gateway + reinicio">
    Doctor ejecuta una comprobación de estado y ofrece reiniciar el gateway cuando parece estar en mal estado.
  </Accordion>
  <Accordion title="13b. Preparación de búsqueda en memoria">
    Doctor comprueba si el proveedor de embeddings de búsqueda en memoria configurado está listo para el agente predeterminado. El comportamiento depende del backend y del proveedor configurados:

    - **Backend QMD**: sondea si el binario `qmd` está disponible y se puede iniciar. Si no, imprime orientación de corrección que incluye el paquete npm y una opción de ruta manual al binario.
    - **Proveedor local explícito**: comprueba si existe un archivo de modelo local o una URL de modelo remoto/descargable reconocida. Si falta, sugiere cambiar a un proveedor remoto.
    - **Proveedor remoto explícito** (`openai`, `voyage`, etc.): verifica que haya una clave de API en el entorno o en el almacén de autenticación. Imprime indicaciones de corrección accionables si falta.
    - **Proveedor automático**: comprueba primero la disponibilidad del modelo local y luego prueba cada proveedor remoto en el orden de selección automática.

    Cuando hay disponible un resultado de sondeo de gateway en caché (el gateway estaba en buen estado en el momento de la comprobación), doctor compara su resultado con la configuración visible para la CLI y señala cualquier discrepancia. Doctor no inicia un ping de embedding nuevo en la ruta predeterminada; usa el comando de estado profundo de memoria cuando quieras una comprobación en vivo del proveedor.

    Usa `openclaw memory status --deep` para verificar la preparación de embeddings en runtime.

  </Accordion>
  <Accordion title="14. Advertencias de estado del canal">
    Si el gateway está en buen estado, doctor ejecuta un sondeo de estado del canal e informa advertencias con correcciones sugeridas.
  </Accordion>
  <Accordion title="15. Auditoría y reparación de configuración del supervisor">
    Doctor comprueba la configuración instalada del supervisor (launchd/systemd/schtasks) para detectar valores predeterminados faltantes u obsoletos (por ejemplo, dependencias de systemd network-online y retraso de reinicio). Cuando encuentra una discrepancia, recomienda una actualización y puede reescribir el archivo de servicio/tarea con los valores predeterminados actuales.

    Notas:

    - `openclaw doctor` solicita confirmación antes de reescribir la configuración del supervisor.
    - `openclaw doctor --yes` acepta las solicitudes de reparación predeterminadas.
    - `openclaw doctor --repair` aplica las correcciones recomendadas sin solicitudes.
    - `openclaw doctor --repair --force` sobrescribe configuraciones personalizadas del supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor en modo de solo lectura para el ciclo de vida del servicio del gateway. Todavía informa el estado del servicio y ejecuta reparaciones no relacionadas con el servicio, pero omite la instalación/inicio/reinicio/bootstrap del servicio, las reescrituras de configuración del supervisor y la limpieza de servicios heredados porque un supervisor externo es dueño de ese ciclo de vida.
    - En Linux, doctor no reescribe los metadatos de comando/punto de entrada mientras la unidad systemd del gateway correspondiente está activa. También ignora unidades adicionales inactivas no heredadas similares al gateway durante el escaneo de servicios duplicados para que los archivos de servicio complementarios no generen ruido de limpieza.
    - Si la autenticación con token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación/reparación del servicio de doctor valida el SecretRef pero no persiste valores de token en texto plano resueltos en los metadatos del entorno del servicio del supervisor.
    - Doctor detecta valores de entorno de servicio gestionados mediante `.env`/SecretRef que instalaciones antiguas de LaunchAgent, systemd o Windows Scheduled Task incrustaban en línea y reescribe los metadatos del servicio para que esos valores se carguen desde la fuente de runtime en lugar de la definición del supervisor.
    - Doctor detecta cuando el comando del servicio todavía fija un `--port` antiguo después de cambios en `gateway.port` y reescribe los metadatos del servicio al puerto actual.
    - Si la autenticación con token requiere un token y el SecretRef del token configurado no se puede resolver, doctor bloquea la ruta de instalación/reparación con orientación accionable.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, doctor bloquea la instalación/reparación hasta que el modo se defina explícitamente.
    - Para unidades user-systemd de Linux, las comprobaciones de desviación de token de doctor ahora incluyen tanto fuentes `Environment=` como `EnvironmentFile=` al comparar metadatos de autenticación del servicio.
    - Las reparaciones de servicio de doctor se niegan a reescribir, detener o reiniciar un servicio de gateway desde un binario OpenClaw antiguo cuando la configuración fue escrita por última vez por una versión más reciente. Consulta [solución de problemas del Gateway](/es/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Siempre puedes forzar una reescritura completa mediante `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos de runtime y puerto del Gateway">
    Doctor inspecciona el runtime del servicio (PID, último estado de salida) y advierte cuando el servicio está instalado pero en realidad no se está ejecutando. También comprueba colisiones de puerto en el puerto del gateway (predeterminado `18789`) e informa causas probables (gateway ya en ejecución, túnel SSH).
  </Accordion>
  <Accordion title="17. Buenas prácticas de runtime del Gateway">
    Doctor advierte cuando el servicio del gateway se ejecuta en Bun o en una ruta de Node gestionada por versiones (`nvm`, `fnm`, `volta`, `asdf`, etc.). Los canales WhatsApp + Telegram requieren Node, y las rutas de gestores de versiones pueden romperse después de actualizaciones porque el servicio no carga la inicialización de tu shell. Doctor ofrece migrar a una instalación de Node del sistema cuando está disponible (Homebrew/apt/choco).

    Los LaunchAgents de macOS recién instalados o reparados usan una PATH canónica del sistema (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) en lugar de copiar la PATH del shell interactivo, por lo que Volta, asdf, fnm, pnpm y otros directorios de gestores de versiones no cambian qué procesos secundarios de Node se resuelven. Los servicios de Linux todavía conservan raíces de entorno explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) y directorios user-bin estables, pero los directorios alternativos inferidos de gestores de versiones solo se escriben en la PATH del servicio cuando esos directorios existen en disco.

  </Accordion>
  <Accordion title="18. Escritura de configuración + metadatos del asistente">
    Doctor persiste cualquier cambio de configuración y marca metadatos del asistente para registrar la ejecución de doctor.
  </Accordion>
  <Accordion title="19. Consejos de workspace (copia de seguridad + sistema de memoria)">
    Doctor sugiere un sistema de memoria de workspace cuando falta e imprime un consejo de copia de seguridad si el workspace aún no está bajo git.

    Consulta [/concepts/agent-workspace](/es/concepts/agent-workspace) para ver una guía completa sobre la estructura del workspace y la copia de seguridad con git (se recomienda GitHub privado o GitLab).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Runbook del Gateway](/es/gateway)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
