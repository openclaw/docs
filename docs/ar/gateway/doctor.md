---
read_when:
    - إضافة ترحيلات doctor أو تعديلها
    - إدخال تغييرات كاسرة في الإعدادات
sidebarTitle: Doctor
summary: 'أمر Doctor: فحوصات الصحة، وترحيلات الإعدادات، وخطوات الإصلاح'
title: التشخيص
x-i18n:
    generated_at: "2026-05-05T01:46:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e374f91d00d4b43a3852de6f746b044471e80af936d464a789061a31cadd09d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` هو أداة الإصلاح + الترحيل لـ OpenClaw. تصلح الإعدادات/الحالة القديمة، وتتحقق من الصحة، وتوفر خطوات إصلاح قابلة للتنفيذ.

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

    قبول القيم الافتراضية دون مطالبة (بما في ذلك خطوات إصلاح إعادة التشغيل/الخدمة/بيئة العزل عند انطباقها).

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
    - تحديث اختياري قبل البدء لتثبيتات git (تفاعلي فقط).
    - فحص حداثة بروتوكول واجهة المستخدم (يعيد بناء واجهة Control UI عندما يكون مخطط البروتوكول أحدث).
    - فحص الصحة + مطالبة بإعادة التشغيل.
    - ملخص حالة Skills (المؤهلة/المفقودة/المحظورة) وحالة Plugin.

  </Accordion>
  <Accordion title="الإعدادات وعمليات الترحيل">
    - تطبيع الإعدادات للقيم القديمة.
    - ترحيل إعدادات Talk من حقول `talk.*` المسطحة القديمة إلى `talk.provider` + `talk.providers.<provider>`.
    - فحوصات ترحيل المتصفح لإعدادات إضافة Chrome القديمة وجاهزية Chrome MCP.
    - تحذيرات تجاوز مزود OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - تحذيرات حجب OAuth في Codex (`models.providers.openai-codex`).
    - فحص متطلبات OAuth TLS الأساسية لملفات OpenAI Codex OAuth الشخصية.
    - تحذيرات قائمة سماح Plugin/الأدوات عندما تكون `plugins.allow` تقييدية لكن سياسة الأدوات لا تزال تطلب أدوات بدل عام أو أدوات مملوكة لـ Plugin.
    - ترحيل الحالة القديمة على القرص (الجلسات/دليل الوكيل/مصادقة WhatsApp).
    - ترحيل مفاتيح عقد بيان Plugin القديمة (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - ترحيل مخزن cron القديم (`jobId`, `schedule.cron`, حقول delivery/payload في المستوى الأعلى، وpayload `provider`، ومهام Webhook الاحتياطية البسيطة `notify: true`).
    - ترحيل سياسة وقت تشغيل الوكيل القديمة إلى `agents.defaults.agentRuntime` و`agents.list[].agentRuntime`.
    - تنظيف إعدادات Plugin القديمة عندما تكون plugins مفعلة؛ عندما تكون `plugins.enabled=false`، تعامل مراجع Plugin القديمة كإعدادات احتواء خاملة وتظل محفوظة.

  </Accordion>
  <Accordion title="الحالة والسلامة">
    - فحص ملف قفل الجلسة وتنظيف الأقفال القديمة.
    - إصلاح نصوص الجلسات للفروع المكررة الخاصة بإعادة كتابة الموجهات التي أنشأتها إصدارات 2026.4.24 المتأثرة.
    - اكتشاف شواهد استرداد إعادة تشغيل الوكلاء الفرعيين العالقة، مع دعم `--fix` لمسح أعلام الاسترداد القديمة المجهضة حتى لا يستمر بدء التشغيل في التعامل مع العنصر الفرعي كأنه أجهض بسبب إعادة التشغيل.
    - فحوصات سلامة الحالة والأذونات (الجلسات، النصوص، دليل الحالة).
    - فحوصات أذونات ملف الإعدادات (chmod 600) عند التشغيل محليا.
    - صحة مصادقة النموذج: تتحقق من انتهاء OAuth، ويمكنها تحديث الرموز التي اقتربت من الانتهاء، وتبلغ عن حالات تهدئة/تعطيل ملف المصادقة الشخصي.
    - اكتشاف دليل مساحة عمل إضافي (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway، والخدمات، والمشرفون">
    - إصلاح صورة بيئة العزل عندما يكون العزل مفعلا.
    - ترحيل الخدمة القديمة واكتشاف Gateway إضافي.
    - ترحيل حالة قناة Matrix القديمة (في وضع `--fix` / `--repair`).
    - فحوصات وقت تشغيل Gateway (الخدمة مثبتة لكنها لا تعمل؛ تسمية launchd المخزنة مؤقتا).
    - تحذيرات حالة القناة (يتم جسها من Gateway الجاري).
    - تدقيق إعدادات المشرف (launchd/systemd/schtasks) مع إصلاح اختياري.
    - تنظيف بيئة الوكيل المضمنة لخدمات Gateway التي التقطت قيم shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` أثناء التثبيت أو التحديث.
    - فحوصات أفضل ممارسات وقت تشغيل Gateway (Node مقابل Bun، ومسارات مدير الإصدارات).
    - تشخيصات تعارض منفذ Gateway (الافتراضي `18789`).

  </Accordion>
  <Accordion title="المصادقة، والأمان، والإقران">
    - تحذيرات أمان لسياسات الرسائل المباشرة المفتوحة.
    - فحوصات مصادقة Gateway لوضع الرمز المحلي (تعرض إنشاء رمز عندما لا يوجد مصدر رمز؛ ولا تستبدل إعدادات token SecretRef).
    - اكتشاف مشكلات إقران الأجهزة (طلبات الإقران الأولى المعلقة، وترقيات الدور/النطاق المعلقة، وانحراف ذاكرة التخزين المؤقت المحلية القديمة لرمز الجهاز، وانحراف مصادقة سجل الإقران).

  </Accordion>
  <Accordion title="مساحة العمل وshell">
    - فحص systemd linger على Linux.
    - فحص حجم ملف تمهيد مساحة العمل (تحذيرات الاقتطاع/الاقتراب من الحد لملفات السياق).
    - فحص جاهزية Skills للوكيل الافتراضي؛ يبلغ عن المهارات المسموح بها التي تفتقد الملفات التنفيذية أو البيئة أو الإعدادات أو متطلبات نظام التشغيل، ويمكن لـ `--fix` تعطيل المهارات غير المتاحة في `skills.entries`.
    - فحص حالة إكمال shell والتثبيت/الترقية التلقائية.
    - فحص جاهزية مزود تضمينات بحث الذاكرة (نموذج محلي، أو مفتاح API بعيد، أو ملف QMD تنفيذي).
    - فحوصات تثبيت المصدر (عدم تطابق مساحة عمل pnpm، أو أصول واجهة مستخدم مفقودة، أو ملف tsx تنفيذي مفقود).
    - كتابة الإعدادات المحدثة + بيانات معالج الإعداد الوصفية.

  </Accordion>
</AccordionGroup>

## الملء الراجع وإعادة الضبط في واجهة Dreams

يتضمن مشهد Dreams في Control UI إجراءات **الملء الراجع**، و**إعادة الضبط**، و**مسح المؤرض** لسير عمل Dreaming المؤرض. تستخدم هذه الإجراءات أساليب RPC بنمط Gateway doctor، لكنها **ليست** جزءا من إصلاح/ترحيل CLI الخاص بـ `openclaw doctor`.

ما تفعله:

- **الملء الراجع** يفحص ملفات `memory/YYYY-MM-DD.md` التاريخية في مساحة العمل النشطة، ويشغل تمريرة يوميات REM المؤرضة، ويكتب إدخالات ملء راجع قابلة للعكس في `DREAMS.md`.
- **إعادة الضبط** تزيل إدخالات يوميات الملء الراجع الموسومة فقط من `DREAMS.md`.
- **مسح المؤرض** يزيل فقط الإدخالات المرحلية قصيرة المدى المؤرضة فقط التي جاءت من إعادة تشغيل تاريخية ولم تجمع بعد استدعاء حيا أو دعما يوميا.

ما **لا** تفعله بمفردها:

- لا تعدل `MEMORY.md`
- لا تشغل عمليات ترحيل doctor كاملة
- لا تدرج المرشحين المؤرضين تلقائيا في مخزن الترقية الحي قصير المدى إلا إذا شغلت مسار CLI المرحلي صراحة أولا

إذا أردت أن تؤثر إعادة التشغيل التاريخية المؤرضة في مسار الترقية العميقة العادي، فاستخدم تدفق CLI بدلا من ذلك:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

يؤدي ذلك إلى إدراج المرشحين المؤرضين الدائمين في مخزن Dreaming قصير المدى مع إبقاء `DREAMS.md` سطحا للمراجعة.

## السلوك التفصيلي والمبررات

<AccordionGroup>
  <Accordion title="0. تحديث اختياري (تثبيتات git)">
    إذا كانت هذه نسخة git وكان doctor يعمل تفاعليا، فإنه يعرض التحديث (fetch/rebase/build) قبل تشغيل doctor.
  </Accordion>
  <Accordion title="1. تطبيع الإعدادات">
    إذا كانت الإعدادات تحتوي على أشكال قيم قديمة (مثلا `messages.ackReaction` دون تجاوز خاص بالقناة)، فإن doctor يطبعها إلى المخطط الحالي.

    يشمل ذلك حقول Talk المسطحة القديمة. إعدادات Talk العامة الحالية هي `talk.provider` + `talk.providers.<provider>`. يعيد Doctor كتابة أشكال `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` القديمة في خريطة المزود.

    يحذر Doctor أيضا عندما تكون `plugins.allow` غير فارغة وتستخدم سياسة الأدوات
    إدخالات أدوات بدل عام أو مملوكة لـ Plugin. يطابق `tools.allow: ["*"]` الأدوات فقط
    من plugins التي يتم تحميلها فعلا؛ ولا يتجاوز قائمة سماح Plugin الحصرية.
    يكتب Doctor `plugins.bundledDiscovery: "compat"` لإعدادات قائمة السماح القديمة
    المرحلة للحفاظ على سلوك مزود الحزمة الحالي، ثم يشير إلى إعداد `"allowlist"` الأشد صرامة.

  </Accordion>
  <Accordion title="2. عمليات ترحيل مفاتيح الإعدادات القديمة">
    عندما تحتوي الإعدادات على مفاتيح مهملة، ترفض الأوامر الأخرى التشغيل وتطلب منك تشغيل `openclaw doctor`.

    سيقوم Doctor بما يلي:

    - شرح المفاتيح القديمة التي تم العثور عليها.
    - عرض الترحيل الذي طبقه.
    - إعادة كتابة `~/.openclaw/openclaw.json` بالمخطط المحدث.

    يشغل Gateway أيضا عمليات ترحيل doctor تلقائيا عند بدء التشغيل عندما يكتشف تنسيق إعدادات قديما، لذا يتم إصلاح الإعدادات القديمة دون تدخل يدوي. تتم معالجة عمليات ترحيل مخزن مهام Cron بواسطة `openclaw doctor --fix`.

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
    - بالنسبة إلى القنوات التي تحتوي على `accounts` مسماة مع بقاء قيم قناة على المستوى الأعلى لحساب واحد، انقل تلك القيم ذات نطاق الحساب إلى الحساب المرقّى المختار لتلك القناة (`accounts.default` لمعظم القنوات؛ يمكن أن يحتفظ Matrix بهدف مسمى/افتراضي مطابق موجود)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - أزِل `agents.defaults.llm`؛ استخدم `models.providers.<id>.timeoutSeconds` لمهل مزود/نموذج بطيئة
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - أزِل `browser.relayBindHost` (إعداد ترحيل قديم للإضافة)
    - `models.providers.*.api: "openai"` القديم → `"openai-completions"` (يتخطى بدء تشغيل Gateway أيضًا المزودين الذين ضُبطت قيمة `api` لديهم على قيمة enum مستقبلية أو غير معروفة بدل الفشل بالإغلاق)

    تشمل تحذيرات doctor أيضًا إرشادات الحساب الافتراضي للقنوات متعددة الحسابات:

    - إذا كُوّن إدخالان أو أكثر من `channels.<channel>.accounts` دون `channels.<channel>.defaultAccount` أو `accounts.default`، يحذر doctor من أن توجيه الرجوع قد يختار حسابًا غير متوقع.
    - إذا ضُبط `channels.<channel>.defaultAccount` على معرّف حساب غير معروف، يحذر doctor ويعرض معرّفات الحسابات المكوّنة.

  </Accordion>
  <Accordion title="2b. تجاوزات مزود OpenCode">
    إذا أضفت `models.providers.opencode` أو `opencode-zen` أو `opencode-go` يدويًا، فسيؤدي ذلك إلى تجاوز كتالوج OpenCode المضمّن من `@mariozechner/pi-ai`. قد يفرض ذلك النماذج على API غير صحيح أو يصفّر التكاليف. يحذر doctor حتى تتمكن من إزالة التجاوز واستعادة توجيه API والتكاليف لكل نموذج.
  </Accordion>
  <Accordion title="2c. ترحيل المتصفح وجاهزية Chrome MCP">
    إذا كان إعداد المتصفح لديك لا يزال يشير إلى مسار إضافة Chrome المحذوف، فسيطبّعه doctor إلى نموذج إرفاق Chrome MCP المحلي للمضيف الحالي:

    - يصبح `browser.profiles.*.driver: "extension"` القيمة `"existing-session"`
    - تُزال `browser.relayBindHost`

    يدقق doctor أيضًا مسار Chrome MCP المحلي للمضيف عندما تستخدم `defaultProfile: "user"` أو ملف تعريف `existing-session` مكوّنًا:

    - يتحقق مما إذا كان Google Chrome مثبتًا على المضيف نفسه لملفات التعريف الافتراضية ذات الاتصال التلقائي
    - يتحقق من إصدار Chrome المكتشف ويحذر عندما يكون أقل من Chrome 144
    - يذكّرك بتمكين التصحيح البعيد في صفحة فحص المتصفح (على سبيل المثال `chrome://inspect/#remote-debugging` أو `brave://inspect/#remote-debugging` أو `edge://inspect/#remote-debugging`)

    لا يستطيع doctor تمكين الإعداد من جهة Chrome نيابةً عنك. لا يزال Chrome MCP المحلي للمضيف يتطلب:

    - متصفحًا مبنيًا على Chromium بإصدار 144+ على مضيف gateway/node
    - تشغيل المتصفح محليًا
    - تمكين التصحيح البعيد في ذلك المتصفح
    - الموافقة على مطالبة موافقة الإرفاق الأولى في المتصفح

    الجاهزية هنا تخص متطلبات الإرفاق المحلي فقط. يحافظ Existing-session على حدود مسارات Chrome MCP الحالية؛ ولا تزال المسارات المتقدمة مثل `responsebody` وتصدير PDF واعتراض التنزيل وإجراءات الدُفعات تتطلب متصفحًا مُدارًا أو ملف تعريف CDP خامًا.

    لا ينطبق هذا الفحص على Docker أو sandbox أو remote-browser أو غيرها من التدفقات عديمة الواجهة. تستمر تلك في استخدام CDP الخام.

  </Accordion>
  <Accordion title="2d. متطلبات OAuth TLS الأساسية">
    عند تكوين ملف تعريف OpenAI Codex OAuth، يفحص doctor نقطة نهاية تفويض OpenAI للتحقق من أن مكدس TLS المحلي لـ Node/OpenSSL يستطيع التحقق من سلسلة الشهادات. إذا فشل الفحص بسبب خطأ شهادة (مثل `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` أو شهادة منتهية الصلاحية أو شهادة موقّعة ذاتيًا)، يطبع doctor إرشادات إصلاح خاصة بالمنصة. على macOS مع Node من Homebrew، يكون الإصلاح عادةً `brew postinstall ca-certificates`. مع `--deep`، يعمل الفحص حتى إذا كان Gateway سليمًا.
  </Accordion>
  <Accordion title="2e. تجاوزات مزود Codex OAuth">
    إذا سبق أن أضفت إعدادات نقل OpenAI القديمة ضمن `models.providers.openai-codex`، فقد تحجب مسار مزود Codex OAuth المضمّن الذي تستخدمه الإصدارات الأحدث تلقائيًا. يحذر doctor عندما يرى إعدادات النقل القديمة هذه إلى جانب Codex OAuth حتى تتمكن من إزالة تجاوز النقل القديم أو إعادة كتابته واستعادة سلوك التوجيه/الرجوع المضمّن. لا تزال الوكلاء المخصصة وتجاوزات الرؤوس فقط مدعومة ولا تطلق هذا التحذير.
  </Accordion>
  <Accordion title="2f. تحذيرات مسار Plugin Codex">
    عند تمكين Plugin Codex المضمّن، يتحقق doctor أيضًا مما إذا كانت مراجع النموذج الأساسي `openai-codex/*` لا تزال تُحل عبر مشغل PI الافتراضي. هذا الجمع صالح عندما تريد مصادقة Codex OAuth/الاشتراك عبر PI، لكن من السهل الخلط بينه وبين حزمة app-server الأصلية لـ Codex. يحذر doctor ويشير إلى الشكل الصريح لـ app-server: `openai/*` بالإضافة إلى `agentRuntime.id: "codex"` أو `OPENCLAW_AGENT_RUNTIME=codex`.

    لا يصلح doctor هذا تلقائيًا لأن كلا المسارين صالحان:

    - `openai-codex/*` + PI يعني "استخدم مصادقة Codex OAuth/الاشتراك عبر مشغل OpenClaw العادي."
    - `openai/*` + `agentRuntime.id: "codex"` يعني "شغّل الدور المضمّن عبر app-server الأصلي لـ Codex."
    - `/codex ...` يعني "تحكم في محادثة Codex أصلية من الدردشة أو اربطها."
    - `/acp ...` أو `runtime: "acp"` يعني "استخدم محول ACP/acpx الخارجي."

    إذا ظهر التحذير، فاختر المسار الذي قصدته وعدّل الإعداد يدويًا. أبقِ التحذير كما هو عندما يكون PI Codex OAuth مقصودًا.

  </Accordion>
  <Accordion title="2g. تنظيف مسار الجلسة">
    يفحص doctor أيضًا مخزن الجلسات النشطة بحثًا عن حالة مسار قديمة مُنشأة تلقائيًا بعد أن تنقل نموذج أو runtime الافتراضي/الاحتياطي المكوّن بعيدًا عن مسار مملوك لـ Plugin مثل Codex.

    يستطيع `openclaw doctor --fix` مسح الحالة القديمة المنشأة تلقائيًا مثل تثبيتات النماذج `modelOverrideSource: "auto"` وبيانات تعريف نموذج runtime ومعرّفات الحزمة المثبتة وروابط جلسات CLI وتجاوزات ملفات تعريف المصادقة التلقائية عندما لا يعود المسار المالك لها مكوّنًا. تُبلّغ اختيارات نماذج الجلسة الصريحة للمستخدم أو القديمة للمراجعة اليدوية وتُترك دون تغيير؛ بدّلها باستخدام `/model ...` أو `/new` أو أعد ضبط الجلسة عندما لا يعود ذلك المسار مقصودًا.

  </Accordion>
  <Accordion title="3. ترحيلات الحالة القديمة (تخطيط القرص)">
    يستطيع doctor ترحيل التخطيطات الأقدم على القرص إلى البنية الحالية:

    - مخزن الجلسات + النصوص:
      - من `~/.openclaw/sessions/` إلى `~/.openclaw/agents/<agentId>/sessions/`
    - دليل الوكيل:
      - من `~/.openclaw/agent/` إلى `~/.openclaw/agents/<agentId>/agent/`
    - حالة مصادقة WhatsApp (Baileys):
      - من `~/.openclaw/credentials/*.json` القديمة (باستثناء `oauth.json`)
      - إلى `~/.openclaw/credentials/whatsapp/<accountId>/...` (معرّف الحساب الافتراضي: `default`)

    هذه الترحيلات تبذل أفضل جهد وهي قابلة للتكرار بأمان؛ سيصدر doctor تحذيرات عندما يترك أي مجلدات قديمة خلفه كنسخ احتياطية. يقوم Gateway/CLI أيضًا بترحيل الجلسات القديمة ودليل الوكيل تلقائيًا عند بدء التشغيل بحيث ينتقل التاريخ/المصادقة/النماذج إلى مسار كل وكيل دون تشغيل doctor يدويًا. لا تُرحّل مصادقة WhatsApp عمدًا إلا عبر `openclaw doctor`. تطبيع مزود الكلام/خريطة المزود يقارن الآن حسب المساواة البنيوية، لذلك لم تعد فروق ترتيب المفاتيح فقط تطلق تغييرات `doctor --fix` متكررة بلا أثر.

  </Accordion>
  <Accordion title="3a. ترحيلات بيانات Plugin القديمة">
    يفحص doctor جميع بيانات Plugins المثبتة بحثًا عن مفاتيح إمكانات قديمة على المستوى الأعلى (`speechProviders` و`realtimeTranscriptionProviders` و`realtimeVoiceProviders` و`mediaUnderstandingProviders` و`imageGenerationProviders` و`videoGenerationProviders` و`webFetchProviders` و`webSearchProviders`). عند العثور عليها، يعرض نقلها إلى كائن `contracts` وإعادة كتابة ملف البيان في مكانه. هذا الترحيل قابل للتكرار بأمان؛ إذا كان مفتاح `contracts` يحتوي بالفعل على القيم نفسها، فسيُزال المفتاح القديم دون تكرار البيانات.
  </Accordion>
  <Accordion title="3b. ترحيلات مخزن Cron القديم">
    يتحقق doctor أيضًا من مخزن مهام Cron (`~/.openclaw/cron/jobs.json` افتراضيًا، أو `cron.store` عند تجاوزه) بحثًا عن أشكال مهام قديمة لا يزال المجدول يقبلها للتوافق.

    تشمل عمليات تنظيف Cron الحالية:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - حقول الحمولة على المستوى الأعلى (`message` و`model` و`thinking` و...) → `payload`
    - حقول التسليم على المستوى الأعلى (`deliver` و`channel` و`to` و`provider` و...) → `delivery`
    - أسماء التسليم المستعارة `provider` للحمولة → `delivery.channel` صريح
    - مهام رجوع Webhook القديمة البسيطة `notify: true` → `delivery.mode="webhook"` صريح مع `delivery.to=cron.webhook`

    لا يرحّل doctor تلقائيًا مهام `notify: true` إلا عندما يستطيع فعل ذلك دون تغيير السلوك. إذا جمعت مهمة بين رجوع إشعار قديم ووضع تسليم غير Webhook موجود، يحذر doctor ويترك تلك المهمة للمراجعة اليدوية.

    على Linux، يحذّر doctor أيضًا عندما لا يزال crontab الخاص بالمستخدم يستدعي السكربت القديم `~/.openclaw/bin/ensure-whatsapp.sh`. هذا السكربت المحلي للمضيف لا تتم صيانته بواسطة OpenClaw الحالي ويمكنه كتابة رسائل `Gateway inactive` خاطئة إلى `~/.openclaw/logs/whatsapp-health.log` عندما يتعذر على cron الوصول إلى ناقل مستخدم systemd. أزل إدخال crontab القديم باستخدام `crontab -e`؛ واستخدم `openclaw channels status --probe` و`openclaw doctor` و`openclaw gateway status` لفحوصات السلامة الحالية.

  </Accordion>
  <Accordion title="3c. تنظيف قفل الجلسة">
    يفحص Doctor كل دليل جلسة وكيل بحثًا عن ملفات قفل كتابة قديمة — وهي ملفات تُترك عندما تنتهي الجلسة بشكل غير طبيعي. لكل ملف قفل يعثر عليه، يبلّغ عن: المسار، وPID، وما إذا كان PID لا يزال حيًا، وعمر القفل، وما إذا كان يُعد قديمًا (PID ميت أو أقدم من 30 دقيقة). في وضع `--fix` / `--repair` يزيل ملفات القفل القديمة تلقائيًا؛ وإلا فإنه يطبع ملاحظة ويوجهك إلى إعادة التشغيل باستخدام `--fix`.
  </Accordion>
  <Accordion title="3d. إصلاح فرع سجل الجلسة">
    يفحص Doctor ملفات JSONL لجلسات الوكيل بحثًا عن شكل الفرع المكرر الذي أنشأه خطأ إعادة كتابة سجل الموجّه في 2026.4.24: دور مستخدم مهجور يحتوي على سياق وقت تشغيل داخلي لـ OpenClaw مع شقيق نشط يحتوي على نفس موجّه المستخدم المرئي. في وضع `--fix` / `--repair`، ينسخ doctor احتياطيًا كل ملف متأثر بجانب الأصل ويعيد كتابة السجل إلى الفرع النشط بحيث لا يرى قراء سجل Gateway والذاكرة أدوارًا مكررة بعد الآن.
  </Accordion>
  <Accordion title="4. فحوصات سلامة الحالة (استمرار الجلسة، والتوجيه، والسلامة)">
    دليل الحالة هو جذع الدماغ التشغيلي. إذا اختفى، فستفقد الجلسات وبيانات الاعتماد والسجلات والإعدادات (ما لم تكن لديك نسخ احتياطية في مكان آخر).

    يتحقق Doctor من:

    - **دليل الحالة مفقود**: يحذّر من فقدان كارثي للحالة، ويطلب إعادة إنشاء الدليل، ويذكّرك بأنه لا يمكنه استرداد البيانات المفقودة.
    - **أذونات دليل الحالة**: يتحقق من قابلية الكتابة؛ ويعرض إصلاح الأذونات (ويصدر تلميح `chown` عند اكتشاف عدم تطابق المالك/المجموعة).
    - **دليل حالة متزامن مع السحابة على macOS**: يحذّر عندما تُحل الحالة ضمن iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) أو `~/Library/CloudStorage/...` لأن المسارات المدعومة بالمزامنة قد تسبب إدخال/إخراج أبطأ وتسابقات قفل/مزامنة.
    - **دليل حالة Linux على SD أو eMMC**: يحذّر عندما تُحل الحالة إلى مصدر تركيب `mmcblk*`، لأن الإدخال/الإخراج العشوائي المدعوم بـ SD أو eMMC يمكن أن يكون أبطأ ويتآكل أسرع تحت عمليات كتابة الجلسات وبيانات الاعتماد.
    - **أدلة الجلسات مفقودة**: `sessions/` ودليل مخزن الجلسات مطلوبان لاستمرار السجل وتجنب أعطال `ENOENT`.
    - **عدم تطابق السجل**: يحذّر عندما تكون إدخالات الجلسات الحديثة تفتقد ملفات السجل.
    - **الجلسة الرئيسية "JSONL بسطر واحد"**: يضع علامة عندما يحتوي السجل الرئيسي على سطر واحد فقط (السجل لا يتراكم).
    - **أدلة حالة متعددة**: يحذّر عندما توجد عدة مجلدات `~/.openclaw` عبر أدلة المنزل أو عندما يشير `OPENCLAW_STATE_DIR` إلى مكان آخر (يمكن أن ينقسم السجل بين التثبيتات).
    - **تذكير الوضع البعيد**: إذا كان `gateway.mode=remote`، يذكّرك doctor بتشغيله على المضيف البعيد (الحالة موجودة هناك).
    - **أذونات ملف الإعدادات**: يحذّر إذا كان `~/.openclaw/openclaw.json` قابلًا للقراءة من المجموعة/العالم ويعرض تشديده إلى `600`.

  </Accordion>
  <Accordion title="5. سلامة مصادقة النموذج (انتهاء OAuth)">
    يفحص Doctor ملفات تعريف OAuth في مخزن المصادقة، ويحذّر عندما تكون الرموز على وشك الانتهاء/منتهية، ويمكنه تحديثها عندما يكون ذلك آمنًا. إذا كان ملف تعريف OAuth/الرمز الخاص بـ Anthropic قديمًا، فإنه يقترح مفتاح Anthropic API أو مسار رمز إعداد Anthropic. تظهر مطالبات التحديث فقط عند التشغيل تفاعليًا (TTY)؛ يتخطى `--non-interactive` محاولات التحديث.

    عندما يفشل تحديث OAuth بشكل دائم (مثل `refresh_token_reused` أو `invalid_grant` أو عندما يخبرك موفر بتسجيل الدخول مرة أخرى)، يبلّغ doctor بأن إعادة المصادقة مطلوبة ويطبع أمر `openclaw models auth login --provider ...` الدقيق لتشغيله.

    يبلّغ Doctor أيضًا عن ملفات تعريف المصادقة غير القابلة للاستخدام مؤقتًا بسبب:

    - فترات تهدئة قصيرة (حدود المعدل/المهل/إخفاقات المصادقة)
    - تعطيلات أطول (إخفاقات الفوترة/الرصيد)

  </Accordion>
  <Accordion title="6. التحقق من صحة نموذج الخطافات">
    إذا تم تعيين `hooks.gmail.model`، يتحقق doctor من مرجع النموذج مقابل الفهرس وقائمة السماح ويحذّر عندما لا يمكن حله أو يكون غير مسموح به.
  </Accordion>
  <Accordion title="7. إصلاح صورة العزل">
    عندما يكون العزل ممكّنًا، يتحقق doctor من صور Docker ويعرض البناء أو التبديل إلى الأسماء القديمة إذا كانت الصورة الحالية مفقودة.
  </Accordion>
  <Accordion title="7b. تنظيف تثبيت Plugin">
    يزيل Doctor حالة تجهيز تبعيات Plugin القديمة التي أنشأها OpenClaw في وضع `openclaw doctor --fix` / `openclaw doctor --repair`. يشمل ذلك جذور التبعيات القديمة المُولّدة، وأدلة مراحل التثبيت القديمة، والمخلفات المحلية للحزم من كود إصلاح تبعيات Plugin المجمعة الأقدم، ونسخ npm المُدارة اليتيمة أو المستردة من Plugins المجمعة `@openclaw/*` التي يمكن أن تحجب البيان المجمع الحالي.

    يمكن لـ Doctor أيضًا إعادة تثبيت Plugins القابلة للتنزيل المفقودة عندما تشير الإعدادات إليها ولكن سجل Plugin المحلي لا يمكنه العثور عليها. تشمل الأمثلة `plugins.entries` المادية، وإعدادات القناة/الموفر/البحث المكوّنة، وأوقات تشغيل الوكيل المكوّنة. أثناء تحديثات الحزم، يتجنب doctor تشغيل إصلاح Plugin عبر مدير الحزم أثناء تبديل الحزمة الأساسية؛ شغّل `openclaw doctor --fix` مرة أخرى بعد التحديث إذا كان Plugin مكوّن لا يزال يحتاج إلى استرداد. لا يشغّل بدء Gateway وإعادة تحميل الإعدادات مديري الحزم؛ تبقى تثبيتات Plugin عملًا صريحًا ضمن doctor/install/update.

  </Accordion>
  <Accordion title="8. ترحيلات خدمة Gateway وتلميحات التنظيف">
    يكتشف Doctor خدمات Gateway القديمة (launchd/systemd/schtasks) ويعرض إزالتها وتثبيت خدمة OpenClaw باستخدام منفذ Gateway الحالي. يمكنه أيضًا الفحص بحثًا عن خدمات إضافية شبيهة بـ Gateway وطباعة تلميحات التنظيف. تُعد خدمات OpenClaw Gateway المسماة بحسب ملف التعريف من الدرجة الأولى ولا توضع عليها علامة "إضافية".

    على Linux، إذا كانت خدمة Gateway على مستوى المستخدم مفقودة لكن توجد خدمة OpenClaw Gateway على مستوى النظام، لا يثبّت doctor خدمة ثانية على مستوى المستخدم تلقائيًا. افحص باستخدام `openclaw gateway status --deep` أو `openclaw doctor --deep`، ثم أزل التكرار أو عيّن `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يكون مشرف نظام يملك دورة حياة Gateway.

  </Accordion>
  <Accordion title="8b. ترحيل Startup Matrix">
    عندما يكون لحساب قناة Matrix ترحيل حالة قديم معلق أو قابل للتنفيذ، ينشئ doctor (في وضع `--fix` / `--repair`) لقطة قبل الترحيل ثم يشغّل خطوات الترحيل بأفضل جهد: ترحيل حالة Matrix القديمة وتحضير الحالة المشفرة القديمة. كلتا الخطوتين غير قاتلتين؛ تُسجّل الأخطاء ويستمر بدء التشغيل. في وضع القراءة فقط (`openclaw doctor` بدون `--fix`) يتم تخطي هذا الفحص بالكامل.
  </Accordion>
  <Accordion title="8c. إقران الأجهزة وانحراف المصادقة">
    يفحص Doctor الآن حالة إقران الأجهزة كجزء من مرور السلامة العادي.

    ما يبلّغ عنه:

    - طلبات إقران أولية معلقة
    - ترقيات أدوار معلقة للأجهزة المقترنة بالفعل
    - ترقيات نطاقات معلقة للأجهزة المقترنة بالفعل
    - إصلاحات عدم تطابق المفتاح العام حيث لا يزال معرّف الجهاز مطابقًا لكن هوية الجهاز لم تعد تطابق السجل المعتمد
    - سجلات مقترنة تفتقد رمزًا نشطًا لدور معتمد
    - رموز مقترنة انحرفت نطاقاتها خارج خط أساس الإقران المعتمد
    - إدخالات رمز جهاز مخزنة محليًا للجهاز الحالي تسبق تدوير رمز على جانب Gateway أو تحمل بيانات وصفية قديمة للنطاق

    لا يوافق Doctor تلقائيًا على طلبات الإقران ولا يدوّر رموز الأجهزة تلقائيًا. بل يطبع الخطوات التالية الدقيقة:

    - افحص الطلبات المعلقة باستخدام `openclaw devices list`
    - وافق على الطلب الدقيق باستخدام `openclaw devices approve <requestId>`
    - دوّر رمزًا جديدًا باستخدام `openclaw devices rotate --device <deviceId> --role <role>`
    - أزل سجلًا قديمًا وأعد الموافقة عليه باستخدام `openclaw devices remove <deviceId>`

    هذا يسد الفجوة الشائعة "مقترن بالفعل لكن لا يزال يظهر طلب الإقران": يميّز doctor الآن الإقران الأولي عن ترقيات الدور/النطاق المعلقة وعن انحراف الرمز/هوية الجهاز القديمة.

  </Accordion>
  <Accordion title="9. تحذيرات الأمان">
    يصدر Doctor تحذيرات عندما يكون موفر مفتوحًا للرسائل المباشرة بدون قائمة سماح، أو عندما تُكوّن سياسة بطريقة خطرة.
  </Accordion>
  <Accordion title="10. استبقاء systemd (Linux)">
    إذا كان يعمل كخدمة مستخدم systemd، يضمن doctor تمكين الاستبقاء بحيث يبقى Gateway حيًا بعد تسجيل الخروج.
  </Accordion>
  <Accordion title="11. حالة مساحة العمل (Skills، وPlugins، والأدلة القديمة)">
    يطبع Doctor ملخصًا لحالة مساحة العمل للوكيل الافتراضي:

    - **حالة Skills**: يحسب Skills المؤهلة، والمفقودة المتطلبات، والمحظورة بقائمة السماح.
    - **أدلة مساحة العمل القديمة**: يحذّر عندما توجد `~/openclaw` أو أدلة مساحة عمل قديمة أخرى بجانب مساحة العمل الحالية.
    - **حالة Plugin**: يحسب Plugins الممكّنة/المعطلة/التي بها أخطاء؛ ويسرد معرّفات Plugin لأي أخطاء؛ ويبلّغ عن إمكانات Plugin المجمعة.
    - **تحذيرات توافق Plugin**: يضع علامات على Plugins التي لديها مشكلات توافق مع وقت التشغيل الحالي.
    - **تشخيصات Plugin**: يعرض أي تحذيرات أو أخطاء وقت التحميل الصادرة عن سجل Plugin.

  </Accordion>
  <Accordion title="11b. حجم ملف التمهيد">
    يتحقق Doctor مما إذا كانت ملفات تمهيد مساحة العمل (مثل `AGENTS.md` أو `CLAUDE.md` أو ملفات سياق مُحقنة أخرى) قريبة من ميزانية الأحرف المكوّنة أو تتجاوزها. يبلّغ لكل ملف عن عدد الأحرف الخام مقابل المُحقنة، ونسبة الاقتطاع، وسبب الاقتطاع (`max/file` أو `max/total`)، وإجمالي الأحرف المُحقنة كنسبة من الميزانية الإجمالية. عندما تُقتطع الملفات أو تقترب من الحد، يطبع doctor نصائح لضبط `agents.defaults.bootstrapMaxChars` و`agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. تنظيف Plugin قناة قديم">
    عندما يزيل `openclaw doctor --fix` Plugin قناة مفقودًا، فإنه يزيل أيضًا الإعدادات المعلّقة ذات نطاق القناة التي كانت تشير إلى ذلك Plugin: إدخالات `channels.<id>`، وأهداف Heartbeat التي سمّت القناة، وتجاوزات `agents.*.models["<channel>/*"]`. يمنع هذا حلقات إقلاع Gateway حيث يختفي وقت تشغيل القناة لكن الإعدادات لا تزال تطلب من Gateway الارتباط به.
  </Accordion>
  <Accordion title="11c. إكمال الصدفة">
    يتحقق Doctor مما إذا كان إكمال التبويب مثبتًا للصدفة الحالية (zsh أو bash أو fish أو PowerShell):

    - إذا كان ملف تعريف الصدفة يستخدم نمط إكمال ديناميكيًا بطيئًا (`source <(openclaw completion ...)`)، يرقيه doctor إلى متغير الملف المخزن مؤقتًا الأسرع.
    - إذا كان الإكمال مكوّنًا في ملف التعريف لكن ملف التخزين المؤقت مفقود، يعيد doctor توليد التخزين المؤقت تلقائيًا.
    - إذا لم يكن أي إكمال مكوّنًا على الإطلاق، يطالب doctor بتثبيته (الوضع التفاعلي فقط؛ يتم تخطيه مع `--non-interactive`).

    شغّل `openclaw completion --write-state` لإعادة توليد التخزين المؤقت يدويًا.

  </Accordion>
  <Accordion title="12. فحوصات مصادقة Gateway (الرمز المحلي)">
    يتحقق Doctor من جاهزية مصادقة رمز Gateway المحلي.

    - إذا كان وضع الرمز يحتاج إلى رمز ولا يوجد مصدر رمز، يعرض doctor إنشاء واحد.
    - إذا كان `gateway.auth.token` مُدارًا بواسطة SecretRef لكنه غير متاح، يحذّر doctor ولا يستبدله بنص صريح.
    - يفرض `openclaw doctor --generate-gateway-token` التوليد فقط عندما لا يكون أي SecretRef للرمز مكوّنًا.

  </Accordion>
  <Accordion title="12b. إصلاحات للقراءة فقط واعية بـ SecretRef">
    تحتاج بعض تدفقات الإصلاح إلى فحص بيانات الاعتماد المكوّنة بدون إضعاف سلوك الفشل السريع في وقت التشغيل.

    - يستخدم `openclaw doctor --fix` الآن نموذج ملخص SecretRef للقراءة فقط نفسه الذي تستخدمه أوامر عائلة الحالة لإصلاحات الإعدادات المستهدفة.
    - مثال: يحاول إصلاح Telegram `allowFrom` / `groupAllowFrom` `@username` استخدام بيانات اعتماد البوت المضبوطة عند توفرها.
    - إذا كان رمز بوت Telegram مضبوطا عبر SecretRef لكنه غير متاح في مسار الأمر الحالي، يبلغ doctor أن بيانات الاعتماد مضبوطة لكنها غير متاحة ويتخطى الحل التلقائي بدلا من التعطل أو الإبلاغ خطأ بأن الرمز مفقود.

  </Accordion>
  <Accordion title="13. فحص صحة Gateway + إعادة التشغيل">
    يجري Doctor فحص صحة ويعرض إعادة تشغيل Gateway عندما يبدو غير سليم.
  </Accordion>
  <Accordion title="13b. جاهزية بحث الذاكرة">
    يتحقق Doctor مما إذا كان موفر تضمين بحث الذاكرة المضبوط جاهزا للوكيل الافتراضي. يعتمد السلوك على الخلفية والموفر المضبوطين:

    - **خلفية QMD**: تفحص ما إذا كان ملف `qmd` الثنائي متاحا وقابلا للتشغيل. إن لم يكن كذلك، تطبع إرشادات إصلاح تتضمن حزمة npm وخيار مسار ثنائي يدوي.
    - **موفر محلي صريح**: يتحقق من وجود ملف نموذج محلي أو عنوان URL لنموذج بعيد/قابل للتنزيل معروف. إذا كان مفقودا، يقترح التبديل إلى موفر بعيد.
    - **موفر بعيد صريح** (`openai`، `voyage`، وما إلى ذلك): يتحقق من وجود مفتاح API في البيئة أو مخزن المصادقة. يطبع تلميحات إصلاح قابلة للتنفيذ إذا كان مفقودا.
    - **موفر تلقائي**: يتحقق من توفر النموذج المحلي أولا، ثم يجرب كل موفر بعيد حسب ترتيب الاختيار التلقائي.

    عند توفر نتيجة فحص Gateway مخزنة مؤقتا (كان Gateway سليما وقت الفحص)، يقارن doctor نتيجتها مع الإعدادات المرئية من CLI ويشير إلى أي اختلاف. لا يبدأ Doctor اختبار تضمين جديدا في المسار الافتراضي؛ استخدم أمر حالة الذاكرة العميق عندما تريد فحص موفر مباشر.

    استخدم `openclaw memory status --deep` للتحقق من جاهزية التضمين في وقت التشغيل.

  </Accordion>
  <Accordion title="14. تحذيرات حالة القناة">
    إذا كان Gateway سليما، يجري doctor فحص حالة القناة ويبلغ عن التحذيرات مع إصلاحات مقترحة.
  </Accordion>
  <Accordion title="15. تدقيق إعدادات المشرف + الإصلاح">
    يتحقق Doctor من إعدادات المشرف المثبتة (launchd/systemd/schtasks) بحثا عن الافتراضيات المفقودة أو القديمة (مثل تبعيات systemd network-online وتأخير إعادة التشغيل). عندما يجد عدم تطابق، يوصي بتحديث ويمكنه إعادة كتابة ملف الخدمة/المهمة إلى الافتراضيات الحالية.

    ملاحظات:

    - يطلب `openclaw doctor` التأكيد قبل إعادة كتابة إعدادات المشرف.
    - يقبل `openclaw doctor --yes` مطالبات الإصلاح الافتراضية.
    - يطبق `openclaw doctor --repair` الإصلاحات الموصى بها دون مطالبات.
    - يستبدل `openclaw doctor --repair --force` إعدادات المشرف المخصصة.
    - يحافظ `OPENCLAW_SERVICE_REPAIR_POLICY=external` على doctor للقراءة فقط لدورة حياة خدمة Gateway. يظل يبلغ عن صحة الخدمة ويشغل إصلاحات غير خدمية، لكنه يتخطى تثبيت/بدء/إعادة تشغيل/تمهيد الخدمة، وإعادة كتابة إعدادات المشرف، وتنظيف الخدمات القديمة لأن مشرفا خارجيا يملك دورة الحياة هذه.
    - على Linux، لا يعيد doctor كتابة بيانات تعريف الأمر/نقطة الدخول أثناء نشاط وحدة systemd المطابقة لـ Gateway. كما يتجاهل الوحدات الإضافية غير القديمة وغير النشطة الشبيهة بـ Gateway أثناء فحص الخدمات المكررة حتى لا تنشئ ملفات الخدمة المصاحبة ضوضاء تنظيف.
    - إذا كانت مصادقة الرمز تتطلب رمزا وكان `gateway.auth.token` مدارًا بواسطة SecretRef، فإن تثبيت/إصلاح خدمة doctor يتحقق من SecretRef لكنه لا يحفظ قيم الرمز النصية الصريحة المحلولة في بيانات تعريف بيئة خدمة المشرف.
    - يكتشف Doctor قيم بيئة الخدمة المدارة المدعومة بـ `.env`/SecretRef التي ضمنت عمليات تثبيت LaunchAgent أو systemd أو Windows Scheduled Task الأقدم داخلها، ويعيد كتابة بيانات تعريف الخدمة بحيث تحمل تلك القيم من مصدر وقت التشغيل بدلا من تعريف المشرف.
    - يكتشف Doctor عندما لا يزال أمر الخدمة يثبت `--port` قديما بعد تغييرات `gateway.port` ويعيد كتابة بيانات تعريف الخدمة إلى المنفذ الحالي.
    - إذا كانت مصادقة الرمز تتطلب رمزا وكان SecretRef للرمز المضبوط غير محلول، يمنع doctor مسار التثبيت/الإصلاح مع إرشادات قابلة للتنفيذ.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مضبوطين وكان `gateway.auth.mode` غير معين، يمنع doctor التثبيت/الإصلاح حتى يتم تعيين الوضع صراحة.
    - بالنسبة لوحدات user-systemd على Linux، تتضمن فحوصات انحراف رمز doctor الآن كلا مصدري `Environment=` و`EnvironmentFile=` عند مقارنة بيانات تعريف مصادقة الخدمة.
    - ترفض إصلاحات خدمة Doctor إعادة كتابة أو إيقاف أو إعادة تشغيل خدمة Gateway من ملف OpenClaw ثنائي أقدم عندما تكون الإعدادات قد كتبت آخر مرة بواسطة إصدار أحدث. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - يمكنك دائما فرض إعادة كتابة كاملة عبر `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. تشخيصات وقت تشغيل Gateway + المنفذ">
    يفحص Doctor وقت تشغيل الخدمة (PID، وآخر حالة خروج) ويحذر عندما تكون الخدمة مثبتة لكنها لا تعمل فعليا. كما يتحقق من تعارضات المنافذ على منفذ Gateway (الافتراضي `18789`) ويبلغ عن الأسباب المحتملة (Gateway يعمل بالفعل، نفق SSH).
  </Accordion>
  <Accordion title="17. أفضل ممارسات وقت تشغيل Gateway">
    يحذر Doctor عندما تعمل خدمة Gateway على Bun أو مسار Node مدار بإصدار (`nvm`، `fnm`، `volta`، `asdf`، وما إلى ذلك). تتطلب قنوات WhatsApp + Telegram ‏Node، ويمكن أن تتعطل مسارات مديري الإصدارات بعد الترقيات لأن الخدمة لا تحمل تهيئة الصدفة لديك. يعرض Doctor الترحيل إلى تثبيت Node للنظام عند توفره (Homebrew/apt/choco).

    تستخدم LaunchAgents المثبتة أو المصلحة حديثا على macOS مسار PATH نظاميا قياسيا (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) بدلا من نسخ PATH للصدفة التفاعلية، بحيث لا تغير أدلة Volta وasdf وfnm وpnpm وغيرها من أدلة مديري الإصدارات أي عمليات Node فرعية يتم حلها. لا تزال خدمات Linux تحتفظ بجذور بيئة صريحة (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) وأدلة user-bin مستقرة، لكن أدلة الرجوع الاحتياطية المخمنة لمديري الإصدارات لا تكتب إلى PATH الخاص بالخدمة إلا عندما تكون تلك الأدلة موجودة على القرص.

  </Accordion>
  <Accordion title="18. كتابة الإعدادات + بيانات تعريف المعالج">
    يحفظ Doctor أي تغييرات في الإعدادات ويختم بيانات تعريف المعالج لتسجيل تشغيل doctor.
  </Accordion>
  <Accordion title="19. نصائح مساحة العمل (النسخ الاحتياطي + نظام الذاكرة)">
    يقترح Doctor نظام ذاكرة لمساحة العمل عند غيابه ويطبع نصيحة نسخ احتياطي إذا لم تكن مساحة العمل موجودة بالفعل ضمن git.

    راجع [/concepts/agent-workspace](/ar/concepts/agent-workspace) للحصول على دليل كامل لبنية مساحة العمل والنسخ الاحتياطي عبر git (يوصى باستخدام GitHub أو GitLab خاص).

  </Accordion>
</AccordionGroup>

## ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
