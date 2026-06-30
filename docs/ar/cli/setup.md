---
read_when:
    - أنت تُجري إعداد التشغيل الأول باستخدام معالج التهيئة في CLI
    - تريد تعيين مسار مساحة العمل الافتراضي
    - تحتاج إلى علم الإعداد الخاص بخط الأساس فقط للسكربتات
summary: مرجع CLI لـ `openclaw setup` (اسم مستعار للإعداد الأولي، مع إتاحة الإعداد الأساسي عبر العلم)
title: الإعداد
x-i18n:
    generated_at: "2026-06-30T22:19:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797c023d5ba27920fbea9828c9bb12f6c10d25dd3aa6fc68fe9c742f432ebb05
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

شغّل تدفق الإعداد الأولي الكامل عبر CLI. يُعد `openclaw setup` اسمًا مستعارًا لـ `openclaw onboard`؛ استخدم `--baseline` عندما تحتاج فقط إلى تهيئة مجلدات الإعداد/مساحة العمل دون المعالج.

<Note>
`openclaw setup` مخصص لعمليات تثبيت الإعداد القابلة للتغيير. في وضع Nix (`OPENCLAW_NIX_MODE=1`) يرفض OpenClaw عمليات كتابة الإعداد لأن ملف الإعداد مُدار بواسطة Nix. استخدم [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) الرسمي أو إعداد المصدر المكافئ لحزمة Nix أخرى.
</Note>

## الخيارات

| العلم                       | الوصف                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | دليل مساحة عمل الوكيل (الافتراضي `~/.openclaw/workspace`؛ يُخزّن كـ `agents.defaults.workspace`). |
| `--baseline`               | أنشئ مجلدات الإعداد/مساحة العمل/الجلسة الأساسية دون إعداد أولي.                                |
| `--wizard`                 | مقبول للتوافق؛ يشغّل setup الإعداد الأولي افتراضيًا.                                       |
| `--non-interactive`        | شغّل الإعداد الأولي دون مطالبات.                                                                     |
| `--accept-risk`            | أقرّ بمخاطر وصول الوكيل إلى النظام بالكامل؛ مطلوب مع `--non-interactive`.                       |
| `--mode <mode>`            | وضع الإعداد الأولي: `local` أو `remote`.                                                               |
| `--import-from <provider>` | مزود الترحيل الذي سيُشغّل أثناء الإعداد الأولي.                                                        |
| `--import-source <path>`   | موطن وكيل المصدر لـ `--import-from`.                                                              |
| `--import-secrets`         | استورد الأسرار المدعومة أثناء ترحيل الإعداد الأولي.                                               |
| `--remote-url <url>`       | عنوان URL لـ WebSocket الخاص بـ Gateway البعيد.                                                                       |
| `--remote-token <token>`   | رمز Gateway البعيد (اختياري).                                                                    |

### وضع الأساس

يحافظ `openclaw setup --baseline` على السلوك الأقدم الخاص بالأساس فقط: إذ ينشئ أدلة الإعداد ومساحة العمل والجلسة، ثم يخرج دون تشغيل الإعداد الأولي.

## أمثلة

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## ملاحظات

- يشغّل `openclaw setup` العادي نفس الرحلة الموجّهة مثل `openclaw onboard`.
- بعد الإعداد الأساسي، شغّل `openclaw setup` أو `openclaw onboard` للرحلة الموجّهة الكاملة، أو `openclaw configure` للتغييرات المحددة، أو `openclaw channels add` لإضافة حسابات قنوات.
- إذا اكتُشفت حالة Hermes، يمكن للإعداد الأولي التفاعلي أن يعرض الترحيل تلقائيًا. يتطلب إعداد الاستيراد إعدادًا جديدًا؛ استخدم [الترحيل](/ar/cli/migrate) لخطط التشغيل التجريبي والنسخ الاحتياطية ووضع الاستبدال خارج الإعداد الأولي.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [الإعداد الأولي (CLI)](/ar/start/wizard)
- [بدء الاستخدام](/ar/start/getting-started)
- [نظرة عامة على التثبيت](/ar/install)
