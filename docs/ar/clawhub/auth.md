---
read_when:
    - تسجيل الدخول إلى ClawHub
    - استخدام ClawHub CLI
    - استكشاف أخطاء 401 وإصلاحها
summary: تسجيل الدخول إلى ClawHub، ورموز API، وتسجيل الدخول عبر CLI، وتخزين الرموز وإبطالها.
x-i18n:
    generated_at: "2026-05-13T05:32:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261f5a93200db8415e3bc8f35251c3486110ce8e076c482e846ad11f2ccd517f
    source_path: clawhub/auth.md
    workflow: 16
---

# المصادقة

يستخدم ClawHub GitHub لتسجيل الدخول عبر الويب. يستخدم CLI رموز API الخاصة بـ ClawHub التي تُنشأ
من خلال الحساب الذي سجّلت الدخول إليه.

## تسجيل الدخول عبر الويب

استخدم GitHub لتسجيل الدخول في [clawhub.ai](https://clawhub.ai).

لا يمكن للحسابات المحذوفة أو المحظورة أو المعطلة إكمال تسجيل الدخول العادي إلى ClawHub.
إذا أعادك تسجيل الدخول إلى حالة تسجيل الخروج، فقد لا يكون حسابك في وضع جيد.

## تسجيل دخول CLI

يفتح تدفق تسجيل دخول CLI الافتراضي متصفحك:

```bash
clawhub login
clawhub whoami
```

ما يحدث:

1. يبدأ CLI خادم رد نداء مؤقتًا على `127.0.0.1`.
2. يفتح متصفحك صفحة تسجيل الدخول إلى ClawHub.
3. بعد تسجيل الدخول عبر GitHub، ينشئ ClawHub رمز API.
4. يعيد المتصفح التوجيه إلى رد النداء المحلي.
5. يخزّن CLI الرمز في ملف إعدادات ClawHub.

إذا تعذر على متصفحك الوصول إلى رد النداء المحلي بسبب جدار حماية أو VPN أو
قواعد وكيل، فاستخدم تدفق الرمز بلا واجهة رسومية.

## تسجيل الدخول بلا واجهة رسومية

أنشئ رمزًا في واجهة ويب ClawHub، ثم مرّره إلى CLI:

```bash
clawhub login --token clh_...
```

استخدم هذا التدفق للخوادم أو مهام CI أو البيئات التي تقتصر على الطرفية.

بالنسبة إلى الصدفات البعيدة حيث يمكنك فتح متصفح في مكان آخر، شغّل:

```bash
clawhub login --device
```

يطبع CLI رمزًا للاستخدام مرة واحدة وينتظر بينما تصرّح له عبر
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

## الإبطال

يمكنك إبطال رموز API في واجهة ويب ClawHub.

تعيد الرموز المبطلة أو غير الصالحة أو المفقودة `401 Unauthorized`. سجّل الدخول مرة أخرى
باستخدام `clawhub login` أو قدّم رمزًا جديدًا باستخدام `clawhub login --token`.

لا يمكن للحسابات المحذوفة أو المحظورة أو المعطلة مواصلة استخدام رموز API الحالية.
