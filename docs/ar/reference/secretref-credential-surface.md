---
read_when:
    - التحقق من تغطية بيانات اعتماد SecretRef
    - التحقق مما إذا كانت بيانات الاعتماد مؤهلة لاستخدام `secrets configure` أو `secrets apply`
    - التحقق من سبب وجود بيانات اعتماد خارج النطاق المدعوم
summary: السطح المرجعي المعتمد لبيانات اعتماد SecretRef المدعومة وغير المدعومة
title: سطح بيانات اعتماد SecretRef
x-i18n:
    generated_at: "2026-07-12T06:27:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 435fc25ea9268be40abc367d96def70e8d367cb0ab640a4f2d271a0e9db19147
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

تحدد هذه الصفحة السطح القياسي لبيانات اعتماد SecretRef: أي حقول بيانات الاعتماد تقبل `SecretRef` (مرجعًا مدعومًا بمتغير بيئة/ملف/تنفيذ) بدلًا من قيمة سر خام.

النطاق:

- ضمن النطاق: بيانات الاعتماد التي يزوّدها المستخدم حصرًا، والتي لا ينشئها OpenClaw ولا يدوّرها.
- خارج النطاق: بيانات الاعتماد التي تُنشأ أثناء التشغيل أو تُدوّر، ومواد تحديث OAuth، والعناصر الشبيهة بالجلسات.

تُنشأ القوائم أدناه من سجل الأهداف المصدري، ويُتحقق منها مقابل `docs/reference/secretref-user-supplied-credentials-matrix.json` في CI؛ لا تعدّل الإدخالات يدويًا.

## بيانات الاعتماد المدعومة

### أهداف `openclaw.json` ‏(`secrets configure` + `secrets apply` + `secrets audit`)

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
- `channels.googlechat.serviceAccount` عبر `serviceAccountRef` المجاور (استثناء للتوافق)
- `channels.googlechat.accounts.*.serviceAccount` عبر `serviceAccountRef` المجاور (استثناء للتوافق)

### أهداف `auth-profiles.json` ‏(`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` ‏(`type: "api_key"`؛ غير مدعوم عندما تكون `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` ‏(`type: "token"`؛ غير مدعوم عندما تكون `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

ملاحظات:

- تتطلب أهداف خطة ملف تعريف المصادقة `agentId`؛ تستهدف إدخالات الخطة `profiles.*.key` / `profiles.*.token` وتكتب المراجع المجاورة (`keyRef` / `tokenRef`). تُضمّن مراجع ملفات تعريف المصادقة في التحليل أثناء التشغيل وفي نطاق التدقيق.
- في `openclaw.json`، يجب أن تستخدم SecretRefs كائنات منظّمة مثل `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. تُرفض سلاسل العلامات القديمة `secretref-env:<ENV_VAR>` في مسارات بيانات اعتماد SecretRef؛ شغّل `openclaw doctor --fix` لترحيل العلامات الصالحة.
- حارس سياسة OAuth: لا يمكن دمج `auth.profiles.<id>.mode = "oauth"` مع مُدخلات SecretRef لملف التعريف نفسه. يفشل بدء التشغيل/إعادة التحميل وتحليل ملف تعريف المصادقة فورًا عند انتهاك هذه السياسة.
- بالنسبة إلى موفّري النماذج المُدارة عبر SecretRef، تحتفظ إدخالات `agents/*/agent/models.json` المُنشأة بعلامات غير سرية (وليس قيم الأسرار التي جرى تحليلها) لأسطح `apiKey`/الترويسات. يعتمد حفظ العلامات على المصدر بوصفه المرجع المعتمد: يكتب OpenClaw العلامات من لقطة إعداد المصدر النشطة (قبل التحليل)، وليس من قيم الأسرار المحللة أثناء التشغيل.
- بالنسبة إلى بحث الويب: في وضع الموفّر الصريح (عند تعيين `tools.web.search.provider`)، يكون مفتاح الموفّر المحدد فقط نشطًا. في الوضع التلقائي (عند عدم تعيين `tools.web.search.provider`)، يكون مفتاح الموفّر الأول الذي يُحل وفق ترتيب الأولوية هو النشط فقط، وتُعامل مراجع الموفّرين غير المحددين على أنها غير نشطة حتى اختيارها. تظل مسارات الموفّرين القديمة `tools.web.search.*` قابلة للتحليل خلال فترة التوافق، لكن سطح SecretRef القياسي هو `plugins.entries.<plugin>.config.webSearch.*`.

## بيانات الاعتماد غير المدعومة

تندرج بيانات الاعتماد هذه ضمن فئات تُنشأ أو تُدوّر أو تحمل جلسات أو تكون دائمة لـ OAuth، ولذلك لا تلائم تحليل SecretRef الخارجي للقراءة فقط:

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

## ذو صلة

- [إدارة الأسرار](/ar/gateway/secrets)
- [دلالات بيانات اعتماد المصادقة](/ar/auth-credential-semantics)
