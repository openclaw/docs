---
read_when:
    - می‌خواهید از Hermes یا یک سامانهٔ عامل دیگر به OpenClaw مهاجرت کنید
    - شما در حال افزودن یک ارائه‌دهنده مهاجرت تحت مالکیت Plugin هستید
summary: مرجع CLI برای `openclaw migrate` (وارد کردن وضعیت از یک سیستم عامل دیگر)
title: مهاجرت
x-i18n:
    generated_at: "2026-06-27T17:25:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90798fd24af0984e485753e251c87a5dd8fd0246e7c135a50e3532de93ba075e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

وارد کردن وضعیت از یک سامانه عامل دیگر از طریق یک ارائه‌دهنده مهاجرت متعلق به Plugin. ارائه‌دهندگان همراه، وضعیت Codex CLI، [Claude](/fa/install/migrating-claude)، و [Hermes](/fa/install/migrating-hermes) را پوشش می‌دهند؛ Pluginهای شخص ثالث می‌توانند ارائه‌دهندگان بیشتری را ثبت کنند.

<Tip>
برای راهنماهای کاربرمحور، [مهاجرت از Claude](/fa/install/migrating-claude) و [مهاجرت از Hermes](/fa/install/migrating-hermes) را ببینید. [هاب مهاجرت](/fa/install/migrating) همه مسیرها را فهرست می‌کند.
</Tip>

## فرمان‌ها

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate codex --plugin google-calendar --verify-plugin-apps --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --plugin google-calendar
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  نام یک ارائه‌دهنده مهاجرت ثبت‌شده، برای مثال `hermes`. برای دیدن ارائه‌دهندگان نصب‌شده، `openclaw migrate list` را اجرا کنید.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  برنامه را بسازید و بدون تغییر دادن وضعیت خارج شوید.
</ParamField>
<ParamField path="--from <path>" type="string">
  دایرکتوری وضعیت مبدأ را بازنویسی کنید. مقدار پیش‌فرض Hermes برابر `~/.hermes` است.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  اعتبارنامه‌های پشتیبانی‌شده را بدون درخواست تأیید وارد کنید. اجرای تعاملی پیش از وارد کردن اعتبارنامه‌های احراز هویت شناسایی‌شده سؤال می‌کند و گزینه بله به‌صورت پیش‌فرض انتخاب است؛ اجرای غیرتعاملی با `--yes` برای وارد کردن آن‌ها به `--include-secrets` نیاز دارد.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  وارد کردن اعتبارنامه‌های احراز هویت، از جمله درخواست تعاملی، را رد کنید.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  به apply اجازه دهید وقتی برنامه تعارض گزارش می‌کند، اهداف موجود را جایگزین کند.
</ParamField>
<ParamField path="--yes" type="boolean">
  درخواست تأیید را رد کنید. در حالت غیرتعاملی الزامی است.
</ParamField>
<ParamField path="--skill <name>" type="string">
  یک مورد کپی مهارت را با نام مهارت یا شناسه مورد انتخاب کنید. برای مهاجرت چند مهارت، این پرچم را تکرار کنید. وقتی حذف شود، مهاجرت‌های تعاملی Codex یک انتخابگر چک‌باکسی نشان می‌دهند و مهاجرت‌های غیرتعاملی همه مهارت‌های برنامه‌ریزی‌شده را نگه می‌دارند.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  یک مورد نصب Plugin در Codex را با نام Plugin یا شناسه مورد انتخاب کنید. برای مهاجرت چند Plugin در Codex، این پرچم را تکرار کنید. وقتی حذف شود، مهاجرت‌های تعاملی Codex یک انتخابگر چک‌باکسی Plugin بومی Codex نشان می‌دهند و مهاجرت‌های غیرتعاملی همه Pluginهای برنامه‌ریزی‌شده را نگه می‌دارند. این فقط برای Pluginهای Codex نصب‌شده از مبدأ `openai-curated` که توسط موجودی app-server Codex کشف شده‌اند اعمال می‌شود.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  فقط Codex. پیش از برنامه‌ریزی فعال‌سازی Plugin بومی، پیمایش تازه `app/list` از app-server مبدأ Codex را اجباری کنید. برای سریع نگه داشتن برنامه‌ریزی مهاجرت، به‌صورت پیش‌فرض خاموش است.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  نسخه پشتیبان پیش از apply را رد کنید. وقتی وضعیت محلی OpenClaw وجود داشته باشد، به `--force` نیاز دارد.
</ParamField>
<ParamField path="--force" type="boolean">
  وقتی apply در حالت عادی از رد کردن نسخه پشتیبان امتناع می‌کرد، همراه با `--no-backup` الزامی است.
</ParamField>
<ParamField path="--json" type="boolean">
  برنامه یا نتیجه apply را به‌صورت JSON چاپ کنید. با `--json` و بدون `--yes`، apply برنامه را چاپ می‌کند و وضعیت را تغییر نمی‌دهد.
</ParamField>

## مدل ایمنی

`openclaw migrate` ابتدا پیش‌نمایش می‌دهد.

<AccordionGroup>
  <Accordion title="پیش‌نمایش پیش از apply">
    ارائه‌دهنده پیش از هر تغییری، یک برنامه موردبه‌مورد برمی‌گرداند، شامل تعارض‌ها، موارد ردشده، و موارد حساس. برنامه‌های JSON، خروجی apply، و گزارش‌های مهاجرت کلیدهای تودرتوی شبیه راز مانند کلیدهای API، توکن‌ها، سرآیندهای مجوز، کوکی‌ها، و گذرواژه‌ها را ویرایش و پنهان می‌کنند.

    `openclaw migrate apply <provider>` برنامه را پیش‌نمایش می‌دهد و پیش از تغییر وضعیت، مگر اینکه `--yes` تنظیم شده باشد، درخواست تأیید می‌کند. در حالت غیرتعاملی، apply به `--yes` نیاز دارد.

  </Accordion>
  <Accordion title="نسخه‌های پشتیبان">
    apply پیش از اعمال مهاجرت، یک نسخه پشتیبان OpenClaw ایجاد و راستی‌آزمایی می‌کند. اگر هنوز وضعیت محلی OpenClaw وجود نداشته باشد، مرحله نسخه پشتیبان رد می‌شود و مهاجرت می‌تواند ادامه پیدا کند. برای رد کردن نسخه پشتیبان وقتی وضعیت وجود دارد، هر دو `--no-backup` و `--force` را ارسال کنید.
  </Accordion>
  <Accordion title="تعارض‌ها">
    وقتی برنامه تعارض داشته باشد، apply از ادامه دادن امتناع می‌کند. برنامه را بررسی کنید، سپس اگر جایگزینی اهداف موجود عمدی است، با `--overwrite` دوباره اجرا کنید. ارائه‌دهندگان همچنان ممکن است برای فایل‌های بازنویسی‌شده در دایرکتوری گزارش مهاجرت، نسخه‌های پشتیبان در سطح مورد بنویسند.
  </Accordion>
  <Accordion title="رازها">
    اجرای تعاملی apply می‌پرسد آیا اعتبارنامه‌های احراز هویت شناسایی‌شده وارد شوند یا نه، و گزینه بله به‌صورت پیش‌فرض انتخاب است. برای رد کردن آن‌ها از `--no-auth-credentials` استفاده کنید، یا برای وارد کردن بدون مراقبت اعتبارنامه‌ها همراه با `--yes` از `--include-secrets` استفاده کنید.
  </Accordion>
</AccordionGroup>

## ارائه‌دهنده Claude

ارائه‌دهنده همراه Claude به‌صورت پیش‌فرض وضعیت Claude Code را در `~/.claude` شناسایی می‌کند. برای وارد کردن یک خانه Claude Code یا ریشه پروژه مشخص، از `--from <path>` استفاده کنید.

<Tip>
برای یک راهنمای کاربرمحور، [مهاجرت از Claude](/fa/install/migrating-claude) را ببینید.
</Tip>

### Claude چه چیزهایی را وارد می‌کند

- `CLAUDE.md` پروژه و `.claude/CLAUDE.md` در فضای کاری عامل OpenClaw.
- `~/.claude/CLAUDE.md` کاربر که به `USER.md` فضای کاری افزوده می‌شود.
- تعریف‌های سرور MCP از `.mcp.json` پروژه، `~/.claude.json` در Claude Code، و `claude_desktop_config.json` در Claude Desktop.
- دایرکتوری‌های مهارت Claude که شامل `SKILL.md` هستند.
- فایل‌های Markdown فرمان Claude که به مهارت‌های OpenClaw فقط با فراخوانی دستی تبدیل می‌شوند.

### وضعیت بایگانی و بازبینی دستی

هوک‌ها، مجوزها، پیش‌فرض‌های محیط، حافظه محلی، قواعد محدود به مسیر، زیروکیل‌ها، کش‌ها، برنامه‌ها، و تاریخچه پروژه Claude در گزارش مهاجرت حفظ می‌شوند یا به‌عنوان موارد بازبینی دستی گزارش می‌شوند. OpenClaw هوک‌ها را اجرا نمی‌کند، allowlistهای گسترده را کپی نمی‌کند، و وضعیت اعتبارنامه OAuth/Desktop را به‌صورت خودکار وارد نمی‌کند.

## ارائه‌دهنده Codex

ارائه‌دهنده همراه Codex به‌صورت پیش‌فرض وضعیت Codex CLI را در `~/.codex` شناسایی می‌کند، یا
وقتی متغیر محیطی `CODEX_HOME` تنظیم شده باشد، در `CODEX_HOME`. برای
فهرست‌برداری از یک خانه مشخص Codex از `--from <path>` استفاده کنید.

وقتی به هارنس Codex در OpenClaw منتقل می‌شوید و می‌خواهید
دارایی‌های شخصی مفید Codex CLI را آگاهانه ارتقا دهید، از این ارائه‌دهنده استفاده کنید. اجراهای app-server محلی Codex
از یک `CODEX_HOME` برای هر عامل استفاده می‌کنند، بنابراین به‌صورت پیش‌فرض
`~/.codex` شخصی شما را نمی‌خوانند. فرایند عادی همچنان `HOME` را به ارث می‌برد، بنابراین Codex
می‌تواند Skills/ورودی‌های بازارچه Plugin مشترک در `$HOME/.agents/*` را ببیند و
زیرفرایندها می‌توانند پیکربندی و توکن‌های خانه کاربر را پیدا کنند.

اجرای `openclaw migrate codex` در یک ترمینال تعاملی، برنامه کامل را پیش‌نمایش می‌دهد،
سپس پیش از تأیید نهایی apply، انتخابگرهای چک‌باکسی را باز می‌کند. موارد
کپی مهارت ابتدا پرسیده می‌شوند. برای انتخاب گروهی از `Toggle all on` یا `Toggle all off` استفاده کنید.
برای تغییر وضعیت ردیف‌ها Space را فشار دهید، یا برای فعال کردن ردیف برجسته‌شده
و ادامه دادن Enter را فشار دهید. مهارت‌های برنامه‌ریزی‌شده از ابتدا تیک‌خورده‌اند، مهارت‌های دارای تعارض از ابتدا بدون تیک هستند، و
`Skip for now` کپی مهارت‌ها را برای این اجرا رد می‌کند، در حالی که همچنان به انتخاب Plugin
ادامه می‌دهد. وقتی Pluginهای curated Codex نصب‌شده از مبدأ قابل مهاجرت باشند و
`--plugin` ارائه نشده باشد، مهاجرت سپس برای فعال‌سازی Plugin بومی Codex
بر اساس نام Plugin درخواست می‌کند. موارد Plugin
از ابتدا تیک‌خورده‌اند، مگر اینکه پیکربندی Plugin هدف OpenClaw Codex از قبل آن
Plugin را داشته باشد. Pluginهای هدف موجود از ابتدا بدون تیک هستند و یک راهنمای تعارض مانند
`conflict: plugin exists` نشان می‌دهند؛ برای اینکه در آن اجرا هیچ Plugin بومی Codex
مهاجرت نشود، `Toggle all off` را انتخاب کنید، یا برای توقف پیش از اعمال، `Skip for now` را انتخاب کنید. برای اجراهای اسکریپتی یا
دقیق، برای هر مهارت یک بار `--skill <name>` را ارسال کنید، برای مثال:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

برای محدود کردن مهاجرت Plugin بومی Codex به‌صورت غیرتعاملی
به یک یا چند Plugin curated نصب‌شده از مبدأ، از `--plugin <name>` استفاده کنید:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex چه چیزهایی را وارد می‌کند

- دایرکتوری‌های مهارت Codex CLI زیر `$CODEX_HOME/skills`، به‌جز کش
  `.system` متعلق به Codex.
- AgentSkills شخصی زیر `$HOME/.agents/skills`، که وقتی مالکیت برای هر عامل را می‌خواهید، در فضای کاری عامل فعلی
  OpenClaw کپی می‌شوند.
- Pluginهای Codex نصب‌شده از مبدأ `openai-curated` که از طریق
  `plugin/list` در app-server Codex کشف شده‌اند. برنامه‌ریزی برای هر Plugin نصب‌شده
  فعال، `plugin/read` را می‌خواند. Pluginهای متکی به اپ نیاز دارند پاسخ حساب app-server
  مبدأ Codex یک حساب اشتراک ChatGPT باشد؛ پاسخ‌های حساب غیر ChatGPT یا مفقود
  با `codex_subscription_required` رد می‌شوند. به‌صورت پیش‌فرض،
  مهاجرت `app/list` مبدأ را فراخوانی نمی‌کند، بنابراین Pluginهای متکی به اپ که از
  دروازه حساب عبور می‌کنند، بدون راستی‌آزمایی دسترس‌پذیری اپ مبدأ برنامه‌ریزی می‌شوند، و
  شکست‌های انتقال جست‌وجوی حساب با `codex_account_unavailable` رد می‌شوند. وقتی
  می‌خواهید مهاجرت یک تصویر تازه `app/list` از مبدأ را اجباری کند و پیش از برنامه‌ریزی فعال‌سازی بومی، حضور، فعال بودن، و
  دسترس‌پذیری هر اپ متعلق را الزام کند، `--verify-plugin-apps` را ارسال کنید. در آن حالت، شکست‌های انتقال
  جست‌وجوی حساب به راستی‌آزمایی موجودی اپ مبدأ منتقل می‌شوند. تصویر موجودی اپ
  مبدأ برای فرایند فعلی در حافظه نگه داشته می‌شود؛
  در خروجی مهاجرت یا پیکربندی هدف نوشته نمی‌شود. Pluginهای غیرفعال،
  جزئیات خوانده‌نشدنی Plugin، حساب‌های مبدأ محدود به اشتراک، و، وقتی
  راستی‌آزمایی درخواست شده باشد، اپ‌های مفقود، اپ‌های غیرفعال، اپ‌های غیرقابل دسترس، یا
  شکست‌های موجودی اپ مبدأ، به‌جای ورودی‌های پیکربندی هدف، به موارد دستی ردشده با دلایل نوع‌دار
  تبدیل می‌شوند.
  apply برای هر Plugin واجد شرایط انتخاب‌شده، `plugin/install` را در app-server فراخوانی می‌کند،
  حتی اگر app-server هدف از قبل گزارش کند که آن Plugin نصب و
  فعال است. Pluginهای Codex مهاجرت‌داده‌شده فقط در نشست‌هایی قابل استفاده‌اند که
  هارنس بومی Codex را انتخاب می‌کنند؛ آن‌ها در اجراهای ارائه‌دهنده OpenClaw،
  اتصال‌های گفت‌وگوی ACP، یا هارنس‌های دیگر ارائه نمی‌شوند.

### وضعیت Codex برای بازبینی دستی

`config.toml` در Codex، `hooks/hooks.json` بومی، بازارچه‌های غیر curated، بسته‌های کش‌شده
Plugin که Pluginهای curated نصب‌شده از مبدأ نیستند، و Pluginهای نصب‌شده از مبدأ
که در دروازه اشتراک مبدأ ناموفق می‌شوند، به‌صورت خودکار فعال نمی‌شوند.
وقتی `--verify-plugin-apps` تنظیم شده باشد، Pluginهایی که در دروازه موجودی اپ مبدأ
ناموفق می‌شوند نیز رد می‌شوند. آن‌ها در گزارش مهاجرت برای
بازبینی دستی کپی یا گزارش می‌شوند.

برای Pluginهای curated نصب‌شده از مبدأ و مهاجرت‌داده‌شده، apply این موارد را می‌نویسد:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- یک ورودی Plugin صریح با `marketplaceName: "openai-curated"` و
  `pluginName` برای هر Plugin انتخاب‌شده

مهاجرت هرگز `plugins["*"]` را نمی‌نویسد و هرگز مسیرهای cache بازارچه محلی را ذخیره نمی‌کند. شکست‌های اشتراک در سمت منبع روی آیتم‌های دستی با دلایل typed مانند `codex_subscription_required`،‏ `codex_account_unavailable`،‏ `plugin_disabled` یا `plugin_read_unavailable` گزارش می‌شوند. با `--verify-plugin-apps`، شکست‌های موجودی برنامه در سمت منبع نیز می‌توانند به‌صورت `app_inaccessible`،‏ `app_disabled`،‏ `app_missing` یا `app_inventory_unavailable` ظاهر شوند. Pluginهای ردشده در config مقصد نوشته نمی‌شوند.
نصب‌هایی در سمت مقصد که به auth نیاز دارند، روی آیتم Plugin متأثر با `status: "skipped"`،‏ `reason: "auth_required"` و شناسه‌های برنامه پاک‌سازی‌شده گزارش می‌شوند. ورودی‌های صریح config آن‌ها تا زمانی که دوباره مجوزدهی و فعالشان کنید، به‌صورت غیرفعال نوشته می‌شوند. سایر شکست‌های نصب، نتیجه‌های `error` در سطح آیتم هستند.

اگر موجودی Plugin سرور برنامه Codex هنگام برنامه‌ریزی در دسترس نباشد، مهاجرت به‌جای شکست‌دادن کل مهاجرت، به آیتم‌های advisory بسته cacheشده fallback می‌کند.

## ارائه‌دهنده Hermes

ارائه‌دهنده همراه Hermes به‌صورت پیش‌فرض وضعیت را در `~/.hermes` تشخیص می‌دهد. وقتی Hermes جای دیگری قرار دارد، از `--from <path>` استفاده کنید.

### چیزهایی که Hermes وارد می‌کند

- پیکربندی مدل پیش‌فرض از `config.yaml`.
- ارائه‌دهندگان مدل پیکربندی‌شده و endpointهای سفارشی سازگار با OpenAI از `providers` و `custom_providers`.
- تعریف‌های سرور MCP از `mcp_servers` یا `mcp.servers`.
- `SOUL.md` و `AGENTS.md` به فضای کاری عامل OpenClaw.
- `memories/MEMORY.md` و `memories/USER.md` که به فایل‌های حافظه فضای کاری افزوده می‌شوند.
- پیش‌فرض‌های config حافظه برای حافظه فایلی OpenClaw، به‌علاوه آیتم‌های archive یا manual-review برای ارائه‌دهندگان حافظه خارجی مانند Honcho.
- Skills که شامل فایل `SKILL.md` زیر `skills/<name>/` هستند.
- مقدارهای config برای هر Skill از `skills.config`.
- اعتبارنامه‌های OAuth مربوط به OpenCode OpenAI از `auth.json` در OpenCode، وقتی مهاجرت تعاملی اعتبارنامه پذیرفته شود، یا وقتی `--include-secrets` تنظیم شده باشد. ورودی‌های OAuth در `auth.json` متعلق به Hermes وضعیت legacy هستند که برای reauth دستی OpenAI یا repair با doctor گزارش می‌شوند.
- کلیدهای API و tokenهای پشتیبانی‌شده از `.env` در Hermes و `auth.json` در OpenCode، وقتی مهاجرت تعاملی اعتبارنامه پذیرفته شود، یا وقتی `--include-secrets` تنظیم شده باشد.

### کلیدهای پشتیبانی‌شده `.env`

- `AI_GATEWAY_API_KEY`
- `ALIBABA_API_KEY`
- `ANTHROPIC_API_KEY`
- `ARCEEAI_API_KEY`
- `CEREBRAS_API_KEY`
- `CHUTES_API_KEY`
- `CLOUDFLARE_AI_GATEWAY_API_KEY`
- `COPILOT_GITHUB_TOKEN`
- `DASHSCOPE_API_KEY`
- `DEEPINFRA_API_KEY`
- `DEEPSEEK_API_KEY`
- `FIREWORKS_API_KEY`
- `GEMINI_API_KEY`
- `GH_TOKEN`
- `GITHUB_TOKEN`
- `GLM_API_KEY`
- `GOOGLE_API_KEY`
- `GROQ_API_KEY`
- `HF_TOKEN`
- `HUGGINGFACE_HUB_TOKEN`
- `KILOCODE_API_KEY`
- `KIMICODE_API_KEY`
- `KIMI_API_KEY`
- `MINIMAX_API_KEY`
- `MINIMAX_CODING_API_KEY`
- `MISTRAL_API_KEY`
- `MODELSTUDIO_API_KEY`
- `MOONSHOT_API_KEY`
- `NVIDIA_API_KEY`
- `OPENAI_API_KEY`
- `OPENCODE_API_KEY`
- `OPENCODE_GO_API_KEY`
- `OPENCODE_ZEN_API_KEY`
- `OPENROUTER_API_KEY`
- `QIANFAN_API_KEY`
- `QWEN_API_KEY`
- `TOGETHER_API_KEY`
- `VENICE_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`
- `ZAI_API_KEY`
- `Z_AI_API_KEY`

### وضعیت فقط-archive

وضعیت Hermes که OpenClaw نمی‌تواند به‌طور ایمن تفسیر کند، برای بازبینی دستی در گزارش مهاجرت کپی می‌شود، اما در config یا اعتبارنامه‌های زنده OpenClaw بارگذاری نمی‌شود. این کار وضعیت مبهم یا ناامن را حفظ می‌کند، بدون اینکه وانمود کند OpenClaw می‌تواند آن را خودکار اجرا کند یا به آن اعتماد کند:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

### پس از اعمال

```bash
openclaw doctor
```

## قرارداد Plugin

منابع مهاجرت Pluginها هستند. یک Plugin شناسه‌های ارائه‌دهنده خود را در `openclaw.plugin.json` اعلام می‌کند:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

در زمان اجرا، Plugin متد `api.registerMigrationProvider(...)` را فراخوانی می‌کند. ارائه‌دهنده `detect`،‏ `plan` و `apply` را پیاده‌سازی می‌کند. Core مالک orchestration در CLI، سیاست backup، promptها، خروجی JSON و پیش‌بررسی conflict است. Core برنامه بازبینی‌شده را به `apply(ctx, plan)` می‌فرستد، و ارائه‌دهندگان فقط وقتی آن آرگومان برای سازگاری وجود نداشته باشد، می‌توانند برنامه را دوباره بسازند.

Pluginهای ارائه‌دهنده می‌توانند از `openclaw/plugin-sdk/migration` برای ساخت آیتم و شمارش‌های خلاصه، به‌علاوه از `openclaw/plugin-sdk/migration-runtime` برای کپی فایل conflict-aware، کپی‌های گزارش فقط-archive، wrapperهای config-runtime cacheشده و گزارش‌های مهاجرت استفاده کنند.

## یکپارچه‌سازی راه‌اندازی اولیه

وقتی یک ارائه‌دهنده منبع شناخته‌شده‌ای را تشخیص دهد، راه‌اندازی اولیه می‌تواند مهاجرت را پیشنهاد کند. هر دو `openclaw onboard --flow import` و `openclaw setup --wizard --import-from hermes` از همان ارائه‌دهنده مهاجرت Plugin استفاده می‌کنند و همچنان پیش از اعمال، یک پیش‌نمایش نشان می‌دهند.

<Note>
واردکردن از راه‌اندازی اولیه به یک setup تازه OpenClaw نیاز دارد. اگر از قبل وضعیت محلی دارید، ابتدا config، اعتبارنامه‌ها، sessionها و فضای کاری را reset کنید. واردکردن‌های backup-plus-overwrite یا merge برای setupهای موجود پشت feature gate هستند.
</Note>

## مرتبط

- [مهاجرت از Hermes](/fa/install/migrating-hermes): راهنمای گام‌به‌گام برای کاربر.
- [مهاجرت از Claude](/fa/install/migrating-claude): راهنمای گام‌به‌گام برای کاربر.
- [مهاجرت](/fa/install/migrating): انتقال OpenClaw به یک دستگاه جدید.
- [Doctor](/fa/gateway/doctor): بررسی سلامت پس از اعمال یک مهاجرت.
- [Plugins](/fa/tools/plugin): نصب و ثبت Plugin.
