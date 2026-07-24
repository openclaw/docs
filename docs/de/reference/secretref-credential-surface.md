---
read_when:
    - Überprüfung der Abdeckung von SecretRef-Anmeldedaten
    - Prüfen, ob Anmeldedaten für `secrets configure` oder `secrets apply` berechtigt sind
    - Überprüfen, warum Anmeldedaten außerhalb des unterstützten Funktionsumfangs liegen
summary: Kanonische unterstützte und nicht unterstützte SecretRef-Anmeldedatenoberfläche
title: SecretRef-Anmeldedatenoberfläche
x-i18n:
    generated_at: "2026-07-24T05:16:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cbb1ad6c5045780e5ca8d9c20f2a0e86425317e86ef9aaa59957a2094344dd0d
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Diese Seite definiert die kanonische SecretRef-Oberfläche für Anmeldedaten: welche Anmeldedatenfelder eine `SecretRef` (eine umgebungsvariablen-/datei-/exec-gestützte Referenz) anstelle eines unverschlüsselten Geheimniswerts akzeptieren.

Geltungsbereich:

- Im Geltungsbereich: ausschließlich vom Benutzer bereitgestellte Anmeldedaten, die OpenClaw weder ausstellt noch rotiert.
- Außerhalb des Geltungsbereichs: zur Laufzeit ausgestellte oder rotierende Anmeldedaten, OAuth-Aktualisierungsmaterial und sitzungsähnliche Artefakte.

Die folgenden Listen werden aus der Quell-Zielregistrierung generiert und in der CI anhand von `docs/reference/secretref-user-supplied-credentials-matrix.json` geprüft; bearbeiten Sie die Einträge nicht manuell.

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
- `memory.search.remote.apiKey`
- `agents.entries.*.tts.providers.*.apiKey`
- `agents.entries.*.memory.search.remote.apiKey`
- `talk.providers.*.apiKey`
- `talk.realtime.providers.*.apiKey`
- `tts.providers.*.apiKey`
- `plugins.entries.acpx.config.mcpServers.*.env.*`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.codex.config.appServer.authToken`
- `plugins.entries.codex.config.appServer.headers.*`
- `plugins.entries.exa.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webFetch.apiKey`
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
- `channels.googlechat.serviceAccount` über das benachbarte `serviceAccountRef` (Kompatibilitätsausnahme)
- `channels.googlechat.accounts.*.serviceAccount` über das benachbarte `serviceAccountRef` (Kompatibilitätsausnahme)

### `auth-profiles.json`-Ziele (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; nicht unterstützt, wenn `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; nicht unterstützt, wenn `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Hinweise:

- Planziele für Authentifizierungsprofile erfordern `agentId`; Planeinträge zielen auf `profiles.*.key` / `profiles.*.token` und schreiben benachbarte Referenzen (`keyRef` / `tokenRef`). Referenzen von Authentifizierungsprofilen sind in der Laufzeitauflösung und der Audit-Abdeckung enthalten.
- In `openclaw.json` müssen SecretRefs strukturierte Objekte wie `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` verwenden. Veraltete `secretref-env:<ENV_VAR>`-Markierungszeichenfolgen werden in SecretRef-Anmeldedatenpfaden abgelehnt; führen Sie `openclaw doctor --fix` aus, um gültige Markierungen zu migrieren.
- OAuth-Richtlinienschutz: `auth.profiles.<id>.mode = "oauth"` kann für dieses Profil nicht mit SecretRef-Eingaben kombiniert werden. Start/Neuladen und die Auflösung von Authentifizierungsprofilen schlagen bei einem Verstoß gegen diese Richtlinie sofort fehl.
- Bei SecretRef-verwalteten Modell-Providern speichern generierte `agents/*/agent/models.json`-Einträge nicht geheime Markierungen (keine aufgelösten Geheimniswerte) für `apiKey`-/Header-Oberflächen. Die Speicherung der Markierungen richtet sich maßgeblich nach der Quelle: OpenClaw schreibt Markierungen aus dem aktiven Quellkonfigurations-Snapshot (vor der Auflösung), nicht aus aufgelösten Geheimniswerten der Laufzeit.
- Beim Kaltstart des Gateways können wiederholbare Auflösungsfehler für zugeordnete Eigentümer außerhalb des Gateways isoliert werden. Zu den derzeit zugeordneten Klassen gehören Modell-Provider und Skills, Medien-/TTS-/Cron-Provider, geeignete Authentifizierungsprofile, agentenspezifischer Speicher, Sandbox-SSH, Kanalkonten und im Manifest deklarierte Plugin-Routen. Beim Start bleiben die expliziten Referenzen jedes fehlgeschlagenen Eigentümers im Laufzeit-Snapshot erhalten, der Eigentümer wird über Status und Doctor gemeldet, und Anfragen für diesen Eigentümer werden abgelehnt, ohne Anmeldedaten mit niedrigerer Priorität auszuprobieren. Neuladen und die Vorabprüfung beim Schreiben der Konfiguration verwenden dieselbe eigentümerbezogene Richtlinie: Fehlerfreie Eigentümer werden aktualisiert; ein geeigneter fehlgeschlagener Eigentümer bleibt nur dann veraltet, wenn seine Referenzidentitäten, Provider-Definitionen und sein vollständiger nicht geheimer Eigentümervertrag unverändert sind; ein neuer oder geänderter Fehler führt zu einem Kaltzustand. Gateway-Eingangsauthentifizierung, strukturell ungültige Referenzen oder Werte, bei Fehlern geschlossene Eigentümer und derzeit nicht zugeordnete Eigentümer bleiben strikt.
- Für die Websuche gilt: Im expliziten Provider-Modus (`tools.web.search.provider` gesetzt) ist nur der Schlüssel des ausgewählten Providers aktiv. Im automatischen Modus (`tools.web.search.provider` nicht gesetzt) ist nur der erste nach Priorität aufgelöste Provider-Schlüssel aktiv; Referenzen nicht ausgewählter Provider werden bis zu ihrer Auswahl als inaktiv behandelt. Provider-Anmeldedaten verwenden `plugins.entries.<plugin>.config.webSearch.*`.
- Slack `identity: "user"` verwendet `channels.slack.userToken` mit `channels.slack.appToken` für den Socket Mode oder `channels.slack.signingSecret` für den HTTP-Modus. Dieselbe Kombination gilt unter `channels.slack.accounts.*`; für diese Identität ist kein Bot-Token erforderlich.

## Nicht unterstützte Anmeldedaten

Diese Anmeldedaten gehören zu ausgestellten, rotierten, sitzungstragenden oder dauerhaft für OAuth verwendeten Klassen, die nicht zur schreibgeschützten externen SecretRef-Auflösung passen:

[//]: # "secretref-unsupported-list-start"

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
