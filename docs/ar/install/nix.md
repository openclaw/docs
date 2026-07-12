---
read_when:
    - تريد عمليات تثبيت قابلة لإعادة الإنتاج والتراجع عنها
    - أنت تستخدم بالفعل Nix/NixOS/Home Manager
    - تريد تثبيت كل شيء وإدارته بأسلوب تصريحي
summary: ثبّت OpenClaw تصريحيًا باستخدام Nix
title: Nix
x-i18n:
    generated_at: "2026-07-12T06:05:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f74e259ec3d909c73d9184db24d236135db04c29c2e7fab9be9e6fa7f98ba91
    source_path: install/nix.md
    workflow: 16
---

ثبّت OpenClaw بأسلوب تصريحي باستخدام **[nix-openclaw](https://github.com/openclaw/nix-openclaw)**، وهي وحدة Home Manager رسمية متكاملة وجاهزة للاستخدام.

<Info>
يُعد مستودع [nix-openclaw](https://github.com/openclaw/nix-openclaw) المرجع الأساسي لتثبيت Nix. تقدم هذه الصفحة نظرة عامة سريعة.
</Info>

## ما الذي ستحصل عليه

- Gateway + تطبيق macOS + أدوات (whisper وspotify والكاميرات)، جميعها مثبّتة على إصدارات محددة
- خدمة launchd تستمر في العمل بعد إعادة التشغيل
- نظام Plugin بإعداد تصريحي
- تراجع فوري: `home-manager switch --rollback`

## البدء السريع

<Steps>
  <Step title="تثبيت Determinate Nix">
    إذا لم يكن Nix مثبتًا بالفعل، فاتبع تعليمات [أداة تثبيت Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="إنشاء flake محلي">
    استخدم القالب المصمم للوكيل أولًا من مستودع nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # انسخ templates/agent-first/flake.nix من مستودع nix-openclaw
    ```
  </Step>
  <Step title="إعداد الأسرار">
    أعِدّ رمز بوت المراسلة ومفتاح API لموفر النموذج. تعمل الملفات النصية العادية في `~/.secrets/` بشكل مناسب.
  </Step>
  <Step title="ملء العناصر النائبة في القالب والتبديل">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="التحقق">
    تأكد من أن خدمة launchd قيد التشغيل وأن البوت يستجيب للرسائل.
  </Step>
</Steps>

راجع [ملف README الخاص بـ nix-openclaw](https://github.com/openclaw/nix-openclaw) للاطلاع على جميع خيارات الوحدة والأمثلة.

## سلوك وقت التشغيل في وضع Nix

عند ضبط `OPENCLAW_NIX_MODE=1` (يتم ذلك تلقائيًا مع nix-openclaw)، يدخل OpenClaw في وضع حتمي لعمليات التثبيت المُدارة بواسطة Nix. يمكن لحزم Nix الأخرى ضبط الوضع نفسه؛ ويُعد nix-openclaw المرجع الرسمي.

يمكنك أيضًا ضبطه يدويًا:

```bash
export OPENCLAW_NIX_MODE=1
```

على macOS، لا يرث تطبيق الواجهة الرسومية متغيرات بيئة الصدفة. فعّل وضع Nix عبر `defaults` بدلًا من ذلك:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### ما الذي يتغير في وضع Nix

- تُعطّل مسارات التثبيت التلقائي والتعديل الذاتي.
- يُعامل `openclaw.json` على أنه غير قابل للتغيير. تظل القيم الافتراضية المستنتجة عند بدء التشغيل مقتصرة على وقت التشغيل، وترفض أدوات كتابة الإعدادات (الإعداد، والتهيئة الأولية، وأمر `openclaw update` المعدِّل، وتثبيت Plugin أو تحديثه أو إلغاء تثبيته أو تمكينه، و`doctor --fix`، و`doctor --generate-gateway-token`، و`openclaw config set`) تعديل الملف.
- عدّل مصدر Nix بدلًا من ذلك. بالنسبة إلى nix-openclaw، استخدم [البدء السريع](https://github.com/openclaw/nix-openclaw#quick-start) المصمم للوكيل أولًا، واضبط الإعدادات ضمن `programs.openclaw.config` أو `instances.<name>.config`.
- تعرض التبعيات المفقودة رسائل معالجة خاصة بـ Nix.
- تعرض واجهة المستخدم شريطًا لوضع Nix للقراءة فقط.

### مسارات الإعدادات والحالة

يقرأ OpenClaw إعدادات JSON5 من `OPENCLAW_CONFIG_PATH` ويخزن البيانات القابلة للتغيير في `OPENCLAW_STATE_DIR`. ضمن Nix، اضبط هذين المسارين صراحةً على مواقع مُدارة بواسطة Nix، بحيث تظل حالة وقت التشغيل والإعدادات خارج المخزن غير القابل للتغيير.

| المتغير                | القيمة الافتراضية                       |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### اكتشاف PATH للخدمة

تكتشف خدمة Gateway في launchd/systemd تلقائيًا الملفات التنفيذية ضمن ملفات تعريف Nix، بحيث تعمل وحدات Plugin والأدوات التي تستدعي ملفات تنفيذية مثبتة عبر `nix` من الصدفة دون إعداد PATH يدويًا:

- عند ضبط `NIX_PROFILES`، تُضاف كل قيمة إلى PATH الخاص بالخدمة وفق أولوية من اليمين إلى اليسار (بما يطابق أولوية صدفة Nix: القيمة الواقعة أقصى اليمين هي السائدة).
- عند عدم ضبط `NIX_PROFILES`، يُضاف `~/.nix-profile/bin` كمسار احتياطي.

ينطبق ذلك على بيئتي خدمة launchd في macOS وsystemd في Linux.

## ذو صلة

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    وحدة Home Manager المرجعية ودليل الإعداد الكامل.
  </Card>
  <Card title="معالج الإعداد" href="/ar/start/wizard" icon="wand-magic-sparkles">
    شرح تفصيلي للإعداد عبر CLI دون Nix.
  </Card>
  <Card title="Docker" href="/ar/install/docker" icon="docker">
    إعداد قائم على الحاويات بوصفه بديلًا لا يستخدم Nix.
  </Card>
  <Card title="التحديث" href="/ar/install/updating" icon="arrow-up-right-from-square">
    تحديث عمليات التثبيت المُدارة بواسطة Home Manager بالتزامن مع الحزمة.
  </Card>
</CardGroup>
