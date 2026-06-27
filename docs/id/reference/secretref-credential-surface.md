---
read_when:
    - Memverifikasi cakupan kredensial SecretRef
    - Mengaudit apakah kredensial memenuhi syarat untuk `secrets configure` atau `secrets apply`
    - Memverifikasi mengapa kredensial berada di luar permukaan yang didukung
summary: Permukaan kredensial SecretRef kanonis yang didukung vs tidak didukung
title: Permukaan kredensial SecretRef
x-i18n:
    generated_at: "2026-06-27T18:11:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 668ee7e72565194bfe53a397767d060e5fe7743c9bf8bde2597ec3dad2a32431
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Halaman ini mendefinisikan permukaan kredensial SecretRef kanonis.

Maksud cakupan:

- Dalam cakupan: kredensial yang secara ketat disediakan pengguna dan tidak dibuat atau dirotasi oleh OpenClaw.
- Di luar cakupan: kredensial yang dibuat runtime atau berotasi, materi penyegaran OAuth, dan artefak mirip sesi.

## Kredensial yang didukung

### Target `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `channels.googlechat.serviceAccount` melalui `serviceAccountRef` sejajar (pengecualian kompatibilitas)
- `channels.googlechat.accounts.*.serviceAccount` melalui `serviceAccountRef` sejajar (pengecualian kompatibilitas)

### Target `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; tidak didukung saat `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; tidak didukung saat `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Catatan:

- Target rencana profil auth memerlukan `agentId`.
- Entri rencana menargetkan `profiles.*.key` / `profiles.*.token` dan menulis ref sejajar (`keyRef` / `tokenRef`).
- Ref profil auth disertakan dalam resolusi runtime dan cakupan audit.
- Di `openclaw.json`, SecretRef harus menggunakan objek terstruktur seperti `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. String penanda lama `secretref-env:<ENV_VAR>` ditolak pada jalur kredensial SecretRef; jalankan `openclaw doctor --fix` untuk memigrasikan penanda yang valid.
- Pelindung kebijakan OAuth: `auth.profiles.<id>.mode = "oauth"` tidak dapat digabungkan dengan input SecretRef untuk profil tersebut. Startup/pemuatan ulang dan resolusi profil auth gagal cepat saat kebijakan ini dilanggar.
- Untuk penyedia model yang dikelola SecretRef, entri `agents/*/agent/models.json` yang dihasilkan mempertahankan penanda non-rahasia (bukan nilai rahasia yang sudah diresolusikan) untuk permukaan `apiKey`/header.
- Persistensi penanda bersifat otoritatif dari sumber: OpenClaw menulis penanda dari snapshot konfigurasi sumber aktif (pra-resolusi), bukan dari nilai rahasia runtime yang sudah diresolusikan.
- Untuk pencarian web:
  - Dalam mode penyedia eksplisit (`tools.web.search.provider` disetel), hanya kunci penyedia yang dipilih yang aktif.
  - Dalam mode otomatis (`tools.web.search.provider` tidak disetel), hanya kunci penyedia pertama yang teresolusi menurut presedensi yang aktif.
  - Dalam mode otomatis, ref penyedia yang tidak dipilih diperlakukan sebagai tidak aktif sampai dipilih.
  - Jalur penyedia lama `tools.web.search.*` masih teresolusi selama jendela kompatibilitas, tetapi permukaan SecretRef kanonis adalah `plugins.entries.<plugin>.config.webSearch.*`.

## Kredensial yang tidak didukung

Kredensial di luar cakupan mencakup:

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

Alasan:

- Kredensial ini termasuk kelas yang dibuat, dirotasi, membawa sesi, atau tahan lama untuk OAuth yang tidak cocok dengan resolusi SecretRef eksternal baca-saja.

## Terkait

- [Manajemen rahasia](/id/gateway/secrets)
- [Semantik kredensial auth](/id/auth-credential-semantics)
