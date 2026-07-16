---
read_when:
    - تكوين سلوك تحميل Skills أو تثبيتها أو تقييدها
    - ضبط إمكانية رؤية Skills لكل وكيل
    - تعديل حدود ورشة Skills أو سياسة الموافقة
sidebarTitle: Skills config
summary: مرجع كامل لمخطط إعدادات skills.*، وقوائم السماح للوكلاء، وإعدادات ورشة العمل، ومعالجة متغيرات بيئة صندوق العزل.
title: إعدادات Skills
x-i18n:
    generated_at: "2026-07-16T15:12:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1633364a7333ba00f5f6c8d6f1f478b65e63bc97de23705e492eb980967ec521
    source_path: tools/skills-config.md
    workflow: 16
---

تقع معظم إعدادات Skills ضمن `skills` في
`~/.openclaw/openclaw.json`. أما مستوى الرؤية الخاص بكل وكيل فيقع ضمن
`agents.defaults.skills` و`agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm",
      allowUploadedArchives: false,
    },
    workshop: {
      autonomous: { enabled: false },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "auto",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<Note>
  لتوليد الصور المضمّن، استخدم `agents.defaults.imageGenerationModel`
  مع أداة `image_generate` الأساسية بدلًا من `skills.entries`. إدخالات Skills
  مخصصة فقط لسير عمل Skills المخصصة أو التابعة لجهات خارجية.
</Note>

## التحميل (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  أدلة Skills إضافية لفحصها، بأدنى أولوية (أدنى من
  Skills المضمّنة وSkills الخاصة بالـ Plugin). تُوسّع المسارات مع دعم `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  أدلة أهداف فعلية موثوقة يُسمح لمجلدات Skills ذات الروابط الرمزية بأن تُحلّ
  إليها، حتى عندما يقع الرابط الرمزي خارج الجذر المضبوط. استخدم هذا
  لتخطيطات المستودعات الشقيقة المقصودة مثل
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. اجعل هذه القائمة
  محدودة — ولا تُشر إلى جذور واسعة مثل `~` أو `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  راقب مجلدات Skills وحدّث لقطة Skills عند تغيّر ملفات `SKILL.md`.
  يشمل ذلك الملفات المتداخلة ضمن جذور Skills المجمّعة.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  نافذة إزالة ارتداد أحداث مراقب Skills بالمللي ثانية.
</ParamField>

## التثبيت (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  فضّل مثبّتات Homebrew عند توفر `brew`.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  تفضيل مدير حزم Node لتثبيت Skills. يؤثر هذا فقط في عمليات تثبيت Skills
  — إذ تتطلب بيئة تشغيل CLI وGateway في OpenClaw استخدام Node لأن
  مخزن الحالة الأساسي يستخدم `node:sqlite`. تقبل `openclaw setup --node-manager` و
  `openclaw onboard --node-manager` القيم `npm` أو `pnpm` أو `bun`؛ اضبط
  `"yarn"` مباشرةً في الإعدادات لتثبيت Skills المدعوم من Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  اسمح لعملاء Gateway الموثوقين من نوع `operator.admin` بتثبيت أرشيفات zip
  خاصة جرى تجهيزها عبر `skills.upload.*`. لا تحتاج عمليات تثبيت ClawHub العادية
  إلى هذا الإعداد.
</ParamField>

## سياسة تثبيت المشغّل (`security.installPolicy`)

استخدم `security.installPolicy` عندما يحتاج المشغّلون إلى أمر محلي موثوق
للموافقة على تثبيت Skills والـ Plugins أو حظره وفق سياسة خاصة بالمضيف. تعمل
السياسة بعد أن يجهّز OpenClaw المواد المصدرية وقبل متابعة التثبيت
أو التحديث. وتنطبق على Skills من ClawHub، وSkills المرفوعة، وSkills من Git/المسار المحلي،
ومثبّتات تبعيات Skills، ومصادر تثبيت/تحديث الـ Plugins.

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // احذف targets لتغطية كل هدف مدعوم.
      targets: ["skill", "plugin"],
      exec: {
        source: "exec",
        command: "/usr/local/bin/openclaw-install-policy",
        args: ["--json"],
        timeoutMs: 10000,
        noOutputTimeoutMs: 10000,
        maxOutputBytes: 1048576,
        passEnv: ["OPENCLAW_STATE_DIR", "PATH"],
        env: { POLICY_MODE: "strict" },
        trustedDirs: ["/usr/local/bin"],
      },
    },
  },
}
```

<ParamField path="security.installPolicy.enabled" type="boolean" default="false">
  يفعّل سياسة التثبيت التي يملكها المشغّل. عند تفعيلها دون أمر `exec`
  صالح، تُرفض عمليات التثبيت افتراضيًا.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  مرشّح أهداف اختياري. عند حذفه، تنطبق السياسة على كل
  هدف مدعوم كي لا يُسمح بعمليات التثبيت الجديدة على نحو غير متوقع.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  المسار المطلق لملف السياسة التنفيذي الموثوق. يشغّله OpenClaw من دون
  صدفة أوامر ويتحقق من المسار قبل استخدامه.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  وسيطات ثابتة تُمرر بعد `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  أقصى مدة فعلية لقرار سياسة واحد.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  أقصى مدة من دون مخرجات على stdout أو stderr قبل أن ترفض السياسة
  العملية افتراضيًا.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  أقصى عدد مقبول من البايتات المجمّعة من stdout وstderr من عملية السياسة.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  متغيرات البيئة الحرفية المقدمة إلى عملية السياسة.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  أسماء متغيرات البيئة المنسوخة من عملية OpenClaw إلى
  عملية السياسة. لا تُمرر سوى المتغيرات المذكورة بالاسم.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  قائمة سماح اختيارية بالأدلة التي قد تحتوي على ملف السياسة التنفيذي.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  يتجاوز فحوص ملكية مسار الأمر وأذوناته. استخدمه فقط عندما يكون
  المسار محميًا بآلية أخرى.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  يسمح بأن يكون مسار الأمر المضبوط رابطًا رمزيًا. ويجب أن يظل الهدف
  المحلول مستوفيًا لفحوص المسار الأخرى. يجب أن تكون وسيطات نصوص المفسّر
  ملفات عادية مباشرة، لا روابط رمزية.
</ParamField>

تستقبل السياسة كائن JSON واحدًا على stdin يحتوي على `protocolVersion: 1`،
و`openclawVersion`، و`targetType`، و`targetName`، و`sourcePath`، و`sourcePathKind`،
و`source` منظّمًا اختياريًا، و`origin` منظّمًا، و`request`. ويجب أن
تكتب كائن JSON واحدًا على stdout: `{ "protocolVersion": 1, "decision": "allow" }`
أو `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. يؤدي الخروج
برمز غير صفري، أو انتهاء المهلة، أو JSON غير صالح، أو غياب الحقول، أو إصدارات بروتوكول
غير مدعومة إلى الرفض الافتراضي.

لا ينفّذ OpenClaw سياسة التثبيت أثناء بدء تشغيل Gateway العادي.
تُرفض عمليات التثبيت والتحديث افتراضيًا عندما تكون السياسة مفعّلة لكنها غير متاحة.
ينفّذ `openclaw doctor` تحققًا ثابتًا؛ بينما ينفّذ `openclaw doctor --deep`
اختبار تثبيت اصطناعيًا على الأمر المضبوط.

تطبّق التحديثات المجمّعة السياسة على كل هدف على حدة: يؤدي حظر تحديث Skill أو Plugin
إلى فشل ذلك الهدف من دون تعطيل السياسة أو تخطي الأهداف اللاحقة في
الدُفعة.

مثال على stdin:

```json
{
  "protocolVersion": 1,
  "openclawVersion": "2026.6.1",
  "targetType": "skill",
  "targetName": "weather",
  "sourcePath": "/var/folders/.../openclaw-skill-clawhub/root",
  "sourcePathKind": "directory",
  "source": {
    "kind": "clawhub",
    "authority": "openclaw",
    "mutable": false,
    "network": true
  },
  "origin": {
    "type": "clawhub",
    "registry": "https://clawhub.openclaw.ai",
    "slug": "weather",
    "version": "1.0.0"
  },
  "request": {
    "kind": "skill-install",
    "mode": "install",
    "requestedSpecifier": "clawhub:weather@1.0.0"
  },
  "skill": {
    "installId": "clawhub"
  }
}
```

أمر سياسة بالحد الأدنى:

```js
#!/usr/bin/env node

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  const request = JSON.parse(input);
  if (request.targetType === "plugin" && request.source?.kind === "local-path") {
    process.stdout.write(
      JSON.stringify({
        protocolVersion: 1,
        decision: "block",
        reason: "مسارات Plugin المحلية غير معتمدة على هذا المضيف",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## قائمة السماح لـ Skills المضمّنة

<ParamField path="skills.allowBundled" type="string[]">
  قائمة سماح اختيارية لـ Skills **المضمّنة** فقط. عند ضبطها، لا تكون مؤهلة إلا Skills
  المضمّنة الواردة في القائمة. ولا تتأثر Skills المُدارة، أو الخاصة بمستوى الوكيل،
  أو الخاصة بمساحة العمل.
</ParamField>

## إدخالات كل Skill (`skills.entries`)

تطابق المفاتيح ضمن `entries` قيمة `name` الخاصة بالـ Skill افتراضيًا. إذا عرّفت Skill
القيمة `metadata.openclaw.skillKey`، فاستخدم ذلك المفتاح بدلًا منها. ضع الأسماء التي تحتوي على شرطات
بين علامتي اقتباس (يسمح JSON5 بالمفاتيح المقتبسة).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  يعطّل `false` الـ Skill حتى إن كانت مضمّنة أو مثبّتة. أما Skill
  المضمّنة `coding-agent` فتتطلب الاشتراك الصريح — اضبطها على `true` وتأكد من تثبيت
  `claude` أو `codex` أو `opencode` أو CLI آخر مدعوم
  ومصادَق عليه.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  حقل تسهيلي لـ Skills التي تعلن `metadata.openclaw.primaryEnv`.
  يدعم سلسلة نصية صريحة أو SecretRef: ‏`{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  متغيرات بيئة تُحقن لتشغيل الوكيل. لا تُحقن إلا عندما لا يكون
  المتغير مضبوطًا مسبقًا في العملية.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  حاوية اختيارية لحقول الإعداد المخصصة لكل Skill.
</ParamField>

## قوائم سماح الوكلاء (`agents`)

استخدم إعداد الوكيل عندما تريد جذور Skills نفسها على الجهاز/مساحة العمل، لكن
مجموعة مختلفة من Skills المرئية لكل وكيل.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // خط أساس مشترك
    },
    list: [
      { id: "writer" }, // يرث github وweather
      { id: "docs", skills: ["docs-search"] }, // يستبدل الإعدادات الافتراضية بالكامل
      { id: "locked-down", skills: [] }, // بلا Skills
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  قائمة سماح مشتركة كأساس ترثها الوكلاء التي تحذف
  `agents.list[].skills`. احذفها بالكامل لترك Skills بلا قيود
  افتراضيًا.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  مجموعة Skills النهائية الصريحة لذلك الوكيل. القوائم الصريحة **تستبدل**
  الإعدادات الافتراضية الموروثة — ولا تُدمج معها. اضبطها على `[]` لعدم إظهار أي Skills
  لذلك الوكيل.
</ParamField>

<Warning>
  قوائم سماح Skills للوكلاء هي مرشّح للرؤية والتحميل في اكتشاف OpenClaw
  لـ Skills، والمطالبات، واكتشاف أوامر الشرطة المائلة، ومزامنة بيئة العزل، ولقطات
  Skills. وهي ليست حدًا للتخويل وقت تشغيل الصدفة. إذا كان بإمكان وكيل
  تشغيل `exec` على المضيف، فلا يزال بإمكان تلك الصدفة تشغيل عملاء خارجيين أو قراءة
  ملفات المضيف المرئية لمستخدم التنفيذ، بما في ذلك سجلات عملاء MCP
  مثل `~/.openclaw/skills/config/mcporter.json`. لعزل MCP
  لكل وكيل، اجمع بين قوائم سماح Skills وعزل بيئة العزل/مستخدم نظام التشغيل،
  وارفض تنفيذ المضيف أو قيّده بقائمة سماح صارمة، وفضّل بيانات اعتماد خاصة بكل وكيل
  على خادم MCP.
</Warning>

## ورشة العمل (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  عندما تكون `true`، يمكن لـ OpenClaw إنشاء مقترحات معلّقة من التصحيحات الدائمة
  ويمكنه مراجعة الأعمال المكتملة الناجحة والجوهرية بعد أن يصبح النظام
  خاملاً. قد يضيف هذا تشغيل نموذج في الخلفية بعد الأدوار المؤهلة. يستمر
  إنشاء المهارات بطلب المستخدم و`/learn` في العمل عندما يكون الإعداد `false`.
</ParamField>

راجع [التعلّم الذاتي](/tools/self-learning) لمعرفة الأهلية والخصوصية والتكلفة
والأذونات الخاصة بالمقترحات فقط واستكشاف الأخطاء وإصلاحها.

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"auto"'>
  تتيح `auto` للوكيل التطبيق أو الرفض أو العزل بمبادرة منه من دون
  مطالبة موافقة إضافية. تتطلب `pending` موافقة المشغّل.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  اسمح لتطبيق ورشة المهارات بالكتابة عبر الروابط الرمزية لمهارات مساحة العمل التي
  يكون هدفها الحقيقي موثوقاً بالفعل بواسطة `skills.load.allowSymlinkTargets`. أبقِ
  هذا معطلاً ما لم يكن من المفترض أن تعدّل عمليات تطبيق المقترحات المُنشأة جذر
  المهارات المشترك ذاك.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  الحد الأقصى للمقترحات المعلّقة والمعزولة المحتفَظ بها لكل مساحة عمل (النطاق
  المسموح: 1-200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  الحد الأقصى لحجم نص المقترح بالبايت (النطاق المسموح: 1024-200000). تُحدّ
  أوصاف المقترحات بشكل صارم ومنفصل عند 160 بايت، لأنها تظهر
  في مخرجات الاكتشاف والقوائم.
</ParamField>

راجع [ورشة المهارات](/ar/tools/skill-workshop) للتعرّف على دورة حياة المقترح وأوامر CLI
ومعاملات أداة الوكيل وطرائق Gateway التي يتحكم فيها هذا الإعداد.

## جذور المهارات المرتبطة رمزياً

تُعد جذور مهارات مساحة العمل ووكيل المشروع والدليل الإضافي والمهارات المضمّنة
حدود احتواء افتراضياً. يُتخطى مجلد مهارات مرتبط رمزياً ضمن `<workspace>/skills`
إذا كان يُحل إلى خارج الجذر، مع تسجيل رسالة في السجل.

للسماح بتخطيط روابط رمزية مقصود، صرّح بالهدف الموثوق:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

باستخدام هذا الإعداد، تُقبل `<workspace>/skills/manager -> ~/Projects/manager/skills`
بعد حل المسار الحقيقي. تفحص `extraDirs` المستودع الشقيق
مباشرةً؛ وتحافظ `allowSymlinkTargets` على المسار المرتبط رمزياً للتخطيطات
الحالية.

لا يكتب تطبيق ورشة المهارات عبر تلك الروابط الرمزية افتراضياً. للسماح
لتطبيق الورشة بتعديل المهارات ضمن أهداف الروابط الرمزية الموثوقة بالفعل،
اشترك في ذلك بصورة منفصلة:

```json5
{
  skills: {
    load: {
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    workshop: {
      allowSymlinkTargetWrites: true,
    },
  },
}
```

تقبل أدلة `~/.openclaw/skills` المُدارة وأدلة `~/.agents/skills` الشخصية
الروابط الرمزية لأدلة المهارات دون شروط بالفعل (مع استمرار تطبيق احتواء
`SKILL.md` لكل مهارة) — ولا تلزم `allowSymlinkTargets` إلا
لجذور مساحة العمل والدليل الإضافي ووكيل المشروع (`<workspace>/.agents/skills`).

## المهارات المعزولة ومتغيرات البيئة

<Warning>
  تنطبق `skills.entries.<skill>.env` و`apiKey` على عمليات تشغيل **المضيف** فقط.
  ولا تأثير لهما داخل بيئة معزولة — إذ ستفشل المهارة التي تعتمد على
  `GEMINI_API_KEY` مع `apiKey not configured` ما لم يُمرر المتغير إلى البيئة
  المعزولة بصورة منفصلة.
</Warning>

مرّر الأسرار إلى بيئة Docker معزولة باستخدام:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          env: { GEMINI_API_KEY: "your-key-here" },
        },
      },
    },
  },
}
```

<Note>
  يمكن للمستخدمين الذين يملكون صلاحية الوصول إلى برنامج Docker الخفي فحص قيم `sandbox.docker.env`
  من خلال بيانات Docker الوصفية. استخدم ملف أسرار مركّباً أو صورة مخصصة أو
  مسار تسليم آخر عندما لا يكون هذا الكشف مقبولاً.
</Note>

## تذكير بترتيب التحميل

```text
workspace/skills      (الأعلى)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
المهارات المضمّنة
skills.load.extraDirs (الأدنى)
```

تسري تغييرات المهارات والإعداد في الجلسة الجديدة التالية عندما تكون
المراقبة مفعّلة، أو في دور الوكيل التالي عندما تكتشف المراقبة
تغييراً.

## ذو صلة

<CardGroup cols={2}>
  <Card title="مرجع المهارات" href="/ar/tools/skills" icon="puzzle-piece">
    ماهية المهارات وترتيب تحميلها وتقييدها وتنسيق SKILL.md.
  </Card>
  <Card title="إنشاء المهارات" href="/ar/tools/creating-skills" icon="hammer">
    تأليف مهارات مخصصة لمساحة العمل.
  </Card>
  <Card title="ورشة المهارات" href="/ar/tools/skill-workshop" icon="flask">
    قائمة انتظار المقترحات للمهارات التي يصوغها الوكيل.
  </Card>
  <Card title="التعلّم الذاتي" href="/tools/self-learning" icon="brain">
    مقترحات متحفظة وقائمة على الاشتراك من الأعمال المكتملة.
  </Card>
  <Card title="أوامر الشرطة المائلة" href="/ar/tools/slash-commands" icon="terminal">
    دليل أوامر الشرطة المائلة الأصلية وتوجيهات الدردشة.
  </Card>
</CardGroup>
