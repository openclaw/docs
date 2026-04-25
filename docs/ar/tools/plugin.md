---
read_when:
    - تثبيت Plugins أو إعدادها
    - فهم قواعد اكتشاف Plugin وتحميلها
    - العمل مع حزم Plugin المتوافقة مع Codex/Claude
sidebarTitle: Install and Configure
summary: تثبيت وإعداد وإدارة Plugins في OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-25T18:23:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82e272b1b59006b1f40b4acc3f21a8bca8ecacc1a8b7fb577ad3d874b9a8e326
    source_path: tools/plugin.md
    workflow: 15
---

توسّع Plugins قدرات OpenClaw بإمكانات جديدة: القنوات، ومزوّدو النماذج،
وagent harnesses، والأدوات، وSkills، والكلام، والنسخ الفوري، والصوت
الفوري، وفهم الوسائط، وإنشاء الصور، وإنشاء الفيديو، وجلب الويب، والبحث في الويب،
وغير ذلك. بعض Plugins تكون **أساسية** (تأتي مع OpenClaw)، وأخرى
**خارجية** (منشورة على npm من المجتمع).

## البدء السريع

<Steps>
  <Step title="اطّلع على ما تم تحميله">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="ثبّت Plugin">
    ```bash
    # من npm
    openclaw plugins install @openclaw/voice-call

    # من دليل محلي أو أرشيف
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="أعد تشغيل Gateway">
    ```bash
    openclaw gateway restart
    ```

    ثم اضبط الإعدادات تحت `plugins.entries.\<id\>.config` في ملف الإعدادات لديك.

  </Step>
</Steps>

إذا كنت تفضّل التحكم عبر الدردشة، فعّل `commands.plugins: true` واستخدم:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

يستخدم مسار التثبيت المحلّل نفسه الذي تستخدمه CLI: مسار/أرشيف محلي، أو
`clawhub:<pkg>` صريح، أو مواصفة حزمة مجردة (ClawHub أولًا، ثم الرجوع إلى npm).

إذا كانت الإعدادات غير صالحة، يفشل التثبيت عادةً في الوضع المغلق ويوجّهك إلى
`openclaw doctor --fix`. والاستثناء الوحيد للاسترداد هو مسار ضيق لإعادة تثبيت Plugin
المضمّنة التي تختار
`openclaw.install.allowInvalidConfigRecovery`.

لا تقوم عمليات تثبيت OpenClaw المجمّعة بتثبيت شجرة تبعيات وقت التشغيل لكل Plugin
مضمّنة بشكل مسبق. عندما يكون Plugin مملوكًا لـ OpenClaw ومضمّنًا ونشطًا من
إعدادات Plugin، أو من إعدادات قناة قديمة، أو من manifest مفعّل افتراضيًا،
فإن إصلاحات بدء التشغيل تصلح فقط تبعيات وقت التشغيل المعلنة لتلك Plugin قبل استيرادها.
ولا يزال التعطيل الصريح هو الغالب: حيث تمنع `plugins.entries.<id>.enabled: false`،
و`plugins.deny`، و`plugins.enabled: false`، و`channels.<id>.enabled: false`
الإصلاح التلقائي لتبعيات وقت التشغيل المضمّنة لتلك Plugin/القناة.
أما Plugins الخارجية ومسارات التحميل المخصصة فلا تزال بحاجة إلى التثبيت عبر
`openclaw plugins install`.

## أنواع Plugins

يتعرّف OpenClaw على تنسيقين لـ Plugins:

| التنسيق | طريقة العمل | أمثلة |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + وحدة وقت تشغيل؛ تُنفَّذ داخل العملية | Plugins الرسمية، وحزم npm المجتمعية |
| **Bundle** | تخطيط متوافق مع Codex/Claude/Cursor؛ يُربط بميزات OpenClaw | `.codex-plugin/` و`.claude-plugin/` و`.cursor-plugin/` |

يظهر كلاهما ضمن `openclaw plugins list`. راجع [Plugin Bundles](/ar/plugins/bundles) للحصول على تفاصيل الحزم.

إذا كنت تكتب Plugin Native، فابدأ من [Building Plugins](/ar/plugins/building-plugins)
و[Plugin SDK Overview](/ar/plugins/sdk-overview).

## Plugins الرسمية

### قابلة للتثبيت (npm)

| Plugin | الحزمة | الوثائق |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/ar/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/ar/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/ar/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/ar/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/ar/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/ar/plugins/zalouser)   |

### أساسية (تأتي مع OpenClaw)

<AccordionGroup>
  <Accordion title="مزوّدو النماذج (مفعّلون افتراضيًا)">
    `anthropic` و`byteplus` و`cloudflare-ai-gateway` و`github-copilot` و`google`،
    و`huggingface` و`kilocode` و`kimi-coding` و`minimax` و`mistral` و`qwen`،
    و`moonshot` و`nvidia` و`openai` و`opencode` و`opencode-go` و`openrouter`،
    و`qianfan` و`synthetic` و`together` و`venice`،
    و`vercel-ai-gateway` و`volcengine` و`xiaomi` و`zai`
  </Accordion>

  <Accordion title="Plugins الذاكرة">
    - `memory-core` — بحث الذاكرة المضمّن (الافتراضي عبر `plugins.slots.memory`)
    - `memory-lancedb` — ذاكرة طويلة الأمد تُثبَّت عند الطلب مع الاستدعاء/الالتقاط التلقائيين (اضبط `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="مزوّدو الكلام (مفعّلون افتراضيًا)">
    `elevenlabs` و`microsoft`
  </Accordion>

  <Accordion title="أخرى">
    - `browser` — Plugin المتصفح المضمّنة لأداة browser وCLI `openclaw browser` والطريقة `browser.request` في Gateway ووقت تشغيل المتصفح وخدمة التحكم الافتراضية للمتصفح (مفعّلة افتراضيًا؛ عطّلها قبل استبدالها)
    - `copilot-proxy` — جسر VS Code Copilot Proxy (معطّل افتراضيًا)
  </Accordion>
</AccordionGroup>

هل تبحث عن Plugins من أطراف ثالثة؟ راجع [Community Plugins](/ar/plugins/community).

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

| الحقل | الوصف |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | مفتاح التبديل الرئيسي (الافتراضي: `true`) |
| `allow`          | قائمة السماح لـ Plugin (اختيارية) |
| `deny`           | قائمة المنع لـ Plugin (اختيارية؛ والمنع هو الغالب) |
| `load.paths`     | ملفات/أدلة Plugins إضافية |
| `slots`          | محددات الفتحات الحصرية (مثل `memory` و`contextEngine`) |
| `entries.\<id\>` | مفاتيح التبديل + الإعدادات لكل Plugin |

**تتطلب تغييرات الإعدادات إعادة تشغيل gateway**. إذا كانت Gateway تعمل مع
مراقبة الإعدادات + إعادة التشغيل داخل العملية (وهو مسار `openclaw gateway` الافتراضي)،
فعادةً ما تتم إعادة التشغيل تلك تلقائيًا بعد لحظة من وصول كتابة الإعدادات.
لا يوجد مسار hot-reload مدعوم لرمز وقت تشغيل Plugin الأصلية أو lifecycle
hooks؛ أعد تشغيل عملية Gateway التي تخدم القناة الحية قبل أن تتوقع
تشغيل رمز `register(api)` المحدّث أو hooks من نوع `api.on(...)` أو الأدوات أو الخدمات أو
hooks الخاصة بالمزوّد/وقت التشغيل.

يُعد `openclaw plugins list` لقطة محلية لسجل Plugins/الإعدادات. إن وجود
Plugin بحالة `enabled` هناك يعني أن السجل المحفوظ والإعدادات الحالية يسمحان
لتلك Plugin بالمشاركة. لكنه لا يثبت أن عملية Gateway الفرعية البعيدة التي تعمل
قد أُعيد تشغيلها إلى رمز Plugin نفسه. في إعدادات VPS/الحاويات ذات العمليات المغلِّفة،
أرسل أوامر إعادة التشغيل إلى العملية الفعلية `openclaw gateway run`،
أو استخدم `openclaw gateway restart` مع Gateway العاملة.

<Accordion title="حالات Plugin: معطّلة مقابل مفقودة مقابل غير صالحة">
  - **معطّلة**: Plugin موجودة لكن قواعد التفعيل عطّلتها. يتم الاحتفاظ بالإعدادات.
  - **مفقودة**: تشير الإعدادات إلى معرّف Plugin لم يتم العثور عليه أثناء الاكتشاف.
  - **غير صالحة**: Plugin موجودة لكن إعداداتها لا تطابق المخطط المعلن.
</Accordion>

## الاكتشاف والأسبقية

يفحص OpenClaw بحثًا عن Plugins بهذا الترتيب (وأول تطابق هو الفائز):

<Steps>
  <Step title="مسارات الإعدادات">
    `plugins.load.paths` — مسارات ملفات أو أدلة صريحة.
  </Step>

  <Step title="Plugins مساحة العمل">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و`\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins العامة">
    `~/.openclaw/<plugin-root>/*.ts` و`~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins المضمّنة">
    تأتي مع OpenClaw. كثير منها مفعّل افتراضيًا (مزوّدو النماذج، والكلام).
    وبعضها الآخر يحتاج إلى تفعيل صريح.
  </Step>
</Steps>

### قواعد التفعيل

- يؤدي `plugins.enabled: false` إلى تعطيل جميع Plugins
- تكون `plugins.deny` دائمًا هي الغالبة على allow
- يؤدي `plugins.entries.\<id\>.enabled: false` إلى تعطيل تلك Plugin
- Plugins ذات المصدر من مساحة العمل تكون **معطّلة افتراضيًا** (ويجب تفعيلها صراحةً)
- تتبع Plugins المضمّنة مجموعة التفعيل الافتراضية المدمجة ما لم يتم تجاوزها
- يمكن للفتحات الحصرية أن تفرض تفعيل Plugin المحددة لتلك الفتحة
- تُفعّل بعض Plugins المضمّنة الاختيارية تلقائيًا عندما تسمّي الإعدادات سطحًا
  مملوكًا لـ Plugin، مثل مرجع نموذج مزوّد، أو إعدادات قناة، أو وقت تشغيل harness
- تحتفظ مسارات OpenAI-family Codex بحدود Plugins منفصلة:
  فـ `openai-codex/*` ينتمي إلى Plugin OpenAI، بينما يتم اختيار
  Codex app-server plugin المضمّن عبر `embeddedHarness.runtime: "codex"` أو
  مراجع النماذج القديمة `codex/*`

## استكشاف أخطاء hooks وقت التشغيل وإصلاحها

إذا ظهرت Plugin في `plugins list` لكن التأثيرات الجانبية لـ `register(api)` أو hooks
لا تعمل في حركة الدردشة الحية، فتحقق أولًا من التالي:

- شغّل `openclaw gateway status --deep --require-rpc` وأكّد أن
  عنوان URL لـ Gateway النشطة، والملف الشخصي، ومسار الإعدادات، والعملية هي نفسها التي تعدّلها.
- أعد تشغيل Gateway الحية بعد تثبيت Plugin أو تغيير الإعدادات أو الرمز. في
  الحاويات المغلِّفة، قد يكون PID 1 مجرد مشرف؛ أعد تشغيل أو أرسل إشارة إلى العملية الفرعية
  `openclaw gateway run`.
- استخدم `openclaw plugins inspect <id> --json` لتأكيد تسجيلات hooks و
  diagnostics. تتطلب hooks المحادثة غير المضمّنة مثل `llm_input`،
  و`llm_output`، و`agent_end`
  القيمة `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- بالنسبة إلى تبديل النماذج، فضّل `before_model_resolve`. إذ يعمل قبل حل
  النموذج في أدوار الوكيل؛ بينما لا يعمل `llm_output` إلا بعد أن ينتج
  نموذج ما مخرجات مساعد.
- للحصول على إثبات للنموذج الفعّال للجلسة، استخدم `openclaw sessions` أو
  أسطح الجلسة/الحالة في Gateway، وعند تصحيح حمولات المزوّد، ابدأ
  Gateway باستخدام `--raw-stream --raw-stream-path <path>`.

## فتحات Plugin (فئات حصرية)

بعض الفئات حصرية (تكون واحدة فقط نشطة في كل مرة):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // أو "none" للتعطيل
      contextEngine: "legacy", // أو معرّف Plugin
    },
  },
}
```

| الفتحة | ما الذي تتحكم فيه | الافتراضي |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin الذاكرة النشطة | `memory-core`       |
| `contextEngine` | محرك السياق النشط | `legacy` (مدمج) |

## مرجع CLI

```bash
openclaw plugins list                       # جرد مضغوط
openclaw plugins list --enabled            # Plugins المفعّلة فقط
openclaw plugins list --verbose            # أسطر تفاصيل لكل Plugin
openclaw plugins list --json               # جرد قابل للقراءة آليًا
openclaw plugins inspect <id>              # تفاصيل معمّقة
openclaw plugins inspect <id> --json       # صيغة قابلة للقراءة آليًا
openclaw plugins inspect --all             # جدول على مستوى المجموعة كلها
openclaw plugins info <id>                 # اسم بديل لـ inspect
openclaw plugins doctor                    # تشخيصات
openclaw plugins registry                  # فحص حالة السجل المحفوظة
openclaw plugins registry --refresh        # إعادة بناء السجل المحفوظ

openclaw plugins install <package>         # تثبيت (ClawHub أولًا، ثم npm)
openclaw plugins install clawhub:<pkg>     # التثبيت من ClawHub فقط
openclaw plugins install <spec> --force    # الكتابة فوق تثبيت موجود
openclaw plugins install <path>            # التثبيت من مسار محلي
openclaw plugins install -l <path>         # ربط (من دون نسخ) للتطوير
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # تسجيل مواصفة npm المحلولة الدقيقة
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # تحديث Plugin واحدة
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # تحديث الكل
openclaw plugins uninstall <id>          # إزالة سجلات الإعدادات/التثبيت
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

تأتي Plugins المضمّنة مع OpenClaw. وكثير منها مفعّل افتراضيًا (مثل
مزوّدي النماذج المضمّنين، ومزوّدي الكلام المضمّنين، وPlugin
المتصفح المضمّنة). بينما لا تزال Plugins مضمّنة أخرى تحتاج إلى `openclaw plugins enable <id>`.

يقوم `--force` بالكتابة فوق Plugin مثبّتة أو حزمة hooks موجودة في مكانها. استخدم
`openclaw plugins update <id-or-npm-spec>` للترقيات الروتينية لـ Plugins npm
المتعقّبة. وهو غير مدعوم مع `--link`، الذي يعيد استخدام مسار المصدر بدلًا
من النسخ فوق هدف تثبيت مُدار.

عندما يكون `plugins.allow` مضبوطًا بالفعل، يضيف `openclaw plugins install`
معرّف Plugin المثبّتة إلى قائمة السماح تلك قبل تفعيلها، بحيث تصبح
عمليات التثبيت قابلة للتحميل مباشرةً بعد إعادة التشغيل.

يحتفظ OpenClaw بسجل محلي محفوظ لـ Plugins بوصفه نموذج القراءة الباردة لـ
جرد Plugins وملكية المساهمات وتخطيط بدء التشغيل. وتقوم تدفقات التثبيت والتحديث
وإلغاء التثبيت والتفعيل والتعطيل بتحديث ذلك السجل بعد تغيير حالة Plugin.
إذا كان السجل مفقودًا أو قديمًا أو غير صالح، فإن `openclaw plugins registry
--refresh` يعيد بناءه من دفتر التثبيت الدائم، وسياسة الإعدادات، وبيانات
manifest/package الوصفية من دون تحميل وحدات وقت تشغيل Plugin.

ينطبق `openclaw plugins update <id-or-npm-spec>` على التثبيتات المتعقّبة. يؤدي
تمرير مواصفة حزمة npm مع dist-tag أو إصدار دقيق إلى حل اسم الحزمة
عودةً إلى سجل Plugin المتعقّب وتسجيل المواصفة الجديدة للتحديثات المستقبلية.
ويؤدي تمرير اسم الحزمة من دون إصدار إلى إعادة تثبيت دقيق مثبّت إلى
خط الإصدار الافتراضي في السجل. وإذا كانت Plugin npm المثبّتة تطابق بالفعل
الإصدار المحلول وهوية العنصر المسجّلة، فإن OpenClaw يتخطى التحديث
من دون تنزيل أو إعادة تثبيت أو إعادة كتابة الإعدادات.

`--pin` مخصص لـ npm فقط. وهو غير مدعوم مع `--marketplace`، لأن
عمليات التثبيت من marketplace تحفظ بيانات مصدر marketplace الوصفية بدلًا من مواصفة npm.

يمثل `--dangerously-force-unsafe-install` تجاوزًا طارئًا عند ظهور
إيجابيات كاذبة من ماسح الشيفرة الخطرة المضمّن. وهو يسمح لعمليات تثبيت Plugins
وتحديثها بالمتابعة بعد نتائج `critical` المضمّنة، لكنه مع ذلك
لا يتجاوز حظر سياسات Plugin `before_install` أو الحظر الناتج عن فشل الفحص.

ينطبق علم CLI هذا على تدفقات تثبيت/تحديث Plugins فقط. أما عمليات تثبيت تبعيات Skills
المدعومة من Gateway فتستخدم بدلًا منه تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`، بينما تظل
`openclaw skills install` تدفق تنزيل/تثبيت Skills منفصلًا من ClawHub.

تشارك الحزم المتوافقة في التدفق نفسه لـ list/inspect/enable/disable الخاص بـ Plugins.
ويشمل دعم وقت التشغيل الحالي Skills الحزم، وClaude command-skills،
وقيم Claude `settings.json` الافتراضية، والقيم الافتراضية لـ Claude `.lsp.json`
و`lspServers` المعلنة في manifest، وCursor command-skills، وأدلة
hooks المتوافقة مع Codex.

كما يبلّغ `openclaw plugins inspect <id>` عن قدرات الحزمة المكتشفة بالإضافة
إلى إدخالات MCP وLSP server المدعومة أو غير المدعومة لـ Plugins المعتمدة على الحزم.

يمكن أن تكون مصادر marketplace اسم marketplace معروفًا لدى Claude من
`~/.claude/plugins/known_marketplaces.json`، أو جذر marketplace محليًا أو
مسار `marketplace.json`، أو صيغة مختصرة لـ GitHub مثل `owner/repo`، أو عنوان URL
لمستودع GitHub، أو عنوان URL لـ git. وبالنسبة إلى marketplaces البعيدة، يجب أن تبقى
إدخالات Plugin داخل مستودع marketplace المستنسخ وأن تستخدم مصادر مسارات نسبية فقط.

راجع [مرجع CLI لـ `openclaw plugins`](/ar/cli/plugins) للاطلاع على التفاصيل الكاملة.

## نظرة عامة على Plugin API

تصدّر Plugins Native كائن إدخال يوفّر `register(api)`. وقد لا تزال Plugins الأقدم
تستخدم `activate(api)` كاسم بديل قديم، لكن ينبغي على Plugins الجديدة
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

يقوم OpenClaw بتحميل كائن الإدخال واستدعاء `register(api)` أثناء تفعيل Plugin.
ولا يزال المحمّل يعود إلى `activate(api)` بالنسبة إلى Plugins الأقدم،
لكن ينبغي على Plugins المضمّنة وPlugins الخارجية الجديدة معاملة
`register` بوصفه العقد العام.

يُخبر `api.registrationMode` Plugin بسبب تحميل إدخالها:

| الوضع | المعنى |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | تفعيل وقت التشغيل. سجّل الأدوات، وhooks، والخدمات، والأوامر، والمسارات، والتأثيرات الجانبية الحية الأخرى. |
| `discovery`     | اكتشاف القدرات للقراءة فقط. سجّل المزوّدات والبيانات الوصفية؛ وقد يتم تحميل كود إدخال Plugin موثوق، لكن تخطَّ التأثيرات الجانبية الحية. |
| `setup-only`    | تحميل بيانات إعداد القنوات الوصفية عبر إدخال إعداد خفيف. |
| `setup-runtime` | تحميل إعداد القنوات الذي يحتاج أيضًا إلى إدخال وقت التشغيل. |
| `cli-metadata`  | جمع بيانات أوامر CLI الوصفية فقط. |

يجب على إدخالات Plugin التي تفتح sockets أو قواعد بيانات أو عمّالًا في الخلفية أو عملاء
طويلي العمر أن تحرس تلك التأثيرات الجانبية باستخدام `api.registrationMode === "full"`.
ويتم تخزين تحميلات الاكتشاف مؤقتًا بشكل منفصل عن تحميلات التفعيل ولا تستبدل
سجل Gateway العامل. الاكتشاف غير مُفعِّل، لكنه ليس خاليًا من الاستيراد:
فقد يقيّم OpenClaw إدخال Plugin الموثوق أو وحدة Plugin الخاصة بالقناة لبناء
اللقطة. أبقِ المستويات العليا للوحدات خفيفة وخالية من التأثيرات الجانبية، وانقل
عملاء الشبكة، والعمليات الفرعية، والمستمعين، وقراءات بيانات الاعتماد، وبدء تشغيل الخدمات
إلى ما وراء مسارات وقت التشغيل الكامل.

طرق التسجيل الشائعة:

| الطريقة | ما الذي تسجّله |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | مزوّد نموذج (LLM) |
| `registerChannel`                       | قناة دردشة |
| `registerTool`                          | أداة وكيل |
| `registerHook` / `on(...)`              | hooks دورة الحياة |
| `registerSpeechProvider`                | تحويل النص إلى كلام / STT |
| `registerRealtimeTranscriptionProvider` | STT للبث |
| `registerRealtimeVoiceProvider`         | صوت فوري ثنائي الاتجاه |
| `registerMediaUnderstandingProvider`    | تحليل الصور/الصوت |
| `registerImageGenerationProvider`       | إنشاء الصور |
| `registerMusicGenerationProvider`       | إنشاء الموسيقى |
| `registerVideoGenerationProvider`       | إنشاء الفيديو |
| `registerWebFetchProvider`              | مزوّد جلب / كشط الويب |
| `registerWebSearchProvider`             | البحث في الويب |
| `registerHttpRoute`                     | نقطة نهاية HTTP |
| `registerCommand` / `registerCli`       | أوامر CLI |
| `registerContextEngine`                 | محرك سياق |
| `registerService`                       | خدمة في الخلفية |

سلوك حارس hooks الخاصة بـ lifecycle hooks المtyped:

- `before_tool_call`: تكون `{ block: true }` نهائية؛ ويتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: تكون `{ block: false }` بلا تأثير ولا تزيل حظرًا سابقًا.
- `before_install`: تكون `{ block: true }` نهائية؛ ويتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_install`: تكون `{ block: false }` بلا تأثير ولا تزيل حظرًا سابقًا.
- `message_sending`: تكون `{ cancel: true }` نهائية؛ ويتم تخطي المعالجات ذات الأولوية الأدنى.
- `message_sending`: تكون `{ cancel: false }` بلا تأثير ولا تزيل إلغاءً سابقًا.

تقوم التشغيلات Native لـ Codex app-server بجسر أحداث الأدوات الأصلية في Codex
مرة أخرى إلى سطح hooks هذا. ويمكن لـ Plugins حظر أدوات Codex الأصلية عبر `before_tool_call`،
ومراقبة النتائج عبر `after_tool_call`، والمشاركة في موافقات
`PermissionRequest` الخاصة بـ Codex. ولا يعيد الجسر كتابة وسائط الأدوات الأصلية في Codex
حتى الآن. ويعيش الحد الدقيق لدعم وقت تشغيل Codex في
[عقد دعم Codex harness v1](/ar/plugins/codex-harness#v1-support-contract).

للاطلاع على السلوك الكامل والمtyped لـ hooks، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#hook-decision-semantics).

## ذو صلة

- [Building plugins](/ar/plugins/building-plugins) — أنشئ Plugin الخاصة بك
- [Plugin Bundles](/ar/plugins/bundles) — توافق حزم Codex/Claude/Cursor
- [Plugin manifest](/ar/plugins/manifest) — مخطط manifest
- [Registering tools](/ar/plugins/building-plugins#registering-agent-tools) — أضف أدوات الوكيل داخل Plugin
- [Plugin internals](/ar/plugins/architecture) — نموذج القدرات ومسار التحميل
- [Community Plugins](/ar/plugins/community) — قوائم الجهات الخارجية
