---
read_when:
    - أنت تستخدم الرسائل المباشرة في وضع الاقتران وتحتاج إلى الموافقة على المُرسِلين
summary: مرجع CLI للأمر `openclaw pairing` (الموافقة على طلبات الاقتران/عرضها)
title: الإقران
x-i18n:
    generated_at: "2026-07-12T05:43:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca83ad9d9e55cfffd49301cb529b28df370c2dcff03484880f7cfc85ec2d6440
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

وافق على طلبات إقران الرسائل المباشرة أو افحصها للقنوات التي تدعم الإقران (الرسائل المباشرة في الدردشة فقط؛ يستخدم إقران Node/الجهاز الأمر `openclaw devices`).

ذو صلة: [تدفق الإقران](/ar/channels/pairing)

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

يسرد طلبات الإقران المعلّقة لقناة واحدة.

| الخيار                  | الوصف                                  |
| ----------------------- | -------------------------------------- |
| `[channel]`             | معرّف القناة كمُعامل موضعي             |
| `--channel <channel>`   | معرّف القناة الصريح                    |
| `--account <accountId>` | معرّف الحساب للقنوات متعددة الحسابات   |
| `--json`                | مخرجات قابلة للقراءة آليًا             |

إذا ضُبطت عدة قنوات تدعم الإقران، فمرّر قناة كمُعامل موضعي أو باستخدام `--channel`. تعمل قنوات الامتدادات ما دام معرّف القناة صالحًا.

## `pairing approve`

وافق على رمز إقران معلّق واسمح لذلك المُرسِل.

الاستخدام:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` عندما تكون هناك قناة واحدة فقط تدعم الإقران مضبوطة

الخيارات: `--channel <channel>`، و`--account <accountId>`، و`--notify` (يرسل تأكيدًا إلى مقدّم الطلب عبر القناة نفسها).

### التهيئة الأولية للمالك

إذا كان `commands.ownerAllowFrom` فارغًا عند الموافقة على رمز إقران، فسيسجّل OpenClaw أيضًا المُرسِل الموافق عليه بصفته مالك الأوامر، باستخدام إدخال مقيّد بنطاق القناة مثل `telegram:123456789`. لا يؤدي هذا إلا إلى التهيئة الأولية للمالك الأول؛ ولا تستبدل الموافقات اللاحقة على الإقران قيمة `commands.ownerAllowFrom` أو توسّعها أبدًا.

مالك الأوامر هو حساب المشغّل البشري المسموح له بتشغيل الأوامر المخصصة للمالك فقط والموافقة على الإجراءات الخطرة، مثل `/diagnostics` و`/export-trajectory` و`/config` والموافقات على التنفيذ. لا يتيح الإقران سوى أن يتحدث المُرسِل إلى الوكيل؛ ولا يمنحه في حد ذاته صلاحيات المالك بخلاف هذه التهيئة الأولية التي تُجرى مرة واحدة.

إذا وافقت على مُرسِل قبل استحداث هذه التهيئة الأولية، فشغّل `openclaw doctor`؛ إذ يحذّرك عند عدم ضبط مالك للأوامر ويعرض الأمر الدقيق `openclaw config set commands.ownerAllowFrom ...` لإصلاح ذلك.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [إقران القنوات](/ar/channels/pairing)
