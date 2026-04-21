---
read_when:
    - Agregar o modificar migraciones de Doctor
    - Introducir cambios incompatibles en la configuración
summary: 'Comando doctor: comprobaciones de estado, migraciones de configuración y pasos de reparación'
title: Doctor
x-i18n:
    generated_at: "2026-04-21T05:14:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6460fe657e7cf0d938bfbb77e1cc0355c1b67830327d441878e48375de52a46f
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` es la herramienta de reparación + migración de OpenClaw. Corrige
configuración/estado obsoletos, comprueba el estado y proporciona pasos de reparación accionables.

## Inicio rápido

```bash
openclaw doctor
```

### Sin interfaz / automatización

```bash
openclaw doctor --yes
```

Acepta los valores predeterminados sin pedir confirmación (incluidos los pasos de reparación de reinicio/servicio/sandbox cuando corresponda).

```bash
openclaw doctor --repair
```

Aplica las reparaciones recomendadas sin pedir confirmación (reparaciones + reinicios cuando es seguro hacerlo).

```bash
openclaw doctor --repair --force
```

Aplica también reparaciones agresivas (sobrescribe configuraciones personalizadas del supervisor).

```bash
openclaw doctor --non-interactive
```

Se ejecuta sin avisos y solo aplica migraciones seguras (normalización de configuración + movimientos de estado en disco). Omite acciones de reinicio/servicio/sandbox que requieren confirmación humana.
Las migraciones de estado heredado se ejecutan automáticamente cuando se detectan.

```bash
openclaw doctor --deep
```

Analiza los servicios del sistema para detectar instalaciones adicionales de gateway (launchd/systemd/schtasks).

Si quieres revisar los cambios antes de escribirlos, abre primero el archivo de configuración:

```bash
cat ~/.openclaw/openclaw.json
```

## Qué hace (resumen)

- Actualización previa opcional para instalaciones con git (solo interactivo).
- Comprobación de vigencia del protocolo de UI (reconstruye la UI de Control cuando el esquema del protocolo es más reciente).
- Comprobación de estado + aviso para reiniciar.
- Resumen del estado de Skills (aptas/faltantes/bloqueadas) y estado de plugins.
- Normalización de configuración para valores heredados.
- Migración de configuración de Talk desde campos planos heredados `talk.*` a `talk.provider` + `talk.providers.<provider>`.
- Comprobaciones de migración del navegador para configuraciones heredadas de la extensión de Chrome y preparación de Chrome MCP.
- Advertencias de sobrescritura del proveedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Advertencias de sombreado de OAuth de Codex (`models.providers.openai-codex`).
- Comprobación de requisitos previos de OAuth TLS para perfiles de OAuth de OpenAI Codex.
- Migración de estado heredado en disco (sessions/agent dir/autenticación de WhatsApp).
- Migración de claves de contrato heredadas del manifiesto de plugins (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migración del almacén cron heredado (`jobId`, `schedule.cron`, campos de entrega/carga útil de nivel superior, `provider` en la carga útil, trabajos simples de respaldo de Webhook con `notify: true`).
- Inspección de archivos de bloqueo de sesión y limpieza de bloqueos obsoletos.
- Comprobaciones de integridad y permisos del estado (sesiones, transcripciones, directorio de estado).
- Comprobaciones de permisos del archivo de configuración (`chmod 600`) al ejecutarse localmente.
- Estado de autenticación del modelo: comprueba el vencimiento de OAuth, puede refrescar tokens próximos a expirar e informa estados de cooldown/deshabilitación del perfil de autenticación.
- Detección de directorios de espacio de trabajo adicionales (`~/openclaw`).
- Reparación de la imagen de sandbox cuando el aislamiento está habilitado.
- Migración de servicios heredados y detección de gateways adicionales.
- Migración de estado heredado del canal Matrix (en modo `--fix` / `--repair`).
- Comprobaciones del tiempo de ejecución de Gateway (servicio instalado pero no en ejecución; etiqueta launchd en caché).
- Advertencias de estado del canal (sondeadas desde el gateway en ejecución).
- Auditoría de configuración del supervisor (launchd/systemd/schtasks) con reparación opcional.
- Comprobaciones de mejores prácticas del tiempo de ejecución de Gateway (Node frente a Bun, rutas del gestor de versiones).
- Diagnóstico de colisiones del puerto de Gateway (predeterminado `18789`).
- Advertencias de seguridad para políticas de DM abiertas.
- Comprobaciones de autenticación de Gateway para el modo de token local (ofrece generación de token cuando no existe ninguna fuente de token; no sobrescribe configuraciones `SecretRef` del token).
- Detección de problemas de emparejamiento de dispositivos (solicitudes pendientes de primer emparejamiento, actualizaciones pendientes de rol/ámbito, deriva obsoleta de la caché local de tokens de dispositivo y deriva de autenticación de registros emparejados).
- Comprobación de `linger` de systemd en Linux.
- Comprobación del tamaño del archivo bootstrap del espacio de trabajo (advertencias de truncamiento/cercanía al límite para archivos de contexto).
- Comprobación del estado de shell completion y auto-instalación/actualización.
- Comprobación de preparación del proveedor de embeddings de búsqueda en memoria (modelo local, clave de API remota o binario QMD).
- Comprobaciones de instalación desde código fuente (desajuste del espacio de trabajo pnpm, activos de UI faltantes, binario tsx faltante).
- Escribe configuración actualizada + metadatos del asistente.

## Backfill y restablecimiento de la UI de Dreams

La escena de Dreams de la UI de Control incluye las acciones **Backfill**, **Reset** y **Clear Grounded**
para el flujo de trabajo de Dreaming con grounding. Estas acciones usan métodos RPC
con estilo doctor de gateway, pero **no** forman parte de la reparación/migración
de la CLI `openclaw doctor`.

Qué hacen:

- **Backfill** analiza archivos históricos `memory/YYYY-MM-DD.md` en el
  espacio de trabajo activo, ejecuta el paso de diario REM con grounding y escribe
  entradas reversibles de backfill en `DREAMS.md`.
- **Reset** elimina solo esas entradas del diario de backfill marcadas de `DREAMS.md`.
- **Clear Grounded** elimina solo entradas provisionales de corto plazo con grounding que
  provinieron de reproducción histórica y aún no han acumulado recuperación en vivo ni
  soporte diario.

Qué **no** hacen por sí mismas:

- no editan `MEMORY.md`
- no ejecutan migraciones completas de doctor
- no preparan automáticamente candidatos con grounding en el almacén activo de promoción a corto plazo
  a menos que ejecutes explícitamente primero la ruta de CLI preparada

Si quieres que la reproducción histórica con grounding influya en la ruta normal de
promoción profunda, usa en su lugar el flujo de CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Eso prepara candidatos duraderos con grounding en el almacén de Dreaming a corto plazo mientras
mantiene `DREAMS.md` como superficie de revisión.

## Comportamiento detallado y justificación

### 0) Actualización opcional (instalaciones con git)

Si esto es un checkout de git y doctor se ejecuta de forma interactiva, ofrece
actualizar (fetch/rebase/build) antes de ejecutar doctor.

### 1) Normalización de configuración

Si la configuración contiene formas de valores heredadas (por ejemplo `messages.ackReaction`
sin una sobrescritura específica del canal), doctor las normaliza al esquema
actual.

Eso incluye campos planos heredados de Talk. La configuración pública actual de Talk es
`talk.provider` + `talk.providers.<provider>`. Doctor reescribe las formas antiguas
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` al mapa de proveedores.

### 2) Migraciones de claves de configuración heredadas

Cuando la configuración contiene claves obsoletas, otros comandos se niegan a ejecutarse y te piden
que ejecutes `openclaw doctor`.

Doctor hará lo siguiente:

- Explicar qué claves heredadas se encontraron.
- Mostrar la migración que aplicó.
- Reescribir `~/.openclaw/openclaw.json` con el esquema actualizado.

Gateway también ejecuta automáticamente las migraciones de doctor al iniciar cuando detecta
un formato heredado de configuración, de modo que las configuraciones obsoletas se reparan sin intervención manual.
Las migraciones del almacén de trabajos cron se gestionan con `openclaw doctor --fix`.

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
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Para canales con `accounts` con nombre pero con valores de canal de nivel superior de cuenta única todavía presentes, mover esos valores con ámbito de cuenta a la cuenta promovida elegida para ese canal (`accounts.default` para la mayoría de los canales; Matrix puede conservar un destino existente coincidente con nombre/predeterminado)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- eliminar `browser.relayBindHost` (configuración heredada del relay de la extensión)

Las advertencias de doctor también incluyen orientación sobre cuentas predeterminadas para canales con múltiples cuentas:

- Si se configuran dos o más entradas `channels.<channel>.accounts` sin `channels.<channel>.defaultAccount` ni `accounts.default`, doctor advierte que el enrutamiento de respaldo puede elegir una cuenta inesperada.
- Si `channels.<channel>.defaultAccount` está configurado con un id de cuenta desconocido, doctor advierte y lista los ids de cuenta configurados.

### 2b) Sobrescrituras del proveedor OpenCode

Si has añadido manualmente `models.providers.opencode`, `opencode-zen` u `opencode-go`,
eso sobrescribe el catálogo integrado de OpenCode de `@mariozechner/pi-ai`.
Eso puede forzar modelos a la API incorrecta o poner los costos en cero. Doctor advierte para que
puedas eliminar la sobrescritura y restaurar el enrutamiento de API por modelo + costos.

### 2c) Migración del navegador y preparación de Chrome MCP

Si la configuración de tu navegador todavía apunta a la ruta eliminada de la extensión de Chrome, doctor
la normaliza al modelo actual de conexión host-local de Chrome MCP:

- `browser.profiles.*.driver: "extension"` pasa a ser `"existing-session"`
- se elimina `browser.relayBindHost`

Doctor también audita la ruta host-local de Chrome MCP cuando usas `defaultProfile:
"user"` o un perfil `existing-session` configurado:

- comprueba si Google Chrome está instalado en el mismo host para perfiles de
  conexión automática predeterminados
- comprueba la versión detectada de Chrome y advierte cuando es inferior a Chrome 144
- recuerda habilitar la depuración remota en la página de inspección del navegador (por
  ejemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  o `edge://inspect/#remote-debugging`)

Doctor no puede habilitar por ti la configuración del lado de Chrome. Chrome MCP host-local
todavía requiere:

- un navegador basado en Chromium 144+ en el host de gateway/node
- el navegador ejecutándose localmente
- depuración remota habilitada en ese navegador
- aprobar el primer aviso de consentimiento de conexión en el navegador

La preparación aquí solo se refiere a los requisitos previos de conexión local. `existing-session` mantiene
los límites actuales de rutas de Chrome MCP; rutas avanzadas como `responsebody`, exportación a PDF,
intercepción de descargas y acciones por lotes todavía requieren un navegador administrado
o un perfil CDP sin procesar.

Esta comprobación **no** se aplica a flujos Docker, sandbox, remote-browser ni otros
flujos sin interfaz. Esos siguen usando CDP sin procesar.

### 2d) Requisitos previos de OAuth TLS

Cuando se configura un perfil OAuth de OpenAI Codex, doctor sondea el endpoint de autorización de OpenAI
para verificar que la pila TLS local de Node/OpenSSL puede validar la cadena de certificados.
Si el sondeo falla con un error de certificado (por ejemplo
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado expirado o certificado autofirmado),
doctor imprime orientación de corrección específica de la plataforma. En macOS con un Node de Homebrew, la
corrección suele ser `brew postinstall ca-certificates`. Con `--deep`, el sondeo se ejecuta
incluso si el gateway está en buen estado.

### 2c) Sobrescrituras del proveedor OAuth de Codex

Si anteriormente agregaste configuraciones heredadas de transporte de OpenAI en
`models.providers.openai-codex`, pueden ocultar la ruta integrada del
proveedor OAuth de Codex que las versiones más recientes usan automáticamente.
Doctor advierte cuando detecta esas configuraciones antiguas de transporte junto
con OAuth de Codex para que puedas eliminar o reescribir la sobrescritura
obsoleta de transporte y recuperar el comportamiento integrado de
enrutamiento/respaldo. Los proxies personalizados y las sobrescrituras solo de
encabezados siguen siendo compatibles y no activan esta advertencia.

### 3) Migraciones de estado heredado (distribución en disco)

Doctor puede migrar distribuciones antiguas en disco a la estructura actual:

- Almacén de sesiones + transcripciones:
  - de `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
- Directorio del agente:
  - de `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
- Estado de autenticación de WhatsApp (Baileys):
  - desde `~/.openclaw/credentials/*.json` heredado (excepto `oauth.json`)
  - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (id de cuenta predeterminado: `default`)

Estas migraciones se realizan con el mejor esfuerzo y son idempotentes; doctor emitirá advertencias cuando
deje carpetas heredadas como copias de seguridad. Gateway/CLI también migra automáticamente
las sesiones heredadas + el directorio del agente al iniciar, para que el historial/autenticación/modelos lleguen a la
ruta por agente sin una ejecución manual de doctor. La autenticación de WhatsApp se migra intencionalmente solo
mediante `openclaw doctor`. La normalización del proveedor/mapa de proveedores de Talk ahora
compara por igualdad estructural, por lo que las diferencias solo en el orden de las claves ya no activan
cambios repetidos sin efecto de `doctor --fix`.

### 3a) Migraciones heredadas del manifiesto de plugins

Doctor analiza todos los manifiestos de plugins instalados en busca de claves
obsoletas de capacidades de nivel superior (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Cuando las encuentra, ofrece moverlas al objeto `contracts`
y reescribir el archivo del manifiesto en el lugar. Esta migración es idempotente;
si la clave `contracts` ya tiene los mismos valores, la clave heredada se elimina
sin duplicar los datos.

### 3b) Migraciones heredadas del almacén cron

Doctor también comprueba el almacén de trabajos cron (`~/.openclaw/cron/jobs.json` de forma predeterminada,
o `cron.store` cuando se sobrescribe) en busca de formas antiguas de trabajos que el programador todavía
acepta por compatibilidad.

Las limpiezas cron actuales incluyen:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- campos de carga útil de nivel superior (`message`, `model`, `thinking`, ...) → `payload`
- campos de entrega de nivel superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias de entrega `provider` en la carga útil → `delivery.channel` explícito
- trabajos simples heredados de respaldo de Webhook con `notify: true` → `delivery.mode="webhook"` explícito con `delivery.to=cron.webhook`

Doctor solo migra automáticamente trabajos con `notify: true` cuando puede hacerlo sin
cambiar el comportamiento. Si un trabajo combina respaldo heredado de notificación con un modo de
entrega existente que no es `webhook`, doctor advierte y deja ese trabajo para revisión manual.

### 3c) Limpieza de bloqueos de sesión

Doctor analiza cada directorio de sesión del agente en busca de archivos obsoletos de bloqueo de escritura: archivos dejados
atrás cuando una sesión salió de forma anómala. Por cada archivo de bloqueo encontrado informa:
la ruta, PID, si el PID sigue activo, antigüedad del bloqueo y si se
considera obsoleto (PID muerto o más de 30 minutos). En modo `--fix` / `--repair`
elimina automáticamente los archivos de bloqueo obsoletos; de lo contrario imprime una nota y
te indica volver a ejecutar con `--fix`.

### 4) Comprobaciones de integridad del estado (persistencia de sesión, enrutamiento y seguridad)

El directorio de estado es el tronco encefálico operativo. Si desaparece, pierdes
sesiones, credenciales, registros y configuración (a menos que tengas copias de seguridad en otro lugar).

Doctor comprueba:

- **Falta el directorio de estado**: advierte sobre una pérdida catastrófica de estado, pide recrear
  el directorio y te recuerda que no puede recuperar datos faltantes.
- **Permisos del directorio de estado**: verifica capacidad de escritura; ofrece reparar permisos
  (y emite una sugerencia de `chown` cuando detecta discrepancia de propietario/grupo).
- **Directorio de estado de macOS sincronizado con la nube**: advierte cuando el estado se resuelve bajo iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o
  `~/Library/CloudStorage/...` porque las rutas respaldadas por sincronización pueden causar I/O más lento
  y carreras de bloqueo/sincronización.
- **Directorio de estado Linux en SD o eMMC**: advierte cuando el estado se resuelve en un origen de montaje `mmcblk*`,
  porque el I/O aleatorio respaldado por SD o eMMC puede ser más lento y desgastarse
  más rápido con las escrituras de sesiones y credenciales.
- **Faltan directorios de sesión**: `sessions/` y el directorio del almacén de sesiones son
  necesarios para persistir el historial y evitar fallos `ENOENT`.
- **Desajuste de transcripciones**: advierte cuando entradas recientes de sesión tienen archivos
  de transcripción faltantes.
- **Sesión principal “JSONL de 1 línea”**: marca cuando la transcripción principal tiene solo una
  línea (el historial no se está acumulando).
- **Múltiples directorios de estado**: advierte cuando existen varias carpetas `~/.openclaw` en
  distintos directorios personales o cuando `OPENCLAW_STATE_DIR` apunta a otro lugar (el historial puede
  dividirse entre instalaciones).
- **Recordatorio de modo remoto**: si `gateway.mode=remote`, doctor te recuerda ejecutarlo en
  el host remoto (el estado vive allí).
- **Permisos del archivo de configuración**: advierte si `~/.openclaw/openclaw.json` es
  legible por grupo/mundo y ofrece restringirlo a `600`.

### 5) Estado de autenticación del modelo (vencimiento de OAuth)

Doctor inspecciona los perfiles OAuth en el almacén de autenticación, advierte cuando los tokens están
por vencer o vencidos, y puede actualizarlos cuando es seguro. Si el
perfil OAuth/token de Anthropic está obsoleto, sugiere una clave de API de Anthropic o la
ruta de token de configuración de Anthropic.
Los avisos de actualización solo aparecen al ejecutarse de forma interactiva (TTY); `--non-interactive`
omite los intentos de actualización.

Cuando una actualización OAuth falla de forma permanente (por ejemplo `refresh_token_reused`,
`invalid_grant`, o un proveedor te indica que vuelvas a iniciar sesión), doctor informa
que se requiere una nueva autenticación e imprime el comando exacto `openclaw models auth login --provider ...`
que debes ejecutar.

Doctor también informa perfiles de autenticación temporalmente inutilizables debido a:

- cooldowns breves (límites de tasa/tiempos de espera/fallos de autenticación)
- deshabilitaciones más largas (fallos de facturación/crédito)

### 6) Validación del modelo de hooks

Si `hooks.gmail.model` está establecido, doctor valida la referencia del modelo contra el
catálogo y la lista de permitidos, y advierte cuando no se resolverá o no está permitido.

### 7) Reparación de la imagen de sandbox

Cuando el sandboxing está habilitado, doctor comprueba las imágenes de Docker y ofrece compilar o
cambiar a nombres heredados si falta la imagen actual.

### 7b) Dependencias de tiempo de ejecución de plugins incluidos

Doctor verifica dependencias de tiempo de ejecución solo para plugins incluidos que estén activos en
la configuración actual o habilitados por el valor predeterminado de su manifiesto incluido, por ejemplo
`plugins.entries.discord.enabled: true`, el heredado
`channels.discord.enabled: true`, o un proveedor incluido habilitado por defecto. Si falta alguna,
doctor informa los paquetes y los instala en modo
`openclaw doctor --fix` / `openclaw doctor --repair`. Los plugins externos siguen
usando `openclaw plugins install` / `openclaw plugins update`; doctor no
instala dependencias para rutas arbitrarias de plugins.

### 8) Migraciones de servicios de Gateway y sugerencias de limpieza

Doctor detecta servicios heredados de gateway (launchd/systemd/schtasks) y
ofrece eliminarlos e instalar el servicio OpenClaw usando el puerto actual del gateway.
También puede analizar servicios adicionales similares a gateway e imprimir sugerencias de limpieza.
Los servicios de gateway de OpenClaw nombrados por perfil se consideran de primera clase y no se
marcan como "extra".

### 8b) Migración Matrix al inicio

Cuando una cuenta del canal Matrix tiene una migración de estado heredado pendiente o aplicable,
doctor (en modo `--fix` / `--repair`) crea una instantánea previa a la migración y luego
ejecuta los pasos de migración con el mejor esfuerzo: migración del estado heredado de Matrix y preparación
heredada del estado cifrado. Ambos pasos no son fatales; los errores se registran y
el inicio continúa. En modo de solo lectura (`openclaw doctor` sin `--fix`) esta comprobación
se omite por completo.

### 8c) Emparejamiento de dispositivos y deriva de autenticación

Doctor ahora inspecciona el estado de emparejamiento de dispositivos como parte del paso normal de estado.

Qué informa:

- solicitudes pendientes de primer emparejamiento
- actualizaciones pendientes de rol para dispositivos ya emparejados
- actualizaciones pendientes de ámbito para dispositivos ya emparejados
- reparaciones de discrepancia de clave pública donde el id del dispositivo aún coincide pero la
  identidad del dispositivo ya no coincide con el registro aprobado
- registros emparejados sin un token activo para un rol aprobado
- tokens emparejados cuyos ámbitos se desvían fuera de la base aprobada de emparejamiento
- entradas locales en caché de tokens de dispositivo para la máquina actual que son anteriores a una
  rotación de token del lado del gateway o que llevan metadatos obsoletos de ámbito

Doctor no aprueba automáticamente solicitudes de emparejamiento ni rota automáticamente tokens de dispositivo. En su lugar
imprime los pasos siguientes exactos:

- inspeccionar solicitudes pendientes con `openclaw devices list`
- aprobar la solicitud exacta con `openclaw devices approve <requestId>`
- rotar un token nuevo con `openclaw devices rotate --device <deviceId> --role <role>`
- eliminar y volver a aprobar un registro obsoleto con `openclaw devices remove <deviceId>`

Esto cierra el hueco común de "ya está emparejado pero sigue apareciendo que se requiere emparejamiento":
doctor ahora distingue entre primer emparejamiento, actualizaciones pendientes de rol/ámbito
y deriva obsoleta de token/identidad del dispositivo.

### 9) Advertencias de seguridad

Doctor emite advertencias cuando un proveedor está abierto a mensajes directos sin una lista de permitidos, o
cuando una política está configurada de manera peligrosa.

### 10) `linger` de systemd (Linux)

Si se está ejecutando como servicio de usuario de systemd, doctor asegura que `linger` esté habilitado para que el
gateway siga activo después de cerrar sesión.

### 11) Estado del espacio de trabajo (Skills, plugins y directorios heredados)

Doctor imprime un resumen del estado del espacio de trabajo para el agente predeterminado:

- **Estado de Skills**: cuenta Skills aptas, con requisitos faltantes y bloqueadas por lista de permitidos.
- **Directorios heredados del espacio de trabajo**: advierte cuando `~/openclaw` u otros directorios heredados del espacio de trabajo
  existen junto con el espacio de trabajo actual.
- **Estado de plugins**: cuenta plugins cargados/deshabilitados/con error; lista ids de plugins para cualquier
  error; informa capacidades de plugins incluidos.
- **Advertencias de compatibilidad de plugins**: marca plugins que tienen problemas de compatibilidad con
  el tiempo de ejecución actual.
- **Diagnósticos de plugins**: muestra cualquier advertencia o error de carga emitido por el
  registro de plugins.

### 11b) Tamaño del archivo bootstrap

Doctor comprueba si los archivos bootstrap del espacio de trabajo (por ejemplo `AGENTS.md`,
`CLAUDE.md`, u otros archivos de contexto inyectados) están cerca o por encima del presupuesto
configurado de caracteres. Informa por archivo recuentos de caracteres brutos frente a inyectados, porcentaje
de truncamiento, causa del truncamiento (`max/file` o `max/total`) y total de caracteres inyectados
como fracción del presupuesto total. Cuando los archivos están truncados o cerca del
límite, doctor imprime consejos para ajustar `agents.defaults.bootstrapMaxChars`
y `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Shell completion

Doctor comprueba si la finalización con tabulador está instalada para el shell actual
(zsh, bash, fish o PowerShell):

- Si el perfil del shell usa un patrón lento de finalización dinámica
  (`source <(openclaw completion ...)`), doctor lo actualiza a la variante más rápida
  de archivo en caché.
- Si la finalización está configurada en el perfil pero falta el archivo de caché,
  doctor regenera la caché automáticamente.
- Si no hay ninguna finalización configurada, doctor pide instalarla
  (solo en modo interactivo; se omite con `--non-interactive`).

Ejecuta `openclaw completion --write-state` para regenerar la caché manualmente.

### 12) Comprobaciones de autenticación de Gateway (token local)

Doctor comprueba la preparación de autenticación del token local de gateway.

- Si el modo de token necesita un token y no existe ninguna fuente de token, doctor ofrece generar uno.
- Si `gateway.auth.token` está gestionado por SecretRef pero no está disponible, doctor advierte y no lo sobrescribe con texto plano.
- `openclaw doctor --generate-gateway-token` fuerza la generación solo cuando no está configurado ningún SecretRef de token.

### 12b) Reparaciones de solo lectura con reconocimiento de SecretRef

Algunos flujos de reparación necesitan inspeccionar credenciales configuradas sin debilitar el comportamiento de fallo rápido en tiempo de ejecución.

- `openclaw doctor --fix` ahora usa el mismo modelo resumido de SecretRef de solo lectura que los comandos de la familia status para reparaciones de configuración dirigidas.
- Ejemplo: la reparación de `@username` de Telegram para `allowFrom` / `groupAllowFrom` intenta usar las credenciales configuradas del bot cuando están disponibles.
- Si el token del bot de Telegram está configurado mediante SecretRef pero no está disponible en la ruta actual del comando, doctor informa que la credencial está configurada pero no disponible y omite la resolución automática en lugar de fallar o informar incorrectamente que falta el token.

### 13) Comprobación de estado de Gateway + reinicio

Doctor ejecuta una comprobación de estado y ofrece reiniciar el gateway cuando parece
no estar en buen estado.

### 13b) Preparación de búsqueda en memoria

Doctor comprueba si el proveedor configurado de embeddings para búsqueda en memoria está listo
para el agente predeterminado. El comportamiento depende del backend y del proveedor configurados:

- **Backend QMD**: sondea si el binario `qmd` está disponible y puede iniciarse.
  Si no, imprime orientación de corrección, incluido el paquete npm y una opción manual de ruta al binario.
- **Proveedor local explícito**: comprueba si existe un archivo de modelo local o una URL reconocida
  de modelo remoto/descargable. Si falta, sugiere cambiar a un proveedor remoto.
- **Proveedor remoto explícito** (`openai`, `voyage`, etc.): verifica que una clave de API
  esté presente en el entorno o en el almacén de autenticación. Imprime sugerencias accionables si falta.
- **Proveedor automático**: comprueba primero la disponibilidad del modelo local y luego prueba cada proveedor remoto
  en el orden de selección automática.

Cuando hay disponible un resultado del sondeo del gateway (el gateway estaba en buen estado en el momento de la
comprobación), doctor cruza su resultado con la configuración visible para la CLI y señala
cualquier discrepancia.

Usa `openclaw memory status --deep` para verificar la preparación de embeddings en tiempo de ejecución.

### 14) Advertencias de estado de los canales

Si el gateway está en buen estado, doctor ejecuta un sondeo del estado de los canales e informa
advertencias con correcciones sugeridas.

### 15) Auditoría + reparación de la configuración del supervisor

Doctor comprueba la configuración instalada del supervisor (launchd/systemd/schtasks) en busca de
valores predeterminados faltantes u obsoletos (p. ej., dependencias `network-online` de systemd y
retraso de reinicio). Cuando encuentra una discrepancia, recomienda una actualización y puede
reescribir el archivo de servicio/tarea con los valores predeterminados actuales.

Notas:

- `openclaw doctor` pide confirmación antes de reescribir la configuración del supervisor.
- `openclaw doctor --yes` acepta las solicitudes de reparación predeterminadas.
- `openclaw doctor --repair` aplica las correcciones recomendadas sin avisos.
- `openclaw doctor --repair --force` sobrescribe configuraciones personalizadas del supervisor.
- Si la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación/reparación del servicio de doctor valida el SecretRef pero no persiste valores resueltos del token en texto plano en los metadatos del entorno del servicio del supervisor.
- Si la autenticación por token requiere un token y el SecretRef de token configurado no está resuelto, doctor bloquea la ruta de instalación/reparación con orientación accionable.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está establecido, doctor bloquea la instalación/reparación hasta que el modo se establezca explícitamente.
- Para unidades user-systemd de Linux, las comprobaciones de deriva de token de doctor ahora incluyen tanto fuentes `Environment=` como `EnvironmentFile=` al comparar metadatos de autenticación del servicio.
- Siempre puedes forzar una reescritura completa mediante `openclaw gateway install --force`.

### 16) Diagnósticos de tiempo de ejecución + puerto de Gateway

Doctor inspecciona el tiempo de ejecución del servicio (PID, último estado de salida) y advierte cuando el
servicio está instalado pero no se está ejecutando realmente. También comprueba colisiones de puerto
en el puerto del gateway (predeterminado `18789`) e informa causas probables (gateway ya
en ejecución, túnel SSH).

### 17) Mejores prácticas del tiempo de ejecución de Gateway

Doctor advierte cuando el servicio del gateway se ejecuta con Bun o con una ruta de Node gestionada por versiones
(`nvm`, `fnm`, `volta`, `asdf`, etc.). Los canales de WhatsApp + Telegram requieren Node,
y las rutas de gestores de versiones pueden fallar después de actualizaciones porque el servicio no
carga la inicialización de tu shell. Doctor ofrece migrar a una instalación de Node del sistema cuando
está disponible (Homebrew/apt/choco).

### 18) Escritura de configuración + metadatos del asistente

Doctor persiste cualquier cambio de configuración y marca metadatos del asistente para registrar la
ejecución de doctor.

### 19) Consejos del espacio de trabajo (copia de seguridad + sistema de memoria)

Doctor sugiere un sistema de memoria del espacio de trabajo cuando falta e imprime un consejo de copia de seguridad
si el espacio de trabajo todavía no está bajo git.

Consulta [/concepts/agent-workspace](/es/concepts/agent-workspace) para obtener una guía completa sobre la
estructura del espacio de trabajo y la copia de seguridad con git (se recomienda GitHub o GitLab privados).
