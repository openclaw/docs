---
read_when:
    - تهيئة سلوك تحميل Skills أو تثبيتها أو تقييدها
    - ضبط مستوى ظهور Skills لكل وكيل
    - ضبط حدود ورشة Skills أو سياسة الموافقة
sidebarTitle: Skills config
summary: مرجع كامل لمخطط إعدادات skills.*، وقوائم السماح للوكلاء، وإعدادات ورشة العمل، ومعالجة متغيرات بيئة صندوق العزل.
title: إعداد Skills
x-i18n:
    generated_at: "2026-07-12T06:43:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ed1ec20aa102b458a9485a1ada1bb7566c97d28b1f43caa28f52b3f5bdc381e
    source_path: tools/skills-config.md
    workflow: 16
---

توجد معظم إعدادات Skills ضمن `skills` في
`~/.openclaw/openclaw.json`. أما إمكانية الظهور الخاصة بكل وكيل فتوجد ضمن
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
      approvalPolicy: "pending",
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
  لتوليد الصور المدمج، استخدم `agents.defaults.imageGenerationModel`
  مع أداة `image_generate` الأساسية بدلًا من `skills.entries`. إدخالات Skills
  مخصصة فقط لسير عمل Skills المخصصة أو التابعة لجهات خارجية.
</Note>

## التحميل (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  أدلة Skills الإضافية المطلوب فحصها، بأدنى أولوية (بعد Skills
  المضمنة وSkills الخاصة بالـ Plugin). تُوسَّع المسارات مع دعم `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  أدلة الأهداف الحقيقية الموثوقة التي يجوز لمجلدات Skills المرتبطة رمزيًا أن تُحل
  إليها، حتى عندما يوجد الرابط الرمزي خارج الجذر المُعدّ. استخدم هذا
  لتخطيطات مستودعات الأشقاء المقصودة مثل
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. أبقِ هذه القائمة
  محدودة — لا تُشر إلى جذور واسعة مثل `~` أو `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  راقب مجلدات Skills وحدّث لقطة Skills عند تغيّر ملفات `SKILL.md`.
  يشمل ذلك الملفات المتداخلة ضمن جذور Skills المجمّعة.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  نافذة إزالة الارتداد لأحداث مراقب Skills بالمللي ثانية.
</ParamField>

## التثبيت (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  فضّل أدوات تثبيت Homebrew عندما يكون `brew` متاحًا.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  تفضيل مدير حزم Node لتثبيتات Skills. يؤثر هذا فقط في تثبيتات Skills
  — ينبغي أن يظل وقت تشغيل Gateway يستخدم Node (لا يُنصح باستخدام Bun
  مع WhatsApp/Telegram). يقبل `openclaw setup --node-manager` و
  `openclaw onboard --node-manager` القيم `npm` أو `pnpm` أو `bun`؛ اضبط
  `"yarn"` مباشرةً في الإعداد لتثبيتات Skills المعتمدة على Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  اسمح لعملاء Gateway الموثوقين ذوي `operator.admin` بتثبيت أرشيفات zip
  خاصة جرى تجهيزها عبر `skills.upload.*`. لا تحتاج تثبيتات ClawHub العادية
  إلى هذا الإعداد.
</ParamField>

## سياسة تثبيت المشغّل (`security.installPolicy`)

استخدم `security.installPolicy` عندما يحتاج المشغّلون إلى أمر محلي موثوق
للموافقة على تثبيتات Skills والـ Plugin أو حظرها وفق سياسة خاصة بالمضيف.
تعمل السياسة بعد أن يجهّز OpenClaw مواد المصدر وقبل متابعة التثبيت
أو التحديث. وتنطبق على Skills من ClawHub، وSkills المرفوعة، وSkills من Git/المسارات المحلية،
وأدوات تثبيت تبعيات Skills، ومصادر تثبيت/تحديث الـ Plugin.

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Omit targets to cover every supported target.
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
  يفعّل سياسة التثبيت التي يملكها المشغّل. عند تفعيلها من دون أمر `exec`
  صالح، تفشل التثبيتات بطريقة مغلقة.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  مرشح اختياري للأهداف. عند حذفه، تنطبق السياسة على كل هدف مدعوم
  كي لا تفشل التثبيتات الجديدة بطريقة مفتوحة على نحو غير متوقع.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  المسار المطلق إلى الملف التنفيذي الموثوق للسياسة. يشغّله OpenClaw من دون
  صدفة أوامر ويتحقق من المسار قبل استخدامه.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  الوسائط الثابتة الممررة بعد `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  أقصى مدة فعلية لتنفيذ قرار سياسة واحد.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  أقصى مدة من دون خرج على stdout أو stderr قبل أن تفشل السياسة
  بطريقة مغلقة.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  أقصى عدد مقبول من البايتات المجمعة من stdout وstderr من عملية السياسة.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  متغيرات البيئة الحرفية المقدمة إلى عملية السياسة.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  أسماء متغيرات البيئة المنسوخة من عملية OpenClaw إلى
  عملية السياسة. لا تُمرر سوى المتغيرات المسماة.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  قائمة سماح اختيارية بالأدلة التي قد تحتوي على الملف التنفيذي للسياسة.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  يتجاوز فحوصات ملكية مسار الأمر وأذوناته. استخدمه فقط عندما يكون
  المسار محميًا بآلية أخرى.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  يسمح بأن يكون مسار الأمر المُعدّ رابطًا رمزيًا. يجب أن يظل الهدف المحلول
  مستوفيًا لفحوصات المسار الأخرى. ويجب أن تكون وسائط نصوص المفسّر البرمجية
  ملفات عادية مباشرة، لا روابط رمزية.
</ParamField>

تتلقى السياسة كائن JSON واحدًا عبر stdin يتضمن `protocolVersion: 1`،
و`openclawVersion`، و`targetType`، و`targetName`، و`sourcePath`، و`sourcePathKind`،
و`source` المنظم الاختياري، و`origin` المنظم، و`request`. ويجب أن
تكتب كائن JSON واحدًا إلى stdout: `{ "protocolVersion": 1, "decision": "allow" }`
أو `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. يؤدي الخروج
برمز غير صفري، أو انتهاء المهلة، أو JSON غير صالح، أو الحقول المفقودة، أو إصدارات
البروتوكول غير المدعومة إلى الفشل بطريقة مغلقة.

لا ينفّذ OpenClaw سياسة التثبيت أثناء بدء تشغيل Gateway العادي.
تفشل التثبيتات والتحديثات بطريقة مغلقة عندما تكون السياسة مفعّلة لكنها غير متاحة.
ينفّذ `openclaw doctor` تحققًا ثابتًا؛ وينفّذ `openclaw doctor --deep`
اختبار تثبيت اصطناعيًا مقابل الأمر المُعدّ.

تطبّق التحديثات المجمعة السياسة لكل هدف على حدة: يؤدي حظر تحديث Skill أو Plugin
إلى فشل ذلك الهدف من دون تعطيل السياسة أو تخطي الأهداف اللاحقة في
الدفعة.

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

أمر سياسة بسيط:

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
        reason: "local plugin paths are not approved on this host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## قائمة السماح لـ Skills المضمنة

<ParamField path="skills.allowBundled" type="string[]">
  قائمة سماح اختيارية لـ Skills **المضمنة** فقط. عند ضبطها، لا تكون مؤهلة
  سوى Skills المضمنة الواردة في القائمة. لا تتأثر Skills المُدارة، والخاصة بمستوى الوكيل،
  والخاصة بمساحة العمل.
</ParamField>

## إدخالات كل Skill (`skills.entries`)

تطابق المفاتيح ضمن `entries` قيمة `name` الخاصة بالـ Skill افتراضيًا. إذا عرّفت Skill
القيمة `metadata.openclaw.skillKey`، فاستخدم ذلك المفتاح بدلًا منها. ضع الأسماء المحتوية
على واصلات بين علامتي اقتباس (يسمح JSON5 بالمفاتيح المقتبسة).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  تؤدي القيمة `false` إلى تعطيل Skill حتى عندما تكون مضمنة أو مثبتة. إن Skill
  المضمنة `coding-agent` اختيارية التفعيل — اضبطها على `true` وتأكد من تثبيت
  ومصادقة أحد `claude` أو `codex` أو `opencode` أو أي CLI آخر مدعوم.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  حقل تسهيلي لـ Skills التي تعلن `metadata.openclaw.primaryEnv`.
  يدعم سلسلة نصية صريحة أو SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  متغيرات البيئة المحقونة لتشغيل الوكيل. لا تُحقن إلا عندما لا يكون
  المتغير مضبوطًا بالفعل في العملية.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  حاوية اختيارية لحقول الإعداد المخصصة لكل Skill.
</ParamField>

## قوائم سماح الوكلاء (`agents`)

استخدم إعداد الوكيل عندما تريد جذور Skills نفسها على الجهاز/مساحة العمل، لكن
مجموعة Skills ظاهرة مختلفة لكل وكيل.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  قائمة السماح الأساسية المشتركة التي ترثها الوكلاء التي تحذف
  `agents.list[].skills`. احذفها بالكامل لترك Skills بلا قيود
  افتراضيًا.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  مجموعة Skills النهائية الصريحة لذلك الوكيل. القوائم الصريحة **تحل محل**
  الإعدادات الافتراضية الموروثة — ولا تندمج معها. اضبطها على `[]` لعدم إظهار أي Skills
  لذلك الوكيل.
</ParamField>

<Warning>
  قوائم سماح Skills الخاصة بالوكلاء هي مرشح للرؤية والتحميل لاكتشاف OpenClaw
  للـ Skills، والمطالبات، واكتشاف أوامر الشرطة المائلة، ومزامنة بيئة العزل، ولقطات
  Skills. وهي ليست حدًا للتخويل وقت تشغيل الصدفة. إذا كان بإمكان وكيل
  تشغيل `exec` على المضيف، فلا يزال بإمكان تلك الصدفة تشغيل عملاء خارجيين أو قراءة
  ملفات المضيف المرئية لمستخدم التنفيذ، بما في ذلك سجلات عملاء MCP
  مثل `~/.openclaw/skills/config/mcporter.json`. ولعزل MCP
  لكل وكيل، ادمج قوائم سماح Skills مع عزل بيئة العزل/مستخدم نظام التشغيل،
  وارفض تنفيذ `exec` على المضيف أو قيّده بقائمة سماح صارمة، وفضّل بيانات اعتماد
  خاصة بكل وكيل على خادم MCP.
</Warning>

## ورشة العمل (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  عندما تكون القيمة `true`، يمكن للوكلاء إنشاء مقترحات معلّقة استنادًا إلى إشارات
  المحادثة الدائمة بعد المنعطفات الناجحة. يمر إنشاء Skills بطلب من المستخدم دائمًا
  عبر ورشة Skills بغض النظر عن هذا الإعداد.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  تتطلب `pending` موافقة المشغّل قبل أن ينفّذ الوكيل، من تلقاء نفسه، إجراء التطبيق
  أو الرفض أو العزل. تسمح `auto` بهذه الإجراءات دون موافقة.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  اسمح لتطبيق ورشة Skills بالكتابة عبر الروابط الرمزية لـ Skills في مساحة العمل التي
  تكون وجهتها الفعلية موثوقة بالفعل بواسطة `skills.load.allowSymlinkTargets`. أبقِ
  هذا الخيار معطّلًا ما لم يكن مطلوبًا أن تؤدي عمليات تطبيق المقترحات المُنشأة إلى
  تعديل جذر Skills المشترك ذاك.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  الحد الأقصى للمقترحات المعلّقة والمعزولة المحتفَظ بها لكل مساحة عمل (النطاق
  المسموح: 1-200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  الحد الأقصى لحجم نص المقترح بالبايت (النطاق المسموح: 1024-200000). تُقيَّد
  أوصاف المقترحات بشكل منفصل بحد صارم قدره 160 بايت، لأنها تظهر في مخرجات
  الاكتشاف والقوائم.
</ParamField>

راجع [ورشة Skills](/ar/tools/skill-workshop) لمعرفة دورة حياة المقترح وأوامر CLI
ومعاملات أدوات الوكيل وطرائق Gateway التي يتحكم فيها هذا الإعداد.

## جذور Skills المرتبطة رمزيًا

افتراضيًا، تُعد جذور Skills الخاصة بمساحة العمل ووكيل المشروع والدليل الإضافي
والحزمة حدود احتواء. يُتخطى مجلد Skills مرتبط رمزيًا ضمن `<workspace>/skills`
إذا كانت وجهته خارج الجذر، مع تسجيل رسالة في السجل.

للسماح بتخطيط مقصود للروابط الرمزية، صرّح بالوجهة الموثوقة:

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

باستخدام هذا الإعداد، يُقبل `<workspace>/skills/manager -> ~/Projects/manager/skills`
بعد حل المسار الفعلي. يفحص `extraDirs` المستودع الشقيق مباشرةً؛ ويحافظ
`allowSymlinkTargets` على المسار المرتبط رمزيًا للتخطيطات الحالية.

لا يكتب تطبيق ورشة Skills عبر تلك الروابط الرمزية افتراضيًا. للسماح لتطبيق
الورشة بتعديل Skills ضمن وجهات الروابط الرمزية الموثوقة بالفعل، فعّل ذلك
بشكل منفصل:

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
بالفعل الروابط الرمزية لأدلة Skills دون شروط (مع استمرار تطبيق احتواء
`SKILL.md` لكل Skill) — ولا يلزم `allowSymlinkTargets` إلا لجذور مساحة العمل
والدليل الإضافي ووكيل المشروع (`<workspace>/.agents/skills`).

## Skills المعزولة ومتغيرات البيئة

<Warning>
  ينطبق `skills.entries.<skill>.env` و`apiKey` على عمليات تشغيل **المضيف** فقط.
  ولا يكون لهما أي تأثير داخل بيئة معزولة — ستفشل Skill تعتمد على
  `GEMINI_API_KEY` بالرسالة `apiKey not configured` ما لم يُمرَّر المتغير إلى
  البيئة المعزولة بشكل منفصل.
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
  يمكن للمستخدمين الذين لديهم صلاحية الوصول إلى برنامج Docker الخفي فحص قيم
  `sandbox.docker.env` من خلال بيانات Docker الوصفية. استخدم ملف أسرار موصولًا،
  أو صورة مخصصة، أو مسار تسليم آخر عندما لا يكون هذا الكشف مقبولًا.
</Note>

## تذكير بترتيب التحميل

```text
workspace/skills      (الأعلى)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
Skills المضمّنة
skills.load.extraDirs (الأدنى)
```

تسري التغييرات على Skills والإعدادات في الجلسة الجديدة التالية عندما تكون
المراقبة مفعّلة، أو في منعطف الوكيل التالي عندما تكتشف المراقبة تغييرًا.

## ذو صلة

<CardGroup cols={2}>
  <Card title="مرجع Skills" href="/ar/tools/skills" icon="puzzle-piece">
    ماهية Skills وترتيب التحميل والتقييد وتنسيق SKILL.md.
  </Card>
  <Card title="إنشاء Skills" href="/ar/tools/creating-skills" icon="hammer">
    تأليف Skills مخصصة لمساحة العمل.
  </Card>
  <Card title="ورشة Skills" href="/ar/tools/skill-workshop" icon="flask">
    قائمة انتظار المقترحات لـ Skills التي يصوغها الوكيل.
  </Card>
  <Card title="أوامر الشرطة المائلة" href="/ar/tools/slash-commands" icon="terminal">
    كتالوج أوامر الشرطة المائلة الأصلية وتوجيهات الدردشة.
  </Card>
</CardGroup>
