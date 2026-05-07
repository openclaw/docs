---
read_when:
    - إضافة ترحيلات doctor أو تعديلها
    - إدخال تغييرات كاسرة في التكوين
sidebarTitle: Doctor
summary: 'أمر Doctor: فحوصات الصحة، وترحيلات الإعدادات، وخطوات الإصلاح'
title: التشخيص
x-i18n:
    generated_at: "2026-05-07T01:52:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: d76a31a8f2197e226894f90fb534f53acf969b75ca1dfdf438a26059880e7ab2
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` هو أداة الإصلاح والترحيل في OpenClaw. تصلح الإعدادات/الحالة القديمة، وتتحقق من السلامة، وتوفر خطوات إصلاح قابلة للتنفيذ.

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

    اقبل القيم الافتراضية دون مطالبة (بما في ذلك خطوات إصلاح إعادة التشغيل/الخدمة/وضع الحماية عند الاقتضاء).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    طبّق الإصلاحات الموصى بها دون مطالبة (الإصلاحات + إعادة التشغيل عندما يكون ذلك آمناً).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    طبّق الإصلاحات القوية أيضاً (يستبدل إعدادات المشرف المخصصة).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    شغّل دون مطالبات وطبّق عمليات الترحيل الآمنة فقط (تطبيع الإعدادات + نقل الحالة على القرص). يتخطى إجراءات إعادة التشغيل/الخدمة/وضع الحماية التي تتطلب تأكيداً بشرياً. تعمل عمليات ترحيل الحالة القديمة تلقائياً عند اكتشافها.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    افحص خدمات النظام بحثاً عن تثبيتات gateway إضافية (launchd/systemd/schtasks).

  </Tab>
</Tabs>

إذا أردت مراجعة التغييرات قبل الكتابة، فافتح ملف الإعدادات أولاً:

```bash
cat ~/.openclaw/openclaw.json
```

## ما الذي يفعله (ملخص)

<AccordionGroup>
  <Accordion title="السلامة، وواجهة المستخدم، والتحديثات">
    - تحديث اختياري قبل التشغيل لتثبيتات git (تفاعلي فقط).
    - فحص حداثة بروتوكول واجهة المستخدم (يعيد بناء Control UI عندما يكون مخطط البروتوكول أحدث).
    - فحص السلامة + مطالبة بإعادة التشغيل.
    - ملخص حالة Skills (مؤهلة/مفقودة/محظورة) وحالة plugin.

  </Accordion>
  <Accordion title="الإعدادات وعمليات الترحيل">
    - تطبيع الإعدادات للقيم القديمة.
    - ترحيل إعداد Talk من حقول `talk.*` المسطحة القديمة إلى `talk.provider` + `talk.providers.<provider>`.
    - فحوصات ترحيل المتصفح لإعدادات إضافة Chrome القديمة وجاهزية Chrome MCP.
    - تحذيرات تجاوز مزود OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - تحذيرات حجب Codex OAuth (`models.providers.openai-codex`).
    - فحص متطلبات OAuth TLS الأساسية لملفات تعريف OpenAI Codex OAuth.
    - تحذيرات قائمة السماح للـ plugin/الأداة عندما تكون `plugins.allow` مقيّدة لكن سياسة الأدوات لا تزال تطلب أدوات wildcard أو أدوات مملوكة لـ plugin.
    - ترحيل الحالة القديمة على القرص (الجلسات/دليل agent/مصادقة WhatsApp).
    - ترحيل مفاتيح عقد بيان plugin القديم (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - ترحيل مخزن Cron القديم (`jobId`, `schedule.cron`, حقول delivery/payload في المستوى الأعلى، `provider` في payload، مهام fallback بسيطة لـ webhook مع `notify: true`).
    - ترحيل سياسة تشغيل agent القديمة إلى `agents.defaults.agentRuntime` و`agents.list[].agentRuntime`.
    - تنظيف إعدادات plugin القديمة عندما تكون plugins مفعلة؛ عندما تكون `plugins.enabled=false`، تُعامل مراجع plugin القديمة كإعدادات احتواء خاملة وتُحفظ.

  </Accordion>
  <Accordion title="الحالة والسلامة البنيوية">
    - فحص ملفات قفل الجلسات وتنظيف الأقفال القديمة.
    - إصلاح نصوص الجلسات لفروع إعادة كتابة المطالبات المكررة التي أنشأتها إصدارات 2026.4.24 المتأثرة.
    - اكتشاف علامات tombstone لاسترداد إعادة تشغيل subagent العالق، مع دعم `--fix` لمسح علامات الاسترداد المُجهَضة القديمة حتى لا يستمر بدء التشغيل في التعامل مع الابن على أنه أُجهِضت إعادة تشغيله.
    - فحوصات سلامة الحالة والأذونات (الجلسات، النصوص، دليل الحالة).
    - فحوصات أذونات ملف الإعدادات (chmod 600) عند التشغيل محلياً.
    - سلامة مصادقة النموذج: يفحص انتهاء صلاحية OAuth، ويمكنه تحديث الرموز التي توشك على الانتهاء، ويبلغ عن حالات cooldown/disabled لملف تعريف المصادقة.
    - اكتشاف دليل مساحة عمل إضافي (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway، والخدمات، والمشرفون">
    - إصلاح صورة وضع الحماية عند تفعيل وضع الحماية.
    - ترحيل الخدمة القديمة واكتشاف gateway إضافي.
    - ترحيل حالة قناة Matrix القديمة (في وضع `--fix` / `--repair`).
    - فحوصات تشغيل Gateway (الخدمة مثبتة لكنها لا تعمل؛ تسمية launchd مخزنة مؤقتاً).
    - تحذيرات حالة القنوات (يتم فحصها من Gateway قيد التشغيل).
    - فحوصات استجابة WhatsApp عند تدهور سلامة حلقة أحداث Gateway مع استمرار عمل عملاء TUI المحليين؛ يوقف `--fix` فقط عملاء TUI المحليين المتحقق منهم.
    - إصلاح مسار Codex لمراجع نماذج `openai-codex/*` القديمة في النماذج الأساسية، والبدائل، وتجاوزات heartbeat/subagent/compaction، والخطافات، وتجاوزات نموذج القناة، وتثبيتات مسار الجلسة؛ يعيد `--fix` كتابتها إلى `openai/*` ويحدد `agentRuntime.id: "codex"` فقط عندما يكون Codex plugin مثبتاً ومفعلاً، ويساهم بحاضنة `codex`، ولديه OAuth صالح للاستخدام. وإلا فيحدد `agentRuntime.id: "pi"`.
    - تدقيق إعدادات المشرف (launchd/systemd/schtasks) مع إصلاح اختياري.
    - تنظيف بيئة الوكيل المضمن لخدمات gateway التي التقطت قيم shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` أثناء التثبيت أو التحديث.
    - فحوصات أفضل ممارسات تشغيل Gateway (Node مقابل Bun، ومسارات مدير الإصدارات).
    - تشخيصات تعارض منفذ Gateway (الافتراضي `18789`).

  </Accordion>
  <Accordion title="المصادقة، والأمان، والاقتران">
    - تحذيرات أمنية لسياسات الرسائل المباشرة المفتوحة.
    - فحوصات مصادقة Gateway لوضع الرمز المحلي (يعرض إنشاء رمز عند عدم وجود مصدر رمز؛ لا يستبدل إعدادات token SecretRef).
    - اكتشاف مشاكل اقتران الأجهزة (طلبات اقتران أولية معلقة، ترقيات دور/نطاق معلقة، انحراف قديم في ذاكرة cache المحلية لرمز الجهاز، وانحراف مصادقة السجل المقترن).

  </Accordion>
  <Accordion title="مساحة العمل وshell">
    - فحص systemd linger على Linux.
    - فحص حجم ملف تمهيد مساحة العمل (تحذيرات الاقتطاع/الاقتراب من الحد لملفات السياق).
    - فحص جاهزية Skills للـ agent الافتراضي؛ يبلغ عن skills مسموح بها مع ثنائيات أو بيئة أو إعدادات أو متطلبات نظام تشغيل مفقودة، ويمكن لـ `--fix` تعطيل skills غير المتاحة في `skills.entries`.
    - فحص حالة إكمال shell والتثبيت/الترقية التلقائية.
    - فحص جاهزية مزود تضمين البحث في الذاكرة (نموذج محلي، مفتاح API بعيد، أو ثنائي QMD).
    - فحوصات التثبيت من المصدر (عدم تطابق مساحة عمل pnpm، أصول واجهة مستخدم مفقودة، ثنائي tsx مفقود).
    - يكتب الإعدادات المحدثة + بيانات معالج الإعداد الوصفية.

  </Accordion>
</AccordionGroup>

## تعبئة وإعادة ضبط واجهة Dreams

يتضمن مشهد Dreams في Control UI إجراءات **Backfill** و**Reset** و**Clear Grounded** لسير عمل dreaming المؤسس. تستخدم هذه الإجراءات أساليب RPC بأسلوب gateway doctor، لكنها **ليست** جزءاً من إصلاح/ترحيل CLI الخاص بـ `openclaw doctor`.

ما تفعله:

- تفحص **Backfill** ملفات `memory/YYYY-MM-DD.md` التاريخية في مساحة العمل النشطة، وتشغل تمريرة يوميات REM المؤسَسة، وتكتب إدخالات backfill قابلة للعكس في `DREAMS.md`.
- تزيل **Reset** فقط إدخالات يوميات backfill المعلّمة تلك من `DREAMS.md`.
- يزيل **Clear Grounded** فقط الإدخالات المرحلية قصيرة الأمد والمؤسسة فقط التي جاءت من إعادة تشغيل تاريخية ولم تجمع بعد استدعاءً حياً أو دعماً يومياً.

ما **لا** تفعله بذاتها:

- لا تعدّل `MEMORY.md`
- لا تشغل عمليات ترحيل doctor كاملة
- لا تضع تلقائياً المرشحين المؤسسين في مخزن الترقية القصير الأمد الحي إلا إذا شغّلت صراحة مسار CLI المرحلي أولاً

إذا أردت أن تؤثر إعادة التشغيل التاريخية المؤسسة في مسار الترقية العميق العادي، فاستخدم تدفق CLI بدلاً من ذلك:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

هذا يضع المرشحين المتينين المؤسسين في مخزن dreaming القصير الأمد مع إبقاء `DREAMS.md` كسطح للمراجعة.

## السلوك التفصيلي والمبررات

<AccordionGroup>
  <Accordion title="0. تحديث اختياري (تثبيتات git)">
    إذا كان هذا checkout من git وكان doctor يعمل تفاعلياً، فإنه يعرض التحديث (fetch/rebase/build) قبل تشغيل doctor.
  </Accordion>
  <Accordion title="1. تطبيع الإعدادات">
    إذا كانت الإعدادات تحتوي أشكال قيم قديمة (على سبيل المثال `messages.ackReaction` دون تجاوز خاص بالقناة)، فإن doctor يطبعها إلى المخطط الحالي.

    يشمل ذلك حقول Talk المسطحة القديمة. إعداد الكلام العام الحالي في Talk هو `talk.provider` + `talk.providers.<provider>`، وإعداد الصوت الفوري هو `talk.realtime.*`. يعيد Doctor كتابة أشكال `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` القديمة داخل خريطة المزود، ويعيد كتابة محددات realtime القديمة في المستوى الأعلى (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) إلى `talk.realtime`.

    يحذر Doctor أيضاً عندما تكون `plugins.allow` غير فارغة وتستخدم سياسة الأدوات
    إدخالات أدوات wildcard أو مملوكة لـ plugin. يطابق `tools.allow: ["*"]` فقط الأدوات
    من plugins التي تُحمّل فعلاً؛ ولا يتجاوز قائمة السماح الحصرية لـ plugin.
    يكتب Doctor `plugins.bundledDiscovery: "compat"` لإعدادات قائمة السماح
    القديمة المرحّلة للحفاظ على سلوك المزود المضمن الحالي، ثم
    يشير إلى إعداد `"allowlist"` الأكثر صرامة.

  </Accordion>
  <Accordion title="2. عمليات ترحيل مفاتيح الإعدادات القديمة">
    عندما تحتوي الإعدادات على مفاتيح مهملة، ترفض الأوامر الأخرى العمل وتطلب منك تشغيل `openclaw doctor`.

    سيقوم Doctor بما يلي:

    - شرح مفاتيح legacy التي تم العثور عليها.
    - عرض الترحيل الذي طبقه.
    - إعادة كتابة `~/.openclaw/openclaw.json` بالمخطط المحدث.

    يرفض بدء تشغيل Gateway تنسيقات الإعدادات القديمة ويطلب منك تشغيل `openclaw doctor --fix`؛ ولا يعيد كتابة `openclaw.json` عند بدء التشغيل. تُعالج عمليات ترحيل مخزن وظائف Cron أيضاً بواسطة `openclaw doctor --fix`.

    عمليات الترحيل الحالية:

    - `routing.allowFrom` ← `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` ← `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` ← `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` ← `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` ← `channels.telegram.groups."*".requireMention`
    - إعدادات القنوات المضبوطة التي تفتقد سياسة الرد المرئي ← `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` ← `messages.queue`
    - `routing.bindings` ← `bindings` على المستوى الأعلى
    - `routing.agents`/`routing.defaultAgentId` ← `agents.list` + `agents.list[].default`
    - إعدادات `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` القديمة ← `talk.provider` + `talk.providers.<provider>`
    - محددات Talk الفورية القديمة على المستوى الأعلى (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` ← `talk.realtime`
    - `routing.agentToAgent` ← `tools.agentToAgent`
    - `routing.transcribeAudio` ← `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) ← `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` و`messages.tts.providers.edge` ← `messages.tts.provider: "microsoft"` و`messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) ← `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) ← `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) ← `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` و`plugins.entries.voice-call.config.tts.providers.edge` ← `provider: "microsoft"` و`providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` ← `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` ← `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` ← `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` ← `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` ← `bindings[].match.accountId`
    - بالنسبة إلى القنوات التي تحتوي على `accounts` مسماة مع بقاء قيم قناة على المستوى الأعلى لحساب واحد، انقل تلك القيم ذات نطاق الحساب إلى الحساب المرقى المختار لتلك القناة (`accounts.default` لمعظم القنوات؛ يمكن لـ Matrix الاحتفاظ بهدف مسمى/افتراضي مطابق موجود)
    - `identity` ← `agents.list[].identity`
    - `agent.*` ← `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` ← `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - أزل `agents.defaults.llm`؛ استخدم `models.providers.<id>.timeoutSeconds` لمهل مزودي/نماذج الخدمة البطيئة
    - `browser.ssrfPolicy.allowPrivateNetwork` ← `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` ← `"existing-session"`
    - أزل `browser.relayBindHost` (إعداد ترحيل Plugin قديم)
    - `models.providers.*.api: "openai"` القديم ← `"openai-completions"` (يتخطى بدء Gateway أيضا المزودين الذين تم تعيين `api` لديهم إلى قيمة تعداد مستقبلية أو غير معروفة بدلا من الفشل المغلق)

    تتضمن تحذيرات Doctor أيضا إرشادات الحساب الافتراضي للقنوات متعددة الحسابات:

    - إذا تم ضبط إدخالين أو أكثر من إدخالات `channels.<channel>.accounts` من دون `channels.<channel>.defaultAccount` أو `accounts.default`، يحذر Doctor من أن توجيه الرجوع قد يختار حسابا غير متوقع.
    - إذا تم تعيين `channels.<channel>.defaultAccount` إلى معرف حساب غير معروف، يحذر Doctor ويسرد معرفات الحسابات المضبوطة.

  </Accordion>
  <Accordion title="2b. تجاوزات مزود OpenCode">
    إذا أضفت `models.providers.opencode` أو `opencode-zen` أو `opencode-go` يدويا، فإن ذلك يتجاوز كتالوج OpenCode المدمج من `@mariozechner/pi-ai`. يمكن أن يجبر ذلك النماذج على استخدام API خاطئ أو يصفر التكاليف. يحذرك Doctor حتى تتمكن من إزالة التجاوز واستعادة توجيه API والتكاليف لكل نموذج.
  </Accordion>
  <Accordion title="2c. ترحيل المتصفح وجاهزية Chrome MCP">
    إذا كان إعداد المتصفح لديك لا يزال يشير إلى مسار إضافة Chrome التي أزيلت، فإن Doctor يطبعها إلى نموذج إرفاق Chrome MCP المحلي للمضيف الحالي:

    - `browser.profiles.*.driver: "extension"` يصبح `"existing-session"`
    - تتم إزالة `browser.relayBindHost`

    يراجع Doctor أيضا مسار Chrome MCP المحلي للمضيف عند استخدام `defaultProfile: "user"` أو ملف تعريف `existing-session` مضبوط:

    - يتحقق مما إذا كان Google Chrome مثبتا على المضيف نفسه لملفات التعريف الافتراضية ذات الاتصال التلقائي
    - يتحقق من إصدار Chrome المكتشف ويحذر عندما يكون أقل من Chrome 144
    - يذكرك بتمكين التصحيح عن بعد في صفحة فحص المتصفح (على سبيل المثال `chrome://inspect/#remote-debugging` أو `brave://inspect/#remote-debugging` أو `edge://inspect/#remote-debugging`)

    لا يستطيع Doctor تمكين الإعداد الخاص بجهة Chrome نيابة عنك. لا يزال Chrome MCP المحلي للمضيف يتطلب:

    - متصفحا مبنيا على Chromium بإصدار 144+ على مضيف Gateway/Node
    - تشغيل المتصفح محليا
    - تمكين التصحيح عن بعد في ذلك المتصفح
    - الموافقة على مطالبة موافقة الإرفاق الأولى في المتصفح

    تتعلق الجاهزية هنا فقط بمتطلبات الإرفاق المحلي. يحافظ Existing-session على حدود مسار Chrome MCP الحالية؛ ولا تزال المسارات المتقدمة مثل `responsebody` وتصدير PDF واعتراض التنزيل والإجراءات الدفعية تتطلب متصفحا مدارًا أو ملف تعريف CDP خاما.

    لا ينطبق هذا الفحص **على** Docker أو sandbox أو remote-browser أو تدفقات headless الأخرى. تواصل هذه استخدام CDP الخام.

  </Accordion>
  <Accordion title="2d. متطلبات OAuth TLS الأساسية">
    عند ضبط ملف تعريف OpenAI Codex OAuth، يختبر Doctor نقطة نهاية تفويض OpenAI للتحقق من أن مكدس TLS المحلي في Node/OpenSSL يمكنه التحقق من سلسلة الشهادات. إذا فشل الاختبار بسبب خطأ في الشهادة (على سبيل المثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` أو شهادة منتهية الصلاحية أو شهادة موقعة ذاتيا)، يطبع Doctor إرشادات إصلاح خاصة بالمنصة. على macOS مع Node من Homebrew، يكون الإصلاح عادة `brew postinstall ca-certificates`. مع `--deep`، يعمل الاختبار حتى إذا كان Gateway سليما.
  </Accordion>
  <Accordion title="2e. تجاوزات مزود Codex OAuth">
    إذا كنت قد أضفت سابقا إعدادات نقل OpenAI القديمة ضمن `models.providers.openai-codex`، فقد تحجب مسار مزود Codex OAuth المدمج الذي تستخدمه الإصدارات الأحدث تلقائيا. يحذر Doctor عند رؤية إعدادات النقل القديمة تلك بجانب Codex OAuth حتى تتمكن من إزالة تجاوز النقل القديم أو إعادة كتابته واستعادة سلوك التوجيه/الرجوع المدمج. لا تزال الوكلاء المخصصة والتجاوزات الخاصة بالترويسات فقط مدعومة ولا تؤدي إلى هذا التحذير.
  </Accordion>
  <Accordion title="2f. إصلاح مسار Codex">
    يفحص Doctor مراجع النماذج القديمة `openai-codex/*`. يستخدم توجيه عدة Codex الأصلية مراجع نماذج `openai/*` القياسية بالإضافة إلى `agentRuntime.id: "codex"` حتى تمر الدورة عبر عدة خادم تطبيق Codex بدلا من مسار OpenClaw PI OpenAI.

    في وضع `--fix` / `--repair`، يعيد Doctor كتابة مراجع الوكيل الافتراضي والمراجع الخاصة بكل وكيل المتأثرة، بما في ذلك النماذج الأساسية والرجوعات وتجاوزات Heartbeat/subagent/Compaction والخطافات وتجاوزات نماذج القنوات وحالة مسار الجلسة المستمرة القديمة:

    - يصبح `openai-codex/gpt-*` ‏`openai/gpt-*`.
    - يصبح وقت تشغيل الوكيل المطابق `agentRuntime.id: "codex"` فقط عندما يكون Codex مثبتا وممكنا ويساهم بعدة `codex` ولديه OAuth قابل للاستخدام.
    - بخلاف ذلك يصبح وقت تشغيل الوكيل المطابق `agentRuntime.id: "pi"`.
    - يتم الحفاظ على قوائم رجوع النماذج الحالية مع إعادة كتابة إدخالاتها القديمة؛ وتنتقل الإعدادات المنسوخة لكل نموذج من المفتاح القديم إلى مفتاح `openai/*` القياسي.
    - يتم إصلاح `modelProvider`/`providerOverride` و`model`/`modelOverride` وإشعارات الرجوع وتثبيتات ملفات تعريف المصادقة وتثبيتات عدة Codex في الجلسات المستمرة عبر جميع مخازن جلسات الوكلاء المكتشفة.
    - تعني `/codex ...` "التحكم في محادثة Codex أصلية أو ربطها من الدردشة."
    - تعني `/acp ...` أو `runtime: "acp"` "استخدام محول ACP/acpx الخارجي."

  </Accordion>
  <Accordion title="2g. تنظيف مسار الجلسة">
    يفحص Doctor أيضا مخازن جلسات الوكلاء المكتشفة بحثا عن حالة مسار قديمة منشأة تلقائيا بعد نقل النماذج أو وقت التشغيل المضبوط بعيدا عن مسار مملوك لـ Plugin مثل Codex.

    يمكن لـ `openclaw doctor --fix` مسح الحالة القديمة المنشأة تلقائيا مثل تثبيتات النماذج `modelOverrideSource: "auto"` وبيانات تعريف نموذج وقت التشغيل ومعرفات العدة المثبتة وارتباطات جلسة CLI وتجاوزات ملفات تعريف المصادقة التلقائية عندما لا يعود مسارها المالك مضبوطا. يتم الإبلاغ عن اختيارات نموذج الجلسة الصريحة للمستخدم أو القديمة للمراجعة اليدوية وتترك دون تغيير؛ بدّلها باستخدام `/model ...` أو `/new` أو أعد تعيين الجلسة عندما لا يكون ذلك المسار مقصودا بعد الآن.

  </Accordion>
  <Accordion title="3. ترحيلات الحالة القديمة (تخطيط القرص)">
    يستطيع Doctor ترحيل التخطيطات القديمة على القرص إلى البنية الحالية:

    - مخزن الجلسات والنصوص:
      - من `~/.openclaw/sessions/` إلى `~/.openclaw/agents/<agentId>/sessions/`
    - مجلد الوكيل:
      - من `~/.openclaw/agent/` إلى `~/.openclaw/agents/<agentId>/agent/`
    - حالة مصادقة WhatsApp (Baileys):
      - من `~/.openclaw/credentials/*.json` القديمة (باستثناء `oauth.json`)
      - إلى `~/.openclaw/credentials/whatsapp/<accountId>/...` (معرف الحساب الافتراضي: `default`)

    هذه الترحيلات تبذل أفضل جهد وهي idempotent؛ سيصدر Doctor تحذيرات عندما يترك أي مجلدات قديمة كنسخ احتياطية. يقوم Gateway/CLI أيضا بترحيل الجلسات القديمة ومجلد الوكيل تلقائيا عند بدء التشغيل حتى تستقر المحفوظات/المصادقة/النماذج في المسار الخاص بكل وكيل من دون تشغيل Doctor يدويا. يتم ترحيل مصادقة WhatsApp عمدا عبر `openclaw doctor` فقط. تقارن تسوية مزود/خريطة مزودي Talk الآن بالمساواة البنيوية، لذلك لم تعد الفروقات الناتجة عن ترتيب المفاتيح فقط تؤدي إلى تغييرات `doctor --fix` متكررة بلا أثر.

  </Accordion>
  <Accordion title="3a. ترحيلات ملفات بيان Plugin القديمة">
    يفحص Doctor جميع ملفات بيان Plugins المثبتة بحثا عن مفاتيح قدرات مهملة على المستوى الأعلى (`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders`). عند العثور عليها، يعرض نقلها إلى كائن `contracts` وإعادة كتابة ملف البيان في موضعه. هذا الترحيل idempotent؛ إذا كان مفتاح `contracts` يحتوي بالفعل على القيم نفسها، تتم إزالة المفتاح القديم من دون تكرار البيانات.
  </Accordion>
  <Accordion title="3b. ترحيلات مخزن Cron القديمة">
    يتحقق Doctor أيضا من مخزن مهام Cron (`~/.openclaw/cron/jobs.json` افتراضيا، أو `cron.store` عند تجاوزه) بحثا عن أشكال مهام قديمة لا يزال المجدول يقبلها للتوافق.

    تشمل تنظيفات Cron الحالية:

    - `jobId` ← `id`
    - `schedule.cron` ← `schedule.expr`
    - حقول الحمولة على المستوى الأعلى (`message`، `model`، `thinking`، ...) ← `payload`
    - حقول التسليم على المستوى الأعلى (`deliver`، `channel`، `to`، `provider`، ...) ← `delivery`
    - ألقاب تسليم `provider` في الحمولة ← `delivery.channel` صريح
    - قيم حارسة غير صالحة مستمرة في Cron `payload.model` (`"default"`، `"null"`، سلاسل فارغة، JSON `null`) ← إزالة تجاوز النموذج
    - مهام رجوع webhook القديمة البسيطة `notify: true` ← `delivery.mode="webhook"` صريح مع `delivery.to=cron.webhook`

    لا يُجري Doctor ترحيلاً تلقائياً لوظائف `notify: true` إلا عندما يمكنه فعل ذلك من دون تغيير السلوك. إذا كانت وظيفة تجمع بين أسلوب notify الاحتياطي القديم ووضع تسليم موجود غير Webhook، يصدر Doctor تحذيراً ويترك تلك الوظيفة للمراجعة اليدوية.

    على Linux، يصدر Doctor أيضاً تحذيراً عندما لا يزال crontab الخاص بالمستخدم يستدعي `~/.openclaw/bin/ensure-whatsapp.sh` القديم. هذا السكربت المحلي للمضيف لا يصونه OpenClaw الحالي، ويمكنه كتابة رسائل `Gateway inactive` خاطئة إلى `~/.openclaw/logs/whatsapp-health.log` عندما يتعذر على cron الوصول إلى ناقل مستخدم systemd. أزل إدخال crontab القديم باستخدام `crontab -e`؛ واستخدم `openclaw channels status --probe` و`openclaw doctor` و`openclaw gateway status` لفحوصات السلامة الحالية.

  </Accordion>
  <Accordion title="3c. تنظيف قفل الجلسة">
    يفحص Doctor كل دليل جلسة وكيل بحثاً عن ملفات قفل كتابة قديمة — وهي ملفات تُترك عندما تنتهي جلسة بشكل غير طبيعي. لكل ملف قفل يعثر عليه، يعرض: المسار، وPID، وما إذا كان PID لا يزال حياً، وعمر القفل، وما إذا كان يُعد قديماً (PID ميت أو أقدم من 30 دقيقة). في وضع `--fix` / `--repair` يزيل ملفات القفل القديمة تلقائياً؛ وإلا فيطبع ملاحظة ويوجهك إلى إعادة التشغيل باستخدام `--fix`.
  </Accordion>
  <Accordion title="3d. إصلاح فرع نص جلسة المحادثة">
    يفحص Doctor ملفات JSONL لجلسات الوكيل بحثاً عن شكل الفرع المكرر الذي أنشأه خطأ إعادة كتابة نص المطالبة في 2026.4.24: دور مستخدم مهجور يتضمن سياق تشغيل داخلي من OpenClaw مع فرع شقيق نشط يحتوي على مطالبة المستخدم المرئية نفسها. في وضع `--fix` / `--repair`، ينسخ Doctor احتياطياً كل ملف متأثر بجانب الأصل ويعيد كتابة نص المحادثة إلى الفرع النشط، بحيث لا يرى سجل Gateway وقراء الذاكرة أدواراً مكررة بعد الآن.
  </Accordion>
  <Accordion title="4. فحوصات سلامة الحالة (استمرارية الجلسة، والتوجيه، والسلامة)">
    دليل الحالة هو جذع الدماغ التشغيلي. إذا اختفى، فستفقد الجلسات وبيانات الاعتماد والسجلات والإعدادات (إلا إذا كانت لديك نسخ احتياطية في مكان آخر).

    يتحقق Doctor من:

    - **دليل الحالة مفقود**: يحذر من فقدان كارثي للحالة، ويطلب إعادة إنشاء الدليل، ويذكرك بأنه لا يستطيع استرداد البيانات المفقودة.
    - **أذونات دليل الحالة**: يتحقق من قابلية الكتابة؛ ويعرض إصلاح الأذونات (ويصدر تلميح `chown` عند اكتشاف عدم تطابق المالك/المجموعة).
    - **دليل حالة متزامن سحابياً على macOS**: يحذر عندما تُحل الحالة ضمن iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) أو `~/Library/CloudStorage/...` لأن المسارات المدعومة بالمزامنة قد تسبب إدخال/إخراج أبطأ وسباقات قفل/مزامنة.
    - **دليل حالة على SD أو eMMC في Linux**: يحذر عندما تُحل الحالة إلى مصدر تثبيت `mmcblk*`، لأن الإدخال/الإخراج العشوائي المدعوم ببطاقات SD أو eMMC قد يكون أبطأ ويتآكل أسرع تحت كتابات الجلسات وبيانات الاعتماد.
    - **أدلة الجلسات مفقودة**: يلزم وجود `sessions/` ودليل مخزن الجلسات لاستمرار السجل وتجنب أعطال `ENOENT`.
    - **عدم تطابق نص المحادثة**: يحذر عندما تكون إدخالات الجلسات الحديثة تفتقد ملفات نص المحادثة.
    - **الجلسة الرئيسية "JSONL من سطر واحد"**: يضع علامة عندما يحتوي نص المحادثة الرئيسي على سطر واحد فقط (السجل لا يتراكم).
    - **أدلة حالة متعددة**: يحذر عندما توجد عدة مجلدات `~/.openclaw` عبر أدلة المنزل أو عندما يشير `OPENCLAW_STATE_DIR` إلى مكان آخر (يمكن أن ينقسم السجل بين التثبيتات).
    - **تذكير الوضع البعيد**: إذا كان `gateway.mode=remote`، يذكرك Doctor بتشغيله على المضيف البعيد (الحالة موجودة هناك).
    - **أذونات ملف الإعدادات**: يحذر إذا كان `~/.openclaw/openclaw.json` قابلاً للقراءة من المجموعة/العالم، ويعرض تضييق الأذونات إلى `600`.

  </Accordion>
  <Accordion title="5. سلامة مصادقة النموذج (انتهاء OAuth)">
    يفحص Doctor ملفات تعريف OAuth في مخزن المصادقة، ويحذر عندما تكون الرموز على وشك الانتهاء/منتهية، ويمكنه تحديثها عندما يكون ذلك آمناً. إذا كان ملف تعريف Anthropic OAuth/الرمز قديماً، يقترح مفتاح Anthropic API أو مسار رمز إعداد Anthropic. لا تظهر مطالبات التحديث إلا عند التشغيل تفاعلياً (TTY)؛ ويتخطى `--non-interactive` محاولات التحديث.

    عندما يفشل تحديث OAuth فشلاً دائماً (على سبيل المثال `refresh_token_reused` أو `invalid_grant` أو مزود يطلب منك تسجيل الدخول مرة أخرى)، يبلّغ Doctor بأن إعادة المصادقة مطلوبة ويطبع أمر `openclaw models auth login --provider ...` الدقيق المطلوب تشغيله.

    يبلّغ Doctor أيضاً عن ملفات تعريف المصادقة غير القابلة للاستخدام مؤقتاً بسبب:

    - فترات تهدئة قصيرة (حدود المعدل/المهل/إخفاقات المصادقة)
    - تعطيلات أطول (إخفاقات الفوترة/الرصيد)

  </Accordion>
  <Accordion title="6. التحقق من نموذج الخطاطيف">
    إذا عُيّن `hooks.gmail.model`، يتحقق Doctor من مرجع النموذج مقابل الفهرس وقائمة السماح، ويحذر عندما لا يمكن حله أو يكون غير مسموح به.
  </Accordion>
  <Accordion title="7. إصلاح صورة Sandbox">
    عندما يكون sandboxing مفعلاً، يتحقق Doctor من صور Docker ويعرض بناءها أو التبديل إلى الأسماء القديمة إذا كانت الصورة الحالية مفقودة.
  </Accordion>
  <Accordion title="7b. تنظيف تثبيت Plugin">
    يزيل Doctor حالة تجهيز تبعيات Plugin القديمة التي أنشأها OpenClaw في وضع `openclaw doctor --fix` / `openclaw doctor --repair`. يغطي ذلك جذور التبعيات المولدة القديمة، وأدلة مراحل التثبيت القديمة، ومخلفات الحزم المحلية من كود إصلاح تبعيات Plugin المضمنة السابق، ونسخ npm المُدارة اليتيمة أو المستعادة من Plugins `@openclaw/*` المضمنة التي يمكنها حجب البيان المضمن الحالي.

    يمكن لـ Doctor أيضاً إعادة تثبيت Plugins القابلة للتنزيل المفقودة عندما تشير الإعدادات إليها لكن سجل Plugin المحلي لا يستطيع العثور عليها. تشمل الأمثلة `plugins.entries` المادية، وإعدادات القناة/المزود/البحث المهيأة، وبيئات تشغيل الوكلاء المهيأة. أثناء تحديثات الحزم، يتجنب Doctor تشغيل إصلاح Plugin عبر مدير الحزم أثناء تبديل الحزمة الأساسية؛ شغّل `openclaw doctor --fix` مرة أخرى بعد التحديث إذا كان Plugin مهيأ لا يزال يحتاج إلى استرداد. لا يشغّل بدء Gateway وإعادة تحميل الإعدادات مديري الحزم؛ تظل تثبيتات Plugin عملاً صريحاً عبر doctor/install/update.

  </Accordion>
  <Accordion title="8. ترحيلات خدمة Gateway وتلميحات التنظيف">
    يكتشف Doctor خدمات Gateway القديمة (launchd/systemd/schtasks) ويعرض إزالتها وتثبيت خدمة OpenClaw باستخدام منفذ Gateway الحالي. يمكنه أيضاً فحص خدمات إضافية شبيهة بـ Gateway وطباعة تلميحات تنظيف. تُعد خدمات OpenClaw Gateway المسماة بالملف الشخصي خدمات من الدرجة الأولى ولا توسم بأنها "إضافية."

    على Linux، إذا كانت خدمة Gateway على مستوى المستخدم مفقودة لكن توجد خدمة OpenClaw Gateway على مستوى النظام، لا يثبت Doctor خدمة ثانية على مستوى المستخدم تلقائياً. افحص باستخدام `openclaw gateway status --deep` أو `openclaw doctor --deep`، ثم أزل النسخة المكررة أو عيّن `OPENCLAW_SERVICE_REPAIR_POLICY=external` عندما يكون مشرف نظام خارجي مالكاً لدورة حياة Gateway.

  </Accordion>
  <Accordion title="8b. ترحيل Matrix عند بدء التشغيل">
    عندما يكون لدى حساب قناة Matrix ترحيل حالة قديم معلق أو قابل للتنفيذ، ينشئ Doctor (في وضع `--fix` / `--repair`) لقطة ما قبل الترحيل ثم يشغّل خطوات الترحيل بأفضل جهد: ترحيل حالة Matrix القديمة وتحضير الحالة المشفرة القديمة. كلتا الخطوتين غير قاتلتين؛ تُسجل الأخطاء ويستمر بدء التشغيل. في وضع القراءة فقط (`openclaw doctor` من دون `--fix`) يُتخطى هذا الفحص بالكامل.
  </Accordion>
  <Accordion title="8c. إقران الجهاز وانحراف المصادقة">
    يفحص Doctor الآن حالة إقران الجهاز كجزء من تمرير السلامة العادي.

    ما يبلّغ عنه:

    - طلبات إقران أول مرة معلقة
    - ترقيات أدوار معلقة للأجهزة المقترنة بالفعل
    - ترقيات نطاق معلقة للأجهزة المقترنة بالفعل
    - إصلاحات عدم تطابق المفتاح العام حيث لا يزال معرّف الجهاز مطابقاً لكن هوية الجهاز لم تعد تطابق السجل المعتمد
    - سجلات مقترنة تفتقد رمزاً نشطاً لدور معتمد
    - رموز مقترنة انحرفت نطاقاتها خارج خط أساس الإقران المعتمد
    - إدخالات رمز جهاز مخزنة محلياً للجهاز الحالي تسبق تدوير رمز من جهة Gateway أو تحمل بيانات وصفية قديمة للنطاق

    لا يوافق Doctor تلقائياً على طلبات الإقران ولا يدوّر رموز الأجهزة تلقائياً. يطبع بدلاً من ذلك الخطوات التالية الدقيقة:

    - افحص الطلبات المعلقة باستخدام `openclaw devices list`
    - وافق على الطلب الدقيق باستخدام `openclaw devices approve <requestId>`
    - دوّر رمزاً جديداً باستخدام `openclaw devices rotate --device <deviceId> --role <role>`
    - أزل سجلاً قديماً وأعد الموافقة عليه باستخدام `openclaw devices remove <deviceId>`

    يغلق هذا الثغرة الشائعة "مقترن بالفعل لكن لا تزال تظهر ضرورة الإقران": يميز Doctor الآن بين الإقران لأول مرة وترقيات الدور/النطاق المعلقة وانحراف الرمز/هوية الجهاز القديم.

  </Accordion>
  <Accordion title="9. تحذيرات الأمان">
    يصدر Doctor تحذيرات عندما يكون مزود مفتوحاً للرسائل المباشرة من دون قائمة سماح، أو عندما تُهيأ سياسة بطريقة خطرة.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    إذا كان يعمل كخدمة مستخدم systemd، يضمن Doctor تفعيل lingering حتى يبقى Gateway حياً بعد تسجيل الخروج.
  </Accordion>
  <Accordion title="11. حالة مساحة العمل (Skills وPlugins والأدلة القديمة)">
    يطبع Doctor ملخصاً لحالة مساحة العمل للوكيل الافتراضي:

    - **حالة Skills**: يحصي المهارات المؤهلة، وناقصة المتطلبات، والمحجوبة بقائمة السماح.
    - **أدلة مساحة العمل القديمة**: يحذر عند وجود `~/openclaw` أو أدلة مساحة عمل قديمة أخرى إلى جانب مساحة العمل الحالية.
    - **حالة Plugin**: يحصي Plugins الممكنة/المعطلة/ذات الأخطاء؛ ويسرد معرفات Plugin لأي أخطاء؛ ويبلّغ عن قدرات Plugin الحزمة.
    - **تحذيرات توافق Plugin**: يضع علامة على Plugins التي لديها مشكلات توافق مع بيئة التشغيل الحالية.
    - **تشخيصات Plugin**: يعرض أي تحذيرات أو أخطاء وقت التحميل صادرة من سجل Plugin.

  </Accordion>
  <Accordion title="11b. حجم ملف التمهيد">
    يتحقق Doctor مما إذا كانت ملفات تمهيد مساحة العمل (على سبيل المثال `AGENTS.md` أو `CLAUDE.md` أو ملفات سياق محقونة أخرى) قريبة من ميزانية الأحرف المهيأة أو تتجاوزها. يبلّغ عن عدد الأحرف الخام مقابل المحقونة لكل ملف، ونسبة الاقتطاع، وسبب الاقتطاع (`max/file` أو `max/total`)، وإجمالي الأحرف المحقونة كنسبة من الميزانية الإجمالية. عندما تُقتطع الملفات أو تقترب من الحد، يطبع Doctor نصائح لضبط `agents.defaults.bootstrapMaxChars` و`agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. تنظيف Plugin قناة قديم">
    عندما يزيل `openclaw doctor --fix` Plugin قناة مفقوداً، فإنه يزيل أيضاً الإعدادات المتدلية محددة النطاق بالقناة التي أشارت إلى ذلك Plugin: إدخالات `channels.<id>`، وأهداف Heartbeat التي سمت القناة، وتجاوزات `agents.*.models["<channel>/*"]`. يمنع هذا حلقات تشغيل Gateway حيث اختفت بيئة تشغيل القناة لكن الإعدادات لا تزال تطلب من Gateway الارتباط بها.
  </Accordion>
  <Accordion title="11c. إكمال الصدفة">
    يتحقق Doctor مما إذا كان إكمال التبويب مثبتاً للصدفة الحالية (zsh أو bash أو fish أو PowerShell):

    - إذا كان ملف تعريف الصدفة يستخدم نمط إكمال ديناميكياً بطيئاً (`source <(openclaw completion ...)`)، يرقّيه Doctor إلى متغير الملف المخبأ الأسرع.
    - إذا كان الإكمال مهيأ في الملف الشخصي لكن ملف التخزين المؤقت مفقود، يعيد Doctor إنشاء التخزين المؤقت تلقائياً.
    - إذا لم يكن أي إكمال مهيأ على الإطلاق، يطالب Doctor بتثبيته (الوضع التفاعلي فقط؛ يُتخطى مع `--non-interactive`).

    شغّل `openclaw completion --write-state` لإعادة إنشاء التخزين المؤقت يدوياً.

  </Accordion>
  <Accordion title="12. فحوصات مصادقة Gateway (الرمز المحلي)">
    يتحقق Doctor من جاهزية مصادقة رمز Gateway المحلي.

    - إذا كان وضع الرمز يحتاج إلى رمز ولا يوجد مصدر رمز، يعرض Doctor إنشاء واحد.
    - إذا كان `gateway.auth.token` مداراً بواسطة SecretRef لكنه غير متاح، يحذر Doctor ولا يستبدله بنص صريح.
    - يفرض `openclaw doctor --generate-gateway-token` الإنشاء فقط عندما لا يكون SecretRef رمز مهيأً.

  </Accordion>
  <Accordion title="12b. إصلاحات مدركة لـ SecretRef للقراءة فقط">
    تحتاج بعض تدفقات الإصلاح إلى فحص بيانات الاعتماد المكوّنة دون إضعاف سلوك الفشل السريع في وقت التشغيل.

    - يستخدم `openclaw doctor --fix` الآن نموذج ملخص SecretRef للقراءة فقط نفسه الذي تستخدمه أوامر عائلة الحالة لإصلاحات الإعدادات المستهدفة.
    - مثال: يحاول إصلاح `allowFrom` / `groupAllowFrom` `@username` في Telegram استخدام بيانات اعتماد البوت المكوّنة عند توفرها.
    - إذا كان رمز بوت Telegram مكوّنا عبر SecretRef لكنه غير متاح في مسار الأمر الحالي، يبلّغ doctor بأن بيانات الاعتماد مكوّنة لكنها غير متاحة، ويتخطى الحل التلقائي بدلا من التعطل أو الإبلاغ خطأ بأن الرمز مفقود.

  </Accordion>
  <Accordion title="13. فحص صحة Gateway + إعادة التشغيل">
    يشغّل Doctor فحص صحة ويعرض إعادة تشغيل Gateway عندما يبدو غير سليم.
  </Accordion>
  <Accordion title="13b. جاهزية بحث الذاكرة">
    يتحقق Doctor مما إذا كان موفّر تضمينات بحث الذاكرة المكوّن جاهزا للوكيل الافتراضي. يعتمد السلوك على الخلفية والموفّر المكوّنين:

    - **خلفية QMD**: يفحص ما إذا كان الملف التنفيذي `qmd` متاحا وقابلا للبدء. إذا لم يكن كذلك، يطبع إرشادات الإصلاح بما في ذلك حزمة npm وخيار مسار ملف تنفيذي يدوي.
    - **موفّر محلي صريح**: يتحقق من وجود ملف نموذج محلي أو عنوان URL لنموذج بعيد/قابل للتنزيل معروف. إذا كان مفقودا، يقترح التبديل إلى موفّر بعيد.
    - **موفّر بعيد صريح** (`openai`، `voyage`، إلخ): يتحقق من وجود مفتاح API في البيئة أو مخزن المصادقة. يطبع تلميحات إصلاح قابلة للتنفيذ إذا كان مفقودا.
    - **موفّر تلقائي**: يتحقق أولا من توفر النموذج المحلي، ثم يجرّب كل موفّر بعيد حسب ترتيب الاختيار التلقائي.

    عندما تتوفر نتيجة فحص Gateway مخزّنة مؤقتا (كان Gateway سليما وقت الفحص)، يراجع doctor نتيجتها مع الإعدادات المرئية لـ CLI ويذكر أي اختلاف. لا يبدأ Doctor اختبار تضمين جديدا على المسار الافتراضي؛ استخدم أمر حالة الذاكرة العميق عندما تريد فحص موفّر مباشر.

    استخدم `openclaw memory status --deep` للتحقق من جاهزية التضمين في وقت التشغيل.

  </Accordion>
  <Accordion title="14. تحذيرات حالة القناة">
    إذا كان Gateway سليما، يشغّل doctor فحص حالة قناة ويبلّغ عن التحذيرات مع إصلاحات مقترحة.
  </Accordion>
  <Accordion title="15. تدقيق إعدادات المشرف + الإصلاح">
    يتحقق Doctor من إعدادات المشرف المثبتة (launchd/systemd/schtasks) بحثا عن القيم الافتراضية المفقودة أو القديمة (مثل تبعيات systemd network-online وتأخير إعادة التشغيل). عندما يجد عدم تطابق، يوصي بتحديث ويمكنه إعادة كتابة ملف الخدمة/المهمة إلى القيم الافتراضية الحالية.

    ملاحظات:

    - يطلب `openclaw doctor` التأكيد قبل إعادة كتابة إعدادات المشرف.
    - يقبل `openclaw doctor --yes` مطالبات الإصلاح الافتراضية.
    - يطبّق `openclaw doctor --repair` الإصلاحات الموصى بها دون مطالبات.
    - يستبدل `openclaw doctor --repair --force` إعدادات المشرف المخصصة.
    - يحافظ `OPENCLAW_SERVICE_REPAIR_POLICY=external` على doctor للقراءة فقط لدورة حياة خدمة Gateway. يظل يبلّغ عن صحة الخدمة ويشغّل الإصلاحات غير المتعلقة بالخدمة، لكنه يتخطى تثبيت/بدء/إعادة تشغيل/تهيئة الخدمة، وإعادة كتابة إعدادات المشرف، وتنظيف الخدمة القديمة، لأن مشرفا خارجيا يملك دورة الحياة تلك.
    - على Linux، لا يعيد doctor كتابة بيانات الأمر/نقطة الدخول الوصفية أثناء كون وحدة Gateway المطابقة في systemd نشطة. كما يتجاهل الوحدات الإضافية غير القديمة وغير النشطة الشبيهة بـ Gateway أثناء فحص الخدمات المكررة حتى لا تنشئ ملفات الخدمة المرافقة ضجيج تنظيف.
    - إذا كانت مصادقة الرمز تتطلب رمزا وكان `gateway.auth.token` مدارا بـ SecretRef، يتحقق تثبيت/إصلاح خدمة doctor من SecretRef لكنه لا يحفظ قيم الرمز النصية الصريحة المحلولة في بيانات بيئة خدمة المشرف الوصفية.
    - يكتشف Doctor قيم بيئة الخدمة المدارة المدعومة بـ `.env`/SecretRef التي ضمّنتها تثبيتات LaunchAgent أو systemd أو Windows Scheduled Task القديمة مضمنة، ويعيد كتابة بيانات الخدمة الوصفية كي تُحمّل تلك القيم من مصدر وقت التشغيل بدلا من تعريف المشرف.
    - يكتشف Doctor عندما يظل أمر الخدمة يثبت `--port` قديما بعد تغيّر `gateway.port` ويعيد كتابة بيانات الخدمة الوصفية إلى المنفذ الحالي.
    - إذا كانت مصادقة الرمز تتطلب رمزا وكان SecretRef المكوّن للرمز غير محلول، يحظر doctor مسار التثبيت/الإصلاح مع إرشادات قابلة للتنفيذ.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين وكان `gateway.auth.mode` غير مضبوط، يحظر doctor التثبيت/الإصلاح حتى يُضبط الوضع صراحة.
    - بالنسبة إلى وحدات Linux user-systemd، تشمل فحوصات انحراف رمز doctor الآن مصدري `Environment=` و`EnvironmentFile=` عند مقارنة بيانات مصادقة الخدمة الوصفية.
    - ترفض إصلاحات خدمة Doctor إعادة كتابة خدمة Gateway أو إيقافها أو إعادة تشغيلها من ملف OpenClaw تنفيذي أقدم عندما تكون الإعدادات قد كُتبت آخر مرة بواسطة إصدار أحدث. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - يمكنك دائما فرض إعادة كتابة كاملة عبر `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. وقت تشغيل Gateway + تشخيصات المنفذ">
    يفحص Doctor وقت تشغيل الخدمة (PID، آخر حالة خروج) ويحذر عندما تكون الخدمة مثبتة لكنها لا تعمل فعليا. كما يتحقق من تعارضات المنافذ على منفذ Gateway (الافتراضي `18789`) ويبلّغ عن الأسباب المحتملة (Gateway يعمل بالفعل، نفق SSH).
  </Accordion>
  <Accordion title="17. أفضل ممارسات وقت تشغيل Gateway">
    يحذر Doctor عندما تعمل خدمة Gateway على Bun أو مسار Node مدار بالإصدارات (`nvm`، `fnm`، `volta`، `asdf`، إلخ). تتطلب قنوات WhatsApp + Telegram استخدام Node، ويمكن أن تتعطل مسارات مديري الإصدارات بعد الترقيات لأن الخدمة لا تحمّل تهيئة الصدفة لديك. يعرض Doctor الترحيل إلى تثبيت Node للنظام عند توفره (Homebrew/apt/choco).

    تستخدم LaunchAgents المثبتة أو المُصلحة حديثا على macOS مسار PATH نظاميا قياسيا (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) بدلا من نسخ PATH الخاص بالصدفة التفاعلية، بحيث لا تغيّر مجلدات Volta وasdf وfnm وpnpm وغيرها من مديري الإصدارات أي عمليات Node فرعية يتم حلها. ما زالت خدمات Linux تحتفظ بجذور البيئة الصريحة (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) ومجلدات user-bin مستقرة، لكن مجلدات الرجوع الاحتياطية المخمّنة لمديري الإصدارات لا تُكتب إلى PATH الخدمة إلا عندما تكون تلك المجلدات موجودة على القرص.

  </Accordion>
  <Accordion title="18. كتابة الإعدادات + بيانات المعالج الوصفية">
    يحفظ Doctor أي تغييرات في الإعدادات ويختم بيانات المعالج الوصفية لتسجيل تشغيل doctor.
  </Accordion>
  <Accordion title="19. نصائح مساحة العمل (النسخ الاحتياطي + نظام الذاكرة)">
    يقترح Doctor نظام ذاكرة لمساحة العمل عند فقدانه ويطبع نصيحة نسخ احتياطي إذا لم تكن مساحة العمل ضمن git بالفعل.

    راجع [/concepts/agent-workspace](/ar/concepts/agent-workspace) للحصول على دليل كامل لبنية مساحة العمل والنسخ الاحتياطي عبر git (يوصى بـ GitHub أو GitLab خاص).

  </Accordion>
</AccordionGroup>

## ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
