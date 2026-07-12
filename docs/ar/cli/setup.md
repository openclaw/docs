---
read_when:
    - أنت تُجري الإعداد الأولي باستخدام معالج الإعداد في CLI
    - تريد تعيين مسار مساحة العمل الافتراضي
    - تحتاج إلى علامة الإعداد الخاصة بخط الأساس فقط للبرامج النصية
summary: مرجع CLI للأمر `openclaw setup` (اسم مستعار للتهيئة الأولية، مع إتاحة الإعداد الأساسي عبر علامة)
title: الإعداد
x-i18n:
    generated_at: "2026-07-12T05:44:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe3c631a2ed7328ab7e7d1438adff2d6112514b3fdcfb82923ba6ea04650c385
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

يشغّل `openclaw setup` مسار الإعداد الأولي الموجّه نفسه الذي يشغّله `openclaw onboard`:
إذ يتحقق من إعداد الاستدلال ويحفظه أولًا، ثم يبدأ Crestodian لتهيئة
مساحة العمل وGateway والقنوات والمهارات وفحوصات السلامة. استخدم `--baseline` عندما
تحتاج فقط إلى تهيئة مجلدات الإعدادات ومساحة العمل دون المعالج.

في الوضع الموجّه، تمثّل `--workspace <dir>` مساحة العمل المقترحة على Crestodian؛
ولا تُحفَظ إلا بعد موافقتك على ذلك المقترح. أما الإعداد الأساسي والتقليدي
وغير التفاعلي، فيحفظ مساحة العمل المقدّمة عبر مساره المعتاد.

يقبل `setup` علامات الإعداد الأولي نفسها التي يقبلها `openclaw onboard`، بما فيها
المصادقة (`--auth-choice` و`--token` وعلامات مفاتيح المزوّد)، وGateway
(`--gateway-port` و`--gateway-bind` و`--gateway-auth` و`--install-daemon`)،
وTailscale (`--tailscale`)، وإعادة الضبط (`--reset` و`--reset-scope`)، والمسار
(`--flow quickstart|advanced|manual|import`)، وعلامات التخطي
(`--skip-channels` و`--skip-skills` و`--skip-bootstrap` و`--skip-search`
و`--skip-health` و`--skip-ui` و`--skip-hooks`). راجع [الإعداد الأولي](/ar/cli/onboard)
و[أتمتة CLI](/ar/start/wizard-cli-automation) للاطلاع على المرجع الكامل للعلامات
وأمثلة التشغيل غير التفاعلي. يُعد `openclaw onboard --modern` اسمًا مستعارًا
للتوافق مع مساعد Crestodian المشروط بالاستدلال، ولا يوجد له مكافئ في `setup`.

<Note>
يُستخدم `openclaw setup` لعمليات التثبيت ذات الإعدادات القابلة للتعديل. في وضع Nix ‏(`OPENCLAW_NIX_MODE=1`)، يرفض OpenClaw عمليات الكتابة أثناء الإعداد لأن ملف الإعدادات تديره Nix. استخدم [دليل البدء السريع الرسمي لـ nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) أو إعدادات المصدر المكافئة لحزمة Nix أخرى.
</Note>

## الخيارات

| العلامة                    | الوصف                                                                                                       |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | مقترح مساحة العمل في الوضع الموجّه؛ يُحفَظ مباشرةً في الإعداد الأساسي والتقليدي وغير التفاعلي.             |
| `--baseline`               | إنشاء مجلدات الإعدادات الأساسية ومساحة العمل والجلسات دون إجراء الإعداد الأولي.                             |
| `--wizard`                 | مقبولة لأغراض التوافق؛ يشغّل الإعداد مسار الإعداد الأولي افتراضيًا.                                         |
| `--non-interactive`        | تشغيل الإعداد الأولي دون مطالبات.                                                                           |
| `--accept-risk`            | الإقرار بمخاطر منح الوكيل وصولًا إلى النظام بأكمله؛ مطلوبة مع `--non-interactive`.                          |
| `--mode <mode>`            | وضع الإعداد الأولي: `local` أو `remote`.                                                                     |
| `--flow <flow>`            | مسار الإعداد الأولي: `quickstart` أو `advanced` أو `manual` أو `import`.                                    |
| `--reset`                  | إعادة ضبط الإعدادات وبيانات الاعتماد والجلسات قبل الإعداد الأولي (ومساحة العمل فقط مع `--reset-scope full`). |
| `--reset-scope <scope>`    | نطاق إعادة الضبط: `config` أو `config+creds+sessions` أو `full`.                                            |
| `--import-from <provider>` | مزوّد الترحيل المطلوب تشغيله أثناء الإعداد الأولي.                                                          |
| `--import-source <path>`   | المجلد الرئيسي للوكيل المصدر من أجل `--import-from`.                                                        |
| `--import-secrets`         | استيراد الأسرار المدعومة أثناء ترحيل الإعداد الأولي.                                                        |
| `--remote-url <url>`       | عنوان URL لاتصال WebSocket الخاص بـGateway البعيد.                                                          |
| `--remote-token <token>`   | رمز Gateway البعيد (اختياري).                                                                               |
| `--json`                   | إخراج ملخص بتنسيق JSON.                                                                                     |

لا يمكن استخدام `--classic` و`--non-interactive` معًا: إذ يفتح الوضع التقليدي
المعالج التفاعلي، بينما يستخدم الإعداد غير التفاعلي مسار الأتمتة.

### الوضع الأساسي

يحافظ `openclaw setup --baseline` على السلوك القديم المقتصر على الإعداد الأساسي:
إذ ينشئ أدلة الإعدادات ومساحة العمل والجلسات، ثم ينهي التنفيذ دون
تشغيل الإعداد الأولي.

## أمثلة

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## ملاحظات

- بعد الإعداد الأساسي، شغّل `openclaw setup` أو `openclaw onboard` لخوض الرحلة الموجّهة الكاملة، أو `openclaw configure` لإجراء تغييرات محددة، أو `openclaw channels add` لإضافة حسابات القنوات.
- إذا اكتُشفت حالة Hermes، يمكن لمسار الإعداد الأولي التفاعلي أن يعرض الترحيل تلقائيًا. يتطلب الإعداد الأولي للاستيراد إعدادًا جديدًا؛ استخدم [الترحيل](/ar/cli/migrate) للحصول على خطط التشغيل التجريبي والنسخ الاحتياطية ووضع الاستبدال خارج الإعداد الأولي.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [الإعداد الأولي](/ar/cli/onboard)
- [الإعداد الأولي (CLI)](/ar/start/wizard)
- [بدء الاستخدام](/ar/start/getting-started)
- [نظرة عامة على التثبيت](/ar/install)
