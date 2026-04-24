---
read_when:
    - أنت تستخدم الرسائل الخاصة في وضع الاقتران وتحتاج إلى الموافقة على المرسلين
summary: مرجع CLI لـ `openclaw pairing` (approve/list طلبات الاقتران)
title: الاقتران
x-i18n:
    generated_at: "2026-04-24T07:35:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e81dc407138e958e41d565b0addb600ad1ba5187627bb219f0b85b92bd112d1
    source_path: cli/pairing.md
    workflow: 15
---

# `openclaw pairing`

الموافقة على طلبات اقتران الرسائل الخاصة أو فحصها (للقنوات التي تدعم الاقتران).

ذو صلة:

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

سرد طلبات الاقتران المعلقة لقناة واحدة.

الخيارات:

- `[channel]`: معرّف القناة الموضعي
- `--channel <channel>`: معرّف القناة بشكل صريح
- `--account <accountId>`: معرّف الحساب للقنوات متعددة الحسابات
- `--json`: خرج قابل للقراءة آليًا

ملاحظات:

- إذا كانت هناك عدة قنوات معدّة تدعم الاقتران، فيجب عليك تقديم قناة إما موضعيًا أو باستخدام `--channel`.
- القنوات الامتدادية مسموح بها ما دام معرّف القناة صالحًا.

## `pairing approve`

الموافقة على رمز اقتران معلق والسماح لذلك المرسل.

الاستخدام:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` عندما تكون هناك قناة واحدة فقط معدّة تدعم الاقتران

الخيارات:

- `--channel <channel>`: معرّف القناة بشكل صريح
- `--account <accountId>`: معرّف الحساب للقنوات متعددة الحسابات
- `--notify`: إرسال تأكيد إلى مقدم الطلب على القناة نفسها

## ملاحظات

- إدخال القناة: مرّرها موضعيًا (`pairing list telegram`) أو باستخدام `--channel <channel>`.
- يدعم `pairing list` الخيار `--account <accountId>` للقنوات متعددة الحسابات.
- يدعم `pairing approve` الخيارين `--account <accountId>` و`--notify`.
- إذا كانت هناك قناة واحدة فقط معدّة تدعم الاقتران، فيُسمح باستخدام `pairing approve <code>`.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [اقتران القنوات](/ar/channels/pairing)
