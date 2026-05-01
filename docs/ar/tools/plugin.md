---
read_when:
    - تثبيت Plugins أو تكوينها
    - فهم قواعد اكتشاف Plugin وتحميله
    - العمل مع حزم Plugin المتوافقة مع Codex/Claude
sidebarTitle: Install and Configure
summary: ثبّت Plugins الخاصة بـ OpenClaw وتهيئتها وإدارتها
title: Plugins
x-i18n:
    generated_at: "2026-05-01T07:44:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69f876df0c2ed3ff356ada9462b56f2b5a65a662b64b328ecc97d8b463036934
    source_path: tools/plugin.md
    workflow: 16
---

توسّع Plugins إمكانات OpenClaw بإضافة قدرات جديدة: القنوات، ومزوّدو النماذج،
وحاضنات الوكلاء، والأدوات، وSkills، والكلام، والنسخ الفوري، والصوت الفوري،
وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب، والبحث في الويب،
والمزيد. بعض Plugins **أساسية** (تُشحن مع OpenClaw)، وأخرى
**خارجية**. تُنشر معظم Plugins الخارجية وتُكتشف عبر
[ClawHub](/ar/tools/clawhub). يظل npm مدعومًا للتثبيت المباشر ولمجموعة
مؤقتة من حزم Plugins المملوكة لـ OpenClaw إلى أن تكتمل تلك الهجرة.

## البدء السريع

<Steps>
  <Step title="اطّلع على ما تم تحميله">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="ثبّت Plugin">
    ```bash
    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="أعد تشغيل Gateway">
    ```bash
    openclaw gateway restart
    ```

    بعد ذلك، اضبط الإعدادات ضمن `plugins.entries.\<id\>.config` في ملف الإعدادات لديك.

  </Step>
</Steps>

إذا كنت تفضّل التحكم الأصلي داخل الدردشة، فعّل `commands.plugins: true` واستخدم:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

يستخدم مسار التثبيت محلّل الحزم نفسه الذي يستخدمه CLI: مسار/أرشيف محلي، أو
`clawhub:<pkg>` صريح، أو `npm:<pkg>` صريح، أو مواصفة حزمة مجردة (ClawHub أولًا، ثم
الرجوع إلى npm).

إذا كانت الإعدادات غير صالحة، يفشل التثبيت عادةً بإغلاق آمن ويوجّهك إلى
`openclaw doctor --fix`. استثناء الاسترداد الوحيد هو مسار ضيق لإعادة تثبيت
Plugin مضمّنة من أجل Plugins التي تختار
`openclaw.install.allowInvalidConfigRecovery`.
أثناء بدء تشغيل Gateway، تُعزل الإعدادات غير الصالحة الخاصة بـ Plugin واحدة إلى تلك Plugin:
تسجّل عملية بدء التشغيل مشكلة `plugins.entries.<id>.config`، وتتخطى تلك Plugin أثناء
التحميل، وتُبقي Plugins والقنوات الأخرى متصلة. شغّل `openclaw doctor --fix`
لعزل إعدادات Plugin السيئة عبر تعطيل إدخال تلك Plugin وإزالة حمولة إعداداتها
غير الصالحة؛ وتحافظ النسخة الاحتياطية العادية للإعدادات على القيم السابقة.
عندما تشير إعدادات قناة إلى Plugin لم تعد قابلة للاكتشاف بينما يبقى معرّف
Plugin القديم نفسه في إعدادات Plugins أو سجلات التثبيت، تسجّل عملية بدء تشغيل Gateway
تحذيرات وتتخطى تلك القناة بدلًا من حظر كل القنوات الأخرى.
شغّل `openclaw doctor --fix` لإزالة إدخالات القناة/Plugin القديمة؛ أما مفاتيح
القنوات غير المعروفة التي لا تحمل دليلًا على Plugin قديمة فتظل تفشل في التحقق
كي تبقى الأخطاء المطبعية ظاهرة.
إذا تم ضبط `plugins.enabled: false`، تُعامل مراجع Plugins القديمة كعناصر خاملة:
يتخطى بدء تشغيل Gateway عمل اكتشاف/تحميل Plugins، ويحافظ `openclaw doctor`
على إعدادات Plugins المعطّلة بدلًا من إزالتها تلقائيًا. أعد تفعيل Plugins قبل
تشغيل تنظيف doctor إذا أردت إزالة معرّفات Plugins القديمة.

لا تثبّت حزم OpenClaw المعبأة شجرة تبعيات وقت التشغيل لكل Plugin مضمّنة
بشكل استباقي. عندما تكون Plugin مملوكة لـ OpenClaw ومضمّنة نشطة من
إعدادات Plugins، أو إعدادات قناة قديمة، أو بيان مفعّل افتراضيًا، يُصلح بدء التشغيل
تبعيات وقت التشغيل المعلنة لتلك Plugin فقط قبل استيرادها.
لا تؤدي حالة مصادقة القناة المحفوظة وحدها إلى تفعيل قناة مضمّنة من أجل
إصلاح تبعيات وقت التشغيل عند بدء تشغيل Gateway.
يبقى التعطيل الصريح هو الحاسم: `plugins.entries.<id>.enabled: false`،
و`plugins.deny`، و`plugins.enabled: false`، و`channels.<id>.enabled: false`
تمنع الإصلاح التلقائي لتبعيات وقت التشغيل المضمّنة لتلك Plugin/القناة.
كما أن وجود `plugins.allow` غير فارغة يحدّ إصلاح تبعيات وقت التشغيل المضمّنة
المفعّلة افتراضيًا؛ ويمكن للتفعيل الصريح لقناة مضمّنة (`channels.<id>.enabled: true`)
أن يصلح تبعيات Plugin الخاصة بتلك القناة رغم ذلك.
يجب أن تظل Plugins الخارجية ومسارات التحميل المخصصة مثبتة عبر
`openclaw plugins install`.

## أنواع Plugins

يتعرّف OpenClaw على تنسيقين لـ Plugins:

| التنسيق     | كيفية عمله                                                       | أمثلة                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **أصلي** | `openclaw.plugin.json` + وحدة وقت تشغيل؛ يعمل داخل العملية       | Plugins الرسمية، وحزم npm المجتمعية               |
| **حزمة** | تخطيط متوافق مع Codex/Claude/Cursor؛ يُربط بميزات OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

يظهر كلاهما ضمن `openclaw plugins list`. راجع [حزم Plugins](/ar/plugins/bundles) لتفاصيل الحزم.

إذا كنت تكتب Plugin أصلية، فابدأ بـ [بناء Plugins](/ar/plugins/building-plugins)
و[نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

## نقاط دخول الحزم

يجب أن تعلن حزم npm الخاصة بـ Plugins الأصلية عن `openclaw.extensions` في `package.json`.
يجب أن يبقى كل إدخال داخل دليل الحزمة وأن يُحل إلى ملف وقت تشغيل قابل للقراءة،
أو إلى ملف مصدر TypeScript مع نظير JavaScript مبني مستنتج مثل
`src/index.ts` إلى `dist/index.js`.

استخدم `openclaw.runtimeExtensions` عندما لا تكون ملفات وقت التشغيل المنشورة في
المسارات نفسها مثل إدخالات المصدر. عند وجوده، يجب أن يحتوي `runtimeExtensions`
على إدخال واحد بالضبط لكل إدخال في `extensions`. تؤدي القوائم غير المتطابقة إلى فشل
التثبيت واكتشاف Plugin بدلًا من الرجوع بصمت إلى مسارات المصدر.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Plugins الرسمية

### حزم npm المملوكة لـ OpenClaw أثناء الهجرة

ClawHub هو مسار التوزيع الأساسي لمعظم Plugins. تتضمن إصدارات OpenClaw
المعبأة الحالية بالفعل العديد من Plugins الرسمية، لذلك لا تحتاج إلى تثبيتات npm
منفصلة في الإعدادات العادية. إلى أن تنتقل كل Plugin مملوكة لـ OpenClaw إلى
ClawHub، يظل OpenClaw يشحن بعض حزم Plugins بنمط `@openclaw/*` على
npm للتثبيتات الأقدم/المخصصة وتدفقات npm المباشرة.

إذا أبلغ npm أن حزمة Plugin بنمط `@openclaw/*` مهجورة، فهذا يعني أن إصدار الحزمة
من مسار حزم خارجي أقدم. استخدم Plugin المضمّنة من OpenClaw الحالي أو نسخة
محلية من المستودع إلى أن تُنشر حزمة npm أحدث.

| Plugin          | الحزمة                    | المستندات                                       |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/ar/channels/bluebubbles)       |
| Discord         | `@openclaw/discord`        | [Discord](/ar/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/ar/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/ar/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/ar/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/ar/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/ar/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/ar/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/ar/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/ar/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/ar/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/ar/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/ar/plugins/zalouser)         |

### الأساسية (تُشحن مع OpenClaw)

<AccordionGroup>
  <Accordion title="مزوّدو النماذج (مفعّلون افتراضيًا)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins الذاكرة">
    - `memory-core` — بحث ذاكرة مضمّن (افتراضي عبر `plugins.slots.memory`)
    - `memory-lancedb` — ذاكرة طويلة الأمد تُثبّت عند الطلب مع استدعاء/التقاط تلقائي (اضبط `plugins.slots.memory = "memory-lancedb"`)

    راجع [Memory LanceDB](/ar/plugins/memory-lancedb) لإعداد التضمين المتوافق مع OpenAI،
    وأمثلة Ollama، وحدود الاستدعاء، واستكشاف الأخطاء وإصلاحها.

  </Accordion>

  <Accordion title="مزوّدو الكلام (مفعّلون افتراضيًا)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="أخرى">
    - `browser` — Plugin متصفح مضمّنة لأداة المتصفح، وCLI الخاص بـ `openclaw browser`، وطريقة Gateway `browser.request`، ووقت تشغيل المتصفح، وخدمة التحكم الافتراضية في المتصفح (مفعّلة افتراضيًا؛ عطّلها قبل استبدالها)
    - `copilot-proxy` — جسر VS Code Copilot Proxy (معطّل افتراضيًا)

  </Accordion>
</AccordionGroup>

هل تبحث عن Plugins تابعة لأطراف ثالثة؟ راجع [Plugins المجتمع](/ar/plugins/community).

## الإعدادات

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| الحقل            | الوصف                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | مفتاح التفعيل الرئيسي (افتراضيًا: `true`)                           |
| `allow`          | قائمة السماح لـ Plugins (اختيارية)                               |
| `deny`           | قائمة الحظر لـ Plugins (اختيارية؛ الحظر هو الحاسم)                     |
| `load.paths`     | ملفات/أدلة Plugins إضافية                            |
| `slots`          | محددات خانات حصرية (مثل `memory`، و`contextEngine`) |
| `entries.\<id\>` | مفاتيح تفعيل + إعدادات لكل Plugin                               |

`plugins.allow` حصرية. عندما تكون غير فارغة، يمكن لـ Plugins المدرجة فقط أن تُحمّل
أو تعرض أدوات، حتى إذا كانت `tools.allow` تحتوي على `"*"` أو اسم أداة محدد
مملوك لـ Plugin. إذا أشارت قائمة سماح الأدوات إلى أدوات Plugins، فأضف معرّفات
Plugins المالكة إلى `plugins.allow` أو أزل `plugins.allow`؛ يحذّر `openclaw doctor`
من هذا الشكل.

تتطلب تغييرات الإعدادات **إعادة تشغيل Gateway**. إذا كان Gateway يعمل مع مراقبة
الإعدادات + إعادة التشغيل داخل العملية مفعّلتين (مسار `openclaw gateway` الافتراضي)،
فعادةً ما تُنفّذ إعادة التشغيل تلقائيًا بعد لحظات من كتابة الإعدادات.
لا يوجد مسار إعادة تحميل ساخنة مدعوم لكود وقت تشغيل Plugin الأصلية أو خطافات دورة الحياة؛
أعد تشغيل عملية Gateway التي تخدم القناة الحية قبل توقع تشغيل كود
`register(api)` المحدث، أو خطافات `api.on(...)`، أو الأدوات، أو الخدمات، أو
خطافات المزوّد/وقت التشغيل.

`openclaw plugins list` هي لقطة محلية لسجل/إعدادات Plugins. تعني Plugin
`enabled` هناك أن السجل المحفوظ والإعدادات الحالية يسمحان لـ Plugin بالمشاركة.
ولا يثبت ذلك أن عملية Gateway فرعية بعيدة قيد التشغيل قد أعادت التشغيل بالفعل
على كود Plugin نفسه. في إعدادات VPS/الحاويات ذات عمليات التغليف،
أرسل عمليات إعادة التشغيل إلى عملية `openclaw gateway run` الفعلية،
أو استخدم `openclaw gateway restart` ضد Gateway قيد التشغيل.

<Accordion title="حالات Plugin: معطّلة مقابل مفقودة مقابل غير صالحة">
  - **معطّلة**: Plugin موجودة لكن قواعد التفعيل أوقفتها. تُحفظ الإعدادات.
  - **مفقودة**: تشير الإعدادات إلى معرّف Plugin لم يعثر عليه الاكتشاف.
  - **غير صالحة**: Plugin موجودة لكن إعداداتها لا تطابق المخطط المعلن. يتخطى بدء تشغيل Gateway تلك Plugin فقط؛ يمكن لـ `openclaw doctor --fix` عزل الإدخال غير الصالح عبر تعطيله وإزالة حمولة إعداداته.

</Accordion>

## الاكتشاف والأسبقية

يفحص OpenClaw Plugins بهذا الترتيب (أول تطابق هو الحاسم):

<Steps>
  <Step title="مسارات التكوين">
    `plugins.load.paths` — مسارات ملفات أو أدلة صريحة. يتم تجاهل المسارات التي تشير
    عائدة إلى أدلة Plugins المجمعة الخاصة بحزمة OpenClaw؛
    شغّل `openclaw doctor --fix` لإزالة تلك الأسماء المستعارة القديمة.
  </Step>

  <Step title="Plugins مساحة العمل">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins العامة">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins المجمعة">
    تُشحن مع OpenClaw. يكون العديد منها مفعّلًا افتراضيًا (موفرو النماذج، والكلام).
    ويتطلب غيرها تفعيلًا صريحًا.
  </Step>
</Steps>

عادةً ما تحل عمليات التثبيت المعبأة وصور Docker Plugins المجمعة من شجرة
`dist/extensions` المترجمة. إذا تم ربط دليل مصدر Plugin مجمع فوق مسار المصدر
المعبأ المطابق، على سبيل المثال `/app/extensions/synology-chat`، فإن OpenClaw
يعامل دليل المصدر المركّب هذا كتراكب مصدر مجمع ويكتشفه قبل حزمة
`/app/dist/extensions/synology-chat` المعبأة. هذا يبقي حلقات حاويات الصيانة
عاملة دون إعادة كل Plugin مجمع إلى مصدر TypeScript. اضبط
`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` لفرض حزم التوزيع المعبأة حتى عند
وجود تركيبات تراكب المصدر.

### قواعد التفعيل

- يعطّل `plugins.enabled: false` جميع Plugins ويتخطى عمل اكتشاف/تحميل Plugins
- يتغلب `plugins.deny` دائمًا على السماح
- يعطّل `plugins.entries.\<id\>.enabled: false` ذلك Plugin
- تكون Plugins ذات منشأ مساحة العمل **معطّلة افتراضيًا** (يجب تفعيلها صراحةً)
- تتبع Plugins المجمعة مجموعة التشغيل الافتراضية المضمنة ما لم يتم تجاوزها
- يمكن للفتحات الحصرية فرض تفعيل Plugin المحدد لتلك الفتحة
- تُفعّل بعض Plugins المجمعة الاختيارية تلقائيًا عندما يسمّي التكوين سطحًا
  مملوكًا لـ Plugin، مثل مرجع نموذج موفّر، أو تكوين قناة، أو وقت تشغيل حزمة
  اختبار
- يُحافَظ على تكوين Plugin القديم أثناء نشاط `plugins.enabled: false`؛
  أعد تفعيل Plugins قبل تشغيل تنظيف الطبيب إذا كنت تريد إزالة المعرّفات القديمة
- تحتفظ مسارات Codex من عائلة OpenAI بحدود Plugin منفصلة:
  ينتمي `openai-codex/*` إلى Plugin الخاص بـ OpenAI، بينما يتم اختيار Plugin
  خادم تطبيق Codex المجمع بواسطة `agentRuntime.id: "codex"` أو مراجع النماذج
  القديمة `codex/*`

## استكشاف أخطاء خطافات وقت التشغيل وإصلاحها

إذا ظهر Plugin في `plugins list` لكن التأثيرات الجانبية أو الخطافات الخاصة بـ
`register(api)` لا تعمل في حركة الدردشة الحية، فتحقق أولًا مما يلي:

- شغّل `openclaw gateway status --deep --require-rpc` وتأكد من أن عنوان URL
  والملف الشخصي ومسار التكوين والعملية النشطة للـ Gateway هي التي تعدّلها.
- أعد تشغيل Gateway الحي بعد تغييرات تثبيت/تكوين/كود Plugin. في حاويات
  الغلاف، قد يكون PID 1 مجرد مشرف؛ أعد تشغيل عملية الطفل
  `openclaw gateway run` أو أرسل إشارة إليها.
- استخدم `openclaw plugins inspect <id> --json` لتأكيد تسجيلات الخطافات
  والتشخيصات. تحتاج خطافات المحادثة غير المجمعة مثل `llm_input` و
  `llm_output` و `before_agent_finalize` و `agent_end` إلى
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- لتبديل النماذج، فضّل `before_model_resolve`. يعمل قبل حل النموذج لدورات
  الوكيل؛ أما `llm_output` فلا يعمل إلا بعد أن تنتج محاولة نموذج مخرجات مساعد.
- لإثبات نموذج الجلسة الفعلي، استخدم `openclaw sessions` أو أسطح جلسة/حالة
  Gateway، وعند تصحيح حمولات الموفّر، ابدأ Gateway باستخدام
  `--raw-stream --raw-stream-path <path>`.

### ملكية قناة أو أداة مكررة

الأعراض:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

تعني هذه أن أكثر من Plugin مفعّل يحاول امتلاك القناة نفسها أو تدفق الإعداد
نفسه أو اسم الأداة نفسه. السبب الأكثر شيوعًا هو تثبيت Plugin قناة خارجي بجانب
Plugin مجمع أصبح يوفر الآن معرّف القناة نفسه.

خطوات التصحيح:

- شغّل `openclaw plugins list --enabled --verbose` لرؤية كل Plugin مفعّل
  ومنشئه.
- شغّل `openclaw plugins inspect <id> --json` لكل Plugin مشتبه به وقارن
  `channels` و `channelConfigs` و `tools` والتشخيصات.
- شغّل `openclaw plugins registry --refresh` بعد تثبيت حزم Plugins أو إزالتها
  حتى تعكس البيانات الوصفية المستمرة التثبيت الحالي.
- أعد تشغيل Gateway بعد تغييرات التثبيت أو السجل أو التكوين.

خيارات الإصلاح:

- إذا كان Plugin واحد يستبدل آخر عمدًا لمعرّف القناة نفسه، فيجب أن يصرّح
  Plugin المفضل بـ `channelConfigs.<channel-id>.preferOver` مع معرّف Plugin
  ذي الأولوية الأقل. راجع [/plugins/manifest#replacing-another-channel-plugin](/ar/plugins/manifest#replacing-another-channel-plugin).
- إذا كان التكرار عرضيًا، فعطّل أحد الجانبين باستخدام
  `plugins.entries.<plugin-id>.enabled: false` أو أزل تثبيت Plugin القديم.
- إذا فعّلت كلا Pluginين صراحةً، فإن OpenClaw يحتفظ بذلك الطلب ويبلغ عن
  التعارض. اختر مالكًا واحدًا للقناة أو أعد تسمية الأدوات المملوكة لـ Plugin
  بحيث يكون سطح وقت التشغيل غير ملتبس.

## فتحات Plugin (فئات حصرية)

بعض الفئات حصرية (نشط واحد فقط في كل مرة):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| الفتحة          | ما تتحكم به          | الافتراضي          |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin الذاكرة النشطة | `memory-core`       |
| `contextEngine` | محرك السياق النشط     | `legacy` (مدمج) |

## مرجع CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # deep detail
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install (ClawHub first, then npm)
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

تُشحن Plugins المجمعة مع OpenClaw. يكون العديد منها مفعّلًا افتراضيًا (على
سبيل المثال موفرو النماذج المجمعون، وموفرو الكلام المجمعون، وPlugin المتصفح
المجمع). لا تزال Plugins مجمعة أخرى تحتاج إلى `openclaw plugins enable <id>`.

يكتب `--force` فوق Plugin مثبت أو حزمة خطافات موجودة في موضعها. استخدم
`openclaw plugins update <id-or-npm-spec>` للترقيات الروتينية لـ Plugins
المتعقبة من npm. لا يُدعم مع `--link`، الذي يعيد استخدام مسار المصدر بدلًا من
النسخ فوق هدف تثبيت مُدار.

عندما يكون `plugins.allow` مضبوطًا بالفعل، يضيف `openclaw plugins install`
معرّف Plugin المثبت إلى قائمة السماح تلك قبل تفعيله. إذا كان معرّف Plugin نفسه
موجودًا في `plugins.deny`، فإن التثبيت يزيل إدخال الرفض القديم ذلك حتى يصبح
التثبيت الصريح قابلًا للتحميل فورًا بعد إعادة التشغيل.

يحتفظ OpenClaw بسجل Plugin محلي مستمر كنموذج قراءة باردة لجرد Plugins وملكية
المساهمات وتخطيط بدء التشغيل. تقوم تدفقات التثبيت والتحديث وإلغاء التثبيت
والتفعيل والتعطيل بتحديث ذلك السجل بعد تغيير حالة Plugin. يحتفظ الملف نفسه
`plugins/installs.json` ببيانات التثبيت الوصفية الدائمة في `installRecords`
عليا، وببيانات البيان الوصفية القابلة لإعادة البناء في `plugins`. إذا كان
السجل مفقودًا أو قديمًا أو غير صالح، يعيد `openclaw plugins registry
--refresh` بناء عرض البيان الخاص به من سجلات التثبيت وسياسة التكوين وبيانات
البيان/الحزمة الوصفية دون تحميل وحدات وقت تشغيل Plugin.
ينطبق `openclaw plugins update <id-or-npm-spec>` على التثبيتات المتعقبة. يؤدي
تمرير مواصفة حزمة npm مع علامة توزيع أو إصدار دقيق إلى حل اسم الحزمة مرة أخرى
إلى سجل Plugin المتعقب وتسجيل المواصفة الجديدة للتحديثات المستقبلية. يؤدي
تمرير اسم الحزمة دون إصدار إلى نقل تثبيت مثبّت بدقة إلى خط الإصدار الافتراضي
للسجل. إذا كان Plugin npm المثبت يطابق بالفعل الإصدار المحلول وهوية الأثر
المسجلة، يتخطى OpenClaw التحديث دون تنزيل أو إعادة تثبيت أو إعادة كتابة
التكوين.

`--pin` خاص بـ npm فقط. لا يُدعم مع `--marketplace`، لأن تثبيتات السوق تحفظ
بيانات مصدر السوق الوصفية بدلًا من مواصفة npm.

`--dangerously-force-unsafe-install` هو تجاوز طارئ للنتائج الإيجابية الكاذبة
من ماسح الكود الخطر المضمن. يسمح لتثبيتات Plugins وتحديثات Plugins بالمتابعة
بعد نتائج `critical` المضمنة، لكنه لا يزال لا يتجاوز حواجز سياسة
`before_install` الخاصة بـ Plugin أو الحظر الناتج عن فشل الفحص. تتجاهل فحوصات
التثبيت ملفات وأدلة الاختبار الشائعة مثل `tests/` و `__tests__/` و `*.test.*`
و `*.spec.*` لتجنب حظر محاكيات الاختبار المعبأة؛ ولا تزال نقاط دخول وقت
تشغيل Plugin المصرح بها تُفحص حتى إذا استخدمت أحد تلك الأسماء.

تنطبق علامة CLI هذه على تدفقات تثبيت/تحديث Plugin فقط. تستخدم تثبيتات تبعيات
Skills المدعومة من Gateway تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`
بدلًا من ذلك، بينما يبقى `openclaw skills install` تدفق تنزيل/تثبيت Skills
من ClawHub المنفصل.

إذا كان Plugin نشرته على ClawHub مخفيًا أو محظورًا بواسطة فحص، فافتح لوحة
تحكم ClawHub أو شغّل `clawhub package rescan <name>` لطلب أن يفحصه ClawHub
مرة أخرى. يؤثر `--dangerously-force-unsafe-install` فقط على التثبيتات على
جهازك؛ ولا يطلب من ClawHub إعادة فحص Plugin أو جعل إصدار محظور عامًا.

تشارك الحزم المتوافقة في تدفق قائمة/فحص/تفعيل/تعطيل Plugin نفسه. يتضمن دعم
وقت التشغيل الحالي Skills الحزمة، وSkills أوامر Claude، وافتراضيات
`settings.json` الخاصة بـ Claude، وافتراضيات `.lsp.json` الخاصة بـ Claude
و`lspServers` المصرح بها في البيان، وSkills أوامر Cursor، وأدلة خطافات Codex
المتوافقة.

يبلّغ `openclaw plugins inspect <id>` أيضًا عن قدرات الحزمة المكتشفة بالإضافة
إلى إدخالات خوادم MCP وLSP المدعومة أو غير المدعومة لـ Plugins المدعومة
بالحزم.

يمكن أن تكون مصادر السوق اسم سوق معروفًا لدى Claude من
`~/.claude/plugins/known_marketplaces.json`، أو جذر سوق محليًا أو مسار
`marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع
GitHub، أو عنوان URL لـ git. بالنسبة إلى الأسواق البعيدة، يجب أن تبقى إدخالات
Plugin داخل مستودع السوق المستنسخ وأن تستخدم مصادر مسارات نسبية فقط.

راجع [مرجع CLI لـ `openclaw plugins`](/ar/cli/plugins) للحصول على التفاصيل الكاملة.

## نظرة عامة على واجهة برمجة تطبيقات Plugin

تصدّر Plugins الأصلية كائن إدخال يعرّض `register(api)`. قد لا تزال Plugins
الأقدم تستخدم `activate(api)` كاسم مستعار قديم، لكن ينبغي لـ Plugins الجديدة
استخدام `register`.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

يحمّل OpenClaw كائن الإدخال ويستدعي `register(api)` أثناء تفعيل Plugin. لا يزال المحمّل يعود إلى `activate(api)` في plugins الأقدم، لكن ينبغي أن تتعامل plugins المضمّنة وplugins الخارجية الجديدة مع `register` بوصفه العقد العام.

يخبر `api.registrationMode` أي Plugin بسبب تحميل إدخاله:

| الوضع           | المعنى                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | تفعيل وقت التشغيل. سجّل الأدوات، والخطافات، والخدمات، والأوامر، والمسارات، والآثار الجانبية الحية الأخرى.                         |
| `discovery`     | اكتشاف الإمكانات للقراءة فقط. سجّل المزوّدين والبيانات الوصفية؛ قد يُحمَّل كود إدخال Plugin الموثوق، لكن تجاوز الآثار الجانبية الحية. |
| `setup-only`    | تحميل بيانات وصفية لإعداد القناة عبر إدخال إعداد خفيف.                                                                            |
| `setup-runtime` | تحميل إعداد القناة الذي يحتاج أيضًا إلى إدخال وقت التشغيل.                                                                         |
| `cli-metadata`  | جمع بيانات أوامر CLI الوصفية فقط.                                                                                                |

ينبغي لإدخالات Plugin التي تفتح مقابس، أو قواعد بيانات، أو عمالًا في الخلفية، أو عملاء طويلَي العمر أن تحمي تلك الآثار الجانبية باستخدام `api.registrationMode === "full"`. تُخزَّن تحميلات الاكتشاف مؤقتًا بشكل منفصل عن تحميلات التفعيل، ولا تستبدل سجل Gateway قيد التشغيل. الاكتشاف غير مُفعِّل، وليس خاليًا من الاستيراد: قد يقيّم OpenClaw إدخال Plugin الموثوق أو وحدة Plugin القناة لبناء اللقطة. أبقِ المستويات العليا للوحدات خفيفة وخالية من الآثار الجانبية، وانقل عملاء الشبكة، والعمليات الفرعية، والمستمعين، وقراءات بيانات الاعتماد، وبدء الخدمات خلف مسارات وقت التشغيل الكامل.

طرق التسجيل الشائعة:

| الطريقة                                 | ما الذي تسجّله                 |
| --------------------------------------- | ------------------------------ |
| `registerProvider`                      | مزوّد نماذج (LLM)              |
| `registerChannel`                       | قناة دردشة                     |
| `registerTool`                          | أداة Agent                     |
| `registerHook` / `on(...)`              | خطافات دورة الحياة             |
| `registerSpeechProvider`                | تحويل النص إلى كلام / STT      |
| `registerRealtimeTranscriptionProvider` | STT بالبث                      |
| `registerRealtimeVoiceProvider`         | صوت فوري ثنائي الاتجاه         |
| `registerMediaUnderstandingProvider`    | تحليل الصور/الصوت              |
| `registerImageGenerationProvider`       | توليد الصور                    |
| `registerMusicGenerationProvider`       | توليد الموسيقى                 |
| `registerVideoGenerationProvider`       | توليد الفيديو                  |
| `registerWebFetchProvider`              | مزوّد جلب / كشط الويب          |
| `registerWebSearchProvider`             | بحث الويب                      |
| `registerHttpRoute`                     | نقطة نهاية HTTP                |
| `registerCommand` / `registerCli`       | أوامر CLI                      |
| `registerContextEngine`                 | محرك سياق                      |
| `registerService`                       | خدمة خلفية                     |

سلوك حماية الخطافات لخطافات دورة الحياة المعرّفة النوع:

- `before_tool_call`: يكون `{ block: true }` نهائيًا؛ تُتجاوز المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: يكون `{ block: false }` بلا أثر ولا يمحو حظرًا سابقًا.
- `before_install`: يكون `{ block: true }` نهائيًا؛ تُتجاوز المعالجات ذات الأولوية الأدنى.
- `before_install`: يكون `{ block: false }` بلا أثر ولا يمحو حظرًا سابقًا.
- `message_sending`: يكون `{ cancel: true }` نهائيًا؛ تُتجاوز المعالجات ذات الأولوية الأدنى.
- `message_sending`: يكون `{ cancel: false }` بلا أثر ولا يمحو إلغاءً سابقًا.

تربط عمليات تشغيل خادم تطبيق Codex الأصلي أحداث أدوات Codex الأصلية مرة أخرى بسطح الخطافات هذا. يمكن لـ Plugins حظر أدوات Codex الأصلية عبر `before_tool_call`، ومراقبة النتائج عبر `after_tool_call`، والمشاركة في موافقات Codex `PermissionRequest`. لا يعيد الجسر كتابة وسائط أدوات Codex الأصلية حتى الآن. يقع حد دعم وقت تشغيل Codex الدقيق في [عقد دعم حاضنة Codex v1](/ar/plugins/codex-harness#v1-support-contract).

للاطلاع على سلوك الخطافات المعرّفة النوع الكامل، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#hook-decision-semantics).

## ذات صلة

- [بناء plugins](/ar/plugins/building-plugins) — أنشئ Plugin الخاص بك
- [حزم Plugin](/ar/plugins/bundles) — توافق حزم Codex/Claude/Cursor
- [بيان Plugin](/ar/plugins/manifest) — مخطط البيان
- [تسجيل الأدوات](/ar/plugins/building-plugins#registering-agent-tools) — أضف أدوات Agent في Plugin
- [داخليات Plugin](/ar/plugins/architecture) — نموذج الإمكانات ومسار التحميل
- [plugins المجتمع](/ar/plugins/community) — قوائم الجهات الخارجية
