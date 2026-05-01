---
read_when:
    - SecretRef kimlik bilgileri kapsamını doğrulama
    - Bir kimlik bilgisinin `secrets configure` veya `secrets apply` için uygun olup olmadığını denetleme
    - Bir kimlik bilgisinin neden desteklenen yüzeyin dışında olduğunu doğrulama
summary: Desteklenen ve desteklenmeyen SecretRef kimlik bilgisi yüzeyinin kanonik kapsamı
title: SecretRef kimlik bilgisi yüzeyi
x-i18n:
    generated_at: "2026-05-01T09:04:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41111ac82142c906005e0f585c86f2ff0b454afdaec07343c295e6b83571718e
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Bu sayfa kanonik SecretRef kimlik bilgisi yüzeyini tanımlar.

Kapsam amacı:

- Kapsam içinde: OpenClaw tarafından oluşturulmayan veya döndürülmeyen, kesinlikle kullanıcı tarafından sağlanan kimlik bilgileri.
- Kapsam dışında: çalışma zamanında oluşturulan veya dönen kimlik bilgileri, OAuth yenileme materyali ve oturum benzeri yapılar.

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
- `plugins.entries.voice-call.config.realtime.providers.*.apiKey`
- `plugins.entries.voice-call.config.streaming.providers.*.apiKey`
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
- kardeş `serviceAccountRef` üzerinden `channels.googlechat.serviceAccount` (uyumluluk istisnası)
- kardeş `serviceAccountRef` üzerinden `channels.googlechat.accounts.*.serviceAccount` (uyumluluk istisnası)

### `auth-profiles.json` hedefleri (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; `auth.profiles.<id>.mode = "oauth"` olduğunda desteklenmez)
- `profiles.*.tokenRef` (`type: "token"`; `auth.profiles.<id>.mode = "oauth"` olduğunda desteklenmez)

[//]: # "secretref-supported-list-end"

Notlar:

- Auth-profile plan hedefleri `agentId` gerektirir.
- Plan girdileri `profiles.*.key` / `profiles.*.token` hedefler ve kardeş referansları (`keyRef` / `tokenRef`) yazar.
- Auth-profile referansları çalışma zamanı çözümlemesine ve denetim kapsamına dahildir.
- `openclaw.json` içinde SecretRef'ler `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` gibi yapılandırılmış nesneler kullanmalıdır. Eski `secretref-env:<ENV_VAR>` işaretçi dizeleri SecretRef kimlik bilgisi yollarında reddedilir; geçerli işaretçileri taşımak için `openclaw doctor --fix` komutunu çalıştırın.
- OAuth ilke koruması: `auth.profiles.<id>.mode = "oauth"` bu profil için SecretRef girdileriyle birleştirilemez. Bu ilke ihlal edildiğinde başlatma/yeniden yükleme ve auth-profile çözümlemesi hızlı şekilde başarısız olur.
- SecretRef tarafından yönetilen model sağlayıcıları için oluşturulan `agents/*/agent/models.json` girdileri, `apiKey`/üst bilgi yüzeyleri için gizli olmayan işaretçileri (çözümlenmiş gizli değerleri değil) kalıcı hale getirir.
- İşaretçi kalıcılığı kaynak açısından yetkilidir: OpenClaw işaretçileri çözümlenmiş çalışma zamanı gizli değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsünden (çözümleme öncesi) yazar.
- Web araması için:
  - Açık sağlayıcı modunda (`tools.web.search.provider` ayarlı), yalnızca seçilen sağlayıcı anahtarı etkindir.
  - Otomatik modda (`tools.web.search.provider` ayarsız), önceliğe göre çözümlenen yalnızca ilk sağlayıcı anahtarı etkindir.
  - Otomatik modda, seçilmeyen sağlayıcı referansları seçilene kadar etkin değil kabul edilir.
  - Eski `tools.web.search.*` sağlayıcı yolları uyumluluk penceresi sırasında hâlâ çözümlenir, ancak kanonik SecretRef yüzeyi `plugins.entries.<plugin>.config.webSearch.*` şeklindedir.

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

- Bu kimlik bilgileri salt okunur harici SecretRef çözümlemesine uymayan, oluşturulan, döndürülen, oturum taşıyan veya OAuth açısından kalıcı sınıflardır.

## İlgili

- [Gizli bilgi yönetimi](/tr/gateway/secrets)
- [Auth kimlik bilgisi semantiği](/tr/auth-credential-semantics)
