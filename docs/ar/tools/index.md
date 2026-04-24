---
read_when:
    - أنت تريد فهم الأدوات التي يوفّرها OpenClaw
    - أنت تحتاج إلى إعداد الأدوات أو السماح بها أو منعها
    - أنت تقرر بين الأدوات المضمّنة، وSkills، وPlugins
summary: 'نظرة عامة على أدوات OpenClaw وPlugins: ما الذي يمكن للوكيل فعله وكيفية توسيعه'
title: الأدوات وPlugins
x-i18n:
    generated_at: "2026-04-24T08:09:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9ab57fcb1b58875866721fbadba63093827698ed980afeb14274da601b34f11
    source_path: tools/index.md
    workflow: 15
---

كل ما يفعله الوكيل إلى جانب توليد النص يحدث عبر **الأدوات**.
الأدوات هي الطريقة التي يقرأ بها الوكيل الملفات، ويشغّل الأوامر، ويتصفح الويب، ويرسل
الرسائل، ويتفاعل مع الأجهزة.

## الأدوات وSkills وPlugins

يحتوي OpenClaw على ثلاث طبقات تعمل معًا:

<Steps>
  <Step title="الأدوات هي ما يستدعيه الوكيل">
    الأداة هي دالة typed يمكن للوكيل استدعاؤها (مثل `exec` أو `browser`,
    أو `web_search`, أو `message`). يشحن OpenClaw مجموعة من **الأدوات المضمّنة** ويمكن
    للـ plugins تسجيل أدوات إضافية.

    يرى الوكيل الأدوات على أنها تعريفات دوال منظّمة تُرسل إلى API الخاصة بالنموذج.

  </Step>

  <Step title="Skills تعلّم الوكيل متى وكيف">
    Skill هي ملف Markdown (`SKILL.md`) يتم حقنه في مطالبة النظام.
    تمنح Skills الوكيل سياقًا، وقيودًا، وإرشادًا خطوة بخطوة من أجل
    استخدام الأدوات بفعالية. تعيش Skills في مساحة عملك، أو في مجلدات مشتركة،
    أو تُشحن داخل plugins.

    [مرجع Skills](/ar/tools/skills) | [إنشاء Skills](/ar/tools/creating-skills)

  </Step>

  <Step title="Plugins تجمع كل شيء معًا">
    Plugin هي حزمة يمكنها تسجيل أي تركيبة من القدرات:
    القنوات، ومزوّدو النماذج، والأدوات، وSkills، والنطق، والنسخ الفوري،
    والصوت الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو،
    وجلب الويب، والبحث في الويب، وغير ذلك. بعض plugins **أساسية** (تُشحن مع
    OpenClaw)، وبعضها الآخر **خارجي** (ينشره المجتمع على npm).

    [تثبيت plugins وإعدادها](/ar/tools/plugin) | [ابنِ Plugin الخاصة بك](/ar/plugins/building-plugins)

  </Step>
</Steps>

## الأدوات المضمّنة

تُشحن هذه الأدوات مع OpenClaw وتكون متاحة من دون تثبيت أي plugins:

| الأداة                                     | ما الذي تفعله                                                        | الصفحة                                                          |
| ------------------------------------------ | -------------------------------------------------------------------- | --------------------------------------------------------------- |
| `exec` / `process`                         | تشغيل أوامر shell، وإدارة العمليات الخلفية                          | [Exec](/ar/tools/exec), [Exec Approvals](/ar/tools/exec-approvals)    |
| `code_execution`                           | تشغيل تحليل Python بعيد داخل sandbox                                  | [تنفيذ الشيفرة](/ar/tools/code-execution)                          |
| `browser`                                  | التحكم في متصفح Chromium (تنقل، نقر، لقطة شاشة)                     | [Browser](/ar/tools/browser)                                       |
| `web_search` / `x_search` / `web_fetch`    | البحث في الويب، والبحث في منشورات X، وجلب محتوى الصفحة              | [Web](/ar/tools/web), [Web Fetch](/ar/tools/web-fetch)                |
| `read` / `write` / `edit`                  | إدخال/إخراج الملفات في مساحة العمل                                   |                                                                 |
| `apply_patch`                              | ترقيعات ملفات متعددة المقاطع                                         | [Apply Patch](/ar/tools/apply-patch)                               |
| `message`                                  | إرسال الرسائل عبر جميع القنوات                                       | [Agent Send](/ar/tools/agent-send)                                 |
| `canvas`                                   | التحكم في Canvas الخاصة بـ node (عرض، eval، snapshot)               |                                                                 |
| `nodes`                                    | اكتشاف الأجهزة المقترنة واستهدافها                                   |                                                                 |
| `cron` / `gateway`                         | إدارة الوظائف المجدولة؛ وفحص gateway أو ترقيعها أو إعادة تشغيلها أو تحديثها |                                                                 |
| `image` / `image_generate`                 | تحليل الصور أو توليدها                                               | [توليد الصور](/ar/tools/image-generation)                          |
| `music_generate`                           | توليد مقاطع موسيقية                                                  | [توليد الموسيقى](/ar/tools/music-generation)                       |
| `video_generate`                           | توليد الفيديوهات                                                     | [توليد الفيديو](/ar/tools/video-generation)                        |
| `tts`                                      | تحويل نص إلى كلام لمرة واحدة                                         | [TTS](/ar/tools/tts)                                               |
| `sessions_*` / `subagents` / `agents_list` | إدارة الجلسات، والحالة، وتنسيق الوكلاء الفرعيين                     | [الوكلاء الفرعيون](/ar/tools/subagents)                            |
| `session_status`                           | قراءة خفيفة على نمط `/status` وتجاوز نموذج الجلسة                    | [أدوات الجلسة](/ar/concepts/session-tool)                          |

بالنسبة إلى أعمال الصور، استخدم `image` للتحليل و`image_generate` للتوليد أو التحرير. وإذا استهدفت `openai/*` أو `google/*` أو `fal/*` أو أي مزوّد صور غير افتراضي آخر، فاضبط مصادقة ذلك المزوّد/مفتاح API أولًا.

بالنسبة إلى أعمال الموسيقى، استخدم `music_generate`. وإذا استهدفت `google/*` أو `minimax/*` أو أي مزوّد موسيقى غير افتراضي آخر، فاضبط مصادقة ذلك المزوّد/مفتاح API أولًا.

بالنسبة إلى أعمال الفيديو، استخدم `video_generate`. وإذا استهدفت `qwen/*` أو أي مزوّد فيديو غير افتراضي آخر، فاضبط مصادقة ذلك المزوّد/مفتاح API أولًا.

بالنسبة إلى توليد الصوت المعتمد على سير العمل، استخدم `music_generate` عندما تسجل
Plugin مثل ComfyUI هذه الأداة. وهذا منفصل عن `tts` التي تمثل تحويل النص إلى كلام.

تُعد `session_status` أداة الحالة/القراءة الخفيفة ضمن مجموعة الجلسات.
وهي تجيب عن أسئلة على نمط `/status` حول الجلسة الحالية ويمكنها
اختياريًا ضبط تجاوز للنموذج لكل جلسة؛ والقيمة `model=default` تمسح ذلك
التجاوز. وكما في `/status`، يمكنها إسناد عدادات sparse الخاصة بالرموز/التخزين المؤقت
وتسمية النموذج النشط وقت التشغيل من أحدث إدخال استخدام في transcript.

تمثل `gateway` أداة وقت التشغيل المخصصة للمالك فقط من أجل عمليات gateway:

- `config.schema.lookup` لشجرة إعداد فرعية واحدة محددة بالمسار قبل التحرير
- `config.get` من أجل لقطة الإعداد الحالية + hash
- `config.patch` للتحديثات الجزئية للإعداد مع إعادة التشغيل
- `config.apply` فقط من أجل استبدال الإعداد كاملًا
- `update.run` للتحديث الذاتي الصريح + إعادة التشغيل

بالنسبة إلى التغييرات الجزئية، فضّل `config.schema.lookup` ثم `config.patch`. واستخدم
`config.apply` فقط عندما تقصد عمدًا استبدال الإعداد كاملًا.
كما ترفض الأداة أيضًا تغيير `tools.exec.ask` أو `tools.exec.security`;
وتتم تسوية الأسماء البديلة القديمة `tools.bash.*` إلى مسارات exec المحمية نفسها.

### الأدوات التي توفرها plugins

يمكن للـ plugins تسجيل أدوات إضافية. بعض الأمثلة:

- [Diffs](/ar/tools/diffs) — عارض ومُخرِج diff
- [LLM Task](/ar/tools/llm-task) — خطوة LLM بصيغة JSON-only من أجل خرج منظم
- [Lobster](/ar/tools/lobster) — بيئة تشغيل سير عمل typed مع موافقات قابلة للاستئناف
- [Music Generation](/ar/tools/music-generation) — أداة `music_generate` مشتركة مع مزوّدين مدعومين بسير العمل
- [OpenProse](/ar/prose) — تنسيق سير عمل يعتمد على Markdown أولًا
- [Tokenjuice](/ar/tools/tokenjuice) — ضغط نتائج أدوات `exec` و`bash` المليئة بالضوضاء

## إعداد الأدوات

### قوائم السماح والمنع

تحكم في الأدوات التي يمكن للوكيل استدعاؤها عبر `tools.allow` / `tools.deny` في
الإعداد. وتفوز `deny` دائمًا على `allow`.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### ملفات تعريف الأدوات

يضبط `tools.profile` قائمة سماح أساسية قبل تطبيق `allow`/`deny`.
التجاوز لكل وكيل: `agents.list[].tools.profile`.

| ملف التعريف | ما الذي يتضمنه                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | لا قيود (مماثل لعدم الضبط)                                                                                                                      |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                       |
| `minimal`   | `session_status` فقط                                                                                                                            |

كما تسمح ملفات التعريف `coding` و`messaging` أيضًا بأدوات bundle MCP المُعدّة
تحت مفتاح plugin `bundle-mcp`. أضف `tools.deny: ["bundle-mcp"]` عندما
تريد أن يحتفظ ملف التعريف بأدواته المضمّنة العادية لكن يُخفي جميع أدوات MCP المُعدّة.
أما ملف التعريف `minimal` فلا يتضمن أدوات bundle MCP.

### مجموعات الأدوات

استخدم اختصارات `group:*` في قوائم السماح/المنع:

| المجموعة           | الأدوات                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` مقبولة كاسم بديل لـ `exec`)                                          |
| `group:fs`         | read, write, edit, apply_patch                                                                             |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status  |
| `group:memory`     | memory_search, memory_get                                                                                  |
| `group:web`        | web_search, x_search, web_fetch                                                                            |
| `group:ui`         | browser, canvas                                                                                            |
| `group:automation` | cron, gateway                                                                                              |
| `group:messaging`  | message                                                                                                    |
| `group:nodes`      | nodes                                                                                                      |
| `group:agents`     | agents_list                                                                                                |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                 |
| `group:openclaw`   | جميع أدوات OpenClaw المضمّنة (ويستثني أدوات الـ plugin)                                                    |

تعيد `sessions_history` عرض استدعاء محدودًا ومفلترًا أمنيًا. فهي تزيل
وسوم التفكير، وهيكلية `<relevant-memories>`, وحمولات XML النصية العادية لاستدعاءات الأدوات
(بما في ذلك `<tool_call>...</tool_call>`,
و`<function_call>...</function_call>`,
و`<tool_calls>...</tool_calls>`,
و`<function_calls>...</function_calls>`, وكتل استدعاءات الأدوات المقتطعة)،
وهيكلية استدعاءات الأدوات المخفَّضة، ورموز التحكم بالنموذج المتسربة بصيغة ASCII/العرض الكامل،
وXML استدعاءات الأدوات غير الصالح من MiniMax من نص المساعد، ثم تطبق
الحجب/الاقتطاع والعناصر النائبة المحتملة للصفوف كبيرة الحجم بدلًا من أن تعمل
كتفريغ transcript خام.

### قيود خاصة بالمزوّد

استخدم `tools.byProvider` لتقييد الأدوات لمزوّدين محددين من دون
تغيير القيم الافتراضية العامة:

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
