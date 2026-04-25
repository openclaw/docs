---
read_when:
    - أنت تريد فهم الأدوات التي يوفرها OpenClaw
    - أنت بحاجة إلى تهيئة الأدوات أو السماح بها أو منعها
    - أنت تتخذ قرارًا بين الأدوات المضمّنة وSkills وPlugins
summary: 'نظرة عامة على أدوات OpenClaw وPlugins: ما الذي يمكن للوكيل فعله وكيفية توسيعه'
title: الأدوات وPlugins
x-i18n:
    generated_at: "2026-04-25T18:23:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 72f1257f5e556b57238f9a0ff01574510f310250cf6da73c74f9f2421fa2c917
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
    الأداة هي دالة مكتوبة النوع يمكن للوكيل استدعاؤها (مثل `exec` و`browser` و
    `web_search` و`message`). يشحن OpenClaw مجموعة من **الأدوات المضمّنة**
    ويمكن لـ Plugins تسجيل أدوات إضافية.

    يرى الوكيل الأدوات على هيئة تعريفات دوال منظمة تُرسل إلى واجهة API الخاصة بالنموذج.

  </Step>

  <Step title="Skills تعلّم الوكيل متى وكيف">
    Skill هي ملف markdown (`SKILL.md`) يُحقن في system prompt.
    توفّر Skills للوكيل السياق والقيود والإرشادات خطوة بخطوة من أجل
    استخدام الأدوات بفعالية. توجد Skills في مساحة العمل الخاصة بك، أو في مجلدات
    مشتركة، أو تكون مضمنة داخل Plugins.

    [مرجع Skills](/ar/tools/skills) | [إنشاء Skills](/ar/tools/creating-skills)

  </Step>

  <Step title="Plugins تجمع كل شيء معًا">
    Plugin هي حزمة يمكنها تسجيل أي مجموعة من القدرات:
    القنوات، ومزوّدي النماذج، والأدوات، وSkills، والكلام، والنسخ الفوري،
    والصوت الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو،
    وجلب الويب، والبحث على الويب، وغير ذلك. بعض Plugins **أساسية** (تُشحن مع
    OpenClaw)، وبعضها الآخر **خارجية** (ينشرها المجتمع على npm).

    [تثبيت Plugins وتهيئتها](/ar/tools/plugin) | [أنشئ Plugin خاصة بك](/ar/plugins/building-plugins)

  </Step>
</Steps>

## الأدوات المضمّنة

تُشحن هذه الأدوات مع OpenClaw وتكون متاحة من دون تثبيت أي Plugins:

| الأداة | ما الذي تفعله | الصفحة |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process` | تشغيل أوامر shell، وإدارة العمليات في الخلفية | [Exec](/ar/tools/exec), [Exec Approvals](/ar/tools/exec-approvals) |
| `code_execution` | تشغيل تحليل Python بعيد داخل sandbox | [Code Execution](/ar/tools/code-execution) |
| `browser` | التحكم في متصفح Chromium (التنقل، والنقر، وأخذ لقطات الشاشة) | [Browser](/ar/tools/browser) |
| `web_search` / `x_search` / `web_fetch` | البحث على الويب، والبحث في منشورات X، وجلب محتوى الصفحات | [Web](/ar/tools/web), [Web Fetch](/ar/tools/web-fetch) |
| `read` / `write` / `edit` | إدخال/إخراج الملفات في مساحة العمل | |
| `apply_patch` | ترقيعات ملفات متعددة المقاطع | [Apply Patch](/ar/tools/apply-patch) |
| `message` | إرسال الرسائل عبر كل القنوات | [Agent Send](/ar/tools/agent-send) |
| `canvas` | تشغيل Canvas الخاصة بـ Node ‏(عرض، eval، snapshot) | |
| `nodes` | اكتشاف الأجهزة المقترنة واستهدافها | |
| `cron` / `gateway` | إدارة الوظائف المجدولة؛ وفحص Gateway أو ترقيعها أو إعادة تشغيلها أو تحديثها | |
| `image` / `image_generate` | تحليل الصور أو توليدها | [Image Generation](/ar/tools/image-generation) |
| `music_generate` | توليد مقاطع موسيقية | [Music Generation](/ar/tools/music-generation) |
| `video_generate` | توليد مقاطع فيديو | [Video Generation](/ar/tools/video-generation) |
| `tts` | تحويل النص إلى كلام لمرة واحدة | [TTS](/ar/tools/tts) |
| `sessions_*` / `subagents` / `agents_list` | إدارة الجلسات، والحالة، وتنسيق الوكلاء الفرعيين | [Sub-agents](/ar/tools/subagents) |
| `session_status` | قراءة خفيفة على نمط `/status` وتجاوز نموذج الجلسة | [Session Tools](/ar/concepts/session-tool) |

في أعمال الصور، استخدم `image` للتحليل و`image_generate` للتوليد أو التحرير. إذا كنت تستهدف `openai/*` أو `google/*` أو `fal/*` أو مزوّد صور غير افتراضي آخر، فقم أولًا بتهيئة المصادقة/مفتاح API لذلك المزوّد.

في أعمال الموسيقى، استخدم `music_generate`. إذا كنت تستهدف `google/*` أو `minimax/*` أو مزوّد موسيقى غير افتراضي آخر، فقم أولًا بتهيئة المصادقة/مفتاح API لذلك المزوّد.

في أعمال الفيديو، استخدم `video_generate`. إذا كنت تستهدف `qwen/*` أو مزوّد فيديو غير افتراضي آخر، فقم أولًا بتهيئة المصادقة/مفتاح API لذلك المزوّد.

في توليد الصوت المعتمد على سير العمل، استخدم `music_generate` عندما تقوم Plugin مثل
ComfyUI بتسجيله. وهذا منفصل عن `tts`، الذي يختص بتحويل النص إلى كلام.

الأداة `session_status` هي أداة الحالة/القراءة الخفيفة في مجموعة الجلسات.
فهي تجيب عن أسئلة على نمط `/status` حول الجلسة الحالية ويمكنها
اختياريًا ضبط تجاوز نموذج لكل جلسة؛ وتؤدي `model=default` إلى مسح
ذلك التجاوز. وكما في `/status`، يمكنها أن تملأ احتياطيًا عدادات token/cache
المتناثرة وتسميات نموذج وقت التشغيل النشط من أحدث إدخال استخدام في النص.

الأداة `gateway` هي أداة وقت التشغيل المخصّصة للمالك فقط لعمليات Gateway:

- `config.schema.lookup` لشجرة إعداد فرعية واحدة مقيّدة بالمسار قبل التعديلات
- `config.get` للحصول على لقطة الإعداد الحالية + hash
- `config.patch` لتحديثات الإعداد الجزئية مع إعادة التشغيل
- `config.apply` فقط للاستبدال الكامل للإعداد
- `update.run` للتحديث الذاتي الصريح + إعادة التشغيل

في التغييرات الجزئية، فضّل `config.schema.lookup` ثم `config.patch`. واستخدم
`config.apply` فقط عندما تكون تنوي عمدًا استبدال الإعداد بالكامل.
كما ترفض الأداة أيضًا تغيير `tools.exec.ask` أو `tools.exec.security`؛
وتُطبّع الأسماء البديلة القديمة `tools.bash.*` إلى مسارات exec المحمية نفسها.

### الأدوات التي توفرها Plugins

يمكن لـ Plugins تسجيل أدوات إضافية. ومن الأمثلة:

- [Diffs](/ar/tools/diffs) — عارض ومصيّر فروق
- [LLM Task](/ar/tools/llm-task) — خطوة LLM بإخراج JSON فقط للحصول على مخرجات منظمة
- [Lobster](/ar/tools/lobster) — وقت تشغيل سير عمل مكتوب النوع مع موافقات قابلة للاستئناف
- [Music Generation](/ar/tools/music-generation) — أداة `music_generate` مشتركة مع مزوّدين مدعومين بسير العمل
- [OpenProse](/ar/prose) — تنسيق سير عمل markdown أولًا
- [Tokenjuice](/ar/tools/tokenjuice) — ضغط نتائج أدوات `exec` و`bash` المليئة بالضجيج

## تهيئة الأدوات

### قوائم السماح والمنع

تحكم في الأدوات التي يمكن للوكيل استدعاؤها عبر `tools.allow` / `tools.deny` في
الإعداد. وتغلب قائمة المنع دائمًا قائمة السماح.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

يفشل OpenClaw بطريقة مغلقة عندما تُحل قائمة سماح صريحة إلى صفر من الأدوات القابلة للاستدعاء.
فعلى سبيل المثال، لا تعمل `tools.allow: ["query_db"]` إلا إذا كانت Plugin محمّلة قد
سجّلت بالفعل `query_db`. وإذا لم تطابق قائمة السماح أي أداة مضمّنة أو أداة Plugin أو أداة MCP
مجمّعة، فيتوقف التشغيل قبل استدعاء النموذج بدلًا من الاستمرار كتشغيل نصي فقط قد
يهلوس بنتائج أدوات.

### ملفات تعريف الأدوات

يضبط `tools.profile` قائمة سماح أساسية قبل تطبيق `allow`/`deny`.
التجاوز لكل وكيل: `agents.list[].tools.profile`.

| ملف التعريف | ما الذي يتضمنه |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full` | بلا تقييد (مثل عدم الضبط) |
| `coding` | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status` |
| `minimal` | `session_status` فقط |

يتضمن `coding` أدوات ويب خفيفة (`web_search` و`web_fetch` و`x_search`)
لكن ليس أداة التحكم الكاملة بالمتصفح. يمكن لأتمتة المتصفح أن تقود جلسات
حقيقية وملفات تعريف مسجّل الدخول فيها، لذلك أضفها صراحةً باستخدام
`tools.alsoAllow: ["browser"]` أو تجاوز لكل وكيل عبر
`agents.list[].tools.alsoAllow: ["browser"]`.

كما تسمح ملفّات التعريف `coding` و`messaging` أيضًا بأدوات MCP المجمّعة المكوّنة
تحت مفتاح Plugin ‏`bundle-mcp`. أضف `tools.deny: ["bundle-mcp"]` عندما
تريد من ملف تعريف أن يحتفظ بأدواته المضمّنة المعتادة لكنه يخفي كل أدوات MCP المكوّنة.
أما ملف التعريف `minimal` فلا يتضمن أدوات MCP المجمّعة.

### مجموعات الأدوات

استخدم الصيغ المختصرة `group:*` في قوائم السماح/المنع:

| المجموعة | الأدوات |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime` | exec, process, code_execution (`bash` مقبول كاسم بديل لـ `exec`) |
| `group:fs` | read, write, edit, apply_patch |
| `group:sessions` | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory` | memory_search, memory_get |
| `group:web` | web_search, x_search, web_fetch |
| `group:ui` | browser, canvas |
| `group:automation` | cron, gateway |
| `group:messaging` | message |
| `group:nodes` | nodes |
| `group:agents` | agents_list |
| `group:media` | image, image_generate, music_generate, video_generate, tts |
| `group:openclaw` | كل أدوات OpenClaw المضمّنة (باستثناء أدوات Plugins) |

تعيد `sessions_history` عرض استرجاع محدودًا ومفلترًا من ناحية السلامة. فهي تزيل
وسوم التفكير، وبنية `<relevant-memories>`، وحمولات XML النصية العادية الخاصة باستدعاءات الأدوات
(بما في ذلك `<tool_call>...</tool_call>`،
و`<function_call>...</function_call>`،
و`<tool_calls>...</tool_calls>`،
و`<function_calls>...</function_calls>`،
وكتل استدعاء الأدوات المقتطعة)،
وبنية استدعاء الأدوات المخفَّضة، ورموز التحكم بالنموذج المسرّبة بصيغة ASCII/العرض الكامل،
وXML استدعاء الأدوات المشوّهة الخاصة بـ MiniMax من نص المساعد، ثم تطبق
الإخفاء/الاقتطاع وربما عناصر نائبة للصفوف كبيرة الحجم بدلًا من أن تعمل
كتفريغ خام للنص.

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
