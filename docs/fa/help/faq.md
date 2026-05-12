---
read_when:
    - پاسخ به پرسش‌های رایج دربارهٔ راه‌اندازی، نصب، شروع‌به‌کار یا پشتیبانی زمان اجرا
    - دسته‌بندی مسائل گزارش‌شده توسط کاربر پیش از اشکال‌زدایی عمیق‌تر
summary: پرسش‌های متداول دربارهٔ راه‌اندازی، پیکربندی و استفاده از OpenClaw
title: سؤالات متداول
x-i18n:
    generated_at: "2026-05-12T00:59:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57e42ea34d4f53cb9e6f0e9c175fd553a67e70aaca08a09be28f0bde43414bc8
    source_path: help/faq.md
    workflow: 16
---

پاسخ‌های سریع به‌همراه عیب‌یابی عمیق‌تر برای راه‌اندازی‌های واقعی (توسعه محلی، VPS، چندعاملی، OAuth/API keys، failover مدل). برای عیب‌یابی زمان اجرا، [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید. برای مرجع کامل پیکربندی، [پیکربندی](/fa/gateway/configuration) را ببینید.

## ۶۰ ثانیه اول اگر چیزی خراب است

1. **وضعیت سریع (اولین بررسی)**

   ```bash
   openclaw status
   ```

   خلاصه محلی سریع: سیستم‌عامل + به‌روزرسانی، دسترس‌پذیری gateway/service، عامل‌ها/نشست‌ها، پیکربندی provider + مشکلات زمان اجرا (وقتی gateway در دسترس باشد).

2. **گزارش قابل چسباندن (ایمن برای اشتراک‌گذاری)**

   ```bash
   openclaw status --all
   ```

   تشخیص فقط‌خواندنی با انتهای لاگ (توکن‌ها حذف می‌شوند).

3. **وضعیت Daemon + پورت**

   ```bash
   openclaw gateway status
   ```

   زمان اجرای supervisor در برابر دسترس‌پذیری RPC، URL هدف probe، و این‌که service احتمالا از کدام پیکربندی استفاده کرده است را نشان می‌دهد.

4. **probeهای عمیق**

   ```bash
   openclaw status --deep
   ```

   یک probe سلامت زنده Gateway اجرا می‌کند، شامل probeهای کانال وقتی پشتیبانی شوند
   (به Gateway قابل دسترس نیاز دارد). [سلامت](/fa/gateway/health) را ببینید.

5. **دنبال کردن آخرین لاگ**

   ```bash
   openclaw logs --follow
   ```

   اگر RPC قطع است، به این fallback کنید:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   لاگ‌های فایل از لاگ‌های service جدا هستند؛ [لاگ‌گیری](/fa/logging) و [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید.

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

## شروع سریع و راه‌اندازی اولین اجرا

پرسش‌وپاسخ اولین اجرا — نصب، onboarding، مسیرهای احراز هویت، اشتراک‌ها، خطاهای اولیه —
در [پرسش‌های رایج اولین اجرا](/fa/help/faq-first-run) قرار دارد.

## OpenClaw چیست؟

<AccordionGroup>
  <Accordion title="OpenClaw در یک پاراگراف چیست؟">
    OpenClaw یک دستیار هوش مصنوعی شخصی است که روی دستگاه‌های خودتان اجرا می‌کنید. روی سطح‌های پیام‌رسانی‌ای که از قبل استفاده می‌کنید پاسخ می‌دهد (WhatsApp، Telegram، Slack، Mattermost، Discord، Google Chat، Signal، iMessage، WebChat، و Pluginهای کانال همراه مانند QQ Bot) و روی پلتفرم‌های پشتیبانی‌شده می‌تواند صدا + Canvas زنده هم انجام دهد. **Gateway** کنترل‌پلین همیشه‌روشن است؛ دستیار همان محصول است.
  </Accordion>

  <Accordion title="ارزش پیشنهادی">
    OpenClaw «فقط یک پوشش Claude» نیست. این یک **کنترل‌پلین local-first** است که اجازه می‌دهد یک
    دستیار توانمند را روی **سخت‌افزار خودتان** اجرا کنید، از برنامه‌های چتی که از قبل استفاده می‌کنید به آن دسترسی داشته باشید، با
    نشست‌های stateful، حافظه و ابزارها - بدون این‌که کنترل جریان‌های کاری خود را به یک
    SaaS میزبانی‌شده بسپارید.

    نکات برجسته:

    - **دستگاه‌های شما، داده‌های شما:** Gateway را هرجا می‌خواهید اجرا کنید (Mac، Linux، VPS) و
      workspace + تاریخچه نشست را محلی نگه دارید.
    - **کانال‌های واقعی، نه یک sandbox وب:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc،
      به‌علاوه صدای موبایل و Canvas روی پلتفرم‌های پشتیبانی‌شده.
    - **مستقل از مدل:** از Anthropic، OpenAI، MiniMax، OpenRouter و غیره، با مسیریابی
      و failover برای هر عامل استفاده کنید.
    - **گزینه فقط‌محلی:** مدل‌های محلی را اجرا کنید تا اگر بخواهید **همه داده‌ها بتوانند روی دستگاه شما بمانند**.
    - **مسیریابی چندعاملی:** عامل‌های جداگانه برای هر کانال، حساب یا وظیفه، هرکدام با
      workspace و پیش‌فرض‌های خودش.
    - **متن‌باز و قابل هک:** بررسی، گسترش و self-host بدون وابستگی به فروشنده.

    مستندات: [Gateway](/fa/gateway)، [کانال‌ها](/fa/channels)، [چندعاملی](/fa/concepts/multi-agent)،
    [حافظه](/fa/concepts/memory).

  </Accordion>

  <Accordion title="همین حالا راه‌اندازی‌اش کردم - اول چه کار کنم؟">
    پروژه‌های خوب برای شروع:

    - ساخت یک وب‌سایت (WordPress، Shopify، یا یک سایت static ساده).
    - نمونه‌سازی یک اپ موبایل (طرح کلی، صفحه‌ها، برنامه API).
    - سازمان‌دهی فایل‌ها و پوشه‌ها (پاک‌سازی، نام‌گذاری، برچسب‌گذاری).
    - اتصال Gmail و خودکارسازی خلاصه‌ها یا پیگیری‌ها.

    می‌تواند وظیفه‌های بزرگ را انجام دهد، اما وقتی آن‌ها را به فازها تقسیم کنید و
    از زیرعامل‌ها برای کار موازی استفاده کنید بهترین عملکرد را دارد.

  </Accordion>

  <Accordion title="پنج کاربرد روزمره اصلی OpenClaw چیست؟">
    بردهای روزمره معمولا این‌طور به‌نظر می‌رسند:

    - **گزارش‌های شخصی:** خلاصه‌های صندوق ورودی، تقویم و خبرهایی که برایتان مهم است.
    - **پژوهش و پیش‌نویس:** پژوهش سریع، خلاصه‌ها و پیش‌نویس‌های اولیه برای ایمیل‌ها یا docs.
    - **یادآوری‌ها و پیگیری‌ها:** تلنگرها و checklistهای مبتنی بر Cron یا Heartbeat.
    - **خودکارسازی مرورگر:** پر کردن فرم‌ها، جمع‌آوری داده و تکرار وظیفه‌های وب.
    - **هماهنگی بین دستگاه‌ها:** یک وظیفه را از گوشی بفرستید، بگذارید Gateway آن را روی یک سرور اجرا کند، و نتیجه را در چت بگیرید.

  </Accordion>

  <Accordion title="آیا OpenClaw می‌تواند در lead gen، outreach، تبلیغات و بلاگ‌ها برای یک SaaS کمک کند؟">
    بله، برای **پژوهش، ارزیابی صلاحیت و پیش‌نویس**. می‌تواند سایت‌ها را اسکن کند، فهرست‌های کوتاه بسازد،
    prospects را خلاصه کند و پیش‌نویس outreach یا متن تبلیغ بنویسد.

    برای **outreach یا اجرای تبلیغ**، انسان را در حلقه نگه دارید. از spam دوری کنید، قوانین محلی و
    سیاست‌های پلتفرم را رعایت کنید، و هر چیزی را قبل از ارسال بازبینی کنید. ایمن‌ترین الگو این است که
    OpenClaw پیش‌نویس کند و شما تایید کنید.

    مستندات: [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="مزیت‌ها نسبت به Claude Code برای توسعه وب چیست؟">
    OpenClaw یک **دستیار شخصی** و لایه هماهنگی است، نه جایگزین IDE. برای سریع‌ترین چرخه کدنویسی مستقیم داخل یک repo از
    Claude Code یا Codex استفاده کنید. وقتی
    حافظه پایدار، دسترسی بین دستگاه‌ها و orchestration ابزار می‌خواهید از OpenClaw استفاده کنید.

    مزیت‌ها:

    - **حافظه + workspace پایدار** در سراسر نشست‌ها
    - **دسترسی چندپلتفرمی** (WhatsApp، Telegram، TUI، WebChat)
    - **orchestration ابزار** (مرورگر، فایل‌ها، زمان‌بندی، hookها)
    - **Gateway همیشه‌روشن** (اجرا روی VPS، تعامل از هرجا)
    - **Nodeها** برای مرورگر/صفحه‌نمایش/دوربین/exec محلی

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills و خودکارسازی

<AccordionGroup>
  <Accordion title="چطور Skills را بدون dirty نگه داشتن repo سفارشی کنم؟">
    به‌جای ویرایش نسخه repo از overrideهای مدیریت‌شده استفاده کنید. تغییرات خود را در `~/.openclaw/skills/<name>/SKILL.md` بگذارید (یا از طریق `skills.load.extraDirs` در `~/.openclaw/openclaw.json` یک پوشه اضافه کنید). تقدم این است: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → همراه → `skills.load.extraDirs`، بنابراین overrideهای مدیریت‌شده همچنان بدون دست زدن به git بر Skills همراه غلبه می‌کنند. اگر لازم است Skill به‌صورت سراسری نصب باشد اما فقط برای برخی عامل‌ها دیده شود، نسخه مشترک را در `~/.openclaw/skills` نگه دارید و visibility را با `agents.defaults.skills` و `agents.list[].skills` کنترل کنید. فقط ویرایش‌هایی که ارزش upstream شدن دارند باید در repo باشند و به‌صورت PR ارسال شوند.
  </Accordion>

  <Accordion title="آیا می‌توانم Skills را از یک پوشه سفارشی load کنم؟">
    بله. دایرکتوری‌های اضافی را از طریق `skills.load.extraDirs` در `~/.openclaw/openclaw.json` اضافه کنید (کمترین تقدم). تقدم پیش‌فرض این است: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → همراه → `skills.load.extraDirs`. `clawhub` به‌صورت پیش‌فرض در `./skills` نصب می‌کند، که OpenClaw در نشست بعدی آن را به‌عنوان `<workspace>/skills` در نظر می‌گیرد. اگر Skill باید فقط برای عامل‌های خاصی دیده شود، آن را با `agents.defaults.skills` یا `agents.list[].skills` همراه کنید.
  </Accordion>

  <Accordion title="چطور می‌توانم برای وظیفه‌های مختلف از مدل‌های متفاوت استفاده کنم؟">
    الگوهای پشتیبانی‌شده امروز این‌ها هستند:

    - **کارهای Cron**: کارهای ایزوله می‌توانند برای هر کار یک override `model` تنظیم کنند.
    - **زیرعامل‌ها**: وظیفه‌ها را به عامل‌های جداگانه با مدل‌های پیش‌فرض متفاوت مسیریابی کنید.
    - **تعویض درخواستی**: از `/model` برای تعویض مدل نشست فعلی در هر زمان استفاده کنید.

    [کارهای Cron](/fa/automation/cron-jobs)، [مسیریابی چندعاملی](/fa/concepts/multi-agent)، و [دستورهای Slash](/fa/tools/slash-commands) را ببینید.

  </Accordion>

  <Accordion title="bot هنگام کار سنگین freeze می‌شود. چطور آن را offload کنم؟">
    برای وظیفه‌های طولانی یا موازی از **زیرعامل‌ها** استفاده کنید. زیرعامل‌ها در نشست خودشان اجرا می‌شوند،
    خلاصه‌ای برمی‌گردانند و چت اصلی شما را پاسخ‌گو نگه می‌دارند.

    از bot خود بخواهید "spawn a sub-agent for this task" یا از `/subagents` استفاده کنید.
    از `/status` در چت استفاده کنید تا ببینید Gateway همین حالا چه می‌کند (و آیا مشغول است یا نه).

    نکته توکن: وظیفه‌های طولانی و زیرعامل‌ها هر دو توکن مصرف می‌کنند. اگر هزینه دغدغه است، از طریق `agents.defaults.subagents.model`
    یک مدل ارزان‌تر برای زیرعامل‌ها تنظیم کنید.

    مستندات: [زیرعامل‌ها](/fa/tools/subagents)، [وظیفه‌های پس‌زمینه](/fa/automation/tasks).

  </Accordion>

  <Accordion title="نشست‌های زیرعامل وابسته به thread در Discord چطور کار می‌کنند؟">
    از bindingهای thread استفاده کنید. می‌توانید یک thread در Discord را به یک زیرعامل یا هدف نشست bind کنید تا پیام‌های follow-up در آن thread روی همان نشست bindشده بمانند.

    جریان پایه:

    - با `sessions_spawn` و `thread: true` spawn کنید (و در صورت نیاز `mode: "session"` برای follow-up پایدار).
    - یا با `/focus <target>` به‌صورت دستی bind کنید.
    - از `/agents` برای بررسی وضعیت binding استفاده کنید.
    - از `/session idle <duration|off>` و `/session max-age <duration|off>` برای کنترل auto-unfocus استفاده کنید.
    - از `/unfocus` برای جدا کردن thread استفاده کنید.

    پیکربندی لازم:

    - پیش‌فرض‌های سراسری: `session.threadBindings.enabled`، `session.threadBindings.idleHours`، `session.threadBindings.maxAgeHours`.
    - overrideهای Discord: `channels.discord.threadBindings.enabled`، `channels.discord.threadBindings.idleHours`، `channels.discord.threadBindings.maxAgeHours`.
    - auto-bind هنگام spawn: مقدار پیش‌فرض `channels.discord.threadBindings.spawnSessions` برابر `true` است؛ برای غیرفعال کردن spawn نشست‌های وابسته به thread آن را روی `false` بگذارید.

    مستندات: [زیرعامل‌ها](/fa/tools/subagents)، [Discord](/fa/channels/discord)، [مرجع پیکربندی](/fa/gateway/configuration-reference)، [دستورهای Slash](/fa/tools/slash-commands).

  </Accordion>

  <Accordion title="یک زیرعامل تمام شد، اما update تکمیل به جای اشتباه رفت یا اصلا ارسال نشد. چه چیزی را بررسی کنم؟">
    اول مسیر requester حل‌شده را بررسی کنید:

    - تحویل زیرعامل در completion-mode وقتی thread یا route مکالمه bindشده وجود داشته باشد آن را ترجیح می‌دهد.
    - اگر origin تکمیل فقط یک کانال داشته باشد، OpenClaw به route ذخیره‌شده نشست requester fallback می‌کند (`lastChannel` / `lastTo` / `lastAccountId`) تا تحویل مستقیم همچنان بتواند موفق شود.
    - اگر نه route bindشده وجود داشته باشد و نه route ذخیره‌شده قابل استفاده، تحویل مستقیم می‌تواند fail شود و نتیجه به‌جای ارسال فوری به چت، به تحویل صف‌شده نشست fallback می‌کند.
    - targetهای نامعتبر یا stale همچنان می‌توانند queue fallback یا شکست نهایی تحویل را اجبار کنند.
    - اگر آخرین پاسخ assistant قابل مشاهده child دقیقا توکن silent `NO_REPLY` / `no_reply`، یا دقیقا `ANNOUNCE_SKIP` باشد، OpenClaw به‌عمد announce را suppress می‌کند به‌جای این‌که پیشرفت قدیمی‌تر و stale را ارسال کند.
    - اگر child بعد از فقط tool callها timeout شود، announce می‌تواند آن را به یک خلاصه کوتاه از پیشرفت جزئی collapse کند به‌جای این‌که خروجی raw ابزار را replay کند.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [زیرعامل‌ها](/fa/tools/subagents)، [وظیفه‌های پس‌زمینه](/fa/automation/tasks)، [ابزارهای نشست](/fa/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron یا یادآوری‌ها اجرا نمی‌شوند. چه چیزی را بررسی کنم؟">
    Cron داخل process Gateway اجرا می‌شود. اگر Gateway به‌صورت پیوسته در حال اجرا نباشد،
    کارهای زمان‌بندی‌شده اجرا نمی‌شوند.

    Checklist:

    - تایید کنید cron فعال است (`cron.enabled`) و `OPENCLAW_SKIP_CRON` تنظیم نشده است.
    - بررسی کنید Gateway به‌صورت 24/7 در حال اجرا است (بدون sleep/restart).
    - تنظیمات timezone برای job را بررسی کنید (`--tz` در برابر timezone میزبان).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [خودکارسازی](/fa/automation).

  </Accordion>

  <Accordion title="Cron اجرا شد، اما چیزی به کانال ارسال نشد. چرا؟">
    ابتدا حالت تحویل را بررسی کنید:

    - `--no-deliver` / `delivery.mode: "none"` یعنی هیچ ارسال پشتیبان از runner مورد انتظار نیست.
    - هدف اعلامِ گم‌شده یا نامعتبر (`channel` / `to`) یعنی runner تحویل خروجی را رد کرده است.
    - شکست‌های احراز هویت کانال (`unauthorized`, `Forbidden`) یعنی runner تلاش کرده تحویل دهد اما اعتبارنامه‌ها مانع آن شده‌اند.
    - یک نتیجهٔ ایزولهٔ بی‌صدا (فقط `NO_REPLY` / `no_reply`) عمدا غیرقابل‌تحویل در نظر گرفته می‌شود، بنابراین runner تحویل پشتیبانِ صف‌شده را نیز سرکوب می‌کند.

    برای کارهای Cron ایزوله، وقتی مسیر چت در دسترس باشد، عامل همچنان می‌تواند مستقیما با ابزار `message`
    ارسال کند. `--announce` فقط مسیر پشتیبان runner را برای متن نهایی‌ای کنترل می‌کند
    که عامل قبلا ارسال نکرده است.

    اشکال‌زدایی:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [کارهای پس‌زمینه](/fa/automation/tasks).

  </Accordion>

  <Accordion title="چرا یک اجرای Cron ایزوله مدل را عوض کرد یا یک بار دوباره تلاش کرد؟">
    این معمولا مسیر زندهٔ تعویض مدل است، نه زمان‌بندی تکراری.

    Cron ایزوله می‌تواند یک واگذاری مدل در زمان اجرا را پایدار کند و وقتی اجرای فعال
    `LiveSessionModelSwitchError` پرتاب می‌کند، دوباره تلاش کند. تلاش مجدد همان
    ارائه‌دهنده/مدلِ تعویض‌شده را نگه می‌دارد، و اگر تعویض شامل override جدیدی برای پروفایل احراز هویت باشد، Cron
    آن را نیز پیش از تلاش مجدد پایدار می‌کند.

    قواعد انتخاب مرتبط:

    - override مدلِ قلاب Gmail وقتی قابل‌اعمال باشد، ابتدا برنده می‌شود.
    - سپس `model` در سطح هر کار.
    - سپس هر override ذخیره‌شدهٔ مدلِ نشست Cron.
    - سپس انتخاب عادی مدلِ عامل/پیش‌فرض.

    حلقهٔ تلاش مجدد محدود است. پس از تلاش اولیه به‌علاوهٔ ۲ تلاش مجدد برای تعویض،
    Cron به‌جای حلقهٔ بی‌پایان متوقف می‌شود.

    اشکال‌زدایی:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [cron CLI](/fa/cli/cron).

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

    `openclaw skills install` بومی در دایرکتوری فعال `skills/`
    در workspace می‌نویسد. CLI جداگانهٔ `clawhub` را فقط زمانی نصب کنید که بخواهید Skills خودتان را منتشر یا
    همگام‌سازی کنید. برای نصب‌های مشترک بین عامل‌ها، Skill را زیر
    `~/.openclaw/skills` قرار دهید و اگر می‌خواهید محدود کنید کدام عامل‌ها بتوانند آن را ببینند، از
    `agents.defaults.skills` یا
    `agents.list[].skills` استفاده کنید.

  </Accordion>

  <Accordion title="آیا OpenClaw می‌تواند کارها را طبق زمان‌بندی یا به‌صورت پیوسته در پس‌زمینه اجرا کند؟">
    بله. از زمان‌بند Gateway استفاده کنید:

    - **کارهای Cron** برای کارهای زمان‌بندی‌شده یا تکرارشونده (در میان راه‌اندازی‌های مجدد پایدار می‌مانند).
    - **Heartbeat** برای بررسی‌های دوره‌ای «نشست اصلی».
    - **کارهای ایزوله** برای عامل‌های خودکاری که خلاصه ارسال می‌کنند یا به چت‌ها تحویل می‌دهند.

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [خودکارسازی](/fa/automation)،
    [Heartbeat](/fa/gateway/heartbeat).

  </Accordion>

  <Accordion title="آیا می‌توانم Skills مخصوص Apple macOS را از Linux اجرا کنم؟">
    نه مستقیما. Skills مربوط به macOS با `metadata.openclaw.os` به‌همراه باینری‌های لازم gate می‌شوند، و Skills فقط وقتی در prompt سیستم ظاهر می‌شوند که روی **میزبان Gateway** واجد شرایط باشند. روی Linux، Skills فقط مخصوص `darwin` (مانند `apple-notes`، `apple-reminders`، `things-mac`) بارگذاری نمی‌شوند مگر اینکه gating را override کنید.

    سه الگوی پشتیبانی‌شده دارید:

    **گزینه A - Gateway را روی Mac اجرا کنید (ساده‌ترین).**
    Gateway را جایی اجرا کنید که باینری‌های macOS وجود دارند، سپس از Linux در [حالت راه‌دور](#gateway-ports-already-running-and-remote-mode) یا از طریق Tailscale وصل شوید. Skills به‌طور عادی بارگذاری می‌شوند چون میزبان Gateway، macOS است.

    **گزینه B - از یک Node مربوط به macOS استفاده کنید (بدون SSH).**
    Gateway را روی Linux اجرا کنید، یک Node مربوط به macOS را جفت کنید (برنامهٔ نوار منو)، و **Node Run Commands** را روی Mac روی «همیشه بپرس» یا «همیشه اجازه بده» تنظیم کنید. OpenClaw وقتی باینری‌های لازم روی Node وجود داشته باشند، می‌تواند Skills مخصوص macOS را واجد شرایط بداند. عامل آن Skills را از طریق ابزار `nodes` اجرا می‌کند. اگر «همیشه بپرس» را انتخاب کنید، تأیید «همیشه اجازه بده» در prompt آن فرمان را به فهرست مجازها اضافه می‌کند.

    **گزینه C - باینری‌های macOS را از طریق SSH پروکسی کنید (پیشرفته).**
    Gateway را روی Linux نگه دارید، اما کاری کنید باینری‌های CLI لازم به wrapperهای SSH resolve شوند که روی Mac اجرا می‌شوند. سپس Skill را override کنید تا Linux را مجاز کند و واجد شرایط بماند.

    1. برای باینری یک wrapper SSH بسازید (مثال: `memo` برای Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. wrapper را روی `PATH` در میزبان Linux قرار دهید (برای مثال `~/bin/memo`).
    3. metadata مربوط به Skill را override کنید (workspace یا `~/.openclaw/skills`) تا Linux مجاز شود:

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
    امروز به‌صورت داخلی ساخته نشده است.

    گزینه‌ها:

    - **Skill / Plugin سفارشی:** بهترین گزینه برای دسترسی API قابل‌اعتماد است (Notion و HeyGen هر دو API دارند).
    - **خودکارسازی مرورگر:** بدون کد کار می‌کند اما کندتر و شکننده‌تر است.

    اگر می‌خواهید زمینه را برای هر مشتری نگه دارید (workflowهای آژانسی)، یک الگوی ساده این است:

    - یک صفحهٔ Notion برای هر مشتری (زمینه + ترجیحات + کار فعال).
    - از عامل بخواهید آن صفحه را در ابتدای نشست واکشی کند.

    اگر ادغام بومی می‌خواهید، یک درخواست قابلیت باز کنید یا Skillای بسازید
    که آن APIها را هدف بگیرد.

    نصب Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    نصب‌های بومی در دایرکتوری فعال `skills/` در workspace قرار می‌گیرند. برای Skills مشترک بین عامل‌ها، آن‌ها را در `~/.openclaw/skills/<name>/SKILL.md` قرار دهید. اگر فقط برخی عامل‌ها باید یک نصب مشترک را ببینند، `agents.defaults.skills` یا `agents.list[].skills` را پیکربندی کنید. برخی Skills انتظار دارند باینری‌هایی از طریق Homebrew نصب شده باشند؛ روی Linux یعنی Linuxbrew (مدخل FAQ مربوط به Homebrew Linux در بالا را ببینید). [Skills](/fa/tools/skills)، [پیکربندی Skills](/fa/tools/skills-config)، و [ClawHub](/fa/clawhub) را ببینید.

  </Accordion>

  <Accordion title="چگونه از Chrome موجود و واردشدهٔ خودم با OpenClaw استفاده کنم؟">
    از پروفایل مرورگر داخلی `user` استفاده کنید، که از طریق Chrome DevTools MCP متصل می‌شود:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    اگر نام سفارشی می‌خواهید، یک پروفایل MCP صریح بسازید:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    این مسیر می‌تواند از مرورگر میزبان local یا یک Node مرورگر متصل استفاده کند. اگر Gateway جای دیگری اجرا می‌شود، یا روی ماشین مرورگر یک میزبان Node اجرا کنید یا به‌جای آن از CDP راه‌دور استفاده کنید.

    محدودیت‌های فعلی برای `existing-session` / `user`:

    - actionها بر پایهٔ ref هستند، نه بر پایهٔ CSS selector
    - uploadها به `ref` / `inputRef` نیاز دارند و فعلا هر بار از یک فایل پشتیبانی می‌کنند
    - `responsebody`، خروجی PDF، رهگیری download، و actionهای batch هنوز به یک مرورگر مدیریت‌شده یا پروفایل CDP خام نیاز دارند

  </Accordion>
</AccordionGroup>

## Sandboxing و حافظه

<AccordionGroup>
  <Accordion title="آیا مستندات اختصاصی sandboxing وجود دارد؟">
    بله. [Sandboxing](/fa/gateway/sandboxing) را ببینید. برای راه‌اندازی مخصوص Docker (Gateway کامل در Docker یا imageهای sandbox)، [Docker](/fa/install/docker) را ببینید.
  </Accordion>

  <Accordion title="Docker محدود به نظر می‌رسد - چگونه قابلیت‌های کامل را فعال کنم؟">
    image پیش‌فرض با اولویت امنیت است و به‌عنوان کاربر `node` اجرا می‌شود، بنابراین
    packageهای سیستم، Homebrew، یا مرورگرهای bundled را شامل نمی‌شود. برای راه‌اندازی کامل‌تر:

    - `/home/node` را با `OPENCLAW_HOME_VOLUME` پایدار کنید تا cacheها باقی بمانند.
    - وابستگی‌های سیستم را با `OPENCLAW_DOCKER_APT_PACKAGES` در image bake کنید.
    - مرورگرهای Playwright را از طریق CLI bundled نصب کنید:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` را تنظیم کنید و مطمئن شوید مسیر پایدار می‌ماند.

    مستندات: [Docker](/fa/install/docker)، [مرورگر](/fa/tools/browser).

  </Accordion>

  <Accordion title="آیا می‌توانم DMها را شخصی نگه دارم اما گروه‌ها را با یک عامل عمومی/sandboxed کنم؟">
    بله - اگر ترافیک خصوصی شما **DMها** و ترافیک عمومی شما **گروه‌ها** باشد.

    از `agents.defaults.sandbox.mode: "non-main"` استفاده کنید تا نشست‌های گروه/کانال (کلیدهای غیر اصلی) در backend پیکربندی‌شدهٔ sandbox اجرا شوند، در حالی که نشست اصلی DM روی میزبان بماند. اگر backendای انتخاب نکنید، Docker پیش‌فرض است. سپس از طریق `tools.sandbox.tools` محدود کنید چه ابزارهایی در نشست‌های sandboxed در دسترس باشند.

    راهنمای گام‌به‌گام راه‌اندازی + پیکربندی نمونه: [گروه‌ها: DMهای شخصی + گروه‌های عمومی](/fa/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع کلیدی پیکربندی: [پیکربندی Gateway](/fa/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="چگونه یک پوشهٔ میزبان را به sandbox bind کنم؟">
    `agents.defaults.sandbox.docker.binds` را روی `["host:path:mode"]` تنظیم کنید (مثلا `"/home/user/src:/src:ro"`). bindهای سراسری + سطح عامل merge می‌شوند؛ bindهای سطح عامل وقتی `scope: "shared"` باشد نادیده گرفته می‌شوند. برای هر چیز حساس از `:ro` استفاده کنید و به یاد داشته باشید bindها دیوارهای فایل‌سیستم sandbox را دور می‌زنند.

    OpenClaw منبع‌های bind را هم در برابر مسیر نرمال‌شده و هم مسیر canonical که از طریق عمیق‌ترین ancestor موجود resolve شده اعتبارسنجی می‌کند. این یعنی escapeهای symlink-parent حتی وقتی آخرین segment مسیر هنوز وجود ندارد هم fail closed می‌شوند، و بررسی‌های allowed-root همچنان پس از resolve شدن symlink اعمال می‌شوند.

    برای نمونه‌ها و نکات ایمنی، [Sandboxing](/fa/gateway/sandboxing#custom-bind-mounts) و [Sandbox در برابر سیاست ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) را ببینید.

  </Accordion>

  <Accordion title="حافظه چگونه کار می‌کند؟">
    حافظهٔ OpenClaw فقط فایل‌های Markdown در workspace عامل است:

    - یادداشت‌های روزانه در `memory/YYYY-MM-DD.md`
    - یادداشت‌های بلندمدت curated در `MEMORY.md` (فقط نشست‌های اصلی/خصوصی)

    OpenClaw همچنین یک **flush حافظهٔ بی‌صدای پیش از Compaction** اجرا می‌کند تا به مدل یادآوری کند
    پیش از auto-compaction یادداشت‌های بادوام بنویسد. این فقط وقتی اجرا می‌شود که workspace
    قابل‌نوشتن باشد (sandboxهای فقط‌خواندنی آن را رد می‌کنند). [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>

  <Accordion title="حافظه مدام چیزها را فراموش می‌کند. چگونه آن را ماندگار کنم؟">
    از ربات بخواهید **آن واقعیت را در حافظه بنویسد**. یادداشت‌های بلندمدت متعلق به `MEMORY.md` هستند،
    زمینهٔ کوتاه‌مدت در `memory/YYYY-MM-DD.md` قرار می‌گیرد.

    این هنوز حوزه‌ای است که در حال بهبود آن هستیم. یادآوری به مدل برای ذخیرهٔ حافظه‌ها کمک می‌کند؛
    خودش می‌داند چه کار کند. اگر همچنان فراموش می‌کند، بررسی کنید Gateway در هر اجرا از همان
    workspace استفاده می‌کند.

    مستندات: [حافظه](/fa/concepts/memory)، [workspace عامل](/fa/concepts/agent-workspace).

  </Accordion>

  <Accordion title="آیا حافظه برای همیشه پایدار می‌ماند؟ محدودیت‌ها چیست؟">
    فایل‌های حافظه روی دیسک زندگی می‌کنند و تا وقتی آن‌ها را حذف نکنید پایدار می‌مانند. محدودیت، فضای
    ذخیره‌سازی شماست، نه مدل. **زمینهٔ نشست** همچنان با پنجرهٔ زمینهٔ مدل
    محدود است، بنابراین گفتگوهای طولانی می‌توانند compact یا truncate شوند. به همین دلیل
    جستجوی حافظه وجود دارد - فقط بخش‌های مرتبط را دوباره به زمینه برمی‌گرداند.

    مستندات: [حافظه](/fa/concepts/memory)، [زمینه](/fa/concepts/context).

  </Accordion>

  <Accordion title="آیا جست‌وجوی حافظهٔ معنایی به کلید API از OpenAI نیاز دارد؟">
    فقط اگر از **embeddings متعلق به OpenAI** استفاده کنید. OAuth مربوط به Codex چت/تکمیل‌ها را پوشش می‌دهد و
    دسترسی به embeddings را **اعطا نمی‌کند**، بنابراین **ورود با Codex (OAuth یا
    ورود Codex CLI)** برای جست‌وجوی حافظهٔ معنایی کمکی نمی‌کند. embeddings متعلق به OpenAI
    همچنان به یک کلید API واقعی نیاز دارند (`OPENAI_API_KEY` یا `models.providers.openai.apiKey`).

    اگر ارائه‌دهنده‌ای را صراحتا تنظیم نکنید، OpenClaw وقتی بتواند یک کلید API را
    پیدا کند، به‌طور خودکار یک ارائه‌دهنده را انتخاب می‌کند (نمایه‌های احراز هویت، `models.providers.*.apiKey`، یا متغیرهای محیطی).
    اگر کلید OpenAI پیدا شود، OpenAI را ترجیح می‌دهد؛ در غیر این صورت اگر کلید Gemini
    پیدا شود Gemini را، سپس Voyage، سپس Mistral. اگر هیچ کلید راه‌دوری در دسترس نباشد، جست‌وجوی حافظه
    تا زمانی که آن را پیکربندی کنید غیرفعال می‌ماند. اگر مسیر مدل محلی
    پیکربندی‌شده و موجود داشته باشید، OpenClaw
    `local` را ترجیح می‌دهد. وقتی صراحتا
    `memorySearch.provider = "ollama"` را تنظیم کنید، Ollama پشتیبانی می‌شود.

    اگر ترجیح می‌دهید محلی بمانید، `memorySearch.provider = "local"` را تنظیم کنید (و در صورت تمایل
    `memorySearch.fallback = "none"`). اگر embeddings متعلق به Gemini را می‌خواهید،
    `memorySearch.provider = "gemini"` را تنظیم کنید و `GEMINI_API_KEY` (یا
    `memorySearch.remote.apiKey`) را ارائه دهید. ما از مدل‌های embedding مربوط به **OpenAI، Gemini، Voyage، Mistral، Ollama، یا local**
    پشتیبانی می‌کنیم - برای جزئیات راه‌اندازی، [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>
</AccordionGroup>

## چیزها کجا روی دیسک قرار دارند

<AccordionGroup>
  <Accordion title="آیا همهٔ داده‌های استفاده‌شده با OpenClaw به‌صورت محلی ذخیره می‌شوند؟">
    نه - **وضعیت OpenClaw محلی است**، اما **سرویس‌های خارجی همچنان آنچه را برایشان می‌فرستید می‌بینند**.

    - **محلی به‌صورت پیش‌فرض:** نشست‌ها، فایل‌های حافظه، پیکربندی، و فضای کاری روی میزبان Gateway قرار دارند
      (`~/.openclaw` + دایرکتوری فضای کاری شما).
    - **راه‌دور از روی ضرورت:** پیام‌هایی که به ارائه‌دهندگان مدل (Anthropic/OpenAI/غیره) می‌فرستید به
      APIهای آن‌ها می‌روند، و پلتفرم‌های چت (WhatsApp/Telegram/Slack/غیره) داده‌های پیام را روی
      سرورهای خودشان ذخیره می‌کنند.
    - **ردپا را شما کنترل می‌کنید:** استفاده از مدل‌های محلی promptها را روی دستگاه شما نگه می‌دارد، اما ترافیک کانال
      همچنان از سرورهای همان کانال عبور می‌کند.

    مرتبط: [فضای کاری عامل](/fa/concepts/agent-workspace)، [حافظه](/fa/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw داده‌هایش را کجا ذخیره می‌کند؟">
    همه‌چیز زیر `$OPENCLAW_STATE_DIR` قرار دارد (پیش‌فرض: `~/.openclaw`):

    | مسیر                                                            | کاربرد                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | پیکربندی اصلی (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | واردسازی OAuth قدیمی (در اولین استفاده در نمایه‌های احراز هویت کپی می‌شود)       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | نمایه‌های احراز هویت (OAuth، کلیدهای API، و `keyRef`/`tokenRef` اختیاری)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | payload اختیاری راز مبتنی بر فایل برای ارائه‌دهندگان SecretRef از نوع `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | فایل سازگاری قدیمی (ورودی‌های ثابت `api_key` پاک‌سازی شده‌اند)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | وضعیت ارائه‌دهنده (مثلا `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | وضعیت جداگانه برای هر عامل (agentDir + نشست‌ها)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | تاریخچه و وضعیت گفت‌وگو (برای هر عامل)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | فرادادهٔ نشست (برای هر عامل)                                       |

    مسیر قدیمی تک‌عاملی: `~/.openclaw/agent/*` (با `openclaw doctor` مهاجرت داده می‌شود).

    **فضای کاری** شما (AGENTS.md، فایل‌های حافظه، skills، و غیره) جداست و از طریق `agents.defaults.workspace` پیکربندی می‌شود (پیش‌فرض: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md باید کجا قرار بگیرند؟">
    این فایل‌ها در **فضای کاری عامل** قرار می‌گیرند، نه در `~/.openclaw`.

    - **فضای کاری (برای هر عامل)**: `AGENTS.md`، `SOUL.md`، `IDENTITY.md`، `USER.md`،
      `MEMORY.md`، `memory/YYYY-MM-DD.md`، و `HEARTBEAT.md` اختیاری.
      ریشهٔ کوچک‌حروف `memory.md` فقط ورودی ترمیم قدیمی است؛ `openclaw doctor --fix`
      وقتی هر دو فایل وجود داشته باشند می‌تواند آن را در `MEMORY.md` ادغام کند.
    - **دایرکتوری وضعیت (`~/.openclaw`)**: پیکربندی، وضعیت کانال/ارائه‌دهنده، نمایه‌های احراز هویت، نشست‌ها، لاگ‌ها،
      و skills مشترک (`~/.openclaw/skills`).

    فضای کاری پیش‌فرض `~/.openclaw/workspace` است و از این طریق قابل پیکربندی است:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    اگر ربات پس از راه‌اندازی مجدد «فراموش» می‌کند، تایید کنید که Gateway در هر بار اجرا از همان
    فضای کاری استفاده می‌کند (و به خاطر داشته باشید: حالت راه‌دور از فضای کاری **میزبان gateway**
    استفاده می‌کند، نه لپ‌تاپ محلی شما).

    نکته: اگر یک رفتار یا ترجیح پایدار می‌خواهید، از ربات بخواهید **آن را در
    AGENTS.md یا MEMORY.md بنویسد**، نه اینکه به تاریخچهٔ چت تکیه کند.

    [فضای کاری عامل](/fa/concepts/agent-workspace) و [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>

  <Accordion title="راهبرد پیشنهادی پشتیبان‌گیری">
    **فضای کاری عامل** خود را در یک مخزن git **خصوصی** قرار دهید و آن را در جایی
    خصوصی (برای مثال GitHub خصوصی) پشتیبان‌گیری کنید. این کار حافظه + فایل‌های AGENTS/SOUL/USER
    را ثبت می‌کند و به شما اجازه می‌دهد بعدا «ذهن» دستیار را بازیابی کنید.

    هیچ چیزی را از زیر `~/.openclaw` commit نکنید (اعتبارنامه‌ها، نشست‌ها، توکن‌ها، یا payloadهای رمزگذاری‌شدهٔ راز).
    اگر به بازیابی کامل نیاز دارید، هم از فضای کاری و هم از دایرکتوری وضعیت
    جداگانه پشتیبان بگیرید (پرسش مهاجرت بالا را ببینید).

    مستندات: [فضای کاری عامل](/fa/concepts/agent-workspace).

  </Accordion>

  <Accordion title="چطور OpenClaw را کاملا حذف نصب کنم؟">
    راهنمای اختصاصی را ببینید: [حذف نصب](/fa/install/uninstall).
  </Accordion>

  <Accordion title="آیا عامل‌ها می‌توانند بیرون از فضای کاری کار کنند؟">
    بله. فضای کاری **cwd پیش‌فرض** و لنگر حافظه است، نه یک sandbox سخت‌گیرانه.
    مسیرهای نسبی داخل فضای کاری resolve می‌شوند، اما مسیرهای مطلق می‌توانند به مکان‌های دیگر
    میزبان دسترسی داشته باشند مگر اینکه sandboxing فعال باشد. اگر به جداسازی نیاز دارید، از
    [`agents.defaults.sandbox`](/fa/gateway/sandboxing) یا تنظیمات sandbox جداگانهٔ هر عامل استفاده کنید. اگر
    می‌خواهید یک مخزن دایرکتوری کاری پیش‌فرض باشد، `workspace` آن عامل را به ریشهٔ مخزن
    اشاره دهید. مخزن OpenClaw فقط کد منبع است؛ مگر اینکه عمدا بخواهید عامل داخل آن کار کند،
    فضای کاری را جدا نگه دارید.

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

  <Accordion title="حالت راه‌دور: محل ذخیرهٔ نشست کجاست؟">
    وضعیت نشست در مالکیت **میزبان gateway** است. اگر در حالت راه‌دور هستید، محل ذخیرهٔ نشستی که برایتان مهم است روی دستگاه راه‌دور است، نه لپ‌تاپ محلی شما. [مدیریت نشست](/fa/concepts/session) را ببینید.
  </Accordion>
</AccordionGroup>

## مبانی پیکربندی

<AccordionGroup>
  <Accordion title="قالب پیکربندی چیست؟ کجاست؟">
    OpenClaw یک پیکربندی **JSON5** اختیاری را از `$OPENCLAW_CONFIG_PATH` می‌خواند (پیش‌فرض: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    اگر فایل وجود نداشته باشد، از پیش‌فرض‌های نسبتا امن استفاده می‌کند (از جمله فضای کاری پیش‌فرض `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='من gateway.bind: "lan" (یا "tailnet") را تنظیم کردم و حالا هیچ چیزی گوش نمی‌دهد / UI می‌گوید غیرمجاز است'>
    bindهای غیر loopback **به یک مسیر معتبر احراز هویت gateway نیاز دارند**. در عمل یعنی:

    - احراز هویت با shared-secret: توکن یا گذرواژه
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
    - برای احراز هویت با گذرواژه، به‌جای آن `gateway.auth.mode: "password"` را همراه با `gateway.auth.password` (یا `OPENCLAW_GATEWAY_PASSWORD`) تنظیم کنید.
    - اگر `gateway.auth.token` / `gateway.auth.password` صراحتا از طریق SecretRef پیکربندی شده و resolve نشده باشد، resolution به‌صورت بسته شکست می‌خورد (بدون پوشاندن با fallback راه‌دور).
    - راه‌اندازی‌های Control UI با shared-secret از طریق `connect.params.auth.token` یا `connect.params.auth.password` احراز هویت می‌شوند (در تنظیمات app/UI ذخیره می‌شود). حالت‌های دارای هویت مانند Tailscale Serve یا `trusted-proxy` به‌جای آن از headerهای درخواست استفاده می‌کنند. از قرار دادن shared secretها در URLها خودداری کنید.
    - با `gateway.auth.mode: "trusted-proxy"`، reverse proxyهای loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح و یک ورودی loopback در `gateway.trustedProxies` نیاز دارند.

  </Accordion>

  <Accordion title="چرا حالا روی localhost به توکن نیاز دارم؟">
    OpenClaw احراز هویت gateway را به‌صورت پیش‌فرض اعمال می‌کند، از جمله loopback. در مسیر پیش‌فرض معمولی، این یعنی احراز هویت توکنی: اگر هیچ مسیر احراز هویت صریحی پیکربندی نشده باشد، راه‌اندازی gateway به حالت توکن resolve می‌شود و برای همان راه‌اندازی یک توکن فقط زمان اجرا تولید می‌کند، بنابراین **کلاینت‌های WS محلی باید احراز هویت شوند**. وقتی کلاینت‌ها به راز پایدار بین راه‌اندازی‌های مجدد نیاز دارند، `gateway.auth.token`، `gateway.auth.password`، `OPENCLAW_GATEWAY_TOKEN`، یا `OPENCLAW_GATEWAY_PASSWORD` را صراحتا پیکربندی کنید. این کار جلوی فراخوانی Gateway توسط فرایندهای محلی دیگر را می‌گیرد.

    اگر مسیر احراز هویت متفاوتی ترجیح می‌دهید، می‌توانید صراحتا حالت گذرواژه را انتخاب کنید (یا برای reverse proxyهای آگاه از هویت، `trusted-proxy`). اگر **واقعا** loopback باز می‌خواهید، در پیکربندی خود `gateway.auth.mode: "none"` را صراحتا تنظیم کنید. Doctor هر زمان می‌تواند برایتان توکن تولید کند: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="آیا پس از تغییر پیکربندی باید راه‌اندازی مجدد کنم؟">
    Gateway پیکربندی را پایش می‌کند و از hot-reload پشتیبانی می‌کند:

    - `gateway.reload.mode: "hybrid"` (پیش‌فرض): تغییرات امن را به‌صورت hot اعمال می‌کند، برای تغییرات حیاتی راه‌اندازی مجدد می‌کند
    - `hot`، `restart`، `off` نیز پشتیبانی می‌شوند

  </Accordion>

  <Accordion title="چطور taglineهای بامزهٔ CLI را غیرفعال کنم؟">
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

    - `off`: متن tagline را پنهان می‌کند اما خط عنوان/نسخهٔ banner را نگه می‌دارد.
    - `default`: هر بار از `All your chats, one OpenClaw.` استفاده می‌کند.
    - `random`: taglineهای بامزه/فصلی چرخشی (رفتار پیش‌فرض).
    - اگر اصلا banner نمی‌خواهید، env `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

  </Accordion>

  <Accordion title="چطور جست‌وجوی وب (و واکشی وب) را فعال کنم؟">
    `web_fetch` بدون کلید API کار می‌کند. `web_search` به ارائه‌دهندهٔ انتخاب‌شدهٔ شما
    بستگی دارد:

    - ارائه‌دهندگان مبتنی بر API مانند Brave، Exa، Firecrawl، Gemini، Grok، Kimi، MiniMax Search، Perplexity، و Tavily به راه‌اندازی کلید API معمول خود نیاز دارند.
    - Ollama Web Search بدون کلید است، اما از میزبان Ollama پیکربندی‌شدهٔ شما استفاده می‌کند و به `ollama signin` نیاز دارد.
    - DuckDuckGo بدون کلید است، اما یک integration غیررسمی مبتنی بر HTML است.
    - SearXNG بدون کلید/خودمیزبان است؛ `SEARXNG_BASE_URL` یا `plugins.entries.searxng.config.webSearch.baseUrl` را پیکربندی کنید.

    **پیشنهاد می‌شود:** `openclaw configure --section web` را اجرا کنید و یک ارائه‌دهنده انتخاب کنید.
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

    پیکربندی جست‌وجوی وب ویژهٔ هر ارائه‌دهنده اکنون زیر `plugins.entries.<plugin>.config.webSearch.*` قرار دارد.
    مسیرهای قدیمی ارائه‌دهنده در `tools.web.search.*` فعلاً برای سازگاری بارگذاری می‌شوند، اما نباید برای پیکربندی‌های جدید استفاده شوند.
    پیکربندی جایگزین واکشی وب Firecrawl زیر `plugins.entries.firecrawl.config.webFetch.*` قرار دارد.

    نکات:

    - اگر از فهرست‌های مجاز استفاده می‌کنید، `web_search`/`web_fetch`/`x_search` یا `group:web` را اضافه کنید.
    - `web_fetch` به‌طور پیش‌فرض فعال است (مگر اینکه صریحاً غیرفعال شده باشد).
    - اگر `tools.web.fetch.provider` حذف شود، OpenClaw نخستین ارائه‌دهندهٔ جایگزین آمادهٔ واکشی را از میان اعتبارنامه‌های موجود به‌طور خودکار شناسایی می‌کند. امروز ارائه‌دهندهٔ همراه Firecrawl است.
    - دیمون‌ها متغیرهای محیطی را از `~/.openclaw/.env` (یا محیط سرویس) می‌خوانند.

    مستندات: [ابزارهای وب](/fa/tools/web).

  </Accordion>

  <Accordion title="config.apply پیکربندی من را پاک کرد. چگونه بازیابی کنم و جلوی آن را بگیرم؟">
    `config.apply` **کل پیکربندی** را جایگزین می‌کند. اگر یک شیء جزئی ارسال کنید، همه‌چیز
    دیگر حذف می‌شود.

    نسخهٔ فعلی OpenClaw از بسیاری بازنویسی‌های تصادفی جلوگیری می‌کند:

    - نوشتن‌های پیکربندی متعلق به OpenClaw، پیش از نوشتن، کل پیکربندی پس از تغییر را اعتبارسنجی می‌کنند.
    - نوشتن‌های نامعتبر یا مخرب متعلق به OpenClaw رد می‌شوند و به‌صورت `openclaw.json.rejected.*` ذخیره می‌شوند.
    - اگر یک ویرایش مستقیم راه‌اندازی یا بارگذاری مجدد داغ را خراب کند، Gateway بسته شکست می‌خورد یا بارگذاری مجدد را رد می‌کند؛ `openclaw.json` را بازنویسی نمی‌کند.
    - `openclaw doctor --fix` مالک تعمیر است و می‌تواند آخرین نسخهٔ سالم شناخته‌شده را بازیابی کند و در همان حال فایل ردشده را به‌صورت `openclaw.json.clobbered.*` ذخیره کند.

    بازیابی:

    - `openclaw logs --follow` را برای `Invalid config at`، `Config write rejected:`، یا `config reload skipped (invalid config)` بررسی کنید.
    - تازه‌ترین `openclaw.json.clobbered.*` یا `openclaw.json.rejected.*` کنار پیکربندی فعال را بررسی کنید.
    - `openclaw config validate` و `openclaw doctor --fix` را اجرا کنید.
    - فقط کلیدهای موردنظر را با `openclaw config set` یا `config.patch` برگردانید.
    - اگر آخرین نسخهٔ سالم شناخته‌شده یا محتوای ردشده ندارید، از پشتیبان بازیابی کنید، یا `openclaw doctor` را دوباره اجرا کنید و کانال‌ها/مدل‌ها را دوباره پیکربندی کنید.
    - اگر این غیرمنتظره بود، یک باگ ثبت کنید و آخرین پیکربندی شناخته‌شده یا هر نسخهٔ پشتیبان را ضمیمه کنید.
    - یک عامل کدنویسی محلی اغلب می‌تواند از روی لاگ‌ها یا تاریخچه یک پیکربندی کارا را بازسازی کند.

    جلوگیری:

    - برای تغییرات کوچک از `openclaw config set` استفاده کنید.
    - برای ویرایش‌های تعاملی از `openclaw configure` استفاده کنید.
    - وقتی دربارهٔ مسیر دقیق یا شکل فیلد مطمئن نیستید، ابتدا از `config.schema.lookup` استفاده کنید؛ این فرمان یک گرهٔ سطحی از schema به‌همراه خلاصه‌های فرزند بلافصل برای کاوش عمیق‌تر برمی‌گرداند.
    - برای ویرایش‌های جزئی RPC از `config.patch` استفاده کنید؛ `config.apply` را فقط برای جایگزینی کامل پیکربندی نگه دارید.
    - اگر از ابزار فقط-مالک `gateway` در اجرای یک عامل استفاده می‌کنید، همچنان نوشتن در `tools.exec.ask` / `tools.exec.security` (از جمله نام‌های مستعار قدیمی `tools.bash.*` که به همان مسیرهای محافظت‌شدهٔ exec نرمال‌سازی می‌شوند) را رد خواهد کرد.

    مستندات: [پیکربندی](/fa/cli/config)، [پیکربندی تعاملی](/fa/cli/configure)، [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-rejected-invalid-config)، [Doctor](/fa/gateway/doctor).

  </Accordion>

  <Accordion title="چگونه یک Gateway مرکزی با کارگرهای تخصصی روی دستگاه‌های مختلف اجرا کنم؟">
    الگوی رایج **یک Gateway** (مثلاً Raspberry Pi) به‌همراه **نودها** و **عامل‌ها** است:

    - **Gateway (مرکزی):** مالک کانال‌ها (Signal/WhatsApp)، مسیریابی، و نشست‌هاست.
    - **نودها (دستگاه‌ها):** Mac/iOS/Android به‌عنوان ابزارهای جانبی متصل می‌شوند و ابزارهای محلی (`system.run`، `canvas`، `camera`) را ارائه می‌کنند.
    - **عامل‌ها (کارگرها):** مغزها/فضاهای کاری جدا برای نقش‌های خاص (مثلاً "عملیات Hetzner"، "داده‌های شخصی").
    - **زیرعامل‌ها:** وقتی موازی‌سازی می‌خواهید، کار پس‌زمینه را از یک عامل اصلی ایجاد می‌کنند.
    - **TUI:** به Gateway وصل شوید و بین عامل‌ها/نشست‌ها جابه‌جا شوید.

    مستندات: [نودها](/fa/nodes)، [دسترسی از راه دور](/fa/gateway/remote)، [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [زیرعامل‌ها](/fa/tools/subagents)، [TUI](/fa/web/tui).

  </Accordion>

  <Accordion title="آیا مرورگر OpenClaw می‌تواند headless اجرا شود؟">
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

    مقدار پیش‌فرض `false` است (با رابط گرافیکی). حالت headless در برخی سایت‌ها بیشتر احتمال دارد بررسی‌های ضدربات را فعال کند. [مرورگر](/fa/tools/browser) را ببینید.

    حالت headless از **همان موتور Chromium** استفاده می‌کند و برای بیشتر خودکارسازی‌ها (فرم‌ها، کلیک‌ها، scraping، ورودها) کار می‌کند. تفاوت‌های اصلی:

    - پنجرهٔ مرورگر قابل‌مشاهده‌ای وجود ندارد (اگر به تصویر نیاز دارید از اسکرین‌شات استفاده کنید).
    - برخی سایت‌ها دربارهٔ خودکارسازی در حالت headless سخت‌گیرترند (CAPTCHAها، ضدربات).
      برای مثال، X/Twitter اغلب نشست‌های headless را مسدود می‌کند.

  </Accordion>

  <Accordion title="چگونه از Brave برای کنترل مرورگر استفاده کنم؟">
    `browser.executablePath` را روی باینری Brave خود (یا هر مرورگر مبتنی بر Chromium) تنظیم کنید و Gateway را دوباره راه‌اندازی کنید.
    نمونه‌های کامل پیکربندی را در [مرورگر](/fa/tools/browser#use-brave-or-another-chromium-based-browser) ببینید.
  </Accordion>
</AccordionGroup>

## Gatewayها و نودهای راه دور

<AccordionGroup>
  <Accordion title="فرمان‌ها چگونه بین Telegram، gateway، و نودها منتشر می‌شوند؟">
    پیام‌های Telegram توسط **gateway** مدیریت می‌شوند. gateway عامل را اجرا می‌کند و
    فقط وقتی به ابزار نود نیاز باشد، سپس از طریق **Gateway WebSocket** نودها را فراخوانی می‌کند:

    Telegram → Gateway → عامل → `node.*` → نود → Gateway → Telegram

    نودها ترافیک ورودی ارائه‌دهنده را نمی‌بینند؛ آن‌ها فقط فراخوانی‌های RPC نود را دریافت می‌کنند.

  </Accordion>

  <Accordion title="اگر Gateway از راه دور میزبانی شود، عامل من چگونه می‌تواند به رایانهٔ من دسترسی داشته باشد؟">
    پاسخ کوتاه: **رایانهٔ خود را به‌عنوان یک نود جفت کنید**. Gateway در جای دیگری اجرا می‌شود، اما می‌تواند
    ابزارهای `node.*` (صفحه‌نمایش، دوربین، سیستم) را روی دستگاه محلی شما از طریق Gateway WebSocket فراخوانی کند.

    راه‌اندازی معمول:

    1. Gateway را روی میزبان همیشه‌روشن (VPS/سرور خانگی) اجرا کنید.
    2. میزبان Gateway و رایانهٔ خود را در یک tailnet قرار دهید.
    3. مطمئن شوید Gateway WS قابل دسترس است (اتصال tailnet یا تونل SSH).
    4. برنامهٔ macOS را به‌صورت محلی باز کنید و در حالت **Remote over SSH** (یا tailnet مستقیم) وصل شوید
       تا بتواند به‌عنوان نود ثبت شود.
    5. نود را روی Gateway تأیید کنید:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    به پل TCP جداگانه‌ای نیاز نیست؛ نودها از طریق Gateway WebSocket وصل می‌شوند.

    یادآوری امنیتی: جفت‌کردن یک نود macOS امکان `system.run` را روی آن دستگاه فراهم می‌کند. فقط
    دستگاه‌هایی را جفت کنید که به آن‌ها اعتماد دارید، و [امنیت](/fa/gateway/security) را مرور کنید.

    مستندات: [نودها](/fa/nodes)، [پروتکل Gateway](/fa/gateway/protocol)، [حالت راه دور macOS](/fa/platforms/mac/remote)، [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="Tailscale وصل است اما پاسخی دریافت نمی‌کنم. حالا چه کنم؟">
    موارد پایه را بررسی کنید:

    - Gateway در حال اجراست: `openclaw gateway status`
    - سلامت Gateway: `openclaw status`
    - سلامت کانال: `openclaw channels status`

    سپس احراز هویت و مسیریابی را بررسی کنید:

    - اگر از Tailscale Serve استفاده می‌کنید، مطمئن شوید `gateway.auth.allowTailscale` درست تنظیم شده است.
    - اگر از طریق تونل SSH وصل می‌شوید، تأیید کنید تونل محلی بالا است و به پورت درست اشاره می‌کند.
    - تأیید کنید فهرست‌های مجاز شما (DM یا گروه) حساب شما را شامل می‌شوند.

    مستندات: [Tailscale](/fa/gateway/tailscale)، [دسترسی از راه دور](/fa/gateway/remote)، [کانال‌ها](/fa/channels).

  </Accordion>

  <Accordion title="آیا دو نمونهٔ OpenClaw می‌توانند با هم صحبت کنند (محلی + VPS)؟">
    بله. پل داخلی «بات-به-بات» وجود ندارد، اما می‌توانید آن را به چند روش
    قابل‌اعتماد وصل کنید:

    **ساده‌ترین:** از یک کانال گفت‌وگوی معمولی استفاده کنید که هر دو بات به آن دسترسی دارند (Telegram/Slack/WhatsApp).
    بگذارید Bot A پیامی به Bot B بفرستد، سپس Bot B طبق معمول پاسخ دهد.

    **پل CLI (عمومی):** اسکریپتی اجرا کنید که Gateway دیگر را با
    `openclaw agent --message ... --deliver` فراخوانی کند و گفت‌وگویی را هدف بگیرد که بات دیگر
    در آن گوش می‌دهد. اگر یک بات روی VPS راه دور است، CLI خود را از طریق SSH/Tailscale به آن Gateway راه دور
    اشاره دهید ([دسترسی از راه دور](/fa/gateway/remote) را ببینید).

    الگوی نمونه (از دستگاهی اجرا کنید که می‌تواند به Gateway هدف برسد):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نکته: یک محافظ اضافه کنید تا دو بات بی‌پایان وارد چرخه نشوند (فقط با منشن، فهرست‌های مجاز کانال،
    یا قاعدهٔ «به پیام‌های بات پاسخ نده»).

    مستندات: [دسترسی از راه دور](/fa/gateway/remote)، [CLI عامل](/fa/cli/agent)، [ارسال عامل](/fa/tools/agent-send).

  </Accordion>

  <Accordion title="آیا برای چند عامل به VPSهای جداگانه نیاز دارم؟">
    نه. یک Gateway می‌تواند چند عامل را میزبانی کند، هرکدام با فضای کاری، پیش‌فرض‌های مدل،
    و مسیریابی خودش. این راه‌اندازی معمول است و بسیار ارزان‌تر و ساده‌تر از اجرای
    یک VPS برای هر عامل است.

    فقط وقتی به VPSهای جداگانه نیاز دارید که ایزوله‌سازی سخت (مرزهای امنیتی) یا پیکربندی‌های بسیار
    متفاوت لازم دارید که نمی‌خواهید مشترک باشند. در غیر این صورت، یک Gateway نگه دارید و
    از چند عامل یا زیرعامل استفاده کنید.

  </Accordion>

  <Accordion title="آیا استفاده از نود روی لپ‌تاپ شخصی‌ام به‌جای SSH از VPS مزیتی دارد؟">
    بله - نودها روش درجه‌اول برای دسترسی از یک Gateway راه دور به لپ‌تاپ شما هستند، و
    چیزی فراتر از دسترسی شل فراهم می‌کنند. Gateway روی macOS/Linux (Windows از طریق WSL2) اجرا می‌شود و
    سبک است (یک VPS کوچک یا دستگاهی در حد Raspberry Pi کافی است؛ 4 GB RAM کاملاً کافی است)، بنابراین راه‌اندازی رایج
    یک میزبان همیشه‌روشن به‌همراه لپ‌تاپ شما به‌عنوان نود است.

    - **SSH ورودی لازم نیست.** نودها به Gateway WebSocket اتصال خروجی برقرار می‌کنند و از جفت‌سازی دستگاه استفاده می‌کنند.
    - **کنترل‌های اجرای امن‌تر.** `system.run` با فهرست‌های مجاز/تأییدهای نود روی همان لپ‌تاپ کنترل می‌شود.
    - **ابزارهای دستگاه بیشتر.** نودها افزون بر `system.run`، `canvas`، `camera`، و `screen` را ارائه می‌کنند.
    - **خودکارسازی مرورگر محلی.** Gateway را روی VPS نگه دارید، اما Chrome را به‌صورت محلی از طریق میزبان نود روی لپ‌تاپ اجرا کنید، یا از طریق Chrome MCP به Chrome محلی روی میزبان متصل شوید.

    SSH برای دسترسی موردی به شل مناسب است، اما نودها برای گردش‌کارهای مداوم عامل و
    خودکارسازی دستگاه ساده‌ترند.

    مستندات: [نودها](/fa/nodes)، [CLI نودها](/fa/cli/nodes)، [مرورگر](/fa/tools/browser).

  </Accordion>

  <Accordion title="آیا نودها سرویس gateway اجرا می‌کنند؟">
    نه. فقط **یک gateway** باید روی هر میزبان اجرا شود، مگر اینکه عمداً پروفایل‌های ایزوله اجرا کنید ([چند Gateway](/fa/gateway/multiple-gateways) را ببینید). نودها ابزارهای جانبی هستند که به gateway متصل می‌شوند
    (نودهای iOS/Android، یا «حالت نود» macOS در برنامهٔ menubar). برای میزبان‌های نود headless
    و کنترل CLI، [CLI میزبان نود](/fa/cli/node) را ببینید.

    برای تغییرات سطح `gateway`، `discovery`، و Plugin میزبانی‌شده، راه‌اندازی مجدد کامل لازم است.

  </Accordion>

  <Accordion title="آیا راه API / RPC برای اعمال پیکربندی وجود دارد؟">
    بله.

    - `config.schema.lookup`: پیش از نوشتن، یک زیردرخت پیکربندی را همراه با گره schema سطحی، راهنمای UI منطبق، و خلاصه‌های فرزند بلافصل بررسی کنید
    - `config.get`: snapshot + hash فعلی را واکشی کنید
    - `config.patch`: به‌روزرسانی جزئی امن (برای بیشتر ویرایش‌های RPC ترجیح داده می‌شود)؛ هرجا ممکن باشد hot-reload می‌کند و هرجا لازم باشد راه‌اندازی مجدد می‌کند
    - `config.apply`: اعتبارسنجی + جایگزینی کامل پیکربندی؛ هرجا ممکن باشد hot-reload می‌کند و هرجا لازم باشد راه‌اندازی مجدد می‌کند
    - ابزار runtime مالک‌محور `gateway` همچنان از بازنویسی `tools.exec.ask` / `tools.exec.security` خودداری می‌کند؛ aliasهای قدیمی `tools.bash.*` به همان مسیرهای exec محافظت‌شده نرمال‌سازی می‌شوند

  </Accordion>

  <Accordion title="حداقل پیکربندی معقول برای نصب اول">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    این کار workspace شما را تنظیم می‌کند و محدود می‌کند چه کسی بتواند bot را فعال کند.

  </Accordion>

  <Accordion title="چگونه Tailscale را روی یک VPS راه‌اندازی کنم و از Mac خودم وصل شوم؟">
    مراحل حداقلی:

    1. **نصب + ورود روی VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **نصب + ورود روی Mac**
       - از برنامه Tailscale استفاده کنید و وارد همان tailnet شوید.
    3. **فعال‌سازی MagicDNS (توصیه‌شده)**
       - در کنسول ادمین Tailscale، MagicDNS را فعال کنید تا VPS نامی پایدار داشته باشد.
    4. **استفاده از hostname مربوط به tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    اگر Control UI را بدون SSH می‌خواهید، از Tailscale Serve روی VPS استفاده کنید:

    ```bash
    openclaw gateway --tailscale serve
    ```

    این کار gateway را متصل به loopback نگه می‌دارد و HTTPS را از طریق Tailscale در دسترس می‌گذارد. [Tailscale](/fa/gateway/tailscale) را ببینید.

  </Accordion>

  <Accordion title="چگونه یک Node روی Mac را به یک Gateway راه‌دور وصل کنم (Tailscale Serve)؟">
    Serve، **Gateway Control UI + WS** را در دسترس می‌گذارد. Nodeها از طریق همان endpoint مربوط به Gateway WS وصل می‌شوند.

    راه‌اندازی پیشنهادی:

    1. **مطمئن شوید VPS + Mac روی یک tailnet هستند**.
    2. **از برنامه macOS در حالت Remote استفاده کنید** (هدف SSH می‌تواند hostname مربوط به tailnet باشد).
       برنامه پورت Gateway را tunnel می‌کند و به‌عنوان یک Node وصل می‌شود.
    3. **Node را روی gateway تأیید کنید**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    مستندات: [پروتکل Gateway](/fa/gateway/protocol)، [کشف](/fa/gateway/discovery)، [حالت راه‌دور macOS](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="آیا باید روی یک لپ‌تاپ دوم نصب کنم یا فقط یک Node اضافه کنم؟">
    اگر فقط به **ابزارهای محلی** (screen/camera/exec) روی لپ‌تاپ دوم نیاز دارید، آن را به‌عنوان یک
    **Node** اضافه کنید. این کار یک Gateway واحد را حفظ می‌کند و از پیکربندی تکراری جلوگیری می‌کند. ابزارهای Node محلی
    در حال حاضر فقط برای macOS هستند، اما قصد داریم آن‌ها را به سیستم‌عامل‌های دیگر هم گسترش دهیم.

    فقط زمانی یک Gateway دوم نصب کنید که به **جداسازی سخت‌گیرانه** یا دو bot کاملاً جدا نیاز دارید.

    مستندات: [Nodeها](/fa/nodes)، [CLI مربوط به Nodeها](/fa/cli/nodes)، [چند Gateway](/fa/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغیرهای محیطی و بارگذاری .env

<AccordionGroup>
  <Accordion title="OpenClaw چگونه متغیرهای محیطی را بارگذاری می‌کند؟">
    OpenClaw متغیرهای محیطی را از فرایند والد (shell، launchd/systemd، CI، و غیره) می‌خواند و علاوه بر آن موارد زیر را بارگذاری می‌کند:

    - `.env` از دایرکتوری کاری فعلی
    - یک fallback سراسری `.env` از `~/.openclaw/.env` (یا همان `$OPENCLAW_STATE_DIR/.env`)

    هیچ‌کدام از فایل‌های `.env` متغیرهای محیطی موجود را override نمی‌کنند.

    همچنین می‌توانید متغیرهای محیطی inline را در پیکربندی تعریف کنید (فقط اگر در process env وجود نداشته باشند اعمال می‌شوند):

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

  <Accordion title="Gateway را از طریق سرویس شروع کردم و متغیرهای محیطی‌ام ناپدید شدند. حالا چه کنم؟">
    دو راه‌حل رایج:

    1. کلیدهای گم‌شده را در `~/.openclaw/.env` قرار دهید تا حتی وقتی سرویس env مربوط به shell شما را به ارث نمی‌برد، دریافت شوند.
    2. import از shell را فعال کنید (سهولت opt-in):

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

    این کار login shell شما را اجرا می‌کند و فقط کلیدهای مورد انتظارِ گم‌شده را import می‌کند (هرگز override نمی‌کند). معادل‌های متغیر محیطی:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='من COPILOT_GITHUB_TOKEN را تنظیم کردم، اما وضعیت مدل‌ها "Shell env: off." نشان می‌دهد. چرا؟'>
    `openclaw models status` گزارش می‌دهد که آیا **import از shell env** فعال است یا نه. "Shell env: off"
    به این معنی **نیست** که متغیرهای محیطی شما گم شده‌اند - فقط یعنی OpenClaw به‌طور خودکار
    login shell شما را بارگذاری نمی‌کند.

    اگر Gateway به‌عنوان سرویس (launchd/systemd) اجرا شود، environment مربوط به shell شما را
    به ارث نمی‌برد. با انجام یکی از این کارها اصلاحش کنید:

    1. token را در `~/.openclaw/.env` قرار دهید:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. یا import از shell را فعال کنید (`env.shellEnv.enabled: true`).
    3. یا آن را به بلوک `env` در پیکربندی خود اضافه کنید (فقط اگر موجود نباشد اعمال می‌شود).

    سپس gateway را راه‌اندازی مجدد کنید و دوباره بررسی کنید:

    ```bash
    openclaw models status
    ```

    tokenهای Copilot از `COPILOT_GITHUB_TOKEN` (همچنین `GH_TOKEN` / `GITHUB_TOKEN`) خوانده می‌شوند.
    [/concepts/model-providers](/fa/concepts/model-providers) و [/environment](/fa/help/environment) را ببینید.

  </Accordion>
</AccordionGroup>

## نشست‌ها و چند chat

<AccordionGroup>
  <Accordion title="چگونه یک گفت‌وگوی تازه شروع کنم؟">
    `/new` یا `/reset` را به‌عنوان یک پیام مستقل بفرستید. [مدیریت نشست](/fa/concepts/session) را ببینید.
  </Accordion>

  <Accordion title="اگر هرگز /new نفرستم، آیا نشست‌ها خودکار reset می‌شوند؟">
    نشست‌ها می‌توانند پس از `session.idleMinutes` منقضی شوند، اما این قابلیت **به‌طور پیش‌فرض غیرفعال است** (پیش‌فرض **0**).
    برای فعال‌سازی انقضای بی‌کاری، آن را روی یک مقدار مثبت تنظیم کنید. وقتی فعال باشد، پیام **بعدی**
    پس از دوره بی‌کاری، یک session id تازه برای همان chat key شروع می‌کند.
    این کار transcriptها را حذف نمی‌کند - فقط یک نشست جدید شروع می‌کند.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="آیا راهی هست که یک تیم از instanceهای OpenClaw بسازم (یک CEO و تعداد زیادی عامل)؟">
    بله، از طریق **مسیریابی چندعاملی** و **عامل‌های فرعی**. می‌توانید یک عامل هماهنگ‌کننده
    و چند عامل worker با workspaceها و مدل‌های خودشان بسازید.

    با این حال، بهتر است این را یک **آزمایش سرگرم‌کننده** ببینید. مصرف token آن زیاد است و اغلب
    از استفاده از یک bot با نشست‌های جداگانه کم‌بازده‌تر است. مدل معمولی که
    تصور می‌کنیم یک bot است که با آن صحبت می‌کنید، با نشست‌های مختلف برای کار موازی. آن
    bot همچنین می‌تواند در صورت نیاز عامل‌های فرعی ایجاد کند.

    مستندات: [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [عامل‌های فرعی](/fa/tools/subagents)، [CLI عامل‌ها](/fa/cli/agents).

  </Accordion>

  <Accordion title="چرا context در میانه کار truncate شد؟ چگونه از آن جلوگیری کنم؟">
    context نشست به window مدل محدود است. chatهای طولانی، خروجی‌های بزرگ ابزارها، یا فایل‌های زیاد
    می‌توانند باعث Compaction یا truncation شوند.

    چیزهایی که کمک می‌کنند:

    - از bot بخواهید وضعیت فعلی را خلاصه کند و در یک فایل بنویسد.
    - پیش از کارهای طولانی از `/compact` استفاده کنید، و هنگام تغییر موضوع از `/new`.
    - context مهم را در workspace نگه دارید و از bot بخواهید دوباره آن را بخواند.
    - برای کارهای طولانی یا موازی از عامل‌های فرعی استفاده کنید تا chat اصلی کوچک‌تر بماند.
    - اگر این اتفاق زیاد می‌افتد، مدلی با window بزرگ‌تر برای context انتخاب کنید.

  </Accordion>

  <Accordion title="چگونه OpenClaw را کامل reset کنم اما نصب‌شده نگه دارم؟">
    از دستور reset استفاده کنید:

    ```bash
    openclaw reset
    ```

    reset کامل غیرتعاملی:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    سپس setup را دوباره اجرا کنید:

    ```bash
    openclaw onboard --install-daemon
    ```

    نکات:

    - اگر onboarding یک پیکربندی موجود ببیند، **Reset** را هم پیشنهاد می‌دهد. [Onboarding (CLI)](/fa/start/wizard) را ببینید.
    - اگر از profileها (`--profile` / `OPENCLAW_PROFILE`) استفاده کرده‌اید، هر state dir را reset کنید (پیش‌فرض‌ها `~/.openclaw-<profile>` هستند).
    - reset مخصوص dev: `openclaw gateway --dev --reset` (فقط dev؛ پیکربندی dev + credentials + نشست‌ها + workspace را پاک می‌کند).

  </Accordion>

  <Accordion title='خطاهای "context too large" می‌گیرم - چگونه reset یا compact کنم؟'>
    از یکی از این‌ها استفاده کنید:

    - **Compact** (گفت‌وگو را نگه می‌دارد اما turnهای قدیمی‌تر را خلاصه می‌کند):

      ```
      /compact
      ```

      یا `/compact <instructions>` برای هدایت خلاصه.

    - **Reset** (session ID تازه برای همان chat key):

      ```
      /new
      /reset
      ```

    اگر همچنان رخ می‌دهد:

    - **هرس نشست** (`agents.defaults.contextPruning`) را فعال یا تنظیم کنید تا خروجی ابزارهای قدیمی trim شود.
    - از مدلی با window بزرگ‌تر برای context استفاده کنید.

    مستندات: [Compaction](/fa/concepts/compaction)، [هرس نشست](/fa/concepts/session-pruning)، [مدیریت نشست](/fa/concepts/session).

  </Accordion>

  <Accordion title='چرا "LLM request rejected: messages.content.tool_use.input field required" را می‌بینم؟'>
    این یک خطای اعتبارسنجی provider است: مدل یک بلوک `tool_use` بدون `input` موردنیاز
    تولید کرده است. معمولاً یعنی تاریخچه نشست stale یا خراب شده است (اغلب پس از threadهای طولانی
    یا تغییر ابزار/schema).

    رفع: یک نشست تازه با `/new` شروع کنید (پیام مستقل).

  </Accordion>

  <Accordion title="چرا هر ۳۰ دقیقه پیام‌های heartbeat می‌گیرم؟">
    Heartbeatها به‌طور پیش‌فرض هر **30m** اجرا می‌شوند (**1h** هنگام استفاده از OAuth auth). آن‌ها را تنظیم یا غیرفعال کنید:

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

    اگر `HEARTBEAT.md` وجود داشته باشد اما عملاً خالی باشد (فقط خطوط خالی و headerهای markdown
    مثل `# Heading`)، OpenClaw اجرای Heartbeat را برای صرفه‌جویی در API callها رد می‌کند.
    اگر فایل وجود نداشته باشد، Heartbeat همچنان اجرا می‌شود و مدل تصمیم می‌گیرد چه کند.

    overrideهای هر عامل از `agents.list[].heartbeat` استفاده می‌کنند. مستندات: [Heartbeat](/fa/gateway/heartbeat).

  </Accordion>

  <Accordion title='آیا باید یک "bot account" به یک گروه WhatsApp اضافه کنم؟'>
    نه. OpenClaw روی **حساب خود شما** اجرا می‌شود، بنابراین اگر شما در گروه باشید، OpenClaw می‌تواند آن را ببیند.
    به‌طور پیش‌فرض، پاسخ‌های گروهی تا وقتی فرستنده‌ها را مجاز نکنید مسدود هستند (`groupPolicy: "allowlist"`).

    اگر می‌خواهید فقط **خودتان** بتوانید پاسخ‌های گروهی را فعال کنید:

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

  <Accordion title="چگونه JID یک گروه WhatsApp را به دست بیاورم؟">
    گزینه ۱ (سریع‌ترین): logها را tail کنید و یک پیام آزمایشی در گروه بفرستید:

    ```bash
    openclaw logs --follow --json
    ```

    دنبال `chatId` (یا `from`) بگردید که به `@g.us` ختم می‌شود، مثل:
    `1234567890-1234567890@g.us`.

    گزینه ۲ (اگر از قبل پیکربندی/allowlist شده است): گروه‌ها را از پیکربندی فهرست کنید:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    مستندات: [WhatsApp](/fa/channels/whatsapp)، [دایرکتوری](/fa/cli/directory)، [Logها](/fa/cli/logs).

  </Accordion>

  <Accordion title="چرا OpenClaw در یک گروه پاسخ نمی‌دهد؟">
    دو علت رایج:

    - mention gating روشن است (پیش‌فرض). باید bot را @mention کنید (یا با `mentionPatterns` مطابقت داشته باشد).
    - شما `channels.whatsapp.groups` را بدون `"*"` پیکربندی کرده‌اید و گروه در allowlist نیست.

    [گروه‌ها](/fa/channels/groups) و [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.

  </Accordion>

  <Accordion title="آیا گروه‌ها/threadها با DMها context مشترک دارند؟">
    chatهای مستقیم به‌طور پیش‌فرض به نشست اصلی collapse می‌شوند. گروه‌ها/channelها کلیدهای نشست خودشان را دارند، و topicهای Telegram / threadهای Discord نشست‌های جداگانه هستند. [گروه‌ها](/fa/channels/groups) و [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.
  </Accordion>

  <Accordion title="چند فضای کاری و عامل می‌توانم ایجاد کنم؟">
    محدودیت سختی وجود ندارد. ده‌ها مورد (حتی صدها مورد) مشکلی ندارد، اما مراقب این موارد باشید:

    - **رشد دیسک:** نشست‌ها + رونوشت‌ها زیر `~/.openclaw/agents/<agentId>/sessions/` قرار دارند.
    - **هزینه توکن:** عامل‌های بیشتر یعنی استفاده هم‌زمان بیشتر از مدل.
    - **سربار عملیات:** پروفایل‌های احراز هویت، فضاهای کاری، و مسیریابی کانال برای هر عامل.

    نکته‌ها:

    - برای هر عامل یک فضای کاری **فعال** نگه دارید (`agents.defaults.workspace`).
    - اگر دیسک رشد کرد، نشست‌های قدیمی را پاک کنید (حذف JSONL یا ورودی‌های ذخیره).
    - برای پیدا کردن فضاهای کاری سرگردان و ناسازگاری‌های پروفایل از `openclaw doctor` استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم چند ربات یا چت را هم‌زمان اجرا کنم (Slack)، و چگونه باید آن را تنظیم کنم؟">
    بله. از **مسیریابی چندعاملی** برای اجرای چند عامل ایزوله و مسیریابی پیام‌های ورودی بر اساس
    کانال/حساب/همتا استفاده کنید. Slack به‌عنوان یک کانال پشتیبانی می‌شود و می‌تواند به عامل‌های مشخص متصل شود.

    دسترسی مرورگر قدرتمند است، اما به معنی «انجام هر کاری که انسان می‌تواند» نیست - ضدربات، CAPTCHA، و MFA همچنان می‌توانند
    خودکارسازی را مسدود کنند. برای قابل‌اعتمادترین کنترل مرورگر، از Chrome MCP محلی روی میزبان استفاده کنید،
    یا از CDP روی ماشینی استفاده کنید که واقعا مرورگر را اجرا می‌کند.

    تنظیم پیشنهادی:

    - میزبان Gateway همیشه روشن (VPS/Mac mini).
    - یک عامل برای هر نقش (اتصال‌ها).
    - کانال(های) Slack متصل به آن عامل‌ها.
    - مرورگر محلی از طریق Chrome MCP یا یک Node در صورت نیاز.

    مستندات: [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [Slack](/fa/channels/slack)،
    [مرورگر](/fa/tools/browser)، [Nodeها](/fa/nodes).

  </Accordion>
</AccordionGroup>

## مدل‌ها، تغییرمسیر هنگام خرابی، و پروفایل‌های احراز هویت

پرسش‌وپاسخ مدل — پیش‌فرض‌ها، انتخاب، نام‌های مستعار، جابه‌جایی، تغییرمسیر هنگام خرابی، پروفایل‌های احراز هویت —
در [پرسش‌های متداول مدل‌ها](/fa/help/faq-models) قرار دارد.

## Gateway: پورت‌ها، «در حال اجراست»، و حالت راه دور

<AccordionGroup>
  <Accordion title="Gateway از چه پورتی استفاده می‌کند؟">
    `gateway.port` پورت چندمنظوره واحد برای WebSocket + HTTP را کنترل می‌کند (رابط کنترل، hookها، و غیره).

    ترتیب اولویت:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='چرا openclaw gateway status می‌گوید "Runtime: running" اما "Connectivity probe: failed"؟'>
    چون «در حال اجرا» دید **ناظر** است (launchd/systemd/schtasks). آزمون اتصال یعنی CLI واقعا در حال اتصال به WebSocket مربوط به Gateway است.

    از `openclaw gateway status` استفاده کنید و به این خط‌ها اعتماد کنید:

    - `Probe target:` (نشانی URL که آزمون واقعا استفاده کرده است)
    - `Listening:` (چیزی که واقعا روی پورت bind شده است)
    - `Last gateway error:` (علت ریشه‌ای رایج وقتی فرایند زنده است اما پورت گوش نمی‌دهد)

  </Accordion>

  <Accordion title='چرا openclaw gateway status مقدارهای متفاوتی برای "Config (cli)" و "Config (service)" نشان می‌دهد؟'>
    شما در حال ویرایش یک فایل پیکربندی هستید، در حالی که سرویس پیکربندی دیگری را اجرا می‌کند (اغلب ناسازگاری `--profile` / `OPENCLAW_STATE_DIR`).

    رفع مشکل:

    ```bash
    openclaw gateway install --force
    ```

    آن را از همان `--profile` / محیطی اجرا کنید که می‌خواهید سرویس استفاده کند.

  </Accordion>

  <Accordion title='عبارت "another gateway instance is already listening" یعنی چه؟'>
    OpenClaw با bind کردن شنونده WebSocket بلافاصله هنگام راه‌اندازی، یک قفل زمان اجرا اعمال می‌کند (پیش‌فرض `ws://127.0.0.1:18789`). اگر bind با `EADDRINUSE` شکست بخورد، خطای `GatewayLockError` می‌دهد که نشان می‌دهد نمونه دیگری در حال گوش دادن است.

    رفع مشکل: نمونه دیگر را متوقف کنید، پورت را آزاد کنید، یا با `openclaw gateway --port <port>` اجرا کنید.

  </Accordion>

  <Accordion title="چگونه OpenClaw را در حالت راه دور اجرا کنم (کلاینت به Gateway در جای دیگری وصل شود)؟">
    `gateway.mode: "remote"` را تنظیم کنید و به یک URL راه دور WebSocket اشاره کنید، در صورت نیاز همراه با اعتبارنامه‌های راه دور با secret مشترک:

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

    یادداشت‌ها:

    - `openclaw gateway` فقط وقتی شروع می‌شود که `gateway.mode` برابر `local` باشد (یا فلگ override را پاس کنید).
    - برنامه macOS فایل پیکربندی را پایش می‌کند و با تغییر این مقدارها، به‌صورت زنده حالت‌ها را عوض می‌کند.
    - `gateway.remote.token` / `.password` فقط اعتبارنامه‌های راه دور سمت کلاینت هستند؛ به‌تنهایی احراز هویت Gateway محلی را فعال نمی‌کنند.

  </Accordion>

  <Accordion title='رابط کنترل می‌گوید "unauthorized" (یا مدام دوباره وصل می‌شود). حالا چه کار کنم؟'>
    مسیر احراز هویت Gateway شما با روش احراز هویت رابط کاربری مطابقت ندارد.

    واقعیت‌ها (از کد):

    - رابط کنترل توکن را برای نشست تب فعلی مرورگر و URL انتخاب‌شده Gateway در `sessionStorage` نگه می‌دارد، بنابراین تازه‌سازی‌های همان تب بدون بازگردانی تداوم توکن طولانی‌مدت در localStorage همچنان کار می‌کنند.
    - هنگام `AUTH_TOKEN_MISMATCH`، کلاینت‌های قابل‌اعتماد می‌توانند وقتی Gateway راهنمایی‌های تلاش دوباره را برمی‌گرداند (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`)، یک تلاش دوباره محدود با توکن دستگاه کش‌شده انجام دهند.
    - آن تلاش دوباره با توکن کش‌شده اکنون از همان scopeهای تاییدشده کش‌شده که همراه توکن دستگاه ذخیره شده‌اند دوباره استفاده می‌کند. فراخوان‌های دارای `deviceToken` صریح / `scopes` صریح همچنان به‌جای ارث‌بری از scopeهای کش‌شده، مجموعه scope درخواستی خود را نگه می‌دارند.
    - خارج از آن مسیر تلاش دوباره، اولویت احراز هویت اتصال ابتدا توکن/رمز عبور مشترک صریح است، سپس `deviceToken` صریح، سپس توکن دستگاه ذخیره‌شده، و سپس توکن bootstrap.
    - بررسی‌های scope توکن bootstrap با پیشوند نقش انجام می‌شوند. فهرست مجاز اپراتور bootstrap داخلی فقط درخواست‌های اپراتور را برآورده می‌کند؛ Node یا نقش‌های غیر اپراتور دیگر همچنان به scopeهایی زیر پیشوند نقش خودشان نیاز دارند.

    رفع مشکل:

    - سریع‌ترین راه: `openclaw dashboard` (URL داشبورد را چاپ + کپی می‌کند، تلاش می‌کند باز کند؛ اگر headless باشد راهنمای SSH نشان می‌دهد).
    - اگر هنوز توکن ندارید: `openclaw doctor --generate-gateway-token`.
    - اگر راه دور است، ابتدا تونل بزنید: `ssh -N -L 18789:127.0.0.1:18789 user@host` سپس `http://127.0.0.1:18789/` را باز کنید.
    - حالت secret مشترک: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` یا `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` را تنظیم کنید، سپس secret مطابق را در تنظیمات رابط کنترل جای‌گذاری کنید.
    - حالت Tailscale Serve: مطمئن شوید `gateway.auth.allowTailscale` فعال است و URL مربوط به Serve را باز می‌کنید، نه یک URL خام loopback/tailnet که هدرهای هویت Tailscale را دور می‌زند.
    - حالت پراکسی قابل‌اعتماد: مطمئن شوید از مسیر پراکسی آگاه از هویت پیکربندی‌شده وارد می‌شوید، نه یک URL خام Gateway. پراکسی‌های loopback روی همان میزبان نیز به `gateway.auth.trustedProxy.allowLoopback = true` نیاز دارند.
    - اگر ناسازگاری پس از یک تلاش دوباره ادامه داشت، توکن دستگاه جفت‌شده را بچرخانید/دوباره تایید کنید:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - اگر آن فراخوان rotate گفت رد شده است، دو مورد را بررسی کنید:
      - نشست‌های دستگاه جفت‌شده فقط می‌توانند دستگاه **خودشان** را بچرخانند، مگر اینکه `operator.admin` هم داشته باشند
      - مقدارهای صریح `--scope` نمی‌توانند از scopeهای فعلی اپراتورِ فراخواننده فراتر بروند
    - هنوز گیر کرده‌اید؟ `openclaw status --all` را اجرا کنید و [عیب‌یابی](/fa/gateway/troubleshooting) را دنبال کنید. برای جزئیات احراز هویت، [داشبورد](/fa/web/dashboard) را ببینید.

  </Accordion>

  <Accordion title="gateway.bind را روی tailnet تنظیم کردم اما نمی‌تواند bind کند و چیزی گوش نمی‌دهد">
    bind با `tailnet` یک IP مربوط به Tailscale را از رابط‌های شبکه شما انتخاب می‌کند (100.64.0.0/10). اگر ماشین روی Tailscale نباشد (یا رابط غیرفعال باشد)، چیزی برای bind کردن وجود ندارد.

    رفع مشکل:

    - Tailscale را روی آن میزبان شروع کنید (تا یک نشانی 100.x داشته باشد)، یا
    - به `gateway.bind: "loopback"` / `"lan"` تغییر دهید.

    نکته: `tailnet` صریح است. `auto` loopback را ترجیح می‌دهد؛ وقتی bind فقط برای tailnet می‌خواهید، از `gateway.bind: "tailnet"` استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم چند Gateway را روی یک میزبان اجرا کنم؟">
    معمولا نه - یک Gateway می‌تواند چند کانال پیام‌رسانی و عامل را اجرا کند. فقط وقتی از چند Gateway استفاده کنید که به افزونگی (مثلا ربات نجات) یا ایزولاسیون سخت نیاز دارید.

    بله، اما باید ایزوله کنید:

    - `OPENCLAW_CONFIG_PATH` (پیکربندی برای هر نمونه)
    - `OPENCLAW_STATE_DIR` (وضعیت برای هر نمونه)
    - `agents.defaults.workspace` (ایزولاسیون فضای کاری)
    - `gateway.port` (پورت‌های یکتا)

    تنظیم سریع (پیشنهادی):

    - برای هر نمونه از `openclaw --profile <name> ...` استفاده کنید (به‌صورت خودکار `~/.openclaw-<name>` را ایجاد می‌کند).
    - در پیکربندی هر پروفایل یک `gateway.port` یکتا تنظیم کنید (یا برای اجراهای دستی `--port` را پاس کنید).
    - سرویس هر پروفایل را نصب کنید: `openclaw --profile <name> gateway install`.

    پروفایل‌ها همچنین پسوندی به نام سرویس اضافه می‌کنند (`ai.openclaw.<profile>`؛ قدیمی: `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    راهنمای کامل: [چند Gateway](/fa/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='عبارت "invalid handshake" / کد 1008 یعنی چه؟'>
    Gateway یک **سرور WebSocket** است و انتظار دارد اولین پیام
    یک فریم `connect` باشد. اگر هر چیز دیگری دریافت کند، اتصال را
    با **کد 1008** (نقض سیاست) می‌بندد.

    علت‌های رایج:

    - URL مربوط به **HTTP** را در مرورگر باز کرده‌اید (`http://...`) به‌جای یک کلاینت WS.
    - از پورت یا مسیر اشتباه استفاده کرده‌اید.
    - یک پراکسی یا تونل هدرهای احراز هویت را حذف کرده یا یک درخواست غیر Gateway فرستاده است.

    رفع سریع:

    1. از URL مربوط به WS استفاده کنید: `ws://<host>:18789` (یا اگر HTTPS است `wss://...`).
    2. پورت WS را در یک تب معمولی مرورگر باز نکنید.
    3. اگر احراز هویت فعال است، توکن/رمز عبور را در فریم `connect` وارد کنید.

    اگر از CLI یا TUI استفاده می‌کنید، URL باید شبیه این باشد:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    جزئیات پروتکل: [پروتکل Gateway](/fa/gateway/protocol).

  </Accordion>
</AccordionGroup>

## لاگ‌برداری و اشکال‌زدایی

<AccordionGroup>
  <Accordion title="لاگ‌ها کجا هستند؟">
    لاگ‌های فایل (ساختاریافته):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    می‌توانید از طریق `logging.file` یک مسیر پایدار تنظیم کنید. سطح لاگ فایل با `logging.level` کنترل می‌شود. پرگویی کنسول با `--verbose` و `logging.consoleLevel` کنترل می‌شود.

    سریع‌ترین دنبال کردن لاگ:

    ```bash
    openclaw logs --follow
    ```

    لاگ‌های سرویس/ناظر (وقتی Gateway از طریق launchd/systemd اجرا می‌شود):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` و `gateway.err.log` (پیش‌فرض: `~/.openclaw/logs/...`؛ پروفایل‌ها از `~/.openclaw-<profile>/logs/...` استفاده می‌کنند)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    برای اطلاعات بیشتر [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید.

  </Accordion>

  <Accordion title="چگونه سرویس Gateway را شروع/متوقف/بازراه‌اندازی کنم؟">
    از helperهای Gateway استفاده کنید:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر Gateway را دستی اجرا می‌کنید، `openclaw gateway --force` می‌تواند پورت را بازپس بگیرد. [Gateway](/fa/gateway) را ببینید.

  </Accordion>

  <Accordion title="ترمینالم را در Windows بستم - چگونه OpenClaw را بازراه‌اندازی کنم؟">
    **دو حالت نصب Windows** وجود دارد:

    **1) WSL2 (پیشنهادی):** Gateway داخل Linux اجرا می‌شود.

    PowerShell را باز کنید، وارد WSL شوید، سپس بازراه‌اندازی کنید:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر هرگز سرویس را نصب نکرده‌اید، آن را در foreground شروع کنید:

    ```bash
    openclaw gateway run
    ```

    **2) Windows بومی (پیشنهاد نمی‌شود):** Gateway مستقیما در Windows اجرا می‌شود.

    PowerShell را باز کنید و اجرا کنید:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر آن را دستی اجرا می‌کنید (بدون سرویس)، استفاده کنید:

    ```powershell
    openclaw gateway run
    ```

    مستندات: [Windows (WSL2)](/fa/platforms/windows)، [راهنمای اجرایی سرویس Gateway](/fa/gateway).

  </Accordion>

  <Accordion title="Gateway بالا است اما پاسخ‌ها هرگز نمی‌رسند. چه چیزی را باید بررسی کنم؟">
    با یک بررسی سلامت سریع شروع کنید:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    علت‌های رایج:

    - احراز هویت مدل روی **میزبان Gateway** بارگذاری نشده است (`models status` را بررسی کنید).
    - جفت‌سازی کانال/allowlist پاسخ‌ها را مسدود می‌کند (پیکربندی کانال + لاگ‌ها را بررسی کنید).
    - WebChat/Dashboard بدون توکن درست باز است.

    اگر از راه دور هستید، تأیید کنید اتصال تونل/Tailscale برقرار است و
    WebSocket مربوط به Gateway در دسترس است.

    مستندات: [کانال‌ها](/fa/channels)، [عیب‌یابی](/fa/gateway/troubleshooting)، [دسترسی راه دور](/fa/gateway/remote).

  </Accordion>

  <Accordion title='"ارتباط با gateway قطع شد: بدون دلیل" - حالا چه؟'>
    این معمولاً یعنی UI اتصال WebSocket را از دست داده است. بررسی کنید:

    1. آیا Gateway در حال اجراست؟ `openclaw gateway status`
    2. آیا Gateway سالم است؟ `openclaw status`
    3. آیا UI توکن درست را دارد؟ `openclaw dashboard`
    4. اگر از راه دور هستید، آیا لینک تونل/Tailscale برقرار است؟

    سپس لاگ‌ها را دنبال کنید:

    ```bash
    openclaw logs --follow
    ```

    مستندات: [Dashboard](/fa/web/dashboard)، [دسترسی راه دور](/fa/gateway/remote)، [عیب‌یابی](/fa/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands ناموفق می‌شود. چه چیزی را باید بررسی کنم؟">
    با لاگ‌ها و وضعیت کانال شروع کنید:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    سپس خطا را تطبیق دهید:

    - `BOT_COMMANDS_TOO_MUCH`: منوی Telegram ورودی‌های بیش از حدی دارد. OpenClaw از قبل تعداد را تا سقف Telegram کم می‌کند و با فرمان‌های کمتر دوباره تلاش می‌کند، اما هنوز باید برخی ورودی‌های منو حذف شوند. فرمان‌های Plugin/skill/سفارشی را کاهش دهید، یا اگر به منو نیاز ندارید `channels.telegram.commands.native` را غیرفعال کنید.
    - `TypeError: fetch failed`، `Network request for 'setMyCommands' failed!`، یا خطاهای شبکه مشابه: اگر روی VPS هستید یا پشت پروکسی قرار دارید، تأیید کنید HTTPS خروجی مجاز است و DNS برای `api.telegram.org` کار می‌کند.

    اگر Gateway از راه دور است، مطمئن شوید لاگ‌ها را روی میزبان Gateway می‌بینید.

    مستندات: [Telegram](/fa/channels/telegram)، [عیب‌یابی کانال](/fa/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI خروجی نشان نمی‌دهد. چه چیزی را باید بررسی کنم؟">
    ابتدا تأیید کنید Gateway در دسترس است و عامل می‌تواند اجرا شود:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    در TUI، از `/status` برای دیدن وضعیت فعلی استفاده کنید. اگر انتظار پاسخ در یک
    کانال چت را دارید، مطمئن شوید ارسال فعال است (`/deliver on`).

    مستندات: [TUI](/fa/web/tui)، [فرمان‌های اسلش](/fa/tools/slash-commands).

  </Accordion>

  <Accordion title="چطور Gateway را کاملاً متوقف و سپس شروع کنم؟">
    اگر سرویس را نصب کرده‌اید:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    این کار **سرویس تحت نظارت** را متوقف/شروع می‌کند (launchd روی macOS، systemd روی Linux).
    وقتی Gateway به‌صورت daemon در پس‌زمینه اجرا می‌شود از این استفاده کنید.

    اگر در پیش‌زمینه اجرا می‌کنید، با Ctrl-C متوقف کنید، سپس:

    ```bash
    openclaw gateway run
    ```

    مستندات: [راهنمای عملیاتی سرویس Gateway](/fa/gateway).

  </Accordion>

  <Accordion title="توضیح ساده: openclaw gateway restart در برابر openclaw gateway">
    - `openclaw gateway restart`: **سرویس پس‌زمینه** را دوباره راه‌اندازی می‌کند (launchd/systemd).
    - `openclaw gateway`: gateway را برای همین نشست ترمینال **در پیش‌زمینه** اجرا می‌کند.

    اگر سرویس را نصب کرده‌اید، از فرمان‌های gateway استفاده کنید. وقتی
    یک اجرای یک‌باره و پیش‌زمینه می‌خواهید، از `openclaw gateway` استفاده کنید.

  </Accordion>

  <Accordion title="سریع‌ترین راه برای گرفتن جزئیات بیشتر وقتی چیزی ناموفق می‌شود">
    Gateway را با `--verbose` شروع کنید تا جزئیات بیشتری در کنسول بگیرید. سپس فایل لاگ را برای احراز هویت کانال، مسیریابی مدل، و خطاهای RPC بررسی کنید.
  </Accordion>
</AccordionGroup>

## رسانه و پیوست‌ها

<AccordionGroup>
  <Accordion title="Skill من یک تصویر/PDF تولید کرد، اما چیزی ارسال نشد">
    پیوست‌های خروجی از عامل باید یک خط `MEDIA:<path-or-url>` داشته باشند (در خط جداگانه). [راه‌اندازی دستیار OpenClaw](/fa/start/openclaw) و [ارسال عامل](/fa/tools/agent-send) را ببینید.

    ارسال با CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    همچنین بررسی کنید:

    - کانال مقصد از رسانه خروجی پشتیبانی می‌کند و توسط allowlist مسدود نشده است.
    - فایل در محدوده اندازه ارائه‌دهنده باشد (اندازه تصاویر تا حداکثر 2048px تغییر داده می‌شود).
    - `tools.fs.workspaceOnly=true` ارسال‌های مسیر محلی را به workspace، temp/media-store، و فایل‌های تأییدشده توسط sandbox محدود نگه می‌دارد.
    - `tools.fs.workspaceOnly=false` اجازه می‌دهد `MEDIA:` فایل‌های محلی میزبان را که عامل از قبل می‌تواند بخواند ارسال کند، اما فقط برای رسانه و انواع سند امن (تصویر، صدا، ویدئو، PDF، و اسناد Office). فایل‌های متن ساده و شبیه به secret همچنان مسدود می‌شوند.

    [تصاویر](/fa/nodes/images) را ببینید.

  </Accordion>
</AccordionGroup>

## امنیت و کنترل دسترسی

<AccordionGroup>
  <Accordion title="آیا در معرض قرار دادن OpenClaw برای DMهای ورودی امن است؟">
    DMهای ورودی را ورودی غیرقابل اعتماد در نظر بگیرید. پیش‌فرض‌ها برای کاهش ریسک طراحی شده‌اند:

    - رفتار پیش‌فرض در کانال‌هایی که از DM پشتیبانی می‌کنند **جفت‌سازی** است:
      - فرستنده‌های ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ بات پیام آن‌ها را پردازش نمی‌کند.
      - با این فرمان تأیید کنید: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - درخواست‌های در انتظار به **3 مورد برای هر کانال** محدود می‌شوند؛ اگر کدی نرسید، `openclaw pairing list --channel <channel> [--account <id>]` را بررسی کنید.
    - عمومی کردن DMها نیازمند فعال‌سازی صریح است (`dmPolicy: "open"` و allowlist `"*"`).

    برای آشکار کردن سیاست‌های پرریسک DM، `openclaw doctor` را اجرا کنید.

  </Accordion>

  <Accordion title="آیا prompt injection فقط برای بات‌های عمومی مسئله است؟">
    خیر. prompt injection مربوط به **محتوای غیرقابل اعتماد** است، نه فقط اینکه چه کسی می‌تواند به بات DM بدهد.
    اگر دستیار شما محتوای خارجی را می‌خواند (جست‌وجو/دریافت وب، صفحه‌های مرورگر، ایمیل‌ها،
    مستندات، پیوست‌ها، لاگ‌های چسبانده‌شده)، آن محتوا می‌تواند شامل دستورهایی باشد که تلاش می‌کنند
    مدل را به کنترل خود درآورند. این حتی اگر **شما تنها فرستنده باشید** هم ممکن است رخ دهد.

    بزرگ‌ترین ریسک وقتی است که ابزارها فعال هستند: مدل می‌تواند فریب بخورد تا
    زمینه را استخراج کند یا ابزارها را از طرف شما فراخوانی کند. دامنه آسیب را این‌طور کاهش دهید:

    - استفاده از یک عامل «reader» فقط‌خواندنی یا بدون ابزار برای خلاصه‌سازی محتوای غیرقابل اعتماد
    - خاموش نگه داشتن `web_search` / `web_fetch` / `browser` برای عامل‌های دارای ابزار
    - در نظر گرفتن متن استخراج‌شده از فایل/سند به‌عنوان غیرقابل اعتماد: OpenResponses
      `input_file` و استخراج پیوست رسانه هر دو متن استخراج‌شده را
      به‌جای عبور دادن متن خام فایل، در نشانگرهای صریح مرز محتوای خارجی می‌پیچند
    - sandbox کردن و allowlistهای سخت‌گیرانه ابزارها

    جزئیات: [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="آیا بات من باید ایمیل، حساب GitHub، یا شماره تلفن خودش را داشته باشد؟">
    بله، برای بیشتر راه‌اندازی‌ها. جدا کردن بات با حساب‌ها و شماره‌های تلفن مستقل
    در صورت بروز مشکل دامنه آسیب را کاهش می‌دهد. این کار همچنین چرخاندن
    اعتبارنامه‌ها یا لغو دسترسی را بدون اثر روی حساب‌های شخصی شما آسان‌تر می‌کند.

    کوچک شروع کنید. فقط به ابزارها و حساب‌هایی که واقعاً نیاز دارید دسترسی بدهید، و در صورت
    نیاز بعداً گسترش دهید.

    مستندات: [امنیت](/fa/gateway/security)، [جفت‌سازی](/fa/channels/pairing).

  </Accordion>

  <Accordion title="آیا می‌توانم به آن اختیار پیام‌های متنی‌ام را بدهم و آیا این امن است؟">
    ما اختیار کامل روی پیام‌های شخصی شما را توصیه **نمی‌کنیم**. امن‌ترین الگو این است:

    - DMها را در **حالت جفت‌سازی** یا یک allowlist محدود نگه دارید.
    - اگر می‌خواهید از طرف شما پیام بدهد، از یک **شماره یا حساب جداگانه** استفاده کنید.
    - اجازه دهید پیش‌نویس کند، سپس **پیش از ارسال تأیید کنید**.

    اگر می‌خواهید آزمایش کنید، این کار را روی یک حساب اختصاصی انجام دهید و آن را جدا نگه دارید. ببینید
    [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="آیا می‌توانم برای کارهای دستیار شخصی از مدل‌های ارزان‌تر استفاده کنم؟">
    بله، **اگر** عامل فقط برای چت باشد و ورودی قابل اعتماد باشد. رده‌های کوچک‌تر
    نسبت به ربودن دستورپذیری حساس‌ترند، بنابراین برای عامل‌های دارای ابزار
    یا هنگام خواندن محتوای غیرقابل اعتماد از آن‌ها اجتناب کنید. اگر مجبورید از مدل کوچک‌تر استفاده کنید،
    ابزارها را قفل کنید و داخل sandbox اجرا کنید. [امنیت](/fa/gateway/security) را ببینید.
  </Accordion>

  <Accordion title="در Telegram /start را اجرا کردم اما کد جفت‌سازی نگرفتم">
    کدهای جفت‌سازی **فقط** وقتی ارسال می‌شوند که یک فرستنده ناشناس به بات پیام بدهد و
    `dmPolicy: "pairing"` فعال باشد. `/start` به‌تنهایی کد تولید نمی‌کند.

    درخواست‌های در انتظار را بررسی کنید:

    ```bash
    openclaw pairing list telegram
    ```

    اگر دسترسی فوری می‌خواهید، شناسه فرستنده خود را در allowlist بگذارید یا `dmPolicy: "open"`
    را برای آن حساب تنظیم کنید.

  </Accordion>

  <Accordion title="WhatsApp: آیا به مخاطبان من پیام می‌دهد؟ جفت‌سازی چگونه کار می‌کند؟">
    خیر. سیاست پیش‌فرض DM در WhatsApp **جفت‌سازی** است. فرستنده‌های ناشناس فقط یک کد جفت‌سازی دریافت می‌کنند و پیام آن‌ها **پردازش نمی‌شود**. OpenClaw فقط به چت‌هایی پاسخ می‌دهد که دریافت می‌کند یا به ارسال‌های صریحی که شما فعال می‌کنید.

    جفت‌سازی را با این فرمان تأیید کنید:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    درخواست‌های در انتظار را فهرست کنید:

    ```bash
    openclaw pairing list whatsapp
    ```

    درخواست شماره تلفن در wizard: از آن برای تنظیم **allowlist/owner** شما استفاده می‌شود تا DMهای خودتان مجاز باشند. برای ارسال خودکار استفاده نمی‌شود. اگر روی شماره WhatsApp شخصی خود اجرا می‌کنید، از همان شماره استفاده کنید و `channels.whatsapp.selfChatMode` را فعال کنید.

  </Accordion>
</AccordionGroup>

## فرمان‌های چت، متوقف کردن کارها، و «متوقف نمی‌شود»

<AccordionGroup>
  <Accordion title="چطور جلوی نمایش پیام‌های داخلی سیستم در چت را بگیرم؟">
    بیشتر پیام‌های داخلی یا ابزار فقط وقتی ظاهر می‌شوند که **verbose**، **trace**، یا **reasoning** برای آن نشست فعال باشد.

    در همان چتی که آن را می‌بینید اصلاح کنید:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    اگر هنوز پر سروصداست، تنظیمات نشست را در Control UI بررسی کنید و verbose
    را روی **inherit** بگذارید. همچنین تأیید کنید از پروفایل باتی استفاده نمی‌کنید که `verboseDefault` در پیکربندی
    روی `on` تنظیم شده باشد.

    مستندات: [تفکر و verbose](/fa/tools/thinking)، [امنیت](/fa/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="چطور یک کار در حال اجرا را متوقف/لغو کنم؟">
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

    برای پردازه‌های پس‌زمینه (از ابزار exec)، می‌توانید از عامل بخواهید اجرا کند:

    ```
    process action:kill sessionId:XXX
    ```

    مرور کلی فرمان‌های اسلش: [فرمان‌های اسلش](/fa/tools/slash-commands) را ببینید.

    بیشتر فرمان‌ها باید به‌عنوان یک پیام **مستقل** که با `/` شروع می‌شود ارسال شوند، اما چند میان‌بر (مثل `/status`) برای فرستنده‌های موجود در allowlist به‌صورت inline هم کار می‌کنند.

  </Accordion>

  <Accordion title='چطور از Telegram پیام Discord بفرستم؟ ("پیام‌رسانی میان‌زمینه‌ای رد شد")'>
    OpenClaw به‌طور پیش‌فرض پیام‌رسانی **میان ارائه‌دهنده‌ها** را مسدود می‌کند. اگر یک فراخوانی ابزار
    به Telegram متصل باشد، به Discord ارسال نمی‌کند مگر اینکه صراحتاً اجازه دهید.

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

    پس از ویرایش پیکربندی، gateway را دوباره راه‌اندازی کنید.

  </Accordion>

  <Accordion title='چرا حس می‌شود بات پیام‌های سریع و پشت‌سرهم را "نادیده می‌گیرد"؟'>
    حالت صف کنترل می‌کند پیام‌های جدید چطور با یک اجرای در جریان تعامل کنند. برای تغییر حالت‌ها از `/queue` استفاده کنید:

    - `steer` - همه هدایت‌های در انتظار را برای مرز مدل بعدی در اجرای فعلی صف می‌کند
    - `queue` - هدایت قدیمی یکی‌یکی
    - `followup` - پیام‌ها را یکی‌یکی اجرا می‌کند
    - `collect` - پیام‌ها را دسته‌بندی می‌کند و یک‌بار پاسخ می‌دهد
    - `steer-backlog` - اکنون هدایت می‌کند، سپس backlog را پردازش می‌کند
    - `interrupt` - اجرای فعلی را لغو می‌کند و از نو شروع می‌کند

    حالت پیش‌فرض `steer` است. برای حالت‌های پیگیری می‌توانید گزینه‌هایی مانند `debounce:0.5s cap:25 drop:summarize` اضافه کنید. [صف فرمان](/fa/concepts/queue) و [صف هدایت](/fa/concepts/queue-steering) را ببینید.

  </Accordion>
</AccordionGroup>

## موارد متفرقه

<AccordionGroup>
  <Accordion title='مدل پیش‌فرض Anthropic با یک کلید API چیست؟'>
    در OpenClaw، اعتبارنامه‌ها و انتخاب مدل جدا از هم هستند. تنظیم `ANTHROPIC_API_KEY` (یا ذخیره‌کردن یک کلید API برای Anthropic در پروفایل‌های احراز هویت) احراز هویت را فعال می‌کند، اما مدل پیش‌فرض واقعی همان چیزی است که در `agents.defaults.model.primary` پیکربندی می‌کنید (برای مثال، `anthropic/claude-sonnet-4-6` یا `anthropic/claude-opus-4-6`). اگر `No credentials found for profile "anthropic:default"` را می‌بینید، یعنی Gateway نتوانسته اعتبارنامه‌های Anthropic را در `auth-profiles.json` مورد انتظار برای agent در حال اجرا پیدا کند.
  </Accordion>
</AccordionGroup>

---

هنوز گیر کرده‌اید؟ در [Discord](https://discord.com/invite/clawd) بپرسید یا یک [گفت‌وگوی GitHub](https://github.com/openclaw/openclaw/discussions) باز کنید.

## مرتبط

- [پرسش‌های متداول اجرای نخست](/fa/help/faq-first-run) — نصب، راه‌اندازی اولیه، احراز هویت، اشتراک‌ها، خطاهای اولیه
- [پرسش‌های متداول مدل‌ها](/fa/help/faq-models) — انتخاب مدل، failover، پروفایل‌های احراز هویت
- [عیب‌یابی](/fa/help/troubleshooting) — بررسی مشکل بر اساس نشانه
