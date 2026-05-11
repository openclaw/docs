---
read_when:
    - Añadir o modificar migraciones de doctor
    - Introducción de cambios incompatibles en la configuración
sidebarTitle: Doctor
summary: 'Comando doctor: comprobaciones de estado, migraciones de configuración y pasos de reparación'
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-11T20:35:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4994177bb3a3751211437403becc1c68c7f07fa52a72b84c9d129c7922705522
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

    Aplica también reparaciones agresivas (sobrescribe configuraciones personalizadas de supervisor).

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

    Escanea servicios del sistema en busca de instalaciones adicionales de Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Si quieres revisar los cambios antes de escribir, abre primero el archivo de configuración:

```bash
cat ~/.openclaw/openclaw.json
```

## Qué hace (resumen)

<AccordionGroup>
  <Accordion title="Estado de salud, UI y actualizaciones">
    - Actualización previa opcional para instalaciones de git (solo interactiva).
    - Comprobación de frescura del protocolo de UI (recompila Control UI cuando el esquema del protocolo es más reciente).
    - Comprobación de estado de salud + solicitud de reinicio.
    - Resumen de estado de Skills (elegibles/faltantes/bloqueadas) y estado de Plugin.

  </Accordion>
  <Accordion title="Configuración y migraciones">
    - Normalización de configuración para valores heredados.
    - Migración de configuración de Talk desde campos planos heredados `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Comprobaciones de migración del navegador para configuraciones heredadas de la extensión de Chrome y preparación de Chrome MCP.
    - Advertencias de anulaciones del proveedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Advertencias de sombreado de OAuth de Codex (`models.providers.openai-codex`).
    - Comprobación de requisitos previos de OAuth TLS para perfiles de OAuth de OpenAI Codex.
    - Advertencias de lista de permitidos de Plugin/herramienta cuando `plugins.allow` es restrictiva pero la política de herramientas aún solicita comodín o herramientas propiedad del Plugin.
    - Migración de estado heredado en disco (sesiones/directorio de agente/autenticación de WhatsApp).
    - Migración de claves heredadas del contrato de manifiesto de Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migración del almacén Cron heredado (`jobId`, `schedule.cron`, campos de entrega/carga útil de nivel superior, `provider` de carga útil, trabajos alternativos simples de Webhook con `notify: true`).
    - Limpieza de política de runtime de agente completo heredada; la política de runtime de proveedor/modelo es el selector de ruta activo.
    - Limpieza de configuración de Plugin obsoleta cuando los plugins están habilitados; cuando `plugins.enabled=false`, las referencias obsoletas de Plugin se tratan como configuración de contención inerte y se conservan.

  </Accordion>
  <Accordion title="Estado e integridad">
    - Inspección de archivos de bloqueo de sesión y limpieza de bloqueos obsoletos.
    - Reparación de transcripciones de sesión para ramas duplicadas de reescritura de prompts creadas por compilaciones afectadas de 2026.4.24.
    - Detección de tombstone de recuperación de reinicio de subagentes bloqueados, con soporte de `--fix` para borrar marcas obsoletas de recuperación abortada para que el arranque no siga tratando al hijo como abortado por reinicio.
    - Comprobaciones de integridad de estado y permisos (sesiones, transcripciones, directorio de estado).
    - Comprobaciones de permisos del archivo de configuración (chmod 600) cuando se ejecuta localmente.
    - Estado de autenticación de modelos: comprueba la expiración de OAuth, puede renovar tokens próximos a expirar e informa estados de enfriamiento/deshabilitación de perfiles de autenticación.
    - Detección de directorio de espacio de trabajo adicional (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servicios y supervisores">
    - Reparación de imagen de sandbox cuando el sandboxing está habilitado.
    - Migración de servicios heredados y detección adicional de Gateway.
    - Migración de estado heredado del canal Matrix (en modo `--fix` / `--repair`).
    - Comprobaciones de runtime de Gateway (servicio instalado pero no en ejecución; etiqueta launchd en caché).
    - Advertencias de estado de canales (sondeadas desde el Gateway en ejecución).
    - Las comprobaciones de permisos específicas de canal viven en `openclaw channels capabilities`; por ejemplo, los permisos de canal de voz de Discord se auditan con `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Comprobaciones de capacidad de respuesta de WhatsApp para estado degradado del bucle de eventos de Gateway con clientes TUI locales aún en ejecución; `--fix` detiene solo clientes TUI locales verificados.
    - Reparación de rutas de Codex para refs de modelo heredadas `openai-codex/*` en modelos primarios, alternativas, anulaciones de heartbeat/subagente/compaction, hooks, anulaciones de modelo por canal y pines de ruta de sesión; `--fix` las reescribe a `openai/*`, elimina pines obsoletos de runtime de sesión/agente completo y deja refs canónicas de agente OpenAI en el arnés Codex predeterminado.
    - Auditoría de configuración de supervisor (launchd/systemd/schtasks) con reparación opcional.
    - Limpieza del entorno de proxy embebido para servicios de Gateway que capturaron valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante la instalación o actualización.
    - Comprobaciones de prácticas recomendadas de runtime de Gateway (Node frente a Bun, rutas de administradores de versiones).
    - Diagnósticos de colisión de puerto de Gateway (predeterminado `18789`).

  </Accordion>
  <Accordion title="Autenticación, seguridad y emparejamiento">
    - Advertencias de seguridad para políticas de DM abiertas.
    - Comprobaciones de autenticación de Gateway para modo de token local (ofrece generación de token cuando no existe fuente de token; no sobrescribe configuraciones SecretRef de token).
    - Detección de problemas de emparejamiento de dispositivos (solicitudes pendientes de primer emparejamiento, actualizaciones pendientes de rol/alcance, deriva obsoleta de caché local de token de dispositivo y deriva de autenticación de registro emparejado).

  </Accordion>
  <Accordion title="Espacio de trabajo y shell">
    - Comprobación de linger de systemd en Linux.
    - Comprobación de tamaño de archivos de arranque del espacio de trabajo (advertencias de truncamiento/cercanía al límite para archivos de contexto).
    - Comprobación de preparación de Skills para el agente predeterminado; informa skills permitidas con bins, env, configuración o requisitos de SO faltantes, y `--fix` puede deshabilitar skills no disponibles en `skills.entries`.
    - Comprobación de estado de completado de shell e instalación/actualización automática.
    - Comprobación de preparación del proveedor de embeddings de búsqueda de memoria (modelo local, clave de API remota o binario QMD).
    - Comprobaciones de instalación desde código fuente (desajuste de espacio de trabajo pnpm, recursos de UI faltantes, binario tsx faltante).
    - Escribe configuración actualizada + metadatos del asistente.

  </Accordion>
</AccordionGroup>

## Relleno retrospectivo y restablecimiento de la UI de Dreams

La escena Dreams de Control UI incluye acciones **Rellenar retrospectivamente**, **Restablecer** y **Borrar fundamentadas** para el flujo de trabajo de dreaming fundamentado. Estas acciones usan métodos RPC de estilo doctor de Gateway, pero **no** forman parte de la reparación/migración de la CLI `openclaw doctor`.

Qué hacen:

- **Rellenar retrospectivamente** escanea archivos históricos `memory/YYYY-MM-DD.md` en el espacio de trabajo activo, ejecuta la pasada de diario REM fundamentado y escribe entradas reversibles de relleno retrospectivo en `DREAMS.md`.
- **Restablecer** elimina solo esas entradas marcadas de diario de relleno retrospectivo de `DREAMS.md`.
- **Borrar fundamentadas** elimina solo entradas preparadas de corto plazo fundamentadas únicamente que vinieron de una reproducción histórica y todavía no han acumulado recuperación en vivo ni soporte diario.

Qué **no** hacen por sí mismas:

- no editan `MEMORY.md`
- no ejecutan migraciones completas de doctor
- no preparan automáticamente candidatos fundamentados en el almacén de promoción de corto plazo en vivo a menos que ejecutes explícitamente primero la ruta preparada de CLI

Si quieres que la reproducción histórica fundamentada influya en la ruta normal de promoción profunda, usa el flujo de CLI en su lugar:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Eso prepara candidatos duraderos fundamentados en el almacén de dreaming de corto plazo, manteniendo `DREAMS.md` como superficie de revisión.

## Comportamiento detallado y justificación

<AccordionGroup>
  <Accordion title="0. Actualización opcional (instalaciones de git)">
    Si esto es un checkout de git y doctor se ejecuta de forma interactiva, ofrece actualizar (fetch/rebase/build) antes de ejecutar doctor.
  </Accordion>
  <Accordion title="1. Normalización de configuración">
    Si la configuración contiene formas de valor heredadas (por ejemplo `messages.ackReaction` sin una anulación específica de canal), doctor las normaliza al esquema actual.

    Eso incluye campos planos heredados de Talk. La configuración pública actual de voz de Talk es `talk.provider` + `talk.providers.<provider>`, y la configuración de voz en tiempo real es `talk.realtime.*`. Doctor reescribe formas antiguas `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` en el mapa de proveedor, y reescribe selectores heredados de nivel superior en tiempo real (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) en `talk.realtime`.

    Doctor también advierte cuando `plugins.allow` no está vacía y la política de herramientas usa
    entradas de comodín o de herramientas propiedad de Plugin. `tools.allow: ["*"]` solo coincide con herramientas
    de plugins que realmente se cargan; no omite la lista de permitidos exclusiva de Plugin.
    Doctor escribe `plugins.bundledDiscovery: "compat"` para configuraciones heredadas migradas
    de lista de permitidos para conservar el comportamiento existente de proveedores incluidos, y
    luego apunta al ajuste más estricto `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migraciones de claves de configuración heredadas">
    Cuando la configuración contiene claves obsoletas, otros comandos se niegan a ejecutarse y te piden ejecutar `openclaw doctor`.

    Doctor hará lo siguiente:

    - Explicar qué claves heredadas se encontraron.
    - Mostrar la migración que aplicó.
    - Reescribir `~/.openclaw/openclaw.json` con el esquema actualizado.

    El arranque de Gateway rechaza formatos de configuración heredados y te pide ejecutar `openclaw doctor --fix`; no reescribe `openclaw.json` al arrancar. Las migraciones del almacén de trabajos Cron también las gestiona `openclaw doctor --fix`.

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
    - selectores de Talk en tiempo real de nivel superior heredados (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Para canales con `accounts` con nombre pero valores de canal de nivel superior de una sola cuenta que aún persisten, mueve esos valores con ámbito de cuenta a la cuenta promocionada elegida para ese canal (`accounts.default` para la mayoría de los canales; Matrix puede conservar un destino existente coincidente con nombre o predeterminado)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - elimina `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` para tiempos de espera de proveedor/modelo lentos
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - elimina `browser.relayBindHost` (configuración heredada del relé de extensión)
    - `models.providers.*.api: "openai"` heredado → `"openai-completions"` (el arranque del Gateway también omite proveedores cuyo `api` esté establecido en un valor de enum futuro o desconocido en lugar de fallar de forma cerrada)
    - elimina `plugins.entries.codex.config.codexDynamicToolsProfile`; el servidor de aplicaciones de Codex siempre mantiene nativas las herramientas de espacio de trabajo nativas de Codex

    Las advertencias de doctor también incluyen orientación sobre cuentas predeterminadas para canales con varias cuentas:

    - Si se configuran dos o más entradas de `channels.<channel>.accounts` sin `channels.<channel>.defaultAccount` ni `accounts.default`, doctor advierte que el enrutamiento de respaldo puede elegir una cuenta inesperada.
    - Si `channels.<channel>.defaultAccount` se establece en un ID de cuenta desconocido, doctor advierte y enumera los ID de cuenta configurados.

  </Accordion>
  <Accordion title="2b. Overrides de proveedor de OpenCode">
    Si has agregado `models.providers.opencode`, `opencode-zen` u `opencode-go` manualmente, esto reemplaza el catálogo integrado de OpenCode de `@earendil-works/pi-ai`. Eso puede forzar modelos a la API incorrecta o dejar los costos en cero. Doctor advierte para que puedas eliminar el override y restaurar el enrutamiento de API y los costos por modelo.
  </Accordion>
  <Accordion title="2c. Migración de navegador y preparación para Chrome MCP">
    Si tu configuración de navegador todavía apunta a la ruta eliminada de la extensión de Chrome, doctor la normaliza al modelo actual de conexión de Chrome MCP local al host:

    - `browser.profiles.*.driver: "extension"` pasa a ser `"existing-session"`
    - `browser.relayBindHost` se elimina

    Doctor también audita la ruta de Chrome MCP local al host cuando usas `defaultProfile: "user"` o un perfil `existing-session` configurado:

    - comprueba si Google Chrome está instalado en el mismo host para perfiles predeterminados de conexión automática
    - comprueba la versión de Chrome detectada y advierte cuando es inferior a Chrome 144
    - te recuerda habilitar la depuración remota en la página de inspección del navegador (por ejemplo, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor no puede habilitar por ti la configuración del lado de Chrome. Chrome MCP local al host todavía requiere:

    - un navegador basado en Chromium 144+ en el host de gateway/nodo
    - el navegador ejecutándose localmente
    - depuración remota habilitada en ese navegador
    - aprobar el primer aviso de consentimiento de conexión en el navegador

    La preparación aquí solo trata sobre los requisitos previos de conexión local. Existing-session mantiene los límites actuales de rutas de Chrome MCP; las rutas avanzadas como `responsebody`, exportación de PDF, intercepción de descargas y acciones por lotes siguen requiriendo un navegador administrado o un perfil CDP sin procesar.

    Esta comprobación **no** se aplica a Docker, sandbox, remote-browser ni otros flujos headless. Esos siguen usando CDP sin procesar.

  </Accordion>
  <Accordion title="2d. Requisitos previos de OAuth TLS">
    Cuando se configura un perfil de OpenAI Codex OAuth, doctor sondea el endpoint de autorización de OpenAI para verificar que la pila local de TLS de Node/OpenSSL pueda validar la cadena de certificados. Si el sondeo falla con un error de certificado (por ejemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado caducado o certificado autofirmado), doctor imprime orientación de corrección específica de la plataforma. En macOS con un Node de Homebrew, la corrección suele ser `brew postinstall ca-certificates`. Con `--deep`, el sondeo se ejecuta incluso si el gateway está en buen estado.
  </Accordion>
  <Accordion title="2e. Overrides de proveedor de Codex OAuth">
    Si antes agregaste configuraciones heredadas de transporte de OpenAI en `models.providers.openai-codex`, pueden ocultar la ruta del proveedor integrado de Codex OAuth que las versiones más recientes usan automáticamente. Doctor advierte cuando ve esas configuraciones de transporte antiguas junto con Codex OAuth para que puedas eliminar o reescribir el override de transporte obsoleto y recuperar el comportamiento integrado de enrutamiento/respaldo. Los proxies personalizados y los overrides solo de encabezados siguen siendo compatibles y no activan esta advertencia.
  </Accordion>
  <Accordion title="2f. Reparación de rutas de Codex">
    Doctor comprueba si hay referencias de modelo `openai-codex/*` heredadas. El enrutamiento nativo del arnés de Codex usa referencias canónicas de modelo `openai/*`; los turnos del agente de OpenAI pasan por el arnés del servidor de aplicaciones de Codex en lugar de la ruta OpenAI de OpenClaw PI.

    En modo `--fix` / `--repair`, doctor reescribe las referencias afectadas del agente predeterminado y por agente, incluidos modelos principales, respaldos, overrides de heartbeat/subagent/compaction, hooks, overrides de modelo por canal y estado de ruta de sesión persistido obsoleto:

    - `openai-codex/gpt-*` pasa a ser `openai/gpt-*`.
    - La intención de Codex se mueve a entradas `agentRuntime.id: "codex"` con ámbito de proveedor/modelo para referencias de modelo de agente reparadas, de modo que los perfiles de autenticación `openai-codex:...` todavía puedan seleccionarse después de que la referencia de modelo pase a ser `openai/*`.
    - La configuración de runtime de agente completo obsoleta y los pines de runtime de sesión persistidos se eliminan porque la selección de runtime tiene ámbito de proveedor/modelo.
    - La política de runtime existente de proveedor/modelo se conserva salvo que la referencia de modelo heredada reparada necesite enrutamiento de Codex para mantener la ruta de autenticación antigua.
    - Las listas existentes de respaldo de modelo se conservan con sus entradas heredadas reescritas; las configuraciones por modelo copiadas se mueven de la clave heredada a la clave canónica `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, avisos de respaldo y pines de perfil de autenticación de sesión persistidos se reparan en todos los almacenes de sesión de agentes descubiertos.
    - `/codex ...` significa "controlar o vincular una conversación nativa de Codex desde el chat".
    - `/acp ...` o `runtime: "acp"` significa "usar el adaptador externo ACP/acpx".

  </Accordion>
  <Accordion title="2g. Limpieza de rutas de sesión">
    Doctor también analiza los almacenes de sesión de agentes descubiertos en busca de estado de ruta autocreado obsoleto después de mover modelos configurados o runtime fuera de una ruta propiedad de un Plugin, como Codex.

    `openclaw doctor --fix` puede limpiar estado obsoleto autocreado como pines de modelo `modelOverrideSource: "auto"`, metadatos de modelo de runtime, ID de arnés fijados, vinculaciones de sesión de CLI y overrides automáticos de perfil de autenticación cuando su ruta propietaria ya no está configurada. Las elecciones explícitas de usuario o heredadas de modelo de sesión se notifican para revisión manual y se dejan intactas; cámbialas con `/model ...`, `/new` o restablece la sesión cuando esa ruta ya no sea la prevista.

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

    Estas migraciones son de mejor esfuerzo e idempotentes; doctor emitirá advertencias cuando deje carpetas heredadas como copias de seguridad. El Gateway/CLI también migra automáticamente el almacén de sesiones heredado y el directorio de agente al arrancar, para que el historial/autenticación/modelos terminen en la ruta por agente sin una ejecución manual de doctor. La autenticación de WhatsApp se migra intencionalmente solo mediante `openclaw doctor`. La normalización de proveedor/mapa de proveedores de Talk ahora compara por igualdad estructural, por lo que las diferencias solo de orden de claves ya no activan cambios repetidos sin efecto de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migraciones de manifiestos de Plugin heredados">
    Doctor analiza todos los manifiestos de Plugin instalados en busca de claves de capacidad de nivel superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Cuando las encuentra, ofrece moverlas al objeto `contracts` y reescribir el archivo de manifiesto en el lugar. Esta migración es idempotente; si la clave `contracts` ya tiene los mismos valores, la clave heredada se elimina sin duplicar los datos.
  </Accordion>
  <Accordion title="3b. Migraciones de almacén de Cron heredadas">
    Doctor también comprueba el almacén de trabajos de Cron (`~/.openclaw/cron/jobs.json` de forma predeterminada, o `cron.store` cuando se reemplaza) en busca de formas antiguas de trabajos que el programador todavía acepta por compatibilidad.

    Las limpiezas actuales de Cron incluyen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de carga útil de nivel superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nivel superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de entrega `provider` de la carga útil → `delivery.channel` explícito
    - tareas webhook de reserva heredadas simples `notify: true` → `delivery.mode="webhook"` explícito con `delivery.to=cron.webhook`

    Doctor solo migra automáticamente las tareas `notify: true` cuando puede hacerlo sin cambiar el comportamiento. Si una tarea combina la reserva de notificación heredada con un modo de entrega no webhook existente, doctor advierte y deja esa tarea para revisión manual.

    En Linux, doctor también advierte cuando el crontab del usuario aún invoca el heredado `~/.openclaw/bin/ensure-whatsapp.sh`. Ese script local del host no está mantenido por el OpenClaw actual y puede escribir mensajes falsos de `Gateway inactive` en `~/.openclaw/logs/whatsapp-health.log` cuando cron no puede alcanzar el bus de usuario de systemd. Elimina la entrada obsoleta del crontab con `crontab -e`; usa `openclaw channels status --probe`, `openclaw doctor` y `openclaw gateway status` para las comprobaciones de estado actuales.

  </Accordion>
  <Accordion title="3c. Limpieza de bloqueos de sesión">
    Doctor analiza cada directorio de sesión de agente en busca de archivos de bloqueo de escritura obsoletos: archivos que quedaron cuando una sesión terminó de forma anómala. Por cada archivo de bloqueo encontrado informa: la ruta, el PID, si el PID sigue activo, la antigüedad del bloqueo y si se considera obsoleto (PID muerto, más de 30 minutos, o un PID activo que se puede demostrar que pertenece a un proceso que no es de OpenClaw). En modo `--fix` / `--repair` elimina automáticamente los archivos de bloqueo obsoletos; de lo contrario, imprime una nota y te indica que vuelvas a ejecutarlo con `--fix`.
  </Accordion>
  <Accordion title="3d. Reparación de ramas de transcripción de sesión">
    Doctor analiza los archivos JSONL de sesión de agente en busca de la forma de rama duplicada creada por el error de reescritura de transcripciones de prompts del 2026.4.24: un turno de usuario abandonado con contexto interno de tiempo de ejecución de OpenClaw más un hermano activo que contiene el mismo prompt visible del usuario. En modo `--fix` / `--repair`, doctor respalda cada archivo afectado junto al original y reescribe la transcripción a la rama activa para que el historial del Gateway y los lectores de memoria ya no vean turnos duplicados.
  </Accordion>
  <Accordion title="4. Comprobaciones de integridad de estado (persistencia de sesión, enrutamiento y seguridad)">
    El directorio de estado es el tronco encefálico operativo. Si desaparece, pierdes sesiones, credenciales, registros y configuración (a menos que tengas copias de seguridad en otro lugar).

    Doctor comprueba:

    - **Directorio de estado faltante**: advierte sobre una pérdida catastrófica de estado, solicita recrear el directorio y recuerda que no puede recuperar datos faltantes.
    - **Permisos del directorio de estado**: verifica la capacidad de escritura; ofrece reparar permisos (y emite una sugerencia de `chown` cuando detecta una discrepancia de propietario/grupo).
    - **Directorio de estado sincronizado con la nube en macOS**: advierte cuando el estado se resuelve bajo iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...` porque las rutas respaldadas por sincronización pueden causar E/S más lenta y carreras de bloqueo/sincronización.
    - **Directorio de estado en SD o eMMC en Linux**: advierte cuando el estado se resuelve a una fuente de montaje `mmcblk*`, porque la E/S aleatoria respaldada por SD o eMMC puede ser más lenta y desgastarse más rápido con escrituras de sesiones y credenciales.
    - **Directorios de sesión faltantes**: `sessions/` y el directorio de almacenamiento de sesiones son necesarios para persistir el historial y evitar fallos `ENOENT`.
    - **Discrepancia de transcripción**: advierte cuando las entradas de sesión recientes tienen archivos de transcripción faltantes.
    - **Sesión principal "JSONL de 1 línea"**: marca cuando la transcripción principal tiene una sola línea (el historial no se está acumulando).
    - **Múltiples directorios de estado**: advierte cuando existen varias carpetas `~/.openclaw` en distintos directorios de inicio o cuando `OPENCLAW_STATE_DIR` apunta a otro lugar (el historial puede dividirse entre instalaciones).
    - **Recordatorio de modo remoto**: si `gateway.mode=remote`, doctor te recuerda ejecutarlo en el host remoto (el estado vive allí).
    - **Permisos del archivo de configuración**: advierte si `~/.openclaw/openclaw.json` es legible por grupo/mundo y ofrece endurecerlo a `600`.

  </Accordion>
  <Accordion title="5. Estado de autenticación de modelos (caducidad de OAuth)">
    Doctor inspecciona los perfiles OAuth en el almacén de autenticación, advierte cuando los tokens están por caducar o han caducado y puede renovarlos cuando es seguro. Si el perfil OAuth/token de Anthropic está obsoleto, sugiere una clave de API de Anthropic o la ruta de token de configuración de Anthropic. Los prompts de renovación solo aparecen cuando se ejecuta de forma interactiva (TTY); `--non-interactive` omite los intentos de renovación.

    Cuando una renovación de OAuth falla permanentemente (por ejemplo `refresh_token_reused`, `invalid_grant`, o un proveedor que te indica iniciar sesión de nuevo), doctor informa que se requiere volver a autenticarse e imprime el comando exacto `openclaw models auth login --provider ...` que debes ejecutar.

    Doctor también informa perfiles de autenticación que son temporalmente inutilizables debido a:

    - enfriamientos breves (límites de tasa/tiempos de espera/fallos de autenticación)
    - deshabilitaciones más largas (fallos de facturación/crédito)

  </Accordion>
  <Accordion title="6. Validación del modelo de hooks">
    Si `hooks.gmail.model` está configurado, doctor valida la referencia del modelo contra el catálogo y la lista de permitidos, y advierte cuando no se resolverá o no está permitido.
  </Accordion>
  <Accordion title="7. Reparación de imagen de sandbox">
    Cuando el sandbox está habilitado, doctor comprueba las imágenes Docker y ofrece compilar o cambiar a nombres heredados si falta la imagen actual.
  </Accordion>
  <Accordion title="7b. Limpieza de instalación de Plugin">
    Doctor elimina el estado heredado de staging de dependencias de plugins generado por OpenClaw en modo `openclaw doctor --fix` / `openclaw doctor --repair`. Esto cubre raíces de dependencias generadas obsoletas, directorios antiguos de etapa de instalación, residuos locales de paquetes de código anterior de reparación de dependencias de plugins incluidos y copias npm gestionadas huérfanas o recuperadas de plugins incluidos `@openclaw/*` que pueden ocultar el manifiesto incluido actual.

    Doctor también puede reinstalar plugins descargables faltantes cuando la configuración los referencia pero el registro local de plugins no puede encontrarlos. Los ejemplos incluyen `plugins.entries` materiales, configuración de canal/proveedor/búsqueda configurada y tiempos de ejecución de agentes configurados. Durante las actualizaciones de paquetes, doctor evita ejecutar la reparación de plugins del gestor de paquetes mientras se intercambia el paquete principal; ejecuta `openclaw doctor --fix` de nuevo después de la actualización si un plugin configurado aún necesita recuperación. El inicio del Gateway y la recarga de configuración no ejecutan gestores de paquetes; las instalaciones de plugins siguen siendo trabajo explícito de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migraciones de servicio de Gateway y sugerencias de limpieza">
    Doctor detecta servicios gateway heredados (launchd/systemd/schtasks) y ofrece eliminarlos e instalar el servicio OpenClaw usando el puerto de gateway actual. También puede analizar servicios adicionales similares a gateway e imprimir sugerencias de limpieza. Los servicios de gateway de OpenClaw con nombre de perfil se consideran de primera clase y no se marcan como "extra."

    En Linux, si falta el servicio gateway de nivel de usuario pero existe un servicio gateway de OpenClaw de nivel de sistema, doctor no instala automáticamente un segundo servicio de nivel de usuario. Inspecciona con `openclaw gateway status --deep` o `openclaw doctor --deep`, luego elimina el duplicado o configura `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando un supervisor del sistema posee el ciclo de vida del gateway.

  </Accordion>
  <Accordion title="8b. Migración de inicio de Matrix">
    Cuando una cuenta de canal Matrix tiene una migración de estado heredada pendiente o accionable, doctor (en modo `--fix` / `--repair`) crea una instantánea previa a la migración y luego ejecuta los pasos de migración de mejor esfuerzo: migración de estado Matrix heredado y preparación de estado cifrado heredado. Ambos pasos no son fatales; los errores se registran y el inicio continúa. En modo de solo lectura (`openclaw doctor` sin `--fix`) esta comprobación se omite por completo.
  </Accordion>
  <Accordion title="8c. Emparejamiento de dispositivos y deriva de autenticación">
    Doctor ahora inspecciona el estado de emparejamiento de dispositivos como parte del pase normal de estado.

    Lo que informa:

    - solicitudes pendientes de emparejamiento por primera vez
    - actualizaciones de rol pendientes para dispositivos ya emparejados
    - actualizaciones de alcance pendientes para dispositivos ya emparejados
    - reparaciones de discrepancia de clave pública donde el id de dispositivo aún coincide pero la identidad del dispositivo ya no coincide con el registro aprobado
    - registros emparejados sin un token activo para un rol aprobado
    - tokens emparejados cuyos alcances derivan fuera de la base de emparejamiento aprobada
    - entradas locales en caché de token de dispositivo para la máquina actual que son anteriores a una rotación de token del lado del gateway o contienen metadatos de alcance obsoletos

    Doctor no aprueba automáticamente solicitudes de emparejamiento ni rota automáticamente tokens de dispositivo. En su lugar, imprime los pasos siguientes exactos:

    - inspeccionar solicitudes pendientes con `openclaw devices list`
    - aprobar la solicitud exacta con `openclaw devices approve <requestId>`
    - rotar un token nuevo con `openclaw devices rotate --device <deviceId> --role <role>`
    - eliminar y volver a aprobar un registro obsoleto con `openclaw devices remove <deviceId>`

    Esto cierra el hueco común de "ya emparejado pero aún recibe emparejamiento requerido": doctor ahora distingue el emparejamiento por primera vez de las actualizaciones pendientes de rol/alcance y de la deriva de token/identidad de dispositivo obsoletos.

  </Accordion>
  <Accordion title="9. Advertencias de seguridad">
    Doctor emite advertencias cuando un proveedor está abierto a DM sin una lista de permitidos, o cuando una política está configurada de forma peligrosa.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Si se ejecuta como servicio de usuario de systemd, doctor garantiza que lingering esté habilitado para que el gateway siga activo después de cerrar sesión.
  </Accordion>
  <Accordion title="11. Estado del espacio de trabajo (skills, plugins y directorios heredados)">
    Doctor imprime un resumen del estado del espacio de trabajo para el agente predeterminado:

    - **Estado de Skills**: cuenta las skills elegibles, con requisitos faltantes y bloqueadas por la lista de permitidos.
    - **Directorios de espacio de trabajo heredados**: advierte cuando `~/openclaw` u otros directorios de espacio de trabajo heredados existen junto al espacio de trabajo actual.
    - **Estado de Plugin**: cuenta plugins habilitados/deshabilitados/con errores; lista los IDs de plugins para cualquier error; informa capacidades de plugins incluidos.
    - **Advertencias de compatibilidad de Plugin**: marca plugins que tienen problemas de compatibilidad con el tiempo de ejecución actual.
    - **Diagnósticos de Plugin**: muestra cualquier advertencia o error de tiempo de carga emitido por el registro de plugins.

  </Accordion>
  <Accordion title="11b. Tamaño de archivo de bootstrap">
    Doctor comprueba si los archivos de bootstrap del espacio de trabajo (por ejemplo `AGENTS.md`, `CLAUDE.md` u otros archivos de contexto inyectados) están cerca o por encima del presupuesto de caracteres configurado. Informa conteos de caracteres sin procesar frente a inyectados por archivo, porcentaje de truncamiento, causa de truncamiento (`max/file` o `max/total`) y caracteres inyectados totales como fracción del presupuesto total. Cuando los archivos se truncan o están cerca del límite, doctor imprime consejos para ajustar `agents.defaults.bootstrapMaxChars` y `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpieza de plugins de canal obsoletos">
    Cuando `openclaw doctor --fix` elimina un plugin de canal faltante, también elimina la configuración colgante de alcance de canal que referenciaba ese plugin: entradas `channels.<id>`, objetivos de Heartbeat que nombraban el canal y overrides `agents.*.models["<channel>/*"]`. Esto evita bucles de arranque del Gateway donde el runtime del canal ya no existe pero la configuración aún pide al gateway enlazarse a él.
  </Accordion>
  <Accordion title="11c. Autocompletado de shell">
    Doctor comprueba si el autocompletado con tab está instalado para el shell actual (zsh, bash, fish o PowerShell):

    - Si el perfil del shell usa un patrón lento de autocompletado dinámico (`source <(openclaw completion ...)`), doctor lo actualiza a la variante más rápida de archivo en caché.
    - Si el autocompletado está configurado en el perfil pero falta el archivo de caché, doctor regenera la caché automáticamente.
    - Si no hay autocompletado configurado en absoluto, doctor solicita instalarlo (solo en modo interactivo; se omite con `--non-interactive`).

    Ejecuta `openclaw completion --write-state` para regenerar la caché manualmente.

  </Accordion>
  <Accordion title="12. Comprobaciones de autenticación del Gateway (token local)">
    Doctor comprueba la preparación de la autenticación con token del gateway local.

    - Si el modo de token necesita un token y no existe ninguna fuente de token, doctor ofrece generar uno.
    - Si `gateway.auth.token` está gestionado por SecretRef pero no está disponible, doctor advierte y no lo sobrescribe con texto sin formato.
    - `openclaw doctor --generate-gateway-token` fuerza la generación solo cuando no hay ningún SecretRef de token configurado.

  </Accordion>
  <Accordion title="12b. Reparaciones de solo lectura conscientes de SecretRef">
    Algunos flujos de reparación necesitan inspeccionar las credenciales configuradas sin debilitar el comportamiento de fallo rápido en runtime.

    - `openclaw doctor --fix` ahora usa el mismo modelo de resumen de SecretRef de solo lectura que los comandos de la familia de estado para reparaciones de configuración específicas.
    - Ejemplo: la reparación de `@username` en `allowFrom` / `groupAllowFrom` de Telegram intenta usar las credenciales de bot configuradas cuando están disponibles.
    - Si el token de bot de Telegram está configurado mediante SecretRef pero no está disponible en la ruta del comando actual, doctor informa que la credencial está configurada-pero-no-disponible y omite la resolución automática en lugar de fallar o informar erróneamente que falta el token.

  </Accordion>
  <Accordion title="13. Comprobación de salud del Gateway + reinicio">
    Doctor ejecuta una comprobación de salud y ofrece reiniciar el gateway cuando parece no estar saludable.
  </Accordion>
  <Accordion title="13b. Preparación de búsqueda de memoria">
    Doctor comprueba si el proveedor de embeddings de búsqueda de memoria configurado está listo para el agente predeterminado. El comportamiento depende del backend y del proveedor configurados:

    - **Backend QMD**: comprueba si el binario `qmd` está disponible y puede iniciarse. Si no, imprime una guía de solución que incluye el paquete npm y una opción de ruta manual al binario.
    - **Proveedor local explícito**: comprueba si existe un archivo de modelo local o una URL de modelo remota/descargable reconocida. Si falta, sugiere cambiar a un proveedor remoto.
    - **Proveedor remoto explícito** (`openai`, `voyage`, etc.): verifica que haya una clave de API presente en el entorno o en el almacén de autenticación. Imprime sugerencias de solución accionables si falta.
    - **Proveedor automático**: comprueba primero la disponibilidad del modelo local y luego prueba cada proveedor remoto en el orden de selección automática.

    Cuando hay disponible un resultado de sondeo del gateway en caché (el gateway estaba saludable en el momento de la comprobación), doctor cruza su resultado con la configuración visible para la CLI y señala cualquier discrepancia. Doctor no inicia un ping de embeddings nuevo en la ruta predeterminada; usa el comando de estado profundo de memoria cuando quieras una comprobación en vivo del proveedor.

    Usa `openclaw memory status --deep` para verificar la preparación de embeddings en runtime.

  </Accordion>
  <Accordion title="14. Advertencias de estado de canales">
    Si el gateway está saludable, doctor ejecuta un sondeo de estado de canales e informa advertencias con soluciones sugeridas.
  </Accordion>
  <Accordion title="15. Auditoría + reparación de configuración del supervisor">
    Doctor comprueba la configuración instalada del supervisor (launchd/systemd/schtasks) en busca de valores predeterminados faltantes u obsoletos (por ejemplo, dependencias `network-online` de systemd y retraso de reinicio). Cuando encuentra una discrepancia, recomienda una actualización y puede reescribir el archivo de servicio/tarea con los valores predeterminados actuales.

    Notas:

    - `openclaw doctor` solicita confirmación antes de reescribir la configuración del supervisor.
    - `openclaw doctor --yes` acepta las solicitudes de reparación predeterminadas.
    - `openclaw doctor --repair` aplica las correcciones recomendadas sin solicitudes.
    - `openclaw doctor --repair --force` sobrescribe configuraciones personalizadas del supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor en modo de solo lectura para el ciclo de vida del servicio del gateway. Sigue informando la salud del servicio y ejecuta reparaciones que no son de servicio, pero omite la instalación/inicio/reinicio/bootstrap del servicio, las reescrituras de configuración del supervisor y la limpieza de servicios heredados porque un supervisor externo posee ese ciclo de vida.
    - En Linux, doctor no reescribe metadatos de comando/entrypoint mientras la unidad systemd del gateway correspondiente está activa. También ignora unidades adicionales inactivas no heredadas similares al gateway durante el escaneo de servicios duplicados para que los archivos de servicio complementarios no generen ruido de limpieza.
    - Si la autenticación con token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación/reparación del servicio de doctor valida el SecretRef pero no conserva valores de token en texto sin formato resueltos en los metadatos de entorno del servicio del supervisor.
    - Doctor detecta valores de entorno de servicio gestionados por `.env`/respaldados por SecretRef que instalaciones antiguas de LaunchAgent, systemd o Windows Scheduled Task incrustaron en línea y reescribe los metadatos del servicio para que esos valores se carguen desde la fuente de runtime en lugar de la definición del supervisor.
    - Doctor detecta cuando el comando de servicio todavía fija un `--port` antiguo después de cambios en `gateway.port` y reescribe los metadatos del servicio al puerto actual.
    - Si la autenticación con token requiere un token y el SecretRef de token configurado no está resuelto, doctor bloquea la ruta de instalación/reparación con orientación accionable.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, doctor bloquea la instalación/reparación hasta que el modo se establezca explícitamente.
    - Para unidades user-systemd de Linux, las comprobaciones de desviación de token de doctor ahora incluyen tanto fuentes `Environment=` como `EnvironmentFile=` al comparar metadatos de autenticación del servicio.
    - Las reparaciones de servicio de doctor rechazan reescribir, detener o reiniciar un servicio de gateway desde un binario antiguo de OpenClaw cuando la configuración fue escrita por última vez por una versión más nueva. Consulta [Solución de problemas del Gateway](/es/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Siempre puedes forzar una reescritura completa mediante `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos de runtime + puerto del Gateway">
    Doctor inspecciona el runtime del servicio (PID, último estado de salida) y advierte cuando el servicio está instalado pero no se está ejecutando realmente. También comprueba colisiones de puerto en el puerto del gateway (predeterminado `18789`) e informa causas probables (gateway ya en ejecución, túnel SSH).
  </Accordion>
  <Accordion title="17. Buenas prácticas de runtime del Gateway">
    Doctor advierte cuando el servicio del gateway se ejecuta en Bun o en una ruta de Node gestionada por versiones (`nvm`, `fnm`, `volta`, `asdf`, etc.). Los canales de WhatsApp + Telegram requieren Node, y las rutas de gestores de versiones pueden romperse después de actualizaciones porque el servicio no carga la inicialización de tu shell. Doctor ofrece migrar a una instalación de Node del sistema cuando está disponible (Homebrew/apt/choco).

    Los LaunchAgents de macOS recién instalados o reparados usan un PATH canónico del sistema (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) en lugar de copiar el PATH del shell interactivo, por lo que los binarios del sistema gestionados por Homebrew siguen disponibles mientras Volta, asdf, fnm, pnpm y otros directorios de gestores de versiones no cambian qué Node resuelven los procesos hijos. Los servicios de Linux todavía conservan raíces de entorno explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) y directorios user-bin estables, pero los directorios de respaldo adivinados de gestores de versiones solo se escriben en el PATH del servicio cuando esos directorios existen en disco.

  </Accordion>
  <Accordion title="18. Escritura de configuración + metadatos del asistente">
    Doctor conserva cualquier cambio de configuración y marca los metadatos del asistente para registrar la ejecución de doctor.
  </Accordion>
  <Accordion title="19. Consejos de workspace (copia de seguridad + sistema de memoria)">
    Doctor sugiere un sistema de memoria de workspace cuando falta e imprime un consejo de copia de seguridad si el workspace aún no está bajo git.

    Consulta [/concepts/agent-workspace](/es/concepts/agent-workspace) para ver una guía completa de la estructura del workspace y la copia de seguridad con git (se recomienda GitHub o GitLab privado).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Runbook del Gateway](/es/gateway)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
