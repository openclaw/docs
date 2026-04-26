---
read_when:
    - Memverifikasi cakupan kredensial SecretRef
    - Mengaudit apakah sebuah kredensial memenuhi syarat untuk `secrets configure` atau `secrets apply`
    - Memverifikasi mengapa sebuah kredensial berada di luar surface yang didukung
summary: Surface kredensial SecretRef kanonis yang didukung vs tidak didukung
title: Surface kredensial SecretRef
x-i18n:
    generated_at: "2026-04-26T11:38:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ffdf545e954f8d73d18adfeb196d9092bf346bd86648f09314bad2a0f40bb6c
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

Halaman ini mendefinisikan surface kredensial SecretRef kanonis.

Maksud cakupan:

- Dalam cakupan: kredensial yang benar-benar disuplai pengguna dan tidak dicetak atau dirotasi oleh OpenClaw.
- Di luar cakupan: kredensial yang dicetak runtime atau berotasi, material refresh OAuth, dan artefak mirip sesi.

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
- `channels.googlechat.serviceAccount` melalui `serviceAccountRef` sibling (pengecualian kompatibilitas)
- `channels.googlechat.accounts.*.serviceAccount` melalui `serviceAccountRef` sibling (pengecualian kompatibilitas)

### Target `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; tidak didukung ketika `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; tidak didukung ketika `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Catatan:

- Target plan auth-profile memerlukan `agentId`.
- Entri plan menargetkan `profiles.*.key` / `profiles.*.token` dan menulis ref sibling (`keyRef` / `tokenRef`).
- Ref auth-profile termasuk dalam resolusi runtime dan cakupan audit.
- Dalam `openclaw.json`, SecretRef harus menggunakan objek terstruktur seperti `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. String marker lama `secretref-env:<ENV_VAR>` ditolak pada path kredensial SecretRef; jalankan `openclaw doctor --fix` untuk memigrasikan marker valid.
- Guard kebijakan OAuth: `auth.profiles.<id>.mode = "oauth"` tidak dapat digabungkan dengan input SecretRef untuk profil tersebut. Startup/reload dan resolusi auth-profile gagal cepat saat kebijakan ini dilanggar.
- Untuk provider model yang dikelola SecretRef, entri `agents/*/agent/models.json` yang dihasilkan mempertahankan marker non-rahasia (bukan nilai secret yang telah di-resolve) untuk surface `apiKey`/header.
- Persistensi marker bersifat source-authoritative: OpenClaw menulis marker dari snapshot config sumber aktif (pra-resolusi), bukan dari nilai secret runtime yang telah di-resolve.
- Untuk web search:
  - Dalam mode provider eksplisit (`tools.web.search.provider` disetel), hanya key provider yang dipilih yang aktif.
  - Dalam mode otomatis (`tools.web.search.provider` tidak disetel), hanya key provider pertama yang berhasil di-resolve menurut prioritas yang aktif.
  - Dalam mode otomatis, ref provider yang tidak dipilih diperlakukan sebagai tidak aktif sampai dipilih.
  - Path provider lama `tools.web.search.*` tetap di-resolve selama jendela kompatibilitas, tetapi surface SecretRef kanonis adalah `plugins.entries.<plugin>.config.webSearch.*`.

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

- Kredensial ini merupakan kelas yang dicetak, dirotasi, membawa sesi, atau tahan lama OAuth yang tidak cocok dengan resolusi SecretRef eksternal read-only.

## Terkait

- [Manajemen secret](/id/gateway/secrets)
- [Semantik kredensial auth](/id/auth-credential-semantics)
