---
read_when:
    - إضافة عمليات ترحيل التشخيص أو تعديلها
    - إدخال تغييرات كاسرة في الإعدادات
sidebarTitle: Doctor
summary: 'أمر doctor: فحوصات السلامة، وترحيلات الإعدادات، وخطوات الإصلاح'
title: التشخيص
x-i18n:
    generated_at: "2026-05-06T07:53:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5cee2793b1a0665a3a816586fcb597de1fd3133819d34480aa420346f4d7a78d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` هو أداة الإصلاح + الترحيل في OpenClaw. يصلح الإعدادات/الحالة القديمة، ويتحقق من السلامة، ويوفر خطوات إصلاح قابلة للتنفيذ.

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

    يقبل الإعدادات الافتراضية دون مطالبة (بما في ذلك خطوات إصلاح إعادة التشغيل/الخدمة/الصندوق الرملي عند انطباقها).

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

    يطبق الإصلاحات المكثفة أيضا (يستبدل إعدادات المشرف المخصصة).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    يعمل دون مطالبات ويطبق فقط عمليات الترحيل الآمنة (تطبيع الإعدادات + نقل الحالة على القرص). يتخطى إجراءات إعادة التشغيل/الخدمة/الصندوق الرملي التي تتطلب تأكيدا بشريا. تعمل عمليات ترحيل الحالة القديمة تلقائيا عند اكتشافها.

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
  <Accordion title="السلامة والواجهة والتحديثات">
    - تحديث اختياري قبل التشغيل لتثبيتات git (تفاعلي فقط).
    - فحص حداثة بروتوكول الواجهة (يعيد بناء Control UI عندما يكون مخطط البروتوكول أحدث).
    - فحص السلامة + مطالبة إعادة التشغيل.
    - ملخص حالة Skills (مؤهل/مفقود/محظور) وحالة Plugin.

  </Accordion>
  <Accordion title="الإعدادات وعمليات الترحيل">
    - تطبيع الإعدادات للقيم القديمة.
    - ترحيل إعدادات Talk من حقول `talk.*` المسطحة القديمة إلى `talk.provider` + `talk.providers.<provider>`.
    - فحوصات ترحيل المتصفح لإعدادات إضافة Chrome القديمة وجاهزية Chrome MCP.
    - تحذيرات تجاوز مزود OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - تحذيرات حجب OAuth في Codex (`models.providers.openai-codex`).
    - فحص متطلبات OAuth TLS الأساسية لملفات تعريف OpenAI Codex OAuth.
    - تحذيرات قائمة السماح لـ Plugin/الأدوات عندما يكون `plugins.allow` مقيدا لكن سياسة الأدوات ما زالت تطلب أدوات بدل شامل أو أدوات مملوكة لـ Plugin.
    - ترحيل الحالة القديمة على القرص (الجلسات/دليل الوكيل/مصادقة WhatsApp).
    - ترحيل مفتاح عقد بيان Plugin القديم (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - ترحيل مخزن Cron القديم (`jobId`, `schedule.cron`, حقول التسليم/الحمولة في المستوى الأعلى، حمولة `provider`, مهام الرجوع الاحتياطي البسيطة لـ Webhook عبر `notify: true`).
    - ترحيل سياسة تشغيل الوكيل القديمة إلى `agents.defaults.agentRuntime` و`agents.list[].agentRuntime`.
    - تنظيف إعدادات Plugin القديمة عندما تكون plugins مفعلة؛ عندما يكون `plugins.enabled=false`، تعامل مراجع Plugin القديمة كإعدادات احتواء خاملة ويتم الاحتفاظ بها.

  </Accordion>
  <Accordion title="الحالة والسلامة البنيوية">
    - فحص ملف قفل الجلسة وتنظيف الأقفال القديمة.
    - إصلاح نصوص الجلسات للفروع المكررة لإعادة كتابة المطالبة التي أنشأتها إصدارات 2026.4.24 المتأثرة.
    - اكتشاف شواهد استرداد إعادة التشغيل للوكلاء الفرعيين العالقين، مع دعم `--fix` لمسح علامات الاسترداد الملغاة القديمة حتى لا يستمر بدء التشغيل في معاملة الابن كأنه أُلغي بسبب إعادة التشغيل.
    - فحوصات سلامة الحالة والأذونات (الجلسات، النصوص، دليل الحالة).
    - فحوصات أذونات ملف الإعدادات (chmod 600) عند التشغيل محليا.
    - سلامة مصادقة النموذج: يفحص انتهاء OAuth، ويمكنه تحديث الرموز التي تقترب من الانتهاء، ويبلغ عن حالات تهدئة/تعطيل ملف تعريف المصادقة.
    - اكتشاف دليل مساحة عمل إضافي (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway والخدمات والمشرفون">
    - إصلاح صورة الصندوق الرملي عندما يكون العزل الرملي مفعلا.
    - ترحيل الخدمة القديمة واكتشاف Gateway إضافي.
    - ترحيل حالة قناة Matrix القديمة (في وضع `--fix` / `--repair`).
    - فحوصات تشغيل Gateway (الخدمة مثبتة لكنها لا تعمل؛ تسمية launchd المخزنة مؤقتا).
    - تحذيرات حالة القنوات (مفحوصة من Gateway قيد التشغيل).
    - فحوصات استجابة WhatsApp لتدهور سلامة حلقة أحداث Gateway مع استمرار عمل عملاء TUI المحليين؛ يوقف `--fix` فقط عملاء TUI المحليين المتحقق منهم.
    - إصلاح مسارات Codex لمراجع نماذج `openai-codex/*` القديمة في النماذج الأساسية، والبدائل، وتجاوزات Heartbeat/الوكيل الفرعي/Compaction، والخطافات، وتجاوزات نماذج القنوات، وتثبيتات مسارات الجلسات؛ يعيد `--fix` كتابتها إلى `openai/*` ويختار `agentRuntime.id: "codex"` فقط عندما يكون Codex plugin مثبتا ومفعلا ويسهم بحزمة `codex` ولديه OAuth قابل للاستخدام. وإلا فإنه يختار `agentRuntime.id: "pi"`.
    - تدقيق إعدادات المشرف (launchd/systemd/schtasks) مع إصلاح اختياري.
    - تنظيف بيئة الوكيل المضمنة لخدمات Gateway التي التقطت قيم `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` من الصدفة أثناء التثبيت أو التحديث.
    - فحوصات أفضل الممارسات لتشغيل Gateway (Node مقابل Bun، مسارات مدير الإصدارات).
    - تشخيصات تعارض منفذ Gateway (الافتراضي `18789`).

  </Accordion>
  <Accordion title="المصادقة والأمان والاقتران">
    - تحذيرات أمان لسياسات الرسائل الخاصة المفتوحة.
    - فحوصات مصادقة Gateway لوضع الرمز المحلي (يعرض إنشاء رمز عندما لا يوجد مصدر رمز؛ لا يستبدل إعدادات SecretRef للرموز).
    - اكتشاف مشكلات اقتران الأجهزة (طلبات الاقتران الأولى المعلقة، ترقيات الدور/النطاق المعلقة، انحراف ذاكرة التخزين المؤقت المحلية القديمة لرمز الجهاز، وانحراف مصادقة سجل الاقتران).

  </Accordion>
  <Accordion title="مساحة العمل والصدفة">
    - فحص systemd linger على Linux.
    - فحص حجم ملف تهيئة مساحة العمل (تحذيرات الاقتطاع/القرب من الحد لملفات السياق).
    - فحص جاهزية Skills للوكيل الافتراضي؛ يبلغ عن Skills المسموح بها مع ملفات تنفيذية أو بيئة أو إعدادات أو متطلبات نظام تشغيل مفقودة، ويمكن لـ `--fix` تعطيل Skills غير المتاحة في `skills.entries`.
    - فحص حالة إكمال الصدفة والتثبيت/الترقية التلقائية.
    - فحص جاهزية مزود تضمين بحث الذاكرة (نموذج محلي، مفتاح API بعيد، أو ملف QMD ثنائي).
    - فحوصات تثبيت المصدر (عدم تطابق مساحة عمل pnpm، أصول واجهة مفقودة، ملف tsx ثنائي مفقود).
    - يكتب الإعدادات المحدثة + بيانات معالج الإعداد الوصفية.

  </Accordion>
</AccordionGroup>

## الملء اللاحق وإعادة الضبط في واجهة Dreams

يتضمن مشهد Dreams في Control UI إجراءات **الملء اللاحق** و**إعادة الضبط** و**مسح المثبت** لسير عمل Dreaming المثبت. تستخدم هذه الإجراءات أساليب RPC بأسلوب doctor في Gateway، لكنها **ليست** جزءا من إصلاح/ترحيل CLI في `openclaw doctor`.

ما تفعله:

- **الملء اللاحق** يفحص ملفات `memory/YYYY-MM-DD.md` التاريخية في مساحة العمل النشطة، ويشغل تمرير يوميات REM المثبت، ويكتب إدخالات ملء لاحق قابلة للعكس في `DREAMS.md`.
- **إعادة الضبط** تزيل فقط إدخالات يوميات الملء اللاحق الموسومة من `DREAMS.md`.
- **مسح المثبت** يزيل فقط الإدخالات المرحلية القصيرة الأمد والمثبتة فقط التي جاءت من إعادة تشغيل تاريخية ولم تجمع بعد استدعاء حيا أو دعما يوميا.

ما لا تفعله بذاتها:

- لا تعدل `MEMORY.md`
- لا تشغل عمليات ترحيل doctor كاملة
- لا تدرج المرشحين المثبتين تلقائيا في مخزن الترقية القصير الأمد الحي إلا إذا شغلت صراحة مسار CLI المرحلي أولا

إذا أردت أن تؤثر إعادة التشغيل التاريخية المثبتة في مسار الترقية العميقة العادي، فاستخدم تدفق CLI بدلا من ذلك:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

يؤدي ذلك إلى إدراج المرشحين المتينين المثبتين في مخزن Dreaming القصير الأمد مع إبقاء `DREAMS.md` سطحا للمراجعة.

## السلوك التفصيلي والأساس المنطقي

<AccordionGroup>
  <Accordion title="0. تحديث اختياري (تثبيتات git)">
    إذا كان هذا استنساخ git وكان doctor يعمل تفاعليا، فإنه يعرض التحديث (fetch/rebase/build) قبل تشغيل doctor.
  </Accordion>
  <Accordion title="1. تطبيع الإعدادات">
    إذا احتوت الإعدادات على أشكال قيم قديمة (على سبيل المثال `messages.ackReaction` دون تجاوز خاص بالقناة)، فإن doctor يطبعها إلى المخطط الحالي.

    يشمل ذلك حقول Talk المسطحة القديمة. إعداد الكلام العام الحالي في Talk هو `talk.provider` + `talk.providers.<provider>`، وإعداد الصوت الفوري هو `talk.realtime.*`. يعيد Doctor كتابة أشكال `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` القديمة إلى خريطة المزود، ويعيد كتابة محددات المستوى الأعلى القديمة للفورية (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) إلى `talk.realtime`.

    يحذر Doctor أيضا عندما يكون `plugins.allow` غير فارغ وتستخدم سياسة الأدوات
    إدخالات بدل شامل أو أدوات مملوكة لـ Plugin. يطابق `tools.allow: ["*"]` فقط الأدوات
    من plugins التي يتم تحميلها فعليا؛ ولا يتجاوز قائمة السماح الحصرية لـ Plugin.
    يكتب Doctor `plugins.bundledDiscovery: "compat"` لإعدادات قائمة السماح القديمة المرحلة
    للحفاظ على سلوك المزودين المضمنين الحالي، ثم يشير إلى إعداد `"allowlist"` الأكثر صرامة.

  </Accordion>
  <Accordion title="2. عمليات ترحيل مفاتيح الإعدادات القديمة">
    عندما تحتوي الإعدادات على مفاتيح مهملة، ترفض الأوامر الأخرى العمل وتطلب منك تشغيل `openclaw doctor`.

    سيقوم Doctor بما يلي:

    - شرح أي مفاتيح قديمة تم العثور عليها.
    - عرض الترحيل الذي طبقه.
    - إعادة كتابة `~/.openclaw/openclaw.json` بالمخطط المحدث.

    يشغل Gateway أيضا عمليات ترحيل doctor تلقائيا عند بدء التشغيل عندما يكتشف تنسيق إعدادات قديما، لذلك يتم إصلاح الإعدادات القديمة دون تدخل يدوي. تتولى `openclaw doctor --fix` عمليات ترحيل مخزن مهام Cron.

    عمليات الترحيل الحالية:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - إعدادات القنوات المكوّنة التي تفتقد سياسة رد مرئية → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` على المستوى الأعلى
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - الإعدادات القديمة `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - محددات Talk الفورية القديمة على المستوى الأعلى (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - بالنسبة إلى القنوات التي لديها `accounts` مسماة لكن ما زالت تحتوي على قيم قناة أحادية الحساب على المستوى الأعلى، انقل تلك القيم ذات نطاق الحساب إلى الحساب المرقّى المختار لتلك القناة (`accounts.default` لمعظم القنوات؛ يمكن لـ Matrix الاحتفاظ بهدف مسمى/افتراضي مطابق موجود)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - أزل `agents.defaults.llm`؛ استخدم `models.providers.<id>.timeoutSeconds` لمهل الموفّر/النموذج البطيئة
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - أزل `browser.relayBindHost` (إعداد مرحّل الإضافة القديم)
    - `models.providers.*.api: "openai"` القديم → `"openai-completions"` (يتجاوز بدء Gateway أيضًا الموفّرين الذين تكون قيمة `api` لديهم مضبوطة على قيمة تعداد مستقبلية أو غير معروفة بدلًا من الفشل بإغلاق)

    تتضمن تحذيرات Doctor أيضًا إرشادات الحساب الافتراضي للقنوات متعددة الحسابات:

    - إذا تم تكوين إدخالين أو أكثر من `channels.<channel>.accounts` بدون `channels.<channel>.defaultAccount` أو `accounts.default`، يحذّر Doctor من أن التوجيه الاحتياطي يمكن أن يختار حسابًا غير متوقع.
    - إذا تم ضبط `channels.<channel>.defaultAccount` على معرّف حساب غير معروف، يحذّر Doctor ويسرد معرّفات الحسابات المكوّنة.

  </Accordion>
  <Accordion title="2b. تجاوزات موفّر OpenCode">
    إذا أضفت `models.providers.opencode` أو `opencode-zen` أو `opencode-go` يدويًا، فسيؤدي ذلك إلى تجاوز كتالوج OpenCode المدمج من `@mariozechner/pi-ai`. قد يجبر ذلك النماذج على API خطأ أو يصفّر التكاليف. يحذّر Doctor حتى تتمكن من إزالة التجاوز واستعادة توجيه API والتكاليف حسب كل نموذج.
  </Accordion>
  <Accordion title="2c. ترحيل المتصفح وجاهزية Chrome MCP">
    إذا كان تكوين المتصفح لديك لا يزال يشير إلى مسار إضافة Chrome المحذوفة، فسيطبّعه Doctor إلى نموذج إرفاق Chrome MCP المحلي على المضيف الحالي:

    - يتحول `browser.profiles.*.driver: "extension"` إلى `"existing-session"`
    - تتم إزالة `browser.relayBindHost`

    يدقّق Doctor أيضًا مسار Chrome MCP المحلي على المضيف عندما تستخدم `defaultProfile: "user"` أو ملف تعريف `existing-session` مكوّنًا:

    - يتحقق مما إذا كان Google Chrome مثبتًا على المضيف نفسه لملفات تعريف الاتصال التلقائي الافتراضية
    - يتحقق من إصدار Chrome المكتشف ويحذّر عندما يكون أقل من Chrome 144
    - يذكّرك بتمكين التصحيح عن بُعد في صفحة فحص المتصفح (على سبيل المثال `chrome://inspect/#remote-debugging` أو `brave://inspect/#remote-debugging` أو `edge://inspect/#remote-debugging`)

    لا يستطيع Doctor تمكين الإعداد الموجود في جانب Chrome نيابةً عنك. لا يزال Chrome MCP المحلي على المضيف يتطلب:

    - متصفحًا مستندًا إلى Chromium بإصدار 144+ على مضيف Gateway/Node
    - تشغيل المتصفح محليًا
    - تمكين التصحيح عن بُعد في ذلك المتصفح
    - الموافقة على مطالبة موافقة الإرفاق الأولى في المتصفح

    تتعلق الجاهزية هنا بمتطلبات الإرفاق المحلية فقط. يحافظ Existing-session على حدود مسارات Chrome MCP الحالية؛ لا تزال المسارات المتقدمة مثل `responsebody`، وتصدير PDF، واعتراض التنزيلات، والإجراءات الدُفعية تتطلب متصفحًا مدارًا أو ملف تعريف CDP خامًا.

    لا ينطبق هذا الفحص **على** Docker أو sandbox أو remote-browser أو التدفقات عديمة الواجهة الأخرى. تستمر تلك في استخدام CDP خام.

  </Accordion>
  <Accordion title="2d. متطلبات OAuth TLS الأساسية">
    عند تكوين ملف تعريف OpenAI Codex OAuth، يفحص Doctor نقطة نهاية تفويض OpenAI للتحقق من أن مكدس TLS المحلي في Node/OpenSSL يمكنه التحقق من سلسلة الشهادات. إذا فشل الفحص بخطأ شهادة (على سبيل المثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` أو شهادة منتهية الصلاحية أو شهادة موقعة ذاتيًا)، يطبع Doctor إرشادات إصلاح خاصة بالمنصة. على macOS مع Node من Homebrew، يكون الإصلاح عادةً `brew postinstall ca-certificates`. مع `--deep`، يعمل الفحص حتى إذا كان Gateway سليمًا.
  </Accordion>
  <Accordion title="2e. تجاوزات موفّر Codex OAuth">
    إذا كنت قد أضفت سابقًا إعدادات نقل OpenAI القديمة ضمن `models.providers.openai-codex`، فيمكن أن تحجب مسار موفّر Codex OAuth المدمج الذي تستخدمه الإصدارات الأحدث تلقائيًا. يحذّر Doctor عندما يرى إعدادات النقل القديمة هذه بجانب Codex OAuth حتى تتمكن من إزالة تجاوز النقل القديم أو إعادة كتابته واستعادة سلوك التوجيه/الاحتياط المدمج. لا تزال الوكلاء المخصصون والتجاوزات الخاصة بالرؤوس فقط مدعومة ولا تؤدي إلى تشغيل هذا التحذير.
  </Accordion>
  <Accordion title="2f. إصلاح مسار Codex">
    يتحقق Doctor من مراجع نماذج `openai-codex/*` القديمة. يستخدم توجيه حاضنة Codex الأصلية مراجع نماذج `openai/*` القياسية بالإضافة إلى `agentRuntime.id: "codex"` حتى تمر الجولة عبر حاضنة خادم تطبيق Codex بدلًا من مسار OpenClaw PI OpenAI.

    في وضع `--fix` / `--repair`، يعيد Doctor كتابة مراجع الوكيل الافتراضي والمراجع الخاصة بكل وكيل المتأثرة، بما في ذلك النماذج الأساسية والاحتياطيات وتجاوزات heartbeat/subagent/compaction والخطافات وتجاوزات نماذج القنوات وحالة مسار الجلسة القديمة المستمرة:

    - يتحول `openai-codex/gpt-*` إلى `openai/gpt-*`.
    - يصبح وقت تشغيل الوكيل المطابق `agentRuntime.id: "codex"` فقط عندما يكون Codex مثبتًا وممكّنًا ويساهم بحاضنة `codex` ولديه OAuth قابل للاستخدام.
    - وإلا يصبح وقت تشغيل الوكيل المطابق `agentRuntime.id: "pi"`.
    - يتم الاحتفاظ بقوائم احتياطات النماذج الموجودة مع إعادة كتابة إدخالاتها القديمة؛ وتنتقل الإعدادات المنسوخة الخاصة بكل نموذج من المفتاح القديم إلى مفتاح `openai/*` القياسي.
    - يتم إصلاح `modelProvider`/`providerOverride` و`model`/`modelOverride` المستمرة للجلسات، وإشعارات الاحتياط، وتثبيتات ملف تعريف المصادقة، وتثبيتات حاضنة Codex عبر جميع مخازن جلسات الوكلاء المكتشفة.
    - تعني `/codex ...` "التحكم في محادثة Codex أصلية أو ربطها من الدردشة."
    - تعني `/acp ...` أو `runtime: "acp"` "استخدام محوّل ACP/acpx الخارجي."

  </Accordion>
  <Accordion title="2g. تنظيف مسار الجلسة">
    يفحص Doctor أيضًا مخازن جلسات الوكلاء المكتشفة بحثًا عن حالة مسار قديمة منشأة تلقائيًا بعد نقل النماذج المكوّنة أو وقت التشغيل بعيدًا عن مسار مملوك لـ Plugin مثل Codex.

    يمكن لـ `openclaw doctor --fix` مسح الحالة القديمة المنشأة تلقائيًا مثل تثبيتات نماذج `modelOverrideSource: "auto"`، وبيانات تعريف نموذج وقت التشغيل، ومعرّفات الحاضنة المثبتة، وروابط جلسات CLI، وتجاوزات ملف تعريف المصادقة التلقائية عندما لا يكون المسار المالك لها مكوّنًا بعد الآن. يتم الإبلاغ عن اختيارات نماذج الجلسات الصريحة الخاصة بالمستخدم أو القديمة للمراجعة اليدوية وتُترك كما هي؛ بدّلها باستخدام `/model ...` أو `/new` أو أعد ضبط الجلسة عندما لا يعود ذلك المسار مقصودًا.

  </Accordion>
  <Accordion title="3. عمليات ترحيل الحالة القديمة (تخطيط القرص)">
    يستطيع Doctor ترحيل التخطيطات القديمة على القرص إلى البنية الحالية:

    - مخزن الجلسات + النصوص:
      - من `~/.openclaw/sessions/` إلى `~/.openclaw/agents/<agentId>/sessions/`
    - دليل الوكيل:
      - من `~/.openclaw/agent/` إلى `~/.openclaw/agents/<agentId>/agent/`
    - حالة مصادقة WhatsApp (Baileys):
      - من `~/.openclaw/credentials/*.json` القديم (باستثناء `oauth.json`)
      - إلى `~/.openclaw/credentials/whatsapp/<accountId>/...` (معرّف الحساب الافتراضي: `default`)

    تتم هذه الترحيلات بأفضل جهد وهي متكررة آمنة؛ سيصدر Doctor تحذيرات عندما يترك أي مجلدات قديمة كنسخ احتياطية. يرحّل Gateway/CLI أيضًا الجلسات القديمة ودليل الوكيل تلقائيًا عند بدء التشغيل حتى ينتقل السجل/المصادقة/النماذج إلى المسار الخاص بكل وكيل بدون تشغيل Doctor يدويًا. تقصد عملية ترحيل مصادقة WhatsApp أن تتم عبر `openclaw doctor` فقط. أصبحت تسوية موفّر Talk/خريطة الموفّرين تقارن الآن بالمساواة البنيوية، لذلك لم تعد الفروقات الناتجة عن ترتيب المفاتيح فقط تؤدي إلى تغييرات `doctor --fix` متكررة بلا أثر.

  </Accordion>
  <Accordion title="3a. عمليات ترحيل بيانات Plugin القديمة">
    يفحص Doctor جميع بيانات Plugin المثبتة بحثًا عن مفاتيح قدرات قديمة على المستوى الأعلى (`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders`). عند العثور عليها، يعرض نقلها إلى كائن `contracts` وإعادة كتابة ملف البيان في مكانه. هذا الترحيل متكرر آمن؛ إذا كان مفتاح `contracts` يحتوي بالفعل على القيم نفسها، تتم إزالة المفتاح القديم بدون تكرار البيانات.
  </Accordion>
  <Accordion title="3b. عمليات ترحيل مخزن Cron القديمة">
    يتحقق Doctor أيضًا من مخزن مهام cron (`~/.openclaw/cron/jobs.json` افتراضيًا، أو `cron.store` عند تجاوزه) بحثًا عن أشكال مهام قديمة لا يزال المجدول يقبلها للتوافق.

    تشمل عمليات تنظيف cron الحالية:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - حقول الحمولة على المستوى الأعلى (`message`، `model`، `thinking`، ...) → `payload`
    - حقول التسليم على المستوى الأعلى (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - أسماء مستعارة لتسليم `provider` ضمن الحمولة → `delivery.channel` صريح
    - مهام fallback القديمة البسيطة من نوع `notify: true` webhook → `delivery.mode="webhook"` صريح مع `delivery.to=cron.webhook`

    لا يُرحّل Doctor وظائف `notify: true` تلقائيًا إلا عندما يمكنه فعل ذلك دون تغيير السلوك. إذا جمعت وظيفة بين آلية الإشعار الاحتياطية القديمة ووضع تسليم غير Webhook موجود مسبقًا، يصدر doctor تحذيرًا ويترك تلك الوظيفة للمراجعة اليدوية.

    على Linux، يحذّر doctor أيضًا عندما يظل crontab الخاص بالمستخدم يستدعي `~/.openclaw/bin/ensure-whatsapp.sh` القديم. هذا السكربت المحلي للمضيف لا تصونه إصدارات OpenClaw الحالية، ويمكنه كتابة رسائل `Gateway inactive` خاطئة إلى `~/.openclaw/logs/whatsapp-health.log` عندما يتعذر على cron الوصول إلى ناقل مستخدم systemd. أزل إدخال crontab القديم باستخدام `crontab -e`؛ واستخدم `openclaw channels status --probe` و`openclaw doctor` و`openclaw gateway status` لفحوصات السلامة الحالية.

  </Accordion>
  <Accordion title="3c. تنظيف قفل الجلسة">
    يفحص Doctor كل دليل جلسة وكيل بحثًا عن ملفات أقفال كتابة قديمة — وهي ملفات تُترك عند خروج جلسة بشكل غير طبيعي. لكل ملف قفل يعثر عليه، يبلّغ عن: المسار، وPID، وما إذا كان PID لا يزال حيًا، وعمر القفل، وما إذا كان يُعد قديمًا (PID ميت أو أقدم من 30 دقيقة). في وضع `--fix` / `--repair` يزيل ملفات القفل القديمة تلقائيًا؛ وإلا فإنه يطبع ملاحظة ويطلب منك إعادة التشغيل مع `--fix`.
  </Accordion>
  <Accordion title="3d. إصلاح فرع نص جلسة المحادثة">
    يفحص Doctor ملفات JSONL لجلسات الوكلاء بحثًا عن شكل الفرع المكرر الذي أنشأه خطأ إعادة كتابة نص المحفز في 2026.4.24: دورة مستخدم متروكة مع سياق تشغيل داخلي من OpenClaw إضافة إلى فرع شقيق نشط يحتوي على محفز المستخدم المرئي نفسه. في وضع `--fix` / `--repair`، ينسخ doctor كل ملف متأثر احتياطيًا بجانب الأصل ويعيد كتابة النص إلى الفرع النشط حتى لا يعود سجل Gateway وقارئات الذاكرة ترى دورات مكررة.
  </Accordion>
  <Accordion title="4. فحوصات سلامة الحالة (استمرارية الجلسات، والتوجيه، والسلامة)">
    دليل الحالة هو جذع الدماغ التشغيلي. إذا اختفى، فستفقد الجلسات، وبيانات الاعتماد، والسجلات، والإعدادات (ما لم تكن لديك نسخ احتياطية في مكان آخر).

    يتحقق Doctor من:

    - **دليل الحالة مفقود**: يحذّر من فقدان كارثي للحالة، ويطلب إعادة إنشاء الدليل، ويذكّرك بأنه لا يستطيع استرداد البيانات المفقودة.
    - **أذونات دليل الحالة**: يتحقق من قابلية الكتابة؛ ويعرض إصلاح الأذونات (ويصدر تلميح `chown` عند اكتشاف عدم تطابق المالك/المجموعة).
    - **دليل حالة متزامن سحابيًا على macOS**: يحذّر عندما تُحلّ الحالة تحت iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) أو `~/Library/CloudStorage/...` لأن المسارات المدعومة بالمزامنة قد تسبب إدخال/إخراج أبطأ وسباقات قفل/مزامنة.
    - **دليل حالة Linux على SD أو eMMC**: يحذّر عندما تُحلّ الحالة إلى مصدر تركيب `mmcblk*`، لأن الإدخال/الإخراج العشوائي المدعوم ببطاقات SD أو eMMC قد يكون أبطأ ويتآكل أسرع تحت كتابات الجلسات وبيانات الاعتماد.
    - **أدلة الجلسات مفقودة**: يلزم وجود `sessions/` ودليل مخزن الجلسات لاستمرار السجل وتجنب أعطال `ENOENT`.
    - **عدم تطابق النص**: يحذّر عندما تكون إدخالات الجلسات الحديثة تفتقد ملفات النص.
    - **الجلسة الرئيسية "JSONL بسطر واحد"**: يعلّم الحالة عندما يحتوي النص الرئيسي على سطر واحد فقط (السجل لا يتراكم).
    - **أدلة حالة متعددة**: يحذّر عندما توجد عدة مجلدات `~/.openclaw` عبر أدلة المنزل أو عندما يشير `OPENCLAW_STATE_DIR` إلى مكان آخر (يمكن أن ينقسم السجل بين عمليات التثبيت).
    - **تذكير الوضع البعيد**: إذا كان `gateway.mode=remote`، يذكّرك doctor بتشغيله على المضيف البعيد (الحالة موجودة هناك).
    - **أذونات ملف الإعدادات**: يحذّر إذا كان `~/.openclaw/openclaw.json` قابلاً للقراءة من المجموعة/العالم ويعرض تشديده إلى `600`.

  </Accordion>
  <Accordion title="5. صحة مصادقة النموذج (انتهاء صلاحية OAuth)">
    يفحص Doctor ملفات تعريف OAuth في مخزن المصادقة، ويحذّر عندما تكون الرموز على وشك الانتهاء/منتهية، ويمكنه تحديثها عندما يكون ذلك آمنًا. إذا كان ملف تعريف Anthropic OAuth/الرمز قديمًا، يقترح مفتاح Anthropic API أو مسار رمز إعداد Anthropic. لا تظهر مطالبات التحديث إلا عند التشغيل تفاعليًا (TTY)؛ يتجاوز `--non-interactive` محاولات التحديث.

    عندما يفشل تحديث OAuth نهائيًا (مثل `refresh_token_reused` أو `invalid_grant` أو عندما يخبرك موفر بتسجيل الدخول مرة أخرى)، يبلّغ doctor بأن إعادة المصادقة مطلوبة ويطبع أمر `openclaw models auth login --provider ...` الدقيق لتشغيله.

    يبلّغ Doctor أيضًا عن ملفات تعريف المصادقة غير القابلة للاستخدام مؤقتًا بسبب:

    - فترات تهدئة قصيرة (حدود المعدل/انتهاء المهلة/إخفاقات المصادقة)
    - تعطيلات أطول (إخفاقات الفوترة/الرصيد)

  </Accordion>
  <Accordion title="6. التحقق من نموذج الخطافات">
    إذا تم تعيين `hooks.gmail.model`، يتحقق doctor من مرجع النموذج مقابل الكتالوج وقائمة السماح ويحذّر عندما لا يمكن حله أو عندما يكون غير مسموح به.
  </Accordion>
  <Accordion title="7. إصلاح صورة sandbox">
    عند تمكين sandboxing، يتحقق doctor من صور Docker ويعرض البناء أو التبديل إلى الأسماء القديمة إذا كانت الصورة الحالية مفقودة.
  </Accordion>
  <Accordion title="7b. تنظيف تثبيت Plugin">
    يزيل Doctor حالة تهيئة تبعيات Plugin القديمة التي أنشأها OpenClaw في وضع `openclaw doctor --fix` / `openclaw doctor --repair`. يشمل ذلك جذور التبعيات المولدة القديمة، وأدلة مراحل التثبيت القديمة، وبقايا الحزم المحلية من كود إصلاح تبعيات Plugin المضمنة السابقة، ونسخ npm المُدارة اليتيمة أو المستردة من Plugins `@openclaw/*` المضمنة التي يمكن أن تحجب البيان المضمن الحالي.

    يستطيع Doctor أيضًا إعادة تثبيت Plugins القابلة للتنزيل المفقودة عندما تشير إليها الإعدادات لكن سجل Plugin المحلي لا يستطيع العثور عليها. تشمل الأمثلة `plugins.entries` المادية، وإعدادات القناة/الموفر/البحث المكوّنة، وبيئات تشغيل الوكلاء المكوّنة. أثناء تحديثات الحزم، يتجنب doctor تشغيل إصلاح Plugin عبر مدير الحزم أثناء تبديل الحزمة الأساسية؛ شغّل `openclaw doctor --fix` مرة أخرى بعد التحديث إذا ظل Plugin مكوّن بحاجة إلى استرداد. لا يشغّل بدء Gateway ولا إعادة تحميل الإعدادات مديري الحزم؛ تظل عمليات تثبيت Plugin عملًا صريحًا عبر doctor/install/update.

  </Accordion>
  <Accordion title="8. ترحيلات خدمة Gateway وتلميحات التنظيف">
    يكتشف Doctor خدمات gateway القديمة (launchd/systemd/schtasks) ويعرض إزالتها وتثبيت خدمة OpenClaw باستخدام منفذ gateway الحالي. يمكنه أيضًا فحص خدمات إضافية شبيهة بـ gateway وطباعة تلميحات التنظيف. تُعد خدمات gateway الخاصة بـ OpenClaw المسماة بحسب ملف التعريف من الدرجة الأولى ولا تُعلّم على أنها "إضافية".

    على Linux، إذا كانت خدمة gateway على مستوى المستخدم مفقودة لكن توجد خدمة gateway من OpenClaw على مستوى النظام، لا يثبت doctor خدمة ثانية على مستوى المستخدم تلقائيًا. افحص باستخدام `openclaw gateway status --deep` أو `openclaw doctor --deep`، ثم أزل النسخة المكررة أو عيّن `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يكون مشرف نظام يملك دورة حياة gateway.

  </Accordion>
  <Accordion title="8b. ترحيل Startup Matrix">
    عندما يكون لدى حساب قناة Matrix ترحيل حالة قديم معلق أو قابل للتنفيذ، ينشئ doctor (في وضع `--fix` / `--repair`) لقطة قبل الترحيل ثم يشغّل خطوات الترحيل بأفضل جهد: ترحيل حالة Matrix القديمة وتحضير الحالة المشفرة القديمة. كلتا الخطوتين غير قاتلتين؛ تُسجّل الأخطاء ويستمر بدء التشغيل. في وضع القراءة فقط (`openclaw doctor` دون `--fix`) يُتخطى هذا الفحص بالكامل.
  </Accordion>
  <Accordion title="8c. إقران الأجهزة وانحراف المصادقة">
    يفحص Doctor الآن حالة إقران الأجهزة كجزء من مرور السلامة العادي.

    ما يبلّغ عنه:

    - طلبات إقران أولية معلقة
    - ترقيات دور معلقة للأجهزة المقترنة بالفعل
    - ترقيات نطاق معلقة للأجهزة المقترنة بالفعل
    - إصلاحات عدم تطابق المفتاح العام حيث لا يزال معرّف الجهاز مطابقًا لكن هوية الجهاز لم تعد تطابق السجل المعتمد
    - سجلات مقترنة تفتقد رمزًا نشطًا لدور معتمد
    - رموز مقترنة انحرفت نطاقاتها خارج خط أساس الإقران المعتمد
    - إدخالات رموز أجهزة مخزنة محليًا للجهاز الحالي تسبق تدوير رمز من جانب gateway أو تحمل بيانات وصفية قديمة للنطاق

    لا يوافق Doctor تلقائيًا على طلبات الإقران ولا يدوّر رموز الأجهزة تلقائيًا. بل يطبع الخطوات التالية الدقيقة:

    - افحص الطلبات المعلقة باستخدام `openclaw devices list`
    - وافق على الطلب الدقيق باستخدام `openclaw devices approve <requestId>`
    - دوّر رمزًا جديدًا باستخدام `openclaw devices rotate --device <deviceId> --role <role>`
    - أزل سجلًا قديمًا وأعد اعتماده باستخدام `openclaw devices remove <deviceId>`

    هذا يسد ثغرة "مقترن بالفعل لكن لا تزال تظهر مطالبة الإقران" الشائعة: يميز doctor الآن بين الإقران لأول مرة وترقيات الدور/النطاق المعلقة وانحراف الرمز/هوية الجهاز القديم.

  </Accordion>
  <Accordion title="9. تحذيرات الأمان">
    يصدر Doctor تحذيرات عندما يكون موفر مفتوحًا للرسائل المباشرة دون قائمة سماح، أو عندما تكون سياسة مكوّنة بطريقة خطيرة.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    إذا كان يعمل كخدمة مستخدم systemd، يضمن doctor تمكين linger حتى يبقى gateway حيًا بعد تسجيل الخروج.
  </Accordion>
  <Accordion title="11. حالة مساحة العمل (Skills، وPlugins، والأدلة القديمة)">
    يطبع Doctor ملخصًا لحالة مساحة العمل للوكيل الافتراضي:

    - **حالة Skills**: يحصي Skills المؤهلة، والتي تفتقد المتطلبات، والمحجوبة بقائمة السماح.
    - **أدلة مساحة العمل القديمة**: يحذّر عندما توجد `~/openclaw` أو أدلة مساحة عمل قديمة أخرى بجانب مساحة العمل الحالية.
    - **حالة Plugin**: يحصي Plugins الممكّنة/المعطلة/التي بها أخطاء؛ ويسرد معرّفات Plugin لأي أخطاء؛ ويبلّغ عن قدرات Plugin الحزمة.
    - **تحذيرات توافق Plugin**: يعلّم Plugins التي لديها مشكلات توافق مع بيئة التشغيل الحالية.
    - **تشخيصات Plugin**: يعرض أي تحذيرات أو أخطاء وقت التحميل يصدرها سجل Plugin.

  </Accordion>
  <Accordion title="11b. حجم ملف bootstrap">
    يتحقق Doctor مما إذا كانت ملفات bootstrap لمساحة العمل (مثل `AGENTS.md` أو `CLAUDE.md` أو ملفات سياق محقونة أخرى) قريبة من ميزانية الأحرف المكوّنة أو تتجاوزها. يبلّغ لكل ملف عن عدد الأحرف الخام مقابل المحقونة، ونسبة الاقتطاع، وسبب الاقتطاع (`max/file` أو `max/total`)، وإجمالي الأحرف المحقونة كنسبة من الميزانية الإجمالية. عندما تُقتطع الملفات أو تقترب من الحد، يطبع doctor نصائح لضبط `agents.defaults.bootstrapMaxChars` و`agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. تنظيف Plugin قناة قديم">
    عندما يزيل `openclaw doctor --fix` Plugin قناة مفقودًا، فإنه يزيل أيضًا إعدادات نطاق القناة المعلقة التي أشارت إلى ذلك Plugin: إدخالات `channels.<id>`، وأهداف Heartbeat التي سمّت القناة، وتجاوزات `agents.*.models["<channel>/*"]`. يمنع هذا حلقات بدء Gateway حيث اختفت بيئة تشغيل القناة لكن الإعدادات لا تزال تطلب من gateway الارتباط بها.
  </Accordion>
  <Accordion title="11c. إكمال الصدفة">
    يتحقق Doctor مما إذا كان إكمال التبويب مثبتًا للصدفة الحالية (zsh أو bash أو fish أو PowerShell):

    - إذا كان ملف تعريف الصدفة يستخدم نمط إكمال ديناميكيًا بطيئًا (`source <(openclaw completion ...)`)، يرقّيه doctor إلى متغير الملف المخزن مؤقتًا الأسرع.
    - إذا كان الإكمال مكوّنًا في ملف التعريف لكن ملف التخزين المؤقت مفقود، يعيد doctor توليد التخزين المؤقت تلقائيًا.
    - إذا لم يكن أي إكمال مكوّنًا إطلاقًا، يطالب doctor بتثبيته (الوضع التفاعلي فقط؛ يُتخطى مع `--non-interactive`).

    شغّل `openclaw completion --write-state` لإعادة توليد التخزين المؤقت يدويًا.

  </Accordion>
  <Accordion title="12. فحوصات مصادقة Gateway (الرمز المحلي)">
    يتحقق Doctor من جاهزية مصادقة رمز gateway المحلي.

    - إذا كان وضع الرمز يحتاج إلى رمز ولا يوجد مصدر رمز، يعرض doctor إنشاء واحد.
    - إذا كان `gateway.auth.token` مُدارًا بواسطة SecretRef لكنه غير متاح، يحذّر doctor ولا يستبدله بنص صريح.
    - يفرض `openclaw doctor --generate-gateway-token` الإنشاء فقط عندما لا يكون أي SecretRef للرمز مكوّنًا.

  </Accordion>
  <Accordion title="12b. إصلاحات للقراءة فقط تراعي SecretRef">
    تحتاج بعض مسارات الإصلاح إلى فحص بيانات الاعتماد المضبوطة دون إضعاف سلوك الفشل السريع في وقت التشغيل.

    - يستخدم `openclaw doctor --fix` الآن نموذج ملخص SecretRef للقراءة فقط نفسه الذي تستخدمه أوامر عائلة الحالة لإصلاحات الإعدادات المستهدفة.
    - مثال: يحاول إصلاح Telegram `allowFrom` / `groupAllowFrom` `@username` استخدام بيانات اعتماد البوت المضبوطة عند توفرها.
    - إذا كان رمز بوت Telegram مضبوطًا عبر SecretRef لكنه غير متاح في مسار الأمر الحالي، يبلّغ doctor بأن بيانات الاعتماد مضبوطة لكنها غير متاحة، ويتخطى الحل التلقائي بدلًا من الانهيار أو الإبلاغ خطأً عن أن الرمز مفقود.

  </Accordion>
  <Accordion title="13. فحص صحة Gateway + إعادة التشغيل">
    يشغّل Doctor فحص صحة ويعرض إعادة تشغيل Gateway عندما يبدو غير سليم.
  </Accordion>
  <Accordion title="13b. جاهزية بحث الذاكرة">
    يتحقق Doctor مما إذا كان مزود تضمين بحث الذاكرة المضبوط جاهزًا للوكيل الافتراضي. يعتمد السلوك على الخلفية والمزود المضبوطين:

    - **خلفية QMD**: يفحص ما إذا كان ملف `qmd` التنفيذي متاحًا وقابلًا للبدء. إذا لم يكن كذلك، يطبع إرشادات إصلاح تتضمن حزمة npm وخيار مسار ثنائي يدوي.
    - **مزود محلي صريح**: يتحقق من وجود ملف نموذج محلي أو عنوان URL معروف لنموذج بعيد/قابل للتنزيل. إذا كان مفقودًا، يقترح التبديل إلى مزود بعيد.
    - **مزود بعيد صريح** (`openai`، `voyage`، إلخ): يتحقق من وجود مفتاح API في البيئة أو مخزن المصادقة. يطبع تلميحات إصلاح قابلة للتنفيذ إذا كان مفقودًا.
    - **مزود تلقائي**: يتحقق من توفر النموذج المحلي أولًا، ثم يجرب كل مزود بعيد وفق ترتيب الاختيار التلقائي.

    عندما تكون نتيجة فحص Gateway مخبأة متاحة (كان Gateway سليمًا وقت الفحص)، يقارن doctor نتيجتها مع الإعدادات المرئية لـ CLI ويشير إلى أي اختلاف. لا يبدأ Doctor اختبار تضمين جديدًا في المسار الافتراضي؛ استخدم أمر حالة الذاكرة العميق عندما تريد فحص مزود مباشرًا.

    استخدم `openclaw memory status --deep` للتحقق من جاهزية التضمين في وقت التشغيل.

  </Accordion>
  <Accordion title="14. تحذيرات حالة القناة">
    إذا كان Gateway سليمًا، يشغّل doctor فحص حالة قناة ويبلغ عن التحذيرات مع إصلاحات مقترحة.
  </Accordion>
  <Accordion title="15. تدقيق إعدادات المشرف + الإصلاح">
    يتحقق Doctor من إعدادات المشرف المثبتة (launchd/systemd/schtasks) بحثًا عن القيم الافتراضية المفقودة أو القديمة (مثل اعتماديات systemd للشبكة المتصلة وتأخير إعادة التشغيل). عندما يجد عدم تطابق، يوصي بتحديث ويمكنه إعادة كتابة ملف الخدمة/المهمة إلى القيم الافتراضية الحالية.

    ملاحظات:

    - يطلب `openclaw doctor` التأكيد قبل إعادة كتابة إعدادات المشرف.
    - يقبل `openclaw doctor --yes` مطالبات الإصلاح الافتراضية.
    - يطبق `openclaw doctor --repair` الإصلاحات الموصى بها دون مطالبات.
    - يكتب `openclaw doctor --repair --force` فوق إعدادات المشرف المخصصة.
    - يحافظ `OPENCLAW_SERVICE_REPAIR_POLICY=external` على doctor للقراءة فقط لدورة حياة خدمة Gateway. يظل يبلغ عن صحة الخدمة ويشغّل الإصلاحات غير المتعلقة بالخدمة، لكنه يتخطى تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة، وإعادة كتابة إعدادات المشرف، وتنظيف الخدمات القديمة لأن مشرفًا خارجيًا يملك دورة الحياة تلك.
    - على Linux، لا يعيد doctor كتابة بيانات الأمر/نقطة الدخول الوصفية أثناء نشاط وحدة Gateway المطابقة في systemd. كما يتجاهل وحدات Gateway الشبيهة الإضافية غير القديمة وغير النشطة أثناء فحص الخدمات المكررة حتى لا تنشئ ملفات الخدمات المصاحبة ضجيج تنظيف.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان `gateway.auth.token` مُدارًا عبر SecretRef، يتحقق تثبيت/إصلاح خدمة doctor من SecretRef لكنه لا يحفظ قيم الرمز النصية الصريحة المحلولة في بيانات بيئة خدمة المشرف الوصفية.
    - يكتشف Doctor قيم بيئة الخدمة المُدارة والمستندة إلى `.env`/SecretRef التي ضمّنتها تثبيتات LaunchAgent أو systemd أو Windows Scheduled Task القديمة داخل التعريف، ويعيد كتابة بيانات الخدمة الوصفية بحيث تُحمّل تلك القيم من مصدر وقت التشغيل بدلًا من تعريف المشرف.
    - يكتشف Doctor عندما يظل أمر الخدمة يثبت `--port` قديمًا بعد تغيّر `gateway.port` ويعيد كتابة بيانات الخدمة الوصفية إلى المنفذ الحالي.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef المضبوط للرمز غير محلول، يحظر doctor مسار التثبيت/الإصلاح مع إرشادات قابلة للتنفيذ.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مضبوطين وكان `gateway.auth.mode` غير مضبوط، يحظر doctor التثبيت/الإصلاح إلى أن يُضبط الوضع صراحةً.
    - بالنسبة إلى وحدات systemd الخاصة بالمستخدم على Linux، تشمل فحوصات انحراف رمز doctor الآن مصادر `Environment=` و`EnvironmentFile=` عند مقارنة بيانات مصادقة الخدمة الوصفية.
    - ترفض إصلاحات خدمة Doctor إعادة كتابة خدمة Gateway أو إيقافها أو إعادة تشغيلها من ملف OpenClaw ثنائي أقدم عندما تكون الإعدادات قد كُتبت آخر مرة بواسطة إصدار أحدث. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - يمكنك دائمًا فرض إعادة كتابة كاملة عبر `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. تشخيصات وقت تشغيل Gateway + المنفذ">
    يفحص Doctor وقت تشغيل الخدمة (PID، وحالة الخروج الأخيرة) ويحذر عندما تكون الخدمة مثبتة لكنها لا تعمل فعليًا. كما يتحقق من تعارضات المنافذ على منفذ Gateway (الافتراضي `18789`) ويبلغ عن الأسباب المحتملة (Gateway يعمل بالفعل، نفق SSH).
  </Accordion>
  <Accordion title="17. أفضل ممارسات وقت تشغيل Gateway">
    يحذر Doctor عندما تعمل خدمة Gateway على Bun أو مسار Node مُدار بالإصدارات (`nvm`، `fnm`، `volta`، `asdf`، إلخ). تتطلب قنوات WhatsApp + Telegram استخدام Node، ويمكن أن تتعطل مسارات مديري الإصدارات بعد الترقيات لأن الخدمة لا تحمّل تهيئة الصدفة الخاصة بك. يعرض Doctor الترحيل إلى تثبيت Node على مستوى النظام عند توفره (Homebrew/apt/choco).

    تستخدم LaunchAgents على macOS المثبتة أو المُصلحة حديثًا PATH نظاميًا قياسيًا (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) بدلًا من نسخ PATH الخاص بالصدفة التفاعلية، لذلك لا تغيّر أدلة Volta وasdf وfnm وpnpm وغيرها من أدلة مديري الإصدارات أي عمليات Node فرعية يتم حلها. لا تزال خدمات Linux تحتفظ بجذور بيئة صريحة (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) وأدلة user-bin مستقرة، لكن أدلة الرجوع الاحتياطية المخمّنة لمديري الإصدارات لا تُكتب إلى PATH الخاص بالخدمة إلا عندما تكون تلك الأدلة موجودة على القرص.

  </Accordion>
  <Accordion title="18. كتابة الإعدادات + بيانات المعالج الوصفية">
    يحفظ Doctor أي تغييرات في الإعدادات ويختم بيانات المعالج الوصفية لتسجيل تشغيل doctor.
  </Accordion>
  <Accordion title="19. نصائح مساحة العمل (النسخ الاحتياطي + نظام الذاكرة)">
    يقترح Doctor نظام ذاكرة لمساحة العمل عند غيابه ويطبع نصيحة نسخ احتياطي إذا لم تكن مساحة العمل تحت git بالفعل.

    راجع [/concepts/agent-workspace](/ar/concepts/agent-workspace) للحصول على دليل كامل لبنية مساحة العمل والنسخ الاحتياطي باستخدام git (يوصى بـ GitHub أو GitLab خاص).

  </Accordion>
</AccordionGroup>

## ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
