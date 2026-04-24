---
read_when:
    - إنشاء أو تصحيح أخطاء عملاء Node ‏(وضع Node على iOS/Android/macOS)
    - التحقيق في أعطال الاقتران أو مصادقة الجسر
    - تدقيق سطح Node الذي يكشفه gateway
summary: 'بروتوكول الجسر التاريخي (Nodes القديمة): TCP JSONL، والاقتران، وRPC محدود النطاق'
title: بروتوكول الجسر
x-i18n:
    generated_at: "2026-04-24T07:40:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b2a54f439e586ea7e535cedae4a07c365f95702835b05ba5a779d590dcf967e
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

# بروتوكول الجسر (نقل Node القديم)

<Warning>
تمت **إزالة** جسر TCP. لا تشحن إصدارات OpenClaw الحالية مستمع الجسر، ولم تعد مفاتيح إعداد `bridge.*` موجودة في المخطط. تم الاحتفاظ بهذه الصفحة كمرجع تاريخي فقط. استخدم [بروتوكول Gateway](/ar/gateway/protocol) لجميع عملاء node/operator.
</Warning>

## لماذا كان موجودًا

- **حد أمني**: يكشف الجسر قائمة سماح صغيرة بدلًا من
  سطح API الكامل الخاص بـ gateway.
- **الاقتران + هوية Node**: يملك gateway قبول Node ويكون ذلك مرتبطًا
  برمز مميز لكل Node.
- **تجربة الاكتشاف**: يمكن لـ Nodes اكتشاف Gateways عبر Bonjour على LAN، أو الاتصال
  مباشرة عبر tailnet.
- **Loopback WS**: تظل طبقة التحكم الكاملة عبر WS محلية ما لم يتم تمريرها عبر SSH.

## النقل

- TCP، كائن JSON واحد في كل سطر (JSONL).
- TLS اختياري (عندما تكون `bridge.tls.enabled` تساوي true).
- كان منفذ المستمع الافتراضي تاريخيًا هو `18790` ‏(لكن الإصدارات الحالية لا تبدأ
  جسر TCP).

عند تمكين TLS، تتضمن سجلات TXT الخاصة بالاكتشاف `bridgeTls=1` بالإضافة إلى
`bridgeTlsSha256` كتلميح غير سري. لاحظ أن سجلات Bonjour/mDNS TXT غير
موثقة؛ ويجب ألا يعامل العملاء البصمة المُعلن عنها على أنها تثبيت موثوق
من دون قصد صريح من المستخدم أو تحقق آخر خارج النطاق.

## المصافحة + الاقتران

1. يرسل العميل `hello` مع بيانات Node الوصفية + الرمز المميز (إذا كان مقترنًا بالفعل).
2. إذا لم يكن مقترنًا، يرد gateway بـ `error` ‏(`NOT_PAIRED`/`UNAUTHORIZED`).
3. يرسل العميل `pair-request`.
4. ينتظر gateway الموافقة، ثم يرسل `pair-ok` و`hello-ok`.

تاريخيًا، كانت `hello-ok` تعيد `serverName` وكان يمكن أن تتضمن
`canvasHostUrl`.

## الإطارات

العميل → Gateway:

- `req` / `res`: ‏RPC محدود النطاق لـ gateway ‏(chat، sessions، config، health، voicewake، skills.bins)
- `event`: إشارات Node ‏(نص صوتي، طلب وكيل، اشتراك دردشة، دورة حياة exec)

Gateway → العميل:

- `invoke` / `invoke-res`: أوامر Node ‏(`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: تحديثات الدردشة للجلسات المشتركة
- `ping` / `pong`: إبقاء الاتصال حيًا

كان تطبيق قائمة السماح القديمة موجودًا في `src/gateway/server-bridge.ts` ‏(وقد أزيل).

## أحداث دورة حياة Exec

يمكن لـ Nodes إصدار أحداث `exec.finished` أو `exec.denied` لإظهار نشاط system.run.
ويتم ربطها بأحداث نظام في gateway. ‏(قد تستمر Nodes القديمة في إصدار `exec.started`.)

حقول الحمولة (جميعها اختيارية ما لم يُذكر خلاف ذلك):

- `sessionKey` ‏(مطلوب): جلسة الوكيل التي ستتلقى حدث النظام.
- `runId`: معرّف exec فريد لأغراض التجميع.
- `command`: سلسلة الأمر الخام أو المنسقة.
- `exitCode`, `timedOut`, `success`, `output`: تفاصيل الإكمال (في finished فقط).
- `reason`: سبب الرفض (في denied فقط).

## الاستخدام التاريخي لـ tailnet

- اربط الجسر بعنوان tailnet IP: ‏`bridge.bind: "tailnet"` في
  `~/.openclaw/openclaw.json` ‏(لأغراض تاريخية فقط؛ لم تعد `bridge.*` صالحة).
- يتصل العملاء عبر اسم MagicDNS أو عنوان tailnet IP.
- لا يعبر Bonjour الشبكات **بينها**؛ استخدم host/port يدويًا أو DNS‑SD على نطاق واسع
  عند الحاجة.

## الإصدار

كان الجسر **v1 ضمنيًا** ‏(من دون تفاوض min/max). هذا القسم
مرجع تاريخي فقط؛ إذ يستخدم عملاء node/operator الحاليون بروتوكول WebSocket
[Gateway Protocol](/ar/gateway/protocol).

## ذو صلة

- [بروتوكول Gateway](/ar/gateway/protocol)
- [Nodes](/ar/nodes)
