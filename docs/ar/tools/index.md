---
read_when:
    - تريد فهم الأدوات التي يوفرها OpenClaw
    - تحتاج إلى تهيئة الأدوات أو السماح بها أو رفضها
    - أنت تختار بين الأدوات المضمّنة، وSkills، وPlugins
summary: 'نظرة عامة على أدوات OpenClaw وPlugins: ما الذي يستطيع الوكيل فعله وكيفية توسيع إمكاناته'
title: الأدوات وPlugin
x-i18n:
    generated_at: "2026-05-07T13:30:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: e001a51222a1b838ded2498bcedc6bd95dbc0a8912850ad7de21e28b25c50790
    source_path: tools/index.md
    workflow: 16
---

كل ما يفعله الوكيل خارج إنشاء النص يحدث عبر **الأدوات**.
الأدوات هي الطريقة التي يقرأ بها الوكيل الملفات، ويشغّل الأوامر، ويتصفح الويب، ويرسل
الرسائل، ويتفاعل مع الأجهزة.

## الأدوات وSkills وplugins

يحتوي OpenClaw على ثلاث طبقات تعمل معًا:

<Steps>
  <Step title="الأدوات هي ما يستدعيه الوكيل">
    الأداة هي دالة ذات نوع محدد يمكن للوكيل استدعاؤها (مثل `exec` و`browser`
    و`web_search` و`message`). يوفّر OpenClaw مجموعة من **الأدوات المدمجة** ويمكن
    للـ plugins تسجيل أدوات إضافية.

    يرى الوكيل الأدوات كتعريفات دوال منظّمة تُرسل إلى واجهة API الخاصة بالنموذج.

  </Step>

  <Step title="Skills تعلّم الوكيل متى وكيف">
    Skill هي ملف Markdown (`SKILL.md`) يُحقن في مطالبة النظام.
    تمنح Skills الوكيل السياق والقيود والإرشادات خطوة بخطوة
    لاستخدام الأدوات بفعالية. توجد Skills في مساحة العمل الخاصة بك، أو في مجلدات مشتركة،
    أو تأتي ضمن plugins.

    [مرجع Skills](/ar/tools/skills) | [إنشاء Skills](/ar/tools/creating-skills)

  </Step>

  <Step title="Plugins تجمع كل شيء معًا">
    Plugin هي حزمة يمكنها تسجيل أي مزيج من القدرات:
    القنوات، وموفري النماذج، والأدوات، وSkills، والكلام، والنسخ الفوري،
    والصوت الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو،
    وجلب الويب، وبحث الويب، والمزيد. بعض plugins **أساسية** (تأتي مع
    OpenClaw)، وأخرى **خارجية** (ينشرها المجتمع على npm).

    [تثبيت plugins وتهيئتها](/ar/tools/plugin) | [ابنِ ما يخصك](/ar/plugins/building-plugins)

  </Step>
</Steps>

## الأدوات المدمجة

تأتي هذه الأدوات مع OpenClaw وهي متاحة دون تثبيت أي plugins:

| الأداة                                      | ما تفعله                                                              | الصفحة                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | تشغيل أوامر الصدفة، وإدارة العمليات الخلفية                          | [Exec](/ar/tools/exec), [موافقات Exec](/ar/tools/exec-approvals) |
| `code_execution`                           | تشغيل تحليل Python عن بُعد داخل صندوق رمل                             | [تنفيذ الكود](/ar/tools/code-execution)                         |
| `browser`                                  | التحكم في متصفح Chromium (التنقل، النقر، لقطة الشاشة)                 | [المتصفح](/ar/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | البحث في الويب، والبحث في منشورات X، وجلب محتوى الصفحات              | [الويب](/ar/tools/web), [جلب الويب](/ar/tools/web-fetch)           |
| `read` / `write` / `edit`                  | إدخال/إخراج الملفات في مساحة العمل                                    |                                                              |
| `apply_patch`                              | رقع ملفات متعددة المقاطع                                             | [تطبيق رقعة](/ar/tools/apply-patch)                             |
| `message`                                  | إرسال الرسائل عبر جميع القنوات                                        | [إرسال الوكيل](/ar/tools/agent-send)                            |
| `nodes`                                    | اكتشاف الأجهزة المقترنة واستهدافها                                    |                                                              |
| `cron` / `gateway`                         | إدارة المهام المجدولة؛ فحص Gateway أو ترقيعه أو إعادة تشغيله أو تحديثه |                                                              |
| `image` / `image_generate`                 | تحليل الصور أو توليدها                                                | [توليد الصور](/ar/tools/image-generation)                       |
| `music_generate`                           | توليد مسارات موسيقية                                                  | [توليد الموسيقى](/ar/tools/music-generation)                    |
| `video_generate`                           | توليد مقاطع الفيديو                                                   | [توليد الفيديو](/ar/tools/video-generation)                     |
| `tts`                                      | تحويل نص إلى كلام لمرة واحدة                                          | [TTS](/ar/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | إدارة الجلسات، والحالة، وتنسيق الوكلاء الفرعيين                       | [الوكلاء الفرعيون](/ar/tools/subagents)                         |
| `session_status`                           | استرجاع خفيف بأسلوب `/status` وتجاوز نموذج الجلسة                     | [أدوات الجلسة](/ar/concepts/session-tool)                       |

لعمل الصور، استخدم `image` للتحليل و`image_generate` للتوليد أو التحرير. إذا استهدفت `openai/*` أو `google/*` أو `fal/*` أو موفر صور آخر غير افتراضي، فقم بتهيئة مفتاح المصادقة/API لذلك الموفر أولًا.

لعمل الموسيقى، استخدم `music_generate`. إذا استهدفت `google/*` أو `minimax/*` أو موفر موسيقى آخر غير افتراضي، فقم بتهيئة مفتاح المصادقة/API لذلك الموفر أولًا.

لعمل الفيديو، استخدم `video_generate`. إذا استهدفت `qwen/*` أو موفر فيديو آخر غير افتراضي، فقم بتهيئة مفتاح المصادقة/API لذلك الموفر أولًا.

لتوليد الصوت المدفوع بسير عمل، استخدم `music_generate` عندما تسجله Plugin مثل
ComfyUI. هذا منفصل عن `tts`، وهي أداة تحويل النص إلى كلام.

`session_status` هي أداة الحالة/الاسترجاع الخفيفة في مجموعة الجلسات.
تجيب عن أسئلة بأسلوب `/status` حول الجلسة الحالية ويمكنها
اختياريًا تعيين تجاوز للنموذج لكل جلسة؛ يؤدي `model=default` إلى مسح ذلك
التجاوز. مثل `/status`، يمكنها استكمال عدادات الرموز المميزة/الذاكرة المؤقتة المتفرقة
وتسمية نموذج وقت التشغيل النشط من أحدث إدخال لاستخدام النص.

`gateway` هي أداة وقت التشغيل المملوكة للمالك فقط لعمليات Gateway:

- `config.schema.lookup` لشجرة فرعية واحدة من التهيئة محددة بالمسار قبل التعديلات
- `config.get` للّقطة الحالية من التهيئة + التجزئة
- `config.patch` للتحديثات الجزئية للتهيئة مع إعادة التشغيل
- `config.apply` فقط لاستبدال التهيئة الكاملة
- `update.run` للتحديث الذاتي الصريح + إعادة التشغيل

للتغييرات الجزئية، فضّل `config.schema.lookup` ثم `config.patch`. استخدم
`config.apply` فقط عندما تقصد استبدال التهيئة بالكامل.
لمستندات التهيئة الأوسع، اقرأ [التهيئة](/ar/gateway/configuration) و
[مرجع التهيئة](/ar/gateway/configuration-reference).
ترفض الأداة أيضًا تغيير `tools.exec.ask` أو `tools.exec.security`؛
تُطبَّع الأسماء المستعارة القديمة `tools.bash.*` إلى مسارات exec المحمية نفسها.

### الأدوات التي توفرها Plugin

يمكن للـ plugins تسجيل أدوات إضافية. بعض الأمثلة:

- [Canvas](/ar/plugins/reference/canvas) — Plugin تجريبية مدمجة للتحكم في node Canvas وتصيير A2UI
- [Diffs](/ar/tools/diffs) — عارض ومصيّر الفروقات
- [مهمة LLM](/ar/tools/llm-task) — خطوة LLM بصيغة JSON فقط للإخراج المنظّم
- [Lobster](/ar/tools/lobster) — وقت تشغيل سير عمل مضبوط النوع مع موافقات قابلة للاستئناف
- [توليد الموسيقى](/ar/tools/music-generation) — أداة `music_generate` مشتركة مع موفرين مدعومين بسير عمل
- [OpenProse](/ar/prose) — تنسيق سير عمل يقدّم Markdown أولًا
- [Tokenjuice](/ar/tools/tokenjuice) — ضغط نتائج أدوات `exec` و`bash` المزعجة

لا تزال أدوات Plugin تُنشأ باستخدام `api.registerTool(...)` وتُصرَّح في
قائمة `contracts.tools` في بيان Plugin. يلتقط OpenClaw واصف
الأداة بعد التحقق أثناء الاكتشاف ويخزنه مؤقتًا حسب مصدر Plugin والعقد، بحيث
يمكن لتخطيط الأدوات لاحقًا تخطي تحميل وقت تشغيل Plugin. لا يزال تنفيذ الأداة يحمّل
Plugin المالكة ويستدعي التنفيذ المسجل الحي.

## تهيئة الأدوات

### قوائم السماح والرفض

تحكم في الأدوات التي يمكن للوكيل استدعاؤها عبر `tools.allow` / `tools.deny` في
التهيئة. الرفض ينتصر دائمًا على السماح.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

يفشل OpenClaw بإغلاق آمن عندما لا تتحول قائمة سماح صريحة إلى أي أدوات قابلة للاستدعاء.
على سبيل المثال، لا يعمل `tools.allow: ["query_db"]` إلا إذا كانت Plugin محمّلة تسجل فعليًا
`query_db`. إذا لم تطابق أي أداة مدمجة أو Plugin أو أداة MCP مضمّنة
قائمة السماح، يتوقف التشغيل قبل استدعاء النموذج بدلًا من المتابعة
كتشغيل نصي فقط قد يهلوس نتائج الأدوات.

### ملفات تعريف الأدوات

يضبط `tools.profile` قائمة سماح أساسية قبل تطبيق `allow`/`deny`.
تجاوز لكل وكيل: `agents.list[].tools.profile`.

| ملف التعريف | ما يتضمنه                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | جميع أدوات core وPlugin الاختيارية؛ خط أساس غير مقيّد لوصول أوسع للأوامر/التحكم                                                                   |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status` فقط                                                                                                                              |

<Note>
`tools.profile: "messaging"` ضيق عمدًا للوكلاء الموجّهين للقنوات.
فهو يستبعد أدوات الأوامر/التحكم الأوسع مثل نظام الملفات، ووقت التشغيل،
والمتصفح، وcanvas، والعُقد، وcron، والتحكم في Gateway. استخدم `tools.profile: "full"`
كخط أساس غير مقيّد لوصول أوسع للأوامر/التحكم، ثم قلّص
الوصول باستخدام `tools.allow` / `tools.deny` عند الحاجة.
</Note>

يتضمن `coding` أدوات ويب خفيفة (`web_search` و`web_fetch` و`x_search`)
ولكن ليس أداة التحكم الكاملة في المتصفح. يمكن لأتمتة المتصفح قيادة
جلسات حقيقية وملفات تعريف مسجّل دخولها، لذا أضفها صراحةً باستخدام
`tools.alsoAllow: ["browser"]` أو
`agents.list[].tools.alsoAllow: ["browser"]` لكل وكيل.

<Note>
لا يؤدي تكوين `tools.exec` أو `tools.fs` ضمن ملف تعريف مقيّد (`messaging`, `minimal`) إلى توسيع قائمة السماح الخاصة بملف التعريف ضمنيًا. أضف إدخالات `tools.alsoAllow` صريحة (مثل `["exec", "process"]` لـ exec، أو `["read", "write", "edit"]` لـ fs) عندما تريد أن يستخدم ملف تعريف مقيّد تلك الأقسام المهيأة. يسجل OpenClaw تحذير بدء تشغيل عندما يكون قسم تهيئة موجودًا دون منحة `alsoAllow` مطابقة.
</Note>

تسمح ملفات التعريف `coding` و`messaging` أيضًا بأدوات bundle MCP المهيأة
ضمن مفتاح Plugin المسمى `bundle-mcp`. أضف `tools.deny: ["bundle-mcp"]` عندما
تريد أن يحتفظ ملف التعريف بأدواته المدمجة العادية لكنه يخفي كل أدوات MCP المهيأة.
لا يتضمن ملف التعريف `minimal` أدوات bundle MCP.

مثال (أوسع سطح أدوات افتراضيًا):

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
| `group:runtime`    | exec، process، code_execution (يُقبل `bash` كاسم بديل لـ `exec`)                                         |
| `group:fs`         | read، write، edit، apply_patch                                                                            |
| `group:sessions`   | sessions_list، sessions_history، sessions_send، sessions_spawn، sessions_yield، subagents، session_status |
| `group:memory`     | memory_search، memory_get                                                                                 |
| `group:web`        | web_search، x_search، web_fetch                                                                           |
| `group:ui`         | browser، canvas عند تمكين Plugin Canvas المضمّن                                                           |
| `group:automation` | heartbeat_respond، cron، gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list، update_plan                                                                                  |
| `group:media`      | image، image_generate، music_generate، video_generate، tts                                                |
| `group:openclaw`   | كل أدوات OpenClaw المضمّنة (باستثناء أدوات Plugin)                                                       |

يعيد `sessions_history` عرض استرجاع محدودًا ومفلترًا للسلامة. وهو يزيل
وسوم التفكير، وبنية `<relevant-memories>` التمهيدية، وحمولات XML لاستدعاء الأدوات
بنص عادي (بما في ذلك `<tool_call>...</tool_call>`،
و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`،
و`<function_calls>...</function_calls>`، وكتل استدعاء الأدوات المقتطعة)،
وبنى استدعاء الأدوات التمهيدية المخفّضة، ورموز تحكّم النموذج المسرّبة بصيغتي
ASCII/العرض الكامل، وXML غير السليم لاستدعاءات أدوات MiniMax من نص المساعد، ثم يطبّق
التنقيح/الاقتطاع واحتمال استخدام عناصر نائبة للصفوف كبيرة الحجم بدلًا من العمل
كتفريغ خام للنص الكامل.

### القيود الخاصة بالموفّر

استخدم `tools.byProvider` لتقييد الأدوات لموفّرين محدّدين دون تغيير
الإعدادات الافتراضية العامة:

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
