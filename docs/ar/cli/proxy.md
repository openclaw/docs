---
read_when:
    - تحتاج إلى التحقق من صحة توجيه الوكيل المُدار بواسطة المشغّل قبل النشر
    - تحتاج إلى التقاط حركة نقل OpenClaw محليًا لأغراض التصحيح
    - تريد فحص جلسات وكيل التصحيح، أو الكائنات الثنائية الكبيرة، أو الإعدادات المسبقة المضمّنة للاستعلامات.
summary: مرجع CLI لـ `openclaw proxy`، بما في ذلك التحقق من الوكيل المُدار من المشغّل ومفتّش التقاط وكيل التصحيح المحلي
title: الوكيل
x-i18n:
    generated_at: "2026-06-27T17:24:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c3883373f2aa6d365ed93bcb9f7da2bb9281b8bd061d1842bc5bef0f43b7ccb9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

تحقّق من صحة توجيه الوكيل المُدار بواسطة المشغّل، أو شغّل وكيل التصحيح المحلي الصريح
وافحص حركة المرور الملتقطة.

استخدم `validate` لإجراء فحص تمهيدي لوكيل تمرير مُدار بواسطة المشغّل قبل تفعيل
توجيه وكيل OpenClaw. الأوامر الأخرى هي أدوات تصحيح للتحقيق على مستوى النقل:
يمكنها بدء وكيل محلي، وتشغيل أمر فرعي مع تفعيل الالتقاط، وسرد جلسات الالتقاط،
والاستعلام عن أنماط حركة المرور الشائعة، وقراءة الكتل الثنائية الملتقطة، ومسح بيانات الالتقاط المحلية.

## الأوامر

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## التحقّق

يتحقق `openclaw proxy validate` من عنوان URL الفعّال للوكيل المُدار بواسطة المشغّل من
`--proxy-url` أو الإعدادات أو `OPENCLAW_PROXY_URL`. يمكن لعناوين URL الخاصة بالوكيل المُدار استخدام
`http://` لمستمع وكيل تمرير عادي، أو `https://` عندما يجب على OpenClaw
فتح TLS إلى نقطة نهاية الوكيل قبل إرسال طلبات الوكيل. يبلّغ عن مشكلة في
الإعدادات عند عدم تفعيل أي وكيل أو تكوينه؛ استخدم `--proxy-url` لإجراء
فحص تمهيدي لمرة واحدة قبل تغيير الإعدادات. أضف `--proxy-ca-file` للوثوق بسلطة شهادات
خاصة لاتصال TLS بنقطة نهاية وكيل HTTPS. افتراضياً، يتحقق من أن وجهة عامة تنجح عبر الوكيل وأن الوكيل
لا يستطيع الوصول إلى مؤشر حلقة رجوع مؤقت. الوجهات المرفوضة المخصصة
تفشل بالإغلاق الآمن: تفشل استجابات HTTP وإخفاقات النقل الملتبسة معاً ما لم
تتمكن من التحقق بشكل منفصل من إشارة رفض خاصة بالنشر. أضف
`--apns-reachable` لفتح نفق APNs HTTP/2 CONNECT أيضاً عبر الوكيل
وتأكيد أن APNs التجريبي يستجيب؛ يستخدم الفحص رمز موفّر غير صالح عمداً،
لذلك تُعد استجابة APNs `403 InvalidProviderToken` إشارة نجاح لقابلية الوصول.

الخيارات:

- `--json`: اطبع JSON قابلاً للقراءة آلياً.
- `--proxy-url <url>`: تحقّق من عنوان URL للوكيل `http://` أو `https://` هذا بدلاً من الإعدادات أو متغيرات البيئة.
- `--proxy-ca-file <path>`: ثق بملف CA بصيغة PEM هذا للتحقق من TLS لنقطة نهاية وكيل HTTPS.
- `--allowed-url <url>`: أضف وجهة يُتوقع أن تنجح عبر الوكيل. كررها للتحقق من وجهات متعددة.
- `--denied-url <url>`: أضف وجهة يُتوقع أن يحظرها الوكيل. كررها للتحقق من وجهات متعددة.
- `--apns-reachable`: تحقّق أيضاً من أن APNs HTTP/2 التجريبي قابل للوصول عبر الوكيل.
- `--apns-authority <url>`: سلطة APNs المطلوب فحصها مع `--apns-reachable` (`https://api.sandbox.push.apple.com` افتراضياً؛ والإنتاج هو `https://api.push.apple.com`).
- `--timeout-ms <ms>`: مهلة كل طلب بالمللي ثانية.

راجع [وكيل الشبكة](/ar/security/network-proxy) للحصول على إرشادات النشر ودلالات الرفض.

## إعدادات الاستعلام المسبقة

يقبل `openclaw proxy query --preset <name>` ما يلي:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## ملاحظات

- يستخدم `start` افتراضياً `127.0.0.1` ما لم يتم ضبط `--host`.
- يبدأ `run` وكيلاً محلياً للتصحيح ثم يشغّل الأمر بعد `--`.
- يفتح التمرير المباشر إلى المصدر العلوي في وكيل التصحيح مقابس علوية للتشخيص. عندما يكون وضع الوكيل المُدار في OpenClaw نشطاً، يكون التمرير المباشر لطلبات الوكيل وأنفاق CONNECT معطلاً افتراضياً؛ اضبط `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` فقط للتشخيصات المحلية المعتمدة.
- يخرج `validate` بالرمز 1 عند فشل إعدادات الوكيل أو فحوصات الوجهة.
- الالتقاطات هي بيانات تصحيح محلية؛ استخدم `openclaw proxy purge` عند الانتهاء.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [وكيل الشبكة](/ar/security/network-proxy)
- [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth)
