---
read_when:
    - تريد فهم الأدوات التي يوفّرها OpenClaw
    - تحتاج إلى تهيئة الأدوات أو السماح بها أو رفضها
    - أنت تفاضل بين الأدوات المضمنة وSkills وPlugins
summary: 'نظرة عامة على أدوات OpenClaw وPlugins: ما يمكن للوكيل فعله وكيفية توسيعه'
title: الأدوات وPlugins
x-i18n:
    generated_at: "2026-05-06T08:17:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 894f6dc7e840f3153e95696a63c470a200886af7d3dc8399e87446cf0fb1b027
    source_path: tools/index.md
    workflow: 16
---

كل ما يفعله الوكيل بعد توليد النص يحدث عبر **الأدوات**.
الأدوات هي الطريقة التي يقرأ بها الوكيل الملفات، ويشغّل الأوامر، ويتصفح الويب، ويرسل
الرسائل، ويتفاعل مع الأجهزة.

## الأدوات وSkills وPlugins

لدى OpenClaw ثلاث طبقات تعمل معًا:

<Steps>
  <Step title="الأدوات هي ما يستدعيه الوكيل">
    الأداة هي دالة ذات أنواع يمكن للوكيل استدعاؤها (مثل `exec` و`browser` و
    `web_search` و`message`). يوفّر OpenClaw مجموعة من **الأدوات المضمّنة** ويمكن
    للـ Plugins تسجيل أدوات إضافية.

    يرى الوكيل الأدوات كتعريفات دوال منظمة تُرسل إلى واجهة برمجة تطبيقات النموذج.

  </Step>

  <Step title="Skills تعلّم الوكيل متى وكيف">
    الـ Skill هي ملف markdown (`SKILL.md`) يُحقن في مطالبة النظام.
    تمنح Skills الوكيل السياق والقيود والإرشادات خطوة بخطوة من أجل
    استخدام الأدوات بفعالية. تعيش Skills في مساحة عملك، أو في مجلدات مشتركة،
    أو تُشحن داخل Plugins.

    [مرجع Skills](/ar/tools/skills) | [إنشاء Skills](/ar/tools/creating-skills)

  </Step>

  <Step title="Plugins تجمع كل شيء معًا">
    الـ Plugin هي حزمة يمكنها تسجيل أي مزيج من القدرات:
    القنوات، وموفرو النماذج، والأدوات، وSkills، والكلام، والنسخ الفوري،
    والصوت الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو،
    وجلب الويب، والبحث في الويب، والمزيد. بعض Plugins تكون **أساسية** (تُشحن مع
    OpenClaw)، وأخرى تكون **خارجية** (ينشرها المجتمع على npm).

    [تثبيت وتهيئة Plugins](/ar/tools/plugin) | [ابنِ Plugin الخاص بك](/ar/plugins/building-plugins)

  </Step>
</Steps>

## الأدوات المضمّنة

تُشحن هذه الأدوات مع OpenClaw وتكون متاحة دون تثبيت أي Plugins:

| الأداة                                     | ما تفعله                                                              | الصفحة                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | تشغيل أوامر shell وإدارة العمليات الخلفية                            | [Exec](/ar/tools/exec), [موافقات Exec](/ar/tools/exec-approvals) |
| `code_execution`                           | تشغيل تحليل Python بعيد داخل صندوق عزل                               | [تنفيذ الكود](/ar/tools/code-execution)                         |
| `browser`                                  | التحكم في متصفح Chromium (تنقل، نقر، لقطة شاشة)                      | [المتصفح](/ar/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | البحث في الويب، والبحث في منشورات X، وجلب محتوى الصفحات              | [الويب](/ar/tools/web), [جلب الويب](/ar/tools/web-fetch)          |
| `read` / `write` / `edit`                  | إدخال/إخراج الملفات في مساحة العمل                                   |                                                              |
| `apply_patch`                              | تصحيحات ملفات متعددة المقاطع                                         | [تطبيق التصحيح](/ar/tools/apply-patch)                         |
| `message`                                  | إرسال رسائل عبر جميع القنوات                                         | [إرسال الوكيل](/ar/tools/agent-send)                           |
| `canvas`                                   | تشغيل Canvas الخاص بـ Node (عرض، تقييم، لقطة)                        |                                                              |
| `nodes`                                    | اكتشاف الأجهزة المقترنة واستهدافها                                   |                                                              |
| `cron` / `gateway`                         | إدارة المهام المجدولة؛ فحص الـ gateway أو تصحيحه أو إعادة تشغيله أو تحديثه |                                                              |
| `image` / `image_generate`                 | تحليل الصور أو توليدها                                               | [توليد الصور](/ar/tools/image-generation)                      |
| `music_generate`                           | توليد مقاطع موسيقية                                                  | [توليد الموسيقى](/ar/tools/music-generation)                   |
| `video_generate`                           | توليد مقاطع فيديو                                                    | [توليد الفيديو](/ar/tools/video-generation)                    |
| `tts`                                      | تحويل نص إلى كلام لمرة واحدة                                         | [TTS](/ar/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | إدارة الجلسات والحالة وتنسيق الوكلاء الفرعيين                        | [الوكلاء الفرعيون](/ar/tools/subagents)                        |
| `session_status`                           | قراءة خفيفة بنمط `/status` وتجاوز نموذج الجلسة                       | [أدوات الجلسة](/ar/concepts/session-tool)                      |

للعمل على الصور، استخدم `image` للتحليل و`image_generate` للتوليد أو التحرير. إذا كنت تستهدف `openai/*` أو `google/*` أو `fal/*` أو موفر صور آخر غير افتراضي، فقم بتهيئة مصادقة/مفتاح API لذلك الموفر أولًا.

للعمل على الموسيقى، استخدم `music_generate`. إذا كنت تستهدف `google/*` أو `minimax/*` أو موفر موسيقى آخر غير افتراضي، فقم بتهيئة مصادقة/مفتاح API لذلك الموفر أولًا.

للعمل على الفيديو، استخدم `video_generate`. إذا كنت تستهدف `qwen/*` أو موفر فيديو آخر غير افتراضي، فقم بتهيئة مصادقة/مفتاح API لذلك الموفر أولًا.

لتوليد الصوت المدفوع بسير العمل، استخدم `music_generate` عندما يسجله Plugin مثل
ComfyUI. هذا منفصل عن `tts`، الذي يختص بتحويل النص إلى كلام.

`session_status` هي أداة الحالة/القراءة الخفيفة في مجموعة الجلسات.
تجيب عن أسئلة بنمط `/status` حول الجلسة الحالية ويمكنها
اختياريًا تعيين تجاوز نموذج لكل جلسة؛ يمسح `model=default` ذلك
التجاوز. مثل `/status`، يمكنها ملء عدادات الرموز/ذاكرة التخزين المؤقت المتفرقة
وتسمية نموذج وقت التشغيل النشط من أحدث إدخال استخدام في النص المنسوخ.

`gateway` هي أداة وقت التشغيل المخصصة للمالك فقط لعمليات Gateway:

- `config.schema.lookup` لشجرة إعدادات فرعية محددة المسار قبل التعديلات
- `config.get` للقطة الإعدادات الحالية + التجزئة
- `config.patch` لتحديثات إعدادات جزئية مع إعادة التشغيل
- `config.apply` فقط للاستبدال الكامل للإعدادات
- `update.run` للتحديث الذاتي الصريح + إعادة التشغيل

للتغييرات الجزئية، فضّل `config.schema.lookup` ثم `config.patch`. استخدم
`config.apply` فقط عندما تستبدل الإعدادات بالكامل عمدًا.
لمستندات الإعدادات الأوسع، اقرأ [الإعدادات](/ar/gateway/configuration) و
[مرجع الإعدادات](/ar/gateway/configuration-reference).
ترفض الأداة أيضًا تغيير `tools.exec.ask` أو `tools.exec.security`؛
تُطبّع الأسماء المستعارة القديمة `tools.bash.*` إلى مسارات exec المحمية نفسها.

### الأدوات التي توفرها Plugins

يمكن لـ Plugins تسجيل أدوات إضافية. بعض الأمثلة:

- [الفروقات](/ar/tools/diffs) — عارض ومرسم للفروقات
- [مهمة LLM](/ar/tools/llm-task) — خطوة LLM مخصصة لـ JSON فقط للمخرجات المنظمة
- [Lobster](/ar/tools/lobster) — وقت تشغيل سير عمل ذي أنواع مع موافقات قابلة للاستئناف
- [توليد الموسيقى](/ar/tools/music-generation) — أداة `music_generate` مشتركة مع موفرين مدعومين بسير العمل
- [OpenProse](/ar/prose) — تنسيق سير عمل يعتمد markdown أولًا
- [Tokenjuice](/ar/tools/tokenjuice) — ضغط نتائج أدوات `exec` و`bash` كثيرة الضجيج

ما تزال أدوات Plugin تُنشأ باستخدام `api.registerTool(...)` وتُعلن في
قائمة `contracts.tools` ضمن بيان الـ Plugin. يلتقط OpenClaw واصف
الأداة المتحقق منه أثناء الاكتشاف ويخزّنه مؤقتًا حسب مصدر الـ Plugin والعقد، بحيث
يمكن لتخطيط الأدوات لاحقًا تخطي تحميل وقت تشغيل الـ Plugin. ما يزال تنفيذ الأداة يحمّل
الـ Plugin المالك ويستدعي التنفيذ المسجل الحي.

## تهيئة الأدوات

### قوائم السماح والمنع

تحكّم في الأدوات التي يمكن للوكيل استدعاؤها عبر `tools.allow` / `tools.deny` في
الإعدادات. المنع يتغلب دائمًا على السماح.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

يفشل OpenClaw بإغلاق آمن عندما تتحول قائمة سماح صريحة إلى عدم وجود أدوات قابلة للاستدعاء.
على سبيل المثال، لا يعمل `tools.allow: ["query_db"]` إلا إذا سجّل Plugin محمّل فعليًا
`query_db`. إذا لم تطابق أي أداة مضمّنة أو Plugin أو أداة MCP مجمّعة
قائمة السماح، يتوقف التشغيل قبل استدعاء النموذج بدلًا من المتابعة كتشغيل
نصي فقط قد يهلوس نتائج الأدوات.

### ملفات تعريف الأدوات

يضبط `tools.profile` قائمة سماح أساسية قبل تطبيق `allow`/`deny`.
تجاوز لكل وكيل: `agents.list[].tools.profile`.

| ملف التعريف | ما يتضمنه                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | كل أدوات Plugins الأساسية والاختيارية؛ خط أساس غير مقيّد لوصول أوسع إلى الأوامر/التحكم                                                         |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status` فقط                                                                                                                             |

<Note>
`tools.profile: "messaging"` ضيق عمدًا للوكلاء المتمركزين حول القنوات.
فهو يستبعد أدوات أوامر/تحكم أوسع مثل نظام الملفات، ووقت التشغيل،
والمتصفح، وcanvas، والعقد، وcron، والتحكم في Gateway. استخدم `tools.profile: "full"`
كخط أساس غير مقيّد لوصول أوسع إلى الأوامر/التحكم، ثم قلّص
الوصول باستخدام `tools.allow` / `tools.deny` عند الحاجة.
</Note>

يتضمن `coding` أدوات ويب خفيفة (`web_search` و`web_fetch` و`x_search`)
لكن ليس أداة التحكم الكامل في المتصفح. يمكن لأتمتة المتصفح قيادة
جلسات حقيقية وملفات تعريف مسجّل الدخول، لذا أضفها صراحةً باستخدام
`tools.alsoAllow: ["browser"]` أو لكل وكيل
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
لا يؤدي تكوين `tools.exec` أو `tools.fs` ضمن ملف تعريف مقيّد (`messaging`، `minimal`) إلى توسيع قائمة السماح الخاصة بملف التعريف ضمنيًا. أضف إدخالات `tools.alsoAllow` صريحة (مثل `["exec", "process"]` لـ exec، أو `["read", "write", "edit"]` لـ fs) عندما تريد من ملف تعريف مقيّد استخدام تلك الأقسام المهيأة. يسجل OpenClaw تحذير بدء تشغيل عندما يكون قسم إعدادات موجودًا دون منحة `alsoAllow` مطابقة.
</Note>

تسمح ملفات تعريف `coding` و`messaging` أيضًا بأدوات MCP المجمّعة المهيأة
تحت مفتاح Plugin `bundle-mcp`. أضف `tools.deny: ["bundle-mcp"]` عندما
تريد أن يحتفظ ملف التعريف بالأدوات المضمّنة العادية لكنه يخفي كل أدوات MCP المهيأة.
لا يتضمن ملف التعريف `minimal` أدوات MCP المجمّعة.

مثال (أوسع سطح أدوات افتراضيًا):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### مجموعات الأدوات

استخدم اختصارات `group:*` في قوائم السماح/المنع:

| المجموعة              | الأدوات                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (يُقبل `bash` كاسم مستعار لـ `exec`)                                 |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | كل أدوات OpenClaw المضمنة (باستثناء أدوات Plugin)                                                       |

يعيد `sessions_history` عرض استرجاع محدودًا ومفلترًا للسلامة. فهو يزيل
وسوم التفكير، وبنية `<relevant-memories>`، وحمولات XML لاستدعاءات الأدوات
بنص عادي (بما في ذلك `<tool_call>...</tool_call>`،
و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`،
و`<function_calls>...</function_calls>`، وكتل استدعاء الأدوات المقتطعة)،
وبنية استدعاءات الأدوات المخفّضة، ورموز التحكم بالنموذج المسرّبة بصيغة ASCII/العرض الكامل،
وXML مشوّهة لاستدعاءات أدوات MiniMax من نص المساعد، ثم يطبق
التنقيح/الاقتطاع وعناصر نائبة محتملة للصفوف الزائدة الحجم بدلًا من التصرف
كتفريغ خام للنص الكامل.

### قيود خاصة بالموفّر

استخدم `tools.byProvider` لتقييد الأدوات لموفّرين محددين من دون
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
