---
read_when:
    - إضافة ترحيلات التشخيص أو تعديلها
    - إدخال تغييرات كاسرة في التكوين
sidebarTitle: Doctor
summary: 'أمر doctor: فحوصات الصحة، وترحيلات الإعدادات، وخطوات الإصلاح'
title: التشخيص
x-i18n:
    generated_at: "2026-04-30T07:58:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: c27b8e85eb0a577e676f0e6e205262775ff37303453e64fc1bc2adaf8b51147c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` هي أداة الإصلاح + الترحيل لـ OpenClaw. تصلح الإعدادات/الحالة القديمة، وتتحقق من الصحة، وتوفر خطوات إصلاح قابلة للتنفيذ.

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

    قبول الإعدادات الافتراضية من دون مطالبة (بما في ذلك خطوات إصلاح إعادة التشغيل/الخدمة/العزل عند انطباقها).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    تطبيق الإصلاحات الموصى بها من دون مطالبة (الإصلاحات + عمليات إعادة التشغيل عندما يكون ذلك آمنا).

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

    التشغيل من دون مطالبات وتطبيق الترحيلات الآمنة فقط (تطبيع الإعدادات + نقل الحالة على القرص). يتخطى إجراءات إعادة التشغيل/الخدمة/العزل التي تتطلب تأكيدا بشريا. تعمل ترحيلات الحالة القديمة تلقائيا عند اكتشافها.

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
    - تحذيرات تجاوز مزود OpenCode ‏(`models.providers.opencode` / `models.providers.opencode-go`).
    - تحذيرات حجب OAuth الخاصة بـ Codex ‏(`models.providers.openai-codex`).
    - فحص متطلبات OAuth TLS المسبقة لملفات OAuth التعريفية الخاصة بـ OpenAI Codex.
    - ترحيل الحالة القديمة على القرص (الجلسات/دليل الوكيل/مصادقة WhatsApp).
    - ترحيل مفتاح عقد بيان Plugin القديم (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - ترحيل مخزن Cron القديم (`jobId`, `schedule.cron`, حقول التسليم/الحمولة ذات المستوى الأعلى، `provider` في الحمولة، مهام Webhook الاحتياطية البسيطة `notify: true`).
    - ترحيل سياسة تشغيل الوكيل القديمة إلى `agents.defaults.agentRuntime` و`agents.list[].agentRuntime`.
    - تنظيف إعدادات Plugin القديمة عند تمكين الإضافات؛ عند `plugins.enabled=false`، تعامل مراجع Plugin القديمة كإعدادات احتواء خاملة وتحفظ.

  </Accordion>
  <Accordion title="الحالة والسلامة">
    - فحص ملف قفل الجلسة وتنظيف الأقفال القديمة.
    - إصلاح نصوص الجلسات للفروع المكررة الخاصة بإعادة كتابة المطالبات التي أنشأتها إصدارات 2026.4.24 المتأثرة.
    - فحوصات سلامة الحالة والأذونات (الجلسات، النصوص، دليل الحالة).
    - فحوصات أذونات ملف الإعدادات (chmod 600) عند التشغيل محليا.
    - صحة مصادقة النماذج: يتحقق من انتهاء صلاحية OAuth، ويمكنه تحديث الرموز الموشكة على الانتهاء، ويبلغ عن حالات التهدئة/التعطيل لملف تعريف المصادقة.
    - اكتشاف دليل مساحة عمل إضافي (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway، والخدمات، والمشرفون">
    - إصلاح صورة العزل عند تمكين العزل.
    - ترحيل الخدمة القديمة واكتشاف Gateway إضافي.
    - ترحيل حالة قناة Matrix القديمة (في وضع `--fix` / `--repair`).
    - فحوصات تشغيل Gateway (الخدمة مثبتة لكنها لا تعمل؛ تسمية launchd المخزنة مؤقتا).
    - تحذيرات حالة القنوات (تستقصى من Gateway قيد التشغيل).
    - تدقيق إعدادات المشرف (launchd/systemd/schtasks) مع إصلاح اختياري.
    - تنظيف بيئة الوكيل المضمنة لخدمات Gateway التي التقطت قيم shell ‏`HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` أثناء التثبيت أو التحديث.
    - فحوصات أفضل ممارسات تشغيل Gateway ‏(Node مقابل Bun، ومسارات مدير الإصدارات).
    - تشخيصات تعارض منفذ Gateway (الافتراضي `18789`).

  </Accordion>
  <Accordion title="المصادقة، والأمان، والإقران">
    - تحذيرات أمان لسياسات الرسائل المباشرة المفتوحة.
    - فحوصات مصادقة Gateway لوضع الرمز المحلي (يعرض توليد رمز عند عدم وجود مصدر رمز؛ ولا يستبدل إعدادات SecretRef الخاصة بالرموز).
    - اكتشاف مشكلات إقران الأجهزة (طلبات الإقران الأولى المعلقة، وترقيات الدور/النطاق المعلقة، وانحراف ذاكرة التخزين المؤقت المحلية القديمة لرمز الجهاز، وانحراف مصادقة سجلات الإقران).

  </Accordion>
  <Accordion title="مساحة العمل وshell">
    - فحص systemd linger على Linux.
    - فحص حجم ملف تمهيد مساحة العمل (تحذيرات الاقتطاع/الاقتراب من الحد لملفات السياق).
    - فحص حالة إكمال shell والتثبيت/الترقية التلقائية.
    - فحص جاهزية مزود تضمين بحث الذاكرة (نموذج محلي، أو مفتاح API بعيد، أو ملف QMD ثنائي).
    - فحوصات تثبيت المصدر (عدم تطابق مساحة عمل pnpm، أصول واجهة المستخدم المفقودة، ملف tsx الثنائي المفقود).
    - كتابة الإعدادات المحدثة + بيانات معالج الإعداد.

  </Accordion>
</AccordionGroup>

## الردم وإعادة الضبط في واجهة Dreams

يتضمن مشهد Dreams في Control UI إجراءات **الردم**، و**إعادة الضبط**، و**مسح المثبتة** لسير عمل Dreaming المثبت. تستخدم هذه الإجراءات أساليب RPC بأسلوب Gateway doctor، لكنها **ليست** جزءا من إصلاح/ترحيل CLI الخاص بـ `openclaw doctor`.

ما تفعله:

- **الردم** يفحص ملفات `memory/YYYY-MM-DD.md` التاريخية في مساحة العمل النشطة، ويشغل تمريرة يوميات REM المثبتة، ويكتب إدخالات ردم قابلة للعكس في `DREAMS.md`.
- **إعادة الضبط** تزيل إدخالات يوميات الردم المعلمة فقط من `DREAMS.md`.
- **مسح المثبتة** يزيل فقط الإدخالات قصيرة الأمد المرحلية والمثبتة فقط التي جاءت من إعادة التشغيل التاريخية ولم تراكم بعد استدعاء حيا أو دعما يوميا.

ما **لا** تفعله بمفردها:

- لا تعدل `MEMORY.md`
- لا تشغل ترحيلات doctor الكاملة
- لا تضع المرشحات المثبتة تلقائيا في مخزن الترويج قصير الأمد الحي إلا إذا شغلت مسار CLI المرحلي صراحة أولا

إذا أردت أن يؤثر إعادة التشغيل التاريخية المثبتة في مسار الترويج العميق المعتاد، فاستخدم تدفق CLI بدلا من ذلك:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

يضع ذلك المرشحات المتينة المثبتة في مخزن Dreaming قصير الأمد مع إبقاء `DREAMS.md` كسطح للمراجعة.

## السلوك التفصيلي والمبررات

<AccordionGroup>
  <Accordion title="0. تحديث اختياري (تثبيتات git)">
    إذا كان هذا checkout من git وكان doctor يعمل تفاعليا، فإنه يعرض التحديث (fetch/rebase/build) قبل تشغيل doctor.
  </Accordion>
  <Accordion title="1. تطبيع الإعدادات">
    إذا احتوت الإعدادات على أشكال قيم قديمة (على سبيل المثال `messages.ackReaction` من دون تجاوز خاص بالقناة)، فإن doctor يطبعها إلى المخطط الحالي.

    يشمل ذلك حقول Talk المسطحة القديمة. إعداد Talk العام الحالي هو `talk.provider` + `talk.providers.<provider>`. يعيد Doctor كتابة الأشكال القديمة `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` إلى خريطة المزودين.

  </Accordion>
  <Accordion title="2. ترحيلات مفاتيح الإعدادات القديمة">
    عندما تحتوي الإعدادات على مفاتيح مهملة، ترفض الأوامر الأخرى التشغيل وتطلب منك تشغيل `openclaw doctor`.

    سيقوم Doctor بما يلي:

    - شرح مفاتيح الإعدادات القديمة التي عثر عليها.
    - عرض الترحيل الذي طبقه.
    - إعادة كتابة `~/.openclaw/openclaw.json` بالمخطط المحدث.

    يشغل Gateway أيضا ترحيلات doctor تلقائيا عند بدء التشغيل عندما يكتشف تنسيق إعدادات قديم، لذلك تصلح الإعدادات القديمة من دون تدخل يدوي. تتولى `openclaw doctor --fix` ترحيلات مخزن مهام Cron.

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
    - بالنسبة إلى القنوات التي تحتوي على `accounts` مسماة مع بقاء قيم قناة ذات مستوى أعلى لحساب واحد، انقل تلك القيم ذات نطاق الحساب إلى الحساب المرقى المختار لتلك القناة (`accounts.default` لمعظم القنوات؛ يمكن لـ Matrix الحفاظ على هدف مسمى/افتراضي مطابق موجود)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - إزالة `agents.defaults.llm`؛ استخدم `models.providers.<id>.timeoutSeconds` لمهلات المزود/النموذج البطيئة
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - إزالة `browser.relayBindHost` (إعداد ترحيل الإضافة القديم)
    - `models.providers.*.api: "openai"` القديمة → `"openai-completions"` (يتخطى بدء تشغيل Gateway أيضا المزودين الذين ضبطت قيمة `api` لديهم على قيمة enum مستقبلية أو غير معروفة بدلا من الفشل المغلق)

    تشمل تحذيرات Doctor أيضا إرشادات الحساب الافتراضي للقنوات متعددة الحسابات:

    - إذا أعد إدخالان أو أكثر من `channels.<channel>.accounts` من دون `channels.<channel>.defaultAccount` أو `accounts.default`، يحذر doctor من أن التوجيه الاحتياطي يمكن أن يختار حسابا غير متوقع.
    - إذا ضبط `channels.<channel>.defaultAccount` على معرف حساب غير معروف، يحذر doctor ويسرد معرفات الحسابات المكونة.

  </Accordion>
  <Accordion title="2b. تجاوزات مزوّد OpenCode">
    إذا أضفت `models.providers.opencode` أو `opencode-zen` أو `opencode-go` يدويًا، فإن ذلك يتجاوز كتالوج OpenCode المضمّن من `@mariozechner/pi-ai`. يمكن أن يفرض ذلك استخدام API خاطئ للنماذج أو يصفر التكاليف. يحذّر Doctor حتى تتمكن من إزالة التجاوز واستعادة توجيه API والتكاليف لكل نموذج.
  </Accordion>
  <Accordion title="2c. ترحيل المتصفح وجاهزية Chrome MCP">
    إذا كان تكوين المتصفح لديك لا يزال يشير إلى مسار إضافة Chrome المحذوف، فإن Doctor يطبّعه إلى نموذج إرفاق Chrome MCP المحلي الحالي على المضيف:

    - يتحول `browser.profiles.*.driver: "extension"` إلى `"existing-session"`
    - تتم إزالة `browser.relayBindHost`

    يراجع Doctor أيضًا مسار Chrome MCP المحلي على المضيف عند استخدام `defaultProfile: "user"` أو ملف تعريف `existing-session` مكوّن:

    - يتحقق مما إذا كان Google Chrome مثبتًا على المضيف نفسه لملفات تعريف الاتصال التلقائي الافتراضية
    - يتحقق من إصدار Chrome المكتشف ويحذّر عندما يكون أقل من Chrome 144
    - يذكّرك بتمكين التصحيح عن بُعد في صفحة فحص المتصفح (على سبيل المثال `chrome://inspect/#remote-debugging` أو `brave://inspect/#remote-debugging` أو `edge://inspect/#remote-debugging`)

    لا يستطيع Doctor تمكين إعداد Chrome من أجلك. لا يزال Chrome MCP المحلي على المضيف يتطلب:

    - متصفحًا مبنيًا على Chromium بالإصدار 144+ على مضيف Gateway/Node
    - تشغيل المتصفح محليًا
    - تمكين التصحيح عن بُعد في ذلك المتصفح
    - الموافقة على مطالبة موافقة الإرفاق الأولى في المتصفح

    الجاهزية هنا تتعلق فقط بمتطلبات الإرفاق المحلي. يحتفظ Existing-session بحدود مسار Chrome MCP الحالية؛ ولا تزال المسارات المتقدمة مثل `responsebody`، وتصدير PDF، واعتراض التنزيلات، وإجراءات الدُفعات تتطلب متصفحًا مُدارًا أو ملف تعريف CDP خامًا.

    لا ينطبق هذا الفحص على Docker أو sandbox أو remote-browser أو تدفقات headless الأخرى. تواصل هذه التدفقات استخدام CDP الخام.

  </Accordion>
  <Accordion title="2d. متطلبات OAuth TLS الأساسية">
    عند تكوين ملف تعريف OpenAI Codex OAuth، يفحص Doctor نقطة نهاية تفويض OpenAI للتحقق من أن مكدس TLS المحلي في Node/OpenSSL يستطيع التحقق من سلسلة الشهادات. إذا فشل الفحص بسبب خطأ في الشهادة (على سبيل المثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` أو شهادة منتهية الصلاحية أو شهادة موقعة ذاتيًا)، يطبع Doctor إرشادات إصلاح خاصة بالمنصة. على macOS مع Node من Homebrew، يكون الإصلاح عادةً `brew postinstall ca-certificates`. مع `--deep`، يعمل الفحص حتى إذا كان Gateway سليمًا.
  </Accordion>
  <Accordion title="2e. تجاوزات مزوّد Codex OAuth">
    إذا كنت قد أضفت سابقًا إعدادات نقل OpenAI القديمة ضمن `models.providers.openai-codex`، فقد تحجب مسار مزوّد Codex OAuth المضمّن الذي تستخدمه الإصدارات الأحدث تلقائيًا. يحذّر Doctor عندما يرى إعدادات النقل القديمة هذه بجانب Codex OAuth حتى تتمكن من إزالة أو إعادة كتابة تجاوز النقل القديم واستعادة سلوك التوجيه/الاحتياط المضمّن. لا تزال الوكلاء المخصصون وتجاوزات الرؤوس فقط مدعومة ولا تؤدي إلى هذا التحذير.
  </Accordion>
  <Accordion title="2f. تحذيرات مسار Plugin الخاص بـ Codex">
    عند تمكين Codex Plugin المضمّن، يتحقق Doctor أيضًا مما إذا كانت مراجع النماذج الأساسية `openai-codex/*` لا تزال تُحل عبر مشغّل PI الافتراضي. هذا المزيج صالح عندما تريد مصادقة Codex OAuth/الاشتراك عبر PI، لكن من السهل الخلط بينه وبين حزمة خادم التطبيق الأصلية في Codex. يحذّر Doctor ويشير إلى الشكل الصريح لخادم التطبيق: `openai/*` مع `agentRuntime.id: "codex"` أو `OPENCLAW_AGENT_RUNTIME=codex`.

    لا يصلح Doctor هذا تلقائيًا لأن كلا المسارين صالحان:

    - `openai-codex/*` + PI يعني "استخدم مصادقة Codex OAuth/الاشتراك عبر مشغّل OpenClaw العادي."
    - `openai/*` + `runtime: "codex"` يعني "شغّل الدور المضمّن عبر خادم تطبيق Codex الأصلي."
    - `/codex ...` يعني "تحكم في محادثة Codex أصلية أو اربطها من الدردشة."
    - `/acp ...` أو `runtime: "acp"` يعني "استخدم مهايئ ACP/acpx الخارجي."

    إذا ظهر التحذير، فاختر المسار الذي قصدته وعدّل التكوين يدويًا. أبقِ التحذير كما هو عندما يكون PI Codex OAuth مقصودًا.

  </Accordion>
  <Accordion title="3. ترحيلات الحالة القديمة (تخطيط القرص)">
    يستطيع Doctor ترحيل التخطيطات القديمة على القرص إلى البنية الحالية:

    - مخزن الجلسات والنصوص:
      - من `~/.openclaw/sessions/` إلى `~/.openclaw/agents/<agentId>/sessions/`
    - دليل الوكيل:
      - من `~/.openclaw/agent/` إلى `~/.openclaw/agents/<agentId>/agent/`
    - حالة مصادقة WhatsApp (Baileys):
      - من `~/.openclaw/credentials/*.json` القديم (باستثناء `oauth.json`)
      - إلى `~/.openclaw/credentials/whatsapp/<accountId>/...` (معرّف الحساب الافتراضي: `default`)

    هذه الترحيلات تُجرى بأفضل جهد ومقاومة للتكرار؛ سيصدر Doctor تحذيرات عندما يترك أي مجلدات قديمة كنسخ احتياطية. يقوم Gateway/CLI أيضًا بترحيل الجلسات القديمة ودليل الوكيل تلقائيًا عند بدء التشغيل حتى تستقر السجل/المصادقة/النماذج في المسار الخاص بكل وكيل دون تشغيل Doctor يدويًا. تتم هجرة مصادقة WhatsApp عمدًا عبر `openclaw doctor` فقط. تقارن تسوية مزوّد المحادثة/خريطة المزوّد الآن بالمساواة البنيوية، لذلك لم تعد الاختلافات التي تقتصر على ترتيب المفاتيح تؤدي إلى تكرار تغييرات `doctor --fix` بلا أثر.

  </Accordion>
  <Accordion title="3a. ترحيلات بيان Plugin القديمة">
    يفحص Doctor جميع بيانات Plugin المثبتة بحثًا عن مفاتيح قدرات مهملة في المستوى الأعلى (`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders`). عند العثور عليها، يعرض نقلها إلى كائن `contracts` وإعادة كتابة ملف البيان في مكانه. هذا الترحيل مقاوم للتكرار؛ إذا كان مفتاح `contracts` يحتوي بالفعل على القيم نفسها، تتم إزالة المفتاح القديم دون تكرار البيانات.
  </Accordion>
  <Accordion title="3b. ترحيلات مخزن Cron القديمة">
    يتحقق Doctor أيضًا من مخزن مهام Cron (`~/.openclaw/cron/jobs.json` افتراضيًا، أو `cron.store` عند تجاوزه) بحثًا عن أشكال مهام قديمة لا يزال المجدول يقبلها للتوافق.

    تشمل عمليات تنظيف Cron الحالية:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - حقول الحمولة في المستوى الأعلى (`message`، `model`، `thinking`، ...) → `payload`
    - حقول التسليم في المستوى الأعلى (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - أسماء التسليم البديلة `provider` في الحمولة → `delivery.channel` صريح
    - مهام Webhook احتياطية قديمة بسيطة `notify: true` → `delivery.mode="webhook"` صريح مع `delivery.to=cron.webhook`

    لا يرحّل Doctor تلقائيًا مهام `notify: true` إلا عندما يستطيع فعل ذلك دون تغيير السلوك. إذا جمعت مهمة ما بين احتياطي الإشعار القديم ووضع تسليم غير Webhook موجود، يحذّر Doctor ويترك تلك المهمة للمراجعة اليدوية.

  </Accordion>
  <Accordion title="3c. تنظيف أقفال الجلسات">
    يفحص Doctor كل دليل جلسات وكيل بحثًا عن ملفات أقفال كتابة قديمة — وهي ملفات تُترك عندما تنتهي جلسة على نحو غير طبيعي. لكل ملف قفل يعثر عليه، يبلّغ عن: المسار، وPID، وما إذا كان PID لا يزال حيًا، وعمر القفل، وما إذا كان يُعد قديمًا (PID ميت أو أقدم من 30 دقيقة). في وضع `--fix` / `--repair` يزيل ملفات القفل القديمة تلقائيًا؛ وإلا يطبع ملاحظة ويوجهك إلى إعادة التشغيل مع `--fix`.
  </Accordion>
  <Accordion title="3d. إصلاح فرع نص الجلسة">
    يفحص Doctor ملفات JSONL لجلسات الوكلاء بحثًا عن شكل الفرع المكرر الذي أنشأه خطأ إعادة كتابة نص المطالبة بتاريخ 2026.4.24: دور مستخدم متروك يتضمن سياق تشغيل OpenClaw داخليًا مع شقيق نشط يحتوي على مطالبة المستخدم المرئية نفسها. في وضع `--fix` / `--repair`، ينسخ Doctor كل ملف متأثر احتياطيًا بجانب الأصل ويعيد كتابة النص إلى الفرع النشط حتى لا يرى قارئو سجل Gateway والذاكرة أدوارًا مكررة بعد الآن.
  </Accordion>
  <Accordion title="4. فحوصات سلامة الحالة (استمرارية الجلسات، والتوجيه، والسلامة)">
    دليل الحالة هو الجذع التشغيلي للنظام. إذا اختفى، فستفقد الجلسات وبيانات الاعتماد والسجلات والتكوين (ما لم تكن لديك نسخ احتياطية في مكان آخر).

    يتحقق Doctor من:

    - **دليل الحالة مفقود**: يحذّر من فقدان كارثي للحالة، ويطلب إعادة إنشاء الدليل، ويذكّرك بأنه لا يستطيع استرداد البيانات المفقودة.
    - **أذونات دليل الحالة**: يتحقق من قابلية الكتابة؛ ويعرض إصلاح الأذونات (ويصدر تلميح `chown` عند اكتشاف عدم تطابق المالك/المجموعة).
    - **دليل حالة متزامن سحابيًا على macOS**: يحذّر عندما تُحل الحالة تحت iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) أو `~/Library/CloudStorage/...` لأن المسارات المدعومة بالمزامنة قد تسبب I/O أبطأ وتعارضات قفل/مزامنة.
    - **دليل حالة Linux على SD أو eMMC**: يحذّر عندما تُحل الحالة إلى مصدر تركيب `mmcblk*`، لأن I/O العشوائي المدعوم ببطاقة SD أو eMMC قد يكون أبطأ ويتآكل أسرع تحت كتابات الجلسات وبيانات الاعتماد.
    - **أدلة الجلسات مفقودة**: يلزم وجود `sessions/` ودليل مخزن الجلسات لاستمرار السجل وتجنب أعطال `ENOENT`.
    - **عدم تطابق النص**: يحذّر عندما تكون إدخالات الجلسات الحديثة تفتقد ملفات النص.
    - **الجلسة الرئيسية "JSONL بسطر واحد"**: يشير عندما يحتوي النص الرئيسي على سطر واحد فقط (السجل لا يتراكم).
    - **أدلة حالة متعددة**: يحذّر عندما توجد عدة مجلدات `~/.openclaw` عبر أدلة home أو عندما يشير `OPENCLAW_STATE_DIR` إلى مكان آخر (يمكن أن ينقسم السجل بين التثبيتات).
    - **تذكير الوضع البعيد**: إذا كان `gateway.mode=remote`، يذكّرك Doctor بتشغيله على المضيف البعيد (الحالة موجودة هناك).
    - **أذونات ملف التكوين**: يحذّر إذا كان `~/.openclaw/openclaw.json` قابلًا للقراءة من المجموعة/العالم ويعرض تضييقه إلى `600`.

  </Accordion>
  <Accordion title="5. صحة مصادقة النماذج (انتهاء صلاحية OAuth)">
    يفحص Doctor ملفات تعريف OAuth في مخزن المصادقة، ويحذّر عندما تكون الرموز على وشك الانتهاء أو منتهية الصلاحية، ويمكنه تحديثها عندما يكون ذلك آمنًا. إذا كان ملف تعريف Anthropic OAuth/الرمز قديمًا، يقترح مفتاح Anthropic API أو مسار رمز إعداد Anthropic. تظهر مطالبات التحديث فقط عند التشغيل تفاعليًا (TTY)؛ يتخطى `--non-interactive` محاولات التحديث.

    عندما يفشل تحديث OAuth بشكل دائم (على سبيل المثال `refresh_token_reused` أو `invalid_grant` أو يخبرك مزوّد بتسجيل الدخول مرة أخرى)، يبلّغ Doctor أن إعادة المصادقة مطلوبة ويطبع أمر `openclaw models auth login --provider ...` الدقيق لتشغيله.

    يبلّغ Doctor أيضًا عن ملفات تعريف المصادقة غير القابلة للاستخدام مؤقتًا بسبب:

    - فترات تهدئة قصيرة (حدود معدلات/مهلات/فشل مصادقة)
    - تعطيلات أطول (فشل فوترة/ائتمان)

  </Accordion>
  <Accordion title="6. التحقق من نموذج Hooks">
    إذا تم ضبط `hooks.gmail.model`، يتحقق Doctor من مرجع النموذج مقابل الكتالوج وقائمة السماح ويحذّر عندما لا يُحل أو يكون غير مسموح به.
  </Accordion>
  <Accordion title="7. إصلاح صورة Sandbox">
    عند تمكين Sandbox، يتحقق Doctor من صور Docker ويعرض بناءها أو التبديل إلى الأسماء القديمة إذا كانت الصورة الحالية مفقودة.
  </Accordion>
  <Accordion title="7b. تبعيات تشغيل Plugin المضمّنة">
    يتحقق Doctor من تبعيات التشغيل فقط لـ Plugins المضمّنة النشطة في التكوين الحالي أو الممكّنة افتراضيًا بواسطة بيانها المضمّن، على سبيل المثال `plugins.entries.discord.enabled: true` أو `channels.discord.enabled: true` القديم أو `models.providers.*` / مراجع نموذج الوكيل المكوّنة أو Plugin مضمّن مفعّل افتراضيًا دون ملكية مزوّد. إذا كان أي منها مفقودًا، يبلّغ Doctor عن الحزم ويثبتها في وضع `openclaw doctor --fix` / `openclaw doctor --repair`. لا تزال Plugins الخارجية تستخدم `openclaw plugins install` / `openclaw plugins update`؛ لا يثبّت Doctor التبعيات لمسارات Plugin عشوائية.

    أثناء إصلاح doctor، تعرض عمليات تثبيت npm لتبعيات وقت التشغيل المضمّنة تقدمًا عبر مؤشر دوران في جلسات TTY وتقدمًا دوريًا كسطور في المخرجات الممررة/بلا واجهة. يمكن لـ Gateway وCLI المحلي أيضًا إصلاح تبعيات وقت تشغيل Plugin المضمّن النشطة عند الطلب قبل استيراد Plugin مضمّن. تكون عمليات التثبيت هذه مقصورة على جذر تثبيت وقت تشغيل Plugin، وتعمل مع تعطيل السكربتات، ولا تكتب قفل حزمة، وتحميها قفلة جذر تثبيت بحيث لا تعدّل بدايات CLI أو Gateway المتزامنة شجرة `node_modules` نفسها في الوقت نفسه.

  </Accordion>
  <Accordion title="8. ترحيلات خدمة Gateway وتلميحات التنظيف">
    يكتشف doctor خدمات Gateway القديمة (launchd/systemd/schtasks) ويعرض إزالتها وتثبيت خدمة OpenClaw باستخدام منفذ Gateway الحالي. يمكنه أيضًا البحث عن خدمات إضافية شبيهة بـGateway وطباعة تلميحات تنظيف. تُعد خدمات Gateway الخاصة بـOpenClaw والمسمّاة حسب الملف الشخصي خدمات من الدرجة الأولى ولا تُعلّم بأنها "إضافية".

    على Linux، إذا كانت خدمة Gateway على مستوى المستخدم مفقودة ولكن توجد خدمة Gateway خاصة بـOpenClaw على مستوى النظام، فلا يثبّت doctor خدمة ثانية على مستوى المستخدم تلقائيًا. افحص باستخدام `openclaw gateway status --deep` أو `openclaw doctor --deep`، ثم أزل النسخة المكررة أو اضبط `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يكون مشرف نظام خارجي مالكًا لدورة حياة Gateway.

  </Accordion>
  <Accordion title="8b. ترحيل Startup Matrix">
    عندما يكون لحساب قناة Matrix ترحيل حالة قديمة معلق أو قابل للإجراء، ينشئ doctor (في وضع `--fix` / `--repair`) لقطة قبل الترحيل ثم يشغّل خطوات الترحيل بأفضل جهد: ترحيل حالة Matrix القديمة وتحضير الحالة المشفرة القديمة. كلتا الخطوتين غير قاتلتين؛ تُسجّل الأخطاء ويستمر بدء التشغيل. في وضع القراءة فقط (`openclaw doctor` دون `--fix`) يُتخطى هذا الفحص بالكامل.
  </Accordion>
  <Accordion title="8c. إقران الجهاز وانحراف المصادقة">
    يفحص doctor الآن حالة إقران الجهاز كجزء من تمرير السلامة المعتاد.

    ما يبلّغ عنه:

    - طلبات إقران أولية معلقة
    - ترقيات دور معلقة للأجهزة المقترنة بالفعل
    - ترقيات نطاق معلقة للأجهزة المقترنة بالفعل
    - إصلاحات عدم تطابق المفتاح العام عندما يظل معرّف الجهاز مطابقًا لكن هوية الجهاز لم تعد تطابق السجل المعتمد
    - سجلات مقترنة تفتقد رمزًا نشطًا لدور معتمد
    - رموز مقترنة انحرفت نطاقاتها خارج خط أساس الإقران المعتمد
    - إدخالات رموز جهاز مخزنة محليًا للجهاز الحالي تسبق تدوير رمز من جهة Gateway أو تحمل بيانات نطاق وصفية قديمة

    لا يعتمد doctor طلبات الإقران تلقائيًا ولا يدوّر رموز الأجهزة تلقائيًا. بل يطبع الخطوات التالية الدقيقة:

    - افحص الطلبات المعلقة باستخدام `openclaw devices list`
    - اعتمد الطلب المحدد باستخدام `openclaw devices approve <requestId>`
    - دوّر رمزًا جديدًا باستخدام `openclaw devices rotate --device <deviceId> --role <role>`
    - أزل سجلًا قديمًا وأعد اعتماده باستخدام `openclaw devices remove <deviceId>`

    يغلق هذا الثغرة الشائعة "مقترن بالفعل لكن ما زال يطلب الإقران": يميّز doctor الآن بين الإقران الأولي، وترقيات الدور/النطاق المعلقة، وانحراف الرمز/هوية الجهاز القديمة.

  </Accordion>
  <Accordion title="9. تحذيرات الأمان">
    يصدر doctor تحذيرات عندما يكون مزوّد مفتوحًا للرسائل المباشرة دون قائمة سماح، أو عندما تُضبط سياسة بطريقة خطرة.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    عند التشغيل كخدمة مستخدم systemd، يتأكد doctor من تمكين البقاء حتى يظل Gateway حيًا بعد تسجيل الخروج.
  </Accordion>
  <Accordion title="11. حالة مساحة العمل (Skills وplugins والأدلة القديمة)">
    يطبع doctor ملخصًا لحالة مساحة العمل للوكيل الافتراضي:

    - **حالة Skills**: يحسب Skills المؤهلة، وناقصة المتطلبات، والمحظورة بقائمة السماح.
    - **أدلة مساحة العمل القديمة**: يحذّر عندما توجد `~/openclaw` أو أدلة مساحة عمل قديمة أخرى بجانب مساحة العمل الحالية.
    - **حالة Plugin**: يحسب Plugins الممكّنة/المعطلة/ذات الأخطاء؛ ويسرد معرّفات Plugin لأي أخطاء؛ ويبلّغ عن قدرات Plugin الحزمة.
    - **تحذيرات توافق Plugin**: تضع علامة على Plugins التي لديها مشكلات توافق مع وقت التشغيل الحالي.
    - **تشخيصات Plugin**: تعرض أي تحذيرات أو أخطاء وقت تحميل صادرة من سجل Plugin.

  </Accordion>
  <Accordion title="11b. حجم ملف التمهيد">
    يتحقق doctor مما إذا كانت ملفات تمهيد مساحة العمل (مثل `AGENTS.md` أو `CLAUDE.md` أو ملفات سياق محقونة أخرى) قريبة من ميزانية الأحرف المضبوطة أو تتجاوزها. يبلّغ لكل ملف عن عدد الأحرف الخام مقابل المحقونة، ونسبة الاقتطاع، وسبب الاقتطاع (`max/file` أو `max/total`)، وإجمالي الأحرف المحقونة كنسبة من الميزانية الإجمالية. عندما تُقتطع الملفات أو تقترب من الحد، يطبع doctor تلميحات لضبط `agents.defaults.bootstrapMaxChars` و`agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. تنظيف Plugin قناة قديم">
    عندما يزيل `openclaw doctor --fix` Plugin قناة مفقودًا، فإنه يزيل أيضًا الإعدادات المتدلية ذات نطاق القناة التي كانت تشير إلى ذلك Plugin: إدخالات `channels.<id>`، وأهداف Heartbeat التي سمت القناة، وتجاوزات `agents.*.models["<channel>/*"]`. يمنع هذا حلقات إقلاع Gateway حيث يكون وقت تشغيل القناة قد اختفى لكن الإعدادات ما زالت تطلب من Gateway الارتباط به.
  </Accordion>
  <Accordion title="11c. إكمال الصدفة">
    يتحقق doctor مما إذا كان إكمال التبويب مثبتًا للصدفة الحالية (zsh أو bash أو fish أو PowerShell):

    - إذا كان ملف الصدفة الشخصي يستخدم نمط إكمال ديناميكيًا بطيئًا (`source <(openclaw completion ...)`)، يرقيه doctor إلى نسخة الملف المخزن مؤقتًا الأسرع.
    - إذا كان الإكمال مضبوطًا في الملف الشخصي لكن ملف التخزين المؤقت مفقود، يعيد doctor إنشاء التخزين المؤقت تلقائيًا.
    - إذا لم يكن أي إكمال مضبوطًا على الإطلاق، يطلب doctor تثبيته (في الوضع التفاعلي فقط؛ يُتخطى مع `--non-interactive`).

    شغّل `openclaw completion --write-state` لإعادة إنشاء التخزين المؤقت يدويًا.

  </Accordion>
  <Accordion title="12. فحوصات مصادقة Gateway (الرمز المحلي)">
    يتحقق doctor من جاهزية مصادقة رمز Gateway المحلي.

    - إذا كان وضع الرمز يحتاج إلى رمز ولا يوجد مصدر رمز، يعرض doctor إنشاء واحد.
    - إذا كان `gateway.auth.token` مُدارًا عبر SecretRef لكنه غير متاح، يحذّر doctor ولا يستبدله بنص صريح.
    - يفرض `openclaw doctor --generate-gateway-token` الإنشاء فقط عندما لا يكون SecretRef للرمز مضبوطًا.

  </Accordion>
  <Accordion title="12b. إصلاحات قراءة فقط واعية بـSecretRef">
    تحتاج بعض تدفقات الإصلاح إلى فحص بيانات الاعتماد المضبوطة دون إضعاف سلوك الفشل السريع في وقت التشغيل.

    - يستخدم `openclaw doctor --fix` الآن نموذج ملخص SecretRef للقراءة فقط نفسه الذي تستخدمه أوامر عائلة الحالة لإصلاحات الإعدادات المستهدفة.
    - مثال: يحاول إصلاح Telegram `allowFrom` / `groupAllowFrom` `@username` استخدام بيانات اعتماد bot المضبوطة عندما تكون متاحة.
    - إذا كان رمز bot في Telegram مضبوطًا عبر SecretRef لكنه غير متاح في مسار الأمر الحالي، يبلّغ doctor بأن بيانات الاعتماد مضبوطة-لكن-غير متاحة ويتخطى الحل التلقائي بدلًا من التعطل أو الإبلاغ خطأً بأن الرمز مفقود.

  </Accordion>
  <Accordion title="13. فحص صحة Gateway + إعادة التشغيل">
    يشغّل doctor فحص صحة ويعرض إعادة تشغيل Gateway عندما يبدو غير سليم.
  </Accordion>
  <Accordion title="13b. جاهزية بحث الذاكرة">
    يتحقق doctor مما إذا كان مزوّد تضمينات بحث الذاكرة المضبوط جاهزًا للوكيل الافتراضي. يعتمد السلوك على الخلفية والمزوّد المضبوطين:

    - **خلفية QMD**: يفحص ما إذا كان ثنائي `qmd` متاحًا وقابلًا للبدء. إذا لم يكن كذلك، يطبع إرشادات إصلاح تتضمن حزمة npm وخيار مسار ثنائي يدوي.
    - **مزوّد محلي صريح**: يتحقق من ملف نموذج محلي أو عنوان URL معروف لنموذج بعيد/قابل للتنزيل. إذا كان مفقودًا، يقترح التحول إلى مزوّد بعيد.
    - **مزوّد بعيد صريح** (`openai`، `voyage`، إلخ): يتحقق من وجود مفتاح API في البيئة أو مخزن المصادقة. يطبع تلميحات إصلاح قابلة للتنفيذ إذا كان مفقودًا.
    - **مزوّد تلقائي**: يتحقق من توفر النموذج المحلي أولًا، ثم يجرب كل مزوّد بعيد بترتيب الاختيار التلقائي.

    عندما تكون نتيجة فحص Gateway مخزنة مؤقتًا متاحة (كان Gateway سليمًا وقت الفحص)، يطابق doctor نتيجتها مع الإعدادات المرئية لـCLI ويشير إلى أي اختلاف. لا يبدأ doctor اختبار تضمين جديدًا في المسار الافتراضي؛ استخدم أمر حالة الذاكرة العميق عندما تريد فحص مزوّد مباشرًا.

    استخدم `openclaw memory status --deep` للتحقق من جاهزية التضمين في وقت التشغيل.

  </Accordion>
  <Accordion title="14. تحذيرات حالة القناة">
    إذا كان Gateway سليمًا، يشغّل doctor فحص حالة قناة ويبلّغ عن التحذيرات مع إصلاحات مقترحة.
  </Accordion>
  <Accordion title="15. تدقيق إعدادات المشرف + إصلاحها">
    يتحقق doctor من إعدادات المشرف المثبتة (launchd/systemd/schtasks) بحثًا عن افتراضيات مفقودة أو قديمة (مثل تبعيات systemd لـnetwork-online وتأخير إعادة التشغيل). عندما يجد عدم تطابق، يوصي بتحديث ويمكنه إعادة كتابة ملف الخدمة/المهمة إلى الافتراضيات الحالية.

    ملاحظات:

    - يطلب `openclaw doctor` التأكيد قبل إعادة كتابة إعدادات المشرف.
    - يقبل `openclaw doctor --yes` مطالبات الإصلاح الافتراضية.
    - يطبق `openclaw doctor --repair` الإصلاحات الموصى بها دون مطالبات.
    - يكتب `openclaw doctor --repair --force` فوق إعدادات المشرف المخصصة.
    - يُبقي `OPENCLAW_SERVICE_REPAIR_POLICY=external` doctor في وضع القراءة فقط لدورة حياة خدمة Gateway. ما زال يبلّغ عن صحة الخدمة ويشغّل الإصلاحات غير الخدمية، لكنه يتخطى تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة، وإعادة كتابة إعدادات المشرف، وتنظيف الخدمات القديمة لأن مشرفًا خارجيًا يملك تلك الدورة.
    - على Linux، لا يعيد doctor كتابة بيانات تعريف الأمر/نقطة الدخول بينما تكون وحدة Gateway المطابقة في systemd نشطة. كما يتجاهل وحدات إضافية غير قديمة وغير نشطة شبيهة بـGateway أثناء فحص الخدمة المكررة حتى لا تنشئ ملفات الخدمة المرافقة ضجيج تنظيف.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان `gateway.auth.token` مُدارًا عبر SecretRef، يتحقق تثبيت/إصلاح خدمة doctor من SecretRef لكنه لا يحفظ قيم الرمز ذات النص الصريح المحلولة في بيانات تعريف بيئة خدمة المشرف.
    - يكتشف doctor قيم بيئة الخدمة المُدارة والمدعومة بـ`.env`/SecretRef التي ضمّنتها تثبيتات LaunchAgent أو systemd أو Windows Scheduled Task القديمة بشكل مضمن، ويعيد كتابة بيانات تعريف الخدمة بحيث تُحمّل هذه القيم من مصدر وقت التشغيل بدلًا من تعريف المشرف.
    - يكتشف doctor عندما يظل أمر الخدمة يثبت `--port` قديمًا بعد تغيير `gateway.port` ويعيد كتابة بيانات تعريف الخدمة إلى المنفذ الحالي.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef للرمز المضبوط غير محلول، يحظر doctor مسار التثبيت/الإصلاح مع إرشادات قابلة للتنفيذ.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مضبوطين وكان `gateway.auth.mode` غير مضبوط، يحظر doctor التثبيت/الإصلاح حتى يُضبط الوضع صراحةً.
    - بالنسبة لوحدات user-systemd في Linux، تتضمن فحوصات انحراف الرمز في doctor الآن مصادر `Environment=` و`EnvironmentFile=` عند مقارنة بيانات تعريف مصادقة الخدمة.
    - ترفض إصلاحات خدمة doctor إعادة كتابة خدمة Gateway أو إيقافها أو إعادة تشغيلها من ثنائي OpenClaw أقدم عندما تكون الإعدادات قد كُتبت آخر مرة بواسطة إصدار أحدث. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - يمكنك دائمًا فرض إعادة كتابة كاملة عبر `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. وقت تشغيل Gateway وتشخيصات المنفذ">
    تفحص أداة الفحص وقت تشغيل الخدمة (PID، وحالة آخر خروج) وتحذر عندما تكون الخدمة مثبتة لكنها لا تعمل فعليًا. وتتحقق أيضًا من تعارضات المنافذ على منفذ Gateway (الافتراضي `18789`) وتبلغ عن الأسباب المحتملة (Gateway يعمل بالفعل، نفق SSH).
  </Accordion>
  <Accordion title="17. أفضل ممارسات وقت تشغيل Gateway">
    تحذر أداة الفحص عندما تعمل خدمة Gateway على Bun أو مسار Node مُدار بالإصدارات (`nvm`، `fnm`، `volta`، `asdf`، إلخ). تتطلب قنوات WhatsApp + Telegram استخدام Node، وقد تتعطل مسارات مديري الإصدارات بعد الترقيات لأن الخدمة لا تُحمّل تهيئة الصدفة الخاصة بك. تعرض أداة الفحص الترحيل إلى تثبيت Node على مستوى النظام عند توفره (Homebrew/apt/choco).

    تحتفظ الخدمات المثبتة أو المُصلحة حديثًا بجذور بيئة صريحة (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) وأدلة user-bin مستقرة، لكن أدلة الرجوع الاحتياطية المتوقعة لمديري الإصدارات لا تُكتب إلى PATH الخدمة إلا عندما تكون تلك الأدلة موجودة على القرص. يبقي ذلك PATH المشرف المُنشأ متوافقًا مع تدقيق PATH الأدنى نفسه الذي تجريه أداة الفحص لاحقًا.

  </Accordion>
  <Accordion title="18. كتابة الإعدادات + بيانات معالج الإعداد الوصفية">
    تحفظ أداة الفحص أي تغييرات في الإعدادات وتختم بيانات معالج الإعداد الوصفية لتسجيل تشغيل أداة الفحص.
  </Accordion>
  <Accordion title="19. نصائح مساحة العمل (النسخ الاحتياطي + نظام الذاكرة)">
    تقترح أداة الفحص نظام ذاكرة لمساحة العمل عند غيابه، وتطبع نصيحة نسخ احتياطي إذا لم تكن مساحة العمل ضمن git بالفعل.

    راجع [/concepts/agent-workspace](/ar/concepts/agent-workspace) للحصول على دليل كامل لبنية مساحة العمل والنسخ الاحتياطي باستخدام git (يوصى بمستودع GitHub أو GitLab خاص).

  </Accordion>
</AccordionGroup>

## ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [استكشاف مشكلات Gateway وإصلاحها](/ar/gateway/troubleshooting)
