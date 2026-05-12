---
read_when:
    - می‌خواهید از Hermes یا یک سامانهٔ عامل دیگر به OpenClaw مهاجرت کنید
    - شما در حال افزودن یک ارائه‌دهندهٔ مهاجرت متعلق به Plugin هستید
summary: مرجع CLI برای `openclaw migrate` (وارد کردن وضعیت از یک سامانهٔ عامل دیگر)
title: مهاجرت
x-i18n:
    generated_at: "2026-05-12T00:59:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95d31d2995d426c7886700c9e0e6c6fa0c013a27c0bfe7cf91380c8029d6df89
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

وضعیت را از یک سامانه عامل دیگر از طریق ارائه‌دهنده مهاجرت متعلق به Plugin وارد کنید. ارائه‌دهنده‌های همراه، وضعیت Codex CLI، [Claude](/fa/install/migrating-claude)، و [Hermes](/fa/install/migrating-hermes) را پوشش می‌دهند؛ Pluginهای شخص ثالث می‌توانند ارائه‌دهنده‌های دیگری را ثبت کنند.

<Tip>
برای راهنماهای گام‌به‌گام کاربرمحور، [مهاجرت از Claude](/fa/install/migrating-claude) و [مهاجرت از Hermes](/fa/install/migrating-hermes) را ببینید. [مرکز مهاجرت](/fa/install/migrating) همه مسیرها را فهرست می‌کند.
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
  نام یک ارائه‌دهنده مهاجرت ثبت‌شده، برای نمونه `hermes`. برای دیدن ارائه‌دهنده‌های نصب‌شده، `openclaw migrate list` را اجرا کنید.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  برنامه را بسازید و بدون تغییر وضعیت خارج شوید.
</ParamField>
<ParamField path="--from <path>" type="string">
  پوشه وضعیت مبدا را بازنویسی کنید. Hermes به‌طور پیش‌فرض از `~/.hermes` استفاده می‌کند.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  اعتبارنامه‌های پشتیبانی‌شده را وارد کنید. به‌طور پیش‌فرض خاموش است.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  وقتی برنامه تداخل گزارش می‌کند، اجازه دهید اعمال، مقصدهای موجود را جایگزین کند.
</ParamField>
<ParamField path="--yes" type="boolean">
  درخواست تایید را رد کنید. در حالت غیرتعاملی الزامی است.
</ParamField>
<ParamField path="--skill <name>" type="string">
  یک مورد کپی مهارت را بر پایه نام مهارت یا شناسه مورد انتخاب کنید. برای مهاجرت چند مهارت، این فلگ را تکرار کنید. وقتی حذف شود، مهاجرت‌های تعاملی Codex یک گزینشگر چک‌باکسی نشان می‌دهند و مهاجرت‌های غیرتعاملی همه مهارت‌های برنامه‌ریزی‌شده را نگه می‌دارند.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  یک مورد نصب Plugin مربوط به Codex را بر پایه نام Plugin یا شناسه مورد انتخاب کنید. برای مهاجرت چند Plugin مربوط به Codex، این فلگ را تکرار کنید. وقتی حذف شود، مهاجرت‌های تعاملی Codex یک گزینشگر چک‌باکسی Plugin بومی Codex نشان می‌دهند و مهاجرت‌های غیرتعاملی همه Pluginهای برنامه‌ریزی‌شده را نگه می‌دارند. این فقط برای Pluginهای Codex نصب‌شده از مبدا `openai-curated` اعمال می‌شود که توسط فهرست موجودی app-server مربوط به Codex کشف شده‌اند.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  پشتیبان‌گیری پیش از اعمال را رد کنید. وقتی وضعیت محلی OpenClaw وجود دارد، به `--force` نیاز دارد.
</ParamField>
<ParamField path="--force" type="boolean">
  وقتی اعمال در حالت عادی از رد کردن پشتیبان‌گیری خودداری می‌کند، همراه با `--no-backup` الزامی است.
</ParamField>
<ParamField path="--json" type="boolean">
  برنامه یا نتیجه اعمال را به‌صورت JSON چاپ کنید. با `--json` و بدون `--yes`، اعمال برنامه را چاپ می‌کند و وضعیت را تغییر نمی‌دهد.
</ParamField>

## مدل ایمنی

`openclaw migrate` ابتدا پیش‌نمایش می‌دهد.

<AccordionGroup>
  <Accordion title="پیش‌نمایش پیش از اعمال">
    ارائه‌دهنده پیش از هر تغییری یک برنامه موردی برمی‌گرداند، شامل تداخل‌ها، موارد ردشده، و موارد حساس. برنامه‌های JSON، خروجی اعمال، و گزارش‌های مهاجرت کلیدهای تو‌در‌تویی را که شبیه راز هستند، مانند کلیدهای API، توکن‌ها، سرآیندهای مجوزدهی، کوکی‌ها، و گذرواژه‌ها، ویرایش و پنهان می‌کنند.

    `openclaw migrate apply <provider>` برنامه را پیش‌نمایش می‌دهد و پیش از تغییر وضعیت درخواست تایید می‌کند، مگر اینکه `--yes` تنظیم شده باشد. در حالت غیرتعاملی، اعمال به `--yes` نیاز دارد.

  </Accordion>
  <Accordion title="پشتیبان‌ها">
    اعمال، پیش از اعمال مهاجرت، یک پشتیبان OpenClaw می‌سازد و آن را راستی‌آزمایی می‌کند. اگر هنوز هیچ وضعیت محلی OpenClaw وجود نداشته باشد، مرحله پشتیبان‌گیری رد می‌شود و مهاجرت می‌تواند ادامه پیدا کند. برای رد کردن پشتیبان‌گیری وقتی وضعیت وجود دارد، هر دو `--no-backup` و `--force` را بدهید.
  </Accordion>
  <Accordion title="تداخل‌ها">
    وقتی برنامه تداخل دارد، اعمال از ادامه دادن خودداری می‌کند. برنامه را بازبینی کنید، سپس اگر جایگزینی مقصدهای موجود عمدی است، با `--overwrite` دوباره اجرا کنید. ارائه‌دهنده‌ها ممکن است همچنان برای فایل‌های بازنویسی‌شده در پوشه گزارش مهاجرت، پشتیبان‌های سطح مورد بنویسند.
  </Accordion>
  <Accordion title="رازها">
    رازها هرگز به‌طور پیش‌فرض وارد نمی‌شوند. برای وارد کردن اعتبارنامه‌های پشتیبانی‌شده از `--include-secrets` استفاده کنید.
  </Accordion>
</AccordionGroup>

## ارائه‌دهنده Claude

ارائه‌دهنده همراه Claude، وضعیت Claude Code را به‌طور پیش‌فرض در `~/.claude` شناسایی می‌کند. برای وارد کردن یک خانه یا ریشه پروژه مشخص Claude Code، از `--from <path>` استفاده کنید.

<Tip>
برای یک راهنمای گام‌به‌گام کاربرمحور، [مهاجرت از Claude](/fa/install/migrating-claude) را ببینید.
</Tip>

### Claude چه چیزهایی را وارد می‌کند

- `CLAUDE.md` و `.claude/CLAUDE.md` پروژه به فضای کاری عامل OpenClaw.
- `~/.claude/CLAUDE.md` کاربر که به `USER.md` فضای کاری افزوده می‌شود.
- تعریف‌های سرور MCP از `.mcp.json` پروژه، `~/.claude.json` مربوط به Claude Code، و `claude_desktop_config.json` مربوط به Claude Desktop.
- پوشه‌های مهارت Claude که شامل `SKILL.md` هستند.
- فایل‌های Markdown دستور Claude که فقط با فراخوانی دستی به مهارت‌های OpenClaw تبدیل شده‌اند.

### وضعیت بایگانی و بازبینی دستی

هوک‌ها، مجوزها، پیش‌فرض‌های محیطی، حافظه محلی، قواعد محدود به مسیر، زیرعامل‌ها، کش‌ها، برنامه‌ها، و تاریخچه پروژه Claude در گزارش مهاجرت حفظ می‌شوند یا به‌عنوان موارد نیازمند بازبینی دستی گزارش می‌شوند. OpenClaw هوک‌ها را اجرا نمی‌کند، فهرست‌های مجاز گسترده را کپی نمی‌کند، و وضعیت اعتبارنامه OAuth/Desktop را به‌طور خودکار وارد نمی‌کند.

## ارائه‌دهنده Codex

ارائه‌دهنده همراه Codex، وضعیت Codex CLI را به‌طور پیش‌فرض در `~/.codex` شناسایی می‌کند، یا
وقتی متغیر محیطی `CODEX_HOME` تنظیم شده باشد، در `CODEX_HOME`. برای
فهرست‌برداری از یک خانه مشخص Codex، از `--from <path>` استفاده کنید.

از این ارائه‌دهنده زمانی استفاده کنید که به harness مربوط به OpenClaw Codex منتقل می‌شوید و می‌خواهید
دارایی‌های شخصی مفید Codex CLI را آگاهانه ارتقا دهید. اجراهای app-server محلی Codex
برای هر عامل از پوشه‌های جداگانه `CODEX_HOME` و `HOME` استفاده می‌کنند، بنابراین به‌طور پیش‌فرض
وضعیت شخصی Codex CLI شما را نمی‌خوانند.

اجرای `openclaw migrate codex` در یک پایانه تعاملی، کل
برنامه را پیش‌نمایش می‌دهد، سپس پیش از تایید نهایی اعمال، گزینشگرهای چک‌باکسی را باز می‌کند. موارد
کپی مهارت ابتدا پرسیده می‌شوند. برای انتخاب دسته‌جمعی از `Toggle all on` یا `Toggle all off`
استفاده کنید؛ مهارت‌های برنامه‌ریزی‌شده از ابتدا تیک‌خورده هستند، مهارت‌های دارای تداخل از ابتدا بدون تیک هستند، و
`Skip for now` کپی‌های مهارت را برای این اجرا رد می‌کند، در حالی که همچنان به انتخاب Plugin
ادامه می‌دهد. وقتی Pluginهای curated نصب‌شده از مبدا Codex قابل مهاجرت باشند و
`--plugin` ارائه نشده باشد، مهاجرت سپس برای فعال‌سازی Plugin بومی Codex
بر پایه نام Plugin درخواست می‌کند. موارد Plugin
از ابتدا تیک‌خورده هستند، مگر اینکه پیکربندی Plugin مربوط به OpenClaw Codex در مقصد از قبل آن
Plugin را داشته باشد. Pluginهای مقصد موجود از ابتدا بدون تیک هستند و یک راهنمای تداخل مانند
`conflict: plugin exists` نشان می‌دهند؛ برای مهاجرت نکردن هیچ Plugin بومی Codex
در آن اجرا، `Toggle all off` را انتخاب کنید، یا برای توقف پیش از اعمال، `Skip for now` را انتخاب کنید. برای اجراهای اسکریپتی یا
دقیق، برای هر مهارت یک بار `--skill <name>` را بدهید، برای نمونه:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

برای محدود کردن مهاجرت غیرتعاملی Plugin بومی Codex
به یک یا چند Plugin curated نصب‌شده از مبدا، از `--plugin <name>` استفاده کنید:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex چه چیزهایی را وارد می‌کند

- پوشه‌های مهارت Codex CLI زیر `$CODEX_HOME/skills`، به‌استثنای کش
  `.system` مربوط به Codex.
- AgentSkills شخصی زیر `$HOME/.agents/skills`، که وقتی مالکیت برای هر عامل را می‌خواهید، به فضای کاری
  عامل فعلی OpenClaw کپی می‌شوند.
- Pluginهای Codex مربوط به `openai-curated` نصب‌شده از مبدا که از طریق
  `plugin/list` مربوط به app-server در Codex کشف شده‌اند. اعمال برای هر
  Plugin انتخاب‌شده، `plugin/install` مربوط به app-server را فراخوانی می‌کند، حتی اگر app-server مقصد از قبل آن Plugin را
  نصب‌شده و فعال گزارش کند. Pluginهای Codex مهاجرت‌شده فقط در نشست‌هایی قابل استفاده‌اند که
  harness بومی Codex را انتخاب می‌کنند؛ آن‌ها در اختیار Pi، اجراهای عادی ارائه‌دهنده OpenAI،
  اتصال‌های گفت‌وگوی ACP، یا harnessهای دیگر قرار نمی‌گیرند.

### وضعیت Codex نیازمند بازبینی دستی

`config.toml` مربوط به Codex، `hooks/hooks.json` بومی، marketplaceهای غیر-curated، و
بسته‌های کش‌شده Plugin که Pluginهای curated نصب‌شده از مبدا نیستند، به‌طور خودکار
فعال نمی‌شوند. آن‌ها برای بازبینی دستی در گزارش مهاجرت کپی یا گزارش می‌شوند.

برای Pluginهای curated نصب‌شده از مبدا که مهاجرت شده‌اند، اعمال این‌ها را می‌نویسد:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- یک ورودی صریح Plugin با `marketplaceName: "openai-curated"` و
  `pluginName` برای هر Plugin انتخاب‌شده

مهاجرت هرگز `plugins["*"]` را نمی‌نویسد و هرگز مسیرهای کش marketplace محلی را
ذخیره نمی‌کند. نصب‌هایی که به احراز هویت نیاز دارند روی مورد Plugin متاثر با
`status: "skipped"`، `reason: "auth_required"`، و شناسه‌های پاک‌سازی‌شده برنامه گزارش می‌شوند.
ورودی‌های پیکربندی صریح آن‌ها غیرفعال نوشته می‌شود تا زمانی که دوباره مجوز دهید و
آن‌ها را فعال کنید. شکست‌های نصب دیگر، نتیجه‌های `error` محدود به همان مورد هستند.

اگر هنگام برنامه‌ریزی، فهرست موجودی Plugin مربوط به app-server در Codex در دسترس نباشد، مهاجرت
به‌جای شکست دادن کل
مهاجرت، به موارد مشاوره‌ای بسته کش‌شده بازمی‌گردد.

## ارائه‌دهنده Hermes

ارائه‌دهنده همراه Hermes، وضعیت را به‌طور پیش‌فرض در `~/.hermes` شناسایی می‌کند. وقتی Hermes جای دیگری است، از `--from <path>` استفاده کنید.

### Hermes چه چیزهایی را وارد می‌کند

- پیکربندی مدل پیش‌فرض از `config.yaml`.
- ارائه‌دهنده‌های مدل پیکربندی‌شده و نقاط پایانی سفارشی سازگار با OpenAI از `providers` و `custom_providers`.
- تعریف‌های سرور MCP از `mcp_servers` یا `mcp.servers`.
- `SOUL.md` و `AGENTS.md` به فضای کاری عامل OpenClaw.
- `memories/MEMORY.md` و `memories/USER.md` که به فایل‌های حافظه فضای کاری افزوده می‌شوند.
- پیش‌فرض‌های پیکربندی حافظه برای حافظه فایلی OpenClaw، به‌علاوه موارد بایگانی یا بازبینی دستی برای ارائه‌دهنده‌های حافظه خارجی مانند Honcho.
- Skillsهایی که زیر `skills/<name>/` شامل فایل `SKILL.md` هستند.
- مقادیر پیکربندی هر مهارت از `skills.config`.
- کلیدهای API پشتیبانی‌شده از `.env`، فقط با `--include-secrets`.

### کلیدهای `.env` پشتیبانی‌شده

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### وضعیت فقط بایگانی

وضعیت Hermes که OpenClaw نمی‌تواند با ایمنی تفسیر کند، برای بازبینی دستی در گزارش مهاجرت کپی می‌شود، اما در پیکربندی زنده یا اعتبارنامه‌های OpenClaw بارگذاری نمی‌شود. این کار وضعیت مبهم یا ناامن را حفظ می‌کند، بدون اینکه وانمود کند OpenClaw می‌تواند آن را به‌طور خودکار اجرا کند یا به آن اعتماد کند:

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

در زمان اجرا، Plugin تابع `api.registerMigrationProvider(...)` را فراخوانی می‌کند. ارائه‌دهنده `detect`، `plan`، و `apply` را پیاده‌سازی می‌کند. هسته مالک هماهنگ‌سازی CLI، سیاست پشتیبان‌گیری، درخواست‌ها، خروجی JSON، و پیش‌بررسی تداخل است. هسته برنامه بازبینی‌شده را به `apply(ctx, plan)` می‌فرستد، و ارائه‌دهنده‌ها فقط وقتی آن آرگومان برای سازگاری غایب باشد، می‌توانند برنامه را دوباره بسازند.

Pluginهای ارائه‌دهنده می‌توانند از `openclaw/plugin-sdk/migration` برای ساخت موردها و شمارش‌های خلاصه، و همچنین از `openclaw/plugin-sdk/migration-runtime` برای کپی فایل‌های آگاه به تداخل، کپی‌های گزارش فقط بایگانی، پوشش‌دهنده‌های config-runtime کش‌شده، و گزارش‌های مهاجرت استفاده کنند.

## یکپارچه‌سازی ورود اولیه

وقتی یک ارائه‌دهنده یک منبع شناخته‌شده را شناسایی کند، ورود اولیه می‌تواند مهاجرت را پیشنهاد دهد. هم `openclaw onboard --flow import` و هم `openclaw setup --wizard --import-from hermes` از همان ارائه‌دهنده مهاجرت Plugin استفاده می‌کنند و همچنان پیش از اعمال، پیش‌نمایش نشان می‌دهند.

<Note>
واردسازی‌های راه‌اندازی اولیه به یک راه‌اندازی تازه OpenClaw نیاز دارند. اگر از قبل وضعیت محلی دارید، ابتدا پیکربندی، اعتبارنامه‌ها، نشست‌ها و فضای کاری را بازنشانی کنید. واردسازی‌های پشتیبان‌گیری به‌همراه بازنویسی یا ادغام برای راه‌اندازی‌های موجود پشت دروازهٔ قابلیت قرار دارند.
</Note>

## مرتبط

- [مهاجرت از Hermes](/fa/install/migrating-hermes): راهنمای گام‌به‌گام کاربر.
- [مهاجرت از Claude](/fa/install/migrating-claude): راهنمای گام‌به‌گام کاربر.
- [مهاجرت](/fa/install/migrating): انتقال OpenClaw به یک دستگاه جدید.
- [Doctor](/fa/gateway/doctor): بررسی سلامت پس از اعمال مهاجرت.
- [Pluginها](/fa/tools/plugin): نصب و ثبت Plugin.
