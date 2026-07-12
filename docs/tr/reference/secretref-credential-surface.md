---
read_when:
    - SecretRef kimlik bilgisi kapsamını doğrulama
    - Bir kimlik bilgisinin `secrets configure` veya `secrets apply` için uygun olup olmadığını denetleme
    - Bir kimlik bilgisinin neden desteklenen kapsamın dışında olduğunu doğrulama
summary: Kanonik olarak desteklenen ve desteklenmeyen SecretRef kimlik bilgisi yüzeyi
title: SecretRef kimlik bilgisi yüzeyi
x-i18n:
    generated_at: "2026-07-12T12:43:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 435fc25ea9268be40abc367d96def70e8d367cb0ab640a4f2d271a0e9db19147
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Bu sayfa, kurallı SecretRef kimlik bilgisi yüzeyini tanımlar: hangi kimlik bilgisi alanlarının ham bir gizli değer yerine bir `SecretRef` (env/file/exec destekli başvuru) kabul ettiğini belirtir.

Kapsam:

- Kapsam dahilinde: OpenClaw'ın oluşturmadığı veya döndürmediği, yalnızca kullanıcı tarafından sağlanan kimlik bilgileri.
- Kapsam dışında: çalışma zamanında oluşturulan veya döndürülen kimlik bilgileri, OAuth yenileme materyali ve oturum benzeri yapılar.

Aşağıdaki listeler kaynak hedef kayıt defterinden oluşturulur ve CI'da `docs/reference/secretref-user-supplied-credentials-matrix.json` ile karşılaştırılarak denetlenir; girdileri elle düzenlemeyin.

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
- kardeş `serviceAccountRef` aracılığıyla `channels.googlechat.serviceAccount` (uyumluluk istisnası)
- kardeş `serviceAccountRef` aracılığıyla `channels.googlechat.accounts.*.serviceAccount` (uyumluluk istisnası)

### `auth-profiles.json` hedefleri (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; `auth.profiles.<id>.mode = "oauth"` olduğunda desteklenmez)
- `profiles.*.tokenRef` (`type: "token"`; `auth.profiles.<id>.mode = "oauth"` olduğunda desteklenmez)

[//]: # "secretref-supported-list-end"

Notlar:

- Kimlik doğrulama profili plan hedefleri `agentId` gerektirir; plan girdileri `profiles.*.key` / `profiles.*.token` alanlarını hedefler ve kardeş başvuruları (`keyRef` / `tokenRef`) yazar. Kimlik doğrulama profili başvuruları, çalışma zamanı çözümlemesine ve denetim kapsamına dahildir.
- `openclaw.json` içinde SecretRef'ler `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` gibi yapılandırılmış nesneler kullanmalıdır. Eski `secretref-env:<ENV_VAR>` işaretleyici dizeleri SecretRef kimlik bilgisi yollarında reddedilir; geçerli işaretleyicileri taşımak için `openclaw doctor --fix` komutunu çalıştırın.
- OAuth ilke koruması: `auth.profiles.<id>.mode = "oauth"`, bu profil için SecretRef girdileriyle birlikte kullanılamaz. Bu ilke ihlal edildiğinde başlatma/yeniden yükleme ve kimlik doğrulama profili çözümlemesi gecikmeden başarısız olur.
- SecretRef tarafından yönetilen model sağlayıcılarında, oluşturulan `agents/*/agent/models.json` girdileri `apiKey`/üstbilgi yüzeyleri için gizli olmayan işaretleyicileri (çözümlenmiş gizli değerleri değil) kalıcı olarak saklar. İşaretleyici kalıcılığı kaynak tarafından belirlenir: OpenClaw, işaretleyicileri çözümlenmiş çalışma zamanı gizli değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsünden (çözümleme öncesinde) yazar.
- Web araması için: açık sağlayıcı modunda (`tools.web.search.provider` ayarlandığında) yalnızca seçilen sağlayıcı anahtarı etkindir. Otomatik modda (`tools.web.search.provider` ayarlanmadığında) yalnızca önceliğe göre çözümlenen ilk sağlayıcı anahtarı etkindir ve seçilmeyen sağlayıcı başvuruları, seçilene kadar etkin değil olarak değerlendirilir. Eski `tools.web.search.*` sağlayıcı yolları uyumluluk süresi boyunca çözümlenmeye devam eder, ancak kurallı SecretRef yüzeyi `plugins.entries.<plugin>.config.webSearch.*` biçimindedir.

## Desteklenmeyen kimlik bilgileri

Bu kimlik bilgileri oluşturulan, döndürülen, oturum taşıyan veya kalıcı OAuth sınıflarındandır ve salt okunur harici SecretRef çözümlemesine uygun değildir:

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

## İlgili

- [Gizli değer yönetimi](/tr/gateway/secrets)
- [Kimlik doğrulama bilgilerinin anlamları](/tr/auth-credential-semantics)
