---
read_when:
    - التحقق من تغطية بيانات اعتماد SecretRef
    - تدقيق ما إذا كانت بيانات الاعتماد مؤهلة لـ `secrets configure` أو `secrets apply`
    - التحقق من سبب كون بيانات الاعتماد خارج السطح المدعوم
summary: السطح الرسمي المدعوم وغير المدعوم لبيانات اعتماد SecretRef
title: سطح بيانات اعتماد SecretRef
x-i18n:
    generated_at: "2026-04-24T08:03:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddb8d7660f2757e3d2a078c891f52325bf9ec9291ec7d5f5e06daef4041e2006
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

تحدد هذه الصفحة السطح الرسمي لبيانات اعتماد SecretRef.

غرض النطاق:

- ضمن النطاق: بيانات الاعتماد التي يزوّدها المستخدم بشكل صارم والتي لا يقوم OpenClaw بإصدارها أو تدويرها.
- خارج النطاق: بيانات الاعتماد التي تُصدرها بيئة التشغيل أو تُدار دوريًا، ومواد تحديث OAuth، والقطع الشبيهة بالجلسات.

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
- `channels.googlechat.serviceAccount` عبر `serviceAccountRef` الشقيق (استثناء توافق)
- `channels.googlechat.accounts.*.serviceAccount` عبر `serviceAccountRef` الشقيق (استثناء توافق)

### أهداف `auth-profiles.json` ‏(`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` ‏(`type: "api_key"`؛ وغير مدعوم عندما تكون `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` ‏(`type: "token"`؛ وغير مدعوم عندما تكون `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

ملاحظات:

- تتطلب أهداف خطة auth-profile وجود `agentId`.
- تستهدف إدخالات الخطة `profiles.*.key` / `profiles.*.token` وتكتب المراجع الشقيقة (`keyRef` / `tokenRef`).
- تُضمَّن مراجع auth-profile في حلّ وقت التشغيل وفي تغطية التدقيق.
- حاجز سياسة OAuth: لا يمكن الجمع بين `auth.profiles.<id>.mode = "oauth"` ومدخلات SecretRef لذلك الملف الشخصي. ويفشل بدء التشغيل/إعادة التحميل وحلّ auth-profile سريعًا عندما يتم انتهاك هذه السياسة.
- بالنسبة إلى مزودي النماذج المُدارة عبر SecretRef، تحتفظ إدخالات `agents/*/agent/models.json` المولّدة بعلامات غير سرية (وليست قيم أسرار محلولة) لأسطح `apiKey`/الرؤوس.
- تكون استمرارية العلامات معتمدة على المصدر: يكتب OpenClaw العلامات من لقطة إعدادات المصدر النشطة (قبل الحلّ)، وليس من قيم الأسرار المحلولة في وقت التشغيل.
- بالنسبة إلى البحث على الويب:
  - في وضع provider الصريح (عند ضبط `tools.web.search.provider`)، يكون مفتاح provider المحدد فقط نشطًا.
  - في الوضع التلقائي (عندما لا يتم ضبط `tools.web.search.provider`)، يكون مفتاح provider الأول الذي يُحل وفق الأولوية هو النشط فقط.
  - في الوضع التلقائي، تُعامل مراجع providers غير المحددة على أنها غير نشطة إلى أن يتم اختيارها.
  - لا تزال مسارات provider القديمة `tools.web.search.*` تُحل خلال نافذة التوافق، لكن السطح الرسمي لـ SecretRef هو `plugins.entries.<plugin>.config.webSearch.*`.

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

المبرر:

- هذه بيانات اعتماد مُصدَرة أو مُدارة دوريًا أو حاملة للجلسات أو من فئات OAuth دائمة لا تتوافق مع حلّ SecretRef الخارجي للقراءة فقط.

## ذو صلة

- [إدارة الأسرار](/ar/gateway/secrets)
- [دلالات بيانات اعتماد المصادقة](/ar/auth-credential-semantics)
