---
read_when:
    - إضافة عمليات ترحيل doctor أو تعديلها
    - إدخال تغييرات كاسرة في الإعدادات
sidebarTitle: Doctor
summary: 'أمر doctor: فحوصات الصحة، وترحيلات الإعدادات، وخطوات الإصلاح'
title: التشخيص
x-i18n:
    generated_at: "2026-05-02T20:45:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 504cf06e8457315eb1df4970a877b88fdc2e32f34974ce789875373e9e030234
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` هي أداة الإصلاح + الترحيل لـ OpenClaw. تصلح الإعدادات/الحالة القديمة، وتفحص السلامة، وتوفر خطوات إصلاح قابلة للتنفيذ.

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

    قبول الإعدادات الافتراضية دون مطالبة (بما في ذلك خطوات إصلاح إعادة التشغيل/الخدمة/الصندوق المعزول عند انطباقها).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    تطبيق الإصلاحات الموصى بها دون مطالبة (الإصلاحات + عمليات إعادة التشغيل حيث يكون ذلك آمنا).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    تطبيق الإصلاحات الصارمة أيضا (يستبدل إعدادات المشرف المخصصة).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    التشغيل دون مطالبات وتطبيق عمليات الترحيل الآمنة فقط (تطبيع الإعدادات + نقل الحالة على القرص). يتخطى إجراءات إعادة التشغيل/الخدمة/الصندوق المعزول التي تتطلب تأكيدا بشريا. تعمل عمليات ترحيل الحالة القديمة تلقائيا عند اكتشافها.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    فحص خدمات النظام بحثا عن عمليات تثبيت Gateway إضافية (launchd/systemd/schtasks).

  </Tab>
</Tabs>

إذا أردت مراجعة التغييرات قبل الكتابة، فافتح ملف الإعدادات أولا:

```bash
cat ~/.openclaw/openclaw.json
```

## ما الذي يفعله (ملخص)

<AccordionGroup>
  <Accordion title="السلامة وواجهة المستخدم والتحديثات">
    - تحديث اختياري قبل البدء لتثبيتات git (تفاعلي فقط).
    - فحص حداثة بروتوكول واجهة المستخدم (يعيد بناء Control UI عندما يكون مخطط البروتوكول أحدث).
    - فحص السلامة + مطالبة بإعادة التشغيل.
    - ملخص حالة Skills (مؤهلة/مفقودة/محظورة) وحالة Plugin.

  </Accordion>
  <Accordion title="الإعدادات وعمليات الترحيل">
    - تطبيع الإعدادات للقيم القديمة.
    - ترحيل إعدادات Talk من حقول `talk.*` المسطحة القديمة إلى `talk.provider` + `talk.providers.<provider>`.
    - فحوصات ترحيل المتصفح لإعدادات Chrome extension القديمة وجاهزية Chrome MCP.
    - تحذيرات تجاوز مزود OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - تحذيرات حجب OAuth في Codex (`models.providers.openai-codex`).
    - فحص متطلبات OAuth TLS المسبقة لملفات OpenAI Codex OAuth الشخصية.
    - تحذيرات قائمة السماح Plugin/الأدوات عندما تكون `plugins.allow` مقيدة لكن سياسة الأدوات لا تزال تطلب أدوات عامة أو مملوكة لـ Plugin.
    - ترحيل الحالة القديمة على القرص (sessions/agent dir/مصادقة WhatsApp).
    - ترحيل مفتاح عقد بيان Plugin القديم (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - ترحيل مخزن Cron القديم (`jobId`, `schedule.cron`, حقول delivery/payload في المستوى الأعلى، payload `provider`, مهام Webhook احتياطية بسيطة من نوع `notify: true`).
    - ترحيل سياسة تشغيل الوكيل القديمة إلى `agents.defaults.agentRuntime` و`agents.list[].agentRuntime`.
    - تنظيف إعدادات Plugin القديمة عندما تكون Plugins مفعلة؛ عندما تكون `plugins.enabled=false`، تعامل مراجع Plugin القديمة كإعداد احتواء خامل ويتم الحفاظ عليها.

  </Accordion>
  <Accordion title="الحالة والسلامة البنيوية">
    - فحص ملف قفل الجلسة وتنظيف الأقفال القديمة.
    - إصلاح نصوص الجلسات لفروع إعادة كتابة المطالبة المكررة التي أنشأتها إصدارات 2026.4.24 المتأثرة.
    - اكتشاف شواهد استرداد إعادة تشغيل الوكلاء الفرعيين العالقين، مع دعم `--fix` لمسح أعلام الاسترداد المجهضة القديمة حتى لا يظل بدء التشغيل يعامل الطفل على أنه أجهض بسبب إعادة التشغيل.
    - فحوصات سلامة الحالة والصلاحيات (الجلسات، النصوص، دليل الحالة).
    - فحوصات صلاحيات ملف الإعدادات (chmod 600) عند التشغيل محليا.
    - سلامة مصادقة النموذج: يفحص انتهاء OAuth، ويمكنه تحديث الرموز القريبة من الانتهاء، ويبلغ عن حالات تبريد/تعطيل ملف المصادقة الشخصي.
    - اكتشاف دليل مساحة عمل إضافي (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway والخدمات والمشرفون">
    - إصلاح صورة الصندوق المعزول عندما يكون العزل مفعلا.
    - ترحيل الخدمة القديمة واكتشاف Gateway إضافي.
    - ترحيل حالة قناة Matrix القديمة (في وضع `--fix` / `--repair`).
    - فحوصات تشغيل Gateway (الخدمة مثبتة لكنها لا تعمل؛ تسمية launchd مخزنة مؤقتا).
    - تحذيرات حالة القنوات (مفحوصة من Gateway قيد التشغيل).
    - تدقيق إعدادات المشرف (launchd/systemd/schtasks) مع إصلاح اختياري.
    - تنظيف بيئة الوكيل المضمنة لخدمات Gateway التي التقطت قيم shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` أثناء التثبيت أو التحديث.
    - فحوصات أفضل ممارسات تشغيل Gateway (Node مقابل Bun، مسارات مدير الإصدارات).
    - تشخيصات تعارض منفذ Gateway (الافتراضي `18789`).

  </Accordion>
  <Accordion title="المصادقة والأمان والإقران">
    - تحذيرات أمان لسياسات الرسائل الخاصة المفتوحة.
    - فحوصات مصادقة Gateway لوضع الرمز المحلي (يعرض إنشاء رمز عند عدم وجود مصدر رمز؛ لا يستبدل إعدادات token SecretRef).
    - اكتشاف مشكلات إقران الأجهزة (طلبات إقران أول مرة معلقة، ترقيات دور/نطاق معلقة، انجراف ذاكرة التخزين المؤقت المحلية القديمة لرمز الجهاز، وانجراف مصادقة السجل المقترن).

  </Accordion>
  <Accordion title="مساحة العمل وshell">
    - فحص systemd linger على Linux.
    - فحص حجم ملف تمهيد مساحة العمل (تحذيرات الاقتطاع/الاقتراب من الحد لملفات السياق).
    - فحص جاهزية Skills للوكيل الافتراضي؛ يبلغ عن Skills المسموح بها التي تفتقد ملفات تنفيذية أو متغيرات بيئة أو إعدادات أو متطلبات نظام تشغيل، ويمكن لـ `--fix` تعطيل Skills غير المتاحة في `skills.entries`.
    - فحص حالة إكمال shell والتثبيت/الترقية التلقائية.
    - فحص جاهزية مزود تضمينات بحث الذاكرة (نموذج محلي، مفتاح API بعيد، أو ملف QMD ثنائي).
    - فحوصات تثبيت المصدر (عدم تطابق مساحة عمل pnpm، أصول واجهة مستخدم مفقودة، ملف tsx ثنائي مفقود).
    - يكتب الإعدادات المحدثة + بيانات معالج الإعدادات الوصفية.

  </Accordion>
</AccordionGroup>

## الملء الخلفي وإعادة الضبط في واجهة Dreams

يتضمن مشهد Dreams في Control UI إجراءات **الملء الخلفي** و**إعادة الضبط** و**مسح المؤسس** لسير عمل Dreaming المؤسس. تستخدم هذه الإجراءات طرق RPC بأسلوب Gateway doctor، لكنها **ليست** جزءا من إصلاح/ترحيل CLI الخاص بـ `openclaw doctor`.

ما تفعله:

- يفحص **الملء الخلفي** ملفات `memory/YYYY-MM-DD.md` التاريخية في مساحة العمل النشطة، ويشغل مرور يوميات REM المؤسس، ويكتب إدخالات ملء خلفي قابلة للعكس في `DREAMS.md`.
- تزيل **إعادة الضبط** إدخالات يوميات الملء الخلفي الموسومة تلك فقط من `DREAMS.md`.
- يزيل **مسح المؤسس** فقط الإدخالات المرحلية قصيرة الأمد المخصصة للمؤسس فقط، التي جاءت من إعادة تشغيل تاريخية ولم تجمع بعد استدعاء حيا أو دعما يوميا.

ما لا تفعله **بمفردها**:

- لا تعدل `MEMORY.md`
- لا تشغل عمليات ترحيل doctor كاملة
- لا تضع المرشحين المؤسسين تلقائيا في مخزن الترويج الحي قصير الأمد إلا إذا شغلت مسار CLI المرحلي صراحة أولا

إذا أردت أن تؤثر إعادة التشغيل التاريخية المؤسسة في مسار الترويج العميق العادي، فاستخدم تدفق CLI بدلا من ذلك:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

يضع ذلك المرشحين الدائمين المؤسسين في مخزن Dreaming قصير الأمد مع إبقاء `DREAMS.md` كسطح المراجعة.

## السلوك التفصيلي والمبررات

<AccordionGroup>
  <Accordion title="0. تحديث اختياري (تثبيتات git)">
    إذا كان هذا checkout من git وكان doctor يعمل تفاعليا، فسيعرض التحديث (fetch/rebase/build) قبل تشغيل doctor.
  </Accordion>
  <Accordion title="1. تطبيع الإعدادات">
    إذا كانت الإعدادات تحتوي على أشكال قيم قديمة (على سبيل المثال `messages.ackReaction` دون تجاوز خاص بالقناة)، فإن doctor يطبعها إلى المخطط الحالي.

    يتضمن ذلك حقول Talk المسطحة القديمة. إعداد Talk العام الحالي هو `talk.provider` + `talk.providers.<provider>`. يعيد Doctor كتابة أشكال `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` القديمة إلى خريطة المزود.

    يحذر Doctor أيضا عندما تكون `plugins.allow` غير فارغة وتستخدم سياسة الأدوات
    إدخالات أدوات عامة أو مملوكة لـ Plugin. يطابق `tools.allow: ["*"]` فقط الأدوات
    من Plugins التي يتم تحميلها فعليا؛ ولا يتجاوز قائمة سماح Plugin الحصرية.

  </Accordion>
  <Accordion title="2. عمليات ترحيل مفاتيح الإعدادات القديمة">
    عندما تحتوي الإعدادات على مفاتيح مهملة، ترفض الأوامر الأخرى التشغيل وتطلب منك تشغيل `openclaw doctor`.

    سيقوم Doctor بما يلي:

    - شرح المفاتيح القديمة التي تم العثور عليها.
    - عرض الترحيل الذي طبقه.
    - إعادة كتابة `~/.openclaw/openclaw.json` بالمخطط المحدث.

    يشغل Gateway أيضا عمليات ترحيل doctor تلقائيا عند بدء التشغيل عندما يكتشف تنسيق إعدادات قديما، لذلك تصلح الإعدادات القديمة دون تدخل يدوي. تعالج عمليات ترحيل مخزن وظائف Cron بواسطة `openclaw doctor --fix`.

    عمليات الترحيل الحالية:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` على المستوى الأعلى
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` القديمة → `talk.provider` + `talk.providers.<provider>`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` و`messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` و`messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` و`plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` و`providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - بالنسبة إلى القنوات التي تحتوي على `accounts` مسماة لكن لا تزال لديها قيم قناة على المستوى الأعلى لحساب واحد، انقل تلك القيم scoped للحساب إلى الحساب المرقّى المختار لتلك القناة (`accounts.default` لمعظم القنوات؛ ويمكن لـ Matrix الاحتفاظ بهدف مسمى/افتراضي مطابق موجود)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - أزِل `agents.defaults.llm`؛ استخدم `models.providers.<id>.timeoutSeconds` لمهل المزوّد/النموذج البطيئة
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - أزِل `browser.relayBindHost` (إعداد ترحيل extension قديم)
    - `models.providers.*.api: "openai"` القديم → `"openai-completions"` (يتجاوز بدء تشغيل Gateway أيضًا المزوّدين الذين تم تعيين `api` لديهم إلى قيمة enum مستقبلية أو غير معروفة بدلًا من الفشل المغلق)

    تتضمن تحذيرات doctor أيضًا إرشادات الحساب الافتراضي للقنوات متعددة الحسابات:

    - إذا تم تكوين إدخالين أو أكثر من `channels.<channel>.accounts` بدون `channels.<channel>.defaultAccount` أو `accounts.default`، يحذّر doctor من أن توجيه fallback قد يختار حسابًا غير متوقع.
    - إذا تم تعيين `channels.<channel>.defaultAccount` إلى معرّف حساب غير معروف، يحذّر doctor ويسرد معرّفات الحسابات المكوّنة.

  </Accordion>
  <Accordion title="2b. تجاوزات مزوّد OpenCode">
    إذا أضفت `models.providers.opencode` أو `opencode-zen` أو `opencode-go` يدويًا، فإنه يتجاوز كتالوج OpenCode المدمج من `@mariozechner/pi-ai`. قد يفرض ذلك النماذج على API الخطأ أو يصفر التكاليف. يحذّر doctor لكي تتمكن من إزالة التجاوز واستعادة توجيه API والتكاليف لكل نموذج.
  </Accordion>
  <Accordion title="2c. ترحيل المتصفح وجاهزية Chrome MCP">
    إذا كان تكوين المتصفح لديك لا يزال يشير إلى مسار Chrome extension الذي تمت إزالته، فإن doctor يطبّعه إلى نموذج إرفاق Chrome MCP المحلي للمضيف الحالي:

    - يصبح `browser.profiles.*.driver: "extension"` هو `"existing-session"`
    - تتم إزالة `browser.relayBindHost`

    يدقق doctor أيضًا مسار Chrome MCP المحلي للمضيف عند استخدام `defaultProfile: "user"` أو ملف تعريف `existing-session` مكوّن:

    - يتحقق مما إذا كان Google Chrome مثبتًا على المضيف نفسه لملفات التعريف الافتراضية ذات الاتصال التلقائي
    - يتحقق من إصدار Chrome المكتشف ويحذّر عندما يكون أقل من Chrome 144
    - يذكّرك بتمكين التصحيح عن بُعد في صفحة فحص المتصفح (على سبيل المثال `chrome://inspect/#remote-debugging` أو `brave://inspect/#remote-debugging` أو `edge://inspect/#remote-debugging`)

    لا يستطيع doctor تمكين الإعداد الخاص بجانب Chrome نيابة عنك. لا يزال Chrome MCP المحلي للمضيف يتطلب:

    - متصفحًا مستندًا إلى Chromium بإصدار 144+ على مضيف gateway/node
    - تشغيل المتصفح محليًا
    - تمكين التصحيح عن بُعد في ذلك المتصفح
    - الموافقة على أول مطالبة موافقة للإرفاق في المتصفح

    تتعلق الجاهزية هنا فقط بمتطلبات الإرفاق المحلي. يحتفظ Existing-session بحدود مسارات Chrome MCP الحالية؛ ولا تزال المسارات المتقدمة مثل `responsebody` وتصدير PDF واعتراض التنزيل والإجراءات الدفعية تتطلب متصفحًا مُدارًا أو ملف تعريف CDP خامًا.

    لا ينطبق هذا الفحص على Docker أو sandbox أو remote-browser أو تدفقات headless الأخرى. تواصل تلك التدفقات استخدام CDP خام.

  </Accordion>
  <Accordion title="2d. متطلبات OAuth TLS الأساسية">
    عند تكوين ملف تعريف OpenAI Codex OAuth، يفحص doctor نقطة نهاية تفويض OpenAI للتحقق من أن حزمة Node/OpenSSL TLS المحلية يمكنها التحقق من سلسلة الشهادات. إذا فشل الفحص بسبب خطأ شهادة (على سبيل المثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` أو شهادة منتهية الصلاحية أو شهادة موقعة ذاتيًا)، يطبع doctor إرشادات إصلاح خاصة بالنظام الأساسي. على macOS مع Homebrew Node، يكون الإصلاح عادةً `brew postinstall ca-certificates`. مع `--deep`، يعمل الفحص حتى إذا كان Gateway سليمًا.
  </Accordion>
  <Accordion title="2e. تجاوزات مزوّد Codex OAuth">
    إذا سبق أن أضفت إعدادات نقل OpenAI قديمة ضمن `models.providers.openai-codex`، فقد تحجب مسار مزوّد Codex OAuth المدمج الذي تستخدمه الإصدارات الأحدث تلقائيًا. يحذّر doctor عندما يرى إعدادات النقل القديمة هذه إلى جانب Codex OAuth لكي تتمكن من إزالة أو إعادة كتابة تجاوز النقل القديم واستعادة سلوك التوجيه/fallback المدمج. لا تزال الوكلاء المخصصون وتجاوزات الرؤوس فقط مدعومة ولا تؤدي إلى هذا التحذير.
  </Accordion>
  <Accordion title="2f. تحذيرات مسار Codex plugin">
    عند تمكين Codex plugin المضمّن، يتحقق doctor أيضًا مما إذا كانت مراجع نموذج `openai-codex/*` الأساسية لا تزال تُحل عبر مشغّل PI الافتراضي. هذه المجموعة صالحة عندما تريد مصادقة Codex OAuth/اشتراك عبر PI، لكن من السهل الخلط بينها وبين harness خادم تطبيق Codex الأصلي. يحذّر doctor ويشير إلى الشكل الصريح لخادم التطبيق: `openai/*` بالإضافة إلى `agentRuntime.id: "codex"` أو `OPENCLAW_AGENT_RUNTIME=codex`.

    لا يصلح doctor هذا تلقائيًا لأن كلا المسارين صالحان:

    - `openai-codex/*` + PI يعني "استخدم مصادقة Codex OAuth/اشتراك عبر مشغّل OpenClaw العادي."
    - `openai/*` + `agentRuntime.id: "codex"` يعني "شغّل الدورة المضمنة عبر خادم تطبيق Codex الأصلي."
    - `/codex ...` يعني "تحكم في محادثة Codex أصلية من الدردشة أو اربطها."
    - `/acp ...` أو `runtime: "acp"` يعني "استخدم مهايئ ACP/acpx الخارجي."

    إذا ظهر التحذير، فاختر المسار الذي قصدته وحرّر التكوين يدويًا. أبقِ التحذير كما هو عندما يكون PI Codex OAuth مقصودًا.

  </Accordion>
  <Accordion title="3. عمليات ترحيل الحالة القديمة (تخطيط القرص)">
    يستطيع doctor ترحيل التخطيطات الأقدم على القرص إلى البنية الحالية:

    - مخزن الجلسات + النصوص:
      - من `~/.openclaw/sessions/` إلى `~/.openclaw/agents/<agentId>/sessions/`
    - دليل Agent:
      - من `~/.openclaw/agent/` إلى `~/.openclaw/agents/<agentId>/agent/`
    - حالة مصادقة WhatsApp (Baileys):
      - من `~/.openclaw/credentials/*.json` القديمة (باستثناء `oauth.json`)
      - إلى `~/.openclaw/credentials/whatsapp/<accountId>/...` (معرّف الحساب الافتراضي: `default`)

    عمليات الترحيل هذه تبذل أفضل جهد وهي idempotent؛ وسيصدر doctor تحذيرات عندما يترك أي مجلدات قديمة كنسخ احتياطية. كما يرحّل Gateway/CLI تلقائيًا الجلسات القديمة + دليل agent عند بدء التشغيل بحيث يستقر السجل/المصادقة/النماذج في المسار لكل agent بدون تشغيل doctor يدويًا. تقصد OpenClaw ترحيل مصادقة WhatsApp عبر `openclaw doctor` فقط. تقارن عملية تطبيع مزوّد/خريطة مزوّد Talk الآن بالمساواة البنيوية، لذا لم تعد الاختلافات في ترتيب المفاتيح فقط تؤدي إلى تكرار تغييرات `doctor --fix` بلا أثر.

  </Accordion>
  <Accordion title="3a. عمليات ترحيل بيان Plugin القديمة">
    يفحص doctor جميع بيانات Plugins المثبتة بحثًا عن مفاتيح قدرات على المستوى الأعلى مهملة (`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders`). عند العثور عليها، يعرض نقلها إلى كائن `contracts` وإعادة كتابة ملف البيان في مكانه. هذه الهجرة idempotent؛ إذا كان مفتاح `contracts` يحتوي بالفعل على القيم نفسها، فسيتم حذف المفتاح القديم دون تكرار البيانات.
  </Accordion>
  <Accordion title="3b. عمليات ترحيل مخزن Cron القديمة">
    يتحقق doctor أيضًا من مخزن مهام cron (`~/.openclaw/cron/jobs.json` افتراضيًا، أو `cron.store` عند تجاوزه) بحثًا عن أشكال المهام القديمة التي لا يزال المجدول يقبلها للتوافق.

    تتضمن تنظيفات cron الحالية:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - حقول payload على المستوى الأعلى (`message`، `model`، `thinking`، ...) → `payload`
    - حقول التسليم على المستوى الأعلى (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - أسماء payload المستعارة لتسليم `provider` → `delivery.channel` صريح
    - مهام webhook fallback القديمة البسيطة `notify: true` → `delivery.mode="webhook"` صريح مع `delivery.to=cron.webhook`

    لا يرحّل doctor تلقائيًا مهام `notify: true` إلا عندما يمكنه فعل ذلك دون تغيير السلوك. إذا جمعت مهمة بين notify fallback قديم ووضع تسليم موجود غير webhook، يحذّر doctor ويترك تلك المهمة للمراجعة اليدوية.

    على Linux، يحذّر doctor أيضًا عندما لا يزال crontab الخاص بالمستخدم يستدعي `~/.openclaw/bin/ensure-whatsapp.sh` القديم. لا تتم صيانة هذا السكربت المحلي للمضيف بواسطة OpenClaw الحالي، ويمكنه كتابة رسائل `Gateway inactive` خاطئة إلى `~/.openclaw/logs/whatsapp-health.log` عندما لا يستطيع cron الوصول إلى ناقل مستخدم systemd. أزِل إدخال crontab القديم باستخدام `crontab -e`؛ واستخدم `openclaw channels status --probe` و`openclaw doctor` و`openclaw gateway status` لفحوصات السلامة الحالية.

  </Accordion>
  <Accordion title="3c. تنظيف قفل الجلسة">
    يفحص Doctor كل دليل جلسة وكيل بحثًا عن ملفات قفل كتابة قديمة — وهي ملفات تُترك خلفها عندما تنتهي جلسة بشكل غير طبيعي. لكل ملف قفل يتم العثور عليه، يبلّغ عن: المسار، وPID، وما إذا كان PID لا يزال حيًا، وعمر القفل، وما إذا كان يُعد قديمًا (PID ميت أو أقدم من 30 دقيقة). في وضع `--fix` / `--repair` يزيل ملفات القفل القديمة تلقائيًا؛ وإلا فإنه يطبع ملاحظة ويوجهك إلى إعادة التشغيل باستخدام `--fix`.
  </Accordion>
  <Accordion title="3d. إصلاح فرع نص جلسة المحادثة">
    يفحص Doctor ملفات JSONL لجلسات الوكلاء بحثًا عن شكل الفرع المكرر الذي أنشأه خلل إعادة كتابة نص الموجه في 2026.4.24: دور مستخدم متروك يحتوي على سياق تشغيل داخلي من OpenClaw مع فرع شقيق نشط يحتوي على موجه المستخدم المرئي نفسه. في وضع `--fix` / `--repair`، ينسخ Doctor كل ملف متأثر احتياطيًا بجانب الأصل ويعيد كتابة نص المحادثة إلى الفرع النشط بحيث لا يرى تاريخ Gateway وقراء الذاكرة أدوارًا مكررة بعد الآن.
  </Accordion>
  <Accordion title="4. فحوصات سلامة الحالة (استمرارية الجلسات، والتوجيه، والسلامة)">
    دليل الحالة هو جذع الدماغ التشغيلي. إذا اختفى، فستفقد الجلسات وبيانات الاعتماد والسجلات والإعدادات (ما لم تكن لديك نسخ احتياطية في مكان آخر).

    يتحقق Doctor من:

    - **دليل الحالة مفقود**: يحذر من فقدان كارثي للحالة، ويطلب إعادة إنشاء الدليل، ويذكرك بأنه لا يستطيع استعادة البيانات المفقودة.
    - **أذونات دليل الحالة**: يتحقق من قابلية الكتابة؛ ويعرض إصلاح الأذونات (ويصدر تلميح `chown` عند اكتشاف عدم تطابق المالك/المجموعة).
    - **دليل حالة متزامن مع السحابة على macOS**: يحذر عندما تُحل الحالة تحت iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) أو `~/Library/CloudStorage/...` لأن المسارات المدعومة بالمزامنة يمكن أن تسبب إدخال/إخراج أبطأ وسباقات قفل/مزامنة.
    - **دليل حالة Linux على SD أو eMMC**: يحذر عندما تُحل الحالة إلى مصدر تركيب `mmcblk*`، لأن الإدخال/الإخراج العشوائي المدعوم ببطاقة SD أو eMMC يمكن أن يكون أبطأ ويتآكل أسرع تحت كتابات الجلسات وبيانات الاعتماد.
    - **دلائل الجلسات مفقودة**: `sessions/` ودليل مخزن الجلسات مطلوبان للاحتفاظ بالتاريخ وتجنب أعطال `ENOENT`.
    - **عدم تطابق نص المحادثة**: يحذر عندما تكون إدخالات الجلسات الحديثة تفتقد ملفات نص المحادثة.
    - **جلسة رئيسية "JSONL من سطر واحد"**: يضع علامة عندما يكون نص المحادثة الرئيسي مؤلفًا من سطر واحد فقط (التاريخ لا يتراكم).
    - **دلائل حالة متعددة**: يحذر عندما توجد عدة مجلدات `~/.openclaw` عبر دلائل المنزل أو عندما يشير `OPENCLAW_STATE_DIR` إلى مكان آخر (يمكن أن ينقسم التاريخ بين عمليات التثبيت).
    - **تذكير الوضع البعيد**: إذا كان `gateway.mode=remote`، يذكرك Doctor بتشغيله على المضيف البعيد (الحالة تعيش هناك).
    - **أذونات ملف الإعدادات**: يحذر إذا كان `~/.openclaw/openclaw.json` قابلًا للقراءة من المجموعة/العالم ويعرض تشديده إلى `600`.

  </Accordion>
  <Accordion title="5. صحة مصادقة النموذج (انتهاء OAuth)">
    يفحص Doctor ملفات تعريف OAuth في مخزن المصادقة، ويحذر عندما تكون الرموز على وشك الانتهاء/منتهية، ويمكنه تحديثها عندما يكون ذلك آمنًا. إذا كان ملف تعريف OAuth/الرمز الخاص بـ Anthropic قديمًا، فإنه يقترح مفتاح API لـ Anthropic أو مسار رمز إعداد Anthropic. تظهر مطالبات التحديث فقط عند التشغيل تفاعليًا (TTY)؛ ويتخطى `--non-interactive` محاولات التحديث.

    عندما يفشل تحديث OAuth بشكل دائم (مثل `refresh_token_reused` أو `invalid_grant` أو عندما يخبرك موفر بتسجيل الدخول مرة أخرى)، يبلّغ Doctor بأن إعادة المصادقة مطلوبة ويطبع أمر `openclaw models auth login --provider ...` الدقيق المطلوب تشغيله.

    يبلّغ Doctor أيضًا عن ملفات تعريف مصادقة غير قابلة للاستخدام مؤقتًا بسبب:

    - فترات تهدئة قصيرة (حدود المعدل/انتهاءات المهلة/إخفاقات المصادقة)
    - تعطيلات أطول (إخفاقات الفوترة/الرصيد)

  </Accordion>
  <Accordion title="6. التحقق من نموذج الخطافات">
    إذا تم تعيين `hooks.gmail.model`، يتحقق Doctor من مرجع النموذج مقابل الفهرس وقائمة السماح ويحذر عندما لا يمكن حله أو عندما يكون غير مسموح به.
  </Accordion>
  <Accordion title="7. إصلاح صورة صندوق الرمل">
    عندما يكون العزل مفعّلًا، يتحقق Doctor من صور Docker ويعرض بناءها أو التبديل إلى الأسماء القديمة إذا كانت الصورة الحالية مفقودة.
  </Accordion>
  <Accordion title="7b. تنظيف تثبيت Plugin">
    يزيل Doctor حالة تهيئة اعتماد Plugin القديمة التي أنشأها OpenClaw في وضع `openclaw doctor --fix` / `openclaw doctor --repair`. يشمل ذلك جذور الاعتمادات المولدة القديمة، ودلائل مراحل التثبيت القديمة، والمخلفات المحلية للحزم من كود إصلاح اعتمادات الـ Plugin المضمنة الأقدم.

    يمكن لـ Doctor أيضًا إعادة تثبيت Plugins القابلة للتنزيل والمكوّنة عندما تشير إليها الإعدادات ولكن لا يستطيع سجل الـ Plugin المحلي العثور عليها. بالنسبة إلى إخراج الـ Plugin المضمنة إلى الخارج في 2026.5.2، يثبت Doctor تلقائيًا Plugins القابلة للتنزيل التي تستخدمها الإعدادات الحالية بالفعل، ثم يعتمد على `meta.lastTouchedVersion` لتشغيل تمريرة الإصدار تلك مرة واحدة فقط. لا يشغل بدء Gateway وإعادة تحميل الإعدادات مديري الحزم؛ تظل عمليات تثبيت الـ Plugin عملًا صريحًا عبر doctor/install/update.

  </Accordion>
  <Accordion title="8. تلميحات ترحيل خدمات Gateway وتنظيفها">
    يكتشف Doctor خدمات Gateway القديمة (launchd/systemd/schtasks) ويعرض إزالتها وتثبيت خدمة OpenClaw باستخدام منفذ Gateway الحالي. يمكنه أيضًا فحص خدمات إضافية شبيهة بـ Gateway وطباعة تلميحات تنظيف. تُعد خدمات Gateway الخاصة بـ OpenClaw المسماة بملفات تعريف خدمات من الدرجة الأولى ولا توسم بأنها "إضافية".

    على Linux، إذا كانت خدمة Gateway على مستوى المستخدم مفقودة لكن توجد خدمة Gateway لـ OpenClaw على مستوى النظام، فلا يثبت Doctor خدمة ثانية على مستوى المستخدم تلقائيًا. افحص باستخدام `openclaw gateway status --deep` أو `openclaw doctor --deep`، ثم أزل النسخة المكررة أو عيّن `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يكون مشرف نظام هو مالك دورة حياة Gateway.

  </Accordion>
  <Accordion title="8b. ترحيل بدء تشغيل Matrix">
    عندما يكون لدى حساب قناة Matrix ترحيل حالة قديم معلق أو قابل للتنفيذ، ينشئ Doctor (في وضع `--fix` / `--repair`) لقطة قبل الترحيل ثم يشغل خطوات الترحيل بأفضل جهد: ترحيل حالة Matrix القديمة وتحضير الحالة المشفرة القديمة. كلتا الخطوتين غير قاتلتين؛ تُسجل الأخطاء ويستمر بدء التشغيل. في وضع القراءة فقط (`openclaw doctor` بدون `--fix`) يتم تخطي هذا الفحص بالكامل.
  </Accordion>
  <Accordion title="8c. اقتران الجهاز وانحراف المصادقة">
    يفحص Doctor الآن حالة اقتران الأجهزة كجزء من تمريرة الصحة العادية.

    ما يبلّغ عنه:

    - طلبات اقتران أول مرة معلقة
    - ترقيات أدوار معلقة لأجهزة مقترنة بالفعل
    - ترقيات نطاقات معلقة لأجهزة مقترنة بالفعل
    - إصلاحات عدم تطابق المفتاح العام حيث لا يزال معرف الجهاز مطابقًا لكن هوية الجهاز لم تعد تطابق السجل المعتمد
    - سجلات مقترنة تفتقد رمزًا نشطًا لدور معتمد
    - رموز مقترنة انحرفت نطاقاتها خارج خط أساس الاقتران المعتمد
    - إدخالات رموز أجهزة مخزنة مؤقتًا محليًا للجهاز الحالي تسبق تدوير رمز من جهة Gateway أو تحمل بيانات وصفية قديمة للنطاقات

    لا يوافق Doctor تلقائيًا على طلبات الاقتران ولا يدور رموز الأجهزة تلقائيًا. بدلًا من ذلك يطبع الخطوات التالية الدقيقة:

    - افحص الطلبات المعلقة باستخدام `openclaw devices list`
    - وافق على الطلب الدقيق باستخدام `openclaw devices approve <requestId>`
    - دوّر رمزًا جديدًا باستخدام `openclaw devices rotate --device <deviceId> --role <role>`
    - أزل سجلًا قديمًا وأعد الموافقة عليه باستخدام `openclaw devices remove <deviceId>`

    هذا يغلق الثغرة الشائعة "مقترن بالفعل ولكن لا يزال يظهر طلب الاقتران": يميز Doctor الآن بين اقتران أول مرة وترقيات الدور/النطاق المعلقة وانحراف الرمز/هوية الجهاز القديمة.

  </Accordion>
  <Accordion title="9. تحذيرات الأمان">
    يصدر Doctor تحذيرات عندما يكون موفر مفتوحًا للرسائل الخاصة بدون قائمة سماح، أو عندما تُكوّن سياسة بطريقة خطرة.
  </Accordion>
  <Accordion title="10. بقاء systemd (Linux)">
    إذا كان يعمل كخدمة مستخدم systemd، يضمن Doctor تفعيل البقاء بحيث يظل Gateway حيًا بعد تسجيل الخروج.
  </Accordion>
  <Accordion title="11. حالة مساحة العمل (Skills، وPlugins، والدلائل القديمة)">
    يطبع Doctor ملخصًا لحالة مساحة العمل للوكيل الافتراضي:

    - **حالة Skills**: يحصي المهارات المؤهلة، ومفقودة المتطلبات، والمحظورة بقائمة السماح.
    - **دلائل مساحة العمل القديمة**: يحذر عندما توجد `~/openclaw` أو دلائل مساحة عمل قديمة أخرى بجانب مساحة العمل الحالية.
    - **حالة Plugin**: يحصي Plugins المفعّلة/المعطلة/ذات الأخطاء؛ ويسرد معرفات Plugin لأي أخطاء؛ ويبلّغ عن قدرات Plugin الحزمة.
    - **تحذيرات توافق Plugin**: يضع علامات على Plugins التي لديها مشكلات توافق مع وقت التشغيل الحالي.
    - **تشخيصات Plugin**: يعرض أي تحذيرات أو أخطاء وقت تحميل صادرة عن سجل الـ Plugin.

  </Accordion>
  <Accordion title="11b. حجم ملف التمهيد">
    يتحقق Doctor مما إذا كانت ملفات تمهيد مساحة العمل (مثل `AGENTS.md` أو `CLAUDE.md` أو ملفات سياق أخرى محقونة) قريبة من ميزانية الأحرف المكوّنة أو تتجاوزها. يبلّغ عن عدد الأحرف الخام مقابل المحقونة لكل ملف، ونسبة الاقتطاع، وسبب الاقتطاع (`max/file` أو `max/total`)، وإجمالي الأحرف المحقونة كنسبة من إجمالي الميزانية. عندما تُقتطع الملفات أو تقترب من الحد، يطبع Doctor نصائح لضبط `agents.defaults.bootstrapMaxChars` و`agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. تنظيف Plugin قناة قديم">
    عندما يزيل `openclaw doctor --fix` Plugin قناة مفقودًا، فإنه يزيل أيضًا الإعدادات المعلقة ذات نطاق القناة التي كانت تشير إلى ذلك الـ Plugin: إدخالات `channels.<id>`، وأهداف Heartbeat التي سمت القناة، وتجاوزات `agents.*.models["<channel>/*"]`. يمنع هذا حلقات إقلاع Gateway حيث يكون وقت تشغيل القناة قد اختفى لكن الإعدادات لا تزال تطلب من Gateway الارتباط به.
  </Accordion>
  <Accordion title="11c. إكمال الصدفة">
    يتحقق Doctor مما إذا كان إكمال التبويب مثبتًا للصدفة الحالية (zsh أو bash أو fish أو PowerShell):

    - إذا كان ملف تعريف الصدفة يستخدم نمط إكمال ديناميكيًا بطيئًا (`source <(openclaw completion ...)`)، يرقيه Doctor إلى متغير الملف المخزن مؤقتًا الأسرع.
    - إذا كان الإكمال مكوّنًا في ملف التعريف لكن ملف الذاكرة المؤقتة مفقود، يعيد Doctor توليد الذاكرة المؤقتة تلقائيًا.
    - إذا لم يكن هناك أي إكمال مكوّن، يطلب Doctor تثبيته (الوضع التفاعلي فقط؛ يتم تخطيه مع `--non-interactive`).

    شغّل `openclaw completion --write-state` لإعادة توليد الذاكرة المؤقتة يدويًا.

  </Accordion>
  <Accordion title="12. فحوصات مصادقة Gateway (الرمز المحلي)">
    يتحقق Doctor من جاهزية مصادقة رمز Gateway المحلي.

    - إذا كان وضع الرمز يحتاج إلى رمز ولا يوجد مصدر رمز، يعرض Doctor توليد واحد.
    - إذا كان `gateway.auth.token` مُدارًا عبر SecretRef لكنه غير متاح، يحذر Doctor ولا يستبدله بنص صريح.
    - يفرض `openclaw doctor --generate-gateway-token` التوليد فقط عندما لا يكون هناك SecretRef رمز مكوّن.

  </Accordion>
  <Accordion title="12b. إصلاحات قراءة فقط واعية بـ SecretRef">
    تحتاج بعض تدفقات الإصلاح إلى فحص بيانات الاعتماد المكوّنة بدون إضعاف سلوك الفشل السريع وقت التشغيل.

    - يستخدم `openclaw doctor --fix` الآن نموذج ملخص SecretRef للقراءة فقط نفسه الذي تستخدمه أوامر عائلة الحالة لإصلاحات الإعدادات المستهدفة.
    - مثال: يحاول إصلاح Telegram `allowFrom` / `groupAllowFrom` `@username` استخدام بيانات اعتماد الروبوت المكوّنة عندما تكون متاحة.
    - إذا كان رمز روبوت Telegram مكوّنًا عبر SecretRef لكنه غير متاح في مسار الأمر الحالي، يبلّغ Doctor بأن بيانات الاعتماد مكوّنة-لكن-غير-متاحة ويتخطى الحل التلقائي بدلًا من التعطل أو الإبلاغ خطأً بأن الرمز مفقود.

  </Accordion>
  <Accordion title="13. فحص صحة Gateway + إعادة التشغيل">
    تجري أداة الفحص فحص صحة وتعرض إعادة تشغيل Gateway عندما يبدو غير سليم.
  </Accordion>
  <Accordion title="13ب. جاهزية بحث الذاكرة">
    تتحقق أداة الفحص مما إذا كان موفر تضمين بحث الذاكرة المكوّن جاهزًا للوكيل الافتراضي. يعتمد السلوك على الخلفية والموفر المكوّنين:

    - **خلفية QMD**: تتحقق مما إذا كان ملف `qmd` الثنائي متاحًا وقابلًا للبدء. إذا لم يكن كذلك، تطبع إرشادات إصلاح تشمل حزمة npm وخيار مسار ثنائي يدوي.
    - **موفر محلي صريح**: يتحقق من وجود ملف نموذج محلي أو عنوان URL معروف لنموذج بعيد/قابل للتنزيل. إذا كان مفقودًا، يقترح التبديل إلى موفر بعيد.
    - **موفر بعيد صريح** (`openai`، `voyage`، إلخ): يتحقق من وجود مفتاح API في البيئة أو مخزن المصادقة. يطبع تلميحات إصلاح قابلة للتنفيذ إذا كان مفقودًا.
    - **موفر تلقائي**: يتحقق من توفر النموذج المحلي أولًا، ثم يجرّب كل موفر بعيد وفق ترتيب الاختيار التلقائي.

    عندما تتوفر نتيجة مسبار Gateway مخزنة مؤقتًا (كان Gateway سليمًا وقت الفحص)، تقارن أداة الفحص نتيجتها مع الإعداد المرئي عبر CLI وتلاحظ أي اختلاف. لا تبدأ أداة الفحص اختبار تضمين جديدًا في المسار الافتراضي؛ استخدم أمر حالة الذاكرة العميق عندما تريد فحص موفر مباشرًا.

    استخدم `openclaw memory status --deep` للتحقق من جاهزية التضمين وقت التشغيل.

  </Accordion>
  <Accordion title="14. تحذيرات حالة القناة">
    إذا كان Gateway سليمًا، تجري أداة الفحص مسبار حالة قناة وتبلّغ عن التحذيرات مع إصلاحات مقترحة.
  </Accordion>
  <Accordion title="15. تدقيق إعداد المشرف + الإصلاح">
    تتحقق أداة الفحص من إعداد المشرف المثبت (launchd/systemd/schtasks) بحثًا عن الإعدادات الافتراضية المفقودة أو القديمة (مثل اعتماديات systemd network-online وتأخير إعادة التشغيل). عندما تجد عدم تطابق، توصي بتحديث ويمكنها إعادة كتابة ملف الخدمة/المهمة إلى الإعدادات الافتراضية الحالية.

    ملاحظات:

    - يطلب `openclaw doctor` التأكيد قبل إعادة كتابة إعداد المشرف.
    - يقبل `openclaw doctor --yes` مطالبات الإصلاح الافتراضية.
    - يطبق `openclaw doctor --repair` الإصلاحات الموصى بها دون مطالبات.
    - يكتب `openclaw doctor --repair --force` فوق إعدادات المشرف المخصصة.
    - يبقي `OPENCLAW_SERVICE_REPAIR_POLICY=external` أداة الفحص في وضع القراءة فقط لدورة حياة خدمة Gateway. لا تزال تبلّغ عن صحة الخدمة وتجري إصلاحات غير خدمية، لكنها تتخطى تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة، وإعادة كتابة إعدادات المشرف، وتنظيف الخدمة القديمة لأن مشرفًا خارجيًا يملك تلك الدورة الحياتية.
    - على Linux، لا تعيد أداة الفحص كتابة بيانات الأمر/نقطة الدخول الوصفية بينما تكون وحدة Gateway المطابقة في systemd نشطة. كما تتجاهل وحدات Gateway الإضافية غير القديمة وغير النشطة أثناء فحص الخدمات المكررة حتى لا تنشئ ملفات الخدمات المصاحبة ضجيج تنظيف.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان `gateway.auth.token` مدارًا عبر SecretRef، فإن تثبيت/إصلاح خدمة أداة الفحص يتحقق من SecretRef لكنه لا يحفظ قيم الرمز النصية الصريحة المحلولة في بيانات بيئة خدمة المشرف الوصفية.
    - تكتشف أداة الفحص قيم بيئة الخدمة المُدارة والمدعومة بـ `.env`/SecretRef التي ضمّنتها عمليات تثبيت LaunchAgent أو systemd أو Windows Scheduled Task القديمة inline وتعيد كتابة بيانات الخدمة الوصفية بحيث تُحمّل تلك القيم من مصدر وقت التشغيل بدلًا من تعريف المشرف.
    - تكتشف أداة الفحص عندما لا يزال أمر الخدمة يثبت `--port` قديمًا بعد تغيير `gateway.port` وتعيد كتابة بيانات الخدمة الوصفية إلى المنفذ الحالي.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef للرمز المكوّن غير محلول، تمنع أداة الفحص مسار التثبيت/الإصلاح مع إرشادات قابلة للتنفيذ.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين وكان `gateway.auth.mode` غير معيّن، تمنع أداة الفحص التثبيت/الإصلاح حتى يتم تعيين الوضع صراحةً.
    - بالنسبة لوحدات systemd الخاصة بمستخدم Linux، تشمل فحوصات انحراف الرمز في أداة الفحص الآن مصادر `Environment=` و`EnvironmentFile=` عند مقارنة بيانات مصادقة الخدمة الوصفية.
    - ترفض إصلاحات خدمة أداة الفحص إعادة كتابة خدمة Gateway أو إيقافها أو إعادة تشغيلها من ملف OpenClaw ثنائي أقدم عندما يكون الإعداد قد كُتب آخر مرة بواسطة إصدار أحدث. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - يمكنك دائمًا فرض إعادة كتابة كاملة عبر `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. تشخيصات وقت تشغيل Gateway + المنفذ">
    تفحص أداة الفحص وقت تشغيل الخدمة (PID، وآخر حالة خروج) وتحذر عندما تكون الخدمة مثبتة لكنها لا تعمل فعليًا. كما تتحقق من تعارضات المنافذ على منفذ Gateway (الافتراضي `18789`) وتبلّغ عن الأسباب المحتملة (Gateway قيد التشغيل بالفعل، نفق SSH).
  </Accordion>
  <Accordion title="17. أفضل ممارسات وقت تشغيل Gateway">
    تحذر أداة الفحص عندما تعمل خدمة Gateway على Bun أو مسار Node مُدار بالإصدارات (`nvm`، `fnm`، `volta`، `asdf`، إلخ). تتطلب قنوات WhatsApp + Telegram استخدام Node، ويمكن أن تتعطل مسارات مديري الإصدارات بعد الترقيات لأن الخدمة لا تحمّل تهيئة الصدفة لديك. تعرض أداة الفحص الترحيل إلى تثبيت Node على مستوى النظام عند توفره (Homebrew/apt/choco).

    تستخدم LaunchAgents في macOS المثبتة أو المُصلحة حديثًا PATH نظاميًا قياسيًا (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) بدلًا من نسخ PATH الخاص بالصدفة التفاعلية، بحيث لا تغيّر أدلة Volta وasdf وfnm وpnpm ومديري الإصدارات الآخرين أي عمليات Node فرعية يتم حلها. لا تزال خدمات Linux تحتفظ بجذور البيئة الصريحة (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) وأدلة user-bin مستقرة، لكن أدلة مديري الإصدارات الاحتياطية المتوقعة لا تُكتب إلى PATH الخاص بالخدمة إلا عندما تكون تلك الأدلة موجودة على القرص.

  </Accordion>
  <Accordion title="18. كتابة الإعداد + بيانات المعالج الوصفية">
    تحفظ أداة الفحص أي تغييرات في الإعداد وتختم بيانات المعالج الوصفية لتسجيل تشغيل أداة الفحص.
  </Accordion>
  <Accordion title="19. نصائح مساحة العمل (النسخ الاحتياطي + نظام الذاكرة)">
    تقترح أداة الفحص نظام ذاكرة لمساحة العمل عندما يكون مفقودًا وتطبع نصيحة نسخ احتياطي إذا لم تكن مساحة العمل ضمن git بالفعل.

    راجع [/concepts/agent-workspace](/ar/concepts/agent-workspace) للحصول على دليل كامل لبنية مساحة العمل والنسخ الاحتياطي عبر git (يوصى باستخدام GitHub أو GitLab خاص).

  </Accordion>
</AccordionGroup>

## ذو صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
