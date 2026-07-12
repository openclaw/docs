---
read_when:
    - اعتبارسنجی پوشش اطلاعات احراز هویت SecretRef
    - ممیزی واجد شرایط بودن یک اعتبارنامه برای `secrets configure` یا `secrets apply`
    - بررسی علت خارج بودن یک اعتبارنامه از محدودهٔ پشتیبانی‌شده
summary: سطح مرجع اعتبارنامهٔ SecretRef با پشتیبانی رسمی در برابر سطح پشتیبانی‌نشده
title: سطح اعتبارنامهٔ SecretRef
x-i18n:
    generated_at: "2026-07-12T10:44:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 435fc25ea9268be40abc367d96def70e8d367cb0ab640a4f2d271a0e9db19147
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

این صفحه سطح استاندارد اعتبارنامه‌های SecretRef را تعریف می‌کند: اینکه کدام فیلدهای اعتبارنامه به‌جای مقدار خام محرمانه، یک `SecretRef` (ارجاع مبتنی بر env/file/exec) می‌پذیرند.

دامنه:

- در دامنه: صرفاً اعتبارنامه‌هایی که کاربر ارائه می‌کند و OpenClaw آن‌ها را ایجاد یا چرخش نمی‌دهد.
- خارج از دامنه: اعتبارنامه‌های ایجادشده در زمان اجرا یا دارای چرخش، داده‌های بازآوری OAuth و مصنوعات مشابه نشست.

فهرست‌های زیر از رجیستری اهداف منبع تولید می‌شوند و در CI با `docs/reference/secretref-user-supplied-credentials-matrix.json` تطبیق داده می‌شوند؛ مدخل‌ها را دستی ویرایش نکنید.

## اعتبارنامه‌های پشتیبانی‌شده

### اهداف `openclaw.json` ‏(`secrets configure` + `secrets apply` + `secrets audit`)

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
- `channels.googlechat.serviceAccount` از طریق `serviceAccountRef` هم‌سطح (استثنای سازگاری)
- `channels.googlechat.accounts.*.serviceAccount` از طریق `serviceAccountRef` هم‌سطح (استثنای سازگاری)

### اهداف `auth-profiles.json` ‏(`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` ‏(`type: "api_key"`؛ وقتی `auth.profiles.<id>.mode = "oauth"` باشد پشتیبانی نمی‌شود)
- `profiles.*.tokenRef` ‏(`type: "token"`؛ وقتی `auth.profiles.<id>.mode = "oauth"` باشد پشتیبانی نمی‌شود)

[//]: # "secretref-supported-list-end"

نکته‌ها:

- اهداف برنامه پروفایل احراز هویت به `agentId` نیاز دارند؛ مدخل‌های برنامه `profiles.*.key` / `profiles.*.token` را هدف می‌گیرند و ارجاع‌های هم‌سطح (`keyRef` / `tokenRef`) را می‌نویسند. ارجاع‌های پروفایل احراز هویت در تفکیک زمان اجرا و پوشش ممیزی گنجانده شده‌اند.
- در `openclaw.json`، ارجاع‌های SecretRef باید از اشیای ساخت‌یافته‌ای مانند `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` استفاده کنند. رشته‌های نشانگر قدیمی `secretref-env:<ENV_VAR>` در مسیرهای اعتبارنامه SecretRef رد می‌شوند؛ برای مهاجرت نشانگرهای معتبر، `openclaw doctor --fix` را اجرا کنید.
- محافظ سیاست OAuth: مقدار `auth.profiles.<id>.mode = "oauth"` را نمی‌توان با ورودی‌های SecretRef همان پروفایل ترکیب کرد. هنگام نقض این سیاست، راه‌اندازی/بارگذاری مجدد و تفکیک پروفایل احراز هویت بی‌درنگ ناموفق می‌شوند.
- برای ارائه‌دهندگان مدل تحت مدیریت SecretRef، مدخل‌های تولیدشده `agents/*/agent/models.json` برای سطوح `apiKey`/سرآیند، نشانگرهای غیرمحرمانه را ذخیره می‌کنند، نه مقادیر محرمانه تفکیک‌شده را. ماندگاری نشانگر بر مبنای منبع مرجع است: OpenClaw نشانگرها را از تصویر لحظه‌ای پیکربندی منبع فعال (پیش از تفکیک) می‌نویسد، نه از مقادیر محرمانه تفکیک‌شده زمان اجرا.
- برای جست‌وجوی وب: در حالت ارائه‌دهنده صریح (وقتی `tools.web.search.provider` تنظیم شده است)، فقط کلید ارائه‌دهنده انتخاب‌شده فعال است. در حالت خودکار (وقتی `tools.web.search.provider` تنظیم نشده است)، فقط نخستین کلید ارائه‌دهنده‌ای که براساس اولویت تفکیک می‌شود فعال است و ارجاع‌های ارائه‌دهندگان انتخاب‌نشده تا زمان انتخاب، غیرفعال در نظر گرفته می‌شوند. مسیرهای قدیمی ارائه‌دهنده `tools.web.search.*` همچنان در بازه سازگاری تفکیک می‌شوند، اما سطح استاندارد SecretRef برابر با `plugins.entries.<plugin>.config.webSearch.*` است.

## اعتبارنامه‌های پشتیبانی‌نشده

این اعتبارنامه‌ها در دسته‌هایی قرار دارند که ایجادشده، دارای چرخش، حامل نشست یا پایدار در OAuth هستند و با تفکیک خارجی فقط‌خواندنی SecretRef سازگار نیستند:

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

- [مدیریت داده‌های محرمانه](/fa/gateway/secrets)
- [معنای اعتبارنامه‌های احراز هویت](/fa/auth-credential-semantics)
