---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'لماذا تُحظر أداة ما: بيئة تشغيل sandbox، وسياسة السماح/المنع للأدوات، وبوابات exec المرتفعة الصلاحيات'
title: Sandbox مقابل سياسة الأدوات مقابل Elevated
x-i18n:
    generated_at: "2026-04-24T07:43:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 74bb73023a3f7a85a0c020b2e8df69610ab8f8e60f8ab6142f8da7810dc08429
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

يحتوي OpenClaw على ثلاثة عناصر تحكم مترابطة (لكنها مختلفة):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) يحدد **مكان تشغيل الأدوات** (واجهة sandbox الخلفية مقابل المضيف).
2. **سياسة الأدوات** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) تحدد **أي الأدوات متاحة/مسموح بها**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) هو **منفذ خاص بـ exec فقط** للتشغيل خارج sandbox عندما تكون داخل sandbox (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec مضبوطًا على `node`).

## تصحيح سريع

استخدم أداة الفحص لمعرفة ما الذي يفعله OpenClaw _فعليًا_:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

سيطبع هذا:

- وضع/نطاق/وصول مساحة العمل الفعّال في sandbox
- ما إذا كانت الجلسة حاليًا داخل sandbox (رئيسية أم غير رئيسية)
- سياسة السماح/المنع الفعالة لأدوات sandbox (وما إذا كانت قد جاءت من الوكيل/العام/الافتراضي)
- بوابات Elevated ومسارات المفاتيح الخاصة بالإصلاح

## Sandbox: مكان تشغيل الأدوات

يتم التحكم في sandboxing عبر `agents.defaults.sandbox.mode`:

- `"off"`: كل شيء يعمل على المضيف.
- `"non-main"`: يتم وضع الجلسات غير الرئيسية فقط داخل sandbox (وهو “المفاجأة” الشائعة في المجموعات/القنوات).
- `"all"`: كل شيء داخل sandbox.

راجع [Sandboxing](/ar/gateway/sandboxing) للمصفوفة الكاملة (النطاق، وعمليات ربط مساحة العمل، والصور).

### عمليات bind mount (فحص أمني سريع)

- يخترق `docker.binds` نظام ملفات sandbox: كل ما تقوم بتركيبه يصبح مرئيًا داخل الحاوية بالنمط الذي تحدده (`:ro` أو `:rw`).
- يكون الوضع الافتراضي read-write إذا حذفت النمط؛ ويفضل استخدام `:ro` للمصدر/الأسرار.
- يتجاهل `scope: "shared"` عمليات الربط الخاصة بكل وكيل (ولا تُطبق إلا عمليات الربط العامة).
- يتحقق OpenClaw من مصادر bind مرتين: أولًا على مسار المصدر بعد التسوية، ثم مرة أخرى بعد التحليل عبر أعمق أصل موجود. لا تتجاوز عمليات الهروب عبر symlink-parent فحوصات المسار المحظور أو الجذر المسموح.
- يتم فحص المسارات الطرفية غير الموجودة أيضًا بأمان. فإذا تم تحليل `/workspace/alias-out/new-file` عبر أصل مرتبط برمز إلى مسار محظور أو خارج الجذور المسموح بها المضبوطة، فسيتم رفض bind.
- يؤدي ربط `/var/run/docker.sock` فعليًا إلى منح sandbox تحكمًا بالمضيف؛ فلا تفعل ذلك إلا عن قصد.
- يكون وصول مساحة العمل (`workspaceAccess: "ro"`/`"rw"`) مستقلًا عن أوضاع bind.

## سياسة الأدوات: أي الأدوات موجودة/يمكن استدعاؤها

هناك طبقتان مهمتان:

- **ملف تعريف الأدوات**: `tools.profile` و`agents.list[].tools.profile` (قائمة السماح الأساسية)
- **ملف تعريف أدوات المزوّد**: `tools.byProvider[provider].profile` و`agents.list[].tools.byProvider[provider].profile`
- **سياسة الأدوات العامة/لكل وكيل**: `tools.allow`/`tools.deny` و`agents.list[].tools.allow`/`agents.list[].tools.deny`
- **سياسة أدوات المزوّد**: `tools.byProvider[provider].allow/deny` و`agents.list[].tools.byProvider[provider].allow/deny`
- **سياسة أدوات Sandbox** (تنطبق فقط عند وجود sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` و`agents.list[].tools.sandbox.tools.*`

قواعد عامة:

- `deny` يفوز دائمًا.
- إذا كانت `allow` غير فارغة، فسيُعتبر كل شيء آخر محظورًا.
- سياسة الأدوات هي التوقف الصارم: لا يمكن لـ `/exec` تجاوز أداة `exec` الممنوعة.
- يغيّر `/exec` فقط القيم الافتراضية الخاصة بالجلسة للمرسلين المخولين؛ ولا يمنح وصولًا إلى الأدوات.
  تقبل مفاتيح أدوات المزوّد إما `provider` (مثل `google-antigravity`) أو `provider/model` (مثل `openai/gpt-5.4`).

### مجموعات الأدوات (اختصارات)

تدعم سياسات الأدوات (العامة، والوكيل، وsandbox) إدخالات `group:*` التي تتوسع إلى عدة أدوات:

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

- `group:runtime`: `exec`, `process`, `code_execution` (يُقبل `bash` كاسم بديل لـ `exec`)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `video_generate`, `tts`
- `group:openclaw`: جميع أدوات OpenClaw المضمّنة (ويستثني plugins الخاصة بالمزوّد)

## Elevated: "التشغيل على المضيف" الخاص بـ exec فقط

لا يمنح Elevated أدوات إضافية؛ بل يؤثر فقط في `exec`.

- إذا كنت داخل sandbox، فإن `/elevated on` (أو `exec` مع `elevated: true`) يشغّل خارج sandbox (ومع ذلك قد تستمر الموافقات في التطبيق).
- استخدم `/elevated full` لتخطي موافقات exec للجلسة.
- إذا كنت تعمل بالفعل مباشرة، فإن Elevated يصبح فعليًا بلا أثر (مع بقائه خاضعًا للبوابات).
- لا يكون Elevated ضمن نطاق Skills و**لا** يتجاوز allow/deny الخاصة بالأدوات.
- لا يمنح Elevated تجاوزات عشوائية عبر المضيف من `host=auto`؛ بل يتبع قواعد هدف exec العادية ويحافظ فقط على `node` عندما يكون الهدف المضبوط/الخاص بالجلسة هو `node` بالفعل.
- `/exec` منفصل عن Elevated. فهو لا يضبط إلا القيم الافتراضية لـ exec لكل جلسة للمرسلين المخولين.

البوابات:

- التفعيل: `tools.elevated.enabled` (واختياريًا `agents.list[].tools.elevated.enabled`)
- قوائم سماح المرسلين: `tools.elevated.allowFrom.<provider>` (واختياريًا `agents.list[].tools.elevated.allowFrom.<provider>`)

راجع [Elevated Mode](/ar/tools/elevated).

## إصلاحات شائعة لـ "سجن sandbox"

### "الأداة X محظورة بواسطة سياسة أدوات sandbox"

مفاتيح الإصلاح (اختر واحدًا):

- تعطيل sandbox: `agents.defaults.sandbox.mode=off` (أو لكل وكيل `agents.list[].sandbox.mode=off`)
- السماح بالأداة داخل sandbox:
  - أزلها من `tools.sandbox.tools.deny` (أو من `agents.list[].tools.sandbox.tools.deny` لكل وكيل)
  - أو أضفها إلى `tools.sandbox.tools.allow` (أو إلى allow الخاصة بالوكيل)

### "كنت أظن أن هذه رئيسية، فلماذا هي داخل sandbox؟"

في وضع `"non-main"`، لا تُعد مفاتيح المجموعة/القناة رئيسية. استخدم مفتاح الجلسة الرئيسية (الموضح بواسطة `sandbox explain`) أو بدّل الوضع إلى `"off"`.

## ذو صلة

- [Sandboxing](/ar/gateway/sandboxing) -- المرجع الكامل لـ sandbox (الأوضاع، والنطاقات، والواجهات الخلفية، والصور)
- [Multi-Agent Sandbox & Tools](/ar/tools/multi-agent-sandbox-tools) -- التجاوزات الخاصة بكل وكيل وترتيب الأولوية
- [Elevated Mode](/ar/tools/elevated)
