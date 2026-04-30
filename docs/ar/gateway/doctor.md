---
read_when:
    - إضافة عمليات ترحيل التشخيص أو تعديلها
    - إدخال تغييرات كاسرة في الإعدادات
sidebarTitle: Doctor
summary: 'أمر Doctor: فحوصات الصحة، وترحيلات الإعدادات، وخطوات الإصلاح'
title: أداة التشخيص
x-i18n:
    generated_at: "2026-04-30T16:29:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89150fe2b2848f1f168b42ca6b240bc0e6a0edee4f1bcad7f79d297face9c95e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` هو أداة الإصلاح والترحيل في OpenClaw. يصلح الإعدادات/الحالة القديمة، ويفحص السلامة، ويوفر خطوات إصلاح قابلة للتنفيذ.

## بدء سريع

```bash
openclaw doctor
```

### أوضاع بلا واجهة وأتمتة

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    اقبل القيم الافتراضية دون مطالبة (بما في ذلك خطوات إصلاح إعادة التشغيل/الخدمة/الصندوق الرملي عند انطباقها).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    طبّق الإصلاحات الموصى بها دون مطالبة (الإصلاحات + إعادة التشغيل حيثما كان ذلك آمناً).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    طبّق الإصلاحات العدوانية أيضاً (يستبدل إعدادات المشرف المخصصة).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    شغّل دون مطالبات وطبّق الترحيلات الآمنة فقط (تطبيع الإعدادات + نقل الحالة على القرص). يتخطى إجراءات إعادة التشغيل/الخدمة/الصندوق الرملي التي تتطلب تأكيداً بشرياً. تعمل ترحيلات الحالة القديمة تلقائياً عند اكتشافها.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    افحص خدمات النظام بحثاً عن تثبيتات Gateway إضافية (launchd/systemd/schtasks).

  </Tab>
</Tabs>

إذا أردت مراجعة التغييرات قبل الكتابة، فافتح ملف الإعدادات أولاً:

```bash
cat ~/.openclaw/openclaw.json
```

## ما الذي يفعله (ملخص)

<AccordionGroup>
  <Accordion title="السلامة، وواجهة المستخدم، والتحديثات">
    - تحديث اختياري قبل التشغيل لتثبيتات git (تفاعلي فقط).
    - فحص حداثة بروتوكول واجهة المستخدم (يعيد بناء واجهة التحكم عندما يكون مخطط البروتوكول أحدث).
    - فحص السلامة + مطالبة بإعادة التشغيل.
    - ملخص حالة Skills (مؤهل/مفقود/محظور) وحالة Plugin.

  </Accordion>
  <Accordion title="الإعدادات والترحيلات">
    - تطبيع الإعدادات للقيم القديمة.
    - ترحيل إعداد Talk من حقول `talk.*` المسطحة القديمة إلى `talk.provider` + `talk.providers.<provider>`.
    - فحوصات ترحيل المتصفح لإعدادات إضافة Chrome القديمة وجاهزية Chrome MCP.
    - تحذيرات تجاوز موفر OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - تحذيرات حجب OAuth في Codex (`models.providers.openai-codex`).
    - فحص متطلبات OAuth TLS الأساسية لملفات OpenAI Codex OAuth.
    - ترحيل الحالة القديمة على القرص (الجلسات/دليل الوكيل/مصادقة WhatsApp).
    - ترحيل مفاتيح عقد بيان Plugin القديم (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - ترحيل مخزن Cron القديم (`jobId`, `schedule.cron`, حقول التسليم/الحمولة من المستوى الأعلى، `provider` في الحمولة، وظائف Webhook احتياطية بسيطة من نوع `notify: true`).
    - ترحيل سياسة تشغيل الوكيل القديمة إلى `agents.defaults.agentRuntime` و`agents.list[].agentRuntime`.
    - تنظيف إعدادات Plugin القديمة عندما تكون Plugins مفعّلة؛ عندما تكون `plugins.enabled=false`، تُعامل مراجع Plugin القديمة كإعداد احتواء خامل وتُحفظ.

  </Accordion>
  <Accordion title="الحالة والسلامة البنيوية">
    - فحص ملف قفل الجلسة وتنظيف الأقفال القديمة.
    - إصلاح نصوص الجلسات للفروع المكررة لإعادة كتابة الموجّه التي أنشأتها إصدارات 2026.4.24 المتأثرة.
    - اكتشاف شواهد استرداد إعادة تشغيل الوكيل الفرعي العالق، مع دعم `--fix` لمسح علامات الاسترداد المُجهض القديمة حتى لا يستمر بدء التشغيل في التعامل مع الابن كأنه مُجهض إعادة التشغيل.
    - فحوصات سلامة الحالة والأذونات (الجلسات، النصوص، دليل الحالة).
    - فحوصات أذونات ملف الإعدادات (chmod 600) عند التشغيل محلياً.
    - سلامة مصادقة النموذج: يفحص انتهاء OAuth، ويمكنه تحديث الرموز التي اقترب انتهاء صلاحيتها، ويبلغ عن حالات التهدئة/التعطيل لملف المصادقة.
    - اكتشاف دليل مساحة عمل إضافي (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway، والخدمات، والمشرفون">
    - إصلاح صورة الصندوق الرملي عندما يكون العزل بالصندوق الرملي مفعّلاً.
    - ترحيل الخدمة القديمة واكتشاف Gateway إضافي.
    - ترحيل حالة قناة Matrix القديمة (في وضع `--fix` / `--repair`).
    - فحوصات تشغيل Gateway (الخدمة مثبتة لكنها لا تعمل؛ تسمية launchd مخزنة مؤقتاً).
    - تحذيرات حالة القنوات (مفحوصة من Gateway قيد التشغيل).
    - تدقيق إعدادات المشرف (launchd/systemd/schtasks) مع إصلاح اختياري.
    - تنظيف بيئة الوكيل المضمنة لخدمات Gateway التي التقطت قيم shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` أثناء التثبيت أو التحديث.
    - فحوصات أفضل ممارسات تشغيل Gateway (Node مقابل Bun، ومسارات مديري الإصدارات).
    - تشخيصات تعارض منفذ Gateway (الافتراضي `18789`).

  </Accordion>
  <Accordion title="المصادقة، والأمان، والاقتران">
    - تحذيرات أمان لسياسات الرسائل المباشرة المفتوحة.
    - فحوصات مصادقة Gateway لوضع الرمز المحلي (يعرض إنشاء رمز عندما لا يوجد مصدر رمز؛ ولا يستبدل إعدادات SecretRef الخاصة بالرمز).
    - اكتشاف مشاكل اقتران الأجهزة (طلبات الاقتران الأولى المعلقة، ترقيات الدور/النطاق المعلقة، انجراف ذاكرة التخزين المؤقت المحلية القديمة لرمز الجهاز، وانجراف مصادقة سجل الاقتران).

  </Accordion>
  <Accordion title="مساحة العمل وshell">
    - فحص systemd linger على Linux.
    - فحص حجم ملف تمهيد مساحة العمل (تحذيرات الاقتطاع/الاقتراب من الحد لملفات السياق).
    - فحص حالة إكمال shell والتثبيت/الترقية التلقائية.
    - فحص جاهزية موفر تضمين بحث الذاكرة (نموذج محلي، مفتاح API بعيد، أو ملف QMD ثنائي).
    - فحوصات تثبيت المصدر (عدم تطابق مساحة عمل pnpm، أصول واجهة مستخدم مفقودة، ملف tsx ثنائي مفقود).
    - يكتب الإعدادات المحدّثة + بيانات معالج الإعداد الوصفية.

  </Accordion>
</AccordionGroup>

## الملء الراجع وإعادة الضبط في واجهة Dreams

يتضمن مشهد Dreams في واجهة التحكم إجراءات **الملء الراجع**، و**إعادة الضبط**، و**مسح المؤرّض** لسير عمل Dreaming المؤرّض. تستخدم هذه الإجراءات طرق RPC على نمط Gateway doctor، لكنها **ليست** جزءاً من إصلاح/ترحيل CLI في `openclaw doctor`.

ما تفعله:

- **الملء الراجع** يفحص ملفات `memory/YYYY-MM-DD.md` التاريخية في مساحة العمل النشطة، ويشغّل تمريرة يوميات REM المؤرّضة، ويكتب إدخالات ملء راجع قابلة للعكس في `DREAMS.md`.
- **إعادة الضبط** تزيل فقط إدخالات يوميات الملء الراجع الموسومة تلك من `DREAMS.md`.
- **مسح المؤرّض** يزيل فقط الإدخالات القصيرة الأمد المرحلية الخاصة بالمؤرّض التي جاءت من إعادة تشغيل تاريخية ولم تراكم بعد استدعاءً حياً أو دعماً يومياً.

ما لا تفعله بمفردها:

- لا تعدّل `MEMORY.md`
- لا تشغّل ترحيلات doctor الكاملة
- لا تُرحّل المرشحين المؤرّضين تلقائياً إلى مخزن الترويج القصير الأمد الحي ما لم تشغّل مسار CLI المرحلي صراحة أولاً

إذا أردت أن يؤثر إعادة تشغيل السجل المؤرّض في مسار الترويج العميق العادي، فاستخدم تدفق CLI بدلاً من ذلك:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

يؤدي ذلك إلى ترحيل المرشحين المؤرّضين الدائمين إلى مخزن Dreaming القصير الأمد مع إبقاء `DREAMS.md` كسطح للمراجعة.

## السلوك التفصيلي والمبررات

<AccordionGroup>
  <Accordion title="0. تحديث اختياري (تثبيتات git)">
    إذا كان هذا checkout من git وكان doctor يعمل تفاعلياً، فإنه يعرض التحديث (fetch/rebase/build) قبل تشغيل doctor.
  </Accordion>
  <Accordion title="1. تطبيع الإعدادات">
    إذا احتوت الإعدادات على أشكال قيم قديمة (مثل `messages.ackReaction` بدون تجاوز خاص بالقناة)، يطبّعها doctor إلى المخطط الحالي.

    يشمل ذلك حقول Talk المسطحة القديمة. إعداد Talk العام الحالي هو `talk.provider` + `talk.providers.<provider>`. يعيد doctor كتابة أشكال `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` القديمة إلى خريطة الموفر.

  </Accordion>
  <Accordion title="2. ترحيلات مفاتيح الإعدادات القديمة">
    عندما تحتوي الإعدادات على مفاتيح مهملة، ترفض الأوامر الأخرى العمل وتطلب منك تشغيل `openclaw doctor`.

    سيقوم doctor بما يلي:

    - يشرح أي المفاتيح القديمة وُجدت.
    - يعرض الترحيل الذي طبّقه.
    - يعيد كتابة `~/.openclaw/openclaw.json` بالمخطط المحدّث.

    يشغّل Gateway أيضاً ترحيلات doctor تلقائياً عند بدء التشغيل عندما يكتشف تنسيق إعدادات قديم، لذلك تُصلح الإعدادات القديمة دون تدخل يدوي. تتعامل `openclaw doctor --fix` مع ترحيلات مخزن وظائف Cron.

    الترحيلات الحالية:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` في المستوى الأعلى
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
    - بالنسبة إلى القنوات التي لها `accounts` مسماة لكن ما زالت لديها قيم قناة من المستوى الأعلى لحساب واحد، انقل تلك القيم ذات نطاق الحساب إلى الحساب المُرقّى المختار لتلك القناة (`accounts.default` لمعظم القنوات؛ يمكن لـ Matrix الحفاظ على هدف مسمى/افتراضي مطابق موجود)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - إزالة `agents.defaults.llm`؛ استخدم `models.providers.<id>.timeoutSeconds` لمهل الموفر/النموذج البطيء
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - إزالة `browser.relayBindHost` (إعداد ترحيل الإضافة القديم)
    - `models.providers.*.api: "openai"` القديمة → `"openai-completions"` (يتخطى بدء تشغيل Gateway أيضاً الموفرين الذين ضُبطت قيمة `api` لديهم على قيمة تعداد مستقبلية أو غير معروفة بدلاً من الإخفاق بإغلاق صارم)

    تشمل تحذيرات doctor أيضاً إرشادات الحساب الافتراضي للقنوات متعددة الحسابات:

    - إذا تم تكوين إدخالين أو أكثر من `channels.<channel>.accounts` بدون `channels.<channel>.defaultAccount` أو `accounts.default`، يحذر doctor من أن توجيه الرجوع الاحتياطي قد يختار حسابًا غير متوقع.
    - إذا تم ضبط `channels.<channel>.defaultAccount` على معرّف حساب غير معروف، يحذر doctor ويسرد معرّفات الحسابات المكوّنة.

  </Accordion>
  <Accordion title="2b. تجاوزات موفّر OpenCode">
    إذا أضفت `models.providers.opencode` أو `opencode-zen` أو `opencode-go` يدويًا، فإنه يتجاوز كتالوج OpenCode المدمج من `@mariozechner/pi-ai`. قد يجبر ذلك النماذج على استخدام API خاطئ أو يجعل التكاليف صفرية. يحذر doctor كي تتمكن من إزالة التجاوز واستعادة توجيه API والتكاليف لكل نموذج.
  </Accordion>
  <Accordion title="2c. ترحيل المتصفح وجاهزية Chrome MCP">
    إذا كان تكوين المتصفح لديك لا يزال يشير إلى مسار إضافة Chrome المحذوفة، فإن doctor يطبّعه إلى نموذج إرفاق Chrome MCP المحلي على المضيف الحالي:

    - يتحول `browser.profiles.*.driver: "extension"` إلى `"existing-session"`
    - تتم إزالة `browser.relayBindHost`

    يدقق doctor أيضًا في مسار Chrome MCP المحلي على المضيف عند استخدامك `defaultProfile: "user"` أو ملف تعريف `existing-session` مكوّن:

    - يتحقق مما إذا كان Google Chrome مثبتًا على المضيف نفسه لملفات تعريف الاتصال التلقائي الافتراضية
    - يتحقق من إصدار Chrome المكتشف ويحذر عندما يكون أقل من Chrome 144
    - يذكّرك بتمكين التصحيح عن بُعد في صفحة فحص المتصفح (على سبيل المثال `chrome://inspect/#remote-debugging` أو `brave://inspect/#remote-debugging` أو `edge://inspect/#remote-debugging`)

    لا يستطيع doctor تمكين الإعداد من جهة Chrome نيابةً عنك. لا يزال Chrome MCP المحلي على المضيف يتطلب:

    - متصفحًا مبنيًا على Chromium بإصدار 144+ على مضيف Gateway/Node
    - تشغيل المتصفح محليًا
    - تمكين التصحيح عن بُعد في ذلك المتصفح
    - الموافقة على مطالبة موافقة الإرفاق الأولى في المتصفح

    تتعلق الجاهزية هنا بمتطلبات الإرفاق المحلي فقط. يحتفظ `existing-session` بحدود مسارات Chrome MCP الحالية؛ ولا تزال المسارات المتقدمة مثل `responsebody`، وتصدير PDF، واعتراض التنزيلات، وإجراءات الدُفعات تتطلب متصفحًا مُدارًا أو ملف تعريف CDP خامًا.

    لا ينطبق هذا الفحص **على** Docker أو sandbox أو remote-browser أو تدفقات headless الأخرى. تستمر تلك في استخدام CDP الخام.

  </Accordion>
  <Accordion title="2d. متطلبات OAuth TLS الأساسية">
    عند تكوين ملف تعريف OpenAI Codex OAuth، يفحص doctor نقطة نهاية تفويض OpenAI للتحقق من أن حزمة TLS المحلية في Node/OpenSSL تستطيع التحقق من سلسلة الشهادات. إذا فشل الفحص بسبب خطأ في الشهادة (على سبيل المثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` أو شهادة منتهية الصلاحية أو شهادة موقعة ذاتيًا)، يطبع doctor إرشادات إصلاح خاصة بالمنصة. على macOS مع Node مثبت عبر Homebrew، يكون الإصلاح عادةً `brew postinstall ca-certificates`. مع `--deep`، يعمل الفحص حتى إذا كان Gateway سليمًا.
  </Accordion>
  <Accordion title="2e. تجاوزات موفّر Codex OAuth">
    إذا سبق أن أضفت إعدادات نقل OpenAI قديمة ضمن `models.providers.openai-codex`، فقد تحجب مسار موفّر Codex OAuth المدمج الذي تستخدمه الإصدارات الأحدث تلقائيًا. يحذر doctor عندما يرى إعدادات النقل القديمة هذه إلى جانب Codex OAuth حتى تتمكن من إزالة تجاوز النقل القديم أو إعادة كتابته واستعادة سلوك التوجيه/الرجوع الاحتياطي المدمج. لا تزال الوكلاء المخصصون وتجاوزات الترويسات فقط مدعومة ولا تؤدي إلى هذا التحذير.
  </Accordion>
  <Accordion title="2f. تحذيرات مسار Plugin Codex">
    عند تمكين Plugin Codex المجمّع، يتحقق doctor أيضًا مما إذا كانت مراجع النموذج الأساسية `openai-codex/*` لا تزال تُحل عبر مشغّل PI الافتراضي. هذه التركيبة صالحة عندما تريد مصادقة Codex OAuth/الاشتراك عبر PI، لكنها سهلة الالتباس مع حزمة خادم التطبيق الأصلية في Codex. يحذر doctor ويشير إلى الشكل الصريح لخادم التطبيق: `openai/*` مع `agentRuntime.id: "codex"` أو `OPENCLAW_AGENT_RUNTIME=codex`.

    لا يصلح doctor هذا تلقائيًا لأن كلا المسارين صالحان:

    - `openai-codex/*` + PI يعني "استخدم مصادقة Codex OAuth/الاشتراك عبر مشغّل OpenClaw العادي."
    - `openai/*` + `runtime: "codex"` يعني "شغّل الدور المضمّن عبر خادم تطبيق Codex الأصلي."
    - `/codex ...` يعني "تحكم في محادثة Codex أصلية من الدردشة أو اربطها."
    - `/acp ...` أو `runtime: "acp"` يعني "استخدم محوّل ACP/acpx الخارجي."

    إذا ظهر التحذير، اختر المسار الذي قصدته وعدّل التكوين يدويًا. أبقِ التحذير كما هو عندما يكون PI Codex OAuth مقصودًا.

  </Accordion>
  <Accordion title="3. ترحيلات الحالة القديمة (تخطيط القرص)">
    يستطيع doctor ترحيل التخطيطات القديمة على القرص إلى البنية الحالية:

    - مخزن الجلسات + النصوص:
      - من `~/.openclaw/sessions/` إلى `~/.openclaw/agents/<agentId>/sessions/`
    - دليل الوكيل:
      - من `~/.openclaw/agent/` إلى `~/.openclaw/agents/<agentId>/agent/`
    - حالة مصادقة WhatsApp (Baileys):
      - من `~/.openclaw/credentials/*.json` القديم (باستثناء `oauth.json`)
      - إلى `~/.openclaw/credentials/whatsapp/<accountId>/...` (معرّف الحساب الافتراضي: `default`)

    هذه الترحيلات تُبذل فيها أفضل محاولة وهي قابلة للتكرار؛ سيصدر doctor تحذيرات عندما يترك أي مجلدات قديمة كنسخ احتياطية. يقوم Gateway/CLI أيضًا بترحيل الجلسات القديمة ودليل الوكيل تلقائيًا عند بدء التشغيل حتى تنتقل السجل/المصادقة/النماذج إلى المسار الخاص بكل وكيل بدون تشغيل doctor يدويًا. يتم ترحيل مصادقة WhatsApp عمدًا فقط عبر `openclaw doctor`. أصبحت تسوية موفّر المحادثة/خريطة الموفّرين تقارن الآن بالمساواة البنيوية، لذلك لم تعد الفروق التي تقتصر على ترتيب المفاتيح تؤدي إلى تغييرات `doctor --fix` متكررة بلا أثر.

  </Accordion>
  <Accordion title="3a. ترحيلات بيانات Plugin القديمة">
    يفحص doctor جميع بيانات Plugin المثبتة بحثًا عن مفاتيح قدرات عليا مهملة (`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders`). عند العثور عليها، يعرض نقلها إلى كائن `contracts` وإعادة كتابة ملف البيان في مكانه. هذا الترحيل قابل للتكرار؛ إذا كان مفتاح `contracts` يحتوي بالفعل على القيم نفسها، تتم إزالة المفتاح القديم بدون تكرار البيانات.
  </Accordion>
  <Accordion title="3b. ترحيلات مخزن Cron القديمة">
    يتحقق doctor أيضًا من مخزن مهام Cron (`~/.openclaw/cron/jobs.json` افتراضيًا، أو `cron.store` عند تجاوزه) بحثًا عن أشكال مهام قديمة لا يزال المجدول يقبلها للتوافق.

    تشمل تنظيفات Cron الحالية:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - حقول الحمولة في المستوى الأعلى (`message`، `model`، `thinking`، ...) → `payload`
    - حقول التسليم في المستوى الأعلى (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - أسماء التسليم البديلة `provider` في الحمولة → `delivery.channel` صريح
    - مهام رجوع Webhook القديمة البسيطة `notify: true` → `delivery.mode="webhook"` صريح مع `delivery.to=cron.webhook`

    لا يرحّل doctor تلقائيًا مهام `notify: true` إلا عندما يستطيع فعل ذلك بدون تغيير السلوك. إذا جمعت مهمة بين رجوع الإشعار القديم ووضع تسليم حالي غير Webhook، يحذر doctor ويترك تلك المهمة للمراجعة اليدوية.

  </Accordion>
  <Accordion title="3c. تنظيف قفل الجلسة">
    يفحص doctor كل دليل جلسات وكيل بحثًا عن ملفات قفل كتابة قديمة — وهي ملفات تُترك عندما تنتهي جلسة بشكل غير طبيعي. لكل ملف قفل يعثر عليه، يبلغ عن: المسار، وPID، وما إذا كان PID لا يزال حيًا، وعمر القفل، وما إذا كان يُعد قديمًا (PID ميت أو أقدم من 30 دقيقة). في وضع `--fix` / `--repair` يزيل ملفات القفل القديمة تلقائيًا؛ وإلا يطبع ملاحظة ويوجهك لإعادة التشغيل مع `--fix`.
  </Accordion>
  <Accordion title="3d. إصلاح فرع نص الجلسة">
    يفحص doctor ملفات JSONL لجلسات الوكيل بحثًا عن شكل الفرع المكرر الذي أنشأه خطأ إعادة كتابة نص الموجه بتاريخ 2026.4.24: دور مستخدم مهجور يحتوي على سياق تشغيل داخلي من OpenClaw إلى جانب شقيق نشط يحتوي على موجه المستخدم المرئي نفسه. في وضع `--fix` / `--repair`، ينسخ doctor كل ملف متأثر احتياطيًا بجانب الأصل ويعيد كتابة النص إلى الفرع النشط حتى لا يرى سجل Gateway وقراء الذاكرة أدوارًا مكررة بعد الآن.
  </Accordion>
  <Accordion title="4. فحوصات سلامة الحالة (استمرارية الجلسة والتوجيه والسلامة)">
    دليل الحالة هو جذع الدماغ التشغيلي. إذا اختفى، فستفقد الجلسات وبيانات الاعتماد والسجلات والتكوين (ما لم تكن لديك نسخ احتياطية في مكان آخر).

    يتحقق doctor من:

    - **دليل الحالة مفقود**: يحذر من فقدان حالة كارثي، ويطلب إعادة إنشاء الدليل، ويذكّرك بأنه لا يستطيع استرداد البيانات المفقودة.
    - **أذونات دليل الحالة**: يتحقق من قابلية الكتابة؛ يعرض إصلاح الأذونات (ويصدر تلميح `chown` عند اكتشاف عدم تطابق المالك/المجموعة).
    - **دليل حالة متزامن مع السحابة على macOS**: يحذر عندما تُحل الحالة ضمن iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) أو `~/Library/CloudStorage/...` لأن المسارات المدعومة بالمزامنة قد تسبب I/O أبطأ وسباقات قفل/مزامنة.
    - **دليل حالة Linux على SD أو eMMC**: يحذر عندما تُحل الحالة إلى مصدر تثبيت `mmcblk*`، لأن I/O العشوائي المدعوم بـ SD أو eMMC قد يكون أبطأ ويتآكل أسرع تحت كتابات الجلسات وبيانات الاعتماد.
    - **أدلة الجلسات مفقودة**: يلزم وجود `sessions/` ودليل مخزن الجلسات لاستمرار السجل وتجنب أعطال `ENOENT`.
    - **عدم تطابق النص**: يحذر عندما تكون إدخالات الجلسات الحديثة تفتقد ملفات النص.
    - **جلسة رئيسية "JSONL بسطر واحد"**: يضع علامة عندما يحتوي النص الرئيسي على سطر واحد فقط (السجل لا يتراكم).
    - **أدلة حالة متعددة**: يحذر عندما توجد عدة مجلدات `~/.openclaw` عبر أدلة المنزل أو عندما يشير `OPENCLAW_STATE_DIR` إلى مكان آخر (قد ينقسم السجل بين التثبيتات).
    - **تذكير الوضع البعيد**: إذا كان `gateway.mode=remote`، يذكّرك doctor بتشغيله على المضيف البعيد (الحالة تعيش هناك).
    - **أذونات ملف التكوين**: يحذر إذا كان `~/.openclaw/openclaw.json` قابلاً للقراءة من المجموعة/العالم ويعرض تضييقه إلى `600`.

  </Accordion>
  <Accordion title="5. صحة مصادقة النماذج (انتهاء OAuth)">
    يفحص doctor ملفات تعريف OAuth في مخزن المصادقة، ويحذر عندما تكون الرموز على وشك الانتهاء/منتهية، ويمكنه تحديثها عندما يكون ذلك آمنًا. إذا كان ملف تعريف Anthropic OAuth/الرمز قديمًا، يقترح مفتاح Anthropic API أو مسار رمز إعداد Anthropic. لا تظهر مطالبات التحديث إلا عند التشغيل تفاعليًا (TTY)؛ ويتخطى `--non-interactive` محاولات التحديث.

    عندما يفشل تحديث OAuth نهائيًا (على سبيل المثال `refresh_token_reused` أو `invalid_grant` أو موفّر يطلب منك تسجيل الدخول مجددًا)، يبلغ doctor بأن إعادة المصادقة مطلوبة ويطبع أمر `openclaw models auth login --provider ...` الدقيق المطلوب تشغيله.

    يبلغ doctor أيضًا عن ملفات تعريف المصادقة غير القابلة للاستخدام مؤقتًا بسبب:

    - فترات تهدئة قصيرة (حدود معدل/مهلات/إخفاقات مصادقة)
    - تعطيلات أطول (إخفاقات فوترة/رصيد)

  </Accordion>
  <Accordion title="6. التحقق من نموذج الخطافات">
    إذا تم تعيين `hooks.gmail.model`، يتحقق doctor من مرجع النموذج مقابل الكتالوج وقائمة السماح، ويحذر عندما لا يمكن حله أو يكون غير مسموح به.
  </Accordion>
  <Accordion title="7. إصلاح صورة Sandbox">
    عند تمكين العزل، يتحقق doctor من صور Docker ويعرض إنشاءها أو التبديل إلى الأسماء القديمة إذا كانت الصورة الحالية مفقودة.
  </Accordion>
  <Accordion title="7b. تبعيات تشغيل Plugin المضمنة">
    يتحقق Doctor من تبعيات وقت التشغيل فقط للـ plugins المضمنة النشطة في التكوين الحالي أو الممكّنة افتراضيًا بواسطة بيانها المضمن، مثل `plugins.entries.discord.enabled: true`، أو `channels.discord.enabled: true` القديم، أو `models.providers.*` / مراجع نموذج الوكيل المكوّنة، أو Plugin مضمن مفعّل افتراضيًا بدون ملكية موفر. إذا كان أي منها مفقودًا، يبلّغ doctor عن الحزم ويثبتها في وضع `openclaw doctor --fix` / `openclaw doctor --repair`. لا تزال plugins الخارجية تستخدم `openclaw plugins install` / `openclaw plugins update`؛ لا يثبت doctor التبعيات لمسارات Plugin عشوائية.

    أثناء إصلاح doctor، تعرض عمليات تثبيت npm لتبعيات وقت التشغيل المضمنة تقدمًا بمؤشر دوار في جلسات TTY وتقدمًا دوريًا على شكل أسطر في المخرجات الممرّرة أو بلا واجهة. يمكن لـ Gateway وCLI المحلي أيضًا إصلاح تبعيات وقت التشغيل النشطة للـ Plugin المضمن عند الطلب قبل استيراد Plugin مضمن. تكون هذه التثبيتات مقصورة على جذر تثبيت وقت تشغيل Plugin، وتعمل مع تعطيل السكربتات، ولا تكتب قفل حزمة، وتحميها آلية قفل لجذر التثبيت حتى لا تقوم عمليات بدء CLI أو Gateway المتزامنة بتعديل شجرة `node_modules` نفسها في الوقت نفسه.

  </Accordion>
  <Accordion title="8. ترحيلات خدمة Gateway وتلميحات التنظيف">
    يكتشف Doctor خدمات gateway القديمة (launchd/systemd/schtasks) ويعرض إزالتها وتثبيت خدمة OpenClaw باستخدام منفذ gateway الحالي. ويمكنه أيضًا البحث عن خدمات إضافية شبيهة بـ gateway وطباعة تلميحات التنظيف. تُعد خدمات gateway الخاصة بـ OpenClaw والمسمّاة حسب الملف الشخصي خدمات أساسية ولا يتم وسمها بأنها "إضافية".

    على Linux، إذا كانت خدمة gateway على مستوى المستخدم مفقودة لكن توجد خدمة gateway لـ OpenClaw على مستوى النظام، فلا يثبت doctor خدمة ثانية على مستوى المستخدم تلقائيًا. افحص باستخدام `openclaw gateway status --deep` أو `openclaw doctor --deep`، ثم أزل التكرار أو عيّن `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يدير مشرف نظام دورة حياة gateway.

  </Accordion>
  <Accordion title="8b. ترحيل Matrix عند بدء التشغيل">
    عندما يكون لحساب قناة Matrix ترحيل حالة قديم معلّق أو قابل للتنفيذ، ينشئ doctor (في وضع `--fix` / `--repair`) لقطة قبل الترحيل ثم يشغّل خطوات الترحيل بأفضل جهد: ترحيل حالة Matrix القديمة وتجهيز الحالة المشفرة القديمة. كلتا الخطوتين غير قاتلتين؛ تُسجّل الأخطاء ويستمر بدء التشغيل. في وضع القراءة فقط (`openclaw doctor` بدون `--fix`) يتم تخطي هذا الفحص بالكامل.
  </Accordion>
  <Accordion title="8c. إقران الجهاز وانحراف المصادقة">
    يفحص Doctor الآن حالة إقران الجهاز كجزء من مرور الصحة العادي.

    ما يبلّغ عنه:

    - طلبات إقران أولية معلّقة
    - ترقيات أدوار معلّقة للأجهزة المقترنة مسبقًا
    - ترقيات نطاق معلّقة للأجهزة المقترنة مسبقًا
    - إصلاحات عدم تطابق المفتاح العام عندما لا يزال معرّف الجهاز مطابقًا لكن هوية الجهاز لم تعد تطابق السجل المعتمد
    - سجلات مقترنة ينقصها رمز نشط لدور معتمد
    - رموز مقترنة تنحرف نطاقاتها خارج خط أساس الإقران المعتمد
    - إدخالات رموز أجهزة مخزنة محليًا للجهاز الحالي تسبق تدوير رمز من جهة gateway أو تحمل بيانات وصفية قديمة للنطاق

    لا يعتمد Doctor طلبات الإقران تلقائيًا ولا يدوّر رموز الأجهزة تلقائيًا. بل يطبع الخطوات التالية بدقة:

    - افحص الطلبات المعلّقة باستخدام `openclaw devices list`
    - اعتمد الطلب المحدد باستخدام `openclaw devices approve <requestId>`
    - دوّر رمزًا جديدًا باستخدام `openclaw devices rotate --device <deviceId> --role <role>`
    - أزل سجلًا قديمًا وأعد اعتماده باستخدام `openclaw devices remove <deviceId>`

    هذا يغلق الثغرة الشائعة "مقترن بالفعل لكن ما زلت أتلقى طلب الإقران": يميز doctor الآن بين الإقران الأولي وترقيات الدور/النطاق المعلّقة وانحراف الرمز/هوية الجهاز القديمة.

  </Accordion>
  <Accordion title="9. تحذيرات الأمان">
    يصدر Doctor تحذيرات عندما يكون موفر مفتوحًا للرسائل الخاصة بدون قائمة سماح، أو عندما يتم تكوين سياسة بطريقة خطرة.
  </Accordion>
  <Accordion title="10. إبقاء systemd نشطًا (Linux)">
    إذا كان يعمل كخدمة مستخدم systemd، يضمن doctor تمكين الإبقاء النشط حتى يظل gateway حيًا بعد تسجيل الخروج.
  </Accordion>
  <Accordion title="11. حالة مساحة العمل (Skills وplugins والأدلة القديمة)">
    يطبع Doctor ملخصًا لحالة مساحة العمل للوكيل الافتراضي:

    - **حالة Skills**: يحسب Skills المؤهلة، وناقصة المتطلبات، والمحظورة بقائمة السماح.
    - **أدلة مساحة العمل القديمة**: يحذر عند وجود `~/openclaw` أو أدلة مساحة عمل قديمة أخرى إلى جانب مساحة العمل الحالية.
    - **حالة Plugin**: يحسب plugins الممكّنة/المعطّلة/ذات الأخطاء؛ ويسرد معرّفات Plugin لأي أخطاء؛ ويبلّغ عن قدرات Plugin الحزمة.
    - **تحذيرات توافق Plugin**: يشير إلى plugins التي لديها مشكلات توافق مع وقت التشغيل الحالي.
    - **تشخيصات Plugin**: يعرض أي تحذيرات أو أخطاء وقت تحميل صادرة عن سجل Plugin.

  </Accordion>
  <Accordion title="11b. حجم ملف التمهيد">
    يتحقق Doctor مما إذا كانت ملفات تمهيد مساحة العمل (مثل `AGENTS.md` أو `CLAUDE.md` أو ملفات سياق محقونة أخرى) قريبة من ميزانية الأحرف المكوّنة أو تتجاوزها. يبلّغ عن عدد الأحرف الخام مقابل المحقونة لكل ملف، ونسبة الاقتطاع، وسبب الاقتطاع (`max/file` أو `max/total`)، وإجمالي الأحرف المحقونة كنسبة من الميزانية الإجمالية. عندما يتم اقتطاع الملفات أو تكون قريبة من الحد، يطبع doctor نصائح لضبط `agents.defaults.bootstrapMaxChars` و`agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. تنظيف Plugin قناة قديم">
    عندما يزيل `openclaw doctor --fix` Plugin قناة مفقودًا، فإنه يزيل أيضًا التكوين المتدلي الخاص بنطاق القناة الذي كان يشير إلى ذلك الـ Plugin: إدخالات `channels.<id>`، وأهداف heartbeat التي سمّت القناة، وتجاوزات `agents.*.models["<channel>/*"]`. يمنع هذا حلقات تمهيد Gateway حيث اختفى وقت تشغيل القناة لكن التكوين لا يزال يطلب من gateway الارتباط بها.
  </Accordion>
  <Accordion title="11c. إكمال الصدفة">
    يتحقق Doctor مما إذا كان إكمال Tab مثبتًا للصدفة الحالية (zsh أو bash أو fish أو PowerShell):

    - إذا كان ملف تعريف الصدفة يستخدم نمط إكمال ديناميكيًا بطيئًا (`source <(openclaw completion ...)`)، يرقّيه doctor إلى صيغة الملف المخزن مؤقتًا الأسرع.
    - إذا كان الإكمال مكوّنًا في الملف الشخصي لكن ملف التخزين المؤقت مفقود، يعيد doctor إنشاء التخزين المؤقت تلقائيًا.
    - إذا لم يكن أي إكمال مكوّنًا على الإطلاق، يطالب doctor بتثبيته (في الوضع التفاعلي فقط؛ يتم تخطيه مع `--non-interactive`).

    شغّل `openclaw completion --write-state` لإعادة إنشاء التخزين المؤقت يدويًا.

  </Accordion>
  <Accordion title="12. فحوص مصادقة Gateway (الرمز المحلي)">
    يتحقق Doctor من جاهزية مصادقة رمز gateway المحلي.

    - إذا كان وضع الرمز يحتاج إلى رمز ولا يوجد مصدر رمز، يعرض doctor إنشاء واحد.
    - إذا كان `gateway.auth.token` مُدارًا بواسطة SecretRef لكنه غير متاح، يحذر doctor ولا يستبدله بنص صريح.
    - يفرض `openclaw doctor --generate-gateway-token` الإنشاء فقط عندما لا يكون أي SecretRef للرمز مكوّنًا.

  </Accordion>
  <Accordion title="12b. إصلاحات قراءة فقط واعية بـ SecretRef">
    تحتاج بعض تدفقات الإصلاح إلى فحص بيانات الاعتماد المكوّنة بدون إضعاف سلوك الفشل السريع في وقت التشغيل.

    - يستخدم `openclaw doctor --fix` الآن نموذج ملخص SecretRef نفسه للقراءة فقط مثل أوامر عائلة الحالة لإصلاحات التكوين المستهدفة.
    - مثال: يحاول إصلاح Telegram `allowFrom` / `groupAllowFrom` `@username` استخدام بيانات اعتماد البوت المكوّنة عند توفرها.
    - إذا كان رمز بوت Telegram مكوّنًا عبر SecretRef لكنه غير متاح في مسار الأمر الحالي، يبلّغ doctor أن بيانات الاعتماد مكوّنة لكنها غير متاحة ويتخطى الحل التلقائي بدلًا من التعطل أو الإبلاغ خطأً عن أن الرمز مفقود.

  </Accordion>
  <Accordion title="13. فحص صحة Gateway + إعادة التشغيل">
    يشغّل Doctor فحص صحة ويعرض إعادة تشغيل gateway عندما يبدو غير سليم.
  </Accordion>
  <Accordion title="13b. جاهزية بحث الذاكرة">
    يتحقق Doctor مما إذا كان موفر تضمينات بحث الذاكرة المكوّن جاهزًا للوكيل الافتراضي. يعتمد السلوك على الخلفية والموفر المكوّنين:

    - **خلفية QMD**: يتحقق مما إذا كان الملف الثنائي `qmd` متاحًا وقابلًا للتشغيل. إذا لم يكن كذلك، يطبع إرشادات إصلاح تشمل حزمة npm وخيار مسار يدوي للملف الثنائي.
    - **موفر محلي صريح**: يتحقق من وجود ملف نموذج محلي أو عنوان URL معروف لنموذج بعيد/قابل للتنزيل. إذا كان مفقودًا، يقترح التبديل إلى موفر بعيد.
    - **موفر بعيد صريح** (`openai`، `voyage`، إلخ): يتحقق من وجود مفتاح API في البيئة أو مخزن المصادقة. يطبع تلميحات إصلاح قابلة للتنفيذ إذا كان مفقودًا.
    - **موفر تلقائي**: يتحقق من توفر النموذج المحلي أولًا، ثم يجرب كل موفر بعيد حسب ترتيب الاختيار التلقائي.

    عندما تكون نتيجة فحص gateway مخزنة مؤقتًا متاحة (كان gateway سليمًا وقت الفحص)، يقارن doctor نتيجتها مع التكوين المرئي من CLI ويذكر أي اختلاف. لا يبدأ Doctor اختبار تضمين جديدًا في المسار الافتراضي؛ استخدم أمر حالة الذاكرة العميق عندما تريد فحص موفر حيًا.

    استخدم `openclaw memory status --deep` للتحقق من جاهزية التضمين في وقت التشغيل.

  </Accordion>
  <Accordion title="14. تحذيرات حالة القناة">
    إذا كان gateway سليمًا، يشغّل doctor فحص حالة قناة ويبلّغ عن التحذيرات مع إصلاحات مقترحة.
  </Accordion>
  <Accordion title="15. تدقيق تكوين المشرف + الإصلاح">
    يتحقق Doctor من تكوين المشرف المثبت (launchd/systemd/schtasks) بحثًا عن الإعدادات الافتراضية المفقودة أو القديمة (مثل تبعيات systemd network-online وتأخير إعادة التشغيل). عندما يجد عدم تطابق، يوصي بتحديث ويمكنه إعادة كتابة ملف الخدمة/المهمة إلى الإعدادات الافتراضية الحالية.

    ملاحظات:

    - يطلب `openclaw doctor` التأكيد قبل إعادة كتابة إعدادات المشرف.
    - يقبل `openclaw doctor --yes` مطالبات الإصلاح الافتراضية.
    - يطبق `openclaw doctor --repair` الإصلاحات الموصى بها دون مطالبات.
    - يستبدل `openclaw doctor --repair --force` إعدادات المشرف المخصصة.
    - يبقي `OPENCLAW_SERVICE_REPAIR_POLICY=external` doctor في وضع القراءة فقط لدورة حياة خدمة Gateway. يظل يبلغ عن صحة الخدمة ويشغل إصلاحات غير متعلقة بالخدمة، لكنه يتخطى تثبيت/بدء/إعادة بدء/تمهيد الخدمة، وإعادة كتابة إعدادات المشرف، وتنظيف الخدمات القديمة لأن مشرفًا خارجيًا يملك دورة الحياة هذه.
    - على Linux، لا يعيد doctor كتابة بيانات الأمر/نقطة الدخول الوصفية أثناء نشاط وحدة Gateway المطابقة في systemd. كما يتجاهل وحدات Gateway الشبيهة الإضافية غير القديمة وغير النشطة أثناء فحص الخدمات المكررة، حتى لا تنشئ ملفات الخدمات المصاحبة ضجيج تنظيف.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان `gateway.auth.token` مدارًا بواسطة SecretRef، فإن تثبيت/إصلاح خدمة doctor يتحقق من SecretRef لكنه لا يحفظ قيم الرمز النصية الصريحة المحلولة في بيانات بيئة خدمة المشرف الوصفية.
    - يكتشف doctor قيم بيئة الخدمة المدارة المدعومة بـ `.env`/SecretRef التي ضمّنتها عمليات تثبيت LaunchAgent أو systemd أو Windows Scheduled Task القديمة مباشرة، ويعيد كتابة بيانات الخدمة الوصفية حتى تُحمَّل تلك القيم من مصدر وقت التشغيل بدلًا من تعريف المشرف.
    - يكتشف doctor عندما يظل أمر الخدمة يثبت `--port` قديمًا بعد تغييرات `gateway.port` ويعيد كتابة بيانات الخدمة الوصفية إلى المنفذ الحالي.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان رمز SecretRef المهيأ غير محلول، يحظر doctor مسار التثبيت/الإصلاح مع إرشادات قابلة للتنفيذ.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مهيأين وكان `gateway.auth.mode` غير مضبوط، يحظر doctor التثبيت/الإصلاح حتى يتم ضبط الوضع صراحة.
    - بالنسبة إلى وحدات systemd الخاصة بالمستخدم على Linux، تتضمن فحوصات انحراف الرمز في doctor الآن مصدري `Environment=` و`EnvironmentFile=` عند مقارنة بيانات مصادقة الخدمة الوصفية.
    - ترفض إصلاحات خدمة doctor إعادة كتابة خدمة Gateway من ثنائي OpenClaw أقدم أو إيقافها أو إعادة تشغيلها عندما تكون الإعدادات قد كُتبت آخر مرة بواسطة إصدار أحدث. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - يمكنك دائمًا فرض إعادة كتابة كاملة عبر `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. تشخيصات وقت تشغيل Gateway والمنفذ">
    يفحص doctor وقت تشغيل الخدمة (PID، وآخر حالة خروج) ويحذر عندما تكون الخدمة مثبتة لكنها لا تعمل فعليًا. كما يتحقق من تعارضات المنافذ على منفذ Gateway (الافتراضي `18789`) ويبلغ عن الأسباب المحتملة (Gateway يعمل بالفعل، نفق SSH).
  </Accordion>
  <Accordion title="17. أفضل ممارسات وقت تشغيل Gateway">
    يحذر doctor عندما تعمل خدمة Gateway على Bun أو مسار Node مدار بإصدار (`nvm`، `fnm`، `volta`، `asdf`، إلخ). تتطلب قنوات WhatsApp وTelegram استخدام Node، ويمكن أن تتعطل مسارات مديري الإصدارات بعد الترقيات لأن الخدمة لا تحمل تهيئة الصدفة لديك. يعرض doctor الترحيل إلى تثبيت Node على النظام عند توفره (Homebrew/apt/choco).

    تحتفظ الخدمات المثبتة أو المُصلحة حديثًا بجذور بيئة صريحة (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) وأدلة user-bin مستقرة، لكن أدلة الرجوع الاحتياطية المقدرة لمدير الإصدارات لا تُكتب إلى PATH الخدمة إلا عندما تكون تلك الأدلة موجودة على القرص. هذا يحافظ على توافق PATH المشرف المولَّد مع تدقيق PATH الأدنى نفسه الذي يشغله doctor لاحقًا.

  </Accordion>
  <Accordion title="18. كتابة الإعدادات وبيانات المعالج الوصفية">
    يحفظ doctor أي تغييرات على الإعدادات ويختم بيانات المعالج الوصفية لتسجيل تشغيل doctor.
  </Accordion>
  <Accordion title="19. نصائح مساحة العمل (النسخ الاحتياطي ونظام الذاكرة)">
    يقترح doctor نظام ذاكرة لمساحة العمل عند غيابه، ويطبع نصيحة نسخ احتياطي إذا لم تكن مساحة العمل ضمن git بالفعل.

    راجع [/concepts/agent-workspace](/ar/concepts/agent-workspace) للحصول على دليل كامل لبنية مساحة العمل والنسخ الاحتياطي باستخدام git (يوصى باستخدام GitHub أو GitLab خاص).

  </Accordion>
</AccordionGroup>

## ذو صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
