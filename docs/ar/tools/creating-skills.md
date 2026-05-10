---
read_when:
    - أنت تنشئ مهارة مخصصة جديدة في مساحة عملك
    - تحتاج إلى سير عمل سريع للبدء في Skills القائمة على SKILL.md
summary: أنشئ واختبر Skills مخصصة لمساحة العمل باستخدام SKILL.md
title: إنشاء Skills
x-i18n:
    generated_at: "2026-05-10T20:03:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: a468a0b21f4e43542b175b8acb8ad8b19dbbea06ce8e0b97c48206bf88a661c5
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills تعلّم الوكيل كيف ومتى يستخدم الأدوات. كل مهارة هي دليل
يحتوي على ملف `SKILL.md` يتضمن frontmatter بصيغة YAML وتعليمات markdown.

للتعرّف على كيفية تحميل Skills وترتيب أولويتها، راجع [Skills](/ar/tools/skills).

## أنشئ أول مهارة لك

<Steps>
  <Step title="أنشئ دليل المهارة">
    تعيش Skills في مساحة عملك. أنشئ مجلدًا جديدًا:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="اكتب SKILL.md">
    أنشئ `SKILL.md` داخل ذلك الدليل. يعرّف frontmatter البيانات الوصفية،
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

    استخدم hyphen-case بأحرف صغيرة وأرقام وواصلات لاسم المهارة
    `name`. أبقِ اسم المجلد و`name` في frontmatter متطابقين.

  </Step>

  <Step title="أضف أدوات (اختياري)">
    يمكنك تعريف مخططات أدوات مخصصة في frontmatter أو إرشاد الوكيل
    إلى استخدام أدوات النظام الحالية (مثل `exec` أو `browser`). يمكن أيضًا أن
    تُشحن Skills داخل الإضافات إلى جانب الأدوات التي توثقها.

  </Step>

  <Step title="حمّل المهارة">
    ابدأ جلسة جديدة لكي يلتقط OpenClaw المهارة:

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    تحقّق من تحميل المهارة:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="اختبرها">
    أرسل رسالة ينبغي أن تشغّل المهارة:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    أو تحدّث ببساطة مع الوكيل واطلب تحية.

  </Step>
</Steps>

## مرجع بيانات المهارة الوصفية

يدعم frontmatter بصيغة YAML هذه الحقول:

| الحقل                               | مطلوب | الوصف                                                    |
| ----------------------------------- | -------- | -------------------------------------------------------------- |
| `name`                              | نعم      | معرّف فريد يستخدم أحرفًا صغيرة وأرقامًا وواصلات |
| `description`                       | نعم      | وصف من سطر واحد يظهر للوكيل                        |
| `metadata.openclaw.os`              | لا       | مرشح نظام التشغيل (`["darwin"]`, `["linux"]`, إلخ)                    |
| `metadata.openclaw.requires.bins`   | لا       | الثنائيات المطلوبة في PATH                                      |
| `metadata.openclaw.requires.config` | لا       | مفاتيح الإعدادات المطلوبة                                           |

## أفضل الممارسات

- **كن موجزًا** — أرشد النموذج إلى _ما_ يجب فعله، لا إلى كيف يكون ذكاءً اصطناعيًا
- **السلامة أولًا** — إذا كانت مهارتك تستخدم `exec`، فتأكد من أن المطالبات لا تسمح بحقن أوامر عشوائية من إدخال غير موثوق
- **اختبر محليًا** — استخدم `openclaw agent --message "..."` للاختبار قبل المشاركة
- **استخدم ClawHub** — تصفح Skills وساهم بها في [ClawHub](https://clawhub.ai)

## أين توجد Skills

| الموقع                        | الأسبقية | النطاق                 |
| ------------------------------- | ---------- | --------------------- |
| `\<workspace\>/skills/`         | الأعلى    | لكل وكيل             |
| `\<workspace\>/.agents/skills/` | عالية       | لكل وكيل في مساحة العمل   |
| `~/.agents/skills/`             | متوسطة     | ملف تعريف وكيل مشترك  |
| `~/.openclaw/skills/`           | متوسطة     | مشتركة (كل الوكلاء)   |
| مضمّنة (مشحونة مع OpenClaw) | منخفضة        | عام                |
| `skills.load.extraDirs`         | الأدنى     | مجلدات مشتركة مخصصة |

## ذات صلة

- [مرجع Skills](/ar/tools/skills) — قواعد التحميل والأسبقية والحجب
- [إعدادات Skills](/ar/tools/skills-config) — مخطط إعدادات `skills.*`
- [ClawHub](/ar/clawhub) — سجل المهارات العام
- [بناء الإضافات](/ar/plugins/building-plugins) — يمكن للإضافات شحن Skills
