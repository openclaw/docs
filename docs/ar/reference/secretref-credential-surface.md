---
read_when:
    - التحقق من تغطية بيانات اعتماد SecretRef
    - تدقيق ما إذا كانت بيانات الاعتماد مؤهلة لـ `secrets configure` أو `secrets apply`
    - التحقق من سبب وجود بيانات اعتماد خارج النطاق المدعوم
summary: الواجهة المرجعية لبيانات اعتماد SecretRef المدعومة مقابل غير المدعومة
title: واجهة بيانات اعتماد SecretRef
x-i18n:
    generated_at: "2026-05-01T07:43:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41111ac82142c906005e0f585c86f2ff0b454afdaec07343c295e6b83571718e
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

تحدد هذه الصفحة سطح بيانات الاعتماد SecretRef المعتمد.

هدف النطاق:

- داخل النطاق: بيانات الاعتماد التي يقدّمها المستخدم بدقة، والتي لا ينشئها OpenClaw ولا يدوّرها.
- خارج النطاق: بيانات الاعتماد التي تُنشأ أو تُدوّر وقت التشغيل، ومواد تحديث OAuth، والعناصر الشبيهة بالجلسات.

## بيانات الاعتماد المدعومة

### أهداف `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `channels.googlechat.serviceAccount` عبر الحقل الشقيق `serviceAccountRef` (استثناء توافق)
- `channels.googlechat.accounts.*.serviceAccount` عبر الحقل الشقيق `serviceAccountRef` (استثناء توافق)

### أهداف `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`؛ غير مدعوم عندما تكون `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`؛ غير مدعوم عندما تكون `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

ملاحظات:

- تتطلب أهداف خطة ملف تعريف المصادقة `agentId`.
- تستهدف إدخالات الخطة `profiles.*.key` / `profiles.*.token` وتكتب المراجع الشقيقة (`keyRef` / `tokenRef`).
- تُضمَّن مراجع ملف تعريف المصادقة في حلّ وقت التشغيل وتغطية التدقيق.
- في `openclaw.json`، يجب أن تستخدم SecretRefs كائنات منظمة مثل `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. تُرفَض سلاسل علامات `secretref-env:<ENV_VAR>` القديمة في مسارات بيانات اعتماد SecretRef؛ شغّل `openclaw doctor --fix` لترحيل العلامات الصالحة.
- حارس سياسة OAuth: لا يمكن دمج `auth.profiles.<id>.mode = "oauth"` مع مُدخلات SecretRef لذلك الملف التعريفي. يفشل بدء التشغيل/إعادة التحميل وحلّ ملف تعريف المصادقة بسرعة عند انتهاك هذه السياسة.
- لموفري النماذج المُدارين عبر SecretRef، تُبقي إدخالات `agents/*/agent/models.json` المُنشأة علامات غير سرية (وليس قيمًا سرية محلولة) لأسطح `apiKey`/الرؤوس.
- استمرار العلامات معتمد على المصدر: يكتب OpenClaw العلامات من لقطة إعداد المصدر النشط (قبل الحل)، وليس من قيم أسرار وقت التشغيل المحلولة.
- بالنسبة إلى بحث الويب:
  - في وضع الموفّر الصريح (عند ضبط `tools.web.search.provider`)، يكون مفتاح الموفّر المحدد وحده نشطًا.
  - في الوضع التلقائي (عند عدم ضبط `tools.web.search.provider`)، يكون مفتاح الموفّر الأول الذي يُحل وفق الأسبقية هو وحده نشطًا.
  - في الوضع التلقائي، تُعامَل مراجع الموفّرين غير المحددين على أنها غير نشطة حتى يتم تحديدها.
  - لا تزال مسارات موفري `tools.web.search.*` القديمة تُحل خلال نافذة التوافق، لكن سطح SecretRef المعتمد هو `plugins.entries.<plugin>.config.webSearch.*`.

## بيانات الاعتماد غير المدعومة

تتضمن بيانات الاعتماد الخارجة عن النطاق:

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

السبب:

- تنتمي بيانات الاعتماد هذه إلى فئات تُنشأ أو تُدوّر أو تحمل جلسات أو تدوم عبر OAuth، ولا تتوافق مع حل SecretRef خارجي للقراءة فقط.

## ذات صلة

- [إدارة الأسرار](/ar/gateway/secrets)
- [دلالات بيانات اعتماد المصادقة](/ar/auth-credential-semantics)
