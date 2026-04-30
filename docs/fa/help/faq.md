---
read_when:
    - پاسخ‌گویی به پرسش‌های رایج پشتیبانی درباره راه‌اندازی، نصب، شروع به کار یا زمان اجرا
    - تریاژ مشکلات گزارش‌شده توسط کاربران پیش از اشکال‌زدایی عمیق‌تر
summary: پرسش‌های متداول درباره راه‌اندازی، پیکربندی و استفاده از OpenClaw
title: پرسش‌های متداول
x-i18n:
    generated_at: "2026-04-30T09:37:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: c09be6571e048b71e4e02288b22b51e70102872675dfc7bef133b955a06f6ac9
    source_path: help/faq.md
    workflow: 16
---

پاسخ‌های سریع به‌همراه عیب‌یابی عمیق‌تر برای راه‌اندازی‌های دنیای واقعی (توسعهٔ محلی، VPS، چندعاملی، کلیدهای OAuth/API، جایگزینی مدل هنگام خرابی). برای عیب‌یابی زمان اجرا، [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید. برای مرجع کامل پیکربندی، [پیکربندی](/fa/gateway/configuration) را ببینید.

## ۶۰ ثانیهٔ اول اگر چیزی خراب است

1. **وضعیت سریع (اولین بررسی)**

   ```bash
   openclaw status
   ```

   خلاصهٔ محلی سریع: سیستم‌عامل + به‌روزرسانی، دسترس‌پذیری gateway/service، agentها/sessionها، پیکربندی provider + مشکلات زمان اجرا (وقتی gateway در دسترس باشد).

2. **گزارش قابل جای‌گذاری (امن برای اشتراک‌گذاری)**

   ```bash
   openclaw status --all
   ```

   تشخیص فقط‌خواندنی همراه با انتهای لاگ (tokenها حذف شده‌اند).

3. **وضعیت daemon + پورت**

   ```bash
   openclaw gateway status
   ```

   زمان اجرای supervisor در برابر دسترس‌پذیری RPC، URL هدف probe، و اینکه سرویس احتمالاً از کدام پیکربندی استفاده کرده است را نشان می‌دهد.

4. **probeهای عمیق**

   ```bash
   openclaw status --deep
   ```

   یک probe زندهٔ سلامت gateway اجرا می‌کند، از جمله probeهای channel در صورت پشتیبانی
   (به gateway قابل دسترس نیاز دارد). [سلامت](/fa/gateway/health) را ببینید.

5. **دنبال‌کردن آخرین لاگ**

   ```bash
   openclaw logs --follow
   ```

   اگر RPC از کار افتاده است، به این fallback کنید:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   لاگ‌های فایل از لاگ‌های سرویس جدا هستند؛ [ثبت لاگ](/fa/logging) و [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید.

6. **اجرای doctor (تعمیرها)**

   ```bash
   openclaw doctor
   ```

   پیکربندی/وضعیت را تعمیر/مهاجرت می‌دهد + بررسی‌های سلامت را اجرا می‌کند. [Doctor](/fa/gateway/doctor) را ببینید.

7. **عکس‌برداری Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   از Gateway در حال اجرا یک عکس‌برداری کامل درخواست می‌کند (فقط WS). [Health](/fa/gateway/health) را ببینید.

## شروع سریع و راه‌اندازی اجرای اول

پرسش‌وپاسخ اجرای اول — نصب، ورود اولیه، مسیرهای احراز هویت، اشتراک‌ها، خطاهای اولیه —
در [پرسش‌های متداول اجرای اول](/fa/help/faq-first-run) آمده است.

## OpenClaw چیست؟

<AccordionGroup>
  <Accordion title="OpenClaw در یک پاراگراف چیست؟">
    OpenClaw یک دستیار هوش مصنوعی شخصی است که روی دستگاه‌های خودتان اجرا می‌کنید. روی سطوح پیام‌رسانی‌ای که از قبل استفاده می‌کنید پاسخ می‌دهد (WhatsApp، Telegram، Slack، Mattermost، Discord، Google Chat، Signal، iMessage، WebChat، و Pluginهای کانال همراه مانند QQ Bot) و همچنین می‌تواند روی پلتفرم‌های پشتیبانی‌شده صدا + یک Canvas زنده ارائه کند. **Gateway** صفحه کنترل همیشه‌روشن است؛ دستیار همان محصول است.
  </Accordion>

  <Accordion title="ارزش پیشنهادی">
    OpenClaw «فقط یک wrapper برای Claude» نیست. یک **صفحه کنترل local-first** است که به شما امکان می‌دهد یک
    دستیار توانمند را روی **سخت‌افزار خودتان** اجرا کنید، از برنامه‌های گفت‌وگویی که از قبل استفاده می‌کنید به آن دسترسی داشته باشید، با
    نشست‌های دارای وضعیت، حافظه، و ابزارها - بدون اینکه کنترل گردش‌کارهای خود را به یک
    SaaS میزبانی‌شده واگذار کنید.

    نکات برجسته:

    - **دستگاه‌های شما، داده‌های شما:** Gateway را هرجا می‌خواهید اجرا کنید (Mac، Linux، VPS) و
      فضای کاری + تاریخچه نشست را محلی نگه دارید.
    - **کانال‌های واقعی، نه sandbox وب:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/و غیره،
      به‌علاوه صدای موبایل و Canvas روی پلتفرم‌های پشتیبانی‌شده.
    - **مستقل از مدل:** از Anthropic، OpenAI، MiniMax، OpenRouter و غیره استفاده کنید، با مسیریابی
      و failover جداگانه برای هر عامل.
    - **گزینه فقط محلی:** مدل‌های محلی را اجرا کنید تا اگر بخواهید **همه داده‌ها بتوانند روی دستگاه شما بمانند**.
    - **مسیریابی چندعاملی:** عامل‌های جداگانه برای هر کانال، حساب، یا وظیفه، هرکدام با
      فضای کاری و پیش‌فرض‌های خودش.
    - **متن‌باز و قابل دستکاری:** بدون قفل‌شدن به فروشنده، بررسی، گسترش، و خودمیزبانی کنید.

    مستندات: [Gateway](/fa/gateway)، [کانال‌ها](/fa/channels)، [چندعاملی](/fa/concepts/multi-agent)،
    [حافظه](/fa/concepts/memory).

  </Accordion>

  <Accordion title="تازه راه‌اندازی‌اش کردم - اول چه کار کنم؟">
    پروژه‌های خوب برای شروع:

    - یک وب‌سایت بسازید (WordPress، Shopify، یا یک سایت ایستای ساده).
    - نمونه اولیه یک اپ موبایل بسازید (طرح کلی، صفحه‌ها، برنامه API).
    - فایل‌ها و پوشه‌ها را سازمان‌دهی کنید (پاک‌سازی، نام‌گذاری، برچسب‌گذاری).
    - Gmail را وصل کنید و خلاصه‌ها یا پیگیری‌ها را خودکار کنید.

    می‌تواند وظایف بزرگ را انجام دهد، اما وقتی آن‌ها را به مرحله‌ها تقسیم کنید و
    برای کار موازی از زیرعامل‌ها استفاده کنید بهترین عملکرد را دارد.

  </Accordion>

  <Accordion title="پنج مورد استفاده روزمره برتر برای OpenClaw کدام‌اند؟">
    موفقیت‌های روزمره معمولا این‌طور به نظر می‌رسند:

    - **گزارش‌های شخصی:** خلاصه‌های صندوق ورودی، تقویم، و خبرهایی که برایتان مهم است.
    - **پژوهش و پیش‌نویس‌نویسی:** پژوهش سریع، خلاصه‌ها، و پیش‌نویس‌های اولیه برای ایمیل‌ها یا مستندات.
    - **یادآورها و پیگیری‌ها:** تلنگرها و چک‌لیست‌های مبتنی بر Cron یا Heartbeat.
    - **خودکارسازی مرورگر:** پر کردن فرم‌ها، جمع‌آوری داده‌ها، و تکرار وظایف وب.
    - **هماهنگی بین دستگاه‌ها:** یک وظیفه را از گوشی خود ارسال کنید، بگذارید Gateway آن را روی یک سرور اجرا کند، و نتیجه را در گفت‌وگو دریافت کنید.

  </Accordion>

  <Accordion title="آیا OpenClaw می‌تواند به تولید سرنخ، ارتباط‌گیری، تبلیغات و وبلاگ‌ها برای یک SaaS کمک کند؟">
    بله، برای **پژوهش، ارزیابی صلاحیت، و پیش‌نویس‌نویسی**. می‌تواند سایت‌ها را بررسی کند، فهرست‌های کوتاه بسازد،
    سرنخ‌ها را خلاصه کند، و پیش‌نویس متن ارتباط‌گیری یا تبلیغات را بنویسد.

    برای **ارتباط‌گیری یا اجرای تبلیغات**، انسان را در چرخه نگه دارید. از هرزنامه پرهیز کنید، قوانین محلی و
    سیاست‌های پلتفرم را رعایت کنید، و قبل از ارسال هر چیزی آن را بازبینی کنید. امن‌ترین الگو این است که
    OpenClaw پیش‌نویس کند و شما تأیید کنید.

    مستندات: [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="مزایا در مقایسه با Claude Code برای توسعه وب چیست؟">
    OpenClaw یک **دستیار شخصی** و لایه هماهنگی است، نه جایگزین IDE. از
    Claude Code یا Codex برای سریع‌ترین چرخه کدنویسی مستقیم داخل یک مخزن استفاده کنید. وقتی از OpenClaw استفاده کنید که
    حافظه پایدار، دسترسی میان‌دستگاهی، و هماهنگ‌سازی ابزارها می‌خواهید.

    مزایا:

    - **حافظه پایدار + فضای کاری** در سراسر نشست‌ها
    - **دسترسی چندپلتفرمی** (WhatsApp، Telegram، TUI، WebChat)
    - **هماهنگ‌سازی ابزارها** (مرورگر، فایل‌ها، زمان‌بندی، هوک‌ها)
    - **Gateway همیشه‌روشن** (اجرا روی VPS، تعامل از هر جا)
    - **Nodeها** برای مرورگر/صفحه‌نمایش/دوربین/اجرای محلی

    نمایش: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills و اتوماسیون

<AccordionGroup>
  <Accordion title="چطور Skills را بدون کثیف نگه داشتن مخزن سفارشی کنم؟">
    به‌جای ویرایش نسخه مخزن، از بازنویسی‌های مدیریت‌شده استفاده کنید. تغییراتتان را در `~/.openclaw/skills/<name>/SKILL.md` بگذارید (یا از طریق `skills.load.extraDirs` در `~/.openclaw/openclaw.json` یک پوشه اضافه کنید). تقدم به این صورت است: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → همراه → `skills.load.extraDirs`، بنابراین بازنویسی‌های مدیریت‌شده بدون دست زدن به git همچنان بر Skills همراه اولویت دارند. اگر لازم است Skill به‌صورت سراسری نصب شود اما فقط برای برخی عامل‌ها دیده شود، نسخه مشترک را در `~/.openclaw/skills` نگه دارید و دیده‌شدن را با `agents.defaults.skills` و `agents.list[].skills` کنترل کنید. فقط ویرایش‌هایی که ارزش ارسال به بالادست دارند باید در مخزن قرار بگیرند و به‌صورت PR ارسال شوند.
  </Accordion>

  <Accordion title="آیا می‌توانم Skills را از یک پوشه سفارشی بارگذاری کنم؟">
    بله. پوشه‌های اضافی را از طریق `skills.load.extraDirs` در `~/.openclaw/openclaw.json` اضافه کنید (کمترین تقدم). تقدم پیش‌فرض به این صورت است: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → همراه → `skills.load.extraDirs`. `clawhub` به‌طور پیش‌فرض در `./skills` نصب می‌کند، که OpenClaw در نشست بعدی آن را به‌عنوان `<workspace>/skills` در نظر می‌گیرد. اگر Skill فقط باید برای عامل‌های مشخصی دیده شود، آن را با `agents.defaults.skills` یا `agents.list[].skills` همراه کنید.
  </Accordion>

  <Accordion title="چطور می‌توانم برای کارهای مختلف از مدل‌های متفاوت استفاده کنم؟">
    الگوهای پشتیبانی‌شده فعلی این‌ها هستند:

    - **کارهای Cron**: کارهای ایزوله می‌توانند برای هر کار یک بازنویسی `model` تنظیم کنند.
    - **عامل‌های فرعی**: کارها را به عامل‌های جداگانه با مدل‌های پیش‌فرض متفاوت هدایت کنید.
    - **تغییر درخواستی**: از `/model` استفاده کنید تا مدل نشست فعلی را هر زمان تغییر دهید.

    [کارهای Cron](/fa/automation/cron-jobs)، [مسیردهی چندعاملی](/fa/concepts/multi-agent)، و [دستورهای Slash](/fa/tools/slash-commands) را ببینید.

  </Accordion>

  <Accordion title="ربات هنگام انجام کار سنگین متوقف می‌شود. چطور آن را برون‌سپاری کنم؟">
    برای کارهای طولانی یا موازی از **عامل‌های فرعی** استفاده کنید. عامل‌های فرعی در نشست خودشان اجرا می‌شوند،
    خلاصه‌ای برمی‌گردانند، و چت اصلی شما را پاسخ‌گو نگه می‌دارند.

    از رباتتان بخواهید «برای این کار یک عامل فرعی ایجاد کند» یا از `/subagents` استفاده کنید.
    برای دیدن اینکه Gateway همین حالا چه می‌کند (و آیا مشغول است)، در چت از `/status` استفاده کنید.

    نکته توکن: کارهای طولانی و عامل‌های فرعی هر دو توکن مصرف می‌کنند. اگر هزینه مهم است، از طریق
    `agents.defaults.subagents.model` یک مدل ارزان‌تر برای عامل‌های فرعی تنظیم کنید.

    مستندات: [عامل‌های فرعی](/fa/tools/subagents)، [کارهای پس‌زمینه](/fa/automation/tasks).

  </Accordion>

  <Accordion title="نشست‌های عامل فرعی وابسته به رشته در Discord چطور کار می‌کنند؟">
    از اتصال‌های رشته استفاده کنید. می‌توانید یک رشته Discord را به یک عامل فرعی یا هدف نشست متصل کنید تا پیام‌های بعدی در آن رشته روی همان نشست متصل باقی بمانند.

    جریان پایه:

    - با `sessions_spawn` و با استفاده از `thread: true` ایجاد کنید (و در صورت نیاز `mode: "session"` را برای پیگیری پایدار اضافه کنید).
    - یا با `/focus <target>` به‌صورت دستی متصل کنید.
    - برای بررسی وضعیت اتصال از `/agents` استفاده کنید.
    - برای کنترل خروج خودکار از تمرکز از `/session idle <duration|off>` و `/session max-age <duration|off>` استفاده کنید.
    - برای جدا کردن رشته از `/unfocus` استفاده کنید.

    پیکربندی لازم:

    - پیش‌فرض‌های سراسری: `session.threadBindings.enabled`، `session.threadBindings.idleHours`، `session.threadBindings.maxAgeHours`.
    - بازنویسی‌های Discord: `channels.discord.threadBindings.enabled`، `channels.discord.threadBindings.idleHours`، `channels.discord.threadBindings.maxAgeHours`.
    - اتصال خودکار هنگام ایجاد: `channels.discord.threadBindings.spawnSubagentSessions: true` را تنظیم کنید.

    مستندات: [عامل‌های فرعی](/fa/tools/subagents)، [Discord](/fa/channels/discord)، [مرجع پیکربندی](/fa/gateway/configuration-reference)، [دستورهای Slash](/fa/tools/slash-commands).

  </Accordion>

  <Accordion title="یک عامل فرعی تمام شد، اما به‌روزرسانی تکمیل به جای اشتباه رفت یا هرگز ارسال نشد. چه چیزی را بررسی کنم؟">
    ابتدا مسیر درخواست‌کننده حل‌شده را بررسی کنید:

    - تحویل عامل فرعی در حالت تکمیل، وقتی وجود داشته باشد، هر رشته متصل یا مسیر گفت‌وگو را ترجیح می‌دهد.
    - اگر مبدأ تکمیل فقط یک کانال داشته باشد، OpenClaw به مسیر ذخیره‌شده نشست درخواست‌کننده (`lastChannel` / `lastTo` / `lastAccountId`) برمی‌گردد تا تحویل مستقیم همچنان بتواند موفق شود.
    - اگر نه مسیر متصلی وجود داشته باشد و نه مسیر ذخیره‌شده قابل استفاده‌ای، تحویل مستقیم ممکن است شکست بخورد و نتیجه به‌جای ارسال فوری به چت، به تحویل صف‌شده نشست برگردد.
    - هدف‌های نامعتبر یا کهنه همچنان می‌توانند بازگشت به صف یا شکست نهایی تحویل را تحمیل کنند.
    - اگر آخرین پاسخ قابل مشاهده دستیار در فرزند دقیقاً توکن بی‌صدای `NO_REPLY` / `no_reply`، یا دقیقاً `ANNOUNCE_SKIP` باشد، OpenClaw عمداً به‌جای ارسال پیشرفت قدیمی‌تر، اعلان را سرکوب می‌کند.
    - اگر فرزند پس از فقط فراخوانی‌های ابزار زمان‌تمام شود، اعلان می‌تواند آن را به‌جای بازپخش خروجی خام ابزار، به یک خلاصه کوتاه از پیشرفت جزئی تبدیل کند.

    اشکال‌زدایی:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [عامل‌های فرعی](/fa/tools/subagents)، [کارهای پس‌زمینه](/fa/automation/tasks)، [ابزارهای نشست](/fa/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron یا یادآورها اجرا نمی‌شوند. چه چیزی را بررسی کنم؟">
    Cron داخل فرایند Gateway اجرا می‌شود. اگر Gateway به‌طور پیوسته در حال اجرا نباشد،
    کارهای زمان‌بندی‌شده اجرا نخواهند شد.

    چک‌لیست:

    - تأیید کنید cron فعال است (`cron.enabled`) و `OPENCLAW_SKIP_CRON` تنظیم نشده است.
    - بررسی کنید Gateway به‌صورت 24/7 در حال اجراست (بدون خواب/راه‌اندازی مجدد).
    - تنظیمات منطقه زمانی کار را بررسی کنید (`--tz` در برابر منطقه زمانی میزبان).

    اشکال‌زدایی:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [اتوماسیون و کارها](/fa/automation).

  </Accordion>

  <Accordion title="Cron اجرا شد، اما چیزی به کانال ارسال نشد. چرا؟">
    ابتدا حالت تحویل را بررسی کنید:

    - `--no-deliver` / `delivery.mode: "none"` یعنی انتظار نمی‌رود ارسال جایگزین اجراکننده انجام شود.
    - نبودن یا نامعتبر بودن مقصد اعلام (`channel` / `to`) یعنی اجراکننده تحویل خروجی را نادیده گرفته است.
    - خطاهای احراز هویت کانال (`unauthorized`, `Forbidden`) یعنی اجراکننده تلاش کرده تحویل دهد، اما اعتبارنامه‌ها مانع شده‌اند.
    - نتیجه ایزوله بی‌صدا (فقط `NO_REPLY` / `no_reply`) عمدا غیرقابل تحویل تلقی می‌شود، بنابراین اجراکننده تحویل جایگزین صف‌شده را هم سرکوب می‌کند.

    برای کارهای Cron ایزوله، وقتی مسیر چت در دسترس باشد، عامل همچنان می‌تواند
    مستقیما با ابزار `message` ارسال کند. `--announce` فقط مسیر جایگزین اجراکننده
    را برای متن نهایی‌ای کنترل می‌کند که عامل قبلا ارسال نکرده است.

    اشکال‌زدایی:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [وظایف پس‌زمینه](/fa/automation/tasks).

  </Accordion>

  <Accordion title="چرا یک اجرای Cron ایزوله مدل‌ها را تغییر داد یا یک بار دوباره تلاش کرد؟">
    این معمولا مسیر تغییر مدل زنده است، نه زمان‌بندی تکراری.

    Cron ایزوله می‌تواند واگذاری مدل زمان اجرا را پایدار کند و وقتی اجرای فعال
    `LiveSessionModelSwitchError` پرتاب می‌کند، دوباره تلاش کند. تلاش مجدد همان
    ارائه‌دهنده/مدل تغییرکرده را نگه می‌دارد و اگر تغییر شامل override جدیدی برای پروفایل احراز هویت باشد، Cron
    آن را هم پیش از تلاش مجدد پایدار می‌کند.

    قواعد مرتبط انتخاب:

    - override مدل قلاب Gmail، وقتی قابل اعمال باشد، ابتدا برنده می‌شود.
    - سپس `model` هر کار.
    - سپس هر override مدل ذخیره‌شده برای نشست Cron.
    - سپس انتخاب عادی مدل عامل/پیش‌فرض.

    حلقه تلاش مجدد کران‌دار است. پس از تلاش اولیه به‌همراه ۲ تلاش مجدد تغییر،
    Cron به‌جای حلقه بی‌پایان، متوقف می‌شود.

    اشکال‌زدایی:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [CLI مربوط به Cron](/fa/cli/cron).

  </Accordion>

  <Accordion title="چگونه Skills را روی Linux نصب کنم؟">
    از فرمان‌های بومی `openclaw skills` استفاده کنید یا Skills را در فضای کاری خود قرار دهید. رابط کاربری Skills در macOS روی Linux در دسترس نیست.
    Skills را در [https://clawhub.ai](https://clawhub.ai) مرور کنید.

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    فرمان بومی `openclaw skills install` در دایرکتوری `skills/`
    فضای کاری فعال می‌نویسد. CLI جداگانه `clawhub` را فقط وقتی نصب کنید که بخواهید Skills خودتان را منتشر یا
    همگام‌سازی کنید. برای نصب‌های مشترک بین عامل‌ها، Skill را زیر
    `~/.openclaw/skills` بگذارید و اگر می‌خواهید محدود کنید کدام عامل‌ها بتوانند آن را ببینند، از
    `agents.defaults.skills` یا `agents.list[].skills` استفاده کنید.

  </Accordion>

  <Accordion title="آیا OpenClaw می‌تواند وظایف را طبق زمان‌بندی یا به‌طور پیوسته در پس‌زمینه اجرا کند؟">
    بله. از زمان‌بند Gateway استفاده کنید:

    - **کارهای Cron** برای وظایف زمان‌بندی‌شده یا تکرارشونده (در راه‌اندازی‌های مجدد پایدار می‌مانند).
    - **Heartbeat** برای بررسی‌های دوره‌ای «نشست اصلی».
    - **کارهای ایزوله** برای عامل‌های خودکاری که خلاصه‌ها را منتشر می‌کنند یا به چت‌ها تحویل می‌دهند.

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [اتوماسیون و وظایف](/fa/automation)،
    [Heartbeat](/fa/gateway/heartbeat).

  </Accordion>

  <Accordion title="آیا می‌توانم Skills مخصوص Apple macOS را از Linux اجرا کنم؟">
    نه به‌طور مستقیم. Skills مربوط به macOS با `metadata.openclaw.os` به‌همراه باینری‌های لازم محدود می‌شوند، و Skills فقط وقتی در اعلان سیستم ظاهر می‌شوند که روی **میزبان Gateway** واجد شرایط باشند. روی Linux، Skills فقط مخصوص `darwin` (مانند `apple-notes`، `apple-reminders`، `things-mac`) بارگذاری نمی‌شوند، مگر اینکه این محدودسازی را override کنید.

    سه الگوی پشتیبانی‌شده دارید:

    **گزینه A - Gateway را روی Mac اجرا کنید (ساده‌ترین).**
    Gateway را جایی اجرا کنید که باینری‌های macOS وجود دارند، سپس از Linux در [حالت دوردست](#gateway-ports-already-running-and-remote-mode) یا از طریق Tailscale وصل شوید. Skills به‌طور عادی بارگذاری می‌شوند چون میزبان Gateway همان macOS است.

    **گزینه B - از یک نود macOS استفاده کنید (بدون SSH).**
    Gateway را روی Linux اجرا کنید، یک نود macOS (برنامه نوار منو) جفت کنید، و **فرمان‌های اجرای نود** را روی Mac به "Always Ask" یا "Always Allow" تنظیم کنید. OpenClaw وقتی باینری‌های لازم روی نود وجود داشته باشند، می‌تواند Skills مخصوص macOS را واجد شرایط تلقی کند. عامل آن Skills را از طریق ابزار `nodes` اجرا می‌کند. اگر "Always Ask" را انتخاب کنید، تایید "Always Allow" در اعلان آن فرمان را به allowlist اضافه می‌کند.

    **گزینه C - باینری‌های macOS را از طریق SSH پروکسی کنید (پیشرفته).**
    Gateway را روی Linux نگه دارید، اما کاری کنید باینری‌های CLI لازم به wrapperهای SSH resolve شوند که روی Mac اجرا می‌شوند. سپس Skill را override کنید تا Linux را مجاز کند و واجد شرایط بماند.

    1. برای باینری یک wrapper SSH بسازید (مثال: `memo` برای Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. wrapper را روی `PATH` در میزبان Linux قرار دهید (مثلا `~/bin/memo`).
    3. فراداده Skill را (در فضای کاری یا `~/.openclaw/skills`) override کنید تا Linux را مجاز کند:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. یک نشست جدید شروع کنید تا snapshot مربوط به Skills تازه‌سازی شود.

  </Accordion>

  <Accordion title="آیا ادغام Notion یا HeyGen دارید؟">
    امروز به‌صورت داخلی وجود ندارد.

    گزینه‌ها:

    - **Skill / Plugin سفارشی:** بهترین گزینه برای دسترسی قابل اتکا به API (Notion/HeyGen هر دو API دارند).
    - **اتوماسیون مرورگر:** بدون کد کار می‌کند، اما کندتر و شکننده‌تر است.

    اگر می‌خواهید زمینه را برای هر مشتری نگه دارید (گردش‌کارهای آژانس)، یک الگوی ساده این است:

    - یک صفحه Notion برای هر مشتری (زمینه + ترجیحات + کار فعال).
    - از عامل بخواهید در آغاز نشست آن صفحه را دریافت کند.

    اگر ادغام بومی می‌خواهید، یک درخواست ویژگی باز کنید یا Skillای
    با هدف‌گیری آن APIها بسازید.

    نصب Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    نصب‌های بومی در دایرکتوری `skills/` فضای کاری فعال قرار می‌گیرند. برای Skills مشترک بین عامل‌ها، آن‌ها را در `~/.openclaw/skills/<name>/SKILL.md` قرار دهید. اگر فقط برخی عامل‌ها باید نصب مشترک را ببینند، `agents.defaults.skills` یا `agents.list[].skills` را پیکربندی کنید. برخی Skills انتظار دارند باینری‌ها از طریق Homebrew نصب شده باشند؛ روی Linux یعنی Linuxbrew (مدخل پرسش‌های متداول Homebrew Linux در بالا را ببینید). ببینید: [Skills](/fa/tools/skills)، [پیکربندی Skills](/fa/tools/skills-config)، و [ClawHub](/fa/tools/clawhub).

  </Accordion>

  <Accordion title="چگونه از Chrome موجودم که به آن وارد شده‌ام با OpenClaw استفاده کنم؟">
    از پروفایل مرورگر داخلی `user` استفاده کنید که از طریق Chrome DevTools MCP متصل می‌شود:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    اگر نام سفارشی می‌خواهید، یک پروفایل MCP صریح بسازید:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    این مسیر می‌تواند از مرورگر میزبان محلی یا یک نود مرورگر متصل استفاده کند. اگر Gateway جای دیگری اجرا می‌شود، یا یک میزبان نود را روی ماشین مرورگر اجرا کنید یا به‌جای آن از CDP دوردست استفاده کنید.

    محدودیت‌های فعلی `existing-session` / `user`:

    - کنش‌ها مبتنی بر ref هستند، نه مبتنی بر انتخابگر CSS
    - بارگذاری‌ها به `ref` / `inputRef` نیاز دارند و در حال حاضر هم‌زمان از یک فایل پشتیبانی می‌کنند
    - `responsebody`، خروجی PDF، رهگیری دانلود، و کنش‌های دسته‌ای همچنان به مرورگر مدیریت‌شده یا پروفایل CDP خام نیاز دارند

  </Accordion>
</AccordionGroup>

## Sandboxing و حافظه

<AccordionGroup>
  <Accordion title="آیا سند اختصاصی Sandboxing وجود دارد؟">
    بله. [Sandboxing](/fa/gateway/sandboxing) را ببینید. برای راه‌اندازی مخصوص Docker (Gateway کامل در Docker یا تصاویر sandbox)، [Docker](/fa/install/docker) را ببینید.
  </Accordion>

  <Accordion title="Docker محدود به نظر می‌رسد - چگونه قابلیت‌های کامل را فعال کنم؟">
    تصویر پیش‌فرض امنیت‌محور است و با کاربر `node` اجرا می‌شود، بنابراین
    شامل بسته‌های سیستم، Homebrew، یا مرورگرهای همراه نیست. برای راه‌اندازی کامل‌تر:

    - `/home/node` را با `OPENCLAW_HOME_VOLUME` پایدار کنید تا cacheها باقی بمانند.
    - وابستگی‌های سیستم را با `OPENCLAW_DOCKER_APT_PACKAGES` در تصویر bake کنید.
    - مرورگرهای Playwright را از طریق CLI همراه نصب کنید:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` را تنظیم کنید و مطمئن شوید مسیر پایدار است.

    مستندات: [Docker](/fa/install/docker)، [مرورگر](/fa/tools/browser).

  </Accordion>

  <Accordion title="آیا می‌توانم DMها را شخصی نگه دارم اما گروه‌ها را با یک عامل عمومی/sandbox‌شده کنم؟">
    بله - اگر ترافیک خصوصی شما **DMها** و ترافیک عمومی شما **گروه‌ها** باشد.

    از `agents.defaults.sandbox.mode: "non-main"` استفاده کنید تا نشست‌های گروه/کانال (کلیدهای غیر اصلی) در backend پیکربندی‌شده sandbox اجرا شوند، در حالی که نشست DM اصلی روی میزبان باقی می‌ماند. اگر backendای انتخاب نکنید، Docker پیش‌فرض است. سپس از طریق `tools.sandbox.tools` محدود کنید چه ابزارهایی در نشست‌های sandbox‌شده در دسترس باشند.

    راهنمای راه‌اندازی + پیکربندی نمونه: [گروه‌ها: DMهای شخصی + گروه‌های عمومی](/fa/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع پیکربندی کلیدی: [پیکربندی Gateway](/fa/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="چگونه یک پوشه میزبان را به sandbox bind کنم؟">
    `agents.defaults.sandbox.docker.binds` را به `["host:path:mode"]` تنظیم کنید (مثلا `"/home/user/src:/src:ro"`). bindهای سراسری و هر عامل با هم merge می‌شوند؛ وقتی `scope: "shared"` باشد، bindهای هر عامل نادیده گرفته می‌شوند. برای هر چیز حساس از `:ro` استفاده کنید و به یاد داشته باشید bindها دیوارهای فایل‌سیستم sandbox را دور می‌زنند.

    OpenClaw منابع bind را هم در برابر مسیر نرمال‌شده و هم مسیر canonical که از طریق عمیق‌ترین ancestor موجود resolve شده است، اعتبارسنجی می‌کند. یعنی گریزهای symlink-parent حتی وقتی آخرین بخش مسیر هنوز وجود ندارد، همچنان fail closed می‌شوند، و بررسی‌های ریشه مجاز پس از resolve شدن symlink همچنان اعمال می‌شوند.

    برای نمونه‌ها و نکات ایمنی، [Sandboxing](/fa/gateway/sandboxing#custom-bind-mounts) و [Sandbox در برابر سیاست ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) را ببینید.

  </Accordion>

  <Accordion title="حافظه چگونه کار می‌کند؟">
    حافظه OpenClaw فقط فایل‌های Markdown در فضای کاری عامل است:

    - یادداشت‌های روزانه در `memory/YYYY-MM-DD.md`
    - یادداشت‌های بلندمدت گزینش‌شده در `MEMORY.md` (فقط نشست‌های اصلی/خصوصی)

    OpenClaw همچنین یک **flush حافظه بی‌صدای پیش از Compaction** اجرا می‌کند تا به مدل
    یادآوری کند پیش از auto-compaction یادداشت‌های بادوام بنویسد. این فقط وقتی اجرا می‌شود که فضای کاری
    قابل نوشتن باشد (sandboxهای فقط‌خواندنی آن را نادیده می‌گیرند). [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>

  <Accordion title="حافظه مدام چیزها را فراموش می‌کند. چگونه کاری کنم ماندگار شود؟">
    از بات بخواهید **واقعیت را در حافظه بنویسد**. یادداشت‌های بلندمدت در `MEMORY.md`
    قرار می‌گیرند، زمینه کوتاه‌مدت در `memory/YYYY-MM-DD.md`.

    این همچنان حوزه‌ای است که در حال بهبود آن هستیم. یادآوری به مدل برای ذخیره حافظه‌ها کمک می‌کند؛
    خودش می‌داند چه کاری انجام دهد. اگر همچنان فراموش می‌کند، بررسی کنید Gateway در هر اجرا از همان
    فضای کاری استفاده می‌کند.

    مستندات: [حافظه](/fa/concepts/memory)، [فضای کاری عامل](/fa/concepts/agent-workspace).

  </Accordion>

  <Accordion title="آیا حافظه برای همیشه پایدار می‌ماند؟ محدودیت‌ها چیست؟">
    فایل‌های حافظه روی دیسک زندگی می‌کنند و تا زمانی که آن‌ها را حذف نکنید پایدار می‌مانند. محدودیت، فضای ذخیره‌سازی شماست،
    نه مدل. **زمینه نشست** همچنان به پنجره زمینه مدل محدود است،
    بنابراین گفتگوهای طولانی می‌توانند compact یا truncate شوند. به همین دلیل
    جستجوی حافظه وجود دارد - فقط بخش‌های مرتبط را دوباره به زمینه برمی‌گرداند.

    مستندات: [حافظه](/fa/concepts/memory)، [زمینه](/fa/concepts/context).

  </Accordion>

  <Accordion title="آیا جستجوی معنایی حافظه به کلید API OpenAI نیاز دارد؟">
    فقط اگر از **OpenAI embeddings** استفاده کنید. Codex OAuth چت/تکمیل‌ها را پوشش می‌دهد و
    دسترسی به embeddings را **اعطا نمی‌کند**، بنابراین **ورود با Codex (OAuth یا
    ورود Codex CLI)** برای جستجوی معنایی حافظه کمکی نمی‌کند. OpenAI embeddings
    همچنان به یک کلید API واقعی نیاز دارد (`OPENAI_API_KEY` یا `models.providers.openai.apiKey`).

    اگر provider را صراحتاً تنظیم نکنید، OpenClaw وقتی بتواند یک کلید API را حل کند
    provider را خودکار انتخاب می‌کند (auth profiles، `models.providers.*.apiKey`، یا env vars).
    اگر یک کلید OpenAI حل شود OpenAI را ترجیح می‌دهد، در غیر این صورت اگر کلید Gemini
    حل شود Gemini را، سپس Voyage، سپس Mistral. اگر هیچ کلید راه دوری در دسترس نباشد، جستجوی حافظه
    تا زمانی که آن را پیکربندی کنید غیرفعال می‌ماند. اگر یک مسیر مدل محلی
    پیکربندی‌شده و موجود داشته باشید، OpenClaw
    `local` را ترجیح می‌دهد. Ollama زمانی پشتیبانی می‌شود که صراحتاً
    `memorySearch.provider = "ollama"` را تنظیم کنید.

    اگر ترجیح می‌دهید محلی بمانید، `memorySearch.provider = "local"` را تنظیم کنید (و به‌صورت اختیاری
    `memorySearch.fallback = "none"`). اگر Gemini embeddings می‌خواهید،
    `memorySearch.provider = "gemini"` را تنظیم کنید و `GEMINI_API_KEY` (یا
    `memorySearch.remote.apiKey`) را ارائه دهید. ما از مدل‌های embedding **OpenAI، Gemini، Voyage، Mistral، Ollama، یا local**
    پشتیبانی می‌کنیم - برای جزئیات راه‌اندازی، [Memory](/fa/concepts/memory) را ببینید.

  </Accordion>
</AccordionGroup>

## چیزها کجا روی دیسک قرار دارند

<AccordionGroup>
  <Accordion title="آیا همه داده‌هایی که با OpenClaw استفاده می‌شوند به‌صورت محلی ذخیره می‌شوند؟">
    نه - **وضعیت OpenClaw محلی است**، اما **سرویس‌های خارجی همچنان چیزهایی را که برایشان می‌فرستید می‌بینند**.

    - **به‌صورت پیش‌فرض محلی:** نشست‌ها، فایل‌های حافظه، پیکربندی، و workspace روی میزبان Gateway قرار دارند
      (`~/.openclaw` + دایرکتوری workspace شما).
    - **از روی ضرورت راه دور:** پیام‌هایی که به providerهای مدل (Anthropic/OpenAI/غیره) می‌فرستید به
      APIهای آن‌ها می‌روند، و پلتفرم‌های چت (WhatsApp/Telegram/Slack/غیره) داده‌های پیام را روی
      سرورهای خود ذخیره می‌کنند.
    - **شما ردپا را کنترل می‌کنید:** استفاده از مدل‌های محلی promptها را روی ماشین شما نگه می‌دارد، اما ترافیک channel
      همچنان از سرورهای همان channel عبور می‌کند.

    مرتبط: [Agent workspace](/fa/concepts/agent-workspace)، [Memory](/fa/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw داده‌های خود را کجا ذخیره می‌کند؟">
    همه‌چیز زیر `$OPENCLAW_STATE_DIR` قرار دارد (پیش‌فرض: `~/.openclaw`):

    | مسیر                                                            | هدف                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | پیکربندی اصلی (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | واردکردن OAuth قدیمی (در نخستین استفاده در auth profiles کپی می‌شود)       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles (OAuth، کلیدهای API، و `keyRef`/`tokenRef` اختیاری)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | payload محرمانه اختیاری با پشتوانه فایل برای providerهای SecretRef از نوع `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | فایل سازگاری قدیمی (ورودی‌های ثابت `api_key` پاک‌سازی شده‌اند)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | وضعیت provider (مثلاً `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | وضعیت هر agent (agentDir + نشست‌ها)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | تاریخچه و وضعیت گفتگو (برای هر agent)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | فراداده نشست (برای هر agent)                                       |

    مسیر تک-agent قدیمی: `~/.openclaw/agent/*` (توسط `openclaw doctor` مهاجرت داده می‌شود).

    **workspace** شما (AGENTS.md، فایل‌های حافظه، skills، و غیره) جداست و از طریق `agents.defaults.workspace` پیکربندی می‌شود (پیش‌فرض: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md باید کجا قرار داشته باشند؟">
    این فایل‌ها در **agent workspace** قرار دارند، نه در `~/.openclaw`.

    - **Workspace (برای هر agent)**: `AGENTS.md`، `SOUL.md`، `IDENTITY.md`، `USER.md`،
      `MEMORY.md`، `memory/YYYY-MM-DD.md`، `HEARTBEAT.md` اختیاری.
      ریشه با حروف کوچک `memory.md` فقط ورودی تعمیر قدیمی است؛ وقتی هر دو فایل وجود داشته باشند، `openclaw doctor --fix`
      می‌تواند آن را در `MEMORY.md` ادغام کند.
    - **State dir (`~/.openclaw`)**: پیکربندی، وضعیت channel/provider، auth profiles، نشست‌ها، گزارش‌ها،
      و Skills مشترک (`~/.openclaw/skills`).

    workspace پیش‌فرض `~/.openclaw/workspace` است و از این طریق قابل پیکربندی است:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    اگر بات پس از راه‌اندازی مجدد «فراموش» می‌کند، تأیید کنید Gateway در هر اجرا از همان
    workspace استفاده می‌کند (و به یاد داشته باشید: حالت راه دور از workspace **میزبان Gateway**
    استفاده می‌کند، نه لپ‌تاپ محلی شما).

    نکته: اگر یک رفتار یا ترجیح پایدار می‌خواهید، از بات بخواهید آن را **در
    AGENTS.md یا MEMORY.md بنویسد** به‌جای اینکه به تاریخچه چت تکیه کنید.

    [Agent workspace](/fa/concepts/agent-workspace) و [Memory](/fa/concepts/memory) را ببینید.

  </Accordion>

  <Accordion title="استراتژی پیشنهادی پشتیبان‌گیری">
    **agent workspace** خود را در یک مخزن git **خصوصی** قرار دهید و آن را جایی
    خصوصی (برای مثال GitHub private) پشتیبان‌گیری کنید. این کار حافظه + فایل‌های AGENTS/SOUL/USER
    را ثبت می‌کند، و به شما اجازه می‌دهد بعداً «ذهن» دستیار را بازیابی کنید.

    هیچ چیزی را زیر `~/.openclaw` commit نکنید (credentials، نشست‌ها، tokenها، یا payloadهای secrets رمزگذاری‌شده).
    اگر به بازیابی کامل نیاز دارید، هم workspace و هم دایرکتوری state را
    جداگانه پشتیبان‌گیری کنید (پرسش مهاجرت بالا را ببینید).

    مستندات: [Agent workspace](/fa/concepts/agent-workspace).

  </Accordion>

  <Accordion title="چطور OpenClaw را کاملاً حذف نصب کنم؟">
    راهنمای اختصاصی را ببینید: [Uninstall](/fa/install/uninstall).
  </Accordion>

  <Accordion title="آیا agentها می‌توانند بیرون از workspace کار کنند؟">
    بله. workspace **cwd پیش‌فرض** و لنگر حافظه است، نه یک sandbox سخت‌گیرانه.
    مسیرهای نسبی داخل workspace حل می‌شوند، اما مسیرهای مطلق می‌توانند به مکان‌های دیگر
    میزبان دسترسی داشته باشند مگر اینکه sandboxing فعال باشد. اگر به جداسازی نیاز دارید، از
    [`agents.defaults.sandbox`](/fa/gateway/sandboxing) یا تنظیمات sandbox برای هر agent استفاده کنید. اگر
    می‌خواهید یک مخزن دایرکتوری کاری پیش‌فرض باشد، `workspace` آن agent را
    به ریشه مخزن اشاره دهید. مخزن OpenClaw فقط کد منبع است؛
    workspace را جدا نگه دارید مگر اینکه عمداً بخواهید agent داخل آن کار کند.

    مثال (مخزن به‌عنوان cwd پیش‌فرض):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="حالت راه دور: محل ذخیره نشست کجاست؟">
    وضعیت نشست متعلق به **میزبان Gateway** است. اگر در حالت راه دور هستید، محل ذخیره نشستی که برایتان مهم است روی ماشین راه دور است، نه لپ‌تاپ محلی شما. [Session management](/fa/concepts/session) را ببینید.
  </Accordion>
</AccordionGroup>

## مبانی پیکربندی

<AccordionGroup>
  <Accordion title="فرمت پیکربندی چیست؟ کجاست؟">
    OpenClaw یک پیکربندی **JSON5** اختیاری را از `$OPENCLAW_CONFIG_PATH` می‌خواند (پیش‌فرض: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    اگر فایل موجود نباشد، از پیش‌فرض‌های نسبتاً امن استفاده می‌کند (از جمله workspace پیش‌فرض `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='من gateway.bind: "lan" (یا "tailnet") را تنظیم کردم و حالا چیزی listen نمی‌کند / UI می‌گوید unauthorized'>
    bindهای غیر-loopback **به یک مسیر معتبر احراز هویت Gateway نیاز دارند**. در عمل یعنی:

    - احراز هویت shared-secret: token یا password
    - `gateway.auth.mode: "trusted-proxy"` پشت یک reverse proxy آگاه از هویت که درست پیکربندی شده باشد

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    نکته‌ها:

    - `gateway.remote.token` / `.password` به‌تنهایی احراز هویت Gateway محلی را فعال نمی‌کنند.
    - مسیرهای فراخوانی محلی فقط وقتی `gateway.auth.*` تنظیم نشده باشد می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند.
    - برای احراز هویت با password، به‌جای آن `gateway.auth.mode: "password"` را همراه با `gateway.auth.password` (یا `OPENCLAW_GATEWAY_PASSWORD`) تنظیم کنید.
    - اگر `gateway.auth.token` / `gateway.auth.password` صراحتاً از طریق SecretRef پیکربندی شده باشد و حل نشود، حل‌کردن به‌صورت fail closed انجام می‌شود (بدون masking با fallback راه دور).
    - راه‌اندازی‌های Control UI با shared-secret از طریق `connect.params.auth.token` یا `connect.params.auth.password` (ذخیره‌شده در تنظیمات app/UI) احراز هویت می‌کنند. حالت‌های دارای هویت مانند Tailscale Serve یا `trusted-proxy` به‌جای آن از headerهای درخواست استفاده می‌کنند. از قرار دادن shared secretها در URLها خودداری کنید.
    - با `gateway.auth.mode: "trusted-proxy"`، reverse proxyهای local loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح و یک ورودی loopback در `gateway.trustedProxies` نیاز دارند.

  </Accordion>

  <Accordion title="چرا حالا روی localhost به token نیاز دارم؟">
    OpenClaw به‌صورت پیش‌فرض احراز هویت Gateway را اجباری می‌کند، از جمله loopback. در مسیر پیش‌فرض عادی این یعنی احراز هویت token: اگر هیچ مسیر احراز هویت صریحی پیکربندی نشده باشد، راه‌اندازی Gateway به حالت token حل می‌شود و یکی را خودکار تولید می‌کند و آن را در `gateway.auth.token` ذخیره می‌کند، بنابراین **کلاینت‌های WS محلی باید احراز هویت کنند**. این کار مانع می‌شود فرایندهای محلی دیگر Gateway را فراخوانی کنند.

    اگر مسیر احراز هویت دیگری را ترجیح می‌دهید، می‌توانید صراحتاً حالت password را انتخاب کنید (یا برای reverse proxyهای آگاه از هویت، `trusted-proxy`). اگر **واقعاً** loopback باز می‌خواهید، `gateway.auth.mode: "none"` را صراحتاً در پیکربندی خود تنظیم کنید. Doctor هر زمان می‌تواند برای شما token بسازد: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="آیا بعد از تغییر پیکربندی باید restart کنم؟">
    Gateway پیکربندی را پایش می‌کند و از hot-reload پشتیبانی می‌کند:

    - `gateway.reload.mode: "hybrid"` (پیش‌فرض): تغییرات امن را به‌صورت hot اعمال می‌کند، برای موارد بحرانی restart می‌کند
    - `hot`، `restart`، `off` نیز پشتیبانی می‌شوند

  </Accordion>

  <Accordion title="چطور taglineهای بامزه CLI را غیرفعال کنم؟">
    `cli.banner.taglineMode` را در پیکربندی تنظیم کنید:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: متن tagline را پنهان می‌کند اما خط title/version بنر را نگه می‌دارد.
    - `default`: هر بار از `All your chats, one OpenClaw.` استفاده می‌کند.
    - `random`: taglineهای بامزه/فصلی چرخشی (رفتار پیش‌فرض).
    - اگر اصلاً بنر نمی‌خواهید، env `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

  </Accordion>

  <Accordion title="چطور web search (و web fetch) را فعال کنم؟">
    `web_fetch` بدون کلید API کار می‌کند. `web_search` به provider انتخاب‌شده شما
    بستگی دارد:

    - providerهای متکی به API مانند Brave، Exa، Firecrawl، Gemini، Grok، Kimi، MiniMax Search، Perplexity، و Tavily به راه‌اندازی عادی کلید API خود نیاز دارند.
    - Ollama Web Search بدون کلید است، اما از میزبان Ollama پیکربندی‌شده شما استفاده می‌کند و به `ollama signin` نیاز دارد.
    - DuckDuckGo بدون کلید است، اما یک یکپارچه‌سازی غیررسمی مبتنی بر HTML است.
    - SearXNG بدون کلید/خودمیزبان است؛ `SEARXNG_BASE_URL` یا `plugins.entries.searxng.config.webSearch.baseUrl` را پیکربندی کنید.

    **پیشنهاد می‌شود:** `openclaw configure --section web` را اجرا کنید و یک provider انتخاب کنید.
    جایگزین‌های محیطی:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` یا `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`، `MINIMAX_CODING_API_KEY`، یا `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` یا `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    پیکربندی جست‌وجوی وبِ ویژه هر ارائه‌دهنده اکنون زیر `plugins.entries.<plugin>.config.webSearch.*` قرار دارد.
    مسیرهای قدیمی ارائه‌دهنده در `tools.web.search.*` هنوز موقتاً برای سازگاری بارگذاری می‌شوند، اما نباید برای پیکربندی‌های جدید استفاده شوند.
    پیکربندی جایگزین واکشی وب Firecrawl زیر `plugins.entries.firecrawl.config.webFetch.*` قرار دارد.

    نکته‌ها:

    - اگر از فهرست‌های مجاز استفاده می‌کنید، `web_search`/`web_fetch`/`x_search` یا `group:web` را اضافه کنید.
    - `web_fetch` به‌طور پیش‌فرض فعال است (مگر اینکه صریحاً غیرفعال شده باشد).
    - اگر `tools.web.fetch.provider` حذف شود، OpenClaw نخستین ارائه‌دهنده جایگزینِ آماده برای واکشی را از اعتبارنامه‌های موجود به‌صورت خودکار تشخیص می‌دهد. در حال حاضر ارائه‌دهنده همراه، Firecrawl است.
    - دیمن‌ها متغیرهای محیطی را از `~/.openclaw/.env` (یا محیط سرویس) می‌خوانند.

    مستندات: [ابزارهای وب](/fa/tools/web).

  </Accordion>

  <Accordion title="config.apply پیکربندی من را پاک کرد. چطور آن را بازیابی کنم و از تکرارش جلوگیری کنم؟">
    `config.apply` **کل پیکربندی** را جایگزین می‌کند. اگر یک شیء جزئی بفرستید، همه چیز
    دیگر حذف می‌شود.

    نسخه فعلی OpenClaw از بسیاری از بازنویسی‌های تصادفی محافظت می‌کند:

    - نوشتن‌های پیکربندیِ متعلق به OpenClaw، کل پیکربندی پس از تغییر را پیش از نوشتن اعتبارسنجی می‌کنند.
    - نوشتن‌های نامعتبر یا مخربِ متعلق به OpenClaw رد می‌شوند و با نام `openclaw.json.rejected.*` ذخیره می‌شوند.
    - اگر یک ویرایش مستقیم راه‌اندازی یا بارگذاری مجدد داغ را خراب کند، Gateway آخرین پیکربندی سالمِ شناخته‌شده را بازیابی می‌کند و فایل ردشده را با نام `openclaw.json.clobbered.*` ذخیره می‌کند.
    - عامل اصلی پس از بازیابی یک هشدار راه‌اندازی دریافت می‌کند تا دوباره کورکورانه همان پیکربندی بد را ننویسد.

    بازیابی:

    - در `openclaw logs --follow` به‌دنبال `Config auto-restored from last-known-good`، `Config write rejected:` یا `config reload restored last-known-good config` بگردید.
    - جدیدترین `openclaw.json.clobbered.*` یا `openclaw.json.rejected.*` را کنار پیکربندی فعال بررسی کنید.
    - اگر پیکربندی فعالِ بازیابی‌شده کار می‌کند، آن را نگه دارید؛ سپس فقط کلیدهای موردنظر را با `openclaw config set` یا `config.patch` برگردانید.
    - `openclaw config validate` و `openclaw doctor` را اجرا کنید.
    - اگر آخرین نسخه سالمِ شناخته‌شده یا payload ردشده ندارید، از پشتیبان بازیابی کنید، یا دوباره `openclaw doctor` را اجرا کنید و کانال‌ها/مدل‌ها را دوباره پیکربندی کنید.
    - اگر این اتفاق غیرمنتظره بود، یک باگ ثبت کنید و آخرین پیکربندی شناخته‌شده یا هر نسخه پشتیبان خود را پیوست کنید.
    - یک عامل کدنویسی محلی اغلب می‌تواند از روی لاگ‌ها یا تاریخچه یک پیکربندی کارا بازسازی کند.

    پیشگیری:

    - برای تغییرات کوچک از `openclaw config set` استفاده کنید.
    - برای ویرایش‌های تعاملی از `openclaw configure` استفاده کنید.
    - وقتی از مسیر دقیق یا شکل فیلد مطمئن نیستید، ابتدا از `config.schema.lookup` استفاده کنید؛ این دستور یک گره سطحی از schema به‌همراه خلاصه‌های فرزند بلافاصله برای بررسی مرحله‌ای برمی‌گرداند.
    - برای ویرایش‌های جزئی RPC از `config.patch` استفاده کنید؛ `config.apply` را فقط برای جایگزینی کامل پیکربندی نگه دارید.
    - اگر از ابزار مالک‌محور `gateway` در اجرای یک عامل استفاده می‌کنید، همچنان نوشتن روی `tools.exec.ask` / `tools.exec.security` (از جمله نام‌های مستعار قدیمی `tools.bash.*` که به همان مسیرهای exec محافظت‌شده نرمال‌سازی می‌شوند) را رد می‌کند.

    مستندات: [پیکربندی](/fa/cli/config)، [پیکربندی تعاملی](/fa/cli/configure)، [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-restored-last-known-good-config)، [Doctor](/fa/gateway/doctor).

  </Accordion>

  <Accordion title="چطور یک Gateway مرکزی با workerهای تخصصی در چند دستگاه اجرا کنم؟">
    الگوی رایج **یک Gateway** (مثلاً Raspberry Pi) به‌همراه **nodeها** و **agentها** است:

    - **Gateway (مرکزی):** مالک کانال‌ها (Signal/WhatsApp)، مسیریابی و نشست‌ها است.
    - **Nodeها (دستگاه‌ها):** Macها/iOS/Android به‌عنوان جانبی وصل می‌شوند و ابزارهای محلی (`system.run`، `canvas`، `camera`) را ارائه می‌کنند.
    - **Agentها (workerها):** مغزها/فضاهای کاری جدا برای نقش‌های خاص (مثلاً «عملیات Hetzner»، «داده‌های شخصی»).
    - **Sub-agentها:** وقتی موازی‌سازی می‌خواهید، کار پس‌زمینه را از یک agent اصلی ایجاد می‌کنند.
    - **TUI:** به Gateway وصل شوید و بین agentها/نشست‌ها جابه‌جا شوید.

    مستندات: [Nodeها](/fa/nodes)، [دسترسی راه دور](/fa/gateway/remote)، [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [Sub-agentها](/fa/tools/subagents)، [TUI](/fa/web/tui).

  </Accordion>

  <Accordion title="آیا مرورگر OpenClaw می‌تواند بدون رابط گرافیکی اجرا شود؟">
    بله. این یک گزینه پیکربندی است:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    مقدار پیش‌فرض `false` است (با رابط گرافیکی). حالت headless در برخی سایت‌ها احتمالاً بیشتر باعث فعال شدن بررسی‌های ضدربات می‌شود. [مرورگر](/fa/tools/browser) را ببینید.

    حالت headless از **همان موتور Chromium** استفاده می‌کند و برای بیشتر خودکارسازی‌ها (فرم‌ها، کلیک‌ها، scraping، ورودها) کار می‌کند. تفاوت‌های اصلی:

    - پنجره مرورگر قابل مشاهده نیست (اگر به تصویر نیاز دارید از screenshot استفاده کنید).
    - برخی سایت‌ها نسبت به خودکارسازی در حالت headless سخت‌گیرتر هستند (CAPTCHAها، ضدربات).
      برای مثال، X/Twitter اغلب نشست‌های headless را مسدود می‌کند.

  </Accordion>

  <Accordion title="چطور از Brave برای کنترل مرورگر استفاده کنم؟">
    `browser.executablePath` را روی باینری Brave خود (یا هر مرورگر مبتنی بر Chromium) تنظیم کنید و Gateway را دوباره راه‌اندازی کنید.
    نمونه‌های کامل پیکربندی را در [مرورگر](/fa/tools/browser#use-brave-or-another-chromium-based-browser) ببینید.
  </Accordion>
</AccordionGroup>

## Gatewayها و nodeهای راه دور

<AccordionGroup>
  <Accordion title="فرمان‌ها چطور بین Telegram، gateway و nodeها منتشر می‌شوند؟">
    پیام‌های Telegram توسط **gateway** مدیریت می‌شوند. gateway عامل را اجرا می‌کند و
    فقط وقتی به ابزار node نیاز باشد، سپس از طریق **Gateway WebSocket** با nodeها تماس می‌گیرد:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodeها ترافیک ورودی ارائه‌دهنده را نمی‌بینند؛ فقط فراخوانی‌های RPC مربوط به node را دریافت می‌کنند.

  </Accordion>

  <Accordion title="اگر Gateway از راه دور میزبانی شود، عامل من چطور می‌تواند به رایانه من دسترسی داشته باشد؟">
    پاسخ کوتاه: **رایانه خود را به‌عنوان node جفت کنید**. Gateway جای دیگری اجرا می‌شود، اما می‌تواند
    ابزارهای `node.*` (صفحه، دوربین، سیستم) را روی ماشین محلی شما از طریق Gateway WebSocket فراخوانی کند.

    راه‌اندازی معمول:

    1. Gateway را روی میزبان همیشه‌روشن (VPS/سرور خانگی) اجرا کنید.
    2. میزبان Gateway و رایانه خود را در یک tailnet قرار دهید.
    3. مطمئن شوید Gateway WS در دسترس است (bind روی tailnet یا تونل SSH).
    4. برنامه macOS را به‌صورت محلی باز کنید و در حالت **Remote over SSH** (یا tailnet مستقیم) وصل شوید
       تا بتواند به‌عنوان node ثبت شود.
    5. node را روی Gateway تأیید کنید:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    پل TCP جداگانه لازم نیست؛ nodeها از طریق Gateway WebSocket وصل می‌شوند.

    یادآوری امنیتی: جفت کردن یک node در macOS امکان اجرای `system.run` روی آن ماشین را فراهم می‌کند. فقط
    دستگاه‌هایی را جفت کنید که به آن‌ها اعتماد دارید، و [امنیت](/fa/gateway/security) را مرور کنید.

    مستندات: [Nodeها](/fa/nodes)، [پروتکل Gateway](/fa/gateway/protocol)، [حالت راه دور macOS](/fa/platforms/mac/remote)، [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="Tailscale وصل است اما پاسخی دریافت نمی‌کنم. حالا چه کنم؟">
    موارد پایه را بررسی کنید:

    - Gateway در حال اجراست: `openclaw gateway status`
    - سلامت Gateway: `openclaw status`
    - سلامت کانال: `openclaw channels status`

    سپس احراز هویت و مسیریابی را بررسی کنید:

    - اگر از Tailscale Serve استفاده می‌کنید، مطمئن شوید `gateway.auth.allowTailscale` درست تنظیم شده است.
    - اگر از طریق تونل SSH وصل می‌شوید، تأیید کنید تونل محلی بالا است و به پورت درست اشاره می‌کند.
    - تأیید کنید فهرست‌های مجاز شما (DM یا گروه) شامل حساب شما هستند.

    مستندات: [Tailscale](/fa/gateway/tailscale)، [دسترسی راه دور](/fa/gateway/remote)، [کانال‌ها](/fa/channels).

  </Accordion>

  <Accordion title="آیا دو نمونه OpenClaw می‌توانند با هم صحبت کنند (محلی + VPS)؟">
    بله. پل داخلی «bot-to-bot» وجود ندارد، اما می‌توانید آن را به چند روش
    قابل اعتماد وصل کنید:

    **ساده‌ترین:** از یک کانال گفت‌وگوی معمولی استفاده کنید که هر دو bot به آن دسترسی دارند (Telegram/Slack/WhatsApp).
    اجازه دهید Bot A پیامی به Bot B بفرستد، سپس Bot B طبق معمول پاسخ دهد.

    **پل CLI (عمومی):** اسکریپتی اجرا کنید که Gateway دیگر را با
    `openclaw agent --message ... --deliver` فراخوانی کند و یک گفت‌وگو را هدف بگیرد که bot دیگر
    در آن گوش می‌دهد. اگر یکی از botها روی VPS راه دور است، CLI خود را از طریق SSH/Tailscale
    به آن Gateway راه دور اشاره دهید ([دسترسی راه دور](/fa/gateway/remote) را ببینید).

    الگوی نمونه (از ماشینی اجرا کنید که می‌تواند به Gateway مقصد برسد):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نکته: یک محافظ اضافه کنید تا دو bot بی‌پایان در حلقه نیفتند (فقط با mention، فهرست‌های مجاز
    کانال، یا قاعده «به پیام‌های bot پاسخ نده»).

    مستندات: [دسترسی راه دور](/fa/gateway/remote)، [CLI عامل](/fa/cli/agent)، [ارسال عامل](/fa/tools/agent-send).

  </Accordion>

  <Accordion title="آیا برای چند agent به VPSهای جداگانه نیاز دارم؟">
    خیر. یک Gateway می‌تواند چند agent را میزبانی کند، هرکدام با فضای کاری، پیش‌فرض‌های مدل
    و مسیریابی خودش. این راه‌اندازی عادی است و بسیار ارزان‌تر و ساده‌تر از اجرای
    یک VPS برای هر agent است.

    فقط وقتی به جداسازی سخت (مرزهای امنیتی) یا پیکربندی‌های بسیار متفاوتی نیاز دارید که نمی‌خواهید به اشتراک بگذارید، از VPSهای جداگانه استفاده کنید. در غیر این صورت، یک Gateway نگه دارید و
    از چند agent یا sub-agent استفاده کنید.

  </Accordion>

  <Accordion title="آیا استفاده از node روی لپ‌تاپ شخصی‌ام به‌جای SSH از یک VPS مزیتی دارد؟">
    بله - nodeها روش درجه‌یک برای دسترسی به لپ‌تاپ شما از یک Gateway راه دور هستند، و
    بیش از دسترسی shell را فراهم می‌کنند. Gateway روی macOS/Linux (Windows از طریق WSL2) اجرا می‌شود و
    سبک است (یک VPS کوچک یا دستگاهی در کلاس Raspberry Pi کافی است؛ 4 GB RAM کاملاً کافی است)، بنابراین یک
    راه‌اندازی رایج، یک میزبان همیشه‌روشن به‌همراه لپ‌تاپ شما به‌عنوان node است.

    - **نیازی به SSH ورودی نیست.** Nodeها به Gateway WebSocket وصل می‌شوند و از جفت‌سازی دستگاه استفاده می‌کنند.
    - **کنترل‌های اجرای امن‌تر.** `system.run` با فهرست‌های مجاز/تأییدهای node روی همان لپ‌تاپ کنترل می‌شود.
    - **ابزارهای دستگاه بیشتر.** Nodeها علاوه بر `system.run`، `canvas`، `camera` و `screen` را ارائه می‌کنند.
    - **خودکارسازی مرورگر محلی.** Gateway را روی VPS نگه دارید، اما Chrome را از طریق میزبان node روی لپ‌تاپ به‌صورت محلی اجرا کنید، یا از طریق Chrome MCP به Chrome محلی روی میزبان وصل شوید.

    SSH برای دسترسی shell موردی مناسب است، اما nodeها برای جریان‌های کاری مداوم عامل و
    خودکارسازی دستگاه ساده‌تر هستند.

    مستندات: [Nodeها](/fa/nodes)، [CLI نودها](/fa/cli/nodes)، [مرورگر](/fa/tools/browser).

  </Accordion>

  <Accordion title="آیا nodeها سرویس gateway اجرا می‌کنند؟">
    خیر. مگر اینکه عمداً پروفایل‌های جداگانه اجرا کنید، فقط **یک gateway** باید روی هر میزبان اجرا شود ([چند gateway](/fa/gateway/multiple-gateways) را ببینید). Nodeها دستگاه‌های جانبی هستند که به gateway وصل می‌شوند
    (nodeهای iOS/Android، یا «حالت node» در برنامه نوار منوی macOS). برای میزبان‌های node بدون رابط گرافیکی
    و کنترل CLI، [CLI میزبان Node](/fa/cli/node) را ببینید.

    برای تغییرات `gateway`، `discovery` و `canvasHost` راه‌اندازی مجدد کامل لازم است.

  </Accordion>

  <Accordion title="آیا راه API / RPC برای اعمال پیکربندی وجود دارد؟">
    بله.

    - `config.schema.lookup`: یک زیردرخت پیکربندی را با گره سطحی schema، راهنمای UI منطبق، و خلاصه‌های فرزند بلافاصله پیش از نوشتن بررسی کنید
    - `config.get`: snapshot فعلی + hash را دریافت کنید
    - `config.patch`: به‌روزرسانی جزئی امن (برای بیشتر ویرایش‌های RPC ترجیح داده می‌شود)؛ وقتی ممکن باشد hot-reload می‌کند و وقتی لازم باشد restart می‌کند
    - `config.apply`: اعتبارسنجی + جایگزینی کل پیکربندی؛ وقتی ممکن باشد hot-reload می‌کند و وقتی لازم باشد restart می‌کند
    - ابزار runtime مالک‌محور `gateway` همچنان از بازنویسی `tools.exec.ask` / `tools.exec.security` خودداری می‌کند؛ نام‌های مستعار قدیمی `tools.bash.*` به همان مسیرهای exec محافظت‌شده نرمال‌سازی می‌شوند

  </Accordion>

  <Accordion title="حداقل پیکربندی معقول برای نصب اول">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    این کار فضای کاری شما را تنظیم می‌کند و محدود می‌کند چه کسانی بتوانند bot را فعال کنند.

  </Accordion>

  <Accordion title="چگونه Tailscale را روی یک VPS راه‌اندازی کنم و از Mac خودم وصل شوم؟">
    مراحل حداقلی:

    1. **نصب + ورود روی VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **نصب + ورود روی Mac خودتان**
       - از برنامه Tailscale استفاده کنید و به همان tailnet وارد شوید.
    3. **فعال‌سازی MagicDNS (توصیه‌شده)**
       - در کنسول مدیر Tailscale، MagicDNS را فعال کنید تا VPS یک نام پایدار داشته باشد.
    4. **استفاده از نام میزبان tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    اگر Control UI را بدون SSH می‌خواهید، از Tailscale Serve روی VPS استفاده کنید:

    ```bash
    openclaw gateway --tailscale serve
    ```

    این کار Gateway را به loopback محدود نگه می‌دارد و HTTPS را از طریق Tailscale در دسترس قرار می‌دهد. [Tailscale](/fa/gateway/tailscale) را ببینید.

  </Accordion>

  <Accordion title="چگونه یک گره Mac را به یک Gateway راه‌دور وصل کنم (Tailscale Serve)؟">
    Serve، **Gateway Control UI + WS** را در دسترس قرار می‌دهد. گره‌ها از طریق همان نقطه پایانی Gateway WS وصل می‌شوند.

    راه‌اندازی پیشنهادی:

    1. **مطمئن شوید VPS + Mac در یک tailnet هستند**.
    2. **از برنامه macOS در حالت راه‌دور استفاده کنید** (هدف SSH می‌تواند نام میزبان tailnet باشد).
       برنامه پورت Gateway را تونل می‌کند و به‌عنوان یک گره وصل می‌شود.
    3. **گره را تأیید کنید** روی gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    مستندات: [پروتکل Gateway](/fa/gateway/protocol)، [کشف](/fa/gateway/discovery)، [حالت راه‌دور macOS](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="آیا باید روی لپ‌تاپ دوم نصب کنم یا فقط یک گره اضافه کنم؟">
    اگر فقط به **ابزارهای محلی** (صفحه‌نمایش/دوربین/اجرا) روی لپ‌تاپ دوم نیاز دارید، آن را به‌عنوان
    **گره** اضافه کنید. این کار یک Gateway واحد را حفظ می‌کند و از پیکربندی تکراری جلوگیری می‌کند. ابزارهای گره محلی
    در حال حاضر فقط برای macOS هستند، اما قصد داریم آن‌ها را به سیستم‌عامل‌های دیگر هم گسترش دهیم.

    فقط وقتی Gateway دوم نصب کنید که به **جداسازی سخت‌گیرانه** یا دو bot کاملاً جدا نیاز دارید.

    مستندات: [گره‌ها](/fa/nodes)، [CLI گره‌ها](/fa/cli/nodes)، [چند Gateway](/fa/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغیرهای محیطی و بارگذاری .env

<AccordionGroup>
  <Accordion title="OpenClaw چگونه متغیرهای محیطی را بارگذاری می‌کند؟">
    OpenClaw متغیرهای محیطی را از فرایند والد (shell، launchd/systemd، CI و غیره) می‌خواند و افزون بر آن این‌ها را بارگذاری می‌کند:

    - `.env` از دایرکتوری کاری فعلی
    - یک `.env` سراسری جایگزین از `~/.openclaw/.env` (یا همان `$OPENCLAW_STATE_DIR/.env`)

    هیچ‌کدام از فایل‌های `.env` متغیرهای محیطی موجود را بازنویسی نمی‌کنند.

    همچنین می‌توانید متغیرهای محیطی درون‌خطی را در پیکربندی تعریف کنید (فقط اگر در محیط فرایند وجود نداشته باشند اعمال می‌شوند):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    برای تقدم کامل و منابع، [/environment](/fa/help/environment) را ببینید.

  </Accordion>

  <Accordion title="Gateway را از طریق سرویس شروع کردم و متغیرهای محیطی من ناپدید شدند. حالا چه کنم؟">
    دو راه‌حل رایج:

    1. کلیدهای گم‌شده را در `~/.openclaw/.env` بگذارید تا حتی وقتی سرویس محیط shell شما را به ارث نمی‌برد، برداشته شوند.
    2. واردکردن shell را فعال کنید (قابلیت راحتی اختیاری):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    این کار shell ورود شما را اجرا می‌کند و فقط کلیدهای موردانتظار گم‌شده را وارد می‌کند (هرگز بازنویسی نمی‌کند). معادل‌های متغیر محیطی:
    `OPENCLAW_LOAD_SHELL_ENV=1`، `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN را تنظیم کردم، اما وضعیت مدل‌ها "Shell env: off." نشان می‌دهد. چرا؟'>
    `openclaw models status` گزارش می‌دهد که آیا **واردکردن محیط shell** فعال است یا نه. "Shell env: off"
    به این معنا **نیست** که متغیرهای محیطی شما گم شده‌اند - فقط یعنی OpenClaw
    shell ورود شما را به‌صورت خودکار بارگذاری نمی‌کند.

    اگر Gateway به‌عنوان سرویس اجرا شود (launchd/systemd)، محیط shell شما را
    به ارث نمی‌برد. با یکی از این روش‌ها اصلاح کنید:

    1. توکن را در `~/.openclaw/.env` بگذارید:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. یا واردکردن shell را فعال کنید (`env.shellEnv.enabled: true`).
    3. یا آن را به بلوک `env` در پیکربندی خود اضافه کنید (فقط اگر گم‌شده باشد اعمال می‌شود).

    سپس gateway را راه‌اندازی مجدد کنید و دوباره بررسی کنید:

    ```bash
    openclaw models status
    ```

    توکن‌های Copilot از `COPILOT_GITHUB_TOKEN` خوانده می‌شوند (همچنین `GH_TOKEN` / `GITHUB_TOKEN`).
    [/concepts/model-providers](/fa/concepts/model-providers) و [/environment](/fa/help/environment) را ببینید.

  </Accordion>
</AccordionGroup>

## نشست‌ها و چند گفت‌وگو

<AccordionGroup>
  <Accordion title="چگونه یک گفت‌وگوی تازه شروع کنم؟">
    `/new` یا `/reset` را به‌عنوان یک پیام مستقل بفرستید. [مدیریت نشست](/fa/concepts/session) را ببینید.
  </Accordion>

  <Accordion title="اگر هرگز /new نفرستم، نشست‌ها خودکار بازنشانی می‌شوند؟">
    نشست‌ها می‌توانند پس از `session.idleMinutes` منقضی شوند، اما این به‌صورت **پیش‌فرض غیرفعال** است (پیش‌فرض **0**).
    برای فعال‌کردن انقضای بیکاری، آن را روی یک مقدار مثبت تنظیم کنید. وقتی فعال باشد، **پیام بعدی**
    پس از دوره بیکاری، یک شناسه نشست تازه برای آن کلید گفت‌وگو شروع می‌کند.
    این کار رونوشت‌ها را حذف نمی‌کند - فقط یک نشست جدید شروع می‌کند.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="آیا راهی هست که یک تیم از نمونه‌های OpenClaw بسازم (یک CEO و چندین agent)؟">
    بله، از طریق **مسیریابی چند-agent** و **sub-agent**ها. می‌توانید یک agent هماهنگ‌کننده
    و چندین agent کارگر با فضاهای کاری و مدل‌های جداگانه خودشان بسازید.

    با این حال، بهتر است این را یک **آزمایش سرگرم‌کننده** ببینید. مصرف token بالایی دارد و اغلب
    از استفاده از یک bot با نشست‌های جداگانه کم‌بازده‌تر است. مدل معمولی که
    در نظر داریم، یک bot است که با آن صحبت می‌کنید، همراه با نشست‌های مختلف برای کار موازی. آن
    bot همچنین می‌تواند در صورت نیاز sub-agentها را ایجاد کند.

    مستندات: [مسیریابی چند-agent](/fa/concepts/multi-agent)، [Sub-agentها](/fa/tools/subagents)، [CLI agentها](/fa/cli/agents).

  </Accordion>

  <Accordion title="چرا زمینه در میانه کار کوتاه شد؟ چگونه از آن جلوگیری کنم؟">
    زمینه نشست با پنجره مدل محدود می‌شود. گفت‌وگوهای طولانی، خروجی‌های بزرگ ابزار، یا تعداد زیادی
    فایل می‌توانند Compaction یا کوتاه‌سازی را فعال کنند.

    چیزهایی که کمک می‌کند:

    - از bot بخواهید وضعیت فعلی را خلاصه کند و آن را در یک فایل بنویسد.
    - پیش از کارهای طولانی از `/compact` استفاده کنید، و هنگام تغییر موضوع از `/new`.
    - زمینه مهم را در فضای کاری نگه دارید و از bot بخواهید آن را دوباره بخواند.
    - برای کار طولانی یا موازی از sub-agentها استفاده کنید تا گفت‌وگوی اصلی کوچک‌تر بماند.
    - اگر این اتفاق زیاد می‌افتد، مدلی با پنجره زمینه بزرگ‌تر انتخاب کنید.

  </Accordion>

  <Accordion title="چگونه OpenClaw را کاملاً بازنشانی کنم اما نصب‌شده نگه دارم؟">
    از دستور reset استفاده کنید:

    ```bash
    openclaw reset
    ```

    بازنشانی کامل غیرتعاملی:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    سپس راه‌اندازی را دوباره اجرا کنید:

    ```bash
    openclaw onboard --install-daemon
    ```

    نکته‌ها:

    - Onboarding اگر پیکربندی موجودی ببیند، گزینه **بازنشانی** را هم پیشنهاد می‌دهد. [Onboarding (CLI)](/fa/start/wizard) را ببینید.
    - اگر از پروفایل‌ها استفاده کرده‌اید (`--profile` / `OPENCLAW_PROFILE`)، هر دایرکتوری وضعیت را بازنشانی کنید (پیش‌فرض‌ها `~/.openclaw-<profile>` هستند).
    - بازنشانی توسعه: `openclaw gateway --dev --reset` (فقط توسعه؛ پیکربندی توسعه + اعتبارنامه‌ها + نشست‌ها + فضای کاری را پاک می‌کند).

  </Accordion>

  <Accordion title='خطاهای "context too large" می‌گیرم - چگونه بازنشانی یا فشرده کنم؟'>
    از یکی از این‌ها استفاده کنید:

    - **فشرده‌سازی** (گفت‌وگو را نگه می‌دارد اما نوبت‌های قدیمی‌تر را خلاصه می‌کند):

      ```
      /compact
      ```

      یا `/compact <instructions>` برای هدایت خلاصه.

    - **بازنشانی** (شناسه نشست تازه برای همان کلید گفت‌وگو):

      ```
      /new
      /reset
      ```

    اگر همچنان رخ می‌دهد:

    - **هرس نشست** (`agents.defaults.contextPruning`) را فعال یا تنظیم کنید تا خروجی ابزارهای قدیمی کوتاه شود.
    - از مدلی با پنجره زمینه بزرگ‌تر استفاده کنید.

    مستندات: [Compaction](/fa/concepts/compaction)، [هرس نشست](/fa/concepts/session-pruning)، [مدیریت نشست](/fa/concepts/session).

  </Accordion>

  <Accordion title='چرا "LLM request rejected: messages.content.tool_use.input field required" را می‌بینم؟'>
    این یک خطای اعتبارسنجی provider است: مدل یک بلوک `tool_use` بدون `input` لازم تولید کرده است.
    معمولاً یعنی تاریخچه نشست کهنه یا خراب شده است (اغلب پس از رشته‌گفت‌وگوهای طولانی
    یا تغییر ابزار/schema).

    راه‌حل: با `/new` یک نشست تازه شروع کنید (پیام مستقل).

  </Accordion>

  <Accordion title="چرا هر ۳۰ دقیقه پیام‌های Heartbeat می‌گیرم؟">
    Heartbeatها به‌صورت پیش‌فرض هر **30m** اجرا می‌شوند (**1h** هنگام استفاده از احراز هویت OAuth). آن‌ها را تنظیم یا غیرفعال کنید:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    اگر `HEARTBEAT.md` وجود داشته باشد اما عملاً خالی باشد (فقط خطوط خالی و سرصفحه‌های markdown
    مثل `# Heading`)، OpenClaw برای صرفه‌جویی در فراخوانی‌های API اجرای heartbeat را رد می‌کند.
    اگر فایل وجود نداشته باشد، heartbeat همچنان اجرا می‌شود و مدل تصمیم می‌گیرد چه کند.

    بازنویسی‌های مخصوص هر agent از `agents.list[].heartbeat` استفاده می‌کنند. مستندات: [Heartbeat](/fa/gateway/heartbeat).

  </Accordion>

  <Accordion title='آیا باید یک "حساب bot" به یک گروه WhatsApp اضافه کنم؟'>
    نه. OpenClaw روی **حساب خودتان** اجرا می‌شود، پس اگر شما در گروه باشید، OpenClaw می‌تواند آن را ببیند.
    به‌صورت پیش‌فرض، پاسخ‌های گروهی تا وقتی فرستنده‌ها را مجاز نکنید مسدود هستند (`groupPolicy: "allowlist"`).

    اگر می‌خواهید فقط **شما** بتوانید پاسخ‌های گروهی را فعال کنید:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="چگونه JID یک گروه WhatsApp را بگیرم؟">
    گزینه ۱ (سریع‌ترین): logها را دنبال کنید و یک پیام آزمایشی در گروه بفرستید:

    ```bash
    openclaw logs --follow --json
    ```

    به‌دنبال `chatId` (یا `from`) بگردید که به `@g.us` ختم می‌شود، مثل:
    `1234567890-1234567890@g.us`.

    گزینه ۲ (اگر از قبل پیکربندی/allowlist شده است): گروه‌ها را از پیکربندی فهرست کنید:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    مستندات: [WhatsApp](/fa/channels/whatsapp)، [Directory](/fa/cli/directory)، [Logها](/fa/cli/logs).

  </Accordion>

  <Accordion title="چرا OpenClaw در گروه پاسخ نمی‌دهد؟">
    دو علت رایج:

    - دروازه‌گذاری mention روشن است (پیش‌فرض). باید bot را @mention کنید (یا با `mentionPatterns` مطابق شود).
    - شما `channels.whatsapp.groups` را بدون `"*"` پیکربندی کرده‌اید و گروه در allowlist نیست.

    [گروه‌ها](/fa/channels/groups) و [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.

  </Accordion>

  <Accordion title="آیا گروه‌ها/رشته‌ها زمینه را با DMها مشترک می‌کنند؟">
    گفت‌وگوهای مستقیم به‌صورت پیش‌فرض در نشست اصلی ادغام می‌شوند. گروه‌ها/کانال‌ها کلیدهای نشست خودشان را دارند، و موضوع‌های Telegram / رشته‌های Discord نشست‌های جداگانه هستند. [گروه‌ها](/fa/channels/groups) و [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.
  </Accordion>

  <Accordion title="چند فضای کاری و agent می‌توانم ایجاد کنم؟">
    محدودیت سختی وجود ندارد. ده‌ها (حتی صدها) مورد مشکلی ندارد، اما مراقب این‌ها باشید:

    - **رشد دیسک:** نشست‌ها + رونوشت‌ها زیر `~/.openclaw/agents/<agentId>/sessions/` قرار دارند.
    - **هزینه token:** agentهای بیشتر یعنی استفاده هم‌زمان بیشتر از مدل.
    - **سربار عملیات:** پروفایل‌های احراز هویت، فضاهای کاری، و مسیریابی کانال برای هر agent.

    نکته‌ها:

    - برای هر agent یک فضای کاری **فعال** نگه دارید (`agents.defaults.workspace`).
    - اگر دیسک رشد کرد، نشست‌های قدیمی را هرس کنید (JSONL یا ورودی‌های ذخیره را حذف کنید).
    - از `openclaw doctor` برای یافتن فضاهای کاری سرگردان و ناسازگاری‌های پروفایل استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم چند bot یا chat را هم‌زمان اجرا کنم (Slack)، و باید چطور آن را تنظیم کنم؟">
    بله. از **مسیریابی چندعاملی** برای اجرای چند agent ایزوله و مسیریابی پیام‌های ورودی بر اساس
    channel/account/peer استفاده کنید. Slack به‌عنوان channel پشتیبانی می‌شود و می‌تواند به agentهای مشخصی متصل شود.

    دسترسی مرورگر قدرتمند است اما به معنی «انجام هر کاری که انسان می‌تواند انجام دهد» نیست - ضدربات، CAPTCHAها، و MFA هنوز می‌توانند
    automation را مسدود کنند. برای مطمئن‌ترین کنترل مرورگر، از Chrome MCP محلی روی host استفاده کنید،
    یا از CDP روی ماشینی استفاده کنید که واقعاً مرورگر را اجرا می‌کند.

    تنظیم پیشنهادی:

    - host همیشه‌روشن Gateway (VPS/Mac mini).
    - یک agent برای هر نقش (bindings).
    - channelهای Slack متصل به آن agentها.
    - مرورگر محلی از طریق Chrome MCP یا یک node در صورت نیاز.

    مستندات: [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [Slack](/fa/channels/slack)،
    [مرورگر](/fa/tools/browser)، [Nodeها](/fa/nodes).

  </Accordion>
</AccordionGroup>

## Modelها، failover، و auth profileها

پرسش‌وپاسخ Model — پیش‌فرض‌ها، انتخاب، aliasها، جابه‌جایی، failover، auth profileها —
در [سوالات متداول Modelها](/fa/help/faq-models) قرار دارد.

## Gateway: portها، «already running»، و remote mode

<AccordionGroup>
  <Accordion title="Gateway از چه portی استفاده می‌کند؟">
    `gateway.port` تنها port multiplexed را برای WebSocket + HTTP (Control UI، hookها، و غیره) کنترل می‌کند.

    اولویت:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='چرا openclaw gateway status می‌گوید "Runtime: running" اما "Connectivity probe: failed"؟'>
    چون «running» دید **supervisor** است (launchd/systemd/schtasks). connectivity probe همان CLI است که واقعاً به gateway WebSocket وصل می‌شود.

    از `openclaw gateway status` استفاده کنید و به این خط‌ها اعتماد کنید:

    - `Probe target:` (URLای که probe واقعاً استفاده کرده است)
    - `Listening:` (چیزی که واقعاً روی port bind شده است)
    - `Last gateway error:` (علت ریشه‌ای رایج وقتی process زنده است اما port listening نیست)

  </Accordion>

  <Accordion title='چرا openclaw gateway status مقدارهای "Config (cli)" و "Config (service)" را متفاوت نشان می‌دهد؟'>
    شما در حال ویرایش یک config file هستید در حالی که service با config دیگری اجرا می‌شود (اغلب به دلیل ناهماهنگی `--profile` / `OPENCLAW_STATE_DIR`).

    رفع مشکل:

    ```bash
    openclaw gateway install --force
    ```

    آن را از همان `--profile` / environmentای اجرا کنید که می‌خواهید service از آن استفاده کند.

  </Accordion>

  <Accordion title='عبارت "another gateway instance is already listening" یعنی چه؟'>
    OpenClaw با bind کردن فوری WebSocket listener در startup (پیش‌فرض `ws://127.0.0.1:18789`) یک runtime lock اعمال می‌کند. اگر bind با `EADDRINUSE` شکست بخورد، `GatewayLockError` ایجاد می‌کند که نشان می‌دهد instance دیگری از قبل listening است.

    رفع مشکل: instance دیگر را متوقف کنید، port را آزاد کنید، یا با `openclaw gateway --port <port>` اجرا کنید.

  </Accordion>

  <Accordion title="چطور OpenClaw را در remote mode اجرا کنم (client به Gateway در جای دیگری وصل می‌شود)؟">
    `gateway.mode: "remote"` را تنظیم کنید و به یک WebSocket URL دور اشاره کنید، در صورت نیاز با shared-secret remote credentials:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    نکته‌ها:

    - `openclaw gateway` فقط وقتی شروع می‌شود که `gateway.mode` برابر `local` باشد (یا override flag را پاس کنید).
    - app macOS فایل config را پایش می‌کند و وقتی این مقدارها تغییر کنند، حالت‌ها را به‌صورت زنده جابه‌جا می‌کند.
    - `gateway.remote.token` / `.password` فقط client-side remote credentials هستند؛ به‌تنهایی local gateway auth را فعال نمی‌کنند.

  </Accordion>

  <Accordion title='Control UI می‌گوید "unauthorized" (یا مدام reconnect می‌کند). حالا چه کنم؟'>
    مسیر auth Gateway شما و روش auth رابط کاربری با هم تطابق ندارند.

    واقعیت‌ها (از کد):

    - Control UI توکن را برای session تب فعلی مرورگر و gateway URL انتخاب‌شده در `sessionStorage` نگه می‌دارد، بنابراین refreshهای همان تب بدون بازیابی پایداری token در localStorage بلندمدت همچنان کار می‌کنند.
    - در `AUTH_TOKEN_MISMATCH`، clientهای trusted می‌توانند وقتی Gateway retry hintها را برمی‌گرداند (`canRetryWithDeviceToken=true`، `recommendedNextStep=retry_with_device_token`)، یک retry محدود با cached device token انجام دهند.
    - آن retry با cached-token اکنون cached approved scopes ذخیره‌شده همراه device token را دوباره استفاده می‌کند. فراخوان‌های explicit `deviceToken` / explicit `scopes` همچنان به‌جای به‌ارث‌بردن cached scopes، scope set درخواستی خود را نگه می‌دارند.
    - خارج از آن retry path، تقدم connect auth ابتدا explicit shared token/password است، سپس explicit `deviceToken`، سپس stored device token، سپس bootstrap token.
    - بررسی scopeهای bootstrap token با role prefix انجام می‌شود. allowlist داخلی bootstrap operator فقط درخواست‌های operator را برآورده می‌کند؛ node یا roleهای غیر operator دیگر همچنان به scopeهایی زیر prefix role خودشان نیاز دارند.

    رفع مشکل:

    - سریع‌ترین: `openclaw dashboard` (dashboard URL را چاپ و copy می‌کند، سعی می‌کند باز کند؛ اگر headless باشد SSH hint نشان می‌دهد).
    - اگر هنوز token ندارید: `openclaw doctor --generate-gateway-token`.
    - اگر remote است، ابتدا tunnel بزنید: `ssh -N -L 18789:127.0.0.1:18789 user@host` سپس `http://127.0.0.1:18789/` را باز کنید.
    - shared-secret mode: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` یا `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` را تنظیم کنید، سپس secret مطابق را در تنظیمات Control UI paste کنید.
    - Tailscale Serve mode: مطمئن شوید `gateway.auth.allowTailscale` فعال است و Serve URL را باز می‌کنید، نه یک loopback/tailnet URL خام که Tailscale identity headers را دور می‌زند.
    - trusted-proxy mode: مطمئن شوید از طریق identity-aware proxy پیکربندی‌شده می‌آیید، نه یک gateway URL خام. same-host loopback proxyها نیز به `gateway.auth.trustedProxy.allowLoopback = true` نیاز دارند.
    - اگر mismatch پس از یک retry همچنان باقی ماند، paired device token را rotate/re-approve کنید:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - اگر آن rotate call گفت denied شده است، دو مورد را بررسی کنید:
      - paired-device sessionها فقط می‌توانند device **خودشان** را rotate کنند مگر اینکه `operator.admin` هم داشته باشند
      - مقدارهای explicit `--scope` نمی‌توانند از scopeهای operator فعلی caller فراتر بروند
    - هنوز گیر کرده‌اید؟ `openclaw status --all` را اجرا کنید و [عیب‌یابی](/fa/gateway/troubleshooting) را دنبال کنید. برای جزئیات auth، [Dashboard](/fa/web/dashboard) را ببینید.

  </Accordion>

  <Accordion title="gateway.bind را روی tailnet تنظیم کردم اما نمی‌تواند bind کند و چیزی listening نیست">
    bind با `tailnet` یک Tailscale IP را از network interfaceهای شما انتخاب می‌کند (100.64.0.0/10). اگر ماشین روی Tailscale نباشد (یا interface پایین باشد)، چیزی برای bind کردن وجود ندارد.

    رفع مشکل:

    - Tailscale را روی آن host شروع کنید (تا یک آدرس 100.x داشته باشد)، یا
    - به `gateway.bind: "loopback"` / `"lan"` تغییر دهید.

    نکته: `tailnet` صریح است. `auto`، loopback را ترجیح می‌دهد؛ وقتی bind فقط tailnet می‌خواهید از `gateway.bind: "tailnet"` استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم چند Gateway را روی یک host اجرا کنم؟">
    معمولاً خیر - یک Gateway می‌تواند چند messaging channel و agent را اجرا کند. فقط وقتی از چند Gateway استفاده کنید که به redundancy (مثلاً rescue bot) یا isolation سخت نیاز دارید.

    بله، اما باید ایزوله کنید:

    - `OPENCLAW_CONFIG_PATH` (config هر instance)
    - `OPENCLAW_STATE_DIR` (state هر instance)
    - `agents.defaults.workspace` (workspace isolation)
    - `gateway.port` (portهای یکتا)

    تنظیم سریع (توصیه‌شده):

    - برای هر instance از `openclaw --profile <name> ...` استفاده کنید (به‌صورت خودکار `~/.openclaw-<name>` می‌سازد).
    - در config هر profile یک `gateway.port` یکتا تنظیم کنید (یا برای اجراهای دستی `--port` را پاس کنید).
    - یک service برای هر profile نصب کنید: `openclaw --profile <name> gateway install`.

    Profileها نام serviceها را نیز suffix می‌کنند (`ai.openclaw.<profile>`؛ legacy `com.openclaw.*`، `openclaw-gateway-<profile>.service`، `OpenClaw Gateway (<profile>)`).
    راهنمای کامل: [چند gateway](/fa/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='عبارت "invalid handshake" / code 1008 یعنی چه؟'>
    Gateway یک **WebSocket server** است، و انتظار دارد نخستین پیام
    یک frame از نوع `connect` باشد. اگر چیز دیگری دریافت کند، connection را
    با **code 1008** (policy violation) می‌بندد.

    علت‌های رایج:

    - شما **HTTP** URL را در مرورگر باز کرده‌اید (`http://...`) به‌جای WS client.
    - از port یا path اشتباه استفاده کرده‌اید.
    - یک proxy یا tunnel، auth headerها را حذف کرده یا یک درخواست غیر Gateway فرستاده است.

    رفع سریع:

    1. از WS URL استفاده کنید: `ws://<host>:18789` (یا اگر HTTPS است `wss://...`).
    2. WS port را در یک تب معمولی مرورگر باز نکنید.
    3. اگر auth روشن است، token/password را در frame `connect` قرار دهید.

    اگر از CLI یا TUI استفاده می‌کنید، URL باید شبیه این باشد:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    جزئیات protocol: [protocol Gateway](/fa/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Logging و debugging

<AccordionGroup>
  <Accordion title="logها کجا هستند؟">
    File logها (structured):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    می‌توانید از طریق `logging.file` یک مسیر ثابت تنظیم کنید. سطح file log با `logging.level` کنترل می‌شود. verbose بودن console با `--verbose` و `logging.consoleLevel` کنترل می‌شود.

    سریع‌ترین tail برای log:

    ```bash
    openclaw logs --follow
    ```

    logهای service/supervisor (وقتی gateway از طریق launchd/systemd اجرا می‌شود):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` و `gateway.err.log` (پیش‌فرض: `~/.openclaw/logs/...`؛ profileها از `~/.openclaw-<profile>/logs/...` استفاده می‌کنند)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    برای موارد بیشتر [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید.

  </Accordion>

  <Accordion title="چطور Gateway service را start/stop/restart کنم؟">
    از helperهای gateway استفاده کنید:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر gateway را دستی اجرا می‌کنید، `openclaw gateway --force` می‌تواند port را پس بگیرد. [Gateway](/fa/gateway) را ببینید.

  </Accordion>

  <Accordion title="terminal خود را در Windows بستم - چطور OpenClaw را restart کنم؟">
    **دو Windows install mode** وجود دارد:

    **1) WSL2 (توصیه‌شده):** Gateway داخل Linux اجرا می‌شود.

    PowerShell را باز کنید، وارد WSL شوید، سپس restart کنید:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر service را هرگز نصب نکرده‌اید، آن را در foreground شروع کنید:

    ```bash
    openclaw gateway run
    ```

    **2) Native Windows (توصیه نمی‌شود):** Gateway مستقیماً در Windows اجرا می‌شود.

    PowerShell را باز کنید و اجرا کنید:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر آن را دستی اجرا می‌کنید (بدون service)، استفاده کنید:

    ```powershell
    openclaw gateway run
    ```

    مستندات: [Windows (WSL2)](/fa/platforms/windows)، [runbook سرویس Gateway](/fa/gateway).

  </Accordion>

  <Accordion title="Gateway بالا است اما پاسخ‌ها هرگز نمی‌رسند. چه چیزی را بررسی کنم؟">
    با یک بررسی سریع سلامت شروع کنید:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    علت‌های رایج:

    - auth مربوط به Model روی **gateway host** بارگذاری نشده است (`models status` را بررسی کنید).
    - channel pairing/allowlist جلوی پاسخ‌ها را می‌گیرد (config channel + logها را بررسی کنید).
    - WebChat/Dashboard بدون token درست باز است.

    اگر remote هستید، تأیید کنید اتصال tunnel/Tailscale برقرار است و
    Gateway WebSocket قابل دسترسی است.

    مستندات: [Channelها](/fa/channels)، [عیب‌یابی](/fa/gateway/troubleshooting)، [دسترسی remote](/fa/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - حالا چه کنم؟'>
    این معمولاً یعنی UI اتصال WebSocket را از دست داده است. بررسی کنید:

    1. آیا Gateway در حال اجراست؟ `openclaw gateway status`
    2. آیا Gateway سالم است؟ `openclaw status`
    3. آیا UI توکن درست را دارد؟ `openclaw dashboard`
    4. اگر راه‌دور است، آیا پیوند تونل/Tailscale برقرار است؟

    سپس لاگ‌ها را دنبال کنید:

    ```bash
    openclaw logs --follow
    ```

    مستندات: [داشبورد](/fa/web/dashboard)، [دسترسی راه‌دور](/fa/gateway/remote)، [عیب‌یابی](/fa/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands ناموفق می‌شود. چه چیزی را باید بررسی کنم؟">
    با لاگ‌ها و وضعیت کانال شروع کنید:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    سپس خطا را تطبیق دهید:

    - `BOT_COMMANDS_TOO_MUCH`: منوی Telegram ورودی‌های بیش از حد دارد. OpenClaw از قبل تعداد را تا سقف Telegram کم می‌کند و با فرمان‌های کمتر دوباره تلاش می‌کند، اما برخی ورودی‌های منو همچنان باید حذف شوند. فرمان‌های Plugin/skill/سفارشی را کاهش دهید، یا اگر به منو نیاز ندارید `channels.telegram.commands.native` را غیرفعال کنید.
    - `TypeError: fetch failed`، `Network request for 'setMyCommands' failed!`، یا خطاهای شبکه مشابه: اگر روی VPS هستید یا پشت پراکسی قرار دارید، تأیید کنید HTTPS خروجی مجاز است و DNS برای `api.telegram.org` کار می‌کند.

    اگر Gateway راه‌دور است، مطمئن شوید لاگ‌ها را روی میزبان Gateway می‌بینید.

    مستندات: [Telegram](/fa/channels/telegram)، [عیب‌یابی کانال](/fa/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI هیچ خروجی نشان نمی‌دهد. چه چیزی را باید بررسی کنم؟">
    ابتدا تأیید کنید Gateway در دسترس است و عامل می‌تواند اجرا شود:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    در TUI، از `/status` برای دیدن وضعیت فعلی استفاده کنید. اگر انتظار پاسخ در یک کانال
    چت را دارید، مطمئن شوید تحویل فعال است (`/deliver on`).

    مستندات: [TUI](/fa/web/tui)، [فرمان‌های اسلش](/fa/tools/slash-commands).

  </Accordion>

  <Accordion title="چگونه Gateway را کامل متوقف و سپس شروع کنم؟">
    اگر سرویس را نصب کرده‌اید:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    این کار **سرویس تحت نظارت** را متوقف/شروع می‌کند (launchd در macOS، systemd در Linux).
    وقتی Gateway در پس‌زمینه به‌صورت daemon اجرا می‌شود، از این استفاده کنید.

    اگر در پیش‌زمینه اجرا می‌کنید، با Ctrl-C متوقف کنید، سپس:

    ```bash
    openclaw gateway run
    ```

    مستندات: [راهنمای عملیاتی سرویس Gateway](/fa/gateway).

  </Accordion>

  <Accordion title="به زبان ساده: openclaw gateway restart در برابر openclaw gateway">
    - `openclaw gateway restart`: **سرویس پس‌زمینه** را بازراه‌اندازی می‌کند (launchd/systemd).
    - `openclaw gateway`: Gateway را برای این نشست ترمینال **در پیش‌زمینه** اجرا می‌کند.

    اگر سرویس را نصب کرده‌اید، از فرمان‌های gateway استفاده کنید. وقتی
    اجرای یک‌باره و پیش‌زمینه می‌خواهید، از `openclaw gateway` استفاده کنید.

  </Accordion>

  <Accordion title="سریع‌ترین راه برای گرفتن جزئیات بیشتر هنگام بروز خطا">
    Gateway را با `--verbose` شروع کنید تا جزئیات بیشتری در کنسول دریافت کنید. سپس فایل لاگ را برای احراز هویت کانال، مسیریابی مدل، و خطاهای RPC بررسی کنید.
  </Accordion>
</AccordionGroup>

## رسانه و پیوست‌ها

<AccordionGroup>
  <Accordion title="skill من یک تصویر/PDF تولید کرد، اما چیزی ارسال نشد">
    پیوست‌های خروجی از عامل باید شامل یک خط `MEDIA:<path-or-url>` باشند (در خط جداگانه). [راه‌اندازی دستیار OpenClaw](/fa/start/openclaw) و [ارسال عامل](/fa/tools/agent-send) را ببینید.

    ارسال با CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    همچنین بررسی کنید:

    - کانال هدف از رسانه خروجی پشتیبانی می‌کند و توسط فهرست‌های مجاز مسدود نشده است.
    - فایل در محدوده اندازه ارائه‌دهنده است (تصاویر تا حداکثر 2048px تغییر اندازه داده می‌شوند).
    - `tools.fs.workspaceOnly=true` ارسال‌های مسیر محلی را به فضای کاری، temp/media-store، و فایل‌های اعتبارسنجی‌شده توسط sandbox محدود نگه می‌دارد.
    - `tools.fs.workspaceOnly=false` به `MEDIA:` اجازه می‌دهد فایل‌های محلی میزبان را که عامل از قبل می‌تواند بخواند ارسال کند، اما فقط برای رسانه به‌علاوه انواع سند امن (تصاویر، صدا، ویدئو، PDF، و سندهای Office). فایل‌های متن ساده و شبیه راز همچنان مسدود می‌شوند.

    [تصاویر](/fa/nodes/images) را ببینید.

  </Accordion>
</AccordionGroup>

## امنیت و کنترل دسترسی

<AccordionGroup>
  <Accordion title="آیا در معرض قرار دادن OpenClaw برای پیام‌های خصوصی ورودی امن است؟">
    پیام‌های خصوصی ورودی را ورودی نامطمئن در نظر بگیرید. پیش‌فرض‌ها برای کاهش ریسک طراحی شده‌اند:

    - رفتار پیش‌فرض در کانال‌هایی که از پیام خصوصی پشتیبانی می‌کنند **جفت‌سازی** است:
      - فرستندگان ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ ربات پیام آن‌ها را پردازش نمی‌کند.
      - با این فرمان تأیید کنید: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - درخواست‌های در انتظار به **3 مورد برای هر کانال** محدود می‌شوند؛ اگر کدی نرسید، `openclaw pairing list --channel <channel> [--account <id>]` را بررسی کنید.
    - باز کردن عمومی پیام‌های خصوصی نیازمند opt-in صریح است (`dmPolicy: "open"` و فهرست مجاز `"*"`).

    برای آشکار کردن سیاست‌های پرریسک پیام خصوصی، `openclaw doctor` را اجرا کنید.

  </Accordion>

  <Accordion title="آیا تزریق پرامپت فقط برای ربات‌های عمومی نگرانی ایجاد می‌کند؟">
    خیر. تزریق پرامپت مربوط به **محتوای نامطمئن** است، نه فقط اینکه چه کسی می‌تواند به ربات پیام خصوصی بدهد.
    اگر دستیار شما محتوای بیرونی را می‌خواند (جست‌وجو/دریافت وب، صفحه‌های مرورگر، ایمیل‌ها،
    مستندات، پیوست‌ها، لاگ‌های چسبانده‌شده)، آن محتوا می‌تواند شامل دستورالعمل‌هایی باشد که تلاش می‌کنند
    مدل را منحرف کنند. این حتی اگر **تنها فرستنده شما باشید** هم می‌تواند رخ دهد.

    بزرگ‌ترین ریسک زمانی است که ابزارها فعال باشند: مدل می‌تواند فریب بخورد تا
    زمینه را برون‌ریزی کند یا از طرف شما ابزارها را فراخوانی کند. دامنه اثر را با این کارها کاهش دهید:

    - استفاده از یک عامل «خواننده» فقط‌خواندنی یا بدون ابزار برای خلاصه کردن محتوای نامطمئن
    - خاموش نگه داشتن `web_search` / `web_fetch` / `browser` برای عامل‌های دارای ابزار
    - نامطمئن دانستن متن استخراج‌شده از فایل/سند نیز: OpenResponses
      `input_file` و استخراج پیوست رسانه هر دو متن استخراج‌شده را به‌جای ارسال متن خام فایل،
      در نشانگرهای مرز محتوای خارجی صریح می‌پیچند
    - استفاده از sandbox و فهرست‌های مجاز سخت‌گیرانه برای ابزارها

    جزئیات: [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="آیا ربات من باید ایمیل، حساب GitHub، یا شماره تلفن خودش را داشته باشد؟">
    بله، برای بیشتر راه‌اندازی‌ها. ایزوله کردن ربات با حساب‌ها و شماره تلفن‌های جداگانه
    اگر مشکلی پیش بیاید دامنه اثر را کاهش می‌دهد. این کار همچنین چرخش
    اعتبارنامه‌ها یا لغو دسترسی را بدون تأثیر بر حساب‌های شخصی شما آسان‌تر می‌کند.

    کوچک شروع کنید. فقط به ابزارها و حساب‌هایی که واقعاً نیاز دارید دسترسی بدهید، و
    در صورت نیاز بعداً گسترش دهید.

    مستندات: [امنیت](/fa/gateway/security)، [جفت‌سازی](/fa/channels/pairing).

  </Accordion>

  <Accordion title="آیا می‌توانم به آن خودمختاری روی پیام‌های متنی‌ام بدهم و آیا این امن است؟">
    ما خودمختاری کامل روی پیام‌های شخصی شما را توصیه **نمی‌کنیم**. امن‌ترین الگو این است:

    - پیام‌های خصوصی را در **حالت جفت‌سازی** یا یک فهرست مجاز محدود نگه دارید.
    - اگر می‌خواهید از طرف شما پیام بدهد، از یک **شماره یا حساب جداگانه** استفاده کنید.
    - بگذارید پیش‌نویس کند، سپس **قبل از ارسال تأیید کنید**.

    اگر می‌خواهید آزمایش کنید، این کار را روی یک حساب اختصاصی انجام دهید و آن را ایزوله نگه دارید. [امنیت](/fa/gateway/security) را ببینید.

  </Accordion>

  <Accordion title="آیا می‌توانم برای کارهای دستیار شخصی از مدل‌های ارزان‌تر استفاده کنم؟">
    بله، **اگر** عامل فقط چت می‌کند و ورودی مورد اعتماد است. رده‌های کوچک‌تر
    در برابر ربودن دستورالعمل آسیب‌پذیرترند، پس برای عامل‌های دارای ابزار
    یا هنگام خواندن محتوای نامطمئن از آن‌ها پرهیز کنید. اگر مجبورید از مدل کوچک‌تر استفاده کنید،
    ابزارها را قفل کنید و داخل sandbox اجرا کنید. [امنیت](/fa/gateway/security) را ببینید.
  </Accordion>

  <Accordion title="در Telegram فرمان /start را اجرا کردم اما کد جفت‌سازی نگرفتم">
    کدهای جفت‌سازی **فقط** وقتی ارسال می‌شوند که یک فرستنده ناشناس به ربات پیام بدهد و
    `dmPolicy: "pairing"` فعال باشد. `/start` به‌تنهایی کدی تولید نمی‌کند.

    درخواست‌های در انتظار را بررسی کنید:

    ```bash
    openclaw pairing list telegram
    ```

    اگر دسترسی فوری می‌خواهید، شناسه فرستنده خود را در فهرست مجاز قرار دهید یا برای آن حساب `dmPolicy: "open"` تنظیم کنید.

  </Accordion>

  <Accordion title="WhatsApp: آیا به مخاطبانم پیام می‌دهد؟ جفت‌سازی چگونه کار می‌کند؟">
    خیر. سیاست پیش‌فرض پیام خصوصی WhatsApp **جفت‌سازی** است. فرستندگان ناشناس فقط یک کد جفت‌سازی می‌گیرند و پیام آن‌ها **پردازش نمی‌شود**. OpenClaw فقط به چت‌هایی پاسخ می‌دهد که دریافت می‌کند یا به ارسال‌های صریحی که شما راه‌اندازی می‌کنید.

    جفت‌سازی را با این فرمان تأیید کنید:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    درخواست‌های در انتظار را فهرست کنید:

    ```bash
    openclaw pairing list whatsapp
    ```

    پرسش شماره تلفن در راهنما: از آن برای تنظیم **فهرست مجاز/مالک** شما استفاده می‌شود تا پیام‌های خصوصی خودتان مجاز باشند. برای ارسال خودکار استفاده نمی‌شود. اگر روی شماره شخصی WhatsApp خود اجرا می‌کنید، از همان شماره استفاده کنید و `channels.whatsapp.selfChatMode` را فعال کنید.

  </Accordion>
</AccordionGroup>

## فرمان‌های چت، لغو کارها، و «متوقف نمی‌شود»

<AccordionGroup>
  <Accordion title="چگونه از نمایش پیام‌های داخلی سیستم در چت جلوگیری کنم؟">
    بیشتر پیام‌های داخلی یا ابزار فقط وقتی ظاهر می‌شوند که **verbose**، **trace**، یا **reasoning**
    برای آن نشست فعال باشد.

    در چتی که آن را می‌بینید اصلاح کنید:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    اگر همچنان شلوغ است، تنظیمات نشست را در Control UI بررسی کنید و verbose
    را روی **inherit** بگذارید. همچنین تأیید کنید از پروفایل رباتی استفاده نمی‌کنید که در پیکربندی `verboseDefault`
    روی `on` تنظیم شده باشد.

    مستندات: [تفکر و verbose](/fa/tools/thinking)، [امنیت](/fa/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="چگونه یک کار در حال اجرا را متوقف/لغو کنم؟">
    هرکدام از این‌ها را **به‌صورت پیام مستقل** بفرستید (بدون اسلش):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    این‌ها محرک‌های لغو هستند (نه فرمان‌های اسلش).

    برای فرایندهای پس‌زمینه (از ابزار exec)، می‌توانید از عامل بخواهید اجرا کند:

    ```
    process action:kill sessionId:XXX
    ```

    نمای کلی فرمان‌های اسلش: [فرمان‌های اسلش](/fa/tools/slash-commands) را ببینید.

    بیشتر فرمان‌ها باید به‌صورت پیام **مستقل** که با `/` شروع می‌شود ارسال شوند، اما چند میانبر (مثل `/status`) برای فرستندگان فهرست مجاز به‌صورت درون‌خطی هم کار می‌کنند.

  </Accordion>

  <Accordion title='چگونه از Telegram یک پیام Discord بفرستم؟ ("Cross-context messaging denied")'>
    OpenClaw به‌طور پیش‌فرض پیام‌رسانی **میان ارائه‌دهنده‌ها** را مسدود می‌کند. اگر یک فراخوانی ابزار
    به Telegram متصل باشد، به Discord ارسال نمی‌کند مگر اینکه صریحاً اجازه دهید.

    پیام‌رسانی میان ارائه‌دهنده‌ها را برای عامل فعال کنید:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    پس از ویرایش پیکربندی، gateway را بازراه‌اندازی کنید.

  </Accordion>

  <Accordion title='چرا احساس می‌شود ربات پیام‌های پشت‌سرهم را «نادیده می‌گیرد»؟'>
    حالت صف کنترل می‌کند پیام‌های جدید چگونه با اجرای در حال انجام تعامل کنند. برای تغییر حالت‌ها از `/queue` استفاده کنید:

    - `steer` - همه هدایت‌های در انتظار را برای مرز مدل بعدی در اجرای فعلی صف می‌کند
    - `queue` - هدایت قدیمی یکی‌درمیان
    - `followup` - پیام‌ها را یکی‌یکی اجرا می‌کند
    - `collect` - پیام‌ها را دسته‌بندی می‌کند و یک‌بار پاسخ می‌دهد
    - `steer-backlog` - اکنون هدایت می‌کند، سپس backlog را پردازش می‌کند
    - `interrupt` - اجرای فعلی را لغو می‌کند و از نو شروع می‌کند

    حالت پیش‌فرض `steer` است. می‌توانید برای حالت‌های followup گزینه‌هایی مثل `debounce:0.5s cap:25 drop:summarize` اضافه کنید. [صف فرمان](/fa/concepts/queue) و [صف هدایت](/fa/concepts/queue-steering) را ببینید.

  </Accordion>
</AccordionGroup>

## متفرقه

<AccordionGroup>
  <Accordion title='مدل پیش‌فرض برای Anthropic با کلید API چیست؟'>
    در OpenClaw، اعتبارنامه‌ها و انتخاب مدل از هم جدا هستند. تنظیم `ANTHROPIC_API_KEY` (یا ذخیره‌سازی یک کلید API مربوط به Anthropic در پروفایل‌های احراز هویت) احراز هویت را فعال می‌کند، اما مدل پیش‌فرض واقعی همان چیزی است که در `agents.defaults.model.primary` پیکربندی می‌کنید (برای مثال، `anthropic/claude-sonnet-4-6` یا `anthropic/claude-opus-4-6`). اگر `No credentials found for profile "anthropic:default"` را می‌بینید، یعنی Gateway نتوانسته اعتبارنامه‌های Anthropic را در `auth-profiles.json` مورد انتظار برای عاملی که در حال اجراست پیدا کند.
  </Accordion>
</AccordionGroup>

---

هنوز گیر کرده‌اید؟ در [Discord](https://discord.com/invite/clawd) بپرسید یا یک [بحث GitHub](https://github.com/openclaw/openclaw/discussions) باز کنید.

## مرتبط

- [پرسش‌های متداول اجرای نخست](/fa/help/faq-first-run) — نصب، راه‌اندازی اولیه، احراز هویت، اشتراک‌ها، خطاهای اولیه
- [پرسش‌های متداول مدل‌ها](/fa/help/faq-models) — انتخاب مدل، جابه‌جایی هنگام خرابی، پروفایل‌های احراز هویت
- [عیب‌یابی](/fa/help/troubleshooting) — تریاژ بر اساس نشانه‌ها
