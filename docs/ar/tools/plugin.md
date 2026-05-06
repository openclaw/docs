---
read_when:
    - تثبيت Plugins أو تكوينها
    - فهم قواعد اكتشاف Plugin وتحميله
    - العمل مع حِزَم Plugin المتوافقة مع Codex/Claude
sidebarTitle: Install and Configure
summary: تثبيت Plugins OpenClaw وتكوينها وإدارتها
title: Plugins
x-i18n:
    generated_at: "2026-05-06T18:03:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef355ac480bce7140049f59d3d01909de2cf2fdf80ad07db62e05ee997840c81
    source_path: tools/plugin.md
    workflow: 16
---

توسّع Plugins قدرات OpenClaw بإمكانات جديدة: القنوات، ومزوّدو النماذج،
وأطر تشغيل الوكلاء، والأدوات، وSkills، والكلام، والنسخ الفوري، والصوت الفوري،
وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب، والبحث في الويب،
والمزيد. بعض Plugins تكون **أساسية** (تأتي مع OpenClaw)، وبعضها
**خارجية**. تُنشر وتُكتشف معظم Plugins الخارجية عبر
[ClawHub](/ar/tools/clawhub). يظل npm مدعوماً للتثبيت المباشر ولمجموعة مؤقتة
من حزم Plugins المملوكة لـ OpenClaw إلى أن تكتمل تلك الهجرة.

## البدء السريع

للاطلاع على أمثلة جاهزة للنسخ واللصق للتثبيت، والعرض، وإلغاء التثبيت، والتحديث، والنشر، راجع
[إدارة Plugins](/ar/plugins/manage-plugins).

<Steps>
  <Step title="عرض ما تم تحميله">
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
    openclaw plugins install npm-pack:./openclaw-plugin-1.2.3.tgz

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

  <Step title="إدارة من داخل المحادثة">
    في Gateway قيد التشغيل، يؤدي أمرا `/plugins enable` و`/plugins disable`
    المخصصان للمالك فقط إلى تشغيل معيد تحميل إعدادات Gateway. يعيد Gateway تحميل أسطح
    وقت تشغيل Plugin داخل العملية، وتعيد أدوار الوكيل الجديدة بناء قائمة أدواتها من
    السجل المحدّث. يغيّر `/plugins install` شيفرة مصدر Plugin، لذلك يطلب
    Gateway إعادة تشغيل بدلاً من الادعاء بأن العملية الحالية يمكنها إعادة تحميل
    الوحدات التي تم استيرادها بالفعل بأمان.

  </Step>

  <Step title="التحقق من Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    استخدم `--runtime` عندما تحتاج إلى إثبات الأدوات، أو الخدمات، أو طرق Gateway،
    أو الخطافات، أو أوامر CLI المملوكة لـ Plugin والمسجلة. أما `inspect` العادي
    فهو فحص بارد للبيان/السجل ويتجنب عمداً استيراد وقت تشغيل Plugin.

  </Step>
</Steps>

إذا كنت تفضّل التحكم من داخل المحادثة، فعّل `commands.plugins: true` واستخدم:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

يستخدم مسار التثبيت المحلل نفسه الذي تستخدمه CLI: مساراً/أرشيفاً محلياً، أو
`clawhub:<pkg>` صريحاً، أو `npm:<pkg>` صريحاً، أو `npm-pack:<path.tgz>`
صريحاً، أو `git:<repo>` صريحاً، أو مواصفة حزمة مجردة عبر npm.

إذا كانت الإعدادات غير صالحة، يفشل التثبيت عادةً بوضع مغلق ويوجهك إلى
`openclaw doctor --fix`. استثناء الاسترداد الوحيد هو مسار ضيق لإعادة تثبيت
Plugin مضمّن لـ Plugins التي تختار الاشتراك في
`openclaw.install.allowInvalidConfigRecovery`.
أثناء بدء تشغيل Gateway، تفشل إعدادات Plugin غير الصالحة بوضع مغلق مثل أي إعدادات
أخرى غير صالحة. شغّل `openclaw doctor --fix` لعزل إعدادات Plugin السيئة عن طريق
تعطيل إدخال ذلك Plugin وإزالة حمولة إعداداته غير الصالحة؛ وتحتفظ نسخة الإعدادات
الاحتياطية العادية بالقيم السابقة.
عندما تشير إعدادات قناة إلى Plugin لم يعد قابلاً للاكتشاف ولكن يظل معرّف Plugin
القديم نفسه موجوداً في إعدادات Plugin أو سجلات التثبيت، يسجل بدء تشغيل Gateway
تحذيرات ويتخطى تلك القناة بدلاً من حظر كل القنوات الأخرى.
شغّل `openclaw doctor --fix` لإزالة إدخالات القناة/Plugin القديمة؛ أما مفاتيح
القنوات غير المعروفة من دون دليل على Plugin قديم فتظل تفشل في التحقق كي تبقى
الأخطاء المطبعية مرئية.
إذا تم ضبط `plugins.enabled: false`، تُعامل مراجع Plugins القديمة كأنها خاملة:
يتخطى بدء تشغيل Gateway أعمال اكتشاف/تحميل Plugins ويحافظ `openclaw doctor` على
إعدادات Plugin المعطلة بدلاً من إزالتها تلقائياً. أعد تفعيل Plugins قبل تشغيل
تنظيف doctor إذا كنت تريد إزالة معرّفات Plugins القديمة.

لا يحدث تثبيت تبعيات Plugin إلا أثناء تدفقات التثبيت/التحديث الصريحة أو إصلاح
doctor. لا يقوم بدء تشغيل Gateway، ولا إعادة تحميل الإعدادات، ولا فحص وقت التشغيل
بتشغيل مديري الحزم أو إصلاح أشجار التبعيات. يجب أن تكون تبعيات Plugins المحلية
مثبتة مسبقاً، بينما تُثبت Plugins من npm وgit وClawHub ضمن جذور Plugins المُدارة
الخاصة بـ OpenClaw. قد تُرفع تبعيات npm داخل جذر npm المُدار الخاص بـ OpenClaw؛
يفحص التثبيت/التحديث ذلك الجذر المُدار قبل الثقة، وتزيل عملية إلغاء التثبيت الحزم
المدارة عبر npm من خلال npm. يجب أن تظل Plugins الخارجية ومسارات التحميل المخصصة
مثبتة عبر `openclaw plugins install`.
استخدم `openclaw plugins list --json` لرؤية `dependencyStatus` الثابت لكل Plugin
مرئي من دون استيراد شيفرة وقت التشغيل أو إصلاح التبعيات.
راجع [حل تبعيات Plugin](/ar/plugins/dependency-resolution) لمعرفة دورة الحياة وقت التثبيت.

### ملكية مسار Plugin المحظور

إذا قالت تشخيصات Plugin:
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
وتبعها التحقق من الإعدادات برسالة `plugin present but blocked`، فقد وجد OpenClaw
ملفات Plugin مملوكة لمستخدم Unix مختلف عن العملية التي تحمّلها. أبقِ إعدادات
Plugin في مكانها؛ أصلح ملكية نظام الملفات أو شغّل OpenClaw بالمستخدم نفسه الذي
يملك دليل الحالة.

بالنسبة إلى تثبيتات Docker، تعمل الصورة الرسمية باسم `node` (uid `1000`)، لذلك
ينبغي عادةً أن تكون أدلة إعدادات ومساحة عمل OpenClaw المربوطة من المضيف مملوكة
لـ uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

إذا كنت تشغّل OpenClaw عمداً بصلاحيات root، فأصلح جذر Plugin المُدار ليكون
بملكية root بدلاً من ذلك:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

بعد إصلاح الملكية، أعد تشغيل `openclaw doctor --fix` أو
`openclaw plugins registry --refresh` كي يطابق سجل Plugins المحفوظ الملفات
التي تم إصلاحها.

بالنسبة إلى تثبيتات npm، تُحل المحددات المتغيرة مثل `latest` أو dist-tag قبل
التثبيت ثم تُثبّت على الإصدار الدقيق المتحقق منه داخل جذر npm المُدار الخاص بـ
OpenClaw. بعد انتهاء npm، يتحقق OpenClaw من أن إدخال `package-lock.json` المثبت
لا يزال يطابق الإصدار والتكامل المحلولين. إذا كتب npm بيانات وصفية مختلفة للحزمة،
يفشل التثبيت ويتم التراجع عن الحزمة المُدارة بدلاً من قبول أثر Plugin مختلف.
ترث جذور npm المُدارة أيضاً `overrides` الخاصة بـ npm على مستوى حزمة OpenClaw،
لذلك تنطبق تثبيتات الأمان التي تحمي المضيف المُحزّم أيضاً على تبعيات Plugins
الخارجية المرفوعة.

عمليات سحب المصدر هي مساحات عمل pnpm. إذا استنسخت OpenClaw لتعديل Plugins
المضمّنة، فشغّل `pnpm install`؛ عندها يحمّل OpenClaw Plugins المضمّنة من
`extensions/<id>` بحيث تُستخدم التعديلات والتبعيات المحلية للحزمة مباشرة.
تثبيتات جذر npm العادية مخصصة لـ OpenClaw المُحزّم، لا لتطوير نسخة مصدرية مسحوبة.

## أنواع Plugin

يتعرّف OpenClaw على تنسيقين لـ Plugin:

| التنسيق | آلية العمل | أمثلة |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + وحدة وقت تشغيل؛ تُنفّذ داخل العملية | Plugins رسمية، وحزم npm من المجتمع |
| **Bundle** | تخطيط متوافق مع Codex/Claude/Cursor؛ يُربط بميزات OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

يظهر كلاهما ضمن `openclaw plugins list`. راجع [حزم Plugin](/ar/plugins/bundles) لمعرفة تفاصيل الحزم.

إذا كنت تكتب Plugin أصلياً، فابدأ من [بناء Plugins](/ar/plugins/building-plugins)
و[نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

## نقاط دخول الحزمة

يجب أن تعلن حزم npm الخاصة بـ Plugin الأصلي عن `openclaw.extensions` في `package.json`.
يجب أن يبقى كل إدخال داخل دليل الحزمة وأن يُحل إلى ملف وقت تشغيل قابل للقراءة،
أو إلى ملف مصدر TypeScript مع نظير JavaScript مبني مستنتج مثل `src/index.ts` إلى
`dist/index.js`.
يجب أن تشحن التثبيتات المُحزّمة مخرجات وقت تشغيل JavaScript تلك. إن احتياطي مصدر
TypeScript مخصص لعمليات سحب المصدر ومسارات التطوير المحلي، وليس لحزم npm المثبتة
داخل جذر Plugin المُدار الخاص بـ OpenClaw.

إذا قال تحذير حزمة مُدارة إنها `requires compiled runtime output for
TypeScript entry ...`، فقد نُشرت الحزمة من دون ملفات JavaScript التي يحتاجها
OpenClaw وقت التشغيل. هذه مشكلة تحزيم Plugin، وليست مشكلة إعدادات محلية.
حدّث Plugin أو أعد تثبيته بعد أن يعيد الناشر نشر JavaScript المترجم، أو عطّل/ألغِ
تثبيت ذلك Plugin إلى أن تتوفر حزمة مصححة.

استخدم `openclaw.runtimeExtensions` عندما لا تعيش ملفات وقت التشغيل المنشورة في
المسارات نفسها مثل إدخالات المصدر. عند وجود `runtimeExtensions`، يجب أن تحتوي
على إدخال واحد بالضبط لكل إدخال في `extensions`. تفشل القوائم غير المتطابقة في
التثبيت واكتشاف Plugin بدلاً من الرجوع بصمت إلى مسارات المصدر. إذا كنت تنشر أيضاً
`openclaw.setupEntry`، فاستخدم `openclaw.runtimeSetupEntry` لنظيره المبني من
JavaScript؛ ذلك الملف مطلوب عند التصريح به.

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

ClawHub هو مسار التوزيع الأساسي لمعظم Plugins. تحزم إصدارات OpenClaw الحالية
المُحزّمة العديد من Plugins الرسمية بالفعل، لذلك لا تحتاج هذه إلى تثبيتات npm
منفصلة في الإعدادات العادية. إلى أن تهاجر كل Plugin مملوكة لـ OpenClaw إلى
ClawHub، لا يزال OpenClaw يشحن بعض حزم Plugins من `@openclaw/*` على npm
للتثبيتات الأقدم/المخصصة وتدفقات عمل npm المباشرة.

إذا أبلغ npm أن حزمة Plugin من `@openclaw/*` مهملة، فهذا الإصدار من الحزمة
ينتمي إلى سلسلة حزم خارجية أقدم. استخدم Plugin المضمّن من OpenClaw الحالي أو
نسخة محلية مسحوبة إلى أن تُنشر حزمة npm أحدث.

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

### Core (يأتي مع OpenClaw)

<AccordionGroup>
  <Accordion title="مزوّدو النماذج (مفعّلون افتراضياً)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins الذاكرة">
    - `memory-core` - بحث الذاكرة المضمّن (الافتراضي عبر `plugins.slots.memory`)
    - `memory-lancedb` - ذاكرة طويلة الأمد مدعومة من LanceDB مع الاستدعاء/الالتقاط التلقائي (اضبط `plugins.slots.memory = "memory-lancedb"`)

    راجع [ذاكرة LanceDB](/ar/plugins/memory-lancedb) لإعداد التضمينات المتوافقة مع OpenAI، وأمثلة Ollama، وحدود الاستدعاء، واستكشاف الأخطاء وإصلاحها.

  </Accordion>

  <Accordion title="موفّرو الكلام (مفعّلون افتراضيًا)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="أخرى">
    - `browser` - Plugin المتصفح المضمّن لأداة المتصفح، وواجهة CLI `openclaw browser`، وطريقة Gateway `browser.request`، ووقت تشغيل المتصفح، وخدمة التحكم الافتراضية في المتصفح (مفعّل افتراضيًا؛ عطّله قبل استبداله)
    - `copilot-proxy` - جسر VS Code Copilot Proxy (معطّل افتراضيًا)

  </Accordion>
</AccordionGroup>

هل تبحث عن Plugins من جهات خارجية؟ راجع [Plugins المجتمع](/ar/plugins/community).

## التكوين

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
| `enabled`          | مفتاح التحكم الرئيسي (الافتراضي: `true`)                           |
| `allow`            | قائمة السماح للـ Plugins (اختياري)                               |
| `bundledDiscovery` | وضع اكتشاف Plugins المضمّنة (`allowlist` افتراضيًا)    |
| `deny`             | قائمة حظر Plugins (اختياري؛ الحظر يتغلّب)                     |
| `load.paths`       | ملفات/أدلة Plugin إضافية                            |
| `slots`            | محددات الفتحات الحصرية (مثل `memory`، `contextEngine`) |
| `entries.\<id\>`   | مفاتيح تفعيل وتكوين لكل Plugin                               |

`plugins.allow` حصرية. عندما تكون غير فارغة، لا يمكن تحميل إلا Plugins المدرجة أو كشف أدواتها، حتى إذا كان `tools.allow` يحتوي على `"*"` أو اسم أداة معيّن مملوك لـ Plugin. إذا كانت قائمة سماح الأدوات تشير إلى أدوات Plugin، فأضف معرّفات Plugins المالكة إلى `plugins.allow` أو أزل `plugins.allow`؛ يحذّر `openclaw doctor` من هذا الشكل.

يكون `plugins.bundledDiscovery` افتراضيًا `"allowlist"` للتكوينات الجديدة، لذلك فإن مخزون `plugins.allow` التقييدي يحظر أيضًا Plugins الموفّرين المضمّنة غير المذكورة، بما في ذلك اكتشاف موفّر بحث الويب في وقت التشغيل. أثناء الترحيل، تسم أداة الفحص تكوينات قوائم السماح التقييدية القديمة بـ `"compat"` حتى تحافظ الترقيات على سلوك موفّري الحزمة المضمّنين القديم إلى أن يختار المشغّل الوضع الأكثر صرامة. ما تزال `plugins.allow` الفارغة تُعامل كأنها غير معيّنة/مفتوحة.

تؤدي تغييرات التكوين التي تُجرى عبر `/plugins enable` أو `/plugins disable` إلى إعادة تحميل Plugin في Gateway داخل العملية. تعيد أدوار الوكيل الجديدة بناء قائمة أدواتها من سجل Plugin المحدّث. أما العمليات التي تغيّر المصدر، مثل التثبيت والتحديث وإلغاء التثبيت، فما تزال تعيد تشغيل عملية Gateway لأن وحدات Plugin التي تم استيرادها مسبقًا لا يمكن استبدالها بأمان في مكانها.

`openclaw plugins list` هي لقطة محلية لسجل Plugin/التكوين. وجود Plugin بحالة `enabled` هناك يعني أن السجل المحفوظ والتكوين الحالي يسمحان لـ Plugin بالمشاركة. لا يثبت ذلك أن Gateway بعيدًا يعمل بالفعل قد أعاد التحميل أو أعاد التشغيل إلى كود Plugin نفسه. في إعدادات VPS/الحاويات ذات عمليات التغليف، أرسل عمليات إعادة التشغيل أو الكتابات التي تؤدي إلى إعادة التحميل إلى عملية `openclaw gateway run` الفعلية، أو استخدم `openclaw gateway restart` ضد Gateway الجاري تشغيله عندما تبلّغ إعادة التحميل عن فشل.

<Accordion title="حالات Plugin: معطّل مقابل مفقود مقابل غير صالح">
  - **معطّل**: Plugin موجود لكن قواعد التفعيل أوقفته. يُحفظ التكوين.
  - **مفقود**: يشير التكوين إلى معرّف Plugin لم يجده الاكتشاف.
  - **غير صالح**: Plugin موجود لكن تكوينه لا يطابق المخطط المعلن. يتجاوز بدء تشغيل Gateway ذلك Plugin فقط؛ يستطيع `openclaw doctor --fix` عزل الإدخال غير الصالح عبر تعطيله وإزالة حمولة تكوينه.

</Accordion>

## الاكتشاف والأسبقية

يفحص OpenClaw عن Plugins بهذا الترتيب (أول تطابق يفوز):

<Steps>
  <Step title="مسارات التكوين">
    `plugins.load.paths` - مسارات ملفات أو أدلة صريحة. يتم تجاهل المسارات التي تشير عائدًا إلى أدلة Plugins المضمّنة المعبأة الخاصة بـ OpenClaw؛ شغّل `openclaw doctor --fix` لإزالة تلك الأسماء المستعارة القديمة.
  </Step>

  <Step title="Plugins مساحة العمل">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins العمومية">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins المضمّنة">
    تُشحن مع OpenClaw. كثير منها مفعّل افتراضيًا (موفّرو النماذج، الكلام).
    ويتطلب بعضها الآخر تفعيلًا صريحًا.
  </Step>
</Steps>

عادةً ما تحل عمليات التثبيت المعبأة وصور Docker Plugins المضمّنة من شجرة `dist/extensions` المجمّعة. إذا تم تركيب دليل مصدر Plugin مضمّن بالربط فوق مسار المصدر المعبأ المطابق، على سبيل المثال `/app/extensions/synology-chat`، فإن OpenClaw يعامل دليل المصدر المركّب ذلك كطبقة مصدر علوية مضمّنة ويكتشفه قبل حزمة `/app/dist/extensions/synology-chat` المعبأة. يحافظ ذلك على عمل حلقات حاويات المشرفين دون إعادة كل Plugin مضمّن إلى مصدر TypeScript. اضبط `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` لفرض حزم dist المعبأة حتى عند وجود تركيبات طبقة مصدر علوية.

### قواعد التفعيل

- `plugins.enabled: false` يعطّل كل Plugins ويتجاوز عمل اكتشاف/تحميل Plugins
- `plugins.deny` يتغلّب دائمًا على السماح
- `plugins.entries.\<id\>.enabled: false` يعطّل ذلك Plugin
- Plugins ذات منشأ مساحة العمل **معطّلة افتراضيًا** (يجب تفعيلها صراحةً)
- تتبع Plugins المضمّنة مجموعة التفعيل الافتراضي المدمجة ما لم يتم تجاوزها
- يمكن للفتحات الحصرية فرض تفعيل Plugin المحدد لتلك الفتحة
- تُفعّل بعض Plugins المضمّنة الاختيارية تلقائيًا عندما يسمي التكوين سطحًا مملوكًا لـ Plugin، مثل مرجع نموذج موفّر، أو تكوين قناة، أو وقت تشغيل حزمة اختبار
- يُحفظ تكوين Plugin القديم أثناء تفعيل `plugins.enabled: false`؛ أعد تفعيل Plugins قبل تشغيل تنظيف أداة الفحص إذا كنت تريد إزالة المعرّفات القديمة
- تحافظ مسارات Codex من عائلة OpenAI على حدود Plugin منفصلة:
  ينتمي `openai-codex/*` إلى Plugin الخاص بـ OpenAI، بينما يتم اختيار Plugin خادم تطبيق Codex المضمّن بواسطة `agentRuntime.id: "codex"` أو مراجع النماذج القديمة `codex/*`

## استكشاف أخطاء خطافات وقت التشغيل وإصلاحها

إذا ظهر Plugin في `plugins list` لكن الآثار الجانبية أو الخطافات الخاصة بـ `register(api)` لا تعمل في حركة المحادثة الحية، فتحقق من هذه أولًا:

- شغّل `openclaw gateway status --deep --require-rpc` وتأكد من أن عنوان URL النشط لـ Gateway والملف الشخصي ومسار التكوين والعملية هي نفسها التي تعدّلها.
- أعد تشغيل Gateway الحي بعد تغييرات تثبيت/تكوين/كود Plugin. في حاويات التغليف، قد يكون PID 1 مجرد مشرف؛ أعد تشغيل عملية `openclaw gateway run` الفرعية أو أرسل إليها إشارة.
- استخدم `openclaw plugins inspect <id> --runtime --json` لتأكيد تسجيلات الخطافات والتشخيصات. تحتاج خطافات المحادثة غير المضمّنة مثل `before_model_resolve` و `before_agent_reply` و `before_agent_run` و `llm_input` و `llm_output` و `before_agent_finalize` و `agent_end` إلى `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- لتبديل النموذج، فضّل `before_model_resolve`. يعمل قبل حل النموذج لأدوار الوكيل؛ أما `llm_output` فلا يعمل إلا بعد أن تنتج محاولة نموذج مخرجات مساعد.
- لإثبات نموذج الجلسة الفعّال، استخدم `openclaw sessions` أو أسطح الجلسة/الحالة في Gateway، وعند تصحيح حمولات الموفّر، ابدأ Gateway باستخدام `--raw-stream --raw-stream-path <path>`.

### بطء إعداد أدوات Plugin

إذا بدت أدوار الوكيل متوقفة أثناء تجهيز الأدوات، ففعّل تسجيل التتبع وتحقق من أسطر توقيتات مصانع أدوات Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

ابحث عن:

```text
[trace:plugin-tools] factory timings ...
```

يعرض الملخص إجمالي وقت المصنع وأبطأ مصانع أدوات Plugin، بما في ذلك معرّف Plugin، وأسماء الأدوات المعلنة، وشكل النتيجة، وما إذا كانت الأداة اختيارية. تُرقّى الأسطر البطيئة إلى تحذيرات عندما يستغرق مصنع واحد 1s على الأقل أو يستغرق إجمالي تحضير مصانع أدوات Plugin 5s على الأقل.

يخزّن OpenClaw مؤقتًا نتائج مصانع أدوات Plugin الناجحة لعمليات الحل المتكررة ذات سياق الطلب الفعّال نفسه. يتضمن مفتاح الذاكرة المؤقتة تكوين وقت التشغيل الفعّال، ومساحة العمل، ومعرّفات الوكيل/الجلسة، وسياسة sandbox، وإعدادات المتصفح، وسياق التسليم، وهوية الطالب، وحالة الملكية، لذلك يُعاد تشغيل المصانع التي تعتمد على تلك الحقول الموثوقة عندما يتغير السياق.

إذا هيمن Plugin واحد على التوقيت، فافحص تسجيلاته في وقت التشغيل:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

ثم حدّث ذلك Plugin أو أعد تثبيته أو عطّله. يجب على مؤلفي Plugins نقل تحميل الاعتماديات المكلفة إلى ما وراء مسار تنفيذ الأداة بدلًا من القيام بذلك داخل مصنع الأداة.

### ازدواجية ملكية القناة أو الأداة

الأعراض:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

تعني هذه أن أكثر من Plugin مفعّل يحاول امتلاك القناة نفسها أو تدفق الإعداد نفسه أو اسم الأداة نفسه. السبب الأكثر شيوعًا هو تثبيت Plugin قناة خارجي إلى جانب Plugin مضمّن يوفر الآن معرّف القناة نفسه.

خطوات التصحيح:

- شغّل `openclaw plugins list --enabled --verbose` لرؤية كل Plugin مفعّل ومنشئه.
- شغّل `openclaw plugins inspect <id> --runtime --json` لكل Plugin مشتبه به وقارن `channels` و `channelConfigs` و `tools` والتشخيصات.
- شغّل `openclaw plugins registry --refresh` بعد تثبيت حزم Plugin أو إزالتها حتى تعكس البيانات الوصفية المحفوظة التثبيت الحالي.
- أعد تشغيل Gateway بعد تغييرات التثبيت أو السجل أو التكوين.

خيارات الإصلاح:

- إذا كان Plugin واحد يستبدل آخر عمدًا لمعرّف القناة نفسه، فيجب أن يعلن Plugin المفضّل `channelConfigs.<channel-id>.preferOver` مع معرّف Plugin الأقل أولوية. راجع [/plugins/manifest#replacing-another-channel-plugin](/ar/plugins/manifest#replacing-another-channel-plugin).
- إذا كانت الازدواجية عرضية، فعطّل أحد الجانبين باستخدام `plugins.entries.<plugin-id>.enabled: false` أو أزل تثبيت Plugin القديم.
- إذا فعّلت كلا Plugins صراحةً، يحتفظ OpenClaw بذلك الطلب ويبلّغ عن التعارض. اختر مالكًا واحدًا للقناة أو أعد تسمية الأدوات المملوكة لـ Plugin حتى يكون سطح وقت التشغيل غير ملتبس.

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
| `memory`        | Plugin الذاكرة النشط  | `memory-core`       |
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

تأتي Plugins المضمّنة مع OpenClaw. يكون كثير منها مفعّلًا افتراضيًا (مثل موفّري النماذج المضمّنين، وموفّري الكلام المضمّنين، وPlugin المتصفح المضمّن). لا تزال Plugins مضمنة أخرى تحتاج إلى `openclaw plugins enable <id>`.

يستبدل `--force` أي Plugin مثبّتة أو حزمة hooks موجودة في موضعها. استخدم `openclaw plugins update <id-or-npm-spec>` للترقيات الروتينية لـ Plugins npm المتتبّعة. ولا يكون مدعومًا مع `--link`، الذي يعيد استخدام مسار المصدر بدل النسخ فوق هدف تثبيت مُدار.

عندما يكون `plugins.allow` مضبوطًا بالفعل، يضيف `openclaw plugins install` معرّف Plugin المثبّتة إلى قائمة السماح تلك قبل تفعيلها. إذا كان معرّف Plugin نفسه موجودًا في `plugins.deny`، فإن التثبيت يزيل إدخال الحظر القديم هذا حتى يصبح التثبيت الصريح قابلًا للتحميل فورًا بعد إعادة التشغيل.

يحتفظ OpenClaw بسجل Plugins محلي دائم بوصفه نموذج القراءة البارد لمخزون Plugins، وملكية المساهمات، وتخطيط بدء التشغيل. تحدّث مسارات التثبيت، والتحديث، وإلغاء التثبيت، والتفعيل، والتعطيل ذلك السجل بعد تغيير حالة Plugin. يحتفظ ملف `plugins/installs.json` نفسه ببيانات تعريف التثبيت الدائمة في `installRecords` على المستوى الأعلى، وبيانات تعريف manifest القابلة لإعادة البناء في `plugins`. إذا كان السجل مفقودًا أو قديمًا أو غير صالح، يعيد `openclaw plugins registry --refresh` بناء عرض manifest الخاص به من سجلات التثبيت، وسياسة الإعدادات، وبيانات تعريف manifest/package دون تحميل وحدات تشغيل Plugin runtime.

في وضع Nix (`OPENCLAW_NIX_MODE=1`)، تكون مُعدِّلات دورة حياة Plugin معطّلة. أدِر اختيار حزم Plugin والإعدادات من خلال مصدر Nix الخاص بالتثبيت بدلًا من ذلك؛ بالنسبة إلى nix-openclaw، ابدأ بـ [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) القائم على الوكيل أولًا. ينطبق `openclaw plugins update <id-or-npm-spec>` على التثبيتات المتتبّعة. يَحلّ تمرير مواصفة حزمة npm مع dist-tag أو إصدار دقيق اسم الحزمة مرة أخرى إلى سجل Plugin المتتبّع ويسجل المواصفة الجديدة للتحديثات المستقبلية. يؤدي تمرير اسم الحزمة دون إصدار إلى إعادة تثبيت دقيق مثبّت إلى خط الإصدار الافتراضي للسجل. إذا كانت Plugin npm المثبّتة تطابق بالفعل الإصدار المحلول وهوية الأثر المسجلة، يتخطّى OpenClaw التحديث دون تنزيل أو إعادة تثبيت أو إعادة كتابة الإعدادات. عندما يعمل `openclaw update` على قناة beta، تحاول سجلات Plugins ذات الخط الافتراضي من npm وClawHub استخدام `@beta` أولًا وتعود إلى default/latest عندما لا يوجد إصدار beta من Plugin. تبقى الإصدارات الدقيقة والوسوم الصريحة مثبّتة.

`--pin` خاص بـ npm فقط. وهو غير مدعوم مع `--marketplace`، لأن تثبيتات marketplace تحفظ بيانات تعريف مصدر marketplace بدلًا من مواصفة npm.

`--dangerously-force-unsafe-install` هو تجاوز كسر زجاج للحالات الإيجابية الكاذبة من ماسح التعليمات البرمجية الخطرة المدمج. يسمح لتثبيتات Plugin وتحديثات Plugin بالاستمرار بعد نتائج `critical` المدمجة، لكنه لا يزال لا يتجاوز حظر سياسة Plugin `before_install` أو الحظر الناتج عن فشل الفحص. تتجاهل فحوصات التثبيت ملفات الاختبار والأدلة الشائعة مثل `tests/` و`__tests__/` و`*.test.*` و`*.spec.*` لتجنب حظر محاكيات الاختبار المعبأة؛ ولا تزال نقاط دخول تشغيل Plugin المعلنة تُفحص حتى إذا استخدمت أحد تلك الأسماء.

ينطبق علم CLI هذا على مسارات تثبيت/تحديث Plugin فقط. تستخدم تثبيتات اعتماد Skills المدعومة من Gateway تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall` بدلًا من ذلك، بينما يبقى `openclaw skills install` مسار تنزيل/تثبيت Skill منفصلًا من ClawHub.

إذا كانت Plugin نشرتها على ClawHub مخفية أو محظورة بسبب فحص، فافتح لوحة ClawHub أو شغّل `clawhub package rescan <name>` لتطلب من ClawHub فحصها مجددًا. يؤثر `--dangerously-force-unsafe-install` فقط في التثبيتات على جهازك؛ ولا يطلب من ClawHub إعادة فحص Plugin أو جعل إصدار محظور عامًا.

تشارك الحزم المتوافقة في مسار القائمة/الفحص/التفعيل/التعطيل نفسه الخاص بـ Plugin. يشمل دعم التشغيل الحالي Skills الحِزم، وClaude command-skills، وافتراضيات Claude `settings.json`، وافتراضيات Claude `.lsp.json` وافتراضيات `lspServers` المعلنة في manifest، وCursor command-skills، وأدلة Codex hook المتوافقة.

يعرض `openclaw plugins inspect <id>` أيضًا قدرات الحزمة المكتشفة بالإضافة إلى إدخالات خوادم MCP وLSP المدعومة أو غير المدعومة لـ Plugins المدعومة بالحزم.

يمكن أن تكون مصادر marketplace اسم marketplace معروفًا لـ Claude من `~/.claude/plugins/known_marketplaces.json`، أو جذر marketplace محليًا أو مسار `marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع GitHub، أو عنوان URL لـ git. بالنسبة إلى marketplaces البعيدة، يجب أن تبقى إدخالات Plugin داخل مستودع marketplace المستنسخ وأن تستخدم مصادر مسارات نسبية فقط.

راجع [مرجع CLI لـ `openclaw plugins`](/ar/cli/plugins) للتفاصيل الكاملة.

## نظرة عامة على واجهة Plugin البرمجية

تصدّر Plugins الأصلية كائن إدخال يوفّر `register(api)`. قد تظل Plugins الأقدم تستخدم `activate(api)` كاسم مستعار قديم، لكن ينبغي على Plugins الجديدة استخدام `register`.

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

يحمّل OpenClaw كائن الإدخال ويستدعي `register(api)` أثناء تفعيل Plugin. لا يزال المحمّل يعود إلى `activate(api)` مع Plugins الأقدم، لكن ينبغي على Plugins المضمّنة وPlugins الخارجية الجديدة التعامل مع `register` على أنه العقد العام.

يوضح `api.registrationMode` لـ Plugin سبب تحميل إدخالها:

| الوضع | المعنى |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | تفعيل وقت التشغيل. سجّل الأدوات، وhooks، والخدمات، والأوامر، والمسارات، وآثارًا جانبية حية أخرى. |
| `discovery` | اكتشاف قدرات للقراءة فقط. سجّل الموفّرين وبيانات التعريف؛ قد تُحمّل تعليمات إدخال Plugin الموثوقة، لكن تخطَّ الآثار الجانبية الحية. |
| `setup-only` | تحميل بيانات تعريف إعداد القناة عبر إدخال إعداد خفيف. |
| `setup-runtime` | تحميل إعداد القناة الذي يحتاج أيضًا إلى إدخال وقت التشغيل. |
| `cli-metadata` | جمع بيانات تعريف أوامر CLI فقط. |

ينبغي لإدخالات Plugin التي تفتح sockets أو قواعد بيانات أو عاملين في الخلفية أو عملاء طويلَي العمر أن تحرس تلك الآثار الجانبية باستخدام `api.registrationMode === "full"`. تُخزَّن تحميلات الاكتشاف مؤقتًا بصورة منفصلة عن تحميلات التفعيل ولا تستبدل سجل Gateway الجاري. الاكتشاف غير مُفعِّل، لكنه ليس بلا استيراد: قد يقيّم OpenClaw إدخال Plugin الموثوق أو وحدة Plugin الخاصة بالقناة لبناء اللقطة. أبقِ المستويات العليا للوحدات خفيفة وخالية من الآثار الجانبية، وانقل عملاء الشبكة، والعمليات الفرعية، والمستمعين، وقراءات بيانات الاعتماد، وبدء تشغيل الخدمات خلف مسارات وقت التشغيل الكامل.

طرق التسجيل الشائعة:

| الطريقة | ما تسجله |
| --------------------------------------- | --------------------------- |
| `registerProvider` | موفّر نموذج (LLM) |
| `registerChannel` | قناة دردشة |
| `registerTool` | أداة وكيل |
| `registerHook` / `on(...)` | hooks دورة الحياة |
| `registerSpeechProvider` | تحويل النص إلى كلام / STT |
| `registerRealtimeTranscriptionProvider` | STT تدفقي |
| `registerRealtimeVoiceProvider` | صوت آني ثنائي الاتجاه |
| `registerMediaUnderstandingProvider` | تحليل الصور/الصوت |
| `registerImageGenerationProvider` | توليد الصور |
| `registerMusicGenerationProvider` | توليد الموسيقى |
| `registerVideoGenerationProvider` | توليد الفيديو |
| `registerWebFetchProvider` | موفّر جلب / استخراج الويب |
| `registerWebSearchProvider` | بحث الويب |
| `registerHttpRoute` | نقطة نهاية HTTP |
| `registerCommand` / `registerCli` | أوامر CLI |
| `registerContextEngine` | محرك السياق |
| `registerService` | خدمة خلفية |

سلوك الحراسة لـ hooks دورة الحياة المطبوعة:

- `before_tool_call`: يكون `{ block: true }` نهائيًا؛ ويتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: يكون `{ block: false }` بلا أثر ولا يمحو حظرًا سابقًا.
- `before_install`: يكون `{ block: true }` نهائيًا؛ ويتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_install`: يكون `{ block: false }` بلا أثر ولا يمحو حظرًا سابقًا.
- `message_sending`: يكون `{ cancel: true }` نهائيًا؛ ويتم تخطي المعالجات ذات الأولوية الأدنى.
- `message_sending`: يكون `{ cancel: false }` بلا أثر ولا يمحو إلغاءً سابقًا.

تشغّل خوادم تطبيق Codex الأصلية أحداث أدوات Codex الأصلية عبر جسر يعيدها إلى سطح الخطاف هذا. يمكن لـ Plugins حظر أدوات Codex الأصلية من خلال `before_tool_call`، ومراقبة النتائج من خلال `after_tool_call`، والمشاركة في موافقات `PermissionRequest` في Codex. لا يعيد الجسر كتابة وسيطات أدوات Codex الأصلية بعد. يقع حد دعم وقت تشغيل Codex الدقيق في
[عقد دعم حاضنة Codex الإصدار 1](/ar/plugins/codex-harness#v1-support-contract).

للاطلاع على السلوك الكامل للخطافات ذات الأنواع المحددة، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#hook-decision-semantics).

## ذات صلة

- [إنشاء Plugins](/ar/plugins/building-plugins) - أنشئ Plugin خاصًا بك
- [حزم Plugin](/ar/plugins/bundles) - توافق حزم Codex/Claude/Cursor
- [بيان Plugin](/ar/plugins/manifest) - مخطط البيان
- [تسجيل الأدوات](/ar/plugins/building-plugins#registering-agent-tools) - أضف أدوات الوكيل في Plugin
- [بنية Plugin الداخلية](/ar/plugins/architecture) - نموذج الإمكانات ومسار التحميل
- [Plugins المجتمع](/ar/plugins/community) - قوائم الجهات الخارجية
