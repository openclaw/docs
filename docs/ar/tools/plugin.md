---
read_when:
    - تثبيت Plugins أو تكوينها
    - فهم قواعد اكتشاف Plugin وتحميله
    - العمل مع حزم Plugin المتوافقة مع Codex/Claude
sidebarTitle: Install and Configure
summary: ثبّت Plugins الخاصة بـ OpenClaw وتهيئتها وإدارتها
title: Plugins
x-i18n:
    generated_at: "2026-05-06T09:04:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d68ad3cbd040d3f973d219cf273a792f11df382f6c4ccbf80c07acb0d26c658
    source_path: tools/plugin.md
    workflow: 16
---

توسّع Plugins إمكانات OpenClaw بإضافة قدرات جديدة: القنوات، ومزوّدو النماذج،
وأطر تشغيل الوكلاء، والأدوات، وSkills، والكلام، والنسخ الفوري، والصوت الفوري،
وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب، والبحث في الويب،
وغير ذلك. بعض Plugins **أساسية** (تُشحن مع OpenClaw)، وأخرى **خارجية**.
تُنشر معظم Plugins الخارجية وتُكتشف عبر
[ClawHub](/ar/tools/clawhub). يظل npm مدعومًا للتثبيت المباشر ولمجموعة مؤقتة من
حزم Plugins المملوكة لـ OpenClaw إلى أن يكتمل هذا الانتقال.

## البدء السريع

لأمثلة التثبيت والنسخ واللصق، والقوائم، وإلغاء التثبيت، والتحديث، والنشر، راجع
[إدارة Plugins](/ar/plugins/manage-plugins).

<Steps>
  <Step title="راجع ما تم تحميله">
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

  <Step title="إدارة مدمجة في المحادثة">
    في Gateway قيد التشغيل، تؤدي أوامر المالك فقط `/plugins enable` و`/plugins disable`
    إلى تشغيل معيد تحميل إعدادات Gateway. يعيد Gateway تحميل أسطح تشغيل Plugin
    داخل العملية، وتعيد أدوار الوكيل الجديدة بناء قائمة أدواتها من السجل
    المحدّث. يغيّر `/plugins install` الشيفرة المصدرية لـ Plugin، لذلك يطلب
    Gateway إعادة التشغيل بدلًا من الادعاء بأن العملية الحالية يمكنها إعادة
    تحميل الوحدات التي سبق استيرادها بأمان.

  </Step>

  <Step title="تحقق من Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    استخدم `--runtime` عندما تحتاج إلى إثبات الأدوات أو الخدمات أو أساليب Gateway
    أو الخطافات أو أوامر CLI المملوكة لـ Plugin والمسجلة. أما `inspect` العادي
    فهو فحص بارد للبيان/السجل، ويتجنب عمدًا استيراد وقت تشغيل Plugin.

  </Step>
</Steps>

إذا كنت تفضّل التحكم المدمج في المحادثة، فعّل `commands.plugins: true` واستخدم:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

يستخدم مسار التثبيت محلل المصادر نفسه الذي يستخدمه CLI: مسار/أرشيف محلي،
أو `clawhub:<pkg>` صريح، أو `npm:<pkg>` صريح، أو `npm-pack:<path.tgz>` صريح،
أو `git:<repo>` صريح، أو مواصفة حزمة مجردة عبر npm.

إذا كانت الإعدادات غير صالحة، يفشل التثبيت عادةً بإغلاق آمن ويوجّهك إلى
`openclaw doctor --fix`. استثناء الاسترداد الوحيد هو مسار ضيق لإعادة تثبيت
Plugin مضمّن لـ Plugins التي تختار استخدام
`openclaw.install.allowInvalidConfigRecovery`.
أثناء بدء تشغيل Gateway، تفشل إعدادات Plugin غير الصالحة بإغلاق آمن مثل أي
إعدادات أخرى غير صالحة. شغّل `openclaw doctor --fix` لعزل إعدادات Plugin السيئة
عبر تعطيل إدخال ذلك Plugin وإزالة حمولة إعداداته غير الصالحة؛ وتحتفظ نسخة
الإعدادات الاحتياطية العادية بالقيم السابقة.
عندما تشير إعدادات قناة إلى Plugin لم يعد قابلًا للاكتشاف، لكن معرف Plugin
القديم نفسه لا يزال موجودًا في إعدادات Plugin أو سجلات التثبيت، يسجل بدء تشغيل
Gateway تحذيرات ويتجاوز تلك القناة بدلًا من حظر كل قناة أخرى. شغّل
`openclaw doctor --fix` لإزالة إدخالات القناة/Plugin القديمة؛ أما مفاتيح القنوات
غير المعروفة من دون دليل على Plugin قديم فتظل تفشل في التحقق لكي تبقى الأخطاء
الإملائية مرئية.
إذا تم ضبط `plugins.enabled: false`، تُعامل مراجع Plugin القديمة كأنها خاملة:
يتجاوز بدء تشغيل Gateway عمل اكتشاف/تحميل Plugin، ويحافظ `openclaw doctor` على
إعدادات Plugin المعطّلة بدلًا من إزالتها تلقائيًا. أعد تفعيل Plugins قبل تشغيل
تنظيف doctor إذا أردت إزالة معرفات Plugin القديمة.

لا يحدث تثبيت تبعيات Plugin إلا أثناء تدفقات التثبيت/التحديث الصريحة أو إصلاحات
doctor. لا يشغّل بدء تشغيل Gateway، أو إعادة تحميل الإعدادات، أو فحص وقت التشغيل
مديري الحزم ولا يصلح أشجار التبعيات. يجب أن تكون تبعيات Plugins المحلية مثبتة
مسبقًا، بينما تُثبت Plugins القادمة من npm وgit وClawHub ضمن جذور Plugins
المدارة من OpenClaw. قد تُرفع تبعيات npm داخل جذر npm المدار من OpenClaw؛ ويفحص
التثبيت/التحديث ذلك الجذر المدار قبل الثقة، وتزيل عملية إلغاء التثبيت الحزم
المدارة عبر npm من خلال npm. يجب مع ذلك تثبيت Plugins الخارجية ومسارات التحميل
المخصصة عبر `openclaw plugins install`. استخدم `openclaw plugins list --json`
لرؤية `dependencyStatus` الثابت لكل Plugin ظاهر من دون استيراد شيفرة وقت التشغيل
أو إصلاح التبعيات. راجع [حل تبعيات Plugin](/ar/plugins/dependency-resolution)
لدورة الحياة وقت التثبيت.

### ملكية مسار Plugin المحظور

إذا قالت تشخيصات Plugin
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
وتبع ذلك التحقق من الإعدادات برسالة `plugin present but blocked`، فهذا يعني أن
OpenClaw وجد ملفات Plugin مملوكة لمستخدم Unix مختلف عن العملية التي تحمّلها.
أبقِ إعدادات Plugin في مكانها؛ أصلح ملكية نظام الملفات أو شغّل OpenClaw
بالمستخدم نفسه الذي يملك دليل الحالة.

بالنسبة لتثبيتات Docker، تعمل الصورة الرسمية باسم `node` (uid `1000`)، لذلك
ينبغي عادةً أن تكون أدلة إعدادات OpenClaw ومساحات العمل المرتبطة من المضيف
مملوكة لـ uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

إذا كنت تشغّل OpenClaw عمدًا بصلاحيات root، فأصلح جذر Plugin المدار ليكون
مملوكًا لـ root بدلًا من ذلك:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

بعد إصلاح الملكية، أعد تشغيل `openclaw doctor --fix` أو
`openclaw plugins registry --refresh` لكي يطابق سجل Plugin المحفوظ الملفات
التي تم إصلاحها.

بالنسبة لتثبيتات npm، تُحل المحددات القابلة للتغيير مثل `latest` أو dist-tag
قبل التثبيت ثم تُثبّت على الإصدار الدقيق المتحقق منه في جذر npm المدار من
OpenClaw. بعد انتهاء npm، يتحقق OpenClaw من أن إدخال `package-lock.json` المثبت
لا يزال يطابق الإصدار المحلول والسلامة. إذا كتب npm بيانات تعريف حزمة مختلفة،
يفشل التثبيت ويُعاد التراجع عن الحزمة المدارة بدلًا من قبول أثر Plugin مختلف.

عمليات سحب المصدر هي مساحات عمل pnpm. إذا نسخت OpenClaw لتعديل Plugins المضمّنة،
شغّل `pnpm install`؛ بعدها يحمّل OpenClaw Plugins المضمّنة من `extensions/<id>`
لكي تُستخدم التعديلات والتبعيات المحلية للحزمة مباشرة. تثبيتات جذر npm العادية
مخصصة لـ OpenClaw المعبأ، وليس لتطوير نسخ المصدر.

## أنواع Plugin

يتعرّف OpenClaw على تنسيقين لـ Plugin:

| التنسيق   | طريقة العمل                                                       | أمثلة                                                 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **أصلي** | `openclaw.plugin.json` + وحدة وقت تشغيل؛ ينفذ داخل العملية       | Plugins رسمية، وحزم npm من المجتمع               |
| **حزمة** | تخطيط متوافق مع Codex/Claude/Cursor؛ يُطابق بميزات OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

يظهر كلاهما ضمن `openclaw plugins list`. راجع [حزم Plugin](/ar/plugins/bundles) لمعرفة تفاصيل الحزم.

إذا كنت تكتب Plugin أصليًا، فابدأ بـ [بناء Plugins](/ar/plugins/building-plugins)
و[نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

## نقاط دخول الحزم

يجب أن تعلن حزم npm الأصلية لـ Plugin عن `openclaw.extensions` في `package.json`.
يجب أن يبقى كل إدخال داخل دليل الحزمة وأن يُحل إلى ملف وقت تشغيل قابل للقراءة،
أو إلى ملف مصدر TypeScript له نظير JavaScript مبني مستنتج مثل `src/index.ts`
إلى `dist/index.js`.
يجب أن تشحن التثبيتات المعبأة مخرجات وقت تشغيل JavaScript تلك. أما الرجوع إلى
مصدر TypeScript فهو لنسخ المصدر ومسارات التطوير المحلية، وليس لحزم npm المثبتة
في جذر Plugin المدار من OpenClaw.

إذا قال تحذير حزمة مدارة إنها `requires compiled runtime output for
TypeScript entry ...`، فهذا يعني أن الحزمة نُشرت من دون ملفات JavaScript التي
يحتاجها OpenClaw وقت التشغيل. هذه مشكلة تغليف Plugin، وليست مشكلة إعدادات
محلية. حدّث Plugin أو أعد تثبيته بعد أن يعيد الناشر نشر JavaScript المترجم، أو
عطّل/أزل ذلك Plugin إلى أن تتوفر حزمة مُصلحة.

استخدم `openclaw.runtimeExtensions` عندما لا تكون ملفات وقت التشغيل المنشورة في
المسارات نفسها لإدخالات المصدر. عند وجود `runtimeExtensions`، يجب أن تحتوي على
إدخال واحد بالضبط لكل إدخال في `extensions`. تفشل القوائم غير المتطابقة في
التثبيت واكتشاف Plugin بدلًا من الرجوع بصمت إلى مسارات المصدر. إذا كنت تنشر
أيضًا `openclaw.setupEntry`، فاستخدم `openclaw.runtimeSetupEntry` لنظيره المبني
من JavaScript؛ ويكون ذلك الملف مطلوبًا عند التصريح به.

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
الحالية بالفعل العديد من Plugins الرسمية، لذلك لا تحتاج هذه إلى تثبيتات npm
منفصلة في الإعدادات العادية. إلى أن تنتقل كل Plugins المملوكة لـ OpenClaw إلى
ClawHub، يظل OpenClaw يشحن بعض حزم Plugin بنمط `@openclaw/*` على npm
للتثبيتات الأقدم/المخصصة وتدفقات عمل npm المباشرة.

إذا أبلغ npm أن حزمة Plugin بنمط `@openclaw/*` مهملة، فهذا الإصدار من الحزمة
ينتمي إلى قطار حزم خارجي أقدم. استخدم Plugin المضمّن من OpenClaw الحالي أو نسخة
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
    - `memory-core` - بحث ذاكرة مضمّن (افتراضي عبر `plugins.slots.memory`)
    - `memory-lancedb` - ذاكرة طويلة الأمد مدعومة بـ LanceDB مع استدعاء/التقاط تلقائي (اضبط `plugins.slots.memory = "memory-lancedb"`)

    راجع [Memory LanceDB](/ar/plugins/memory-lancedb) لإعداد التضمينات المتوافقة مع OpenAI،
    وأمثلة Ollama، وحدود الاستدعاء، واستكشاف المشكلات وإصلاحها.

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` - Plugin المتصفح المضمّن لأداة المتصفح، وCLI `openclaw browser`، وطريقة Gateway `browser.request`، ووقت تشغيل المتصفح، وخدمة التحكم الافتراضية في المتصفح (ممكّن افتراضياً؛ عطّله قبل استبداله)
    - `copilot-proxy` - جسر VS Code Copilot Proxy (معطّل افتراضياً)

  </Accordion>
</AccordionGroup>

هل تبحث عن Plugins من جهات خارجية؟ راجع [Community Plugins](/ar/plugins/community).

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
| `allow`            | قائمة سماح Plugin (اختياري)                               |
| `bundledDiscovery` | وضع اكتشاف Plugin المضمّنة (`allowlist` افتراضياً)    |
| `deny`             | قائمة حظر Plugin (اختياري؛ الحظر له الأسبقية)                     |
| `load.paths`       | ملفات/أدلة Plugin إضافية                            |
| `slots`            | محددات الخانات الحصرية (مثل `memory` و`contextEngine`) |
| `entries.\<id\>`   | مفاتيح تفعيل + تكوين لكل Plugin                               |

`plugins.allow` حصري. عندما لا يكون فارغاً، لا يمكن تحميل إلا Plugins المدرجة
أو عرض أدواتها، حتى إذا كان `tools.allow` يحتوي على `"*"` أو اسم أداة محدد
يملكها Plugin. إذا كانت قائمة سماح الأدوات تشير إلى أدوات Plugin، فأضف معرّفات
Plugins المالكة إلى `plugins.allow` أو أزل `plugins.allow`؛ يحذّر `openclaw doctor` من
هذا الشكل.

القيمة الافتراضية لـ `plugins.bundledDiscovery` هي `"allowlist"` للتكوينات الجديدة، لذلك فإن
مخزون `plugins.allow` المقيّد يحظر أيضاً Plugins مزوّدي الخدمة المضمّنة غير المذكورة،
بما في ذلك اكتشاف مزوّد البحث على الويب في وقت التشغيل. يضع Doctor علامة `"compat"` على
تكوينات قائمة السماح المقيّدة الأقدم أثناء الترحيل حتى تحافظ الترقيات على
سلوك مزوّدي الخدمة المضمّنين القديم إلى أن يختار المشغّل الوضع الأكثر صرامة.
لا يزال `plugins.allow` الفارغ يعامَل كأنه غير مضبوط/مفتوح.

تؤدي تغييرات التكوين التي تتم عبر `/plugins enable` أو `/plugins disable` إلى إعادة تحميل
Plugin في Gateway داخل العملية. تعيد جولات الوكيل الجديدة بناء قائمة أدواتها من
سجل Plugins المحدّث. لا تزال العمليات التي تغيّر المصدر، مثل التثبيت
والتحديث وإلغاء التثبيت، تعيد تشغيل عملية Gateway لأن وحدات Plugin التي تم استيرادها مسبقاً
لا يمكن استبدالها بأمان في مكانها.

`openclaw plugins list` هو لقطة محلية لسجل/تكوين Plugin. يعني وجود Plugin بحالة
`enabled` هناك أن السجل الدائم والتكوين الحالي يسمحان للـ Plugin بالمشاركة.
لا يثبت ذلك أن Gateway بعيد قيد التشغيل بالفعل أعاد التحميل أو أُعيد تشغيله على
نفس كود Plugin. في إعدادات VPS/الحاويات ذات عمليات التغليف، أرسل عمليات إعادة التشغيل
أو عمليات الكتابة التي تشغّل إعادة التحميل إلى عملية `openclaw gateway run` الفعلية،
أو استخدم `openclaw gateway restart` ضد Gateway قيد التشغيل عندما يبلّغ التحميل عن فشل.

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **معطّل**: يوجد Plugin لكن قواعد التفعيل أوقفته. يُحافَظ على التكوين.
  - **مفقود**: يشير التكوين إلى معرّف Plugin لم يجده الاكتشاف.
  - **غير صالح**: يوجد Plugin لكن تكوينه لا يطابق المخطط المعلن. يتخطى بدء تشغيل Gateway هذا الـ Plugin فقط؛ يستطيع `openclaw doctor --fix` عزل الإدخال غير الصالح عبر تعطيله وإزالة حمولة تكوينه.

</Accordion>

## الاكتشاف والأسبقية

يفحص OpenClaw بحثاً عن Plugins بهذا الترتيب (أول تطابق هو الفائز):

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` - مسارات ملفات أو أدلة صريحة. يتم تجاهل المسارات التي تشير
    مرة أخرى إلى أدلة Plugins المضمّنة والمعبأة الخاصة بـ OpenClaw؛
    شغّل `openclaw doctor --fix` لإزالة تلك الأسماء المستعارة القديمة.
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    تُشحن مع OpenClaw. كثير منها ممكّن افتراضياً (مزوّدو النماذج، الكلام).
    ويتطلب غيرها تفعيلاً صريحاً.
  </Step>
</Steps>

عادةً ما تحل التثبيتات المعبأة وصور Docker Plugins المضمّنة من شجرة
`dist/extensions` المترجمة. إذا كان دليل مصدر Plugin مضمّن مربوطاً فوق مسار
المصدر المعبأ المطابق، على سبيل المثال `/app/extensions/synology-chat`،
يعامل OpenClaw دليل المصدر المركّب هذا كتراكب مصدر مضمّن ويكتشفه قبل حزمة
`/app/dist/extensions/synology-chat` المعبأة. هذا يحافظ على عمل حلقات حاويات
المشرفين بدون إعادة كل Plugin مضمّن إلى مصدر TypeScript. اضبط
`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` لفرض حزم dist المعبأة حتى عند وجود
تركيبات تراكب المصدر.

### قواعد التفعيل

- `plugins.enabled: false` يعطّل كل Plugins ويتخطى أعمال اكتشاف/تحميل Plugin
- `plugins.deny` له الأسبقية دائماً على السماح
- `plugins.entries.\<id\>.enabled: false` يعطّل ذلك الـ Plugin
- Plugins ذات منشأ مساحة العمل **معطّلة افتراضياً** (يجب تمكينها صراحة)
- تتبع Plugins المضمّنة مجموعة التشغيل الافتراضية المدمجة ما لم يتم تجاوزها
- يمكن للخانات الحصرية فرض تمكين Plugin المحدد لتلك الخانة
- تُفعّل بعض Plugins المضمّنة الاختيارية تلقائياً عندما يسمّي التكوين
  سطحاً مملوكاً لـ Plugin، مثل مرجع نموذج مزوّد، أو تكوين قناة، أو وقت تشغيل
  حزمة اختبار
- يُحافَظ على تكوين Plugin القديم بينما يكون `plugins.enabled: false` نشطاً؛
  أعد تمكين Plugins قبل تشغيل تنظيف Doctor إذا كنت تريد إزالة المعرّفات القديمة
- تحافظ مسارات Codex من عائلة OpenAI على حدود Plugin منفصلة:
  ينتمي `openai-codex/*` إلى OpenAI Plugin، بينما يتم تحديد Plugin خادم تطبيق
  Codex المضمّن عبر `agentRuntime.id: "codex"` أو مراجع نماذج
  `codex/*` القديمة

## استكشاف خطاطيف وقت التشغيل وإصلاحها

إذا ظهر Plugin في `plugins list` لكن آثار `register(api)` الجانبية أو الخطاطيف
لا تعمل في حركة المحادثة الحية، فتحقق من هذه أولاً:

- شغّل `openclaw gateway status --deep --require-rpc` وتأكد من أن عنوان URL النشط
  لـ Gateway، والملف الشخصي، ومسار التكوين، والعملية هي التي تعدّلها.
- أعد تشغيل Gateway الحي بعد تغييرات تثبيت/تكوين/كود Plugin. في الحاويات
  المغلّفة، قد يكون PID 1 مشرفاً فقط؛ أعد تشغيل أو أرسل إشارة إلى عملية
  `openclaw gateway run` الابنة.
- استخدم `openclaw plugins inspect <id> --runtime --json` لتأكيد تسجيلات الخطاطيف و
  التشخيصات. تحتاج خطاطيف المحادثة غير المضمّنة مثل `llm_input`،
  و`llm_output`، و`before_agent_finalize`، و`agent_end` إلى
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- لتبديل النماذج، فضّل `before_model_resolve`. يعمل قبل حل النموذج
  لجولات الوكيل؛ يعمل `llm_output` فقط بعد أن تنتج محاولة نموذج
  مخرجات المساعد.
- لإثبات نموذج الجلسة الفعّال، استخدم `openclaw sessions` أو أسطح
  جلسة/حالة Gateway، وعند تصحيح حمولات المزوّد، ابدأ
  Gateway مع `--raw-stream --raw-stream-path <path>`.

### إعداد أداة Plugin البطيء

إذا بدت جولات الوكيل متوقفة أثناء تحضير الأدوات، فمكّن تسجيل التتبع وتحقق
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
بما في ذلك معرّف Plugin، وأسماء الأدوات المعلنة، وشكل النتيجة، وما إذا كانت الأداة
اختيارية. تُرقّى الأسطر البطيئة إلى تحذيرات عندما يستغرق مصنع واحد
ثانية واحدة على الأقل أو يستغرق إجمالي تحضير مصنع أدوات Plugin خمس ثوانٍ على الأقل.

يخزّن OpenClaw نتائج مصنع أدوات Plugin الناجحة مؤقتاً لعمليات الحل المتكررة
مع نفس سياق الطلب الفعّال. يتضمن مفتاح ذاكرة التخزين المؤقت تكوين
وقت التشغيل الفعّال، ومساحة العمل، ومعرّفات الوكيل/الجلسة، وسياسة العزل،
وإعدادات المتصفح، وسياق التسليم، وهوية الطالب، وحالة الملكية، لذلك تُعاد
تشغيل المصانع التي تعتمد على تلك الحقول الموثوقة عندما يتغير السياق.

إذا كان Plugin واحد يهيمن على التوقيت، فافحص تسجيلاته في وقت التشغيل:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

ثم حدّث ذلك الـ Plugin أو أعد تثبيته أو عطّله. ينبغي لمؤلفي Plugin نقل
تحميل التبعيات المكلف إلى خلف مسار تنفيذ الأداة بدلاً من القيام به
داخل مصنع الأداة.

### تكرار ملكية القناة أو الأداة

الأعراض:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

تعني هذه أن أكثر من Plugin ممكّن يحاول امتلاك نفس القناة،
أو تدفق الإعداد، أو اسم الأداة. السبب الأكثر شيوعاً هو تثبيت Plugin قناة خارجي
بجانب Plugin مضمّن يوفر الآن نفس معرّف القناة.

خطوات التصحيح:

- شغّل `openclaw plugins list --enabled --verbose` لرؤية كل Plugin ممكّن
  ومنشئه.
- شغّل `openclaw plugins inspect <id> --runtime --json` لكل Plugin مشتبه به و
  قارن `channels`، و`channelConfigs`، و`tools`، والتشخيصات.
- شغّل `openclaw plugins registry --refresh` بعد تثبيت حزم Plugin أو إزالتها
  حتى تعكس البيانات الوصفية الدائمة التثبيت الحالي.
- أعد تشغيل Gateway بعد تغييرات التثبيت أو السجل أو التكوين.

خيارات الإصلاح:

- إذا كان Plugin واحد يستبدل آخر عمداً لنفس معرّف القناة، فينبغي أن يعلن
  الـ Plugin المفضّل `channelConfigs.<channel-id>.preferOver` مع
  معرّف Plugin الأقل أولوية. راجع [/plugins/manifest#replacing-another-channel-plugin](/ar/plugins/manifest#replacing-another-channel-plugin).
- إذا كان التكرار عرضياً، فعطّل أحد الجانبين باستخدام
  `plugins.entries.<plugin-id>.enabled: false` أو أزل تثبيت Plugin القديم.
- إذا فعّلت كلا الـ Plugins صراحة، يحافظ OpenClaw على ذلك الطلب و
  يبلّغ عن التعارض. اختر مالكاً واحداً للقناة أو أعد تسمية الأدوات المملوكة
  لـ Plugin حتى يكون سطح وقت التشغيل غير ملتبس.

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
| `memory`        | Active Memory Plugin  | `memory-core`       |
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

تُشحن Plugins المضمّنة مع OpenClaw. كثير منها مفعّل افتراضيًا (على سبيل المثال
مزوّدو النماذج المضمّنون، ومزوّدو الكلام المضمّنون، وPlugin المتصفح المضمّن).
لا تزال Plugins مضمنة أخرى تحتاج إلى `openclaw plugins enable <id>`.

يستبدل `--force` أي Plugin أو حزمة hooks مثبّتة موجودة في مكانها. استخدم
`openclaw plugins update <id-or-npm-spec>` للترقيات الروتينية لـ Plugins
npm المتتبَّعة. لا يُدعَم مع `--link`، الذي يعيد استخدام مسار المصدر بدلًا
من النسخ فوق هدف تثبيت مُدار.

عندما تكون `plugins.allow` مضبوطة مسبقًا، يضيف `openclaw plugins install`
معرّف Plugin المثبّت إلى قائمة السماح تلك قبل تفعيله. إذا كان معرّف Plugin
نفسه موجودًا في `plugins.deny`، يزيل التثبيت إدخال المنع القديم ذلك بحيث
يصبح التثبيت الصريح قابلًا للتحميل فورًا بعد إعادة التشغيل.

يحتفظ OpenClaw بسجل Plugin محلي دائم كنموذج قراءة بارد لجرد Plugins وملكية
المساهمات وتخطيط بدء التشغيل. تحدّث مسارات التثبيت والتحديث وإلغاء التثبيت
والتفعيل والتعطيل ذلك السجل بعد تغيير حالة Plugin. يحتفظ ملف
`plugins/installs.json` نفسه ببيانات وصفية دائمة للتثبيت في `installRecords`
عالية المستوى وببيانات وصفية قابلة لإعادة البناء للبيان في `plugins`. إذا كان
السجل مفقودًا أو قديمًا أو غير صالح، فإن `openclaw plugins registry
--refresh` يعيد بناء عرض البيان من سجلات التثبيت وسياسة الإعداد وبيانات
البيان/الحزمة الوصفية دون تحميل وحدات وقت تشغيل Plugin.
ينطبق `openclaw plugins update <id-or-npm-spec>` على التثبيتات المتتبَّعة. تمرير
مواصفة حزمة npm مع dist-tag أو إصدار دقيق يحل اسم الحزمة إلى سجل Plugin
المتتبَّع ويسجّل المواصفة الجديدة للتحديثات المستقبلية. تمرير اسم الحزمة دون
إصدار يعيد التثبيت المثبّت بدقة إلى خط الإصدار الافتراضي في السجل. إذا كان
Plugin npm المثبّت يطابق بالفعل الإصدار المحلول وهوية الأثر المسجّلة، يتخطى
OpenClaw التحديث دون تنزيل أو إعادة تثبيت أو إعادة كتابة الإعداد.
عندما يعمل `openclaw update` على قناة beta، تحاول سجلات npm وClawHub الخاصة
بالخط الافتراضي لـ Plugin استخدام `@beta` أولًا ثم تعود إلى default/latest عند
عدم وجود إصدار beta لـ Plugin. تبقى الإصدارات الدقيقة والوسوم الصريحة مثبّتة.

`--pin` خاص بـ npm فقط. لا يُدعَم مع `--marketplace`، لأن تثبيتات السوق تحفظ
بيانات وصفية لمصدر السوق بدلًا من مواصفة npm.

`--dangerously-force-unsafe-install` تجاوز لحالات الطوارئ للإيجابيات الكاذبة من
ماسح الشيفرات الخطرة المضمّن. يسمح لتثبيتات Plugin وتحديثات Plugin بالمتابعة
بعد نتائج `critical` المضمّنة، لكنه لا يزال لا يتجاوز حظر سياسة Plugin
`before_install` أو الحظر الناتج عن فشل الفحص. تتجاهل فحوصات التثبيت ملفات
وأدلة الاختبار الشائعة مثل `tests/` و`__tests__/` و`*.test.*` و`*.spec.*`
لتجنب حظر محاكيات الاختبار المعبأة؛ ولا تزال نقاط دخول وقت تشغيل Plugin
المعلنة تُفحَص حتى إذا استخدمت أحد تلك الأسماء.

ينطبق علم CLI هذا على مسارات تثبيت/تحديث Plugin فقط. تستخدم تثبيتات اعتماديات
Skills المدعومة من Gateway تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`
بدلًا من ذلك، بينما يبقى `openclaw skills install` مسار تنزيل/تثبيت Skills
من ClawHub المنفصل.

إذا كان Plugin نشرته على ClawHub مخفيًا أو محظورًا بسبب فحص، فافتح لوحة تحكم
ClawHub أو شغّل `clawhub package rescan <name>` لطلب إعادة فحصه من ClawHub.
يؤثر `--dangerously-force-unsafe-install` فقط في التثبيتات على جهازك؛ ولا يطلب
من ClawHub إعادة فحص Plugin أو جعل إصدار محظور عامًا.

تشارك الحزم المتوافقة في مسار list/inspect/enable/disable نفسه الخاص بـ Plugin.
يشمل دعم وقت التشغيل الحالي bundle skills، وClaude command-skills، وافتراضيات
Claude `settings.json`، وافتراضيات Claude `.lsp.json` و`lspServers` المعلنة في
البيان، وCursor command-skills، وأدلة hook المتوافقة مع Codex.

يعرض `openclaw plugins inspect <id>` أيضًا قدرات الحزمة المكتشفة بالإضافة إلى
إدخالات خواديم MCP وLSP المدعومة أو غير المدعومة لـ Plugins المدعومة بالحزم.

يمكن أن تكون مصادر السوق اسم سوق معروفًا لـ Claude من
`~/.claude/plugins/known_marketplaces.json`، أو جذر سوق محليًا أو مسار
`marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو URL لمستودع GitHub،
أو URL لـ git. بالنسبة إلى الأسواق البعيدة، يجب أن تبقى إدخالات Plugin داخل
مستودع السوق المستنسخ وأن تستخدم مصادر مسارات نسبية فقط.

راجع [مرجع CLI لـ `openclaw plugins`](/ar/cli/plugins) للاطلاع على التفاصيل الكاملة.

## نظرة عامة على API لـ Plugin

تصدّر Plugins الأصلية كائن إدخال يوفّر `register(api)`. قد تستمر Plugins الأقدم
في استخدام `activate(api)` كاسم مستعار قديم، لكن ينبغي أن تستخدم Plugins الجديدة
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
المحمّل يعود إلى `activate(api)` لـ Plugins الأقدم، لكن ينبغي أن تعدّ Plugins
المضمّنة وPlugins الخارجية الجديدة `register` العقد العام.

يخبر `api.registrationMode` الـ Plugin بسبب تحميل إدخاله:

| الوضع           | المعنى                                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `full`          | تفعيل وقت التشغيل. سجّل الأدوات وhooks والخدمات والأوامر والمسارات والآثار الجانبية الحية الأخرى.                              |
| `discovery`     | اكتشاف قدرات للقراءة فقط. سجّل المزوّدين والبيانات الوصفية؛ قد تُحمَّل شيفرة إدخال Plugin الموثوقة، لكن تخطَّ الآثار الجانبية الحية. |
| `setup-only`    | تحميل بيانات إعداد القناة الوصفية عبر إدخال إعداد خفيف.                                                                        |
| `setup-runtime` | تحميل إعداد القناة الذي يحتاج أيضًا إلى إدخال وقت التشغيل.                                                                      |
| `cli-metadata`  | جمع بيانات أوامر CLI الوصفية فقط.                                                                                              |

ينبغي لإدخالات Plugin التي تفتح مقابس أو قواعد بيانات أو عمال خلفية أو عملاء
طويلي العمر أن تحمي تلك الآثار الجانبية باستخدام `api.registrationMode === "full"`.
تُخزَّن تحميلات الاكتشاف مؤقتًا بشكل منفصل عن تحميلات التفعيل ولا تستبدل سجل
Gateway الجاري. الاكتشاف غير مفعِّل، وليس خاليًا من الاستيراد: قد يقيّم OpenClaw
إدخال Plugin الموثوق أو وحدة Plugin القناة لبناء اللقطة. أبقِ المستويات العليا
للوحدات خفيفة وخالية من الآثار الجانبية، وانقل عملاء الشبكة والعمليات الفرعية
والمستمعين وقراءات بيانات الاعتماد وبدء تشغيل الخدمات خلف مسارات وقت التشغيل
الكامل.

طرق التسجيل الشائعة:

| الطريقة                                 | ما تسجله                       |
| --------------------------------------- | ------------------------------ |
| `registerProvider`                      | مزوّد نموذج (LLM)              |
| `registerChannel`                       | قناة دردشة                     |
| `registerTool`                          | أداة وكيل                      |
| `registerHook` / `on(...)`              | hooks دورة الحياة              |
| `registerSpeechProvider`                | تحويل النص إلى كلام / STT      |
| `registerRealtimeTranscriptionProvider` | STT متدفق                      |
| `registerRealtimeVoiceProvider`         | صوت فوري مزدوج الاتجاه         |
| `registerMediaUnderstandingProvider`    | تحليل الصور/الصوت              |
| `registerImageGenerationProvider`       | توليد الصور                    |
| `registerMusicGenerationProvider`       | توليد الموسيقى                 |
| `registerVideoGenerationProvider`       | توليد الفيديو                  |
| `registerWebFetchProvider`              | مزوّد جلب/كشط الويب            |
| `registerWebSearchProvider`             | بحث الويب                      |
| `registerHttpRoute`                     | نقطة نهاية HTTP                |
| `registerCommand` / `registerCli`       | أوامر CLI                      |
| `registerContextEngine`                 | محرك السياق                    |
| `registerService`                       | خدمة خلفية                     |

سلوك حماية hook لـ hooks دورة الحياة المعرّفة نوعيًا:

- `before_tool_call`: `{ block: true }` نهائي؛ يتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: `{ block: false }` لا يفعل شيئًا ولا يمحو حظرًا سابقًا.
- `before_install`: `{ block: true }` نهائي؛ يتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_install`: `{ block: false }` لا يفعل شيئًا ولا يمحو حظرًا سابقًا.
- `message_sending`: `{ cancel: true }` نهائي؛ يتم تخطي المعالجات ذات الأولوية الأدنى.
- `message_sending`: `{ cancel: false }` لا يفعل شيئًا ولا يمحو إلغاءً سابقًا.

يعيد خادم تطبيق Codex الأصلي وصل أحداث أدوات Codex الأصلية إلى سطح hook هذا.
يمكن لـ Plugins حظر أدوات Codex الأصلية عبر `before_tool_call`، ومراقبة النتائج
عبر `after_tool_call`، والمشاركة في موافقات Codex `PermissionRequest`. لا يعيد
الجسر كتابة وسائط أدوات Codex الأصلية بعد. يعيش حد دعم وقت تشغيل Codex الدقيق
في [عقد دعم Codex harness v1](/ar/plugins/codex-harness#v1-support-contract).

للاطلاع على السلوك الكامل لـ hooks المعرّفة نوعيًا، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#hook-decision-semantics).

## ذات صلة

- [بناء Plugin](/ar/plugins/building-plugins) - أنشئ Plugin خاصًا بك
- [حِزم Plugin](/ar/plugins/bundles) - توافق حِزم Codex/Claude/Cursor
- [بيان Plugin](/ar/plugins/manifest) - مخطط البيان
- [تسجيل الأدوات](/ar/plugins/building-plugins#registering-agent-tools) - أضف أدوات الوكيل في Plugin
- [تفاصيل Plugin الداخلية](/ar/plugins/architecture) - نموذج القدرات ومسار التحميل
- [Plugin المجتمع](/ar/plugins/community) - قوائم الأطراف الخارجية
