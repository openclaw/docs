---
read_when:
    - می‌خواهید از Hermes یا یک سامانهٔ عامل دیگر به OpenClaw مهاجرت کنید
    - شما یک ارائه‌دهندهٔ مهاجرتِ تحت مالکیت Plugin اضافه می‌کنید
summary: مرجع CLI برای `openclaw migrate` (وارد کردن وضعیت از یک سامانهٔ عامل دیگر)
title: مهاجرت
x-i18n:
    generated_at: "2026-05-10T19:32:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb32f993d2412a97a1f91bf3f2b3ca1a653d1db3db75aa90d3b834bdc6acbb95
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

وضعیت را از یک سامانه عامل دیگر از طریق یک ارائه‌دهنده مهاجرت متعلق به Plugin وارد می‌کند. ارائه‌دهندگان همراه، وضعیت Codex CLI، [Claude](/fa/install/migrating-claude)، و [Hermes](/fa/install/migrating-hermes) را پوشش می‌دهند؛ Pluginهای شخص ثالث می‌توانند ارائه‌دهندگان بیشتری ثبت کنند.

<Tip>
برای راهنماهای کاربرمحور، [مهاجرت از Claude](/fa/install/migrating-claude) و [مهاجرت از Hermes](/fa/install/migrating-hermes) را ببینید. [مرکز مهاجرت](/fa/install/migrating) همه مسیرها را فهرست می‌کند.
</Tip>

## دستورها

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
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
  طرح را بسازید و بدون تغییر وضعیت خارج شوید.
</ParamField>
<ParamField path="--from <path>" type="string">
  پوشه وضعیت مبدأ را بازنویسی کنید. Hermes به‌طور پیش‌فرض از `~/.hermes` استفاده می‌کند.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  اعتبارنامه‌های پشتیبانی‌شده را وارد کنید. به‌طور پیش‌فرض غیرفعال است.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  وقتی طرح تعارض گزارش می‌کند، به اعمال اجازه دهید اهداف موجود را جایگزین کند.
</ParamField>
<ParamField path="--yes" type="boolean">
  درخواست تأیید را رد کنید. در حالت غیرتعاملی الزامی است.
</ParamField>
<ParamField path="--skill <name>" type="string">
  یک مورد کپی skill را با نام skill یا شناسه مورد انتخاب کنید. برای مهاجرت چند skill، این پرچم را تکرار کنید. وقتی حذف شود، مهاجرت‌های تعاملی Codex یک انتخابگر چک‌باکس نشان می‌دهند و مهاجرت‌های غیرتعاملی همه skillهای برنامه‌ریزی‌شده را نگه می‌دارند.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  یک مورد نصب Plugin مربوط به Codex را با نام Plugin یا شناسه مورد انتخاب کنید. برای مهاجرت چند Plugin مربوط به Codex، این پرچم را تکرار کنید. وقتی حذف شود، مهاجرت‌های تعاملی Codex یک انتخابگر چک‌باکس Plugin بومی Codex نشان می‌دهند و مهاجرت‌های غیرتعاملی همه Pluginهای برنامه‌ریزی‌شده را نگه می‌دارند. این فقط درباره Pluginهای Codex با منشأ نصب‌شده `openai-curated` اعمال می‌شود که توسط موجودی app-server مربوط به Codex کشف شده‌اند.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  پشتیبان‌گیری پیش از اعمال را رد کنید. وقتی وضعیت محلی OpenClaw وجود دارد، به `--force` نیاز دارد.
</ParamField>
<ParamField path="--force" type="boolean">
  وقتی اعمال در غیر این صورت از رد کردن پشتیبان‌گیری خودداری می‌کند، همراه با `--no-backup` الزامی است.
</ParamField>
<ParamField path="--json" type="boolean">
  طرح یا نتیجه اعمال را به‌صورت JSON چاپ کنید. با `--json` و بدون `--yes`، اعمال طرح را چاپ می‌کند و وضعیت را تغییر نمی‌دهد.
</ParamField>

## مدل ایمنی

`openclaw migrate` ابتدا پیش‌نمایش می‌دهد.

<AccordionGroup>
  <Accordion title="پیش‌نمایش پیش از اعمال">
    ارائه‌دهنده پیش از هر تغییری یک طرح موردبه‌مورد برمی‌گرداند، شامل تعارض‌ها، موارد ردشده، و موارد حساس. طرح‌های JSON، خروجی اعمال، و گزارش‌های مهاجرت، کلیدهای تودرتویی را که شبیه محرمانه‌ها هستند، مانند کلیدهای API، توکن‌ها، سرآیندهای authorization، کوکی‌ها، و گذرواژه‌ها، ویرایش و پنهان می‌کنند.

    `openclaw migrate apply <provider>` طرح را پیش‌نمایش می‌کند و پیش از تغییر وضعیت درخواست تأیید می‌دهد، مگر اینکه `--yes` تنظیم شده باشد. در حالت غیرتعاملی، اعمال به `--yes` نیاز دارد.

  </Accordion>
  <Accordion title="پشتیبان‌ها">
    اعمال، پیش از اعمال مهاجرت، یک پشتیبان OpenClaw ایجاد و راستی‌آزمایی می‌کند. اگر هنوز هیچ وضعیت محلی OpenClaw وجود نداشته باشد، مرحله پشتیبان‌گیری رد می‌شود و مهاجرت می‌تواند ادامه پیدا کند. برای رد کردن پشتیبان‌گیری وقتی وضعیت وجود دارد، هر دو `--no-backup` و `--force` را پاس دهید.
  </Accordion>
  <Accordion title="تعارض‌ها">
    وقتی طرح تعارض دارد، اعمال از ادامه خودداری می‌کند. طرح را بررسی کنید، سپس اگر جایگزینی اهداف موجود عمدی است، با `--overwrite` دوباره اجرا کنید. ارائه‌دهندگان همچنان ممکن است برای فایل‌های بازنویسی‌شده در پوشه گزارش مهاجرت، پشتیبان‌های سطح مورد بنویسند.
  </Accordion>
  <Accordion title="محرمانه‌ها">
    محرمانه‌ها هرگز به‌طور پیش‌فرض وارد نمی‌شوند. برای وارد کردن اعتبارنامه‌های پشتیبانی‌شده از `--include-secrets` استفاده کنید.
  </Accordion>
</AccordionGroup>

## ارائه‌دهنده Claude

ارائه‌دهنده همراه Claude به‌طور پیش‌فرض وضعیت Claude Code را در `~/.claude` تشخیص می‌دهد. برای وارد کردن یک خانه Claude Code یا ریشه پروژه مشخص، از `--from <path>` استفاده کنید.

<Tip>
برای یک راهنمای کاربرمحور، [مهاجرت از Claude](/fa/install/migrating-claude) را ببینید.
</Tip>

### Claude چه چیزهایی را وارد می‌کند

- فایل‌های `CLAUDE.md` پروژه و `.claude/CLAUDE.md` را به فضای کاری عامل OpenClaw وارد می‌کند.
- فایل `~/.claude/CLAUDE.md` کاربر را به `USER.md` فضای کاری اضافه می‌کند.
- تعریف‌های سرور MCP را از `.mcp.json` پروژه، `~/.claude.json` مربوط به Claude Code، و `claude_desktop_config.json` مربوط به Claude Desktop وارد می‌کند.
- پوشه‌های skill مربوط به Claude را که شامل `SKILL.md` هستند وارد می‌کند.
- فایل‌های Markdown فرمان Claude را فقط با فراخوانی دستی به skillهای OpenClaw تبدیل می‌کند.

### وضعیت بایگانی و بازبینی دستی

قلاب‌های Claude، مجوزها، پیش‌فرض‌های محیط، حافظه محلی، قواعد محدود به مسیر، زیردستیارها، کش‌ها، طرح‌ها، و تاریخچه پروژه در گزارش مهاجرت حفظ می‌شوند یا به‌عنوان موارد نیازمند بازبینی دستی گزارش می‌شوند. OpenClaw قلاب‌ها را اجرا نمی‌کند، فهرست‌های مجاز گسترده را کپی نمی‌کند، و وضعیت اعتبارنامه OAuth/Desktop را به‌طور خودکار وارد نمی‌کند.

## ارائه‌دهنده Codex

ارائه‌دهنده همراه Codex به‌طور پیش‌فرض وضعیت Codex CLI را در `~/.codex` تشخیص می‌دهد، یا
وقتی متغیر محیطی `CODEX_HOME` تنظیم شده باشد، در `CODEX_HOME`.
برای موجودی‌گیری از یک خانه Codex مشخص، از `--from <path>` استفاده کنید.

وقتی به harness مربوط به OpenClaw Codex مهاجرت می‌کنید و می‌خواهید
دارایی‌های شخصی مفید Codex CLI را آگاهانه ارتقا دهید، از این ارائه‌دهنده استفاده کنید.
راه‌اندازی‌های محلی app-server مربوط به Codex از پوشه‌های `CODEX_HOME` و `HOME`
مخصوص هر عامل استفاده می‌کنند، بنابراین به‌طور پیش‌فرض وضعیت شخصی Codex CLI شما را نمی‌خوانند.

اجرای `openclaw migrate codex` در یک ترمینال تعاملی، پیش‌نمایش کامل
طرح را نشان می‌دهد، سپس پیش از تأیید نهایی اعمال، انتخابگرهای چک‌باکس را باز می‌کند. موارد
کپی skill ابتدا پرسیده می‌شوند. برای انتخاب گروهی از `Toggle all on` یا `Toggle all off`
استفاده کنید؛ skillهای برنامه‌ریزی‌شده در ابتدا انتخاب‌شده‌اند، skillهای دارای تعارض در ابتدا انتخاب‌نشده‌اند، و
`Skip for now` کپی‌های skill را برای این اجرا رد می‌کند و همچنان به انتخاب
Plugin ادامه می‌دهد. وقتی Pluginهای curated مربوط به Codex با منشأ نصب‌شده قابل مهاجرت باشند و
`--plugin` ارائه نشده باشد، مهاجرت سپس برای فعال‌سازی Plugin بومی Codex
با نام Plugin درخواست می‌دهد. موارد Plugin
در ابتدا انتخاب‌شده‌اند مگر اینکه پیکربندی Plugin مربوط به OpenClaw Codex مقصد از قبل آن
Plugin را داشته باشد. Pluginهای مقصد موجود در ابتدا انتخاب‌نشده‌اند و یک راهنمای تعارض مانند
`conflict: plugin exists` نشان می‌دهند؛ برای مهاجرت ندادن هیچ Plugin بومی Codex
در آن اجرا، `Toggle all off` را انتخاب کنید، یا برای توقف پیش از اعمال، `Skip for now` را انتخاب کنید.
برای اجراهای اسکریپتی یا دقیق، برای هر skill یک بار `--skill <name>` را پاس دهید، برای مثال:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

برای محدود کردن غیرتعاملی مهاجرت Plugin بومی Codex
به یک یا چند Plugin curated با منشأ نصب‌شده، از `--plugin <name>` استفاده کنید:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex چه چیزهایی را وارد می‌کند

- پوشه‌های skill مربوط به Codex CLI زیر `$CODEX_HOME/skills`، به‌جز کش
  `.system` مربوط به Codex.
- AgentSkills شخصی زیر `$HOME/.agents/skills`، وقتی مالکیت مخصوص هر عامل را می‌خواهید، در فضای کاری
  عامل فعلی OpenClaw کپی می‌شوند.
- Pluginهای Codex با منشأ نصب‌شده `openai-curated` که از طریق
  `plugin/list` app-server مربوط به Codex کشف شده‌اند. اعمال، برای هر
  Plugin انتخاب‌شده، `plugin/install` app-server را فراخوانی می‌کند، حتی اگر app-server مقصد از قبل آن Plugin را
  نصب‌شده و فعال گزارش کند. Pluginهای Codex مهاجرت‌داده‌شده فقط در نشست‌هایی قابل استفاده‌اند که
  harness بومی Codex را انتخاب می‌کنند؛ آن‌ها در اختیار Pi، اجراهای عادی ارائه‌دهنده OpenAI،
  bindingهای گفت‌وگوی ACP، یا harnessهای دیگر قرار نمی‌گیرند.

### وضعیت Codex نیازمند بازبینی دستی

`config.toml` مربوط به Codex، `hooks/hooks.json` بومی، بازارچه‌های غیر curated، و
بسته‌های Plugin کش‌شده‌ای که Pluginهای curated با منشأ نصب‌شده نیستند، به‌طور
خودکار فعال نمی‌شوند. آن‌ها برای بازبینی دستی در گزارش مهاجرت کپی یا گزارش می‌شوند.

برای Pluginهای curated با منشأ نصب‌شده مهاجرت‌داده‌شده، اعمال می‌نویسد:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: false`
- یک ورودی Plugin صریح با `marketplaceName: "openai-curated"` و
  `pluginName` برای هر Plugin انتخاب‌شده

مهاجرت هرگز `plugins["*"]` را نمی‌نویسد و هرگز مسیرهای کش بازارچه محلی را
ذخیره نمی‌کند. نصب‌هایی که به احراز هویت نیاز دارند، روی مورد Plugin تحت تأثیر با
`status: "skipped"`، `reason: "auth_required"`، و شناسه‌های app پاک‌سازی‌شده گزارش می‌شوند.
ورودی‌های پیکربندی صریح آن‌ها تا وقتی دوباره مجوز دهید و
فعالشان کنید، غیرفعال نوشته می‌شوند. سایر شکست‌های نصب، نتایج `error` محدود به مورد هستند.

اگر موجودی Plugin مربوط به Codex app-server در زمان برنامه‌ریزی در دسترس نباشد، مهاجرت
به‌جای شکست دادن کل مهاجرت، به موارد مشورتی بسته کش‌شده fallback می‌کند.

## ارائه‌دهنده Hermes

ارائه‌دهنده همراه Hermes به‌طور پیش‌فرض وضعیت را در `~/.hermes` تشخیص می‌دهد. وقتی Hermes در جای دیگری قرار دارد، از `--from <path>` استفاده کنید.

### Hermes چه چیزهایی را وارد می‌کند

- پیکربندی مدل پیش‌فرض از `config.yaml`.
- ارائه‌دهندگان مدل پیکربندی‌شده و endpointهای سفارشی سازگار با OpenAI از `providers` و `custom_providers`.
- تعریف‌های سرور MCP از `mcp_servers` یا `mcp.servers`.
- `SOUL.md` و `AGENTS.md` را به فضای کاری عامل OpenClaw وارد می‌کند.
- `memories/MEMORY.md` و `memories/USER.md` را به فایل‌های حافظه فضای کاری اضافه می‌کند.
- پیش‌فرض‌های پیکربندی حافظه برای حافظه فایلی OpenClaw، به‌علاوه موارد بایگانی یا بازبینی دستی برای ارائه‌دهندگان حافظه خارجی مانند Honcho.
- Skillهایی که شامل فایل `SKILL.md` زیر `skills/<name>/` هستند.
- مقدارهای پیکربندی مخصوص هر skill از `skills.config`.
- کلیدهای API پشتیبانی‌شده از `.env`، فقط با `--include-secrets`.

### کلیدهای پشتیبانی‌شده `.env`

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### وضعیت فقط بایگانی

وضعیت Hermes که OpenClaw نمی‌تواند با ایمنی تفسیر کند، برای بازبینی دستی در گزارش مهاجرت کپی می‌شود، اما در پیکربندی یا اعتبارنامه‌های زنده OpenClaw بارگذاری نمی‌شود. این کار وضعیت مبهم یا ناامن را بدون وانمود کردن به اینکه OpenClaw می‌تواند آن را به‌طور خودکار اجرا کند یا به آن اعتماد کند، حفظ می‌کند:

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

منابع مهاجرت، Plugin هستند. یک Plugin شناسه‌های ارائه‌دهنده خود را در `openclaw.plugin.json` اعلام می‌کند:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

در زمان اجرا، Plugin تابع `api.registerMigrationProvider(...)` را فراخوانی می‌کند. ارائه‌دهنده `detect`، `plan`، و `apply` را پیاده‌سازی می‌کند. هسته مالک هماهنگ‌سازی CLI، سیاست پشتیبان‌گیری، promptها، خروجی JSON، و پیش‌پرواز تعارض است. هسته طرح بررسی‌شده را به `apply(ctx, plan)` پاس می‌دهد، و ارائه‌دهندگان فقط وقتی آن آرگومان برای سازگاری وجود ندارد، می‌توانند طرح را دوباره بسازند.

Pluginهای ارائه‌دهنده می‌توانند از `openclaw/plugin-sdk/migration` برای ساخت مورد و شمارش‌های خلاصه، به‌علاوه از `openclaw/plugin-sdk/migration-runtime` برای کپی فایل‌های آگاه از تعارض، کپی‌های گزارش فقط بایگانی، wrapperهای کش‌شده config-runtime، و گزارش‌های مهاجرت استفاده کنند.

## یکپارچه‌سازی onboarding

وقتی یک ارائه‌دهنده مبدأ شناخته‌شده‌ای را تشخیص دهد، onboarding می‌تواند مهاجرت را پیشنهاد کند. هر دو `openclaw onboard --flow import` و `openclaw setup --wizard --import-from hermes` از همان ارائه‌دهنده مهاجرت Plugin استفاده می‌کنند و همچنان پیش از اعمال، پیش‌نمایش نشان می‌دهند.

<Note>
وارد کردن داده‌های راه‌اندازی اولیه به یک نصب تازه OpenClaw نیاز دارد. اگر از قبل وضعیت محلی دارید، ابتدا پیکربندی، اعتبارنامه‌ها، نشست‌ها و فضای کاری را بازنشانی کنید. واردسازی‌های پشتیبان‌گیری همراه با بازنویسی یا ادغام برای نصب‌های موجود پشت feature gate هستند.
</Note>

## مرتبط

- [مهاجرت از Hermes](/fa/install/migrating-hermes): راهنمای گام‌به‌گام کاربرمحور.
- [مهاجرت از Claude](/fa/install/migrating-claude): راهنمای گام‌به‌گام کاربرمحور.
- [مهاجرت](/fa/install/migrating): انتقال OpenClaw به یک دستگاه جدید.
- [Doctor](/fa/gateway/doctor): بررسی سلامت پس از اعمال مهاجرت.
- [Plugins](/fa/tools/plugin): نصب و ثبت Plugin.
