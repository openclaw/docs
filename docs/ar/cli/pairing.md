---
read_when:
    - أنت تستخدم الرسائل المباشرة في وضع الاقتران وتحتاج إلى الموافقة على المرسلين
summary: مرجع CLI لـ `openclaw pairing` (الموافقة على طلبات الاقتران/عرضها)
title: الاقتران
x-i18n:
    generated_at: "2026-07-16T13:39:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 740459efe4d0fa2e9fa04a20b944592fed3dc9a22211658e1418c1e49a736997
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

وافِق على طلبات إقران الرسائل المباشرة أو افحصها للقنوات التي تدعم الإقران (الرسائل المباشرة في الدردشة فقط - يستخدم إقران Node/الجهاز `openclaw devices`).

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

اعرض طلبات الإقران المعلّقة لقناة واحدة.

| الخيار                  | الوصف                           |
| ----------------------- | ------------------------------------- |
| `[channel]`             | معرّف القناة الموضعي                 |
| `--channel <channel>`   | معرّف القناة الصريح                   |
| `--account <accountId>` | معرّف الحساب للقنوات متعددة الحسابات |
| `--json`                | مخرجات قابلة للقراءة آليًا               |

إذا جرى تكوين عدة قنوات تدعم الإقران، فمرّر قناة كوسيط موضعي أو باستخدام `--channel`. تعمل قنوات الامتداد ما دام معرّف القناة صالحًا.

## `pairing approve`

وافِق على رمز إقران معلّق واسمح لذلك المرسِل.

الاستخدام:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` عندما تكون هناك قناة واحدة بالضبط تدعم الإقران ومُهيّأة

الخيارات: `--channel <channel>`، `--account <accountId>`، `--notify` (إرسال تأكيد إلى مقدّم الطلب عبر القناة نفسها).

### التهيئة الأولية للمالك

إذا كان `commands.ownerAllowFrom` فارغًا عند الموافقة على رمز إقران، فسيسجّل OpenClaw أيضًا المرسِل الموافق عليه بوصفه مالك الأوامر، باستخدام إدخال مقيّد بنطاق القناة مثل `telegram:123456789`. لا يؤدي هذا إلا إلى التهيئة الأولية للمالك الأول - ولا تستبدل موافقات الإقران اللاحقة `commands.ownerAllowFrom` أو توسّعه أبدًا.

مالك الأوامر هو حساب المشغّل البشري المسموح له بتشغيل الأوامر المخصّصة للمالك فقط والموافقة على الإجراءات الخطرة مثل `/diagnostics`، و`/export-session`، و`/export-trajectory`، و`/config`، والموافقات على التنفيذ. لا يتيح الإقران للمرسِل سوى التحدث إلى الوكيل؛ ولا يمنحه في حد ذاته امتيازات المالك بخلاف هذه التهيئة الأولية التي تحدث مرة واحدة.

إذا وافقت على مرسِل قبل وجود هذه التهيئة الأولية، فشغّل `openclaw doctor`؛ إذ يحذّر عند عدم تكوين مالك للأوامر ويعرض أمر `openclaw config set commands.ownerAllowFrom ...` الدقيق لإصلاح ذلك.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [إقران القنوات](/ar/channels/pairing)
