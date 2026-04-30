---
read_when:
    - تريد معرفة الأدوات التي يوفّرها OpenClaw
    - تحتاج إلى تكوين الأدوات أو السماح بها أو رفضها
    - أنت تختار بين الأدوات المضمّنة وSkills وPlugins
summary: 'نظرة عامة على أدوات OpenClaw وPlugins: ما يمكن للوكيل فعله وكيفية توسيعه'
title: الأدوات وPlugin
x-i18n:
    generated_at: "2026-04-30T16:31:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7acfac11669b6f9696a368c08afada8d33e30ac2f452d507f5d1bc36bae367eb
    source_path: tools/index.md
    workflow: 16
---

كل ما يفعله الوكيل خارج توليد النص يحدث عبر **الأدوات**.
الأدوات هي الطريقة التي يقرأ بها الوكيل الملفات، ويشغّل الأوامر، ويتصفح الويب، ويرسل
الرسائل، ويتفاعل مع الأجهزة.

## الأدوات وSkills وplugins

يحتوي OpenClaw على ثلاث طبقات تعمل معًا:

<Steps>
  <Step title="الأدوات هي ما يستدعيه الوكيل">
    الأداة هي دالة ذات أنواع محددة يمكن للوكيل استدعاؤها (مثل `exec` و`browser`
    و`web_search` و`message`). يأتي OpenClaw مع مجموعة من **الأدوات المضمّنة** ويمكن
    للـ plugins تسجيل أدوات إضافية.

    يرى الوكيل الأدوات كتعريفات دوال منظّمة تُرسل إلى واجهة API الخاصة بالنموذج.

  </Step>

  <Step title="Skills تعلّم الوكيل متى وكيف">
    الـ skill هو ملف markdown (`SKILL.md`) يُحقن في مطالبة النظام.
    تمنح Skills الوكيل السياق والقيود والإرشادات خطوة بخطوة لاستخدام
    الأدوات بفعالية. تعيش Skills في مساحة عملك، أو في مجلدات مشتركة،
    أو تأتي داخل plugins.

    [مرجع Skills](/ar/tools/skills) | [إنشاء Skills](/ar/tools/creating-skills)

  </Step>

  <Step title="Plugins تجمع كل شيء معًا">
    الـ plugin هو حزمة يمكنها تسجيل أي مزيج من القدرات:
    القنوات، ومزوّدي النماذج، والأدوات، وSkills، والكلام، والنسخ الفوري،
    والصوت الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو،
    وجلب الويب، والبحث في الويب، والمزيد. بعض plugins هي **أساسية** (تأتي مع
    OpenClaw)، وأخرى **خارجية** (ينشرها المجتمع على npm).

    [تثبيت plugins وتهيئتها](/ar/tools/plugin) | [ابنِ خاصتك](/ar/plugins/building-plugins)

  </Step>
</Steps>

## الأدوات المضمّنة

تأتي هذه الأدوات مع OpenClaw وتكون متاحة بدون تثبيت أي plugins:

| الأداة                                      | ما تفعله                                                               | الصفحة                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | تشغيل أوامر shell وإدارة العمليات الخلفية                             | [Exec](/ar/tools/exec), [موافقات Exec](/ar/tools/exec-approvals) |
| `code_execution`                           | تشغيل تحليل Python بعيد ضمن sandbox                                  | [تنفيذ الكود](/ar/tools/code-execution)                         |
| `browser`                                  | التحكم في متصفح Chromium (تنقل، نقر، لقطة شاشة)                       | [المتصفح](/ar/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | البحث في الويب، والبحث في منشورات X، وجلب محتوى الصفحات              | [الويب](/ar/tools/web), [جلب الويب](/ar/tools/web-fetch)          |
| `read` / `write` / `edit`                  | إدخال/إخراج الملفات في مساحة العمل                                    |                                                              |
| `apply_patch`                              | رقع ملفات متعددة المقاطع                                              | [تطبيق رقعة](/ar/tools/apply-patch)                             |
| `message`                                  | إرسال الرسائل عبر جميع القنوات                                        | [إرسال الوكيل](/ar/tools/agent-send)                            |
| `canvas`                                   | قيادة Canvas الخاصة بـ Node (عرض، تقييم، لقطة)                        |                                                              |
| `nodes`                                    | اكتشاف الأجهزة المقترنة واستهدافها                                     |                                                              |
| `cron` / `gateway`                         | إدارة المهام المجدولة؛ فحص Gateway أو ترقيعه أو إعادة تشغيله أو تحديثه |                                                              |
| `image` / `image_generate`                 | تحليل الصور أو توليدها                                                 | [توليد الصور](/ar/tools/image-generation)                       |
| `music_generate`                           | توليد مقاطع موسيقية                                                    | [توليد الموسيقى](/ar/tools/music-generation)                    |
| `video_generate`                           | توليد الفيديوهات                                                       | [توليد الفيديو](/ar/tools/video-generation)                     |
| `tts`                                      | تحويل نص إلى كلام لمرة واحدة                                           | [TTS](/ar/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | إدارة الجلسات والحالة وتنسيق الوكلاء الفرعيين                         | [الوكلاء الفرعيون](/ar/tools/subagents)                         |
| `session_status`                           | قراءة خفيفة بأسلوب `/status` وتجاوز نموذج الجلسة                      | [أدوات الجلسة](/ar/concepts/session-tool)                       |

لعمل الصور، استخدم `image` للتحليل و`image_generate` للتوليد أو التحرير. إذا استهدفت `openai/*` أو `google/*` أو `fal/*` أو مزوّد صور آخر غير افتراضي، فهيّئ مفتاح المصادقة/API لذلك المزوّد أولًا.

لعمل الموسيقى، استخدم `music_generate`. إذا استهدفت `google/*` أو `minimax/*` أو مزوّد موسيقى آخر غير افتراضي، فهيّئ مفتاح المصادقة/API لذلك المزوّد أولًا.

لعمل الفيديو، استخدم `video_generate`. إذا استهدفت `qwen/*` أو مزوّد فيديو آخر غير افتراضي، فهيّئ مفتاح المصادقة/API لذلك المزوّد أولًا.

لتوليد الصوت المدفوع بسير عمل، استخدم `music_generate` عندما يسجّله plugin مثل
ComfyUI. هذا منفصل عن `tts`، وهو تحويل النص إلى كلام.

`session_status` هي أداة الحالة/القراءة الخفيفة في مجموعة الجلسات.
تجيب عن أسئلة بأسلوب `/status` حول الجلسة الحالية ويمكنها
اختياريًا ضبط تجاوز للنموذج لكل جلسة؛ يمحو `model=default` ذلك
التجاوز. ومثل `/status`، يمكنها ملء عدادات الرموز/cache المتفرقة
وتسمية نموذج وقت التشغيل النشط من أحدث إدخال استخدام في السجل.

`gateway` هي أداة وقت التشغيل المخصصة للمالك فقط لعمليات Gateway:

- `config.schema.lookup` لشجرة فرعية من الإعدادات محددة بالمسار قبل التعديلات
- `config.get` للّقطة الحالية من الإعدادات + الهاش
- `config.patch` لتحديثات إعدادات جزئية مع إعادة التشغيل
- `config.apply` فقط لاستبدال الإعدادات بالكامل
- `update.run` للتحديث الذاتي الصريح + إعادة التشغيل

للتغييرات الجزئية، فضّل `config.schema.lookup` ثم `config.patch`. استخدم
`config.apply` فقط عندما تتعمّد استبدال الإعدادات بالكامل.
للوثائق الأوسع عن الإعدادات، اقرأ [الإعدادات](/ar/gateway/configuration) و
[مرجع الإعدادات](/ar/gateway/configuration-reference).
كما ترفض الأداة تغيير `tools.exec.ask` أو `tools.exec.security`؛
تُطبّع الأسماء المستعارة القديمة `tools.bash.*` إلى مسارات exec المحمية نفسها.

### الأدوات التي توفّرها plugins

يمكن لـ plugins تسجيل أدوات إضافية. بعض الأمثلة:

- [الفروقات](/ar/tools/diffs) — عارض ومصيّر للفروقات
- [مهمة LLM](/ar/tools/llm-task) — خطوة LLM تنتج JSON فقط للمخرجات المنظّمة
- [Lobster](/ar/tools/lobster) — وقت تشغيل workflow ذي أنواع محددة مع موافقات قابلة للاستئناف
- [توليد الموسيقى](/ar/tools/music-generation) — أداة `music_generate` مشتركة مع مزوّدين مدعومين بسير عمل
- [OpenProse](/ar/prose) — تنسيق workflow يضع markdown أولًا
- [Tokenjuice](/ar/tools/tokenjuice) — ضغط نتائج أدوات `exec` و`bash` الصاخبة

## تهيئة الأدوات

### قوائم السماح والمنع

تحكّم في الأدوات التي يستطيع الوكيل استدعاءها عبر `tools.allow` / `tools.deny` في
الإعدادات. المنع يتغلب دائمًا على السماح.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

يفشل OpenClaw بشكل مغلق عندما تتحول قائمة سماح صريحة إلى عدم وجود أدوات قابلة للاستدعاء.
على سبيل المثال، لا يعمل `tools.allow: ["query_db"]` إلا إذا كان plugin محمّل يسجّل
`query_db` فعليًا. إذا لم تطابق قائمة السماح أي أداة مضمّنة أو plugin أو أداة MCP مجمّعة،
يتوقف التشغيل قبل استدعاء النموذج بدلًا من المتابعة كتشغيل نصي فقط
قد يهلوس نتائج الأدوات.

### ملفات تعريف الأدوات

يضبط `tools.profile` قائمة سماح أساسية قبل تطبيق `allow`/`deny`.
تجاوز لكل وكيل: `agents.list[].tools.profile`.

| ملف التعريف | ما يتضمنه                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | خط أساس غير مقيّد للوصول الأوسع إلى الأوامر/التحكم؛ مثل ترك `tools.profile` غير مضبوط                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status` فقط                                                                                                                               |

<Note>
`tools.profile: "messaging"` ضيق عمدًا للوكلاء المركّزين على القنوات.
فهو يستبعد أدوات الأوامر/التحكم الأوسع مثل نظام الملفات، ووقت التشغيل،
والمتصفح، وcanvas، وnodes، وCron، والتحكم في Gateway. استخدم `tools.profile: "full"`
كخط أساس غير مقيّد للوصول الأوسع إلى الأوامر/التحكم، ثم قلّص
الوصول باستخدام `tools.allow` / `tools.deny` عند الحاجة.
</Note>

يتضمن `coding` أدوات ويب خفيفة (`web_search` و`web_fetch` و`x_search`)
ولكنه لا يتضمن أداة التحكم الكامل في المتصفح. يمكن لأتمتة المتصفح قيادة
جلسات حقيقية وملفات تعريف مسجّلة الدخول، لذا أضفها صراحة باستخدام
`tools.alsoAllow: ["browser"]` أو لكل وكيل
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
لا يؤدي ضبط `tools.exec` أو `tools.fs` ضمن ملف تعريف مقيّد (`messaging`، `minimal`) إلى توسيع قائمة السماح الخاصة بملف التعريف ضمنيًا. أضف إدخالات `tools.alsoAllow` صريحة (على سبيل المثال `["exec", "process"]` لـ exec، أو `["read", "write", "edit"]` لـ fs) عندما تريد أن يستخدم ملف تعريف مقيّد تلك الأقسام المضبوطة. يسجل OpenClaw تحذير بدء تشغيل عندما يكون قسم إعدادات موجودًا دون منحة `alsoAllow` مطابقة.
</Note>

يسمح ملفا التعريف `coding` و`messaging` أيضًا بأدوات MCP المجمّعة المضبوطة
تحت مفتاح plugin وهو `bundle-mcp`. أضف `tools.deny: ["bundle-mcp"]` عندما
تريد من ملف تعريف أن يحتفظ بالأدوات المضمّنة العادية لكنه يخفي كل أدوات MCP المضبوطة.
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
| `group:openclaw`   | كل أدوات OpenClaw المدمجة (باستثناء أدوات Plugin)                                                       |

يعيد `sessions_history` عرض استرجاع محدودًا ومفلترًا للسلامة. فهو يزيل
وسوم التفكير، وبنية `<relevant-memories>`، وحمولات XML لاستدعاءات الأدوات
بالنص العادي (بما في ذلك `<tool_call>...</tool_call>`،
و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`،
و`<function_calls>...</function_calls>`، وكتل استدعاءات الأدوات المقتطعة)،
وبنى استدعاءات الأدوات المخفّضة، ورموز تحكم النموذج المسرّبة بصيغة ASCII/العرض الكامل،
وXML غير الصحيح لاستدعاءات أدوات MiniMax من نص المساعد، ثم يطبّق
التنقيح/الاقتطاع واحتمال استخدام عناصر نائبة للصفوف كبيرة الحجم بدلًا من العمل
كتفريغ نصي خام.

### القيود الخاصة بالمزوّد

استخدم `tools.byProvider` لتقييد الأدوات لمزوّدين محددين دون
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
