---
read_when:
    - Memverifikasi cakupan kredensial SecretRef
    - Mengaudit apakah kredensial memenuhi syarat untuk `secrets configure` atau `secrets apply`
    - Memverifikasi alasan kredensial berada di luar cakupan yang didukung
summary: Permukaan kredensial SecretRef kanonis yang didukung vs tidak didukung
title: Permukaan kredensial SecretRef
x-i18n:
    generated_at: "2026-07-19T05:19:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 396336826e6ac16440a26630a34030b70f3c4e2d75c699c743f07821c035ad72
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Halaman ini mendefinisikan permukaan kredensial SecretRef kanonis: bidang kredensial mana yang menerima `SecretRef` (referensi yang didukung env/file/exec) alih-alih nilai rahasia mentah.

Cakupan:

- Termasuk dalam cakupan: hanya kredensial yang disediakan pengguna dan tidak diterbitkan atau dirotasi oleh OpenClaw.
- Di luar cakupan: kredensial yang diterbitkan atau dirotasi saat runtime, materi penyegaran OAuth, dan artefak serupa sesi.

Daftar di bawah dihasilkan dari registri target sumber dan diperiksa terhadap `docs/reference/secretref-user-supplied-credentials-matrix.json` dalam CI; jangan mengedit entri secara manual.

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
- `channels.googlechat.serviceAccount` melalui `serviceAccountRef` saudara (pengecualian kompatibilitas)
- `channels.googlechat.accounts.*.serviceAccount` melalui `serviceAccountRef` saudara (pengecualian kompatibilitas)

### Target `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; tidak didukung ketika `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; tidak didukung ketika `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Catatan:

- Target rencana profil autentikasi memerlukan `agentId`; entri rencana menargetkan `profiles.*.key` / `profiles.*.token` dan menulis referensi saudara (`keyRef` / `tokenRef`). Referensi profil autentikasi disertakan dalam resolusi runtime dan cakupan audit.
- Dalam `openclaw.json`, SecretRef harus menggunakan objek terstruktur seperti `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. String penanda `secretref-env:<ENV_VAR>` lama ditolak pada jalur kredensial SecretRef; jalankan `openclaw doctor --fix` untuk memigrasikan penanda yang valid.
- Pengaman kebijakan OAuth: `auth.profiles.<id>.mode = "oauth"` tidak dapat digabungkan dengan masukan SecretRef untuk profil tersebut. Resolusi startup/muat ulang dan profil autentikasi langsung gagal ketika kebijakan ini dilanggar.
- Untuk penyedia model yang dikelola SecretRef, entri `agents/*/agent/models.json` yang dihasilkan menyimpan penanda nonrahasia (bukan nilai rahasia yang telah diresolusi) untuk permukaan `apiKey`/header. Persistensi penanda bersifat otoritatif berdasarkan sumber: OpenClaw menulis penanda dari snapshot konfigurasi sumber aktif (sebelum resolusi), bukan dari nilai rahasia runtime yang telah diresolusi.
- Startup dingin Gateway dapat mengisolasi kegagalan resolusi yang dapat dicoba ulang untuk pemilik terpetakan non-Gateway. Kelas terpetakan saat ini mencakup penyedia model dan skill, penyedia media/TTS/cron, profil autentikasi yang memenuhi syarat, memori per agen, SSH sandbox, akun saluran, dan rute plugin yang dideklarasikan dalam manifes. Startup mempertahankan referensi eksplisit setiap pemilik yang gagal dalam snapshot runtime, melaporkan pemilik melalui status dan doctor, serta menolak permintaan untuk pemilik tersebut tanpa mencoba kredensial dengan prioritas lebih rendah. Pra-pemeriksaan muat ulang dan penulisan konfigurasi menggunakan kebijakan berbasis pemilik yang sama: pemilik yang sehat diperbarui; pemilik gagal yang memenuhi syarat tetap menggunakan keadaan lama hanya ketika identitas referensinya, definisi penyedia, dan kontrak lengkap pemilik nonrahasia tidak berubah; kegagalan baru atau yang berubah menjadi dingin. Autentikasi ingress Gateway, referensi atau nilai yang secara struktural tidak valid, pemilik yang gagal secara tertutup, dan pemilik yang saat ini belum terpetakan tetap ketat.
- Untuk pencarian web: dalam mode penyedia eksplisit (`tools.web.search.provider` ditetapkan), hanya kunci penyedia yang dipilih yang aktif. Dalam mode otomatis (`tools.web.search.provider` tidak ditetapkan), hanya kunci penyedia pertama yang diresolusi berdasarkan prioritas yang aktif, dan referensi penyedia yang tidak dipilih diperlakukan sebagai tidak aktif hingga dipilih. Jalur penyedia `tools.web.search.*` lama masih diresolusi selama periode kompatibilitas, tetapi permukaan SecretRef kanonis adalah `plugins.entries.<plugin>.config.webSearch.*`.
- Slack `identity: "user"` menggunakan `channels.slack.userToken` dengan `channels.slack.appToken` untuk Socket Mode atau `channels.slack.signingSecret` untuk mode HTTP. Pasangan yang sama berlaku di bawah `channels.slack.accounts.*`; token bot tidak diperlukan untuk identitas ini.

## Kredensial yang tidak didukung

Kredensial ini merupakan kelas yang diterbitkan, dirotasi, memuat sesi, atau persisten untuk OAuth dan tidak sesuai dengan resolusi SecretRef eksternal hanya-baca:

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
