---
read_when:
    - Überprüfen der Abdeckung von SecretRef-Anmeldedaten
    - Prüfen, ob Anmeldedaten für `secrets configure` oder `secrets apply` berechtigt sind
    - Überprüfen, warum eine Anmeldeinformation außerhalb des unterstützten Funktionsumfangs liegt
summary: Kanonische unterstützte und nicht unterstützte SecretRef-Anmeldedatenoberfläche
title: SecretRef-Anmeldedatenoberfläche
x-i18n:
    generated_at: "2026-07-12T15:59:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 435fc25ea9268be40abc367d96def70e8d367cb0ab640a4f2d271a0e9db19147
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Diese Seite definiert die kanonische SecretRef-Oberfläche für Anmeldedaten: welche Anmeldedatenfelder anstelle eines unverschlüsselten Geheimniswerts eine `SecretRef` (eine durch env/file/exec gestützte Referenz) akzeptieren.

Geltungsbereich:

- Im Geltungsbereich: ausschließlich vom Benutzer bereitgestellte Anmeldedaten, die OpenClaw weder ausstellt noch rotiert.
- Außerhalb des Geltungsbereichs: zur Laufzeit ausgestellte oder rotierende Anmeldedaten, OAuth-Aktualisierungsmaterial und sitzungsähnliche Artefakte.

Die folgenden Listen werden aus der Quellzielregistrierung generiert und in CI mit `docs/reference/secretref-user-supplied-credentials-matrix.json` abgeglichen; bearbeiten Sie die Einträge nicht manuell.

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
- `channels.googlechat.serviceAccount` über das gleichgeordnete `serviceAccountRef` (Kompatibilitätsausnahme)
- `channels.googlechat.accounts.*.serviceAccount` über das gleichgeordnete `serviceAccountRef` (Kompatibilitätsausnahme)

### `auth-profiles.json`-Ziele (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; nicht unterstützt, wenn `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; nicht unterstützt, wenn `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Hinweise:

- Planziele für Authentifizierungsprofile erfordern `agentId`; Planeinträge zielen auf `profiles.*.key` / `profiles.*.token` und schreiben gleichgeordnete Referenzen (`keyRef` / `tokenRef`). Referenzen von Authentifizierungsprofilen sind in die Laufzeitauflösung und die Audit-Abdeckung einbezogen.
- In `openclaw.json` müssen SecretRefs strukturierte Objekte wie `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` verwenden. Veraltete `secretref-env:<ENV_VAR>`-Markierungszeichenfolgen werden auf SecretRef-Anmeldedatenpfaden abgelehnt; führen Sie `openclaw doctor --fix` aus, um gültige Markierungen zu migrieren.
- OAuth-Richtlinienschutz: `auth.profiles.<id>.mode = "oauth"` kann nicht mit SecretRef-Eingaben für dieses Profil kombiniert werden. Start/Neuladen und die Auflösung von Authentifizierungsprofilen schlagen bei einem Verstoß gegen diese Richtlinie sofort fehl.
- Bei SecretRef-verwalteten Modell-Providern speichern generierte `agents/*/agent/models.json`-Einträge für `apiKey`-/Header-Oberflächen nicht geheime Markierungen (keine aufgelösten Geheimniswerte). Die Markierungsspeicherung wird von der Quelle bestimmt: OpenClaw schreibt Markierungen aus dem aktiven Snapshot der Quellkonfiguration (vor der Auflösung), nicht aus aufgelösten Geheimniswerten der Laufzeit.
- Für die Websuche gilt: Im expliziten Provider-Modus (`tools.web.search.provider` festgelegt) ist nur der Schlüssel des ausgewählten Providers aktiv. Im automatischen Modus (`tools.web.search.provider` nicht festgelegt) ist nur der erste Provider-Schlüssel aktiv, der gemäß der Prioritätsreihenfolge aufgelöst wird, und Referenzen nicht ausgewählter Provider gelten bis zu ihrer Auswahl als inaktiv. Veraltete Provider-Pfade unter `tools.web.search.*` werden während des Kompatibilitätszeitraums weiterhin aufgelöst, die kanonische SecretRef-Oberfläche ist jedoch `plugins.entries.<plugin>.config.webSearch.*`.

## Nicht unterstützte Anmeldedaten

Diese Anmeldedaten gehören zu ausgestellten, rotierten, sitzungstragenden oder dauerhaft für OAuth gespeicherten Klassen, die nicht zur schreibgeschützten externen SecretRef-Auflösung passen:

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

## Verwandte Themen

- [Geheimnisverwaltung](/de/gateway/secrets)
- [Semantik von Authentifizierungsdaten](/de/auth-credential-semantics)
