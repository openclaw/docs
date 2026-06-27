---
doc-schema-version: 1
read_when:
    - نصب یا پیکربندی Pluginها
    - درک قواعد کشف و بارگذاری Plugin
    - کار با بسته‌های Plugin سازگار با Codex/Claude
sidebarTitle: Getting Started
summary: Pluginهای OpenClaw را نصب، پیکربندی و مدیریت کنید
title: Pluginها
x-i18n:
    generated_at: "2026-06-27T19:03:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61e0ddb164baba368fbf57883e7a72eddadc28cb100ed6c4f11977c55576513
    source_path: tools/plugin.md
    workflow: 16
---

Pluginها OpenClaw را با کانال‌ها، ارائه‌دهندگان مدل، هارنس‌های عامل، ابزارها،
Skills، گفتار، رونویسی بلادرنگ، صدا، درک رسانه، تولید،
واکشی وب، جستجوی وب، و دیگر قابلیت‌های زمان اجرا گسترش می‌دهند.

وقتی می‌خواهید یک Plugin نصب کنید، Gateway را راه‌اندازی مجدد کنید، تأیید کنید
که زمان اجرا آن را بارگذاری کرده است، و خرابی‌های رایج راه‌اندازی را مسیریابی کنید، از این صفحه استفاده کنید. برای نمونه‌های فقط فرمان،
[مدیریت Pluginها](/fa/plugins/manage-plugins) را ببینید. برای فهرست کامل تولیدشده
از Pluginهای همراه، رسمی بیرونی، و فقط منبع، به
[فهرست Pluginها](/fa/plugins/plugin-inventory) مراجعه کنید.

## نیازمندی‌ها

پیش از نصب یک Plugin، مطمئن شوید که موارد زیر را دارید:

- یک checkout یا نصب OpenClaw با CLI مربوط به `openclaw` در دسترس
- دسترسی شبکه به منبع انتخاب‌شده، مانند ClawHub، npm، یا یک میزبان git
- هرگونه اعتبارنامه، کلید پیکربندی، یا ابزار سیستم‌عاملی ویژه Plugin که
  در مستندات راه‌اندازی آن Plugin نام برده شده است
- مجوز برای Gatewayای که کانال‌های شما را ارائه می‌کند تا reload یا restart شود

## شروع سریع

<Steps>
  <Step title="Plugin را پیدا کنید">
    برای بسته‌های Plugin عمومی در [ClawHub](/fa/clawhub) جستجو کنید:

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub سطح اصلی کشف برای Pluginهای جامعه است. در طول
    گذار راه‌اندازی، مشخصات بسته bare معمولی همچنان از npm نصب می‌شوند، مگر اینکه
    با یک شناسه Plugin رسمی مطابقت داشته باشند. مشخصات خام بسته `@openclaw/*` که با
    Pluginهای همراه مطابقت دارند، از نسخه همراه در build فعلی OpenClaw استفاده می‌کنند. زمانی که
    به یک منبع مشخص نیاز دارید، از یک پیشوند صریح استفاده کنید.

  </Step>

  <Step title="Plugin را نصب کنید">
    ```bash
    # From ClawHub.
    openclaw plugins install clawhub:<package>

    # From npm.
    openclaw plugins install npm:<package>

    # From git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # From a local development checkout.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    نصب Plugin را مانند اجرای کد در نظر بگیرید. وقتی
    به نصب‌های تولید قابل بازتولید نیاز دارید، نسخه‌های pin شده را ترجیح دهید.

  </Step>

  <Step title="آن را پیکربندی و فعال کنید">
    تنظیمات ویژه Plugin را زیر `plugins.entries.<id>.config` پیکربندی کنید.
    وقتی Plugin از قبل فعال نیست، آن را فعال کنید:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    اگر پیکربندی شما از یک فهرست محدودکننده `plugins.allow` استفاده می‌کند، شناسه Plugin نصب‌شده
    باید پیش از آنکه Plugin بتواند بارگذاری شود، در آن وجود داشته باشد.
    `openclaw plugins install` شناسه نصب‌شده را به یک فهرست موجود
    `plugins.allow` اضافه می‌کند و همان شناسه را از `plugins.deny` حذف می‌کند تا
    نصب صریح بتواند پس از restart بارگذاری شود.

  </Step>

  <Step title="اجازه دهید Gateway reload شود">
    نصب، به‌روزرسانی، یا حذف کد Plugin به restart کردن Gateway
    نیاز دارد. وقتی یک Gateway مدیریت‌شده از قبل با config reload
    فعال در حال اجراست، OpenClaw رکورد نصب Plugin تغییریافته را تشخیص می‌دهد و
    Gateway را به‌صورت خودکار restart می‌کند. اگر Gateway مدیریت‌شده نیست یا reload غیرفعال است،
    خودتان آن را restart کنید:

    ```bash
    openclaw gateway restart
    ```

    عملیات فعال‌سازی و غیرفعال‌سازی، پیکربندی را به‌روزرسانی می‌کنند و رجیستری سرد را refresh می‌کنند.
    inspect زمان اجرا همچنان روشن‌ترین مسیر تأیید برای سطوح زمان اجرای زنده است.

  </Step>

  <Step title="ثبت زمان اجرا را تأیید کنید">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    وقتی باید ابزارهای ثبت‌شده، hookها، سرویس‌ها،
    متدهای Gateway، یا فرمان‌های CLI متعلق به Plugin را اثبات کنید، از `--runtime` استفاده کنید. `inspect` ساده یک بررسی سرد
    manifest و رجیستری است.

  </Step>
</Steps>

## پیکربندی

### انتخاب منبع نصب

| منبع      | چه زمانی استفاده شود                                                                       | نمونه                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | کشف OpenClaw-native، اسکن‌ها، فراداده نسخه، و راهنمای نصب می‌خواهید | `openclaw plugins install clawhub:<package>`                   |
| npm         | به گردش‌کارهای مستقیم رجیستری npm یا dist-tag نیاز دارید                             | `openclaw plugins install npm:<package>`                       |
| git         | به یک branch، tag، یا commit از یک مخزن نیاز دارید                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| مسیر محلی  | در حال توسعه یا آزمودن یک Plugin روی همان ماشین هستید                     | `openclaw plugins install --link ./my-plugin`                  |
| بازارچه | در حال نصب یک Plugin بازارچه سازگار با Claude هستید                      | `openclaw plugins install <plugin> --marketplace <source>`     |

مشخصات بسته bare رفتار سازگاری ویژه‌ای دارند. اگر نام bare با
شناسه یک Plugin همراه مطابقت داشته باشد، OpenClaw از همان منبع همراه استفاده می‌کند. اگر با
شناسه یک Plugin رسمی بیرونی مطابقت داشته باشد، OpenClaw از کاتالوگ بسته رسمی استفاده می‌کند. سایر
مشخصات بسته bare معمولی در طول گذار راه‌اندازی از طریق npm نصب می‌شوند. مشخصات خام بسته
`@openclaw/*` که با Pluginهای همراه مطابقت دارند نیز پیش از fallback به npm، به
نسخه همراه resolve می‌شوند. وقتی عمداً بسته npm بیرونی را به‌جای نسخه همراه
متعلق به image می‌خواهید، از `npm:@openclaw/<plugin>@<version>` استفاده کنید. وقتی به
انتخاب منبع قطعی نیاز دارید، از `clawhub:`، `npm:`، `git:`، یا `npm-pack:` استفاده کنید. برای قرارداد کامل فرمان، [`openclaw plugins`](/fa/cli/plugins#install)
را ببینید.

برای نصب‌های npm، مشخصات بسته pin نشده و `@latest` جدیدترین بسته پایدار
را انتخاب می‌کنند که سازگاری با این build از OpenClaw را اعلام می‌کند. اگر
نسخه latest فعلی npm یک `openclaw.compat.pluginApi` یا
`openclaw.install.minHostVersion` جدیدتر اعلام کند، OpenClaw نسخه‌های پایدار قدیمی‌تر بسته را
اسکن می‌کند و جدیدترین نسخه‌ای را که مناسب باشد نصب می‌کند. نسخه‌های دقیق و tagهای کانال صریح
مانند `@beta` به بسته انتخاب‌شده pin می‌مانند و در صورت ناسازگاری fail می‌شوند.

### سیاست نصب اپراتور

`security.installPolicy` را پیکربندی کنید تا پیش از ادامه نصب یا به‌روزرسانی
Plugin، یک فرمان سیاست محلی مورد اعتماد اجرا شود. این سیاست فراداده به‌همراه مسیر منبع staged
را دریافت می‌کند و می‌تواند نصب را مجاز یا مسدود کند. این مسیرهای نصب/به‌روزرسانی Plugin از طریق CLI و Gateway
را پوشش می‌دهد. hookهای `before_install` Plugin بعداً فقط در
فرایندهای OpenClaw که hookهای Plugin بارگذاری شده‌اند اجرا می‌شوند، بنابراین برای تصمیم‌های نصب متعلق به اپراتور از
`security.installPolicy` استفاده کنید. flag منسوخ‌شده
`--dangerously-force-unsafe-install` برای سازگاری پذیرفته می‌شود اما
سیاست نصب یا فهرست انکار وابستگی Plugin داخلی OpenClaw را دور نمی‌زند.

برای schema اجرای مشترک `security.installPolicy` که هم توسط Skills و هم
Pluginها استفاده می‌شود، [پیکربندی Skills](/fa/tools/skills-config#operator-install-policy-securityinstallpolicy)
را ببینید.

### پیکربندی سیاست Plugin

شکل رایج پیکربندی Plugin این است:

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    slots: { memory: "memory-core" },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

قواعد کلیدی سیاست:

- `plugins.enabled: false` همه Pluginها را غیرفعال می‌کند و کار
  کشف/بارگذاری Plugin را رد می‌کند. ارجاع‌های کهنه Plugin تا زمانی که این فعال است بی‌اثر هستند؛ وقتی می‌خواهید شناسه‌های کهنه حذف شوند،
  پیش از اجرای پاک‌سازی doctor، Pluginها را دوباره فعال کنید.
- `plugins.deny` بر allow و فعال‌سازی به‌ازای هر Plugin اولویت دارد.
- `plugins.allow` یک allowlist انحصاری است. ابزارهای متعلق به Plugin خارج از
  allowlist در دسترس نمی‌مانند، حتی وقتی `tools.allow` شامل `"*"` باشد.
- `plugins.entries.<id>.enabled: false` یک Plugin را در حالی غیرفعال می‌کند که
  پیکربندی آن را حفظ می‌کند.
- `plugins.load.paths` فایل‌ها یا دایرکتوری‌های صریح Plugin محلی را اضافه می‌کند. مسیرهای محلی مدیریت‌شده
  `plugins install` باید دایرکتوری‌ها یا آرشیوهای Plugin باشند؛ برای فایل‌های مستقل Plugin از
  `plugins.load.paths` استفاده کنید.
- Pluginهای با منشأ workspace به‌طور پیش‌فرض غیرفعال هستند؛ پیش از استفاده از کد workspace محلی، آن‌ها را صریحاً فعال کنید یا
  در allowlist قرار دهید.
- Pluginهای همراه از فراداده داخلی default-on/default-off خود پیروی می‌کنند، مگر اینکه
  پیکربندی صریحاً آن‌ها را override کند.
- `plugins.slots.<slot>` یک Plugin را برای دسته‌های انحصاری مانند
  حافظه و موتورهای context انتخاب می‌کند. انتخاب slot با حساب شدن به‌عنوان فعال‌سازی صریح، Plugin انتخاب‌شده
  برای آن slot را force-enable می‌کند؛ این Plugin حتی وقتی در حالت دیگر opt-in بود نیز می‌تواند بارگذاری شود. `plugins.deny` و
  `plugins.entries.<id>.enabled: false` همچنان آن را مسدود می‌کنند.
- Pluginهای opt-in همراه می‌توانند زمانی auto-activate شوند که پیکربندی یکی از سطوح متعلق به آن‌ها را نام ببرد،
  مانند یک provider/model ref، پیکربندی کانال، backend CLI، یا زمان اجرای harness عامل.
- مسیریابی Codex خانواده OpenAI مرزهای provider و Plugin زمان اجرا را
  جدا نگه می‌دارد: refهای مدل Codex legacy پیکربندی legacy هستند که توسط doctor تعمیر می‌شوند، در حالی که Plugin همراه
  `codex` مالک زمان اجرای app-server Codex برای refهای عامل canonical `openai/*`،
  `agentRuntime.id: "codex"` صریح، و refهای legacy `codex/*` است.

وقتی `plugins.allow` تنظیم نشده و Pluginهای غیرهمراه از
workspace یا ریشه‌های Plugin سراسری به‌صورت خودکار کشف می‌شوند، logهای startup
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` را نشان می‌دهند.
این هشدار شامل شناسه‌های Plugin کشف‌شده و، برای فهرست‌های کوتاه، یک snippet حداقلی
`plugins.allow` است. پیش از کپی کردن Pluginهای مورد اعتماد در `openclaw.json`،
[`openclaw plugins list --enabled --verbose`](/fa/cli/plugins#list) یا
[`openclaw plugins inspect <id>`](/fa/cli/plugins#inspect) را با شناسه Plugin فهرست‌شده اجرا کنید.
همین راهنمای pin کردن اعتماد زمانی هم اعمال می‌شود که diagnostics بگوید یک Plugin
`without install/load-path provenance` بارگذاری شده است: آن شناسه Plugin را inspect کنید، سپس شناسه
مورد اعتماد را در `plugins.allow` pin کنید یا از یک منبع مورد اعتماد دوباره نصب کنید تا OpenClaw
provenance نصب را ثبت کند.

وقتی اعتبارسنجی پیکربندی شناسه‌های Plugin کهنه، عدم تطابق‌های allowlist/tool، یا مسیرهای legacy Plugin همراه را گزارش می‌کند،
`openclaw doctor` یا `openclaw doctor --fix` را اجرا کنید.

## درک قالب‌های Plugin

OpenClaw دو قالب Plugin را تشخیص می‌دهد:

| قالب                 | نحوه بارگذاری                                                                 | چه زمانی استفاده شود                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Plugin بومی OpenClaw | `openclaw.plugin.json` به‌همراه یک ماژول زمان اجرا که در فرایند بارگذاری می‌شود               | در حال نصب یا ساخت قابلیت‌های زمان اجرای ویژه OpenClaw هستید  |
| bundle سازگار      | چیدمان Plugin مربوط به Codex، Claude، یا Cursor که به فهرست Pluginهای OpenClaw نگاشت می‌شود | در حال استفاده مجدد از Skills، فرمان‌ها، hookها، یا فراداده bundle سازگار هستید |

هر دو قالب در `openclaw plugins list`، `openclaw plugins inspect`،
`openclaw plugins enable`، و `openclaw plugins disable` ظاهر می‌شوند. برای مرز سازگاری bundle،
[Plugin bundleها](/fa/plugins/bundles) و برای نگارش Plugin بومی
[ساخت Pluginها](/fa/plugins/building-plugins) را ببینید.

## hookهای Plugin

Pluginها می‌توانند hookها را در زمان اجرا ثبت کنند، اما دو API متفاوت با
وظایف متفاوت وجود دارد.

- از hookهای typed از طریق `api.on(...)` برای hookهای چرخه عمر زمان اجرا استفاده کنید. این سطح
  ترجیحی برای middleware، سیاست، بازنویسی پیام، شکل‌دهی prompt،
  و کنترل ابزار است.
- فقط وقتی می‌خواهید در سیستم hook داخلی
  توصیف‌شده در [Hooks](/fa/automation/hooks) مشارکت کنید، از `api.registerHook(...)` استفاده کنید. این عمدتاً برای side effectهای درشت
  فرمان/چرخه عمر و سازگاری با automation موجود به سبک HOOK است.

قاعده سریع:

- اگر handler به اولویت، semantics ادغام، یا رفتار block/cancel نیاز دارد، از
  hookهای typed Plugin استفاده کنید.
- اگر handler فقط به `command:new`، `command:reset`، `message:sent`،
  یا رویدادهای درشت مشابه واکنش نشان می‌دهد، `api.registerHook(...)` مناسب است.

hookهای داخلی مدیریت‌شده توسط Plugin در `openclaw hooks list` با
`plugin:<id>` نمایش داده می‌شوند. نمی‌توانید آن‌ها را از طریق `openclaw hooks`
فعال یا غیرفعال کنید؛ به‌جای آن، Plugin را فعال یا غیرفعال کنید.

## تأیید Gateway فعال

`openclaw plugins list` و `openclaw plugins inspect` ساده، وضعیت پیکربندی،
مانیفست، و رجیستری سرد را می‌خوانند. آن‌ها ثابت نمی‌کنند که یک Gateway ازپیش‌درحال‌اجرا
همان کد Plugin را وارد کرده است.

وقتی یک Plugin نصب‌شده به نظر می‌رسد اما ترافیک گفت‌وگوی زنده از آن استفاده نمی‌کند:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Gatewayهای مدیریت‌شده پس از تغییرات نصب، به‌روزرسانی، و حذف Plugin که منبع Plugin را
تغییر می‌دهند، به‌طور خودکار راه‌اندازی مجدد می‌شوند. در نصب‌های VPS یا کانتینری، مطمئن شوید
هر راه‌اندازی مجدد دستی، فرزند واقعی `openclaw gateway run` را هدف می‌گیرد که
کانال‌های شما را سرویس می‌دهد، نه فقط یک wrapper یا supervisor.

## عیب‌یابی

| نشانه                                                         | بررسی                                                                                                                                      | رفع                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Plugin در `plugins list` ظاهر می‌شود اما قلاب‌های runtime اجرا نمی‌شوند | از `openclaw plugins inspect <id> --runtime --json` استفاده کنید و Gateway فعال را با `gateway status --deep --require-rpc` تأیید کنید | پس از نصب، به‌روزرسانی، پیکربندی، یا تغییرات منبع، Gateway زنده را راه‌اندازی مجدد کنید |
| عیب‌یابی‌های مالکیت تکراری کانال یا ابزار ظاهر می‌شوند         | `openclaw plugins list --enabled --verbose` را اجرا کنید، هر Plugin مشکوک را با `--runtime --json` بررسی کنید، و مالکیت کانال/ابزار را مقایسه کنید | یکی از مالکان را غیرفعال کنید، نصب‌های کهنه را حذف کنید، یا برای جایگزینی عمدی از `preferOver` در مانیفست استفاده کنید |
| پیکربندی می‌گوید یک Plugin وجود ندارد                         | [موجودی Plugin](/fa/plugins/plugin-inventory) را بررسی کنید تا مشخص شود bundled، رسمی خارجی، یا فقط-منبع است                           | بسته خارجی را نصب کنید، Plugin bundled را فعال کنید، یا پیکربندی کهنه را حذف کنید |
| پیکربندی هنگام نصب نامعتبر است                               | پیام اعتبارسنجی را بخوانید و وقتی به وضعیت کهنه Plugin اشاره می‌کند `openclaw doctor --fix` را اجرا کنید | Doctor می‌تواند پیکربندی نامعتبر Plugin را با غیرفعال کردن ورودی و حذف payload نامعتبر قرنطینه کند |
| مسیر Plugin به‌دلیل مالکیت یا مجوزهای مشکوک مسدود شده است     | عیب‌یابی را پیش از خطای پیکربندی بررسی کنید                                                                                             | مالکیت/مجوزهای فایل‌سیستم را اصلاح کنید، سپس `openclaw plugins registry --refresh` را اجرا کنید |
| `OPENCLAW_NIX_MODE=1` فرمان‌های چرخه عمر را مسدود می‌کند      | تأیید کنید نصب توسط Nix مدیریت می‌شود                                                                                                      | به‌جای استفاده از فرمان‌های تغییر‌دهنده Plugin، انتخاب Plugin را در منبع Nix تغییر دهید |
| وارد کردن وابستگی در runtime شکست می‌خورد                     | بررسی کنید Plugin از طریق npm/git/ClawHub نصب شده یا از یک مسیر محلی بارگذاری شده است                                                 | `openclaw plugins update <id>` را اجرا کنید، منبع را دوباره نصب کنید، یا وابستگی‌های Plugin محلی را خودتان نصب کنید |

وقتی پیکربندی کهنه Plugin هنوز یک Plugin کانالِ دیگر قابل‌کشف‌نباشد را نام می‌برد،
راه‌اندازی Gateway به‌جای مسدود کردن همه کانال‌های دیگر، آن کانال پشتیبانی‌شده با Plugin را
نادیده می‌گیرد. برای حذف ورودی‌های کهنه Plugin و کانال، `openclaw doctor --fix` را اجرا کنید.
کلیدهای ناشناخته کانال بدون شواهد Plugin کهنه همچنان در اعتبارسنجی شکست می‌خورند
تا غلط‌های تایپی قابل مشاهده بمانند.

برای جایگزینی عمدی کانال، Plugin ترجیحی باید
`channelConfigs.<channel-id>.preferOver` را با شناسه Plugin قدیمی یا کم‌اولویت‌تر
اعلام کند. اگر هر دو Plugin به‌صراحت فعال باشند، OpenClaw آن درخواست را نگه می‌دارد
و به‌جای انتخاب بی‌صدای یک مالک، عیب‌یابی‌های کانال یا ابزار تکراری را گزارش می‌کند.

اگر یک بسته نصب‌شده گزارش دهد که `requires compiled runtime output for
TypeScript entry ...`، بسته بدون فایل‌های JavaScript موردنیاز OpenClaw در runtime
منتشر شده است. پس از اینکه ناشر JavaScript کامپایل‌شده را منتشر کرد به‌روزرسانی یا نصب مجدد کنید،
یا تا آن زمان Plugin را غیرفعال/حذف کنید.

### مالکیت مسیر Plugin مسدودشده

اگر عیب‌یابی‌های Plugin بگویند
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
و اعتبارسنجی پیکربندی با `plugin present but blocked` ادامه پیدا کند، OpenClaw
فایل‌های Plugin را پیدا کرده که مالک آن‌ها یک کاربر Unix متفاوت از فرایندی است که آن‌ها را بارگذاری می‌کند.
پیکربندی Plugin را در جای خود نگه دارید؛ مالکیت فایل‌سیستم را اصلاح کنید یا
OpenClaw را با همان کاربری اجرا کنید که مالک دایرکتوری وضعیت است.

برای نصب‌های Docker، تصویر رسمی با کاربر `node` (uid `1000`) اجرا می‌شود، بنابراین
دایرکتوری‌های پیکربندی و فضای کاری OpenClaw که از میزبان bind mount شده‌اند معمولاً باید
مالک uid `1000` باشند:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

اگر عمداً OpenClaw را به‌عنوان root اجرا می‌کنید، در عوض ریشه Plugin مدیریت‌شده را به
مالکیت root اصلاح کنید:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

پس از اصلاح مالکیت، `openclaw doctor --fix` یا
`openclaw plugins registry --refresh` را دوباره اجرا کنید تا رجیستری ماندگار Plugin با
فایل‌های اصلاح‌شده مطابقت پیدا کند.

### راه‌اندازی کند ابزارهای Plugin

اگر به نظر می‌رسد نوبت‌های عامل هنگام آماده‌سازی ابزارها متوقف می‌شوند، ثبت trace را فعال کنید و
خطوط زمان‌بندی factory ابزارهای Plugin را بررسی کنید:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

دنبال این بگردید:

```text
[trace:plugin-tools] factory timings ...
```

خلاصه، زمان کل factory و کندترین factoryهای ابزار Plugin را فهرست می‌کند،
از جمله شناسه Plugin، نام‌های ابزار اعلام‌شده، شکل نتیجه، و اینکه ابزار
اختیاری است یا نه. وقتی یک factory منفرد حداقل 1 ثانیه طول بکشد یا آماده‌سازی کل factory ابزارهای Plugin
حداقل 5 ثانیه طول بکشد، خطوط کند به هشدار ارتقا داده می‌شوند.

OpenClaw نتایج موفق factory ابزارهای Plugin را برای resolutionهای تکراری
با همان زمینه درخواست مؤثر cache می‌کند. کلید cache شامل پیکربندی runtime مؤثر،
فضای کاری، شناسه‌های عامل/نشست، سیاست sandbox، تنظیمات مرورگر،
زمینه تحویل، هویت درخواست‌کننده، و وضعیت مالکیت است، بنابراین factoryهایی که
به آن فیلدهای مورداعتماد وابسته‌اند هنگام تغییر زمینه دوباره اجرا می‌شوند. اگر زمان‌بندی‌ها
همچنان بالا بمانند، ممکن است Plugin پیش از بازگرداندن تعریف‌های ابزار خود، کار پرهزینه‌ای انجام دهد.

اگر یک Plugin بر زمان‌بندی غالب است، ثبت‌های runtime آن را بررسی کنید:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

سپس آن Plugin را به‌روزرسانی، دوباره نصب، یا غیرفعال کنید. نویسندگان Plugin باید
بارگذاری وابستگی‌های پرهزینه را به پشت مسیر اجرای ابزار منتقل کنند، نه اینکه آن را
داخل factory ابزار انجام دهند.

برای ریشه‌های وابستگی، اعتبارسنجی metadata بسته، رکوردهای رجیستری، رفتار reload هنگام راه‌اندازی،
و پاک‌سازی legacy، [حل وابستگی Plugin](/fa/plugins/dependency-resolution) را ببینید.

## مرتبط

- [مدیریت Pluginها](/fa/plugins/manage-plugins) - نمونه فرمان‌ها برای فهرست‌کردن، نصب، به‌روزرسانی، حذف، و انتشار
- [`openclaw plugins`](/fa/cli/plugins) - مرجع کامل CLI
- [موجودی Plugin](/fa/plugins/plugin-inventory) - فهرست تولیدشده Pluginهای bundled و خارجی
- [مرجع Plugin](/fa/plugins/reference) - صفحه‌های مرجع تولیدشده برای هر Plugin
- [Pluginهای جامعه](/fa/plugins/community) - کشف ClawHub و سیاست PR مستندات
- [حل وابستگی Plugin](/fa/plugins/dependency-resolution) - ریشه‌های نصب، رکوردهای رجیستری، و مرزهای runtime
- [ساخت Pluginها](/fa/plugins/building-plugins) - راهنمای نگارش Plugin بومی
- [نمای کلی Plugin SDK](/fa/plugins/sdk-overview) - ثبت runtime، قلاب‌ها، و فیلدهای API
- [مانیفست Plugin](/fa/plugins/manifest) - مانیفست و metadata بسته
