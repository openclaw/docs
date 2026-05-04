---
read_when:
    - إضافة ترحيلات التشخيص أو تعديلها
    - إدخال تغييرات كاسرة في الإعدادات
sidebarTitle: Doctor
summary: 'أمر doctor: فحوصات الصحة، وترحيلات الإعدادات، وخطوات الإصلاح'
title: التشخيص
x-i18n:
    generated_at: "2026-05-04T09:37:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bc8615f5e49e8c20785a9dc9779c447fd0d5794c80663d2396b0a20b4187798
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` هي أداة الإصلاح + الترحيل في OpenClaw. تصلح الإعدادات/الحالة القديمة، وتتحقق من الصحة، وتوفر خطوات إصلاح قابلة للتنفيذ.

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

    قبول الإعدادات الافتراضية دون مطالبة (بما في ذلك خطوات إصلاح إعادة التشغيل/الخدمة/العزل عند انطباقها).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    تطبيق الإصلاحات الموصى بها دون مطالبة (الإصلاحات + إعادة التشغيل حيث يكون ذلك آمنا).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    تطبيق الإصلاحات المكثفة أيضا (يستبدل إعدادات المشرف المخصصة).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    التشغيل دون مطالبات وتطبيق عمليات الترحيل الآمنة فقط (تطبيع الإعدادات + نقل الحالة على القرص). يتخطى إجراءات إعادة التشغيل/الخدمة/العزل التي تتطلب تأكيدا بشريا. تعمل عمليات ترحيل الحالة القديمة تلقائيا عند اكتشافها.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    فحص خدمات النظام بحثا عن تثبيتات gateway إضافية (launchd/systemd/schtasks).

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
    - فحص حداثة بروتوكول واجهة المستخدم (يعيد بناء Control UI عندما يكون مخطط البروتوكول أحدث).
    - فحص الصحة + مطالبة إعادة التشغيل.
    - ملخص حالة Skills (مؤهلة/مفقودة/محظورة) وحالة plugin.

  </Accordion>
  <Accordion title="الإعدادات وعمليات الترحيل">
    - تطبيع الإعدادات للقيم القديمة.
    - ترحيل إعدادات Talk من حقول `talk.*` المسطحة القديمة إلى `talk.provider` + `talk.providers.<provider>`.
    - فحوصات ترحيل المتصفح لإعدادات إضافة Chrome القديمة وجاهزية Chrome MCP.
    - تحذيرات تجاوز موفر OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - تحذيرات حجب OAuth في Codex (`models.providers.openai-codex`).
    - فحص متطلبات OAuth TLS الأساسية لملفات تعريف OpenAI Codex OAuth.
    - تحذيرات قائمة السماح لـ plugin/الأدوات عندما يكون `plugins.allow` مقيدا لكن سياسة الأدوات ما زالت تطلب أحرف بدل أو أدوات مملوكة لـ plugin.
    - ترحيل الحالة القديمة على القرص (الجلسات/دليل الوكيل/مصادقة WhatsApp).
    - ترحيل مفاتيح عقد بيان plugin القديمة (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - ترحيل مخزن cron القديم (`jobId`, `schedule.cron`, حقول التسليم/الحمولة على المستوى الأعلى، حمولة `provider`, وظائف Webhook الاحتياطية البسيطة `notify: true`).
    - ترحيل سياسة تشغيل الوكيل القديمة إلى `agents.defaults.agentRuntime` و`agents.list[].agentRuntime`.
    - تنظيف إعدادات plugin القديمة عندما تكون plugins مفعلة؛ عندما يكون `plugins.enabled=false`، تعامل مراجع plugin القديمة كإعداد احتواء خامد وتبقى محفوظة.

  </Accordion>
  <Accordion title="الحالة والسلامة">
    - فحص ملف قفل الجلسة وتنظيف الأقفال القديمة.
    - إصلاح نصوص الجلسات للفروع المكررة لإعادة كتابة المطالبة التي أنشأتها إصدارات 2026.4.24 المتأثرة.
    - اكتشاف علامات قبر استرداد إعادة تشغيل الوكيل الفرعي العالق، مع دعم `--fix` لمسح علامات الاسترداد الملغاة القديمة حتى لا يستمر بدء التشغيل في التعامل مع الابن كأنه ألغي بسبب إعادة التشغيل.
    - فحوصات سلامة الحالة والأذونات (الجلسات، النصوص، دليل الحالة).
    - فحوصات أذونات ملف الإعدادات (chmod 600) عند التشغيل محليا.
    - صحة مصادقة النموذج: تتحقق من انتهاء OAuth، ويمكنها تحديث الرموز التي تقترب من الانتهاء، وتبلغ عن حالات التهدئة/التعطيل لملف تعريف المصادقة.
    - اكتشاف دليل مساحة عمل إضافي (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway، والخدمات، والمشرفون">
    - إصلاح صورة العزل عندما يكون العزل مفعلا.
    - ترحيل الخدمة القديمة واكتشاف gateway إضافي.
    - ترحيل حالة قناة Matrix القديمة (في وضع `--fix` / `--repair`).
    - فحوصات تشغيل Gateway (الخدمة مثبتة لكنها لا تعمل؛ تسمية launchd المخزنة مؤقتا).
    - تحذيرات حالة القنوات (يجري فحصها من gateway العامل).
    - تدقيق إعدادات المشرف (launchd/systemd/schtasks) مع إصلاح اختياري.
    - تنظيف بيئة الوكيل المضمنة لخدمات gateway التي التقطت قيم shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` أثناء التثبيت أو التحديث.
    - فحوصات أفضل ممارسات تشغيل Gateway (Node مقابل Bun، ومسارات مدير الإصدارات).
    - تشخيصات تعارض منفذ Gateway (الافتراضي `18789`).

  </Accordion>
  <Accordion title="المصادقة، والأمان، والإقران">
    - تحذيرات أمنية لسياسات الرسائل الخاصة المفتوحة.
    - فحوصات مصادقة Gateway لوضع الرمز المحلي (يعرض إنشاء رمز عندما لا يوجد مصدر رمز؛ ولا يستبدل إعدادات token SecretRef).
    - اكتشاف مشكلات إقران الأجهزة (طلبات الإقران الأولية المعلقة، وترقيات الدور/النطاق المعلقة، وانحراف ذاكرة الرمز المحلي للجهاز القديمة، وانحراف مصادقة سجل الإقران).

  </Accordion>
  <Accordion title="مساحة العمل وshell">
    - فحص systemd linger على Linux.
    - فحص حجم ملف تمهيد مساحة العمل (تحذيرات الاقتطاع/الاقتراب من الحد لملفات السياق).
    - فحص جاهزية Skills للوكيل الافتراضي؛ يبلغ عن skills المسموحة مع ملفات تنفيذية، أو بيئة، أو إعدادات، أو متطلبات نظام تشغيل مفقودة، ويمكن لـ `--fix` تعطيل skills غير المتاحة في `skills.entries`.
    - فحص حالة إكمال shell والتثبيت/الترقية التلقائية.
    - فحص جاهزية موفر تضمين بحث الذاكرة (نموذج محلي، أو مفتاح API بعيد، أو ملف QMD تنفيذي).
    - فحوصات تثبيت المصدر (عدم تطابق مساحة عمل pnpm، أصول واجهة مستخدم مفقودة، ملف tsx تنفيذي مفقود).
    - يكتب الإعدادات المحدثة + بيانات معالج الإعداد الوصفية.

  </Accordion>
</AccordionGroup>

## تعبئة واجهة Dreams وإعادة ضبطها

يتضمن مشهد Dreams في Control UI إجراءات **التعبئة**، و**إعادة الضبط**، و**مسح المثبت** لسير عمل dreaming المثبت. تستخدم هذه الإجراءات طرق RPC شبيهة بـ gateway doctor، لكنها **ليست** جزءا من إصلاح/ترحيل CLI الخاص بـ `openclaw doctor`.

ما تفعله:

- تفحص **التعبئة** ملفات `memory/YYYY-MM-DD.md` التاريخية في مساحة العمل النشطة، وتشغل تمريرة يوميات REM المثبتة، وتكتب إدخالات تعبئة قابلة للعكس في `DREAMS.md`.
- تزيل **إعادة الضبط** إدخالات يوميات التعبئة الموسومة فقط من `DREAMS.md`.
- يزيل **مسح المثبت** فقط الإدخالات المرحلية قصيرة المدى المثبتة فقط التي جاءت من إعادة تشغيل تاريخية ولم تراكم بعد استدعاء مباشرا أو دعما يوميا.

ما **لا** تفعله بمفردها:

- لا تعدل `MEMORY.md`
- لا تشغل عمليات ترحيل doctor كاملة
- لا تدرج تلقائيا المرشحين المثبتين في مخزن الترقية القصيرة المدى الحي إلا إذا شغلت صراحة مسار CLI المرحلي أولا

إذا أردت أن تؤثر إعادة التشغيل التاريخية المثبتة في مسار الترقية العميقة العادي، فاستخدم تدفق CLI بدلا من ذلك:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

يؤدي ذلك إلى إدراج المرشحين المتينين المثبتين في مخزن dreaming قصير المدى مع إبقاء `DREAMS.md` كسطح للمراجعة.

## السلوك التفصيلي والمبررات

<AccordionGroup>
  <Accordion title="0. تحديث اختياري (تثبيتات git)">
    إذا كان هذا checkout من git وكان doctor يعمل تفاعليا، فإنه يعرض التحديث (fetch/rebase/build) قبل تشغيل doctor.
  </Accordion>
  <Accordion title="1. تطبيع الإعدادات">
    إذا كانت الإعدادات تحتوي على أشكال قيم قديمة (على سبيل المثال `messages.ackReaction` دون تجاوز خاص بالقناة)، فإن doctor يطبعها إلى المخطط الحالي.

    يشمل ذلك حقول Talk المسطحة القديمة. إعدادات Talk العامة الحالية هي `talk.provider` + `talk.providers.<provider>`. يعيد doctor كتابة الأشكال القديمة `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` إلى خريطة الموفر.

    يحذر doctor أيضا عندما يكون `plugins.allow` غير فارغ وتستخدم سياسة الأدوات
    إدخالات أدوات بحرف بدل أو مملوكة لـ plugin. يطابق `tools.allow: ["*"]` فقط الأدوات
    من plugins التي تحمل فعلا؛ ولا يتجاوز قائمة السماح الحصرية لـ plugin.

  </Accordion>
  <Accordion title="2. ترحيلات مفاتيح الإعدادات القديمة">
    عندما تحتوي الإعدادات على مفاتيح مهملة، ترفض الأوامر الأخرى العمل وتطلب منك تشغيل `openclaw doctor`.

    سيقوم doctor بما يلي:

    - يشرح مفاتيح الإرث التي عثر عليها.
    - يعرض الترحيل الذي طبقه.
    - يعيد كتابة `~/.openclaw/openclaw.json` بالمخطط المحدث.

    يشغل Gateway أيضا ترحيلات doctor تلقائيا عند بدء التشغيل عندما يكتشف تنسيق إعدادات قديما، لذلك تصلح الإعدادات القديمة دون تدخل يدوي. تتولى `openclaw doctor --fix` ترحيلات مخزن وظائف Cron.

    عمليات الترحيل الحالية:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - إعدادات القنوات المكوَّنة التي تفتقد سياسة رد مرئية → `messages.groupChat.visibleReplies: "message_tool"`
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
    - بالنسبة إلى القنوات التي تحتوي على `accounts` مسماة لكن ما زالت لديها قيم قناة منفردة عالقة في المستوى الأعلى، انقل تلك القيم ذات النطاق الحسابي إلى الحساب المرَقّى المختار لتلك القناة (`accounts.default` لمعظم القنوات؛ يمكن لـ Matrix الاحتفاظ بهدف مسمى/افتراضي مطابق موجود)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - أزِل `agents.defaults.llm`؛ استخدم `models.providers.<id>.timeoutSeconds` لمهل انتهاء موفر/نموذج بطيء
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - أزِل `browser.relayBindHost` (إعداد ترحيل إضافة قديم)
    - `models.providers.*.api: "openai"` القديمة → `"openai-completions"` (يتخطى بدء تشغيل Gateway أيضًا الموفرين الذين عُيّنت قيمة `api` لديهم إلى قيمة تعداد مستقبلية أو غير معروفة بدلًا من الفشل المغلق)

    تشمل تحذيرات doctor أيضًا إرشادات الحساب الافتراضي للقنوات متعددة الحسابات:

    - إذا ضُبط إدخالان أو أكثر من `channels.<channel>.accounts` من دون `channels.<channel>.defaultAccount` أو `accounts.default`، يحذّر doctor من أن التوجيه الاحتياطي يمكن أن يختار حسابًا غير متوقع.
    - إذا عُيّن `channels.<channel>.defaultAccount` إلى معرّف حساب غير معروف، يحذّر doctor ويسرد معرّفات الحسابات المكوَّنة.

  </Accordion>
  <Accordion title="2b. تجاوزات موفر OpenCode">
    إذا أضفت `models.providers.opencode` أو `opencode-zen` أو `opencode-go` يدويًا، فإنه يتجاوز كتالوج OpenCode المضمَّن من `@mariozechner/pi-ai`. يمكن أن يجبر ذلك النماذج على API غير صحيح أو يصفّر التكاليف. يحذّر doctor كي تتمكن من إزالة التجاوز واستعادة توجيه API والتكاليف لكل نموذج.
  </Accordion>
  <Accordion title="2c. ترحيل المتصفح وجاهزية Chrome MCP">
    إذا كان إعداد المتصفح لديك ما زال يشير إلى مسار إضافة Chrome المُزالة، يطبّعه doctor إلى نموذج إرفاق Chrome MCP المحلي للمضيف الحالي:

    - يصبح `browser.profiles.*.driver: "extension"` هو `"existing-session"`
    - تتم إزالة `browser.relayBindHost`

    يراجع doctor أيضًا مسار Chrome MCP المحلي للمضيف عند استخدام `defaultProfile: "user"` أو ملف تعريف `existing-session` مكوَّن:

    - يتحقق مما إذا كان Google Chrome مثبتًا على المضيف نفسه لملفات تعريف الاتصال التلقائي الافتراضية
    - يتحقق من إصدار Chrome المكتشف ويحذّر عندما يكون أقل من Chrome 144
    - يذكّرك بتمكين تصحيح الأخطاء عن بُعد في صفحة فحص المتصفح (مثل `chrome://inspect/#remote-debugging` أو `brave://inspect/#remote-debugging` أو `edge://inspect/#remote-debugging`)

    لا يستطيع doctor تمكين الإعداد الخاص بجانب Chrome نيابةً عنك. لا يزال Chrome MCP المحلي للمضيف يتطلب:

    - متصفحًا مبنيًا على Chromium بإصدار 144+ على مضيف gateway/node
    - تشغيل المتصفح محليًا
    - تمكين تصحيح الأخطاء عن بُعد في ذلك المتصفح
    - الموافقة على مطالبة إذن الإرفاق الأولى في المتصفح

    تتعلق الجاهزية هنا فقط بمتطلبات الإرفاق المحلي. يحافظ `existing-session` على حدود مسار Chrome MCP الحالية؛ وما زالت المسارات المتقدمة مثل `responsebody` وتصدير PDF واعتراض التنزيل والإجراءات الدفعية تتطلب متصفحًا مُدارًا أو ملف تعريف CDP خامًا.

    لا ينطبق هذا الفحص على Docker أو sandbox أو remote-browser أو غيرها من التدفقات بلا واجهة. تواصل هذه التدفقات استخدام CDP الخام.

  </Accordion>
  <Accordion title="2d. المتطلبات المسبقة لـ OAuth TLS">
    عند تهيئة ملف تعريف OpenAI Codex OAuth، يفحص doctor نقطة نهاية تفويض OpenAI للتحقق من أن مكدس Node/OpenSSL TLS المحلي يمكنه التحقق من سلسلة الشهادات. إذا فشل الفحص بخطأ شهادة (مثل `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` أو شهادة منتهية الصلاحية أو شهادة موقعة ذاتيًا)، يطبع doctor إرشادات إصلاح خاصة بالمنصة. على macOS مع Homebrew Node، يكون الإصلاح عادةً `brew postinstall ca-certificates`. مع `--deep`، يعمل الفحص حتى إذا كان gateway سليمًا.
  </Accordion>
  <Accordion title="2e. تجاوزات موفر Codex OAuth">
    إذا كنت قد أضفت سابقًا إعدادات نقل OpenAI قديمة تحت `models.providers.openai-codex`، فيمكنها حجب مسار موفر Codex OAuth المضمَّن الذي تستخدمه الإصدارات الأحدث تلقائيًا. يحذّر doctor عندما يرى تلك إعدادات النقل القديمة إلى جانب Codex OAuth كي تتمكن من إزالة تجاوز النقل المتقادم أو إعادة كتابته واستعادة سلوك التوجيه/الاحتياطي المضمَّن. ما زالت الوكلاء المخصصة والتجاوزات المقتصرة على الرؤوس مدعومة ولا تؤدي إلى هذا التحذير.
  </Accordion>
  <Accordion title="2f. تحذيرات مسار Codex Plugin">
    عند تمكين Codex Plugin المضمَّن، يتحقق doctor أيضًا مما إذا كانت مراجع النموذج الأساسي `openai-codex/*` ما زالت تُحل عبر مشغّل PI الافتراضي. هذه التركيبة صالحة عندما تريد مصادقة Codex OAuth/الاشتراك عبر PI، لكنها قد تُخلط بسهولة مع مشغّل خادم تطبيق Codex الأصلي. يحذّر doctor ويشير إلى صيغة خادم التطبيق الصريحة: `openai/*` إضافة إلى `agentRuntime.id: "codex"` أو `OPENCLAW_AGENT_RUNTIME=codex`.

    لا يصلح doctor هذا تلقائيًا لأن كلا المسارين صالحان:

    - `openai-codex/*` + PI تعني "استخدم مصادقة Codex OAuth/الاشتراك عبر مشغّل OpenClaw العادي."
    - `openai/*` + `agentRuntime.id: "codex"` تعني "شغّل الدورة المضمَّنة عبر خادم تطبيق Codex الأصلي."
    - `/codex ...` تعني "تحكّم في محادثة Codex أصلية أو اربطها من الدردشة."
    - `/acp ...` أو `runtime: "acp"` تعني "استخدم محوّل ACP/acpx الخارجي."

    إذا ظهر التحذير، اختر المسار الذي قصدته وحرر الإعداد يدويًا. أبقِ التحذير كما هو عندما يكون PI Codex OAuth مقصودًا.

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

    هذه الترحيلات تُبذل على أفضل وجه وهي تكرارية آمنة؛ سيصدر doctor تحذيرات عندما يترك أي مجلدات قديمة وراءه كنسخ احتياطية. يقوم Gateway/CLI أيضًا بترحيل مخزن الجلسات ودليل الوكيل القديمين تلقائيًا عند بدء التشغيل لكي يستقر السجل/المصادقة/النماذج في المسار الخاص بكل وكيل من دون تشغيل doctor يدويًا. تُرحَّل مصادقة WhatsApp عمدًا عبر `openclaw doctor` فقط. تقارن تسوية موفر الكلام/خريطة الموفر الآن بالمساواة البنيوية، لذلك لم تعد الفروق الناتجة عن ترتيب المفاتيح فقط تؤدي إلى تغييرات `doctor --fix` متكررة بلا أثر.

  </Accordion>
  <Accordion title="3a. ترحيلات بيانات Plugin القديمة">
    يفحص doctor كل بيانات Plugins المثبتة بحثًا عن مفاتيح قدرات قديمة في المستوى الأعلى (`speechProviders` و`realtimeTranscriptionProviders` و`realtimeVoiceProviders` و`mediaUnderstandingProviders` و`imageGenerationProviders` و`videoGenerationProviders` و`webFetchProviders` و`webSearchProviders`). عند العثور عليها، يعرض نقلها إلى كائن `contracts` وإعادة كتابة ملف البيان في مكانه. هذا الترحيل تكراري آمن؛ إذا كان مفتاح `contracts` يحتوي بالفعل على القيم نفسها، يُزال المفتاح القديم من دون تكرار البيانات.
  </Accordion>
  <Accordion title="3b. ترحيلات مخزن Cron القديمة">
    يتحقق doctor أيضًا من مخزن مهام cron (`~/.openclaw/cron/jobs.json` افتراضيًا، أو `cron.store` عند تجاوزه) بحثًا عن أشكال مهام قديمة ما زال المجدول يقبلها للتوافق.

    تشمل عمليات تنظيف cron الحالية:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - حقول الحمولة في المستوى الأعلى (`message`، `model`، `thinking`، ...) → `payload`
    - حقول التسليم في المستوى الأعلى (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - الأسماء البديلة لتسليم `provider` في الحمولة → `delivery.channel` صريح
    - مهام Webhook الاحتياطية القديمة البسيطة `notify: true` → `delivery.mode="webhook"` صريح مع `delivery.to=cron.webhook`

    يرحّل doctor تلقائيًا مهام `notify: true` فقط عندما يستطيع ذلك من دون تغيير السلوك. إذا جمعت مهمة بين احتياطي إشعار قديم ووضع تسليم غير Webhook موجود، يحذّر doctor ويترك تلك المهمة للمراجعة اليدوية.

    على Linux، يحذّر doctor أيضًا عندما لا يزال crontab الخاص بالمستخدم يستدعي `~/.openclaw/bin/ensure-whatsapp.sh` القديم. هذا السكربت المحلي للمضيف غير مُصان بواسطة OpenClaw الحالي ويمكنه كتابة رسائل `Gateway inactive` خاطئة إلى `~/.openclaw/logs/whatsapp-health.log` عندما لا يستطيع cron الوصول إلى ناقل مستخدم systemd. أزِل إدخال crontab المتقادم باستخدام `crontab -e`؛ واستخدم `openclaw channels status --probe` و`openclaw doctor` و`openclaw gateway status` لفحوصات السلامة الحالية.

  </Accordion>
  <Accordion title="3ج. تنظيف قفل الجلسة">
    يفحص Doctor كل دليل جلسة وكيل بحثًا عن ملفات قفل الكتابة القديمة — وهي ملفات تُترك عند خروج جلسة بشكل غير طبيعي. لكل ملف قفل يعثر عليه، يبلّغ عن: المسار، وPID، وما إذا كان PID لا يزال حيًا، وعمر القفل، وما إذا كان يُعد قديمًا (PID ميت أو أقدم من 30 دقيقة). في وضع `--fix` / `--repair` يزيل ملفات القفل القديمة تلقائيًا؛ وإلا فيطبع ملاحظة ويوجهك إلى إعادة التشغيل باستخدام `--fix`.
  </Accordion>
  <Accordion title="3د. إصلاح فرع نص جلسة المحادثة">
    يفحص Doctor ملفات JSONL الخاصة بجلسات الوكلاء بحثًا عن بنية الفرع المكررة التي أنشأها خطأ إعادة كتابة نص المحادثة في 2026.4.24: دور مستخدم مهجور يحتوي على سياق تشغيل داخلي من OpenClaw مع فرع شقيق نشط يحتوي على مطالبة المستخدم المرئية نفسها. في وضع `--fix` / `--repair`، ينشئ Doctor نسخة احتياطية من كل ملف متأثر بجوار الأصل ويعيد كتابة نص المحادثة إلى الفرع النشط بحيث لا يرى سجل Gateway وقارئو الذاكرة الأدوار المكررة بعد الآن.
  </Accordion>
  <Accordion title="4. فحوص سلامة الحالة (استمرار الجلسات، والتوجيه، والسلامة)">
    دليل الحالة هو جذع الدماغ التشغيلي. إذا اختفى، فستفقد الجلسات وبيانات الاعتماد والسجلات والإعدادات (ما لم تكن لديك نسخ احتياطية في مكان آخر).

    يتحقق Doctor مما يلي:

    - **دليل الحالة مفقود**: يحذر من فقدان كارثي للحالة، ويطلب إعادة إنشاء الدليل، ويذكّرك بأنه لا يستطيع استرداد البيانات المفقودة.
    - **أذونات دليل الحالة**: يتحقق من قابلية الكتابة؛ ويعرض إصلاح الأذونات (ويصدر تلميح `chown` عند اكتشاف عدم تطابق المالك/المجموعة).
    - **دليل حالة متزامن سحابيًا على macOS**: يحذر عندما تُحل الحالة ضمن iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) أو `~/Library/CloudStorage/...` لأن المسارات المدعومة بالمزامنة قد تسبب إدخال/إخراج أبطأ وتسابقات قفل/مزامنة.
    - **دليل حالة Linux على SD أو eMMC**: يحذر عندما تُحل الحالة إلى مصدر تركيب `mmcblk*`، لأن الإدخال/الإخراج العشوائي المدعوم بـ SD أو eMMC قد يكون أبطأ ويتآكل أسرع عند كتابة الجلسات وبيانات الاعتماد.
    - **أدلة الجلسات مفقودة**: يلزم وجود `sessions/` ودليل مخزن الجلسات للاحتفاظ بالسجل وتجنب أعطال `ENOENT`.
    - **عدم تطابق نص المحادثة**: يحذر عندما تحتوي إدخالات الجلسات الحديثة على ملفات نص محادثة مفقودة.
    - **جلسة رئيسية "JSONL بسطر واحد"**: يضع علامة عندما يحتوي نص المحادثة الرئيسي على سطر واحد فقط (أي أن السجل لا يتراكم).
    - **أدلة حالة متعددة**: يحذر عندما توجد عدة مجلدات `~/.openclaw` عبر أدلة المنزل أو عندما يشير `OPENCLAW_STATE_DIR` إلى مكان آخر (قد ينقسم السجل بين التثبيتات).
    - **تذكير الوضع البعيد**: إذا كان `gateway.mode=remote`، يذكّرك Doctor بتشغيله على المضيف البعيد (الحالة موجودة هناك).
    - **أذونات ملف الإعدادات**: يحذر إذا كان `~/.openclaw/openclaw.json` قابلًا للقراءة من المجموعة/العالم ويعرض تضييقه إلى `600`.

  </Accordion>
  <Accordion title="5. صحة مصادقة النموذج (انتهاء صلاحية OAuth)">
    يفحص Doctor ملفات تعريف OAuth في مخزن المصادقة، ويحذر عند اقتراب انتهاء صلاحية الرموز أو انتهائها، ويمكنه تحديثها عندما يكون ذلك آمنًا. إذا كان ملف تعريف OAuth/الرمز الخاص بـ Anthropic قديمًا، فإنه يقترح مفتاح Anthropic API أو مسار رمز إعداد Anthropic. تظهر مطالبات التحديث فقط عند التشغيل تفاعليًا (TTY)؛ ويتخطى `--non-interactive` محاولات التحديث.

    عندما يفشل تحديث OAuth نهائيًا (على سبيل المثال `refresh_token_reused` أو `invalid_grant` أو عندما يطلب منك موفر تسجيل الدخول مرة أخرى)، يبلّغ Doctor بأن إعادة المصادقة مطلوبة ويطبع أمر `openclaw models auth login --provider ...` الدقيق لتشغيله.

    يبلّغ Doctor أيضًا عن ملفات تعريف المصادقة غير القابلة للاستخدام مؤقتًا بسبب:

    - فترات تهدئة قصيرة (حدود المعدل/انتهاءات المهلة/فشل المصادقة)
    - تعطيلات أطول (فشل الفوترة/الرصيد)

  </Accordion>
  <Accordion title="6. التحقق من نموذج الخطافات">
    إذا تم تعيين `hooks.gmail.model`، يتحقق Doctor من مرجع النموذج مقابل الفهرس وقائمة السماح ويحذر عندما لا يمكن حله أو يكون غير مسموح به.
  </Accordion>
  <Accordion title="7. إصلاح صورة sandbox">
    عندما تكون sandboxing مفعّلة، يتحقق Doctor من صور Docker ويعرض بناءها أو التبديل إلى الأسماء القديمة إذا كانت الصورة الحالية مفقودة.
  </Accordion>
  <Accordion title="7ب. تنظيف تثبيت Plugin">
    يزيل Doctor حالة تهيئة تبعيات Plugin القديمة التي أنشأها OpenClaw في وضع `openclaw doctor --fix` / `openclaw doctor --repair`. يغطي ذلك جذور التبعيات المولدة القديمة، وأدلة مراحل التثبيت القديمة، ومخلفات الحزم المحلية من كود إصلاح تبعيات Plugin المضمنة السابق، والنسخ المُدارة من npm المعزولة أو المستردة من Plugins `@openclaw/*` المضمنة التي يمكن أن تحجب البيان المضمن الحالي.

    يمكن لـ Doctor أيضًا إعادة تثبيت Plugins القابلة للتنزيل والمضبوطة عندما تشير الإعدادات إليها لكن سجل Plugins المحلي لا يستطيع العثور عليها. بالنسبة إلى تحويل Plugins المضمنة إلى خارجية في 2026.5.2، يثبت Doctor تلقائيًا Plugins القابلة للتنزيل التي تستخدمها الإعدادات الحالية بالفعل، ثم يعتمد على `meta.lastTouchedVersion` لتشغيل تمريرة الإصدار هذه مرة واحدة فقط. لا يشغّل بدء Gateway وإعادة تحميل الإعدادات مديري الحزم؛ تبقى تثبيتات Plugins عملًا صريحًا عبر Doctor/التثبيت/التحديث.

  </Accordion>
  <Accordion title="8. ترحيلات خدمة Gateway وتلميحات التنظيف">
    يكتشف Doctor خدمات Gateway القديمة (launchd/systemd/schtasks) ويعرض إزالتها وتثبيت خدمة OpenClaw باستخدام منفذ Gateway الحالي. ويمكنه أيضًا البحث عن خدمات إضافية شبيهة بـ Gateway وطباعة تلميحات تنظيف. تُعد خدمات Gateway الخاصة بـ OpenClaw والمسماة بالملفات التعريفية خدمات من الدرجة الأولى ولا يُشار إليها على أنها "إضافية."

    على Linux، إذا كانت خدمة Gateway على مستوى المستخدم مفقودة لكن توجد خدمة Gateway من OpenClaw على مستوى النظام، لا يثبت Doctor خدمة ثانية على مستوى المستخدم تلقائيًا. افحص باستخدام `openclaw gateway status --deep` أو `openclaw doctor --deep`، ثم أزل النسخة المكررة أو عيّن `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يكون مشرف نظام خارجي مالكًا لدورة حياة Gateway.

  </Accordion>
  <Accordion title="8ب. ترحيل Matrix عند بدء التشغيل">
    عندما يكون لحساب قناة Matrix ترحيل حالة قديم معلق أو قابل للتنفيذ، ينشئ Doctor (في وضع `--fix` / `--repair`) لقطة قبل الترحيل ثم يشغّل خطوات الترحيل بأفضل جهد: ترحيل حالة Matrix القديمة وتحضير الحالة المشفرة القديمة. كلتا الخطوتين غير قاتلتين؛ تُسجل الأخطاء ويستمر بدء التشغيل. في وضع القراءة فقط (`openclaw doctor` بدون `--fix`) يتم تخطي هذا الفحص بالكامل.
  </Accordion>
  <Accordion title="8ج. إقران الجهاز وانحراف المصادقة">
    يفحص Doctor الآن حالة إقران الجهاز كجزء من تمريرة الصحة العادية.

    ما يبلّغ عنه:

    - طلبات إقران أول مرة معلقة
    - ترقيات أدوار معلقة للأجهزة المقترنة بالفعل
    - ترقيات نطاقات معلقة للأجهزة المقترنة بالفعل
    - إصلاحات عدم تطابق المفتاح العام عندما يظل معرف الجهاز مطابقًا لكن هوية الجهاز لم تعد تطابق السجل الموافق عليه
    - سجلات مقترنة تفتقد رمزًا نشطًا لدور موافق عليه
    - رموز مقترنة تنحرف نطاقاتها خارج خط أساس الإقران الموافق عليه
    - إدخالات رمز جهاز محلية مخزنة مؤقتًا للجهاز الحالي تسبق تدوير رمز على جانب Gateway أو تحمل بيانات وصفية قديمة للنطاق

    لا يوافق Doctor تلقائيًا على طلبات الإقران ولا يدور رموز الأجهزة تلقائيًا. يطبع الخطوات التالية الدقيقة بدلًا من ذلك:

    - افحص الطلبات المعلقة باستخدام `openclaw devices list`
    - وافق على الطلب الدقيق باستخدام `openclaw devices approve <requestId>`
    - دوّر رمزًا جديدًا باستخدام `openclaw devices rotate --device <deviceId> --role <role>`
    - أزل سجلًا قديمًا وأعد الموافقة عليه باستخدام `openclaw devices remove <deviceId>`

    هذا يسد الفجوة الشائعة "مقترن بالفعل لكن لا يزال يطلب الإقران": يميّز Doctor الآن بين الإقران لأول مرة وترقيات الدور/النطاق المعلقة وانحراف الرمز/هوية الجهاز القديم.

  </Accordion>
  <Accordion title="9. تحذيرات الأمان">
    يصدر Doctor تحذيرات عندما يكون موفر مفتوحًا للرسائل المباشرة بدون قائمة سماح، أو عندما تكون سياسة مضبوطة بطريقة خطرة.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    إذا كان يعمل كخدمة مستخدم systemd، يتأكد Doctor من تفعيل lingering حتى يبقى Gateway حيًا بعد تسجيل الخروج.
  </Accordion>
  <Accordion title="11. حالة مساحة العمل (Skills وPlugins والأدلة القديمة)">
    يطبع Doctor ملخصًا لحالة مساحة العمل للوكيل الافتراضي:

    - **حالة Skills**: يحصي Skills المؤهلة، ومفقودة المتطلبات، والمحظورة بقائمة السماح.
    - **أدلة مساحة العمل القديمة**: يحذر عندما توجد `~/openclaw` أو أدلة مساحة عمل قديمة أخرى إلى جانب مساحة العمل الحالية.
    - **حالة Plugin**: يحصي Plugins المفعّلة/المعطلة/ذات الأخطاء؛ ويسرد معرفات Plugins لأي أخطاء؛ ويبلّغ عن قدرات Plugins المجمعة.
    - **تحذيرات توافق Plugin**: يضع علامات على Plugins التي لديها مشكلات توافق مع وقت التشغيل الحالي.
    - **تشخيصات Plugin**: يبرز أي تحذيرات أو أخطاء وقت تحميل يصدرها سجل Plugins.

  </Accordion>
  <Accordion title="11ب. حجم ملف bootstrap">
    يتحقق Doctor مما إذا كانت ملفات bootstrap الخاصة بمساحة العمل (مثل `AGENTS.md` أو `CLAUDE.md` أو ملفات سياق محقونة أخرى) قريبة من ميزانية الأحرف المضبوطة أو تتجاوزها. يبلّغ لكل ملف عن عدد الأحرف الخام مقابل المحقونة، ونسبة الاقتطاع، وسبب الاقتطاع (`max/file` أو `max/total`)، وإجمالي الأحرف المحقونة كنسبة من إجمالي الميزانية. عندما تُقتطع الملفات أو تقترب من الحد، يطبع Doctor نصائح لضبط `agents.defaults.bootstrapMaxChars` و`agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11د. تنظيف Plugin قناة قديم">
    عندما يزيل `openclaw doctor --fix` Plugin قناة مفقودًا، فإنه يزيل أيضًا إعدادات نطاق القناة المتدلية التي أشارت إلى ذلك Plugin: إدخالات `channels.<id>`، وأهداف Heartbeat التي سمت القناة، وتجاوزات `agents.*.models["<channel>/*"]`. يمنع هذا حلقات إقلاع Gateway حيث اختفى وقت تشغيل القناة لكن الإعدادات لا تزال تطلب من Gateway الارتباط به.
  </Accordion>
  <Accordion title="11ج. إكمال الصدفة">
    يتحقق Doctor مما إذا كان إكمال التبويب مثبتًا للصدفة الحالية (zsh أو bash أو fish أو PowerShell):

    - إذا كان ملف تعريف الصدفة يستخدم نمط إكمال ديناميكيًا بطيئًا (`source <(openclaw completion ...)`)، يرقيه Doctor إلى متغير الملف المخبأ الأسرع.
    - إذا كان الإكمال مضبوطًا في الملف التعريفي لكن ملف التخزين المؤقت مفقود، يعيد Doctor إنشاء التخزين المؤقت تلقائيًا.
    - إذا لم يكن أي إكمال مضبوطًا على الإطلاق، يطلب Doctor تثبيته (وضع تفاعلي فقط؛ يتم تخطيه مع `--non-interactive`).

    شغّل `openclaw completion --write-state` لإعادة إنشاء التخزين المؤقت يدويًا.

  </Accordion>
  <Accordion title="12. فحوص مصادقة Gateway (الرمز المحلي)">
    يتحقق Doctor من جاهزية مصادقة رمز Gateway المحلي.

    - إذا كان وضع الرمز يحتاج إلى رمز ولا يوجد أي مصدر رمز، يعرض Doctor إنشاء واحد.
    - إذا كان `gateway.auth.token` مُدارًا عبر SecretRef لكنه غير متاح، يحذر Doctor ولا يستبدله بنص عادي.
    - يفرض `openclaw doctor --generate-gateway-token` التوليد فقط عندما لا يكون أي SecretRef للرمز مضبوطًا.

  </Accordion>
  <Accordion title="12ب. إصلاحات قراءة فقط مدركة لـ SecretRef">
    تحتاج بعض مسارات الإصلاح إلى فحص بيانات الاعتماد المضبوطة دون إضعاف سلوك الفشل السريع في وقت التشغيل.

    - يستخدم `openclaw doctor --fix` الآن نموذج ملخص SecretRef للقراءة فقط نفسه الذي تستخدمه أوامر عائلة الحالة لإصلاحات الإعدادات المستهدفة.
    - مثال: تحاول إصلاحات `allowFrom` / `groupAllowFrom` الخاصة بـ Telegram `@username` استخدام بيانات اعتماد الروبوت المضبوطة عند توفرها.
    - إذا كان رمز روبوت Telegram مضبوطًا عبر SecretRef لكنه غير متاح في مسار الأمر الحالي، يبلّغ Doctor بأن بيانات الاعتماد مضبوطة لكنها غير متاحة ويتخطى الحل التلقائي بدلًا من التعطل أو الإبلاغ خطأً بأن الرمز مفقود.

  </Accordion>
  <Accordion title="13. فحص صحة Gateway + إعادة التشغيل">
    يُجري Doctor فحص صحة ويعرض إعادة تشغيل Gateway عندما يبدو غير سليم.
  </Accordion>
  <Accordion title="13b. جاهزية بحث الذاكرة">
    يتحقق Doctor مما إذا كان موفر تضمين بحث الذاكرة المكوّن جاهزًا للوكيل الافتراضي. يعتمد السلوك على الخلفية والموفر المكوّنين:

    - **خلفية QMD**: يفحص ما إذا كان ملف `qmd` الثنائي متاحًا وقابلًا للبدء. إذا لم يكن كذلك، يطبع إرشادات إصلاح تتضمن حزمة npm وخيار مسار ثنائي يدوي.
    - **موفر محلي صريح**: يتحقق من وجود ملف نموذج محلي أو عنوان URL لنموذج بعيد/قابل للتنزيل ومعروف. إذا كان مفقودًا، يقترح التبديل إلى موفر بعيد.
    - **موفر بعيد صريح** (`openai`، `voyage`، إلخ): يتحقق من وجود مفتاح API في البيئة أو مخزن المصادقة. يطبع تلميحات إصلاح قابلة للتنفيذ إذا كان مفقودًا.
    - **موفر تلقائي**: يتحقق أولًا من توفر النموذج المحلي، ثم يجرب كل موفر بعيد وفق ترتيب الاختيار التلقائي.

    عندما تكون نتيجة فحص Gateway مخبأة متاحة (كان Gateway سليمًا وقت الفحص)، يقارن doctor نتيجتها مع الإعدادات المرئية عبر CLI ويشير إلى أي اختلاف. لا يبدأ Doctor فحص تضمين جديدًا على المسار الافتراضي؛ استخدم أمر حالة الذاكرة العميق عندما تريد فحصًا مباشرًا للموفر.

    استخدم `openclaw memory status --deep` للتحقق من جاهزية التضمين وقت التشغيل.

  </Accordion>
  <Accordion title="14. تحذيرات حالة القنوات">
    إذا كان Gateway سليمًا، يُجري doctor فحص حالة القنوات ويبلّغ عن التحذيرات مع إصلاحات مقترحة.
  </Accordion>
  <Accordion title="15. تدقيق إعدادات المشرف + الإصلاح">
    يتحقق Doctor من إعدادات المشرف المثبتة (launchd/systemd/schtasks) بحثًا عن الإعدادات الافتراضية المفقودة أو القديمة (مثل تبعيات systemd لـ network-online وتأخير إعادة التشغيل). عندما يجد عدم تطابق، يوصي بتحديث ويمكنه إعادة كتابة ملف الخدمة/المهمة إلى الإعدادات الافتراضية الحالية.

    ملاحظات:

    - يطلب `openclaw doctor` التأكيد قبل إعادة كتابة إعدادات المشرف.
    - يقبل `openclaw doctor --yes` مطالبات الإصلاح الافتراضية.
    - يطبّق `openclaw doctor --repair` الإصلاحات الموصى بها دون مطالبات.
    - يكتب `openclaw doctor --repair --force` فوق إعدادات المشرف المخصصة.
    - يحافظ `OPENCLAW_SERVICE_REPAIR_POLICY=external` على doctor في وضع القراءة فقط لدورة حياة خدمة Gateway. يظل يبلّغ عن صحة الخدمة ويجري إصلاحات غير متعلقة بالخدمة، لكنه يتخطى تثبيت/بدء/إعادة تشغيل/تهيئة الخدمة، وإعادة كتابة إعدادات المشرف، وتنظيف الخدمات القديمة لأن مشرفًا خارجيًا يملك دورة الحياة تلك.
    - على Linux، لا يعيد doctor كتابة بيانات الأمر/نقطة الدخول الوصفية عندما تكون وحدة systemd المطابقة لـ Gateway نشطة. كما يتجاهل الوحدات الإضافية غير القديمة وغير النشطة الشبيهة بـ Gateway أثناء فحص الخدمات المكررة حتى لا تنشئ ملفات الخدمات المرافقة ضوضاء تنظيف.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان `gateway.auth.token` مُدارًا بواسطة SecretRef، يتحقق تثبيت/إصلاح خدمة doctor من SecretRef لكنه لا يحفظ قيم الرمز النصية المحلولة في بيانات بيئة خدمة المشرف الوصفية.
    - يكتشف Doctor قيم بيئة الخدمة المُدارة المدعومة بـ `.env`/SecretRef التي كانت تثبيتات LaunchAgent أو systemd أو Windows Scheduled Task الأقدم تُضمّنها مباشرة، ويعيد كتابة بيانات الخدمة الوصفية بحيث تُحمّل تلك القيم من مصدر وقت التشغيل بدلًا من تعريف المشرف.
    - يكتشف Doctor عندما يظل أمر الخدمة يثبت منفذ `--port` قديمًا بعد تغيّر `gateway.port` ويعيد كتابة بيانات الخدمة الوصفية إلى المنفذ الحالي.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef للرمز المكوّن غير محلول، يحظر doctor مسار التثبيت/الإصلاح مع إرشادات قابلة للتنفيذ.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين وكان `gateway.auth.mode` غير معيّن، يحظر doctor التثبيت/الإصلاح إلى أن يُعيّن الوضع صراحةً.
    - بالنسبة إلى وحدات user-systemd على Linux، تتضمن فحوصات انحراف الرمز في doctor الآن مصدري `Environment=` و`EnvironmentFile=` عند مقارنة بيانات مصادقة الخدمة الوصفية.
    - ترفض إصلاحات خدمة Doctor إعادة كتابة خدمة Gateway أو إيقافها أو إعادة تشغيلها من ملف OpenClaw ثنائي أقدم عندما تكون الإعدادات قد كُتبت آخر مرة بواسطة إصدار أحدث. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - يمكنك دائمًا فرض إعادة كتابة كاملة عبر `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. تشخيص وقت تشغيل Gateway والمنفذ">
    يفحص Doctor وقت تشغيل الخدمة (PID، وآخر حالة خروج) ويحذر عندما تكون الخدمة مثبتة لكنها لا تعمل فعليًا. كما يتحقق من تعارضات المنافذ على منفذ Gateway (الافتراضي `18789`) ويبلّغ عن الأسباب المحتملة (Gateway قيد التشغيل بالفعل، نفق SSH).
  </Accordion>
  <Accordion title="17. أفضل ممارسات وقت تشغيل Gateway">
    يحذر Doctor عندما تعمل خدمة Gateway على Bun أو مسار Node مُدار بالإصدارات (`nvm`، `fnm`، `volta`، `asdf`، إلخ). تتطلب قنوات WhatsApp وTelegram استخدام Node، ويمكن أن تتعطل مسارات مديري الإصدارات بعد الترقيات لأن الخدمة لا تحمّل تهيئة الصدفة لديك. يعرض Doctor الترحيل إلى تثبيت Node على النظام عندما يكون متاحًا (Homebrew/apt/choco).

    تستخدم LaunchAgents المثبتة أو المُصلحة حديثًا على macOS قيمة PATH نظامية معيارية (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) بدلًا من نسخ PATH للصدفة التفاعلية، لذلك لا تغيّر أدلة Volta وasdf وfnm وpnpm وغيرها من مديري الإصدارات كيفية حل عمليات Node الفرعية. لا تزال خدمات Linux تحتفظ بجذور بيئة صريحة (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) وأدلة user-bin مستقرة، لكن أدلة الرجوع التخمينية لمديري الإصدارات لا تُكتب إلى PATH الخاص بالخدمة إلا عندما تكون تلك الأدلة موجودة على القرص.

  </Accordion>
  <Accordion title="18. كتابة الإعدادات + بيانات المعالج الوصفية">
    يحفظ Doctor أي تغييرات في الإعدادات ويختم بيانات المعالج الوصفية لتسجيل تشغيل doctor.
  </Accordion>
  <Accordion title="19. نصائح مساحة العمل (النسخ الاحتياطي + نظام الذاكرة)">
    يقترح Doctor نظام ذاكرة لمساحة العمل عندما يكون مفقودًا ويطبع نصيحة نسخ احتياطي إذا لم تكن مساحة العمل موجودة بالفعل ضمن git.

    راجع [/concepts/agent-workspace](/ar/concepts/agent-workspace) للحصول على دليل كامل لبنية مساحة العمل والنسخ الاحتياطي عبر git (يُوصى بمستودع GitHub أو GitLab خاص).

  </Accordion>
</AccordionGroup>

## ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
