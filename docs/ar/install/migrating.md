---
read_when:
    - أنت تنقل OpenClaw إلى حاسوب محمول جديد أو خادم جديد
    - أنت تنتقل من نظام وكلاء آخر وتريد الاحتفاظ بالحالة
    - أنت تقوم بترقية Plugin في موضعه
summary: 'مركز الترحيل: عمليات الاستيراد عبر الأنظمة، وعمليات النقل من آلة إلى آلة، وترقيات Plugin'
title: دليل الترحيل
x-i18n:
    generated_at: "2026-05-02T07:34:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: e447e38cf0086603a7b30ee5204e63cc8227ebc7a56add26d06ac2798a23e26f
    source_path: install/migrating.md
    workflow: 16
    postprocess_version: locale-links-v1
---

يدعم OpenClaw ثلاثة مسارات للترحيل: الاستيراد من نظام وكيل آخر، ونقل تثبيت قائم إلى جهاز جديد، وترقية Plugin في موضعه.

## الاستيراد من نظام وكيل آخر

استخدم مزوّدي الترحيل المضمّنين لجلب التعليمات، وخوادم MCP، وSkills، وإعدادات النموذج، ومفاتيح API (اختياريًا) إلى OpenClaw. تُعرَض الخطط للمعاينة قبل أي تغيير، وتُحجَب الأسرار في التقارير، ويستند التطبيق إلى نسخة احتياطية مُتحقَّق منها.

<CardGroup cols={2}>
  <Card title="الترحيل من Claude" href="/ar/install/migrating-claude" icon="brain">
    استورِد حالة Claude Code وClaude Desktop، بما في ذلك `CLAUDE.md`، وخوادم MCP، وSkills، وأوامر المشروع.
  </Card>
  <Card title="الترحيل من Hermes" href="/ar/install/migrating-hermes" icon="feather">
    استورِد إعدادات Hermes، والمزوّدين، وخوادم MCP، والذاكرة، وSkills، ومفاتيح `.env` المدعومة.
  </Card>
</CardGroup>

نقطة دخول CLI هي [`openclaw migrate`](/ar/cli/migrate). يمكن للإعداد الأولي أيضًا عرض الترحيل عندما يكتشف مصدرًا معروفًا (`openclaw onboard --flow import`).

## نقل OpenClaw إلى جهاز جديد

انسخ **دليل الحالة** (`~/.openclaw/` افتراضيًا) و**مساحة العمل** لديك للحفاظ على:

- **الإعدادات** — `openclaw.json` وجميع إعدادات Gateway.
- **المصادقة** — ملف `auth-profiles.json` لكل وكيل (مفاتيح API بالإضافة إلى OAuth)، وأي حالة قناة أو مزوّد ضمن `credentials/`.
- **الجلسات** — سجل المحادثات وحالة الوكيل.
- **حالة القنوات** — تسجيل دخول WhatsApp، وجلسة Telegram، وما شابه ذلك.
- **ملفات مساحة العمل** — `MEMORY.md`، و`USER.md`، وSkills، والمطالبات.

<Tip>
شغّل `openclaw status` على الجهاز القديم لتأكيد مسار دليل الحالة. تستخدم الملفات الشخصية المخصصة `~/.openclaw-<profile>/` أو مسارًا مضبوطًا عبر `OPENCLAW_STATE_DIR`.
</Tip>

### خطوات الترحيل

<Steps>
  <Step title="إيقاف Gateway والنسخ الاحتياطي">
    على الجهاز **القديم**، أوقف Gateway حتى لا تتغيّر الملفات أثناء النسخ، ثم أرشِف:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    إذا كنت تستخدم عدة ملفات شخصية (على سبيل المثال `~/.openclaw-work`)، فأرشِف كلًا منها على حدة.

  </Step>

  <Step title="تثبيت OpenClaw على الجهاز الجديد">
    [ثبّت](/ar/install) CLI (وNode إذا لزم الأمر) على الجهاز الجديد. لا بأس إذا أنشأ الإعداد الأولي دليل `~/.openclaw/` جديدًا. ستستبدله في الخطوة التالية.
  </Step>

  <Step title="نسخ دليل الحالة ومساحة العمل">
    انقل الأرشيف عبر `scp`، أو `rsync -a`، أو محرك أقراص خارجي، ثم استخرجه:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    تأكد من تضمين الأدلة المخفية وأن ملكية الملفات تطابق المستخدم الذي سيشغّل Gateway.

  </Step>

  <Step title="تشغيل doctor والتحقق">
    على الجهاز الجديد، شغّل [Doctor](/ar/gateway/doctor) لتطبيق ترحيلات الإعدادات وإصلاح الخدمات:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

إذا كان Telegram أو Discord يستخدم الرجوع الافتراضي إلى متغيرات البيئة (`TELEGRAM_BOT_TOKEN` أو `DISCORD_BOT_TOKEN`)، فتحقق من أن ملف `.env` في دليل الحالة المرحّل يحتوي على تلك المفاتيح دون طباعة قيم الأسرار:

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

يحذّر `openclaw doctor` أيضًا عندما لا يكون لحساب Telegram أو Discord افتراضي مفعّل رمز مهيّأ، ويكون متغير البيئة المطابق غير متاح لعملية doctor.

### الأخطاء الشائعة

<AccordionGroup>
  <Accordion title="عدم تطابق الملف الشخصي أو دليل الحالة">
    إذا كان Gateway القديم يستخدم `--profile` أو `OPENCLAW_STATE_DIR` والجديد لا يستخدمهما، فستظهر القنوات وكأنها غير مسجّلة الدخول وستكون الجلسات فارغة. شغّل Gateway باستخدام **نفس** الملف الشخصي أو دليل الحالة الذي رحّلته، ثم أعد تشغيل `openclaw doctor`.
  </Accordion>

  <Accordion title="نسخ openclaw.json فقط">
    ملف الإعدادات وحده غير كافٍ. تعيش ملفات تعريف مصادقة النموذج ضمن `agents/<agentId>/agent/auth-profiles.json`، وتعيش حالة القنوات والمزوّدين ضمن `credentials/`. رحّل دائمًا دليل الحالة **بالكامل**.
  </Accordion>

  <Accordion title="الأذونات والملكية">
    إذا نسخت الملفات كمستخدم root أو بدّلت المستخدمين، فقد يفشل Gateway في قراءة بيانات الاعتماد. تأكد من أن دليل الحالة ومساحة العمل مملوكان للمستخدم الذي يشغّل Gateway.
  </Accordion>

  <Accordion title="الوضع البعيد">
    إذا كانت واجهتك تشير إلى Gateway **بعيد**، فإن المضيف البعيد يملك الجلسات ومساحة العمل. رحّل مضيف Gateway نفسه، لا حاسوبك المحمول المحلي. راجع [الأسئلة الشائعة](/ar/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="الأسرار في النسخ الاحتياطية">
    يحتوي دليل الحالة على ملفات تعريف المصادقة، وبيانات اعتماد القنوات، وحالة مزوّدين أخرى. خزّن النسخ الاحتياطية مشفّرة، وتجنّب قنوات النقل غير الآمنة، ودوّر المفاتيح إذا اشتبهت في تعرضها.
  </Accordion>
</AccordionGroup>

### قائمة التحقق

على الجهاز الجديد، تأكد مما يلي:

- [ ] يعرض `openclaw status` أن Gateway قيد التشغيل.
- [ ] ما زالت القنوات متصلة (لا حاجة إلى إعادة الاقتران).
- [ ] تُفتح لوحة المعلومات وتعرض الجلسات الحالية.
- [ ] ملفات مساحة العمل (الذاكرة، والإعدادات) موجودة.

## ترقية Plugin في موضعه

تحافظ ترقيات Plugin في موضعه على معرّف Plugin نفسه ومفاتيح الإعدادات نفسها، لكنها قد تنقل الحالة على القرص إلى التخطيط الحالي. توجد أدلة الترقية الخاصة بكل Plugin بجانب قنواته:

- [ترحيل Matrix](/ar/channels/matrix-migration): حدود استرداد الحالة المشفّرة، وسلوك اللقطة التلقائي، وأوامر الاسترداد اليدوية.

## ذو صلة

- [`openclaw migrate`](/ar/cli/migrate): مرجع CLI للاستيرادات بين الأنظمة.
- [نظرة عامة على التثبيت](/ar/install): جميع طرق التثبيت.
- [Doctor](/ar/gateway/doctor): فحص السلامة بعد الترحيل.
- [إلغاء التثبيت](/ar/install/uninstall): إزالة OpenClaw بالكامل.
