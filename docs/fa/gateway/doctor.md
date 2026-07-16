---
read_when:
    - افزودن یا تغییر مهاجرت‌های doctor
    - معرفی تغییرات ناسازگار در پیکربندی
sidebarTitle: Doctor
summary: 'دستور Doctor: بررسی‌های سلامت، مهاجرت‌های پیکربندی و مراحل تعمیر'
title: دکتر
x-i18n:
    generated_at: "2026-07-16T16:52:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e5c37c31332a9128767ebf6a853aa618511b9eda7f5840a4f863ec705c58421a
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ابزار تعمیر و مهاجرت OpenClaw است. این ابزار پیکربندی/وضعیت منسوخ را اصلاح می‌کند، سلامت را بررسی می‌کند و مراحل عملی تعمیر را ارائه می‌دهد.

## شروع سریع

```bash
openclaw doctor
```

### حالت‌های بدون رابط و خودکارسازی

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    پذیرش پیش‌فرض‌ها بدون درخواست تأیید (از جمله مراحل راه‌اندازی مجدد/سرویس/تعمیر sandbox، در صورت کاربرد).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    اعمال تعمیرات پیشنهادی بدون درخواست تأیید (`--repair` یک نام مستعار است).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    اجرای بررسی‌های ساختاریافتهٔ سلامت برای CI یا خودکارسازی پیش‌بررسی. فقط‌خواندنی: بدون
    درخواست تأیید، تعمیر، مهاجرت، راه‌اندازی مجدد یا نوشتن وضعیت.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    اعمال تعمیرات تهاجمی نیز (پیکربندی‌های سفارشی ناظر را بازنویسی می‌کند).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    اجرا بدون درخواست تأیید و با اعمال فقط مهاجرت‌های امن (عادی‌سازی پیکربندی +
    جابه‌جایی وضعیت روی دیسک). اقدامات راه‌اندازی مجدد/سرویس/sandbox را که به تأیید
    انسانی نیاز دارند، نادیده می‌گیرد. مهاجرت‌های وضعیت قدیمی همچنان هنگام شناسایی به‌طور خودکار اجرا می‌شوند.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    پویش سرویس‌های سیستم برای نصب‌های اضافی Gateway ‏(launchd/systemd/schtasks).

  </Tab>
</Tabs>

برای بررسی تغییرات پیش از نوشتن، ابتدا فایل پیکربندی را باز کنید:

```bash
cat ~/.openclaw/openclaw.json
```

## حالت lint فقط‌خواندنی

`openclaw doctor --lint` همتای مناسب خودکارسازیِ
`openclaw doctor --fix` است. هر دو از رجیستری یکسان قواعد Doctor استفاده می‌کنند، اما
قواعد را به یک روش انتخاب یا اجرا نمی‌کنند:

| حالت                     | درخواست تأیید   | نوشتن پیکربندی/وضعیت     | خروجی                 | کاربرد                      |
| ------------------------ | --------- | ----------------------- | ---------------------- | ------------------------------- |
| `openclaw doctor`        | بله       | خیر                      | گزارش سلامت کاربرپسند | بررسی وضعیت توسط انسان         |
| `openclaw doctor --fix`  | گاهی | بله، طبق خط‌مشی تعمیر | گزارش کاربرپسند تعمیر    | اعمال تعمیرات تأییدشده       |
| `openclaw doctor --lint` | خیر        | خیر                      | یافته‌های ساختاریافته    | CI، پیش‌بررسی و دروازه‌های بازبینی |

`doctor --lint` پیش‌فرض، نمایهٔ گسترده و امن خودکارسازی را اجرا می‌کند: بررسی‌هایی که
ایستا، محلی و برای خروجی CI یا پیش‌بررسی مفیدند. بررسی‌های اختیاری را که
مشورتی، حساس به محیط، وابسته به سرویس زنده، مربوط به موجودی حساب/فضای کاری
یا پاک‌سازی تاریخی هستند، نادیده می‌گیرد. برای ممیزی کامل lint ثبت‌شده،
شامل آن بررسی‌های اختیاری، از `doctor --lint --all` و برای بررسی
هدفمند از `--only <id>` استفاده کنید.

`doctor --fix` از نمایهٔ پیش‌فرض lint استفاده نمی‌کند و
`--all` را نمی‌پذیرد. این فرمان مسیر مرتب‌شدهٔ تعمیر Doctor را اجرا می‌کند: بررسی‌های سلامت مدرن ممکن است
پیاده‌سازی اختیاری `repair()` را ارائه دهند و بخش‌های قدیمی‌تر همچنان از جریان تعمیر
قدیمی Doctor استفاده می‌کنند. برخی یافته‌های lint عمداً فقط تشخیصی هستند؛ بنابراین
ظاهرشدن یک بررسی در `--lint --all` به این معنا نیست که `--fix` آن بخش را تغییر خواهد داد.
این قرارداد `detect()` (گزارش یافته‌ها) را از `repair()` (گزارش
تغییرات/تفاوت‌ها/عوارض جانبی) جدا می‌کند و بدون تبدیل بررسی‌های lint به برنامه‌ریزهای تغییر،
راه را برای `doctor --fix --dry-run` آینده باز نگه می‌دارد.

برخی بررسی‌های داخلی به‌طور پیش‌فرض در داخل غیرفعال‌اند تا برای
`--all`، `--only` و جریان‌های تعمیر Doctor در دسترس بمانند، بدون آنکه بخشی از نمایهٔ پیش‌فرض
خودکارسازی `doctor --lint` شوند. شدت یافته همچنان برای هر
یافته منتشر می‌شود (`info`، `warning` یا `error`)؛ انتخاب پیش‌فرض یک سطح شدت
نیست.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

فیلدهای خروجی JSON:

- `ok`: آیا یافته‌ای به آستانهٔ شدت انتخاب‌شده رسیده است
- `checksRun` / `checksSkipped`: تعدادها (نادیده‌گرفته‌شده بر اساس نمایه، `--only` یا `--skip`)
- `findings`: تشخیص‌های ساختاریافته با `checkId`، `severity`، `message` و موارد اختیاری `path`، `line`، `column`، `ocPath`، `source`، `target`، `requirement`، `fixHint`

کدهای خروج:

| کد | معنا                                                  |
| ---- | -------------------------------------------------------- |
| `0`  | هیچ یافته‌ای در آستانهٔ انتخاب‌شده یا بالاتر وجود ندارد           |
| `1`  | یک یا چند یافته به آستانهٔ انتخاب‌شده رسیده‌اند          |
| `2`  | خرابی فرمان/زمان اجرا پیش از امکان انتشار یافته‌ها |

پرچم‌ها:

- `--severity-min info|warning|error` (پیش‌فرض `warning`): هم آنچه چاپ می‌شود و هم آنچه باعث خروج غیرصفر می‌شود را کنترل می‌کند.
- `--all`: همهٔ بررسی‌های lint ثبت‌شده را اجرا می‌کند، از جمله بررسی‌های اختیاری که از مجموعهٔ خودکارسازی پیش‌فرض کنار گذاشته شده‌اند.
- `--only <id>` (قابل تکرار): فقط شناسه یا شناسه‌های بررسی نام‌برده را اجرا می‌کند؛ شناسهٔ ناشناخته به‌عنوان یافتهٔ خطا گزارش می‌شود.
- `--skip <id>` (قابل تکرار): یک بررسی را مستثنا می‌کند و بقیهٔ اجرا را فعال نگه می‌دارد.
- `--json`، `--severity-min`، `--all`، `--only` و `--skip` به `--lint` نیاز دارند؛ اجراهای سادهٔ `openclaw doctor` و `--fix` آن‌ها را رد می‌کنند.

## کارکرد آن (خلاصه)

<AccordionGroup>
  <Accordion title="سلامت، رابط کاربری و به‌روزرسانی‌ها">
    - به‌روزرسانی اختیاری پیش از اجرا برای نصب‌های git (فقط تعاملی).
    - بررسی تازگی پروتکل رابط کاربری (هنگامی که طرح‌وارهٔ پروتکل جدیدتر باشد، رابط کاربری Control را بازسازی می‌کند).
    - بررسی سلامت + درخواست راه‌اندازی مجدد.
    - یادداشت‌های Skills و Plugin فقط برای مشکلات؛ موجودی سالم در `openclaw skills check` و `openclaw plugins list` باقی می‌ماند.

  </Accordion>
  <Accordion title="پیکربندی و مهاجرت‌ها">
    - عادی‌سازی پیکربندی برای شکل‌های قدیمی مقادیر.
    - مهاجرت پیکربندی Talk از فیلدهای مسطح قدیمی `talk.*` به `talk.provider` + `talk.providers.<provider>`.
    - بررسی‌های مهاجرت مرورگر برای پیکربندی‌های قدیمی افزونهٔ Chrome و آمادگی Chrome MCP.
    - هشدارهای بازنویسی ارائه‌دهندهٔ OpenCode ‏(`models.providers.opencode` / `opencode-zen` / `opencode-go`).
    - مهاجرت ارائه‌دهنده/نمایهٔ قدیمی OpenAI Codex ‏(`openai-codex` → `openai`) و هشدارهای تحت‌الشعاع قرارگرفتن برای `models.providers.openai-codex` منسوخ.
    - بررسی پیش‌نیازهای TLS در OAuth برای نمایه‌های OAuth ‏OpenAI Codex.
    - هشدارهای فهرست مجاز Plugin/ابزار، هنگامی که `plugins.allow` محدودکننده است اما خط‌مشی ابزار همچنان ابزارهای نویسهٔ عام یا متعلق به Plugin را درخواست می‌کند.
    - مهاجرت وضعیت قدیمی روی دیسک (نشست‌ها/پوشهٔ عامل/احراز هویت WhatsApp).
    - مهاجرت کلیدهای قرارداد مانیفست قدیمی Plugin ‏(`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders` → `contracts`).
    - مهاجرت مخزن قدیمی Cron ‏(`jobId`، `schedule.cron`، فیلدهای سطح‌بالای تحویل/بار مفید، `provider` بار مفید، کارهای Webhook جایگزین `notify: true`).
    - تعمیر تثبیت زمان اجرای Codex CLI ‏(`agentRuntime.id: "codex-cli"` → `"codex"`) در `agents.defaults`، `agents.list[]` و `models.providers.*` (از جمله ورودی‌های مختص هر مدل).
    - پاک‌سازی پیکربندی منسوخ Plugin هنگام فعال‌بودن Pluginها؛ هنگامی که `plugins.enabled=false`، ارجاع‌های منسوخ Plugin به‌عنوان پیکربندی مهار غیرفعال حفظ می‌شوند.

  </Accordion>
  <Accordion title="وضعیت و یکپارچگی">
    - بازرسی فایل قفل نشست و پاک‌سازی قفل‌های منسوخ.
    - تعمیر رونوشت نشست برای شاخه‌های تکراری بازنویسی پرامپت که توسط بیلدهای آسیب‌دیدهٔ 2026.4.24 ایجاد شده‌اند.
    - شناسایی سنگ‌قبر بازیابی پس از راه‌اندازی مجدد زیرعامل گیرکرده، با پشتیبانی `--fix` برای پاک‌کردن پرچم‌های منسوخ بازیابی لغوشده تا راه‌اندازی، فرزند را همچنان لغوشده بر اثر راه‌اندازی مجدد تلقی نکند.
    - بررسی‌های یکپارچگی وضعیت و مجوزها (نشست‌ها، رونوشت‌ها، پوشهٔ وضعیت).
    - بررسی مجوزهای فایل پیکربندی (chmod 600) هنگام اجرای محلی.
    - سلامت احراز هویت مدل: انقضای OAuth را بررسی می‌کند، می‌تواند توکن‌های در آستانهٔ انقضا را تازه‌سازی کند و وضعیت‌های دورهٔ انتظار/غیرفعال نمایهٔ احراز هویت را گزارش می‌دهد.

  </Accordion>
  <Accordion title="Gateway، سرویس‌ها و ناظرها">
    - تعمیر تصویر sandbox هنگامی که sandboxing فعال است.
    - مهاجرت سرویس قدیمی و شناسایی Gateway اضافی.
    - مهاجرت وضعیت قدیمی کانال Matrix (در حالت `--fix` / `--repair`).
    - بررسی‌های زمان اجرای Gateway (سرویس نصب‌شده اما اجرا نمی‌شود؛ برچسب launchd ذخیره‌شده).
    - هشدارهای وضعیت کانال (از Gateway در حال اجرا کاوش می‌شوند).
    - بررسی‌های مجوز مختص کانال زیر `openclaw channels capabilities` قرار دارند؛ برای نمونه، مجوزهای کانال صوتی Discord با `openclaw channels capabilities --channel discord --target channel:<channel-id>` ممیزی می‌شوند.
    - بررسی‌های پاسخ‌گویی WhatsApp برای افت سلامت حلقهٔ رویداد Gateway درحالی‌که کلاینت‌های محلی TUI همچنان در حال اجرا هستند؛ `--fix` فقط کلاینت‌های محلی TUI تأییدشده را متوقف می‌کند.
    - تعمیر مسیر Codex برای ارجاع‌های مدل قدیمی `openai-codex/*` در مدل‌های اصلی، جایگزین‌ها، مدل‌های تولید تصویر/ویدئو، بازنویسی‌های Heartbeat/زیرعامل/Compaction، هوک‌ها، بازنویسی مدل کانال و تثبیت مسیر نشست؛ `--fix` آن‌ها را به `openai/*` بازنویسی می‌کند، نمایه‌ها/ترتیب احراز هویت `openai-codex:*` را به `openai:*` مهاجرت می‌دهد، تثبیت‌های منسوخ زمان اجرای نشست/کل عامل را حذف می‌کند و اجازه می‌دهد مسیر مؤثر تعمیرشده تعیین کند که Codex سازگار است یا خیر.
    - ممیزی پیکربندی ناظر (launchd/systemd/schtasks) با امکان تعمیر.
    - پاک‌سازی محیط پراکسی تعبیه‌شده برای سرویس‌های Gateway که مقادیر `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` پوسته را هنگام نصب یا به‌روزرسانی ثبت کرده‌اند.
    - بررسی‌های زمان اجرای Gateway (سرویس‌های قدیمی و پشتیبانی‌نشدهٔ Bun، مسیرهای مدیر نسخه).
    - تشخیص تداخل پورت Gateway (پیش‌فرض `18789`).

  </Accordion>
  <Accordion title="احراز هویت، امنیت و جفت‌سازی">
    - هشدارهای امنیتی برای خط‌مشی‌های باز پیام مستقیم.
    - بررسی‌های احراز هویت Gateway برای حالت توکن محلی (هنگامی که هیچ منبع توکنی وجود ندارد، تولید توکن را پیشنهاد می‌دهد؛ پیکربندی‌های SecretRef توکن را بازنویسی نمی‌کند).
    - شناسایی مشکلات جفت‌سازی دستگاه (درخواست‌های معلق جفت‌سازی بار نخست، ارتقاهای معلق نقش/دامنه، انحراف منسوخ حافظهٔ نهان توکن دستگاه محلی و انحراف احراز هویت رکورد جفت‌شده).

  </Accordion>
  <Accordion title="فضای کاری و پوسته">
    - بررسی linger در systemd روی Linux.
    - بررسی اندازهٔ فایل راه‌اندازی فضای کاری (هشدارهای بریده‌شدن/نزدیک‌شدن به حد برای فایل‌های زمینه).
    - بررسی آمادگی Skills برای عامل پیش‌فرض؛ Skills مجاز با نیازمندی‌های برآورده‌نشدهٔ فایل اجرایی، محیط، پیکربندی یا سیستم‌عامل را گزارش می‌کند و `--fix` می‌تواند Skills در دسترس‌نبودنی را در `skills.entries` غیرفعال کند.
    - بررسی وضعیت تکمیل خودکار پوسته و نصب/ارتقای خودکار.
    - بررسی آمادگی ارائه‌دهندهٔ تعبیه‌سازی جست‌وجوی حافظه (مدل محلی، کلید API راه‌دور یا فایل اجرایی QMD).
    - بررسی‌های نصب از منبع (عدم تطابق فضای کاری pnpm، نبود دارایی‌های رابط کاربری، نبود فایل اجرایی tsx).
    - نوشتن پیکربندی به‌روزشده + فرادادهٔ راهنما.

  </Accordion>
</AccordionGroup>

## تکمیل داده‌های قبلی و بازنشانی رابط کاربری Dreams

صحنهٔ Dreams در رابط کاربری کنترل شامل کنش‌های **Backfill**، **Reset** و **Clear Grounded** برای گردش‌کار Dreaming مبتنی بر داده‌های مستند است. این کنش‌ها از متدهای RPC به‌سبک doctor در Gateway استفاده می‌کنند، اما بخشی از تعمیر/مهاجرت CLI در `openclaw doctor` **نیستند**.

| کنش           | کاری که انجام می‌دهد                                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backfill       | فایل‌های تاریخی `memory/YYYY-MM-DD.md` را در فضای کاری فعال اسکن می‌کند، گذر دفترچهٔ REM مبتنی بر داده‌های مستند را اجرا می‌کند و ورودی‌های پس‌پرکنی برگشت‌پذیر را در `DREAMS.md` می‌نویسد. |
| Reset          | فقط ورودی‌های علامت‌گذاری‌شدهٔ دفترچهٔ پس‌پرکنی را از `DREAMS.md` حذف می‌کند.                                                                                                  |
| Clear Grounded | فقط ورودی‌های کوتاه‌مدتِ مرحله‌بندی‌شده و صرفاً مبتنی بر داده‌های مستند را از بازپخش تاریخی حذف می‌کند که هنوز یادآوری زنده یا پشتیبانی روزانه انباشته نکرده‌اند.                           |

هیچ‌یک از این کنش‌ها `MEMORY.md` را ویرایش نمی‌کنند، مهاجرت‌های کامل doctor را اجرا نمی‌کنند یا به‌تنهایی نامزدهای مبتنی بر داده‌های مستند را در مخزن فعال ارتقای کوتاه‌مدت مرحله‌بندی نمی‌کنند. برای فرستادن بازپخش تاریخی مبتنی بر داده‌های مستند به مسیر عادی ارتقای عمیق، به‌جای آن از گردش CLI استفاده کنید:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

این فرمان نامزدهای ماندگار مبتنی بر داده‌های مستند را در مخزن Dreaming کوتاه‌مدت مرحله‌بندی می‌کند، درحالی‌که `DREAMS.md` همچنان سطح بازبینی باقی می‌ماند.

## رفتار و منطق تفصیلی

<AccordionGroup>
  <Accordion title="0. به‌روزرسانی اختیاری (نصب‌های git)">
    اگر این یک checkout از git باشد و doctor به‌صورت تعاملی اجرا شود، پیش از اجرای doctor پیشنهاد به‌روزرسانی (fetch/rebase/build) می‌دهد.
  </Accordion>
  <Accordion title="1. نرمال‌سازی پیکربندی">
    Doctor شکل‌های قدیمی مقادیر را به شِمای فعلی نرمال‌سازی می‌کند. پیکربندی فعلی گفتار Talk برابر با `talk.provider` + `talk.providers.<provider>` است و پیکربندی صدای بلادرنگ زیر `talk.realtime.*` قرار دارد. Doctor شکل‌های قدیمی `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` را در نگاشت ارائه‌دهنده بازنویسی می‌کند و انتخابگرهای قدیمی بلادرنگ سطح‌بالا (`talk.mode`، `talk.transport`، `talk.brain`، `talk.model`، `talk.voice`) را به `talk.realtime` بازنویسی می‌کند.

    همچنین وقتی `plugins.allow` خالی نباشد و سیاست ابزار از نویسهٔ عام یا ورودی‌های ابزار متعلق به Plugin استفاده کند، Doctor هشدار می‌دهد. `tools.allow: ["*"]` فقط با ابزارهای Pluginهایی تطبیق می‌یابد که واقعاً بارگذاری می‌شوند؛ این مورد فهرست مجاز انحصاری Plugin را دور نمی‌زند.

  </Accordion>
  <Accordion title="2. مهاجرت کلیدهای قدیمی پیکربندی">
    وقتی پیکربندی حاوی کلیدی منسوخ با مهاجرت فعال باشد، فرمان‌های دیگر از اجرا خودداری می‌کنند و از شما می‌خواهند `openclaw doctor` را اجرا کنید. Doctor توضیح می‌دهد کدام کلیدهای قدیمی پیدا شده‌اند، مهاجرت اعمال‌شده را نشان می‌دهد و `~/.openclaw/openclaw.json` را با شِمای به‌روز بازنویسی می‌کند. راه‌اندازی Gateway قالب‌های قدیمی پیکربندی را نمی‌پذیرد و از شما می‌خواهد `openclaw doctor --fix` را اجرا کنید؛ هنگام راه‌اندازی، `openclaw.json` را بازنویسی نمی‌کند. مهاجرت‌های مخزن کار Cron نیز توسط `openclaw doctor --fix` انجام می‌شوند.

    <Note>
      Doctor مهاجرت‌های خودکار را فقط تا حدود دو ماه پس از بازنشسته‌شدن یک
      کلید نگه می‌دارد. کلیدهای قدیمی‌تر (برای مثال
      `routing.queue`، `routing.bindings`، `routing.agents`/`defaultAgentId`،
      `routing.transcribeAudio`، `agent.*` سطح‌بالا یا `identity` سطح‌بالا
      از شکل پیکربندی پیش از چندعاملی) دیگر مسیر مهاجرتی ندارند؛
      پیکربندی‌ای که از آن‌ها استفاده کند، اکنون به‌جای بازنویسی در اعتبارسنجی
      شکست می‌خورد. پیش از آنکه doctor بتواند ادامه دهد، آن کلیدها را به‌صورت
      دستی و مطابق مرجع پیکربندی فعلی اصلاح کنید.
    </Note>

    مهاجرت‌های فعال:

    | کلید قدیمی                                                                                    | کلید فعلی                                                                 |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`، `gateway.webchat`                                                            | حذف‌شده (WebChat بازنشسته شده است)                                                 |
    | `channels.feishu.accounts.<accountId>.botName`                                                   | `channels.feishu.accounts.<accountId>.name`                                 |
    | `session.threadBindings.ttlHours`، `channels.<id>.threadBindings.ttlHours` (و برای هر حساب)      | `...threadBindings.idleHours`                                               |
    | `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` قدیمی        | `talk.provider` + `talk.providers.<provider>`                               |
    | انتخابگرهای قدیمی بلادرنگ Talk در سطح‌بالا (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) | `talk.realtime`                                                              |
    | `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)                             | `messages.tts.providers.<provider>`                                          |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                  | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`   |
    | فیلدهای گویندهٔ TTS یعنی `voice`/`voiceName`/`voiceId`                                                 | `speakerVoice`/`speakerVoiceId`                                              |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>` (همهٔ کانال‌ها به‌جز Discord)                                          | `...tts.providers.<provider>`                                                |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>` (همهٔ کانال‌ها، از جمله Discord)                          | `...voice.tts.providers.<provider>`                                          |
    | `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)     | `plugins.entries.voice-call.config.tts.providers.<provider>`                |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                | `provider: "microsoft"` / `...tts.providers.microsoft`                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                              | `"mock"`                                                                      |
    | `plugins.entries.voice-call.config.twilio.from`                                                  | `plugins.entries.voice-call.config.fromNumber`                              |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                        | `plugins.entries.voice-call.config.streaming.provider`                      |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"` (راه‌اندازی Gateway همچنین ارائه‌دهندگانی را که `api` آن‌ها مقداری آینده/ناشناخته از enum است، به‌جای شکست بسته نادیده می‌گیرد) |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | حذف‌شده (تنظیم قدیمی رلهٔ افزونهٔ Chrome)                             |
    | `mcp.servers.*.type` (نام‌های مستعار بومی CLI)                                                        | `mcp.servers.*.transport`                                                    |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | حذف‌شده (app-server در Codex همیشه ابزارهای فضای کاری بومی Codex را بومی نگه می‌دارد) |
    | `commands.modelsWrite`                                                                           | حذف‌شده (`/models add` منسوخ شده است)                                       |
    | `agents.defaults/list[].silentReplyRewrite`، `surfaces.*.silentReplyRewrite`                     | حذف‌شده (`NO_REPLY` دقیق دیگر به متن جایگزین قابل‌مشاهده بازنویسی نمی‌شود)  |
    | `agents.defaults/list[].systemPromptOverride`                                                    | حذف‌شده (OpenClaw مالک اعلان سیستمی تولیدشده است)                        |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | حذف‌شده (برای مهلت‌های زمانی مدل/ارائه‌دهندهٔ کند از `models.providers.<id>.timeoutSeconds` استفاده کنید که پایین‌تر از سقف مهلت زمانی عامل/اجرا نگه داشته می‌شود) |
    | `memorySearch` سطح‌بالا                                                                         | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path` (در هر سطح)                                                            | حذف‌شده (نمایه‌های حافظه در پایگاه دادهٔ هر عامل قرار دارند)                       |
    | `heartbeat` سطح‌بالا                                                                            | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | شناسه‌های سیاست `plugins.openai-codex`                                                                | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`، `session.parentForkMaxTokens`                                 | حذف‌شده (منسوخ)                                                        |
    | `diagnostics.memoryPressureBundle`                                                               | `diagnostics.memoryPressureSnapshot`                                        |

    <Note>
      ردیف‌های `plugins.entries.voice-call.config.*` بالا در هر بار بارگذاری پیکربندی توسط
      خود Plugin تماس صوتی نرمال‌سازی می‌شوند، نه توسط `openclaw
      doctor`. این Plugin همچنین هنگام راه‌اندازی هشداری ثبت می‌کند که به `openclaw
      doctor --fix` اشاره دارد، اما doctor درحال‌حاضر
      `openclaw.json` را برای این کلیدها بازنویسی نمی‌کند؛ این نرمال‌سازی خود
      Plugin است که تغییر را هنگام اجرا اعمال می‌کند.
    </Note>

    راهنمای حساب پیش‌فرض برای کانال‌های چندحسابی:

    - اگر دو یا چند ورودی `channels.<channel>.accounts` بدون `channels.<channel>.defaultAccount` یا `accounts.default` پیکربندی شده باشند، doctor هشدار می‌دهد که مسیریابی جایگزین ممکن است حسابی غیرمنتظره را انتخاب کند.
    - اگر `channels.<channel>.defaultAccount` روی شناسهٔ حسابی ناشناخته تنظیم شده باشد، doctor هشدار می‌دهد و شناسه‌های حساب پیکربندی‌شده را فهرست می‌کند.

  </Accordion>
  <Accordion title="2b. بازنویسی‌های ارائه‌دهنده OpenCode">
    اگر `models.providers.opencode`، `opencode-zen` یا `opencode-go` را به‌صورت دستی افزوده باشید، این تنظیم کاتالوگ داخلی OpenCode را از `openclaw/plugin-sdk/llm` بازنویسی می‌کند. این کار می‌تواند مدل‌ها را وادار کند از API نادرست استفاده کنند یا هزینه‌ها را صفر کند. Doctor هشدار می‌دهد تا بتوانید بازنویسی را حذف کنید و مسیریابی API و هزینه‌های مختص هر مدل را بازیابی کنید.
  </Accordion>
  <Accordion title="2c. مهاجرت مرورگر و آمادگی Chrome MCP">
    اگر پیکربندی مرورگر شما همچنان به مسیر حذف‌شده افزونه Chrome اشاره می‌کند، Doctor آن را به مدل فعلی اتصال Chrome MCP محلیِ میزبان عادی‌سازی می‌کند (`browser.profiles.*.driver: "extension"` → `"existing-session"`؛ `browser.relayBindHost` حذف می‌شود).

    Doctor همچنین هنگام استفاده از `defaultProfile: "user"` یا نمایه پیکربندی‌شده `existing-session`، مسیر Chrome MCP محلیِ میزبان را بررسی می‌کند:

    - بررسی می‌کند آیا Google Chrome برای نمایه‌های اتصال خودکار پیش‌فرض روی همان میزبان نصب شده است
    - نسخه شناسایی‌شده Chrome را بررسی می‌کند و اگر پایین‌تر از Chrome 144 باشد هشدار می‌دهد
    - یادآوری می‌کند که اشکال‌زدایی راه‌دور را در صفحه بازرسی مرورگر فعال کنید (برای مثال `chrome://inspect/#remote-debugging`، `brave://inspect/#remote-debugging` یا `edge://inspect/#remote-debugging`)

    Doctor نمی‌تواند تنظیم سمت Chrome را برای شما فعال کند. Chrome MCP محلیِ میزبان همچنان به یک مرورگر مبتنی بر Chromium با نسخه 144+ روی میزبان Gateway/Node نیاز دارد که به‌صورت محلی در حال اجرا باشد، اشکال‌زدایی راه‌دور در آن فعال شده باشد و نخستین درخواست رضایت برای اتصال در مرورگر تأیید شده باشد.

    آمادگی در اینجا فقط پیش‌نیازهای اتصال محلی را پوشش می‌دهد. Existing-session محدودیت‌های فعلی مسیر Chrome MCP را حفظ می‌کند؛ مسیرهای پیشرفته‌ای مانند `responsebody`، خروجی PDF، رهگیری دانلود و عملیات دسته‌ای همچنان به مرورگر مدیریت‌شده یا نمایه خام CDP نیاز دارند. این بررسی درباره Docker، sandbox، مرورگر راه‌دور یا دیگر جریان‌های headless صدق نمی‌کند؛ این جریان‌ها همچنان از CDP خام استفاده می‌کنند.

  </Accordion>
  <Accordion title="2d. پیش‌نیازهای TLS برای OAuth">
    وقتی یک نمایه OAuth مربوط به OpenAI Codex پیکربندی شده باشد، Doctor نقطه پایانی مجوزدهی OpenAI را آزمایش می‌کند تا تأیید کند پشته TLS محلی Node/OpenSSL می‌تواند زنجیره گواهی را اعتبارسنجی کند. اگر آزمایش با خطای گواهی ناموفق باشد (برای مثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`، گواهی منقضی‌شده یا گواهی خودامضا)، Doctor راهنمای رفع مشکل ویژه پلتفرم را نمایش می‌دهد. در macOS با Node نصب‌شده از طریق Homebrew، راه‌حل معمولاً `brew postinstall ca-certificates` است. با `--deep`، حتی اگر Gateway سالم باشد نیز آزمایش اجرا می‌شود.
  </Accordion>
  <Accordion title="2e. بازنویسی‌های ارائه‌دهنده OAuth برای Codex">
    اگر پیش‌تر تنظیمات قدیمی انتقال OpenAI را زیر `models.providers.openai-codex` افزوده باشید، ممکن است مسیر داخلی ارائه‌دهنده OAuth برای Codex را تحت‌الشعاع قرار دهند. وقتی Doctor این تنظیمات انتقال قدیمی را در کنار OAuth مربوط به Codex ببیند هشدار می‌دهد تا بتوانید بازنویسی انتقال منسوخ را حذف یا بازنویسی کنید و رفتار فعلی مسیریابی را بازیابی کنید. پراکسی‌های سفارشی و بازنویسی‌های فقط‌سرآیند همچنان پشتیبانی می‌شوند و این هشدار را فعال نمی‌کنند، اما این مسیرهای درخواستِ تعریف‌شده واجد شرایط انتخاب ضمنی Codex نیستند.
  </Accordion>
  <Accordion title="2f. ترمیم مسیر Codex">
    Doctor ارجاع‌های قدیمی مدل `openai-codex/*` را بررسی می‌کند. مسیریابی بومی harness در Codex از ارجاع‌های استاندارد مدل `openai/*` استفاده می‌کند، اما پیشوند به‌تنهایی هرگز Codex را انتخاب نمی‌کند. وقتی سیاست زمان اجرا تنظیم نشده باشد یا `auto` باشد، فقط یک مسیر رسمی و دقیق HTTPS از نوع Platform Responses یا ChatGPT Responses که هیچ بازنویسی تعریف‌شده‌ای برای درخواست ندارد واجد شرایط است. [زمان اجرای ضمنی عامل OpenAI](/fa/providers/openai#implicit-agent-runtime) را ببینید.

    در حالت `--fix` / `--repair`، Doctor ارجاع‌های عامل پیش‌فرض و هر عامل آسیب‌دیده را بازنویسی می‌کند؛ از جمله مدل‌های اصلی، fallbackها، مدل‌های تولید تصویر/ویدئو، بازنویسی‌های Heartbeat/زیرعامل/Compaction، hookها، بازنویسی مدل کانال و وضعیت منسوخ مسیر نشست ذخیره‌شده:

    - `openai-codex/gpt-*` به `openai/gpt-*` تبدیل می‌شود.
    - قصد استفاده از Codex برای ارجاع‌های مدل عاملِ ترمیم‌شده به ورودی‌های `agentRuntime.id: "codex"` با دامنه ارائه‌دهنده/مدل منتقل می‌شود.
    - پیکربندی منسوخ زمان اجرای کل عامل و pinهای ذخیره‌شده زمان اجرای نشست حذف می‌شوند، زیرا انتخاب زمان اجرا دارای دامنه ارائه‌دهنده/مدل است.
    - سیاست موجود زمان اجرای ارائه‌دهنده/مدل حفظ می‌شود، مگر آنکه ارجاع قدیمیِ ترمیم‌شده مدل برای حفظ مسیر احراز هویت قبلی به مسیریابی Codex نیاز داشته باشد.
    - فهرست‌های fallback موجود مدل با بازنویسی ورودی‌های قدیمی‌شان حفظ می‌شوند؛ تنظیمات کپی‌شده هر مدل از کلید قدیمی به کلید استاندارد `openai/*` منتقل می‌شوند.
    - `modelProvider`/`providerOverride`، `model`/`modelOverride`، اعلان‌های fallback و pinهای نمایه احراز هویت نشستِ ذخیره‌شده در تمام مخازن نشست عاملِ شناسایی‌شده ترمیم می‌شوند.
    - Doctor همچنین pinهای منسوخ `agentRuntime.id: "codex-cli"` (یک شناسه قدیمی و متمایز زمان اجرا) را به‌طور جداگانه در ورودی‌های مدل `agents.defaults`، `agents.list[]` و `models.providers.*` به `"codex"` ترمیم می‌کند.
    - `/codex ...` یعنی «کنترل یا متصل‌کردن یک گفت‌وگوی بومی Codex از چت.»
    - `/acp ...` یا `runtime: "acp"` یعنی «استفاده از آداپتور خارجی ACP/acpx.»

  </Accordion>
  <Accordion title="2g. پاک‌سازی مسیر نشست">
    Doctor همچنین مخازن نشست عاملِ شناسایی‌شده را برای یافتن وضعیت مسیرِ منسوخ و خودکارایجادشده پس از انتقال مدل‌های پیکربندی‌شده یا زمان اجرا از یک مسیر متعلق به Plugin مانند Codex اسکن می‌کند.

    `openclaw doctor --fix` می‌تواند وضعیت منسوخ و خودکارایجادشده مانند pinهای مدل `modelOverrideSource: "auto"`، فراداده مدل زمان اجرا، شناسه‌های pin‌شده harness، اتصال‌های نشست CLI و بازنویسی‌های خودکار نمایه احراز هویت را زمانی پاک کند که مسیر مالک آن‌ها دیگر پیکربندی نشده باشد. انتخاب‌های صریح کاربر یا انتخاب‌های قدیمی مدل نشست برای بازبینی دستی گزارش می‌شوند و بدون تغییر باقی می‌مانند؛ وقتی دیگر آن مسیر مدنظر نیست، آن‌ها را با `/model ...` یا `/new` تغییر دهید، یا نشست را بازنشانی کنید.

  </Accordion>
  <Accordion title="3. مهاجرت‌های وضعیت قدیمی (چیدمان دیسک)">
    Doctor می‌تواند چیدمان‌های قدیمی روی دیسک را به ساختار فعلی مهاجرت دهد:

    - مخزن نشست‌ها + رونوشت‌ها: از `~/.openclaw/sessions/` به `~/.openclaw/agents/<agentId>/sessions/`
    - دایرکتوری عامل: از `~/.openclaw/agent/` به `~/.openclaw/agents/<agentId>/agent/`
    - وضعیت احراز هویت WhatsApp ‏(Baileys): از `~/.openclaw/credentials/*.json` قدیمی (به‌جز `oauth.json`) به `~/.openclaw/credentials/whatsapp/<accountId>/...` (شناسه حساب پیش‌فرض: `default`)

    این مهاجرت‌ها تا حد امکان انجام می‌شوند و idempotent هستند؛ هرگاه Doctor پوشه‌های قدیمی را به‌عنوان پشتیبان باقی بگذارد، هشدار صادر می‌کند. Gateway/CLI همچنین مخزن نشست‌ها و دایرکتوری عامل قدیمی را هنگام راه‌اندازی به‌طور خودکار مهاجرت می‌کند تا تاریخچه/احراز هویت/مدل‌ها بدون اجرای دستی Doctor در مسیر مختص عامل قرار گیرند. احراز هویت WhatsApp عمداً فقط از طریق `openclaw doctor` مهاجرت داده می‌شود. عادی‌سازی ارائه‌دهنده Talk/نگاشت ارائه‌دهنده بر اساس برابری ساختاری مقایسه می‌کند؛ بنابراین تفاوت‌هایی که فقط در ترتیب کلیدها هستند دیگر باعث تغییرات بی‌اثر و تکراری `doctor --fix` نمی‌شوند.

  </Accordion>
  <Accordion title="3a. مهاجرت‌های manifest قدیمی Plugin">
    Doctor همه manifestهای Plugin نصب‌شده را برای یافتن کلیدهای قابلیت منسوخ در سطح بالا (`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders`) اسکن می‌کند. در صورت یافتن، پیشنهاد می‌کند آن‌ها را به شیء `contracts` منتقل کند و فایل manifest را درجا بازنویسی کند. این مهاجرت idempotent است؛ اگر `contracts` از قبل همان مقادیر را داشته باشد، کلید قدیمی بدون تکرار داده حذف می‌شود.
  </Accordion>
  <Accordion title="3b. مهاجرت‌های مخزن قدیمی Cron">
    Doctor همچنین مخزن کارهای Cron را (`~/.openclaw/cron/jobs.json` به‌طور پیش‌فرض، یا `cron.store` در صورت بازنویسی) برای شکل‌های قدیمی کار که زمان‌بند همچنان برای سازگاری می‌پذیرد بررسی می‌کند.

    پاک‌سازی‌های فعلی Cron شامل موارد زیر است:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - فیلدهای payload در سطح بالا (`message`، `model`، `thinking`، ...) → `payload`
    - فیلدهای تحویل در سطح بالا (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - نام‌های مستعار تحویل در payload ‏`provider` → ‏`delivery.channel` صریح
    - کارهای fallback قدیمی Webhook در `notify: true` → تحویل صریح Webhook از `cron.webhook` در صورت تنظیم‌شدن؛ کارهای اعلان تحویل چت خود را حفظ می‌کنند و `delivery.completionDestination` را دریافت می‌کنند. وقتی `cron.webhook` تنظیم نشده باشد، نشانگر بی‌اثر سطح بالای `notify` برای کارهای بدون مقصد حذف می‌شود (تحویل موجود، از جمله اعلان، حفظ می‌شود)، زیرا تحویل زمان اجرا هرگز آن را نمی‌خواند.

    Gateway همچنین ردیف‌های Cron بدشکل را هنگام بارگذاری پاک‌سازی می‌کند تا کارهای معتبر به اجرا ادامه دهند. ردیف‌های خام بدشکل پیش از حذف از `jobs.json` در `jobs-quarantine.json` کنار مخزن فعال کپی می‌شوند؛ Doctor ردیف‌های قرنطینه‌شده را گزارش می‌کند تا بتوانید آن‌ها را به‌صورت دستی بازبینی یا ترمیم کنید.

    راه‌اندازی Gateway نمای زمان اجرا را عادی‌سازی می‌کند و نشانگر سطح بالای `notify` را نادیده می‌گیرد، اما پیکربندی ذخیره‌شده Cron را برای ترمیم توسط Doctor دست‌نخورده باقی می‌گذارد. وقتی `cron.webhook` تنظیم نشده باشد، Doctor نشانگر بی‌اثر را برای کارهای بدون مقصد مهاجرت حذف می‌کند (`delivery.mode` برابر none/غایب، مقصد Webhook غیرقابل‌استفاده، یا تحویل اعلان/چت موجود) و تحویل موجود را بدون تغییر باقی می‌گذارد؛ بنابراین اجراهای تکراری `doctor --fix` دیگر درباره همان کار دوباره هشدار نمی‌دهند. اگر `cron.webhook` تنظیم شده باشد اما URL معتبر HTTP(S) نباشد، Doctor همچنان هشدار می‌دهد و نشانگر را باقی می‌گذارد تا بتوانید URL را اصلاح کنید.

    در Linux، Doctor همچنین هنگامی هشدار می‌دهد که crontab کاربر همچنان `~/.openclaw/bin/ensure-whatsapp.sh` قدیمی را فراخوانی کند. این اسکریپت محلیِ میزبان دیگر توسط OpenClaw فعلی نگهداری نمی‌شود و هنگامی که Cron نتواند به گذرگاه کاربر systemd دسترسی پیدا کند، می‌تواند پیام‌های نادرست `Gateway inactive` را در `~/.openclaw/logs/whatsapp-health.log` بنویسد. ورودی منسوخ crontab را با `crontab -e` حذف کنید؛ برای بررسی‌های سلامت فعلی از `openclaw channels status --probe`، `openclaw doctor` و `openclaw gateway status` استفاده کنید.

  </Accordion>
  <Accordion title="3c. پاک‌سازی قفل نشست">
    Doctor همه دایرکتوری‌های نشست عامل را برای یافتن فایل‌های قفل نوشتن منسوخی که پس از خاتمه غیرعادی نشست باقی مانده‌اند اسکن می‌کند. برای هر فایل قفل یافت‌شده، این موارد را گزارش می‌کند: مسیر، PID، اینکه PID هنوز فعال است یا نه، عمر قفل و اینکه منسوخ محسوب می‌شود یا نه (PID مرده، فراداده مالک بدشکل، قدیمی‌تر از 30 دقیقه، یا PID زنده‌ای که ثابت شده متعلق به فرایندی غیر از OpenClaw است). در حالت `--fix` / `--repair`، قفل‌هایی با مالک مرده، یتیم، بازیافت‌شده، قدیمی و بدشکل یا غیر OpenClaw را به‌طور خودکار حذف می‌کند. قفل‌های قدیمی که هنوز متعلق به یک فرایند زنده OpenClaw هستند گزارش می‌شوند اما در جای خود باقی می‌مانند تا Doctor نوشتن فعال رونوشت را قطع نکند.
  </Accordion>
  <Accordion title="3d. ترمیم شاخه رونوشت نشست">
    Doctor فایل‌های JSONL نشست عامل را برای یافتن شکل شاخه تکراری ایجادشده توسط باگ بازنویسی رونوشت prompt در 2026.4.24 اسکن می‌کند: یک نوبت رهاشده کاربر با زمینه داخلی زمان اجرای OpenClaw به‌همراه یک شاخه هم‌سطح فعال که همان prompt قابل‌مشاهده کاربر را در خود دارد. در حالت `--fix` / `--repair`، Doctor از هر فایل آسیب‌دیده در کنار فایل اصلی پشتیبان می‌گیرد و رونوشت را به شاخه فعال بازنویسی می‌کند تا خواننده‌های تاریخچه Gateway و حافظه دیگر نوبت‌های تکراری را نبینند.
  </Accordion>
  <Accordion title="4. بررسی‌های یکپارچگی وضعیت (ماندگاری نشست، مسیریابی و ایمنی)">
    دایرکتوری وضعیت، ساقه مغز عملیاتی است. اگر ناپدید شود، نشست‌ها، اطلاعات اعتبارنامه، گزارش‌ها و پیکربندی را از دست می‌دهید، مگر اینکه در جای دیگری نسخه پشتیبان داشته باشید.

    Doctor موارد زیر را بررسی می‌کند:

    - **نبودن دایرکتوری وضعیت**: درباره از دست رفتن فاجعه‌بار وضعیت هشدار می‌دهد، برای ایجاد دوباره دایرکتوری درخواست تأیید می‌کند و یادآور می‌شود که نمی‌تواند داده‌های ازدست‌رفته را بازیابی کند.
    - **مجوزهای دایرکتوری وضعیت**: نوشتنی‌بودن را بررسی می‌کند؛ امکان اصلاح مجوزها را ارائه می‌دهد (و هنگام تشخیص ناهماهنگی مالک/گروه، راهنمای `chown` را نمایش می‌دهد).
    - **دایرکتوری وضعیت همگام‌شده با فضای ابری در macOS**: وقتی وضعیت به مسیری زیر iCloud Drive ‏(`~/Library/Mobile Documents/com~apple~CloudDocs/...`) یا `~/Library/CloudStorage/...` منتهی شود هشدار می‌دهد، زیرا مسیرهای متکی بر همگام‌سازی می‌توانند موجب کندی ورودی/خروجی و رقابت‌های قفل/همگام‌سازی شوند.
    - **دایرکتوری وضعیت روی SD یا eMMC در Linux**: وقتی وضعیت به منبع اتصال `mmcblk*` منتهی شود هشدار می‌دهد، زیرا ورودی/خروجی تصادفی متکی بر SD/eMMC می‌تواند کندتر باشد و بر اثر نوشتن نشست‌ها و اعتبارنامه‌ها سریع‌تر فرسوده شود.
    - **دایرکتوری وضعیت فرّار در Linux**: وقتی وضعیت به `tmpfs` یا `ramfs` منتهی شود هشدار می‌دهد، زیرا نشست‌ها، اعتبارنامه‌ها، پیکربندی و وضعیت SQLite (همراه با فایل‌های جانبی WAL/ژورنال) با راه‌اندازی مجدد ناپدید می‌شوند. اتصال‌های `overlay` در Docker عمداً علامت‌گذاری نمی‌شوند، زیرا تا زمانی که کانتینر باقی است، لایه‌های نوشتنی آن‌ها پس از راه‌اندازی مجدد میزبان نیز پایدار می‌مانند.
    - **نبودن دایرکتوری‌های نشست**: `sessions/` و دایرکتوری ذخیره‌گاه نشست برای نگه‌داری تاریخچه و جلوگیری از خرابی‌های `ENOENT` ضروری‌اند.
    - **ناهماهنگی رونوشت**: وقتی ورودی‌های اخیر نشست فایل رونوشت متناظر نداشته باشند هشدار می‌دهد.
    - **«JSONL تک‌خطی» نشست اصلی**: وقتی رونوشت اصلی فقط یک خط داشته باشد علامت‌گذاری می‌کند (تاریخچه انباشته نمی‌شود).
    - **چندین دایرکتوری وضعیت**: وقتی چند پوشه `~/.openclaw` در دایرکتوری‌های خانگی وجود داشته باشد، یا `OPENCLAW_STATE_DIR` به جای دیگری اشاره کند، هشدار می‌دهد (تاریخچه ممکن است میان نصب‌ها تقسیم شود).
    - **یادآوری حالت راه دور**: اگر `gateway.mode=remote`، doctor یادآوری می‌کند که آن را روی میزبان راه دور اجرا کنید (وضعیت در آنجا قرار دارد).
    - **مجوزهای فایل پیکربندی**: اگر `~/.openclaw/openclaw.json` برای گروه/همه قابل خواندن باشد هشدار می‌دهد و پیشنهاد می‌کند مجوز آن به `600` محدود شود.

  </Accordion>
  <Accordion title="5. سلامت احراز هویت مدل (انقضای OAuth)">
    Doctor پروفایل‌های OAuth را در ذخیره‌گاه احراز هویت بررسی می‌کند، هنگام نزدیک‌بودن انقضا یا منقضی‌شدن توکن‌ها هشدار می‌دهد و در صورت ایمن‌بودن می‌تواند آن‌ها را تازه‌سازی کند. اگر پروفایل OAuth/توکن Anthropic قدیمی باشد، یک کلید API برای Anthropic یا مسیر توکن راه‌اندازی Anthropic را پیشنهاد می‌کند. درخواست‌های تازه‌سازی فقط هنگام اجرای تعاملی (TTY) ظاهر می‌شوند؛ `--non-interactive` تلاش‌های تازه‌سازی را نادیده می‌گیرد.

    وقتی تازه‌سازی OAuth به‌طور دائمی شکست بخورد (برای مثال `refresh_token_reused`، `invalid_grant`، یا اعلام ارائه‌دهنده مبنی بر ورود دوباره)، doctor گزارش می‌دهد که احراز هویت مجدد لازم است و فرمان دقیق `openclaw models auth login --provider ...` را برای اجرا نمایش می‌دهد.

    Doctor همچنین پروفایل‌های احراز هویتی را گزارش می‌کند که به‌علت دوره‌های انتظار کوتاه (محدودیت نرخ/پایان مهلت/شکست احراز هویت) یا غیرفعال‌سازی طولانی‌تر (شکست صورت‌حساب/اعتبار) موقتاً قابل استفاده نیستند.

    پروفایل‌های قدیمی OAuth مربوط به Codex که توکن‌هایشان در Keychain ‏macOS قرار دارد (راه‌اندازی اولیه قدیمی، پیش از چیدمان فایل جانبی مبتنی بر فایل) فقط توسط doctor اصلاح می‌شوند. `openclaw doctor --fix` را یک‌بار از یک پایانه تعاملی اجرا کنید تا توکن‌های قدیمی متکی بر Keychain به‌صورت درجا به `auth-profiles.json` منتقل شوند؛ پس از آن، نوبت‌های تعبیه‌شده (Telegram، cron و اعزام زیرعامل) آن‌ها را به‌عنوان پروفایل‌های استاندارد OAuth ‏OpenAI شناسایی می‌کنند.

  </Accordion>
  <Accordion title="6. اعتبارسنجی مدل Hooks">
    اگر `hooks.gmail.model` تنظیم شده باشد، doctor ارجاع مدل را در برابر کاتالوگ و فهرست مجاز اعتبارسنجی می‌کند و وقتی قابل شناسایی یا مجاز نباشد هشدار می‌دهد.
  </Accordion>
  <Accordion title="7. اصلاح تصویر سندباکس">
    وقتی سندباکس فعال باشد، doctor تصاویر Docker را بررسی می‌کند و در صورت نبودن تصویر فعلی، ساخت آن یا تغییر به نام‌های قدیمی را پیشنهاد می‌دهد.
  </Accordion>
  <Accordion title="7b. پاک‌سازی نصب Plugin">
    Doctor در حالت `openclaw doctor --fix` / `openclaw doctor --repair` وضعیت قدیمی مرحله‌بندی وابستگی Plugin را که OpenClaw ایجاد کرده است حذف می‌کند: ریشه‌های قدیمی وابستگی‌های تولیدشده، دایرکتوری‌های قدیمی مرحله نصب، بقایای محلی بسته از کدهای پیشین اصلاح وابستگی Plugin‌های همراه و نسخه‌های مدیریت‌شده npm یتیم یا بازیابی‌شده از Plugin‌های همراه `@openclaw/*` که ممکن است مانیفست همراه فعلی را تحت‌الشعاع قرار دهند. Doctor همچنین بسته میزبان `openclaw` را دوباره به Plugin‌های مدیریت‌شده npm که `peerDependencies.openclaw` را اعلام می‌کنند پیوند می‌دهد تا importهای زمان اجرای محلی بسته، مانند `openclaw/plugin-sdk/*`، پس از به‌روزرسانی‌ها یا اصلاحات npm همچنان قابل شناسایی باشند.

    Doctor همچنین می‌تواند Plugin‌های قابل دانلودِ مفقود را دوباره نصب کند، زمانی که پیکربندی به آن‌ها ارجاع می‌دهد اما رجیستری محلی Plugin قادر به یافتنشان نیست (`plugins.entries` قابل‌توجه، تنظیمات پیکربندی‌شده کانال/ارائه‌دهنده/جست‌وجو و زمان‌های اجرای پیکربندی‌شده عامل). هنگام به‌روزرسانی بسته‌ها، doctor تا زمانی که بسته هسته در حال جایگزینی است از نصب مجدد بسته‌های Plugin خودداری می‌کند؛ اگر یک Plugin پیکربندی‌شده همچنان به بازیابی نیاز دارد، پس از به‌روزرسانی دوباره `openclaw doctor --fix` را اجرا کنید. به‌جز استثنای راه‌اندازی تصویر کانتینر در ادامه، راه‌اندازی Gateway و بارگذاری مجدد پیکربندی، اصلاح بسته را اجرا نمی‌کنند؛ نصب Plugin‌ها همچنان باید صریحاً از طریق doctor/install/update انجام شود.

    راه‌اندازی Gateway کانتینری یک استثنای محدود برای ارتقا دارد: وقتی `openclaw gateway run` روی نسخه جدید OpenClaw آغاز می‌شود، پیش از آماده‌شدن، مهاجرت‌های ایمن وضعیت و همگرایی موجود Plugin پس از هسته را اجرا می‌کند و سپس یک نقطه بررسی برای هر نسخه ثبت می‌کند. این مرحله راه‌اندازی می‌تواند رکوردهای قدیمی Plugin‌های همراه را پاک‌سازی کند، پیوندهای محلی Plugin را اصلاح کند، در صورت نیاز مسیر همگرایی بسته‌های Plugin پیکربندی‌شده را دوباره نصب کند و محتوای فعال Plugin را بررسی کند. اگر راه‌اندازی نتواند با ایمنی اصلاح را انجام دهد، همان تصویر را یک‌بار با `openclaw doctor --fix` و با همان وضعیت/پیکربندی متصل اجرا کنید و سپس کانتینر را به‌شکل عادی راه‌اندازی مجدد کنید.

  </Accordion>
  <Accordion title="8. مهاجرت سرویس Gateway و راهنمای پاک‌سازی">
    Doctor سرویس‌های قدیمی Gateway ‏(launchd/systemd/schtasks) را شناسایی می‌کند و پیشنهاد حذف آن‌ها و نصب سرویس OpenClaw با استفاده از پورت فعلی Gateway را می‌دهد. همچنین می‌تواند سرویس‌های اضافی مشابه Gateway را بررسی و راهنمای پاک‌سازی را نمایش دهد. سرویس‌های Gateway ‏OpenClaw که بر اساس پروفایل نام‌گذاری شده‌اند، سرویس‌های درجه‌یک محسوب می‌شوند و به‌عنوان «اضافی» علامت‌گذاری نمی‌شوند.

    در Linux، اگر سرویس Gateway سطح کاربر وجود نداشته باشد اما یک سرویس Gateway ‏OpenClaw در سطح سیستم موجود باشد، doctor سرویس دومی را در سطح کاربر به‌طور خودکار نصب نمی‌کند. آن را با `openclaw gateway status --deep` یا `openclaw doctor --deep` بررسی کنید، سپس نسخه تکراری را حذف کنید یا وقتی یک سرپرست سیستم چرخه عمر Gateway را مدیریت می‌کند، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.

  </Accordion>
  <Accordion title="8b. مهاجرت Matrix هنگام راه‌اندازی">
    وقتی حساب یک کانال Matrix دارای مهاجرت وضعیت قدیمیِ در انتظار یا قابل اقدام باشد، doctor (در حالت `--fix` / `--repair`) یک عکس فوری پیش از مهاجرت ایجاد می‌کند و سپس مراحل مهاجرت را با بیشترین تلاش اجرا می‌کند: مهاجرت وضعیت قدیمی Matrix و آماده‌سازی وضعیت رمزگذاری‌شده قدیمی. هیچ‌یک از این دو مرحله موجب توقف نمی‌شوند؛ خطاها ثبت می‌شوند و راه‌اندازی ادامه می‌یابد. در حالت فقط‌خواندنی (`openclaw doctor` بدون `--fix`) این بررسی به‌طور کامل نادیده گرفته می‌شود.
  </Accordion>
  <Accordion title="8c. جفت‌سازی دستگاه و انحراف احراز هویت">
    Doctor وضعیت جفت‌سازی دستگاه را به‌عنوان بخشی از بررسی عادی سلامت وارسی می‌کند و موارد زیر را گزارش می‌دهد:

    - درخواست‌های در انتظار برای نخستین جفت‌سازی
    - ارتقاهای در انتظار نقش یا دامنه برای دستگاه‌های ازپیش‌جفت‌شده
    - اصلاح ناهماهنگی کلید عمومی در مواردی که شناسه دستگاه هنوز مطابقت دارد اما هویت دستگاه دیگر با رکورد تأییدشده منطبق نیست
    - رکوردهای جفت‌شده‌ای که برای یک نقش تأییدشده توکن فعال ندارند
    - توکن‌های جفت‌شده‌ای که دامنه‌هایشان از خط مبنای تأییدشده جفت‌سازی منحرف شده‌اند
    - ورودی‌های محلیِ ذخیره‌شده در حافظه نهان برای توکن دستگاه فعلی که پیش از چرخش توکن در سمت Gateway ایجاد شده‌اند یا فراداده قدیمی دامنه را دارند

    Doctor درخواست‌های جفت‌سازی را خودکار تأیید نمی‌کند و توکن‌های دستگاه را نیز خودکار نمی‌چرخاند. مراحل بعدی دقیق را نمایش می‌دهد:

    - درخواست‌های در انتظار را با `openclaw devices list` بررسی کنید
    - درخواست دقیق را با `openclaw devices approve <requestId>` تأیید کنید
    - با `openclaw devices rotate --device <deviceId> --role <role>` یک توکن تازه ایجاد کنید
    - یک رکورد قدیمی را با `openclaw devices remove <deviceId>` حذف و دوباره تأیید کنید

    این کار میان نخستین جفت‌سازی، ارتقاهای در انتظار نقش/دامنه و انحراف توکن قدیمی/هویت دستگاه تمایز قائل می‌شود و رخنه رایج «از قبل جفت شده اما هنوز پیام لزوم جفت‌سازی دریافت می‌شود» را می‌بندد.

  </Accordion>
  <Accordion title="9. هشدارهای امنیتی">
    Doctor فقط زمانی یادداشت امنیتی نمایش می‌دهد که هشداری پیدا کند؛ مانند ارائه‌دهنده‌ای که بدون فهرست مجاز برای پیام‌های مستقیم باز است یا سیاستی که به‌شکل خطرناکی پیکربندی شده است. برای فهرست کامل امنیتی از `openclaw security audit` استفاده کنید.
  </Accordion>
  <Accordion title="10. ماندگاری systemd ‏(Linux)">
    اگر doctor به‌عنوان سرویس کاربری systemd اجرا شود، اطمینان حاصل می‌کند که ماندگاری فعال است تا Gateway پس از خروج از سیستم همچنان فعال بماند.
  </Accordion>
  <Accordion title="11. وضعیت فضای کاری (Skills، Plugin‌ها و TaskFlowها)">
    Doctor مشکلات و اقدامات مربوط به عامل پیش‌فرض را نمایش می‌دهد، نه فهرست وضعیت سالم:

    - **Skills**: نام Skillهای مجاز اما غیرقابل‌استفاده را فهرست می‌کند؛ برای جزئیات الزامات و شمارش کامل از `openclaw skills check` استفاده کنید.
    - **Plugin‌ها**: فقط شناسه Pluginهای خطادار را گزارش می‌کند؛ برای فهرست Pluginهای بارگذاری‌شده، واردشده، غیرفعال و همراه از `openclaw plugins list` استفاده کنید.
    - **هشدارهای سازگاری Plugin**: Pluginهایی را علامت‌گذاری می‌کند که با زمان اجرای فعلی مشکل سازگاری دارند.
    - **عیب‌یابی Plugin**: هرگونه هشدار یا خطای زمان بارگذاری را که رجیستری Plugin منتشر کرده است نمایان می‌کند.
    - **بازیابی TaskFlow**: TaskFlowهای مدیریت‌شده مشکوکی را نمایان می‌کند که به بررسی دستی یا لغو نیاز دارند.
    - **Claude CLI**: فقط مشکلات باینری، احراز هویت، پروفایل، فضای کاری یا دایرکتوری پروژه را گزارش می‌کند؛ جزئیات بررسی سالم حذف می‌شوند.

  </Accordion>
  <Accordion title="11b. اندازه فایل راه‌اندازی اولیه">
    Doctor بررسی می‌کند که آیا فایل‌های راه‌اندازی اولیه فضای کاری (برای مثال `AGENTS.md`، `CLAUDE.md` یا دیگر فایل‌های زمینه تزریق‌شده) نزدیک به بودجه نویسه پیکربندی‌شده یا بیشتر از آن هستند. تعداد نویسه‌های خام در برابر تزریق‌شده برای هر فایل، درصد برش، علت برش (`max/file` یا `max/total`) و مجموع نویسه‌های تزریق‌شده به‌عنوان کسری از کل بودجه را گزارش می‌کند. وقتی فایل‌ها بریده شده باشند یا به حد مجاز نزدیک باشند، doctor نکاتی برای تنظیم `agents.defaults.bootstrapMaxChars` و `agents.defaults.bootstrapTotalMaxChars` نمایش می‌دهد.
  </Accordion>
  <Accordion title="11c. تکمیل خودکار پوسته">
    Doctor بررسی می‌کند که آیا تکمیل با کلید Tab برای پوسته فعلی (zsh، bash، fish یا PowerShell) نصب شده است:

    - اگر پروفایل پوسته از الگوی کند تکمیل پویای (`source <(openclaw completion ...)`) استفاده کند، doctor آن را به نوع سریع‌ترِ فایل ذخیره‌شده در حافظه نهان ارتقا می‌دهد.
    - اگر تکمیل در پروفایل پیکربندی شده باشد اما فایل حافظه نهان وجود نداشته باشد، doctor به‌طور خودکار حافظه نهان را بازتولید می‌کند.
    - اگر هیچ تکمیلی پیکربندی نشده باشد، doctor برای نصب آن درخواست تأیید می‌کند (فقط حالت تعاملی؛ با `--non-interactive` نادیده گرفته می‌شود).

    برای بازتولید دستی حافظه نهان، `openclaw completion --write-state` را اجرا کنید.

  </Accordion>
  <Accordion title="11d. پاک‌سازی Plugin قدیمی کانال">
    وقتی `openclaw doctor --fix` یک Plugin مفقود کانال را حذف می‌کند، پیکربندی معلقِ مختص کانال را که به آن Plugin ارجاع می‌داد نیز حذف می‌کند: ورودی‌های `channels.<id>`، مقصدهای Heartbeat که نام کانال را داشتند و بازنویسی‌های `agents.*.models["<channel>/*"]`. این کار از حلقه‌های راه‌اندازی Gateway جلوگیری می‌کند که در آن‌ها زمان اجرای کانال از بین رفته، اما پیکربندی همچنان از Gateway می‌خواهد به آن متصل شود.
  </Accordion>
  <Accordion title="12. بررسی‌های احراز هویت Gateway (توکن محلی)">
    Doctor آمادگی احراز هویت با توکن محلی Gateway را بررسی می‌کند.

    - اگر حالت توکن به توکن نیاز داشته باشد و هیچ منبع توکنی وجود نداشته باشد، doctor پیشنهاد تولید توکن می‌دهد.
    - اگر `gateway.auth.token` با SecretRef مدیریت شود اما در دسترس نباشد، doctor هشدار می‌دهد و آن را با متن ساده بازنویسی نمی‌کند.
    - `openclaw doctor --generate-gateway-token` فقط زمانی تولید را اجباری می‌کند که هیچ SecretRef توکنی پیکربندی نشده باشد.

  </Accordion>
  <Accordion title="12b. اصلاحات فقط‌خواندنی و آگاه از SecretRef">
    برخی جریان‌های اصلاح باید اعتبارنامه‌های پیکربندی‌شده را بدون تضعیف رفتار شکست سریع زمان اجرا بررسی کنند.

    - `openclaw doctor --fix` برای ترمیم‌های هدفمند پیکربندی، از همان مدل خلاصهٔ فقط‌خواندنی SecretRef استفاده می‌کند که فرمان‌های خانوادهٔ وضعیت به‌کار می‌برند.
    - مثال: ترمیم Telegram `allowFrom` / `groupAllowFrom` `@username` تلاش می‌کند در صورت موجود بودن، از اعتبارنامه‌های پیکربندی‌شدهٔ ربات استفاده کند.
    - اگر توکن ربات Telegram از طریق SecretRef پیکربندی شده باشد اما در مسیر فرمان فعلی در دسترس نباشد، doctor گزارش می‌دهد که اعتبارنامه پیکربندی‌شده اما در دسترس نیست و به‌جای ازکارافتادن یا گزارش نادرست توکن به‌عنوان مفقود، از رفع خودکار صرف‌نظر می‌کند.

  </Accordion>
  <Accordion title="۱۳. بررسی سلامت Gateway و راه‌اندازی مجدد">
    Doctor یک بررسی سلامت اجرا می‌کند و وقتی Gateway ناسالم به نظر برسد، پیشنهاد راه‌اندازی مجدد آن را می‌دهد.
  </Accordion>
  <Accordion title="۱۳ب. آمادگی جست‌وجوی حافظه">
    Doctor بررسی می‌کند که آیا ارائه‌دهندهٔ embedding پیکربندی‌شده برای جست‌وجوی حافظه، برای عامل پیش‌فرض آماده است یا خیر. رفتار به backend و ارائه‌دهندهٔ پیکربندی‌شده بستگی دارد:

    - **backend ‏QMD**: بررسی می‌کند که آیا فایل اجرایی `qmd` موجود و قابل راه‌اندازی است یا خیر. اگر نباشد، راهنمای رفع مشکل شامل `npm install -g @tobilu/qmd` (یا معادل Bun آن) و گزینه‌ای برای مسیر دستی فایل اجرایی را نمایش می‌دهد.
    - **ارائه‌دهندهٔ محلی صریح**: وجود یک فایل مدل محلی یا URL شناخته‌شدهٔ مدل راه‌دور/قابل‌دانلود را بررسی می‌کند. اگر موجود نباشد، تغییر به یک ارائه‌دهندهٔ راه‌دور را پیشنهاد می‌دهد.
    - **ارائه‌دهندهٔ راه‌دور صریح** (`openai`، `voyage` و غیره): تأیید می‌کند که یک کلید API در محیط یا مخزن احراز هویت موجود است. اگر موجود نباشد، راهنمای عملی برای رفع مشکل نمایش می‌دهد.
    - **ارائه‌دهندهٔ خودکار قدیمی**: با `memorySearch.provider: "auto"` به‌عنوان OpenAI رفتار می‌کند، آمادگی OpenAI را بررسی می‌کند و `doctor --fix` آن را به `provider: "openai"` بازنویسی می‌کند.

    وقتی نتیجهٔ ذخیره‌شدهٔ بررسی Gateway موجود باشد (Gateway هنگام بررسی سالم بوده است)، doctor نتیجهٔ آن را با پیکربندی قابل‌مشاهده در CLI تطبیق می‌دهد و هرگونه مغایرت را ذکر می‌کند. Doctor در مسیر پیش‌فرض یک درخواست آزمایشی embedding جدید آغاز نمی‌کند؛ هرگاه بررسی زندهٔ ارائه‌دهنده را می‌خواهید، از فرمان وضعیت عمیق حافظه استفاده کنید.

    برای تأیید آمادگی embedding در زمان اجرا، از `openclaw memory status --deep` استفاده کنید.

  </Accordion>
  <Accordion title="۱۴. هشدارهای وضعیت کانال">
    اگر Gateway سالم باشد، doctor یک بررسی وضعیت کانال اجرا می‌کند و هشدارها را همراه با راهکارهای پیشنهادی گزارش می‌دهد.
  </Accordion>
  <Accordion title="۱۵. ممیزی و ترمیم پیکربندی سرپرست">
    Doctor پیکربندی سرپرست نصب‌شده (launchd/systemd/schtasks) را برای پیش‌فرض‌های مفقود یا قدیمی (برای مثال، وابستگی‌های network-online در systemd و تأخیر راه‌اندازی مجدد) بررسی می‌کند. وقتی مغایرتی پیدا کند، به‌روزرسانی را توصیه می‌کند و می‌تواند فایل سرویس/وظیفه را مطابق پیش‌فرض‌های فعلی بازنویسی کند.

    نکته‌ها:

    - `openclaw doctor` پیش از بازنویسی پیکربندی سرپرست، تأیید می‌خواهد.
    - `openclaw doctor --yes` درخواست‌های پیش‌فرض ترمیم را می‌پذیرد.
    - `openclaw doctor --fix` ترمیم‌های توصیه‌شده را بدون درخواست تأیید اعمال می‌کند (`--repair` نام مستعار آن است).
    - `openclaw doctor --fix --force` پیکربندی‌های سفارشی سرپرست را بازنویسی می‌کند.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` در چرخهٔ عمر سرویس Gateway، doctor را فقط‌خواندنی نگه می‌دارد. همچنان سلامت سرویس را گزارش می‌کند و ترمیم‌های غیرسرویسی را انجام می‌دهد، اما چون یک سرپرست خارجی مالک این چرخهٔ عمر است، از نصب/شروع/راه‌اندازی مجدد/bootstrap سرویس، بازنویسی پیکربندی سرپرست و پاک‌سازی سرویس‌های قدیمی صرف‌نظر می‌کند.
    - در Linux، تا زمانی که واحد systemd متناظر Gateway فعال باشد، doctor فرادادهٔ فرمان/نقطهٔ ورود را بازنویسی نمی‌کند. همچنین هنگام پویش سرویس‌های تکراری، واحدهای اضافی غیرفعال و غیرقدیمیِ شبیه Gateway را نادیده می‌گیرد تا فایل‌های سرویس همراه باعث ایجاد پیام‌های زائد پاک‌سازی نشوند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و `gateway.auth.token` با SecretRef مدیریت شود، نصب/ترمیم سرویس توسط doctor، ‏SecretRef را اعتبارسنجی می‌کند اما مقادیر متن سادهٔ حل‌شدهٔ توکن را در فرادادهٔ محیط سرویس سرپرست ذخیره نمی‌کند.
    - Doctor مقادیر مدیریت‌شدهٔ `.env`/متکی بر SecretRef در محیط سرویس را که نصب‌های قدیمی‌تر LaunchAgent، ‏systemd یا Windows Scheduled Task به‌صورت درون‌خطی جاسازی کرده‌اند، تشخیص می‌دهد و فرادادهٔ سرویس را بازنویسی می‌کند تا آن مقادیر به‌جای تعریف سرپرست، از منبع زمان اجرا بارگذاری شوند.
    - Doctor تشخیص می‌دهد که فرمان سرویس پس از تغییر `gateway.port` همچنان یک `--port` قدیمی را ثابت نگه داشته است و فرادادهٔ سرویس را با درگاه فعلی بازنویسی می‌کند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل‌نشده باشد، doctor مسیر نصب/ترمیم را با راهنمای عملی مسدود می‌کند.
    - اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، doctor نصب/ترمیم را تا زمان تنظیم صریح حالت مسدود می‌کند.
    - برای واحدهای user-systemd در Linux، بررسی‌های انحراف توکن توسط doctor هنگام مقایسهٔ فرادادهٔ احراز هویت سرویس، هر دو منبع `Environment=` و `EnvironmentFile=` را شامل می‌شوند.
    - ترمیم سرویس توسط doctor از بازنویسی، توقف یا راه‌اندازی مجدد سرویس Gateway با یک فایل اجرایی قدیمی‌تر OpenClaw خودداری می‌کند، اگر پیکربندی آخرین بار توسط نسخه‌ای جدیدتر نوشته شده باشد. [عیب‌یابی Gateway](/fa/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) را ببینید.
    - همیشه می‌توانید با `openclaw gateway install --force` یک بازنویسی کامل را اجبار کنید.

  </Accordion>
  <Accordion title="۱۶. عیب‌یابی زمان اجرای Gateway و درگاه">
    Doctor زمان اجرای سرویس (PID و آخرین وضعیت خروج) را بررسی می‌کند و وقتی سرویس نصب شده اما عملاً در حال اجرا نیست، هشدار می‌دهد. همچنین تداخل در درگاه Gateway (پیش‌فرض `18789`) را بررسی و علت‌های محتمل (Gateway از قبل در حال اجرا است، تونل SSH) را گزارش می‌کند.
  </Accordion>
  <Accordion title="۱۷. بهترین روش‌های زمان اجرای Gateway">
    Doctor هنگامی هشدار می‌دهد که سرویس Gateway روی Bun یا یک مسیر Node مدیریت‌شده با نسخه (`nvm`، `fnm`، `volta`، `asdf` و غیره) اجرا شود. Bun نمی‌تواند مخزن وضعیت `node:sqlite` متعلق به OpenClaw را باز کند؛ بنابراین ترمیم‌ها سرویس‌های قدیمی Bun را به Node منتقل می‌کنند. مسیرهای مدیر نسخه ممکن است پس از ارتقا از کار بیفتند، زیرا سرویس فایل آغازین پوسته را بارگذاری نمی‌کند. Doctor در صورت موجود بودن، انتقال به نصب سیستمی Node را پیشنهاد می‌دهد (Homebrew/apt/choco).

    LaunchAgentهای macOS که به‌تازگی نصب یا ترمیم شده‌اند، به‌جای کپی‌کردن PATH پوستهٔ تعاملی، از یک PATH سیستمی استاندارد (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) استفاده می‌کنند؛ بنابراین فایل‌های اجرایی سیستمی مدیریت‌شده با Homebrew در دسترس می‌مانند، درحالی‌که دایرکتوری‌های Volta، ‏asdf، ‏fnm، ‏pnpm و دیگر مدیران نسخه تعیین Node قابل‌حل برای فرایندهای فرزند را تغییر نمی‌دهند. سرویس‌های Linux همچنان ریشه‌های صریح محیط (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) و دایرکتوری‌های پایدار فایل‌های اجرایی کاربر را حفظ می‌کنند، اما دایرکتوری‌های جایگزین حدس‌زده‌شدهٔ مدیر نسخه فقط زمانی در PATH سرویس نوشته می‌شوند که روی دیسک موجود باشند.

  </Accordion>
  <Accordion title="۱۸. نوشتن پیکربندی و فرادادهٔ راهنما">
    Doctor همهٔ تغییرات پیکربندی را ماندگار می‌کند و برای ثبت اجرای doctor، فرادادهٔ راهنما را مهر می‌زند.
  </Accordion>
  <Accordion title="۱۹. نکته‌های فضای کاری (پشتیبان‌گیری و سامانهٔ حافظه)">
    Doctor در صورت نبود سامانهٔ حافظهٔ فضای کاری، آن را پیشنهاد می‌دهد و اگر فضای کاری از قبل تحت git نباشد، نکته‌ای برای پشتیبان‌گیری نمایش می‌دهد.

    برای راهنمای کامل ساختار فضای کاری و پشتیبان‌گیری با git (GitHub یا GitLab خصوصی توصیه می‌شود)، به [/concepts/agent-workspace](/fa/concepts/agent-workspace) مراجعه کنید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [راهنمای عملیاتی Gateway](/fa/gateway)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
