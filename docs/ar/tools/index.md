---
read_when:
    - تريد فهم الأدوات التي يوفّرها OpenClaw
    - تحتاج إلى تهيئة الأدوات أو السماح بها أو منعها
    - أنت تقرر بين الأدوات المدمجة وSkills وPlugins
summary: 'نظرة عامة على أدوات OpenClaw وPlugins: ما الذي يمكن للوكيل فعله وكيفية توسيعه'
title: الأدوات وPlugins
x-i18n:
    generated_at: "2026-04-22T07:18:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6edb9e13b72e6345554f25c8d8413d167a69501e6626828d9aa3aac6907cd092
    source_path: tools/index.md
    workflow: 15
---

# الأدوات وPlugins

كل ما يفعله الوكيل خارج نطاق توليد النص يتم عبر **الأدوات**.
الأدوات هي الطريقة التي يقرأ بها الوكيل الملفات، ويشغّل الأوامر، ويتصفح الويب، ويرسل
الرسائل، ويتفاعل مع الأجهزة.

## الأدوات وSkills وPlugins

يحتوي OpenClaw على ثلاث طبقات تعمل معًا:

<Steps>
  <Step title="الأدوات هي ما يستدعيه الوكيل">
    الأداة هي دالة typed يمكن للوكيل استدعاؤها (مثل `exec` و`browser` و
    `web_search` و`message`). يأتي OpenClaw مع مجموعة من **الأدوات المدمجة**
    ويمكن لـ Plugins تسجيل أدوات إضافية.

    يرى الوكيل الأدوات على أنها تعريفات دوال منظَّمة تُرسل إلى API النموذج.

  </Step>

  <Step title="تعلّم Skills الوكيل متى وكيف">
    الـ skill هو ملف markdown ‏(`SKILL.md`) يُحقن في system prompt.
    تمنح Skills الوكيل سياقًا وقيودًا وإرشادات خطوة بخطوة من أجل
    استخدام الأدوات بفعالية. توجد Skills في مساحة العمل لديك، أو في المجلدات
    المشتركة، أو تأتي مضمّنة داخل Plugins.

    [مرجع Skills](/ar/tools/skills) | [إنشاء Skills](/ar/tools/creating-skills)

  </Step>

  <Step title="تجمع Plugins كل شيء معًا">
    الـ Plugin هو حزمة يمكنها تسجيل أي مزيج من القدرات:
    القنوات، وموفّرو النماذج، والأدوات، وSkills، والكلام، والنسخ الفوري،
    والصوت الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو،
    وجلب الويب، والبحث على الويب، وغير ذلك. بعض Plugins **أساسية** (تأتي مع
    OpenClaw)، وبعضها الآخر **خارجية** (ينشرها المجتمع على npm).

    [تثبيت Plugins وتهيئتها](/ar/tools/plugin) | [أنشئ Plugin خاصًا بك](/ar/plugins/building-plugins)

  </Step>
</Steps>

## الأدوات المدمجة

تأتي هذه الأدوات مع OpenClaw وتكون متاحة من دون تثبيت أي Plugins:

| الأداة                                      | ما الذي تفعله                                                      | الصفحة                                      |
| ------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------- |
| `exec` / `process`                          | تشغيل أوامر shell وإدارة العمليات في الخلفية                      | [Exec](/ar/tools/exec)                         |
| `code_execution`                            | تشغيل تحليل Python بعيد داخل بيئة معزولة                           | [Code Execution](/ar/tools/code-execution)     |
| `browser`                                   | التحكّم في متصفح Chromium (التنقل، النقر، لقطة شاشة)              | [Browser](/ar/tools/browser)                   |
| `web_search` / `x_search` / `web_fetch`     | البحث على الويب، والبحث في منشورات X، وجلب محتوى الصفحات         | [الويب](/ar/tools/web)                         |
| `read` / `write` / `edit`                   | إدخال/إخراج الملفات في مساحة العمل                                |                                             |
| `apply_patch`                               | ترقيعات ملفات متعددة المقاطع                                       | [Apply Patch](/ar/tools/apply-patch)           |
| `message`                                   | إرسال الرسائل عبر جميع القنوات                                     | [Agent Send](/ar/tools/agent-send)             |
| `canvas`                                    | تشغيل node Canvas ‏(عرض، eval، snapshot)                          |                                             |
| `nodes`                                     | اكتشاف الأجهزة المقترنة واستهدافها                                 |                                             |
| `cron` / `gateway`                          | إدارة المهام المجدولة؛ وفحص Gateway أو ترقيعه أو إعادة تشغيله أو تحديثه |                                             |
| `image` / `image_generate`                  | تحليل الصور أو إنشاؤها                                             | [Image Generation](/ar/tools/image-generation) |
| `music_generate`                            | إنشاء مقاطع موسيقية                                                | [Music Generation](/ar/tools/music-generation) |
| `video_generate`                            | إنشاء مقاطع فيديو                                                  | [Video Generation](/ar/tools/video-generation) |
| `tts`                                       | تحويل النص إلى كلام دفعة واحدة                                     | [TTS](/ar/tools/tts)                           |
| `sessions_*` / `subagents` / `agents_list`  | إدارة الجلسات، والحالة، وتنسيق الوكلاء الفرعيين                   | [Sub-agents](/ar/tools/subagents)              |
| `session_status`                            | قراءة خفيفة على نمط `/status` وتجاوز نموذج الجلسة                 | [أدوات الجلسة](/ar/concepts/session-tool)      |

بالنسبة إلى العمل على الصور، استخدم `image` للتحليل و`image_generate` للإنشاء أو التحرير. إذا كنت تستهدف `openai/*` أو `google/*` أو `fal/*` أو موفّر صور غير افتراضي آخر، فقم أولًا بتهيئة auth/API key لذلك الموفّر.

بالنسبة إلى العمل الموسيقي، استخدم `music_generate`. إذا كنت تستهدف `google/*` أو `minimax/*` أو موفّر موسيقى غير افتراضي آخر، فقم أولًا بتهيئة auth/API key لذلك الموفّر.

بالنسبة إلى العمل على الفيديو، استخدم `video_generate`. إذا كنت تستهدف `qwen/*` أو موفّر فيديو غير افتراضي آخر، فقم أولًا بتهيئة auth/API key لذلك الموفّر.

بالنسبة إلى إنشاء الصوت المعتمد على سير العمل، استخدم `music_generate` عندما يقوم Plugin مثل
ComfyUI بتسجيله. وهذا منفصل عن `tts`، الذي يختص بتحويل النص إلى كلام.

الأداة `session_status` هي أداة الحالة/القراءة الخفيفة ضمن مجموعة الجلسات.
فهي تجيب عن أسئلة على نمط `/status` حول الجلسة الحالية، ويمكنها
اختياريًا تعيين تجاوز نموذج لكل جلسة؛ ويؤدي `model=default` إلى مسح ذلك
التجاوز. ومثل `/status`، يمكنها إكمال عدادات الرموز/التخزين المؤقت المتفرقة ووسم
النموذج النشط في Runtime من أحدث إدخال استخدام في السجل.

الأداة `gateway` هي أداة Runtime مخصصة للمالك فقط لعمليات Gateway:

- `config.schema.lookup` للحصول على شجرة إعدادات فرعية بنطاق مسار واحد قبل التحرير
- `config.get` للحصول على لقطة الإعدادات الحالية + hash
- `config.patch` لتحديثات الإعدادات الجزئية مع إعادة التشغيل
- `config.apply` فقط للاستبدال الكامل للإعدادات
- `update.run` لتنفيذ التحديث الذاتي + إعادة التشغيل بشكل صريح

بالنسبة إلى التغييرات الجزئية، يُفضَّل استخدام `config.schema.lookup` ثم
`config.patch`. واستخدم `config.apply` فقط عندما تنوي عمدًا استبدال الإعدادات بالكامل.
وترفض الأداة أيضًا تغيير `tools.exec.ask` أو `tools.exec.security`؛
كما تُطبَّع الأسماء المستعارة القديمة `tools.bash.*` إلى مسارات exec المحمية نفسها.

### الأدوات التي توفّرها Plugins

يمكن لـ Plugins تسجيل أدوات إضافية. بعض الأمثلة:

- [Diffs](/ar/tools/diffs) — عارض ومُصيّر للاختلافات
- [LLM Task](/ar/tools/llm-task) — خطوة LLM تعتمد JSON فقط للمخرجات المنظَّمة
- [Lobster](/ar/tools/lobster) — Runtime لسير عمل typed مع موافقات قابلة للاستئناف
- [Music Generation](/ar/tools/music-generation) — أداة `music_generate` مشتركة مع موفّرين مدعومين بسير العمل
- [OpenProse](/ar/prose) — تنسيق سير العمل بأسلوب markdown-first
- [Tokenjuice](/ar/tools/tokenjuice) — نتائج مضغوطة لأداتي `exec` و`bash` كثيرة الضجيج

## تهيئة الأدوات

### قوائم السماح والمنع

تحكّم في الأدوات التي يمكن للوكيل استدعاؤها عبر `tools.allow` / `tools.deny` في
الإعدادات. وتكون الأولوية دائمًا للمنع على السماح.

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

| الملف التعريفي | ما الذي يتضمنه                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `full`         | بلا قيود (مماثل لعدم التعيين)                                                                                                                   |
| `coding`       | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging`    | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                        |
| `minimal`      | `session_status` فقط                                                                                                                             |

### مجموعات الأدوات

استخدم اختصارات `group:*` في قوائم السماح/المنع:

| المجموعة           | الأدوات                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (يُقبل `bash` كاسم مستعار لـ `exec`)                                         |
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
| `group:openclaw`   | جميع أدوات OpenClaw المدمجة (باستثناء أدوات Plugins)                                                      |

تعيد `sessions_history` عرض استرجاع مقيّدًا ومفلترًا للسلامة. فهي تزيل
وسوم التفكير، وهيكل `<relevant-memories>`، وحمولات XML النصية العادية
لاستدعاء الأدوات (بما في ذلك `<tool_call>...</tool_call>`،
و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`،
و`<function_calls>...</function_calls>`، وكتل استدعاء الأدوات المقتطعة)،
وهيكل استدعاء الأدوات المخفّض، ورموز التحكم بالنموذج المسرّبة بتنسيق ASCII/العرض الكامل،
وXML استدعاء الأدوات غير الصحيح من MiniMax في نص المساعد، ثم تطبق
الإخفاء/الاقتطاع وربما عناصر نائبة للصفوف كبيرة الحجم بدلًا من التعامل معه
كإخراج خام للسجل.

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
