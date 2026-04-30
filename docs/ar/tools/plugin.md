---
read_when:
    - تثبيت Plugins أو تكوينها
    - فهم قواعد اكتشاف Plugin وتحميله
    - العمل مع حِزَم Plugin المتوافقة مع Codex/Claude
sidebarTitle: Install and Configure
summary: ثبّت Plugins OpenClaw وهيّئها وأدرها
title: Plugins
x-i18n:
    generated_at: "2026-04-30T08:32:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a12d158053c13b47a56d8d6b382818962e9b5109fdf8ededd3ecf92b83089e6
    source_path: tools/plugin.md
    workflow: 16
---

توسّع Plugins قدرات OpenClaw بإمكانات جديدة: القنوات، ومزوّدو النماذج،
وحاويات الوكلاء، والأدوات، وSkills، والكلام، والنسخ الفوري، والصوت الفوري،
وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب، والبحث في الويب،
والمزيد. بعض Plugins تكون **أساسية** (تُشحن مع OpenClaw)، وأخرى
**خارجية**. تُنشر وتُكتشف معظم Plugins الخارجية عبر
[ClawHub](/ar/tools/clawhub). يبقى npm مدعومًا للتثبيت المباشر ولمجموعة
مؤقتة من حزم Plugins المملوكة لـ OpenClaw إلى أن تكتمل هذه الهجرة.

## البدء السريع

<Steps>
  <Step title="اعرض ما تم تحميله">
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

    ثم اضبط الإعدادات ضمن `plugins.entries.\<id\>.config` في ملف الإعدادات لديك.

  </Step>
</Steps>

إذا كنت تفضّل التحكم الأصلي عبر الدردشة، ففعّل `commands.plugins: true` واستخدم:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

يستخدم مسار التثبيت أداة الحل نفسها التي يستخدمها CLI: مسار/أرشيف محلي،
أو `clawhub:<pkg>` صريح، أو `npm:<pkg>` صريح، أو مواصفة حزمة مجردة
(ClawHub أولًا، ثم الرجوع إلى npm).

إذا كانت الإعدادات غير صالحة، يفشل التثبيت عادةً بشكل مغلق ويوجهك إلى
`openclaw doctor --fix`. الاستثناء الوحيد للاسترداد هو مسار ضيق لإعادة تثبيت
Plugin مضمّن لـ Plugins التي تختار الدخول في
`openclaw.install.allowInvalidConfigRecovery`.
أثناء بدء تشغيل Gateway، تُعزل الإعدادات غير الصالحة الخاصة بواحد من Plugins
على ذلك Plugin وحده: يسجّل بدء التشغيل مشكلة `plugins.entries.<id>.config`،
ويتخطى ذلك Plugin أثناء التحميل، ويبقي Plugins والقنوات الأخرى متصلة. شغّل
`openclaw doctor --fix` لعزل إعدادات Plugin السيئة بتعطيل إدخال ذلك Plugin
وإزالة حمولة إعداداته غير الصالحة؛ تحتفظ النسخة الاحتياطية العادية للإعدادات
بالقيم السابقة.
عندما تشير إعدادات قناة إلى Plugin لم يعد قابلًا للاكتشاف، لكن معرّف Plugin
القديم نفسه لا يزال موجودًا في إعدادات Plugin أو سجلات التثبيت، يسجّل بدء
تشغيل Gateway تحذيرات ويتخطى تلك القناة بدلًا من حظر كل قناة أخرى.
شغّل `openclaw doctor --fix` لإزالة إدخالات القناة/Plugin القديمة؛ وتظل مفاتيح
القنوات المجهولة التي لا يوجد دليل على صلتها بـ Plugin قديم تفشل في التحقق حتى
تبقى الأخطاء الإملائية مرئية.
إذا تم ضبط `plugins.enabled: false`، تُعامل مراجع Plugins القديمة على أنها
خاملة: يتخطى بدء تشغيل Gateway عمل اكتشاف/تحميل Plugins، ويحافظ
`openclaw doctor` على إعدادات Plugins المعطلة بدلًا من إزالتها تلقائيًا.
أعد تفعيل Plugins قبل تشغيل تنظيف doctor إذا كنت تريد إزالة معرّفات Plugins
القديمة.

لا تثبّت حزم OpenClaw المعبأة بشغف شجرة اعتماديات وقت التشغيل لكل Plugin مضمّن.
عندما يكون Plugin مضمّن مملوك لـ OpenClaw نشطًا من إعدادات Plugin، أو إعدادات
قناة قديمة، أو بيان مفعّل افتراضيًا، يصلح بدء التشغيل اعتماديات وقت التشغيل
المعلنة لذلك Plugin فقط قبل استيراده. لا تكفي حالة مصادقة القناة المحفوظة وحدها
لتفعيل قناة مضمّنة لإصلاح اعتماديات وقت التشغيل عند بدء تشغيل Gateway.
يبقى التعطيل الصريح هو الغالب: `plugins.entries.<id>.enabled: false`،
و`plugins.deny`، و`plugins.enabled: false`، و`channels.<id>.enabled: false`
تمنع إصلاح اعتماديات وقت التشغيل المضمّنة تلقائيًا لذلك Plugin/القناة.
كما أن وجود `plugins.allow` غير فارغ يحدّ إصلاح اعتماديات وقت التشغيل المضمّنة
المفعّلة افتراضيًا؛ ولا يزال بإمكان التفعيل الصريح لقناة مضمّنة
(`channels.<id>.enabled: true`) إصلاح اعتماديات Plugin الخاصة بتلك القناة.
يجب أن تظل Plugins الخارجية ومسارات التحميل المخصصة مثبتة عبر
`openclaw plugins install`.

## أنواع Plugins

يتعرّف OpenClaw على تنسيقين لـ Plugins:

| التنسيق | آلية العمل | أمثلة |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **أصلي** | `openclaw.plugin.json` + وحدة وقت تشغيل؛ ينفّذ داخل العملية | Plugins رسمية، وحزم npm من المجتمع |
| **حزمة** | تخطيط متوافق مع Codex/Claude/Cursor؛ يُربط بميزات OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

يظهر كلاهما ضمن `openclaw plugins list`. راجع [حزم Plugins](/ar/plugins/bundles) لتفاصيل الحزم.

إذا كنت تكتب Plugin أصليًا، فابدأ بـ [بناء Plugins](/ar/plugins/building-plugins)
و[نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

## نقاط دخول الحزمة

يجب أن تعلن حزم npm الخاصة بـ Plugins الأصلية عن `openclaw.extensions` في `package.json`.
يجب أن يبقى كل إدخال داخل دليل الحزمة وأن يُحل إلى ملف وقت تشغيل قابل للقراءة،
أو إلى ملف مصدر TypeScript له نظير JavaScript مبني مستنتج مثل `src/index.ts` إلى `dist/index.js`.

استخدم `openclaw.runtimeExtensions` عندما لا تكون ملفات وقت التشغيل المنشورة في
المسارات نفسها الخاصة بإدخالات المصدر. عند وجودها، يجب أن تحتوي `runtimeExtensions`
على إدخال واحد بالضبط لكل إدخال في `extensions`. تفشل القوائم غير المتطابقة في
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

ClawHub هو مسار التوزيع الأساسي لمعظم Plugins. إصدارات OpenClaw المعبأة الحالية
تضم بالفعل العديد من Plugins الرسمية، لذلك لا تحتاج هذه إلى تثبيتات npm منفصلة
في الإعدادات العادية. إلى أن تهاجر كل Plugins المملوكة لـ OpenClaw إلى ClawHub،
لا يزال OpenClaw يشحن بعض حزم Plugins من `@openclaw/*` على npm للتثبيتات
الأقدم/المخصصة وتدفقات عمل npm المباشرة.

إذا أبلغ npm أن حزمة Plugin من `@openclaw/*` مهجورة، فإصدار تلك الحزمة من
سلسلة حزم خارجية أقدم. استخدم Plugin المضمّن من OpenClaw الحالي أو نسخة محلية
إلى أن تُنشر حزمة npm أحدث.

| Plugin | الحزمة | المستندات |
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

### الأساسي (يُشحن مع OpenClaw)

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
    - `browser` — Plugin متصفح مضمّن لأداة المتصفح، وCLI `openclaw browser`، وطريقة Gateway `browser.request`، ووقت تشغيل المتصفح، وخدمة التحكم الافتراضية بالمتصفح (مفعّل افتراضيًا؛ عطّله قبل استبداله)
    - `copilot-proxy` — جسر VS Code Copilot Proxy (معطّل افتراضيًا)

  </Accordion>
</AccordionGroup>

هل تبحث عن Plugins من أطراف ثالثة؟ راجع [Plugins المجتمع](/ar/plugins/community).

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

| الحقل | الوصف |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | مفتاح التفعيل الرئيسي (الافتراضي: `true`) |
| `allow`          | قائمة السماح لـ Plugin (اختيارية) |
| `deny`           | قائمة الحظر لـ Plugin (اختيارية؛ الحظر هو الغالب) |
| `load.paths`     | ملفات/أدلة Plugin إضافية |
| `slots`          | محددات خانات حصرية (مثل `memory`، و`contextEngine`) |
| `entries.\<id\>` | مفاتيح تبديل + إعدادات لكل Plugin |

تتطلب تغييرات الإعدادات **إعادة تشغيل Gateway**. إذا كان Gateway يعمل مع مراقبة
الإعدادات + إعادة تشغيل داخل العملية مفعّلة (مسار `openclaw gateway` الافتراضي)،
فعادةً ما تُنفّذ إعادة التشغيل تلك تلقائيًا بعد لحظة من كتابة الإعدادات.
لا يوجد مسار إعادة تحميل فوري مدعوم لشفرة وقت تشغيل Plugin الأصلي أو خطافات
دورة الحياة؛ أعد تشغيل عملية Gateway التي تخدم القناة المباشرة قبل توقع تشغيل
شفرة `register(api)` المحدثة، أو خطافات `api.on(...)`، أو الأدوات، أو الخدمات،
أو خطافات المزوّد/وقت التشغيل.

`openclaw plugins list` هي لقطة محلية لسجل/إعدادات Plugins. عندما يظهر Plugin
`enabled` هناك، فهذا يعني أن السجل المحفوظ والإعدادات الحالية يسمحان لـ Plugin
بالمشاركة. لا يثبت ذلك أن ابن Gateway بعيدًا يعمل بالفعل قد أُعيد تشغيله إلى
شفرة Plugin نفسها. في إعدادات VPS/الحاويات التي تستخدم عمليات تغليف، أرسل
إعادات التشغيل إلى عملية `openclaw gateway run` الفعلية، أو استخدم
`openclaw gateway restart` ضد Gateway الجاري.

<Accordion title="حالات Plugin: معطّل مقابل مفقود مقابل غير صالح">
  - **معطّل**: يوجد Plugin لكن قواعد التفعيل أوقفته. تُحفظ الإعدادات.
  - **مفقود**: تشير الإعدادات إلى معرّف Plugin لم يعثر عليه الاكتشاف.
  - **غير صالح**: يوجد Plugin لكن إعداداته لا تطابق المخطط المعلن. يتخطى بدء تشغيل Gateway ذلك Plugin فقط؛ يستطيع `openclaw doctor --fix` عزل الإدخال غير الصالح بتعطيله وإزالة حمولة إعداداته.

</Accordion>

## الاكتشاف والأسبقية

يفحص OpenClaw بحثًا عن Plugins بهذا الترتيب (أول تطابق هو الغالب):

<Steps>
  <Step title="مسارات الإعدادات">
    `plugins.load.paths` — مسارات ملفات أو أدلة صريحة. تُتجاهل المسارات التي تشير
    مرة أخرى إلى أدلة Plugins المضمّنة المعبأة الخاصة بـ OpenClaw نفسه؛
    شغّل `openclaw doctor --fix` لإزالة تلك الأسماء المستعارة القديمة.
  </Step>

  <Step title="Plugins مساحة العمل">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins العامة">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins المضمنة">
    مشحونة مع OpenClaw. يُفعَّل كثير منها افتراضيًا (موفرو النماذج، والكلام).
    وتتطلب أخرى تفعيلًا صريحًا.
  </Step>
</Steps>

عادةً ما تحلّ التثبيتات المعبأة وصور Docker الـ Plugins المضمنة من شجرة
`dist/extensions` المترجمة. إذا جرى ربط دليل مصدر Plugin مضمن فوق مسار المصدر
المعبأ المطابق، مثل
`/app/extensions/synology-chat`، يتعامل OpenClaw مع دليل المصدر المركب هذا
كتراكب مصدر مضمن ويكتشفه قبل حزمة
`/app/dist/extensions/synology-chat` المعبأة. يحافظ هذا على عمل حلقات الحاويات
الخاصة بالمشرفين دون إعادة كل Plugin مضمن إلى مصدر TypeScript.
عيّن `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` لفرض حزم dist المعبأة
حتى عند وجود تركيبات تراكب مصدر.

### قواعد التفعيل

- يعطّل `plugins.enabled: false` كل الـ Plugins ويتخطى عمل اكتشاف/تحميل الـ Plugins
- يتغلب `plugins.deny` دائمًا على السماح
- يعطّل `plugins.entries.\<id\>.enabled: false` ذلك الـ Plugin
- الـ Plugins ذات أصل مساحة العمل **معطّلة افتراضيًا** (يجب تفعيلها صراحةً)
- تتبع الـ Plugins المضمنة مجموعة التشغيل الافتراضي المدمجة ما لم تُستبدل
- يمكن للفتحات الحصرية فرض تفعيل الـ Plugin المحدد لتلك الفتحة
- تُفعَّل بعض الـ Plugins المضمنة الاختيارية تلقائيًا عندما تسمي الإعدادات سطحًا
  مملوكًا للـ Plugin، مثل مرجع نموذج موفر، أو إعداد قناة، أو وقت تشغيل حزمة اختبار
- تُحفظ إعدادات الـ Plugin القديمة بينما يكون `plugins.enabled: false` نشطًا؛
  أعد تفعيل الـ Plugins قبل تشغيل تنظيف doctor إذا أردت إزالة المعرّفات القديمة
- تحافظ مسارات Codex من عائلة OpenAI على حدود Plugin منفصلة:
  `openai-codex/*` ينتمي إلى OpenAI plugin، بينما يُختار Plugin خادم تطبيق Codex
  المضمن عبر `agentRuntime.id: "codex"` أو مراجع نماذج
  `codex/*` القديمة

## استكشاف أخطاء خطافات وقت التشغيل وإصلاحها

إذا ظهر Plugin في `plugins list` لكن آثار `register(api)` الجانبية أو الخطافات
لا تعمل في حركة محادثة مباشرة، فتحقق أولًا مما يلي:

- شغّل `openclaw gateway status --deep --require-rpc` وتأكد أن عنوان URL النشط
  لـ Gateway، والملف التعريفي، ومسار الإعدادات، والعملية هي التي تعدّلها.
- أعد تشغيل Gateway المباشر بعد تغييرات تثبيت/إعداد/كود الـ Plugin. في حاويات
  التغليف، قد يكون PID 1 مجرد مشرف؛ أعد تشغيل عملية الابن
  `openclaw gateway run` أو أرسل إليها إشارة.
- استخدم `openclaw plugins inspect <id> --json` لتأكيد تسجيلات الخطافات
  والتشخيصات. تحتاج خطافات المحادثة غير المضمنة مثل `llm_input`,
  `llm_output`, `before_agent_finalize`, و `agent_end` إلى
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- لتبديل النماذج، فضّل `before_model_resolve`. يعمل قبل حل النموذج لدورات الوكيل؛
  أما `llm_output` فلا يعمل إلا بعد أن تنتج محاولة نموذج مخرجات مساعد.
- لإثبات نموذج الجلسة الفعلي، استخدم `openclaw sessions` أو أسطح جلسة/حالة
  Gateway، وعند تصحيح حمولات الموفر ابدأ Gateway باستخدام
  `--raw-stream --raw-stream-path <path>`.

### ملكية قناة أو أداة مكررة

الأعراض:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

تعني هذه أن أكثر من Plugin مفعّل يحاول امتلاك القناة نفسها، أو تدفق الإعداد
نفسه، أو اسم الأداة نفسه. السبب الأكثر شيوعًا هو تثبيت Plugin قناة خارجي بجانب
Plugin مضمن يوفر الآن معرّف القناة نفسه.

خطوات التصحيح:

- شغّل `openclaw plugins list --enabled --verbose` لرؤية كل Plugin مفعّل
  وأصله.
- شغّل `openclaw plugins inspect <id> --json` لكل Plugin مشتبه به وقارن
  `channels`, و `channelConfigs`, و `tools`, والتشخيصات.
- شغّل `openclaw plugins registry --refresh` بعد تثبيت حزم Plugins أو إزالتها
  حتى تعكس البيانات الوصفية المحفوظة التثبيت الحالي.
- أعد تشغيل Gateway بعد تغييرات التثبيت أو السجل أو الإعدادات.

خيارات الإصلاح:

- إذا كان أحد الـ Plugins يستبدل آخر عمدًا لمعرّف القناة نفسه، فيجب أن يعلن
  الـ Plugin المفضل عن `channelConfigs.<channel-id>.preferOver` مع معرّف
  الـ Plugin الأقل أولوية. راجع [/plugins/manifest#replacing-another-channel-plugin](/ar/plugins/manifest#replacing-another-channel-plugin).
- إذا كان التكرار عرضيًا، فعطّل أحد الجانبين باستخدام
  `plugins.entries.<plugin-id>.enabled: false` أو أزل تثبيت الـ Plugin القديم.
- إذا فعّلت كلا الـ Plugins صراحةً، يحتفظ OpenClaw بهذا الطلب ويبلغ عن التعارض.
  اختر مالكًا واحدًا للقناة أو أعد تسمية الأدوات المملوكة للـ Plugin حتى يكون
  سطح وقت التشغيل غير ملتبس.

## فتحات الـ Plugin (فئات حصرية)

بعض الفئات حصرية (واحد نشط فقط في كل مرة):

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
| `memory`        | Active memory plugin  | `memory-core`       |
| `contextEngine` | محرك السياق النشط | `legacy` (مدمج) |

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

تُشحن الـ Plugins المضمنة مع OpenClaw. يُفعَّل كثير منها افتراضيًا (على سبيل المثال
موفرو النماذج المضمنون، وموفرو الكلام المضمنون، وPlugin المتصفح المضمن).
ما زالت الـ Plugins المضمنة الأخرى تحتاج إلى `openclaw plugins enable <id>`.

يستبدل `--force` Plugin مثبتًا أو حزمة خطافات موجودة في مكانها. استخدم
`openclaw plugins update <id-or-npm-spec>` للترقيات الروتينية لـ Plugins npm
المتعقبة. لا يُدعم مع `--link`، الذي يعيد استخدام مسار المصدر بدلًا من النسخ فوق
هدف تثبيت مُدار.

عندما يكون `plugins.allow` مضبوطًا بالفعل، يضيف `openclaw plugins install`
معرّف الـ Plugin المثبت إلى قائمة السماح تلك قبل تفعيله. إذا كان معرّف الـ Plugin
نفسه موجودًا في `plugins.deny`، يزيل التثبيت إدخال الرفض القديم ذلك حتى يصبح
التثبيت الصريح قابلًا للتحميل فورًا بعد إعادة التشغيل.

يحتفظ OpenClaw بسجل Plugin محلي دائم كنموذج قراءة بارد لمخزون الـ Plugins،
وملكية المساهمات، وتخطيط بدء التشغيل. تُحدّث تدفقات التثبيت، والتحديث، وإلغاء
التثبيت، والتفعيل، والتعطيل ذلك السجل بعد تغيير حالة الـ Plugin. يحفظ ملف
`plugins/installs.json` نفسه بيانات وصفية دائمة للتثبيت في `installRecords`
عالية المستوى وبيانات وصفية قابلة لإعادة البناء للبيان في `plugins`. إذا كان
السجل مفقودًا، أو قديمًا، أو غير صالح، فإن `openclaw plugins registry
--refresh` يعيد بناء عرض البيان الخاص به من سجلات التثبيت، وسياسة الإعدادات،
وبيانات البيان/الحزمة الوصفية دون تحميل وحدات وقت تشغيل الـ Plugin.
ينطبق `openclaw plugins update <id-or-npm-spec>` على التثبيتات المتعقبة. تمرير
مواصفة حزمة npm مع dist-tag أو إصدار محدد يحل اسم الحزمة مرة أخرى إلى سجل
الـ Plugin المتعقب ويسجل المواصفة الجديدة للتحديثات المستقبلية. تمرير اسم الحزمة
دون إصدار ينقل تثبيتًا مثبتًا بدقة إلى خط الإصدار الافتراضي للسجل. إذا كان Plugin
npm المثبت يطابق بالفعل الإصدار المحلول وهوية الأثر المسجلة، يتخطى OpenClaw
التحديث دون تنزيل أو إعادة تثبيت أو إعادة كتابة الإعدادات.

`--pin` خاص بـ npm فقط. لا يُدعم مع `--marketplace`، لأن تثبيتات السوق تحفظ
بيانات وصفية لمصدر السوق بدلًا من مواصفة npm.

`--dangerously-force-unsafe-install` هو تجاوز طارئ للإيجابيات الكاذبة من ماسح
الكود الخطير المدمج. يسمح لتثبيتات الـ Plugin وتحديثات الـ Plugin بالمتابعة بعد
نتائج `critical` المدمجة، لكنه لا يتجاوز مع ذلك حظر سياسة `before_install`
الخاصة بالـ Plugin أو الحظر الناتج عن فشل الفحص. تتجاهل فحوصات التثبيت ملفات
وأدلة الاختبار الشائعة مثل `tests/`, و `__tests__/`, و `*.test.*`, و `*.spec.*`
لتجنب حظر محاكيات الاختبار المعبأة؛ ولا تزال نقاط دخول وقت تشغيل الـ Plugin
المعلنة تُفحص حتى إذا استخدمت أحد تلك الأسماء.

ينطبق علم CLI هذا على تدفقات تثبيت/تحديث الـ Plugin فقط. تستخدم تثبيتات تبعيات
Skills المدعومة من Gateway تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`
بدلًا من ذلك، بينما يبقى `openclaw skills install` تدفق تنزيل/تثبيت Skills
المنفصل من ClawHub.

إذا كان Plugin نشرته على ClawHub مخفيًا أو محظورًا بسبب فحص، فافتح لوحة تحكم
ClawHub أو شغّل `clawhub package rescan <name>` لطلب فحصه مرة أخرى من ClawHub.
يؤثر `--dangerously-force-unsafe-install` فقط على التثبيتات على جهازك؛ ولا يطلب
من ClawHub إعادة فحص الـ Plugin أو جعل إصدار محظور عامًا.

تشارك الحزم المتوافقة في تدفق قائمة/فحص/تفعيل/تعطيل الـ Plugin نفسه. يتضمن دعم
وقت التشغيل الحالي Skills الحزم، وSkills أوامر Claude، وافتراضيات
`settings.json` لـ Claude، وافتراضيات Claude `.lsp.json` و`lspServers` المعلنة
في البيان، وSkills أوامر Cursor، وأدلة خطافات Codex المتوافقة.

يعرض `openclaw plugins inspect <id>` أيضًا قدرات الحزمة المكتشفة بالإضافة إلى
إدخالات خادم MCP وLSP المدعومة أو غير المدعومة للـ Plugins المدعومة بحزمة.

يمكن أن تكون مصادر السوق اسم سوق معروفًا لـ Claude من
`~/.claude/plugins/known_marketplaces.json`، أو جذر سوق محليًا، أو مسار
`marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع
GitHub، أو عنوان URL لـ git. بالنسبة للأسواق البعيدة، يجب أن تبقى إدخالات
الـ Plugin داخل مستودع السوق المستنسخ وأن تستخدم مصادر مسارات نسبية فقط.

راجع [مرجع CLI لـ `openclaw plugins`](/ar/cli/plugins) للحصول على التفاصيل الكاملة.

## نظرة عامة على واجهة برمجة تطبيقات الـ Plugin

تصدّر الـ Plugins الأصلية كائن دخول يكشف `register(api)`. قد تظل الـ Plugins
الأقدم تستخدم `activate(api)` كاسم مستعار قديم، لكن يجب على الـ Plugins الجديدة
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

يحمّل OpenClaw كائن الدخول ويستدعي `register(api)` أثناء تفعيل الـ Plugin.
ما زال المحمّل يرجع إلى `activate(api)` للـ Plugins الأقدم، لكن يجب أن تتعامل
الـ Plugins المضمنة والـ Plugins الخارجية الجديدة مع `register` بصفته العقد
العام.

يخبر `api.registrationMode` الـ Plugin بسبب تحميل دخوله:

| الوضع            | المعنى                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | تفعيل وقت التشغيل. يسجل الأدوات، والخطافات، والخدمات، والأوامر، والمسارات، والآثار الجانبية الحية الأخرى.                              |
| `discovery`     | اكتشاف الإمكانات للقراءة فقط. يسجل الموفرين والبيانات الوصفية؛ قد يتم تحميل كود إدخال Plugin الموثوق، لكن مع تخطي الآثار الجانبية الحية. |
| `setup-only`    | تحميل بيانات إعداد القناة الوصفية عبر إدخال إعداد خفيف.                                                                |
| `setup-runtime` | تحميل إعداد القناة الذي يحتاج أيضا إلى إدخال وقت التشغيل.                                                                         |
| `cli-metadata`  | جمع بيانات أوامر CLI الوصفية فقط.                                                                                            |

ينبغي لإدخالات Plugin التي تفتح مقابس، أو قواعد بيانات، أو عاملين في الخلفية، أو عملاء طويلَي العمر
أن تحمي تلك الآثار الجانبية باستخدام `api.registrationMode === "full"`.
تخزن عمليات تحميل الاكتشاف مؤقتا بشكل منفصل عن عمليات تحميل التفعيل ولا تستبدل
سجل Gateway قيد التشغيل. الاكتشاف غير مفعِّل، وليس خاليا من الاستيراد:
قد يقيم OpenClaw إدخال Plugin الموثوق أو وحدة Plugin القناة لبناء
اللقطة. أبق المستويات العليا للوحدات خفيفة وخالية من الآثار الجانبية، وانقل
عملاء الشبكة، والعمليات الفرعية، والمستمعين، وقراءات بيانات الاعتماد، وبدء تشغيل الخدمات
خلف مسارات وقت التشغيل الكامل.

طرق التسجيل الشائعة:

| الطريقة                                  | ما تسجله           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | موفر نموذج (LLM)        |
| `registerChannel`                       | قناة دردشة                |
| `registerTool`                          | أداة وكيل                  |
| `registerHook` / `on(...)`              | خطافات دورة الحياة             |
| `registerSpeechProvider`                | تحويل النص إلى كلام / STT        |
| `registerRealtimeTranscriptionProvider` | STT متدفق               |
| `registerRealtimeVoiceProvider`         | صوت فوري مزدوج الاتجاه       |
| `registerMediaUnderstandingProvider`    | تحليل الصور/الصوت        |
| `registerImageGenerationProvider`       | توليد الصور            |
| `registerMusicGenerationProvider`       | توليد الموسيقى            |
| `registerVideoGenerationProvider`       | توليد الفيديو            |
| `registerWebFetchProvider`              | موفر جلب الويب / الكشط |
| `registerWebSearchProvider`             | بحث الويب                  |
| `registerHttpRoute`                     | نقطة نهاية HTTP               |
| `registerCommand` / `registerCli`       | أوامر CLI                |
| `registerContextEngine`                 | محرك السياق              |
| `registerService`                       | خدمة خلفية          |

سلوك الحماية للخطافات النمطية لدورة الحياة:

- `before_tool_call`: تكون `{ block: true }` نهائية؛ يتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: تكون `{ block: false }` بلا تأثير ولا تمحو حظرا سابقا.
- `before_install`: تكون `{ block: true }` نهائية؛ يتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_install`: تكون `{ block: false }` بلا تأثير ولا تمحو حظرا سابقا.
- `message_sending`: تكون `{ cancel: true }` نهائية؛ يتم تخطي المعالجات ذات الأولوية الأدنى.
- `message_sending`: تكون `{ cancel: false }` بلا تأثير ولا تمحو إلغاء سابقا.

يعيد خادم تطبيق Codex الأصلي تمرير أحداث أدوات Codex الأصلية عبر الجسر إلى
سطح الخطافات هذا. يمكن للـ Plugins حظر أدوات Codex الأصلية عبر `before_tool_call`،
ومراقبة النتائج عبر `after_tool_call`، والمشاركة في موافقات Codex
`PermissionRequest`. لا يعيد الجسر كتابة وسيطات أدوات Codex الأصلية
بعد. توجد حدود دعم وقت تشغيل Codex الدقيقة في
[عقد دعم Codex harness v1](/ar/plugins/codex-harness#v1-support-contract).

للاطلاع على سلوك الخطافات النمطية الكامل، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#hook-decision-semantics).

## ذات صلة

- [بناء Plugins](/ar/plugins/building-plugins) — أنشئ Plugin خاصا بك
- [حزم Plugin](/ar/plugins/bundles) — توافق حزم Codex/Claude/Cursor
- [بيان Plugin](/ar/plugins/manifest) — مخطط البيان
- [تسجيل الأدوات](/ar/plugins/building-plugins#registering-agent-tools) — أضف أدوات وكيل في Plugin
- [تفاصيل Plugin الداخلية](/ar/plugins/architecture) — نموذج الإمكانات وخط تحميل البيانات
- [Plugins المجتمع](/ar/plugins/community) — قوائم الجهات الخارجية
