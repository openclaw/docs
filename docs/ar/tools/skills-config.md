---
read_when:
    - ضبط سلوك تحميل Skills أو تثبيتها أو تقييدها
    - ضبط إمكانية رؤية Skills لكل وكيل
    - ضبط حدود ورشة Skills أو سياسة الموافقة
sidebarTitle: Skills config
summary: مرجع كامل لمخطط إعدادات `skills.*`، وقوائم السماح للوكلاء، وإعدادات ورشة العمل، ومعالجة متغيرات بيئة sandbox.
title: إعدادات Skills
x-i18n:
    generated_at: "2026-07-01T08:10:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37251cd12162c3083b8b9e1a84c462233eb44656a84ca915705859a352c9557b
    source_path: tools/skills-config.md
    workflow: 16
---

توجد معظم إعدادات skills ضمن `skills` في
`~/.openclaw/openclaw.json`. وتوجد الرؤية الخاصة بالوكيل ضمن
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
  لإنشاء الصور المدمج، استخدم `agents.defaults.imageGenerationModel`
  مع أداة `image_generate` الأساسية بدلا من `skills.entries`. إدخالات skill
  مخصصة فقط لسير عمل skills المخصصة أو التابعة لجهات خارجية.
</Note>

## التحميل (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  أدلة skills إضافية لفحصها، بأدنى أسبقية (بعد skills المدمجة
  وskills الخاصة بـ Plugin). يتم توسيع المسارات مع دعم `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  أدلة أهداف حقيقية موثوقة يمكن أن تُحل إليها مجلدات skills الرمزية،
  حتى عندما يكون الرابط الرمزي خارج الجذر المكوّن. استخدم هذا
  لتخطيطات مستودعات شقيقة مقصودة مثل
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. أبق هذه القائمة
  ضيقة — لا توجهها إلى جذور واسعة مثل `~` أو `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  راقب مجلدات skills وحدّث لقطة skills عندما تتغير ملفات `SKILL.md`.
  يغطي ذلك الملفات المتداخلة ضمن جذور skills المجمعة.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  نافذة إزالة الارتداد لأحداث مراقب skills بالميلي ثانية.
</ParamField>

## التثبيت (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  فضّل مثبّتات Homebrew عندما يكون `brew` متاحا.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  تفضيل مدير حزم Node لتثبيتات skills. يؤثر هذا فقط في تثبيتات skills
  — يجب أن يظل وقت تشغيل Gateway يستخدم Node (لا يوصى بـ Bun
  لـ WhatsApp/Telegram). استخدم `openclaw setup --node-manager` لـ npm أو pnpm
  أو bun؛ عيّن `"yarn"` يدويا لتثبيتات skills المدعومة بـ Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  اسمح لعملاء Gateway الموثوقين ذوي `operator.admin` بتثبيت أرشيفات zip
  خاصة تم تجهيزها عبر `skills.upload.*`. لا تحتاج تثبيتات ClawHub العادية
  إلى هذا الإعداد.
</ParamField>

## سياسة تثبيت المشغّل (`security.installPolicy`)

استخدم `security.installPolicy` عندما يحتاج المشغّلون إلى أمر محلي موثوق
للموافقة على تثبيتات skills وPlugin أو حظرها بسياسة خاصة بالمضيف. تعمل السياسة
بعد أن يجهّز OpenClaw مواد المصدر وقبل متابعة التثبيت أو التحديث.
تنطبق على skills في ClawHub، وskills المرفوعة، وskills من Git/محلية،
ومثبّتات اعتماديات skills، ومصادر تثبيت/تحديث Plugin.

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
  يفعّل سياسة التثبيت المملوكة للمشغّل. عند تفعيلها من دون أمر `exec`
  صالح، تفشل التثبيتات بإغلاق آمن.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  مرشّح هدف اختياري. عند حذفه، تنطبق السياسة على كل هدف مدعوم
  حتى لا تفشل التثبيتات الجديدة بشكل مفتوح على نحو غير متوقع.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  مسار مطلق إلى ملف السياسة التنفيذي الموثوق. يشغّله OpenClaw من دون
  صدفة ويتحقق من المسار قبل الاستخدام.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  وسيطات ثابتة تُمرر بعد `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  أقصى زمن تشغيل فعلي لقرار سياسة واحد.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  أقصى مدة من دون مخرجات stdout أو stderr قبل أن تفشل السياسة بإغلاق آمن.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  أقصى عدد مقبول من بايتات stdout وstderr مجتمعة من عملية السياسة.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  متغيرات بيئة حرفية تُقدم إلى عملية السياسة.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  أسماء متغيرات البيئة المنسوخة من عملية OpenClaw إلى عملية السياسة.
  تُمرر المتغيرات المسماة فقط.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  قائمة سماح اختيارية بالأدلة التي قد تحتوي ملف السياسة التنفيذي.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  يتجاوز فحوص ملكية مسار الأمر وأذوناته. استخدمه فقط عندما يكون المسار
  محميا بآلية أخرى.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  يسمح لمسار الأمر المكوّن بأن يكون رابطا رمزيا. يجب أن يظل الهدف المحلول
  مستوفيا فحوص المسار الأخرى. يجب أن تكون وسيطات سكربت المفسّر
  ملفات عادية مباشرة، لا روابط رمزية.
</ParamField>

تتلقى السياسة كائن JSON واحدا على stdin مع `protocolVersion: 1`،
و`openclawVersion`، و`targetType`، و`targetName`، و`sourcePath`، و`sourcePathKind`،
و`source` منظّم اختياري، و`origin` منظّم، و`request`. ويجب أن تكتب
كائن JSON واحدا على stdout: `{ "protocolVersion": 1, "decision": "allow" }` أو
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. تؤدي حالة
خروج غير صفرية، أو انتهاء مهلة، أو JSON مشوّه، أو حقول مفقودة، أو إصدارات
بروتوكول غير مدعومة إلى فشل بإغلاق آمن.

لا ينفذ OpenClaw سياسة التثبيت أثناء بدء تشغيل Gateway العادي. تفشل
التثبيتات والتحديثات بإغلاق آمن عندما تكون السياسة مفعّلة ولكن غير متاحة.
يجري `openclaw doctor` تحققا ثابتا، وينفذ `openclaw doctor --deep` مسبارا
اصطناعيا للتثبيت مقابل الأمر المكوّن.

تطبق التحديثات المجمعة السياسة لكل هدف: يؤدي حظر تحديث skill أو Plugin
إلى فشل ذلك الهدف من دون تعطيل السياسة أو تخطي الأهداف اللاحقة في الدفعة.

مثال stdin:

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

## قائمة سماح skills المدمجة

<ParamField path="skills.allowBundled" type="string[]">
  قائمة سماح اختيارية لـ skills **المدمجة** فقط. عند تعيينها، تكون skills
  المدمجة في القائمة فقط مؤهلة. لا تتأثر skills المُدارة، وعلى مستوى الوكيل،
  وعلى مستوى مساحة العمل.
</ParamField>

## إدخالات كل skill (`skills.entries`)

تطابق المفاتيح ضمن `entries` اسم skill `name` افتراضيا. إذا عرّفت skill
`metadata.openclaw.skillKey`، فاستخدم ذلك المفتاح بدلا منه. ضع الأسماء
الموصولة بشرطات بين علامتي اقتباس (يسمح JSON5 بالمفاتيح المقتبسة).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  يعطّل `false` هذه skill حتى عندما تكون مدمجة أو مثبتة. إن skill المدمجة
  `coding-agent` اختيارية — عيّنها إلى `true` وتأكد من تثبيت ومصادقة أحد
  `claude` أو `codex` أو `opencode` أو CLI آخر مدعوم.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  حقل ملاءمة لـ skills التي تعلن `metadata.openclaw.primaryEnv`.
  يدعم سلسلة نصية صريحة أو SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  متغيرات بيئة تُحقن لتشغيل الوكيل. لا تُحقن إلا عندما لا يكون
  المتغير مضبوطا بالفعل في العملية.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  حاوية اختيارية لحقول إعدادات مخصصة لكل skill.
</ParamField>

## قوائم سماح الوكلاء (`agents`)

استخدم إعدادات الوكيل عندما تريد جذور skills نفسها على الجهاز/مساحة العمل
ولكن مجموعة skills مرئية مختلفة لكل وكيل.

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
  قائمة سماح أساسية مشتركة ترثها الوكلاء التي تحذف `agents.list[].skills`.
  احذفها بالكامل لترك skills غير مقيدة افتراضيا.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  مجموعة skills نهائية صريحة لذلك الوكيل. القوائم الصريحة **تستبدل**
  الافتراضات الموروثة — ولا تدمج معها. عيّنها إلى `[]` لعدم كشف أي skills
  لذلك الوكيل.
</ParamField>

<Warning>
  قوائم سماح skills الخاصة بالوكيل هي مرشح رؤية وتحميل لاكتشاف skills في OpenClaw،
  والمطالبات، واكتشاف أوامر الشرطة المائلة، ومزامنة sandbox، ولقطات skills.
  وهي ليست حدّ تفويض وقت الصدفة. إذا كان بإمكان الوكيل تشغيل `exec` على المضيف،
  فيمكن لتلك الصدفة أن تظل تشغّل عملاء خارجيين أو تقرأ ملفات المضيف المرئية
  لمستخدم التنفيذ، بما في ذلك سجلات عملاء MCP مثل
  `~/.openclaw/skills/config/mcporter.json`. لعزل MCP لكل وكيل، ادمج قوائم سماح
  skills مع عزل sandbox/مستخدم نظام التشغيل، وارفض `exec` المضيف أو ضعه ضمن
  قائمة سماح ضيقة، وفضّل بيانات اعتماد لكل وكيل على خادم MCP.
</Warning>

## ورشة العمل (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  عندما تكون `true`، يمكن للوكلاء إنشاء مقترحات معلّقة من إشارات محادثة
  دائمة بعد أدوار ناجحة. يمر إنشاء skills الذي يطلبه المستخدم دائما عبر
  Skill Workshop بغض النظر عن هذا الإعداد.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  يتطلب `pending` موافقة المشغّل قبل التطبيق أو الرفض أو العزل بمبادرة من الوكيل.
  يتيح `auto` هذه الإجراءات دون موافقة.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  اسمح لتطبيق Skill Workshop بالكتابة عبر الروابط الرمزية لـ Skills في مساحة العمل التي يكون
  هدفها الحقيقي موثوقًا به بالفعل بواسطة `skills.load.allowSymlinkTargets`. أبقِ هذا
  معطّلًا ما لم يكن من المفترض أن تعدّل تطبيقات المقترحات المولّدة جذر Skill المشترك
  ذاك.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  الحد الأقصى للمقترحات المعلّقة والمعزولة المحتفَظ بها لكل مساحة عمل.
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  الحد الأقصى لحجم نص المقترح بالبايت. أوصاف المقترحات محددة بحد صارم قدره
  160 بايت لأنها تظهر في مخرجات الاكتشاف والقوائم.
</ParamField>

## جذور Skills المرتبطة رمزيًا

افتراضيًا، تكون جذور Skills الخاصة بمساحة العمل ووكيل المشروع والدليل الإضافي
والمضمّنة حدود احتواء. يتم تخطي مجلد Skill المرتبط رمزيًا ضمن `<workspace>/skills`
إذا كان يحل إلى خارج الجذر، مع رسالة سجل.

للسماح بتخطيط رابط رمزي مقصود، صرّح بالهدف الموثوق:

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

باستخدام هذا التكوين، يتم قبول `<workspace>/skills/manager -> ~/Projects/manager/skills`
بعد حل المسار الحقيقي. يفحص `extraDirs` المستودع الشقيق مباشرة؛ ويحافظ
`allowSymlinkTargets` على المسار المرتبط رمزيًا للتخطيطات الحالية.

لا يكتب تطبيق Skill Workshop عبر تلك الروابط الرمزية افتراضيًا. للسماح
لتطبيق Workshop بتعديل Skills ضمن أهداف روابط رمزية موثوق بها بالفعل، اشترك
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

تقبل أدلة `~/.openclaw/skills` المُدارة و`~/.agents/skills` الشخصية
بالفعل الروابط الرمزية لأدلة Skills (لا يزال احتواء `SKILL.md` لكل Skill
مطبقًا).

## Skills المعزولة ومتغيرات البيئة

<Warning>
  ينطبق `skills.entries.<skill>.env` و`apiKey` على تشغيلات **المضيف** فقط. داخل
  صندوق عزل لا يكون لهما أي تأثير — ستفشل Skill التي تعتمد على `GEMINI_API_KEY`
  مع `apiKey not configured` ما لم يُعطَ صندوق العزل المتغير
  بشكل منفصل.
</Warning>

مرّر الأسرار إلى صندوق عزل Docker باستخدام:

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
  يمكن للمستخدمين الذين لديهم وصول إلى عفريت Docker فحص قيم `sandbox.docker.env`
  من خلال بيانات Docker الوصفية. استخدم ملف أسرار مركّبًا، أو صورة مخصصة، أو
  مسار تسليم آخر عندما لا يكون هذا الانكشاف مقبولًا.
</Note>

## تذكير ترتيب التحميل

```text
workspace/skills      (highest)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
bundled skills
skills.load.extraDirs (lowest)
```

تسري تغييرات Skills والتكوين في الجلسة الجديدة التالية عندما يكون المراقب
ممكّنًا، أو في دور الوكيل التالي عندما يكتشف المراقب تغييرًا.

## ذات صلة

<CardGroup cols={2}>
  <Card title="مرجع Skills" href="/ar/tools/skills" icon="puzzle-piece">
    ما هي Skills، وترتيب التحميل، والضبط، وتنسيق SKILL.md.
  </Card>
  <Card title="إنشاء Skills" href="/ar/tools/creating-skills" icon="hammer">
    تأليف Skills مخصصة لمساحة العمل.
  </Card>
  <Card title="Skill Workshop" href="/ar/tools/skill-workshop" icon="flask">
    قائمة انتظار المقترحات لـ Skills التي يصوغها الوكيل.
  </Card>
  <Card title="أوامر الشرطة المائلة" href="/ar/tools/slash-commands" icon="terminal">
    كتالوج أوامر الشرطة المائلة الأصلية وتوجيهات الدردشة.
  </Card>
</CardGroup>
