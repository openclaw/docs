---
read_when:
    - تريد عمليات تثبيت قابلة لإعادة الإنتاج وقابلة للتراجع
    - أنت تستخدم بالفعل Nix/NixOS/Home Manager
    - تريد تثبيت كل شيء وإدارته بشكل تصريحي
summary: ثبّت OpenClaw بشكل تصريحي باستخدام Nix
title: Nix
x-i18n:
    generated_at: "2026-05-06T08:01:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0c25b97fb46a906bb726a13de095ead1e6c3642d28f66173b488acfbc5e0001
    source_path: install/nix.md
    workflow: 16
---

ثبّت OpenClaw تصريحيًا باستخدام **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** - وحدة Home Manager جاهزة بالكامل.

<Info>
مستودع [nix-openclaw](https://github.com/openclaw/nix-openclaw) هو مصدر الحقيقة لتثبيت Nix. هذه الصفحة نظرة عامة سريعة.
</Info>

## ما الذي تحصل عليه

- Gateway + تطبيق macOS + أدوات (whisper, spotify, cameras) -- كلها مثبتة الإصدارات
- خدمة launchd تبقى بعد إعادة التشغيل
- نظام Plugin مع إعداد تصريحي
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
    أعدّ رمز بوت المراسلة ومفتاح API لمزوّد النماذج. تعمل الملفات النصية العادية في `~/.secrets/` بشكل جيد.
  </Step>
  <Step title="املأ عناصر القالب النائبة ثم بدّل">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="تحقق">
    تأكد من أن خدمة launchd قيد التشغيل وأن البوت يستجيب للرسائل.
  </Step>
</Steps>

راجع [README الخاص بـ nix-openclaw](https://github.com/openclaw/nix-openclaw) للاطلاع على خيارات الوحدة والأمثلة الكاملة.

## سلوك وقت التشغيل في وضع Nix

عند تعيين `OPENCLAW_NIX_MODE=1` (تلقائيًا مع nix-openclaw)، يدخل OpenClaw وضعًا حتميًا يعطّل مسارات التثبيت التلقائي.

يمكنك أيضًا تعيينه يدويًا:

```bash
export OPENCLAW_NIX_MODE=1
```

على macOS، لا يرث تطبيق الواجهة الرسومية متغيرات بيئة shell تلقائيًا. فعّل وضع Nix عبر defaults بدلًا من ذلك:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### ما الذي يتغير في وضع Nix

- تُعطّل مسارات التثبيت التلقائي والتعديل الذاتي
- تعرض التبعيات المفقودة رسائل معالجة خاصة بـ Nix
- تعرض واجهة المستخدم شريط وضع Nix للقراءة فقط

### مسارات الإعداد والحالة

يقرأ OpenClaw إعداد JSON5 من `OPENCLAW_CONFIG_PATH` ويخزّن البيانات القابلة للتغيير في `OPENCLAW_STATE_DIR`. عند التشغيل ضمن Nix، عيّن هذه القيم صراحةً إلى مواقع مُدارة بواسطة Nix حتى تبقى حالة وقت التشغيل والإعداد خارج المخزن غير القابل للتغيير.

| المتغير               | الافتراضي                                 |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### اكتشاف PATH للخدمة

تكتشف خدمة Gateway عبر launchd/systemd ملفات Nix-profile الثنائية تلقائيًا بحيث
تعمل Plugins والأدوات التي تستدعي ملفات تنفيذية مثبّتة عبر `nix` دون
إعداد PATH يدويًا:

- عند تعيين `NIX_PROFILES`، تُضاف كل خانة إلى PATH الخاص بالخدمة وفق
  أسبقية من اليمين إلى اليسار (يطابق أسبقية Nix shell - يفوز الأكثر يمينًا).
- عند عدم تعيين `NIX_PROFILES`، يُضاف `~/.nix-profile/bin` كخيار احتياطي.

ينطبق هذا على بيئات خدمة launchd في macOS وخدمة systemd في Linux.

## ذات صلة

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    وحدة Home Manager مصدر الحقيقة ودليل الإعداد الكامل.
  </Card>
  <Card title="معالج الإعداد" href="/ar/start/wizard" icon="wand-magic-sparkles">
    شرح تفصيلي لإعداد CLI بدون Nix.
  </Card>
  <Card title="Docker" href="/ar/install/docker" icon="docker">
    إعداد بالحاويات كبديل بدون Nix.
  </Card>
  <Card title="التحديث" href="/ar/install/updating" icon="arrow-up-right-from-square">
    تحديث التثبيتات المُدارة بواسطة Home Manager إلى جانب الحزمة.
  </Card>
</CardGroup>
