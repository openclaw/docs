---
read_when:
    - تسجيل الدخول إلى ClawHub
    - استخدام CLI الخاص بـ ClawHub
    - استكشاف أخطاء 401 وإصلاحها
summary: تسجيل الدخول إلى ClawHub، ورموز API، وتسجيل الدخول عبر CLI، وتخزين الرموز، وإبطالها.
x-i18n:
    generated_at: "2026-07-04T20:31:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# المصادقة

يستخدم ClawHub GitHub لتسجيل الدخول عبر الويب. تستخدم CLI رموز ClawHub API المميزة التي تُنشأ
من خلال ذلك الحساب الذي سجّل دخوله.

## تسجيل الدخول عبر الويب

استخدم GitHub لتسجيل الدخول على [clawhub.ai](https://clawhub.ai).

لا يمكن للحسابات المحذوفة أو المحظورة أو المعطّلة إكمال تسجيل الدخول العادي إلى ClawHub.
إذا أعادك تسجيل الدخول إلى حالة تسجيل الخروج، فقد لا يكون حسابك في وضع
جيد. إذا كان حسابك محظورًا أو معطّلًا، فاستخدم
[نموذج استئناف ClawHub](https://appeals.openclaw.ai/) إذا كنت تعتقد أن هذا
خطأ.

## تسجيل دخول CLI

يفتح مسار تسجيل دخول CLI الافتراضي متصفحك:

```bash
clawhub login
clawhub whoami
```

ما يحدث:

1. تبدأ CLI خادم رد نداء مؤقتًا على `127.0.0.1`.
2. يفتح متصفحك صفحة تسجيل الدخول إلى ClawHub.
3. بعد تسجيل الدخول عبر GitHub، ينشئ ClawHub رمز API مميزًا.
4. يعيد المتصفح التوجيه إلى رد النداء المحلي.
5. تخزّن CLI الرمز المميز في ملف إعدادات ClawHub الخاص بك.

إذا تعذّر على متصفحك الوصول إلى رد النداء المحلي بسبب قواعد جدار الحماية أو VPN أو
الوكيل، فاستخدم مسار الرمز المميز بلا واجهة.

## تسجيل الدخول بلا واجهة

أنشئ رمزًا مميزًا في واجهة ويب ClawHub، ثم مرّره إلى CLI:

```bash
clawhub login --token clh_...
```

استخدم هذا المسار للخوادم أو مهام CI أو البيئات التي تعمل عبر الطرفية فقط.

بالنسبة للأصداف البعيدة حيث يمكنك فتح متصفح في مكان آخر، شغّل:

```bash
clawhub login --device
```

تطبع CLI رمزًا صالحًا لمرة واحدة وتنتظر أثناء تفويضه على
`https://clawhub.ai/cli/device`.

## تخزين الرموز المميزة

مسارات الإعدادات الافتراضية:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` أو `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

تجاوز المسار باستخدام:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

اطبع الرمز المميز المخزّن لإعداد CI باستخدام:

```bash
clawhub token
```

## الإلغاء

يمكنك إلغاء رموز API المميزة في واجهة ويب ClawHub.

تُرجع الرموز المميزة الملغاة أو غير الصالحة أو المفقودة `401 Unauthorized`. سجّل الدخول مرة أخرى
باستخدام `clawhub login` أو وفّر رمزًا مميزًا جديدًا باستخدام `clawhub login --token`.

لا يمكن للحسابات المحذوفة أو المحظورة أو المعطّلة متابعة استخدام رموز API المميزة الحالية.
إذا كان حسابك محظورًا أو معطّلًا، فاستخدم
[نموذج استئناف ClawHub](https://appeals.openclaw.ai/) إذا كنت تعتقد أن هذا
خطأ.
