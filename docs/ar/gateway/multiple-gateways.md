---
read_when:
    - تشغيل أكثر من Gateway واحد على الجهاز نفسه
    - تحتاج إلى إعدادات/حالة/منافذ معزولة لكل Gateway
summary: تشغيل عدة Gateway من OpenClaw على مضيف واحد (العزل، والمنافذ، وملفات التعريف)
title: بوابات Gateway متعددة
x-i18n:
    generated_at: "2026-04-30T08:00:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 655f9ea5100813d5836f24eb47a5646443f83d70953efa64122633a5a1341002
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

ينبغي أن تستخدم معظم الإعدادات Gateway واحدا لأن Gateway واحدا يمكنه التعامل مع اتصالات مراسلة ووكلاء متعددين. إذا كنت تحتاج إلى عزل أقوى أو تكرار احتياطي (مثل بوت إنقاذ)، فشغل Gateways منفصلة بملفات تعريف/منافذ معزولة.

## أفضل إعداد موصى به

لمعظم المستخدمين، أبسط إعداد لبوت الإنقاذ هو:

- إبقاء البوت الرئيسي على ملف التعريف الافتراضي
- تشغيل بوت الإنقاذ على `--profile rescue`
- استخدام بوت Telegram منفصل تماما لحساب الإنقاذ
- إبقاء بوت الإنقاذ على منفذ أساس مختلف مثل `19789`

يبقي هذا بوت الإنقاذ معزولا عن البوت الرئيسي لكي يتمكن من تصحيح الأخطاء أو تطبيق
تغييرات التكوين إذا كان البوت الأساسي متوقفا. اترك 20 منفذا على الأقل بين
منافذ الأساس حتى لا تتعارض منافذ المتصفح/canvas/CDP المشتقة أبدا.

## البدء السريع لبوت الإنقاذ

استخدم هذا كمسار افتراضي ما لم يكن لديك سبب قوي لفعل شيء
آخر:

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

إذا كان البوت الرئيسي يعمل بالفعل، فهذا عادة كل ما تحتاج إليه.

أثناء `openclaw --profile rescue onboard`:

- استخدم رمز بوت Telegram المنفصل
- احتفظ بملف التعريف `rescue`
- استخدم منفذ أساس أعلى من البوت الرئيسي بما لا يقل عن 20
- اقبل مساحة عمل الإنقاذ الافتراضية ما لم تكن تدير واحدة بنفسك بالفعل

إذا كان الإعداد الأولي قد ثبت خدمة الإنقاذ لك بالفعل، فلن تكون خطوة
`gateway install` الأخيرة مطلوبة.

## لماذا يعمل هذا

يبقى بوت الإنقاذ مستقلا لأن لديه ما يخصه من:

- ملف تعريف/تكوين
- دليل حالة
- مساحة عمل
- منفذ أساس (إضافة إلى المنافذ المشتقة)
- رمز بوت Telegram

لمعظم الإعدادات، استخدم بوت Telegram منفصلا تماما لملف تعريف الإنقاذ:

- يسهل إبقاؤه للمشغلين فقط
- رمز بوت وهوية منفصلان
- مستقل عن تثبيت قناة/تطبيق البوت الرئيسي
- مسار استرداد بسيط قائم على الرسائل المباشرة عندما يكون البوت الرئيسي معطلا

## ما الذي يغيره `--profile rescue onboard`

يستخدم `openclaw --profile rescue onboard` تدفق الإعداد الأولي العادي، لكنه
يكتب كل شيء في ملف تعريف منفصل.

عمليا، يعني ذلك أن بوت الإنقاذ يحصل على ما يخصه من:

- ملف تكوين
- دليل حالة
- مساحة عمل (افتراضيا `~/.openclaw/workspace-rescue`)
- اسم خدمة مدارة

فيما عدا ذلك، تكون المطالبات هي نفسها كما في الإعداد الأولي العادي.

## إعداد عام لعدة Gateways

تخطيط بوت الإنقاذ أعلاه هو أسهل خيار افتراضي، لكن نمط العزل نفسه
ينجح مع أي زوج أو مجموعة من Gateways على مضيف واحد.

لإعداد أكثر عمومية، أعط كل Gateway إضافي ملف تعريف مسمى خاصا به
ومنفذ أساس خاصا به:

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

إذا كنت تريد أن يستخدم كلا Gatewayين ملفات تعريف مسماة، فهذا يعمل أيضا:

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

استخدم البدء السريع لبوت الإنقاذ عندما تريد مسارا احتياطيا للمشغل. استخدم
نمط ملفات التعريف العام عندما تريد عدة Gateways طويلة العمر من أجل
قنوات أو مستأجرين أو مساحات عمل أو أدوار تشغيلية مختلفة.

## قائمة تحقق العزل

حافظ على تفرد هذه العناصر لكل نسخة Gateway:

- `OPENCLAW_CONFIG_PATH` — ملف تكوين لكل نسخة
- `OPENCLAW_STATE_DIR` — جلسات وبيانات اعتماد وذاكرات تخزين مؤقت لكل نسخة
- `agents.defaults.workspace` — جذر مساحة عمل لكل نسخة
- `gateway.port` (أو `--port`) — فريد لكل نسخة
- منافذ المتصفح/canvas/CDP المشتقة

إذا كانت هذه العناصر مشتركة، فستواجه سباقات تكوين وتعارضات منافذ.

## تعيين المنافذ (مشتق)

منفذ الأساس = `gateway.port` (أو `OPENCLAW_GATEWAY_PORT` / `--port`).

- منفذ خدمة التحكم في المتصفح = الأساس + 2 (local loopback فقط)
- يقدم مضيف canvas على خادم HTTP الخاص بـ Gateway (المنفذ نفسه مثل `gateway.port`)
- تخصص منافذ CDP لملف تعريف المتصفح تلقائيا من `browser.controlPort + 9 .. + 108`

إذا تجاوزت أيّا من هذه في التكوين أو البيئة، فيجب أن تبقيها فريدة لكل نسخة.

## ملاحظات المتصفح/CDP (خطأ شائع)

- لا تثبت **`browser.cdpUrl`** على القيم نفسها في عدة نسخ.
- تحتاج كل نسخة إلى منفذ تحكم في المتصفح ونطاق CDP خاصين بها (مشتقان من منفذ Gateway الخاص بها).
- إذا كنت تحتاج إلى منافذ CDP صريحة، فاضبط `browser.profiles.<name>.cdpPort` لكل نسخة.
- Chrome البعيد: استخدم `browser.profiles.<name>.cdpUrl` (لكل ملف تعريف، لكل نسخة).

## مثال يدوي للبيئة

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

التفسير:

- يساعد `gateway status --deep` في اكتشاف خدمات launchd/systemd/schtasks القديمة من التثبيتات السابقة.
- نص تحذير `gateway probe` مثل `multiple reachable gateways detected` متوقع فقط عندما تشغل عمدا أكثر من gateway معزول واحد.

## ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [قفل Gateway](/ar/gateway/gateway-lock)
- [التكوين](/ar/gateway/configuration)
