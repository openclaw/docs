---
read_when:
    - SecretRef kimlik bilgisi kapsamını doğrulama
    - Bir kimlik bilgisinin `secrets configure` veya `secrets apply` için uygun olup olmadığını denetleme
    - Bir kimlik bilgisinin neden desteklenen yüzeyin dışında olduğunu doğrulama
summary: Kanonik desteklenen ve desteklenmeyen SecretRef kimlik bilgisi yüzeyi
title: SecretRef kimlik bilgisi yüzeyi
x-i18n:
    generated_at: "2026-04-26T11:40:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ffdf545e954f8d73d18adfeb196d9092bf346bd86648f09314bad2a0f40bb6c
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

Bu sayfa, kanonik SecretRef kimlik bilgisi yüzeyini tanımlar.

Kapsam amacı:

- Kapsam içinde: OpenClaw'ın üretmediği veya döndürmediği, kesin biçimde kullanıcı tarafından sağlanan kimlik bilgileri.
- Kapsam dışında: çalışma zamanında üretilen veya dönen kimlik bilgileri, OAuth yenileme materyali ve oturum benzeri yapıtlar.

## Desteklenen kimlik bilgileri

### `openclaw.json` hedefleri (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `channels.googlechat.serviceAccount` via sibling `serviceAccountRef` (uyumluluk istisnası)
- `channels.googlechat.accounts.*.serviceAccount` via sibling `serviceAccountRef` (uyumluluk istisnası)

### `auth-profiles.json` hedefleri (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; `auth.profiles.<id>.mode = "oauth"` olduğunda desteklenmez)
- `profiles.*.tokenRef` (`type: "token"`; `auth.profiles.<id>.mode = "oauth"` olduğunda desteklenmez)

[//]: # "secretref-supported-list-end"

Notlar:

- Auth-profile plan hedefleri `agentId` gerektirir.
- Plan girdileri `profiles.*.key` / `profiles.*.token` hedefini kullanır ve kardeş ref'ler (`keyRef` / `tokenRef`) yazar.
- Auth-profile ref'leri çalışma zamanı çözümleme ve denetim kapsamına dahildir.
- `openclaw.json` içinde SecretRef'ler `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` gibi yapılandırılmış nesneler kullanmalıdır. Eski `secretref-env:<ENV_VAR>` işaretçi dizeleri, SecretRef kimlik bilgisi yollarında reddedilir; geçerli işaretçileri taşımak için `openclaw doctor --fix` çalıştırın.
- OAuth ilke koruması: `auth.profiles.<id>.mode = "oauth"`, o profil için SecretRef girdileriyle birleştirilemez. Bu ilke ihlal edildiğinde başlangıç/yeniden yükleme ve auth-profile çözümlemesi hızlı başarısız olur.
- SecretRef ile yönetilen model sağlayıcıları için üretilen `agents/*/agent/models.json` girdileri, `apiKey`/header yüzeyleri için çözülmüş sır değerlerini değil, gizli olmayan işaretçileri kalıcılaştırır.
- İşaretçi kalıcılaştırması kaynak yetkilidir: OpenClaw işaretçileri çözülmüş çalışma zamanı sır değerlerinden değil, etkin kaynak config anlık görüntüsünden (çözümlemeden önce) yazar.
- Web arama için:
  - Açık sağlayıcı modunda (`tools.web.search.provider` ayarlı), yalnızca seçili sağlayıcı anahtarı etkindir.
  - Otomatik modda (`tools.web.search.provider` ayarsız), öncelik sırasına göre çözümlenen ilk sağlayıcı anahtarı etkindir.
  - Otomatik modda, seçilmeyen sağlayıcı ref'leri seçilene kadar etkin olmayan olarak değerlendirilir.
  - Eski `tools.web.search.*` sağlayıcı yolları uyumluluk penceresi boyunca hâlâ çözülür, ancak kanonik SecretRef yüzeyi `plugins.entries.<plugin>.config.webSearch.*` şeklindedir.

## Desteklenmeyen kimlik bilgileri

Kapsam dışı kimlik bilgileri şunları içerir:

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

Gerekçe:

- Bu kimlik bilgileri, salt okunur dış SecretRef çözümlemesine uymayan üretilen, dönen, oturum taşıyan veya OAuth kalıcı sınıflardır.

## İlgili

- [Secrets management](/tr/gateway/secrets)
- [Auth credential semantics](/tr/auth-credential-semantics)
