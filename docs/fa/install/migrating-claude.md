---
read_when:
    - شما از Claude Code یا Claude Desktop می‌آیید و می‌خواهید دستورالعمل‌ها، سرورهای MCP و Skills را حفظ کنید
    - باید بدانید OpenClaw چه چیزهایی را به‌طور خودکار وارد می‌کند و چه چیزهایی فقط در بایگانی باقی می‌مانند
summary: وضعیت محلی Claude Code و Claude Desktop را با یک درون‌ریزی دارای پیش‌نمایش به OpenClaw منتقل کنید
title: مهاجرت از Claude
x-i18n:
    generated_at: "2026-07-12T10:16:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw وضعیت محلی Claude را از طریق ارائه‌دهنده مهاجرت Claude که همراه آن عرضه می‌شود، وارد می‌کند. این ارائه‌دهنده پیش از تغییر وضعیت، پیش‌نمایش همه موارد را نمایش می‌دهد، اطلاعات محرمانه را در برنامه‌ها و گزارش‌ها پنهان می‌کند و پیش از اعمال تغییرات، یک نسخه پشتیبان تأییدشده ایجاد می‌کند.

<Note>
واردکردن از طریق راه‌اندازی اولیه به یک پیکربندی تازه OpenClaw نیاز دارد. اگر از قبل وضعیت محلی OpenClaw دارید، ابتدا پیکربندی، اطلاعات احراز هویت، نشست‌ها و فضای کاری را بازنشانی کنید؛ یا پس از بررسی برنامه، مستقیماً از `openclaw migrate` همراه با `--overwrite` استفاده کنید.
</Note>

## دو روش برای واردکردن

<Tabs>
  <Tab title="راهنمای گام‌به‌گام راه‌اندازی اولیه">
    راهنما زمانی که وضعیت محلی Claude را تشخیص دهد، گزینه Claude را ارائه می‌کند.

    ```bash
    openclaw onboard --flow import
    ```

    یا یک منبع مشخص را تعیین کنید:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    برای اجراهای اسکریپتی یا تکرارپذیر از `openclaw migrate` استفاده کنید. برای مرجع کامل، به [`openclaw migrate`](/fa/cli/migrate) مراجعه کنید.

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    برای واردکردن یک پوشه خانه مشخص Claude Code یا ریشه پروژه، `--from <path>` را اضافه کنید.

  </Tab>
</Tabs>

## مواردی که وارد می‌شوند

<AccordionGroup>
  <Accordion title="دستورالعمل‌ها و حافظه">
    - محتوای `CLAUDE.md` و `.claude/CLAUDE.md` پروژه در `AGENTS.md` فضای کاری عامل OpenClaw کپی یا به آن افزوده می‌شود.
    - محتوای `~/.claude/CLAUDE.md` کاربر به `USER.md` فضای کاری افزوده می‌شود.

  </Accordion>
  <Accordion title="سرورهای MCP">
    در صورت وجود، تعریف‌های سرور MCP از `.mcp.json` پروژه، `~/.claude.json` در Claude Code و `claude_desktop_config.json` در Claude Desktop وارد می‌شوند.
  </Accordion>
  <Accordion title="Skills و فرمان‌ها">
    - Skills متعلق به Claude که فایل `SKILL.md` دارند، در پوشه Skills فضای کاری OpenClaw کپی می‌شوند.
    - فایل‌های Markdown فرمان Claude در `.claude/commands/` یا `~/.claude/commands/` به Skills در OpenClaw با `disable-model-invocation: true` تبدیل می‌شوند.

  </Accordion>
</AccordionGroup>

## مواردی که فقط در بایگانی باقی می‌مانند

ارائه‌دهنده این موارد را برای بررسی دستی در گزارش مهاجرت کپی می‌کند، اما آن‌ها را در پیکربندی فعال OpenClaw بارگذاری **نمی‌کند**:

- هوک‌های Claude
- مجوزهای Claude و فهرست‌های گسترده ابزارهای مجاز
- مقادیر پیش‌فرض محیط Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- عامل‌های فرعی Claude در `.claude/agents/` یا `~/.claude/agents/`
- حافظه‌های نهان، برنامه‌ها و پوشه‌های تاریخچه پروژه Claude Code
- افزونه‌های Claude Desktop و اطلاعات احراز هویت ذخیره‌شده در سیستم‌عامل

OpenClaw از اجرای خودکار هوک‌ها، اعتماد به فهرست‌های مجوز و رمزگشایی وضعیت مبهم اطلاعات احراز هویت OAuth و Desktop خودداری می‌کند. پس از بررسی بایگانی، موارد موردنیاز را به‌صورت دستی منتقل کنید.

## انتخاب منبع

بدون `--from`، ‏OpenClaw پوشه خانه پیش‌فرض Claude Code در `~/.claude`، فایل وضعیت نمونه‌برداری‌شده Claude Code در `~/.claude.json` و پیکربندی MCP متعلق به Claude Desktop در macOS را بررسی می‌کند.

وقتی `--from` به ریشه یک پروژه اشاره کند، OpenClaw فقط فایل‌های Claude همان پروژه، مانند `CLAUDE.md`،‏ `.claude/settings.json`،‏ `.claude/commands/`،‏ `.claude/skills/` و `.mcp.json` را وارد می‌کند. هنگام واردکردن از ریشه پروژه، پوشه خانه سراسری Claude شما را نمی‌خواند.

## روند پیشنهادی

<Steps>
  <Step title="پیش‌نمایش برنامه">
    ```bash
    openclaw migrate claude --dry-run
    ```

    برنامه همه مواردی را که تغییر خواهند کرد فهرست می‌کند؛ از جمله تعارض‌ها، موارد ردشده و مقادیر حساس پنهان‌شده از فیلدهای تو‌در‌توی `env` یا `headers` مربوط به MCP.

  </Step>
  <Step title="اعمال همراه با نسخه پشتیبان">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw پیش از اعمال تغییرات، یک نسخه پشتیبان ایجاد و تأیید می‌کند.

  </Step>
  <Step title="اجرای عیب‌یاب">
    ```bash
    openclaw doctor
    ```

    [عیب‌یاب](/fa/gateway/doctor) پس از واردکردن، مشکلات پیکربندی یا وضعیت را بررسی می‌کند.

  </Step>
  <Step title="راه‌اندازی مجدد و تأیید">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    تأیید کنید که Gateway سالم است و دستورالعمل‌ها، سرورهای MCP و Skills واردشده شما بارگذاری شده‌اند.

  </Step>
</Steps>

## مدیریت تعارض‌ها

اگر برنامه تعارضی را گزارش کند، اعمال تغییرات از ادامه خودداری می‌کند؛ یعنی فایل یا مقدار پیکربندی از قبل در مقصد وجود دارد.

<Warning>
فقط زمانی دوباره با `--overwrite` اجرا کنید که جایگزینی مقصد موجود عمدی باشد. ارائه‌دهندگان ممکن است همچنان برای فایل‌های بازنویسی‌شده، نسخه‌های پشتیبان جداگانه در سطح هر مورد در پوشه گزارش مهاجرت ایجاد کنند.
</Warning>

در نصب تازه OpenClaw، تعارض‌ها غیرمعمول هستند. این تعارض‌ها معمولاً زمانی ظاهر می‌شوند که واردکردن را روی پیکربندی‌ای دوباره اجرا کنید که از قبل ویرایش‌های کاربر را دارد.

## خروجی JSON برای خودکارسازی

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

گزینه `--yes` برای `migrate apply` خارج از یک پایانه تعاملی الزامی است؛ بدون آن، OpenClaw به‌جای اعمال تغییرات خطا می‌دهد، بنابراین اسکریپت‌ها و CI باید `--yes` را صریحاً ارسال کنند. ابتدا با `--dry-run --json` پیش‌نمایش بگیرید و پس از مناسب‌بودن برنامه، با `--json --yes` آن را اعمال کنید.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="وضعیت Claude خارج از ~/.claude قرار دارد">
    از `--from /actual/path` در CLI یا `--import-source /actual/path` در راه‌اندازی اولیه استفاده کنید.
  </Accordion>
  <Accordion title="راه‌اندازی اولیه از واردکردن روی پیکربندی موجود خودداری می‌کند">
    واردکردن از طریق راه‌اندازی اولیه به یک پیکربندی تازه نیاز دارد. وضعیت را بازنشانی و راه‌اندازی اولیه را دوباره انجام دهید، یا مستقیماً از `openclaw migrate apply claude` استفاده کنید که از `--overwrite` و کنترل صریح نسخه پشتیبان پشتیبانی می‌کند.
  </Accordion>
  <Accordion title="سرورهای MCP متعلق به Claude Desktop وارد نشدند">
    Claude Desktop فایل `claude_desktop_config.json` را از مسیری مختص پلتفرم می‌خواند. اگر OpenClaw آن را به‌طور خودکار تشخیص نداد، `--from` را به پوشه آن فایل اشاره دهید.
  </Accordion>
  <Accordion title="فرمان‌های Claude با غیرفعال‌بودن فراخوانی مدل به Skills تبدیل شدند">
    این رفتار عمدی است. فرمان‌های Claude به‌دست کاربر اجرا می‌شوند، بنابراین OpenClaw آن‌ها را به‌صورت Skills با `disable-model-invocation: true` وارد می‌کند. اگر می‌خواهید عامل آن‌ها را به‌طور خودکار فراخوانی کند، frontmatter هر Skill را ویرایش کنید.
  </Accordion>
</AccordionGroup>

## مطالب مرتبط

- [`openclaw migrate`](/fa/cli/migrate): مرجع کامل CLI، قرارداد Plugin و ساختارهای JSON.
- [راهنمای مهاجرت](/fa/install/migrating): همه مسیرهای مهاجرت.
- [مهاجرت از Hermes](/fa/install/migrating-hermes): مسیر دیگر واردکردن میان‌سیستمی.
- [راه‌اندازی اولیه](/fa/cli/onboard): روند راهنما و پرچم‌های غیرتعاملی.
- [عیب‌یاب](/fa/gateway/doctor): بررسی سلامت پس از مهاجرت.
- [فضای کاری عامل](/fa/concepts/agent-workspace): محل قرارگیری `AGENTS.md`،‏ `USER.md` و Skills.
