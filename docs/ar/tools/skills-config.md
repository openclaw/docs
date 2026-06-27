---
read_when:
    - تكوين تحميل Skills أو تثبيتها أو سلوك تقييدها
    - ضبط ظهور Skills لكل وكيل
    - ضبط حدود ورشة المهارات أو سياسة الموافقة
sidebarTitle: Skills config
summary: مرجع كامل لمخطط إعدادات skills.*، وقوائم السماح للوكلاء، وإعدادات ورشة العمل، ومعالجة متغيرات بيئة الاختبار المعزولة.
title: إعدادات Skills
x-i18n:
    generated_at: "2026-06-27T18:45:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c1ba6beb1e06e7090dd6669320a91893bf26abe71633914e7564aebb59c637f
    source_path: tools/skills-config.md
    workflow: 16
---

توجد معظم إعدادات Skills ضمن `skills` في
`~/.openclaw/openclaw.json`. وتوجد الرؤية الخاصة بكل وكيل ضمن
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
  مع أداة `image_generate` الأساسية بدلا من `skills.entries`. إدخالات Skills
  مخصصة فقط لسير عمل Skills المخصصة أو التابعة لجهات خارجية.
</Note>

## التحميل (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  أدلة Skills إضافية لفحصها، بأدنى أولوية (بعد Skills المجمعة
  وSkills الخاصة بالـ Plugin). يتم توسيع المسارات مع دعم `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  أدلة أهداف حقيقية موثوقة قد تُحل إليها مجلدات Skills المرتبطة رمزيا،
  حتى عندما يكون الرابط الرمزي خارج الجذر المكوّن. استخدم هذا للتخطيطات
  المقصودة لمستودعات شقيقة مثل
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. أبق هذه القائمة
  ضيقة — لا تشر إلى جذور واسعة مثل `~` أو `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  راقب مجلدات Skills وحدّث لقطة Skills عند تغير ملفات `SKILL.md`.
  يشمل ذلك الملفات المتداخلة ضمن جذور Skills المجمعة.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  نافذة إزالة الارتداد لأحداث مراقب Skills بالميلي ثانية.
</ParamField>

## التثبيت (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  فضّل مثبتات Homebrew عندما يكون `brew` متاحا.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  تفضيل مدير حزم Node لتثبيتات Skills. يؤثر هذا فقط في تثبيتات Skills —
  يجب أن يظل وقت تشغيل Gateway يستخدم Node (لا يُوصى بـ Bun
  لـ WhatsApp/Telegram). استخدم `openclaw setup --node-manager` لـ npm أو pnpm
  أو bun؛ واضبط `"yarn"` يدويا لتثبيتات Skills المدعومة بـ Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  اسمح لعملاء Gateway الموثوقين من نوع `operator.admin` بتثبيت أرشيفات zip
  خاصة مهيأة عبر `skills.upload.*`. تثبيتات ClawHub العادية لا تحتاج إلى
  هذا الإعداد.
</ParamField>

## سياسة تثبيت المشغل (`security.installPolicy`)

استخدم `security.installPolicy` عندما يحتاج المشغلون إلى أمر محلي موثوق
للموافقة على تثبيتات Skills وPlugins أو حظرها باستخدام سياسة خاصة بالمضيف. تعمل السياسة
بعد أن يهيئ OpenClaw مادة المصدر وقبل استمرار التثبيت أو التحديث. تنطبق على
Skills من ClawHub، وSkills المرفوعة، وSkills من Git/المحلية،
ومثبتات اعتماديات Skills، ومصادر تثبيت/تحديث Plugins.

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
  يفعّل سياسة التثبيت المملوكة للمشغل. عند التفعيل دون أمر `exec`
  صالح، تفشل التثبيتات بوضع الإغلاق الآمن.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  مرشح هدف اختياري. عند حذفه، تنطبق السياسة على كل هدف مدعوم
  حتى لا تفشل التثبيتات الجديدة بشكل مفتوح على نحو غير متوقع.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  المسار المطلق إلى ملف السياسة التنفيذي الموثوق. يشغله OpenClaw دون
  صدفة ويتحقق من صحة المسار قبل الاستخدام.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  وسائط ثابتة تُمرر بعد `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  أقصى مدة تشغيل فعلية لقرار سياسة واحد.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  أقصى مدة دون خرج stdout أو stderr قبل أن تفشل السياسة بوضع الإغلاق الآمن.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  أقصى عدد بايتات مجمعة مقبولة من stdout وstderr من عملية السياسة.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  متغيرات بيئة حرفية تُقدم إلى عملية السياسة.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  أسماء متغيرات البيئة المنسوخة من عملية OpenClaw إلى عملية السياسة.
  لا تُمرر إلا المتغيرات المسماة.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  قائمة سماح اختيارية بالأدلة التي قد تحتوي ملف السياسة التنفيذي.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  يتجاوز فحوصات ملكية مسار الأمر والأذونات. استخدمه فقط عندما يكون المسار
  محميا بآلية أخرى.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  يسمح بأن يكون مسار الأمر المكوّن رابطا رمزيا. يجب أن يظل الهدف المحلول
  مستوفيا لفحوصات المسار الأخرى. يجب أن تكون وسائط نصوص المفسر
  ملفات عادية مباشرة، لا روابط رمزية.
</ParamField>

تتلقى السياسة كائنا واحدا بصيغة JSON على stdin يحتوي على `protocolVersion: 1`،
و`openclawVersion`، و`targetType`، و`targetName`، و`sourcePath`، و`sourcePathKind`،
و`source` مهيكل اختياري، و`origin` مهيكل، و`request`. يجب أن تكتب
كائنا واحدا بصيغة JSON على stdout: `{ "protocolVersion": 1, "decision": "allow" }` أو
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. يؤدي الخروج غير الصفري،
أو انتهاء المهلة، أو JSON المشوه، أو الحقول المفقودة، أو إصدارات البروتوكول غير المدعومة
إلى الفشل بوضع الإغلاق الآمن.

لا ينفذ OpenClaw سياسة التثبيت أثناء بدء تشغيل Gateway العادي. تفشل التثبيتات
والتحديثات بوضع الإغلاق الآمن عندما تكون السياسة مفعلة لكنها غير متاحة. يجري `openclaw doctor`
تحققا ثابتا، وينفذ `openclaw doctor --deep` فحص تثبيت اصطناعيا
ضد الأمر المكوّن.

تطبق التحديثات المجمعة السياسة لكل هدف: يؤدي تحديث Skill أو Plugin محظور إلى فشل
ذلك الهدف دون تعطيل السياسة أو تخطي الأهداف اللاحقة في الدفعة.

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
        reason: "local plugin paths are not approved on this host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## قائمة السماح لـ Skills المجمعة

<ParamField path="skills.allowBundled" type="string[]">
  قائمة سماح اختيارية لـ Skills **المجمعة** فقط. عند ضبطها، تكون Skills المجمعة
  الموجودة في القائمة فقط مؤهلة. لا تتأثر Skills المُدارة، وعلى مستوى الوكيل،
  ومساحة العمل.
</ParamField>

## إدخالات كل Skill (`skills.entries`)

تطابق المفاتيح ضمن `entries` اسم Skill `name` افتراضيا. إذا عرّفت Skill
`metadata.openclaw.skillKey`، فاستخدم ذلك المفتاح بدلا من ذلك. ضع الأسماء التي تحتوي
على شرطات بين علامات اقتباس (يسمح JSON5 بالمفاتيح المقتبسة).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  يعطل `false` الـ Skill حتى عندما تكون مجمعة أو مثبتة. الـ Skill المجمعة `coding-agent`
  اختيارية التفعيل — اضبطها على `true` وتأكد من تثبيت ومصادقة أحد `claude`،
  أو `codex`، أو `opencode`، أو CLI آخر مدعوم.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  حقل تسهيلي لـ Skills التي تعلن `metadata.openclaw.primaryEnv`.
  يدعم سلسلة نصية صريحة أو SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  متغيرات بيئة تُحقن لتشغيل الوكيل. لا تُحقن إلا عندما لا يكون
  المتغير مضبوطا مسبقا في العملية.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  حاوية اختيارية لحقول إعدادات مخصصة لكل Skill.
</ParamField>

## قوائم سماح الوكلاء (`agents`)

استخدم إعدادات الوكيل عندما تريد جذور Skills نفسها على الجهاز/مساحة العمل
لكن مع مجموعة Skills مرئية مختلفة لكل وكيل.

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
  احذفها بالكامل لترك Skills غير مقيدة افتراضيا.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  مجموعة Skills النهائية الصريحة لذلك الوكيل. القوائم الصريحة **تستبدل**
  الإعدادات الافتراضية الموروثة — ولا تدمج معها. اضبطها على `[]` لعدم عرض
  أي Skills لذلك الوكيل.
</ParamField>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  عندما تكون `true`، يمكن للوكلاء إنشاء مقترحات معلقة من إشارات محادثة
  دائمة بعد الجولات الناجحة. إنشاء Skills الذي يطلبه المستخدم يمر دائما
  عبر Skill Workshop بغض النظر عن هذا الإعداد.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  تتطلب `pending` موافقة المشغل قبل أن يطبق الوكيل أو يرفض أو
  يعزل بمبادرته. تسمح `auto` بهذه الإجراءات دون موافقة.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  اسمح لتطبيق Skill Workshop بالكتابة عبر روابط Skills الرمزية في مساحة العمل التي
  يكون هدفها الحقيقي موثوقا مسبقا بواسطة `skills.load.allowSymlinkTargets`. أبق هذا
  معطلا ما لم يكن ينبغي لتطبيقات المقترحات المُنشأة تعديل جذر Skills المشترك ذاك.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  الحد الأقصى للمقترحات المعلقة والمعزولة المحتفظ بها لكل مساحة عمل.
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  الحد الأقصى لحجم متن المقترح بالبايت. تخضع أوصاف المقترحات لحد صارم قدره
  160 بايت لأنها تظهر في مخرجات الاكتشاف والسرد.
</ParamField>

## جذور Skills المرتبطة رمزياً

افتراضياً، تكون جذور Skills الخاصة بمساحة العمل ووكيل المشروع والدليل الإضافي والمضمّنة
حدود احتواء. يتم تخطي مجلد Skills مرتبط رمزياً ضمن `<workspace>/skills`
إذا كان يحل إلى خارج الجذر، مع رسالة سجل.

للسماح بتخطيط ارتباط رمزي مقصود، صرّح عن الهدف الموثوق:

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

مع هذا الإعداد، يتم قبول `<workspace>/skills/manager -> ~/Projects/manager/skills`
بعد حل realpath. يفحص `extraDirs` المستودع الشقيق مباشرة؛
ويحافظ `allowSymlinkTargets` على المسار المرتبط رمزياً للتخطيطات الحالية.

لا يكتب تطبيق ورشة Skills عبر تلك الارتباطات الرمزية افتراضياً. للسماح لتطبيق
الورشة بتعديل Skills ضمن أهداف الارتباطات الرمزية الموثوقة مسبقاً، فعّل ذلك
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
بالفعل الارتباطات الرمزية لأدلة Skills (ولا يزال احتواء `SKILL.md` لكل Skill
ينطبق).

## Skills في صناديق الحماية ومتغيرات البيئة

<Warning>
  ينطبق `skills.entries.<skill>.env` و`apiKey` على تشغيلات **المضيف** فقط. داخل
  صندوق حماية، لا يكون لهما أي تأثير — ستفشل Skill تعتمد على `GEMINI_API_KEY`
  مع `apiKey not configured` ما لم يُمنح صندوق الحماية المتغير
  بشكل منفصل.
</Warning>

مرّر الأسرار إلى صندوق حماية Docker باستخدام:

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
  يمكن للمستخدمين الذين لديهم وصول إلى Docker daemon فحص قيم `sandbox.docker.env`
  عبر بيانات Docker الوصفية. استخدم ملف أسرار مركّباً، أو صورة مخصصة، أو
  مسار تسليم آخر عندما لا يكون هذا التعرض مقبولاً.
</Note>

## تذكير بترتيب التحميل

```text
workspace/skills      (highest)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
bundled skills
skills.load.extraDirs (lowest)
```

تسري تغييرات Skills والإعدادات في الجلسة الجديدة التالية عند تمكين
المراقب، أو في دورة الوكيل التالية عندما يكتشف المراقب تغييراً.

## ذو صلة

<CardGroup cols={2}>
  <Card title="Skills reference" href="/ar/tools/skills" icon="puzzle-piece">
    ما هي Skills، وترتيب التحميل، والبوابات، وتنسيق SKILL.md.
  </Card>
  <Card title="Creating skills" href="/ar/tools/creating-skills" icon="hammer">
    تأليف Skills مخصصة لمساحة العمل.
  </Card>
  <Card title="Skill Workshop" href="/ar/tools/skill-workshop" icon="flask">
    قائمة انتظار المقترحات لـ Skills التي يصوغها الوكيل.
  </Card>
  <Card title="Slash commands" href="/ar/tools/slash-commands" icon="terminal">
    كتالوج أوامر الشرطة المائلة الأصلية وتوجيهات الدردشة.
  </Card>
</CardGroup>
