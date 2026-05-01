---
read_when:
    - راستی‌آزمایی پوشش اعتبارنامه‌های SecretRef
    - ممیزی واجد شرایط بودن یک اعتبارنامه برای `secrets configure` یا `secrets apply`
    - بررسی اینکه چرا یک اعتبارنامه خارج از سطح پشتیبانی‌شده است
summary: سطح مرجع اعتبارنامه SecretRef پشتیبانی‌شده در برابر پشتیبانی‌نشده
title: سطح اعتبارنامهٔ SecretRef
x-i18n:
    generated_at: "2026-05-01T11:52:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41111ac82142c906005e0f585c86f2ff0b454afdaec07343c295e6b83571718e
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

این صفحه سطح مرجع اعتبارنامه SecretRef را تعریف می‌کند.

هدف دامنه:

- در دامنه: صرفا اعتبارنامه‌های ارائه‌شده توسط کاربر که OpenClaw آن‌ها را صادر یا چرخش نمی‌دهد.
- خارج از دامنه: اعتبارنامه‌های صادرشده در زمان اجرا یا چرخشی، داده‌های نوسازی OAuth، و مصنوعات شبیه نشست.

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
- `channels.googlechat.serviceAccount` از طریق همتای `serviceAccountRef` (استثنای سازگاری)
- `channels.googlechat.accounts.*.serviceAccount` از طریق همتای `serviceAccountRef` (استثنای سازگاری)

### اهداف `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`؛ وقتی `auth.profiles.<id>.mode = "oauth"` باشد پشتیبانی نمی‌شود)
- `profiles.*.tokenRef` (`type: "token"`؛ وقتی `auth.profiles.<id>.mode = "oauth"` باشد پشتیبانی نمی‌شود)

[//]: # "secretref-supported-list-end"

یادداشت‌ها:

- اهداف طرح نمایه احراز هویت به `agentId` نیاز دارند.
- ورودی‌های طرح، `profiles.*.key` / `profiles.*.token` را هدف می‌گیرند و ارجاع‌های همتا (`keyRef` / `tokenRef`) را می‌نویسند.
- ارجاع‌های نمایه احراز هویت در پوشش حل‌وفصل زمان اجرا و ممیزی گنجانده شده‌اند.
- در `openclaw.json`، SecretRefها باید از اشیای ساختاریافته‌ای مانند `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` استفاده کنند. رشته‌های نشانگر قدیمی `secretref-env:<ENV_VAR>` در مسیرهای اعتبارنامه SecretRef رد می‌شوند؛ برای مهاجرت نشانگرهای معتبر، `openclaw doctor --fix` را اجرا کنید.
- محافظ سیاست OAuth: `auth.profiles.<id>.mode = "oauth"` نمی‌تواند با ورودی‌های SecretRef برای آن نمایه ترکیب شود. راه‌اندازی/بارگذاری مجدد و حل‌وفصل نمایه احراز هویت هنگام نقض این سیاست به‌سرعت شکست می‌خورند.
- برای ارائه‌دهندگان مدل مدیریت‌شده با SecretRef، ورودی‌های تولیدشده `agents/*/agent/models.json` نشانگرهای غیرمحرمانه (نه مقادیر محرمانه حل‌شده) را برای سطوح `apiKey`/سرآیندها پایدار نگه می‌دارند.
- پایداری نشانگرها مبتنی بر منبع مرجع است: OpenClaw نشانگرها را از عکس‌برداری پیکربندی منبع فعال (پیش از حل‌وفصل) می‌نویسد، نه از مقادیر محرمانه حل‌شده در زمان اجرا.
- برای جست‌وجوی وب:
  - در حالت ارائه‌دهنده صریح (وقتی `tools.web.search.provider` تنظیم شده باشد)، فقط کلید ارائه‌دهنده انتخاب‌شده فعال است.
  - در حالت خودکار (وقتی `tools.web.search.provider` تنظیم نشده باشد)، فقط نخستین کلید ارائه‌دهنده‌ای که بر اساس تقدم حل می‌شود فعال است.
  - در حالت خودکار، ارجاع‌های ارائه‌دهنده‌های انتخاب‌نشده تا زمان انتخاب‌شدن غیرفعال تلقی می‌شوند.
  - مسیرهای ارائه‌دهنده قدیمی `tools.web.search.*` همچنان در بازه سازگاری حل می‌شوند، اما سطح مرجع SecretRef برابر با `plugins.entries.<plugin>.config.webSearch.*` است.

## اعتبارنامه‌های پشتیبانی‌نشده

اعتبارنامه‌های خارج از دامنه شامل این موارد هستند:

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

- این اعتبارنامه‌ها از دسته‌هایی هستند که صادر می‌شوند، چرخش می‌یابند، حامل نشست هستند، یا دوام OAuth دارند و با حل‌وفصل خارجی فقط‌خواندنی SecretRef سازگار نیستند.

## مرتبط

- [مدیریت اسرار](/fa/gateway/secrets)
- [معناشناسی اعتبارنامه احراز هویت](/fa/auth-credential-semantics)
