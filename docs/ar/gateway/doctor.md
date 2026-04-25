---
read_when:
    - إضافة ترحيلات Doctor أو تعديلها
    - إدخال تغييرات كاسرة في الإعدادات
summary: 'أمر Doctor: فحوصات السلامة، وترحيلات الإعدادات، وخطوات الإصلاح'
title: Doctor
x-i18n:
    generated_at: "2026-04-25T18:19:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13204a57facd19459fc812a8daa0fe629b6725bdabb014f59f871fa64c22e71d
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` هو أداة الإصلاح + الترحيل في OpenClaw. فهو يصلح
الإعدادات/الحالة القديمة، ويفحص السلامة، ويوفر خطوات إصلاح عملية.

## البدء السريع

```bash
openclaw doctor
```

### التشغيل دون واجهة / الأتمتة

```bash
openclaw doctor --yes
```

قبول القيم الافتراضية من دون مطالبة (بما في ذلك خطوات إعادة التشغيل/الخدمة/إصلاح sandbox عند الاقتضاء).

```bash
openclaw doctor --repair
```

تطبيق الإصلاحات الموصى بها من دون مطالبة (الإصلاحات + إعادة التشغيل حيث يكون ذلك آمنًا).

```bash
openclaw doctor --repair --force
```

تطبيق الإصلاحات القوية أيضًا (يكتب فوق إعدادات supervisor المخصصة).

```bash
openclaw doctor --non-interactive
```

التشغيل من دون مطالبات وتطبيق الترحيلات الآمنة فقط (تطبيع الإعدادات + نقل الحالة على القرص). ويتخطى إجراءات إعادة التشغيل/الخدمة/‏sandbox التي تتطلب تأكيدًا بشريًا.
تُشغَّل ترحيلات الحالة القديمة تلقائيًا عند اكتشافها.

```bash
openclaw doctor --deep
```

فحص خدمات النظام للعثور على تثبيتات Gateway إضافية (launchd/systemd/schtasks).

إذا كنت تريد مراجعة التغييرات قبل الكتابة، فافتح ملف الإعدادات أولًا:

```bash
cat ~/.openclaw/openclaw.json
```

## ما الذي يفعله (ملخص)

- تحديث اختياري قبل التنفيذ لتثبيتات git (في الوضع التفاعلي فقط).
- فحص حداثة بروتوكول UI (يعيد بناء Control UI عندما يكون مخطط البروتوكول أحدث).
- فحص السلامة + مطالبة بإعادة التشغيل.
- ملخص حالة Skills (المؤهلة/المفقودة/المحجوبة) وحالة Plugin.
- تطبيع الإعدادات للقيم القديمة.
- ترحيل إعدادات Talk من حقول `talk.*` القديمة المسطحة إلى `talk.provider` + `talk.providers.<provider>`.
- فحوصات ترحيل المتصفح لإعدادات امتداد Chrome القديمة وجاهزية Chrome MCP.
- تحذيرات تجاوز موفّر OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- تحذيرات حجب Codex OAuth (`models.providers.openai-codex`).
- فحص متطلبات OAuth TLS الأساسية لملفات تعريف OpenAI Codex OAuth.
- ترحيل الحالة القديمة على القرص (الجلسات/دليل agent/مصادقة WhatsApp).
- ترحيل مفاتيح عقد بيان Plugin القديمة (`speechProviders` و`realtimeTranscriptionProviders` و`realtimeVoiceProviders` و`mediaUnderstandingProviders` و`imageGenerationProviders` و`videoGenerationProviders` و`webFetchProviders` و`webSearchProviders` ← `contracts`).
- ترحيل مخزن Cron القديم (`jobId` و`schedule.cron` وحقول delivery/payload ذات المستوى الأعلى و`provider` في payload ووظائف Webhook الاحتياطية البسيطة ذات `notify: true`).
- فحص ملف قفل الجلسة وتنظيف الأقفال القديمة.
- فحوصات سلامة الحالة والأذونات (الجلسات، والنصوص، ودليل الحالة).
- فحوصات أذونات ملف الإعدادات (`chmod 600`) عند التشغيل محليًا.
- سلامة مصادقة النموذج: يفحص انتهاء صلاحية OAuth، ويمكنه تحديث الرموز التي توشك على الانتهاء، ويبلغ عن حالات التهدئة/التعطيل في ملف تعريف المصادقة.
- اكتشاف دليل workspace إضافي (`~/openclaw`).
- إصلاح صورة sandbox عندما يكون العزل ممكّنًا.
- ترحيل الخدمة القديمة واكتشاف Gateways إضافية.
- ترحيل الحالة القديمة لقناة Matrix (في وضع `--fix` / `--repair`).
- فحوصات وقت تشغيل Gateway (الخدمة مثبتة ولكنها لا تعمل؛ وسم launchd المخزن مؤقتًا).
- تحذيرات حالة القناة (يتم فحصها من Gateway قيد التشغيل).
- تدقيق إعدادات supervisor (launchd/systemd/schtasks) مع إصلاح اختياري.
- فحوصات أفضل الممارسات لوقت تشغيل Gateway (Node مقابل Bun، ومسارات مدير الإصدارات).
- تشخيصات تعارض منفذ Gateway (الافتراضي `18789`).
- تحذيرات أمنية لسياسات الرسائل المباشرة المفتوحة.
- فحوصات مصادقة Gateway لوضع الرمز المحلي (يعرض إنشاء رمز عند عدم وجود مصدر رمز؛ ولا يكتب فوق إعدادات SecretRef الخاصة بالرمز).
- اكتشاف مشكلات اقتران الأجهزة (طلبات الاقتران الأولى المعلقة، وترقيات الدور/النطاق المعلقة، وانجراف ذاكرة التخزين المؤقت المحلية القديمة لرموز الجهاز، وانجراف مصادقة السجل المقترن).
- فحص systemd linger على Linux.
- فحص حجم ملف تمهيد workspace (تحذيرات الاقتطاع/الاقتراب من الحد الأقصى لملفات السياق).
- فحص حالة إكمال shell والتثبيت/الترقية التلقائيان.
- فحص جاهزية موفّر تضمينات البحث في الذاكرة (نموذج محلي، أو مفتاح API بعيد، أو ملف QMD ثنائي).
- فحوصات تثبيت المصدر (عدم تطابق pnpm workspace، وأصول UI المفقودة، وملف tsx الثنائي المفقود).
- يكتب الإعدادات المحدثة + بيانات wizard الوصفية.

## Dreams UI: التعبئة الخلفية وإعادة التعيين

يتضمن مشهد Dreams في Control UI إجراءات **Backfill** و**Reset** و**Clear Grounded**
لسير عمل dreaming المرتكز. وتستخدم هذه الإجراءات طرائق RPC
على نمط doctor في Gateway، لكنها **ليست** جزءًا من إصلاح/ترحيل
CLI في `openclaw doctor`.

ما الذي تفعله:

- **Backfill** يفحص ملفات `memory/YYYY-MM-DD.md` التاريخية في
  مساحة العمل النشطة، ويشغّل تمرير يوميات REM المرتكز، ويكتب إدخالات
  تعبئة خلفية قابلة للعكس إلى `DREAMS.md`.
- **Reset** يزيل فقط إدخالات يوميات التعبئة الخلفية المعلَّمة من `DREAMS.md`.
- **Clear Grounded** يزيل فقط إدخالات grounded-only قصيرة الأجل المرحّلة التي
  جاءت من إعادة تشغيل تاريخية ولم تتراكم لها بعد عمليات استدعاء مباشرة أو دعم يومي.

ما الذي **لا** تفعله بمفردها:

- لا تعدّل `MEMORY.md`
- لا تشغّل ترحيلات doctor الكاملة
- لا تُرحِّل تلقائيًا المرشحين المرتكزين إلى مخزن الترقية الحي قصير الأجل
  ما لم تشغّل أولًا مسار CLI المرحلي صراحةً

إذا كنت تريد أن تؤثر إعادة التشغيل التاريخية المرتكزة في
مسار الترقية العميق العادي، فاستخدم تدفق CLI بدلًا من ذلك:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

يؤدي ذلك إلى ترحيل المرشحين الدائمين المرتكزين إلى مخزن dreaming قصير الأجل مع
الإبقاء على `DREAMS.md` كسطح للمراجعة.

## السلوك المفصل والمبررات

### 0) تحديث اختياري (تثبيتات git)

إذا كان هذا checkout من git وكان doctor يعمل بشكل تفاعلي، فإنه يعرض
التحديث (fetch/rebase/build) قبل تشغيل doctor.

### 1) تطبيع الإعدادات

إذا احتوت الإعدادات على أشكال قيم قديمة (على سبيل المثال `messages.ackReaction`
من دون تجاوز خاص بقناة)، فإن doctor يطبعها إلى المخطط الحالي.

ويشمل ذلك حقول Talk المسطحة القديمة. فالإعدادات العامة الحالية لـ Talk هي
`talk.provider` + `talk.providers.<provider>`. ويعيد doctor كتابة الأشكال القديمة
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` إلى خريطة الموفّر.

### 2) ترحيلات مفاتيح الإعدادات القديمة

عندما تحتوي الإعدادات على مفاتيح مهملة، ترفض الأوامر الأخرى التشغيل
وتطلب منك تشغيل `openclaw doctor`.

سيقوم Doctor بما يلي:

- شرح المفاتيح القديمة التي تم العثور عليها.
- عرض الترحيل الذي تم تطبيقه.
- إعادة كتابة `~/.openclaw/openclaw.json` بالمخطط المحدّث.

كما يشغّل Gateway ترحيلات doctor تلقائيًا عند بدء التشغيل عندما يكتشف
تنسيق إعدادات قديمًا، بحيث تُصلَح الإعدادات القديمة من دون تدخل يدوي.
وتُعالَج ترحيلات مخزن Cron الوظيفي بواسطة `openclaw doctor --fix`.

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
- `messages.tts.provider: "edge"` و`messages.tts.providers.edge` ← `messages.tts.provider: "microsoft"` و`messages.tts.providers.microsoft`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) ← `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) ← `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) ← `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.provider: "edge"` و`plugins.entries.voice-call.config.tts.providers.edge` ← `provider: "microsoft"` و`providers.microsoft`
- `plugins.entries.voice-call.config.provider: "log"` ← `"mock"`
- `plugins.entries.voice-call.config.twilio.from` ← `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` ← `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  ← `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` ← `bindings[].match.accountId`
- بالنسبة إلى القنوات التي تحتوي على `accounts` مسماة ولكن لا تزال فيها قيم قناة ذات مستوى أعلى خاصة بحساب واحد، انقل تلك القيم ذات النطاق الخاص بالحساب إلى الحساب المرقّى المختار لتلك القناة (`accounts.default` لمعظم القنوات؛ ويمكن لـ Matrix الحفاظ على هدف مسمّى/افتراضي مطابق موجود)
- `identity` ← `agents.list[].identity`
- `agent.*` ← `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  ← `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` ← `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` ← `"existing-session"`
- إزالة `browser.relayBindHost` (إعداد relay قديم للامتداد)

تتضمن تحذيرات Doctor أيضًا إرشادات حول الحساب الافتراضي للقنوات متعددة الحسابات:

- إذا تم إعداد إدخالين أو أكثر ضمن `channels.<channel>.accounts` من دون `channels.<channel>.defaultAccount` أو `accounts.default`، فسيحذر doctor من أن التوجيه الاحتياطي قد يختار حسابًا غير متوقع.
- إذا كانت `channels.<channel>.defaultAccount` مضبوطة على معرّف حساب غير معروف، فسيحذر doctor ويسرد معرّفات الحسابات المُعدّة.

### 2b) تجاوزات موفّر OpenCode

إذا أضفت `models.providers.opencode` أو `opencode-zen` أو `opencode-go`
يدويًا، فسيؤدي ذلك إلى تجاوز كتالوج OpenCode المضمّن القادم من `@mariozechner/pi-ai`.
وقد يفرض ذلك النماذج على API غير صحيح أو يجعل التكاليف صفرًا. ويحذّر doctor لكي
تتمكن من إزالة هذا التجاوز واستعادة توجيه API والتكاليف لكل نموذج.

### 2c) ترحيل المتصفح وجاهزية Chrome MCP

إذا كانت إعدادات المتصفح لديك ما تزال تشير إلى مسار امتداد Chrome المحذوف، فإن doctor
يطبعها إلى نموذج الإرفاق المحلي الحالي لـ Chrome MCP على المضيف:

- `browser.profiles.*.driver: "extension"` تصبح `"existing-session"`
- تتم إزالة `browser.relayBindHost`

كما يقوم Doctor بتدقيق مسار Chrome MCP المحلي على المضيف عندما تستخدم
`defaultProfile: "user"` أو ملف `existing-session` مُعدًا:

- يفحص ما إذا كان Google Chrome مثبتًا على نفس المضيف لملفات
  التعريف الافتراضية ذات الاتصال التلقائي
- يفحص إصدار Chrome المكتشف ويحذر عندما يكون أقل من Chrome 144
- يذكرك بتمكين التصحيح عن بُعد في صفحة فحص المتصفح (مثل
  `chrome://inspect/#remote-debugging` أو `brave://inspect/#remote-debugging`
  أو `edge://inspect/#remote-debugging`)

لا يستطيع Doctor تمكين الإعداد في جانب Chrome نيابةً عنك. فما يزال Chrome MCP المحلي على المضيف
يتطلب ما يلي:

- متصفحًا مبنيًا على Chromium بالإصدار 144+ على مضيف gateway/node
- أن يكون المتصفح يعمل محليًا
- تمكين التصحيح عن بُعد في ذلك المتصفح
- الموافقة على مطالبة الإرفاق الأولى في المتصفح

تتعلق الجاهزية هنا فقط بمتطلبات الإرفاق المحلي الأساسية. ويحتفظ existing-session
بحدود مسارات Chrome MCP الحالية؛ أما المسارات المتقدمة مثل `responsebody` وتصدير
PDF واعتراض التنزيلات والإجراءات الدفعية فما تزال تتطلب متصفحًا مُدارًا
أو ملف تعريف CDP خام.

لا ينطبق هذا الفحص على Docker أو sandbox أو remote-browser أو
التدفقات الأخرى دون واجهة. فهذه تواصل استخدام CDP الخام.

### 2d) متطلبات OAuth TLS الأساسية

عندما يكون ملف تعريف OpenAI Codex OAuth مُعدًا، يفحص doctor نقطة نهاية
التفويض الخاصة بـ OpenAI للتحقق من أن مكدس TLS المحلي لـ Node/OpenSSL قادر
على التحقق من سلسلة الشهادات. وإذا فشل الفحص بسبب خطأ في الشهادة (على سبيل
المثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` أو شهادة منتهية الصلاحية أو شهادة
موقعة ذاتيًا)، يطبع doctor إرشادات إصلاح خاصة بالمنصة. وعلى macOS مع Node من Homebrew، يكون
الإصلاح عادةً هو `brew postinstall ca-certificates`. ومع `--deep`، يُجرى الفحص
حتى إذا كانت Gateway سليمة.

### 2c) تجاوزات موفّر Codex OAuth

إذا كنت قد أضفت سابقًا إعدادات نقل OpenAI القديمة ضمن
`models.providers.openai-codex`، فقد تحجب هذه الإعدادات مسار
موفّر Codex OAuth المضمّن الذي تستخدمه الإصدارات الأحدث تلقائيًا. ويحذر doctor عندما يرى
إعدادات النقل القديمة هذه إلى جانب Codex OAuth حتى تتمكن من إزالة
تجاوز النقل القديم أو إعادة كتابته واستعادة سلوك التوجيه/الرجوع الاحتياطي
المضمّن. وما تزال الوكلاء المخصصون والتجاوزات التي تعتمد على الرؤوس فقط
مدعومة ولا تُطلق هذا التحذير.

### 3) ترحيلات الحالة القديمة (تخطيط القرص)

يمكن لـ Doctor ترحيل التخطيطات الأقدم على القرص إلى البنية الحالية:

- مخزن الجلسات + النصوص:
  - من `~/.openclaw/sessions/` إلى `~/.openclaw/agents/<agentId>/sessions/`
- دليل agent:
  - من `~/.openclaw/agent/` إلى `~/.openclaw/agents/<agentId>/agent/`
- حالة مصادقة WhatsApp ‏(Baileys):
  - من `~/.openclaw/credentials/*.json` القديمة (باستثناء `oauth.json`)
  - إلى `~/.openclaw/credentials/whatsapp/<accountId>/...` (معرّف الحساب الافتراضي: `default`)

هذه الترحيلات تُنفّذ بأفضل جهد وهي قابلة للتكرار الآمن؛ وسيصدر doctor تحذيرات عندما
يترك أي مجلدات قديمة خلفه كنسخ احتياطية. كما يقوم Gateway/CLI أيضًا بترحيل
الجلسات القديمة + دليل agent تلقائيًا عند بدء التشغيل بحيث تنتقل
السجلات/المصادقة/النماذج إلى المسار الخاص بكل agent من دون الحاجة إلى تشغيل doctor يدويًا.
وتُرحَّل مصادقة WhatsApp عمدًا فقط عبر `openclaw doctor`. كما أن تطبيع
Talk provider/provider-map يقارن الآن وفق المساواة البنيوية، لذلك لم تعد
الاختلافات في ترتيب المفاتيح فقط تؤدي إلى تغييرات متكررة بلا تأثير عند `doctor --fix`.

### 3a) ترحيلات بيان Plugin القديمة

يفحص Doctor جميع بيانات Plugin المثبتة بحثًا عن مفاتيح الإمكانات
ذات المستوى الأعلى المهملة (`speechProviders` و`realtimeTranscriptionProviders`
و`realtimeVoiceProviders` و`mediaUnderstandingProviders`
و`imageGenerationProviders` و`videoGenerationProviders` و`webFetchProviders`
و`webSearchProviders`). وعند العثور عليها، يعرض نقلها إلى الكائن `contracts`
وإعادة كتابة ملف البيان في مكانه. هذا الترحيل قابل للتكرار الآمن؛
فإذا كان المفتاح `contracts` يحتوي بالفعل على القيم نفسها، تُزال
المفاتيح القديمة من دون تكرار البيانات.

### 3b) ترحيلات مخزن Cron القديمة

يفحص Doctor أيضًا مخزن وظائف Cron (`~/.openclaw/cron/jobs.json` افتراضيًا،
أو `cron.store` عند تجاوزه) بحثًا عن أشكال الوظائف القديمة التي ما يزال
المجدول يقبلها لأغراض التوافق.

تشمل عمليات تنظيف Cron الحالية ما يلي:

- `jobId` ← `id`
- `schedule.cron` ← `schedule.expr`
- حقول payload ذات المستوى الأعلى (`message` و`model` و`thinking` و...) ← `payload`
- حقول delivery ذات المستوى الأعلى (`deliver` و`channel` و`to` و`provider` و...) ← `delivery`
- الأسماء البديلة للتسليم `provider` داخل payload ← `delivery.channel` صريح
- وظائف Webhook الاحتياطية القديمة البسيطة ذات `notify: true` ← `delivery.mode="webhook"` صريح مع `delivery.to=cron.webhook`

لا يرحّل Doctor تلقائيًا وظائف `notify: true` إلا عندما يتمكن من ذلك
من دون تغيير السلوك. وإذا جمعت وظيفة بين الاحتياط notify القديم مع
وضع delivery غير Webhook موجود مسبقًا، فسيحذر doctor ويترك تلك الوظيفة
للمراجعة اليدوية.

### 3c) تنظيف أقفال الجلسات

يفحص Doctor كل دليل جلسة agent بحثًا عن ملفات قفل كتابة قديمة — وهي الملفات التي
تُترك خلفها عندما تنتهي جلسة بشكل غير طبيعي. ولكل ملف قفل يُعثر عليه، يبلغ عن:
المسار، وPID، وما إذا كان PID ما يزال حيًا، وعمر القفل، وما إذا كان
يُعد قديمًا (PID ميت أو أقدم من 30 دقيقة). وفي وضع `--fix` / `--repair`
يزيل ملفات القفل القديمة تلقائيًا؛ وإلا فإنه يطبع ملاحظة
ويطلب منك إعادة التشغيل باستخدام `--fix`.

### 4) فحوصات سلامة الحالة (استمرارية الجلسة، والتوجيه، والأمان)

دليل الحالة هو جذع الدماغ التشغيلي. فإذا اختفى، ستفقد
الجلسات، وبيانات الاعتماد، والسجلات، والإعدادات (ما لم تكن لديك نسخ احتياطية في مكان آخر).

يفحص Doctor ما يلي:

- **دليل الحالة مفقود**: يحذر من فقدان الحالة الكارثي، ويطالب بإعادة إنشاء
  الدليل، ويذكرك بأنه لا يمكنه استعادة البيانات المفقودة.
- **أذونات دليل الحالة**: يتحقق من قابلية الكتابة؛ ويعرض إصلاح الأذونات
  (ويصدر تلميح `chown` عند اكتشاف عدم تطابق في المالك/المجموعة).
- **دليل حالة macOS المتزامن مع السحابة**: يحذر عندما تُحل الحالة ضمن iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) أو
  `~/Library/CloudStorage/...` لأن المسارات المدعومة بالمزامنة قد تسبب بطء إدخال/إخراج
  وسباقات في القفل/المزامنة.
- **دليل الحالة على Linux فوق SD أو eMMC**: يحذر عندما تُحل الحالة إلى مصدر تحميل
  `mmcblk*`، لأن إدخال/إخراج الوصول العشوائي المدعوم بـ SD أو eMMC قد يكون أبطأ
  ويتعرض للاهتراء بشكل أسرع مع كتابة الجلسات وبيانات الاعتماد.
- **أدلة الجلسات مفقودة**: يلزم وجود `sessions/` ودليل مخزن الجلسات
  للحفاظ على السجل وتجنب أعطال `ENOENT`.
- **عدم تطابق النصوص**: يحذر عندما تحتوي إدخالات الجلسة الحديثة على ملفات
  نصوص مفقودة.
- **JSONL أحادي السطر للجلسة الرئيسية**: يضع علامة عندما يحتوي النص الرئيسي على سطر واحد فقط
  (أي إن السجل لا يتراكم).
- **أدلة حالة متعددة**: يحذر عندما توجد عدة مجلدات `~/.openclaw` عبر
  أدلة home أو عندما يشير `OPENCLAW_STATE_DIR` إلى مكان آخر (قد ينقسم السجل
  بين التثبيتات).
- **تذكير الوضع البعيد**: إذا كان `gateway.mode=remote`، يذكرك doctor بتشغيله
  على المضيف البعيد (لأن الحالة موجودة هناك).
- **أذونات ملف الإعدادات**: يحذر إذا كان `~/.openclaw/openclaw.json`
  قابلًا للقراءة من قبل المجموعة/العالم ويعرض تشديده إلى `600`.

### 5) سلامة مصادقة النموذج (انتهاء OAuth)

يفحص Doctor ملفات تعريف OAuth في مخزن المصادقة، ويحذر عندما تكون الرموز
على وشك الانتهاء/منتهية، ويمكنه تحديثها عندما يكون ذلك آمنًا. وإذا كان
ملف تعريف Anthropic OAuth/token قديمًا، فإنه يقترح استخدام مفتاح Anthropic API أو
مسار Anthropic setup-token.
ولا تظهر مطالبات التحديث إلا عند التشغيل بشكل تفاعلي (TTY)؛ أما `--non-interactive`
فيتخطى محاولات التحديث.

وعندما يفشل تحديث OAuth بشكل دائم (على سبيل المثال `refresh_token_reused`
أو `invalid_grant` أو عندما يطلب منك الموفّر تسجيل الدخول مرة أخرى)،
يبلغ doctor بأن إعادة المصادقة مطلوبة ويطبع الأمر الدقيق
`openclaw models auth login --provider ...` الذي يجب تشغيله.

كما يبلغ Doctor أيضًا عن ملفات تعريف المصادقة غير القابلة للاستخدام مؤقتًا بسبب:

- فترات تهدئة قصيرة (حدود المعدل/المهل الزمنية/إخفاقات المصادقة)
- تعطيلات أطول (إخفاقات الفوترة/الرصيد)

### 6) التحقق من نموذج الخطافات

إذا كان `hooks.gmail.model` مضبوطًا، فإن doctor يتحقق من مرجع النموذج مقابل
الكتالوج وقائمة السماح ويحذر عندما لا يمكن حله أو عندما لا يكون مسموحًا به.

### 7) إصلاح صورة sandbox

عند تمكين sandboxing، يفحص doctor صور Docker ويعرض بناءها أو
التبديل إلى الأسماء القديمة إذا كانت الصورة الحالية مفقودة.

### 7b) تبعيات وقت تشغيل Plugin المضمّنة

يتحقق Doctor من تبعيات وقت التشغيل فقط للمكوّنات الإضافية المضمّنة النشطة في
الإعدادات الحالية أو المفعّلة افتراضيًا بواسطة البيان المضمّن لها، على سبيل المثال
`plugins.entries.discord.enabled: true` أو الصيغة القديمة
`channels.discord.enabled: true` أو موفّر مضمّن مفعّل افتراضيًا. وإذا كان أي شيء
مفقودًا، يبلغ doctor عن الحزم ويثبتها في
وضع `openclaw doctor --fix` / `openclaw doctor --repair`. أما المكوّنات الإضافية الخارجية فما تزال
تستخدم `openclaw plugins install` / `openclaw plugins update`؛ ولا يقوم doctor
بتثبيت التبعيات لمسارات Plugin العشوائية.

يمكن لـ Gateway وCLI المحلي أيضًا إصلاح تبعيات وقت تشغيل المكوّنات الإضافية المضمّنة النشطة
عند الطلب قبل استيراد Plugin مضمّن. وتكون هذه التثبيتات
محصورة في جذر تثبيت وقت تشغيل Plugin، وتعمل مع تعطيل السكربتات، ولا تكتب
package lock، وهي محمية بقفل على جذر التثبيت بحيث لا تقوم
بدايات CLI أو Gateway المتزامنة بتعديل الشجرة نفسها `node_modules` في الوقت نفسه.

### 8) ترحيلات خدمة Gateway وتلميحات التنظيف

يكتشف Doctor خدمات Gateway القديمة (launchd/systemd/schtasks) و
يعرض إزالتها وتثبيت خدمة OpenClaw باستخدام منفذ Gateway الحالي.
كما يمكنه أيضًا فحص خدمات إضافية شبيهة بـ Gateway وطباعة تلميحات تنظيف.
وتُعد خدمات OpenClaw gateway المسماة حسب profile خدمات من الدرجة الأولى ولا
تُوسم على أنها "إضافية".

### 8b) ترحيل Matrix عند بدء التشغيل

عندما يكون لدى حساب قناة Matrix ترحيل حالة قديم معلّق أو قابل للتنفيذ،
يقوم doctor (في وضع `--fix` / `--repair`) بإنشاء لقطة قبل الترحيل ثم
يشغّل خطوات الترحيل بأفضل جهد: ترحيل حالة Matrix القديمة وتجهيز
الحالة المشفرة القديمة. كلتا الخطوتين غير قاتلتين؛ تُسجل الأخطاء ويستمر
بدء التشغيل. وفي وضع القراءة فقط (`openclaw doctor` بدون `--fix`) يتم
تخطي هذا الفحص بالكامل.

### 8c) اقتران الأجهزة وانجراف المصادقة

يفحص Doctor الآن حالة اقتران الأجهزة كجزء من تمرير السلامة العادي.

ما الذي يبلغ عنه:

- طلبات الاقتران الأولى المعلقة
- ترقيات الأدوار المعلقة للأجهزة المقترنة بالفعل
- ترقيات النطاقات المعلقة للأجهزة المقترنة بالفعل
- إصلاحات عدم تطابق المفتاح العام عندما يظل معرّف الجهاز مطابقًا لكن
  هوية الجهاز لم تعد تطابق السجل المعتمد
- السجلات المقترنة التي تفتقد إلى رمز نشط لدور معتمد
- الرموز المقترنة التي تنحرف نطاقاتها خارج خط الأساس المعتمد للاقتران
- إدخالات ذاكرة التخزين المؤقت المحلية لرمز الجهاز الخاصة بالجهاز الحالي التي تسبق
  تدوير رمز من جهة Gateway أو تحمل بيانات نطاق وصفية قديمة

لا يوافق Doctor تلقائيًا على طلبات الاقتران ولا يدوّر رموز الأجهزة تلقائيًا. بل
يطبع الخطوات التالية الدقيقة بدلًا من ذلك:

- فحص الطلبات المعلقة باستخدام `openclaw devices list`
- الموافقة على الطلب المحدد باستخدام `openclaw devices approve <requestId>`
- تدوير رمز جديد باستخدام `openclaw devices rotate --device <deviceId> --role <role>`
- إزالة سجل قديم والموافقة عليه من جديد باستخدام `openclaw devices remove <deviceId>`

وهذا يغلق الثغرة الشائعة "الجهاز مقترن بالفعل لكنه ما يزال يتلقى pairing required":
إذ يميّز doctor الآن بين الاقتران الأولي وترقيات الدور/النطاق المعلقة
وبين انجراف الرمز/هوية الجهاز القديمة.

### 9) تحذيرات الأمان

يصدر Doctor تحذيرات عندما يكون موفّر ما مفتوحًا للرسائل المباشرة من دون
قائمة سماح، أو عندما تكون السياسة مُعدة بطريقة خطرة.

### 10) systemd linger ‏(Linux)

إذا كان التشغيل يتم كخدمة مستخدم systemd، فإن doctor يضمن تمكين linger لكي
تظل Gateway تعمل بعد تسجيل الخروج.

### 11) حالة مساحة العمل (Skills وPlugins والأدلة القديمة)

يطبع Doctor ملخصًا لحالة مساحة العمل الخاصة بالـ agent الافتراضي:

- **حالة Skills**: يعدّ Skills المؤهلة وتلك ذات المتطلبات المفقودة والمحجوبة بقائمة السماح.
- **أدلة مساحة العمل القديمة**: يحذر عندما توجد `~/openclaw` أو أدلة مساحة عمل قديمة أخرى
  إلى جانب مساحة العمل الحالية.
- **حالة Plugin**: يعدّ المكوّنات الإضافية المفعّلة/المعطلة/التي بها أخطاء؛ ويسرد معرّفات Plugin لأي
  أخطاء؛ ويبلغ عن إمكانات حِزم Plugin.
- **تحذيرات توافق Plugin**: يضع علامة على المكوّنات الإضافية التي لديها مشكلات توافق مع
  وقت التشغيل الحالي.
- **تشخيصات Plugin**: يعرض أي تحذيرات أو أخطاء وقت التحميل صادرة من
  سجل Plugin.

### 11b) حجم ملف التمهيد

يفحص Doctor ما إذا كانت ملفات تمهيد مساحة العمل (على سبيل المثال `AGENTS.md`،
أو `CLAUDE.md`، أو ملفات السياق الأخرى المحقونة) قريبة من أو تتجاوز
ميزانية الأحرف المُعدة. ويبلغ عن عدد الأحرف الخام مقابل المحقونة لكل ملف، ونسبة
الاقتطاع، وسبب الاقتطاع (`max/file` أو `max/total`)، وإجمالي الأحرف المحقونة
كنسبة من إجمالي الميزانية. وعندما تُقتطع الملفات أو تكون قريبة من الحد،
يطبع doctor نصائح لضبط `agents.defaults.bootstrapMaxChars`
و`agents.defaults.bootstrapTotalMaxChars`.

### 11c) إكمال shell

يفحص Doctor ما إذا كان إكمال Tab مثبتًا للـ shell الحالي
(zsh أو bash أو fish أو PowerShell):

- إذا كان ملف تعريف shell يستخدم نمط إكمال ديناميكيًا بطيئًا
  (`source <(openclaw completion ...)`)، فإن doctor يرقّيه إلى
  المتغير الأسرع المعتمد على الملف المخزن مؤقتًا.
- إذا كان الإكمال مُعدًا في ملف التعريف لكن ملف cache مفقودًا،
  فإن doctor يعيد توليد cache تلقائيًا.
- إذا لم يكن هناك أي إعداد للإكمال على الإطلاق، فإن doctor يطالب بتثبيته
  (في الوضع التفاعلي فقط؛ ويتم تخطيه مع `--non-interactive`).

شغّل `openclaw completion --write-state` لإعادة توليد cache يدويًا.

### 12) فحوصات مصادقة Gateway (الرمز المحلي)

يفحص Doctor جاهزية مصادقة رمز Gateway المحلي.

- إذا كان وضع الرمز يحتاج إلى رمز ولا يوجد مصدر للرمز، يعرض doctor إنشاء رمز.
- إذا كان `gateway.auth.token` مُدارًا عبر SecretRef ولكنه غير متاح، فإن doctor يحذر ولا يكتب فوقه بنص واضح.
- يفرض `openclaw doctor --generate-gateway-token` الإنشاء فقط عند عدم إعداد أي SecretRef للرمز.

### 12b) إصلاحات تراعي SecretRef في وضع القراءة فقط

تحتاج بعض تدفقات الإصلاح إلى فحص بيانات الاعتماد المُعدة من دون إضعاف سلوك الفشل السريع في وقت التشغيل.

- يستخدم `openclaw doctor --fix` الآن نموذج ملخص SecretRef نفسه في وضع القراءة فقط كما في أوامر عائلة status لإصلاحات الإعدادات المستهدفة.
- مثال: يحاول إصلاح Telegram `allowFrom` / `groupAllowFrom` ذي `@username` استخدام بيانات اعتماد bot المُعدة عند توفرها.
- إذا كان رمز Telegram bot مُعدًا عبر SecretRef لكنه غير متاح في مسار الأمر الحالي، فإن doctor يبلغ بأن بيانات الاعتماد مُعدة ولكنها غير متاحة، ويتخطى الحل التلقائي بدلًا من التعطل أو الإبلاغ خطأً بأن الرمز مفقود.

### 13) فحص سلامة Gateway + إعادة التشغيل

يشغّل Doctor فحص سلامة ويعرض إعادة تشغيل Gateway عندما
تبدو غير سليمة.

### 13b) جاهزية البحث في الذاكرة

يفحص Doctor ما إذا كان موفّر تضمينات البحث في الذاكرة المُعد جاهزًا
للـ agent الافتراضي. ويعتمد السلوك على backend والموفّر المُعدَّين:

- **QMD backend**: يفحص ما إذا كان الملف الثنائي `qmd` متاحًا وقابلًا للتشغيل.
  وإذا لم يكن كذلك، يطبع إرشادات إصلاح تتضمن حزمة npm وخيار مسار ثنائي يدوي.
- **موفّر محلي صريح**: يفحص وجود ملف نموذج محلي أو عنوان URL معروف
  لنموذج بعيد/قابل للتنزيل. وإذا كان مفقودًا، يقترح التبديل إلى موفّر بعيد.
- **موفّر بعيد صريح** (`openai` أو `voyage` أو غيرهما): يتحقق من وجود مفتاح API
  في البيئة أو مخزن المصادقة. ويطبع تلميحات إصلاح عملية إذا كان مفقودًا.
- **موفّر تلقائي**: يفحص أولًا توفر النموذج المحلي، ثم يجرّب كل موفّر بعيد
  وفق ترتيب الاختيار التلقائي.

عندما تكون نتيجة فحص من Gateway متاحة (أي كانت Gateway سليمة وقت
الفحص)، يقارن doctor نتيجتها بالإعدادات المرئية في CLI ويشير
إلى أي اختلاف.

استخدم `openclaw memory status --deep` للتحقق من جاهزية التضمينات في وقت التشغيل.

### 14) تحذيرات حالة القناة

إذا كانت Gateway سليمة، يشغّل doctor فحص حالة القناة ويبلغ عن
التحذيرات مع الإصلاحات المقترحة.

### 15) تدقيق إعدادات supervisor + الإصلاح

يفحص Doctor إعدادات supervisor المثبتة (launchd/systemd/schtasks) بحثًا عن
قيم افتراضية مفقودة أو قديمة (مثل تبعيات systemd الخاصة بـ network-online و
تأخير إعادة التشغيل). وعندما يجد عدم تطابق، يوصي بالتحديث ويمكنه
إعادة كتابة ملف الخدمة/المهمة إلى القيم الافتراضية الحالية.

ملاحظات:

- يطالب `openclaw doctor` قبل إعادة كتابة إعدادات supervisor.
- يقبل `openclaw doctor --yes` مطالبات الإصلاح الافتراضية.
- يطبق `openclaw doctor --repair` الإصلاحات الموصى بها من دون مطالبات.
- يكتب `openclaw doctor --repair --force` فوق إعدادات supervisor المخصصة.
- إذا كانت مصادقة الرمز تتطلب رمزًا وكان `gateway.auth.token` مُدارًا عبر SecretRef، فإن تثبيت/إصلاح خدمة doctor يتحقق من SecretRef لكنه لا يحفظ قيم الرمز النصية الصريحة التي تم حلها في بيانات البيئة الوصفية لخدمة supervisor.
- إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef المُعد للرمز غير محلول، فإن doctor يمنع مسار التثبيت/الإصلاح مع إرشادات عملية.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مُعدَّين وكان `gateway.auth.mode` غير مضبوط، فإن doctor يمنع التثبيت/الإصلاح حتى يُضبط الوضع صراحةً.
- بالنسبة إلى وحدات user-systemd على Linux، تتضمن فحوصات انجراف الرمز في doctor الآن كلا المصدرين `Environment=` و`EnvironmentFile=` عند مقارنة بيانات مصادقة الخدمة الوصفية.
- يمكنك دائمًا فرض إعادة كتابة كاملة عبر `openclaw gateway install --force`.

### 16) تشخيصات وقت تشغيل Gateway + المنفذ

يفحص Doctor وقت تشغيل الخدمة (PID، وآخر حالة خروج) ويحذر عندما تكون
الخدمة مثبتة لكنها لا تعمل فعليًا. كما يفحص أيضًا تعارضات المنفذ
على منفذ Gateway (الافتراضي `18789`) ويبلغ عن الأسباب المحتملة (Gateway تعمل بالفعل،
أو نفق SSH).

### 17) أفضل ممارسات وقت تشغيل Gateway

يحذر Doctor عندما تعمل خدمة Gateway على Bun أو على مسار Node مُدار بواسطة مدير إصدارات
(`nvm` أو `fnm` أو `volta` أو `asdf` أو غيرها). تتطلب قناتا WhatsApp وTelegram
Node، وقد تتعطل مسارات مديري الإصدارات بعد الترقية لأن الخدمة لا
تحمّل تهيئة shell الخاصة بك. ويعرض doctor الترحيل إلى تثبيت Node
على مستوى النظام عند توفره (Homebrew/apt/choco).

### 18) كتابة الإعدادات + بيانات wizard الوصفية

يحفظ Doctor أي تغييرات في الإعدادات ويضع بيانات wizard الوصفية لتسجيل
تشغيل doctor.

### 19) نصائح مساحة العمل (النسخ الاحتياطي + نظام الذاكرة)

يقترح Doctor نظام ذاكرة لمساحة العمل عندما يكون مفقودًا ويطبع نصيحة خاصة بالنسخ الاحتياطي
إذا لم تكن مساحة العمل خاضعة لـ git بالفعل.

راجع [/concepts/agent-workspace](/ar/concepts/agent-workspace) للحصول على دليل كامل
لبنية مساحة العمل والنسخ الاحتياطي عبر git (ويُوصى باستخدام GitHub أو GitLab خاص).

## ذو صلة

- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
- [دليل تشغيل Gateway](/ar/gateway)
