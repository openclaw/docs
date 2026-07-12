---
read_when:
    - تسجيل الدخول إلى ClawHub
    - استخدام CLI الخاص بـ ClawHub
    - تصحيح أخطاء 401
summary: تسجيل الدخول إلى ClawHub، ورموز API المميزة، وتسجيل دخول CLI، وتخزين الرموز المميزة، وإلغاؤها.
x-i18n:
    generated_at: "2026-07-12T05:37:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# المصادقة

يستخدم ClawHub ‏GitHub لتسجيل الدخول عبر الويب. تستخدم CLI رموز واجهة API الخاصة بـ ClawHub التي يتم إنشاؤها
من خلال الحساب الذي سُجّل الدخول إليه.

## تسجيل الدخول عبر الويب

استخدم GitHub لتسجيل الدخول إلى [clawhub.ai](https://clawhub.ai).

لا يمكن للحسابات المحذوفة أو المحظورة أو المعطّلة إكمال تسجيل الدخول المعتاد إلى ClawHub.
إذا أعادك تسجيل الدخول إلى حالة عدم تسجيل الدخول، فقد لا يكون حسابك
في وضع سليم. إذا كان حسابك محظورًا أو معطّلًا، فاستخدم
[نموذج استئناف ClawHub](https://appeals.openclaw.ai/) إذا كنت تعتقد أن هذا
حدث عن طريق الخطأ.

## تسجيل الدخول عبر CLI

يفتح مسار تسجيل الدخول الافتراضي في CLI متصفحك:

```bash
clawhub login
clawhub whoami
```

ما يحدث:

1. تبدأ CLI خادم استدعاء عكسي مؤقتًا على `127.0.0.1`.
2. يفتح متصفحك صفحة تسجيل الدخول إلى ClawHub.
3. بعد تسجيل الدخول عبر GitHub، ينشئ ClawHub رمز واجهة API.
4. يعيد المتصفح التوجيه إلى الاستدعاء العكسي المحلي.
5. تخزّن CLI الرمز في ملف إعدادات ClawHub لديك.

إذا تعذّر على متصفحك الوصول إلى الاستدعاء العكسي المحلي بسبب قواعد جدار الحماية أو VPN أو
الوكيل، فاستخدم مسار الرمز دون واجهة رسومية.

## تسجيل الدخول دون واجهة رسومية

أنشئ رمزًا في واجهة ويب ClawHub، ثم مرّره إلى CLI:

```bash
clawhub login --token clh_...
```

استخدم هذا المسار للخوادم أو مهام CI أو البيئات التي تقتصر على الطرفية.

بالنسبة إلى الصدفات البعيدة التي يمكنك فيها فتح متصفح في مكان آخر، شغّل:

```bash
clawhub login --device
```

تطبع CLI رمزًا صالحًا لمرة واحدة وتنتظر بينما تفوّضها عبر
`https://clawhub.ai/cli/device`.

## تخزين الرمز

مسارات الإعدادات الافتراضية:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` أو `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

تجاوز المسار باستخدام:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

اطبع الرمز المخزّن لإعداد CI باستخدام:

```bash
clawhub token
```

## الإلغاء

يمكنك إلغاء رموز واجهة API في واجهة ويب ClawHub.

تعيد الرموز الملغاة أو غير الصالحة أو المفقودة الاستجابة `401 Unauthorized`. سجّل الدخول مجددًا
باستخدام `clawhub login` أو قدّم رمزًا جديدًا باستخدام `clawhub login --token`.

لا يمكن للحسابات المحذوفة أو المحظورة أو المعطّلة مواصلة استخدام رموز واجهة API الحالية.
إذا كان حسابك محظورًا أو معطّلًا، فاستخدم
[نموذج استئناف ClawHub](https://appeals.openclaw.ai/) إذا كنت تعتقد أن هذا
حدث عن طريق الخطأ.
