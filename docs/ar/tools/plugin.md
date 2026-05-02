---
read_when:
    - تثبيت Plugin أو تكوينه
    - فهم قواعد اكتشاف Plugin وتحميله
    - العمل مع حزم Plugin المتوافقة مع Codex/Claude
sidebarTitle: Install and Configure
summary: ثبّت Plugins OpenClaw واضبطها وأدِرها
title: Plugins
x-i18n:
    generated_at: "2026-05-02T21:05:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: d553c917d9054f4cb5a244ffd0d749c37f6dde230a5887b6b71ba7cf39fcefe5
    source_path: tools/plugin.md
    workflow: 16
---

تُوسّع plugins قدرات OpenClaw بإمكانات جديدة: القنوات، ومزوّدو النماذج،
وحاضنات الوكلاء، والأدوات، وSkills، والكلام، والنسخ الفوري، والصوت الفوري،
وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب، والبحث في الويب،
وغير ذلك. بعض plugins تكون **أساسية** (مضمّنة مع OpenClaw)، وبعضها الآخر
**خارجية**. تُنشر معظم plugins الخارجية وتُكتشف عبر
[ClawHub](/ar/tools/clawhub). يظل Npm مدعومًا للتثبيت المباشر ولمجموعة مؤقتة من
حزم plugins المملوكة لـ OpenClaw إلى أن تكتمل عملية الترحيل.

## البدء السريع

للاطلاع على أمثلة جاهزة للنسخ واللصق للتثبيت، والسرد، وإلغاء التثبيت،
والتحديث، والنشر، راجع
[إدارة plugins](/ar/plugins/manage-plugins).

<Steps>
  <Step title="اطلع على ما تم تحميله">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="ثبّت plugin">
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

  <Step title="أعد تشغيل Gateway">
    ```bash
    openclaw gateway restart
    ```

    بعد ذلك، اضبط الإعدادات ضمن `plugins.entries.\<id\>.config` في ملف الإعداد لديك.

  </Step>

  <Step title="الإدارة الأصلية عبر المحادثة">
    في Gateway قيد التشغيل، يؤدي الأمران المقتصران على المالك `/plugins enable` و`/plugins disable`
    إلى تشغيل معيد تحميل إعدادات Gateway. يعيد Gateway تحميل أسطح runtime الخاصة بـ plugin
    داخل العملية، وتعيد دورات الوكيل الجديدة بناء قائمة أدواتها من السجل
    المُحدَّث. يغيّر `/plugins install` شيفرة مصدر plugin، لذلك
    يطلب Gateway إعادة تشغيل بدلًا من الادعاء بأن العملية الحالية تستطيع
    إعادة تحميل الوحدات المستوردة سابقًا بأمان.

  </Step>

  <Step title="تحقّق من plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    استخدم `--runtime` عندما تحتاج إلى إثبات الأدوات، أو الخدمات، أو طرق gateway
    أو hooks، أو أوامر CLI المملوكة لـ plugin التي تم تسجيلها. أما `inspect` العادي فهو فحص بارد
    للبيان/السجل، ويتجنب عمدًا استيراد runtime الخاص بـ plugin.

  </Step>
</Steps>

إذا كنت تفضّل التحكم الأصلي عبر المحادثة، ففعّل `commands.plugins: true` واستخدم:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

يستخدم مسار التثبيت المحلّل نفسه الذي يستخدمه CLI: مسار/أرشيف محلي، أو
`clawhub:<pkg>` صريح، أو `npm:<pkg>` صريح، أو `git:<repo>` صريح، أو مواصفة حزمة
مجردة عبر npm.

إذا كانت الإعدادات غير صالحة، يفشل التثبيت عادةً بشكل مغلق ويوجهك إلى
`openclaw doctor --fix`. استثناء الاسترداد الوحيد هو مسار ضيق لإعادة تثبيت plugin مضمّنة
لـ plugins التي تشترك في
`openclaw.install.allowInvalidConfigRecovery`.
أثناء بدء تشغيل Gateway، تُعزل الإعدادات غير الصالحة لـ plugin واحد إلى ذلك plugin:
تسجل عملية البدء مشكلة `plugins.entries.<id>.config`، وتتجاوز ذلك plugin أثناء
التحميل، وتبقي plugins والقنوات الأخرى متصلة. شغّل `openclaw doctor --fix`
لعزل إعدادات plugin السيئة بتعطيل إدخال ذلك plugin وإزالة
حمولة الإعدادات غير الصالحة الخاصة به؛ تحتفظ النسخة الاحتياطية العادية للإعدادات بالقيم السابقة.
عندما تشير إعدادات قناة إلى plugin لم يعد قابلاً للاكتشاف ولكن
معرّف plugin القديم نفسه لا يزال موجودًا في إعدادات plugin أو سجلات التثبيت، يسجل بدء تشغيل Gateway
تحذيرات ويتجاوز تلك القناة بدلًا من حظر كل قناة أخرى.
شغّل `openclaw doctor --fix` لإزالة إدخالات القناة/plugin القديمة؛ أما
مفاتيح القنوات المجهولة من دون دليل على plugin قديم فلا تزال تُفشل التحقق كي تبقى الأخطاء الإملائية
مرئية.
إذا تم ضبط `plugins.enabled: false`، تُعامل مراجع plugin القديمة على أنها خاملة:
يتجاوز بدء تشغيل Gateway عمل اكتشاف/تحميل plugins ويحافظ `openclaw doctor`
على إعدادات plugin المعطّلة بدلًا من إزالتها تلقائيًا. أعد تفعيل plugins قبل
تشغيل تنظيف doctor إذا أردت إزالة معرّفات plugin القديمة.

لا يحدث تثبيت اعتماديات plugin إلا أثناء تدفقات التثبيت/التحديث أو
إصلاح doctor الصريحة. لا يقوم بدء تشغيل Gateway، أو إعادة تحميل الإعدادات، أو فحص runtime
بتشغيل مديري الحزم أو إصلاح أشجار الاعتماديات. يجب أن تكون اعتماديات plugins المحلية
مثبّتة مسبقًا، بينما تُثبّت plugins من npm وgit وClawHub
ضمن جذور plugins المُدارة في OpenClaw. قد تُرفع اعتماديات npm
ضمن جذر npm المُدار في OpenClaw؛ يفحص التثبيت/التحديث ذلك الجذر المُدار قبل
الثقة، وتزيل عملية إلغاء التثبيت الحزم المُدارة عبر npm باستخدام npm. لا تزال plugins
الخارجية ومسارات التحميل المخصصة بحاجة إلى التثبيت عبر `openclaw plugins install`.
استخدم `openclaw plugins list --json` لرؤية `dependencyStatus` الثابت لكل
plugin مرئي من دون استيراد شيفرة runtime أو إصلاح الاعتماديات.
راجع [حل اعتماديات Plugin](/ar/plugins/dependency-resolution) لدورة الحياة وقت
التثبيت.

تكون مستنسخات المصدر مساحات عمل pnpm. إذا استنسخت OpenClaw للعمل على plugins المضمّنة،
فشغّل `pnpm install`؛ عندها يحمّل OpenClaw plugins المضمّنة من
`extensions/<id>` بحيث تُستخدم التعديلات والاعتماديات المحلية للحزمة مباشرة.
تثبيتات جذر npm العادية مخصصة لـ OpenClaw المُعبّأ، وليس لتطوير
مستنسخ المصدر.

## أنواع Plugin

يتعرف OpenClaw على تنسيقين لـ plugin:

| التنسيق     | طريقة عمله                                                       | أمثلة                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **أصلي** | `openclaw.plugin.json` + وحدة runtime؛ يُنفَّذ داخل العملية       | plugins رسمية، وحزم npm مجتمعية               |
| **حزمة** | تخطيط متوافق مع Codex/Claude/Cursor؛ يُطابق ميزات OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

يظهر كلاهما ضمن `openclaw plugins list`. راجع [حزم Plugin](/ar/plugins/bundles) لتفاصيل الحزم.

إذا كنت تكتب plugin أصليًا، فابدأ بـ [بناء Plugins](/ar/plugins/building-plugins)
و[نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

## نقاط دخول الحزمة

يجب أن تعلن حزم npm الأصلية الخاصة بـ plugin عن `openclaw.extensions` في `package.json`.
يجب أن يبقى كل إدخال داخل دليل الحزمة وأن يُحل إلى ملف runtime
قابل للقراءة، أو إلى ملف مصدر TypeScript له نظير JavaScript مبني مستنتج
مثل `src/index.ts` إلى `dist/index.js`.

استخدم `openclaw.runtimeExtensions` عندما لا تكون ملفات runtime المنشورة موجودة في
المسارات نفسها كإدخالات المصدر. عند وجوده، يجب أن يحتوي `runtimeExtensions`
على إدخال واحد بالضبط لكل إدخال في `extensions`. تفشل القوائم غير المتطابقة في التثبيت
واكتشاف plugin بدلًا من الرجوع بصمت إلى مسارات المصدر. إذا كنت تنشر أيضًا
`openclaw.setupEntry`، فاستخدم `openclaw.runtimeSetupEntry` لنظيره المبني
في JavaScript؛ ويكون ذلك الملف مطلوبًا عند التصريح به.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## plugins الرسمية

### حزم npm المملوكة لـ OpenClaw أثناء الترحيل

ClawHub هو مسار التوزيع الأساسي لمعظم plugins. تتضمن إصدارات OpenClaw المُعبّأة
الحالية بالفعل العديد من plugins الرسمية، لذلك لا تحتاج هذه إلى
تثبيتات npm منفصلة في الإعدادات العادية. إلى أن تُرحّل كل plugin مملوكة لـ OpenClaw
إلى ClawHub، لا يزال OpenClaw يشحن بعض حزم plugins بصيغة `@openclaw/*` على
npm للتثبيتات القديمة/المخصصة وتدفقات عمل npm المباشرة.

إذا أبلغ npm أن حزمة plugin من نوع `@openclaw/*` مهملة، فهذا الإصدار من الحزمة
ينتمي إلى قطار حزم خارجي أقدم. استخدم plugin المضمّن من
OpenClaw الحالي أو مستنسخًا محليًا إلى أن تُنشر حزمة npm أحدث.

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

### الأساسية (مضمّنة مع OpenClaw)

<AccordionGroup>
  <Accordion title="مزوّدو النماذج (مفعّلون افتراضيًا)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="plugins الذاكرة">
    - `memory-core` — بحث الذاكرة المضمّن (افتراضيًا عبر `plugins.slots.memory`)
    - `memory-lancedb` — ذاكرة طويلة الأمد مدعومة بـ LanceDB مع استدعاء/التقاط تلقائي (اضبط `plugins.slots.memory = "memory-lancedb"`)

    راجع [ذاكرة LanceDB](/ar/plugins/memory-lancedb) لإعداد embeddings المتوافق مع OpenAI،
    وأمثلة Ollama، وحدود الاستدعاء، واستكشاف الأخطاء وإصلاحها.

  </Accordion>

  <Accordion title="مزوّدو الكلام (مفعّلون افتراضيًا)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="أخرى">
    - `browser` — plugin متصفح مضمّن لأداة المتصفح، وCLI `openclaw browser`، وطريقة gateway `browser.request`، وruntime المتصفح، وخدمة التحكم الافتراضية بالمتصفح (مفعّل افتراضيًا؛ عطّله قبل استبداله)
    - `copilot-proxy` — جسر VS Code Copilot Proxy (معطّل افتراضيًا)

  </Accordion>
</AccordionGroup>

هل تبحث عن plugins من جهات خارجية؟ راجع [Plugins المجتمع](/ar/plugins/community).

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
| `allow`          | قائمة السماح لـ Plugin (اختياري)                               |
| `deny`           | قائمة الحظر لـ Plugin (اختياري؛ الحظر له الأولوية)                     |
| `load.paths`     | ملفات/دلائل plugin إضافية                            |
| `slots`          | محددات الخانات الحصرية (مثل `memory`, `contextEngine`) |
| `entries.\<id\>` | مفاتيح تفعيل + إعدادات لكل plugin                               |

`plugins.allow` حصري. عندما لا يكون فارغًا، لا يمكن تحميل أو كشف الأدوات
إلا لـ plugins المدرجة، حتى إذا احتوى `tools.allow` على `"*"` أو اسم أداة محدد
مملوك لـ plugin. إذا أشارت قائمة سماح الأدوات إلى أدوات plugin، فأضف معرّفات plugins المالكة
إلى `plugins.allow` أو أزل `plugins.allow`؛ يحذر `openclaw doctor` من هذا
الشكل.

تؤدي تغييرات الإعدادات التي تتم عبر `/plugins enable` أو `/plugins disable` إلى إعادة تحميل Plugin داخل عملية Gateway. تعيد دورات الوكيل الجديدة بناء قائمة أدواتها من سجل Plugin المحدّث. ما تزال العمليات التي تغيّر المصدر، مثل التثبيت والتحديث وإلغاء التثبيت، تعيد تشغيل عملية Gateway لأن وحدات Plugin التي تم استيرادها بالفعل لا يمكن استبدالها في موضعها بأمان.

`openclaw plugins list` هي لقطة محلية لسجل Plugin/الإعدادات. وجود Plugin بحالة `enabled` هناك يعني أن السجل المستمر والإعدادات الحالية يسمحان للـ Plugin بالمشاركة. لا يثبت ذلك أن Gateway بعيدًا قيد التشغيل بالفعل قد أعاد التحميل أو أُعيد تشغيله على رمز Plugin نفسه. في إعدادات VPS/الحاويات التي تستخدم عمليات تغليف، أرسل عمليات إعادة التشغيل أو عمليات الكتابة التي تحفّز إعادة التحميل إلى عملية `openclaw gateway run` الفعلية، أو استخدم `openclaw gateway restart` على Gateway قيد التشغيل عندما يبلّغ التحميل عن فشل.

<Accordion title="حالات Plugin: معطّل مقابل مفقود مقابل غير صالح">
  - **معطّل**: الـ Plugin موجود لكن قواعد التمكين أوقفته. يتم الحفاظ على الإعدادات.
  - **مفقود**: تشير الإعدادات إلى معرّف Plugin لم يعثر عليه الاكتشاف.
  - **غير صالح**: الـ Plugin موجود لكن إعداداته لا تطابق المخطط المعلن. يتخطى بدء تشغيل Gateway ذلك الـ Plugin فقط؛ يمكن لـ `openclaw doctor --fix` عزل الإدخال غير الصالح بتعطيله وإزالة حمولة إعداداته.

</Accordion>

## الاكتشاف والأسبقية

يفحص OpenClaw بحثًا عن Plugins بهذا الترتيب (أول تطابق يفوز):

<Steps>
  <Step title="مسارات الإعدادات">
    `plugins.load.paths` — مسارات ملفات أو أدلة صريحة. يتم تجاهل المسارات التي تشير
    مرة أخرى إلى أدلة Plugins المضمّنة والمعبأة الخاصة بـ OpenClaw؛
    شغّل `openclaw doctor --fix` لإزالة تلك الأسماء المستعارة القديمة.
  </Step>

  <Step title="Plugins مساحة العمل">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins العامة">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins المضمّنة">
    تُشحن مع OpenClaw. كثير منها مفعّل افتراضيًا (موفرو النماذج، الكلام).
    يتطلب بعضها الآخر تمكينًا صريحًا.
  </Step>
</Steps>

تقوم التثبيتات المعبأة وصور Docker عادةً بحل Plugins المضمّنة من شجرة
`dist/extensions` المترجمة. إذا تم ربط دليل مصدر Plugin مضمّن على مسار المصدر
المعبأ المطابق، على سبيل المثال `/app/extensions/synology-chat`، يعامل OpenClaw
دليل المصدر المركّب هذا كتراكب مصدر مضمّن ويكتشفه قبل حزمة
`/app/dist/extensions/synology-chat` المعبأة. يحافظ هذا على عمل دورات حاويات
الصيانة دون إعادة كل Plugin مضمّن إلى مصدر TypeScript. اضبط
`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` لفرض حزم dist المعبأة حتى عند
وجود تركيبات تراكب المصدر.

### قواعد التمكين

- `plugins.enabled: false` يعطّل كل Plugins ويتخطى عمل اكتشاف/تحميل Plugin
- `plugins.deny` يتغلّب دائمًا على السماح
- `plugins.entries.\<id\>.enabled: false` يعطّل ذلك الـ Plugin
- Plugins ذات أصل مساحة العمل **معطّلة افتراضيًا** (يجب تمكينها صراحةً)
- تتبع Plugins المضمّنة مجموعة التشغيل الافتراضية المدمجة ما لم يتم تجاوزها
- يمكن للفتحات الحصرية فرض تمكين Plugin المحدد لتلك الفتحة
- يتم تمكين بعض Plugins المضمّنة الاختيارية تلقائيًا عندما تسمي الإعدادات سطحًا
  مملوكًا لـ Plugin، مثل مرجع نموذج موفر أو إعداد قناة أو وقت تشغيل حزمة اختبار
- يتم الحفاظ على إعدادات Plugin القديمة أثناء نشاط `plugins.enabled: false`؛
  أعد تمكين Plugins قبل تشغيل تنظيف doctor إذا كنت تريد إزالة المعرّفات القديمة
- تحافظ مسارات Codex من عائلة OpenAI على حدود Plugin منفصلة:
  `openai-codex/*` يخص OpenAI plugin، بينما يتم تحديد Plugin خادم تطبيق Codex
  المضمّن بواسطة `agentRuntime.id: "codex"` أو مراجع نماذج `codex/*` القديمة

## استكشاف أخطاء خطافات وقت التشغيل وإصلاحها

إذا ظهر Plugin في `plugins list` لكن تأثيرات `register(api)` الجانبية أو الخطافات
لا تعمل في حركة الدردشة الحية، فتحقق من هذه أولًا:

- شغّل `openclaw gateway status --deep --require-rpc` وتأكد أن عنوان URL النشط لـ
  Gateway والملف الشخصي ومسار الإعدادات والعملية هي العناصر التي تقوم بتحريرها.
- أعد تشغيل Gateway الحي بعد تغييرات تثبيت/إعداد/رمز Plugin. في الحاويات ذات
  المغلفات، قد يكون PID 1 مجرد مشرف؛ أعد تشغيل عملية `openclaw gateway run`
  الفرعية أو أرسل لها إشارة.
- استخدم `openclaw plugins inspect <id> --runtime --json` لتأكيد تسجيلات الخطافات
  والتشخيصات. تحتاج خطافات المحادثة غير المضمّنة مثل `llm_input`،
  و`llm_output`، و`before_agent_finalize`، و`agent_end` إلى
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- لتبديل النماذج، فضّل `before_model_resolve`. فهو يعمل قبل حل النموذج لدورات
  الوكيل؛ أما `llm_output` فيعمل فقط بعد أن تنتج محاولة نموذج مخرجات المساعد.
- لإثبات نموذج الجلسة الفعّال، استخدم `openclaw sessions` أو أسطح جلسة/حالة
  Gateway، وعند تصحيح حمولات الموفّر، ابدأ Gateway باستخدام
  `--raw-stream --raw-stream-path <path>`.

### بطء إعداد أدوات Plugin

إذا بدت دورات الوكيل وكأنها تتوقف أثناء تحضير الأدوات، فمكّن تسجيل التتبع وتحقق
من أسطر توقيتات مصانع أدوات Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

ابحث عن:

```text
[trace:plugin-tools] factory timings ...
```

يعرض الملخص إجمالي وقت المصنع وأبطأ مصانع أدوات Plugin، بما في ذلك معرّف Plugin،
وأسماء الأدوات المعلنة، وشكل النتيجة، وما إذا كانت الأداة اختيارية. تتم ترقية
الأسطر البطيئة إلى تحذيرات عندما يستغرق مصنع واحد ثانية واحدة على الأقل أو
يستغرق إجمالي تحضير مصانع أدوات Plugin خمس ثوانٍ على الأقل.

يخزّن OpenClaw نتائج مصانع أدوات Plugin الناجحة مؤقتًا لعمليات الحل المتكررة
بالسياق الفعّال نفسه للطلب. يتضمن مفتاح التخزين المؤقت إعداد وقت التشغيل الفعّال،
ومساحة العمل، ومعرّفات الوكيل/الجلسة، وسياسة sandbox، وإعدادات المتصفح، وسياق
التسليم، وهوية الطالب، وحالة الملكية، لذلك تُعاد تشغيل المصانع التي تعتمد على
تلك الحقول الموثوقة عندما يتغير السياق.

إذا هيمن Plugin واحد على التوقيت، فافحص تسجيلات وقت التشغيل الخاصة به:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

ثم حدّث ذلك الـ Plugin أو أعد تثبيته أو عطّله. يجب على مؤلفي Plugin نقل تحميل
التبعيات المكلفة خلف مسار تنفيذ الأداة بدلًا من القيام به داخل مصنع الأداة.

### تكرار ملكية قناة أو أداة

الأعراض:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

تعني هذه أن أكثر من Plugin مفعّل يحاول امتلاك القناة نفسها أو تدفق الإعداد نفسه
أو اسم الأداة نفسه. السبب الأكثر شيوعًا هو وجود Plugin قناة خارجي مثبت بجانب
Plugin مضمّن يوفّر الآن معرّف القناة نفسه.

خطوات التصحيح:

- شغّل `openclaw plugins list --enabled --verbose` لرؤية كل Plugin مفعّل
  وأصله.
- شغّل `openclaw plugins inspect <id> --runtime --json` لكل Plugin مشتبه به وقارن
  `channels`، و`channelConfigs`، و`tools`، والتشخيصات.
- شغّل `openclaw plugins registry --refresh` بعد تثبيت أو إزالة حزم
  Plugin كي تعكس البيانات الوصفية المستمرة التثبيت الحالي.
- أعد تشغيل Gateway بعد تغييرات التثبيت أو السجل أو الإعدادات.

خيارات الإصلاح:

- إذا كان أحد Plugins يستبدل آخر عمدًا لمعرّف القناة نفسه، فيجب أن يعلن
  Plugin المفضّل `channelConfigs.<channel-id>.preferOver` مع معرّف Plugin ذي
  الأولوية الأقل. راجع [/plugins/manifest#replacing-another-channel-plugin](/ar/plugins/manifest#replacing-another-channel-plugin).
- إذا كان التكرار غير مقصود، فعطّل أحد الطرفين باستخدام
  `plugins.entries.<plugin-id>.enabled: false` أو أزل تثبيت Plugin القديم.
- إذا قمت بتمكين كلا Plugins صراحةً، يحتفظ OpenClaw بهذا الطلب ويبلغ عن التعارض.
  اختر مالكًا واحدًا للقناة أو أعد تسمية الأدوات المملوكة لـ Plugin بحيث يكون سطح
  وقت التشغيل غير ملتبس.

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

| الفتحة          | ما تتحكم فيه          | الافتراضي           |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active Memory plugin  | `memory-core`       |
| `contextEngine` | محرك السياق النشط     | `legacy` (مدمج) |

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
موفرو النماذج المضمّنون، وموفرو الكلام المضمّنون، وPlugin المتصفح المضمّن).
ما تزال Plugins مضمّنة أخرى تحتاج إلى `openclaw plugins enable <id>`.

يقوم `--force` بالكتابة فوق Plugin أو حزمة خطافات مثبتة موجودة في مكانها. استخدم
`openclaw plugins update <id-or-npm-spec>` للترقيات الروتينية لـ Plugins npm
المتعقّبة. لا يكون مدعومًا مع `--link`، الذي يعيد استخدام مسار المصدر بدلًا من
النسخ فوق هدف تثبيت مُدار.

عندما يكون `plugins.allow` مضبوطًا بالفعل، يضيف `openclaw plugins install`
معرّف Plugin المثبت إلى قائمة السماح تلك قبل تمكينه. إذا كان معرّف Plugin نفسه
موجودًا في `plugins.deny`، يزيل التثبيت إدخال الرفض القديم ذلك بحيث يكون التثبيت
الصريح قابلًا للتحميل فورًا بعد إعادة التشغيل.

يحتفظ OpenClaw بسجل Plugin محلي مستمر بوصفه نموذج القراءة البارد
لمخزون Plugin، وملكية المساهمات، وتخطيط بدء التشغيل. تقوم تدفقات التثبيت، والتحديث،
وإلغاء التثبيت، والتمكين، والتعطيل بتحديث ذلك السجل بعد تغيير حالة Plugin.
يحتفظ الملف نفسه `plugins/installs.json` ببيانات تعريف التثبيت الدائمة في
`installRecords` على المستوى الأعلى، وبيانات تعريف البيان القابلة لإعادة البناء في
`plugins`. إذا كان السجل مفقودا أو قديما أو غير صالح، فإن `openclaw plugins registry
--refresh` يعيد بناء عرض البيان الخاص به من سجلات التثبيت، وسياسة الإعدادات، وبيانات
تعريف البيان/الحزمة، دون تحميل وحدات وقت تشغيل Plugin.
ينطبق `openclaw plugins update <id-or-npm-spec>` على عمليات التثبيت المتتبعة. يؤدي
تمرير مواصفة حزمة npm مع dist-tag أو إصدار دقيق إلى حل اسم الحزمة مرة أخرى إلى سجل
Plugin المتتبع وتسجيل المواصفة الجديدة للتحديثات المستقبلية. يؤدي تمرير اسم الحزمة
من دون إصدار إلى نقل تثبيت مثبت بدقة مرة أخرى إلى خط الإصدار الافتراضي للسجل. إذا كان
Plugin npm المثبت يطابق بالفعل الإصدار المحلول وهوية الأثر المسجلة، فإن OpenClaw
يتخطى التحديث من دون تنزيل أو إعادة تثبيت أو إعادة كتابة الإعدادات.
عندما يعمل `openclaw update` على قناة beta، تحاول سجلات Plugin الافتراضية الخط من npm
وClawHub استخدام `@beta` أولا، ثم تعود إلى default/latest عندما لا يوجد إصدار beta
للـ Plugin. تبقى الإصدارات الدقيقة والوسوم الصريحة مثبتة.

`--pin` خاص بـ npm فقط. وهو غير مدعوم مع `--marketplace`، لأن تثبيتات السوق تحتفظ
ببيانات تعريف مصدر السوق بدلا من مواصفة npm.

`--dangerously-force-unsafe-install` هو تجاوز طارئ للنتائج الإيجابية الكاذبة من ماسح
الشيفرات الخطرة المدمج. يسمح لتثبيتات Plugin وتحديثات Plugin بالاستمرار بعد نتائج
`critical` المدمجة، لكنه لا يزال لا يتجاوز حظر سياسة Plugin `before_install` أو حظر
فشل الفحص. تتجاهل فحوصات التثبيت ملفات وأدلة الاختبار الشائعة مثل `tests/`،
و`__tests__/`، و`*.test.*`، و`*.spec.*` لتجنب حظر نماذج الاختبار المعبأة؛ ولا تزال
نقاط إدخال وقت تشغيل Plugin المعلنة تفحص حتى لو استخدمت أحد تلك الأسماء.

ينطبق علم CLI هذا على تدفقات تثبيت/تحديث Plugin فقط. تستخدم تثبيتات تبعيات Skills
المدعومة من Gateway تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall` بدلا من ذلك،
بينما يبقى `openclaw skills install` تدفق تنزيل/تثبيت Skills منفصلا من ClawHub.

إذا كان Plugin نشرته على ClawHub مخفيا أو محظورا بفحص، فافتح لوحة تحكم ClawHub أو شغل
`clawhub package rescan <name>` لطلب أن يفحصه ClawHub مرة أخرى. يؤثر
`--dangerously-force-unsafe-install` فقط في التثبيتات على جهازك؛ ولا يطلب من ClawHub
إعادة فحص Plugin أو جعل إصدار محظور عاما.

تشارك الحزم المتوافقة في تدفق قائمة/فحص/تمكين/تعطيل Plugin نفسه. يتضمن دعم وقت التشغيل
الحالي Skills الحزم، وSkills أوامر Claude، وافتراضيات Claude `settings.json`،
وافتراضيات Claude `.lsp.json` و`lspServers` المعلنة في البيان، وSkills أوامر Cursor،
وأدلة hook المتوافقة مع Codex.

يعرض `openclaw plugins inspect <id>` أيضا قدرات الحزمة المكتشفة بالإضافة إلى إدخالات
خادم MCP وLSP المدعومة أو غير المدعومة للـ Plugins المدعومة بالحزم.

يمكن أن تكون مصادر السوق اسما معروفا لسوق Claude من
`~/.claude/plugins/known_marketplaces.json`، أو جذر سوق محلي أو مسار
`marketplace.json`، أو اختصارا لـ GitHub مثل `owner/repo`، أو URL لمستودع GitHub،
أو URL لـ git. بالنسبة إلى الأسواق البعيدة، يجب أن تبقى إدخالات Plugin داخل مستودع
السوق المستنسخ وأن تستخدم مصادر مسارات نسبية فقط.

راجع [مرجع CLI لـ `openclaw plugins`](/ar/cli/plugins) للحصول على التفاصيل الكاملة.

## نظرة عامة على API لـ Plugin

تصدر Plugins الأصلية كائن إدخال يعرض `register(api)`. قد لا تزال Plugins الأقدم
تستخدم `activate(api)` كاسم مستعار قديم، لكن ينبغي للـ Plugins الجديدة استخدام
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

يحمل OpenClaw كائن الإدخال ويستدعي `register(api)` أثناء تفعيل Plugin. لا يزال المحمل
يعود إلى `activate(api)` للـ Plugins الأقدم، لكن ينبغي للـ Plugins المضمنة والـ Plugins
الخارجية الجديدة التعامل مع `register` بوصفه العقد العام.

يخبر `api.registrationMode` الـ Plugin بسبب تحميل إدخاله:

| الوضع | المعنى |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | تفعيل وقت التشغيل. سجل الأدوات، وhooks، والخدمات، والأوامر، والمسارات، والتأثيرات الحية الأخرى. |
| `discovery` | اكتشاف قدرات للقراءة فقط. سجل الموفرين وبيانات التعريف؛ قد تحمل شيفرة إدخال Plugin الموثوق، لكن تخط التأثيرات الحية. |
| `setup-only` | تحميل بيانات تعريف إعداد القناة عبر إدخال إعداد خفيف. |
| `setup-runtime` | تحميل إعداد القناة الذي يحتاج أيضا إلى إدخال وقت التشغيل. |
| `cli-metadata` | جمع بيانات تعريف أوامر CLI فقط. |

ينبغي لإدخالات Plugin التي تفتح sockets أو قواعد بيانات أو عاملين في الخلفية أو عملاء
طويلي العمر أن تحرس تلك التأثيرات الجانبية باستخدام `api.registrationMode === "full"`.
تخزن تحميلات الاكتشاف مؤقتا بشكل منفصل عن تحميلات التفعيل ولا تستبدل سجل Gateway
العامل. الاكتشاف غير مفعل، لكنه ليس خاليا من الاستيراد: قد يقيم OpenClaw إدخال Plugin
الموثوق أو وحدة Plugin الخاصة بالقناة لبناء اللقطة. أبق المستويات العليا للوحدات خفيفة
وخالية من التأثيرات الجانبية، وانقل عملاء الشبكة، والعمليات الفرعية، والمستمعين،
وقراءات بيانات الاعتماد، وبدء تشغيل الخدمات خلف مسارات وقت التشغيل الكامل.

طرق التسجيل الشائعة:

| الطريقة | ما تسجله |
| --------------------------------------- | --------------------------- |
| `registerProvider` | موفر نموذج (LLM) |
| `registerChannel` | قناة دردشة |
| `registerTool` | أداة وكيل |
| `registerHook` / `on(...)` | hooks دورة الحياة |
| `registerSpeechProvider` | تحويل النص إلى كلام / STT |
| `registerRealtimeTranscriptionProvider` | STT متدفق |
| `registerRealtimeVoiceProvider` | صوت فوري ثنائي الاتجاه |
| `registerMediaUnderstandingProvider` | تحليل الصور/الصوت |
| `registerImageGenerationProvider` | توليد الصور |
| `registerMusicGenerationProvider` | توليد الموسيقى |
| `registerVideoGenerationProvider` | توليد الفيديو |
| `registerWebFetchProvider` | موفر جلب / كشط الويب |
| `registerWebSearchProvider` | بحث الويب |
| `registerHttpRoute` | نقطة نهاية HTTP |
| `registerCommand` / `registerCli` | أوامر CLI |
| `registerContextEngine` | محرك السياق |
| `registerService` | خدمة خلفية |

سلوك الحارس لـ hooks دورة الحياة ذات الأنواع:

- `before_tool_call`: يكون `{ block: true }` نهائيا؛ ويتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: يكون `{ block: false }` بلا تأثير ولا يمسح حظرا سابقا.
- `before_install`: يكون `{ block: true }` نهائيا؛ ويتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_install`: يكون `{ block: false }` بلا تأثير ولا يمسح حظرا سابقا.
- `message_sending`: يكون `{ cancel: true }` نهائيا؛ ويتم تخطي المعالجات ذات الأولوية الأدنى.
- `message_sending`: يكون `{ cancel: false }` بلا تأثير ولا يمسح إلغاء سابقا.

تعيد عمليات app-server الأصلية لـ Codex ربط أحداث أدوات Codex الأصلية إلى سطح hook
هذا. يمكن للـ Plugins حظر أدوات Codex الأصلية عبر `before_tool_call`، ومراقبة النتائج
عبر `after_tool_call`، والمشاركة في موافقات Codex `PermissionRequest`. لا يعيد الجسر
كتابة وسيطات أدوات Codex الأصلية حتى الآن. يقع حد دعم وقت تشغيل Codex الدقيق في
[عقد دعم حاضنة Codex v1](/ar/plugins/codex-harness#v1-support-contract).

للاطلاع على السلوك الكامل لـ hook ذي الأنواع، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#hook-decision-semantics).

## ذات صلة

- [بناء Plugins](/ar/plugins/building-plugins) — أنشئ Plugin الخاص بك
- [حزم Plugin](/ar/plugins/bundles) — توافق حزم Codex/Claude/Cursor
- [بيان Plugin](/ar/plugins/manifest) — مخطط البيان
- [تسجيل الأدوات](/ar/plugins/building-plugins#registering-agent-tools) — أضف أدوات وكيل في Plugin
- [تفاصيل Plugin الداخلية](/ar/plugins/architecture) — نموذج القدرات وخط تحميل
- [Plugins المجتمع](/ar/plugins/community) — قوائم جهات خارجية
