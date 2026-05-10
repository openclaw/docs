---
read_when:
    - تثبيت Plugins أو تكوينها
    - فهم قواعد اكتشاف Plugin وتحميله
    - العمل مع حزم Plugin المتوافقة مع Codex/Claude
sidebarTitle: Install and Configure
summary: ثبّت Plugins الخاصة بـ OpenClaw وتهيئتها وإدارتها
title: Plugins
x-i18n:
    generated_at: "2026-05-10T20:05:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1b80ba25fdb0b108c4899e1ad8e2e2bea30cc04076fb79a9416e043922f964
    source_path: tools/plugin.md
    workflow: 16
---

توسّع Plugins قدرات OpenClaw بإمكانات جديدة: القنوات، ومزوّدو النماذج،
وحاضنات الوكلاء، والأدوات، وSkills، والكلام، والنسخ الفوري، والصوت الفوري،
وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب، وبحث الويب،
والمزيد. بعض Plugins تكون **أساسية** (مشحونة مع OpenClaw)، وأخرى
**خارجية**. تُنشر وتُكتشف معظم Plugins الخارجية من خلال
[ClawHub](/ar/clawhub). يظل npm مدعومًا للتثبيتات المباشرة ولمجموعة مؤقتة من
حزم Plugins المملوكة لـ OpenClaw إلى حين اكتمال تلك الهجرة.

## البدء السريع

لأمثلة التثبيت وال listing وإلغاء التثبيت والتحديث والنشر الجاهزة للنسخ واللصق، راجع
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

  <Step title="الإدارة الأصلية عبر الدردشة">
    في Gateway قيد التشغيل، تؤدي أوامر المالك فقط `/plugins enable` و`/plugins disable`
    إلى تشغيل مُعيد تحميل إعدادات Gateway. يعيد Gateway تحميل أسطح وقت تشغيل Plugin
    داخل العملية، وتعيد دورات الوكيل الجديدة بناء قائمة أدواتها من السجل المحدّث.
    يغيّر `/plugins install` الشفرة المصدرية لـ Plugin، لذلك يطلب Gateway إعادة التشغيل
    بدلًا من الادعاء بأن العملية الحالية يمكنها إعادة تحميل الوحدات التي سبق استيرادها
    بأمان.

  </Step>

  <Step title="التحقق من Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    استخدم `--runtime` عندما تحتاج إلى إثبات الأدوات المسجلة أو الخدمات أو طرق Gateway
    أو الخطافات أو أوامر CLI المملوكة لـ Plugin. إن `inspect` العادي هو فحص بارد
    للبيان/السجل ويتجنب عمدًا استيراد وقت تشغيل Plugin.

  </Step>
</Steps>

إذا كنت تفضل التحكم الأصلي عبر الدردشة، ففعّل `commands.plugins: true` واستخدم:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

يستخدم مسار التثبيت محلّل المصدر نفسه الذي يستخدمه CLI: مسار/أرشيف محلي، أو
`clawhub:<pkg>` صريح، أو `npm:<pkg>` صريح، أو `npm-pack:<path.tgz>` صريح،
أو `git:<repo>` صريح، أو مواصفة حزمة مجردة عبر npm.

إذا كانت الإعدادات غير صالحة، يفشل التثبيت عادةً مغلقًا ويوجهك إلى
`openclaw doctor --fix`. استثناء الاسترداد الوحيد هو مسار ضيق لإعادة تثبيت Plugin
مضمّن لـ Plugins التي تختار الاشتراك في
`openclaw.install.allowInvalidConfigRecovery`.
أثناء بدء تشغيل Gateway، تفشل إعدادات Plugin غير الصالحة مغلقة مثل أي إعدادات أخرى غير صالحة.
شغّل `openclaw doctor --fix` لعزل إعدادات Plugin السيئة عن طريق تعطيل إدخال ذلك Plugin
وإزالة حمولة إعداداته غير الصالحة؛ وتحتفظ النسخة الاحتياطية العادية للإعدادات بالقيم السابقة.
عندما تشير إعدادات قناة إلى Plugin لم يعد قابلًا للاكتشاف لكن معرّف Plugin القديم نفسه
يبقى في إعدادات Plugin أو سجلات التثبيت، يسجل بدء تشغيل Gateway تحذيرات ويتخطى تلك القناة
بدلًا من حظر كل قناة أخرى.
شغّل `openclaw doctor --fix` لإزالة إدخالات القناة/Plugin القديمة؛ أما مفاتيح القنوات
المجهولة من دون دليل على Plugin قديم فستظل تفشل في التحقق حتى تبقى الأخطاء المطبعية
ظاهرة.
إذا تم ضبط `plugins.enabled: false`، تُعامل مراجع Plugin القديمة على أنها خاملة:
يتخطى بدء تشغيل Gateway عمل اكتشاف/تحميل Plugin ويحافظ `openclaw doctor`
على إعدادات Plugin المعطلة بدلًا من إزالتها تلقائيًا. أعد تفعيل Plugins قبل تشغيل
تنظيف doctor إذا أردت إزالة معرّفات Plugin القديمة.

يحدث تثبيت تبعيات Plugin فقط أثناء تدفقات التثبيت/التحديث الصريحة أو إصلاح doctor.
لا يشغّل بدء تشغيل Gateway ولا إعادة تحميل الإعدادات ولا فحص وقت التشغيل مديري الحزم
أو يصلح أشجار التبعيات. يجب أن تكون تبعيات Plugins المحلية مثبتة مسبقًا، بينما تُثبّت
Plugins القادمة من npm وgit وClawHub ضمن جذور Plugins المُدارة الخاصة بـ OpenClaw.
قد تُرفع تبعيات npm داخل جذر npm المُدار الخاص بـ OpenClaw؛ يفحص التثبيت/التحديث ذلك
الجذر المُدار قبل الثقة، وتزيل عملية إلغاء التثبيت الحزم المُدارة عبر npm من خلال npm.
يجب أن تظل Plugins الخارجية ومسارات التحميل المخصصة مثبتة عبر `openclaw plugins install`.
استخدم `openclaw plugins list --json` لرؤية `dependencyStatus` الثابت لكل Plugin ظاهر
من دون استيراد شفرة وقت التشغيل أو إصلاح التبعيات.
راجع [حل تبعيات Plugin](/ar/plugins/dependency-resolution) لمعرفة دورة حياة وقت التثبيت.

### ملكية مسار Plugin المحظور

إذا قالت تشخيصات Plugin
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
وتبعها التحقق من الإعدادات برسالة `plugin present but blocked`، فهذا يعني أن OpenClaw وجد
ملفات Plugin مملوكة لمستخدم Unix مختلف عن العملية التي تحمّلها. أبقِ إعدادات Plugin في مكانها؛
أصلح ملكية نظام الملفات أو شغّل OpenClaw بالمستخدم نفسه الذي يملك دليل الحالة.

بالنسبة إلى تثبيتات Docker، تعمل الصورة الرسمية باسم `node` (uid `1000`)، لذلك ينبغي عادةً
أن تكون أدلة إعدادات OpenClaw ومساحة العمل المرتبطة من المضيف مملوكة للمعرّف uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

إذا كنت تشغّل OpenClaw عمدًا كجذر، فأصلح جذر Plugin المُدار ليكون بملكية root بدلًا من ذلك:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

بعد إصلاح الملكية، أعد تشغيل `openclaw doctor --fix` أو
`openclaw plugins registry --refresh` حتى يطابق سجل Plugin المستمر الملفات التي تم إصلاحها.

بالنسبة إلى تثبيتات npm، تُحل المحددات القابلة للتغيير مثل `latest` أو وسم توزيع قبل التثبيت
ثم تُثبّت على النسخة الدقيقة المتحقق منها في جذر npm المُدار الخاص بـ OpenClaw. بعد انتهاء npm،
يتحقق OpenClaw من أن إدخال `package-lock.json` المثبّت ما زال يطابق النسخة المحلولة والسلامة.
إذا كتب npm بيانات وصفية مختلفة للحزمة، يفشل التثبيت ويتم التراجع عن الحزمة المُدارة بدلًا من
قبول أثر Plugin مختلف.
ترث جذور npm المُدارة أيضًا `overrides` الخاصة بـ npm على مستوى حزمة OpenClaw، لذلك تنطبق
تثبيتات الأمان التي تحمي المضيف المعبأ أيضًا على تبعيات Plugin الخارجية المرفوعة.

نسخ المصدر هي مساحات عمل pnpm. إذا استنسخت OpenClaw للعمل على Plugins المضمّنة، فشغّل
`pnpm install`؛ بعد ذلك يحمّل OpenClaw Plugins المضمّنة من
`extensions/<id>` حتى تُستخدم التعديلات والتبعيات المحلية للحزمة مباشرةً.
تثبيتات جذر npm العادية مخصصة لـ OpenClaw المعبأ، وليست لتطوير نسخة مصدر.

## أنواع Plugin

يتعرف OpenClaw على تنسيقين لـ Plugin:

| التنسيق     | كيفية عمله                                                       | أمثلة                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **أصلي** | `openclaw.plugin.json` + وحدة وقت تشغيل؛ يُنفّذ داخل العملية       | Plugins الرسمية، وحزم npm المجتمعية               |
| **حزمة** | تخطيط متوافق مع Codex/Claude/Cursor؛ يُربط بميزات OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

يظهر كلاهما ضمن `openclaw plugins list`. راجع [حزم Plugin](/ar/plugins/bundles) لتفاصيل الحزم.

إذا كنت تكتب Plugin أصليًا، فابدأ بـ [بناء Plugins](/ar/plugins/building-plugins)
و[نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

## نقاط دخول الحزمة

يجب أن تصرّح حزم npm الخاصة بـ Plugin الأصلي بـ `openclaw.extensions` في `package.json`.
يجب أن يبقى كل إدخال داخل دليل الحزمة وأن يُحل إلى ملف وقت تشغيل قابل للقراءة،
أو إلى ملف مصدر TypeScript مع نظير JavaScript مبني مستنتج مثل `src/index.ts` إلى `dist/index.js`.
يجب أن تشحن التثبيتات المعبأة مخرجات وقت تشغيل JavaScript تلك. مسار الرجوع إلى مصدر TypeScript
مخصص لنسخ المصدر ومسارات التطوير المحلية، وليس لحزم npm المثبتة في جذر Plugin المُدار الخاص بـ OpenClaw.

إذا قال تحذير حزمة مُدارة إنها `requires compiled runtime output for
TypeScript entry ...`، فهذا يعني أن الحزمة نُشرت من دون ملفات JavaScript
التي يحتاجها OpenClaw في وقت التشغيل. هذه مشكلة تغليف Plugin، وليست مشكلة إعدادات محلية.
حدّث Plugin أو أعد تثبيته بعد أن يعيد الناشر نشر JavaScript المصرّف، أو عطّل/أزل تثبيت ذلك
Plugin حتى تتوفر حزمة مصححة.

استخدم `openclaw.runtimeExtensions` عندما لا تكون ملفات وقت التشغيل المنشورة في المسارات نفسها
مثل إدخالات المصدر. عند وجود `runtimeExtensions`، يجب أن يحتوي على إدخال واحد بالضبط لكل إدخال
في `extensions`. تؤدي القوائم غير المتطابقة إلى فشل التثبيت واكتشاف Plugin بدلًا من الرجوع
صامتًا إلى مسارات المصدر. إذا نشرت أيضًا `openclaw.setupEntry`، فاستخدم
`openclaw.runtimeSetupEntry` لنظيره المبني من JavaScript؛ ويكون ذلك الملف مطلوبًا عند التصريح به.

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

ClawHub هو مسار التوزيع الأساسي لمعظم Plugins. تتضمن إصدارات OpenClaw المعبأة الحالية بالفعل
العديد من Plugins الرسمية، لذلك لا تحتاج إلى تثبيتات npm منفصلة في الإعدادات العادية.
إلى أن تهاجر كل Plugin مملوكة لـ OpenClaw إلى ClawHub، يظل OpenClaw يشحن بعض حزم
Plugin بنطاق `@openclaw/*` على npm للتثبيتات الأقدم/المخصصة وتدفقات عمل npm المباشرة.

إذا أبلغ npm عن حزمة Plugin باسم `@openclaw/*` على أنها مهملة، فنسخة تلك الحزمة
من سلسلة حزم خارجية أقدم. استخدم Plugin المضمّنة من OpenClaw الحالي أو نسخة محلية
إلى أن تُنشر حزمة npm أحدث.

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

### الأساسية (مشحونة مع OpenClaw)

<AccordionGroup>
  <Accordion title="مزوّدو النماذج (مفعّلون افتراضيًا)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins الذاكرة">
    - `memory-core` - بحث الذاكرة المضمن (الافتراضي عبر `plugins.slots.memory`)
    - `memory-lancedb` - ذاكرة طويلة المدى مدعومة بـ LanceDB مع استدعاء/التقاط تلقائي (اضبط `plugins.slots.memory = "memory-lancedb"`)

    راجع [Memory LanceDB](/ar/plugins/memory-lancedb) لإعداد التضمين المتوافق مع OpenAI،
    وأمثلة Ollama، وحدود الاستدعاء، واستكشاف الأخطاء وإصلاحها.

  </Accordion>

  <Accordion title="مزودو الكلام (ممكّنون افتراضيًا)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="أخرى">
    - `browser` - Plugin متصفح مضمّن لأداة المتصفح، وCLI `openclaw browser`، وطريقة Gateway `browser.request`، ووقت تشغيل المتصفح، وخدمة التحكم الافتراضية بالمتصفح (ممكّن افتراضيًا؛ عطّله قبل استبداله)
    - `copilot-proxy` - جسر VS Code Copilot Proxy (معطّل افتراضيًا)

  </Accordion>
</AccordionGroup>

هل تبحث عن Plugins خارجية؟ راجع [ClawHub](/ar/clawhub).

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
| `enabled`          | مفتاح تبديل رئيسي (الافتراضي: `true`)                           |
| `allow`            | قائمة السماح للـ Plugin (اختياري)                               |
| `bundledDiscovery` | وضع اكتشاف الـ Plugin المضمن (`allowlist` افتراضيًا)    |
| `deny`             | قائمة حظر الـ Plugin (اختياري؛ الحظر له الأسبقية)                     |
| `load.paths`       | ملفات/أدلة Plugin إضافية                            |
| `slots`            | محددات الخانات الحصرية (مثل `memory`، و`contextEngine`) |
| `entries.\<id\>`   | مفاتيح تبديل + تكوين لكل Plugin                               |

`plugins.allow` حصري. عندما لا يكون فارغًا، لا يمكن إلا للـ Plugins المدرجة التحميل
أو كشف الأدوات، حتى إذا كان `tools.allow` يحتوي على `"*"` أو اسم أداة محدد مملوك
لـ Plugin. إذا كانت قائمة السماح بالأدوات تشير إلى أدوات Plugin، فأضف معرّفات الـ Plugin المالكة
إلى `plugins.allow` أو أزل `plugins.allow`؛ يحذر `openclaw doctor` من هذا
الشكل.

تكون القيمة الافتراضية لـ `plugins.bundledDiscovery` هي `"allowlist"` للتكوينات الجديدة، لذا فإن
حصر مخزون `plugins.allow` يمنع أيضًا Plugins مزودي الخدمات المضمنة غير المذكورة،
بما في ذلك اكتشاف مزود بحث الويب أثناء وقت التشغيل. يختم Doctor تكوينات قوائم السماح
المقيّدة الأقدم بـ `"compat"` أثناء الترحيل حتى تحافظ الترقيات على سلوك مزودي الخدمات
المضمنة القديم إلى أن يختار المشغّل الوضع الأكثر صرامة.
لا يزال `plugins.allow` الفارغ يُعامل كأنه غير معيّن/مفتوح.

تؤدي تغييرات التكوين التي تتم عبر `/plugins enable` أو `/plugins disable` إلى إعادة تحميل
Plugin داخل عملية Gateway. تعيد أدوار الوكيل الجديدة بناء قائمة أدواتها من
سجل الـ Plugin المحدّث. أما العمليات التي تغيّر المصدر مثل التثبيت،
والتحديث، وإلغاء التثبيت فلا تزال تعيد تشغيل عملية Gateway لأن وحدات
Plugin التي سبق استيرادها لا يمكن استبدالها بأمان في مكانها.

`openclaw plugins list` هي لقطة محلية لسجل/تكوين الـ Plugin. عندما يظهر
Plugin بحالة `enabled` هناك، فهذا يعني أن السجل الدائم والتكوين الحالي يسمحان
للـ Plugin بالمشاركة. ولا يثبت ذلك أن Gateway بعيدة قيد التشغيل بالفعل
قد أعادت التحميل أو أعيد تشغيلها إلى كود الـ Plugin نفسه. في إعدادات VPS/الحاويات
ذات عمليات التغليف، أرسل عمليات إعادة التشغيل أو كتابات تؤدي إلى إعادة التحميل إلى عملية
`openclaw gateway run` الفعلية، أو استخدم `openclaw gateway restart` ضد
Gateway الجارية عندما يبلّغ إعادة التحميل عن فشل.

<Accordion title="حالات الـ Plugin: معطّل مقابل مفقود مقابل غير صالح">
  - **معطّل**: الـ Plugin موجود لكن قواعد التمكين أوقفته. يتم الحفاظ على التكوين.
  - **مفقود**: يشير التكوين إلى معرّف Plugin لم يجده الاكتشاف.
  - **غير صالح**: الـ Plugin موجود لكن تكوينه لا يطابق المخطط المعلن. يتخطى بدء تشغيل Gateway ذلك الـ Plugin فقط؛ يمكن لـ `openclaw doctor --fix` عزل الإدخال غير الصالح بتعطيله وإزالة حمولة تكوينه.

</Accordion>

## الاكتشاف والأسبقية

يفحص OpenClaw الـ Plugins بهذا الترتيب (أول تطابق يفوز):

<Steps>
  <Step title="مسارات التكوين">
    `plugins.load.paths` - مسارات ملفات أو أدلة صريحة. يتم تجاهل المسارات التي تشير
    عائدة إلى أدلة الـ Plugin المضمنة المعبأة الخاصة بـ OpenClaw؛
    شغّل `openclaw doctor --fix` لإزالة تلك الأسماء البديلة القديمة.
  </Step>

  <Step title="Plugins مساحة العمل">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins العامة">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins المضمنة">
    تُشحن مع OpenClaw. كثير منها ممكّن افتراضيًا (مزودو النماذج، الكلام).
    ويتطلب غيرها تمكينًا صريحًا.
  </Step>
</Steps>

عادةً ما تحل عمليات التثبيت المعبأة وصور Docker الـ Plugins المضمنة من
شجرة `dist/extensions` المترجمة. إذا تم تركيب دليل مصدر Plugin مضمّن
فوق مسار المصدر المعبأ المطابق، مثل
`/app/extensions/synology-chat`، فإن OpenClaw يعامل دليل المصدر المركّب ذلك
كتراكب مصدر مضمّن ويكتشفه قبل حزمة
`/app/dist/extensions/synology-chat` المعبأة. يحافظ هذا على عمل حلقات حاويات
المشرفين دون إعادة كل Plugin مضمّن إلى مصدر TypeScript.
اضبط `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` لإجبار استخدام حزم dist المعبأة
حتى عند وجود تركيبات تراكب المصدر.

### قواعد التمكين

- `plugins.enabled: false` يعطّل جميع الـ Plugins ويتخطى عمل اكتشاف/تحميل الـ Plugin
- `plugins.deny` له الأسبقية دائمًا على السماح
- `plugins.entries.\<id\>.enabled: false` يعطّل ذلك الـ Plugin
- الـ Plugins ذات منشأ مساحة العمل **معطّلة افتراضيًا** (يجب تمكينها صراحة)
- تتبع الـ Plugins المضمنة مجموعة التمكين الافتراضي المدمجة ما لم يتم تجاوزها
- يمكن للخانات الحصرية فرض تمكين الـ Plugin المحدد لتلك الخانة
- يتم تمكين بعض الـ Plugins المضمنة الاختيارية تلقائيًا عندما يذكر التكوين
  سطحًا مملوكًا لـ Plugin، مثل مرجع نموذج مزود، أو تكوين قناة، أو وقت تشغيل
  harness
- يتم الحفاظ على تكوين Plugin القديم أثناء تفعيل `plugins.enabled: false`؛
  أعد تمكين الـ Plugins قبل تشغيل تنظيف doctor إذا كنت تريد إزالة المعرّفات القديمة
- تحتفظ مسارات OpenAI-family Codex بحدود Plugin منفصلة:
  `openai-codex/*` ينتمي إلى OpenAI plugin، بينما يتم اختيار Plugin خادم تطبيق Codex
  المضمن عبر مراجع وكيل `openai/*` القياسية، أو
  `agentRuntime.id: "codex"` الصريح للمزود/النموذج، أو مراجع نماذج `codex/*` القديمة

## استكشاف خطاطيف وقت التشغيل وإصلاحها

إذا ظهر Plugin في `plugins list` لكن آثار `register(api)` الجانبية أو الخطاطيف
لا تعمل في حركة المحادثة الحية، فتحقق من هذه أولًا:

- شغّل `openclaw gateway status --deep --require-rpc` وتأكد من أن عنوان URL النشط
  لـ Gateway، والملف الشخصي، ومسار التكوين، والعملية هي نفسها التي تعدّلها.
- أعد تشغيل Gateway الحية بعد تغييرات تثبيت/تكوين/كود الـ Plugin. في حاويات
  التغليف، قد يكون PID 1 مشرفًا فقط؛ أعد تشغيل عملية
  `openclaw gateway run` الفرعية أو أرسل إشارة إليها.
- استخدم `openclaw plugins inspect <id> --runtime --json` لتأكيد تسجيلات الخطاطيف و
  التشخيصات. تحتاج خطاطيف المحادثة غير المضمنة مثل `before_model_resolve`،
  و`before_agent_reply`، و`before_agent_run`، و`llm_input`، و`llm_output`،
  و`before_agent_finalize`، و`agent_end` إلى
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- لتبديل النماذج، فضّل `before_model_resolve`. يعمل قبل حل النموذج
  لأدوار الوكيل؛ أما `llm_output` فلا يعمل إلا بعد أن تنتج محاولة نموذج
  مخرجات مساعد.
- لإثبات نموذج الجلسة الفعّال، استخدم `openclaw sessions` أو أسطح
  جلسة/حالة Gateway، وعند تصحيح حمولات المزود، ابدأ
  Gateway باستخدام `--raw-stream --raw-stream-path <path>`.

### إعداد أداة Plugin بطيء

إذا بدت أدوار الوكيل متوقفة أثناء تجهيز الأدوات، فمكّن تسجيل التتبع
وتحقق من أسطر توقيت مصنع أدوات الـ Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

ابحث عن:

```text
[trace:plugin-tools] factory timings ...
```

يعرض الملخص إجمالي وقت المصنع وأبطأ مصانع أدوات الـ Plugin،
بما في ذلك معرّف الـ Plugin، وأسماء الأدوات المعلنة، وشكل النتيجة، وما إذا كانت الأداة
اختيارية. تتم ترقية الأسطر البطيئة إلى تحذيرات عندما يستغرق مصنع واحد
ثانية واحدة على الأقل أو يستغرق إجمالي تجهيز مصانع أدوات الـ Plugin خمس ثوانٍ على الأقل.

يخزّن OpenClaw نتائج مصانع أدوات الـ Plugin الناجحة مؤقتًا لعمليات الحل المتكررة
مع سياق الطلب الفعّال نفسه. يتضمن مفتاح التخزين المؤقت تكوين وقت التشغيل
الفعّال، ومساحة العمل، ومعرّفات الوكيل/الجلسة، وسياسة sandbox، وإعدادات المتصفح،
وسياق التسليم، وهوية الطالب، وحالة الملكية، لذلك تتم إعادة تشغيل المصانع التي
تعتمد على تلك الحقول الموثوقة عندما يتغير السياق.

إذا كان Plugin واحد يهيمن على التوقيت، فافحص تسجيلاته أثناء وقت التشغيل:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

ثم حدّث ذلك الـ Plugin أو أعد تثبيته أو عطّله. ينبغي لمؤلفي الـ Plugin نقل
تحميل الاعتماديات المكلفة إلى ما وراء مسار تنفيذ الأداة بدلًا من القيام به
داخل مصنع الأداة.

### ملكية قناة أو أداة مكررة

الأعراض:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

تعني هذه أن أكثر من Plugin ممكّن يحاول امتلاك القناة نفسها،
أو تدفق الإعداد نفسه، أو اسم الأداة نفسه. السبب الأكثر شيوعًا هو تثبيت Plugin قناة خارجي
بجانب Plugin مضمّن يوفر الآن معرّف القناة نفسه.

خطوات التصحيح:

- شغّل `openclaw plugins list --enabled --verbose` لرؤية كل Plugin ممكّن
  ومنشئه.
- شغّل `openclaw plugins inspect <id> --runtime --json` لكل Plugin مشتبه به و
  قارن `channels`، و`channelConfigs`، و`tools`، والتشخيصات.
- شغّل `openclaw plugins registry --refresh` بعد تثبيت حزم Plugin أو إزالتها
  حتى تعكس البيانات الوصفية الدائمة التثبيت الحالي.
- أعد تشغيل Gateway بعد تغييرات التثبيت أو السجل أو التكوين.

خيارات الإصلاح:

- إذا كان أحد الـ Plugins يستبدل آخر عمدًا لمعرّف القناة نفسه، فيجب أن يعلن
  الـ Plugin المفضّل `channelConfigs.<channel-id>.preferOver` مع
  معرّف الـ Plugin الأقل أولوية. راجع [/plugins/manifest#replacing-another-channel-plugin](/ar/plugins/manifest#replacing-another-channel-plugin).
- إذا كان التكرار عرضيًا، فعطّل أحد الجانبين باستخدام
  `plugins.entries.<plugin-id>.enabled: false` أو أزل تثبيت الـ Plugin
  القديم.
- إذا مكّنت كلا الـ Plugins صراحة، يحتفظ OpenClaw بذلك الطلب و
  يبلّغ عن التعارض. اختر مالكًا واحدًا للقناة أو أعد تسمية الأدوات المملوكة لـ Plugin
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

تُشحن Plugins المضمّنة مع OpenClaw. ويُفعَّل كثير منها افتراضيًا (على سبيل المثال
موفرو النماذج المضمّنون، وموفرو الكلام المضمّنون، وPlugin المتصفح
المضمّن). لا تزال Plugins مضمّنة أخرى تحتاج إلى `openclaw plugins enable <id>`.

يستبدل `--force` أي Plugin أو حزمة خطافات مثبّتة موجودة في مكانها. استخدم
`openclaw plugins update <id-or-npm-spec>` للترقيات الروتينية لـ Plugins npm
المتتبَّعة. لا يُدعَم ذلك مع `--link`، الذي يعيد استخدام مسار المصدر بدلًا
من النسخ فوق هدف تثبيت مُدار.

عندما تكون `plugins.allow` مضبوطة مسبقًا، يضيف `openclaw plugins install`
معرّف Plugin المثبّت إلى قائمة السماح تلك قبل تفعيله. وإذا كان معرّف Plugin نفسه
موجودًا في `plugins.deny`، فإن التثبيت يزيل إدخال الحظر القديم ذلك حتى يصبح
التثبيت الصريح قابلًا للتحميل فورًا بعد إعادة التشغيل.

يحتفظ OpenClaw بسجل Plugin محلي دائم بوصفه نموذج القراءة الباردة لمخزون
Plugins، وملكية المساهمات، وتخطيط بدء التشغيل. تقوم تدفقات التثبيت والتحديث
وإزالة التثبيت والتفعيل والتعطيل بتحديث ذلك السجل بعد تغيير حالة Plugin.
ويحتفظ ملف `plugins/installs.json` نفسه ببيانات تثبيت وصفية دائمة في
`installRecords` ذات المستوى الأعلى، وبيانات manifest وصفية قابلة لإعادة
البناء في `plugins`. إذا كان السجل مفقودًا أو قديمًا أو غير صالح، يعيد
`openclaw plugins registry --refresh` بناء عرض manifest الخاص به من سجلات
التثبيت، وسياسة الإعداد، وبيانات manifest/package الوصفية من دون تحميل وحدات
تشغيل Plugin.

في وضع Nix (`OPENCLAW_NIX_MODE=1`)، تُعطَّل معدِّلات دورة حياة Plugin.
أدر اختيار حزم Plugin والإعداد عبر مصدر Nix الخاص بالتثبيت بدلًا من ذلك؛ وبالنسبة إلى
nix-openclaw، ابدأ بـ
[البدء السريع](https://github.com/openclaw/nix-openclaw#quick-start) الموجَّه للوكيل أولًا.
ينطبق `openclaw plugins update <id-or-npm-spec>` على التثبيتات المتتبَّعة. يؤدي تمرير
مواصفة حزمة npm مع dist-tag أو إصدار دقيق إلى حل اسم الحزمة رجوعًا إلى سجل
Plugin المتتبَّع وتسجيل المواصفة الجديدة للتحديثات المستقبلية. ويؤدي تمرير اسم
الحزمة من دون إصدار إلى نقل تثبيت مثبّت بدقة إلى خط الإصدار الافتراضي للسجل.
إذا كان Plugin npm المثبّت يطابق بالفعل الإصدار المحلول وهوية الأثر المسجلة،
يتخطى OpenClaw التحديث من دون تنزيل أو إعادة تثبيت أو إعادة كتابة الإعداد.
عندما يعمل `openclaw update` على قناة beta، تحاول سجلات Plugin ذات الخط الافتراضي
من npm وClawHub استخدام `@beta` أولًا، ثم تعود إلى default/latest عند عدم وجود
إصدار beta لـ Plugin. تظل الإصدارات الدقيقة والوسوم الصريحة مثبّتة.

`--pin` خاص بـ npm فقط. وهو غير مدعوم مع `--marketplace`، لأن تثبيتات
marketplace تحفظ بيانات وصفية لمصدر marketplace بدلًا من مواصفة npm.

`--dangerously-force-unsafe-install` هو تجاوز طارئ للنتائج الإيجابية الكاذبة
من ماسح الشيفرات الخطرة المدمج. يسمح ذلك بتثبيتات Plugin وتحديثات Plugin بأن
تتجاوز نتائج `critical` المدمجة، لكنه لا يزال لا يتجاوز حواجز سياسة
`before_install` الخاصة بـ Plugin أو الحظر الناتج عن فشل الفحص.
تتجاهل فحوصات التثبيت ملفات وأدلة الاختبار الشائعة مثل `tests/` و`__tests__/`
و`*.test.*` و`*.spec.*` لتجنب حظر محاكيات الاختبار المعبأة؛ وتظل نقاط دخول
تشغيل Plugin المعلنة مفحوصة حتى إذا استخدمت أحد تلك الأسماء.

ينطبق علم CLI هذا على تدفقات تثبيت/تحديث Plugin فقط. أما تثبيتات تبعيات Skills
المدعومة من Gateway فتستخدم تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`
بدلًا من ذلك، بينما يظل `openclaw skills install` تدفق تنزيل/تثبيت Skills
المنفصل من ClawHub.

إذا كان Plugin نشرته على ClawHub مخفيًا أو محظورًا بسبب فحص، فافتح لوحة تحكم
ClawHub أو شغّل `clawhub package rescan <name>` لتطلب من ClawHub فحصه مرة أخرى.
لا يؤثر `--dangerously-force-unsafe-install` إلا في التثبيتات على جهازك؛ فهو لا
يطلب من ClawHub إعادة فحص Plugin أو جعل إصدار محظور عامًا.

تشارك الحزم المتوافقة في تدفق قائمة/فحص/تفعيل/تعطيل Plugin نفسه. يشمل دعم التشغيل
الحالي Skills الحزمة، وSkills أوامر Claude، وافتراضيات `settings.json` الخاصة بـ
Claude، وافتراضيات `.lsp.json` الخاصة بـ Claude و`lspServers` المعلنة في manifest،
وSkills أوامر Cursor، وأدلة خطافات Codex المتوافقة.

يعرض `openclaw plugins inspect <id>` أيضًا إمكانات الحزمة المكتشفة، إضافة إلى
إدخالات خوادم MCP وLSP المدعومة أو غير المدعومة لـ Plugins المدعومة بحزمة.

يمكن أن تكون مصادر Marketplace اسم known-marketplace لـ Claude من
`~/.claude/plugins/known_marketplaces.json`، أو جذر marketplace محليًا أو مسار
`marketplace.json`، أو صيغة GitHub مختصرة مثل `owner/repo`، أو URL لمستودع
GitHub، أو URL لـ git. بالنسبة إلى marketplaces البعيدة، يجب أن تبقى إدخالات
Plugin داخل مستودع marketplace المستنسخ وأن تستخدم مصادر مسارات نسبية فقط.

راجع [مرجع CLI لـ `openclaw plugins`](/ar/cli/plugins) للحصول على التفاصيل الكاملة.

## نظرة عامة على واجهة برمجة تطبيقات Plugin

تصدّر Plugins الأصلية كائن إدخال يعرّض `register(api)`. قد لا تزال Plugins
الأقدم تستخدم `activate(api)` كاسم بديل قديم، لكن يجب أن تستخدم Plugins الجديدة
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

يحمّل OpenClaw كائن الإدخال ويستدعي `register(api)` أثناء تفعيل Plugin.
لا يزال المحمّل يعود إلى `activate(api)` من أجل Plugins الأقدم، لكن يجب على
Plugins المضمّنة وPlugins الخارجية الجديدة التعامل مع `register` بوصفه
العقد العام.

يوضح `api.registrationMode` لـ Plugin سبب تحميل إدخاله:

| الوضع | المعنى |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | تفعيل وقت التشغيل. سجّل الأدوات والخطافات والخدمات والأوامر والمسارات والآثار الجانبية الحية الأخرى. |
| `discovery` | اكتشاف الإمكانات للقراءة فقط. سجّل المزوّدين والبيانات الوصفية؛ قد تُحمَّل شيفرة إدخال Plugin الموثوقة، لكن تخطَّ الآثار الجانبية الحية. |
| `setup-only` | تحميل بيانات إعداد القناة الوصفية عبر إدخال إعداد خفيف. |
| `setup-runtime` | تحميل إعداد القناة الذي يحتاج أيضًا إلى إدخال وقت التشغيل. |
| `cli-metadata` | جمع بيانات أوامر CLI الوصفية فقط. |

ينبغي لإدخالات Plugin التي تفتح مقابس أو قواعد بيانات أو عمال خلفية أو عملاء
طويلي العمر أن تحرس تلك الآثار الجانبية باستخدام `api.registrationMode === "full"`.
تُخزَّن تحميلات الاكتشاف مؤقتًا بشكل منفصل عن تحميلات التفعيل ولا تستبدل سجل
Gateway الجاري. الاكتشاف غير مُفعِّل، وليس خاليًا من الاستيراد:
قد يقيّم OpenClaw إدخال Plugin الموثوق أو وحدة Plugin الخاصة بالقناة لبناء
اللقطة. أبقِ المستويات العليا للوحدات خفيفة وخالية من الآثار الجانبية، وانقل
عملاء الشبكة والعمليات الفرعية والمستمعين وقراءات بيانات الاعتماد وبدء تشغيل
الخدمات خلف مسارات وقت التشغيل الكاملة.

طرق التسجيل الشائعة:

| الطريقة | ما تسجله |
| --------------------------------------- | --------------------------- |
| `registerProvider` | مزوّد نموذج (LLM) |
| `registerChannel` | قناة دردشة |
| `registerTool` | أداة وكيل |
| `registerHook` / `on(...)` | خطافات دورة الحياة |
| `registerSpeechProvider` | تحويل النص إلى كلام / STT |
| `registerRealtimeTranscriptionProvider` | STT متدفق |
| `registerRealtimeVoiceProvider` | صوت آني ثنائي الاتجاه |
| `registerMediaUnderstandingProvider` | تحليل الصور/الصوت |
| `registerImageGenerationProvider` | توليد الصور |
| `registerMusicGenerationProvider` | توليد الموسيقى |
| `registerVideoGenerationProvider` | توليد الفيديو |
| `registerWebFetchProvider` | مزوّد جلب/كشط ويب |
| `registerWebSearchProvider` | بحث الويب |
| `registerHttpRoute` | نقطة نهاية HTTP |
| `registerCommand` / `registerCli` | أوامر CLI |
| `registerContextEngine` | محرك السياق |
| `registerService` | خدمة خلفية |

سلوك حارس الخطافات لخطافات دورة الحياة المعرّفة الأنواع:

- `before_tool_call`: `{ block: true }` نهائي؛ تُتخطى المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: `{ block: false }` لا يفعل شيئًا ولا يمسح حظرًا سابقًا.
- `before_install`: `{ block: true }` نهائي؛ تُتخطى المعالجات ذات الأولوية الأدنى.
- `before_install`: `{ block: false }` لا يفعل شيئًا ولا يمسح حظرًا سابقًا.
- `message_sending`: `{ cancel: true }` نهائي؛ تُتخطى المعالجات ذات الأولوية الأدنى.
- `message_sending`: `{ cancel: false }` لا يفعل شيئًا ولا يمسح إلغاءً سابقًا.

يقوم خادم تطبيق Codex الأصلي بربط أحداث أدوات Codex الأصلية مجدداً بسطح الخطافات هذا. يمكن لـ Plugins حظر أدوات Codex الأصلية عبر `before_tool_call`، ومراقبة النتائج عبر `after_tool_call`، والمشاركة في موافقات `PermissionRequest` في Codex. لا يعيد الجسر بعد كتابة وسيطات أدوات Codex الأصلية. يعيش حد الدعم الدقيق لوقت تشغيل Codex في
[عقد دعم الإصدار v1 لحزام Codex](/ar/plugins/codex-harness-runtime#v1-support-contract).

للاطلاع على السلوك الكامل للخطافات ذات الأنواع، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#hook-decision-semantics).

## ذات صلة

- [إنشاء Plugins](/ar/plugins/building-plugins) - أنشئ Plugin الخاص بك
- [حزم Plugin](/ar/plugins/bundles) - توافق حزم Codex/Claude/Cursor
- [بيان Plugin](/ar/plugins/manifest) - مخطط البيان
- [تسجيل الأدوات](/ar/plugins/building-plugins#registering-agent-tools) - أضف أدوات الوكيل في Plugin
- [داخليات Plugin](/ar/plugins/architecture) - نموذج الإمكانات ومسار التحميل
- [ClawHub](/ar/clawhub) - اكتشاف Plugins تابعة لجهات خارجية
