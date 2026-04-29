---
read_when:
    - می‌خواهید از Hermes یا یک سامانهٔ عامل دیگر به OpenClaw مهاجرت کنید
    - شما در حال افزودن یک ارائه‌دهندهٔ مهاجرت متعلق به Plugin هستید
summary: مرجع CLI برای `openclaw migrate` (وارد کردن وضعیت از سامانهٔ عامل دیگر)
title: مهاجرت
x-i18n:
    generated_at: "2026-04-29T22:37:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3db14c16b8f9dcbf86a4f12558cf4e8555aa9a255637034fb804148996a225e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

وضعیت را از یک سامانه عامل دیگر از طریق یک ارائه‌دهنده مهاجرت متعلق به Plugin وارد کنید. ارائه‌دهنده‌های همراه، [Claude](/fa/install/migrating-claude) و [Hermes](/fa/install/migrating-hermes) را پوشش می‌دهند؛ Pluginهای شخص ثالث می‌توانند ارائه‌دهنده‌های بیشتری ثبت کنند.

<Tip>
برای راهنماهای گام‌به‌گام کاربرمحور، [مهاجرت از Claude](/fa/install/migrating-claude) و [مهاجرت از Hermes](/fa/install/migrating-hermes) را ببینید. [مرکز مهاجرت](/fa/install/migrating) همه مسیرها را فهرست می‌کند.
</Tip>

## فرمان‌ها

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
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
  طرح را بسازید و بدون تغییر وضعیت خارج شوید.
</ParamField>
<ParamField path="--from <path>" type="string">
  مسیر پوشه وضعیت مبدأ را بازنویسی کنید. Hermes به‌طور پیش‌فرض از `~/.hermes` استفاده می‌کند.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  اعتبارنامه‌های پشتیبانی‌شده را وارد کنید. به‌طور پیش‌فرض خاموش است.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  وقتی طرح تداخل گزارش می‌کند، اجازه دهید اعمال کردن، مقصدهای موجود را جایگزین کند.
</ParamField>
<ParamField path="--yes" type="boolean">
  اعلان تأیید را رد کنید. در حالت غیرتعاملی الزامی است.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  پشتیبان‌گیری پیش از اعمال را رد کنید. وقتی وضعیت محلی OpenClaw وجود دارد، به `--force` نیاز دارد.
</ParamField>
<ParamField path="--force" type="boolean">
  وقتی اعمال کردن در حالت عادی از رد کردن پشتیبان‌گیری امتناع می‌کند، همراه با `--no-backup` الزامی است.
</ParamField>
<ParamField path="--json" type="boolean">
  طرح یا نتیجه اعمال را به‌صورت JSON چاپ کنید. با `--json` و بدون `--yes`، اعمال کردن طرح را چاپ می‌کند و وضعیت را تغییر نمی‌دهد.
</ParamField>

## مدل ایمنی

`openclaw migrate` ابتدا پیش‌نمایش می‌دهد.

<AccordionGroup>
  <Accordion title="پیش‌نمایش پیش از اعمال">
    ارائه‌دهنده پیش از هر تغییری، یک طرح موردبه‌مورد برمی‌گرداند که شامل تداخل‌ها، موارد ردشده و موارد حساس است. طرح‌های JSON، خروجی اعمال، و گزارش‌های مهاجرت، کلیدهای تودرتویی را که شبیه محرمانه‌ها هستند، مانند کلیدهای API، توکن‌ها، سرآیندهای مجوزدهی، کوکی‌ها و گذرواژه‌ها، پنهان‌سازی می‌کنند.

    `openclaw migrate apply <provider>` طرح را پیش‌نمایش می‌کند و پیش از تغییر وضعیت، اعلان می‌دهد مگر اینکه `--yes` تنظیم شده باشد. در حالت غیرتعاملی، اعمال کردن به `--yes` نیاز دارد.

  </Accordion>
  <Accordion title="پشتیبان‌ها">
    اعمال کردن پیش از اعمال مهاجرت، یک پشتیبان OpenClaw می‌سازد و آن را راستی‌آزمایی می‌کند. اگر هنوز هیچ وضعیت محلی OpenClaw وجود نداشته باشد، مرحله پشتیبان‌گیری رد می‌شود و مهاجرت می‌تواند ادامه پیدا کند. برای رد کردن پشتیبان‌گیری وقتی وضعیت وجود دارد، هم `--no-backup` و هم `--force` را پاس دهید.
  </Accordion>
  <Accordion title="تداخل‌ها">
    وقتی طرح تداخل داشته باشد، اعمال کردن از ادامه امتناع می‌کند. طرح را بازبینی کنید، سپس اگر جایگزینی مقصدهای موجود عمدی است، با `--overwrite` دوباره اجرا کنید. ارائه‌دهنده‌ها ممکن است همچنان برای فایل‌های بازنویسی‌شده در پوشه گزارش مهاجرت، پشتیبان‌های سطح مورد بنویسند.
  </Accordion>
  <Accordion title="محرمانه‌ها">
    محرمانه‌ها هرگز به‌طور پیش‌فرض وارد نمی‌شوند. برای وارد کردن اعتبارنامه‌های پشتیبانی‌شده از `--include-secrets` استفاده کنید.
  </Accordion>
</AccordionGroup>

## ارائه‌دهنده Claude

ارائه‌دهنده همراه Claude به‌طور پیش‌فرض وضعیت Claude Code را در `~/.claude` تشخیص می‌دهد. برای وارد کردن یک خانه Claude Code یا ریشه پروژه مشخص، از `--from <path>` استفاده کنید.

<Tip>
برای یک راهنمای گام‌به‌گام کاربرمحور، [مهاجرت از Claude](/fa/install/migrating-claude) را ببینید.
</Tip>

### Claude چه چیزهایی را وارد می‌کند

- `CLAUDE.md` پروژه و `.claude/CLAUDE.md` به فضای کاری عامل OpenClaw.
- `~/.claude/CLAUDE.md` کاربر که به `USER.md` فضای کاری افزوده می‌شود.
- تعریف‌های سرور MCP از `.mcp.json` پروژه، `~/.claude.json` در Claude Code، و `claude_desktop_config.json` در Claude Desktop.
- پوشه‌های مهارت Claude که شامل `SKILL.md` هستند.
- فایل‌های Markdown فرمان Claude که به Skills در OpenClaw با فراخوانی فقط دستی تبدیل می‌شوند.

### وضعیت بایگانی و نیازمند بازبینی دستی

قلاب‌های Claude، مجوزها، پیش‌فرض‌های محیط، حافظه محلی، قواعد محدود به مسیر، زیربرنامه‌های عامل، کش‌ها، طرح‌ها و تاریخچه پروژه در گزارش مهاجرت حفظ می‌شوند یا به‌عنوان موارد نیازمند بازبینی دستی گزارش می‌شوند. OpenClaw قلاب‌ها را اجرا نمی‌کند، فهرست‌های مجاز گسترده را کپی نمی‌کند، یا وضعیت اعتبارنامه OAuth/Desktop را به‌طور خودکار وارد نمی‌کند.

## ارائه‌دهنده Hermes

ارائه‌دهنده همراه Hermes به‌طور پیش‌فرض وضعیت را در `~/.hermes` تشخیص می‌دهد. وقتی Hermes جای دیگری قرار دارد، از `--from <path>` استفاده کنید.

### Hermes چه چیزهایی را وارد می‌کند

- پیکربندی مدل پیش‌فرض از `config.yaml`.
- ارائه‌دهنده‌های مدل پیکربندی‌شده و endpointهای سفارشی سازگار با OpenAI از `providers` و `custom_providers`.
- تعریف‌های سرور MCP از `mcp_servers` یا `mcp.servers`.
- `SOUL.md` و `AGENTS.md` به فضای کاری عامل OpenClaw.
- `memories/MEMORY.md` و `memories/USER.md` که به فایل‌های حافظه فضای کاری افزوده می‌شوند.
- پیش‌فرض‌های پیکربندی حافظه برای حافظه فایلی OpenClaw، به‌علاوه موارد بایگانی یا نیازمند بازبینی دستی برای ارائه‌دهنده‌های حافظه خارجی مانند Honcho.
- Skills که شامل یک فایل `SKILL.md` زیر `skills/<name>/` هستند.
- مقدارهای پیکربندی مخصوص هر مهارت از `skills.config`.
- کلیدهای API پشتیبانی‌شده از `.env`، فقط با `--include-secrets`.

### کلیدهای `.env` پشتیبانی‌شده

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### وضعیت فقط بایگانی

وضعیت Hermes که OpenClaw نمی‌تواند با اطمینان تفسیر کند، برای بازبینی دستی در گزارش مهاجرت کپی می‌شود، اما در پیکربندی یا اعتبارنامه‌های زنده OpenClaw بارگذاری نمی‌شود. این کار وضعیت مبهم یا ناامن را بدون وانمود کردن اینکه OpenClaw می‌تواند آن را به‌طور خودکار اجرا کند یا به آن اعتماد کند، حفظ می‌کند:

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

منابع مهاجرت Plugin هستند. یک Plugin شناسه‌های ارائه‌دهنده خود را در `openclaw.plugin.json` اعلام می‌کند:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

در زمان اجرا، Plugin متد `api.registerMigrationProvider(...)` را فراخوانی می‌کند. ارائه‌دهنده `detect`، `plan` و `apply` را پیاده‌سازی می‌کند. Core هماهنگ‌سازی CLI، خط‌مشی پشتیبان‌گیری، اعلان‌ها، خروجی JSON، و پیش‌بررسی تداخل را بر عهده دارد. Core طرح بازبینی‌شده را به `apply(ctx, plan)` پاس می‌دهد، و ارائه‌دهنده‌ها فقط وقتی آن آرگومان برای سازگاری وجود نداشته باشد، می‌توانند طرح را دوباره بسازند.

Pluginهای ارائه‌دهنده می‌توانند از `openclaw/plugin-sdk/migration` برای ساخت موردها و شمارش‌های خلاصه، و همچنین از `openclaw/plugin-sdk/migration-runtime` برای کپی‌های فایلی آگاه از تداخل، کپی‌های گزارشی فقط بایگانی، پوشش‌دهنده‌های کش‌شده config-runtime، و گزارش‌های مهاجرت استفاده کنند.

## یکپارچه‌سازی Onboarding

وقتی یک ارائه‌دهنده یک مبدأ شناخته‌شده را تشخیص می‌دهد، Onboarding می‌تواند مهاجرت را پیشنهاد دهد. هم `openclaw onboard --flow import` و هم `openclaw setup --wizard --import-from hermes` از همان ارائه‌دهنده مهاجرت Plugin استفاده می‌کنند و همچنان پیش از اعمال، پیش‌نمایش نشان می‌دهند.

<Note>
واردسازی‌های Onboarding به یک راه‌اندازی تازه OpenClaw نیاز دارند. اگر از قبل وضعیت محلی دارید، ابتدا پیکربندی، اعتبارنامه‌ها، نشست‌ها و فضای کاری را بازنشانی کنید. واردسازی‌های پشتیبان‌به‌همراه‌بازنویسی یا ادغام برای راه‌اندازی‌های موجود پشت feature gate هستند.
</Note>

## مرتبط

- [مهاجرت از Hermes](/fa/install/migrating-hermes): راهنمای گام‌به‌گام کاربرمحور.
- [مهاجرت از Claude](/fa/install/migrating-claude): راهنمای گام‌به‌گام کاربرمحور.
- [مهاجرت](/fa/install/migrating): انتقال OpenClaw به یک ماشین جدید.
- [Doctor](/fa/gateway/doctor): بررسی سلامت پس از اعمال یک مهاجرت.
- [Plugins](/fa/tools/plugin): نصب و ثبت Plugin.
