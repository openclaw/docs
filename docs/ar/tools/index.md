---
read_when:
    - تريد فهم الأدوات التي يوفرها OpenClaw
    - تحتاج إلى تهيئة الأدوات أو السماح بها أو رفضها
    - أنت تختار بين الأدوات المضمّنة وSkills وPlugins
summary: 'نظرة عامة على أدوات OpenClaw وPlugins: ما الذي يمكن للوكيل فعله وكيفية توسيعه'
title: الأدوات وPlugins
x-i18n:
    generated_at: "2026-05-03T21:43:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d1f776639ec2a90d8c02418c4b2c62ae7534ea535f626bc1172f1301c32c6f0
    source_path: tools/index.md
    workflow: 16
---

كل ما يفعله الوكيل خارج نطاق توليد النص يحدث عبر **الأدوات**.
الأدوات هي الطريقة التي يقرأ بها الوكيل الملفات، ويشغّل الأوامر، ويتصفح الويب، ويرسل
الرسائل، ويتفاعل مع الأجهزة.

## الأدوات وSkills وPlugins

يتضمن OpenClaw ثلاث طبقات تعمل معا:

<Steps>
  <Step title="الأدوات هي ما يستدعيه الوكيل">
    الأداة هي دالة ذات أنواع محددة يمكن للوكيل استدعاؤها (مثل `exec` و`browser`
    و`web_search` و`message`). يوفّر OpenClaw مجموعة من **الأدوات المضمنة** ويمكن
    للـPlugins تسجيل أدوات إضافية.

    يرى الوكيل الأدوات على أنها تعريفات دوال منظمة تُرسل إلى واجهة API الخاصة بالنموذج.

  </Step>

  <Step title="تعلّم Skills الوكيل متى وكيف">
    المهارة هي ملف Markdown (`SKILL.md`) يُحقن في موجّه النظام.
    تمنح Skills الوكيل السياق والقيود والإرشادات خطوة بخطوة من أجل
    استخدام الأدوات بفعالية. توجد Skills في مساحة عملك، أو في مجلدات مشتركة،
    أو تُشحن داخل Plugins.

    [مرجع Skills](/ar/tools/skills) | [إنشاء Skills](/ar/tools/creating-skills)

  </Step>

  <Step title="تجمع Plugins كل شيء معا">
    الـPlugin هي حزمة يمكنها تسجيل أي مجموعة من القدرات:
    القنوات، ومزوّدو النماذج، والأدوات، وSkills، والكلام، والنسخ الفوري،
    والصوت الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو،
    وجلب الويب، والبحث في الويب، وغير ذلك. بعض Plugins **أساسية** (تُشحن مع
    OpenClaw)، وبعضها الآخر **خارجية** (ينشرها المجتمع على npm).

    [تثبيت Plugins وتهيئتها](/ar/tools/plugin) | [ابنِ Plugin الخاصة بك](/ar/plugins/building-plugins)

  </Step>
</Steps>

## الأدوات المضمنة

تُشحن هذه الأدوات مع OpenClaw وتكون متاحة من دون تثبيت أي Plugins:

| الأداة                                      | ما تفعله                                                              | الصفحة                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | تشغيل أوامر shell وإدارة العمليات الخلفية                            | [Exec](/ar/tools/exec), [موافقات Exec](/ar/tools/exec-approvals) |
| `code_execution`                           | تشغيل تحليل Python بعيد ضمن sandbox                                  | [تنفيذ الكود](/ar/tools/code-execution)                         |
| `browser`                                  | التحكم في متصفح Chromium (التنقل، النقر، لقطة الشاشة)                | [المتصفح](/ar/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | البحث في الويب، والبحث في منشورات X، وجلب محتوى الصفحات              | [الويب](/ar/tools/web), [جلب الويب](/ar/tools/web-fetch)          |
| `read` / `write` / `edit`                  | إدخال/إخراج الملفات في مساحة العمل                                   |                                                              |
| `apply_patch`                              | تصحيحات ملفات متعددة المقاطع                                         | [تطبيق التصحيح](/ar/tools/apply-patch)                          |
| `message`                                  | إرسال الرسائل عبر جميع القنوات                                       | [إرسال الوكيل](/ar/tools/agent-send)                            |
| `canvas`                                   | تشغيل node Canvas (العرض، التقييم، اللقطة)                           |                                                              |
| `nodes`                                    | اكتشاف الأجهزة المقترنة واستهدافها                                   |                                                              |
| `cron` / `gateway`                         | إدارة المهام المجدولة؛ فحص Gateway أو تصحيحه أو إعادة تشغيله أو تحديثه |                                                              |
| `image` / `image_generate`                 | تحليل الصور أو توليدها                                               | [توليد الصور](/ar/tools/image-generation)                       |
| `music_generate`                           | توليد مقاطع موسيقية                                                  | [توليد الموسيقى](/ar/tools/music-generation)                    |
| `video_generate`                           | توليد مقاطع فيديو                                                    | [توليد الفيديو](/ar/tools/video-generation)                     |
| `tts`                                      | تحويل النص إلى كلام لمرة واحدة                                       | [TTS](/ar/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | إدارة الجلسات والحالة وتنسيق الوكلاء الفرعيين                        | [الوكلاء الفرعيون](/ar/tools/subagents)                         |
| `session_status`                           | قراءة حالة خفيفة بأسلوب `/status` وتجاوز نموذج الجلسة                | [أدوات الجلسة](/ar/concepts/session-tool)                       |

لأعمال الصور، استخدم `image` للتحليل و`image_generate` للتوليد أو التحرير. إذا استهدفت `openai/*` أو `google/*` أو `fal/*` أو مزوّد صور آخر غير افتراضي، فاضبط مصادقة/مفتاح API لذلك المزوّد أولا.

لأعمال الموسيقى، استخدم `music_generate`. إذا استهدفت `google/*` أو `minimax/*` أو مزوّد موسيقى آخر غير افتراضي، فاضبط مصادقة/مفتاح API لذلك المزوّد أولا.

لأعمال الفيديو، استخدم `video_generate`. إذا استهدفت `qwen/*` أو مزوّد فيديو آخر غير افتراضي، فاضبط مصادقة/مفتاح API لذلك المزوّد أولا.

لتوليد الصوت المدفوع بسير العمل، استخدم `music_generate` عندما تسجله Plugin مثل
ComfyUI. هذا منفصل عن `tts`، وهو تحويل النص إلى كلام.

`session_status` هي أداة الحالة/القراءة الخفيفة في مجموعة الجلسات.
تجيب عن أسئلة بأسلوب `/status` حول الجلسة الحالية ويمكنها
اختياريا تعيين تجاوز نموذج لكل جلسة؛ يمسح `model=default` ذلك
التجاوز. مثل `/status`، يمكنها ملء عدادات الرموز/الذاكرة المخبأة المتفرقة بأثر رجعي وتسمية
نموذج وقت التشغيل النشط من أحدث إدخال استخدام في النص الكامل للجلسة.

`gateway` هي أداة وقت التشغيل الخاصة بالمالك فقط لعمليات Gateway:

- `config.schema.lookup` لشجرة فرعية من الإعدادات محددة بمسار واحد قبل التعديلات
- `config.get` للقطة الإعداد الحالية + التجزئة
- `config.patch` لتحديثات إعداد جزئية مع إعادة التشغيل
- `config.apply` فقط للاستبدال الكامل للإعداد
- `update.run` للتحديث الذاتي الصريح + إعادة التشغيل

للتغييرات الجزئية، فضّل `config.schema.lookup` ثم `config.patch`. استخدم
`config.apply` فقط عندما تتعمد استبدال الإعداد بالكامل.
للاطلاع على وثائق أوسع للإعداد، اقرأ [الإعداد](/ar/gateway/configuration) و
[مرجع الإعداد](/ar/gateway/configuration-reference).
ترفض الأداة أيضا تغيير `tools.exec.ask` أو `tools.exec.security`؛
تُطبّع الأسماء المستعارة القديمة `tools.bash.*` إلى مسارات exec المحمية نفسها.

### الأدوات التي توفرها Plugins

يمكن لـPlugins تسجيل أدوات إضافية. بعض الأمثلة:

- [الفروقات](/ar/tools/diffs) — عارض ومصيّر للفروقات
- [مهمة LLM](/ar/tools/llm-task) — خطوة LLM مخصصة لـJSON فقط من أجل الإخراج المنظم
- [Lobster](/ar/tools/lobster) — وقت تشغيل لسير عمل ذي أنواع محددة مع موافقات قابلة للاستئناف
- [توليد الموسيقى](/ar/tools/music-generation) — أداة `music_generate` مشتركة مع مزوّدين مدعومين بسير العمل
- [OpenProse](/ar/prose) — تنسيق سير عمل يبدأ من Markdown
- [Tokenjuice](/ar/tools/tokenjuice) — ضغط نتائج أدوات `exec` و`bash` المزدحمة

لا تزال أدوات Plugin تُنشأ باستخدام `api.registerTool(...)` وتُعلن في
قائمة `contracts.tools` في بيان الـPlugin. يلتقط OpenClaw واصف
الأداة الذي تم التحقق منه أثناء الاكتشاف ويخزنه مؤقتا حسب مصدر الـPlugin والعقد، بحيث
يمكن لتخطيط الأدوات اللاحق تخطي تحميل وقت تشغيل الـPlugin. لا يزال تنفيذ الأداة يحمّل
الـPlugin المالكة ويستدعي التنفيذ المسجل الحي.

## تهيئة الأدوات

### قوائم السماح والرفض

تحكم في الأدوات التي يمكن للوكيل استدعاؤها عبر `tools.allow` / `tools.deny` في
الإعداد. الرفض يتغلب دائما على السماح.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

يفشل OpenClaw بإغلاق آمن عندما تُحل قائمة سماح صريحة إلى عدم وجود أدوات قابلة للاستدعاء.
على سبيل المثال، لا تعمل `tools.allow: ["query_db"]` إلا إذا سجّلت Plugin محمّلة فعليا
`query_db`. إذا لم تطابق أي أداة مضمنة أو Plugin أو أداة MCP مضمّنة قائمة السماح،
يتوقف التشغيل قبل استدعاء النموذج بدلا من المتابعة كت运行 نصي فقط قد يهلوس نتائج الأدوات.

### ملفات تعريف الأدوات

يضبط `tools.profile` قائمة سماح أساسية قبل تطبيق `allow`/`deny`.
تجاوز لكل وكيل: `agents.list[].tools.profile`.

| ملف التعريف | ما يتضمنه                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | جميع أدوات النواة وأدوات Plugin الاختيارية؛ أساس غير مقيد للوصول الأوسع إلى الأوامر/التحكم                                                     |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status` فقط                                                                                                                             |

<Note>
`tools.profile: "messaging"` ضيق عمدا للوكلاء المتمحورين حول القنوات.
فهو يستبعد أدوات الأوامر/التحكم الأوسع مثل نظام الملفات، ووقت التشغيل،
والمتصفح، وcanvas، وnodes، وcron، والتحكم في Gateway. استخدم `tools.profile: "full"`
كأساس غير مقيد للوصول الأوسع إلى الأوامر/التحكم، ثم قلّص
الوصول باستخدام `tools.allow` / `tools.deny` عند الحاجة.
</Note>

يتضمن `coding` أدوات ويب خفيفة (`web_search` و`web_fetch` و`x_search`)
لكن ليس أداة التحكم الكامل في المتصفح. يمكن لأتمتة المتصفح تشغيل
جلسات حقيقية وملفات تعريف مسجلة الدخول، لذا أضفها صراحة باستخدام
`tools.alsoAllow: ["browser"]` أو
`agents.list[].tools.alsoAllow: ["browser"]` لكل وكيل.

<Note>
لا يؤدي ضبط `tools.exec` أو `tools.fs` ضمن ملف تعريف مقيّد (`messaging`, `minimal`) إلى توسيع قائمة السماح الخاصة بملف التعريف ضمنيا. أضف إدخالات `tools.alsoAllow` صريحة (على سبيل المثال `["exec", "process"]` لـexec، أو `["read", "write", "edit"]` لـfs) عندما تريد أن يستخدم ملف تعريف مقيّد تلك الأقسام المضبوطة. يسجل OpenClaw تحذير بدء تشغيل عندما يكون قسم إعداد موجودا من دون منحة `alsoAllow` مطابقة.
</Note>

تسمح ملفات تعريف `coding` و`messaging` أيضا بأدوات bundle MCP المضبوطة
تحت مفتاح Plugin ‏`bundle-mcp`. أضف `tools.deny: ["bundle-mcp"]` عندما
تريد أن يحتفظ ملف التعريف بأدواته المضمنة العادية لكنه يخفي جميع أدوات MCP المضبوطة.
لا يتضمن ملف تعريف `minimal` أدوات bundle MCP.

مثال (أوسع سطح أدوات افتراضيا):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### مجموعات الأدوات

استخدم اختصارات `group:*` في قوائم السماح/الرفض:

| المجموعة           | الأدوات                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (يُقبل `bash` كاسم بديل لـ `exec`)                                          |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | جميع أدوات OpenClaw المدمجة (تستثني أدوات Plugin)                                                        |

يعيد `sessions_history` عرض استدعاء محدودًا ومصفّى للسلامة. يزيل
وسوم التفكير، وبنية `<relevant-memories>`، وحمولات XML لاستدعاءات الأدوات
ذات النص العادي (بما في ذلك `<tool_call>...</tool_call>`،
و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`،
و`<function_calls>...</function_calls>`، وكتل استدعاءات الأدوات المقتطعة)،
وبنية استدعاءات الأدوات المخفّضة، ورموز التحكم المسرّبة الخاصة بالنموذج
بصيغة ASCII/العرض الكامل، وXML لاستدعاءات أدوات MiniMax المشوّه من نص المساعد،
ثم يطبّق التنقيح/الاقتطاع وعناصر نائبة محتملة للصفوف كبيرة الحجم بدلًا من العمل
كتفريغ خام للنص الكامل.

### قيود خاصة بالمزوّد

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
