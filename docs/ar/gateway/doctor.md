---
read_when:
    - إضافة ترحيلات التشخيص أو تعديلها
    - إدخال تغييرات كاسرة في الإعدادات
sidebarTitle: Doctor
summary: 'أمر doctor: فحوصات الصحة، وعمليات ترحيل التكوين، وخطوات الإصلاح'
title: التشخيص
x-i18n:
    generated_at: "2026-05-01T07:39:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52183eaf6024eface20089f9d11143ef1e952d2488eee766dc154512f5d3c6b4
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` هي أداة الإصلاح والترحيل في OpenClaw. تصلح الإعدادات/الحالة القديمة، وتتحقق من السلامة، وتوفر خطوات إصلاح قابلة للتنفيذ.

## بدء سريع

```bash
openclaw doctor
```

### أوضاع التشغيل بلا واجهة والأتمتة

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    اقبل الإعدادات الافتراضية دون مطالبة (بما في ذلك خطوات إصلاح إعادة التشغيل/الخدمة/صندوق العزل عند الاقتضاء).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    طبّق الإصلاحات الموصى بها دون مطالبة (الإصلاحات + عمليات إعادة التشغيل حيث يكون ذلك آمناً).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    طبّق الإصلاحات المتقدمة أيضاً (تستبدل إعدادات المشرف المخصصة).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    شغّل دون مطالبات وطبّق فقط عمليات الترحيل الآمنة (تطبيع الإعدادات + نقل الحالة على القرص). يتخطى إجراءات إعادة التشغيل/الخدمة/صندوق العزل التي تتطلب تأكيداً بشرياً. تعمل عمليات ترحيل الحالة القديمة تلقائياً عند اكتشافها.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    افحص خدمات النظام بحثاً عن تثبيتات Gateway إضافية (launchd/systemd/schtasks).

  </Tab>
</Tabs>

إذا كنت تريد مراجعة التغييرات قبل الكتابة، فافتح ملف الإعدادات أولاً:

```bash
cat ~/.openclaw/openclaw.json
```

## ما الذي يفعله (ملخص)

<AccordionGroup>
  <Accordion title="الصحة وواجهة المستخدم والتحديثات">
    - تحديث اختياري قبل التشغيل لتثبيتات git (تفاعلي فقط).
    - فحص حداثة بروتوكول واجهة المستخدم (يعيد بناء واجهة Control UI عندما يكون مخطط البروتوكول أحدث).
    - فحص الصحة + مطالبة بإعادة التشغيل.
    - ملخص حالة Skills (مؤهلة/مفقودة/محظورة) وحالة Plugin.

  </Accordion>
  <Accordion title="الإعدادات وعمليات الترحيل">
    - تطبيع الإعدادات للقيم القديمة.
    - ترحيل إعداد Talk من حقول `talk.*` المسطحة القديمة إلى `talk.provider` + `talk.providers.<provider>`.
    - فحوصات ترحيل المتصفح لإعدادات إضافة Chrome القديمة وجاهزية Chrome MCP.
    - تحذيرات تجاوز مزود OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - تحذيرات حجب OAuth في Codex (`models.providers.openai-codex`).
    - فحص متطلبات OAuth TLS الأساسية لملفات OpenAI Codex OAuth.
    - تحذيرات قائمة سماح Plugin/الأدوات عندما تكون `plugins.allow` مقيّدة لكن سياسة الأدوات لا تزال تطلب أحرف بدل أو أدوات مملوكة لـ Plugin.
    - ترحيل الحالة القديمة على القرص (الجلسات/دليل الوكيل/مصادقة WhatsApp).
    - ترحيل مفتاح عقد بيان Plugin القديم (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - ترحيل مخزن Cron القديم (`jobId`, `schedule.cron`, حقول التسليم/الحمولة في المستوى الأعلى، `provider` في الحمولة، مهام Webhook الاحتياطية البسيطة `notify: true`).
    - ترحيل سياسة وقت تشغيل الوكيل القديمة إلى `agents.defaults.agentRuntime` و`agents.list[].agentRuntime`.
    - تنظيف إعدادات Plugin القديمة عند تمكين Plugins؛ عندما تكون `plugins.enabled=false`، تُعامل مراجع Plugin القديمة كإعداد احتواء خامل وتُحفظ.

  </Accordion>
  <Accordion title="الحالة والتكامل">
    - فحص ملفات قفل الجلسات وتنظيف الأقفال القديمة.
    - إصلاح نصوص الجلسات للفروع المكررة لإعادة كتابة الموجه التي أنشأتها إصدارات 2026.4.24 المتأثرة.
    - اكتشاف شواهد استرداد إعادة التشغيل العالقة للوكلاء الفرعيين، مع دعم `--fix` لمسح علامات الاسترداد الملغاة القديمة حتى لا يستمر بدء التشغيل في معاملة الطفل كأنه أُلغي بسبب إعادة التشغيل.
    - فحوصات تكامل الحالة والأذونات (الجلسات، النصوص، دليل الحالة).
    - فحوصات أذونات ملف الإعدادات (chmod 600) عند التشغيل محلياً.
    - صحة مصادقة النموذج: يتحقق من انتهاء OAuth، ويمكنه تحديث الرموز التي أوشكت على الانتهاء، ويبلغ عن حالات فترة التهدئة/التعطيل لملف المصادقة.
    - اكتشاف دليل مساحة عمل إضافي (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway والخدمات والمشرفون">
    - إصلاح صورة صندوق العزل عند تمكين العزل.
    - ترحيل الخدمة القديمة واكتشاف Gateway إضافية.
    - ترحيل حالة قناة Matrix القديمة (في وضع `--fix` / `--repair`).
    - فحوصات وقت تشغيل Gateway (الخدمة مثبتة لكنها لا تعمل؛ تسمية launchd مخزنة مؤقتاً).
    - تحذيرات حالة القنوات (تُفحص من Gateway العاملة).
    - تدقيق إعدادات المشرف (launchd/systemd/schtasks) مع إصلاح اختياري.
    - تنظيف بيئة الوكيل المضمنة لخدمات Gateway التي التقطت قيم shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` أثناء التثبيت أو التحديث.
    - فحوصات أفضل ممارسات وقت تشغيل Gateway (Node مقابل Bun، مسارات مدير الإصدارات).
    - تشخيصات تعارض منفذ Gateway (الافتراضي `18789`).

  </Accordion>
  <Accordion title="المصادقة والأمان والاقتران">
    - تحذيرات أمنية لسياسات الرسائل المباشرة المفتوحة.
    - فحوصات مصادقة Gateway لوضع الرمز المحلي (تعرض إنشاء رمز عندما لا يوجد مصدر رمز؛ لا تستبدل إعدادات SecretRef للرموز).
    - اكتشاف مشكلات إقران الأجهزة (طلبات الاقتران الأولى المعلقة، ترقيات الدور/النطاق المعلقة، انحراف ذاكرة التخزين المؤقت القديمة لرمز الجهاز المحلي، وانحراف مصادقة سجل الإقران).

  </Accordion>
  <Accordion title="مساحة العمل والصدفة">
    - فحص systemd linger على Linux.
    - فحص حجم ملف تمهيد مساحة العمل (تحذيرات الاقتطاع/الاقتراب من الحد لملفات السياق).
    - فحص حالة إكمال الصدفة والتثبيت/الترقية التلقائية.
    - فحص جاهزية مزود تضمين بحث الذاكرة (نموذج محلي، مفتاح API بعيد، أو ملف QMD ثنائي).
    - فحوصات تثبيت المصدر (عدم تطابق مساحة عمل pnpm، أصول واجهة مستخدم مفقودة، ملف tsx ثنائي مفقود).
    - يكتب الإعدادات المحدثة + بيانات معالج الإعداد الوصفية.

  </Accordion>
</AccordionGroup>

## الردم وإعادة الضبط في واجهة Dreams

يتضمن مشهد Dreams في Control UI إجراءات **الردم** و**إعادة الضبط** و**مسح المؤرض** لسير عمل Dreaming المؤرض. تستخدم هذه الإجراءات أساليب RPC بنمط Gateway doctor، لكنها **ليست** جزءاً من إصلاح/ترحيل `openclaw doctor` في CLI.

ما تفعله:

- **الردم** يفحص ملفات `memory/YYYY-MM-DD.md` التاريخية في مساحة العمل النشطة، ويشغل تمرير يوميات REM المؤرض، ويكتب إدخالات ردم قابلة للعكس في `DREAMS.md`.
- **إعادة الضبط** تزيل فقط إدخالات يوميات الردم المحددة تلك من `DREAMS.md`.
- **مسح المؤرض** يزيل فقط إدخالات الذاكرة قصيرة المدى المرحلية المؤرضة فقط التي جاءت من إعادة تشغيل تاريخية ولم تجمع بعد استدعاءً حياً أو دعماً يومياً.

ما **لا** تفعله وحدها:

- لا تعدّل `MEMORY.md`
- لا تشغّل عمليات ترحيل doctor الكاملة
- لا تضع المرشحين المؤرضين تلقائياً في مخزن الترقية قصيرة المدى الحي إلا إذا شغّلت مسار CLI المرحلي صراحةً أولاً

إذا كنت تريد أن تؤثر إعادة التشغيل التاريخية المؤرضة في مسار الترقية العميقة العادي، فاستخدم تدفق CLI بدلاً من ذلك:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

يضع ذلك المرشحين الدائمين المؤرضين في مخزن Dreaming قصير المدى مع إبقاء `DREAMS.md` كسطح للمراجعة.

## السلوك التفصيلي والأساس المنطقي

<AccordionGroup>
  <Accordion title="0. تحديث اختياري (تثبيتات git)">
    إذا كان هذا checkout من git وكان doctor يعمل تفاعلياً، فإنه يعرض التحديث (fetch/rebase/build) قبل تشغيل doctor.
  </Accordion>
  <Accordion title="1. تطبيع الإعدادات">
    إذا كانت الإعدادات تحتوي على أشكال قيم قديمة (مثلاً `messages.ackReaction` دون تجاوز خاص بالقناة)، فإن doctor يطبعها إلى المخطط الحالي.

    يتضمن ذلك حقول Talk المسطحة القديمة. إعداد Talk العام الحالي هو `talk.provider` + `talk.providers.<provider>`. يعيد Doctor كتابة أشكال `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` القديمة إلى خريطة المزود.

    يحذر Doctor أيضاً عندما تكون `plugins.allow` غير فارغة وتستخدم سياسة الأدوات
    أحرف بدل أو إدخالات أدوات مملوكة لـ Plugin. يطابق `tools.allow: ["*"]` فقط الأدوات
    من Plugins التي تُحمّل فعلاً؛ ولا يتجاوز قائمة سماح Plugin الحصرية.

  </Accordion>
  <Accordion title="2. عمليات ترحيل مفاتيح الإعدادات القديمة">
    عندما تحتوي الإعدادات على مفاتيح مهملة، ترفض الأوامر الأخرى العمل وتطلب منك تشغيل `openclaw doctor`.

    سيقوم Doctor بما يلي:

    - يشرح أي مفاتيح قديمة عُثر عليها.
    - يعرض الترحيل الذي طبقه.
    - يعيد كتابة `~/.openclaw/openclaw.json` بالمخطط المحدث.

    يشغل Gateway أيضاً عمليات ترحيل doctor تلقائياً عند بدء التشغيل عندما يكتشف تنسيق إعدادات قديماً، لذلك تُصلح الإعدادات القديمة دون تدخل يدوي. يتعامل `openclaw doctor --fix` مع عمليات ترحيل مخزن مهام Cron.

    عمليات الترحيل الحالية:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` على المستوى الأعلى
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - القديم `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
    - بالنسبة إلى القنوات التي تحتوي على `accounts` مسماة لكن تبقى فيها قيم قناة علوية لحساب واحد، انقل تلك القيم scoped للحساب إلى الحساب المرقّى المختار لتلك القناة (`accounts.default` لمعظم القنوات؛ يمكن لـ Matrix الحفاظ على هدف مسمى/افتراضي مطابق موجود)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - أزل `agents.defaults.llm`؛ استخدم `models.providers.<id>.timeoutSeconds` لمهل provider/model البطيئة
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - أزل `browser.relayBindHost` (إعداد ترحيل extension قديم)
    - القديم `models.providers.*.api: "openai"` → `"openai-completions"` (يتخطى بدء Gateway أيضًا providers التي تكون قيمة `api` لديها مضبوطة على قيمة enum مستقبلية أو غير معروفة بدل الإخفاق المغلق)

    تتضمن تحذيرات Doctor أيضًا إرشادات الحساب الافتراضي للقنوات متعددة الحسابات:

    - إذا تم تكوين إدخالين أو أكثر من `channels.<channel>.accounts` دون `channels.<channel>.defaultAccount` أو `accounts.default`، يحذر Doctor من أن توجيه الرجوع قد يختار حسابًا غير متوقع.
    - إذا تم ضبط `channels.<channel>.defaultAccount` على معرف حساب غير معروف، يحذر Doctor ويسرد معرفات الحسابات المكوّنة.

  </Accordion>
  <Accordion title="2b. تجاوزات provider في OpenCode">
    إذا أضفت `models.providers.opencode` أو `opencode-zen` أو `opencode-go` يدويًا، فإنه يتجاوز كتالوج OpenCode المدمج من `@mariozechner/pi-ai`. يمكن أن يجبر ذلك النماذج على API الخاطئ أو يصفر التكاليف. يحذر Doctor كي تتمكن من إزالة التجاوز واستعادة توجيه API والتكاليف لكل نموذج.
  </Accordion>
  <Accordion title="2c. ترحيل المتصفح وجاهزية Chrome MCP">
    إذا كان تكوين المتصفح لديك لا يزال يشير إلى مسار Chrome extension المحذوف، يطبّعه Doctor إلى نموذج إرفاق Chrome MCP المحلي للمضيف الحالي:

    - يصبح `browser.profiles.*.driver: "extension"` هو `"existing-session"`
    - تتم إزالة `browser.relayBindHost`

    يدقق Doctor أيضًا مسار Chrome MCP المحلي للمضيف عند استخدام `defaultProfile: "user"` أو ملف تعريف `existing-session` مكوّن:

    - يتحقق مما إذا كان Google Chrome مثبتًا على المضيف نفسه لملفات التعريف الافتراضية للاتصال التلقائي
    - يتحقق من إصدار Chrome المكتشف ويحذر عندما يكون أقل من Chrome 144
    - يذكّرك بتمكين التصحيح عن بُعد في صفحة فحص المتصفح (مثلًا `chrome://inspect/#remote-debugging` أو `brave://inspect/#remote-debugging` أو `edge://inspect/#remote-debugging`)

    لا يستطيع Doctor تمكين الإعداد في جانب Chrome نيابةً عنك. لا يزال Chrome MCP المحلي للمضيف يتطلب:

    - متصفحًا قائمًا على Chromium بإصدار 144+ على مضيف gateway/node
    - تشغيل المتصفح محليًا
    - تمكين التصحيح عن بُعد في ذلك المتصفح
    - الموافقة على مطالبة موافقة الإرفاق الأولى في المتصفح

    تتعلق الجاهزية هنا فقط بمتطلبات الإرفاق المحلية. يحافظ Existing-session على حدود مسار Chrome MCP الحالية؛ لا تزال المسارات المتقدمة مثل `responsebody` وتصدير PDF واعتراض التنزيل والإجراءات الدفعية تتطلب متصفحًا مُدارًا أو ملف تعريف CDP خامًا.

    لا ينطبق هذا الفحص على تدفقات Docker أو sandbox أو remote-browser أو التدفقات headless الأخرى. تستمر تلك التدفقات في استخدام CDP الخام.

  </Accordion>
  <Accordion title="2d. متطلبات OAuth TLS المسبقة">
    عند تكوين ملف تعريف OpenAI Codex OAuth، يفحص Doctor نقطة نهاية تخويل OpenAI للتحقق من أن مكدس Node/OpenSSL TLS المحلي يمكنه التحقق من سلسلة الشهادات. إذا فشل الفحص بسبب خطأ شهادة (مثل `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` أو شهادة منتهية الصلاحية أو شهادة موقعة ذاتيًا)، يطبع Doctor إرشادات إصلاح خاصة بالمنصة. على macOS مع Node من Homebrew، يكون الإصلاح عادةً `brew postinstall ca-certificates`. مع `--deep`، يعمل الفحص حتى لو كان Gateway سليمًا.
  </Accordion>
  <Accordion title="2e. تجاوزات provider لـ Codex OAuth">
    إذا كنت قد أضفت سابقًا إعدادات نقل OpenAI قديمة تحت `models.providers.openai-codex`، فيمكن أن تحجب مسار provider المدمج لـ Codex OAuth الذي تستخدمه الإصدارات الأحدث تلقائيًا. يحذر Doctor عندما يرى إعدادات النقل القديمة تلك إلى جانب Codex OAuth كي تتمكن من إزالة تجاوز النقل القديم أو إعادة كتابته واستعادة سلوك التوجيه/الرجوع المدمج. لا تزال الوكلاء المخصصون وتجاوزات الرؤوس فقط مدعومة ولا تطلق هذا التحذير.
  </Accordion>
  <Accordion title="2f. تحذيرات مسار Plugin الخاص بـ Codex">
    عند تمكين Codex plugin المضمن، يتحقق Doctor أيضًا مما إذا كانت مراجع النموذج الأساسية `openai-codex/*` لا تزال تُحل عبر مشغل PI الافتراضي. هذه التركيبة صالحة عندما تريد مصادقة Codex OAuth/الاشتراك عبر PI، لكن يسهل الخلط بينها وبين حزمة app-server الأصلية لـ Codex. يحذر Doctor ويشير إلى الشكل الصريح لـ app-server: `openai/*` بالإضافة إلى `agentRuntime.id: "codex"` أو `OPENCLAW_AGENT_RUNTIME=codex`.

    لا يصلح Doctor هذا تلقائيًا لأن كلا المسارين صالحان:

    - `openai-codex/*` + PI يعني "استخدم مصادقة Codex OAuth/الاشتراك عبر مشغل OpenClaw العادي."
    - `openai/*` + `runtime: "codex"` يعني "شغّل الدور المضمن عبر Codex app-server الأصلي."
    - `/codex ...` يعني "تحكم في محادثة Codex أصلية أو اربطها من الدردشة."
    - `/acp ...` أو `runtime: "acp"` يعني "استخدم محول ACP/acpx الخارجي."

    إذا ظهر التحذير، اختر المسار الذي قصدته وعدّل التكوين يدويًا. أبقِ التحذير كما هو عندما يكون PI Codex OAuth مقصودًا.

  </Accordion>
  <Accordion title="3. ترحيلات الحالة القديمة (تخطيط القرص)">
    يستطيع Doctor ترحيل التخطيطات القديمة على القرص إلى البنية الحالية:

    - مخزن الجلسات + النصوص:
      - من `~/.openclaw/sessions/` إلى `~/.openclaw/agents/<agentId>/sessions/`
    - دليل الوكيل:
      - من `~/.openclaw/agent/` إلى `~/.openclaw/agents/<agentId>/agent/`
    - حالة مصادقة WhatsApp (Baileys):
      - من `~/.openclaw/credentials/*.json` القديم (باستثناء `oauth.json`)
      - إلى `~/.openclaw/credentials/whatsapp/<accountId>/...` (معرف الحساب الافتراضي: `default`)

    هذه الترحيلات تُبذل فيها أفضل محاولة وهي idempotent؛ سيصدر Doctor تحذيرات عندما يترك أي مجلدات قديمة كنسخ احتياطية. يقوم Gateway/CLI أيضًا بترحيل الجلسات القديمة + دليل الوكيل تلقائيًا عند بدء التشغيل حتى تستقر السجل/المصادقة/النماذج في المسار لكل وكيل دون تشغيل Doctor يدويًا. أصبح تطبيع talk provider/provider-map يقارن الآن بالمساواة البنيوية، لذلك لم تعد الفروقات التي تقتصر على ترتيب المفاتيح تطلق تغييرات `doctor --fix` no-op متكررة.

  </Accordion>
  <Accordion title="3a. ترحيلات بيان Plugin القديم">
    يفحص Doctor كل بيانات plugins المثبتة بحثًا عن مفاتيح capability علوية مهملة (`speechProviders` و`realtimeTranscriptionProviders` و`realtimeVoiceProviders` و`mediaUnderstandingProviders` و`imageGenerationProviders` و`videoGenerationProviders` و`webFetchProviders` و`webSearchProviders`). عند العثور عليها، يعرض نقلها إلى كائن `contracts` وإعادة كتابة ملف البيان في مكانه. هذا الترحيل idempotent؛ إذا كان مفتاح `contracts` يحتوي بالفعل على القيم نفسها، تتم إزالة المفتاح القديم دون تكرار البيانات.
  </Accordion>
  <Accordion title="3b. ترحيلات مخزن Cron القديم">
    يتحقق Doctor أيضًا من مخزن مهام cron (`~/.openclaw/cron/jobs.json` افتراضيًا، أو `cron.store` عند تجاوزه) بحثًا عن أشكال مهام قديمة لا يزال المجدول يقبلها للتوافق.

    تشمل عمليات تنظيف cron الحالية:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - حقول الحمولة على المستوى الأعلى (`message`، `model`، `thinking`، ...) → `payload`
    - حقول التسليم على المستوى الأعلى (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - أسماء التسليم البديلة `provider` في الحمولة → `delivery.channel` صريح
    - مهام الرجوع webhook البسيطة القديمة `notify: true` → `delivery.mode="webhook"` صريح مع `delivery.to=cron.webhook`

    يرحّل Doctor تلقائيًا مهام `notify: true` فقط عندما يستطيع فعل ذلك دون تغيير السلوك. إذا جمعت مهمة ما بين رجوع notify القديم ووضع تسليم غير webhook موجود، يحذر Doctor ويترك تلك المهمة للمراجعة اليدوية.

  </Accordion>
  <Accordion title="3c. تنظيف أقفال الجلسات">
    يفحص Doctor كل دليل جلسة وكيل بحثًا عن ملفات قفل كتابة قديمة — وهي ملفات تُترك عندما تنتهي جلسة بشكل غير طبيعي. لكل ملف قفل يعثر عليه يبلّغ عن: المسار، وPID، وما إذا كان PID لا يزال حيًا، وعمر القفل، وما إذا كان يُعد قديمًا (PID ميت أو أقدم من 30 دقيقة). في وضع `--fix` / `--repair` يزيل ملفات القفل القديمة تلقائيًا؛ وإلا يطبع ملاحظة ويطلب منك إعادة التشغيل باستخدام `--fix`.
  </Accordion>
  <Accordion title="3d. إصلاح فرع نص جلسة">
    يفحص Doctor ملفات JSONL لجلسات الوكيل بحثًا عن شكل الفرع المكرر الذي أنشأه خطأ إعادة كتابة نص المطالبة في 2026.4.24: دور مستخدم مهجور يحتوي على سياق تشغيل داخلي لـ OpenClaw بالإضافة إلى شقيق نشط يحتوي على مطالبة المستخدم المرئية نفسها. في وضع `--fix` / `--repair`، ينسخ Doctor كل ملف متأثر احتياطيًا بجانب الأصل ويعيد كتابة النص إلى الفرع النشط حتى لا يرى قراء سجل Gateway والذاكرة أدوارًا مكررة بعد الآن.
  </Accordion>
  <Accordion title="4. فحوصات سلامة الحالة (استمرار الجلسات والتوجيه والسلامة)">
    دليل الحالة هو جذع الدماغ التشغيلي. إذا اختفى، ستفقد الجلسات وبيانات الاعتماد والسجلات والتكوين (ما لم تكن لديك نسخ احتياطية في مكان آخر).

    يتحقق Doctor من:

    - **دليل الحالة مفقود**: يحذّر من فقدان كارثي للحالة، ويطلب إعادة إنشاء الدليل، ويذكّرك بأنه لا يستطيع استرداد البيانات المفقودة.
    - **أذونات دليل الحالة**: يتحقق من قابلية الكتابة؛ ويعرض إصلاح الأذونات (ويصدر تلميح `chown` عند اكتشاف عدم تطابق المالك/المجموعة).
    - **دليل حالة macOS المتزامن مع السحابة**: يحذّر عندما تُحل الحالة ضمن iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) أو `~/Library/CloudStorage/...` لأن المسارات المدعومة بالمزامنة قد تسبب إدخال/إخراج أبطأ وتنافسات قفل/مزامنة.
    - **دليل حالة Linux على SD أو eMMC**: يحذّر عندما تُحل الحالة إلى مصدر تركيب `mmcblk*`، لأن الإدخال/الإخراج العشوائي المدعوم بـ SD أو eMMC قد يكون أبطأ ويتآكل أسرع مع كتابات الجلسات وبيانات الاعتماد.
    - **أدلة الجلسات مفقودة**: يلزم وجود `sessions/` ودليل مخزن الجلسات لحفظ السجل وتجنب أعطال `ENOENT`.
    - **عدم تطابق النص الكامل**: يحذّر عندما تكون إدخالات الجلسات الحديثة تفتقد ملفات النص الكامل.
    - **جلسة رئيسية "JSONL بسطر واحد"**: يضع علامة عندما يحتوي النص الكامل الرئيسي على سطر واحد فقط (السجل لا يتراكم).
    - **أدلة حالة متعددة**: يحذّر عندما توجد عدة مجلدات `~/.openclaw` عبر الأدلة المنزلية أو عندما يشير `OPENCLAW_STATE_DIR` إلى مكان آخر (قد ينقسم السجل بين التثبيتات).
    - **تذكير الوضع البعيد**: إذا كان `gateway.mode=remote`، يذكّرك doctor بتشغيله على المضيف البعيد (الحالة تعيش هناك).
    - **أذونات ملف الإعدادات**: يحذّر إذا كان `~/.openclaw/openclaw.json` قابلاً للقراءة من المجموعة/الجميع ويعرض تضييقه إلى `600`.

  </Accordion>
  <Accordion title="5. صحة مصادقة النموذج (انتهاء OAuth)">
    يفحص doctor ملفات تعريف OAuth في مخزن المصادقة، ويحذّر عندما تكون الرموز المميزة على وشك الانتهاء/منتهية، ويمكنه تحديثها عندما يكون ذلك آمنًا. إذا كان ملف تعريف Anthropic OAuth/الرمز المميز قديمًا، فإنه يقترح مفتاح Anthropic API أو مسار رمز إعداد Anthropic. لا تظهر مطالبات التحديث إلا عند التشغيل تفاعليًا (TTY)؛ ويتخطى `--non-interactive` محاولات التحديث.

    عندما يفشل تحديث OAuth بشكل دائم (على سبيل المثال `refresh_token_reused` أو `invalid_grant` أو عندما يطلب منك مزود تسجيل الدخول مرة أخرى)، يبلّغ doctor بأن إعادة المصادقة مطلوبة ويطبع أمر `openclaw models auth login --provider ...` الدقيق لتشغيله.

    يبلّغ doctor أيضًا عن ملفات تعريف المصادقة غير القابلة للاستخدام مؤقتًا بسبب:

    - فترات تهدئة قصيرة (حدود المعدل/المهل الزمنية/إخفاقات المصادقة)
    - تعطيلات أطول (إخفاقات الفوترة/الرصيد)

  </Accordion>
  <Accordion title="6. التحقق من نموذج الخطافات">
    إذا تم ضبط `hooks.gmail.model`، يتحقق doctor من مرجع النموذج مقابل الكتالوج وقائمة السماح ويحذّر عندما لا يُحل أو يكون غير مسموح.
  </Accordion>
  <Accordion title="7. إصلاح صورة وضع الحماية">
    عندما يكون وضع الحماية ممكّنًا، يفحص doctor صور Docker ويعرض إنشاءها أو التبديل إلى الأسماء القديمة إذا كانت الصورة الحالية مفقودة.
  </Accordion>
  <Accordion title="7b. تبعيات تشغيل Plugin المضمّنة">
    يتحقق doctor من تبعيات وقت التشغيل فقط لـ plugins المضمّنة النشطة في الإعداد الحالي أو الممكّنة افتراضيًا عبر بيانها المضمّن، مثل `plugins.entries.discord.enabled: true` أو `channels.discord.enabled: true` القديم أو `models.providers.*` المهيأة / مراجع نماذج الوكلاء، أو Plugin مضمّن ممكّن افتراضيًا دون ملكية مزود. إذا كان أي منها مفقودًا، يبلّغ doctor عن الحزم ويثبتها في وضع `openclaw doctor --fix` / `openclaw doctor --repair`. لا تزال plugins الخارجية تستخدم `openclaw plugins install` / `openclaw plugins update`؛ ولا يثبّت doctor تبعيات لمسارات Plugin عشوائية.

    أثناء إصلاح doctor، تعرض تثبيتات npm لتبعيات وقت التشغيل المضمّنة تقدمًا دوارًا في جلسات TTY وتقدمًا دوريًا على شكل أسطر في الإخراج الموجّه/عديم الواجهة. يمكن لـ Gateway وCLI المحلي أيضًا إصلاح تبعيات وقت تشغيل Plugin المضمّنة النشطة عند الطلب قبل استيراد Plugin مضمّن. تقتصر هذه التثبيتات على جذر تثبيت وقت تشغيل Plugin، وتعمل مع تعطيل السكربتات، ولا تكتب قفل حزمة، وتحرسها قفلة جذر التثبيت حتى لا يغير بدء CLI أو Gateway المتزامن شجرة `node_modules` نفسها في الوقت نفسه.

  </Accordion>
  <Accordion title="8. ترحيلات خدمة Gateway وتلميحات التنظيف">
    يكتشف doctor خدمات Gateway القديمة (launchd/systemd/schtasks) ويعرض إزالتها وتثبيت خدمة OpenClaw باستخدام منفذ Gateway الحالي. ويمكنه أيضًا فحص خدمات إضافية شبيهة بـ Gateway وطباعة تلميحات تنظيف. تُعد خدمات OpenClaw Gateway المسماة بملف تعريف كيانات من الدرجة الأولى ولا تُوسم بأنها "إضافية".

    على Linux، إذا كانت خدمة Gateway على مستوى المستخدم مفقودة لكن توجد خدمة OpenClaw Gateway على مستوى النظام، لا يثبّت doctor خدمة ثانية على مستوى المستخدم تلقائيًا. افحص باستخدام `openclaw gateway status --deep` أو `openclaw doctor --deep`، ثم أزل النسخة المكررة أو اضبط `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يشرف مدير نظام على دورة حياة Gateway.

  </Accordion>
  <Accordion title="8b. ترحيل بدء تشغيل Matrix">
    عندما يكون لدى حساب قناة Matrix ترحيل حالة قديم معلّق أو قابل للتنفيذ، ينشئ doctor (في وضع `--fix` / `--repair`) لقطة قبل الترحيل ثم يشغّل خطوات الترحيل بأفضل جهد: ترحيل حالة Matrix القديمة وتحضير الحالة المشفّرة القديمة. كلا الخطوتين غير قاتلتين؛ تُسجّل الأخطاء ويستمر بدء التشغيل. في وضع القراءة فقط (`openclaw doctor` بدون `--fix`) يتم تخطي هذا الفحص بالكامل.
  </Accordion>
  <Accordion title="8c. إقران الجهاز وانحراف المصادقة">
    يفحص doctor الآن حالة إقران الجهاز كجزء من تمرير الصحة العادي.

    ما يبلّغ عنه:

    - طلبات إقران أول مرة معلّقة
    - ترقيات أدوار معلّقة لأجهزة مقترنة بالفعل
    - ترقيات نطاقات معلّقة لأجهزة مقترنة بالفعل
    - إصلاحات عدم تطابق المفتاح العام عندما لا يزال معرّف الجهاز مطابقًا لكن هوية الجهاز لم تعد تطابق السجل المعتمد
    - سجلات مقترنة تفتقد رمزًا مميزًا نشطًا لدور معتمد
    - رموز مميزة مقترنة تنحرف نطاقاتها خارج خط أساس الإقران المعتمد
    - إدخالات رموز أجهزة مخزنة محليًا للجهاز الحالي تسبق تدوير رمز مميز على جانب Gateway أو تحمل بيانات وصفية قديمة للنطاق

    لا يوافق doctor تلقائيًا على طلبات الإقران ولا يدوّر رموز الأجهزة تلقائيًا. بل يطبع الخطوات التالية الدقيقة:

    - افحص الطلبات المعلّقة باستخدام `openclaw devices list`
    - وافق على الطلب الدقيق باستخدام `openclaw devices approve <requestId>`
    - دوّر رمزًا مميزًا جديدًا باستخدام `openclaw devices rotate --device <deviceId> --role <role>`
    - أزل سجلًا قديمًا وأعد الموافقة عليه باستخدام `openclaw devices remove <deviceId>`

    هذا يسد فجوة "مقترن بالفعل لكن لا يزال يحصل على مطلوب الإقران" الشائعة: يميّز doctor الآن بين إقران أول مرة وترقيات الدور/النطاق المعلّقة وانحراف الرمز المميز/هوية الجهاز القديم.

  </Accordion>
  <Accordion title="9. تحذيرات الأمان">
    يصدر doctor تحذيرات عندما يكون مزود مفتوحًا للرسائل المباشرة دون قائمة سماح، أو عندما تكون سياسة مهيأة بطريقة خطرة.
  </Accordion>
  <Accordion title="10. بقاء systemd (Linux)">
    إذا كان يعمل كخدمة مستخدم systemd، يضمن doctor تمكين البقاء بحيث يظل Gateway حيًا بعد تسجيل الخروج.
  </Accordion>
  <Accordion title="11. حالة مساحة العمل (Skills وplugins والأدلة القديمة)">
    يطبع doctor ملخصًا لحالة مساحة العمل للوكيل الافتراضي:

    - **حالة Skills**: يحصي Skills المؤهلة، وناقصة المتطلبات، والمحظورة بقائمة السماح.
    - **أدلة مساحة العمل القديمة**: يحذّر عندما توجد `~/openclaw` أو أدلة مساحة عمل قديمة أخرى إلى جانب مساحة العمل الحالية.
    - **حالة Plugin**: يحصي plugins الممكّنة/المعطّلة/التي بها أخطاء؛ ويسرد معرّفات Plugin لأي أخطاء؛ ويبلّغ عن قدرات Plugin الحزمة.
    - **تحذيرات توافق Plugin**: يضع علامة على plugins التي لديها مشكلات توافق مع وقت التشغيل الحالي.
    - **تشخيصات Plugin**: تعرض أي تحذيرات أو أخطاء وقت تحميل يصدرها سجل Plugin.

  </Accordion>
  <Accordion title="11b. حجم ملف التمهيد">
    يتحقق doctor مما إذا كانت ملفات تمهيد مساحة العمل (مثل `AGENTS.md` أو `CLAUDE.md` أو ملفات سياق أخرى محقونة) قريبة من ميزانية الأحرف المهيأة أو تتجاوزها. يبلّغ عن عدد الأحرف الخام مقابل المحقونة لكل ملف، ونسبة الاقتطاع، وسبب الاقتطاع (`max/file` أو `max/total`)، وإجمالي الأحرف المحقونة كنسبة من الميزانية الإجمالية. عندما تُقتطع الملفات أو تقترب من الحد، يطبع doctor نصائح لضبط `agents.defaults.bootstrapMaxChars` و`agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. تنظيف Plugin قناة قديم">
    عندما يزيل `openclaw doctor --fix` Plugin قناة مفقودًا، فإنه يزيل أيضًا الإعداد المتدلي ذي نطاق القناة الذي كان يشير إلى ذلك Plugin: إدخالات `channels.<id>`، وأهداف Heartbeat التي سمّت القناة، وتجاوزات `agents.*.models["<channel>/*"]`. يمنع هذا حلقات إقلاع Gateway حيث يكون وقت تشغيل القناة قد زال لكن الإعداد لا يزال يطلب من Gateway الارتباط به.
  </Accordion>
  <Accordion title="11c. إكمال الصدفة">
    يتحقق doctor مما إذا كان إكمال الجدولة مثبتًا للصدفة الحالية (zsh أو bash أو fish أو PowerShell):

    - إذا كان ملف تعريف الصدفة يستخدم نمط إكمال ديناميكيًا بطيئًا (`source <(openclaw completion ...)`)، يرقّيه doctor إلى متغير الملف المخزن مؤقتًا الأسرع.
    - إذا كان الإكمال مهيأ في ملف التعريف لكن ملف التخزين المؤقت مفقود، يعيد doctor توليد التخزين المؤقت تلقائيًا.
    - إذا لم يكن أي إكمال مهيأ على الإطلاق، يطلب doctor تثبيته (الوضع التفاعلي فقط؛ يتم التخطي مع `--non-interactive`).

    شغّل `openclaw completion --write-state` لإعادة توليد التخزين المؤقت يدويًا.

  </Accordion>
  <Accordion title="12. فحوصات مصادقة Gateway (رمز محلي)">
    يتحقق doctor من جاهزية مصادقة رمز Gateway المحلي.

    - إذا احتاج وضع الرمز إلى رمز ولا يوجد مصدر رمز، يعرض doctor إنشاء واحد.
    - إذا كان `gateway.auth.token` مُدارًا بواسطة SecretRef لكنه غير متاح، يحذّر doctor ولا يستبدله بنص عادي.
    - يفرض `openclaw doctor --generate-gateway-token` الإنشاء فقط عندما لا يكون أي SecretRef لرمز مهيأ.

  </Accordion>
  <Accordion title="12b. إصلاحات مدركة لـ SecretRef للقراءة فقط">
    تحتاج بعض مسارات الإصلاح إلى فحص بيانات الاعتماد المهيأة دون إضعاف سلوك فشل وقت التشغيل السريع.

    - يستخدم `openclaw doctor --fix` الآن نموذج ملخص SecretRef للقراءة فقط نفسه الذي تستخدمه أوامر عائلة الحالة لإصلاحات إعدادات مستهدفة.
    - مثال: يحاول إصلاح `@username` في `allowFrom` / `groupAllowFrom` لـ Telegram استخدام بيانات اعتماد الروبوت المهيأة عند توفرها.
    - إذا كان رمز روبوت Telegram مهيأ عبر SecretRef لكنه غير متاح في مسار الأمر الحالي، يبلّغ doctor بأن بيانات الاعتماد مهيأة-لكن-غير متاحة ويتخطى الحل التلقائي بدلًا من التعطل أو الإبلاغ خطأً عن الرمز على أنه مفقود.

  </Accordion>
  <Accordion title="13. فحص صحة Gateway + إعادة التشغيل">
    يشغّل doctor فحص صحة ويعرض إعادة تشغيل Gateway عندما يبدو غير صحي.
  </Accordion>
  <Accordion title="13b. جاهزية بحث الذاكرة">
    يتحقق doctor مما إذا كان مزود تضمينات بحث الذاكرة المهيأ جاهزًا للوكيل الافتراضي. يعتمد السلوك على الخلفية والمزود المهيأين:

    - **خلفية QMD**: يختبر ما إذا كان الملف الثنائي `qmd` متاحًا وقابلًا للبدء. إذا لم يكن كذلك، يطبع إرشادات الإصلاح بما في ذلك حزمة npm وخيار مسار ثنائي يدوي.
    - **مزود محلي صريح**: يتحقق من وجود ملف نموذج محلي أو عنوان URL لنموذج بعيد/قابل للتنزيل معروف. إذا كان مفقودًا، يقترح التبديل إلى مزود بعيد.
    - **مزود بعيد صريح** (`openai`، `voyage`، إلخ): يتحقق من وجود مفتاح API في البيئة أو مخزن المصادقة. يطبع تلميحات إصلاح قابلة للتنفيذ إذا كان مفقودًا.
    - **مزود تلقائي**: يتحقق من توفر النموذج المحلي أولًا، ثم يجرب كل مزود بعيد حسب ترتيب الاختيار التلقائي.

    عندما تتوفر نتيجة فحص Gateway مخزنة مؤقتًا (كان Gateway سليمًا وقت الفحص)، تقارن أداة التشخيص نتيجتها مع الإعدادات الظاهرة لـ CLI وتلاحظ أي اختلاف. لا تبدأ أداة التشخيص فحص embedding ping جديدًا في المسار الافتراضي؛ استخدم أمر حالة الذاكرة العميقة عندما تريد فحصًا مباشرًا للمزوّد.

    استخدم `openclaw memory status --deep` للتحقق من جاهزية embedding وقت التشغيل.

  </Accordion>
  <Accordion title="14. تحذيرات حالة القناة">
    إذا كان Gateway سليمًا، تشغّل أداة التشخيص فحص حالة القنوات وتعرض التحذيرات مع إصلاحات مقترحة.
  </Accordion>
  <Accordion title="15. تدقيق إعدادات المشرف + الإصلاح">
    تتحقق أداة التشخيص من إعدادات المشرف المثبّتة (launchd/systemd/schtasks) بحثًا عن القيم الافتراضية المفقودة أو القديمة (مثل تبعيات systemd الخاصة بـ network-online وتأخير إعادة التشغيل). عندما تجد عدم تطابق، توصي بتحديث ويمكنها إعادة كتابة ملف الخدمة/المهمة إلى القيم الافتراضية الحالية.

    ملاحظات:

    - يطلب `openclaw doctor` التأكيد قبل إعادة كتابة إعدادات المشرف.
    - يقبل `openclaw doctor --yes` مطالبات الإصلاح الافتراضية.
    - يطبّق `openclaw doctor --repair` الإصلاحات الموصى بها دون مطالبات.
    - يكتب `openclaw doctor --repair --force` فوق إعدادات المشرف المخصصة.
    - يبقي `OPENCLAW_SERVICE_REPAIR_POLICY=external` أداة التشخيص في وضع القراءة فقط لدورة حياة خدمة Gateway. ما زالت تعرض سلامة الخدمة وتنفّذ الإصلاحات غير المتعلقة بالخدمة، لكنها تتخطى تثبيت/بدء/إعادة بدء/تهيئة الخدمة، وإعادة كتابة إعدادات المشرف، وتنظيف الخدمات القديمة لأن مشرفًا خارجيًا يملك دورة الحياة هذه.
    - على Linux، لا تعيد أداة التشخيص كتابة بيانات الأمر/نقطة الدخول الوصفية بينما تكون وحدة Gateway المطابقة في systemd نشطة. كما تتجاهل الوحدات الإضافية غير القديمة وغير النشطة الشبيهة بـ Gateway أثناء فحص الخدمات المكررة حتى لا تنشئ ملفات الخدمات المصاحبة ضوضاء تنظيف.
    - إذا كان توثيق الرمز يتطلب رمزًا وكان `gateway.auth.token` مُدارًا عبر SecretRef، فإن تثبيت/إصلاح خدمة أداة التشخيص يتحقق من SecretRef لكنه لا يحفظ قيم الرمز النصية الصريحة التي جرى حلّها داخل بيانات بيئة خدمة المشرف الوصفية.
    - تكتشف أداة التشخيص قيم بيئة الخدمة المدارة والمدعومة بـ `.env`/SecretRef التي ضمّنتها عمليات تثبيت LaunchAgent أو systemd أو Windows Scheduled Task القديمة بشكل مضمّن، وتعيد كتابة بيانات الخدمة الوصفية بحيث تُحمَّل تلك القيم من مصدر وقت التشغيل بدلًا من تعريف المشرف.
    - تكتشف أداة التشخيص عندما لا يزال أمر الخدمة يثبّت `--port` قديمًا بعد تغيير `gateway.port`، وتعيد كتابة بيانات الخدمة الوصفية إلى المنفذ الحالي.
    - إذا كان توثيق الرمز يتطلب رمزًا وكان SecretRef الخاص بالرمز المُعدّ غير قابل للحل، تحظر أداة التشخيص مسار التثبيت/الإصلاح مع إرشادات قابلة للتنفيذ.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مهيّأين وكان `gateway.auth.mode` غير مضبوط، تحظر أداة التشخيص التثبيت/الإصلاح حتى يُضبط الوضع صراحة.
    - بالنسبة إلى وحدات systemd الخاصة بمستخدم Linux، تتضمن فحوصات انحراف الرمز في أداة التشخيص الآن مصدري `Environment=` و`EnvironmentFile=` عند مقارنة بيانات توثيق الخدمة الوصفية.
    - ترفض إصلاحات خدمة أداة التشخيص إعادة كتابة خدمة Gateway أو إيقافها أو إعادة تشغيلها من ملف OpenClaw تنفيذي أقدم عندما تكون الإعدادات قد كُتبت آخر مرة بواسطة إصدار أحدث. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - يمكنك دائمًا فرض إعادة كتابة كاملة عبر `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. تشخيصات وقت تشغيل Gateway والمنفذ">
    تفحص أداة التشخيص وقت تشغيل الخدمة (PID، وآخر حالة خروج) وتحذّر عندما تكون الخدمة مثبتة لكنها لا تعمل فعليًا. كما تتحقق من تعارضات المنافذ على منفذ Gateway (الافتراضي `18789`) وتعرض الأسباب المحتملة (Gateway يعمل مسبقًا، نفق SSH).
  </Accordion>
  <Accordion title="17. أفضل ممارسات وقت تشغيل Gateway">
    تحذّر أداة التشخيص عندما تعمل خدمة Gateway على Bun أو مسار Node مُدار بالإصدار (`nvm`، `fnm`، `volta`، `asdf`، إلخ). تتطلب قنوات WhatsApp + Telegram استخدام Node، ويمكن أن تتعطل مسارات مديري الإصدارات بعد الترقيات لأن الخدمة لا تحمّل تهيئة الصدفة لديك. تعرض أداة التشخيص الترحيل إلى تثبيت Node على النظام عند توفره (Homebrew/apt/choco).

    تحتفظ الخدمات المثبتة أو المصلحة حديثًا بجذور البيئة الصريحة (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) وأدلة user-bin الثابتة، لكن أدلة الرجوع الاحتياطية المخمّنة لمديري الإصدارات لا تُكتب إلى PATH الخدمة إلا عندما تكون تلك الأدلة موجودة على القرص. يحافظ هذا على توافق PATH المشرف المُنشأ مع تدقيق الحد الأدنى من PATH نفسه الذي تشغّله أداة التشخيص لاحقًا.

  </Accordion>
  <Accordion title="18. كتابة الإعدادات + بيانات المعالج الوصفية">
    تحفظ أداة التشخيص أي تغييرات في الإعدادات وتضع ختم بيانات المعالج الوصفية لتسجيل تشغيل أداة التشخيص.
  </Accordion>
  <Accordion title="19. نصائح مساحة العمل (النسخ الاحتياطي + نظام الذاكرة)">
    تقترح أداة التشخيص نظام ذاكرة لمساحة العمل عند غيابه، وتطبع نصيحة نسخ احتياطي إذا لم تكن مساحة العمل تحت git بالفعل.

    راجع [/concepts/agent-workspace](/ar/concepts/agent-workspace) للحصول على دليل كامل لبنية مساحة العمل والنسخ الاحتياطي عبر git (يوصى بمستودع GitHub أو GitLab خاص).

  </Accordion>
</AccordionGroup>

## ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
