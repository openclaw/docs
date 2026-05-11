---
read_when:
    - إضافة عمليات ترحيل doctor أو تعديلها
    - إدخال تغييرات غير متوافقة مع الإصدارات السابقة في التكوين
sidebarTitle: Doctor
summary: 'أمر Doctor: فحوصات الصحة، وترحيلات الإعدادات، وخطوات الإصلاح'
title: أداة التشخيص
x-i18n:
    generated_at: "2026-05-11T20:32:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4994177bb3a3751211437403becc1c68c7f07fa52a72b84c9d129c7922705522
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` هو أداة الإصلاح والترحيل في OpenClaw. تصلح الإعدادات/الحالة القديمة، وتتحقق من الصحة، وتوفر خطوات إصلاح قابلة للتنفيذ.

## البدء السريع

```bash
openclaw doctor
```

### أوضاع بدون واجهة والأتمتة

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    اقبل الإعدادات الافتراضية دون مطالبة (بما في ذلك خطوات إصلاح إعادة التشغيل/الخدمة/الصندوق الرملي عند انطباقها).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    طبّق الإصلاحات الموصى بها دون مطالبة (الإصلاحات + إعادة التشغيل عندما تكون آمنة).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    طبّق الإصلاحات الجريئة أيضًا (تستبدل إعدادات المشرف المخصصة).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    شغّل دون مطالبات وطبّق فقط عمليات الترحيل الآمنة (تطبيع الإعدادات + نقل الحالة على القرص). يتخطى إجراءات إعادة التشغيل/الخدمة/الصندوق الرملي التي تتطلب تأكيدًا بشريًا. تعمل عمليات ترحيل الحالة القديمة تلقائيًا عند اكتشافها.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    افحص خدمات النظام بحثًا عن تثبيتات Gateway إضافية (launchd/systemd/schtasks).

  </Tab>
</Tabs>

إذا كنت تريد مراجعة التغييرات قبل الكتابة، فافتح ملف الإعدادات أولًا:

```bash
cat ~/.openclaw/openclaw.json
```

## ما الذي يفعله (ملخص)

<AccordionGroup>
  <Accordion title="الصحة، وواجهة المستخدم، والتحديثات">
    - تحديث اختياري قبل التشغيل لتثبيتات git (تفاعلي فقط).
    - فحص حداثة بروتوكول واجهة المستخدم (يعيد بناء واجهة التحكم عندما يكون مخطط البروتوكول أحدث).
    - فحص الصحة + مطالبة بإعادة التشغيل.
    - ملخص حالة Skills (مؤهلة/مفقودة/محظورة) وحالة Plugin.

  </Accordion>
  <Accordion title="الإعدادات والترحيلات">
    - تطبيع الإعدادات للقيم القديمة.
    - ترحيل إعدادات Talk من حقول `talk.*` المسطحة القديمة إلى `talk.provider` + `talk.providers.<provider>`.
    - فحوصات ترحيل المتصفح لإعدادات إضافة Chrome القديمة وجاهزية Chrome MCP.
    - تحذيرات تجاوز موفر OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - تحذيرات حجب Codex OAuth (`models.providers.openai-codex`).
    - فحص متطلبات OAuth TLS المسبقة لملفات OpenAI Codex OAuth.
    - تحذيرات قائمة السماح للـ Plugin/الأداة عندما تكون `plugins.allow` مقيدة لكن سياسة الأدوات ما زالت تطلب أحرف بدل أو أدوات مملوكة للـ Plugin.
    - ترحيل الحالة القديمة على القرص (الجلسات/دليل الوكيل/مصادقة WhatsApp).
    - ترحيل مفاتيح عقد بيان Plugin القديمة (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - ترحيل مخزن Cron القديم (`jobId`, `schedule.cron`, حقول التسليم/الحمولة في المستوى الأعلى، `provider` في الحمولة، وظائف Webhook احتياطية بسيطة من نوع `notify: true`).
    - تنظيف سياسة وقت التشغيل القديمة على مستوى الوكيل بالكامل؛ سياسة وقت التشغيل للموفر/النموذج هي محدد المسار النشط.
    - تنظيف إعدادات Plugin القديمة عندما تكون الإضافات مفعّلة؛ عندما تكون `plugins.enabled=false`، تُعامل مراجع Plugin القديمة كإعدادات احتواء خاملة وتُحفظ.

  </Accordion>
  <Accordion title="الحالة والسلامة">
    - فحص ملف قفل الجلسة وتنظيف الأقفال القديمة.
    - إصلاح نصوص الجلسات لفروع إعادة كتابة المطالبات المكررة التي أنشأتها إصدارات 2026.4.24 المتأثرة.
    - اكتشاف علامة قبر استرداد إعادة تشغيل الوكيل الفرعي العالق، مع دعم `--fix` لمسح أعلام الاسترداد الملغاة القديمة حتى لا يستمر بدء التشغيل في معاملة الابن كأنه أُلغي بسبب إعادة التشغيل.
    - فحوصات سلامة الحالة والأذونات (الجلسات، النصوص، دليل الحالة).
    - فحوصات أذونات ملف الإعدادات (chmod 600) عند التشغيل محليًا.
    - صحة مصادقة النموذج: تتحقق من انتهاء OAuth، ويمكنها تحديث الرموز التي تقترب من الانتهاء، وتبلغ عن حالات التهدئة/التعطيل لملف المصادقة.
    - اكتشاف دليل مساحة عمل إضافي (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway، والخدمات، والمشرفون">
    - إصلاح صورة الصندوق الرملي عندما يكون العزل الرملي مفعّلًا.
    - ترحيل الخدمة القديمة واكتشاف Gateway إضافية.
    - ترحيل حالة قناة Matrix القديمة (في وضع `--fix` / `--repair`).
    - فحوصات وقت تشغيل Gateway (الخدمة مثبتة لكنها لا تعمل؛ تسمية launchd مخزنة مؤقتًا).
    - تحذيرات حالة القنوات (مفحوصة من Gateway العاملة).
    - توجد فحوصات الأذونات الخاصة بالقنوات تحت `openclaw channels capabilities`؛ على سبيل المثال، تُدقَّق أذونات قناة Discord الصوتية باستخدام `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - فحوصات استجابة WhatsApp لتدهور صحة حلقة أحداث Gateway مع بقاء عملاء TUI المحليين قيد التشغيل؛ يوقف `--fix` فقط عملاء TUI المحليين المتحقق منهم.
    - إصلاح مسار Codex لمراجع نماذج `openai-codex/*` القديمة في النماذج الأساسية، والمسارات الاحتياطية، وتجاوزات Heartbeat/الوكيل الفرعي/Compaction، والخطافات، وتجاوزات نماذج القنوات، وتثبيتات مسار الجلسة؛ يعيد `--fix` كتابتها إلى `openai/*`، ويزيل تثبيتات وقت التشغيل القديمة للجلسة/الوكيل بالكامل، ويترك مراجع وكيل OpenAI القياسية على حاضنة Codex الافتراضية.
    - تدقيق إعدادات المشرف (launchd/systemd/schtasks) مع إصلاح اختياري.
    - تنظيف بيئة الوكيل المضمنة لخدمات Gateway التي التقطت قيم shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` أثناء التثبيت أو التحديث.
    - فحوصات أفضل ممارسات وقت تشغيل Gateway (Node مقابل Bun، ومسارات مدير الإصدارات).
    - تشخيصات تعارض منفذ Gateway (الافتراضي `18789`).

  </Accordion>
  <Accordion title="المصادقة، والأمان، والاقتران">
    - تحذيرات أمان لسياسات الرسائل المباشرة المفتوحة.
    - فحوصات مصادقة Gateway لوضع الرمز المحلي (تعرض إنشاء رمز عندما لا يوجد مصدر رمز؛ لا تستبدل إعدادات token SecretRef).
    - اكتشاف مشكلات اقتران الأجهزة (طلبات الاقتران الأولى المعلقة، وترقيات الدور/النطاق المعلقة، وانحراف ذاكرة التخزين المؤقت المحلية القديمة لرمز الجهاز، وانحراف مصادقة سجل الاقتران).

  </Accordion>
  <Accordion title="مساحة العمل و shell">
    - فحص systemd linger على Linux.
    - فحص حجم ملف تمهيد مساحة العمل (تحذيرات الاقتطاع/الاقتراب من الحد لملفات السياق).
    - فحص جاهزية Skills للوكيل الافتراضي؛ يبلغ عن Skills المسموح بها التي تفتقد ملفات تنفيذية أو بيئة أو إعدادات أو متطلبات نظام تشغيل، ويمكن لـ `--fix` تعطيل Skills غير المتاحة في `skills.entries`.
    - فحص حالة إكمال shell والتثبيت/الترقية التلقائية.
    - فحص جاهزية موفر تضمينات البحث في الذاكرة (نموذج محلي، أو مفتاح API بعيد، أو ملف QMD تنفيذي).
    - فحوصات تثبيت المصدر (عدم تطابق مساحة عمل pnpm، أصول واجهة مستخدم مفقودة، ملف tsx تنفيذي مفقود).
    - يكتب الإعدادات المحدثة + بيانات معالج الإعداد الوصفية.

  </Accordion>
</AccordionGroup>

## الملء الرجعي وإعادة الضبط في واجهة الأحلام

يتضمن مشهد الأحلام في واجهة التحكم إجراءات **الملء الرجعي**، و**إعادة الضبط**، و**مسح المؤرض** لسير عمل Dreaming المؤرض. تستخدم هذه الإجراءات أساليب RPC بأسلوب doctor في Gateway، لكنها **ليست** جزءًا من إصلاح/ترحيل `openclaw doctor` في CLI.

ما تفعله:

- يفحص **الملء الرجعي** ملفات `memory/YYYY-MM-DD.md` التاريخية في مساحة العمل النشطة، ويشغّل مرور يوميات REM المؤرض، ويكتب إدخالات ملء رجعي قابلة للعكس في `DREAMS.md`.
- تزيل **إعادة الضبط** فقط إدخالات يوميات الملء الرجعي الموسومة من `DREAMS.md`.
- يزيل **مسح المؤرض** فقط الإدخالات المرحلية قصيرة المدى المؤرضة فقط التي جاءت من إعادة تشغيل تاريخية ولم تراكم بعد استدعاءً مباشرًا أو دعمًا يوميًا.

ما لا تفعله **بمفردها**:

- لا تعدّل `MEMORY.md`
- لا تشغّل ترحيلات doctor الكاملة
- لا تضع المرشحين المؤرضين تلقائيًا في مخزن الترقية قصيرة المدى المباشر ما لم تشغّل صراحة مسار CLI المرحلي أولًا

إذا كنت تريد أن يؤثر إعادة التشغيل التاريخي المؤرض في مسار الترقية العميقة العادي، فاستخدم تدفق CLI بدلًا من ذلك:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

يضع ذلك المرشحين المتينين المؤرضين في مخزن Dreaming قصير المدى مع إبقاء `DREAMS.md` كسطح للمراجعة.

## السلوك التفصيلي والمبررات

<AccordionGroup>
  <Accordion title="0. تحديث اختياري (تثبيتات git)">
    إذا كانت هذه نسخة git وكان doctor يعمل تفاعليًا، فإنه يعرض التحديث (fetch/rebase/build) قبل تشغيل doctor.
  </Accordion>
  <Accordion title="1. تطبيع الإعدادات">
    إذا كانت الإعدادات تحتوي على أشكال قيم قديمة (على سبيل المثال `messages.ackReaction` دون تجاوز خاص بالقناة)، فإن doctor يطبعها ضمن المخطط الحالي.

    يشمل ذلك حقول Talk المسطحة القديمة. إعداد الكلام العام الحالي في Talk هو `talk.provider` + `talk.providers.<provider>`، وإعداد الصوت الفوري هو `talk.realtime.*`. يعيد Doctor كتابة الأشكال القديمة `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` في خريطة الموفر، ويعيد كتابة محددات الزمن الحقيقي القديمة في المستوى الأعلى (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) إلى `talk.realtime`.

    يحذر Doctor أيضًا عندما تكون `plugins.allow` غير فارغة وتستخدم سياسة الأدوات
    أحرف بدل أو إدخالات أدوات مملوكة للـ Plugin. يطابق `tools.allow: ["*"]` فقط الأدوات
    من Plugins التي تُحمّل فعليًا؛ ولا يتجاوز قائمة السماح الحصرية للـ Plugin.
    يكتب Doctor القيمة `plugins.bundledDiscovery: "compat"` لإعدادات قائمة السماح القديمة المرحّلة للحفاظ على سلوك موفر الحزمة الحالي، ثم يشير إلى إعداد `"allowlist"` الأكثر صرامة.

  </Accordion>
  <Accordion title="2. ترحيلات مفاتيح الإعدادات القديمة">
    عندما تحتوي الإعدادات على مفاتيح مهملة، ترفض الأوامر الأخرى التشغيل وتطلب منك تشغيل `openclaw doctor`.

    سيقوم Doctor بما يلي:

    - يشرح مفاتيح الإعدادات القديمة التي عُثر عليها.
    - يعرض الترحيل الذي طبّقه.
    - يعيد كتابة `~/.openclaw/openclaw.json` بالمخطط المحدث.

    يرفض بدء تشغيل Gateway تنسيقات الإعدادات القديمة ويطلب منك تشغيل `openclaw doctor --fix`؛ ولا يعيد كتابة `openclaw.json` عند بدء التشغيل. تُعالج ترحيلات مخزن وظائف Cron أيضًا بواسطة `openclaw doctor --fix`.

    الترحيلات الحالية:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - إعدادات القنوات المكوّنة التي تفتقد سياسة رد مرئية → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` بالمستوى الأعلى
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` القديمة → `talk.provider` + `talk.providers.<provider>`
    - محددات Talk الفورية القديمة بالمستوى الأعلى (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - للقنوات التي تحتوي على `accounts` مسماة مع بقاء قيم قناة مفردة الحساب في المستوى الأعلى، انقل تلك القيم ذات النطاق الحسابي إلى الحساب المرقّى المختار لتلك القناة (`accounts.default` لمعظم القنوات؛ يمكن لـ Matrix الاحتفاظ بهدف مسمى/افتراضي مطابق موجود)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - أزِل `agents.defaults.llm`؛ استخدم `models.providers.<id>.timeoutSeconds` لمهل مزوّد/نموذج بطيئة
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - أزِل `browser.relayBindHost` (إعداد ترحيل الإضافة القديم)
    - `models.providers.*.api: "openai"` القديمة → `"openai-completions"` (يتخطى بدء تشغيل Gateway أيضًا المزوّدين الذين تكون قيمة `api` لديهم مضبوطة على قيمة تعداد مستقبلية أو غير معروفة بدلًا من الفشل بإغلاق)
    - أزِل `plugins.entries.codex.config.codexDynamicToolsProfile`؛ يحافظ خادم تطبيق Codex دائمًا على أدوات مساحة عمل Codex الأصلية كأدوات أصلية

    تتضمن تحذيرات Doctor أيضًا إرشادات الحساب الافتراضي للقنوات متعددة الحسابات:

    - إذا كانت هناك إدخالان أو أكثر من `channels.<channel>.accounts` مكوّنة بدون `channels.<channel>.defaultAccount` أو `accounts.default`، يحذّر Doctor من أن توجيه الرجوع يمكن أن يختار حسابًا غير متوقع.
    - إذا كانت `channels.<channel>.defaultAccount` مضبوطة على معرّف حساب غير معروف، يحذّر Doctor ويسرد معرّفات الحسابات المكوّنة.

  </Accordion>
  <Accordion title="2b. تجاوزات مزوّد OpenCode">
    إذا أضفت `models.providers.opencode` أو `opencode-zen` أو `opencode-go` يدويًا، فإنها تتجاوز كتالوج OpenCode المدمج من `@earendil-works/pi-ai`. قد يؤدي ذلك إلى إجبار النماذج على API خاطئ أو تصفير التكاليف. يحذّر Doctor حتى تتمكن من إزالة التجاوز واستعادة توجيه API والتكاليف لكل نموذج.
  </Accordion>
  <Accordion title="2c. ترحيل المتصفح وجاهزية Chrome MCP">
    إذا كان تكوين المتصفح لديك لا يزال يشير إلى مسار إضافة Chrome المحذوف، يطبّعه Doctor إلى نموذج إرفاق Chrome MCP المحلي للمضيف الحالي:

    - يصبح `browser.profiles.*.driver: "extension"` هو `"existing-session"`
    - تتم إزالة `browser.relayBindHost`

    يراجع Doctor أيضًا مسار Chrome MCP المحلي للمضيف عندما تستخدم `defaultProfile: "user"` أو ملفًا شخصيًا مكوّنًا من نوع `existing-session`:

    - يتحقق مما إذا كان Google Chrome مثبتًا على المضيف نفسه للملفات الشخصية الافتراضية ذات الاتصال التلقائي
    - يتحقق من إصدار Chrome المكتشف ويحذّر عندما يكون أقل من Chrome 144
    - يذكّرك بتمكين التصحيح عن بُعد في صفحة فحص المتصفح (مثل `chrome://inspect/#remote-debugging` أو `brave://inspect/#remote-debugging` أو `edge://inspect/#remote-debugging`)

    لا يستطيع Doctor تمكين الإعداد من جانب Chrome نيابةً عنك. لا يزال Chrome MCP المحلي للمضيف يتطلب:

    - متصفحًا قائمًا على Chromium بإصدار 144+ على مضيف Gateway/Node
    - تشغيل المتصفح محليًا
    - تمكين التصحيح عن بُعد في ذلك المتصفح
    - الموافقة على مطالبة موافقة الإرفاق الأولى في المتصفح

    تتعلق الجاهزية هنا فقط بمتطلبات الإرفاق المحلي المسبقة. يحتفظ Existing-session بحدود مسارات Chrome MCP الحالية؛ ولا تزال المسارات المتقدمة مثل `responsebody` وتصدير PDF واعتراض التنزيل وإجراءات الدُفعات تتطلب متصفحًا مُدارًا أو ملفًا شخصيًا خامًا لـ CDP.

    لا ينطبق هذا الفحص **على** Docker أو sandbox أو remote-browser أو تدفقات headless الأخرى. تواصل تلك التدفقات استخدام CDP الخام.

  </Accordion>
  <Accordion title="2d. متطلبات OAuth TLS المسبقة">
    عندما يكون ملف OpenAI Codex OAuth الشخصي مكوّنًا، يفحص Doctor نقطة نهاية تفويض OpenAI للتحقق من أن مكدس Node/OpenSSL TLS المحلي يمكنه التحقق من سلسلة الشهادات. إذا فشل الفحص بخطأ شهادة (مثل `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` أو شهادة منتهية الصلاحية أو شهادة موقّعة ذاتيًا)، يطبع Doctor إرشادات إصلاح خاصة بالمنصة. على macOS مع Node من Homebrew، يكون الإصلاح عادةً `brew postinstall ca-certificates`. مع `--deep`، يعمل الفحص حتى إذا كان Gateway سليمًا.
  </Accordion>
  <Accordion title="2e. تجاوزات مزوّد Codex OAuth">
    إذا سبق أن أضفت إعدادات نقل OpenAI القديمة ضمن `models.providers.openai-codex`، فقد تحجب مسار مزوّد Codex OAuth المدمج الذي تستخدمه الإصدارات الأحدث تلقائيًا. يحذّر Doctor عندما يرى إعدادات النقل القديمة هذه إلى جانب Codex OAuth حتى تتمكن من إزالة تجاوز النقل القديم أو إعادة كتابته واستعادة سلوك التوجيه/الرجوع المدمج. لا تزال الوكلاء المخصصة والتجاوزات التي تقتصر على الترويسات مدعومة ولا تُشغّل هذا التحذير.
  </Accordion>
  <Accordion title="2f. إصلاح مسار Codex">
    يتحقق Doctor من مراجع نماذج `openai-codex/*` القديمة. يستخدم توجيه عدة Codex الأصلية مراجع نماذج `openai/*` القياسية؛ وتمر أدوار وكيل OpenAI عبر عدة خادم تطبيق Codex بدلًا من مسار OpenAI في OpenClaw PI.

    في وضع `--fix` / `--repair`، يعيد Doctor كتابة مراجع الوكيل الافتراضي والمراجع لكل وكيل المتأثرة، بما في ذلك النماذج الأساسية والبدائل وتجاوزات Heartbeat/subagent/Compaction والخطافات وتجاوزات نموذج القناة وحالة مسار الجلسة المستمرة القديمة:

    - يصبح `openai-codex/gpt-*` هو `openai/gpt-*`.
    - ينتقل قصد Codex إلى إدخالات `agentRuntime.id: "codex"` ذات نطاق المزوّد/النموذج لمراجع نماذج الوكلاء التي تم إصلاحها، بحيث تظل ملفات تعريف المصادقة `openai-codex:...` قابلة للاختيار بعد أن يصبح مرجع النموذج `openai/*`.
    - تتم إزالة تكوين وقت التشغيل القديم للوكيل بأكمله ودبابيس وقت تشغيل الجلسة المستمرة لأن اختيار وقت التشغيل يكون ذا نطاق المزوّد/النموذج.
    - تُحفظ سياسة وقت التشغيل الحالية للمزوّد/النموذج ما لم يحتج مرجع النموذج القديم الذي تم إصلاحه إلى توجيه Codex للحفاظ على مسار المصادقة القديم.
    - تُحفظ قوائم بدائل النماذج الحالية مع إعادة كتابة إدخالاتها القديمة؛ وتنتقل الإعدادات المنسوخة لكل نموذج من المفتاح القديم إلى مفتاح `openai/*` القياسي.
    - يتم إصلاح `modelProvider`/`providerOverride` و `model`/`modelOverride` وإشعارات الرجوع ودبابيس ملف تعريف المصادقة للجلسات المستمرة عبر جميع مخازن جلسات الوكلاء المكتشفة.
    - تعني `/codex ...` "التحكم في محادثة Codex أصلية أو ربطها من الدردشة."
    - تعني `/acp ...` أو `runtime: "acp"` "استخدام محوّل ACP/acpx الخارجي."

  </Accordion>
  <Accordion title="2g. تنظيف مسار الجلسة">
    يفحص Doctor أيضًا مخازن جلسات الوكلاء المكتشفة بحثًا عن حالة مسار قديمة تم إنشاؤها تلقائيًا بعد نقل النماذج المكوّنة أو وقت التشغيل بعيدًا عن مسار مملوك لـ Plugin مثل Codex.

    يمكن لـ `openclaw doctor --fix` مسح الحالة القديمة المنشأة تلقائيًا مثل دبابيس النماذج `modelOverrideSource: "auto"` وبيانات تعريف نموذج وقت التشغيل ومعرّفات العدة المثبتة وروابط جلسات CLI وتجاوزات ملف تعريف المصادقة التلقائية عندما لا يكون مسارها المالك مكوّنًا بعد الآن. يتم الإبلاغ عن اختيارات نماذج الجلسات الصريحة من المستخدم أو القديمة للمراجعة اليدوية وتُترك دون تغيير؛ بدّلها باستخدام `/model ...` أو `/new` أو أعِد ضبط الجلسة عندما لا يكون ذلك المسار مقصودًا بعد الآن.

  </Accordion>
  <Accordion title="3. عمليات ترحيل الحالة القديمة (تخطيط القرص)">
    يمكن لـ Doctor ترحيل التخطيطات الأقدم على القرص إلى البنية الحالية:

    - مخزن الجلسات + النصوص:
      - من `~/.openclaw/sessions/` إلى `~/.openclaw/agents/<agentId>/sessions/`
    - دليل الوكيل:
      - من `~/.openclaw/agent/` إلى `~/.openclaw/agents/<agentId>/agent/`
    - حالة مصادقة WhatsApp (Baileys):
      - من `~/.openclaw/credentials/*.json` القديمة (باستثناء `oauth.json`)
      - إلى `~/.openclaw/credentials/whatsapp/<accountId>/...` (معرّف الحساب الافتراضي: `default`)

    هذه الترحيلات تُبذل فيها أفضل الجهود وهي قابلة للتكرار؛ سيصدر Doctor تحذيرات عندما يترك أي مجلدات قديمة كنسخ احتياطية. يقوم Gateway/CLI أيضًا بترحيل الجلسات القديمة + دليل الوكيل تلقائيًا عند بدء التشغيل بحيث تستقر المحفوظات/المصادقة/النماذج في المسار لكل وكيل دون تشغيل Doctor يدويًا. تقصد ترحيل مصادقة WhatsApp فقط عبر `openclaw doctor`. تقارن تسوية مزوّد Talk/خريطة المزوّد الآن بالمساواة البنيوية، لذلك لم تعد الفروقات التي تقتصر على ترتيب المفاتيح تشغّل تغييرات `doctor --fix` متكررة بلا أثر.

  </Accordion>
  <Accordion title="3a. عمليات ترحيل بيان Plugin القديم">
    يفحص Doctor جميع بيانات Plugins المثبتة بحثًا عن مفاتيح قدرات مهملة في المستوى الأعلى (`speechProviders` و `realtimeTranscriptionProviders` و `realtimeVoiceProviders` و `mediaUnderstandingProviders` و `imageGenerationProviders` و `videoGenerationProviders` و `webFetchProviders` و `webSearchProviders`). عند العثور عليها، يعرض نقلها إلى كائن `contracts` وإعادة كتابة ملف البيان في موضعه. هذا الترحيل قابل للتكرار؛ إذا كان مفتاح `contracts` يحتوي بالفعل على القيم نفسها، تتم إزالة المفتاح القديم دون تكرار البيانات.
  </Accordion>
  <Accordion title="3b. عمليات ترحيل مخزن Cron القديمة">
    يتحقق Doctor أيضًا من مخزن وظائف cron (`~/.openclaw/cron/jobs.json` افتراضيًا، أو `cron.store` عند تجاوزه) بحثًا عن أشكال وظائف قديمة لا يزال المجدول يقبلها للتوافق.

    تشمل عمليات تنظيف cron الحالية:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - حقول الحمولة في المستوى الأعلى (`message`, `model`, `thinking`, ...) → `payload`
    - حقول التسليم في المستوى الأعلى (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - ألقاب التسليم `provider` الخاصة بالحمولة → `delivery.channel` صريح
    - مهام الرجوع الاحتياطي القديمة البسيطة للـ Webhook عبر `notify: true` → `delivery.mode="webhook"` صريح مع `delivery.to=cron.webhook`

    لا يُرحّل doctor مهام `notify: true` تلقائياً إلا عندما يستطيع فعل ذلك دون تغيير السلوك. إذا جمعت مهمة بين الرجوع الاحتياطي القديم للإشعار ووضع تسليم حالي غير Webhook، يصدر doctor تحذيراً ويترك تلك المهمة للمراجعة اليدوية.

    على Linux، يحذر doctor أيضاً عندما لا يزال crontab الخاص بالمستخدم يستدعي `~/.openclaw/bin/ensure-whatsapp.sh` القديم. هذا السكربت المحلي للمضيف لا تتم صيانته بواسطة OpenClaw الحالي ويمكنه كتابة رسائل `Gateway inactive` زائفة إلى `~/.openclaw/logs/whatsapp-health.log` عندما يتعذر على cron الوصول إلى ناقل مستخدم systemd. أزل إدخال crontab القديم باستخدام `crontab -e`؛ واستخدم `openclaw channels status --probe` و`openclaw doctor` و`openclaw gateway status` لفحوصات الصحة الحالية.

  </Accordion>
  <Accordion title="3c. تنظيف قفل الجلسة">
    يفحص doctor كل دليل جلسة وكيل بحثاً عن ملفات قفل الكتابة القديمة — وهي ملفات تبقى بعد خروج جلسة بشكل غير طبيعي. لكل ملف قفل يعثر عليه، يبلّغ عن: المسار، وPID، وما إذا كان PID لا يزال حياً، وعمر القفل، وما إذا كان يُعد قديماً (PID ميت، أو أقدم من 30 دقيقة، أو PID حي يمكن إثبات أنه يخص عملية غير OpenClaw). في وضع `--fix` / `--repair` يزيل ملفات القفل القديمة تلقائياً؛ وإلا فيطبع ملاحظة ويطلب منك إعادة التشغيل مع `--fix`.
  </Accordion>
  <Accordion title="3d. إصلاح فرع سجل الجلسة">
    يفحص doctor ملفات JSONL لجلسات الوكلاء بحثاً عن شكل الفرع المكرر الذي أنشأه خطأ إعادة كتابة سجل المطالبة في 2026.4.24: دور مستخدم مهجور يحتوي على سياق تشغيل داخلي من OpenClaw بالإضافة إلى شقيق نشط يحتوي على مطالبة المستخدم المرئية نفسها. في وضع `--fix` / `--repair`، ينسخ doctor كل ملف متأثر احتياطياً بجانب الأصل ويعيد كتابة السجل إلى الفرع النشط حتى لا يرى سجل Gateway وقارئات الذاكرة أدواراً مكررة بعد الآن.
  </Accordion>
  <Accordion title="4. فحوصات سلامة الحالة (استمرارية الجلسات، والتوجيه، والسلامة)">
    دليل الحالة هو جذع الدماغ التشغيلي. إذا اختفى، فستفقد الجلسات وبيانات الاعتماد والسجلات والإعدادات (ما لم تكن لديك نسخ احتياطية في مكان آخر).

    يفحص doctor:

    - **دليل الحالة مفقود**: يحذر من فقدان كارثي للحالة، ويطلب إعادة إنشاء الدليل، ويذكّرك بأنه لا يستطيع استرداد البيانات المفقودة.
    - **أذونات دليل الحالة**: يتحقق من قابلية الكتابة؛ ويعرض إصلاح الأذونات (ويصدر تلميح `chown` عند اكتشاف عدم تطابق المالك/المجموعة).
    - **دليل حالة macOS المتزامن سحابياً**: يحذر عندما تُحل الحالة تحت iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) أو `~/Library/CloudStorage/...` لأن المسارات المدعومة بالمزامنة قد تسبب I/O أبطأ وسباقات قفل/مزامنة.
    - **دليل حالة Linux على SD أو eMMC**: يحذر عندما تُحل الحالة إلى مصدر تركيب `mmcblk*`، لأن I/O العشوائي المدعوم بـ SD أو eMMC قد يكون أبطأ ويتآكل أسرع تحت كتابات الجلسات وبيانات الاعتماد.
    - **أدلة الجلسات مفقودة**: يلزم وجود `sessions/` ودليل مخزن الجلسات لاستبقاء السجل وتجنب أعطال `ENOENT`.
    - **عدم تطابق السجل**: يحذر عندما تكون لإدخالات الجلسات الحديثة ملفات سجل مفقودة.
    - **جلسة رئيسية "JSONL بسطر واحد"**: يعلّم الحالة عندما يحتوي السجل الرئيسي على سطر واحد فقط (لا يتراكم السجل).
    - **أدلة حالة متعددة**: يحذر عندما توجد عدة مجلدات `~/.openclaw` عبر أدلة المنزل أو عندما يشير `OPENCLAW_STATE_DIR` إلى مكان آخر (قد ينقسم السجل بين التثبيتات).
    - **تذكير الوضع البعيد**: إذا كان `gateway.mode=remote`، يذكّرك doctor بتشغيله على المضيف البعيد (الحالة موجودة هناك).
    - **أذونات ملف الإعدادات**: يحذر إذا كان `~/.openclaw/openclaw.json` قابلاً للقراءة من المجموعة/العالم ويعرض تشديده إلى `600`.

  </Accordion>
  <Accordion title="5. صحة مصادقة النماذج (انتهاء صلاحية OAuth)">
    يفحص doctor ملفات تعريف OAuth في مخزن المصادقة، ويحذر عند قرب انتهاء صلاحية الرموز أو انتهائها، ويمكنه تحديثها عندما يكون ذلك آمناً. إذا كان ملف تعريف OAuth/الرمز الخاص بـ Anthropic قديماً، يقترح مفتاح API لـ Anthropic أو مسار رمز إعداد Anthropic. لا تظهر مطالبات التحديث إلا عند التشغيل تفاعلياً (TTY)؛ ويتخطى `--non-interactive` محاولات التحديث.

    عندما يفشل تحديث OAuth نهائياً (مثلاً `refresh_token_reused` أو `invalid_grant` أو أن يطلب منك مزود تسجيل الدخول مرة أخرى)، يبلّغ doctor أن إعادة المصادقة مطلوبة ويطبع أمر `openclaw models auth login --provider ...` الدقيق لتشغيله.

    يبلّغ doctor أيضاً عن ملفات تعريف المصادقة غير القابلة للاستخدام مؤقتاً بسبب:

    - فترات تهدئة قصيرة (حدود معدل/مهلات/إخفاقات مصادقة)
    - تعطيلات أطول (إخفاقات فواتير/رصيد)

  </Accordion>
  <Accordion title="6. التحقق من نموذج الخطافات">
    إذا كان `hooks.gmail.model` مضبوطاً، يتحقق doctor من مرجع النموذج مقابل الكتالوج وقائمة السماح، ويحذر عندما لا يمكن حله أو يكون غير مسموح به.
  </Accordion>
  <Accordion title="7. إصلاح صورة الصندوق المعزول">
    عندما يكون العزل مفعلاً، يفحص doctor صور Docker ويعرض بناءها أو التبديل إلى الأسماء القديمة إذا كانت الصورة الحالية مفقودة.
  </Accordion>
  <Accordion title="7b. تنظيف تثبيت Plugin">
    يزيل doctor حالة تجهيز تبعيات Plugin القديمة التي أنشأها OpenClaw في وضع `openclaw doctor --fix` / `openclaw doctor --repair`. يغطي ذلك جذور التبعيات المولدة القديمة، وأدلة مراحل التثبيت القديمة، والمخلفات المحلية للحزم من كود إصلاح تبعيات Plugin المضمّنة السابق، ونسخ npm المُدارة اليتيمة أو المستردة من Plugins `@openclaw/*` المضمّنة التي يمكن أن تحجب البيان المضمّن الحالي.

    يمكن لـ doctor أيضاً إعادة تثبيت Plugins القابلة للتنزيل المفقودة عندما تشير إليها الإعدادات لكن سجل Plugin المحلي لا يستطيع العثور عليها. تشمل الأمثلة `plugins.entries` المادية، وإعدادات القناة/المزود/البحث المضبوطة، وبيئات تشغيل الوكلاء المضبوطة. أثناء تحديثات الحزم، يتجنب doctor تشغيل إصلاح Plugin عبر مدير الحزم بينما يتم تبديل الحزمة الأساسية؛ شغّل `openclaw doctor --fix` مرة أخرى بعد التحديث إذا كان Plugin مضبوط لا يزال يحتاج إلى استرداد. لا يشغّل بدء Gateway وإعادة تحميل الإعدادات مديري الحزم؛ تظل تثبيتات Plugin عملاً صريحاً عبر doctor/install/update.

  </Accordion>
  <Accordion title="8. ترحيلات خدمة Gateway وتلميحات التنظيف">
    يكتشف doctor خدمات Gateway القديمة (launchd/systemd/schtasks) ويعرض إزالتها وتثبيت خدمة OpenClaw باستخدام منفذ Gateway الحالي. يمكنه أيضاً فحص الخدمات الإضافية الشبيهة بـ Gateway وطباعة تلميحات التنظيف. تُعد خدمات OpenClaw Gateway المسماة حسب الملف التعريفي خدمات من الدرجة الأولى ولا تُعلّم على أنها "إضافية".

    على Linux، إذا كانت خدمة Gateway على مستوى المستخدم مفقودة لكن توجد خدمة OpenClaw Gateway على مستوى النظام، فلا يثبّت doctor خدمة ثانية على مستوى المستخدم تلقائياً. افحص باستخدام `openclaw gateway status --deep` أو `openclaw doctor --deep`، ثم أزل النسخة المكررة أو اضبط `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يكون مشرف نظام هو مالك دورة حياة Gateway.

  </Accordion>
  <Accordion title="8b. ترحيل بدء تشغيل Matrix">
    عندما يكون لدى حساب قناة Matrix ترحيل حالة قديم معلق أو قابل للتنفيذ، ينشئ doctor (في وضع `--fix` / `--repair`) لقطة ما قبل الترحيل ثم يشغّل خطوات الترحيل بأفضل جهد: ترحيل حالة Matrix القديمة وتحضير الحالة المشفرة القديمة. كلتا الخطوتين غير قاتلتين؛ تُسجل الأخطاء ويستمر بدء التشغيل. في وضع القراءة فقط (`openclaw doctor` بدون `--fix`) يتم تخطي هذا الفحص بالكامل.
  </Accordion>
  <Accordion title="8c. إقران الجهاز وانحراف المصادقة">
    يفحص doctor الآن حالة إقران الأجهزة كجزء من تمرير الصحة العادي.

    ما يبلّغ عنه:

    - طلبات إقران أول مرة معلقة
    - ترقيات أدوار معلقة لأجهزة مقترنة مسبقاً
    - ترقيات نطاق معلقة لأجهزة مقترنة مسبقاً
    - إصلاحات عدم تطابق المفتاح العام حيث لا يزال معرّف الجهاز مطابقاً لكن هوية الجهاز لم تعد تطابق السجل المعتمد
    - سجلات مقترنة تفتقد رمزاً نشطاً لدور معتمد
    - رموز مقترنة تنحرف نطاقاتها خارج خط أساس الإقران المعتمد
    - إدخالات رموز جهاز مخزنة محلياً مؤقتاً للجهاز الحالي تسبق تدوير رمز من جهة Gateway أو تحمل بيانات نطاق وصفية قديمة

    لا يوافق doctor تلقائياً على طلبات الإقران ولا يدوّر رموز الأجهزة تلقائياً. يطبع الخطوات التالية الدقيقة بدلاً من ذلك:

    - افحص الطلبات المعلقة باستخدام `openclaw devices list`
    - وافق على الطلب الدقيق باستخدام `openclaw devices approve <requestId>`
    - دوّر رمزاً جديداً باستخدام `openclaw devices rotate --device <deviceId> --role <role>`
    - أزل سجلاً قديماً وأعد الموافقة عليه باستخدام `openclaw devices remove <deviceId>`

    يغلق هذا الثغرة الشائعة "مقترن بالفعل لكن لا يزال يتلقى طلب الإقران": يميز doctor الآن بين الإقران لأول مرة، وترقيات الدور/النطاق المعلقة، وانحراف الرمز/هوية الجهاز القديمة.

  </Accordion>
  <Accordion title="9. تحذيرات الأمان">
    يصدر doctor تحذيرات عندما يكون مزود مفتوحاً للرسائل المباشرة دون قائمة سماح، أو عندما تكون سياسة مضبوطة بطريقة خطرة.
  </Accordion>
  <Accordion title="10. إبقاء systemd نشطاً (Linux)">
    إذا كان يعمل كخدمة مستخدم systemd، يتأكد doctor من تمكين البقاء النشط حتى يظل Gateway حياً بعد تسجيل الخروج.
  </Accordion>
  <Accordion title="11. حالة مساحة العمل (Skills وPlugins والأدلة القديمة)">
    يطبع doctor ملخصاً لحالة مساحة العمل للوكيل الافتراضي:

    - **حالة Skills**: يحصي Skills المؤهلة، وناقصة المتطلبات، والمحظورة بقائمة السماح.
    - **أدلة مساحة العمل القديمة**: يحذر عندما توجد `~/openclaw` أو أدلة مساحة عمل قديمة أخرى بجانب مساحة العمل الحالية.
    - **حالة Plugin**: يحصي Plugins المفعلة/المعطلة/التي بها أخطاء؛ ويسرد معرّفات Plugin لأي أخطاء؛ ويبلّغ عن قدرات Plugin المجمّعة.
    - **تحذيرات توافق Plugin**: يعلّم Plugins التي لديها مشكلات توافق مع بيئة التشغيل الحالية.
    - **تشخيصات Plugin**: يعرض أي تحذيرات أو أخطاء وقت التحميل صادرة عن سجل Plugin.

  </Accordion>
  <Accordion title="11b. حجم ملف التمهيد">
    يفحص doctor ما إذا كانت ملفات تمهيد مساحة العمل (مثل `AGENTS.md` أو `CLAUDE.md` أو ملفات سياق محقونة أخرى) قريبة من ميزانية الأحرف المضبوطة أو تتجاوزها. يبلّغ لكل ملف عن عدد الأحرف الخام مقابل المحقونة، ونسبة الاقتطاع، وسبب الاقتطاع (`max/file` أو `max/total`)، وإجمالي الأحرف المحقونة كنسبة من الميزانية الإجمالية. عندما تُقتطع الملفات أو تقترب من الحد، يطبع doctor نصائح لضبط `agents.defaults.bootstrapMaxChars` و`agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. تنظيف Plugin قناة قديم">
    عندما يزيل `openclaw doctor --fix` Plugin قناة مفقوداً، فإنه يزيل أيضاً إعدادات نطاق القناة المعلقة التي أشارت إلى ذلك Plugin: إدخالات `channels.<id>`، وأهداف Heartbeat التي سمت القناة، وتجاوزات `agents.*.models["<channel>/*"]`. يمنع هذا حلقات إقلاع Gateway حيث اختفت بيئة تشغيل القناة لكن الإعدادات لا تزال تطلب من Gateway الارتباط بها.
  </Accordion>
  <Accordion title="11c. إكمال الصدفة">
    يفحص doctor ما إذا كان إكمال Tab مثبتاً للصدفة الحالية (zsh أو bash أو fish أو PowerShell):

    - إذا كان ملف تعريف الصدفة يستخدم نمط إكمال ديناميكياً بطيئاً (`source <(openclaw completion ...)`)، يرقيه doctor إلى متغير الملف المخزن مؤقتاً الأسرع.
    - إذا كان الإكمال مضبوطاً في ملف التعريف لكن ملف التخزين المؤقت مفقود، يعيد doctor توليد التخزين المؤقت تلقائياً.
    - إذا لم يكن أي إكمال مضبوطاً إطلاقاً، يطلب doctor تثبيته (في الوضع التفاعلي فقط؛ يتم تخطيه مع `--non-interactive`).

    شغّل `openclaw completion --write-state` لإعادة توليد التخزين المؤقت يدوياً.

  </Accordion>
  <Accordion title="12. فحوصات مصادقة Gateway (الرمز المحلي)">
    تتحقق أداة التشخيص من جاهزية مصادقة رمز Gateway المحلي.

    - إذا كان وضع الرمز يحتاج إلى رمز ولا يوجد مصدر للرمز، تعرض أداة التشخيص إنشاء واحد.
    - إذا كان `gateway.auth.token` مُدارًا بواسطة SecretRef لكنه غير متاح، تُصدر أداة التشخيص تحذيرًا ولا تستبدله بنص عادي.
    - يفرض `openclaw doctor --generate-gateway-token` الإنشاء فقط عندما لا يكون هناك SecretRef للرمز مُكوَّن.

  </Accordion>
  <Accordion title="12b. إصلاحات للقراءة فقط ومدركة لـ SecretRef">
    تحتاج بعض مسارات الإصلاح إلى فحص بيانات الاعتماد المُكوَّنة من دون إضعاف سلوك الفشل السريع أثناء التشغيل.

    - يستخدم `openclaw doctor --fix` الآن نموذج ملخص SecretRef للقراءة فقط نفسه الذي تستخدمه أوامر عائلة الحالة للإصلاحات المستهدفة للتكوين.
    - مثال: يحاول إصلاح Telegram `allowFrom` / `groupAllowFrom` `@username` استخدام بيانات اعتماد البوت المُكوَّنة عند توفرها.
    - إذا كان رمز بوت Telegram مُكوَّنًا عبر SecretRef لكنه غير متاح في مسار الأمر الحالي، تُبلغ أداة التشخيص أن بيانات الاعتماد مُكوَّنة لكنها غير متاحة، وتتخطى الحل التلقائي بدلًا من التعطل أو الإبلاغ خطأً بأن الرمز مفقود.

  </Accordion>
  <Accordion title="13. فحص صحة Gateway + إعادة التشغيل">
    تُجري أداة التشخيص فحص صحة وتعرض إعادة تشغيل Gateway عندما يبدو غير سليم.
  </Accordion>
  <Accordion title="13b. جاهزية البحث في الذاكرة">
    تتحقق أداة التشخيص مما إذا كان مزود تضمين البحث في الذاكرة المُكوَّن جاهزًا للوكيل الافتراضي. يعتمد السلوك على الخلفية والمزود المُكوَّنين:

    - **خلفية QMD**: تفحص ما إذا كان الملف الثنائي `qmd` متاحًا وقابلًا للبدء. إذا لم يكن كذلك، تطبع إرشادات إصلاح تتضمن حزمة npm وخيار مسار ثنائي يدوي.
    - **مزود محلي صريح**: يتحقق من وجود ملف نموذج محلي أو عنوان URL لنموذج بعيد/قابل للتنزيل معروف. إذا كان مفقودًا، يقترح التبديل إلى مزود بعيد.
    - **مزود بعيد صريح** (`openai`، `voyage`، إلخ): يتحقق من وجود مفتاح API في البيئة أو مخزن المصادقة. يطبع تلميحات إصلاح قابلة للتنفيذ إذا كان مفقودًا.
    - **مزود تلقائي**: يتحقق من توفر النموذج المحلي أولًا، ثم يجرب كل مزود بعيد بترتيب الاختيار التلقائي.

    عند توفر نتيجة فحص Gateway مخزنة مؤقتًا (كان Gateway سليمًا وقت الفحص)، تقارن أداة التشخيص نتيجتها مع التكوين المرئي من CLI وتذكر أي اختلاف. لا تبدأ أداة التشخيص اختبار تضمين جديدًا على المسار الافتراضي؛ استخدم أمر حالة الذاكرة العميق عندما تريد فحصًا مباشرًا للمزود.

    استخدم `openclaw memory status --deep` للتحقق من جاهزية التضمين أثناء التشغيل.

  </Accordion>
  <Accordion title="14. تحذيرات حالة القناة">
    إذا كان Gateway سليمًا، تُجري أداة التشخيص فحص حالة القناة وتبلغ عن التحذيرات مع إصلاحات مقترحة.
  </Accordion>
  <Accordion title="15. تدقيق تكوين المشرف + إصلاحه">
    تتحقق أداة التشخيص من تكوين المشرف المثبت (launchd/systemd/schtasks) بحثًا عن الإعدادات الافتراضية المفقودة أو القديمة (مثل تبعيات systemd لـ network-online وتأخير إعادة التشغيل). عندما تجد عدم تطابق، توصي بتحديث ويمكنها إعادة كتابة ملف الخدمة/المهمة إلى الإعدادات الافتراضية الحالية.

    ملاحظات:

    - يطالب `openclaw doctor` قبل إعادة كتابة تكوين المشرف.
    - يقبل `openclaw doctor --yes` مطالبات الإصلاح الافتراضية.
    - يطبق `openclaw doctor --repair` الإصلاحات الموصى بها من دون مطالبات.
    - يكتب `openclaw doctor --repair --force` فوق تكوينات المشرف المخصصة.
    - يحافظ `OPENCLAW_SERVICE_REPAIR_POLICY=external` على أداة التشخيص للقراءة فقط لدورة حياة خدمة Gateway. ما زالت تبلغ عن صحة الخدمة وتُجري إصلاحات غير خدمية، لكنها تتخطى تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة، وإعادة كتابة تكوين المشرف، وتنظيف الخدمات القديمة لأن مشرفًا خارجيًا يملك دورة الحياة تلك.
    - على Linux، لا تعيد أداة التشخيص كتابة بيانات تعريف الأمر/نقطة الدخول عندما تكون وحدة Gateway المطابقة في systemd نشطة. كما تتجاهل الوحدات الإضافية غير القديمة وغير النشطة الشبيهة بـ Gateway أثناء فحص الخدمات المكررة حتى لا تنشئ ملفات الخدمات المرافقة ضجيج تنظيف.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان `gateway.auth.token` مُدارًا بواسطة SecretRef، يتحقق تثبيت/إصلاح خدمة أداة التشخيص من SecretRef لكنه لا يحفظ قيم الرمز المحلولة كنص عادي في بيانات تعريف بيئة خدمة المشرف.
    - تكتشف أداة التشخيص قيم بيئة الخدمة المُدارة والمدعومة بـ `.env`/SecretRef التي قامت تثبيتات LaunchAgent أو systemd أو Windows Scheduled Task الأقدم بتضمينها داخل التعريف، وتعيد كتابة بيانات تعريف الخدمة بحيث تُحمَّل تلك القيم من مصدر التشغيل بدلًا من تعريف المشرف.
    - تكتشف أداة التشخيص عندما لا يزال أمر الخدمة يثبت `--port` قديمًا بعد تغييرات `gateway.port` وتعيد كتابة بيانات تعريف الخدمة إلى المنفذ الحالي.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef للرمز المُكوَّن غير محلول، تحظر أداة التشخيص مسار التثبيت/الإصلاح مع إرشادات قابلة للتنفيذ.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مُكوَّنين وكان `gateway.auth.mode` غير مضبوط، تحظر أداة التشخيص التثبيت/الإصلاح حتى يتم ضبط الوضع صراحةً.
    - بالنسبة إلى وحدات user-systemd على Linux، تشمل فحوصات انحراف الرمز في أداة التشخيص الآن كلا مصدري `Environment=` و`EnvironmentFile=` عند مقارنة بيانات تعريف مصادقة الخدمة.
    - ترفض إصلاحات خدمة أداة التشخيص إعادة كتابة خدمة Gateway من ملف ثنائي أقدم لـ OpenClaw أو إيقافها أو إعادة تشغيلها عندما يكون التكوين قد كُتب آخر مرة بواسطة إصدار أحدث. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - يمكنك دائمًا فرض إعادة كتابة كاملة عبر `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. تشخيصات تشغيل Gateway والمنفذ">
    تفحص أداة التشخيص تشغيل الخدمة (PID، وآخر حالة خروج) وتحذر عندما تكون الخدمة مثبتة لكنها لا تعمل فعليًا. كما تتحقق من تعارضات المنافذ على منفذ Gateway (الافتراضي `18789`) وتبلغ عن الأسباب المحتملة (Gateway يعمل بالفعل، أو نفق SSH).
  </Accordion>
  <Accordion title="17. أفضل ممارسات تشغيل Gateway">
    تحذر أداة التشخيص عندما تعمل خدمة Gateway على Bun أو مسار Node مُدار بالإصدارات (`nvm`، `fnm`، `volta`، `asdf`، إلخ). تتطلب قنوات WhatsApp وTelegram ‏Node، ويمكن أن تتعطل مسارات مديري الإصدارات بعد الترقيات لأن الخدمة لا تُحمّل تهيئة الصدفة لديك. تعرض أداة التشخيص الترحيل إلى تثبيت Node للنظام عند توفره (Homebrew/apt/choco).

    تستخدم LaunchAgents على macOS المثبتة أو المُصلحة حديثًا مسار نظامًا قياسيًا (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) بدلًا من نسخ PATH للصدفة التفاعلية، لذلك تبقى الثنائيات النظامية المُدارة بواسطة Homebrew متاحة بينما لا تغير مجلدات Volta وasdf وfnm وpnpm وغيرها من مديري الإصدارات أي Node تُحل إليه العمليات الفرعية. ما زالت خدمات Linux تحتفظ بجذور بيئة صريحة (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) ومجلدات user-bin مستقرة، لكن مجلدات الرجوع الاحتياطي المتوقعة لمديري الإصدارات لا تُكتب إلى PATH الخدمة إلا عندما تكون تلك المجلدات موجودة على القرص.

  </Accordion>
  <Accordion title="18. كتابة التكوين + بيانات تعريف المعالج">
    تحفظ أداة التشخيص أي تغييرات في التكوين وتختم بيانات تعريف المعالج لتسجيل تشغيل أداة التشخيص.
  </Accordion>
  <Accordion title="19. نصائح مساحة العمل (النسخ الاحتياطي + نظام الذاكرة)">
    تقترح أداة التشخيص نظام ذاكرة لمساحة العمل عند غيابه وتطبع نصيحة نسخ احتياطي إذا لم تكن مساحة العمل تحت git بالفعل.

    راجع [/concepts/agent-workspace](/ar/concepts/agent-workspace) للحصول على دليل كامل لبنية مساحة العمل والنسخ الاحتياطي عبر git (يوصى بمستودع GitHub أو GitLab خاص).

  </Accordion>
</AccordionGroup>

## ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
