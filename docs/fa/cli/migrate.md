---
read_when:
    - می‌خواهید از Hermes یا سامانهٔ عامل دیگری به OpenClaw مهاجرت کنید
    - شما در حال افزودن یک ارائه‌دهندهٔ مهاجرت متعلق به Plugin هستید
summary: مرجع CLI برای `openclaw migrate` (وارد کردن وضعیت از یک سامانهٔ عامل دیگر)
title: مهاجرت
x-i18n:
    generated_at: "2026-05-06T09:07:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021d673f6e51f5c2320278f0a37830c9aa34cdb4628932be1c09714c375066e3
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

وضعیت را از یک سامانه عامل دیگر از طریق ارائه‌دهنده مهاجرت متعلق به Plugin وارد کنید. ارائه‌دهنده‌های همراه، وضعیت Codex CLI، [Claude](/fa/install/migrating-claude)، و [Hermes](/fa/install/migrating-hermes) را پوشش می‌دهند؛ Pluginهای شخص ثالث می‌توانند ارائه‌دهنده‌های بیشتری ثبت کنند.

<Tip>
برای راهنماهای کاربرمحور، [مهاجرت از Claude](/fa/install/migrating-claude) و [مهاجرت از Hermes](/fa/install/migrating-hermes) را ببینید. [مرکز مهاجرت](/fa/install/migrating) همه مسیرها را فهرست می‌کند.
</Tip>

## فرمان‌ها

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  نام یک ارائه‌دهنده مهاجرت ثبت‌شده، برای مثال `hermes`. برای دیدن ارائه‌دهنده‌های نصب‌شده `openclaw migrate list` را اجرا کنید.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  طرح را بسازید و بدون تغییر دادن وضعیت خارج شوید.
</ParamField>
<ParamField path="--from <path>" type="string">
  پوشه وضعیت مبدا را بازنویسی کنید. مقدار پیش‌فرض Hermes برابر `~/.hermes` است.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  اعتبارنامه‌های پشتیبانی‌شده را وارد کنید. به‌طور پیش‌فرض خاموش است.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  وقتی طرح تعارض گزارش می‌کند، به اعمال اجازه دهید هدف‌های موجود را جایگزین کند.
</ParamField>
<ParamField path="--yes" type="boolean">
  اعلان تایید را رد کنید. در حالت غیرتعاملی الزامی است.
</ParamField>
<ParamField path="--skill <name>" type="string">
  یک مورد کپی مهارت را با نام مهارت یا شناسه مورد انتخاب کنید. برای مهاجرت چند مهارت، این پرچم را تکرار کنید. وقتی حذف شود، مهاجرت‌های تعاملی Codex یک انتخابگر کادر انتخاب نشان می‌دهند و مهاجرت‌های غیرتعاملی همه مهارت‌های برنامه‌ریزی‌شده را نگه می‌دارند.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  پشتیبان پیش از اعمال را رد کنید. وقتی وضعیت محلی OpenClaw وجود دارد، به `--force` نیاز دارد.
</ParamField>
<ParamField path="--force" type="boolean">
  وقتی اعمال در غیر این صورت از رد کردن پشتیبان خودداری می‌کند، همراه با `--no-backup` الزامی است.
</ParamField>
<ParamField path="--json" type="boolean">
  طرح یا نتیجه اعمال را به‌صورت JSON چاپ کنید. با `--json` و بدون `--yes`، اعمال طرح را چاپ می‌کند و وضعیت را تغییر نمی‌دهد.
</ParamField>

## مدل ایمنی

`openclaw migrate` ابتدا پیش‌نمایش می‌دهد.

<AccordionGroup>
  <Accordion title="پیش‌نمایش پیش از اعمال">
    ارائه‌دهنده پیش از هر تغییری یک طرح موردبه‌مورد برمی‌گرداند، شامل تعارض‌ها، موارد ردشده، و موارد حساس. طرح‌های JSON، خروجی اعمال، و گزارش‌های مهاجرت کلیدهای تودرتوی شبیه راز مانند کلیدهای API، توکن‌ها، سرآیندهای مجوزدهی، کوکی‌ها، و گذرواژه‌ها را پنهان می‌کنند.

    `openclaw migrate apply <provider>` طرح را پیش‌نمایش می‌کند و پیش از تغییر دادن وضعیت، اعلان می‌دهد مگر اینکه `--yes` تنظیم شده باشد. در حالت غیرتعاملی، اعمال به `--yes` نیاز دارد.

  </Accordion>
  <Accordion title="پشتیبان‌ها">
    اعمال پیش از اعمال مهاجرت، یک پشتیبان OpenClaw ایجاد و راستی‌آزمایی می‌کند. اگر هنوز هیچ وضعیت محلی OpenClaw وجود نداشته باشد، مرحله پشتیبان رد می‌شود و مهاجرت می‌تواند ادامه یابد. برای رد کردن پشتیبان وقتی وضعیت وجود دارد، هر دو `--no-backup` و `--force` را پاس دهید.
  </Accordion>
  <Accordion title="تعارض‌ها">
    اعمال وقتی طرح تعارض دارد از ادامه دادن خودداری می‌کند. طرح را بازبینی کنید، سپس اگر جایگزینی هدف‌های موجود عمدی است، با `--overwrite` دوباره اجرا کنید. ارائه‌دهنده‌ها ممکن است همچنان پشتیبان‌های سطح مورد برای فایل‌های بازنویسی‌شده را در پوشه گزارش مهاجرت بنویسند.
  </Accordion>
  <Accordion title="رازها">
    رازها هرگز به‌طور پیش‌فرض وارد نمی‌شوند. برای وارد کردن اعتبارنامه‌های پشتیبانی‌شده از `--include-secrets` استفاده کنید.
  </Accordion>
</AccordionGroup>

## ارائه‌دهنده Claude

ارائه‌دهنده همراه Claude به‌طور پیش‌فرض وضعیت Claude Code را در `~/.claude` تشخیص می‌دهد. برای وارد کردن یک خانه Claude Code یا ریشه پروژه مشخص از `--from <path>` استفاده کنید.

<Tip>
برای یک راهنمای کاربرمحور، [مهاجرت از Claude](/fa/install/migrating-claude) را ببینید.
</Tip>

### Claude چه چیزهایی وارد می‌کند

- `CLAUDE.md` پروژه و `.claude/CLAUDE.md` به فضای کاری عامل OpenClaw.
- `~/.claude/CLAUDE.md` کاربر که به `USER.md` فضای کاری افزوده می‌شود.
- تعریف‌های سرور MCP از `.mcp.json` پروژه، `~/.claude.json` متعلق به Claude Code، و `claude_desktop_config.json` متعلق به Claude Desktop.
- پوشه‌های مهارت Claude که شامل `SKILL.md` هستند.
- فایل‌های Markdown فرمان Claude که فقط با فراخوانی دستی به مهارت‌های OpenClaw تبدیل می‌شوند.

### وضعیت بایگانی و بازبینی دستی

قلاب‌ها، مجوزها، پیش‌فرض‌های محیط، حافظه محلی، قوانین محدود به مسیر، زیردستیارها، کش‌ها، طرح‌ها، و تاریخچه پروژه Claude در گزارش مهاجرت حفظ می‌شوند یا به‌عنوان موارد نیازمند بازبینی دستی گزارش می‌شوند. OpenClaw قلاب‌ها را اجرا نمی‌کند، فهرست‌های مجاز گسترده را کپی نمی‌کند، و وضعیت اعتبارنامه OAuth/Desktop را به‌طور خودکار وارد نمی‌کند.

## ارائه‌دهنده Codex

ارائه‌دهنده همراه Codex به‌طور پیش‌فرض وضعیت Codex CLI را در `~/.codex` تشخیص می‌دهد، یا وقتی متغیر محیطی `CODEX_HOME` تنظیم شده باشد در `CODEX_HOME`. برای فهرست‌برداری از یک خانه Codex مشخص از `--from <path>` استفاده کنید.

وقتی به مهار Codex در OpenClaw منتقل می‌شوید و می‌خواهید دارایی‌های شخصی مفید Codex CLI را آگاهانه ارتقا دهید، از این ارائه‌دهنده استفاده کنید. اجراهای محلی کارساز برنامه Codex از پوشه‌های `CODEX_HOME` و `HOME` مختص هر عامل استفاده می‌کنند، بنابراین به‌طور پیش‌فرض وضعیت شخصی Codex CLI شما را نمی‌خوانند.

اجرای `openclaw migrate codex` در یک پایانه تعاملی، طرح کامل را پیش‌نمایش می‌کند، سپس پیش از تایید نهایی اعمال، یک انتخابگر کادر انتخاب برای موارد کپی مهارت باز می‌کند. برای انتخاب گروهی از `Toggle all on` یا `Toggle all off` استفاده کنید؛ مهارت‌های برنامه‌ریزی‌شده به‌صورت انتخاب‌شده شروع می‌شوند، مهارت‌های دارای تعارض به‌صورت انتخاب‌نشده شروع می‌شوند، و `Skip for now` مهارت‌ها را بدون اعمال، بدون تغییر باقی می‌گذارد. برای اجراهای اسکریپتی یا دقیق، برای هر مهارت یک بار `--skill <name>` را پاس دهید، برای مثال:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### Codex چه چیزهایی وارد می‌کند

- پوشه‌های مهارت Codex CLI زیر `$CODEX_HOME/skills`، به‌جز کش `.system` متعلق به Codex.
- AgentSkills شخصی زیر `$HOME/.agents/skills`، که وقتی مالکیت مختص هر عامل را می‌خواهید، به فضای کاری عامل فعلی OpenClaw کپی می‌شود.

### وضعیت Codex نیازمند بازبینی دستی

Pluginهای بومی Codex، `config.toml`، و `hooks/hooks.json` بومی به‌طور خودکار فعال نمی‌شوند. Pluginها ممکن است سرورهای MCP، برنامه‌ها، قلاب‌ها، یا رفتار اجرایی دیگری را در معرض قرار دهند، بنابراین ارائه‌دهنده آن‌ها را به‌جای بارگذاری در OpenClaw برای بازبینی گزارش می‌کند. فایل‌های پیکربندی و قلاب برای بازبینی دستی در گزارش مهاجرت کپی می‌شوند.

## ارائه‌دهنده Hermes

ارائه‌دهنده همراه Hermes به‌طور پیش‌فرض وضعیت را در `~/.hermes` تشخیص می‌دهد. وقتی Hermes جای دیگری قرار دارد، از `--from <path>` استفاده کنید.

### Hermes چه چیزهایی وارد می‌کند

- پیکربندی مدل پیش‌فرض از `config.yaml`.
- ارائه‌دهنده‌های مدل پیکربندی‌شده و نقاط پایانی سفارشی سازگار با OpenAI از `providers` و `custom_providers`.
- تعریف‌های سرور MCP از `mcp_servers` یا `mcp.servers`.
- `SOUL.md` و `AGENTS.md` به فضای کاری عامل OpenClaw.
- `memories/MEMORY.md` و `memories/USER.md` که به فایل‌های حافظه فضای کاری افزوده می‌شوند.
- پیش‌فرض‌های پیکربندی حافظه برای حافظه فایلی OpenClaw، به‌علاوه موارد بایگانی یا بازبینی دستی برای ارائه‌دهنده‌های حافظه خارجی مانند Honcho.
- Skills که شامل فایل `SKILL.md` زیر `skills/<name>/` هستند.
- مقدارهای پیکربندی مختص هر مهارت از `skills.config`.
- کلیدهای API پشتیبانی‌شده از `.env`، فقط با `--include-secrets`.

### کلیدهای `.env` پشتیبانی‌شده

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### وضعیت فقط بایگانی

وضعیت Hermes که OpenClaw نمی‌تواند با اطمینان تفسیر کند برای بازبینی دستی در گزارش مهاجرت کپی می‌شود، اما در پیکربندی زنده یا اعتبارنامه‌های OpenClaw بارگذاری نمی‌شود. این کار وضعیت مبهم یا ناامن را بدون وانمود کردن به اینکه OpenClaw می‌تواند آن را به‌طور خودکار اجرا کند یا به آن اعتماد کند حفظ می‌کند:

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

منابع مهاجرت Pluginها هستند. یک Plugin شناسه‌های ارائه‌دهنده خود را در `openclaw.plugin.json` اعلام می‌کند:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

در زمان اجرا، Plugin تابع `api.registerMigrationProvider(...)` را فراخوانی می‌کند. ارائه‌دهنده `detect`، `plan`، و `apply` را پیاده‌سازی می‌کند. هسته مالک هماهنگ‌سازی CLI، سیاست پشتیبان، اعلان‌ها، خروجی JSON، و پیش‌پرواز تعارض است. هسته طرح بازبینی‌شده را به `apply(ctx, plan)` پاس می‌دهد، و ارائه‌دهنده‌ها فقط وقتی آن آرگومان برای سازگاری غایب باشد ممکن است طرح را دوباره بسازند.

Pluginهای ارائه‌دهنده می‌توانند از `openclaw/plugin-sdk/migration` برای ساخت موردها و شمارش‌های خلاصه استفاده کنند، به‌علاوه از `openclaw/plugin-sdk/migration-runtime` برای کپی‌های فایل آگاه از تعارض، کپی‌های گزارش فقط بایگانی، پوشش‌دهنده‌های کش‌شده config-runtime، و گزارش‌های مهاجرت.

## یکپارچه‌سازی راه‌اندازی اولیه

وقتی یک ارائه‌دهنده منبع شناخته‌شده‌ای را تشخیص می‌دهد، راه‌اندازی اولیه می‌تواند مهاجرت را پیشنهاد دهد. هر دو `openclaw onboard --flow import` و `openclaw setup --wizard --import-from hermes` از همان ارائه‌دهنده مهاجرت Plugin استفاده می‌کنند و همچنان پیش از اعمال، پیش‌نمایش نشان می‌دهند.

<Note>
وارد کردن در راه‌اندازی اولیه به یک نصب تازه OpenClaw نیاز دارد. اگر از قبل وضعیت محلی دارید، ابتدا پیکربندی، اعتبارنامه‌ها، نشست‌ها، و فضای کاری را بازنشانی کنید. وارد کردن با پشتیبان‌به‌علاوه بازنویسی یا ادغام برای نصب‌های موجود پشت دروازه قابلیت قرار دارد.
</Note>

## مرتبط

- [مهاجرت از Hermes](/fa/install/migrating-hermes): راهنمای کاربرمحور.
- [مهاجرت از Claude](/fa/install/migrating-claude): راهنمای کاربرمحور.
- [مهاجرت](/fa/install/migrating): انتقال OpenClaw به یک دستگاه جدید.
- [Doctor](/fa/gateway/doctor): بررسی سلامت پس از اعمال یک مهاجرت.
- [Pluginها](/fa/tools/plugin): نصب و ثبت Plugin.
