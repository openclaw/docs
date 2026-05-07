---
read_when:
    - تثبيت Plugins أو تكوينها
    - فهم قواعد اكتشاف Plugin وتحميله
    - العمل مع حِزم Plugin المتوافقة مع Codex/Claude
sidebarTitle: Install and Configure
summary: ثبّت Plugins الخاصة بـ OpenClaw وهيّئها وأدرها
title: Plugins
x-i18n:
    generated_at: "2026-05-07T01:56:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91c476a2e3d7078ac3af22767a22afec685a25707b9aebf36e1ed7b3fdc87961
    source_path: tools/plugin.md
    workflow: 16
---

توسّع Plugins قدرات OpenClaw بإمكانات جديدة: القنوات، وموفّرو النماذج،
وأدوات تشغيل الوكلاء، والأدوات، وSkills، والكلام، والنسخ الفوري، والصوت
الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب، والبحث في
الويب، والمزيد. بعض Plugins تكون **أساسية** (مشحونة مع OpenClaw)، وأخرى
**خارجية**. تُنشر معظم Plugins الخارجية وتُكتشف من خلال
[ClawHub](/ar/tools/clawhub). يظل npm مدعومًا للتثبيت المباشر ولمجموعة مؤقتة من
حزم Plugins المملوكة لـ OpenClaw إلى أن تكتمل تلك الهجرة.

## البدء السريع

لأمثلة التثبيت والنسخ واللصق، والعرض، وإلغاء التثبيت، والتحديث، والنشر، راجع
[إدارة Plugins](/ar/plugins/manage-plugins).

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

  <Step title="إدارة أصلية من المحادثة">
    في Gateway قيد التشغيل، يؤدي الأمران المقتصران على المالك `/plugins enable` و`/plugins disable`
    إلى تشغيل معيد تحميل إعدادات Gateway. يعيد Gateway تحميل أسطح تشغيل Plugin
    داخل العملية، وتعيد دورات الوكيل الجديدة بناء قائمة أدواتها من السجل
    المحدّث. يغيّر `/plugins install` شيفرة مصدر Plugin، لذلك يطلب
    Gateway إعادة تشغيل بدلًا من التظاهر بأن العملية الحالية يمكنها
    إعادة تحميل الوحدات التي استُوردت بالفعل بأمان.

  </Step>

  <Step title="تحقّق من Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    استخدم `--runtime` عندما تحتاج إلى إثبات الأدوات المسجّلة، أو الخدمات، أو
    طرق Gateway، أو الخطافات، أو أوامر CLI المملوكة لـ Plugin. أمّا `inspect`
    العادي فهو فحص بارد للبيان/السجل ويتجنب عمدًا استيراد وقت تشغيل Plugin.

  </Step>
</Steps>

إذا كنت تفضّل التحكم الأصلي من المحادثة، فعّل `commands.plugins: true` واستخدم:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

يستخدم مسار التثبيت محلّل العناوين نفسه مثل CLI: مسار/أرشيف محلي، أو
`clawhub:<pkg>` صريح، أو `npm:<pkg>` صريح، أو `npm-pack:<path.tgz>` صريح،
أو `git:<repo>` صريح، أو مواصفة حزمة عارية عبر npm.

إذا كانت الإعدادات غير صالحة، يفشل التثبيت عادةً بإغلاق آمن ويوجّهك إلى
`openclaw doctor --fix`. استثناء الاسترداد الوحيد هو مسار ضيق لإعادة تثبيت
Plugin مضمّن لـ Plugins التي تختار تفعيل
`openclaw.install.allowInvalidConfigRecovery`.
أثناء بدء Gateway، تفشل إعدادات Plugin غير الصالحة بإغلاق آمن مثل أي إعدادات
أخرى غير صالحة. شغّل `openclaw doctor --fix` لعزل إعدادات Plugin السيئة
بتعطيل إدخال ذلك Plugin وإزالة حمولة إعداداته غير الصالحة؛ تحتفظ نسخة
الإعدادات الاحتياطية العادية بالقيم السابقة.
عندما يشير إعداد قناة إلى Plugin لم يعد قابلًا للاكتشاف لكن معرّف Plugin
القديم نفسه ما زال موجودًا في إعدادات Plugin أو سجلات التثبيت، تسجّل عملية
بدء Gateway تحذيرات وتتخطى تلك القناة بدلًا من حظر كل القنوات الأخرى.
شغّل `openclaw doctor --fix` لإزالة إدخالات القناة/Plugin القديمة؛ وتظل
مفاتيح القنوات غير المعروفة من دون دليل على Plugin قديم تفشل في التحقق حتى
تبقى الأخطاء الإملائية مرئية.
إذا ضُبط `plugins.enabled: false`، تُعامل مراجع Plugin القديمة كغير فعالة:
تتخطى عملية بدء Gateway أعمال اكتشاف/تحميل Plugin ويحافظ `openclaw doctor`
على إعدادات Plugin المعطّلة بدلًا من إزالتها تلقائيًا. أعد تفعيل Plugins قبل
تشغيل تنظيف doctor إذا أردت إزالة معرّفات Plugin القديمة.

يحدث تثبيت اعتماديات Plugin فقط أثناء تدفقات التثبيت/التحديث الصريحة أو إصلاح
doctor. لا تشغّل عملية بدء Gateway، أو إعادة تحميل الإعدادات، أو فحص وقت
التشغيل مديري الحزم ولا تصلح أشجار الاعتماديات. يجب أن تكون اعتماديات Plugins
المحلية مثبّتة مسبقًا، بينما تُثبّت Plugins من npm وgit وClawHub ضمن جذور
Plugins المُدارة من OpenClaw. قد تُرفع اعتماديات npm داخل جذر npm المُدار من
OpenClaw؛ يمسح التثبيت/التحديث ذلك الجذر المُدار قبل الثقة، وتزيل عملية إلغاء
التثبيت الحزم المُدارة بواسطة npm عبر npm. يجب أن تظل Plugins الخارجية ومسارات
التحميل المخصصة مثبّتة عبر `openclaw plugins install`.
استخدم `openclaw plugins list --json` لرؤية `dependencyStatus` الثابت لكل
Plugin مرئي من دون استيراد شيفرة وقت التشغيل أو إصلاح الاعتماديات.
راجع [حل اعتماديات Plugin](/ar/plugins/dependency-resolution) لدورة الحياة وقت
التثبيت.

### ملكية مسار Plugin محظور

إذا قالت تشخيصات Plugin:
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
وتبع التحقق من الإعدادات ذلك بـ `plugin present but blocked`، فهذا يعني أن
OpenClaw وجد ملفات Plugin مملوكة لمستخدم Unix مختلف عن العملية التي تحمّلها.
أبقِ إعدادات Plugin في مكانها؛ أصلح ملكية نظام الملفات أو شغّل OpenClaw
بالمستخدم نفسه الذي يملك دليل الحالة.

بالنسبة إلى تثبيتات Docker، تعمل الصورة الرسمية باسم `node` (uid `1000`)،
لذلك ينبغي عادةً أن تكون أدلة إعدادات OpenClaw ومساحة العمل المربوطة من
المضيف مملوكة لـ uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

إذا كنت تشغّل OpenClaw عمدًا كجذر، فأصلح جذر Plugin المُدار ليكون بملكية
الجذر بدلًا من ذلك:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

بعد إصلاح الملكية، أعد تشغيل `openclaw doctor --fix` أو
`openclaw plugins registry --refresh` حتى يطابق سجل Plugin المحفوظ الملفات
المُصلحة.

بالنسبة إلى تثبيتات npm، تُحلّ المحددات القابلة للتغيير مثل `latest` أو
dist-tag قبل التثبيت ثم تُثبّت على الإصدار الدقيق المتحقق منه في جذر npm
المُدار من OpenClaw. بعد انتهاء npm، يتحقق OpenClaw من أن إدخال
`package-lock.json` المثبّت ما زال يطابق الإصدار المحلول والتكامل. إذا كتب npm
بيانات تعريف حزمة مختلفة، يفشل التثبيت ويُعاد الجذر المُدار بدلًا من قبول
أثر Plugin مختلف.
ترث جذور npm المُدارة أيضًا `overrides` الخاصة بـ npm على مستوى حزمة
OpenClaw، لذلك تنطبق تثبيتات الأمان التي تحمي المضيف المحزّم أيضًا على
اعتماديات Plugin الخارجية المرفوعة.

عمليات سحب المصدر هي مساحات عمل pnpm. إذا نسخت OpenClaw للعمل على Plugins
المضمّنة، شغّل `pnpm install`؛ عندها يحمّل OpenClaw Plugins المضمّنة من
`extensions/<id>` بحيث تُستخدم التعديلات والاعتماديات المحلية للحزمة مباشرة.
تثبيتات جذر npm العادية مخصصة لـ OpenClaw المحزّم، لا لتطوير نسخة مصدرية
مسحوبة.

## أنواع Plugin

يتعرّف OpenClaw على صيغتَي Plugin:

| الصيغة     | آلية العمل                                                       | أمثلة                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **أصلية** | `openclaw.plugin.json` + وحدة وقت تشغيل؛ تُنفّذ داخل العملية       | Plugins رسمية، حزم npm مجتمعية               |
| **حزمة** | تخطيط متوافق مع Codex/Claude/Cursor؛ يُعيّن إلى ميزات OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

تظهر كلتاهما ضمن `openclaw plugins list`. راجع [حزم Plugin](/ar/plugins/bundles) لتفاصيل الحزم.

إذا كنت تكتب Plugin أصلية، فابدأ بـ [بناء Plugins](/ar/plugins/building-plugins)
و[نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

## نقاط دخول الحزم

يجب أن تعلن حزم npm الخاصة بـ Plugin الأصلية عن `openclaw.extensions` في `package.json`.
يجب أن يبقى كل إدخال داخل دليل الحزمة وأن يُحل إلى ملف وقت تشغيل قابل للقراءة،
أو إلى ملف مصدر TypeScript مع نظير JavaScript مبني مستنتج مثل `src/index.ts` إلى `dist/index.js`.
يجب أن تشحن التثبيتات المحزّمة مخرجات وقت تشغيل JavaScript هذه. احتياطي مصدر
TypeScript مخصص لعمليات السحب المصدرية ومسارات التطوير المحلية، وليس لحزم
npm المثبّتة في جذر Plugin المُدار من OpenClaw.

إذا قال تحذير حزمة مُدارة إنها `requires compiled runtime output for
TypeScript entry ...`، فهذا يعني أن الحزمة نُشرت من دون ملفات JavaScript التي
يحتاجها OpenClaw وقت التشغيل. هذه مشكلة تحزيم Plugin، وليست مشكلة إعدادات
محلية. حدّث Plugin أو أعد تثبيته بعد أن يعيد الناشر نشر JavaScript المترجم،
أو عطّل/ألغِ تثبيت ذلك Plugin إلى أن تتوفر حزمة مُصلحة.

استخدم `openclaw.runtimeExtensions` عندما لا تكون ملفات وقت التشغيل المنشورة
في المسارات نفسها مثل إدخالات المصدر. عند وجود `runtimeExtensions`، يجب أن
تحتوي على إدخال واحد بالضبط لكل إدخال في `extensions`. تؤدي القوائم غير
المتطابقة إلى فشل التثبيت واكتشاف Plugin بدلًا من الرجوع بصمت إلى مسارات
المصدر. إذا نشرت أيضًا `openclaw.setupEntry`، فاستخدم `openclaw.runtimeSetupEntry`
لنظيره JavaScript المبني؛ ذلك الملف مطلوب عند التصريح به.

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

ClawHub هو مسار التوزيع الأساسي لمعظم Plugins. إصدارات OpenClaw المحزّمة
الحالية تضم بالفعل كثيرًا من Plugins الرسمية، لذلك لا تحتاج إلى تثبيتات npm
منفصلة في الإعدادات العادية. إلى أن تهاجر كل Plugin مملوكة لـ OpenClaw إلى
ClawHub، يظل OpenClaw يشحن بعض حزم Plugin بنمط `@openclaw/*` على npm
للتثبيتات الأقدم/المخصصة وتدفقات عمل npm المباشرة.

إذا أبلغ npm عن حزمة Plugin بنمط `@openclaw/*` على أنها مهجورة، فذلك الإصدار
من الحزمة ينتمي إلى قطار حزم خارجي أقدم. استخدم Plugin المضمّنة من OpenClaw
الحالي أو نسخة محلية مسحوبة إلى أن تُنشر حزمة npm أحدث.

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

### أساسية (مشحونة مع OpenClaw)

<AccordionGroup>
  <Accordion title="موفّرو النماذج (مفعّلون افتراضيًا)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` - بحث الذاكرة المضمّن (الافتراضي عبر `plugins.slots.memory`)
    - `memory-lancedb` - ذاكرة طويلة الأمد مدعومة بـ LanceDB مع استدعاء/التقاط تلقائي (اضبط `plugins.slots.memory = "memory-lancedb"`)

    راجع [Memory LanceDB](/ar/plugins/memory-lancedb) لإعداد التضمينات المتوافقة مع OpenAI،
    وأمثلة Ollama، وحدود الاستدعاء، واستكشاف الأخطاء وإصلاحها.

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` - Plugin متصفح مضمّن لأداة المتصفح، وCLI `openclaw browser`، وطريقة Gateway `browser.request`، ووقت تشغيل المتصفح، وخدمة التحكم الافتراضية في المتصفح (مفعّل افتراضيًا؛ عطّله قبل استبداله)
    - `copilot-proxy` - جسر VS Code Copilot Proxy (معطّل افتراضيًا)

  </Accordion>
</AccordionGroup>

هل تبحث عن Plugins تابعة لجهات خارجية؟ راجع [Plugins المجتمع](/ar/plugins/community).

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
| `enabled`          | مفتاح التفعيل الرئيسي (الافتراضي: `true`)                           |
| `allow`            | قائمة السماح للـ Plugin (اختياري)                               |
| `bundledDiscovery` | وضع اكتشاف الـ Plugin المضمّن (`allowlist` افتراضيًا)    |
| `deny`             | قائمة حظر الـ Plugin (اختياري؛ الحظر له الأولوية)                     |
| `load.paths`       | ملفات/دلائل Plugin إضافية                            |
| `slots`            | محددات الخانات الحصرية (مثل `memory`، `contextEngine`) |
| `entries.\<id\>`   | مفاتيح تفعيل لكل Plugin + التكوين                               |

`plugins.allow` حصرية. عندما لا تكون فارغة، لا يمكن تحميل أو كشف الأدوات إلا للـ Plugins المدرجة، حتى إذا كان `tools.allow` يحتوي على `"*"` أو اسم أداة محددة مملوكة لـ Plugin. إذا كانت قائمة السماح للأدوات تشير إلى أدوات Plugin، فأضف معرّفات الـ Plugins المالكة إلى `plugins.allow` أو أزل `plugins.allow`؛ يحذّر `openclaw doctor` من هذا الشكل.

القيمة الافتراضية لـ `plugins.bundledDiscovery` هي `"allowlist"` للتكوينات الجديدة، لذلك فإن مخزون `plugins.allow` التقييدي يحظر أيضًا Plugins مزودي الخدمة المضمّنة غير المذكورة، بما في ذلك اكتشاف مزود البحث على الويب في وقت التشغيل. يضع Doctor وسم `"compat"` على تكوينات قائمة السماح التقييدية الأقدم أثناء الترحيل لكي تحافظ الترقيات على سلوك مزودي الخدمة المضمّنين القديم إلى أن يختار المشغّل الوضع الأكثر صرامة. ما تزال `plugins.allow` الفارغة تُعامل كأنها غير مضبوطة/مفتوحة.

تؤدي تغييرات التكوين التي تُجرى عبر `/plugins enable` أو `/plugins disable` إلى إعادة تحميل Plugin الخاصة بـ Gateway داخل العملية. تعيد دورات الوكيل الجديدة بناء قائمة أدواتها من سجل الـ Plugin المحدّث. أما العمليات التي تغيّر المصدر مثل التثبيت والتحديث وإلغاء التثبيت فما تزال تعيد تشغيل عملية Gateway لأن وحدات الـ Plugin المستوردة سابقًا لا يمكن استبدالها بأمان في مكانها.

`openclaw plugins list` هي لقطة محلية لسجل/تكوين الـ Plugin. وجود Plugin بحالة `enabled` هناك يعني أن السجل المحفوظ والتكوين الحالي يسمحان للـ Plugin بالمشاركة. لا يثبت ذلك أن Gateway بعيدة قيد التشغيل بالفعل قد أعادت التحميل أو أُعيد تشغيلها على كود الـ Plugin نفسه. في إعدادات VPS/الحاويات ذات عمليات الغلاف، أرسل أوامر إعادة التشغيل أو عمليات الكتابة التي تؤدي إلى إعادة التحميل إلى عملية `openclaw gateway run` الفعلية، أو استخدم `openclaw gateway restart` على Gateway قيد التشغيل عندما يبلّغ إعادة التحميل عن فشل.

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **معطّل**: الـ Plugin موجود لكن قواعد التفعيل أوقفته. يتم الحفاظ على التكوين.
  - **مفقود**: يشير التكوين إلى معرّف Plugin لم يعثر عليه الاكتشاف.
  - **غير صالح**: الـ Plugin موجود لكن تكوينه لا يطابق المخطط المعلن. يتجاوز بدء تشغيل Gateway ذلك الـ Plugin فقط؛ يمكن لـ `openclaw doctor --fix` عزل الإدخال غير الصالح بتعطيله وإزالة حمولة تكوينه.

</Accordion>

## الاكتشاف والأولوية

يفحص OpenClaw بحثًا عن Plugins بهذا الترتيب (أول تطابق يفوز):

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` - مسارات ملفات أو دلائل صريحة. يتم تجاهل المسارات التي تشير
    مرة أخرى إلى دلائل الـ Plugin المضمّنة والمعبأة الخاصة بـ OpenClaw؛
    شغّل `openclaw doctor --fix` لإزالة تلك الأسماء المستعارة القديمة.
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    تُشحن مع OpenClaw. كثير منها مفعّل افتراضيًا (مزودو النماذج، الكلام).
    ويتطلب بعضها الآخر تفعيلًا صريحًا.
  </Step>
</Steps>

تقوم التثبيتات المعبأة وصور Docker عادةً بحل Plugins المضمّنة من شجرة `dist/extensions` المترجمة. إذا تم ربط دليل مصدر Plugin مضمّن فوق مسار المصدر المعبأ المطابق، مثل `/app/extensions/synology-chat`، فإن OpenClaw يعامل ذلك الدليل المصدري المركّب كتراكب مصدر مضمّن ويكتشفه قبل حزمة `/app/dist/extensions/synology-chat` المعبأة. يحافظ هذا على عمل حلقات حاويات الصيانة دون إعادة كل Plugin مضمّن إلى مصدر TypeScript. اضبط `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` لفرض استخدام حزم dist المعبأة حتى عند وجود تركيبات تراكب المصدر.

### قواعد التفعيل

- `plugins.enabled: false` يعطّل جميع Plugins ويتجاوز عمل اكتشاف/تحميل الـ Plugin
- `plugins.deny` له الأولوية دائمًا على السماح
- `plugins.entries.\<id\>.enabled: false` يعطّل ذلك الـ Plugin
- Plugins ذات أصل مساحة العمل **معطّلة افتراضيًا** (يجب تفعيلها صراحةً)
- تتبع Plugins المضمّنة مجموعة التفعيل الافتراضية المدمجة ما لم يتم تجاوزها
- يمكن للخانات الحصرية فرض تفعيل الـ Plugin المحدد لتلك الخانة
- تُفعّل بعض Plugins المضمّنة الاختيارية تلقائيًا عندما يذكر التكوين سطحًا مملوكًا لـ Plugin، مثل مرجع نموذج مزود، أو تكوين قناة، أو وقت تشغيل حزمة اختبار
- يتم الحفاظ على تكوين Plugin القديم أثناء تفعيل `plugins.enabled: false`؛ أعد تفعيل Plugins قبل تشغيل تنظيف doctor إذا أردت إزالة المعرّفات القديمة
- تحافظ مسارات Codex من عائلة OpenAI على حدود Plugin منفصلة:
  `openai-codex/*` ينتمي إلى OpenAI Plugin، بينما يتم اختيار Plugin خادم تطبيق Codex المضمّن بواسطة `agentRuntime.id: "codex"` أو مراجع نموذج `codex/*` القديمة

## استكشاف أخطاء خطافات وقت التشغيل وإصلاحها

إذا ظهر Plugin في `plugins list` لكن الآثار الجانبية أو الخطافات الخاصة بـ `register(api)` لا تعمل في حركة دردشة حية، فتحقق مما يلي أولًا:

- شغّل `openclaw gateway status --deep --require-rpc` وتأكد من أن عنوان URL الخاص بـ Gateway النشط، والملف الشخصي، ومسار التكوين، والعملية هي نفسها التي تعدّلها.
- أعد تشغيل Gateway الحية بعد تغييرات تثبيت/تكوين/كود الـ Plugin. في حاويات الغلاف، قد يكون PID 1 مجرد مشرف؛ أعد تشغيل عملية `openclaw gateway run` الفرعية أو أرسل إليها إشارة.
- استخدم `openclaw plugins inspect <id> --runtime --json` لتأكيد تسجيلات الخطافات والتشخيصات. تحتاج خطافات المحادثة غير المضمّنة مثل `before_model_resolve` و`before_agent_reply` و`before_agent_run` و`llm_input` و`llm_output` و`before_agent_finalize` و`agent_end` إلى `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- لتبديل النموذج، فضّل `before_model_resolve`. يعمل قبل حل النموذج لدورات الوكيل؛ أما `llm_output` فلا يعمل إلا بعد أن تنتج محاولة نموذج مخرجات مساعد.
- لإثبات نموذج الجلسة الفعلي، استخدم `openclaw sessions` أو أسطح جلسة/حالة Gateway، وعند تصحيح حمولة مزود الخدمة، ابدأ Gateway باستخدام `--raw-stream --raw-stream-path <path>`.

### إعداد أداة Plugin البطيء

إذا بدت دورات الوكيل كأنها تتوقف أثناء تحضير الأدوات، ففعّل تسجيل التتبع وتحقق من أسطر توقيت مصنع أدوات الـ Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

ابحث عن:

```text
[trace:plugin-tools] factory timings ...
```

يعرض الملخص إجمالي وقت المصنع وأبطأ مصانع أدوات Plugin، بما في ذلك معرّف الـ Plugin، وأسماء الأدوات المعلنة، وشكل النتيجة، وما إذا كانت الأداة اختيارية. تُرقّى الأسطر البطيئة إلى تحذيرات عندما يستغرق مصنع واحد ثانية واحدة على الأقل أو يستغرق إعداد إجمالي مصانع أدوات Plugin خمس ثوانٍ على الأقل.

يخزّن OpenClaw نتائج مصانع أدوات Plugin الناجحة مؤقتًا للحلول المتكررة مع سياق الطلب الفعلي نفسه. يتضمن مفتاح التخزين المؤقت تكوين وقت التشغيل الفعلي، ومساحة العمل، ومعرّفات الوكيل/الجلسة، وسياسة sandbox، وإعدادات المتصفح، وسياق التسليم، وهوية الطالب، وحالة الملكية، لذلك تُعاد تشغيل المصانع التي تعتمد على تلك الحقول الموثوقة عندما يتغير السياق.

إذا كان Plugin واحد يهيمن على التوقيت، فافحص تسجيلاته في وقت التشغيل:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

ثم حدّث ذلك الـ Plugin أو أعد تثبيته أو عطّله. يجب على مؤلفي Plugins نقل تحميل الاعتماديات المكلف إلى ما وراء مسار تنفيذ الأداة بدلًا من فعله داخل مصنع الأداة.

### تكرار ملكية القناة أو الأداة

الأعراض:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

تعني هذه أن أكثر من Plugin مفعّل يحاول امتلاك القناة نفسها أو تدفق الإعداد نفسه أو اسم الأداة نفسه. السبب الأكثر شيوعًا هو تثبيت Plugin قناة خارجي بجانب Plugin مضمّن يوفر الآن معرّف القناة نفسه.

خطوات التصحيح:

- شغّل `openclaw plugins list --enabled --verbose` لرؤية كل Plugin مفعّل ومصدره.
- شغّل `openclaw plugins inspect <id> --runtime --json` لكل Plugin مشتبه به وقارن `channels` و`channelConfigs` و`tools` والتشخيصات.
- شغّل `openclaw plugins registry --refresh` بعد تثبيت حزم Plugin أو إزالتها حتى تعكس البيانات الوصفية المحفوظة التثبيت الحالي.
- أعد تشغيل Gateway بعد تغييرات التثبيت أو السجل أو التكوين.

خيارات الإصلاح:

- إذا كان Plugin يستبدل آخر عمدًا لمعرّف القناة نفسه، فيجب أن يعلن الـ Plugin المفضل `channelConfigs.<channel-id>.preferOver` مع معرّف الـ Plugin الأقل أولوية. راجع [/plugins/manifest#replacing-another-channel-plugin](/ar/plugins/manifest#replacing-another-channel-plugin).
- إذا كان التكرار غير مقصود، فعطّل أحد الطرفين باستخدام `plugins.entries.<plugin-id>.enabled: false` أو أزل تثبيت الـ Plugin القديم.
- إذا فعّلت كلا الـ Plugins صراحةً، فإن OpenClaw يحافظ على ذلك الطلب ويبلّغ عن التعارض. اختر مالكًا واحدًا للقناة أو أعد تسمية الأدوات المملوكة لـ Plugin لكي يكون سطح وقت التشغيل غير ملتبس.

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

تأتي Plugins المضمّنة مع OpenClaw. يُفعَّل الكثير منها افتراضيًا (مثل
موفّري النماذج المضمّنين، وموفّري الكلام المضمّنين، وPlugin المتصفح
المضمّن). لا تزال Plugins المضمّنة الأخرى تحتاج إلى `openclaw plugins enable <id>`.

يستبدل `--force` أي Plugin مثبّتة موجودة أو حزمة خطافات في مكانها. استخدم
`openclaw plugins update <id-or-npm-spec>` للترقيات الروتينية لـ Plugins npm
المتعقَّبة. وهو غير مدعوم مع `--link`، الذي يعيد استخدام مسار المصدر بدلًا
من النسخ فوق هدف تثبيت مُدار.

عندما تكون `plugins.allow` مضبوطة بالفعل، يضيف `openclaw plugins install`
معرّف Plugin المثبّتة إلى قائمة السماح تلك قبل تفعيلها. إذا كان معرّف Plugin
نفسه موجودًا في `plugins.deny`، فإن التثبيت يزيل إدخال الرفض القديم هذا بحيث
يصبح التثبيت الصريح قابلًا للتحميل فورًا بعد إعادة التشغيل.

يحتفظ OpenClaw بسجل Plugin محلي دائم بوصفه نموذج القراءة الباردة لمخزون
Plugin، وملكية المساهمات، وتخطيط بدء التشغيل. تقوم مسارات التثبيت، والتحديث،
وإلغاء التثبيت، والتفعيل، والتعطيل بتحديث ذلك السجل بعد تغيير حالة Plugin.
ويحتفظ ملف `plugins/installs.json` نفسه ببيانات تعريف التثبيت الدائمة في
`installRecords` على المستوى الأعلى، وبيانات تعريف البيان القابلة لإعادة
البناء في `plugins`. إذا كان السجل مفقودًا أو قديمًا أو غير صالح، فإن
`openclaw plugins registry --refresh` يعيد بناء عرض البيان الخاص به من سجلات
التثبيت، وسياسة الإعدادات، وبيانات تعريف البيان/الحزمة دون تحميل وحدات تشغيل
Plugin.

في وضع Nix (`OPENCLAW_NIX_MODE=1`)، تُعطَّل أدوات تغيير دورة حياة Plugin.
أدِر اختيار حزم Plugin والإعدادات عبر مصدر Nix الخاص بالتثبيت بدلًا من ذلك؛
بالنسبة إلى nix-openclaw، ابدأ بـ
[البداية السريعة](https://github.com/openclaw/nix-openclaw#quick-start)
المتمحورة حول الوكيل. ينطبق `openclaw plugins update <id-or-npm-spec>` على
عمليات التثبيت المتعقَّبة. يؤدي تمرير مواصفة حزمة npm مع وسم توزيع أو إصدار
دقيق إلى إرجاع اسم الحزمة إلى سجل Plugin المتعقَّب وتسجيل المواصفة الجديدة
للتحديثات المستقبلية. يؤدي تمرير اسم الحزمة دون إصدار إلى نقل تثبيت مثبّت
دقيقًا إلى خط الإصدار الافتراضي في السجل. إذا كانت Plugin npm المثبّتة تطابق
بالفعل الإصدار المحلول وهوية الأثر المسجلة، يتجاوز OpenClaw التحديث دون
تنزيل أو إعادة تثبيت أو إعادة كتابة الإعدادات.
عند تشغيل `openclaw update` على قناة بيتا، تحاول سجلات Plugin الافتراضية من
npm وClawHub استخدام `@beta` أولًا ثم تعود إلى الافتراضي/الأحدث عندما لا
يوجد إصدار بيتا من Plugin. تبقى الإصدارات الدقيقة والوسوم الصريحة مثبتة.

لا يوفّر OpenClaw بعد قنوات Plugin للدعم طويل الأمد أو الدعم الشهري. سيحتاج
عمل خط الدعم الشهري المخطط له إلى أن تتبع وسوم Plugin في npm وClawHub خط
الدعم نفسه مثل الحزمة الأساسية بدلًا من استخدام `latest` بصمت.

`--pin` مخصص لـ npm فقط. وهو غير مدعوم مع `--marketplace`، لأن عمليات تثبيت
السوق تحفظ بيانات تعريف مصدر السوق بدلًا من مواصفة npm.

`--dangerously-force-unsafe-install` هو تجاوز طارئ للإيجابيات الخاطئة من
ماسح الشفرة الخطرة المدمج. يسمح لمثبتات Plugin وتحديثات Plugin بالاستمرار
بعد نتائج `critical` المدمجة، لكنه لا يزال لا يتجاوز حظر سياسة
`before_install` الخاصة بـ Plugin أو الحظر الناتج عن فشل الفحص. تتجاهل فحوص
التثبيت ملفات وأدلة الاختبار الشائعة مثل `tests/`، و`__tests__/`، و`*.test.*`،
و`*.spec.*` لتجنب حظر نماذج الاختبار المعبأة؛ تظل نقاط دخول تشغيل Plugin
المعلنة مفحوصة حتى إذا استخدمت أحد هذه الأسماء.

ينطبق علم CLI هذا على مسارات تثبيت/تحديث Plugin فقط. تستخدم عمليات تثبيت
اعتماديات Skills المدعومة من Gateway تجاوز الطلب المطابق
`dangerouslyForceUnsafeInstall` بدلًا من ذلك، بينما يظل `openclaw skills install`
مسار تنزيل/تثبيت Skills منفصلًا من ClawHub.

إذا كانت Plugin نشرتها على ClawHub مخفية أو محظورة بفحص، فافتح لوحة تحكم
ClawHub أو شغّل `clawhub package rescan <name>` لتطلب من ClawHub فحصها مرة
أخرى. يؤثر `--dangerously-force-unsafe-install` فقط في عمليات التثبيت على
جهازك؛ ولا يطلب من ClawHub إعادة فحص Plugin أو جعل إصدار محظور عامًا.

تشارك الحزم المتوافقة في مسار قائمة/فحص/تفعيل/تعطيل Plugin نفسه. يتضمن دعم
التشغيل الحالي Skills الحزم، وSkills أوامر Claude، وافتراضيات `settings.json`
في Claude، وافتراضيات `.lsp.json` في Claude و`lspServers` المعلنة في البيان،
وSkills أوامر Cursor، وأدلة خطافات Codex المتوافقة.

يعرض `openclaw plugins inspect <id>` أيضًا قدرات الحزمة المكتشفة بالإضافة إلى
إدخالات خوادم MCP وLSP المدعومة أو غير المدعومة لـ Plugins المدعومة بالحزم.

يمكن أن تكون مصادر السوق اسم سوق معروفًا في Claude من
`~/.claude/plugins/known_marketplaces.json`، أو جذر سوق محليًا أو مسار
`marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع
GitHub، أو عنوان URL لـ git. بالنسبة إلى الأسواق البعيدة، يجب أن تبقى إدخالات
Plugin داخل مستودع السوق المستنسخ وأن تستخدم مصادر مسارات نسبية فقط.

راجع [مرجع CLI لـ `openclaw plugins`](/ar/cli/plugins) للتفاصيل الكاملة.

## نظرة عامة على Plugin API

تصدّر Plugins الأصلية كائن دخول يعرّض `register(api)`. قد تظل Plugins الأقدم
تستخدم `activate(api)` كاسم مستعار قديم، لكن ينبغي لـ Plugins الجديدة استخدام
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

يحمّل OpenClaw كائن الدخول ويستدعي `register(api)` أثناء تفعيل Plugin. لا
يزال المحمّل يعود إلى `activate(api)` من أجل Plugins الأقدم، لكن ينبغي
لـ Plugins المضمّنة وPlugins الخارجية الجديدة التعامل مع `register` بوصفه
العقد العام.

تخبر `api.registrationMode` الـ Plugin بسبب تحميل نقطة دخولها:

| الوضع | المعنى |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | تفعيل وقت التشغيل. سجّل الأدوات، والخطافات، والخدمات، والأوامر، والمسارات، والآثار الجانبية الحية الأخرى. |
| `discovery` | اكتشاف قدرات للقراءة فقط. سجّل الموفّرين وبيانات التعريف؛ قد تُحمَّل شفرة دخول Plugin موثوقة، لكن تخطَّ الآثار الجانبية الحية. |
| `setup-only` | تحميل بيانات تعريف إعداد القناة من خلال نقطة دخول إعداد خفيفة. |
| `setup-runtime` | تحميل إعداد القناة الذي يحتاج أيضًا إلى نقطة دخول وقت التشغيل. |
| `cli-metadata` | جمع بيانات تعريف أوامر CLI فقط. |

ينبغي لنقاط دخول Plugin التي تفتح مقابس أو قواعد بيانات أو عمالًا في الخلفية
أو عملاء طويلي العمر أن تحمي تلك الآثار الجانبية باستخدام
`api.registrationMode === "full"`. تُخزَّن تحميلات الاكتشاف مؤقتًا بشكل منفصل
عن تحميلات التفعيل ولا تستبدل سجل Gateway الجاري. الاكتشاف لا يفعّل، لكنه
ليس بلا استيراد: قد يقيّم OpenClaw نقطة دخول Plugin الموثوقة أو وحدة Plugin
القناة لبناء اللقطة. أبقِ المستويات العليا للوحدات خفيفة وخالية من الآثار
الجانبية، وانقل عملاء الشبكة، والعمليات الفرعية، والمستمعين، وقراءات
بيانات الاعتماد، وبدء تشغيل الخدمات خلف مسارات التشغيل الكامل.

طرق التسجيل الشائعة:

| الطريقة | ما تسجّله |
| --------------------------------------- | --------------------------- |
| `registerProvider` | موفّر نماذج (LLM) |
| `registerChannel` | قناة دردشة |
| `registerTool` | أداة وكيل |
| `registerHook` / `on(...)` | خطافات دورة الحياة |
| `registerSpeechProvider` | تحويل النص إلى كلام / STT |
| `registerRealtimeTranscriptionProvider` | STT متدفق |
| `registerRealtimeVoiceProvider` | صوت فوري مزدوج الاتجاه |
| `registerMediaUnderstandingProvider` | تحليل الصور/الصوت |
| `registerImageGenerationProvider` | توليد الصور |
| `registerMusicGenerationProvider` | توليد الموسيقى |
| `registerVideoGenerationProvider` | توليد الفيديو |
| `registerWebFetchProvider` | موفّر جلب الويب / الكشط |
| `registerWebSearchProvider` | بحث الويب |
| `registerHttpRoute` | نقطة نهاية HTTP |
| `registerCommand` / `registerCli` | أوامر CLI |
| `registerContextEngine` | محرك السياق |
| `registerService` | خدمة في الخلفية |

سلوك حارس الخطافات لخطافات دورة الحياة typed:

- `before_tool_call`: يكون `{ block: true }` نهائيًا؛ تُتخطّى المعالجات الأقل أولوية.
- `before_tool_call`: يكون `{ block: false }` بلا أثر ولا يمحو حظرًا سابقًا.
- `before_install`: يكون `{ block: true }` نهائيًا؛ تُتخطّى المعالجات الأقل أولوية.
- `before_install`: يكون `{ block: false }` بلا أثر ولا يمحو حظرًا سابقًا.
- `message_sending`: يكون `{ cancel: true }` نهائيًا؛ تُتخطّى المعالجات الأقل أولوية.
- `message_sending`: يكون `{ cancel: false }` بلا أثر ولا يمحو إلغاءً سابقًا.

تشغّل عمليات app-server الأصلية في Codex جسرًا يعيد أحداث الأدوات الأصلية في Codex إلى سطح hook هذا. يمكن لـ Plugins حظر أدوات Codex الأصلية عبر `before_tool_call`، ومراقبة النتائج عبر `after_tool_call`، والمشاركة في موافقات `PermissionRequest` في Codex. لا يعيد الجسر كتابة معاملات أدوات Codex الأصلية بعد. توجد حدود دعم وقت تشغيل Codex الدقيقة في
[عقد دعم حاضنة Codex v1](/ar/plugins/codex-harness#v1-support-contract).

للاطلاع على سلوك hook المكتوب بالكامل، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#hook-decision-semantics).

## ذات صلة

- [بناء plugins](/ar/plugins/building-plugins) - أنشئ Plugin الخاص بك
- [حزم Plugin](/ar/plugins/bundles) - توافق حزم Codex/Claude/Cursor
- [بيان Plugin](/ar/plugins/manifest) - مخطط البيان
- [تسجيل الأدوات](/ar/plugins/building-plugins#registering-agent-tools) - أضف أدوات agent في Plugin
- [داخليات Plugin](/ar/plugins/architecture) - نموذج الإمكانات وخط تحميلها
- [plugins المجتمع](/ar/plugins/community) - قوائم الأطراف الخارجية
