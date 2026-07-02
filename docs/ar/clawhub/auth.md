---
read_when:
    - تسجيل الدخول إلى ClawHub
    - استخدام CLI الخاص بـ ClawHub
    - استكشاف أخطاء 401 وإصلاحها
summary: تسجيل الدخول إلى ClawHub، ورموز API، وتسجيل الدخول عبر CLI، وتخزين الرموز، والإبطال.
x-i18n:
    generated_at: "2026-07-02T17:37:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# المصادقة

يستخدم ClawHub GitHub لتسجيل الدخول عبر الويب. تستخدم CLI رموز API الخاصة بـ ClawHub التي تُنشأ
من خلال ذلك الحساب الذي تم تسجيل الدخول إليه.

## تسجيل الدخول عبر الويب

استخدم GitHub لتسجيل الدخول على [clawhub.ai](https://clawhub.ai).

لا يمكن للحسابات المحذوفة أو المحظورة أو المعطلة إكمال تسجيل الدخول العادي إلى ClawHub.
إذا أعادك تسجيل الدخول إلى حالة تسجيل الخروج، فقد لا يكون حسابك في وضع جيد.
إذا كان حسابك محظورًا أو معطلًا، فاستخدم
[نموذج الاستئناف في ClawHub](https://appeals.openclaw.ai/) إذا كنت تعتقد أن هذا
خطأ.

## تسجيل الدخول عبر CLI

يفتح تدفق تسجيل الدخول الافتراضي في CLI متصفحك:

```bash
clawhub login
clawhub whoami
```

ما يحدث:

1. تبدأ CLI خادم رد نداء مؤقتًا على `127.0.0.1`.
2. يفتح متصفحك صفحة تسجيل الدخول إلى ClawHub.
3. بعد تسجيل الدخول عبر GitHub، ينشئ ClawHub رمز API.
4. يعيد المتصفح التوجيه إلى رد النداء المحلي.
5. تخزن CLI الرمز في ملف تكوين ClawHub الخاص بك.

إذا لم يتمكن متصفحك من الوصول إلى رد النداء المحلي بسبب قواعد جدار الحماية أو VPN أو
الوكيل، فاستخدم تدفق الرمز بلا واجهة رسومية.

## تسجيل الدخول بلا واجهة رسومية

أنشئ رمزًا في واجهة ويب ClawHub، ثم مرره إلى CLI:

```bash
clawhub login --token clh_...
```

استخدم هذا التدفق للخوادم أو مهام CI أو البيئات التي تعتمد على الطرفية فقط.

بالنسبة إلى الأصداف البعيدة حيث يمكنك فتح متصفح في مكان آخر، شغّل:

```bash
clawhub login --device
```

تطبع CLI رمزًا لمرة واحدة وتنتظر بينما تفوضه على
`https://clawhub.ai/cli/device`.

## تخزين الرموز

مسارات التكوين الافتراضية:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` أو `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

تجاوز المسار باستخدام:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

اطبع الرمز المخزن لإعداد CI باستخدام:

```bash
clawhub token
```

## الإبطال

يمكنك إبطال رموز API في واجهة ويب ClawHub.

تُرجع الرموز المبطلة أو غير الصالحة أو المفقودة `401 Unauthorized`. سجّل الدخول مرة أخرى
باستخدام `clawhub login` أو قدّم رمزًا جديدًا باستخدام `clawhub login --token`.

لا يمكن للحسابات المحذوفة أو المحظورة أو المعطلة مواصلة استخدام رموز API الحالية.
إذا كان حسابك محظورًا أو معطلًا، فاستخدم
[نموذج الاستئناف في ClawHub](https://appeals.openclaw.ai/) إذا كنت تعتقد أن هذا
خطأ.
