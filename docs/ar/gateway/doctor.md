---
read_when:
    - إضافة ترحيلات Doctor أو تعديلها
    - إدخال تغييرات جذرية على الإعدادات
sidebarTitle: Doctor
summary: 'أمر Doctor: فحوصات الصحة، وترحيلات الإعدادات، وخطوات الإصلاح'
title: Doctor
x-i18n:
    generated_at: "2026-04-26T11:29:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 592a9f886e0e6dcbfeb41a09c765ab289f3ed16ed360be37ff9fbefba920754f
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` هو أداة الإصلاح + الترحيل الخاصة بـ OpenClaw. فهو يصلح الإعدادات/الحالة القديمة، ويفحص الصحة، ويوفر خطوات إصلاح قابلة للتنفيذ.

## بدء سريع

```bash
openclaw doctor
```

### أوضاع headless والأتمتة

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    اقبل القيم الافتراضية من دون مطالبة (بما في ذلك خطوات إصلاح إعادة التشغيل/الخدمة/sandbox عند الاقتضاء).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    طبّق الإصلاحات الموصى بها من دون مطالبة (الإصلاحات + إعادة التشغيل حيثما كان ذلك آمنًا).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    طبّق الإصلاحات العدوانية أيضًا (يستبدل إعدادات supervisor المخصصة).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    شغّل من دون مطالبات وطبّق فقط الترحيلات الآمنة (تطبيع الإعدادات + نقل الحالة على القرص). يتخطى إجراءات إعادة التشغيل/الخدمة/sandbox التي تتطلب تأكيدًا بشريًا. تعمل ترحيلات الحالة القديمة تلقائيًا عند اكتشافها.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    افحص خدمات النظام لاكتشاف تثبيتات gateway إضافية (launchd/systemd/schtasks).

  </Tab>
</Tabs>

إذا كنت تريد مراجعة التغييرات قبل الكتابة، فافتح ملف الإعدادات أولًا:

```bash
cat ~/.openclaw/openclaw.json
```

## ما الذي يفعله (ملخص)

<AccordionGroup>
  <Accordion title="الصحة، وواجهة المستخدم، والتحديثات">
    - تحديث اختياري قبل التشغيل لتثبيتات git (في الوضع التفاعلي فقط).
    - فحص حداثة بروتوكول واجهة المستخدم (يعيد بناء Control UI عندما يكون مخطط البروتوكول أحدث).
    - فحص الصحة + مطالبة بإعادة التشغيل.
    - ملخص حالة Skills (مؤهلة/مفقودة/محجوبة) وحالة Plugins.
  </Accordion>
  <Accordion title="الإعدادات والترحيلات">
    - تطبيع الإعدادات للقيم القديمة.
    - ترحيل إعدادات Talk من الحقول القديمة المسطحة `talk.*` إلى `talk.provider` + `talk.providers.<provider>`.
    - فحوصات ترحيل browser لإعدادات Chrome extension القديمة وجهوزية Chrome MCP.
    - تحذيرات تجاوز موفّر OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - تحذيرات تظليل Codex OAuth (`models.providers.openai-codex`).
    - فحص متطلبات OAuth TLS لملفات تعريف OpenAI Codex OAuth.
    - ترحيل الحالة القديمة على القرص (الجلسات/دليل الوكيل/مصادقة WhatsApp).
    - ترحيل مفاتيح عقود plugin manifest القديمة (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - ترحيل مخزن Cron القديم (`jobId`, `schedule.cron`, وحقول delivery/payload من المستوى الأعلى، و`provider` داخل payload، ووظائف fallback الخاصة بـ Webhook البسيطة من نوع `notify: true`).
    - ترحيل سياسة بيئة تشغيل الوكيل القديمة إلى `agents.defaults.agentRuntime` و`agents.list[].agentRuntime`.
  </Accordion>
  <Accordion title="الحالة والسلامة">
    - فحص ملفات قفل الجلسات وتنظيف الأقفال القديمة.
    - إصلاح نصوص الجلسات المكررة لفروع إعادة كتابة prompt التي أنشأتها الإصدارات المتأثرة 2026.4.24.
    - فحوصات سلامة الحالة والأذونات (الجلسات، والنصوص، ودليل الحالة).
    - فحوصات أذونات ملف الإعدادات (`chmod 600`) عند التشغيل محليًا.
    - صحة مصادقة النموذج: يفحص انتهاء صلاحية OAuth، ويمكنه تحديث الرموز التي قاربت على الانتهاء، ويبلغ عن حالات cooldown/disabled لملف تعريف المصادقة.
    - اكتشاف دليل مساحة عمل إضافي (`~/openclaw`).
  </Accordion>
  <Accordion title="Gateway والخدمات وsupervisors">
    - إصلاح صورة sandbox عندما يكون sandboxing مفعّلًا.
    - ترحيل الخدمة القديمة واكتشاف gateways إضافية.
    - ترحيل الحالة القديمة لقناة Matrix (في وضع `--fix` / `--repair`).
    - فحوصات وقت تشغيل Gateway (الخدمة مثبتة لكنها غير قيد التشغيل؛ cached launchd label).
    - تحذيرات حالة القناة (يتم فحصها من gateway قيد التشغيل).
    - تدقيق إعدادات supervisor (launchd/systemd/schtasks) مع إصلاح اختياري.
    - فحوصات أفضل ممارسات وقت تشغيل Gateway (Node مقابل Bun، ومسارات version manager).
    - تشخيصات تعارض منفذ Gateway (الافتراضي `18789`).
  </Accordion>
  <Accordion title="المصادقة والأمان والإقران">
    - تحذيرات أمان لسياسات DM المفتوحة.
    - فحوصات مصادقة Gateway لوضع الرمز المحلي (يوفر إنشاء token عند عدم وجود مصدر token؛ ولا يستبدل إعدادات token SecretRef).
    - اكتشاف مشكلات إقران الأجهزة (طلبات الإقران الأولى المعلقة، وترقيات الدور/النطاق المعلقة، وانحراف cache المحلي القديم لرمز الجهاز، وانحراف المصادقة في السجل المقترن).
  </Accordion>
  <Accordion title="مساحة العمل وshell">
    - فحص systemd linger على Linux.
    - فحص حجم ملفات bootstrap في مساحة العمل (تحذيرات اقتطاع/اقتراب من الحد لملفات السياق).
    - فحص حالة shell completion والتثبيت/الترقية التلقائية.
    - فحص جهوزية موفّر embedding الخاص ببحث الذاكرة (نموذج محلي، أو مفتاح API بعيد، أو binary خاص بـ QMD).
    - فحوصات تثبيت المصدر (عدم تطابق pnpm workspace، أو أصول UI مفقودة، أو binary مفقود لـ tsx).
    - كتابة الإعدادات المحدّثة + بيانات المعالج الوصفية.
  </Accordion>
</AccordionGroup>

## تعبئة Dreams UI بأثر رجعي وإعادة الضبط

يتضمن مشهد Dreams في Control UI إجراءات **Backfill** و**Reset** و**Clear Grounded** لسير عمل grounded dreaming. تستخدم هذه الإجراءات أساليب RPC بأسلوب doctor في gateway، لكنها **ليست** جزءًا من إصلاح/ترحيل CLI الخاص بـ `openclaw doctor`.

ما الذي تفعله:

- **Backfill** يفحص ملفات `memory/YYYY-MM-DD.md` التاريخية في مساحة العمل النشطة، ويشغّل مرور grounded REM diary، ويكتب إدخالات backfill قابلة للعكس داخل `DREAMS.md`.
- **Reset** يزيل فقط إدخالات diary الخاصة بالـ backfill والمعلّمة من `DREAMS.md`.
- **Clear Grounded** يزيل فقط إدخالات grounded-only قصيرة الأمد المُجهَّزة التي جاءت من إعادة تشغيل تاريخية ولم تجمع بعد استدعاءً مباشرًا أو دعمًا يوميًا.

ما الذي **لا** تفعله هذه الإجراءات بمفردها:

- لا تعدّل `MEMORY.md`
- لا تشغّل ترحيلات doctor الكاملة
- لا تجهّز تلقائيًا المرشحين grounded إلى مخزن الترقية الحي قصير الأمد ما لم تشغّل مسار CLI المرحلي صراحةً أولًا

إذا كنت تريد أن تؤثر إعادة التشغيل التاريخية grounded في مسار الترقية العميقة العادي، فاستخدم تدفق CLI بدلًا من ذلك:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

يقوم ذلك بتجهيز المرشحين durable المقيّدين grounded في مخزن dreaming قصير الأمد مع إبقاء `DREAMS.md` كسطح للمراجعة.

## السلوك المفصل والمبررات

<AccordionGroup>
  <Accordion title="0. تحديث اختياري (تثبيتات git)">
    إذا كان هذا checkout من git وكان doctor يعمل في وضع تفاعلي، فسيعرض التحديث (fetch/rebase/build) قبل تشغيل doctor.
  </Accordion>
  <Accordion title="1. تطبيع الإعدادات">
    إذا كانت الإعدادات تحتوي على أشكال قيم قديمة (على سبيل المثال `messages.ackReaction` من دون تجاوز خاص بالقناة)، فسيقوم doctor بتطبيعها إلى المخطط الحالي.

    ويشمل ذلك الحقول القديمة المسطحة لـ Talk. الإعدادات العامة الحالية لـ Talk هي `talk.provider` + `talk.providers.<provider>`. يعيد doctor كتابة الأشكال القديمة `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` داخل خريطة المزوّد.

  </Accordion>
  <Accordion title="2. ترحيلات مفاتيح الإعدادات القديمة">
    عندما تحتوي الإعدادات على مفاتيح مهجورة، ترفض الأوامر الأخرى التشغيل وتطلب منك تشغيل `openclaw doctor`.

    سيقوم Doctor بما يلي:

    - شرح المفاتيح القديمة التي تم العثور عليها.
    - عرض الترحيل الذي طبّقه.
    - إعادة كتابة `~/.openclaw/openclaw.json` بالمخطط المحدّث.

    كما يشغّل Gateway ترحيلات doctor تلقائيًا عند بدء التشغيل عندما يكتشف تنسيق إعدادات قديمًا، بحيث يتم إصلاح الإعدادات القديمة من دون تدخل يدوي. وتُعالَج ترحيلات مخزن وظائف Cron بواسطة `openclaw doctor --fix`.

    الترحيلات الحالية:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` من المستوى الأعلى
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - الحقول القديمة `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
    - بالنسبة إلى القنوات التي تحتوي على `accounts` مسماة مع بقاء قيم قناة من المستوى الأعلى خاصة بالحساب من وضع الحساب الواحد، انقل تلك القيم ذات النطاق الحسابي إلى الحساب المُرقّى المختار لتلك القناة (`accounts.default` لمعظم القنوات؛ ويمكن لـ Matrix الحفاظ على هدف مسمّى/افتراضي مطابق موجود)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - إزالة `browser.relayBindHost` (إعداد relay قديم للـ extension)

    تتضمن تحذيرات Doctor أيضًا إرشادات الحساب الافتراضي للقنوات متعددة الحسابات:

    - إذا تم تكوين إدخالين أو أكثر ضمن `channels.<channel>.accounts` من دون `channels.<channel>.defaultAccount` أو `accounts.default`، فسيحذّر doctor من أن التوجيه الاحتياطي قد يختار حسابًا غير متوقع.
    - إذا كانت `channels.<channel>.defaultAccount` مضبوطة إلى معرّف حساب غير معروف، فسيحذّر doctor ويسرد معرّفات الحسابات المكوّنة.

  </Accordion>
  <Accordion title="2b. تجاوزات موفّر OpenCode">
    إذا أضفت `models.providers.opencode` أو `opencode-zen` أو `opencode-go` يدويًا، فهذا يتجاوز فهرس OpenCode المضمن من `@mariozechner/pi-ai`. وقد يفرض ذلك النماذج على API غير صحيحة أو يصفر التكاليف. يحذّر doctor حتى تتمكن من إزالة التجاوز واستعادة توجيه API والتكاليف لكل نموذج.
  </Accordion>
  <Accordion title="2c. ترحيل browser وجهوزية Chrome MCP">
    إذا كانت إعدادات browser لديك ما تزال تشير إلى مسار Chrome extension الذي أُزيل، فسيقوم doctor بتطبيعها إلى نموذج الإرفاق المحلي بالمضيف الحالي لـ Chrome MCP:

    - `browser.profiles.*.driver: "extension"` تصبح `"existing-session"`
    - تتم إزالة `browser.relayBindHost`

    يقوم Doctor أيضًا بتدقيق مسار Chrome MCP المحلي على المضيف عندما تستخدم `defaultProfile: "user"` أو ملف `existing-session` مكوّن:

    - يتحقق مما إذا كان Google Chrome مثبتًا على المضيف نفسه لملفات التعريف الافتراضية ذات الاتصال التلقائي
    - يتحقق من إصدار Chrome المكتشف ويحذّر عندما يكون أقل من Chrome 144
    - يذكّرك بتمكين remote debugging في صفحة inspect الخاصة بالمتصفح (مثل `chrome://inspect/#remote-debugging` أو `brave://inspect/#remote-debugging` أو `edge://inspect/#remote-debugging`)

    لا يستطيع Doctor تمكين الإعداد الخاص بجانب Chrome نيابةً عنك. وما يزال Chrome MCP المحلي على المضيف يتطلب:

    - متصفحًا قائمًا على Chromium بإصدار 144+ على مضيف gateway/node
    - أن يكون المتصفح قيد التشغيل محليًا
    - تمكين remote debugging في ذلك المتصفح
    - الموافقة على أول مطالبة موافقة attach داخل المتصفح

    تتعلق الجهوزية هنا فقط بمتطلبات attach المحلية. ويظل existing-session يحتفظ بحدود مسار Chrome MCP الحالية؛ أما المسارات المتقدمة مثل `responsebody`، وتصدير PDF، واعتراض التنزيلات، والإجراءات الدفعية فلا تزال تتطلب متصفحًا مُدارًا أو ملف CDP خام.

    لا ينطبق هذا الفحص على تدفقات Docker أو sandbox أو remote-browser أو غيرها من التدفقات عديمة الرأس. فهذه تواصل استخدام CDP الخام.

  </Accordion>
  <Accordion title="2d. متطلبات OAuth TLS الأساسية">
    عند تكوين ملف تعريف OpenAI Codex OAuth، يفحص doctor نقطة نهاية التفويض الخاصة بـ OpenAI للتحقق من أن مكدس TLS المحلي لـ Node/OpenSSL يستطيع التحقق من سلسلة الشهادات. إذا فشل الفحص بخطأ شهادة (مثل `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` أو شهادة منتهية الصلاحية أو شهادة موقعة ذاتيًا)، يطبع doctor إرشادات إصلاح خاصة بالمنصة. على macOS مع Node من Homebrew، يكون الإصلاح عادةً `brew postinstall ca-certificates`. ومع `--deep`، يعمل الفحص حتى إذا كان gateway سليمًا.
  </Accordion>
  <Accordion title="2e. تجاوزات موفّر Codex OAuth">
    إذا كنت قد أضفت سابقًا إعدادات نقل OpenAI قديمة ضمن `models.providers.openai-codex`، فقد تُظلل مسار موفّر Codex OAuth المضمّن الذي تستخدمه الإصدارات الأحدث تلقائيًا. يحذّر doctor عندما يرى إعدادات النقل القديمة هذه إلى جانب Codex OAuth حتى تتمكن من إزالة أو إعادة كتابة تجاوز النقل القديم واستعادة سلوك التوجيه/البديل المضمّن. لا تزال إعدادات proxy المخصصة والتجاوزات الخاصة بالرؤوس فقط مدعومة ولا تؤدي إلى هذا التحذير.
  </Accordion>
  <Accordion title="2f. تحذيرات مسار Codex plugin">
    عندما يكون Codex plugin المضمّن مفعّلًا، يتحقق doctor أيضًا مما إذا كانت مراجع النموذج الأساسية `openai-codex/*` ما تزال تُحل من خلال مشغّل PI الافتراضي. وهذه المجموعة صالحة عندما تريد مصادقة Codex OAuth/الاشتراك عبر PI، لكن من السهل الخلط بينها وبين Codex app-server harness الأصلية. يحذّر doctor ويشير إلى الشكل الصريح لـ app-server: `openai/*` مع `agentRuntime.id: "codex"` أو `OPENCLAW_AGENT_RUNTIME=codex`.

    لا يصلح Doctor هذا تلقائيًا لأن كلا المسارين صالحان:

    - `openai-codex/*` + PI تعني "استخدم مصادقة Codex OAuth/الاشتراك عبر مشغّل OpenClaw العادي."
    - `openai/*` + `runtime: "codex"` تعني "شغّل الدور المضمن عبر Codex app-server الأصلية."
    - `/codex ...` تعني "تحكم أو اربط محادثة Codex أصلية من الدردشة."
    - `/acp ...` أو `runtime: "acp"` تعني "استخدم المحوّل الخارجي ACP/acpx."

    إذا ظهر التحذير، فاختر المسار الذي قصدته وعدّل config يدويًا. وأبقِ التحذير كما هو عندما يكون PI Codex OAuth مقصودًا.

  </Accordion>
  <Accordion title="3. ترحيلات الحالة القديمة (تخطيط القرص)">
    يمكن لـ Doctor ترحيل التخطيطات الأقدم على القرص إلى البنية الحالية:

    - مخزن الجلسات + النصوص:
      - من `~/.openclaw/sessions/` إلى `~/.openclaw/agents/<agentId>/sessions/`
    - Agent dir:
      - من `~/.openclaw/agent/` إلى `~/.openclaw/agents/<agentId>/agent/`
    - حالة مصادقة WhatsApp ‏(Baileys):
      - من `~/.openclaw/credentials/*.json` القديمة (باستثناء `oauth.json`)
      - إلى `~/.openclaw/credentials/whatsapp/<accountId>/...` (معرّف الحساب الافتراضي: `default`)

    هذه الترحيلات من نوع best-effort وidempotent؛ وسيصدر doctor تحذيرات عندما يترك أي مجلدات قديمة خلفه كنسخ احتياطية. كما يقوم Gateway/CLI أيضًا بترحيل الجلسات القديمة + agent dir تلقائيًا عند بدء التشغيل بحيث تصل السجل/المصادقة/النماذج إلى المسار الخاص بكل وكيل من دون تشغيل doctor يدويًا. أما مصادقة WhatsApp فيُقصَد عمدًا أن تُرحَّل فقط عبر `openclaw doctor`. ويقارن تطبيع موفّر Talk/خريطة المزوّد الآن باستخدام المساواة البنيوية، لذلك لم تعد الفروق الخاصة بترتيب المفاتيح فقط تؤدي إلى تغييرات متكررة عديمة الأثر في `doctor --fix`.

  </Accordion>
  <Accordion title="3a. ترحيلات plugin manifest القديمة">
    يفحص Doctor جميع plugin manifests المثبتة بحثًا عن مفاتيح الإمكانات العليا المهجورة (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). وعند العثور عليها، يعرض نقلها إلى كائن `contracts` وإعادة كتابة ملف manifest في مكانه. هذا الترحيل idempotent؛ فإذا كان مفتاح `contracts` يحتوي بالفعل على القيم نفسها، تتم إزالة المفتاح القديم من دون تكرار البيانات.
  </Accordion>
  <Accordion title="3b. ترحيلات مخزن Cron القديمة">
    يتحقق Doctor أيضًا من مخزن وظائف Cron (`~/.openclaw/cron/jobs.json` افتراضيًا، أو `cron.store` عند التجاوز) بحثًا عن أشكال الوظائف القديمة التي ما يزال المجدول يقبلها للتوافق.

    تتضمن عمليات تنظيف Cron الحالية ما يلي:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - حقول payload من المستوى الأعلى (`message`, `model`, `thinking`, ...) → `payload`
    - حقول delivery من المستوى الأعلى (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - الأسماء المستعارة لتسليم `provider` داخل payload → `delivery.channel` الصريح
    - وظائف fallback القديمة البسيطة الخاصة بـ Webhook من نوع `notify: true` → `delivery.mode="webhook"` الصريح مع `delivery.to=cron.webhook`

    لا يرحّل Doctor وظائف `notify: true` تلقائيًا إلا عندما يمكنه فعل ذلك من دون تغيير السلوك. إذا جمعت وظيفة ما بين fallback notify القديم ووضع تسليم موجود غير Webhook، فسيحذّر doctor ويترك تلك الوظيفة للمراجعة اليدوية.

  </Accordion>
  <Accordion title="3c. تنظيف أقفال الجلسات">
    يفحص Doctor دليل جلسات كل وكيل بحثًا عن ملفات قفل كتابة قديمة — وهي الملفات المتروكة عندما تخرج جلسة بشكل غير طبيعي. ولكل ملف قفل يعثر عليه، يبلّغ عن: المسار، وPID، وما إذا كان PID ما يزال حيًا، وعمر القفل، وما إذا كان يُعد قديمًا (PID ميت أو عمر أكبر من 30 دقيقة). في وضع `--fix` / `--repair` يزيل ملفات القفل القديمة تلقائيًا؛ وإلا فإنه يطبع ملاحظة ويطلب منك إعادة التشغيل باستخدام `--fix`.
  </Accordion>
  <Accordion title="3d. إصلاح فروع نصوص الجلسات">
    يفحص Doctor ملفات JSONL الخاصة بجلسات الوكلاء بحثًا عن شكل الفروع المكررة الناتج عن خطأ إعادة كتابة نص prompt في الإصدار 2026.4.24: دور مستخدم مهجور يحتوي على سياق وقت تشغيل داخلي لـ OpenClaw مع شقيق نشط يحتوي على prompt المستخدم المرئي نفسه. في وضع `--fix` / `--repair`، ينشئ doctor نسخة احتياطية لكل ملف متأثر بجوار الأصل ويعيد كتابة النص إلى الفرع النشط بحيث لا يرى سجل gateway وقراء الذاكرة أدوارًا مكررة بعد الآن.
  </Accordion>
  <Accordion title="4. فحوصات سلامة الحالة (استمرارية الجلسات، والتوجيه، والسلامة)">
    دليل الحالة هو الجذع التشغيلي للنظام. وإذا اختفى، فإنك تفقد الجلسات وبيانات الاعتماد والسجلات والإعدادات (ما لم تكن لديك نسخ احتياطية في مكان آخر).

    يتحقق Doctor من:

    - **غياب دليل الحالة**: يحذّر من فقدان كارثي للحالة، ويطلب إعادة إنشاء الدليل، ويذكّرك بأنه لا يستطيع استعادة البيانات المفقودة.
    - **أذونات دليل الحالة**: يتحقق من قابلية الكتابة؛ ويعرض إصلاح الأذونات (ويصدر تلميح `chown` عند اكتشاف عدم تطابق المالك/المجموعة).
    - **دليل حالة macOS المتزامن سحابيًا**: يحذّر عندما تُحل الحالة ضمن iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) أو `~/Library/CloudStorage/...` لأن المسارات المدعومة بالمزامنة قد تسبب بطء I/O وسباقات في القفل/المزامنة.
    - **دليل حالة Linux على SD أو eMMC**: يحذّر عندما تُحل الحالة إلى مصدر تركيب `mmcblk*`، لأن I/O العشوائي المعتمد على SD أو eMMC قد يكون أبطأ ويتعرض لتآكل أسرع مع كتابات الجلسات وبيانات الاعتماد.
    - **غياب أدلة الجلسات**: كل من `sessions/` ودليل مخزن الجلسات مطلوبان لاستمرار السجل وتجنب أعطال `ENOENT`.
    - **عدم تطابق النص**: يحذّر عندما تحتوي إدخالات الجلسات الحديثة على ملفات نصوص مفقودة.
    - **"سطر JSONL واحد" للجلسة الرئيسية**: يضع علامة عندما يحتوي النص الرئيسي على سطر واحد فقط (أي أن السجل لا يتراكم).
    - **أدلة حالة متعددة**: يحذّر عند وجود عدة مجلدات `~/.openclaw` عبر أدلة home أو عندما يشير `OPENCLAW_STATE_DIR` إلى مكان آخر (قد ينقسم السجل بين التثبيتات).
    - **تذكير الوضع البعيد**: إذا كانت `gateway.mode=remote`، يذكّرك doctor بتشغيله على المضيف البعيد (فالحالة تعيش هناك).
    - **أذونات ملف الإعدادات**: يحذّر إذا كان `~/.openclaw/openclaw.json` قابلًا للقراءة من المجموعة/العالم ويعرض تضييق الأذونات إلى `600`.

  </Accordion>
  <Accordion title="5. صحة مصادقة النموذج (انتهاء OAuth)">
    يفحص Doctor ملفات تعريف OAuth في مخزن المصادقة، ويحذّر عندما تكون الرموز قاربت على الانتهاء/انتهت، ويمكنه تحديثها عندما يكون ذلك آمنًا. وإذا كان ملف تعريف Anthropic OAuth/token قديمًا، فإنه يقترح مفتاح Anthropic API أو مسار Anthropic setup-token. ولا تظهر مطالبات التحديث إلا عند التشغيل التفاعلي (TTY)؛ بينما يتخطى `--non-interactive` محاولات التحديث.

    عندما يفشل تحديث OAuth بشكل دائم (مثل `refresh_token_reused` أو `invalid_grant` أو عندما يطلب منك المزوّد تسجيل الدخول مرة أخرى)، يبلّغ doctor بأن إعادة المصادقة مطلوبة ويطبع أمر `openclaw models auth login --provider ...` الدقيق الذي يجب تشغيله.

    كما يبلّغ Doctor عن ملفات تعريف المصادقة غير القابلة للاستخدام مؤقتًا بسبب:

    - فترات cooldown قصيرة (حدود المعدل/مهلات/إخفاقات المصادقة)
    - تعطيلات أطول (إخفاقات الفوترة/الرصيد)

  </Accordion>
  <Accordion title="6. التحقق من نموذج Hooks">
    إذا كانت `hooks.gmail.model` مضبوطة، يتحقق doctor من صحة مرجع النموذج مقابل الفهرس وallowlist ويحذّر عندما لا يمكن حله أو عندما يكون غير مسموح به.
  </Accordion>
  <Accordion title="7. إصلاح صورة sandbox">
    عندما يكون sandboxing مفعّلًا، يفحص doctor صور Docker ويعرض بناءها أو التبديل إلى الأسماء القديمة إذا كانت الصورة الحالية مفقودة.
  </Accordion>
  <Accordion title="7b. اعتماديات وقت تشغيل Plugins المضمّنة">
    يتحقق Doctor من اعتماديات وقت التشغيل فقط للـ Plugins المضمّنة النشطة في config الحالية أو المفعّلة بواسطة القيمة الافتراضية في manifest المضمّن، مثل `plugins.entries.discord.enabled: true` أو `channels.discord.enabled: true` القديمة أو موفّر مضمّن مفعّل افتراضيًا. وإذا كان أي منها مفقودًا، يبلّغ doctor عن الحزم ويثبتها في وضع `openclaw doctor --fix` / `openclaw doctor --repair`. أما Plugins الخارجية فتستمر في استخدام `openclaw plugins install` / `openclaw plugins update`؛ ولا يثبت doctor اعتماديات لمسارات Plugins عشوائية.

    كما يمكن لـ Gateway وCLI المحلي إصلاح اعتماديات وقت تشغيل Plugins المضمّنة النشطة عند الطلب قبل استيراد Plugin مضمّنة. وتكون هذه التثبيتات ضمن جذر تثبيت وقت تشغيل Plugin، وتعمل مع تعطيل السكربتات، ولا تكتب package lock، وتكون محمية بقفل على جذر التثبيت بحيث لا تقوم بدايات CLI أو Gateway المتزامنة بتعديل شجرة `node_modules` نفسها في الوقت نفسه.

  </Accordion>
  <Accordion title="8. ترحيلات خدمة Gateway وتلميحات التنظيف">
    يكتشف Doctor خدمات gateway القديمة (launchd/systemd/schtasks) ويعرض إزالتها وتثبيت خدمة OpenClaw باستخدام منفذ gateway الحالي. كما يمكنه أيضًا فحص الخدمات الإضافية الشبيهة بالـ gateway وطبـاعة تلميحات للتنظيف. وتُعد خدمات OpenClaw gateway المسماة بحسب profile خدمات من الدرجة الأولى ولا تُعلَّم على أنها "إضافية".
  </Accordion>
  <Accordion title="8b. ترحيل Matrix عند بدء التشغيل">
    عندما يحتوي حساب قناة Matrix على ترحيل حالة قديمة معلّق أو قابل للتنفيذ، فإن doctor (في وضع `--fix` / `--repair`) ينشئ snapshot قبل الترحيل ثم يشغّل خطوات الترحيل من نوع best-effort: ترحيل حالة Matrix القديمة وتجهيز الحالة المشفرة القديمة. وكلتا الخطوتين غير قاتلتين؛ يتم تسجيل الأخطاء ويستمر بدء التشغيل. أما في وضع القراءة فقط (`openclaw doctor` من دون `--fix`) فيتم تخطي هذا الفحص بالكامل.
  </Accordion>
  <Accordion title="8c. إقران الأجهزة وانحراف المصادقة">
    يفحص Doctor الآن حالة إقران الأجهزة كجزء من مرور الصحة العادي.

    ما الذي يبلّغ عنه:

    - طلبات الإقران الأولى المعلقة
    - ترقيات الأدوار المعلقة للأجهزة المقترنة بالفعل
    - ترقيات النطاقات المعلقة للأجهزة المقترنة بالفعل
    - إصلاحات عدم تطابق المفتاح العام عندما يظل معرّف الجهاز مطابقًا لكن هوية الجهاز لم تعد تطابق السجل الموافق عليه
    - السجلات المقترنة التي تفتقد token نشطًا لدور تمت الموافقة عليه
    - الرموز المقترنة التي تنحرف نطاقاتها خارج خط الأساس المعتمد للإقران
    - إدخالات cache المحلية لرمز الجهاز الخاصة بالجهاز الحالي والتي تسبق تدوير الرمز من جهة gateway أو تحمل بيانات وصفية قديمة للنطاقات

    لا يوافق Doctor تلقائيًا على طلبات الإقران ولا يدوّر رموز الأجهزة تلقائيًا. بل يطبع الخطوات التالية الدقيقة بدلًا من ذلك:

    - افحص الطلبات المعلقة باستخدام `openclaw devices list`
    - وافق على الطلب المحدد باستخدام `openclaw devices approve <requestId>`
    - دوّر رمزًا جديدًا باستخدام `openclaw devices rotate --device <deviceId> --role <role>`
    - أزل سجلًا قديمًا ثم أعد الموافقة عليه باستخدام `openclaw devices remove <deviceId>`

    ويغلق هذا الثغرة الشائعة "الجهاز مقترن بالفعل لكن لا يزال يظهر pairing required": إذ يميز doctor الآن بين الإقران لأول مرة، وترقيات الدور/النطاق المعلقة، وانحراف الرمز/هوية الجهاز القديمة.

  </Accordion>
  <Accordion title="9. تحذيرات الأمان">
    يصدر Doctor تحذيرات عندما يكون مزوّد ما مفتوحًا للرسائل الخاصة DM من دون allowlist، أو عندما تُضبط سياسة بطريقة خطِرة.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    إذا كان يعمل كخدمة systemd للمستخدم، فإن doctor يتأكد من أن وضع lingering مفعّل حتى يظل gateway حيًا بعد تسجيل الخروج.
  </Accordion>
  <Accordion title="11. حالة مساحة العمل (Skills وPlugins والأدلة القديمة)">
    يطبع Doctor ملخصًا لحالة مساحة العمل للوكيل الافتراضي:

    - **حالة Skills**: يحسب Skills المؤهلة، وتلك التي تفتقد المتطلبات، وتلك المحجوبة بواسطة allowlist.
    - **أدلة مساحة العمل القديمة**: يحذّر عند وجود `~/openclaw` أو أدلة مساحة عمل قديمة أخرى إلى جانب مساحة العمل الحالية.
    - **حالة Plugins**: يحسب Plugins المفعّلة/المعطلة/المتسببة في أخطاء؛ ويسرد معرّفات Plugins التي تحتوي على أخطاء؛ ويبلغ عن إمكانات bundle plugin.
    - **تحذيرات توافق Plugins**: يضع علامة على Plugins التي لديها مشكلات توافق مع وقت التشغيل الحالي.
    - **تشخيصات Plugins**: يُظهر أي تحذيرات أو أخطاء وقت التحميل الصادرة من سجل Plugins.

  </Accordion>
  <Accordion title="11b. حجم ملف bootstrap">
    يتحقق Doctor مما إذا كانت ملفات bootstrap في مساحة العمل (مثل `AGENTS.md` أو `CLAUDE.md` أو ملفات السياق المحقونة الأخرى) قريبة من ميزانية الأحرف المضبوطة أو متجاوزة لها. ويبلّغ لكل ملف عن عدد الأحرف الخام مقابل الأحرف المحقونة، ونسبة الاقتطاع، وسبب الاقتطاع (`max/file` أو `max/total`)، وإجمالي الأحرف المحقونة كنسبة من الميزانية الإجمالية. وعندما تكون الملفات مقتطعة أو قريبة من الحد، يطبع doctor نصائح لضبط `agents.defaults.bootstrapMaxChars` و`agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Shell completion">
    يتحقق Doctor مما إذا كان tab completion مثبتًا للـ shell الحالي (zsh أو bash أو fish أو PowerShell):

    - إذا كان ملف تعريف shell يستخدم نمط completion ديناميكيًا بطيئًا (`source <(openclaw completion ...)`)، يقوم doctor بترقيته إلى النسخة الأسرع المعتمدة على الملف المخزّن مؤقتًا.
    - إذا كان completion مكوّنًا في ملف التعريف لكن ملف cache مفقودًا، يعيد doctor إنشاء cache تلقائيًا.
    - إذا لم يكن completion مكوّنًا إطلاقًا، يطالب doctor بتثبيته (في الوضع التفاعلي فقط؛ ويتم التخطي مع `--non-interactive`).

    شغّل `openclaw completion --write-state` لإعادة إنشاء cache يدويًا.

  </Accordion>
  <Accordion title="12. فحوصات مصادقة Gateway (الرمز المحلي)">
    يتحقق Doctor من جهوزية مصادقة الرمز المحلي في gateway.

    - إذا كان وضع الرمز يحتاج إلى token ولا يوجد مصدر token، يعرض doctor إنشاء واحد.
    - إذا كانت `gateway.auth.token` تُدار عبر SecretRef لكنها غير متاحة، يحذّر doctor ولا يستبدلها بنص عادي.
    - يفرض `openclaw doctor --generate-gateway-token` التوليد فقط عندما لا يكون هناك token SecretRef مكوَّن.

  </Accordion>
  <Accordion title="12b. إصلاحات واعية بـ SecretRef في وضع القراءة فقط">
    تحتاج بعض تدفقات الإصلاح إلى فحص بيانات الاعتماد المكوّنة من دون إضعاف سلوك الفشل السريع في وقت التشغيل.

    - يستخدم `openclaw doctor --fix` الآن نموذج ملخص SecretRef نفسه في وضع القراءة فقط كما في أوامر عائلة status للإصلاحات الموجهة في config.
    - مثال: يحاول إصلاح `allowFrom` / `groupAllowFrom` في Telegram من نوع `@username` استخدام بيانات اعتماد الـ bot المكوّنة عند توفرها.
    - إذا كان Telegram bot token مكوّنًا عبر SecretRef لكنه غير متاح في مسار الأمر الحالي، يبلّغ doctor بأن بيانات الاعتماد مكوّنة لكن غير متاحة، ويتخطى الحلّ التلقائي بدلًا من التعطل أو الإبلاغ الخاطئ عن أن token مفقود.

  </Accordion>
  <Accordion title="13. فحص صحة Gateway + إعادة التشغيل">
    يشغّل Doctor فحصًا للصحة ويعرض إعادة تشغيل gateway عندما تبدو غير سليمة.
  </Accordion>
  <Accordion title="13b. جهوزية بحث الذاكرة">
    يتحقق Doctor مما إذا كان موفّر embedding المكوّن لبحث الذاكرة جاهزًا للوكيل الافتراضي. ويعتمد السلوك على backend والمزوّد المكوّنين:

    - **QMD backend**: يفحص ما إذا كان binary ‏`qmd` متاحًا وقابلًا للتشغيل. وإذا لم يكن كذلك، يطبع إرشادات للإصلاح تتضمن حزمة npm وخيار مسار binary يدوي.
    - **مزوّد محلي صريح**: يتحقق من وجود ملف نموذج محلي أو عنوان URL معروف لنموذج بعيد/قابل للتنزيل. وإذا كان مفقودًا، يقترح التبديل إلى مزوّد بعيد.
    - **مزوّد بعيد صريح** (`openai` أو `voyage` أو غيرهما): يتحقق من وجود مفتاح API في البيئة أو مخزن المصادقة. ويطبع تلميحات إصلاح قابلة للتنفيذ إذا كان مفقودًا.
    - **مزوّد تلقائي**: يتحقق أولًا من توافر النموذج المحلي، ثم يجرّب كل مزوّد بعيد حسب ترتيب الاختيار التلقائي.

    عندما تكون نتيجة فحص gateway متاحة (إذا كانت gateway سليمة وقت الفحص)، يقارن doctor نتيجتها بالإعدادات المرئية للـ CLI ويشير إلى أي تعارض.

    استخدم `openclaw memory status --deep` للتحقق من جهوزية embedding في وقت التشغيل.

  </Accordion>
  <Accordion title="14. تحذيرات حالة القناة">
    إذا كانت gateway سليمة، يشغّل doctor فحص حالة القناة ويبلّغ عن التحذيرات مع الإصلاحات المقترحة.
  </Accordion>
  <Accordion title="15. تدقيق إعدادات supervisor + الإصلاح">
    يتحقق Doctor من إعداد supervisor المثبت (launchd/systemd/schtasks) بحثًا عن قيم افتراضية مفقودة أو قديمة (مثل اعتماديات systemd network-online وتأخير إعادة التشغيل). وعندما يجد عدم تطابق، يوصي بالتحديث ويمكنه إعادة كتابة ملف الخدمة/المهمة إلى القيم الافتراضية الحالية.

    ملاحظات:

    - يطالب `openclaw doctor` قبل إعادة كتابة إعدادات supervisor.
    - يقبل `openclaw doctor --yes` مطالبات الإصلاح الافتراضية.
    - يطبّق `openclaw doctor --repair` الإصلاحات الموصى بها من دون مطالبات.
    - يستبدل `openclaw doctor --repair --force` إعدادات supervisor المخصصة.
    - يُبقي `OPENCLAW_SERVICE_REPAIR_POLICY=external` وضع doctor في القراءة فقط بالنسبة إلى دورة حياة خدمة gateway. وما يزال يبلّغ عن صحة الخدمة ويشغّل الإصلاحات غير المتعلقة بالخدمة، لكنه يتخطى تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة، وإعادة كتابة إعدادات supervisor، وتنظيف الخدمات القديمة لأن supervisor خارجيًا يملك دورة الحياة تلك.
    - إذا كانت مصادقة token تتطلب token وكانت `gateway.auth.token` مُدارة عبر SecretRef، فإن تثبيت/إصلاح خدمة doctor يتحقق من SecretRef لكنه لا يحفظ قيم token النصية العادية المحلولة ضمن بيانات التعريف البيئية لخدمة supervisor.
    - إذا كانت مصادقة token تتطلب token وكان token SecretRef المكوّن غير محلول، فإن doctor يمنع مسار التثبيت/الإصلاح مع إرشادات قابلة للتنفيذ.
    - إذا تم تكوين كل من `gateway.auth.token` و`gateway.auth.password` وكانت `gateway.auth.mode` غير مضبوطة، فإن doctor يمنع التثبيت/الإصلاح حتى يتم ضبط الوضع صراحةً.
    - بالنسبة إلى وحدات Linux user-systemd، تشمل فحوصات انحراف token في doctor الآن كلا المصدرين `Environment=` و`EnvironmentFile=` عند مقارنة بيانات تعريف المصادقة الخاصة بالخدمة.
    - ترفض إصلاحات خدمة doctor إعادة كتابة أو إيقاف أو إعادة تشغيل خدمة gateway من binary أقدم لـ OpenClaw عندما تكون config قد كُتبت آخر مرة بواسطة إصدار أحدث. راجع [Gateway troubleshooting](/ar/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - يمكنك دائمًا فرض إعادة كتابة كاملة عبر `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. تشخيصات وقت تشغيل Gateway + المنفذ">
    يفحص Doctor وقت تشغيل الخدمة (PID، وآخر حالة خروج) ويحذّر عندما تكون الخدمة مثبتة لكنها ليست قيد التشغيل فعليًا. كما يتحقق من تعارضات المنفذ على منفذ gateway (الافتراضي `18789`) ويبلّغ عن الأسباب المحتملة (gateway قيد التشغيل بالفعل، أو SSH tunnel).
  </Accordion>
  <Accordion title="17. أفضل ممارسات وقت تشغيل Gateway">
    يحذّر Doctor عندما تعمل خدمة gateway على Bun أو على مسار Node مُدار عبر مدير إصدارات (`nvm`, `fnm`, `volta`, `asdf`، إلخ). تتطلب قنوات WhatsApp وTelegram استخدام Node، ويمكن أن تنكسر مسارات مديري الإصدارات بعد الترقيات لأن الخدمة لا تحمل تهيئة shell الخاصة بك. ويعرض doctor الترحيل إلى تثبيت Node على مستوى النظام عند توفره (Homebrew/apt/choco).
  </Accordion>
  <Accordion title="18. كتابة الإعدادات + بيانات المعالج الوصفية">
    يحفظ Doctor أي تغييرات في الإعدادات ويضع ختم بيانات المعالج الوصفية لتسجيل تشغيل doctor.
  </Accordion>
  <Accordion title="19. نصائح مساحة العمل (النسخ الاحتياطي + نظام الذاكرة)">
    يقترح Doctor نظام ذاكرة لمساحة العمل عندما يكون مفقودًا ويطبع نصيحة للنسخ الاحتياطي إذا لم تكن مساحة العمل تحت git بالفعل.

    راجع [/concepts/agent-workspace](/ar/concepts/agent-workspace) للحصول على دليل كامل لبنية مساحة العمل والنسخ الاحتياطي عبر git (يُوصى باستخدام GitHub أو GitLab خاص).

  </Accordion>
</AccordionGroup>

## ذو صلة

- [Gateway runbook](/ar/gateway)
- [Gateway troubleshooting](/ar/gateway/troubleshooting)
