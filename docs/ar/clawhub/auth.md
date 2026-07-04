---
read_when:
    - تسجيل الدخول إلى ClawHub
    - استخدام ClawHub CLI
    - تصحيح أخطاء 401s
summary: تسجيل الدخول إلى ClawHub، ورموز API المميزة، وتسجيل الدخول عبر CLI، وتخزين الرموز المميزة، وإلغاؤها.
x-i18n:
    generated_at: "2026-07-04T06:33:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# المصادقة

يستخدم ClawHub GitHub لتسجيل الدخول عبر الويب. تستخدم CLI رموز API المميزة الخاصة بـ ClawHub التي تُنشأ
من خلال ذلك الحساب المسجّل الدخول.

## تسجيل الدخول عبر الويب

استخدم GitHub لتسجيل الدخول إلى [clawhub.ai](https://clawhub.ai).

لا يمكن للحسابات المحذوفة أو المحظورة أو المعطّلة إكمال تسجيل الدخول العادي إلى ClawHub.
إذا أعادك تسجيل الدخول إلى حالة تسجيل الخروج، فقد لا يكون حسابك بحالة جيدة.
إذا كان حسابك محظورًا أو معطّلًا، فاستخدم
[نموذج استئناف ClawHub](https://appeals.openclaw.ai/) إذا كنت تعتقد أن هذا
خطأ.

## تسجيل الدخول إلى CLI

يفتح مسار تسجيل الدخول الافتراضي في CLI متصفحك:

```bash
clawhub login
clawhub whoami
```

ما يحدث:

1. تبدأ CLI خادم رد اتصال مؤقتًا على `127.0.0.1`.
2. يفتح متصفحك صفحة تسجيل الدخول إلى ClawHub.
3. بعد تسجيل الدخول عبر GitHub، ينشئ ClawHub رمز API مميزًا.
4. يعيد المتصفح التوجيه إلى رد الاتصال المحلي.
5. تخزّن CLI الرمز المميز في ملف إعدادات ClawHub لديك.

إذا لم يتمكن متصفحك من الوصول إلى رد الاتصال المحلي بسبب قواعد جدار الحماية أو VPN أو
الوكيل، فاستخدم مسار الرمز المميز بلا واجهة رسومية.

## تسجيل الدخول بلا واجهة رسومية

أنشئ رمزًا مميزًا في واجهة ويب ClawHub، ثم مرّره إلى CLI:

```bash
clawhub login --token clh_...
```

استخدم هذا المسار للخوادم أو مهام CI أو البيئات التي تعمل بالطرفية فقط.

بالنسبة إلى الأصداف البعيدة حيث يمكنك فتح متصفح في مكان آخر، شغّل:

```bash
clawhub login --device
```

تطبع CLI رمزًا للاستخدام مرة واحدة وتنتظر بينما تفوّضه على
`https://clawhub.ai/cli/device`.

## تخزين الرمز المميز

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

## الإبطال

يمكنك إبطال رموز API المميزة في واجهة ويب ClawHub.

تُرجع الرموز المميزة الملغاة أو غير الصالحة أو المفقودة `401 Unauthorized`. سجّل الدخول مرة أخرى
باستخدام `clawhub login` أو قدّم رمزًا مميزًا جديدًا باستخدام `clawhub login --token`.

لا يمكن للحسابات المحذوفة أو المحظورة أو المعطّلة متابعة استخدام رموز API المميزة الحالية.
إذا كان حسابك محظورًا أو معطّلًا، فاستخدم
[نموذج استئناف ClawHub](https://appeals.openclaw.ai/) إذا كنت تعتقد أن هذا
خطأ.
