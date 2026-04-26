---
read_when:
    - تحتاج إلى شرح مساحة عمل الوكيل أو بنية ملفاته
    - تريد نسخ مساحة عمل الوكيل احتياطيًا أو ترحيلها
sidebarTitle: Agent workspace
summary: 'مساحة عمل الوكيل: الموقع، والبنية، واستراتيجية النسخ الاحتياطي'
title: مساحة عمل الوكيل
x-i18n:
    generated_at: "2026-04-26T11:27:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35d59d1f0dec05db30f9166a43bfa519d7299b08d093bbeb905d8f83e5cd022a
    source_path: concepts/agent-workspace.md
    workflow: 15
---

مساحة العمل هي موطن الوكيل. وهي دليل العمل الوحيد المستخدم لأدوات الملفات ولسياق مساحة العمل. احتفظ بها خاصة وتعامل معها على أنها ذاكرة.

وهذا منفصل عن `~/.openclaw/`، الذي يخزن الإعدادات، وبيانات الاعتماد، والجلسات.

<Warning>
مساحة العمل هي **cwd الافتراضي**، وليست صندوق حماية صارمًا. تحل الأدوات المسارات النسبية اعتمادًا على مساحة العمل، لكن المسارات المطلقة يمكنها مع ذلك الوصول إلى أماكن أخرى على المضيف ما لم يتم تفعيل sandboxing. إذا كنت تحتاج إلى عزل، فاستخدم [`agents.defaults.sandbox`](/ar/gateway/sandboxing) (و/أو إعداد sandbox لكل وكيل).

عند تفعيل sandboxing وعندما لا تكون قيمة `workspaceAccess` هي `"rw"`، تعمل الأدوات داخل مساحة عمل sandbox ضمن `~/.openclaw/sandboxes`، وليس ضمن مساحة العمل على المضيف.
</Warning>

## الموقع الافتراضي

- الافتراضي: `~/.openclaw/workspace`
- إذا كانت `OPENCLAW_PROFILE` مضبوطة وليست `"default"`، يصبح الافتراضي `~/.openclaw/workspace-<profile>`.
- يمكنك التجاوز في `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

سيقوم `openclaw onboard` أو `openclaw configure` أو `openclaw setup` بإنشاء مساحة العمل وملء ملفات التهيئة الأولية إذا كانت مفقودة.

<Note>
تقبل عمليات نسخ البذور الخاصة بـ sandbox فقط الملفات العادية داخل مساحة العمل؛ ويتم تجاهل الأسماء المستعارة من نوع symlink/hardlink التي تُحل إلى خارج مساحة العمل المصدر.
</Note>

إذا كنت تدير ملفات مساحة العمل بنفسك بالفعل، يمكنك تعطيل إنشاء ملفات التهيئة الأولية:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## مجلدات مساحة العمل الإضافية

قد تكون عمليات التثبيت الأقدم قد أنشأت `~/openclaw`. وقد يؤدي الاحتفاظ بعدة أدلة لمساحة العمل إلى انجراف مربك في المصادقة أو الحالة، لأن مساحة عمل واحدة فقط تكون نشطة في كل مرة.

<Note>
**التوصية:** احتفظ بمساحة عمل نشطة واحدة. إذا لم تعد تستخدم المجلدات الإضافية، فأرشفها أو انقلها إلى سلة المهملات (مثل `trash ~/openclaw`). وإذا كنت تحتفظ عمدًا بعدة مساحات عمل، فتأكد من أن `agents.defaults.workspace` يشير إلى المساحة النشطة.

يحذّر `openclaw doctor` عندما يكتشف أدلة إضافية لمساحة العمل.
</Note>

## خريطة ملفات مساحة العمل

هذه هي الملفات القياسية التي يتوقع OpenClaw وجودها داخل مساحة العمل:

<AccordionGroup>
  <Accordion title="AGENTS.md — تعليمات التشغيل">
    تعليمات التشغيل الخاصة بالوكيل وكيفية استخدامه للذاكرة. تُحمَّل في بداية كل جلسة. وهو مكان جيد للقواعد، والأولويات، وتفاصيل "كيفية التصرف".
  </Accordion>
  <Accordion title="SOUL.md — الشخصية والنبرة">
    الشخصية، والنبرة، والحدود. يُحمَّل في كل جلسة. الدليل: [دليل شخصية SOUL.md](/ar/concepts/soul).
  </Accordion>
  <Accordion title="USER.md — من هو المستخدم">
    من هو المستخدم وكيفية مخاطبته. يُحمَّل في كل جلسة.
  </Accordion>
  <Accordion title="IDENTITY.md — الاسم، والطابع، والإيموجي">
    اسم الوكيل، وطابعه، والإيموجي الخاص به. يتم إنشاؤه/تحديثه أثناء طقس التهيئة الأولية.
  </Accordion>
  <Accordion title="TOOLS.md — اصطلاحات الأدوات المحلية">
    ملاحظات حول أدواتك المحلية والاصطلاحات. لا تتحكم في إتاحة الأدوات؛ فهي مجرد إرشادات.
  </Accordion>
  <Accordion title="HEARTBEAT.md — قائمة التحقق لـ Heartbeat">
    قائمة تحقق صغيرة اختيارية لتشغيلات Heartbeat. اجعلها قصيرة لتجنب استهلاك tokens.
  </Accordion>
  <Accordion title="BOOT.md — قائمة التحقق عند بدء التشغيل">
    قائمة تحقق اختيارية عند بدء التشغيل تُشغَّل تلقائيًا عند إعادة تشغيل gateway (عند تفعيل [الخطافات الداخلية](/ar/automation/hooks)). اجعلها قصيرة؛ واستخدم أداة message للإرسالات الصادرة.
  </Accordion>
  <Accordion title="BOOTSTRAP.md — طقس التشغيل الأول">
    طقس لمرة واحدة عند التشغيل الأول. لا يُنشأ إلا لمساحة عمل جديدة تمامًا. احذفه بعد اكتمال الطقس.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — سجل الذاكرة اليومي">
    سجل ذاكرة يومي (ملف واحد لكل يوم). يُنصح بقراءة ملف اليوم + الأمس عند بداية الجلسة.
  </Accordion>
  <Accordion title="MEMORY.md — ذاكرة طويلة الأمد منسّقة (اختياري)">
    ذاكرة طويلة الأمد منسّقة. لا تُحمَّل إلا في الجلسة الرئيسية الخاصة (وليس في السياقات المشتركة/الجماعية). راجع [الذاكرة](/ar/concepts/memory) لسير العمل وتفريغ الذاكرة التلقائي.
  </Accordion>
  <Accordion title="skills/ — Skills مساحة العمل (اختياري)">
    Skills خاصة بمساحة العمل. وهي موقع Skills الأعلى أولوية لتلك المساحة. وتتجاوز Skills وكيل المشروع، وSkills الوكيل الشخصي، وSkills المُدارة، وSkills المضمّنة، و`skills.load.extraDirs` عند تعارض الأسماء.
  </Accordion>
  <Accordion title="canvas/ — ملفات واجهة Canvas (اختياري)">
    ملفات واجهة Canvas لعرض العقد (مثل `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
إذا كان أي ملف من ملفات التهيئة الأولية مفقودًا، يحقن OpenClaw علامة "ملف مفقود" في الجلسة ويتابع. وتُقتطع ملفات التهيئة الأولية الكبيرة عند حقنها؛ عدّل الحدود عبر `agents.defaults.bootstrapMaxChars` (الافتراضي: 12000) و`agents.defaults.bootstrapTotalMaxChars` (الافتراضي: 60000). ويمكن لـ `openclaw setup` إعادة إنشاء القيم الافتراضية المفقودة من دون الكتابة فوق الملفات الموجودة.
</Note>

## ما الذي لا يوجد في مساحة العمل

توجد هذه العناصر تحت `~/.openclaw/` ويجب **ألا** تُدرج في مستودع مساحة العمل:

- `~/.openclaw/openclaw.json` (الإعدادات)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (ملفات تعريف مصادقة model: OAuth + API keys)
- `~/.openclaw/credentials/` (حالة القناة/provider بالإضافة إلى بيانات استيراد OAuth القديمة)
- `~/.openclaw/agents/<agentId>/sessions/` (نصوص الجلسات + البيانات الوصفية)
- `~/.openclaw/skills/` (Skills المُدارة)

إذا كنت بحاجة إلى ترحيل الجلسات أو الإعدادات، فانسخها بشكل منفصل وأبقها خارج التحكم في الإصدارات.

## النسخ الاحتياطي عبر Git (موصى به، خاص)

تعامل مع مساحة العمل على أنها ذاكرة خاصة. ضعها في مستودع git **خاص** حتى تكون منسوخة احتياطيًا وقابلة للاستعادة.

نفّذ هذه الخطوات على الجهاز الذي يعمل عليه Gateway (فهناك توجد مساحة العمل).

<Steps>
  <Step title="تهيئة المستودع">
    إذا كان git مثبتًا، تتم تهيئة مساحات العمل الجديدة تلقائيًا. وإذا لم تكن مساحة العمل هذه مستودعًا بالفعل، فشغّل:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="أضف remote خاصًا">
    <Tabs>
      <Tab title="واجهة GitHub web">
        1. أنشئ مستودعًا جديدًا **خاصًا** على GitHub.
        2. لا تهيئه بملف README (لتجنب تعارضات الدمج).
        3. انسخ عنوان URL الخاص بـ HTTPS remote.
        4. أضف الـ remote وادفع:

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
      <Tab title="واجهة GitLab web">
        1. أنشئ مستودعًا جديدًا **خاصًا** على GitLab.
        2. لا تهيئه بملف README (لتجنب تعارضات الدمج).
        3. انسخ عنوان URL الخاص بـ HTTPS remote.
        4. أضف الـ remote وادفع:

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

## لا تُدرج الأسرار في commit

<Warning>
حتى في مستودع خاص، تجنب تخزين الأسرار في مساحة العمل:

- API keys أو OAuth tokens أو كلمات المرور أو بيانات الاعتماد الخاصة.
- أي شيء تحت `~/.openclaw/`.
- التفريغات الخام للمحادثات أو المرفقات الحساسة.

إذا كان لا بد من تخزين مراجع حساسة، فاستخدم عناصر نائبة واحتفظ بالسر الحقيقي في مكان آخر (مدير كلمات المرور، أو متغيرات البيئة، أو `~/.openclaw/`).
</Warning>

بداية مقترحة لملف `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## نقل مساحة العمل إلى جهاز جديد

<Steps>
  <Step title="استنسخ المستودع">
    استنسخ المستودع إلى المسار المطلوب (الافتراضي `~/.openclaw/workspace`).
  </Step>
  <Step title="حدّث الإعدادات">
    اضبط `agents.defaults.workspace` على ذلك المسار في `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="املأ الملفات المفقودة">
    شغّل `openclaw setup --workspace <path>` لملء أي ملفات مفقودة.
  </Step>
  <Step title="انسخ الجلسات (اختياري)">
    إذا كنت تحتاج إلى الجلسات، فانسخ `~/.openclaw/agents/<agentId>/sessions/` من الجهاز القديم بشكل منفصل.
  </Step>
</Steps>

## ملاحظات متقدمة

- يمكن أن يستخدم التوجيه متعدد الوكلاء مساحات عمل مختلفة لكل وكيل. راجع [توجيه القنوات](/ar/channels/channel-routing) لإعدادات التوجيه.
- إذا كان `agents.defaults.sandbox` مفعّلًا، فقد تستخدم الجلسات غير الرئيسية مساحات عمل sandbox لكل جلسة تحت `agents.defaults.sandbox.workspaceRoot`.

## ذو صلة

- [Heartbeat](/ar/gateway/heartbeat) — ملف مساحة العمل HEARTBEAT.md
- [Sandboxing](/ar/gateway/sandboxing) — وصول مساحة العمل في البيئات المعزولة
- [الجلسة](/ar/concepts/session) — مسارات تخزين الجلسات
- [الأوامر الدائمة](/ar/automation/standing-orders) — التعليمات المستمرة في ملفات مساحة العمل
