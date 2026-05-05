---
read_when:
    - تثبيت Plugin أو تكوينه
    - فهم قواعد اكتشاف Plugin وتحميله
    - العمل مع حزم Plugin المتوافقة مع Codex/Claude
sidebarTitle: Install and Configure
summary: ثبّت Plugins OpenClaw وتهيئتها وإدارتها
title: الإضافات
x-i18n:
    generated_at: "2026-05-05T01:52:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1de640f7766a6b312a2385075ae1abdb19f5c2afcb0e7063eba0d3edde697004
    source_path: tools/plugin.md
    workflow: 16
---

توسّع Plugins إمكانات OpenClaw بقدرات جديدة: القنوات، ومزوّدو النماذج،
وأطر تشغيل الوكلاء، والأدوات، وSkills، والكلام، والنسخ الفوري، والصوت الفوري،
وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب، والبحث في الويب،
والمزيد. بعض Plugins هي **أساسية** (تُشحن مع OpenClaw)، وأخرى
**خارجية**. تُنشر معظم Plugins الخارجية وتُكتشف عبر
[ClawHub](/ar/tools/clawhub). يظل npm مدعومًا للتثبيت المباشر ولمجموعة
مؤقتة من حزم Plugin المملوكة لـ OpenClaw إلى أن تكتمل عملية الانتقال هذه.

## البدء السريع

لأمثلة التثبيت والنسخ واللصق، والسرد، وإلغاء التثبيت، والتحديث، والنشر، راجع
[إدارة Plugins](/ar/plugins/manage-plugins).

<Steps>
  <Step title="معرفة ما تم تحميله">
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

  <Step title="إدارة أصلية من الدردشة">
    في Gateway قيد التشغيل، يؤدي أمرا `/plugins enable` و`/plugins disable`
    المتاحان للمالك فقط إلى تشغيل معيد تحميل إعدادات Gateway. يعيد Gateway تحميل أسطح
    تشغيل Plugin داخل العملية، وتعيد دورات الوكيل الجديدة بناء قائمة أدواتها من
    السجل المحدّث. يغيّر `/plugins install` الشيفرة المصدرية لـ Plugin، لذلك يطلب
    Gateway إعادة تشغيل بدلًا من الإيحاء بأن العملية الحالية تستطيع إعادة تحميل
    الوحدات المستوردة مسبقًا بأمان.

  </Step>

  <Step title="التحقق من Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    استخدم `--runtime` عندما تحتاج إلى إثبات الأدوات المسجّلة أو الخدمات أو طرائق
    Gateway أو الخطافات أو أوامر CLI المملوكة لـ Plugin. أما `inspect` العادي فهو
    فحص بارد للبيان/السجل ويتجنب عمدًا استيراد وقت تشغيل Plugin.

  </Step>
</Steps>

إذا كنت تفضّل التحكم الأصلي من الدردشة، فعّل `commands.plugins: true` واستخدم:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

يستخدم مسار التثبيت محلّل المصدر نفسه الذي يستخدمه CLI: مسار/أرشيف محلي، أو
`clawhub:<pkg>` صريح، أو `npm:<pkg>` صريح، أو `git:<repo>` صريح، أو مواصفة
حزمة مجردة عبر npm.

إذا كانت الإعدادات غير صالحة، يفشل التثبيت عادةً بشكل مغلق ويوجهك إلى
`openclaw doctor --fix`. الاستثناء الوحيد للتعافي هو مسار ضيق لإعادة تثبيت
Plugin مضمّن خاص بـ Plugins التي تختار استخدام
`openclaw.install.allowInvalidConfigRecovery`.
أثناء بدء تشغيل Gateway، تفشل إعدادات Plugin غير الصالحة بشكل مغلق مثل أي إعدادات
أخرى غير صالحة. شغّل `openclaw doctor --fix` لعزل إعدادات Plugin السيئة عبر
تعطيل إدخال ذلك Plugin وإزالة حمولة إعداداته غير الصالحة؛ وتحتفظ النسخة
الاحتياطية العادية للإعدادات بالقيم السابقة.
عندما تشير إعدادات قناة إلى Plugin لم يعد قابلاً للاكتشاف بينما يظل معرّف Plugin
القديم نفسه موجودًا في إعدادات Plugin أو سجلات التثبيت، يسجّل بدء تشغيل Gateway
تحذيرات ويتخطى تلك القناة بدلًا من حظر كل القنوات الأخرى.
شغّل `openclaw doctor --fix` لإزالة إدخالات القناة/Plugin القديمة؛ أما مفاتيح
القنوات المجهولة التي لا يوجد دليل على أنها تخص Plugin قديمًا فما زالت تفشل
التحقق حتى تبقى الأخطاء المطبعية مرئية.
إذا ضُبط `plugins.enabled: false`، تُعامل مراجع Plugin القديمة كخاملة:
يتخطى بدء تشغيل Gateway عمل اكتشاف/تحميل Plugin ويحافظ `openclaw doctor` على
إعدادات Plugin المعطلة بدلًا من إزالتها تلقائيًا. أعد تفعيل Plugins قبل تشغيل
تنظيف doctor إذا أردت إزالة معرّفات Plugin القديمة.

لا يحدث تثبيت تبعيات Plugin إلا أثناء تدفقات التثبيت/التحديث الصريحة أو إصلاح
doctor. لا يشغّل بدء تشغيل Gateway، أو إعادة تحميل الإعدادات، أو فحص وقت التشغيل
مديري الحزم ولا يصلح أشجار التبعيات. يجب أن تكون تبعيات Plugins المحلية مثبتة
مسبقًا، بينما تُثبت Plugins من npm وgit وClawHub تحت جذور Plugin المُدارة من
OpenClaw. قد تُرفع تبعيات npm ضمن جذر npm المُدار من OpenClaw؛ ويفحص
التثبيت/التحديث ذلك الجذر المُدار قبل الثقة، وتزيل عملية إلغاء التثبيت الحزم
المُدارة من npm عبر npm. يجب أن تظل Plugins الخارجية ومسارات التحميل المخصصة
مثبتة عبر `openclaw plugins install`.
استخدم `openclaw plugins list --json` لرؤية `dependencyStatus` الثابتة لكل
Plugin مرئي دون استيراد شيفرة وقت التشغيل أو إصلاح التبعيات.
راجع [حل تبعيات Plugin](/ar/plugins/dependency-resolution) لدورة حياة وقت التثبيت.

بالنسبة إلى تثبيتات npm، تُحل المحددات القابلة للتغيير مثل `latest` أو dist-tag
قبل التثبيت ثم تُثبت إلى الإصدار الدقيق الذي تم التحقق منه في جذر npm المُدار من
OpenClaw. بعد انتهاء npm، يتحقق OpenClaw من أن إدخال `package-lock.json` المثبت
ما زال يطابق الإصدار المحلول والنزاهة. إذا كتب npm بيانات وصفية مختلفة للحزمة،
يفشل التثبيت ويُعاد التراجع عن الحزمة المُدارة بدلًا من قبول أداة Plugin مختلفة.

عمليات سحب المصدر هي مساحات عمل pnpm. إذا نسخت OpenClaw للتعديل على Plugins
المضمّنة، شغّل `pnpm install`؛ عندها يحمّل OpenClaw Plugins المضمّنة من
`extensions/<id>` بحيث تُستخدم التعديلات والتبعيات المحلية للحزمة مباشرة.
تثبيتات جذر npm العادية مخصصة لـ OpenClaw المعبأ، لا لتطوير نسخة المصدر.

## أنواع Plugin

يتعرّف OpenClaw على صيغتي Plugin:

| الصيغة     | طريقة العمل                                                       | أمثلة                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **أصلية** | `openclaw.plugin.json` + وحدة وقت تشغيل؛ تُنفّذ داخل العملية       | Plugins رسمية، حزم npm مجتمعية               |
| **حزمة** | تخطيط متوافق مع Codex/Claude/Cursor؛ يُربط بميزات OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

تظهر كلتاهما ضمن `openclaw plugins list`. راجع [حزم Plugin](/ar/plugins/bundles) لتفاصيل الحزم.

إذا كنت تكتب Plugin أصليًا، فابدأ بـ [بناء Plugins](/ar/plugins/building-plugins)
و[نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

## نقاط دخول الحزمة

يجب أن تصرّح حزم npm الخاصة بـ Plugin الأصلي عن `openclaw.extensions` في
`package.json`. يجب أن يبقى كل إدخال داخل دليل الحزمة وأن يُحل إلى ملف وقت تشغيل
قابل للقراءة، أو إلى ملف مصدر TypeScript له نظير JavaScript مبني مستنتج مثل
`src/index.ts` إلى `dist/index.js`.
يجب أن تشحن التثبيتات المعبأة مخرجات وقت تشغيل JavaScript هذه. تراجع مصدر
TypeScript مخصص لنسخ المصدر ومسارات التطوير المحلي، لا لحزم npm المثبتة في جذر
Plugin المُدار من OpenClaw.

استخدم `openclaw.runtimeExtensions` عندما لا تكون ملفات وقت التشغيل المنشورة في
المسارات نفسها مثل إدخالات المصدر. عند وجود `runtimeExtensions`، يجب أن تحتوي
بالضبط على إدخال واحد لكل إدخال في `extensions`. تؤدي القوائم غير المتطابقة إلى
فشل التثبيت واكتشاف Plugin بدلًا من الرجوع بصمت إلى مسارات المصدر. إذا نشرت أيضًا
`openclaw.setupEntry`، فاستخدم `openclaw.runtimeSetupEntry` لنظيره المبني من
JavaScript؛ ويكون ذلك الملف مطلوبًا عند التصريح به.

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
الحالية بالفعل العديد من Plugins الرسمية، لذا لا تحتاج هذه إلى تثبيتات npm
منفصلة في الإعدادات العادية. إلى أن تنتقل كل Plugin مملوكة لـ OpenClaw إلى
ClawHub، ما يزال OpenClaw يشحن بعض حزم Plugin باسم `@openclaw/*` على npm
للتثبيتات الأقدم/المخصصة وتدفقات npm المباشرة.

إذا أبلغ npm أن حزمة Plugin باسم `@openclaw/*` مهجورة، فهذا الإصدار من الحزمة
ينتمي إلى قطار حزم خارجية أقدم. استخدم Plugin المضمّن من OpenClaw الحالي أو نسخة
محلية إلى أن تُنشر حزمة npm أحدث.

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

### أساسية (تُشحن مع OpenClaw)

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
    - `memory-lancedb` — ذاكرة طويلة الأمد مدعومة بـ LanceDB مع استدعاء/التقاط تلقائيين (اضبط `plugins.slots.memory = "memory-lancedb"`)

    راجع [Memory LanceDB](/ar/plugins/memory-lancedb) لإعداد تضمين متوافق مع OpenAI،
    وأمثلة Ollama، وحدود الاستدعاء، واستكشاف الأخطاء وإصلاحها.

  </Accordion>

  <Accordion title="مزوّدو الكلام (مفعّلون افتراضيًا)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="أخرى">
    - `browser` — Plugin متصفح مضمّن لأداة المتصفح، وCLI `openclaw browser`، وطريقة Gateway `browser.request`، ووقت تشغيل المتصفح، وخدمة التحكم الافتراضية في المتصفح (مفعّل افتراضيًا؛ عطّله قبل استبداله)
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

| الحقل              | الوصف                                               |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | مفتاح التفعيل الرئيسي (الافتراضي: `true`)                           |
| `allow`            | قائمة السماح لـ Plugin (اختياري)                               |
| `bundledDiscovery` | وضع اكتشاف Plugin المضمنة (`allowlist` افتراضيًا)    |
| `deny`             | قائمة الحظر لـ Plugin (اختياري؛ الحظر له الأولوية)                     |
| `load.paths`       | ملفات/أدلة Plugin إضافية                            |
| `slots`            | محددات الخانات الحصرية (مثل `memory`، `contextEngine`) |
| `entries.\<id\>`   | مفاتيح تفعيل لكل Plugin + إعدادات                               |

`plugins.allow` حصرية. عندما لا تكون فارغة، يمكن فقط لـ Plugin المدرجة التحميل
أو عرض الأدوات، حتى إذا كان `tools.allow` يحتوي على `"*"` أو اسم أداة محددة
مملوكة لـ Plugin. إذا أشارت قائمة سماح الأدوات إلى أدوات Plugin، فأضف معرفات Plugin
المالكة إلى `plugins.allow` أو أزل `plugins.allow`؛ يحذر `openclaw doctor` من هذا
الشكل.

يكون `plugins.bundledDiscovery` افتراضيًا `"allowlist"` للإعدادات الجديدة، لذلك فإن
قائمة جرد `plugins.allow` التقييدية تحظر أيضًا Plugin مزودي الخدمة المضمنة
المحذوفة، بما في ذلك اكتشاف مزود بحث الويب وقت التشغيل. يوسم Doctor إعدادات
قوائم السماح التقييدية الأقدم بـ `"compat"` أثناء الترحيل لكي تحافظ الترقيات على
سلوك مزودي الخدمة المضمنين القديم إلى أن يختار المشغل الوضع الأكثر صرامة.
لا تزال `plugins.allow` الفارغة تُعامل كأنها غير مضبوطة/مفتوحة.

تؤدي تغييرات الإعدادات التي تتم عبر `/plugins enable` أو `/plugins disable` إلى
إعادة تحميل Plugin داخل العملية في Gateway. تعيد دورات الوكيل الجديدة بناء قائمة
أدواتها من سجل Plugin المُحدّث. لا تزال العمليات التي تغير المصدر مثل التثبيت،
والتحديث، وإلغاء التثبيت تعيد تشغيل عملية Gateway لأنه لا يمكن استبدال وحدات
Plugin التي تم استيرادها مسبقًا بأمان في مكانها.

`openclaw plugins list` هي لقطة محلية لسجل/إعدادات Plugin. تعني Plugin ذات الحالة
`enabled` هناك أن السجل المحفوظ والإعدادات الحالية يسمحان لـ Plugin بالمشاركة.
ولا يثبت ذلك أن Gateway بعيدة قيد التشغيل بالفعل قد أعادت التحميل أو التشغيل إلى
نفس كود Plugin. في إعدادات VPS/الحاويات التي تحتوي على عمليات غلاف، أرسل عمليات
إعادة التشغيل أو عمليات الكتابة التي تطلق إعادة التحميل إلى عملية
`openclaw gateway run` الفعلية، أو استخدم `openclaw gateway restart` ضد Gateway
قيد التشغيل عندما تبلغ إعادة التحميل عن فشل.

<Accordion title="حالات Plugin: معطلة مقابل مفقودة مقابل غير صالحة">
  - **معطلة**: توجد Plugin لكن قواعد التفعيل أوقفتها. تُحفظ الإعدادات.
  - **مفقودة**: تشير الإعدادات إلى معرف Plugin لم يعثر عليه الاكتشاف.
  - **غير صالحة**: توجد Plugin لكن إعداداتها لا تطابق المخطط المعلن. يتجاوز بدء تشغيل Gateway تلك Plugin فقط؛ يمكن لـ `openclaw doctor --fix` عزل الإدخال غير الصالح عن طريق تعطيله وإزالة حمولة إعداداته.

</Accordion>

## الاكتشاف والأسبقية

يفحص OpenClaw عن Plugin بهذا الترتيب (أول تطابق يفوز):

<Steps>
  <Step title="مسارات الإعدادات">
    `plugins.load.paths` — مسارات ملفات أو أدلة صريحة. يتم تجاهل المسارات التي تشير
    مرة أخرى إلى أدلة Plugin المضمنة المعبأة الخاصة بـ OpenClaw؛
    شغّل `openclaw doctor --fix` لإزالة تلك الأسماء البديلة القديمة.
  </Step>

  <Step title="Plugin مساحة العمل">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin العالمية">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin المضمنة">
    مشحونة مع OpenClaw. كثير منها مفعّل افتراضيًا (مزودو النماذج، الكلام).
    ويتطلب غيرها تفعيلًا صريحًا.
  </Step>
</Steps>

عادةً ما تحل التثبيتات المعبأة وصور Docker Plugin المضمنة من شجرة
`dist/extensions` المترجمة. إذا كان دليل مصدر Plugin مضمنة مربوطًا فوق مسار المصدر
المعبأ المطابق، على سبيل المثال `/app/extensions/synology-chat`، فإن OpenClaw
يعامل ذلك الدليل المصدر المركب كتراكب مصدر مضمن ويكتشفه قبل حزمة
`/app/dist/extensions/synology-chat` المعبأة. يحافظ هذا على عمل حلقات حاويات
المشرفين دون إعادة كل Plugin مضمنة إلى مصدر TypeScript. اضبط
`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` لفرض حزم dist المعبأة حتى عند وجود
تركيبات تراكب المصدر.

### قواعد التفعيل

- يعطل `plugins.enabled: false` كل Plugin ويتجاوز عمل اكتشاف/تحميل Plugin
- ينتصر `plugins.deny` دائمًا على السماح
- يعطل `plugins.entries.\<id\>.enabled: false` تلك Plugin
- تكون Plugin ذات أصل مساحة العمل **معطلة افتراضيًا** (يجب تفعيلها صراحة)
- تتبع Plugin المضمنة مجموعة التشغيل الافتراضية المدمجة ما لم يتم تجاوزها
- يمكن للخانات الحصرية فرض تفعيل Plugin المحددة لتلك الخانة
- يتم تفعيل بعض Plugin المضمنة الاختيارية تلقائيًا عندما تسمي الإعدادات سطحًا
  مملوكًا لـ Plugin، مثل مرجع نموذج مزود خدمة، أو إعداد قناة، أو وقت تشغيل حزمة اختبار
- تُحفظ إعدادات Plugin القديمة بينما يكون `plugins.enabled: false` نشطًا؛
  أعد تفعيل Plugin قبل تشغيل تنظيف doctor إذا كنت تريد إزالة المعرفات القديمة
- تحتفظ مسارات Codex من عائلة OpenAI بحدود Plugin منفصلة:
  ينتمي `openai-codex/*` إلى OpenAI Plugin، بينما يتم تحديد Plugin خادم التطبيق
  Codex المضمنة بواسطة `agentRuntime.id: "codex"` أو مراجع النماذج القديمة
  `codex/*`

## استكشاف أخطاء خطافات وقت التشغيل وإصلاحها

إذا ظهرت Plugin في `plugins list` لكن الآثار الجانبية أو الخطافات لـ `register(api)`
لا تعمل في حركة المحادثة الحية، فتحقق من هذه أولًا:

- شغّل `openclaw gateway status --deep --require-rpc` وتأكد من أن عنوان URL النشط
  لـ Gateway، والملف الشخصي، ومسار الإعدادات، والعملية هي التي تعدّلها.
- أعد تشغيل Gateway الحية بعد تغييرات تثبيت/إعدادات/كود Plugin. في حاويات الغلاف،
  قد يكون PID 1 مجرد مشرف؛ أعد تشغيل أو أرسل إشارة إلى عملية الابن
  `openclaw gateway run`.
- استخدم `openclaw plugins inspect <id> --runtime --json` لتأكيد تسجيلات الخطافات
  والتشخيصات. تحتاج خطافات المحادثة غير المضمنة مثل `llm_input`،
  و`llm_output`، و`before_agent_finalize`، و`agent_end` إلى
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- لتبديل النماذج، فضّل `before_model_resolve`. يعمل قبل حل النموذج لدورات الوكيل؛
  ولا يعمل `llm_output` إلا بعد أن تنتج محاولة نموذج مخرجات مساعد.
- لإثبات نموذج الجلسة الفعلي، استخدم `openclaw sessions` أو أسطح جلسة/حالة
  Gateway، وعند تصحيح حمولات مزود الخدمة، ابدأ Gateway باستخدام
  `--raw-stream --raw-stream-path <path>`.

### إعداد أداة Plugin البطيء

إذا بدت دورات الوكيل وكأنها تتوقف أثناء تحضير الأدوات، ففعّل تسجيل التتبع وتحقق من
أسطر توقيت مصنع أدوات Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

ابحث عن:

```text
[trace:plugin-tools] factory timings ...
```

يسرد الملخص إجمالي وقت المصنع وأبطأ مصانع أدوات Plugin، بما في ذلك معرف Plugin،
وأسماء الأدوات المعلنة، وشكل النتيجة، وما إذا كانت الأداة اختيارية. تتم ترقية
الأسطر البطيئة إلى تحذيرات عندما يستغرق مصنع واحد 1s على الأقل أو يستغرق تحضير
مصانع أدوات Plugin الإجمالي 5s على الأقل.

يخزن OpenClaw مؤقتًا نتائج مصانع أدوات Plugin الناجحة لعمليات الحل المتكررة
بالسياق الفعلي نفسه للطلب. يتضمن مفتاح التخزين المؤقت إعدادات وقت التشغيل الفعلية،
ومساحة العمل، ومعرفات الوكيل/الجلسة، وسياسة sandbox، وإعدادات المتصفح، وسياق
التسليم، وهوية مقدم الطلب، وحالة الملكية، لذلك تتم إعادة تشغيل المصانع التي تعتمد
على تلك الحقول الموثوقة عندما يتغير السياق.

إذا هيمنت Plugin واحدة على التوقيت، فافحص تسجيلات وقت التشغيل الخاصة بها:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

ثم حدّث تلك Plugin أو أعد تثبيتها أو عطّلها. ينبغي لمؤلفي Plugin نقل تحميل
التبعيات المكلفة إلى ما وراء مسار تنفيذ الأداة بدلًا من القيام به داخل مصنع الأداة.

### تكرار ملكية القناة أو الأداة

الأعراض:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

تعني هذه أن أكثر من Plugin مفعّلة تحاول امتلاك القناة نفسها، أو تدفق الإعداد نفسه،
أو اسم الأداة نفسه. السبب الأكثر شيوعًا هو وجود Plugin قناة خارجية مثبتة بجانب
Plugin مضمنة توفر الآن معرف القناة نفسه.

خطوات التصحيح:

- شغّل `openclaw plugins list --enabled --verbose` لرؤية كل Plugin مفعّلة
  وأصلها.
- شغّل `openclaw plugins inspect <id> --runtime --json` لكل Plugin مشتبه بها
  وقارن `channels`، و`channelConfigs`، و`tools`، والتشخيصات.
- شغّل `openclaw plugins registry --refresh` بعد تثبيت حزم Plugin أو إزالتها
  حتى تعكس البيانات الوصفية المحفوظة التثبيت الحالي.
- أعد تشغيل Gateway بعد تغييرات التثبيت، أو السجل، أو الإعدادات.

خيارات الإصلاح:

- إذا كانت Plugin واحدة تستبدل أخرى عمدًا لمعرف القناة نفسه، فينبغي أن تعلن
  Plugin المفضلة `channelConfigs.<channel-id>.preferOver` مع معرف Plugin ذات
  الأولوية الأدنى. راجع [/plugins/manifest#replacing-another-channel-plugin](/ar/plugins/manifest#replacing-another-channel-plugin).
- إذا كان التكرار عرضيًا، فعطّل أحد الجانبين باستخدام
  `plugins.entries.<plugin-id>.enabled: false` أو أزل تثبيت Plugin القديم.
- إذا فعّلت كلتا Plugin صراحة، يحتفظ OpenClaw بذلك الطلب ويبلغ عن التعارض.
  اختر مالكًا واحدًا للقناة أو أعد تسمية الأدوات المملوكة لـ Plugin حتى يكون
  سطح وقت التشغيل غير ملتبس.

## خانات Plugin (فئات حصرية)

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

| الخانة            | ما تتحكم به      | الافتراضي             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active memory Plugin  | `memory-core`       |
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

تُشحن Plugins المضمّنة مع OpenClaw. يكون كثير منها مفعّلًا افتراضيًا (على سبيل المثال
موفرو النماذج المضمّنون، وموفرو الكلام المضمّنون، وPlugin المتصفح المضمّن).
أما Plugins المضمّنة الأخرى فما زالت تحتاج إلى `openclaw plugins enable <id>`.

يكتب `--force` فوق Plugin مثبّت أو حزمة خطافات موجودة في مكانها. استخدم
`openclaw plugins update <id-or-npm-spec>` للترقيات الروتينية لـ Plugins npm
المتتبعة. لا يكون مدعومًا مع `--link`، الذي يعيد استخدام مسار المصدر بدلًا
من النسخ فوق هدف تثبيت مُدار.

عندما يكون `plugins.allow` مضبوطًا بالفعل، يضيف `openclaw plugins install`
معرّف Plugin المثبّت إلى قائمة السماح تلك قبل تفعيله. إذا كان معرّف Plugin نفسه
موجودًا في `plugins.deny`، يزيل التثبيت إدخال المنع القديم ذاك حتى يصبح
التثبيت الصريح قابلًا للتحميل فورًا بعد إعادة التشغيل.

يحتفظ OpenClaw بسجل Plugin محلي مستمر بوصفه نموذج القراءة الباردة لمخزون
Plugins، وملكية المساهمات، وتخطيط بدء التشغيل. تحدّث مسارات التثبيت، والتحديث،
وإلغاء التثبيت، والتفعيل، والتعطيل ذلك السجل بعد تغيير حالة Plugin. يحتفظ ملف
`plugins/installs.json` نفسه ببيانات تعريف التثبيت الدائمة في `installRecords`
ذات المستوى الأعلى، وبيانات تعريف البيان القابلة لإعادة البناء في `plugins`. إذا
كان السجل مفقودًا أو قديمًا أو غير صالح، يعيد `openclaw plugins registry
--refresh` بناء عرض البيان الخاص به من سجلات التثبيت، وسياسة الإعدادات، وبيانات
تعريف البيان/الحزمة، من دون تحميل وحدات وقت تشغيل Plugin.
ينطبق `openclaw plugins update <id-or-npm-spec>` على التثبيتات المتتبعة. تمرير
مواصفة حزمة npm مع وسم توزيع أو إصدار دقيق يحل اسم الحزمة مرة أخرى إلى سجل
Plugin المتتبع ويسجل المواصفة الجديدة للتحديثات المستقبلية. تمرير اسم الحزمة
من دون إصدار ينقل تثبيتًا مثبّتًا بدقة إلى خط الإصدار الافتراضي في السجل. إذا
كان Plugin npm المثبّت يطابق بالفعل الإصدار المحلول وهوية الأثر المسجلة، يتخطى
OpenClaw التحديث من دون تنزيل أو إعادة تثبيت أو إعادة كتابة الإعدادات.
عندما يعمل `openclaw update` على قناة beta، تحاول سجلات npm وClawHub
Plugin على الخط الافتراضي استخدام `@beta` أولًا، ثم تعود إلى default/latest
عندما لا يوجد إصدار beta لـ Plugin. تبقى الإصدارات الدقيقة والوسوم الصريحة مثبتة.

`--pin` خاص بـ npm فقط. لا يكون مدعومًا مع `--marketplace`، لأن تثبيتات
marketplace تستمر في حفظ بيانات تعريف مصدر marketplace بدلًا من مواصفة npm.

`--dangerously-force-unsafe-install` هو تجاوز كسر زجاج للنتائج الإيجابية الكاذبة
من ماسح التعليمات البرمجية الخطرة المدمج. يسمح لتثبيتات Plugin وتحديثات Plugin
بالمتابعة بعد نتائج `critical` المدمجة، لكنه لا يزال لا يتجاوز كتل سياسة
`before_install` الخاصة بـ Plugin أو الحظر الناتج عن فشل المسح.
تتجاهل عمليات فحص التثبيت ملفات وأدلة الاختبار الشائعة مثل `tests/`،
و`__tests__/`، و`*.test.*`، و`*.spec.*` لتجنب حظر محاكيات الاختبار المعبأة؛
ولا تزال نقاط دخول وقت تشغيل Plugin المعلنة تُفحص حتى إذا استخدمت أحد تلك الأسماء.

ينطبق علم CLI هذا على مسارات تثبيت/تحديث Plugin فقط. تستخدم عمليات تثبيت
تبعيات Skills المدعومة من Gateway تجاوز الطلب المطابق
`dangerouslyForceUnsafeInstall` بدلًا من ذلك، بينما يبقى `openclaw skills install`
مسار تنزيل/تثبيت Skill منفصلًا من ClawHub.

إذا كان Plugin نشرته على ClawHub مخفيًا أو محظورًا بفعل فحص، فافتح لوحة تحكم
ClawHub أو شغّل `clawhub package rescan <name>` لطلب إعادة فحصه من ClawHub.
لا يؤثر `--dangerously-force-unsafe-install` إلا في التثبيتات على جهازك؛ فهو لا
يطلب من ClawHub إعادة فحص Plugin أو جعل إصدار محظور عامًا.

تشارك الحزم المتوافقة في مسار قائمة/فحص/تفعيل/تعطيل Plugin نفسه. يتضمن دعم وقت
التشغيل الحالي Skills الحزمة، وSkills أوامر Claude، وافتراضات `settings.json`
في Claude، وافتراضات `.lsp.json` في Claude و`lspServers` المعلنة في البيان،
وSkills أوامر Cursor، وأدلة خطافات Codex المتوافقة.

يعرض `openclaw plugins inspect <id>` أيضًا قدرات الحزمة المكتشفة بالإضافة إلى
إدخالات خوادم MCP وLSP المدعومة أو غير المدعومة لـ Plugins المدعومة بالحزم.

يمكن أن تكون مصادر Marketplace اسم marketplace معروفًا في Claude من
`~/.claude/plugins/known_marketplaces.json`، أو جذر marketplace محليًا أو مسار
`marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع
GitHub، أو عنوان URL لـ git. بالنسبة إلى marketplaces البعيدة، يجب أن تبقى
إدخالات Plugin داخل مستودع marketplace المستنسخ وأن تستخدم مصادر مسارات نسبية فقط.

راجع [مرجع CLI لـ `openclaw plugins`](/ar/cli/plugins) للحصول على التفاصيل الكاملة.

## نظرة عامة على واجهة برمجة تطبيقات Plugin

تصدّر Plugins الأصلية كائن إدخال يكشف `register(api)`. قد تستمر Plugins الأقدم
في استخدام `activate(api)` كاسم مستعار قديم، لكن ينبغي لـ Plugins الجديدة
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

يحمّل OpenClaw كائن الإدخال ويستدعي `register(api)` أثناء تفعيل Plugin. لا يزال
المحمّل يعود إلى `activate(api)` مع Plugins الأقدم، لكن ينبغي لـ Plugins المضمّنة
وPlugins الخارجية الجديدة التعامل مع `register` بوصفه العقد العام.

يخبر `api.registrationMode` Plugin بسبب تحميل إدخاله:

| الوضع | المعنى |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | تفعيل وقت التشغيل. سجّل الأدوات، والخطافات، والخدمات، والأوامر، والمسارات، والآثار الجانبية الحية الأخرى. |
| `discovery` | اكتشاف القدرات للقراءة فقط. سجّل الموفرين وبيانات التعريف؛ قد تُحمّل تعليمات إدخال Plugin الموثوقة، لكن تخطَّ الآثار الجانبية الحية. |
| `setup-only` | تحميل بيانات تعريف إعداد القناة عبر إدخال إعداد خفيف. |
| `setup-runtime` | تحميل إعداد القناة الذي يحتاج أيضًا إلى إدخال وقت التشغيل. |
| `cli-metadata` | جمع بيانات تعريف أوامر CLI فقط. |

ينبغي لإدخالات Plugin التي تفتح مقابس أو قواعد بيانات أو عاملين في الخلفية أو
عملاء طويلَي العمر أن تحرس تلك الآثار الجانبية باستخدام
`api.registrationMode === "full"`. تُخزّن تحميلات الاكتشاف مؤقتًا بشكل منفصل عن
تحميلات التفعيل ولا تستبدل سجل Gateway الجاري. الاكتشاف غير مُفعِّل، وليس خاليًا
من الاستيراد: قد يقيّم OpenClaw إدخال Plugin الموثوق أو وحدة Plugin للقناة لبناء
اللقطة. أبقِ المستويات العليا للوحدات خفيفة وخالية من الآثار الجانبية، وانقل
عملاء الشبكة، والعمليات الفرعية، والمستمعين، وقراءات بيانات الاعتماد، وبدء
تشغيل الخدمة خلف مسارات وقت التشغيل الكامل.

طرق التسجيل الشائعة:

| الطريقة | ما تسجله |
| --------------------------------------- | --------------------------- |
| `registerProvider` | موفر نموذج (LLM) |
| `registerChannel` | قناة محادثة |
| `registerTool` | أداة وكيل |
| `registerHook` / `on(...)` | خطافات دورة الحياة |
| `registerSpeechProvider` | تحويل النص إلى كلام / STT |
| `registerRealtimeTranscriptionProvider` | STT متدفق |
| `registerRealtimeVoiceProvider` | صوت آني مزدوج الاتجاه |
| `registerMediaUnderstandingProvider` | تحليل الصور/الصوت |
| `registerImageGenerationProvider` | توليد الصور |
| `registerMusicGenerationProvider` | توليد الموسيقى |
| `registerVideoGenerationProvider` | توليد الفيديو |
| `registerWebFetchProvider` | موفر جلب/استخلاص الويب |
| `registerWebSearchProvider` | بحث الويب |
| `registerHttpRoute` | نقطة نهاية HTTP |
| `registerCommand` / `registerCli` | أوامر CLI |
| `registerContextEngine` | محرك السياق |
| `registerService` | خدمة خلفية |

سلوك حارس الخطافات لخطافات دورة الحياة ذات الأنواع:

- `before_tool_call`: يكون `{ block: true }` نهائيًا؛ تُتخطى المعالجات الأقل أولوية.
- `before_tool_call`: يكون `{ block: false }` بلا تأثير ولا يمحو حظرًا سابقًا.
- `before_install`: يكون `{ block: true }` نهائيًا؛ تُتخطى المعالجات الأقل أولوية.
- `before_install`: يكون `{ block: false }` بلا تأثير ولا يمحو حظرًا سابقًا.
- `message_sending`: يكون `{ cancel: true }` نهائيًا؛ تُتخطى المعالجات الأقل أولوية.
- `message_sending`: يكون `{ cancel: false }` بلا تأثير ولا يمحو إلغاءً سابقًا.

يربط خادم التطبيق الأصلي في Codex أحداث أدوات Codex الأصلية مرة أخرى بسطح
الخطافات هذا. يمكن لـ Plugins حظر أدوات Codex الأصلية عبر `before_tool_call`،
ومراقبة النتائج عبر `after_tool_call`، والمشاركة في موافقات `PermissionRequest`
في Codex. لا يعيد الجسر كتابة وسائط أدوات Codex الأصلية بعد. يعيش حد دعم وقت
تشغيل Codex الدقيق في [عقد دعم Codex harness v1](/ar/plugins/codex-harness#v1-support-contract).

للاطلاع على سلوك الخطافات الكامل ذي الأنواع، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#hook-decision-semantics).

## ذات صلة

- [بناء plugins](/ar/plugins/building-plugins) — أنشئ plugin خاصًا بك
- [حزم Plugin](/ar/plugins/bundles) — توافق حزم Codex/Claude/Cursor
- [بيان Plugin](/ar/plugins/manifest) — مخطط البيان
- [تسجيل الأدوات](/ar/plugins/building-plugins#registering-agent-tools) — أضف أدوات الوكيل في plugin
- [داخليات Plugin](/ar/plugins/architecture) — نموذج القدرات ومسار التحميل
- [plugins المجتمع](/ar/plugins/community) — قوائم الجهات الخارجية
