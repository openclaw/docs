---
read_when:
    - پیکربندی بارگذاری، نصب یا رفتار اعمال محدودیت مهارت
    - تنظیم نمایانی مهارت برای هر عامل
    - تنظیم محدودیت‌های Skill Workshop یا سیاست تأیید
sidebarTitle: Skills config
summary: مرجع کامل برای طرح‌واره پیکربندی skills.*، فهرست‌های مجاز عامل، تنظیمات کارگاه، و مدیریت متغیرهای محیطی سندباکس.
title: پیکربندی Skills
x-i18n:
    generated_at: "2026-07-01T08:24:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37251cd12162c3083b8b9e1a84c462233eb44656a84ca915705859a352c9557b
    source_path: tools/skills-config.md
    workflow: 16
---

بیشتر پیکربندی مهارت‌ها زیر `skills` در
`~/.openclaw/openclaw.json` قرار دارد. قابلیت مشاهده ویژه هر عامل زیر
`agents.defaults.skills` و `agents.list[].skills` قرار دارد.

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
  برای تولید تصویر داخلی، به‌جای `skills.entries` از
  `agents.defaults.imageGenerationModel` به‌همراه ابزار اصلی `image_generate`
  استفاده کنید. ورودی‌های مهارت فقط برای گردش‌کارهای مهارت سفارشی یا شخص ثالث هستند.
</Note>

## بارگذاری (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  دایرکتوری‌های مهارت اضافی برای پویش، با پایین‌ترین اولویت (پس از مهارت‌های
  داخلی و Plugin). مسیرها با پشتیبانی از `~` گسترش داده می‌شوند.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  دایرکتوری‌های هدف واقعی و مورد اعتماد که پوشه‌های مهارت symlinkشده می‌توانند
  به آن‌ها resolve شوند، حتی وقتی symlink بیرون از root پیکربندی‌شده قرار دارد.
  از این برای چیدمان‌های عمدی repoهای هم‌سطح مانند
  `<workspace>/skills/manager -> ~/Projects/manager/skills` استفاده کنید. این فهرست
  را محدود نگه دارید — به rootهای گسترده‌ای مثل `~` یا `~/Projects` اشاره نکنید.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  پوشه‌های مهارت را پایش کنید و وقتی فایل‌های `SKILL.md` تغییر می‌کنند،
  snapshot مهارت‌ها را تازه‌سازی کنید. فایل‌های تودرتو زیر rootهای مهارت گروه‌بندی‌شده
  را نیز پوشش می‌دهد.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  پنجره debounce برای رویدادهای watcher مهارت، برحسب میلی‌ثانیه.
</ParamField>

## نصب (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  وقتی `brew` در دسترس است، نصب‌کننده‌های Homebrew را ترجیح دهید.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  ترجیح مدیر بسته Node برای نصب مهارت‌ها. این فقط بر نصب مهارت‌ها اثر می‌گذارد —
  runtime مربوط به Gateway همچنان باید از Node استفاده کند (Bun برای
  WhatsApp/Telegram توصیه نمی‌شود). برای npm، pnpm، یا bun از
  `openclaw setup --node-manager` استفاده کنید؛ برای نصب مهارت‌های مبتنی بر Yarn،
  `"yarn"` را دستی تنظیم کنید.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  به کلاینت‌های Gateway مورد اعتماد `operator.admin` اجازه دهید آرشیوهای zip خصوصی
  را که از طریق `skills.upload.*` آماده شده‌اند نصب کنند. نصب‌های معمول ClawHub
  به این تنظیم نیاز ندارند.
</ParamField>

## سیاست نصب اپراتور (`security.installPolicy`)

وقتی اپراتورها به یک فرمان محلی مورد اعتماد نیاز دارند تا نصب مهارت و Plugin را
با سیاست ویژه میزبان تأیید یا مسدود کند، از `security.installPolicy` استفاده کنید.
این سیاست پس از آن اجرا می‌شود که OpenClaw مواد منبع را آماده کرده و پیش از آنکه
نصب یا به‌روزرسانی ادامه پیدا کند. این سیاست بر مهارت‌های ClawHub، مهارت‌های
بارگذاری‌شده، مهارت‌های Git/محلی، نصب‌کننده‌های وابستگی مهارت، و منابع نصب/به‌روزرسانی
Plugin اعمال می‌شود.

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
  سیاست نصب متعلق به اپراتور را فعال می‌کند. وقتی بدون یک فرمان `exec` معتبر
  فعال شود، نصب‌ها به‌صورت بسته شکست می‌خورند.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  فیلتر هدف اختیاری. وقتی حذف شود، سیاست بر هر هدف پشتیبانی‌شده اعمال می‌شود
  تا نصب‌های جدید به‌طور غیرمنتظره باز شکست نخورند.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  مسیر مطلق به executable سیاست مورد اعتماد. OpenClaw آن را بدون shell اجرا می‌کند
  و مسیر را پیش از استفاده اعتبارسنجی می‌کند.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  آرگومان‌های ثابت که پس از `command` ارسال می‌شوند.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  حداکثر runtime زمان دیواری برای یک تصمیم سیاست.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  حداکثر زمان بدون خروجی stdout یا stderr پیش از آنکه سیاست به‌صورت بسته شکست بخورد.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  حداکثر بایت‌های ترکیبی stdout و stderr که از فرایند سیاست پذیرفته می‌شود.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  متغیرهای محیطی literal که به فرایند سیاست داده می‌شوند.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  نام متغیرهای محیطی که از فرایند OpenClaw به فرایند سیاست کپی می‌شوند.
  فقط متغیرهای نام‌برده ارسال می‌شوند.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  allowlist اختیاری از دایرکتوری‌هایی که ممکن است executable سیاست را در خود داشته باشند.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  بررسی‌های مالکیت و مجوز مسیر فرمان را دور می‌زند. فقط وقتی استفاده کنید که مسیر
  با سازوکار دیگری محافظت می‌شود.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  اجازه می‌دهد مسیر فرمان پیکربندی‌شده یک symlink باشد. هدف resolveشده همچنان باید
  سایر بررسی‌های مسیر را برآورده کند. آرگومان‌های اسکریپت مفسر باید فایل‌های عادی
  مستقیم باشند، نه symlink.
</ParamField>

این سیاست یک شیء JSON را روی stdin با `protocolVersion: 1`، `openclawVersion`،
`targetType`، `targetName`، `sourcePath`، `sourcePathKind`، `source` ساختاریافته
اختیاری، `origin` ساختاریافته، و `request` دریافت می‌کند. باید یک شیء JSON روی
stdout بنویسد: `{ "protocolVersion": 1, "decision": "allow" }` یا
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. خروج غیرصفر،
timeout، JSON بدشکل، فیلدهای گم‌شده، یا نسخه‌های protocol پشتیبانی‌نشده به‌صورت
بسته شکست می‌خورند.

OpenClaw در زمان startup معمول Gateway سیاست نصب را اجرا نمی‌کند. وقتی سیاست فعال
اما در دسترس نباشد، نصب‌ها و به‌روزرسانی‌ها به‌صورت بسته شکست می‌خورند.
`openclaw doctor` اعتبارسنجی ایستا انجام می‌دهد، و `openclaw doctor --deep`
یک پروب نصب ساختگی را در برابر فرمان پیکربندی‌شده اجرا می‌کند.

به‌روزرسانی‌های انبوه سیاست را برای هر هدف اعمال می‌کنند: به‌روزرسانی مسدودشده
یک مهارت یا Plugin همان هدف را شکست می‌دهد، بدون اینکه سیاست را غیرفعال کند یا
هدف‌های بعدی در batch را نادیده بگیرد.

نمونه stdin:

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

فرمان سیاست حداقلی:

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

## allowlist مهارت‌های داخلی

<ParamField path="skills.allowBundled" type="string[]">
  allowlist اختیاری فقط برای مهارت‌های **داخلی**. وقتی تنظیم شود، فقط مهارت‌های
  داخلی موجود در فهرست واجد شرایط هستند. مهارت‌های مدیریت‌شده، سطح عامل، و workspace
  تحت تأثیر قرار نمی‌گیرند.
</ParamField>

## ورودی‌های هر مهارت (`skills.entries`)

کلیدهای زیر `entries` به‌طور پیش‌فرض با `name` مهارت مطابقت دارند. اگر یک مهارت
`metadata.openclaw.skillKey` را تعریف کند، به‌جای آن از همان کلید استفاده کنید.
نام‌های دارای خط تیره را quote کنید (JSON5 کلیدهای quoteشده را مجاز می‌داند).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` مهارت را حتی وقتی داخلی یا نصب‌شده باشد غیرفعال می‌کند. مهارت داخلی
  `coding-agent` opt-in است — آن را روی `true` تنظیم کنید و مطمئن شوید یکی از
  `claude`، `codex`، `opencode`، یا CLI پشتیبانی‌شده دیگری نصب و احراز هویت شده است.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  فیلد کمکی برای مهارت‌هایی که `metadata.openclaw.primaryEnv` را اعلام می‌کنند.
  از یک رشته plaintext یا یک SecretRef پشتیبانی می‌کند: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  متغیرهای محیطی تزریق‌شده برای اجرای عامل. فقط وقتی تزریق می‌شوند که متغیر
  از قبل در فرایند تنظیم نشده باشد.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  bag اختیاری برای فیلدهای پیکربندی سفارشی هر مهارت.
</ParamField>

## allowlistهای عامل (`agents`)

وقتی rootهای مهارت یکسانی برای machine/workspace می‌خواهید اما مجموعه مهارت قابل
مشاهده متفاوتی برای هر عامل نیاز دارید، از پیکربندی عامل استفاده کنید.

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
  allowlist پایه مشترک که عامل‌هایی که `agents.list[].skills` را حذف کرده‌اند
  از آن ارث می‌برند. برای اینکه مهارت‌ها به‌طور پیش‌فرض نامحدود بمانند، کاملاً حذف کنید.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  مجموعه مهارت نهایی صریح برای آن عامل. فهرست‌های صریح defaultهای ارث‌بری‌شده را
  **جایگزین** می‌کنند — merge نمی‌شوند. برای اینکه هیچ مهارتی برای آن عامل آشکار نشود،
  روی `[]` تنظیم کنید.
</ParamField>

<Warning>
  allowlistهای مهارت عامل یک فیلتر قابلیت مشاهده و بارگذاری برای discovery مهارت
  OpenClaw، promptها، discovery فرمان slash، همگام‌سازی sandbox، و snapshotهای مهارت
  هستند. آن‌ها مرز مجوزدهی در زمان shell نیستند. اگر یک عامل بتواند `exec` میزبان
  را اجرا کند، آن shell همچنان می‌تواند کلاینت‌های خارجی را اجرا کند یا فایل‌های
  میزبانی را بخواند که برای کاربر اجراکننده قابل مشاهده‌اند، از جمله رجیستری‌های
  کلاینت MCP مانند `~/.openclaw/skills/config/mcporter.json`. برای جداسازی MCP
  به‌ازای هر عامل، allowlistهای مهارت را با جداسازی sandbox/کاربر OS ترکیب کنید،
  exec میزبان را رد کنید یا به‌شدت allowlist کنید، و credentialهای به‌ازای هر عامل
  را در MCP server ترجیح دهید.
</Warning>

## کارگاه (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  وقتی `true` باشد، عامل‌ها می‌توانند پس از turnهای موفق، از سیگنال‌های مکالمه
  ماندگار proposalهای pending ایجاد کنند. ایجاد مهارت با prompt کاربر، صرف‌نظر از
  این تنظیم، همیشه از کارگاه مهارت عبور می‌کند.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` پیش از اعمال، رد کردن یا قرنطینه‌ای که توسط عامل آغاز شده باشد،
  تأیید اپراتور را الزامی می‌کند. `auto` این اقدامات را بدون تأیید مجاز می‌کند.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  به اعمال کارگاه مهارت اجازه دهید از طریق symlinkهای مهارت فضای کاری بنویسد
  که مقصد واقعی آن‌ها از پیش توسط `skills.load.allowSymlinkTargets` مورد اعتماد است. این گزینه را
  غیرفعال نگه دارید مگر آن‌که اعمال پیشنهادهای تولیدشده باید آن ریشه مهارت مشترک را
  تغییر دهد.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  بیشترین تعداد پیشنهادهای در انتظار و قرنطینه‌شده که برای هر فضای کاری نگه داشته می‌شود.
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  بیشترین اندازه بدنه پیشنهاد بر حسب بایت. توضیحات پیشنهاد به‌طور سخت‌گیرانه در
  160 بایت محدود شده‌اند، چون در خروجی کشف و فهرست‌گیری نمایش داده می‌شوند.
</ParamField>

## ریشه‌های مهارت symlinkشده

به‌طور پیش‌فرض، ریشه‌های مهارت فضای کاری، عامل پروژه، دایرکتوری اضافه و بسته‌شده
مرزهای محصورسازی هستند. پوشه مهارت symlinkشده زیر `<workspace>/skills`
که به بیرون از ریشه resolve شود، با یک پیام لاگ نادیده گرفته می‌شود.

برای مجاز کردن یک چیدمان symlink عمدی، مقصد مورد اعتماد را اعلام کنید:

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

با این پیکربندی، `<workspace>/skills/manager -> ~/Projects/manager/skills` پس از
realpath resolution پذیرفته می‌شود. `extraDirs` مخزن هم‌سطح را مستقیماً اسکن می‌کند؛
`allowSymlinkTargets` مسیر symlinkشده را برای چیدمان‌های موجود حفظ می‌کند.

اعمال کارگاه مهارت به‌طور پیش‌فرض از طریق آن symlinkها نمی‌نویسد. برای این‌که
Workshop apply بتواند مهارت‌های زیر مقصدهای symlink از پیش مورد اعتماد را تغییر دهد،
جداگانه opt in کنید:

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

دایرکتوری‌های مدیریت‌شده `~/.openclaw/skills` و شخصی `~/.agents/skills`
از پیش symlinkهای دایرکتوری مهارت را می‌پذیرند (محصورسازی `SKILL.md` برای هر مهارت همچنان
اعمال می‌شود).

## مهارت‌های سندباکس‌شده و متغیرهای محیطی

<Warning>
  `skills.entries.<skill>.env` و `apiKey` فقط روی اجراهای **میزبان** اعمال می‌شوند. داخل
  یک سندباکس اثری ندارند — مهارتی که به `GEMINI_API_KEY` وابسته است، مگر آن‌که متغیر
  به‌طور جداگانه به سندباکس داده شود، با `apiKey not configured` شکست می‌خورد.
</Warning>

رازها را با این پیکربندی به یک سندباکس Docker بدهید:

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
  کاربرانی که به daemon مربوط به Docker دسترسی دارند می‌توانند مقدارهای `sandbox.docker.env` را
  از طریق فراداده Docker بررسی کنند. وقتی این افشا پذیرفتنی نیست، از یک فایل راز mountشده،
  یک image سفارشی، یا مسیر تحویل دیگری استفاده کنید.
</Note>

## یادآوری ترتیب بارگذاری

```text
workspace/skills      (highest)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
bundled skills
skills.load.extraDirs (lowest)
```

تغییرات مهارت‌ها و پیکربندی در نشست جدید بعدی، وقتی watcher فعال باشد،
یا در نوبت بعدی عامل، وقتی watcher تغییری را تشخیص دهد، اعمال می‌شوند.

## مرتبط

<CardGroup cols={2}>
  <Card title="مرجع Skills" href="/fa/tools/skills" icon="puzzle-piece">
    این‌که Skills چه هستند، ترتیب بارگذاری، دروازه‌گذاری و قالب SKILL.md.
  </Card>
  <Card title="ایجاد مهارت‌ها" href="/fa/tools/creating-skills" icon="hammer">
    نگارش مهارت‌های سفارشی فضای کاری.
  </Card>
  <Card title="کارگاه مهارت" href="/fa/tools/skill-workshop" icon="flask">
    صف پیشنهاد برای مهارت‌های پیش‌نویس‌شده توسط عامل.
  </Card>
  <Card title="دستورهای اسلش" href="/fa/tools/slash-commands" icon="terminal">
    کاتالوگ بومی دستورهای اسلش و دستورالعمل‌های چت.
  </Card>
</CardGroup>
