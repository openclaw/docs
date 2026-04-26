---
read_when:
    - تثبيت Plugins أو إعدادها
    - فهم قواعد اكتشاف Plugins وتحميلها
    - العمل مع حزم Plugins المتوافقة مع Codex/Claude
sidebarTitle: Install and Configure
summary: ثبّت Plugins الخاصة بـ OpenClaw واضبطها وأدرها
title: Plugins
x-i18n:
    generated_at: "2026-04-26T11:42:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: b36ac0e71c95a1f5e3cf9edb1aa7175c04482c25dca72bbf12ad10bef17699c1
    source_path: tools/plugin.md
    workflow: 15
---

توسّع Plugins في OpenClaw بإمكانات جديدة: القنوات، وموفّري النماذج،
وبيئات تشغيل الوكيل، والأدوات، وSkills، والكلام، والنسخ الفوري،
والصوت الفوري، وفهم الوسائط، وإنشاء الصور، وإنشاء الفيديو، وجلب الويب، والبحث في الويب،
وغير ذلك. بعض Plugins **أساسية** (تأتي مع OpenClaw)، بينما يكون بعضها الآخر
**خارجيًا** (منشورًا على npm بواسطة المجتمع).

## البدء السريع

<Steps>
  <Step title="اعرف ما الذي تم تحميله">
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

    ثم اضبطه تحت `plugins.entries.\<id\>.config` في ملف الإعدادات لديك.

  </Step>
</Steps>

إذا كنت تفضّل التحكم الأصلي من داخل الدردشة، فعّل `commands.plugins: true` واستخدم:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

يستخدم مسار التثبيت أداة الحل نفسها التي يستخدمها CLI: مسار/أرشيف محلي، أو
`clawhub:<pkg>` صريح، أو مواصفة حزمة مجردة (ClawHub أولًا، ثم بديل npm).

إذا كانت الإعدادات غير صالحة، يفشل التثبيت عادةً بشكل مغلق ويوجهك إلى
`openclaw doctor --fix`. والاستثناء الوحيد للاسترداد هو مسار ضيق لإعادة تثبيت
Plugin مضمّن للـ Plugins التي تشترك في
`openclaw.install.allowInvalidConfigRecovery`.

لا تقوم تثبيتات OpenClaw المعبأة بتثبيت شجرة اعتمادات بيئة التشغيل لكل Plugin مضمّن
مسبقًا. فعندما يكون Plugin مضمّن مملوك لـ OpenClaw نشطًا من خلال
إعداد Plugin، أو إعداد قناة قديم، أو manifest مفعّل افتراضيًا،
فإن بدء التشغيل يصلح فقط اعتمادات بيئة التشغيل المعلنة لذلك Plugin قبل استيراده.
ولا تكفي حالة مصادقة القناة المحفوظة وحدها لتفعيل قناة مضمّنة من أجل إصلاح
اعتمادات بيئة التشغيل عند بدء Gateway.
ولا يزال التعطيل الصريح هو الغالب: `plugins.entries.<id>.enabled: false`،
و`plugins.deny`، و`plugins.enabled: false`، و`channels.<id>.enabled: false`
تمنع الإصلاح التلقائي لاعتمادات بيئة التشغيل المضمّنة لذلك Plugin/القناة.
كما أن `plugins.allow` غير الفارغ يقيّد أيضًا إصلاح اعتمادات بيئة التشغيل المضمّنة
المفعّلة افتراضيًا؛ بينما يظل التفعيل الصريح للقناة المضمّنة (`channels.<id>.enabled: true`)
قادرًا على إصلاح اعتمادات Plugin الخاصة بتلك القناة.
أما Plugins الخارجية ومسارات التحميل المخصصة فلا تزال تحتاج إلى التثبيت عبر
`openclaw plugins install`.

## أنواع Plugins

يتعرف OpenClaw على تنسيقين من Plugins:

| التنسيق     | آلية العمل                                                     | أمثلة                                                  |
| ----------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| **أصلي**    | `openclaw.plugin.json` + وحدة runtime؛ يُنفّذ داخل العملية      | Plugins الرسمية، وحزم npm المجتمعية                   |
| **Bundle**  | تخطيط متوافق مع Codex/Claude/Cursor؛ يُربط بميزات OpenClaw     | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

يظهر كلاهما ضمن `openclaw plugins list`. راجع [Plugin Bundles](/ar/plugins/bundles) لمعرفة تفاصيل bundle.

إذا كنت تكتب Plugin أصليًا، فابدأ من [بناء Plugins](/ar/plugins/building-plugins)
و[نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

## نقاط دخول الحزم

يجب أن تعلن حزم npm الخاصة بـ Plugins الأصلية عن `openclaw.extensions` في `package.json`.
ويجب أن يبقى كل إدخال داخل دليل الحزمة وأن يُحل إلى ملف
runtime قابل للقراءة، أو إلى ملف مصدر TypeScript مع ملف JavaScript مبنيّ
مستنتج مقابل له مثل `src/index.ts` إلى `dist/index.js`.

استخدم `openclaw.runtimeExtensions` عندما لا توجد ملفات runtime المنشورة في
المسارات نفسها الموجودة فيها إدخالات المصدر. وعند وجوده، يجب أن يحتوي
`runtimeExtensions` على إدخال واحد تمامًا لكل إدخال في `extensions`. وتؤدي
القوائم غير المتطابقة إلى فشل التثبيت واكتشاف Plugin بدلًا من الرجوع
بصمت إلى مسارات المصدر.

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

### قابلة للتثبيت (npm)

| Plugin          | الحزمة                 | الوثائق                               |
| --------------- | ---------------------- | ------------------------------------- |
| Matrix          | `@openclaw/matrix`     | [Matrix](/ar/channels/matrix)            |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/ar/channels/msteams)  |
| Nostr           | `@openclaw/nostr`      | [Nostr](/ar/channels/nostr)              |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/ar/plugins/voice-call)     |
| Zalo            | `@openclaw/zalo`       | [Zalo](/ar/channels/zalo)                |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/ar/plugins/zalouser)    |

### أساسية (تأتي مع OpenClaw)

<AccordionGroup>
  <Accordion title="موفّرو النماذج (مفعّلة افتراضيًا)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins الذاكرة">
    - `memory-core` — بحث الذاكرة المضمّن (الافتراضي عبر `plugins.slots.memory`)
    - `memory-lancedb` — ذاكرة طويلة الأمد تُثبَّت عند الطلب مع الاستدعاء/الالتقاط التلقائيين (اضبط `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="موفّرو الكلام (مفعّلون افتراضيًا)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="أخرى">
    - `browser` — Plugin المتصفح المضمّن لأداة المتصفح، وCLI ‏`openclaw browser`، وطريقة Gateway ‏`browser.request`، وruntime المتصفح، وخدمة التحكم الافتراضية بالمتصفح (مفعّل افتراضيًا؛ عطّله قبل استبداله)
    - `copilot-proxy` — جسر VS Code Copilot Proxy ‏(معطّل افتراضيًا)
  </Accordion>
</AccordionGroup>

هل تبحث عن Plugins خارجية؟ راجع [Plugins المجتمع](/ar/plugins/community).

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

| الحقل           | الوصف                                                     |
| --------------- | --------------------------------------------------------- |
| `enabled`       | مفتاح التشغيل الرئيسي (الافتراضي: `true`)                |
| `allow`         | قائمة سماح للـ Plugin (اختيارية)                          |
| `deny`          | قائمة رفض للـ Plugin (اختيارية؛ والرفض هو الغالب)         |
| `load.paths`    | ملفات/أدلة Plugins إضافية                                 |
| `slots`         | محددات خانات حصرية (مثل `memory`، `contextEngine`)        |
| `entries.\<id\>` | مفاتيح تشغيل + إعدادات لكل Plugin                         |

تتطلب تغييرات الإعدادات **إعادة تشغيل Gateway**. وإذا كان Gateway يعمل مع
مراقبة الإعدادات + إعادة التشغيل داخل العملية مفعّلة (وهو المسار الافتراضي لـ `openclaw gateway`)،
فعادةً ما تُنفّذ إعادة التشغيل هذه تلقائيًا بعد لحظة من وصول كتابة الإعداد.
ولا يوجد مسار hot-reload مدعوم لشفرة runtime الأصلية لـ Plugin أو لخطافات
دورة الحياة؛ أعد تشغيل عملية Gateway التي تخدم القناة الحية قبل
أن تتوقع تشغيل شفرة `register(api)` المحدّثة، أو خطافات `api.on(...)`، أو الأدوات، أو الخدمات،
أو خطافات الموفّر/بيئة التشغيل.

يمثل `openclaw plugins list` لقطة محلية لسجل Plugin/الإعدادات. فوجود
Plugin بحالة `enabled` هناك يعني أن السجل المحفوظ والإعدادات الحالية يسمحان
للـ Plugin بالمشاركة. لكنه لا يثبت أن Gateway البعيد العامل بالفعل
أُعيد تشغيله إلى شفرة Plugin نفسها. وفي إعدادات VPS/الحاويات التي تستخدم
عمليات تغليف، أرسل عمليات إعادة التشغيل إلى العملية الفعلية `openclaw gateway run`،
أو استخدم `openclaw gateway restart` مقابل Gateway العامل.

<Accordion title="حالات Plugin: معطّل مقابل مفقود مقابل غير صالح">
  - **معطّل**: Plugin موجود لكن قواعد التفعيل أوقفته. تبقى الإعدادات محفوظة.
  - **مفقود**: تشير الإعدادات إلى معرّف Plugin لم يعثر عليه الاكتشاف.
  - **غير صالح**: Plugin موجود لكن إعداداته لا تطابق المخطط المعلن.
</Accordion>

## الاكتشاف والأولوية

يفحص OpenClaw Plugins بهذا الترتيب (وأول تطابق هو الفائز):

<Steps>
  <Step title="مسارات الإعدادات">
    `plugins.load.paths` — مسارات ملفات أو أدلة صريحة. وتُتجاهل المسارات التي تشير
    مرة أخرى إلى أدلة Plugins المضمّنة الخاصة بحزمة OpenClaw نفسها؛ شغّل
    `openclaw doctor --fix` لإزالة تلك الأسماء المستعارة القديمة.
  </Step>

  <Step title="Plugins مساحة العمل">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins العامة">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins المضمّنة">
    تأتي مع OpenClaw. كثير منها مفعّل افتراضيًا (موفّرو النماذج، والكلام).
    بينما يتطلب بعضها الآخر تفعيلًا صريحًا.
  </Step>
</Steps>

تقوم التثبيتات المعبأة وصور Docker عادةً بحل Plugins المضمّنة من
شجرة `dist/extensions` المبنية. وإذا جرى bind-mount لدليل مصدر Plugin مضمّن
فوق مسار المصدر المعبأ المطابق، مثل
`/app/extensions/synology-chat`، فإن OpenClaw يعامل دليل المصدر المركّب هذا
على أنه تراكب مصدر مضمّن ويكتشفه قبل الحزمة المضمّنة
`/app/dist/extensions/synology-chat`. ويبقي هذا حلقات الصيانة في الحاويات
عاملة من دون إعادة كل Plugin مضمّن إلى مصدر TypeScript.
اضبط `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` لفرض استخدام حزم dist المعبأة
حتى عند وجود تراكيبات تراكب للمصدر.

### قواعد التفعيل

- يؤدي `plugins.enabled: false` إلى تعطيل جميع Plugins
- تكون `plugins.deny` هي الغالبة دائمًا على allow
- يؤدي `plugins.entries.\<id\>.enabled: false` إلى تعطيل ذلك Plugin
- تكون Plugins ذات أصل مساحة العمل **معطّلة افتراضيًا** (ويجب تفعيلها صراحةً)
- تتبع Plugins المضمّنة المجموعة الافتراضية المفعّلة داخليًا ما لم يُجرَ تجاوزها
- يمكن للخانات الحصرية فرض تفعيل Plugin المحدد لتلك الخانة
- تُفعَّل بعض Plugins المضمّنة الاختيارية تلقائيًا عندما تسمّي الإعدادات
  واجهة يملكها Plugin، مثل مرجع نموذج الموفّر، أو إعداد القناة، أو runtime
  التسخير
- تحافظ مسارات Codex من عائلة OpenAI على حدود Plugins منفصلة:
  إذ ينتمي `openai-codex/*` إلى Plugin ‏OpenAI، بينما يُختار Plugin ‏Codex
  المضمّن لخادم التطبيق عبر `agentRuntime.id: "codex"` أو مراجع النماذج
  القديمة `codex/*`

## استكشاف أخطاء خطافات runtime وإصلاحها

إذا ظهر Plugin في `plugins list` لكن الآثار الجانبية لـ `register(api)` أو الخطافات
لا تعمل في حركة الدردشة الحية، فتحقق من هذه النقاط أولًا:

- شغّل `openclaw gateway status --deep --require-rpc` وأكد أن
  عنوان URL الخاص بـ Gateway النشط، وملف التعريف، ومسار الإعدادات، والعملية هي التي تقوم بتحريرها.
- أعد تشغيل Gateway الحي بعد تثبيت Plugin أو تغيير إعداداته أو شفرته. وفي الحاويات
  المغلّفة، قد يكون PID 1 مجرد مشرف؛ أعد تشغيل أو أرسل إشارة إلى العملية الفرعية
  `openclaw gateway run`.
- استخدم `openclaw plugins inspect <id> --json` لتأكيد تسجيلات الخطافات و
  بيانات التشخيص. وتحتاج خطافات المحادثة غير المضمّنة مثل `llm_input`،
  و`llm_output`، و`before_agent_finalize`، و`agent_end` إلى
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- بالنسبة إلى تبديل النماذج، فضّل `before_model_resolve`. إذ يعمل قبل حل
  النموذج لأدوار الوكيل؛ بينما لا يعمل `llm_output` إلا بعد أن تنتج محاولة
  النموذج مخرجات المساعد.
- وللحصول على دليل على نموذج الجلسة الفعلي، استخدم `openclaw sessions` أو
  واجهات الجلسة/الحالة في Gateway، وعند تصحيح حمولات الموفّر، ابدأ
  Gateway باستخدام `--raw-stream --raw-stream-path <path>`.

### تكرار ملكية القناة أو الأداة

الأعراض:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

هذا يعني أن أكثر من Plugin مفعّل يحاول امتلاك القناة نفسها،
أو تدفق الإعداد نفسه، أو اسم الأداة نفسه. والسبب الأكثر شيوعًا هو وجود Plugin قناة خارجي
مثبّت إلى جانب Plugin مضمّن يوفّر الآن معرّف القناة نفسه.

خطوات التصحيح:

- شغّل `openclaw plugins list --enabled --verbose` لرؤية كل Plugin مفعّل
  ومصدره.
- شغّل `openclaw plugins inspect <id> --json` لكل Plugin مشتبه به
  وقارن بين `channels` و`channelConfigs` و`tools` وبيانات التشخيص.
- شغّل `openclaw plugins registry --refresh` بعد تثبيت أو إزالة
  حزم Plugins حتى تعكس البيانات الوصفية المحفوظة التثبيت الحالي.
- أعد تشغيل Gateway بعد تغييرات التثبيت أو السجل أو الإعدادات.

خيارات الإصلاح:

- إذا كان أحد Plugins يستبدل آخر عمدًا للمعرّف نفسه للقناة، فيجب على
  Plugin المفضّل أن يعلن عن `channelConfigs.<channel-id>.preferOver` مع
  معرّف Plugin ذي الأولوية الأقل. راجع [/plugins/manifest#replacing-another-channel-plugin](/ar/plugins/manifest#replacing-another-channel-plugin).
- إذا كان التكرار غير مقصود، فعطّل أحد الجانبين عبر
  `plugins.entries.<plugin-id>.enabled: false` أو أزل تثبيت Plugin القديم.
- إذا كنت قد فعّلت Plugins كليهما صراحةً، فإن OpenClaw يحتفظ بهذا الطلب
  ويبلّغ عن التعارض. اختر مالكًا واحدًا للقناة أو أعد تسمية الأدوات المملوكة لـ Plugin
  حتى تكون واجهة runtime غير ملتبسة.

## خانات Plugin ‏(فئات حصرية)

بعض الفئات حصرية (واحد فقط يمكن أن يكون نشطًا في الوقت نفسه):

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

| الخانة          | ما الذي تتحكم به      | الافتراضي           |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin الذاكرة النشط  | `memory-core`       |
| `contextEngine` | محرّك السياق النشط    | `legacy` ‏(مضمّن)   |

## مرجع CLI

```bash
openclaw plugins list                       # قائمة مختصرة
openclaw plugins list --enabled            # Plugins المفعّلة فقط
openclaw plugins list --verbose            # أسطر تفاصيل لكل Plugin
openclaw plugins list --json               # قائمة مقروءة آليًا
openclaw plugins inspect <id>              # تفاصيل عميقة
openclaw plugins inspect <id> --json       # مقروء آليًا
openclaw plugins inspect --all             # جدول على مستوى الأسطول
openclaw plugins info <id>                 # اسم مستعار لـ inspect
openclaw plugins doctor                    # تشخيصات
openclaw plugins registry                  # فحص حالة السجل المحفوظ
openclaw plugins registry --refresh        # إعادة بناء السجل المحفوظ
openclaw doctor --fix                      # إصلاح حالة سجل Plugin

openclaw plugins install <package>         # تثبيت (ClawHub أولًا، ثم npm)
openclaw plugins install clawhub:<pkg>     # تثبيت من ClawHub فقط
openclaw plugins install <spec> --force    # الكتابة فوق التثبيت الموجود
openclaw plugins install <path>            # تثبيت من مسار محلي
openclaw plugins install -l <path>         # ربط (من دون نسخ) للتطوير
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # تسجيل مواصفة npm المحلولة الدقيقة
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # تحديث Plugin واحد
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # تحديث الكل
openclaw plugins uninstall <id>          # إزالة الإعدادات وسجلات فهرس Plugin
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

تأتي Plugins المضمّنة مع OpenClaw. وكثير منها مفعّل افتراضيًا (على سبيل المثال
موفّرو النماذج المضمّنون، وموفّرو الكلام المضمّنون، وPlugin المتصفح
المضمّن). بينما لا تزال Plugins المضمّنة الأخرى تتطلب `openclaw plugins enable <id>`.

يؤدي `--force` إلى الكتابة فوق Plugin أو حزمة خطافات مثبّتة موجودة في مكانها. استخدم
`openclaw plugins update <id-or-npm-spec>` للترقيات الروتينية الخاصة بـ Plugins
المتتبعة على npm. ولا يكون مدعومًا مع `--link`، الذي يعيد استخدام مسار المصدر بدلًا
من النسخ فوق هدف تثبيت مُدار.

عندما يكون `plugins.allow` مضبوطًا بالفعل، يضيف `openclaw plugins install`
معرّف Plugin المثبّت إلى قائمة السماح تلك قبل تفعيله. وإذا كان معرّف Plugin نفسه
موجودًا في `plugins.deny`، فإن التثبيت يزيل إدخال الرفض القديم هذا بحيث يصبح
التثبيت الصريح قابلاً للتحميل فورًا بعد إعادة التشغيل.

يحتفظ OpenClaw بسجل محلي محفوظ للـ Plugins بوصفه نموذج القراءة الباردة
لقائمة Plugins، وملكية المساهمات، وتخطيط بدء التشغيل. وتُحدِّث تدفقات التثبيت والتحديث
وإلغاء التثبيت والتفعيل والتعطيل ذلك السجل بعد تغيير حالة Plugin.
ويحتفظ الملف نفسه `plugins/installs.json` ببيانات وصفية متينة للتثبيت ضمن
`installRecords` على المستوى الأعلى، وبيانات manifest وصفية قابلة لإعادة البناء ضمن `plugins`. وإذا
كان السجل مفقودًا أو قديمًا أو غير صالح، فإن `openclaw plugins registry
--refresh` يعيد بناء عرض manifest الخاص به من سجلات التثبيت، وسياسة الإعدادات،
وبيانات manifest/package الوصفية من دون تحميل وحدات runtime الخاصة بـ Plugin.
يُطبَّق `openclaw plugins update <id-or-npm-spec>` على التثبيتات المتتبعة.
ويؤدي تمرير مواصفة حزمة npm مع dist-tag أو إصدار دقيق إلى حل اسم الحزمة
مرة أخرى إلى سجل Plugin المتتبع وتسجيل المواصفة الجديدة للتحديثات المستقبلية.
ويؤدي تمرير اسم الحزمة من دون إصدار إلى إعادة تثبيت دقيق مثبّت إلى
خط الإصدار الافتراضي في السجل. وإذا كان Plugin المثبّت من npm يطابق بالفعل
الإصدار المحلول وهوية العنصر المسجّلة، فإن OpenClaw يتخطى التحديث
من دون تنزيل أو إعادة تثبيت أو إعادة كتابة الإعدادات.

`--pin` خاص بـ npm فقط. وهو غير مدعوم مع `--marketplace`، لأن
تثبيتات marketplace تحفظ بيانات وصفية لمصدر marketplace بدلًا من مواصفة npm.

يُعد `--dangerously-force-unsafe-install` تجاوزًا طارئًا من نوع break-glass للإيجابيات الكاذبة
من الماسح المضمّن للشفرة الخطرة. وهو يسمح لتثبيتات Plugins
وتحديثاتها بالاستمرار بعد النتائج المضمّنة من النوع `critical`، لكنه مع ذلك
لا يتجاوز حظر سياسة Plugin في `before_install` أو حظر فشل الفحص.

يُطبَّق علم CLI هذا على تدفقات تثبيت/تحديث Plugin فقط. أما تثبيتات اعتمادات Skills
المدعومة من Gateway فتستخدم بدلًا من ذلك تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`، بينما
يبقى `openclaw skills install` هو تدفق التنزيل/التثبيت المنفصل الخاص بـ Skills من ClawHub.

تشارك الحزم المتوافقة في تدفق list/inspect/enable/disable نفسه للـ Plugin.
ويشمل دعم runtime الحالي Skills الخاصة بالحزم، وClaude command-skills،
وإعدادات Claude الافتراضية في `settings.json`، والقيم الافتراضية لـ Claude ‏`.lsp.json` و
`lspServers` المعلنة في manifest، وCursor command-skills، ودلائل
خطافات Codex المتوافقة.

كما يبلّغ `openclaw plugins inspect <id>` عن إمكانات الحزم المكتشفة، بالإضافة إلى
إدخالات MCP وLSP server المدعومة أو غير المدعومة الخاصة بالـ Plugins المعتمدة على الحزم.

يمكن أن تكون مصادر marketplace اسم marketplace معروفًا لـ Claude من
`~/.claude/plugins/known_marketplaces.json`، أو جذر marketplace محليًا أو
مسار `marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL
لمستودع GitHub، أو عنوان URL لـ git. وبالنسبة إلى marketplaces البعيدة، يجب أن تبقى
إدخالات Plugin داخل مستودع marketplace المستنسخ وأن تستخدم مصادر مسارات نسبية فقط.

راجع [مرجع CLI الخاص بـ `openclaw plugins`](/ar/cli/plugins) للاطلاع على التفاصيل الكاملة.

## نظرة عامة على Plugin API

تُصدّر Plugins الأصلية كائن إدخال يعرّض `register(api)`. ولا تزال
Plugins الأقدم قادرة على استخدام `activate(api)` كاسم مستعار قديم، لكن يجب على Plugins
الجديدة استخدام `register`.

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

يحمّل OpenClaw كائن الإدخال ويستدعي `register(api)` أثناء
تفعيل Plugin. ولا يزال المُحمِّل يعود إلى `activate(api)` من أجل Plugins الأقدم،
لكن يجب على Plugins المضمّنة وPlugins الخارجية الجديدة اعتبار `register` هو العقد العام.

يُخبر `api.registrationMode` Plugin بسبب تحميل إدخاله:

| الوضع            | المعنى                                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`           | تفعيل runtime. سجّل الأدوات، والخطافات، والخدمات، والأوامر، والمسارات، والآثار الجانبية الحية الأخرى.                           |
| `discovery`      | اكتشاف قدرات للقراءة فقط. سجّل الموفّرين والبيانات الوصفية؛ وقد تُحمَّل شفرة إدخال Plugin الموثوق بها، لكن تجاوز الآثار الجانبية الحية. |
| `setup-only`     | تحميل بيانات وصفية لإعداد القناة عبر إدخال إعداد خفيف الوزن.                                                                    |
| `setup-runtime`  | تحميل إعداد القناة الذي يحتاج أيضًا إلى إدخال runtime.                                                                          |
| `cli-metadata`   | جمع بيانات وصفية لأوامر CLI فقط.                                                                                                |

يجب على إدخالات Plugin التي تفتح مقابس، أو قواعد بيانات، أو عمّالًا في الخلفية، أو عملاء
طويلي العمر، أن تحرس هذه الآثار الجانبية بشرط `api.registrationMode === "full"`.
وتُخزَّن عمليات تحميل الاكتشاف مؤقتًا بشكل منفصل عن عمليات التحميل الخاصة بالتفعيل،
ولا تستبدل سجل Gateway العامل. والاكتشاف غير مفعِّل، لكنه ليس خاليًا من الاستيراد:
قد يقيّم OpenClaw إدخال Plugin الموثوق به أو وحدة Plugin القناة لبناء
اللقطة. لذا حافظ على المستويات العليا للوحدات خفيفة ومن دون آثار جانبية، وانقل
عملاء الشبكة، والعمليات الفرعية، والمستمعين، وقراءات بيانات الاعتماد، وبدء تشغيل الخدمات
خلف مسارات runtime الكاملة.

طرق التسجيل الشائعة:

| الطريقة                                  | ما الذي تسجله             |
| --------------------------------------- | ------------------------- |
| `registerProvider`                      | موفّر نموذج (LLM)         |
| `registerChannel`                       | قناة دردشة                |
| `registerTool`                          | أداة وكيل                 |
| `registerHook` / `on(...)`              | خطافات دورة الحياة        |
| `registerSpeechProvider`                | تحويل النص إلى كلام / STT |
| `registerRealtimeTranscriptionProvider` | STT متدفق                 |
| `registerRealtimeVoiceProvider`         | صوت فوري ثنائي الاتجاه    |
| `registerMediaUnderstandingProvider`    | تحليل الصور/الصوت         |
| `registerImageGenerationProvider`       | إنشاء الصور               |
| `registerMusicGenerationProvider`       | إنشاء الموسيقى            |
| `registerVideoGenerationProvider`       | إنشاء الفيديو             |
| `registerWebFetchProvider`              | موفّر جلب / كشط الويب     |
| `registerWebSearchProvider`             | البحث في الويب            |
| `registerHttpRoute`                     | نقطة نهاية HTTP           |
| `registerCommand` / `registerCli`       | أوامر CLI                 |
| `registerContextEngine`                 | محرّك السياق              |
| `registerService`                       | خدمة في الخلفية           |

سلوك حراسة الخطافات لخطافات دورة الحياة المكتوبة الأنواع:

- `before_tool_call`: ‏`{ block: true }` نهائي؛ وتُتخطى المعالجات ذات الأولوية الأقل.
- `before_tool_call`: ‏`{ block: false }` لا يفعل شيئًا ولا يمسح حظرًا سابقًا.
- `before_install`: ‏`{ block: true }` نهائي؛ وتُتخطى المعالجات ذات الأولوية الأقل.
- `before_install`: ‏`{ block: false }` لا يفعل شيئًا ولا يمسح حظرًا سابقًا.
- `message_sending`: ‏`{ cancel: true }` نهائي؛ وتُتخطى المعالجات ذات الأولوية الأقل.
- `message_sending`: ‏`{ cancel: false }` لا يفعل شيئًا ولا يمسح إلغاءً سابقًا.

تعيد عمليات خادم تطبيق Codex الأصلية وصل أحداث الأدوات الأصلية في Codex إلى
واجهة الخطافات هذه. ويمكن للـ Plugins حظر أدوات Codex الأصلية عبر `before_tool_call`،
ومراقبة النتائج عبر `after_tool_call`، والمشاركة في موافقات
`PermissionRequest` الخاصة بـ Codex. ولا يعيد الجسر بعدُ كتابة وسائط الأدوات الأصلية في Codex.
ويكمن الحد الدقيق لدعم runtime الخاص بـ Codex في
[عقد دعم v1 لتسخير Codex](/ar/plugins/codex-harness#v1-support-contract).

للاطلاع على السلوك الكامل المكتوب الأنواع للخطافات، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#hook-decision-semantics).

## ذو صلة

- [بناء Plugins](/ar/plugins/building-plugins) — أنشئ Plugin خاصًا بك
- [Plugin Bundles](/ar/plugins/bundles) — توافق حزم Codex/Claude/Cursor
- [Plugin manifest](/ar/plugins/manifest) — مخطط manifest
- [تسجيل الأدوات](/ar/plugins/building-plugins#registering-agent-tools) — أضف أدوات الوكيل داخل Plugin
- [الدواخل الخاصة بـ Plugin](/ar/plugins/architecture) — نموذج الإمكانات وخط أنابيب التحميل
- [Plugins المجتمع](/ar/plugins/community) — قوائم الجهات الخارجية
