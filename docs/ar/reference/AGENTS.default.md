---
read_when:
    - بدء جلسة وكيل OpenClaw جديدة
    - تمكين Skills الافتراضية أو تدقيقها
summary: تعليمات وكيل OpenClaw الافتراضية وقائمة Skills لإعداد المساعد الشخصي
title: AGENTS.md الافتراضي
x-i18n:
    generated_at: "2026-04-30T08:23:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 839368a09c60ac6b7cd403e6ecd86dd0cafd01de8c8b70a1d919cf7daf6d51af
    source_path: reference/AGENTS.default.md
    workflow: 16
---

# AGENTS.md - المساعد الشخصي لـ OpenClaw (الافتراضي)

## التشغيل الأول (موصى به)

يستخدم OpenClaw دليل مساحة عمل مخصصًا للوكيل. الافتراضي: `~/.openclaw/workspace` (قابل للتهيئة عبر `agents.defaults.workspace`).

1. أنشئ مساحة العمل (إذا لم تكن موجودة مسبقًا):

```bash
mkdir -p ~/.openclaw/workspace
```

2. انسخ قوالب مساحة العمل الافتراضية إلى مساحة العمل:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. اختياري: إذا كنت تريد قائمة Skills الخاصة بالمساعد الشخصي، فاستبدل AGENTS.md بهذا الملف:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. اختياري: اختر مساحة عمل مختلفة عن طريق ضبط `agents.defaults.workspace` (يدعم `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## إعدادات السلامة الافتراضية

- لا تفرغ الأدلة أو الأسرار في الدردشة.
- لا تشغّل أوامر مدمرة إلا إذا طُلب ذلك صراحةً.
- لا ترسل ردودًا جزئية/متدفقة إلى واجهات المراسلة الخارجية (الردود النهائية فقط).

## بدء الجلسة (مطلوب)

- اقرأ `SOUL.md` و`USER.md` واليوم+أمس في `memory/`.
- اقرأ `MEMORY.md` عند وجوده.
- افعل ذلك قبل الرد.

## الروح (مطلوب)

- يحدد `SOUL.md` الهوية والنبرة والحدود. أبقه محدّثًا.
- إذا غيّرت `SOUL.md`، فأخبر المستخدم.
- أنت نسخة جديدة في كل جلسة؛ الاستمرارية محفوظة في هذه الملفات.

## المساحات المشتركة (موصى به)

- أنت لست صوت المستخدم؛ كن حذرًا في الدردشات الجماعية أو القنوات العامة.
- لا تشارك بيانات خاصة أو معلومات اتصال أو ملاحظات داخلية.

## نظام الذاكرة (موصى به)

- السجل اليومي: `memory/YYYY-MM-DD.md` (أنشئ `memory/` إذا لزم الأمر).
- الذاكرة طويلة الأمد: `MEMORY.md` للحقائق والتفضيلات والقرارات الدائمة.
- الملف `memory.md` بالأحرف الصغيرة هو إدخال إصلاح قديم فقط؛ لا تُبقِ كلا الملفين الجذريين عمدًا.
- عند بدء الجلسة، اقرأ اليوم + أمس + `MEMORY.md` عند وجوده.
- التقط: القرارات، والتفضيلات، والقيود، والحلقات المفتوحة.
- تجنّب الأسرار إلا إذا طُلب ذلك صراحةً.

## الأدوات وSkills

- الأدوات موجودة في Skills؛ اتبع `SKILL.md` الخاص بكل مهارة عندما تحتاج إليها.
- احتفظ بالملاحظات الخاصة بالبيئة في `TOOLS.md` (ملاحظات لـ Skills).

## نصيحة النسخ الاحتياطي (موصى به)

إذا تعاملت مع مساحة العمل هذه باعتبارها “ذاكرة” Clawd، فاجعلها مستودع git (ويفضّل أن يكون خاصًا) حتى يتم نسخ `AGENTS.md` وملفات الذاكرة احتياطيًا.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## ما يفعله OpenClaw

- يشغّل WhatsApp gateway + وكيل ترميز Pi بحيث يستطيع المساعد قراءة/كتابة الدردشات، وجلب السياق، وتشغيل Skills عبر جهاز Mac المضيف.
- يدير تطبيق macOS الأذونات (تسجيل الشاشة، الإشعارات، الميكروفون) ويعرض CLI `openclaw` عبر الملف الثنائي المضمّن فيه.
- تُدمج الدردشات المباشرة في جلسة `main` الخاصة بالوكيل افتراضيًا؛ تبقى المجموعات معزولة كـ `agent:<agentId>:<channel>:group:<id>` (الغرف/القنوات: `agent:<agentId>:<channel>:channel:<id>`)، وتحافظ Heartbeats على بقاء المهام الخلفية نشطة.

## Skills الأساسية (فعّلها في Settings → Skills)

- **mcporter** — بيئة تشغيل/CLI لخادم الأدوات لإدارة خلفيات Skills الخارجية.
- **Peekaboo** — لقطات شاشة macOS سريعة مع تحليل اختياري بالرؤية الذكية.
- **camsnap** — التقاط إطارات أو مقاطع أو تنبيهات حركة من كاميرات أمان RTSP/ONVIF.
- **oracle** — CLI وكيل جاهز لـ OpenAI مع إعادة تشغيل الجلسات والتحكم في المتصفح.
- **eightctl** — تحكّم في نومك من الطرفية.
- **imsg** — إرسال وقراءة وبث iMessage وSMS.
- **wacli** — CLI لـ WhatsApp: مزامنة، بحث، إرسال.
- **discord** — إجراءات Discord: تفاعل، ملصقات، استطلاعات. استخدم أهداف `user:<id>` أو `channel:<id>` (المعرّفات الرقمية المجردة ملتبسة).
- **gog** — CLI لـ Google Suite: Gmail وCalendar وDrive وContacts.
- **spotify-player** — عميل Spotify طرفي للبحث/الإضافة إلى قائمة التشغيل/التحكم في التشغيل.
- **sag** — كلام ElevenLabs مع تجربة استخدام say بنمط mac؛ يبث إلى السماعات افتراضيًا.
- **Sonos CLI** — تحكّم في سماعات Sonos (اكتشاف/حالة/تشغيل/مستوى الصوت/تجميع) من السكربتات.
- **blucli** — تشغيل مشغلات BluOS وتجميعها وأتمتتها من السكربتات.
- **OpenHue CLI** — تحكم في إضاءة Philips Hue للمشاهد والأتمتة.
- **OpenAI Whisper** — تحويل الكلام إلى نص محليًا للإملاء السريع ونصوص رسائل البريد الصوتي.
- **Gemini CLI** — نماذج Google Gemini من الطرفية للأسئلة والأجوبة السريعة.
- **agent-tools** — مجموعة أدوات مساعدة للأتمتة والسكربتات المساندة.

## ملاحظات الاستخدام

- فضّل CLI `openclaw` للبرمجة النصية؛ يتولى تطبيق Mac الأذونات.
- شغّل عمليات التثبيت من تبويب Skills؛ يخفي الزر إذا كان الملف الثنائي موجودًا بالفعل.
- أبقِ Heartbeats مفعّلة حتى يستطيع المساعد جدولة التذكيرات، ومراقبة صناديق الوارد، وتشغيل التقاطات الكاميرا.
- تعمل واجهة Canvas بملء الشاشة مع طبقات أصلية. تجنّب وضع عناصر التحكم الحرجة في أعلى اليسار/أعلى اليمين/الحواف السفلية؛ أضف هوامش واضحة في التخطيط ولا تعتمد على safe-area insets.
- للتحقق المعتمد على المتصفح، استخدم `openclaw browser` (التبويبات/الحالة/لقطة الشاشة) مع ملف Chrome الشخصي المدار من OpenClaw.
- لفحص DOM، استخدم `openclaw browser eval|query|dom|snapshot` (و`--json`/`--out` عندما تحتاج إلى خرج آلي).
- للتفاعلات، استخدم `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (يتطلب click/type مراجع snapshot؛ استخدم `evaluate` لمحددات CSS).

## ذو صلة

- [مساحة عمل الوكيل](/ar/concepts/agent-workspace)
- [بيئة تشغيل الوكيل](/ar/concepts/agent)
