---
read_when:
    - Verificación de la cobertura de credenciales SecretRef
    - Auditar si una credencial es elegible para `secrets configure` o `secrets apply`
    - Verificar por qué una credencial está fuera de la superficie admitida
summary: Superficie canónica de credenciales SecretRef admitida frente a no admitida
title: Superficie de credenciales de SecretRef
x-i18n:
    generated_at: "2026-05-11T20:52:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2778ea781f7b6fc4d579892225f9cf29bfb8f9ece5961554620ca8e82123ceff
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Esta página define la superficie canónica de credenciales SecretRef.

Intención del alcance:

- Dentro del alcance: credenciales estrictamente proporcionadas por el usuario que OpenClaw no emite ni rota.
- Fuera del alcance: credenciales emitidas o rotadas en tiempo de ejecución, material de actualización de OAuth y artefactos similares a sesiones.

## Credenciales admitidas

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
- `messages.tts.providers.*.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.acpx.config.mcpServers.*.env.*`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.exa.config.webSearch.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.minimax.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
- `plugins.entries.voice-call.config.realtime.providers.*.apiKey`
- `plugins.entries.voice-call.config.streaming.providers.*.apiKey`
- `plugins.entries.voice-call.config.tts.providers.*.apiKey`
- `plugins.entries.voice-call.config.twilio.authToken`
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
- `channels.slack.userToken`
- `channels.slack.signingSecret`
- `channels.slack.accounts.*.botToken`
- `channels.slack.accounts.*.appToken`
- `channels.slack.accounts.*.userToken`
- `channels.slack.accounts.*.signingSecret`
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
- `channels.googlechat.serviceAccount` mediante `serviceAccountRef` hermano (excepción de compatibilidad)
- `channels.googlechat.accounts.*.serviceAccount` mediante `serviceAccountRef` hermano (excepción de compatibilidad)

### Destinos de `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; no admitido cuando `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; no admitido cuando `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Notas:

- Los destinos del plan de perfiles de autenticación requieren `agentId`.
- Las entradas del plan apuntan a `profiles.*.key` / `profiles.*.token` y escriben referencias hermanas (`keyRef` / `tokenRef`).
- Las referencias de perfiles de autenticación se incluyen en la resolución en tiempo de ejecución y en la cobertura de auditoría.
- En `openclaw.json`, los SecretRefs deben usar objetos estructurados como `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Las cadenas de marcador heredadas `secretref-env:<ENV_VAR>` se rechazan en rutas de credenciales SecretRef; ejecuta `openclaw doctor --fix` para migrar marcadores válidos.
- Protección de política de OAuth: `auth.profiles.<id>.mode = "oauth"` no puede combinarse con entradas SecretRef para ese perfil. El inicio o la recarga y la resolución de perfiles de autenticación fallan de inmediato cuando se infringe esta política.
- Para proveedores de modelos administrados por SecretRef, las entradas generadas de `agents/*/agent/models.json` conservan marcadores no secretos (no valores secretos resueltos) para superficies de `apiKey`/encabezados.
- La persistencia de marcadores toma la fuente como autoridad: OpenClaw escribe marcadores desde la instantánea activa de configuración de origen (previa a la resolución), no desde valores secretos resueltos en tiempo de ejecución.
- Para búsqueda web:
  - En modo de proveedor explícito (`tools.web.search.provider` establecido), solo está activa la clave del proveedor seleccionado.
  - En modo automático (`tools.web.search.provider` sin establecer), solo está activa la primera clave de proveedor que se resuelve por precedencia.
  - En modo automático, las referencias de proveedores no seleccionados se tratan como inactivas hasta que se seleccionen.
  - Las rutas heredadas de proveedor `tools.web.search.*` siguen resolviéndose durante la ventana de compatibilidad, pero la superficie canónica de SecretRef es `plugins.entries.<plugin>.config.webSearch.*`.

## Credenciales no admitidas

Las credenciales fuera del alcance incluyen:

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

Justificación:

- Estas credenciales pertenecen a clases emitidas, rotadas, portadoras de sesión o duraderas de OAuth que no encajan con la resolución externa de SecretRef de solo lectura.

## Relacionado

- [Gestión de secretos](/es/gateway/secrets)
- [Semántica de credenciales de autenticación](/es/auth-credential-semantics)
