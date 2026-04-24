---
read_when:
    - Añadir o modificar migraciones de doctor
    - Introducir cambios de configuración incompatibles
summary: 'Comando doctor: comprobaciones de estado, migraciones de configuración y pasos de reparación'
title: Doctor
x-i18n:
    generated_at: "2026-04-24T05:28:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cc0ddb91af47a246c9a37528942b7d53c166255469169d6cb0268f83359c400
    source_path: gateway/doctor.md
    workflow: 15
---

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

Acepta los valores predeterminados sin pedir confirmación (incluidos pasos de reinicio/servicio/reparación de sandbox cuando corresponda).

```bash
openclaw doctor --repair
```

Aplica las reparaciones recomendadas sin pedir confirmación (reparaciones + reinicios cuando es seguro).

```bash
openclaw doctor --repair --force
```

Aplica también reparaciones agresivas (sobrescribe configuraciones de supervisor personalizadas).

```bash
openclaw doctor --non-interactive
```

Se ejecuta sin indicaciones y solo aplica migraciones seguras (normalización de configuración + movimientos de estado en disco). Omite acciones de reinicio/servicio/sandbox que requieren confirmación humana.
Las migraciones de estado heredadas se ejecutan automáticamente cuando se detectan.

```bash
openclaw doctor --deep
```

Explora servicios del sistema en busca de instalaciones adicionales de gateway (launchd/systemd/schtasks).

Si quieres revisar los cambios antes de escribir, abre primero el archivo de configuración:

```bash
cat ~/.openclaw/openclaw.json
```

## Qué hace (resumen)

- Actualización opcional previa para instalaciones git (solo interactivo).
- Comprobación de actualización del protocolo de UI (reconstruye Control UI cuando el esquema del protocolo es más reciente).
- Comprobación de estado + solicitud de reinicio.
- Resumen del estado de Skills (elegibles/faltantes/bloqueadas) y estado del Plugin.
- Normalización de configuración para valores heredados.
- Migración de configuración de Talk desde campos planos heredados `talk.*` a `talk.provider` + `talk.providers.<provider>`.
- Comprobaciones de migración del navegador para configuraciones heredadas de extensiones de Chrome y preparación de Chrome MCP.
- Advertencias de sobrescritura del proveedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Advertencias de sombreado de OAuth de Codex (`models.providers.openai-codex`).
- Comprobación de requisitos previos TLS de OAuth para perfiles OAuth de OpenAI Codex.
- Migración heredada de estado en disco (sesiones/directorio de agente/autenticación de WhatsApp).
- Migración de claves heredadas de contrato de manifiesto de Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migración heredada del almacén de Cron (`jobId`, `schedule.cron`, campos de entrega/carga útil de nivel superior, `provider` de la carga útil, trabajos de respaldo de webhook simples con `notify: true`).
- Inspección de archivos de bloqueo de sesión y limpieza de bloqueos obsoletos.
- Comprobaciones de integridad y permisos del estado (sesiones, transcripciones, directorio de estado).
- Comprobaciones de permisos del archivo de configuración (chmod 600) al ejecutarse localmente.
- Estado de autenticación del modelo: comprueba la caducidad de OAuth, puede renovar tokens próximos a caducar e informa de estados de cooldown/deshabilitación de perfiles de autenticación.
- Detección de directorio adicional del espacio de trabajo (`~/openclaw`).
- Reparación de imagen de sandbox cuando el sandboxing está habilitado.
- Migración heredada de servicio y detección de gateways adicionales.
- Migración heredada del estado del canal Matrix (en modo `--fix` / `--repair`).
- Comprobaciones del entorno de ejecución de Gateway (servicio instalado pero no ejecutándose; etiqueta launchd en caché).
- Advertencias de estado de canales (sondeadas desde el gateway en ejecución).
- Auditoría de configuración del supervisor (launchd/systemd/schtasks) con reparación opcional.
- Comprobaciones de buenas prácticas del entorno de ejecución de Gateway (Node frente a Bun, rutas de administradores de versiones).
- Diagnóstico de colisión de puertos de Gateway (predeterminado `18789`).
- Advertencias de seguridad para políticas abiertas de mensajes directos.
- Comprobaciones de autenticación de Gateway para modo de token local (ofrece generación de token cuando no existe una fuente de token; no sobrescribe configuraciones de token SecretRef).
- Detección de problemas de emparejamiento de dispositivos (primeras solicitudes de emparejamiento pendientes, actualizaciones pendientes de rol/alcance, deriva obsoleta de caché local de token de dispositivo y deriva de autenticación de registros emparejados).
- Comprobación de linger de systemd en Linux.
- Comprobación del tamaño de archivos bootstrap del espacio de trabajo (advertencias de truncamiento/casi en el límite para archivos de contexto).
- Comprobación del estado de autocompletado del shell e instalación/actualización automática.
- Comprobación de preparación del proveedor de embeddings para búsqueda en memoria (modelo local, clave API remota o binario QMD).
- Comprobaciones de instalación desde código fuente (desajuste del espacio de trabajo pnpm, recursos de UI ausentes, binario tsx ausente).
- Escribe configuración actualizada + metadatos del asistente.

## Backfill y restablecimiento de Dreams UI

La escena Dreams de Control UI incluye acciones de **Backfill**, **Reset** y **Clear Grounded**
para el flujo de trabajo de Dreaming fundamentado. Estas acciones usan métodos RPC
de estilo doctor de gateway, pero **no** forman parte de la reparación/migración de la CLI `openclaw doctor`.

Qué hacen:

- **Backfill** explora archivos históricos `memory/YYYY-MM-DD.md` en el espacio de trabajo activo,
  ejecuta el paso de diario REM fundamentado y escribe entradas reversibles de backfill en `DREAMS.md`.
- **Reset** elimina solo esas entradas de diario de backfill marcadas de `DREAMS.md`.
- **Clear Grounded** elimina solo entradas provisionales a corto plazo únicamente fundamentadas que
  provienen de una reproducción histórica y que aún no han acumulado recuerdo en vivo ni
  soporte diario.

Lo que **no** hacen por sí mismas:

- no editan `MEMORY.md`
- no ejecutan migraciones completas de doctor
- no preparan automáticamente candidatos fundamentados en el almacén activo de
  promoción a corto plazo a menos que ejecutes explícitamente primero la ruta CLI de preparación

Si quieres que la reproducción histórica fundamentada influya en la ruta normal de promoción profunda,
usa en su lugar el flujo de CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Eso prepara candidatos duraderos fundamentados en el almacén de Dreaming a corto plazo mientras
mantiene `DREAMS.md` como superficie de revisión.

## Comportamiento detallado y justificación

### 0) Actualización opcional (instalaciones git)

Si esto es un checkout de git y doctor se ejecuta de forma interactiva, ofrece
actualizar (fetch/rebase/build) antes de ejecutar doctor.

### 1) Normalización de configuración

Si la configuración contiene formatos heredados de valores (por ejemplo `messages.ackReaction`
sin una sobrescritura específica de canal), doctor los normaliza al esquema actual.

Eso incluye campos planos heredados de Talk. La configuración pública actual de Talk es
`talk.provider` + `talk.providers.<provider>`. Doctor reescribe las formas antiguas
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` en el mapa de proveedor.

### 2) Migraciones de claves heredadas de configuración

Cuando la configuración contiene claves obsoletas, otros comandos se niegan a ejecutarse y te piden
que ejecutes `openclaw doctor`.

Doctor hará lo siguiente:

- Explicar qué claves heredadas se encontraron.
- Mostrar la migración que aplicó.
- Reescribir `~/.openclaw/openclaw.json` con el esquema actualizado.

Gateway también ejecuta automáticamente migraciones de doctor al arrancar cuando detecta un
formato heredado de configuración, por lo que las configuraciones obsoletas se reparan sin intervención manual.
Las migraciones del almacén de Cron se gestionan con `openclaw doctor --fix`.

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
- Para canales con `accounts` con nombre pero con valores de canal de nivel superior de cuenta única aún presentes, mover esos valores con alcance de cuenta a la cuenta promovida elegida para ese canal (`accounts.default` para la mayoría de los canales; Matrix puede conservar un destino con nombre/predeterminado coincidente existente)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- eliminar `browser.relayBindHost` (ajuste heredado del relay de extensión)

Las advertencias de doctor también incluyen orientación sobre cuenta predeterminada para canales con múltiples cuentas:

- Si hay configuradas dos o más entradas `channels.<channel>.accounts` sin `channels.<channel>.defaultAccount` ni `accounts.default`, doctor advierte que el enrutamiento de respaldo puede elegir una cuenta inesperada.
- Si `channels.<channel>.defaultAccount` está establecido en un ID de cuenta desconocido, doctor advierte y enumera los IDs de cuenta configurados.

### 2b) Sobrescrituras del proveedor OpenCode

Si has añadido manualmente `models.providers.opencode`, `opencode-zen` u `opencode-go`,
esto sobrescribe el catálogo integrado de OpenCode de `@mariozechner/pi-ai`.
Eso puede forzar modelos a la API incorrecta o poner los costos a cero. Doctor advierte para que
puedas eliminar la sobrescritura y restaurar el enrutamiento por API por modelo + costos.

### 2c) Migración de navegador y preparación de Chrome MCP

Si tu configuración del navegador aún apunta a la ruta eliminada de extensión de Chrome, doctor
la normaliza al modelo actual de conexión local al host de Chrome MCP:

- `browser.profiles.*.driver: "extension"` pasa a ser `"existing-session"`
- se elimina `browser.relayBindHost`

Doctor también audita la ruta local al host de Chrome MCP cuando usas `defaultProfile:
"user"` o un perfil `existing-session` configurado:

- comprueba si Google Chrome está instalado en el mismo host para perfiles predeterminados
  de conexión automática
- comprueba la versión detectada de Chrome y advierte cuando es inferior a Chrome 144
- recuerda habilitar la depuración remota en la página inspect del navegador (por
  ejemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  o `edge://inspect/#remote-debugging`)

Doctor no puede habilitar por ti el ajuste del lado de Chrome. Chrome MCP local al host
sigue requiriendo:

- un navegador basado en Chromium 144+ en el host gateway/node
- el navegador ejecutándose localmente
- depuración remota habilitada en ese navegador
- aprobar la primera solicitud de consentimiento de conexión en el navegador

La preparación aquí se refiere solo a los requisitos previos de conexión local. Existing-session conserva
los límites actuales de ruta de Chrome MCP; rutas avanzadas como `responsebody`, exportación PDF,
interceptación de descargas y acciones por lotes siguen requiriendo un
navegador gestionado o un perfil CDP sin procesar.

Esta comprobación **no** se aplica a Docker, sandbox, remote-browser ni a otros
flujos sin interfaz. Esos siguen usando CDP sin procesar.

### 2d) Requisitos previos TLS de OAuth

Cuando se configura un perfil OAuth de OpenAI Codex, doctor sondea el endpoint de autorización
de OpenAI para verificar que la pila TLS local de Node/OpenSSL pueda
validar la cadena de certificados. Si el sondeo falla con un error de certificado (por
ejemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado caducado o certificado autofirmado),
doctor imprime orientación específica por plataforma para la corrección. En macOS con Node de Homebrew, la
corrección suele ser `brew postinstall ca-certificates`. Con `--deep`, el sondeo se ejecuta
incluso si el gateway está en buen estado.

### 2c) Sobrescrituras del proveedor OAuth de Codex

Si anteriormente añadiste ajustes heredados de transporte de OpenAI bajo
`models.providers.openai-codex`, pueden ensombrecer la ruta integrada del
proveedor OAuth de Codex que las versiones más recientes usan automáticamente. Doctor
advierte cuando ve esos ajustes heredados de transporte junto con Codex OAuth para que puedas
eliminar o reescribir la sobrescritura obsoleta de transporte y recuperar el comportamiento
integrado de enrutamiento/respaldo. Los proxies personalizados y las sobrescrituras solo de encabezados
siguen siendo compatibles y no activan esta advertencia.

### 3) Migraciones heredadas de estado (diseño en disco)

Doctor puede migrar diseños antiguos en disco a la estructura actual:

- Almacén de sesiones + transcripciones:
  - de `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
- Directorio de agente:
  - de `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
- Estado de autenticación de WhatsApp (Baileys):
  - desde `~/.openclaw/credentials/*.json` heredado (excepto `oauth.json`)
  - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de cuenta predeterminado: `default`)

Estas migraciones son de mejor esfuerzo e idempotentes; doctor emitirá advertencias cuando
deje carpetas heredadas como copias de seguridad. Gateway/CLI también migra automáticamente
las sesiones heredadas + el directorio de agente al iniciar, de modo que historial/autenticación/modelos
lleguen a la ruta por agente sin ejecutar doctor manualmente. La autenticación de WhatsApp se migra
intencionalmente solo mediante `openclaw doctor`. La normalización de Talk provider/provider-map ahora
compara por igualdad estructural, por lo que las diferencias solo en el orden de claves ya no activan
cambios repetidos sin efecto en `doctor --fix`.

### 3a) Migraciones heredadas de manifiestos de Plugin

Doctor explora todos los manifiestos de Plugin instalados en busca de claves obsoletas de capacidad
de nivel superior (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Cuando las encuentra, ofrece moverlas al objeto `contracts`
y reescribir el archivo de manifiesto en el lugar. Esta migración es idempotente;
si la clave `contracts` ya tiene los mismos valores, la clave heredada se elimina
sin duplicar los datos.

### 3b) Migraciones heredadas del almacén de Cron

Doctor también comprueba el almacén de trabajos de Cron (`~/.openclaw/cron/jobs.json` por defecto,
o `cron.store` cuando se sobrescribe) en busca de formatos antiguos de trabajos que el planificador
sigue aceptando por compatibilidad.

Las limpiezas actuales de Cron incluyen:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- campos de carga útil de nivel superior (`message`, `model`, `thinking`, ...) → `payload`
- campos de entrega de nivel superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias de entrega `provider` de la carga útil → `delivery.channel` explícito
- trabajos heredados simples de respaldo de webhook con `notify: true` → `delivery.mode="webhook"` explícito con `delivery.to=cron.webhook`

Doctor solo migra automáticamente trabajos `notify: true` cuando puede hacerlo sin
cambiar el comportamiento. Si un trabajo combina respaldo heredado de notify con un modo
de entrega existente que no es webhook, doctor advierte y deja ese trabajo para revisión manual.

### 3c) Limpieza de bloqueos de sesión

Doctor explora cada directorio de sesiones de agente en busca de archivos de bloqueo de escritura obsoletos: archivos dejados
atrás cuando una sesión terminó anormalmente. Para cada archivo de bloqueo encontrado informa:
la ruta, PID, si el PID sigue activo, la antigüedad del bloqueo y si se
considera obsoleto (PID muerto o con más de 30 minutos). En modo `--fix` / `--repair`
elimina automáticamente los archivos de bloqueo obsoletos; en caso contrario imprime una nota y
te indica que vuelvas a ejecutar con `--fix`.

### 4) Comprobaciones de integridad del estado (persistencia de sesión, enrutamiento y seguridad)

El directorio de estado es el tronco encefálico operativo. Si desaparece, pierdes
sesiones, credenciales, registros y configuración (a menos que tengas copias de seguridad en otro lugar).

Doctor comprueba:

- **Falta el directorio de estado**: advierte sobre una pérdida catastrófica del estado, pide recrear
  el directorio y recuerda que no puede recuperar los datos faltantes.
- **Permisos del directorio de estado**: verifica que se pueda escribir; ofrece reparar permisos
  (y emite una sugerencia de `chown` cuando detecta desajuste de propietario/grupo).
- **Directorio de estado sincronizado con la nube en macOS**: advierte cuando el estado se resuelve bajo iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o
  `~/Library/CloudStorage/...` porque las rutas respaldadas por sincronización pueden causar E/S más lenta
  y condiciones de carrera de bloqueo/sincronización.
- **Directorio de estado en SD o eMMC en Linux**: advierte cuando el estado se resuelve a una fuente de montaje `mmcblk*`,
  porque la E/S aleatoria respaldada por SD o eMMC puede ser más lenta y desgastarse
  más rápido con escrituras de sesión y credenciales.
- **Faltan directorios de sesiones**: `sessions/` y el directorio del almacén de sesiones son
  necesarios para conservar el historial y evitar fallos `ENOENT`.
- **Desajuste de transcripción**: advierte cuando entradas recientes de sesión tienen
  archivos de transcripción ausentes.
- **Sesión principal “JSONL de 1 línea”**: señala cuando la transcripción principal tiene solo una
  línea (el historial no se está acumulando).
- **Varios directorios de estado**: advierte cuando existen varias carpetas `~/.openclaw`
  entre directorios personales o cuando `OPENCLAW_STATE_DIR` apunta a otro lugar (el historial puede
  dividirse entre instalaciones).
- **Recordatorio de modo remoto**: si `gateway.mode=remote`, doctor te recuerda que debes ejecutarlo
  en el host remoto (el estado vive allí).
- **Permisos del archivo de configuración**: advierte si `~/.openclaw/openclaw.json` puede ser leído
  por grupo/todos y ofrece ajustarlo a `600`.

### 5) Estado de autenticación del modelo (caducidad de OAuth)

Doctor inspecciona perfiles OAuth en el almacén de autenticación, advierte cuando los tokens están
a punto de caducar o caducados y puede renovarlos cuando es seguro. Si el perfil
OAuth/token de Anthropic está obsoleto, sugiere una clave API de Anthropic o la
ruta de setup-token de Anthropic.
Las solicitudes de renovación solo aparecen al ejecutarse de forma interactiva (TTY); `--non-interactive`
omite los intentos de renovación.

Cuando una renovación OAuth falla permanentemente (por ejemplo `refresh_token_reused`,
`invalid_grant` o un proveedor indica que debes volver a iniciar sesión), doctor informa
que se requiere volver a autenticar y muestra el comando exacto `openclaw models auth login --provider ...`
que debes ejecutar.

Doctor también informa perfiles de autenticación temporalmente inutilizables debido a:

- cooldowns cortos (límites de tasa/tiempos de espera/fallos de autenticación)
- deshabilitaciones más largas (fallos de facturación/crédito)

### 6) Validación del modelo de Hooks

Si `hooks.gmail.model` está establecido, doctor valida la referencia del modelo respecto al
catálogo y la allowlist y advierte cuando no se resolverá o no está permitido.

### 7) Reparación de imagen de sandbox

Cuando el sandboxing está habilitado, doctor comprueba las imágenes de Docker y ofrece compilar o
cambiar a nombres heredados si falta la imagen actual.

### 7b) Dependencias de entorno de ejecución de Plugin integrado

Doctor verifica dependencias de entorno de ejecución solo para Plugins integrados que están activos en
la configuración actual o habilitados por el valor predeterminado del manifiesto integrado, por ejemplo
`plugins.entries.discord.enabled: true`, el heredado
`channels.discord.enabled: true`, o un proveedor integrado habilitado por defecto. Si falta alguna,
doctor informa los paquetes y los instala en modo
`openclaw doctor --fix` / `openclaw doctor --repair`. Los Plugins externos siguen
usando `openclaw plugins install` / `openclaw plugins update`; doctor no
instala dependencias para rutas de Plugin arbitrarias.

### 8) Migraciones de servicio de Gateway y sugerencias de limpieza

Doctor detecta servicios heredados de gateway (launchd/systemd/schtasks) y
ofrece eliminarlos e instalar el servicio OpenClaw usando el puerto actual del gateway.
También puede explorar servicios adicionales similares a gateway e imprimir sugerencias de limpieza.
Los servicios Gateway de OpenClaw con nombre de perfil se consideran de primera clase y no
se señalan como "adicionales".

### 8b) Migración de Matrix al inicio

Cuando una cuenta de canal Matrix tiene una migración heredada de estado pendiente o accionable,
doctor (en modo `--fix` / `--repair`) crea una instantánea previa a la migración y luego
ejecuta los pasos de migración con el mejor esfuerzo posible: migración heredada del estado de Matrix
y preparación heredada del estado cifrado. Ambos pasos no son fatales; los errores se registran y
el inicio continúa. En modo de solo lectura (`openclaw doctor` sin `--fix`) esta comprobación
se omite por completo.

### 8c) Emparejamiento de dispositivos y deriva de autenticación

Doctor ahora inspecciona el estado de emparejamiento de dispositivos como parte del paso normal de estado.

Lo que informa:

- primeras solicitudes de emparejamiento pendientes
- actualizaciones de rol pendientes para dispositivos ya emparejados
- actualizaciones de alcance pendientes para dispositivos ya emparejados
- reparaciones de desajuste de clave pública donde el ID del dispositivo sigue coincidiendo pero la
  identidad del dispositivo ya no coincide con el registro aprobado
- registros emparejados sin un token activo para un rol aprobado
- tokens emparejados cuyos alcances se desvían fuera de la línea base aprobada del emparejamiento
- entradas locales en caché de token de dispositivo para la máquina actual que son anteriores a una
  rotación de token del lado del gateway o que llevan metadatos de alcance obsoletos

Doctor no aprueba automáticamente solicitudes de emparejamiento ni rota automáticamente tokens de dispositivo. En su lugar,
imprime los pasos siguientes exactos:

- inspeccionar solicitudes pendientes con `openclaw devices list`
- aprobar la solicitud exacta con `openclaw devices approve <requestId>`
- rotar un token nuevo con `openclaw devices rotate --device <deviceId> --role <role>`
- eliminar y volver a aprobar un registro obsoleto con `openclaw devices remove <deviceId>`

Esto cierra el caso común de “ya emparejado pero sigue apareciendo pairing required”:
doctor ahora distingue entre primer emparejamiento, actualizaciones pendientes de rol/alcance
y deriva obsoleta de token/identidad de dispositivo.

### 9) Advertencias de seguridad

Doctor emite advertencias cuando un proveedor está abierto a mensajes directos sin una allowlist, o
cuando una política está configurada de forma peligrosa.

### 10) systemd linger (Linux)

Si se ejecuta como servicio de usuario de systemd, doctor asegura que lingering esté habilitado para que el
gateway siga activo después de cerrar sesión.

### 11) Estado del espacio de trabajo (Skills, Plugins y directorios heredados)

Doctor imprime un resumen del estado del espacio de trabajo para el agente predeterminado:

- **Estado de Skills**: cuenta Skills elegibles, con requisitos faltantes y bloqueadas por allowlist.
- **Directorios heredados del espacio de trabajo**: advierte cuando `~/openclaw` u otros directorios heredados del espacio de trabajo
  existen junto con el espacio de trabajo actual.
- **Estado del Plugin**: cuenta Plugins cargados/deshabilitados/con error; enumera IDs de Plugin para cualquier
  error; informa capacidades del Plugin integrado.
- **Advertencias de compatibilidad del Plugin**: señala Plugins que tienen problemas de compatibilidad con
  el entorno de ejecución actual.
- **Diagnósticos del Plugin**: muestra cualquier advertencia o error en tiempo de carga emitido por el
  registro de Plugins.

### 11b) Tamaño del archivo bootstrap

Doctor comprueba si los archivos bootstrap del espacio de trabajo (por ejemplo `AGENTS.md`,
`CLAUDE.md` u otros archivos de contexto inyectados) están cerca o por encima del presupuesto configurado
de caracteres. Informa conteos de caracteres raw frente a injected por archivo, porcentaje de truncamiento,
causa del truncamiento (`max/file` o `max/total`) y total de caracteres
inyectados como fracción del presupuesto total. Cuando los archivos están truncados o cerca
del límite, doctor imprime sugerencias para ajustar `agents.defaults.bootstrapMaxChars`
y `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Autocompletado del shell

Doctor comprueba si el autocompletado con tabulador está instalado para el shell actual
(zsh, bash, fish o PowerShell):

- Si el perfil del shell usa un patrón lento de autocompletado dinámico
  (`source <(openclaw completion ...)`), doctor lo actualiza a la variante
  más rápida de archivo en caché.
- Si el autocompletado está configurado en el perfil pero falta el archivo de caché,
  doctor regenera la caché automáticamente.
- Si no hay ningún autocompletado configurado, doctor pide instalarlo
  (solo en modo interactivo; se omite con `--non-interactive`).

Ejecuta `openclaw completion --write-state` para regenerar la caché manualmente.

### 12) Comprobaciones de autenticación de Gateway (token local)

Doctor comprueba la preparación de autenticación por token local de Gateway.

- Si el modo token necesita un token y no existe ninguna fuente de token, doctor ofrece generar uno.
- Si `gateway.auth.token` está gestionado por SecretRef pero no está disponible, doctor advierte y no lo sobrescribe con texto plano.
- `openclaw doctor --generate-gateway-token` fuerza la generación solo cuando no hay configurado ningún token SecretRef.

### 12b) Reparaciones de solo lectura conscientes de SecretRef

Algunos flujos de reparación necesitan inspeccionar credenciales configuradas sin debilitar el comportamiento fail-fast del entorno de ejecución.

- `openclaw doctor --fix` ahora usa el mismo modelo resumido de SecretRef de solo lectura que los comandos de la familia status para reparaciones dirigidas de configuración.
- Ejemplo: la reparación de `allowFrom` / `groupAllowFrom` `@username` de Telegram intenta usar credenciales configuradas del bot cuando están disponibles.
- Si el token del bot de Telegram está configurado mediante SecretRef pero no está disponible en la ruta actual del comando, doctor informa que la credencial está configurada pero no disponible y omite la resolución automática en lugar de fallar o informar incorrectamente que falta el token.

### 13) Comprobación de estado de Gateway + reinicio

Doctor ejecuta una comprobación de estado y ofrece reiniciar el gateway cuando parece
estar en mal estado.

### 13b) Preparación de búsqueda en memoria

Doctor comprueba si el proveedor configurado de embeddings de búsqueda en memoria está listo
para el agente predeterminado. El comportamiento depende del backend y proveedor configurados:

- **Backend QMD**: sondea si el binario `qmd` está disponible y puede iniciarse.
  Si no, imprime orientación de corrección, incluido el paquete npm y una opción manual de ruta binaria.
- **Proveedor local explícito**: comprueba si existe un archivo de modelo local o una URL de modelo
  remota/descargable reconocida. Si falta, sugiere cambiar a un proveedor remoto.
- **Proveedor remoto explícito** (`openai`, `voyage`, etc.): verifica que haya una clave API
  presente en el entorno o el almacén de autenticación. Imprime sugerencias de corrección accionables si falta.
- **Proveedor automático**: comprueba primero la disponibilidad del modelo local y luego intenta cada proveedor
  remoto según el orden de selección automática.

Cuando hay disponible un resultado de sondeo del gateway (el gateway estaba en buen estado en el momento de la
comprobación), doctor cruza ese resultado con la configuración visible desde la CLI y señala
cualquier discrepancia.

Usa `openclaw memory status --deep` para verificar la preparación de embeddings en tiempo de ejecución.

### 14) Advertencias de estado de canales

Si el gateway está en buen estado, doctor ejecuta un sondeo de estado de canales e informa
advertencias con correcciones sugeridas.

### 15) Auditoría + reparación de configuración del supervisor

Doctor comprueba la configuración instalada del supervisor (launchd/systemd/schtasks) en busca de
valores predeterminados ausentes u obsoletos (por ejemplo, dependencias de systemd `network-online` y
retraso de reinicio). Cuando encuentra una discrepancia, recomienda una actualización y puede
reescribir el archivo/tarea del servicio a los valores predeterminados actuales.

Notas:

- `openclaw doctor` pide confirmación antes de reescribir la configuración del supervisor.
- `openclaw doctor --yes` acepta las solicitudes de reparación predeterminadas.
- `openclaw doctor --repair` aplica correcciones recomendadas sin solicitudes.
- `openclaw doctor --repair --force` sobrescribe configuraciones personalizadas del supervisor.
- Si la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación/reparación del servicio por doctor valida el SecretRef, pero no conserva valores de token resueltos en texto plano en los metadatos del entorno del servicio supervisor.
- Si la autenticación por token requiere un token y el SecretRef configurado del token no se resuelve, doctor bloquea la ruta de instalación/reparación con orientación accionable.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está configurado, doctor bloquea la instalación/reparación hasta que el modo se configure explícitamente.
- Para unidades user-systemd en Linux, las comprobaciones de deriva de token de doctor ahora incluyen tanto las fuentes `Environment=` como `EnvironmentFile=` al comparar metadatos de autenticación del servicio.
- Siempre puedes forzar una reescritura completa mediante `openclaw gateway install --force`.

### 16) Diagnósticos del entorno de ejecución + puerto de Gateway

Doctor inspecciona el entorno de ejecución del servicio (PID, último estado de salida) y advierte cuando el
servicio está instalado pero no se está ejecutando realmente. También comprueba colisiones de puertos
en el puerto del gateway (predeterminado `18789`) e informa de causas probables (gateway ya
en ejecución, túnel SSH).

### 17) Buenas prácticas del entorno de ejecución de Gateway

Doctor advierte cuando el servicio de gateway se ejecuta sobre Bun o una ruta de Node gestionada por version manager
(`nvm`, `fnm`, `volta`, `asdf`, etc.). Los canales de WhatsApp + Telegram requieren Node,
y las rutas de administradores de versiones pueden romperse después de actualizaciones porque el servicio no
carga la inicialización de tu shell. Doctor ofrece migrar a una instalación de Node del sistema cuando
está disponible (Homebrew/apt/choco).

### 18) Escritura de configuración + metadatos del asistente

Doctor conserva cualquier cambio de configuración y registra metadatos del asistente para registrar la
ejecución de doctor.

### 19) Consejos del espacio de trabajo (copia de seguridad + sistema de memoria)

Doctor sugiere un sistema de memoria del espacio de trabajo cuando falta e imprime un consejo de copia de seguridad
si el espacio de trabajo no está ya bajo git.

Consulta [/concepts/agent-workspace](/es/concepts/agent-workspace) para una guía completa de
la estructura del espacio de trabajo y la copia de seguridad con git (se recomienda GitHub o GitLab privado).

## Relacionado

- [Solución de problemas de Gateway](/es/gateway/troubleshooting)
- [Guía operativa de Gateway](/es/gateway)
