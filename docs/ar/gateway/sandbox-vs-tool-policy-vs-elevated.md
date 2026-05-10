---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'لماذا تُحظر أداة: بيئة تشغيل العزل، وسياسة السماح/المنع للأدوات، وبوابات التنفيذ بصلاحيات مرتفعة'
title: بيئة العزل مقابل سياسة الأدوات مقابل الصلاحيات المرتفعة
x-i18n:
    generated_at: "2026-05-10T19:41:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d670aa4f2e0f2265590e0de6198de841e744d210bbc54d291cb448d368e63b6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

لدى OpenClaw ثلاثة عناصر تحكم مترابطة (لكن مختلفة):

1. **وضع الحماية** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) يحدد **أين تعمل الأدوات** (خلفية وضع الحماية مقابل المضيف).
2. **سياسة الأدوات** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) تحدد **أي الأدوات متاحة/مسموح بها**.
3. **التصعيد** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) هو **مخرج خاص بـ `exec` فقط** للتشغيل خارج وضع الحماية عندما تكون داخل وضع الحماية (`gateway` افتراضيًا، أو `node` عندما يكون هدف `exec` مهيأً إلى `node`).

## التصحيح السريع

استخدم أداة الفحص لترى ما يفعله OpenClaw _فعليًا_:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

يطبع ما يلي:

- وضع/نطاق وضع الحماية الفعلي ووصول مساحة العمل
- ما إذا كانت الجلسة حاليًا داخل وضع الحماية (رئيسية مقابل غير رئيسية)
- السماح/الحظر الفعلي لأدوات وضع الحماية (وما إذا كان مصدره الوكيل/العمومي/الافتراضي)
- بوابات التصعيد ومسارات مفاتيح الإصلاح

## وضع الحماية: أين تعمل الأدوات

يتم التحكم في وضع الحماية عبر `agents.defaults.sandbox.mode`:

- `"off"`: كل شيء يعمل على المضيف.
- `"non-main"`: الجلسات غير الرئيسية فقط تكون داخل وضع الحماية (مفاجأة شائعة للمجموعات/القنوات).
- `"all"`: كل شيء داخل وضع الحماية.

راجع [وضع الحماية](/ar/gateway/sandboxing) للاطلاع على المصفوفة الكاملة (النطاق، ربط مساحات العمل، الصور).

### ربط التحميل (فحص أمني سريع)

- `docker.binds` _يخترق_ نظام ملفات وضع الحماية: كل ما تربطه يكون مرئيًا داخل الحاوية بالوضع الذي تحدده (`:ro` أو `:rw`).
- الافتراضي هو القراءة والكتابة إذا حذفت الوضع؛ فضّل `:ro` للمصدر/الأسرار.
- `scope: "shared"` يتجاهل روابط كل وكيل على حدة (تنطبق الروابط العمومية فقط).
- يتحقق OpenClaw من مصادر الربط مرتين: أولًا على مسار المصدر المعياري، ثم مرة أخرى بعد التحليل عبر أعمق أصل موجود. لا تتجاوز عمليات الهروب عبر أصل الرابط الرمزي فحوصات المسار المحظور أو الجذر المسموح.
- ما زالت مسارات الأوراق غير الموجودة تُفحص بأمان. إذا كان `/workspace/alias-out/new-file` يتحلل عبر أصل رابط رمزي إلى مسار محظور أو خارج الجذور المسموح بها المهيأة، فسيتم رفض الربط.
- ربط `/var/run/docker.sock` يمنح وضع الحماية فعليًا تحكمًا في المضيف؛ لا تفعل ذلك إلا عن قصد.
- وصول مساحة العمل (`workspaceAccess: "ro"`/`"rw"`) مستقل عن أوضاع الربط.

## سياسة الأدوات: أي الأدوات موجودة/قابلة للاستدعاء

هناك طبقتان مهمتان:

- **ملف تعريف الأدوات**: `tools.profile` و`agents.list[].tools.profile` (قائمة السماح الأساسية)
- **ملف تعريف أدوات المزوّد**: `tools.byProvider[provider].profile` و`agents.list[].tools.byProvider[provider].profile`
- **سياسة الأدوات العمومية/لكل وكيل**: `tools.allow`/`tools.deny` و`agents.list[].tools.allow`/`agents.list[].tools.deny`
- **سياسة أدوات المزوّد**: `tools.byProvider[provider].allow/deny` و`agents.list[].tools.byProvider[provider].allow/deny`
- **سياسة أدوات وضع الحماية** (تنطبق فقط عند التشغيل داخل وضع الحماية): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` و`agents.list[].tools.sandbox.tools.*`

قواعد عامة:

- `deny` ينتصر دائمًا.
- إذا كانت `allow` غير فارغة، فكل شيء آخر يُعامل على أنه محظور.
- سياسة الأدوات هي حاجز الإيقاف الصارم: لا يستطيع `/exec` تجاوز أداة `exec` محظورة.
- ترشح سياسة الأدوات إتاحة الأدوات حسب الاسم؛ ولا تفحص الآثار الجانبية داخل `exec`. إذا كان `exec` مسموحًا به، فإن حظر `write` أو `edit` أو `apply_patch` لا يجعل أوامر الصدفة للقراءة فقط.
- يغيّر `/exec` افتراضيات الجلسة فقط للمرسلين المصرح لهم؛ ولا يمنح وصولًا إلى الأدوات.
  تقبل مفاتيح أدوات المزوّد إما `provider` (مثل `google-antigravity`) أو `provider/model` (مثل `openai/gpt-5.4`).

### مجموعات الأدوات (اختصارات)

تدعم سياسات الأدوات (العمومية، والوكيل، ووضع الحماية) إدخالات `group:*` التي تتوسع إلى أدوات متعددة:

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
  للوكلاء المخصصين للقراءة فقط، احظر `group:runtime` وكذلك أدوات نظام الملفات المعدّلة، ما لم تفرض سياسة نظام ملفات وضع الحماية أو حد مضيف منفصل قيد القراءة فقط.
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: كل أدوات OpenClaw المدمجة (يستثني Plugins الخاصة بالمزوّدين)

## التصعيد: "التشغيل على المضيف" خاص بـ `exec` فقط

لا يمنح التصعيد أدوات إضافية؛ فهو يؤثر فقط في `exec`.

- إذا كنت داخل وضع الحماية، فإن `/elevated on` (أو `exec` مع `elevated: true`) يعمل خارج وضع الحماية (قد تظل الموافقات منطبقة).
- استخدم `/elevated full` لتجاوز موافقات `exec` للجلسة.
- إذا كنت تعمل مباشرة بالفعل، فالتصعيد عمليًا بلا أثر (لكنه يظل محكومًا بالبوابات).
- التصعيد **ليس** محدود النطاق بالمهارة ولا يتجاوز السماح/الحظر للأدوات.
- لا يمنح التصعيد تجاوزات عشوائية عبر المضيفين من `host=auto`؛ بل يتبع قواعد هدف `exec` العادية ولا يحافظ على `node` إلا عندما يكون الهدف المهيأ/هدف الجلسة هو `node` بالفعل.
- `/exec` منفصل عن التصعيد. فهو يضبط فقط افتراضيات `exec` لكل جلسة للمرسلين المصرح لهم.

البوابات:

- التفعيل: `tools.elevated.enabled` (واختياريًا `agents.list[].tools.elevated.enabled`)
- قوائم سماح المرسلين: `tools.elevated.allowFrom.<provider>` (واختياريًا `agents.list[].tools.elevated.allowFrom.<provider>`)

راجع [وضع التصعيد](/ar/tools/elevated).

## إصلاحات شائعة لـ "سجن وضع الحماية"

### "الأداة X محظورة بواسطة سياسة أدوات وضع الحماية"

مفاتيح الإصلاح (اختر واحدًا):

- عطّل وضع الحماية: `agents.defaults.sandbox.mode=off` (أو لكل وكيل `agents.list[].sandbox.mode=off`)
- اسمح بالأداة داخل وضع الحماية:
  - أزلها من `tools.sandbox.tools.deny` (أو لكل وكيل `agents.list[].tools.sandbox.tools.deny`)
  - أو أضفها إلى `tools.sandbox.tools.allow` (أو السماح لكل وكيل)

### "ظننت أن هذه رئيسية، فلماذا هي داخل وضع الحماية؟"

في وضع `"non-main"`، مفاتيح المجموعة/القناة _ليست_ رئيسية. استخدم مفتاح الجلسة الرئيسية (الذي يعرضه `sandbox explain`) أو بدّل الوضع إلى `"off"`.

## ذات صلة

- [وضع الحماية](/ar/gateway/sandboxing) -- مرجع وضع الحماية الكامل (الأوضاع، النطاقات، الخلفيات، الصور)
- [وضع الحماية والأدوات متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools) -- التجاوزات لكل وكيل والأسبقية
- [وضع التصعيد](/ar/tools/elevated)
