---
read_when:
    - از Hermes می‌آیید و می‌خواهید پیکربندی مدل، پرامپت‌ها، حافظه و Skills خود را نگه دارید
    - می‌خواهید بدانید OpenClaw چه چیزهایی را به‌صورت خودکار وارد می‌کند و چه چیزهایی فقط در آرشیو می‌مانند
    - به یک مسیر مهاجرت تمیز و اسکریپت‌شده نیاز دارید (CI، لپ‌تاپ تازه، خودکارسازی)
summary: با یک درون‌ریزی پیش‌نمایش‌شده و برگشت‌پذیر، از Hermes به OpenClaw مهاجرت کنید
title: مهاجرت از Hermes
x-i18n:
    generated_at: "2026-04-29T23:05:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f8a71e524b31c85864be63e54fc8a2057ecb06a73aac9e6fb107fc0c49757d
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw وضعیت Hermes را از طریق یک ارائه‌دهندهٔ مهاجرتِ همراه وارد می‌کند. این ارائه‌دهنده پیش از تغییر وضعیت، همه‌چیز را پیش‌نمایش می‌کند، اسرار را در برنامه‌ها و گزارش‌ها پنهان‌سازی می‌کند، و پیش از اعمال، یک پشتیبانِ تأییدشده می‌سازد.

<Note>
وارد کردن به یک راه‌اندازی تازهٔ OpenClaw نیاز دارد. اگر از قبل وضعیت محلی OpenClaw دارید، ابتدا پیکربندی، اعتبارنامه‌ها، نشست‌ها و workspace را بازنشانی کنید، یا پس از بازبینی برنامه، مستقیماً از `openclaw migrate` همراه با `--overwrite` استفاده کنید.
</Note>

## دو روش برای وارد کردن

<Tabs>
  <Tab title="جادوگر راه‌اندازی اولیه">
    سریع‌ترین مسیر. جادوگر، Hermes را در `~/.hermes` تشخیص می‌دهد و پیش از اعمال، یک پیش‌نمایش نشان می‌دهد.

    ```bash
    openclaw onboard --flow import
    ```

    یا به یک منبع مشخص اشاره کنید:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    برای اجراهای اسکریپتی یا تکرارپذیر از `openclaw migrate` استفاده کنید. برای مرجع کامل، [`openclaw migrate`](/fa/cli/migrate) را ببینید.

    ```bash
    openclaw migrate hermes --dry-run    # preview only
    openclaw migrate apply hermes --yes  # apply with confirmation skipped
    ```

    وقتی Hermes بیرون از `~/.hermes` قرار دارد، `--from <path>` را اضافه کنید.

  </Tab>
</Tabs>

## چه چیزهایی وارد می‌شود

<AccordionGroup>
  <Accordion title="پیکربندی مدل">
    - انتخاب مدل پیش‌فرض از `config.yaml` در Hermes.
    - ارائه‌دهندگان مدل پیکربندی‌شده و نقاط پایانی سفارشیِ سازگار با OpenAI از `providers` و `custom_providers`.

  </Accordion>
  <Accordion title="سرورهای MCP">
    تعریف‌های سرور MCP از `mcp_servers` یا `mcp.servers`.
  </Accordion>
  <Accordion title="فایل‌های workspace">
    - `SOUL.md` و `AGENTS.md` در workspace عامل OpenClaw کپی می‌شوند.
    - `memories/MEMORY.md` و `memories/USER.md` به‌جای بازنویسی، به فایل‌های حافظهٔ متناظر OpenClaw **افزوده** می‌شوند.

  </Accordion>
  <Accordion title="پیکربندی حافظه">
    پیش‌فرض‌های پیکربندی حافظه برای حافظهٔ فایلی OpenClaw. ارائه‌دهندگان حافظهٔ خارجی مانند Honcho به‌عنوان موارد بایگانی یا نیازمند بازبینی دستی ثبت می‌شوند تا بتوانید آن‌ها را آگاهانه منتقل کنید.
  </Accordion>
  <Accordion title="Skills">
    Skills دارای فایل `SKILL.md` زیر `skills/<name>/` همراه با مقدارهای پیکربندیِ مختص هر skill از `skills.config` کپی می‌شوند.
  </Accordion>
  <Accordion title="کلیدهای API (اختیاری)">
    برای وارد کردن کلیدهای پشتیبانی‌شدهٔ `.env`، `--include-secrets` را تنظیم کنید: `OPENAI_API_KEY`، `ANTHROPIC_API_KEY`، `OPENROUTER_API_KEY`، `GOOGLE_API_KEY`، `GEMINI_API_KEY`، `GROQ_API_KEY`، `XAI_API_KEY`، `MISTRAL_API_KEY`، `DEEPSEEK_API_KEY`. بدون این flag، اسرار هرگز کپی نمی‌شوند.
  </Accordion>
</AccordionGroup>

## چه چیزهایی فقط در بایگانی می‌ماند

ارائه‌دهنده این موارد را برای بازبینی دستی در دایرکتوری گزارش مهاجرت کپی می‌کند، اما آن‌ها را در پیکربندی زنده یا اعتبارنامه‌های زندهٔ OpenClaw بارگذاری **نمی‌کند**:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

OpenClaw از اجرای خودکار این وضعیت یا اعتماد خودکار به آن خودداری می‌کند، زیرا قالب‌ها و فرض‌های اعتماد می‌توانند بین سیستم‌ها تغییر کنند. پس از بازبینی بایگانی، هرچه نیاز دارید را دستی منتقل کنید.

## جریان پیشنهادی

<Steps>
  <Step title="پیش‌نمایش برنامه">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    برنامه هر چیزی را که تغییر خواهد کرد فهرست می‌کند، از جمله تعارض‌ها، موارد ردشده، و هر مورد حساس. خروجی برنامه، کلیدهای تو در توی شبیه به secret را پنهان‌سازی می‌کند.

  </Step>
  <Step title="اعمال همراه با پشتیبان">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw پیش از اعمال، یک پشتیبان می‌سازد و آن را تأیید می‌کند. اگر لازم است کلیدهای API وارد شوند، `--include-secrets` را اضافه کنید.

  </Step>
  <Step title="اجرای doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/fa/gateway/doctor) هر مهاجرت پیکربندیِ در انتظار را دوباره اعمال می‌کند و مشکلات ایجادشده هنگام وارد کردن را بررسی می‌کند.

  </Step>
  <Step title="راه‌اندازی مجدد و تأیید">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    تأیید کنید Gateway سالم است و مدل، حافظه و skills واردشدهٔ شما بارگذاری شده‌اند.

  </Step>
</Steps>

## مدیریت تعارض

وقتی برنامه تعارض گزارش می‌کند (یک فایل یا مقدار پیکربندی از قبل در مقصد وجود دارد)، اعمال از ادامه دادن خودداری می‌کند.

<Warning>
فقط زمانی با `--overwrite` دوباره اجرا کنید که جایگزینی مقصد موجود عمدی باشد. ارائه‌دهندگان ممکن است همچنان برای فایل‌های بازنویسی‌شده در دایرکتوری گزارش مهاجرت، پشتیبان‌های سطح مورد بنویسند.
</Warning>

برای نصب تازهٔ OpenClaw، تعارض‌ها غیرمعمول هستند. معمولاً زمانی ظاهر می‌شوند که وارد کردن را روی راه‌اندازی‌ای دوباره اجرا می‌کنید که از قبل ویرایش‌های کاربر دارد.

اگر تعارضی در میانهٔ اعمال رخ دهد (برای مثال، یک رقابت غیرمنتظره روی فایل پیکربندی)، Hermes موارد پیکربندی وابستهٔ باقی‌مانده را به‌جای نوشتن ناقص، با دلیل `blocked by earlier apply conflict` به‌صورت `skipped` علامت‌گذاری می‌کند. گزارش مهاجرت هر مورد مسدودشده را ثبت می‌کند تا بتوانید تعارض اصلی را رفع کنید و وارد کردن را دوباره اجرا کنید.

## اسرار

اسرار به‌صورت پیش‌فرض هرگز وارد نمی‌شوند.

- ابتدا `openclaw migrate apply hermes --yes` را اجرا کنید تا وضعیت غیرمحرمانه وارد شود.
- اگر همچنین می‌خواهید کلیدهای پشتیبانی‌شدهٔ `.env` کپی شوند، با `--include-secrets` دوباره اجرا کنید.
- برای اعتبارنامه‌های مدیریت‌شده با SecretRef، پس از کامل شدن وارد کردن، منبع SecretRef را پیکربندی کنید.

## خروجی JSON برای خودکارسازی

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

با `--json` و بدون `--yes`، apply برنامه را چاپ می‌کند و وضعیت را تغییر نمی‌دهد. این امن‌ترین حالت برای CI و اسکریپت‌های مشترک است.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="اعمال به‌دلیل تعارض‌ها خودداری می‌کند">
    خروجی برنامه را بررسی کنید. هر تعارض مسیر منبع و مقصد موجود را مشخص می‌کند. برای هر مورد تصمیم بگیرید که آن را رد کنید، مقصد را ویرایش کنید، یا با `--overwrite` دوباره اجرا کنید.
  </Accordion>
  <Accordion title="Hermes بیرون از ~/.hermes قرار دارد">
    `--from /actual/path` (CLI) یا `--import-source /actual/path` (راه‌اندازی اولیه) را پاس دهید.
  </Accordion>
  <Accordion title="راه‌اندازی اولیه از وارد کردن روی یک راه‌اندازی موجود خودداری می‌کند">
    وارد کردن از راه‌اندازی اولیه به یک راه‌اندازی تازه نیاز دارد. یا وضعیت را بازنشانی کنید و دوباره راه‌اندازی اولیه را انجام دهید، یا مستقیماً از `openclaw migrate apply hermes` استفاده کنید که از `--overwrite` و کنترل صریح پشتیبان پشتیبانی می‌کند.
  </Accordion>
  <Accordion title="کلیدهای API وارد نشدند">
    `--include-secrets` لازم است، و فقط کلیدهای فهرست‌شده در بالا شناسایی می‌شوند. متغیرهای دیگر در `.env` نادیده گرفته می‌شوند.
  </Accordion>
</AccordionGroup>

## مرتبط

- [`openclaw migrate`](/fa/cli/migrate): مرجع کامل CLI، قرارداد plugin، و شکل‌های JSON.
- [راه‌اندازی اولیه](/fa/cli/onboard): جریان جادوگر و flagهای غیرتعاملی.
- [مهاجرت](/fa/install/migrating): انتقال یک نصب OpenClaw بین ماشین‌ها.
- [Doctor](/fa/gateway/doctor): بررسی سلامت پس از مهاجرت.
- [Workspace عامل](/fa/concepts/agent-workspace): محل قرارگیری `SOUL.md`، `AGENTS.md` و فایل‌های حافظه.
