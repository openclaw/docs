---
read_when:
    - أنت تجري إعداد التشغيل الأول بدون عملية التهيئة الكاملة عبر CLI
    - تريد تعيين مسار مساحة العمل الافتراضي
    - تحتاج إلى كل خيار وكيف يقرر الإعداد بين الوضع الأساسي ووضع المعالج
summary: مرجع CLI لـ `openclaw setup` (تهيئة الإعدادات ومساحة العمل، مع تشغيل الإعداد الأولي اختياريًا)
title: إعداد
x-i18n:
    generated_at: "2026-06-27T17:25:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42bc570cf4c43338d6ca6202aace7c9d669fb1ac6d8bd8b61a591086fff2896a
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

هيّئ الإعدادات الأساسية ومساحة عمل الوكيل. عند وجود أي علم من أعلام الإعداد الأولي، يشغّل المعالج أيضًا.

<Note>
`openclaw setup` مخصص لعمليات تثبيت الإعدادات القابلة للتغيير. في وضع Nix (`OPENCLAW_NIX_MODE=1`) يرفض OpenClaw عمليات كتابة الإعدادات لأن ملف الإعدادات مُدار بواسطة Nix. استخدم [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) الرسمي أو إعدادات المصدر المكافئة لحزمة Nix أخرى.
</Note>

## الخيارات

| العلم                      | الوصف                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | دليل مساحة عمل الوكيل (الافتراضي `~/.openclaw/workspace`؛ مخزّن باسم `agents.defaults.workspace`). |
| `--wizard`                 | شغّل الإعداد الأولي التفاعلي.                                                                         |
| `--non-interactive`        | شغّل الإعداد الأولي بدون مطالبات.                                                                     |
| `--accept-risk`            | أقرّ بمخاطر وصول الوكيل إلى النظام بالكامل؛ مطلوب مع `--non-interactive`.                       |
| `--mode <mode>`            | وضع الإعداد الأولي: `local` أو `remote`.                                                               |
| `--import-from <provider>` | مزوّد الترحيل المراد تشغيله أثناء الإعداد الأولي.                                                        |
| `--import-source <path>`   | موطن وكيل المصدر لـ `--import-from`.                                                              |
| `--import-secrets`         | استورد الأسرار المدعومة أثناء ترحيل الإعداد الأولي.                                               |
| `--remote-url <url>`       | عنوان URL لـ WebSocket الخاص بـ Gateway البعيد.                                                                       |
| `--remote-token <token>`   | رمز Gateway البعيد (اختياري).                                                                    |

### التشغيل التلقائي للمعالج

يشغّل `openclaw setup` المعالج عندما تكون أي من هذه الأعلام موجودة صراحةً، حتى بدون `--wizard`:

`--wizard`, `--non-interactive`, `--accept-risk`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## أمثلة

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## ملاحظات

- يهيّئ `openclaw setup` العادي الإعدادات ومساحة العمل بدون تشغيل تدفق الإعداد الأولي الكامل.
- بعد الإعداد العادي، شغّل `openclaw onboard` للرحلة الإرشادية الكاملة، أو `openclaw configure` للتغييرات المستهدفة، أو `openclaw channels add` لإضافة حسابات القنوات.
- إذا اكتُشفت حالة Hermes، يمكن للإعداد الأولي التفاعلي عرض الترحيل تلقائيًا. يتطلب استيراد الإعداد الأولي إعدادًا جديدًا؛ استخدم [الترحيل](/ar/cli/migrate) لخطط التشغيل التجريبي، والنسخ الاحتياطية، ووضع الاستبدال خارج الإعداد الأولي.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [الإعداد الأولي (CLI)](/ar/start/wizard)
- [بدء الاستخدام](/ar/start/getting-started)
- [نظرة عامة على التثبيت](/ar/install)
