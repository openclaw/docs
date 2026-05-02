---
read_when:
    - تريد فهم الأدوات التي يوفرها OpenClaw
    - تحتاج إلى تهيئة الأدوات أو السماح بها أو رفضها
    - أنت تفاضل بين الأدوات المدمجة وSkills وPlugin
summary: 'نظرة عامة على أدوات OpenClaw وPlugins: ما يمكن للوكيل فعله وكيفية توسيعه'
title: الأدوات وPlugins
x-i18n:
    generated_at: "2026-05-02T21:04:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 892eb520c14c13e4f55c80aa17ccd2578cc803796844c15cd71674cb2a0a8adf
    source_path: tools/index.md
    workflow: 16
---

كل ما يفعله الوكيل خارج توليد النص يحدث عبر **الأدوات**.
الأدوات هي الطريقة التي يقرأ بها الوكيل الملفات، ويشغّل الأوامر، ويتصفح الويب، ويرسل
الرسائل، ويتفاعل مع الأجهزة.

## الأدوات وSkills وPlugins

لدى OpenClaw ثلاث طبقات تعمل معا:

<Steps>
  <Step title="الأدوات هي ما يستدعيه الوكيل">
    الأداة هي دالة ذات نوع محدد يمكن للوكيل استدعاؤها (مثل `exec` و`browser` و
    `web_search` و`message`). يأتي OpenClaw مع مجموعة من **الأدوات المضمنة**، ويمكن
    لـ Plugins تسجيل أدوات إضافية.

    يرى الوكيل الأدوات كتعريفات دوال منظمة مرسلة إلى model API.

  </Step>

  <Step title="Skills تعلّم الوكيل متى وكيف">
    Skill هي ملف markdown (`SKILL.md`) يُحقن في موجه النظام.
    تمنح Skills الوكيل سياقا وقيودا وإرشادات خطوة بخطوة من أجل
    استخدام الأدوات بفعالية. تعيش Skills في مساحة العمل لديك، أو في المجلدات المشتركة،
    أو تأتي داخل Plugins.

    [مرجع Skills](/ar/tools/skills) | [إنشاء Skills](/ar/tools/creating-skills)

  </Step>

  <Step title="Plugins تجمع كل شيء معا">
    Plugin هي حزمة يمكنها تسجيل أي مزيج من القدرات:
    القنوات، وموفرو النماذج، والأدوات، وSkills، والكلام، والنسخ الفوري،
    والصوت الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو،
    وجلب الويب، وبحث الويب، وغير ذلك. بعض Plugins هي **أساسية** (تأتي مع
    OpenClaw)، وأخرى **خارجية** (ينشرها المجتمع على npm).

    [تثبيت Plugins وتكوينها](/ar/tools/plugin) | [ابنِ الخاصة بك](/ar/plugins/building-plugins)

  </Step>
</Steps>

## الأدوات المضمنة

تأتي هذه الأدوات مع OpenClaw وتكون متاحة دون تثبيت أي Plugins:

| الأداة                                      | ما تفعله                                                              | الصفحة                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | تشغيل أوامر shell وإدارة العمليات الخلفية                            | [Exec](/ar/tools/exec), [موافقات Exec](/ar/tools/exec-approvals) |
| `code_execution`                           | تشغيل تحليل Python بعيد داخل sandbox                                 | [تنفيذ التعليمات البرمجية](/ar/tools/code-execution)           |
| `browser`                                  | التحكم في متصفح Chromium (تنقل، نقر، لقطة شاشة)                     | [المتصفح](/ar/tools/browser)                                   |
| `web_search` / `x_search` / `web_fetch`    | البحث في الويب، والبحث في منشورات X، وجلب محتوى الصفحات             | [الويب](/ar/tools/web), [جلب الويب](/ar/tools/web-fetch)          |
| `read` / `write` / `edit`                  | إدخال/إخراج الملفات في مساحة العمل                                  |                                                              |
| `apply_patch`                              | رقع ملفات متعددة المقاطع                                             | [تطبيق رقعة](/ar/tools/apply-patch)                            |
| `message`                                  | إرسال الرسائل عبر جميع القنوات                                       | [إرسال الوكيل](/ar/tools/agent-send)                           |
| `canvas`                                   | تشغيل node Canvas (عرض، تقييم، لقطة)                                 |                                                              |
| `nodes`                                    | اكتشاف الأجهزة المقترنة واستهدافها                                   |                                                              |
| `cron` / `gateway`                         | إدارة المهام المجدولة؛ فحص Gateway أو ترقيعه أو إعادة تشغيله أو تحديثه |                                                              |
| `image` / `image_generate`                 | تحليل الصور أو توليدها                                                | [توليد الصور](/ar/tools/image-generation)                      |
| `music_generate`                           | توليد مقاطع موسيقية                                                   | [توليد الموسيقى](/ar/tools/music-generation)                   |
| `video_generate`                           | توليد مقاطع فيديو                                                     | [توليد الفيديو](/ar/tools/video-generation)                    |
| `tts`                                      | تحويل نص إلى كلام لمرة واحدة                                         | [TTS](/ar/tools/tts)                                           |
| `sessions_*` / `subagents` / `agents_list` | إدارة الجلسات والحالة وتنسيق الوكلاء الفرعيين                       | [الوكلاء الفرعيون](/ar/tools/subagents)                        |
| `session_status`                           | استرجاع خفيف بنمط `/status` وتجاوز نموذج الجلسة                      | [أدوات الجلسة](/ar/concepts/session-tool)                      |

لأعمال الصور، استخدم `image` للتحليل و`image_generate` للتوليد أو التحرير. إذا استهدفت `openai/*` أو `google/*` أو `fal/*` أو موفر صور غير افتراضي آخر، فكوّن مصادقة ذلك الموفر/API key أولا.

لأعمال الموسيقى، استخدم `music_generate`. إذا استهدفت `google/*` أو `minimax/*` أو موفر موسيقى غير افتراضي آخر، فكوّن مصادقة ذلك الموفر/API key أولا.

لأعمال الفيديو، استخدم `video_generate`. إذا استهدفت `qwen/*` أو موفر فيديو غير افتراضي آخر، فكوّن مصادقة ذلك الموفر/API key أولا.

لتوليد الصوت المدفوع بسير عمل، استخدم `music_generate` عندما تسجله Plugin مثل
ComfyUI. هذا منفصل عن `tts`، وهو تحويل النص إلى كلام.

`session_status` هي أداة الحالة/الاسترجاع الخفيفة ضمن مجموعة الجلسات.
تجيب عن أسئلة بنمط `/status` حول الجلسة الحالية، ويمكنها
اختياريا تعيين تجاوز نموذج لكل جلسة؛ يمحو `model=default` ذلك
التجاوز. مثل `/status`، يمكنها إكمال عدادات الرموز/ذاكرة التخزين المؤقت المتفرقة وتسمية نموذج وقت التشغيل النشط من أحدث إدخال استخدام في النص المنسوخ.

`gateway` هي أداة وقت التشغيل المخصصة للمالك فقط لعمليات Gateway:

- `config.schema.lookup` لشجرة فرعية واحدة من التكوين بنطاق مسار قبل التحريرات
- `config.get` للقطة التكوين الحالية + hash
- `config.patch` لتحديثات تكوين جزئية مع إعادة التشغيل
- `config.apply` لاستبدال التكوين الكامل فقط
- `update.run` للتحديث الذاتي الصريح + إعادة التشغيل

للتغييرات الجزئية، فضّل `config.schema.lookup` ثم `config.patch`. استخدم
`config.apply` فقط عندما تستبدل التكوين بأكمله عمدا.
للوثائق الأوسع للتكوين، اقرأ [التكوين](/ar/gateway/configuration) و
[مرجع التكوين](/ar/gateway/configuration-reference).
ترفض الأداة أيضا تغيير `tools.exec.ask` أو `tools.exec.security`؛
تُطبّع الأسماء المستعارة القديمة `tools.bash.*` إلى مسارات exec المحمية نفسها.

### الأدوات المقدمة من Plugins

يمكن لـ Plugins تسجيل أدوات إضافية. بعض الأمثلة:

- [الفروقات](/ar/tools/diffs) — عارض ومصيّر الفروقات
- [مهمة LLM](/ar/tools/llm-task) — خطوة LLM بصيغة JSON فقط للمخرجات المنظمة
- [Lobster](/ar/tools/lobster) — وقت تشغيل سير عمل typed مع موافقات قابلة للاستئناف
- [توليد الموسيقى](/ar/tools/music-generation) — أداة `music_generate` مشتركة مع موفرين مدعومين بسير عمل
- [OpenProse](/ar/prose) — تنسيق سير عمل يركز على markdown
- [Tokenjuice](/ar/tools/tokenjuice) — ضغط نتائج أدوات `exec` و`bash` الصاخبة

ما زالت أدوات Plugin تُؤلَّف باستخدام `api.registerTool(...)` وتُعلن في
قائمة `contracts.tools` في بيان Plugin. يلتقط OpenClaw واصف الأداة المتحقق منه
أثناء الاكتشاف ويخزنه مؤقتا حسب مصدر Plugin والعقد، بحيث يمكن
لتخطيط الأدوات لاحقا تخطي تحميل وقت تشغيل Plugin. ما زال تنفيذ الأداة يحمّل
Plugin المالكة ويستدعي التنفيذ المسجل الحي.

## تكوين الأدوات

### قوائم السماح والمنع

تحكم في الأدوات التي يمكن للوكيل استدعاؤها عبر `tools.allow` / `tools.deny` في
التكوين. المنع ينتصر دائما على السماح.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

يفشل OpenClaw مغلقا عندما تتحول قائمة سماح صريحة إلى عدم وجود أدوات قابلة للاستدعاء.
على سبيل المثال، لا يعمل `tools.allow: ["query_db"]` إلا إذا كانت Plugin محملة تسجل فعلا
`query_db`. إذا لم تطابق أي أداة مضمّنة أو Plugin أو أداة MCP مرفقة قائمة السماح،
يتوقف التشغيل قبل استدعاء النموذج بدلا من المتابعة كتشغيل نصي فقط
قد يهلوس نتائج الأدوات.

### ملفات تعريف الأدوات

يعيّن `tools.profile` قائمة سماح أساسية قبل تطبيق `allow`/`deny`.
تجاوز لكل وكيل: `agents.list[].tools.profile`.

| ملف التعريف | ما يتضمنه                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | خط أساس غير مقيد لوصول أوسع إلى الأوامر/التحكم؛ مماثل لترك `tools.profile` غير معيّن                                                            |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status` فقط                                                                                                                              |

<Note>
`tools.profile: "messaging"` ضيق عمدا للوكلاء المتركزين على القنوات.
إنه يستبعد أدوات الأوامر/التحكم الأوسع مثل نظام الملفات، ووقت التشغيل،
والمتصفح، وcanvas، وnodes، وCron، والتحكم في Gateway. استخدم `tools.profile: "full"`
كخط أساس غير مقيد لوصول أوسع إلى الأوامر/التحكم، ثم قلّص
الوصول باستخدام `tools.allow` / `tools.deny` عند الحاجة.
</Note>

يتضمن `coding` أدوات ويب خفيفة (`web_search` و`web_fetch` و`x_search`)
ولكن ليس أداة التحكم الكامل في المتصفح. يمكن لأتمتة المتصفح قيادة
جلسات حقيقية وملفات تعريف مسجّل الدخول إليها، لذلك أضفها صراحة باستخدام
`tools.alsoAllow: ["browser"]` أو لكل وكيل
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
لا يؤدي تكوين `tools.exec` أو `tools.fs` ضمن ملف تعريف مقيد (`messaging`, `minimal`) إلى توسيع قائمة سماح ملف التعريف ضمنيا. أضف إدخالات `tools.alsoAllow` صريحة (على سبيل المثال `["exec", "process"]` لـ exec، أو `["read", "write", "edit"]` لـ fs) عندما تريد أن يستخدم ملف تعريف مقيد تلك الأقسام المكوّنة. يسجل OpenClaw تحذيرا عند بدء التشغيل عندما يكون قسم تكوين موجودا دون منحة `alsoAllow` مطابقة.
</Note>

تسمح ملفات تعريف `coding` و`messaging` أيضا بأدوات bundle MCP المكوّنة
تحت مفتاح Plugin ‏`bundle-mcp`. أضف `tools.deny: ["bundle-mcp"]` عندما
تريد أن يحتفظ ملف التعريف بالأدوات المضمنة المعتادة لكن يخفي كل أدوات MCP المكوّنة.
لا يتضمن ملف التعريف `minimal` أدوات bundle MCP.

مثال (أوسع سطح أدوات افتراضيا):

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
| `group:runtime`    | exec, process, code_execution (يُقبل `bash` كاسم مستعار لـ `exec`)                                       |
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
| `group:openclaw`   | كل أدوات OpenClaw المضمنة (باستثناء أدوات Plugin)                                                       |

يعيد `sessions_history` عرض استرجاع محدودا ومفلترًا للسلامة. فهو يزيل
وسوم التفكير، وهياكل `<relevant-memories>`، وحمولات XML لاستدعاءات الأدوات
بنص عادي (بما في ذلك `<tool_call>...</tool_call>`،
`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`،
`<function_calls>...</function_calls>`، وكتل استدعاءات الأدوات المقتطعة)،
وهياكل استدعاءات الأدوات المخفضة، ورموز التحكم في النموذج المسرّبة بصيغة
ASCII/العرض الكامل، وXML غير الصحيح لاستدعاءات أدوات MiniMax من نص المساعد، ثم يطبق
التنقيح/الاقتطاع وعناصر نائبة محتملة للصفوف الزائدة الحجم بدلا من التصرف
كتفريغ خام للنص الكامل.

### قيود خاصة بالمزوّد

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
