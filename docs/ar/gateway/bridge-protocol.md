---
read_when:
    - بناء عملاء العقد أو تصحيح أخطائهم (وضع عقدة iOS/Android/macOS)
    - التحقيق في إخفاقات مصادقة الاقتران أو الجسر
    - تدقيق واجهة العُقدة التي يكشفها Gateway
summary: 'بروتوكول الجسر التاريخي (العُقَد القديمة): TCP JSONL، الاقتران، RPC محدود النطاق'
title: بروتوكول الجسر
x-i18n:
    generated_at: "2026-06-27T17:34:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 485d18f94b731018c6e0df493068b0b6aceff9afba6bebf1350db63c04cee98c
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
تمت **إزالة** جسر TCP. لا تشحن إصدارات OpenClaw الحالية مستمع الجسر، ولم تعد مفاتيح إعدادات `bridge.*` موجودة في المخطط. تُحفظ هذه الصفحة للمرجع التاريخي فقط. استخدم [بروتوكول Gateway](/ar/gateway/protocol) لكل عملاء العقد/المشغّلين.
</Warning>

## لماذا كان موجودًا

- **حدّ الأمان**: يعرّض الجسر قائمة سماح صغيرة بدلًا من
  كامل سطح واجهة API الخاص بـ Gateway.
- **الإقران + هوية العقدة**: قبول العقدة يملكه Gateway ويرتبط
  برمز مميّز لكل عقدة.
- **تجربة الاكتشاف**: يمكن للعقد اكتشاف Gateways عبر Bonjour على شبكة LAN، أو الاتصال
  مباشرة عبر tailnet.
- **حلقة WS المحلية**: يبقى مستوى التحكم الكامل عبر WS محليًا ما لم يُنقل عبر SSH.

## النقل

- TCP، كائن JSON واحد لكل سطر (JSONL).
- TLS اختياري (عندما تكون `bridge.tls.enabled` تساوي true).
- كان منفذ المستمع الافتراضي تاريخيًا هو `18790` (الإصدارات الحالية لا تبدأ
  جسر TCP).

عند تفعيل TLS، تتضمن سجلات TXT الخاصة بالاكتشاف `bridgeTls=1` بالإضافة إلى
`bridgeTlsSha256` كتلميح غير سري. لاحظ أن سجلات Bonjour/mDNS TXT
غير موثّقة؛ يجب ألا يعامل العملاء البصمة المُعلن عنها كتثبيت
موثوق إلا بقصد صريح من المستخدم أو تحقق آخر خارج النطاق.

## المصافحة + الإقران

1. يرسل العميل `hello` مع بيانات تعريف العقدة + الرمز المميّز (إذا كان مقترنًا بالفعل).
2. إذا لم يكن مقترنًا، يرد Gateway بـ `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. يرسل العميل `pair-request`.
4. ينتظر Gateway الموافقة، ثم يرسل `pair-ok` و `hello-ok`.

تاريخيًا، كانت `hello-ok` تعيد `serverName`؛ أما أسطح Plugin المستضافة فتُعلن الآن
عبر `pluginSurfaceUrls`. يستخدم Canvas/A2UI
`pluginSurfaceUrls.canvas`؛ والاسم البديل المهجور `canvasHostUrl` ليس جزءًا من
البروتوكول المعاد هيكلته.

## الإطارات

العميل → Gateway:

- `req` / `res`: استدعاء RPC محدود النطاق لـ Gateway (chat, sessions, config, health, voicewake, skills.bins)
- `event`: إشارات العقدة (نص صوتي، طلب وكيل، اشتراك دردشة، دورة حياة exec)

Gateway → العميل:

- `invoke` / `invoke-res`: أوامر العقدة (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: تحديثات الدردشة للجلسات المشترَك بها
- `ping` / `pong`: إبقاء الاتصال حيًا

كان فرض قائمة السماح القديمة موجودًا في `src/gateway/server-bridge.ts` (أُزيل).

## أحداث دورة حياة exec

يمكن للعقد إصدار أحداث `exec.finished` لإظهار نشاط `system.run` المكتمل.
تُعيَّن هذه إلى أحداث النظام في Gateway. (قد تظل العقد القديمة تصدر `exec.started`.)
قد تصدر العقد `exec.denied` لمحاولات `system.run` المرفوضة؛ يقبل Gateway
الحدث كرفض نهائي ولا يضيف حدث نظام إلى الطابور ولا يوقظ عمل الوكيل.

حقول الحمولة (كلها اختيارية ما لم يُذكر خلاف ذلك):

- `sessionKey` (مطلوب): جلسة الوكيل لربط الأحداث، ولتسليم حدث النظام في
  `exec.finished`.
- `runId`: معرّف exec فريد للتجميع.
- `command`: سلسلة الأمر الخام أو المنسقة.
- `exitCode`, `timedOut`, `success`, `output`: تفاصيل الإكمال (للمكتمل فقط).
- `reason`: سبب الرفض (للمرفوض فقط).

## استخدام tailnet التاريخي

- اربط الجسر بعنوان IP على tailnet: `bridge.bind: "tailnet"` في
  `~/.openclaw/openclaw.json` (تاريخيًا فقط؛ لم يعد `bridge.*` صالحًا).
- يتصل العملاء عبر اسم MagicDNS أو عنوان IP على tailnet.
- لا يعبر Bonjour الشبكات؛ استخدم المضيف/المنفذ اليدوي أو DNS-SD واسع النطاق
  عند الحاجة.

## الإصدارات

كان الجسر **v1 ضمنيًا** (بدون تفاوض حد أدنى/حد أقصى). هذا القسم
مرجع تاريخي فقط؛ يستخدم عملاء العقد/المشغّلين الحاليون بروتوكول WebSocket
[Gateway](/ar/gateway/protocol).

## ذات صلة

- [بروتوكول Gateway](/ar/gateway/protocol)
- [العقد](/ar/nodes)
