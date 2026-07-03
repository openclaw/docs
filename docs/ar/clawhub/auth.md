---
read_when:
    - تسجيل الدخول إلى ClawHub
    - استخدام ClawHub CLI
    - تصحيح أخطاء 401s
summary: تسجيل الدخول إلى ClawHub، ورموز API، وتسجيل الدخول عبر CLI، وتخزين الرموز، والإلغاء.
x-i18n:
    generated_at: "2026-07-03T17:23:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# المصادقة

يستخدم ClawHub GitHub لتسجيل الدخول عبر الويب. يستخدم CLI رموز API الخاصة بـ ClawHub التي تُنشأ
من خلال ذلك الحساب الذي تم تسجيل الدخول إليه.

## تسجيل الدخول عبر الويب

استخدم GitHub لتسجيل الدخول في [clawhub.ai](https://clawhub.ai).

لا يمكن للحسابات المحذوفة أو المحظورة أو المعطلة إكمال تسجيل الدخول العادي إلى ClawHub.
إذا أعادك تسجيل الدخول إلى حالة تسجيل خروج، فقد لا يكون حسابك في وضع
جيد. إذا كان حسابك محظورًا أو معطلًا، فاستخدم
[نموذج استئناف ClawHub](https://appeals.openclaw.ai/) إذا كنت تعتقد أن هذا
خطأ.

## تسجيل الدخول عبر CLI

يفتح تدفق تسجيل الدخول الافتراضي في CLI متصفحك:

```bash
clawhub login
clawhub whoami
```

ما يحدث:

1. يبدأ CLI خادم استدعاء مؤقتًا على `127.0.0.1`.
2. يفتح متصفحك صفحة تسجيل الدخول إلى ClawHub.
3. بعد تسجيل الدخول عبر GitHub، ينشئ ClawHub رمز API.
4. يعيد المتصفح التوجيه إلى الاستدعاء المحلي.
5. يخزن CLI الرمز في ملف إعدادات ClawHub لديك.

إذا لم يتمكن متصفحك من الوصول إلى الاستدعاء المحلي بسبب جدار حماية أو VPN أو
قواعد وكيل، فاستخدم تدفق الرمز بلا واجهة رسومية.

## تسجيل الدخول بلا واجهة رسومية

أنشئ رمزًا في واجهة ويب ClawHub، ثم مرره إلى CLI:

```bash
clawhub login --token clh_...
```

استخدم هذا التدفق للخوادم، أو مهام CI، أو البيئات التي تعمل بالطرفية فقط.

بالنسبة إلى الأصداف البعيدة حيث يمكنك فتح متصفح في مكان آخر، شغّل:

```bash
clawhub login --device
```

يطبع CLI رمزًا صالحًا لمرة واحدة وينتظر أثناء تفويضه على
`https://clawhub.ai/cli/device`.

## تخزين الرموز

مسارات الإعدادات الافتراضية:

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

## الإلغاء

يمكنك إلغاء رموز API في واجهة ويب ClawHub.

تعيد الرموز الملغاة أو غير الصالحة أو المفقودة `401 Unauthorized`. سجّل الدخول مرة أخرى
باستخدام `clawhub login` أو قدّم رمزًا جديدًا باستخدام `clawhub login --token`.

لا يمكن للحسابات المحذوفة أو المحظورة أو المعطلة الاستمرار في استخدام رموز API الحالية.
إذا كان حسابك محظورًا أو معطلًا، فاستخدم
[نموذج استئناف ClawHub](https://appeals.openclaw.ai/) إذا كنت تعتقد أن هذا
خطأ.
