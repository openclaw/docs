---
read_when:
    - Añadir o modificar migraciones de doctor
    - Introducir cambios de configuración incompatibles
sidebarTitle: Doctor
summary: 'Comando doctor: comprobaciones de estado, migraciones de configuración y pasos de reparación'
title: Doctor
x-i18n:
    generated_at: "2026-04-26T11:28:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 592a9f886e0e6dcbfeb41a09c765ab289f3ed16ed360be37ff9fbefba920754f
    source_path: gateway/doctor.md
    workflow: 15
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

    Se ejecuta sin preguntas y solo aplica migraciones seguras (normalización de configuración + movimientos de estado en disco). Omite acciones de reinicio/servicio/sandbox que requieren confirmación humana. Las migraciones de estado heredado se ejecutan automáticamente cuando se detectan.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Escanea servicios del sistema en busca de instalaciones adicionales del gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Si quieres revisar los cambios antes de escribirlos, abre primero el archivo de configuración:

```bash
cat ~/.openclaw/openclaw.json
```

## Qué hace (resumen)

<AccordionGroup>
  <Accordion title="Estado, UI y actualizaciones">
    - Actualización previa opcional para instalaciones git (solo interactivo).
    - Comprobación de actualización del protocolo de UI (recompila la UI de Control cuando el esquema del protocolo es más reciente).
    - Comprobación de estado + aviso para reiniciar.
    - Resumen del estado de Skills (elegibles/faltantes/bloqueadas) y estado de Plugins.
  </Accordion>
  <Accordion title="Configuración y migraciones">
    - Normalización de configuración para valores heredados.
    - Migración de configuración de Talk desde campos planos heredados `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Comprobaciones de migración del navegador para configuraciones heredadas de la extensión de Chrome y preparación de Chrome MCP.
    - Advertencias de sobrescritura del proveedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Advertencias de shadowing de OAuth de Codex (`models.providers.openai-codex`).
    - Comprobación de requisitos previos de TLS para OAuth para perfiles OAuth de OpenAI Codex.
    - Migración heredada de estado en disco (sesiones/directorio del agente/autenticación de WhatsApp).
    - Migración heredada de claves de contrato de manifiesto de Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migración heredada del almacenamiento de Cron (`jobId`, `schedule.cron`, campos delivery/payload de nivel superior, `provider` en payload, trabajos simples de fallback de Webhook con `notify: true`).
    - Migración heredada de política de runtime del agente a `agents.defaults.agentRuntime` y `agents.list[].agentRuntime`.
  </Accordion>
  <Accordion title="Estado e integridad">
    - Inspección de archivos de bloqueo de sesión y limpieza de bloqueos obsoletos.
    - Reparación de transcripciones de sesión para ramas duplicadas de reescritura de prompts creadas por compilaciones afectadas de 2026.4.24.
    - Comprobaciones de integridad y permisos del estado (sesiones, transcripciones, directorio de estado).
    - Comprobaciones de permisos del archivo de configuración (chmod 600) al ejecutarse localmente.
    - Estado de autenticación de modelos: comprueba vencimiento de OAuth, puede refrescar tokens próximos a vencer e informa estados de cooldown/deshabilitado de perfiles de autenticación.
    - Detección de directorio de espacio de trabajo adicional (`~/openclaw`).
  </Accordion>
  <Accordion title="Gateway, servicios y supervisores">
    - Reparación de imagen de sandbox cuando el sandboxing está habilitado.
    - Migración de servicio heredado y detección de gateways adicionales.
    - Migración de estado heredado del canal Matrix (en modo `--fix` / `--repair`).
    - Comprobaciones de runtime del Gateway (servicio instalado pero no en ejecución; etiqueta launchd en caché).
    - Advertencias de estado del canal (sondeadas desde el gateway en ejecución).
    - Auditoría de configuración del supervisor (launchd/systemd/schtasks) con reparación opcional.
    - Comprobaciones de buenas prácticas del runtime del Gateway (Node frente a Bun, rutas de administradores de versión).
    - Diagnósticos de colisión de puertos del Gateway (predeterminado `18789`).
  </Accordion>
  <Accordion title="Autenticación, seguridad y emparejamiento">
    - Advertencias de seguridad para políticas abiertas de mensajes directos.
    - Comprobaciones de autenticación del Gateway para modo de token local (ofrece generar token cuando no existe ninguna fuente de token; no sobrescribe configuraciones SecretRef de token).
    - Detección de problemas de emparejamiento de dispositivos (primeras solicitudes de emparejamiento pendientes, actualizaciones pendientes de rol/ámbito, deriva obsoleta de la caché local de token de dispositivo y deriva de autenticación de registros emparejados).
  </Accordion>
  <Accordion title="Espacio de trabajo y shell">
    - Comprobación de `linger` de systemd en Linux.
    - Comprobación del tamaño de archivos de bootstrap del espacio de trabajo (advertencias de truncamiento/casi límite para archivos de contexto).
    - Comprobación de estado de autocompletado del shell e instalación/actualización automática.
    - Comprobación de preparación del proveedor de embeddings para búsqueda de memoria (modelo local, clave de API remota o binario QMD).
    - Comprobaciones de instalación desde código fuente (desajuste del espacio de trabajo pnpm, recursos UI faltantes, binario tsx faltante).
    - Escribe configuración actualizada + metadatos del asistente.
  </Accordion>
</AccordionGroup>

## Relleno y restablecimiento de la UI de Dreams

La escena Dreams de la UI de Control incluye acciones de **Backfill**, **Reset** y **Clear Grounded** para el flujo de Dreaming fundamentado. Estas acciones usan métodos RPC de estilo doctor del gateway, pero **no** forman parte de la reparación/migración de la CLI `openclaw doctor`.

Qué hacen:

- **Backfill** escanea archivos históricos `memory/YYYY-MM-DD.md` en el espacio de trabajo activo, ejecuta el pase de diario REM fundamentado y escribe entradas reversibles de relleno en `DREAMS.md`.
- **Reset** elimina de `DREAMS.md` solo esas entradas de diario de relleno marcadas.
- **Clear Grounded** elimina solo entradas temporales fundamentadas preparadas que provinieron de reproducción histórica y que todavía no han acumulado recuperación en vivo o soporte diario.

Qué **no** hacen por sí solas:

- no editan `MEMORY.md`
- no ejecutan migraciones completas de doctor
- no preparan automáticamente candidatos fundamentados en el almacenamiento de promoción temporal en vivo a menos que ejecutes explícitamente primero la ruta de CLI preparada

Si quieres que la reproducción histórica fundamentada influya en la ruta normal de promoción profunda, usa en su lugar el flujo de CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Eso prepara candidatos duraderos fundamentados en el almacenamiento temporal de Dreaming mientras mantiene `DREAMS.md` como superficie de revisión.

## Comportamiento detallado y justificación

<AccordionGroup>
  <Accordion title="0. Actualización opcional (instalaciones git)">
    Si se trata de un checkout git y doctor se ejecuta de forma interactiva, ofrece actualizar (fetch/rebase/build) antes de ejecutar doctor.
  </Accordion>
  <Accordion title="1. Normalización de configuración">
    Si la configuración contiene estructuras de valores heredados (por ejemplo `messages.ackReaction` sin una sobrescritura específica del canal), doctor las normaliza al esquema actual.

    Eso incluye campos planos heredados de Talk. La configuración pública actual de Talk es `talk.provider` + `talk.providers.<provider>`. Doctor reescribe las estructuras antiguas `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` al mapa de proveedor.

  </Accordion>
  <Accordion title="2. Migraciones de claves de configuración heredadas">
    Cuando la configuración contiene claves obsoletas, otros comandos se niegan a ejecutarse y te piden que ejecutes `openclaw doctor`.

    Doctor hará lo siguiente:

    - Explicar qué claves heredadas se encontraron.
    - Mostrar la migración que aplicó.
    - Reescribir `~/.openclaw/openclaw.json` con el esquema actualizado.

    El Gateway también ejecuta automáticamente migraciones de doctor al iniciarse cuando detecta un formato de configuración heredado, de modo que las configuraciones obsoletas se reparan sin intervención manual. Las migraciones del almacenamiento de trabajos Cron son gestionadas por `openclaw doctor --fix`.

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
    - Para canales con `accounts` con nombre pero con valores de canal de cuenta única persistentes en el nivel superior, mover esos valores con ámbito de cuenta a la cuenta promovida elegida para ese canal (`accounts.default` para la mayoría de canales; Matrix puede conservar un destino coincidente con nombre/predeterminado existente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - eliminar `browser.relayBindHost` (ajuste heredado de relay de la extensión)

    Las advertencias de doctor también incluyen orientación sobre cuentas predeterminadas para canales multicuenta:

    - Si hay dos o más entradas `channels.<channel>.accounts` configuradas sin `channels.<channel>.defaultAccount` o `accounts.default`, doctor advierte que el enrutamiento de fallback puede elegir una cuenta inesperada.
    - Si `channels.<channel>.defaultAccount` está establecido en un ID de cuenta desconocido, doctor advierte y enumera los IDs de cuenta configurados.

  </Accordion>
  <Accordion title="2b. Sobrescrituras del proveedor OpenCode">
    Si has añadido manualmente `models.providers.opencode`, `opencode-zen` u `opencode-go`, eso sobrescribe el catálogo OpenCode integrado de `@mariozechner/pi-ai`. Eso puede forzar modelos a la API incorrecta o poner los costos a cero. Doctor advierte para que puedas eliminar la sobrescritura y restaurar el enrutamiento + costos por API y por modelo.
  </Accordion>
  <Accordion title="2c. Migración del navegador y preparación de Chrome MCP">
    Si tu configuración del navegador todavía apunta a la ruta eliminada de la extensión de Chrome, doctor la normaliza al modelo actual de conexión local del host de Chrome MCP:

    - `browser.profiles.*.driver: "extension"` pasa a `"existing-session"`
    - se elimina `browser.relayBindHost`

    Doctor también audita la ruta local del host para Chrome MCP cuando usas `defaultProfile: "user"` o un perfil `existing-session` configurado:

    - comprueba si Google Chrome está instalado en el mismo host para los perfiles predeterminados de conexión automática
    - comprueba la versión detectada de Chrome y avisa cuando es inferior a Chrome 144
    - te recuerda habilitar la depuración remota en la página de inspección del navegador (por ejemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor no puede habilitar por ti la configuración del lado de Chrome. Chrome MCP local del host sigue requiriendo:

    - un navegador basado en Chromium 144+ en el host del gateway/nodo
    - el navegador ejecutándose localmente
    - depuración remota habilitada en ese navegador
    - aprobar el primer aviso de consentimiento de conexión en el navegador

    La preparación aquí se refiere solo a los requisitos previos de conexión local. Existing-session mantiene los límites actuales de ruta de Chrome MCP; las rutas avanzadas como `responsebody`, exportación PDF, interceptación de descargas y acciones por lotes siguen requiriendo un navegador gestionado o un perfil CDP sin procesar.

    Esta comprobación **no** se aplica a flujos de Docker, sandbox, navegador remoto u otros flujos sin interfaz. Esos siguen usando CDP sin procesar.

  </Accordion>
  <Accordion title="2d. Requisitos previos de TLS para OAuth">
    Cuando se configura un perfil OAuth de OpenAI Codex, doctor sondea el endpoint de autorización de OpenAI para verificar que la pila TLS local de Node/OpenSSL puede validar la cadena de certificados. Si el sondeo falla con un error de certificado (por ejemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado vencido o certificado autofirmado), doctor muestra instrucciones de corrección específicas para la plataforma. En macOS con un Node de Homebrew, la corrección suele ser `brew postinstall ca-certificates`. Con `--deep`, el sondeo se ejecuta incluso si el gateway está en buen estado.
  </Accordion>
  <Accordion title="2e. Sobrescrituras del proveedor OAuth de Codex">
    Si añadiste anteriormente ajustes heredados de transporte OpenAI bajo `models.providers.openai-codex`, pueden hacer shadowing sobre la ruta integrada del proveedor OAuth de Codex que las versiones más recientes usan automáticamente. Doctor avisa cuando ve esos ajustes heredados de transporte junto con OAuth de Codex para que puedas eliminar o reescribir la sobrescritura de transporte obsoleta y recuperar el comportamiento integrado de enrutamiento/fallback. Los proxies personalizados y las sobrescrituras solo de encabezados siguen siendo compatibles y no activan esta advertencia.
  </Accordion>
  <Accordion title="2f. Advertencias de rutas del Plugin de Codex">
    Cuando el Plugin de Codex incluido está habilitado, doctor también comprueba si las referencias de modelo principal `openai-codex/*` siguen resolviéndose a través del ejecutor PI predeterminado. Esa combinación es válida cuando quieres autenticación OAuth/suscripción de Codex a través de PI, pero es fácil confundirla con el arnés nativo app-server de Codex. Doctor avisa y apunta a la forma explícita de app-server: `openai/*` más `agentRuntime.id: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor no lo repara automáticamente porque ambas rutas son válidas:

    - `openai-codex/*` + PI significa "usar autenticación OAuth/suscripción de Codex a través del ejecutor normal de OpenClaw."
    - `openai/*` + `runtime: "codex"` significa "ejecutar el turno integrado mediante app-server nativo de Codex."
    - `/codex ...` significa "controlar o vincular una conversación nativa de Codex desde el chat."
    - `/acp ...` o `runtime: "acp"` significa "usar el adaptador externo ACP/acpx."

    Si aparece la advertencia, elige la ruta que pretendías usar y edita la configuración manualmente. Mantén la advertencia tal cual cuando PI Codex OAuth sea intencional.

  </Accordion>
  <Accordion title="3. Migraciones de estado heredado (estructura en disco)">
    Doctor puede migrar estructuras antiguas en disco a la estructura actual:

    - Almacenamiento de sesiones + transcripciones:
      - de `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directorio del agente:
      - de `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticación de WhatsApp (Baileys):
      - desde `~/.openclaw/credentials/*.json` heredado (excepto `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (id de cuenta predeterminado: `default`)

    Estas migraciones son de mejor esfuerzo e idempotentes; doctor emitirá advertencias cuando deje carpetas heredadas como copias de seguridad. Gateway/CLI también migra automáticamente las sesiones heredadas + el directorio del agente al iniciar, para que el historial/autenticación/modelos terminen en la ruta por agente sin necesidad de ejecutar doctor manualmente. La autenticación de WhatsApp se migra intencionadamente solo mediante `openclaw doctor`. La normalización de Talk provider/provider-map ahora compara por igualdad estructural, de modo que las diferencias solo en el orden de las claves ya no activan cambios repetidos sin efecto de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migraciones heredadas del manifiesto de Plugin">
    Doctor examina todos los manifiestos de Plugins instalados en busca de claves obsoletas de capacidades de nivel superior (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Cuando las encuentra, ofrece moverlas al objeto `contracts` y reescribir el archivo del manifiesto en su lugar. Esta migración es idempotente; si la clave `contracts` ya tiene los mismos valores, la clave heredada se elimina sin duplicar los datos.
  </Accordion>
  <Accordion title="3b. Migraciones heredadas del almacenamiento de Cron">
    Doctor también comprueba el almacenamiento de trabajos de Cron (`~/.openclaw/cron/jobs.json` de forma predeterminada, o `cron.store` cuando se sobrescribe) en busca de formatos antiguos de trabajos que el programador sigue aceptando por compatibilidad.

    Las limpiezas actuales de Cron incluyen:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de payload de nivel superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nivel superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias de entrega `provider` en payload → `delivery.channel` explícito
    - trabajos heredados simples de fallback de Webhook `notify: true` → `delivery.mode="webhook"` explícito con `delivery.to=cron.webhook`

    Doctor solo migra automáticamente los trabajos `notify: true` cuando puede hacerlo sin cambiar el comportamiento. Si un trabajo combina fallback heredado de notificación con un modo de entrega no Webhook ya existente, doctor avisa y deja ese trabajo para revisión manual.

  </Accordion>
  <Accordion title="3c. Limpieza de bloqueos de sesión">
    Doctor examina cada directorio de sesiones del agente en busca de archivos obsoletos de bloqueo de escritura, archivos que quedaron cuando una sesión terminó de forma anómala. Para cada archivo de bloqueo encontrado informa: la ruta, PID, si el PID sigue activo, antigüedad del bloqueo y si se considera obsoleto (PID muerto o más de 30 minutos). En modo `--fix` / `--repair`, elimina automáticamente los archivos de bloqueo obsoletos; en caso contrario imprime una nota y te indica que vuelvas a ejecutar con `--fix`.
  </Accordion>
  <Accordion title="3d. Reparación de ramas de transcripción de sesión">
    Doctor examina archivos JSONL de sesiones del agente en busca de la forma de rama duplicada creada por el bug de reescritura de transcripciones de prompts de 2026.4.24: un turno de usuario abandonado con contexto interno de runtime de OpenClaw más un hermano activo que contiene el mismo prompt visible del usuario. En modo `--fix` / `--repair`, doctor hace una copia de seguridad de cada archivo afectado junto al original y reescribe la transcripción a la rama activa para que el historial del gateway y los lectores de memoria ya no vean turnos duplicados.
  </Accordion>
  <Accordion title="4. Comprobaciones de integridad del estado (persistencia de sesión, enrutamiento y seguridad)">
    El directorio de estado es el tronco encefálico operativo. Si desaparece, pierdes sesiones, credenciales, registros y configuración (salvo que tengas copias de seguridad en otro lugar).

    Doctor comprueba:

    - **Falta el directorio de estado**: avisa sobre pérdida catastrófica de estado, propone recrear el directorio y te recuerda que no puede recuperar datos faltantes.
    - **Permisos del directorio de estado**: verifica que se pueda escribir; ofrece reparar permisos (y emite una indicación de `chown` cuando detecta discrepancia de propietario/grupo).
    - **Directorio de estado sincronizado en la nube en macOS**: avisa cuando el estado se resuelve bajo iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...` porque las rutas respaldadas por sincronización pueden causar E/S más lenta y carreras de bloqueo/sincronización.
    - **Directorio de estado en SD o eMMC en Linux**: avisa cuando el estado se resuelve a una fuente de montaje `mmcblk*`, porque la E/S aleatoria respaldada por SD o eMMC puede ser más lenta y desgastarse más con escrituras de sesión y credenciales.
    - **Faltan directorios de sesión**: `sessions/` y el directorio de almacenamiento de sesiones son necesarios para persistir el historial y evitar errores `ENOENT`.
    - **Desajuste de transcripciones**: avisa cuando las entradas recientes de sesión tienen archivos de transcripción faltantes.
    - **Sesión principal "JSONL de 1 línea"**: marca cuando la transcripción principal solo tiene una línea (el historial no se está acumulando).
    - **Varios directorios de estado**: avisa cuando existen varias carpetas `~/.openclaw` en distintos directorios personales o cuando `OPENCLAW_STATE_DIR` apunta a otro lugar (el historial puede dividirse entre instalaciones).
    - **Recordatorio de modo remoto**: si `gateway.mode=remote`, doctor te recuerda que debes ejecutarlo en el host remoto (el estado vive allí).
    - **Permisos del archivo de configuración**: avisa si `~/.openclaw/openclaw.json` puede ser leído por grupo/mundo y ofrece restringirlo a `600`.

  </Accordion>
  <Accordion title="5. Estado de autenticación del modelo (vencimiento de OAuth)">
    Doctor inspecciona perfiles OAuth en el almacenamiento de autenticación, avisa cuando los tokens están por vencer o vencidos, y puede refrescarlos cuando es seguro. Si el perfil OAuth/token de Anthropic está obsoleto, sugiere una clave de API de Anthropic o la ruta de setup-token de Anthropic. Los avisos de refresco solo aparecen cuando se ejecuta de forma interactiva (TTY); `--non-interactive` omite intentos de refresco.

    Cuando un refresco OAuth falla de forma permanente (por ejemplo `refresh_token_reused`, `invalid_grant` o un proveedor te indica que vuelvas a iniciar sesión), doctor informa de que se requiere nueva autenticación y muestra el comando exacto `openclaw models auth login --provider ...` que debes ejecutar.

    Doctor también informa de perfiles de autenticación que son temporalmente inutilizables debido a:

    - cooldowns cortos (límites de tasa/tiempos de espera/fallos de autenticación)
    - deshabilitaciones más largas (fallos de facturación/crédito)

  </Accordion>
  <Accordion title="6. Validación del modelo de hooks">
    Si `hooks.gmail.model` está configurado, doctor valida la referencia de modelo frente al catálogo y la lista permitida, y avisa cuando no se resolverá o no esté permitido.
  </Accordion>
  <Accordion title="7. Reparación de imagen de sandbox">
    Cuando el sandboxing está habilitado, doctor comprueba las imágenes Docker y ofrece compilar o cambiar a nombres heredados si la imagen actual falta.
  </Accordion>
  <Accordion title="7b. Dependencias de runtime de Plugins incluidos">
    Doctor verifica dependencias de runtime solo para Plugins incluidos que estén activos en la configuración actual o habilitados por el valor predeterminado de su manifiesto incluido, por ejemplo `plugins.entries.discord.enabled: true`, `channels.discord.enabled: true` heredado o un proveedor incluido habilitado por defecto. Si falta alguna, doctor informa de los paquetes y los instala en modo `openclaw doctor --fix` / `openclaw doctor --repair`. Los Plugins externos siguen usando `openclaw plugins install` / `openclaw plugins update`; doctor no instala dependencias para rutas arbitrarias de Plugins.

    Gateway y la CLI local también pueden reparar bajo demanda las dependencias de runtime de Plugins incluidos activos antes de importar un Plugin incluido. Estas instalaciones están limitadas a la raíz de instalación del runtime del Plugin, se ejecutan con scripts deshabilitados, no escriben un package lock y están protegidas por un bloqueo de raíz de instalación para que los inicios concurrentes de CLI o Gateway no modifiquen el mismo árbol `node_modules` al mismo tiempo.

  </Accordion>
  <Accordion title="8. Migraciones de servicios del Gateway e indicaciones de limpieza">
    Doctor detecta servicios heredados del gateway (launchd/systemd/schtasks) y ofrece eliminarlos e instalar el servicio de OpenClaw usando el puerto actual del gateway. También puede escanear en busca de servicios adicionales similares a gateway y mostrar indicaciones de limpieza. Los servicios de gateway de OpenClaw con nombre de perfil se consideran de primera clase y no se marcan como "adicionales".
  </Accordion>
  <Accordion title="8b. Migración de Matrix en el arranque">
    Cuando una cuenta del canal Matrix tiene una migración heredada de estado pendiente o accionable, doctor (en modo `--fix` / `--repair`) crea una instantánea previa a la migración y luego ejecuta los pasos de migración de mejor esfuerzo: migración heredada del estado de Matrix y preparación heredada del estado cifrado. Ambos pasos no son fatales; los errores se registran y el arranque continúa. En modo de solo lectura (`openclaw doctor` sin `--fix`) esta comprobación se omite por completo.
  </Accordion>
  <Accordion title="8c. Emparejamiento de dispositivos y deriva de autenticación">
    Doctor ahora inspecciona el estado de emparejamiento de dispositivos como parte del paso normal de estado.

    Qué informa:

    - primeras solicitudes de emparejamiento pendientes
    - actualizaciones pendientes de rol para dispositivos ya emparejados
    - actualizaciones pendientes de ámbito para dispositivos ya emparejados
    - reparaciones de discrepancia de clave pública donde el id del dispositivo todavía coincide pero la identidad del dispositivo ya no coincide con el registro aprobado
    - registros emparejados sin un token activo para un rol aprobado
    - tokens emparejados cuyos ámbitos derivan fuera de la línea base aprobada del emparejamiento
    - entradas locales en caché de tokens de dispositivo para la máquina actual que son anteriores a una rotación de token del lado del gateway o contienen metadatos de ámbito obsoletos

    Doctor no aprueba automáticamente solicitudes de emparejamiento ni rota automáticamente tokens de dispositivo. En su lugar, muestra los pasos exactos a seguir:

    - inspeccionar solicitudes pendientes con `openclaw devices list`
    - aprobar la solicitud exacta con `openclaw devices approve <requestId>`
    - rotar un token nuevo con `openclaw devices rotate --device <deviceId> --role <role>`
    - eliminar y volver a aprobar un registro obsoleto con `openclaw devices remove <deviceId>`

    Esto cierra el vacío común de "ya está emparejado pero sigue apareciendo pairing required": doctor ahora distingue entre emparejamiento inicial, actualizaciones pendientes de rol/ámbito y deriva obsoleta de token/identidad de dispositivo.

  </Accordion>
  <Accordion title="9. Advertencias de seguridad">
    Doctor emite advertencias cuando un proveedor está abierto a mensajes directos sin una lista permitida, o cuando una política está configurada de forma peligrosa.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Si se ejecuta como servicio de usuario systemd, doctor se asegura de que lingering esté habilitado para que el gateway siga activo tras cerrar sesión.
  </Accordion>
  <Accordion title="11. Estado del espacio de trabajo (Skills, Plugins y directorios heredados)">
    Doctor muestra un resumen del estado del espacio de trabajo para el agente predeterminado:

    - **Estado de Skills**: cuenta Skills elegibles, con requisitos faltantes y bloqueadas por lista permitida.
    - **Directorios heredados del espacio de trabajo**: avisa cuando `~/openclaw` u otros directorios heredados del espacio de trabajo existen junto al espacio de trabajo actual.
    - **Estado de Plugins**: cuenta Plugins habilitados/deshabilitados/con errores; enumera los IDs de Plugin para cualquier error; informa de las capacidades de los Plugins de paquete.
    - **Advertencias de compatibilidad de Plugins**: señala Plugins que tienen problemas de compatibilidad con el runtime actual.
    - **Diagnósticos de Plugins**: muestra advertencias o errores de tiempo de carga emitidos por el registro de Plugins.

  </Accordion>
  <Accordion title="11b. Tamaño de archivo de bootstrap">
    Doctor comprueba si los archivos de bootstrap del espacio de trabajo (por ejemplo `AGENTS.md`, `CLAUDE.md` u otros archivos de contexto inyectados) están cerca o por encima del presupuesto configurado de caracteres. Informa por archivo el recuento bruto frente al inyectado, porcentaje de truncamiento, causa del truncamiento (`max/file` o `max/total`) y el total de caracteres inyectados como fracción del presupuesto total. Cuando los archivos están truncados o cerca del límite, doctor muestra consejos para ajustar `agents.defaults.bootstrapMaxChars` y `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Autocompletado del shell">
    Doctor comprueba si el autocompletado con tabulador está instalado para el shell actual (zsh, bash, fish o PowerShell):

    - Si el perfil del shell usa un patrón lento de autocompletado dinámico (`source <(openclaw completion ...)`), doctor lo actualiza a la variante más rápida basada en archivo en caché.
    - Si el autocompletado está configurado en el perfil pero falta el archivo de caché, doctor regenera automáticamente la caché.
    - Si no hay ningún autocompletado configurado, doctor ofrece instalarlo (solo en modo interactivo; omitido con `--non-interactive`).

    Ejecuta `openclaw completion --write-state` para regenerar la caché manualmente.

  </Accordion>
  <Accordion title="12. Comprobaciones de autenticación del Gateway (token local)">
    Doctor comprueba la preparación de la autenticación por token del gateway local.

    - Si el modo token necesita un token y no existe ninguna fuente de token, doctor ofrece generar uno.
    - Si `gateway.auth.token` está gestionado por SecretRef pero no está disponible, doctor avisa y no lo sobrescribe con texto sin formato.
    - `openclaw doctor --generate-gateway-token` fuerza la generación solo cuando no hay ningún token SecretRef configurado.

  </Accordion>
  <Accordion title="12b. Reparaciones de solo lectura con reconocimiento de SecretRef">
    Algunos flujos de reparación necesitan inspeccionar credenciales configuradas sin debilitar el comportamiento de fallo rápido en runtime.

    - `openclaw doctor --fix` ahora usa el mismo modelo de resumen de SecretRef de solo lectura que los comandos de la familia status para reparaciones dirigidas de configuración.
    - Ejemplo: la reparación de `allowFrom` / `groupAllowFrom` de Telegram con `@username` intenta usar credenciales configuradas del bot cuando están disponibles.
    - Si el token del bot de Telegram está configurado mediante SecretRef pero no está disponible en la ruta actual del comando, doctor informa de que la credencial está configurada pero no disponible y omite la resolución automática en lugar de fallar o informar incorrectamente de que falta el token.

  </Accordion>
  <Accordion title="13. Comprobación de estado del Gateway + reinicio">
    Doctor ejecuta una comprobación de estado y ofrece reiniciar el gateway cuando parece no estar en buen estado.
  </Accordion>
  <Accordion title="13b. Preparación de búsqueda en memoria">
    Doctor comprueba si el proveedor configurado de embeddings para búsqueda en memoria está listo para el agente predeterminado. El comportamiento depende del backend y del proveedor configurados:

    - **Backend QMD**: sondea si el binario `qmd` está disponible y puede iniciarse. Si no, muestra instrucciones de corrección que incluyen el paquete npm y una opción manual de ruta binaria.
    - **Proveedor local explícito**: comprueba si existe un archivo de modelo local o una URL de modelo remoto/descargable reconocida. Si falta, sugiere cambiar a un proveedor remoto.
    - **Proveedor remoto explícito** (`openai`, `voyage`, etc.): verifica que haya una clave de API presente en el entorno o en el almacenamiento de autenticación. Muestra indicaciones de corrección accionables si falta.
    - **Proveedor automático**: comprueba primero la disponibilidad del modelo local y luego prueba cada proveedor remoto en el orden de selección automática.

    Cuando hay disponible un resultado de sondeo del gateway (el gateway estaba en buen estado en el momento de la comprobación), doctor lo contrasta con la configuración visible desde la CLI y señala cualquier discrepancia.

    Usa `openclaw memory status --deep` para verificar la preparación de embeddings en runtime.

  </Accordion>
  <Accordion title="14. Advertencias de estado del canal">
    Si el gateway está en buen estado, doctor ejecuta un sondeo del estado del canal e informa advertencias con correcciones sugeridas.
  </Accordion>
  <Accordion title="15. Auditoría + reparación de configuración del supervisor">
    Doctor comprueba la configuración del supervisor instalada (launchd/systemd/schtasks) en busca de valores predeterminados faltantes u obsoletos (por ejemplo, dependencias `network-online` de systemd y retraso de reinicio). Cuando encuentra una discrepancia, recomienda una actualización y puede reescribir el archivo de servicio/tarea con los valores predeterminados actuales.

    Notas:

    - `openclaw doctor` pide confirmación antes de reescribir la configuración del supervisor.
    - `openclaw doctor --yes` acepta las solicitudes de reparación predeterminadas.
    - `openclaw doctor --repair` aplica las correcciones recomendadas sin preguntas.
    - `openclaw doctor --repair --force` sobrescribe configuraciones personalizadas del supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene a doctor en modo de solo lectura para el ciclo de vida del servicio del gateway. Sigue informando del estado del servicio y ejecuta reparaciones no relacionadas con el servicio, pero omite instalación/inicio/reinicio/bootstrap del servicio, reescrituras de configuración del supervisor y limpieza de servicios heredados porque un supervisor externo controla ese ciclo de vida.
    - Si la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación/reparación del servicio con doctor valida el SecretRef, pero no persiste valores de token resueltos en texto sin formato dentro de los metadatos de entorno del servicio del supervisor.
    - Si la autenticación por token requiere un token y el token SecretRef configurado no puede resolverse, doctor bloquea la ruta de instalación/reparación con orientación accionable.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está establecido, doctor bloquea la instalación/reparación hasta que el modo se establezca explícitamente.
    - Para unidades user-systemd de Linux, las comprobaciones de deriva de token de doctor ahora incluyen tanto fuentes `Environment=` como `EnvironmentFile=` al comparar metadatos de autenticación del servicio.
    - Las reparaciones de servicio de doctor se niegan a reescribir, detener o reiniciar un servicio de gateway desde un binario OpenClaw más antiguo cuando la configuración fue escrita por última vez por una versión más nueva. Consulta [Solución de problemas del Gateway](/es/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Siempre puedes forzar una reescritura completa mediante `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Runtime del Gateway + diagnósticos de puertos">
    Doctor inspecciona el runtime del servicio (PID, último estado de salida) y avisa cuando el servicio está instalado pero no se está ejecutando realmente. También comprueba colisiones de puertos en el puerto del gateway (predeterminado `18789`) e informa de causas probables (gateway ya en ejecución, túnel SSH).
  </Accordion>
  <Accordion title="17. Buenas prácticas del runtime del Gateway">
    Doctor avisa cuando el servicio del gateway se ejecuta con Bun o con una ruta de Node gestionada por un administrador de versiones (`nvm`, `fnm`, `volta`, `asdf`, etc.). Los canales de WhatsApp + Telegram requieren Node, y las rutas de administradores de versiones pueden romperse después de actualizaciones porque el servicio no carga la inicialización de tu shell. Doctor ofrece migrar a una instalación de Node del sistema cuando está disponible (Homebrew/apt/choco).
  </Accordion>
  <Accordion title="18. Escritura de configuración + metadatos del asistente">
    Doctor persiste cualquier cambio de configuración y registra metadatos del asistente para dejar constancia de la ejecución de doctor.
  </Accordion>
  <Accordion title="19. Consejos del espacio de trabajo (copia de seguridad + sistema de memoria)">
    Doctor sugiere un sistema de memoria del espacio de trabajo cuando falta y muestra un consejo de copia de seguridad si el espacio de trabajo todavía no está bajo git.

    Consulta [/concepts/agent-workspace](/es/concepts/agent-workspace) para obtener una guía completa sobre la estructura del espacio de trabajo y copias de seguridad con git (se recomienda GitHub o GitLab privados).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Runbook del Gateway](/es/gateway)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
