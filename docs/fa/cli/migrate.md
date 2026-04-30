---
read_when:
    - می‌خواهید از Hermes یا سامانهٔ عامل دیگری به OpenClaw مهاجرت کنید
    - شما در حال افزودن یک ارائه‌دهندهٔ مهاجرت متعلق به Plugin هستید
summary: مرجع CLI برای `openclaw migrate` (وارد کردن وضعیت از یک سیستم عامل دیگر)
title: مهاجرت
x-i18n:
    generated_at: "2026-04-30T20:05:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffcd9e874bdaa0a5195e712d4fccd7b3d53034cb362c7f7462e9c7df72477b1a
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

وضعیت را از یک سامانه عامل دیگر از طریق یک ارائه‌دهنده مهاجرت متعلق به Plugin وارد کنید. ارائه‌دهنده‌های همراه، وضعیت Codex CLI، [Claude](/fa/install/migrating-claude)، و [Hermes](/fa/install/migrating-hermes) را پوشش می‌دهند؛ Pluginهای شخص ثالث می‌توانند ارائه‌دهنده‌های بیشتری ثبت کنند.

<Tip>
برای راهنماهای گام‌به‌گام کاربرمحور، [مهاجرت از Claude](/fa/install/migrating-claude) و [مهاجرت از Hermes](/fa/install/migrating-hermes) را ببینید. [مرکز مهاجرت](/fa/install/migrating) همه مسیرها را فهرست می‌کند.
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
  نام یک ارائه‌دهنده مهاجرت ثبت‌شده، برای مثال `hermes`. برای دیدن ارائه‌دهنده‌های نصب‌شده، `openclaw migrate list` را اجرا کنید.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  برنامه را بسازید و بدون تغییر وضعیت خارج شوید.
</ParamField>
<ParamField path="--from <path>" type="string">
  دایرکتوری وضعیت مبدأ را بازنویسی کنید. مقدار پیش‌فرض Hermes برابر `~/.hermes` است.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  اعتبارنامه‌های پشتیبانی‌شده را وارد کنید. به‌طور پیش‌فرض غیرفعال است.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  به apply اجازه دهید وقتی برنامه تعارض گزارش می‌کند، اهداف موجود را جایگزین کند.
</ParamField>
<ParamField path="--yes" type="boolean">
  اعلان تأیید را رد کنید. در حالت غیرتعاملی الزامی است.
</ParamField>
<ParamField path="--skill <name>" type="string">
  یک مورد کپی skill را بر اساس نام skill یا شناسه مورد انتخاب کنید. برای مهاجرت چند skill، این پرچم را تکرار کنید. وقتی حذف شود، مهاجرت‌های تعاملی Codex یک انتخابگر چک‌باکسی نشان می‌دهند و مهاجرت‌های غیرتعاملی همه skillهای برنامه‌ریزی‌شده را نگه می‌دارند.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  پشتیبان پیش از apply را رد کنید. وقتی وضعیت محلی OpenClaw وجود دارد، به `--force` نیاز دارد.
</ParamField>
<ParamField path="--force" type="boolean">
  در کنار `--no-backup` لازم است وقتی apply در غیر این صورت از رد کردن پشتیبان خودداری می‌کند.
</ParamField>
<ParamField path="--json" type="boolean">
  برنامه یا نتیجه apply را به‌صورت JSON چاپ کنید. با `--json` و بدون `--yes`، apply برنامه را چاپ می‌کند و وضعیت را تغییر نمی‌دهد.
</ParamField>

## مدل ایمنی

`openclaw migrate` ابتدا پیش‌نمایش می‌دهد.

<AccordionGroup>
  <Accordion title="پیش‌نمایش پیش از apply">
    ارائه‌دهنده پیش از هر تغییری یک برنامه موردبه‌مورد برمی‌گرداند، شامل تعارض‌ها، موارد ردشده، و موارد حساس. برنامه‌های JSON، خروجی apply، و گزارش‌های مهاجرت، کلیدهای تو در توی شبیه محرمانه‌ها مانند کلیدهای API، توکن‌ها، سرآیندهای authorization، کوکی‌ها، و گذرواژه‌ها را پوشانده می‌کنند.

    `openclaw migrate apply <provider>` برنامه را پیش‌نمایش می‌کند و پیش از تغییر وضعیت، مگر اینکه `--yes` تنظیم شده باشد، درخواست تأیید می‌دهد. در حالت غیرتعاملی، apply به `--yes` نیاز دارد.

  </Accordion>
  <Accordion title="پشتیبان‌ها">
    apply پیش از اعمال مهاجرت، یک پشتیبان OpenClaw ایجاد و تأیید می‌کند. اگر هنوز هیچ وضعیت محلی OpenClaw وجود نداشته باشد، مرحله پشتیبان رد می‌شود و مهاجرت می‌تواند ادامه پیدا کند. برای رد کردن پشتیبان وقتی وضعیت وجود دارد، هر دو `--no-backup` و `--force` را ارسال کنید.
  </Accordion>
  <Accordion title="تعارض‌ها">
    وقتی برنامه تعارض دارد، apply از ادامه خودداری می‌کند. برنامه را بازبینی کنید، سپس اگر جایگزینی اهداف موجود عمدی است، با `--overwrite` دوباره اجرا کنید. ارائه‌دهنده‌ها همچنان ممکن است برای فایل‌های بازنویسی‌شده، پشتیبان‌های سطح مورد را در دایرکتوری گزارش مهاجرت بنویسند.
  </Accordion>
  <Accordion title="محرمانه‌ها">
    محرمانه‌ها هرگز به‌طور پیش‌فرض وارد نمی‌شوند. برای وارد کردن اعتبارنامه‌های پشتیبانی‌شده، از `--include-secrets` استفاده کنید.
  </Accordion>
</AccordionGroup>

## ارائه‌دهنده Claude

ارائه‌دهنده همراه Claude به‌طور پیش‌فرض وضعیت Claude Code را در `~/.claude` شناسایی می‌کند. برای وارد کردن یک خانه Claude Code یا ریشه پروژه مشخص، از `--from <path>` استفاده کنید.

<Tip>
برای یک راهنمای گام‌به‌گام کاربرمحور، [مهاجرت از Claude](/fa/install/migrating-claude) را ببینید.
</Tip>

### آنچه Claude وارد می‌کند

- پروژه `CLAUDE.md` و `.claude/CLAUDE.md` به فضای کاری عامل OpenClaw.
- کاربر `~/.claude/CLAUDE.md` که به `USER.md` فضای کاری افزوده می‌شود.
- تعریف‌های سرور MCP از پروژه `.mcp.json`، Claude Code `~/.claude.json`، و Claude Desktop `claude_desktop_config.json`.
- دایرکتوری‌های skill مربوط به Claude که شامل `SKILL.md` هستند.
- فایل‌های Markdown فرمان Claude که به skillهای OpenClaw با فراخوانی فقط دستی تبدیل می‌شوند.

### وضعیت بایگانی و بازبینی دستی

قلاب‌های Claude، مجوزها، پیش‌فرض‌های محیط، حافظه محلی، قواعد محدوده‌بندی‌شده بر اساس مسیر، subagentها، کش‌ها، برنامه‌ها، و تاریخچه پروژه در گزارش مهاجرت حفظ می‌شوند یا به‌عنوان موارد نیازمند بازبینی دستی گزارش می‌شوند. OpenClaw قلاب‌ها را اجرا نمی‌کند، allowlistهای گسترده را کپی نمی‌کند، یا وضعیت اعتبارنامه OAuth/Desktop را به‌طور خودکار وارد نمی‌کند.

## ارائه‌دهنده Codex

ارائه‌دهنده همراه Codex به‌طور پیش‌فرض وضعیت Codex CLI را در `~/.codex` شناسایی می‌کند، یا
وقتی متغیر محیطی `CODEX_HOME` تنظیم شده باشد، در `CODEX_HOME`. برای
فهرست‌برداری از یک خانه Codex مشخص، از `--from <path>` استفاده کنید.

وقتی به مهار Codex در OpenClaw منتقل می‌شوید و می‌خواهید
دارایی‌های شخصی مفید Codex CLI را آگاهانه ارتقا دهید، از این ارائه‌دهنده استفاده کنید. راه‌اندازی‌های محلی سرور برنامه Codex
از دایرکتوری‌های `CODEX_HOME` و `HOME` مخصوص هر عامل استفاده می‌کنند، بنابراین به‌طور پیش‌فرض وضعیت شخصی Codex CLI شما را نمی‌خوانند.

اجرای `openclaw migrate codex` در یک پایانه تعاملی، کل
برنامه را پیش‌نمایش می‌کند، سپس پیش از تأیید نهایی
apply، یک انتخابگر چک‌باکسی برای موارد کپی skill باز می‌کند. همه skillها در ابتدا انتخاب شده‌اند؛ هر skill را که نمی‌خواهید
در این عامل کپی شود از حالت انتخاب خارج کنید. برای اجراهای اسکریپتی یا دقیق، `--skill <name>` را یک بار
برای هر skill ارسال کنید، برای مثال:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### آنچه Codex وارد می‌کند

- دایرکتوری‌های skill مربوط به Codex CLI زیر `$CODEX_HOME/skills`، به‌جز کش
  `.system` متعلق به Codex.
- AgentSkillهای شخصی زیر `$HOME/.agents/skills`، که وقتی مالکیت مخصوص هر عامل را می‌خواهید، در فضای کاری عامل فعلی
  OpenClaw کپی می‌شوند.

### وضعیت Codex نیازمند بازبینی دستی

Pluginهای بومی Codex، `config.toml`، و `hooks/hooks.json` بومی
به‌طور خودکار فعال نمی‌شوند. Pluginها ممکن است سرورهای MCP، برنامه‌ها، قلاب‌ها، یا رفتار اجرایی دیگر را افشا کنند، بنابراین ارائه‌دهنده آن‌ها را به‌جای بارگذاری
در OpenClaw برای بازبینی گزارش می‌کند. فایل‌های پیکربندی و قلاب در گزارش مهاجرت
برای بازبینی دستی کپی می‌شوند.

## ارائه‌دهنده Hermes

ارائه‌دهنده همراه Hermes به‌طور پیش‌فرض وضعیت را در `~/.hermes` شناسایی می‌کند. وقتی Hermes جای دیگری قرار دارد، از `--from <path>` استفاده کنید.

### آنچه Hermes وارد می‌کند

- پیکربندی مدل پیش‌فرض از `config.yaml`.
- ارائه‌دهنده‌های مدل پیکربندی‌شده و نقاط پایانی سفارشی سازگار با OpenAI از `providers` و `custom_providers`.
- تعریف‌های سرور MCP از `mcp_servers` یا `mcp.servers`.
- `SOUL.md` و `AGENTS.md` به فضای کاری عامل OpenClaw.
- `memories/MEMORY.md` و `memories/USER.md` که به فایل‌های حافظه فضای کاری افزوده می‌شوند.
- پیش‌فرض‌های پیکربندی حافظه برای حافظه فایلی OpenClaw، به‌علاوه موارد بایگانی یا بازبینی دستی برای ارائه‌دهنده‌های حافظه خارجی مانند Honcho.
- Skills که شامل یک فایل `SKILL.md` زیر `skills/<name>/` هستند.
- مقدارهای پیکربندی مخصوص هر skill از `skills.config`.
- کلیدهای API پشتیبانی‌شده از `.env`، فقط با `--include-secrets`.

### کلیدهای `.env` پشتیبانی‌شده

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### وضعیت فقط بایگانی

وضعیت Hermes که OpenClaw نمی‌تواند با اطمینان تفسیر کند، برای بازبینی دستی در گزارش مهاجرت کپی می‌شود، اما در پیکربندی یا اعتبارنامه‌های زنده OpenClaw بارگذاری نمی‌شود. این کار وضعیت مبهم یا ناامن را بدون وانمود کردن به اینکه OpenClaw می‌تواند آن را به‌طور خودکار اجرا کند یا به آن اعتماد کند، حفظ می‌کند:

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

در زمان اجرا، Plugin تابع `api.registerMigrationProvider(...)` را فراخوانی می‌کند. ارائه‌دهنده `detect`، `plan`، و `apply` را پیاده‌سازی می‌کند. هسته مالک هماهنگ‌سازی CLI، سیاست پشتیبان، اعلان‌ها، خروجی JSON، و پیش‌پرواز تعارض است. هسته برنامه بازبینی‌شده را به `apply(ctx, plan)` پاس می‌دهد، و ارائه‌دهنده‌ها فقط وقتی آن آرگومان برای سازگاری وجود ندارد، می‌توانند برنامه را دوباره بسازند.

Pluginهای ارائه‌دهنده می‌توانند از `openclaw/plugin-sdk/migration` برای ساخت موردها و شمارش‌های خلاصه استفاده کنند، به‌علاوه از `openclaw/plugin-sdk/migration-runtime` برای کپی‌های فایل آگاه از تعارض، کپی‌های گزارش فقط بایگانی، پوشش‌دهنده‌های config-runtime کش‌شده، و گزارش‌های مهاجرت.

## یکپارچه‌سازی ورود اولیه

وقتی یک ارائه‌دهنده مبدأ شناخته‌شده‌ای را شناسایی کند، ورود اولیه می‌تواند مهاجرت را پیشنهاد کند. هم `openclaw onboard --flow import` و هم `openclaw setup --wizard --import-from hermes` از همان ارائه‌دهنده مهاجرت Plugin استفاده می‌کنند و همچنان پیش از اعمال، پیش‌نمایش نشان می‌دهند.

<Note>
واردسازی‌های ورود اولیه به یک راه‌اندازی تازه OpenClaw نیاز دارند. اگر از قبل وضعیت محلی دارید، ابتدا پیکربندی، اعتبارنامه‌ها، نشست‌ها، و فضای کاری را بازنشانی کنید. واردسازی‌های پشتیبان‌به‌علاوه-بازنویسی یا ادغام برای راه‌اندازی‌های موجود پشت feature gate قرار دارند.
</Note>

## مرتبط

- [مهاجرت از Hermes](/fa/install/migrating-hermes): راهنمای گام‌به‌گام کاربرمحور.
- [مهاجرت از Claude](/fa/install/migrating-claude): راهنمای گام‌به‌گام کاربرمحور.
- [مهاجرت](/fa/install/migrating): انتقال OpenClaw به یک دستگاه جدید.
- [Doctor](/fa/gateway/doctor): بررسی سلامت پس از اعمال مهاجرت.
- [Plugins](/fa/tools/plugin): نصب و ثبت Plugin.
