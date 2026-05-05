---
read_when:
    - Agregar o modificar migraciones de doctor
    - Introducción de cambios incompatibles en la configuración
sidebarTitle: Doctor
summary: 'Comando doctor: comprobaciones de estado, migraciones de configuración y pasos de reparación'
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-05T08:25:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360f9f7a349e4633ff61d526f1eb5b668b595b4f35c5e0fd2a314715a0599c4c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` es la herramienta de reparación + migración para OpenClaw. Corrige configuración/estado obsoletos, comprueba el estado de salud y proporciona pasos de reparación accionables.

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

    Ejecuta sin avisos y solo aplica migraciones seguras (normalización de configuración + movimientos de estado en disco). Omite acciones de reinicio/servicio/sandbox que requieren confirmación humana. Las migraciones de estado heredado se ejecutan automáticamente cuando se detectan.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Analiza los servicios del sistema en busca de instalaciones adicionales del Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Si quieres revisar los cambios antes de escribir, abre primero el archivo de configuración:

```bash
cat ~/.openclaw/openclaw.json
```

## Qué hace (resumen)

<AccordionGroup>
  <Accordion title="Estado de salud, UI y actualizaciones">
    - Actualización previa opcional para instalaciones de git (solo interactivo).
    - Comprobación de vigencia del protocolo de la UI (recompila Control UI cuando el esquema de protocolo es más reciente).
    - Comprobación de estado de salud + aviso de reinicio.
    - Resumen de estado de Skills (elegibles/faltantes/bloqueadas) y estado de plugins.

  </Accordion>
  <Accordion title="Configuración y migraciones">
    - Normalización de configuración para valores heredados.
    - Migración de configuración de Talk desde campos planos heredados `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Comprobaciones de migración del navegador para configuraciones heredadas de la extensión de Chrome y preparación de Chrome MCP.
    - Advertencias de sobrescritura del proveedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Advertencias de solapamiento de Codex OAuth (`models.providers.openai-codex`).
    - Comprobación de requisitos previos de OAuth TLS para perfiles OAuth de OpenAI Codex.
    - Advertencias de lista de permitidos de plugins/herramientas cuando `plugins.allow` es restrictivo pero la política de herramientas aún pide comodines o herramientas propiedad de plugins.
    - Migración de estado heredado en disco (sesiones/directorio de agentes/autenticación de WhatsApp).
    - Migración de claves heredadas del contrato del manifiesto de plugins (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migración de almacén de Cron heredado (`jobId`, `schedule.cron`, campos superiores de entrega/carga útil, `provider` de carga útil, trabajos de respaldo simples de webhook `notify: true`).
    - Migración de política de tiempo de ejecución de agentes heredada a `agents.defaults.agentRuntime` y `agents.list[].agentRuntime`.
    - Limpieza de configuración obsoleta de plugins cuando los plugins están habilitados; cuando `plugins.enabled=false`, las referencias obsoletas a plugins se tratan como configuración de contención inerte y se conservan.

  </Accordion>
  <Accordion title="Estado e integridad">
    - Inspección de archivos de bloqueo de sesión y limpieza de bloqueos obsoletos.
    - Reparación de transcripciones de sesión para ramas de reescritura de prompt duplicadas creadas por compilaciones afectadas de 2026.4.24.
    - Detección de tombstones de recuperación tras reinicio de subagentes bloqueados, con soporte de `--fix` para borrar indicadores obsoletos de recuperación abortada de modo que el inicio no siga tratando al proceso hijo como abortado por reinicio.
    - Comprobaciones de integridad de estado y permisos (sesiones, transcripciones, directorio de estado).
    - Comprobaciones de permisos del archivo de configuración (chmod 600) al ejecutarse localmente.
    - Estado de autenticación de modelos: comprueba caducidad de OAuth, puede actualizar tokens próximos a caducar e informa estados de enfriamiento/deshabilitado de perfiles de autenticación.
    - Detección de directorio de espacio de trabajo adicional (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servicios y supervisores">
    - Reparación de imagen de sandbox cuando el aislamiento de sandbox está habilitado.
    - Migración de servicio heredado y detección de Gateways adicionales.
    - Migración de estado heredado del canal Matrix (en modo `--fix` / `--repair`).
    - Comprobaciones de tiempo de ejecución del Gateway (servicio instalado pero no en ejecución; etiqueta launchd en caché).
    - Advertencias de estado de canal (sondeadas desde el Gateway en ejecución).
    - Comprobaciones de capacidad de respuesta de WhatsApp para estado degradado del bucle de eventos del Gateway con clientes TUI locales aún en ejecución; `--fix` detiene solo clientes TUI locales verificados.
    - Auditoría de configuración del supervisor (launchd/systemd/schtasks) con reparación opcional.
    - Limpieza del entorno de proxy integrado para servicios del Gateway que capturaron valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante la instalación o actualización.
    - Comprobaciones de buenas prácticas del tiempo de ejecución del Gateway (Node frente a Bun, rutas de gestores de versiones).
    - Diagnósticos de colisión de puerto del Gateway (predeterminado `18789`).

  </Accordion>
  <Accordion title="Autenticación, seguridad y emparejamiento">
    - Advertencias de seguridad para políticas de DM abiertas.
    - Comprobaciones de autenticación del Gateway para modo de token local (ofrece generación de token cuando no existe una fuente de token; no sobrescribe configuraciones de token SecretRef).
    - Detección de problemas de emparejamiento de dispositivos (solicitudes pendientes de primer emparejamiento, actualizaciones pendientes de rol/alcance, desviación obsoleta de caché local de token de dispositivo y desviación de autenticación de registros emparejados).

  </Accordion>
  <Accordion title="Espacio de trabajo y shell">
    - Comprobación de linger de systemd en Linux.
    - Comprobación de tamaño del archivo de arranque del espacio de trabajo (advertencias de truncamiento/cercanía al límite para archivos de contexto).
    - Comprobación de preparación de Skills para el agente predeterminado; informa Skills permitidas con binarios, entorno, configuración o requisitos de SO faltantes, y `--fix` puede deshabilitar Skills no disponibles en `skills.entries`.
    - Comprobación de estado de autocompletado de shell e instalación/actualización automática.
    - Comprobación de preparación del proveedor de embeddings de búsqueda de memoria (modelo local, clave de API remota o binario QMD).
    - Comprobaciones de instalación desde código fuente (discrepancia de espacio de trabajo pnpm, recursos de UI faltantes, binario tsx faltante).
    - Escribe configuración actualizada + metadatos del asistente.

  </Accordion>
</AccordionGroup>

## Relleno y restablecimiento de la UI de Dreams

La escena Dreams de Control UI incluye acciones **Backfill**, **Reset** y **Clear Grounded** para el flujo de trabajo de Dreaming fundamentado. Estas acciones usan métodos RPC de estilo doctor del Gateway, pero **no** forman parte de la reparación/migración de la CLI `openclaw doctor`.

Qué hacen:

- **Backfill** analiza archivos históricos `memory/YYYY-MM-DD.md` en el espacio de trabajo activo, ejecuta la pasada de diario REM fundamentado y escribe entradas de relleno reversibles en `DREAMS.md`.
- **Reset** elimina solo esas entradas de diario de relleno marcadas de `DREAMS.md`.
- **Clear Grounded** elimina solo entradas preparadas de corto plazo exclusivamente fundamentadas que proceden de reproducción histórica y aún no han acumulado recuerdo en vivo ni soporte diario.

Qué **no** hacen por sí solas:

- no editan `MEMORY.md`
- no ejecutan migraciones completas de doctor
- no preparan automáticamente candidatos fundamentados en el almacén de promoción de corto plazo en vivo salvo que ejecutes explícitamente primero la ruta preparada de la CLI

Si quieres que la reproducción histórica fundamentada influya en la vía normal de promoción profunda, usa en su lugar el flujo de la CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Eso prepara candidatos duraderos fundamentados en el almacén de Dreaming de corto plazo, manteniendo `DREAMS.md` como superficie de revisión.

## Comportamiento detallado y justificación

<AccordionGroup>
  <Accordion title="0. Actualización opcional (instalaciones de git)">
    Si esto es un checkout de git y doctor se ejecuta de forma interactiva, ofrece actualizar (fetch/rebase/build) antes de ejecutar doctor.
  </Accordion>
  <Accordion title="1. Normalización de configuración">
    Si la configuración contiene formas de valores heredadas (por ejemplo `messages.ackReaction` sin una sobrescritura específica de canal), doctor las normaliza al esquema actual.

    Eso incluye los campos planos heredados de Talk. La configuración pública actual de Talk es `talk.provider` + `talk.providers.<provider>`. Doctor reescribe las formas antiguas `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` en el mapa de proveedores.

    Doctor también advierte cuando `plugins.allow` no está vacío y la política de herramientas usa
    comodines o entradas de herramientas propiedad de plugins. `tools.allow: ["*"]` solo coincide con herramientas
    de plugins que realmente cargan; no omite la lista de permitidos exclusiva de plugins. Doctor escribe `plugins.bundledDiscovery: "compat"` para configuraciones de lista de permitidos heredadas migradas a fin de preservar el comportamiento existente de proveedores empaquetados, y
    luego apunta a la configuración más estricta `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migraciones de claves de configuración heredadas">
    Cuando la configuración contiene claves obsoletas, otros comandos se niegan a ejecutarse y te piden que ejecutes `openclaw doctor`.

    Doctor hará lo siguiente:

    - Explicar qué claves heredadas se encontraron.
    - Mostrar la migración que aplicó.
    - Reescribir `~/.openclaw/openclaw.json` con el esquema actualizado.

    El Gateway también ejecuta automáticamente migraciones de doctor al iniciarse cuando detecta un formato de configuración heredado, de modo que las configuraciones obsoletas se reparan sin intervención manual. Las migraciones del almacén de trabajos de Cron se gestionan con `openclaw doctor --fix`.

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
    - Para los canales con `accounts` nombradas pero valores de canal de nivel superior de una sola cuenta que aún persisten, mueve esos valores con alcance de cuenta a la cuenta promocionada elegida para ese canal (`accounts.default` para la mayoría de los canales; Matrix puede conservar un destino existente coincidente nombrado/predeterminado)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - elimina `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` para tiempos de espera de proveedores/modelos lentos
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - elimina `browser.relayBindHost` (configuración heredada de relé de extensión)
    - `models.providers.*.api: "openai"` heredado → `"openai-completions"` (el inicio de Gateway también omite los proveedores cuyo `api` está establecido en un valor de enumeración futuro o desconocido en lugar de fallar en modo cerrado)

    Las advertencias de doctor también incluyen orientación sobre cuentas predeterminadas para canales de varias cuentas:

    - Si hay dos o más entradas `channels.<channel>.accounts` configuradas sin `channels.<channel>.defaultAccount` ni `accounts.default`, doctor advierte que el enrutamiento de reserva puede elegir una cuenta inesperada.
    - Si `channels.<channel>.defaultAccount` está establecido en un ID de cuenta desconocido, doctor advierte y enumera los ID de cuenta configurados.

  </Accordion>
  <Accordion title="2b. Reemplazos de proveedor OpenCode">
    Si agregaste `models.providers.opencode`, `opencode-zen` u `opencode-go` manualmente, reemplaza el catálogo integrado de OpenCode de `@mariozechner/pi-ai`. Eso puede forzar modelos a la API incorrecta o poner los costos en cero. Doctor advierte para que puedas eliminar el reemplazo y restaurar el enrutamiento de API + costos por modelo.
  </Accordion>
  <Accordion title="2c. Migración del navegador y preparación para Chrome MCP">
    Si tu configuración del navegador aún apunta a la ruta eliminada de la extensión de Chrome, doctor la normaliza al modelo actual de conexión Chrome MCP local al host:

    - `browser.profiles.*.driver: "extension"` se convierte en `"existing-session"`
    - `browser.relayBindHost` se elimina

    Doctor también audita la ruta Chrome MCP local al host cuando usas `defaultProfile: "user"` o un perfil `existing-session` configurado:

    - comprueba si Google Chrome está instalado en el mismo host para los perfiles predeterminados de conexión automática
    - comprueba la versión de Chrome detectada y advierte cuando es inferior a Chrome 144
    - te recuerda activar la depuración remota en la página de inspección del navegador (por ejemplo, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor no puede activar por ti la configuración del lado de Chrome. Chrome MCP local al host todavía requiere:

    - un navegador basado en Chromium 144+ en el host de gateway/node
    - el navegador ejecutándose localmente
    - depuración remota activada en ese navegador
    - aprobar el primer aviso de consentimiento de conexión en el navegador

    La preparación aquí solo trata sobre los requisitos previos de conexión local. Existing-session conserva los límites de ruta actuales de Chrome MCP; las rutas avanzadas como `responsebody`, exportación a PDF, interceptación de descargas y acciones por lotes aún requieren un navegador administrado o un perfil CDP sin procesar.

    Esta comprobación **no** se aplica a Docker, sandbox, remote-browser ni otros flujos headless. Esos siguen usando CDP sin procesar.

  </Accordion>
  <Accordion title="2d. Requisitos previos de TLS para OAuth">
    Cuando se configura un perfil de OAuth de OpenAI Codex, doctor prueba el endpoint de autorización de OpenAI para verificar que la pila local Node/OpenSSL TLS pueda validar la cadena de certificados. Si la prueba falla con un error de certificado (por ejemplo, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado vencido o certificado autofirmado), doctor imprime orientación de corrección específica de la plataforma. En macOS con un Node de Homebrew, la corrección suele ser `brew postinstall ca-certificates`. Con `--deep`, la prueba se ejecuta incluso si gateway está en buen estado.
  </Accordion>
  <Accordion title="2e. Reemplazos de proveedor Codex OAuth">
    Si agregaste anteriormente configuraciones heredadas de transporte de OpenAI en `models.providers.openai-codex`, pueden ocultar la ruta integrada del proveedor Codex OAuth que las versiones más recientes usan automáticamente. Doctor advierte cuando ve esas configuraciones de transporte antiguas junto a Codex OAuth para que puedas eliminar o reescribir el reemplazo de transporte obsoleto y recuperar el comportamiento integrado de enrutamiento/reserva. Los proxies personalizados y los reemplazos solo de encabezados siguen siendo compatibles y no activan esta advertencia.
  </Accordion>
  <Accordion title="2f. Advertencias de ruta del Plugin Codex">
    Cuando el Plugin Codex incluido está activado, doctor también comprueba si las referencias de modelo principal `openai-codex/*` todavía se resuelven mediante el ejecutor PI predeterminado. Esa combinación es válida cuando quieres autenticación de Codex OAuth/suscripción mediante PI, pero es fácil confundirla con el arnés nativo de app-server de Codex. Doctor advierte y señala la forma explícita de app-server: `openai/*` más `agentRuntime.id: "codex"` u `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor no repara esto automáticamente porque ambas rutas son válidas:

    - `openai-codex/*` + PI significa "usar la autenticación de OAuth/suscripción de Codex mediante el ejecutor normal de OpenClaw."
    - `openai/*` + `agentRuntime.id: "codex"` significa "ejecutar el turno incrustado mediante el servidor de aplicaciones nativo de Codex."
    - `/codex ...` significa "controlar o vincular una conversación nativa de Codex desde el chat."
    - `/acp ...` o `runtime: "acp"` significa "usar el adaptador externo ACP/acpx."

    Si aparece la advertencia, elige la ruta prevista y edita la configuración manualmente. Mantén la advertencia tal cual cuando OAuth de PI Codex sea intencional.

  </Accordion>
  <Accordion title="2g. Limpieza de ruta de sesión">
    Doctor también examina el almacén de sesiones activas en busca de estado de ruta obsoleto creado automáticamente después de mover el modelo o runtime predeterminado/de reserva configurado fuera de una ruta propiedad de un Plugin, como Codex.

    `openclaw doctor --fix` puede borrar estado obsoleto creado automáticamente, como fijaciones de modelo `modelOverrideSource: "auto"`, metadatos de modelo de runtime, ids de arnés fijados, vinculaciones de sesión de CLI y sobrescrituras automáticas de perfiles de autenticación cuando su ruta propietaria ya no está configurada. Las elecciones explícitas de modelo de usuario o de sesión heredada se informan para revisión manual y se dejan intactas; cámbialas con `/model ...`, `/new` o restablece la sesión cuando esa ruta ya no sea la prevista.

  </Accordion>
  <Accordion title="3. Migraciones de estado heredado (disposición en disco)">
    Doctor puede migrar disposiciones antiguas en disco a la estructura actual:

    - Almacén de sesiones + transcripciones:
      - de `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directorio del agente:
      - de `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticación de WhatsApp (Baileys):
      - de `~/.openclaw/credentials/*.json` heredado (excepto `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (id. de cuenta predeterminado: `default`)

    Estas migraciones son de mejor esfuerzo e idempotentes; doctor emitirá advertencias cuando deje carpetas heredadas como copias de seguridad. El Gateway/CLI también migra automáticamente las sesiones heredadas + el directorio del agente al iniciar, para que el historial/la autenticación/los modelos lleguen a la ruta por agente sin ejecutar doctor manualmente. La autenticación de WhatsApp se migra intencionalmente solo mediante `openclaw doctor`. La normalización de proveedores/mapa de proveedores de conversación ahora compara por igualdad estructural, por lo que las diferencias solo de orden de claves ya no activan cambios `doctor --fix` repetidos sin efecto.

  </Accordion>
  <Accordion title="3a. Migraciones de manifiestos de plugins heredados">
    Doctor analiza todos los manifiestos de plugins instalados en busca de claves de capacidad de nivel superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Cuando las encuentra, ofrece moverlas al objeto `contracts` y reescribir el archivo de manifiesto in situ. Esta migración es idempotente; si la clave `contracts` ya tiene los mismos valores, la clave heredada se elimina sin duplicar los datos.
  </Accordion>
  <Accordion title="3b. Migraciones de almacenes cron heredados">
    Doctor también comprueba el almacén de trabajos cron (`~/.openclaw/cron/jobs.json` de forma predeterminada, o `cron.store` cuando se anula) en busca de formatos de trabajos antiguos que el programador aún acepta por compatibilidad.

    Las limpiezas actuales de Cron incluyen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de carga útil de nivel superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nivel superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de entrega `provider` de carga útil → `delivery.channel` explícito
    - trabajos de reserva de Webhook heredados simples con `notify: true` → `delivery.mode="webhook"` explícito con `delivery.to=cron.webhook`

    doctor solo migra automáticamente los trabajos con `notify: true` cuando puede hacerlo sin cambiar el comportamiento. Si un trabajo combina la reserva de notificación heredada con un modo de entrega existente que no es Webhook, doctor advierte y deja ese trabajo para revisión manual.

    En Linux, doctor también advierte cuando el crontab del usuario todavía invoca el script heredado `~/.openclaw/bin/ensure-whatsapp.sh`. Ese script local del host no está mantenido por el OpenClaw actual y puede escribir mensajes falsos de `Gateway inactive` en `~/.openclaw/logs/whatsapp-health.log` cuando Cron no puede alcanzar el bus de usuario de systemd. Elimina la entrada obsoleta del crontab con `crontab -e`; usa `openclaw channels status --probe`, `openclaw doctor` y `openclaw gateway status` para las comprobaciones de estado actuales.

  </Accordion>
  <Accordion title="3c. Limpieza del bloqueo de sesión">
    Doctor examina cada directorio de sesión de agente en busca de archivos de bloqueo de escritura obsoletos, es decir, archivos que quedaron atrás cuando una sesión terminó de forma anómala. Por cada archivo de bloqueo encontrado, informa: la ruta, el PID, si el PID sigue activo, la antigüedad del bloqueo y si se considera obsoleto (PID muerto o más antiguo que 30 minutos). En modo `--fix` / `--repair`, elimina automáticamente los archivos de bloqueo obsoletos; de lo contrario, imprime una nota y te indica que vuelvas a ejecutarlo con `--fix`.
  </Accordion>
  <Accordion title="3d. Reparación de ramas de transcripción de sesión">
    Doctor examina los archivos JSONL de sesión de agente en busca de la forma de rama duplicada creada por el error de reescritura de transcripciones de prompts de 2026.4.24: un turno de usuario abandonado con contexto interno de runtime de OpenClaw más un hermano activo que contiene el mismo prompt visible del usuario. En modo `--fix` / `--repair`, doctor hace una copia de seguridad de cada archivo afectado junto al original y reescribe la transcripción a la rama activa para que el historial del Gateway y los lectores de memoria ya no vean turnos duplicados.
  </Accordion>
  <Accordion title="4. Comprobaciones de integridad del estado (persistencia de sesión, enrutamiento y seguridad)">
    El directorio de estado es el tronco encefálico operativo. Si desaparece, pierdes sesiones, credenciales, registros y configuración (a menos que tengas copias de seguridad en otro lugar).

    Doctor comprueba:

    - **Falta el directorio de estado**: advierte sobre una pérdida catastrófica del estado, solicita recrear el directorio y te recuerda que no puede recuperar datos faltantes.
    - **Permisos del directorio de estado**: verifica que se pueda escribir; ofrece reparar los permisos (y emite una sugerencia de `chown` cuando se detecta una discrepancia de propietario/grupo).
    - **Directorio de estado sincronizado con la nube en macOS**: advierte cuando el estado se resuelve bajo iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...` porque las rutas respaldadas por sincronización pueden causar E/S más lenta y carreras de bloqueo/sincronización.
    - **Directorio de estado en SD o eMMC en Linux**: advierte cuando el estado se resuelve a una fuente de montaje `mmcblk*`, porque la E/S aleatoria respaldada por SD o eMMC puede ser más lenta y desgastarse más rápido con escrituras de sesiones y credenciales.
    - **Faltan directorios de sesión**: `sessions/` y el directorio de almacenamiento de sesiones son necesarios para persistir el historial y evitar fallos `ENOENT`.
    - **Discrepancia de transcripción**: advierte cuando entradas de sesión recientes tienen archivos de transcripción faltantes.
    - **Sesión principal "JSONL de 1 línea"**: marca cuando la transcripción principal solo tiene una línea (el historial no se está acumulando).
    - **Varios directorios de estado**: advierte cuando existen varias carpetas `~/.openclaw` en distintos directorios personales o cuando `OPENCLAW_STATE_DIR` apunta a otro lugar (el historial puede dividirse entre instalaciones).
    - **Recordatorio de modo remoto**: si `gateway.mode=remote`, doctor te recuerda ejecutarlo en el host remoto (el estado vive allí).
    - **Permisos del archivo de configuración**: advierte si `~/.openclaw/openclaw.json` es legible por el grupo o por todos y ofrece endurecerlo a `600`.

  </Accordion>
  <Accordion title="5. Estado de autenticación de modelos (caducidad de OAuth)">
    Doctor inspecciona los perfiles OAuth en el almacén de autenticación, advierte cuando los tokens están por caducar o han caducado, y puede actualizarlos cuando es seguro. Si el perfil OAuth/token de Anthropic está obsoleto, sugiere una clave API de Anthropic o la ruta de token de configuración de Anthropic. Las solicitudes de actualización solo aparecen cuando se ejecuta de forma interactiva (TTY); `--non-interactive` omite los intentos de actualización.

    Cuando una actualización OAuth falla de forma permanente (por ejemplo `refresh_token_reused`, `invalid_grant` o un proveedor que te indica iniciar sesión de nuevo), doctor informa que se requiere volver a autenticarse e imprime el comando exacto `openclaw models auth login --provider ...` que se debe ejecutar.

    Doctor también informa perfiles de autenticación temporalmente inutilizables debido a:

    - enfriamientos cortos (límites de tasa/tiempos de espera/fallos de autenticación)
    - deshabilitaciones más largas (fallos de facturación/crédito)

  </Accordion>
  <Accordion title="6. Validación del modelo de hooks">
    Si `hooks.gmail.model` está configurado, doctor valida la referencia del modelo contra el catálogo y la lista de permitidos, y advierte cuando no se resolverá o no está permitido.
  </Accordion>
  <Accordion title="7. Reparación de imagen de sandbox">
    Cuando el sandboxing está habilitado, doctor comprueba las imágenes de Docker y ofrece construirlas o cambiar a nombres heredados si falta la imagen actual.
  </Accordion>
  <Accordion title="7b. Limpieza de instalación de plugins">
    Doctor elimina el estado heredado de preparación de dependencias de plugins generado por OpenClaw en modo `openclaw doctor --fix` / `openclaw doctor --repair`. Esto cubre raíces de dependencias generadas obsoletas, directorios antiguos de etapa de instalación, residuos locales de paquetes de código anterior de reparación de dependencias de plugins incluidos, y copias npm gestionadas huérfanas o recuperadas de plugins `@openclaw/*` incluidos que pueden eclipsar el manifiesto incluido actual.

    Doctor también puede reinstalar plugins descargables faltantes cuando la configuración los referencia pero el registro local de plugins no puede encontrarlos. Los ejemplos incluyen `plugins.entries` materiales, configuraciones configuradas de canal/proveedor/búsqueda y runtimes de agente configurados. Durante las actualizaciones de paquetes, doctor evita ejecutar la reparación de plugins con el gestor de paquetes mientras se sustituye el paquete central; ejecuta `openclaw doctor --fix` de nuevo después de la actualización si un plugin configurado aún necesita recuperación. El inicio del Gateway y la recarga de configuración no ejecutan gestores de paquetes; las instalaciones de plugins siguen siendo trabajo explícito de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migraciones del servicio Gateway y sugerencias de limpieza">
    Doctor detecta servicios gateway heredados (launchd/systemd/schtasks) y ofrece eliminarlos e instalar el servicio OpenClaw usando el puerto de gateway actual. También puede buscar servicios adicionales similares a gateway e imprimir sugerencias de limpieza. Los servicios Gateway de OpenClaw con nombre de perfil se consideran de primera clase y no se marcan como "extra".

    En Linux, si falta el servicio Gateway de nivel de usuario pero existe un servicio Gateway de OpenClaw de nivel de sistema, doctor no instala automáticamente un segundo servicio de nivel de usuario. Inspecciona con `openclaw gateway status --deep` o `openclaw doctor --deep`; luego elimina el duplicado o configura `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando un supervisor de sistema controla el ciclo de vida del gateway.

  </Accordion>
  <Accordion title="8b. Migración de inicio de Matrix">
    Cuando una cuenta de canal de Matrix tiene una migración de estado heredado pendiente o accionable, doctor (en modo `--fix` / `--repair`) crea una instantánea previa a la migración y luego ejecuta los pasos de migración de mejor esfuerzo: migración de estado heredado de Matrix y preparación de estado cifrado heredado. Ambos pasos no son fatales; los errores se registran y el inicio continúa. En modo de solo lectura (`openclaw doctor` sin `--fix`), esta comprobación se omite por completo.
  </Accordion>
  <Accordion title="8c. Emparejamiento de dispositivos y deriva de autenticación">
    Doctor ahora inspecciona el estado de emparejamiento de dispositivos como parte de la pasada de salud normal.

    Lo que informa:

    - solicitudes pendientes de emparejamiento por primera vez
    - actualizaciones de rol pendientes para dispositivos ya emparejados
    - actualizaciones de alcance pendientes para dispositivos ya emparejados
    - reparaciones de discrepancia de clave pública donde el id del dispositivo aún coincide pero la identidad del dispositivo ya no coincide con el registro aprobado
    - registros emparejados sin un token activo para un rol aprobado
    - tokens emparejados cuyos alcances se desvían fuera de la línea base de emparejamiento aprobada
    - entradas locales en caché de token de dispositivo para la máquina actual que son anteriores a una rotación de token del lado del gateway o que llevan metadatos de alcance obsoletos

    Doctor no aprueba automáticamente solicitudes de emparejamiento ni rota automáticamente tokens de dispositivo. En su lugar, imprime los siguientes pasos exactos:

    - inspeccionar solicitudes pendientes con `openclaw devices list`
    - aprobar la solicitud exacta con `openclaw devices approve <requestId>`
    - rotar un token nuevo con `openclaw devices rotate --device <deviceId> --role <role>`
    - eliminar y volver a aprobar un registro obsoleto con `openclaw devices remove <deviceId>`

    Esto cierra el hueco común de "ya emparejado pero aún aparece emparejamiento requerido": doctor ahora distingue el emparejamiento por primera vez de las actualizaciones pendientes de rol/alcance y de la deriva de token/identidad de dispositivo obsoleta.

  </Accordion>
  <Accordion title="9. Advertencias de seguridad">
    Doctor emite advertencias cuando un proveedor está abierto a mensajes directos sin una lista de permitidos, o cuando una política está configurada de forma peligrosa.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Si se ejecuta como servicio de usuario de systemd, doctor se asegura de que linger esté habilitado para que el gateway permanezca activo después de cerrar sesión.
  </Accordion>
  <Accordion title="11. Estado del espacio de trabajo (Skills, plugins y directorios heredados)">
    Doctor imprime un resumen del estado del espacio de trabajo para el agente predeterminado:

    - **Estado de Skills**: cuenta las skills elegibles, con requisitos faltantes y bloqueadas por la lista de permitidos.
    - **Directorios de espacio de trabajo heredados**: advierte cuando `~/openclaw` u otros directorios de espacio de trabajo heredados existen junto al espacio de trabajo actual.
    - **Estado de Plugin**: cuenta plugins habilitados/deshabilitados/con errores; enumera IDs de plugins para cualquier error; informa las capacidades de plugins incluidos.
    - **Advertencias de compatibilidad de Plugin**: marca plugins que tienen problemas de compatibilidad con el runtime actual.
    - **Diagnósticos de Plugin**: muestra cualquier advertencia o error de tiempo de carga emitido por el registro de plugins.

  </Accordion>
  <Accordion title="11b. Tamaño del archivo de arranque">
    Doctor comprueba si los archivos de arranque del espacio de trabajo (por ejemplo `AGENTS.md`, `CLAUDE.md` u otros archivos de contexto inyectados) están cerca o por encima del presupuesto de caracteres configurado. Informa recuentos de caracteres sin procesar frente a inyectados por archivo, porcentaje de truncamiento, causa del truncamiento (`max/file` o `max/total`) y caracteres inyectados totales como fracción del presupuesto total. Cuando los archivos se truncan o están cerca del límite, doctor imprime consejos para ajustar `agents.defaults.bootstrapMaxChars` y `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpieza de Plugin de canal obsoleto">
    Cuando `openclaw doctor --fix` elimina un Plugin de canal faltante, también elimina la configuración colgante de alcance de canal que hacía referencia a ese Plugin: entradas `channels.<id>`, objetivos de Heartbeat que nombraban el canal y anulaciones `agents.*.models["<channel>/*"]`. Esto evita bucles de arranque del Gateway donde el runtime del canal ya no existe pero la configuración aún pide al gateway enlazarse a él.
  </Accordion>
  <Accordion title="11c. Autocompletado de shell">
    Doctor comprueba si el autocompletado con tabulador está instalado para el shell actual (zsh, bash, fish o PowerShell):

    - Si el perfil de shell usa un patrón de autocompletado dinámico lento (`source <(openclaw completion ...)`), doctor lo actualiza a la variante de archivo en caché más rápida.
    - Si el autocompletado está configurado en el perfil pero falta el archivo de caché, doctor regenera la caché automáticamente.
    - Si no hay ningún autocompletado configurado, doctor solicita instalarlo (solo en modo interactivo; se omite con `--non-interactive`).

    Ejecuta `openclaw completion --write-state` para regenerar la caché manualmente.

  </Accordion>
  <Accordion title="12. Comprobaciones de autenticación del Gateway (token local)">
    Doctor comprueba la preparación de autenticación con token local del Gateway.

    - Si el modo de token necesita un token y no existe ninguna fuente de token, doctor ofrece generar uno.
    - Si `gateway.auth.token` está gestionado por SecretRef pero no está disponible, doctor advierte y no lo sobrescribe con texto plano.
    - `openclaw doctor --generate-gateway-token` fuerza la generación solo cuando no hay configurado ningún SecretRef de token.

  </Accordion>
  <Accordion title="12b. Reparaciones de solo lectura conscientes de SecretRef">
    Algunos flujos de reparación necesitan inspeccionar credenciales configuradas sin debilitar el comportamiento de fallo rápido del runtime.

    - `openclaw doctor --fix` ahora usa el mismo modelo de resumen SecretRef de solo lectura que los comandos de la familia de estado para reparaciones de configuración específicas.
    - Ejemplo: la reparación de Telegram `allowFrom` / `groupAllowFrom` `@username` intenta usar las credenciales de bot configuradas cuando están disponibles.
    - Si el token del bot de Telegram está configurado mediante SecretRef pero no está disponible en la ruta del comando actual, doctor informa que la credencial está configurada pero no disponible, y omite la resolución automática en lugar de bloquearse o informar erróneamente que falta el token.

  </Accordion>
  <Accordion title="13. Comprobación de estado de Gateway + reinicio">
    Doctor ejecuta una comprobación de estado y ofrece reiniciar el Gateway cuando parece estar en mal estado.
  </Accordion>
  <Accordion title="13b. Preparación de la búsqueda en memoria">
    Doctor comprueba si el proveedor de embeddings de búsqueda en memoria configurado está listo para el agente predeterminado. El comportamiento depende del backend y del proveedor configurados:

    - **Backend QMD**: sondea si el binario `qmd` está disponible y se puede iniciar. Si no, imprime orientación de corrección que incluye el paquete npm y una opción de ruta manual al binario.
    - **Proveedor local explícito**: comprueba si existe un archivo de modelo local o una URL reconocida de modelo remoto/descargable. Si falta, sugiere cambiar a un proveedor remoto.
    - **Proveedor remoto explícito** (`openai`, `voyage`, etc.): verifica que haya una clave de API presente en el entorno o en el almacén de autenticación. Imprime sugerencias de corrección accionables si falta.
    - **Proveedor automático**: comprueba primero la disponibilidad del modelo local y luego prueba cada proveedor remoto en el orden de selección automática.

    Cuando hay disponible un resultado de sondeo de Gateway en caché (el Gateway estaba en buen estado en el momento de la comprobación), doctor coteja su resultado con la configuración visible para la CLI y señala cualquier discrepancia. Doctor no inicia un nuevo ping de embeddings en la ruta predeterminada; usa el comando de estado profundo de memoria cuando quieras una comprobación en vivo del proveedor.

    Usa `openclaw memory status --deep` para verificar la preparación de embeddings en tiempo de ejecución.

  </Accordion>
  <Accordion title="14. Advertencias de estado de canales">
    Si el Gateway está en buen estado, doctor ejecuta un sondeo de estado de canales e informa advertencias con correcciones sugeridas.
  </Accordion>
  <Accordion title="15. Auditoría y reparación de configuración del supervisor">
    Doctor comprueba la configuración del supervisor instalada (launchd/systemd/schtasks) en busca de valores predeterminados ausentes u obsoletos (por ejemplo, dependencias systemd de network-online y demora de reinicio). Cuando encuentra una discrepancia, recomienda una actualización y puede reescribir el archivo de servicio/tarea con los valores predeterminados actuales.

    Notas:

    - `openclaw doctor` solicita confirmación antes de reescribir la configuración del supervisor.
    - `openclaw doctor --yes` acepta las solicitudes de reparación predeterminadas.
    - `openclaw doctor --repair` aplica las correcciones recomendadas sin solicitudes de confirmación.
    - `openclaw doctor --repair --force` sobrescribe configuraciones personalizadas del supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene a doctor en modo de solo lectura para el ciclo de vida del servicio Gateway. Aun así informa el estado del servicio y ejecuta reparaciones no relacionadas con el servicio, pero omite la instalación/inicio/reinicio/bootstrap del servicio, las reescrituras de configuración del supervisor y la limpieza de servicios heredados porque un supervisor externo posee ese ciclo de vida.
    - En Linux, doctor no reescribe los metadatos de comando/punto de entrada mientras la unidad systemd de Gateway correspondiente está activa. También ignora unidades adicionales inactivas no heredadas parecidas a Gateway durante el escaneo de servicios duplicados para que los archivos de servicios complementarios no generen ruido de limpieza.
    - Si la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación/reparación del servicio de doctor valida el SecretRef, pero no persiste valores de token resueltos en texto plano en los metadatos de entorno del servicio supervisor.
    - Doctor detecta valores de entorno de servicio gestionados con respaldo de `.env`/SecretRef que instalaciones antiguas de LaunchAgent, systemd o Tarea programada de Windows incrustaron inline, y reescribe los metadatos del servicio para que esos valores se carguen desde la fuente de ejecución en lugar de la definición del supervisor.
    - Doctor detecta cuando el comando del servicio aún fija un `--port` antiguo después de cambios en `gateway.port` y reescribe los metadatos del servicio al puerto actual.
    - Si la autenticación por token requiere un token y el SecretRef de token configurado no está resuelto, doctor bloquea la ruta de instalación/reparación con orientación accionable.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, doctor bloquea la instalación/reparación hasta que el modo se defina explícitamente.
    - Para unidades user-systemd de Linux, las comprobaciones de desviación de token de doctor ahora incluyen tanto las fuentes `Environment=` como `EnvironmentFile=` al comparar los metadatos de autenticación del servicio.
    - Las reparaciones de servicio de doctor se niegan a reescribir, detener o reiniciar un servicio Gateway desde un binario de OpenClaw antiguo cuando la configuración fue escrita por última vez por una versión más nueva. Consulta [Solución de problemas de Gateway](/es/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Siempre puedes forzar una reescritura completa mediante `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos de tiempo de ejecución + puerto de Gateway">
    Doctor inspecciona el tiempo de ejecución del servicio (PID, último estado de salida) y advierte cuando el servicio está instalado pero no se está ejecutando realmente. También comprueba colisiones de puerto en el puerto de Gateway (predeterminado `18789`) e informa las causas probables (Gateway ya en ejecución, túnel SSH).
  </Accordion>
  <Accordion title="17. Buenas prácticas de tiempo de ejecución de Gateway">
    Doctor advierte cuando el servicio Gateway se ejecuta en Bun o en una ruta de Node gestionada por versiones (`nvm`, `fnm`, `volta`, `asdf`, etc.). Los canales de WhatsApp + Telegram requieren Node, y las rutas de gestores de versiones pueden romperse después de actualizaciones porque el servicio no carga la inicialización de tu shell. Doctor ofrece migrar a una instalación de Node del sistema cuando esté disponible (Homebrew/apt/choco).

    Los LaunchAgents de macOS recién instalados o reparados usan un PATH canónico del sistema (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) en lugar de copiar el PATH del shell interactivo, por lo que Volta, asdf, fnm, pnpm y otros directorios de gestores de versiones no cambian qué procesos hijos de Node se resuelven. Los servicios de Linux aún conservan raíces de entorno explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) y directorios user-bin estables, pero los directorios alternativos inferidos de gestores de versiones solo se escriben en el PATH del servicio cuando esos directorios existen en disco.

  </Accordion>
  <Accordion title="18. Escritura de configuración + metadatos del asistente">
    Doctor persiste cualquier cambio de configuración y marca metadatos del asistente para registrar la ejecución de doctor.
  </Accordion>
  <Accordion title="19. Consejos de espacio de trabajo (copia de seguridad + sistema de memoria)">
    Doctor sugiere un sistema de memoria de espacio de trabajo cuando falta, e imprime un consejo de copia de seguridad si el espacio de trabajo aún no está bajo git.

    Consulta [/concepts/agent-workspace](/es/concepts/agent-workspace) para obtener una guía completa sobre la estructura del espacio de trabajo y la copia de seguridad con git (se recomienda GitHub o GitLab privado).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Runbook de Gateway](/es/gateway)
- [Solución de problemas de Gateway](/es/gateway/troubleshooting)
