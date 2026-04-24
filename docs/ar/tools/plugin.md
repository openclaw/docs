---
read_when:
    - تثبيت Plugins أو إعدادها
    - فهم قواعد اكتشاف Plugins وتحميلها
    - العمل مع حزم Plugins المتوافقة مع Codex/Claude
sidebarTitle: Install and Configure
summary: تثبيت Plugins الخاصة بـ OpenClaw وإعدادها وإدارتها
title: Plugins
x-i18n:
    generated_at: "2026-04-24T08:11:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: a93114ddb312552f4c321b6e318f3e19810cf5059dd0c68fde93da41936566b8
    source_path: tools/plugin.md
    workflow: 15
---

توسّع Plugins قدرات OpenClaw بإضافة إمكانات جديدة: القنوات، ومزوّدي النماذج،
والأدوات، وSkills، والنطق، والنسخ الفوري، والصوت الفوري،
وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب، والبحث في
الويب، وغير ذلك. بعض Plugins **أساسية** (تُشحن مع OpenClaw)، وبعضها
**خارجي** (ينشره المجتمع على npm).

## البدء السريع

<Steps>
  <Step title="اعرف ما الذي تم تحميله">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="ثبّت Plugin">
    ```bash
    # From npm
    openclaw plugins install @openclaw/voice-call

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="أعد تشغيل Gateway">
    ```bash
    openclaw gateway restart
    ```

    ثم اضبط الإعداد تحت `plugins.entries.\<id\>.config` في ملف الإعداد لديك.

  </Step>
</Steps>

إذا كنت تفضل التحكم الأصلي عبر الدردشة، فعّل `commands.plugins: true` واستخدم:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

يستخدم مسار التثبيت المُحلِّل نفسه الذي يستخدمه CLI: مسار/أرشيف محلي، أو
`clawhub:<pkg>` صريح، أو مواصفة حزمة مجردة (ClawHub أولًا، ثم fallback إلى npm).

إذا كان الإعداد غير صالح، فإن التثبيت يفشل عادةً بشكل مغلق ويوجهك إلى
`openclaw doctor --fix`. والاستثناء الوحيد للتعافي هو مسار ضيق لإعادة تثبيت
bundled-plugin بالنسبة إلى plugins التي تشترك في
`openclaw.install.allowInvalidConfigRecovery`.

إن عمليات تثبيت OpenClaw المعبأة لا تثبت بشكل مسبق شجرة تبعيات وقت التشغيل لكل bundled plugin.
فعندما تكون Plugin مملوكة لـ OpenClaw ومضمّنة ونشطة انطلاقًا من
إعداد plugin، أو إعداد channel قديم، أو manifest مفعلة افتراضيًا،
فإن إصلاحات بدء التشغيل تصلح فقط تبعيات وقت التشغيل المعلنة لتلك plugin قبل استيرادها.
أما plugins الخارجية ومسارات التحميل المخصصة فما تزال بحاجة إلى التثبيت عبر
`openclaw plugins install`.

## أنواع Plugins

يتعرف OpenClaw على تنسيقين من Plugins:

| التنسيق    | كيف يعمل                                                        | أمثلة                                                   |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| **Native** | `openclaw.plugin.json` + وحدة runtime؛ ويُنفَّذ داخل العملية      | Plugins الرسمية، وحزم npm المجتمعية                     |
| **Bundle** | تخطيط متوافق مع Codex/Claude/Cursor؛ ويُربط بميزات OpenClaw      | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

يظهر كلاهما تحت `openclaw plugins list`. راجع [Plugin Bundles](/ar/plugins/bundles) لمعرفة تفاصيل الحزم.

إذا كنت تكتب Plugin Native، فابدأ من [Building Plugins](/ar/plugins/building-plugins)
و[Plugin SDK Overview](/ar/plugins/sdk-overview).

## Plugins الرسمية

### القابلة للتثبيت (npm)

| Plugin          | الحزمة                 | المستندات                            |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/ar/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/ar/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/ar/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/ar/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/ar/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/ar/plugins/zalouser)   |

### الأساسية (تُشحن مع OpenClaw)

<AccordionGroup>
  <Accordion title="مزودو النماذج (مفعّلون افتراضيًا)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — بحث Memory مضمّن (الافتراضي عبر `plugins.slots.memory`)
    - `memory-lancedb` — Active Memory طويلة الأمد بتثبيت عند الطلب مع auto-recall/capture (اضبط `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="مزودو النطق (مفعّلون افتراضيًا)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="أخرى">
    - `browser` — Plugin متصفح مضمّنة من أجل أداة browser، وCLI ‏`openclaw browser`، وطريقة Gateway ‏`browser.request`، وruntime المتصفح، وخدمة التحكم الافتراضية بالمتصفح (مفعلة افتراضيًا؛ عطّلها قبل استبدالها)
    - `copilot-proxy` — جسر VS Code Copilot Proxy (معطل افتراضيًا)
  </Accordion>
</AccordionGroup>

هل تبحث عن Plugins من أطراف خارجية؟ راجع [Community Plugins](/ar/plugins/community).

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

| الحقل            | الوصف                                                   |
| ---------------- | ------------------------------------------------------- |
| `enabled`        | مفتاح تشغيل رئيسي (الافتراضي: `true`)                   |
| `allow`          | قائمة سماح Plugins (اختياري)                            |
| `deny`           | قائمة منع Plugins (اختياري؛ والمنع يفوز)                |
| `load.paths`     | ملفات/أدلة Plugins إضافية                               |
| `slots`          | محددات slots حصرية (مثل `memory`, `contextEngine`)      |
| `entries.\<id\>` | مفاتيح تشغيل + إعداد لكل Plugin                         |

تتطلب تغييرات الإعداد **إعادة تشغيل gateway**. وإذا كانت Gateway تعمل مع
مراقبة الإعداد + إعادة التشغيل داخل العملية مفعلة (وهو المسار الافتراضي لـ `openclaw gateway`)،
فعادةً ما تُنفَّذ إعادة التشغيل تلك تلقائيًا بعد لحظات من وصول كتابة الإعداد.

<Accordion title="حالات Plugin: معطّلة مقابل مفقودة مقابل غير صالحة">
  - **معطّلة**: Plugin موجودة لكن قواعد التفعيل أوقفتها. ويجري الحفاظ على الإعداد.
  - **مفقودة**: يشير الإعداد إلى معرّف plugin لم يعثر عليه الاكتشاف.
  - **غير صالحة**: Plugin موجودة لكن إعدادها لا يطابق المخطط المعلن.
</Accordion>

## الاكتشاف والأولوية

يفحص OpenClaw بحثًا عن Plugins بهذا الترتيب (أول تطابق هو الفائز):

<Steps>
  <Step title="مسارات الإعداد">
    `plugins.load.paths` — مسارات ملفات أو أدلة صريحة.
  </Step>

  <Step title="Plugins مساحة العمل">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins العامة">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins المضمّنة">
    تُشحن مع OpenClaw. وكثير منها مفعّل افتراضيًا (مزودو النماذج، والنطق).
    وأخرى تتطلب تفعيلًا صريحًا.
  </Step>
</Steps>

### قواعد التفعيل

- `plugins.enabled: false` يعطّل جميع Plugins
- تفوز `plugins.deny` دائمًا على allow
- `plugins.entries.\<id\>.enabled: false` يعطّل تلك Plugin
- Plugins ذات أصل مساحة العمل **معطلة افتراضيًا** (ويجب تفعيلها صراحةً)
- تتبع Plugins المضمّنة مجموعة التفعيل الافتراضي المدمجة ما لم يتم تجاوزها
- يمكن أن تفرض slots الحصرية تفعيل الـ plugin المختارة لذلك slot
- تُفعَّل بعض bundled plugins الاختيارية تلقائيًا عندما يسمّي الإعداد
  سطحًا مملوكًا لـ plugin، مثل مرجع نموذج لمزوّد، أو إعداد channel، أو runtime خاصة بـ harness
- تحتفظ مسارات Codex التابعة لعائلة OpenAI بحدود Plugins منفصلة:
  ينتمي `openai-codex/*` إلى Plugin OpenAI، بينما تُختار
  Plugin app-server المضمّنة الخاصة بـ Codex بواسطة `embeddedHarness.runtime: "codex"` أو
  مراجع النماذج القديمة `codex/*`

## Plugin slots (فئات حصرية)

بعض الفئات حصرية (نشطة واحدة فقط في الوقت نفسه):

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

| الـ Slot         | ما الذي تتحكم فيه   | الافتراضي          |
| ---------------- | ------------------- | ------------------- |
| `memory`         | Plugin Memory النشطة | `memory-core`       |
| `contextEngine`  | محرك السياق النشط   | `legacy` (مدمج)     |

## مرجع CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only loaded plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # deep detail
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics

openclaw plugins install <package>         # install (ClawHub first, then npm)
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
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
openclaw plugins uninstall <id>          # remove config/install records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

تُشحن Plugins المضمّنة مع OpenClaw. وكثير منها مفعّل افتراضيًا (مثل
مزودي النماذج المضمّنين، ومزودي النطق المضمّنين، وPlugin المتصفح
المضمّنة). وما تزال Plugins مضمّنة أخرى تحتاج إلى `openclaw plugins enable <id>`.

يقوم `--force` بالكتابة فوق Plugin مثبتة أو حزمة hook موجودة في مكانها. استخدم
`openclaw plugins update <id-or-npm-spec>` للترقيات الروتينية الخاصة بـ npm
plugins المتعقبة. وهو غير مدعوم مع `--link`، الذي يعيد استخدام مسار المصدر بدلًا
من النسخ فوق هدف تثبيت مُدار.

عندما تكون `plugins.allow` مضبوطة بالفعل، فإن `openclaw plugins install` يضيف
معرّف plugin المثبتة إلى قائمة السماح تلك قبل تفعيلها، بحيث تصبح عمليات التثبيت
قابلة للتحميل فورًا بعد إعادة التشغيل.

ينطبق `openclaw plugins update <id-or-npm-spec>` على عمليات التثبيت المتعقبة. وتمرير
مواصفة حزمة npm تحتوي على dist-tag أو إصدار دقيق يعيد تحليل اسم الحزمة
إلى سجل plugin المتعقب ويسجل المواصفة الجديدة من أجل التحديثات المستقبلية.
أما تمرير اسم الحزمة من دون إصدار فينقل التثبيت المثبت بدقة pinned إلى
خط الإصدار الافتراضي في السجل. وإذا كانت npm plugin المثبتة تطابق بالفعل
الإصدار الذي تم تحليله وهوية العنصر المسجلة، فإن OpenClaw تتخطى التحديث
من دون تنزيل أو إعادة تثبيت أو إعادة كتابة الإعداد.

إن `--pin` خاص بـ npm فقط. وهو غير مدعوم مع `--marketplace`، لأن
عمليات التثبيت من marketplace تحفظ بيانات وصفية لمصدر marketplace بدلًا من مواصفة npm.

يمثل `--dangerously-force-unsafe-install` تجاوزًا طارئًا لكسر الزجاج في حال وجود
إيجابيات كاذبة من ماسح الشيفرة الخطرة المضمّن. وهو يسمح لمتابعة تثبيت plugins
وتحديث plugins بعد نتائج `critical` المضمّنة، لكنه مع ذلك
لا يتجاوز كتل السياسة `before_install` الخاصة بالـ plugin أو حظر فشل الفحص.

تنطبق هذه العلامة في CLI على تدفقات تثبيت/تحديث plugin فقط. أما عمليات تثبيت
تبعيات Skill المعتمدة على Gateway فتستخدم بدلًا من ذلك تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`، بينما تظل `openclaw skills install` تدفق تنزيل/تثبيت Skill منفصلًا عبر ClawHub.

تشارك الحزم المتوافقة في تدفق list/inspect/enable/disable نفسه الخاص بالـ plugin.
ويشمل دعم runtime الحالي bundle Skills، وClaude command-skills،
وقيم Claude ‏`settings.json` الافتراضية، وClaude ‏`.lsp.json` والقيم الافتراضية لـ
`lspServers` المعلنة في manifest، وCursor command-skills، وأدلة
Codex hook المتوافقة.

كما يعرض `openclaw plugins inspect <id>` أيضًا القدرات المكتشفة الخاصة بالحزمة بالإضافة إلى
إدخالات MCP وLSP server المدعومة أو غير المدعومة بالنسبة إلى plugins المدعومة بالحزم.

يمكن أن تكون مصادر Marketplace اسم marketplace معروفًا لدى Claude من
`~/.claude/plugins/known_marketplaces.json`، أو جذر marketplace محليًا أو
مسار `marketplace.json`، أو صيغة GitHub مختصرة مثل `owner/repo`، أو عنوان URL لمستودع GitHub،
أو عنوان URL لـ git. وبالنسبة إلى marketplaces البعيدة، يجب أن تظل إدخالات plugin داخل
مستودع marketplace المستنسخ وأن تستخدم مصادر مسارات نسبية فقط.

راجع [مرجع CLI ‏`openclaw plugins`](/ar/cli/plugins) للحصول على التفاصيل الكاملة.

## نظرة عامة على Plugin API

تصدّر Plugins الـ Native كائن إدخال يكشف `register(api)`. وما تزال
Plugins الأقدم قد تستخدم `activate(api)` كاسم بديل قديم، لكن ينبغي على plugins الجديدة
أن تستخدم `register`.

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

يحمّل OpenClaw كائن الإدخال ويستدعي `register(api)` أثناء تفعيل
plugin. وما يزال المُحمِّل يعود إلى `activate(api)` بالنسبة إلى plugins الأقدم،
لكن يجب على bundled plugins وplugins الخارجية الجديدة التعامل مع `register`
بوصفه العقد العام.

أساليب التسجيل الشائعة:

| الطريقة                                 | ما الذي تسجله              |
| --------------------------------------- | -------------------------- |
| `registerProvider`                      | مزود نموذج (LLM)           |
| `registerChannel`                       | قناة دردشة                 |
| `registerTool`                          | أداة وكيل                  |
| `registerHook` / `on(...)`              | Hooks دورة الحياة          |
| `registerSpeechProvider`                | تحويل النص إلى كلام / STT  |
| `registerRealtimeTranscriptionProvider` | STT متدفق                  |
| `registerRealtimeVoiceProvider`         | صوت فوري ثنائي الاتجاه     |
| `registerMediaUnderstandingProvider`    | تحليل الصور/الصوت          |
| `registerImageGenerationProvider`       | توليد الصور                |
| `registerMusicGenerationProvider`       | توليد الموسيقى             |
| `registerVideoGenerationProvider`       | توليد الفيديو              |
| `registerWebFetchProvider`              | مزود جلب / كشط الويب       |
| `registerWebSearchProvider`             | البحث في الويب             |
| `registerHttpRoute`                     | نقطة نهاية HTTP            |
| `registerCommand` / `registerCli`       | أوامر CLI                  |
| `registerContextEngine`                 | محرك سياق                  |
| `registerService`                       | خدمة خلفية                 |

سلوك guard الخاص بـ hook بالنسبة إلى Hooks دورة الحياة typed:

- `before_tool_call`: تكون `{ block: true }` نهائية؛ ويتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: تكون `{ block: false }` بلا تأثير ولا تمسح حظرًا سابقًا.
- `before_install`: تكون `{ block: true }` نهائية؛ ويتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_install`: تكون `{ block: false }` بلا تأثير ولا تمسح حظرًا سابقًا.
- `message_sending`: تكون `{ cancel: true }` نهائية؛ ويتم تخطي المعالجات ذات الأولوية الأدنى.
- `message_sending`: تكون `{ cancel: false }` بلا تأثير ولا تمسح إلغاءً سابقًا.

للاطلاع على السلوك الكامل لـ hook typed، راجع [SDK Overview](/ar/plugins/sdk-overview#hook-decision-semantics).

## ذو صلة

- [Building Plugins](/ar/plugins/building-plugins) — أنشئ Plugin الخاصة بك
- [Plugin Bundles](/ar/plugins/bundles) — توافق حزم Codex/Claude/Cursor
- [Plugin Manifest](/ar/plugins/manifest) — مخطط manifest
- [Registering Tools](/ar/plugins/building-plugins#registering-agent-tools) — أضف أدوات وكيل داخل Plugin
- [Plugin Internals](/ar/plugins/architecture) — نموذج القدرات وخط أنابيب التحميل
- [Community Plugins](/ar/plugins/community) — قوائم الأطراف الخارجية
