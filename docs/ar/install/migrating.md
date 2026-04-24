---
read_when:
    - أنت تنقل OpenClaw إلى حاسوب محمول/خادم جديد
    - تريد الحفاظ على الجلسات والمصادقة وتسجيلات دخول القنوات (مثل WhatsApp وغيره)
summary: نقل (ترحيل) تثبيت OpenClaw من جهاز إلى آخر
title: دليل الترحيل
x-i18n:
    generated_at: "2026-04-24T07:49:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c14be563d1eb052726324678cf2784efffc2341aa17f662587fdabe1d8ec1e2
    source_path: install/migrating.md
    workflow: 15
---

# ترحيل OpenClaw إلى جهاز جديد

ينقل هذا الدليل Gateway الخاصة بـ OpenClaw إلى جهاز جديد من دون إعادة تنفيذ الإعداد الأولي.

## ما الذي يتم ترحيله

عند نسخ **دليل الحالة** ‏(`~/.openclaw/` افتراضيًا) و**workspace** الخاصة بك، فإنك تحتفظ بما يلي:

- **التهيئة** -- ‏`openclaw.json` وكل إعدادات Gateway
- **المصادقة** -- ‏`auth-profiles.json` لكل وكيل (مفاتيح API + OAuth)، بالإضافة إلى أي حالة خاصة بالقنوات/المزوّدات تحت `credentials/`
- **الجلسات** -- سجل المحادثات وحالة الوكيل
- **حالة القنوات** -- تسجيل دخول WhatsApp، وجلسة Telegram، وما إلى ذلك
- **ملفات workspace** -- ‏`MEMORY.md` و`USER.md` وSkills وprompts

<Tip>
شغّل `openclaw status` على الجهاز القديم لتأكيد مسار دليل الحالة لديك.
تستخدم ملفات التعريف المخصصة `~/.openclaw-<profile>/` أو مسارًا مضبوطًا عبر `OPENCLAW_STATE_DIR`.
</Tip>

## خطوات الترحيل

<Steps>
  <Step title="أوقف Gateway وأنشئ نسخة احتياطية">
    على الجهاز **القديم**، أوقف Gateway حتى لا تتغير الملفات أثناء النسخ، ثم أنشئ أرشيفًا:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    إذا كنت تستخدم ملفات تعريف متعددة (مثل `~/.openclaw-work`)، فأرشف كلًا منها بشكل منفصل.

  </Step>

  <Step title="ثبّت OpenClaw على الجهاز الجديد">
    قم بـ [تثبيت](/ar/install) CLI ‏(وNode عند الحاجة) على الجهاز الجديد.
    لا بأس إذا أنشأ الإعداد الأولي مجلد `~/.openclaw/` جديدًا — فسوف تستبدله لاحقًا.
  </Step>

  <Step title="انسخ دليل الحالة وworkspace">
    انقل الأرشيف عبر `scp` أو `rsync -a` أو قرص خارجي، ثم فك ضغطه:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    تأكد من تضمين الأدلة المخفية وأن ملكية الملفات تطابق المستخدم الذي سيشغّل Gateway.

  </Step>

  <Step title="شغّل Doctor وتحقق">
    على الجهاز الجديد، شغّل [Doctor](/ar/gateway/doctor) لتطبيق ترحيلات التهيئة وإصلاح الخدمات:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## مشكلات شائعة

<AccordionGroup>
  <Accordion title="عدم تطابق ملف التعريف أو دليل الحالة">
    إذا كانت Gateway القديمة تستخدم `--profile` أو `OPENCLAW_STATE_DIR` والجديدة لا تستخدم ذلك،
    فستبدو القنوات وكأنها مسجّلة الخروج وستكون الجلسات فارغة.
    شغّل Gateway باستخدام **ملف التعريف أو دليل الحالة نفسه** الذي قمت بترحيله، ثم أعد تشغيل `openclaw doctor`.
  </Accordion>

  <Accordion title="نسخ openclaw.json فقط">
    لا يكفي ملف التهيئة وحده. إذ تعيش ملفات تعريف مصادقة النماذج تحت
    `agents/<agentId>/agent/auth-profiles.json`, بينما لا تزال حالة القنوات/المزوّدات
    تعيش تحت `credentials/`. احرص دائمًا على ترحيل **دليل الحالة بالكامل**.
  </Accordion>

  <Accordion title="الأذونات والملكية">
    إذا نسخت كـ root أو بدّلت المستخدمين، فقد تفشل Gateway في قراءة بيانات الاعتماد.
    تأكد من أن دليل الحالة وworkspace مملوكان للمستخدم الذي يشغّل Gateway.
  </Accordion>

  <Accordion title="الوضع البعيد">
    إذا كانت واجهة المستخدم لديك تشير إلى Gateway **بعيدة**، فإن المضيف البعيد هو من يملك الجلسات وworkspace.
    رحّل مضيف Gateway نفسه، وليس الحاسوب المحمول المحلي لديك. راجع [الأسئلة الشائعة](/ar/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="الأسرار في النسخ الاحتياطية">
    يحتوي دليل الحالة على ملفات تعريف المصادقة، وبيانات اعتماد القنوات، وحالة
    المزوّدات الأخرى.
    خزّن النسخ الاحتياطية مشفّرة، وتجنب قنوات النقل غير الآمنة، ودوّر المفاتيح إذا شككت في حدوث كشف.
  </Accordion>
</AccordionGroup>

## قائمة التحقق

على الجهاز الجديد، تأكد من:

- [ ] أن `openclaw status` يُظهر Gateway قيد التشغيل
- [ ] أن القنوات ما تزال متصلة (ولا حاجة إلى إعادة الاقتران)
- [ ] أن لوحة المعلومات تفتح وتعرض الجلسات الموجودة
- [ ] أن ملفات workspace ‏(الذاكرة، والتهيئات) موجودة

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [ترحيل Matrix](/ar/install/migrating-matrix)
- [إلغاء التثبيت](/ar/install/uninstall)
