---
read_when:
    - تأیید پوشش اعتبارنامه‌های SecretRef
    - حسابرسی اینکه آیا یک اعتبارنامه واجد شرایط `secrets configure` یا `secrets apply` است
    - در حال بررسی اینکه چرا یک اعتبارنامه خارج از سطح پشتیبانی‌شده است
summary: سطح اعتبارنامه SecretRef پشتیبانی‌شده و پشتیبانی‌نشدهٔ مرجع
title: سطح اعتبارنامه SecretRef
x-i18n:
    generated_at: "2026-06-27T18:49:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 668ee7e72565194bfe53a397767d060e5fe7743c9bf8bde2597ec3dad2a32431
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

این صفحه سطح اعتبارنامه استاندارد SecretRef را تعریف می‌کند.

هدف دامنه:

- در دامنه: صرفاً اعتبارنامه‌های ارائه‌شده توسط کاربر که OpenClaw آن‌ها را صادر یا چرخش نمی‌دهد.
- خارج از دامنه: اعتبارنامه‌های صادرشده یا چرخشی در زمان اجرا، مواد نوسازی OAuth، و مصنوعات شبیه نشست.

## اعتبارنامه‌های پشتیبانی‌شده

### اهداف `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

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

### اهداف `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`؛ هنگامی که `auth.profiles.<id>.mode = "oauth"` پشتیبانی نمی‌شود)
- `profiles.*.tokenRef` (`type: "token"`؛ هنگامی که `auth.profiles.<id>.mode = "oauth"` پشتیبانی نمی‌شود)

[//]: # "secretref-supported-list-end"

یادداشت‌ها:

- اهداف طرح نمایه احراز هویت به `agentId` نیاز دارند.
- ورودی‌های طرح، `profiles.*.key` / `profiles.*.token` را هدف می‌گیرند و ارجاع‌های هم‌سطح (`keyRef` / `tokenRef`) را می‌نویسند.
- ارجاع‌های نمایه احراز هویت در پوشش حل‌وفصل زمان اجرا و ممیزی گنجانده شده‌اند.
- در `openclaw.json`، SecretRefها باید از اشیای ساخت‌یافته مانند `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` استفاده کنند. رشته‌های نشانگر قدیمی `secretref-env:<ENV_VAR>` در مسیرهای اعتبارنامه SecretRef رد می‌شوند؛ برای مهاجرت نشانگرهای معتبر، `openclaw doctor --fix` را اجرا کنید.
- نگهبان سیاست OAuth: `auth.profiles.<id>.mode = "oauth"` نمی‌تواند با ورودی‌های SecretRef برای همان نمایه ترکیب شود. راه‌اندازی/بارگذاری مجدد و حل‌وفصل نمایه احراز هویت هنگام نقض این سیاست سریع شکست می‌خورند.
- برای ارائه‌دهندگان مدل مدیریت‌شده با SecretRef، ورودی‌های تولیدشده `agents/*/agent/models.json` نشانگرهای غیرمحرمانه (نه مقادیر محرمانه حل‌شده) را برای سطح‌های `apiKey`/header پایدار می‌کنند.
- پایداری نشانگر از نظر منبع معتبر است: OpenClaw نشانگرها را از اسنپ‌شات پیکربندی منبع فعال (پیش از حل‌وفصل) می‌نویسد، نه از مقادیر محرمانه حل‌شده در زمان اجرا.
- برای جستجوی وب:
  - در حالت ارائه‌دهنده صریح (`tools.web.search.provider` تنظیم شده)، فقط کلید ارائه‌دهنده انتخاب‌شده فعال است.
  - در حالت خودکار (`tools.web.search.provider` تنظیم نشده)، فقط نخستین کلید ارائه‌دهنده که بر اساس تقدم حل می‌شود فعال است.
  - در حالت خودکار، ارجاع‌های ارائه‌دهنده انتخاب‌نشده تا زمان انتخاب، غیرفعال در نظر گرفته می‌شوند.
  - مسیرهای ارائه‌دهنده قدیمی `tools.web.search.*` همچنان در پنجره سازگاری حل می‌شوند، اما سطح استاندارد SecretRef برابر است با `plugins.entries.<plugin>.config.webSearch.*`.

## اعتبارنامه‌های پشتیبانی‌نشده

اعتبارنامه‌های خارج از دامنه شامل موارد زیر هستند:

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

دلیل:

- این اعتبارنامه‌ها از کلاس‌هایی هستند که صادر می‌شوند، چرخش دارند، نشست‌دار هستند، یا برای OAuth ماندگارند و با حل‌وفصل خارجی فقط‌خواندنی SecretRef سازگار نیستند.

## مرتبط

- [مدیریت محرمانه‌ها](/fa/gateway/secrets)
- [معناشناسی اعتبارنامه احراز هویت](/fa/auth-credential-semantics)
