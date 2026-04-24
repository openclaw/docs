---
read_when:
    - تثبيت Plugins أو تكوينها
    - فهم قواعد اكتشاف Plugin وتحميله
    - العمل مع حزم Plugin المتوافقة مع Codex/Claude
sidebarTitle: Install and Configure
summary: تثبيت Plugins في OpenClaw وتكوينها وإدارتها
title: Plugins
x-i18n:
    generated_at: "2026-04-24T09:02:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83ab1218d6677ad518a4991ca546d55eed9648e1fa92b76b7433ecd5df569e28
    source_path: tools/plugin.md
    workflow: 15
---

توسّع Plugins قدرات OpenClaw بإمكانات جديدة: القنوات، وموفّرو النماذج،
وأطر تشغيل الوكلاء، والأدوات، وSkills، والكلام، والنسخ الفوري، والصوت
الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب، والبحث على
الويب، وغير ذلك. بعض Plugins **أساسية** (تأتي مع OpenClaw)، وأخرى
**خارجية** (ينشرها المجتمع على npm).

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

  <Step title="أعِد تشغيل Gateway">
    ```bash
    openclaw gateway restart
    ```

    ثم قم بالتكوين ضمن `plugins.entries.\<id\>.config` في ملف الإعداد لديك.

  </Step>
</Steps>

إذا كنت تفضّل التحكم من داخل الدردشة، فعّل `commands.plugins: true` واستخدم:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

يستخدم مسار التثبيت نفس محلّل المسارات الذي يستخدمه CLI: مسار/أرشيف محلي، أو
`clawhub:<pkg>` صريح، أو مواصفة حزمة مجردة (ClawHub أولًا، ثم الرجوع إلى npm).

إذا كان الإعداد غير صالح، فعادةً ما يفشل التثبيت بشكل مغلق ويوجّهك إلى
`openclaw doctor --fix`. الاستثناء الوحيد للاستعادة هو مسار ضيق لإعادة تثبيت
Plugin مضمّن، وذلك بالنسبة إلى Plugins التي تختار
`openclaw.install.allowInvalidConfigRecovery`.

لا تقوم عمليات تثبيت OpenClaw المعبأة بتثبيت شجرة تبعيات وقت التشغيل لكل Plugin
مضمّن بشكل استباقي. عندما يكون Plugin مضمّن ومملوك لـ OpenClaw نشطًا من خلال
إعداد Plugin، أو إعداد قناة قديم، أو ملف manifest مفعّل افتراضيًا،
فإن إصلاحات بدء التشغيل تصلح فقط تبعيات وقت التشغيل المعلنة لذلك Plugin قبل
استيراده. أما Plugins الخارجية ومسارات التحميل المخصصة فلا تزال بحاجة إلى
التثبيت عبر `openclaw plugins install`.

## أنواع Plugins

يتعرف OpenClaw على تنسيقين لـ Plugins:

| التنسيق     | كيف يعمل                                                        | أمثلة                                                  |
| ----------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + وحدة وقت تشغيل؛ يُنفَّذ داخل العملية     | Plugins الرسمية، وحزم npm المجتمعية                   |
| **Bundle** | تخطيط متوافق مع Codex/Claude/Cursor؛ يُربَط بميزات OpenClaw      | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

يظهر كلاهما ضمن `openclaw plugins list`. راجع [حِزم Plugins](/ar/plugins/bundles) لمعرفة تفاصيل الحِزم.

إذا كنت تكتب Plugin Native، فابدأ بـ [بناء Plugins](/ar/plugins/building-plugins)
و[نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

## Plugins الرسمية

### قابلة للتثبيت (npm)

| Plugin          | الحزمة                 | الوثائق                              |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/ar/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/ar/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/ar/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/ar/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/ar/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/ar/plugins/zalouser)   |

### أساسية (تأتي مع OpenClaw)

<AccordionGroup>
  <Accordion title="موفّرو النماذج (مفعّلون افتراضيًا)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins الذاكرة">
    - `memory-core` — بحث ذاكرة مضمّن (الافتراضي عبر `plugins.slots.memory`)
    - `memory-lancedb` — ذاكرة طويلة الأمد تُثبَّت عند الطلب مع استدعاء/التقاط تلقائيين (اضبط `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="موفّرو الكلام (مفعّلون افتراضيًا)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="أخرى">
    - `browser` — Plugin متصفح مضمّن لأداة المتصفح، وCLI `openclaw browser`، وطريقة Gateway `browser.request`، ووقت تشغيل المتصفح، وخدمة التحكم الافتراضية بالمتصفح (مفعّل افتراضيًا؛ عطّله قبل استبداله)
    - `copilot-proxy` — جسر VS Code Copilot Proxy (معطّل افتراضيًا)
  </Accordion>
</AccordionGroup>

هل تبحث عن Plugins من جهات خارجية؟ راجع [Plugins المجتمع](/ar/plugins/community).

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

| الحقل            | الوصف                                                    |
| ---------------- | -------------------------------------------------------- |
| `enabled`        | مفتاح التشغيل الرئيسي (الافتراضي: `true`)               |
| `allow`          | قائمة السماح لـ Plugins (اختياري)                        |
| `deny`           | قائمة الحظر لـ Plugins (اختياري؛ الحظر له الأولوية)      |
| `load.paths`     | ملفات/أدلة Plugins إضافية                                |
| `slots`          | محددات الفتحات الحصرية (مثل `memory` و`contextEngine`)   |
| `entries.\<id\>` | مفاتيح التفعيل/التعطيل + الإعداد لكل Plugin              |

تتطلب تغييرات الإعداد **إعادة تشغيل Gateway**. إذا كان Gateway يعمل مع
مراقبة الإعداد وإعادة التشغيل داخل العملية (وهو المسار الافتراضي `openclaw gateway`)،
فعادةً ما يتم تنفيذ إعادة التشغيل هذه تلقائيًا بعد لحظات من وصول كتابة الإعداد.

<Accordion title="حالات Plugin: معطّل مقابل مفقود مقابل غير صالح">
  - **معطّل**: الـ Plugin موجود لكن قواعد التفعيل أوقفته. يتم الاحتفاظ بالإعداد.
  - **مفقود**: يشير الإعداد إلى معرّف Plugin لم يعثر عليه الاكتشاف.
  - **غير صالح**: الـ Plugin موجود لكن إعداده لا يطابق المخطط المعلن.
</Accordion>

## الاكتشاف والأولوية

يفحص OpenClaw Plugins بهذا الترتيب (أول تطابق هو الذي يفوز):

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
    تأتي مع OpenClaw. كثير منها مفعّل افتراضيًا (موفّرو النماذج، والكلام).
    وبعضها الآخر يتطلب تفعيلًا صريحًا.
  </Step>
</Steps>

### قواعد التفعيل

- `plugins.enabled: false` يعطّل جميع Plugins
- `plugins.deny` يتغلب دائمًا على allow
- `plugins.entries.\<id\>.enabled: false` يعطّل ذلك Plugin
- Plugins ذات المصدر من مساحة العمل تكون **معطلة افتراضيًا** (ويجب تفعيلها صراحةً)
- Plugins المضمّنة تتبع مجموعة التفعيل الافتراضي المدمجة ما لم يتم تجاوزها
- يمكن للفتحات الحصرية فرض تفعيل Plugin المحدد لتلك الفتحة
- يتم تفعيل بعض Plugins المضمّنة الاختيارية تلقائيًا عندما يذكر الإعداد
  سطحًا يملكه Plugin، مثل مرجع نموذج موفّر، أو إعداد قناة، أو وقت تشغيل harness
- تحافظ مسارات Codex من عائلة OpenAI على حدود Plugins منفصلة:
  `openai-codex/*` ينتمي إلى OpenAI Plugin، بينما يتم اختيار
  Plugin app-server المضمّن الخاص بـ Codex عبر `embeddedHarness.runtime: "codex"` أو
  مراجع النماذج القديمة `codex/*`

## فتحات Plugins (فئات حصرية)

بعض الفئات حصرية (يمكن أن يكون واحد فقط نشطًا في كل مرة):

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

| الفتحة           | ما الذي تتحكم به       | الافتراضي           |
| ---------------- | ---------------------- | ------------------- |
| `memory`         | Active Memory plugin   | `memory-core`       |
| `contextEngine`  | محرك السياق النشط      | `legacy` (مدمج)     |

## مرجع CLI

```bash
openclaw plugins list                       # جرد مضغوط
openclaw plugins list --enabled            # Plugins المحمّلة فقط
openclaw plugins list --verbose            # أسطر تفاصيل لكل Plugin
openclaw plugins list --json               # جرد قابل للقراءة آليًا
openclaw plugins inspect <id>              # تفاصيل معمّقة
openclaw plugins inspect <id> --json       # قابل للقراءة آليًا
openclaw plugins inspect --all             # جدول على مستوى المجموعة
openclaw plugins info <id>                 # اسم بديل لـ inspect
openclaw plugins doctor                    # تشخيصات

openclaw plugins install <package>         # تثبيت (ClawHub أولًا، ثم npm)
openclaw plugins install clawhub:<pkg>     # تثبيت من ClawHub فقط
openclaw plugins install <spec> --force    # الكتابة فوق تثبيت موجود
openclaw plugins install <path>            # تثبيت من مسار محلي
openclaw plugins install -l <path>         # ربط (من دون نسخ) للتطوير
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # تسجيل مواصفة npm المحلولة الدقيقة
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # تحديث Plugin واحد
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # تحديث الكل
openclaw plugins uninstall <id>          # إزالة سجلات الإعداد/التثبيت
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

تأتي Plugins المضمّنة مع OpenClaw. كثير منها مفعّل افتراضيًا (على سبيل المثال
موفّرو النماذج المضمّنون، وموفّرو الكلام المضمّنون، وPlugin المتصفح
المضمّن). أما Plugins المضمّنة الأخرى فلا تزال تتطلب `openclaw plugins enable <id>`.

يقوم `--force` بالكتابة فوق Plugin مثبت أو حزمة hook موجودة في مكانها. استخدم
`openclaw plugins update <id-or-npm-spec>` للترقيات الروتينية لـ Plugins npm
المتعقبة. لا يتم دعمه مع `--link`، الذي يعيد استخدام مسار المصدر بدلًا
من النسخ إلى هدف تثبيت مُدار.

عندما يكون `plugins.allow` مضبوطًا بالفعل، يضيف `openclaw plugins install` معرّف
Plugin المثبت إلى قائمة السماح تلك قبل تفعيله، بحيث تصبح عمليات التثبيت
قابلة للتحميل مباشرة بعد إعادة التشغيل.

ينطبق `openclaw plugins update <id-or-npm-spec>` على عمليات التثبيت المتعقبة. يؤدي
تمرير مواصفة حزمة npm مع dist-tag أو إصدار دقيق إلى إعادة حل اسم الحزمة
إلى سجل Plugin المتعقَّب وتسجيل المواصفة الجديدة للتحديثات المستقبلية.
ويؤدي تمرير اسم الحزمة بدون إصدار إلى إعادة تثبيت مثبّت بإصدار دقيق إلى
خط الإصدار الافتراضي في السجل. إذا كان Plugin npm المثبّت يطابق بالفعل
الإصدار المحلول وهوية الأثر المسجلة، فسيتخطى OpenClaw التحديث
من دون تنزيل أو إعادة تثبيت أو إعادة كتابة للإعداد.

إن `--pin` خاص بـ npm فقط. ولا يتم دعمه مع `--marketplace`، لأن
عمليات التثبيت من marketplace تحفظ بيانات تعريف مصدر marketplace بدلًا من مواصفة npm.

إن `--dangerously-force-unsafe-install` هو تجاوز طارئ للحالات الإيجابية
الكاذبة من ماسح الشيفرة الخطرة المدمج. وهو يسمح باستمرار تثبيت Plugins
وتحديثاتها بعد نتائج `critical` المدمجة، لكنه مع ذلك
لا يتجاوز كتل سياسة Plugin `before_install` أو حظر فشل الفحص.

ينطبق علم CLI هذا على تدفقات تثبيت/تحديث Plugin فقط. أما عمليات تثبيت تبعيات Skills
المعتمدة على Gateway فتستخدم بدلًا من ذلك تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`، بينما
يبقى `openclaw skills install` تدفق تنزيل/تثبيت Skills منفصلًا عبر ClawHub.

تشارك الحِزم المتوافقة في نفس تدفق list/inspect/enable/disable الخاص بـ Plugin.
يشمل دعم وقت التشغيل الحالي Skills الخاصة بالحِزم، وcommand-skills الخاصة بـ Claude،
وقيم Claude الافتراضية في `settings.json`، والقيم الافتراضية لكلٍّ من
Claude `.lsp.json` و`lspServers` المعلنة في manifest، وcommand-skills الخاصة بـ Cursor،
وأدلة hooks المتوافقة مع Codex.

كما يبلّغ `openclaw plugins inspect <id>` عن قدرات الحِزم المكتشفة بالإضافة إلى
إدخالات خوادم MCP وLSP المدعومة أو غير المدعومة لـ Plugins المعتمدة على الحِزم.

يمكن أن تكون مصادر Marketplace اسم marketplace معروفًا لدى Claude من
`~/.claude/plugins/known_marketplaces.json`، أو جذر Marketplace محليًا أو
مسار `marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL
لمستودع GitHub، أو عنوان URL لـ git. بالنسبة إلى أسواق Marketplace البعيدة، يجب أن تبقى
إدخالات Plugin داخل مستودع Marketplace المستنسخ وأن تستخدم مصادر مسارات
نسبية فقط.

راجع [مرجع CLI الخاص بـ `openclaw plugins`](/ar/cli/plugins) للحصول على التفاصيل الكاملة.

## نظرة عامة على Plugin API

تُصدِّر Plugins Native كائن إدخال يعرّض `register(api)`. قد لا تزال
Plugins الأقدم تستخدم `activate(api)` كاسم بديل قديم، لكن ينبغي على Plugins الجديدة
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
ولا يزال المُحمِّل يعود إلى `activate(api)` بالنسبة إلى Plugins الأقدم،
لكن يجب على Plugins المضمّنة وPlugins الخارجية الجديدة اعتبار `register`
العقد العام.

طرائق التسجيل الشائعة:

| الطريقة                                 | ما الذي تسجله              |
| --------------------------------------- | -------------------------- |
| `registerProvider`                      | موفّر نموذج (LLM)          |
| `registerChannel`                       | قناة دردشة                 |
| `registerTool`                          | أداة وكيل                  |
| `registerHook` / `on(...)`              | hooks دورة الحياة          |
| `registerSpeechProvider`                | تحويل النص إلى كلام / STT  |
| `registerRealtimeTranscriptionProvider` | STT متدفق                  |
| `registerRealtimeVoiceProvider`         | صوت ثنائي الاتجاه في الوقت الفعلي |
| `registerMediaUnderstandingProvider`    | تحليل الصور/الصوت          |
| `registerImageGenerationProvider`       | توليد الصور                |
| `registerMusicGenerationProvider`       | توليد الموسيقى             |
| `registerVideoGenerationProvider`       | توليد الفيديو              |
| `registerWebFetchProvider`              | موفّر جلب / كشط الويب      |
| `registerWebSearchProvider`             | البحث على الويب            |
| `registerHttpRoute`                     | نقطة نهاية HTTP            |
| `registerCommand` / `registerCli`       | أوامر CLI                  |
| `registerContextEngine`                 | محرك السياق                |
| `registerService`                       | خدمة خلفية                 |

سلوك حارس hook بالنسبة إلى hooks دورة الحياة المكتوبة الأنواع:

- `before_tool_call`: تكون `{ block: true }` نهائية؛ ويتم تخطي المعالجات ذات الأولوية الأقل.
- `before_tool_call`: تكون `{ block: false }` بلا تأثير ولا تلغي حظرًا سابقًا.
- `before_install`: تكون `{ block: true }` نهائية؛ ويتم تخطي المعالجات ذات الأولوية الأقل.
- `before_install`: تكون `{ block: false }` بلا تأثير ولا تلغي حظرًا سابقًا.
- `message_sending`: تكون `{ cancel: true }` نهائية؛ ويتم تخطي المعالجات ذات الأولوية الأقل.
- `message_sending`: تكون `{ cancel: false }` بلا تأثير ولا تلغي إلغاءً سابقًا.

للاطلاع على السلوك الكامل لـ hooks المكتوبة الأنواع، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#hook-decision-semantics).

## ذو صلة

- [بناء Plugins](/ar/plugins/building-plugins) — أنشئ Plugin خاصًا بك
- [حِزم Plugins](/ar/plugins/bundles) — توافق حِزم Codex/Claude/Cursor
- [Plugin Manifest](/ar/plugins/manifest) — مخطط manifest
- [تسجيل الأدوات](/ar/plugins/building-plugins#registering-agent-tools) — أضف أدوات الوكيل داخل Plugin
- [Plugin Internals](/ar/plugins/architecture) — نموذج القدرات ومسار التحميل
- [Plugins المجتمع](/ar/plugins/community) — قوائم الجهات الخارجية
