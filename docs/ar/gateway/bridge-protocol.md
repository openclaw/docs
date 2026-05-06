---
read_when:
    - بناء عملاء Node أو تصحيح أخطائهم (وضع Node على iOS/Android/macOS)
    - التحقيق في حالات فشل الاقتران أو مصادقة الجسر
    - تدقيق سطح Node الذي يعرّضه Gateway
summary: 'بروتوكول الجسر التاريخي (العُقد القديمة): TCP JSONL، الاقتران، RPC محدود النطاق'
title: بروتوكول الجسر
x-i18n:
    generated_at: "2026-05-06T17:56:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84c4b5c344d880d4283eebd8596e8b5b0aad5cae747694784011deb1547db30
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
تمت **إزالة** جسر TCP. لا تتضمن إصدارات OpenClaw الحالية مستمع الجسر، ولم تعد مفاتيح إعدادات `bridge.*` موجودة في المخطط. تُبقى هذه الصفحة كمرجع تاريخي فقط. استخدم [بروتوكول Gateway](/ar/gateway/protocol) لكل عملاء Node/المشغّل.
</Warning>

## لماذا وُجد

- **حدّ أمني**: يعرّض الجسر قائمة سماح صغيرة بدلاً من
  كامل سطح API الخاص بـ Gateway.
- **الاقتران + هوية Node**: قبول Node مملوك لـ Gateway ومرتبط
  برمز مميز لكل Node.
- **تجربة اكتشاف**: تستطيع Nodes اكتشاف Gateways عبر Bonjour على LAN، أو الاتصال
  مباشرة عبر tailnet.
- **حلقة WS الراجعة**: تظل طبقة التحكم الكاملة عبر WS محلية ما لم تُمرر عبر SSH.

## النقل

- TCP، كائن JSON واحد لكل سطر (JSONL).
- TLS اختياري (عندما تكون `bridge.tls.enabled` true).
- كان منفذ المستمع الافتراضي التاريخي `18790` (الإصدارات الحالية لا تبدأ
  جسر TCP).

عند تفعيل TLS، تتضمن سجلات TXT للاكتشاف `bridgeTls=1` بالإضافة إلى
`bridgeTlsSha256` كتلميح غير سري. لاحظ أن سجلات TXT الخاصة بـ Bonjour/mDNS
غير موثّقة؛ يجب ألا يتعامل العملاء مع البصمة المعلنة كتثبيت موثوق
إلا بقصد صريح من المستخدم أو تحقق آخر خارج النطاق.

## المصافحة + الاقتران

1. يرسل العميل `hello` مع بيانات Node الوصفية + الرمز المميز (إذا كان مقترناً بالفعل).
2. إذا لم يكن مقترناً، يرد Gateway بـ `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. يرسل العميل `pair-request`.
4. ينتظر Gateway الموافقة، ثم يرسل `pair-ok` و`hello-ok`.

تاريخياً، كان `hello-ok` يعيد `serverName` ويمكن أن يتضمن
`canvasHostUrl`.

## الإطارات

العميل → Gateway:

- `req` / `res`: RPC محدود النطاق لـ Gateway (الدردشة، الجلسات، الإعدادات، الصحة، voicewake، skills.bins)
- `event`: إشارات Node (تفريغ صوتي، طلب وكيل، اشتراك دردشة، دورة حياة exec)

Gateway → العميل:

- `invoke` / `invoke-res`: أوامر Node (`canvas.*`، `camera.*`، `screen.record`،
  `location.get`، `sms.send`)
- `event`: تحديثات الدردشة للجلسات المشترَك بها
- `ping` / `pong`: إبقاء الاتصال حياً

كان فرض قائمة السماح القديم موجوداً في `src/gateway/server-bridge.ts` (أُزيل).

## أحداث دورة حياة Exec

يمكن لـ Nodes إصدار أحداث `exec.finished` أو `exec.denied` لإظهار نشاط system.run.
تُحوّل هذه إلى أحداث نظام في Gateway. (قد تظل Nodes القديمة تصدر `exec.started`.)

حقول الحمولة (كلها اختيارية ما لم يُذكر خلاف ذلك):

- `sessionKey` (مطلوب): جلسة الوكيل التي ستتلقى حدث النظام.
- `runId`: معرّف exec فريد للتجميع.
- `command`: سلسلة الأمر الخام أو المنسّقة.
- `exitCode`، `timedOut`، `success`، `output`: تفاصيل الإكمال (finished فقط).
- `reason`: سبب الرفض (denied فقط).

## استخدام tailnet التاريخي

- اربط الجسر بعنوان IP في tailnet: `bridge.bind: "tailnet"` في
  `~/.openclaw/openclaw.json` (تاريخي فقط؛ لم يعد `bridge.*` صالحاً).
- يتصل العملاء عبر اسم MagicDNS أو عنوان IP في tailnet.
- لا يعبر Bonjour الشبكات؛ استخدم المضيف/المنفذ اليدوي أو DNS-SD واسع النطاق
  عند الحاجة.

## تحديد الإصدارات

كان الجسر **v1 ضمنياً** (لا تفاوض على الحد الأدنى/الأقصى). هذا القسم
مرجع تاريخي فقط؛ يستخدم عملاء Node/المشغّل الحاليون WebSocket
[بروتوكول Gateway](/ar/gateway/protocol).

## ذو صلة

- [بروتوكول Gateway](/ar/gateway/protocol)
- [Nodes](/ar/nodes)
