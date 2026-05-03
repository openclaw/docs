---
read_when:
    - إضافة عمليات ترحيل doctor أو تعديلها
    - إدخال تغييرات كاسرة في الإعدادات
sidebarTitle: Doctor
summary: 'أمر doctor: فحوصات الصحة، وترحيلات الإعدادات، وخطوات الإصلاح'
title: الفحص التشخيصي
x-i18n:
    generated_at: "2026-05-03T21:33:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20b2cb3c3cd88e01050cb285a08a020603642439bd35668b7414360801fc03ff
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` هو أداة الإصلاح والترحيل في OpenClaw. تصلح الإعدادات/الحالة القديمة، وتتحقق من الصحة، وتوفر خطوات إصلاح قابلة للتنفيذ.

## البدء السريع

```bash
openclaw doctor
```

### أوضاع التشغيل بلا واجهة والأتمتة

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    يقبل الإعدادات الافتراضية دون مطالبة (بما في ذلك خطوات إصلاح إعادة التشغيل/الخدمة/العزل عند انطباقها).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    يطبق الإصلاحات الموصى بها دون مطالبة (الإصلاحات + عمليات إعادة التشغيل حيث يكون ذلك آمنا).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    يطبق الإصلاحات القوية أيضا (يستبدل إعدادات المشرف المخصصة).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    يعمل دون مطالبات ويطبق فقط عمليات الترحيل الآمنة (تطبيع الإعدادات + نقل الحالة على القرص). يتخطى إجراءات إعادة التشغيل/الخدمة/العزل التي تتطلب تأكيدا بشريا. تعمل عمليات ترحيل الحالة القديمة تلقائيا عند اكتشافها.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    يفحص خدمات النظام بحثا عن تثبيتات Gateway إضافية (launchd/systemd/schtasks).

  </Tab>
</Tabs>

إذا أردت مراجعة التغييرات قبل الكتابة، فافتح ملف الإعدادات أولا:

```bash
cat ~/.openclaw/openclaw.json
```

## ما الذي يفعله (ملخص)

<AccordionGroup>
  <Accordion title="الصحة، وواجهة المستخدم، والتحديثات">
    - تحديث اختياري قبل التشغيل لتثبيتات git (تفاعلي فقط).
    - فحص حداثة بروتوكول واجهة المستخدم (يعيد بناء Control UI عندما يكون مخطط البروتوكول أحدث).
    - فحص الصحة + مطالبة إعادة التشغيل.
    - ملخص حالة Skills (مؤهل/مفقود/محظور) وحالة Plugin.

  </Accordion>
  <Accordion title="الإعدادات والترحيلات">
    - تطبيع الإعدادات للقيم القديمة.
    - ترحيل إعدادات Talk من حقول `talk.*` المسطحة القديمة إلى `talk.provider` + `talk.providers.<provider>`.
    - فحوصات ترحيل المتصفح لإعدادات إضافة Chrome القديمة وجاهزية Chrome MCP.
    - تحذيرات تجاوز مزود OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - تحذيرات حجب OAuth في Codex (`models.providers.openai-codex`).
    - فحص متطلبات OAuth TLS الأساسية لملفات OpenAI Codex OAuth الشخصية.
    - تحذيرات قائمة السماح للـ Plugin/الأداة عندما تكون `plugins.allow` مقيدة بينما لا تزال سياسة الأدوات تطلب wildcard أو أدوات مملوكة للـ Plugin.
    - ترحيل الحالة القديمة على القرص (الجلسات/مجلد الوكيل/مصادقة WhatsApp).
    - ترحيل مفتاح عقد بيان Plugin القديم (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - ترحيل مخزن Cron القديم (`jobId`, `schedule.cron`, حقول التسليم/الحمولة ذات المستوى الأعلى، حمولة `provider`، مهام Webhook الاحتياطية البسيطة `notify: true`).
    - ترحيل سياسة وقت تشغيل الوكيل القديمة إلى `agents.defaults.agentRuntime` و`agents.list[].agentRuntime`.
    - تنظيف إعدادات Plugin القديمة عندما تكون plugins مفعلة؛ عندما تكون `plugins.enabled=false`، تعامل مراجع Plugin القديمة كإعدادات احتواء خاملة وتبقى محفوظة.

  </Accordion>
  <Accordion title="الحالة والسلامة">
    - فحص ملف قفل الجلسة وتنظيف الأقفال القديمة.
    - إصلاح نصوص الجلسات لفروع إعادة كتابة الموجه المكررة التي أنشأتها إصدارات 2026.4.24 المتأثرة.
    - اكتشاف شاهد قبر استرداد إعادة تشغيل الوكيل الفرعي العالق، مع دعم `--fix` لمسح علامات الاسترداد القديمة الملغاة بحيث لا يستمر بدء التشغيل في التعامل مع الفرع باعتباره ملغى بسبب إعادة التشغيل.
    - فحوصات سلامة الحالة والأذونات (الجلسات، النصوص، مجلد الحالة).
    - فحوصات أذونات ملف الإعدادات (chmod 600) عند التشغيل محليا.
    - صحة مصادقة النموذج: تفحص انتهاء OAuth، ويمكنها تحديث الرموز التي توشك على الانتهاء، وتبلغ عن حالات التهدئة/التعطيل لملف المصادقة الشخصي.
    - اكتشاف مجلد مساحة عمل إضافي (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway، والخدمات، والمشرفون">
    - إصلاح صورة العزل عندما يكون العزل مفعلا.
    - ترحيل الخدمة القديمة واكتشاف Gateway إضافية.
    - ترحيل الحالة القديمة لقناة Matrix (في وضع `--fix` / `--repair`).
    - فحوصات وقت تشغيل Gateway (الخدمة مثبتة لكنها لا تعمل؛ تسمية launchd المخزنة مؤقتا).
    - تحذيرات حالة القناة (مفحوصة من Gateway قيد التشغيل).
    - تدقيق إعدادات المشرف (launchd/systemd/schtasks) مع إصلاح اختياري.
    - تنظيف بيئة الوكيل المضمنة لخدمات Gateway التي التقطت قيم shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` أثناء التثبيت أو التحديث.
    - فحوصات أفضل ممارسات وقت تشغيل Gateway (Node مقابل Bun، ومسارات مدير الإصدارات).
    - تشخيصات تعارض منفذ Gateway (الافتراضي `18789`).

  </Accordion>
  <Accordion title="المصادقة، والأمان، والاقتران">
    - تحذيرات أمان لسياسات الرسائل المباشرة المفتوحة.
    - فحوصات مصادقة Gateway لوضع الرمز المحلي (تعرض إنشاء رمز عند عدم وجود مصدر رمز؛ ولا تستبدل إعدادات SecretRef للرموز).
    - اكتشاف مشكلات اقتران الأجهزة (طلبات الاقتران لأول مرة المعلقة، وترقيات الدور/النطاق المعلقة، وانحراف ذاكرة التخزين المؤقت القديمة لرموز الأجهزة المحلية، وانحراف مصادقة سجل الاقتران).

  </Accordion>
  <Accordion title="مساحة العمل وshell">
    - فحص systemd linger على Linux.
    - فحص حجم ملف تمهيد مساحة العمل (تحذيرات الاقتطاع/الاقتراب من الحد لملفات السياق).
    - فحص جاهزية Skills للوكيل الافتراضي؛ يبلغ عن المهارات المسموح بها مع ملفات تنفيذية أو متغيرات بيئة أو إعدادات أو متطلبات نظام تشغيل مفقودة، ويمكن لـ `--fix` تعطيل المهارات غير المتاحة في `skills.entries`.
    - فحص حالة إكمال shell والتثبيت/الترقية التلقائية.
    - فحص جاهزية مزود تضمين البحث في الذاكرة (نموذج محلي، أو مفتاح API بعيد، أو ثنائي QMD).
    - فحوصات تثبيت المصدر (عدم تطابق مساحة عمل pnpm، أصول واجهة مستخدم مفقودة، ثنائي tsx مفقود).
    - يكتب الإعدادات المحدثة + بيانات معالج الإعداد الوصفية.

  </Accordion>
</AccordionGroup>

## الردم وإعادة الضبط في واجهة Dreams

يتضمن مشهد Dreams في Control UI إجراءات **الردم**، و**إعادة الضبط**، و**مسح المثبت** لسير عمل grounded dreaming. تستخدم هذه الإجراءات أساليب RPC بأسلوب Gateway doctor، لكنها **ليست** جزءا من إصلاح/ترحيل CLI في `openclaw doctor`.

ما الذي تفعله:

- يفحص **الردم** ملفات `memory/YYYY-MM-DD.md` التاريخية في مساحة العمل النشطة، ويشغل تمريرة يوميات REM المثبتة، ويكتب إدخالات ردم قابلة للعكس في `DREAMS.md`.
- تزيل **إعادة الضبط** إدخالات يوميات الردم المعلمة فقط من `DREAMS.md`.
- يزيل **مسح المثبت** فقط الإدخالات المرحلية قصيرة الأجل والمثبتة فقط التي جاءت من إعادة التشغيل التاريخية ولم تجمع بعد استدعاء حيا أو دعما يوميا.

ما الذي **لا** تفعله بمفردها:

- لا تعدل `MEMORY.md`
- لا تشغل ترحيلات doctor الكاملة
- لا تضيف المرشحين المثبتين تلقائيا إلى مخزن الترقية قصيرة الأجل الحي إلا إذا شغلت مسار CLI المرحلي أولا بشكل صريح

إذا أردت أن تؤثر إعادة التشغيل التاريخية المثبتة في مسار الترقية العميقة العادي، فاستخدم تدفق CLI بدلا من ذلك:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

يضيف ذلك المرشحين المتينين المثبتين إلى مخزن dreaming قصير الأجل مع إبقاء `DREAMS.md` كسطح للمراجعة.

## السلوك التفصيلي والمبررات

<AccordionGroup>
  <Accordion title="0. تحديث اختياري (تثبيتات git)">
    إذا كان هذا checkout من git وكان doctor يعمل تفاعليا، فإنه يعرض التحديث (fetch/rebase/build) قبل تشغيل doctor.
  </Accordion>
  <Accordion title="1. تطبيع الإعدادات">
    إذا احتوت الإعدادات على أشكال قيم قديمة (على سبيل المثال `messages.ackReaction` دون تجاوز خاص بالقناة)، يطبعها doctor إلى المخطط الحالي.

    يشمل ذلك حقول Talk المسطحة القديمة. إعدادات Talk العامة الحالية هي `talk.provider` + `talk.providers.<provider>`. يعيد Doctor كتابة أشكال `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` القديمة في خريطة المزود.

    يحذر Doctor أيضا عندما يكون `plugins.allow` غير فارغ وتستخدم سياسة الأدوات
    إدخالات wildcard أو أدوات مملوكة للـ Plugin. يطابق `tools.allow: ["*"]` فقط الأدوات
    من plugins التي يتم تحميلها فعلا؛ ولا يتجاوز قائمة السماح الحصرية للـ Plugin.

  </Accordion>
  <Accordion title="2. ترحيلات مفاتيح الإعدادات القديمة">
    عندما تحتوي الإعدادات على مفاتيح مهملة، ترفض الأوامر الأخرى التشغيل وتطلب منك تشغيل `openclaw doctor`.

    سيقوم Doctor بما يلي:

    - يشرح مفاتيح الإعدادات القديمة التي عثر عليها.
    - يعرض الترحيل الذي طبقه.
    - يعيد كتابة `~/.openclaw/openclaw.json` بالمخطط المحدث.

    يشغل Gateway أيضا ترحيلات doctor تلقائيا عند بدء التشغيل عندما يكتشف تنسيق إعدادات قديما، لذلك تصلح الإعدادات القديمة دون تدخل يدوي. يتولى `openclaw doctor --fix` عمليات ترحيل مخزن مهام Cron.

    الترحيلات الحالية:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - إعدادات القنوات المكوّنة التي تفتقد سياسة الرد المرئي → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` على المستوى الأعلى
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` القديمة → `talk.provider` + `talk.providers.<provider>`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` و `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` و `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` و `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` و `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - بالنسبة إلى القنوات التي تحتوي على `accounts` مسماة ولكن لا تزال لديها قيم قناة لحساب واحد على المستوى الأعلى، انقل تلك القيم ذات النطاق الحسابي إلى الحساب المرقّى المختار لتلك القناة (`accounts.default` لمعظم القنوات؛ يمكن لـ Matrix الاحتفاظ بهدف مسمى/افتراضي مطابق موجود)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - أزِل `agents.defaults.llm`؛ استخدم `models.providers.<id>.timeoutSeconds` لمهل انتظار الموفر/النموذج البطيئة
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - أزِل `browser.relayBindHost` (إعداد مرحّل الإضافة القديم)
    - `models.providers.*.api: "openai"` القديم → `"openai-completions"` (يتخطى بدء تشغيل Gateway أيضًا الموفرين الذين تم تعيين `api` لديهم إلى قيمة تعداد مستقبلية أو غير معروفة بدلًا من الفشل المغلق)

    تتضمن تحذيرات Doctor أيضًا إرشادات الحساب الافتراضي للقنوات متعددة الحسابات:

    - إذا تم تكوين إدخالين أو أكثر من `channels.<channel>.accounts` دون `channels.<channel>.defaultAccount` أو `accounts.default`، يحذّر Doctor من أن توجيه الرجوع قد يختار حسابًا غير متوقع.
    - إذا تم تعيين `channels.<channel>.defaultAccount` إلى معرّف حساب غير معروف، يحذّر Doctor ويسرد معرّفات الحسابات المكوّنة.

  </Accordion>
  <Accordion title="2b. تجاوزات موفر OpenCode">
    إذا أضفت `models.providers.opencode` أو `opencode-zen` أو `opencode-go` يدويًا، فسيؤدي ذلك إلى تجاوز كتالوج OpenCode المدمج من `@mariozechner/pi-ai`. قد يفرض ذلك النماذج على API خاطئ أو يصفّر التكاليف. يحذّر Doctor حتى تتمكن من إزالة التجاوز واستعادة توجيه API والتكاليف لكل نموذج.
  </Accordion>
  <Accordion title="2c. ترحيل المتصفح وجاهزية Chrome MCP">
    إذا كان تكوين المتصفح لديك لا يزال يشير إلى مسار إضافة Chrome المحذوفة، فإن Doctor يطبّعه إلى نموذج إرفاق Chrome MCP المحلي للمضيف الحالي:

    - يتحول `browser.profiles.*.driver: "extension"` إلى `"existing-session"`
    - تتم إزالة `browser.relayBindHost`

    يدقق Doctor أيضًا مسار Chrome MCP المحلي للمضيف عند استخدام `defaultProfile: "user"` أو ملف تعريف `existing-session` مكوّن:

    - يتحقق مما إذا كان Google Chrome مثبتًا على المضيف نفسه لملفات تعريف الاتصال التلقائي الافتراضية
    - يتحقق من إصدار Chrome المكتشف ويحذّر عندما يكون أقل من Chrome 144
    - يذكّرك بتمكين التصحيح عن بُعد في صفحة فحص المتصفح (مثل `chrome://inspect/#remote-debugging` أو `brave://inspect/#remote-debugging` أو `edge://inspect/#remote-debugging`)

    لا يستطيع Doctor تمكين الإعداد من جهة Chrome نيابة عنك. لا يزال Chrome MCP المحلي للمضيف يتطلب:

    - متصفحًا مبنيًا على Chromium بإصدار 144+ على مضيف gateway/node
    - تشغيل المتصفح محليًا
    - تمكين التصحيح عن بُعد في ذلك المتصفح
    - الموافقة على مطالبة موافقة الإرفاق الأولى في المتصفح

    الجاهزية هنا تتعلق فقط بالمتطلبات الأساسية للإرفاق المحلي. يحتفظ Existing-session بحدود مسار Chrome MCP الحالية؛ ولا تزال المسارات المتقدمة مثل `responsebody` وتصدير PDF واعتراض التنزيلات والإجراءات الدفعية تتطلب متصفحًا مدارًا أو ملف تعريف CDP خامًا.

    لا ينطبق هذا الفحص **على** Docker أو sandbox أو remote-browser أو تدفقات headless الأخرى. تواصل تلك التدفقات استخدام CDP الخام.

  </Accordion>
  <Accordion title="2d. متطلبات OAuth TLS الأساسية">
    عند تكوين ملف تعريف OpenAI Codex OAuth، يفحص Doctor نقطة نهاية تفويض OpenAI للتحقق من أن حزمة Node/OpenSSL TLS المحلية يمكنها التحقق من سلسلة الشهادات. إذا فشل الفحص بخطأ شهادة (مثل `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` أو شهادة منتهية الصلاحية أو شهادة موقعة ذاتيًا)، يطبع Doctor إرشادات إصلاح خاصة بالمنصة. على macOS مع Node من Homebrew، يكون الإصلاح عادةً `brew postinstall ca-certificates`. مع `--deep`، يعمل الفحص حتى إذا كان Gateway سليمًا.
  </Accordion>
  <Accordion title="2e. تجاوزات موفر Codex OAuth">
    إذا كنت قد أضفت سابقًا إعدادات نقل OpenAI قديمة ضمن `models.providers.openai-codex`، فقد تحجب مسار موفر Codex OAuth المدمج الذي تستخدمه الإصدارات الأحدث تلقائيًا. يحذّر Doctor عندما يرى إعدادات النقل القديمة تلك إلى جانب Codex OAuth حتى تتمكن من إزالة تجاوز النقل القديم أو إعادة كتابته واستعادة سلوك التوجيه/الرجوع المدمج. لا تزال الوكلاء المخصصة وتجاوزات الرؤوس فقط مدعومة ولا تؤدي إلى هذا التحذير.
  </Accordion>
  <Accordion title="2f. تحذيرات مسار Plugin الخاص بـ Codex">
    عند تمكين Plugin المجمّع الخاص بـ Codex، يتحقق Doctor أيضًا مما إذا كانت مراجع النموذج الأساسية `openai-codex/*` لا تزال تُحل عبر مشغّل PI الافتراضي. هذا الدمج صالح عندما تريد مصادقة Codex OAuth/الاشتراك عبر PI، لكن من السهل الخلط بينه وبين حزام خادم تطبيق Codex الأصلي. يحذّر Doctor ويشير إلى الشكل الصريح لخادم التطبيق: `openai/*` بالإضافة إلى `agentRuntime.id: "codex"` أو `OPENCLAW_AGENT_RUNTIME=codex`.

    لا يصلح Doctor هذا تلقائيًا لأن كلا المسارين صالحان:

    - `openai-codex/*` + PI يعني "استخدم مصادقة Codex OAuth/الاشتراك عبر مشغّل OpenClaw العادي."
    - `openai/*` + `agentRuntime.id: "codex"` يعني "شغّل الدور المدمج عبر خادم تطبيق Codex الأصلي."
    - `/codex ...` يعني "تحكم في محادثة Codex أصلية من الدردشة أو اربطها."
    - `/acp ...` أو `runtime: "acp"` يعني "استخدم محوّل ACP/acpx الخارجي."

    إذا ظهر التحذير، فاختر المسار الذي قصدته وعدّل التكوين يدويًا. أبقِ التحذير كما هو عندما يكون PI Codex OAuth مقصودًا.

  </Accordion>
  <Accordion title="3. عمليات ترحيل الحالة القديمة (تخطيط القرص)">
    يمكن لـ Doctor ترحيل التخطيطات القديمة على القرص إلى البنية الحالية:

    - مخزن الجلسات + النصوص:
      - من `~/.openclaw/sessions/` إلى `~/.openclaw/agents/<agentId>/sessions/`
    - دليل الوكيل:
      - من `~/.openclaw/agent/` إلى `~/.openclaw/agents/<agentId>/agent/`
    - حالة مصادقة WhatsApp (Baileys):
      - من `~/.openclaw/credentials/*.json` القديمة (باستثناء `oauth.json`)
      - إلى `~/.openclaw/credentials/whatsapp/<accountId>/...` (معرّف الحساب الافتراضي: `default`)

    هذه الترحيـلات تبذل أفضل جهد وهي متكررة بأمان؛ سيصدر Doctor تحذيرات عندما يترك أي مجلدات قديمة كنسخ احتياطية. يقوم Gateway/CLI أيضًا بترحيل الجلسات القديمة + دليل الوكيل تلقائيًا عند بدء التشغيل حتى تصل السجل/المصادقة/النماذج إلى المسار الخاص بكل وكيل دون تشغيل Doctor يدويًا. يتم ترحيل مصادقة WhatsApp عمدًا فقط عبر `openclaw doctor`. تقارن تسوية موفر/خريطة موفري Talk الآن بالمساواة البنيوية، لذلك لم تعد الفروقات الناتجة عن ترتيب المفاتيح فقط تؤدي إلى تغييرات `doctor --fix` متكررة بلا أثر.

  </Accordion>
  <Accordion title="3a. عمليات ترحيل بيانات تعريف Plugin القديمة">
    يفحص Doctor جميع بيانات تعريف Plugins المثبتة بحثًا عن مفاتيح قدرات مهملة على المستوى الأعلى (`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders`). عند العثور عليها، يعرض نقلها إلى كائن `contracts` وإعادة كتابة ملف بيانات التعريف في مكانه. هذا الترحيل متكرر بأمان؛ إذا كان مفتاح `contracts` يحتوي بالفعل على القيم نفسها، تتم إزالة المفتاح القديم دون تكرار البيانات.
  </Accordion>
  <Accordion title="3b. عمليات ترحيل مخزن Cron القديم">
    يتحقق Doctor أيضًا من مخزن مهام cron (`~/.openclaw/cron/jobs.json` افتراضيًا، أو `cron.store` عند تجاوزه) بحثًا عن أشكال المهام القديمة التي لا يزال المجدول يقبلها للتوافق.

    تشمل عمليات تنظيف cron الحالية:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - حقول الحمولة على المستوى الأعلى (`message`، `model`، `thinking`، ...) → `payload`
    - حقول التسليم على المستوى الأعلى (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - أسماء تسليم `provider` البديلة في الحمولة → `delivery.channel` صريح
    - مهام رجوع Webhook القديمة البسيطة `notify: true` → `delivery.mode="webhook"` صريح مع `delivery.to=cron.webhook`

    يرحّل Doctor تلقائيًا مهام `notify: true` فقط عندما يستطيع فعل ذلك دون تغيير السلوك. إذا جمعت مهمة بين رجوع الإشعار القديم ووضع تسليم موجود غير Webhook، يحذّر Doctor ويترك تلك المهمة للمراجعة اليدوية.

    على Linux، يحذّر Doctor أيضًا عندما لا يزال crontab الخاص بالمستخدم يستدعي `~/.openclaw/bin/ensure-whatsapp.sh` القديم. هذا السكربت المحلي للمضيف لا يصونه OpenClaw الحالي ويمكنه كتابة رسائل `Gateway inactive` زائفة إلى `~/.openclaw/logs/whatsapp-health.log` عندما يتعذر على cron الوصول إلى ناقل مستخدم systemd. أزِل إدخال crontab القديم باستخدام `crontab -e`؛ استخدم `openclaw channels status --probe` و `openclaw doctor` و `openclaw gateway status` لفحوصات السلامة الحالية.

  </Accordion>
  <Accordion title="3c. تنظيف أقفال الجلسات">
    تفحص أداة الفحص كل دليل جلسة وكيل بحثًا عن ملفات أقفال الكتابة المتقادمة — وهي ملفات تُترك عندما تنتهي جلسة بشكل غير طبيعي. لكل ملف قفل يُعثر عليه، تعرض: المسار، وPID، وما إذا كان PID لا يزال حيًا، وعمر القفل، وما إذا كان يُعد متقادمًا (PID ميت أو أقدم من 30 دقيقة). في وضع `--fix` / `--repair` تزيل ملفات الأقفال المتقادمة تلقائيًا؛ وإلا فتطبع ملاحظة وتطلب منك إعادة التشغيل باستخدام `--fix`.
  </Accordion>
  <Accordion title="3d. إصلاح فرع نص جلسة المحادثة">
    تفحص أداة الفحص ملفات JSONL الخاصة بجلسات الوكلاء بحثًا عن شكل الفرع المكرر الذي أنشأه خلل إعادة كتابة نص المحادثة في الموجّه بتاريخ 2026.4.24: دور مستخدم مهجور يحتوي على سياق تشغيل داخلي من OpenClaw إضافة إلى فرع شقيق نشط يحتوي على موجّه المستخدم المرئي نفسه. في وضع `--fix` / `--repair`، تنشئ أداة الفحص نسخة احتياطية من كل ملف متأثر بجوار الأصل وتعيد كتابة نص المحادثة إلى الفرع النشط حتى لا يعود سجل Gateway وقراء الذاكرة يرون أدوارًا مكررة.
  </Accordion>
  <Accordion title="4. فحوصات سلامة الحالة (استمرارية الجلسة والتوجيه والسلامة)">
    دليل الحالة هو جذع الدماغ التشغيلي. إذا اختفى، فستفقد الجلسات وبيانات الاعتماد والسجلات والإعدادات (ما لم تكن لديك نسخ احتياطية في مكان آخر).

    تتحقق أداة الفحص مما يلي:

    - **دليل الحالة مفقود**: تحذر من فقدان كارثي للحالة، وتطلب إعادة إنشاء الدليل، وتذكّرك بأنها لا تستطيع استرداد البيانات المفقودة.
    - **أذونات دليل الحالة**: تتحقق من قابلية الكتابة؛ وتعرض إصلاح الأذونات (وتصدر تلميح `chown` عند اكتشاف عدم تطابق المالك/المجموعة).
    - **دليل حالة متزامن سحابيًا على macOS**: تحذر عندما تُحل الحالة تحت iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) أو `~/Library/CloudStorage/...` لأن المسارات المدعومة بالمزامنة قد تسبب إدخال/إخراج أبطأ وسباقات قفل/مزامنة.
    - **دليل حالة Linux على SD أو eMMC**: تحذر عندما تُحل الحالة إلى مصدر تركيب `mmcblk*`، لأن الإدخال/الإخراج العشوائي المدعوم ببطاقات SD أو eMMC قد يكون أبطأ ويتآكل أسرع تحت عمليات كتابة الجلسات وبيانات الاعتماد.
    - **أدلة الجلسات مفقودة**: يلزم وجود `sessions/` ودليل مخزن الجلسات لاستمرار السجل وتجنب أعطال `ENOENT`.
    - **عدم تطابق نص المحادثة**: تحذر عندما تفتقد إدخالات جلسات حديثة ملفات نص المحادثة.
    - **الجلسة الرئيسية "JSONL من سطر واحد"**: تضع علامة عندما يحتوي نص المحادثة الرئيسي على سطر واحد فقط (السجل لا يتراكم).
    - **أدلة حالة متعددة**: تحذر عندما توجد عدة مجلدات `~/.openclaw` عبر أدلة المنزل أو عندما يشير `OPENCLAW_STATE_DIR` إلى مكان آخر (يمكن أن ينقسم السجل بين التثبيتات).
    - **تذكير الوضع البعيد**: إذا كان `gateway.mode=remote`، تذكّرك أداة الفحص بتشغيلها على المضيف البعيد (فالحالة موجودة هناك).
    - **أذونات ملف الإعدادات**: تحذر إذا كان `~/.openclaw/openclaw.json` قابلًا للقراءة من المجموعة/العالم وتعرض تشديده إلى `600`.

  </Accordion>
  <Accordion title="5. صحة مصادقة النموذج (انتهاء صلاحية OAuth)">
    تفحص أداة الفحص ملفات تعريف OAuth في مخزن المصادقة، وتحذر عندما تكون الرموز على وشك الانتهاء أو منتهية الصلاحية، ويمكنها تحديثها عندما يكون ذلك آمنًا. إذا كان ملف تعريف OAuth/الرمز الخاص بـ Anthropic متقادمًا، فإنها تقترح مفتاح Anthropic API أو مسار رمز إعداد Anthropic. تظهر مطالبات التحديث فقط عند التشغيل تفاعليًا (TTY)؛ ويتجاوز `--non-interactive` محاولات التحديث.

    عندما يفشل تحديث OAuth بشكل دائم (مثلًا `refresh_token_reused` أو `invalid_grant` أو عندما يطلب منك مزود تسجيل الدخول مرة أخرى)، تفيد أداة الفحص بأن إعادة المصادقة مطلوبة وتطبع أمر `openclaw models auth login --provider ...` الدقيق لتشغيله.

    تعرض أداة الفحص أيضًا ملفات تعريف المصادقة غير القابلة للاستخدام مؤقتًا بسبب:

    - فترات تهدئة قصيرة (حدود المعدل/انتهاء المهلة/إخفاقات المصادقة)
    - تعطيلات أطول (إخفاقات الفوترة/الرصيد)

  </Accordion>
  <Accordion title="6. التحقق من نموذج الخطافات">
    إذا كان `hooks.gmail.model` مضبوطًا، تتحقق أداة الفحص من مرجع النموذج مقابل الكتالوج وقائمة السماح وتحذر عندما لا يمكن حله أو يكون غير مسموح به.
  </Accordion>
  <Accordion title="7. إصلاح صورة Sandbox">
    عند تمكين العزل، تتحقق أداة الفحص من صور Docker وتعرض بناءها أو التبديل إلى الأسماء القديمة إذا كانت الصورة الحالية مفقودة.
  </Accordion>
  <Accordion title="7b. تنظيف تثبيت Plugin">
    تزيل أداة الفحص حالة تجهيز تبعيات Plugin القديمة التي أنشأها OpenClaw في وضع `openclaw doctor --fix` / `openclaw doctor --repair`. يشمل ذلك جذور التبعيات المولدة المتقادمة، وأدلة مرحلة التثبيت القديمة، والمخلفات المحلية للحزمة من كود إصلاح تبعيات Plugin المدمجة سابقًا.

    يمكن لأداة الفحص أيضًا إعادة تثبيت Plugins القابلة للتنزيل والمكوّنة عندما تشير الإعدادات إليها لكن سجل Plugin المحلي لا يستطيع العثور عليها. بالنسبة إلى تحويل Plugin المدمجة إلى خارجية في 2026.5.2، تثبت أداة الفحص تلقائيًا Plugins القابلة للتنزيل التي تستخدمها الإعدادات الحالية بالفعل، ثم تعتمد على `meta.lastTouchedVersion` لتشغيل تمريرة ذلك الإصدار مرة واحدة فقط. لا يشغّل بدء تشغيل Gateway وإعادة تحميل الإعدادات مديري الحزم؛ وتظل عمليات تثبيت Plugin عملًا صريحًا من خلال الفحص/التثبيت/التحديث.

  </Accordion>
  <Accordion title="8. ترحيلات خدمة Gateway وتلميحات التنظيف">
    تكتشف أداة الفحص خدمات Gateway القديمة (launchd/systemd/schtasks) وتعرض إزالتها وتثبيت خدمة OpenClaw باستخدام منفذ Gateway الحالي. يمكنها أيضًا البحث عن خدمات إضافية شبيهة بـ Gateway وطباعة تلميحات تنظيف. تُعد خدمات OpenClaw Gateway المسماة بملف التعريف خدمات من الدرجة الأولى ولا تُعلّم على أنها "إضافية".

    على Linux، إذا كانت خدمة Gateway على مستوى المستخدم مفقودة لكن توجد خدمة OpenClaw Gateway على مستوى النظام، فلا تثبت أداة الفحص خدمة ثانية على مستوى المستخدم تلقائيًا. افحص باستخدام `openclaw gateway status --deep` أو `openclaw doctor --deep`، ثم أزل المكرر أو اضبط `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يكون مشرف نظام يملك دورة حياة Gateway.

  </Accordion>
  <Accordion title="8b. ترحيل Matrix عند بدء التشغيل">
    عندما يكون لدى حساب قناة Matrix ترحيل حالة قديم معلّق أو قابل للتنفيذ، تنشئ أداة الفحص (في وضع `--fix` / `--repair`) لقطة ما قبل الترحيل ثم تشغّل خطوات الترحيل بأفضل جهد: ترحيل حالة Matrix القديمة وتجهيز الحالة المشفرة القديمة. كلتا الخطوتين غير قاتلتين؛ تُسجّل الأخطاء ويستمر بدء التشغيل. في وضع القراءة فقط (`openclaw doctor` بدون `--fix`) يُتخطى هذا الفحص بالكامل.
  </Accordion>
  <Accordion title="8c. اقتران الجهاز وانحراف المصادقة">
    تفحص أداة الفحص الآن حالة اقتران الجهاز كجزء من تمريرة الصحة العادية.

    ما تعرضه:

    - طلبات الاقتران الأولى المعلّقة
    - ترقيات الأدوار المعلّقة للأجهزة المقترنة مسبقًا
    - ترقيات النطاقات المعلّقة للأجهزة المقترنة مسبقًا
    - إصلاحات عدم تطابق المفتاح العام عندما لا يزال معرّف الجهاز متطابقًا لكن هوية الجهاز لم تعد تطابق السجل المعتمد
    - السجلات المقترنة التي تفتقد رمزًا نشطًا لدور معتمد
    - الرموز المقترنة التي تنحرف نطاقاتها خارج خط أساس الاقتران المعتمد
    - إدخالات رمز الجهاز المخزنة مؤقتًا محليًا للجهاز الحالي التي تسبق تدوير رمز على جهة Gateway أو تحمل بيانات تعريف نطاق قديمة

    لا يعتمد الفاحص طلبات الاقتران تلقائيًا ولا يدوّر رموز الأجهزة تلقائيًا. بل يطبع الخطوات التالية الدقيقة:

    - افحص الطلبات المعلّقة باستخدام `openclaw devices list`
    - اعتمد الطلب المحدد باستخدام `openclaw devices approve <requestId>`
    - دوّر رمزًا جديدًا باستخدام `openclaw devices rotate --device <deviceId> --role <role>`
    - أزِل سجلًا قديمًا وأعد اعتماده باستخدام `openclaw devices remove <deviceId>`

    يسد هذا الثغرة الشائعة "مقترن بالفعل لكن ما زلت أتلقى أن الاقتران مطلوب": يميّز الفاحص الآن بين الاقتران لأول مرة وترقيات الدور/النطاق المعلّقة وبين انحراف الرمز/هوية الجهاز القديمة.

  </Accordion>
  <Accordion title="9. تحذيرات الأمان">
    يصدر الفاحص تحذيرات عندما يكون مزوّد مفتوحًا للرسائل المباشرة دون قائمة سماح، أو عندما تكون سياسة مهيأة بطريقة خطرة.
  </Accordion>
  <Accordion title="10. استمرار systemd (Linux)">
    عند التشغيل كخدمة مستخدم systemd، يتأكد الفاحص من تمكين الاستمرار حتى يظل Gateway حيًا بعد تسجيل الخروج.
  </Accordion>
  <Accordion title="11. حالة مساحة العمل (Skills وplugins والأدلة القديمة)">
    يطبع الفاحص ملخصًا لحالة مساحة العمل للوكيل الافتراضي:

    - **حالة Skills**: يحصي المهارات المؤهلة، والمفتقدة للمتطلبات، والمحظورة بقائمة السماح.
    - **أدلة مساحة العمل القديمة**: يحذّر عندما تكون `~/openclaw` أو أدلة مساحة عمل قديمة أخرى موجودة بجانب مساحة العمل الحالية.
    - **حالة Plugin**: يحصي plugins الممكّنة/المعطّلة/ذات الأخطاء؛ ويسرد معرّفات plugin لأي أخطاء؛ ويبلغ عن قدرات Plugin الحزمة.
    - **تحذيرات توافق Plugin**: يعلّم plugins التي لديها مشكلات توافق مع وقت التشغيل الحالي.
    - **تشخيصات Plugin**: يعرض أي تحذيرات أو أخطاء وقت التحميل صادرة عن سجل Plugin.

  </Accordion>
  <Accordion title="11b. حجم ملف التمهيد">
    يتحقق الفاحص مما إذا كانت ملفات تمهيد مساحة العمل (على سبيل المثال `AGENTS.md` أو `CLAUDE.md` أو ملفات سياق محقونة أخرى) قريبة من ميزانية الأحرف المهيأة أو تتجاوزها. ويبلغ، لكل ملف، عن عدد الأحرف الخام مقابل المحقونة، ونسبة الاقتطاع، وسبب الاقتطاع (`max/file` أو `max/total`)، وإجمالي الأحرف المحقونة كنسبة من إجمالي الميزانية. عندما تُقتطع الملفات أو تقترب من الحد، يطبع الفاحص نصائح لضبط `agents.defaults.bootstrapMaxChars` و`agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. تنظيف Plugin القناة القديم">
    عندما يزيل `openclaw doctor --fix` Plugin قناة مفقودًا، فإنه يزيل أيضًا إعدادات القناة المعلّقة التي كانت تشير إلى ذلك Plugin: إدخالات `channels.<id>`، وأهداف Heartbeat التي سمّت القناة، وتجاوزات `agents.*.models["<channel>/*"]`. يمنع هذا حلقات إقلاع Gateway عندما يختفي وقت تشغيل القناة لكن الإعدادات لا تزال تطلب من Gateway الارتباط بها.
  </Accordion>
  <Accordion title="11c. إكمال الصدفة">
    يتحقق الفاحص مما إذا كان إكمال التبويب مثبتًا للصدفة الحالية (zsh أو bash أو fish أو PowerShell):

    - إذا كان ملف تعريف الصدفة يستخدم نمط إكمال ديناميكيًا بطيئًا (`source <(openclaw completion ...)`)، يرقيه الفاحص إلى متغير الملف المخزن مؤقتًا الأسرع.
    - إذا كان الإكمال مهيأ في ملف التعريف لكن ملف التخزين المؤقت مفقود، يعيد الفاحص إنشاء التخزين المؤقت تلقائيًا.
    - إذا لم يكن أي إكمال مهيأ على الإطلاق، يطلب الفاحص تثبيته (في الوضع التفاعلي فقط؛ يُتخطى مع `--non-interactive`).

    شغّل `openclaw completion --write-state` لإعادة إنشاء التخزين المؤقت يدويًا.

  </Accordion>
  <Accordion title="12. فحوصات مصادقة Gateway (الرمز المحلي)">
    يتحقق الفاحص من جاهزية مصادقة رمز Gateway المحلي.

    - إذا كان وضع الرمز يحتاج إلى رمز ولا يوجد مصدر رمز، يعرض الفاحص إنشاء واحد.
    - إذا كان `gateway.auth.token` مدارًا بواسطة SecretRef لكنه غير متاح، يحذّر الفاحص ولا يستبدله بنص صريح.
    - يفرض `openclaw doctor --generate-gateway-token` الإنشاء فقط عندما لا يكون أي SecretRef للرمز مهيأ.

  </Accordion>
  <Accordion title="12b. إصلاحات واعية بـ SecretRef وللقراءة فقط">
    تحتاج بعض مسارات الإصلاح إلى فحص بيانات الاعتماد المهيأة دون إضعاف سلوك الفشل السريع في وقت التشغيل.

    - يستخدم `openclaw doctor --fix` الآن نموذج ملخص SecretRef للقراءة فقط نفسه الذي تستخدمه أوامر عائلة الحالة لإصلاحات الإعدادات الموجهة.
    - مثال: يحاول إصلاح `allowFrom` / `groupAllowFrom` `@username` في Telegram استخدام بيانات اعتماد البوت المهيأة عندما تكون متاحة.
    - إذا كان رمز بوت Telegram مهيأ عبر SecretRef لكنه غير متاح في مسار الأمر الحالي، يبلغ الفاحص أن بيانات الاعتماد مهيأة-لكنها-غير-متاحة ويتخطى الحل التلقائي بدلًا من التعطل أو الإبلاغ خطأً بأن الرمز مفقود.

  </Accordion>
  <Accordion title="13. فحص صحة Gateway + إعادة التشغيل">
    يشغّل Doctor فحص صحة ويعرض إعادة تشغيل Gateway عندما يبدو غير سليم.
  </Accordion>
  <Accordion title="13b. جاهزية البحث في الذاكرة">
    يتحقق Doctor مما إذا كان موفر تضمينات البحث في الذاكرة المكوّن جاهزًا للوكيل الافتراضي. يعتمد السلوك على الخلفية والموفر المكوّنين:

    - **خلفية QMD**: يتحقق مما إذا كان ملف `qmd` الثنائي متاحًا وقابلًا للتشغيل. إذا لم يكن كذلك، يطبع إرشادات الإصلاح بما في ذلك حزمة npm وخيار مسار ثنائي يدوي.
    - **موفر محلي صريح**: يتحقق من وجود ملف نموذج محلي أو عنوان URL معروف لنموذج بعيد/قابل للتنزيل. إذا كان مفقودًا، يقترح التبديل إلى موفر بعيد.
    - **موفر بعيد صريح** (`openai`، `voyage`، إلخ): يتحقق من وجود مفتاح API في البيئة أو مخزن المصادقة. يطبع تلميحات إصلاح قابلة للتنفيذ إذا كان مفقودًا.
    - **موفر تلقائي**: يتحقق من توفر النموذج المحلي أولًا، ثم يجرّب كل موفر بعيد بترتيب الاختيار التلقائي.

    عند توفر نتيجة مسبار Gateway مخزنة مؤقتًا (كان Gateway سليمًا وقت الفحص)، يطابق Doctor نتيجتها مع الإعدادات المرئية عبر CLI ويشير إلى أي اختلاف. لا يبدأ Doctor اختبار تضمينات جديدًا في المسار الافتراضي؛ استخدم أمر حالة الذاكرة العميق عندما تريد فحص موفر حيًا.

    استخدم `openclaw memory status --deep` للتحقق من جاهزية التضمينات وقت التشغيل.

  </Accordion>
  <Accordion title="14. تحذيرات حالة القناة">
    إذا كان Gateway سليمًا، يشغّل Doctor مسبار حالة قناة ويبلغ عن التحذيرات مع إصلاحات مقترحة.
  </Accordion>
  <Accordion title="15. تدقيق إعدادات المشرف + الإصلاح">
    يتحقق Doctor من إعدادات المشرف المثبتة (launchd/systemd/schtasks) بحثًا عن الإعدادات الافتراضية المفقودة أو القديمة (مثل تبعيات systemd لـ network-online وتأخير إعادة التشغيل). عندما يعثر على عدم تطابق، يوصي بتحديث ويمكنه إعادة كتابة ملف الخدمة/المهمة إلى الإعدادات الافتراضية الحالية.

    ملاحظات:

    - يطلب `openclaw doctor` التأكيد قبل إعادة كتابة إعدادات المشرف.
    - يقبل `openclaw doctor --yes` مطالبات الإصلاح الافتراضية.
    - يطبق `openclaw doctor --repair` الإصلاحات الموصى بها دون مطالبات.
    - يستبدل `openclaw doctor --repair --force` إعدادات المشرف المخصصة.
    - يبقي `OPENCLAW_SERVICE_REPAIR_POLICY=external` Doctor للقراءة فقط لدورة حياة خدمة Gateway. لا يزال يبلغ عن صحة الخدمة ويشغّل إصلاحات غير خدمية، لكنه يتخطى تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة، وإعادة كتابة إعدادات المشرف، وتنظيف الخدمات القديمة لأن مشرفًا خارجيًا يملك دورة الحياة هذه.
    - على Linux، لا يعيد Doctor كتابة بيانات تعريف الأمر/نقطة الدخول بينما تكون وحدة systemd المطابقة لـ Gateway نشطة. كما يتجاهل وحدات Gateway-like الإضافية غير القديمة وغير النشطة أثناء فحص الخدمات المكررة حتى لا تنشئ ملفات الخدمات المصاحبة ضوضاء تنظيف.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان `gateway.auth.token` مُدارًا عبر SecretRef، فإن تثبيت/إصلاح خدمة Doctor يتحقق من SecretRef لكنه لا يحفظ قيم الرمز النصية الصريحة المحلولة في بيانات تعريف بيئة خدمة المشرف.
    - يكتشف Doctor قيم بيئة الخدمة المُدارة والمدعومة بـ `.env`/SecretRef التي ضمّنتها تثبيتات LaunchAgent أو systemd أو Windows Scheduled Task القديمة بشكل مباشر، ويعيد كتابة بيانات تعريف الخدمة بحيث تُحمّل تلك القيم من مصدر وقت التشغيل بدلًا من تعريف المشرف.
    - يكتشف Doctor عندما لا يزال أمر الخدمة يثبت `--port` قديمًا بعد تغيّر `gateway.port`، ويعيد كتابة بيانات تعريف الخدمة إلى المنفذ الحالي.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef للرمز المكوّن غير محلول، يحظر Doctor مسار التثبيت/الإصلاح مع إرشادات قابلة للتنفيذ.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين وكان `gateway.auth.mode` غير معيّن، يحظر Doctor التثبيت/الإصلاح حتى يتم تعيين الوضع صراحة.
    - بالنسبة إلى وحدات systemd الخاصة بالمستخدم على Linux، تشمل فحوص انحراف الرمز في Doctor الآن مصدري `Environment=` و`EnvironmentFile=` عند مقارنة بيانات تعريف مصادقة الخدمة.
    - ترفض إصلاحات خدمة Doctor إعادة كتابة أو إيقاف أو إعادة تشغيل خدمة Gateway من ملف OpenClaw ثنائي أقدم عندما تكون الإعدادات قد كُتبت آخر مرة بواسطة إصدار أحدث. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - يمكنك دائمًا فرض إعادة كتابة كاملة عبر `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. وقت تشغيل Gateway + تشخيصات المنفذ">
    يفحص Doctor وقت تشغيل الخدمة (PID، آخر حالة خروج) ويحذر عندما تكون الخدمة مثبتة لكنها لا تعمل فعليًا. كما يتحقق من تعارضات المنافذ على منفذ Gateway (الافتراضي `18789`) ويبلغ عن الأسباب المحتملة (Gateway يعمل بالفعل، نفق SSH).
  </Accordion>
  <Accordion title="17. أفضل ممارسات وقت تشغيل Gateway">
    يحذر Doctor عندما تعمل خدمة Gateway على Bun أو مسار Node مُدار بإصدار (`nvm`، `fnm`، `volta`، `asdf`، إلخ). تتطلب قنوات WhatsApp + Telegram استخدام Node، ويمكن أن تتعطل مسارات مديري الإصدارات بعد الترقيات لأن الخدمة لا تحمّل تهيئة الصدفة لديك. يعرض Doctor الترحيل إلى تثبيت Node نظامي عندما يكون متاحًا (Homebrew/apt/choco).

    تستخدم LaunchAgents المثبتة أو المُصلحة حديثًا على macOS مسار PATH نظاميًا قياسيًا (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) بدلًا من نسخ PATH الخاص بالصدفة التفاعلية، لذلك لا تغير أدلة Volta وasdf وfnm وpnpm وغيرها من أدلة مديري الإصدارات أي عمليات Node فرعية يتم حلها. لا تزال خدمات Linux تحتفظ بجذور بيئة صريحة (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) وأدلة user-bin مستقرة، لكن أدلة الرجوع الاحتياطية المخمنة لمديري الإصدارات لا تُكتب إلى PATH الخاص بالخدمة إلا عندما تكون تلك الأدلة موجودة على القرص.

  </Accordion>
  <Accordion title="18. كتابة الإعدادات + بيانات تعريف المعالج">
    يحفظ Doctor أي تغييرات في الإعدادات ويختم بيانات تعريف المعالج لتسجيل تشغيل Doctor.
  </Accordion>
  <Accordion title="19. نصائح مساحة العمل (النسخ الاحتياطي + نظام الذاكرة)">
    يقترح Doctor نظام ذاكرة لمساحة العمل عند فقدانه ويطبع نصيحة نسخ احتياطي إذا لم تكن مساحة العمل موجودة بالفعل ضمن git.

    راجع [/concepts/agent-workspace](/ar/concepts/agent-workspace) للحصول على دليل كامل لبنية مساحة العمل والنسخ الاحتياطي باستخدام git (يوصى بـ GitHub أو GitLab خاص).

  </Accordion>
</AccordionGroup>

## ذو صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
