---
read_when:
    - إضافة ترحيلات doctor أو تعديلها
    - إدخال تغييرات كاسرة في التكوين
sidebarTitle: Doctor
summary: 'أمر Doctor: فحوصات الصحة، وعمليات ترحيل الإعدادات، وخطوات الإصلاح'
title: التشخيص
x-i18n:
    generated_at: "2026-05-10T19:39:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417440c2f658be5848b305bffeb006ad435f069d93f7e73ffbeef9468b58e1b3
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` هو أداة الإصلاح + الترحيل في OpenClaw. يصلح الإعدادات/الحالة القديمة، ويتحقق من الصحة، ويوفر خطوات إصلاح قابلة للتنفيذ.

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

    قبول القيم الافتراضية دون مطالبة (بما في ذلك خطوات إصلاح إعادة التشغيل/الخدمة/sandbox عند الانطباق).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    تطبيق الإصلاحات الموصى بها دون مطالبة (الإصلاحات + إعادة التشغيل حيثما يكون ذلك آمنا).

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

    التشغيل دون مطالبات وتطبيق عمليات الترحيل الآمنة فقط (تطبيع الإعدادات + نقل الحالة على القرص). يتخطى إجراءات إعادة التشغيل/الخدمة/sandbox التي تتطلب تأكيدا بشريا. تعمل عمليات ترحيل الحالة القديمة تلقائيا عند اكتشافها.

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
  <Accordion title="الصحة، واجهة المستخدم، والتحديثات">
    - تحديث اختياري قبل البدء لتثبيتات git (تفاعلي فقط).
    - فحص حداثة بروتوكول واجهة المستخدم (يعيد بناء واجهة التحكم عندما يكون مخطط البروتوكول أحدث).
    - فحص الصحة + مطالبة بإعادة التشغيل.
    - ملخص حالة Skills (مؤهلة/مفقودة/محظورة) وحالة Plugin.

  </Accordion>
  <Accordion title="الإعدادات والترحيلات">
    - تطبيع الإعدادات للقيم القديمة.
    - ترحيل إعدادات Talk من حقول `talk.*` المسطحة القديمة إلى `talk.provider` + `talk.providers.<provider>`.
    - فحوص ترحيل المتصفح لإعدادات إضافة Chrome القديمة وجاهزية Chrome MCP.
    - تحذيرات تجاوز موفر OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - تحذيرات حجب OAuth في Codex (`models.providers.openai-codex`).
    - فحص متطلبات OAuth TLS المسبقة لملفات تعريف OpenAI Codex OAuth.
    - تحذيرات قائمة السماح للـ Plugin/الأدوات عندما تكون `plugins.allow` تقييدية لكن سياسة الأدوات لا تزال تطلب wildcard أو أدوات يملكها Plugin.
    - ترحيل الحالة القديمة على القرص (sessions/agent dir/مصادقة WhatsApp).
    - ترحيل مفاتيح عقد بيان Plugin القديمة (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - ترحيل مخزن Cron القديم (`jobId`, `schedule.cron`, حقول التسليم/الحمولة في المستوى الأعلى، `provider` في الحمولة، ومهام Webhook الاحتياطية البسيطة `notify: true`).
    - تنظيف سياسة التشغيل القديمة على مستوى الوكيل بالكامل؛ سياسة تشغيل الموفر/النموذج هي محدد المسار النشط.
    - تنظيف إعدادات Plugin القديمة عندما تكون Plugins مفعلة؛ عندما يكون `plugins.enabled=false`، تعامل مراجع Plugin القديمة كإعداد احتواء خامل وتبقى محفوظة.

  </Accordion>
  <Accordion title="الحالة والسلامة">
    - فحص ملفات قفل الجلسات وتنظيف الأقفال القديمة.
    - إصلاح نصوص الجلسات لفروع إعادة كتابة المطالبات المكررة التي أنشأتها إصدارات 2026.4.24 المتأثرة.
    - اكتشاف شاهد تعافي إعادة تشغيل الوكيل الفرعي العالق، مع دعم `--fix` لمسح أعلام التعافي الملغاة القديمة حتى لا يستمر بدء التشغيل في التعامل مع الابن على أنه ألغيت إعادة تشغيله.
    - فحوص سلامة الحالة والأذونات (الجلسات، النصوص، دليل الحالة).
    - فحوص أذونات ملف الإعدادات (chmod 600) عند التشغيل محليا.
    - صحة مصادقة النموذج: يفحص انتهاء صلاحية OAuth، ويمكنه تحديث الرموز التي توشك على الانتهاء، ويبلغ عن حالات التهدئة/التعطيل لملف تعريف المصادقة.
    - اكتشاف دليل مساحة عمل إضافي (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway، الخدمات، والمشرفون">
    - إصلاح صورة sandbox عندما يكون sandboxing مفعلا.
    - ترحيل الخدمة القديمة واكتشاف Gateway إضافي.
    - ترحيل الحالة القديمة لقناة Matrix (في وضع `--fix` / `--repair`).
    - فحوص تشغيل Gateway (الخدمة مثبتة لكنها لا تعمل؛ تسمية launchd المخزنة مؤقتا).
    - تحذيرات حالة القناة (مفحوصة من Gateway قيد التشغيل).
    - توجد فحوص الأذونات الخاصة بالقنوات ضمن `openclaw channels capabilities`؛ على سبيل المثال، تدقق أذونات قناة Discord الصوتية باستخدام `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - فحوص استجابة WhatsApp لصحة حلقة أحداث Gateway المتدهورة مع بقاء عملاء TUI المحليين قيد التشغيل؛ يوقف `--fix` عملاء TUI المحليين المتحقق منهم فقط.
    - إصلاح مسار Codex لمراجع النماذج القديمة `openai-codex/*` في النماذج الأساسية، والاحتياطيات، وتجاوزات heartbeat/الوكيل الفرعي/Compaction، والخطافات، وتجاوزات نموذج القناة، وتثبيتات مسار الجلسة؛ يعيد `--fix` كتابتها إلى `openai/*`، ويزيل تثبيتات التشغيل القديمة للجلسة/الوكيل بالكامل، ويترك مراجع وكيل OpenAI الأساسية على Harness الافتراضي لـ Codex.
    - تدقيق إعدادات المشرف (launchd/systemd/schtasks) مع إصلاح اختياري.
    - تنظيف بيئة الوكيل المضمنة لخدمات Gateway التي التقطت قيم shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` أثناء التثبيت أو التحديث.
    - فحوص أفضل ممارسات تشغيل Gateway (Node مقابل Bun، مسارات مدير الإصدارات).
    - تشخيص تعارض منافذ Gateway (الافتراضي `18789`).

  </Accordion>
  <Accordion title="المصادقة، الأمان، والاقتران">
    - تحذيرات أمان لسياسات الرسائل المباشرة المفتوحة.
    - فحوص مصادقة Gateway لوضع الرمز المحلي (تعرض إنشاء رمز عندما لا يوجد مصدر رمز؛ لا تستبدل إعدادات الرمز SecretRef).
    - اكتشاف مشكلات اقتران الأجهزة (طلبات الاقتران الأولى المعلقة، ترقيات الدور/النطاق المعلقة، انجراف ذاكرة التخزين المؤقت المحلية القديمة لرمز الجهاز، وانجراف مصادقة سجل الاقتران).

  </Accordion>
  <Accordion title="مساحة العمل وshell">
    - فحص systemd linger على Linux.
    - فحص حجم ملف تمهيد مساحة العمل (تحذيرات الاقتطاع/الاقتراب من الحد لملفات السياق).
    - فحص جاهزية Skills للوكيل الافتراضي؛ يبلغ عن Skills المسموح بها مع ثنائيات أو بيئة أو إعدادات أو متطلبات نظام تشغيل مفقودة، ويمكن لـ `--fix` تعطيل Skills غير المتاحة في `skills.entries`.
    - فحص حالة إكمال shell والتثبيت/الترقية تلقائيا.
    - فحص جاهزية موفر تضمين بحث الذاكرة (نموذج محلي، مفتاح API بعيد، أو ثنائي QMD).
    - فحوص التثبيت من المصدر (عدم تطابق مساحة عمل pnpm، أصول واجهة مستخدم مفقودة، ثنائي tsx مفقود).
    - يكتب الإعدادات المحدثة + بيانات معالج الإعداد.

  </Accordion>
</AccordionGroup>

## الردم وإعادة الضبط في واجهة Dreams

يتضمن مشهد Dreams في واجهة التحكم إجراءات **Backfill** و**Reset** و**Clear Grounded** لسير عمل Dreaming المؤسس. تستخدم هذه الإجراءات طرق RPC على نمط Gateway doctor، لكنها **ليست** جزءا من إصلاح/ترحيل CLI الخاص بـ `openclaw doctor`.

ما تفعله:

- تفحص **Backfill** ملفات `memory/YYYY-MM-DD.md` التاريخية في مساحة العمل النشطة، وتشغل مرور يوميات REM المؤسسة، وتكتب إدخالات ردم قابلة للعكس في `DREAMS.md`.
- تزيل **Reset** إدخالات يوميات الردم الموسومة فقط من `DREAMS.md`.
- تزيل **Clear Grounded** فقط إدخالات المرحلة القصيرة الأمد المؤسسة فقط التي جاءت من إعادة التشغيل التاريخية ولم تراكم استدعاء حيا أو دعما يوميا بعد.

ما لا تفعله **بذاتها**:

- لا تعدل `MEMORY.md`
- لا تشغل ترحيلات doctor الكاملة
- لا تدرج المرشحين المؤسسين تلقائيا في مخزن الترقية القصيرة الأمد الحي إلا إذا شغلت مسار CLI المرحلي صراحة أولا

إذا أردت أن تؤثر إعادة التشغيل التاريخية المؤسسة في مسار الترقية العميقة العادي، فاستخدم تدفق CLI بدلا من ذلك:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

هذا يدرج المرشحين الدائمين المؤسسين في مخزن Dreaming القصير الأمد مع إبقاء `DREAMS.md` كسطح المراجعة.

## السلوك التفصيلي والمبررات

<AccordionGroup>
  <Accordion title="0. تحديث اختياري (تثبيتات git)">
    إذا كان هذا checkout من git وكان doctor يعمل تفاعليا، فإنه يعرض التحديث (fetch/rebase/build) قبل تشغيل doctor.
  </Accordion>
  <Accordion title="1. تطبيع الإعدادات">
    إذا كانت الإعدادات تحتوي على أشكال قيم قديمة (على سبيل المثال `messages.ackReaction` دون تجاوز خاص بالقناة)، يطبعها doctor إلى المخطط الحالي.

    يشمل ذلك حقول Talk المسطحة القديمة. إعداد الكلام العام الحالي في Talk هو `talk.provider` + `talk.providers.<provider>`، وإعداد الصوت الفوري هو `talk.realtime.*`. يعيد Doctor كتابة أشكال `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` القديمة إلى خريطة الموفرين، ويعيد كتابة محددات الوقت الفوري القديمة على المستوى الأعلى (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) إلى `talk.realtime`.

    يحذر Doctor أيضا عندما تكون `plugins.allow` غير فارغة وتستخدم سياسة الأدوات
    إدخالات wildcard أو أدوات يملكها Plugin. لا يطابق `tools.allow: ["*"]` إلا الأدوات
    من Plugins التي يتم تحميلها فعلا؛ ولا يتجاوز قائمة سماح Plugin الحصرية.
    يكتب Doctor `plugins.bundledDiscovery: "compat"` لإعدادات قائمة السماح
    القديمة المرحلة للحفاظ على سلوك الموفر المضمن الحالي، ثم
    يشير إلى إعداد `"allowlist"` الأكثر صرامة.

  </Accordion>
  <Accordion title="2. ترحيلات مفاتيح الإعدادات القديمة">
    عندما تحتوي الإعدادات على مفاتيح مهملة، ترفض الأوامر الأخرى التشغيل وتطلب منك تشغيل `openclaw doctor`.

    سيقوم Doctor بما يلي:

    - شرح المفاتيح القديمة التي عثر عليها.
    - عرض الترحيل الذي طبقه.
    - إعادة كتابة `~/.openclaw/openclaw.json` بالمخطط المحدث.

    يرفض بدء تشغيل Gateway تنسيقات الإعدادات القديمة ويطلب منك تشغيل `openclaw doctor --fix`؛ ولا يعيد كتابة `openclaw.json` عند بدء التشغيل. تتولى `openclaw doctor --fix` أيضا ترحيلات مخزن مهام Cron.

    الترحيلات الحالية:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - إعدادات القناة المُهيأة التي تفتقد سياسة رد مرئية → `messages.groupChat.visibleReplies: "message_tool"`
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
    - بالنسبة إلى القنوات التي لديها `accounts` مسماة ولكن ما تزال فيها قيم قناة على المستوى الأعلى لحساب واحد، انقل تلك القيم ذات نطاق الحساب إلى الحساب المُرقّى المختار لتلك القناة (`accounts.default` لمعظم القنوات؛ يمكن لـ Matrix الاحتفاظ بهدف مسمى/افتراضي مطابق موجود)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - أزِل `agents.defaults.llm`؛ استخدم `models.providers.<id>.timeoutSeconds` لمهل انتهاء مزود/نموذج بطيئة
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - أزِل `browser.relayBindHost` (إعداد ترحيل الامتداد القديم)
    - `models.providers.*.api: "openai"` القديمة → `"openai-completions"` (يتخطى بدء تشغيل Gateway أيضًا المزودين الذين عُيّنت قيمة `api` لديهم إلى قيمة تعداد مستقبلية أو غير معروفة بدلًا من الفشل المغلق)
    - أزِل `plugins.entries.codex.config.codexDynamicToolsProfile`؛ يحافظ خادم تطبيق Codex دائمًا على أدوات مساحة العمل الأصلية الخاصة بـ Codex بوصفها أصلية

    تتضمن تحذيرات Doctor أيضًا إرشادات افتراضي الحساب للقنوات متعددة الحسابات:

    - إذا جرى تكوين إدخالين أو أكثر من `channels.<channel>.accounts` من دون `channels.<channel>.defaultAccount` أو `accounts.default`، يحذّر doctor من أن التوجيه الاحتياطي قد يختار حسابًا غير متوقع.
    - إذا عُيّن `channels.<channel>.defaultAccount` إلى معرّف حساب غير معروف، يحذّر doctor ويسرد معرّفات الحسابات المُهيأة.

  </Accordion>
  <Accordion title="2b. تجاوزات مزود OpenCode">
    إذا أضفت `models.providers.opencode` أو `opencode-zen` أو `opencode-go` يدويًا، فسيؤدي ذلك إلى تجاوز كتالوج OpenCode المدمج من `@mariozechner/pi-ai`. قد يفرض ذلك النماذج على API خاطئة أو يصفر التكاليف. يحذّر Doctor حتى تتمكن من إزالة التجاوز واستعادة توجيه API والتكاليف لكل نموذج.
  </Accordion>
  <Accordion title="2c. ترحيل المتصفح وجاهزية Chrome MCP">
    إذا كان إعداد المتصفح لديك ما يزال يشير إلى مسار امتداد Chrome الذي أُزيل، فسيقوم doctor بتطبيعه إلى نموذج إرفاق Chrome MCP المحلي للمضيف الحالي:

    - يصبح `browser.profiles.*.driver: "extension"` هو `"existing-session"`
    - يُزال `browser.relayBindHost`

    يدقق Doctor أيضًا مسار Chrome MCP المحلي للمضيف عندما تستخدم `defaultProfile: "user"` أو ملفًا شخصيًا مُهيأ من نوع `existing-session`:

    - يتحقق مما إذا كان Google Chrome مثبتًا على المضيف نفسه لملفات التعريف الافتراضية ذات الاتصال التلقائي
    - يتحقق من إصدار Chrome المكتشف ويحذّر عندما يكون أقل من Chrome 144
    - يذكّرك بتمكين التصحيح عن بُعد في صفحة فحص المتصفح (مثلًا `chrome://inspect/#remote-debugging` أو `brave://inspect/#remote-debugging` أو `edge://inspect/#remote-debugging`)

    لا يمكن لـ Doctor تمكين الإعداد الخاص بجهة Chrome نيابة عنك. ما يزال Chrome MCP المحلي للمضيف يتطلب:

    - متصفحًا قائمًا على Chromium بالإصدار 144+ على مضيف gateway/node
    - تشغيل المتصفح محليًا
    - تمكين التصحيح عن بُعد في ذلك المتصفح
    - الموافقة على طلب موافقة الإرفاق الأول في المتصفح

    تتعلق الجاهزية هنا فقط بمتطلبات الإرفاق المحلي. يحتفظ Existing-session بحدود مسار Chrome MCP الحالية؛ وما تزال المسارات المتقدمة مثل `responsebody` وتصدير PDF واعتراض التنزيل وإجراءات الدُفعات تتطلب متصفحًا مُدارًا أو ملف تعريف CDP خامًا.

    لا ينطبق هذا الفحص على Docker أو sandbox أو remote-browser أو غيرها من تدفقات headless. تواصل تلك التدفقات استخدام CDP الخام.

  </Accordion>
  <Accordion title="2d. متطلبات OAuth TLS المسبقة">
    عند تكوين ملف تعريف OpenAI Codex OAuth، يفحص doctor نقطة نهاية تخويل OpenAI للتحقق من أن مكدس Node/OpenSSL TLS المحلي يستطيع التحقق من سلسلة الشهادات. إذا فشل الفحص بسبب خطأ في الشهادة (مثل `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` أو شهادة منتهية الصلاحية أو شهادة موقعة ذاتيًا)، يطبع doctor إرشادات إصلاح خاصة بالمنصة. على macOS مع Node من Homebrew، يكون الإصلاح عادةً `brew postinstall ca-certificates`. مع `--deep`، يُشغّل الفحص حتى إذا كان Gateway سليمًا.
  </Accordion>
  <Accordion title="2e. تجاوزات مزود Codex OAuth">
    إذا سبق أن أضفت إعدادات نقل OpenAI القديمة ضمن `models.providers.openai-codex`، فقد تحجب مسار مزود Codex OAuth المدمج الذي تستخدمه الإصدارات الأحدث تلقائيًا. يحذّر Doctor عندما يرى إعدادات النقل القديمة هذه إلى جانب Codex OAuth حتى تتمكن من إزالة تجاوز النقل القديم أو إعادة كتابته واستعادة سلوك التوجيه/الاحتياط المدمج. ما تزال الوكلاء المخصصون وتجاوزات الرؤوس فقط مدعومة ولا تؤدي إلى هذا التحذير.
  </Accordion>
  <Accordion title="2f. إصلاح مسار Codex">
    يتحقق Doctor من مراجع النماذج القديمة `openai-codex/*`. يستخدم توجيه حزمة Codex الأصلية مراجع نماذج `openai/*` القياسية؛ تمر أدوار وكيل OpenAI عبر حزمة خادم تطبيق Codex بدلًا من مسار OpenClaw PI OpenAI.

    في وضع `--fix` / `--repair`، يعيد doctor كتابة مراجع الوكيل الافتراضي ومراجع كل وكيل المتأثرة، بما في ذلك النماذج الأساسية والاحتياطيات وتجاوزات Heartbeat/subagent/compaction والخطافات وتجاوزات نماذج القنوات وحالة مسار الجلسة القديمة المحفوظة:

    - يصبح `openai-codex/gpt-*` هو `openai/gpt-*`.
    - تنتقل نية Codex إلى إدخالات `agentRuntime.id: "codex"` ذات نطاق المزود/النموذج لمراجع نماذج الوكيل التي جرى إصلاحها، حتى يظل بالإمكان تحديد ملفات تعريف المصادقة `openai-codex:...` بعد أن يصبح مرجع النموذج `openai/*`.
    - تُزال تهيئة وقت التشغيل القديمة للوكيل الكامل وتثبيتات وقت تشغيل الجلسة المحفوظة لأن تحديد وقت التشغيل يكون بنطاق المزود/النموذج.
    - تُحفظ سياسة وقت التشغيل الحالية للمزود/النموذج ما لم يحتج مرجع النموذج القديم الذي جرى إصلاحه إلى توجيه Codex للحفاظ على مسار المصادقة القديم.
    - تُحفظ قوائم احتياط النماذج الحالية مع إعادة كتابة إدخالاتها القديمة؛ وتنتقل الإعدادات المنسوخة لكل نموذج من المفتاح القديم إلى مفتاح `openai/*` القياسي.
    - تُصلح قيم `modelProvider`/`providerOverride` و`model`/`modelOverride` المحفوظة للجلسات وإشعارات الاحتياط وتثبيتات ملف تعريف المصادقة عبر جميع مخازن جلسات الوكلاء المكتشفة.
    - `/codex ...` يعني "التحكم في محادثة Codex أصلية من الدردشة أو ربطها."
    - `/acp ...` أو `runtime: "acp"` يعني "استخدام محول ACP/acpx الخارجي."

  </Accordion>
  <Accordion title="2g. تنظيف مسار الجلسة">
    يفحص Doctor أيضًا مخازن جلسات الوكلاء المكتشفة بحثًا عن حالة مسار قديمة أُنشئت تلقائيًا بعد نقل النماذج أو وقت التشغيل المُهيأ بعيدًا عن مسار مملوك لـ Plugin مثل Codex.

    يمكن لـ `openclaw doctor --fix` مسح حالة قديمة أُنشئت تلقائيًا، مثل تثبيتات النموذج `modelOverrideSource: "auto"` وبيانات تعريف نموذج وقت التشغيل ومعرّفات الحزمة المثبتة وروابط جلسات CLI وتجاوزات ملف تعريف المصادقة التلقائية عندما لا يعود مسارها المالك مُهيأ. تُبلّغ اختيارات نموذج الجلسة الصريحة الخاصة بالمستخدم أو القديمة للمراجعة اليدوية وتُترك من دون تغيير؛ بدّلها باستخدام `/model ...` أو `/new`، أو أعد تعيين الجلسة عندما لا يعود ذلك المسار مقصودًا.

  </Accordion>
  <Accordion title="3. ترحيلات الحالة القديمة (تخطيط القرص)">
    يستطيع Doctor ترحيل التخطيطات الأقدم على القرص إلى البنية الحالية:

    - مخزن الجلسات + النصوص:
      - من `~/.openclaw/sessions/` إلى `~/.openclaw/agents/<agentId>/sessions/`
    - دليل الوكيل:
      - من `~/.openclaw/agent/` إلى `~/.openclaw/agents/<agentId>/agent/`
    - حالة مصادقة WhatsApp ‏(Baileys):
      - من `~/.openclaw/credentials/*.json` القديمة (باستثناء `oauth.json`)
      - إلى `~/.openclaw/credentials/whatsapp/<accountId>/...` (معرّف الحساب الافتراضي: `default`)

    هذه الترحيلات تجري بأفضل جهد وهي متكافئة التكرار؛ سيصدر doctor تحذيرات عندما يترك أي مجلدات قديمة كنسخ احتياطية. يقوم Gateway/CLI أيضًا بترحيل الجلسات القديمة + دليل الوكيل تلقائيًا عند بدء التشغيل بحيث يصل السجل/المصادقة/النماذج إلى مسار كل وكيل من دون تشغيل doctor يدويًا. أصبحت تسوية مزود Talk/خريطة المزود تقارن الآن بالمساواة البنيوية، لذلك لم تعد الاختلافات التي تقتصر على ترتيب المفاتيح تؤدي إلى تغييرات `doctor --fix` متكررة بلا أثر.

  </Accordion>
  <Accordion title="3a. ترحيلات بيانات Plugin الوصفية القديمة">
    يفحص Doctor جميع بيانات Plugin الوصفية المثبتة بحثًا عن مفاتيح قدرات المستوى الأعلى المهملة (`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders`). عند العثور عليها، يعرض نقلها إلى كائن `contracts` وإعادة كتابة ملف البيانات الوصفية في مكانه. هذا الترحيل متكافئ التكرار؛ إذا كان مفتاح `contracts` يحتوي بالفعل على القيم نفسها، يُزال المفتاح القديم من دون تكرار البيانات.
  </Accordion>
  <Accordion title="3b. ترحيلات مخزن cron القديمة">
    يتحقق Doctor أيضًا من مخزن مهام cron (`~/.openclaw/cron/jobs.json` افتراضيًا، أو `cron.store` عند تجاوزه) بحثًا عن أشكال مهام قديمة ما يزال المجدول يقبلها للتوافق.

    تتضمن تنظيفات cron الحالية:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - حقول الحمولة ذات المستوى الأعلى (`message`، `model`، `thinking`، ...) → `payload`
    - حقول التسليم ذات المستوى الأعلى (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - الأسماء المستعارة للتسليم `provider` في الحمولة → `delivery.channel` صريح
    - مهام الرجوع الاحتياطي القديمة البسيطة لـ Webhook ذات `notify: true` → `delivery.mode="webhook"` صريح مع `delivery.to=cron.webhook`

    لا يجري Doctor الترحيل التلقائي لمهام `notify: true` إلا عندما يمكنه فعل ذلك من دون تغيير السلوك. إذا جمعت مهمة بين رجوع احتياطي قديم للإشعار ووضع تسليم حالي غير Webhook، فسيصدر Doctor تحذيرًا ويترك تلك المهمة للمراجعة اليدوية.

    على Linux، يحذر Doctor أيضًا عندما لا يزال crontab الخاص بالمستخدم يستدعي `~/.openclaw/bin/ensure-whatsapp.sh` القديم. لا تتم صيانة هذا السكربت المحلي للمضيف بواسطة OpenClaw الحالي، ويمكنه كتابة رسائل `Gateway inactive` زائفة إلى `~/.openclaw/logs/whatsapp-health.log` عندما يتعذر على cron الوصول إلى ناقل مستخدم systemd. أزل إدخال crontab القديم باستخدام `crontab -e`؛ واستخدم `openclaw channels status --probe` و`openclaw doctor` و`openclaw gateway status` لفحوصات السلامة الحالية.

  </Accordion>
  <Accordion title="3c. تنظيف قفل الجلسة">
    يفحص Doctor كل دليل جلسة وكيل بحثًا عن ملفات قفل كتابة قديمة، وهي ملفات تُترك عندما تنتهي جلسة بشكل غير طبيعي. ولكل ملف قفل يعثر عليه، يبلّغ عن: المسار، وPID، وما إذا كان PID لا يزال نشطًا، وعمر القفل، وما إذا كان يُعد قديمًا (PID ميت، أو أقدم من 30 دقيقة، أو PID نشط يمكن إثبات أنه ينتمي إلى عملية غير OpenClaw). في وضع `--fix` / `--repair` يزيل ملفات القفل القديمة تلقائيًا؛ وإلا فيطبع ملاحظة ويوجهك إلى إعادة التشغيل باستخدام `--fix`.
  </Accordion>
  <Accordion title="3d. إصلاح فرع نص الجلسة">
    يفحص Doctor ملفات JSONL لجلسات الوكلاء بحثًا عن شكل الفرع المكرر الذي أنشأه خطأ إعادة كتابة نص موجه 2026.4.24: دور مستخدم متروك مع سياق تشغيل داخلي لـ OpenClaw إضافةً إلى شقيق نشط يحتوي على موجه المستخدم المرئي نفسه. في وضع `--fix` / `--repair`، ينسخ Doctor كل ملف متأثر احتياطيًا بجوار الأصلي، ثم يعيد كتابة النص إلى الفرع النشط حتى لا يرى تاريخ Gateway وقراء الذاكرة أدوارًا مكررة بعد الآن.
  </Accordion>
  <Accordion title="4. فحوصات سلامة الحالة (استمرارية الجلسات، والتوجيه، والسلامة)">
    دليل الحالة هو جذع الدماغ التشغيلي. إذا اختفى، فستفقد الجلسات وبيانات الاعتماد والسجلات والإعدادات (ما لم تكن لديك نسخ احتياطية في مكان آخر).

    يتحقق Doctor من:

    - **دليل الحالة مفقود**: يحذر من فقدان كارثي للحالة، ويطلب إعادة إنشاء الدليل، ويذكّرك بأنه لا يستطيع استرداد البيانات المفقودة.
    - **أذونات دليل الحالة**: يتحقق من قابلية الكتابة؛ ويعرض إصلاح الأذونات (ويصدر تلميح `chown` عند اكتشاف عدم تطابق المالك/المجموعة).
    - **دليل حالة متزامن سحابيًا على macOS**: يحذر عندما تُحل الحالة تحت iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) أو `~/Library/CloudStorage/...` لأن المسارات المدعومة بالمزامنة يمكن أن تسبب إدخال/إخراج أبطأ وتنافسات قفل/مزامنة.
    - **دليل حالة Linux على SD أو eMMC**: يحذر عندما تُحل الحالة إلى مصدر تركيب `mmcblk*`، لأن الإدخال/الإخراج العشوائي المدعوم بـ SD أو eMMC يمكن أن يكون أبطأ ويتآكل أسرع تحت كتابات الجلسات وبيانات الاعتماد.
    - **أدلة الجلسات مفقودة**: يلزم وجود `sessions/` ودليل مخزن الجلسات لحفظ التاريخ وتجنب أعطال `ENOENT`.
    - **عدم تطابق النص**: يحذر عندما تحتوي إدخالات الجلسات الحديثة على ملفات نص مفقودة.
    - **الجلسة الرئيسية "JSONL بسطر واحد"**: يضع علامة عندما يحتوي النص الرئيسي على سطر واحد فقط (التاريخ لا يتراكم).
    - **أدلة حالة متعددة**: يحذر عندما توجد مجلدات `~/.openclaw` متعددة عبر أدلة المنزل أو عندما يشير `OPENCLAW_STATE_DIR` إلى مكان آخر (يمكن أن ينقسم التاريخ بين التثبيتات).
    - **تذكير الوضع البعيد**: إذا كان `gateway.mode=remote`، يذكّرك Doctor بتشغيله على المضيف البعيد (فالحالة تعيش هناك).
    - **أذونات ملف الإعدادات**: يحذر إذا كان `~/.openclaw/openclaw.json` قابلاً للقراءة من المجموعة/العالم ويعرض تشديده إلى `600`.

  </Accordion>
  <Accordion title="5. صحة مصادقة النموذج (انتهاء OAuth)">
    يفحص Doctor ملفات تعريف OAuth في مخزن المصادقة، ويحذر عندما تكون الرموز على وشك الانتهاء/منتهية، ويمكنه تحديثها عندما يكون ذلك آمنًا. إذا كان ملف تعريف Anthropic OAuth/الرمز قديمًا، فإنه يقترح مفتاح API من Anthropic أو مسار رمز إعداد Anthropic. لا تظهر مطالبات التحديث إلا عند التشغيل تفاعليًا (TTY)؛ ويتخطى `--non-interactive` محاولات التحديث.

    عندما يفشل تحديث OAuth بشكل دائم (مثل `refresh_token_reused` أو `invalid_grant` أو مزود يطلب منك تسجيل الدخول مرة أخرى)، يبلّغ Doctor بأن إعادة المصادقة مطلوبة ويطبع أمر `openclaw models auth login --provider ...` الدقيق المطلوب تشغيله.

    يبلّغ Doctor أيضًا عن ملفات تعريف المصادقة غير القابلة للاستخدام مؤقتًا بسبب:

    - فترات تهدئة قصيرة (حدود معدل/مهلات/فشل مصادقة)
    - تعطيلات أطول (فشل الفوترة/الرصيد)

  </Accordion>
  <Accordion title="6. التحقق من نموذج الخطافات">
    إذا تم تعيين `hooks.gmail.model`، يتحقق Doctor من مرجع النموذج مقابل الفهرس وقائمة السماح، ويحذر عندما يتعذر حله أو يكون غير مسموح به.
  </Accordion>
  <Accordion title="7. إصلاح صورة العزل">
    عند تمكين العزل، يتحقق Doctor من صور Docker ويعرض البناء أو التبديل إلى الأسماء القديمة إذا كانت الصورة الحالية مفقودة.
  </Accordion>
  <Accordion title="7b. تنظيف تثبيت Plugin">
    يزيل Doctor حالة تجهيز اعتماد Plugin القديمة التي أنشأها OpenClaw في وضع `openclaw doctor --fix` / `openclaw doctor --repair`. يغطي ذلك جذور الاعتماد المولدة القديمة، وأدلة مرحلة التثبيت القديمة، وبقايا الحزمة المحلية من كود إصلاح اعتماد Plugin المضمن السابق، ونسخ npm المُدارة اليتيمة أو المستردة من Plugins `@openclaw/*` المضمنة التي يمكن أن تحجب البيان المضمن الحالي.

    يمكن لـ Doctor أيضًا إعادة تثبيت Plugins القابلة للتنزيل المفقودة عندما تشير إليها الإعدادات لكن سجل Plugin المحلي لا يستطيع العثور عليها. تشمل الأمثلة `plugins.entries` المادية، وإعدادات القناة/المزود/البحث المهيأة، وبيئات تشغيل الوكلاء المهيأة. أثناء تحديثات الحزمة، يتجنب Doctor تشغيل إصلاح Plugin عبر مدير الحزم بينما يتم تبديل الحزمة الأساسية؛ شغّل `openclaw doctor --fix` مرة أخرى بعد التحديث إذا كان Plugin مهيأ لا يزال بحاجة إلى استرداد. لا يشغّل بدء Gateway وإعادة تحميل الإعدادات مديري الحزم؛ وتبقى تثبيتات Plugin عملًا صريحًا عبر Doctor/التثبيت/التحديث.

  </Accordion>
  <Accordion title="8. ترحيلات خدمة Gateway وتلميحات التنظيف">
    يكتشف Doctor خدمات Gateway القديمة (launchd/systemd/schtasks) ويعرض إزالتها وتثبيت خدمة OpenClaw باستخدام منفذ Gateway الحالي. يمكنه أيضًا فحص خدمات إضافية شبيهة بـ Gateway وطباعة تلميحات تنظيف. تُعد خدمات OpenClaw gateway المسماة بحسب ملف التعريف خدمات من الدرجة الأولى ولا تُعلَّم بوصفها "إضافية".

    على Linux، إذا كانت خدمة Gateway على مستوى المستخدم مفقودة لكن خدمة OpenClaw gateway على مستوى النظام موجودة، فلا يثبّت Doctor خدمة ثانية على مستوى المستخدم تلقائيًا. افحص باستخدام `openclaw gateway status --deep` أو `openclaw doctor --deep`، ثم أزل النسخة المكررة أو عيّن `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يكون مشرف نظام هو مالك دورة حياة Gateway.

  </Accordion>
  <Accordion title="8b. ترحيل Matrix عند بدء التشغيل">
    عندما يكون لحساب قناة Matrix ترحيل حالة قديم معلق أو قابل للتنفيذ، ينشئ Doctor (في وضع `--fix` / `--repair`) لقطة قبل الترحيل ثم يشغّل خطوات الترحيل بأفضل جهد: ترحيل حالة Matrix القديمة وتحضير الحالة المشفرة القديمة. كلتا الخطوتين غير قاتلتين؛ تُسجل الأخطاء ويستمر بدء التشغيل. في وضع القراءة فقط (`openclaw doctor` دون `--fix`) يتم تخطي هذا الفحص بالكامل.
  </Accordion>
  <Accordion title="8c. إقران الجهاز وانحراف المصادقة">
    يفحص Doctor الآن حالة إقران الجهاز كجزء من مرور الصحة العادي.

    ما يبلّغ عنه:

    - طلبات إقران أولية معلقة
    - ترقيات أدوار معلقة للأجهزة المقترنة مسبقًا
    - ترقيات نطاقات معلقة للأجهزة المقترنة مسبقًا
    - إصلاحات عدم تطابق المفتاح العام حيث لا يزال معرف الجهاز مطابقًا لكن هوية الجهاز لم تعد تطابق السجل المعتمد
    - سجلات مقترنة تفتقد رمزًا نشطًا لدور معتمد
    - رموز مقترنة انحرفت نطاقاتها خارج خط أساس الإقران المعتمد
    - إدخالات رموز أجهزة محلية مخزنة مؤقتًا للجهاز الحالي تسبق تدوير رمز على جانب Gateway أو تحمل بيانات تعريف نطاق قديمة

    لا يوافق Doctor تلقائيًا على طلبات الإقران ولا يدوّر رموز الأجهزة تلقائيًا. بل يطبع الخطوات التالية الدقيقة بدلًا من ذلك:

    - افحص الطلبات المعلقة باستخدام `openclaw devices list`
    - وافق على الطلب المحدد باستخدام `openclaw devices approve <requestId>`
    - دوّر رمزًا جديدًا باستخدام `openclaw devices rotate --device <deviceId> --role <role>`
    - أزل سجلًا قديمًا وأعد الموافقة عليه باستخدام `openclaw devices remove <deviceId>`

    هذا يغلق فجوة "مقترن بالفعل لكن لا يزال يطلب الإقران" الشائعة: يميز Doctor الآن بين الإقران الأولي وترقيات الدور/النطاق المعلقة وبين انحراف الرمز/هوية الجهاز القديم.

  </Accordion>
  <Accordion title="9. تحذيرات الأمان">
    يصدر Doctor تحذيرات عندما يكون مزود مفتوحًا للرسائل المباشرة من دون قائمة سماح، أو عندما تكون سياسة مهيأة بطريقة خطرة.
  </Accordion>
  <Accordion title="10. استمرار systemd (Linux)">
    إذا كان التشغيل كخدمة مستخدم systemd، يتأكد Doctor من تمكين الاستمرار حتى يبقى Gateway حيًا بعد تسجيل الخروج.
  </Accordion>
  <Accordion title="11. حالة مساحة العمل (Skills، وPlugins، والأدلة القديمة)">
    يطبع Doctor ملخصًا لحالة مساحة العمل للوكيل الافتراضي:

    - **حالة Skills**: تعد Skills المؤهلة، وناقصة المتطلبات، والمحظورة بقائمة السماح.
    - **أدلة مساحة العمل القديمة**: يحذر عندما توجد `~/openclaw` أو أدلة مساحة عمل قديمة أخرى إلى جانب مساحة العمل الحالية.
    - **حالة Plugin**: تعد Plugins الممكّنة/المعطلة/ذات الأخطاء؛ وتسرد معرفات Plugin لأي أخطاء؛ وتبلّغ عن قدرات Plugin الحزمة.
    - **تحذيرات توافق Plugin**: تعلّم Plugins التي لديها مشكلات توافق مع بيئة التشغيل الحالية.
    - **تشخيصات Plugin**: تعرض أي تحذيرات أو أخطاء وقت التحميل صادرة عن سجل Plugin.

  </Accordion>
  <Accordion title="11b. حجم ملف التمهيد">
    يتحقق Doctor مما إذا كانت ملفات تمهيد مساحة العمل (مثل `AGENTS.md` أو `CLAUDE.md` أو ملفات السياق المحقونة الأخرى) قريبة من ميزانية الأحرف المهيأة أو تتجاوزها. يبلّغ لكل ملف عن أعداد الأحرف الخام مقابل المحقونة، ونسبة الاقتطاع، وسبب الاقتطاع (`max/file` أو `max/total`)، وإجمالي الأحرف المحقونة كنسبة من الميزانية الإجمالية. عندما تكون الملفات مقتطعة أو قريبة من الحد، يطبع Doctor نصائح لضبط `agents.defaults.bootstrapMaxChars` و`agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. تنظيف Plugin القناة القديم">
    عندما يزيل `openclaw doctor --fix` Plugin قناة مفقودًا، فإنه يزيل أيضًا إعدادات نطاق القناة المتدلية التي أشارت إلى ذلك Plugin: إدخالات `channels.<id>`، وأهداف Heartbeat التي سمت القناة، وتجاوزات `agents.*.models["<channel>/*"]`. يمنع ذلك حلقات إقلاع Gateway حيث تكون بيئة تشغيل القناة قد اختفت لكن الإعدادات لا تزال تطلب من Gateway الارتباط بها.
  </Accordion>
  <Accordion title="11c. إكمال الصدفة">
    يتحقق Doctor مما إذا كان إكمال التبويب مثبتًا للصدفة الحالية (zsh أو bash أو fish أو PowerShell):

    - إذا كان ملف تعريف الصدفة يستخدم نمط إكمال ديناميكيًا بطيئًا (`source <(openclaw completion ...)`)، فيرقيه Doctor إلى متغير الملف المخزن مؤقتًا الأسرع.
    - إذا كان الإكمال مهيأً في ملف التعريف لكن ملف الذاكرة المؤقتة مفقود، يعيد Doctor توليد الذاكرة المؤقتة تلقائيًا.
    - إذا لم يكن أي إكمال مهيأ على الإطلاق، يطالب Doctor بتثبيته (في الوضع التفاعلي فقط؛ ويتم تخطيه مع `--non-interactive`).

    شغّل `openclaw completion --write-state` لإعادة توليد الذاكرة المؤقتة يدويًا.

  </Accordion>
  <Accordion title="12. فحوص مصادقة Gateway (الرمز المحلي)">
    يتحقق Doctor من جاهزية مصادقة رمز Gateway المحلي.

    - إذا كان وضع الرمز يحتاج إلى رمز ولا يوجد مصدر للرمز، يعرض doctor إنشاء واحد.
    - إذا كان `gateway.auth.token` مدارًا عبر SecretRef لكنه غير متاح، يحذر doctor ولا يستبدله بنص صريح.
    - يفرض `openclaw doctor --generate-gateway-token` الإنشاء فقط عندما لا يكون هناك رمز SecretRef مهيأ.

  </Accordion>
  <Accordion title="12b. إصلاحات مدركة لـ SecretRef للقراءة فقط">
    تحتاج بعض تدفقات الإصلاح إلى فحص بيانات الاعتماد المهيأة دون إضعاف سلوك فشل وقت التشغيل السريع.

    - يستخدم `openclaw doctor --fix` الآن نموذج ملخص SecretRef للقراءة فقط نفسه الذي تستخدمه أوامر عائلة الحالة لإصلاحات التهيئة المستهدفة.
    - مثال: يحاول إصلاح `allowFrom` / `groupAllowFrom` `@username` في Telegram استخدام بيانات اعتماد البوت المهيأة عند توفرها.
    - إذا كان رمز بوت Telegram مهيأ عبر SecretRef لكنه غير متاح في مسار الأمر الحالي، يبلغ doctor أن بيانات الاعتماد مهيأة لكنها غير متاحة ويتخطى الحل التلقائي بدلًا من التعطل أو الإبلاغ خطأً عن أن الرمز مفقود.

  </Accordion>
  <Accordion title="13. فحص سلامة Gateway + إعادة التشغيل">
    يشغل Doctor فحص سلامة ويعرض إعادة تشغيل Gateway عندما يبدو غير سليم.
  </Accordion>
  <Accordion title="13b. جاهزية بحث الذاكرة">
    يتحقق Doctor مما إذا كان مزود تضمين بحث الذاكرة المهيأ جاهزًا للوكيل الافتراضي. يعتمد السلوك على الخلفية والمزود المهيأين:

    - **خلفية QMD**: تفحص ما إذا كان ملف `qmd` الثنائي متاحًا وقابلًا للتشغيل. إذا لم يكن كذلك، تطبع إرشادات الإصلاح بما في ذلك حزمة npm وخيار مسار ثنائي يدوي.
    - **مزود محلي صريح**: يتحقق من وجود ملف نموذج محلي أو عنوان URL معروف لنموذج بعيد/قابل للتنزيل. إذا كان مفقودًا، يقترح التبديل إلى مزود بعيد.
    - **مزود بعيد صريح** (`openai`، `voyage`، إلخ): يتحقق من وجود مفتاح API في البيئة أو مخزن المصادقة. يطبع تلميحات إصلاح قابلة للتنفيذ إذا كان مفقودًا.
    - **مزود تلقائي**: يتحقق من توفر النموذج المحلي أولًا، ثم يجرب كل مزود بعيد بترتيب الاختيار التلقائي.

    عند توفر نتيجة فحص Gateway مخزنة مؤقتًا (كان Gateway سليمًا وقت الفحص)، يطابق doctor نتيجتها مع التهيئة المرئية عبر CLI ويلاحظ أي اختلاف. لا يبدأ Doctor اختبار تضمين جديدًا على المسار الافتراضي؛ استخدم أمر حالة الذاكرة العميق عندما تريد فحص مزود مباشرًا.

    استخدم `openclaw memory status --deep` للتحقق من جاهزية التضمين وقت التشغيل.

  </Accordion>
  <Accordion title="14. تحذيرات حالة القناة">
    إذا كان Gateway سليمًا، يشغل doctor فحص حالة القناة ويبلغ عن التحذيرات مع إصلاحات مقترحة.
  </Accordion>
  <Accordion title="15. تدقيق تهيئة المشرف + الإصلاح">
    يتحقق Doctor من تهيئة المشرف المثبتة (launchd/systemd/schtasks) بحثًا عن الإعدادات الافتراضية المفقودة أو القديمة (مثل اعتماديات systemd لـ network-online وتأخير إعادة التشغيل). عندما يجد عدم تطابق، يوصي بتحديث ويمكنه إعادة كتابة ملف الخدمة/المهمة إلى الإعدادات الافتراضية الحالية.

    ملاحظات:

    - يطلب `openclaw doctor` التأكيد قبل إعادة كتابة تهيئة المشرف.
    - يقبل `openclaw doctor --yes` مطالبات الإصلاح الافتراضية.
    - يطبق `openclaw doctor --repair` الإصلاحات الموصى بها دون مطالبات.
    - يستبدل `openclaw doctor --repair --force` تهيئات المشرف المخصصة.
    - يجعل `OPENCLAW_SERVICE_REPAIR_POLICY=external` doctor للقراءة فقط لدورة حياة خدمة Gateway. لا يزال يبلغ عن سلامة الخدمة ويشغل إصلاحات غير خدمية، لكنه يتخطى تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة، وإعادة كتابة تهيئة المشرف، وتنظيف الخدمة القديمة لأن مشرفًا خارجيًا يملك دورة الحياة تلك.
    - على Linux، لا يعيد doctor كتابة بيانات تعريف الأمر/نقطة الدخول بينما تكون وحدة Gateway systemd المطابقة نشطة. ويتجاهل أيضًا وحدات Gateway الشبيهة الإضافية غير القديمة وغير النشطة أثناء فحص الخدمات المكررة حتى لا تنشئ ملفات الخدمات المصاحبة ضجيج تنظيف.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان `gateway.auth.token` مدارًا عبر SecretRef، يتحقق تثبيت/إصلاح خدمة doctor من SecretRef لكنه لا يحفظ قيم الرمز النصية الصريحة المحلولة في بيانات تعريف بيئة خدمة المشرف.
    - يكتشف Doctor قيم بيئة الخدمة المدارة والمدعومة بـ `.env`/SecretRef التي ضمنت تثبيتات LaunchAgent أو systemd أو Windows Scheduled Task القديمة قيمها داخليًا، ويعيد كتابة بيانات تعريف الخدمة حتى تُحمَّل تلك القيم من مصدر وقت التشغيل بدلًا من تعريف المشرف.
    - يكتشف Doctor عندما لا يزال أمر الخدمة يثبت `--port` قديمًا بعد تغيير `gateway.port` ويعيد كتابة بيانات تعريف الخدمة إلى المنفذ الحالي.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef الخاص بالرمز المهيأ غير محلول، يمنع doctor مسار التثبيت/الإصلاح مع إرشادات قابلة للتنفيذ.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مهيأين وكان `gateway.auth.mode` غير مضبوط، يمنع doctor التثبيت/الإصلاح إلى أن يُضبط الوضع صراحة.
    - بالنسبة إلى وحدات user-systemd على Linux، أصبحت فحوص انجراف رمز doctor تشمل الآن مصدري `Environment=` و`EnvironmentFile=` عند مقارنة بيانات تعريف مصادقة الخدمة.
    - ترفض إصلاحات خدمة Doctor إعادة كتابة خدمة Gateway أو إيقافها أو إعادة تشغيلها من ملف OpenClaw ثنائي أقدم عندما تكون التهيئة قد كُتبت آخر مرة بواسطة إصدار أحدث. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - يمكنك دائمًا فرض إعادة كتابة كاملة عبر `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. تشخيصات وقت تشغيل Gateway والمنفذ">
    يفحص Doctor وقت تشغيل الخدمة (PID، آخر حالة خروج) ويحذر عندما تكون الخدمة مثبتة لكنها لا تعمل فعليًا. يتحقق أيضًا من تعارضات المنافذ على منفذ Gateway (الافتراضي `18789`) ويبلغ عن الأسباب المحتملة (Gateway يعمل بالفعل، نفق SSH).
  </Accordion>
  <Accordion title="17. أفضل ممارسات وقت تشغيل Gateway">
    يحذر Doctor عندما تعمل خدمة Gateway على Bun أو مسار Node مُدار بالإصدارات (`nvm`، `fnm`، `volta`، `asdf`، إلخ). تتطلب قنوات WhatsApp وTelegram استخدام Node، ويمكن أن تتعطل مسارات مديري الإصدارات بعد الترقيات لأن الخدمة لا تُحمّل تهيئة الصدفة لديك. يعرض Doctor الترحيل إلى تثبيت Node نظامي عند توفره (Homebrew/apt/choco).

    تستخدم LaunchAgents المثبتة أو المُصلحة حديثًا على macOS مسار PATH نظاميًا معياريًا (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) بدلًا من نسخ PATH الخاص بالصدفة التفاعلية، بحيث تبقى الثنائيات النظامية المُدارة عبر Homebrew متاحة بينما لا تغير أدلة Volta وasdf وfnm وpnpm وغيرها من مديري الإصدارات أي Node تحله العمليات الفرعية. لا تزال خدمات Linux تحتفظ بجذور بيئة صريحة (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) وأدلة user-bin مستقرة، لكن أدلة الرجوع الاحتياطية المخمنة لمديري الإصدارات لا تُكتب إلى PATH الخاص بالخدمة إلا عندما تكون تلك الأدلة موجودة على القرص.

  </Accordion>
  <Accordion title="18. كتابة التهيئة + بيانات تعريف المعالج">
    يحفظ Doctor أي تغييرات في التهيئة ويختم بيانات تعريف المعالج لتسجيل تشغيل doctor.
  </Accordion>
  <Accordion title="19. نصائح مساحة العمل (النسخ الاحتياطي + نظام الذاكرة)">
    يقترح Doctor نظام ذاكرة لمساحة العمل عند غيابه ويطبع نصيحة نسخ احتياطي إذا لم تكن مساحة العمل موجودة بالفعل تحت git.

    راجع [/concepts/agent-workspace](/ar/concepts/agent-workspace) للاطلاع على دليل كامل لبنية مساحة العمل والنسخ الاحتياطي باستخدام git (يوصى بـ GitHub أو GitLab خاصين).

  </Accordion>
</AccordionGroup>

## ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
