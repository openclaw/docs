---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'سبب حظر أداة: بيئة التشغيل المعزولة، وسياسة السماح/الرفض للأدوات، وبوابات التنفيذ بصلاحيات مرتفعة'
title: بيئة العزل مقابل سياسة الأدوات مقابل الصلاحيات المرتفعة
x-i18n:
    generated_at: "2026-06-27T17:42:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4156cc494a6aff4fb9c44cbca8fdfde10a3343dde624c485833dd7508e4c4d6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

لدى OpenClaw ثلاثة عناصر تحكم مرتبطة (لكنها مختلفة):

1. **صندوق العزل** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) يحدد **أين تعمل الأدوات** (خلفية صندوق العزل أم المضيف).
2. **سياسة الأدوات** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) تحدد **أي الأدوات متاحة/مسموح بها**.
3. **الوضع المرتفع** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) هو **مخرج خاص بـ `exec` فقط** للتشغيل خارج صندوق العزل عندما تكون معزولًا (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec مضبوطًا على `node`).

## تصحيح سريع

استخدم أداة الفحص لترى ما يفعله OpenClaw _فعليًا_:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

يطبع:

- وضع/نطاق صندوق العزل الفعلي ووصول مساحة العمل
- ما إذا كانت الجلسة معزولة حاليًا (الرئيسية مقابل غير الرئيسية)
- السماح/الحظر الفعلي لأدوات صندوق العزل (وما إذا كان آتيًا من الوكيل/العام/الافتراضي)
- بوابات الوضع المرتفع ومسارات مفاتيح الإصلاح

## صندوق العزل: أين تعمل الأدوات

يتحكم `agents.defaults.sandbox.mode` بصندوق العزل:

- `"off"`: كل شيء يعمل على المضيف.
- `"non-main"`: الجلسات غير الرئيسية فقط تكون معزولة (مصدر "مفاجأة" شائع للمجموعات/القنوات).
- `"all"`: كل شيء معزول.

راجع [العزل](/ar/gateway/sandboxing) للمصفوفة الكاملة (النطاق، تحميلات مساحة العمل، الصور).

### تحميلات الربط (فحص أمني سريع)

- `docker.binds` _يخترق_ نظام ملفات صندوق العزل: أي شيء تحمّله يصبح مرئيًا داخل الحاوية بالوضع الذي تضبطه (`:ro` أو `:rw`).
- الافتراضي هو القراءة والكتابة إذا أغفلت الوضع؛ فضّل `:ro` للمصدر/الأسرار.
- `scope: "shared"` يتجاهل تحميلات كل وكيل على حدة (تنطبق التحميلات العامة فقط).
- يتحقق OpenClaw من مصادر الربط مرتين: أولًا على مسار المصدر المطبّع، ثم مرة أخرى بعد الحل عبر أعمق سلف موجود. لا تتجاوز عمليات الهروب عبر أصل رابط رمزي فحوصات المسارات المحظورة أو الجذور المسموح بها.
- ما زال يتم فحص مسارات الأوراق غير الموجودة بأمان. إذا كان `/workspace/alias-out/new-file` يُحل عبر أصل رابط رمزي إلى مسار محظور أو خارج الجذور المسموح بها المهيأة، فسيُرفض الربط.
- ربط `/var/run/docker.sock` يمنح صندوق العزل فعليًا التحكم بالمضيف؛ لا تفعل ذلك إلا بقصد واضح.
- وصول مساحة العمل (`workspaceAccess: "ro"`/`"rw"`) مستقل عن أوضاع الربط.

## سياسة الأدوات: أي الأدوات موجودة/قابلة للاستدعاء

هناك طبقتان مهمتان:

- **ملف تعريف الأدوات**: `tools.profile` و `agents.list[].tools.profile` (قائمة السماح الأساسية)
- **ملف تعريف أدوات المزوّد**: `tools.byProvider[provider].profile` و `agents.list[].tools.byProvider[provider].profile`
- **سياسة الأدوات العامة/لكل وكيل**: `tools.allow`/`tools.deny` و `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **سياسة أدوات المزوّد**: `tools.byProvider[provider].allow/deny` و `agents.list[].tools.byProvider[provider].allow/deny`
- **سياسة أدوات صندوق العزل** (تنطبق فقط عند العزل): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` و `agents.list[].tools.sandbox.tools.*`

قواعد عامة:

- `deny` يفوز دائمًا.
- إذا كان `allow` غير فارغ، فكل ما عداه يُعامل على أنه محظور.
- سياسة الأدوات هي الحاجز النهائي: لا يستطيع `/exec` تجاوز أداة `exec` محظورة.
- ترشح سياسة الأدوات إتاحة الأدوات حسب الاسم؛ ولا تفحص الآثار الجانبية داخل `exec`. إذا كان `exec` مسموحًا، فإن حظر `write` أو `edit` أو `apply_patch` لا يجعل أوامر الصدفة للقراءة فقط.
- يغيّر `/exec` افتراضات الجلسة فقط للمرسلين المصرح لهم؛ ولا يمنح وصولًا إلى الأدوات.
  تقبل مفاتيح أدوات المزوّد إما `provider` (مثل `google-antigravity`) أو `provider/model` (مثل `openai/gpt-5.4`).
- تتضمن سجلات Gateway إدخالات تدقيق `agents/tool-policy` عندما تزيل خطوة من سياسة الأدوات أدوات أو عندما تحظر سياسة أدوات صندوق العزل استدعاءً. استخدم `openclaw logs` لرؤية تسمية القاعدة ومفتاح التهيئة وأسماء الأدوات المتأثرة.

### مجموعات الأدوات (اختصارات)

تدعم سياسات الأدوات (العامة، الوكيل، صندوق العزل) إدخالات `group:*` التي تتوسع إلى عدة أدوات:

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
  للوكلاء المخصصين للقراءة فقط، احظر `group:runtime` وكذلك أدوات نظام الملفات المعدّلة ما لم تفرض سياسة نظام ملفات صندوق العزل أو حد مضيف منفصل قيد القراءة فقط.
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: كل أدوات OpenClaw المدمجة (باستثناء Plugins الخاصة بالمزوّدين)
- `group:plugins`: كل الأدوات المحملة والمملوكة لـ Plugin، بما في ذلك خوادم MCP المهيأة المعروضة عبر `bundle-mcp`

بالنسبة إلى خوادم MCP المعزولة، تكون سياسة أدوات صندوق العزل بوابة سماح ثانية. إذا كان `mcp.servers` مهيأً لكن الأدوار المعزولة لا تعرض إلا الأدوات المدمجة، فأضف `bundle-mcp` أو `group:plugins` أو اسم/نمط أداة MCP مسبوقًا باسم الخادم مثل `outlook__send_mail` أو `outlook__*` إلى `tools.sandbox.tools.alsoAllow`، ثم أعد تشغيل/إعادة تحميل Gateway وأعد التقاط قائمة الأدوات. تستخدم أنماط الخوادم بادئة خادم MCP الآمنة للمزوّد: تتحول الأحرف غير `[A-Za-z0-9_-]` إلى `-`، والأسماء التي لا تبدأ بحرف تحصل على بادئة `mcp-`، وقد تُختصر البادئات الطويلة أو المكررة أو تُلحق بلاحقة.

يفحص `openclaw doctor` حاليًا هذا الشكل للخوادم التي يديرها OpenClaw في `mcp.servers`. تستخدم خوادم MCP المحملة من بيانات Plugins المدمجة أو Claude `.mcp.json` بوابة صندوق العزل نفسها، لكن هذا التشخيص لا يحصي تلك المصادر بعد؛ استخدم إدخالات قائمة السماح نفسها إذا اختفت أدواتها في الأدوار المعزولة.

## الوضع المرتفع: "التشغيل على المضيف" الخاص بـ exec فقط

لا يمنح الوضع المرتفع أدوات إضافية؛ إنه يؤثر فقط على `exec`.

- إذا كنت معزولًا، فإن `/elevated on` (أو `exec` مع `elevated: true`) يعمل خارج صندوق العزل (قد تظل الموافقات مطلوبة).
- استخدم `/elevated full` لتجاوز موافقات exec للجلسة.
- إذا كنت تعمل مباشرة بالفعل، فالوضع المرتفع لا يفعل شيئًا فعليًا (مع بقاء البوابات مطبقة).
- الوضع المرتفع **ليس** محدودًا بنطاق Skills ولا يتجاوز السماح/الحظر للأدوات.
- لا يمنح الوضع المرتفع تجاوزات عشوائية بين المضيفين من `host=auto`؛ بل يتبع قواعد هدف exec العادية، ولا يحافظ على `node` إلا عندما يكون الهدف المهيأ/هدف الجلسة هو `node` بالفعل.
- `/exec` منفصل عن الوضع المرتفع. فهو يضبط فقط افتراضات exec لكل جلسة للمرسلين المصرح لهم.

البوابات:

- التفعيل: `tools.elevated.enabled` (واختياريًا `agents.list[].tools.elevated.enabled`)
- قوائم السماح للمرسلين: `tools.elevated.allowFrom.<provider>` (واختياريًا `agents.list[].tools.elevated.allowFrom.<provider>`)

راجع [الوضع المرتفع](/ar/tools/elevated).

## إصلاحات شائعة لـ "سجن صندوق العزل"

### "الأداة X محظورة بواسطة سياسة أدوات صندوق العزل"

مفاتيح الإصلاح (اختر واحدًا):

- تعطيل صندوق العزل: `agents.defaults.sandbox.mode=off` (أو لكل وكيل `agents.list[].sandbox.mode=off`)
- السماح بالأداة داخل صندوق العزل:
  - أزلها من `tools.sandbox.tools.deny` (أو لكل وكيل `agents.list[].tools.sandbox.tools.deny`)
  - أو أضفها إلى `tools.sandbox.tools.allow` (أو سماح لكل وكيل)
- افحص `openclaw logs` بحثًا عن إدخال `agents/tool-policy`. فهو يسجل وضع صندوق العزل وما إذا كانت قاعدة السماح أو الحظر هي التي حظرت الأداة.

### "ظننت أن هذه جلسة رئيسية، فلماذا هي معزولة؟"

في وضع `"non-main"`، لا تكون مفاتيح المجموعة/القناة رئيسية. استخدم مفتاح الجلسة الرئيسية (المعروض بواسطة `sandbox explain`) أو غيّر الوضع إلى `"off"`.

## ذات صلة

- [العزل](/ar/gateway/sandboxing) -- مرجع صندوق العزل الكامل (الأوضاع، النطاقات، الخلفيات، الصور)
- [صندوق عزل وأدوات الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) -- تجاوزات كل وكيل على حدة والأسبقية
- [الوضع المرتفع](/ar/tools/elevated)
