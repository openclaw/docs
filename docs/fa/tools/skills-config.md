---
read_when:
    - پیکربندی رفتار بارگذاری، نصب یا دسترسی مشروط Skills
    - تنظیم مشاهده‌پذیری Skills برای هر عامل
    - تنظیم محدودیت‌ها یا خط‌مشی تأیید کارگاه Skill
sidebarTitle: Skills config
summary: مرجع کامل برای شِمای پیکربندی skills.*، فهرست‌های مجاز عامل، تنظیمات کارگاه و مدیریت متغیرهای محیطی سندباکس.
title: پیکربندی Skills
x-i18n:
    generated_at: "2026-07-16T17:51:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1633364a7333ba00f5f6c8d6f1f478b65e63bc97de23705e492eb980967ec521
    source_path: tools/skills-config.md
    workflow: 16
---

بیشتر پیکربندی Skills در `skills` در
`~/.openclaw/openclaw.json` قرار دارد. قابلیت مشاهدهٔ مختص هر عامل در
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
  برای تولید تصویر داخلی، به‌جای `skills.entries` از `agents.defaults.imageGenerationModel`
  به‌همراه ابزار اصلی `image_generate` استفاده کنید. ورودی‌های Skills
  فقط برای گردش‌کارهای سفارشی یا شخص ثالث Skills هستند.
</Note>

## بارگذاری (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  دایرکتوری‌های اضافی Skills برای اسکن، با پایین‌ترین اولویت (پایین‌تر از
  Skills همراه و Plugin). مسیرها با پشتیبانی از `~` بسط داده می‌شوند.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  دایرکتوری‌های مقصد واقعی و مورداعتمادی که پوشه‌های Skills دارای پیوند نمادین
  می‌توانند به آن‌ها منتهی شوند، حتی وقتی پیوند نمادین خارج از ریشهٔ پیکربندی‌شده
  قرار دارد. از این گزینه برای چیدمان‌های عمدی مخازن هم‌سطح، مانند
  `<workspace>/skills/manager -> ~/Projects/manager/skills` استفاده کنید. این فهرست را
  محدود نگه دارید — به ریشه‌های گسترده‌ای مانند `~` یا `~/Projects` اشاره نکنید.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  پوشه‌های Skills را پایش می‌کند و هنگام تغییر فایل‌های `SKILL.md`،
  تصویر لحظه‌ای Skills را تازه‌سازی می‌کند. فایل‌های تودرتو زیر ریشه‌های گروه‌بندی‌شدهٔ Skills را نیز پوشش می‌دهد.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  بازهٔ تأخیرزدایی رویدادهای پایشگر Skills بر حسب میلی‌ثانیه.
</ParamField>

## نصب (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  در صورت موجود بودن `brew`، نصب‌کننده‌های Homebrew را ترجیح می‌دهد.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  مدیر بستهٔ Node ترجیحی برای نصب Skills. این گزینه فقط بر نصب Skills
  اثر می‌گذارد — CLI و زمان‌اجرای Gateway در OpenClaw به Node نیاز دارند، زیرا
  مخزن وضعیت مرجع از `node:sqlite` استفاده می‌کند. `openclaw setup --node-manager` و
  `openclaw onboard --node-manager` مقادیر `npm`، `pnpm` یا `bun` را می‌پذیرند؛ برای
  نصب Skills مبتنی بر Yarn، `"yarn"` را مستقیماً در پیکربندی تنظیم کنید.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  به سرویس‌گیرنده‌های مورداعتماد Gateway در `operator.admin` اجازه می‌دهد بایگانی‌های
  zip خصوصی آماده‌شده از طریق `skills.upload.*` را نصب کنند. نصب‌های عادی ClawHub به
  این تنظیم نیازی ندارند.
</ParamField>

## سیاست نصب اپراتور (`security.installPolicy`)

هنگامی که اپراتورها برای تأیید یا مسدود کردن نصب Skills و Plugin بر اساس
سیاست مختص میزبان به یک فرمان محلی مورداعتماد نیاز دارند، از `security.installPolicy`
استفاده کنید. سیاست پس از آماده‌سازی مواد منبع توسط OpenClaw و پیش از ادامهٔ
نصب یا به‌روزرسانی اجرا می‌شود. این سیاست بر Skills مربوط به ClawHub،
Skills بارگذاری‌شده، Skills مبتنی بر Git/محلی، نصب‌کننده‌های وابستگی Skills
و منابع نصب/به‌روزرسانی Plugin اعمال می‌شود.

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
  سیاست نصب تحت مالکیت اپراتور را فعال می‌کند. اگر بدون یک فرمان معتبر
  `exec` فعال شود، نصب‌ها به‌صورت بسته و ایمن شکست می‌خورند.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  فیلتر اختیاری مقصد. در صورت حذف، سیاست بر همهٔ مقصدهای پشتیبانی‌شده اعمال
  می‌شود تا نصب‌های جدید به‌طور غیرمنتظره به‌صورت باز و ناامن پذیرفته نشوند.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  مسیر مطلق فایل اجرایی مورداعتماد سیاست. OpenClaw آن را بدون پوسته اجرا
  می‌کند و مسیر را پیش از استفاده اعتبارسنجی می‌کند.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  آرگومان‌های ثابتی که پس از `command` ارسال می‌شوند.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  حداکثر زمان واقعی اجرا برای یک تصمیم سیاست.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  حداکثر زمان بدون خروجی stdout یا stderr، پیش از آن‌که سیاست به‌صورت بسته
  و ایمن شکست بخورد.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  حداکثر مجموع بایت‌های stdout و stderr پذیرفته‌شده از فرایند سیاست.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  متغیرهای محیطی صریح ارائه‌شده به فرایند سیاست.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  نام متغیرهای محیطی که از فرایند OpenClaw به فرایند سیاست کپی می‌شوند.
  فقط متغیرهای نام‌برده‌شده ارسال می‌شوند.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  فهرست مجاز اختیاری دایرکتوری‌هایی که می‌توانند فایل اجرایی سیاست را در خود داشته باشند.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  بررسی‌های مالکیت و مجوز مسیر فرمان را دور می‌زند. فقط زمانی استفاده کنید
  که مسیر با سازوکار دیگری محافظت می‌شود.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  اجازه می‌دهد مسیر فرمان پیکربندی‌شده یک پیوند نمادین باشد. مقصد رفع‌شده
  همچنان باید سایر بررسی‌های مسیر را برآورده کند. آرگومان‌های اسکریپت مفسر باید
  فایل‌های عادی مستقیم باشند، نه پیوند نمادین.
</ParamField>

سیاست یک شیء JSON را از stdin با `protocolVersion: 1`،
`openclawVersion`، `targetType`، `targetName`، `sourcePath`، `sourcePathKind`،
`source` ساخت‌یافتهٔ اختیاری، `origin` ساخت‌یافته و `request` دریافت می‌کند. این سیاست باید
یک شیء JSON در stdout بنویسد: `{ "protocolVersion": 1, "decision": "allow" }`
یا `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. خروج با کد غیرصفر،
پایان مهلت، JSON بدشکل، فیلدهای مفقود یا نسخه‌های پشتیبانی‌نشدهٔ پروتکل
به شکست بسته و ایمن منجر می‌شوند.

OpenClaw سیاست نصب را هنگام راه‌اندازی عادی Gateway اجرا نمی‌کند.
اگر سیاست فعال اما در دسترس نباشد، نصب‌ها و به‌روزرسانی‌ها به‌صورت بسته و ایمن شکست می‌خورند.
`openclaw doctor` اعتبارسنجی ایستا انجام می‌دهد؛ `openclaw doctor --deep`
یک کاوش نصب مصنوعی را روی فرمان پیکربندی‌شده اجرا می‌کند.

به‌روزرسانی‌های انبوه سیاست را برای هر مقصد جداگانه اعمال می‌کنند: به‌روزرسانی
مسدودشدهٔ یک Skill یا Plugin برای همان مقصد شکست می‌خورد، بدون آن‌که سیاست
غیرفعال شود یا مقصدهای بعدی در دسته نادیده گرفته شوند.

نمونهٔ stdin:

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

فرمان حداقلی سیاست:

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
        reason: "مسیرهای محلی Plugin در این میزبان تأیید نشده‌اند",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## فهرست مجاز Skills همراه

<ParamField path="skills.allowBundled" type="string[]">
  فهرست مجاز اختیاری فقط برای Skills **همراه**. در صورت تنظیم، فقط Skills
  همراه موجود در فهرست واجد شرایط هستند. Skills مدیریت‌شده، سطح عامل و فضای کاری
  تحت تأثیر قرار نمی‌گیرند.
</ParamField>

## ورودی‌های هر Skill (`skills.entries`)

کلیدهای زیر `entries` به‌طور پیش‌فرض با `name` مربوط به Skill مطابقت دارند. اگر یک Skill
`metadata.openclaw.skillKey` را تعریف کند، به‌جای آن از همان کلید استفاده کنید. نام‌های دارای خط تیره را
داخل نقل‌قول قرار دهید (JSON5 کلیدهای نقل‌قول‌شده را می‌پذیرد).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` حتی در صورت همراه یا نصب‌شده بودن Skill، آن را غیرفعال می‌کند.
  Skill همراه `coding-agent` نیازمند فعال‌سازی صریح است — آن را روی `true` تنظیم کنید و مطمئن شوید یکی از
  `claude`، `codex`، `opencode` یا یک CLI پشتیبانی‌شدهٔ دیگر نصب و
  احراز هویت شده است.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  فیلد کمکی برای Skills که `metadata.openclaw.primaryEnv` را اعلام می‌کنند.
  از رشتهٔ متن ساده یا SecretRef پشتیبانی می‌کند: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  متغیرهای محیطی تزریق‌شده برای اجرای عامل. فقط زمانی تزریق می‌شوند که
  متغیر از قبل در فرایند تنظیم نشده باشد.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  مجموعهٔ اختیاری فیلدهای پیکربندی سفارشی هر Skill.
</ParamField>

## فهرست‌های مجاز عامل (`agents`)

وقتی برای ریشه‌های Skills یکسان در ماشین/فضای کاری، مجموعهٔ قابل‌مشاهدهٔ
متفاوتی از Skills برای هر عامل می‌خواهید، از پیکربندی عامل استفاده کنید.

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
  فهرست مجاز پایهٔ مشترک که عامل‌های فاقد
  `agents.list[].skills` آن را به ارث می‌برند. برای آن‌که Skills به‌طور پیش‌فرض
  نامحدود باقی بمانند، این گزینه را کاملاً حذف کنید.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  مجموعهٔ نهایی و صریح Skills برای آن عامل. فهرست‌های صریح **جایگزین**
  پیش‌فرض‌های ارث‌رسیده می‌شوند — با آن‌ها ادغام نمی‌شوند. برای نمایش ندادن هیچ Skill
  به آن عامل، مقدار را روی `[]` تنظیم کنید.
</ParamField>

<Warning>
  فهرست‌های مجاز Skills عامل، یک فیلتر قابلیت مشاهده و بارگذاری برای کشف
  Skills در OpenClaw، اعلان‌ها، کشف فرمان‌های اسلش، همگام‌سازی جعبهٔ شنی و
  تصاویر لحظه‌ای Skills هستند. آن‌ها مرز مجوزدهی در زمان اجرای پوسته نیستند.
  اگر یک عامل بتواند `exec` میزبان را اجرا کند، آن پوسته همچنان می‌تواند
  سرویس‌گیرنده‌های خارجی را اجرا کند یا فایل‌های میزبان قابل‌مشاهده برای کاربر اجرایی
  را بخواند، از جمله رجیستری‌های سرویس‌گیرندهٔ MCP مانند `~/.openclaw/skills/config/mcporter.json`.
  برای جداسازی MCP به‌ازای هر عامل، فهرست‌های مجاز Skills را با جداسازی
  جعبهٔ شنی/کاربر سیستم‌عامل ترکیب کنید، اجرای میزبان را رد کنید یا به‌شدت
  محدود سازید و اعتبارنامه‌های مختص هر عامل را در سرور MCP ترجیح دهید.
</Warning>

## کارگاه (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  هنگامی که `true` باشد، OpenClaw می‌تواند از اصلاحات ماندگار، پیشنهادهای در انتظار ایجاد کند
  و پس از بی‌کار شدن سیستم، کارهای تکمیل‌شدهٔ موفق و قابل‌توجه را بازبینی
  کند. این قابلیت می‌تواند پس از نوبت‌های واجد شرایط، یک اجرای مدل در پس‌زمینه اضافه کند. ایجاد Skill
  به درخواست کاربر و `/learn`، هنگامی که این تنظیم `false` باشد، همچنان کار می‌کنند.
</ParamField>

برای شرایط واجد‌بودن، حریم خصوصی، هزینه، مجوزهای صرفاً پیشنهادی
و عیب‌یابی، به [خودآموزی](/tools/self-learning) مراجعه کنید.

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"auto"'>
  `auto` اجازه می‌دهد عامل بدون درخواست تأیید اضافی، اعمال، رد یا قرنطینه را آغاز کند.
  `pending` به تأیید اپراتور نیاز دارد.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  به اعمال Skill Workshop اجازه می‌دهد از طریق پیوندهای نمادین Skill در فضای کاری بنویسد که
  مقصد واقعی آن‌ها از قبل مورد اعتماد `skills.load.allowSymlinkTargets` است. این گزینه را غیرفعال نگه دارید،
  مگر اینکه اعمال پیشنهادهای تولیدشده باید آن ریشهٔ مشترک Skill را تغییر دهد.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  حداکثر تعداد پیشنهادهای در انتظار و قرنطینه‌شده که در هر فضای کاری نگه‌داری می‌شوند (بازهٔ مجاز:
  1-200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  حداکثر اندازهٔ بدنهٔ پیشنهاد بر حسب بایت (بازهٔ مجاز: 1024-200000). توضیحات
  پیشنهاد به‌طور جداگانه سقف قطعی 160 بایت دارند، زیرا در خروجی کشف
  و فهرست‌سازی ظاهر می‌شوند.
</ParamField>

برای چرخهٔ عمر پیشنهاد، فرمان‌های CLI، پارامترهای ابزار عامل
و روش‌های Gateway که این پیکربندی کنترل می‌کند، به [Skill Workshop](/fa/tools/skill-workshop) مراجعه کنید.

## ریشه‌های Skill دارای پیوند نمادین

به‌طور پیش‌فرض، ریشه‌های Skill فضای کاری، عامل پروژه، دایرکتوری اضافی و بسته‌بندی‌شده،
مرزهای محصورسازی هستند. پوشهٔ Skill دارای پیوند نمادین زیر `<workspace>/skills`
که به بیرون از ریشه منتهی شود، با ثبت یک پیام در گزارش نادیده گرفته می‌شود.

برای مجاز کردن یک چیدمان عمدی پیوند نمادین، مقصد مورد اعتماد را اعلام کنید:

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

با این پیکربندی، `<workspace>/skills/manager -> ~/Projects/manager/skills`
پس از تفکیک realpath پذیرفته می‌شود. `extraDirs` مخزن هم‌سطح را
مستقیماً اسکن می‌کند؛ `allowSymlinkTargets` مسیر دارای پیوند نمادین را برای چیدمان‌های
موجود حفظ می‌کند.

اعمال Skill Workshop به‌طور پیش‌فرض از طریق این پیوندهای نمادین نمی‌نویسد. برای
اینکه اعمال Workshop بتواند Skillهای زیر مقصدهای پیوند نمادینِ ازپیش‌مورداعتماد را تغییر دهد،
جداگانه آن را فعال کنید:

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

دایرکتوری‌های مدیریت‌شدهٔ `~/.openclaw/skills` و شخصیِ `~/.agents/skills`
از قبل پیوندهای نمادین دایرکتوری Skill را بدون شرط می‌پذیرند (محصورسازی
`SKILL.md` برای هر Skill همچنان اعمال می‌شود) — `allowSymlinkTargets` فقط برای
ریشه‌های فضای کاری، دایرکتوری اضافی و عامل پروژه (`<workspace>/.agents/skills`)
لازم است.

## Skillهای سندباکس‌شده و متغیرهای محیطی

<Warning>
  `skills.entries.<skill>.env` و `apiKey` فقط برای اجراهای **میزبان** اعمال می‌شوند.
  درون سندباکس هیچ اثری ندارند — Skillی که به
  `GEMINI_API_KEY` وابسته باشد، با `apiKey not configured` شکست می‌خورد، مگر اینکه
  متغیر به‌طور جداگانه در اختیار سندباکس قرار گیرد.
</Warning>

اسرار را به این شکل به یک سندباکس Docker انتقال دهید:

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
  کاربرانی که به daemon داکر دسترسی دارند، می‌توانند مقادیر `sandbox.docker.env` را
  از طریق فرادادهٔ Docker بررسی کنند. هنگامی که چنین افشایی پذیرفتنی نیست، از فایل محرمانهٔ
  نصب‌شده، تصویر سفارشی یا مسیر تحویل دیگری استفاده کنید.
</Note>

## یادآوری ترتیب بارگذاری

```text
workspace/skills      (بالاترین)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
Skillهای بسته‌بندی‌شده
skills.load.extraDirs (پایین‌ترین)
```

هنگامی که پایشگر فعال باشد، تغییرات Skillها و پیکربندی در نشست جدید بعدی اعمال می‌شوند؛
یا هنگامی که پایشگر تغییری را تشخیص دهد، در نوبت بعدی عامل اعمال می‌شوند.

## مرتبط

<CardGroup cols={2}>
  <Card title="مرجع Skills" href="/fa/tools/skills" icon="puzzle-piece">
    تعریف Skillها، ترتیب بارگذاری، دروازه‌بندی و قالب SKILL.md.
  </Card>
  <Card title="ایجاد Skillها" href="/fa/tools/creating-skills" icon="hammer">
    نگارش Skillهای سفارشی فضای کاری.
  </Card>
  <Card title="Skill Workshop" href="/fa/tools/skill-workshop" icon="flask">
    صف پیشنهاد برای Skillهای پیش‌نویس‌شده توسط عامل.
  </Card>
  <Card title="خودآموزی" href="/tools/self-learning" icon="brain">
    پیشنهادهای محتاطانه و اختیاری حاصل از کار تکمیل‌شده.
  </Card>
  <Card title="فرمان‌های اسلش" href="/fa/tools/slash-commands" icon="terminal">
    فهرست فرمان‌های اسلش بومی و دستورالعمل‌های چت.
  </Card>
</CardGroup>
