---
read_when:
    - تحتاج إلى متابعة سجلات Gateway عن بُعد (من دون SSH)
    - تريد أسطر سجلات بتنسيق JSON للأدوات
summary: مرجع CLI للأمر `openclaw logs` (متابعة سجلات Gateway عبر RPC)
title: السجلات
x-i18n:
    generated_at: "2026-07-12T05:42:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c54d7dd7ec46a0ea71cfee0fbe24abf43a3f1207eba3717b40862fb27ed6c9cd
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

اعرض مباشرةً سجلات ملفات Gateway عبر RPC. يعمل في الوضع البعيد.

## الخيارات

- `--limit <n>`: الحد الأقصى لأسطر السجل المُعادة (الافتراضي `200`)
- `--max-bytes <n>`: الحد الأقصى للبايتات المقروءة من ملف السجل (الافتراضي `250000`)
- `--follow`: تابع تدفق السجل
- `--interval <ms>`: فاصل الاستقصاء أثناء المتابعة (الافتراضي `1000`)
- `--json`: أخرج أحداث JSON مفصولة حسب الأسطر
- `--plain`: إخراج نص عادي من دون تنسيق منمّق
- `--no-color`: عطّل ألوان ANSI
- `--local-time`: اعرض الطوابع الزمنية وفق منطقتك الزمنية المحلية (الافتراضي)
- `--utc`: اعرض الطوابع الزمنية وفق UTC

## خيارات RPC المشتركة لـ Gateway

- `--url <url>`: عنوان URL لاتصال WebSocket الخاص بـ Gateway
- `--token <token>`: رمز Gateway
- `--timeout <ms>`: المهلة بالمللي ثانية (الافتراضي `30000`)
- `--expect-final`: انتظر استجابة نهائية عندما يكون استدعاء Gateway مدعومًا بوكيل

يؤدي تمرير `--url` إلى تخطي بيانات الاعتماد المطبقة تلقائيًا من الإعدادات؛ ضمّن `--token` صراحةً إذا كان Gateway المستهدف يتطلب مصادقة.

## أمثلة

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## سلوك الرجوع والاسترداد

- إذا طلب Gateway الضمني عبر local loopback الاقتران، أو أُغلق أثناء الاتصال، أو انتهت مهلته قبل استجابة `logs.tail`، يرجع `openclaw logs` تلقائيًا إلى سجل ملف Gateway المُعدّ. لا تستخدم أهداف `--url` الصريحة هذا الرجوع مطلقًا.
- لا يرجع `--follow` إلى ذلك الملف المُعدّ بعد فشل RPC ضمني في Gateway المحلي، إذ قد يكون الملف المتقادم الموجود بجانبه مضللًا عند المتابعة المباشرة. وبدلًا من ذلك، يستخدم على Linux سجل Gateway النشط في systemd الخاص بالمستخدم وفق معرّف العملية PID عند توفره (ويطبع المصدر المحدد)؛ وإلا يواصل إعادة محاولة الاتصال بـ Gateway المباشر.
- أثناء `--follow`، تؤدي حالات انقطاع الاتصال العابرة (إغلاق WebSocket، أو انتهاء المهلة، أو سقوط الاتصال) إلى إعادة الاتصال تلقائيًا مع تراجع أُسّي: حتى 8 محاولات، وبحد أقصى قدره 30 ثانية بين المحاولات. يُطبع تحذير إلى stderr عند كل إعادة محاولة، ويُطبع إشعار `[logs] gateway reconnected` مرة واحدة عند نجاح الاستقصاء. في وضع `--json`، يُخرَج كلاهما كسجلات `{"type":"notice"}` إلى stderr. وتظل الأخطاء غير القابلة للاسترداد (فشل المصادقة أو الإعداد غير الصحيح) تؤدي إلى الخروج فورًا.
- في وضع `--follow --json`، تُخرَج انتقالات مصدر السجل كسجلات `{"type":"meta"}`. تتبّع المؤشرات لكل `sourceKind`: يمكن أن ينتقل التدفق من إخراج ملف Gateway ‏(`sourceKind: "file"`) إلى الرجوع إلى السجل المحلي (`sourceKind: "journal"`، و`localFallback: true`، مع `service.pid`/`service.unit`) ثم يعود إلى إخراج ملف Gateway بعد الاسترداد. لا تفترض وجود مصدر أو مؤشر ثابت واحد للجلسة بأكملها، وتقبّل تداخل الأسطر عندما يعيد الاسترداد تشغيل مؤشر ملف Gateway.

## ذو صلة

- [نظرة عامة على التسجيل](/ar/logging)
- [CLI الخاص بـ Gateway](/ar/cli/gateway)
- [مرجع CLI](/ar/cli)
- [تسجيل Gateway](/ar/gateway/logging)
