---
read_when:
    - تريد فهم الأدوات التي يوفرها OpenClaw
    - تحتاج إلى تهيئة الأدوات أو السماح بها أو منعها
    - أنت تقرر بين الأدوات المضمّنة وSkills وPlugins
summary: 'نظرة عامة على أدوات OpenClaw وPlugins: ما الذي يمكن للوكيل فعله وكيفية توسيعه'
title: الأدوات وPlugins
x-i18n:
    generated_at: "2026-04-26T11:41:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47cc0e2de5688328f7c11fcf86c0a2262b488c277f48416f584f5c7913f750c4
    source_path: tools/index.md
    workflow: 15
---

كل ما يفعله الوكيل خارج توليد النص يحدث عبر **الأدوات**.
فالأدوات هي الطريقة التي يقرأ بها الوكيل الملفات، ويشغّل الأوامر، ويتصفح الويب، ويرسل
الرسائل، ويتفاعل مع الأجهزة.

## الأدوات وSkills وPlugins

يحتوي OpenClaw على ثلاث طبقات تعمل معًا:

<Steps>
  <Step title="الأدوات هي ما يستدعيه الوكيل">
    الأداة هي دالة typed يمكن للوكيل استدعاؤها (مثل `exec` و`browser` و
    `web_search` و`message`). ويشحن OpenClaw مجموعة من **الأدوات المضمّنة** كما
    يمكن للـ Plugins تسجيل أدوات إضافية.

    يرى الوكيل الأدوات على شكل تعريفات دوال مهيكلة تُرسل إلى API الخاصة بالنموذج.

  </Step>

  <Step title="Skills تعلّم الوكيل متى وكيف">
    Skill هي ملف markdown ‏(`SKILL.md`) يُحقن في موجه النظام.
    وتمنح Skills الوكيل سياقًا وقيودًا وإرشادات خطوة بخطوة من أجل
    استخدام الأدوات بفعالية. وتوجد Skills في مساحة العمل الخاصة بك، أو في المجلدات المشتركة،
    أو تُشحن داخل Plugins.

    [مرجع Skills](/ar/tools/skills) | [إنشاء Skills](/ar/tools/creating-skills)

  </Step>

  <Step title="Plugins تجمع كل شيء معًا">
    Plugin هي حزمة يمكنها تسجيل أي مزيج من القدرات:
    القنوات، ومزوّدو النماذج، والأدوات، وSkills، والكلام، والنسخ الفوري،
    والصوت الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو،
    وجلب الويب، والبحث في الويب، وغير ذلك. بعض Plugins **أساسية** (تُشحن مع
    OpenClaw)، وبعضها الآخر **خارجي** (تنشره community على npm).

    [تثبيت Plugins وتهيئتها](/ar/tools/plugin) | [ابنِ Plugin خاصة بك](/ar/plugins/building-plugins)

  </Step>
</Steps>

## الأدوات المضمّنة

تُشحن هذه الأدوات مع OpenClaw وتكون متاحة دون تثبيت أي Plugins:

| الأداة                                     | ما الذي تفعله                                                      | الصفحة                                                       |
| ------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| `exec` / `process`                         | تشغيل أوامر shell وإدارة العمليات في الخلفية                      | [Exec](/ar/tools/exec)، [Exec Approvals](/ar/tools/exec-approvals) |
| `code_execution`                           | تشغيل تحليل Python بعيد داخل sandbox                              | [Code Execution](/ar/tools/code-execution)                      |
| `browser`                                  | التحكم في متصفح Chromium (تنقل، نقر، لقطات شاشة)                  | [Browser](/ar/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | البحث في الويب، والبحث في منشورات X، وجلب محتوى الصفحات           | [الويب](/ar/tools/web)، [Web Fetch](/ar/tools/web-fetch)           |
| `read` / `write` / `edit`                  | إدخال/إخراج الملفات في مساحة العمل                                |                                                              |
| `apply_patch`                              | رقع ملفات متعددة المقاطع                                           | [Apply Patch](/ar/tools/apply-patch)                            |
| `message`                                  | إرسال الرسائل عبر جميع القنوات                                     | [Agent Send](/ar/tools/agent-send)                              |
| `canvas`                                   | قيادة Canvas الخاصة بالعقدة (عرض، eval، snapshot)                 |                                                              |
| `nodes`                                    | اكتشاف الأجهزة المقترنة واستهدافها                                 |                                                              |
| `cron` / `gateway`                         | إدارة المهام المجدولة؛ وفحص gateway أو ترقيعها أو إعادة تشغيلها أو تحديثها |                                                              |
| `image` / `image_generate`                 | تحليل الصور أو توليدها                                             | [توليد الصور](/ar/tools/image-generation)                       |
| `music_generate`                           | توليد مسارات موسيقية                                               | [توليد الموسيقى](/ar/tools/music-generation)                    |
| `video_generate`                           | توليد فيديوهات                                                     | [توليد الفيديو](/ar/tools/video-generation)                     |
| `tts`                                      | تحويل نص إلى كلام دفعة واحدة                                       | [TTS](/ar/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | إدارة الجلسات، والحالة، وorchestration للوكلاء الفرعيين           | [الوكلاء الفرعيون](/ar/tools/subagents)                         |
| `session_status`                           | قراءة خفيفة على نمط `/status` وتجاوز نموذج الجلسة                 | [أدوات الجلسة](/ar/concepts/session-tool)                       |

في أعمال الصور، استخدم `image` للتحليل و`image_generate` للتوليد أو التعديل. وإذا كنت تستهدف `openai/*` أو `google/*` أو `fal/*` أو أي مزوّد صور غير افتراضي آخر، فقم أولًا بتهيئة مصادقة/API key الخاصة بذلك المزوّد.

في أعمال الموسيقى، استخدم `music_generate`. وإذا كنت تستهدف `google/*` أو `minimax/*` أو أي مزوّد موسيقى غير افتراضي آخر، فقم أولًا بتهيئة مصادقة/API key الخاصة بذلك المزوّد.

في أعمال الفيديو، استخدم `video_generate`. وإذا كنت تستهدف `qwen/*` أو أي مزوّد فيديو غير افتراضي آخر، فقم أولًا بتهيئة مصادقة/API key الخاصة بذلك المزوّد.

أما بالنسبة إلى توليد الصوت المدفوع بسير العمل، فاستخدم `music_generate` عندما تسجل
Plugin مثل ComfyUI هذه الأداة. وهذا منفصل عن `tts` التي تُستخدم لتحويل النص إلى كلام.

تُعد `session_status` أداة الحالة/القراءة الخفيفة ضمن مجموعة الجلسات.
فهي تجيب عن أسئلة على نمط `/status` حول الجلسة الحالية، ويمكنها
اختياريًا تعيين تجاوز للنموذج لكل جلسة؛ وتؤدي القيمة `model=default` إلى مسح ذلك
التجاوز. ومثل `/status`، يمكنها ملء عدادات tokens/cache المتفرقة ووسم
النموذج النشط أثناء runtime من أحدث إدخال استخدام في السجل النصي.

تُعد `gateway` أداة runtime الخاصة بالمشرف فقط لعمليات gateway:

- `config.schema.lookup` لشجرة فرعية واحدة من الإعدادات محصورة بالمسار قبل التعديل
- `config.get` للحصول على لقطة الإعدادات الحالية + hash
- `config.patch` لتحديثات الإعدادات الجزئية مع إعادة التشغيل
- `config.apply` فقط لاستبدال الإعدادات بالكامل
- `update.run` لإجراء self-update صريح + إعادة تشغيل

بالنسبة إلى التغييرات الجزئية، فضّل `config.schema.lookup` ثم `config.patch`. واستخدم
`config.apply` فقط عندما تنوي استبدال الإعدادات كاملةً.
وللحصول على وثائق إعدادات أوسع، اقرأ [التهيئة](/ar/gateway/configuration) و
[مرجع التهيئة](/ar/gateway/configuration-reference).
كما ترفض الأداة أيضًا تغيير `tools.exec.ask` أو `tools.exec.security`؛
وتُطبَّع الأسماء البديلة القديمة `tools.bash.*` إلى مسارات exec المحمية نفسها.

### أدوات توفّرها Plugins

يمكن للـ Plugins تسجيل أدوات إضافية. ومن الأمثلة:

- [Diffs](/ar/tools/diffs) — عارض ومُصيّر للفروقات
- [LLM Task](/ar/tools/llm-task) — خطوة LLM تُخرج JSON فقط من أجل المخرجات المهيكلة
- [Lobster](/ar/tools/lobster) — runtime لسير عمل typed مع موافقات قابلة للاستئناف
- [توليد الموسيقى](/ar/tools/music-generation) — أداة `music_generate` مشتركة مع مزوّدين مدفوعين بسير العمل
- [OpenProse](/ar/prose) — orchestration لسير العمل بنهج markdown-first
- [Tokenjuice](/ar/tools/tokenjuice) — ضغط نتائج أدوات `exec` و`bash` المليئة بالضوضاء

## تهيئة الأدوات

### قوائم السماح والمنع

تحكم في الأدوات التي يمكن للوكيل استدعاؤها عبر `tools.allow` / `tools.deny` في
الإعدادات. ويغلب المنع دائمًا على السماح.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

يفشل OpenClaw بشكل مغلق عندما تُحل قائمة السماح الصريحة إلى عدم وجود أدوات قابلة للاستدعاء.
فعلى سبيل المثال، لا تعمل `tools.allow: ["query_db"]` إلا إذا كانت Plugin محمّلة
تسجل فعلًا `query_db`. وإذا لم تطابق قائمة السماح أي أداة مضمّنة أو Plugin أو أداة MCP مضمّنة،
فإن التشغيل يتوقف قبل استدعاء النموذج بدل الاستمرار
كتشغيل نصي فقط يمكن أن يهلوس بنتائج الأدوات.

### ملفات تعريف الأدوات

يضبط `tools.profile` قائمة سماح أساسية قبل تطبيق `allow`/`deny`.
التجاوز لكل وكيل: `agents.list[].tools.profile`.

| الملف التعريفي | ما الذي يتضمنه                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `full`         | بلا تقييد (مثل عدم التعيين)                                                                                                                      |
| `coding`       | `group:fs` و`group:runtime` و`group:web` و`group:sessions` و`group:memory` و`cron` و`image` و`image_generate` و`music_generate` و`video_generate` |
| `messaging`    | `group:messaging` و`sessions_list` و`sessions_history` و`sessions_send` و`session_status`                                                         |
| `minimal`      | `session_status` فقط                                                                                                                              |

يتضمن `coding` أدوات ويب خفيفة (`web_search` و`web_fetch` و`x_search`)
لكن ليس أداة التحكم الكاملة في المتصفح. ويمكن لأتمتة المتصفح أن تقود جلسات
حقيقية وملفات تعريف مسجَّل الدخول فيها، لذا أضفها صراحةً باستخدام
`tools.alsoAllow: ["browser"]` أو
`agents.list[].tools.alsoAllow: ["browser"]` لكل وكيل.

كما تسمح ملفا التعريف `coding` و`messaging` أيضًا بأدوات bundle MCP المهيأة
تحت مفتاح Plugin ‏`bundle-mcp`. أضف `tools.deny: ["bundle-mcp"]` عندما
تريد لملف تعريفي أن يحتفظ بأدواته المضمّنة العادية لكنه يخفي جميع أدوات MCP المهيأة.
أما ملف التعريف `minimal` فلا يتضمن أدوات bundle MCP.

### مجموعات الأدوات

استخدم اختصارات `group:*` في قوائم السماح/المنع:

| المجموعة           | الأدوات                                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec، process، code_execution ‏(`bash` مقبولة كاسم بديل لـ `exec`)                                         |
| `group:fs`         | read، write، edit، apply_patch                                                                              |
| `group:sessions`   | sessions_list، sessions_history، sessions_send، sessions_spawn، sessions_yield، subagents، session_status |
| `group:memory`     | memory_search، memory_get                                                                                   |
| `group:web`        | web_search، x_search، web_fetch                                                                             |
| `group:ui`         | browser، canvas                                                                                             |
| `group:automation` | cron، gateway                                                                                               |
| `group:messaging`  | message                                                                                                     |
| `group:nodes`      | nodes                                                                                                       |
| `group:agents`     | agents_list                                                                                                 |
| `group:media`      | image، image_generate، music_generate، video_generate، tts                                                  |
| `group:openclaw`   | جميع أدوات OpenClaw المضمّنة (باستثناء أدوات Plugins)                                                       |

تعيد `sessions_history` عرض recall محدودًا ومصفّى من ناحية السلامة. فهي تزيل
وسوم التفكير، وبنية `<relevant-memories>`، وحمولات XML الخاصة باستدعاءات الأدوات المكتوبة كنص عادي
(بما في ذلك `<tool_call>...</tool_call>`،
و`<function_call>...</function_call>`،
و`<tool_calls>...</tool_calls>`،
و`<function_calls>...</function_calls>`،
وكتل استدعاءات الأدوات المقتطعة)، والبنية الهابطة الخاصة باستدعاءات الأدوات،
ورموز التحكم بالنموذج المسرّبة بصيغ ASCII/العرض الكامل، وXML المشوّهة الخاصة باستدعاءات أدوات MiniMax من نص المساعد، ثم تطبق
التنقيح/الاقتطاع وإمكانية وجود عناصر نائبة للصفوف كبيرة الحجم بدلًا من أن تعمل
كتفريغ خام للسجل النصي.

### قيود خاصة بكل مزوّد

استخدم `tools.byProvider` لتقييد الأدوات لمزوّدين محددين من دون
تغيير الإعدادات الافتراضية العامة:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
