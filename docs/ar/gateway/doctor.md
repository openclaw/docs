---
read_when:
    - إضافة ترحيلات Doctor أو تعديلها
    - إدخال تغييرات كاسرة في الإعدادات
summary: 'أمر Doctor: فحوصات السلامة، وترحيلات الإعدادات، وخطوات الإصلاح'
title: Doctor
x-i18n:
    generated_at: "2026-04-24T07:41:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cc0ddb91af47a246c9a37528942b7d53c166255469169d6cb0268f83359c400
    source_path: gateway/doctor.md
    workflow: 15
---

يُعد `openclaw doctor` أداة الإصلاح + الترحيل في OpenClaw. فهو يصلح
الإعدادات/الحالة القديمة، ويفحص السلامة، ويقدّم خطوات إصلاح قابلة للتنفيذ.

## البدء السريع

```bash
openclaw doctor
```

### بدون واجهة / للأتمتة

```bash
openclaw doctor --yes
```

اقبل القيم الافتراضية من دون مطالبة (بما في ذلك خطوات إصلاح إعادة التشغيل/الخدمة/sandbox عند الاقتضاء).

```bash
openclaw doctor --repair
```

طبّق الإصلاحات الموصى بها من دون مطالبة (الإصلاحات + إعادة التشغيل عندما يكون ذلك آمنًا).

```bash
openclaw doctor --repair --force
```

طبّق الإصلاحات الشديدة أيضًا (يكتب فوق إعدادات supervisor المخصصة).

```bash
openclaw doctor --non-interactive
```

شغّل من دون مطالبات وطبّق فقط الترحيلات الآمنة (تطبيع الإعدادات + نقل الحالة على القرص). ويتخطى إجراءات إعادة التشغيل/الخدمة/sandbox التي تتطلب تأكيدًا بشريًا.
تعمل ترحيلات الحالة القديمة تلقائيًا عند اكتشافها.

```bash
openclaw doctor --deep
```

افحص خدمات النظام بحثًا عن تثبيتات Gateway إضافية (launchd/systemd/schtasks).

إذا كنت تريد مراجعة التغييرات قبل الكتابة، فافتح ملف الإعدادات أولًا:

```bash
cat ~/.openclaw/openclaw.json
```

## ما الذي يفعله (ملخص)

- تحديث اختياري قبل التشغيل لتثبيتات git (في الوضع التفاعلي فقط).
- فحص حداثة بروتوكول واجهة المستخدم (يعيد بناء Control UI عندما يكون مخطط البروتوكول أحدث).
- فحص السلامة + مطالبة بإعادة التشغيل.
- ملخص حالة Skills (المؤهلة/المفقودة/المحجوبة) وحالة Plugin.
- تطبيع الإعدادات للقيم القديمة.
- ترحيل إعدادات Talk من حقول `talk.*` القديمة المسطحة إلى `talk.provider` + `talk.providers.<provider>`.
- فحوصات ترحيل المتصفح لإعدادات إضافات Chrome القديمة وجاهزية Chrome MCP.
- تحذيرات تجاوز مزوّد OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- تحذيرات حجب Codex OAuth (`models.providers.openai-codex`).
- فحص المتطلبات المسبقة لـ OAuth TLS لملفات تعريف OpenAI Codex OAuth.
- ترحيل الحالة القديمة على القرص (الجلسات/دليل الوكيل/مصادقة WhatsApp).
- ترحيل مفاتيح عقود بيان Plugin القديمة (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` ← `contracts`).
- ترحيل مخزن Cron القديم (`jobId`, `schedule.cron`, حقول delivery/payload على المستوى الأعلى، و`provider` في payload، ووظائف الرجوع إلى Webhook البسيطة `notify: true`).
- فحص ملفات قفل الجلسات وتنظيف الأقفال القديمة.
- فحوصات سلامة الحالة والأذونات (الجلسات، والنصوص المفرغة، ودليل الحالة).
- فحوصات أذونات ملف الإعدادات (`chmod 600`) عند التشغيل محليًا.
- سلامة مصادقة النماذج: يفحص انتهاء صلاحية OAuth، ويمكنه تحديث الرموز المميزة التي أوشكت على الانتهاء، ويبلغ عن حالات التهدئة/التعطيل في ملفات تعريف المصادقة.
- اكتشاف دليل مساحة عمل إضافي (`~/openclaw`).
- إصلاح صورة sandbox عند تفعيل sandboxing.
- ترحيل الخدمات القديمة واكتشاف Gateways إضافية.
- ترحيل حالة قناة Matrix القديمة (في وضع `--fix` / `--repair`).
- فحوصات وقت تشغيل Gateway (الخدمة مثبتة لكنها غير مشغلة؛ تصنيف launchd مخزن مؤقتًا).
- تحذيرات حالة القنوات (يتم فحصها من Gateway قيد التشغيل).
- تدقيق إعداد supervisor (`launchd/systemd/schtasks`) مع إصلاح اختياري.
- فحوصات أفضل ممارسات وقت تشغيل Gateway (Node مقابل Bun، ومسارات مدير الإصدارات).
- تشخيصات تعارض منفذ Gateway (الافتراضي `18789`).
- تحذيرات أمنية لسياسات الرسائل المباشرة المفتوحة.
- فحوصات مصادقة Gateway لوضع الرمز المحلي (يوفر إنشاء رمز عندما لا يوجد مصدر رمز؛ ولا يكتب فوق إعدادات الرمز من نوع SecretRef).
- اكتشاف مشكلات اقتران الأجهزة (طلبات الاقتران الأولى المعلقة، وترقيات الدور/النطاقات المعلقة، وانجراف ذاكرة التخزين المؤقت المحلية القديمة لرمز الجهاز، وانجراف مصادقة السجل المقترن).
- فحص systemd linger على Linux.
- فحص حجم ملف bootstrap في مساحة العمل (تحذيرات الاقتطاع/الاقتراب من الحد لملفات السياق).
- فحص حالة إكمال shell والتثبيت/الترقية التلقائية.
- فحص جاهزية مزوّد embeddings للبحث في الذاكرة (نموذج محلي، أو مفتاح API بعيد، أو ملف QMD التنفيذي).
- فحوصات تثبيت المصدر (عدم تطابق مساحة عمل pnpm، وأصول UI المفقودة، وملف tsx التنفيذي المفقود).
- كتابة الإعدادات المحدثة + البيانات الوصفية للمعالج.

## التعبئة والتهيئة في واجهة Dreams وإعادة التعيين

يتضمن مشهد Dreams في Control UI إجراءات **Backfill** و**Reset** و**Clear Grounded**
من أجل سير عمل Dreaming المؤصل. وتستخدم هذه الإجراءات طرق RPC
على نمط doctor في gateway، لكنها **ليست** جزءًا من إصلاح/ترحيل
CLI الخاص بـ `openclaw doctor`.

ما الذي تفعله:

- **Backfill** يفحص ملفات `memory/YYYY-MM-DD.md` التاريخية في
  مساحة العمل النشطة، ويشغّل تمريرة يوميات REM المؤصلة، ويكتب إدخالات
  تعبئة قابلة للعكس في `DREAMS.md`.
- **Reset** يزيل فقط إدخالات يوميات التعبئة المعلّمة تلك من `DREAMS.md`.
- **Clear Grounded** يزيل فقط الإدخالات المرحلية القصيرة الأمد المؤصلة فقط التي
  جاءت من إعادة تشغيل تاريخية ولم تراكم بعد استدعاءً حيًا أو دعمًا
  يوميًا.

ما الذي **لا** تفعله هذه الإجراءات بذاتها:

- لا تعدّل `MEMORY.md`
- لا تشغّل ترحيلات doctor الكاملة
- لا تجهّز المرشحين المؤصلين تلقائيًا داخل مخزن الترقية الحي قصير الأمد
  إلا إذا شغّلت أولًا مسار CLI المرحلي صراحةً

إذا كنت تريد أن تؤثر إعادة التشغيل التاريخية المؤصلة في مسار الترقية العميقة
العادي، فاستخدم تدفق CLI بدلًا من ذلك:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

يجهّز هذا المرشحين الدائمين المؤصلين داخل مخزن Dreaming قصير الأمد مع
الإبقاء على `DREAMS.md` كسطح مراجعة.

## السلوك المفصل والمبرر

### 0) تحديث اختياري (تثبيتات git)

إذا كان هذا نسخة checkout من git وكان doctor يعمل تفاعليًا، فإنه يعرض
التحديث (fetch/rebase/build) قبل تشغيل doctor.

### 1) تطبيع الإعدادات

إذا كانت الإعدادات تحتوي على أشكال قيم قديمة (على سبيل المثال `messages.ackReaction`
من دون تجاوز خاص بالقناة)، فإن doctor يطبّعها إلى
المخطط الحالي.

ويشمل ذلك حقول Talk القديمة المسطحة. فإعداد Talk العام الحالي هو
`talk.provider` + `talk.providers.<provider>`. ويعيد doctor كتابة الأشكال القديمة
من `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` إلى خريطة المزوّد.

### 2) ترحيلات مفاتيح الإعدادات القديمة

عندما تحتوي الإعدادات على مفاتيح متقادمة، ترفض الأوامر الأخرى التشغيل وتطلب
منك تشغيل `openclaw doctor`.

سيقوم doctor بما يلي:

- شرح المفاتيح القديمة التي تم العثور عليها.
- عرض الترحيل الذي طبّقه.
- إعادة كتابة `~/.openclaw/openclaw.json` بالمخطط المحدّث.

يشغّل Gateway أيضًا ترحيلات doctor تلقائيًا عند بدء التشغيل عندما يكتشف
تنسيق إعدادات قديمًا، بحيث يتم إصلاح الإعدادات القديمة من دون تدخل يدوي.
وتتم معالجة ترحيلات مخزن Cron عبر `openclaw doctor --fix`.

الترحيلات الحالية:

- `routing.allowFrom` ← `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` ← `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` ← `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` ← `messages.groupChat.mentionPatterns`
- `routing.queue` ← `messages.queue`
- `routing.bindings` ← `bindings` على المستوى الأعلى
- `routing.agents`/`routing.defaultAgentId` ← `agents.list` + `agents.list[].default`
- الحقول القديمة `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` ← `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` ← `tools.agentToAgent`
- `routing.transcribeAudio` ← `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) ← `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) ← `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) ← `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) ← `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` ← `"mock"`
- `plugins.entries.voice-call.config.twilio.from` ← `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` ← `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  ← `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` ← `bindings[].match.accountId`
- بالنسبة إلى القنوات التي تحتوي على `accounts` مسماة لكن ما تزال فيها قيم قناة على المستوى الأعلى خاصة بحساب واحد، انقل تلك القيم ذات النطاق الحسابي إلى الحساب المرفوع المختار لتلك القناة (`accounts.default` في معظم القنوات؛ ويمكن لـ Matrix الحفاظ على هدف مسمّى/افتراضي مطابق موجود)
- `identity` ← `agents.list[].identity`
- `agent.*` ← `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  ← `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` ← `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` ← `"existing-session"`
- إزالة `browser.relayBindHost` (إعداد extension relay قديم)

تتضمن تحذيرات doctor أيضًا إرشادات الحساب الافتراضي للقنوات متعددة الحسابات:

- إذا تم إعداد إدخالين أو أكثر في `channels.<channel>.accounts` من دون `channels.<channel>.defaultAccount` أو `accounts.default`، فإن doctor يحذر من أن التوجيه الرجوعي قد يختار حسابًا غير متوقع.
- إذا كانت `channels.<channel>.defaultAccount` مضبوطة على معرّف حساب غير معروف، فإن doctor يحذر ويعرض معرّفات الحسابات المضبوطة.

### 2b) تجاوزات مزوّد OpenCode

إذا أضفت `models.providers.opencode` أو `opencode-zen` أو `opencode-go`
يدويًا، فإنه يتجاوز كتالوج OpenCode المضمن القادم من `@mariozechner/pi-ai`.
وقد يفرض ذلك توجيه النماذج إلى API غير صحيح أو يجعل التكاليف صفرية. ويحذر doctor حتى
تتمكن من إزالة التجاوز واستعادة توجيه API والتكاليف لكل نموذج.

### 2c) ترحيل المتصفح وجاهزية Chrome MCP

إذا كان إعداد المتصفح لديك ما يزال يشير إلى مسار إضافة Chrome المحذوفة، فإن doctor
يطبعّه إلى نموذج الإرفاق الحالي لـ Chrome MCP المحلي على المضيف:

- `browser.profiles.*.driver: "extension"` تصبح `"existing-session"`
- تتم إزالة `browser.relayBindHost`

يدقق doctor أيضًا مسار Chrome MCP المحلي على المضيف عندما تستخدم
`defaultProfile: "user"` أو ملف تعريف `existing-session` مضبوطًا:

- يفحص ما إذا كان Google Chrome مثبتًا على المضيف نفسه لملفات
  الاتصال التلقائي الافتراضية
- يفحص إصدار Chrome المكتشف ويحذر عندما يكون أقل من Chrome 144
- يذكّرك بتفعيل remote debugging في صفحة inspect الخاصة بالمتصفح (على
  سبيل المثال `chrome://inspect/#remote-debugging` أو `brave://inspect/#remote-debugging`
  أو `edge://inspect/#remote-debugging`)

لا يستطيع doctor تفعيل إعداد Chrome من جهتك. وما يزال Chrome MCP المحلي على المضيف
يتطلب:

- متصفحًا قائمًا على Chromium بإصدار 144+ على مضيف gateway/node
- تشغيل المتصفح محليًا
- تفعيل remote debugging في ذلك المتصفح
- الموافقة على أول مطالبة consent للإرفاق في المتصفح

تتعلق الجاهزية هنا فقط بمتطلبات الإرفاق المحلي. وما يزال existing-session
يحافظ على حدود مسار Chrome MCP الحالية؛ أما المسارات المتقدمة مثل `responsebody` وتصدير PDF
واعتراض التنزيلات والإجراءات الدفعية فما تزال تتطلب متصفحًا مُدارًا
أو ملف تعريف CDP خام.

لا ينطبق هذا الفحص على تدفقات Docker أو sandbox أو remote-browser أو غيرها من
التدفقات بلا واجهة. فهي تواصل استخدام CDP الخام.

### 2d) المتطلبات المسبقة لـ OAuth TLS

عند إعداد ملف تعريف OpenAI Codex OAuth، يقوم doctor بفحص
نقطة تفويض OpenAI للتحقق من أن مكدس TLS المحلي في Node/OpenSSL يستطيع
التحقق من سلسلة الشهادات. وإذا فشل الفحص بسبب خطأ في الشهادة (على
سبيل المثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` أو شهادة منتهية أو شهادة موقعة ذاتيًا)،
فإن doctor يطبع إرشادات إصلاح خاصة بالمنصة. وعلى macOS مع Node من Homebrew،
يكون الإصلاح عادةً `brew postinstall ca-certificates`. ومع `--deep`، يعمل الفحص
حتى لو كان Gateway سليمًا.

### 2c) تجاوزات مزوّد Codex OAuth

إذا كنت قد أضفت سابقًا إعدادات نقل OpenAI قديمة تحت
`models.providers.openai-codex`، فقد تحجب مسار
مزوّد Codex OAuth المضمن الذي تستخدمه الإصدارات الأحدث تلقائيًا. ويحذر Doctor عندما يرى
إعدادات النقل القديمة تلك إلى جانب Codex OAuth حتى تتمكن من إزالة تجاوز النقل القديم
أو إعادة كتابته واستعادة سلوك التوجيه/الرجوع المضمن.
وما تزال الوكلاء المخصصون وتجاوزات الرؤوس فقط مدعومة ولا
تطلق هذا التحذير.

### 3) ترحيلات الحالة القديمة (تخطيط القرص)

يمكن لـ Doctor ترحيل التخطيطات الأقدم على القرص إلى البنية الحالية:

- مخزن الجلسات + النصوص المفرغة:
  - من `~/.openclaw/sessions/` إلى `~/.openclaw/agents/<agentId>/sessions/`
- دليل الوكيل:
  - من `~/.openclaw/agent/` إلى `~/.openclaw/agents/<agentId>/agent/`
- حالة مصادقة WhatsApp ‏(Baileys):
  - من `~/.openclaw/credentials/*.json` القديمة (باستثناء `oauth.json`)
  - إلى `~/.openclaw/credentials/whatsapp/<accountId>/...` (معرّف الحساب الافتراضي: `default`)

هذه الترحيلات تُنفَّذ بأفضل جهد وهي idempotent؛ وسيصدر Doctor تحذيرات عندما
يترك أي مجلدات قديمة خلفه كنسخ احتياطية. كما يقوم Gateway/CLI أيضًا بترحيل
الجلسات القديمة + دليل الوكيل تلقائيًا عند بدء التشغيل بحيث تستقر
السجلات/المصادقة/النماذج في المسار الخاص بكل وكيل من دون تشغيل Doctor يدويًا.
أما مصادقة WhatsApp فيتم ترحيلها عمدًا فقط عبر `openclaw doctor`. كما أن تطبيع
المزوّد/خريطة المزوّد في Talk يقارن الآن بالمساواة البنيوية، لذا لم تعد
الفروق الناتجة عن ترتيب المفاتيح فقط تطلق تغييرات `doctor --fix` متكررة عديمة الأثر.

### 3a) ترحيلات بيان Plugin القديمة

يفحص Doctor جميع بيانات Plugins المثبتة بحثًا عن مفاتيح إمكانات
عليا المستوى متقادمة (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). وعند العثور عليها، يعرض نقلها إلى كائن `contracts`
وإعادة كتابة ملف البيان في مكانه. هذا الترحيل idempotent؛
فإذا كان مفتاح `contracts` يحتوي بالفعل على القيم نفسها، تتم إزالة المفتاح القديم
من دون تكرار البيانات.

### 3b) ترحيلات مخزن Cron القديمة

يفحص Doctor أيضًا مخزن وظائف Cron (`~/.openclaw/cron/jobs.json` افتراضيًا،
أو `cron.store` عند تجاوزه) بحثًا عن أشكال وظائف قديمة ما يزال المجدول
يقبلها للتوافق.

تتضمن عمليات تنظيف Cron الحالية ما يلي:

- `jobId` ← `id`
- `schedule.cron` ← `schedule.expr`
- حقول payload على المستوى الأعلى (`message`, `model`, `thinking`, ...) ← `payload`
- حقول delivery على المستوى الأعلى (`deliver`, `channel`, `to`, `provider`, ...) ← `delivery`
- الأسماء البديلة للتسليم في payload الخاصة بـ `provider` ← `delivery.channel` صريح
- وظائف الرجوع البسيطة القديمة لـ Webhook من نوع `notify: true` ← `delivery.mode="webhook"` صريح مع `delivery.to=cron.webhook`

لا يرحّل Doctor وظائف `notify: true` تلقائيًا إلا عندما يمكنه فعل ذلك من دون
تغيير السلوك. وإذا جمعت وظيفة بين رجوع notify القديم ووضع
تسليم غير Webhook موجود، فإن Doctor يحذر ويترك تلك الوظيفة للمراجعة اليدوية.

### 3c) تنظيف أقفال الجلسات

يفحص Doctor كل دليل جلسات الوكلاء بحثًا عن ملفات أقفال كتابة قديمة — وهي ملفات تُترك
عندما تنتهي الجلسة بشكل غير طبيعي. ولكل ملف قفل يعثر عليه، يبلّغ عن:
المسار، وPID، وما إذا كان PID ما يزال حيًا، وعمر القفل، وما إذا كان
يُعتبر قديمًا (PID ميت أو أقدم من 30 دقيقة). وفي وضع `--fix` / `--repair`
يزيل ملفات الأقفال القديمة تلقائيًا؛ وإلا فإنه يطبع ملاحظة ويطلب
منك إعادة التشغيل باستخدام `--fix`.

### 4) فحوصات سلامة الحالة (استمرارية الجلسات، والتوجيه، والأمان)

يمثل دليل الحالة جذع الدماغ التشغيلي. وإذا اختفى، فستخسر
الجلسات، وبيانات الاعتماد، والسجلات، والإعدادات (ما لم تكن لديك نسخ احتياطية في مكان آخر).

يفحص Doctor ما يلي:

- **غياب دليل الحالة**: يحذر من فقدان كارثي للحالة، ويطلب إعادة إنشاء
  الدليل، ويذكّرك بأنه لا يستطيع استعادة البيانات المفقودة.
- **أذونات دليل الحالة**: يتحقق من قابلية الكتابة؛ ويعرض إصلاح الأذونات
  (ويصدر تلميح `chown` عند اكتشاف عدم تطابق المالك/المجموعة).
- **دليل حالة macOS المتزامن مع السحابة**: يحذر عندما تتحلل الحالة تحت iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) أو
  `~/Library/CloudStorage/...` لأن المسارات المدعومة بالمزامنة قد تسبب بطئًا في I/O
  وسباقات في الأقفال/المزامنة.
- **دليل حالة Linux على SD أو eMMC**: يحذر عندما تتحلل الحالة إلى مصدر ربط `mmcblk*`,
  لأن I/O العشوائي المدعوم بـ SD أو eMMC قد يكون أبطأ ويتعرض لاستهلاك أسرع
  تحت كتابات الجلسات وبيانات الاعتماد.
- **غياب أدلة الجلسات**: تتطلب `sessions/` ودليل مخزن الجلسات
  لحفظ السجل وتجنب أعطال `ENOENT`.
- **عدم تطابق النص المفرغ**: يحذر عندما تكون إدخالات الجلسات الحديثة تفتقد
  ملفات النص المفرغ.
- **جلسة رئيسية من نوع “JSONL بسطر واحد”**: يضع علامة عندما يحتوي النص المفرغ الرئيسي على سطر واحد فقط
  (السجل لا يتراكم).
- **أدلة حالة متعددة**: يحذر عندما توجد مجلدات `~/.openclaw` متعددة عبر
  أدلة المنزل أو عندما تشير `OPENCLAW_STATE_DIR` إلى مكان آخر (قد
  ينقسم السجل بين التثبيتات).
- **تذكير الوضع البعيد**: إذا كانت `gateway.mode=remote`، فإن Doctor يذكرك بتشغيله
  على المضيف البعيد (فالحالة توجد هناك).
- **أذونات ملف الإعدادات**: يحذر إذا كان `~/.openclaw/openclaw.json`
  قابلاً للقراءة من المجموعة/العالم ويعرض تشديده إلى `600`.

### 5) سلامة مصادقة النماذج (انتهاء OAuth)

يفحص Doctor ملفات OAuth في مخزن المصادقة، ويحذر عندما تكون الرموز المميزة
على وشك الانتهاء/منتهية، ويمكنه تحديثها عندما يكون ذلك آمنًا. وإذا كان ملف
OAuth/الرمز الخاص بـ Anthropic قديمًا، فإنه يقترح مفتاح Anthropic API أو
مسار setup-token الخاص بـ Anthropic.
ولا تظهر مطالبات التحديث إلا عند التشغيل التفاعلي (TTY)؛ أما `--non-interactive`
فيتخطى محاولات التحديث.

عندما يفشل تحديث OAuth فشلًا دائمًا (على سبيل المثال `refresh_token_reused`,
أو `invalid_grant`، أو عندما يخبرك مزوّد بضرورة تسجيل الدخول مرة أخرى)، فإن Doctor يبلغ
بأن إعادة المصادقة مطلوبة ويطبع الأمر الدقيق `openclaw models auth login --provider ...`
الواجب تشغيله.

كما يبلّغ Doctor أيضًا عن ملفات تعريف المصادقة غير القابلة للاستخدام مؤقتًا بسبب:

- فترات تهدئة قصيرة (حدود المعدل/المهلات/إخفاقات المصادقة)
- تعطيلات أطول (إخفاقات الفوترة/الرصيد)

### 6) التحقق من نموذج Hooks

إذا كانت `hooks.gmail.model` مضبوطة، فإن Doctor يتحقق من مرجع النموذج مقابل
الكتالوج وقائمة السماح ويحذر عندما لا يمكن تحليله أو يكون غير مسموح به.

### 7) إصلاح صورة sandbox

عند تفعيل sandboxing، يفحص Doctor صور Docker ويعرض بناءها أو
التبديل إلى الأسماء القديمة إذا كانت الصورة الحالية مفقودة.

### 7b) تبعيات وقت التشغيل لـ Plugin المضمن

يتحقق Doctor من تبعيات وقت التشغيل فقط لـ Plugins المضمنة النشطة في
الإعدادات الحالية أو المفعّلة بالافتراضي عبر البيان المضمن الخاص بها، مثل
`plugins.entries.discord.enabled: true`، أو الإعداد القديم
`channels.discord.enabled: true`، أو مزوّد مضمن مفعّل افتراضيًا. وإذا كان أي
شيء مفقودًا، فإن Doctor يبلّغ عن الحزم ويثبتها في وضع
`openclaw doctor --fix` / `openclaw doctor --repair`. أما Plugins الخارجية فما تزال
تستخدم `openclaw plugins install` / `openclaw plugins update`; ولا يقوم Doctor
بتثبيت التبعيات لمسارات Plugins العشوائية.

### 8) ترحيلات خدمة Gateway وتلميحات التنظيف

يكتشف Doctor خدمات Gateway القديمة (`launchd/systemd/schtasks`) و
يعرض إزالتها وتثبيت خدمة OpenClaw باستخدام منفذ gateway الحالي.
كما يمكنه أيضًا الفحص بحثًا عن خدمات إضافية شبيهة بـ Gateway وطباعة تلميحات تنظيف.
وتُعتبر خدمات OpenClaw gateway المسماة بحسب الملف الشخصي خدمات من الدرجة الأولى ولا
تُعلَّم بوصفها “إضافية”.

### 8b) ترحيل Matrix عند بدء التشغيل

عندما يحتوي حساب قناة Matrix على ترحيل حالة قديم معلق أو قابل للتنفيذ،
فإن Doctor (في وضع `--fix` / `--repair`) ينشئ لقطة قبل الترحيل ثم
يشغّل خطوات الترحيل بأفضل جهد: ترحيل حالة Matrix القديمة وإعداد
الحالة المشفرة القديمة. وكلتا الخطوتين غير قاتلتين؛ إذ تُسجَّل الأخطاء ويستمر
بدء التشغيل. أما في وضع القراءة فقط (`openclaw doctor` من دون `--fix`) فيتم
تخطي هذا الفحص بالكامل.

### 8c) اقتران الأجهزة وانجراف المصادقة

يفحص Doctor الآن حالة اقتران الأجهزة كجزء من تمريرة السلامة العادية.

ما الذي يبلّغ عنه:

- طلبات الاقتران الأولى المعلقة
- ترقيات الدور المعلقة للأجهزة المقترنة بالفعل
- ترقيات النطاقات المعلقة للأجهزة المقترنة بالفعل
- إصلاحات عدم تطابق المفتاح العام عندما يظل معرّف الجهاز مطابقًا لكن
  هوية الجهاز لم تعد تطابق السجل الموافق عليه
- سجلات مقترنة تفتقد رمزًا مميزًا نشطًا لدور معتمد
- رموز مقترنة تنجرف نطاقاتها خارج خط الأساس المعتمد للاقتران
- إدخالات محلية مخزنة مؤقتًا لرمز جهاز الجهاز الحالي تسبق تدوير رمز
  من جانب gateway أو تحمل بيانات وصفية قديمة للنطاقات

لا يوافق Doctor تلقائيًا على طلبات الاقتران ولا يدوّر رموز الأجهزة تلقائيًا. بل
يطبع الخطوات التالية الدقيقة بدلًا من ذلك:

- افحص الطلبات المعلقة باستخدام `openclaw devices list`
- وافق على الطلب المحدد باستخدام `openclaw devices approve <requestId>`
- دوّر رمزًا جديدًا باستخدام `openclaw devices rotate --device <deviceId> --role <role>`
- أزل سجلًا قديمًا وأعد الموافقة عليه باستخدام `openclaw devices remove <deviceId>`

وهذا يغلق الثغرة الشائعة “الجهاز مقترن بالفعل لكنه ما يزال يطلب اقترانًا”:
فالآن يميّز Doctor بين الاقتران الأولي، وبين ترقيات الدور/النطاقات
المعلقة، وبين انجراف الرمز/هوية الجهاز القديمة.

### 9) التحذيرات الأمنية

يصدر Doctor تحذيرات عندما يكون مزوّد ما مفتوحًا للرسائل المباشرة من دون قائمة سماح، أو
عندما تكون السياسة مضبوطة بطريقة خطرة.

### 10) systemd linger ‏(Linux)

إذا كان يعمل كخدمة مستخدم systemd، فإن Doctor يضمن تفعيل lingering بحيث يظل
gateway حيًا بعد تسجيل الخروج.

### 11) حالة مساحة العمل (Skills وPlugins والأدلة القديمة)

يطبع Doctor ملخصًا لحالة مساحة العمل للوكيل الافتراضي:

- **حالة Skills**: يحسب Skills المؤهلة، والمفتقدة للمتطلبات، والمحجوبة بقائمة السماح.
- **أدلة مساحة العمل القديمة**: يحذر عند وجود `~/openclaw` أو أدلة مساحة عمل قديمة أخرى
  إلى جانب مساحة العمل الحالية.
- **حالة Plugin**: يحسب Plugins المحمّلة/المعطلة/التي بها أخطاء؛ ويسرد معرّفات Plugins لأي
  أخطاء؛ ويبلغ عن إمكانات حزم Plugin.
- **تحذيرات توافق Plugin**: يضع علامة على Plugins التي لديها مشكلات توافق مع
  وقت التشغيل الحالي.
- **تشخيصات Plugin**: يعرض أي تحذيرات أو أخطاء وقت التحميل صادرة عن
  سجل Plugins.

### 11b) حجم ملف bootstrap

يفحص Doctor ما إذا كانت ملفات bootstrap في مساحة العمل (على سبيل المثال `AGENTS.md`,
و`CLAUDE.md`، أو ملفات سياق أخرى محقونة) قريبة من ميزانية
الأحرف المضبوطة أو تجاوزتها. ويبلغ عن عدد الأحرف الخام مقابل المحقون لكل ملف، ونسبة
الاقتطاع، وسبب الاقتطاع (`max/file` أو `max/total`)، وإجمالي الأحرف
المحقونة كنسبة من إجمالي الميزانية. وعندما تكون الملفات مقتطعة أو قريبة من
الحد، فإن Doctor يطبع نصائح لضبط `agents.defaults.bootstrapMaxChars`
و`agents.defaults.bootstrapTotalMaxChars`.

### 11c) إكمال shell

يفحص Doctor ما إذا كان إكمال Tab مثبتًا للـ shell الحالي
(zsh أو bash أو fish أو PowerShell):

- إذا كان ملف shell الشخصي يستخدم نمط إكمال ديناميكي بطيئًا
  (`source <(openclaw completion ...)`)، فإن Doctor يرقّيه إلى
  النسخة الأسرع المعتمدة على الملف المخزن مؤقتًا.
- إذا كان الإكمال مضبوطًا في الملف الشخصي لكن ملف التخزين المؤقت مفقودًا،
  فإن Doctor يعيد توليد التخزين المؤقت تلقائيًا.
- إذا لم يكن هناك أي إكمال مضبوط على الإطلاق، فإن Doctor يطلب تثبيته
  (في الوضع التفاعلي فقط؛ ويتم التخطي مع `--non-interactive`).

شغّل `openclaw completion --write-state` لإعادة توليد التخزين المؤقت يدويًا.

### 12) فحوصات مصادقة Gateway (الرمز المحلي)

يفحص Doctor جاهزية مصادقة رمز Gateway المحلي.

- إذا كان وضع الرمز يحتاج إلى رمز ولا يوجد أي مصدر رمز، فإن Doctor يعرض إنشاء واحد.
- إذا كانت `gateway.auth.token` مُدارة عبر SecretRef لكنها غير متاحة، فإن Doctor يحذر ولا يكتب فوقها بنص عادي.
- يفرض `openclaw doctor --generate-gateway-token` الإنشاء فقط عندما لا يكون هناك SecretRef خاص برمز مضبوط.

### 12b) إصلاحات واعية بـ SecretRef في وضع القراءة فقط

تحتاج بعض تدفقات الإصلاح إلى فحص بيانات الاعتماد المضبوطة من دون إضعاف سلوك الفشل السريع وقت التشغيل.

- يستخدم `openclaw doctor --fix` الآن نموذج الملخص نفسه الواعي بـ SecretRef والمخصص للقراءة فقط كما في أوامر عائلة status من أجل إصلاحات إعدادات مستهدفة.
- مثال: يحاول إصلاح `allowFrom` / `groupAllowFrom` من نوع `@username` في Telegram استخدام بيانات اعتماد البوت المضبوطة عند توفرها.
- إذا كان رمز بوت Telegram مضبوطًا عبر SecretRef لكنه غير متاح في مسار الأمر الحالي، فإن Doctor يبلغ بأن بيانات الاعتماد مضبوطة ولكنها غير متاحة ويتخطى التحليل التلقائي بدلًا من التعطل أو الإبلاغ خطأً عن الرمز على أنه مفقود.

### 13) فحص سلامة Gateway + إعادة التشغيل

يشغّل Doctor فحص سلامة ويعرض إعادة تشغيل Gateway عندما يبدو
غير سليم.

### 13b) جاهزية البحث في الذاكرة

يفحص Doctor ما إذا كان مزوّد embeddings المضبوط للبحث في الذاكرة جاهزًا
للوكيل الافتراضي. ويعتمد السلوك على الواجهة الخلفية والمزوّد المضبوطين:

- **الواجهة الخلفية QMD**: يفحص ما إذا كان الملف التنفيذي `qmd` متاحًا وقابلًا للتشغيل.
  وإذا لم يكن كذلك، يطبع إرشادات إصلاح بما في ذلك حزمة npm وخيار مسار يدوي للملف التنفيذي.
- **مزوّد محلي صريح**: يتحقق من وجود ملف نموذج محلي أو عنوان URL معروف
  لنموذج بعيد/قابل للتنزيل. وإذا كان مفقودًا، يقترح التبديل إلى مزوّد بعيد.
- **مزوّد بعيد صريح** (`openai`, `voyage`, إلخ): يتحقق من وجود مفتاح API
  في البيئة أو مخزن المصادقة. ويطبع تلميحات إصلاح قابلة للتنفيذ إذا كان مفقودًا.
- **مزوّد تلقائي**: يفحص توفر النموذج المحلي أولًا، ثم يجرب كل مزوّد بعيد
  حسب ترتيب الاختيار التلقائي.

عندما تتوفر نتيجة فحص من Gateway (كان Gateway سليمًا وقت
الفحص)، يقارن Doctor نتيجته مع الإعدادات المرئية من CLI ويشير
إلى أي اختلاف.

استخدم `openclaw memory status --deep` للتحقق من جاهزية embeddings وقت التشغيل.

### 14) تحذيرات حالة القنوات

إذا كان Gateway سليمًا، فإن Doctor يشغّل فحص حالة للقنوات ويبلغ عن
التحذيرات مع الإصلاحات المقترحة.

### 15) تدقيق إعداد supervisor + الإصلاح

يفحص Doctor إعداد supervisor المثبت (`launchd/systemd/schtasks`) بحثًا عن
قيم افتراضية مفقودة أو قديمة (مثل تبعيات systemd الخاصة بـ network-online و
تأخير إعادة التشغيل). وعندما يعثر على عدم تطابق، فإنه يوصي بتحديث ويمكنه
إعادة كتابة ملف الخدمة/المهمة إلى القيم الافتراضية الحالية.

ملاحظات:

- يطلب `openclaw doctor` تأكيدًا قبل إعادة كتابة إعداد supervisor.
- يقبل `openclaw doctor --yes` مطالبات الإصلاح الافتراضية.
- يطبق `openclaw doctor --repair` الإصلاحات الموصى بها من دون مطالبات.
- يكتب `openclaw doctor --repair --force` فوق إعدادات supervisor المخصصة.
- إذا كانت مصادقة الرمز تتطلب رمزًا وكان `gateway.auth.token` مُدارًا عبر SecretRef، فإن تثبيت/إصلاح خدمة doctor يتحقق من SecretRef لكنه لا يحفظ قيم الرموز النصية العادية المحللة في بيانات بيئة خدمة supervisor الوصفية.
- إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef الخاص بالرمز المضبوط غير محلل، فإن Doctor يحظر مسار التثبيت/الإصلاح مع إرشادات قابلة للتنفيذ.
- إذا كانت كل من `gateway.auth.token` و`gateway.auth.password` مضبوطتين وكانت `gateway.auth.mode` غير مضبوطة، فإن Doctor يحظر التثبيت/الإصلاح حتى يتم ضبط الوضع صراحةً.
- بالنسبة إلى وحدات user-systemd على Linux، تتضمن فحوصات انجراف الرمز في Doctor الآن كلا المصدرين `Environment=` و`EnvironmentFile=` عند مقارنة بيانات مصادقة الخدمة الوصفية.
- يمكنك دائمًا فرض إعادة كتابة كاملة عبر `openclaw gateway install --force`.

### 16) تشخيصات وقت تشغيل Gateway + المنفذ

يفحص Doctor وقت تشغيل الخدمة (PID، وآخر حالة خروج) ويحذر عندما تكون
الخدمة مثبتة لكنها غير مشغلة فعليًا. كما يفحص أيضًا تعارضات المنافذ
على منفذ gateway (الافتراضي `18789`) ويبلغ عن الأسباب المرجحة (Gateway يعمل بالفعل،
أو نفق SSH).

### 17) أفضل ممارسات وقت تشغيل Gateway

يحذر Doctor عندما تعمل خدمة gateway على Bun أو على مسار Node مُدار عبر مدير إصدارات
(`nvm`, `fnm`, `volta`, `asdf`, إلخ). تتطلب قنوات WhatsApp + Telegram وجود Node،
وقد تنكسر مسارات مدير الإصدارات بعد الترقيات لأن الخدمة لا
تحمّل تهيئة shell الخاصة بك. ويعرض Doctor الترحيل إلى تثبيت Node نظامي عند
توفره (Homebrew/apt/choco).

### 18) كتابة الإعدادات + البيانات الوصفية للمعالج

يحفظ Doctor أي تغييرات على الإعدادات ويضع ختم البيانات الوصفية للمعالج لتسجيل
تشغيل doctor.

### 19) نصائح مساحة العمل (النسخ الاحتياطي + نظام الذاكرة)

يقترح Doctor نظام ذاكرة لمساحة العمل عندما يكون مفقودًا ويطبع نصيحة للنسخ الاحتياطي
إذا لم تكن مساحة العمل تحت git بالفعل.

راجع [/concepts/agent-workspace](/ar/concepts/agent-workspace) للحصول على دليل كامل حول
بنية مساحة العمل والنسخ الاحتياطي عبر git (الموصى به: GitHub أو GitLab خاص).

## ذو صلة

- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
- [دليل تشغيل Gateway](/ar/gateway)
