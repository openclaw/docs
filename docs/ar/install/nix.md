---
read_when:
    - تريد عمليات تثبيت قابلة لإعادة الإنتاج وقابلة للتراجع عنها
    - أنت تستخدم Nix/NixOS/Home Manager بالفعل
    - تريد أن يكون كل شيء مثبتًا ومدارًا تصريحيًا
summary: تثبيت OpenClaw تصريحيًا باستخدام Nix
title: Nix
x-i18n:
    generated_at: "2026-05-06T17:59:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b4c2eca298ac7ae60baea4d06855edb73c0b8bfe253a3f478d93e934b31253b
    source_path: install/nix.md
    workflow: 16
    postprocess_version: locale-links-v1
---

ثبّت OpenClaw تصريحيًا باستخدام **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** - وحدة Home Manager الرسمية الشاملة.

<Info>
مستودع [nix-openclaw](https://github.com/openclaw/nix-openclaw) هو مصدر الحقيقة لتثبيت Nix. هذه الصفحة نظرة عامة سريعة.
</Info>

## ما الذي تحصل عليه

- Gateway + تطبيق macOS + الأدوات (whisper، spotify، الكاميرات) -- جميعها مثبتة الإصدارات
- خدمة launchd تصمد بعد إعادة التشغيل
- نظام Plugin مع إعدادات تصريحية
- تراجع فوري: `home-manager switch --rollback`

## البدء السريع

<Steps>
  <Step title="ثبّت Determinate Nix">
    إذا لم يكن Nix مثبتًا بالفعل، فاتبع تعليمات [مثبّت Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="أنشئ flake محليًا">
    استخدم قالب agent-first من مستودع nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="اضبط الأسرار">
    أعدّ رمز بوت المراسلة ومفتاح API لمزوّد النموذج. الملفات النصية البسيطة في `~/.secrets/` تعمل جيدًا.
  </Step>
  <Step title="املأ عناصر نائبة القالب وبدّل">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="تحقّق">
    تأكّد من أن خدمة launchd قيد التشغيل وأن بوتك يرد على الرسائل.
  </Step>
</Steps>

راجع [README الخاص بـ nix-openclaw](https://github.com/openclaw/nix-openclaw) للاطلاع على جميع خيارات الوحدة والأمثلة.

## سلوك وقت التشغيل في وضع Nix

عند تعيين `OPENCLAW_NIX_MODE=1` (تلقائيًا مع nix-openclaw)، يدخل OpenClaw وضعًا حتميًا للتثبيتات المُدارة بواسطة Nix. يمكن لحزم Nix الأخرى تعيين الوضع نفسه؛ ويُعد nix-openclaw المرجع الرسمي.

يمكنك أيضًا تعيينه يدويًا:

```bash
export OPENCLAW_NIX_MODE=1
```

على macOS، لا يرث تطبيق الواجهة الرسومية متغيرات بيئة الصدفة تلقائيًا. فعّل وضع Nix عبر defaults بدلًا من ذلك:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### ما الذي يتغير في وضع Nix

- تُعطّل تدفقات التثبيت التلقائي والتعديل الذاتي
- يُعامل `openclaw.json` كملف غير قابل للتغيير. تبقى القيم الافتراضية المشتقة عند بدء التشغيل خاصة بوقت التشغيل فقط، وترفض كاتبات الإعدادات مثل الإعداد الأولي، والتهيئة، و`openclaw update` المُعدِّل، وتثبيت/تحديث/إلغاء تثبيت/تمكين Plugin، و`doctor --fix`، و`doctor --generate-gateway-token`، و`openclaw config set` تعديل الملف.
- ينبغي للوكلاء تعديل مصدر Nix بدلًا من ذلك. بالنسبة إلى nix-openclaw، استخدم [البدء السريع](https://github.com/openclaw/nix-openclaw#quick-start) الخاص بـ agent-first وعيّن الإعدادات ضمن `programs.openclaw.config` أو `instances.<name>.config`.
- تعرض الاعتماديات المفقودة رسائل إصلاح خاصة بـ Nix
- تعرض واجهة المستخدم شريط وضع Nix للقراءة فقط

### مسارات الإعدادات والحالة

يقرأ OpenClaw إعدادات JSON5 من `OPENCLAW_CONFIG_PATH` ويخزّن البيانات القابلة للتغيير في `OPENCLAW_STATE_DIR`. عند التشغيل تحت Nix، عيّن هذه القيم صراحةً إلى مواقع مُدارة بواسطة Nix حتى تبقى حالة وقت التشغيل والإعدادات خارج المخزن غير القابل للتغيير.

| المتغير                | الافتراضي                              |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### اكتشاف PATH للخدمة

تكتشف خدمة Gateway في launchd/systemd ثنائيات ملف تعريف Nix تلقائيًا بحيث تعمل
Plugin والأدوات التي تستدعي ملفات تنفيذية مثبتة عبر `nix` من الصدفة دون
إعداد PATH يدويًا:

- عند تعيين `NIX_PROFILES`، تُضاف كل خانة إلى PATH الخاص بالخدمة وفق
  أسبقية من اليمين إلى اليسار (تطابق أسبقية صدفة Nix - الأيمن يفوز).
- عند عدم تعيين `NIX_PROFILES`، يُضاف `~/.nix-profile/bin` كبديل احتياطي.

ينطبق هذا على بيئات خدمة macOS launchd وLinux systemd كليهما.

## ذات صلة

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    وحدة Home Manager مصدر الحقيقة ودليل الإعداد الكامل.
  </Card>
  <Card title="معالج الإعداد" href="/ar/start/wizard" icon="wand-magic-sparkles">
    شرح تفصيلي لإعداد CLI من دون Nix.
  </Card>
  <Card title="Docker" href="/ar/install/docker" icon="docker">
    إعداد حاويات كبديل غير قائم على Nix.
  </Card>
  <Card title="التحديث" href="/ar/install/updating" icon="arrow-up-right-from-square">
    تحديث التثبيتات المُدارة بواسطة Home Manager مع الحزمة.
  </Card>
</CardGroup>
