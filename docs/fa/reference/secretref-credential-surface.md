---
read_when:
    - بررسی پوشش اعتبارنامه‌های SecretRef
    - بررسی اینکه آیا یک اعتبارنامه واجد شرایط `secrets configure` یا `secrets apply` است یا نه
    - بررسی دلیل خارج‌بودن یک اعتبارنامه از محدودهٔ پشتیبانی‌شده
summary: سطح مرجع پشتیبانی‌شده و پشتیبانی‌نشدهٔ اعتبارنامه‌های SecretRef
title: سطح اعتبارنامهٔ SecretRef
x-i18n:
    generated_at: "2026-07-16T17:23:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a4c7d8d5baf082f5524b93608584600856e48f9076df915c4db301a4ecd814c9
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

این صفحه سطح استاندارد اعتبارنامهٔ SecretRef را تعریف می‌کند: اینکه کدام فیلدهای اعتبارنامه به‌جای مقدار خام راز، یک `SecretRef` (ارجاعی با پشتوانهٔ env/file/exec) را می‌پذیرند.

دامنه:

- در دامنه: صرفاً اعتبارنامه‌هایی که کاربر ارائه می‌کند و OpenClaw آن‌ها را صادر یا چرخش نمی‌دهد.
- خارج از دامنه: اعتبارنامه‌هایی که در زمان اجرا صادر یا چرخش داده می‌شوند، مواد تازه‌سازی OAuth و مصنوعات مشابه نشست.

فهرست‌های زیر از رجیستری هدف منبع تولید و در CI با `docs/reference/secretref-user-supplied-credentials-matrix.json` بررسی می‌شوند؛ ورودی‌ها را دستی ویرایش نکنید.

## اعتبارنامه‌های پشتیبانی‌شده

### هدف‌های `openclaw.json` ‏(`secrets configure` + `secrets apply` + `secrets audit`)

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
- `channels.googlechat.serviceAccount` از طریق `serviceAccountRef` هم‌سطح (استثنای سازگاری)
- `channels.googlechat.accounts.*.serviceAccount` از طریق `serviceAccountRef` هم‌سطح (استثنای سازگاری)

### هدف‌های `auth-profiles.json` ‏(`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` ‏(`type: "api_key"`؛ در حالت `auth.profiles.<id>.mode = "oauth"` پشتیبانی نمی‌شود)
- `profiles.*.tokenRef` ‏(`type: "token"`؛ در حالت `auth.profiles.<id>.mode = "oauth"` پشتیبانی نمی‌شود)

[//]: # "secretref-supported-list-end"

نکته‌ها:

- هدف‌های طرح نمایهٔ احراز هویت به `agentId` نیاز دارند؛ ورودی‌های طرح، `profiles.*.key` / `profiles.*.token` را هدف می‌گیرند و ارجاع‌های هم‌سطح (`keyRef` / `tokenRef`) را می‌نویسند. ارجاع‌های نمایهٔ احراز هویت در تفکیک زمان اجرا و پوشش ممیزی گنجانده شده‌اند.
- در `openclaw.json`، ‏SecretRefها باید از اشیای ساخت‌یافته‌ای مانند `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` استفاده کنند. رشته‌های نشانگر قدیمی `secretref-env:<ENV_VAR>` در مسیرهای اعتبارنامهٔ SecretRef رد می‌شوند؛ برای مهاجرت نشانگرهای معتبر، `openclaw doctor --fix` را اجرا کنید.
- محافظ خط‌مشی OAuth: ‏`auth.profiles.<id>.mode = "oauth"` را نمی‌توان برای آن نمایه با ورودی‌های SecretRef ترکیب کرد. هنگام نقض این خط‌مشی، راه‌اندازی/بارگذاری مجدد و تفکیک نمایهٔ احراز هویت فوراً ناموفق می‌شوند.
- برای ارائه‌دهندگان مدلِ مدیریت‌شده با SecretRef، ورودی‌های تولیدشدهٔ `agents/*/agent/models.json` برای سطوح `apiKey`/سرآیند، نشانگرهای غیرمحرمانه را نگه می‌دارند (نه مقادیر تفکیک‌شدهٔ راز). ماندگاری نشانگر تحت حاکمیت منبع است: OpenClaw نشانگرها را از عکس فوری پیکربندی منبع فعال (پیش از تفکیک) می‌نویسد، نه از مقادیر تفکیک‌شدهٔ راز در زمان اجرا.
- برای جست‌وجوی وب: در حالت ارائه‌دهندهٔ صریح (`tools.web.search.provider` تنظیم شده)، فقط کلید ارائه‌دهندهٔ انتخاب‌شده فعال است. در حالت خودکار (`tools.web.search.provider` تنظیم نشده)، فقط نخستین کلید ارائه‌دهنده‌ای که بر اساس تقدم تفکیک می‌شود فعال است و ارجاع‌های ارائه‌دهندگان انتخاب‌نشده تا زمان انتخاب، غیرفعال تلقی می‌شوند. مسیرهای قدیمی ارائه‌دهندهٔ `tools.web.search.*` همچنان طی بازهٔ سازگاری تفکیک می‌شوند، اما سطح استاندارد SecretRef برابر `plugins.entries.<plugin>.config.webSearch.*` است.

## اعتبارنامه‌های پشتیبانی‌نشده

این اعتبارنامه‌ها از دسته‌هایی هستند که صادر می‌شوند، چرخش داده می‌شوند، حامل نشست هستند یا ماندگاری OAuth دارند و با تفکیک فقط‌خواندنی خارجی SecretRef سازگار نیستند:

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

## مرتبط

- [مدیریت رازها](/fa/gateway/secrets)
- [معناشناسی اعتبارنامهٔ احراز هویت](/fa/auth-credential-semantics)
