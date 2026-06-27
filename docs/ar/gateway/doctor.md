---
read_when:
    - إضافة أو تعديل ترحيلات doctor
    - تقديم تغييرات كاسرة في الإعدادات
sidebarTitle: Doctor
summary: 'أمر Doctor: فحوصات السلامة، وترحيلات الإعدادات، وخطوات الإصلاح'
title: أداة التشخيص
x-i18n:
    generated_at: "2026-06-27T17:37:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdb5e3fb437a8678c427dee698a0ea6004b22b71c6e38cc6f75ba674fa4fcc5e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` هو أداة الإصلاح + الترحيل في OpenClaw. تصلح الإعدادات/الحالة القديمة، وتتحقق من السلامة، وتوفر خطوات إصلاح قابلة للتنفيذ.

## البدء السريع

```bash
openclaw doctor
```

### أوضاع التشغيل دون واجهة وأوضاع الأتمتة

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    اقبل القيم الافتراضية دون مطالبة (بما في ذلك خطوات إصلاح إعادة التشغيل/الخدمة/العزل عند انطباقها).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    طبّق الإصلاحات الموصى بها دون مطالبة (الإصلاحات + عمليات إعادة التشغيل حيث تكون آمنة).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    شغّل فحوصات سلامة منظمة من أجل CI أو أتمتة التمهيد. هذا الوضع للقراءة فقط:
    لا يطلب إدخالًا، ولا يصلح، ولا يرحّل الإعدادات، ولا يعيد تشغيل الخدمات، ولا
    يلمس الحالة.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    طبّق الإصلاحات الشديدة أيضًا (يستبدل إعدادات المشرف المخصصة).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    شغّل دون مطالبات وطبّق فقط عمليات الترحيل الآمنة (تطبيع الإعدادات + نقل الحالة على القرص). يتخطى إجراءات إعادة التشغيل/الخدمة/العزل التي تتطلب تأكيدًا بشريًا. تعمل ترحيلات الحالة القديمة تلقائيًا عند اكتشافها.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    افحص خدمات النظام للعثور على تثبيتات Gateway إضافية (launchd/systemd/schtasks).

  </Tab>
</Tabs>

إذا أردت مراجعة التغييرات قبل الكتابة، فافتح ملف الإعدادات أولًا:

```bash
cat ~/.openclaw/openclaw.json
```

## وضع الفحص للقراءة فقط

`openclaw doctor --lint` هو النظير الملائم للأتمتة لـ
`openclaw doctor --fix`. يستخدم كلاهما فحوصات سلامة doctor، لكن موقفهما
مختلف:

| الوضع                    | المطالبات | يكتب الإعدادات/الحالة       | المخرجات              | استخدمه من أجل                    |
| ------------------------ | --------- | --------------------------- | --------------------- | --------------------------------- |
| `openclaw doctor`        | نعم       | لا                          | تقرير سلامة ودود      | إنسان يتحقق من الحالة             |
| `openclaw doctor --fix`  | أحيانًا   | نعم، وفق سياسة الإصلاح      | سجل إصلاح ودود        | تطبيق الإصلاحات المعتمدة          |
| `openclaw doctor --lint` | لا        | لا                          | نتائج منظمة           | CI، والتمهيد، وبوابات المراجعة    |

قد توفر فحوصات السلامة المحدّثة تنفيذًا اختياريًا لـ `repair()`.
يطبّق `doctor --fix` تلك الإصلاحات عند وجودها ويواصل استخدام مسار إصلاح
doctor الموجود للفحوصات التي لم تُرحّل بعد.
يفصل عقد الإصلاح المنظم أيضًا تقارير الإصلاح عن الاكتشاف:
يبلّغ `detect()` عن النتائج الحالية، بينما يستطيع `repair()` الإبلاغ عن التغييرات،
وفروقات الإعدادات/الملفات، والآثار الجانبية غير الملفية. هذا يبقي مسار الترحيل مفتوحًا
لإخراج `doctor --fix --dry-run` والفروقات مستقبلًا دون جعل فحوصات الفحص
تخطط للطفرات.

أمثلة:

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

تتضمن مخرجات JSON:

- `ok`: ما إذا كانت أي نتيجة مرئية قد بلغت عتبة الشدة المحددة
- `checksRun`: عدد فحوصات السلامة المنفذة
- `checksSkipped`: الفحوصات التي تخطاها الملف المحدد، أو `--only`، أو `--skip`
- `findings`: تشخيصات منظمة تتضمن `checkId`، و`severity`، و`message`، و
  `path`، و`line`، و`column`، و`ocPath`، و`fixHint` اختياريًا

رموز الخروج:

- `0`: لا توجد نتائج عند العتبة المحددة أو أعلى منها
- `1`: نتيجة واحدة أو أكثر بلغت العتبة المحددة
- `2`: فشل في الأمر/وقت التشغيل قبل أن يمكن إصدار نتائج الفحص

استخدم `--severity-min info|warning|error` للتحكم في ما يُطبع وما
يسبب خروج الفحص برمز غير صفري. استخدم `--all` لتشغيل مخزون الفحص الكامل،
بما في ذلك الفحوصات الأعمق التي تتطلب الاشتراك والمستبعدة من مجموعة الأتمتة الافتراضية. استخدم `--only <id>` لبوابات تمهيد ضيقة و
`--skip <id>` لاستبعاد فحص مزعج مؤقتًا مع إبقاء بقية
تشغيل الفحص نشطًا.
يجب إقران خيارات إخراج الفحص مثل `--json`، و`--severity-min`، و`--all`، و`--only`، و
`--skip` مع `--lint`؛ أما تشغيلات doctor العادية وتشغيلات الإصلاح فترفضها.

## ما الذي يفعله (ملخص)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - تحديث تمهيدي اختياري لتثبيتات git (تفاعلي فقط).
    - فحص حداثة بروتوكول الواجهة (يعيد بناء Control UI عندما يكون مخطط البروتوكول أحدث).
    - فحص سلامة + مطالبة بإعادة التشغيل.
    - ملخص حالة Skills (مؤهل/مفقود/محظور) وحالة Plugin.

  </Accordion>
  <Accordion title="Config and migrations">
    - تطبيع الإعدادات للقيم القديمة.
    - ترحيل إعدادات Talk من حقول `talk.*` المسطحة القديمة إلى `talk.provider` + `talk.providers.<provider>`.
    - فحوصات ترحيل المتصفح لإعدادات إضافة Chrome القديمة وجاهزية Chrome MCP.
    - تحذيرات تجاوز موفر OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - ترحيل موفر/ملف OpenAI Codex القديم (`openai-codex` → `openai`) وتحذيرات التظليل لـ `models.providers.openai-codex` القديمة.
    - فحص متطلبات OAuth TLS الأساسية لملفات OpenAI Codex OAuth.
    - تحذيرات قائمة السماح لـ Plugin/الأداة عندما تكون `plugins.allow` مقيّدة لكن سياسة الأداة لا تزال تطلب أدوات البدل أو الأدوات المملوكة لـ Plugin.
    - ترحيل الحالة القديمة على القرص (الجلسات/دليل الوكيل/مصادقة WhatsApp).
    - ترحيل مفاتيح عقد بيان Plugin القديمة (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - ترحيل مخزن Cron القديم (`jobId`، و`schedule.cron`، وحقول التسليم/الحمولة ذات المستوى الأعلى، وحمولة `provider`، ومهام Webhook الاحتياطية `notify: true`).
    - تنظيف سياسة وقت تشغيل الوكيل الكامل القديمة؛ سياسة وقت تشغيل الموفر/النموذج هي محدد المسار النشط.
    - تنظيف إعدادات Plugin القديمة عند تمكين Plugin؛ عندما تكون `plugins.enabled=false`، تُعامل مراجع Plugin القديمة كإعداد احتواء خامد وتُحفظ.

  </Accordion>
  <Accordion title="State and integrity">
    - فحص ملف قفل الجلسة وتنظيف الأقفال القديمة.
    - إصلاح نصوص الجلسات للفروع المكررة لإعادة كتابة المطالبة التي أنشأتها إصدارات 2026.4.24 المتأثرة.
    - اكتشاف شاهدة استرداد إعادة تشغيل الوكيل الفرعي العالق، مع دعم `--fix` لمسح أعلام الاسترداد المجهض القديمة حتى لا يستمر بدء التشغيل في معاملة التابع على أنه مجهض إعادة التشغيل.
    - فحوصات سلامة الحالة والأذونات (الجلسات، النصوص، دليل الحالة).
    - فحوصات أذونات ملف الإعدادات (chmod 600) عند التشغيل محليًا.
    - سلامة مصادقة النموذج: تفحص انتهاء صلاحية OAuth، ويمكنها تحديث الرموز التي توشك على الانتهاء، وتبلّغ عن حالات تهدئة/تعطيل ملف المصادقة.

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - إصلاح صورة العزل عند تمكين العزل.
    - ترحيل الخدمة القديمة واكتشاف Gateway إضافي.
    - ترحيل حالة قناة Matrix القديمة (في وضع `--fix` / `--repair`).
    - فحوصات وقت تشغيل Gateway (الخدمة مثبتة لكنها لا تعمل؛ تسمية launchd مخزنة مؤقتًا).
    - تحذيرات حالة القنوات (مستكشفة من Gateway الجاري).
    - توجد فحوصات الأذونات الخاصة بالقنوات تحت `openclaw channels capabilities`؛ على سبيل المثال، تُراجع أذونات قناة Discord الصوتية باستخدام `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - فحوصات استجابة WhatsApp لتدهور سلامة حلقة أحداث Gateway مع استمرار عمل عملاء TUI المحليين؛ يوقف `--fix` فقط عملاء TUI المحليين المتحقق منهم.
    - إصلاح مسار Codex لمراجع نماذج `openai-codex/*` القديمة في النماذج الأساسية، والاحتياطيات، ونماذج إنشاء الصور/الفيديو، وتجاوزات Heartbeat/الوكيل الفرعي/Compaction، والخطافات، وتجاوزات نماذج القنوات، وتثبيتات مسارات الجلسات؛ يعيد `--fix` كتابتها إلى `openai/*`، ويرحّل ملفات/ترتيب مصادقة `openai-codex:*` إلى `openai:*`، ويزيل تثبيتات وقت تشغيل الجلسة/الوكيل الكامل القديمة، ويترك مراجع وكيل OpenAI القياسية على حزمة Codex الافتراضية.
    - تدقيق إعدادات المشرف (launchd/systemd/schtasks) مع إصلاح اختياري.
    - تنظيف بيئة الوكيل المضمنة لخدمات Gateway التي التقطت قيم shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` أثناء التثبيت أو التحديث.
    - فحوصات أفضل ممارسات وقت تشغيل Gateway (Node مقابل Bun، ومسارات مديري الإصدارات).
    - تشخيصات تعارض منفذ Gateway (الافتراضي `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - تحذيرات أمنية لسياسات الرسائل المباشرة المفتوحة.
    - فحوصات مصادقة Gateway لوضع الرمز المحلي (تعرض إنشاء رمز عند عدم وجود مصدر رمز؛ لا تستبدل إعدادات SecretRef للرموز).
    - اكتشاف مشكلات إقران الجهاز (طلبات الإقران الأولى المعلقة، وترقيات الدور/النطاق المعلقة، وانحراف ذاكرة التخزين المؤقتة المحلية القديمة لرمز الجهاز، وانحراف مصادقة سجل الإقران).

  </Accordion>
  <Accordion title="Workspace and shell">
    - فحص systemd linger على Linux.
    - فحص حجم ملف تمهيد مساحة العمل (تحذيرات الاقتطاع/القرب من الحد لملفات السياق).
    - فحص جاهزية Skills للوكيل الافتراضي؛ يبلّغ عن Skills المسموح بها ذات المتطلبات المفقودة من الثنائيات أو البيئة أو الإعدادات أو نظام التشغيل، ويمكن لـ `--fix` تعطيل Skills غير المتاحة في `skills.entries`.
    - فحص حالة إكمال shell والتثبيت/الترقية التلقائية.
    - فحص جاهزية موفر تضمين بحث الذاكرة (نموذج محلي، أو مفتاح API بعيد، أو ثنائي QMD).
    - فحوصات تثبيت المصدر (عدم تطابق مساحة عمل pnpm، أصول واجهة مفقودة، ثنائي tsx مفقود).
    - يكتب إعدادات محدثة + بيانات معالج التعريف.

  </Accordion>
</AccordionGroup>

## ملء Dreams UI الرجعي وإعادة تعيينها

يتضمن مشهد Dreams في Control UI إجراءات **الملء الرجعي** و**إعادة التعيين** و**مسح المثبّت** لسير عمل Dreaming المثبّت. تستخدم هذه الإجراءات طرق RPC بأسلوب doctor عبر Gateway، لكنها **ليست** جزءًا من إصلاح/ترحيل `openclaw doctor` عبر CLI.

ما تفعله:

- يفحص **الملء الرجعي** ملفات `memory/YYYY-MM-DD.md` التاريخية في مساحة العمل النشطة، ويشغّل مرور يوميات REM المثبّتة، ويكتب إدخالات ملء رجعي قابلة للعكس في `DREAMS.md`.
- تزيل **إعادة التعيين** فقط إدخالات يوميات الملء الرجعي المعلّمة تلك من `DREAMS.md`.
- يزيل **مسح المثبّت** فقط الإدخالات المرحلية قصيرة الأجل المثبّتة فقط التي جاءت من إعادة التشغيل التاريخية ولم تراكم بعد استدعاءً حيًا أو دعمًا يوميًا.

ما لا تفعله وحدها:

- لا تعدّل `MEMORY.md`
- لا تشغّل ترحيلات doctor الكاملة
- لا تدرج المرشحين المثبّتين تلقائيًا في مخزن الترقية قصيرة الأجل الحي إلا إذا شغّلت مسار CLI المرحلي صراحةً أولًا

إذا أردت أن تؤثر إعادة التشغيل التاريخية المثبّتة في مسار الترقية العميقة العادي، فاستخدم تدفق CLI بدلًا من ذلك:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

يُدرج ذلك المرشحين الدائمين المثبّتين في مخزن Dreaming قصير الأجل مع إبقاء `DREAMS.md` سطح المراجعة.

## السلوك التفصيلي والمبررات

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    إذا كان هذا checkout من git وكان doctor يعمل تفاعليًا، فإنه يعرض التحديث (fetch/rebase/build) قبل تشغيل doctor.
  </Accordion>
  <Accordion title="1. Config normalization">
    إذا كانت الإعدادات تحتوي على أشكال قيم قديمة (مثل `messages.ackReaction` دون تجاوز خاص بالقناة)، فإن doctor يطبّعها إلى المخطط الحالي.

    يشمل ذلك حقول Talk المسطحة القديمة. إعداد الكلام العام الحالي في Talk هو `talk.provider` + `talk.providers.<provider>`، وإعداد الصوت الفوري هو `talk.realtime.*`. يعيد doctor كتابة أشكال `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` القديمة إلى خريطة الموفر، ويعيد كتابة محددات الوقت الفوري القديمة ذات المستوى الأعلى (`talk.mode`، و`talk.transport`، و`talk.brain`، و`talk.model`، و`talk.voice`) إلى `talk.realtime`.

    تحذّر أداة الفحص أيضًا عندما تكون `plugins.allow` غير فارغة وتستخدم سياسة الأدوات
    إدخالات أدوات مملوكة لملحق أو حرف بدل. لا يطابق `tools.allow: ["*"]` إلا الأدوات
    من الملحقات التي تُحمّل فعليًا؛ ولا يتجاوز قائمة السماح الحصرية للملحقات.

  </Accordion>
  <Accordion title="2. ترحيلات مفاتيح التكوين القديمة">
    عندما يحتوي التكوين على مفاتيح مهملة، ترفض الأوامر الأخرى التشغيل وتطلب منك تشغيل `openclaw doctor`.

    ستقوم أداة الفحص بما يلي:

    - شرح مفاتيح التكوين القديمة التي عُثر عليها.
    - عرض الترحيل الذي طبقته.
    - إعادة كتابة `~/.openclaw/openclaw.json` بالمخطط المحدّث.

    يرفض بدء تشغيل Gateway تنسيقات التكوين القديمة ويطلب منك تشغيل `openclaw doctor --fix`؛ ولا يعيد كتابة `openclaw.json` عند بدء التشغيل. تُعالج ترحيلات مخزن مهام Cron أيضًا بواسطة `openclaw doctor --fix`.

    الترحيلات الحالية:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - إزالة `channels.webchat` و`gateway.webchat` المتقاعدين
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` على المستوى الأعلى
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` القديمة → `talk.provider` + `talk.providers.<provider>`
    - محددات Talk الفورية القديمة على المستوى الأعلى (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` و`messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` و`messages.tts.providers.microsoft`
    - حقول اختيار متحدث TTS (`voice`/`voiceName`/`voiceId`) → `speakerVoice`/`speakerVoiceId`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` و`plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` و`providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - بالنسبة إلى القنوات التي تحتوي على `accounts` مسماة مع بقاء قيم قناة على المستوى الأعلى لحساب واحد، انقل تلك القيم ذات نطاق الحساب إلى الحساب المُرقّى المختار لتلك القناة (`accounts.default` لمعظم القنوات؛ يمكن لـ Matrix الحفاظ على هدف مسمى/افتراضي مطابق موجود)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - إزالة `agents.defaults.llm`؛ استخدم `models.providers.<id>.timeoutSeconds` لمهلات المزوّد/النموذج البطيئة، وأبقِ مهلة الوكيل/التشغيل أعلى من تلك القيمة عندما يجب أن يستمر التشغيل كله مدة أطول
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - إزالة `browser.relayBindHost` (إعداد ترحيل الإضافة القديم)
    - `models.providers.*.api: "openai"` القديمة → `"openai-completions"` (يتخطى بدء تشغيل Gateway أيضًا المزوّدين الذين عُيّنت قيمة `api` لديهم إلى قيمة تعداد مستقبلية أو غير معروفة بدلًا من الفشل المغلق)
    - إزالة `plugins.entries.codex.config.codexDynamicToolsProfile`؛ يحافظ خادم تطبيق Codex دائمًا على أدوات مساحة العمل الأصلية لـ Codex كأدوات أصلية

    تشمل تحذيرات أداة الفحص أيضًا إرشادات الحساب الافتراضي للقنوات متعددة الحسابات:

    - إذا جرى تكوين إدخالين أو أكثر من `channels.<channel>.accounts` بدون `channels.<channel>.defaultAccount` أو `accounts.default`، تحذّر أداة الفحص من أن توجيه الاحتياط قد يختار حسابًا غير متوقع.
    - إذا عُيّن `channels.<channel>.defaultAccount` إلى معرّف حساب غير معروف، تحذّر أداة الفحص وتعرض معرّفات الحسابات المكوّنة.

  </Accordion>
  <Accordion title="2b. تجاوزات مزوّد OpenCode">
    إذا أضفت `models.providers.opencode` أو `opencode-zen` أو `opencode-go` يدويًا، فإنه يتجاوز كتالوج OpenCode المدمج من `openclaw/plugin-sdk/llm`. قد يفرض ذلك النماذج على API خاطئة أو يصفّر التكاليف. تحذّر أداة الفحص لكي تتمكن من إزالة التجاوز واستعادة توجيه API والتكاليف لكل نموذج.
  </Accordion>
  <Accordion title="2c. ترحيل المتصفح وجاهزية Chrome MCP">
    إذا كان تكوين المتصفح لديك لا يزال يشير إلى مسار إضافة Chrome التي أُزيلت، فإن أداة الفحص تطبّعه إلى نموذج إرفاق Chrome MCP المحلي على المضيف الحالي:

    - تصبح `browser.profiles.*.driver: "extension"` القيمة `"existing-session"`
    - تُزال `browser.relayBindHost`

    تدقق أداة الفحص أيضًا مسار Chrome MCP المحلي على المضيف عندما تستخدم `defaultProfile: "user"` أو ملف تعريف `existing-session` مكوّنًا:

    - تتحقق مما إذا كان Google Chrome مثبتًا على المضيف نفسه لملفات التعريف الافتراضية ذات الاتصال التلقائي
    - تتحقق من إصدار Chrome المكتشف وتحذّر عندما يكون أقل من Chrome 144
    - تذكّرك بتمكين التصحيح عن بُعد في صفحة فحص المتصفح (مثل `chrome://inspect/#remote-debugging` أو `brave://inspect/#remote-debugging` أو `edge://inspect/#remote-debugging`)

    لا تستطيع أداة الفحص تمكين الإعداد الخاص بـ Chrome نيابةً عنك. لا يزال Chrome MCP المحلي على المضيف يتطلب:

    - متصفحًا مستندًا إلى Chromium بإصدار 144+ على مضيف gateway/node
    - تشغيل المتصفح محليًا
    - تمكين التصحيح عن بُعد في ذلك المتصفح
    - الموافقة على مطالبة موافقة الإرفاق الأولى في المتصفح

    تتعلق الجاهزية هنا بمتطلبات الإرفاق المحلي فقط. يحافظ `existing-session` على حدود مسارات Chrome MCP الحالية؛ لا تزال المسارات المتقدمة مثل `responsebody`، وتصدير PDF، واعتراض التنزيلات، وإجراءات الدُفعات تتطلب متصفحًا مُدارًا أو ملف تعريف CDP خامًا.

    لا ينطبق هذا الفحص على Docker أو sandbox أو remote-browser أو تدفقات headless الأخرى. تستمر تلك في استخدام CDP الخام.

  </Accordion>
  <Accordion title="2d. متطلبات OAuth TLS الأساسية">
    عندما يكون ملف تعريف OpenAI Codex OAuth مكوّنًا، تفحص أداة الفحص نقطة نهاية تخويل OpenAI للتحقق من أن مكدس TLS المحلي لـ Node/OpenSSL يستطيع التحقق من سلسلة الشهادات. إذا فشل الفحص بخطأ شهادة (مثل `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`، أو شهادة منتهية الصلاحية، أو شهادة موقعة ذاتيًا)، تطبع أداة الفحص إرشادات إصلاح خاصة بالنظام الأساسي. على macOS مع Node من Homebrew، يكون الإصلاح عادةً `brew postinstall ca-certificates`. مع `--deep`، يعمل الفحص حتى إذا كان Gateway سليمًا.
  </Accordion>
  <Accordion title="2e. تجاوزات مزوّد Codex OAuth">
    إذا كنت قد أضفت سابقًا إعدادات نقل OpenAI القديمة ضمن `models.providers.openai-codex`، فقد تحجب مسار مزوّد Codex OAuth المدمج الذي تستخدمه الإصدارات الأحدث تلقائيًا. تحذّر أداة الفحص عندما ترى إعدادات النقل القديمة هذه بجانب Codex OAuth لكي تتمكن من إزالة تجاوز النقل القديم أو إعادة كتابته واستعادة سلوك التوجيه/الاحتياط المدمج. لا تزال الوكلاء المخصصون والتجاوزات الخاصة بالرؤوس فقط مدعومة ولا تؤدي إلى هذا التحذير.
  </Accordion>
  <Accordion title="2f. إصلاح مسار Codex">
    تتحقق أداة الفحص من مراجع النماذج القديمة `openai-codex/*`. يستخدم توجيه حزمة Codex الأصلية مراجع النماذج القانونية `openai/*`؛ تمر دورات وكيل OpenAI عبر حزمة خادم تطبيق Codex بدلًا من مسار مزوّد OpenAI في OpenClaw.

    في وضع `--fix` / `--repair`، تعيد أداة الفحص كتابة مراجع الوكيل الافتراضي والمراجع لكل وكيل المتأثرة، بما في ذلك النماذج الأساسية، والاحتياطات، ونماذج توليد الصور/الفيديو، وتجاوزات heartbeat/subagent/compaction، والخطافات، وتجاوزات نموذج القناة، وحالة مسار الجلسة المستمرة القديمة:

    - تصبح `openai-codex/gpt-*` القيمة `openai/gpt-*`.
    - ينتقل قصد Codex إلى إدخالات `agentRuntime.id: "codex"` ذات نطاق المزوّد/النموذج لمراجع نماذج الوكلاء المُصلحة.
    - تُزال إعدادات وقت تشغيل الوكيل كاملة القديمة ودبابيس وقت تشغيل الجلسة المستمرة لأن اختيار وقت التشغيل ذو نطاق مزوّد/نموذج.
    - تُحفظ سياسة وقت تشغيل المزوّد/النموذج الحالية ما لم يحتج مرجع النموذج القديم المُصلح إلى توجيه Codex للحفاظ على مسار المصادقة القديم.
    - تُحفظ قوائم احتياط النماذج الحالية مع إعادة كتابة إدخالاتها القديمة؛ وتنتقل إعدادات كل نموذج المنسوخة من المفتاح القديم إلى مفتاح `openai/*` القانوني.
    - تُصلح `modelProvider`/`providerOverride` و`model`/`modelOverride` للجلسات المستمرة، وإشعارات الاحتياط، ودبابيس ملف تعريف المصادقة عبر جميع مخازن جلسات الوكلاء المكتشفة.
    - تعني `/codex ...` "التحكم في محادثة Codex أصلية من الدردشة أو ربطها."
    - تعني `/acp ...` أو `runtime: "acp"` "استخدام محوّل ACP/acpx الخارجي."

  </Accordion>
  <Accordion title="2g. تنظيف مسار الجلسة">
    تفحص أداة الفحص أيضًا مخازن جلسات الوكلاء المكتشفة بحثًا عن حالة مسار قديمة أُنشئت تلقائيًا بعد نقل النماذج المكوّنة أو وقت التشغيل بعيدًا عن مسار مملوك لملحق مثل Codex.

    يمكن لـ `openclaw doctor --fix` مسح الحالة القديمة المنشأة تلقائيًا مثل دبابيس النموذج `modelOverrideSource: "auto"`، وبيانات تعريف نموذج وقت التشغيل، ومعرّفات الحزمة المثبتة، وارتباطات جلسة CLI، وتجاوزات ملف تعريف المصادقة التلقائية عندما لا يعود مسارها المالك مكوّنًا. تُبلّغ اختيارات نموذج الجلسة الصريحة الخاصة بالمستخدم أو القديمة للمراجعة اليدوية وتُترك كما هي؛ بدّلها باستخدام `/model ...` أو `/new` أو أعد ضبط الجلسة عندما لا يعود ذلك المسار مقصودًا.

  </Accordion>
  <Accordion title="3. ترحيلات الحالة القديمة (تخطيط القرص)">
    تستطيع أداة الفحص ترحيل التخطيطات القديمة على القرص إلى البنية الحالية:

    - مخزن الجلسات + النصوص:
      - من `~/.openclaw/sessions/` إلى `~/.openclaw/agents/<agentId>/sessions/`
    - دليل الوكيل:
      - من `~/.openclaw/agent/` إلى `~/.openclaw/agents/<agentId>/agent/`
    - حالة مصادقة WhatsApp (Baileys):
      - من `~/.openclaw/credentials/*.json` القديمة (باستثناء `oauth.json`)
      - إلى `~/.openclaw/credentials/whatsapp/<accountId>/...` (معرّف الحساب الافتراضي: `default`)

    هذه الترحيلات تُنفّذ بأفضل جهد وهي قابلة للتكرار دون تغيير إضافي؛ ستصدر أداة الفحص تحذيرات عندما تترك أي مجلدات قديمة كنسخ احتياطية. يرحّل Gateway/CLI أيضًا الجلسات القديمة + دليل الوكيل تلقائيًا عند بدء التشغيل لكي يصل السجل/المصادقة/النماذج إلى المسار الخاص بكل وكيل بدون تشغيل أداة الفحص يدويًا. تقصد OpenClaw ترحيل مصادقة WhatsApp عبر `openclaw doctor` فقط. تقارن تسوية مزوّد Talk/خريطة المزوّدين الآن بالمساواة البنيوية، لذلك لم تعد الاختلافات في ترتيب المفاتيح فقط تؤدي إلى تكرار تغييرات `doctor --fix` عديمة الأثر.

  </Accordion>
  <Accordion title="3أ. ترحيلات بيانات تعريف Plugin القديمة">
    يفحص Doctor جميع بيانات تعريف Plugin المثبتة بحثا عن مفاتيح قدرات علوية مهملة (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). عند العثور عليها، يعرض نقلها إلى كائن `contracts` وإعادة كتابة ملف بيانات التعريف في موضعه. هذا الترحيل قابل للتكرار بأمان؛ إذا كان مفتاح `contracts` يحتوي بالفعل على القيم نفسها، يزال المفتاح القديم من دون تكرار البيانات.
  </Accordion>
  <Accordion title="3ب. ترحيلات مخزن Cron القديم">
    يتحقق Doctor أيضا من مخزن مهام Cron (`~/.openclaw/cron/jobs.json` افتراضيا، أو `cron.store` عند تجاوزه) بحثا عن أشكال المهام القديمة التي لا يزال المجدول يقبلها للتوافق.

    تشمل تنظيفات Cron الحالية:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - حقول الحمولة العلوية (`message`, `model`, `thinking`, ...) → `payload`
    - حقول التسليم العلوية (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - الأسماء البديلة لتسليم `provider` في الحمولة → `delivery.channel` صريح
    - مهام Webhook الاحتياطية القديمة `notify: true` → تسليم Webhook صريح من `cron.webhook` عند ضبطه؛ تحتفظ مهام الإعلان بتسليم الدردشة وتحصل على `delivery.completionDestination`. عند عدم ضبط `cron.webhook`، تزال علامة `notify` العلوية غير الفعالة للمهام التي بلا هدف (مع الحفاظ على التسليم الحالي، بما في ذلك الإعلان) لأن تسليم وقت التشغيل لا يقرأها أبدا

    ينظف Gateway أيضا صفوف Cron المشوهة عند وقت التحميل حتى تستمر المهام الصالحة في العمل. تنسخ الصفوف الخام المشوهة إلى `jobs-quarantine.json` بجانب المخزن النشط قبل إزالتها من `jobs.json`؛ يبلغ Doctor عن الصفوف المعزولة حتى تتمكن من مراجعتها أو إصلاحها يدويا.

    يطبع بدء تشغيل Gateway إسقاط وقت التشغيل ويتجاهل علامة `notify` العلوية، لكنه يترك إعداد Cron المستمر لإصلاح Doctor. عند عدم ضبط `cron.webhook`، يزيل Doctor العلامة غير الفعالة للمهام التي لا تملك هدف ترحيل (`delivery.mode` بلا قيمة/غائب، أو هدف Webhook غير قابل للاستخدام، أو تسليم إعلان/دردشة موجود)، تاركا التسليم الحالي دون تغيير، بحيث لا تعيد عمليات `doctor --fix` المتكررة التحذير من المهمة نفسها. إذا كان `cron.webhook` مضبوطا لكنه ليس عنوان URL صالحا من نوع HTTP(S)، يبقى Doctor محذرا ويترك العلامة حتى تتمكن من إصلاح عنوان URL.

    على Linux، يحذر Doctor أيضا عندما لا يزال crontab الخاص بالمستخدم يستدعي `~/.openclaw/bin/ensure-whatsapp.sh` القديم. هذا السكربت المحلي للمضيف لا يصان بواسطة OpenClaw الحالي ويمكنه كتابة رسائل `Gateway inactive` زائفة إلى `~/.openclaw/logs/whatsapp-health.log` عندما يتعذر على Cron الوصول إلى ناقل مستخدم systemd. أزل إدخال crontab القديم باستخدام `crontab -e`؛ استخدم `openclaw channels status --probe` و`openclaw doctor` و`openclaw gateway status` لفحوصات الصحة الحالية.

  </Accordion>
  <Accordion title="3ج. تنظيف أقفال الجلسات">
    يفحص Doctor كل دليل جلسة وكيل بحثا عن ملفات قفل كتابة قديمة — وهي ملفات تبقى عند خروج جلسة بشكل غير طبيعي. لكل ملف قفل يعثر عليه، يبلغ عن: المسار، وPID، وما إذا كان PID لا يزال حيا، وعمر القفل، وما إذا كان يعد قديما (PID ميت، أو بيانات مالك وصفية مشوهة، أو أقدم من 30 دقيقة، أو PID حي يمكن إثبات أنه ينتمي إلى عملية غير OpenClaw). في وضع `--fix` / `--repair` يزيل تلقائيا الأقفال ذات المالكين الميتين، أو اليتامى، أو المعاد تدويرهم، أو المشوهين والقدامى، أو غير التابعين لـ OpenClaw. يبلغ عن الأقفال القديمة التي لا تزال مملوكة لعملية OpenClaw حية لكنه يتركها في مكانها حتى لا يقطع Doctor كاتب سجل محادثة نشطا.
  </Accordion>
  <Accordion title="3د. إصلاح فرع سجل محادثة الجلسة">
    يفحص Doctor ملفات JSONL لجلسات الوكلاء بحثا عن شكل الفرع المكرر الذي أنشأه خطأ إعادة كتابة سجل محادثة المطالبة في 2026.4.24: دور مستخدم مهجور مع سياق وقت تشغيل داخلي لـ OpenClaw إضافة إلى شقيق نشط يحتوي على مطالبة المستخدم المرئية نفسها. في وضع `--fix` / `--repair`، ينسخ Doctor كل ملف متأثر احتياطيا بجانب الأصل ويعيد كتابة سجل المحادثة إلى الفرع النشط حتى لا يرى قراء سجل Gateway والذاكرة أدوارا مكررة بعد الآن.
  </Accordion>
  <Accordion title="4. فحوصات سلامة الحالة (استمرارية الجلسات، والتوجيه، والسلامة)">
    دليل الحالة هو جذع الدماغ التشغيلي. إذا اختفى، فستفقد الجلسات وبيانات الاعتماد والسجلات والإعدادات (ما لم تكن لديك نسخ احتياطية في مكان آخر).

    يتحقق Doctor مما يلي:

    - **دليل الحالة مفقود**: يحذر من فقدان كارثي للحالة، ويطلب إعادة إنشاء الدليل، ويذكرك بأنه لا يمكنه استرداد البيانات المفقودة.
    - **أذونات دليل الحالة**: يتحقق من قابلية الكتابة؛ يعرض إصلاح الأذونات (ويصدر تلميح `chown` عند اكتشاف عدم تطابق المالك/المجموعة).
    - **دليل حالة متزامن سحابيا على macOS**: يحذر عندما يتحلل مسار الحالة تحت iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) أو `~/Library/CloudStorage/...` لأن المسارات المدعومة بالمزامنة قد تسبب إدخالا/إخراجا أبطأ وسباقات قفل/مزامنة.
    - **دليل حالة Linux على SD أو eMMC**: يحذر عندما تتحلل الحالة إلى مصدر تركيب `mmcblk*`، لأن الإدخال/الإخراج العشوائي المدعوم بـ SD أو eMMC قد يكون أبطأ ويتآكل أسرع تحت كتابات الجلسات وبيانات الاعتماد.
    - **دليل حالة Linux متطاير**: يحذر عندما تتحلل الحالة إلى `tmpfs` أو `ramfs`، لأن الجلسات وبيانات الاعتماد والإعدادات وحالة SQLite مع ملفات WAL/دفتر اليومية الجانبية ستختفي عند إعادة التشغيل. لا توسم تركيبات Docker `overlay` عمدا لأن طبقاتها القابلة للكتابة تبقى عبر إعادة تشغيل المضيف ما دام الحاوي باقيا.
    - **أدلة الجلسات مفقودة**: `sessions/` ودليل مخزن الجلسات مطلوبان لاستمرار السجل وتجنب أعطال `ENOENT`.
    - **عدم تطابق سجل المحادثة**: يحذر عندما تكون إدخالات الجلسات الحديثة لديها ملفات سجل محادثة مفقودة.
    - **جلسة رئيسية "JSONL بسطر واحد"**: يوسم عندما يحتوي سجل المحادثة الرئيسي على سطر واحد فقط (السجل لا يتراكم).
    - **أدلة حالة متعددة**: يحذر عندما توجد مجلدات `~/.openclaw` متعددة عبر أدلة المنزل أو عندما يشير `OPENCLAW_STATE_DIR` إلى مكان آخر (يمكن أن ينقسم السجل بين التثبيتات).
    - **تذكير الوضع البعيد**: إذا كان `gateway.mode=remote`، يذكرك Doctor بتشغيله على المضيف البعيد (الحالة تعيش هناك).
    - **أذونات ملف الإعدادات**: يحذر إذا كان `~/.openclaw/openclaw.json` قابلا للقراءة من المجموعة/العالم ويعرض تشديده إلى `600`.

  </Accordion>
  <Accordion title="5. صحة مصادقة النموذج (انتهاء OAuth)">
    يفحص Doctor ملفات تعريف OAuth في مخزن المصادقة، ويحذر عندما تكون الرموز على وشك الانتهاء/منتهية، ويمكنه تحديثها عندما يكون ذلك آمنا. إذا كان ملف تعريف Anthropic OAuth/الرمز قديما، يقترح مفتاح Anthropic API أو مسار Anthropic setup-token. تظهر مطالبات التحديث فقط عند التشغيل تفاعليا (TTY)؛ يتجاوز `--non-interactive` محاولات التحديث.

    عندما يفشل تحديث OAuth بشكل دائم (مثل `refresh_token_reused`، أو `invalid_grant`، أو عندما يطلب منك المزود تسجيل الدخول مجددا)، يبلغ Doctor بأن إعادة المصادقة مطلوبة ويطبع أمر `openclaw models auth login --provider ...` الدقيق لتشغيله.

    يبلغ Doctor أيضا عن ملفات تعريف المصادقة غير القابلة للاستخدام مؤقتا بسبب:

    - فترات تهدئة قصيرة (حدود معدل/مهلات/فشل مصادقة)
    - تعطيلات أطول (فشل فوترة/رصيد)

    يتم إصلاح ملفات تعريف Codex OAuth القديمة التي تعيش رموزها في macOS Keychain (إعداد أولي أقدم قبل مخطط الملفات الجانبية المستند إلى الملفات) بواسطة Doctor فقط. شغل `openclaw doctor --fix` مرة واحدة من طرفية تفاعلية لترحيل الرموز القديمة المدعومة بـ Keychain موضعيا إلى `auth-profiles.json`؛ بعد ذلك، تحل الأدوار المضمنة (Telegram، وCron، وإرسال الوكيل الفرعي) هذه الرموز كملفات تعريف OpenAI OAuth قانونية.

  </Accordion>
  <Accordion title="6. تحقق نموذج الخطافات">
    إذا كان `hooks.gmail.model` مضبوطا، يتحقق Doctor من مرجع النموذج مقابل الفهرس وقائمة السماح ويحذر عندما لا يمكن حله أو يكون غير مسموح به.
  </Accordion>
  <Accordion title="7. إصلاح صورة وضع الحماية">
    عند تمكين وضع الحماية، يتحقق Doctor من صور Docker ويعرض بناءها أو التبديل إلى الأسماء القديمة إذا كانت الصورة الحالية مفقودة.
  </Accordion>
  <Accordion title="7ب. تنظيف تثبيت Plugin">
    يزيل Doctor حالة تجهيز تبعيات Plugin القديمة المولدة بواسطة OpenClaw في وضع `openclaw doctor --fix` / `openclaw doctor --repair`. يغطي هذا جذور التبعيات المولدة القديمة، وأدلة مرحلة التثبيت القديمة، وبقايا الحزم المحلية من كود إصلاح تبعيات Plugin المضمنة سابقا، والنسخ المدارة من npm اليتيمة أو المستعادة لملحقات `@openclaw/*` المضمنة التي يمكن أن تحجب بيانات التعريف المضمنة الحالية. يعيد Doctor أيضا ربط حزمة `openclaw` المضيفة داخل Plugins npm المدارة التي تعلن `peerDependencies.openclaw`، حتى تستمر استيرادات وقت التشغيل المحلية للحزمة مثل `openclaw/plugin-sdk/*` في الحل بعد التحديثات أو إصلاحات npm.

    يمكن لـ Doctor أيضا إعادة تثبيت Plugins القابلة للتنزيل المفقودة عندما تشير الإعدادات إليها لكن سجل Plugins المحلي لا يستطيع العثور عليها. تشمل الأمثلة `plugins.entries` المادية، وإعدادات القنوات/المزودين/البحث المضبوطة، وأوقات تشغيل الوكلاء المضبوطة. أثناء تحديثات الحزم، يتجنب Doctor تشغيل إصلاح Plugin بمدير الحزم أثناء تبديل الحزمة الأساسية؛ شغل `openclaw doctor --fix` مجددا بعد التحديث إذا كان Plugin مضبوط لا يزال يحتاج إلى استرداد. لا يشغل بدء تشغيل Gateway وإعادة تحميل الإعدادات مديري حزم؛ تبقى عمليات تثبيت Plugins عملا صريحا عبر Doctor/التثبيت/التحديث.

  </Accordion>
  <Accordion title="8. ترحيلات خدمة Gateway وتلميحات التنظيف">
    يكتشف Doctor خدمات Gateway القديمة (launchd/systemd/schtasks) ويعرض إزالتها وتثبيت خدمة OpenClaw باستخدام منفذ Gateway الحالي. يمكنه أيضا فحص خدمات إضافية شبيهة بـ Gateway وطباعة تلميحات تنظيف. تعد خدمات OpenClaw Gateway المسماة حسب ملف التعريف خدمات من الدرجة الأولى ولا توسم بأنها "إضافية."

    على Linux، إذا كانت خدمة Gateway على مستوى المستخدم مفقودة لكن توجد خدمة OpenClaw Gateway على مستوى النظام، لا يثبت Doctor خدمة ثانية على مستوى المستخدم تلقائيا. افحص باستخدام `openclaw gateway status --deep` أو `openclaw doctor --deep`، ثم أزل المكرر أو اضبط `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يكون مشرف نظام مالكا لدورة حياة Gateway.

  </Accordion>
  <Accordion title="8ب. ترحيل Matrix عند بدء التشغيل">
    عندما يكون لحساب قناة Matrix ترحيل حالة قديم معلق أو قابل للتنفيذ، ينشئ Doctor (في وضع `--fix` / `--repair`) لقطة ما قبل الترحيل ثم يشغل خطوات الترحيل بأفضل جهد: ترحيل حالة Matrix القديمة وتحضير الحالة المشفرة القديمة. كلتا الخطوتين غير قاتلتين؛ تسجل الأخطاء ويستمر بدء التشغيل. في وضع القراءة فقط (`openclaw doctor` من دون `--fix`) يتم تجاوز هذا الفحص بالكامل.
  </Accordion>
  <Accordion title="8ج. اقتران الأجهزة وانحراف المصادقة">
    يفحص Doctor الآن حالة اقتران الأجهزة كجزء من تمريرة الصحة العادية.

    ما يبلغ عنه:

    - طلبات اقتران أول مرة معلقة
    - ترقيات أدوار معلقة للأجهزة المقترنة بالفعل
    - ترقيات نطاق معلقة للأجهزة المقترنة بالفعل
    - إصلاحات عدم تطابق المفتاح العام عندما لا يزال معرف الجهاز مطابقا لكن هوية الجهاز لم تعد تطابق السجل الموافق عليه
    - سجلات مقترنة ينقصها رمز نشط لدور موافق عليه
    - رموز مقترنة تنحرف نطاقاتها خارج خط أساس الاقتران الموافق عليه
    - إدخالات رموز أجهزة مخزنة مؤقتا محليا للجهاز الحالي تسبق تدوير رمز من جهة Gateway أو تحمل بيانات وصفية قديمة للنطاق

    لا يوافق Doctor تلقائيا على طلبات الاقتران ولا يدور رموز الأجهزة تلقائيا. بل يطبع الخطوات التالية الدقيقة:

    - افحص الطلبات المعلقة باستخدام `openclaw devices list`
    - وافق على الطلب الدقيق باستخدام `openclaw devices approve <requestId>`
    - دور رمزا جديدا باستخدام `openclaw devices rotate --device <deviceId> --role <role>`
    - أزل سجلا قديما وأعد الموافقة عليه باستخدام `openclaw devices remove <deviceId>`

    هذا يغلق الفجوة الشائعة: "مقترن بالفعل لكن ما زال يظهر أن الاقتران مطلوب": يميز doctor الآن بين الاقتران لأول مرة، وترقيات الدور/النطاق المعلّقة، وانحراف الرمز القديم/هوية الجهاز.

  </Accordion>
  <Accordion title="9. تحذيرات الأمان">
    يصدر doctor تحذيرات عندما يكون أحد المزوّدين مفتوحًا للرسائل الخاصة من دون قائمة سماح، أو عندما تكون سياسة مهيأة بطريقة خطرة.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    إذا كان التشغيل يتم كخدمة مستخدم في systemd، يتأكد doctor من تفعيل lingering حتى يبقى Gateway قيد التشغيل بعد تسجيل الخروج.
  </Accordion>
  <Accordion title="11. حالة مساحة العمل (Skills وPlugins وTaskFlows)">
    يطبع doctor ملخصًا لحالة مساحة العمل للوكيل الافتراضي:

    - **حالة Skills**: يحصي Skills المؤهلة، وناقصة المتطلبات، والمحظورة بقائمة السماح.
    - **حالة Plugin**: يحصي Plugins المفعّلة/المعطّلة/التي حدثت بها أخطاء؛ ويسرد معرّفات Plugin لأي أخطاء؛ ويبلّغ عن قدرات Plugin الحزمة.
    - **تحذيرات توافق Plugin**: يعلّم Plugins التي لديها مشكلات توافق مع وقت التشغيل الحالي.
    - **تشخيصات Plugin**: يعرض أي تحذيرات أو أخطاء وقت التحميل صادرة عن سجلّ Plugin.
    - **استرداد TaskFlow**: يعرض TaskFlows المُدارة المريبة التي تحتاج إلى فحص يدوي أو إلغاء.

  </Accordion>
  <Accordion title="11b. حجم ملف التمهيد">
    يفحص doctor ما إذا كانت ملفات تمهيد مساحة العمل (مثل `AGENTS.md` أو `CLAUDE.md` أو ملفات سياق أخرى مُحقنة) قريبة من ميزانية الأحرف المهيأة أو تتجاوزها. يبلّغ لكل ملف عن عدد الأحرف الخام مقابل المُحقنة، ونسبة الاقتطاع، وسبب الاقتطاع (`max/file` أو `max/total`)، وإجمالي الأحرف المُحقنة كنسبة من الميزانية الكلية. عندما تكون الملفات مقتطعة أو قريبة من الحد، يطبع doctor تلميحات لضبط `agents.defaults.bootstrapMaxChars` و`agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. تنظيف Plugin القناة القديمة">
    عندما يزيل `openclaw doctor --fix` Plugin قناة مفقودة، فإنه يزيل أيضًا إعدادات القناة العالقة التي كانت تشير إلى ذلك Plugin: إدخالات `channels.<id>`، وأهداف Heartbeat التي سمّت القناة، وتجاوزات `agents.*.models["<channel>/*"]`. يمنع ذلك حلقات إقلاع Gateway حيث يكون وقت تشغيل القناة قد اختفى لكن الإعدادات ما زالت تطلب من Gateway الارتباط به.
  </Accordion>
  <Accordion title="11c. إكمال الصدفة">
    يفحص doctor ما إذا كان إكمال الجدولة مثبتًا للصدفة الحالية (zsh أو bash أو fish أو PowerShell):

    - إذا كان ملف تعريف الصدفة يستخدم نمط إكمال ديناميكيًا بطيئًا (`source <(openclaw completion ...)`)، يرقّيه doctor إلى متغير الملف المخبأ الأسرع.
    - إذا كان الإكمال مهيأ في ملف التعريف لكن ملف الذاكرة المخبأة مفقود، يعيد doctor توليد الذاكرة المخبأة تلقائيًا.
    - إذا لم يكن أي إكمال مهيأ على الإطلاق، يطلب doctor تثبيته (الوضع التفاعلي فقط؛ يُتخطى مع `--non-interactive`).

    شغّل `openclaw completion --write-state` لإعادة توليد الذاكرة المخبأة يدويًا.

  </Accordion>
  <Accordion title="12. فحوصات مصادقة Gateway (الرمز المحلي)">
    يفحص doctor جاهزية مصادقة رمز Gateway المحلي.

    - إذا كان وضع الرمز يحتاج إلى رمز ولا يوجد مصدر رمز، يعرض doctor توليد واحد.
    - إذا كان `gateway.auth.token` مُدارًا عبر SecretRef لكنه غير متاح، يحذّر doctor ولا يستبدله بنص صريح.
    - يفرض `openclaw doctor --generate-gateway-token` التوليد فقط عندما لا يكون أي SecretRef رمز مهيأ.

  </Accordion>
  <Accordion title="12b. إصلاحات مدركة لـ SecretRef للقراءة فقط">
    تحتاج بعض مسارات الإصلاح إلى فحص بيانات الاعتماد المهيأة من دون إضعاف سلوك الفشل السريع في وقت التشغيل.

    - يستخدم `openclaw doctor --fix` الآن نموذج ملخص SecretRef للقراءة فقط نفسه الذي تستخدمه أوامر عائلة الحالة لإصلاحات الإعدادات الموجّهة.
    - مثال: يحاول إصلاح Telegram `allowFrom` / `groupAllowFrom` `@username` استخدام بيانات اعتماد البوت المهيأة عند توفرها.
    - إذا كان رمز بوت Telegram مهيأ عبر SecretRef لكنه غير متاح في مسار الأمر الحالي، يبلّغ doctor أن بيانات الاعتماد مهيأة لكنها غير متاحة ويتخطى الحل التلقائي بدلًا من التعطل أو الإبلاغ خطأً عن أن الرمز مفقود.

  </Accordion>
  <Accordion title="13. فحص صحة Gateway + إعادة التشغيل">
    يشغّل doctor فحص صحة ويعرض إعادة تشغيل Gateway عندما يبدو غير سليم.
  </Accordion>
  <Accordion title="13b. جاهزية بحث الذاكرة">
    يفحص doctor ما إذا كان مزوّد تضمين بحث الذاكرة المهيأ جاهزًا للوكيل الافتراضي. يعتمد السلوك على الخلفية والمزوّد المهيأين:

    - **خلفية QMD**: يتحقق مما إذا كان الملف التنفيذي `qmd` متاحًا وقابلًا للبدء. إن لم يكن كذلك، يطبع إرشادات إصلاح تشمل حزمة npm وخيار مسار يدوي للملف التنفيذي.
    - **مزوّد محلي صريح**: يفحص وجود ملف نموذج محلي أو عنوان URL معروف لنموذج بعيد/قابل للتنزيل. إذا كان مفقودًا، يقترح الانتقال إلى مزوّد بعيد.
    - **مزوّد بعيد صريح** (`openai` و`voyage` وما إلى ذلك): يتحقق من وجود مفتاح API في البيئة أو مخزن المصادقة. يطبع تلميحات إصلاح قابلة للتنفيذ إذا كان مفقودًا.
    - **مزوّد تلقائي قديم**: يعامل `memorySearch.provider: "auto"` على أنه OpenAI، ويفحص جاهزية OpenAI، ويعيد `doctor --fix` كتابته إلى `provider: "openai"`.

    عندما تكون نتيجة مسبار Gateway مخبأة متاحة (كان Gateway سليمًا وقت الفحص)، يقارن doctor نتيجتها بالإعدادات المرئية من CLI ويشير إلى أي اختلاف. لا يبدأ doctor اختبار تضمين جديدًا في المسار الافتراضي؛ استخدم أمر حالة الذاكرة العميق عندما تريد فحص مزوّد حيًا.

    استخدم `openclaw memory status --deep` للتحقق من جاهزية التضمين في وقت التشغيل.

  </Accordion>
  <Accordion title="14. تحذيرات حالة القناة">
    إذا كان Gateway سليمًا، يشغّل doctor مسبار حالة قناة ويبلّغ عن التحذيرات مع إصلاحات مقترحة.
  </Accordion>
  <Accordion title="15. تدقيق إعدادات المشرف + الإصلاح">
    يفحص doctor إعدادات المشرف المثبتة (launchd/systemd/schtasks) بحثًا عن افتراضيات مفقودة أو قديمة (مثل تبعيات systemd network-online وتأخير إعادة التشغيل). عندما يجد عدم تطابق، يوصي بتحديث ويمكنه إعادة كتابة ملف الخدمة/المهمة إلى الافتراضيات الحالية.

    ملاحظات:

    - يطلب `openclaw doctor` التأكيد قبل إعادة كتابة إعدادات المشرف.
    - يقبل `openclaw doctor --yes` مطالبات الإصلاح الافتراضية.
    - يطبّق `openclaw doctor --fix` الإصلاحات الموصى بها من دون مطالبات (`--repair` اسم مستعار).
    - يكتب `openclaw doctor --fix --force` فوق إعدادات المشرف المخصصة.
    - يجعل `OPENCLAW_SERVICE_REPAIR_POLICY=external` doctor للقراءة فقط بالنسبة إلى دورة حياة خدمة Gateway. ما زال يبلّغ عن صحة الخدمة ويشغّل إصلاحات غير خدمية، لكنه يتخطى تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة، وإعادة كتابة إعدادات المشرف، وتنظيف الخدمات القديمة لأن مشرفًا خارجيًا يملك تلك الدورة.
    - على Linux، لا يعيد doctor كتابة بيانات تعريف الأمر/نقطة الدخول أثناء نشاط وحدة Gateway المطابقة في systemd. كما يتجاهل وحدات Gateway-like الإضافية غير القديمة وغير النشطة أثناء فحص الخدمات المكررة حتى لا تنشئ ملفات الخدمات المرافقة ضجيج تنظيف.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان `gateway.auth.token` مُدارًا عبر SecretRef، يتحقق تثبيت/إصلاح خدمة doctor من SecretRef لكنه لا يحفظ قيم الرمز النصية الصريحة المحلولة في بيانات تعريف بيئة خدمة المشرف.
    - يكتشف doctor قيم بيئة الخدمة المُدارة المدعومة بـ `.env`/SecretRef التي ضمّنتها تثبيتات LaunchAgent أو systemd أو Windows Scheduled Task القديمة بشكل مباشر، ويعيد كتابة بيانات تعريف الخدمة بحيث تُحمّل تلك القيم من مصدر وقت التشغيل بدلًا من تعريف المشرف.
    - يكتشف doctor عندما لا يزال أمر الخدمة يثبّت `--port` قديمًا بعد تغيّر `gateway.port` ويعيد كتابة بيانات تعريف الخدمة إلى المنفذ الحالي.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef الرمز المهيأ غير محلول، يحظر doctor مسار التثبيت/الإصلاح مع إرشادات قابلة للتنفيذ.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مهيأين وكان `gateway.auth.mode` غير مضبوط، يحظر doctor التثبيت/الإصلاح حتى يُضبط الوضع صراحةً.
    - بالنسبة إلى وحدات Linux user-systemd، تشمل فحوصات انحراف رمز doctor الآن مصدري `Environment=` و`EnvironmentFile=` عند مقارنة بيانات تعريف مصادقة الخدمة.
    - ترفض إصلاحات خدمة doctor إعادة كتابة خدمة Gateway أو إيقافها أو إعادة تشغيلها من ملف OpenClaw تنفيذي أقدم عندما تكون الإعدادات قد كُتبت آخر مرة بواسطة إصدار أحدث. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - يمكنك دائمًا فرض إعادة كتابة كاملة عبر `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. تشخيصات وقت تشغيل Gateway والمنفذ">
    يفحص doctor وقت تشغيل الخدمة (PID، وآخر حالة خروج) ويحذّر عندما تكون الخدمة مثبتة لكنها لا تعمل فعليًا. كما يفحص تعارضات المنافذ على منفذ Gateway (الافتراضي `18789`) ويبلّغ عن الأسباب المرجحة (Gateway يعمل بالفعل، نفق SSH).
  </Accordion>
  <Accordion title="17. أفضل ممارسات وقت تشغيل Gateway">
    يحذّر doctor عندما تعمل خدمة Gateway على Bun أو مسار Node مُدار بالإصدارات (`nvm` أو `fnm` أو `volta` أو `asdf` وما إلى ذلك). تتطلب قنوات WhatsApp + Telegram Node، ويمكن أن تنكسر مسارات مدير الإصدارات بعد الترقيات لأن الخدمة لا تحمّل تهيئة الصدفة الخاصة بك. يعرض doctor الترحيل إلى تثبيت Node نظامي عندما يكون متاحًا (Homebrew/apt/choco).

    تستخدم LaunchAgents المثبتة أو المُصلحة حديثًا على macOS مسار PATH نظاميًا قياسيًا (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) بدلًا من نسخ PATH الصدفة التفاعلية، بحيث تبقى الملفات التنفيذية النظامية المُدارة بواسطة Homebrew متاحة بينما لا تغيّر أدلة Volta وasdf وfnm وpnpm ومديري الإصدارات الآخرين أي Node تحلّه العمليات الفرعية. ما زالت خدمات Linux تحتفظ بجذور بيئة صريحة (`NVM_DIR` و`FNM_DIR` و`VOLTA_HOME` و`ASDF_DATA_DIR` و`BUN_INSTALL` و`PNPM_HOME`) وأدلة user-bin مستقرة، لكن أدلة احتياطية مخمّنة لمدير الإصدارات لا تُكتب إلى PATH الخدمة إلا عندما تكون تلك الأدلة موجودة على القرص.

  </Accordion>
  <Accordion title="18. كتابة الإعدادات + بيانات معالج الإعداد التعريفية">
    يحفظ doctor أي تغييرات في الإعدادات ويختم بيانات معالج الإعداد التعريفية لتسجيل تشغيل doctor.
  </Accordion>
  <Accordion title="19. تلميحات مساحة العمل (النسخ الاحتياطي + نظام الذاكرة)">
    يقترح doctor نظام ذاكرة لمساحة العمل عند فقدانه ويطبع تلميح نسخ احتياطي إذا لم تكن مساحة العمل موجودة بالفعل ضمن git.

    راجع [/concepts/agent-workspace](/ar/concepts/agent-workspace) للحصول على دليل كامل لبنية مساحة العمل والنسخ الاحتياطي عبر git (يوصى بـ GitHub أو GitLab خاص).

  </Accordion>
</AccordionGroup>

## ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
