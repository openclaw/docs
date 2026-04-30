---
read_when:
    - Überprüfung der Abdeckung von SecretRef-Anmeldeinformationen
    - Prüfung, ob Zugangsdaten für `secrets configure` oder `secrets apply` infrage kommen
    - Überprüfen, warum eine Anmeldeinformation außerhalb des unterstützten Bereichs liegt
summary: Kanonische unterstützte und nicht unterstützte Oberfläche für SecretRef-Anmeldedaten
title: SecretRef-Schnittstelle für Anmeldedaten
x-i18n:
    generated_at: "2026-04-30T07:13:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: b04902427e9851cc36c1dfd07ed44b46b55450c251075e9955af6696f08bc334
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Diese Seite definiert die kanonische SecretRef-Oberfläche für Anmeldedaten.

Geltungsbereich:

- Im Geltungsbereich: ausschließlich vom Benutzer bereitgestellte Anmeldedaten, die OpenClaw nicht ausstellt oder rotiert.
- Nicht im Geltungsbereich: zur Laufzeit ausgestellte oder rotierende Anmeldedaten, OAuth-Aktualisierungsmaterial und sitzungsähnliche Artefakte.

## Unterstützte Anmeldedaten

### `openclaw.json`-Ziele (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `channels.googlechat.serviceAccount` über gleichrangiges `serviceAccountRef` (Kompatibilitätsausnahme)
- `channels.googlechat.accounts.*.serviceAccount` über gleichrangiges `serviceAccountRef` (Kompatibilitätsausnahme)

### `auth-profiles.json`-Ziele (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; nicht unterstützt, wenn `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; nicht unterstützt, wenn `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Hinweise:

- Auth-Profil-Plan-Ziele erfordern `agentId`.
- Planeinträge zielen auf `profiles.*.key` / `profiles.*.token` und schreiben gleichrangige Refs (`keyRef` / `tokenRef`).
- Auth-Profil-Refs sind in der Laufzeitauflösung und Audit-Abdeckung enthalten.
- In `openclaw.json` müssen SecretRefs strukturierte Objekte wie `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` verwenden. Alte `secretref-env:<ENV_VAR>`-Markierungsstrings werden auf SecretRef-Anmeldedatenpfaden abgelehnt; führen Sie `openclaw doctor --fix` aus, um gültige Markierungen zu migrieren.
- OAuth-Richtlinienwächter: `auth.profiles.<id>.mode = "oauth"` kann für dieses Profil nicht mit SecretRef-Eingaben kombiniert werden. Start/Neuladen und Auth-Profil-Auflösung schlagen sofort fehl, wenn diese Richtlinie verletzt wird.
- Für SecretRef-verwaltete Modell-Provider behalten generierte `agents/*/agent/models.json`-Einträge nicht geheime Markierungen (keine aufgelösten geheimen Werte) für `apiKey`-/Header-Oberflächen bei.
- Die Markierungspersistenz ist quellenautoritativ: OpenClaw schreibt Markierungen aus dem aktiven Quellkonfigurations-Snapshot (vor der Auflösung), nicht aus aufgelösten geheimen Laufzeitwerten.
- Für die Websuche:
  - Im expliziten Provider-Modus (`tools.web.search.provider` gesetzt) ist nur der ausgewählte Provider-Schlüssel aktiv.
  - Im automatischen Modus (`tools.web.search.provider` nicht gesetzt) ist nur der erste Provider-Schlüssel aktiv, der gemäß Rangfolge aufgelöst wird.
  - Im automatischen Modus werden nicht ausgewählte Provider-Refs als inaktiv behandelt, bis sie ausgewählt werden.
  - Alte `tools.web.search.*`-Provider-Pfade werden während des Kompatibilitätsfensters weiterhin aufgelöst, aber die kanonische SecretRef-Oberfläche ist `plugins.entries.<plugin>.config.webSearch.*`.

## Nicht unterstützte Anmeldedaten

Nicht zum Geltungsbereich gehörende Anmeldedaten umfassen:

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

Begründung:

- Diese Anmeldedaten sind ausgestellte, rotierte, sitzungstragende oder OAuth-dauerhafte Klassen, die nicht zur schreibgeschützten externen SecretRef-Auflösung passen.

## Verwandt

- [Geheimnisverwaltung](/de/gateway/secrets)
- [Semantik von Auth-Anmeldedaten](/de/auth-credential-semantics)
