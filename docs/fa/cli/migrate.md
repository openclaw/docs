---
read_when:
    - می‌خواهید از Hermes یا سامانهٔ عامل دیگری به OpenClaw مهاجرت کنید
    - شما در حال افزودن یک ارائه‌دهندهٔ مهاجرتِ متعلق به Plugin هستید
summary: مرجع CLI برای `openclaw migrate` (وارد کردن وضعیت از سامانهٔ عامل دیگر)
title: مهاجرت
x-i18n:
    generated_at: "2026-05-12T23:30:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5103a85404f0204cc265df611449e9cd4b18347c6862a8b36d13838709896459
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

وضعیت را از یک سامانه‌ی عامل دیگر، از طریق یک ارائه‌دهنده‌ی مهاجرت که مالکیت آن با Plugin است، وارد کنید. ارائه‌دهندگان بسته‌بندی‌شده وضعیت Codex CLI، [Claude](/fa/install/migrating-claude)، و [Hermes](/fa/install/migrating-hermes) را پوشش می‌دهند؛ Pluginهای شخص ثالث می‌توانند ارائه‌دهندگان بیشتری را ثبت کنند.

<Tip>
برای راهنماهای کاربرمحور، [مهاجرت از Claude](/fa/install/migrating-claude) و [مهاجرت از Hermes](/fa/install/migrating-hermes) را ببینید. [مرکز مهاجرت](/fa/install/migrating) همه‌ی مسیرها را فهرست می‌کند.
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
  نام یک ارائه‌دهنده‌ی مهاجرت ثبت‌شده، برای مثال `hermes`. برای دیدن ارائه‌دهندگان نصب‌شده، `openclaw migrate list` را اجرا کنید.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  برنامه را بسازید و بدون تغییر دادن وضعیت خارج شوید.
</ParamField>
<ParamField path="--from <path>" type="string">
  دایرکتوری وضعیت مبدأ را بازنویسی کنید. مقدار پیش‌فرض Hermes برابر `~/.hermes` است.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  اعتبارنامه‌های پشتیبانی‌شده را وارد کنید. به‌طور پیش‌فرض خاموش است.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  اجازه دهید apply وقتی برنامه تعارض‌ها را گزارش می‌کند، هدف‌های موجود را جایگزین کند.
</ParamField>
<ParamField path="--yes" type="boolean">
  اعلان تأیید را رد کنید. در حالت غیرتعاملی الزامی است.
</ParamField>
<ParamField path="--skill <name>" type="string">
  یک مورد کپی Skills را بر اساس نام Skills یا شناسه‌ی مورد انتخاب کنید. برای مهاجرت چند Skills، پرچم را تکرار کنید. وقتی حذف شود، مهاجرت‌های تعاملی Codex یک انتخابگر کادر تأیید نشان می‌دهند و مهاجرت‌های غیرتعاملی همه‌ی Skills برنامه‌ریزی‌شده را نگه می‌دارند.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  یک مورد نصب Plugin در Codex را بر اساس نام Plugin یا شناسه‌ی مورد انتخاب کنید. برای مهاجرت چند Plugin در Codex، پرچم را تکرار کنید. وقتی حذف شود، مهاجرت‌های تعاملی Codex یک انتخابگر بومی کادر تأیید Plugin در Codex نشان می‌دهند و مهاجرت‌های غیرتعاملی همه‌ی Pluginهای برنامه‌ریزی‌شده را نگه می‌دارند. این فقط برای Pluginهای Codex از نوع `openai-curated` که در مبدأ نصب شده‌اند و توسط موجودی app-server کدکس کشف شده‌اند اعمال می‌شود.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  فقط Codex. پیش از برنامه‌ریزی فعال‌سازی Plugin بومی، یک پیمایش تازه‌ی `app/list` در app-server مبدأ Codex را اجبار کنید. برای سریع نگه داشتن برنامه‌ریزی مهاجرت، به‌طور پیش‌فرض خاموش است.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  پشتیبان‌گیری پیش از اعمال را رد کنید. وقتی وضعیت محلی OpenClaw وجود دارد، به `--force` نیاز دارد.
</ParamField>
<ParamField path="--force" type="boolean">
  وقتی apply در غیر این صورت از رد کردن پشتیبان‌گیری امتناع می‌کند، در کنار `--no-backup` الزامی است.
</ParamField>
<ParamField path="--json" type="boolean">
  برنامه یا نتیجه‌ی apply را به‌صورت JSON چاپ کنید. با `--json` و بدون `--yes`، apply برنامه را چاپ می‌کند و وضعیت را تغییر نمی‌دهد.
</ParamField>

## مدل ایمنی

`openclaw migrate` ابتدا پیش‌نمایش ارائه می‌دهد.

<AccordionGroup>
  <Accordion title="پیش‌نمایش پیش از apply">
    ارائه‌دهنده پیش از هر تغییری یک برنامه‌ی موردبه‌مورد برمی‌گرداند، شامل تعارض‌ها، موارد ردشده، و موارد حساس. برنامه‌های JSON، خروجی apply، و گزارش‌های مهاجرت کلیدهای تو در توی شبیه راز مانند کلیدهای API، توکن‌ها، سرآیندهای authorization، کوکی‌ها، و گذرواژه‌ها را حذف یا پنهان می‌کنند.

    `openclaw migrate apply <provider>` برنامه را پیش‌نمایش می‌کند و پیش از تغییر وضعیت درخواست تأیید می‌دهد، مگر اینکه `--yes` تنظیم شده باشد. در حالت غیرتعاملی، apply به `--yes` نیاز دارد.

  </Accordion>
  <Accordion title="پشتیبان‌ها">
    Apply پیش از اعمال مهاجرت، یک پشتیبان OpenClaw ایجاد و تأیید می‌کند. اگر هنوز وضعیت محلی OpenClaw وجود نداشته باشد، مرحله‌ی پشتیبان‌گیری رد می‌شود و مهاجرت می‌تواند ادامه پیدا کند. برای رد کردن پشتیبان‌گیری وقتی وضعیت وجود دارد، هر دو `--no-backup` و `--force` را پاس دهید.
  </Accordion>
  <Accordion title="تعارض‌ها">
    Apply وقتی برنامه تعارض دارد، از ادامه دادن امتناع می‌کند. برنامه را بررسی کنید، سپس اگر جایگزینی هدف‌های موجود عمدی است، دوباره با `--overwrite` اجرا کنید. ارائه‌دهندگان همچنان ممکن است برای فایل‌های بازنویسی‌شده در دایرکتوری گزارش مهاجرت، پشتیبان‌های سطح مورد بنویسند.
  </Accordion>
  <Accordion title="رازها">
    رازها هرگز به‌طور پیش‌فرض وارد نمی‌شوند. برای وارد کردن اعتبارنامه‌های پشتیبانی‌شده از `--include-secrets` استفاده کنید.
  </Accordion>
</AccordionGroup>

## ارائه‌دهنده‌ی Claude

ارائه‌دهنده‌ی بسته‌بندی‌شده‌ی Claude به‌طور پیش‌فرض وضعیت Claude Code را در `~/.claude` تشخیص می‌دهد. برای وارد کردن یک خانه‌ی Claude Code یا ریشه‌ی پروژه‌ی مشخص، از `--from <path>` استفاده کنید.

<Tip>
برای یک راهنمای کاربرمحور، [مهاجرت از Claude](/fa/install/migrating-claude) را ببینید.
</Tip>

### Claude چه چیزهایی را وارد می‌کند

- `CLAUDE.md` پروژه و `.claude/CLAUDE.md` را به فضای کاری عامل OpenClaw.
- `~/.claude/CLAUDE.md` کاربر که به `USER.md` فضای کاری افزوده می‌شود.
- تعریف‌های سرور MCP از `.mcp.json` پروژه، `~/.claude.json` در Claude Code، و `claude_desktop_config.json` در Claude Desktop.
- دایرکتوری‌های Skills در Claude که شامل `SKILL.md` هستند.
- فایل‌های Markdown فرمان Claude که فقط با فراخوانی دستی به Skills در OpenClaw تبدیل می‌شوند.

### بایگانی و وضعیت نیازمند بازبینی دستی

هوک‌ها، مجوزها، پیش‌فرض‌های محیطی، حافظه‌ی محلی، قواعد محدود به مسیر، زیرفرایندهای عامل، کش‌ها، برنامه‌ها، و تاریخچه‌ی پروژه‌ی Claude در گزارش مهاجرت حفظ می‌شوند یا به‌عنوان موارد نیازمند بازبینی دستی گزارش می‌شوند. OpenClaw هوک‌ها را اجرا نمی‌کند، فهرست‌های مجاز گسترده را کپی نمی‌کند، و وضعیت اعتبارنامه‌های OAuth/Desktop را به‌طور خودکار وارد نمی‌کند.

## ارائه‌دهنده‌ی Codex

ارائه‌دهنده‌ی بسته‌بندی‌شده‌ی Codex به‌طور پیش‌فرض وضعیت Codex CLI را در `~/.codex` تشخیص می‌دهد، یا
وقتی متغیر محیطی `CODEX_HOME` تنظیم شده باشد، در `CODEX_HOME`. برای
فهرست‌برداری از یک خانه‌ی مشخص Codex، از `--from <path>` استفاده کنید.

وقتی به هارنس Codex در OpenClaw منتقل می‌شوید و می‌خواهید
دارایی‌های شخصی مفید Codex CLI را آگاهانه ارتقا دهید، از این ارائه‌دهنده استفاده کنید. اجراهای محلی app-server
در Codex از دایرکتوری‌های `CODEX_HOME` و `HOME` جداگانه برای هر عامل استفاده می‌کنند، بنابراین به‌طور پیش‌فرض
وضعیت شخصی Codex CLI شما را نمی‌خوانند.

اجرای `openclaw migrate codex` در یک ترمینال تعاملی، کل
برنامه را پیش‌نمایش می‌کند، سپس پیش از تأیید نهایی apply، انتخابگرهای کادر تأیید را باز می‌کند. موارد
کپی Skills ابتدا پرسیده می‌شوند. برای انتخاب انبوه از `Toggle all on` یا `Toggle all off`
استفاده کنید. برای تغییر وضعیت ردیف‌ها Space را فشار دهید، یا برای فعال کردن ردیف برجسته‌شده
و ادامه دادن Enter را فشار دهید. Skills برنامه‌ریزی‌شده از ابتدا انتخاب‌شده‌اند، Skills دارای تعارض از ابتدا انتخاب‌نشده‌اند، و
`Skip for now` کپی‌های Skills را برای این اجرا رد می‌کند، در حالی که همچنان به انتخاب
Plugin ادامه می‌دهد. وقتی Pluginهای Codex گزینش‌شده‌ی نصب‌شده در مبدأ قابل مهاجرت باشند و
`--plugin` ارائه نشده باشد، مهاجرت سپس برای فعال‌سازی Plugin بومی Codex
بر اساس نام Plugin درخواست می‌دهد. موارد Plugin
از ابتدا انتخاب‌شده‌اند مگر اینکه پیکربندی Plugin هدف OpenClaw Codex از قبل آن
Plugin را داشته باشد. Pluginهای موجود در هدف از ابتدا انتخاب‌نشده‌اند و یک راهنمای تعارض مانند
`conflict: plugin exists` نشان می‌دهند؛ برای مهاجرت ندادن هیچ Plugin بومی Codex
در آن اجرا، `Toggle all off` را انتخاب کنید، یا برای توقف پیش از apply، `Skip for now` را انتخاب کنید. برای اجراهای اسکریپتی یا
دقیق، `--skill <name>` را یک بار برای هر Skills پاس دهید، برای مثال:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

از `--plugin <name>` برای محدود کردن غیرتعاملی مهاجرت Plugin بومی Codex
به یک یا چند Plugin گزینش‌شده‌ی نصب‌شده در مبدأ استفاده کنید:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex چه چیزهایی را وارد می‌کند

- دایرکتوری‌های Skills در Codex CLI زیر `$CODEX_HOME/skills`، به‌جز کش
  `.system` در Codex.
- AgentSkills شخصی زیر `$HOME/.agents/skills` که وقتی مالکیت برای هر عامل را می‌خواهید، به فضای کاری
  عامل فعلی OpenClaw کپی می‌شوند.
- Pluginهای Codex از نوع `openai-curated` که در مبدأ نصب شده‌اند و از طریق
  `plugin/list` در app-server کدکس کشف می‌شوند. برنامه‌ریزی برای هر Plugin نصب‌شده‌ی
  فعال، `plugin/read` را می‌خواند. Pluginهای مبتنی بر app نیاز دارند پاسخ حساب
  app-server مبدأ Codex یک حساب اشتراک ChatGPT باشد؛ پاسخ‌های حساب غیر ChatGPT یا
  مفقود با `codex_subscription_required` رد می‌شوند. به‌طور پیش‌فرض،
  مهاجرت `app/list` مبدأ را فراخوانی نمی‌کند، بنابراین Pluginهای مبتنی بر app که از دروازه‌ی
  حساب عبور می‌کنند، بدون تأیید دسترسی‌پذیری app در مبدأ برنامه‌ریزی می‌شوند، و
  شکست‌های انتقال در جست‌وجوی حساب با `codex_account_unavailable` رد می‌شوند. وقتی
  می‌خواهید مهاجرت یک عکس فوری تازه از `app/list` مبدأ را اجبار کند و
  پیش از برنامه‌ریزی فعال‌سازی بومی، همه‌ی appهای تحت مالکیت حاضر، فعال، و
  قابل دسترسی باشند، `--verify-plugin-apps` را پاس دهید. در آن حالت، شکست‌های انتقال در جست‌وجوی
  حساب به تأیید موجودی app مبدأ واگذار می‌شوند. عکس فوری موجودی
  app مبدأ برای فرایند فعلی در حافظه نگه داشته می‌شود؛ در خروجی مهاجرت یا پیکربندی هدف
  نوشته نمی‌شود. Pluginهای غیرفعال،
  جزئیات Plugin خوانده‌نشدنی، حساب‌های مبدأ محدودشده به اشتراک، و، وقتی
  تأیید درخواست شده باشد، appهای مفقود، appهای غیرفعال، appهای غیرقابل دسترسی، یا
  شکست‌های موجودی app مبدأ به‌جای ورودی‌های پیکربندی هدف، به موارد دستی ردشده با دلایل نوع‌دار
  تبدیل می‌شوند.
  Apply برای هر Plugin واجد شرایطِ انتخاب‌شده `plugin/install` در app-server را فراخوانی می‌کند،
  حتی اگر app-server هدف از قبل آن Plugin را نصب‌شده و
  فعال گزارش کند. Pluginهای مهاجرت‌یافته‌ی Codex فقط در نشست‌هایی قابل استفاده‌اند که
  هارنس بومی Codex را انتخاب می‌کنند؛ آن‌ها در معرض Pi، اجراهای عادی ارائه‌دهنده‌ی OpenAI،
  پیوندهای مکالمه‌ی ACP، یا هارنس‌های دیگر قرار نمی‌گیرند.

### وضعیت Codex نیازمند بازبینی دستی

`config.toml` در Codex، `hooks/hooks.json` بومی، بازارچه‌های غیرگزینش‌شده، بسته‌های
Plugin کش‌شده که Pluginهای گزینش‌شده‌ی نصب‌شده در مبدأ نیستند، و Pluginهای نصب‌شده در مبدأ
که دروازه‌ی اشتراک مبدأ را پاس نمی‌کنند، به‌طور خودکار فعال نمی‌شوند.
وقتی `--verify-plugin-apps` تنظیم شده باشد، Pluginهایی که دروازه‌ی موجودی app مبدأ
را پاس نمی‌کنند نیز رد می‌شوند. آن‌ها برای بازبینی دستی در گزارش مهاجرت کپی یا گزارش می‌شوند.

برای Pluginهای گزینش‌شده‌ی نصب‌شده در مبدأ که مهاجرت شده‌اند، apply می‌نویسد:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- یک ورودی صریح Plugin با `marketplaceName: "openai-curated"` و
  `pluginName` برای هر Plugin انتخاب‌شده

مهاجرت هرگز `plugins["*"]` را نمی‌نویسد و هرگز مسیرهای کش بازارچه‌ی محلی را ذخیره نمی‌کند.
شکست‌های اشتراک در سمت مبدأ روی موارد دستی با دلایل نوع‌دار مانند
`codex_subscription_required`، `codex_account_unavailable`،
`plugin_disabled`، یا `plugin_read_unavailable` گزارش می‌شوند. با `--verify-plugin-apps`،
شکست‌های موجودی app مبدأ می‌توانند به‌صورت `app_inaccessible`،
`app_disabled`، `app_missing`، یا `app_inventory_unavailable` نیز ظاهر شوند. Pluginهای ردشده
در پیکربندی هدف نوشته نمی‌شوند.
نصب‌های سمت هدف که به احراز هویت نیاز دارند، روی مورد Plugin متأثر با
`status: "skipped"`، `reason: "auth_required"`، و شناسه‌های app پاک‌سازی‌شده گزارش می‌شوند.
ورودی‌های پیکربندی صریح آن‌ها تا زمانی که دوباره مجوزدهی و
فعالشان کنید، به‌صورت غیرفعال نوشته می‌شوند. شکست‌های نصب دیگر، نتایج `error` محدود به همان مورد هستند.

اگر موجودی Plugin در app-server کدکس هنگام برنامه‌ریزی در دسترس نباشد، مهاجرت
به‌جای شکست دادن کل
مهاجرت، به موارد مشاوره‌ای بسته‌ی کش‌شده برمی‌گردد.

## ارائه‌دهنده‌ی Hermes

ارائه‌دهنده‌ی بسته‌بندی‌شده‌ی Hermes به‌طور پیش‌فرض وضعیت را در `~/.hermes` تشخیص می‌دهد. وقتی Hermes جای دیگری قرار دارد، از `--from <path>` استفاده کنید.

### Hermes چه چیزهایی را وارد می‌کند

- پیکربندی پیش‌فرض مدل از `config.yaml`.
- ارائه‌دهندگان مدل پیکربندی‌شده و نقاط پایانی سفارشی سازگار با OpenAI از `providers` و `custom_providers`.
- تعریف‌های سرور MCP از `mcp_servers` یا `mcp.servers`.
- `SOUL.md` و `AGENTS.md` در فضای کاری عامل OpenClaw.
- `memories/MEMORY.md` و `memories/USER.md` که به فایل‌های حافظه فضای کاری افزوده می‌شوند.
- پیش‌فرض‌های پیکربندی حافظه برای حافظه فایلی OpenClaw، به‌علاوه موارد آرشیو یا بازبینی دستی برای ارائه‌دهندگان حافظه خارجی مانند Honcho.
- Skillsهایی که شامل یک فایل `SKILL.md` زیر `skills/<name>/` هستند.
- مقادیر پیکربندی مختص هر Skill از `skills.config`.
- کلیدهای API پشتیبانی‌شده از `.env`، فقط با `--include-secrets`.

### کلیدهای `.env` پشتیبانی‌شده

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### وضعیت فقط آرشیوی

وضعیت Hermes که OpenClaw نمی‌تواند به‌شکل ایمن تفسیر کند، برای بازبینی دستی در گزارش مهاجرت کپی می‌شود، اما در پیکربندی زنده یا اعتبارنامه‌های OpenClaw بارگذاری نمی‌شود. این کار وضعیت مبهم یا ناامن را حفظ می‌کند، بدون اینکه وانمود کند OpenClaw می‌تواند آن را به‌طور خودکار اجرا کند یا به آن اعتماد کند:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### پس از اعمال

```bash
openclaw doctor
```

## قرارداد Plugin

منابع مهاجرت، plugin هستند. یک plugin شناسه‌های ارائه‌دهنده خود را در `openclaw.plugin.json` اعلام می‌کند:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

در زمان اجرا، plugin تابع `api.registerMigrationProvider(...)` را فراخوانی می‌کند. ارائه‌دهنده `detect`، `plan` و `apply` را پیاده‌سازی می‌کند. هسته مالک هماهنگ‌سازی CLI، سیاست پشتیبان‌گیری، پیام‌ها، خروجی JSON و پیش‌بررسی تعارض است. هسته طرح بازبینی‌شده را به `apply(ctx, plan)` می‌دهد، و ارائه‌دهندگان فقط وقتی آن آرگومان برای سازگاری وجود نداشته باشد می‌توانند طرح را دوباره بسازند.

Pluginهای ارائه‌دهنده می‌توانند از `openclaw/plugin-sdk/migration` برای ساخت آیتم و شمارش‌های خلاصه، و از `openclaw/plugin-sdk/migration-runtime` برای کپی فایل‌های آگاه از تعارض، کپی‌های گزارش فقط آرشیوی، پوشش‌های config-runtime کش‌شده، و گزارش‌های مهاجرت استفاده کنند.

## یکپارچه‌سازی راه‌اندازی اولیه

وقتی یک ارائه‌دهنده منبع شناخته‌شده‌ای را تشخیص دهد، راه‌اندازی اولیه می‌تواند مهاجرت را پیشنهاد کند. هم `openclaw onboard --flow import` و هم `openclaw setup --wizard --import-from hermes` از همان ارائه‌دهنده مهاجرت plugin استفاده می‌کنند و همچنان پیش از اعمال، پیش‌نمایش نشان می‌دهند.

<Note>
واردسازی‌های راه‌اندازی اولیه به یک راه‌اندازی تازه OpenClaw نیاز دارند. اگر از قبل وضعیت محلی دارید، ابتدا پیکربندی، اعتبارنامه‌ها، نشست‌ها و فضای کاری را بازنشانی کنید. واردسازی‌های پشتیبان‌گیری-به‌علاوه-بازنویسی یا ادغام برای راه‌اندازی‌های موجود پشت پرچم قابلیت هستند.
</Note>

## مرتبط

- [مهاجرت از Hermes](/fa/install/migrating-hermes): راهنمای گام‌به‌گام کاربرمحور.
- [مهاجرت از Claude](/fa/install/migrating-claude): راهنمای گام‌به‌گام کاربرمحور.
- [مهاجرت](/fa/install/migrating): انتقال OpenClaw به یک دستگاه جدید.
- [Doctor](/fa/gateway/doctor): بررسی سلامت پس از اعمال یک مهاجرت.
- [Plugins](/fa/tools/plugin): نصب و ثبت plugin.
