---
read_when:
    - راستی‌آزمایی پوشش اعتبارنامه‌های SecretRef
    - ممیزی واجد شرایط بودن یک اعتبارنامه برای `secrets configure` یا `secrets apply`
    - در حال بررسی اینکه چرا یک اعتبارنامه خارج از سطح پشتیبانی‌شده است
summary: سطح رسمی اعتبارنامهٔ SecretRef پشتیبانی‌شده در برابر پشتیبانی‌نشده
title: سطح اعتبارنامه SecretRef
x-i18n:
    generated_at: "2026-05-03T11:44:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f95ca284f241e40f233fc9e388c26be094dd8bc878daf8a420453ef65b0ad6d
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

این صفحه سطح معتبر اعتبارنامه‌ی SecretRef را تعریف می‌کند.

قصد دامنه:

- در دامنه: صرفاً اعتبارنامه‌های ارائه‌شده توسط کاربر که OpenClaw آن‌ها را صادر یا چرخش نمی‌کند.
- خارج از دامنه: اعتبارنامه‌های صادرشده در زمان اجرا یا دارای چرخش، مواد refresh مربوط به OAuth، و مصنوعات شبیه نشست.

## اعتبارنامه‌های پشتیبانی‌شده

### هدف‌های `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `channels.googlechat.serviceAccount` از طریق همتای `serviceAccountRef` (استثنای سازگاری)
- `channels.googlechat.accounts.*.serviceAccount` از طریق همتای `serviceAccountRef` (استثنای سازگاری)

### هدف‌های `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`؛ وقتی `auth.profiles.<id>.mode = "oauth"` باشد پشتیبانی نمی‌شود)
- `profiles.*.tokenRef` (`type: "token"`؛ وقتی `auth.profiles.<id>.mode = "oauth"` باشد پشتیبانی نمی‌شود)

[//]: # "secretref-supported-list-end"

نکته‌ها:

- هدف‌های طرح auth-profile به `agentId` نیاز دارند.
- ورودی‌های طرح `profiles.*.key` / `profiles.*.token` را هدف می‌گیرند و refهای همتا (`keyRef` / `tokenRef`) را می‌نویسند.
- refهای auth-profile در تفکیک زمان اجرا و پوشش audit گنجانده می‌شوند.
- در `openclaw.json`، SecretRefها باید از شیءهای ساخت‌یافته مانند `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` استفاده کنند. رشته‌های نشانگر قدیمی `secretref-env:<ENV_VAR>` در مسیرهای اعتبارنامه‌ی SecretRef رد می‌شوند؛ برای مهاجرت نشانگرهای معتبر، `openclaw doctor --fix` را اجرا کنید.
- نگهبان سیاست OAuth: `auth.profiles.<id>.mode = "oauth"` نمی‌تواند با ورودی‌های SecretRef برای همان profile ترکیب شود. startup/reload و تفکیک auth-profile وقتی این سیاست نقض شود سریعاً شکست می‌خورند.
- برای ارائه‌دهندگان مدل مدیریت‌شده با SecretRef، ورودی‌های تولیدشده‌ی `agents/*/agent/models.json` نشانگرهای غیرمحرمانه (نه مقدارهای محرمانه‌ی تفکیک‌شده) را برای سطح‌های `apiKey`/header نگه می‌دارند.
- پایداری نشانگر بر اساس منبع معتبر است: OpenClaw نشانگرها را از snapshot پیکربندی منبع فعال (پیش از تفکیک) می‌نویسد، نه از مقدارهای محرمانه‌ی تفکیک‌شده در زمان اجرا.
- برای جست‌وجوی وب:
  - در حالت ارائه‌دهنده‌ی صریح (`tools.web.search.provider` تنظیم شده)، فقط کلید ارائه‌دهنده‌ی انتخاب‌شده فعال است.
  - در حالت خودکار (`tools.web.search.provider` تنظیم نشده)، فقط نخستین کلید ارائه‌دهنده‌ای که بر اساس تقدم تفکیک می‌شود فعال است.
  - در حالت خودکار، refهای ارائه‌دهنده‌های انتخاب‌نشده تا زمان انتخاب غیرفعال تلقی می‌شوند.
  - مسیرهای قدیمی ارائه‌دهنده‌ی `tools.web.search.*` همچنان در پنجره‌ی سازگاری تفکیک می‌شوند، اما سطح معتبر SecretRef برابر با `plugins.entries.<plugin>.config.webSearch.*` است.

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

- این اعتبارنامه‌ها از کلاس‌هایی هستند که صادرشده، دارای چرخش، حامل نشست، یا ماندگار در OAuth هستند و با تفکیک SecretRef خارجی فقط‌خواندنی سازگار نیستند.

## مرتبط

- [مدیریت رازها](/fa/gateway/secrets)
- [معناشناسی اعتبارنامه‌ی احراز هویت](/fa/auth-credential-semantics)
