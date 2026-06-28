---
read_when:
    - أنت تستخدم الرسائل المباشرة في وضع الاقتران وتحتاج إلى الموافقة على المرسلين
summary: مرجع CLI لـ `openclaw pairing` (الموافقة على طلبات الاقتران/عرضها)
title: الاقتران
x-i18n:
    generated_at: "2026-05-06T17:54:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 022018239ab1134b18986be42b8e019f412a1a730a9671f422979909c4a31dc5
    source_path: cli/pairing.md
    workflow: 16
    postprocess_version: locale-links-v1
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

اعرض طلبات الاقتران المعلّقة لقناة واحدة.

الخيارات:

- `[channel]`: معرّف القناة الموضعي
- `--channel <channel>`: معرّف قناة صريح
- `--account <accountId>`: معرّف الحساب للقنوات متعددة الحسابات
- `--json`: مخرجات قابلة للقراءة آليًا

ملاحظات:

- إذا كانت هناك عدة قنوات قادرة على الاقتران مهيأة، فيجب توفير قناة إما موضعيًا أو باستخدام `--channel`.
- يُسمح بقنوات الإضافات ما دام معرّف القناة صالحًا.

## `pairing approve`

وافق على رمز اقتران معلّق واسمح لذلك المرسِل.

الاستخدام:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` عندما تكون هناك قناة واحدة فقط قادرة على الاقتران مهيأة

الخيارات:

- `--channel <channel>`: معرّف قناة صريح
- `--account <accountId>`: معرّف الحساب للقنوات متعددة الحسابات
- `--notify`: أرسل تأكيدًا إلى الطالب على القناة نفسها

تهيئة المالك الأولية:

- إذا كان `commands.ownerAllowFrom` فارغًا عند موافقتك على رمز اقتران، فإن OpenClaw يسجل أيضًا المرسِل الموافق عليه كمالك للأوامر، باستخدام إدخال محدود النطاق بالقناة مثل `telegram:123456789`.
- يؤدي هذا فقط إلى تهيئة المالك الأول. لا تستبدل موافقات الاقتران اللاحقة `commands.ownerAllowFrom` ولا توسّعه.
- مالك الأوامر هو حساب المشغّل البشري المسموح له بتشغيل الأوامر المقتصرة على المالك والموافقة على الإجراءات الخطرة مثل `/diagnostics` و`/export-trajectory` و`/config` وموافقات التنفيذ.

## ملاحظات

- إدخال القناة: مرّره موضعيًا (`pairing list telegram`) أو باستخدام `--channel <channel>`.
- يدعم `pairing list` الخيار `--account <accountId>` للقنوات متعددة الحسابات.
- يدعم `pairing approve` الخيارين `--account <accountId>` و`--notify`.
- إذا كانت هناك قناة واحدة فقط قادرة على الاقتران مهيأة، فيُسمح باستخدام `pairing approve <code>`.
- إذا وافقت على مرسِل قبل وجود هذه التهيئة الأولية، فشغّل `openclaw doctor`؛ إذ يحذّر عند عدم تهيئة مالك أوامر ويعرض الأمر `openclaw config set commands.ownerAllowFrom ...` لإصلاح ذلك.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [اقتران القنوات](/ar/channels/pairing)
