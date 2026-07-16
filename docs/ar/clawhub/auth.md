---
read_when:
    - تسجيل الدخول إلى ClawHub
    - استخدام ClawHub CLI
    - تصحيح أخطاء 401
summary: تسجيل الدخول إلى ClawHub، ورموز API المميزة، وتسجيل الدخول عبر CLI، وتخزين الرموز المميزة، وإبطالها.
x-i18n:
    generated_at: "2026-07-16T13:38:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# المصادقة

يستخدم ClawHub ‏GitHub لتسجيل الدخول عبر الويب. وتستخدم CLI رموز API المميزة الخاصة بـ ClawHub التي تُنشأ
من خلال الحساب الذي سُجّل الدخول إليه.

## تسجيل الدخول عبر الويب

استخدم GitHub لتسجيل الدخول في [clawhub.ai](https://clawhub.ai).

لا يمكن للحسابات المحذوفة أو المحظورة أو المعطّلة إكمال تسجيل الدخول المعتاد إلى ClawHub.
إذا أعادك تسجيل الدخول إلى حالة تسجيل الخروج، فقد لا يكون حسابك في وضع
سليم. إذا كان حسابك محظورًا أو معطّلًا، فاستخدم
[نموذج استئناف ClawHub](https://appeals.openclaw.ai/) إذا كنت تعتقد أن هذا
خطأ.

## تسجيل الدخول عبر CLI

يفتح تدفق تسجيل الدخول الافتراضي في CLI متصفحك:

```bash
clawhub login
clawhub whoami
```

ما يحدث:

1. تبدأ CLI خادم استدعاء عكسي مؤقتًا على `127.0.0.1`.
2. يفتح متصفحك صفحة تسجيل الدخول إلى ClawHub.
3. بعد تسجيل الدخول عبر GitHub، ينشئ ClawHub رمز API مميزًا.
4. يعيد المتصفح التوجيه إلى الاستدعاء العكسي المحلي.
5. تخزّن CLI الرمز المميز في ملف إعداد ClawHub الخاص بك.

إذا تعذّر على متصفحك الوصول إلى الاستدعاء العكسي المحلي بسبب قواعد جدار الحماية أو VPN أو
الوكيل، فاستخدم تدفق الرمز المميز من دون واجهة رسومية.

## تسجيل الدخول من دون واجهة رسومية

أنشئ رمزًا مميزًا في واجهة ويب ClawHub، ثم مرّره إلى CLI:

```bash
clawhub login --token clh_...
```

استخدم هذا التدفق للخوادم أو مهام CI أو البيئات التي تقتصر على الطرفية.

بالنسبة إلى جلسات الصدفة البعيدة التي يمكنك فيها فتح متصفح في مكان آخر، شغّل:

```bash
clawhub login --device
```

تطبع CLI رمزًا يُستخدم لمرة واحدة وتنتظر بينما تمنحها التفويض في
`https://clawhub.ai/cli/device`.

## تخزين الرموز المميزة

مسارات الإعداد الافتراضية:

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

## الإبطال

يمكنك إبطال رموز API المميزة في واجهة ويب ClawHub.

تُرجع الرموز المميزة المُبطلة أو غير الصالحة أو المفقودة `401 Unauthorized`. سجّل الدخول مجددًا
باستخدام `clawhub login` أو قدّم رمزًا مميزًا جديدًا باستخدام `clawhub login --token`.

لا يمكن للحسابات المحذوفة أو المحظورة أو المعطّلة مواصلة استخدام رموز API المميزة الموجودة.
إذا كان حسابك محظورًا أو معطّلًا، فاستخدم
[نموذج استئناف ClawHub](https://appeals.openclaw.ai/) إذا كنت تعتقد أن هذا
خطأ.
