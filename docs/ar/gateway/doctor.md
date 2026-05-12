---
read_when:
    - إضافة ترحيلات doctor أو تعديلها
    - إدخال تغييرات إعدادات كاسرة للتوافق
sidebarTitle: Doctor
summary: 'أمر doctor: فحوصات الحالة، وعمليات ترحيل التكوين، وخطوات الإصلاح'
title: الفحص التشخيصي
x-i18n:
    generated_at: "2026-05-12T08:45:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53d67fcc5ab4a356747bc4f4af0c5d42cbdae0c89a41616aaded7589e408a017
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

    قبول الإعدادات الافتراضية دون مطالبة (بما في ذلك خطوات إصلاح إعادة التشغيل/الخدمة/sandbox عند الانطباق).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    تطبيق الإصلاحات الموصى بها دون مطالبة (الإصلاحات + عمليات إعادة التشغيل حيثما كان ذلك آمنا).

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

    التشغيل دون مطالبات وتطبيق الترحيلات الآمنة فقط (تطبيع الإعدادات + نقل الحالة على القرص). يتخطى إجراءات إعادة التشغيل/الخدمة/sandbox التي تتطلب تأكيدا بشريا. تعمل ترحيلات الحالة القديمة تلقائيا عند اكتشافها.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    فحص خدمات النظام للعثور على تثبيتات Gateway إضافية (launchd/systemd/schtasks).

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
    - فحص الصحة + مطالبة إعادة التشغيل.
    - ملخص حالة Skills (مؤهلة/مفقودة/محظورة) وحالة Plugin.

  </Accordion>
  <Accordion title="الإعدادات والترحيلات">
    - تطبيع الإعدادات للقيم القديمة.
    - ترحيل إعدادات Talk من حقول `talk.*` المسطحة القديمة إلى `talk.provider` + `talk.providers.<provider>`.
    - فحوصات ترحيل المتصفح لإعدادات إضافة Chrome القديمة وجاهزية Chrome MCP.
    - تحذيرات تجاوز موفر OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - تحذيرات حجب Codex OAuth (`models.providers.openai-codex`).
    - فحص متطلبات OAuth TLS الأساسية لملفات تعريف OpenAI Codex OAuth.
    - تحذيرات قائمة سماح Plugin/الأدوات عندما يكون `plugins.allow` مقيدا لكن سياسة الأدوات لا تزال تطلب wildcard أو أدوات مملوكة لـ Plugin.
    - ترحيل الحالة القديمة على القرص (sessions/agent dir/WhatsApp auth).
    - ترحيل مفتاح عقد بيان Plugin القديم (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - ترحيل مخزن cron القديم (`jobId`, `schedule.cron`, حقول delivery/payload في المستوى الأعلى، payload `provider`, مهام webhook fallback البسيطة `notify: true`).
    - تنظيف سياسة التشغيل القديمة على مستوى الوكيل بالكامل؛ سياسة تشغيل الموفر/النموذج هي محدد المسار النشط.
    - تنظيف إعدادات Plugin القديمة عندما تكون plugins مفعلة؛ عندما يكون `plugins.enabled=false`، تعامل مراجع Plugin القديمة كإعدادات احتواء خاملة وتحفظ.

  </Accordion>
  <Accordion title="الحالة والسلامة">
    - فحص ملف قفل الجلسة وتنظيف الأقفال القديمة.
    - إصلاح نصوص الجلسات للفروع المكررة الخاصة بإعادة كتابة المطالبات التي أنشأتها إصدارات 2026.4.24 المتأثرة.
    - اكتشاف علامات tombstone لاسترداد إعادة تشغيل الوكلاء الفرعيين العالقين، مع دعم `--fix` لمسح أعلام الاسترداد الملغاة القديمة حتى لا يستمر بدء التشغيل في اعتبار الفرع ملغى بسبب إعادة التشغيل.
    - فحوصات سلامة الحالة والأذونات (sessions, transcripts, state dir).
    - فحوصات أذونات ملف الإعدادات (chmod 600) عند التشغيل محليا.
    - صحة مصادقة النموذج: تفحص انتهاء OAuth، ويمكنها تحديث الرموز التي تقترب من الانتهاء، وتبلغ عن حالات التهدئة/التعطيل في auth-profile.
    - اكتشاف مجلد مساحة عمل إضافي (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway والخدمات والمشرفون">
    - إصلاح صورة sandbox عندما يكون sandboxing مفعلا.
    - ترحيل الخدمة القديمة واكتشاف Gateway إضافي.
    - ترحيل حالة قناة Matrix القديمة (في وضع `--fix` / `--repair`).
    - فحوصات تشغيل Gateway (الخدمة مثبتة لكنها لا تعمل؛ تسمية launchd مخزنة مؤقتا).
    - تحذيرات حالة القنوات (مفحوصة من Gateway قيد التشغيل).
    - فحوصات الأذونات الخاصة بالقنوات موجودة ضمن `openclaw channels capabilities`؛ على سبيل المثال، تدقق أذونات قناة Discord الصوتية باستخدام `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - فحوصات استجابة WhatsApp لتدهور صحة حلقة أحداث Gateway مع استمرار عمل عملاء TUI المحليين؛ يوقف `--fix` عملاء TUI المحليين المتحقق منهم فقط.
    - إصلاح مسار Codex لمراجع النماذج القديمة `openai-codex/*` في النماذج الأساسية، والبدائل، وتجاوزات heartbeat/subagent/compaction، والخطافات، وتجاوزات نماذج القنوات، وتثبيتات مسارات الجلسات؛ يعيد `--fix` كتابتها إلى `openai/*`، ويزيل تثبيتات سياسة التشغيل القديمة للجلسات/الوكيل بالكامل، ويترك مراجع وكيل OpenAI القياسية على حزمة Codex الافتراضية.
    - تدقيق إعدادات المشرف (launchd/systemd/schtasks) مع إصلاح اختياري.
    - تنظيف بيئة الوكيل المضمن لخدمات Gateway التي التقطت قيم `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` من shell أثناء التثبيت أو التحديث.
    - فحوصات أفضل ممارسات تشغيل Gateway (Node مقابل Bun، مسارات مديري الإصدارات).
    - تشخيص تعارض منفذ Gateway (الافتراضي `18789`).

  </Accordion>
  <Accordion title="المصادقة والأمان والاقتران">
    - تحذيرات أمان لسياسات الرسائل المباشرة المفتوحة.
    - فحوصات مصادقة Gateway لوضع الرمز المحلي (تعرض إنشاء رمز عندما لا يوجد مصدر رموز؛ ولا تستبدل إعدادات token SecretRef).
    - اكتشاف مشكلات اقتران الجهاز (طلبات الاقتران الأولى المعلقة، ترقيات الدور/النطاق المعلقة، انحراف ذاكرة التخزين المؤقت القديمة لرمز الجهاز المحلي، وانحراف مصادقة سجل الاقتران).

  </Accordion>
  <Accordion title="مساحة العمل وshell">
    - فحص systemd linger على Linux.
    - فحص حجم ملف تمهيد مساحة العمل (تحذيرات الاقتطاع/الاقتراب من الحد لملفات السياق).
    - فحص جاهزية Skills للوكيل الافتراضي؛ يبلغ عن Skills المسموح بها مع bins أو env أو config أو متطلبات نظام تشغيل مفقودة، ويمكن لـ `--fix` تعطيل Skills غير المتاحة في `skills.entries`.
    - فحص حالة إكمال shell والتثبيت/الترقية التلقائية.
    - فحص جاهزية موفر تضمين البحث في الذاكرة (نموذج محلي، مفتاح API بعيد، أو ملف QMD ثنائي).
    - فحوصات تثبيت المصدر (عدم تطابق مساحة عمل pnpm، أصول واجهة المستخدم المفقودة، ملف tsx الثنائي المفقود).
    - يكتب الإعدادات المحدثة + بيانات معالج الإعداد الوصفية.

  </Accordion>
</AccordionGroup>

## ملء واجهة Dreams UI بأثر رجعي وإعادة ضبطها

يتضمن مشهد Dreams في Control UI إجراءات **Backfill** و**Reset** و**Clear Grounded** لسير عمل Dreaming المؤرض. تستخدم هذه الإجراءات طرائق RPC بأسلوب Gateway doctor، لكنها **ليست** جزءا من إصلاح/ترحيل CLI في `openclaw doctor`.

ما تفعله:

- يفحص **Backfill** ملفات `memory/YYYY-MM-DD.md` التاريخية في مساحة العمل النشطة، ويشغل تمرير يوميات REM المؤرض، ويكتب إدخالات ملء بأثر رجعي قابلة للعكس في `DREAMS.md`.
- يزيل **Reset** إدخالات يوميات الملء بأثر رجعي المحددة فقط من `DREAMS.md`.
- يزيل **Clear Grounded** فقط الإدخالات المرحلية قصيرة الأمد والمؤرضة فقط التي جاءت من إعادة تشغيل تاريخية ولم تجمع بعد استدعاء حيا أو دعما يوميا.

ما **لا** تفعله بمفردها:

- لا تعدل `MEMORY.md`
- لا تشغل ترحيلات doctor كاملة
- لا تدرج المرشحين المؤرضين تلقائيا في مخزن الترقية الحي قصير الأمد إلا إذا شغلت مسار CLI المرحلي صراحة أولا

إذا أردت أن تؤثر إعادة التشغيل التاريخية المؤرضة في مسار الترقية العميقة العادي، فاستخدم تدفق CLI بدلا من ذلك:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

يؤدي ذلك إلى إدراج المرشحين المتينين المؤرضين في مخزن Dreaming قصير الأمد مع إبقاء `DREAMS.md` كسطح للمراجعة.

## السلوك المفصل والمسوغ

<AccordionGroup>
  <Accordion title="0. تحديث اختياري (تثبيتات git)">
    إذا كان هذا checkout من git وكان doctor يعمل تفاعليا، فإنه يعرض التحديث (fetch/rebase/build) قبل تشغيل doctor.
  </Accordion>
  <Accordion title="1. تطبيع الإعدادات">
    إذا احتوت الإعدادات على أشكال قيم قديمة (على سبيل المثال `messages.ackReaction` دون تجاوز خاص بالقناة)، فإن doctor يطبعها إلى المخطط الحالي.

    يشمل ذلك حقول Talk المسطحة القديمة. إعداد الكلام العام الحالي في Talk هو `talk.provider` + `talk.providers.<provider>`، وإعداد الصوت الفوري هو `talk.realtime.*`. يعيد doctor كتابة أشكال `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` القديمة إلى خريطة الموفر، ويعيد كتابة محددات realtime القديمة في المستوى الأعلى (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) إلى `talk.realtime`.

    يحذر doctor أيضا عندما يكون `plugins.allow` غير فارغ وتستخدم سياسة الأدوات
    إدخالات wildcard أو أدوات مملوكة لـ Plugin. لا يطابق `tools.allow: ["*"]` إلا الأدوات
    من plugins التي تحمل فعليا؛ ولا يتجاوز قائمة سماح Plugin الحصرية.
    يكتب doctor القيمة `plugins.bundledDiscovery: "compat"` لإعدادات قائمة السماح
    القديمة المرحلة للحفاظ على سلوك الموفرات المضمنة الحالي، ثم
    يشير إلى إعداد `"allowlist"` الأكثر صرامة.

  </Accordion>
  <Accordion title="2. ترحيلات مفاتيح الإعدادات القديمة">
    عندما تحتوي الإعدادات على مفاتيح مهملة، ترفض الأوامر الأخرى التشغيل وتطلب منك تشغيل `openclaw doctor`.

    سيقوم doctor بما يلي:

    - شرح المفاتيح القديمة التي عثر عليها.
    - إظهار الترحيل الذي طبقه.
    - إعادة كتابة `~/.openclaw/openclaw.json` بالمخطط المحدث.

    يرفض بدء تشغيل Gateway تنسيقات الإعدادات القديمة ويطلب منك تشغيل `openclaw doctor --fix`؛ ولا يعيد كتابة `openclaw.json` عند بدء التشغيل. تتولى `openclaw doctor --fix` أيضا ترحيلات مخزن مهام Cron.

    الترحيلات الحالية:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - إعدادات القنوات المكوّنة التي تفتقد سياسة رد مرئية → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` على المستوى الأعلى
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - عناصر `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` القديمة → `talk.provider` + `talk.providers.<provider>`
    - محددات Talk في الوقت الفعلي القديمة على المستوى الأعلى (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - بالنسبة إلى القنوات التي تحتوي على `accounts` مسماة مع بقاء قيم قناة على المستوى الأعلى لحساب واحد، انقل تلك القيم محددة النطاق بالحساب إلى الحساب المرقي المختار لتلك القناة (`accounts.default` لمعظم القنوات؛ يمكن أن يحتفظ Matrix بهدف مسمى/افتراضي مطابق موجود)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - أزل `agents.defaults.llm`؛ استخدم `models.providers.<id>.timeoutSeconds` لمهل انتظار المزود/النموذج البطيئة
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - أزل `browser.relayBindHost` (إعداد مرحّل الإضافة القديم)
    - `models.providers.*.api: "openai"` القديمة → `"openai-completions"` (يتخطى بدء Gateway أيضًا المزودين الذين تم تعيين `api` لديهم إلى قيمة تعداد مستقبلية أو غير معروفة بدلًا من الفشل المغلق)
    - أزل `plugins.entries.codex.config.codexDynamicToolsProfile`؛ يحافظ خادم تطبيق Codex دائمًا على أدوات مساحة العمل الأصلية في Codex كأدوات أصلية

    تتضمن تحذيرات Doctor أيضًا إرشادات افتراضيات الحساب للقنوات متعددة الحسابات:

    - إذا تم تكوين إدخالين أو أكثر من `channels.<channel>.accounts` من دون `channels.<channel>.defaultAccount` أو `accounts.default`، يحذر Doctor من أن توجيه الرجوع قد يختار حسابًا غير متوقع.
    - إذا تم تعيين `channels.<channel>.defaultAccount` إلى معرّف حساب غير معروف، يحذر Doctor ويسرد معرّفات الحسابات المكوّنة.

  </Accordion>
  <Accordion title="2b. تجاوزات مزود OpenCode">
    إذا أضفت `models.providers.opencode` أو `opencode-zen` أو `opencode-go` يدويًا، فإنه يتجاوز كتالوج OpenCode المدمج من `@earendil-works/pi-ai`. قد يؤدي ذلك إلى إجبار النماذج على API غير صحيح أو تصفير التكاليف. يحذر Doctor حتى تتمكن من إزالة التجاوز واستعادة توجيه API والتكاليف لكل نموذج.
  </Accordion>
  <Accordion title="2c. ترحيل المتصفح وجاهزية Chrome MCP">
    إذا كان تكوين المتصفح لديك لا يزال يشير إلى مسار إضافة Chrome الذي أزيل، فسيقوم Doctor بتطبيعه إلى نموذج إرفاق Chrome MCP المحلي الحالي على المضيف:

    - يصبح `browser.profiles.*.driver: "extension"` هو `"existing-session"`
    - تتم إزالة `browser.relayBindHost`

    يراجع Doctor أيضًا مسار Chrome MCP المحلي على المضيف عند استخدام `defaultProfile: "user"` أو ملف تعريف `existing-session` مكوّن:

    - يتحقق مما إذا كان Google Chrome مثبتًا على المضيف نفسه لملفات التعريف الافتراضية ذات الاتصال التلقائي
    - يتحقق من إصدار Chrome المكتشف ويحذر عندما يكون أقل من Chrome 144
    - يذكّرك بتمكين تصحيح الأخطاء عن بُعد في صفحة فحص المتصفح (على سبيل المثال `chrome://inspect/#remote-debugging` أو `brave://inspect/#remote-debugging` أو `edge://inspect/#remote-debugging`)

    لا يمكن لـ Doctor تمكين الإعداد الخاص بـ Chrome نيابة عنك. لا يزال Chrome MCP المحلي على المضيف يتطلب:

    - متصفحًا قائمًا على Chromium بإصدار 144+ على مضيف gateway/node
    - تشغيل المتصفح محليًا
    - تمكين تصحيح الأخطاء عن بُعد في ذلك المتصفح
    - الموافقة على مطالبة موافقة الإرفاق الأولى في المتصفح

    الجاهزية هنا تتعلق فقط بمتطلبات الإرفاق المحلية. يحافظ Existing-session على حدود مسار Chrome MCP الحالية؛ ولا تزال المسارات المتقدمة مثل `responsebody` وتصدير PDF واعتراض التنزيلات والإجراءات الدفعية تتطلب متصفحًا مُدارًا أو ملف تعريف CDP خامًا.

    لا ينطبق هذا الفحص **على** Docker أو sandbox أو remote-browser أو التدفقات الأخرى عديمة الواجهة. تستمر هذه في استخدام CDP الخام.

  </Accordion>
  <Accordion title="2d. متطلبات OAuth TLS الأساسية">
    عند تكوين ملف تعريف OpenAI Codex OAuth، يفحص doctor نقطة نهاية تفويض OpenAI للتحقق من أن مكدس TLS المحلي في Node/OpenSSL يمكنه التحقق من سلسلة الشهادات. إذا فشل الفحص بسبب خطأ في الشهادة (على سبيل المثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`، أو شهادة منتهية الصلاحية، أو شهادة موقعة ذاتيًا)، يطبع doctor إرشادات إصلاح خاصة بالنظام الأساسي. على macOS مع Node من Homebrew، يكون الإصلاح عادةً `brew postinstall ca-certificates`. مع `--deep`، يُشغَّل الفحص حتى إذا كان Gateway سليمًا.
  </Accordion>
  <Accordion title="2e. تجاوزات موفر Codex OAuth">
    إذا كنت قد أضفت سابقًا إعدادات نقل OpenAI قديمة ضمن `models.providers.openai-codex`، فقد تحجب مسار موفر Codex OAuth المدمج الذي تستخدمه الإصدارات الأحدث تلقائيًا. يحذرك Doctor عندما يرى إعدادات النقل القديمة هذه إلى جانب Codex OAuth حتى تتمكن من إزالة تجاوز النقل القديم أو إعادة كتابته واستعادة سلوك التوجيه/الرجوع الاحتياطي المدمج. لا تزال الوكلاء المخصصون والتجاوزات المعتمدة على الرؤوس فقط مدعومة ولا تؤدي إلى ظهور هذا التحذير.
  </Accordion>
  <Accordion title="2f. إصلاح مسار Codex">
    يتحقق Doctor من مراجع النماذج القديمة `openai-codex/*`. يستخدم توجيه حزام Codex الأصلي مراجع نماذج معيارية `openai/*`؛ تمر دورات وكيل OpenAI عبر حزام خادم تطبيق Codex بدلًا من مسار OpenClaw PI OpenAI.

    في وضع `--fix` / `--repair`، يعيد doctor كتابة مراجع الوكيل الافتراضي والمراجع الخاصة بكل وكيل المتأثرة، بما في ذلك النماذج الأساسية، والبدائل الاحتياطية، وتجاوزات heartbeat/الوكيل الفرعي/compaction، والخطافات، وتجاوزات نماذج القنوات، وحالة مسار الجلسة المستمرة القديمة:

    - يتحول `openai-codex/gpt-*` إلى `openai/gpt-*`.
    - ينتقل قصد Codex إلى إدخالات `agentRuntime.id: "codex"` محددة بنطاق الموفر/النموذج لمراجع نماذج الوكلاء التي تم إصلاحها، بحيث تظل ملفات تعريف المصادقة `openai-codex:...` قابلة للاختيار بعد أن يصبح مرجع النموذج `openai/*`.
    - تتم إزالة إعدادات وقت التشغيل القديمة للوكيل بالكامل وتثبيتات وقت التشغيل المستمرة للجلسات لأن اختيار وقت التشغيل محدد بنطاق الموفر/النموذج.
    - تُحفظ سياسة وقت التشغيل الحالية للموفر/النموذج ما لم يحتج مرجع النموذج القديم الذي تم إصلاحه إلى توجيه Codex للحفاظ على مسار المصادقة القديم.
    - تُحفظ قوائم بدائل النماذج الحالية مع إعادة كتابة إدخالاتها القديمة؛ وتنتقل الإعدادات المنسوخة لكل نموذج من المفتاح القديم إلى مفتاح `openai/*` المعياري.
    - يتم إصلاح `modelProvider`/`providerOverride` و`model`/`modelOverride` المستمرة للجلسة، وإشعارات الرجوع الاحتياطي، وتثبيتات ملف تعريف المصادقة عبر جميع مخازن جلسات الوكلاء المكتشفة.
    - يعني `/codex ...` "التحكم في محادثة Codex أصلية من الدردشة أو ربطها."
    - يعني `/acp ...` أو `runtime: "acp"` "استخدام محول ACP/acpx الخارجي."

  </Accordion>
  <Accordion title="2g. تنظيف مسار الجلسة">
    يفحص Doctor أيضًا مخازن جلسات الوكلاء المكتشفة بحثًا عن حالة مسار قديمة أُنشئت تلقائيًا بعد نقل النماذج المكونة أو وقت التشغيل بعيدًا عن مسار مملوك Plugin مثل Codex.

    يمكن لـ `openclaw doctor --fix` مسح الحالة القديمة المنشأة تلقائيًا مثل تثبيتات النماذج `modelOverrideSource: "auto"`، وبيانات تعريف نموذج وقت التشغيل، ومعرفات الحزام المثبتة، وروابط جلسات CLI، وتجاوزات ملف تعريف المصادقة التلقائية عندما لا يعود المسار المالك لها مكوّنًا. يتم الإبلاغ عن اختيارات نماذج الجلسة الصريحة من المستخدم أو القديمة للمراجعة اليدوية وتُترك دون تغيير؛ بدّلها باستخدام `/model ...` أو `/new` أو أعد تعيين الجلسة عندما لا يعود ذلك المسار مقصودًا.

  </Accordion>
  <Accordion title="3. ترحيلات الحالة القديمة (تخطيط القرص)">
    يمكن لـ Doctor ترحيل التخطيطات القديمة على القرص إلى البنية الحالية:

    - مخزن الجلسات + النصوص:
      - من `~/.openclaw/sessions/` إلى `~/.openclaw/agents/<agentId>/sessions/`
    - دليل الوكيل:
      - من `~/.openclaw/agent/` إلى `~/.openclaw/agents/<agentId>/agent/`
    - حالة مصادقة WhatsApp (Baileys):
      - من `~/.openclaw/credentials/*.json` القديم (باستثناء `oauth.json`)
      - إلى `~/.openclaw/credentials/whatsapp/<accountId>/...` (معرف الحساب الافتراضي: `default`)

    هذه الترحيلات تُبذل على أساس أفضل جهد ومصممة لتكون قابلة للتكرار؛ سيصدر doctor تحذيرات عندما يترك أي مجلدات قديمة كنسخ احتياطية. يقوم Gateway/CLI أيضًا بترحيل الجلسات القديمة + دليل الوكيل تلقائيًا عند بدء التشغيل بحيث ينتقل السجل/المصادقة/النماذج إلى المسار الخاص بكل وكيل دون تشغيل doctor يدويًا. يتم ترحيل مصادقة WhatsApp عمدًا عبر `openclaw doctor` فقط. تقارن تسوية موفر المحادثة/خريطة الموفر الآن بالمساواة البنيوية، لذلك لم تعد الفروقات التي تقتصر على ترتيب المفاتيح تؤدي إلى تغييرات `doctor --fix` متكررة بلا أثر.

  </Accordion>
  <Accordion title="3a. ترحيلات بيان Plugin القديم">
    يفحص Doctor جميع بيانات plugins المثبتة بحثًا عن مفاتيح قدرات علوية مهملة (`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders`). عند العثور عليها، يعرض نقلها إلى كائن `contracts` وإعادة كتابة ملف البيان في مكانه. هذا الترحيل قابل للتكرار؛ إذا كان مفتاح `contracts` يحتوي بالفعل على القيم نفسها، تتم إزالة المفتاح القديم دون تكرار البيانات.
  </Accordion>
  <Accordion title="3b. ترحيلات مخزن Cron القديم">
    يتحقق Doctor أيضًا من مخزن مهام cron (`~/.openclaw/cron/jobs.json` افتراضيًا، أو `cron.store` عند تجاوزه) بحثًا عن أشكال مهام قديمة لا يزال المجدول يقبلها للتوافق.

    تشمل عمليات تنظيف cron الحالية:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - حقول الحمولة في المستوى الأعلى (`message`، `model`، `thinking`، ...) → `payload`
    - حقول التسليم في المستوى الأعلى (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - الأسماء المستعارة للتسليم `provider` في الحمولة → `delivery.channel` صريح
    - مهام Webhook الاحتياطية القديمة البسيطة `notify: true` → `delivery.mode="webhook"` صريح مع `delivery.to=cron.webhook`

    لا ترحّل أداة الفحص مهام `notify: true` تلقائيًا إلا عندما يمكنها فعل ذلك من دون تغيير السلوك. إذا جمعت مهمة بين الرجوع الاحتياطي القديم للإشعار ووضع تسليم غير Webhook موجود، فتعرض أداة الفحص تحذيرًا وتترك تلك المهمة للمراجعة اليدوية.

    على Linux، تعرض أداة الفحص أيضًا تحذيرًا عندما لا يزال crontab الخاص بالمستخدم يستدعي `~/.openclaw/bin/ensure-whatsapp.sh` القديم. هذا السكربت المحلي للمضيف لا تتم صيانته بواسطة OpenClaw الحالي، ويمكنه كتابة رسائل `Gateway inactive` خاطئة إلى `~/.openclaw/logs/whatsapp-health.log` عندما لا يستطيع cron الوصول إلى ناقل مستخدم systemd. أزل إدخال crontab القديم باستخدام `crontab -e`؛ واستخدم `openclaw channels status --probe` و`openclaw doctor` و`openclaw gateway status` لفحوصات الصحة الحالية.

  </Accordion>
  <Accordion title="3c. تنظيف قفل الجلسة">
    تفحص أداة الفحص كل دليل جلسة وكيل بحثًا عن ملفات أقفال كتابة قديمة — وهي ملفات تُترك عندما تنتهي جلسة بشكل غير طبيعي. لكل ملف قفل تجده، تعرض: المسار، وPID، وما إذا كان PID لا يزال حيًا، وعمر القفل، وما إذا كان يُعد قديمًا (PID ميت، أو أقدم من 30 دقيقة، أو PID حي يمكن إثبات أنه ينتمي إلى عملية غير OpenClaw). في وضع `--fix` / `--repair` تزيل ملفات القفل القديمة تلقائيًا؛ وإلا فتطبع ملاحظة وتطلب منك إعادة التشغيل مع `--fix`.
  </Accordion>
  <Accordion title="3d. إصلاح فرع نص الجلسة">
    تفحص أداة الفحص ملفات JSONL لجلسات الوكلاء بحثًا عن شكل الفرع المكرر الذي أنشأه خطأ إعادة كتابة نص المطالبة في 2026.4.24: دور مستخدم متروك يحتوي على سياق تشغيل داخلي من OpenClaw، مع شقيق نشط يحتوي على مطالبة المستخدم المرئية نفسها. في وضع `--fix` / `--repair`، تنسخ أداة الفحص كل ملف متأثر احتياطيًا بجانب الأصل وتعيد كتابة النص إلى الفرع النشط كي لا يرى سجل Gateway وقارئو الذاكرة أدوارًا مكررة بعد الآن.
  </Accordion>
  <Accordion title="4. فحوصات سلامة الحالة (استمرارية الجلسة والتوجيه والسلامة)">
    دليل الحالة هو جذع الدماغ التشغيلي. إذا اختفى، فستفقد الجلسات وبيانات الاعتماد والسجلات والتكوين (ما لم تكن لديك نسخ احتياطية في مكان آخر).

    تفحص أداة الفحص:

    - **دليل الحالة مفقود**: تحذر من فقدان كارثي للحالة، وتطلب إعادة إنشاء الدليل، وتذكّرك بأنها لا تستطيع استرداد البيانات المفقودة.
    - **أذونات دليل الحالة**: تتحقق من قابلية الكتابة؛ وتعرض إصلاح الأذونات (وتصدر تلميح `chown` عند اكتشاف عدم تطابق المالك/المجموعة).
    - **دليل حالة macOS متزامن مع السحابة**: تحذر عندما يُحل مسار الحالة ضمن iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) أو `~/Library/CloudStorage/...` لأن المسارات المدعومة بالمزامنة يمكن أن تسبب إدخال/إخراج أبطأ وتسابقات قفل/مزامنة.
    - **دليل حالة Linux على SD أو eMMC**: تحذر عندما يُحل مسار الحالة إلى مصدر تركيب `mmcblk*`، لأن الإدخال/الإخراج العشوائي المدعوم بـ SD أو eMMC يمكن أن يكون أبطأ ويتآكل أسرع تحت كتابات الجلسات وبيانات الاعتماد.
    - **أدلة الجلسات مفقودة**: يلزم وجود `sessions/` ودليل مخزن الجلسات لاستمرار السجل وتجنب أعطال `ENOENT`.
    - **عدم تطابق النص**: تحذر عندما تكون إدخالات الجلسات الحديثة تفتقد ملفات النص.
    - **الجلسة الرئيسية "JSONL بسطر واحد"**: تضع علامة عندما يحتوي النص الرئيسي على سطر واحد فقط (السجل لا يتراكم).
    - **عدة أدلة حالة**: تحذر عندما توجد عدة مجلدات `~/.openclaw` عبر أدلة المنزل أو عندما يشير `OPENCLAW_STATE_DIR` إلى مكان آخر (يمكن أن ينقسم السجل بين التثبيتات).
    - **تذكير الوضع البعيد**: إذا كان `gateway.mode=remote`، تذكّرك أداة الفحص بتشغيلها على المضيف البعيد (توجد الحالة هناك).
    - **أذونات ملف التكوين**: تحذر إذا كان `~/.openclaw/openclaw.json` قابلًا للقراءة من المجموعة/العالم وتعرض تشديده إلى `600`.

  </Accordion>
  <Accordion title="5. صحة مصادقة النموذج (انتهاء OAuth)">
    تفحص أداة الفحص ملفات تعريف OAuth في مخزن المصادقة، وتحذر عندما تكون الرموز على وشك الانتهاء أو منتهية، ويمكنها تحديثها عندما يكون ذلك آمنًا. إذا كان ملف تعريف OAuth/الرمز الخاص بـ Anthropic قديمًا، تقترح مفتاح Anthropic API أو مسار رمز إعداد Anthropic. لا تظهر مطالبات التحديث إلا عند التشغيل تفاعليًا (TTY)؛ ويتجاوز `--non-interactive` محاولات التحديث.

    عندما يفشل تحديث OAuth بشكل دائم (مثل `refresh_token_reused` أو `invalid_grant` أو عندما يطلب منك مزود تسجيل الدخول مرة أخرى)، تبلغ أداة الفحص أن إعادة المصادقة مطلوبة وتطبع أمر `openclaw models auth login --provider ...` الدقيق المطلوب تشغيله.

    تعرض أداة الفحص أيضًا ملفات تعريف المصادقة غير القابلة للاستخدام مؤقتًا بسبب:

    - فترات تهدئة قصيرة (حدود معدل/مهلات/فشل مصادقة)
    - تعطيلات أطول (فشل الفوترة/الرصيد)

  </Accordion>
  <Accordion title="6. التحقق من نموذج الخطافات">
    إذا كان `hooks.gmail.model` مضبوطًا، تتحقق أداة الفحص من مرجع النموذج مقابل الكتالوج وقائمة السماح وتحذر عندما لا يمكن حله أو يكون غير مسموح.
  </Accordion>
  <Accordion title="7. إصلاح صورة الصندوق الرملي">
    عندما يكون العزل في صندوق رملي مفعّلًا، تفحص أداة الفحص صور Docker وتعرض بناءها أو التبديل إلى الأسماء القديمة إذا كانت الصورة الحالية مفقودة.
  </Accordion>
  <Accordion title="7b. تنظيف تثبيت Plugin">
    تزيل أداة الفحص حالة تجهيز تبعيات Plugin القديمة التي أنشأها OpenClaw في وضع `openclaw doctor --fix` / `openclaw doctor --repair`. يشمل ذلك جذور التبعيات المولدة القديمة، وأدلة مرحلة التثبيت القديمة، ومخلفات الحزم المحلية من كود إصلاح تبعيات Plugin المجمعة السابق، والنسخ المدارة اليتيمة أو المستردة من npm لملحقات `@openclaw/*` المجمعة التي يمكن أن تحجب بيان الحزمة المجمعة الحالي. كما تعيد أداة الفحص ربط حزمة `openclaw` الخاصة بالمضيف داخل ملحقات npm المدارة التي تعلن `peerDependencies.openclaw`، بحيث تستمر استيرادات التشغيل المحلية للحزمة مثل `openclaw/plugin-sdk/*` في الحل بعد التحديثات أو إصلاحات npm.

    يمكن لأداة الفحص أيضًا إعادة تثبيت الملحقات القابلة للتنزيل المفقودة عندما يشير إليها التكوين لكن سجل Plugin المحلي لا يستطيع العثور عليها. تشمل الأمثلة `plugins.entries` المادية، وإعدادات القناة/المزود/البحث المكوّنة، وتشغيلات الوكلاء المكوّنة. أثناء تحديثات الحزم، تتجنب أداة الفحص تشغيل إصلاح Plugin عبر مدير الحزم بينما يجري تبديل الحزمة الأساسية؛ شغّل `openclaw doctor --fix` مرة أخرى بعد التحديث إذا كان Plugin مكوّن لا يزال يحتاج إلى الاسترداد. لا يشغّل بدء Gateway ولا إعادة تحميل التكوين مديري الحزم؛ وتظل تثبيتات Plugin عملًا صريحًا عبر أداة الفحص/التثبيت/التحديث.

  </Accordion>
  <Accordion title="8. ترحيلات خدمة Gateway وتلميحات التنظيف">
    تكتشف أداة الفحص خدمات Gateway القديمة (launchd/systemd/schtasks) وتعرض إزالتها وتثبيت خدمة OpenClaw باستخدام منفذ Gateway الحالي. ويمكنها أيضًا البحث عن خدمات إضافية شبيهة بـ Gateway وطباعة تلميحات تنظيف. تُعد خدمات Gateway الخاصة بـ OpenClaw والمسمّاة حسب ملف التعريف خدمات من الدرجة الأولى ولا تُعلّم على أنها "إضافية".

    على Linux، إذا كانت خدمة Gateway على مستوى المستخدم مفقودة لكن توجد خدمة Gateway لـ OpenClaw على مستوى النظام، فلا تثبت أداة الفحص خدمة ثانية على مستوى المستخدم تلقائيًا. افحص باستخدام `openclaw gateway status --deep` أو `openclaw doctor --deep`، ثم أزل التكرار أو اضبط `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يكون مشرف نظام هو مالك دورة حياة Gateway.

  </Accordion>
  <Accordion title="8b. ترحيل Startup Matrix">
    عندما يكون لدى حساب قناة Matrix ترحيل حالة قديم معلق أو قابل للتنفيذ، تنشئ أداة الفحص (في وضع `--fix` / `--repair`) لقطة قبل الترحيل ثم تشغّل خطوات الترحيل بأفضل جهد: ترحيل حالة Matrix القديمة وتحضير الحالة المشفرة القديمة. كلتا الخطوتين غير قاتلتين؛ تُسجل الأخطاء ويستمر بدء التشغيل. في وضع القراءة فقط (`openclaw doctor` دون `--fix`) يُتخطى هذا الفحص بالكامل.
  </Accordion>
  <Accordion title="8c. اقتران الجهاز وانحراف المصادقة">
    تفحص أداة الفحص الآن حالة اقتران الأجهزة ضمن مسار الصحة العادي.

    ما تعرضه:

    - طلبات اقتران أول مرة معلقة
    - ترقيات أدوار معلقة للأجهزة المقترنة مسبقًا
    - ترقيات نطاق معلقة للأجهزة المقترنة مسبقًا
    - إصلاحات عدم تطابق المفتاح العام حيث لا يزال معرّف الجهاز مطابقًا لكن هوية الجهاز لم تعد تطابق السجل المعتمد
    - سجلات مقترنة تفتقد رمزًا نشطًا لدور معتمد
    - رموز مقترنة انحرفت نطاقاتها خارج خط أساس الاقتران المعتمد
    - إدخالات رمز جهاز مخزنة محليًا للجهاز الحالي تسبق تدوير رمز من جهة Gateway أو تحمل بيانات وصفية قديمة للنطاق

    لا توافق أداة الفحص تلقائيًا على طلبات الاقتران ولا تدوّر رموز الأجهزة تلقائيًا. بل تطبع الخطوات التالية الدقيقة بدلًا من ذلك:

    - افحص الطلبات المعلقة باستخدام `openclaw devices list`
    - وافق على الطلب الدقيق باستخدام `openclaw devices approve <requestId>`
    - دوّر رمزًا جديدًا باستخدام `openclaw devices rotate --device <deviceId> --role <role>`
    - أزل سجلًا قديمًا وأعد اعتماده باستخدام `openclaw devices remove <deviceId>`

    هذا يغلق الثغرة الشائعة "مقترن بالفعل لكن لا يزال يطلب الاقتران": تميّز أداة الفحص الآن بين الاقتران للمرة الأولى وترقيات الدور/النطاق المعلقة وانحراف الرمز/هوية الجهاز القديمة.

  </Accordion>
  <Accordion title="9. تحذيرات الأمان">
    تصدر أداة الفحص تحذيرات عندما يكون مزود مفتوحًا للرسائل الخاصة من دون قائمة سماح، أو عندما تُكوّن سياسة بطريقة خطرة.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    إذا كان التشغيل يتم كخدمة مستخدم systemd، تضمن أداة الفحص تفعيل البقاء كي يظل Gateway حيًا بعد تسجيل الخروج.
  </Accordion>
  <Accordion title="11. حالة مساحة العمل (Skills وPlugin والأدلة القديمة)">
    تطبع أداة الفحص ملخصًا لحالة مساحة العمل للوكيل الافتراضي:

    - **حالة Skills**: تعد Skills المؤهلة، وناقصة المتطلبات، والمحظورة بقائمة السماح.
    - **أدلة مساحة العمل القديمة**: تحذر عندما توجد `~/openclaw` أو أدلة مساحة عمل قديمة أخرى بجانب مساحة العمل الحالية.
    - **حالة Plugin**: تعد الملحقات المفعلة/المعطلة/التي بها أخطاء؛ وتسرد معرّفات Plugin لأي أخطاء؛ وتعرض قدرات Plugin المجمعة.
    - **تحذيرات توافق Plugin**: تضع علامة على الملحقات التي لديها مشاكل توافق مع بيئة التشغيل الحالية.
    - **تشخيصات Plugin**: تعرض أي تحذيرات أو أخطاء وقت التحميل صادرة عن سجل Plugin.

  </Accordion>
  <Accordion title="11b. حجم ملف التمهيد">
    تتحقق أداة الفحص مما إذا كانت ملفات تمهيد مساحة العمل (مثل `AGENTS.md` أو `CLAUDE.md` أو ملفات سياق محقونة أخرى) قريبة من ميزانية الأحرف المكوّنة أو تتجاوزها. وتعرض لكل ملف عدد الأحرف الخام مقابل المحقونة، ونسبة الاقتطاع، وسبب الاقتطاع (`max/file` أو `max/total`)، وإجمالي الأحرف المحقونة كجزء من الميزانية الإجمالية. عندما تكون الملفات مقتطعة أو قريبة من الحد، تطبع أداة الفحص نصائح لضبط `agents.defaults.bootstrapMaxChars` و`agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. تنظيف Plugin قناة قديم">
    عندما يزيل `openclaw doctor --fix` Plugin قناة مفقودًا، فإنه يزيل أيضًا التكوين المتدلي ذي نطاق القناة الذي أشار إلى ذلك Plugin: إدخالات `channels.<id>`، وأهداف Heartbeat التي سمّت القناة، وتجاوزات `agents.*.models["<channel>/*"]`. يمنع هذا حلقات تمهيد Gateway حيث اختفى تشغيل القناة لكن التكوين لا يزال يطلب من Gateway الارتباط بها.
  </Accordion>
  <Accordion title="11c. إكمال الصدفة">
    تتحقق أداة الفحص مما إذا كان إكمال tab مثبتًا للصدفة الحالية (zsh أو bash أو fish أو PowerShell):

    - إذا كان ملف تعريف الصدفة يستخدم نمط إكمال ديناميكيًا بطيئًا (`source <(openclaw completion ...)`)، فسيُرقّيه doctor إلى صيغة ملف ذاكرة تخزين مؤقت أسرع.
    - إذا كان الإكمال مكوّنًا في ملف التعريف لكن ملف ذاكرة التخزين المؤقت مفقود، فسيعيد doctor إنشاء ذاكرة التخزين المؤقت تلقائيًا.
    - إذا لم يكن أي إكمال مكوّنًا على الإطلاق، فسيطالب doctor بتثبيته (في الوضع التفاعلي فقط؛ ويتم تخطيه مع `--non-interactive`).

    شغّل `openclaw completion --write-state` لإعادة إنشاء ذاكرة التخزين المؤقت يدويًا.

  </Accordion>
  <Accordion title="12. فحوصات مصادقة Gateway (رمز محلي)">
    يتحقق Doctor من جاهزية مصادقة رمز Gateway المحلي.

    - إذا كان وضع الرمز يحتاج إلى رمز ولا يوجد أي مصدر رمز، يعرض doctor إنشاء واحد.
    - إذا كان `gateway.auth.token` مُدارًا عبر SecretRef لكنه غير متاح، يحذّر doctor ولا يستبدله بنص صريح.
    - يفرض `openclaw doctor --generate-gateway-token` الإنشاء فقط عندما لا يكون أي SecretRef للرمز مكوّنًا.

  </Accordion>
  <Accordion title="12b. إصلاحات للقراءة فقط ومدركة لـ SecretRef">
    تحتاج بعض تدفقات الإصلاح إلى فحص بيانات الاعتماد المكوّنة دون إضعاف سلوك الفشل السريع في وقت التشغيل.

    - يستخدم `openclaw doctor --fix` الآن نموذج ملخص SecretRef نفسه للقراءة فقط الذي تستخدمه أوامر عائلة الحالة لإصلاحات التكوين المستهدفة.
    - مثال: يحاول إصلاح Telegram `allowFrom` / `groupAllowFrom` `@username` استخدام بيانات اعتماد البوت المكوّنة عند توفرها.
    - إذا كان رمز بوت Telegram مكوّنًا عبر SecretRef لكنه غير متاح في مسار الأمر الحالي، يبلّغ doctor بأن بيانات الاعتماد مكوّنة لكنها غير متاحة، ويتخطى الحل التلقائي بدلًا من التعطل أو الإبلاغ خطأً عن أن الرمز مفقود.

  </Accordion>
  <Accordion title="13. فحص صحة Gateway + إعادة التشغيل">
    يشغّل Doctor فحص صحة ويعرض إعادة تشغيل Gateway عندما يبدو غير سليم.
  </Accordion>
  <Accordion title="13b. جاهزية بحث الذاكرة">
    يتحقق Doctor مما إذا كان موفر تضمينات بحث الذاكرة المكوّن جاهزًا للوكيل الافتراضي. يعتمد السلوك على الخلفية والموفر المكوّنين:

    - **خلفية QMD**: يتحقق مما إذا كان ملف `qmd` الثنائي متاحًا وقابلًا للبدء. إذا لم يكن كذلك، يطبع إرشادات إصلاح تشمل حزمة npm وخيار مسار ثنائي يدوي.
    - **موفر محلي صريح**: يتحقق من وجود ملف نموذج محلي أو عنوان URL معروف لنموذج بعيد/قابل للتنزيل. إذا كان مفقودًا، يقترح التحويل إلى موفر بعيد.
    - **موفر بعيد صريح** (`openai`، `voyage`، إلخ): يتحقق من وجود مفتاح API في البيئة أو مخزن المصادقة. يطبع تلميحات إصلاح قابلة للتنفيذ إذا كان مفقودًا.
    - **موفر تلقائي**: يتحقق من توفر النموذج المحلي أولًا، ثم يجرب كل موفر بعيد بترتيب الاختيار التلقائي.

    عندما تكون نتيجة فحص Gateway مخزنة مؤقتًا متاحة (كان Gateway سليمًا وقت الفحص)، يطابق doctor نتيجتها مع التكوين المرئي من CLI ويذكر أي اختلاف. لا يبدأ Doctor اختبار تضمينات جديدًا في المسار الافتراضي؛ استخدم أمر حالة الذاكرة العميق عندما تريد فحص موفر مباشرًا.

    استخدم `openclaw memory status --deep` للتحقق من جاهزية التضمينات في وقت التشغيل.

  </Accordion>
  <Accordion title="14. تحذيرات حالة القناة">
    إذا كان Gateway سليمًا، يشغّل doctor فحص حالة القناة ويبلّغ عن التحذيرات مع إصلاحات مقترحة.
  </Accordion>
  <Accordion title="15. تدقيق تكوين المشرف + الإصلاح">
    يتحقق Doctor من تكوين المشرف المثبّت (launchd/systemd/schtasks) بحثًا عن الإعدادات الافتراضية المفقودة أو القديمة (مثل تبعيات systemd network-online وتأخير إعادة التشغيل). عندما يجد عدم تطابق، يوصي بتحديث ويمكنه إعادة كتابة ملف الخدمة/المهمة إلى الإعدادات الافتراضية الحالية.

    ملاحظات:

    - يطلب `openclaw doctor` التأكيد قبل إعادة كتابة تكوين المشرف.
    - يقبل `openclaw doctor --yes` مطالبات الإصلاح الافتراضية.
    - يطبق `openclaw doctor --repair` الإصلاحات الموصى بها دون مطالبات.
    - يستبدل `openclaw doctor --repair --force` تكوينات المشرف المخصصة.
    - يبقي `OPENCLAW_SERVICE_REPAIR_POLICY=external` doctor في وضع القراءة فقط لدورة حياة خدمة Gateway. يظل يبلّغ عن صحة الخدمة ويشغّل الإصلاحات غير الخدمية، لكنه يتخطى تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة، وإعادة كتابة تكوينات المشرف، وتنظيف الخدمات القديمة لأن مشرفًا خارجيًا يملك دورة الحياة تلك.
    - على Linux، لا يعيد doctor كتابة بيانات تعريف الأمر/نقطة الدخول بينما تكون وحدة systemd المطابقة لـ Gateway نشطة. كما يتجاهل وحدات Gateway-like الإضافية غير القديمة وغير النشطة أثناء فحص الخدمات المكررة حتى لا تنشئ ملفات الخدمة المصاحبة ضجيج تنظيف.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان `gateway.auth.token` مُدارًا عبر SecretRef، فإن تثبيت/إصلاح خدمة doctor يتحقق من SecretRef لكنه لا يحفظ قيم الرمز النصية الصريحة المحلولة في بيانات تعريف بيئة خدمة المشرف.
    - يكتشف Doctor قيم بيئة الخدمة المُدارة المدعومة بـ `.env`/SecretRef التي كانت تثبيتات LaunchAgent أو systemd أو Windows Scheduled Task القديمة تضمنها بشكل مباشر، ويعيد كتابة بيانات تعريف الخدمة بحيث تُحمّل تلك القيم من مصدر وقت التشغيل بدلًا من تعريف المشرف.
    - يكتشف Doctor عندما يظل أمر الخدمة يثبت `--port` قديمًا بعد تغيير `gateway.port` ويعيد كتابة بيانات تعريف الخدمة إلى المنفذ الحالي.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef للرمز المكوّن غير محلول، يحظر doctor مسار التثبيت/الإصلاح مع إرشادات قابلة للتنفيذ.
    - إذا كان كل من `gateway.auth.token` و `gateway.auth.password` مكوّنين وكان `gateway.auth.mode` غير مضبوط، يحظر doctor التثبيت/الإصلاح حتى يُضبط الوضع صراحةً.
    - بالنسبة إلى وحدات user-systemd على Linux، تشمل فحوصات انحراف رمز doctor الآن مصادر `Environment=` و `EnvironmentFile=` عند مقارنة بيانات تعريف مصادقة الخدمة.
    - ترفض إصلاحات خدمة Doctor إعادة كتابة خدمة Gateway أو إيقافها أو إعادة تشغيلها من ملف OpenClaw ثنائي أقدم عندما يكون التكوين قد كُتب آخر مرة بإصدار أحدث. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - يمكنك دائمًا فرض إعادة كتابة كاملة عبر `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. تشخيصات وقت تشغيل Gateway والمنفذ">
    يفحص Doctor وقت تشغيل الخدمة (PID، وآخر حالة خروج) ويحذّر عندما تكون الخدمة مثبتة لكنها لا تعمل فعليًا. كما يتحقق من تعارضات المنفذ على منفذ Gateway (الافتراضي `18789`) ويبلّغ عن الأسباب المحتملة (Gateway يعمل مسبقًا، نفق SSH).
  </Accordion>
  <Accordion title="17. أفضل ممارسات وقت تشغيل Gateway">
    يحذّر Doctor عندما تعمل خدمة Gateway على Bun أو مسار Node مُدار بالإصدارات (`nvm`، `fnm`، `volta`، `asdf`، إلخ). تتطلب قنوات WhatsApp + Telegram استخدام Node، ويمكن أن تتعطل مسارات مدير الإصدارات بعد الترقيات لأن الخدمة لا تحمّل تهيئة الصدفة لديك. يعرض Doctor الترحيل إلى تثبيت Node على مستوى النظام عند توفره (Homebrew/apt/choco).

    تستخدم LaunchAgents المثبتة أو المصلحة حديثًا على macOS مسار PATH نظاميًا موحدًا (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) بدلًا من نسخ PATH للصدفة التفاعلية، بحيث تظل الثنائيات النظامية المُدارة عبر Homebrew متاحة بينما لا تغيّر أدلة Volta وasdf وfnm وpnpm وغيرها من أدلة مديري الإصدارات أي Node تحلّه العمليات الفرعية. لا تزال خدمات Linux تحتفظ بجذور بيئة صريحة (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) وأدلة user-bin مستقرة، لكن أدلة الرجوع الاحتياطي المتوقعة لمديري الإصدارات لا تُكتب إلى PATH الخاص بالخدمة إلا عندما تكون تلك الأدلة موجودة على القرص.

  </Accordion>
  <Accordion title="18. كتابة التكوين + بيانات معالج الإعداد التعريفية">
    يحفظ Doctor أي تغييرات في التكوين ويختم بيانات معالج الإعداد التعريفية لتسجيل تشغيل doctor.
  </Accordion>
  <Accordion title="19. نصائح مساحة العمل (النسخ الاحتياطي + نظام الذاكرة)">
    يقترح Doctor نظام ذاكرة لمساحة العمل عند غيابه ويطبع نصيحة نسخ احتياطي إذا لم تكن مساحة العمل تحت git بالفعل.

    راجع [/concepts/agent-workspace](/ar/concepts/agent-workspace) للحصول على دليل كامل لبنية مساحة العمل والنسخ الاحتياطي عبر git (يوصى بـ GitHub أو GitLab خاص).

  </Accordion>
</AccordionGroup>

## ذو صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
