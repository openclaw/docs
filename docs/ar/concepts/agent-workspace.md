---
read_when:
    - تحتاج إلى شرح مساحة عمل الوكيل أو تخطيط ملفاتها
    - تريد إجراء نسخة احتياطية من مساحة عمل وكيل أو ترحيلها
sidebarTitle: Agent workspace
summary: 'مساحة عمل الوكيل: الموقع والتخطيط واستراتيجية النسخ الاحتياطي'
title: مساحة عمل الوكيل
x-i18n:
    generated_at: "2026-06-27T17:26:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6020aa96b2aa829a9684164994d1fb1fb1b31157c47b60e947ad82f9f5508e1c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

مساحة العمل هي موطن الوكيل. وهي دليل العمل الوحيد المستخدم لأدوات الملفات ولسياق مساحة العمل. أبقها خاصة وتعامل معها كذاكرة.

هذا منفصل عن `~/.openclaw/`، الذي يخزن الإعدادات وبيانات الاعتماد والجلسات.

<Warning>
مساحة العمل هي **cwd الافتراضي**، وليست sandbox صارمة. تحل الأدوات المسارات النسبية نسبة إلى مساحة العمل، لكن المسارات المطلقة لا تزال قادرة على الوصول إلى أماكن أخرى على المضيف ما لم يكن sandboxing مفعلا. إذا كنت تحتاج إلى العزل، فاستخدم [`agents.defaults.sandbox`](/ar/gateway/sandboxing) (و/أو إعدادات sandbox لكل وكيل).

عند تفعيل sandboxing وعدم كون `workspaceAccess` مساوية لـ `"rw"`، تعمل الأدوات داخل مساحة عمل sandbox تحت `~/.openclaw/sandboxes`، وليس داخل مساحة عمل المضيف لديك.
</Warning>

## الموقع الافتراضي

- الافتراضي: `~/.openclaw/workspace`
- إذا كان `OPENCLAW_PROFILE` مضبوطا وليس `"default"`، يصبح الافتراضي `~/.openclaw/workspace-<profile>`.
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

سينشئ `openclaw onboard` أو `openclaw configure` أو `openclaw setup` مساحة العمل ويزرع ملفات التهيئة الأولية إذا كانت مفقودة.

<Note>
تقبل نسخ بذور sandbox الملفات العادية داخل مساحة العمل فقط؛ ويتم تجاهل أسماء symlink/hardlink المستعارة التي تحل إلى خارج مساحة العمل المصدر.
</Note>

إذا كنت تدير ملفات مساحة العمل بنفسك بالفعل، يمكنك تعطيل إنشاء ملفات التهيئة الأولية:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## مجلدات مساحة عمل إضافية

ربما أنشأت التثبيتات الأقدم `~/openclaw`. يمكن أن يسبب الاحتفاظ بعدة أدلة لمساحات العمل التباسا في المصادقة أو انحرافا في الحالة، لأن مساحة عمل واحدة فقط تكون نشطة في كل مرة.

<Note>
**التوصية:** احتفظ بمساحة عمل نشطة واحدة. إذا لم تعد تستخدم المجلدات الإضافية، فأرشفها أو انقلها إلى سلة المهملات (على سبيل المثال `trash ~/openclaw`). إذا كنت تحتفظ بعدة مساحات عمل عمدا، فتأكد من أن `agents.defaults.workspace` يشير إلى المساحة النشطة.

يحذر `openclaw doctor` عند اكتشاف أدلة مساحة عمل إضافية.
</Note>

## خريطة ملفات مساحة العمل

هذه هي الملفات القياسية التي يتوقعها OpenClaw داخل مساحة العمل:

<AccordionGroup>
  <Accordion title="AGENTS.md - تعليمات التشغيل">
    تعليمات التشغيل للوكيل وكيف ينبغي له استخدام الذاكرة. يتم تحميلها في بداية كل جلسة. مكان جيد للقواعد والأولويات وتفاصيل "كيفية التصرف".
  </Accordion>
  <Accordion title="SOUL.md - الشخصية والنبرة">
    الشخصية والنبرة والحدود. يتم تحميلها في كل جلسة. الدليل: [دليل شخصية SOUL.md](/ar/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - من هو المستخدم">
    من هو المستخدم وكيفية مخاطبته. يتم تحميله في كل جلسة.
  </Accordion>
  <Accordion title="IDENTITY.md - الاسم والطابع والرمز التعبيري">
    اسم الوكيل وطابعه ورمزه التعبيري. يتم إنشاؤه/تحديثه أثناء طقس التهيئة الأولية.
  </Accordion>
  <Accordion title="TOOLS.md - اصطلاحات الأدوات المحلية">
    ملاحظات حول أدواتك المحلية واصطلاحاتها. لا يتحكم في توفر الأدوات؛ إنه إرشاد فقط.
  </Accordion>
  <Accordion title="HEARTBEAT.md - قائمة تحقق Heartbeat">
    قائمة تحقق صغيرة اختيارية لتشغيلات Heartbeat. أبقها قصيرة لتجنب استهلاك الرموز.
  </Accordion>
  <Accordion title="BOOT.md - قائمة تحقق بدء التشغيل">
    قائمة تحقق اختيارية لبدء التشغيل يتم تشغيلها تلقائيا عند إعادة تشغيل Gateway (عند تفعيل [الخطافات الداخلية](/ar/automation/hooks)). أبقها قصيرة؛ استخدم أداة الرسائل للإرسالات الصادرة.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - طقس التشغيل الأول">
    طقس تشغيل أول لمرة واحدة. يتم إنشاؤه فقط لمساحة عمل جديدة تماما. احذفه بعد اكتمال الطقس.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - سجل الذاكرة اليومي">
    سجل الذاكرة اليومي (ملف واحد لكل يوم). يوصى بقراءة اليوم + الأمس عند بدء الجلسة.
  </Accordion>
  <Accordion title="MEMORY.md - ذاكرة طويلة الأمد منتقاة (اختياري)">
    ذاكرة طويلة الأمد منتقاة: حقائق وتفضيلات وقرارات وملخصات قصيرة دائمة. احتفظ بالسجلات المفصلة في `memory/YYYY-MM-DD.md` حتى تتمكن أدوات الذاكرة من استرجاعها عند الطلب من دون حقنها في كل مطالبة. حمّل `MEMORY.md` فقط في الجلسة الرئيسية الخاصة (وليس في سياقات المشاركة/المجموعات). راجع [الذاكرة](/ar/concepts/memory) لمعرفة سير العمل وتفريغ الذاكرة التلقائي.
  </Accordion>
  <Accordion title="skills/ - Skills مساحة العمل (اختياري)">
    Skills خاصة بمساحة العمل. موقع Skills الأعلى أولوية لتلك المساحة. يتجاوز Skills وكيل المشروع، وSkills الوكيل الشخصية، وSkills المدارة، وSkills المضمّنة، و`skills.load.extraDirs` عند تعارض الأسماء.
  </Accordion>
  <Accordion title="canvas/ - ملفات واجهة Canvas (اختياري)">
    ملفات واجهة Canvas لعروض العقد (على سبيل المثال `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
إذا كان أي ملف تهيئة أولية مفقودا، يحقن OpenClaw علامة "ملف مفقود" في الجلسة ويواصل. يتم اقتطاع ملفات التهيئة الأولية الكبيرة عند حقنها؛ اضبط الحدود باستخدام `agents.defaults.bootstrapMaxChars` (الافتراضي: 20000) و`agents.defaults.bootstrapTotalMaxChars` (الافتراضي: 60000). يستطيع `openclaw setup` إعادة إنشاء الإعدادات الافتراضية المفقودة من دون الكتابة فوق الملفات الموجودة.
</Note>

## ما ليس موجودا في مساحة العمل

هذه العناصر موجودة تحت `~/.openclaw/` ولا ينبغي الالتزام بها في مستودع مساحة العمل:

- `~/.openclaw/openclaw.json` (الإعدادات)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (ملفات تعريف مصادقة النموذج: OAuth + مفاتيح API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (حساب Codex runtime لكل وكيل، والإعدادات، وSkills، وplugins، وحالة الخيط الأصلية)
- `~/.openclaw/credentials/` (حالة القناة/الموفر بالإضافة إلى بيانات استيراد OAuth القديمة)
- `~/.openclaw/agents/<agentId>/sessions/` (نصوص الجلسات + البيانات الوصفية)
- `~/.openclaw/skills/` (Skills المدارة)

إذا كنت تحتاج إلى ترحيل الجلسات أو الإعدادات، فانسخها بشكل منفصل وأبقها خارج التحكم في الإصدارات.

## نسخة git الاحتياطية (موصى بها، خاصة)

تعامل مع مساحة العمل كذاكرة خاصة. ضعها في مستودع git **خاص** بحيث تكون منسوخة احتياطيا وقابلة للاسترداد.

شغّل هذه الخطوات على الجهاز الذي يعمل عليه Gateway (حيث توجد مساحة العمل).

<Steps>
  <Step title="تهيئة المستودع">
    إذا كان git مثبتا، تتم تهيئة مساحات العمل الجديدة تماما تلقائيا. إذا لم تكن مساحة العمل هذه مستودعا بالفعل، فشغّل:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="إضافة remote خاص">
    <Tabs>
      <Tab title="واجهة ويب GitHub">
        1. أنشئ مستودعا **خاصا** جديدا على GitHub.
        2. لا تهيئه بملف README (لتجنب تعارضات الدمج).
        3. انسخ عنوان remote HTTPS.
        4. أضف remote وادفع:

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
      <Tab title="واجهة ويب GitLab">
        1. أنشئ مستودعا **خاصا** جديدا على GitLab.
        2. لا تهيئه بملف README (لتجنب تعارضات الدمج).
        3. انسخ عنوان remote HTTPS.
        4. أضف remote وادفع:

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

## لا تلتزم بالأسرار

<Warning>
حتى في مستودع خاص، تجنب تخزين الأسرار في مساحة العمل:

- مفاتيح API أو رموز OAuth أو كلمات المرور أو بيانات الاعتماد الخاصة.
- أي شيء تحت `~/.openclaw/`.
- التفريغات الخام للدردشات أو المرفقات الحساسة.

إذا كان لا بد من تخزين مراجع حساسة، فاستخدم عناصر نائبة واحتفظ بالسر الحقيقي في مكان آخر (مدير كلمات مرور، أو متغيرات بيئة، أو `~/.openclaw/`).
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

- يمكن لتوجيه عدة وكلاء استخدام مساحات عمل مختلفة لكل وكيل. راجع [توجيه القنوات](/ar/channels/channel-routing) لإعدادات التوجيه.
- إذا كان `agents.defaults.sandbox` مفعلا، يمكن للجلسات غير الرئيسية استخدام مساحات عمل sandbox لكل جلسة تحت `agents.defaults.sandbox.workspaceRoot`.

## ذات صلة

- [Heartbeat](/ar/gateway/heartbeat) - ملف مساحة العمل HEARTBEAT.md
- [Sandboxing](/ar/gateway/sandboxing) - الوصول إلى مساحة العمل في البيئات المعزولة
- [الجلسة](/ar/concepts/session) - مسارات تخزين الجلسات
- [الأوامر الدائمة](/ar/automation/standing-orders) - تعليمات مستمرة في ملفات مساحة العمل
