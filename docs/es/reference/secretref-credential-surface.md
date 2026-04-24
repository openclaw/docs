---
read_when:
    - Verificar la cobertura de credenciales SecretRef
    - Auditar si una credencial es elegible para ``secrets configure`` o ``secrets apply``
    - Verificar por qué una credencial está fuera de la superficie compatible
summary: Superficie canónica compatible vs no compatible de credenciales SecretRef
title: Superficie de credenciales SecretRef
x-i18n:
    generated_at: "2026-04-24T05:48:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddb8d7660f2757e3d2a078c891f52325bf9ec9291ec7d5f5e06daef4041e2006
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

Esta página define la superficie canónica de credenciales SecretRef.

Intención del alcance:

- Dentro del alcance: credenciales estrictamente proporcionadas por el usuario que OpenClaw no emite ni rota.
- Fuera del alcance: credenciales emitidas en runtime o rotatorias, material de refresco OAuth y artefactos de tipo sesión.

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
- `agents.list[].memorySearch.remote.apiKey`
- `talk.providers.*.apiKey`
- `messages.tts.providers.*.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.exa.config.webSearch.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.minimax.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
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
- `channels.bluebubbles.password`
- `channels.bluebubbles.accounts.*.password`
- `channels.feishu.appSecret`
- `channels.feishu.encryptKey`
- `channels.feishu.verificationToken`
- `channels.feishu.accounts.*.appSecret`
- `channels.feishu.accounts.*.encryptKey`
- `channels.feishu.accounts.*.verificationToken`
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

- `profiles.*.keyRef` (`type: "api_key"`; no compatible cuando `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; no compatible cuando `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Notas:

- Los destinos de plan de perfil de autenticación requieren `agentId`.
- Las entradas del plan apuntan a `profiles.*.key` / `profiles.*.token` y escriben refs hermanas (`keyRef` / `tokenRef`).
- Las refs de perfiles de autenticación se incluyen en la resolución en runtime y en la cobertura de auditoría.
- Barrera de política OAuth: `auth.profiles.<id>.mode = "oauth"` no puede combinarse con entradas SecretRef para ese perfil. El inicio/recarga y la resolución de perfiles de autenticación fallan rápidamente cuando se viola esta política.
- Para proveedores de modelos gestionados por SecretRef, las entradas generadas de `agents/*/agent/models.json` conservan marcadores no secretos (no valores secretos resueltos) para superficies `apiKey`/headers.
- La persistencia de marcadores es autoritativa desde la fuente: OpenClaw escribe marcadores a partir de la instantánea activa de la configuración de origen (antes de la resolución), no de valores secretos resueltos en runtime.
- Para búsqueda web:
  - En modo de proveedor explícito (`tools.web.search.provider` configurado), solo está activa la clave del proveedor seleccionado.
  - En modo automático (`tools.web.search.provider` sin configurar), solo está activa la primera clave de proveedor que se resuelva por precedencia.
  - En modo automático, las refs de proveedores no seleccionados se tratan como inactivas hasta que se seleccionen.
  - Las rutas heredadas de proveedor `tools.web.search.*` siguen resolviéndose durante la ventana de compatibilidad, pero la superficie canónica SecretRef es `plugins.entries.<plugin>.config.webSearch.*`.

## Credenciales no compatibles

Las credenciales fuera de alcance incluyen:

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

- Estas credenciales son emitidas, rotatorias, portadoras de sesión o clases duraderas de OAuth que no encajan con la resolución externa SecretRef en modo de solo lectura.

## Relacionado

- [Gestión de Secrets](/es/gateway/secrets)
- [Semántica de credenciales de autenticación](/es/auth-credential-semantics)
