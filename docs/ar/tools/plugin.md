---
read_when:
    - تثبيت plugins أو تكوينها
    - فهم قواعد اكتشاف Plugin وتحميله
    - العمل مع حزم Plugin المتوافقة مع Codex/Claude
sidebarTitle: Install and Configure
summary: تثبيت Plugins OpenClaw وتهيئتها وإدارتها
title: Plugins
x-i18n:
    generated_at: "2026-05-02T07:46:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9378ef4a6aef26949148702f2f6d8537811869511e8830ae5c3d560ff06d98b
    source_path: tools/plugin.md
    workflow: 16
---

توسّع Plugins قدرات OpenClaw بإمكانات جديدة: القنوات، ومزوّدو النماذج،
وأطر تشغيل الوكلاء، والأدوات، وSkills، والكلام، والنسخ الفوري، والصوت الفوري،
وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب، والبحث في الويب،
والمزيد. بعض Plugins **أساسية** (تُشحن مع OpenClaw)، وبعضها
**خارجية**. تُنشر معظم Plugins الخارجية وتُكتشف عبر
[ClawHub](/ar/tools/clawhub). يظل npm مدعومًا للتثبيت المباشر ولمجموعة مؤقتة من
حزم Plugin المملوكة لـ OpenClaw ريثما يكتمل ذلك الانتقال.

## البدء السريع

<Steps>
  <Step title="اعرض ما تم تحميله">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="ثبّت Plugin">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="أعِد تشغيل Gateway">
    ```bash
    openclaw gateway restart
    ```

    ثم اضبط الإعدادات ضمن `plugins.entries.\<id\>.config` في ملف الإعدادات لديك.

  </Step>

  <Step title="تحقق من Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    استخدم `--runtime` عندما تحتاج إلى إثبات الأدوات المسجلة أو الخدمات أو طرق gateway
    أو الخطافات أو أوامر CLI المملوكة لـ Plugin. أما `inspect` العادي فهو فحص بارد
    للبيان/السجل ويتجنب عمدًا استيراد وقت تشغيل Plugin.

  </Step>
</Steps>

إذا كنت تفضّل التحكم الأصلي عبر الدردشة، ففعّل `commands.plugins: true` واستخدم:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

يستخدم مسار التثبيت محلل العناوين نفسه الذي يستخدمه CLI: مسار/أرشيف محلي، أو
`clawhub:<pkg>` صريح، أو `npm:<pkg>` صريح، أو `git:<repo>` صريح، أو مواصفة حزمة
مباشرة (ClawHub أولًا، ثم الرجوع إلى npm).

إذا كانت الإعدادات غير صالحة، يفشل التثبيت عادةً بإغلاق آمن ويوجهك إلى
`openclaw doctor --fix`. استثناء الاسترداد الوحيد هو مسار إعادة تثبيت ضيق
لـ Plugin مضمّن يختار الاشتراك في
`openclaw.install.allowInvalidConfigRecovery`.
أثناء بدء تشغيل Gateway، يُعزل الإعداد غير الصالح لـ Plugin واحد إلى ذلك Plugin:
تسجل عملية البدء مشكلة `plugins.entries.<id>.config`، وتتخطى ذلك Plugin أثناء
التحميل، وتُبقي Plugins والقنوات الأخرى متصلة. شغّل `openclaw doctor --fix`
لعزل إعداد Plugin السيئ بتعطيل إدخال ذلك Plugin وإزالة حمولة إعداده غير الصالحة؛
وتحافظ نسخة الإعداد الاحتياطية العادية على القيم السابقة.
عندما يشير إعداد قناة إلى Plugin لم يعد قابلًا للاكتشاف لكن معرّف Plugin القديم
نفسه يظل موجودًا في إعداد Plugin أو سجلات التثبيت، تسجل عملية بدء Gateway
تحذيرات وتتخطى تلك القناة بدلًا من حظر كل قناة أخرى. شغّل `openclaw doctor --fix`
لإزالة إدخالات القناة/Plugin القديمة؛ أما مفاتيح القنوات غير المعروفة التي لا
توجد عليها أدلة Plugin قديم فتظل تفشل في التحقق كي تبقى الأخطاء المطبعية مرئية.
إذا عُيّن `plugins.enabled: false`، تُعامل مراجع Plugin القديمة كخاملة:
تتخطى عملية بدء Gateway أعمال اكتشاف/تحميل Plugin ويحافظ `openclaw doctor` على
إعداد Plugin المعطّل بدلًا من إزالته تلقائيًا. أعد تفعيل Plugins قبل تشغيل تنظيف
doctor إذا كنت تريد إزالة معرّفات Plugin القديمة.

يحدث تثبيت اعتماديات Plugin فقط أثناء مسارات التثبيت/التحديث الصريحة أو إصلاح
doctor. لا تشغّل عملية بدء Gateway أو إعادة تحميل الإعدادات أو فحص وقت التشغيل
مديري الحزم ولا تصلح أشجار الاعتماديات. يجب أن تكون اعتماديات Plugins المحلية
مثبتة مسبقًا، بينما تُثبّت Plugins من npm وgit وClawHub تحت جذور Plugins المُدارة
لـ OpenClaw. قد تُرفع اعتماديات npm داخل جذر npm المُدار لـ OpenClaw؛ يفحص
التثبيت/التحديث ذلك الجذر المُدار قبل الثقة، وتزيل عملية إلغاء التثبيت الحزم
المُدارة عبر npm من خلال npm. يجب أن تظل Plugins الخارجية ومسارات التحميل المخصصة
مثبتة عبر `openclaw plugins install`. راجع [حل اعتماديات Plugin](/ar/plugins/dependency-resolution)
للاطلاع على دورة الحياة وقت التثبيت.

نسخ المصدر المستخرجة هي مساحات عمل pnpm. إذا استنسخت OpenClaw لتعديل Plugins
المضمّنة، فشغّل `pnpm install`؛ عندها يحمّل OpenClaw Plugins المضمّنة من
`extensions/<id>` بحيث تُستخدم التعديلات والاعتماديات المحلية للحزمة مباشرة.
تثبيتات جذر npm العادية مخصصة لـ OpenClaw المعبأ، وليست لتطوير نسخة مصدرية
مستخرجة.

## أنواع Plugin

يتعرّف OpenClaw على صيغتين لـ Plugin:

| الصيغة     | آلية العمل                                                       | أمثلة                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + وحدة وقت تشغيل؛ تُنفّذ داخل العملية       | Plugins رسمية، حزم npm مجتمعية               |
| **Bundle** | تخطيط متوافق مع Codex/Claude/Cursor؛ يُربط بميزات OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

تظهر كلتاهما ضمن `openclaw plugins list`. راجع [حِزم Plugin](/ar/plugins/bundles) لمعرفة تفاصيل الحِزم.

إذا كنت تكتب Plugin أصليًا، فابدأ بـ [بناء Plugins](/ar/plugins/building-plugins)
و[نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

## نقاط دخول الحزمة

يجب أن تعلن حزم npm الخاصة بـ Plugin الأصلي عن `openclaw.extensions` في `package.json`.
يجب أن يبقى كل إدخال داخل دليل الحزمة وأن يُحل إلى ملف وقت تشغيل قابل للقراءة،
أو إلى ملف مصدر TypeScript مع نظير JavaScript مبني مستنتج مثل `src/index.ts` إلى
`dist/index.js`.

استخدم `openclaw.runtimeExtensions` عندما لا تكون ملفات وقت التشغيل المنشورة في
المسارات نفسها كإدخالات المصدر. عند وجودها، يجب أن تحتوي `runtimeExtensions` على
إدخال واحد بالضبط لكل إدخال في `extensions`. تفشل القوائم غير المتطابقة في
التثبيت واكتشاف Plugin بدلًا من الرجوع بصمت إلى مسارات المصدر. إذا كنت تنشر أيضًا
`openclaw.setupEntry`، فاستخدم `openclaw.runtimeSetupEntry` لنظيره JavaScript
المبني؛ يكون ذلك الملف مطلوبًا عند التصريح به.

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

### حزم npm المملوكة لـ OpenClaw أثناء الانتقال

ClawHub هو مسار التوزيع الأساسي لمعظم Plugins. تتضمن إصدارات OpenClaw المعبأة
الحالية بالفعل كثيرًا من Plugins الرسمية، لذلك لا تحتاج هذه إلى تثبيتات npm
منفصلة في الإعدادات العادية. إلى أن تنتقل كل حزمة Plugin مملوكة لـ OpenClaw إلى
ClawHub، لا يزال OpenClaw يشحن بعض حزم Plugin بنمط `@openclaw/*` على npm
للتثبيتات الأقدم/المخصصة وسير عمل npm المباشر.

إذا أبلغ npm أن حزمة Plugin من `@openclaw/*` مهجورة، فإن إصدار الحزمة هذا من
مسار حزم خارجية أقدم. استخدم Plugin المضمّن من OpenClaw الحالي أو نسخة محلية
مستخرجة إلى أن تُنشر حزمة npm أحدث.

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

### Core (تُشحن مع OpenClaw)

<AccordionGroup>
  <Accordion title="مزوّدو النماذج (مفعّلون افتراضيًا)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins الذاكرة">
    - `memory-core` — بحث الذاكرة المضمّن (افتراضي عبر `plugins.slots.memory`)
    - `memory-lancedb` — ذاكرة طويلة الأمد مدعومة بـ LanceDB مع استرجاع/التقاط تلقائي (عيّن `plugins.slots.memory = "memory-lancedb"`)

    راجع [Memory LanceDB](/ar/plugins/memory-lancedb) لإعداد تضمين متوافق مع OpenAI،
    وأمثلة Ollama، وحدود الاسترجاع، واستكشاف الأخطاء وإصلاحها.

  </Accordion>

  <Accordion title="مزوّدو الكلام (مفعّلون افتراضيًا)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="أخرى">
    - `browser` — Plugin المتصفح المضمّن لأداة المتصفح، وCLI `openclaw browser`، وطريقة gateway `browser.request`، ووقت تشغيل المتصفح، وخدمة التحكم الافتراضية بالمتصفح (مفعّل افتراضيًا؛ عطّله قبل استبداله)
    - `copilot-proxy` — جسر VS Code Copilot Proxy (معطّل افتراضيًا)

  </Accordion>
</AccordionGroup>

تبحث عن Plugins من جهات خارجية؟ راجع [Plugins المجتمع](/ar/plugins/community).

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
| `enabled`        | مفتاح رئيسي للتفعيل/التعطيل (افتراضي: `true`)                           |
| `allow`          | قائمة سماح Plugin (اختيارية)                               |
| `deny`           | قائمة حظر Plugin (اختيارية؛ الحظر يتغلب)                     |
| `load.paths`     | ملفات/دلائل Plugin إضافية                            |
| `slots`          | محددات خانات حصرية (مثل `memory`, `contextEngine`) |
| `entries.\<id\>` | مفاتيح تفعيل/تعطيل وإعدادات لكل Plugin                               |

`plugins.allow` حصرية. عندما لا تكون فارغة، لا يمكن إلا لـ Plugins المدرجة أن
تُحمّل أو تكشف أدوات، حتى إذا احتوى `tools.allow` على `"*"` أو اسم أداة محددة
مملوكة لـ Plugin. إذا أشارت قائمة سماح الأدوات إلى أدوات Plugin، فأضف معرّفات
Plugins المالكة إلى `plugins.allow` أو أزل `plugins.allow`؛ يحذّر
`openclaw doctor` من هذا الشكل.

تتطلب تغييرات الإعدادات **إعادة تشغيل gateway**. إذا كان Gateway يعمل مع مراقبة
الإعدادات + إعادة تشغيل داخل العملية مفعّلة (مسار `openclaw gateway` الافتراضي)،
فعادةً ما تُجرى إعادة التشغيل هذه تلقائيًا بعد لحظة من وصول كتابة الإعدادات.
لا يوجد مسار إعادة تحميل ساخنة مدعوم لكود وقت تشغيل Plugin الأصلي أو خطافات دورة
الحياة؛ أعد تشغيل عملية Gateway التي تخدم القناة المباشرة قبل توقع تشغيل كود
`register(api)` المحدّث، أو خطافات `api.on(...)`، أو الأدوات، أو الخدمات، أو
خطافات المزوّد/وقت التشغيل.

`openclaw plugins list` هو لقطة محلية لسجل/تكوين Plugin. وجود Plugin بحالة
`enabled` هناك يعني أن السجل المحفوظ والتكوين الحالي يسمحان للـ Plugin
بالمشاركة. لا يثبت ذلك أن عملية فرعية لـ Gateway بعيدة تعمل بالفعل قد أُعيد
تشغيلها على كود Plugin نفسه. في إعدادات VPS/الحاويات التي تتضمن عمليات غلاف،
أرسل أوامر إعادة التشغيل إلى عملية `openclaw gateway run` الفعلية، أو استخدم
`openclaw gateway restart` مقابل Gateway قيد التشغيل.

<Accordion title="حالات Plugin: معطّل مقابل مفقود مقابل غير صالح">
  - **معطّل**: Plugin موجود لكن قواعد التفعيل أوقفته. يُحفظ التكوين.
  - **مفقود**: يشير التكوين إلى معرّف Plugin لم تعثر عليه عملية الاكتشاف.
  - **غير صالح**: Plugin موجود لكن تكوينه لا يطابق المخطط المعلن. يتخطى بدء تشغيل Gateway ذلك الـ Plugin فقط؛ يمكن لـ `openclaw doctor --fix` عزل الإدخال غير الصالح بتعطيله وإزالة حمولة تكوينه.

</Accordion>

## الاكتشاف والأسبقية

يفحص OpenClaw Plugins بهذا الترتيب (أول تطابق هو الفائز):

<Steps>
  <Step title="مسارات التكوين">
    `plugins.load.paths` — مسارات ملفات أو أدلة صريحة. تُتجاهل المسارات التي تشير
    رجوعا إلى أدلة Plugins المجمعة والمعبأة الخاصة بـ OpenClaw؛
    شغّل `openclaw doctor --fix` لإزالة تلك الأسماء المستعارة القديمة.
  </Step>

  <Step title="Plugins مساحة العمل">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins العامة">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins المجمعة">
    تُشحن مع OpenClaw. كثير منها مفعّل افتراضيا (موفرو النماذج، الكلام).
    وتتطلب أخرى تفعیلا صريحا.
  </Step>
</Steps>

عادة ما تحل التثبيتات المعبأة وصور Docker Plugins المجمعة من شجرة
`dist/extensions` المترجمة. إذا رُبط دليل مصدر Plugin مجمع فوق مسار المصدر
المعبأ المطابق، مثلا `/app/extensions/synology-chat`، يتعامل OpenClaw مع دليل
المصدر المركّب ذلك كتراكب مصدر مجمع ويكتشفه قبل حزمة
`/app/dist/extensions/synology-chat` المعبأة. يُبقي هذا حلقات حاويات الصيانة
عاملة من دون إعادة كل Plugin مجمع إلى مصدر TypeScript. اضبط
`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` لفرض حزم dist المعبأة حتى عند
وجود تركيبات تراكب مصدر.

### قواعد التفعيل

- `plugins.enabled: false` يعطّل كل Plugins ويتخطى أعمال اكتشاف/تحميل Plugins
- `plugins.deny` ينتصر دائما على allow
- `plugins.entries.\<id\>.enabled: false` يعطّل ذلك الـ Plugin
- Plugins ذات منشأ مساحة العمل **معطّلة افتراضيا** (يجب تفعيلها صراحة)
- تتبع Plugins المجمعة مجموعة التفعيل الافتراضية المدمجة ما لم تُتجاوز
- يمكن للفتحات الحصرية فرض تفعيل Plugin المحدد لتلك الفتحة
- تُفعّل بعض Plugins المجمعة الاختيارية تلقائيا عندما يسمي التكوين سطحا مملوكا
  لـ Plugin، مثل مرجع نموذج موفر، أو تكوين قناة، أو وقت تشغيل harness
- يُحفظ تكوين Plugin القديم أثناء تفعيل `plugins.enabled: false`؛
  أعد تفعيل Plugins قبل تشغيل تنظيف doctor إذا كنت تريد إزالة المعرّفات القديمة
- تحافظ مسارات Codex من عائلة OpenAI على حدود Plugin منفصلة:
  `openai-codex/*` ينتمي إلى Plugin الخاص بـ OpenAI، بينما يُحدد Plugin
  app-server المجمع لـ Codex بواسطة `agentRuntime.id: "codex"` أو مراجع نماذج
  `codex/*` القديمة

## استكشاف أخطاء خطافات وقت التشغيل وإصلاحها

إذا ظهر Plugin في `plugins list` لكن الآثار الجانبية أو الخطافات لـ `register(api)`
لا تعمل في حركة محادثة مباشرة، فتحقق أولا مما يلي:

- شغّل `openclaw gateway status --deep --require-rpc` وتأكد من أن عنوان URL النشط
  لـ Gateway، والملف الشخصي، ومسار التكوين، والعملية هي التي تعدّلها.
- أعد تشغيل Gateway المباشر بعد تغييرات تثبيت/تكوين/كود Plugin. في حاويات
  الغلاف، قد تكون PID 1 مجرد مشرف؛ أعد تشغيل عملية `openclaw gateway run`
  الفرعية أو أرسل لها إشارة.
- استخدم `openclaw plugins inspect <id> --runtime --json` لتأكيد تسجيلات الخطافات
  والتشخيصات. تحتاج خطافات المحادثة غير المجمعة مثل `llm_input`،
  و `llm_output`، و `before_agent_finalize`، و `agent_end` إلى
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- لتبديل النماذج، فضّل `before_model_resolve`. يعمل قبل حل النموذج لدورات
  الوكيل؛ أما `llm_output` فلا يعمل إلا بعد أن تنتج محاولة نموذج مخرجات المساعد.
- لإثبات نموذج الجلسة الفعال، استخدم `openclaw sessions` أو أسطح جلسة/حالة
  Gateway، وعند تصحيح حمولات الموفر، ابدأ Gateway باستخدام
  `--raw-stream --raw-stream-path <path>`.

### إعداد أدوات Plugin ببطء

إذا بدت دورات الوكيل وكأنها تتوقف أثناء إعداد الأدوات، فعّل تسجيل trace وتحقق
من سطور توقيت مصنع أدوات Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

ابحث عن:

```text
[trace:plugin-tools] factory timings ...
```

يسرد الملخص إجمالي وقت المصنع وأبطأ مصانع أدوات Plugin، بما في ذلك معرّف
Plugin، وأسماء الأدوات المعلنة، وشكل النتيجة، وما إذا كانت الأداة اختيارية.
تُرقّى السطور البطيئة إلى تحذيرات عندما يستغرق مصنع واحد 1 ثانية على الأقل أو
يستغرق إجمالي تجهيز مصانع أدوات Plugin 5 ثوان على الأقل.

إذا هيمن Plugin واحد على التوقيت، فافحص تسجيلات وقت تشغيله:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

ثم حدّث ذلك الـ Plugin أو أعد تثبيته أو عطّله. ينبغي لمؤلفي Plugins نقل تحميل
التبعيات المكلف خلف مسار تنفيذ الأداة بدلا من تنفيذه داخل مصنع الأداة.

### تكرار ملكية القناة أو الأداة

الأعراض:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

تعني هذه أن أكثر من Plugin مفعّل يحاول امتلاك القناة نفسها، أو مسار الإعداد
نفسه، أو اسم الأداة نفسه. السبب الأكثر شيوعا هو تثبيت Plugin قناة خارجي إلى
جانب Plugin مجمع بات يوفر معرّف القناة نفسه.

خطوات التصحيح:

- شغّل `openclaw plugins list --enabled --verbose` لرؤية كل Plugin مفعّل
  ومنشئه.
- شغّل `openclaw plugins inspect <id> --runtime --json` لكل Plugin مشتبه به وقارن
  `channels` و `channelConfigs` و `tools` والتشخيصات.
- شغّل `openclaw plugins registry --refresh` بعد تثبيت حزم Plugin أو إزالتها
  حتى تعكس البيانات الوصفية المحفوظة التثبيت الحالي.
- أعد تشغيل Gateway بعد تغييرات التثبيت أو السجل أو التكوين.

خيارات الإصلاح:

- إذا كان أحد Plugins يستبدل عمدا آخر لمعرّف القناة نفسه، فينبغي للـ Plugin
  المفضل أن يعلن `channelConfigs.<channel-id>.preferOver` مع معرّف Plugin ذي
  الأولوية الأدنى. راجع [/plugins/manifest#replacing-another-channel-plugin](/ar/plugins/manifest#replacing-another-channel-plugin).
- إذا كان التكرار عرضيا، فعطّل أحد الطرفين باستخدام
  `plugins.entries.<plugin-id>.enabled: false` أو أزل تثبيت Plugin القديم.
- إذا فعّلت كلا الـ Plugins صراحة، يحتفظ OpenClaw بذلك الطلب ويبلغ عن التعارض.
  اختر مالكا واحدا للقناة أو أعد تسمية الأدوات المملوكة لـ Plugin حتى يكون سطح
  وقت التشغيل واضحا.

## فتحات Plugin (فئات حصرية)

بعض الفئات حصرية (نشطة واحدة فقط في كل مرة):

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

| الفتحة          | ما تتحكم فيه          | الافتراضي          |
| --------------- | --------------------- | ------------------ |
| `memory`        | Plugin Active Memory  | `memory-core`      |
| `contextEngine` | محرك السياق النشط     | `legacy` (مدمج)    |

## مرجع CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
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
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
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

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

تُشحن Plugins المجمعة مع OpenClaw. كثير منها مفعّل افتراضيا (على سبيل المثال
موفرو النماذج المجمعة، وموفرو الكلام المجمعة، وPlugin المتصفح المجمع). لا تزال
Plugins مجمعة أخرى تحتاج إلى `openclaw plugins enable <id>`.

يكتب `--force` فوق Plugin مثبت موجود أو حزمة خطافات في مكانها. استخدم
`openclaw plugins update <id-or-npm-spec>` للترقيات الروتينية لـ Plugins npm
المتتبعة. لا يُدعم مع `--link`، الذي يعيد استخدام مسار المصدر بدلا من النسخ فوق
هدف تثبيت مُدار.

عندما يكون `plugins.allow` مضبوطا مسبقا، يضيف `openclaw plugins install` معرّف
Plugin المثبت إلى قائمة السماح تلك قبل تفعيله. إذا كان معرّف Plugin نفسه موجودا
في `plugins.deny`، يزيل التثبيت إدخال الرفض القديم ذلك حتى يصبح التثبيت الصريح
قابلا للتحميل فورا بعد إعادة التشغيل.

يحتفظ OpenClaw بسجل Plugin محلي محفوظ كنموذج قراءة بارد لجرد Plugins وملكية
المساهمات وتخطيط بدء التشغيل. تحدّث مسارات التثبيت، والتحديث، وإلغاء التثبيت،
والتفعيل، والتعطيل ذلك السجل بعد تغيير حالة Plugin. يحتفظ ملف
`plugins/installs.json` نفسه ببيانات وصفية دائمة للتثبيت في `installRecords` ذات
المستوى الأعلى وبيانات وصفية قابلة لإعادة البناء للبيان في `plugins`. إذا كان
السجل مفقودا أو قديما أو غير صالح، يعيد `openclaw plugins registry --refresh`
بناء عرض البيان الخاص به من سجلات التثبيت، وسياسة التكوين، وبيانات البيان/الحزمة
الوصفية من دون تحميل وحدات وقت تشغيل Plugin.
ينطبق `openclaw plugins update <id-or-npm-spec>` على التثبيتات المتتبعة. يؤدي
تمرير مواصفة حزمة npm مع dist-tag أو إصدار دقيق إلى حل اسم الحزمة رجوعا إلى سجل
Plugin المتتبع وتسجيل المواصفة الجديدة للتحديثات المستقبلية. يؤدي تمرير اسم
الحزمة من دون إصدار إلى إعادة تثبيت مثبت بدقة إلى خط الإصدار الافتراضي للسجل. إذا
كان Plugin npm المثبت يطابق بالفعل الإصدار المحلول وهوية الأثر المسجلة، يتخطى
OpenClaw التحديث من دون تنزيل أو إعادة تثبيت أو إعادة كتابة التكوين.

`--pin` خاص بـ npm فقط. وهو غير مدعوم مع `--marketplace`، لأن
عمليات تثبيت marketplace تحفظ بيانات تعريف مصدر marketplace بدلاً من مواصفة npm.

`--dangerously-force-unsafe-install` هو تجاوز طارئ للنتائج الإيجابية الكاذبة
من ماسح الشفرة الخطرة المضمّن. يسمح بمتابعة عمليات تثبيت Plugin
وتحديثات Plugin بعد نتائج `critical` المضمّنة، لكنه لا يزال
لا يتجاوز حظر سياسات `before_install` الخاصة بـ Plugin أو الحظر الناتج عن فشل الفحص.
تتجاهل فحوصات التثبيت ملفات الاختبار والأدلة الشائعة مثل `tests/`
و`__tests__/` و`*.test.*` و`*.spec.*` لتجنب حظر نماذج الاختبار الوهمية المضمّنة في الحزمة؛
ولا تزال نقاط دخول وقت تشغيل Plugin المعلنة تُفحص حتى إذا استخدمت أحد
تلك الأسماء.

تنطبق راية CLI هذه على مسارات تثبيت/تحديث Plugin فقط. أما عمليات تثبيت
اعتماديات Skills المدعومة من Gateway فتستخدم بدلاً من ذلك تجاوز الطلب المطابق
`dangerouslyForceUnsafeInstall`، بينما يظل `openclaw skills install` مسار
تنزيل/تثبيت Skills المنفصل في ClawHub.

إذا كان Plugin نشرته على ClawHub مخفياً أو محظوراً بسبب فحص، فافتح
لوحة تحكم ClawHub أو شغّل `clawhub package rescan <name>` لطلب أن يتحقق منه
ClawHub مرة أخرى. يؤثر `--dangerously-force-unsafe-install` فقط في عمليات التثبيت على جهازك
الشخصي؛ ولا يطلب من ClawHub إعادة فحص Plugin أو جعل إصدار محظور
عاماً.

تشارك الحزم المتوافقة في مسار قائمة/فحص/تمكين/تعطيل Plugin نفسه.
يشمل دعم وقت التشغيل الحالي Skills الحزم، وSkills أوامر Claude،
وافتراضيات `settings.json` في Claude، وافتراضيات `.lsp.json` في Claude و`lspServers`
المعلنة في البيان، وSkills أوامر Cursor، وأدلة خطافات Codex المتوافقة.

يعرض `openclaw plugins inspect <id>` أيضاً إمكانات الحزمة المكتشفة، إضافة إلى
إدخالات خوادم MCP وLSP المدعومة أو غير المدعومة لـ Plugins المدعومة بالحزم.

يمكن أن تكون مصادر marketplace اسماً معروفاً لـ marketplace في Claude من
`~/.claude/plugins/known_marketplaces.json`، أو جذر marketplace محلياً أو مسار
`marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع GitHub،
أو عنوان URL لـ git. بالنسبة إلى marketplaces البعيدة، يجب أن تبقى إدخالات Plugin داخل
مستودع marketplace المستنسخ وأن تستخدم مصادر مسارات نسبية فقط.

راجع [مرجع CLI لـ `openclaw plugins`](/ar/cli/plugins) للحصول على التفاصيل الكاملة.

## نظرة عامة على Plugin API

تصدّر Plugins الأصلية كائن إدخال يعرّض `register(api)`. قد تظل
Plugins الأقدم تستخدم `activate(api)` كاسم مستعار قديم، لكن يجب على Plugins الجديدة
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

يحمّل OpenClaw كائن الإدخال ويستدعي `register(api)` أثناء تفعيل Plugin.
لا يزال المحمّل يعود إلى `activate(api)` من أجل Plugins الأقدم،
لكن يجب على Plugins المضمّنة وPlugins الخارجية الجديدة التعامل مع `register` بوصفه
العقد العام.

يخبر `api.registrationMode` الـ Plugin بسبب تحميل إدخاله:

| الوضع | المعنى |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | تفعيل وقت التشغيل. سجّل الأدوات والخطافات والخدمات والأوامر والمسارات والآثار الجانبية الحية الأخرى. |
| `discovery` | اكتشاف إمكانات للقراءة فقط. سجّل المزوّدين وبيانات التعريف؛ قد تُحمّل شفرة إدخال Plugin الموثوقة، لكن تجاوز الآثار الجانبية الحية. |
| `setup-only` | تحميل بيانات تعريف إعداد القناة من خلال إدخال إعداد خفيف. |
| `setup-runtime` | تحميل إعداد القناة الذي يحتاج أيضاً إلى إدخال وقت التشغيل. |
| `cli-metadata` | جمع بيانات تعريف أوامر CLI فقط. |

يجب على إدخالات Plugin التي تفتح مقابس أو قواعد بيانات أو عمال خلفية أو عملاء
طويلي العمر حماية تلك الآثار الجانبية باستخدام `api.registrationMode === "full"`.
تُخزّن تحميلات الاكتشاف مؤقتاً بشكل منفصل عن تحميلات التفعيل ولا تستبدل
سجل Gateway قيد التشغيل. الاكتشاف غير مفعِّل، لكنه ليس بلا استيراد:
قد يقيّم OpenClaw إدخال Plugin الموثوق أو وحدة Plugin القناة لبناء
اللقطة. أبقِ المستويات العليا للوحدات خفيفة وخالية من الآثار الجانبية، وانقل
عملاء الشبكة والعمليات الفرعية والمستمعين وقراءات بيانات الاعتماد وبدء تشغيل الخدمات
إلى مسارات وقت التشغيل الكامل.

طرق التسجيل الشائعة:

| الطريقة | ما تسجّله |
| --------------------------------------- | --------------------------- |
| `registerProvider` | مزوّد نموذج (LLM) |
| `registerChannel` | قناة دردشة |
| `registerTool` | أداة Agent |
| `registerHook` / `on(...)` | خطافات دورة الحياة |
| `registerSpeechProvider` | تحويل النص إلى كلام / STT |
| `registerRealtimeTranscriptionProvider` | STT متدفق |
| `registerRealtimeVoiceProvider` | صوت فوري ثنائي الاتجاه |
| `registerMediaUnderstandingProvider` | تحليل الصور/الصوت |
| `registerImageGenerationProvider` | توليد الصور |
| `registerMusicGenerationProvider` | توليد الموسيقى |
| `registerVideoGenerationProvider` | توليد الفيديو |
| `registerWebFetchProvider` | مزوّد جلب / كشط الويب |
| `registerWebSearchProvider` | بحث الويب |
| `registerHttpRoute` | نقطة نهاية HTTP |
| `registerCommand` / `registerCli` | أوامر CLI |
| `registerContextEngine` | محرك السياق |
| `registerService` | خدمة خلفية |

سلوك حارس الخطافات لخطافات دورة الحياة ذات الأنواع:

- `before_tool_call`: يكون `{ block: true }` نهائياً؛ تُتجاوز المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: يكون `{ block: false }` بلا تأثير ولا يمحو حظراً سابقاً.
- `before_install`: يكون `{ block: true }` نهائياً؛ تُتجاوز المعالجات ذات الأولوية الأدنى.
- `before_install`: يكون `{ block: false }` بلا تأثير ولا يمحو حظراً سابقاً.
- `message_sending`: يكون `{ cancel: true }` نهائياً؛ تُتجاوز المعالجات ذات الأولوية الأدنى.
- `message_sending`: يكون `{ cancel: false }` بلا تأثير ولا يمحو إلغاءً سابقاً.

يشغّل خادم تطبيق Codex الأصلي أحداث أدوات Codex الأصلية عبر الجسر عائداً إلى
سطح الخطافات هذا. يمكن لـ Plugins حظر أدوات Codex الأصلية من خلال `before_tool_call`،
ومراقبة النتائج من خلال `after_tool_call`، والمشاركة في موافقات Codex
`PermissionRequest`. لا يعيد الجسر كتابة وسيطات أدوات Codex الأصلية
بعد. يعيش حد دعم وقت تشغيل Codex الدقيق في
[عقد دعم حاضنة Codex v1](/ar/plugins/codex-harness#v1-support-contract).

للسلوك الكامل للخطافات ذات الأنواع، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#hook-decision-semantics).

## ذو صلة

- [بناء Plugins](/ar/plugins/building-plugins) — أنشئ Plugin الخاص بك
- [حزم Plugin](/ar/plugins/bundles) — توافق حزم Codex/Claude/Cursor
- [بيان Plugin](/ar/plugins/manifest) — مخطط البيان
- [تسجيل الأدوات](/ar/plugins/building-plugins#registering-agent-tools) — أضف أدوات Agent في Plugin
- [داخليات Plugin](/ar/plugins/architecture) — نموذج الإمكانات ومسار التحميل
- [Plugins المجتمع](/ar/plugins/community) — قوائم الجهات الخارجية
