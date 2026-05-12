---
read_when:
    - تسجيل الدخول إلى ClawHub
    - استخدام ClawHub CLI
    - استكشاف أخطاء 401 وإصلاحها
summary: تسجيل الدخول إلى ClawHub، ورموز API، وتسجيل الدخول عبر CLI، وتخزين الرموز، والإبطال.
x-i18n:
    generated_at: "2026-05-12T00:56:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261f5a93200db8415e3bc8f35251c3486110ce8e076c482e846ad11f2ccd517f
    source_path: clawhub/auth.md
    workflow: 16
---

# المصادقة

يستخدم ClawHub GitHub لتسجيل الدخول عبر الويب. يستخدم CLI رموز ClawHub API التي تُنشأ
من خلال ذلك الحساب المسجل دخوله.

## تسجيل الدخول عبر الويب

استخدم GitHub لتسجيل الدخول في [clawhub.ai](https://clawhub.ai).

لا يمكن للحسابات المحذوفة أو المحظورة أو المعطلة إكمال تسجيل الدخول العادي إلى ClawHub.
إذا أعادك تسجيل الدخول إلى حالة عدم تسجيل الدخول، فقد لا يكون حسابك في وضع
جيد.

## تسجيل دخول CLI

يفتح مسار تسجيل الدخول الافتراضي في CLI متصفحك:

```bash
clawhub login
clawhub whoami
```

ما يحدث:

1. يبدأ CLI خادم رد اتصال مؤقتًا على `127.0.0.1`.
2. يفتح متصفحك صفحة تسجيل الدخول إلى ClawHub.
3. بعد تسجيل الدخول عبر GitHub، ينشئ ClawHub رمز API.
4. يعيد المتصفح التوجيه إلى رد الاتصال المحلي.
5. يخزن CLI الرمز في ملف إعدادات ClawHub لديك.

إذا لم يتمكن متصفحك من الوصول إلى رد الاتصال المحلي بسبب قواعد جدار الحماية أو VPN أو
الوكيل، فاستخدم مسار الرمز بلا واجهة رسومية.

## تسجيل الدخول بلا واجهة رسومية

أنشئ رمزًا في واجهة ويب ClawHub، ثم مرره إلى CLI:

```bash
clawhub login --token clh_...
```

استخدم هذا المسار للخوادم أو مهام CI أو البيئات التي تعمل بالطرفية فقط.

بالنسبة إلى الصدفات البعيدة حيث يمكنك فتح متصفح في مكان آخر، شغّل:

```bash
clawhub login --device
```

يطبع CLI رمزًا صالحًا لمرة واحدة وينتظر بينما تفوضه في
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

ترجع الرموز المُبطلة أو غير الصالحة أو المفقودة `401 Unauthorized`. سجّل الدخول مرة أخرى
باستخدام `clawhub login` أو قدّم رمزًا جديدًا باستخدام `clawhub login --token`.

لا يمكن للحسابات المحذوفة أو المحظورة أو المعطلة الاستمرار في استخدام رموز API الحالية.
