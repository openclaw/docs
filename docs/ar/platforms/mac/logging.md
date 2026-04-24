---
read_when:
    - التقاط السجلات على macOS أو التحقيق في تسجيل البيانات الخاصة
    - تصحيح مشكلات دورة حياة wake/session الخاصة بالصوت
summary: 'سجلات OpenClaw: سجل تشخيصات دوّار في ملف + علامات خصوصية السجل الموحدة'
title: السجلات على macOS
x-i18n:
    generated_at: "2026-04-24T07:52:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84e8f56ef0f85ba9eae629d6a3cc1bcaf49cc70c82f67a10b9292f2f54b1ff6b
    source_path: platforms/mac/logging.md
    workflow: 15
---

# السجلات (macOS)

## سجل التشخيصات الدوّار في الملف (جزء Debug)

يوجّه OpenClaw سجلات تطبيق macOS عبر swift-log (وباستخدام unified logging افتراضيًا) ويمكنه كتابة سجل ملف محلي دوّار إلى القرص عندما تحتاج إلى التقاط دائم.

- مستوى التفصيل: **Debug pane → Logs → App logging → Verbosity**
- التفعيل: **Debug pane → Logs → App logging → “Write rolling diagnostics log (JSONL)”**
- الموقع: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (يتم التدوير تلقائيًا؛ وتُلحق الملفات القديمة باللواحق `.1` و`.2` و…)
- المسح: **Debug pane → Logs → App logging → “Clear”**

ملاحظات:

- يكون هذا **معطلًا افتراضيًا**. فعّله فقط أثناء تصحيح الأخطاء فعليًا.
- تعامل مع الملف على أنه حساس؛ ولا تشاركه من دون مراجعة.

## بيانات السجل الخاصة في unified logging على macOS

يقوم unified logging بتنقيح معظم الحمولات ما لم يشترك نظام فرعي في `privacy -off`. ووفقًا لكتابة Peter حول [حيل خصوصية السجلات](https://steipete.me/posts/2025/logging-privacy-shenanigans) على macOS ‏(2025)، يتم التحكم في ذلك عبر plist في `/Library/Preferences/Logging/Subsystems/` يُفهرس باسم النظام الفرعي. ولا تلتقط العلامة إلا إدخالات السجل الجديدة، لذا فعّلها قبل إعادة إنتاج المشكلة.

## التفعيل لـ OpenClaw ‏(`ai.openclaw`)

- اكتب ملف plist إلى ملف مؤقت أولًا، ثم ثبّته بشكل ذرّي كـ root:

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

- لا يلزم إعادة التشغيل؛ إذ يلاحظ logd الملف بسرعة، لكن أسطر السجل الجديدة فقط ستتضمن الحمولات الخاصة.
- اعرض المخرجات الأغنى باستخدام المساعد الموجود، مثلًا `./scripts/clawlog.sh --category WebChat --last 5m`.

## التعطيل بعد تصحيح الأخطاء

- أزل التجاوز: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- ويمكنك اختياريًا تشغيل `sudo log config --reload` لإجبار logd على إسقاط التجاوز فورًا.
- تذكّر أن هذا السطح قد يتضمن أرقام هواتف ونصوص الرسائل؛ لذا أبقِ ملف plist موجودًا فقط عندما تكون بحاجة فعلية إلى تلك التفاصيل الإضافية.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [سجلات Gateway](/ar/gateway/logging)
