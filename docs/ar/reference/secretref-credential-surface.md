---
read_when:
    - التحقق من تغطية اعتمادات SecretRef
    - تدقيق ما إذا كان الاعتماد مؤهلًا لـ `secrets configure` أو `secrets apply`
    - التحقق من سبب كون الاعتماد خارج السطح المدعوم
summary: السطح المعياري المدعوم وغير المدعوم لاعتمادات SecretRef
title: سطح اعتماد SecretRef
x-i18n:
    generated_at: "2026-04-15T07:18:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd0b9c379236b17a72f552d6360b8b5a2269009e019c138c6bb50f4f7328ddaf
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

# سطح اعتماد SecretRef

تحدد هذه الصفحة السطح المعياري لاعتمادات SecretRef.

مقصود النطاق:

- ضمن النطاق: الاعتمادات التي يزوّدها المستخدم مباشرةً ولا يقوم OpenClaw بإصدارها أو تدويرها.
- خارج النطاق: الاعتمادات التي تُصدر في وقت التشغيل أو التي يتم تدويرها، ومواد تحديث OAuth، والعناصر الشبيهة بالجلسات.

## الاعتمادات المدعومة

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
- `channels.googlechat.serviceAccount` عبر `serviceAccountRef` المجاور (استثناء توافق)
- `channels.googlechat.accounts.*.serviceAccount` عبر `serviceAccountRef` المجاور (استثناء توافق)

### أهداف `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`؛ غير مدعوم عندما يكون `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`؛ غير مدعوم عندما يكون `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

ملاحظات:

- تتطلب أهداف خطة ملف التعريف الخاص بالمصادقة `agentId`.
- تستهدف إدخالات الخطة `profiles.*.key` / `profiles.*.token` وتكتب المراجع المجاورة (`keyRef` / `tokenRef`).
- يتم تضمين مراجع ملف التعريف الخاص بالمصادقة في دقة وقت التشغيل وتغطية التدقيق.
- حاجز سياسة OAuth: لا يمكن دمج `auth.profiles.<id>.mode = "oauth"` مع مدخلات SecretRef لهذا الملف التعريفي. يفشل بدء التشغيل/إعادة التحميل ودقة ملف التعريف الخاص بالمصادقة بسرعة عند انتهاك هذه السياسة.
- بالنسبة إلى موفري النماذج المُدارين بواسطة SecretRef، تحتفظ الإدخالات المُولَّدة في `agents/*/agent/models.json` بمؤشرات غير سرية (وليس القيم السرية التي تم حلها) لأسطح `apiKey`/الرؤوس.
- استمرار المؤشرات يعتمد على المصدر بشكل موثوق: يكتب OpenClaw المؤشرات من لقطة إعدادات المصدر النشطة (قبل الحل)، وليس من قيم الأسرار المحلولة في وقت التشغيل.
- بالنسبة إلى البحث على الويب:
  - في وضع الموفّر الصريح (عند تعيين `tools.web.search.provider`) يكون مفتاح الموفّر المحدد فقط نشطًا.
  - في الوضع التلقائي (عند عدم تعيين `tools.web.search.provider`) يكون مفتاح الموفّر الأول الذي يتم حله حسب الأسبقية فقط هو النشط.
  - في الوضع التلقائي، تُعامل مراجع الموفّرين غير المحددين على أنها غير نشطة حتى يتم تحديدها.
  - لا تزال مسارات الموفّر القديمة `tools.web.search.*` تُحل خلال نافذة التوافق، لكن سطح SecretRef المعياري هو `plugins.entries.<plugin>.config.webSearch.*`.

## الاعتمادات غير المدعومة

تشمل الاعتمادات خارج النطاق ما يلي:

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

المبرر:

- هذه الاعتمادات مُصدَرة، أو مُدوَّرة، أو مرتبطة بالجلسات، أو من فئات OAuth دائمة لا تتوافق مع حل SecretRef الخارجي للقراءة فقط.
