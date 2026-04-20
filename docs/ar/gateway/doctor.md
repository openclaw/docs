---
read_when:
    - إضافة أو تعديل ترحيلات doctor
    - إدخال تغييرات جذرية على التهيئة
summary: 'أمر Doctor: فحوصات السلامة، وترحيلات التهيئة، وخطوات الإصلاح'
title: Doctor
x-i18n:
    generated_at: "2026-04-20T07:29:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61a5e01a306058c49be6095f7c8082d779a55d63cf3b5f4c4096173943faf51b
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

‏`openclaw doctor` هي أداة الإصلاح + الترحيل في OpenClaw. تقوم بإصلاح
التهيئة/الحالة القديمة، وتتحقق من السلامة، وتوفّر خطوات إصلاح عملية.

## البدء السريع

```bash
openclaw doctor
```

### بدون واجهة / للأتمتة

```bash
openclaw doctor --yes
```

اقبل القيم الافتراضية بدون مطالبة (بما في ذلك خطوات إصلاح إعادة التشغيل/الخدمة/العزل عند الاقتضاء).

```bash
openclaw doctor --repair
```

طبّق الإصلاحات الموصى بها بدون مطالبة (الإصلاحات + إعادة التشغيل حيث يكون ذلك آمنًا).

```bash
openclaw doctor --repair --force
```

طبّق أيضًا الإصلاحات القوية (يستبدل تهيئات المشرف المخصصة).

```bash
openclaw doctor --non-interactive
```

شغّل بدون مطالبات وطبّق فقط الترحيلات الآمنة (تطبيع التهيئة + نقل الحالة على القرص). يتخطى إجراءات إعادة التشغيل/الخدمة/العزل التي تتطلب تأكيدًا بشريًا.
تُشغَّل ترحيلات الحالة القديمة تلقائيًا عند اكتشافها.

```bash
openclaw doctor --deep
```

افحص خدمات النظام بحثًا عن تثبيتات Gateway إضافية (launchd/systemd/schtasks).

إذا أردت مراجعة التغييرات قبل الكتابة، افتح ملف التهيئة أولًا:

```bash
cat ~/.openclaw/openclaw.json
```

## ما الذي يفعله (ملخص)

- تحديث اختياري قبل التشغيل لتثبيتات git (في الوضع التفاعلي فقط).
- فحص حداثة بروتوكول واجهة المستخدم (يعيد بناء Control UI عندما يكون مخطط البروتوكول أحدث).
- فحص السلامة + مطالبة بإعادة التشغيل.
- ملخص حالة Skills (مؤهلة/مفقودة/محجوبة) وحالة Plugin.
- تطبيع التهيئة للقيم القديمة.
- ترحيل تهيئة Talk من حقول `talk.*` المسطحة القديمة إلى `talk.provider` + `talk.providers.<provider>`.
- فحوصات ترحيل المتصفح لتهيئات Chrome extension القديمة وجاهزية Chrome MCP.
- تحذيرات تجاوز OpenCode provider (`models.providers.opencode` / `models.providers.opencode-go`).
- تحذيرات حجب Codex OAuth (`models.providers.openai-codex`).
- فحص متطلبات OAuth TLS لملفات تعريف OpenAI Codex OAuth.
- ترحيل الحالة القديمة على القرص (الجلسات/دليل العامل/مصادقة WhatsApp).
- ترحيل مفتاح عقد Plugin manifest القديم (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- ترحيل مخزن Cron القديم (`jobId`, `schedule.cron`, وحقول delivery/payload العلوية، و`provider` داخل payload، ووظائف Webhook الاحتياطية البسيطة `notify: true`).
- فحص ملفات قفل الجلسة وتنظيف الأقفال القديمة.
- فحوصات سلامة الحالة والصلاحيات (الجلسات، والنصوص المفرغة، ودليل الحالة).
- فحوصات صلاحيات ملف التهيئة (`chmod 600`) عند التشغيل محليًا.
- سلامة مصادقة النموذج: يتحقق من انتهاء OAuth، ويمكنه تحديث الرموز المميزة التي توشك على الانتهاء، ويعرض حالات التهدئة/التعطيل لملفات تعريف المصادقة.
- اكتشاف دليل workspace إضافي (`~/openclaw`).
- إصلاح صورة العزل عندما يكون sandboxing مفعّلًا.
- ترحيل الخدمة القديمة واكتشاف Gateways إضافية.
- ترحيل حالة Matrix channel القديمة (في وضع `--fix` / `--repair`).
- فحوصات وقت تشغيل Gateway (الخدمة مثبتة لكنها لا تعمل؛ تسمية launchd مخزنة مؤقتًا).
- تحذيرات حالة القنوات (يتم فحصها من Gateway العامل).
- تدقيق تهيئة المشرف (launchd/systemd/schtasks) مع إصلاح اختياري.
- فحوصات أفضل ممارسات وقت تشغيل Gateway (Node مقابل Bun، ومسارات مدير الإصدارات).
- تشخيصات تعارض منفذ Gateway (الافتراضي `18789`).
- تحذيرات أمنية لسياسات الرسائل المباشرة المفتوحة.
- فحوصات مصادقة Gateway لوضع الرمز المحلي (يعرض إنشاء رمز عند عدم وجود مصدر رمز؛ ولا يستبدل تهيئات token SecretRef).
- اكتشاف مشاكل إقران الأجهزة (طلبات الإقران الأولى المعلقة، وترقيات الدور/النطاق المعلقة، وانحراف cache رموز الأجهزة المحلية القديمة، وانحراف المصادقة في السجلات المقترنة).
- فحص `systemd linger` على Linux.
- فحص حجم ملف bootstrap الخاص بـ workspace (تحذيرات القطع/الاقتراب من الحد الأقصى لملفات السياق).
- فحص حالة shell completion والتثبيت/الترقية التلقائية.
- فحص جاهزية موفّر embedding للبحث في الذاكرة (نموذج محلي، أو مفتاح API بعيد، أو ثنائي QMD).
- فحوصات تثبيت المصدر (عدم تطابق pnpm workspace، وأصول UI المفقودة، وملف tsx الثنائي المفقود).
- يكتب التهيئة المحدّثة + بيانات wizard الوصفية.

## الإكمال والتصفير في واجهة Dreams UI

يتضمن مشهد Dreams في Control UI إجراءات **Backfill** و**Reset** و**Clear Grounded**
لسير عمل grounded dreaming. تستخدم هذه الإجراءات أساليب RPC بأسلوب doctor في
Gateway، لكنها **ليست** جزءًا من إصلاح/ترحيل CLI الخاص بـ `openclaw doctor`.

ما الذي تفعله:

- يقوم **Backfill** بفحص ملفات `memory/YYYY-MM-DD.md` التاريخية في
  workspace النشط، ويشغّل تمرير grounded REM diary، ويكتب إدخالات backfill
  قابلة للعكس داخل `DREAMS.md`.
- يقوم **Reset** بإزالة إدخالات diary ذات backfill المعلّمة فقط من `DREAMS.md`.
- يقوم **Clear Grounded** بإزالة الإدخالات المرحلية grounded-only قصيرة الأمد فقط
  التي جاءت من إعادة تشغيل تاريخية ولم تراكم بعد استدعاءً حيًا أو دعمًا يوميًا.

ما الذي **لا** تفعله بمفردها:

- لا تعدّل `MEMORY.md`
- لا تشغّل ترحيلات doctor الكاملة
- لا ترحّل المرشحين grounded تلقائيًا إلى مخزن الترقية الحي قصير الأمد
  إلا إذا شغّلت مسار CLI المرحلي أولًا صراحةً

إذا كنت تريد أن تؤثر إعادة التشغيل التاريخية grounded في مسار الترقية العميق
الاعتيادي، فاستخدم تدفق CLI بدلًا من ذلك:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

يؤدي ذلك إلى ترحيل المرشحين الدائمين grounded إلى مخزن dreaming قصير الأمد مع
الإبقاء على `DREAMS.md` كسطح مراجعة.

## السلوك المفصل والمبررات

### 0) تحديث اختياري (تثبيتات git)

إذا كان هذا checkout من git وكان doctor يعمل تفاعليًا، فسيعرض
التحديث (fetch/rebase/build) قبل تشغيل doctor.

### 1) تطبيع التهيئة

إذا كانت التهيئة تحتوي على أشكال قيم قديمة (على سبيل المثال `messages.ackReaction`
من دون تجاوز خاص بقناة)، فإن doctor يطبعها إلى
المخطط الحالي.

يشمل ذلك حقول Talk المسطحة القديمة. تهيئة Talk العامة الحالية هي
`talk.provider` + `talk.providers.<provider>`. يعيد doctor كتابة أشكال
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` القديمة إلى خريطة provider.

### 2) ترحيلات مفاتيح التهيئة القديمة

عندما تحتوي التهيئة على مفاتيح مهملة، ترفض الأوامر الأخرى التشغيل وتطلب
منك تشغيل `openclaw doctor`.

سيقوم doctor بما يلي:

- شرح المفاتيح القديمة التي عُثر عليها.
- عرض الترحيل الذي طبّقه.
- إعادة كتابة `~/.openclaw/openclaw.json` بالمخطط المحدّث.

يشغّل Gateway أيضًا ترحيلات doctor تلقائيًا عند بدء التشغيل عندما يكتشف
تنسيق تهيئة قديمًا، بحيث تُصلَح التهيئات القديمة دون تدخل يدوي.
تُعالَج ترحيلات مخزن وظائف Cron بواسطة `openclaw doctor --fix`.

الترحيلات الحالية:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` من المستوى الأعلى
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` القديمة → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- بالنسبة إلى القنوات التي تحتوي على `accounts` مسماة مع بقاء قيم قناة أحادية الحساب على المستوى الأعلى، انقل هذه القيم ذات النطاق الحسابي إلى الحساب المُرقّى المختار لتلك القناة (`accounts.default` لمعظم القنوات؛ ويمكن لـ Matrix الاحتفاظ بهدف مسمى/افتراضي مطابق موجود)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- إزالة `browser.relayBindHost` (إعداد relay قديم للإضافة)

تتضمن تحذيرات doctor أيضًا إرشادات حول الحساب الافتراضي للقنوات متعددة الحسابات:

- إذا تم ضبط إدخالين أو أكثر في `channels.<channel>.accounts` من دون `channels.<channel>.defaultAccount` أو `accounts.default`، فسيحذر doctor من أن توجيه الرجوع يمكن أن يختار حسابًا غير متوقع.
- إذا تم ضبط `channels.<channel>.defaultAccount` على معرّف حساب غير معروف، فسيحذر doctor ويعرض معرّفات الحسابات المضبوطة.

### 2b) تجاوزات OpenCode provider

إذا أضفت `models.providers.opencode` أو `opencode-zen` أو `opencode-go`
يدويًا، فهذا يتجاوز كتالوج OpenCode المدمج من `@mariozechner/pi-ai`.
قد يؤدي ذلك إلى فرض النماذج على API خاطئ أو تصفير التكاليف. يحذر doctor كي
تتمكن من إزالة هذا التجاوز واستعادة توجيه API والتكاليف لكل نموذج.

### 2c) ترحيل المتصفح وجاهزية Chrome MCP

إذا كانت تهيئة المتصفح ما تزال تشير إلى مسار Chrome extension الذي أُزيل، فسيقوم doctor
بتطبيعها إلى نموذج الإرفاق المحلي بالمضيف الحالي لـ Chrome MCP:

- `browser.profiles.*.driver: "extension"` تصبح `"existing-session"`
- تتم إزالة `browser.relayBindHost`

كما يدقق doctor مسار Chrome MCP المحلي على المضيف عندما تستخدم `defaultProfile:
"user"` أو ملف `existing-session` مضبوط:

- يتحقق مما إذا كان Google Chrome مثبتًا على المضيف نفسه لملفات
  التعريف ذات الاتصال التلقائي الافتراضي
- يتحقق من إصدار Chrome المكتشف ويحذر عندما يكون أقل من Chrome 144
- يذكّرك بتمكين التصحيح عن بُعد في صفحة فحص المتصفح (مثل
  `chrome://inspect/#remote-debugging` أو `brave://inspect/#remote-debugging`
  أو `edge://inspect/#remote-debugging`)

لا يمكن لـ doctor تمكين إعداد Chrome هذا نيابةً عنك. لا يزال Chrome MCP المحلي
يتطلب ما يلي:

- متصفحًا مبنيًا على Chromium بإصدار 144+ على مضيف gateway/node
- تشغيل المتصفح محليًا
- تمكين التصحيح عن بُعد في ذلك المتصفح
- الموافقة على أول مطالبة موافقة على الإرفاق في المتصفح

الجاهزية هنا تتعلق فقط بمتطلبات الإرفاق المحلي. يحتفظ existing-session
بحدود مسارات Chrome MCP الحالية؛ وما تزال المسارات المتقدمة مثل `responsebody` وتصدير PDF
واعتراض التنزيل وإجراءات الدُفعات تتطلب متصفحًا مُدارًا
أو ملف CDP خامًا.

لا ينطبق هذا الفحص على تدفقات Docker أو sandbox أو remote-browser أو غيرها من
التدفقات عديمة الواجهة. فهذه تستمر في استخدام CDP الخام.

### 2d) متطلبات OAuth TLS

عند ضبط ملف تعريف OpenAI Codex OAuth، يجري doctor فحصًا لنقطة
تفويض OpenAI للتحقق من أن مكدس TLS المحلي الخاص بـ Node/OpenSSL يمكنه
التحقق من سلسلة الشهادات. إذا فشل الفحص بسبب خطأ شهادة (على سبيل المثال
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY` أو شهادة منتهية الصلاحية أو شهادة موقعة ذاتيًا)،
فسيطبع doctor إرشادات إصلاح خاصة بالمنصة. على macOS مع Homebrew Node، يكون
الإصلاح عادةً `brew postinstall ca-certificates`. ومع `--deep`، يُشغَّل الفحص
حتى إذا كان Gateway سليمًا.

### 2c) تجاوزات Codex OAuth provider

إذا كنت قد أضفت سابقًا إعدادات نقل OpenAI القديمة تحت
`models.providers.openai-codex`، فقد تحجب مسار Codex OAuth provider
المدمج الذي تستخدمه الإصدارات الأحدث تلقائيًا. يحذر doctor عندما يرى
إعدادات النقل القديمة تلك إلى جانب Codex OAuth حتى تتمكن من إزالة أو إعادة كتابة
تجاوز النقل القديم واستعادة سلوك التوجيه/الرجوع المدمج.
لا تزال الوكلاء المخصصة والتجاوزات المعتمدة على الترويسات فقط مدعومة ولا
تؤدي إلى هذا التحذير.

### 3) ترحيلات الحالة القديمة (تخطيط القرص)

يمكن لـ doctor ترحيل التخطيطات الأقدم على القرص إلى البنية الحالية:

- مخزن الجلسات + النصوص المفرغة:
  - من `~/.openclaw/sessions/` إلى `~/.openclaw/agents/<agentId>/sessions/`
- دليل العامل:
  - من `~/.openclaw/agent/` إلى `~/.openclaw/agents/<agentId>/agent/`
- حالة مصادقة WhatsApp ‏(Baileys):
  - من `~/.openclaw/credentials/*.json` القديمة (باستثناء `oauth.json`)
  - إلى `~/.openclaw/credentials/whatsapp/<accountId>/...` (معرّف الحساب الافتراضي: `default`)

هذه الترحيلات تُنفّذ بأفضل جهد وهي قابلة للتكرار بأمان؛ وسيصدر doctor تحذيرات عندما
يترك أي مجلدات قديمة خلفه كنسخ احتياطية. كما يقوم Gateway/CLI أيضًا بترحيل
الجلسات القديمة + دليل العامل تلقائيًا عند بدء التشغيل بحيث تستقر السجلات/المصادقة/النماذج في
المسار الخاص بكل عامل من دون الحاجة إلى تشغيل doctor يدويًا. أما مصادقة WhatsApp
فمقصود أن تُرحّل فقط عبر `openclaw doctor`. كما أن تطبيع Talk provider/provider-map
يقارن الآن بالمساواة البنيوية، لذلك لم تعد الفروقات في ترتيب المفاتيح وحدها
تؤدي إلى تغييرات متكررة عديمة الأثر في `doctor --fix`.

### 3a) ترحيلات plugin manifest القديمة

يفحص doctor جميع plugin manifests المثبتة بحثًا عن مفاتيح الإمكانات
العليا المهملة (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). وعند العثور عليها، يعرض نقلها إلى كائن `contracts`
وإعادة كتابة ملف manifest في مكانه. هذا الترحيل قابل للتكرار بأمان؛
وإذا كان مفتاح `contracts` يحتوي بالفعل على القيم نفسها، فسيُزال المفتاح القديم
من دون تكرار البيانات.

### 3b) ترحيلات مخزن Cron القديمة

يفحص doctor أيضًا مخزن وظائف Cron (`~/.openclaw/cron/jobs.json` افتراضيًا،
أو `cron.store` عند تجاوزه) بحثًا عن أشكال الوظائف القديمة التي لا يزال
المجدول يقبلها للتوافق.

تشمل عمليات تنظيف Cron الحالية ما يلي:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- حقول payload ذات المستوى الأعلى (`message`, `model`, `thinking`, ...) → `payload`
- حقول delivery ذات المستوى الأعلى (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- أسماء provider المستعارة الخاصة بتسليم payload → `delivery.channel` صريح
- وظائف Webhook الاحتياطية القديمة البسيطة `notify: true` → `delivery.mode="webhook"` صريح مع `delivery.to=cron.webhook`

لا يرحّل doctor وظائف `notify: true` تلقائيًا إلا عندما يمكنه فعل ذلك من دون
تغيير السلوك. إذا كانت الوظيفة تجمع بين الرجوع الاحتياطي القديم للإشعار ووضع
تسليم غير Webhook موجود بالفعل، فسيحذر doctor ويترك تلك الوظيفة للمراجعة اليدوية.

### 3c) تنظيف أقفال الجلسات

يفحص doctor كل دليل جلسات للعوامل بحثًا عن ملفات قفل كتابة قديمة — وهي ملفات تُترك
عندما تخرج الجلسة بشكل غير طبيعي. ولكل ملف قفل يعثر عليه فإنه يعرض:
المسار، وPID، وما إذا كان PID لا يزال حيًا، وعمر القفل، وما إذا كان
يُعد قديمًا (PID ميت أو أقدم من 30 دقيقة). وفي وضع `--fix` / `--repair`
يزيل ملفات القفل القديمة تلقائيًا؛ وإلا فإنه يطبع ملاحظة
ويطلب منك إعادة التشغيل مع `--fix`.

### 4) فحوصات سلامة الحالة (استمرارية الجلسة، والتوجيه، والسلامة)

دليل الحالة هو جذع الدماغ التشغيلي. إذا اختفى، ستفقد
الجلسات، وبيانات الاعتماد، والسجلات، والتهيئة (ما لم تكن لديك نسخ احتياطية في مكان آخر).

يتحقق doctor من:

- **غياب دليل الحالة**: يحذر من فقدان الحالة الكارثي، ويطالب بإعادة إنشاء
  الدليل، ويذكّرك بأنه لا يمكنه استعادة البيانات المفقودة.
- **صلاحيات دليل الحالة**: يتحقق من قابلية الكتابة؛ ويعرض إصلاح الصلاحيات
  (ويصدر تلميح `chown` عند اكتشاف عدم تطابق المالك/المجموعة).
- **دليل حالة macOS المتزامن سحابيًا**: يحذر عندما تشير الحالة إلى iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) أو
  `~/Library/CloudStorage/...` لأن المسارات المدعومة بالمزامنة قد تسبب إدخال/إخراج أبطأ
  وسباقات في القفل/المزامنة.
- **دليل حالة Linux على SD أو eMMC**: يحذر عندما تشير الحالة إلى مصدر
  تركيب `mmcblk*`، لأن الإدخال/الإخراج العشوائي المعتمد على SD أو eMMC قد يكون أبطأ
  ويؤدي إلى تآكل أسرع تحت كتابات الجلسات وبيانات الاعتماد.
- **غياب أدلة الجلسات**: إن `sessions/` ودليل مخزن الجلسات
  مطلوبان للاحتفاظ بالسجل وتجنب أعطال `ENOENT`.
- **عدم تطابق النصوص المفرغة**: يحذر عندما تحتوي إدخالات الجلسات الحديثة على
  ملفات نصوص مفرغة مفقودة.
- **الجلسة الرئيسية “JSONL بسطر واحد”**: يعلّم عندما يحتوي النص المفرغ الرئيسي على سطر واحد فقط
  (أي أن السجل لا يتراكم).
- **أدلة حالة متعددة**: يحذر عندما توجد عدة مجلدات `~/.openclaw` عبر
  الأدلة المنزلية أو عندما يشير `OPENCLAW_STATE_DIR` إلى مكان آخر (قد
  ينقسم السجل بين التثبيتات).
- **تذكير الوضع البعيد**: إذا كان `gateway.mode=remote`، يذكّرك doctor بتشغيله
  على المضيف البعيد (فالحالة توجد هناك).
- **صلاحيات ملف التهيئة**: يحذر إذا كان `~/.openclaw/openclaw.json`
  قابلًا للقراءة من المجموعة/العالم ويعرض تشديدها إلى `600`.

### 5) سلامة مصادقة النموذج (انتهاء OAuth)

يفحص doctor ملفات OAuth التعريفية في مخزن المصادقة، ويحذر عندما تكون الرموز المميزة
قيد الانتهاء/منتهية، ويمكنه تحديثها عندما يكون ذلك آمنًا. إذا كان ملف
تعريف Anthropic OAuth/token قديمًا، فإنه يقترح مفتاح Anthropic API أو
مسار رمز إعداد Anthropic.
تظهر مطالبات التحديث فقط عند التشغيل التفاعلي (TTY)؛ أما `--non-interactive`
فيتخطى محاولات التحديث.

عندما يفشل تحديث OAuth بشكل دائم (مثل `refresh_token_reused`،
أو `invalid_grant`، أو عندما يخبرك المزوّد بضرورة تسجيل الدخول مجددًا)،
فإن doctor يبلّغ بأن إعادة المصادقة مطلوبة ويطبع الأمر الدقيق
`openclaw models auth login --provider ...` الذي يجب تشغيله.

كما يعرض doctor أيضًا ملفات تعريف المصادقة غير القابلة للاستخدام مؤقتًا بسبب:

- فترات تهدئة قصيرة (حدود المعدل/المهلات/إخفاقات المصادقة)
- تعطيلات أطول (إخفاقات الفوترة/الرصيد)

### 6) التحقق من نموذج Hooks

إذا كان `hooks.gmail.model` مضبوطًا، فإن doctor يتحقق من مرجع النموذج مقابل
الكتالوج وقائمة السماح ويحذر عندما لا يمكن حله أو يكون غير مسموح به.

### 7) إصلاح صورة Sandbox

عندما يكون sandboxing مفعّلًا، يتحقق doctor من صور Docker ويعرض بناءها أو
التبديل إلى الأسماء القديمة إذا كانت الصورة الحالية مفقودة.

### 7b) تبعيات وقت تشغيل Plugin المجمّعة

يتحقق doctor من أن تبعيات وقت تشغيل Plugin المجمّعة (على سبيل المثال
حزم وقت تشغيل Discord plugin) موجودة في جذر تثبيت OpenClaw.
إذا كانت أي منها مفقودة، فسيعرض doctor الحزم ويثبتها في
وضع `openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) ترحيلات خدمة Gateway وتلميحات التنظيف

يكتشف doctor خدمات Gateway القديمة (launchd/systemd/schtasks) و
يعرض إزالتها وتثبيت خدمة OpenClaw باستخدام منفذ Gateway الحالي.
كما يمكنه أيضًا البحث عن خدمات إضافية شبيهة بـ Gateway وطباعة تلميحات للتنظيف.
وتُعد خدمات OpenClaw Gateway المسماة حسب الملف التعريفي من الدرجة الأولى ولا
تُعلَّم على أنها "إضافية".

### 8b) ترحيل Matrix عند بدء التشغيل

عندما يكون لدى حساب Matrix channel ترحيل حالة قديم معلّق أو قابل للتنفيذ،
فإن doctor (في وضع `--fix` / `--repair`) ينشئ لقطة قبل الترحيل ثم
يشغّل خطوات الترحيل بأفضل جهد: ترحيل حالة Matrix القديمة وتجهيز
الحالة المشفرة القديمة. كلتا الخطوتين غير قاتلتين؛ تُسجّل الأخطاء ويستمر
بدء التشغيل. أما في وضع القراءة فقط (`openclaw doctor` بدون `--fix`) فيُتخطى هذا الفحص
بالكامل.

### 8c) إقران الجهاز وانحراف المصادقة

يفحص doctor الآن حالة إقران الجهاز كجزء من تمرير السلامة المعتاد.

ما الذي يعرضه:

- طلبات الإقران الأولى المعلقة
- ترقيات الدور المعلقة للأجهزة المقترنة بالفعل
- ترقيات النطاق المعلقة للأجهزة المقترنة بالفعل
- إصلاحات عدم تطابق المفتاح العام عندما يبقى معرّف الجهاز مطابقًا لكن
  هوية الجهاز لم تعد تطابق السجل المعتمد
- السجلات المقترنة التي تفتقد رمزًا نشطًا لدور معتمد
- الرموز المقترنة التي تنحرف نطاقاتها خارج خط الأساس المعتمد للإقران
- إدخالات cache الرموز المحلية للجهاز الحالي التي تسبق
  تدوير الرمز على جانب Gateway أو تحمل بيانات نطاق وصفية قديمة

لا يوافق doctor تلقائيًا على طلبات الإقران ولا يدوّر رموز الأجهزة تلقائيًا. بل
يطبع الخطوات التالية الدقيقة بدلًا من ذلك:

- فحص الطلبات المعلقة باستخدام `openclaw devices list`
- اعتماد الطلب المحدد باستخدام `openclaw devices approve <requestId>`
- تدوير رمز جديد باستخدام `openclaw devices rotate --device <deviceId> --role <role>`
- إزالة سجل قديم واعتماده من جديد باستخدام `openclaw devices remove <deviceId>`

هذا يغلق الثغرة الشائعة "مقترن بالفعل لكنه ما يزال يطلب الإقران":
فالآن يميّز doctor بين الإقران لأول مرة وبين ترقيات الدور/النطاق
المعلقة وبين انحراف الرمز/هوية الجهاز القديم.

### 9) التحذيرات الأمنية

يصدر doctor تحذيرات عندما يكون provider مفتوحًا للرسائل المباشرة من دون
قائمة سماح، أو عندما تُضبط سياسة بطريقة خطرة.

### 10) ‏systemd linger ‏(Linux)

إذا كان التشغيل كخدمة مستخدم systemd، فإن doctor يضمن تفعيل lingering لكي
يبقى Gateway قيد التشغيل بعد تسجيل الخروج.

### 11) حالة Workspace ‏(Skills وPlugins والأدلة القديمة)

يطبع doctor ملخصًا عن حالة workspace للعامل الافتراضي:

- **حالة Skills**: يحصي Skills المؤهلة، والتي تفتقد المتطلبات، والمحجوبة بقائمة السماح.
- **أدلة Workspace القديمة**: يحذر عند وجود `~/openclaw` أو أدلة workspace قديمة أخرى
  إلى جانب workspace الحالي.
- **حالة Plugin**: يحصي Plugins المحمّلة/المعطلة/التي بها أخطاء؛ ويسرد معرّفات Plugins لأي
  أخطاء؛ ويعرض قدرات bundle plugin.
- **تحذيرات توافق Plugin**: يعلّم Plugins التي لديها مشكلات توافق مع
  وقت التشغيل الحالي.
- **تشخيصات Plugin**: يعرض أي تحذيرات أو أخطاء وقت التحميل صادرة عن
  سجل Plugin.

### 11b) حجم ملف Bootstrap

يتحقق doctor مما إذا كانت ملفات bootstrap الخاصة بـ workspace (مثل `AGENTS.md`،
أو `CLAUDE.md`، أو ملفات السياق المحقونة الأخرى) قريبة من ميزانية
الأحرف المضبوطة أو تتجاوزها. ويعرض لكل ملف عدد الأحرف الخام مقابل المحقونة، ونسبة
الاقتطاع، وسبب الاقتطاع (`max/file` أو `max/total`)، وإجمالي الأحرف المحقونة
كنسبة من الميزانية الإجمالية. وعندما تكون الملفات مقتطعة أو قريبة من
الحد، يطبع doctor نصائح لضبط `agents.defaults.bootstrapMaxChars`
و`agents.defaults.bootstrapTotalMaxChars`.

### 11c) Shell completion

يتحقق doctor مما إذا كان إكمال tab مثبتًا للصدفة الحالية
(zsh أو bash أو fish أو PowerShell):

- إذا كان ملف تعريف الصدفة يستخدم نمط إكمال ديناميكي بطيء
  (`source <(openclaw completion ...)`)، فإن doctor يرقّيه إلى
  متغير الملف المخبأ الأسرع.
- إذا كان الإكمال مضبوطًا في ملف التعريف لكن ملف cache مفقودًا،
  فإن doctor يعيد إنشاء cache تلقائيًا.
- إذا لم يكن هناك أي إعداد للإكمال إطلاقًا، فإن doctor يعرض تثبيته
  (في الوضع التفاعلي فقط؛ ويُتخطى مع `--non-interactive`).

شغّل `openclaw completion --write-state` لإعادة إنشاء cache يدويًا.

### 12) فحوصات مصادقة Gateway ‏(الرمز المحلي)

يتحقق doctor من جاهزية مصادقة رمز Gateway المحلي.

- إذا كان وضع الرمز يحتاج إلى رمز ولا يوجد مصدر رمز، فإن doctor يعرض إنشاء واحد.
- إذا كانت `gateway.auth.token` مُدارة بواسطة SecretRef لكنها غير متاحة، فإن doctor يحذر ولا يستبدلها بنص عادي.
- يفرض `openclaw doctor --generate-gateway-token` الإنشاء فقط عندما لا يكون هناك SecretRef مضبوط للرمز.

### 12b) إصلاحات للقراءة فقط مع مراعاة SecretRef

تحتاج بعض تدفقات الإصلاح إلى فحص بيانات الاعتماد المضبوطة من دون إضعاف
سلوك الفشل السريع في وقت التشغيل.

- يستخدم `openclaw doctor --fix` الآن نموذج الملخص نفسه للقراءة فقط مع مراعاة SecretRef كما في أوامر عائلة status لإجراء إصلاحات تهيئة مستهدفة.
- مثال: يحاول إصلاح Telegram ‏`allowFrom` / `groupAllowFrom` الخاص بـ `@username` استخدام بيانات اعتماد البوت المضبوطة عند توفرها.
- إذا كان رمز Telegram bot مضبوطًا عبر SecretRef لكنه غير متاح في مسار الأمر الحالي، فإن doctor يبلّغ أن بيانات الاعتماد مضبوطة ولكن غير متاحة، ويتخطى الحل التلقائي بدلًا من التعطل أو الإبلاغ خطأً عن أن الرمز مفقود.

### 13) فحص سلامة Gateway + إعادة التشغيل

يشغّل doctor فحص سلامة ويعرض إعادة تشغيل Gateway عندما يبدو
غير سليم.

### 13b) جاهزية البحث في الذاكرة

يتحقق doctor مما إذا كان embedding provider المضبوط للبحث في الذاكرة جاهزًا
للعامل الافتراضي. ويعتمد السلوك على الواجهة الخلفية وprovider المضبوطين:

- **الواجهة الخلفية QMD**: يفحص ما إذا كان الملف الثنائي `qmd` متاحًا وقابلًا للتشغيل.
  وإذا لم يكن كذلك، فيطبع إرشادات إصلاح تشمل حزمة npm وخيار مسار ثنائي يدوي.
- **Local provider صريح**: يتحقق من وجود ملف نموذج محلي أو عنوان URL
  معروف لنموذج بعيد/قابل للتنزيل. وإذا كان مفقودًا، يقترح التبديل إلى provider بعيد.
- **Remote provider صريح** (`openai` أو `voyage` أو غيرهما): يتحقق من وجود مفتاح API
  في البيئة أو مخزن المصادقة. ويطبع تلميحات إصلاح عملية إذا كان مفقودًا.
- **Auto provider**: يتحقق أولًا من توفر النموذج المحلي، ثم يجرّب كل
  remote providers وفق ترتيب الاختيار التلقائي.

عندما تتوفر نتيجة فحص من Gateway (أي كان Gateway سليمًا وقت
الفحص)، يقارن doctor نتيجتها مع التهيئة المرئية لـ CLI ويشير
إلى أي اختلاف.

استخدم `openclaw memory status --deep` للتحقق من جاهزية embedding وقت التشغيل.

### 14) تحذيرات حالة القنوات

إذا كان Gateway سليمًا، يشغّل doctor فحص حالة القنوات ويعرض
التحذيرات مع الإصلاحات المقترحة.

### 15) تدقيق تهيئة المشرف + الإصلاح

يفحص doctor تهيئة المشرف المثبتة (`launchd/systemd/schtasks`) بحثًا عن
القيم الافتراضية المفقودة أو القديمة (مثل تبعيات systemd الخاصة بـ network-online و
تأخير إعادة التشغيل). وعندما يجد عدم تطابق، فإنه يوصي بالتحديث ويمكنه
إعادة كتابة ملف الخدمة/المهمة إلى القيم الافتراضية الحالية.

ملاحظات:

- يطلب `openclaw doctor` التأكيد قبل إعادة كتابة تهيئة المشرف.
- يقبل `openclaw doctor --yes` مطالبات الإصلاح الافتراضية.
- يطبّق `openclaw doctor --repair` الإصلاحات الموصى بها بدون مطالبات.
- يستبدل `openclaw doctor --repair --force` تهيئات المشرف المخصصة.
- إذا كانت مصادقة الرمز تتطلب رمزًا وكانت `gateway.auth.token` مُدارة بواسطة SecretRef، فإن تثبيت/إصلاح خدمة doctor يتحقق من SecretRef لكنه لا يحفظ قيم الرمز العادي المحلولة في بيانات بيئة خدمة المشرف الوصفية.
- إذا كانت مصادقة الرمز تتطلب رمزًا وكان token SecretRef المضبوط غير محلول، فإن doctor يمنع مسار التثبيت/الإصلاح مع إرشادات عملية.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مضبوطين وكان `gateway.auth.mode` غير مضبوط، فإن doctor يمنع التثبيت/الإصلاح حتى يُضبط الوضع صراحةً.
- بالنسبة إلى وحدات user-systemd على Linux، تتضمن فحوصات انحراف الرمز في doctor الآن كلاً من مصدري `Environment=` و`EnvironmentFile=` عند مقارنة بيانات مصادقة الخدمة الوصفية.
- يمكنك دائمًا فرض إعادة كتابة كاملة عبر `openclaw gateway install --force`.

### 16) تشخيصات وقت تشغيل Gateway + المنفذ

يفحص doctor وقت تشغيل الخدمة (PID، وآخر حالة خروج) ويحذر عندما تكون
الخدمة مثبتة لكنها لا تعمل فعليًا. كما يتحقق أيضًا من تعارضات المنفذ
على منفذ Gateway (الافتراضي `18789`) ويعرض الأسباب المحتملة (Gateway يعمل بالفعل،
أو نفق SSH).

### 17) أفضل ممارسات وقت تشغيل Gateway

يحذر doctor عندما تعمل خدمة Gateway على Bun أو على مسار Node مُدار بإدارة إصدارات
(`nvm` أو `fnm` أو `volta` أو `asdf` أو غيرها). تتطلب قنوات WhatsApp + Telegram ‏Node،
وقد تتعطل مسارات إدارة الإصدارات بعد الترقيات لأن الخدمة لا
تحمّل تهيئة الصدفة الخاصة بك. يعرض doctor الترحيل إلى تثبيت Node على مستوى النظام عندما
يكون متاحًا (Homebrew/apt/choco).

### 18) كتابة التهيئة + بيانات wizard الوصفية

يحفظ doctor أي تغييرات في التهيئة ويضع وسم بيانات wizard الوصفية لتسجيل
تشغيل doctor.

### 19) نصائح Workspace ‏(النسخ الاحتياطي + نظام الذاكرة)

يقترح doctor نظام ذاكرة لـ workspace عند غيابه ويطبع نصيحة حول النسخ الاحتياطي
إذا لم يكن workspace تحت git بالفعل.

راجع [/concepts/agent-workspace](/ar/concepts/agent-workspace) للحصول على دليل كامل حول
بنية workspace والنسخ الاحتياطي عبر git (يوصى باستخدام GitHub أو GitLab خاص).
