---
read_when:
    - تثبيت Plugins أو تكوينها
    - فهم قواعد اكتشاف Plugin وتحميله
    - العمل مع حزم Plugin المتوافقة مع Codex/Claude
sidebarTitle: Install and Configure
summary: تثبيت وتهيئة وإدارة Plugins OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-06T08:18:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 118c856507965f496d87edc1fef8cb67d36c7ef62acc84d5ad130ffd3a3f5568
    source_path: tools/plugin.md
    workflow: 16
---

توسّع Plugins قدرات OpenClaw بميزات جديدة: القنوات، ومزوّدو النماذج،
وأطر تشغيل الوكلاء، والأدوات، وSkills، والكلام، والتفريغ الفوري، والصوت
الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب، والبحث في
الويب، والمزيد. بعض Plugins هي **أساسية** (تُشحن مع OpenClaw)، وبعضها
**خارجية**. تُنشر معظم Plugins الخارجية وتُكتشف عبر
[ClawHub](/ar/tools/clawhub). يظل npm مدعومًا للتثبيت المباشر ولمجموعة مؤقتة
من حزم Plugin المملوكة لـ OpenClaw ريثما يكتمل ذلك الانتقال.

## البدء السريع

لأمثلة التثبيت والنسخ واللصق، والسرد، وإلغاء التثبيت، والتحديث، والنشر، راجع
[إدارة Plugins](/ar/plugins/manage-plugins).

<Steps>
  <Step title="See what is loaded">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Install a plugin">
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

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    ثم اضبط الإعدادات ضمن `plugins.entries.\<id\>.config` في ملف الإعدادات لديك.

  </Step>

  <Step title="Chat-native management">
    في Gateway قيد التشغيل، يؤدي الأمران المخصصان للمالك فقط `/plugins enable` و`/plugins disable`
    إلى تشغيل معيد تحميل إعدادات Gateway. يعيد Gateway تحميل أسطح وقت تشغيل Plugin
    داخل العملية، وتعيد دورات الوكيل الجديدة بناء قائمة أدواتها من السجل
    المحدّث. يغيّر `/plugins install` شيفرة مصدر Plugin، لذلك يطلب
    Gateway إعادة تشغيل بدلًا من التظاهر بأن العملية الحالية يمكنها
    إعادة تحميل الوحدات المستوردة مسبقًا بأمان.

  </Step>

  <Step title="Verify the plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    استخدم `--runtime` عندما تحتاج إلى إثبات الأدوات المسجلة، أو الخدمات، أو طرق Gateway،
    أو الخطافات، أو أوامر CLI المملوكة لـ Plugin. أما `inspect` العادي فهو فحص بارد
    للبيان/السجل ويتجنب عمدًا استيراد وقت تشغيل Plugin.

  </Step>
</Steps>

إذا كنت تفضّل التحكم الأصلي عبر المحادثة، فعّل `commands.plugins: true` واستخدم:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

يستخدم مسار التثبيت محلّل المصدر نفسه الذي تستخدمه CLI: مسار/أرشيف محلي، أو
`clawhub:<pkg>` صريح، أو `npm:<pkg>` صريح، أو `git:<repo>` صريح، أو مواصفة حزمة
مجردة عبر npm.

إذا كانت الإعدادات غير صالحة، يفشل التثبيت عادةً بإغلاق آمن ويوجهك إلى
`openclaw doctor --fix`. الاستثناء الوحيد للاسترداد هو مسار ضيق لإعادة تثبيت Plugin
مضمّن لـ Plugins التي تختار الاشتراك في
`openclaw.install.allowInvalidConfigRecovery`.
أثناء بدء تشغيل Gateway، تفشل إعدادات Plugin غير الصالحة بإغلاق آمن مثل أي إعدادات
أخرى غير صالحة. شغّل `openclaw doctor --fix` لعزل إعدادات Plugin السيئة عبر
تعطيل إدخال Plugin ذلك وإزالة حمولة إعداداته غير الصالحة؛ وتحتفظ نسخة الإعدادات
الاحتياطية العادية بالقيم السابقة.
عندما تشير إعدادات قناة إلى Plugin لم يعد قابلًا للاكتشاف بينما يبقى معرّف Plugin
القديم نفسه في إعدادات Plugin أو سجلات التثبيت، يسجل بدء تشغيل Gateway تحذيرات
ويتخطى تلك القناة بدلًا من حظر كل القنوات الأخرى.
شغّل `openclaw doctor --fix` لإزالة إدخالات القناة/Plugin القديمة؛ أما مفاتيح
القنوات غير المعروفة بلا دليل على Plugin قديم فتظل تفشل التحقق كي تبقى الأخطاء
المطبعية مرئية.
إذا ضُبط `plugins.enabled: false`، تُعامل مراجع Plugin القديمة كخامدة:
يتخطى بدء تشغيل Gateway عمل اكتشاف/تحميل Plugin، ويحافظ `openclaw doctor`
على إعدادات Plugin المعطلة بدلًا من إزالتها تلقائيًا. أعد تفعيل Plugins قبل
تشغيل تنظيف doctor إذا كنت تريد إزالة معرّفات Plugin القديمة.

لا يحدث تثبيت تبعيات Plugin إلا أثناء تدفقات التثبيت/التحديث الصريحة أو
إصلاح doctor. لا يشغّل بدء تشغيل Gateway، ولا إعادة تحميل الإعدادات، ولا فحص
وقت التشغيل مديري الحزم أو يصلح أشجار التبعيات. يجب أن تكون تبعيات Plugins المحلية
مثبتة مسبقًا، بينما تُثبّت Plugins القادمة من npm وgit وClawHub تحت جذور Plugin
المدارة في OpenClaw. قد تُرفع تبعيات npm ضمن جذر npm المدار في OpenClaw؛ يفحص
التثبيت/التحديث ذلك الجذر المدار قبل الثقة، وتزيل عملية إلغاء التثبيت الحزم
المدارة عبر npm باستخدام npm. يجب أن تظل Plugins الخارجية ومسارات التحميل المخصصة
مثبتة عبر `openclaw plugins install`.
استخدم `openclaw plugins list --json` لرؤية `dependencyStatus` الثابت لكل
Plugin ظاهر دون استيراد شيفرة وقت التشغيل أو إصلاح التبعيات.
راجع [حل تبعيات Plugin](/ar/plugins/dependency-resolution) لدورة حياة وقت التثبيت.

### ملكية مسار Plugin المحظور

إذا قالت تشخيصات Plugin:
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
وتبعها التحقق من الإعدادات بـ `plugin present but blocked`، فقد وجد OpenClaw
ملفات Plugin مملوكة لمستخدم Unix مختلف عن العملية التي تحمّلها. أبقِ إعدادات
Plugin في مكانها؛ أصلح ملكية نظام الملفات أو شغّل OpenClaw بالمستخدم نفسه الذي
يملك دليل الحالة.

في تثبيتات Docker، تعمل الصورة الرسمية باسم `node` (uid `1000`)، لذلك يجب عادةً
أن تكون أدلة إعدادات ومساحة عمل OpenClaw المربوطة من المضيف مملوكة لـ uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

إذا كنت تشغّل OpenClaw عمدًا بصفة root، فأصلح جذر Plugin المدار ليكون مملوكًا لـ
root بدلًا من ذلك:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

بعد إصلاح الملكية، أعد تشغيل `openclaw doctor --fix` أو
`openclaw plugins registry --refresh` كي يطابق سجل Plugin المحفوظ الملفات
التي أُصلحت.

بالنسبة إلى تثبيتات npm، تُحل المحددات القابلة للتغير مثل `latest` أو dist-tag
قبل التثبيت ثم تُثبّت على الإصدار الدقيق المتحقق منه في جذر npm المدار في OpenClaw.
بعد انتهاء npm، يتحقق OpenClaw من أن إدخال `package-lock.json` المثبت لا يزال
يطابق الإصدار المحلول وسلامة المحتوى. إذا كتب npm بيانات تعريف حزمة مختلفة،
يفشل التثبيت وتُتراجع الحزمة المدارة بدلًا من قبول أثر Plugin مختلف.

مستودعات المصدر هي مساحات عمل pnpm. إذا استنسخت OpenClaw لتعديل Plugins المضمّنة،
شغّل `pnpm install`؛ عندها يحمّل OpenClaw Plugins المضمّنة من
`extensions/<id>` بحيث تُستخدم التعديلات والتبعيات المحلية للحزمة مباشرة.
تثبيتات جذر npm العادية مخصصة لـ OpenClaw المحزّم، وليس لتطوير مستودع المصدر.

## أنواع Plugin

يتعرف OpenClaw على تنسيقين لـ Plugin:

| التنسيق     | كيفية عمله                                                       | أمثلة                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **أصلي** | `openclaw.plugin.json` + وحدة وقت تشغيل؛ يُنفّذ داخل العملية       | Plugins رسمية، وحزم npm مجتمعية               |
| **حزمة** | تخطيط متوافق مع Codex/Claude/Cursor؛ يُعيّن إلى ميزات OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

يظهر كلاهما ضمن `openclaw plugins list`. راجع [حزم Plugin](/ar/plugins/bundles) لتفاصيل الحزم.

إذا كنت تكتب Plugin أصليًا، فابدأ بـ [بناء Plugins](/ar/plugins/building-plugins)
و[نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

## نقاط دخول الحزم

يجب أن تعلن حزم npm الخاصة بـ Plugin الأصلي عن `openclaw.extensions` في `package.json`.
يجب أن يبقى كل إدخال داخل دليل الحزمة وأن يُحل إلى ملف وقت تشغيل قابل للقراءة،
أو إلى ملف مصدر TypeScript مع نظير JavaScript مبني مُستنتج مثل `src/index.ts` إلى `dist/index.js`.
يجب أن تشحن التثبيتات المحزّمة مخرجات وقت تشغيل JavaScript تلك. أما الرجوع إلى
مصدر TypeScript فهو مخصص لمستودعات المصدر ومسارات التطوير المحلي، وليس لحزم
npm المثبتة في جذر Plugin المدار في OpenClaw.

إذا قال تحذير حزمة مدارة إنها `requires compiled runtime output for
TypeScript entry ...`، فهذا يعني أن الحزمة نُشرت دون ملفات JavaScript التي
يحتاجها OpenClaw في وقت التشغيل. هذه مشكلة تحزيم Plugin، وليست مشكلة إعدادات
محلية. حدّث Plugin أو أعد تثبيته بعد أن يعيد الناشر نشر JavaScript المجمّع،
أو عطّل/ألغِ تثبيت ذلك Plugin حتى تتوفر حزمة مصححة.

استخدم `openclaw.runtimeExtensions` عندما لا تكون ملفات وقت التشغيل المنشورة
في المسارات نفسها لإدخالات المصدر. عند وجود `runtimeExtensions`، يجب أن تحتوي
على إدخال واحد بالضبط لكل إدخال في `extensions`. تفشل القوائم غير المتطابقة
في التثبيت واكتشاف Plugin بدلًا من الرجوع بصمت إلى مسارات المصدر. إذا نشرت أيضًا
`openclaw.setupEntry`، فاستخدم `openclaw.runtimeSetupEntry` لنظير JavaScript
المبني الخاص به؛ وهذا الملف مطلوب عند التصريح به.

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

ClawHub هو مسار التوزيع الأساسي لمعظم Plugins. تحزم إصدارات OpenClaw الحالية
المحزّمة بالفعل العديد من Plugins الرسمية، لذلك لا تحتاج هذه إلى تثبيتات npm
منفصلة في الإعدادات العادية. إلى أن تنتقل كل Plugin مملوكة لـ OpenClaw إلى
ClawHub، يظل OpenClaw يشحن بعض حزم Plugin من `@openclaw/*` على npm للتثبيتات
الأقدم/المخصصة وتدفقات عمل npm المباشرة.

إذا أبلغ npm أن حزمة Plugin من `@openclaw/*` مهجورة، فإن إصدار تلك الحزمة من
مسار حزم خارجي أقدم. استخدم Plugin المضمّنة من OpenClaw الحالي أو مستودعًا
محليًا حتى تُنشر حزمة npm أحدث.

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

### الأساسي (يُشحن مع OpenClaw)

<AccordionGroup>
  <Accordion title="Model providers (enabled by default)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` - بحث ذاكرة مضمّن (افتراضي عبر `plugins.slots.memory`)
    - `memory-lancedb` - ذاكرة طويلة الأمد مدعومة من LanceDB مع الاستدعاء/الالتقاط التلقائي (اضبط `plugins.slots.memory = "memory-lancedb"`)

    راجع [Memory LanceDB](/ar/plugins/memory-lancedb) لإعداد التضمين المتوافق مع OpenAI
    وأمثلة Ollama وحدود الاستدعاء واستكشاف الأخطاء وإصلاحها.

  </Accordion>

  <Accordion title="موفرو الكلام (ممكّنون افتراضيًا)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="أخرى">
    - `browser` - Plugin المتصفح المضمّن لأداة المتصفح وCLI `openclaw browser` وطريقة Gateway `browser.request` ووقت تشغيل المتصفح وخدمة التحكم الافتراضية في المتصفح (ممكّن افتراضيًا؛ عطّله قبل استبداله)
    - `copilot-proxy` - جسر VS Code Copilot Proxy (معطّل افتراضيًا)

  </Accordion>
</AccordionGroup>

تبحث عن Plugins من جهات خارجية؟ راجع [Plugins المجتمع](/ar/plugins/community).

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
| `bundledDiscovery` | وضع اكتشاف Plugin المضمّن (`allowlist` افتراضيًا)    |
| `deny`             | قائمة الحظر للـ Plugin (اختياري؛ الحظر له الأولوية)                     |
| `load.paths`       | ملفات/أدلة Plugin إضافية                            |
| `slots`            | محددات الفتحات الحصرية (مثل `memory` و`contextEngine`) |
| `entries.\<id\>`   | مفاتيح تبديل + تكوين لكل Plugin                               |

`plugins.allow` حصرية. عندما تكون غير فارغة، لا يمكن تحميل إلا Plugins المدرجة
أو كشف أدواتها، حتى إذا كان `tools.allow` يحتوي على `"*"` أو اسم أداة محدد
مملوك لـ Plugin. إذا كانت قائمة السماح للأدوات تشير إلى أدوات Plugin، فأضف معرّفات Plugins المالكة
إلى `plugins.allow` أو أزل `plugins.allow`؛ يحذّر `openclaw doctor` من هذا
الشكل.

الإعداد الافتراضي لـ `plugins.bundledDiscovery` هو `"allowlist"` للتكوينات الجديدة، لذلك فإن
قائمة `plugins.allow` التقييدية تمنع أيضًا Plugins موفري الخدمة المضمّنة المحذوفة
من المخزون، بما في ذلك اكتشاف موفر بحث الويب في وقت التشغيل. يضع doctor ختم `"compat"` على
تكوينات قائمة السماح التقييدية الأقدم أثناء الترحيل لكي تحافظ الترقيات على
سلوك موفر الخدمة المضمّن القديم إلى أن يختار المشغّل الوضع الأكثر صرامة.
لا يزال يُعامَل `plugins.allow` الفارغ على أنه غير معيّن/مفتوح.

تؤدي تغييرات التكوين التي تتم من خلال `/plugins enable` أو `/plugins disable` إلى
إعادة تحميل Plugin داخل عملية Gateway. تعيد دورات الوكيل الجديدة بناء قائمة أدواتها من
سجل Plugins المحدّث. لا تزال العمليات التي تغيّر المصدر، مثل التثبيت
والتحديث وإلغاء التثبيت، تعيد تشغيل عملية Gateway لأن وحدات Plugin المستوردة بالفعل
لا يمكن استبدالها بأمان في مكانها.

`openclaw plugins list` هي لقطة محلية لسجل/تكوين Plugin. وجود Plugin بحالة
`enabled` هناك يعني أن السجل المحفوظ والتكوين الحالي يسمحان للـ
Plugin بالمشاركة. ولا يثبت ذلك أن Gateway بعيدة تعمل بالفعل
قد أعادت التحميل أو أُعيد تشغيلها إلى كود Plugin نفسه. في إعدادات VPS/الحاويات
ذات عمليات التغليف، أرسل عمليات إعادة التشغيل أو كتابات تحفّز إعادة التحميل إلى عملية
`openclaw gateway run` الفعلية، أو استخدم `openclaw gateway restart` ضد
Gateway قيد التشغيل عندما يبلغ إعادة التحميل عن فشل.

<Accordion title="حالات Plugin: معطّل مقابل مفقود مقابل غير صالح">
  - **معطّل**: يوجد Plugin لكن قواعد التفعيل أوقفته. يُحفظ التكوين.
  - **مفقود**: يشير التكوين إلى معرّف Plugin لم يعثر عليه الاكتشاف.
  - **غير صالح**: يوجد Plugin لكن تكوينه لا يطابق المخطط المعلن. يتجاوز بدء تشغيل Gateway ذلك Plugin فقط؛ يمكن لـ `openclaw doctor --fix` عزل الإدخال غير الصالح عبر تعطيله وإزالة حمولة تكوينه.

</Accordion>

## الاكتشاف والأولوية

يفحص OpenClaw بحثًا عن Plugins بهذا الترتيب (أول تطابق يفوز):

<Steps>
  <Step title="مسارات التكوين">
    `plugins.load.paths` - مسارات ملفات أو أدلة صريحة. يتم تجاهل المسارات التي تشير
    عائدةً إلى أدلة Plugins المضمّنة والمعبأة الخاصة بـ OpenClaw؛
    شغّل `openclaw doctor --fix` لإزالة تلك الأسماء المستعارة القديمة.
  </Step>

  <Step title="Plugins مساحة العمل">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و`\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins العامة">
    `~/.openclaw/<plugin-root>/*.ts` و`~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins المضمّنة">
    تُشحن مع OpenClaw. كثير منها ممكّن افتراضيًا (موفرو النماذج والكلام).
    ويتطلب غيرها تمكينًا صريحًا.
  </Step>
</Steps>

عادةً ما تحل التثبيتات المعبأة وصور Docker Plugins المضمّنة من شجرة
`dist/extensions` المترجمة. إذا تم تركيب دليل مصدر Plugin مضمّن
فوق مسار المصدر المعبأ المطابق، على سبيل المثال
`/app/extensions/synology-chat`، يعامل OpenClaw دليل المصدر المركّب هذا
كتراكب مصدر مضمّن ويكتشفه قبل حزمة
`/app/dist/extensions/synology-chat` المعبأة. هذا يحافظ على عمل
حلقات الحاويات للمشرفين دون إعادة كل Plugin مضمّن إلى مصدر TypeScript.
اضبط `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` لفرض حزم dist المعبأة
حتى عند وجود تركيبات تراكب المصدر.

### قواعد التفعيل

- `plugins.enabled: false` يعطّل جميع Plugins ويتجاوز عمل اكتشاف/تحميل Plugins
- `plugins.deny` له الأولوية دائمًا على السماح
- `plugins.entries.\<id\>.enabled: false` يعطّل ذلك Plugin
- تكون Plugins الناشئة من مساحة العمل **معطّلة افتراضيًا** (يجب تمكينها صراحةً)
- تتبع Plugins المضمّنة مجموعة التمكين الافتراضي المدمجة ما لم يتم تجاوزها
- يمكن للفتحات الحصرية فرض تمكين Plugin المحدد لتلك الفتحة
- يتم تمكين بعض Plugins المضمّنة الاختيارية تلقائيًا عندما يسمي التكوين
  سطحًا مملوكًا لـ Plugin، مثل مرجع نموذج موفر أو تكوين قناة أو وقت تشغيل
  الحزمة الاختبارية
- يُحفظ تكوين Plugin القديم أثناء نشاط `plugins.enabled: false`؛
  أعد تمكين Plugins قبل تشغيل تنظيف doctor إذا كنت تريد إزالة المعرّفات القديمة
- تحتفظ مسارات Codex من عائلة OpenAI بحدود Plugin منفصلة:
  ينتمي `openai-codex/*` إلى OpenAI Plugin، بينما يتم اختيار Plugin خادم تطبيق Codex
  المضمّن بواسطة `agentRuntime.id: "codex"` أو مراجع النماذج القديمة
  `codex/*`

## استكشاف أخطاء خطافات وقت التشغيل وإصلاحها

إذا ظهر Plugin في `plugins list` لكن التأثيرات الجانبية أو الخطافات الخاصة بـ `register(api)`
لا تعمل في حركة المحادثات الحية، فتحقق من هذه أولًا:

- شغّل `openclaw gateway status --deep --require-rpc` وتأكد من أن عنوان URL النشط لـ
  Gateway والملف الشخصي ومسار التكوين والعملية هي التي تعدّلها.
- أعد تشغيل Gateway الحية بعد تغييرات تثبيت/تكوين/كود Plugin. في حاويات التغليف،
  قد يكون PID 1 مشرفًا فقط؛ أعد تشغيل أو أرسل إشارة إلى عملية
  `openclaw gateway run` الابنة.
- استخدم `openclaw plugins inspect <id> --runtime --json` لتأكيد تسجيلات الخطافات و
  التشخيصات. تحتاج خطافات المحادثة غير المضمّنة مثل `llm_input` و
  `llm_output` و`before_agent_finalize` و`agent_end` إلى
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- لتبديل النماذج، فضّل `before_model_resolve`. يعمل قبل حل النموذج
  لدورات الوكيل؛ لا يعمل `llm_output` إلا بعد أن تنتج محاولة نموذج
  مخرجات المساعد.
- لإثبات نموذج الجلسة الفعّال، استخدم `openclaw sessions` أو أسطح
  جلسة/حالة Gateway، وعند تصحيح حمولات الموفرين، ابدأ
  Gateway باستخدام `--raw-stream --raw-stream-path <path>`.

### إعداد أداة Plugin البطيء

إذا بدت دورات الوكيل متوقفة أثناء تحضير الأدوات، فمكّن تسجيل التتبع و
تحقق من أسطر توقيت مصنع أدوات Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

ابحث عن:

```text
[trace:plugin-tools] factory timings ...
```

يعرض الملخص إجمالي وقت المصنع وأبطأ مصانع أدوات Plugin،
بما في ذلك معرّف Plugin وأسماء الأدوات المعلنة وشكل النتيجة وما إذا كانت الأداة
اختيارية. تُرقّى الأسطر البطيئة إلى تحذيرات عندما يستغرق مصنع واحد
ثانية واحدة على الأقل أو يستغرق إجمالي تحضير مصانع أدوات Plugin خمس ثوانٍ على الأقل.

يخزّن OpenClaw مؤقتًا نتائج مصانع أدوات Plugin الناجحة لعمليات الحل المتكررة
ذات سياق الطلب الفعّال نفسه. يتضمن مفتاح التخزين المؤقت تكوين
وقت التشغيل الفعّال ومساحة العمل ومعرّفات الوكيل/الجلسة وسياسة صندوق الحماية وإعدادات المتصفح
وسياق التسليم وهوية الطالب وحالة الملكية، لذلك يُعاد تشغيل المصانع التي
تعتمد على تلك الحقول الموثوقة عندما يتغير السياق.

إذا هيمن Plugin واحد على التوقيت، فافحص تسجيلات وقت تشغيله:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

ثم حدّث ذلك Plugin أو أعد تثبيته أو عطّله. ينبغي لمؤلفي Plugins نقل
تحميل التبعيات المكلف إلى ما وراء مسار تنفيذ الأداة بدلًا من القيام به
داخل مصنع الأداة.

### ملكية قناة أو أداة مكررة

الأعراض:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

تعني هذه أن أكثر من Plugin ممكّن يحاول امتلاك القناة نفسها
أو تدفق الإعداد أو اسم الأداة. السبب الأكثر شيوعًا هو تثبيت Plugin قناة خارجي
بجانب Plugin مضمّن يوفر الآن معرّف القناة نفسه.

خطوات التصحيح:

- شغّل `openclaw plugins list --enabled --verbose` لرؤية كل Plugin ممكّن
  ومصدره.
- شغّل `openclaw plugins inspect <id> --runtime --json` لكل Plugin مشتبه به و
  قارن `channels` و`channelConfigs` و`tools` والتشخيصات.
- شغّل `openclaw plugins registry --refresh` بعد تثبيت حزم Plugins أو إزالتها
  حتى تعكس البيانات الوصفية المحفوظة التثبيت الحالي.
- أعد تشغيل Gateway بعد تغييرات التثبيت أو السجل أو التكوين.

خيارات الإصلاح:

- إذا كان أحد Plugins يستبدل آخر عمدًا لمعرّف القناة نفسه، فينبغي أن يعلن
  Plugin المفضّل `channelConfigs.<channel-id>.preferOver` مع
  معرّف Plugin ذي الأولوية الأدنى. راجع [/plugins/manifest#replacing-another-channel-plugin](/ar/plugins/manifest#replacing-another-channel-plugin).
- إذا كان التكرار عرضيًا، فعطّل أحد الجانبين باستخدام
  `plugins.entries.<plugin-id>.enabled: false` أو أزل تثبيت Plugin
  القديم.
- إذا مكّنت كلا Plugins صراحةً، يحتفظ OpenClaw بذلك الطلب و
  يبلغ عن التعارض. اختر مالكًا واحدًا للقناة أو أعد تسمية الأدوات المملوكة لـ Plugin
  حتى يكون سطح وقت التشغيل غير ملتبس.

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

تُشحن Plugins المضمّنة مع OpenClaw. يكون كثير منها مفعّلاً افتراضياً (على سبيل المثال
مزودو النماذج المضمّنون، ومزودو الكلام المضمّنون، وPlugin المتصفح
المضمّن). ما زالت Plugins المضمّنة الأخرى تحتاج إلى `openclaw plugins enable <id>`.

يستبدل `--force` أي Plugin أو حزمة خطافات مثبّتة موجودة في مكانها. استخدم
`openclaw plugins update <id-or-npm-spec>` للترقيات الروتينية لـ Plugins npm
المتتبَّعة. هذا غير مدعوم مع `--link`، الذي يعيد استخدام مسار المصدر بدلاً
من النسخ فوق هدف تثبيت مُدار.

عندما تكون `plugins.allow` مضبوطة مسبقاً، يضيف `openclaw plugins install`
معرّف Plugin المثبّت إلى قائمة السماح تلك قبل تفعيله. إذا كان معرّف Plugin نفسه
موجوداً في `plugins.deny`، يزيل التثبيت إدخال المنع القديم ذاك بحيث يكون
التثبيت الصريح قابلاً للتحميل فوراً بعد إعادة التشغيل.

يحتفظ OpenClaw بسجل Plugin محلي دائم باعتباره نموذج القراءة الباردة
لمخزون Plugin، وملكية المساهمات، وتخطيط بدء التشغيل. تعمل مسارات التثبيت،
والتحديث، وإلغاء التثبيت، والتفعيل، والتعطيل على تحديث ذلك السجل بعد تغيير
حالة Plugin. يحتفظ ملف `plugins/installs.json` نفسه ببيانات تعريف التثبيت
الدائمة في `installRecords` ذات المستوى الأعلى، وبيانات تعريف البيان القابلة
لإعادة البناء في `plugins`. إذا كان السجل مفقوداً أو قديماً أو غير صالح، فإن
`openclaw plugins registry
--refresh` يعيد بناء عرض البيان الخاص به من سجلات التثبيت، وسياسة الإعدادات،
وبيانات تعريف البيان/الحزمة من دون تحميل وحدات وقت تشغيل Plugin.
ينطبق `openclaw plugins update <id-or-npm-spec>` على التثبيتات المتتبَّعة. يؤدي
تمرير مواصفة حزمة npm مع وسم توزيع أو إصدار محدد إلى حل اسم الحزمة
مرة أخرى إلى سجل Plugin المتتبَّع وتسجيل المواصفة الجديدة للتحديثات المستقبلية.
ويؤدي تمرير اسم الحزمة من دون إصدار إلى نقل تثبيت مثبّت بإصدار محدد إلى
خط الإصدار الافتراضي في السجل. إذا كان Plugin npm المثبّت يطابق بالفعل
الإصدار المحلول وهوية الأثر المسجلة، يتجاوز OpenClaw التحديث
من دون تنزيل أو إعادة تثبيت أو إعادة كتابة الإعدادات.
عند تشغيل `openclaw update` على قناة بيتا، تحاول سجلات Plugin الافتراضية
من npm وClawHub استخدام `@beta` أولاً ثم ترجع إلى الافتراضي/الأحدث عندما
لا يوجد إصدار بيتا لـ Plugin. تبقى الإصدارات المحددة والوسوم الصريحة مثبّتة.

`--pin` خاص بـ npm فقط. لا يُدعم مع `--marketplace`، لأن تثبيتات السوق
تحتفظ ببيانات تعريف مصدر السوق بدلاً من مواصفة npm.

`--dangerously-force-unsafe-install` هو تجاوز طارئ للنتائج الإيجابية الكاذبة
من ماسح التعليمات البرمجية الخطرة المدمج. يسمح لمثبتات Plugin وتحديثات Plugin
بالمتابعة بعد نتائج `critical` المدمجة، لكنه لا يزال لا يتجاوز حظر سياسة
`before_install` الخاصة بـ Plugin ولا حظر فشل الفحص. تتجاهل فحوصات التثبيت
ملفات وأدلة الاختبار الشائعة مثل `tests/` و`__tests__/` و`*.test.*` و`*.spec.*`
لتجنب حظر محاكيات الاختبار المعبأة؛ ما زالت نقاط دخول وقت تشغيل Plugin
المعلنة تُفحص حتى لو استخدمت أحد هذه الأسماء.

ينطبق علم CLI هذا على مسارات تثبيت/تحديث Plugin فقط. تستخدم تثبيتات تبعيات
Skills المدعومة من Gateway تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`
بدلاً من ذلك، بينما يبقى `openclaw skills install` مسار تنزيل/تثبيت Skills
المنفصل من ClawHub.

إذا كان Plugin نشرته على ClawHub مخفياً أو محظوراً بفعل فحص، فافتح لوحة
تحكم ClawHub أو شغّل `clawhub package rescan <name>` لتطلب من ClawHub
فحصه مرة أخرى. يؤثر `--dangerously-force-unsafe-install` فقط في التثبيتات
على جهازك؛ ولا يطلب من ClawHub إعادة فحص Plugin أو جعل إصدار محظور عاماً.

تشارك الحزم المتوافقة في مسار قائمة/فحص/تفعيل/تعطيل Plugin نفسه. يشمل دعم
وقت التشغيل الحالي Skills الحزمة، وSkills أوامر Claude، وافتراضيات
`settings.json` الخاصة بـ Claude، وافتراضيات `.lsp.json` و`lspServers`
المعلنة في البيان الخاصة بـ Claude، وSkills أوامر Cursor، وأدلة خطافات
Codex المتوافقة.

يعرض `openclaw plugins inspect <id>` أيضاً قدرات الحزمة المكتشفة إضافة إلى
إدخالات خادم MCP وLSP المدعومة أو غير المدعومة لـ Plugins المدعومة بالحزم.

يمكن أن تكون مصادر السوق اسماً معروفاً لسوق Claude من
`~/.claude/plugins/known_marketplaces.json`، أو جذر سوق محلياً أو مسار
`marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع
GitHub، أو عنوان URL لـ git. بالنسبة إلى الأسواق البعيدة، يجب أن تبقى إدخالات
Plugin داخل مستودع السوق المستنسخ وأن تستخدم مصادر مسار نسبية فقط.

راجع [مرجع CLI لـ `openclaw plugins`](/ar/cli/plugins) للحصول على التفاصيل الكاملة.

## نظرة عامة على API الخاص بـ Plugin

تصدّر Plugins الأصلية كائن دخول يعرّض `register(api)`. قد تظل Plugins الأقدم
تستخدم `activate(api)` كاسم مستعار قديم، لكن ينبغي أن تستخدم Plugins الجديدة
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

يحمّل OpenClaw كائن الدخول ويستدعي `register(api)` أثناء تفعيل Plugin.
ما زال المحمّل يرجع إلى `activate(api)` مع Plugins الأقدم، لكن ينبغي أن تتعامل
Plugins المضمّنة وPlugins الخارجية الجديدة مع `register` باعتباره العقد العام.

يوضح `api.registrationMode` لـ Plugin سبب تحميل دخوله:

| الوضع           | المعنى                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | تفعيل وقت التشغيل. سجّل الأدوات، والخطافات، والخدمات، والأوامر، والمسارات، والآثار الجانبية الحية الأخرى.                         |
| `discovery`     | اكتشاف قدرات للقراءة فقط. سجّل المزودين وبيانات التعريف؛ قد يتم تحميل تعليمات برمجية موثوقة لدخول Plugin، لكن تجاوز الآثار الجانبية الحية. |
| `setup-only`    | تحميل بيانات تعريف إعداد القناة عبر دخول إعداد خفيف.                                                                             |
| `setup-runtime` | تحميل إعداد القناة الذي يحتاج أيضاً إلى دخول وقت التشغيل.                                                                         |
| `cli-metadata`  | جمع بيانات تعريف أوامر CLI فقط.                                                                                                  |

ينبغي لدخول Plugin الذي يفتح مقابس أو قواعد بيانات أو عمالاً في الخلفية أو
عملاء طويلي العمر أن يحمي تلك الآثار الجانبية باستخدام
`api.registrationMode === "full"`. تُخزَّن تحميلات الاكتشاف مؤقتاً بشكل منفصل
عن تحميلات التفعيل ولا تستبدل سجل Gateway قيد التشغيل. الاكتشاف غير مُفعِّل
وليس خالياً من الاستيراد: قد يقيّم OpenClaw دخول Plugin الموثوق أو وحدة Plugin
القناة لبناء اللقطة. أبقِ المستويات العليا للوحدات خفيفة وخالية من الآثار
الجانبية، وانقل عملاء الشبكة والعمليات الفرعية والمستمعين وقراءات بيانات
الاعتماد وبدء الخدمات خلف مسارات وقت التشغيل الكامل.

طرق التسجيل الشائعة:

| الطريقة                                 | ما تسجّله                   |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | مزود نموذج (LLM)            |
| `registerChannel`                       | قناة دردشة                  |
| `registerTool`                          | أداة وكيل                   |
| `registerHook` / `on(...)`              | خطافات دورة الحياة          |
| `registerSpeechProvider`                | تحويل النص إلى كلام / STT   |
| `registerRealtimeTranscriptionProvider` | STT متدفق                   |
| `registerRealtimeVoiceProvider`         | صوت فوري ثنائي الاتجاه      |
| `registerMediaUnderstandingProvider`    | تحليل الصور/الصوت           |
| `registerImageGenerationProvider`       | توليد الصور                 |
| `registerMusicGenerationProvider`       | توليد الموسيقى              |
| `registerVideoGenerationProvider`       | توليد الفيديو               |
| `registerWebFetchProvider`              | مزود جلب / كشط الويب        |
| `registerWebSearchProvider`             | بحث الويب                   |
| `registerHttpRoute`                     | نقطة نهاية HTTP             |
| `registerCommand` / `registerCli`       | أوامر CLI                   |
| `registerContextEngine`                 | محرك سياق                   |
| `registerService`                       | خدمة خلفية                  |

سلوك الحراسة لخطافات دورة الحياة المعرّفة النوع:

- `before_tool_call`: يكون `{ block: true }` نهائياً؛ يتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: يكون `{ block: false }` بلا تأثير ولا يمحو حظراً سابقاً.
- `before_install`: يكون `{ block: true }` نهائياً؛ يتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_install`: يكون `{ block: false }` بلا تأثير ولا يمحو حظراً سابقاً.
- `message_sending`: يكون `{ cancel: true }` نهائياً؛ يتم تخطي المعالجات ذات الأولوية الأدنى.
- `message_sending`: يكون `{ cancel: false }` بلا تأثير ولا يمحو إلغاءً سابقاً.

يشغّل خادم تطبيق Codex الأصلي أحداث أدوات Codex الأصلية عبر جسر عائداً إلى
سطح الخطافات هذا. يمكن لـ Plugins حظر أدوات Codex الأصلية عبر `before_tool_call`،
ومراقبة النتائج عبر `after_tool_call`، والمشاركة في موافقات
`PermissionRequest` الخاصة بـ Codex. لا يعيد الجسر كتابة وسيطات أدوات Codex
الأصلية حتى الآن. تقع حدود دعم وقت تشغيل Codex الدقيقة في
[عقد دعم أداة Codex الإصدار 1](/ar/plugins/codex-harness#v1-support-contract).

للحصول على السلوك الكامل للخطافات المعرّفة النوع، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#hook-decision-semantics).

## ذو صلة

- [بناء Plugins](/ar/plugins/building-plugins) - أنشئ Plugin الخاص بك
- [حزم Plugin](/ar/plugins/bundles) - توافق حزم Codex/Claude/Cursor
- [بيان Plugin](/ar/plugins/manifest) - مخطط البيان
- [تسجيل الأدوات](/ar/plugins/building-plugins#registering-agent-tools) - أضف أدوات الوكيل في Plugin
- [داخليات Plugin](/ar/plugins/architecture) - نموذج الإمكانات ومسار التحميل
- [Plugins المجتمع](/ar/plugins/community) - قوائم الجهات الخارجية
