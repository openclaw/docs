---
read_when:
    - تريد الدردشة مع OpenClaw لإعداده أو إصلاحه
    - أنت تُجري الإعداد لأول مرة باستخدام معالج التهيئة الأولية
    - تريد تعيين مسار مساحة العمل الافتراضي
    - تحتاج إلى علامة الإعداد الخاصة بخط الأساس فقط للبرامج النصية
summary: مرجع CLI لـ `openclaw setup` (محادثة وكيل النظام مع الرجوع الاحتياطي إلى الإعداد الأولي)
title: الإعداد
x-i18n:
    generated_at: "2026-07-16T14:06:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3395dbfe94c2f9686757fff85db709f0a9ed0ac9579e8e3c80ee1d51038f8e18
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

يمثّل `openclaw setup` نقطة دخول وكيل النظام. في نظام مُهيّأ، يفتح
`openclaw setup` وحده محادثة OpenClaw تفاعلية. أما في نظام جديد، فينتقل
إلى الإعداد الأولي الموجّه. استخدم `-m`/`--message` لطلب واحد أو
`--baseline` لتهيئة مجلدات الإعدادات/مساحة العمل من دون المعالج.

ترتيب التوجيه:

1. يؤدي أي خيار من خيارات الإعداد الأولي (`--wizard` أو `--baseline` أو مساحة العمل أو إعادة الضبط أو
   الوضع غير التفاعلي أو التدفق أو النمط أو Gateway أو الخدمة الخفية أو التخطي أو الاستيراد أو الاتصال البعيد أو خيارات
   المصادقة) إلى تشغيل الإعداد الأولي تمامًا كما يفعل `openclaw onboard`.
2. يشغّل `-m`/`--message` أو `--yes` وكيل النظام.
3. عند عدم وجود خيار توجيه، يفتح النظام التفاعلي المُهيّأ OpenClaw. أما
   النظام الجديد فيشغّل الإعداد الأولي. في نظام مُهيّأ، يطبع `--json`
   نظرة عامة على النظام حتى من دون TTY؛ ويُبقي خيار الإعداد الأولي
   ملخص JSON الخاص بالإعداد الأولي.

في الوضع الموجّه، تكون `--workspace <dir>` مساحة العمل المقترحة على OpenClaw؛
ولا تُحفَظ إلا بعد الموافقة على ذلك الاقتراح. تحفظ إعدادات خط الأساس والكلاسيكية
وغير التفاعلية مساحة العمل المقدّمة من خلال تدفقها المعتاد.

يعمل اكتشاف الاستدلال الموجّه على مضيف Gateway في macOS أو Linux. تستدعي CLI
وتطبيق macOS أداة الاكتشاف نفسها المملوكة لـ Gateway، والتي تتحقق من النماذج
المُهيّأة، وعمليات تسجيل الدخول المدعومة في CLI، ومتغيرات بيئة مفاتيح API،
ونماذج Ollama أو LM Studio المثبتة مسبقًا. لا تُنزَّل النماذج المحلية أبدًا بواسطة
هذه العملية التلقائية؛ ويجب أن يستجيب المرشح المحدد لعملية إكمال فعلية قبل حفظ
إعدادات موفّره ونموذجه.

يقبل `setup` خيارات الإعداد الأولي نفسها التي يقبلها `openclaw onboard`، بما فيها
المصادقة (`--auth-choice` و`--token` وخيارات مفاتيح الموفّر)، وGateway
(`--gateway-port` و`--gateway-bind` و`--gateway-auth` و`--install-daemon`)،
وTailscale ‏(`--tailscale`)، وإعادة الضبط (`--reset` و`--reset-scope`)، والتدفق
(`--flow quickstart|advanced|manual|import`)، وخيارات التخطي
(`--skip-channels` و`--skip-skills` و`--skip-bootstrap` و`--skip-search`
و`--skip-health` و`--skip-ui` و`--skip-hooks`). راجع [الإعداد الأولي](/ar/cli/onboard) و
[أتمتة CLI](/ar/start/wizard-cli-automation) للاطلاع على المرجع الكامل للخيارات
وأمثلة الوضع غير التفاعلي. يظل `openclaw onboard --modern` مدخل توافق
لمساعد OpenClaw نفسه الخاضع لبوابة الاستدلال.

<Note>
يُستخدم `openclaw setup` لعمليات التثبيت ذات الإعدادات القابلة للتعديل. في وضع Nix ‏(`OPENCLAW_NIX_MODE=1`)، يرفض OpenClaw كتابة إعدادات التجهيز لأن ملف الإعدادات تديره Nix. استخدم [البدء السريع لـ nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) من الطرف الأول أو إعدادات المصدر المكافئة لحزمة Nix أخرى.
</Note>

## الخيارات

| الخيار                       | الوصف                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `-m, --message <text>`     | تشغيل طلب OpenClaw واحد.                                                                             |
| `--yes`                    | الموافقة على عمليات الكتابة الدائمة للإعدادات لطلب `--message` واحد.                                         |
| `--workspace <dir>`        | اقتراح مساحة العمل في الوضع الموجّه؛ وتحفظها مباشرة إعدادات خط الأساس والكلاسيكية وغير التفاعلية. |
| `--baseline`               | إنشاء مجلدات إعدادات خط الأساس/مساحة العمل/الجلسات من دون إعداد أولي.                                  |
| `--wizard`                 | فرض الإعداد الأولي التفاعلي.                                                                         |
| `--non-interactive`        | تشغيل الإعداد الأولي من دون مطالبات.                                                                       |
| `--accept-risk`            | الإقرار بمخاطر وصول وكيل النظام الكامل؛ وهو مطلوب مع `--non-interactive`.                         |
| `--mode <mode>`            | نمط الإعداد الأولي: `local` أو `remote`.                                                                 |
| `--flow <flow>`            | تدفق الإعداد الأولي: `quickstart` أو `advanced` أو `manual` أو `import`.                                        |
| `--reset`                  | إعادة ضبط الإعدادات + بيانات الاعتماد + الجلسات قبل الإعداد الأولي (مساحة العمل فقط مع `--reset-scope full`).   |
| `--reset-scope <scope>`    | نطاق إعادة الضبط: `config` أو `config+creds+sessions` أو `full`.                                            |
| `--import-from <provider>` | موفّر الترحيل الذي سيُشغَّل أثناء الإعداد الأولي.                                                          |
| `--import-source <path>`   | الدليل الرئيسي للوكيل المصدر من أجل `--import-from`.                                                                |
| `--import-secrets`         | استيراد الأسرار المدعومة أثناء ترحيل الإعداد الأولي.                                                 |
| `--remote-url <url>`       | عنوان URL لـ WebSocket الخاص بـ Gateway البعيد.                                                                         |
| `--remote-token <token>`   | رمز Gateway البعيد (اختياري).                                                                      |
| `--json`                   | النظام المُهيّأ: نظرة عامة على OpenClaw. مسار الإعداد الأولي: ملخص الإعداد الأولي.                           |

الخياران `--classic` و`--non-interactive` متنافيان: يفتح الوضع الكلاسيكي
المعالج المزود بالمطالبات، بينما يستخدم الإعداد غير التفاعلي مسار الأتمتة.

### وضع خط الأساس

يحافظ `openclaw setup --baseline` على السلوك الأقدم المقتصر على خط الأساس: إذ
ينشئ مجلدات الإعدادات ومساحة العمل والجلسات، ثم يخرج من دون
تشغيل الإعداد الأولي.

## أمثلة

```bash
openclaw setup
openclaw setup -m "status"
openclaw setup -m "restart gateway" --yes
openclaw setup --json
openclaw setup --wizard
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## ملاحظات

- بعد إعداد خط الأساس، شغّل `openclaw onboard` لإجراء الرحلة الموجّهة الكاملة، أو `openclaw configure` لإجراء تغييرات محددة، أو `openclaw channels add` لإضافة حسابات القنوات.
- إذا اكتُشفت حالة Hermes، فيمكن للإعداد الأولي التفاعلي عرض الترحيل تلقائيًا. يتطلب الإعداد الأولي للاستيراد إعدادًا جديدًا؛ استخدم [الترحيل](/ar/cli/migrate) لخطط التشغيل التجريبي والنسخ الاحتياطية ووضع الاستبدال خارج الإعداد الأولي.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [الإعداد الأولي](/ar/cli/onboard)
- [الإعداد الأولي (CLI)](/ar/start/wizard)
- [بدء الاستخدام](/ar/start/getting-started)
- [نظرة عامة على التثبيت](/ar/install)
