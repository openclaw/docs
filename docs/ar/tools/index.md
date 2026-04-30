---
read_when:
    - تريد فهم الأدوات التي يوفرها OpenClaw
    - تحتاج إلى تكوين الأدوات أو السماح بها أو رفضها
    - أنت تفاضل بين الأدوات المضمّنة وSkills وPlugin
summary: 'نظرة عامة على أدوات OpenClaw وPlugins: ما يمكن للوكيل فعله وكيفية توسيع إمكاناته'
title: الأدوات والمكوّنات الإضافية
x-i18n:
    generated_at: "2026-04-30T08:30:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62cde740188c224af03b4425c7f6dfca9a12f95603066db5925724fc6a07dcf0
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
    الأداة هي دالة ذات نوع محدد يمكن للوكيل استدعاؤها (مثل `exec`، و`browser`،
    و`web_search`، و`message`). يوفّر OpenClaw مجموعة من **الأدوات المدمجة** ويمكن
    لـPlugins تسجيل أدوات إضافية.

    يرى الوكيل الأدوات كتعريفات دوال منظّمة تُرسل إلى واجهة API الخاصة بالنموذج.

  </Step>

  <Step title="تعلم Skills الوكيل متى وكيف">
    Skill هي ملف ماركداون (`SKILL.md`) يُحقن في مطالبة النظام.
    تمنح Skills الوكيل السياق والقيود والإرشاد خطوة بخطوة من أجل
    استخدام الأدوات بفعالية. تعيش Skills في مساحة عملك، أو في مجلدات مشتركة،
    أو تُشحن داخل Plugins.

    [مرجع Skills](/ar/tools/skills) | [إنشاء Skills](/ar/tools/creating-skills)

  </Step>

  <Step title="تجمع Plugins كل شيء معًا">
    Plugin هي حزمة يمكنها تسجيل أي مزيج من القدرات:
    القنوات، وموفري النماذج، والأدوات، وSkills، والكلام، والنسخ الفوري،
    والصوت الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو،
    وجلب الويب، وبحث الويب، والمزيد. بعض Plugins هي **أساسية** (مشحونة مع
    OpenClaw)، وأخرى **خارجية** (ينشرها المجتمع على npm).

    [تثبيت Plugins وتكوينها](/ar/tools/plugin) | [ابنِ Plugin الخاصة بك](/ar/plugins/building-plugins)

  </Step>
</Steps>

## الأدوات المدمجة

تُشحن هذه الأدوات مع OpenClaw وتكون متاحة من دون تثبيت أي Plugins:

| الأداة                                     | ما تفعله                                                              | الصفحة                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | تشغيل أوامر الصدفة وإدارة العمليات الخلفية                           | [Exec](/ar/tools/exec), [موافقات Exec](/ar/tools/exec-approvals) |
| `code_execution`                           | تشغيل تحليل Python بعيد داخل صندوق عزل                               | [تنفيذ الكود](/ar/tools/code-execution)                         |
| `browser`                                  | التحكم في متصفح Chromium (التنقل، النقر، لقطة شاشة)                  | [المتصفح](/ar/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | البحث في الويب، والبحث في منشورات X، وجلب محتوى الصفحات              | [الويب](/ar/tools/web), [جلب الويب](/ar/tools/web-fetch)          |
| `read` / `write` / `edit`                  | إدخال/إخراج الملفات في مساحة العمل                                   |                                                              |
| `apply_patch`                              | تصحيحات ملفات متعددة المقاطع                                         | [تطبيق التصحيح](/ar/tools/apply-patch)                         |
| `message`                                  | إرسال رسائل عبر جميع القنوات                                         | [إرسال الوكيل](/ar/tools/agent-send)                           |
| `canvas`                                   | قيادة Canvas الخاص بـNode (عرض، تقييم، لقطة)                         |                                                              |
| `nodes`                                    | اكتشاف الأجهزة المقترنة واستهدافها                                   |                                                              |
| `cron` / `gateway`                         | إدارة المهام المجدولة؛ فحص Gateway أو تصحيحه أو إعادة تشغيله أو تحديثه |                                                              |
| `image` / `image_generate`                 | تحليل الصور أو توليدها                                               | [توليد الصور](/ar/tools/image-generation)                      |
| `music_generate`                           | توليد المقاطع الموسيقية                                              | [توليد الموسيقى](/ar/tools/music-generation)                   |
| `video_generate`                           | توليد الفيديوهات                                                     | [توليد الفيديو](/ar/tools/video-generation)                    |
| `tts`                                      | تحويل نص إلى كلام لمرة واحدة                                         | [TTS](/ar/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | إدارة الجلسات والحالة وتنسيق الوكلاء الفرعيين                        | [الوكلاء الفرعيون](/ar/tools/subagents)                        |
| `session_status`                           | قراءة خفيفة بأسلوب `/status` وتجاوز نموذج الجلسة                     | [أدوات الجلسة](/ar/concepts/session-tool)                      |

لأعمال الصور، استخدم `image` للتحليل و`image_generate` للتوليد أو التحرير. إذا كنت تستهدف `openai/*` أو `google/*` أو `fal/*` أو موفر صور غير افتراضي آخر، فكوّن مفتاح مصادقة/API لذلك الموفر أولًا.

لأعمال الموسيقى، استخدم `music_generate`. إذا كنت تستهدف `google/*` أو `minimax/*` أو موفر موسيقى غير افتراضي آخر، فكوّن مفتاح مصادقة/API لذلك الموفر أولًا.

لأعمال الفيديو، استخدم `video_generate`. إذا كنت تستهدف `qwen/*` أو موفر فيديو غير افتراضي آخر، فكوّن مفتاح مصادقة/API لذلك الموفر أولًا.

لتوليد الصوت المدفوع بسير العمل، استخدم `music_generate` عندما تسجله Plugin مثل
ComfyUI. هذا منفصل عن `tts`، وهو تحويل النص إلى كلام.

`session_status` هي أداة الحالة/القراءة الخفيفة في مجموعة الجلسات.
تجيب عن أسئلة بأسلوب `/status` حول الجلسة الحالية ويمكنها
اختياريًا تعيين تجاوز للنموذج على مستوى الجلسة؛ يمسح `model=default` ذلك
التجاوز. مثل `/status`، يمكنها ملء عدادات الرموز/التخزين المؤقت المتناثرة ووسم
نموذج وقت التشغيل النشط من أحدث إدخال استخدام في النص المسجل.

`gateway` هي أداة وقت التشغيل الخاصة بالمالك فقط لعمليات Gateway:

- `config.schema.lookup` لشجرة تكوين فرعية محددة المسار قبل التحرير
- `config.get` للقطة التكوين الحالية + التجزئة
- `config.patch` لتحديثات تكوين جزئية مع إعادة التشغيل
- `config.apply` فقط للاستبدال الكامل للتكوين
- `update.run` للتحديث الذاتي الصريح + إعادة التشغيل

للتغييرات الجزئية، فضّل `config.schema.lookup` ثم `config.patch`. استخدم
`config.apply` فقط عندما تتعمد استبدال التكوين بالكامل.
لمستندات التكوين الأوسع، اقرأ [التكوين](/ar/gateway/configuration) و
[مرجع التكوين](/ar/gateway/configuration-reference).
ترفض الأداة أيضًا تغيير `tools.exec.ask` أو `tools.exec.security`؛
تُطبّع الأسماء البديلة القديمة `tools.bash.*` إلى مسارات exec المحمية نفسها.

### الأدوات التي توفرها Plugins

يمكن لـPlugins تسجيل أدوات إضافية. بعض الأمثلة:

- [الفروقات](/ar/tools/diffs) — عارض الفروقات ومصيّرها
- [مهمة LLM](/ar/tools/llm-task) — خطوة LLM بصيغة JSON فقط للمخرجات المنظمة
- [Lobster](/ar/tools/lobster) — وقت تشغيل سير عمل مضبوط الأنواع مع موافقات قابلة للاستئناف
- [توليد الموسيقى](/ar/tools/music-generation) — أداة `music_generate` مشتركة مع موفرين مدعومين بسير العمل
- [OpenProse](/ar/prose) — تنسيق سير عمل قائم على ماركداون أولًا
- [Tokenjuice](/ar/tools/tokenjuice) — ضغط نتائج أدوات `exec` و`bash` الصاخبة

## تكوين الأدوات

### قوائم السماح والمنع

تحكم في الأدوات التي يمكن للوكيل استدعاؤها عبر `tools.allow` / `tools.deny` في
التكوين. المنع يتغلب دائمًا على السماح.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

يفشل OpenClaw مغلقًا عندما تتحلل قائمة سماح صريحة إلى عدم وجود أدوات قابلة للاستدعاء.
على سبيل المثال، لا يعمل `tools.allow: ["query_db"]` إلا إذا كانت Plugin محمّلة تسجل بالفعل
`query_db`. إذا لم تطابق أي أداة مدمجة أو Plugin أو أداة MCP مضمّنة
قائمة السماح، يتوقف التشغيل قبل استدعاء النموذج بدلًا من المتابعة كتوليد
نصي فقط قد يهلوس نتائج الأدوات.

### ملفات تعريف الأدوات

يعيّن `tools.profile` قائمة سماح أساسية قبل تطبيق `allow`/`deny`.
تجاوز على مستوى الوكيل: `agents.list[].tools.profile`.

| ملف التعريف | ما يتضمنه                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | خط أساس غير مقيد لوصول أوسع إلى الأوامر/التحكم؛ وهو نفسه ترك `tools.profile` غير معيّن                                                          |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status` فقط                                                                                                                             |

<Note>
`tools.profile: "messaging"` ضيق عمدًا للوكلاء الذين يركزون على القنوات.
فهو يستبعد أدوات أوامر/تحكم أوسع مثل نظام الملفات ووقت التشغيل
والمتصفح وcanvas وnodes وcron والتحكم في Gateway. استخدم `tools.profile: "full"`
كخط أساس غير مقيد لوصول أوسع إلى الأوامر/التحكم، ثم قلّص
الوصول باستخدام `tools.allow` / `tools.deny` عند الحاجة.
</Note>

يتضمن `coding` أدوات ويب خفيفة (`web_search`، و`web_fetch`، و`x_search`)
لكن ليس أداة التحكم الكامل في المتصفح. يمكن لأتمتة المتصفح قيادة
جلسات حقيقية وملفات تعريف مسجلة الدخول، لذلك أضفها صراحة باستخدام
`tools.alsoAllow: ["browser"]` أو على مستوى الوكيل
`agents.list[].tools.alsoAllow: ["browser"]`.

تسمح ملفات التعريف `coding` و`messaging` أيضًا بأدوات bundle MCP المكوّنة
تحت مفتاح Plugin `bundle-mcp`. أضف `tools.deny: ["bundle-mcp"]` عندما
تريد أن يحتفظ ملف التعريف بأدواته المدمجة العادية لكن يخفي كل أدوات MCP المكوّنة.
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

استخدم اختصارات `group:*` في قوائم السماح/المنع:

| المجموعة           | الأدوات                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` يُقبل كاسم مستعار لـ `exec`)                                        |
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
| `group:openclaw`   | جميع أدوات OpenClaw المدمجة (باستثناء أدوات Plugin)                                                       |

يعيد `sessions_history` عرض استدعاء محدودًا ومفلترًا للأمان. يزيل
وسوم التفكير، وسقالات `<relevant-memories>`، وحمولات XML لاستدعاءات الأدوات
بنص عادي (بما في ذلك `<tool_call>...</tool_call>`،
و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`،
و`<function_calls>...</function_calls>`، وكتل استدعاءات الأدوات المقتطعة)،
وسقالات استدعاءات الأدوات المخفّضة، ورموز تحكم النموذج المسرّبة بصيغة ASCII/العرض الكامل،
وXML غير السليم لاستدعاءات أدوات MiniMax من نص المساعد، ثم يطبّق
التنقيح/الاقتطاع والعناصر النائبة المحتملة للصفوف كبيرة الحجم بدلًا من التصرف
كتفريغ خام للنص الكامل.

### القيود الخاصة بموفّر الخدمة

استخدم `tools.byProvider` لتقييد الأدوات لموفّري خدمة محددين من دون
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
