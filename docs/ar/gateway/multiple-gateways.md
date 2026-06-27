---
read_when:
    - تشغيل أكثر من Gateway واحد على الجهاز نفسه
    - تحتاج إلى إعدادات/حالة/منافذ معزولة لكل Gateway
summary: شغّل عدة Gateways من OpenClaw على مضيف واحد (العزل والمنافذ والملفات التعريفية)
title: بوابات متعددة
x-i18n:
    generated_at: "2026-06-27T17:41:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d6f6df481f6ba36749770199ef6eaf94eed33af2bed38d35a31f77b9dbba1913
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

ينبغي أن تستخدم معظم الإعدادات Gateway واحدًا، لأن Gateway واحدًا يمكنه التعامل مع عدة اتصالات مراسلة وعدة وكلاء. إذا كنت تحتاج إلى عزل أقوى أو تكرار احتياطي (مثل بوت إنقاذ)، فشغّل Gateways منفصلة بملفات تعريف/منافذ معزولة.

## أفضل إعداد موصى به

بالنسبة إلى معظم المستخدمين، أبسط إعداد لبوت الإنقاذ هو:

- إبقاء البوت الرئيسي على ملف التعريف الافتراضي
- تشغيل بوت الإنقاذ على `--profile rescue`
- استخدام بوت Telegram منفصل تمامًا لحساب الإنقاذ
- إبقاء بوت الإنقاذ على منفذ أساسي مختلف مثل `19789`

هذا يبقي بوت الإنقاذ معزولًا عن البوت الرئيسي حتى يتمكن من تصحيح الأخطاء أو تطبيق
تغييرات الإعدادات إذا كان البوت الأساسي متوقفًا. اترك 20 منفذًا على الأقل بين
المنافذ الأساسية حتى لا تتصادم أبدًا منافذ المتصفح/canvas/CDP المشتقة.

## البدء السريع لبوت الإنقاذ

استخدم هذا كمسار افتراضي ما لم يكن لديك سبب قوي لفعل شيء
آخر:

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

إذا كان البوت الرئيسي يعمل بالفعل، فعادةً هذا كل ما تحتاج إليه.

أثناء `openclaw --profile rescue onboard`:

- استخدم رمز بوت Telegram المنفصل
- أبقِ ملف التعريف `rescue`
- استخدم منفذًا أساسيًا أعلى من منفذ البوت الرئيسي بما لا يقل عن 20
- اقبل مساحة عمل الإنقاذ الافتراضية ما لم تكن تدير واحدة بنفسك بالفعل

إذا كان الإعداد الأولي قد ثبّت خدمة الإنقاذ لك بالفعل، فلن تحتاج إلى أمر
`gateway install` النهائي.

## لماذا يعمل هذا

يبقى بوت الإنقاذ مستقلًا لأنه يمتلك:

- ملف تعريف/إعدادات خاصة به
- دليل حالة خاصًا به
- مساحة عمل خاصة به
- منفذًا أساسيًا (بالإضافة إلى المنافذ المشتقة)
- رمز بوت Telegram خاصًا به

بالنسبة إلى معظم الإعدادات، استخدم بوت Telegram منفصلًا تمامًا لملف تعريف الإنقاذ:

- سهل الإبقاء عليه للمشغّلين فقط
- رمز بوت وهوية منفصلان
- مستقل عن تثبيت قناة/تطبيق البوت الرئيسي
- مسار استرداد بسيط قائم على الرسائل المباشرة عندما يكون البوت الرئيسي معطّلًا

## ما الذي يغيّره `--profile rescue onboard`

يستخدم `openclaw --profile rescue onboard` تدفق الإعداد الأولي المعتاد، لكنه
يكتب كل شيء في ملف تعريف منفصل.

عمليًا، يعني ذلك أن بوت الإنقاذ يحصل على:

- ملف إعدادات خاص به
- دليل حالة خاص به
- مساحة عمل خاصة به (افتراضيًا `~/.openclaw/workspace-rescue`)
- اسم خدمة مُدارة خاص به

أما المطالبات فهي مماثلة للإعداد الأولي العادي.

## إعداد عام لعدة Gateways

تخطيط بوت الإنقاذ أعلاه هو الافتراضي الأسهل، لكن نمط العزل نفسه
ينجح مع أي زوج أو مجموعة من Gateways على مضيف واحد.

لإعداد أكثر عمومية، امنح كل Gateway إضافي ملف تعريف مسمى خاصًا به
ومنفذًا أساسيًا خاصًا به:

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

إذا كنت تريد أن يستخدم كلا Gateways ملفات تعريف مسماة، فهذا يعمل أيضًا:

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

استخدم البدء السريع لبوت الإنقاذ عندما تريد مسار مشغّل احتياطيًا. واستخدم
نمط ملفات التعريف العام عندما تريد عدة Gateways طويلة العمر
لقنوات أو مستأجرين أو مساحات عمل أو أدوار تشغيلية مختلفة.

## قائمة تحقق العزل

أبقِ هذه العناصر فريدة لكل نسخة Gateway:

- `OPENCLAW_CONFIG_PATH` — ملف إعدادات لكل نسخة
- `OPENCLAW_STATE_DIR` — جلسات وبيانات اعتماد وذاكرات تخزين مؤقت لكل نسخة
- `agents.defaults.workspace` — جذر مساحة عمل لكل نسخة
- `gateway.port` (أو `--port`) — فريد لكل نسخة
- منافذ المتصفح/canvas/CDP المشتقة

إذا كانت هذه العناصر مشتركة، فستواجه تعارضات في الإعدادات وتعارضات في المنافذ.

## تعيين المنافذ (المشتقة)

المنفذ الأساسي = `gateway.port` (أو `OPENCLAW_GATEWAY_PORT` / `--port`).

- منفذ خدمة التحكم في المتصفح = الأساسي + 2 (حلقة رجوع فقط)
- تتم خدمة مضيف canvas على خادم HTTP الخاص بـ Gateway (المنفذ نفسه مثل `gateway.port`)
- تُخصَّص منافذ CDP لملف تعريف المتصفح تلقائيًا من `browser.controlPort + 9 .. + 108`

إذا تجاوزت أيًا من هذه القيم في الإعدادات أو البيئة، فيجب أن تبقيها فريدة لكل نسخة.

## ملاحظات المتصفح/CDP (خطأ شائع)

- **لا** تثبّت `browser.cdpUrl` على القيم نفسها في عدة نسخ.
- تحتاج كل نسخة إلى منفذ تحكم متصفح خاص بها ونطاق CDP خاص بها (مشتق من منفذ gateway الخاص بها).
- إذا كنت تحتاج إلى منافذ CDP صريحة، فاضبط `browser.profiles.<name>.cdpPort` لكل نسخة.
- Chrome البعيد: استخدم `browser.profiles.<name>.cdpUrl` (لكل ملف تعريف، ولكل نسخة).

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

- يساعد `gateway status --deep` في اكتشاف خدمات launchd/systemd/schtasks القديمة من عمليات التثبيت الأقدم.
- نص تحذير `gateway probe` مثل `multiple reachable gateway identities detected` متوقع فقط عندما تشغّل عمدًا أكثر من gateway معزول واحد، أو عندما لا يستطيع OpenClaw إثبات أن أهداف الفحص القابلة للوصول هي gateway نفسه. نفق SSH أو عنوان URL وكيل أو عنوان URL بعيد مهيأ إلى gateway نفسه يُعد gateway واحدًا بعدة وسائل نقل، حتى عندما تختلف منافذ النقل.

## ذو صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [قفل Gateway](/ar/gateway/gateway-lock)
- [الإعدادات](/ar/gateway/configuration)
