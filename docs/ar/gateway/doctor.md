---
read_when:
    - إضافة ترحيلات doctor أو تعديلها
    - إدخال تغييرات كاسرة للتوافق في الإعدادات
sidebarTitle: Doctor
summary: 'أمر Doctor: فحوصات الصحة، وترحيلات الإعدادات، وخطوات الإصلاح'
title: التشخيص
x-i18n:
    generated_at: "2026-05-07T13:18:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7826cb4f3e97e56b07a5ba3b1c61860b15d6831d29012a0a16fe8f5f7014d1d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` هو أداة الإصلاح والترحيل لـ OpenClaw. يصلح الإعدادات/الحالة القديمة، ويفحص السلامة، ويوفر خطوات إصلاح قابلة للتنفيذ.

## البدء السريع

```bash
openclaw doctor
```

### أوضاع التشغيل دون واجهة والأتمتة

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    قبول الإعدادات الافتراضية دون مطالبة (بما في ذلك خطوات إصلاح إعادة التشغيل/الخدمة/صندوق العزل عند انطباقها).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    تطبيق الإصلاحات الموصى بها دون مطالبة (الإصلاحات + إعادة التشغيل حيث يكون ذلك آمنا).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    تطبيق الإصلاحات الشديدة أيضا (يستبدل إعدادات المشرف المخصصة).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    التشغيل دون مطالبات وتطبيق عمليات الترحيل الآمنة فقط (تطبيع الإعدادات + نقل الحالة على القرص). يتجاوز إجراءات إعادة التشغيل/الخدمة/صندوق العزل التي تتطلب تأكيدا بشريا. تعمل ترحيلات الحالة القديمة تلقائيا عند اكتشافها.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    فحص خدمات النظام بحثا عن تثبيتات Gateway إضافية (launchd/systemd/schtasks).

  </Tab>
</Tabs>

إذا أردت مراجعة التغييرات قبل الكتابة، فافتح ملف الإعدادات أولا:

```bash
cat ~/.openclaw/openclaw.json
```

## ماذا يفعل (ملخص)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - تحديث تمهيدي اختياري لتثبيتات git (تفاعلي فقط).
    - فحص حداثة بروتوكول واجهة المستخدم (يعيد بناء واجهة التحكم عندما يكون مخطط البروتوكول أحدث).
    - فحص السلامة + مطالبة إعادة التشغيل.
    - ملخص حالة Skills (مؤهل/مفقود/محظور) وحالة Plugin.

  </Accordion>
  <Accordion title="Config and migrations">
    - تطبيع الإعدادات للقيم القديمة.
    - ترحيل إعدادات Talk من حقول `talk.*` المسطحة القديمة إلى `talk.provider` + `talk.providers.<provider>`.
    - فحوصات ترحيل المتصفح لإعدادات إضافة Chrome القديمة وجاهزية Chrome MCP.
    - تحذيرات تجاوز موفر OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - تحذيرات حجب OAuth الخاص بـ Codex (`models.providers.openai-codex`).
    - فحص متطلبات OAuth TLS المسبقة لملفات تعريف OAuth الخاصة بـ OpenAI Codex.
    - تحذيرات قائمة السماح للـ Plugin/الأداة عندما تكون `plugins.allow` مقيّدة لكن سياسة الأدوات لا تزال تطلب حرف بدل أو أدوات مملوكة للـ Plugin.
    - ترحيل الحالة القديمة على القرص (الجلسات/دليل الوكيل/مصادقة WhatsApp).
    - ترحيل مفتاح عقد بيان Plugin القديم (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - ترحيل مخزن Cron القديم (`jobId`, `schedule.cron`, حقول التسليم/الحمولة في المستوى الأعلى، `provider` في الحمولة، ومهام Webhook الاحتياطية البسيطة `notify: true`).
    - ترحيل سياسة وقت تشغيل الوكيل القديمة إلى `agents.defaults.agentRuntime` و`agents.list[].agentRuntime`.
    - تنظيف إعدادات Plugin القديمة عندما تكون plugins مفعلة؛ عندما تكون `plugins.enabled=false`، تُعامل مراجع Plugin القديمة كإعدادات احتواء خاملة وتُحفظ كما هي.

  </Accordion>
  <Accordion title="State and integrity">
    - فحص ملف قفل الجلسة وتنظيف الأقفال القديمة.
    - إصلاح نصوص الجلسات لفروع إعادة كتابة الموجه المكررة التي أنشأتها إصدارات 2026.4.24 المتأثرة.
    - اكتشاف شواهد استرداد إعادة تشغيل الوكيل الفرعي العالق، مع دعم `--fix` لمسح أعلام الاسترداد الملغاة القديمة بحيث لا يستمر بدء التشغيل في معاملة العملية الفرعية على أنها أُلغيت بعد إعادة التشغيل.
    - فحوصات سلامة الحالة والأذونات (الجلسات، النصوص، دليل الحالة).
    - فحوصات أذونات ملف الإعدادات (chmod 600) عند التشغيل محليا.
    - سلامة مصادقة النماذج: يفحص انتهاء OAuth، ويمكنه تحديث الرموز التي توشك على الانتهاء، ويبلغ عن حالات التهدئة/التعطيل لملف تعريف المصادقة.
    - اكتشاف دليل مساحة عمل إضافي (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - إصلاح صورة صندوق العزل عندما يكون العزل مفعلا.
    - ترحيل الخدمة القديمة واكتشاف Gateway إضافي.
    - ترحيل حالة قناة Matrix القديمة (في وضع `--fix` / `--repair`).
    - فحوصات وقت تشغيل Gateway (الخدمة مثبتة لكنها لا تعمل؛ تسمية launchd المخزنة مؤقتا).
    - تحذيرات حالة القناة (تُفحص من Gateway قيد التشغيل).
    - توجد فحوصات الأذونات الخاصة بالقنوات ضمن `openclaw channels capabilities`؛ على سبيل المثال، تُدقق أذونات قناة Discord الصوتية باستخدام `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - فحوصات استجابة WhatsApp لحالة تدهور صحة حلقة أحداث Gateway مع استمرار تشغيل عملاء TUI المحليين؛ يوقف `--fix` عملاء TUI المحليين الموثقين فقط.
    - إصلاح مسار Codex لمراجع نماذج `openai-codex/*` القديمة في النماذج الأساسية، والاحتياطيات، وتجاوزات Heartbeat/الوكيل الفرعي/Compaction، والخطافات، وتجاوزات نماذج القنوات، وتثبيتات مسارات الجلسات؛ يعيد `--fix` كتابتها إلى `openai/*` ويختار `agentRuntime.id: "codex"` فقط عندما يكون Codex Plugin مثبتا ومفعلا ويساهم بحاضنة `codex` ولديه OAuth قابل للاستخدام. وإلا فإنه يختار `agentRuntime.id: "pi"`.
    - تدقيق إعدادات المشرف (launchd/systemd/schtasks) مع إصلاح اختياري.
    - تنظيف بيئة الوكيل المضمنة لخدمات Gateway التي التقطت قيم shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` أثناء التثبيت أو التحديث.
    - فحوصات أفضل ممارسات وقت تشغيل Gateway (Node مقابل Bun، ومسارات مدير الإصدارات).
    - تشخيص تعارض منفذ Gateway (الافتراضي `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - تحذيرات أمان لسياسات الرسائل الخاصة المفتوحة.
    - فحوصات مصادقة Gateway لوضع الرمز المحلي (يعرض إنشاء رمز عندما لا يوجد مصدر رمز؛ ولا يستبدل إعدادات token SecretRef).
    - اكتشاف مشكلات إقران الأجهزة (طلبات الإقران الأولى المعلقة، وترقيات الدور/النطاق المعلقة، وانحراف ذاكرة التخزين المؤقت المحلية القديمة لرمز الجهاز، وانحراف مصادقة سجل الإقران).

  </Accordion>
  <Accordion title="Workspace and shell">
    - فحص systemd linger على Linux.
    - فحص حجم ملف تمهيد مساحة العمل (تحذيرات الاقتطاع/الاقتراب من الحد لملفات السياق).
    - فحص جاهزية Skills للوكيل الافتراضي؛ يبلغ عن المهارات المسموح بها التي تفتقد ثنائيات أو بيئة أو إعدادات أو متطلبات نظام تشغيل، ويمكن لـ `--fix` تعطيل المهارات غير المتاحة في `skills.entries`.
    - فحص حالة إكمال shell والتثبيت/الترقية التلقائي.
    - فحص جاهزية موفر تضمينات بحث الذاكرة (نموذج محلي، مفتاح API بعيد، أو ثنائي QMD).
    - فحوصات تثبيت المصدر (عدم تطابق مساحة عمل pnpm، أصول واجهة المستخدم المفقودة، ثنائي tsx المفقود).
    - كتابة الإعدادات المحدثة + بيانات معالج الإعداد الوصفية.

  </Accordion>
</AccordionGroup>

## التعبئة الراجعة وإعادة الضبط في واجهة الأحلام

يتضمن مشهد الأحلام في واجهة التحكم إجراءات **التعبئة الراجعة**، و**إعادة الضبط**، و**مسح المؤرض** لسير عمل Dreaming المؤرض. تستخدم هذه الإجراءات طرائق RPC بنمط Gateway doctor، لكنها **ليست** جزءا من إصلاح/ترحيل CLI الخاص بـ `openclaw doctor`.

ما تفعله:

- تفحص **التعبئة الراجعة** ملفات `memory/YYYY-MM-DD.md` التاريخية في مساحة العمل النشطة، وتشغل تمريرة يوميات REM المؤرضة، وتكتب إدخالات تعبئة راجعة قابلة للعكس في `DREAMS.md`.
- تزيل **إعادة الضبط** إدخالات يوميات التعبئة الراجعة الموسومة فقط من `DREAMS.md`.
- يزيل **مسح المؤرض** فقط الإدخالات المرحلية قصيرة الأمد المؤرضة فقط التي جاءت من إعادة تشغيل تاريخية ولم تراكم بعد استدعاء حيا أو دعما يوميا.

ما لا تفعله **من تلقاء نفسها**:

- لا تعدل `MEMORY.md`
- لا تشغل ترحيلات doctor كاملة
- لا تدرج تلقائيا المرشحات المؤرضة في مخزن الترقية القصيرة الأمد الحي ما لم تشغل صراحة مسار CLI المرحلي أولا

إذا أردت أن تؤثر إعادة التشغيل التاريخية المؤرضة في مسار الترقية العميقة العادي، فاستخدم تدفق CLI بدلا من ذلك:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

هذا يدرج المرشحات المؤرضة الدائمة في مخزن Dreaming القصير الأمد مع إبقاء `DREAMS.md` كسطح للمراجعة.

## السلوك المفصل والمبررات

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    إذا كان هذا checkout من git وكان doctor يعمل تفاعليا، فإنه يعرض التحديث (fetch/rebase/build) قبل تشغيل doctor.
  </Accordion>
  <Accordion title="1. Config normalization">
    إذا احتوت الإعدادات على أشكال قيم قديمة (على سبيل المثال `messages.ackReaction` دون تجاوز خاص بقناة)، فإن doctor يطبعها وفق المخطط الحالي.

    يشمل ذلك حقول Talk المسطحة القديمة. إعداد الكلام العام الحالي في Talk هو `talk.provider` + `talk.providers.<provider>`، وإعداد الصوت الفوري هو `talk.realtime.*`. يعيد Doctor كتابة أشكال `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` القديمة إلى خريطة الموفر، ويعيد كتابة محددات الوقت الفوري القديمة في المستوى الأعلى (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) إلى `talk.realtime`.

    يحذر Doctor أيضا عندما تكون `plugins.allow` غير فارغة وتستخدم سياسة الأدوات
    إدخالات أدوات بحرف بدل أو مملوكة للـ Plugin. لا يطابق `tools.allow: ["*"]` إلا الأدوات
    من plugins التي تُحمّل فعليا؛ ولا يتجاوز قائمة السماح الحصرية للـ Plugin.
    يكتب Doctor `plugins.bundledDiscovery: "compat"` لإعدادات قائمة السماح القديمة المرحّلة
    للحفاظ على سلوك موفري الحزمة الحالي، ثم
    يشير إلى إعداد `"allowlist"` الأكثر صرامة.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    عندما تحتوي الإعدادات على مفاتيح مهملة، ترفض الأوامر الأخرى التشغيل وتطلب منك تشغيل `openclaw doctor`.

    سيقوم Doctor بما يلي:

    - شرح أي مفاتيح قديمة وُجدت.
    - عرض الترحيل الذي طبقه.
    - إعادة كتابة `~/.openclaw/openclaw.json` بالمخطط المحدث.

    يرفض بدء تشغيل Gateway تنسيقات الإعدادات القديمة ويطلب منك تشغيل `openclaw doctor --fix`؛ ولا يعيد كتابة `openclaw.json` عند بدء التشغيل. كما يتولى `openclaw doctor --fix` ترحيلات مخزن مهام Cron.

    الترحيلات الحالية:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - تكوينات القنوات المهيأة التي تفتقد سياسة رد مرئية → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` في المستوى الأعلى
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` القديمة → `talk.provider` + `talk.providers.<provider>`
    - محددات Talk الفورية القديمة في المستوى الأعلى (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - للقنوات التي تحتوي على `accounts` مسماة مع بقاء قيم قناة أحادية الحساب في المستوى الأعلى، انقل تلك القيم محددة النطاق بالحساب إلى الحساب المرقى المختار لتلك القناة (`accounts.default` لمعظم القنوات؛ يمكن لـ Matrix الحفاظ على هدف مسمى/افتراضي مطابق موجود)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (الأدوات/المرفوعة/التنفيذ/الصندوق الرملي/الوكلاء الفرعيون)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - أزل `agents.defaults.llm`؛ استخدم `models.providers.<id>.timeoutSeconds` لمهل موفري/نماذج بطيئة
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - أزل `browser.relayBindHost` (إعداد ترحيل إضافة قديم)
    - `models.providers.*.api: "openai"` القديمة → `"openai-completions"` (يتخطى بدء تشغيل Gateway أيضا الموفرين الذين تكون قيمة `api` لديهم مضبوطة على قيمة تعداد مستقبلية أو غير معروفة بدلا من الفشل المغلق)

    تشمل تحذيرات doctor أيضا إرشادات الحساب الافتراضي للقنوات متعددة الحسابات:

    - إذا تم تكوين إدخالين أو أكثر من `channels.<channel>.accounts` من دون `channels.<channel>.defaultAccount` أو `accounts.default`، يحذر doctor من أن التوجيه الاحتياطي قد يختار حسابا غير متوقع.
    - إذا تم ضبط `channels.<channel>.defaultAccount` على معرف حساب غير معروف، يحذر doctor ويسرد معرفات الحسابات المكونة.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    إذا أضفت `models.providers.opencode` أو `opencode-zen` أو `opencode-go` يدويا، فإنه يتجاوز كتالوج OpenCode المدمج من `@mariozechner/pi-ai`. قد يجبر ذلك النماذج على API غير الصحيح أو يصفر التكاليف. يحذر doctor لكي تتمكن من إزالة التجاوز واستعادة توجيه API والتكاليف لكل نموذج.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    إذا كان تكوين المتصفح لديك لا يزال يشير إلى مسار إضافة Chrome المحذوف، فإن doctor يطبعه إلى نموذج إرفاق Chrome MCP المحلي للمضيف الحالي:

    - `browser.profiles.*.driver: "extension"` يصبح `"existing-session"`
    - تتم إزالة `browser.relayBindHost`

    يدقق doctor أيضا في مسار Chrome MCP المحلي للمضيف عند استخدام `defaultProfile: "user"` أو ملف تعريف `existing-session` مكون:

    - يتحقق مما إذا كان Google Chrome مثبتا على المضيف نفسه لملفات تعريف الاتصال التلقائي الافتراضية
    - يتحقق من إصدار Chrome المكتشف ويحذر عندما يكون أقل من Chrome 144
    - يذكرك بتمكين التصحيح عن بعد في صفحة فحص المتصفح (مثل `chrome://inspect/#remote-debugging` أو `brave://inspect/#remote-debugging` أو `edge://inspect/#remote-debugging`)

    لا يستطيع doctor تمكين الإعداد الخاص بجانب Chrome نيابة عنك. لا يزال Chrome MCP المحلي للمضيف يتطلب:

    - متصفحا مبنيا على Chromium بإصدار 144+ على مضيف gateway/node
    - تشغيل المتصفح محليا
    - تمكين التصحيح عن بعد في ذلك المتصفح
    - الموافقة على مطالبة موافقة الإرفاق الأولى في المتصفح

    الجاهزية هنا تتعلق فقط بمتطلبات الإرفاق المحلي. يحافظ Existing-session على حدود مسار Chrome MCP الحالية؛ ولا تزال المسارات المتقدمة مثل `responsebody`، وتصدير PDF، واعتراض التنزيلات، والإجراءات المجمعة تتطلب متصفحا مدارا أو ملف تعريف CDP خاما.

    لا ينطبق هذا الفحص **على** Docker أو الصندوق الرملي أو المتصفح البعيد أو تدفقات headless الأخرى. تستمر هذه التدفقات في استخدام CDP الخام.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    عند تكوين ملف تعريف OAuth لـ OpenAI Codex، يفحص doctor نقطة نهاية تفويض OpenAI للتحقق من أن مكدس TLS المحلي في Node/OpenSSL يمكنه التحقق من سلسلة الشهادات. إذا فشل الفحص بسبب خطأ في الشهادة (مثل `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` أو شهادة منتهية الصلاحية أو شهادة موقعة ذاتيا)، يطبع doctor إرشادات إصلاح خاصة بالمنصة. على macOS مع Node من Homebrew، يكون الإصلاح عادة `brew postinstall ca-certificates`. مع `--deep`، يعمل الفحص حتى إذا كان Gateway سليما.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    إذا أضفت سابقا إعدادات نقل OpenAI القديمة ضمن `models.providers.openai-codex`، فقد تحجب مسار موفر Codex OAuth المدمج الذي تستخدمه الإصدارات الأحدث تلقائيا. يحذر doctor عندما يرى إعدادات النقل القديمة هذه إلى جانب Codex OAuth لكي تتمكن من إزالة تجاوز النقل القديم أو إعادة كتابته واستعادة سلوك التوجيه/الاحتياطي المدمج. لا تزال الوكلاء المخصصة والتجاوزات الخاصة بالرؤوس فقط مدعومة ولا تشغل هذا التحذير.
  </Accordion>
  <Accordion title="2f. Codex route repair">
    يتحقق doctor من مراجع النماذج القديمة `openai-codex/*`. يستخدم توجيه عدة Codex الأصلية مراجع نماذج قانونية `openai/*`؛ تمر دورات وكيل OpenAI عبر عدة خادم تطبيق Codex بدلا من مسار OpenClaw PI OpenAI.

    في وضع `--fix` / `--repair`، يعيد doctor كتابة مراجع الوكيل الافتراضي والمتعلقة بكل وكيل، بما في ذلك النماذج الأساسية، والاحتياطيات، وتجاوزات Heartbeat/الوكيل الفرعي/Compaction، والخطافات، وتجاوزات نماذج القنوات، وحالة مسار الجلسة المستمرة القديمة:

    - يصبح `openai-codex/gpt-*` هو `openai/gpt-*`.
    - يصبح وقت تشغيل الوكيل المطابق `agentRuntime.id: "codex"` فقط عندما يكون Codex مثبتا ومفعلا، ويساهم بعدة `codex`، ولديه OAuth قابل للاستخدام.
    - وإلا يصبح وقت تشغيل الوكيل المطابق `agentRuntime.id: "pi"`.
    - يتم الحفاظ على قوائم احتياطي النماذج الحالية مع إعادة كتابة إدخالاتها القديمة؛ وتنتقل إعدادات كل نموذج المنسوخة من المفتاح القديم إلى المفتاح القانوني `openai/*`.
    - يتم إصلاح `modelProvider`/`providerOverride`، و`model`/`modelOverride`، وإشعارات الاحتياطي، وتثبيتات ملفات تعريف المصادقة، وتثبيتات عدة Codex المستمرة عبر جميع مخازن جلسات الوكلاء المكتشفة.
    - `/codex ...` يعني "التحكم في محادثة Codex أصلية من الدردشة أو ربطها."
    - `/acp ...` أو `runtime: "acp"` يعني "استخدام مهايئ ACP/acpx الخارجي."

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    يفحص doctor أيضا مخازن جلسات الوكلاء المكتشفة بحثا عن حالة مسار قديمة منشأة تلقائيا بعد نقل النماذج أو وقت التشغيل المكون بعيدا عن مسار مملوك لـ Plugin مثل Codex.

    يمكن لـ `openclaw doctor --fix` مسح الحالة القديمة المنشأة تلقائيا مثل تثبيتات النماذج `modelOverrideSource: "auto"`، وبيانات تعريف نموذج وقت التشغيل، ومعرفات العدة المثبتة، وروابط جلسات CLI، وتجاوزات ملفات تعريف المصادقة التلقائية عندما لا يعود المسار المالك لها مكونا. يتم الإبلاغ عن اختيارات نموذج الجلسة الصريحة للمستخدم أو القديمة للمراجعة اليدوية وتترك من دون تغيير؛ بدّلها باستخدام `/model ...` أو `/new` أو أعد ضبط الجلسة عندما لا يعود ذلك المسار مقصودا.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    يستطيع doctor ترحيل تخطيطات قديمة على القرص إلى البنية الحالية:

    - مخزن الجلسات + النصوص:
      - من `~/.openclaw/sessions/` إلى `~/.openclaw/agents/<agentId>/sessions/`
    - دليل الوكيل:
      - من `~/.openclaw/agent/` إلى `~/.openclaw/agents/<agentId>/agent/`
    - حالة مصادقة WhatsApp (Baileys):
      - من `~/.openclaw/credentials/*.json` القديمة (باستثناء `oauth.json`)
      - إلى `~/.openclaw/credentials/whatsapp/<accountId>/...` (معرف الحساب الافتراضي: `default`)

    هذه الترحيلات مبذولة على أفضل وجه ومتماثلة؛ سيصدر doctor تحذيرات عندما يترك أي مجلدات قديمة كنسخ احتياطية. يقوم Gateway/CLI أيضا بترحيل الجلسات القديمة + دليل الوكيل تلقائيا عند بدء التشغيل بحيث يستقر السجل/المصادقة/النماذج في المسار الخاص بكل وكيل من دون تشغيل doctor يدويا. يتم ترحيل مصادقة WhatsApp عمدا عبر `openclaw doctor` فقط. تقارن تسوية موفر Talk/خريطة الموفر الآن بالمساواة البنيوية، لذلك لم تعد الفروق التي تخص ترتيب المفاتيح فقط تشغل تغييرات `doctor --fix` متكررة بلا أثر.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    يفحص doctor جميع بيانات Plugin المثبتة بحثا عن مفاتيح قدرة قديمة في المستوى الأعلى (`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders`). عند العثور عليها، يعرض نقلها إلى كائن `contracts` وإعادة كتابة ملف البيان في مكانه. هذا الترحيل متماثل؛ إذا كان مفتاح `contracts` يحتوي بالفعل على القيم نفسها، تتم إزالة المفتاح القديم من دون تكرار البيانات.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    يتحقق doctor أيضا من مخزن مهام cron (`~/.openclaw/cron/jobs.json` افتراضيا، أو `cron.store` عند تجاوزه) بحثا عن أشكال مهام قديمة لا يزال المجدول يقبلها للتوافق.

    تشمل تنظيفات cron الحالية:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - حقول الحمولة في المستوى الأعلى (`message`، `model`، `thinking`، ...) → `payload`
    - حقول التسليم في المستوى الأعلى (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - أسماء التسليم المستعارة `provider` في الحمولة → `delivery.channel` صريح
    - مهام احتياط Webhook البسيطة القديمة `notify: true` → `delivery.mode="webhook"` صريح مع `delivery.to=cron.webhook`

    Doctor لا يهاجر تلقائيًا إلا مهام `notify: true` عندما يستطيع فعل ذلك من دون تغيير السلوك. إذا جمعت مهمة بين بديل notify القديم ونمط تسليم قائم غير webhook، يصدر doctor تحذيرًا ويترك تلك المهمة للمراجعة اليدوية.

    على Linux، يحذر doctor أيضًا عندما لا يزال crontab الخاص بالمستخدم يستدعي `~/.openclaw/bin/ensure-whatsapp.sh` القديم. هذا السكربت المحلي على المضيف لا تتم صيانته بواسطة OpenClaw الحالي ويمكنه كتابة رسائل `Gateway inactive` خاطئة إلى `~/.openclaw/logs/whatsapp-health.log` عندما يتعذر على cron الوصول إلى ناقل مستخدم systemd. أزل إدخال crontab القديم باستخدام `crontab -e`؛ واستخدم `openclaw channels status --probe`، و`openclaw doctor`، و`openclaw gateway status` لفحوصات السلامة الحالية.

  </Accordion>
  <Accordion title="3c. تنظيف قفل الجلسة">
    يفحص Doctor كل دليل جلسة وكيل بحثًا عن ملفات أقفال كتابة قديمة — وهي ملفات تبقى عندما تنتهي جلسة بشكل غير طبيعي. لكل ملف قفل يتم العثور عليه، يبلّغ عن: المسار، وPID، وما إذا كان PID لا يزال حيًا، وعمر القفل، وما إذا كان يُعد قديمًا (PID ميت أو أقدم من 30 دقيقة). في وضع `--fix` / `--repair` يزيل ملفات القفل القديمة تلقائيًا؛ وإلا فيطبع ملاحظة ويوجهك إلى إعادة التشغيل باستخدام `--fix`.
  </Accordion>
  <Accordion title="3d. إصلاح فرع سجل الجلسة">
    يفحص Doctor ملفات JSONL الخاصة بجلسات الوكيل بحثًا عن شكل الفرع المكرر الذي أنشأه خطأ إعادة كتابة سجل المطالبة في 2026.4.24: دور مستخدم متروك مع سياق وقت تشغيل OpenClaw الداخلي بالإضافة إلى شقيق نشط يحتوي على مطالبة المستخدم المرئية نفسها. في وضع `--fix` / `--repair`، ينسخ doctor كل ملف متأثر احتياطيًا بجانب الأصل ويعيد كتابة السجل إلى الفرع النشط حتى لا يرى سجل gateway وقراء الذاكرة أدوارًا مكررة بعد الآن.
  </Accordion>
  <Accordion title="4. فحوصات سلامة الحالة (استمرار الجلسات، والتوجيه، والسلامة)">
    دليل الحالة هو جذع الدماغ التشغيلي. إذا اختفى، فستفقد الجلسات، وبيانات الاعتماد، والسجلات، والتكوين (ما لم تكن لديك نسخ احتياطية في مكان آخر).

    يتحقق Doctor من:

    - **دليل الحالة مفقود**: يحذر من فقدان كارثي للحالة، ويطلب إعادة إنشاء الدليل، ويذكرك بأنه لا يمكنه استرداد البيانات المفقودة.
    - **أذونات دليل الحالة**: يتحقق من قابلية الكتابة؛ ويعرض إصلاح الأذونات (ويصدر تلميح `chown` عند اكتشاف عدم تطابق المالك/المجموعة).
    - **دليل حالة macOS مزامن مع السحابة**: يحذر عندما تحل الحالة ضمن iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) أو `~/Library/CloudStorage/...` لأن المسارات المدعومة بالمزامنة يمكن أن تسبب إدخال/إخراج أبطأ وسباقات قفل/مزامنة.
    - **دليل حالة Linux على SD أو eMMC**: يحذر عندما تحل الحالة إلى مصدر تركيب `mmcblk*`، لأن الإدخال/الإخراج العشوائي المدعوم ببطاقات SD أو eMMC قد يكون أبطأ ويتآكل أسرع تحت كتابات الجلسات وبيانات الاعتماد.
    - **أدلة الجلسات مفقودة**: `sessions/` ودليل مخزن الجلسات مطلوبان لاستمرار السجل وتجنب أعطال `ENOENT`.
    - **عدم تطابق السجل**: يحذر عندما تكون إدخالات الجلسات الأخيرة تفتقد ملفات السجل.
    - **الجلسة الرئيسية "JSONL بسطر واحد"**: يضع علامة عندما يحتوي السجل الرئيسي على سطر واحد فقط (السجل لا يتراكم).
    - **أدلة حالة متعددة**: يحذر عندما توجد عدة مجلدات `~/.openclaw` عبر أدلة المنزل أو عندما يشير `OPENCLAW_STATE_DIR` إلى مكان آخر (يمكن أن ينقسم السجل بين التثبيتات).
    - **تذكير الوضع البعيد**: إذا كان `gateway.mode=remote`، يذكرك doctor بتشغيله على المضيف البعيد (الحالة تعيش هناك).
    - **أذونات ملف التكوين**: يحذر إذا كان `~/.openclaw/openclaw.json` قابلًا للقراءة من المجموعة/العالم ويعرض تشديده إلى `600`.

  </Accordion>
  <Accordion title="5. صحة مصادقة النموذج (انتهاء OAuth)">
    يفحص Doctor ملفات تعريف OAuth في مخزن المصادقة، ويحذر عندما تكون الرموز على وشك الانتهاء/منتهية، ويمكنه تحديثها عندما يكون ذلك آمنًا. إذا كان ملف تعريف Anthropic OAuth/الرمز قديمًا، يقترح مفتاح Anthropic API أو مسار setup-token الخاص بـ Anthropic. لا تظهر مطالبات التحديث إلا عند التشغيل تفاعليًا (TTY)؛ ويتخطى `--non-interactive` محاولات التحديث.

    عندما يفشل تحديث OAuth نهائيًا (مثل `refresh_token_reused`، أو `invalid_grant`، أو مزود يخبرك بتسجيل الدخول مرة أخرى)، يبلّغ doctor بأن إعادة المصادقة مطلوبة ويطبع أمر `openclaw models auth login --provider ...` الدقيق الذي يجب تشغيله.

    يبلّغ Doctor أيضًا عن ملفات تعريف المصادقة غير القابلة للاستخدام مؤقتًا بسبب:

    - فترات تهدئة قصيرة (حدود المعدل/انتهاءات المهلة/إخفاقات المصادقة)
    - تعطيلات أطول (إخفاقات الفوترة/الرصيد)

  </Accordion>
  <Accordion title="6. التحقق من نموذج الخطافات">
    إذا تم تعيين `hooks.gmail.model`، يتحقق doctor من مرجع النموذج مقابل الفهرس وقائمة السماح ويحذر عندما لا يمكن حله أو يكون غير مسموح به.
  </Accordion>
  <Accordion title="7. إصلاح صورة sandbox">
    عند تمكين العزل، يتحقق doctor من صور Docker ويعرض بناءها أو التبديل إلى الأسماء القديمة إذا كانت الصورة الحالية مفقودة.
  </Accordion>
  <Accordion title="7b. تنظيف تثبيت Plugin">
    يزيل Doctor حالة تهيئة تبعيات Plugin القديمة التي أنشأها OpenClaw في وضع `openclaw doctor --fix` / `openclaw doctor --repair`. يشمل ذلك جذور التبعيات المولدة القديمة، وأدلة مراحل التثبيت القديمة، وبقايا الحزم المحلية من كود إصلاح تبعيات Plugin المضمنة السابقة، ونسخ npm المدار اليتيمة أو المستردة من Plugins `@openclaw/*` المضمنة التي يمكن أن تحجب البيان المضمن الحالي.

    يمكن لـ Doctor أيضًا إعادة تثبيت Plugins القابلة للتنزيل المفقودة عندما يشير إليها التكوين لكن سجل Plugin المحلي لا يستطيع العثور عليها. تشمل الأمثلة `plugins.entries` مادية، وإعدادات channel/provider/search المكونة، وأوقات تشغيل الوكلاء المكونة. أثناء تحديثات الحزم، يتجنب doctor تشغيل إصلاح Plugin عبر مدير الحزم أثناء تبديل الحزمة الأساسية؛ شغل `openclaw doctor --fix` مرة أخرى بعد التحديث إذا كان Plugin مكون لا يزال يحتاج إلى استرداد. لا يشغل بدء تشغيل Gateway ولا إعادة تحميل التكوين مديري حزم؛ تبقى تثبيتات Plugin عمل doctor/install/update صريحًا.

  </Accordion>
  <Accordion title="8. تلميحات ترحيل خدمات Gateway وتنظيفها">
    يكتشف Doctor خدمات gateway القديمة (launchd/systemd/schtasks) ويعرض إزالتها وتثبيت خدمة OpenClaw باستخدام منفذ gateway الحالي. يمكنه أيضًا فحص خدمات إضافية شبيهة بـ gateway وطباعة تلميحات تنظيف. تُعد خدمات gateway الخاصة بـ OpenClaw المسماة بملفات تعريف خدمات من الدرجة الأولى ولا توضع عليها علامة "إضافية."

    على Linux، إذا كانت خدمة gateway على مستوى المستخدم مفقودة لكن توجد خدمة gateway خاصة بـ OpenClaw على مستوى النظام، فلا يثبت doctor خدمة ثانية على مستوى المستخدم تلقائيًا. افحص باستخدام `openclaw gateway status --deep` أو `openclaw doctor --deep`، ثم أزل التكرار أو عيّن `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يمتلك مشرف نظام دورة حياة gateway.

  </Accordion>
  <Accordion title="8b. ترحيل Startup Matrix">
    عندما يكون لحساب قناة Matrix ترحيل حالة قديم معلق أو قابل للإجراء، ينشئ doctor (في وضع `--fix` / `--repair`) لقطة قبل الترحيل ثم يشغل خطوات الترحيل بأفضل جهد: ترحيل حالة Matrix القديمة وتحضير الحالة المشفرة القديمة. كلتا الخطوتين غير قاتلتين؛ تُسجل الأخطاء ويستمر بدء التشغيل. في وضع القراءة فقط (`openclaw doctor` بدون `--fix`) يتم تخطي هذا الفحص بالكامل.
  </Accordion>
  <Accordion title="8c. إقران الجهاز وانحراف المصادقة">
    يفحص Doctor الآن حالة إقران الأجهزة كجزء من تمرير الصحة العادي.

    ما يبلّغ عنه:

    - طلبات إقران أولية معلقة
    - ترقيات أدوار معلقة للأجهزة المقترنة بالفعل
    - ترقيات نطاق معلقة للأجهزة المقترنة بالفعل
    - إصلاحات عدم تطابق المفتاح العام حيث لا يزال معرف الجهاز مطابقًا لكن هوية الجهاز لم تعد تطابق السجل المعتمد
    - سجلات مقترنة تفتقد رمزًا نشطًا لدور معتمد
    - رموز مقترنة انحرفت نطاقاتها خارج أساس الإقران المعتمد
    - إدخالات رموز أجهزة مخزنة محليًا للجهاز الحالي تسبق تدوير رمز على جانب gateway أو تحمل بيانات وصفية قديمة للنطاق

    لا يوافق Doctor تلقائيًا على طلبات الإقران ولا يدور رموز الأجهزة تلقائيًا. بدلًا من ذلك يطبع الخطوات التالية الدقيقة:

    - افحص الطلبات المعلقة باستخدام `openclaw devices list`
    - وافق على الطلب الدقيق باستخدام `openclaw devices approve <requestId>`
    - دور رمزًا جديدًا باستخدام `openclaw devices rotate --device <deviceId> --role <role>`
    - أزل سجلًا قديمًا وأعد الموافقة عليه باستخدام `openclaw devices remove <deviceId>`

    يغلق هذا الفجوة الشائعة "مقترن بالفعل لكن لا يزال يطلب الإقران": يميز doctor الآن بين الإقران لأول مرة وترقيات الدور/النطاق المعلقة وانحراف الرمز/هوية الجهاز القديمة.

  </Accordion>
  <Accordion title="9. تحذيرات الأمان">
    يصدر Doctor تحذيرات عندما يكون مزود مفتوحًا للرسائل الخاصة بدون قائمة سماح، أو عندما تكون سياسة مكونة بطريقة خطرة.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    إذا كان التشغيل يتم كخدمة مستخدم systemd، يضمن doctor تمكين linger حتى يبقى gateway حيًا بعد تسجيل الخروج.
  </Accordion>
  <Accordion title="11. حالة مساحة العمل (Skills، وPlugins، والأدلة القديمة)">
    يطبع Doctor ملخصًا لحالة مساحة العمل للوكيل الافتراضي:

    - **حالة Skills**: يحصي Skills المؤهلة، وناقصة المتطلبات، والمحظورة بقائمة السماح.
    - **أدلة مساحة العمل القديمة**: يحذر عندما توجد `~/openclaw` أو أدلة مساحة عمل قديمة أخرى بجانب مساحة العمل الحالية.
    - **حالة Plugin**: يحصي Plugins المفعلة/المعطلة/التي بها أخطاء؛ يسرد معرفات Plugin لأي أخطاء؛ ويبلّغ عن قدرات Plugin الحزمة.
    - **تحذيرات توافق Plugin**: يضع علامات على Plugins التي لديها مشكلات توافق مع وقت التشغيل الحالي.
    - **تشخيصات Plugin**: يعرض أي تحذيرات أو أخطاء وقت التحميل الصادرة عن سجل Plugin.

  </Accordion>
  <Accordion title="11b. حجم ملف bootstrap">
    يتحقق Doctor مما إذا كانت ملفات bootstrap الخاصة بمساحة العمل (مثل `AGENTS.md`، أو `CLAUDE.md`، أو ملفات السياق الأخرى المحقونة) قريبة من ميزانية الأحرف المكونة أو تتجاوزها. يبلّغ عن عدد الأحرف الخام مقابل المحقونة لكل ملف، ونسبة الاقتطاع، وسبب الاقتطاع (`max/file` أو `max/total`)، وإجمالي الأحرف المحقونة كجزء من الميزانية الإجمالية. عندما تُقتطع الملفات أو تقترب من الحد، يطبع doctor نصائح لضبط `agents.defaults.bootstrapMaxChars` و`agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. تنظيف Plugin القنوات القديمة">
    عندما يزيل `openclaw doctor --fix` Plugin قناة مفقودًا، فإنه يزيل أيضًا التكوين المتدلي المحدد لنطاق القناة الذي كان يشير إلى ذلك Plugin: إدخالات `channels.<id>`، وأهداف Heartbeat التي سمت القناة، وتجاوزات `agents.*.models["<channel>/*"]`. يمنع هذا حلقات إقلاع Gateway حيث اختفى وقت تشغيل القناة لكن التكوين لا يزال يطلب من gateway الارتباط به.
  </Accordion>
  <Accordion title="11c. إكمال الصدفة">
    يتحقق Doctor مما إذا كان إكمال المفتاح Tab مثبتًا للصدفة الحالية (zsh، أو bash، أو fish، أو PowerShell):

    - إذا كان ملف تعريف الصدفة يستخدم نمط إكمال ديناميكيًا بطيئًا (`source <(openclaw completion ...)`)، يرقّيه doctor إلى صيغة الملف المخزن مؤقتًا الأسرع.
    - إذا كان الإكمال مكونًا في ملف التعريف لكن ملف التخزين المؤقت مفقود، يعيد doctor إنشاء التخزين المؤقت تلقائيًا.
    - إذا لم يكن أي إكمال مكونًا على الإطلاق، يطلب doctor تثبيته (الوضع التفاعلي فقط؛ يتم تخطيه مع `--non-interactive`).

    شغل `openclaw completion --write-state` لإعادة إنشاء التخزين المؤقت يدويًا.

  </Accordion>
  <Accordion title="12. فحوصات مصادقة Gateway (الرمز المحلي)">
    يتحقق Doctor من جاهزية مصادقة رمز gateway المحلي.

    - إذا كان وضع الرمز يحتاج إلى رمز ولا يوجد مصدر رمز، يعرض doctor إنشاء واحد.
    - إذا كان `gateway.auth.token` مدارًا بواسطة SecretRef لكنه غير متاح، يحذر doctor ولا يستبدله بنص صريح.
    - يفرض `openclaw doctor --generate-gateway-token` الإنشاء فقط عندما لا يكون SecretRef للرمز مكونًا.

  </Accordion>
  <Accordion title="12b. إصلاحات SecretRef المدركة للقراءة فقط">
    تحتاج بعض تدفقات الإصلاح إلى فحص بيانات الاعتماد المكوّنة دون إضعاف سلوك الفشل السريع في وقت التشغيل.

    - يستخدم `openclaw doctor --fix` الآن نموذج ملخص SecretRef نفسه للقراءة فقط الذي تستخدمه أوامر عائلة الحالة لإصلاحات التكوين المستهدفة.
    - مثال: يحاول إصلاح `allowFrom` / `groupAllowFrom` `@username` في Telegram استخدام بيانات اعتماد البوت المكوّنة عند توفرها.
    - إذا كان رمز بوت Telegram مكوّنًا عبر SecretRef لكنه غير متاح في مسار الأمر الحالي، يبلّغ doctor أن بيانات الاعتماد مكوّنة لكنها غير متاحة، ويتجاوز الحل التلقائي بدلًا من التعطل أو الإبلاغ خطأً عن أن الرمز مفقود.

  </Accordion>
  <Accordion title="13. فحص صحة Gateway + إعادة التشغيل">
    يجري Doctor فحص صحة ويعرض إعادة تشغيل Gateway عندما يبدو غير سليم.
  </Accordion>
  <Accordion title="13b. جاهزية بحث الذاكرة">
    يتحقق Doctor مما إذا كان موفر تضمينات بحث الذاكرة المكوّن جاهزًا للوكيل الافتراضي. يعتمد السلوك على الواجهة الخلفية والموفر المكوّنين:

    - **واجهة QMD الخلفية**: تتحقق مما إذا كان ملف `qmd` الثنائي متاحًا ويمكن تشغيله. وإذا لم يكن كذلك، تطبع إرشادات إصلاح تتضمن حزمة npm وخيار مسار ثنائي يدوي.
    - **موفر محلي صريح**: يتحقق من وجود ملف نموذج محلي أو عنوان URL معروف لنموذج بعيد/قابل للتنزيل. وإذا كان مفقودًا، يقترح التبديل إلى موفر بعيد.
    - **موفر بعيد صريح** (`openai` و`voyage` وغيرهما): يتحقق من وجود مفتاح API في البيئة أو مخزن المصادقة. ويطبع تلميحات إصلاح قابلة للتنفيذ إذا كان مفقودًا.
    - **موفر تلقائي**: يتحقق أولًا من توفر النموذج المحلي، ثم يجرب كل موفر بعيد بترتيب الاختيار التلقائي.

    عند توفر نتيجة مسبار Gateway مخبأة (كان Gateway سليمًا وقت الفحص)، يطابق doctor نتيجتها مع التكوين المرئي من CLI وينبه إلى أي اختلاف. لا يبدأ Doctor اختبار تضمينات جديدًا في المسار الافتراضي؛ استخدم أمر حالة الذاكرة العميق عندما تريد فحص موفر حيًا.

    استخدم `openclaw memory status --deep` للتحقق من جاهزية التضمينات في وقت التشغيل.

  </Accordion>
  <Accordion title="14. تحذيرات حالة القناة">
    إذا كان Gateway سليمًا، يشغّل doctor مسبار حالة القناة ويبلّغ عن التحذيرات مع إصلاحات مقترحة.
  </Accordion>
  <Accordion title="15. تدقيق تكوين المشرف + الإصلاح">
    يتحقق Doctor من تكوين المشرف المثبت (launchd/systemd/schtasks) بحثًا عن الإعدادات الافتراضية المفقودة أو القديمة (مثل تبعيات systemd لـ network-online وتأخير إعادة التشغيل). وعندما يجد عدم تطابق، يوصي بتحديث ويمكنه إعادة كتابة ملف الخدمة/المهمة إلى الإعدادات الافتراضية الحالية.

    ملاحظات:

    - يطلب `openclaw doctor` التأكيد قبل إعادة كتابة تكوين المشرف.
    - يقبل `openclaw doctor --yes` مطالبات الإصلاح الافتراضية.
    - يطبق `openclaw doctor --repair` الإصلاحات الموصى بها دون مطالبات.
    - يستبدل `openclaw doctor --repair --force` تكوينات المشرف المخصصة.
    - يبقي `OPENCLAW_SERVICE_REPAIR_POLICY=external` doctor للقراءة فقط في دورة حياة خدمة Gateway. ولا يزال يبلّغ عن صحة الخدمة ويشغّل الإصلاحات غير الخدمية، لكنه يتجاوز تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة، وإعادة كتابة تكوين المشرف، وتنظيف الخدمات القديمة لأن مشرفًا خارجيًا يملك دورة الحياة تلك.
    - على Linux، لا يعيد doctor كتابة بيانات تعريف الأمر/نقطة الدخول بينما تكون وحدة Gateway المطابقة في systemd نشطة. ويتجاهل أيضًا وحدات Gateway الشبيهة الإضافية غير القديمة وغير النشطة أثناء فحص الخدمات المكررة كي لا تنشئ ملفات الخدمات المصاحبة ضجيج تنظيف.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان `gateway.auth.token` مُدارًا بواسطة SecretRef، فإن تثبيت/إصلاح خدمة doctor يتحقق من SecretRef لكنه لا يحفظ قيم الرمز النصية الصريحة المحلولة داخل بيانات تعريف بيئة خدمة المشرف.
    - يكتشف Doctor قيم بيئة الخدمة المُدارة المستندة إلى `.env`/SecretRef التي ضمّنتها تثبيتات LaunchAgent أو systemd أو Windows Scheduled Task الأقدم ضمنيًا، ويعيد كتابة بيانات تعريف الخدمة بحيث تُحمَّل تلك القيم من مصدر وقت التشغيل بدلًا من تعريف المشرف.
    - يكتشف Doctor عندما لا يزال أمر الخدمة يثبت `--port` قديمًا بعد تغيّر `gateway.port` ويعيد كتابة بيانات تعريف الخدمة إلى المنفذ الحالي.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef المكوّن للرمز غير محلول، يمنع doctor مسار التثبيت/الإصلاح مع إرشادات قابلة للتنفيذ.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنًا وكان `gateway.auth.mode` غير مضبوط، يمنع doctor التثبيت/الإصلاح حتى يضبط الوضع صراحةً.
    - بالنسبة لوحدات user-systemd في Linux، تشمل فحوصات doctor لانحراف الرمز الآن مصدري `Environment=` و`EnvironmentFile=` عند مقارنة بيانات تعريف مصادقة الخدمة.
    - ترفض إصلاحات خدمة Doctor إعادة كتابة خدمة Gateway أو إيقافها أو إعادة تشغيلها من ملف OpenClaw ثنائي أقدم عندما يكون التكوين قد كُتب آخر مرة بواسطة إصدار أحدث. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - يمكنك دائمًا فرض إعادة كتابة كاملة عبر `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. تشخيصات وقت تشغيل Gateway والمنفذ">
    يفحص Doctor وقت تشغيل الخدمة (PID، وحالة الخروج الأخيرة) ويحذر عندما تكون الخدمة مثبتة لكنها لا تعمل فعليًا. كما يتحقق من تعارضات المنافذ على منفذ Gateway (الافتراضي `18789`) ويبلّغ عن الأسباب المحتملة (Gateway يعمل بالفعل، أو نفق SSH).
  </Accordion>
  <Accordion title="17. أفضل ممارسات وقت تشغيل Gateway">
    يحذر Doctor عندما تعمل خدمة Gateway على Bun أو مسار Node مُدار بالإصدارات (`nvm` و`fnm` و`volta` و`asdf` وغير ذلك). تتطلب قنوات WhatsApp + Telegram استخدام Node، ويمكن أن تتعطل مسارات مديري الإصدارات بعد الترقيات لأن الخدمة لا تحمّل تهيئة الصَدَفة لديك. يعرض Doctor الترحيل إلى تثبيت Node نظامي عند توفره (Homebrew/apt/choco).

    تستخدم LaunchAgents المثبتة أو المصلحة حديثًا على macOS مسار PATH نظاميًا قياسيًا (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) بدلًا من نسخ PATH الخاص بالصَدَفة التفاعلية، بحيث لا تغيّر أدلة Volta وasdf وfnm وpnpm وغيرها من مديري الإصدارات أي عمليات Node الفرعية يتم حلّها. لا تزال خدمات Linux تحتفظ بجذور البيئة الصريحة (`NVM_DIR` و`FNM_DIR` و`VOLTA_HOME` و`ASDF_DATA_DIR` و`BUN_INSTALL` و`PNPM_HOME`) وأدلة user-bin المستقرة، لكن أدلة الرجوع الاحتياطية المقدّرة لمديري الإصدارات لا تُكتب إلى PATH الخدمة إلا عندما تكون تلك الأدلة موجودة على القرص.

  </Accordion>
  <Accordion title="18. كتابة التكوين + بيانات معالج الإعداد التعريفية">
    يحفظ Doctor أي تغييرات في التكوين ويختم بيانات معالج الإعداد التعريفية لتسجيل تشغيل doctor.
  </Accordion>
  <Accordion title="19. نصائح مساحة العمل (النسخ الاحتياطي + نظام الذاكرة)">
    يقترح Doctor نظام ذاكرة لمساحة العمل عند غيابه، ويطبع نصيحة نسخ احتياطي إذا لم تكن مساحة العمل ضمن git بالفعل.

    راجع [/concepts/agent-workspace](/ar/concepts/agent-workspace) للحصول على دليل كامل لبنية مساحة العمل والنسخ الاحتياطي باستخدام git (يوصى بـ GitHub أو GitLab خاص).

  </Accordion>
</AccordionGroup>

## ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
