---
read_when:
    - تشغيل أكثر من Gateway واحد على الجهاز نفسه
    - تحتاج إلى إعدادات وحالة ومنافذ معزولة لكل Gateway
summary: تشغيل عدة بوابات Gateway لـ OpenClaw على مضيف واحد (العزل والمنافذ والملفات الشخصية)
title: بوابات Gateway متعددة
x-i18n:
    generated_at: "2026-07-16T14:07:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 655fa865a98064d7c017a7c2eb08ea9a9683002d96a3dbe45a8c16cbd3c86ba1
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

تحتاج معظم عمليات الإعداد إلى Gateway واحد، إذ يتولى Gateway واحد عدة اتصالات مراسلة ووكلاء. شغّل Gateways منفصلة بملفات تعريف/منافذ معزولة فقط عندما تحتاج إلى عزل أقوى أو تكرار احتياطي (مثل روبوت إنقاذ).

## البدء السريع لروبوت الإنقاذ

أبسط إعداد لروبوت الإنقاذ:

- أبقِ الروبوت الرئيسي على ملف التعريف الافتراضي.
- شغّل روبوت الإنقاذ على `--profile rescue`، باستخدام رمز Telegram خاص به.
- ضع روبوت الإنقاذ على منفذ أساسي مختلف، مثل `19789`.

يتيح ذلك لروبوت الإنقاذ تصحيح الأخطاء أو تطبيق تغييرات الإعدادات إذا كان الروبوت الأساسي متوقفًا. اترك 20 منفذًا على الأقل بين المنافذ الأساسية كي لا تتعارض منافذ المتصفح/CDP المشتقة مطلقًا.

```bash
# روبوت الإنقاذ (روبوت Telegram منفصل، وملف تعريف منفصل، والمنفذ 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

إذا كان روبوتك الرئيسي قيد التشغيل بالفعل، فهذا عادةً كل ما تحتاج إليه. إذا كانت عملية الإعداد الأولي قد ثبّتت خدمة الإنقاذ بالفعل، فتخطَّ الأمر الأخير `gateway install`.

أثناء `openclaw --profile rescue onboard`:

- استخدم رمز روبوت Telegram منفصلًا ومخصصًا لحساب الإنقاذ (يسهل إبقاؤه مقتصرًا على المشغّل، ومستقلًا عن تثبيت قناة/تطبيق الروبوت الرئيسي، ويوفر مسار استرداد بسيطًا قائمًا على الرسائل المباشرة).
- احتفظ باسم ملف التعريف `rescue`.
- استخدم منفذًا أساسيًا أعلى من منفذ الروبوت الرئيسي بمقدار 20 على الأقل.
- اقبل مساحة عمل الإنقاذ الافتراضية ما لم تكن تدير واحدة بنفسك بالفعل.

### ما الذي يغيّره `--profile rescue onboard`

يشغّل `--profile rescue onboard` تدفق الإعداد الأولي المعتاد، لكنه يكتب كل شيء في ملف تعريف منفصل، وبذلك يحصل روبوت الإنقاذ على ما يخصه من:

- ملف التعريف/الإعدادات
- دليل الحالة
- مساحة العمل (الافتراضية: `~/.openclaw/workspace-rescue`)
- اسم الخدمة المُدارة
- المنفذ الأساسي (بالإضافة إلى المنافذ المشتقة)
- رمز روبوت Telegram

أما المطالبات الأخرى فهي مطابقة للإعداد الأولي المعتاد.

## الإعداد العام لعدة Gateways

يعمل نمط العزل نفسه مع أي زوج أو مجموعة من Gateways على مضيف واحد؛ امنح كل Gateway إضافي ملف تعريف مسمى ومنفذًا أساسيًا خاصين به:

```bash
# الرئيسي (ملف التعريف الافتراضي)
openclaw setup
openclaw gateway --port 18789

# Gateway إضافي
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

تعمل ملفات التعريف المسماة على الجانبين أيضًا:

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

استخدم البدء السريع لروبوت الإنقاذ لإنشاء مسار احتياطي للمشغّل، واستخدم نمط ملفات التعريف العام لتشغيل عدة Gateways طويلة العمر عبر قنوات أو مستأجرين أو مساحات عمل أو أدوار تشغيلية مختلفة.

## قائمة التحقق من العزل

أبقِ هذه الإعدادات فريدة لكل مثيل من Gateway:

| الإعداد                      | الغرض                              |
| ---------------------------- | ------------------------------------ |
| `OPENCLAW_CONFIG_PATH`       | ملف إعدادات خاص بكل مثيل             |
| `OPENCLAW_STATE_DIR`         | جلسات وبيانات اعتماد وذاكرات تخزين مؤقت خاصة بكل مثيل |
| `agents.defaults.workspace`  | جذر مساحة عمل خاص بكل مثيل          |
| `gateway.port` (أو `--port`) | فريد لكل مثيل                  |
| منافذ المتصفح/CDP المشتقة    | انظر أدناه                            |

تؤدي مشاركة أي من هذه العناصر إلى تعارضات في الإعدادات أو الحالة أو المنافذ. يفرض بدء تشغيل Gateway
ملكية فريدة لدليل الحالة حتى عندما يتجاوز
`OPENCLAW_ALLOW_MULTI_GATEWAY=1` المثيل المفرد لكل ملف إعدادات.

## تعيين المنافذ (المشتقة)

المنفذ الأساسي = `gateway.port` (أو `OPENCLAW_GATEWAY_PORT` / `--port`).

- منفذ خدمة التحكم في المتصفح = المنفذ الأساسي + 2 (واجهة الاسترجاع فقط).
- يُقدَّم مضيف Canvas على خادم HTTP الخاص بـ Gateway نفسه (المنفذ نفسه المستخدم بواسطة `gateway.port`).
- تُخصَّص منافذ CDP لملفات تعريف المتصفح تلقائيًا من `browser control port + 9` إلى `+ 108`.

إذا تجاوزت أيًا من هذه القيم في الإعدادات أو متغيرات البيئة، فيجب إبقاؤها فريدة لكل مثيل.

## ملاحظات المتصفح/CDP (مأزق شائع)

- **لا** تثبّت `browser.cdpUrl` على القيمة نفسها في عدة مثيلات.
- يحتاج كل مثيل إلى منفذ تحكم في المتصفح ونطاق CDP خاصين به (مشتقين من منفذ Gateway الخاص به).
- لإعداد منافذ CDP صراحةً، اضبط `browser.profiles.<name>.cdpPort` لكل مثيل.
- بالنسبة إلى Chrome البعيد، استخدم `browser.profiles.<name>.cdpUrl` (لكل ملف تعريف ولكل مثيل).

## مثال يدوي لمتغيرات البيئة

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## فحوصات سريعة

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

- يكتشف `gateway status --deep` خدمات launchd/systemd/schtasks القديمة المتبقية من عمليات تثبيت سابقة.
- لا يُتوقع ظهور نص تحذير `gateway probe`، مثل `multiple reachable gateway identities detected`، إلا عندما تشغّل عمدًا أكثر من Gateway معزول واحد، أو عندما يتعذر على OpenClaw إثبات أن أهداف الفحص القابلة للوصول هي Gateway نفسه. يُعد نفق SSH أو عنوان URL للوكيل أو عنوان URL بعيدًا مُعدًّا يشير إلى Gateway نفسه Gateway واحدًا له عدة وسائل نقل، حتى عندما تختلف منافذ النقل.

## ذو صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [قفل Gateway](/ar/gateway/gateway-lock)
- [الإعدادات](/ar/gateway/configuration)
