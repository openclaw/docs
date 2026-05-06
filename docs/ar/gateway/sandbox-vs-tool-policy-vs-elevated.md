---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'لماذا تُحظر أداة: بيئة تشغيل العزل، وسياسة السماح/المنع للأدوات، وبوابات التنفيذ بصلاحيات مرتفعة'
title: بيئة العزل مقابل سياسة الأدوات مقابل الصلاحيات المرتفعة
x-i18n:
    generated_at: "2026-05-06T07:56:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd303355774e3d73161b5704ba664d7418160e9b6792a904c7d5092e0351b320
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

لدى OpenClaw ثلاثة عناصر تحكم مرتبطة (لكنها مختلفة):

1. **العزل** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) يحدد **أين تعمل الأدوات** (واجهة العزل الخلفية أم المضيف).
2. **سياسة الأدوات** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) تحدد **أي الأدوات متاحة/مسموح بها**.
3. **الوضع المرتفع** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) هو **منفذ هروب مخصص لـ exec فقط** للتشغيل خارج العزل عندما تكون معزولًا (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec مهيأً إلى `node`).

## تصحيح سريع

استخدم أداة الفحص لترى ما يفعله OpenClaw _فعليًا_:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

يطبع:

- وضع/نطاق العزل الفعّال ووصول مساحة العمل
- ما إذا كانت الجلسة معزولة حاليًا (رئيسية مقابل غير رئيسية)
- السماح/الرفض الفعّال لأدوات العزل (وما إذا كان مصدره الوكيل/العمومي/الافتراضي)
- بوابات الوضع المرتفع ومسارات مفاتيح الإصلاح

## العزل: أين تعمل الأدوات

يتحكم `agents.defaults.sandbox.mode` بالعزل:

- `"off"`: يعمل كل شيء على المضيف.
- `"non-main"`: الجلسات غير الرئيسية فقط تكون معزولة (سبب "مفاجأة" شائع للمجموعات/القنوات).
- `"all"`: يكون كل شيء معزولًا.

راجع [العزل](/ar/gateway/sandboxing) للاطلاع على المصفوفة الكاملة (النطاق، وتركيبات مساحة العمل، والصور).

### تركيبات الربط (فحص أمني سريع)

- `docker.binds` _يخترق_ نظام ملفات العزل: كل ما تركبه يكون مرئيًا داخل الحاوية بالوضع الذي تحدده (`:ro` أو `:rw`).
- الافتراضي هو القراءة والكتابة إذا حذفت الوضع؛ فضّل `:ro` للمصدر/الأسرار.
- `scope: "shared"` يتجاهل تركيبات كل وكيل على حدة (تُطبّق التركيبات العمومية فقط).
- يتحقق OpenClaw من مصادر الربط مرتين: أولًا على مسار المصدر المطبّع، ثم مرة أخرى بعد الحل عبر أعمق أصل موجود. لا تتجاوز عمليات الخروج عبر أصل رابط رمزي فحوصات المسارات المحظورة أو الجذور المسموح بها.
- تُفحص مسارات الأوراق غير الموجودة بأمان أيضًا. إذا كان `/workspace/alias-out/new-file` يُحل عبر أصل مرتبط رمزيًا إلى مسار محظور أو خارج الجذور المسموح بها المهيأة، يُرفض الربط.
- ربط `/var/run/docker.sock` يمنح العزل فعليًا تحكمًا بالمضيف؛ لا تفعل ذلك إلا عن قصد.
- وصول مساحة العمل (`workspaceAccess: "ro"`/`"rw"`) مستقل عن أوضاع الربط.

## سياسة الأدوات: أي الأدوات موجودة/قابلة للاستدعاء

هناك طبقتان مهمتان:

- **ملف تعريف الأدوات**: `tools.profile` و `agents.list[].tools.profile` (قائمة السماح الأساسية)
- **ملف تعريف أدوات المزوّد**: `tools.byProvider[provider].profile` و `agents.list[].tools.byProvider[provider].profile`
- **سياسة الأدوات العمومية/لكل وكيل**: `tools.allow`/`tools.deny` و `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **سياسة أدوات المزوّد**: `tools.byProvider[provider].allow/deny` و `agents.list[].tools.byProvider[provider].allow/deny`
- **سياسة أدوات العزل** (تُطبّق فقط عند العزل): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` و `agents.list[].tools.sandbox.tools.*`

قواعد عامة:

- `deny` ينتصر دائمًا.
- إذا كانت `allow` غير فارغة، فكل شيء آخر يُعامل كمحظور.
- سياسة الأدوات هي حاجز الإيقاف الصارم: لا يمكن لـ `/exec` تجاوز أداة `exec` المرفوضة.
- يغيّر `/exec` افتراضات الجلسة فقط للمرسلين المصرح لهم؛ ولا يمنح وصولًا إلى الأدوات.
  تقبل مفاتيح أدوات المزوّد إما `provider` (مثل `google-antigravity`) أو `provider/model` (مثل `openai/gpt-5.4`).

### مجموعات الأدوات (اختصارات)

تدعم سياسات الأدوات (العمومية، الوكيل، العزل) إدخالات `group:*` التي تتوسع إلى عدة أدوات:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

المجموعات المتاحة:

- `group:runtime`: `exec`, `process`, `code_execution` (يُقبل `bash` كاسم
  مستعار لـ `exec`)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: كل أدوات OpenClaw المضمنة (باستثناء Plugins المزوّد)

## الوضع المرتفع: "التشغيل على المضيف" لـ exec فقط

لا يمنح الوضع المرتفع أدوات إضافية؛ إنه يؤثر فقط في `exec`.

- إذا كنت معزولًا، فإن `/elevated on` (أو `exec` مع `elevated: true`) يعمل خارج العزل (قد تظل الموافقات مطلوبة).
- استخدم `/elevated full` لتخطي موافقات exec للجلسة.
- إذا كنت تعمل مباشرة بالفعل، فالوضع المرتفع بلا أثر عمليًا (مع أنه ما زال محكومًا ببوابات).
- الوضع المرتفع **ليس** محدد النطاق حسب Skills ولا يتجاوز السماح/الرفض للأدوات.
- لا يمنح الوضع المرتفع تجاوزات عشوائية بين المضيفات من `host=auto`؛ بل يتبع قواعد هدف exec العادية ولا يحافظ على `node` إلا عندما يكون الهدف المهيأ/هدف الجلسة هو `node` بالفعل.
- `/exec` منفصل عن الوضع المرتفع. إنه يضبط فقط افتراضات exec لكل جلسة للمرسلين المصرح لهم.

البوابات:

- التمكين: `tools.elevated.enabled` (واختياريًا `agents.list[].tools.elevated.enabled`)
- قوائم السماح للمرسلين: `tools.elevated.allowFrom.<provider>` (واختياريًا `agents.list[].tools.elevated.allowFrom.<provider>`)

راجع [الوضع المرتفع](/ar/tools/elevated).

## إصلاحات "سجن العزل" الشائعة

### "الأداة X محظورة بواسطة سياسة أدوات العزل"

مفاتيح الإصلاح (اختر واحدًا):

- تعطيل العزل: `agents.defaults.sandbox.mode=off` (أو لكل وكيل `agents.list[].sandbox.mode=off`)
- السماح بالأداة داخل العزل:
  - أزلها من `tools.sandbox.tools.deny` (أو لكل وكيل `agents.list[].tools.sandbox.tools.deny`)
  - أو أضفها إلى `tools.sandbox.tools.allow` (أو قائمة السماح لكل وكيل)

### "ظننت أن هذه رئيسية، فلماذا هي معزولة؟"

في وضع `"non-main"`، مفاتيح المجموعة/القناة _ليست_ رئيسية. استخدم مفتاح الجلسة الرئيسية (الذي يعرضه `sandbox explain`) أو بدّل الوضع إلى `"off"`.

## ذو صلة

- [العزل](/ar/gateway/sandboxing) -- مرجع العزل الكامل (الأوضاع، النطاقات، الواجهات الخلفية، الصور)
- [العزل والأدوات متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools) -- التجاوزات لكل وكيل والأسبقية
- [الوضع المرتفع](/ar/tools/elevated)
