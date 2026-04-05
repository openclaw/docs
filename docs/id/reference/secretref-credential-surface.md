---
read_when:
    - Memverifikasi cakupan kredensial SecretRef
    - Mengaudit apakah sebuah kredensial memenuhi syarat untuk `secrets configure` atau `secrets apply`
    - Memverifikasi mengapa sebuah kredensial berada di luar permukaan yang didukung
summary: Permukaan kredensial SecretRef yang didukung vs tidak didukung secara kanonis
title: Permukaan Kredensial SecretRef
x-i18n:
    generated_at: "2026-04-05T14:05:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf997389de1dae8c059d8dfbf186eda979f864de632a033177d6cd5e5544675d
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

# Permukaan kredensial SecretRef

Halaman ini mendefinisikan permukaan kredensial SecretRef yang kanonis.

Maksud cakupan:

- Termasuk dalam cakupan: kredensial yang secara ketat disediakan pengguna dan tidak dibuat atau diputar oleh OpenClaw.
- Di luar cakupan: kredensial yang dibuat saat runtime atau berputar, materi refresh OAuth, dan artefak mirip sesi.

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
- `agents.list[].memorySearch.remote.apiKey`
- `talk.providers.*.apiKey`
- `messages.tts.providers.*.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.firecrawl.config.webFetch.apiKey`
- `plugins.entries.brave.config.webSearch.apiKey`
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
- `channels.googlechat.serviceAccount` via `serviceAccountRef` saudara (pengecualian kompatibilitas)
- `channels.googlechat.accounts.*.serviceAccount` via `serviceAccountRef` saudara (pengecualian kompatibilitas)

### Target `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; tidak didukung saat `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; tidak didukung saat `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Catatan:

- Target paket auth-profile memerlukan `agentId`.
- Entri paket menargetkan `profiles.*.key` / `profiles.*.token` dan menulis ref saudara (`keyRef` / `tokenRef`).
- Ref auth-profile disertakan dalam resolusi runtime dan cakupan audit.
- Guard kebijakan OAuth: `auth.profiles.<id>.mode = "oauth"` tidak dapat digabungkan dengan input SecretRef untuk profil tersebut. Startup/reload dan resolusi auth-profile gagal cepat saat kebijakan ini dilanggar.
- Untuk model provider yang dikelola SecretRef, entri `agents/*/agent/models.json` yang dihasilkan menyimpan penanda non-rahasia (bukan nilai rahasia yang telah diresolusikan) untuk permukaan `apiKey`/header.
- Persistensi penanda bersifat source-authoritative: OpenClaw menulis penanda dari snapshot konfigurasi sumber yang aktif (pra-resolusi), bukan dari nilai rahasia runtime yang telah diresolusikan.
- Untuk pencarian web:
  - Dalam mode provider eksplisit (`tools.web.search.provider` disetel), hanya kunci provider yang dipilih yang aktif.
  - Dalam mode otomatis (`tools.web.search.provider` tidak disetel), hanya kunci provider pertama yang teresolusi berdasarkan prioritas yang aktif.
  - Dalam mode otomatis, ref provider yang tidak dipilih diperlakukan sebagai tidak aktif sampai dipilih.
  - Jalur provider lama `tools.web.search.*` masih diresolusikan selama jendela kompatibilitas, tetapi permukaan SecretRef yang kanonis adalah `plugins.entries.<plugin>.config.webSearch.*`.

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

- Kredensial ini termasuk kelas yang dibuat, diputar, membawa sesi, atau tahan lama OAuth yang tidak cocok untuk resolusi SecretRef eksternal read-only.
