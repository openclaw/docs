---
read_when:
    - Memverifikasi cakupan kredensial SecretRef
    - Mengaudit apakah kredensial memenuhi syarat untuk `secrets configure` atau `secrets apply`
    - Memverifikasi alasan kredensial berada di luar cakupan yang didukung
summary: Permukaan kredensial SecretRef kanonis yang didukung dan tidak didukung
title: Permukaan kredensial SecretRef
x-i18n:
    generated_at: "2026-07-12T14:39:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 435fc25ea9268be40abc367d96def70e8d367cb0ab640a4f2d271a0e9db19147
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Halaman ini mendefinisikan permukaan kredensial SecretRef kanonis: bidang kredensial mana yang menerima `SecretRef` (referensi yang didukung env/file/exec) sebagai pengganti nilai rahasia mentah.

Cakupan:

- Termasuk dalam cakupan: kredensial yang sepenuhnya disediakan pengguna dan tidak dibuat atau dirotasi oleh OpenClaw.
- Di luar cakupan: kredensial yang dibuat saat runtime atau dirotasi, materi penyegaran OAuth, dan artefak menyerupai sesi.

Daftar di bawah ini dihasilkan dari registri target sumber dan diperiksa terhadap `docs/reference/secretref-user-supplied-credentials-matrix.json` di CI; jangan mengedit entri secara manual.

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
- `channels.googlechat.serviceAccount` melalui `serviceAccountRef` yang setara (pengecualian kompatibilitas)
- `channels.googlechat.accounts.*.serviceAccount` melalui `serviceAccountRef` yang setara (pengecualian kompatibilitas)

### Target `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; tidak didukung ketika `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; tidak didukung ketika `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Catatan:

- Target rencana profil autentikasi memerlukan `agentId`; entri rencana menargetkan `profiles.*.key` / `profiles.*.token` dan menulis referensi yang setara (`keyRef` / `tokenRef`). Referensi profil autentikasi disertakan dalam resolusi runtime dan cakupan audit.
- Dalam `openclaw.json`, SecretRef harus menggunakan objek terstruktur seperti `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. String penanda lama `secretref-env:<ENV_VAR>` ditolak pada jalur kredensial SecretRef; jalankan `openclaw doctor --fix` untuk memigrasikan penanda yang valid.
- Pengaman kebijakan OAuth: `auth.profiles.<id>.mode = "oauth"` tidak dapat digabungkan dengan masukan SecretRef untuk profil tersebut. Proses mulai ulang/pemuatan ulang dan resolusi profil autentikasi langsung gagal ketika kebijakan ini dilanggar.
- Untuk penyedia model yang dikelola SecretRef, entri `agents/*/agent/models.json` yang dihasilkan menyimpan penanda nonrahasia (bukan nilai rahasia yang telah diresolusi) untuk permukaan `apiKey`/header. Persistensi penanda mengikuti sumber otoritatif: OpenClaw menulis penanda dari snapshot konfigurasi sumber aktif (sebelum resolusi), bukan dari nilai rahasia runtime yang telah diresolusi.
- Untuk pencarian web: dalam mode penyedia eksplisit (`tools.web.search.provider` ditetapkan), hanya kunci penyedia yang dipilih yang aktif. Dalam mode otomatis (`tools.web.search.provider` tidak ditetapkan), hanya kunci penyedia pertama yang berhasil diresolusi berdasarkan urutan prioritas yang aktif, dan referensi penyedia yang tidak dipilih diperlakukan sebagai tidak aktif hingga dipilih. Jalur penyedia lama `tools.web.search.*` masih diresolusi selama periode kompatibilitas, tetapi permukaan SecretRef kanonis adalah `plugins.entries.<plugin>.config.webSearch.*`.

## Kredensial yang tidak didukung

Kredensial ini termasuk dalam kelas yang dibuat, dirotasi, memuat sesi, atau bertahan lama untuk OAuth sehingga tidak sesuai dengan resolusi SecretRef eksternal hanya-baca:

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

## Terkait

- [Pengelolaan rahasia](/id/gateway/secrets)
- [Semantik kredensial autentikasi](/id/auth-credential-semantics)
