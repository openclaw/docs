---
read_when:
    - Agregar o modificar migraciones de doctor
    - Introducción de cambios de configuración incompatibles
summary: 'Comando doctor: comprobaciones de estado, migraciones de configuración y pasos de reparación'
title: Doctor
x-i18n:
    generated_at: "2026-04-25T18:18:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13204a57facd19459fc812a8daa0fe629b6725bdabb014f59f871fa64c22e71d
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` es la herramienta de reparación + migración de OpenClaw. Corrige
configuración/estado obsoletos, comprueba el estado y proporciona pasos de reparación accionables.

## Inicio rápido

```bash
openclaw doctor
```

### Headless / automatización

```bash
openclaw doctor --yes
```

Acepta los valores predeterminados sin pedir confirmación (incluidos los pasos de reparación de reinicio/servicio/sandbox cuando corresponda).

```bash
openclaw doctor --repair
```

Aplica las reparaciones recomendadas sin pedir confirmación (reparaciones + reinicios cuando sea seguro).

```bash
openclaw doctor --repair --force
```

Aplica también reparaciones agresivas (sobrescribe configuraciones personalizadas del supervisor).

```bash
openclaw doctor --non-interactive
```

Se ejecuta sin solicitudes y solo aplica migraciones seguras (normalización de configuración + movimientos de estado en disco). Omite acciones de reinicio/servicio/sandbox que requieren confirmación humana.
Las migraciones de estado heredado se ejecutan automáticamente cuando se detectan.

```bash
openclaw doctor --deep
```

Analiza los servicios del sistema para encontrar instalaciones adicionales de Gateway (launchd/systemd/schtasks).

Si quieres revisar los cambios antes de escribirlos, abre primero el archivo de configuración:

```bash
cat ~/.openclaw/openclaw.json
```

## Qué hace (resumen)

- Actualización previa opcional para instalaciones por git (solo interactiva).
- Comprobación de vigencia del protocolo de UI (reconstruye la UI de Control cuando el esquema del protocolo es más reciente).
- Comprobación de estado + solicitud de reinicio.
- Resumen del estado de Skills (elegibles/faltantes/bloqueadas) y estado de plugins.
- Normalización de configuración para valores heredados.
- Migración de la configuración de Talk desde campos heredados planos `talk.*` a `talk.provider` + `talk.providers.<provider>`.
- Comprobaciones de migración del navegador para configuraciones heredadas de la extensión de Chrome y preparación de Chrome MCP.
- Advertencias de anulación del proveedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Advertencias de ocultamiento de OAuth de Codex (`models.providers.openai-codex`).
- Comprobación de requisitos previos de TLS de OAuth para perfiles OAuth de OpenAI Codex.
- Migración de estado heredado en disco (sessions/dir del agente/autenticación de WhatsApp).
- Migración heredada de claves del contrato del manifiesto de Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migración heredada del almacén de Cron (`jobId`, `schedule.cron`, campos de entrega/carga de nivel superior, `provider` en la carga, trabajos de respaldo de Webhook simples con `notify: true`).
- Inspección del archivo de bloqueo de sesión y limpieza de bloqueos obsoletos.
- Comprobaciones de integridad y permisos del estado (sessions, transcripciones, directorio de estado).
- Comprobaciones de permisos del archivo de configuración (`chmod 600`) cuando se ejecuta localmente.
- Estado de autenticación del modelo: comprueba el vencimiento de OAuth, puede refrescar tokens próximos a vencer e informa estados de enfriamiento/deshabilitación de perfiles de autenticación.
- Detección de directorio de espacio de trabajo adicional (`~/openclaw`).
- Reparación de imagen de sandbox cuando el sandboxing está habilitado.
- Migración de servicio heredado y detección de Gateway adicional.
- Migración de estado heredado del canal Matrix (en modo `--fix` / `--repair`).
- Comprobaciones de ejecución de Gateway (servicio instalado pero no en ejecución; etiqueta `launchd` en caché).
- Advertencias de estado del canal (sondeadas desde el Gateway en ejecución).
- Auditoría de configuración del supervisor (launchd/systemd/schtasks) con reparación opcional.
- Comprobaciones de buenas prácticas de ejecución de Gateway (Node frente a Bun, rutas del gestor de versiones).
- Diagnóstico de colisión de puertos de Gateway (predeterminado `18789`).
- Advertencias de seguridad para políticas de DM abiertas.
- Comprobaciones de autenticación de Gateway para el modo de token local (ofrece generar token cuando no existe ninguna fuente de token; no sobrescribe configuraciones `SecretRef` del token).
- Detección de problemas de emparejamiento de dispositivos (solicitudes pendientes de emparejamiento por primera vez, actualizaciones pendientes de rol/alcance, deriva obsoleta de la caché local de tokens de dispositivo y deriva de autenticación de registros emparejados).
- Comprobación de `linger` de systemd en Linux.
- Comprobación del tamaño del archivo de arranque del espacio de trabajo (advertencias de truncamiento/cercanía al límite para archivos de contexto).
- Comprobación del estado de autocompletado del shell e instalación/actualización automática.
- Comprobación de preparación del proveedor de embeddings de búsqueda de memoria (modelo local, clave de API remota o binario QMD).
- Comprobaciones de instalación desde código fuente (desajuste del espacio de trabajo de pnpm, activos de UI faltantes, binario `tsx` faltante).
- Escribe la configuración actualizada + metadatos del asistente.

## Relleno retrospectivo y restablecimiento de Dreams UI

La escena Dreams de la UI de Control incluye acciones de **Backfill**, **Reset** y **Clear Grounded**
para el flujo de dreaming con base contextual. Estas acciones usan métodos RPC
de estilo doctor de gateway, pero **no** forman parte de la reparación/migración
del CLI `openclaw doctor`.

Qué hacen:

- **Backfill** analiza archivos históricos `memory/YYYY-MM-DD.md` en el
  espacio de trabajo activo, ejecuta el paso del diario REM con base contextual y escribe entradas
  reversibles de relleno retrospectivo en `DREAMS.md`.
- **Reset** elimina solo esas entradas del diario de relleno retrospectivo marcadas de `DREAMS.md`.
- **Clear Grounded** elimina solo las entradas provisionales de corto plazo con base contextual
  que provinieron de una reproducción histórica y que aún no han acumulado recuerdo en vivo ni
  respaldo diario.

Qué **no** hacen por sí solas:

- no editan `MEMORY.md`
- no ejecutan migraciones completas de doctor
- no preparan automáticamente candidatos con base contextual en el almacén activo de promoción
  a corto plazo, a menos que ejecutes explícitamente primero la ruta CLI preparada

Si quieres que la reproducción histórica con base contextual influya en la ruta normal de promoción profunda,
usa en su lugar el flujo de CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Eso prepara candidatos duraderos con base contextual en el almacén de dreaming a corto plazo, mientras
mantiene `DREAMS.md` como la superficie de revisión.

## Comportamiento detallado y fundamentos

### 0) Actualización opcional (instalaciones por git)

Si esto es un checkout de git y doctor se está ejecutando de forma interactiva, ofrece
actualizar (fetch/rebase/build) antes de ejecutar doctor.

### 1) Normalización de configuración

Si la configuración contiene formas de valores heredados (por ejemplo `messages.ackReaction`
sin una anulación específica del canal), doctor los normaliza al esquema
actual.

Eso incluye campos planos heredados de Talk. La configuración pública actual de Talk es
`talk.provider` + `talk.providers.<provider>`. Doctor reescribe las formas antiguas
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` en el mapa del proveedor.

### 2) Migraciones de claves de configuración heredadas

Cuando la configuración contiene claves obsoletas, otros comandos se niegan a ejecutarse y piden
que ejecutes `openclaw doctor`.

Doctor hará lo siguiente:

- Explicar qué claves heredadas se encontraron.
- Mostrar la migración que aplicó.
- Reescribir `~/.openclaw/openclaw.json` con el esquema actualizado.

Gateway también ejecuta automáticamente las migraciones de doctor al iniciarse cuando detecta un
formato de configuración heredado, de modo que las configuraciones obsoletas se reparan sin intervención manual.
Las migraciones del almacén de trabajos Cron se gestionan con `openclaw doctor --fix`.

Migraciones actuales:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` de nivel superior
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- heredado `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Para canales con `accounts` con nombre pero con valores persistentes de canal de cuenta única en el nivel superior, mover esos valores con ámbito de cuenta a la cuenta promovida elegida para ese canal (`accounts.default` para la mayoría de los canales; Matrix puede conservar un destino con nombre/predeterminado coincidente existente)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- eliminar `browser.relayBindHost` (configuración heredada del relay de la extensión)

Las advertencias de doctor también incluyen orientación sobre la cuenta predeterminada para canales con varias cuentas:

- Si hay dos o más entradas `channels.<channel>.accounts` configuradas sin `channels.<channel>.defaultAccount` ni `accounts.default`, doctor advierte que el enrutamiento de respaldo puede elegir una cuenta inesperada.
- Si `channels.<channel>.defaultAccount` está configurado con un ID de cuenta desconocido, doctor advierte y enumera los ID de cuenta configurados.

### 2b) Anulaciones del proveedor OpenCode

Si has añadido `models.providers.opencode`, `opencode-zen` o `opencode-go`
manualmente, eso anula el catálogo OpenCode integrado de `@mariozechner/pi-ai`.
Eso puede forzar modelos a la API equivocada o dejar los costos en cero. Doctor advierte para que
puedas eliminar la anulación y restaurar el enrutamiento + costos por modelo y por API.

### 2c) Migración del navegador y preparación de Chrome MCP

Si tu configuración del navegador aún apunta a la ruta eliminada de la extensión de Chrome, doctor
la normaliza al modelo actual de conexión local del host de Chrome MCP:

- `browser.profiles.*.driver: "extension"` pasa a ser `"existing-session"`
- se elimina `browser.relayBindHost`

Doctor también audita la ruta local del host de Chrome MCP cuando usas `defaultProfile:
"user"` o un perfil `existing-session` configurado:

- comprueba si Google Chrome está instalado en el mismo host para perfiles de conexión automática
  predeterminados
- comprueba la versión detectada de Chrome y advierte cuando es inferior a Chrome 144
- recuerda habilitar la depuración remota en la página de inspección del navegador (por
  ejemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  o `edge://inspect/#remote-debugging`)

Doctor no puede habilitar por ti la configuración del lado de Chrome. Chrome MCP local del host
sigue requiriendo:

- un navegador basado en Chromium 144+ en el host del gateway/node
- el navegador ejecutándose localmente
- depuración remota habilitada en ese navegador
- aprobar el primer aviso de consentimiento de conexión en el navegador

La preparación aquí solo se refiere a los requisitos previos de conexión local. Existing-session mantiene
los límites actuales de ruta de Chrome MCP; rutas avanzadas como `responsebody`, exportación a PDF,
intercepción de descargas y acciones por lotes siguen requiriendo un navegador gestionado
o un perfil CDP sin procesar.

Esta comprobación **no** se aplica a Docker, sandbox, remote-browser ni a otros flujos headless. Esos siguen usando CDP sin procesar.

### 2d) Requisitos previos de TLS para OAuth

Cuando se configura un perfil OAuth de OpenAI Codex, doctor sondea el endpoint de autorización
de OpenAI para verificar que la pila TLS local de Node/OpenSSL pueda
validar la cadena de certificados. Si el sondeo falla con un error de certificado (por
ejemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado vencido o certificado autofirmado),
doctor muestra instrucciones de corrección específicas de la plataforma. En macOS con un Node de Homebrew, la
corrección suele ser `brew postinstall ca-certificates`. Con `--deep`, el sondeo se ejecuta
incluso si Gateway está en buen estado.

### 2c) Anulaciones del proveedor Codex OAuth

Si anteriormente añadiste ajustes heredados de transporte de OpenAI en
`models.providers.openai-codex`, pueden ocultar la ruta integrada del
proveedor Codex OAuth que las versiones más recientes usan automáticamente. Doctor advierte cuando ve
esos ajustes antiguos de transporte junto con Codex OAuth para que puedas eliminar o reescribir
la anulación de transporte obsoleta y recuperar el comportamiento integrado de enrutamiento/respaldo.
Los proxies personalizados y las anulaciones solo de encabezados siguen siendo compatibles y no
activan esta advertencia.

### 3) Migraciones de estado heredado (diseño en disco)

Doctor puede migrar diseños antiguos en disco a la estructura actual:

- Almacén de sesiones + transcripciones:
  - de `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
- Directorio del agente:
  - de `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
- Estado de autenticación de WhatsApp (Baileys):
  - desde el heredado `~/.openclaw/credentials/*.json` (excepto `oauth.json`)
  - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de cuenta predeterminado: `default`)

Estas migraciones son idempotentes y de mejor esfuerzo; doctor emitirá advertencias cuando
deje carpetas heredadas como copias de seguridad. Gateway/CLI también migra automáticamente
las sesiones heredadas + el directorio del agente al iniciarse, para que historial/autenticación/modelos lleguen a la
ruta por agente sin ejecutar doctor manualmente. La autenticación de WhatsApp se migra intencionalmente solo
mediante `openclaw doctor`. La normalización de proveedor/mapa de proveedores de Talk ahora
compara por igualdad estructural, por lo que las diferencias solo de orden de claves ya no activan
cambios repetidos y vacíos de `doctor --fix`.

### 3a) Migraciones heredadas del manifiesto de Plugin

Doctor analiza todos los manifiestos de plugins instalados en busca de claves obsoletas
de capacidad de nivel superior (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Cuando las encuentra, ofrece moverlas al objeto `contracts`
y reescribir el archivo del manifiesto en su lugar. Esta migración es idempotente;
si la clave `contracts` ya tiene los mismos valores, la clave heredada se elimina
sin duplicar los datos.

### 3b) Migraciones heredadas del almacén de Cron

Doctor también comprueba el almacén de trabajos Cron (`~/.openclaw/cron/jobs.json` por defecto,
o `cron.store` cuando se anula) en busca de formas antiguas de trabajos que el programador aún
acepta por compatibilidad.

Las limpiezas actuales de Cron incluyen:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- campos de carga de nivel superior (`message`, `model`, `thinking`, ...) → `payload`
- campos de entrega de nivel superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias de entrega `provider` en la carga → `delivery.channel` explícito
- trabajos heredados simples de respaldo de Webhook con `notify: true` → `delivery.mode="webhook"` explícito con `delivery.to=cron.webhook`

Doctor solo migra automáticamente trabajos con `notify: true` cuando puede hacerlo sin
cambiar el comportamiento. Si un trabajo combina el respaldo heredado de notificación con un modo de
entrega ya existente que no sea Webhook, doctor advierte y deja ese trabajo para revisión manual.

### 3c) Limpieza de bloqueos de sesión

Doctor analiza cada directorio de sesión de agente en busca de archivos obsoletos de bloqueo de escritura: archivos dejados
atrás cuando una sesión terminó de forma anómala. Para cada archivo de bloqueo encontrado informa:
la ruta, el PID, si el PID sigue activo, la antigüedad del bloqueo y si se
considera obsoleto (PID muerto o antigüedad superior a 30 minutos). En modo `--fix` / `--repair`
elimina automáticamente los archivos de bloqueo obsoletos; de lo contrario muestra una nota e
indica que vuelvas a ejecutar con `--fix`.

### 4) Comprobaciones de integridad del estado (persistencia de sesión, enrutamiento y seguridad)

El directorio de estado es el tronco encefálico operativo. Si desaparece, pierdes
sesiones, credenciales, registros y configuración (a menos que tengas copias de seguridad en otro lugar).

Doctor comprueba:

- **Falta el directorio de estado**: advierte sobre pérdida catastrófica de estado, pide recrear
  el directorio y recuerda que no puede recuperar datos faltantes.
- **Permisos del directorio de estado**: verifica que se pueda escribir; ofrece reparar permisos
  (y muestra una sugerencia `chown` cuando detecta una discrepancia de propietario/grupo).
- **Directorio de estado de macOS sincronizado con la nube**: advierte cuando el estado se resuelve bajo iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o
  `~/Library/CloudStorage/...` porque las rutas respaldadas por sincronización pueden causar E/S más lenta
  y carreras de bloqueo/sincronización.
- **Directorio de estado de Linux en SD o eMMC**: advierte cuando el estado se resuelve en un origen
  de montaje `mmcblk*`, porque la E/S aleatoria respaldada por SD o eMMC puede ser más lenta y desgastarse
  más rápido con escrituras de sesión y credenciales.
- **Faltan directorios de sesión**: `sessions/` y el directorio del almacén de sesiones son
  necesarios para persistir el historial y evitar fallos `ENOENT`.
- **Desajuste de transcripciones**: advierte cuando entradas recientes de sesión tienen
  archivos de transcripción faltantes.
- **Sesión principal “JSONL de 1 línea”**: marca cuando la transcripción principal tiene solo una
  línea (el historial no se está acumulando).
- **Varios directorios de estado**: advierte cuando existen varias carpetas `~/.openclaw`
  en distintos directorios personales o cuando `OPENCLAW_STATE_DIR` apunta a otro lugar (el historial puede
  dividirse entre instalaciones).
- **Recordatorio de modo remoto**: si `gateway.mode=remote`, doctor recuerda ejecutarlo
  en el host remoto (el estado vive allí).
- **Permisos del archivo de configuración**: advierte si `~/.openclaw/openclaw.json` tiene permisos de
  lectura para grupo/mundo y ofrece restringirlos a `600`.

### 5) Estado de autenticación del modelo (vencimiento de OAuth)

Doctor inspecciona los perfiles OAuth en el almacén de autenticación, advierte cuando los tokens
están próximos a vencer o vencidos, y puede renovarlos cuando es seguro. Si el perfil
OAuth/token de Anthropic está obsoleto, sugiere una clave de API de Anthropic o la
ruta de token de configuración de Anthropic.
Las solicitudes de renovación solo aparecen cuando se ejecuta de forma interactiva (TTY); `--non-interactive`
omite los intentos de renovación.

Cuando una renovación de OAuth falla de forma permanente (por ejemplo `refresh_token_reused`,
`invalid_grant` o un proveedor te indica que vuelvas a iniciar sesión), doctor informa
que se requiere volver a autenticarse y muestra el comando exacto `openclaw models auth login --provider ...`
que debes ejecutar.

Doctor también informa perfiles de autenticación temporalmente inutilizables debido a:

- enfriamientos cortos (límites de tasa/tiempos de espera/fallos de autenticación)
- deshabilitaciones más largas (fallos de facturación/crédito)

### 6) Validación del modelo de hooks

Si `hooks.gmail.model` está establecido, doctor valida la referencia del modelo frente al
catálogo y la lista de permitidos, y advierte cuando no se resolverá o no está permitido.

### 7) Reparación de imagen de sandbox

Cuando el sandboxing está habilitado, doctor comprueba las imágenes de Docker y ofrece compilar o
cambiar a nombres heredados si la imagen actual falta.

### 7b) Dependencias de ejecución de plugins integrados

Doctor verifica dependencias de ejecución solo para plugins integrados que están activos en
la configuración actual o habilitados por el valor predeterminado de su manifiesto integrado, por ejemplo
`plugins.entries.discord.enabled: true`, el heredado
`channels.discord.enabled: true`, o un proveedor integrado habilitado por defecto. Si falta alguna,
doctor informa los paquetes y los instala en modo
`openclaw doctor --fix` / `openclaw doctor --repair`. Los plugins externos siguen
usando `openclaw plugins install` / `openclaw plugins update`; doctor no
instala dependencias para rutas arbitrarias de plugins.

Gateway y el CLI local también pueden reparar dependencias de ejecución de plugins integrados activos
bajo demanda antes de importar un plugin integrado. Estas instalaciones están
limitadas a la raíz de instalación de ejecución del plugin, se ejecutan con los scripts deshabilitados, no
escriben un bloqueo de paquetes y están protegidas por un bloqueo de la raíz de instalación para que
inicios concurrentes de CLI o Gateway no modifiquen el mismo árbol `node_modules` al mismo tiempo.

### 8) Migraciones del servicio Gateway y sugerencias de limpieza

Doctor detecta servicios heredados de gateway (launchd/systemd/schtasks) y
ofrece eliminarlos e instalar el servicio de OpenClaw usando el puerto actual de gateway.
También puede analizar servicios adicionales similares a gateway y mostrar sugerencias de limpieza.
Los servicios de gateway de OpenClaw con nombre de perfil se consideran de primera clase y no
se marcan como "adicionales".

### 8b) Migración de Matrix al inicio

Cuando una cuenta de canal Matrix tiene una migración de estado heredado pendiente o accionable,
doctor (en modo `--fix` / `--repair`) crea una instantánea previa a la migración y luego
ejecuta los pasos de migración de mejor esfuerzo: migración del estado heredado de Matrix y preparación
del estado cifrado heredado. Ambos pasos no son fatales; los errores se registran y
el inicio continúa. En modo de solo lectura (`openclaw doctor` sin `--fix`) esta comprobación
se omite por completo.

### 8c) Emparejamiento de dispositivos y deriva de autenticación

Doctor ahora inspecciona el estado de emparejamiento de dispositivos como parte del paso normal de estado.

Qué informa:

- solicitudes pendientes de emparejamiento por primera vez
- actualizaciones pendientes de rol para dispositivos ya emparejados
- actualizaciones pendientes de alcance para dispositivos ya emparejados
- reparaciones de discrepancia de clave pública donde el ID del dispositivo aún coincide pero la
  identidad del dispositivo ya no coincide con el registro aprobado
- registros emparejados a los que les falta un token activo para un rol aprobado
- tokens emparejados cuyos alcances se desvían de la base aprobada de emparejamiento
- entradas de la caché local de tokens de dispositivo para la máquina actual que son anteriores a una
  rotación de token del lado del gateway o que conservan metadatos de alcance obsoletos

Doctor no aprueba automáticamente solicitudes de emparejamiento ni rota automáticamente tokens de dispositivo. En
su lugar muestra los pasos exactos siguientes:

- inspeccionar solicitudes pendientes con `openclaw devices list`
- aprobar la solicitud exacta con `openclaw devices approve <requestId>`
- rotar un token nuevo con `openclaw devices rotate --device <deviceId> --role <role>`
- eliminar y volver a aprobar un registro obsoleto con `openclaw devices remove <deviceId>`

Esto cierra el problema común de "ya emparejado pero sigue apareciendo que se requiere emparejamiento":
doctor ahora distingue entre emparejamiento inicial, actualizaciones pendientes de rol/alcance
y deriva obsoleta de token/identidad del dispositivo.

### 9) Advertencias de seguridad

Doctor emite advertencias cuando un proveedor está abierto a mensajes directos sin lista de permitidos, o
cuando una política está configurada de forma peligrosa.

### 10) `linger` de systemd (Linux)

Si se ejecuta como servicio de usuario de systemd, doctor garantiza que `linger` esté habilitado para que el
gateway siga activo después de cerrar sesión.

### 11) Estado del espacio de trabajo (Skills, plugins y directorios heredados)

Doctor muestra un resumen del estado del espacio de trabajo para el agente predeterminado:

- **Estado de Skills**: cuenta Skills elegibles, con requisitos faltantes y bloqueadas por la lista de permitidos.
- **Directorios heredados del espacio de trabajo**: advierte cuando `~/openclaw` u otros directorios heredados del espacio de trabajo
  existen junto al espacio de trabajo actual.
- **Estado de plugins**: cuenta plugins habilitados/deshabilitados/con errores; enumera los ID de plugin para cualquier
  error; informa las capacidades de los plugins integrados.
- **Advertencias de compatibilidad de plugins**: marca plugins que tienen problemas de compatibilidad con
  la ejecución actual.
- **Diagnóstico de plugins**: muestra cualquier advertencia o error de carga emitido por el
  registro de plugins.

### 11b) Tamaño del archivo de arranque

Doctor comprueba si los archivos de arranque del espacio de trabajo (por ejemplo `AGENTS.md`,
`CLAUDE.md` u otros archivos de contexto inyectados) están cerca o por encima del
presupuesto de caracteres configurado. Informa por archivo el recuento de caracteres sin procesar frente a inyectados, el
porcentaje de truncamiento, la causa del truncamiento (`max/file` o `max/total`) y el total de caracteres
inyectados como fracción del presupuesto total. Cuando los archivos están truncados o cerca
del límite, doctor muestra consejos para ajustar `agents.defaults.bootstrapMaxChars`
y `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Autocompletado del shell

Doctor comprueba si el autocompletado con tabulación está instalado para el shell actual
(zsh, bash, fish o PowerShell):

- Si el perfil del shell usa un patrón lento de autocompletado dinámico
  (`source <(openclaw completion ...)`), doctor lo actualiza a la variante más rápida
  con archivo en caché.
- Si el autocompletado está configurado en el perfil pero falta el archivo de caché,
  doctor regenera la caché automáticamente.
- Si no hay ningún autocompletado configurado, doctor pide instalarlo
  (solo en modo interactivo; se omite con `--non-interactive`).

Ejecuta `openclaw completion --write-state` para regenerar la caché manualmente.

### 12) Comprobaciones de autenticación de Gateway (token local)

Doctor comprueba la preparación de la autenticación por token local de Gateway.

- Si el modo token necesita un token y no existe ninguna fuente de token, doctor ofrece generar uno.
- Si `gateway.auth.token` está gestionado por SecretRef pero no está disponible, doctor advierte y no lo sobrescribe con texto sin formato.
- `openclaw doctor --generate-gateway-token` fuerza la generación solo cuando no hay ningún token SecretRef configurado.

### 12b) Reparaciones de solo lectura compatibles con SecretRef

Algunos flujos de reparación necesitan inspeccionar credenciales configuradas sin debilitar el comportamiento de fallo rápido en ejecución.

- `openclaw doctor --fix` ahora usa el mismo modelo resumido de SecretRef de solo lectura que los comandos de la familia status para reparaciones de configuración específicas.
- Ejemplo: la reparación de Telegram `allowFrom` / `groupAllowFrom` con `@username` intenta usar las credenciales del bot configuradas cuando están disponibles.
- Si el token del bot de Telegram está configurado mediante SecretRef pero no está disponible en la ruta actual del comando, doctor informa que la credencial está configurada pero no disponible y omite la resolución automática en lugar de fallar o informar incorrectamente que falta el token.

### 13) Comprobación de estado de Gateway + reinicio

Doctor ejecuta una comprobación de estado y ofrece reiniciar Gateway cuando parece
no estar en buen estado.

### 13b) Preparación de búsqueda de memoria

Doctor comprueba si el proveedor de embeddings configurado para búsqueda de memoria está listo
para el agente predeterminado. El comportamiento depende del backend y del proveedor configurados:

- **Backend QMD**: sondea si el binario `qmd` está disponible y puede iniciarse.
  Si no, muestra instrucciones de corrección, incluido el paquete npm y una opción manual de ruta del binario.
- **Proveedor local explícito**: comprueba si existe un archivo de modelo local o una URL de modelo remota/descargable
  reconocida. Si falta, sugiere cambiar a un proveedor remoto.
- **Proveedor remoto explícito** (`openai`, `voyage`, etc.): verifica que haya una clave de API
  presente en el entorno o en el almacén de autenticación. Si falta, muestra sugerencias de corrección accionables.
- **Proveedor automático**: comprueba primero la disponibilidad del modelo local y luego prueba cada proveedor remoto
  en el orden de selección automática.

Cuando hay disponible un resultado del sondeo de Gateway (Gateway estaba en buen estado en el momento de la
comprobación), doctor cruza ese resultado con la configuración visible desde el CLI y señala
cualquier discrepancia.

Usa `openclaw memory status --deep` para verificar en tiempo de ejecución la preparación de los embeddings.

### 14) Advertencias de estado del canal

Si Gateway está en buen estado, doctor ejecuta un sondeo de estado del canal e informa
advertencias con correcciones sugeridas.

### 15) Auditoría + reparación de configuración del supervisor

Doctor comprueba si la configuración instalada del supervisor (launchd/systemd/schtasks) tiene
valores predeterminados faltantes u obsoletos (por ejemplo, dependencias `network-online` de systemd y
retardo de reinicio). Cuando encuentra una discrepancia, recomienda una actualización y puede
reescribir el archivo de servicio/tarea a los valores predeterminados actuales.

Notas:

- `openclaw doctor` pide confirmación antes de reescribir la configuración del supervisor.
- `openclaw doctor --yes` acepta las solicitudes de reparación predeterminadas.
- `openclaw doctor --repair` aplica las correcciones recomendadas sin pedir confirmación.
- `openclaw doctor --repair --force` sobrescribe configuraciones personalizadas del supervisor.
- Si la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación/reparación del servicio doctor valida SecretRef pero no persiste valores resueltos de token en texto sin formato en los metadatos de entorno del servicio supervisor.
- Si la autenticación por token requiere un token y el token SecretRef configurado no está resuelto, doctor bloquea la ruta de instalación/reparación con instrucciones accionables.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está establecido, doctor bloquea la instalación/reparación hasta que el modo se establezca explícitamente.
- Para unidades Linux user-systemd, las comprobaciones de deriva de tokens de doctor ahora incluyen tanto las fuentes `Environment=` como `EnvironmentFile=` al comparar los metadatos de autenticación del servicio.
- Siempre puedes forzar una reescritura completa mediante `openclaw gateway install --force`.

### 16) Diagnóstico de ejecución + puertos de Gateway

Doctor inspecciona la ejecución del servicio (PID, último estado de salida) y advierte cuando el
servicio está instalado pero en realidad no se está ejecutando. También comprueba colisiones de puertos
en el puerto de Gateway (predeterminado `18789`) e informa las causas probables (Gateway ya
en ejecución, túnel SSH).

### 17) Buenas prácticas de ejecución de Gateway

Doctor advierte cuando el servicio Gateway se ejecuta sobre Bun o en una ruta de Node gestionada por versión
(`nvm`, `fnm`, `volta`, `asdf`, etc.). Los canales de WhatsApp + Telegram requieren Node,
y las rutas con gestores de versiones pueden fallar después de las actualizaciones porque el servicio no
carga la inicialización de tu shell. Doctor ofrece migrar a una instalación de Node del sistema cuando
está disponible (Homebrew/apt/choco).

### 18) Escritura de configuración + metadatos del asistente

Doctor persiste cualquier cambio de configuración y registra metadatos del asistente para dejar constancia de la
ejecución de doctor.

### 19) Consejos sobre el espacio de trabajo (copia de seguridad + sistema de memoria)

Doctor sugiere un sistema de memoria del espacio de trabajo cuando falta y muestra un consejo de copia de seguridad
si el espacio de trabajo aún no está bajo git.

Consulta [/concepts/agent-workspace](/es/concepts/agent-workspace) para obtener una guía completa sobre
la estructura del espacio de trabajo y la copia de seguridad con git (se recomienda GitHub o GitLab privados).

## Relacionado

- [Solución de problemas de Gateway](/es/gateway/troubleshooting)
- [Runbook de Gateway](/es/gateway)
