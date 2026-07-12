---
read_when:
    - تشغيل أكثر من Gateway واحد على الجهاز نفسه
    - تحتاج إلى إعدادات/حالة/منافذ معزولة لكل Gateway
summary: تشغيل عدة مثيلات من Gateway لـ OpenClaw على مضيف واحد (العزل والمنافذ والملفات الشخصية)
title: بوابات Gateway متعددة
x-i18n:
    generated_at: "2026-07-12T05:58:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d5088d9bcfae6800217079365dcaec828a18ca19ac80c7ad7b4245d9059a986
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

تحتاج معظم عمليات الإعداد إلى Gateway واحدة؛ إذ تتولى Gateway واحدة معالجة عدة اتصالات مراسلة ووكلاء. شغّل Gateways منفصلة بملفات تعريف/منافذ معزولة فقط عندما تحتاج إلى عزل أقوى أو تكرار احتياطي (مثل روبوت إنقاذ).

## البدء السريع لروبوت الإنقاذ

أبسط إعداد لروبوت الإنقاذ:

- أبقِ الروبوت الرئيسي على ملف التعريف الافتراضي.
- شغّل روبوت الإنقاذ باستخدام `--profile rescue`، مع رمز بوت Telegram خاص به.
- ضع روبوت الإنقاذ على منفذ أساسي مختلف، مثل `19789`.

يُبقي هذا روبوت الإنقاذ قادرًا على تصحيح الأخطاء أو تطبيق تغييرات الإعدادات إذا كان الروبوت الأساسي متوقفًا. اترك 20 منفذًا على الأقل بين المنافذ الأساسية حتى لا تتعارض منافذ المتصفح/CDP المشتقة مطلقًا.

```bash
# روبوت الإنقاذ (بوت Telegram منفصل، ملف تعريف منفصل، المنفذ 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

إذا كان روبوتك الرئيسي قيد التشغيل بالفعل، فهذا عادةً كل ما تحتاج إليه. إذا كانت عملية الإعداد الأولي قد ثبّتت خدمة الإنقاذ بالفعل، فتخطَّ أمر `gateway install` الأخير.

أثناء تشغيل `openclaw --profile rescue onboard`:

- استخدم رمز بوت Telegram منفصلًا ومخصصًا لحساب الإنقاذ (يسهل إبقاؤه مقتصرًا على المشغّل، ومستقلًا عن تثبيت قناة/تطبيق الروبوت الرئيسي، كما يوفر مسار استرداد بسيطًا قائمًا على الرسائل الخاصة).
- احتفظ باسم ملف التعريف `rescue`.
- استخدم منفذًا أساسيًا أعلى من منفذ الروبوت الرئيسي بما لا يقل عن 20.
- اقبل مساحة عمل الإنقاذ الافتراضية ما لم تكن تدير واحدة بنفسك بالفعل.

### ما الذي يغيّره `--profile rescue onboard`

يشغّل `--profile rescue onboard` مسار الإعداد الأولي المعتاد، لكنه يكتب كل شيء في ملف تعريف منفصل، وبذلك يحصل روبوت الإنقاذ على ما يخصه من:

- ملف التعريف/الإعدادات
- دليل الحالة
- مساحة العمل (الافتراضي: `~/.openclaw/workspace-rescue`)
- اسم الخدمة المُدارة
- المنفذ الأساسي (بالإضافة إلى المنافذ المشتقة)
- رمز بوت Telegram

فيما عدا ذلك، تكون المطالبات مطابقة لمطالبات الإعداد الأولي المعتاد.

## الإعداد العام لعدة Gateways

يعمل نمط العزل نفسه مع أي زوج أو مجموعة من Gateways على مضيف واحد؛ امنح كل Gateway إضافية ملف تعريف مسمى ومنفذًا أساسيًا خاصين بها:

```bash
# الرئيسية (ملف التعريف الافتراضي)
openclaw setup
openclaw gateway --port 18789

# Gateway إضافية
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

يعمل استخدام ملفات تعريف مسماة على الجانبين أيضًا:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

تتبع الخدمات النمط نفسه:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

استخدم البدء السريع لروبوت الإنقاذ لإنشاء مسار احتياطي للمشغّل؛ واستخدم نمط ملفات التعريف العام لتشغيل عدة Gateways طويلة العمر عبر قنوات أو مستأجرين أو مساحات عمل أو أدوار تشغيلية مختلفة.

## قائمة تحقق العزل

اجعل هذه الإعدادات فريدة لكل مثيل Gateway:

| الإعداد                       | الغرض                                      |
| ----------------------------- | ------------------------------------------ |
| `OPENCLAW_CONFIG_PATH`        | ملف إعدادات خاص بكل مثيل                   |
| `OPENCLAW_STATE_DIR`          | جلسات وبيانات اعتماد وذاكرات مؤقتة لكل مثيل |
| `agents.defaults.workspace`   | جذر مساحة عمل خاص بكل مثيل                 |
| `gateway.port` (أو `--port`)  | فريد لكل مثيل                              |
| منافذ المتصفح/CDP المشتقة     | انظر أدناه                                 |

تؤدي مشاركة أي من هذه الإعدادات إلى حالات تسابق في الإعدادات وتعارضات في المنافذ.

## تعيين المنافذ (المشتقة)

المنفذ الأساسي = `gateway.port` (أو `OPENCLAW_GATEWAY_PORT` / `--port`).

- منفذ خدمة التحكم في المتصفح = المنفذ الأساسي + 2 (local loopback فقط).
- يُقدَّم مضيف Canvas على خادم HTTP الخاص بـ Gateway نفسه (المنفذ نفسه المستخدم في `gateway.port`).
- تُخصَّص منافذ CDP لملفات تعريف المتصفح تلقائيًا بدءًا من `browser control port + 9` وحتى `+ 108`.

إذا تجاوزت أيًا من هذه القيم في الإعدادات أو متغيرات البيئة، فيجب إبقاؤها فريدة لكل مثيل.

## ملاحظات المتصفح/CDP (مأزق شائع)

- **لا** تثبّت `browser.cdpUrl` على القيمة نفسها في عدة مثيلات.
- يحتاج كل مثيل إلى منفذ تحكم في المتصفح ونطاق CDP خاصين به (مشتقين من منفذ Gateway الخاص به).
- لتحديد منافذ CDP صراحةً، اضبط `browser.profiles.<name>.cdpPort` لكل مثيل.
- لاستخدام Chrome بعيد، استخدم `browser.profiles.<name>.cdpUrl` (لكل ملف تعريف ولكل مثيل).

## مثال يدوي باستخدام متغيرات البيئة

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## عمليات تحقق سريعة

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

- يكتشف `gateway status --deep` خدمات launchd/systemd/schtasks القديمة المتبقية من عمليات تثبيت سابقة.
- لا يكون نص تحذير `gateway probe`، مثل `multiple reachable gateway identities detected`، متوقعًا إلا عندما تشغّل عمدًا أكثر من Gateway معزولة، أو عندما يتعذر على OpenClaw إثبات أن أهداف الفحص التي يمكن الوصول إليها هي Gateway نفسها. يُعد نفق SSH أو عنوان URL لوكيل أو عنوان URL بعيد مُعدّ للوصول إلى Gateway نفسها Gateway واحدة ذات وسائل نقل متعددة، حتى عندما تختلف منافذ النقل.

## مواضيع ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [قفل Gateway](/ar/gateway/gateway-lock)
- [الإعدادات](/ar/gateway/configuration)
