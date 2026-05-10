---
read_when:
    - أنت تُجري إعداد التشغيل الأول من دون التهيئة الكاملة عبر CLI
    - تريد تعيين مسار مساحة العمل الافتراضي
    - تحتاج إلى كل خيار وكيف يقرر الإعداد بين الوضع المرجعي ووضع المعالج
summary: مرجع CLI لـ `openclaw setup` (تهيئة الإعدادات ومساحة العمل، وتشغيل الإعداد الأولي اختياريًا)
title: الإعداد
x-i18n:
    generated_at: "2026-05-10T19:31:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55f0d771bb07c4c69293a470d54f4b6bb108ee521889bfb944fe450b24938b5e
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

هيّئ التكوين الأساسي ومساحة عمل الوكيل. عند وجود أي علامة للتهيئة الأولية، يشغّل المعالج أيضًا.

<Note>
`openclaw setup` مخصص لتثبيتات التكوين القابلة للتغيير. في وضع Nix (`OPENCLAW_NIX_MODE=1`) يرفض OpenClaw عمليات الكتابة الخاصة بالإعداد لأن ملف التكوين مُدار بواسطة Nix. استخدم [البدء السريع لـ nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) الرسمي أو تكوين المصدر المكافئ لحزمة Nix أخرى.
</Note>

## الخيارات

| العلامة                    | الوصف                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | دليل مساحة عمل الوكيل (الافتراضي `~/.openclaw/workspace`؛ يُخزّن باسم `agents.defaults.workspace`). |
| `--wizard`                 | تشغيل التهيئة الأولية التفاعلية.                                                                   |
| `--non-interactive`        | تشغيل التهيئة الأولية دون مطالبات.                                                                 |
| `--mode <mode>`            | وضع التهيئة الأولية: `local` أو `remote`.                                                          |
| `--import-from <provider>` | موفر الترحيل المراد تشغيله أثناء التهيئة الأولية.                                                  |
| `--import-source <path>`   | موطن وكيل المصدر لـ `--import-from`.                                                               |
| `--import-secrets`         | استيراد الأسرار المدعومة أثناء ترحيل التهيئة الأولية.                                              |
| `--remote-url <url>`       | عنوان URL لـ WebSocket الخاص بـ Gateway البعيد.                                                    |
| `--remote-token <token>`   | رمز Gateway البعيد (اختياري).                                                                      |

### التشغيل التلقائي للمعالج

يشغّل `openclaw setup` المعالج عند وجود أي من هذه العلامات صراحةً، حتى من دون `--wizard`:

`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## أمثلة

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## ملاحظات

- يقوم `openclaw setup` العادي بتهيئة التكوين ومساحة العمل دون تشغيل مسار التهيئة الأولية الكامل.
- بعد الإعداد العادي، شغّل `openclaw onboard` للرحلة الإرشادية الكاملة، أو `openclaw configure` للتغييرات المحددة، أو `openclaw channels add` لإضافة حسابات القنوات.
- إذا اكتُشفت حالة Hermes، يمكن للتهيئة الأولية التفاعلية أن تعرض الترحيل تلقائيًا. يتطلب استيراد التهيئة الأولية إعدادًا جديدًا؛ استخدم [الترحيل](/ar/cli/migrate) لخطط التشغيل التجريبي، والنسخ الاحتياطية، ووضع الاستبدال خارج التهيئة الأولية.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [التهيئة الأولية (CLI)](/ar/start/wizard)
- [بدء الاستخدام](/ar/start/getting-started)
- [نظرة عامة على التثبيت](/ar/install)
