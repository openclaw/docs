---
read_when:
    - تحتاج إلى شرح مساحة عمل الوكيل أو بنية ملفاتها
    - تريد إنشاء نسخة احتياطية من مساحة عمل وكيل أو ترحيلها
sidebarTitle: Agent workspace
summary: 'مساحة عمل الوكيل: الموقع والتخطيط واستراتيجية النسخ الاحتياطي'
title: مساحة عمل الوكيل
x-i18n:
    generated_at: "2026-04-30T20:05:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1ccf74cbec3ff20f4c1c1ce52f099a7ca3365b2536b0aad6ff1d3a5fafcca0a
    source_path: concepts/agent-workspace.md
    workflow: 16
---

مساحة العمل هي موطن الوكيل. وهي دليل العمل الوحيد المستخدم لأدوات الملفات وسياق مساحة العمل. أبقها خاصة وتعامل معها كذاكرة.

هذا منفصل عن `~/.openclaw/`، الذي يخزن الإعدادات وبيانات الاعتماد والجلسات.

<Warning>
مساحة العمل هي **دليل العمل الحالي الافتراضي**، وليست صندوق عزل صارمًا. تحل الأدوات المسارات النسبية نسبةً إلى مساحة العمل، لكن المسارات المطلقة لا تزال قادرة على الوصول إلى أماكن أخرى على المضيف ما لم يكن العزل مفعّلًا. إذا كنت تحتاج إلى العزل، فاستخدم [`agents.defaults.sandbox`](/ar/gateway/sandboxing) (و/أو إعدادات العزل لكل وكيل).

عند تفعيل العزل وعدم كون `workspaceAccess` بقيمة `"rw"`، تعمل الأدوات داخل مساحة عمل معزولة تحت `~/.openclaw/sandboxes`، وليس داخل مساحة عمل المضيف لديك.
</Warning>

## الموقع الافتراضي

- الافتراضي: `~/.openclaw/workspace`
- إذا كان `OPENCLAW_PROFILE` مضبوطًا وليس `"default"`، يصبح الافتراضي `~/.openclaw/workspace-<profile>`.
- التجاوز في `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

سينشئ `openclaw onboard` أو `openclaw configure` أو `openclaw setup` مساحة العمل ويزرع ملفات التمهيد إذا كانت مفقودة.

<Note>
لا تقبل نُسخ بذور العزل إلا الملفات العادية داخل مساحة العمل؛ ويتم تجاهل الأسماء البديلة عبر الروابط الرمزية/الروابط الصلبة التي تُحل إلى خارج مساحة العمل المصدر.
</Note>

إذا كنت تدير ملفات مساحة العمل بنفسك بالفعل، يمكنك تعطيل إنشاء ملفات التمهيد:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## مجلدات مساحة عمل إضافية

ربما أنشأت التثبيتات الأقدم `~/openclaw`. قد يؤدي إبقاء عدة أدلة لمساحة العمل إلى التباس في المصادقة أو انحراف في الحالة، لأن مساحة عمل واحدة فقط تكون نشطة في كل مرة.

<Note>
**التوصية:** احتفظ بمساحة عمل نشطة واحدة. إذا لم تعد تستخدم المجلدات الإضافية، فأرشفها أو انقلها إلى سلة المهملات (مثلًا `trash ~/openclaw`). إذا كنت تحتفظ عمدًا بعدة مساحات عمل، فتأكد من أن `agents.defaults.workspace` يشير إلى المساحة النشطة.

يحذر `openclaw doctor` عندما يكتشف أدلة مساحة عمل إضافية.
</Note>

## خريطة ملفات مساحة العمل

هذه هي الملفات القياسية التي يتوقع OpenClaw وجودها داخل مساحة العمل:

<AccordionGroup>
  <Accordion title="AGENTS.md — تعليمات التشغيل">
    تعليمات تشغيل الوكيل وكيف ينبغي له استخدام الذاكرة. تُحمّل عند بدء كل جلسة. مكان مناسب للقواعد والأولويات وتفاصيل "كيفية التصرف".
  </Accordion>
  <Accordion title="SOUL.md — الشخصية والنبرة">
    الشخصية والنبرة والحدود. تُحمّل في كل جلسة. الدليل: [دليل شخصية SOUL.md](/ar/concepts/soul).
  </Accordion>
  <Accordion title="USER.md — من هو المستخدم">
    من هو المستخدم وكيفية مخاطبته. يُحمّل في كل جلسة.
  </Accordion>
  <Accordion title="IDENTITY.md — الاسم والطابع والرمز التعبيري">
    اسم الوكيل وطابعه ورمزه التعبيري. يُنشأ/يُحدّث أثناء طقس التمهيد.
  </Accordion>
  <Accordion title="TOOLS.md — أعراف الأدوات المحلية">
    ملاحظات حول أدواتك المحلية وأعرافها. لا تتحكم في إتاحة الأدوات؛ إنها إرشادات فقط.
  </Accordion>
  <Accordion title="HEARTBEAT.md — قائمة تحقق Heartbeat">
    قائمة تحقق صغيرة اختيارية لتشغيلات Heartbeat. اجعلها قصيرة لتجنب استهلاك الرموز.
  </Accordion>
  <Accordion title="BOOT.md — قائمة تحقق بدء التشغيل">
    قائمة تحقق اختيارية لبدء التشغيل تُشغّل تلقائيًا عند إعادة تشغيل Gateway (عند تفعيل [الخطافات الداخلية](/ar/automation/hooks)). اجعلها قصيرة؛ استخدم أداة الرسائل للإرسالات الصادرة.
  </Accordion>
  <Accordion title="BOOTSTRAP.md — طقس التشغيل الأول">
    طقس تشغيل أول لمرة واحدة. يُنشأ فقط لمساحة عمل جديدة تمامًا. احذفه بعد اكتمال الطقس.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — سجل الذاكرة اليومي">
    سجل ذاكرة يومي (ملف واحد لكل يوم). يُوصى بقراءة اليوم + أمس عند بدء الجلسة.
  </Accordion>
  <Accordion title="MEMORY.md — ذاكرة طويلة الأمد منتقاة (اختياري)">
    ذاكرة طويلة الأمد منتقاة. لا تُحمّل إلا في الجلسة الرئيسية الخاصة (وليس في سياقات مشتركة/جماعية). راجع [الذاكرة](/ar/concepts/memory) لمعرفة سير العمل وتفريغ الذاكرة التلقائي.
  </Accordion>
  <Accordion title="skills/ — Skills مساحة العمل (اختياري)">
    Skills خاصة بمساحة العمل. أعلى موقع أولوية للـ Skills في تلك المساحة. تتجاوز Skills وكيل المشروع، وSkills الوكيل الشخصية، وSkills المُدارة، وSkills المضمنة، و`skills.load.extraDirs` عند تعارض الأسماء.
  </Accordion>
  <Accordion title="canvas/ — ملفات واجهة Canvas (اختياري)">
    ملفات واجهة Canvas لعروض العقد (مثل `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
إذا كان أي ملف تمهيد مفقودًا، يحقن OpenClaw علامة "ملف مفقود" في الجلسة ويواصل. تُقتطع ملفات التمهيد الكبيرة عند حقنها؛ اضبط الحدود باستخدام `agents.defaults.bootstrapMaxChars` (الافتراضي: 12000) و`agents.defaults.bootstrapTotalMaxChars` (الافتراضي: 60000). يستطيع `openclaw setup` إعادة إنشاء الافتراضيات المفقودة دون الكتابة فوق الملفات الموجودة.
</Note>

## ما ليس موجودًا في مساحة العمل

توجد هذه تحت `~/.openclaw/` ويجب ألا تُلتزم إلى مستودع مساحة العمل:

- `~/.openclaw/openclaw.json` (الإعدادات)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (ملفات تعريف مصادقة النماذج: OAuth + مفاتيح API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (حساب تشغيل Codex لكل وكيل، والإعدادات، وSkills، وplugins، وحالة السلاسل الأصلية)
- `~/.openclaw/credentials/` (حالة القناة/المزوّد بالإضافة إلى بيانات استيراد OAuth القديمة)
- `~/.openclaw/agents/<agentId>/sessions/` (نصوص الجلسات + البيانات الوصفية)
- `~/.openclaw/skills/` (Skills مُدارة)

إذا كنت تحتاج إلى ترحيل الجلسات أو الإعدادات، فانسخها بشكل منفصل وأبقها خارج التحكم في الإصدارات.

## نسخ احتياطي عبر Git (موصى به، خاص)

تعامل مع مساحة العمل كذاكرة خاصة. ضعها في مستودع git **خاص** لكي تكون منسوخة احتياطيًا وقابلة للاستعادة.

شغّل هذه الخطوات على الجهاز الذي يعمل عليه Gateway (وهو مكان وجود مساحة العمل).

<Steps>
  <Step title="تهيئة المستودع">
    إذا كان git مثبتًا، تُهيّأ مساحات العمل الجديدة تمامًا تلقائيًا. إذا لم تكن مساحة العمل هذه مستودعًا بالفعل، فشغّل:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="إضافة مستودع بعيد خاص">
    <Tabs>
      <Tab title="واجهة GitHub على الويب">
        1. أنشئ مستودعًا **خاصًا** جديدًا على GitHub.
        2. لا تهيئه بملف README (لتجنب تعارضات الدمج).
        3. انسخ عنوان URL البعيد بصيغة HTTPS.
        4. أضف المستودع البعيد وادفع:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="واجهة GitLab على الويب">
        1. أنشئ مستودعًا **خاصًا** جديدًا على GitLab.
        2. لا تهيئه بملف README (لتجنب تعارضات الدمج).
        3. انسخ عنوان URL البعيد بصيغة HTTPS.
        4. أضف المستودع البعيد وادفع:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="التحديثات المستمرة">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## لا تلتزم الأسرار

<Warning>
حتى في مستودع خاص، تجنب تخزين الأسرار في مساحة العمل:

- مفاتيح API أو رموز OAuth أو كلمات المرور أو بيانات الاعتماد الخاصة.
- أي شيء تحت `~/.openclaw/`.
- التفريغات الخام للمحادثات أو المرفقات الحساسة.

إذا كان لا بد من تخزين مراجع حساسة، فاستخدم عناصر نائبة واحتفظ بالسر الحقيقي في مكان آخر (مدير كلمات المرور أو متغيرات البيئة أو `~/.openclaw/`).
</Warning>

بادئ `.gitignore` مقترح:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## نقل مساحة العمل إلى جهاز جديد

<Steps>
  <Step title="استنساخ المستودع">
    استنسخ المستودع إلى المسار المطلوب (الافتراضي `~/.openclaw/workspace`).
  </Step>
  <Step title="تحديث الإعدادات">
    اضبط `agents.defaults.workspace` على ذلك المسار في `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="زرع الملفات المفقودة">
    شغّل `openclaw setup --workspace <path>` لزرع أي ملفات مفقودة.
  </Step>
  <Step title="نسخ الجلسات (اختياري)">
    إذا كنت تحتاج إلى الجلسات، فانسخ `~/.openclaw/agents/<agentId>/sessions/` من الجهاز القديم بشكل منفصل.
  </Step>
</Steps>

## ملاحظات متقدمة

- يمكن لتوجيه عدة وكلاء استخدام مساحات عمل مختلفة لكل وكيل. راجع [توجيه القنوات](/ar/channels/channel-routing) لمعرفة إعدادات التوجيه.
- إذا كان `agents.defaults.sandbox` مفعّلًا، يمكن للجلسات غير الرئيسية استخدام مساحات عمل عزل لكل جلسة تحت `agents.defaults.sandbox.workspaceRoot`.

## ذات صلة

- [Heartbeat](/ar/gateway/heartbeat) — ملف مساحة العمل HEARTBEAT.md
- [العزل](/ar/gateway/sandboxing) — الوصول إلى مساحة العمل في البيئات المعزولة
- [الجلسة](/ar/concepts/session) — مسارات تخزين الجلسات
- [الأوامر الدائمة](/ar/automation/standing-orders) — تعليمات مستمرة في ملفات مساحة العمل
