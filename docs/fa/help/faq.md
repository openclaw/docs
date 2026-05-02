---
read_when:
    - پاسخ به پرسش‌های رایج پشتیبانی دربارهٔ راه‌اندازی، نصب، شروع به کار یا زمان اجرا
    - تریاژ مسائل گزارش‌شده توسط کاربران پیش از اشکال‌زدایی عمیق‌تر
summary: پرسش‌های متداول دربارهٔ راه‌اندازی، پیکربندی و استفاده از OpenClaw
title: پرسش‌های متداول
x-i18n:
    generated_at: "2026-05-02T22:20:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1437a84d7da0e4111edd46297b2a486e2da4f6e4a6cff0d69d6a372e85608130
    source_path: help/faq.md
    workflow: 16
---

پاسخ‌های سریع به‌همراه عیب‌یابی عمیق‌تر برای راه‌اندازی‌های واقعی (توسعه محلی، VPS، چندعاملی، کلیدهای OAuth/API، failover مدل). برای عیب‌یابی زمان اجرا، [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید. برای مرجع کامل پیکربندی، [پیکربندی](/fa/gateway/configuration) را ببینید.

## ۶۰ ثانیه نخست اگر چیزی خراب است

1. **وضعیت سریع (نخستین بررسی)**

   ```bash
   openclaw status
   ```

   خلاصه محلی سریع: سیستم‌عامل + به‌روزرسانی، دسترسی‌پذیری gateway/service، agents/sessions، پیکربندی provider + مشکلات زمان اجرا (وقتی gateway در دسترس باشد).

2. **گزارش قابل چسباندن (ایمن برای اشتراک‌گذاری)**

   ```bash
   openclaw status --all
   ```

   تشخیص فقط‌خواندنی همراه با انتهای لاگ (توکن‌ها پوشانده می‌شوند).

3. **وضعیت daemon + پورت**

   ```bash
   openclaw gateway status
   ```

   زمان اجرای supervisor در برابر دسترسی‌پذیری RPC، URL مقصد probe، و اینکه سرویس احتمالا از کدام پیکربندی استفاده کرده است را نشان می‌دهد.

4. **probeهای عمیق**

   ```bash
   openclaw status --deep
   ```

   یک probe زنده سلامت Gateway اجرا می‌کند، از جمله probeهای کانال وقتی پشتیبانی شوند
   (به یک Gateway در دسترس نیاز دارد). [سلامت](/fa/gateway/health) را ببینید.

5. **دنبال کردن آخرین لاگ**

   ```bash
   openclaw logs --follow
   ```

   اگر RPC از کار افتاده است، به این برگردید:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   لاگ‌های فایل از لاگ‌های سرویس جدا هستند؛ [لاگ‌گیری](/fa/logging) و [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید.

6. **اجرای doctor (تعمیرها)**

   ```bash
   openclaw doctor
   ```

   پیکربندی/وضعیت را تعمیر/مهاجرت می‌دهد + بررسی‌های سلامت را اجرا می‌کند. [Doctor](/fa/gateway/doctor) را ببینید.

7. **snapshot Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   از Gateway در حال اجرا یک snapshot کامل می‌خواهد (فقط WS). [سلامت](/fa/gateway/health) را ببینید.

## شروع سریع و راه‌اندازی نخستین اجرا

پرسش‌وپاسخ نخستین اجرا، شامل نصب، onboard، مسیرهای auth، subscriptions، و شکست‌های اولیه،
در [پرسش‌های متداول نخستین اجرا](/fa/help/faq-first-run) قرار دارد.

## OpenClaw چیست؟

<AccordionGroup>
  <Accordion title="OpenClaw در یک پاراگراف چیست؟">
    OpenClaw یک دستیار هوش مصنوعی شخصی است که آن را روی دستگاه‌های خودتان اجرا می‌کنید. روی سطح‌های پیام‌رسانی که همین حالا استفاده می‌کنید پاسخ می‌دهد (WhatsApp، Telegram، Slack، Mattermost، Discord، Google Chat، Signal، iMessage، WebChat، و Pluginهای کانال همراه مانند QQ Bot) و روی پلتفرم‌های پشتیبانی‌شده می‌تواند صدا + یک Canvas زنده هم ارائه کند. **Gateway** صفحه کنترل همیشه‌روشن است؛ دستیار، محصول است.
  </Accordion>

  <Accordion title="ارزش پیشنهادی">
    OpenClaw «فقط یک پوشش Claude» نیست. یک **صفحه کنترل local-first** است که به شما اجازه می‌دهد یک
    دستیار توانمند را روی **سخت‌افزار خودتان** اجرا کنید، از اپ‌های گفت‌وگویی که همین حالا استفاده می‌کنید به آن دسترسی داشته باشید، با
    نشست‌های stateful، حافظه، و ابزارها - بدون اینکه کنترل گردش‌کارهای خود را به یک SaaS میزبانی‌شده بسپارید.

    نکات برجسته:

    - **دستگاه‌های شما، داده‌های شما:** Gateway را هر جا خواستید اجرا کنید (Mac، Linux، VPS) و
      workspace + تاریخچه نشست را محلی نگه دارید.
    - **کانال‌های واقعی، نه sandbox وب:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc،
      به‌علاوه صدای موبایل و Canvas روی پلتفرم‌های پشتیبانی‌شده.
    - **بی‌طرف نسبت به مدل:** از Anthropic، OpenAI، MiniMax، OpenRouter و غیره، با مسیریابی
      و failover برای هر agent استفاده کنید.
    - **گزینه فقط‌محلی:** مدل‌های محلی را اجرا کنید تا اگر خواستید **همه داده‌ها بتوانند روی دستگاه شما بمانند**.
    - **مسیریابی چندعاملی:** agentهای جداگانه برای هر کانال، حساب، یا وظیفه، هرکدام با
      workspace و پیش‌فرض‌های خودش.
    - **متن‌باز و قابل دستکاری:** بدون قفل‌شدن به فروشنده، بررسی، توسعه، و خودمیزبانی کنید.

    مستندات: [Gateway](/fa/gateway)، [کانال‌ها](/fa/channels)، [چندعاملی](/fa/concepts/multi-agent)،
    [حافظه](/fa/concepts/memory).

  </Accordion>

  <Accordion title="همین حالا راه‌اندازی‌اش کردم - اول چه کار کنم؟">
    پروژه‌های خوب برای شروع:

    - ساخت یک وب‌سایت (WordPress، Shopify، یا یک سایت ایستای ساده).
    - نمونه‌سازی یک اپ موبایل (طرح کلی، صفحه‌ها، برنامه API).
    - سازمان‌دهی فایل‌ها و پوشه‌ها (پاک‌سازی، نام‌گذاری، برچسب‌گذاری).
    - اتصال Gmail و خودکارسازی خلاصه‌ها یا پیگیری‌ها.

    می‌تواند کارهای بزرگ را انجام دهد، اما وقتی آن‌ها را به فازها تقسیم کنید و
    از sub agents برای کار موازی استفاده کنید، بهترین عملکرد را دارد.

  </Accordion>

  <Accordion title="پنج کاربرد روزمره برتر OpenClaw چیست؟">
    موفقیت‌های روزمره معمولا شبیه این‌ها هستند:

    - **خلاصه‌های شخصی:** خلاصه‌هایی از inbox، تقویم، و خبرهایی که برایتان مهم‌اند.
    - **پژوهش و پیش‌نویس‌نویسی:** پژوهش سریع، خلاصه‌ها، و نخستین پیش‌نویس‌ها برای ایمیل‌ها یا مستندات.
    - **یادآورها و پیگیری‌ها:** تلنگرها و چک‌لیست‌های مبتنی بر Cron یا Heartbeat.
    - **خودکارسازی مرورگر:** پر کردن فرم‌ها، جمع‌آوری داده‌ها، و تکرار وظایف وب.
    - **هماهنگی میان دستگاه‌ها:** یک وظیفه را از تلفن خود بفرستید، بگذارید Gateway آن را روی سرور اجرا کند، و نتیجه را در گفت‌وگو پس بگیرید.

  </Accordion>

  <Accordion title="آیا OpenClaw می‌تواند در جذب سرنخ، برقراری ارتباط، تبلیغات و وبلاگ‌ها برای یک SaaS کمک کند؟">
    بله، برای **پژوهش، ارزیابی و پیش‌نویس‌نویسی**. می‌تواند سایت‌ها را اسکن کند، فهرست‌های کوتاه بسازد،
    مشتریان احتمالی را خلاصه کند و پیش‌نویس پیام‌های ارتباطی یا متن تبلیغاتی بنویسد.

    برای **اجرای ارتباطات یا تبلیغات**، انسان را در چرخه نگه دارید. از اسپم پرهیز کنید، قوانین محلی و
    سیاست‌های پلتفرم را رعایت کنید و پیش از ارسال، همه‌چیز را بازبینی کنید. امن‌ترین الگو این است که
    OpenClaw پیش‌نویس کند و شما تأیید کنید.

    مستندات: [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="مزیت‌ها نسبت به Claude Code برای توسعه وب چیست؟">
    OpenClaw یک **دستیار شخصی** و لایه هماهنگی است، نه جایگزین IDE. از
    Claude Code یا Codex برای سریع‌ترین حلقه مستقیم کدنویسی داخل یک مخزن استفاده کنید. زمانی از OpenClaw استفاده کنید که
    حافظه پایدار، دسترسی میان‌دستگاهی و هماهنگ‌سازی ابزارها می‌خواهید.

    مزیت‌ها:

    - **حافظه پایدار + فضای کاری** در سراسر نشست‌ها
    - **دسترسی چندپلتفرمی** (WhatsApp، Telegram، TUI، WebChat)
    - **هماهنگ‌سازی ابزارها** (مرورگر، فایل‌ها، زمان‌بندی، hookها)
    - **Gateway همیشه روشن** (روی یک VPS اجرا کنید، از هرجا تعامل داشته باشید)
    - **Nodeها** برای مرورگر/صفحه‌نمایش/دوربین/اجرای محلی

    نمایش: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills و خودکارسازی

<AccordionGroup>
  <Accordion title="چطور Skills را بدون کثیف نگه داشتن مخزن سفارشی کنم؟">
    به‌جای ویرایش کپی مخزن، از بازنویسی‌های مدیریت‌شده استفاده کنید. تغییراتتان را در `~/.openclaw/skills/<name>/SKILL.md` قرار دهید (یا از طریق `skills.load.extraDirs` در `~/.openclaw/openclaw.json` یک پوشه اضافه کنید). ترتیب تقدم `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` است، بنابراین بازنویسی‌های مدیریت‌شده همچنان بدون دست زدن به git بر Skills همراه‌شده اولویت دارند. اگر لازم است skill به‌صورت سراسری نصب شود اما فقط برای برخی عامل‌ها قابل مشاهده باشد، کپی مشترک را در `~/.openclaw/skills` نگه دارید و قابلیت مشاهده را با `agents.defaults.skills` و `agents.list[].skills` کنترل کنید. فقط ویرایش‌هایی که ارزش ارسال به بالادست دارند باید در مخزن باشند و به‌صورت PR ارسال شوند.
  </Accordion>

  <Accordion title="آیا می‌توانم Skills را از یک پوشه سفارشی بارگذاری کنم؟">
    بله. دایرکتوری‌های اضافی را از طریق `skills.load.extraDirs` در `~/.openclaw/openclaw.json` اضافه کنید (کمترین تقدم). ترتیب تقدم پیش‌فرض `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` است. `clawhub` به‌طور پیش‌فرض در `./skills` نصب می‌کند که OpenClaw در نشست بعدی آن را به‌عنوان `<workspace>/skills` در نظر می‌گیرد. اگر skill فقط باید برای عامل‌های خاصی قابل مشاهده باشد، آن را با `agents.defaults.skills` یا `agents.list[].skills` همراه کنید.
  </Accordion>

  <Accordion title="چطور می‌توانم برای کارهای مختلف از مدل‌های متفاوت استفاده کنم؟">
    الگوهای پشتیبانی‌شده امروز این‌ها هستند:

    - **کارهای Cron**: کارهای ایزوله می‌توانند برای هر کار یک بازنویسی `model` تنظیم کنند.
    - **زیرعامل‌ها**: کارها را به عامل‌های جداگانه با مدل‌های پیش‌فرض متفاوت مسیریابی کنید.
    - **تغییر درخواستی**: از `/model` برای تغییر مدل نشست فعلی در هر زمان استفاده کنید.

    ببینید [کارهای Cron](/fa/automation/cron-jobs)، [مسیریابی چندعامله](/fa/concepts/multi-agent) و [دستورهای Slash](/fa/tools/slash-commands).

  </Accordion>

  <Accordion title="بات هنگام انجام کار سنگین متوقف می‌شود. چطور آن را واگذار کنم؟">
    برای کارهای طولانی یا موازی از **زیرعامل‌ها** استفاده کنید. زیرعامل‌ها در نشست خودشان اجرا می‌شوند،
    خلاصه‌ای برمی‌گردانند و گفت‌وگوی اصلی شما را پاسخ‌گو نگه می‌دارند.

    از بات خود بخواهید «برای این کار یک زیرعامل ایجاد کند» یا از `/subagents` استفاده کنید.
    از `/status` در گفت‌وگو استفاده کنید تا ببینید Gateway همین حالا چه کاری انجام می‌دهد (و آیا مشغول است یا نه).

    نکته توکن: کارهای طولانی و زیرعامل‌ها هر دو توکن مصرف می‌کنند. اگر هزینه مهم است، یک
    مدل ارزان‌تر برای زیرعامل‌ها از طریق `agents.defaults.subagents.model` تنظیم کنید.

    مستندات: [زیرعامل‌ها](/fa/tools/subagents)، [کارهای پس‌زمینه](/fa/automation/tasks).

  </Accordion>

  <Accordion title="نشست‌های زیرعامل وابسته به رشته در Discord چگونه کار می‌کنند؟">
    از اتصال‌های رشته استفاده کنید. می‌توانید یک رشته Discord را به یک زیرعامل یا هدف نشست متصل کنید تا پیام‌های بعدی در آن رشته روی همان نشست متصل بمانند.

    جریان پایه:

    - با `sessions_spawn` و با استفاده از `thread: true` ایجاد کنید (و در صورت تمایل `mode: "session"` را برای پیگیری پایدار اضافه کنید).
    - یا به‌صورت دستی با `/focus <target>` متصل کنید.
    - برای بررسی وضعیت اتصال از `/agents` استفاده کنید.
    - برای کنترل لغو تمرکز خودکار از `/session idle <duration|off>` و `/session max-age <duration|off>` استفاده کنید.
    - برای جدا کردن رشته از `/unfocus` استفاده کنید.

    پیکربندی لازم:

    - پیش‌فرض‌های سراسری: `session.threadBindings.enabled`، `session.threadBindings.idleHours`، `session.threadBindings.maxAgeHours`.
    - بازنویسی‌های Discord: `channels.discord.threadBindings.enabled`، `channels.discord.threadBindings.idleHours`، `channels.discord.threadBindings.maxAgeHours`.
    - اتصال خودکار هنگام ایجاد: `channels.discord.threadBindings.spawnSessions` به‌طور پیش‌فرض `true` است؛ برای غیرفعال کردن ایجاد نشست‌های وابسته به رشته، آن را روی `false` بگذارید.

    مستندات: [زیرعامل‌ها](/fa/tools/subagents)، [Discord](/fa/channels/discord)، [مرجع پیکربندی](/fa/gateway/configuration-reference)، [دستورهای Slash](/fa/tools/slash-commands).

  </Accordion>

  <Accordion title="یک زیرعامل تمام شد، اما به‌روزرسانی تکمیل به جای اشتباه رفت یا هرگز ارسال نشد. چه چیزی را بررسی کنم؟">
    ابتدا مسیر درخواست‌کننده resolveشده را بررسی کنید:

    - تحویل زیرعامل در حالت تکمیل، وقتی رشته یا مسیر گفت‌وگوی متصلی وجود داشته باشد، آن را ترجیح می‌دهد.
    - اگر مبدأ تکمیل فقط یک کانال داشته باشد، OpenClaw به مسیر ذخیره‌شده نشست درخواست‌کننده (`lastChannel` / `lastTo` / `lastAccountId`) برمی‌گردد تا تحویل مستقیم همچنان بتواند موفق شود.
    - اگر نه مسیر متصل وجود داشته باشد و نه مسیر ذخیره‌شده قابل استفاده، تحویل مستقیم ممکن است شکست بخورد و نتیجه به‌جای ارسال فوری به گفت‌وگو، به تحویل صف‌شده نشست برگردد.
    - هدف‌های نامعتبر یا کهنه همچنان می‌توانند بازگشت به صف یا شکست نهایی تحویل را اجبار کنند.
    - اگر آخرین پاسخ قابل مشاهده دستیارِ فرزند دقیقاً توکن خاموش `NO_REPLY` / `no_reply`، یا دقیقاً `ANNOUNCE_SKIP` باشد، OpenClaw عمداً به‌جای ارسال پیشرفت قبلیِ کهنه، اعلام را سرکوب می‌کند.
    - اگر فرزند پس از فقط فراخوانی ابزارها timeout شود، اعلام می‌تواند آن را به یک خلاصه کوتاه از پیشرفت جزئی تبدیل کند، به‌جای اینکه خروجی خام ابزار را بازپخش کند.

    اشکال‌زدایی:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [زیرعامل‌ها](/fa/tools/subagents)، [کارهای پس‌زمینه](/fa/automation/tasks)، [ابزارهای نشست](/fa/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron یا یادآورها اجرا نمی‌شوند. چه چیزی را بررسی کنم؟">
    Cron داخل فرایند Gateway اجرا می‌شود. اگر Gateway به‌صورت پیوسته در حال اجرا نباشد،
    کارهای زمان‌بندی‌شده اجرا نمی‌شوند.

    فهرست بررسی:

    - تأیید کنید cron فعال است (`cron.enabled`) و `OPENCLAW_SKIP_CRON` تنظیم نشده است.
    - بررسی کنید Gateway به‌صورت ۲۴/۷ در حال اجراست (بدون sleep/راه‌اندازی مجدد).
    - تنظیمات منطقه زمانی کار را بررسی کنید (`--tz` در برابر منطقه زمانی میزبان).

    اشکال‌زدایی:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [خودکارسازی و کارها](/fa/automation).

  </Accordion>

  <Accordion title="Cron اجرا شد، اما چیزی به کانال ارسال نشد. چرا؟">
    ابتدا حالت تحویل را بررسی کنید:

    - `--no-deliver` / `delivery.mode: "none"` یعنی انتظار نمی‌رود runner ارسال fallback انجام دهد.
    - نبودن یا نامعتبر بودن مقصد اعلام (`channel` / `to`) یعنی runner تحویل خروجی را نادیده گرفته است.
    - شکست‌های احراز هویت کانال (`unauthorized`, `Forbidden`) یعنی runner تلاش کرده تحویل دهد، اما اعتبارنامه‌ها مانع شده‌اند.
    - یک نتیجه ایزوله بی‌صدا (فقط `NO_REPLY` / `no_reply`) عمدا غیرقابل‌تحویل در نظر گرفته می‌شود، بنابراین runner تحویل fallback صف‌شده را هم سرکوب می‌کند.

    برای کارهای cron ایزوله، agent همچنان می‌تواند وقتی مسیر چت در دسترس است، مستقیما با ابزار `message`
    ارسال کند. `--announce` فقط مسیر fallback
    runner را برای متن نهایی کنترل می‌کند که agent قبلا ارسال نکرده است.

    اشکال‌زدایی:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [وظایف پس‌زمینه](/fa/automation/tasks).

  </Accordion>

  <Accordion title="چرا یک اجرای cron ایزوله مدل را عوض کرد یا یک بار دوباره تلاش کرد؟">
    این معمولا مسیر تعویض مدل زنده است، نه زمان‌بندی تکراری.

    cron ایزوله می‌تواند یک واگذاری مدل در زمان اجرا را پایدار کند و وقتی اجرای فعال
    خطای `LiveSessionModelSwitchError` می‌دهد، دوباره تلاش کند. تلاش دوباره
    provider/model تعویض‌شده را نگه می‌دارد، و اگر تعویض شامل override پروفایل احراز هویت جدید باشد، cron
    آن را هم پیش از تلاش دوباره پایدار می‌کند.

    قواعد انتخاب مرتبط:

    - override مدل Gmail hook در صورت اعمال، ابتدا برنده می‌شود.
    - سپس `model` هر کار.
    - سپس هر override مدل ذخیره‌شده برای نشست cron.
    - سپس انتخاب عادی مدل agent/default.

    حلقه تلاش دوباره محدود است. پس از تلاش اولیه به‌علاوه ۲ تلاش دوباره برای تعویض،
    cron به‌جای حلقه بی‌پایان متوقف می‌شود.

    اشکال‌زدایی:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [CLI مربوط به cron](/fa/cli/cron).

  </Accordion>

  <Accordion title="چگونه Skills را روی Linux نصب کنم؟">
    از فرمان‌های بومی `openclaw skills` استفاده کنید یا Skills را در workspace خود قرار دهید. رابط کاربری Skills در macOS روی Linux در دسترس نیست.
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
    workspace فعال می‌نویسد. CLI جداگانه `clawhub` را فقط در صورتی نصب کنید که بخواهید Skills خودتان را منتشر یا
    همگام‌سازی کنید. برای نصب‌های مشترک بین agentها، skill را زیر
    `~/.openclaw/skills` بگذارید و اگر می‌خواهید محدود کنید کدام agentها بتوانند آن را ببینند، از
    `agents.defaults.skills` یا
    `agents.list[].skills` استفاده کنید.

  </Accordion>

  <Accordion title="آیا OpenClaw می‌تواند وظایف را طبق زمان‌بندی یا به‌صورت پیوسته در پس‌زمینه اجرا کند؟">
    بله. از زمان‌بند Gateway استفاده کنید:

    - **کارهای Cron** برای وظایف زمان‌بندی‌شده یا تکرارشونده (پس از راه‌اندازی دوباره هم باقی می‌مانند).
    - **Heartbeat** برای بررسی‌های دوره‌ای «نشست اصلی».
    - **کارهای ایزوله** برای agentهای خودکاری که خلاصه‌ها را پست می‌کنند یا به چت‌ها تحویل می‌دهند.

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [اتوماسیون و وظایف](/fa/automation)،
    [Heartbeat](/fa/gateway/heartbeat).

  </Accordion>

  <Accordion title="آیا می‌توانم Skills مخصوص Apple macOS را از Linux اجرا کنم؟">
    نه مستقیما. Skills مربوط به macOS با `metadata.openclaw.os` به‌همراه باینری‌های لازم محدود می‌شوند، و Skills فقط وقتی در system prompt ظاهر می‌شوند که روی **میزبان Gateway** واجد شرایط باشند. روی Linux، Skills فقط مخصوص `darwin` (مانند `apple-notes`، `apple-reminders`، `things-mac`) بارگذاری نمی‌شوند مگر اینکه gating را override کنید.

    سه الگوی پشتیبانی‌شده دارید:

    **گزینه A - Gateway را روی Mac اجرا کنید (ساده‌ترین).**
    Gateway را جایی اجرا کنید که باینری‌های macOS وجود دارند، سپس از Linux در [حالت remote](#gateway-ports-already-running-and-remote-mode) یا از طریق Tailscale متصل شوید. Skills به‌طور عادی بارگذاری می‌شوند، چون میزبان Gateway، macOS است.

    **گزینه B - از یک گره macOS استفاده کنید (بدون SSH).**
    Gateway را روی Linux اجرا کنید، یک گره macOS (برنامه menubar) را pair کنید، و **فرمان‌های اجرای Node** را روی Mac روی «همیشه بپرس» یا «همیشه اجازه بده» بگذارید. OpenClaw می‌تواند وقتی باینری‌های لازم روی گره وجود دارند، Skills مخصوص macOS را واجد شرایط در نظر بگیرد. agent آن Skills را از طریق ابزار `nodes` اجرا می‌کند. اگر «همیشه بپرس» را انتخاب کنید، تایید «همیشه اجازه بده» در prompt آن فرمان را به allowlist اضافه می‌کند.

    **گزینه C - باینری‌های macOS را از طریق SSH پراکسی کنید (پیشرفته).**
    Gateway را روی Linux نگه دارید، اما کاری کنید باینری‌های CLI موردنیاز به wrapperهای SSH resolve شوند که روی Mac اجرا می‌شوند. سپس skill را override کنید تا Linux را مجاز کند و واجد شرایط بماند.

    1. یک wrapper مربوط به SSH برای باینری بسازید (مثال: `memo` برای Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. wrapper را روی `PATH` میزبان Linux بگذارید (برای مثال `~/bin/memo`).
    3. metadata مربوط به skill را (در workspace یا `~/.openclaw/skills`) override کنید تا Linux مجاز شود:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. یک نشست جدید شروع کنید تا snapshot مربوط به Skills تازه‌سازی شود.

  </Accordion>

  <Accordion title="آیا integration برای Notion یا HeyGen دارید؟">
    امروز به‌صورت built-in وجود ندارد.

    گزینه‌ها:

    - **skill / Plugin سفارشی:** بهترین گزینه برای دسترسی قابل‌اعتماد به API (Notion/HeyGen هر دو API دارند).
    - **اتوماسیون مرورگر:** بدون کد کار می‌کند، اما کندتر و شکننده‌تر است.

    اگر می‌خواهید context را برای هر client نگه دارید (گردش‌کارهای آژانسی)، یک الگوی ساده این است:

    - یک صفحه Notion برای هر client (context + ترجیحات + کار فعال).
    - از agent بخواهید آن صفحه را در ابتدای نشست fetch کند.

    اگر integration بومی می‌خواهید، یک درخواست ویژگی باز کنید یا skillای
    برای آن APIها بسازید.

    نصب Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    نصب‌های بومی در دایرکتوری `skills/` مربوط به workspace فعال قرار می‌گیرند. برای Skills مشترک بین agentها، آن‌ها را در `~/.openclaw/skills/<name>/SKILL.md` قرار دهید. اگر فقط برخی agentها باید یک نصب مشترک را ببینند، `agents.defaults.skills` یا `agents.list[].skills` را پیکربندی کنید. بعضی Skills انتظار دارند باینری‌ها از طریق Homebrew نصب شده باشند؛ روی Linux یعنی Linuxbrew (مدخل FAQ مربوط به Homebrew Linux را در بالا ببینید). [Skills](/fa/tools/skills)، [پیکربندی Skills](/fa/tools/skills-config)، و [ClawHub](/fa/tools/clawhub) را ببینید.

  </Accordion>

  <Accordion title="چگونه از Chrome موجود خودم که قبلا وارد حساب شده است، با OpenClaw استفاده کنم؟">
    از پروفایل مرورگر built-in به نام `user` استفاده کنید که از طریق Chrome DevTools MCP متصل می‌شود:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    اگر نام سفارشی می‌خواهید، یک پروفایل MCP صریح بسازید:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    این مسیر می‌تواند از مرورگر میزبان local یا یک گره مرورگر متصل استفاده کند. اگر Gateway جای دیگری اجرا می‌شود، یا یک میزبان گره را روی دستگاه مرورگر اجرا کنید یا به‌جای آن از CDP راه دور استفاده کنید.

    محدودیت‌های فعلی روی `existing-session` / `user`:

    - actionها مبتنی بر ref هستند، نه مبتنی بر انتخابگر CSS
    - uploadها به `ref` / `inputRef` نیاز دارند و فعلا هر بار از یک فایل پشتیبانی می‌کنند
    - `responsebody`، export به PDF، رهگیری download، و actionهای batch همچنان به یک مرورگر managed یا پروفایل خام CDP نیاز دارند

  </Accordion>
</AccordionGroup>

## Sandboxing و حافظه

<AccordionGroup>
  <Accordion title="آیا سند اختصاصی برای sandboxing وجود دارد؟">
    بله. [Sandboxing](/fa/gateway/sandboxing) را ببینید. برای راه‌اندازی مخصوص Docker (Gateway کامل در Docker یا imageهای sandbox)، [Docker](/fa/install/docker) را ببینید.
  </Accordion>

  <Accordion title="Docker محدود به نظر می‌رسد - چگونه همه ویژگی‌ها را فعال کنم؟">
    image پیش‌فرض امنیت‌محور است و به‌عنوان کاربر `node` اجرا می‌شود، بنابراین
    شامل packageهای سیستمی، Homebrew یا مرورگرهای bundled نیست. برای راه‌اندازی کامل‌تر:

    - `/home/node` را با `OPENCLAW_HOME_VOLUME` پایدار کنید تا cacheها باقی بمانند.
    - dependencyهای سیستمی را با `OPENCLAW_DOCKER_APT_PACKAGES` در image bake کنید.
    - مرورگرهای Playwright را از طریق CLI bundled نصب کنید:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` را تنظیم کنید و مطمئن شوید مسیر پایدار می‌ماند.

    مستندات: [Docker](/fa/install/docker)، [مرورگر](/fa/tools/browser).

  </Accordion>

  <Accordion title="آیا می‌توانم DMها را شخصی نگه دارم اما groupها را با یک agent عمومی/sandboxed کنم؟">
    بله - اگر ترافیک خصوصی شما **پیام‌های مستقیم** و ترافیک عمومی شما **گروه‌ها** باشد.

    از `agents.defaults.sandbox.mode: "non-main"` استفاده کنید تا نشست‌های group/channel (کلیدهای non-main) در backend sandbox پیکربندی‌شده اجرا شوند، در حالی که نشست اصلی پیام مستقیم روی میزبان باقی می‌ماند. اگر backendی انتخاب نکنید، Docker backend پیش‌فرض است. سپس ابزارهای در دسترس در نشست‌های sandboxed را از طریق `tools.sandbox.tools` محدود کنید.

    راهنمای راه‌اندازی + نمونه پیکربندی: [گروه‌ها: پیام‌های مستقیم شخصی + گروه‌های عمومی](/fa/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع کلیدی پیکربندی: [پیکربندی Gateway](/fa/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="چگونه یک پوشه میزبان را به sandbox bind کنم؟">
    `agents.defaults.sandbox.docker.binds` را روی `["host:path:mode"]` تنظیم کنید (مثلا `"/home/user/src:/src:ro"`). bindهای global و per-agent با هم merge می‌شوند؛ bindهای per-agent وقتی `scope: "shared"` باشد نادیده گرفته می‌شوند. برای هر چیز حساس از `:ro` استفاده کنید و به یاد داشته باشید bindها دیوارهای filesystem مربوط به sandbox را دور می‌زنند.

    OpenClaw منابع bind را هم در برابر مسیر normalized و هم مسیر canonical که از طریق عمیق‌ترین ancestor موجود resolve شده است اعتبارسنجی می‌کند. یعنی escapeهای symlink-parent حتی وقتی آخرین segment مسیر هنوز وجود ندارد، همچنان fail closed می‌شوند، و بررسی‌های allowed-root همچنان پس از resolve شدن symlink اعمال می‌شوند.

    برای مثال‌ها و نکات ایمنی، [Sandboxing](/fa/gateway/sandboxing#custom-bind-mounts) و [Sandbox در برابر سیاست ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) را ببینید.

  </Accordion>

  <Accordion title="حافظه چگونه کار می‌کند؟">
    حافظه OpenClaw فقط فایل‌های Markdown در workspace مربوط به agent است:

    - یادداشت‌های روزانه در `memory/YYYY-MM-DD.md`
    - یادداشت‌های بلندمدت curated در `MEMORY.md` (فقط نشست‌های main/private)

    OpenClaw همچنین یک **flush حافظه بی‌صدا پیش از Compaction** اجرا می‌کند تا به مدل یادآوری کند
    پیش از auto-compaction یادداشت‌های پایدار بنویسد. این فقط وقتی اجرا می‌شود که workspace
    قابل نوشتن باشد (sandboxهای read-only آن را رد می‌کنند). [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>

  <Accordion title="حافظه مدام چیزها را فراموش می‌کند. چگونه آن را ماندگار کنم؟">
    از bot بخواهید **آن واقعیت را در حافظه بنویسد**. یادداشت‌های بلندمدت در `MEMORY.md`
    قرار می‌گیرند، context کوتاه‌مدت در `memory/YYYY-MM-DD.md`.

    این هنوز بخشی است که در حال بهبود آن هستیم. یادآوری به مدل برای ذخیره خاطره‌ها کمک می‌کند؛
    خودش می‌داند چه کار کند. اگر همچنان فراموش می‌کند، بررسی کنید Gateway در هر اجرا از همان
    workspace استفاده می‌کند.

    مستندات: [حافظه](/fa/concepts/memory)، [workspace مربوط به Agent](/fa/concepts/agent-workspace).

  </Accordion>

  <Accordion title="آیا حافظه برای همیشه باقی می‌ماند؟ محدودیت‌ها چیست؟">
    فایل‌های حافظه روی disk زندگی می‌کنند و تا وقتی حذفشان نکنید باقی می‌مانند. محدودیت، فضای
    ذخیره‌سازی شماست، نه مدل. **context نشست** همچنان توسط پنجره context مدل
    محدود است، بنابراین گفتگوهای طولانی می‌توانند compact یا truncate شوند. به همین دلیل
    جست‌وجوی حافظه وجود دارد - فقط بخش‌های مرتبط را دوباره به context برمی‌گرداند.

    مستندات: [حافظه](/fa/concepts/memory)، [Context](/fa/concepts/context).

  </Accordion>

  <Accordion title="آیا جست‌وجوی معنایی حافظه به کلید API OpenAI نیاز دارد؟">
    فقط اگر از **تعبیه‌سازی‌های OpenAI** استفاده کنید. Codex OAuth چت/تکمیل‌ها را پوشش می‌دهد و
    دسترسی به تعبیه‌سازی‌ها را **نمی‌دهد**، بنابراین **ورود با Codex (OAuth یا
    ورود Codex CLI)** برای جست‌وجوی معنایی حافظه کمکی نمی‌کند. تعبیه‌سازی‌های OpenAI
    همچنان به یک کلید API واقعی نیاز دارند (`OPENAI_API_KEY` یا `models.providers.openai.apiKey`).

    اگر یک ارائه‌دهنده را صراحتا تنظیم نکنید، OpenClaw زمانی که بتواند
    یک کلید API را پیدا کند، به‌صورت خودکار یک ارائه‌دهنده انتخاب می‌کند (پروفایل‌های احراز هویت، `models.providers.*.apiKey`، یا متغیرهای محیطی).
    اگر کلید OpenAI پیدا شود، OpenAI را ترجیح می‌دهد؛ در غیر این صورت اگر کلید Gemini
    پیدا شود Gemini، سپس Voyage، سپس Mistral را انتخاب می‌کند. اگر هیچ کلید راه‌دوری در دسترس نباشد، جست‌وجوی
    حافظه تا زمانی که آن را پیکربندی کنید غیرفعال می‌ماند. اگر یک مسیر مدل محلی
    پیکربندی‌شده و موجود داشته باشید، OpenClaw
    `local` را ترجیح می‌دهد. Ollama زمانی پشتیبانی می‌شود که صراحتا
    `memorySearch.provider = "ollama"` را تنظیم کنید.

    اگر ترجیح می‌دهید محلی بمانید، `memorySearch.provider = "local"` را تنظیم کنید (و در صورت تمایل
    `memorySearch.fallback = "none"`). اگر تعبیه‌سازی‌های Gemini را می‌خواهید،
    `memorySearch.provider = "gemini"` را تنظیم کنید و `GEMINI_API_KEY` (یا
    `memorySearch.remote.apiKey`) را ارائه دهید. ما از مدل‌های تعبیه‌سازی **OpenAI، Gemini، Voyage، Mistral، Ollama، یا local** پشتیبانی می‌کنیم
    - برای جزئیات راه‌اندازی، [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>
</AccordionGroup>

## چیزها روی دیسک کجا قرار دارند

<AccordionGroup>
  <Accordion title="آیا همه داده‌هایی که با OpenClaw استفاده می‌شوند به‌صورت محلی ذخیره می‌شوند؟">
    خیر - **وضعیت OpenClaw محلی است**، اما **سرویس‌های خارجی همچنان آنچه را برایشان می‌فرستید می‌بینند**.

    - **به‌صورت پیش‌فرض محلی:** نشست‌ها، فایل‌های حافظه، پیکربندی، و فضای کاری روی میزبان Gateway قرار دارند
      (`~/.openclaw` + دایرکتوری فضای کاری شما).
    - **به‌ناچار راه‌دور:** پیام‌هایی که به ارائه‌دهندگان مدل (Anthropic/OpenAI/و غیره) می‌فرستید به
      APIهای آن‌ها می‌روند، و پلتفرم‌های چت (WhatsApp/Telegram/Slack/و غیره) داده‌های پیام را روی
      سرورهای خودشان ذخیره می‌کنند.
    - **شما محدوده اثر را کنترل می‌کنید:** استفاده از مدل‌های محلی promptها را روی دستگاه شما نگه می‌دارد، اما ترافیک
      کانال همچنان از سرورهای همان کانال عبور می‌کند.

    مرتبط: [فضای کاری عامل](/fa/concepts/agent-workspace)، [حافظه](/fa/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw داده‌هایش را کجا ذخیره می‌کند؟">
    همه چیز زیر `$OPENCLAW_STATE_DIR` قرار دارد (پیش‌فرض: `~/.openclaw`):

    | مسیر                                                            | هدف                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | پیکربندی اصلی (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | واردسازی OAuth قدیمی (در اولین استفاده در پروفایل‌های احراز هویت کپی می‌شود)       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | پروفایل‌های احراز هویت (OAuth، کلیدهای API، و `keyRef`/`tokenRef` اختیاری)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | payload اختیاری secret با پشتوانه فایل برای ارائه‌دهندگان SecretRef از نوع `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | فایل سازگاری قدیمی (ورودی‌های ثابت `api_key` پاک‌سازی شده‌اند)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | وضعیت ارائه‌دهنده (مثلا `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | وضعیت برای هر عامل (agentDir + نشست‌ها)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | تاریخچه و وضعیت مکالمه (برای هر عامل)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | فراداده نشست (برای هر عامل)                                       |

    مسیر قدیمی تک‌عاملی: `~/.openclaw/agent/*` (با `openclaw doctor` مهاجرت داده می‌شود).

    **فضای کاری** شما (AGENTS.md، فایل‌های حافظه، Skills، و غیره) جدا است و از طریق `agents.defaults.workspace` پیکربندی می‌شود (پیش‌فرض: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md باید کجا قرار داشته باشند؟">
    این فایل‌ها در **فضای کاری عامل** قرار دارند، نه `~/.openclaw`.

    - **فضای کاری (برای هر عامل)**: `AGENTS.md`، `SOUL.md`، `IDENTITY.md`، `USER.md`,
      `MEMORY.md`، `memory/YYYY-MM-DD.md`، و `HEARTBEAT.md` اختیاری.
      `memory.md` ریشه با حروف کوچک فقط ورودی تعمیر قدیمی است؛ `openclaw doctor --fix`
      وقتی هر دو فایل وجود داشته باشند می‌تواند آن را در `MEMORY.md` ادغام کند.
    - **دایرکتوری وضعیت (`~/.openclaw`)**: پیکربندی، وضعیت کانال/ارائه‌دهنده، پروفایل‌های احراز هویت، نشست‌ها، لاگ‌ها،
      و Skills مشترک (`~/.openclaw/skills`).

    فضای کاری پیش‌فرض `~/.openclaw/workspace` است و از این طریق قابل پیکربندی است:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    اگر bot پس از راه‌اندازی مجدد «فراموش» می‌کند، تایید کنید Gateway در هر بار اجرا از همان
    فضای کاری استفاده می‌کند (و به خاطر داشته باشید: حالت راه‌دور از فضای کاری **میزبان gateway**
    استفاده می‌کند، نه لپ‌تاپ محلی شما).

    نکته: اگر یک رفتار یا ترجیح پایدار می‌خواهید، از bot بخواهید آن را **در
    AGENTS.md یا MEMORY.md بنویسد** به‌جای اینکه به تاریخچه چت تکیه کنید.

    [فضای کاری عامل](/fa/concepts/agent-workspace) و [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>

  <Accordion title="راهبرد پشتیبان‌گیری پیشنهادی">
    **فضای کاری عامل** خود را در یک مخزن git **خصوصی** قرار دهید و از آن در جایی
    خصوصی پشتیبان بگیرید (برای مثال GitHub خصوصی). این کار حافظه + فایل‌های AGENTS/SOUL/USER
    را پوشش می‌دهد، و به شما اجازه می‌دهد بعدا «ذهن» دستیار را بازیابی کنید.

    هیچ چیزی را زیر `~/.openclaw` commit نکنید (اعتبارنامه‌ها، نشست‌ها، tokenها، یا payloadهای secrets رمزگذاری‌شده).
    اگر به بازیابی کامل نیاز دارید، هم از فضای کاری و هم از دایرکتوری وضعیت
    جداگانه پشتیبان بگیرید (پرسش مهاجرت بالا را ببینید).

    مستندات: [فضای کاری عامل](/fa/concepts/agent-workspace).

  </Accordion>

  <Accordion title="چگونه OpenClaw را به‌طور کامل حذف نصب کنم؟">
    راهنمای اختصاصی را ببینید: [حذف نصب](/fa/install/uninstall).
  </Accordion>

  <Accordion title="آیا عامل‌ها می‌توانند خارج از فضای کاری کار کنند؟">
    بله. فضای کاری **cwd پیش‌فرض** و تکیه‌گاه حافظه است، نه یک sandbox سخت.
    مسیرهای نسبی داخل فضای کاری resolve می‌شوند، اما مسیرهای مطلق می‌توانند به مکان‌های دیگر
    میزبان دسترسی داشته باشند مگر اینکه sandboxing فعال باشد. اگر به جداسازی نیاز دارید، از
    [`agents.defaults.sandbox`](/fa/gateway/sandboxing) یا تنظیمات sandbox برای هر عامل استفاده کنید. اگر
    می‌خواهید یک مخزن دایرکتوری کاری پیش‌فرض باشد، `workspace` همان عامل را به ریشه مخزن
    اشاره دهید. مخزن OpenClaw فقط کد منبع است؛ فضای کاری را جدا نگه دارید
    مگر اینکه عمدا بخواهید عامل داخل آن کار کند.

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

  <Accordion title="حالت راه‌دور: انبار نشست کجاست؟">
    وضعیت نشست متعلق به **میزبان gateway** است. اگر در حالت راه‌دور هستید، انبار نشستی که برای شما مهم است روی دستگاه راه‌دور قرار دارد، نه لپ‌تاپ محلی شما. [مدیریت نشست](/fa/concepts/session) را ببینید.
  </Accordion>
</AccordionGroup>

## مبانی پیکربندی

<AccordionGroup>
  <Accordion title="قالب پیکربندی چیست؟ کجا قرار دارد؟">
    OpenClaw یک پیکربندی **JSON5** اختیاری را از `$OPENCLAW_CONFIG_PATH` می‌خواند (پیش‌فرض: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    اگر فایل وجود نداشته باشد، از پیش‌فرض‌های نسبتا امن استفاده می‌کند (از جمله فضای کاری پیش‌فرض `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='من gateway.bind: "lan" (یا "tailnet") را تنظیم کردم و حالا هیچ چیزی گوش نمی‌دهد / UI می‌گوید غیرمجاز'>
    bindهای غیر local loopback **به یک مسیر احراز هویت معتبر gateway نیاز دارند**. در عمل یعنی:

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

    - `gateway.remote.token` / `.password` به‌تنهایی احراز هویت gateway محلی را فعال نمی‌کنند.
    - مسیرهای فراخوانی محلی فقط وقتی `gateway.auth.*` تنظیم نشده باشد می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند.
    - برای احراز هویت با password، به‌جای آن `gateway.auth.mode: "password"` به‌علاوه `gateway.auth.password` (یا `OPENCLAW_GATEWAY_PASSWORD`) را تنظیم کنید.
    - اگر `gateway.auth.token` / `gateway.auth.password` صراحتا از طریق SecretRef پیکربندی شده و resolve نشده باشد، resolve به‌صورت بسته شکست می‌خورد (بدون پوشاندن با fallback راه‌دور).
    - راه‌اندازی‌های Control UI با shared-secret از طریق `connect.params.auth.token` یا `connect.params.auth.password` (ذخیره‌شده در تنظیمات app/UI) احراز هویت می‌کنند. حالت‌های دارای هویت مانند Tailscale Serve یا `trusted-proxy` به‌جای آن از headerهای درخواست استفاده می‌کنند. از قرار دادن shared secretها در URLها خودداری کنید.
    - با `gateway.auth.mode: "trusted-proxy"`، reverse proxyهای loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح و یک ورودی loopback در `gateway.trustedProxies` نیاز دارند.

  </Accordion>

  <Accordion title="چرا حالا روی localhost به token نیاز دارم؟">
    OpenClaw احراز هویت gateway را به‌صورت پیش‌فرض اعمال می‌کند، از جمله loopback. در مسیر پیش‌فرض عادی یعنی احراز هویت token: اگر هیچ مسیر احراز هویت صریحی پیکربندی نشده باشد، راه‌اندازی gateway به حالت token resolve می‌شود و به‌صورت خودکار یکی تولید می‌کند و آن را در `gateway.auth.token` ذخیره می‌کند، بنابراین **کلاینت‌های WS محلی باید احراز هویت کنند**. این کار جلوی فراخوانی Gateway توسط فرایندهای محلی دیگر را می‌گیرد.

    اگر مسیر احراز هویت دیگری را ترجیح می‌دهید، می‌توانید صراحتا حالت password را انتخاب کنید (یا برای reverse proxyهای آگاه از هویت، `trusted-proxy`). اگر **واقعا** loopback باز می‌خواهید، `gateway.auth.mode: "none"` را صراحتا در پیکربندی خود تنظیم کنید. Doctor هر زمان می‌تواند برای شما یک token تولید کند: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="آیا بعد از تغییر پیکربندی باید restart کنم؟">
    Gateway پیکربندی را watch می‌کند و از hot-reload پشتیبانی می‌کند:

    - `gateway.reload.mode: "hybrid"` (پیش‌فرض): تغییرات امن را hot-apply می‌کند، برای تغییرات بحرانی restart می‌کند
    - `hot`، `restart`، `off` نیز پشتیبانی می‌شوند

  </Accordion>

  <Accordion title="چگونه شعارهای بامزه CLI را غیرفعال کنم؟">
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

    - `off`: متن شعار را پنهان می‌کند اما خط عنوان/نسخه بنر را نگه می‌دارد.
    - `default`: هر بار از `All your chats, one OpenClaw.` استفاده می‌کند.
    - `random`: شعارهای بامزه/فصلی چرخشی (رفتار پیش‌فرض).
    - اگر اصلا بنر نمی‌خواهید، env `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

  </Accordion>

  <Accordion title="چگونه جست‌وجوی وب (و fetch وب) را فعال کنم؟">
    `web_fetch` بدون کلید API کار می‌کند. `web_search` به ارائه‌دهنده انتخاب‌شده شما
    بستگی دارد:

    - ارائه‌دهندگان دارای پشتوانه API مانند Brave، Exa، Firecrawl، Gemini، Grok، Kimi، MiniMax Search، Perplexity، و Tavily به راه‌اندازی معمول کلید API خود نیاز دارند.
    - Ollama Web Search بدون کلید است، اما از میزبان Ollama پیکربندی‌شده شما استفاده می‌کند و به `ollama signin` نیاز دارد.
    - DuckDuckGo بدون کلید است، اما یک integration غیررسمی مبتنی بر HTML است.
    - SearXNG بدون کلید/خودمیزبان است؛ `SEARXNG_BASE_URL` یا `plugins.entries.searxng.config.webSearch.baseUrl` را پیکربندی کنید.

    **پیشنهاد‌شده:** `openclaw configure --section web` را اجرا کنید و یک ارائه‌دهنده انتخاب کنید.
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

    پیکربندی جست‌وجوی وب مخصوص ارائه‌دهنده اکنون زیر `plugins.entries.<plugin>.config.webSearch.*` قرار دارد.
    مسیرهای ارائه‌دهندهٔ قدیمی `tools.web.search.*` هنوز موقتاً برای سازگاری بارگذاری می‌شوند، اما نباید برای پیکربندی‌های جدید استفاده شوند.
    پیکربندی fallback واکشی وب Firecrawl زیر `plugins.entries.firecrawl.config.webFetch.*` قرار دارد.

    نکته‌ها:

    - اگر از allowlist استفاده می‌کنید، `web_search`/`web_fetch`/`x_search` یا `group:web` را اضافه کنید.
    - `web_fetch` به‌طور پیش‌فرض فعال است، مگر اینکه صراحتاً غیرفعال شده باشد.
    - اگر `tools.web.fetch.provider` حذف شود، OpenClaw نخستین ارائه‌دهندهٔ fallback آماده برای واکشی را از اعتبارنامه‌های موجود به‌صورت خودکار تشخیص می‌دهد. در حال حاضر ارائه‌دهندهٔ bundled، Firecrawl است.
    - daemonها متغیرهای محیطی را از `~/.openclaw/.env` یا محیط سرویس می‌خوانند.

    مستندات: [ابزارهای وب](/fa/tools/web).

  </Accordion>

  <Accordion title="config.apply پیکربندی من را پاک کرد. چگونه بازیابی کنم و جلوی تکرار آن را بگیرم؟">
    `config.apply` **کل پیکربندی** را جایگزین می‌کند. اگر یک شیء ناقص بفرستید، همهٔ
    موارد دیگر حذف می‌شوند.

    نسخهٔ فعلی OpenClaw از بسیاری از بازنویسی‌های تصادفی جلوگیری می‌کند:

    - نوشتن‌های پیکربندیِ تحت مالکیت OpenClaw، کل پیکربندی پس از تغییر را پیش از نوشتن اعتبارسنجی می‌کنند.
    - نوشتن‌های نامعتبر یا مخربِ تحت مالکیت OpenClaw رد می‌شوند و با نام `openclaw.json.rejected.*` ذخیره می‌شوند.
    - اگر یک ویرایش مستقیم باعث خرابی startup یا hot reload شود، Gateway آخرین پیکربندی سالم شناخته‌شده را بازیابی می‌کند و فایل ردشده را با نام `openclaw.json.clobbered.*` ذخیره می‌کند.
    - agent اصلی پس از بازیابی یک هشدار boot دریافت می‌کند تا دوباره کورکورانه پیکربندی خراب را ننویسد.

    بازیابی:

    - در `openclaw logs --follow` به‌دنبال `Config auto-restored from last-known-good`، `Config write rejected:`، یا `config reload restored last-known-good config` بگردید.
    - جدیدترین `openclaw.json.clobbered.*` یا `openclaw.json.rejected.*` را کنار پیکربندی فعال بررسی کنید.
    - اگر پیکربندی فعال بازیابی‌شده کار می‌کند، آن را نگه دارید، سپس فقط کلیدهای موردنظر را با `openclaw config set` یا `config.patch` برگردانید.
    - `openclaw config validate` و `openclaw doctor` را اجرا کنید.
    - اگر آخرین پیکربندی سالم شناخته‌شده یا payload ردشده ندارید، از نسخهٔ پشتیبان بازیابی کنید، یا دوباره `openclaw doctor` را اجرا کنید و channelها/modelها را دوباره پیکربندی کنید.
    - اگر این اتفاق غیرمنتظره بود، یک bug ثبت کنید و آخرین پیکربندی شناخته‌شده یا هر نسخهٔ پشتیبان خود را ضمیمه کنید.
    - یک agent کدنویسی محلی اغلب می‌تواند از روی logها یا history یک پیکربندی قابل‌کار بازسازی کند.

    پیشگیری:

    - برای تغییرات کوچک از `openclaw config set` استفاده کنید.
    - برای ویرایش‌های تعاملی از `openclaw configure` استفاده کنید.
    - وقتی از مسیر دقیق یا شکل field مطمئن نیستید، ابتدا از `config.schema.lookup` استفاده کنید؛ این دستور یک schema node کم‌عمق همراه با خلاصه‌های فوری فرزندان را برای بررسی مرحله‌به‌مرحله برمی‌گرداند.
    - برای ویرایش‌های جزئی RPC از `config.patch` استفاده کنید؛ `config.apply` را فقط برای جایگزینی کامل پیکربندی نگه دارید.
    - اگر از ابزار owner-only `gateway` از داخل یک اجرای agent استفاده می‌کنید، همچنان نوشتن در `tools.exec.ask` / `tools.exec.security` را رد می‌کند، از جمله aliasهای قدیمی `tools.bash.*` که به همان مسیرهای exec محافظت‌شده normalize می‌شوند.

    مستندات: [پیکربندی](/fa/cli/config)، [پیکربندی تعاملی](/fa/cli/configure)، [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-restored-last-known-good-config)، [Doctor](/fa/gateway/doctor).

  </Accordion>

  <Accordion title="چگونه یک Gateway مرکزی با workerهای تخصصی در چند دستگاه اجرا کنم؟">
    الگوی رایج **یک Gateway**، برای مثال Raspberry Pi، به‌همراه **Nodeها** و **agentها** است:

    - **Gateway (مرکزی):** مالک channelها (Signal/WhatsApp)، routing، و sessionها است.
    - **Nodeها (دستگاه‌ها):** Mac/iOS/Android به‌عنوان peripheral وصل می‌شوند و ابزارهای محلی (`system.run`، `canvas`، `camera`) را در دسترس می‌گذارند.
    - **agentها (workerها):** brain/workspaceهای جداگانه برای نقش‌های ویژه، برای مثال "Hetzner ops" و "Personal data".
    - **sub-agentها:** وقتی parallelism می‌خواهید، کار پس‌زمینه را از یک agent اصلی spawn کنید.
    - **TUI:** به Gateway وصل شوید و بین agentها/sessionها جابه‌جا شوید.

    مستندات: [Nodeها](/fa/nodes)، [دسترسی راه‌دور](/fa/gateway/remote)، [Multi-Agent Routing](/fa/concepts/multi-agent)، [sub-agentها](/fa/tools/subagents)، [TUI](/fa/web/tui).

  </Accordion>

  <Accordion title="آیا مرورگر OpenClaw می‌تواند به‌صورت headless اجرا شود؟">
    بله. این یک گزینهٔ پیکربندی است:

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

    مقدار پیش‌فرض `false` است، یعنی با پنجرهٔ قابل‌مشاهده. حالت headless در برخی سایت‌ها احتمال بیشتری دارد که بررسی‌های ضدربات را فعال کند. [مرورگر](/fa/tools/browser) را ببینید.

    حالت headless از **همان موتور Chromium** استفاده می‌کند و برای بیشتر automationها مانند formها، clickها، scraping و loginها کار می‌کند. تفاوت‌های اصلی:

    - پنجرهٔ مرورگر قابل‌مشاهده‌ای وجود ندارد؛ اگر به تصویر نیاز دارید از screenshot استفاده کنید.
    - برخی سایت‌ها در حالت headless نسبت به automation سخت‌گیرترند، مانند CAPTCHAها و ضدربات.
      برای مثال، X/Twitter اغلب sessionهای headless را مسدود می‌کند.

  </Accordion>

  <Accordion title="چگونه از Brave برای کنترل مرورگر استفاده کنم؟">
    `browser.executablePath` را روی binary مربوط به Brave یا هر مرورگر مبتنی بر Chromium تنظیم کنید و Gateway را restart کنید.
    نمونه‌های کامل پیکربندی را در [مرورگر](/fa/tools/browser#use-brave-or-another-chromium-based-browser) ببینید.
  </Accordion>
</AccordionGroup>

## Gatewayها و Nodeهای راه‌دور

<AccordionGroup>
  <Accordion title="commandها چگونه بین Telegram، gateway و Nodeها منتقل می‌شوند؟">
    پیام‌های Telegram توسط **gateway** مدیریت می‌شوند. gateway، agent را اجرا می‌کند و
    فقط وقتی به ابزار Node نیاز باشد، از طریق **Gateway WebSocket** با Nodeها تماس می‌گیرد:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodeها ترافیک ورودی provider را نمی‌بینند؛ فقط callهای RPC مربوط به Node را دریافت می‌کنند.

  </Accordion>

  <Accordion title="اگر Gateway از راه دور میزبانی شود، agent من چگونه می‌تواند به کامپیوترم دسترسی پیدا کند؟">
    پاسخ کوتاه: **کامپیوتر خود را به‌عنوان یک Node pair کنید**. Gateway در جای دیگری اجرا می‌شود، اما می‌تواند
    ابزارهای `node.*` مانند screen، camera و system را از طریق Gateway WebSocket روی ماشین محلی شما فراخوانی کند.

    راه‌اندازی معمول:

    1. Gateway را روی host همیشه‌روشن، مانند VPS یا home server، اجرا کنید.
    2. host Gateway و کامپیوتر خود را در یک tailnet قرار دهید.
    3. مطمئن شوید Gateway WS در دسترس است، از طریق bind روی tailnet یا SSH tunnel.
    4. برنامهٔ macOS را به‌صورت محلی باز کنید و در حالت **Remote over SSH** یا direct tailnet وصل شوید
       تا بتواند به‌عنوان Node ثبت شود.
    5. Node را روی Gateway تأیید کنید:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    bridge جداگانهٔ TCP لازم نیست؛ Nodeها از طریق Gateway WebSocket وصل می‌شوند.

    یادآوری امنیتی: pair کردن یک Node macOS اجازهٔ اجرای `system.run` روی آن ماشین را می‌دهد. فقط
    دستگاه‌هایی را pair کنید که به آن‌ها اعتماد دارید، و [امنیت](/fa/gateway/security) را مرور کنید.

    مستندات: [Nodeها](/fa/nodes)، [پروتکل Gateway](/fa/gateway/protocol)، [حالت راه‌دور macOS](/fa/platforms/mac/remote)، [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="Tailscale وصل است اما پاسخی نمی‌گیرم. حالا چه کار کنم؟">
    موارد پایه را بررسی کنید:

    - Gateway در حال اجرا است: `openclaw gateway status`
    - سلامت Gateway: `openclaw status`
    - سلامت channel: `openclaw channels status`

    سپس auth و routing را بررسی کنید:

    - اگر از Tailscale Serve استفاده می‌کنید، مطمئن شوید `gateway.auth.allowTailscale` درست تنظیم شده است.
    - اگر از طریق SSH tunnel وصل می‌شوید، تأیید کنید tunnel محلی برقرار است و به port درست اشاره می‌کند.
    - تأیید کنید allowlistهای شما، چه DM چه group، شامل account شما هستند.

    مستندات: [Tailscale](/fa/gateway/tailscale)، [دسترسی راه‌دور](/fa/gateway/remote)، [channelها](/fa/channels).

  </Accordion>

  <Accordion title="آیا دو instance از OpenClaw می‌توانند با هم صحبت کنند، مثلاً local + VPS؟">
    بله. bridge داخلی "bot-to-bot" وجود ندارد، اما می‌توانید آن را به چند روش
    قابل‌اعتماد وصل کنید:

    **ساده‌ترین:** از یک channel گفت‌وگوی عادی استفاده کنید که هر دو bot به آن دسترسی دارند، مانند Telegram/Slack/WhatsApp.
    کاری کنید Bot A پیامی به Bot B بفرستد، سپس اجازه دهید Bot B مثل معمول پاسخ دهد.

    **bridge از طریق CLI (عمومی):** اسکریپتی اجرا کنید که Gateway دیگر را با
    `openclaw agent --message ... --deliver` فراخوانی کند، و chatی را هدف بگیرد که bot دیگر
    در آن گوش می‌دهد. اگر یک bot روی VPS راه‌دور است، CLI خود را از طریق SSH/Tailscale به آن Gateway راه‌دور
    متصل کنید؛ [دسترسی راه‌دور](/fa/gateway/remote) را ببینید.

    الگوی نمونه، از ماشینی اجرا شود که به Gateway هدف دسترسی دارد:

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نکته: یک guardrail اضافه کنید تا دو bot بی‌پایان loop نکنند، مانند mention-only، allowlistهای channel،
    یا قانون "به پیام‌های bot پاسخ نده".

    مستندات: [دسترسی راه‌دور](/fa/gateway/remote)، [CLI agent](/fa/cli/agent)، [ارسال با agent](/fa/tools/agent-send).

  </Accordion>

  <Accordion title="آیا برای چند agent به VPSهای جداگانه نیاز دارم؟">
    خیر. یک Gateway می‌تواند چند agent را میزبانی کند، هرکدام با workspace، model defaultها،
    و routing مخصوص خود. این راه‌اندازی معمول است و بسیار ارزان‌تر و ساده‌تر از اجرای
    یک VPS برای هر agent است.

    فقط زمانی از VPSهای جداگانه استفاده کنید که به isolation سخت، مانند مرزهای امنیتی، یا
    پیکربندی‌های بسیار متفاوت نیاز دارید که نمی‌خواهید مشترک باشند. در غیر این صورت، یک Gateway نگه دارید و
    از چند agent یا sub-agent استفاده کنید.

  </Accordion>

  <Accordion title="آیا استفاده از یک Node روی laptop شخصی‌ام به‌جای SSH از یک VPS مزیتی دارد؟">
    بله - Nodeها روش first-class برای دسترسی به laptop شما از یک Gateway راه‌دور هستند و
    چیزی فراتر از دسترسی shell فراهم می‌کنند. Gateway روی macOS/Linux و Windows از طریق WSL2 اجرا می‌شود و
    سبک است؛ یک VPS کوچک یا دستگاهی در حد Raspberry Pi کافی است و 4 GB RAM کاملاً مناسب است. بنابراین یک
    راه‌اندازی رایج شامل یک host همیشه‌روشن به‌همراه laptop شما به‌عنوان Node است.

    - **SSH ورودی لازم نیست.** Nodeها به Gateway WebSocket وصل می‌شوند و از device pairing استفاده می‌کنند.
    - **کنترل‌های اجرای امن‌تر.** `system.run` با allowlistها/approvalهای Node روی همان laptop کنترل می‌شود.
    - **ابزارهای دستگاه بیشتر.** Nodeها علاوه بر `system.run`، `canvas`، `camera` و `screen` را در دسترس می‌گذارند.
    - **automation مرورگر محلی.** Gateway را روی VPS نگه دارید، اما Chrome را به‌صورت محلی از طریق یک host Node روی laptop اجرا کنید، یا از طریق Chrome MCP به Chrome محلی روی host وصل شوید.

    SSH برای دسترسی shell موردی مناسب است، اما Nodeها برای workflowهای مداوم agent و
    automation دستگاه ساده‌ترند.

    مستندات: [Nodeها](/fa/nodes)، [CLI Nodeها](/fa/cli/nodes)، [مرورگر](/fa/tools/browser).

  </Accordion>

  <Accordion title="آیا Nodeها یک سرویس gateway اجرا می‌کنند؟">
    خیر. مگر اینکه عمداً profileهای ایزوله اجرا کنید، روی هر host فقط باید **یک gateway** اجرا شود؛ [چند Gateway](/fa/gateway/multiple-gateways) را ببینید. Nodeها peripheralهایی هستند که به gateway وصل می‌شوند
    مانند Nodeهای iOS/Android، یا حالت "node mode" در برنامهٔ menubar macOS. برای hostهای Node بدون رابط گرافیکی
    و کنترل از طریق CLI، [CLI میزبان Node](/fa/cli/node) را ببینید.

    برای تغییرات `gateway`، `discovery` و `canvasHost` یک restart کامل لازم است.

  </Accordion>

  <Accordion title="آیا راه API / RPC برای اعمال پیکربندی وجود دارد؟">
    بله.

    - `config.schema.lookup`: پیش از نوشتن، یک زیرشاخهٔ پیکربندی را همراه با schema node کم‌عمق، راهنمای UI matched، و خلاصه‌های فوری فرزندان بررسی کنید
    - `config.get`: snapshot فعلی + hash را دریافت کنید
    - `config.patch`: به‌روزرسانی جزئی امن، گزینهٔ ترجیحی برای بیشتر ویرایش‌های RPC؛ وقتی ممکن باشد hot-reload می‌کند و وقتی لازم باشد restart می‌کند
    - `config.apply`: اعتبارسنجی + جایگزینی کامل پیکربندی؛ وقتی ممکن باشد hot-reload می‌کند و وقتی لازم باشد restart می‌کند
    - ابزار runtime owner-only `gateway` همچنان از بازنویسی `tools.exec.ask` / `tools.exec.security` خودداری می‌کند؛ aliasهای قدیمی `tools.bash.*` به همان مسیرهای exec محافظت‌شده normalize می‌شوند

  </Accordion>

  <Accordion title="پیکربندی حداقلی معقول برای اولین نصب">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    این کار فضای کاری شما را تنظیم می‌کند و محدود می‌کند چه کسانی می‌توانند ربات را فعال کنند.

  </Accordion>

  <Accordion title="چگونه Tailscale را روی یک VPS راه‌اندازی کنم و از Mac وصل شوم؟">
    مراحل حداقلی:

    1. **نصب + ورود روی VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **نصب + ورود روی Mac**
       - از برنامه Tailscale استفاده کنید و به همان tailnet وارد شوید.
    3. **فعال‌سازی MagicDNS (توصیه‌شده)**
       - در کنسول مدیریتی Tailscale، MagicDNS را فعال کنید تا VPS یک نام پایدار داشته باشد.
    4. **استفاده از نام میزبان tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    اگر Control UI را بدون SSH می‌خواهید، از Tailscale Serve روی VPS استفاده کنید:

    ```bash
    openclaw gateway --tailscale serve
    ```

    این کار Gateway را به loopback مقید نگه می‌دارد و HTTPS را از طریق Tailscale در دسترس قرار می‌دهد. [Tailscale](/fa/gateway/tailscale) را ببینید.

  </Accordion>

  <Accordion title="چگونه یک Node مک را به یک Gateway راه‌دور (Tailscale Serve) وصل کنم؟">
    Serve، **Gateway Control UI + WS** را در دسترس قرار می‌دهد. Nodeها از طریق همان نقطه پایانی Gateway WS وصل می‌شوند.

    راه‌اندازی پیشنهادی:

    1. **مطمئن شوید VPS + Mac روی یک tailnet هستند**.
    2. **از برنامه macOS در حالت راه‌دور استفاده کنید** (هدف SSH می‌تواند نام میزبان tailnet باشد).
       برنامه پورت Gateway را تونل می‌کند و به‌عنوان یک Node وصل می‌شود.
    3. **Node را روی Gateway تأیید کنید**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    مستندات: [پروتکل Gateway](/fa/gateway/protocol)، [کشف](/fa/gateway/discovery)، [حالت راه‌دور macOS](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="آیا باید روی یک لپ‌تاپ دوم نصب کنم یا فقط یک Node اضافه کنم؟">
    اگر فقط به **ابزارهای محلی** (صفحه‌نمایش/دوربین/exec) روی لپ‌تاپ دوم نیاز دارید، آن را به‌عنوان یک
    **Node** اضافه کنید. این کار یک Gateway واحد را حفظ می‌کند و از پیکربندی تکراری جلوگیری می‌کند. ابزارهای محلی Node
    در حال حاضر فقط برای macOS هستند، اما قصد داریم آن‌ها را به سیستم‌عامل‌های دیگر هم گسترش دهیم.

    فقط زمانی یک Gateway دوم نصب کنید که به **جداسازی سخت‌گیرانه** یا دو ربات کاملاً جدا نیاز دارید.

    مستندات: [Nodeها](/fa/nodes)، [CLI Nodeها](/fa/cli/nodes)، [چند Gateway](/fa/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغیرهای محیطی و بارگذاری .env

<AccordionGroup>
  <Accordion title="OpenClaw چگونه متغیرهای محیطی را بارگذاری می‌کند؟">
    OpenClaw متغیرهای محیطی را از فرایند والد (shell، launchd/systemd، CI، و غیره) می‌خواند و همچنین این موارد را بارگذاری می‌کند:

    - `.env` از دایرکتوری کاری فعلی
    - یک `.env` پشتیبان سراسری از `~/.openclaw/.env` (یا همان `$OPENCLAW_STATE_DIR/.env`)

    هیچ‌کدام از فایل‌های `.env` متغیرهای محیطی موجود را بازنویسی نمی‌کنند.

    همچنین می‌توانید متغیرهای محیطی inline را در پیکربندی تعریف کنید (فقط اگر در env فرایند وجود نداشته باشند اعمال می‌شوند):

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

    1. کلیدهای گمشده را در `~/.openclaw/.env` بگذارید تا حتی وقتی سرویس env شل شما را به ارث نمی‌برد هم برداشته شوند.
    2. وارد کردن از شل را فعال کنید (سهولت opt-in):

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

    این کار شل ورود شما را اجرا می‌کند و فقط کلیدهای مورد انتظارِ گمشده را وارد می‌کند (هرگز بازنویسی نمی‌کند). معادل‌های متغیر محیطی:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN را تنظیم کردم، اما وضعیت مدل‌ها "Shell env: off." نشان می‌دهد. چرا؟'>
    `openclaw models status` گزارش می‌دهد که آیا **وارد کردن env از شل** فعال است یا نه. "Shell env: off"
    به این معنی **نیست** که متغیرهای محیطی شما گم شده‌اند - فقط یعنی OpenClaw شل ورود
    شما را به‌صورت خودکار بارگذاری نمی‌کند.

    اگر Gateway به‌عنوان سرویس اجرا شود (launchd/systemd)، محیط شل شما را به ارث
    نمی‌برد. با انجام یکی از این کارها اصلاحش کنید:

    1. توکن را در `~/.openclaw/.env` بگذارید:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. یا وارد کردن از شل را فعال کنید (`env.shellEnv.enabled: true`).
    3. یا آن را به بلوک `env` پیکربندی خود اضافه کنید (فقط اگر وجود نداشته باشد اعمال می‌شود).

    سپس Gateway را دوباره راه‌اندازی کنید و دوباره بررسی کنید:

    ```bash
    openclaw models status
    ```

    توکن‌های Copilot از `COPILOT_GITHUB_TOKEN` (همچنین `GH_TOKEN` / `GITHUB_TOKEN`) خوانده می‌شوند.
    [/concepts/model-providers](/fa/concepts/model-providers) و [/environment](/fa/help/environment) را ببینید.

  </Accordion>
</AccordionGroup>

## نشست‌ها و چند گفت‌وگو

<AccordionGroup>
  <Accordion title="چگونه یک گفت‌وگوی تازه شروع کنم؟">
    `/new` یا `/reset` را به‌عنوان یک پیام مستقل ارسال کنید. [مدیریت نشست](/fa/concepts/session) را ببینید.
  </Accordion>

  <Accordion title="اگر هرگز /new نفرستم، نشست‌ها خودکار ریست می‌شوند؟">
    نشست‌ها می‌توانند پس از `session.idleMinutes` منقضی شوند، اما این به‌صورت **پیش‌فرض غیرفعال** است (پیش‌فرض **0**).
    برای فعال کردن انقضای بیکاری، آن را روی یک مقدار مثبت تنظیم کنید. وقتی فعال باشد، **پیام بعدی**
    پس از دوره بیکاری، یک شناسه نشست تازه برای آن کلید چت شروع می‌کند.
    این کار transcriptها را حذف نمی‌کند - فقط یک نشست جدید شروع می‌کند.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="آیا راهی هست که یک تیم از نمونه‌های OpenClaw بسازم (یک مدیرعامل و چندین عامل)؟">
    بله، از طریق **مسیریابی چندعامله** و **زیرعامل‌ها**. می‌توانید یک عامل هماهنگ‌کننده
    و چند عامل کارگر با فضاهای کاری و مدل‌های جداگانه خودشان بسازید.

    با این حال، بهتر است این را یک **آزمایش سرگرم‌کننده** بدانید. مصرف توکن بالایی دارد و اغلب
    از استفاده از یک ربات با نشست‌های جداگانه کم‌بازده‌تر است. مدل معمولی که ما
    در نظر داریم، یک ربات است که با آن صحبت می‌کنید و نشست‌های متفاوتی برای کار موازی دارد. آن
    ربات همچنین می‌تواند در صورت نیاز زیرعامل‌ها را spawn کند.

    مستندات: [مسیریابی چندعامله](/fa/concepts/multi-agent)، [زیرعامل‌ها](/fa/tools/subagents)، [CLI عامل‌ها](/fa/cli/agents).

  </Accordion>

  <Accordion title="چرا زمینه در میانه کار کوتاه شد؟ چگونه از آن جلوگیری کنم؟">
    زمینه نشست توسط پنجره مدل محدود می‌شود. گفت‌وگوهای طولانی، خروجی‌های بزرگ ابزار، یا فایل‌های زیاد
    می‌توانند Compaction یا کوتاه‌سازی را فعال کنند.

    چه چیزهایی کمک می‌کند:

    - از ربات بخواهید وضعیت فعلی را خلاصه کند و آن را در یک فایل بنویسد.
    - پیش از کارهای طولانی از `/compact` استفاده کنید، و هنگام تغییر موضوع از `/new`.
    - زمینه مهم را در فضای کاری نگه دارید و از ربات بخواهید آن را دوباره بخواند.
    - برای کار طولانی یا موازی از زیرعامل‌ها استفاده کنید تا چت اصلی کوچک‌تر بماند.
    - اگر این اتفاق زیاد رخ می‌دهد، مدلی با پنجره زمینه بزرگ‌تر انتخاب کنید.

  </Accordion>

  <Accordion title="چگونه OpenClaw را کاملاً ریست کنم اما نصب‌شده نگه دارم؟">
    از دستور reset استفاده کنید:

    ```bash
    openclaw reset
    ```

    ریست کامل غیرتعاملی:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    سپس راه‌اندازی را دوباره اجرا کنید:

    ```bash
    openclaw onboard --install-daemon
    ```

    نکات:

    - اگر onboarding پیکربندی موجودی ببیند، گزینه **Reset** را هم ارائه می‌دهد. [Onboarding (CLI)](/fa/start/wizard) را ببینید.
    - اگر از profileها (`--profile` / `OPENCLAW_PROFILE`) استفاده کرده‌اید، هر state dir را ریست کنید (پیش‌فرض‌ها `~/.openclaw-<profile>` هستند).
    - ریست dev: `openclaw gateway --dev --reset` (فقط dev؛ پیکربندی dev + credentials + نشست‌ها + فضای کاری را پاک می‌کند).

  </Accordion>

  <Accordion title='خطاهای "context too large" می‌گیرم - چگونه ریست یا compact کنم؟'>
    یکی از این‌ها را استفاده کنید:

    - **Compact** (گفت‌وگو را نگه می‌دارد اما نوبت‌های قدیمی‌تر را خلاصه می‌کند):

      ```
      /compact
      ```

      یا `/compact <instructions>` برای هدایت خلاصه.

    - **Reset** (شناسه نشست تازه برای همان کلید چت):

      ```
      /new
      /reset
      ```

    اگر همچنان رخ می‌دهد:

    - **هرس نشست** (`agents.defaults.contextPruning`) را فعال یا تنظیم کنید تا خروجی ابزار قدیمی کوتاه شود.
    - از مدلی با پنجره زمینه بزرگ‌تر استفاده کنید.

    مستندات: [Compaction](/fa/concepts/compaction)، [هرس نشست](/fa/concepts/session-pruning)، [مدیریت نشست](/fa/concepts/session).

  </Accordion>

  <Accordion title='چرا "LLM request rejected: messages.content.tool_use.input field required" را می‌بینم؟'>
    این یک خطای اعتبارسنجی provider است: مدل یک بلوک `tool_use` بدون
    `input` لازم منتشر کرده است. معمولاً یعنی تاریخچه نشست stale یا خراب شده است (اغلب پس از threadهای طولانی
    یا تغییر ابزار/schema).

    راه‌حل: با `/new` یک نشست تازه شروع کنید (پیام مستقل).

  </Accordion>

  <Accordion title="چرا هر 30 دقیقه پیام‌های Heartbeat می‌گیرم؟">
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

    اگر `HEARTBEAT.md` وجود داشته باشد اما عملاً خالی باشد (فقط خطوط خالی و سرآیندهای markdown
    مثل `# Heading`)، OpenClaw اجرای Heartbeat را برای صرفه‌جویی در فراخوانی‌های API رد می‌کند.
    اگر فایل وجود نداشته باشد، Heartbeat همچنان اجرا می‌شود و مدل تصمیم می‌گیرد چه کند.

    بازنویسی‌های مختص هر عامل از `agents.list[].heartbeat` استفاده می‌کنند. مستندات: [Heartbeat](/fa/gateway/heartbeat).

  </Accordion>

  <Accordion title='آیا باید یک "bot account" به گروه WhatsApp اضافه کنم؟'>
    خیر. OpenClaw روی **حساب خودتان** اجرا می‌شود، بنابراین اگر شما در گروه باشید، OpenClaw می‌تواند آن را ببیند.
    به‌صورت پیش‌فرض، پاسخ‌های گروهی تا وقتی فرستنده‌ها را مجاز نکنید مسدودند (`groupPolicy: "allowlist"`).

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
    گزینه 1 (سریع‌ترین): لاگ‌ها را tail کنید و یک پیام آزمایشی در گروه بفرستید:

    ```bash
    openclaw logs --follow --json
    ```

    به‌دنبال `chatId` (یا `from`) باشید که به `@g.us` ختم می‌شود، مثل:
    `1234567890-1234567890@g.us`.

    گزینه 2 (اگر از قبل پیکربندی/allowlist شده): گروه‌ها را از پیکربندی فهرست کنید:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    مستندات: [WhatsApp](/fa/channels/whatsapp)، [دایرکتوری](/fa/cli/directory)، [لاگ‌ها](/fa/cli/logs).

  </Accordion>

  <Accordion title="چرا OpenClaw در یک گروه پاسخ نمی‌دهد؟">
    دو علت رایج:

    - gating بر اساس mention روشن است (پیش‌فرض). باید ربات را @mention کنید (یا با `mentionPatterns` تطبیق دهید).
    - شما `channels.whatsapp.groups` را بدون `"*"` پیکربندی کرده‌اید و گروه در allowlist نیست.

    [گروه‌ها](/fa/channels/groups) و [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.

  </Accordion>

  <Accordion title="آیا گروه‌ها/threadها با DMها زمینه مشترک دارند؟">
    چت‌های مستقیم به‌صورت پیش‌فرض به نشست اصلی collapse می‌شوند. گروه‌ها/کانال‌ها کلیدهای نشست خودشان را دارند، و topicهای Telegram / threadهای Discord نشست‌های جداگانه هستند. [گروه‌ها](/fa/channels/groups) و [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.
  </Accordion>

  <Accordion title="چند فضای کاری و عامل می‌توانم بسازم؟">
    محدودیت سختی وجود ندارد. ده‌ها (حتی صدها) مورد مشکلی ندارند، اما مراقب این موارد باشید:

    - **رشد دیسک:** نشست‌ها + transcriptها زیر `~/.openclaw/agents/<agentId>/sessions/` قرار دارند.
    - **هزینه توکن:** عامل‌های بیشتر یعنی استفاده هم‌زمان بیشتر از مدل.
    - **سربار عملیاتی:** profileهای احراز هویت، فضاهای کاری، و مسیریابی کانال برای هر عامل.

    نکته‌ها:

    - برای هر عامل یک فضای کاری **فعال** نگه دارید (`agents.defaults.workspace`).
    - اگر دیسک رشد کرد، نشست‌های قدیمی را هرس کنید (JSONL یا ورودی‌های store را حذف کنید).
    - از `openclaw doctor` برای پیدا کردن فضاهای کاری stray و ناهماهنگی‌های profile استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم چندین بات یا چت را هم‌زمان اجرا کنم (Slack)، و آن را چگونه باید راه‌اندازی کنم؟">
    بله. برای اجرای چندین عامل ایزوله و مسیریابی پیام‌های ورودی بر اساس
    کانال/حساب/همتا از **مسیریابی چندعاملی** استفاده کنید. Slack به‌عنوان یک کانال پشتیبانی می‌شود و می‌تواند به عامل‌های مشخصی متصل شود.

    دسترسی مرورگر قدرتمند است، اما به معنی «انجام هر کاری که انسان می‌تواند انجام دهد» نیست - ضدبات، CAPTCHAها و MFA همچنان می‌توانند
    خودکارسازی را مسدود کنند. برای قابل‌اعتمادترین کنترل مرورگر، از Chrome MCP محلی روی میزبان استفاده کنید،
    یا از CDP روی ماشینی استفاده کنید که واقعا مرورگر را اجرا می‌کند.

    راه‌اندازی پیشنهادی:

    - میزبان Gateway همیشه‌روشن (VPS/Mac mini).
    - یک عامل برای هر نقش (اتصال‌ها).
    - کانال(های) Slack متصل به آن عامل‌ها.
    - مرورگر محلی از طریق Chrome MCP یا یک Node در صورت نیاز.

    مستندات: [مسیریابی چندعاملی](/fa/concepts/multi-agent), [Slack](/fa/channels/slack),
    [مرورگر](/fa/tools/browser), [Nodeها](/fa/nodes).

  </Accordion>
</AccordionGroup>

## مدل‌ها، failover، و پروفایل‌های احراز هویت

پرسش‌وپاسخ مدل‌ها — پیش‌فرض‌ها، انتخاب، aliasها، تغییر، failover، پروفایل‌های احراز هویت —
در [پرسش‌های پرتکرار مدل‌ها](/fa/help/faq-models) قرار دارد.

## Gateway: پورت‌ها، «already running»، و حالت راه‌دور

<AccordionGroup>
  <Accordion title="Gateway از چه پورتی استفاده می‌کند؟">
    `gateway.port` پورت تک‌گانه و چندمنظوره را برای WebSocket + HTTP (Control UI، hookها، و غیره) کنترل می‌کند.

    ترتیب اولویت:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='چرا openclaw gateway status می‌گوید "Runtime: running" اما "Connectivity probe: failed"؟'>
    چون «running» نمای **supervisor** است (launchd/systemd/schtasks). probe اتصال یعنی CLI واقعا در حال اتصال به WebSocket گیت‌وی است.

    از `openclaw gateway status` استفاده کنید و به این خطوط اعتماد کنید:

    - `Probe target:` (نشانی URL که probe واقعا استفاده کرده است)
    - `Listening:` (چیزی که واقعا روی پورت bind شده است)
    - `Last gateway error:` (علت ریشه‌ای رایج وقتی فرایند زنده است اما پورت گوش نمی‌دهد)

  </Accordion>

  <Accordion title='چرا openclaw gateway status مقدارهای "Config (cli)" و "Config (service)" را متفاوت نشان می‌دهد؟'>
    شما در حال ویرایش یک فایل پیکربندی هستید، در حالی که سرویس پیکربندی دیگری را اجرا می‌کند (اغلب به‌دلیل ناهماهنگی `--profile` / `OPENCLAW_STATE_DIR`).

    راه‌حل:

    ```bash
    openclaw gateway install --force
    ```

    آن را از همان `--profile` / محیطی اجرا کنید که می‌خواهید سرویس از آن استفاده کند.

  </Accordion>

  <Accordion title='عبارت "another gateway instance is already listening" یعنی چه؟'>
    OpenClaw با bind کردن فوری listener وب‌سوکت در شروع اجرا، یک قفل runtime اعمال می‌کند (پیش‌فرض `ws://127.0.0.1:18789`). اگر bind با `EADDRINUSE` شکست بخورد، `GatewayLockError` پرتاب می‌کند که نشان می‌دهد نمونه دیگری از قبل در حال گوش دادن است.

    راه‌حل: نمونه دیگر را متوقف کنید، پورت را آزاد کنید، یا با `openclaw gateway --port <port>` اجرا کنید.

  </Accordion>

  <Accordion title="چگونه OpenClaw را در حالت راه‌دور اجرا کنم (کلاینت به Gateway در جای دیگری وصل شود)؟">
    `gateway.mode: "remote"` را تنظیم کنید و به یک URL وب‌سوکت راه‌دور اشاره کنید، در صورت نیاز همراه با اعتبارنامه‌های راه‌دور مبتنی بر shared-secret:

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

    - `openclaw gateway` فقط وقتی شروع می‌شود که `gateway.mode` برابر `local` باشد (یا flag بازنویسی را پاس دهید).
    - اپ macOS فایل پیکربندی را پایش می‌کند و وقتی این مقدارها تغییر کنند، حالت‌ها را زنده تغییر می‌دهد.
    - `gateway.remote.token` / `.password` فقط اعتبارنامه‌های راه‌دور سمت کلاینت هستند؛ به‌تنهایی احراز هویت Gateway محلی را فعال نمی‌کنند.

  </Accordion>

  <Accordion title='Control UI می‌گوید "unauthorized" (یا مدام reconnect می‌کند). حالا چه کنم؟'>
    مسیر احراز هویت Gateway شما با روش احراز هویت UI مطابقت ندارد.

    واقعیت‌ها (بر اساس کد):

    - Control UI توکن را برای نشست فعلی tab مرورگر و URL انتخاب‌شده Gateway در `sessionStorage` نگه می‌دارد، بنابراین refreshهای همان tab بدون بازگرداندن ماندگاری توکن بلندمدت localStorage همچنان کار می‌کنند.
    - در `AUTH_TOKEN_MISMATCH`، کلاینت‌های مورداعتماد می‌توانند وقتی Gateway راهنمای retry برمی‌گرداند (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`)، یک retry محدود با توکن دستگاه cache‌شده انجام دهند.
    - آن retry با توکن cache‌شده اکنون از scopeهای تاییدشده cache‌شده که همراه توکن دستگاه ذخیره شده‌اند دوباره استفاده می‌کند. فراخوان‌هایی با `deviceToken` صریح / `scopes` صریح همچنان به‌جای ارث‌بری از scopeهای cache‌شده، مجموعه scope درخواستی خود را نگه می‌دارند.
    - خارج از آن مسیر retry، اولویت احراز هویت اتصال ابتدا shared token/password صریح، سپس `deviceToken` صریح، سپس توکن دستگاه ذخیره‌شده، و سپس bootstrap token است.
    - بررسی‌های scope برای bootstrap token دارای پیشوند نقش هستند. allowlist داخلی bootstrap operator فقط درخواست‌های operator را برآورده می‌کند؛ Node یا نقش‌های غیر operator دیگر همچنان به scopeهایی زیر پیشوند نقش خودشان نیاز دارند.

    راه‌حل:

    - سریع‌ترین: `openclaw dashboard` (URL داشبورد را چاپ و کپی می‌کند، تلاش می‌کند آن را باز کند؛ اگر headless باشد راهنمای SSH نشان می‌دهد).
    - اگر هنوز توکن ندارید: `openclaw doctor --generate-gateway-token`.
    - اگر راه‌دور است، ابتدا tunnel بزنید: `ssh -N -L 18789:127.0.0.1:18789 user@host` سپس `http://127.0.0.1:18789/` را باز کنید.
    - حالت shared-secret: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` یا `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` را تنظیم کنید، سپس secret متناظر را در تنظیمات Control UI paste کنید.
    - حالت Tailscale Serve: مطمئن شوید `gateway.auth.allowTailscale` فعال است و URL سرو را باز می‌کنید، نه یک URL خام loopback/tailnet که headerهای هویت Tailscale را دور می‌زند.
    - حالت trusted-proxy: مطمئن شوید از طریق proxy آگاه از هویت پیکربندی‌شده وارد می‌شوید، نه URL خام Gateway. proxyهای loopback همان میزبان نیز به `gateway.auth.trustedProxy.allowLoopback = true` نیاز دارند.
    - اگر پس از یک retry ناهماهنگی ادامه داشت، توکن دستگاه pairشده را rotate/دوباره تایید کنید:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - اگر آن فراخوان rotate گفت رد شده است، دو مورد را بررسی کنید:
      - نشست‌های دستگاه pairشده فقط می‌توانند دستگاه **خودشان** را rotate کنند، مگر اینکه `operator.admin` هم داشته باشند
      - مقدارهای `--scope` صریح نمی‌توانند از scopeهای operator فعلی فراخواننده فراتر بروند
    - هنوز گیر کرده‌اید؟ `openclaw status --all` را اجرا کنید و [عیب‌یابی](/fa/gateway/troubleshooting) را دنبال کنید. برای جزئیات احراز هویت، [داشبورد](/fa/web/dashboard) را ببینید.

  </Accordion>

  <Accordion title="gateway.bind را روی tailnet تنظیم کرده‌ام اما نمی‌تواند bind کند و هیچ‌چیز گوش نمی‌دهد">
    bind با `tailnet` یک IP مربوط به Tailscale را از interfaceهای شبکه شما انتخاب می‌کند (100.64.0.0/10). اگر ماشین روی Tailscale نباشد (یا interface down باشد)، چیزی برای bind کردن وجود ندارد.

    راه‌حل:

    - Tailscale را روی آن میزبان شروع کنید (تا یک آدرس 100.x داشته باشد)، یا
    - به `gateway.bind: "loopback"` / `"lan"` تغییر دهید.

    نکته: `tailnet` صریح است. `auto`، loopback را ترجیح می‌دهد؛ وقتی bind فقط برای tailnet می‌خواهید از `gateway.bind: "tailnet"` استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم چند Gateway را روی یک میزبان اجرا کنم؟">
    معمولا نه - یک Gateway می‌تواند چندین کانال پیام‌رسانی و عامل را اجرا کند. فقط زمانی از چند Gateway استفاده کنید که به افزونگی (مثلا: بات نجات) یا ایزوله‌سازی سخت نیاز دارید.

    بله، اما باید ایزوله کنید:

    - `OPENCLAW_CONFIG_PATH` (پیکربندی برای هر نمونه)
    - `OPENCLAW_STATE_DIR` (وضعیت برای هر نمونه)
    - `agents.defaults.workspace` (ایزوله‌سازی workspace)
    - `gateway.port` (پورت‌های یکتا)

    راه‌اندازی سریع (پیشنهادی):

    - برای هر نمونه از `openclaw --profile <name> ...` استفاده کنید (به‌صورت خودکار `~/.openclaw-<name>` می‌سازد).
    - در پیکربندی هر profile یک `gateway.port` یکتا تنظیم کنید (یا برای اجراهای دستی `--port` را پاس دهید).
    - یک سرویس برای هر profile نصب کنید: `openclaw --profile <name> gateway install`.

    Profileها نام سرویس‌ها را نیز suffix می‌کنند (`ai.openclaw.<profile>`؛ قدیمی: `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    راهنمای کامل: [چند gateway](/fa/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='عبارت "invalid handshake" / کد 1008 یعنی چه؟'>
    Gateway یک **سرور WebSocket** است، و انتظار دارد اولین پیام
    یک frame از نوع `connect` باشد. اگر هر چیز دیگری دریافت کند، اتصال را
    با **کد 1008** (نقض policy) می‌بندد.

    علت‌های رایج:

    - URL **HTTP** را در مرورگر باز کرده‌اید (`http://...`) به‌جای یک کلاینت WS.
    - از پورت یا مسیر اشتباه استفاده کرده‌اید.
    - یک proxy یا tunnel هدرهای auth را حذف کرده یا درخواست غیر Gateway فرستاده است.

    راه‌حل‌های سریع:

    1. از URL مربوط به WS استفاده کنید: `ws://<host>:18789` (یا اگر HTTPS است `wss://...`).
    2. پورت WS را در tab عادی مرورگر باز نکنید.
    3. اگر auth روشن است، token/password را در frame `connect` قرار دهید.

    اگر از CLI یا TUI استفاده می‌کنید، URL باید شبیه این باشد:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    جزئیات protocol: [پروتکل Gateway](/fa/gateway/protocol).

  </Accordion>
</AccordionGroup>

## لاگ‌گیری و اشکال‌زدایی

<AccordionGroup>
  <Accordion title="لاگ‌ها کجا هستند؟">
    لاگ‌های فایل (ساختاریافته):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    می‌توانید از طریق `logging.file` یک مسیر پایدار تنظیم کنید. سطح لاگ فایل با `logging.level` کنترل می‌شود. میزان جزئیات console با `--verbose` و `logging.consoleLevel` کنترل می‌شود.

    سریع‌ترین tail لاگ:

    ```bash
    openclaw logs --follow
    ```

    لاگ‌های سرویس/supervisor (وقتی Gateway از طریق launchd/systemd اجرا می‌شود):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` و `gateway.err.log` (پیش‌فرض: `~/.openclaw/logs/...`؛ profileها از `~/.openclaw-<profile>/logs/...` استفاده می‌کنند)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    برای موارد بیشتر، [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید.

  </Accordion>

  <Accordion title="چگونه سرویس Gateway را شروع/متوقف/restart کنم؟">
    از helperهای Gateway استفاده کنید:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر Gateway را دستی اجرا می‌کنید، `openclaw gateway --force` می‌تواند پورت را پس بگیرد. [Gateway](/fa/gateway) را ببینید.

  </Accordion>

  <Accordion title="terminal خود را در Windows بستم - چگونه OpenClaw را restart کنم؟">
    **دو حالت نصب Windows** وجود دارد:

    **1) WSL2 (پیشنهادی):** Gateway داخل Linux اجرا می‌شود.

    PowerShell را باز کنید، وارد WSL شوید، سپس restart کنید:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر هرگز سرویس را نصب نکرده‌اید، آن را در foreground شروع کنید:

    ```bash
    openclaw gateway run
    ```

    **2) Windows native (پیشنهاد نمی‌شود):** Gateway مستقیما در Windows اجرا می‌شود.

    PowerShell را باز کنید و اجرا کنید:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر آن را دستی اجرا می‌کنید (بدون سرویس)، استفاده کنید از:

    ```powershell
    openclaw gateway run
    ```

    مستندات: [Windows (WSL2)](/fa/platforms/windows), [راهنمای اجرای سرویس Gateway](/fa/gateway).

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

    - احراز هویت مدل روی **میزبان gateway** بارگذاری نشده است (`models status` را بررسی کنید).
    - Pairing/allowlist کانال پاسخ‌ها را مسدود می‌کند (پیکربندی کانال + لاگ‌ها را بررسی کنید).
    - WebChat/Dashboard بدون token درست باز است.

    اگر راه‌دور هستید، تایید کنید اتصال tunnel/Tailscale برقرار است و
    WebSocket مربوط به Gateway قابل دسترسی است.

    مستندات: [کانال‌ها](/fa/channels), [عیب‌یابی](/fa/gateway/troubleshooting), [دسترسی راه‌دور](/fa/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - حالا چه کنم؟'>
    این معمولا یعنی UI اتصال WebSocket را از دست داده است. بررسی کنید:

    ۱. آیا Gateway در حال اجراست؟ `openclaw gateway status`
    ۲. آیا Gateway سالم است؟ `openclaw status`
    ۳. آیا UI توکن درست را دارد؟ `openclaw dashboard`
    ۴. اگر راه دور است، آیا لینک تونل/Tailscale برقرار است؟

    سپس لاگ‌ها را دنبال کنید:

    ```bash
    openclaw logs --follow
    ```

    مستندات: [Dashboard](/fa/web/dashboard)، [دسترسی راه دور](/fa/gateway/remote)، [عیب‌یابی](/fa/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands ناموفق است. چه چیزی را باید بررسی کنم؟">
    با لاگ‌ها و وضعیت کانال شروع کنید:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    سپس خطا را تطبیق دهید:

    - `BOT_COMMANDS_TOO_MUCH`: منوی Telegram ورودی‌های بیش از حدی دارد. OpenClaw همین حالا هم تا سقف Telegram کوتاه می‌کند و با فرمان‌های کمتر دوباره تلاش می‌کند، اما هنوز بعضی ورودی‌های منو باید حذف شوند. فرمان‌های Plugin/skill/سفارشی را کاهش دهید، یا اگر به منو نیاز ندارید `channels.telegram.commands.native` را غیرفعال کنید.
    - `TypeError: fetch failed`، `Network request for 'setMyCommands' failed!`، یا خطاهای شبکه مشابه: اگر روی VPS هستید یا پشت پراکسی قرار دارید، تأیید کنید HTTPS خروجی مجاز است و DNS برای `api.telegram.org` کار می‌کند.

    اگر Gateway راه دور است، مطمئن شوید لاگ‌های میزبان Gateway را می‌بینید.

    مستندات: [Telegram](/fa/channels/telegram)، [عیب‌یابی کانال](/fa/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI هیچ خروجی‌ای نشان نمی‌دهد. چه چیزی را باید بررسی کنم؟">
    ابتدا تأیید کنید Gateway در دسترس است و عامل می‌تواند اجرا شود:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    در TUI، از `/status` برای دیدن وضعیت فعلی استفاده کنید. اگر انتظار پاسخ در یک کانال گفتگو را دارید، مطمئن شوید ارسال فعال است (`/deliver on`).

    مستندات: [TUI](/fa/web/tui)، [فرمان‌های اسلش](/fa/tools/slash-commands).

  </Accordion>

  <Accordion title="چطور Gateway را کامل متوقف و سپس شروع کنم؟">
    اگر سرویس را نصب کرده‌اید:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    این کار **سرویس تحت نظارت** را متوقف/شروع می‌کند (launchd در macOS، systemd در Linux).
    وقتی Gateway در پس‌زمینه به‌عنوان daemon اجرا می‌شود از این استفاده کنید.

    اگر در پیش‌زمینه اجرا می‌کنید، با Ctrl-C متوقف کنید، سپس:

    ```bash
    openclaw gateway run
    ```

    مستندات: [راهنمای عملیاتی سرویس Gateway](/fa/gateway).

  </Accordion>

  <Accordion title="توضیح ساده: openclaw gateway restart در برابر openclaw gateway">
    - `openclaw gateway restart`: **سرویس پس‌زمینه** را دوباره راه‌اندازی می‌کند (launchd/systemd).
    - `openclaw gateway`: Gateway را برای این نشست ترمینال **در پیش‌زمینه** اجرا می‌کند.

    اگر سرویس را نصب کرده‌اید، از فرمان‌های Gateway استفاده کنید. وقتی اجرای یک‌باره و پیش‌زمینه می‌خواهید از `openclaw gateway` استفاده کنید.

  </Accordion>

  <Accordion title="سریع‌ترین راه برای گرفتن جزئیات بیشتر هنگام شکست چیزی">
    Gateway را با `--verbose` شروع کنید تا جزئیات کنسول بیشتری بگیرید. سپس فایل لاگ را برای احراز هویت کانال، مسیریابی مدل، و خطاهای RPC بررسی کنید.
  </Accordion>
</AccordionGroup>

## رسانه و پیوست‌ها

<AccordionGroup>
  <Accordion title="skill من یک تصویر/PDF تولید کرد، اما چیزی ارسال نشد">
    پیوست‌های خروجی از عامل باید یک خط `MEDIA:<path-or-url>` داشته باشند (در خطی جداگانه). [راه‌اندازی دستیار OpenClaw](/fa/start/openclaw) و [ارسال عامل](/fa/tools/agent-send) را ببینید.

    ارسال با CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    همچنین بررسی کنید:

    - کانال مقصد از رسانه خروجی پشتیبانی می‌کند و با فهرست‌های مجاز مسدود نشده است.
    - فایل در محدوده اندازه ارائه‌دهنده است (تصاویر به حداکثر 2048px تغییر اندازه داده می‌شوند).
    - `tools.fs.workspaceOnly=true` ارسال‌های مسیر محلی را به workspace، temp/media-store، و فایل‌های تأییدشده توسط sandbox محدود نگه می‌دارد.
    - `tools.fs.workspaceOnly=false` به `MEDIA:` اجازه می‌دهد فایل‌های محلی میزبان را که عامل از قبل می‌تواند بخواند ارسال کند، اما فقط برای رسانه و انواع سند ایمن (تصاویر، صدا، ویدئو، PDF، و اسناد Office). فایل‌های متن ساده و شبیه راز همچنان مسدود می‌شوند.

    [تصاویر](/fa/nodes/images) را ببینید.

  </Accordion>
</AccordionGroup>

## امنیت و کنترل دسترسی

<AccordionGroup>
  <Accordion title="آیا در معرض قرار دادن OpenClaw برای پیام‌های مستقیم ورودی امن است؟">
    پیام‌های مستقیم ورودی را ورودی نامطمئن در نظر بگیرید. پیش‌فرض‌ها برای کاهش ریسک طراحی شده‌اند:

    - رفتار پیش‌فرض در کانال‌های دارای قابلیت پیام مستقیم، **جفت‌سازی** است:
      - فرستنده‌های ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ ربات پیام آن‌ها را پردازش نمی‌کند.
      - تأیید با: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - درخواست‌های معلق به **۳ برای هر کانال** محدود می‌شوند؛ اگر کدی نرسید `openclaw pairing list --channel <channel> [--account <id>]` را بررسی کنید.
    - باز کردن عمومی پیام‌های مستقیم نیازمند opt-in صریح است (`dmPolicy: "open"` و فهرست مجاز `"*"`).

    برای آشکار کردن سیاست‌های پرریسک پیام مستقیم، `openclaw doctor` را اجرا کنید.

  </Accordion>

  <Accordion title="آیا prompt injection فقط برای ربات‌های عمومی نگرانی است؟">
    خیر. prompt injection درباره **محتوای نامطمئن** است، نه فقط اینکه چه کسی می‌تواند به ربات پیام مستقیم بدهد.
    اگر دستیار شما محتوای بیرونی را می‌خواند (جستجو/دریافت وب، صفحه‌های مرورگر، ایمیل‌ها،
    اسناد، پیوست‌ها، لاگ‌های چسبانده‌شده)، آن محتوا می‌تواند شامل دستورهایی باشد که تلاش می‌کنند
    مدل را منحرف کنند. این حتی اگر **شما تنها فرستنده باشید** هم می‌تواند رخ دهد.

    بزرگ‌ترین ریسک زمانی است که ابزارها فعال هستند: مدل می‌تواند فریب بخورد تا
    context را نشت دهد یا از طرف شما ابزارها را فراخوانی کند. دامنه اثر را با این کارها کاهش دهید:

    - استفاده از عامل «خواننده» فقط‌خواندنی یا بدون ابزار برای خلاصه‌سازی محتوای نامطمئن
    - خاموش نگه داشتن `web_search` / `web_fetch` / `browser` برای عامل‌های دارای ابزار
    - نامطمئن دانستن متن رمزگشایی‌شده فایل/سند نیز: OpenResponses
      `input_file` و استخراج پیوست رسانه هر دو متن استخراج‌شده را به‌جای عبور دادن متن خام فایل،
      در نشانگرهای مرزی صریح محتوای بیرونی قرار می‌دهند
    - sandboxing و فهرست‌های مجاز سخت‌گیرانه ابزار

    جزئیات: [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="آیا ربات من باید ایمیل، حساب GitHub، یا شماره تلفن خودش را داشته باشد؟">
    بله، برای بیشتر راه‌اندازی‌ها. جدا کردن ربات با حساب‌ها و شماره‌های تلفن جداگانه
    اگر چیزی خراب شود دامنه اثر را کاهش می‌دهد. این همچنین چرخاندن
    credentials یا لغو دسترسی را بدون اثرگذاری بر حساب‌های شخصی شما آسان‌تر می‌کند.

    کوچک شروع کنید. فقط به ابزارها و حساب‌هایی دسترسی بدهید که واقعاً نیاز دارید، و اگر لازم شد بعداً گسترش دهید.

    مستندات: [امنیت](/fa/gateway/security)، [جفت‌سازی](/fa/channels/pairing).

  </Accordion>

  <Accordion title="آیا می‌توانم به آن روی پیام‌های متنی‌ام خودمختاری بدهم و آیا امن است؟">
    ما خودمختاری کامل روی پیام‌های شخصی شما را توصیه **نمی‌کنیم**. امن‌ترین الگو این است:

    - پیام‌های مستقیم را در **حالت جفت‌سازی** یا یک فهرست مجاز محدود نگه دارید.
    - اگر می‌خواهید از طرف شما پیام بدهد، از یک **شماره یا حساب جداگانه** استفاده کنید.
    - بگذارید پیش‌نویس کند، سپس **پیش از ارسال تأیید کنید**.

    اگر می‌خواهید آزمایش کنید، این کار را روی یک حساب اختصاصی انجام دهید و آن را جدا نگه دارید. [امنیت](/fa/gateway/security) را ببینید.

  </Accordion>

  <Accordion title="آیا می‌توانم برای وظایف دستیار شخصی از مدل‌های ارزان‌تر استفاده کنم؟">
    بله، **اگر** عامل فقط گفتگو انجام می‌دهد و ورودی قابل اعتماد است. رده‌های کوچک‌تر
    در برابر ربایش دستور آسیب‌پذیرترند، بنابراین برای عامل‌های دارای ابزار
    یا هنگام خواندن محتوای نامطمئن از آن‌ها اجتناب کنید. اگر ناچارید از مدل کوچک‌تر استفاده کنید،
    ابزارها را قفل کنید و داخل sandbox اجرا کنید. [امنیت](/fa/gateway/security) را ببینید.
  </Accordion>

  <Accordion title="در Telegram /start را اجرا کردم اما کد جفت‌سازی نگرفتم">
    کدهای جفت‌سازی **فقط** وقتی ارسال می‌شوند که فرستنده ناشناس به ربات پیام بدهد و
    `dmPolicy: "pairing"` فعال باشد. `/start` به‌تنهایی کد تولید نمی‌کند.

    درخواست‌های معلق را بررسی کنید:

    ```bash
    openclaw pairing list telegram
    ```

    اگر دسترسی فوری می‌خواهید، شناسه فرستنده خود را در فهرست مجاز بگذارید یا برای آن حساب `dmPolicy: "open"` را تنظیم کنید.

  </Accordion>

  <Accordion title="WhatsApp: آیا به مخاطبان من پیام می‌دهد؟ جفت‌سازی چطور کار می‌کند؟">
    خیر. سیاست پیش‌فرض پیام مستقیم WhatsApp، **جفت‌سازی** است. فرستنده‌های ناشناس فقط یک کد جفت‌سازی می‌گیرند و پیامشان **پردازش نمی‌شود**. OpenClaw فقط به گفتگوهایی پاسخ می‌دهد که دریافت می‌کند یا به ارسال‌های صریحی که شما اجرا می‌کنید.

    جفت‌سازی را با این فرمان تأیید کنید:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    درخواست‌های معلق را فهرست کنید:

    ```bash
    openclaw pairing list whatsapp
    ```

    درخواست شماره تلفن در ویزارد: برای تنظیم **فهرست مجاز/مالک** شما استفاده می‌شود تا پیام‌های مستقیم خودتان مجاز باشند. برای ارسال خودکار استفاده نمی‌شود. اگر روی شماره WhatsApp شخصی خود اجرا می‌کنید، از همان شماره استفاده کنید و `channels.whatsapp.selfChatMode` را فعال کنید.

  </Accordion>
</AccordionGroup>

## فرمان‌های گفتگو، لغو وظایف، و «متوقف نمی‌شود»

<AccordionGroup>
  <Accordion title="چطور جلوی نمایش پیام‌های داخلی سیستم در گفتگو را بگیرم؟">
    بیشتر پیام‌های داخلی یا ابزار فقط وقتی نمایش داده می‌شوند که **verbose**، **trace**، یا **reasoning** برای آن نشست فعال باشد.

    اصلاح در گفتگویی که آن را می‌بینید:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    اگر هنوز شلوغ است، تنظیمات نشست را در Control UI بررسی کنید و verbose
    را روی **inherit** بگذارید. همچنین تأیید کنید از پروفایل رباتی استفاده نمی‌کنید که در پیکربندی `verboseDefault` روی
    `on` تنظیم شده باشد.

    مستندات: [تفکر و verbose](/fa/tools/thinking)، [امنیت](/fa/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="چطور یک وظیفه در حال اجرا را متوقف/لغو کنم؟">
    هرکدام از این‌ها را **به‌عنوان یک پیام مستقل** بفرستید (بدون اسلش):

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

    مرور فرمان‌های اسلش: [فرمان‌های اسلش](/fa/tools/slash-commands) را ببینید.

    بیشتر فرمان‌ها باید به‌عنوان پیام **مستقل** که با `/` شروع می‌شود ارسال شوند، اما چند میان‌بر (مانند `/status`) برای فرستنده‌های مجاز به‌صورت درون‌خطی هم کار می‌کنند.

  </Accordion>

  <Accordion title='چطور از Telegram پیام Discord بفرستم؟ ("Cross-context messaging denied")'>
    OpenClaw به‌طور پیش‌فرض پیام‌رسانی **میان ارائه‌دهنده‌ها** را مسدود می‌کند. اگر یک فراخوانی ابزار به Telegram مقید باشد، به Discord ارسال نمی‌کند مگر اینکه صریحاً اجازه دهید.

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

    پس از ویرایش پیکربندی، Gateway را دوباره راه‌اندازی کنید.

  </Accordion>

  <Accordion title='چرا حس می‌شود ربات پیام‌های پشت‌سرهم سریع را «نادیده می‌گیرد»؟'>
    حالت صف کنترل می‌کند پیام‌های جدید چگونه با اجرای در حال انجام تعامل کنند. برای تغییر حالت‌ها از `/queue` استفاده کنید:

    - `steer` - همه هدایت‌های معلق را برای مرز بعدی مدل در اجرای فعلی صف می‌کند
    - `queue` - هدایت قدیمی یکی‌یکی
    - `followup` - پیام‌ها را یکی‌یکی اجرا می‌کند
    - `collect` - پیام‌ها را دسته‌بندی می‌کند و یک‌بار پاسخ می‌دهد
    - `steer-backlog` - اکنون هدایت می‌کند، سپس backlog را پردازش می‌کند
    - `interrupt` - اجرای فعلی را لغو می‌کند و از نو شروع می‌کند

    حالت پیش‌فرض `steer` است. برای حالت‌های followup می‌توانید گزینه‌هایی مانند `debounce:0.5s cap:25 drop:summarize` اضافه کنید. [صف فرمان](/fa/concepts/queue) و [صف هدایت](/fa/concepts/queue-steering) را ببینید.

  </Accordion>
</AccordionGroup>

## متفرقه

<AccordionGroup>
  <Accordion title='مدل پیش‌فرض برای Anthropic با کلید API چیست؟'>
    در OpenClaw، اطلاعات اعتبارسنجی و انتخاب مدل جدا هستند. تنظیم `ANTHROPIC_API_KEY` (یا ذخیره‌سازی کلید API مربوط به Anthropic در پروفایل‌های احراز هویت) احراز هویت را فعال می‌کند، اما مدل پیش‌فرض واقعی همان چیزی است که در `agents.defaults.model.primary` پیکربندی می‌کنید (برای مثال، `anthropic/claude-sonnet-4-6` یا `anthropic/claude-opus-4-6`). اگر پیام `No credentials found for profile "anthropic:default"` را می‌بینید، یعنی Gateway نتوانسته اطلاعات اعتبارسنجی Anthropic را در فایل مورد انتظار `auth-profiles.json` برای agent در حال اجرا پیدا کند.
  </Accordion>
</AccordionGroup>

---

هنوز گیر کرده‌اید؟ در [Discord](https://discord.com/invite/clawd) بپرسید یا یک [بحث GitHub](https://github.com/openclaw/openclaw/discussions) باز کنید.

## مرتبط

- [پرسش‌های متداول اجرای نخست](/fa/help/faq-first-run) — نصب، راه‌اندازی اولیه، احراز هویت، اشتراک‌ها، خطاهای اولیه
- [پرسش‌های متداول مدل‌ها](/fa/help/faq-models) — انتخاب مدل، جایگزینی هنگام خرابی، پروفایل‌های احراز هویت
- [عیب‌یابی](/fa/help/troubleshooting) — بررسی مبتنی بر نشانه‌ها
