---
read_when:
    - إضافة أو تعديل ترحيلات doctor
    - إدخال تغييرات كاسرة في الإعدادات
sidebarTitle: Doctor
summary: 'أمر التشخيص: فحوصات الصحة، وترحيلات الإعدادات، وخطوات الإصلاح'
title: التشخيص
x-i18n:
    generated_at: "2026-05-06T17:57:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e8a1e280717b7a523ba092dec2e2f7d1c13e67a5ede30d0b4bb5a3100dc0e44
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` هو أداة الإصلاح والترحيل في OpenClaw. تصلح الإعدادات/الحالة القديمة، وتفحص الصحة، وتوفر خطوات إصلاح قابلة للتنفيذ.

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

    قبول الإعدادات الافتراضية دون مطالبة (بما في ذلك خطوات إصلاح إعادة التشغيل/الخدمة/بيئة العزل عند انطباقها).

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

    تطبيق الإصلاحات القوية أيضا (يستبدل إعدادات المشرف المخصصة).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    التشغيل دون مطالبات وتطبيق عمليات الترحيل الآمنة فقط (تطبيع الإعدادات + نقل الحالة على القرص). يتخطى إجراءات إعادة التشغيل/الخدمة/بيئة العزل التي تتطلب تأكيدا بشريا. تعمل عمليات ترحيل الحالة القديمة تلقائيا عند اكتشافها.

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
  <Accordion title="الصحة وواجهة المستخدم والتحديثات">
    - تحديث اختياري قبل التشغيل لتثبيتات git (تفاعلي فقط).
    - فحص حداثة بروتوكول واجهة المستخدم (يعيد بناء Control UI عندما يكون مخطط البروتوكول أحدث).
    - فحص الصحة + مطالبة بإعادة التشغيل.
    - ملخص حالة Skills (مؤهلة/ناقصة/محظورة) وحالة Plugin.

  </Accordion>
  <Accordion title="الإعدادات وعمليات الترحيل">
    - تطبيع الإعدادات للقيم القديمة.
    - ترحيل إعداد Talk من حقول `talk.*` المسطحة القديمة إلى `talk.provider` + `talk.providers.<provider>`.
    - فحوصات ترحيل المتصفح لإعدادات إضافة Chrome القديمة وجاهزية Chrome MCP.
    - تحذيرات تجاوز موفر OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - تحذيرات حجب OAuth في Codex (`models.providers.openai-codex`).
    - فحص متطلبات OAuth TLS الأساسية لملفات تعريف OpenAI Codex OAuth.
    - تحذيرات قائمة السماح الخاصة بـ Plugin/الأدوات عندما يكون `plugins.allow` مقيدا لكن سياسة الأدوات لا تزال تطلب أدوات بدل شامل أو أدوات مملوكة لـ Plugin.
    - ترحيل الحالة القديمة على القرص (الجلسات/دليل الوكيل/مصادقة WhatsApp).
    - ترحيل مفاتيح عقد بيان Plugin القديمة (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - ترحيل مخزن Cron القديم (`jobId`, `schedule.cron`, حقول التسليم/الحمولة في المستوى الأعلى، حمولة `provider`، وظائف احتياطية بسيطة لـ Webhook من نوع `notify: true`).
    - ترحيل سياسة وقت تشغيل الوكيل القديمة إلى `agents.defaults.agentRuntime` و`agents.list[].agentRuntime`.
    - تنظيف إعدادات Plugin القديمة عندما تكون Plugins مفعلة؛ عندما يكون `plugins.enabled=false`، تعامل مراجع Plugin القديمة كإعداد احتواء خامل ويتم الحفاظ عليها.

  </Accordion>
  <Accordion title="الحالة والسلامة">
    - فحص ملفات قفل الجلسة وتنظيف الأقفال القديمة.
    - إصلاح نصوص الجلسات لفروع إعادة كتابة المطالبات المكررة التي أنشأتها إصدارات 2026.4.24 المتأثرة.
    - اكتشاف علامات توقف الاسترداد بعد إعادة تشغيل الوكلاء الفرعيين العالقين، مع دعم `--fix` لمسح علامات الاسترداد القديمة الملغاة بحيث لا يظل بدء التشغيل يعامل الابن كأنه ألغيت إعادة تشغيله.
    - فحوصات سلامة الحالة والأذونات (الجلسات، النصوص، دليل الحالة).
    - فحوصات أذونات ملف الإعدادات (chmod 600) عند التشغيل محليا.
    - صحة مصادقة النموذج: تفحص انتهاء OAuth، ويمكنها تحديث الرموز التي توشك على الانتهاء، وتبلغ عن حالات التهدئة/التعطيل لملف تعريف المصادقة.
    - اكتشاف دليل مساحة عمل إضافي (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway والخدمات والمشرفون">
    - إصلاح صورة بيئة العزل عندما تكون بيئة العزل مفعلة.
    - ترحيل الخدمة القديمة واكتشاف Gateway إضافي.
    - ترحيل حالة قناة Matrix القديمة (في وضع `--fix` / `--repair`).
    - فحوصات وقت تشغيل Gateway (الخدمة مثبتة لكنها لا تعمل؛ تسمية launchd مخزنة مؤقتا).
    - تحذيرات حالة القناة (تجري معاينتها من Gateway قيد التشغيل).
    - فحوصات استجابة WhatsApp لتدهور صحة حلقة أحداث Gateway مع استمرار تشغيل عملاء TUI المحليين؛ يوقف `--fix` عملاء TUI المحليين المتحقق منهم فقط.
    - إصلاح مسار Codex لمراجع نموذج `openai-codex/*` القديمة في النماذج الأساسية، والبدائل، وتجاوزات Heartbeat/الوكيل الفرعي/Compaction، والخطافات، وتجاوزات نموذج القناة، وتثبيتات مسار الجلسة؛ يعيد `--fix` كتابتها إلى `openai/*` ويختار `agentRuntime.id: "codex"` فقط عندما يكون Codex Plugin مثبتا ومفعلا، ويساهم بحزمة `codex`، ولديه OAuth قابل للاستخدام. وإلا فإنه يختار `agentRuntime.id: "pi"`.
    - تدقيق إعدادات المشرف (launchd/systemd/schtasks) مع إصلاح اختياري.
    - تنظيف بيئة الوكيل المضمنة لخدمات Gateway التي التقطت قيم `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` من الصدفة أثناء التثبيت أو التحديث.
    - فحوصات أفضل ممارسات وقت تشغيل Gateway (Node مقابل Bun، ومسارات مدير الإصدارات).
    - تشخيصات تعارض منفذ Gateway (الافتراضي `18789`).

  </Accordion>
  <Accordion title="المصادقة والأمان والاقتران">
    - تحذيرات أمنية لسياسات الرسائل الخاصة المفتوحة.
    - فحوصات مصادقة Gateway لوضع الرمز المحلي (تعرض إنشاء رمز عندما لا يوجد مصدر رمز؛ ولا تستبدل إعدادات SecretRef للرمز).
    - اكتشاف مشكلات اقتران الجهاز (طلبات الاقتران الأولى المعلقة، وترقيات الدور/النطاق المعلقة، وانحراف ذاكرة التخزين المؤقت لرمز الجهاز المحلي القديم، وانحراف مصادقة سجل الاقتران).

  </Accordion>
  <Accordion title="مساحة العمل والصدفة">
    - فحص systemd linger على Linux.
    - فحص حجم ملف تمهيد مساحة العمل (تحذيرات الاقتطاع/الاقتراب من الحد لملفات السياق).
    - فحص جاهزية Skills للوكيل الافتراضي؛ يبلغ عن Skills المسموح بها التي تنقصها الثنائيات أو البيئة أو الإعدادات أو متطلبات نظام التشغيل، ويمكن لـ `--fix` تعطيل Skills غير المتاحة في `skills.entries`.
    - فحص حالة إكمال الصدفة والتثبيت/الترقية التلقائية.
    - فحص جاهزية موفر تضمين بحث الذاكرة (نموذج محلي، أو مفتاح API بعيد، أو ثنائي QMD).
    - فحوصات تثبيت المصدر (عدم تطابق مساحة عمل pnpm، أصول واجهة مستخدم ناقصة، ثنائي tsx ناقص).
    - كتابة الإعدادات المحدثة + بيانات معالج الإعداد الوصفية.

  </Accordion>
</AccordionGroup>

## الملء الراجع وإعادة الضبط في واجهة Dreams

يتضمن مشهد Dreams في Control UI إجراءات **الملء الراجع** و**إعادة الضبط** و**مسح المؤرض** لتدفق عمل Dreaming المؤرض. تستخدم هذه الإجراءات طرائق RPC بأسلوب doctor عبر Gateway، لكنها **ليست** جزءا من إصلاح/ترحيل `openclaw doctor` في CLI.

ما تفعله:

- **الملء الراجع** يفحص ملفات `memory/YYYY-MM-DD.md` التاريخية في مساحة العمل النشطة، ويشغل تمريرة يوميات REM المؤرضة، ويكتب إدخالات ملء راجع قابلة للعكس في `DREAMS.md`.
- **إعادة الضبط** تزيل فقط إدخالات يوميات الملء الراجع الموسومة من `DREAMS.md`.
- **مسح المؤرض** يزيل فقط الإدخالات المرحلية قصيرة المدى المؤرضة فقط التي جاءت من إعادة التشغيل التاريخية ولم تجمع بعد استدعاء حيا أو دعما يوميا.

ما لا تفعله **بحد ذاتها**:

- لا تعدل `MEMORY.md`
- لا تشغل عمليات ترحيل doctor كاملة
- لا تدرج المرشحين المؤرضين تلقائيا في مخزن الترقية قصيرة المدى الحي إلا إذا شغلت مسار CLI المرحلي صراحة أولا

إذا أردت أن يؤثر التشغيل التاريخي المؤرض في مسار الترقية العميقة العادي، فاستخدم تدفق CLI بدلا من ذلك:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

يؤدي ذلك إلى إدراج المرشحين المؤرضين الدائمين في مخزن Dreaming قصير المدى مع إبقاء `DREAMS.md` سطح المراجعة.

## السلوك التفصيلي والمبررات

<AccordionGroup>
  <Accordion title="0. تحديث اختياري (تثبيتات git)">
    إذا كان هذا checkout من git وكان doctor يعمل تفاعليا، فإنه يعرض التحديث (fetch/rebase/build) قبل تشغيل doctor.
  </Accordion>
  <Accordion title="1. تطبيع الإعدادات">
    إذا كانت الإعدادات تحتوي أشكال قيم قديمة (على سبيل المثال `messages.ackReaction` دون تجاوز خاص بالقناة)، يطبعها doctor ضمن المخطط الحالي.

    يشمل ذلك حقول Talk المسطحة القديمة. إعداد الكلام العام الحالي في Talk هو `talk.provider` + `talk.providers.<provider>`، وإعداد الصوت في الوقت الفعلي هو `talk.realtime.*`. يعيد Doctor كتابة أشكال `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` القديمة داخل خريطة الموفر، ويعيد كتابة محددات الوقت الفعلي القديمة في المستوى الأعلى (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) داخل `talk.realtime`.

    يحذر Doctor أيضا عندما يكون `plugins.allow` غير فارغ وتستخدم سياسة الأدوات
    إدخالات أدوات بدل شامل أو مملوكة لـ Plugin. يطابق `tools.allow: ["*"]` الأدوات فقط
    من Plugins التي تتحمل فعلا؛ ولا يتجاوز قائمة السماح الحصرية الخاصة بـ Plugin.
    يكتب Doctor القيمة `plugins.bundledDiscovery: "compat"` لإعدادات قائمة السماح
    القديمة المرحلة للحفاظ على سلوك الموفرات المضمنة الحالي، ثم
    يشير إلى إعداد `"allowlist"` الأكثر صرامة.

  </Accordion>
  <Accordion title="2. عمليات ترحيل مفاتيح الإعدادات القديمة">
    عندما تحتوي الإعدادات على مفاتيح مهملة، ترفض الأوامر الأخرى التشغيل وتطلب منك تشغيل `openclaw doctor`.

    سيقوم Doctor بما يلي:

    - شرح المفاتيح القديمة التي عثر عليها.
    - عرض الترحيل الذي طبقه.
    - إعادة كتابة `~/.openclaw/openclaw.json` بالمخطط المحدث.

    يرفض بدء تشغيل Gateway تنسيقات الإعدادات القديمة ويطلب منك تشغيل `openclaw doctor --fix`؛ ولا يعيد كتابة `openclaw.json` عند بدء التشغيل. تتولى `openclaw doctor --fix` أيضا عمليات ترحيل مخزن وظائف Cron.

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
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` القديمة → `talk.provider` + `talk.providers.<provider>`
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
    - بالنسبة إلى القنوات التي تحتوي على `accounts` مسماة لكن تبقى فيها قيم قناة على المستوى الأعلى لحساب واحد، انقل تلك القيم المخصصة للحساب إلى الحساب المرَقّى المختار لتلك القناة (`accounts.default` لمعظم القنوات؛ يمكن لـ Matrix الاحتفاظ بهدف مسمى/افتراضي مطابق موجود)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - أزل `agents.defaults.llm`؛ استخدم `models.providers.<id>.timeoutSeconds` لمهل انتظار المزوّد/النموذج البطيئة
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - أزل `browser.relayBindHost` (إعداد مرحّل الإضافة القديم)
    - `models.providers.*.api: "openai"` القديم → `"openai-completions"` (يتجاوز بدء تشغيل Gateway أيضًا المزوّدين الذين تكون قيمة `api` لديهم مضبوطة على قيمة تعداد مستقبلية أو غير معروفة بدلًا من الإخفاق بإغلاق صارم)

    تتضمن تحذيرات الفحص التشخيصي أيضًا إرشادات الحساب الافتراضي للقنوات متعددة الحسابات:

    - إذا تم تكوين إدخالين أو أكثر من `channels.<channel>.accounts` من دون `channels.<channel>.defaultAccount` أو `accounts.default`، يحذّر الفحص التشخيصي من أن توجيه الرجوع قد يختار حسابًا غير متوقع.
    - إذا كانت `channels.<channel>.defaultAccount` مضبوطة على معرّف حساب غير معروف، يحذّر الفحص التشخيصي ويسرد معرّفات الحسابات المكوّنة.

  </Accordion>
  <Accordion title="2b. تجاوزات مزوّد OpenCode">
    إذا أضفت `models.providers.opencode` أو `opencode-zen` أو `opencode-go` يدويًا، فإنه يتجاوز كتالوج OpenCode المدمج من `@mariozechner/pi-ai`. قد يفرض ذلك النماذج على API غير صحيح أو يصفّر التكاليف. يحذّر الفحص التشخيصي حتى تتمكن من إزالة التجاوز واستعادة توجيه API والتكاليف لكل نموذج.
  </Accordion>
  <Accordion title="2c. ترحيل المتصفح وجاهزية Chrome MCP">
    إذا كان إعداد المتصفح لديك لا يزال يشير إلى مسار إضافة Chrome المحذوف، يطبّعه الفحص التشخيصي إلى نموذج إرفاق Chrome MCP المحلي على المضيف الحالي:

    - يصبح `browser.profiles.*.driver: "extension"` هو `"existing-session"`
    - تتم إزالة `browser.relayBindHost`

    يدقق الفحص التشخيصي أيضًا مسار Chrome MCP المحلي على المضيف عند استخدام `defaultProfile: "user"` أو ملف تعريف `existing-session` مكوّن:

    - يتحقق مما إذا كان Google Chrome مثبتًا على المضيف نفسه لملفات التعريف الافتراضية ذات الاتصال التلقائي
    - يتحقق من إصدار Chrome المكتشف ويحذّر عندما يكون أقل من Chrome 144
    - يذكّرك بتمكين تصحيح الأخطاء عن بُعد في صفحة فحص المتصفح (على سبيل المثال `chrome://inspect/#remote-debugging` أو `brave://inspect/#remote-debugging` أو `edge://inspect/#remote-debugging`)

    لا يمكن للفحص التشخيصي تمكين الإعداد من جانب Chrome نيابة عنك. لا يزال Chrome MCP المحلي على المضيف يتطلب:

    - متصفحًا مبنيًا على Chromium بإصدار 144+ على مضيف Gateway/Node
    - تشغيل المتصفح محليًا
    - تمكين تصحيح الأخطاء عن بُعد في ذلك المتصفح
    - الموافقة على مطالبة موافقة الإرفاق الأولى في المتصفح

    الجاهزية هنا تتعلق فقط بمتطلبات الإرفاق المحلي. يحافظ existing-session على حدود مسار Chrome MCP الحالية؛ ولا تزال المسارات المتقدمة مثل `responsebody`، وتصدير PDF، واعتراض التنزيل، وإجراءات الدُفعات تتطلب متصفحًا مُدارًا أو ملف تعريف CDP خامًا.

    لا ينطبق هذا الفحص **على** Docker أو sandbox أو remote-browser أو تدفقات headless الأخرى. تستمر تلك التدفقات في استخدام CDP الخام.

  </Accordion>
  <Accordion title="2d. متطلبات OAuth TLS الأساسية">
    عند تكوين ملف تعريف OpenAI Codex OAuth، يفحص الفحص التشخيصي نقطة نهاية تفويض OpenAI للتحقق من أن حزمة Node/OpenSSL TLS المحلية يمكنها التحقق من سلسلة الشهادات. إذا فشل الفحص بسبب خطأ شهادة (على سبيل المثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` أو شهادة منتهية الصلاحية أو شهادة موقعة ذاتيًا)، يطبع الفحص التشخيصي إرشادات إصلاح خاصة بالمنصة. على macOS مع Node من Homebrew، يكون الإصلاح عادةً `brew postinstall ca-certificates`. مع `--deep`، يعمل الفحص حتى إذا كان Gateway سليمًا.
  </Accordion>
  <Accordion title="2e. تجاوزات مزوّد Codex OAuth">
    إذا كنت قد أضفت سابقًا إعدادات نقل OpenAI القديمة ضمن `models.providers.openai-codex`، فقد تحجب مسار مزوّد Codex OAuth المدمج الذي تستخدمه الإصدارات الأحدث تلقائيًا. يحذّر الفحص التشخيصي عندما يرى إعدادات النقل القديمة هذه بجانب Codex OAuth حتى تتمكن من إزالة تجاوز النقل القديم أو إعادة كتابته واستعادة سلوك التوجيه/الرجوع المدمج. لا تزال الوكلاء المخصصون والتجاوزات الخاصة بالترويسات فقط مدعومة ولا تطلق هذا التحذير.
  </Accordion>
  <Accordion title="2f. إصلاح مسار Codex">
    يتحقق الفحص التشخيصي من مراجع النماذج القديمة `openai-codex/*`. يستخدم توجيه حاضنة Codex الأصلية مراجع نماذج `openai/*` القياسية إضافة إلى `agentRuntime.id: "codex"` حتى تمر الدورة عبر حاضنة خادم تطبيق Codex بدلًا من مسار OpenClaw PI OpenAI.

    في وضع `--fix` / `--repair`، يعيد الفحص التشخيصي كتابة مراجع الوكيل الافتراضي ولكل وكيل المتأثرة، بما في ذلك النماذج الأساسية، والرجوعات، وتجاوزات Heartbeat/الوكيل الفرعي/Compaction، والخطافات، وتجاوزات نماذج القنوات، وحالة مسار الجلسة المحفوظة القديمة:

    - يصبح `openai-codex/gpt-*` هو `openai/gpt-*`.
    - يصبح وقت تشغيل الوكيل المطابق `agentRuntime.id: "codex"` فقط عندما يكون Codex مثبتًا ومفعّلًا ويساهم بحاضنة `codex` ولديه OAuth قابل للاستخدام.
    - خلاف ذلك يصبح وقت تشغيل الوكيل المطابق `agentRuntime.id: "pi"`.
    - يتم الحفاظ على قوائم رجوع النماذج الحالية مع إعادة كتابة إدخالاتها القديمة؛ وتنتقل إعدادات كل نموذج المنسوخة من المفتاح القديم إلى مفتاح `openai/*` القياسي.
    - يتم إصلاح `modelProvider`/`providerOverride` و`model`/`modelOverride` المحفوظة في الجلسة، وإشعارات الرجوع، وتثبيتات ملفات تعريف المصادقة، وتثبيتات حاضنة Codex عبر جميع مخازن جلسات الوكلاء المكتشفة.
    - يعني `/codex ...` "التحكم في محادثة Codex أصلية أو ربطها من الدردشة."
    - يعني `/acp ...` أو `runtime: "acp"` "استخدام محوّل ACP/acpx الخارجي."

  </Accordion>
  <Accordion title="2g. تنظيف مسار الجلسة">
    يفحص الفحص التشخيصي أيضًا مخازن جلسات الوكلاء المكتشفة بحثًا عن حالة مسار قديمة منشأة تلقائيًا بعد نقل النماذج المكوّنة أو وقت التشغيل بعيدًا عن مسار مملوك لـ Plugin مثل Codex.

    يمكن لـ `openclaw doctor --fix` مسح الحالة القديمة المنشأة تلقائيًا مثل تثبيتات النماذج `modelOverrideSource: "auto"`، وبيانات تعريف نموذج وقت التشغيل، ومعرّفات الحاضنة المثبتة، وروابط جلسات CLI، وتجاوزات ملفات تعريف المصادقة التلقائية عندما لا يكون مسارها المالك مكوّنًا بعد الآن. يتم الإبلاغ عن اختيارات نماذج الجلسة الصريحة الخاصة بالمستخدم أو القديمة للمراجعة اليدوية وتُترك دون تغيير؛ بدّلها باستخدام `/model ...` أو `/new` أو أعد ضبط الجلسة عندما لم يعد ذلك المسار مقصودًا.

  </Accordion>
  <Accordion title="3. ترحيلات الحالة القديمة (تخطيط القرص)">
    يمكن للفحص التشخيصي ترحيل التخطيطات الأقدم على القرص إلى البنية الحالية:

    - مخزن الجلسات + النصوص:
      - من `~/.openclaw/sessions/` إلى `~/.openclaw/agents/<agentId>/sessions/`
    - دليل الوكيل:
      - من `~/.openclaw/agent/` إلى `~/.openclaw/agents/<agentId>/agent/`
    - حالة مصادقة WhatsApp (Baileys):
      - من `~/.openclaw/credentials/*.json` القديمة (باستثناء `oauth.json`)
      - إلى `~/.openclaw/credentials/whatsapp/<accountId>/...` (معرّف الحساب الافتراضي: `default`)

    هذه الترحيلات تُبذل فيها أفضل الجهود وهي آمنة للتكرار؛ سيصدر الفحص التشخيصي تحذيرات عندما يترك أي مجلدات قديمة كنسخ احتياطية. يقوم Gateway/CLI أيضًا بترحيل الجلسات القديمة + دليل الوكيل تلقائيًا عند بدء التشغيل حتى تصل السجل/المصادقة/النماذج إلى مسار كل وكيل دون تشغيل يدوي للفحص التشخيصي. تقارن تسوية مزوّد Talk/خريطة المزوّد الآن بالمساواة البنيوية، لذا لم تعد الفروقات في ترتيب المفاتيح فقط تطلق تغييرات `doctor --fix` متكررة بلا أثر.

  </Accordion>
  <Accordion title="3a. ترحيلات بيان Plugin القديم">
    يفحص الفحص التشخيصي جميع بيانات Plugin المثبتة بحثًا عن مفاتيح القدرات القديمة على المستوى الأعلى (`speechProviders` و`realtimeTranscriptionProviders` و`realtimeVoiceProviders` و`mediaUnderstandingProviders` و`imageGenerationProviders` و`videoGenerationProviders` و`webFetchProviders` و`webSearchProviders`). عند العثور عليها، يعرض نقلها إلى كائن `contracts` وإعادة كتابة ملف البيان في مكانه. هذا الترحيل آمن للتكرار؛ إذا كان مفتاح `contracts` يحتوي بالفعل على القيم نفسها، تتم إزالة المفتاح القديم دون تكرار البيانات.
  </Accordion>
  <Accordion title="3b. ترحيلات مخزن Cron القديم">
    يتحقق الفحص التشخيصي أيضًا من مخزن مهام Cron (`~/.openclaw/cron/jobs.json` افتراضيًا، أو `cron.store` عند تجاوزه) بحثًا عن أشكال المهام القديمة التي لا يزال المجدول يقبلها للتوافق.

    تتضمن تنظيفات Cron الحالية:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - حقول الحمولة على المستوى الأعلى (`message` و`model` و`thinking` و...) → `payload`
    - حقول التسليم على المستوى الأعلى (`deliver` و`channel` و`to` و`provider` و...) → `delivery`
    - أسماء `provider` المستعارة للتسليم في الحمولة → `delivery.channel` صريح
    - مهام رجوع Webhook بسيطة قديمة `notify: true` → `delivery.mode="webhook"` صريح مع `delivery.to=cron.webhook`

    يُجري Doctor ترحيلًا تلقائيًا لمهام `notify: true` فقط عندما يستطيع فعل ذلك دون تغيير السلوك. إذا جمعت مهمة بين الرجوع الاحتياطي القديم للإشعارات ووضع تسليم غير Webhook موجود، يعرض Doctor تحذيرًا ويترك تلك المهمة للمراجعة اليدوية.

    على Linux، يعرض Doctor أيضًا تحذيرًا عندما لا يزال crontab الخاص بالمستخدم يستدعي `~/.openclaw/bin/ensure-whatsapp.sh` القديم. هذا السكربت المحلي للمضيف لا تتم صيانته بواسطة OpenClaw الحالي، ويمكنه كتابة رسائل `Gateway inactive` خاطئة إلى `~/.openclaw/logs/whatsapp-health.log` عندما يتعذر على cron الوصول إلى ناقل مستخدم systemd. أزِل إدخال crontab القديم باستخدام `crontab -e`؛ واستخدم `openclaw channels status --probe` و`openclaw doctor` و`openclaw gateway status` لفحوصات الصحة الحالية.

  </Accordion>
  <Accordion title="3c. تنظيف قفل الجلسة">
    يفحص Doctor كل دليل جلسة وكيل بحثًا عن ملفات قفل كتابة قديمة — وهي ملفات تُترك خلفًا عندما تنتهي جلسة بشكل غير طبيعي. لكل ملف قفل يعثر عليه، يبلّغ عن: المسار، وPID، وما إذا كان PID لا يزال نشطًا، وعمر القفل، وما إذا كان يُعد قديمًا (PID ميت أو أقدم من 30 دقيقة). في وضع `--fix` / `--repair` يزيل ملفات القفل القديمة تلقائيًا؛ وإلا فإنه يطبع ملاحظة ويطلب منك إعادة التشغيل مع `--fix`.
  </Accordion>
  <Accordion title="3d. إصلاح فرع سجل الجلسة">
    يفحص Doctor ملفات JSONL لجلسات الوكيل بحثًا عن شكل الفرع المكرر الذي أنشأه خطأ إعادة كتابة سجل المطالبة في 2026.4.24: دور مستخدم مهجور يحتوي على سياق وقت تشغيل داخلي من OpenClaw، مع فرع شقيق نشط يحتوي على مطالبة المستخدم المرئية نفسها. في وضع `--fix` / `--repair`، ينسخ Doctor كل ملف متأثر احتياطيًا بجانب الأصل ويعيد كتابة السجل إلى الفرع النشط، بحيث لا يرى سجل Gateway وقراء الذاكرة أدوارًا مكررة بعد الآن.
  </Accordion>
  <Accordion title="4. فحوصات سلامة الحالة (استمرارية الجلسات والتوجيه والسلامة)">
    دليل الحالة هو جذع الدماغ التشغيلي. إذا اختفى، فستفقد الجلسات وبيانات الاعتماد والسجلات والإعدادات (ما لم تكن لديك نسخ احتياطية في مكان آخر).

    يفحص Doctor ما يلي:

    - **دليل الحالة مفقود**: يحذّر من فقدان كارثي للحالة، ويطلب إعادة إنشاء الدليل، ويذكّرك بأنه لا يستطيع استرداد البيانات المفقودة.
    - **أذونات دليل الحالة**: يتحقق من قابلية الكتابة؛ ويعرض إصلاح الأذونات (ويُصدر تلميح `chown` عند اكتشاف عدم تطابق المالك/المجموعة).
    - **دليل حالة متزامن سحابيًا على macOS**: يحذّر عندما تُحل الحالة تحت iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) أو `~/Library/CloudStorage/...` لأن المسارات المدعومة بالمزامنة قد تسبب بطء إدخال/إخراج وسباقات قفل/مزامنة.
    - **دليل حالة SD أو eMMC على Linux**: يحذّر عندما تُحل الحالة إلى مصدر تركيب `mmcblk*`، لأن الإدخال/الإخراج العشوائي المدعوم بـ SD أو eMMC قد يكون أبطأ ويتآكل أسرع تحت كتابات الجلسات وبيانات الاعتماد.
    - **دلائل الجلسات مفقودة**: `sessions/` ودليل مخزن الجلسات مطلوبان لاستمرار السجل وتجنب أعطال `ENOENT`.
    - **عدم تطابق السجل**: يحذّر عندما تكون لإدخالات الجلسات الحديثة ملفات سجل مفقودة.
    - **جلسة رئيسية "JSONL بسطر واحد"**: يضع علامة عندما يحتوي السجل الرئيسي على سطر واحد فقط (السجل لا يتراكم).
    - **دلائل حالة متعددة**: يحذّر عندما توجد عدة مجلدات `~/.openclaw` عبر أدلة المنزل أو عندما يشير `OPENCLAW_STATE_DIR` إلى مكان آخر (قد ينقسم السجل بين التثبيتات).
    - **تذكير بالوضع البعيد**: إذا كان `gateway.mode=remote`، يذكّرك Doctor بتشغيله على المضيف البعيد (الحالة موجودة هناك).
    - **أذونات ملف الإعدادات**: يحذّر إذا كان `~/.openclaw/openclaw.json` قابلًا للقراءة من المجموعة/العالم ويعرض تشديده إلى `600`.

  </Accordion>
  <Accordion title="5. صحة مصادقة النموذج (انتهاء OAuth)">
    يفحص Doctor ملفات تعريف OAuth في مخزن المصادقة، ويحذّر عندما تكون الرموز على وشك الانتهاء/منتهية، ويمكنه تحديثها عندما يكون ذلك آمنًا. إذا كان ملف تعريف Anthropic OAuth/الرمز قديمًا، فإنه يقترح مفتاح Anthropic API أو مسار رمز إعداد Anthropic. لا تظهر مطالبات التحديث إلا عند التشغيل تفاعليًا (TTY)؛ ويتجاوز `--non-interactive` محاولات التحديث.

    عندما يفشل تحديث OAuth فشلًا دائمًا (على سبيل المثال `refresh_token_reused` أو `invalid_grant` أو مزوّد يطلب منك تسجيل الدخول مرة أخرى)، يبلّغ Doctor أن إعادة المصادقة مطلوبة ويطبع أمر `openclaw models auth login --provider ...` الدقيق لتشغيله.

    يبلّغ Doctor أيضًا عن ملفات تعريف المصادقة غير القابلة للاستخدام مؤقتًا بسبب:

    - فترات تهدئة قصيرة (حدود معدل/مهلات/إخفاقات مصادقة)
    - تعطيلات أطول (إخفاقات فوترة/رصيد)

  </Accordion>
  <Accordion title="6. التحقق من نموذج الخطافات">
    إذا تم تعيين `hooks.gmail.model`، يتحقق Doctor من مرجع النموذج مقابل الكتالوج وقائمة السماح ويحذّر عندما لا يمكن حله أو يكون غير مسموح به.
  </Accordion>
  <Accordion title="7. إصلاح صورة sandbox">
    عندما يكون sandboxing مفعّلًا، يفحص Doctor صور Docker ويعرض إنشاءها أو التبديل إلى الأسماء القديمة إذا كانت الصورة الحالية مفقودة.
  </Accordion>
  <Accordion title="7b. تنظيف تثبيت Plugin">
    يزيل Doctor حالة تجهيز تبعيات Plugin القديمة التي أنشأها OpenClaw في وضع `openclaw doctor --fix` / `openclaw doctor --repair`. يغطي ذلك جذور التبعيات المولّدة القديمة، وأدلة مرحلة التثبيت القديمة، والمخلفات المحلية للحزمة من كود إصلاح تبعيات Plugin المضمّن السابق، ونسخ npm المُدارة اليتيمة أو المستردة من Plugins `@openclaw/*` المضمّنة التي يمكن أن تحجب البيان المضمّن الحالي.

    يمكن لـ Doctor أيضًا إعادة تثبيت Plugins القابلة للتنزيل المفقودة عندما تشير الإعدادات إليها لكن سجل Plugin المحلي لا يستطيع العثور عليها. تشمل الأمثلة `plugins.entries` الفعلية، وإعدادات القنوات/المزوّدين/البحث المضبوطة، وأوقات تشغيل الوكلاء المضبوطة. أثناء تحديثات الحزم، يتجنب Doctor تشغيل إصلاح Plugin عبر مدير الحزم بينما يتم تبديل الحزمة الأساسية؛ شغّل `openclaw doctor --fix` مرة أخرى بعد التحديث إذا كان Plugin مضبوط لا يزال يحتاج إلى استرداد. لا يقوم بدء تشغيل Gateway وإعادة تحميل الإعدادات بتشغيل مديري الحزم؛ تظل تثبيتات Plugin عملًا صريحًا عبر Doctor/التثبيت/التحديث.

  </Accordion>
  <Accordion title="8. ترحيلات خدمة Gateway وتلميحات التنظيف">
    يكتشف Doctor خدمات Gateway القديمة (launchd/systemd/schtasks) ويعرض إزالتها وتثبيت خدمة OpenClaw باستخدام منفذ Gateway الحالي. يمكنه أيضًا فحص خدمات إضافية شبيهة بـ Gateway وطباعة تلميحات تنظيف. تُعد خدمات OpenClaw Gateway المسماة بملف تعريف من الدرجة الأولى ولا تُعلّم كـ "إضافية".

    على Linux، إذا كانت خدمة Gateway على مستوى المستخدم مفقودة لكن توجد خدمة OpenClaw Gateway على مستوى النظام، لا يثبت Doctor خدمة ثانية على مستوى المستخدم تلقائيًا. افحص باستخدام `openclaw gateway status --deep` أو `openclaw doctor --deep`، ثم أزل التكرار أو عيّن `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يكون مشرف نظام مالكًا لدورة حياة Gateway.

  </Accordion>
  <Accordion title="8b. ترحيل بدء تشغيل Matrix">
    عندما يكون لحساب قناة Matrix ترحيل حالة قديم معلق أو قابل للتنفيذ، ينشئ Doctor (في وضع `--fix` / `--repair`) لقطة ما قبل الترحيل ثم يشغّل خطوات الترحيل بأفضل جهد: ترحيل حالة Matrix القديمة وتحضير الحالة المشفرة القديمة. كلتا الخطوتين غير قاتلتين؛ تُسجّل الأخطاء ويستمر بدء التشغيل. في وضع القراءة فقط (`openclaw doctor` بدون `--fix`) يتم تجاوز هذا الفحص بالكامل.
  </Accordion>
  <Accordion title="8c. إقران الأجهزة وانحراف المصادقة">
    يفحص Doctor الآن حالة إقران الأجهزة كجزء من مرور الصحة العادي.

    ما يبلّغ عنه:

    - طلبات إقران أولية معلقة
    - ترقيات دور معلقة للأجهزة المقترنة مسبقًا
    - ترقيات نطاق معلقة للأجهزة المقترنة مسبقًا
    - إصلاحات عدم تطابق المفتاح العام حيث لا يزال معرّف الجهاز مطابقًا لكن هوية الجهاز لم تعد تطابق السجل المعتمد
    - سجلات مقترنة ينقصها رمز نشط لدور معتمد
    - رموز مقترنة تنحرف نطاقاتها خارج خط أساس الإقران المعتمد
    - إدخالات رموز جهاز مخزنة مؤقتًا محليًا للجهاز الحالي تسبق تدوير رمز من جهة Gateway أو تحمل بيانات وصفية قديمة للنطاق

    لا يوافق Doctor تلقائيًا على طلبات الإقران ولا يدوّر رموز الأجهزة تلقائيًا. بدلًا من ذلك، يطبع الخطوات التالية الدقيقة:

    - افحص الطلبات المعلقة باستخدام `openclaw devices list`
    - وافق على الطلب الدقيق باستخدام `openclaw devices approve <requestId>`
    - دوّر رمزًا جديدًا باستخدام `openclaw devices rotate --device <deviceId> --role <role>`
    - أزل سجلًا قديمًا وأعد الموافقة عليه باستخدام `openclaw devices remove <deviceId>`

    يغلق هذا الثغرة الشائعة "مقترن بالفعل لكن لا يزال يتلقى طلب إقران": يميّز Doctor الآن بين الإقران الأولي وترقيات الدور/النطاق المعلقة وانحراف الرمز/هوية الجهاز القديمة.

  </Accordion>
  <Accordion title="9. تحذيرات الأمان">
    يصدر Doctor تحذيرات عندما يكون مزوّد مفتوحًا للرسائل المباشرة بدون قائمة سماح، أو عندما تُضبط سياسة بطريقة خطرة.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    إذا كان يعمل كخدمة مستخدم systemd، يضمن Doctor تمكين linger بحيث يبقى Gateway حيًا بعد تسجيل الخروج.
  </Accordion>
  <Accordion title="11. حالة مساحة العمل (Skills وPlugins والدلائل القديمة)">
    يطبع Doctor ملخصًا لحالة مساحة العمل للوكيل الافتراضي:

    - **حالة Skills**: يحصي Skills المؤهلة، وذات المتطلبات المفقودة، والمحظورة بقائمة السماح.
    - **دلائل مساحة العمل القديمة**: يحذّر عندما توجد `~/openclaw` أو دلائل مساحة عمل قديمة أخرى إلى جانب مساحة العمل الحالية.
    - **حالة Plugin**: يحصي Plugins المفعّلة/المعطلة/ذات الأخطاء؛ ويسرد معرّفات Plugin لأي أخطاء؛ ويبلّغ عن قدرات Plugin الحزمة.
    - **تحذيرات توافق Plugin**: يضع علامة على Plugins التي لديها مشكلات توافق مع وقت التشغيل الحالي.
    - **تشخيصات Plugin**: يبرز أي تحذيرات أو أخطاء وقت تحميل يصدرها سجل Plugin.

  </Accordion>
  <Accordion title="11b. حجم ملف التمهيد">
    يفحص Doctor ما إذا كانت ملفات تمهيد مساحة العمل (على سبيل المثال `AGENTS.md` أو `CLAUDE.md` أو ملفات سياق محقونة أخرى) قريبة من ميزانية الأحرف المضبوطة أو تتجاوزها. يبلّغ لكل ملف عن عدد الأحرف الخام مقابل المحقونة، ونسبة الاقتطاع، وسبب الاقتطاع (`max/file` أو `max/total`)، وإجمالي الأحرف المحقونة كنسبة من الميزانية الإجمالية. عندما تكون الملفات مقتطعة أو قريبة من الحد، يطبع Doctor نصائح لضبط `agents.defaults.bootstrapMaxChars` و`agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. تنظيف Plugin قناة قديم">
    عندما يزيل `openclaw doctor --fix` Plugin قناة مفقودًا، فإنه يزيل أيضًا الإعداد المتدلي ذي نطاق القناة الذي كان يشير إلى ذلك Plugin: إدخالات `channels.<id>`، وأهداف Heartbeat التي سمّت القناة، وتجاوزات `agents.*.models["<channel>/*"]`. يمنع هذا حلقات تشغيل Gateway حيث اختفى وقت تشغيل القناة لكن الإعدادات لا تزال تطلب من Gateway الارتباط بها.
  </Accordion>
  <Accordion title="11c. إكمال shell">
    يفحص Doctor ما إذا كان إكمال علامة التبويب مثبتًا لـ shell الحالي (zsh أو bash أو fish أو PowerShell):

    - إذا كان ملف تعريف shell يستخدم نمط إكمال ديناميكيًا بطيئًا (`source <(openclaw completion ...)`)، يقوم Doctor بترقيته إلى متغير الملف المخبأ الأسرع.
    - إذا كان الإكمال مضبوطًا في ملف التعريف لكن ملف التخزين المؤقت مفقود، يعيد Doctor إنشاء التخزين المؤقت تلقائيًا.
    - إذا لم يكن أي إكمال مضبوطًا على الإطلاق، يطلب Doctor تثبيته (الوضع التفاعلي فقط؛ يتم تجاوزه مع `--non-interactive`).

    شغّل `openclaw completion --write-state` لإعادة إنشاء التخزين المؤقت يدويًا.

  </Accordion>
  <Accordion title="12. فحوصات مصادقة Gateway (الرمز المحلي)">
    يفحص Doctor جاهزية مصادقة رمز Gateway المحلي.

    - إذا كان وضع الرمز يحتاج إلى رمز ولا يوجد مصدر رمز، يعرض Doctor إنشاء واحد.
    - إذا كان `gateway.auth.token` مُدارًا بواسطة SecretRef لكنه غير متاح، يحذّر Doctor ولا يستبدله بنص صريح.
    - يفرض `openclaw doctor --generate-gateway-token` الإنشاء فقط عندما لا يكون هناك SecretRef رمز مضبوط.

  </Accordion>
  <Accordion title="12b. إصلاحات تراعي SecretRef للقراءة فقط">
    تحتاج بعض مسارات الإصلاح إلى فحص بيانات الاعتماد المكوّنة من دون إضعاف سلوك الفشل السريع في وقت التشغيل.

    - يستخدم `openclaw doctor --fix` الآن نموذج ملخص SecretRef للقراءة فقط نفسه الذي تستخدمه أوامر عائلة الحالة لإصلاحات الإعدادات الموجهة.
    - مثال: يحاول إصلاح `allowFrom` / `groupAllowFrom` `@username` في Telegram استخدام بيانات اعتماد البوت المكوّنة عند توفرها.
    - إذا كان رمز بوت Telegram مكوّنًا عبر SecretRef ولكنه غير متاح في مسار الأمر الحالي، يبلّغ doctor بأن بيانات الاعتماد مكوّنة لكنها غير متاحة ويتجاوز الحل التلقائي بدلًا من التعطل أو الإبلاغ خطأً عن الرمز على أنه مفقود.

  </Accordion>
  <Accordion title="13. فحص صحة Gateway + إعادة التشغيل">
    يشغّل doctor فحص صحة ويعرض إعادة تشغيل Gateway عندما يبدو غير سليم.
  </Accordion>
  <Accordion title="13b. جاهزية البحث في الذاكرة">
    يتحقق doctor مما إذا كان موفر تضمينات البحث في الذاكرة المكوّن جاهزًا للوكيل الافتراضي. يعتمد السلوك على الخلفية والموفر المكوّنين:

    - **خلفية QMD**: يتحقق مما إذا كان ملف `qmd` الثنائي متاحًا وقابلًا للتشغيل. إن لم يكن كذلك، يطبع إرشادات إصلاح تشمل حزمة npm وخيار مسار ثنائي يدوي.
    - **موفر محلي صريح**: يتحقق من وجود ملف نموذج محلي أو URL معروف لنموذج بعيد/قابل للتنزيل. إذا كان مفقودًا، يقترح التبديل إلى موفر بعيد.
    - **موفر بعيد صريح** (`openai`، `voyage`، إلخ): يتحقق من وجود مفتاح API في البيئة أو مخزن المصادقة. يطبع تلميحات إصلاح قابلة للتنفيذ إذا كان مفقودًا.
    - **موفر تلقائي**: يتحقق من توفر النموذج المحلي أولًا، ثم يجرّب كل موفر بعيد بترتيب الاختيار التلقائي.

    عندما تتوفر نتيجة مسبقة مخزنة لفحص Gateway (كان Gateway سليمًا وقت الفحص)، يقارن doctor نتيجتها مع الإعدادات المرئية عبر CLI ويشير إلى أي اختلاف. لا يبدأ doctor اختبار تضمين جديدًا في المسار الافتراضي؛ استخدم أمر حالة الذاكرة العميق عندما تريد فحصًا مباشرًا للموفر.

    استخدم `openclaw memory status --deep` للتحقق من جاهزية التضمينات في وقت التشغيل.

  </Accordion>
  <Accordion title="14. تحذيرات حالة القناة">
    إذا كان Gateway سليمًا، يشغّل doctor فحص حالة قناة ويبلّغ عن التحذيرات مع إصلاحات مقترحة.
  </Accordion>
  <Accordion title="15. تدقيق إعدادات المشرف + إصلاحها">
    يتحقق doctor من إعدادات المشرف المثبتة (launchd/systemd/schtasks) بحثًا عن القيم الافتراضية المفقودة أو القديمة (مثل اعتمادات systemd على network-online وتأخير إعادة التشغيل). عندما يجد عدم تطابق، يوصي بتحديث ويمكنه إعادة كتابة ملف الخدمة/المهمة إلى القيم الافتراضية الحالية.

    ملاحظات:

    - يطلب `openclaw doctor` التأكيد قبل إعادة كتابة إعدادات المشرف.
    - يقبل `openclaw doctor --yes` مطالبات الإصلاح الافتراضية.
    - يطبق `openclaw doctor --repair` الإصلاحات الموصى بها من دون مطالبات.
    - يستبدل `openclaw doctor --repair --force` إعدادات المشرف المخصصة.
    - يُبقي `OPENCLAW_SERVICE_REPAIR_POLICY=external` doctor في وضع القراءة فقط لدورة حياة خدمة Gateway. لا يزال يبلّغ عن صحة الخدمة ويشغّل الإصلاحات غير الخدمية، لكنه يتجاوز تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة، وإعادة كتابة إعدادات المشرف، وتنظيف الخدمات القديمة لأن مشرفًا خارجيًا يملك دورة الحياة تلك.
    - على Linux، لا يعيد doctor كتابة بيانات تعريف الأمر/نقطة الدخول عندما تكون وحدة Gateway المطابقة في systemd نشطة. كما يتجاهل الوحدات الإضافية غير القديمة وغير النشطة الشبيهة بـ Gateway أثناء فحص الخدمات المكررة حتى لا تنشئ ملفات الخدمات المصاحبة ضجيج تنظيف.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان `gateway.auth.token` مُدارًا عبر SecretRef، يتحقق تثبيت/إصلاح خدمة doctor من SecretRef لكنه لا يحفظ قيم الرمز النصي الصريح المحلولة في بيانات تعريف بيئة خدمة المشرف.
    - يكتشف doctor قيم بيئة الخدمة المُدارة المدعومة بـ `.env`/SecretRef التي ضمّنتها تثبيتات LaunchAgent أو systemd أو Windows Scheduled Task القديمة مضمنة، ويعيد كتابة بيانات تعريف الخدمة بحيث تُحمّل تلك القيم من مصدر وقت التشغيل بدلًا من تعريف المشرف.
    - يكتشف doctor عندما لا يزال أمر الخدمة يثبت `--port` قديمًا بعد تغيّر `gateway.port` ويعيد كتابة بيانات تعريف الخدمة إلى المنفذ الحالي.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef للرمز المكوّن غير محلول، يحظر doctor مسار التثبيت/الإصلاح مع إرشادات قابلة للتنفيذ.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين وكان `gateway.auth.mode` غير مضبوط، يحظر doctor التثبيت/الإصلاح حتى يتم ضبط النمط صراحةً.
    - بالنسبة إلى وحدات systemd الخاصة بمستخدم Linux، تشمل فحوصات انحراف رمز doctor الآن مصادر `Environment=` و`EnvironmentFile=` عند مقارنة بيانات تعريف مصادقة الخدمة.
    - ترفض إصلاحات خدمة doctor إعادة كتابة خدمة Gateway أو إيقافها أو إعادة تشغيلها من ملف OpenClaw ثنائي أقدم عندما تكون الإعدادات قد كُتبت آخر مرة بواسطة إصدار أحدث. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - يمكنك دائمًا فرض إعادة كتابة كاملة عبر `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. تشخيص وقت تشغيل Gateway والمنفذ">
    يفحص doctor وقت تشغيل الخدمة (PID، وآخر حالة خروج) ويحذر عندما تكون الخدمة مثبتة لكنها لا تعمل فعليًا. كما يتحقق من تعارضات المنافذ على منفذ Gateway (الافتراضي `18789`) ويبلّغ عن الأسباب المحتملة (Gateway يعمل بالفعل، نفق SSH).
  </Accordion>
  <Accordion title="17. أفضل ممارسات وقت تشغيل Gateway">
    يحذر doctor عندما تعمل خدمة Gateway على Bun أو مسار Node مُدار بإصدار (`nvm`، `fnm`، `volta`، `asdf`، إلخ). تتطلب قنوات WhatsApp + Telegram استخدام Node، ويمكن أن تتعطل مسارات مديري الإصدارات بعد الترقيات لأن الخدمة لا تحمّل تهيئة الصدفة لديك. يعرض doctor الترحيل إلى تثبيت Node على مستوى النظام عندما يكون متاحًا (Homebrew/apt/choco).

    تستخدم LaunchAgents في macOS المثبتة أو المُصلحة حديثًا PATH نظاميًا قياسيًا (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) بدلًا من نسخ PATH الخاص بالصدفة التفاعلية، لذلك لا تغيّر أدلة Volta وasdf وfnm وpnpm وغيرها من أدلة مديري الإصدارات أي عمليات Node فرعية يتم حلّها. لا تزال خدمات Linux تحتفظ بجذور البيئة الصريحة (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) وأدلة user-bin مستقرة، لكن أدلة الرجوع الاحتياطية المتوقعة لمديري الإصدارات لا تُكتب إلى PATH الخدمة إلا عندما تكون تلك الأدلة موجودة على القرص.

  </Accordion>
  <Accordion title="18. كتابة الإعدادات + بيانات تعريف المعالج">
    يحفظ doctor أي تغييرات في الإعدادات ويختم بيانات تعريف المعالج لتسجيل تشغيل doctor.
  </Accordion>
  <Accordion title="19. نصائح مساحة العمل (النسخ الاحتياطي + نظام الذاكرة)">
    يقترح doctor نظام ذاكرة لمساحة العمل عندما يكون مفقودًا ويطبع نصيحة نسخ احتياطي إذا لم تكن مساحة العمل تحت git بالفعل.

    راجع [/concepts/agent-workspace](/ar/concepts/agent-workspace) للحصول على دليل كامل لبنية مساحة العمل والنسخ الاحتياطي باستخدام git (يوصى بمستودع GitHub أو GitLab خاص).

  </Accordion>
</AccordionGroup>

## ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
