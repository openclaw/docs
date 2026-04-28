---
read_when:
    - تصحيح مؤشرات الصحة في تطبيق Mac
summary: كيف يبلّغ تطبيق macOS عن حالات صحة gateway/Baileys
title: فحوصات الصحة (macOS)
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T07:52:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7488b39b0eec013083f52e2798d719bec35780acad743a97f5646a6891810e5
    source_path: platforms/mac/health.md
    workflow: 15
---

# فحوصات الصحة على macOS

كيفية معرفة ما إذا كانت القناة المرتبطة سليمة من تطبيق شريط القائمة.

## شريط القائمة

- تعكس نقطة الحالة الآن صحة Baileys:
  - أخضر: مرتبط + تم فتح المقبس مؤخرًا.
  - برتقالي: جارٍ الاتصال/إعادة المحاولة.
  - أحمر: تم تسجيل الخروج أو فشل الفحص.
- يقرأ السطر الثانوي "linked · auth 12m" أو يعرض سبب الفشل.
- يؤدي عنصر القائمة "Run Health Check" إلى تشغيل فحص عند الطلب.

## الإعدادات

- يضيف تبويب General بطاقة Health تعرض: عمر المصادقة المرتبطة، ومسار/عدد مخزن الجلسات، ووقت آخر فحص، وآخر خطأ/رمز حالة، وأزرار Run Health Check / Reveal Logs.
- يستخدم لقطة مخزنة مؤقتًا بحيث تُحمَّل واجهة المستخدم فورًا وتعود بشكل سلس عند انقطاع الاتصال.
- يعرض **تبويب Channels** حالة القناة + عناصر التحكم في WhatsApp/Telegram ‏(QR لتسجيل الدخول، وتسجيل الخروج، والفحص، وآخر قطع اتصال/خطأ).

## كيف يعمل الفحص

- يشغّل التطبيق `openclaw health --json` عبر `ShellExecutor` كل نحو 60 ثانية وعند الطلب. يقوم الفحص بتحميل بيانات الاعتماد والإبلاغ عن الحالة من دون إرسال رسائل.
- يتم تخزين آخر لقطة سليمة وآخر خطأ بشكل منفصل لتجنب الوميض؛ ويتم عرض الطابع الزمني لكل منهما.

## عند الشك

- لا يزال بإمكانك استخدام تدفق CLI في [صحة Gateway](/ar/gateway/health) ‏(`openclaw status`, `openclaw status --deep`, `openclaw health --json`) ومتابعة `/tmp/openclaw/openclaw-*.log` بحثًا عن `web-heartbeat` / `web-reconnect`.

## ذو صلة

- [صحة Gateway](/ar/gateway/health)
- [تطبيق macOS](/ar/platforms/macos)
