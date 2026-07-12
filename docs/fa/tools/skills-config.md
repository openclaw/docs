---
read_when:
    - پیکربندی رفتار بارگذاری، نصب یا محدودسازی Skills
    - تنظیم قابلیت مشاهدهٔ Skills برای هر عامل
    - تنظیم محدودیت‌ها یا سیاست تأیید کارگاه Skills
sidebarTitle: Skills config
summary: مرجع کامل شِمای پیکربندی `skills.*`، فهرست‌های مجاز عامل‌ها، تنظیمات کارگاه و مدیریت متغیرهای محیطی جعبهٔ شنی.
title: پیکربندی Skills
x-i18n:
    generated_at: "2026-07-12T11:04:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ed1ec20aa102b458a9485a1ada1bb7566c97d28b1f43caa28f52b3f5bdc381e
    source_path: tools/skills-config.md
    workflow: 16
---

بیشتر پیکربندی Skills در بخش `skills` از فایل
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
  `agents.defaults.imageGenerationModel` همراه با ابزار اصلی `image_generate`
  استفاده کنید. ورودی‌های Skills فقط برای گردش‌کارهای سفارشی یا شخص ثالث Skills
  هستند.
</Note>

## بارگذاری (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  دایرکتوری‌های اضافی Skills برای اسکن، با پایین‌ترین اولویت (پس از Skills
  همراه و Plugin). مسیرها با پشتیبانی از `~` بسط داده می‌شوند.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  دایرکتوری‌های مقصد واقعی و مورداعتمادی که پوشه‌های Skills دارای پیوند نمادین
  می‌توانند به آن‌ها منتهی شوند، حتی زمانی که پیوند نمادین خارج از ریشهٔ
  پیکربندی‌شده قرار دارد. از این گزینه برای چیدمان‌های عمدی مخزن‌های هم‌سطح،
  مانند `<workspace>/skills/manager -> ~/Projects/manager/skills` استفاده کنید.
  این فهرست را محدود نگه دارید — آن را به ریشه‌های گسترده‌ای مانند `~` یا
  `~/Projects` اشاره ندهید.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  پوشه‌های Skills را پایش می‌کند و هنگام تغییر فایل‌های `SKILL.md`، تصویر لحظه‌ای
  Skills را تازه‌سازی می‌کند. فایل‌های تودرتو در ریشه‌های گروه‌بندی‌شدهٔ Skills
  را نیز پوشش می‌دهد.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  بازهٔ حذف نوسان رویدادهای پایشگر Skills برحسب میلی‌ثانیه.
</ParamField>

## نصب (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  در صورت در دسترس بودن `brew`، نصب‌کننده‌های Homebrew را ترجیح می‌دهد.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  مدیر بستهٔ Node ترجیحی برای نصب Skills. این گزینه فقط بر نصب Skills اثر
  می‌گذارد — محیط اجرای Gateway همچنان باید از Node استفاده کند (Bun برای
  WhatsApp/Telegram توصیه نمی‌شود). `openclaw setup --node-manager` و
  `openclaw onboard --node-manager` مقادیر `npm`، `pnpm` یا `bun` را
  می‌پذیرند؛ برای نصب Skills مبتنی بر Yarn، مقدار `"yarn"` را مستقیماً در
  پیکربندی تنظیم کنید.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  به کلاینت‌های مورداعتماد Gateway با سطح `operator.admin` اجازه می‌دهد
  بایگانی‌های خصوصی zip را که از طریق `skills.upload.*` آماده شده‌اند نصب کنند.
  نصب‌های عادی ClawHub به این تنظیم نیاز ندارند.
</ParamField>

## سیاست نصب اپراتور (`security.installPolicy`)

هنگامی که اپراتورها برای تأیید یا مسدود کردن نصب Skills و Plugin براساس سیاست
مختص میزبان به یک فرمان محلی مورداعتماد نیاز دارند، از `security.installPolicy`
استفاده کنید. این سیاست پس از آماده‌سازی محتوای منبع توسط OpenClaw و پیش از
ادامهٔ نصب یا به‌روزرسانی اجرا می‌شود. این سیاست بر Skills از ClawHub، Skills
بارگذاری‌شده، Skills مبتنی بر Git/محلی، نصب‌کننده‌های وابستگی Skills و منابع
نصب/به‌روزرسانی Plugin اعمال می‌شود.

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
  سیاست نصب تحت مالکیت اپراتور را فعال می‌کند. اگر بدون فرمان معتبر `exec`
  فعال شود، نصب‌ها به‌صورت بسته و ایمن شکست می‌خورند.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  فیلتر اختیاری مقصد. در صورت حذف، سیاست بر همهٔ مقصدهای پشتیبانی‌شده اعمال
  می‌شود تا نصب‌های جدید به‌طور غیرمنتظره به‌صورت باز و ناامن عبور نکنند.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  مسیر مطلق فایل اجرایی مورداعتماد سیاست. OpenClaw آن را بدون پوسته اجرا و
  پیش از استفاده، مسیر را اعتبارسنجی می‌کند.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  آرگومان‌های ثابتی که پس از `command` ارسال می‌شوند.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  حداکثر زمان واقعی اجرای یک تصمیم سیاست.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  حداکثر زمان بدون خروجی stdout یا stderr، پیش از آنکه سیاست به‌صورت بسته و
  ایمن شکست بخورد.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  حداکثر مجموع بایت‌های stdout و stderr پذیرفته‌شده از فرایند سیاست.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  متغیرهای محیطی تحت‌اللفظی ارائه‌شده به فرایند سیاست.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  نام متغیرهای محیطی که از فرایند OpenClaw به فرایند سیاست کپی می‌شوند. فقط
  متغیرهای نام‌برده‌شده ارسال می‌شوند.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  فهرست مجاز اختیاری دایرکتوری‌هایی که می‌توانند فایل اجرایی سیاست را در خود
  داشته باشند.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  بررسی مالکیت و مجوزهای مسیر فرمان را دور می‌زند. فقط زمانی استفاده کنید که
  مسیر با سازوکار دیگری محافظت می‌شود.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  اجازه می‌دهد مسیر فرمان پیکربندی‌شده یک پیوند نمادین باشد. مقصد حل‌شده همچنان
  باید سایر بررسی‌های مسیر را برآورده کند. آرگومان‌های اسکریپت مفسر باید
  فایل‌های عادی مستقیم باشند، نه پیوند نمادین.
</ParamField>

سیاست یک شیء JSON را از stdin دریافت می‌کند که شامل `protocolVersion: 1`،
`openclawVersion`، `targetType`، `targetName`، `sourcePath`، `sourcePathKind`،
`source` ساخت‌یافتهٔ اختیاری، `origin` ساخت‌یافته و `request` است. سیاست باید
یک شیء JSON در stdout بنویسد:
`{ "protocolVersion": 1, "decision": "allow" }` یا
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. خروج با کد
غیرصفر، پایان مهلت، JSON نامعتبر، فیلدهای مفقود یا نسخه‌های پشتیبانی‌نشدهٔ
پروتکل، به شکست بسته و ایمن منجر می‌شوند.

OpenClaw هنگام راه‌اندازی عادی Gateway سیاست نصب را اجرا نمی‌کند. وقتی سیاست
فعال اما در دسترس نباشد، نصب‌ها و به‌روزرسانی‌ها به‌صورت بسته و ایمن شکست
می‌خورند. `openclaw doctor` اعتبارسنجی ایستا انجام می‌دهد؛
`openclaw doctor --deep` یک کاوش نصب مصنوعی را در برابر فرمان پیکربندی‌شده اجرا
می‌کند.

به‌روزرسانی‌های گروهی سیاست را برای هر مقصد جداگانه اعمال می‌کنند: مسدود شدن
به‌روزرسانی یک Skill یا Plugin موجب شکست همان مقصد می‌شود، بدون آنکه سیاست
غیرفعال شود یا مقصدهای بعدی در گروه نادیده گرفته شوند.

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
        reason: "local plugin paths are not approved on this host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## فهرست مجاز Skills همراه

<ParamField path="skills.allowBundled" type="string[]">
  فهرست مجاز اختیاری فقط برای Skills **همراه**. در صورت تنظیم، فقط Skills همراه
  موجود در فهرست واجد شرایط هستند. Skills مدیریت‌شده، سطح عامل و فضای کاری
  تحت تأثیر قرار نمی‌گیرند.
</ParamField>

## ورودی‌های هر Skill (`skills.entries`)

کلیدهای زیر `entries` به‌طور پیش‌فرض با `name` مربوط به Skill مطابقت دارند. اگر
یک Skill مقدار `metadata.openclaw.skillKey` را تعریف کند، به‌جای آن از همان
کلید استفاده کنید. نام‌های دارای خط تیره را داخل نقل‌قول قرار دهید (JSON5
کلیدهای نقل‌قول‌شده را مجاز می‌داند).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  مقدار `false`، حتی در صورت همراه یا نصب‌شده بودن Skill، آن را غیرفعال می‌کند.
  Skill همراه `coding-agent` نیازمند فعال‌سازی صریح است — آن را روی `true`
  تنظیم کنید و مطمئن شوید یکی از `claude`، `codex`، `opencode` یا یک CLI
  پشتیبانی‌شدهٔ دیگر نصب و احراز هویت شده است.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  فیلد کمکی برای Skills که `metadata.openclaw.primaryEnv` را اعلام می‌کنند.
  از رشتهٔ متن ساده یا SecretRef پشتیبانی می‌کند:
  `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  متغیرهای محیطی تزریق‌شده برای اجرای عامل. فقط زمانی تزریق می‌شوند که متغیر
  از قبل در فرایند تنظیم نشده باشد.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  مجموعهٔ اختیاری فیلدهای پیکربندی سفارشی برای هر Skill.
</ParamField>

## فهرست‌های مجاز عامل (`agents`)

هنگامی که می‌خواهید ریشه‌های Skills ماشین/فضای کاری یکسان باشند، اما مجموعهٔ
Skills قابل مشاهده برای هر عامل متفاوت باشد، از پیکربندی عامل استفاده کنید.

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
  فهرست مجاز مبنای مشترک که عامل‌های فاقد `agents.list[].skills` آن را به ارث
  می‌برند. برای آنکه Skills به‌طور پیش‌فرض نامحدود باقی بمانند، این گزینه را
  کاملاً حذف کنید.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  مجموعهٔ نهایی و صریح Skills برای آن عامل. فهرست‌های صریح، پیش‌فرض‌های
  به‌ارث‌رسیده را **جایگزین** می‌کنند — با آن‌ها ادغام نمی‌شوند. برای در معرض
  قرار ندادن هیچ Skill برای آن عامل، مقدار را روی `[]` تنظیم کنید.
</ParamField>

<Warning>
  فهرست‌های مجاز Skills عامل، یک فیلتر قابلیت مشاهده و بارگذاری برای کشف Skills
  در OpenClaw، اعلان‌ها، کشف فرمان‌های اسلش، همگام‌سازی محیط ایزوله و تصاویر
  لحظه‌ای Skills هستند. آن‌ها مرز مجوزدهی در زمان اجرای پوسته نیستند. اگر یک
  عامل بتواند `exec` میزبان را اجرا کند، آن پوسته همچنان می‌تواند کلاینت‌های
  خارجی را اجرا کند یا فایل‌های میزبان قابل مشاهده برای کاربر اجراکننده را
  بخواند؛ از جمله رجیستری‌های کلاینت MCP مانند
  `~/.openclaw/skills/config/mcporter.json`. برای جداسازی MCP به‌ازای هر عامل،
  فهرست‌های مجاز Skills را با جداسازی محیط ایزوله/کاربر سیستم‌عامل ترکیب کنید،
  `exec` میزبان را رد کنید یا آن را به‌شدت با فهرست مجاز محدود کنید و در سرور
  MCP، اعتبارنامه‌های مختص هر عامل را ترجیح دهید.
</Warning>

## کارگاه (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  وقتی `true` باشد، عامل‌ها می‌توانند پس از نوبت‌های موفق، از سیگنال‌های
  پایدار مکالمه پیشنهادهای در انتظار ایجاد کنند. ایجاد Skills به درخواست
  کاربر، صرف‌نظر از این تنظیم، همیشه از طریق کارگاه Skills انجام می‌شود.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` پیش از اعمال، رد یا قرنطینه‌سازی آغازشده توسط عامل، به تأیید
  اپراتور نیاز دارد. `auto` این اقدامات را بدون تأیید مجاز می‌کند.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  به اعمال کارگاه Skills اجازه دهید از طریق پیوندهای نمادین Skills فضای کاری
  بنویسد که مقصد واقعی آن‌ها از قبل توسط `skills.load.allowSymlinkTargets`
  مورد اعتماد است. این گزینه را غیرفعال نگه دارید، مگر اینکه اعمال پیشنهادهای
  تولیدشده باید آن ریشه مشترک Skills را تغییر دهد.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  حداکثر تعداد پیشنهادهای در انتظار و قرنطینه‌شده که برای هر فضای کاری نگه
  داشته می‌شوند (بازه مجاز: 1-200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  حداکثر اندازه بدنه پیشنهاد برحسب بایت (بازه مجاز: 1024-200000). توضیحات
  پیشنهاد به‌طور جداگانه سقف قطعی 160 بایت دارند، زیرا در خروجی کشف و
  فهرست‌بندی نمایش داده می‌شوند.
</ParamField>

برای چرخه حیات پیشنهاد، فرمان‌های CLI، پارامترهای ابزار عامل و روش‌های Gateway
که این پیکربندی کنترل می‌کند، به [کارگاه Skills](/fa/tools/skill-workshop) مراجعه
کنید.

## ریشه‌های Skills دارای پیوند نمادین

به‌طور پیش‌فرض، ریشه‌های Skills فضای کاری، عامل پروژه، پوشه اضافی و همراه،
مرزهای محصورسازی هستند. پوشه Skills دارای پیوند نمادین در
`<workspace>/skills` که به بیرون از ریشه حل شود، همراه با یک پیام گزارش نادیده
گرفته می‌شود.

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
پس از حل مسیر واقعی پذیرفته می‌شود. `extraDirs` مخزن هم‌سطح را مستقیماً
پویش می‌کند؛ `allowSymlinkTargets` مسیر دارای پیوند نمادین را برای چیدمان‌های
موجود حفظ می‌کند.

اعمال کارگاه Skills به‌طور پیش‌فرض از طریق این پیوندهای نمادین نمی‌نویسد. برای
اینکه اعمال کارگاه بتواند Skills زیر مقصدهای پیوند نمادین ازپیش‌مورداعتماد را
تغییر دهد، جداگانه آن را فعال کنید:

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

پوشه‌های مدیریت‌شده `~/.openclaw/skills` و شخصی `~/.agents/skills` از قبل
پیوندهای نمادین پوشه Skills را بدون شرط می‌پذیرند (محصورسازی `SKILL.md` برای
هر Skill همچنان اعمال می‌شود) — `allowSymlinkTargets` فقط برای ریشه‌های فضای
کاری، پوشه اضافی و عامل پروژه (`<workspace>/.agents/skills`) لازم است.

## Skills محصورشده و متغیرهای محیطی

<Warning>
  `skills.entries.<skill>.env` و `apiKey` فقط برای اجراهای **میزبان** اعمال
  می‌شوند. درون محیط محصور هیچ اثری ندارند — یک Skill وابسته به
  `GEMINI_API_KEY` با خطای `apiKey not configured` شکست می‌خورد، مگر اینکه
  متغیر به‌طور جداگانه در اختیار محیط محصور قرار گیرد.
</Warning>

مقادیر محرمانه را با روش زیر به محیط محصور Docker منتقل کنید:

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
  کاربران دارای دسترسی به سرویس Docker می‌توانند مقادیر `sandbox.docker.env`
  را از طریق فراداده Docker بررسی کنند. وقتی این افشا پذیرفتنی نیست، از یک
  فایل محرمانه سوارشده، یک تصویر سفارشی یا مسیر تحویل دیگری استفاده کنید.
</Note>

## یادآوری ترتیب بارگذاری

```text
workspace/skills      (بالاترین)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
Skills همراه
skills.load.extraDirs (پایین‌ترین)
```

وقتی پایشگر فعال باشد، تغییرات Skills و پیکربندی در نشست جدید بعدی اعمال
می‌شوند؛ یا وقتی پایشگر تغییری را تشخیص دهد، در نوبت بعدی عامل اعمال می‌شوند.

## مرتبط

<CardGroup cols={2}>
  <Card title="مرجع Skills" href="/fa/tools/skills" icon="puzzle-piece">
    تعریف Skills، ترتیب بارگذاری، کنترل دسترسی و قالب SKILL.md.
  </Card>
  <Card title="ایجاد Skills" href="/fa/tools/creating-skills" icon="hammer">
    نگارش Skills سفارشی فضای کاری.
  </Card>
  <Card title="کارگاه Skills" href="/fa/tools/skill-workshop" icon="flask">
    صف پیشنهاد برای Skills پیش‌نویس‌شده توسط عامل.
  </Card>
  <Card title="فرمان‌های اسلش" href="/fa/tools/slash-commands" icon="terminal">
    فهرست فرمان‌های اسلش بومی و دستورالعمل‌های چت.
  </Card>
</CardGroup>
