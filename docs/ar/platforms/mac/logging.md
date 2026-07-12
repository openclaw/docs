---
read_when:
    - التقاط سجلات macOS أو التحقق من تسجيل البيانات الخاصة
    - تصحيح مشكلات دورة حياة التنبيه الصوتي والجلسة
summary: 'تسجيل OpenClaw: سجل ملف تشخيصات متجدد + علامات خصوصية موحّدة للسجل'
title: تسجيل macOS
x-i18n:
    generated_at: "2026-07-12T06:12:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef0fd91bd7fc0a8b5f598cfe8f5de551795a4badd0f6634c5bcbd4f3916bfc64
    source_path: platforms/mac/logging.md
    workflow: 16
---

# التسجيل (macOS)

## سجل ملف التشخيصات الدوري (جزء التصحيح)

يسجّل تطبيق macOS عبر swift-log (باستخدام التسجيل الموحّد افتراضيًا)، ويمكنه أيضًا كتابة سجل ملف محلي دوري للاحتفاظ الدائم (`DiagnosticsFileLog`).

- التمكين: **جزء التصحيح -> السجلات -> تسجيل التطبيق -> "كتابة سجل تشخيصات دوري (JSONL)"** (معطّل افتراضيًا).
- مستوى التفصيل: أداة اختيار **جزء التصحيح -> السجلات -> تسجيل التطبيق -> مستوى التفصيل**.
- الموقع: `~/Library/Logs/OpenClaw/diagnostics.jsonl`.
- التدوير: يُدوَّر عند 5 ميغابايت؛ مع ما يصل إلى 5 نسخ احتياطية باللواحق `.1`...`.5` (تُحذف الأقدم).
- المسح: يحذف **جزء التصحيح -> السجلات -> تسجيل التطبيق -> "مسح"** الملف النشط وجميع النسخ الاحتياطية.

تعامل مع الملف على أنه حساس؛ ولا تشاركه من دون مراجعته.

## البيانات الخاصة في التسجيل الموحّد على macOS

يحجب التسجيل الموحّد معظم الحمولات ما لم يشترك نظام فرعي في `privacy -off`. يتحكم في ذلك ملف plist داخل `/Library/Preferences/Logging/Subsystems/` بمفتاح هو اسم النظام الفرعي. لا تلتقط العلامة سوى إدخالات السجل الجديدة، لذا مكّنها قبل إعادة إنتاج مشكلة. معلومات أساسية: [خفايا خصوصية التسجيل في macOS](https://steipete.me/posts/2025/logging-privacy-shenanigans).

## التمكين لـ OpenClaw ‏(`ai.openclaw`)

اكتب ملف plist أولًا في ملف مؤقت، ثم ثبّته ذريًا بصلاحيات الجذر:

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

لا يلزم إعادة التشغيل؛ يلتقط logd الملف بسرعة، لكن سطور السجل الجديدة فقط تتضمن الحمولات الخاصة. اعرض المخرجات الأكثر تفصيلًا باستخدام `./scripts/clawlog.sh --category WebChat --last 5m` (يعيّن `--last`/`-l` النطاق الزمني، والقيمة الافتراضية `5m`؛ ويرشّح `--category`/`-c` حسب الفئة).

## التعطيل بعد التصحيح

- أزل التجاوز: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- اختياريًا، شغّل `sudo log config --reload` لإجبار logd على إسقاط التجاوز فورًا.
- قد يتضمن هذا السطح أرقام هواتف ونصوص رسائل؛ لا تُبقِ ملف plist في مكانه إلا أثناء الحاجة الفعلية إليه.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [تسجيل Gateway](/ar/gateway/logging)
