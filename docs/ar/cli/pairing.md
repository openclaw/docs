---
read_when:
    - أنت تستخدم الرسائل المباشرة في وضع الاقتران وتحتاج إلى الموافقة على المرسلين
summary: مرجع CLI لـ `openclaw pairing` (الموافقة على طلبات الاقتران/عرضها)
title: الاقتران
x-i18n:
    generated_at: "2026-04-30T07:50:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: bffc70a8c08e298f42c8fbc2238fce06993572e72f333e87ad18dea3cf33fab5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

وافق على طلبات الاقتران عبر الرسائل المباشرة أو افحصها (للقنوات التي تدعم الاقتران).

ذات صلة:

- تدفق الاقتران: [الاقتران](/ar/channels/pairing)

## الأوامر

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

اسرد طلبات الاقتران المعلّقة لقناة واحدة.

الخيارات:

- `[channel]`: معرّف القناة الموضعي
- `--channel <channel>`: معرّف القناة الصريح
- `--account <accountId>`: معرّف الحساب للقنوات متعددة الحسابات
- `--json`: مخرجات قابلة للقراءة آليًا

ملاحظات:

- إذا كانت هناك عدة قنوات قادرة على الاقتران مهيأة، فيجب عليك توفير قناة إما موضعيًا أو باستخدام `--channel`.
- يُسمح بقنوات الامتدادات ما دام معرّف القناة صالحًا.

## `pairing approve`

وافق على رمز اقتران معلّق واسمح لذلك المرسل.

الاستخدام:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` عندما تكون قناة واحدة فقط قادرة على الاقتران مهيأة

الخيارات:

- `--channel <channel>`: معرّف القناة الصريح
- `--account <accountId>`: معرّف الحساب للقنوات متعددة الحسابات
- `--notify`: إرسال تأكيد إلى مقدم الطلب على القناة نفسها

تمهيد المالك:

- إذا كان `commands.ownerAllowFrom` فارغًا عند الموافقة على رمز اقتران، فإن OpenClaw يسجل أيضًا المرسل المعتمد بصفته مالك الأوامر، باستخدام إدخال محدد النطاق بالقناة مثل `telegram:123456789`.
- يؤدي هذا إلى تمهيد المالك الأول فقط. لا تستبدل موافقات الاقتران اللاحقة `commands.ownerAllowFrom` أو توسعها.
- مالك الأوامر هو حساب المشغّل البشري المسموح له بتشغيل أوامر المالك فقط والموافقة على الإجراءات الخطرة مثل `/diagnostics` و`/export-trajectory` و`/config` وموافقات التنفيذ.

## ملاحظات

- إدخال القناة: مرّره موضعيًا (`pairing list telegram`) أو باستخدام `--channel <channel>`.
- يدعم `pairing list` الخيار `--account <accountId>` للقنوات متعددة الحسابات.
- يدعم `pairing approve` الخيارين `--account <accountId>` و`--notify`.
- إذا كانت قناة واحدة فقط قادرة على الاقتران مهيأة، فيُسمح باستخدام `pairing approve <code>`.
- إذا وافقت على مرسل قبل وجود هذا التمهيد، فشغّل `openclaw doctor`؛ فهو يحذّر عندما لا يكون هناك مالك أوامر مهيأ ويعرض الأمر `openclaw config set commands.ownerAllowFrom ...` لإصلاح ذلك.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [اقتران القنوات](/ar/channels/pairing)
