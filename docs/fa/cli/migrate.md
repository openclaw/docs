---
read_when:
    - می‌خواهید از Hermes یا سامانهٔ عامل دیگری به OpenClaw مهاجرت کنید
    - شما در حال افزودن یک ارائه‌دهندهٔ مهاجرت متعلق به Plugin هستید
summary: مرجع CLI برای `openclaw migrate` (درون‌ریزی وضعیت از یک سامانه عامل دیگر)
title: مهاجرت کنید
x-i18n:
    generated_at: "2026-07-12T09:51:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1160373bfec09de8ec1bac6fbe8a218e8af7ec6a5896bc1fdfe6a0db158d50a1
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

وضعیت را از یک سامانهٔ عامل دیگر، از طریق ارائه‌دهندهٔ مهاجرت تحت مالکیت Plugin، وارد کنید. ارائه‌دهندگان همراه، Claude، Codex CLI و [Hermes](/fa/install/migrating-hermes) را پوشش می‌دهند؛ Pluginها می‌توانند ارائه‌دهندگان بیشتری ثبت کنند.

<Tip>
برای راهنماهای گام‌به‌گام ویژهٔ کاربران، به [مهاجرت از Claude](/fa/install/migrating-claude) و [مهاجرت از Hermes](/fa/install/migrating-hermes) مراجعه کنید. [مرکز مهاجرت](/fa/install/migrating) همهٔ مسیرها را فهرست می‌کند.
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

اجرای `openclaw migrate <provider>` بدون هیچ پرچم دیگری، پیش از اعمال، طرح را تهیه و پیش‌نمایش می‌کند و (در یک TTY) تأیید می‌خواهد. `openclaw migrate plan <provider>` و `openclaw migrate apply <provider>` پیش‌نمایش و اعمال را با همان پرچم‌ها به زیرفرمان‌های جداگانه تقسیم می‌کنند.

<ParamField path="<provider>" type="string">
  نام یک ارائه‌دهندهٔ مهاجرت ثبت‌شده، برای مثال `hermes`. برای مشاهدهٔ ارائه‌دهندگان نصب‌شده، `openclaw migrate list` را اجرا کنید.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  طرح را بسازید و بدون تغییر وضعیت خارج شوید.
</ParamField>
<ParamField path="--from <path>" type="string">
  پوشهٔ وضعیت مبدأ را بازنویسی کنید. مقدار پیش‌فرض Hermes برابر `~/.hermes`، مقدار پیش‌فرض Codex برابر `~/.codex` (یا `$CODEX_HOME`) و مقدار پیش‌فرض Claude برابر `~/.claude` است.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  اعتبارنامه‌های پشتیبانی‌شده را بدون درخواست تأیید وارد کنید. اعمال تعاملی پیش از واردکردن اعتبارنامه‌های احراز هویت شناسایی‌شده سؤال می‌کند و گزینهٔ بله به‌طور پیش‌فرض انتخاب شده است؛ در حالت غیرتعاملی، برای واردکردن آن‌ها همراه `--yes` به `--include-secrets` نیاز است.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  واردکردن اعتبارنامه‌های احراز هویت، از جمله درخواست تأیید تعاملی، را نادیده بگیرید.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  هنگامی که طرح تعارض گزارش می‌کند، به عملیات اعمال اجازه دهید مقصدهای موجود را جایگزین کند.
</ParamField>
<ParamField path="--yes" type="boolean">
  درخواست تأیید را نادیده بگیرید. در حالت غیرتعاملی الزامی است.
</ParamField>
<ParamField path="--skill <name>" type="string">
  یک مورد کپی مهارت را با نام مهارت یا شناسهٔ مورد انتخاب کنید. برای مهاجرت چند مهارت، پرچم را تکرار کنید. در صورت حذف این پرچم، مهاجرت‌های تعاملی Codex یک انتخاب‌گر کادر تأیید نمایش می‌دهند و مهاجرت‌های غیرتعاملی همهٔ مهارت‌های برنامه‌ریزی‌شده را نگه می‌دارند.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  یک مورد نصب Plugin مربوط به Codex را با نام Plugin یا شناسهٔ مورد انتخاب کنید. برای مهاجرت چند Plugin مربوط به Codex، پرچم را تکرار کنید. در صورت حذف این پرچم، مهاجرت‌های تعاملی Codex یک انتخاب‌گر کادر تأیید بومی Plugin مربوط به Codex نمایش می‌دهند و مهاجرت‌های غیرتعاملی همهٔ Pluginهای برنامه‌ریزی‌شده را نگه می‌دارند. این گزینه فقط برای Pluginهای `openai-curated` مربوط به Codex که از مبدأ نصب شده‌اند و موجودی app-server مربوط به Codex آن‌ها را شناسایی کرده است کاربرد دارد.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  فقط Codex. پیش از برنامه‌ریزی فعال‌سازی بومی Plugin، یک پیمایش تازهٔ `app/list` را روی app-server مبدأ Codex اجباری می‌کند. برای سریع نگه‌داشتن برنامه‌ریزی مهاجرت، به‌طور پیش‌فرض غیرفعال است.
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  مسیر بایگانی یا پوشهٔ پشتیبان پیش از مهاجرت. بدون تغییر به `openclaw backup create` ارسال می‌شود.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  از پشتیبان‌گیری پیش از اعمال صرف‌نظر کنید. هنگامی که وضعیت محلی OpenClaw وجود دارد، به `--force` نیاز دارد.
</ParamField>
<ParamField path="--force" type="boolean">
  هنگامی که عملیات اعمال در غیر این صورت از صرف‌نظرکردن از پشتیبان‌گیری خودداری می‌کند، همراه `--no-backup` الزامی است.
</ParamField>
<ParamField path="--json" type="boolean">
  طرح یا نتیجهٔ اعمال را به‌صورت JSON چاپ کنید. با `--json` و بدون `--yes`، عملیات اعمال طرح را چاپ می‌کند و وضعیت را تغییر نمی‌دهد.
</ParamField>

## مدل ایمنی

`openclaw migrate` ابتدا پیش‌نمایش ارائه می‌کند.

<AccordionGroup>
  <Accordion title="پیش‌نمایش پیش از اعمال">
    ارائه‌دهنده پیش از هر تغییری، طرحی موردبه‌مورد بازمی‌گرداند که شامل تعارض‌ها، موارد نادیده‌گرفته‌شده و موارد حساس است. طرح‌های JSON، خروجی اعمال و گزارش‌های مهاجرت، کلیدهای تودرتویی را که شبیه اسرار هستند، مانند کلیدهای API، توکن‌ها، سرآیندهای مجوزدهی، کوکی‌ها و گذرواژه‌ها، پنهان می‌کنند.

    `openclaw migrate apply <provider>` طرح را پیش‌نمایش می‌کند و پیش از تغییر وضعیت درخواست تأیید می‌دهد، مگر اینکه `--yes` تنظیم شده باشد. در حالت غیرتعاملی، عملیات اعمال به `--yes` نیاز دارد.

  </Accordion>
  <Accordion title="پشتیبان‌ها">
    عملیات اعمال پیش از اجرای مهاجرت، یک پشتیبان OpenClaw ایجاد و صحت آن را تأیید می‌کند. اگر هنوز هیچ وضعیت محلی OpenClaw وجود نداشته باشد، مرحلهٔ پشتیبان‌گیری نادیده گرفته می‌شود و مهاجرت ادامه می‌یابد. برای صرف‌نظرکردن از پشتیبان‌گیری در صورت وجود وضعیت، هر دو گزینهٔ `--no-backup` و `--force` را ارسال کنید.
  </Accordion>
  <Accordion title="تعارض‌ها">
    هنگامی که طرح دارای تعارض باشد، عملیات اعمال از ادامه خودداری می‌کند. طرح را بررسی کنید و اگر جایگزینی مقصدهای موجود عمدی است، دوباره با `--overwrite` اجرا کنید. ارائه‌دهندگان ممکن است همچنان برای فایل‌های بازنویسی‌شده، پشتیبان‌های سطح مورد را در پوشهٔ گزارش مهاجرت بنویسند.
  </Accordion>
  <Accordion title="اسرار">
    عملیات اعمال تعاملی می‌پرسد آیا اعتبارنامه‌های احراز هویت شناسایی‌شده وارد شوند یا نه و گزینهٔ بله به‌طور پیش‌فرض انتخاب شده است. برای نادیده‌گرفتن آن‌ها از `--no-auth-credentials` و برای واردکردن بدون نظارت اعتبارنامه‌ها همراه `--yes` از `--include-secrets` استفاده کنید.
  </Accordion>
</AccordionGroup>

## ارائه‌دهندهٔ Claude

ارائه‌دهندهٔ همراه Claude به‌طور پیش‌فرض وضعیت Claude Code را در `~/.claude` شناسایی می‌کند. برای واردکردن یک پوشهٔ خانه یا ریشهٔ پروژهٔ مشخص Claude Code، از `--from <path>` استفاده کنید.

<Tip>
برای راهنمای گام‌به‌گام ویژهٔ کاربران، به [مهاجرت از Claude](/fa/install/migrating-claude) مراجعه کنید.
</Tip>

### مواردی که Claude وارد می‌کند

- `CLAUDE.md` و `.claude/CLAUDE.md` پروژه به فضای کاری عامل OpenClaw (`AGENTS.md`).
- محتوای `~/.claude/CLAUDE.md` کاربر که به `USER.md` فضای کاری افزوده می‌شود.
- تعریف‌های سرور MCP از `.mcp.json` پروژه، `~/.claude.json` مربوط به Claude Code (شامل ورودی‌های مختص هر پروژهٔ آن) و `claude_desktop_config.json` مربوط به Claude Desktop.
- پوشه‌های مهارت Claude که شامل `SKILL.md` هستند (`~/.claude/skills` کاربر و `.claude/skills` پروژه).
- فایل‌های Markdown فرمان Claude (`~/.claude/commands` کاربر و `.claude/commands` پروژه) که به مهارت‌های OpenClaw با امکان فراخوانی صرفاً دستی تبدیل می‌شوند.

### وضعیت بایگانی و بازبینی دستی

قلاب‌ها، مجوزها، پیش‌فرض‌های محیط، `CLAUDE.local.md` پروژه، `.claude/rules`، پوشه‌های `agents/` کاربر و پروژه و تاریخچهٔ پروژه (`projects`، `cache` و `plans` زیر `~/.claude`) در گزارش مهاجرت حفظ می‌شوند یا به‌عنوان موارد نیازمند بازبینی دستی گزارش می‌شوند. OpenClaw قلاب‌ها را اجرا نمی‌کند، فهرست‌های مجاز گسترده را کپی نمی‌کند و وضعیت اعتبارنامهٔ OAuth/Desktop را به‌طور خودکار وارد نمی‌کند.

## ارائه‌دهندهٔ Codex

ارائه‌دهندهٔ همراه Codex به‌طور پیش‌فرض وضعیت Codex CLI را در `~/.codex` یا، هنگامی که متغیر محیطی `CODEX_HOME` تنظیم شده است، در `CODEX_HOME` شناسایی می‌کند. برای تهیهٔ موجودی از یک پوشهٔ خانهٔ مشخص Codex، از `--from <path>` استفاده کنید.

هنگامی که به چارچوب Codex در OpenClaw منتقل می‌شوید و می‌خواهید دارایی‌های شخصی مفید Codex CLI را به‌صورت آگاهانه ارتقا دهید، از این ارائه‌دهنده استفاده کنید. اجرای محلی app-server مربوط به Codex از یک `CODEX_HOME` مختص هر عامل استفاده می‌کند، بنابراین به‌طور پیش‌فرض `~/.codex` شخصی شما را نمی‌خواند. `HOME` عادی فرایند همچنان به ارث می‌رسد؛ بنابراین Codex می‌تواند Skills مشترک و ورودی‌های بازار Plugin در `$HOME/.agents/*` را ببیند و زیرفرایندها می‌توانند پیکربندی و توکن‌های پوشهٔ خانهٔ کاربر را پیدا کنند.

اجرای `openclaw migrate codex` در یک پایانهٔ تعاملی، طرح کامل را پیش‌نمایش می‌کند و سپس پیش از تأیید نهایی اعمال، انتخاب‌گرهای کادر تأیید را باز می‌کند. ابتدا برای موارد کپی مهارت درخواست انتخاب می‌شود. برای انتخاب گروهی از `Toggle all on` یا `Toggle all off` استفاده کنید. برای تغییر وضعیت ردیف‌ها کلید فاصله را فشار دهید، یا برای فعال‌کردن ردیف برجسته و ادامه‌دادن Enter را فشار دهید. مهارت‌های برنامه‌ریزی‌شده در ابتدا علامت‌خورده‌اند، مهارت‌های دارای تعارض در ابتدا بدون علامت هستند و `Skip for now` کپی مهارت‌ها را برای این اجرا نادیده می‌گیرد، اما انتخاب Plugin همچنان ادامه می‌یابد. هنگامی که Pluginهای گزینش‌شدهٔ Codex که از مبدأ نصب شده‌اند قابل مهاجرت باشند و `--plugin` ارائه نشده باشد، مهاجرت سپس برای فعال‌سازی بومی Plugin مربوط به Codex بر اساس نام Plugin درخواست انتخاب می‌کند. موارد Plugin در ابتدا علامت‌خورده‌اند، مگر اینکه پیکربندی مقصد Plugin مربوط به Codex در OpenClaw از قبل آن Plugin را داشته باشد. Pluginهای موجود در مقصد در ابتدا بدون علامت هستند و راهنمای تعارضی مانند `conflict: plugin exists` نمایش می‌دهند؛ برای اینکه در آن اجرا هیچ Plugin بومی Codex مهاجرت داده نشود، `Toggle all off` را انتخاب کنید، یا برای توقف پیش از اعمال، `Skip for now` را انتخاب کنید.

برای اجراهای اسکریپتی یا دقیق، یک یا چند مهارت یا Plugin را صریحاً انتخاب کنید:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### مواردی که Codex وارد می‌کند

- پوشه‌های مهارت Codex CLI زیر `$CODEX_HOME/skills`، به‌استثنای حافظهٔ نهان `.system` مربوط به Codex.
- AgentSkills شخصی زیر `$HOME/.agents/skills` که برای مالکیت مختص هر عامل در فضای کاری عامل فعلی OpenClaw کپی می‌شوند.
- Pluginهای `openai-curated` مربوط به Codex که از مبدأ نصب شده‌اند و از طریق `plugin/list` در app-server مربوط به Codex شناسایی می‌شوند. برنامه‌ریزی برای هر Plugin نصب‌شده و فعال، `plugin/read` را می‌خواند.

مهاجرت Pluginهای متکی بر برنامه، کنترل‌های بیشتری دارد:

- Pluginهای متکی بر برنامه مستلزم آن هستند که حساب app-server مبدأ Codex یک حساب اشتراک ChatGPT باشد. پاسخ‌های مربوط به حساب‌های غیر ChatGPT یا نبود حساب، با دلیل `codex_subscription_required` نادیده گرفته می‌شوند.
- به‌طور پیش‌فرض، مهاجرت `app/list` مبدأ را فراخوانی نمی‌کند؛ بنابراین Pluginهای متکی بر برنامه که از کنترل حساب عبور می‌کنند، بدون تأیید دسترس‌پذیری برنامه در مبدأ برنامه‌ریزی می‌شوند و خطاهای انتقال در جست‌وجوی حساب با دلیل `codex_account_unavailable` نادیده گرفته می‌شوند.
- برای اجباری‌کردن یک تصویر لحظه‌ای تازه از `app/list` مبدأ و الزام حضور، فعال‌بودن و دردسترس‌بودن همهٔ برنامه‌های تحت مالکیت پیش از برنامه‌ریزی فعال‌سازی بومی، `--verify-plugin-apps` را ارسال کنید. در این حالت، خطاهای انتقال در جست‌وجوی حساب به تأیید موجودی برنامهٔ مبدأ واگذار می‌شوند. تصویر لحظه‌ای فقط برای فرایند فعلی در حافظه نگه داشته می‌شود؛ هرگز در خروجی مهاجرت یا پیکربندی مقصد نوشته نمی‌شود.

Pluginهای غیرفعال، جزئیات ناخوانای Plugin، حساب‌های مبدأ محدودشده به‌واسطهٔ اشتراک و (هنگامی که `--verify-plugin-apps` تنظیم شده است) برنامه‌های مفقود، غیرفعال یا دردسترس‌نبودنی، به‌جای ورودی‌های پیکربندی مقصد به موارد دستی نادیده‌گرفته‌شده با دلایل نوع‌دار تبدیل می‌شوند. عملیات اعمال برای هر Plugin واجد شرایط انتخاب‌شده، `plugin/install` مربوط به app-server را فراخوانی می‌کند، حتی اگر app-server مقصد از قبل آن Plugin را نصب‌شده و فعال گزارش کند. Pluginهای مهاجرت‌داده‌شدهٔ Codex فقط در نشست‌هایی قابل استفاده هستند که چارچوب بومی Codex را انتخاب می‌کنند؛ آن‌ها در اختیار اجراهای ارائه‌دهندهٔ OpenClaw، پیوندهای مکالمهٔ ACP یا دیگر چارچوب‌ها قرار نمی‌گیرند.

### وضعیت Codex نیازمند بازبینی دستی

`config.toml` مربوط به Codex، `hooks/hooks.json` بومی، بازارهای غیرگزینش‌شده، بسته‌های Plugin ذخیره‌شده در حافظهٔ نهان که Plugin گزینش‌شدهٔ نصب‌شده از مبدأ نیستند و Pluginهای نصب‌شده از مبدأ که کنترل اشتراک مبدأ را با موفقیت پشت سر نمی‌گذارند، به‌طور خودکار فعال نمی‌شوند. هنگامی که `--verify-plugin-apps` تنظیم شده باشد، Pluginهایی که کنترل موجودی برنامهٔ مبدأ را با موفقیت پشت سر نمی‌گذارند نیز نادیده گرفته می‌شوند. همهٔ این موارد برای بازبینی دستی کپی می‌شوند یا در گزارش مهاجرت گزارش می‌شوند.

برای Pluginهای گزینش‌شدهٔ نصب‌شده از مبدأ که مهاجرت داده می‌شوند، عملیات اعمال موارد زیر را می‌نویسد:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- برای هر Plugin انتخاب‌شده، یک ورودی صریح Plugin با `marketplaceName: "openai-curated"` و `pluginName`

مهاجرت هرگز `plugins["*"]` را نمی‌نویسد و مسیرهای حافظهٔ نهان بازار محلی را ذخیره نمی‌کند.

Pluginهای ردشده در پیکربندی مقصد نوشته نمی‌شوند. خطاهای اشتراک در سمت مبدأ، روی موارد دستی با دلایل نوع‌دار گزارش می‌شوند: `codex_subscription_required`، `codex_account_unavailable`، `plugin_disabled` یا `plugin_read_unavailable`. با `--verify-plugin-apps`، خطاهای فهرست برنامه‌های مبدأ نیز ممکن است به‌صورت `app_inaccessible`، `app_disabled`، `app_missing` یا `app_inventory_unavailable` ظاهر شوند. نصب‌های نیازمند احراز هویت در سمت مقصد، روی مورد Plugin تحت‌تأثیر با `status: "skipped"`، `reason: "auth_required"` و شناسه‌های پاک‌سازی‌شدهٔ برنامه گزارش می‌شوند؛ ورودی‌های صریح پیکربندی آن‌ها تا زمانی که دوباره مجوز بدهید و فعالشان کنید، به‌صورت غیرفعال نوشته می‌شوند. سایر خطاهای نصب، نتایج `error` محدود به همان مورد هستند.

اگر هنگام برنامه‌ریزی، فهرست Pluginهای app-server در Codex در دسترس نباشد، مهاجرت به‌جای ناموفق‌کردن کل فرایند، از موارد توصیه‌ای ذخیره‌شده در حافظهٔ نهانِ بسته استفاده می‌کند.

## ارائه‌دهندهٔ Hermes

ارائه‌دهندهٔ همراه Hermes به‌طور پیش‌فرض وضعیت را در `~/.hermes` شناسایی می‌کند. اگر Hermes در جای دیگری قرار دارد، از `--from <path>` استفاده کنید.

### مواردی که Hermes وارد می‌کند

- پیکربندی مدل پیش‌فرض از `config.yaml`.
- ارائه‌دهندگان مدل پیکربندی‌شده و نقاط پایانی سفارشی سازگار با OpenAI از `providers` و `custom_providers`.
- تعریف‌های سرور MCP از `mcp_servers` یا `mcp.servers`.
- فایل‌های `SOUL.md` و `AGENTS.md` به فضای کاری عامل OpenClaw.
- محتوای `memories/MEMORY.md` و `memories/USER.md` که به فایل‌های حافظهٔ فضای کاری افزوده می‌شود.
- پیش‌فرض‌های پیکربندی حافظه برای حافظهٔ فایلی OpenClaw، به‌همراه موارد بایگانی یا بازبینی دستی برای ارائه‌دهندگان حافظهٔ خارجی مانند Honcho.
- Skillsهایی که در مسیر `skills/<name>/` شامل فایل `SKILL.md` هستند.
- مقادیر پیکربندی هر Skill از `skills.config`.
- اطلاعات احراز هویت OAuth مربوط به OpenAI در OpenCode از فایل `auth.json` این محصول، هنگامی که مهاجرت تعاملی اطلاعات احراز هویت پذیرفته شود یا `--include-secrets` تنظیم شده باشد. ورودی‌های OAuth در `auth.json` مربوط به Hermes، وضعیت قدیمی محسوب می‌شوند و برای احراز هویت مجدد دستی OpenAI یا ترمیم با doctor گزارش می‌شوند.
- کلیدهای API و توکن‌های پشتیبانی‌شده از فایل `.env` در Hermes و فایل `auth.json` در OpenCode، هنگامی که مهاجرت تعاملی اطلاعات احراز هویت پذیرفته شود یا `--include-secrets` تنظیم شده باشد.

### کلیدهای پشتیبانی‌شدهٔ `.env`

`AI_GATEWAY_API_KEY`، `ALIBABA_API_KEY`، `ANTHROPIC_API_KEY`، `ARCEEAI_API_KEY`، `CEREBRAS_API_KEY`، `CHUTES_API_KEY`، `CLOUDFLARE_AI_GATEWAY_API_KEY`، `COPILOT_GITHUB_TOKEN`، `DASHSCOPE_API_KEY`، `DEEPINFRA_API_KEY`، `DEEPSEEK_API_KEY`، `FIREWORKS_API_KEY`، `GEMINI_API_KEY`، `GH_TOKEN`، `GITHUB_TOKEN`، `GLM_API_KEY`، `GOOGLE_API_KEY`، `GROQ_API_KEY`، `HF_TOKEN`، `HUGGINGFACE_HUB_TOKEN`، `KILOCODE_API_KEY`، `KIMICODE_API_KEY`، `KIMI_API_KEY`، `MINIMAX_API_KEY`، `MINIMAX_CODING_API_KEY`، `MISTRAL_API_KEY`، `MODELSTUDIO_API_KEY`، `MOONSHOT_API_KEY`، `NVIDIA_API_KEY`، `OPENAI_API_KEY`، `OPENCODE_API_KEY`، `OPENCODE_GO_API_KEY`، `OPENCODE_ZEN_API_KEY`، `OPENROUTER_API_KEY`، `QIANFAN_API_KEY`، `QWEN_API_KEY`، `TOGETHER_API_KEY`، `VENICE_API_KEY`، `XAI_API_KEY`، `XIAOMI_API_KEY`، `ZAI_API_KEY`، `Z_AI_API_KEY`.

### وضعیت صرفاً بایگانی‌شونده

وضعیت Hermes که OpenClaw نمی‌تواند آن را با ایمنی تفسیر کند، برای بازبینی دستی در گزارش مهاجرت کپی می‌شود، اما در پیکربندی زنده یا اطلاعات احراز هویت OpenClaw بارگذاری نمی‌شود. این کار وضعیت مبهم یا ناامن را حفظ می‌کند، بدون اینکه وانمود شود OpenClaw می‌تواند آن را به‌طور خودکار اجرا کند یا قابل‌اعتماد بداند: `plugins/`، `sessions/`، `logs/`، `cron/`، `mcp-tokens/`، `state.db`.

### پس از اعمال

```bash
openclaw doctor
```

## قرارداد Plugin

منابع مهاجرت، Plugin هستند. هر Plugin شناسه‌های ارائه‌دهندهٔ خود را در `openclaw.plugin.json` اعلام می‌کند:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

در زمان اجرا، Plugin تابع `api.registerMigrationProvider(...)` را فراخوانی می‌کند. ارائه‌دهنده، `detect`، `plan` و `apply` را پیاده‌سازی می‌کند. هسته مسئول هماهنگ‌سازی CLI، سیاست پشتیبان‌گیری، اعلان‌ها، خروجی JSON و پیش‌بررسی تداخل است. هسته برنامهٔ بازبینی‌شده را به `apply(ctx, plan)` می‌فرستد و ارائه‌دهندگان فقط در صورتی می‌توانند برای سازگاری برنامه را بازسازی کنند که آن آرگومان وجود نداشته باشد.

Pluginهای ارائه‌دهنده می‌توانند از `openclaw/plugin-sdk/migration` برای ساخت موارد و شمارش خلاصه، و از `openclaw/plugin-sdk/migration-runtime` برای کپی فایل با آگاهی از تداخل، کپی گزارش‌های صرفاً بایگانی‌شونده، پوشش‌دهنده‌های زمان اجرای پیکربندیِ ذخیره‌شده در حافظهٔ نهان و گزارش‌های مهاجرت استفاده کنند.

## یکپارچه‌سازی راه‌اندازی اولیه

هنگامی که یک ارائه‌دهنده منبع شناخته‌شده‌ای را شناسایی کند، راه‌اندازی اولیه می‌تواند مهاجرت را پیشنهاد دهد. هر دو دستور `openclaw onboard --flow import` و `openclaw setup --wizard --import-from hermes` از همان ارائه‌دهندهٔ مهاجرت Plugin استفاده می‌کنند و همچنان پیش از اعمال، پیش‌نمایش را نشان می‌دهند.

<Note>
واردکردن در راه‌اندازی اولیه به یک راه‌اندازی تازهٔ OpenClaw نیاز دارد. اگر از قبل وضعیت محلی دارید، ابتدا پیکربندی، اطلاعات احراز هویت، نشست‌ها و فضای کاری را بازنشانی کنید. واردکردن با پشتیبان‌گیری و بازنویسی یا ادغام برای راه‌اندازی‌های موجود، تحت کنترل قابلیت است.
</Note>

## مرتبط

- [مهاجرت از Hermes](/fa/install/migrating-hermes): راهنمای گام‌به‌گام برای کاربر.
- [مهاجرت از Claude](/fa/install/migrating-claude): راهنمای گام‌به‌گام برای کاربر.
- [مهاجرت](/fa/install/migrating): انتقال OpenClaw به یک دستگاه جدید.
- [Doctor](/fa/gateway/doctor): بررسی سلامت پس از اعمال مهاجرت.
- [Pluginها](/fa/tools/plugin): نصب و ثبت Plugin.
