---
read_when:
    - تثبيت Plugins أو تهيئتها
    - فهم قواعد اكتشاف Plugin وتحميله
    - العمل مع حزم Plugin المتوافقة مع Codex/Claude
sidebarTitle: Install and Configure
summary: ثبّت Plugins OpenClaw وتهيئتها وإدارتها
title: Plugins
x-i18n:
    generated_at: "2026-05-07T13:30:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef355ac480bce7140049f59d3d01909de2cf2fdf80ad07db62e05ee997840c81
    source_path: tools/plugin.md
    workflow: 16
---

تضيف Plugins إلى OpenClaw قدرات جديدة: القنوات، ومزوّدي النماذج،
وحاضنات الوكلاء، والأدوات، وSkills، والكلام، والنسخ الفوري، والصوت الفوري،
وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب، والبحث في الويب،
وغير ذلك. بعض Plugins هي **أساسية** (تُشحن مع OpenClaw)، وأخرى
**خارجية**. تُنشر معظم Plugins الخارجية وتُكتشف من خلال
[ClawHub](/ar/tools/clawhub). يظل npm مدعومًا للتثبيت المباشر ولمجموعة مؤقتة
من حزم Plugin المملوكة لـ OpenClaw إلى أن تكتمل تلك الهجرة.

## البدء السريع

لأمثلة النسخ واللصق الخاصة بالتثبيت، والسرد، وإلغاء التثبيت، والتحديث،
والنشر، راجع [إدارة Plugins](/ar/plugins/manage-plugins).

<Steps>
  <Step title="اطّلع على ما تم تحميله">
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
    openclaw plugins install npm-pack:./openclaw-plugin-1.2.3.tgz

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

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

  <Step title="إدارة مدمجة في الدردشة">
    في Gateway قيد التشغيل، يشغّل الأمران المقتصران على المالك `/plugins enable` و`/plugins disable`
    معيد تحميل إعدادات Gateway. يعيد Gateway تحميل أسطح تشغيل Plugin
    داخل العملية، وتعيد أدوار الوكيل الجديدة بناء قائمة أدواتها من
    السجل المحدّث. يغيّر `/plugins install` الشيفرة المصدرية لـ Plugin، لذلك
    يطلب Gateway إعادة تشغيل بدلًا من التظاهر بأن العملية الحالية تستطيع
    إعادة تحميل الوحدات التي سبق استيرادها بأمان.

  </Step>

  <Step title="تحقّق من Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    استخدم `--runtime` عندما تحتاج إلى إثبات الأدوات، أو الخدمات، أو طرائق Gateway،
    أو الخطافات، أو أوامر CLI المملوكة لـ Plugin والمسجلة. أما `inspect` العادي فهو
    فحص بارد للبيان/السجل ويتجنب عمدًا استيراد تشغيل Plugin.

  </Step>
</Steps>

إذا كنت تفضّل التحكم المدمج في الدردشة، ففعّل `commands.plugins: true` واستخدم:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

يستخدم مسار التثبيت نفس المحلّل الذي يستخدمه CLI: مسار/أرشيف محلي، أو
`clawhub:<pkg>` صريح، أو `npm:<pkg>` صريح، أو `npm-pack:<path.tgz>` صريح،
أو `git:<repo>` صريح، أو مواصفة حزمة مجردة عبر npm.

إذا كانت الإعدادات غير صالحة، يفشل التثبيت عادةً بشكل مغلق ويوجهك إلى
`openclaw doctor --fix`. استثناء الاسترداد الوحيد هو مسار ضيق لإعادة تثبيت
Plugin مضمّن لـ Plugins التي تختار الاشتراك في
`openclaw.install.allowInvalidConfigRecovery`.
أثناء بدء تشغيل Gateway، تفشل إعدادات Plugin غير الصالحة بشكل مغلق مثل أي
إعدادات أخرى غير صالحة. شغّل `openclaw doctor --fix` لعزل إعدادات Plugin
السيئة عبر تعطيل إدخال ذلك Plugin وإزالة حمولة إعداداته غير الصالحة؛ وتحتفظ
نسخة الإعدادات الاحتياطية العادية بالقيم السابقة.
عندما تشير إعدادات قناة إلى Plugin لم يعد قابلًا للاكتشاف بينما يبقى معرّف
Plugin القديم نفسه في إعدادات Plugin أو سجلات التثبيت، يسجل بدء تشغيل Gateway
تحذيرات ويتخطى تلك القناة بدلًا من حظر كل قناة أخرى. شغّل
`openclaw doctor --fix` لإزالة إدخالات القناة/Plugin القديمة؛ أما مفاتيح
القنوات المجهولة بلا دليل على Plugin قديم فتظل تفشل في التحقق حتى تبقى
الأخطاء المطبعية ظاهرة.
إذا تم تعيين `plugins.enabled: false`، تُعامل إشارات Plugin القديمة كخاملة:
يتخطى بدء تشغيل Gateway عمل اكتشاف/تحميل Plugin ويحافظ `openclaw doctor`
على إعدادات Plugin المعطلة بدلًا من إزالتها تلقائيًا. أعد تمكين Plugins قبل
تشغيل تنظيف doctor إذا أردت إزالة معرّفات Plugin القديمة.

لا يحدث تثبيت اعتماديات Plugin إلا أثناء مسارات التثبيت/التحديث الصريحة أو
إصلاح doctor. لا يشغّل بدء تشغيل Gateway، أو إعادة تحميل الإعدادات، أو فحص
التشغيل مديري الحزم ولا يصلح أشجار الاعتماديات. يجب أن تكون Plugins المحلية
قد ثُبّتت اعتمادياتها مسبقًا، بينما تُثبّت Plugins من npm وgit وClawHub تحت
جذور Plugin المدارة من OpenClaw. قد تُرفع اعتماديات npm داخل جذر npm المدار
من OpenClaw؛ يفحص التثبيت/التحديث ذلك الجذر المدار قبل الثقة، وتزيل عملية
إلغاء التثبيت الحزم المدارة بواسطة npm من خلال npm. يجب أن تظل Plugins
الخارجية ومسارات التحميل المخصصة مثبتة عبر `openclaw plugins install`.
استخدم `openclaw plugins list --json` لرؤية `dependencyStatus` الثابتة لكل
Plugin ظاهر دون استيراد شيفرة التشغيل أو إصلاح الاعتماديات.
راجع [حل اعتماديات Plugin](/ar/plugins/dependency-resolution) لدورة حياة وقت
التثبيت.

### ملكية مسار Plugin المحظور

إذا قالت تشخيصات Plugin:
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
وتبع التحقق من الإعدادات الرسالة `plugin present but blocked`، فهذا يعني أن OpenClaw وجد
ملفات Plugin مملوكة لمستخدم Unix مختلف عن العملية التي تحمّلها. أبقِ إعدادات
Plugin كما هي؛ أصلح ملكية نظام الملفات أو شغّل OpenClaw بالمستخدم نفسه الذي
يملك دليل الحالة.

لتثبيتات Docker، تعمل الصورة الرسمية باسم `node` (uid `1000`)، لذلك ينبغي عادةً أن تكون
أدلة إعدادات ومساحة عمل OpenClaw المركّبة من المضيف مملوكة للمعرّف uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

إذا كنت تشغّل OpenClaw كجذر عمدًا، فأصلح جذر Plugin المدار ليكون بملكية
الجذر بدلًا من ذلك:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

بعد إصلاح الملكية، أعد تشغيل `openclaw doctor --fix` أو
`openclaw plugins registry --refresh` حتى يطابق سجل Plugin المحفوظ الملفات
المصلحة.

بالنسبة إلى تثبيتات npm، تُحل المحددات القابلة للتغيير مثل `latest` أو dist-tag
قبل التثبيت ثم تُثبّت على الإصدار الدقيق المتحقق منه في جذر npm المدار
من OpenClaw. بعد أن ينتهي npm، يتحقق OpenClaw من أن إدخال
`package-lock.json` المثبت لا يزال يطابق الإصدار المحلول وسلامته. إذا كتب
npm بيانات تعريف حزمة مختلفة، يفشل التثبيت ويُعاد التراجع عن الحزمة المدارة
بدلًا من قبول أثر Plugin مختلف.
ترث جذور npm المدارة أيضًا `overrides` الخاصة بـ npm على مستوى حزمة OpenClaw،
لذلك تنطبق تثبيتات الأمان التي تحمي المضيف المحزّم أيضًا على اعتماديات
Plugin الخارجية المرفوعة.

عمليات سحب المصدر هي مساحات عمل pnpm. إذا استنسخت OpenClaw للعمل على
Plugins المضمّنة، شغّل `pnpm install`؛ عندها يحمّل OpenClaw Plugins المضمّنة من
`extensions/<id>` حتى تُستخدم التعديلات والاعتماديات المحلية للحزمة مباشرة.
تثبيتات جذر npm العادية مخصصة لـ OpenClaw المحزّم، وليست لتطوير نسخ سحب
المصدر.

## أنواع Plugin

يتعرف OpenClaw على تنسيقين لـ Plugin:

| التنسيق     | كيفية عمله                                                       | أمثلة                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **أصلي** | `openclaw.plugin.json` + وحدة تشغيل؛ ينفذ داخل العملية       | Plugins رسمية، حزم npm من المجتمع               |
| **حزمة** | تخطيط متوافق مع Codex/Claude/Cursor؛ يُربط بميزات OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

يظهر كلاهما ضمن `openclaw plugins list`. راجع [حزم Plugin](/ar/plugins/bundles) لتفاصيل الحزم.

إذا كنت تكتب Plugin أصليًا، فابدأ بـ [بناء Plugins](/ar/plugins/building-plugins)
و[نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

## نقاط دخول الحزمة

يجب أن تعلن حزم npm الخاصة بـ Plugin الأصلي عن `openclaw.extensions` في `package.json`.
يجب أن يبقى كل إدخال داخل دليل الحزمة وأن يتحول إلى ملف تشغيل قابل للقراءة،
أو إلى ملف مصدر TypeScript له نظير JavaScript مبني مستنتج مثل `src/index.ts` إلى `dist/index.js`.
يجب أن تشحن التثبيتات المحزّمة مخرجات تشغيل JavaScript هذه. خيار الرجوع إلى
مصدر TypeScript مخصص لنسخ سحب المصدر ومسارات التطوير المحلية، وليس لحزم
npm المثبتة في جذر Plugin المدار من OpenClaw.

إذا قال تحذير حزمة مدارة إنها `requires compiled runtime output for
TypeScript entry ...`، فهذا يعني أن الحزمة نُشرت دون ملفات JavaScript
التي يحتاجها OpenClaw وقت التشغيل. هذه مشكلة تحزيم Plugin، وليست مشكلة
إعدادات محلية. حدّث Plugin أو أعد تثبيته بعد أن يعيد الناشر نشر JavaScript
المترجم، أو عطّل/ألغِ تثبيت ذلك Plugin إلى أن تتوفر حزمة مصححة.

استخدم `openclaw.runtimeExtensions` عندما لا تكون ملفات التشغيل المنشورة في
المسارات نفسها مثل إدخالات المصدر. عند وجود `runtimeExtensions`، يجب أن تحتوي
على إدخال واحد بالضبط لكل إدخال في `extensions`. تفشل القوائم غير المتطابقة
في التثبيت واكتشاف Plugin بدلًا من الرجوع بصمت إلى مسارات المصدر. إذا نشرت
أيضًا `openclaw.setupEntry`، فاستخدم `openclaw.runtimeSetupEntry` لنظيره
المبني من JavaScript؛ يكون ذلك الملف مطلوبًا عند التصريح به.

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
المغلّفة بالفعل العديد من Plugins الرسمية، لذلك لا تحتاج هذه إلى تثبيتات npm
منفصلة في الإعدادات العادية. إلى أن تهاجر كل Plugin مملوكة لـ OpenClaw إلى
ClawHub، لا يزال OpenClaw يشحن بعض حزم Plugin `@openclaw/*` على npm للتثبيتات
الأقدم/المخصصة وتدفقات عمل npm المباشرة.

إذا أبلغ npm عن حزمة Plugin من `@openclaw/*` على أنها مهملة، فإن إصدار الحزمة
هذا من سلسلة حزم خارجية أقدم. استخدم Plugin المضمّن من OpenClaw الحالي أو
نسخة سحب محلية إلى أن تُنشر حزمة npm أحدث.

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
    - `memory-core` - بحث الذاكرة المضمّن (الافتراضي عبر `plugins.slots.memory`)
    - `memory-lancedb` - ذاكرة طويلة الأمد مدعومة بـ LanceDB مع استدعاء/التقاط تلقائي (اضبط `plugins.slots.memory = "memory-lancedb"`)

    راجع [Memory LanceDB](/ar/plugins/memory-lancedb) لإعداد التضمينات المتوافقة مع OpenAI،
    وأمثلة Ollama، وحدود الاستدعاء، واستكشاف الأخطاء وإصلاحها.

  </Accordion>

  <Accordion title="مزودو الكلام (مفعّلون افتراضيًا)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="أخرى">
    - `browser` - Plugin المتصفح المضمّن لأداة المتصفح، وCLI `openclaw browser`، وطريقة Gateway `browser.request`، وبيئة تشغيل المتصفح، وخدمة التحكم الافتراضية في المتصفح (مفعّل افتراضيًا؛ عطّله قبل استبداله)
    - `copilot-proxy` - جسر VS Code Copilot Proxy (معطّل افتراضيًا)

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
| `allow`            | قائمة السماح للـ Plugin (اختياري)                               |
| `bundledDiscovery` | وضع اكتشاف الـ Plugin المضمّن (`allowlist` افتراضيًا)    |
| `deny`             | قائمة حظر الـ Plugin (اختياري؛ الحظر يتغلب)                     |
| `load.paths`       | ملفات/أدلة Plugin إضافية                            |
| `slots`            | محددات الخانات الحصرية (مثل `memory`، `contextEngine`) |
| `entries.\<id\>`   | مفاتيح تفعيل وإعدادات لكل Plugin                               |

`plugins.allow` حصرية. عندما تكون غير فارغة، لا يمكن تحميل أو كشف الأدوات إلا للـ Plugins المدرجة
حتى إذا كانت `tools.allow` تحتوي على `"*"` أو اسم أداة محدد مملوك لـ Plugin.
إذا أشارت قائمة سماح الأدوات إلى أدوات Plugin، فأضف معرفات الـ Plugins المالكة
إلى `plugins.allow` أو أزل `plugins.allow`؛ يحذر `openclaw doctor` من هذا
الشكل.

تكون القيمة الافتراضية لـ `plugins.bundledDiscovery` هي `"allowlist"` للإعدادات الجديدة، لذلك فإن
مخزون `plugins.allow` المقيّد يحظر أيضًا Plugins المزوّدين المضمّنة المحذوفة،
بما في ذلك اكتشاف مزود بحث الويب في وقت التشغيل. يوسم doctor إعدادات
قائمة السماح المقيّدة الأقدم بـ `"compat"` أثناء الترحيل لكي تحافظ الترقيات على
سلوك مزود Plugins المضمّن القديم إلى أن يختار المشغّل الوضع الأكثر صرامة.
ما تزال `plugins.allow` الفارغة تُعامل على أنها غير مضبوطة/مفتوحة.

تؤدي تغييرات الإعدادات التي تُجرى عبر `/plugins enable` أو `/plugins disable` إلى
إعادة تحميل Plugin في Gateway داخل العملية. تعيد أدوار الوكلاء الجديدة بناء قائمة أدواتها من
سجل الـ Plugin المحدّث. ما تزال العمليات التي تغيّر المصدر مثل install،
وupdate، وuninstall تعيد تشغيل عملية Gateway لأن وحدات Plugin المستوردة مسبقًا
لا يمكن استبدالها بأمان في مكانها.

`openclaw plugins list` هي لقطة محلية لسجل/إعدادات الـ Plugin. وجود Plugin
بحالة `enabled` هناك يعني أن السجل المحفوظ والإعدادات الحالية يسمحان للـ
Plugin بالمشاركة. لا يثبت ذلك أن Gateway بعيدة تعمل بالفعل قد أعادت التحميل
أو أعيد تشغيلها على رمز Plugin نفسه. في إعدادات VPS/الحاويات ذات عمليات التغليف،
أرسل عمليات إعادة التشغيل أو الكتابات التي تشغّل إعادة التحميل إلى عملية
`openclaw gateway run` الفعلية، أو استخدم `openclaw gateway restart` ضد
Gateway العاملة عندما تبلغ إعادة التحميل عن فشل.

<Accordion title="حالات الـ Plugin: معطّل مقابل مفقود مقابل غير صالح">
  - **معطّل**: يوجد الـ Plugin لكن قواعد التفعيل أوقفته. تُحفظ الإعدادات.
  - **مفقود**: تشير الإعدادات إلى معرف Plugin لم يعثر عليه الاكتشاف.
  - **غير صالح**: يوجد الـ Plugin لكن إعداداته لا تطابق المخطط المعلن. يتخطى بدء تشغيل Gateway ذلك الـ Plugin فقط؛ يمكن لـ `openclaw doctor --fix` عزل الإدخال غير الصالح عبر تعطيله وإزالة حمولة إعداداته.

</Accordion>

## الاكتشاف والأسبقية

يفحص OpenClaw الـ Plugins بهذا الترتيب (أول تطابق يفوز):

<Steps>
  <Step title="مسارات الإعدادات">
    `plugins.load.paths` - مسارات ملفات أو أدلة صريحة. يتم تجاهل المسارات التي تشير
    مرة أخرى إلى أدلة الـ Plugin المضمّنة الخاصة بحزمة OpenClaw نفسها؛
    شغّل `openclaw doctor --fix` لإزالة تلك الأسماء المستعارة القديمة.
  </Step>

  <Step title="Plugins مساحة العمل">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins العامة">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins المضمّنة">
    تُشحن مع OpenClaw. كثير منها مفعّل افتراضيًا (مزودو النماذج، الكلام).
    وتتطلب أخرى تفعيلًا صريحًا.
  </Step>
</Steps>

عادةً ما تحل التثبيتات المعبأة وصور Docker الـ Plugins المضمّنة من شجرة
`dist/extensions` المجمّعة. إذا تم ربط دليل مصدر Plugin مضمّن بالمسار المطابق
لمصدر الحزمة، على سبيل المثال `/app/extensions/synology-chat`، يتعامل OpenClaw
مع دليل المصدر المركّب هذا كتراكب مصدر مضمّن ويكتشفه قبل حزمة
`/app/dist/extensions/synology-chat` المعبأة. يحافظ ذلك على عمل حلقات
حاويات الصيانة دون إعادة كل Plugin مضمّن إلى مصدر TypeScript. اضبط
`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` لإجبار حزم dist المعبأة
حتى عند وجود تركيبات تراكب المصدر.

### قواعد التفعيل

- `plugins.enabled: false` يعطّل كل الـ Plugins ويتخطى أعمال اكتشاف/تحميل الـ Plugin
- `plugins.deny` يتغلب دائمًا على السماح
- `plugins.entries.\<id\>.enabled: false` يعطّل ذلك الـ Plugin
- Plugins ذات أصل مساحة العمل **معطّلة افتراضيًا** (يجب تفعيلها صراحة)
- تتبع الـ Plugins المضمّنة مجموعة التفعيل الافتراضي المدمجة ما لم يتم تجاوزها
- يمكن للخانات الحصرية أن تفعّل قسرًا الـ Plugin المحدد لتلك الخانة
- تُفعّل بعض Plugins المضمّنة الاختيارية تلقائيًا عندما تسمي الإعدادات سطحًا
  مملوكًا لـ Plugin، مثل مرجع نموذج مزود، أو إعداد قناة، أو بيئة تشغيل harness
- تُحفظ إعدادات Plugin القديمة عندما يكون `plugins.enabled: false` نشطًا؛
  أعد تفعيل الـ Plugins قبل تشغيل تنظيف doctor إذا كنت تريد إزالة المعرفات القديمة
- تحافظ مسارات Codex من عائلة OpenAI على حدود Plugin منفصلة:
  `openai-codex/*` ينتمي إلى Plugin OpenAI، بينما يُحدد Plugin خادم تطبيق Codex
  المضمّن عبر `agentRuntime.id: "codex"` أو مراجع نماذج `codex/*` القديمة

## استكشاف أخطاء خطافات وقت التشغيل وإصلاحها

إذا ظهر Plugin في `plugins list` لكن الآثار الجانبية أو الخطافات الخاصة بـ `register(api)`
لا تعمل في حركة محادثة مباشرة، فتحقق من هذه أولًا:

- شغّل `openclaw gateway status --deep --require-rpc` وتأكد من أن عنوان URL الخاص بـ
  Gateway النشطة، والملف الشخصي، ومسار الإعدادات، والعملية هي نفسها التي تعدّلها.
- أعد تشغيل Gateway المباشرة بعد تغييرات تثبيت/إعداد/رمز Plugin. في الحاويات
  ذات التغليف، قد يكون PID 1 مشرفًا فقط؛ أعد تشغيل أو أرسل إشارة إلى العملية الفرعية
  `openclaw gateway run`.
- استخدم `openclaw plugins inspect <id> --runtime --json` لتأكيد تسجيلات الخطافات
  والتشخيصات. تحتاج خطافات المحادثة غير المضمّنة مثل `before_model_resolve`،
  و`before_agent_reply`، و`before_agent_run`، و`llm_input`، و`llm_output`،
  و`before_agent_finalize`، و`agent_end` إلى
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- لتبديل النماذج، فضّل `before_model_resolve`. يعمل قبل حل النموذج
  لأدوار الوكيل؛ أما `llm_output` فيعمل فقط بعد أن تنتج محاولة نموذج
  مخرجات مساعد.
- لإثبات نموذج الجلسة الفعال، استخدم `openclaw sessions` أو أسطح
  جلسة/حالة Gateway، وعند تصحيح حمولات المزود، ابدأ
  Gateway باستخدام `--raw-stream --raw-stream-path <path>`.

### إعداد أدوات Plugin البطيء

إذا بدا أن أدوار الوكيل تتوقف أثناء إعداد الأدوات، ففعّل تسجيل التتبع وتحقق
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
اختيارية. تُرفع الأسطر البطيئة إلى تحذيرات عندما يستغرق مصنع واحد
ثانية واحدة على الأقل أو يستغرق إعداد مصنع أدوات Plugin الإجمالي 5 ثوانٍ على الأقل.

يخزن OpenClaw نتائج مصنع أدوات Plugin الناجحة مؤقتًا لعمليات الحل المتكررة
بسياق طلب فعال نفسه. يتضمن مفتاح التخزين المؤقت إعدادات وقت التشغيل الفعالة،
ومساحة العمل، ومعرفات الوكيل/الجلسة، وسياسة sandbox، وإعدادات المتصفح،
وسياق التسليم، وهوية الطالب، وحالة الملكية، لذلك تُعاد تشغيل المصانع التي
تعتمد على هذه الحقول الموثوقة عندما يتغير السياق.

إذا هيمن Plugin واحد على التوقيت، فافحص تسجيلاته في وقت التشغيل:

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
أو تدفق الإعداد، أو اسم الأداة. السبب الأكثر شيوعًا هو تثبيت Plugin قناة خارجي
إلى جانب Plugin مضمّن يوفر الآن معرف القناة نفسه.

خطوات التصحيح:

- شغّل `openclaw plugins list --enabled --verbose` لرؤية كل Plugin مفعّل
  وأصله.
- شغّل `openclaw plugins inspect <id> --runtime --json` لكل Plugin مشتبه به و
  قارن `channels`، و`channelConfigs`، و`tools`، والتشخيصات.
- شغّل `openclaw plugins registry --refresh` بعد تثبيت أو إزالة
  حزم Plugin لكي تعكس البيانات الوصفية المحفوظة التثبيت الحالي.
- أعد تشغيل Gateway بعد تغييرات التثبيت أو السجل أو الإعدادات.

خيارات الإصلاح:

- إذا كان Plugin واحد يستبدل عمدًا Plugin آخر لمعرف القناة نفسه، فيجب على
  الـ Plugin المفضل إعلان `channelConfigs.<channel-id>.preferOver` مع
  معرف Plugin ذي الأولوية الأقل. راجع [/plugins/manifest#replacing-another-channel-plugin](/ar/plugins/manifest#replacing-another-channel-plugin).
- إذا كان التكرار غير مقصود، فعطّل أحد الجانبين باستخدام
  `plugins.entries.<plugin-id>.enabled: false` أو أزل تثبيت الـ Plugin
  القديم.
- إذا فعّلت كلا الـ Plugins صراحة، يحافظ OpenClaw على ذلك الطلب
  ويبلغ عن التعارض. اختر مالكًا واحدًا للقناة أو أعد تسمية الأدوات المملوكة لـ Plugin
  لكي يكون سطح وقت التشغيل غير ملتبس.

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

تُشحن Plugins المضمّنة مع OpenClaw. يُفعّل الكثير منها افتراضيًا (على سبيل المثال
موفرو النماذج المضمّنون، وموفرو الكلام المضمّنون، وPlugin المتصفح
المضمّن). لا تزال Plugins المضمّنة الأخرى تحتاج إلى `openclaw plugins enable <id>`.

يستبدل `--force` أي Plugin مثبّتة موجودة أو حزمة hooks في مكانها. استخدم
`openclaw plugins update <id-or-npm-spec>` للترقيات الدورية لـ Plugins npm
المتتبعة. لا يُدعم ذلك مع `--link`، الذي يعيد استخدام مسار المصدر بدلًا
من النسخ فوق هدف تثبيت مُدار.

عندما تكون `plugins.allow` مضبوطة بالفعل، يضيف `openclaw plugins install`
معرّف Plugin المثبّتة إلى قائمة السماح تلك قبل تفعيلها. إذا كان معرّف Plugin نفسه
موجودًا في `plugins.deny`، يزيل التثبيت إدخال المنع القديم هذا بحيث يصبح
التثبيت الصريح قابلًا للتحميل مباشرة بعد إعادة التشغيل.

يحتفظ OpenClaw بسجل Plugin محلي دائم بوصفه نموذج القراءة الباردة
لمخزون Plugins، وملكية المساهمات، وتخطيط بدء التشغيل. تحدّث تدفقات التثبيت
والتحديث وإلغاء التثبيت والتفعيل والتعطيل ذلك السجل بعد تغيير حالة Plugin.
يحتفظ ملف `plugins/installs.json` نفسه ببيانات تعريف التثبيت الدائمة في
`installRecords` ذات المستوى الأعلى، وبيانات تعريف البيان القابلة لإعادة البناء
في `plugins`. إذا كان السجل مفقودًا أو قديمًا أو غير صالح، فإن
`openclaw plugins registry --refresh` يعيد بناء عرض البيان الخاص به من سجلات
التثبيت، وسياسة الإعدادات، وبيانات تعريف البيان/الحزمة دون تحميل وحدات وقت
تشغيل Plugin.

في وضع Nix (`OPENCLAW_NIX_MODE=1`)، تُعطّل أدوات تغيير دورة حياة Plugin.
أدر اختيار حزم Plugin والإعدادات عبر مصدر Nix للتثبيت بدلًا من ذلك؛ بالنسبة إلى
nix-openclaw، ابدأ بـ
[البداية السريعة](https://github.com/openclaw/nix-openclaw#quick-start)
المعتمدة على الوكيل أولًا.
ينطبق `openclaw plugins update <id-or-npm-spec>` على التثبيتات المتتبعة. يؤدي تمرير
مواصفة حزمة npm مع dist-tag أو إصدار محدد إلى حل اسم الحزمة
مرة أخرى إلى سجل Plugin المتتبع وتسجيل المواصفة الجديدة للتحديثات المستقبلية.
يؤدي تمرير اسم الحزمة دون إصدار إلى إعادة تثبيت مثبت بدقة إلى
خط الإصدار الافتراضي في السجل. إذا كانت Plugin npm المثبّتة تطابق بالفعل
الإصدار المحلول وهوية الأثر المسجلة، يتخطى OpenClaw التحديث
دون تنزيل أو إعادة تثبيت أو إعادة كتابة الإعدادات.
عند تشغيل `openclaw update` على قناة beta، تحاول سجلات Plugin الخاصة بخط
الإصدار الافتراضي في npm وClawHub استخدام `@beta` أولًا، ثم تعود إلى default/latest
عندما لا يوجد إصدار beta لـ Plugin. تبقى الإصدارات المحددة والوسوم الصريحة مثبتة.

`--pin` خاص بـ npm فقط. لا يُدعم مع `--marketplace`، لأن
تثبيتات marketplace تحفظ بيانات تعريف مصدر marketplace بدلًا من مواصفة npm.

`--dangerously-force-unsafe-install` هو تجاوز طارئ للحالات الإيجابية الكاذبة
من ماسح التعليمات البرمجية الخطرة المدمج. يسمح لمثبّتات Plugin
وتحديثات Plugin بالاستمرار بعد نتائج `critical` المدمجة، لكنه لا يزال
لا يتجاوز حظر سياسة `before_install` الخاصة بـ Plugin أو حظر فشل الفحص.
تتجاهل فحوصات التثبيت ملفات وأدلة الاختبار الشائعة مثل `tests/`،
و`__tests__/`، و`*.test.*`، و`*.spec.*` لتجنب حظر mocks الاختبار المعبأة؛
ولا تزال نقاط دخول وقت تشغيل Plugin المعلنة تُفحص حتى إذا استخدمت واحدًا من
تلك الأسماء.

ينطبق علم CLI هذا على تدفقات تثبيت/تحديث Plugin فقط. تستخدم تثبيتات
اعتماد Skills المدعومة من Gateway تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`
بدلًا من ذلك، بينما يبقى `openclaw skills install` تدفق تنزيل/تثبيت Skills
المنفصل من ClawHub.

إذا كانت Plugin نشرتها على ClawHub مخفية أو محظورة بسبب فحص، فافتح
لوحة معلومات ClawHub أو شغّل `clawhub package rescan <name>` لطلب أن يفحصها
ClawHub مرة أخرى. يؤثر `--dangerously-force-unsafe-install` فقط في التثبيتات على
جهازك؛ ولا يطلب من ClawHub إعادة فحص Plugin أو جعل إصدار محظور
عامًا.

تشارك الحزم المتوافقة في تدفق سرد/فحص/تفعيل/تعطيل Plugin نفسه.
يشمل دعم وقت التشغيل الحالي Skills الحزمة، وSkills أوامر Claude،
وافتراضيات `settings.json` في Claude، وافتراضيات `.lsp.json` في Claude و
`lspServers` المعلنة في البيان، وSkills أوامر Cursor، وأدلة hooks
المتوافقة مع Codex.

يعرض `openclaw plugins inspect <id>` أيضًا قدرات الحزمة المكتشفة بالإضافة إلى
إدخالات خوادم MCP وLSP المدعومة أو غير المدعومة لـ Plugins المدعومة بحزم.

يمكن أن تكون مصادر marketplace اسم marketplace معروفًا في Claude من
`~/.claude/plugins/known_marketplaces.json`، أو جذر marketplace محليًا أو
مسار `marketplace.json`، أو صيغة GitHub مختصرة مثل `owner/repo`، أو عنوان URL
لمستودع GitHub، أو عنوان URL لـ git. بالنسبة إلى marketplaces البعيدة، يجب أن تبقى
إدخالات Plugin داخل مستودع marketplace المستنسخ وأن تستخدم مصادر مسارات نسبية فقط.

راجع [مرجع CLI لـ `openclaw plugins`](/ar/cli/plugins) للاطلاع على التفاصيل الكاملة.

## نظرة عامة على واجهة API الخاصة بـ Plugin

تصدّر Plugins الأصلية كائن إدخال يعرّض `register(api)`. قد تستمر
Plugins القديمة في استخدام `activate(api)` كاسم مستعار قديم، لكن ينبغي
لـ Plugins الجديدة استخدام `register`.

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
لا يزال المحمّل يعود إلى `activate(api)` بالنسبة إلى Plugins الأقدم،
لكن ينبغي لـ Plugins المضمّنة وPlugins الخارجية الجديدة التعامل مع `register` على أنه
العقد العام.

يوضح `api.registrationMode` لـ Plugin سبب تحميل إدخالها:

| الوضع           | المعنى                                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `full`          | تفعيل وقت التشغيل. سجّل الأدوات، وhooks، والخدمات، والأوامر، والمسارات، والآثار الجانبية الحية الأخرى.                       |
| `discovery`     | اكتشاف قدرات للقراءة فقط. سجّل الموفرين وبيانات التعريف؛ قد تُحمّل شيفرة إدخال Plugin الموثوقة، لكن تخطَّ الآثار الجانبية الحية. |
| `setup-only`    | تحميل بيانات تعريف إعداد القناة عبر إدخال إعداد خفيف.                                                                        |
| `setup-runtime` | تحميل إعداد القناة الذي يحتاج أيضًا إلى إدخال وقت التشغيل.                                                                    |
| `cli-metadata`  | جمع بيانات تعريف أوامر CLI فقط.                                                                                              |

ينبغي لإدخالات Plugin التي تفتح مآخذ أو قواعد بيانات أو عاملين في الخلفية أو
عملاء طويلي العمر حماية تلك الآثار الجانبية باستخدام `api.registrationMode === "full"`.
تُخزّن تحميلات الاكتشاف مؤقتًا بشكل منفصل عن تحميلات التفعيل ولا تستبدل
سجل Gateway الجاري. الاكتشاف غير مفعِّل، وليس خاليًا من الاستيراد:
قد يقيّم OpenClaw إدخال Plugin الموثوق أو وحدة Plugin القناة لبناء
اللقطة. أبقِ المستويات العليا للوحدات خفيفة وخالية من الآثار الجانبية، وانقل
عملاء الشبكة، والعمليات الفرعية، والمستمعين، وقراءات بيانات الاعتماد، وبدء
الخدمات خلف مسارات وقت التشغيل الكامل.

طرق التسجيل الشائعة:

| الطريقة                                 | ما تسجله                         |
| --------------------------------------- | -------------------------------- |
| `registerProvider`                      | موفر نموذج (LLM)                 |
| `registerChannel`                       | قناة دردشة                       |
| `registerTool`                          | أداة وكيل                        |
| `registerHook` / `on(...)`              | hooks دورة الحياة                |
| `registerSpeechProvider`                | تحويل النص إلى كلام / STT        |
| `registerRealtimeTranscriptionProvider` | STT متدفق                        |
| `registerRealtimeVoiceProvider`         | صوت فوري ثنائي الاتجاه           |
| `registerMediaUnderstandingProvider`    | تحليل الصور/الصوت                |
| `registerImageGenerationProvider`       | توليد الصور                      |
| `registerMusicGenerationProvider`       | توليد الموسيقى                   |
| `registerVideoGenerationProvider`       | توليد الفيديو                    |
| `registerWebFetchProvider`              | موفر جلب الويب / الكشط           |
| `registerWebSearchProvider`             | بحث الويب                        |
| `registerHttpRoute`                     | نقطة نهاية HTTP                  |
| `registerCommand` / `registerCli`       | أوامر CLI                        |
| `registerContextEngine`                 | محرك السياق                      |
| `registerService`                       | خدمة خلفية                       |

سلوك حارس hooks الخاصة بدورة الحياة المكتوبة:

- `before_tool_call`: تكون `{ block: true }` نهائية؛ ويتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: تكون `{ block: false }` بلا أثر ولا تمحو حظرًا سابقًا.
- `before_install`: تكون `{ block: true }` نهائية؛ ويتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_install`: تكون `{ block: false }` بلا أثر ولا تمحو حظرًا سابقًا.
- `message_sending`: تكون `{ cancel: true }` نهائية؛ ويتم تخطي المعالجات ذات الأولوية الأدنى.
- `message_sending`: تكون `{ cancel: false }` بلا أثر ولا تمحو إلغاءً سابقًا.

تشغّل عمليات خادم التطبيق الأصلية في Codex أحداث أدوات Codex الأصلية مرة أخرى في سطح هذا الخطاف. يمكن لـ Plugins حظر أدوات Codex الأصلية عبر `before_tool_call`، ومراقبة النتائج عبر `after_tool_call`، والمشاركة في موافقات `PermissionRequest` في Codex. لا يعيد الجسر كتابة وسيطات أدوات Codex الأصلية بعد. يقع حد الدعم الدقيق لبيئة تشغيل Codex في
[عقد دعم إطار Codex الإصدار 1](/ar/plugins/codex-harness#v1-support-contract).

للاطلاع على سلوك الخطافات المكتوب بالكامل، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#hook-decision-semantics).

## ذو صلة

- [إنشاء Plugins](/ar/plugins/building-plugins) - أنشئ Plugin الخاص بك
- [حزم Plugin](/ar/plugins/bundles) - توافق حزم Codex/Claude/Cursor
- [بيان Plugin](/ar/plugins/manifest) - مخطط البيان
- [تسجيل الأدوات](/ar/plugins/building-plugins#registering-agent-tools) - أضف أدوات الوكيل في Plugin
- [داخليات Plugin](/ar/plugins/architecture) - نموذج القدرات ومسار التحميل
- [Plugins المجتمع](/ar/plugins/community) - قوائم الجهات الخارجية
