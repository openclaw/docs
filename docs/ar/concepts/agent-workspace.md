---
read_when:
    - تحتاج إلى شرح مساحة عمل الوكيل أو بنية ملفاتها
    - تريد إجراء نسخ احتياطي لمساحة عمل وكيل أو ترحيلها
sidebarTitle: Agent workspace
summary: 'مساحة عمل الوكيل: الموقع والتخطيط واستراتيجية النسخ الاحتياطي'
title: مساحة عمل الوكيل
x-i18n:
    generated_at: "2026-05-10T19:33:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: adb2ae19c702589010cc67907940ae21feb669cca262e36790a3059aa7d7744c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

مساحة العمل هي موطن الوكيل. وهي دليل العمل الوحيد المستخدم لأدوات الملفات ولسياق مساحة العمل. أبقها خاصة وتعامل معها كذاكرة.

هذا منفصل عن `~/.openclaw/`، الذي يخزن الإعدادات وبيانات الاعتماد والجلسات.

<Warning>
مساحة العمل هي **دليل العمل الحالي الافتراضي**، وليست صندوقًا معزولًا صارمًا. تحل الأدوات المسارات النسبية نسبةً إلى مساحة العمل، لكن المسارات المطلقة ما زال بإمكانها الوصول إلى أماكن أخرى على المضيف ما لم يكن العزل ممكّنًا. إذا كنت بحاجة إلى عزل، فاستخدم [`agents.defaults.sandbox`](/ar/gateway/sandboxing) (و/أو إعدادات العزل لكل وكيل).

عند تمكين العزل وعدم ضبط `workspaceAccess` على `"rw"`، تعمل الأدوات داخل مساحة عمل معزولة ضمن `~/.openclaw/sandboxes`، وليس داخل مساحة عمل المضيف.
</Warning>

## الموقع الافتراضي

- الافتراضي: `~/.openclaw/workspace`
- إذا كان `OPENCLAW_PROFILE` مضبوطًا وليس `"default"`، يصبح الافتراضي `~/.openclaw/workspace-<profile>`.
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

سينشئ `openclaw onboard` أو `openclaw configure` أو `openclaw setup` مساحة العمل ويضيف ملفات التمهيد الأولية إذا كانت مفقودة.

<Note>
تقبل نسخ بذور العزل الملفات العادية داخل مساحة العمل فقط؛ ويتم تجاهل الأسماء المستعارة عبر الروابط الرمزية/الروابط الصلبة التي تشير إلى خارج مساحة العمل المصدر.
</Note>

إذا كنت تدير ملفات مساحة العمل بنفسك بالفعل، فيمكنك تعطيل إنشاء ملفات التمهيد:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## مجلدات مساحة عمل إضافية

قد تكون التثبيتات الأقدم أنشأت `~/openclaw`. قد يؤدي إبقاء عدة أدلة لمساحات العمل إلى التباس في المصادقة أو انحراف في الحالة، لأن مساحة عمل واحدة فقط تكون نشطة في كل مرة.

<Note>
**التوصية:** احتفظ بمساحة عمل نشطة واحدة. إذا لم تعد تستخدم المجلدات الإضافية، فأرشفها أو انقلها إلى سلة المهملات (مثلًا `trash ~/openclaw`). إذا كنت تحتفظ عمدًا بعدة مساحات عمل، فتأكد من أن `agents.defaults.workspace` يشير إلى المساحة النشطة.

يحذّر `openclaw doctor` عندما يكتشف أدلة مساحة عمل إضافية.
</Note>

## خريطة ملفات مساحة العمل

هذه هي الملفات القياسية التي يتوقع OpenClaw وجودها داخل مساحة العمل:

<AccordionGroup>
  <Accordion title="AGENTS.md - تعليمات التشغيل">
    تعليمات التشغيل للوكيل وكيف ينبغي له استخدام الذاكرة. تُحمّل عند بداية كل جلسة. مكان جيد للقواعد والأولويات وتفاصيل "كيفية التصرف".
  </Accordion>
  <Accordion title="SOUL.md - الشخصية والنبرة">
    الشخصية والنبرة والحدود. تُحمّل في كل جلسة. الدليل: [دليل شخصية SOUL.md](/ar/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - من هو المستخدم">
    من هو المستخدم وكيفية مخاطبته. يُحمّل في كل جلسة.
  </Accordion>
  <Accordion title="IDENTITY.md - الاسم والطابع والرمز التعبيري">
    اسم الوكيل وطابعه ورمزه التعبيري. يُنشأ/يُحدّث أثناء طقس التمهيد.
  </Accordion>
  <Accordion title="TOOLS.md - اصطلاحات الأدوات المحلية">
    ملاحظات عن أدواتك المحلية واصطلاحاتها. لا تتحكم في إتاحة الأدوات؛ فهي إرشادات فقط.
  </Accordion>
  <Accordion title="HEARTBEAT.md - قائمة تحقق Heartbeat">
    قائمة تحقق صغيرة اختيارية لتشغيلات Heartbeat. أبقها قصيرة لتجنب استهلاك الرموز.
  </Accordion>
  <Accordion title="BOOT.md - قائمة تحقق بدء التشغيل">
    قائمة تحقق اختيارية لبدء التشغيل تُشغّل تلقائيًا عند إعادة تشغيل Gateway (عند تمكين [الخطافات الداخلية](/ar/automation/hooks)). أبقها قصيرة؛ واستخدم أداة الرسائل للإرسال الصادر.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - طقس التشغيل الأول">
    طقس تشغيل أول لمرة واحدة. يُنشأ فقط لمساحة عمل جديدة تمامًا. احذفه بعد اكتمال الطقس.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - سجل الذاكرة اليومي">
    سجل الذاكرة اليومي (ملف واحد لكل يوم). يُوصى بقراءة اليوم + أمس عند بدء الجلسة.
  </Accordion>
  <Accordion title="MEMORY.md - ذاكرة طويلة الأمد منتقاة (اختياري)">
    ذاكرة طويلة الأمد منتقاة: حقائق دائمة، وتفضيلات، وقرارات، وملخصات قصيرة. احتفظ بالسجلات المفصلة في `memory/YYYY-MM-DD.md` حتى تتمكن أدوات الذاكرة من استرجاعها عند الطلب دون حقنها في كل مطالبة. حمّل `MEMORY.md` فقط في الجلسة الرئيسية الخاصة (وليس في سياقات المشاركة/المجموعات). راجع [الذاكرة](/ar/concepts/memory) لمعرفة سير العمل وتفريغ الذاكرة التلقائي.
  </Accordion>
  <Accordion title="skills/ - Skills مساحة العمل (اختياري)">
    Skills خاصة بمساحة العمل. موقع Skills الأعلى أولوية لتلك المساحة. يتجاوز Skills وكيل المشروع، وSkills الوكيل الشخصية، وSkills المُدارة، وSkills المضمّنة، و`skills.load.extraDirs` عند تعارض الأسماء.
  </Accordion>
  <Accordion title="canvas/ - ملفات واجهة Canvas (اختياري)">
    ملفات واجهة Canvas لعروض العقد (مثل `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
إذا كان أي ملف تمهيد مفقودًا، يحقن OpenClaw علامة "ملف مفقود" في الجلسة ويتابع. تُقتطع ملفات التمهيد الكبيرة عند حقنها؛ اضبط الحدود باستخدام `agents.defaults.bootstrapMaxChars` (الافتراضي: 12000) و`agents.defaults.bootstrapTotalMaxChars` (الافتراضي: 60000). يستطيع `openclaw setup` إعادة إنشاء الافتراضيات المفقودة دون الكتابة فوق الملفات الموجودة.
</Note>

## ما ليس ضمن مساحة العمل

هذه العناصر موجودة ضمن `~/.openclaw/` ويجب ألا تُلتزم في مستودع مساحة العمل:

- `~/.openclaw/openclaw.json` (الإعدادات)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (ملفات مصادقة النموذج: OAuth + مفاتيح API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (حساب تشغيل Codex لكل وكيل، والإعدادات، وSkills، وplugins، وحالة السلسلة الأصلية)
- `~/.openclaw/credentials/` (حالة القناة/المزوّد بالإضافة إلى بيانات استيراد OAuth القديمة)
- `~/.openclaw/agents/<agentId>/sessions/` (نصوص الجلسات + البيانات الوصفية)
- `~/.openclaw/skills/` (Skills مُدارة)

إذا كنت بحاجة إلى ترحيل الجلسات أو الإعدادات، فانسخها بشكل منفصل وأبقها خارج التحكم في الإصدارات.

## النسخ الاحتياطي عبر Git (موصى به، خاص)

تعامل مع مساحة العمل كذاكرة خاصة. ضعها في مستودع git **خاص** بحيث تكون منسوخة احتياطيًا وقابلة للاسترداد.

شغّل هذه الخطوات على الجهاز الذي يعمل عليه Gateway (فهذا هو مكان وجود مساحة العمل).

<Steps>
  <Step title="تهيئة المستودع">
    إذا كان git مثبتًا، تتم تهيئة مساحات العمل الجديدة تمامًا تلقائيًا. إذا لم تكن مساحة العمل هذه مستودعًا بالفعل، فشغّل:

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
        3. انسخ عنوان URL البعيد عبر HTTPS.
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
        3. انسخ عنوان URL البعيد عبر HTTPS.
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
- أي شيء ضمن `~/.openclaw/`.
- النسخ الخام من المحادثات أو المرفقات الحساسة.

إذا كان لا بد من تخزين مراجع حساسة، فاستخدم عناصر نائبة واحتفظ بالسر الحقيقي في مكان آخر (مدير كلمات مرور، أو متغيرات بيئة، أو `~/.openclaw/`).
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
    إذا كنت بحاجة إلى الجلسات، فانسخ `~/.openclaw/agents/<agentId>/sessions/` من الجهاز القديم بشكل منفصل.
  </Step>
</Steps>

## ملاحظات متقدمة

- يمكن للتوجيه متعدد الوكلاء استخدام مساحات عمل مختلفة لكل وكيل. راجع [توجيه القنوات](/ar/channels/channel-routing) لإعدادات التوجيه.
- إذا كان `agents.defaults.sandbox` ممكّنًا، فيمكن للجلسات غير الرئيسية استخدام مساحات عمل عزل لكل جلسة ضمن `agents.defaults.sandbox.workspaceRoot`.

## ذو صلة

- [Heartbeat](/ar/gateway/heartbeat) - ملف مساحة العمل HEARTBEAT.md
- [العزل](/ar/gateway/sandboxing) - الوصول إلى مساحة العمل في البيئات المعزولة
- [الجلسة](/ar/concepts/session) - مسارات تخزين الجلسات
- [الأوامر الدائمة](/ar/automation/standing-orders) - التعليمات المستمرة في ملفات مساحة العمل
