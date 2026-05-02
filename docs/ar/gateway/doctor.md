---
read_when:
    - إضافة ترحيلات الفحص أو تعديلها
    - إدخال تغييرات كاسرة في الإعدادات
sidebarTitle: Doctor
summary: 'أمر Doctor: فحوصات الصحة، وترحيلات الإعدادات، وخطوات الإصلاح'
title: التشخيص
x-i18n:
    generated_at: "2026-05-02T07:27:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff4ab00fd6a11588abe790350fe139bc49f61e688bcd741389dd63732aa4430c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` هو أداة الإصلاح + الترحيل في OpenClaw. تصلح الإعدادات/الحالة القديمة، وتتحقق من السلامة، وتوفر خطوات إصلاح قابلة للتنفيذ.

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

    اقبل القيم الافتراضية دون مطالبة (بما في ذلك خطوات إصلاح إعادة التشغيل/الخدمة/الصندوق المعزول عند انطباقها).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    طبّق الإصلاحات الموصى بها دون مطالبة (الإصلاحات + عمليات إعادة التشغيل حيثما كان ذلك آمنا).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    طبّق الإصلاحات العنيفة أيضا (يستبدل إعدادات المشرف المخصصة).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    شغّل دون مطالبات وطبّق عمليات الترحيل الآمنة فقط (تطبيع الإعدادات + نقل الحالة على القرص). يتخطى إجراءات إعادة التشغيل/الخدمة/الصندوق المعزول التي تتطلب تأكيدا بشريا. تعمل عمليات ترحيل الحالة القديمة تلقائيا عند اكتشافها.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    افحص خدمات النظام بحثا عن تثبيتات Gateway إضافية (launchd/systemd/schtasks).

  </Tab>
</Tabs>

إذا كنت تريد مراجعة التغييرات قبل الكتابة، فافتح ملف الإعدادات أولا:

```bash
cat ~/.openclaw/openclaw.json
```

## ما الذي يفعله (ملخص)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - تحديث اختياري قبل التشغيل لتثبيتات git (تفاعلي فقط).
    - فحص حداثة بروتوكول الواجهة (يعيد بناء Control UI عندما يكون مخطط البروتوكول أحدث).
    - فحص السلامة + مطالبة إعادة التشغيل.
    - ملخص حالة Skills (مؤهل/مفقود/محظور) وحالة Plugin.

  </Accordion>
  <Accordion title="Config and migrations">
    - تطبيع الإعدادات للقيم القديمة.
    - ترحيل إعدادات Talk من حقول `talk.*` المسطحة القديمة إلى `talk.provider` + `talk.providers.<provider>`.
    - فحوصات ترحيل المتصفح لإعدادات إضافة Chrome القديمة وجاهزية Chrome MCP.
    - تحذيرات تجاوز موفر OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - تحذيرات حجب OAuth في Codex (`models.providers.openai-codex`).
    - فحص متطلبات OAuth TLS الأساسية لملفات OpenAI Codex OAuth.
    - تحذيرات قائمة السماح للـ Plugin/الأداة عندما يكون `plugins.allow` تقييديا بينما لا تزال سياسة الأدوات تطلب أحرف بدل أو أدوات مملوكة للـ Plugin.
    - ترحيل الحالة القديمة على القرص (الجلسات/مجلد الوكيل/مصادقة WhatsApp).
    - ترحيل مفاتيح عقد بيان Plugin القديمة (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - ترحيل مخزن Cron القديم (`jobId`, `schedule.cron`, حقول التسليم/الحمولة ذات المستوى الأعلى، `provider` في الحمولة، وظائف Webhook الاحتياطية البسيطة `notify: true`).
    - ترحيل سياسة تشغيل الوكيل القديمة إلى `agents.defaults.agentRuntime` و`agents.list[].agentRuntime`.
    - تنظيف إعدادات Plugin القديمة عندما تكون plugins مفعلة؛ عندما تكون `plugins.enabled=false`، تُعامل مراجع Plugin القديمة كإعدادات احتواء خاملة وتُحفظ.

  </Accordion>
  <Accordion title="State and integrity">
    - فحص ملف قفل الجلسة وتنظيف الأقفال القديمة.
    - إصلاح نصوص الجلسات للفروع المكررة لإعادة كتابة المطالبة التي أنشأتها إصدارات 2026.4.24 المتأثرة.
    - اكتشاف شواهد استرداد إعادة تشغيل الوكيل الفرعي العالقة، مع دعم `--fix` لمسح أعلام الاسترداد القديمة المجهضة حتى لا يستمر بدء التشغيل في معاملة الابن على أنه أُجهض بسبب إعادة التشغيل.
    - فحوصات سلامة الحالة والأذونات (الجلسات، النصوص، مجلد الحالة).
    - فحوصات أذونات ملف الإعدادات (chmod 600) عند التشغيل محليا.
    - سلامة مصادقة النموذج: تفحص انتهاء OAuth، ويمكنها تحديث الرموز التي تقترب من الانتهاء، وتبلغ عن حالات تهدئة/تعطيل ملف المصادقة.
    - اكتشاف مجلد مساحة عمل إضافي (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - إصلاح صورة الصندوق المعزول عند تفعيل العزل.
    - ترحيل الخدمة القديمة واكتشاف Gateway إضافي.
    - ترحيل حالة قناة Matrix القديمة (في وضع `--fix` / `--repair`).
    - فحوصات تشغيل Gateway (الخدمة مثبتة لكنها لا تعمل؛ تسمية launchd المخزنة مؤقتا).
    - تحذيرات حالة القناة (مفحوصة من Gateway قيد التشغيل).
    - تدقيق إعدادات المشرف (launchd/systemd/schtasks) مع إصلاح اختياري.
    - تنظيف بيئة الوكيل المضمن لخدمات Gateway التي التقطت قيم shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` أثناء التثبيت أو التحديث.
    - فحوصات أفضل ممارسات تشغيل Gateway (Node مقابل Bun، مسارات مدير الإصدارات).
    - تشخيصات تعارض منفذ Gateway (الافتراضي `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - تحذيرات أمنية لسياسات الرسائل المباشرة المفتوحة.
    - فحوصات مصادقة Gateway لوضع الرمز المحلي (تعرض توليد رمز عند عدم وجود مصدر رمز؛ لا تستبدل إعدادات token SecretRef).
    - اكتشاف مشكلات إقران الجهاز (طلبات الإقران الأولى المعلقة، ترقيات الدور/النطاق المعلقة، انحراف ذاكرة التخزين المؤقت المحلية القديمة لرمز الجهاز، وانحراف مصادقة سجل الإقران).

  </Accordion>
  <Accordion title="Workspace and shell">
    - فحص systemd linger على Linux.
    - فحص حجم ملف تمهيد مساحة العمل (تحذيرات الاقتطاع/الاقتراب من الحد لملفات السياق).
    - فحص حالة إكمال shell والتثبيت/الترقية التلقائية.
    - فحص جاهزية موفر تضمين بحث الذاكرة (نموذج محلي، مفتاح API بعيد، أو ملف QMD ثنائي).
    - فحوصات تثبيت المصدر (عدم تطابق مساحة عمل pnpm، أصول واجهة مفقودة، ملف tsx ثنائي مفقود).
    - يكتب الإعدادات المحدثة + بيانات معالج الإعداد الوصفية.

  </Accordion>
</AccordionGroup>

## ملء واجهة Dreams وإعادة ضبطها

يتضمن مشهد Dreams في Control UI إجراءات **Backfill** و**Reset** و**Clear Grounded** لسير عمل Dreaming المؤسس. تستخدم هذه الإجراءات طرق RPC بأسلوب Gateway doctor، لكنها **ليست** جزءا من إصلاح/ترحيل CLI في `openclaw doctor`.

ما الذي تفعله:

- **Backfill** يفحص ملفات `memory/YYYY-MM-DD.md` التاريخية في مساحة العمل النشطة، ويشغّل مرور يوميات REM المؤسس، ويكتب إدخالات ملء قابلة للعكس في `DREAMS.md`.
- **Reset** يزيل إدخالات يوميات الملء المحددة فقط من `DREAMS.md`.
- **Clear Grounded** يزيل فقط إدخالات المدى القصير المؤقتة والمؤسسة فقط التي جاءت من إعادة التشغيل التاريخية ولم تراكم بعد استدعاء حيا أو دعما يوميا.

ما الذي **لا** تفعله وحدها:

- لا تعدّل `MEMORY.md`
- لا تشغّل عمليات ترحيل doctor كاملة
- لا تضيف المرشحين المؤسسين تلقائيا إلى مخزن الترقية الحي قصير المدى إلا إذا شغّلت مسار CLI المؤقت صراحة أولا

إذا أردت أن تؤثر إعادة التشغيل التاريخية المؤسسة في مسار الترقية العميق العادي، فاستخدم تدفق CLI بدلا من ذلك:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

يضيف ذلك المرشحين الدائمين المؤسسين إلى مخزن Dreaming قصير المدى مع إبقاء `DREAMS.md` كسطح للمراجعة.

## السلوك التفصيلي والمبررات

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    إذا كان هذا checkout من git وكان doctor يعمل تفاعليا، فإنه يعرض التحديث (fetch/rebase/build) قبل تشغيل doctor.
  </Accordion>
  <Accordion title="1. Config normalization">
    إذا كانت الإعدادات تحتوي على أشكال قيم قديمة (على سبيل المثال `messages.ackReaction` دون تجاوز خاص بالقناة)، فإن doctor يطبعها ضمن المخطط الحالي.

    يشمل ذلك حقول Talk المسطحة القديمة. إعداد Talk العام الحالي هو `talk.provider` + `talk.providers.<provider>`. يعيد Doctor كتابة أشكال `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` القديمة إلى خريطة الموفر.

    يحذر Doctor أيضا عندما يكون `plugins.allow` غير فارغ وتستخدم سياسة الأدوات
    أحرف بدل أو إدخالات أدوات مملوكة للـ Plugin. يطابق `tools.allow: ["*"]` فقط الأدوات
    من plugins التي تُحمّل فعليا؛ ولا يتجاوز قائمة السماح الحصرية للـ Plugin.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    عندما تحتوي الإعدادات على مفاتيح مهملة، ترفض الأوامر الأخرى التشغيل وتطلب منك تشغيل `openclaw doctor`.

    سيقوم Doctor بما يلي:

    - شرح المفاتيح القديمة التي عُثر عليها.
    - عرض الترحيل الذي طبّقه.
    - إعادة كتابة `~/.openclaw/openclaw.json` بالمخطط المحدث.

    يشغّل Gateway أيضا عمليات ترحيل doctor تلقائيا عند بدء التشغيل عندما يكتشف تنسيق إعدادات قديم، لذلك تُصلح الإعدادات القديمة دون تدخل يدوي. يتولى `openclaw doctor --fix` عمليات ترحيل مخزن وظائف Cron.

    عمليات الترحيل الحالية:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` في المستوى الأعلى
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - الإعدادات القديمة `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
    - بالنسبة إلى القنوات التي تحتوي على `accounts` مسماة ولكن لا تزال لديها قيم قناة على مستوى أعلى لحساب واحد، انقل تلك القيم المحددة بنطاق الحساب إلى الحساب المُرقّى المختار لتلك القناة (`accounts.default` لمعظم القنوات؛ يمكن لـ Matrix الحفاظ على هدف مسمى/افتراضي مطابق موجود)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - أزِل `agents.defaults.llm`؛ استخدم `models.providers.<id>.timeoutSeconds` لمهل انتهاء مزود/نموذج بطيئة
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - أزِل `browser.relayBindHost` (إعداد ترحيل Plugin قديم)
    - الإعداد القديم `models.providers.*.api: "openai"` → `"openai-completions"` (يتخطى بدء Gateway أيضًا المزودين الذين عُيّنت قيمة `api` لديهم إلى قيمة تعداد مستقبلية أو غير معروفة بدلًا من الإخفاق بالإغلاق)

    تتضمن تحذيرات Doctor أيضًا إرشادات الحساب الافتراضي لقنوات متعددة الحسابات:

    - إذا ضُبط إدخالان أو أكثر من `channels.<channel>.accounts` بدون `channels.<channel>.defaultAccount` أو `accounts.default`، يحذر Doctor من أن توجيه الرجوع الاحتياطي قد يختار حسابًا غير متوقع.
    - إذا عُيّن `channels.<channel>.defaultAccount` إلى معرّف حساب غير معروف، يحذر Doctor ويسرد معرّفات الحسابات المضبوطة.

  </Accordion>
  <Accordion title="2b. تجاوزات مزود OpenCode">
    إذا أضفت `models.providers.opencode` أو `opencode-zen` أو `opencode-go` يدويًا، فإنه يتجاوز كتالوج OpenCode المدمج من `@mariozechner/pi-ai`. يمكن لذلك إجبار النماذج على API خاطئ أو تصفير التكاليف. يحذر Doctor حتى تتمكن من إزالة التجاوز واستعادة توجيه API والتكاليف لكل نموذج.
  </Accordion>
  <Accordion title="2c. ترحيل المتصفح وجاهزية Chrome MCP">
    إذا كان إعداد المتصفح لديك لا يزال يشير إلى مسار إضافة Chrome المحذوف، فإن Doctor يطبّعه إلى نموذج إرفاق Chrome MCP المحلي للمضيف الحالي:

    - يصبح `browser.profiles.*.driver: "extension"` هو `"existing-session"`
    - يُزال `browser.relayBindHost`

    يدقق Doctor أيضًا مسار Chrome MCP المحلي للمضيف عندما تستخدم `defaultProfile: "user"` أو ملف تعريف `existing-session` مضبوطًا:

    - يتحقق مما إذا كان Google Chrome مثبتًا على المضيف نفسه لملفات تعريف الاتصال التلقائي الافتراضية
    - يتحقق من إصدار Chrome المكتشف ويحذر عندما يكون أقل من Chrome 144
    - يذكّرك بتمكين تصحيح الأخطاء عن بُعد في صفحة فحص المتصفح (على سبيل المثال `chrome://inspect/#remote-debugging` أو `brave://inspect/#remote-debugging` أو `edge://inspect/#remote-debugging`)

    لا يستطيع Doctor تمكين الإعداد من جهة Chrome نيابةً عنك. لا يزال Chrome MCP المحلي للمضيف يتطلب:

    - متصفحًا مبنيًا على Chromium بإصدار 144+ على مضيف gateway/node
    - تشغيل المتصفح محليًا
    - تمكين تصحيح الأخطاء عن بُعد في ذلك المتصفح
    - الموافقة على مطالبة موافقة الإرفاق الأولى في المتصفح

    الجاهزية هنا تتعلق فقط بمتطلبات الإرفاق المحلي. يحافظ Existing-session على حدود مسار Chrome MCP الحالية؛ لا تزال المسارات المتقدمة مثل `responsebody` وتصدير PDF واعتراض التنزيل والإجراءات المجمعة تتطلب متصفحًا مُدارًا أو ملف تعريف CDP خامًا.

    لا ينطبق هذا الفحص **على** Docker أو sandbox أو remote-browser أو تدفقات headless الأخرى. تستمر تلك في استخدام CDP خام.

  </Accordion>
  <Accordion title="2d. متطلبات OAuth TLS الأساسية">
    عندما يُضبط ملف تعريف OpenAI Codex OAuth، يفحص Doctor نقطة نهاية تفويض OpenAI للتحقق من أن مكدس Node/OpenSSL TLS المحلي يمكنه التحقق من سلسلة الشهادات. إذا فشل الفحص بخطأ شهادة (مثل `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` أو شهادة منتهية الصلاحية أو شهادة موقعة ذاتيًا)، يطبع Doctor إرشادات إصلاح خاصة بالمنصة. على macOS مع Homebrew Node، يكون الإصلاح عادةً `brew postinstall ca-certificates`. مع `--deep`، يعمل الفحص حتى إذا كان Gateway سليمًا.
  </Accordion>
  <Accordion title="2e. تجاوزات مزود Codex OAuth">
    إذا كنت قد أضفت سابقًا إعدادات نقل OpenAI قديمة تحت `models.providers.openai-codex`، فقد تحجب مسار مزود Codex OAuth المدمج الذي تستخدمه الإصدارات الأحدث تلقائيًا. يحذر Doctor عندما يرى إعدادات النقل القديمة هذه بجانب Codex OAuth حتى تتمكن من إزالة أو إعادة كتابة تجاوز النقل القديم واستعادة سلوك التوجيه/الرجوع الاحتياطي المدمج. لا تزال الوكلاء المخصصون والتجاوزات القائمة على الرؤوس فقط مدعومة ولا تُطلق هذا التحذير.
  </Accordion>
  <Accordion title="2f. تحذيرات مسار Codex plugin">
    عندما يكون Codex plugin المضمن ممكّنًا، يتحقق Doctor أيضًا مما إذا كانت مراجع النموذج الأساسية `openai-codex/*` لا تزال تُحل عبر مشغل PI الافتراضي. تكون هذه التركيبة صالحة عندما تريد مصادقة Codex OAuth/اشتراك عبر PI، لكنها سهلة الالتباس مع حزمة app-server الأصلية لـ Codex. يحذر Doctor ويشير إلى الشكل الصريح لـ app-server: `openai/*` بالإضافة إلى `agentRuntime.id: "codex"` أو `OPENCLAW_AGENT_RUNTIME=codex`.

    لا يصلح Doctor هذا تلقائيًا لأن كلا المسارين صالحان:

    - `openai-codex/*` + PI تعني "استخدم مصادقة Codex OAuth/اشتراك عبر مشغل OpenClaw العادي."
    - `openai/*` + `agentRuntime.id: "codex"` تعني "شغّل الدور المدمج عبر app-server الأصلي لـ Codex."
    - `/codex ...` تعني "تحكم في محادثة Codex أصلية أو اربطها من الدردشة."
    - `/acp ...` أو `runtime: "acp"` تعني "استخدم محول ACP/acpx الخارجي."

    إذا ظهر التحذير، فاختر المسار الذي قصدته وعدّل الإعداد يدويًا. أبقِ التحذير كما هو عندما يكون PI Codex OAuth مقصودًا.

  </Accordion>
  <Accordion title="3. عمليات ترحيل الحالة القديمة (تخطيط القرص)">
    يمكن لـ Doctor ترحيل التخطيطات القديمة على القرص إلى البنية الحالية:

    - مخزن الجلسات + النصوص:
      - من `~/.openclaw/sessions/` إلى `~/.openclaw/agents/<agentId>/sessions/`
    - دليل الوكيل:
      - من `~/.openclaw/agent/` إلى `~/.openclaw/agents/<agentId>/agent/`
    - حالة مصادقة WhatsApp (Baileys):
      - من `~/.openclaw/credentials/*.json` القديم (باستثناء `oauth.json`)
      - إلى `~/.openclaw/credentials/whatsapp/<accountId>/...` (معرّف الحساب الافتراضي: `default`)

    هذه الترحيلات تبذل أفضل جهد وهي idempotent؛ سيصدر Doctor تحذيرات عندما يترك أي مجلدات قديمة كنسخ احتياطية. يقوم Gateway/CLI أيضًا بترحيل الجلسات القديمة ودليل الوكيل تلقائيًا عند بدء التشغيل بحيث يستقر السجل/المصادقة/النماذج في مسار كل وكيل دون تشغيل Doctor يدويًا. تقصد OpenClaw ترحيل مصادقة WhatsApp فقط عبر `openclaw doctor`. تقارن تسوية مزود talk/خريطة المزود الآن بالمساواة البنيوية، لذا لم تعد الفروق التي تقتصر على ترتيب المفاتيح تطلق تغييرات `doctor --fix` متكررة بلا أثر.

  </Accordion>
  <Accordion title="3a. عمليات ترحيل بيان plugin القديمة">
    يفحص Doctor كل بيانات plugins المثبتة بحثًا عن مفاتيح إمكانات قديمة في المستوى الأعلى (`speechProviders` و`realtimeTranscriptionProviders` و`realtimeVoiceProviders` و`mediaUnderstandingProviders` و`imageGenerationProviders` و`videoGenerationProviders` و`webFetchProviders` و`webSearchProviders`). عند العثور عليها، يعرض نقلها إلى كائن `contracts` وإعادة كتابة ملف البيان في مكانه. هذا الترحيل idempotent؛ إذا كان مفتاح `contracts` يحتوي بالفعل على القيم نفسها، يُزال المفتاح القديم دون تكرار البيانات.
  </Accordion>
  <Accordion title="3b. عمليات ترحيل مخزن Cron القديمة">
    يتحقق Doctor أيضًا من مخزن وظائف Cron (`~/.openclaw/cron/jobs.json` افتراضيًا، أو `cron.store` عند تجاوزه) بحثًا عن أشكال وظائف قديمة لا يزال المجدول يقبلها للتوافق.

    تشمل عمليات تنظيف Cron الحالية:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - حقول الحمولة في المستوى الأعلى (`message` و`model` و`thinking` و...) → `payload`
    - حقول التسليم في المستوى الأعلى (`deliver` و`channel` و`to` و`provider` و...) → `delivery`
    - أسماء تسليم `provider` المستعارة في الحمولة → `delivery.channel` صريح
    - وظائف رجوع احتياطي Webhook بسيطة قديمة `notify: true` → `delivery.mode="webhook"` صريح مع `delivery.to=cron.webhook`

    لا يرحّل Doctor وظائف `notify: true` تلقائيًا إلا عندما يستطيع ذلك دون تغيير السلوك. إذا جمعت وظيفة رجوع احتياطي notify قديمًا مع وضع تسليم غير Webhook موجود، يحذر Doctor ويترك تلك الوظيفة للمراجعة اليدوية.

    على Linux، يحذر Doctor أيضًا عندما لا يزال crontab الخاص بالمستخدم يستدعي `~/.openclaw/bin/ensure-whatsapp.sh` القديم. لا يُصان هذا السكربت المحلي للمضيف بواسطة OpenClaw الحالي ويمكنه كتابة رسائل `Gateway inactive` خاطئة إلى `~/.openclaw/logs/whatsapp-health.log` عندما لا يستطيع Cron الوصول إلى ناقل مستخدم systemd. أزِل إدخال crontab القديم باستخدام `crontab -e`؛ واستخدم `openclaw channels status --probe` و`openclaw doctor` و`openclaw gateway status` لفحوصات السلامة الحالية.

  </Accordion>
  <Accordion title="3c. تنظيف أقفال الجلسات">
    تفحص أداة الفحص كل دليل جلسة وكيل بحثا عن ملفات أقفال الكتابة القديمة — وهي الملفات التي تُترك خلفها عندما تخرج جلسة بشكل غير طبيعي. لكل ملف قفل يتم العثور عليه، تعرض: المسار، وPID، وما إذا كان PID لا يزال حيا، وعمر القفل، وما إذا كان يُعد قديما (PID ميت أو أقدم من 30 دقيقة). في وضع `--fix` / `--repair` تزيل ملفات الأقفال القديمة تلقائيا؛ وإلا فتطبع ملاحظة وتطلب منك إعادة التشغيل مع `--fix`.
  </Accordion>
  <Accordion title="3d. إصلاح فرع نص جلسة الحوار">
    تفحص أداة الفحص ملفات JSONL الخاصة بجلسات الوكيل بحثا عن شكل الفرع المكرر الذي أنشأه خطأ إعادة كتابة نص الموجه في 2026.4.24: دور مستخدم مهجور يتضمن سياق تشغيل داخلي من OpenClaw مع فرع شقيق نشط يحتوي على موجه المستخدم المرئي نفسه. في وضع `--fix` / `--repair`، تنسخ أداة الفحص كل ملف متأثر احتياطيا بجانب الأصل وتعيد كتابة نص الجلسة إلى الفرع النشط حتى لا يرى قارئو سجل Gateway والذاكرة أدوارا مكررة.
  </Accordion>
  <Accordion title="4. فحوصات سلامة الحالة (استمرارية الجلسات، والتوجيه، والسلامة)">
    دليل الحالة هو جذع الدماغ التشغيلي. إذا اختفى، فستفقد الجلسات وبيانات الاعتماد والسجلات والإعدادات (ما لم تكن لديك نسخ احتياطية في مكان آخر).

    تتحقق أداة الفحص مما يلي:

    - **دليل الحالة مفقود**: تحذر من فقدان كارثي للحالة، وتطلب إعادة إنشاء الدليل، وتذكرك بأنها لا تستطيع استرداد البيانات المفقودة.
    - **أذونات دليل الحالة**: تتحقق من قابلية الكتابة؛ وتعرض إصلاح الأذونات (وتصدر تلميح `chown` عند اكتشاف عدم تطابق المالك/المجموعة).
    - **دليل حالة متزامن مع السحابة على macOS**: تحذر عندما تُحل الحالة ضمن iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) أو `~/Library/CloudStorage/...` لأن المسارات المدعومة بالمزامنة قد تسبب إدخالا/إخراجا أبطأ وتسابقات في القفل/المزامنة.
    - **دليل حالة Linux على SD أو eMMC**: تحذر عندما تُحل الحالة إلى مصدر تركيب `mmcblk*`، لأن الإدخال/الإخراج العشوائي المدعوم ببطاقات SD أو eMMC قد يكون أبطأ ويتآكل أسرع تحت كتابات الجلسات وبيانات الاعتماد.
    - **أدلة الجلسات مفقودة**: يلزم وجود `sessions/` ودليل مخزن الجلسات لاستمرار السجل وتجنب أعطال `ENOENT`.
    - **عدم تطابق النص**: تحذر عندما تحتوي إدخالات جلسات حديثة على ملفات نص جلسة مفقودة.
    - **جلسة رئيسية "JSONL من سطر واحد"**: تشير عندما يحتوي نص الجلسة الرئيسي على سطر واحد فقط (السجل لا يتراكم).
    - **عدة أدلة حالة**: تحذر عندما توجد عدة مجلدات `~/.openclaw` عبر أدلة المنزل أو عندما يشير `OPENCLAW_STATE_DIR` إلى مكان آخر (يمكن أن ينقسم السجل بين التثبيتات).
    - **تذكير الوضع البعيد**: إذا كان `gateway.mode=remote`، تذكرك أداة الفحص بتشغيلها على المضيف البعيد (فالحالة موجودة هناك).
    - **أذونات ملف الإعدادات**: تحذر إذا كان `~/.openclaw/openclaw.json` قابلا للقراءة من المجموعة/العالم وتعرض تشديده إلى `600`.

  </Accordion>
  <Accordion title="5. صحة مصادقة النماذج (انتهاء صلاحية OAuth)">
    تفحص أداة الفحص ملفات تعريف OAuth في مخزن المصادقة، وتحذر عندما تكون الرموز على وشك الانتهاء/منتهية، ويمكنها تحديثها عندما يكون ذلك آمنا. إذا كان ملف تعريف Anthropic OAuth/الرمز قديما، تقترح مفتاح Anthropic API أو مسار رمز إعداد Anthropic. لا تظهر مطالبات التحديث إلا عند التشغيل تفاعليا (TTY)؛ ويتخطى `--non-interactive` محاولات التحديث.

    عندما يفشل تحديث OAuth نهائيا (على سبيل المثال `refresh_token_reused`، أو `invalid_grant`، أو عندما يطلب منك مزود تسجيل الدخول مجددا)، تبلغ أداة الفحص بأن إعادة المصادقة مطلوبة وتطبع أمر `openclaw models auth login --provider ...` الدقيق المطلوب تشغيله.

    تبلغ أداة الفحص أيضا عن ملفات تعريف المصادقة غير القابلة للاستخدام مؤقتا بسبب:

    - فترات تهدئة قصيرة (حدود المعدل/المهل/إخفاقات المصادقة)
    - تعطيلات أطول (إخفاقات الفوترة/الرصيد)

  </Accordion>
  <Accordion title="6. التحقق من نموذج الخطافات">
    إذا تم تعيين `hooks.gmail.model`، تتحقق أداة الفحص من مرجع النموذج مقابل الفهرس وقائمة السماح وتحذر عندما لا يمكن حله أو يكون غير مسموح.
  </Accordion>
  <Accordion title="7. إصلاح صورة صندوق العزل">
    عندما يكون وضع صندوق العزل مفعلا، تتحقق أداة الفحص من صور Docker وتعرض بناءها أو التبديل إلى الأسماء القديمة إذا كانت الصورة الحالية مفقودة.
  </Accordion>
  <Accordion title="7b. تنظيف تثبيت Plugin">
    تزيل أداة الفحص حالة تجهيز تبعيات Plugin القديمة التي أنشأها OpenClaw في وضع `openclaw doctor --fix` / `openclaw doctor --repair`. يغطي هذا جذور التبعيات المولدة القديمة، وأدلة مرحلة التثبيت القديمة، والمخلفات المحلية للحزم من كود إصلاح تبعيات Plugin المجمعة السابق.

    يمكن لأداة الفحص أيضا إعادة تثبيت Plugins القابلة للتنزيل والمهيأة عندما تشير إليها الإعدادات لكن سجل Plugin المحلي لا يستطيع العثور عليها. لا يقوم بدء Gateway ولا إعادة تحميل الإعدادات بتشغيل مديري الحزم؛ تظل تثبيتات Plugin عملا صريحا لأداة الفحص/التثبيت/التحديث.

  </Accordion>
  <Accordion title="8. ترحيلات خدمة Gateway وتلميحات التنظيف">
    تكتشف أداة الفحص خدمات Gateway القديمة (launchd/systemd/schtasks) وتعرض إزالتها وتثبيت خدمة OpenClaw باستخدام منفذ Gateway الحالي. يمكنها أيضا الفحص بحثا عن خدمات إضافية شبيهة بـ Gateway وطباعة تلميحات تنظيف. تُعد خدمات Gateway الخاصة بـ OpenClaw المسماة حسب الملف الشخصي خدمات من الدرجة الأولى ولا يتم وسمها بأنها "إضافية".

    على Linux، إذا كانت خدمة Gateway على مستوى المستخدم مفقودة لكن توجد خدمة OpenClaw Gateway على مستوى النظام، فلا تثبت أداة الفحص خدمة ثانية على مستوى المستخدم تلقائيا. افحص باستخدام `openclaw gateway status --deep` أو `openclaw doctor --deep`، ثم أزل التكرار أو عيّن `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يكون مشرف نظام هو مالك دورة حياة Gateway.

  </Accordion>
  <Accordion title="8b. ترحيل Startup Matrix">
    عندما يكون لدى حساب قناة Matrix ترحيل حالة قديم معلق أو قابل للإجراء، تنشئ أداة الفحص (في وضع `--fix` / `--repair`) لقطة قبل الترحيل ثم تشغل خطوات الترحيل بأفضل جهد: ترحيل حالة Matrix القديمة وتحضير الحالة المشفرة القديمة. كلتا الخطوتين غير قاتلتين؛ تُسجل الأخطاء ويستمر بدء التشغيل. في وضع القراءة فقط (`openclaw doctor` من دون `--fix`) يتم تخطي هذا الفحص بالكامل.
  </Accordion>
  <Accordion title="8c. إقران الأجهزة وانحراف المصادقة">
    تفحص أداة الفحص الآن حالة إقران الأجهزة كجزء من مرور الصحة العادي.

    ما تعرضه:

    - طلبات إقران أولية معلقة
    - ترقيات أدوار معلقة للأجهزة المقترنة بالفعل
    - ترقيات نطاقات معلقة للأجهزة المقترنة بالفعل
    - إصلاحات عدم تطابق المفتاح العام عندما لا يزال معرّف الجهاز مطابقا لكن هوية الجهاز لم تعد تطابق السجل المعتمد
    - سجلات مقترنة تفتقد رمزا نشطا لدور معتمد
    - رموز مقترنة انحرفت نطاقاتها خارج خط أساس الإقران المعتمد
    - إدخالات رموز جهاز مخزنة محليا للجهاز الحالي تسبق تدوير رمز من جهة Gateway أو تحمل بيانات تعريف نطاق قديمة

    لا توافق أداة الفحص تلقائيا على طلبات الإقران ولا تدور رموز الأجهزة تلقائيا. بل تطبع الخطوات التالية الدقيقة:

    - افحص الطلبات المعلقة باستخدام `openclaw devices list`
    - وافق على الطلب المحدد باستخدام `openclaw devices approve <requestId>`
    - دوّر رمزا جديدا باستخدام `openclaw devices rotate --device <deviceId> --role <role>`
    - أزل سجلا قديما وأعد الموافقة عليه باستخدام `openclaw devices remove <deviceId>`

    هذا يغلق الثغرة الشائعة "مقترن بالفعل لكن لا يزال يتلقى طلب الإقران": تميز أداة الفحص الآن بين الإقران لأول مرة، وترقيات الدور/النطاق المعلقة، وانحراف الرمز/هوية الجهاز القديم.

  </Accordion>
  <Accordion title="9. تحذيرات الأمان">
    تصدر أداة الفحص تحذيرات عندما يكون مزود مفتوحا للرسائل المباشرة من دون قائمة سماح، أو عندما تُهيأ سياسة بطريقة خطرة.
  </Accordion>
  <Accordion title="10. إبقاء systemd نشطا (Linux)">
    إذا كان التشغيل كخدمة مستخدم systemd، تتأكد أداة الفحص من تفعيل الإبقاء حتى يظل Gateway حيا بعد تسجيل الخروج.
  </Accordion>
  <Accordion title="11. حالة مساحة العمل (Skills، وPlugins، والأدلة القديمة)">
    تطبع أداة الفحص ملخصا لحالة مساحة العمل للوكيل الافتراضي:

    - **حالة Skills**: تعد المهارات المؤهلة، وناقصة المتطلبات، والمحظورة بقائمة السماح.
    - **أدلة مساحة العمل القديمة**: تحذر عندما توجد `~/openclaw` أو أدلة مساحة عمل قديمة أخرى بجانب مساحة العمل الحالية.
    - **حالة Plugin**: تعد Plugins المفعلة/المعطلة/التي بها أخطاء؛ وتسرد معرّفات Plugin لأي أخطاء؛ وتبلغ عن قدرات Plugin الحزمة.
    - **تحذيرات توافق Plugin**: تشير إلى Plugins التي لديها مشكلات توافق مع بيئة التشغيل الحالية.
    - **تشخيصات Plugin**: تعرض أي تحذيرات أو أخطاء وقت التحميل صادرة عن سجل Plugin.

  </Accordion>
  <Accordion title="11b. حجم ملف التمهيد">
    تتحقق أداة الفحص مما إذا كانت ملفات تمهيد مساحة العمل (على سبيل المثال `AGENTS.md`، أو `CLAUDE.md`، أو ملفات سياق محقونة أخرى) قريبة من ميزانية الأحرف المهيأة أو تتجاوزها. تعرض عدد الأحرف الخام مقابل المحقونة لكل ملف، ونسبة الاقتطاع، وسبب الاقتطاع (`max/file` أو `max/total`)، وإجمالي الأحرف المحقونة ككسر من إجمالي الميزانية. عندما تُقتطع الملفات أو تقترب من الحد، تطبع أداة الفحص نصائح لضبط `agents.defaults.bootstrapMaxChars` و`agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. تنظيف Plugin القنوات القديمة">
    عندما يزيل `openclaw doctor --fix` Plugin قناة مفقودا، فإنه يزيل أيضا الإعدادات المتدلية ذات النطاق القنوي التي أشارت إلى ذلك Plugin: إدخالات `channels.<id>`، وأهداف Heartbeat التي سمت القناة، وتجاوزات `agents.*.models["<channel>/*"]`. يمنع هذا حلقات إقلاع Gateway حيث اختفى تشغيل القناة لكن الإعدادات لا تزال تطلب من Gateway الارتباط بها.
  </Accordion>
  <Accordion title="11c. إكمال الصدفة">
    تتحقق أداة الفحص مما إذا كان إكمال التبويب مثبتا للصدفة الحالية (zsh، أو bash، أو fish، أو PowerShell):

    - إذا كان ملف تعريف الصدفة يستخدم نمط إكمال ديناميكيا بطيئا (`source <(openclaw completion ...)`)، ترقيه أداة الفحص إلى متغير الملف المخزن مؤقتا الأسرع.
    - إذا كان الإكمال مهيأ في ملف التعريف لكن ملف التخزين المؤقت مفقود، تعيد أداة الفحص توليد التخزين المؤقت تلقائيا.
    - إذا لم يكن أي إكمال مهيأ على الإطلاق، تطلب أداة الفحص تثبيته (الوضع التفاعلي فقط؛ يتم التخطي مع `--non-interactive`).

    شغل `openclaw completion --write-state` لإعادة توليد التخزين المؤقت يدويا.

  </Accordion>
  <Accordion title="12. فحوصات مصادقة Gateway (الرمز المحلي)">
    تتحقق أداة الفحص من جاهزية مصادقة رمز Gateway المحلي.

    - إذا كان وضع الرمز يحتاج إلى رمز ولا يوجد مصدر رمز، تعرض أداة الفحص إنشاء واحد.
    - إذا كان `gateway.auth.token` مدارا بواسطة SecretRef لكنه غير متاح، تحذر أداة الفحص ولا تستبدله بنص عادي.
    - يفرض `openclaw doctor --generate-gateway-token` التوليد فقط عندما لا يكون SecretRef رمز مهيأ.

  </Accordion>
  <Accordion title="12b. إصلاحات قراءة فقط مدركة لـ SecretRef">
    تحتاج بعض تدفقات الإصلاح إلى فحص بيانات الاعتماد المهيأة من دون إضعاف سلوك الفشل السريع في وقت التشغيل.

    - يستخدم `openclaw doctor --fix` الآن نموذج ملخص SecretRef للقراءة فقط نفسه الذي تستخدمه أوامر عائلة الحالة لإصلاحات الإعدادات المستهدفة.
    - مثال: يحاول إصلاح Telegram `allowFrom` / `groupAllowFrom` `@username` استخدام بيانات اعتماد البوت المهيأة عندما تكون متاحة.
    - إذا كان رمز بوت Telegram مهيأ عبر SecretRef لكنه غير متاح في مسار الأمر الحالي، تبلغ أداة الفحص بأن بيانات الاعتماد مهيأة لكنها غير متاحة وتتخطى الحل التلقائي بدلا من التعطل أو الإبلاغ خطأ بأن الرمز مفقود.

  </Accordion>
  <Accordion title="13. فحص صحة Gateway + إعادة التشغيل">
    تشغل أداة الفحص فحص صحة وتعرض إعادة تشغيل Gateway عندما يبدو غير سليم.
  </Accordion>
  <Accordion title="13b. جاهزية البحث في الذاكرة">
    تتحقق أداة الفحص مما إذا كان مزود تضمينات البحث في الذاكرة المهيأ جاهزا للوكيل الافتراضي. يعتمد السلوك على الخلفية والمزود المهيأين:

    - **خلفية QMD**: تفحص ما إذا كان الملف الثنائي `qmd` متاحًا ويمكن بدء تشغيله. إذا لم يكن كذلك، تطبع إرشادات الإصلاح بما في ذلك حزمة npm وخيار مسار يدوي للملف الثنائي.
    - **المزوّد المحلي الصريح**: يتحقق من وجود ملف نموذج محلي أو عنوان URL لنموذج بعيد/قابل للتنزيل معروف. إذا كان مفقودًا، يقترح التبديل إلى مزوّد بعيد.
    - **المزوّد البعيد الصريح** (`openai`، `voyage`، إلخ): يتحقق من وجود مفتاح API في البيئة أو مخزن المصادقة. يطبع تلميحات إصلاح قابلة للتنفيذ إذا كان مفقودًا.
    - **المزوّد التلقائي**: يتحقق أولًا من توفر النموذج المحلي، ثم يجرّب كل مزوّد بعيد وفق ترتيب الاختيار التلقائي.

    عند توفر نتيجة فحص Gateway مخزّنة مؤقتًا (كان Gateway سليمًا وقت الفحص)، يطابق doctor نتيجتها مع الإعدادات المرئية للـ CLI ويلاحظ أي اختلاف. لا يبدأ doctor اختبار ping جديدًا للتضمينات في المسار الافتراضي؛ استخدم أمر حالة الذاكرة العميق عندما تريد فحصًا مباشرًا للمزوّد.

    استخدم `openclaw memory status --deep` للتحقق من جاهزية التضمينات وقت التشغيل.

  </Accordion>
  <Accordion title="14. تحذيرات حالة القناة">
    إذا كان Gateway سليمًا، يشغّل doctor فحص حالة القناة ويبلغ عن التحذيرات مع إصلاحات مقترحة.
  </Accordion>
  <Accordion title="15. تدقيق إعدادات المشرف + الإصلاح">
    يتحقق doctor من إعدادات المشرف المثبّتة (launchd/systemd/schtasks) بحثًا عن الإعدادات الافتراضية المفقودة أو القديمة (مثل تبعيات systemd network-online وتأخير إعادة التشغيل). عندما يجد عدم تطابق، يوصي بتحديث ويمكنه إعادة كتابة ملف الخدمة/المهمة إلى الإعدادات الافتراضية الحالية.

    ملاحظات:

    - يطلب `openclaw doctor` التأكيد قبل إعادة كتابة إعدادات المشرف.
    - يقبل `openclaw doctor --yes` مطالبات الإصلاح الافتراضية.
    - يطبق `openclaw doctor --repair` الإصلاحات الموصى بها دون مطالبات.
    - يعيد `openclaw doctor --repair --force` كتابة إعدادات المشرف المخصصة.
    - يبقي `OPENCLAW_SERVICE_REPAIR_POLICY=external` doctor في وضع القراءة فقط لدورة حياة خدمة Gateway. لا يزال يبلغ عن سلامة الخدمة ويشغّل الإصلاحات غير المتعلقة بالخدمة، لكنه يتخطى تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة، وإعادة كتابة إعدادات المشرف، وتنظيف الخدمات القديمة لأن مشرفًا خارجيًا يملك دورة الحياة هذه.
    - على Linux، لا يعيد doctor كتابة بيانات الأمر/نقطة الدخول التعريفية أثناء نشاط وحدة systemd المطابقة لـ Gateway. كما يتجاهل الوحدات الإضافية غير القديمة وغير النشطة الشبيهة بـ Gateway أثناء فحص الخدمات المكررة حتى لا تنشئ ملفات الخدمة المرافقة ضجيج تنظيف.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان `gateway.auth.token` مُدارًا عبر SecretRef، فإن تثبيت/إصلاح خدمة doctor يتحقق من SecretRef لكنه لا يحفظ قيم الرمز النصية الصريحة المحلولة في بيانات بيئة خدمة المشرف التعريفية.
    - يكتشف doctor قيم بيئة الخدمة المُدارة عبر `.env`/SecretRef التي كانت تثبيتات LaunchAgent أو systemd أو Windows Scheduled Task القديمة تضمنها مباشرة، ويعيد كتابة بيانات الخدمة التعريفية بحيث تُحمّل تلك القيم من مصدر التشغيل بدلًا من تعريف المشرف.
    - يكتشف doctor عندما يظل أمر الخدمة يثبت `--port` قديمًا بعد تغيّر `gateway.port` ويعيد كتابة بيانات الخدمة التعريفية إلى المنفذ الحالي.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef للرمز المكوّن غير محلول، يحظر doctor مسار التثبيت/الإصلاح مع إرشادات قابلة للتنفيذ.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين وكان `gateway.auth.mode` غير مضبوط، يحظر doctor التثبيت/الإصلاح حتى يُضبط الوضع صراحةً.
    - بالنسبة إلى وحدات Linux user-systemd، تتضمن فحوصات انحراف رمز doctor الآن مصدري `Environment=` و`EnvironmentFile=` عند مقارنة بيانات مصادقة الخدمة التعريفية.
    - ترفض إصلاحات خدمة doctor إعادة كتابة أو إيقاف أو إعادة تشغيل خدمة Gateway من ملف ثنائي قديم لـ OpenClaw عندما تكون الإعدادات قد كُتبت آخر مرة بإصدار أحدث. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - يمكنك دائمًا فرض إعادة كتابة كاملة عبر `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. تشخيصات تشغيل Gateway والمنفذ">
    يفحص doctor تشغيل الخدمة (PID، آخر حالة خروج) ويحذر عندما تكون الخدمة مثبّتة لكنها لا تعمل فعليًا. كما يتحقق من تعارضات المنافذ على منفذ Gateway (الافتراضي `18789`) ويبلغ عن الأسباب المحتملة (Gateway يعمل بالفعل، نفق SSH).
  </Accordion>
  <Accordion title="17. أفضل ممارسات تشغيل Gateway">
    يحذر doctor عندما تعمل خدمة Gateway على Bun أو مسار Node مُدار بإصدار (`nvm`، `fnm`، `volta`، `asdf`، إلخ). تتطلب قنوات WhatsApp + Telegram استخدام Node، ويمكن أن تتعطل مسارات مديري الإصدارات بعد الترقيات لأن الخدمة لا تحمّل تهيئة الصدفة. يعرض doctor الترحيل إلى تثبيت Node على مستوى النظام عند توفره (Homebrew/apt/choco).

    تحتفظ الخدمات المثبّتة أو المُصلحة حديثًا بجذور البيئة الصريحة (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) وأدلة user-bin المستقرة، لكن أدلة الرجوع التخ midية لمدير الإصدارات لا تُكتب إلى PATH الخدمة إلا عندما تكون تلك الأدلة موجودة على القرص. يحافظ هذا على توافق PATH المشرف المُنشأ مع تدقيق الحد الأدنى نفسه لـ PATH الذي يشغّله doctor لاحقًا.

  </Accordion>
  <Accordion title="18. كتابة الإعدادات + بيانات المعالج التعريفية">
    يحفظ doctor أي تغييرات في الإعدادات ويختم بيانات المعالج التعريفية لتسجيل تشغيل doctor.
  </Accordion>
  <Accordion title="19. نصائح مساحة العمل (النسخ الاحتياطي + نظام الذاكرة)">
    يقترح doctor نظام ذاكرة لمساحة العمل عند غيابه ويطبع نصيحة نسخ احتياطي إذا لم تكن مساحة العمل ضمن git بالفعل.

    راجع [/concepts/agent-workspace](/ar/concepts/agent-workspace) للحصول على دليل كامل لبنية مساحة العمل والنسخ الاحتياطي عبر git (يوصى بـ GitHub أو GitLab خاص).

  </Accordion>
</AccordionGroup>

## ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
