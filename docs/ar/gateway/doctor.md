---
read_when:
    - إضافة عمليات ترحيل doctor أو تعديلها
    - إدخال تغييرات كاسرة في الإعدادات
sidebarTitle: Doctor
summary: 'أمر Doctor: فحوصات السلامة، وترحيلات الإعدادات، وخطوات الإصلاح'
title: الفحص التشخيصي
x-i18n:
    generated_at: "2026-05-05T08:25:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360f9f7a349e4633ff61d526f1eb5b668b595b4f35c5e0fd2a314715a0599c4c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` هي أداة الإصلاح + الترحيل في OpenClaw. تصلح الإعدادات/الحالة القديمة، وتتحقق من السلامة، وتوفر خطوات إصلاح قابلة للتنفيذ.

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

    اقبل القيم الافتراضية دون طلب تأكيد (بما في ذلك خطوات إصلاح إعادة التشغيل/الخدمة/بيئة العزل عند انطباقها).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    طبّق الإصلاحات الموصى بها دون طلب تأكيد (الإصلاحات + عمليات إعادة التشغيل عندما تكون آمنة).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    طبّق الإصلاحات العنيفة أيضًا (تستبدل إعدادات المشرف المخصصة).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    شغّل دون مطالبات وطبّق عمليات الترحيل الآمنة فقط (تطبيع الإعدادات + نقل الحالة على القرص). يتخطى إجراءات إعادة التشغيل/الخدمة/بيئة العزل التي تتطلب تأكيدًا بشريًا. تعمل عمليات ترحيل الحالة القديمة تلقائيًا عند اكتشافها.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    افحص خدمات النظام بحثًا عن تثبيتات gateway إضافية (launchd/systemd/schtasks).

  </Tab>
</Tabs>

إذا كنت تريد مراجعة التغييرات قبل الكتابة، فافتح ملف الإعدادات أولًا:

```bash
cat ~/.openclaw/openclaw.json
```

## ما الذي يفعله (ملخص)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - تحديث اختياري قبل التشغيل لتثبيتات git (تفاعلي فقط).
    - فحص حداثة بروتوكول واجهة المستخدم (يعيد بناء Control UI عندما يكون مخطط البروتوكول أحدث).
    - فحص السلامة + مطالبة بإعادة التشغيل.
    - ملخص حالة Skills (مؤهلة/ناقصة/محظورة) وحالة Plugin.

  </Accordion>
  <Accordion title="Config and migrations">
    - تطبيع الإعدادات للقيم القديمة.
    - ترحيل إعدادات Talk من حقول `talk.*` المسطحة القديمة إلى `talk.provider` + `talk.providers.<provider>`.
    - فحوصات ترحيل المتصفح لإعدادات إضافة Chrome القديمة وجاهزية Chrome MCP.
    - تحذيرات تجاوز موفر OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - تحذيرات حجب OAuth في Codex (`models.providers.openai-codex`).
    - فحص متطلبات TLS الأساسية لملفات تعريف OpenAI Codex OAuth.
    - تحذيرات قائمة السماح للـ Plugin/الأدوات عندما تكون `plugins.allow` مقيّدة لكن سياسة الأدوات لا تزال تطلب أحرفًا بدلًا أو أدوات مملوكة للـ Plugin.
    - ترحيل الحالة القديمة على القرص (الجلسات/دليل الوكيل/مصادقة WhatsApp).
    - ترحيل مفاتيح عقد بيان Plugin القديم (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - ترحيل مخزن Cron القديم (`jobId`, `schedule.cron`, حقول التسليم/الحمولة في المستوى الأعلى، حمولة `provider`, مهام Webhook احتياطية بسيطة `notify: true`).
    - ترحيل سياسة وقت تشغيل الوكيل القديمة إلى `agents.defaults.agentRuntime` و`agents.list[].agentRuntime`.
    - تنظيف إعدادات Plugin القديمة عندما تكون Plugins مفعّلة؛ وعندما تكون `plugins.enabled=false`، تُعامل مراجع Plugin القديمة كإعدادات احتواء خاملة وتُحفظ.

  </Accordion>
  <Accordion title="State and integrity">
    - فحص ملف قفل الجلسة وتنظيف الأقفال القديمة.
    - إصلاح نصوص الجلسات لفروع إعادة كتابة المطالبات المكررة التي أنشأتها إصدارات 2026.4.24 المتأثرة.
    - اكتشاف علامة قبر استرداد إعادة تشغيل الوكيل الفرعي العالق، مع دعم `--fix` لمسح أعلام الاسترداد الملغاة القديمة حتى لا يستمر بدء التشغيل في معاملة الابن على أنه أُلغيت إعادة تشغيله.
    - فحوصات سلامة الحالة والأذونات (الجلسات، النصوص، دليل الحالة).
    - فحوصات أذونات ملف الإعدادات (chmod 600) عند التشغيل محليًا.
    - سلامة مصادقة النموذج: يتحقق من انتهاء صلاحية OAuth، ويمكنه تحديث الرموز القريبة من الانتهاء، ويبلغ عن حالات التهدئة/التعطيل في ملف تعريف المصادقة.
    - اكتشاف دليل مساحة عمل إضافي (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - إصلاح صورة بيئة العزل عندما تكون بيئة العزل مفعّلة.
    - ترحيل الخدمة القديمة واكتشاف Gateway إضافية.
    - ترحيل حالة قناة Matrix القديمة (في وضع `--fix` / `--repair`).
    - فحوصات وقت تشغيل Gateway (الخدمة مثبتة لكنها لا تعمل؛ تسمية launchd مخزنة مؤقتًا).
    - تحذيرات حالة القنوات (مفحوصة من Gateway قيد التشغيل).
    - فحوصات استجابة WhatsApp لحالة حلقة أحداث Gateway المتدهورة مع استمرار عمل عملاء TUI المحليين؛ يوقف `--fix` عملاء TUI المحليين المتحقق منهم فقط.
    - تدقيق إعدادات المشرف (launchd/systemd/schtasks) مع إصلاح اختياري.
    - تنظيف بيئة الوكيل المضمنة لخدمات gateway التي التقطت قيم shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` أثناء التثبيت أو التحديث.
    - فحوصات أفضل ممارسات وقت تشغيل Gateway (Node مقابل Bun، مسارات مدير الإصدارات).
    - تشخيصات تعارض منفذ Gateway (الافتراضي `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - تحذيرات أمنية لسياسات الرسائل المباشرة المفتوحة.
    - فحوصات مصادقة Gateway لوضع الرمز المحلي (تعرض إنشاء رمز عندما لا يوجد مصدر رمز؛ لا تستبدل إعدادات رمز SecretRef).
    - اكتشاف مشكلات اقتران الجهاز (طلبات اقتران أولية معلّقة، ترقيات دور/نطاق معلّقة، انحراف ذاكرة التخزين المؤقت المحلية القديمة لرمز الجهاز، وانحراف مصادقة سجل الاقتران).

  </Accordion>
  <Accordion title="Workspace and shell">
    - فحص systemd linger على Linux.
    - فحص حجم ملف تمهيد مساحة العمل (تحذيرات الاقتطاع/قرب الحد لملفات السياق).
    - فحص جاهزية Skills للوكيل الافتراضي؛ يبلغ عن المهارات المسموح بها ذات المتطلبات الناقصة من ملفات تنفيذية أو env أو إعدادات أو نظام تشغيل، ويمكن لـ `--fix` تعطيل المهارات غير المتاحة في `skills.entries`.
    - فحص حالة إكمال shell والتثبيت/الترقية التلقائية.
    - فحص جاهزية موفر تضمينات بحث الذاكرة (نموذج محلي، مفتاح API بعيد، أو ملف QMD ثنائي).
    - فحوصات تثبيت المصدر (عدم تطابق مساحة عمل pnpm، أصول واجهة مستخدم ناقصة، ملف tsx ثنائي مفقود).
    - يكتب الإعدادات المحدثة + بيانات معالج الإعداد الوصفية.

  </Accordion>
</AccordionGroup>

## ملء Dreams UI بأثر رجعي وإعادة الضبط

يتضمن مشهد Dreams في Control UI إجراءات **الملء بأثر رجعي** و**إعادة الضبط** و**مسح المؤرض** لسير عمل Dreaming المؤرض. تستخدم هذه الإجراءات أساليب RPC على نمط doctor الخاص بـ gateway، لكنها **ليست** جزءًا من إصلاح/ترحيل `openclaw doctor` في CLI.

ما تفعله:

- **الملء بأثر رجعي** يفحص ملفات `memory/YYYY-MM-DD.md` التاريخية في مساحة العمل النشطة، ويشغّل تمريرة يوميات REM المؤرضة، ويكتب إدخالات ملء بأثر رجعي قابلة للعكس في `DREAMS.md`.
- **إعادة الضبط** تزيل إدخالات يوميات الملء بأثر رجعي المعلّمة فقط من `DREAMS.md`.
- **مسح المؤرض** يزيل فقط إدخالات الذاكرة القصيرة الأمد المؤرضة فقط والمحضّرة التي جاءت من إعادة تشغيل تاريخية ولم تراكم بعد استدعاءً حيًا أو دعمًا يوميًا.

ما لا تفعله **بمفردها**:

- لا تعدّل `MEMORY.md`
- لا تشغّل عمليات ترحيل doctor كاملة
- لا تحضّر تلقائيًا المرشحين المؤرضين في مخزن الترقية القصيرة الأمد الحي إلا إذا شغّلت مسار CLI المحضّر صراحةً أولًا

إذا كنت تريد أن تؤثر إعادة التشغيل التاريخية المؤرضة في مسار الترقية العميقة العادي، فاستخدم تدفق CLI بدلًا من ذلك:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

يحضّر ذلك المرشحين المؤرضين المتينين في مخزن Dreaming القصير الأمد مع إبقاء `DREAMS.md` كسطح مراجعة.

## السلوك التفصيلي والمبررات

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    إذا كان هذا checkout من git وكان doctor يعمل تفاعليًا، فإنه يعرض التحديث (fetch/rebase/build) قبل تشغيل doctor.
  </Accordion>
  <Accordion title="1. Config normalization">
    إذا احتوت الإعدادات على أشكال قيم قديمة (على سبيل المثال `messages.ackReaction` دون تجاوز خاص بالقناة)، فإن doctor يطبعها وفق المخطط الحالي.

    يشمل ذلك حقول Talk المسطحة القديمة. إعدادات Talk العامة الحالية هي `talk.provider` + `talk.providers.<provider>`. يعيد doctor كتابة أشكال `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` القديمة إلى خريطة الموفر.

    يحذّر doctor أيضًا عندما تكون `plugins.allow` غير فارغة وتستخدم سياسة الأدوات
    إدخالات أحرف بدل أو أدوات مملوكة للـ Plugin. يطابق `tools.allow: ["*"]` الأدوات فقط
    من Plugins التي تُحمّل فعليًا؛ ولا يتجاوز قائمة السماح الحصرية للـ Plugin.
    يكتب doctor `plugins.bundledDiscovery: "compat"` لإعدادات قائمة السماح القديمة
    المرحّلة للحفاظ على سلوك الموفرات المضمنة الحالي، ثم
    يشير إلى الإعداد الأشد `"allowlist"`.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    عندما تحتوي الإعدادات على مفاتيح مهملة، ترفض الأوامر الأخرى العمل وتطلب منك تشغيل `openclaw doctor`.

    سيقوم doctor بما يلي:

    - يشرح أي مفاتيح قديمة وُجدت.
    - يعرض الترحيل الذي طبّقه.
    - يعيد كتابة `~/.openclaw/openclaw.json` بالمخطط المحدث.

    تشغّل Gateway أيضًا عمليات ترحيل doctor تلقائيًا عند بدء التشغيل عندما تكتشف تنسيق إعدادات قديمًا، لذلك تُصلح الإعدادات القديمة دون تدخل يدوي. تتولى `openclaw doctor --fix` عمليات ترحيل مخزن مهام Cron.

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
    - بالنسبة إلى القنوات التي تحتوي على `accounts` مسماة لكن ما زالت لديها قيم قناة علوية لحساب واحد، انقل تلك القيم ذات نطاق الحساب إلى الحساب المرقّى المختار لتلك القناة (`accounts.default` لمعظم القنوات؛ يستطيع Matrix الاحتفاظ بهدف مسمى/افتراضي مطابق موجود)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - أزل `agents.defaults.llm`؛ استخدم `models.providers.<id>.timeoutSeconds` لمهل انتظار المزوّد/النموذج البطيء
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - أزل `browser.relayBindHost` (إعداد ترحيل الإضافة القديم)
    - `models.providers.*.api: "openai"` القديمة → `"openai-completions"` (يتجاوز بدء Gateway أيضًا المزوّدين الذين تكون قيمة `api` لديهم مضبوطة على قيمة تعداد مستقبلية أو غير معروفة بدلًا من الفشل المغلق)

    تتضمن تحذيرات Doctor أيضًا إرشادات الحساب الافتراضي للقنوات متعددة الحسابات:

    - إذا ضُبط إدخالان أو أكثر من `channels.<channel>.accounts` من دون `channels.<channel>.defaultAccount` أو `accounts.default`، يحذّر Doctor من أن توجيه الرجوع الاحتياطي قد يختار حسابًا غير متوقع.
    - إذا ضُبط `channels.<channel>.defaultAccount` على معرّف حساب غير معروف، يحذّر Doctor ويسرد معرّفات الحسابات المكوّنة.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    إذا أضفت `models.providers.opencode` أو `opencode-zen` أو `opencode-go` يدويًا، فسيؤدي ذلك إلى تجاوز كتالوج OpenCode المدمج من `@mariozechner/pi-ai`. يمكن أن يفرض ذلك النماذج على API خاطئ أو يصفّر التكاليف. يحذّر Doctor حتى تتمكن من إزالة التجاوز واستعادة توجيه API والتكاليف لكل نموذج.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    إذا كانت إعدادات المتصفح لديك ما زالت تشير إلى مسار إضافة Chrome المحذوف، يطبعها Doctor إلى نموذج إرفاق Chrome MCP المحلي للمضيف الحالي:

    - يصبح `browser.profiles.*.driver: "extension"` هو `"existing-session"`
    - تتم إزالة `browser.relayBindHost`

    يدقق Doctor أيضًا مسار Chrome MCP المحلي للمضيف عند استخدام `defaultProfile: "user"` أو ملف تعريف `existing-session` مكوّن:

    - يتحقق مما إذا كان Google Chrome مثبتًا على المضيف نفسه لملفات التعريف الافتراضية ذات الاتصال التلقائي
    - يتحقق من إصدار Chrome المكتشف ويحذّر عندما يكون أقل من Chrome 144
    - يذكّرك بتمكين التصحيح عن بُعد في صفحة فحص المتصفح (على سبيل المثال `chrome://inspect/#remote-debugging` أو `brave://inspect/#remote-debugging` أو `edge://inspect/#remote-debugging`)

    لا يستطيع Doctor تمكين الإعداد الخاص بجانب Chrome نيابة عنك. لا يزال Chrome MCP المحلي للمضيف يتطلب:

    - متصفحًا مبنيًا على Chromium بإصدار 144+ على مضيف Gateway/Node
    - تشغيل المتصفح محليًا
    - تمكين التصحيح عن بُعد في ذلك المتصفح
    - الموافقة على مطالبة موافقة الإرفاق الأولى في المتصفح

    الجاهزية هنا تتعلق فقط بمتطلبات الإرفاق المحلي. يحافظ Existing-session على حدود مسار Chrome MCP الحالية؛ ولا تزال المسارات المتقدمة مثل `responsebody` وتصدير PDF واعتراض التنزيل وإجراءات الدُفعات تتطلب متصفحًا مُدارًا أو ملف تعريف CDP خامًا.

    لا ينطبق هذا الفحص على Docker أو sandbox أو remote-browser أو غيرها من تدفقات headless. تواصل هذه التدفقات استخدام CDP الخام.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    عند تكوين ملف تعريف OpenAI Codex OAuth، يفحص Doctor نقطة نهاية تخويل OpenAI للتحقق من أن مكدس TLS المحلي الخاص بـ Node/OpenSSL يستطيع التحقق من سلسلة الشهادات. إذا فشل الفحص بسبب خطأ شهادة (على سبيل المثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` أو شهادة منتهية الصلاحية أو شهادة موقعة ذاتيًا)، يطبع Doctor إرشادات إصلاح خاصة بالمنصة. على macOS مع Homebrew Node، يكون الإصلاح عادةً `brew postinstall ca-certificates`. مع `--deep`، يعمل الفحص حتى لو كان Gateway سليمًا.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    إذا سبق أن أضفت إعدادات نقل OpenAI قديمة ضمن `models.providers.openai-codex`، فيمكنها حجب مسار مزوّد Codex OAuth المدمج الذي تستخدمه الإصدارات الأحدث تلقائيًا. يحذّر Doctor عندما يرى إعدادات النقل القديمة هذه إلى جانب Codex OAuth حتى تتمكن من إزالة تجاوز النقل القديم أو إعادة كتابته واستعادة سلوك التوجيه/الرجوع الاحتياطي المدمج. ما زالت الوكلاء المخصصة والتجاوزات المعتمدة على الرؤوس فقط مدعومة ولا تطلق هذا التحذير.
  </Accordion>
  <Accordion title="2f. Codex plugin route warnings">
    عند تمكين Codex plugin المضمّن، يتحقق Doctor أيضًا مما إذا كانت مراجع النموذج الأساسية `openai-codex/*` ما زالت تُحل عبر مشغّل PI الافتراضي. هذا المزيج صالح عندما تريد مصادقة Codex OAuth/الاشتراك عبر PI، لكنه سهل الالتباس مع عدة app-server الأصلية الخاصة بـ Codex. يحذّر Doctor ويشير إلى صيغة app-server الصريحة: `openai/*` مع `agentRuntime.id: "codex"` أو `OPENCLAW_AGENT_RUNTIME=codex`.

    لا يصلح Doctor هذا تلقائيًا لأن كلا المسارين صالحان:

    - `openai-codex/*` + PI تعني "استخدم مصادقة Codex OAuth/الاشتراك عبر مشغّل OpenClaw العادي."
    - `openai/*` + `agentRuntime.id: "codex"` تعني "شغّل الدور المضمّن عبر Codex app-server الأصلي."
    - `/codex ...` تعني "تحكم في محادثة Codex أصلية من الدردشة أو اربطها."
    - `/acp ...` أو `runtime: "acp"` تعني "استخدم محوّل ACP/acpx الخارجي."

    إذا ظهر التحذير، اختر المسار الذي قصدته وحرر الإعدادات يدويًا. أبقِ التحذير كما هو عندما يكون PI Codex OAuth مقصودًا.

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    يفحص Doctor أيضًا مخزن الجلسات النشطة بحثًا عن حالة توجيه قديمة أُنشئت تلقائيًا بعد نقل النموذج أو بيئة التشغيل الافتراضية/الاحتياطية المكوّنة بعيدًا عن مسار مملوك لـ plugin مثل Codex.

    يستطيع `openclaw doctor --fix` مسح الحالة القديمة المنشأة تلقائيًا مثل تثبيتات النماذج `modelOverrideSource: "auto"`، وبيانات تعريف نموذج بيئة التشغيل، ومعرّفات العدة المثبتة، وروابط جلسة CLI، وتجاوزات ملف تعريف المصادقة التلقائية عندما لا يكون المسار المالك لها مكوّنًا بعد الآن. يتم الإبلاغ عن اختيارات نموذج الجلسة الصريحة للمستخدم أو القديمة للمراجعة اليدوية وتُترك دون تغيير؛ بدّلها باستخدام `/model ...` أو `/new`، أو أعد ضبط الجلسة عندما لا يعود ذلك المسار مقصودًا.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    يستطيع Doctor ترحيل التخطيطات الأقدم على القرص إلى البنية الحالية:

    - مخزن الجلسات + النصوص:
      - من `~/.openclaw/sessions/` إلى `~/.openclaw/agents/<agentId>/sessions/`
    - دليل الوكيل:
      - من `~/.openclaw/agent/` إلى `~/.openclaw/agents/<agentId>/agent/`
    - حالة مصادقة WhatsApp (Baileys):
      - من `~/.openclaw/credentials/*.json` القديمة (باستثناء `oauth.json`)
      - إلى `~/.openclaw/credentials/whatsapp/<accountId>/...` (معرّف الحساب الافتراضي: `default`)

    هذه الترحيطات تُبذل فيها أفضل محاولة وهي قابلة للتكرار دون أثر إضافي؛ سيصدر Doctor تحذيرات عندما يترك أي مجلدات قديمة كنسخ احتياطية. يقوم Gateway/CLI أيضًا بترحيل الجلسات القديمة ودليل الوكيل تلقائيًا عند بدء التشغيل بحيث يستقر السجل/المصادقة/النماذج في المسار الخاص بكل وكيل دون تشغيل Doctor يدويًا. تقارن تسوية موفر التحدث/خريطة المزوّد الآن بالمساواة البنيوية، لذلك لم تعد الاختلافات الناتجة عن ترتيب المفاتيح فقط تطلق تغييرات `doctor --fix` متكررة بلا أثر.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    يفحص Doctor كل بيانات manifest الخاصة بالـ plugin المثبتة بحثًا عن مفاتيح إمكانات علوية مهملة (`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders`). عند العثور عليها، يعرض نقلها إلى كائن `contracts` وإعادة كتابة ملف manifest في مكانه. هذا الترحيل قابل للتكرار دون أثر إضافي؛ إذا كان مفتاح `contracts` يحتوي بالفعل على القيم نفسها، تتم إزالة المفتاح القديم دون تكرار البيانات.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    يتحقق Doctor أيضًا من مخزن مهام cron (`~/.openclaw/cron/jobs.json` افتراضيًا، أو `cron.store` عند تجاوزه) بحثًا عن صيغ مهام قديمة ما زال المجدول يقبلها للتوافق.

    تشمل عمليات تنظيف cron الحالية:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - حقول الحمولة على المستوى الأعلى (`message`، `model`، `thinking`، ...) → `payload`
    - حقول التسليم على المستوى الأعلى (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - الأسماء المستعارة لتسليم `provider` في الحمولة → `delivery.channel` صريح
    - مهام الرجوع الاحتياطي Webhook القديمة البسيطة `notify: true` → `delivery.mode="webhook"` صريح مع `delivery.to=cron.webhook`

    لا يرحّل Doctor تلقائيًا مهام `notify: true` إلا عندما يستطيع فعل ذلك دون تغيير السلوك. إذا جمعت مهمة بين رجوع احتياطي قديم للإشعار ووضع تسليم موجود غير Webhook، يحذّر Doctor ويترك تلك المهمة للمراجعة اليدوية.

    على Linux، تحذّر أداة الفحص أيضًا عندما لا يزال crontab الخاص بالمستخدم يستدعي `~/.openclaw/bin/ensure-whatsapp.sh` القديم. هذا السكربت المحلي للمضيف لا تتم صيانته بواسطة OpenClaw الحالي، وقد يكتب رسائل `Gateway inactive` خاطئة إلى `~/.openclaw/logs/whatsapp-health.log` عندما يتعذر على cron الوصول إلى ناقل مستخدم systemd. أزِل إدخال crontab القديم باستخدام `crontab -e`؛ واستخدم `openclaw channels status --probe` و`openclaw doctor` و`openclaw gateway status` لفحوصات السلامة الحالية.

  </Accordion>
  <Accordion title="3c. تنظيف قفل الجلسة">
    تفحص أداة الفحص كل دليل جلسة وكيل بحثًا عن ملفات أقفال كتابة قديمة — وهي ملفات تُترك عندما تخرج جلسة بشكل غير طبيعي. لكل ملف قفل تعثر عليه، تُبلّغ عن: المسار، وPID، وما إذا كان PID لا يزال نشطًا، وعمر القفل، وما إذا كان يُعد قديمًا (PID ميت أو أقدم من 30 دقيقة). في وضع `--fix` / `--repair`، تزيل ملفات القفل القديمة تلقائيًا؛ وإلا فتطبع ملاحظة وتطلب منك إعادة التشغيل باستخدام `--fix`.
  </Accordion>
  <Accordion title="3d. إصلاح فرع نص جلسة المحادثة">
    تفحص أداة الفحص ملفات JSONL لجلسات الوكيل بحثًا عن شكل الفرع المكرر الذي أنشأه خطأ إعادة كتابة نص المحادثة في 2026.4.24: دور مستخدم مهجور يحتوي على سياق تشغيل داخلي من OpenClaw، إضافة إلى فرع شقيق نشط يحتوي على نفس مطالبة المستخدم المرئية. في وضع `--fix` / `--repair`، تنسخ أداة الفحص كل ملف متأثر احتياطيًا بجانب الأصل، ثم تعيد كتابة نص المحادثة إلى الفرع النشط بحيث لا يعود قرّاء سجل Gateway والذاكرة يرون أدوارًا مكررة.
  </Accordion>
  <Accordion title="4. فحوصات سلامة الحالة (استمرارية الجلسات، والتوجيه، والسلامة)">
    دليل الحالة هو جذع الدماغ التشغيلي. إذا اختفى، فستفقد الجلسات وبيانات الاعتماد والسجلات والإعدادات (ما لم تكن لديك نسخ احتياطية في مكان آخر).

    تتحقق أداة الفحص من:

    - **دليل الحالة مفقود**: تحذّر من فقدان كارثي للحالة، وتطلب إعادة إنشاء الدليل، وتذكّرك بأنها لا تستطيع استعادة البيانات المفقودة.
    - **أذونات دليل الحالة**: تتحقق من قابلية الكتابة؛ وتعرض إصلاح الأذونات (وتُصدر تلميح `chown` عند اكتشاف عدم تطابق المالك/المجموعة).
    - **دليل حالة متزامن مع السحابة على macOS**: تحذّر عندما تُحل الحالة ضمن iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) أو `~/Library/CloudStorage/...` لأن المسارات المدعومة بالمزامنة قد تسبب إدخال/إخراج أبطأ وتسابقات قفل/مزامنة.
    - **دليل حالة على SD أو eMMC في Linux**: تحذّر عندما تُحل الحالة إلى مصدر تركيب `mmcblk*`، لأن الإدخال/الإخراج العشوائي المدعوم بـ SD أو eMMC قد يكون أبطأ ويتآكل أسرع تحت كتابات الجلسات وبيانات الاعتماد.
    - **دلائل الجلسات مفقودة**: يلزم وجود `sessions/` ودليل مخزن الجلسات للحفاظ على السجل وتجنب أعطال `ENOENT`.
    - **عدم تطابق نص المحادثة**: تحذّر عندما تكون لإدخالات الجلسات الحديثة ملفات نص محادثة مفقودة.
    - **جلسة رئيسية "JSONL بسطر واحد"**: تضع علامة عندما يحتوي نص المحادثة الرئيسي على سطر واحد فقط (السجل لا يتراكم).
    - **أدلة حالة متعددة**: تحذّر عندما توجد عدة مجلدات `~/.openclaw` عبر أدلة المنزل أو عندما يشير `OPENCLAW_STATE_DIR` إلى مكان آخر (يمكن أن ينقسم السجل بين التثبيتات).
    - **تذكير الوضع البعيد**: إذا كان `gateway.mode=remote`، تذكّرك أداة الفحص بتشغيلها على المضيف البعيد (الحالة موجودة هناك).
    - **أذونات ملف الإعدادات**: تحذّر إذا كان `~/.openclaw/openclaw.json` قابلاً للقراءة من المجموعة/العالم، وتعرض تشديده إلى `600`.

  </Accordion>
  <Accordion title="5. سلامة مصادقة النموذج (انتهاء OAuth)">
    تفحص أداة الفحص ملفات تعريف OAuth في مخزن المصادقة، وتحذّر عندما تكون الرموز على وشك الانتهاء/منتهية، ويمكنها تحديثها عندما يكون ذلك آمنًا. إذا كان ملف تعريف Anthropic OAuth/الرمز قديمًا، فإنها تقترح مفتاح Anthropic API أو مسار setup-token الخاص بـ Anthropic. لا تظهر مطالبات التحديث إلا عند التشغيل تفاعليًا (TTY)؛ ويتجاوز `--non-interactive` محاولات التحديث.

    عندما يفشل تحديث OAuth بشكل دائم (مثل `refresh_token_reused` أو `invalid_grant` أو عندما يخبرك مزود بتسجيل الدخول مرة أخرى)، تُبلّغ أداة الفحص بأن إعادة المصادقة مطلوبة وتطبع أمر `openclaw models auth login --provider ...` الدقيق لتشغيله.

    تُبلّغ أداة الفحص أيضًا عن ملفات تعريف المصادقة غير القابلة للاستخدام مؤقتًا بسبب:

    - فترات تهدئة قصيرة (حدود المعدل/انتهاء المهلة/فشل المصادقة)
    - تعطيلات أطول (فشل الفوترة/الرصيد)

  </Accordion>
  <Accordion title="6. التحقق من نموذج الخطافات">
    إذا تم تعيين `hooks.gmail.model`، تتحقق أداة الفحص من مرجع النموذج مقابل الفهرس وقائمة السماح، وتحذّر عندما لا يمكن حله أو يكون غير مسموح به.
  </Accordion>
  <Accordion title="7. إصلاح صورة صندوق العزل">
    عندما يكون العزل مفعّلًا، تتحقق أداة الفحص من صور Docker وتعرض بناءها أو التبديل إلى الأسماء القديمة إذا كانت الصورة الحالية مفقودة.
  </Accordion>
  <Accordion title="7b. تنظيف تثبيت Plugin">
    تزيل أداة الفحص حالة تجهيز تبعيات Plugin القديمة التي أنشأها OpenClaw في وضع `openclaw doctor --fix` / `openclaw doctor --repair`. يغطي ذلك جذور التبعيات المولدة القديمة، وأدلة مراحل التثبيت القديمة، والبقايا المحلية للحزم من كود إصلاح تبعيات Plugin المضمن الأقدم، ونسخ npm المُدارة اليتيمة أو المستعادة من Plugins `@openclaw/*` المضمنة التي يمكن أن تحجب البيان المضمن الحالي.

    يمكن لأداة الفحص أيضًا إعادة تثبيت Plugins القابلة للتنزيل المفقودة عندما تشير إليها الإعدادات لكن سجل Plugin المحلي لا يستطيع العثور عليها. تشمل الأمثلة `plugins.entries` المادية، وإعدادات القنوات/المزودين/البحث المكوّنة، وبيئات تشغيل الوكلاء المكوّنة. أثناء تحديثات الحزم، تتجنب أداة الفحص تشغيل إصلاح Plugin عبر مدير الحزم بينما يتم تبديل الحزمة الأساسية؛ شغّل `openclaw doctor --fix` مرة أخرى بعد التحديث إذا كان Plugin مكوّن لا يزال يحتاج إلى استرداد. لا يشغّل بدء Gateway ولا إعادة تحميل الإعدادات مديري الحزم؛ تظل عمليات تثبيت Plugin عملًا صريحًا عبر أداة الفحص/التثبيت/التحديث.

  </Accordion>
  <Accordion title="8. عمليات ترحيل خدمة Gateway وتلميحات التنظيف">
    تكتشف أداة الفحص خدمات Gateway القديمة (launchd/systemd/schtasks) وتعرض إزالتها وتثبيت خدمة OpenClaw باستخدام منفذ Gateway الحالي. يمكنها أيضًا فحص خدمات إضافية شبيهة بـ Gateway وطباعة تلميحات تنظيف. تُعد خدمات OpenClaw Gateway المسماة حسب ملف التعريف خدمات من الدرجة الأولى ولا تُوسم بأنها "إضافية".

    على Linux، إذا كانت خدمة Gateway على مستوى المستخدم مفقودة لكن توجد خدمة OpenClaw Gateway على مستوى النظام، لا تثبّت أداة الفحص خدمة ثانية على مستوى المستخدم تلقائيًا. افحص باستخدام `openclaw gateway status --deep` أو `openclaw doctor --deep`، ثم أزِل النسخة المكررة أو عيّن `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يكون مشرف نظام خارجي مالكًا لدورة حياة Gateway.

  </Accordion>
  <Accordion title="8b. ترحيل بدء Matrix">
    عندما يكون لدى حساب قناة Matrix ترحيل حالة قديم معلق أو قابل للتنفيذ، تنشئ أداة الفحص (في وضع `--fix` / `--repair`) لقطة قبل الترحيل ثم تشغّل خطوات الترحيل بأفضل جهد: ترحيل حالة Matrix القديمة وتحضير الحالة المشفرة القديمة. كلتا الخطوتين غير قاتلتين؛ تُسجّل الأخطاء ويستمر بدء التشغيل. في وضع القراءة فقط (`openclaw doctor` دون `--fix`) يتم تجاوز هذا الفحص بالكامل.
  </Accordion>
  <Accordion title="8c. إقران الأجهزة وانحراف المصادقة">
    تفحص أداة الفحص الآن حالة إقران الأجهزة كجزء من تمرير السلامة العادي.

    ما تُبلّغ عنه:

    - طلبات إقران أول مرة معلقة
    - ترقيات دور معلقة للأجهزة المقترنة بالفعل
    - ترقيات نطاق معلقة للأجهزة المقترنة بالفعل
    - إصلاحات عدم تطابق المفتاح العام حيث لا يزال معرّف الجهاز مطابقًا لكن هوية الجهاز لم تعد تطابق السجل المعتمد
    - سجلات مقترنة تفتقد رمزًا نشطًا لدور معتمد
    - رموز مقترنة انحرفت نطاقاتها خارج خط أساس الإقران المعتمد
    - إدخالات رموز أجهزة مخزنة محليًا للجهاز الحالي تسبق تدوير رمز من جهة Gateway أو تحمل بيانات نطاق وصفية قديمة

    لا توافق أداة الفحص تلقائيًا على طلبات الإقران ولا تدوّر رموز الأجهزة تلقائيًا. بل تطبع الخطوات التالية الدقيقة:

    - افحص الطلبات المعلقة باستخدام `openclaw devices list`
    - وافق على الطلب الدقيق باستخدام `openclaw devices approve <requestId>`
    - دوّر رمزًا جديدًا باستخدام `openclaw devices rotate --device <deviceId> --role <role>`
    - أزِل سجلًا قديمًا وأعد الموافقة عليه باستخدام `openclaw devices remove <deviceId>`

    يعالج هذا الفجوة الشائعة "مقترن بالفعل لكن لا يزال يتلقى طلب الإقران": تميز أداة الفحص الآن بين الإقران لأول مرة وترقيات الدور/النطاق المعلقة وانحراف الرمز/هوية الجهاز القديمة.

  </Accordion>
  <Accordion title="9. تحذيرات الأمان">
    تُصدر أداة الفحص تحذيرات عندما يكون مزود مفتوحًا للرسائل المباشرة دون قائمة سماح، أو عندما تُضبط سياسة بطريقة خطرة.
  </Accordion>
  <Accordion title="10. استمرار systemd (Linux)">
    إذا كان التشغيل كخدمة مستخدم systemd، تتأكد أداة الفحص من تمكين الاستمرار بحيث يبقى Gateway حيًا بعد تسجيل الخروج.
  </Accordion>
  <Accordion title="11. حالة مساحة العمل (Skills، وPlugins، والدلائل القديمة)">
    تطبع أداة الفحص ملخصًا لحالة مساحة العمل للوكيل الافتراضي:

    - **حالة Skills**: تحصي Skills المؤهلة، وناقصة المتطلبات، والمحظورة بقائمة السماح.
    - **دلائل مساحة العمل القديمة**: تحذّر عندما توجد `~/openclaw` أو دلائل مساحة عمل قديمة أخرى إلى جانب مساحة العمل الحالية.
    - **حالة Plugin**: تحصي Plugins المفعّلة/المعطلة/التي بها أخطاء؛ وتعرض معرّفات Plugin لأي أخطاء؛ وتُبلّغ عن قدرات Plugin الحزمة.
    - **تحذيرات توافق Plugin**: تضع علامة على Plugins التي لديها مشكلات توافق مع بيئة التشغيل الحالية.
    - **تشخيصات Plugin**: تُظهر أي تحذيرات أو أخطاء وقت التحميل صادرة عن سجل Plugin.

  </Accordion>
  <Accordion title="11b. حجم ملف التمهيد">
    تتحقق أداة الفحص مما إذا كانت ملفات تمهيد مساحة العمل (مثل `AGENTS.md` أو `CLAUDE.md` أو ملفات سياق محقونة أخرى) قريبة من ميزانية الأحرف المكوّنة أو تتجاوزها. تُبلّغ عن عدد الأحرف الخام مقابل المحقونة لكل ملف، ونسبة الاقتطاع، وسبب الاقتطاع (`max/file` أو `max/total`)، وإجمالي الأحرف المحقونة كنسبة من الميزانية الإجمالية. عندما تُقتطع الملفات أو تقترب من الحد، تطبع أداة الفحص نصائح لضبط `agents.defaults.bootstrapMaxChars` و`agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. تنظيف Plugin قناة قديم">
    عندما يزيل `openclaw doctor --fix` Plugin قناة مفقودًا، فإنه يزيل أيضًا إعدادات القناة المتدلية التي كانت تشير إلى ذلك Plugin: إدخالات `channels.<id>`، وأهداف Heartbeat التي سمّت القناة، وتجاوزات `agents.*.models["<channel>/*"]`. يمنع هذا حلقات تشغيل Gateway حيث تختفي بيئة تشغيل القناة لكن الإعدادات لا تزال تطلب من Gateway الارتباط بها.
  </Accordion>
  <Accordion title="11c. إكمال الصدفة">
    تتحقق أداة الفحص مما إذا كان إكمال Tab مثبتًا للصدفة الحالية (zsh أو bash أو fish أو PowerShell):

    - إذا كان ملف تعريف الصدفة يستخدم نمط إكمال ديناميكيًا بطيئًا (`source <(openclaw completion ...)`)، تقوم أداة الفحص بترقيته إلى متغير ملف مخبأ أسرع.
    - إذا كان الإكمال مكوّنًا في ملف التعريف لكن ملف الذاكرة المخبأة مفقود، تعيد أداة الفحص توليد الذاكرة المخبأة تلقائيًا.
    - إذا لم يكن أي إكمال مكوّنًا على الإطلاق، تطلب أداة الفحص تثبيته (الوضع التفاعلي فقط؛ يُتجاوز مع `--non-interactive`).

    شغّل `openclaw completion --write-state` لإعادة توليد الذاكرة المخبأة يدويًا.

  </Accordion>
  <Accordion title="12. فحوصات مصادقة Gateway (رمز محلي)">
    تتحقق أداة الفحص من جاهزية مصادقة رمز Gateway المحلي.

    - إذا كان وضع الرمز يحتاج إلى رمز ولا يوجد مصدر رمز، تعرض أداة الفحص توليد واحد.
    - إذا كان `gateway.auth.token` مُدارًا بواسطة SecretRef لكنه غير متاح، تحذّر أداة الفحص ولا تستبدله بنص صريح.
    - يفرض `openclaw doctor --generate-gateway-token` التوليد فقط عندما لا يكون هناك SecretRef لرمز مكوّن.

  </Accordion>
  <Accordion title="12b. إصلاحات مراعية لـ SecretRef في وضع القراءة فقط">
    تحتاج بعض تدفقات الإصلاح إلى فحص بيانات الاعتماد المكوّنة دون إضعاف سلوك الفشل السريع في وقت التشغيل.

    - يستخدم `openclaw doctor --fix` الآن نموذج ملخص SecretRef للقراءة فقط نفسه الذي تستخدمه أوامر عائلة الحالة لإصلاحات الإعدادات المستهدفة.
    - مثال: تحاول عملية إصلاح Telegram `allowFrom` / `groupAllowFrom` `@username` استخدام بيانات اعتماد البوت المضبوطة عند توفرها.
    - إذا كان رمز بوت Telegram مضبوطا عبر SecretRef لكنه غير متاح في مسار الأمر الحالي، يبلّغ doctor بأن بيانات الاعتماد مضبوطة لكنها غير متاحة، ويتخطى الحل التلقائي بدلا من التعطل أو الإبلاغ خطأ بأن الرمز مفقود.

  </Accordion>
  <Accordion title="13. فحص صحة Gateway + إعادة التشغيل">
    يجري Doctor فحص صحة ويعرض إعادة تشغيل Gateway عندما يبدو غير سليم.
  </Accordion>
  <Accordion title="13b. جاهزية بحث الذاكرة">
    يتحقق Doctor مما إذا كان موفر تضمين بحث الذاكرة المضبوط جاهزا للوكيل الافتراضي. يعتمد السلوك على الخلفية والموفر المضبوطين:

    - **خلفية QMD**: يفحص ما إذا كان الملف الثنائي `qmd` متاحا وقابلا للبدء. إن لم يكن كذلك، يطبع إرشادات إصلاح تتضمن حزمة npm وخيار مسار يدوي للملف الثنائي.
    - **موفر محلي صريح**: يتحقق من وجود ملف نموذج محلي أو عنوان URL معروف لنموذج بعيد/قابل للتنزيل. إذا كان مفقودا، يقترح التبديل إلى موفر بعيد.
    - **موفر بعيد صريح** (`openai`، `voyage`، إلخ): يتحقق من وجود مفتاح API في البيئة أو مخزن المصادقة. يطبع تلميحات إصلاح قابلة للتنفيذ إذا كان مفقودا.
    - **موفر تلقائي**: يتحقق من توفر النموذج المحلي أولا، ثم يجرّب كل موفر بعيد بترتيب الاختيار التلقائي.

    عند توفر نتيجة فحص Gateway مخزنة مؤقتا (كان Gateway سليما وقت الفحص)، يطابق doctor نتيجتها مع الإعدادات المرئية لـ CLI ويشير إلى أي اختلاف. لا يبدأ Doctor اختبار تضمين جديدا على المسار الافتراضي؛ استخدم أمر حالة الذاكرة العميق عندما تريد فحصا حيا للموفر.

    استخدم `openclaw memory status --deep` للتحقق من جاهزية التضمين وقت التشغيل.

  </Accordion>
  <Accordion title="14. تحذيرات حالة القناة">
    إذا كان Gateway سليما، يجري doctor فحص حالة القناة ويبلغ عن التحذيرات مع إصلاحات مقترحة.
  </Accordion>
  <Accordion title="15. تدقيق إعدادات المشرف + الإصلاح">
    يتحقق Doctor من إعدادات المشرف المثبتة (launchd/systemd/schtasks) بحثا عن الإعدادات الافتراضية المفقودة أو القديمة (مثل اعتماديات systemd على network-online وتأخير إعادة التشغيل). عندما يجد عدم تطابق، يوصي بتحديث ويمكنه إعادة كتابة ملف الخدمة/المهمة إلى الإعدادات الافتراضية الحالية.

    ملاحظات:

    - يطلب `openclaw doctor` التأكيد قبل إعادة كتابة إعدادات المشرف.
    - يقبل `openclaw doctor --yes` مطالبات الإصلاح الافتراضية.
    - يطبق `openclaw doctor --repair` الإصلاحات الموصى بها دون مطالبات.
    - يكتب `openclaw doctor --repair --force` فوق إعدادات المشرف المخصصة.
    - يحافظ `OPENCLAW_SERVICE_REPAIR_POLICY=external` على doctor للقراءة فقط لدورة حياة خدمة Gateway. لا يزال يبلغ عن صحة الخدمة ويشغل إصلاحات غير متعلقة بالخدمة، لكنه يتخطى تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة، وإعادة كتابة إعدادات المشرف، وتنظيف الخدمات القديمة لأن مشرفا خارجيا يملك دورة الحياة تلك.
    - على Linux، لا يعيد doctor كتابة بيانات تعريف الأمر/نقطة الدخول أثناء نشاط وحدة Gateway systemd المطابقة. كما يتجاهل وحدات Gateway الشبيهة الإضافية غير القديمة وغير النشطة أثناء فحص الخدمات المكررة حتى لا تنشئ ملفات الخدمات المصاحبة ضجيجا في التنظيف.
    - إذا كانت مصادقة الرمز تتطلب رمزا وكان `gateway.auth.token` مدارا بواسطة SecretRef، فإن تثبيت/إصلاح خدمة doctor يتحقق من SecretRef لكنه لا يحفظ قيم الرمز النصية الصريحة المحلولة في بيانات تعريف بيئة خدمة المشرف.
    - يكتشف Doctor قيم بيئة الخدمة المدارة والمدعومة بـ `.env`/SecretRef التي ضمّنتها تثبيتات LaunchAgent أو systemd أو Windows Scheduled Task القديمة بشكل مضمّن، ويعيد كتابة بيانات تعريف الخدمة بحيث تُحمّل تلك القيم من مصدر وقت التشغيل بدلا من تعريف المشرف.
    - يكتشف Doctor عندما لا يزال أمر الخدمة يثبّت `--port` قديما بعد تغيير `gateway.port` ويعيد كتابة بيانات تعريف الخدمة إلى المنفذ الحالي.
    - إذا كانت مصادقة الرمز تتطلب رمزا وكان SecretRef للرمز المضبوط غير محلول، يحظر doctor مسار التثبيت/الإصلاح مع إرشادات قابلة للتنفيذ.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مضبوطين وكان `gateway.auth.mode` غير مضبوط، يحظر doctor التثبيت/الإصلاح حتى يتم ضبط الوضع صراحة.
    - بالنسبة إلى وحدات Linux user-systemd، تشمل فحوصات انحراف رمز doctor الآن مصدري `Environment=` و`EnvironmentFile=` عند مقارنة بيانات تعريف مصادقة الخدمة.
    - ترفض إصلاحات خدمة Doctor إعادة كتابة خدمة Gateway أو إيقافها أو إعادة تشغيلها من ملف OpenClaw ثنائي أقدم عندما تكون الإعدادات قد كُتبت آخر مرة بواسطة إصدار أحدث. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - يمكنك دائما فرض إعادة كتابة كاملة عبر `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. تشخيصات وقت تشغيل Gateway + المنفذ">
    يفحص Doctor وقت تشغيل الخدمة (PID، وحالة الخروج الأخيرة) ويحذر عندما تكون الخدمة مثبتة لكنها لا تعمل فعليا. كما يتحقق من تعارضات المنافذ على منفذ Gateway (الافتراضي `18789`) ويبلغ عن الأسباب المحتملة (Gateway يعمل بالفعل، نفق SSH).
  </Accordion>
  <Accordion title="17. أفضل ممارسات وقت تشغيل Gateway">
    يحذر Doctor عندما تعمل خدمة Gateway على Bun أو مسار Node مدار بالإصدارات (`nvm`، `fnm`، `volta`، `asdf`، إلخ). تتطلب قنوات WhatsApp + Telegram استخدام Node، ويمكن أن تتعطل مسارات مديري الإصدارات بعد الترقيات لأن الخدمة لا تحمل تهيئة الصدفة الخاصة بك. يعرض Doctor الترحيل إلى تثبيت Node نظامي عند توفره (Homebrew/apt/choco).

    تستخدم LaunchAgents على macOS المثبتة أو المصلحة حديثا PATH نظاميا قانونيا (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) بدلا من نسخ PATH للصدفة التفاعلية، لذلك لا تغير أدلة Volta وasdf وfnm وpnpm ومديري الإصدارات الأخرى أي عمليات Node فرعية يتم حلها. لا تزال خدمات Linux تحتفظ بجذور البيئة الصريحة (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) وأدلة user-bin مستقرة، لكن أدلة الرجوع التخمينية لمديري الإصدارات لا تُكتب إلى PATH الخدمة إلا عندما تكون تلك الأدلة موجودة على القرص.

  </Accordion>
  <Accordion title="18. كتابة الإعدادات + بيانات تعريف المعالج">
    يحفظ Doctor أي تغييرات في الإعدادات ويختم بيانات تعريف المعالج لتسجيل تشغيل doctor.
  </Accordion>
  <Accordion title="19. تلميحات مساحة العمل (النسخ الاحتياطي + نظام الذاكرة)">
    يقترح Doctor نظام ذاكرة لمساحة العمل عند غيابه ويطبع تلميح نسخ احتياطي إذا لم تكن مساحة العمل تحت git بالفعل.

    راجع [/concepts/agent-workspace](/ar/concepts/agent-workspace) للحصول على دليل كامل لبنية مساحة العمل والنسخ الاحتياطي باستخدام git (يوصى بـ GitHub أو GitLab خاص).

  </Accordion>
</AccordionGroup>

## ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
