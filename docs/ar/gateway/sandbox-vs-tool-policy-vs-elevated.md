---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'سبب حظر أداة: بيئة تشغيل صندوق العزل، وسياسة السماح بالأدوات أو منعها، وبوابات التنفيذ بصلاحيات مرتفعة'
title: العزل مقابل سياسة الأدوات مقابل الصلاحيات المرتفعة
x-i18n:
    generated_at: "2026-07-12T05:58:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fce3dab337e89fc2b196f59e763a169d76206ce2695744e00252c158b161260
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

لدى OpenClaw ثلاثة عناصر تحكم مترابطة لكنها مختلفة:

1. **العزل** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) يحدد **مكان تشغيل الأدوات** (الواجهة الخلفية للعزل مقابل المضيف).
2. **سياسة الأدوات** (`tools.*`، و`tools.sandbox.tools.*`، و`agents.list[].tools.*`) تحدد **الأدوات المتاحة/المسموح بها**.
3. **الوضع المرتفع** (`tools.elevated.*`، و`agents.list[].tools.elevated.*`) هو **مخرج طوارئ خاص بـ `exec` فقط** للتشغيل خارج العزل عندما تكون في بيئة معزولة (`gateway` افتراضيًا، أو `node` عندما يكون هدف `exec` مضبوطًا على `node`).

## تصحيح سريع للأخطاء

استخدم أداة الفحص لمعرفة ما يفعله OpenClaw _فعليًا_:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

تعرض ما يلي:

- وضع العزل ونطاقه والوصول إلى مساحة العمل بعد تطبيق الإعدادات الفعلية
- ما إذا كانت الجلسة معزولة حاليًا (رئيسية أم غير رئيسية)
- السماح/الرفض الفعلي لأدوات العزل (وما إذا كان مصدره الوكيل أو الإعداد العام أو الافتراضي)
- بوابات الوضع المرتفع ومسارات مفاتيح الإصلاح

## العزل: مكان تشغيل الأدوات

يتحكم `agents.defaults.sandbox.mode` في العزل:

- `"off"`: يعمل كل شيء على المضيف.
- `"non-main"`: تُعزل الجلسات غير الرئيسية فقط (وهذا سبب «مفاجأة» شائع في المجموعات/القنوات).
- `"all"`: يُعزل كل شيء.

يتحكم `agents.defaults.sandbox.workspaceAccess` في ما يمكن لبيئة العزل رؤيته: `"none"` أو `"ro"` أو `"rw"`.

راجع [العزل](/ar/gateway/sandboxing) للاطلاع على المصفوفة الكاملة (النطاق، وعمليات وصل مساحة العمل، والصور).

### عمليات الوصل المقيّدة (فحص أمني سريع)

- يخترق `docker.binds` نظام ملفات العزل: كل ما توصله يصبح مرئيًا داخل الحاوية بالوضع الذي تحدده (`:ro` أو `:rw`).
- الوضع الافتراضي هو القراءة والكتابة إذا حذفت الوضع؛ يُفضّل استخدام `:ro` للمصدر/الأسرار.
- يتجاهل `scope: "shared"` عمليات الوصل الخاصة بكل وكيل (ولا تُطبّق سوى عمليات الوصل العامة).
- يتحقق OpenClaw من مصادر الوصل مرتين: أولًا على مسار المصدر الموحّد، ثم مجددًا بعد حله عبر أعمق سلف موجود. لا تتجاوز عمليات الهروب عبر الأصل ذي الرابط الرمزي فحوصات المسارات المحظورة أو الجذور المسموح بها.
- يستمر التحقق الآمن من المسارات الطرفية غير الموجودة. إذا كان `/workspace/alias-out/new-file` يُحل عبر أصل ذي رابط رمزي إلى مسار محظور أو إلى خارج الجذور المسموح بها المضبوطة، فستُرفض عملية الوصل.
- يؤدي وصل `/var/run/docker.sock` فعليًا إلى منح بيئة العزل التحكم في المضيف؛ لا تفعل ذلك إلا عن قصد.
- الوصول إلى مساحة العمل (`workspaceAccess`) مستقل عن أوضاع الوصل.

## سياسة الأدوات: الأدوات الموجودة/القابلة للاستدعاء

هناك طبقتان مهمتان:

- **ملف الأدوات التعريفي**: `tools.profile` و`agents.list[].tools.profile` (قائمة السماح الأساسية)
- **ملف أدوات المزوّد التعريفي**: `tools.byProvider[provider].profile` و`agents.list[].tools.byProvider[provider].profile`
- **سياسة الأدوات العامة/الخاصة بكل وكيل**: `tools.allow`/`tools.deny` و`agents.list[].tools.allow`/`agents.list[].tools.deny`
- **سياسة أدوات المزوّد**: `tools.byProvider[provider].allow/deny` و`agents.list[].tools.byProvider[provider].allow/deny`
- **سياسة أدوات العزل** (لا تُطبّق إلا في البيئة المعزولة): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` و`agents.list[].tools.sandbox.tools.*`

قواعد إرشادية:

- تكون الغلبة دائمًا لـ`deny`.
- إذا لم تكن `allow` فارغة، يُعامل كل ما عداها على أنه محظور.
- سياسة الأدوات هي حد المنع القاطع: لا يستطيع `/exec` تجاوز حظر أداة `exec`.
- ترشّح سياسة الأدوات مدى توفر الأدوات حسب الاسم؛ ولا تفحص الآثار الجانبية داخل `exec`. إذا كان `exec` مسموحًا، فإن حظر `write` أو `edit` أو `apply_patch` لا يجعل أوامر الصدفة للقراءة فقط.
- لا يغيّر `/exec` سوى الإعدادات الافتراضية للجلسة للمرسلين المصرح لهم؛ ولا يمنح الوصول إلى الأدوات.
- تقبل مفاتيح أدوات المزوّد إما `provider` (مثل `google-antigravity`) أو `provider/model` (مثل `openai/gpt-5.4`).
- تتضمن سجلات Gateway إدخالات تدقيق `agents/tool-policy` عندما تزيل إحدى خطوات سياسة الأدوات أدوات أو تمنع سياسة أدوات العزل استدعاءً. استخدم `openclaw logs` لرؤية تسمية القاعدة ومفتاح الإعداد وأسماء الأدوات المتأثرة.

### مجموعات الأدوات (اختصارات)

تدعم سياسات الأدوات (العامة، والخاصة بالوكيل، والخاصة بالعزل) إدخالات `group:*` التي تتوسع إلى عدة أدوات:

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

| المجموعة           | الأدوات                                                                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`، و`process`، و`code_execution` (يُقبل `bash` كاسم مستعار لـ`exec`)                                                                            |
| `group:fs`         | `read`، و`write`، و`edit`، و`apply_patch`                                                                                                                     |
| `group:sessions`   | `sessions_list`، و`sessions_history`، و`sessions_send`، و`sessions_spawn`، و`sessions_yield`، و`subagents`، و`session_status`                                    |
| `group:memory`     | `memory_search`، و`memory_get`                                                                                                                              |
| `group:web`        | `web_search`، و`x_search`، و`web_fetch`                                                                                                                      |
| `group:ui`         | `browser`، و`canvas`                                                                                                                                        |
| `group:automation` | `heartbeat_respond`، و`cron`، و`gateway`                                                                                                                     |
| `group:messaging`  | `message`                                                                                                                                                  |
| `group:nodes`      | `nodes`، و`computer`                                                                                                                                        |
| `group:agents`     | `agents_list`، و`get_goal`، و`create_goal`، و`update_goal`، و`update_plan`، و`skill_workshop`                                                                   |
| `group:media`      | `image`، و`image_generate`، و`music_generate`، و`video_generate`، و`tts`                                                                                       |
| `group:openclaw`   | معظم أدوات OpenClaw المدمجة (باستثناء أساسيات نظام الملفات ووقت التشغيل `read`/`write`/`edit`/`apply_patch`/`exec`/`process`، و`canvas`، وإضافات المزوّد) |
| `group:plugins`    | جميع الأدوات المملوكة للإضافات المحمّلة، بما فيها خوادم MCP المضبوطة والمكشوفة عبر `bundle-mcp`                                                               |

بالنسبة إلى الوكلاء المخصصين للقراءة فقط، احظر `group:runtime` إلى جانب أدوات نظام الملفات التي تُجري تعديلات، ما لم تفرض سياسة نظام ملفات العزل أو حدود منفصلة للمضيف قيد القراءة فقط.

بالنسبة إلى خوادم MCP المعزولة، تمثّل سياسة أدوات العزل بوابة سماح ثانية. إذا كان `mcp.servers` مضبوطًا لكن الأدوار المعزولة لا تعرض إلا الأدوات المدمجة، فأضف `bundle-mcp` أو `group:plugins` أو اسم/نمط أداة MCP مسبوقًا باسم الخادم، مثل `outlook__send_mail` أو `outlook__*`، إلى `tools.sandbox.tools.alsoAllow`، ثم أعد تشغيل/تحميل Gateway والتقط قائمة الأدوات مجددًا. تستخدم أنماط الخوادم بادئة خادم MCP الآمنة للمزوّد: تتحول المحارف غير المطابقة لـ`[A-Za-z0-9_-]` إلى `-`، وتحصل الأسماء التي لا تبدأ بحرف على البادئة `mcp-`، وقد تُقتطع البادئات الطويلة أو المكررة أو تُضاف إليها لاحقة.

يتحقق `openclaw doctor` حاليًا من هذا الشكل للخوادم التي يديرها OpenClaw في `mcp.servers`. تستخدم خوادم MCP المحمّلة من بيانات إضافات مدمجة أو من ملف Claude `.mcp.json` بوابة العزل نفسها، لكن هذا التشخيص لا يسرد تلك المصادر بعد؛ استخدم إدخالات قائمة السماح نفسها إذا اختفت أدواتها في الأدوار المعزولة.

## الوضع المرتفع: «التشغيل على المضيف» الخاص بـ`exec` فقط

لا يمنح الوضع المرتفع أدوات إضافية؛ بل يؤثر في `exec` فقط.

- إذا كنت في بيئة معزولة، فإن `/elevated on` (أو `exec` مع `elevated: true`) يشغّل خارج العزل (وقد تظل الموافقات مطلوبة).
- استخدم `/elevated full` لتجاوز موافقات `exec` للجلسة.
- إذا كنت تشغّل مباشرة بالفعل، فلن يكون للوضع المرتفع أثر فعلي (مع بقائه خاضعًا للبوابات).
- الوضع المرتفع **ليس** محدد النطاق بحسب Skills، ولا يتجاوز السماح/الرفض الخاص بالأدوات.
- لا يمنح الوضع المرتفع عمليات تجاوز عشوائية بين المضيفين من `host=auto`؛ بل يتبع قواعد هدف `exec` المعتادة، ولا يحتفظ بـ`node` إلا عندما يكون الهدف المضبوط/هدف الجلسة هو `node` بالفعل.
- `/exec` منفصل عن الوضع المرتفع. ولا يعدّل سوى إعدادات `exec` الافتراضية لكل جلسة للمرسلين المصرح لهم.

البوابات:

- التمكين: `tools.elevated.enabled` (واختياريًا `agents.list[].tools.elevated.enabled`)
- قوائم سماح المرسلين: `tools.elevated.allowFrom.<provider>` (واختياريًا `agents.list[].tools.elevated.allowFrom.<provider>`)

راجع [الوضع المرتفع](/ar/tools/elevated).

## إصلاحات شائعة لـ«سجن العزل»

### «الأداة X محظورة بواسطة سياسة أدوات العزل»

مفاتيح الإصلاح (اختر واحدًا):

- عطّل العزل: `agents.defaults.sandbox.mode=off` (أو لكل وكيل `agents.list[].sandbox.mode=off`)
- اسمح بالأداة داخل العزل:
  - أزلها من `tools.sandbox.tools.deny` (أو من `agents.list[].tools.sandbox.tools.deny` الخاص بالوكيل)
  - أو أضفها إلى `tools.sandbox.tools.allow` (أو قائمة السماح الخاصة بالوكيل)
- افحص `openclaw logs` بحثًا عن إدخال `agents/tool-policy`. فهو يسجل وضع العزل وما إذا كانت قاعدة السماح أو الرفض قد حظرت الأداة.

### «ظننت أن هذه هي الجلسة الرئيسية، فلماذا هي معزولة؟»

في وضع `"non-main"`، لا تُعد مفاتيح المجموعة/القناة رئيسية. استخدم مفتاح الجلسة الرئيسية (الذي يعرضه `sandbox explain`) أو غيّر الوضع إلى `"off"`.

## ذو صلة

- [العزل](/ar/gateway/sandboxing) -- مرجع العزل الكامل (الأوضاع، والنطاقات، والواجهات الخلفية، والصور)
- [عزل الوكلاء المتعددين وأدواتهم](/ar/tools/multi-agent-sandbox-tools) -- عمليات التجاوز الخاصة بكل وكيل وترتيب الأولوية
- [الوضع المرتفع](/ar/tools/elevated)
