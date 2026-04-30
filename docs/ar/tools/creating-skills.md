---
read_when:
    - أنت تنشئ مهارة مخصصة جديدة في مساحة عملك
    - تحتاج إلى سير عمل تمهيدي سريع لـ Skills المستندة إلى SKILL.md
summary: أنشئ واختبر Skills مخصصة لمساحة العمل باستخدام SKILL.md
title: إنشاء Skills
x-i18n:
    generated_at: "2026-04-30T08:29:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201718f4088f4243b0dabe12fb4fce4b8a7e64df9a4b7d651356ab4ae0dd3579
    source_path: tools/creating-skills.md
    workflow: 16
---

تعلّم Skills الوكيل كيف ومتى يستخدم الأدوات. كل skill هو دليل
يحتوي على ملف `SKILL.md` يتضمن بيانات تمهيدية بصيغة YAML وتعليمات markdown.

لمعرفة كيفية تحميل Skills وترتيب أولويتها، راجع [Skills](/ar/tools/skills).

## أنشئ أول skill لك

<Steps>
  <Step title="أنشئ دليل skill">
    توجد Skills في مساحة عملك. أنشئ مجلدًا جديدًا:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="اكتب SKILL.md">
    أنشئ `SKILL.md` داخل ذلك الدليل. تحدد البيانات التمهيدية بيانات التعريف،
    ويحتوي متن markdown على تعليمات للوكيل.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

    استخدم hyphen-case بأحرف صغيرة وأرقام وواصلات لاسم skill
    `name`. اجعل اسم المجلد و`name` في البيانات التمهيدية متطابقين.

  </Step>

  <Step title="أضف أدوات (اختياري)">
    يمكنك تعريف مخططات أدوات مخصصة في البيانات التمهيدية أو توجيه الوكيل
    لاستخدام أدوات النظام الموجودة (مثل `exec` أو `browser`). يمكن أن تُشحن Skills أيضًا
    داخل plugins إلى جانب الأدوات التي توثّقها.

  </Step>

  <Step title="حمّل skill">
    ابدأ جلسة جديدة حتى يلتقط OpenClaw skill:

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    تحقّق من تحميل skill:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="اختبره">
    أرسل رسالة ينبغي أن تشغّل skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    أو تحدّث فقط مع الوكيل واطلب تحية.

  </Step>
</Steps>

## مرجع بيانات skill الوصفية

تدعم البيانات التمهيدية YAML هذه الحقول:

| الحقل                               | مطلوب | الوصف                                                    |
| ----------------------------------- | -------- | -------------------------------------------------------------- |
| `name`                              | نعم      | معرّف فريد يستخدم أحرفًا صغيرة وأرقامًا وواصلات |
| `description`                       | نعم      | وصف من سطر واحد يظهر للوكيل                        |
| `metadata.openclaw.os`              | لا       | عامل تصفية نظام التشغيل (`["darwin"]`، `["linux"]`، إلخ.)                    |
| `metadata.openclaw.requires.bins`   | لا       | الثنائيات المطلوبة في PATH                                      |
| `metadata.openclaw.requires.config` | لا       | مفاتيح الإعدادات المطلوبة                                           |

## أفضل الممارسات

- **كن موجزًا** — وجّه النموذج إلى _ما_ يجب فعله، لا إلى كيفية كونه ذكاءً اصطناعيًا
- **السلامة أولًا** — إذا كانت skill تستخدم `exec`، فتأكد من أن المطالبات لا تسمح بحقن أوامر عشوائية من مُدخلات غير موثوقة
- **اختبر محليًا** — استخدم `openclaw agent --message "..."` للاختبار قبل المشاركة
- **استخدم ClawHub** — تصفّح Skills وساهم بها في [ClawHub](https://clawhub.ai)

## أين توجد Skills

| الموقع                        | الأسبقية | النطاق                 |
| ------------------------------- | ---------- | --------------------- |
| `\<workspace\>/skills/`         | الأعلى    | لكل وكيل             |
| `\<workspace\>/.agents/skills/` | عالية       | لكل وكيل في مساحة العمل   |
| `~/.agents/skills/`             | متوسطة     | ملف وكيل شخصي مشترك  |
| `~/.openclaw/skills/`           | متوسطة     | مشترك (كل الوكلاء)   |
| مضمّن (مشحون مع OpenClaw) | منخفضة        | عام                |
| `skills.load.extraDirs`         | الأدنى     | مجلدات مشتركة مخصصة |

## ذو صلة

- [مرجع Skills](/ar/tools/skills) — قواعد التحميل والأسبقية والبوابات
- [إعدادات Skills](/ar/tools/skills-config) — مخطط إعدادات `skills.*`
- [ClawHub](/ar/tools/clawhub) — سجل Skills عام
- [بناء Plugins](/ar/plugins/building-plugins) — يمكن أن تشحن plugins Skills
