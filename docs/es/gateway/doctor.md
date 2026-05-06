---
read_when:
    - Agregar o modificar migraciones de doctor
    - Introducción de cambios incompatibles en la configuración
sidebarTitle: Doctor
summary: 'Comando doctor: comprobaciones de estado, migraciones de configuración y pasos de reparación'
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-06T17:56:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e8a1e280717b7a523ba092dec2e2f7d1c13e67a5ede30d0b4bb5a3100dc0e44
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` es la herramienta de reparación + migración para OpenClaw. Corrige configuración/estado obsoletos, comprueba la salud y proporciona pasos de reparación accionables.

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

    Acepta los valores predeterminados sin pedir confirmación (incluidos los pasos de reparación de reinicio/servicio/sandbox cuando corresponda).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Aplica las reparaciones recomendadas sin pedir confirmación (reparaciones + reinicios cuando sea seguro).

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

    Ejecuta sin indicaciones y solo aplica migraciones seguras (normalización de configuración + movimientos de estado en disco). Omite acciones de reinicio/servicio/sandbox que requieren confirmación humana. Las migraciones de estado heredado se ejecutan automáticamente cuando se detectan.

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
  <Accordion title="Salud, UI y actualizaciones">
    - Actualización previa opcional para instalaciones de git (solo interactiva).
    - Comprobación de frescura del protocolo de la UI (recompila la UI de Control cuando el esquema del protocolo es más reciente).
    - Comprobación de salud + solicitud de reinicio.
    - Resumen de estado de Skills (elegibles/faltantes/bloqueadas) y estado de plugins.

  </Accordion>
  <Accordion title="Configuración y migraciones">
    - Normalización de configuración para valores heredados.
    - Migración de configuración de Talk desde campos planos heredados `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Comprobaciones de migración del navegador para configuraciones heredadas de la extensión de Chrome y preparación de Chrome MCP.
    - Advertencias de sobrescritura del proveedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Advertencias de sombreado de OAuth de Codex (`models.providers.openai-codex`).
    - Comprobación de prerrequisitos TLS de OAuth para perfiles OAuth de OpenAI Codex.
    - Advertencias de lista de permitidos de plugin/herramienta cuando `plugins.allow` es restrictivo pero la política de herramientas todavía solicita comodín o herramientas propiedad del plugin.
    - Migración de estado heredado en disco (sessions/dir de agente/autenticación de WhatsApp).
    - Migración de claves heredadas del contrato de manifiesto de plugins (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migración del almacén de Cron heredado (`jobId`, `schedule.cron`, campos de entrega/carga útil de nivel superior, `provider` de carga útil, trabajos fallback de Webhook simples `notify: true`).
    - Migración de política de runtime de agente heredada a `agents.defaults.agentRuntime` y `agents.list[].agentRuntime`.
    - Limpieza de configuración obsoleta de plugins cuando los plugins están habilitados; cuando `plugins.enabled=false`, las referencias obsoletas a plugins se tratan como configuración de contención inerte y se conservan.

  </Accordion>
  <Accordion title="Estado e integridad">
    - Inspección de archivos de bloqueo de sesión y limpieza de bloqueos obsoletos.
    - Reparación de transcripciones de sesión para ramas duplicadas de reescritura de prompts creadas por compilaciones afectadas de 2026.4.24.
    - Detección de tombstones de recuperación por reinicio de subagentes atascados, con soporte de `--fix` para borrar indicadores obsoletos de recuperación abortada de modo que el arranque no siga tratando al hijo como abortado por reinicio.
    - Comprobaciones de integridad de estado y permisos (sessions, transcripciones, dir de estado).
    - Comprobaciones de permisos del archivo de configuración (chmod 600) al ejecutarse localmente.
    - Salud de autenticación de modelos: comprueba caducidad de OAuth, puede renovar tokens próximos a caducar e informa estados de cooldown/deshabilitado de perfiles de autenticación.
    - Detección de directorio de workspace adicional (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servicios y supervisores">
    - Reparación de imagen de sandbox cuando el sandboxing está habilitado.
    - Migración de servicio heredado y detección de Gateway adicional.
    - Migración de estado heredado del canal Matrix (en modo `--fix` / `--repair`).
    - Comprobaciones de runtime de Gateway (servicio instalado pero sin ejecutarse; etiqueta launchd en caché).
    - Advertencias de estado de canales (sondeadas desde el Gateway en ejecución).
    - Comprobaciones de capacidad de respuesta de WhatsApp para salud degradada del bucle de eventos de Gateway con clientes TUI locales todavía en ejecución; `--fix` detiene solo clientes TUI locales verificados.
    - Reparación de rutas de Codex para refs de modelo heredadas `openai-codex/*` en modelos primarios, fallbacks, sobrescrituras de heartbeat/subagente/compaction, hooks, sobrescrituras de modelo de canal y pines de ruta de sesión; `--fix` las reescribe a `openai/*` y selecciona `agentRuntime.id: "codex"` solo cuando el plugin Codex está instalado, habilitado, aporta el harness `codex` y tiene OAuth usable. De lo contrario selecciona `agentRuntime.id: "pi"`.
    - Auditoría de configuración de supervisor (launchd/systemd/schtasks) con reparación opcional.
    - Limpieza del entorno de proxy embebido para servicios de Gateway que capturaron valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante la instalación o actualización.
    - Comprobaciones de buenas prácticas de runtime de Gateway (Node frente a Bun, rutas de gestores de versiones).
    - Diagnósticos de colisión de puerto de Gateway (predeterminado `18789`).

  </Accordion>
  <Accordion title="Autenticación, seguridad y emparejamiento">
    - Advertencias de seguridad para políticas de DM abiertas.
    - Comprobaciones de autenticación de Gateway para modo de token local (ofrece generación de token cuando no existe ninguna fuente de token; no sobrescribe configuraciones SecretRef de token).
    - Detección de problemas de emparejamiento de dispositivos (solicitudes pendientes de primer emparejamiento, actualizaciones pendientes de rol/alcance, deriva obsoleta de caché local de token de dispositivo y deriva de autenticación de registros emparejados).

  </Accordion>
  <Accordion title="Workspace y shell">
    - Comprobación de linger de systemd en Linux.
    - Comprobación de tamaño del archivo de arranque del workspace (advertencias de truncamiento/cercanía al límite para archivos de contexto).
    - Comprobación de preparación de Skills para el agente predeterminado; informa Skills permitidas con bins, env, configuración o requisitos de SO faltantes, y `--fix` puede deshabilitar Skills no disponibles en `skills.entries`.
    - Comprobación de estado de completado de shell e instalación/actualización automática.
    - Comprobación de preparación del proveedor de embeddings de búsqueda de memoria (modelo local, clave de API remota o binario QMD).
    - Comprobaciones de instalación desde código fuente (discrepancia de workspace pnpm, assets de UI faltantes, binario tsx faltante).
    - Escribe configuración actualizada + metadatos del asistente.

  </Accordion>
</AccordionGroup>

## Backfill y reset de la UI de Dreams

La escena Dreams de la UI de Control incluye acciones **Backfill**, **Reset** y **Clear Grounded** para el flujo de trabajo de dreaming grounded. Estas acciones usan métodos RPC de estilo doctor de Gateway, pero **no** forman parte de la reparación/migración de la CLI `openclaw doctor`.

Qué hacen:

- **Backfill** escanea archivos históricos `memory/YYYY-MM-DD.md` en el workspace activo, ejecuta la pasada de diario REM grounded y escribe entradas de backfill reversibles en `DREAMS.md`.
- **Reset** elimina solo esas entradas de diario de backfill marcadas de `DREAMS.md`.
- **Clear Grounded** elimina solo entradas staged de corto plazo solo-grounded que provienen de reproducción histórica y todavía no han acumulado recall en vivo ni soporte diario.

Qué **no** hacen por sí mismas:

- no editan `MEMORY.md`
- no ejecutan migraciones completas de doctor
- no colocan automáticamente candidatos grounded en el almacén de promoción de corto plazo en vivo a menos que ejecutes explícitamente primero la ruta CLI staged

Si quieres que la reproducción histórica grounded influya en el carril normal de promoción profunda, usa en su lugar el flujo de la CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Eso coloca candidatos duraderos grounded en el almacén de dreaming de corto plazo mientras mantiene `DREAMS.md` como superficie de revisión.

## Comportamiento detallado y justificación

<AccordionGroup>
  <Accordion title="0. Actualización opcional (instalaciones de git)">
    Si esto es un checkout de git y doctor se ejecuta de forma interactiva, ofrece actualizar (fetch/rebase/build) antes de ejecutar doctor.
  </Accordion>
  <Accordion title="1. Normalización de configuración">
    Si la configuración contiene formas de valores heredadas (por ejemplo `messages.ackReaction` sin una sobrescritura específica de canal), doctor las normaliza al esquema actual.

    Eso incluye campos planos heredados de Talk. La configuración pública actual de voz de Talk es `talk.provider` + `talk.providers.<provider>`, y la configuración de voz en tiempo real es `talk.realtime.*`. Doctor reescribe formas antiguas `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` en el mapa de proveedores, y reescribe selectores heredados de nivel superior en tiempo real (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) en `talk.realtime`.

    Doctor también advierte cuando `plugins.allow` no está vacío y la política de herramientas usa
    entradas de herramientas con comodín o propiedad del plugin. `tools.allow: ["*"]` solo coincide con herramientas
    de plugins que realmente cargan; no omite la lista exclusiva de permitidos de plugins.
    Doctor escribe `plugins.bundledDiscovery: "compat"` para configuraciones heredadas migradas de listas de permitidos
    con el fin de conservar el comportamiento existente de proveedores incluidos, y
    luego apunta al ajuste más estricto `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migraciones de claves de configuración heredadas">
    Cuando la configuración contiene claves obsoletas, otros comandos se niegan a ejecutarse y te piden que ejecutes `openclaw doctor`.

    Doctor:

    - Explicará qué claves heredadas se encontraron.
    - Mostrará la migración que aplicó.
    - Reescribirá `~/.openclaw/openclaw.json` con el esquema actualizado.

    El inicio de Gateway rechaza formatos de configuración heredados y te pide ejecutar `openclaw doctor --fix`; no reescribe `openclaw.json` durante el inicio. Las migraciones del almacén de trabajos Cron también se gestionan con `openclaw doctor --fix`.

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
    - Para canales con `accounts` con nombre pero valores de canal de nivel superior de cuenta única persistentes, mueve esos valores con alcance de cuenta a la cuenta ascendida elegida para ese canal (`accounts.default` para la mayoría de los canales; Matrix puede conservar un destino con nombre/predeterminado coincidente existente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - elimina `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` para tiempos de espera de proveedores/modelos lentos
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - elimina `browser.relayBindHost` (configuración heredada de retransmisión de extensión)
    - `models.providers.*.api: "openai"` heredado → `"openai-completions"` (el arranque del gateway también omite proveedores cuyo `api` esté establecido en un valor enum futuro o desconocido en lugar de fallar de forma cerrada)

    Las advertencias de Doctor también incluyen orientación de cuenta predeterminada para canales con varias cuentas:

    - Si dos o más entradas `channels.<channel>.accounts` están configuradas sin `channels.<channel>.defaultAccount` o `accounts.default`, Doctor advierte que el enrutamiento de reserva puede elegir una cuenta inesperada.
    - Si `channels.<channel>.defaultAccount` está establecido en un ID de cuenta desconocido, Doctor advierte y enumera los ID de cuenta configurados.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    Si has agregado `models.providers.opencode`, `opencode-zen` u `opencode-go` manualmente, esto sobrescribe el catálogo integrado de OpenCode de `@mariozechner/pi-ai`. Eso puede forzar modelos a la API incorrecta o poner los costos en cero. Doctor advierte para que puedas eliminar la sobrescritura y restaurar el enrutamiento de API por modelo + costos.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    Si tu configuración del navegador todavía apunta a la ruta eliminada de la extensión de Chrome, Doctor la normaliza al modelo actual de conexión Chrome MCP local del host:

    - `browser.profiles.*.driver: "extension"` se convierte en `"existing-session"`
    - se elimina `browser.relayBindHost`

    Doctor también audita la ruta Chrome MCP local del host cuando usas `defaultProfile: "user"` o un perfil `existing-session` configurado:

    - comprueba si Google Chrome está instalado en el mismo host para los perfiles predeterminados de conexión automática
    - comprueba la versión detectada de Chrome y advierte cuando es inferior a Chrome 144
    - te recuerda habilitar la depuración remota en la página de inspección del navegador (por ejemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor no puede habilitar por ti la configuración del lado de Chrome. Chrome MCP local del host todavía requiere:

    - un navegador basado en Chromium 144+ en el host de gateway/nodo
    - el navegador ejecutándose localmente
    - depuración remota habilitada en ese navegador
    - aprobar el primer aviso de consentimiento de conexión en el navegador

    La preparación aquí solo se refiere a los prerrequisitos de conexión local. Existing-session mantiene los límites actuales de rutas de Chrome MCP; las rutas avanzadas como `responsebody`, exportación a PDF, interceptación de descargas y acciones por lotes todavía requieren un navegador administrado o un perfil CDP sin procesar.

    Esta comprobación **no** se aplica a Docker, sandbox, remote-browser ni otros flujos sin interfaz. Esos continúan usando CDP sin procesar.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    Cuando se configura un perfil OAuth de OpenAI Codex, Doctor sondea el endpoint de autorización de OpenAI para verificar que la pila TLS local de Node/OpenSSL pueda validar la cadena de certificados. Si el sondeo falla con un error de certificado (por ejemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado caducado o certificado autofirmado), Doctor imprime orientación de corrección específica de la plataforma. En macOS con un Node de Homebrew, la corrección suele ser `brew postinstall ca-certificates`. Con `--deep`, el sondeo se ejecuta incluso si el gateway está sano.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    Si antes agregaste configuraciones heredadas de transporte de OpenAI en `models.providers.openai-codex`, pueden eclipsar la ruta integrada del proveedor OAuth de Codex que las versiones más recientes usan automáticamente. Doctor advierte cuando ve esas configuraciones antiguas de transporte junto con Codex OAuth para que puedas eliminar o reescribir la sobrescritura de transporte obsoleta y recuperar el comportamiento integrado de enrutamiento/reserva. Los proxies personalizados y las sobrescrituras solo de encabezados siguen siendo compatibles y no activan esta advertencia.
  </Accordion>
  <Accordion title="2f. Codex route repair">
    Doctor comprueba referencias heredadas de modelo `openai-codex/*`. El enrutamiento nativo del arnés de Codex usa referencias canónicas de modelo `openai/*` más `agentRuntime.id: "codex"` para que el turno pase por el arnés del servidor de la aplicación Codex en lugar de la ruta OpenAI de OpenClaw PI.

    En modo `--fix` / `--repair`, Doctor reescribe las referencias afectadas del agente predeterminado y por agente, incluidos modelos primarios, reservas, sobrescrituras de heartbeat/subagente/compaction, hooks, sobrescrituras de modelo de canal y estado de ruta de sesión persistente obsoleto:

    - `openai-codex/gpt-*` se convierte en `openai/gpt-*`.
    - El runtime de agente coincidente se convierte en `agentRuntime.id: "codex"` solo cuando Codex está instalado, habilitado, aporta el arnés `codex` y tiene OAuth utilizable.
    - De lo contrario, el runtime de agente coincidente se convierte en `agentRuntime.id: "pi"`.
    - Las listas existentes de reserva de modelos se conservan con sus entradas heredadas reescritas; las configuraciones por modelo copiadas se mueven de la clave heredada a la clave canónica `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, avisos de reserva, fijaciones de perfil de autenticación y fijaciones de arnés de Codex persistidos en la sesión se reparan en todos los almacenes de sesión de agente descubiertos.
    - `/codex ...` significa "controlar o vincular una conversación nativa de Codex desde el chat".
    - `/acp ...` o `runtime: "acp"` significa "usar el adaptador externo ACP/acpx".

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    Doctor también escanea los almacenes de sesión de agente descubiertos en busca de estado de ruta obsoleto creado automáticamente después de mover modelos configurados o runtime fuera de una ruta propiedad de un plugin, como Codex.

    `openclaw doctor --fix` puede borrar estado obsoleto creado automáticamente, como fijaciones de modelo `modelOverrideSource: "auto"`, metadatos de modelo de runtime, ID de arnés fijados, vinculaciones de sesión CLI y sobrescrituras automáticas de perfil de autenticación cuando su ruta propietaria ya no está configurada. Las elecciones explícitas de usuario o heredadas de modelo de sesión se informan para revisión manual y se dejan intactas; cámbialas con `/model ...`, `/new` o restablece la sesión cuando esa ruta ya no sea la prevista.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor puede migrar diseños antiguos en disco a la estructura actual:

    - Almacén de sesiones + transcripciones:
      - de `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directorio de agente:
      - de `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticación de WhatsApp (Baileys):
      - de `~/.openclaw/credentials/*.json` heredado (excepto `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de cuenta predeterminado: `default`)

    Estas migraciones son de mejor esfuerzo e idempotentes; Doctor emitirá advertencias cuando deje carpetas heredadas como copias de seguridad. El Gateway/CLI también migra automáticamente las sesiones heredadas + el directorio de agente al arrancar para que el historial/autenticación/modelos terminen en la ruta por agente sin una ejecución manual de Doctor. La autenticación de WhatsApp se migra intencionalmente solo mediante `openclaw doctor`. La normalización de proveedor/mapa de proveedores de Talk ahora compara por igualdad estructural, por lo que las diferencias solo de orden de claves ya no activan cambios repetidos sin efecto de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor escanea todos los manifiestos de plugin instalados en busca de claves de capacidad de nivel superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Cuando las encuentra, ofrece moverlas al objeto `contracts` y reescribir el archivo de manifiesto en el lugar. Esta migración es idempotente; si la clave `contracts` ya tiene los mismos valores, la clave heredada se elimina sin duplicar los datos.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor también comprueba el almacén de trabajos cron (`~/.openclaw/cron/jobs.json` de forma predeterminada, o `cron.store` cuando se sobrescribe) en busca de formas antiguas de trabajos que el programador todavía acepta por compatibilidad.

    Las limpiezas actuales de cron incluyen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de payload de nivel superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nivel superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de entrega `provider` de payload → `delivery.channel` explícito
    - trabajos webhook simples heredados de reserva `notify: true` → `delivery.mode="webhook"` explícito con `delivery.to=cron.webhook`

    Doctor solo migra automáticamente los trabajos `notify: true` cuando puede hacerlo sin cambiar el comportamiento. Si un trabajo combina la reserva de notify heredada con un modo de entrega no Webhook existente, doctor advierte y deja ese trabajo para revisión manual.

    En Linux, doctor también advierte cuando el crontab del usuario todavía invoca el `~/.openclaw/bin/ensure-whatsapp.sh` heredado. Ese script local del host no es mantenido por el OpenClaw actual y puede escribir mensajes falsos de `Gateway inactive` en `~/.openclaw/logs/whatsapp-health.log` cuando cron no puede alcanzar el bus de usuario de systemd. Elimina la entrada obsoleta del crontab con `crontab -e`; usa `openclaw channels status --probe`, `openclaw doctor` y `openclaw gateway status` para las comprobaciones de estado actuales.

  </Accordion>
  <Accordion title="3c. Limpieza de bloqueos de sesión">
    Doctor analiza cada directorio de sesión de agente en busca de archivos de bloqueo de escritura obsoletos: archivos que quedaron atrás cuando una sesión salió de forma anómala. Por cada archivo de bloqueo encontrado informa: la ruta, el PID, si el PID sigue activo, la antigüedad del bloqueo y si se considera obsoleto (PID muerto o más de 30 minutos). En modo `--fix` / `--repair`, elimina automáticamente los archivos de bloqueo obsoletos; de lo contrario, imprime una nota y te indica que vuelvas a ejecutarlo con `--fix`.
  </Accordion>
  <Accordion title="3d. Reparación de ramas de transcripción de sesión">
    Doctor analiza los archivos JSONL de sesiones de agentes en busca de la forma de rama duplicada creada por el error de reescritura de transcripciones de prompts del 2026.4.24: un turno de usuario abandonado con contexto de runtime interno de OpenClaw más un hermano activo que contiene el mismo prompt de usuario visible. En modo `--fix` / `--repair`, doctor respalda cada archivo afectado junto al original y reescribe la transcripción a la rama activa para que el historial del Gateway y los lectores de memoria ya no vean turnos duplicados.
  </Accordion>
  <Accordion title="4. Comprobaciones de integridad del estado (persistencia de sesión, enrutamiento y seguridad)">
    El directorio de estado es el tronco encefálico operativo. Si desaparece, pierdes sesiones, credenciales, registros y configuración (a menos que tengas copias de seguridad en otro lugar).

    Doctor comprueba:

    - **Falta el directorio de estado**: advierte sobre una pérdida de estado catastrófica, solicita recrear el directorio y te recuerda que no puede recuperar los datos faltantes.
    - **Permisos del directorio de estado**: verifica la capacidad de escritura; ofrece reparar permisos (y emite una sugerencia de `chown` cuando se detecta una discordancia de propietario/grupo).
    - **Directorio de estado sincronizado con la nube en macOS**: advierte cuando el estado se resuelve bajo iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...` porque las rutas respaldadas por sincronización pueden causar E/S más lenta y carreras de bloqueo/sincronización.
    - **Directorio de estado en SD o eMMC en Linux**: advierte cuando el estado se resuelve a un origen de montaje `mmcblk*`, porque la E/S aleatoria respaldada por SD o eMMC puede ser más lenta y desgastarse más rápido con escrituras de sesiones y credenciales.
    - **Faltan directorios de sesión**: `sessions/` y el directorio del almacén de sesiones son necesarios para persistir el historial y evitar bloqueos `ENOENT`.
    - **Discordancia de transcripción**: advierte cuando las entradas de sesión recientes tienen archivos de transcripción faltantes.
    - **Sesión principal "JSONL de 1 línea"**: marca cuando la transcripción principal tiene solo una línea (el historial no se está acumulando).
    - **Múltiples directorios de estado**: advierte cuando existen varias carpetas `~/.openclaw` entre directorios home o cuando `OPENCLAW_STATE_DIR` apunta a otro lugar (el historial puede dividirse entre instalaciones).
    - **Recordatorio de modo remoto**: si `gateway.mode=remote`, doctor te recuerda que lo ejecutes en el host remoto (el estado vive allí).
    - **Permisos del archivo de configuración**: advierte si `~/.openclaw/openclaw.json` es legible por grupo/todos y ofrece ajustarlo a `600`.

  </Accordion>
  <Accordion title="5. Estado de autenticación del modelo (caducidad de OAuth)">
    Doctor inspecciona los perfiles OAuth en el almacén de autenticación, advierte cuando los tokens están por caducar o caducados, y puede actualizarlos cuando es seguro. Si el perfil OAuth/token de Anthropic está obsoleto, sugiere una clave API de Anthropic o la ruta de token de configuración de Anthropic. Las solicitudes de actualización solo aparecen cuando se ejecuta de forma interactiva (TTY); `--non-interactive` omite los intentos de actualización.

    Cuando una actualización de OAuth falla de forma permanente (por ejemplo `refresh_token_reused`, `invalid_grant`, o un proveedor que te indica volver a iniciar sesión), doctor informa que se requiere reautenticación e imprime el comando exacto `openclaw models auth login --provider ...` que debes ejecutar.

    Doctor también informa perfiles de autenticación que no se pueden usar temporalmente debido a:

    - pausas breves (límites de tasa/tiempos de espera/fallos de autenticación)
    - desactivaciones más largas (fallos de facturación/crédito)

  </Accordion>
  <Accordion title="6. Validación del modelo de hooks">
    Si `hooks.gmail.model` está configurado, doctor valida la referencia del modelo contra el catálogo y la lista de permitidos, y advierte cuando no se resuelve o no está permitido.
  </Accordion>
  <Accordion title="7. Reparación de imágenes de sandbox">
    Cuando el sandboxing está habilitado, doctor comprueba las imágenes de Docker y ofrece compilarlas o cambiar a nombres heredados si falta la imagen actual.
  </Accordion>
  <Accordion title="7b. Limpieza de instalación de Plugin">
    Doctor elimina el estado heredado de preparación de dependencias de Plugin generado por OpenClaw en modo `openclaw doctor --fix` / `openclaw doctor --repair`. Esto cubre raíces de dependencias generadas obsoletas, directorios antiguos de etapa de instalación, restos locales del paquete de código anterior de reparación de dependencias de Plugins incluidos, y copias npm administradas huérfanas o recuperadas de Plugins `@openclaw/*` incluidos que pueden eclipsar el manifiesto incluido actual.

    Doctor también puede reinstalar Plugins descargables faltantes cuando la configuración los referencia pero el registro local de Plugins no puede encontrarlos. Los ejemplos incluyen `plugins.entries` materiales, ajustes configurados de canal/proveedor/búsqueda y runtimes de agentes configurados. Durante las actualizaciones de paquetes, doctor evita ejecutar reparación de Plugins con el gestor de paquetes mientras se reemplaza el paquete central; ejecuta `openclaw doctor --fix` de nuevo después de la actualización si un Plugin configurado todavía necesita recuperación. El inicio del Gateway y la recarga de configuración no ejecutan gestores de paquetes; las instalaciones de Plugins siguen siendo trabajo explícito de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migraciones de servicio de Gateway y sugerencias de limpieza">
    Doctor detecta servicios Gateway heredados (launchd/systemd/schtasks) y ofrece eliminarlos e instalar el servicio OpenClaw usando el puerto Gateway actual. También puede buscar servicios adicionales similares a Gateway e imprimir sugerencias de limpieza. Los servicios Gateway de OpenClaw con nombre de perfil se consideran de primera clase y no se marcan como "adicionales".

    En Linux, si falta el servicio Gateway de nivel de usuario pero existe un servicio Gateway de OpenClaw de nivel de sistema, doctor no instala automáticamente un segundo servicio de nivel de usuario. Inspecciona con `openclaw gateway status --deep` o `openclaw doctor --deep`, luego elimina el duplicado o establece `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando un supervisor de sistema posee el ciclo de vida del Gateway.

  </Accordion>
  <Accordion title="8b. Migración de inicio de Matrix">
    Cuando una cuenta de canal Matrix tiene una migración de estado heredado pendiente o accionable, doctor (en modo `--fix` / `--repair`) crea una instantánea previa a la migración y luego ejecuta los pasos de migración de mejor esfuerzo: migración de estado heredado de Matrix y preparación de estado cifrado heredado. Ambos pasos no son fatales; los errores se registran y el inicio continúa. En modo de solo lectura (`openclaw doctor` sin `--fix`), esta comprobación se omite por completo.
  </Accordion>
  <Accordion title="8c. Emparejamiento de dispositivos y deriva de autenticación">
    Doctor ahora inspecciona el estado de emparejamiento de dispositivos como parte de la comprobación de estado normal.

    Lo que informa:

    - solicitudes pendientes de primer emparejamiento
    - actualizaciones de rol pendientes para dispositivos ya emparejados
    - actualizaciones de alcance pendientes para dispositivos ya emparejados
    - reparaciones de discordancia de clave pública donde el id del dispositivo todavía coincide pero la identidad del dispositivo ya no coincide con el registro aprobado
    - registros emparejados sin un token activo para un rol aprobado
    - tokens emparejados cuyos alcances se desvían de la línea base de emparejamiento aprobada
    - entradas locales en caché de tokens de dispositivo para la máquina actual que son anteriores a una rotación de token del lado del Gateway o llevan metadatos de alcance obsoletos

    Doctor no aprueba automáticamente solicitudes de emparejamiento ni rota automáticamente tokens de dispositivo. En su lugar imprime los siguientes pasos exactos:

    - inspecciona solicitudes pendientes con `openclaw devices list`
    - aprueba la solicitud exacta con `openclaw devices approve <requestId>`
    - rota un token nuevo con `openclaw devices rotate --device <deviceId> --role <role>`
    - elimina y vuelve a aprobar un registro obsoleto con `openclaw devices remove <deviceId>`

    Esto cierra el agujero común de "ya emparejado pero todavía se requiere emparejamiento": doctor ahora distingue el primer emparejamiento de las actualizaciones pendientes de rol/alcance y de la deriva de token/identidad de dispositivo obsoletos.

  </Accordion>
  <Accordion title="9. Advertencias de seguridad">
    Doctor emite advertencias cuando un proveedor está abierto a MD sin una lista de permitidos, o cuando una política está configurada de forma peligrosa.
  </Accordion>
  <Accordion title="10. Linger de systemd (Linux)">
    Si se ejecuta como servicio de usuario de systemd, doctor garantiza que lingering esté habilitado para que el Gateway permanezca activo después de cerrar sesión.
  </Accordion>
  <Accordion title="11. Estado del espacio de trabajo (Skills, Plugins y directorios heredados)">
    Doctor imprime un resumen del estado del espacio de trabajo para el agente predeterminado:

    - **Estado de Skills**: cuenta skills elegibles, con requisitos faltantes y bloqueadas por lista de permitidos.
    - **Directorios de espacio de trabajo heredados**: advierte cuando `~/openclaw` u otros directorios de espacio de trabajo heredados existen junto al espacio de trabajo actual.
    - **Estado de Plugin**: cuenta Plugins habilitados/deshabilitados/con errores; lista IDs de Plugin para cualquier error; informa capacidades de Plugin incluido.
    - **Advertencias de compatibilidad de Plugin**: marca Plugins que tienen problemas de compatibilidad con el runtime actual.
    - **Diagnósticos de Plugin**: expone cualquier advertencia o error en tiempo de carga emitido por el registro de Plugins.

  </Accordion>
  <Accordion title="11b. Tamaño de archivo de arranque">
    Doctor comprueba si los archivos de arranque del espacio de trabajo (por ejemplo `AGENTS.md`, `CLAUDE.md` u otros archivos de contexto inyectados) están cerca o por encima del presupuesto de caracteres configurado. Informa recuentos de caracteres sin procesar frente a inyectados por archivo, porcentaje de truncamiento, causa de truncamiento (`max/file` o `max/total`) y caracteres inyectados totales como fracción del presupuesto total. Cuando los archivos se truncan o están cerca del límite, doctor imprime consejos para ajustar `agents.defaults.bootstrapMaxChars` y `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpieza de Plugin de canal obsoleto">
    Cuando `openclaw doctor --fix` elimina un Plugin de canal faltante, también elimina la configuración colgante con alcance de canal que referenciaba ese Plugin: entradas `channels.<id>`, destinos de Heartbeat que nombraban el canal y sobrescrituras `agents.*.models["<channel>/*"]`. Esto evita bucles de arranque del Gateway donde el runtime del canal desapareció pero la configuración aún le pide al gateway enlazarse a él.
  </Accordion>
  <Accordion title="11c. Autocompletado de shell">
    Doctor comprueba si el autocompletado con tabulador está instalado para la shell actual (zsh, bash, fish o PowerShell):

    - Si el perfil de shell usa un patrón de autocompletado dinámico lento (`source <(openclaw completion ...)`), doctor lo actualiza a la variante de archivo en caché más rápida.
    - Si el autocompletado está configurado en el perfil pero falta el archivo de caché, doctor regenera la caché automáticamente.
    - Si no hay autocompletado configurado en absoluto, doctor solicita instalarlo (solo en modo interactivo; se omite con `--non-interactive`).

    Ejecuta `openclaw completion --write-state` para regenerar la caché manualmente.

  </Accordion>
  <Accordion title="12. Comprobaciones de autenticación del Gateway (token local)">
    Doctor comprueba la preparación de autenticación con token local del gateway.

    - Si el modo de token necesita un token y no existe ninguna fuente de token, doctor ofrece generar uno.
    - Si `gateway.auth.token` está administrado por SecretRef pero no está disponible, doctor advierte y no lo sobrescribe con texto plano.
    - `openclaw doctor --generate-gateway-token` fuerza la generación solo cuando no hay ningún SecretRef de token configurado.

  </Accordion>
  <Accordion title="12b. Reparaciones de solo lectura compatibles con SecretRef">
    Algunos flujos de reparación necesitan inspeccionar credenciales configuradas sin debilitar el comportamiento de fallo rápido del runtime.

    - `openclaw doctor --fix` ahora usa el mismo modelo de resumen de SecretRef de solo lectura que los comandos de la familia de estado para reparaciones de configuración específicas.
    - Ejemplo: la reparación de `allowFrom` / `groupAllowFrom` `@username` de Telegram intenta usar las credenciales de bot configuradas cuando están disponibles.
    - Si el token del bot de Telegram está configurado mediante SecretRef pero no está disponible en la ruta del comando actual, doctor informa que la credencial está configurada pero no disponible y omite la resolución automática en lugar de bloquearse o informar incorrectamente que falta el token.

  </Accordion>
  <Accordion title="13. Comprobación de estado del Gateway + reinicio">
    Doctor ejecuta una comprobación de estado y ofrece reiniciar el gateway cuando parece no estar en buen estado.
  </Accordion>
  <Accordion title="13b. Preparación de la búsqueda de memoria">
    Doctor comprueba si el proveedor de embeddings de búsqueda de memoria configurado está listo para el agente predeterminado. El comportamiento depende del backend y el proveedor configurados:

    - **Backend QMD**: sondea si el binario `qmd` está disponible y puede iniciarse. Si no, imprime orientación de corrección, incluido el paquete npm y una opción de ruta manual al binario.
    - **Proveedor local explícito**: comprueba si existe un archivo de modelo local o una URL de modelo remota/descargable reconocida. Si falta, sugiere cambiar a un proveedor remoto.
    - **Proveedor remoto explícito** (`openai`, `voyage`, etc.): verifica que haya una clave de API presente en el entorno o en el almacén de autenticación. Imprime sugerencias de corrección accionables si falta.
    - **Proveedor automático**: comprueba primero la disponibilidad del modelo local y luego prueba cada proveedor remoto en el orden de selección automática.

    Cuando hay disponible un resultado de sondeo del gateway en caché (el gateway estaba en buen estado en el momento de la comprobación), doctor cruza su resultado con la configuración visible para la CLI y señala cualquier discrepancia. Doctor no inicia un nuevo ping de embeddings en la ruta predeterminada; usa el comando de estado de memoria profundo cuando quieras una comprobación en vivo del proveedor.

    Usa `openclaw memory status --deep` para verificar la preparación de embeddings en runtime.

  </Accordion>
  <Accordion title="14. Advertencias de estado del canal">
    Si el gateway está en buen estado, doctor ejecuta un sondeo de estado del canal e informa advertencias con correcciones sugeridas.
  </Accordion>
  <Accordion title="15. Auditoría y reparación de la configuración del supervisor">
    Doctor comprueba la configuración del supervisor instalada (launchd/systemd/schtasks) para detectar valores predeterminados faltantes u obsoletos (por ejemplo, dependencias de systemd network-online y retraso de reinicio). Cuando encuentra una discrepancia, recomienda una actualización y puede reescribir el archivo de servicio/tarea con los valores predeterminados actuales.

    Notas:

    - `openclaw doctor` solicita confirmación antes de reescribir la configuración del supervisor.
    - `openclaw doctor --yes` acepta las solicitudes de reparación predeterminadas.
    - `openclaw doctor --repair` aplica las correcciones recomendadas sin solicitudes.
    - `openclaw doctor --repair --force` sobrescribe configuraciones de supervisor personalizadas.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor en modo de solo lectura para el ciclo de vida del servicio gateway. Sigue informando el estado del servicio y ejecutando reparaciones que no son de servicio, pero omite la instalación/inicio/reinicio/bootstrap del servicio, las reescrituras de configuración del supervisor y la limpieza de servicios heredados porque un supervisor externo posee ese ciclo de vida.
    - En Linux, doctor no reescribe metadatos de comando/punto de entrada mientras la unidad systemd del gateway correspondiente está activa. También ignora unidades adicionales inactivas no heredadas similares a gateway durante el análisis de servicios duplicados para que los archivos de servicio complementarios no generen ruido de limpieza.
    - Si la autenticación por token requiere un token y `gateway.auth.token` está administrado por SecretRef, la instalación/reparación del servicio de doctor valida el SecretRef pero no persiste valores de token en texto plano resueltos en los metadatos de entorno del servicio supervisor.
    - Doctor detecta valores de entorno de servicio administrados respaldados por `.env`/SecretRef que instalaciones antiguas de LaunchAgent, systemd o Windows Scheduled Task incrustaban en línea y reescribe los metadatos del servicio para que esos valores se carguen desde la fuente de runtime en lugar de la definición del supervisor.
    - Doctor detecta cuando el comando del servicio todavía fija un `--port` antiguo después de cambios en `gateway.port` y reescribe los metadatos del servicio al puerto actual.
    - Si la autenticación por token requiere un token y el SecretRef de token configurado no está resuelto, doctor bloquea la ruta de instalación/reparación con orientación accionable.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está establecido, doctor bloquea la instalación/reparación hasta que el modo se establezca explícitamente.
    - Para unidades systemd de usuario en Linux, las comprobaciones de divergencia de token de doctor ahora incluyen tanto fuentes `Environment=` como `EnvironmentFile=` al comparar metadatos de autenticación del servicio.
    - Las reparaciones de servicio de doctor rechazan reescribir, detener o reiniciar un servicio gateway desde un binario de OpenClaw más antiguo cuando la configuración fue escrita por última vez por una versión más reciente. Consulta [Solución de problemas de Gateway](/es/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Siempre puedes forzar una reescritura completa mediante `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos de runtime y puerto del Gateway">
    Doctor inspecciona el runtime del servicio (PID, último estado de salida) y advierte cuando el servicio está instalado pero no se está ejecutando realmente. También comprueba colisiones de puerto en el puerto del gateway (predeterminado `18789`) e informa causas probables (gateway ya en ejecución, túnel SSH).
  </Accordion>
  <Accordion title="17. Mejores prácticas de runtime del Gateway">
    Doctor advierte cuando el servicio gateway se ejecuta en Bun o en una ruta de Node administrada por versiones (`nvm`, `fnm`, `volta`, `asdf`, etc.). Los canales de WhatsApp + Telegram requieren Node, y las rutas de administradores de versiones pueden romperse después de actualizaciones porque el servicio no carga la inicialización de tu shell. Doctor ofrece migrar a una instalación de Node del sistema cuando está disponible (Homebrew/apt/choco).

    Los LaunchAgents de macOS recién instalados o reparados usan un PATH del sistema canónico (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) en lugar de copiar el PATH del shell interactivo, por lo que Volta, asdf, fnm, pnpm y otros directorios de administradores de versiones no cambian qué procesos secundarios de Node se resuelven. Los servicios de Linux aún conservan raíces de entorno explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) y directorios user-bin estables, pero los directorios de respaldo inferidos de administradores de versiones solo se escriben en el PATH del servicio cuando esos directorios existen en disco.

  </Accordion>
  <Accordion title="18. Escritura de configuración + metadatos del asistente">
    Doctor persiste cualquier cambio de configuración y sella metadatos del asistente para registrar la ejecución de doctor.
  </Accordion>
  <Accordion title="19. Consejos de workspace (copia de seguridad + sistema de memoria)">
    Doctor sugiere un sistema de memoria de workspace cuando falta e imprime un consejo de copia de seguridad si el workspace aún no está bajo git.

    Consulta [/concepts/agent-workspace](/es/concepts/agent-workspace) para una guía completa sobre la estructura del workspace y copias de seguridad con git (se recomienda GitHub o GitLab privado).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Runbook de Gateway](/es/gateway)
- [Solución de problemas de Gateway](/es/gateway/troubleshooting)
