---
read_when:
    - التقاط سجلات macOS أو التحقيق في تسجيل البيانات الخاصة
    - تصحيح مشكلات دورة حياة التنبيه الصوتي/الجلسة
summary: 'تسجيل سجلات OpenClaw: سجل ملف تشخيصات متناوب + أعلام خصوصية السجل الموحّد'
title: تسجيل السجلات في macOS
x-i18n:
    generated_at: "2026-05-06T08:04:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c001008311d4e3f245add4cce32bdcc3eed9d897b30f6884c0649d2f0523df
    source_path: platforms/mac/logging.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# التسجيل (macOS)

## سجل ملف تشخيصات متناوب (لوحة التصحيح)

يوجّه OpenClaw سجلات تطبيق macOS عبر swift-log (التسجيل الموحّد افتراضيًا) ويمكنه كتابة سجل ملف محلي متناوب إلى القرص عندما تحتاج إلى التقاط دائم.

- مستوى التفصيل: **لوحة التصحيح → السجلات → تسجيل التطبيق → مستوى التفصيل**
- التفعيل: **لوحة التصحيح → السجلات → تسجيل التطبيق → "كتابة سجل تشخيصات متناوب (JSONL)"**
- الموقع: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (يتناوب تلقائيًا؛ تُضاف إلى الملفات القديمة لواحق مثل `.1` و`.2` و…)
- المسح: **لوحة التصحيح → السجلات → تسجيل التطبيق → "مسح"**

ملاحظات:

- هذا **معطّل افتراضيًا**. فعّله فقط أثناء التصحيح النشط.
- تعامل مع الملف على أنه حساس؛ لا تشاركه دون مراجعته.

## البيانات الخاصة في التسجيل الموحّد على macOS

يحجب التسجيل الموحّد معظم الحمولات ما لم يختر نظام فرعي استخدام `privacy -off`. وفقًا لمقالة Peter عن [حيل خصوصية التسجيل](https://steipete.me/posts/2025/logging-privacy-shenanigans) في macOS (2025)، يتم التحكم في ذلك بواسطة plist في `/Library/Preferences/Logging/Subsystems/` keyed by the subsystem name. تلتقط إدخالات السجل الجديدة فقط العلامة، لذا فعّلها قبل إعادة إنتاج مشكلة.

## التفعيل لـ OpenClaw (`ai.openclaw`)

- اكتب plist إلى ملف مؤقت أولًا، ثم ثبّته ذريًا كجذر:

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

- لا يلزم إعادة التشغيل؛ يلاحظ logd الملف بسرعة، لكن أسطر السجل الجديدة فقط ستتضمن الحمولات الخاصة.
- اعرض المخرجات الأغنى باستخدام المساعد الموجود، مثل `./scripts/clawlog.sh --category WebChat --last 5m`.

## التعطيل بعد التصحيح

- أزل التجاوز: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- اختياريًا، شغّل `sudo log config --reload` لإجبار logd على إسقاط التجاوز فورًا.
- تذكّر أن هذا السطح يمكن أن يتضمن أرقام هواتف ومحتويات رسائل؛ أبقِ plist في مكانه فقط أثناء حاجتك النشطة إلى التفاصيل الإضافية.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [تسجيل Gateway](/ar/gateway/logging)
