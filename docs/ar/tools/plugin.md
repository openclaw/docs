---
read_when:
    - تثبيت Plugins أو تكوينها
    - فهم قواعد اكتشاف Plugin وتحميله
    - العمل مع حزم Plugin المتوافقة مع Codex/Claude
sidebarTitle: Install and Configure
summary: تثبيت Plugins الخاصة بـ OpenClaw وتكوينها وإدارتها
title: Plugins
x-i18n:
    generated_at: "2026-05-12T08:47:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: e8773fc3feb19c867b1978f21d83f1cad1752d5a2572ad607d481539ad7471df
    source_path: tools/plugin.md
    workflow: 16
---

توسّع Plugins قدرات OpenClaw بإضافة إمكانات جديدة: القنوات، وموفرو النماذج،
ومشغلات الوكلاء، والأدوات، وSkills، والكلام، والنسخ الفوري، والصوت الفوري،
وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب، والبحث في الويب،
والمزيد. بعض Plugins **أساسية** (تُشحن مع OpenClaw)، وبعضها الآخر
**خارجية**. تُنشر وتُكتشف معظم Plugins الخارجية عبر
[ClawHub](/ar/clawhub). يظل npm مدعومًا للتثبيت المباشر ولمجموعة مؤقتة من حزم
Plugin المملوكة لـ OpenClaw ريثما تكتمل عملية الترحيل تلك.

## البدء السريع

لأمثلة التثبيت، والسرد، وإلغاء التثبيت، والتحديث، والنشر الجاهزة للنسخ واللصق، راجع
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

    بعد ذلك اضبط الإعدادات ضمن `plugins.entries.\<id\>.config` في ملف الإعدادات لديك.

  </Step>

  <Step title="الإدارة الأصلية من الدردشة">
    في Gateway قيد التشغيل، تؤدي أوامر المالك فقط `/plugins enable` و`/plugins disable`
    إلى تشغيل معيد تحميل إعدادات Gateway. يعيد Gateway تحميل أسطح تشغيل Plugin
    داخل العملية، وتعيد دورات الوكيل الجديدة بناء قائمة أدواتها من السجل المحدّث.
    يغيّر `/plugins install` شيفرة مصدر Plugin، لذلك يطلب Gateway إعادة التشغيل
    بدلًا من ادعاء أن العملية الحالية يمكنها إعادة تحميل الوحدات المستوردة مسبقًا بأمان.

  </Step>

  <Step title="التحقق من Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    استخدم `--runtime` عندما تحتاج إلى إثبات الأدوات المسجلة، أو الخدمات، أو طرق Gateway،
    أو الخطافات، أو أوامر CLI المملوكة لـ Plugin. أما `inspect` العادي فهو فحص بارد
    للبيان/السجل ويتجنب عمدًا استيراد تشغيل Plugin.

  </Step>
</Steps>

إذا كنت تفضّل التحكم الأصلي من الدردشة، فعّل `commands.plugins: true` واستخدم:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

يستخدم مسار التثبيت المحلّل نفسه الذي يستخدمه CLI: مسار/أرشيف محلي، أو
`clawhub:<pkg>` صريح، أو `npm:<pkg>` صريح، أو `npm-pack:<path.tgz>` صريح،
أو `git:<repo>` صريح، أو مواصفة حزمة مجردة عبر npm.

إذا كانت الإعدادات غير صالحة، يفشل التثبيت عادةً بإغلاق آمن ويوجهك إلى
`openclaw doctor --fix`. استثناء الاسترداد الوحيد هو مسار ضيق لإعادة تثبيت Plugin
مجمّع لـ Plugins التي تختار الاشتراك في
`openclaw.install.allowInvalidConfigRecovery`.
أثناء بدء تشغيل Gateway، تفشل إعدادات Plugin غير الصالحة بإغلاق آمن مثل أي إعدادات
غير صالحة أخرى. شغّل `openclaw doctor --fix` لعزل إعدادات Plugin السيئة عبر
تعطيل إدخال Plugin ذلك وإزالة حمولة إعداداته غير الصالحة؛ وتحتفظ نسخة الإعدادات
الاحتياطية العادية بالقيم السابقة.
عندما تشير إعدادات قناة إلى Plugin لم يعد قابلًا للاكتشاف لكن معرف Plugin القديم نفسه
يبقى في إعدادات Plugin أو سجلات التثبيت، يسجل بدء تشغيل Gateway تحذيرات ويتجاوز
تلك القناة بدلًا من حظر كل القنوات الأخرى.
شغّل `openclaw doctor --fix` لإزالة إدخالات القناة/Plugin القديمة؛ أما مفاتيح القنوات
المجهولة التي لا تملك دليلًا على Plugin قديم فلا تزال تفشل في التحقق كي تبقى الأخطاء
المطبعية ظاهرة.
إذا تم تعيين `plugins.enabled: false`، تُعامل مراجع Plugin القديمة كخاملة:
يتجاوز بدء تشغيل Gateway عمل اكتشاف/تحميل Plugin، ويحافظ `openclaw doctor`
على إعدادات Plugin المعطلة بدلًا من إزالتها تلقائيًا. أعد تفعيل Plugins قبل تشغيل
تنظيف doctor إذا كنت تريد إزالة معرفات Plugin القديمة.

لا يحدث تثبيت اعتماديات Plugin إلا أثناء تدفقات التثبيت/التحديث الصريحة أو إصلاحات
doctor. لا يشغّل بدء تشغيل Gateway، أو إعادة تحميل الإعدادات، أو فحص التشغيل مديري
الحزم ولا يصلح أشجار الاعتماديات. يجب أن تكون Plugins المحلية قد ثُبتت اعتمادياتها
مسبقًا، بينما تُثبّت Plugins من npm وgit وClawHub ضمن جذور Plugin المُدارة من
OpenClaw. قد تُرفع اعتماديات npm ضمن جذر npm المُدار من OpenClaw؛ ويفحص
التثبيت/التحديث ذلك الجذر المُدار قبل الثقة، وتزيل عملية إلغاء التثبيت الحزم المُدارة من
npm عبر npm. لا تزال Plugins الخارجية ومسارات التحميل المخصصة بحاجة إلى التثبيت
عبر `openclaw plugins install`.
استخدم `openclaw plugins list --json` للاطلاع على `dependencyStatus` الثابت لكل
Plugin ظاهر دون استيراد شيفرة التشغيل أو إصلاح الاعتماديات.
راجع [حل اعتماديات Plugin](/ar/plugins/dependency-resolution) لمعرفة دورة الحياة في وقت
التثبيت.

### ملكية مسار Plugin المحظور

إذا قالت تشخيصات Plugin
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
وتلاها تحقق الإعدادات برسالة `plugin present but blocked`، فهذا يعني أن OpenClaw وجد
ملفات Plugin مملوكة لمستخدم Unix مختلف عن العملية التي تحمّلها. أبقِ إعدادات Plugin
في مكانها؛ أصلح ملكية نظام الملفات أو شغّل OpenClaw بالمستخدم نفسه الذي يملك دليل الحالة.

بالنسبة إلى تثبيتات Docker، تعمل الصورة الرسمية باسم `node` (uid `1000`)، لذلك ينبغي
عادةً أن تكون أدلة إعدادات ومساحة عمل OpenClaw المثبتة من المضيف مملوكة للمعرف
uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

إذا كنت تشغّل OpenClaw كجذر عمدًا، فأصلح جذر Plugin المُدار ليصبح مملوكًا للجذر بدلًا من ذلك:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

بعد إصلاح الملكية، أعد تشغيل `openclaw doctor --fix` أو
`openclaw plugins registry --refresh` حتى يطابق سجل Plugin المحفوظ الملفات التي تم إصلاحها.

بالنسبة إلى تثبيتات npm، تُحل المحددات القابلة للتغيير مثل `latest` أو dist-tag
قبل التثبيت ثم تُثبت على النسخة الدقيقة المتحقق منها في جذر npm المُدار من OpenClaw.
بعد انتهاء npm، يتحقق OpenClaw من أن إدخال `package-lock.json` المثبت لا يزال
يطابق النسخة المحلولة وسلامتها. إذا كتب npm بيانات تعريف حزمة مختلفة، يفشل التثبيت
وتُعاد الحزمة المُدارة إلى حالتها السابقة بدلًا من قبول أثر Plugin مختلف.
ترث جذور npm المُدارة أيضًا `overrides` الخاصة بـ npm على مستوى حزمة OpenClaw،
لذلك تنطبق تثبيتات الأمان التي تحمي المضيف المعبأ أيضًا على اعتماديات Plugin الخارجية
المرفوعة.

مستودعات المصدر هي مساحات عمل pnpm. إذا نسخت OpenClaw للتعديل على Plugins
المجمّعة، شغّل `pnpm install`؛ عندها يحمّل OpenClaw Plugins المجمّعة من
`extensions/<id>` بحيث تُستخدم التعديلات والاعتماديات المحلية للحزمة مباشرةً.
تثبيتات جذر npm العادية مخصصة لـ OpenClaw المعبأ، وليس لتطوير مستودع المصدر.

## أنواع Plugin

يتعرف OpenClaw على تنسيقين لـ Plugin:

| التنسيق     | آلية العمل                                                       | أمثلة                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **أصلي** | `openclaw.plugin.json` + وحدة تشغيل؛ ينفّذ داخل العملية       | Plugins الرسمية، حزم npm المجتمعية               |
| **حزمة** | تخطيط متوافق مع Codex/Claude/Cursor؛ يُربط بميزات OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

يظهر كلاهما ضمن `openclaw plugins list`. راجع [حزم Plugin](/ar/plugins/bundles) لتفاصيل الحزم.

إذا كنت تكتب Plugin أصليًا، فابدأ بـ [بناء Plugins](/ar/plugins/building-plugins)
و[نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

## نقاط دخول الحزمة

يجب أن تعلن حزم npm الخاصة بـ Plugin الأصلي عن `openclaw.extensions` في `package.json`.
يجب أن يبقى كل إدخال داخل دليل الحزمة وأن يحل إلى ملف تشغيل قابل للقراءة،
أو إلى ملف مصدر TypeScript مع نظير JavaScript مبني مستنتج مثل `src/index.ts` إلى
`dist/index.js`.
يجب أن تشحن التثبيتات المعبأة مخرج تشغيل JavaScript ذلك. بديل مصدر TypeScript
مخصص لمستودعات المصدر ومسارات التطوير المحلية، وليس لحزم npm المثبتة في جذر
Plugin المُدار من OpenClaw.

تُعامل الأدلة غير المتتبعة التي تُسقط في جذر الامتداد العام كمستودعات مصدر محلية وقد
تحمّل إدخالات TypeScript مباشرةً. تظل الأدلة التي ما زالت مسماة بسجل تثبيت، بما في
ذلك `installPath` أو `sourcePath`، مُدارة وتحتفظ بمتطلب المخرج المترجم حتى عندما
يراها الفحص العام. إذا كنت تنوي تحويل تثبيت مُدار إلى مستودع محلي غير متتبع، فأزل سجل
التثبيت القديم أولًا عبر إلغاء التثبيت أو تنظيف doctor.

إذا قال تحذير حزمة مُدارة إنها `requires compiled runtime output for
TypeScript entry ...`، فهذا يعني أن الحزمة نُشرت دون ملفات JavaScript التي يحتاجها
OpenClaw وقت التشغيل. هذه مشكلة تغليف Plugin، وليست مشكلة إعدادات محلية.
حدّث Plugin أو أعد تثبيته بعد أن يعيد الناشر نشر JavaScript المترجم، أو عطّل/ألغِ تثبيت
ذلك Plugin حتى تتوفر حزمة مصححة.

استخدم `openclaw.runtimeExtensions` عندما لا توجد ملفات التشغيل المنشورة في المسارات
نفسها مثل إدخالات المصدر. عند وجود `runtimeExtensions`، يجب أن تحتوي على إدخال
واحد بالضبط لكل إدخال في `extensions`. تفشل القوائم غير المتطابقة في التثبيت واكتشاف
Plugin بدلًا من الرجوع صامتةً إلى مسارات المصدر. إذا نشرت أيضًا
`openclaw.setupEntry`، فاستخدم `openclaw.runtimeSetupEntry` لنظيره المبني من
JavaScript؛ هذا الملف مطلوب عند التصريح به.

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

### حزم npm المملوكة لـ OpenClaw أثناء الترحيل

ClawHub هو مسار التوزيع الأساسي لمعظم Plugins. تتضمن إصدارات OpenClaw المعبأة
الحالية بالفعل العديد من Plugins الرسمية، لذلك لا تحتاج تلك عادةً إلى تثبيتات npm منفصلة
في الإعدادات العادية. إلى أن تنتقل كل Plugin مملوكة لـ OpenClaw إلى ClawHub،
لا يزال OpenClaw يشحن بعض حزم Plugin من `@openclaw/*` على npm للتثبيتات
الأقدم/المخصصة وتدفقات عمل npm المباشرة.

إذا أبلغ npm عن حزمة Plugin من `@openclaw/*` بأنها مهجورة، فإن نسخة الحزمة تلك
من مسار حزم خارجية أقدم. استخدم Plugin المجمّع من OpenClaw الحالي أو مستودعًا
محليًا إلى أن تُنشر حزمة npm أحدث.

| Plugin          | الحزمة                    | المستندات                                       |
| --------------- | -------------------------- | ------------------------------------------ |
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
  <Accordion title="مزودو النماذج (مفعّلون افتراضيًا)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins الذاكرة">
    - `memory-core` - بحث ذاكرة مضمّن (افتراضي عبر `plugins.slots.memory`)
    - `memory-lancedb` - ذاكرة طويلة الأمد مدعومة بـ LanceDB مع استدعاء/التقاط تلقائي (اضبط `plugins.slots.memory = "memory-lancedb"`)

    راجع [Memory LanceDB](/ar/plugins/memory-lancedb) لإعداد التضمين المتوافق مع OpenAI،
    وأمثلة Ollama، وحدود الاستدعاء، واستكشاف الأخطاء وإصلاحها.

  </Accordion>

  <Accordion title="مزودو الكلام (مفعّلون افتراضيًا)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="أخرى">
    - `browser` - Plugin متصفح مضمّن لأداة المتصفح، و`openclaw browser` CLI، وطريقة Gateway `browser.request`، ووقت تشغيل المتصفح، وخدمة التحكم الافتراضية في المتصفح (مفعّل افتراضيًا؛ عطّله قبل استبداله)
    - `copilot-proxy` - جسر VS Code Copilot Proxy (معطّل افتراضيًا)

  </Accordion>
</AccordionGroup>

هل تبحث عن Plugins خارجية؟ راجع [ClawHub](/ar/clawhub).

## الإعداد

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
| `allow`            | قائمة سماح Plugins (اختياري)                               |
| `bundledDiscovery` | وضع اكتشاف Plugin المضمّن (`allowlist` افتراضيًا)    |
| `deny`             | قائمة حظر Plugins (اختياري؛ الحظر له الأولوية)                     |
| `load.paths`       | ملفات/أدلة Plugins إضافية                            |
| `slots`            | محددات الخانات الحصرية (مثل `memory` و`contextEngine`) |
| `entries.\<id\>`   | مفاتيح تفعيل + إعداد لكل Plugin                               |

`plugins.allow` حصري. عندما لا يكون فارغًا، لا يمكن تحميل أو عرض الأدوات إلا لـ Plugins المدرجة،
حتى إذا كان `tools.allow` يحتوي على `"*"` أو اسم أداة معيّن مملوك لـ Plugin.
إذا كانت قائمة سماح الأدوات تشير إلى أدوات Plugin، فأضف معرفات Plugins المالكة
إلى `plugins.allow` أو أزل `plugins.allow`؛ يحذّر `openclaw doctor` من هذا
الشكل.

تكون القيمة الافتراضية لـ `plugins.bundledDiscovery` هي `"allowlist"` للإعدادات الجديدة، لذلك فإن
مخزون `plugins.allow` التقييدي يحظر أيضًا Plugins مزودي الخدمة المضمّنة المحذوفة،
بما في ذلك اكتشاف مزود بحث الويب في وقت التشغيل. يوسم Doctor إعدادات
قائمة السماح التقييدية الأقدم بـ `"compat"` أثناء الترحيل حتى تحافظ الترقيات على
سلوك مزود الخدمة المضمّن القديم إلى أن يختار المشغّل الوضع الأشد صرامة.
لا تزال `plugins.allow` الفارغة تُعامل كغير مضبوطة/مفتوحة.

تؤدي تغييرات الإعدادات التي تتم عبر `/plugins enable` أو `/plugins disable` إلى إعادة تحميل
Plugin في Gateway ضمن العملية. تعيد أدوار الوكيل الجديدة بناء قائمة أدواتها من
سجل Plugins المحدّث. لا تزال العمليات التي تغيّر المصدر مثل التثبيت
والتحديث وإلغاء التثبيت تعيد تشغيل عملية Gateway لأن وحدات
Plugin المستوردة مسبقًا لا يمكن استبدالها بأمان في مكانها.

`openclaw plugins list` هي لقطة محلية لسجل/إعدادات Plugins. تعني
Plugin بحالة `enabled` هناك أن السجل المستمر والإعدادات الحالية يسمحان لـ
Plugin بالمشاركة. لا يثبت ذلك أن Gateway بعيدًا قيد التشغيل بالفعل
قد أعاد التحميل أو أعاد التشغيل على كود Plugin نفسه. في إعدادات VPS/الحاويات
ذات عمليات التغليف، أرسل عمليات إعادة التشغيل أو عمليات الكتابة التي تشغّل إعادة التحميل إلى عملية
`openclaw gateway run` الفعلية، أو استخدم `openclaw gateway restart` ضد
Gateway قيد التشغيل عندما يبلّغ إعادة التحميل عن فشل.

<Accordion title="حالات Plugin: معطّل مقابل مفقود مقابل غير صالح">
  - **معطّل**: Plugin موجود لكن قواعد التفعيل أوقفته. يتم الاحتفاظ بالإعدادات.
  - **مفقود**: تشير الإعدادات إلى معرف Plugin لم يجده الاكتشاف.
  - **غير صالح**: Plugin موجود لكن إعداداته لا تطابق المخطط المعلن. يتخطى بدء Gateway ذلك Plugin فقط؛ يمكن لـ `openclaw doctor --fix` عزل الإدخال غير الصالح بتعطيله وإزالة حمولة إعداداته.

</Accordion>

## الاكتشاف والأولوية

يفحص OpenClaw بحثًا عن Plugins بهذا الترتيب (أول تطابق يفوز):

<Steps>
  <Step title="مسارات الإعداد">
    `plugins.load.paths` - مسارات ملفات أو أدلة صريحة. يتم تجاهل المسارات التي تشير
    عائدةً إلى أدلة Plugins المضمّنة المعبأة الخاصة بـ OpenClaw؛
    شغّل `openclaw doctor --fix` لإزالة تلك الأسماء المستعارة القديمة.
  </Step>

  <Step title="Plugins مساحة العمل">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins العامة">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins المضمّنة">
    تُشحن مع OpenClaw. كثير منها مفعّل افتراضيًا (مزودو النماذج، والكلام).
    ويتطلب البعض الآخر تفعيلًا صريحًا.
  </Step>
</Steps>

عادةً ما تحل عمليات التثبيت المعبأة وصور Docker ‏Plugins المضمّنة من شجرة
`dist/extensions` المترجمة. إذا تم تركيب دليل مصدر Plugin مضمّن فوق مسار
المصدر المعبأ المطابق، على سبيل المثال
`/app/extensions/synology-chat`، يعامل OpenClaw دليل المصدر المركّب هذا
كتراكب مصدر مضمّن ويكتشفه قبل حزمة
`/app/dist/extensions/synology-chat` المعبأة. يحافظ هذا على عمل حلقات حاويات
المشرفين دون إعادة كل Plugin مضمّن إلى مصدر TypeScript.
اضبط `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` لفرض حزم dist المعبأة
حتى عند وجود تركيبات تراكب المصدر.

### قواعد التفعيل

- يعطّل `plugins.enabled: false` كل Plugins ويتخطى عمل اكتشاف/تحميل Plugins
- تكون الأولوية دائمًا لـ `plugins.deny` على السماح
- يعطّل `plugins.entries.\<id\>.enabled: false` ذلك Plugin
- Plugins ذات أصل مساحة العمل **معطّلة افتراضيًا** (يجب تفعيلها صراحة)
- تتبع Plugins المضمّنة مجموعة التشغيل الافتراضي المدمجة ما لم يتم تجاوزها
- يمكن للخانات الحصرية فرض تفعيل Plugin المحدد لتلك الخانة
- تُفعّل بعض Plugins المضمّنة الاختيارية تلقائيًا عندما تسمي الإعدادات
  سطحًا مملوكًا لـ Plugin، مثل مرجع نموذج مزود، أو إعداد قناة، أو وقت تشغيل
  harness
- يتم الاحتفاظ بإعدادات Plugin القديمة أثناء كون `plugins.enabled: false` نشطًا؛
  أعد تفعيل Plugins قبل تشغيل تنظيف doctor إذا أردت إزالة المعرفات القديمة
- تحافظ مسارات Codex لعائلة OpenAI على حدود Plugin منفصلة:
  ينتمي `openai-codex/*` إلى OpenAI Plugin، بينما يتم اختيار Plugin خادم تطبيق Codex
  المضمّن بواسطة مراجع وكيل `openai/*` القياسية، أو
  `agentRuntime.id: "codex"` الصريحة للمزود/النموذج، أو مراجع نماذج `codex/*` القديمة

## استكشاف أخطاء خطافات وقت التشغيل وإصلاحها

إذا ظهر Plugin في `plugins list` لكن آثار `register(api)` الجانبية أو الخطافات
لا تعمل في حركة دردشة حية، فتحقق من هذه أولًا:

- شغّل `openclaw gateway status --deep --require-rpc` وتأكد أن عنوان URL الخاص بـ Gateway
  النشط، والملف الشخصي، ومسار الإعداد، والعملية هي التي تعدّلها.
- أعد تشغيل Gateway الحي بعد تغييرات تثبيت/إعداد/كود Plugin. في حاويات التغليف،
  قد يكون PID 1 مجرد مشرف؛ أعد تشغيل أو أرسل إشارة إلى عملية
  `openclaw gateway run` الفرعية.
- استخدم `openclaw plugins inspect <id> --runtime --json` لتأكيد تسجيلات الخطافات
  والتشخيصات. تحتاج خطافات المحادثة غير المضمّنة مثل `before_model_resolve`،
  و`before_agent_reply`، و`before_agent_run`، و`llm_input`، و`llm_output`،
  و`before_agent_finalize`، و`agent_end` إلى
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- لتبديل النماذج، فضّل `before_model_resolve`. يعمل قبل حل النموذج
  لأدوار الوكيل؛ ولا يعمل `llm_output` إلا بعد أن تنتج محاولة نموذج
  مخرجات مساعد.
- لإثبات نموذج الجلسة الفعّال، استخدم `openclaw sessions` أو أسطح
  جلسة/حالة Gateway، وعند تصحيح حمولات المزود، ابدأ
  Gateway باستخدام `--raw-stream --raw-stream-path <path>`.

### بطء إعداد أداة Plugin

إذا بدت أدوار الوكيل متوقفة أثناء تحضير الأدوات، فعّل تسجيل التتبع
وتحقق من أسطر توقيت مصنع أدوات Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

ابحث عن:

```text
[trace:plugin-tools] factory timings ...
```

يعرض الملخص إجمالي وقت المصنع وأبطأ مصانع أدوات Plugin،
بما في ذلك معرف Plugin، وأسماء الأدوات المعلنة، وشكل النتيجة، وما إذا كانت الأداة
اختيارية. تُرقّى الأسطر البطيئة إلى تحذيرات عندما يستغرق مصنع واحد
ثانية واحدة على الأقل أو يستغرق تحضير مصانع أدوات Plugin إجمالًا 5 ثوانٍ على الأقل.

يخزّن OpenClaw نتائج مصانع أدوات Plugin الناجحة مؤقتًا للحلول المتكررة
بسياق الطلب الفعّال نفسه. يتضمن مفتاح التخزين المؤقت إعداد وقت التشغيل
الفعّال، ومساحة العمل، ومعرفات الوكيل/الجلسة، وسياسة sandbox، وإعدادات المتصفح،
وسياق التسليم، وهوية الطالب، وحالة الملكية، لذلك تُعاد تشغيل المصانع التي
تعتمد على تلك الحقول الموثوقة عندما يتغير السياق.

إذا هيمن Plugin واحد على التوقيت، فافحص تسجيلاته في وقت التشغيل:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

ثم حدّث ذلك Plugin أو أعد تثبيته أو عطّله. يجب على مؤلفي Plugins نقل
تحميل التبعيات المكلف إلى مسار تنفيذ الأداة بدلًا من القيام به
داخل مصنع الأداة.

### تكرار ملكية قناة أو أداة

الأعراض:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

هذا يعني أن أكثر من Plugin مفعّل يحاول امتلاك القناة نفسها،
أو مسار الإعداد، أو اسم الأداة. السبب الأكثر شيوعًا هو تثبيت Plugin قناة خارجي
بجانب Plugin مضمّن يوفر الآن معرف القناة نفسه.

خطوات التصحيح:

- شغّل `openclaw plugins list --enabled --verbose` لرؤية كل Plugin مفعّل
  وأصله.
- شغّل `openclaw plugins inspect <id> --runtime --json` لكل Plugin مشتبه به و
  قارن `channels` و`channelConfigs` و`tools` والتشخيصات.
- شغّل `openclaw plugins registry --refresh` بعد تثبيت أو إزالة
  حزم Plugin حتى تعكس البيانات الوصفية المستمرة التثبيت الحالي.
- أعد تشغيل Gateway بعد تغييرات التثبيت أو السجل أو الإعدادات.

خيارات الإصلاح:

- إذا كان أحد Plugins يستبدل آخر عن قصد لمعرف القناة نفسه، فيجب أن يعلن
  Plugin المفضّل `channelConfigs.<channel-id>.preferOver` مع
  معرف Plugin الأقل أولوية. راجع [/plugins/manifest#replacing-another-channel-plugin](/ar/plugins/manifest#replacing-another-channel-plugin).
- إذا كان التكرار عرضيًا، فعطّل أحد الجانبين باستخدام
  `plugins.entries.<plugin-id>.enabled: false` أو أزل تثبيت Plugin
  القديم.
- إذا فعّلت كلا Plugins صراحة، يحتفظ OpenClaw بهذا الطلب
  ويبلّغ عن التعارض. اختر مالكًا واحدًا للقناة أو أعد تسمية الأدوات المملوكة لـ Plugin
  حتى يكون سطح وقت التشغيل غير ملتبس.

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

تُشحن plugins المضمّنة مع OpenClaw. يُفعَّل كثير منها افتراضيًا (مثل
موفّري النماذج المضمّنين، وموفّري الكلام المضمّنين، وPlugin المتصفح
المضمّن). لا تزال plugins مضمنة أخرى تحتاج إلى `openclaw plugins enable <id>`.

يستبدل `--force` أي Plugin مثبّت أو حزمة hooks موجودة في مكانها. استخدم
`openclaw plugins update <id-or-npm-spec>` للترقيات الروتينية لـ plugins npm
المتتبَّعة. لا يُدعَم مع `--link`، الذي يعيد استخدام مسار المصدر بدلًا من
النسخ فوق هدف تثبيت مُدار.

عندما تكون `plugins.allow` مضبوطة مسبقًا، يضيف `openclaw plugins install`
معرّف Plugin المثبّت إلى قائمة السماح تلك قبل تفعيله. إذا كان معرّف Plugin نفسه
موجودًا في `plugins.deny`، يزيل التثبيت إدخال الرفض القديم هذا بحيث يصبح
التثبيت الصريح قابلًا للتحميل فورًا بعد إعادة التشغيل.

يحتفظ OpenClaw بسجل Plugin محلي دائم كنموذج قراءة بارد لجرد plugins، وملكية
المساهمات، وتخطيط بدء التشغيل. تحدّث مسارات التثبيت والتحديث وإلغاء التثبيت
والتفعيل والتعطيل ذلك السجل بعد تغيير حالة Plugin. يحتفظ ملف
`plugins/installs.json` نفسه ببيانات تعريف التثبيت الدائمة في
`installRecords` ذات المستوى الأعلى وبيانات تعريف manifest القابلة لإعادة البناء
في `plugins`. إذا كان السجل مفقودًا أو قديمًا أو غير صالح، فإن
`openclaw plugins registry --refresh` يعيد بناء عرض manifest الخاص به من سجلات
التثبيت وسياسة الإعدادات وبيانات تعريف manifest/package دون تحميل وحدات runtime
الخاصة بـ Plugin.

في وضع Nix (`OPENCLAW_NIX_MODE=1`)، تُعطَّل أدوات تعديل دورة حياة Plugin.
أدر اختيار حزم Plugin والإعدادات من خلال مصدر Nix الخاص بالتثبيت بدلًا من ذلك؛
بالنسبة إلى nix-openclaw، ابدأ بـ
[البداية السريعة](https://github.com/openclaw/nix-openclaw#quick-start)
المعتمدة على الوكيل أولًا. ينطبق `openclaw plugins update <id-or-npm-spec>` على
التثبيتات المتتبَّعة. يؤدي تمرير مواصفة حزمة npm مع dist-tag أو إصدار محدد إلى
حل اسم الحزمة مرة أخرى إلى سجل Plugin المتتبَّع وتسجيل المواصفة الجديدة
للتحديثات المستقبلية. يؤدي تمرير اسم الحزمة دون إصدار إلى إعادة التثبيت المثبّت
بدقة إلى خط الإصدار الافتراضي في السجل. إذا كان Plugin npm المثبّت يطابق بالفعل
الإصدار المحلول وهوية الأثر المسجلة، يتخطى OpenClaw التحديث دون تنزيل أو إعادة
تثبيت أو إعادة كتابة الإعدادات.
عندما يعمل `openclaw update` على قناة beta، تحاول سجلات plugins الافتراضية
لـ npm وClawHub استخدام `@beta` أولًا وتعود إلى default/latest عندما لا يوجد
إصدار beta لـ Plugin. تبقى الإصدارات الدقيقة والوسوم الصريحة مثبّتة.

`--pin` خاص بـ npm فقط. لا يُدعَم مع `--marketplace`، لأن تثبيتات marketplace
تحتفظ ببيانات تعريف مصدر marketplace بدلًا من مواصفة npm.

`--dangerously-force-unsafe-install` هو تجاوز طارئ للنتائج الإيجابية الخاطئة من
ماسح التعليمات البرمجية الخطرة المضمّن. يسمح لتثبيتات Plugin وتحديثات Plugin
بالمتابعة بعد نتائج `critical` المضمّنة، لكنه لا يزال لا يتجاوز حظر سياسة
`before_install` الخاصة بـ Plugin أو الحظر الناتج عن فشل الفحص. تتجاهل فحوصات
التثبيت ملفات وأدلة الاختبار الشائعة مثل `tests/` و`__tests__/` و`*.test.*`
و`*.spec.*` لتجنب حظر mocks الاختبار المعبأة؛ ولا تزال نقاط دخول runtime
المعلنة لـ Plugin تُفحص حتى إن استخدمت أحد تلك الأسماء.

ينطبق علم CLI هذا على مسارات تثبيت/تحديث Plugin فقط. تستخدم تثبيتات تبعيات
Skills المدعومة بـ Gateway تجاوز الطلب المطابق
`dangerouslyForceUnsafeInstall` بدلًا من ذلك، بينما يبقى `openclaw skills install`
مسار تنزيل/تثبيت Skills المنفصل من ClawHub.

إذا كان Plugin نشرته على ClawHub مخفيًا أو محظورًا بواسطة فحص، فافتح لوحة
معلومات ClawHub أو شغّل `clawhub package rescan <name>` لطلب أن يفحصه ClawHub
مرة أخرى. يؤثر `--dangerously-force-unsafe-install` فقط في التثبيتات على جهازك؛
ولا يطلب من ClawHub إعادة فحص Plugin أو جعل إصدار محظور عامًا.

تشارك الحزم المتوافقة في مسار قائمة/فحص/تفعيل/تعطيل Plugin نفسه. يتضمن دعم
runtime الحالي bundle skills، وClaude command-skills، وافتراضيات Claude
`settings.json`، وافتراضيات Claude `.lsp.json` و`lspServers` المعلنة في
manifest، وCursor command-skills، وأدلة hooks المتوافقة مع Codex.

يعرض `openclaw plugins inspect <id>` أيضًا إمكانات الحزمة المكتشفة بالإضافة إلى
إدخالات خوادم MCP وLSP المدعومة أو غير المدعومة لـ plugins المدعومة بالحزم.

يمكن أن تكون مصادر Marketplace اسم marketplace معروفًا لدى Claude من
`~/.claude/plugins/known_marketplaces.json`، أو جذر marketplace محليًا أو مسار
`marketplace.json`، أو صيغة مختصرة لـ GitHub مثل `owner/repo`، أو عنوان URL
لمستودع GitHub، أو عنوان URL لـ git. بالنسبة إلى marketplaces البعيدة، يجب أن
تبقى إدخالات Plugin داخل مستودع marketplace المستنسخ وأن تستخدم مصادر مسارات
نسبية فقط.

راجع [مرجع CLI لـ `openclaw plugins`](/ar/cli/plugins) للاطلاع على التفاصيل الكاملة.

## نظرة عامة على واجهة Plugin API

تصدّر plugins الأصلية كائن إدخال يعرّض `register(api)`. قد تظل plugins الأقدم
تستخدم `activate(api)` كاسم مستعار قديم، لكن ينبغي أن تستخدم plugins الجديدة
`register`.

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
المحمّل يعود إلى `activate(api)` لـ plugins الأقدم، لكن ينبغي أن تعامل plugins
المضمّنة وplugins الخارجية الجديدة `register` باعتباره العقد العام.

يوضح `api.registrationMode` لـ Plugin سبب تحميل إدخاله:

| الوضع | المعنى |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | تفعيل runtime. سجّل الأدوات وhooks والخدمات والأوامر والمسارات والآثار الجانبية الحية الأخرى. |
| `discovery` | اكتشاف الإمكانات للقراءة فقط. سجّل الموفّرين وبيانات التعريف؛ قد تُحمَّل تعليمات إدخال Plugin الموثوق بها، لكن تخطَّ الآثار الجانبية الحية. |
| `setup-only` | تحميل بيانات تعريف إعداد القناة من خلال إدخال إعداد خفيف. |
| `setup-runtime` | تحميل إعداد القناة الذي يحتاج أيضًا إلى إدخال runtime. |
| `cli-metadata` | جمع بيانات تعريف أوامر CLI فقط. |

ينبغي أن تحمي إدخالات Plugin التي تفتح sockets أو قواعد بيانات أو عمالًا في
الخلفية أو عملاء طويلي العمر تلك الآثار الجانبية باستخدام
`api.registrationMode === "full"`. تُخزَّن تحميلات الاكتشاف مؤقتًا بشكل منفصل
عن تحميلات التفعيل ولا تستبدل سجل Gateway العامل. الاكتشاف غير مُفعِّل، وليس
خالياً من الاستيراد: قد يقيّم OpenClaw إدخال Plugin الموثوق به أو وحدة Plugin
الخاصة بالقناة لبناء اللقطة. أبقِ المستويات العليا للوحدات خفيفة وخالية من
الآثار الجانبية، وانقل عملاء الشبكة والعمليات الفرعية والمستمعين وقراءات
بيانات الاعتماد وبدء تشغيل الخدمات خلف مسارات runtime الكاملة.

طرق التسجيل الشائعة:

| الطريقة | ما تسجّله |
| --------------------------------------- | --------------------------- |
| `registerProvider` | موفّر نماذج (LLM) |
| `registerChannel` | قناة محادثة |
| `registerTool` | أداة وكيل |
| `registerHook` / `on(...)` | hooks دورة الحياة |
| `registerSpeechProvider` | تحويل النص إلى كلام / STT |
| `registerRealtimeTranscriptionProvider` | STT متدفق |
| `registerRealtimeVoiceProvider` | صوت فوري ثنائي الاتجاه |
| `registerMediaUnderstandingProvider` | تحليل الصور/الصوت |
| `registerImageGenerationProvider` | توليد الصور |
| `registerMusicGenerationProvider` | توليد الموسيقى |
| `registerVideoGenerationProvider` | توليد الفيديو |
| `registerWebFetchProvider` | موفّر جلب / كشط الويب |
| `registerWebSearchProvider` | بحث الويب |
| `registerHttpRoute` | نقطة نهاية HTTP |
| `registerCommand` / `registerCli` | أوامر CLI |
| `registerContextEngine` | محرك سياق |
| `registerService` | خدمة خلفية |

سلوك حارس hook لـ hooks دورة الحياة المكتوبة:

- `before_tool_call`: يكون `{ block: true }` نهائيًا؛ تُتخطى المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: يكون `{ block: false }` بلا أثر ولا يمسح حظرًا سابقًا.
- `before_install`: يكون `{ block: true }` نهائيًا؛ تُتخطى المعالجات ذات الأولوية الأدنى.
- `before_install`: يكون `{ block: false }` بلا أثر ولا يمسح حظرًا سابقًا.
- `message_sending`: يكون `{ cancel: true }` نهائيًا؛ تُتخطى المعالجات ذات الأولوية الأدنى.
- `message_sending`: يكون `{ cancel: false }` بلا أثر ولا يمسح إلغاءً سابقًا.

يشغّل خادم تطبيق Codex الأصلي أحداث أدوات Codex الأصلية عبر الجسر لتعود إلى سطح الخطافات هذا. يمكن للـ Plugins حظر أدوات Codex الأصلية من خلال `before_tool_call`، ومراقبة النتائج من خلال `after_tool_call`، والمشاركة في موافقات `PermissionRequest` الخاصة بـ Codex. لا يعيد الجسر كتابة معاملات أدوات Codex الأصلية بعد. يقع حد دعم وقت تشغيل Codex الدقيق في [عقد دعم Codex harness v1](/ar/plugins/codex-harness-runtime#v1-support-contract).

للاطلاع على السلوك الكامل للخطافات ذات الأنواع المحددة، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#hook-decision-semantics).

## ذات صلة

- [بناء Plugins](/ar/plugins/building-plugins) - أنشئ Plugin الخاص بك
- [حزم Plugin](/ar/plugins/bundles) - توافق حزم Codex/Claude/Cursor
- [بيان Plugin](/ar/plugins/manifest) - مخطط البيان
- [تسجيل الأدوات](/ar/plugins/building-plugins#registering-agent-tools) - أضف أدوات الوكيل في Plugin
- [تفاصيل Plugin الداخلية](/ar/plugins/architecture) - نموذج القدرات ومسار التحميل
- [ClawHub](/ar/clawhub) - اكتشاف Plugins تابعة لجهات خارجية
