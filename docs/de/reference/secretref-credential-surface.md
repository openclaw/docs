---
read_when:
    - SecretRef-Anmeldedaten-Abdeckung verifizieren
    - Prüfen, ob ein Zugangsdatenobjekt für `secrets configure` oder `secrets apply` berechtigt ist
    - Überprüfen, warum ein Anmeldecredential außerhalb des unterstützten Bereichs liegt
summary: Kanonische unterstützte und nicht unterstützte SecretRef-Anmeldeinformationsoberfläche
title: SecretRef-Schnittstelle für Zugangsdaten
x-i18n:
    generated_at: "2026-06-27T18:11:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 668ee7e72565194bfe53a397767d060e5fe7743c9bf8bde2597ec3dad2a32431
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Diese Seite definiert die kanonische SecretRef-Credential-Oberfläche.

Geltungsbereich:

- Im Geltungsbereich: ausschließlich von Benutzern bereitgestellte Anmeldeinformationen, die OpenClaw weder ausstellt noch rotiert.
- Außerhalb des Geltungsbereichs: zur Laufzeit ausgestellte oder rotierende Anmeldeinformationen, OAuth-Refresh-Material und sitzungsähnliche Artefakte.

## Unterstützte Anmeldeinformationen

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
- `channels.googlechat.serviceAccount` über gleichrangiges `serviceAccountRef` (Kompatibilitätsausnahme)
- `channels.googlechat.accounts.*.serviceAccount` über gleichrangiges `serviceAccountRef` (Kompatibilitätsausnahme)

### `auth-profiles.json`-Ziele (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; nicht unterstützt, wenn `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; nicht unterstützt, wenn `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Hinweise:

- Auth-Profil-Plan-Ziele erfordern `agentId`.
- Plan-Einträge zielen auf `profiles.*.key` / `profiles.*.token` und schreiben gleichrangige Refs (`keyRef` / `tokenRef`).
- Auth-Profil-Refs sind in der Laufzeitauflösung und Audit-Abdeckung enthalten.
- In `openclaw.json` müssen SecretRefs strukturierte Objekte wie `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` verwenden. Legacy-`secretref-env:<ENV_VAR>`-Marker-Strings werden auf SecretRef-Credential-Pfaden abgelehnt; führen Sie `openclaw doctor --fix` aus, um gültige Marker zu migrieren.
- OAuth-Richtlinienwächter: `auth.profiles.<id>.mode = "oauth"` kann nicht mit SecretRef-Eingaben für dieses Profil kombiniert werden. Start/Neuladen und Auth-Profil-Auflösung schlagen schnell fehl, wenn diese Richtlinie verletzt wird.
- Für SecretRef-verwaltete Modell-Provider speichern generierte `agents/*/agent/models.json`-Einträge nicht geheime Marker (nicht aufgelöste geheime Werte) für `apiKey`-/Header-Oberflächen.
- Marker-Persistenz ist quellenautoritativ: OpenClaw schreibt Marker aus dem aktiven Quellkonfigurations-Snapshot (vor der Auflösung), nicht aus aufgelösten geheimen Laufzeitwerten.
- Für die Websuche:
  - Im expliziten Provider-Modus (`tools.web.search.provider` gesetzt) ist nur der ausgewählte Provider-Schlüssel aktiv.
  - Im Auto-Modus (`tools.web.search.provider` nicht gesetzt) ist nur der erste Provider-Schlüssel aktiv, der per Vorrang aufgelöst wird.
  - Im Auto-Modus werden nicht ausgewählte Provider-Refs als inaktiv behandelt, bis sie ausgewählt werden.
  - Legacy-Provider-Pfade `tools.web.search.*` werden während des Kompatibilitätsfensters weiterhin aufgelöst, aber die kanonische SecretRef-Oberfläche ist `plugins.entries.<plugin>.config.webSearch.*`.

## Nicht unterstützte Anmeldeinformationen

Anmeldeinformationen außerhalb des Geltungsbereichs umfassen:

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

- Diese Anmeldeinformationen gehören zu Klassen, die ausgestellt werden, rotieren, Sitzungen tragen oder OAuth-dauerhaft sind und nicht zur schreibgeschützten externen SecretRef-Auflösung passen.

## Verwandte Themen

- [Secrets-Verwaltung](/de/gateway/secrets)
- [Semantik von Auth-Anmeldeinformationen](/de/auth-credential-semantics)
