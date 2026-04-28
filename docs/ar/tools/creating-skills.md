---
read_when:
- You are creating a new custom skill in your workspace
- تحتاج إلى سير عمل تمهيدي سريع لـ Skills المعتمدة على SKILL.md
summary: بناء واختبار Skills مخصصة لمساحة العمل باستخدام SKILL.md
title: إنشاء Skills
x-i18n:
  generated_at: '2026-04-24T08:08:09Z'
  refreshed_at: '2026-04-28T05:14:37Z'
  model: gpt-5.4
  provider: openai
  source_hash: df9249e14936c65143580a6618679cf2d79a2960390e5c7afc5dbea1a9a6e045
  source_path: tools/creating-skills.md
  workflow: 15
---

تُعلّم Skills الوكيل كيف ومتى يستخدم الأدوات. كل Skill عبارة عن دليل
يحتوي على ملف `SKILL.md` مع YAML frontmatter وتعليمات بصيغة markdown.

للتعرّف على كيفية تحميل Skills وترتيب أولويتها، راجع [Skills](/ar/tools/skills).

## أنشئ أول Skill لك

<Steps>
  <Step title="أنشئ دليل Skill">
    تعيش Skills داخل مساحة عملك. أنشئ مجلدًا جديدًا:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="اكتب SKILL.md">
    أنشئ `SKILL.md` داخل ذلك الدليل. يعرّف frontmatter البيانات الوصفية،
    بينما يحتوي متن markdown على التعليمات الخاصة بالوكيل.

    ```markdown
    ---
    name: hello_world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

  </Step>

  <Step title="أضف أدوات (اختياري)">
    يمكنك تعريف مخططات أدوات مخصصة في frontmatter أو توجيه الوكيل
    إلى استخدام الأدوات النظامية الموجودة (مثل `exec` أو `browser`). ويمكن لـ Skills أيضًا
    أن تُشحن داخل Plugins إلى جانب الأدوات التي توثّقها.

  </Step>

  <Step title="حمّل Skill">
    ابدأ جلسة جديدة حتى يلتقط OpenClaw الـ Skill:

    ```bash
    # من الدردشة
    /new

    # أو أعد تشغيل gateway
    openclaw gateway restart
    ```

    تحقّق من تحميل Skill:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="اختبرها">
    أرسل رسالة من المفترض أن تفعّل Skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    أو ببساطة تحدّث مع الوكيل واطلب تحية.

  </Step>
</Steps>

## مرجع البيانات الوصفية لـ Skill

يدعم YAML frontmatter هذه الحقول:

| الحقل                               | مطلوب | الوصف                                      |
| ----------------------------------- | ------ | ------------------------------------------ |
| `name`                              | نعم    | معرّف فريد (`snake_case`)                  |
| `description`                       | نعم    | وصف من سطر واحد يُعرض للوكيل              |
| `metadata.openclaw.os`              | لا     | مرشح نظام التشغيل (`["darwin"]`، `["linux"]`، إلخ) |
| `metadata.openclaw.requires.bins`   | لا     | ملفات ثنائية مطلوبة على PATH              |
| `metadata.openclaw.requires.config` | لا     | مفاتيح تكوين مطلوبة                        |

## أفضل الممارسات

- **كن موجزًا** — وجّه النموذج إلى _ما_ يجب فعله، وليس كيف يكون ذكاءً اصطناعيًا
- **السلامة أولًا** — إذا كانت Skill تستخدم `exec`، فتأكد من أن المطالبات لا تسمح بحقن أوامر عشوائية من مدخلات غير موثوقة
- **اختبر محليًا** — استخدم `openclaw agent --message "..."` للاختبار قبل المشاركة
- **استخدم ClawHub** — تصفح Skills وساهم بها على [ClawHub](https://clawhub.ai)

## أين تعيش Skills

| الموقع                           | الأسبقية | النطاق                |
| -------------------------------- | -------- | --------------------- |
| `\<workspace\>/skills/`          | الأعلى   | لكل وكيل              |
| `\<workspace\>/.agents/skills/`  | مرتفع    | وكيل لكل مساحة عمل    |
| `~/.agents/skills/`              | متوسط    | ملف تعريف وكيل مشترك  |
| `~/.openclaw/skills/`            | متوسط    | مشترك (كل الوكلاء)    |
| مضمّنة (تُشحن مع OpenClaw)       | منخفض    | عام                   |
| `skills.load.extraDirs`          | الأدنى   | مجلدات مشتركة مخصصة   |

## ذو صلة

- [مرجع Skills](/ar/tools/skills) — قواعد التحميل، والأسبقية، والتقييد
- [تكوين Skills](/ar/tools/skills-config) — مخطط التكوين `skills.*`
- [ClawHub](/ar/tools/clawhub) — سجل Skills العام
- [بناء Plugins](/ar/plugins/building-plugins) — يمكن للـ Plugins أن تُشحن مع Skills
