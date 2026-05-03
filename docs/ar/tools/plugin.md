---
read_when:
    - تثبيت Plugins أو تكوينها
    - فهم قواعد اكتشاف Plugin وتحميله
    - العمل مع حزم Plugin المتوافقة مع Codex/Claude
sidebarTitle: Install and Configure
summary: تثبيت إضافات OpenClaw وتهيئتها وإدارتها
title: Plugins
x-i18n:
    generated_at: "2026-05-03T21:43:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e3cffc15c5c52dd539e21103c207c9e38955f9fd3acd561a52964eefafb8f0
    source_path: tools/plugin.md
    workflow: 16
---

توسّع Plugins قدرات OpenClaw بإمكانات جديدة: القنوات، وموفرو النماذج،
وحاضنات الوكلاء، والأدوات، وSkills، والكلام، والنسخ في الوقت الحقيقي، والصوت في الوقت الحقيقي،
وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب، والبحث في الويب، والمزيد. بعض Plugins هي **أساسية** (تُشحَن مع OpenClaw)، وبعضها الآخر
**خارجية**. تُنشَر معظم Plugins الخارجية وتُكتشف عبر
[ClawHub](/ar/tools/clawhub). يظل npm مدعومًا للتثبيت المباشر ولمجموعة
مؤقتة من حزم Plugins المملوكة لـ OpenClaw إلى حين اكتمال ذلك الانتقال.

## البدء السريع

للحصول على أمثلة جاهزة للنسخ واللصق للتثبيت، والقائمة، وإلغاء التثبيت، والتحديث، والنشر، راجع
[إدارة Plugins](/ar/plugins/manage-plugins).

<Steps>
  <Step title="رؤية ما تم تحميله">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="تثبيت Plugin">
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

  <Step title="إعادة تشغيل Gateway">
    ```bash
    openclaw gateway restart
    ```

    ثم اضبط الإعدادات ضمن `plugins.entries.\<id\>.config` في ملف الإعدادات لديك.

  </Step>

  <Step title="إدارة أصلية عبر الدردشة">
    في Gateway قيد التشغيل، يؤدي أمرا `/plugins enable` و`/plugins disable` المقتصران على المالك
    إلى تشغيل معيد تحميل إعدادات Gateway. يعيد Gateway تحميل أسطح تشغيل Plugin
    داخل العملية، وتعيد أدوار الوكيل الجديدة بناء قائمة أدواتها من السجل
    المحدّث. يغيّر `/plugins install` الشيفرة المصدرية لـ Plugin، لذلك
    يطلب Gateway إعادة تشغيل بدل التظاهر بأن العملية الحالية يمكنها
    إعادة تحميل الوحدات المستوردة مسبقًا بأمان.

  </Step>

  <Step title="التحقق من Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    استخدم `--runtime` عندما تحتاج إلى إثبات الأدوات، أو الخدمات، أو طرق Gateway،
    أو الخطافات، أو أوامر CLI المملوكة لـ Plugin والمسجلة. أما `inspect` العادي فهو فحص بارد
    للبيان/السجل ويتجنب عمدًا استيراد وقت تشغيل Plugin.

  </Step>
</Steps>

إذا كنت تفضل التحكم الأصلي عبر الدردشة، فعّل `commands.plugins: true` واستخدم:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

يستخدم مسار التثبيت محلل المصدر نفسه مثل CLI: مسار/أرشيف محلي، أو
`clawhub:<pkg>` صريح، أو `npm:<pkg>` صريح، أو `git:<repo>` صريح، أو مواصفة حزمة
مجردة عبر npm.

إذا كانت الإعدادات غير صالحة، يفشل التثبيت عادةً بوضع مغلق ويوجهك إلى
`openclaw doctor --fix`. الاستثناء الوحيد للاسترداد هو مسار ضيق لإعادة تثبيت Plugin مضمّن
لـ Plugins التي تختار استخدام
`openclaw.install.allowInvalidConfigRecovery`.
أثناء بدء تشغيل Gateway، تفشل إعدادات Plugin غير الصالحة بوضع مغلق مثل أي إعدادات غير صالحة أخرى.
شغّل `openclaw doctor --fix` لعزل إعدادات Plugin السيئة عبر
تعطيل إدخال ذلك Plugin وإزالة حمولة إعداداته غير الصالحة؛ وتحافظ نسخة
الإعدادات الاحتياطية العادية على القيم السابقة.
عندما تشير إعدادات قناة إلى Plugin لم يعد قابلًا للاكتشاف لكن
معرّف Plugin القديم نفسه لا يزال موجودًا في إعدادات Plugin أو سجلات التثبيت، يسجل بدء تشغيل Gateway
تحذيرات ويتخطى تلك القناة بدلًا من حظر كل قناة أخرى.
شغّل `openclaw doctor --fix` لإزالة إدخالات القناة/Plugin القديمة؛ أما مفاتيح
القنوات غير المعروفة من دون دليل على Plugin قديم فلا تزال تفشل في التحقق كي تبقى
الأخطاء المطبعية مرئية.
إذا تم ضبط `plugins.enabled: false`، تُعامل مراجع Plugin القديمة كخامدة:
يتخطى بدء تشغيل Gateway عمل اكتشاف/تحميل Plugins، ويحافظ `openclaw doctor`
على إعدادات Plugin المعطّلة بدل إزالتها تلقائيًا. أعد تفعيل Plugins قبل
تشغيل تنظيف doctor إذا أردت إزالة معرّفات Plugin القديمة.

لا يحدث تثبيت تبعيات Plugin إلا أثناء مسارات التثبيت/التحديث الصريحة أو
إصلاح doctor. لا يشغّل بدء تشغيل Gateway، أو إعادة تحميل الإعدادات، أو فحص وقت التشغيل
مديري الحزم ولا يصلح أشجار التبعيات. يجب أن تكون تبعيات Plugins المحلية
مثبتة مسبقًا، بينما تُثبت Plugins من npm وgit وClawHub
ضمن جذور Plugins المُدارة من OpenClaw. قد تُرفع تبعيات npm
ضمن جذر npm المُدار من OpenClaw؛ يمسح التثبيت/التحديث ذلك الجذر المُدار قبل
الثقة، وتزيل عملية إلغاء التثبيت الحزم المُدارة بواسطة npm عبر npm. يجب أن تظل Plugins
الخارجية ومسارات التحميل المخصصة مثبتة عبر `openclaw plugins install`.
استخدم `openclaw plugins list --json` لرؤية `dependencyStatus` الثابت لكل
Plugin مرئي من دون استيراد شيفرة وقت التشغيل أو إصلاح التبعيات.
راجع [حل تبعيات Plugin](/ar/plugins/dependency-resolution) لمعرفة
دورة الحياة وقت التثبيت.

بالنسبة إلى تثبيتات npm، تُحل المحددات القابلة للتغيير مثل `latest` أو dist-tag
قبل التثبيت ثم تُثبّت على الإصدار الدقيق الذي تم التحقق منه في جذر npm
المُدار من OpenClaw. بعد انتهاء npm، يتحقق OpenClaw من أن إدخال
`package-lock.json` المثبت لا يزال يطابق الإصدار المحلول والسلامة. إذا
كتب npm بيانات وصفية مختلفة للحزمة، يفشل التثبيت ويُعاد الجذر المُدار إلى حالته السابقة
بدل قبول أثر Plugin مختلف.

عمليات سحب المصدر هي مساحات عمل pnpm. إذا استنسخت OpenClaw للعمل على Plugins المضمّنة،
فشغّل `pnpm install`؛ عندها يحمّل OpenClaw Plugins المضمّنة من
`extensions/<id>` لكي تُستخدم التعديلات والتبعيات المحلية للحزمة مباشرةً.
تثبيتات جذر npm العادية مخصصة لـ OpenClaw المحزّم، لا لتطوير
عمليات سحب المصدر.

## أنواع Plugin

يتعرف OpenClaw على صيغتين لـ Plugin:

| الصيغة     | آلية العمل                                                       | أمثلة                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **أصلية** | `openclaw.plugin.json` + وحدة وقت تشغيل؛ تُنفّذ داخل العملية       | Plugins الرسمية، وحزم npm المجتمعية               |
| **حزمة** | تخطيط متوافق مع Codex/Claude/Cursor؛ يُطابق مع ميزات OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

تظهر الصيغتان كلتاهما ضمن `openclaw plugins list`. راجع [حزم Plugin](/ar/plugins/bundles) لتفاصيل الحزم.

إذا كنت تكتب Plugin أصليًا، فابدأ بـ [بناء Plugins](/ar/plugins/building-plugins)
و[نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

## نقاط دخول الحزمة

يجب أن تصرّح حزم npm الخاصة بـ Plugin الأصلية عن `openclaw.extensions` في `package.json`.
يجب أن يبقى كل إدخال داخل دليل الحزمة وأن يُحل إلى ملف
وقت تشغيل قابل للقراءة، أو إلى ملف مصدر TypeScript مع نظير JavaScript مبني
مستنتج مثل `src/index.ts` إلى `dist/index.js`.
يجب أن تشحن التثبيتات المحزّمة خرج وقت تشغيل JavaScript ذلك. أما الاحتياطي
لمصدر TypeScript فهو لعمليات سحب المصدر ومسارات التطوير المحلية، وليس
لحزم npm المثبتة في جذر Plugin المُدار من OpenClaw.

استخدم `openclaw.runtimeExtensions` عندما لا تكون ملفات وقت التشغيل المنشورة في
المسارات نفسها مثل إدخالات المصدر. عند وجود `runtimeExtensions`، يجب أن يحتوي
على إدخال واحد بالضبط لكل إدخال في `extensions`. تفشل القوائم غير المتطابقة في التثبيت
واكتشاف Plugin بدل الرجوع بصمت إلى مسارات المصدر. إذا كنت تنشر أيضًا
`openclaw.setupEntry`، فاستخدم `openclaw.runtimeSetupEntry` لنظيره
JavaScript المبني؛ ويكون ذلك الملف مطلوبًا عند التصريح به.

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

ClawHub هو مسار التوزيع الأساسي لمعظم Plugins. إصدارات OpenClaw المحزّمة الحالية
تضمّن بالفعل العديد من Plugins الرسمية، لذلك لا تحتاج هذه إلى
تثبيتات npm منفصلة في الإعدادات العادية. إلى أن تنتقل كل Plugins المملوكة لـ OpenClaw
إلى ClawHub، لا يزال OpenClaw يشحن بعض حزم Plugin من `@openclaw/*` على
npm للتثبيتات الأقدم/المخصصة وسير عمل npm المباشر.

إذا أبلغ npm عن حزمة Plugin من `@openclaw/*` بأنها مهملة، فذلك الإصدار
من مسار حزم خارجي أقدم. استخدم Plugin المضمّن من
OpenClaw الحالي أو عملية سحب محلية إلى أن تُنشر حزمة npm أحدث.

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

### الأساسية (تُشحَن مع OpenClaw)

<AccordionGroup>
  <Accordion title="موفرو النماذج (مفعّلون افتراضيًا)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins الذاكرة">
    - `memory-core` — بحث الذاكرة المضمّن (افتراضي عبر `plugins.slots.memory`)
    - `memory-lancedb` — ذاكرة طويلة الأمد مدعومة بـ LanceDB مع الاستدعاء/الالتقاط التلقائي (اضبط `plugins.slots.memory = "memory-lancedb"`)

    راجع [Memory LanceDB](/ar/plugins/memory-lancedb) لإعداد التضمين المتوافق مع OpenAI،
    وأمثلة Ollama، وحدود الاستدعاء، واستكشاف الأخطاء وإصلاحها.

  </Accordion>

  <Accordion title="موفرو الكلام (مفعّلون افتراضيًا)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="أخرى">
    - `browser` — Plugin المتصفح المضمّن لأداة المتصفح، وCLI `openclaw browser`، وطريقة Gateway `browser.request`، ووقت تشغيل المتصفح، وخدمة التحكم الافتراضية في المتصفح (مفعّل افتراضيًا؛ عطّله قبل استبداله)
    - `copilot-proxy` — جسر VS Code Copilot Proxy (معطّل افتراضيًا)

  </Accordion>
</AccordionGroup>

هل تبحث عن Plugins تابعة لجهات خارجية؟ راجع [Plugins المجتمع](/ar/plugins/community).

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
| `enabled`        | مفتاح التفعيل الرئيسي (الافتراضي: `true`)                           |
| `allow`          | قائمة السماح للـ Plugin (اختيارية)                               |
| `deny`           | قائمة الرفض للـ Plugin (اختيارية؛ الرفض له الأولوية)                     |
| `load.paths`     | ملفات/أدلة Plugin إضافية                            |
| `slots`          | محددات الفتحات الحصرية (مثل `memory`، `contextEngine`) |
| `entries.\<id\>` | مفاتيح تفعيل لكل Plugin + إعدادات                               |

`plugins.allow` حصرية. عندما تكون غير فارغة، يمكن فقط للـ Plugins المدرجة أن تُحمّل
أو تعرض الأدوات، حتى لو كان `tools.allow` يحتوي على `"*"` أو اسم أداة محددة
مملوكة لـ Plugin. إذا كانت قائمة سماح الأدوات تشير إلى أدوات Plugin، فأضف معرفات Plugins المالكة
إلى `plugins.allow` أو أزل `plugins.allow`؛ يحذر `openclaw doctor` من هذا
الشكل.

تؤدي تغييرات الإعدادات التي تُجرى عبر `/plugins enable` أو `/plugins disable` إلى إعادة تحميل
Plugin داخل عملية Gateway. تعيد لفّات الوكيل الجديدة بناء قائمة أدواتها من
سجل Plugins المحدّث. أما العمليات التي تغيّر المصدر، مثل التثبيت
والتحديث وإلغاء التثبيت، فما زالت تعيد تشغيل عملية Gateway لأن وحدات
Plugin التي تم استيرادها بالفعل لا يمكن استبدالها بأمان في مكانها.

`openclaw plugins list` هي لقطة محلية لسجل/إعدادات Plugins. يعني وجود Plugin بحالة
`enabled` هناك أن السجل المحفوظ والإعدادات الحالية يسمحان للـ
Plugin بالمشاركة. لا يثبت ذلك أن Gateway بعيدة قيد التشغيل بالفعل
أعادت التحميل أو التشغيل إلى رمز Plugin نفسه. في إعدادات VPS/الحاويات
مع عمليات التغليف، أرسل عمليات إعادة التشغيل أو الكتابات التي تشغّل إعادة التحميل إلى عملية
`openclaw gateway run` الفعلية، أو استخدم `openclaw gateway restart` ضد
Gateway قيد التشغيل عندما يبلغ إعادة التحميل عن فشل.

<Accordion title="حالات Plugin: معطّل مقابل مفقود مقابل غير صالح">
  - **معطّل**: يوجد Plugin لكن قواعد التفعيل أوقفته. تُحفظ الإعدادات.
  - **مفقود**: تشير الإعدادات إلى معرف Plugin لم يعثر عليه الاكتشاف.
  - **غير صالح**: يوجد Plugin لكن إعداداته لا تطابق المخطط المعلن. يتجاوز بدء تشغيل Gateway ذلك الـ Plugin فقط؛ يمكن لـ `openclaw doctor --fix` عزل الإدخال غير الصالح بتعطيله وإزالة حمولة إعداداته.

</Accordion>

## الاكتشاف والأولوية

يفحص OpenClaw وجود Plugins بهذا الترتيب (أول تطابق يفوز):

<Steps>
  <Step title="مسارات الإعدادات">
    `plugins.load.paths` — مسارات ملفات أو أدلة صريحة. يتم تجاهل المسارات التي تشير
    مرة أخرى إلى أدلة Plugins المجمّعة الخاصة بحزمة OpenClaw نفسها؛
    شغّل `openclaw doctor --fix` لإزالة تلك الأسماء المستعارة القديمة.
  </Step>

  <Step title="Plugins مساحة العمل">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins العامة">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins المجمّعة">
    تُشحن مع OpenClaw. كثير منها مفعّل افتراضياً (مزودو النماذج، الكلام).
    ويتطلب غيرها تفعيلًا صريحًا.
  </Step>
</Steps>

تحلّ التثبيتات المعبأة وصور Docker عادةً Plugins المجمّعة من شجرة
`dist/extensions` المترجمة. إذا تم ربط دليل مصدر Plugin مجمّع
فوق مسار المصدر المعبأ المطابق، على سبيل المثال
`/app/extensions/synology-chat`، فإن OpenClaw يتعامل مع دليل المصدر المثبّت ذلك
كتراكب مصدر مجمّع ويكتشفه قبل حزمة
`/app/dist/extensions/synology-chat` المعبأة. يحافظ هذا على عمل
حلقات حاويات الصيانة من دون إعادة كل Plugin مجمّع إلى مصدر TypeScript.
عيّن `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` لفرض استخدام حزم dist المعبأة
حتى عند وجود عمليات تركيب تراكب المصدر.

### قواعد التفعيل

- `plugins.enabled: false` يعطّل كل Plugins ويتجاوز عمل اكتشاف/تحميل Plugins
- `plugins.deny` له الأولوية دائمًا على السماح
- `plugins.entries.\<id\>.enabled: false` يعطّل ذلك الـ Plugin
- Plugins القادمة من مساحة العمل **معطّلة افتراضيًا** (يجب تفعيلها صراحة)
- تتبع Plugins المجمّعة مجموعة التفعيل الافتراضي المدمجة ما لم يتم تجاوزها
- يمكن للفتحات الحصرية أن تفرض تفعيل Plugin المحدد لتلك الفتحة
- تُفعّل بعض Plugins المجمّعة الاختيارية تلقائيًا عندما تسمي الإعدادات سطحًا
  مملوكًا لـ Plugin، مثل مرجع نموذج مزود أو إعداد قناة أو وقت تشغيل حاضنة
- تُحفظ إعدادات Plugin القديمة أثناء نشاط `plugins.enabled: false`؛
  أعد تفعيل Plugins قبل تشغيل تنظيف doctor إذا أردت إزالة المعرفات القديمة
- تحتفظ مسارات Codex من عائلة OpenAI بحدود Plugin منفصلة:
  `openai-codex/*` يخص OpenAI Plugin، بينما يتم اختيار Plugin خادم تطبيقات Codex
  المجمّع بواسطة `agentRuntime.id: "codex"` أو مراجع نماذج
  `codex/*` القديمة

## استكشاف أخطاء خطاطيف وقت التشغيل وإصلاحها

إذا ظهر Plugin في `plugins list` لكن الآثار الجانبية أو الخطاطيف الخاصة بـ `register(api)`
لا تعمل في حركة المحادثة المباشرة، فتحقق من هذه أولًا:

- شغّل `openclaw gateway status --deep --require-rpc` وتأكد أن عنوان URL النشط لـ
  Gateway والملف الشخصي ومسار الإعدادات والعملية هي التي تعدّلها.
- أعد تشغيل Gateway المباشر بعد تغييرات تثبيت/إعداد/رمز Plugin. في حاويات التغليف،
  قد يكون PID 1 مجرد مشرف؛ أعد تشغيل العملية الفرعية
  `openclaw gateway run` أو أرسل إليها إشارة.
- استخدم `openclaw plugins inspect <id> --runtime --json` لتأكيد تسجيلات الخطاطيف و
  التشخيصات. تحتاج خطاطيف المحادثة غير المجمّعة مثل `llm_input`،
  `llm_output`، `before_agent_finalize`، و `agent_end` إلى
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- لتبديل النماذج، فضّل `before_model_resolve`. يعمل قبل حل النموذج
  للفّات الوكيل؛ يعمل `llm_output` فقط بعد أن تنتج محاولة نموذج
  مخرجات مساعد.
- لإثبات نموذج الجلسة الفعال، استخدم `openclaw sessions` أو أسطح
  الجلسة/الحالة في Gateway، وعند تصحيح حمولات المزود، ابدأ
  Gateway مع `--raw-stream --raw-stream-path <path>`.

### إعداد أدوات Plugin البطيء

إذا بدت لفّات الوكيل متوقفة أثناء تحضير الأدوات، ففعّل تسجيل التتبع وتحقق
من أسطر توقيت مصنع أدوات Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

ابحث عن:

```text
[trace:plugin-tools] factory timings ...
```

يسرد الملخص إجمالي وقت المصنع وأبطأ مصانع أدوات Plugin،
بما في ذلك معرف Plugin، وأسماء الأدوات المعلنة، وشكل النتيجة، وما إذا كانت الأداة
اختيارية. تُرقّى الأسطر البطيئة إلى تحذيرات عندما يستغرق مصنع واحد
ثانية واحدة على الأقل أو يستغرق إجمالي تحضير مصنع أدوات Plugin خمس ثوانٍ على الأقل.

يخزّن OpenClaw نتائج مصنع أدوات Plugin الناجحة مؤقتًا لعمليات الحل المتكررة
مع سياق الطلب الفعال نفسه. يتضمن مفتاح التخزين المؤقت إعداد وقت التشغيل
الفعال، ومساحة العمل، ومعرفات الوكيل/الجلسة، وسياسة الصندوق الرملي، وإعدادات المتصفح،
وسياق التسليم، وهوية الطالب، وحالة الملكية، لذا تُعاد تشغيل المصانع التي
تعتمد على تلك الحقول الموثوقة عندما يتغير السياق.

إذا سيطر Plugin واحد على التوقيت، فافحص تسجيلات وقت التشغيل الخاصة به:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

ثم حدّث ذلك الـ Plugin أو أعد تثبيته أو عطّله. يجب على مؤلفي Plugins نقل
تحميل الاعتماديات المكلف إلى خلف مسار تنفيذ الأداة بدلًا من القيام به
داخل مصنع الأداة.

### تكرار ملكية القناة أو الأداة

الأعراض:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

تعني هذه أن أكثر من Plugin مفعّل يحاول امتلاك القناة نفسها،
أو تدفق الإعداد نفسه، أو اسم الأداة نفسه. السبب الأكثر شيوعًا هو وجود Plugin قناة خارجي
مثبت بجانب Plugin مجمّع يوفر الآن معرف القناة نفسه.

خطوات التصحيح:

- شغّل `openclaw plugins list --enabled --verbose` لرؤية كل Plugin مفعّل
  وأصله.
- شغّل `openclaw plugins inspect <id> --runtime --json` لكل Plugin مشتبه به و
  قارن `channels`، و `channelConfigs`، و `tools`، والتشخيصات.
- شغّل `openclaw plugins registry --refresh` بعد تثبيت حزم Plugin أو إزالتها
  كي تعكس البيانات الوصفية المحفوظة التثبيت الحالي.
- أعد تشغيل Gateway بعد تغييرات التثبيت أو السجل أو الإعدادات.

خيارات الإصلاح:

- إذا كان أحد Plugins يستبدل آخر عمدًا لمعرف القناة نفسه، فيجب على
  Plugin المفضّل إعلان `channelConfigs.<channel-id>.preferOver` مع
  معرف Plugin الأقل أولوية. راجع [/plugins/manifest#replacing-another-channel-plugin](/ar/plugins/manifest#replacing-another-channel-plugin).
- إذا كان التكرار عرضيًا، فعطّل أحد الطرفين باستخدام
  `plugins.entries.<plugin-id>.enabled: false` أو أزل تثبيت Plugin
  القديم.
- إذا فعّلت كلا الـ Plugins صراحةً، يحتفظ OpenClaw بذلك الطلب و
  يبلغ عن التعارض. اختر مالكًا واحدًا للقناة أو أعد تسمية الأدوات المملوكة لـ Plugin
  بحيث يكون سطح وقت التشغيل غير ملتبس.

## فتحات Plugin (فئات حصرية)

بعض الفئات حصرية (واحدة نشطة فقط في كل مرة):

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

| الفتحة            | ما تتحكم به      | الافتراضي             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin الذاكرة النشطة  | `memory-core`       |
| `contextEngine` | محرك السياق النشط | `legacy` (مدمج) |

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

openclaw plugins install <package>         # install from npm by default
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

تأتي plugins المضمّنة مع OpenClaw. يكون العديد منها مفعّلًا افتراضيًا (على سبيل المثال
موفّرو النماذج المضمّنون، وموفّرو الكلام المضمّنون، وPlugin المتصفح
المضمّن). لا تزال plugins مضمّنة أخرى تحتاج إلى `openclaw plugins enable <id>`.

يستبدل `--force` أي Plugin أو حزمة hook مثبّتة موجودة في مكانها. استخدم
`openclaw plugins update <id-or-npm-spec>` للترقيات الروتينية لـ npm
plugins المتتبّعة. لا يكون مدعومًا مع `--link`، الذي يعيد استخدام مسار المصدر بدلًا
من النسخ فوق هدف تثبيت مُدار.

عندما تكون `plugins.allow` مضبوطة بالفعل، يضيف `openclaw plugins install`
معرّف Plugin المثبّت إلى قائمة السماح تلك قبل تفعيله. إذا كان معرّف Plugin نفسه
موجودًا في `plugins.deny`، تزيل عملية التثبيت إدخال المنع القديم ذلك لكي يصبح
التثبيت الصريح قابلًا للتحميل فورًا بعد إعادة التشغيل.

يحتفظ OpenClaw بسجل Plugin محلي دائم بصفته نموذج القراءة الباردة لمخزون
Plugin، وملكية المساهمات، وتخطيط بدء التشغيل. تقوم مسارات التثبيت، والتحديث،
وإلغاء التثبيت، والتفعيل، والتعطيل بتحديث ذلك السجل بعد تغيير حالة Plugin. يحتفظ
ملف `plugins/installs.json` نفسه ببيانات تعريف التثبيت الدائمة في
`installRecords` ذات المستوى الأعلى وبيانات تعريف manifest القابلة لإعادة البناء
في `plugins`. إذا كان السجل مفقودًا، أو قديمًا، أو غير صالح، فإن
`openclaw plugins registry --refresh` يعيد بناء عرض manifest الخاص به من
سجلات التثبيت، وسياسة الإعدادات، وبيانات تعريف manifest/package من دون تحميل
وحدات وقت تشغيل Plugin.
ينطبق `openclaw plugins update <id-or-npm-spec>` على التثبيتات المتتبّعة. عند
تمرير مواصفة حزمة npm تحتوي على dist-tag أو إصدار دقيق، يتم حل اسم الحزمة
مرة أخرى إلى سجل Plugin المتتبّع وتسجيل المواصفة الجديدة للتحديثات المستقبلية.
يؤدي تمرير اسم الحزمة من دون إصدار إلى نقل تثبيت مثبّت بدقة إلى خط الإصدار
الافتراضي للسجل. إذا كان npm Plugin المثبّت يطابق بالفعل الإصدار المحلول وهوية
الأثر المسجّلة، يتخطى OpenClaw التحديث من دون تنزيل أو إعادة تثبيت أو إعادة
كتابة الإعدادات.
عندما يعمل `openclaw update` على قناة beta، تحاول سجلات npm وClawHub
Plugin الموجودة على الخط الافتراضي استخدام `@beta` أولًا ثم تعود إلى
default/latest عندما لا يوجد إصدار beta من Plugin. تبقى الإصدارات الدقيقة
والوسوم الصريحة مثبّتة.

`--pin` مخصص لـ npm فقط. لا يكون مدعومًا مع `--marketplace`، لأن تثبيتات
marketplace تحفظ بيانات تعريف مصدر marketplace بدلًا من مواصفة npm.

`--dangerously-force-unsafe-install` هو تجاوز كسر زجاج للحالات الإيجابية
الخاطئة من ماسح الشيفرة الخطرة المدمج. يسمح بتثبيتات Plugin وتحديثات Plugin
بالمتابعة بعد نتائج `critical` المدمجة، لكنه لا يزال لا يتجاوز حظر سياسة
`before_install` الخاصة بـ Plugin أو الحظر الناتج عن فشل المسح. تتجاهل فحوصات
التثبيت ملفات وأدلة الاختبارات الشائعة مثل `tests/`، و`__tests__/`،
و`*.test.*`، و`*.spec.*` لتجنب حظر محاكيات الاختبار المعبأة؛ وتظل نقاط دخول
وقت تشغيل Plugin المعلنة مفحوصة حتى إذا استخدمت أحد تلك الأسماء.

ينطبق علم CLI هذا على مسارات تثبيت/تحديث Plugin فقط. تستخدم تثبيتات تبعيات
Skills المدعومة بـ Gateway تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`
بدلًا من ذلك، بينما يظل `openclaw skills install` مسار تنزيل/تثبيت Skills
المنفصل من ClawHub.

إذا كان Plugin نشرته على ClawHub مخفيًا أو محظورًا بواسطة فحص، فافتح لوحة
تحكم ClawHub أو شغّل `clawhub package rescan <name>` لطلب أن يفحصه ClawHub
مرة أخرى. يؤثر `--dangerously-force-unsafe-install` فقط على التثبيتات على
جهازك؛ ولا يطلب من ClawHub إعادة فحص Plugin أو جعل إصدار محظور عامًا.

تشارك الحزم المتوافقة في مسار القائمة/الفحص/التفعيل/التعطيل نفسه الخاص بـ Plugin.
يشمل دعم وقت التشغيل الحالي Skills الحزم، وClaude command-skills، وافتراضيات
Claude `settings.json`، وافتراضيات Claude `.lsp.json` و`lspServers` المعلنة في
manifest، وCursor command-skills، وأدلة hook المتوافقة مع Codex.

يعرض `openclaw plugins inspect <id>` أيضًا قدرات الحزمة المكتشفة بالإضافة إلى
إدخالات خوادم MCP وLSP المدعومة أو غير المدعومة لـ plugins المدعومة بالحزم.

يمكن أن تكون مصادر marketplace اسم marketplace معروفًا لدى Claude من
`~/.claude/plugins/known_marketplaces.json`، أو جذر marketplace محليًا أو مسار
`marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع
GitHub، أو عنوان URL لـ git. بالنسبة إلى marketplaces البعيدة، يجب أن تبقى
إدخالات Plugin داخل مستودع marketplace المستنسخ وأن تستخدم مصادر مسارات نسبية فقط.

راجع [مرجع CLI لـ `openclaw plugins`](/ar/cli/plugins) للحصول على التفاصيل الكاملة.

## نظرة عامة على واجهة Plugin API

تصدّر plugins الأصلية كائن دخول يوفّر `register(api)`. قد لا تزال plugins
الأقدم تستخدم `activate(api)` كاسم مستعار قديم، لكن يجب على plugins الجديدة
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

يحمّل OpenClaw كائن الدخول ويستدعي `register(api)` أثناء تفعيل Plugin. لا يزال
المحمّل يعود إلى `activate(api)` من أجل plugins الأقدم، لكن يجب على plugins
المضمّنة وplugins الخارجية الجديدة التعامل مع `register` بصفته العقد العام.

يخبر `api.registrationMode` الـ Plugin لماذا يتم تحميل دخوله:

| الوضع            | المعنى                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | تفعيل وقت التشغيل. سجّل الأدوات، وhooks، والخدمات، والأوامر، والمسارات، وغيرها من الآثار الجانبية الحية.                              |
| `discovery`     | اكتشاف قدرات للقراءة فقط. سجّل الموفّرين وبيانات التعريف؛ قد يتم تحميل شيفرة دخول Plugin الموثوقة، لكن تخطَّ الآثار الجانبية الحية. |
| `setup-only`    | تحميل بيانات تعريف إعداد القناة عبر دخول إعداد خفيف.                                                                |
| `setup-runtime` | تحميل إعداد القناة الذي يحتاج أيضًا إلى دخول وقت التشغيل.                                                                         |
| `cli-metadata`  | جمع بيانات تعريف أوامر CLI فقط.                                                                                            |

يجب على مداخل Plugin التي تفتح sockets، أو قواعد بيانات، أو عمّال خلفية، أو
عملاء طويلي العمر أن تحرس تلك الآثار الجانبية باستخدام
`api.registrationMode === "full"`. تُخزّن تحميلات الاكتشاف مؤقتًا بشكل منفصل عن
تحميلات التفعيل ولا تستبدل سجل Gateway الجاري. الاكتشاف غير مُفعِّل، لكنه ليس
خالياً من الاستيراد: قد يقيّم OpenClaw دخول Plugin الموثوق أو وحدة Plugin
الخاصة بالقناة لبناء اللقطة. أبقِ المستويات العليا للوحدات خفيفة وخالية من
الآثار الجانبية، وانقل عملاء الشبكة، والعمليات الفرعية، والمستمعين، وقراءات
بيانات الاعتماد، وبدء تشغيل الخدمات خلف مسارات وقت التشغيل الكامل.

طرق التسجيل الشائعة:

| الطريقة                                  | ما تسجّله           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | موفّر نموذج (LLM)        |
| `registerChannel`                       | قناة محادثة                |
| `registerTool`                          | أداة Agent                  |
| `registerHook` / `on(...)`              | hooks دورة الحياة             |
| `registerSpeechProvider`                | تحويل النص إلى كلام / STT        |
| `registerRealtimeTranscriptionProvider` | STT متدفق               |
| `registerRealtimeVoiceProvider`         | صوت فوري ثنائي الاتجاه       |
| `registerMediaUnderstandingProvider`    | تحليل الصور/الصوت        |
| `registerImageGenerationProvider`       | توليد الصور            |
| `registerMusicGenerationProvider`       | توليد الموسيقى            |
| `registerVideoGenerationProvider`       | توليد الفيديو            |
| `registerWebFetchProvider`              | موفّر جلب / كشط الويب |
| `registerWebSearchProvider`             | بحث الويب                  |
| `registerHttpRoute`                     | نقطة نهاية HTTP               |
| `registerCommand` / `registerCli`       | أوامر CLI                |
| `registerContextEngine`                 | محرك سياق              |
| `registerService`                       | خدمة خلفية          |

سلوك الحراسة لـ hooks دورة الحياة ذات الأنواع:

- `before_tool_call`: تكون `{ block: true }` نهائية؛ يتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: تكون `{ block: false }` بلا أثر ولا تزيل حظرًا سابقًا.
- `before_install`: تكون `{ block: true }` نهائية؛ يتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_install`: تكون `{ block: false }` بلا أثر ولا تزيل حظرًا سابقًا.
- `message_sending`: تكون `{ cancel: true }` نهائية؛ يتم تخطي المعالجات ذات الأولوية الأدنى.
- `message_sending`: تكون `{ cancel: false }` بلا أثر ولا تزيل إلغاءً سابقًا.

يشغّل خادم تطبيق Codex الأصلي جسراً يعيد أحداث أدوات Codex الأصلية إلى سطح
hook هذا. يمكن لـ plugins حظر أدوات Codex الأصلية عبر `before_tool_call`،
ومراقبة النتائج عبر `after_tool_call`، والمشاركة في موافقات Codex
`PermissionRequest`. لا يعيد الجسر كتابة معاملات أدوات Codex الأصلية بعد.
يعيش حد دعم وقت تشغيل Codex الدقيق في
[عقد دعم Codex harness v1](/ar/plugins/codex-harness#v1-support-contract).

للاطلاع على سلوك hook كامل الأنواع، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#hook-decision-semantics).

## ذات صلة

- [بناء plugins](/ar/plugins/building-plugins) — أنشئ Plugin الخاص بك
- [حزم Plugin](/ar/plugins/bundles) — توافق حزم Codex/Claude/Cursor
- [Manifest الخاص بـ Plugin](/ar/plugins/manifest) — مخطط manifest
- [تسجيل الأدوات](/ar/plugins/building-plugins#registering-agent-tools) — أضف أدوات Agent في Plugin
- [داخليات Plugin](/ar/plugins/architecture) — نموذج القدرات ومسار التحميل
- [plugins المجتمع](/ar/plugins/community) — قوائم الطرف الثالث
