---
read_when:
    - پیکربندی رفتار بارگذاری، نصب یا دروازه‌گذاری Skills
    - تنظیم نمایانی Skills برای هر عامل
    - تنظیم محدودیت‌های کارگاه Skill یا سیاست تأیید
sidebarTitle: Skills config
summary: مرجع کامل برای طرح‌واره پیکربندی skills.*، فهرست‌های مجاز عامل، تنظیمات کارگاه، و مدیریت متغیرهای محیطی sandbox.
title: پیکربندی Skills
x-i18n:
    generated_at: "2026-06-27T19:04:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c1ba6beb1e06e7090dd6669320a91893bf26abe71633914e7564aebb59c637f
    source_path: tools/skills-config.md
    workflow: 16
---

بیشتر پیکربندی Skills زیر `skills` در
`~/.openclaw/openclaw.json` قرار دارد. قابلیت مشاهده مخصوص agent زیر
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
  استفاده کنید. ورودی‌های Skill فقط برای گردش‌کارهای Skill سفارشی یا شخص ثالث هستند.
</Note>

## بارگذاری (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  دایرکتوری‌های Skill اضافی برای اسکن، با کمترین اولویت (پس از Skills
  بسته‌بندی‌شده و Plugin). مسیرها با پشتیبانی از `~` گسترش داده می‌شوند.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  دایرکتوری‌های مقصد واقعی مورداعتماد که پوشه‌های Skill پیوند نمادین می‌توانند به آن‌ها
  حل شوند، حتی وقتی پیوند نمادین بیرون از ریشه پیکربندی‌شده قرار دارد. از این برای
  چیدمان‌های عمدی مخزن‌های هم‌سطح مانند
  `<workspace>/skills/manager -> ~/Projects/manager/skills` استفاده کنید. این فهرست را
  محدود نگه دارید — آن را به ریشه‌های گسترده‌ای مثل `~` یا `~/Projects` اشاره ندهید.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  پوشه‌های Skill را پایش می‌کند و هنگام تغییر فایل‌های `SKILL.md`، snapshot مربوط به Skills
  را تازه‌سازی می‌کند. فایل‌های تو در تو زیر ریشه‌های Skill گروه‌بندی‌شده را پوشش می‌دهد.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  بازه debounce برای رویدادهای watcher مربوط به Skill برحسب میلی‌ثانیه.
</ParamField>

## نصب (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  وقتی `brew` در دسترس است، نصب‌کننده‌های Homebrew را ترجیح می‌دهد.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  ترجیح مدیر بسته Node برای نصب‌های Skill. این فقط روی نصب‌های Skill اثر می‌گذارد —
  runtime مربوط به Gateway همچنان باید از Node استفاده کند (Bun برای WhatsApp/Telegram
  توصیه نمی‌شود). برای npm، pnpm، یا bun از `openclaw setup --node-manager` استفاده کنید؛
  برای نصب‌های Skill مبتنی بر Yarn، `"yarn"` را دستی تنظیم کنید.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  به کلاینت‌های Gateway با دسترسی `operator.admin` و مورداعتماد اجازه می‌دهد آرشیوهای zip
  خصوصیِ آماده‌شده از طریق `skills.upload.*` را نصب کنند. نصب‌های معمول ClawHub به این
  تنظیم نیاز ندارند.
</ParamField>

## سیاست نصب اپراتور (`security.installPolicy`)

وقتی اپراتورها به یک دستور محلی مورداعتماد نیاز دارند تا نصب‌های Skill و Plugin را با
سیاست مخصوص میزبان تأیید یا مسدود کنند، از `security.installPolicy` استفاده کنید. سیاست
پس از اینکه OpenClaw مواد منبع را آماده کرد و پیش از ادامه نصب یا به‌روزرسانی اجرا می‌شود.
این سیاست برای Skills متعلق به ClawHub، Skills آپلودشده، Skills مبتنی بر Git/محلی،
نصب‌کننده‌های وابستگی Skill، و منابع نصب/به‌روزرسانی Plugin اعمال می‌شود.

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
  سیاست نصب متعلق به اپراتور را فعال می‌کند. وقتی بدون یک دستور `exec` معتبر فعال شود،
  نصب‌ها به‌صورت fail closed شکست می‌خورند.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  فیلتر هدف اختیاری. وقتی حذف شود، سیاست برای هر هدف پشتیبانی‌شده اعمال می‌شود تا نصب‌های
  جدید به‌طور غیرمنتظره fail open نشوند.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  مسیر مطلق به فایل اجرایی سیاست مورداعتماد. OpenClaw آن را بدون shell اجرا می‌کند و مسیر
  را پیش از استفاده اعتبارسنجی می‌کند.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  آرگومان‌های ثابت که پس از `command` ارسال می‌شوند.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  حداکثر زمان اجرای wall-clock برای یک تصمیم سیاست.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  حداکثر زمان بدون خروجی stdout یا stderr پیش از اینکه سیاست به‌صورت fail closed شکست بخورد.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  حداکثر تعداد بایت‌های ترکیبی stdout و stderr که از فرایند سیاست پذیرفته می‌شود.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  متغیرهای محیطی literal که به فرایند سیاست ارائه می‌شوند.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  نام متغیرهای محیطی که از فرایند OpenClaw به فرایند سیاست کپی می‌شوند. فقط متغیرهای
  نام‌گذاری‌شده ارسال می‌شوند.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  allowlist اختیاری از دایرکتوری‌هایی که می‌توانند شامل فایل اجرایی سیاست باشند.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  بررسی‌های مالکیت و مجوز مسیر دستور را دور می‌زند. فقط زمانی استفاده کنید که مسیر با سازوکار
  دیگری محافظت می‌شود.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  اجازه می‌دهد مسیر دستور پیکربندی‌شده یک پیوند نمادین باشد. مقصد حل‌شده همچنان باید سایر
  بررسی‌های مسیر را برآورده کند. آرگومان‌های اسکریپت مفسر باید فایل‌های عادی مستقیم باشند،
  نه پیوند نمادین.
</ParamField>

سیاست یک شیء JSON را روی stdin با `protocolVersion: 1`، `openclawVersion`،
`targetType`، `targetName`، `sourcePath`، `sourcePathKind`، `source` ساخت‌یافته اختیاری،
`origin` ساخت‌یافته، و `request` دریافت می‌کند. باید یک شیء JSON را روی stdout بنویسد:
`{ "protocolVersion": 1, "decision": "allow" }` یا
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. خروج غیرصفر، timeout،
JSON بدشکل، فیلدهای گمشده، یا نسخه‌های protocol پشتیبانی‌نشده به‌صورت fail closed شکست
می‌خورند.

OpenClaw سیاست نصب را هنگام startup معمول Gateway اجرا نمی‌کند. وقتی سیاست فعال اما
در دسترس نباشد، نصب‌ها و به‌روزرسانی‌ها به‌صورت fail closed شکست می‌خورند.
`openclaw doctor` اعتبارسنجی ایستا انجام می‌دهد، و `openclaw doctor --deep` یک probe
مصنوعی نصب را در برابر دستور پیکربندی‌شده اجرا می‌کند.

به‌روزرسانی‌های گروهی سیاست را برای هر هدف جداگانه اعمال می‌کنند: یک به‌روزرسانی Skill یا
Plugin مسدودشده برای همان هدف شکست می‌خورد، بدون اینکه سیاست را غیرفعال کند یا اهداف بعدی
در batch را رد کند.

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

دستور حداقلی سیاست:

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

## allowlist مربوط به Skill بسته‌بندی‌شده

<ParamField path="skills.allowBundled" type="string[]">
  allowlist اختیاری فقط برای Skills **بسته‌بندی‌شده**. وقتی تنظیم شود، فقط Skills
  بسته‌بندی‌شده موجود در فهرست واجد شرایط هستند. Skills مدیریت‌شده، سطح agent، و workspace
  تحت تأثیر قرار نمی‌گیرند.
</ParamField>

## ورودی‌های هر Skill (`skills.entries`)

کلیدهای زیر `entries` به‌طور پیش‌فرض با `name` مربوط به Skill مطابقت دارند. اگر یک Skill
`metadata.openclaw.skillKey` را تعریف کند، به‌جای آن از همان کلید استفاده کنید. نام‌های
دارای خط تیره را در نقل‌قول قرار دهید (JSON5 کلیدهای نقل‌قول‌شده را مجاز می‌داند).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` حتی وقتی Skill بسته‌بندی‌شده یا نصب‌شده باشد، آن را غیرفعال می‌کند. Skill
  بسته‌بندی‌شده `coding-agent` opt-in است — آن را روی `true` تنظیم کنید و مطمئن شوید یکی از
  `claude`، `codex`، `opencode`، یا یک CLI پشتیبانی‌شده دیگر نصب و احراز هویت شده است.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  فیلد راحتی برای Skills که `metadata.openclaw.primaryEnv` را اعلام می‌کنند.
  از یک رشته plaintext یا یک SecretRef پشتیبانی می‌کند:
  `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  متغیرهای محیطی که برای اجرای agent تزریق می‌شوند. فقط وقتی تزریق می‌شوند که متغیر از قبل
  در فرایند تنظیم نشده باشد.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  کیسه اختیاری برای فیلدهای پیکربندی سفارشی هر Skill.
</ParamField>

## allowlistهای agent (`agents`)

وقتی می‌خواهید ریشه‌های Skill یکسانی برای ماشین/workspace داشته باشید اما مجموعه Skill
قابل مشاهده برای هر agent متفاوت باشد، از پیکربندی agent استفاده کنید.

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
  allowlist پایه مشترک که agentهایی که `agents.list[].skills` را حذف می‌کنند از آن ارث می‌برند.
  برای اینکه Skills به‌طور پیش‌فرض نامحدود بمانند، آن را کاملاً حذف کنید.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  مجموعه Skill نهایی صریح برای آن agent. فهرست‌های صریح پیش‌فرض‌های ارث‌بری‌شده را
  **جایگزین** می‌کنند — آن‌ها را ادغام نمی‌کنند. برای اینکه هیچ Skill برای آن agent عرضه
  نشود، آن را روی `[]` تنظیم کنید.
</ParamField>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  وقتی `true` باشد، agentها می‌توانند پس از turnهای موفق از سیگنال‌های durable conversation
  پیشنهادهای pending بسازند. ایجاد Skill با درخواست کاربر، صرف‌نظر از این تنظیم، همیشه از
  Skill Workshop عبور می‌کند.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` پیش از apply، reject، یا quarantine آغازشده توسط agent به تأیید اپراتور نیاز دارد.
  `auto` این اقدام‌ها را بدون تأیید مجاز می‌کند.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  به apply در Skill Workshop اجازه می‌دهد از طریق پیوندهای نمادین Skill در workspace بنویسد
  که مقصد واقعی‌شان از قبل توسط `skills.load.allowSymlinkTargets` مورداعتماد است. این را
  غیرفعال نگه دارید مگر اینکه applyهای پیشنهاد تولیدشده باید آن ریشه Skill مشترک را تغییر دهند.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  حداکثر پیشنهادهای در انتظار و قرنطینه‌شده که به‌ازای هر فضای کاری نگه داشته می‌شوند.
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  حداکثر اندازه بدنه پیشنهاد بر حسب بایت. توضیحات پیشنهاد به‌طور سخت‌گیرانه به
  ۱۶۰ بایت محدود شده‌اند، چون در خروجی کشف و فهرست‌کردن نمایش داده می‌شوند.
</ParamField>

## ریشه‌های مهارت پیوند نمادین‌شده

به‌طور پیش‌فرض، ریشه‌های مهارت فضای کاری، عامل پروژه، دایرکتوری اضافی، و مهارت‌های همراه
مرزهای محصورسازی هستند. پوشه مهارت پیوند نمادین‌شده‌ای زیر `<workspace>/skills`
که به بیرون از ریشه resolve شود، با یک پیام لاگ نادیده گرفته می‌شود.

برای مجاز کردن یک چیدمان پیوند نمادین عمدی، مقصد مورد اعتماد را اعلام کنید:

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
resolve شدن realpath پذیرفته می‌شود. `extraDirs` مخزن هم‌سطح را مستقیما اسکن می‌کند؛
`allowSymlinkTargets` مسیر پیوند نمادین‌شده را برای چیدمان‌های موجود حفظ می‌کند.

اعمال Skill Workshop به‌طور پیش‌فرض از طریق آن پیوندهای نمادین نمی‌نویسد. برای اینکه
اعمال Workshop بتواند مهارت‌های زیر مقصدهای پیوند نمادین از پیش مورد اعتماد را تغییر دهد،
جداگانه فعالش کنید:

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
از قبل پیوندهای نمادین دایرکتوری مهارت را می‌پذیرند (محصورسازی `SKILL.md` برای هر مهارت
همچنان اعمال می‌شود).

## مهارت‌های سندباکس‌شده و متغیرهای محیطی

<Warning>
  `skills.entries.<skill>.env` و `apiKey` فقط برای اجراهای **میزبان** اعمال می‌شوند. داخل
  یک سندباکس اثری ندارند — مهارتی که به `GEMINI_API_KEY` وابسته است، با
  `apiKey not configured` شکست می‌خورد مگر اینکه متغیر به‌صورت جداگانه به سندباکس داده شود.
</Warning>

اسرار را با این پیکربندی به یک سندباکس Docker بدهید:

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
  کاربرانی که به daemon Docker دسترسی دارند می‌توانند مقادیر `sandbox.docker.env` را
  از طریق فراداده Docker بررسی کنند. وقتی این افشا قابل قبول نیست، از یک فایل secret
  mountشده، یک image سفارشی، یا مسیر تحویل دیگری استفاده کنید.
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

تغییرات مهارت‌ها و پیکربندی در جلسه جدید بعدی، وقتی watcher فعال باشد،
یا در نوبت بعدی عامل، وقتی watcher تغییری را تشخیص دهد، اثر می‌گذارند.

## مرتبط

<CardGroup cols={2}>
  <Card title="مرجع Skills" href="/fa/tools/skills" icon="puzzle-piece">
    اینکه مهارت‌ها چه هستند، ترتیب بارگذاری، gating، و قالب SKILL.md.
  </Card>
  <Card title="ایجاد مهارت‌ها" href="/fa/tools/creating-skills" icon="hammer">
    تالیف مهارت‌های سفارشی فضای کاری.
  </Card>
  <Card title="Skill Workshop" href="/fa/tools/skill-workshop" icon="flask">
    صف پیشنهاد برای مهارت‌های پیش‌نویس‌شده توسط عامل.
  </Card>
  <Card title="دستورهای اسلش" href="/fa/tools/slash-commands" icon="terminal">
    کاتالوگ دستورهای اسلش بومی و دستورالعمل‌های چت.
  </Card>
</CardGroup>
