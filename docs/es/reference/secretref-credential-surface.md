---
read_when:
    - Verificación de la cobertura de credenciales SecretRef
    - Auditoría de si una credencial es apta para `secrets configure` o `secrets apply`
    - Verificación de por qué una credencial está fuera de la superficie compatible
summary: Superficie canónica compatible y no compatible de credenciales SecretRef
title: Superficie de credenciales SecretRef
x-i18n:
    generated_at: "2026-07-19T02:09:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 396336826e6ac16440a26630a34030b70f3c4e2d75c699c743f07821c035ad72
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Esta página define la superficie canónica de credenciales SecretRef: qué campos de credenciales aceptan una `SecretRef` (referencia respaldada por env/file/exec) en lugar de un valor secreto sin procesar.

Alcance:

- Incluido en el alcance: estrictamente las credenciales proporcionadas por el usuario que OpenClaw no emite ni rota.
- Fuera del alcance: credenciales emitidas o rotadas durante la ejecución, material de actualización de OAuth y artefactos similares a sesiones.

Las listas siguientes se generan a partir del registro de destinos del código fuente y se comprueban con `docs/reference/secretref-user-supplied-credentials-matrix.json` en la CI; no edite las entradas manualmente.

## Credenciales compatibles

### Destinos de `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

[//]: # "secretref-supported-list-start"

- `models.providers.*.apiKey`
- `models.providers.*.headers.*`
- `models.providers.*.request.auth.token`
- `models.providers.*.request.auth.value`
- `models.providers.*.request.headers.*`
- `models.providers.*.request.proxy.tls.ca`
- `models.providers.*.request.proxy.tls.cert`
- `models.providers.*.request.proxy.tls.key`
- `models.providers.*.request.proxy.tls.passphrase`
- `models.providers.*.request.tls.ca`
- `models.providers.*.request.tls.cert`
- `models.providers.*.request.tls.key`
- `models.providers.*.request.tls.passphrase`
- `skills.entries.*.apiKey`
- `agents.defaults.memorySearch.remote.apiKey`
- `agents.list[].tts.providers.*.apiKey`
- `agents.list[].memorySearch.remote.apiKey`
- `talk.providers.*.apiKey`
- `talk.realtime.providers.*.apiKey`
- `messages.tts.providers.*.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.acpx.config.mcpServers.*.env.*`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.codex.config.appServer.authToken`
- `plugins.entries.codex.config.appServer.headers.*`
- `plugins.entries.exa.config.webSearch.apiKey`
- `plugins.entries.google-meet.config.realtime.providers.*.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.minimax.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
- `plugins.entries.parallel.config.webSearch.apiKey`
- `plugins.entries.voice-call.config.realtime.providers.*.apiKey`
- `plugins.entries.voice-call.config.streaming.providers.*.apiKey`
- `plugins.entries.voice-call.config.tts.providers.*.apiKey`
- `plugins.entries.voice-call.config.twilio.authToken`
- `plugins.entries.webhooks.config.routes.*.secret`
- `tools.web.search.*.apiKey`
- `tools.web.search.apiKey`
- `gateway.auth.password`
- `gateway.auth.token`
- `gateway.remote.token`
- `gateway.remote.password`
- `cron.webhookToken`
- `channels.telegram.botToken`
- `channels.telegram.webhookSecret`
- `channels.telegram.accounts.*.botToken`
- `channels.telegram.accounts.*.webhookSecret`
- `channels.slack.botToken`
- `channels.slack.appToken`
- `channels.slack.relay.authToken`
- `channels.slack.userToken`
- `channels.slack.signingSecret`
- `channels.slack.accounts.*.botToken`
- `channels.slack.accounts.*.appToken`
- `channels.slack.accounts.*.relay.authToken`
- `channels.slack.accounts.*.userToken`
- `channels.slack.accounts.*.signingSecret`
- `channels.sms.authToken`
- `channels.sms.accounts.*.authToken`
- `channels.clickclack.token`
- `channels.clickclack.accounts.*.token`
- `channels.discord.token`
- `channels.discord.pluralkit.token`
- `channels.discord.voice.tts.providers.*.apiKey`
- `channels.discord.accounts.*.token`
- `channels.discord.accounts.*.pluralkit.token`
- `channels.discord.accounts.*.voice.tts.providers.*.apiKey`
- `channels.irc.password`
- `channels.irc.nickserv.password`
- `channels.irc.accounts.*.password`
- `channels.irc.accounts.*.nickserv.password`
- `channels.feishu.appSecret`
- `channels.feishu.encryptKey`
- `channels.feishu.verificationToken`
- `channels.feishu.accounts.*.appSecret`
- `channels.feishu.accounts.*.encryptKey`
- `channels.feishu.accounts.*.verificationToken`
- `channels.qqbot.clientSecret`
- `channels.qqbot.accounts.*.clientSecret`
- `channels.msteams.appPassword`
- `channels.mattermost.botToken`
- `channels.mattermost.accounts.*.botToken`
- `channels.matrix.accessToken`
- `channels.matrix.password`
- `channels.matrix.accounts.*.accessToken`
- `channels.matrix.accounts.*.password`
- `channels.nextcloud-talk.botSecret`
- `channels.nextcloud-talk.apiPassword`
- `channels.nextcloud-talk.accounts.*.botSecret`
- `channels.nextcloud-talk.accounts.*.apiPassword`
- `channels.zalo.botToken`
- `channels.zalo.webhookSecret`
- `channels.zalo.accounts.*.botToken`
- `channels.zalo.accounts.*.webhookSecret`
- `channels.googlechat.serviceAccount` mediante el elemento hermano `serviceAccountRef` (excepción de compatibilidad)
- `channels.googlechat.accounts.*.serviceAccount` mediante el elemento hermano `serviceAccountRef` (excepción de compatibilidad)

### Destinos de `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; no compatible cuando `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; no compatible cuando `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Notas:

- Los destinos del plan de perfiles de autenticación requieren `agentId`; las entradas del plan apuntan a `profiles.*.key` / `profiles.*.token` y escriben referencias hermanas (`keyRef` / `tokenRef`). Las referencias de perfiles de autenticación se incluyen en la resolución durante la ejecución y en la cobertura de auditoría.
- En `openclaw.json`, las SecretRefs deben usar objetos estructurados como `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Las cadenas de marcadores `secretref-env:<ENV_VAR>` heredadas se rechazan en las rutas de credenciales SecretRef; ejecute `openclaw doctor --fix` para migrar los marcadores válidos.
- Protección de la política de OAuth: `auth.profiles.<id>.mode = "oauth"` no puede combinarse con entradas SecretRef para ese perfil. El inicio o la recarga y la resolución de perfiles de autenticación fallan de inmediato cuando se infringe esta política.
- Para los proveedores de modelos administrados mediante SecretRef, las entradas `agents/*/agent/models.json` generadas conservan marcadores no secretos (no valores secretos resueltos) para las superficies de `apiKey`/encabezados. La persistencia de marcadores se rige por la fuente: OpenClaw escribe los marcadores a partir de la instantánea activa de la configuración de origen (antes de la resolución), no de los valores secretos resueltos durante la ejecución.
- El inicio en frío del Gateway puede aislar los fallos de resolución reintentables de propietarios asignados que no sean el Gateway. Las clases asignadas actualmente incluyen proveedores de modelos y Skills, proveedores de medios/TTS/cron, perfiles de autenticación elegibles, memoria por agente, SSH del sandbox, cuentas de canales y rutas de Plugin declaradas en el manifiesto. El inicio conserva las referencias explícitas de cada propietario con fallos en la instantánea de ejecución, informa del propietario mediante el estado y doctor, y rechaza las solicitudes destinadas a ese propietario sin intentar usar credenciales de menor precedencia. La recarga y la comprobación previa a la escritura de la configuración usan la misma política basada en propietarios: los propietarios en buen estado se actualizan; un propietario elegible con fallos solo conserva el estado anterior cuando las identidades de sus referencias, las definiciones de proveedores y el contrato completo no secreto del propietario no han cambiado; un fallo nuevo o modificado pasa a estar en frío. La autenticación de entrada del Gateway, las referencias o los valores estructuralmente no válidos, los propietarios que aplican el cierre ante fallos y los propietarios que no están asignados actualmente siguen siendo estrictos.
- Para la búsqueda web: en el modo de proveedor explícito (`tools.web.search.provider` definido), solo está activa la clave del proveedor seleccionado. En el modo automático (`tools.web.search.provider` sin definir), solo está activa la primera clave de proveedor que se resuelve según la precedencia, y las referencias de proveedores no seleccionados se tratan como inactivas hasta que se seleccionen. Las rutas de proveedor `tools.web.search.*` heredadas siguen resolviéndose durante el período de compatibilidad, pero la superficie SecretRef canónica es `plugins.entries.<plugin>.config.webSearch.*`.
- `identity: "user"` de Slack usa `channels.slack.userToken` con `channels.slack.appToken` para Socket Mode o `channels.slack.signingSecret` para el modo HTTP. La misma combinación se aplica en `channels.slack.accounts.*`; no se requiere ningún token de bot para esta identidad.

## Credenciales no compatibles

Estas credenciales son clases emitidas, rotadas, asociadas a sesiones o persistentes de OAuth que no se ajustan a la resolución externa de SecretRef de solo lectura:

[//]: # "secretref-unsupported-list-start"

- `commands.ownerDisplaySecret`
- `hooks.token`
- `hooks.gmail.pushToken`
- `hooks.mappings[].sessionKey`
- `auth-profiles.oauth.*`
- `channels.discord.threadBindings.webhookToken`
- `channels.discord.accounts.*.threadBindings.webhookToken`
- `channels.whatsapp.creds.json`
- `channels.whatsapp.accounts.*.creds.json`

[//]: # "secretref-unsupported-list-end"

## Contenido relacionado

- [Gestión de secretos](/es/gateway/secrets)
- [Semántica de las credenciales de autenticación](/es/auth-credential-semantics)
