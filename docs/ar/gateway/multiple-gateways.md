---
read_when:
    - تشغيل أكثر من Gateway واحدة على الجهاز نفسه
    - تحتاج إلى إعدادات/حالة/منافذ معزولة لكل Gateway
summary: تشغيل عدة بوابات OpenClaw على مضيف واحد (العزل، والمنافذ، وملفات التعريف)
title: بوابات متعددة
x-i18n:
    generated_at: "2026-04-24T07:42:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1700a0d29ceee3e2a242a8455a3c948895fb25750a2b1bce5c4bd0690a051881
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# بوابات متعددة (على المضيف نفسه)

ينبغي أن تستخدم معظم الإعدادات Gateway واحدة لأن Gateway واحدة يمكنها التعامل مع عدة اتصالات مراسلة ووكلاء. إذا كنت تحتاج إلى عزل أقوى أو تكرار احتياطي (مثل rescue bot)، فشغّل بوابات منفصلة مع ملفات تعريف/منافذ معزولة.

## أفضل إعداد موصى به

بالنسبة إلى معظم المستخدمين، أبسط إعداد لـ rescue bot هو:

- إبقاء الروبوت الرئيسي على ملف التعريف الافتراضي
- تشغيل rescue bot على `--profile rescue`
- استخدام روبوت Telegram منفصل تمامًا لحساب الإنقاذ
- إبقاء rescue bot على منفذ أساسي مختلف مثل `19789`

يُبقي هذا rescue bot معزولًا عن الروبوت الرئيسي بحيث يمكنه تصحيح المشكلات أو تطبيق
تغييرات الإعداد إذا كان الروبوت الأساسي متوقفًا. اترك ما لا يقل عن 20 منفذًا بين
المنافذ الأساسية حتى لا تتصادم المنافذ المشتقة للمتصفح/canvas/CDP أبدًا.

## بداية سريعة لـ Rescue-Bot

استخدم هذا كمسار افتراضي ما لم يكن لديك سبب قوي لفعل شيء
آخر:

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

إذا كان الروبوت الرئيسي يعمل بالفعل، فهذا عادةً كل ما تحتاج إليه.

أثناء `openclaw --profile rescue onboard`:

- استخدم token روبوت Telegram المنفصل
- احتفظ بملف التعريف `rescue`
- استخدم منفذًا أساسيًا أعلى من منفذ الروبوت الرئيسي بما لا يقل عن 20
- اقبل مساحة العمل الافتراضية الخاصة بالإنقاذ ما لم تكن تدير واحدة بنفسك بالفعل

إذا كان onboarding قد ثبّت خدمة الإنقاذ لك بالفعل، فلن تكون هناك حاجة إلى
`gateway install` الأخير.

## لماذا ينجح هذا

يبقى rescue bot مستقلًا لأنه يملك ما يلي بنفسه:

- ملف التعريف/الإعداد
- دليل الحالة
- مساحة العمل
- المنفذ الأساسي (بالإضافة إلى المنافذ المشتقة)
- token روبوت Telegram

في معظم الإعدادات، استخدم روبوت Telegram منفصلًا تمامًا لملف تعريف الإنقاذ:

- سهل الإبقاء عليه للمشغّل فقط
- token وهوية منفصلان للروبوت
- مستقل عن تثبيت القناة/التطبيق الخاص بالروبوت الرئيسي
- مسار استرداد بسيط قائم على الرسائل المباشرة عندما يتعطل الروبوت الرئيسي

## ما الذي يغيّره `--profile rescue onboard`

يستخدم `openclaw --profile rescue onboard` تدفق onboarding العادي، لكنه
يكتب كل شيء داخل ملف تعريف منفصل.

عمليًا، هذا يعني أن rescue bot يحصل على ما يلي بنفسه:

- ملف إعداد
- دليل حالة
- مساحة عمل (افتراضيًا `~/.openclaw/workspace-rescue`)
- اسم خدمة مُدارة

أما المطالبات فتبقى كما هي في onboarding العادي.

## إعداد عام لعدة بوابات

يُعد تخطيط rescue bot أعلاه أسهل خيار افتراضي، لكن نمط العزل نفسه
يعمل مع أي زوج أو مجموعة من البوابات على مضيف واحد.

لإعداد أكثر عمومية، امنح كل Gateway إضافية ملف تعريف مسمى خاصًا بها و
منفذًا أساسيًا خاصًا بها:

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

إذا كنت تريد أن تستخدم كلتا البوابتين ملفات تعريف مسماة، فهذا يعمل أيضًا:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

وتتبع الخدمات النمط نفسه:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

استخدم البداية السريعة لـ rescue bot عندما تريد مسارًا احتياطيًا للمشغّل. واستخدم
نمط ملفات التعريف العام عندما تريد عدة بوابات طويلة العمر
لقنوات مختلفة، أو مستأجرين مختلفين، أو مساحات عمل مختلفة، أو أدوار تشغيلية مختلفة.

## قائمة التحقق من العزل

اجعل هذه العناصر فريدة لكل مثيل Gateway:

- `OPENCLAW_CONFIG_PATH` — ملف إعداد لكل مثيل
- `OPENCLAW_STATE_DIR` — جلسات وبيانات اعتماد وذاكرات مؤقتة لكل مثيل
- `agents.defaults.workspace` — جذر مساحة عمل لكل مثيل
- `gateway.port` (أو `--port`) — فريد لكل مثيل
- المنافذ المشتقة للمتصفح/canvas/CDP

إذا تمت مشاركة هذه العناصر، فستواجه حالات تسابق في الإعداد وتعارضات في المنافذ.

## تخطيط المنافذ (المشتقة)

المنفذ الأساسي = `gateway.port` (أو `OPENCLAW_GATEWAY_PORT` / `--port`).

- منفذ خدمة التحكم في المتصفح = الأساسي + 2 (loopback فقط)
- يتم تقديم مضيف canvas على خادم Gateway HTTP (المنفذ نفسه الخاص بـ `gateway.port`)
- يتم تخصيص منافذ CDP لملف تعريف المتصفح تلقائيًا من `browser.controlPort + 9 .. + 108`

إذا تجاوزت أيًا من هذه القيم في الإعداد أو env، فيجب أن تبقيها فريدة لكل مثيل.

## ملاحظات المتصفح/CDP (أحد الأخطاء الشائعة)

- **لا** تثبّت `browser.cdpUrl` على القيم نفسها عبر عدة مثيلات.
- يحتاج كل مثيل إلى منفذ تحكم متصفح خاص به ونطاق CDP خاص به (مشتق من منفذ Gateway الخاص به).
- إذا كنت تحتاج إلى منافذ CDP صريحة، فاضبط `browser.profiles.<name>.cdpPort` لكل مثيل.
- بالنسبة إلى Chrome البعيد: استخدم `browser.profiles.<name>.cdpUrl` (لكل ملف تعريف، ولكل مثيل).

## مثال env يدوي

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

- يساعد `gateway status --deep` في اكتشاف خدمات launchd/systemd/schtasks القديمة العالقة من التثبيتات الأقدم.
- يكون نص التحذير في `gateway probe` مثل `multiple reachable gateways detected` متوقعًا فقط عندما تشغّل عمدًا أكثر من Gateway معزولة واحدة.

## ذو صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [قفل Gateway](/ar/gateway/gateway-lock)
- [الإعداد](/ar/gateway/configuration)
