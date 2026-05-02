---
read_when:
    - شما در حال انتقال OpenClaw به یک لپ‌تاپ یا سرور جدید هستید
    - از سامانهٔ عامل دیگری می‌آیید و می‌خواهید وضعیت را حفظ کنید
    - شما در حال ارتقای یک Plugin به‌صورت درجا هستید
summary: 'مرکز مهاجرت: واردسازی‌های بین‌سامانه‌ای، جابه‌جایی‌های ماشین‌به‌ماشین، و ارتقاهای Plugin'
title: راهنمای مهاجرت
x-i18n:
    generated_at: "2026-05-02T11:52:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: e447e38cf0086603a7b30ee5204e63cc8227ebc7a56add26d06ac2798a23e26f
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw از سه مسیر مهاجرت پشتیبانی می‌کند: وارد کردن از یک سامانه عامل دیگر، انتقال نصب موجود به یک دستگاه جدید، و ارتقای یک Plugin در همان محل.

## وارد کردن از یک سامانه عامل دیگر

از ارائه‌دهندگان مهاجرت همراه استفاده کنید تا دستورالعمل‌ها، سرورهای MCP، skills، پیکربندی مدل، و کلیدهای API (با انتخاب کاربر) را به OpenClaw بیاورید. طرح‌ها پیش از هر تغییری پیش‌نمایش می‌شوند، اسرار در گزارش‌ها پنهان می‌شوند، و اعمال تغییرات با یک نسخه پشتیبان تأییدشده پشتیبانی می‌شود.

<CardGroup cols={2}>
  <Card title="Migrating from Claude" href="/fa/install/migrating-claude" icon="brain">
    وضعیت Claude Code و Claude Desktop را وارد کنید، از جمله `CLAUDE.md`، سرورهای MCP، skills، و فرمان‌های پروژه.
  </Card>
  <Card title="Migrating from Hermes" href="/fa/install/migrating-hermes" icon="feather">
    پیکربندی Hermes، ارائه‌دهندگان، سرورهای MCP، حافظه، skills، و کلیدهای پشتیبانی‌شده `.env` را وارد کنید.
  </Card>
</CardGroup>

نقطه ورود CLI، [`openclaw migrate`](/fa/cli/migrate) است. فرایند راه‌اندازی اولیه نیز می‌تواند وقتی یک منبع شناخته‌شده را تشخیص می‌دهد (`openclaw onboard --flow import`)، مهاجرت را پیشنهاد کند.

## انتقال OpenClaw به یک دستگاه جدید

برای حفظ موارد زیر، **دایرکتوری وضعیت** (به‌صورت پیش‌فرض `~/.openclaw/`) و **محیط کاری** خود را کپی کنید:

- **پیکربندی** — `openclaw.json` و همه تنظیمات gateway.
- **احراز هویت** — `auth-profiles.json` برای هر عامل (کلیدهای API به‌همراه OAuth)، به‌علاوه هر وضعیت کانال یا ارائه‌دهنده زیر `credentials/`.
- **نشست‌ها** — تاریخچه گفتگو و وضعیت عامل.
- **وضعیت کانال** — ورود WhatsApp، نشست Telegram، و موارد مشابه.
- **فایل‌های محیط کاری** — `MEMORY.md`، `USER.md`، skills، و promptها.

<Tip>
برای تأیید مسیر دایرکتوری وضعیت خود، روی دستگاه قدیمی `openclaw status` را اجرا کنید. پروفایل‌های سفارشی از `~/.openclaw-<profile>/` یا مسیری که از طریق `OPENCLAW_STATE_DIR` تنظیم شده استفاده می‌کنند.
</Tip>

### مراحل مهاجرت

<Steps>
  <Step title="Stop the gateway and back up">
    روی دستگاه **قدیمی**، gateway را متوقف کنید تا فایل‌ها هنگام کپی تغییر نکنند، سپس آرشیو بگیرید:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    اگر از چند پروفایل استفاده می‌کنید (برای مثال `~/.openclaw-work`)، هرکدام را جداگانه آرشیو کنید.

  </Step>

  <Step title="Install OpenClaw on the new machine">
    CLI (و در صورت نیاز Node) را روی دستگاه جدید [نصب](/fa/install) کنید. اگر راه‌اندازی اولیه یک `~/.openclaw/` تازه بسازد مشکلی نیست. در مرحله بعد آن را بازنویسی می‌کنید.
  </Step>

  <Step title="Copy state directory and workspace">
    آرشیو را از طریق `scp`، `rsync -a`، یا یک درایو خارجی منتقل کنید، سپس استخراج کنید:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    مطمئن شوید دایرکتوری‌های مخفی هم شامل شده‌اند و مالکیت فایل‌ها با کاربری که gateway را اجرا خواهد کرد مطابقت دارد.

  </Step>

  <Step title="Run doctor and verify">
    روی دستگاه جدید، برای اعمال مهاجرت‌های پیکربندی و تعمیر سرویس‌ها، [Doctor](/fa/gateway/doctor) را اجرا کنید:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

اگر Telegram یا Discord از fallback پیش‌فرض env (`TELEGRAM_BOT_TOKEN` یا `DISCORD_BOT_TOKEN`) استفاده می‌کند، بدون چاپ مقدارهای محرمانه، بررسی کنید که `.env` دایرکتوری وضعیت مهاجرت‌داده‌شده این کلیدها را دارد:

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

`openclaw doctor` همچنین زمانی هشدار می‌دهد که یک حساب پیش‌فرض فعال Telegram یا Discord توکن پیکربندی‌شده نداشته باشد و متغیر env متناظر در دسترس فرایند doctor نباشد.

### مشکلات رایج

<AccordionGroup>
  <Accordion title="Profile or state-dir mismatch">
    اگر gateway قدیمی از `--profile` یا `OPENCLAW_STATE_DIR` استفاده می‌کرد و gateway جدید این کار را نمی‌کند، کانال‌ها به‌صورت خارج‌شده از حساب دیده می‌شوند و نشست‌ها خالی خواهند بود. gateway را با همان پروفایل یا دایرکتوری وضعیتی که مهاجرت داده‌اید اجرا کنید، سپس دوباره `openclaw doctor` را اجرا کنید.
  </Accordion>

  <Accordion title="Copying only openclaw.json">
    فایل پیکربندی به‌تنهایی کافی نیست. پروفایل‌های احراز هویت مدل زیر `agents/<agentId>/agent/auth-profiles.json` قرار دارند، و وضعیت کانال و ارائه‌دهنده زیر `credentials/` قرار دارد. همیشه **کل** دایرکتوری وضعیت را مهاجرت دهید.
  </Accordion>

  <Accordion title="Permissions and ownership">
    اگر با root کپی کرده‌اید یا کاربر را تغییر داده‌اید، gateway ممکن است نتواند credentialها را بخواند. مطمئن شوید دایرکتوری وضعیت و محیط کاری متعلق به کاربری هستند که gateway را اجرا می‌کند.
  </Accordion>

  <Accordion title="Remote mode">
    اگر رابط کاربری شما به یک gateway **راه‌دور** اشاره می‌کند، میزبان راه‌دور مالک نشست‌ها و محیط کاری است. خود میزبان gateway را مهاجرت دهید، نه لپ‌تاپ محلی خود را. [پرسش‌های متداول](/fa/help/faq#where-things-live-on-disk) را ببینید.
  </Accordion>

  <Accordion title="Secrets in backups">
    دایرکتوری وضعیت شامل پروفایل‌های احراز هویت، credentialهای کانال، و وضعیت سایر ارائه‌دهندگان است. نسخه‌های پشتیبان را رمزنگاری‌شده نگه دارید، از کانال‌های انتقال ناامن پرهیز کنید، و اگر به افشا شدن مشکوک هستید کلیدها را چرخش دهید.
  </Accordion>
</AccordionGroup>

### فهرست بررسی تأیید

روی دستگاه جدید، تأیید کنید:

- [ ] `openclaw status` نشان می‌دهد gateway در حال اجرا است.
- [ ] کانال‌ها همچنان متصل هستند (نیازی به جفت‌سازی دوباره نیست).
- [ ] داشبورد باز می‌شود و نشست‌های موجود را نشان می‌دهد.
- [ ] فایل‌های محیط کاری (حافظه، پیکربندی‌ها) وجود دارند.

## ارتقای یک Plugin در همان محل

ارتقاهای درجا برای Plugin همان شناسه Plugin و کلیدهای پیکربندی را حفظ می‌کنند، اما ممکن است وضعیت روی دیسک را به چیدمان فعلی منتقل کنند. راهنماهای ارتقای مختص Plugin کنار کانال‌های آن‌ها قرار دارند:

- [مهاجرت Matrix](/fa/channels/matrix-migration): محدودیت‌های بازیابی وضعیت رمزنگاری‌شده، رفتار snapshot خودکار، و فرمان‌های بازیابی دستی.

## مرتبط

- [`openclaw migrate`](/fa/cli/migrate): مرجع CLI برای وارد کردن بین سامانه‌ها.
- [نمای کلی نصب](/fa/install): همه روش‌های نصب.
- [Doctor](/fa/gateway/doctor): بررسی سلامت پس از مهاجرت.
- [حذف نصب](/fa/install/uninstall): حذف پاکیزه OpenClaw.
