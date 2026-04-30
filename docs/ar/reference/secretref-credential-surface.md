---
read_when:
    - التحقق من تغطية بيانات اعتماد SecretRef
    - تدقيق ما إذا كانت بيانات اعتماد مؤهلة لـ `secrets configure` أو `secrets apply`
    - التحقق من سبب وجود بيانات اعتماد خارج النطاق المدعوم
summary: 'واجهة بيانات اعتماد SecretRef المرجعية: المدعومة مقابل غير المدعومة'
title: سطح بيانات اعتماد SecretRef
x-i18n:
    generated_at: "2026-04-30T08:24:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: b04902427e9851cc36c1dfd07ed44b46b55450c251075e9955af6696f08bc334
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

تحدد هذه الصفحة سطح بيانات اعتماد SecretRef المعتمد.

الغرض من النطاق:

- داخل النطاق: بيانات اعتماد يزوّدها المستخدم صراحة ولا يقوم OpenClaw بإنشائها أو تدويرها.
- خارج النطاق: بيانات الاعتماد المنشأة وقت التشغيل أو الدوّارة، ومواد تحديث OAuth، والآثار الشبيهة بالجلسات.

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
- `channels.googlechat.serviceAccount` عبر الحقل الشقيق `serviceAccountRef` (استثناء للتوافق)
- `channels.googlechat.accounts.*.serviceAccount` عبر الحقل الشقيق `serviceAccountRef` (استثناء للتوافق)

### أهداف `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`؛ غير مدعوم عندما يكون `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`؛ غير مدعوم عندما يكون `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

ملاحظات:

- تتطلب أهداف خطة ملفات تعريف المصادقة `agentId`.
- تستهدف إدخالات الخطة `profiles.*.key` / `profiles.*.token` وتكتب المراجع الشقيقة (`keyRef` / `tokenRef`).
- تُضمَّن مراجع ملفات تعريف المصادقة في الاستبانة وقت التشغيل وتغطية التدقيق.
- في `openclaw.json`، يجب أن تستخدم SecretRefs كائنات مهيكلة مثل `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. تُرفض سلاسل علامات `secretref-env:<ENV_VAR>` القديمة في مسارات بيانات اعتماد SecretRef؛ شغّل `openclaw doctor --fix` لترحيل العلامات الصالحة.
- حارس سياسة OAuth: لا يمكن الجمع بين `auth.profiles.<id>.mode = "oauth"` ومدخلات SecretRef لذلك الملف التعريفي. يفشل بدء التشغيل/إعادة التحميل واستبانة ملف تعريف المصادقة بسرعة عند انتهاك هذه السياسة.
- بالنسبة إلى مزودي النماذج المُدارين عبر SecretRef، تحتفظ إدخالات `agents/*/agent/models.json` المنشأة بعلامات غير سرية (وليس قيم الأسرار المستبانة) لأسطح `apiKey`/الرؤوس.
- استمرار العلامات موثوق من المصدر: يكتب OpenClaw العلامات من لقطة إعدادات المصدر النشطة (قبل الاستبانة)، وليس من قيم أسرار وقت التشغيل المستبانة.
- بالنسبة إلى بحث الويب:
  - في وضع المزود الصريح (عند ضبط `tools.web.search.provider`)، يكون مفتاح المزود المحدد فقط نشطًا.
  - في الوضع التلقائي (عند عدم ضبط `tools.web.search.provider`)، يكون أول مفتاح مزود يستبان حسب الأسبقية فقط نشطًا.
  - في الوضع التلقائي، تُعامَل مراجع المزودين غير المحددين على أنها غير نشطة حتى يتم تحديدها.
  - تظل مسارات المزود القديمة `tools.web.search.*` تُستبان أثناء نافذة التوافق، لكن سطح SecretRef المعتمد هو `plugins.entries.<plugin>.config.webSearch.*`.

## بيانات الاعتماد غير المدعومة

تشمل بيانات الاعتماد خارج النطاق ما يلي:

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

- هذه بيانات اعتماد منشأة أو مدوّرة أو حاملة لجلسة أو فئات OAuth دائمة لا تلائم استبانة SecretRef الخارجية للقراءة فقط.

## ذو صلة

- [إدارة الأسرار](/ar/gateway/secrets)
- [دلالات بيانات اعتماد المصادقة](/ar/auth-credential-semantics)
