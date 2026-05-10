---
read_when:
    - تريد فهم الأدوات التي يوفرها OpenClaw
    - تحتاج إلى ضبط الأدوات أو السماح بها أو رفضها
    - أنت تفاضل بين الأدوات المضمّنة وSkills وPlugin.
summary: 'نظرة عامة على أدوات OpenClaw وPlugins: ما يمكن للوكيل فعله وكيفية توسيعه'
title: الأدوات والـ Plugins
x-i18n:
    generated_at: "2026-05-10T20:04:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: b12b2d605c8fccb0de378f8a63fb92b8c3bad8abd3edf10bb79632d6ef6089fd
    source_path: tools/index.md
    workflow: 16
---

كل ما يفعله الوكيل خارج توليد النص يحدث عبر **الأدوات**.
الأدوات هي الطريقة التي يقرأ بها الوكيل الملفات، ويشغّل الأوامر، ويتصفح الويب، ويرسل
الرسائل، ويتفاعل مع الأجهزة.

## الأدوات وSkills وPlugins

لدى OpenClaw ثلاث طبقات تعمل معًا:

<Steps>
  <Step title="الأدوات هي ما يستدعيه الوكيل">
    الأداة هي دالة ذات نوع محدد يمكن للوكيل استدعاؤها (مثل `exec` و`browser`
    و`web_search` و`message`). يأتي OpenClaw مع مجموعة من **الأدوات المدمجة**، ويمكن لـ
    Plugins تسجيل أدوات إضافية.

    يرى الوكيل الأدوات كتعريفات دوال منظمة تُرسل إلى واجهة API الخاصة بالنموذج.

  </Step>

  <Step title="Skills تعلّم الوكيل متى وكيف">
    Skill هو ملف markdown (`SKILL.md`) يُحقن في مطالبة النظام.
    تمنح Skills الوكيل السياق والقيود والإرشادات خطوة بخطوة من أجل
    استخدام الأدوات بفعالية. تعيش Skills في مساحة عملك، أو في مجلدات مشتركة،
    أو تأتي داخل Plugins.

    [مرجع Skills](/ar/tools/skills) | [إنشاء Skills](/ar/tools/creating-skills)

  </Step>

  <Step title="Plugins تحزم كل شيء معًا">
    Plugin هو حزمة يمكنها تسجيل أي مزيج من القدرات:
    القنوات، ومزودي النماذج، والأدوات، وSkills، والكلام، والنسخ الفوري،
    والصوت الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو،
    وجلب الويب، وبحث الويب، والمزيد. بعض Plugins هي **أساسية** (تأتي مع
    OpenClaw)، وأخرى **خارجية** (ينشرها المجتمع على npm).

    [تثبيت Plugins وتهيئتها](/ar/tools/plugin) | [ابنِ الخاصة بك](/ar/plugins/building-plugins)

  </Step>
</Steps>

## الأدوات المدمجة

تأتي هذه الأدوات مع OpenClaw وتكون متاحة دون تثبيت أي Plugins:

| الأداة                                      | ما تفعله                                                              | الصفحة                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | تشغيل أوامر الصدفة، وإدارة العمليات الخلفية                          | [Exec](/ar/tools/exec), [موافقات Exec](/ar/tools/exec-approvals) |
| `code_execution`                           | تشغيل تحليل Python بعيد داخل صندوق رمل                               | [تنفيذ الكود](/ar/tools/code-execution)                        |
| `browser`                                  | التحكم في متصفح Chromium (التنقل، النقر، لقطة الشاشة)                 | [المتصفح](/ar/tools/browser)                                   |
| `web_search` / `x_search` / `web_fetch`    | البحث في الويب، والبحث في منشورات X، وجلب محتوى الصفحة                | [الويب](/ar/tools/web), [جلب الويب](/ar/tools/web-fetch)          |
| `read` / `write` / `edit`                  | إدخال/إخراج الملفات في مساحة العمل                                    |                                                              |
| `apply_patch`                              | رقع ملفات متعددة المقاطع                                              | [تطبيق الرقعة](/ar/tools/apply-patch)                          |
| `message`                                  | إرسال الرسائل عبر جميع القنوات                                        | [إرسال الوكيل](/ar/tools/agent-send)                           |
| `nodes`                                    | اكتشاف الأجهزة المقترنة واستهدافها                                    |                                                              |
| `cron` / `gateway`                         | إدارة المهام المجدولة؛ فحص Gateway أو ترقيعه أو إعادة تشغيله أو تحديثه |                                                              |
| `image` / `image_generate`                 | تحليل الصور أو توليدها                                                | [توليد الصور](/ar/tools/image-generation)                      |
| `music_generate`                           | توليد مقاطع موسيقية                                                   | [توليد الموسيقى](/ar/tools/music-generation)                   |
| `video_generate`                           | توليد مقاطع فيديو                                                     | [توليد الفيديو](/ar/tools/video-generation)                    |
| `tts`                                      | تحويل نص إلى كلام لمرة واحدة                                          | [TTS](/ar/tools/tts)                                           |
| `sessions_*` / `subagents` / `agents_list` | إدارة الجلسات والحالة وتنسيق الوكلاء الفرعيين                         | [الوكلاء الفرعيون](/ar/tools/subagents)                        |
| `session_status`                           | قراءة راجعة خفيفة بنمط `/status` وتجاوز نموذج الجلسة                  | [أدوات الجلسة](/ar/concepts/session-tool)                      |

للعمل على الصور، استخدم `image` للتحليل و`image_generate` للتوليد أو التحرير. إذا كنت تستهدف `openai/*` أو `google/*` أو `fal/*` أو مزود صور آخر غير افتراضي، فقم أولًا بتهيئة مصادقة ذلك المزود/مفتاح API الخاص به.

للعمل على الموسيقى، استخدم `music_generate`. إذا كنت تستهدف `google/*` أو `minimax/*` أو مزود موسيقى آخر غير افتراضي، فقم أولًا بتهيئة مصادقة ذلك المزود/مفتاح API الخاص به.

للعمل على الفيديو، استخدم `video_generate`. إذا كنت تستهدف `qwen/*` أو مزود فيديو آخر غير افتراضي، فقم أولًا بتهيئة مصادقة ذلك المزود/مفتاح API الخاص به.

لتوليد الصوت المدفوع بسير العمل، استخدم `music_generate` عندما يسجله Plugin مثل
ComfyUI. هذا منفصل عن `tts`، وهو تحويل النص إلى كلام.

`session_status` هي أداة الحالة/القراءة الراجعة الخفيفة في مجموعة الجلسات.
تجيب عن أسئلة بنمط `/status` حول الجلسة الحالية ويمكنها
اختياريًا تعيين تجاوز نموذج لكل جلسة؛ يمحو `model=default` ذلك
التجاوز. ومثل `/status`، يمكنها ملء عدادات الرموز/token وذاكرة التخزين المؤقت المتفرقة ووسم نموذج وقت التشغيل
النشط من أحدث إدخال استخدام في النص المنسوخ.

`gateway` هي أداة وقت التشغيل الخاصة بالمالك فقط لعمليات Gateway:

- `config.schema.lookup` لشجرة إعدادات فرعية محددة بمسار واحد قبل التحريرات
- `config.get` للقطة الإعدادات الحالية + التجزئة
- `config.patch` لتحديثات إعدادات جزئية مع إعادة التشغيل
- `config.apply` لاستبدال الإعدادات بالكامل فقط
- `update.run` للتحديث الذاتي الصريح + إعادة التشغيل

للتغييرات الجزئية، فضّل `config.schema.lookup` ثم `config.patch`. استخدم
`config.apply` فقط عندما تتعمد استبدال الإعدادات بالكامل.
للوثائق الأوسع حول الإعدادات، اقرأ [الإعدادات](/ar/gateway/configuration) و
[مرجع الإعدادات](/ar/gateway/configuration-reference).
ترفض الأداة أيضًا تغيير `tools.exec.ask` أو `tools.exec.security`؛
تُطبّع الأسماء المستعارة القديمة `tools.bash.*` إلى مسارات exec المحمية نفسها.

### الأدوات التي توفرها Plugins

يمكن لـ Plugins تسجيل أدوات إضافية. بعض الأمثلة:

- [Canvas](/ar/plugins/reference/canvas) — Plugin تجريبي مدمج للتحكم في Canvas على Node وتصير A2UI
- [Diffs](/ar/tools/diffs) — عارض ومصيّر الفروق
- [LLM Task](/ar/tools/llm-task) — خطوة LLM مخصصة لـ JSON فقط للمخرجات المنظمة
- [Lobster](/ar/tools/lobster) — وقت تشغيل سير عمل ذي أنواع محددة مع موافقات قابلة للاستئناف
- [توليد الموسيقى](/ar/tools/music-generation) — أداة `music_generate` مشتركة مع مزودين مدعومين بسير العمل
- [OpenProse](/ar/prose) — تنسيق سير عمل يبدأ من markdown
- [Tokenjuice](/ar/tools/tokenjuice) — ضغط نتائج أدوات `exec` و`bash` المليئة بالضوضاء

ما زالت أدوات Plugin تُؤلف باستخدام `api.registerTool(...)` وتُعلن في
قائمة `contracts.tools` في بيان Plugin. يلتقط OpenClaw واصف
الأداة المتحقق منه أثناء الاكتشاف ويخزنه مؤقتًا حسب مصدر Plugin والعقد، بحيث يمكن
لتخطيط الأدوات لاحقًا تخطي تحميل وقت تشغيل Plugin. ما زال تنفيذ الأداة يحمّل
Plugin المالك ويستدعي التنفيذ المسجل الحي.

[بحث الأدوات](/ar/tools/tool-search) هو السطح الموجز
للكتالوجات الكبيرة. بدلًا من وضع كل مخطط أدوات OpenClaw أو MCP أو العميل
في المطالبة، يمكن لـ OpenClaw أن يمنح النموذج وقت تشغيل Node معزولًا
مع `openclaw.tools.search` و`openclaw.tools.describe` و
`openclaw.tools.call`. ما زالت الاستدعاءات تعود عبر Gateway، لذلك تظل
سياسات الأدوات والموافقات والخطافات وسجلات الجلسات هي المرجع المعتمد.

## إعدادات الأدوات

### قوائم السماح والمنع

تحكم في الأدوات التي يمكن للوكيل استدعاؤها عبر `tools.allow` / `tools.deny` في
الإعدادات. المنع يتغلب دائمًا على السماح.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

يفشل OpenClaw مغلقًا عندما تتحول قائمة سماح صريحة إلى عدم وجود أدوات قابلة للاستدعاء.
على سبيل المثال، يعمل `tools.allow: ["query_db"]` فقط إذا كان Plugin محملًا يسجل فعليًا
`query_db`. إذا لم تطابق قائمة السماح أي أداة مدمجة أو Plugin أو أداة MCP مدمجة،
يتوقف التشغيل قبل استدعاء النموذج بدلًا من المتابعة كتدفق نصي فقط
قد يختلق نتائج أدوات.

### ملفات تعريف الأدوات

يضبط `tools.profile` قائمة سماح أساسية قبل تطبيق `allow`/`deny`.
تجاوز لكل وكيل: `agents.list[].tools.profile`.

| ملف التعريف | ما يتضمنه                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | كل أدوات Plugins الأساسية والاختيارية؛ خط أساس غير مقيد لوصول أوسع إلى الأوامر/التحكم                                                          |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status` فقط                                                                                                                              |

<Note>
`tools.profile: "messaging"` ضيق عمدًا للوكلاء المتمحورين حول القنوات.
إنه يستبعد أدوات الأوامر/التحكم الأوسع مثل نظام الملفات ووقت التشغيل
والمتصفح وcanvas وnodes وcron والتحكم في Gateway. استخدم `tools.profile: "full"`
كخط أساس غير مقيد لوصول أوسع إلى الأوامر/التحكم، ثم قلّص
الوصول باستخدام `tools.allow` / `tools.deny` عند الحاجة.
</Note>

يتضمن `coding` أدوات ويب خفيفة (`web_search` و`web_fetch` و`x_search`)
لكن ليس أداة التحكم الكامل في المتصفح. يمكن لأتمتة المتصفح قيادة
جلسات حقيقية وملفات تعريف مسجلة الدخول، لذلك أضفها صراحة باستخدام
`tools.alsoAllow: ["browser"]` أو لكل وكيل
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
لا تؤدي تهيئة `tools.exec` أو `tools.fs` ضمن ملف تعريف مقيد (`messaging`, `minimal`) إلى توسيع قائمة السماح الخاصة بملف التعريف ضمنيًا. أضف إدخالات `tools.alsoAllow` صريحة (مثل `["exec", "process"]` لـ exec، أو `["read", "write", "edit"]` لـ fs) عندما تريد أن يستخدم ملف تعريف مقيد تلك الأقسام المهيأة. يسجل OpenClaw تحذير بدء تشغيل عندما يكون قسم إعدادات موجودًا دون منحة `alsoAllow` مطابقة.
</Note>

تسمح ملفات تعريف `coding` و`messaging` أيضًا بأدوات MCP المجمعة المهيأة
ضمن مفتاح Plugin `bundle-mcp`. أضف `tools.deny: ["bundle-mcp"]` عندما
تريد أن يحتفظ ملف التعريف بأدواته المدمجة العادية مع إخفاء كل أدوات MCP المهيأة.
لا يتضمن ملف التعريف `minimal` أدوات MCP المجمعة.

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

| المجموعة           | الأدوات                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (يُقبل `bash` كاسم بديل لـ `exec`)                                 |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas عند تمكين Plugin Canvas المضمّن                                                 |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | كل أدوات OpenClaw المضمّنة (باستثناء أدوات Plugin)                                                       |

يعيد `sessions_history` عرض استدعاء محدودًا ومفلترًا للسلامة. فهو يزيل
وسوم التفكير، وهياكل `<relevant-memories>`، وحمولات XML لاستدعاءات الأدوات بنص عادي
(بما في ذلك `<tool_call>...</tool_call>`،
و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`،
و`<function_calls>...</function_calls>`، وكتل استدعاءات الأدوات المبتورة)،
وهياكل استدعاءات الأدوات المخفّضة، ورموز التحكم المسرّبة الخاصة بالنموذج
بترميز ASCII/العرض الكامل، وXML غير صحيح لاستدعاءات أدوات MiniMax من نص المساعد، ثم يطبق
التنقيح/البتر وربما عناصر نائبة للصفوف كبيرة الحجم بدلًا من التصرف
كتفريغ خام للنص الكامل.

### قيود خاصة بالموفر

استخدم `tools.byProvider` لتقييد الأدوات لموفرين محددين دون
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
