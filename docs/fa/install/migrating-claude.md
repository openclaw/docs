---
read_when:
    - از Claude Code یا Claude Desktop می‌آیید و می‌خواهید دستورالعمل‌ها، سرورهای MCP و Skills را حفظ کنید
    - باید بدانید OpenClaw چه چیزهایی را به‌طور خودکار وارد می‌کند و چه چیزهایی فقط در بایگانی باقی می‌مانند
summary: وضعیت محلی Claude Code و Claude Desktop را با یک واردسازی با پیش‌نمایش به OpenClaw منتقل کنید
title: مهاجرت از Claude
x-i18n:
    generated_at: "2026-04-29T23:05:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b44eda85f3a3714d7d360d04fdd2c99a692fa6491f12e73847c5f08d702a62c
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw وضعیت محلی Claude را از طریق provider مهاجرت Claude که به‌صورت همراه ارائه شده است، وارد می‌کند. این provider پیش از تغییر وضعیت، هر مورد را پیش‌نمایش می‌کند، اسرار را در طرح‌ها و گزارش‌ها بازنویسی محرمانه می‌کند، و پیش از اعمال، یک پشتیبان تاییدشده ایجاد می‌کند.

<Note>
واردسازی‌های راه‌اندازی اولیه به یک نصب تازه OpenClaw نیاز دارند. اگر از قبل وضعیت محلی OpenClaw دارید، ابتدا پیکربندی، اعتبارنامه‌ها، نشست‌ها و workspace را بازنشانی کنید، یا پس از بررسی طرح، مستقیما از `openclaw migrate` همراه با `--overwrite` استفاده کنید.
</Note>

## دو روش برای واردسازی

<Tabs>
  <Tab title="Onboarding wizard">
    وقتی wizard وضعیت محلی Claude را تشخیص دهد، Claude را پیشنهاد می‌دهد.

    ```bash
    openclaw onboard --flow import
    ```

    یا آن را به یک منبع مشخص اشاره دهید:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    برای اجراهای اسکریپت‌شده یا تکرارپذیر از `openclaw migrate` استفاده کنید. برای مرجع کامل، [`openclaw migrate`](/fa/cli/migrate) را ببینید.

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    برای واردسازی یک خانه Claude Code یا ریشه پروژه مشخص، `--from <path>` را اضافه کنید.

  </Tab>
</Tabs>

## چه چیزهایی وارد می‌شوند

<AccordionGroup>
  <Accordion title="Instructions and memory">
    - محتوای `CLAUDE.md` پروژه و `.claude/CLAUDE.md` در workspace عامل OpenClaw یعنی `AGENTS.md` کپی یا به آن افزوده می‌شود.
    - محتوای `~/.claude/CLAUDE.md` کاربر به `USER.md` در workspace افزوده می‌شود.

  </Accordion>
  <Accordion title="MCP servers">
    تعریف‌های سرور MCP، در صورت وجود، از `.mcp.json` پروژه، فایل `~/.claude.json` مربوط به Claude Code، و `claude_desktop_config.json` مربوط به Claude Desktop وارد می‌شوند.
  </Accordion>
  <Accordion title="Skills and commands">
    - Skills مربوط به Claude که فایل `SKILL.md` دارند، در دایرکتوری skills مربوط به workspace در OpenClaw کپی می‌شوند.
    - فایل‌های Markdown فرمان Claude زیر `.claude/commands/` یا `~/.claude/commands/` به skills در OpenClaw با `disable-model-invocation: true` تبدیل می‌شوند.

  </Accordion>
</AccordionGroup>

## چه چیزهایی فقط به‌صورت آرشیو باقی می‌مانند

provider این موارد را برای بازبینی دستی در گزارش مهاجرت کپی می‌کند، اما آن‌ها را در پیکربندی زنده OpenClaw بارگذاری **نمی‌کند**:

- hookهای Claude
- مجوزهای Claude و فهرست‌های مجاز گسترده ابزارها
- پیش‌فرض‌های محیطی Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- زیرعامل‌های Claude زیر `.claude/agents/` یا `~/.claude/agents/`
- cacheها، طرح‌ها و دایرکتوری‌های تاریخچه پروژه Claude Code
- افزونه‌های Claude Desktop و اعتبارنامه‌های ذخیره‌شده در سیستم‌عامل

OpenClaw از اجرای خودکار hookها، اعتماد به فهرست‌های مجاز مجوز، یا رمزگشایی وضعیت مبهم OAuth و اعتبارنامه‌های Desktop خودداری می‌کند. پس از بررسی آرشیو، موارد موردنیازتان را به‌صورت دستی منتقل کنید.

## انتخاب منبع

بدون `--from`، OpenClaw خانه پیش‌فرض Claude Code در `~/.claude`، فایل وضعیت نمونه‌برداری‌شده `~/.claude.json` مربوط به Claude Code، و پیکربندی MCP مربوط به Claude Desktop در macOS را بررسی می‌کند.

وقتی `--from` به ریشه یک پروژه اشاره کند، OpenClaw فقط فایل‌های Claude مربوط به همان پروژه را وارد می‌کند، مانند `CLAUDE.md`، `.claude/settings.json`، `.claude/commands/`، `.claude/skills/`، و `.mcp.json`. هنگام واردسازی از ریشه پروژه، خانه سراسری Claude شما را نمی‌خواند.

## روند پیشنهادی

<Steps>
  <Step title="Preview the plan">
    ```bash
    openclaw migrate claude --dry-run
    ```

    این طرح همه چیزهایی را که تغییر خواهند کرد فهرست می‌کند، از جمله conflictها، موارد ردشده، و مقادیر حساس بازنویسی محرمانه‌شده از فیلدهای تودرتوی `env` یا `headers` مربوط به MCP.

  </Step>
  <Step title="Apply with backup">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw پیش از اعمال، یک پشتیبان ایجاد و تایید می‌کند.

  </Step>
  <Step title="Run doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/fa/gateway/doctor) پس از واردسازی، مشکلات پیکربندی یا وضعیت را بررسی می‌کند.

  </Step>
  <Step title="Restart and verify">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    تایید کنید که Gateway سالم است و دستورالعمل‌های واردشده، سرورهای MCP و skills شما بارگذاری شده‌اند.

  </Step>
</Steps>

## مدیریت conflictها

اگر طرح conflictهایی را گزارش کند، apply از ادامه کار خودداری می‌کند (یعنی یک فایل یا مقدار پیکربندی از قبل در مقصد وجود دارد).

<Warning>
فقط وقتی جایگزینی مقصد موجود عمدی است، دوباره با `--overwrite` اجرا کنید. providerها همچنان ممکن است برای فایل‌های overwriteشده در دایرکتوری گزارش مهاجرت، پشتیبان‌های سطح مورد بنویسند.
</Warning>

برای یک نصب تازه OpenClaw، conflictها غیرمعمول هستند. آن‌ها معمولا وقتی ظاهر می‌شوند که واردسازی را روی نصبی دوباره اجرا کنید که از قبل ویرایش‌های کاربر را دارد.

## خروجی JSON برای خودکارسازی

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

با `--json` و بدون `--yes`، apply طرح را چاپ می‌کند و وضعیت را تغییر نمی‌دهد. این امن‌ترین حالت برای CI و اسکریپت‌های مشترک است.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="Claude state lives outside ~/.claude">
    `--from /actual/path` (CLI) یا `--import-source /actual/path` (راه‌اندازی اولیه) را ارسال کنید.
  </Accordion>
  <Accordion title="Onboarding refuses to import on an existing setup">
    واردسازی‌های راه‌اندازی اولیه به یک نصب تازه نیاز دارند. یا وضعیت را بازنشانی کنید و دوباره راه‌اندازی اولیه را انجام دهید، یا مستقیما از `openclaw migrate apply claude` استفاده کنید که از `--overwrite` و کنترل صریح پشتیبان پشتیبانی می‌کند.
  </Accordion>
  <Accordion title="MCP servers from Claude Desktop did not import">
    Claude Desktop فایل `claude_desktop_config.json` را از یک مسیر وابسته به پلتفرم می‌خواند. اگر OpenClaw آن را به‌صورت خودکار تشخیص نداد، `--from` را به دایرکتوری همان فایل اشاره دهید.
  </Accordion>
  <Accordion title="Claude commands became skills with model invocation disabled">
    این رفتار تعمدی است. فرمان‌های Claude توسط کاربر راه‌اندازی می‌شوند، بنابراین OpenClaw آن‌ها را به‌صورت skills با `disable-model-invocation: true` وارد می‌کند. اگر می‌خواهید عامل آن‌ها را به‌صورت خودکار فراخوانی کند، frontmatter هر skill را ویرایش کنید.
  </Accordion>
</AccordionGroup>

## مرتبط

- [`openclaw migrate`](/fa/cli/migrate): مرجع کامل CLI، قرارداد Plugin، و ساختارهای JSON.
- [راهنمای مهاجرت](/fa/install/migrating): همه مسیرهای مهاجرت.
- [مهاجرت از Hermes](/fa/install/migrating-hermes): مسیر دیگر واردسازی میان‌سیستمی.
- [راه‌اندازی اولیه](/fa/cli/onboard): جریان wizard و flagهای غیرتعاملی.
- [Doctor](/fa/gateway/doctor): بررسی سلامت پس از مهاجرت.
- [workspace عامل](/fa/concepts/agent-workspace): جایی که `AGENTS.md`، `USER.md`، و skills قرار دارند.
