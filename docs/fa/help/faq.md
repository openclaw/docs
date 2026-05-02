---
read_when:
    - پاسخ به پرسش‌های رایج پشتیبانی درباره راه‌اندازی، نصب، آماده‌سازی اولیه یا زمان اجرا
    - تریاژ مسائل گزارش‌شده توسط کاربران پیش از اشکال‌زدایی عمیق‌تر
summary: پرسش‌های متداول دربارهٔ راه‌اندازی، پیکربندی و استفاده از OpenClaw
title: پرسش‌های متداول
x-i18n:
    generated_at: "2026-05-02T11:50:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: f818d009a261e32df22c793ab9018ff20cc38f799428d0cfdd8979f8c6d94e13
    source_path: help/faq.md
    workflow: 16
---

پاسخ‌های سریع به‌همراه عیب‌یابی عمیق‌تر برای راه‌اندازی‌های واقعی (توسعه محلی، VPS، چندعاملی، کلیدهای OAuth/API، failover مدل). برای عیب‌یابی زمان اجرا، [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید. برای مرجع کامل پیکربندی، [پیکربندی](/fa/gateway/configuration) را ببینید.

## ۶۰ ثانیه نخست اگر چیزی خراب است

1. **وضعیت سریع (بررسی اول)**

   ```bash
   openclaw status
   ```

   خلاصه سریع محلی: سیستم‌عامل + به‌روزرسانی، دسترسی‌پذیری gateway/service، agents/sessions، پیکربندی provider + مشکلات زمان اجرا (وقتی Gateway در دسترس باشد).

2. **گزارش قابل چسباندن (امن برای اشتراک‌گذاری)**

   ```bash
   openclaw status --all
   ```

   تشخیص فقط‌خواندنی با دنباله log (tokens ویرایش‌شده).

3. **وضعیت daemon + port**

   ```bash
   openclaw gateway status
   ```

   زمان اجرای supervisor در برابر دسترسی‌پذیری RPC، URL هدف probe، و اینکه service احتمالا از کدام پیکربندی استفاده کرده است را نشان می‌دهد.

4. **probeهای عمیق**

   ```bash
   openclaw status --deep
   ```

   یک probe زنده سلامت Gateway اجرا می‌کند، شامل probeهای channel وقتی پشتیبانی شوند
   (به Gateway قابل دسترس نیاز دارد). [سلامت](/fa/gateway/health) را ببینید.

5. **دنبال کردن آخرین log**

   ```bash
   openclaw logs --follow
   ```

   اگر RPC از کار افتاده است، به این برگردید:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   logهای فایل از logهای service جدا هستند؛ [ثبت وقایع](/fa/logging) و [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید.

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

   از Gateway در حال اجرا یک snapshot کامل درخواست می‌کند (فقط WS). [سلامت](/fa/gateway/health) را ببینید.

## شروع سریع و راه‌اندازی اجرای نخست

پرسش‌وپاسخ اجرای نخست — نصب، onboard، مسیرهای auth، subscriptions، شکست‌های اولیه —
در [پرسش‌های پرتکرار اجرای نخست](/fa/help/faq-first-run) قرار دارد.

## OpenClaw چیست؟

<AccordionGroup>
  <Accordion title="OpenClaw در یک پاراگراف چیست؟">
    OpenClaw یک دستیار هوش مصنوعی شخصی است که روی دستگاه‌های خودتان اجرا می‌کنید. روی سطوح پیام‌رسانی که از قبل استفاده می‌کنید پاسخ می‌دهد (WhatsApp، Telegram، Slack، Mattermost، Discord، Google Chat، Signal، iMessage، WebChat، و pluginهای channel همراه مانند QQ Bot) و همچنین می‌تواند روی پلتفرم‌های پشتیبانی‌شده صدا + یک Canvas زنده ارائه دهد. **Gateway** صفحه کنترل همیشه‌روشن است؛ دستیار همان محصول است.
  </Accordion>

  <Accordion title="ارزش پیشنهادی">
    OpenClaw «فقط یک wrapper برای Claude» نیست. این یک **صفحه کنترل local-first** است که به شما اجازه می‌دهد یک
    دستیار توانمند را روی **سخت‌افزار خودتان** اجرا کنید، از برنامه‌های چتی که از قبل استفاده می‌کنید در دسترس باشد، با
    نشست‌های دارای وضعیت، حافظه، و ابزارها - بدون اینکه کنترل گردش‌کارهای خود را به یک SaaS میزبانی‌شده واگذار کنید.

    نکات برجسته:

    - **دستگاه‌های شما، داده‌های شما:** Gateway را هرجا می‌خواهید اجرا کنید (Mac، Linux، VPS) و
      workspace + تاریخچه نشست را محلی نگه دارید.
    - **channelهای واقعی، نه sandbox وب:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc،
      به‌علاوه صدای موبایل و Canvas روی پلتفرم‌های پشتیبانی‌شده.
    - **مستقل از مدل:** از Anthropic، OpenAI، MiniMax، OpenRouter، و غیره، با مسیریابی
      per-agent و failover استفاده کنید.
    - **گزینه فقط محلی:** مدل‌های محلی را اجرا کنید تا اگر بخواهید **همه داده‌ها بتوانند روی دستگاه شما بمانند**.
    - **مسیریابی چندعاملی:** agentهای جداگانه برای هر channel، حساب، یا وظیفه، هرکدام با
      workspace و پیش‌فرض‌های خودش.
    - **متن‌باز و قابل هک:** بدون vendor lock-in بررسی، گسترش، و self-host کنید.

    مستندات: [Gateway](/fa/gateway)، [channelها](/fa/channels)، [چندعاملی](/fa/concepts/multi-agent)،
    [حافظه](/fa/concepts/memory).

  </Accordion>

  <Accordion title="همین الان راه‌اندازی‌اش کردم - اول چه کار کنم؟">
    پروژه‌های اولیه خوب:

    - ساخت یک وب‌سایت (WordPress، Shopify، یا یک سایت static ساده).
    - نمونه‌سازی یک اپ موبایل (طرح کلی، صفحه‌ها، برنامه API).
    - سازمان‌دهی فایل‌ها و پوشه‌ها (پاکسازی، نام‌گذاری، برچسب‌گذاری).
    - اتصال Gmail و خودکارسازی خلاصه‌ها یا پیگیری‌ها.

    می‌تواند وظایف بزرگ را انجام دهد، اما وقتی آن‌ها را به فازها تقسیم کنید و
    برای کار موازی از sub agents استفاده کنید، بهترین عملکرد را دارد.

  </Accordion>

  <Accordion title="پنج کاربرد روزمره برتر OpenClaw چیست؟">
    موفقیت‌های روزمره معمولا شبیه این‌ها هستند:

    - **گزارش‌های شخصی:** خلاصه‌هایی از inbox، calendar، و خبرهایی که برایتان مهم‌اند.
    - **پژوهش و پیش‌نویس‌نویسی:** پژوهش سریع، خلاصه‌ها، و پیش‌نویس‌های اولیه برای emailها یا docs.
    - **یادآورها و پیگیری‌ها:** nudges و checklistهایی که با Cron یا Heartbeat هدایت می‌شوند.
    - **خودکارسازی مرورگر:** پر کردن فرم‌ها، جمع‌آوری داده، و تکرار کارهای وب.
    - **هماهنگی میان دستگاه‌ها:** یک وظیفه را از تلفن خود بفرستید، بگذارید Gateway آن را روی server اجرا کند، و نتیجه را در chat دریافت کنید.

  </Accordion>

  <Accordion title="آیا OpenClaw می‌تواند در تولید سرنخ، ارتباط‌گیری، تبلیغات و وبلاگ‌ها برای یک SaaS کمک کند؟">
    بله، برای **پژوهش، ارزیابی صلاحیت و تهیه پیش‌نویس**. می‌تواند سایت‌ها را اسکن کند، فهرست‌های کوتاه بسازد،
    مشتریان بالقوه را خلاصه کند، و پیش‌نویس پیام‌های ارتباط‌گیری یا متن تبلیغاتی را بنویسد.

    برای **اجرای ارتباط‌گیری یا کمپین‌های تبلیغاتی**، انسان را در چرخه نگه دارید. از اسپم پرهیز کنید، قوانین محلی و
    سیاست‌های پلتفرم را رعایت کنید، و هر چیزی را پیش از ارسال بازبینی کنید. امن‌ترین الگو این است که
    OpenClaw پیش‌نویس کند و شما تأیید کنید.

    مستندات: [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="مزایا نسبت به Claude Code برای توسعه وب چیست؟">
    OpenClaw یک **دستیار شخصی** و لایه هماهنگ‌سازی است، نه جایگزین IDE. از
    Claude Code یا Codex برای سریع‌ترین چرخه کدنویسی مستقیم داخل یک مخزن استفاده کنید. زمانی از OpenClaw استفاده کنید که
    حافظه پایدار، دسترسی بین‌دستگاهی و هماهنگ‌سازی ابزارها می‌خواهید.

    مزایا:

    - **حافظه پایدار + فضای کاری** در سراسر نشست‌ها
    - **دسترسی چندپلتفرمی** (WhatsApp، Telegram، TUI، WebChat)
    - **هماهنگ‌سازی ابزارها** (مرورگر، فایل‌ها، زمان‌بندی، hookها)
    - **Gateway همیشه روشن** (اجرا روی VPS، تعامل از هرجا)
    - **Nodeها** برای مرورگر/صفحه‌نمایش/دوربین/اجرای محلی

    نمایش: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills و خودکارسازی

<AccordionGroup>
  <Accordion title="چگونه Skills را بدون کثیف نگه داشتن مخزن سفارشی کنم؟">
    به‌جای ویرایش نسخه داخل مخزن، از بازنویسی‌های مدیریت‌شده استفاده کنید. تغییرات خود را در `~/.openclaw/skills/<name>/SKILL.md` قرار دهید (یا از طریق `skills.load.extraDirs` در `~/.openclaw/openclaw.json` یک پوشه اضافه کنید). تقدم به این صورت است: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → بسته‌شده → `skills.load.extraDirs`، بنابراین بازنویسی‌های مدیریت‌شده همچنان بدون دست زدن به git بر Skills بسته‌شده اولویت دارند. اگر لازم است Skill به‌صورت سراسری نصب شود اما فقط برای برخی agentها قابل مشاهده باشد، نسخه مشترک را در `~/.openclaw/skills` نگه دارید و قابلیت مشاهده را با `agents.defaults.skills` و `agents.list[].skills` کنترل کنید. فقط ویرایش‌هایی که ارزش ارسال upstream دارند باید در مخزن قرار بگیرند و به‌صورت PR ارسال شوند.
  </Accordion>

  <Accordion title="آیا می‌توانم Skills را از یک پوشه سفارشی بارگذاری کنم؟">
    بله. دایرکتوری‌های اضافی را از طریق `skills.load.extraDirs` در `~/.openclaw/openclaw.json` اضافه کنید (کمترین تقدم). تقدم پیش‌فرض این است: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → بسته‌شده → `skills.load.extraDirs`. `clawhub` به‌صورت پیش‌فرض در `./skills` نصب می‌کند، که OpenClaw در نشست بعدی آن را به‌عنوان `<workspace>/skills` در نظر می‌گیرد. اگر Skill باید فقط برای agentهای خاصی قابل مشاهده باشد، آن را با `agents.defaults.skills` یا `agents.list[].skills` همراه کنید.
  </Accordion>

  <Accordion title="چگونه می‌توانم برای کارهای مختلف از مدل‌های متفاوت استفاده کنم؟">
    الگوهای پشتیبانی‌شده امروز این‌ها هستند:

    - **کارهای Cron**: کارهای ایزوله می‌توانند برای هر کار یک بازنویسی `model` تنظیم کنند.
    - **زیر-agentها**: کارها را به agentهای جداگانه با مدل‌های پیش‌فرض متفاوت هدایت کنید.
    - **تغییر درخواستی**: از `/model` برای تغییر مدل نشست فعلی در هر زمان استفاده کنید.

    ببینید: [کارهای Cron](/fa/automation/cron-jobs)، [مسیریابی چند-agentی](/fa/concepts/multi-agent)، و [دستورهای اسلش](/fa/tools/slash-commands).

  </Accordion>

  <Accordion title="بات هنگام انجام کار سنگین متوقف می‌شود. چگونه آن را واگذار کنم؟">
    برای کارهای طولانی یا موازی از **زیر-agentها** استفاده کنید. زیر-agentها در نشست خودشان اجرا می‌شوند،
    خلاصه‌ای برمی‌گردانند، و چت اصلی شما را پاسخ‌گو نگه می‌دارند.

    از بات خود بخواهید «برای این کار یک زیر-agent ایجاد کند» یا از `/subagents` استفاده کنید.
    از `/status` در چت استفاده کنید تا ببینید Gateway همین حالا چه می‌کند (و آیا مشغول است یا نه).

    نکته توکن: کارهای طولانی و زیر-agentها هر دو توکن مصرف می‌کنند. اگر هزینه مهم است، از طریق
    `agents.defaults.subagents.model` یک مدل ارزان‌تر برای زیر-agentها تنظیم کنید.

    مستندات: [زیر-agentها](/fa/tools/subagents)، [کارهای پس‌زمینه](/fa/automation/tasks).

  </Accordion>

  <Accordion title="نشست‌های زیرagent متصل به thread در Discord چگونه کار می‌کنند؟">
    از اتصال‌های thread استفاده کنید. می‌توانید یک thread در Discord را به یک زیرagent یا هدف نشست متصل کنید تا پیام‌های پیگیری در آن thread روی همان نشست متصل باقی بمانند.

    جریان پایه:

    - با `sessions_spawn` و با استفاده از `thread: true` ایجاد کنید (و به‌صورت اختیاری `mode: "session"` برای پیگیری پایدار).
    - یا به‌صورت دستی با `/focus <target>` متصل کنید.
    - از `/agents` برای بررسی وضعیت اتصال استفاده کنید.
    - از `/session idle <duration|off>` و `/session max-age <duration|off>` برای کنترل لغو تمرکز خودکار استفاده کنید.
    - از `/unfocus` برای جدا کردن thread استفاده کنید.

    پیکربندی لازم:

    - پیش‌فرض‌های سراسری: `session.threadBindings.enabled`، `session.threadBindings.idleHours`، `session.threadBindings.maxAgeHours`.
    - بازنویسی‌های Discord: `channels.discord.threadBindings.enabled`، `channels.discord.threadBindings.idleHours`، `channels.discord.threadBindings.maxAgeHours`.
    - اتصال خودکار هنگام ایجاد: `channels.discord.threadBindings.spawnSessions` به‌صورت پیش‌فرض `true` است؛ برای غیرفعال کردن ایجاد نشست‌های متصل به thread، آن را روی `false` تنظیم کنید.

    مستندات: [زیر-agentها](/fa/tools/subagents)، [Discord](/fa/channels/discord)، [مرجع پیکربندی](/fa/gateway/configuration-reference)، [دستورهای اسلش](/fa/tools/slash-commands).

  </Accordion>

  <Accordion title="یک زیرagent تمام شد، اما به‌روزرسانی تکمیل به جای اشتباه رفت یا هرگز ارسال نشد. چه چیزی را بررسی کنم؟">
    ابتدا مسیر requester حل‌شده را بررسی کنید:

    - تحویل زیرagent در حالت تکمیل، وقتی مسیر thread یا مکالمه متصل وجود داشته باشد، آن را ترجیح می‌دهد.
    - اگر مبدأ تکمیل فقط یک کانال داشته باشد، OpenClaw به مسیر ذخیره‌شده نشست requester (`lastChannel` / `lastTo` / `lastAccountId`) برمی‌گردد تا تحویل مستقیم همچنان بتواند موفق شود.
    - اگر نه مسیر متصل وجود داشته باشد و نه مسیر ذخیره‌شده قابل استفاده، تحویل مستقیم می‌تواند شکست بخورد و نتیجه به‌جای ارسال فوری به چت، به تحویل صف‌شده نشست برگردد.
    - هدف‌های نامعتبر یا کهنه همچنان می‌توانند fallback به صف یا شکست نهایی تحویل را تحمیل کنند.
    - اگر آخرین پاسخ قابل مشاهده assistant فرزند دقیقاً توکن خاموش `NO_REPLY` / `no_reply`، یا دقیقاً `ANNOUNCE_SKIP` باشد، OpenClaw عمداً اعلان را به‌جای ارسال پیشرفت قبلی کهنه سرکوب می‌کند.
    - اگر فرزند پس از فقط فراخوانی‌های ابزار timeout شود، اعلان می‌تواند آن را به یک خلاصه کوتاه از پیشرفت جزئی تبدیل کند، به‌جای بازپخش خروجی خام ابزار.

    اشکال‌زدایی:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [زیر-agentها](/fa/tools/subagents)، [کارهای پس‌زمینه](/fa/automation/tasks)، [ابزارهای نشست](/fa/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron یا یادآورها اجرا نمی‌شوند. چه چیزی را بررسی کنم؟">
    Cron داخل فرایند Gateway اجرا می‌شود. اگر Gateway به‌طور پیوسته در حال اجرا نباشد،
    کارهای زمان‌بندی‌شده اجرا نخواهند شد.

    چک‌لیست:

    - تأیید کنید cron فعال است (`cron.enabled`) و `OPENCLAW_SKIP_CRON` تنظیم نشده است.
    - بررسی کنید Gateway به‌صورت 24/7 اجرا می‌شود (بدون خواب/راه‌اندازی مجدد).
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

    - `--no-deliver` / `delivery.mode: "none"` یعنی انتظار نمی‌رود ارسال جایگزین اجراکننده انجام شود.
    - هدف اعلامِ ناموجود یا نامعتبر (`channel` / `to`) یعنی اجراکننده تحویل خروجی را رد کرده است.
    - خطاهای احراز هویت کانال (`unauthorized`, `Forbidden`) یعنی اجراکننده تلاش کرده تحویل دهد، اما اعتبارنامه‌ها مانع آن شده‌اند.
    - نتیجه ایزوله بی‌صدا (فقط `NO_REPLY` / `no_reply`) عمداً غیرقابل‌تحویل در نظر گرفته می‌شود، بنابراین اجراکننده تحویل جایگزین صف‌شده را نیز سرکوب می‌کند.

    برای کارهای Cron ایزوله، وقتی مسیر چت در دسترس باشد، عامل همچنان می‌تواند مستقیماً با ابزار `message`
    ارسال کند. `--announce` فقط مسیر جایگزین اجراکننده
    را برای متن نهایی‌ای کنترل می‌کند که عامل قبلاً ارسال نکرده است.

    اشکال‌زدایی:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [کارهای پس‌زمینه](/fa/automation/tasks).

  </Accordion>

  <Accordion title="چرا اجرای Cron ایزوله مدل را عوض کرد یا یک بار تلاش مجدد انجام داد؟">
    این معمولاً مسیر تعویض مدل زنده است، نه زمان‌بندی تکراری.

    Cron ایزوله می‌تواند یک واگذاری مدل در زمان اجرا را پایدار کند و وقتی اجرای فعال
    `LiveSessionModelSwitchError` پرتاب می‌کند دوباره تلاش کند. تلاش مجدد، ارائه‌دهنده/مدلِ
    تعویض‌شده را حفظ می‌کند، و اگر تعویض شامل override جدیدی برای پروفایل احراز هویت باشد، Cron
    آن را هم پیش از تلاش مجدد پایدار می‌کند.

    قواعد انتخاب مرتبط:

    - override مدل در قلاب Gmail، وقتی قابل اعمال باشد، اولویت نخست را دارد.
    - سپس `model` هر کار.
    - سپس هر override مدل ذخیره‌شده برای نشست Cron.
    - سپس انتخاب معمول مدل عامل/پیش‌فرض.

    حلقه تلاش مجدد محدود است. پس از تلاش اولیه به‌علاوه ۲ تلاش مجدد برای تعویض،
    Cron به‌جای چرخیدن بی‌پایان متوقف می‌شود.

    اشکال‌زدایی:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [CLI مربوط به cron](/fa/cli/cron).

  </Accordion>

  <Accordion title="چطور Skills را روی Linux نصب کنم؟">
    از دستورهای بومی `openclaw skills` استفاده کنید یا skills را در فضای کاری خود قرار دهید. رابط کاربری Skills در macOS روی Linux در دسترس نیست.
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

    دستور بومی `openclaw skills install` در دایرکتوری `skills/`
    فضای کاری فعال می‌نویسد. CLI جداگانه `clawhub` را فقط وقتی نصب کنید که می‌خواهید skills خودتان را منتشر یا
    همگام‌سازی کنید. برای نصب‌های مشترک بین عامل‌ها، skill را زیر
    `~/.openclaw/skills` بگذارید و اگر می‌خواهید محدود کنید کدام عامل‌ها بتوانند آن را ببینند، از
    `agents.defaults.skills` یا
    `agents.list[].skills` استفاده کنید.

  </Accordion>

  <Accordion title="آیا OpenClaw می‌تواند کارها را طبق زمان‌بندی یا به‌طور پیوسته در پس‌زمینه اجرا کند؟">
    بله. از زمان‌بند Gateway استفاده کنید:

    - **کارهای Cron** برای کارهای زمان‌بندی‌شده یا تکرارشونده (در میان راه‌اندازی‌های مجدد پایدار می‌مانند).
    - **Heartbeat** برای بررسی‌های دوره‌ای «نشست اصلی».
    - **کارهای ایزوله** برای عامل‌های خودکاری که خلاصه‌ها را پست می‌کنند یا به چت‌ها تحویل می‌دهند.

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [خودکارسازی و کارها](/fa/automation)،
    [Heartbeat](/fa/gateway/heartbeat).

  </Accordion>

  <Accordion title="آیا می‌توانم skills مخصوص Apple macOS را از Linux اجرا کنم؟">
    نه به‌طور مستقیم. skills در macOS با `metadata.openclaw.os` به‌علاوه باینری‌های الزامی محدود می‌شوند، و skills فقط زمانی در prompt سیستم ظاهر می‌شوند که روی **میزبان Gateway** واجد شرایط باشند. روی Linux، skills فقط مخصوص `darwin` (مثل `apple-notes`، `apple-reminders`، `things-mac`) بارگذاری نمی‌شوند مگر اینکه محدودسازی را override کنید.

    سه الگوی پشتیبانی‌شده دارید:

    **گزینه A - Gateway را روی Mac اجرا کنید (ساده‌ترین).**
    Gateway را جایی اجرا کنید که باینری‌های macOS وجود دارند، سپس از Linux در [حالت راه دور](#gateway-ports-already-running-and-remote-mode) یا از طریق Tailscale وصل شوید. skills به‌طور عادی بارگذاری می‌شوند، چون میزبان Gateway همان macOS است.

    **گزینه B - از یک Node در macOS استفاده کنید (بدون SSH).**
    Gateway را روی Linux اجرا کنید، یک Node در macOS را جفت کنید (برنامه menubar)، و **Node Run Commands** را روی Mac روی "Always Ask" یا "Always Allow" بگذارید. OpenClaw می‌تواند skills مخصوص macOS را زمانی واجد شرایط بداند که باینری‌های الزامی روی Node وجود داشته باشند. عامل آن skills را از طریق ابزار `nodes` اجرا می‌کند. اگر "Always Ask" را انتخاب کنید، تأیید "Always Allow" در prompt آن دستور را به allowlist اضافه می‌کند.

    **گزینه C - باینری‌های macOS را از طریق SSH پراکسی کنید (پیشرفته).**
    Gateway را روی Linux نگه دارید، اما کاری کنید باینری‌های CLI الزامی به wrapperهای SSH resolve شوند که روی Mac اجرا می‌شوند. سپس skill را override کنید تا Linux را مجاز کند و واجد شرایط بماند.

    1. یک wrapper SSH برای باینری بسازید (مثال: `memo` برای Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. wrapper را روی `PATH` میزبان Linux بگذارید (مثلاً `~/bin/memo`).
    3. فراداده skill را override کنید (در فضای کاری یا `~/.openclaw/skills`) تا Linux را مجاز کند:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. یک نشست جدید شروع کنید تا snapshot مربوط به skills تازه‌سازی شود.

  </Accordion>

  <Accordion title="آیا یکپارچه‌سازی Notion یا HeyGen دارید؟">
    امروز به‌صورت داخلی وجود ندارد.

    گزینه‌ها:

    - **skill / Plugin سفارشی:** بهترین گزینه برای دسترسی قابل‌اعتماد به API است (Notion/HeyGen هر دو API دارند).
    - **خودکارسازی مرورگر:** بدون کد کار می‌کند، اما کندتر و شکننده‌تر است.

    اگر می‌خواهید برای هر مشتری context جدا نگه دارید (جریان‌های کاری آژانس)، یک الگوی ساده این است:

    - یک صفحه Notion برای هر مشتری (context + ترجیحات + کار فعال).
    - از عامل بخواهید در ابتدای نشست آن صفحه را دریافت کند.

    اگر یکپارچه‌سازی بومی می‌خواهید، یک درخواست قابلیت باز کنید یا یک skill
    برای آن APIها بسازید.

    نصب skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    نصب‌های بومی در دایرکتوری `skills/` فضای کاری فعال قرار می‌گیرند. برای skills مشترک بین عامل‌ها، آن‌ها را در `~/.openclaw/skills/<name>/SKILL.md` قرار دهید. اگر فقط برخی عامل‌ها باید یک نصب مشترک را ببینند، `agents.defaults.skills` یا `agents.list[].skills` را پیکربندی کنید. برخی skills انتظار دارند باینری‌ها از طریق Homebrew نصب شده باشند؛ روی Linux یعنی Linuxbrew (ورودی پرسش‌های متداول Homebrew Linux در بالا را ببینید). [Skills](/fa/tools/skills)، [پیکربندی Skills](/fa/tools/skills-config)، و [ClawHub](/fa/tools/clawhub) را ببینید.

  </Accordion>

  <Accordion title="چطور از Chrome فعلیِ واردشده به حسابم با OpenClaw استفاده کنم؟">
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

    این مسیر می‌تواند از مرورگر میزبان local یا یک Node مرورگر متصل استفاده کند. اگر Gateway جای دیگری اجرا می‌شود، یا یک میزبان Node را روی دستگاه مرورگر اجرا کنید یا به‌جای آن از CDP راه دور استفاده کنید.

    محدودیت‌های فعلی برای `existing-session` / `user`:

    - کنش‌ها بر پایه ref هستند، نه بر پایه CSS selector
    - بارگذاری‌ها به `ref` / `inputRef` نیاز دارند و فعلاً هر بار از یک فایل پشتیبانی می‌کنند
    - `responsebody`، خروجی PDF، رهگیری دانلود، و کنش‌های دسته‌ای همچنان به مرورگر مدیریت‌شده یا پروفایل CDP خام نیاز دارند

  </Accordion>
</AccordionGroup>

## Sandboxing و حافظه

<AccordionGroup>
  <Accordion title="آیا سند اختصاصی برای sandboxing وجود دارد؟">
    بله. [Sandboxing](/fa/gateway/sandboxing) را ببینید. برای راه‌اندازی مخصوص Docker (Gateway کامل در Docker یا تصاویر sandbox)، [Docker](/fa/install/docker) را ببینید.
  </Accordion>

  <Accordion title="Docker محدود به نظر می‌رسد - چطور قابلیت‌های کامل را فعال کنم؟">
    تصویر پیش‌فرض امنیت‌محور است و با کاربر `node` اجرا می‌شود، بنابراین
    شامل بسته‌های سیستمی، Homebrew، یا مرورگرهای بسته‌بندی‌شده نیست. برای راه‌اندازی کامل‌تر:

    - `/home/node` را با `OPENCLAW_HOME_VOLUME` پایدار کنید تا cacheها باقی بمانند.
    - وابستگی‌های سیستمی را با `OPENCLAW_DOCKER_APT_PACKAGES` در تصویر bake کنید.
    - مرورگرهای Playwright را از طریق CLI بسته‌بندی‌شده نصب کنید:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` را تنظیم کنید و مطمئن شوید مسیر پایدار شده است.

    مستندات: [Docker](/fa/install/docker)، [مرورگر](/fa/tools/browser).

  </Accordion>

  <Accordion title="آیا می‌توانم پیام‌های مستقیم را شخصی نگه دارم اما گروه‌ها را با یک عامل عمومی/sandboxed کنم؟">
    بله - اگر ترافیک خصوصی شما **DMها** و ترافیک عمومی شما **گروه‌ها** باشد.

    از `agents.defaults.sandbox.mode: "non-main"` استفاده کنید تا نشست‌های گروه/کانال (کلیدهای non-main) در backend پیکربندی‌شده sandbox اجرا شوند، در حالی که نشست DM اصلی روی میزبان باقی می‌ماند. اگر backend انتخاب نکنید، Docker backend پیش‌فرض است. سپس با `tools.sandbox.tools` محدود کنید چه ابزارهایی در نشست‌های sandboxed در دسترس باشند.

    راهنمای راه‌اندازی + پیکربندی نمونه: [گروه‌ها: DMهای شخصی + گروه‌های عمومی](/fa/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع پیکربندی کلیدی: [پیکربندی Gateway](/fa/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="چطور یک پوشه میزبان را به sandbox متصل کنم؟">
    `agents.defaults.sandbox.docker.binds` را روی `["host:path:mode"]` تنظیم کنید (مثلاً `"/home/user/src:/src:ro"`). bindهای سراسری و هر عامل با هم ادغام می‌شوند؛ bindهای هر عامل وقتی `scope: "shared"` باشد نادیده گرفته می‌شوند. برای هر چیز حساس از `:ro` استفاده کنید و به یاد داشته باشید bindها دیوارهای فایل‌سیستم sandbox را دور می‌زنند.

    OpenClaw منبع bind را هم در برابر مسیر نرمال‌سازی‌شده و هم در برابر مسیر canonical که از طریق عمیق‌ترین ancestor موجود resolve شده اعتبارسنجی می‌کند. یعنی خروج از والد symlink همچنان حتی وقتی آخرین بخش مسیر هنوز وجود ندارد بسته می‌ماند، و بررسی‌های allowed-root پس از resolve شدن symlink همچنان اعمال می‌شوند.

    برای نمونه‌ها و نکات ایمنی، [Sandboxing](/fa/gateway/sandboxing#custom-bind-mounts) و [Sandbox در برابر خط‌مشی ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) را ببینید.

  </Accordion>

  <Accordion title="حافظه چگونه کار می‌کند؟">
    حافظه OpenClaw فقط فایل‌های Markdown در فضای کاری عامل است:

    - یادداشت‌های روزانه در `memory/YYYY-MM-DD.md`
    - یادداشت‌های بلندمدت پالایش‌شده در `MEMORY.md` (فقط نشست‌های اصلی/خصوصی)

    OpenClaw همچنین یک **flush بی‌صدای حافظه پیش از Compaction** اجرا می‌کند تا به مدل
    یادآوری کند پیش از auto-compaction یادداشت‌های پایدار بنویسد. این فقط زمانی اجرا می‌شود که فضای کاری
    قابل نوشتن باشد (sandboxهای فقط‌خواندنی آن را رد می‌کنند). [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>

  <Accordion title="حافظه مدام چیزها را فراموش می‌کند. چطور آن را ماندگار کنم؟">
    از bot بخواهید **واقعیت را در حافظه بنویسد**. یادداشت‌های بلندمدت جای‌شان در `MEMORY.md` است،
    context کوتاه‌مدت در `memory/YYYY-MM-DD.md` می‌رود.

    این هنوز حوزه‌ای است که در حال بهبود آن هستیم. یادآوری به مدل برای ذخیره حافظه‌ها کمک می‌کند؛
    خودش می‌داند چه کند. اگر همچنان فراموش می‌کند، بررسی کنید Gateway در هر اجرا از همان
    فضای کاری استفاده می‌کند.

    مستندات: [حافظه](/fa/concepts/memory)، [فضای کاری عامل](/fa/concepts/agent-workspace).

  </Accordion>

  <Accordion title="آیا حافظه برای همیشه پایدار می‌ماند؟ محدودیت‌ها چیست؟">
    فایل‌های حافظه روی دیسک زندگی می‌کنند و تا وقتی حذف‌شان نکنید پایدار می‌مانند. محدودیت، فضای ذخیره‌سازی شماست،
    نه مدل. **context نشست** همچنان با پنجره context مدل محدود می‌شود،
    بنابراین مکالمات طولانی می‌توانند compact یا truncate شوند. به همین دلیل
    جست‌وجوی حافظه وجود دارد - فقط بخش‌های مرتبط را دوباره به context برمی‌گرداند.

    مستندات: [حافظه](/fa/concepts/memory)، [Context](/fa/concepts/context).

  </Accordion>

  <Accordion title="آیا جست‌وجوی معنایی حافظه به کلید API OpenAI نیاز دارد؟">
    فقط اگر از **embeddingهای OpenAI** استفاده کنید. OAuth مربوط به Codex چت/تکمیل‌ها را پوشش می‌دهد و
    دسترسی به embeddingها را **نمی‌دهد**، بنابراین **ورود با Codex (OAuth یا
    ورود Codex CLI)** برای جست‌وجوی معنایی حافظه کمکی نمی‌کند. embeddingهای OpenAI
    همچنان به یک کلید API واقعی نیاز دارند (`OPENAI_API_KEY` یا `models.providers.openai.apiKey`).

    اگر provider را صراحتا تنظیم نکنید، OpenClaw وقتی بتواند یک کلید API را
    پیدا کند، به‌طور خودکار یک provider انتخاب می‌کند (پروفایل‌های احراز هویت، `models.providers.*.apiKey`، یا متغیرهای محیطی).
    اگر کلید OpenAI پیدا شود، OpenAI را ترجیح می‌دهد؛ در غیر این صورت اگر کلید Gemini
    پیدا شود، Gemini را انتخاب می‌کند، سپس Voyage، سپس Mistral. اگر هیچ کلید راه‌دوری در دسترس نباشد، جست‌وجوی حافظه
    تا زمانی که آن را پیکربندی کنید غیرفعال می‌ماند. اگر مسیر مدل محلی
    پیکربندی و موجود باشد، OpenClaw
    `local` را ترجیح می‌دهد. Ollama زمانی پشتیبانی می‌شود که صراحتا
    `memorySearch.provider = "ollama"` را تنظیم کنید.

    اگر ترجیح می‌دهید محلی بمانید، `memorySearch.provider = "local"` را تنظیم کنید (و در صورت تمایل
    `memorySearch.fallback = "none"`). اگر embeddingهای Gemini را می‌خواهید،
    `memorySearch.provider = "gemini"` را تنظیم کنید و `GEMINI_API_KEY` (یا
    `memorySearch.remote.apiKey`) را ارائه دهید. ما از مدل‌های embedding
    **OpenAI، Gemini، Voyage، Mistral، Ollama، یا local** پشتیبانی می‌کنیم - برای جزئیات راه‌اندازی، [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>
</AccordionGroup>

## چیزها روی دیسک کجا قرار دارند

<AccordionGroup>
  <Accordion title="آیا همه داده‌های استفاده‌شده با OpenClaw به‌صورت محلی ذخیره می‌شوند؟">
    خیر - **وضعیت OpenClaw محلی است**، اما **سرویس‌های خارجی همچنان آنچه را برایشان می‌فرستید می‌بینند**.

    - **محلی به‌صورت پیش‌فرض:** نشست‌ها، فایل‌های حافظه، پیکربندی، و workspace روی میزبان Gateway قرار دارند
      (`~/.openclaw` + دایرکتوری workspace شما).
    - **راه‌دور به‌دلیل ضرورت:** پیام‌هایی که به providerهای مدل (Anthropic/OpenAI/غیره) می‌فرستید به
      APIهای آن‌ها می‌روند، و پلتفرم‌های چت (WhatsApp/Telegram/Slack/غیره) داده‌های پیام را روی
      سرورهای خود ذخیره می‌کنند.
    - **شما ردپا را کنترل می‌کنید:** استفاده از مدل‌های محلی promptها را روی دستگاه شما نگه می‌دارد، اما ترافیک channel
      همچنان از سرورهای همان channel عبور می‌کند.

    مرتبط: [Workspace عامل](/fa/concepts/agent-workspace)، [حافظه](/fa/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw داده‌های خود را کجا ذخیره می‌کند؟">
    همه‌چیز زیر `$OPENCLAW_STATE_DIR` قرار دارد (پیش‌فرض: `~/.openclaw`):

    | مسیر                                                            | هدف                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | پیکربندی اصلی (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | ورود OAuth قدیمی (در نخستین استفاده به پروفایل‌های احراز هویت کپی می‌شود)       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | پروفایل‌های احراز هویت (OAuth، کلیدهای API، و `keyRef`/`tokenRef` اختیاری)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | payload اختیاری secret مبتنی بر فایل برای providerهای SecretRef از نوع `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | فایل سازگاری قدیمی (ورودی‌های ثابت `api_key` پاک‌سازی شده‌اند)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | وضعیت provider (مثلا `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | وضعیت هر عامل (agentDir + نشست‌ها)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | تاریخچه گفت‌وگو و وضعیت (برای هر عامل)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | فراداده نشست (برای هر عامل)                                       |

    مسیر قدیمی تک‌عاملی: `~/.openclaw/agent/*` (با `openclaw doctor` مهاجرت داده می‌شود).

    **workspace** شما (AGENTS.md، فایل‌های حافظه، skills، و غیره) جداست و از طریق `agents.defaults.workspace` پیکربندی می‌شود (پیش‌فرض: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md کجا باید قرار بگیرند؟">
    این فایل‌ها در **workspace عامل** قرار دارند، نه در `~/.openclaw`.

    - **Workspace (برای هر عامل)**: `AGENTS.md`، `SOUL.md`، `IDENTITY.md`، `USER.md`،
      `MEMORY.md`، `memory/YYYY-MM-DD.md`، و `HEARTBEAT.md` اختیاری.
      ریشه حروف کوچک `memory.md` فقط ورودی تعمیر قدیمی است؛ `openclaw doctor --fix`
      وقتی هر دو فایل وجود داشته باشند می‌تواند آن را در `MEMORY.md` ادغام کند.
    - **دایرکتوری وضعیت (`~/.openclaw`)**: پیکربندی، وضعیت channel/provider، پروفایل‌های احراز هویت، نشست‌ها، لاگ‌ها،
      و Skills مشترک (`~/.openclaw/skills`).

    workspace پیش‌فرض `~/.openclaw/workspace` است و از این طریق قابل پیکربندی است:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    اگر bot پس از راه‌اندازی مجدد «فراموش» می‌کند، تأیید کنید Gateway در هر بار اجرا از همان
    workspace استفاده می‌کند (و به خاطر داشته باشید: حالت راه‌دور از workspace **میزبان gateway**
    استفاده می‌کند، نه لپ‌تاپ محلی شما).

    نکته: اگر یک رفتار یا ترجیح پایدار می‌خواهید، از bot بخواهید **آن را در
    AGENTS.md یا MEMORY.md بنویسد**، نه اینکه به تاریخچه چت تکیه کنید.

    [Workspace عامل](/fa/concepts/agent-workspace) و [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>

  <Accordion title="راهبرد پیشنهادی پشتیبان‌گیری">
    **workspace عامل** خود را در یک مخزن git **خصوصی** قرار دهید و آن را در جایی
    خصوصی پشتیبان بگیرید (برای مثال GitHub خصوصی). این کار حافظه + فایل‌های AGENTS/SOUL/USER
    را ثبت می‌کند و به شما اجازه می‌دهد بعدا «ذهن» دستیار را بازیابی کنید.

    هیچ‌چیز زیر `~/.openclaw` را commit نکنید (اعتبارنامه‌ها، نشست‌ها، tokenها، یا payloadهای secrets رمزگذاری‌شده).
    اگر به بازیابی کامل نیاز دارید، هم workspace و هم دایرکتوری وضعیت را
    جداگانه پشتیبان بگیرید (پرسش مربوط به مهاجرت در بالا را ببینید).

    مستندات: [Workspace عامل](/fa/concepts/agent-workspace).

  </Accordion>

  <Accordion title="چطور OpenClaw را کامل حذف نصب کنم؟">
    راهنمای اختصاصی را ببینید: [حذف نصب](/fa/install/uninstall).
  </Accordion>

  <Accordion title="آیا عامل‌ها می‌توانند خارج از workspace کار کنند؟">
    بله. workspace همان **cwd پیش‌فرض** و لنگر حافظه است، نه یک sandbox سخت‌گیرانه.
    مسیرهای نسبی داخل workspace resolve می‌شوند، اما مسیرهای مطلق می‌توانند به مکان‌های دیگر
    میزبان دسترسی داشته باشند، مگر اینکه sandboxing فعال باشد. اگر به جداسازی نیاز دارید، از
    [`agents.defaults.sandbox`](/fa/gateway/sandboxing) یا تنظیمات sandbox برای هر عامل استفاده کنید. اگر
    می‌خواهید یک مخزن دایرکتوری کاری پیش‌فرض باشد، `workspace` آن عامل را
    به ریشه مخزن اشاره دهید. مخزن OpenClaw فقط کد منبع است؛
    workspace را جدا نگه دارید مگر اینکه عمدا بخواهید عامل داخل آن کار کند.

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

  <Accordion title="حالت راه‌دور: محل ذخیره نشست کجاست؟">
    وضعیت نشست متعلق به **میزبان gateway** است. اگر در حالت راه‌دور هستید، محل ذخیره نشستی که برایتان مهم است روی دستگاه راه‌دور است، نه لپ‌تاپ محلی شما. [مدیریت نشست](/fa/concepts/session) را ببینید.
  </Accordion>
</AccordionGroup>

## مبانی پیکربندی

<AccordionGroup>
  <Accordion title="قالب پیکربندی چیست؟ کجاست؟">
    OpenClaw یک پیکربندی **JSON5** اختیاری را از `$OPENCLAW_CONFIG_PATH` می‌خواند (پیش‌فرض: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    اگر فایل وجود نداشته باشد، از پیش‌فرض‌های نسبتا امن استفاده می‌کند (از جمله workspace پیش‌فرض `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='من gateway.bind: "lan" (یا "tailnet") را تنظیم کردم و حالا چیزی گوش نمی‌دهد / UI می‌گوید غیرمجاز است'>
    bindهای غیر loopback **به یک مسیر معتبر احراز هویت gateway نیاز دارند**. در عمل یعنی:

    - احراز هویت secret مشترک: token یا password
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

    نکات:

    - `gateway.remote.token` / `.password` به‌تنهایی احراز هویت gateway محلی را فعال نمی‌کنند.
    - مسیرهای فراخوانی محلی فقط وقتی `gateway.auth.*` تنظیم نشده باشد می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند.
    - برای احراز هویت password، به‌جای آن `gateway.auth.mode: "password"` را به‌همراه `gateway.auth.password` (یا `OPENCLAW_GATEWAY_PASSWORD`) تنظیم کنید.
    - اگر `gateway.auth.token` / `gateway.auth.password` صراحتا از طریق SecretRef پیکربندی شده و resolve نشده باشد، resolution به‌صورت بسته شکست می‌خورد (بدون پنهان‌سازی fallback راه‌دور).
    - راه‌اندازی‌های Control UI با secret مشترک از طریق `connect.params.auth.token` یا `connect.params.auth.password` احراز هویت می‌کنند (در تنظیمات app/UI ذخیره می‌شود). حالت‌های دارای هویت مانند Tailscale Serve یا `trusted-proxy` به‌جای آن از headerهای درخواست استفاده می‌کنند. از گذاشتن secretهای مشترک در URLها خودداری کنید.
    - با `gateway.auth.mode: "trusted-proxy"`، reverse proxyهای loopback هم‌میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح و یک ورودی loopback در `gateway.trustedProxies` نیاز دارند.

  </Accordion>

  <Accordion title="چرا حالا روی localhost به token نیاز دارم؟">
    OpenClaw به‌صورت پیش‌فرض احراز هویت gateway را اعمال می‌کند، از جمله loopback. در مسیر پیش‌فرض معمولی، این یعنی احراز هویت token: اگر هیچ مسیر احراز هویت صریحی پیکربندی نشده باشد، راه‌اندازی gateway به حالت token resolve می‌شود و یکی را به‌طور خودکار تولید می‌کند و در `gateway.auth.token` ذخیره می‌کند، بنابراین **کلاینت‌های WS محلی باید احراز هویت کنند**. این کار جلوی فراخوانی Gateway توسط فرایندهای محلی دیگر را می‌گیرد.

    اگر مسیر احراز هویت دیگری را ترجیح می‌دهید، می‌توانید صراحتا حالت password را انتخاب کنید (یا برای reverse proxyهای آگاه از هویت، `trusted-proxy`). اگر **واقعا** loopback باز می‌خواهید، `gateway.auth.mode: "none"` را صراحتا در پیکربندی خود تنظیم کنید. Doctor هر زمان می‌تواند برای شما token تولید کند: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="آیا بعد از تغییر پیکربندی باید راه‌اندازی مجدد کنم؟">
    Gateway پیکربندی را watch می‌کند و از hot-reload پشتیبانی می‌کند:

    - `gateway.reload.mode: "hybrid"` (پیش‌فرض): تغییرات امن را به‌صورت hot اعمال می‌کند، برای موارد بحرانی راه‌اندازی مجدد می‌کند
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

    - `off`: متن tagline را پنهان می‌کند اما خط عنوان/نسخه banner را نگه می‌دارد.
    - `default`: هر بار از `All your chats, one OpenClaw.` استفاده می‌کند.
    - `random`: taglineهای بامزه/فصلی چرخشی (رفتار پیش‌فرض).
    - اگر اصلا banner نمی‌خواهید، متغیر محیطی `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

  </Accordion>

  <Accordion title="چطور جست‌وجوی وب (و دریافت وب) را فعال کنم؟">
    `web_fetch` بدون کلید API کار می‌کند. `web_search` به provider انتخابی شما
    بستگی دارد:

    - providerهای مبتنی بر API مانند Brave، Exa، Firecrawl، Gemini، Grok، Kimi، MiniMax Search، Perplexity، و Tavily به راه‌اندازی معمول کلید API خود نیاز دارند.
    - Ollama Web Search بدون کلید است، اما از میزبان Ollama پیکربندی‌شده شما استفاده می‌کند و به `ollama signin` نیاز دارد.
    - DuckDuckGo بدون کلید است، اما یک یکپارچه‌سازی غیررسمی مبتنی بر HTML است.
    - SearXNG بدون کلید/خودمیزبان است؛ `SEARXNG_BASE_URL` یا `plugins.entries.searxng.config.webSearch.baseUrl` را پیکربندی کنید.

    **پیشنهادی:** `openclaw configure --section web` را اجرا کنید و یک provider انتخاب کنید.
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

    پیکربندی جست‌وجوی وبِ مخصوص هر ارائه‌دهنده اکنون زیر `plugins.entries.<plugin>.config.webSearch.*` قرار دارد.
    مسیرهای قدیمی ارائه‌دهنده در `tools.web.search.*` هنوز به‌طور موقت برای سازگاری بارگذاری می‌شوند، اما نباید برای پیکربندی‌های جدید استفاده شوند.
    پیکربندی جایگزین واکشی وب Firecrawl زیر `plugins.entries.firecrawl.config.webFetch.*` قرار دارد.

    نکات:

    - اگر از فهرست‌های مجاز استفاده می‌کنید، `web_search`/`web_fetch`/`x_search` یا `group:web` را اضافه کنید.
    - `web_fetch` به‌صورت پیش‌فرض فعال است (مگر اینکه صراحتاً غیرفعال شده باشد).
    - اگر `tools.web.fetch.provider` حذف شود، OpenClaw نخستین ارائه‌دهنده جایگزین آماده برای واکشی را از میان اعتبارنامه‌های موجود به‌طور خودکار تشخیص می‌دهد. در حال حاضر ارائه‌دهنده همراه Firecrawl است.
    - دیمون‌ها متغیرهای محیطی را از `~/.openclaw/.env` (یا محیط سرویس) می‌خوانند.

    مستندات: [ابزارهای وب](/fa/tools/web).

  </Accordion>

  <Accordion title="config.apply پیکربندی من را پاک کرد. چگونه بازیابی کنم و جلوی تکرارش را بگیرم؟">
    `config.apply` **کل پیکربندی** را جایگزین می‌کند. اگر یک آبجکت ناقص بفرستید، هر چیز
    دیگری حذف می‌شود.

    نسخه فعلی OpenClaw جلوی بسیاری از بازنویسی‌های تصادفی را می‌گیرد:

    - نوشتن‌های پیکربندی متعلق به OpenClaw پیش از نوشتن، کل پیکربندی پس از تغییر را اعتبارسنجی می‌کنند.
    - نوشتن‌های نامعتبر یا مخربِ متعلق به OpenClaw رد می‌شوند و با نام `openclaw.json.rejected.*` ذخیره می‌شوند.
    - اگر یک ویرایش مستقیم راه‌اندازی یا بارگذاری مجدد زنده را خراب کند، Gateway آخرین پیکربندی سالم شناخته‌شده را برمی‌گرداند و فایل ردشده را با نام `openclaw.json.clobbered.*` ذخیره می‌کند.
    - پس از بازیابی، عامل اصلی یک هشدار راه‌اندازی دریافت می‌کند تا دوباره کورکورانه پیکربندی بد را ننویسد.

    بازیابی:

    - در `openclaw logs --follow` به‌دنبال `Config auto-restored from last-known-good`، `Config write rejected:`، یا `config reload restored last-known-good config` بگردید.
    - جدیدترین `openclaw.json.clobbered.*` یا `openclaw.json.rejected.*` را کنار پیکربندی فعال بررسی کنید.
    - اگر پیکربندی فعالِ بازیابی‌شده کار می‌کند، همان را نگه دارید، سپس فقط کلیدهای مدنظر را با `openclaw config set` یا `config.patch` برگردانید.
    - `openclaw config validate` و `openclaw doctor` را اجرا کنید.
    - اگر آخرین نسخه سالم شناخته‌شده یا بار داده ردشده ندارید، از نسخه پشتیبان بازیابی کنید، یا دوباره `openclaw doctor` را اجرا کنید و کانال‌ها/مدل‌ها را از نو پیکربندی کنید.
    - اگر این اتفاق غیرمنتظره بود، یک باگ ثبت کنید و آخرین پیکربندی شناخته‌شده یا هر نسخه پشتیبان خود را پیوست کنید.
    - یک عامل کدنویسی محلی اغلب می‌تواند از روی لاگ‌ها یا تاریخچه، یک پیکربندی کارا را بازسازی کند.

    پیشگیری:

    - برای تغییرات کوچک از `openclaw config set` استفاده کنید.
    - برای ویرایش‌های تعاملی از `openclaw configure` استفاده کنید.
    - وقتی از مسیر دقیق یا شکل فیلد مطمئن نیستید، ابتدا از `config.schema.lookup` استفاده کنید؛ این دستور یک گره اسکیمای سطحی به‌همراه خلاصه‌های فرزندهای مستقیم برای بررسی مرحله‌ای برمی‌گرداند.
    - برای ویرایش‌های جزئی RPC از `config.patch` استفاده کنید؛ `config.apply` را فقط برای جایگزینی کل پیکربندی نگه دارید.
    - اگر از ابزار مالک‌محور `gateway` در اجرای یک عامل استفاده می‌کنید، همچنان نوشتن در `tools.exec.ask` / `tools.exec.security` را رد می‌کند (از جمله نام‌های مستعار قدیمی `tools.bash.*` که به همان مسیرهای اجرایی محافظت‌شده نرمال‌سازی می‌شوند).

    مستندات: [Config](/fa/cli/config)، [Configure](/fa/cli/configure)، [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-restored-last-known-good-config)، [Doctor](/fa/gateway/doctor).

  </Accordion>

  <Accordion title="چگونه یک Gateway مرکزی را با کارگرهای تخصصی در چند دستگاه اجرا کنم؟">
    الگوی رایج **یک Gateway** (برای مثال Raspberry Pi) به‌همراه **نودها** و **عامل‌ها** است:

    - **Gateway (مرکزی):** مالک کانال‌ها (Signal/WhatsApp)، مسیریابی و نشست‌ها است.
    - **نودها (دستگاه‌ها):** Macها/iOS/Android به‌عنوان وسایل جانبی متصل می‌شوند و ابزارهای محلی (`system.run`، `canvas`، `camera`) را در معرض استفاده قرار می‌دهند.
    - **عامل‌ها (کارگرها):** مغزها/فضاهای کاری جداگانه برای نقش‌های ویژه (برای مثال "عملیات Hetzner"، "داده‌های شخصی").
    - **زیرعامل‌ها:** وقتی موازی‌سازی می‌خواهید، کار پس‌زمینه را از یک عامل اصلی ایجاد می‌کنند.
    - **TUI:** به Gateway متصل شوید و بین عامل‌ها/نشست‌ها جابه‌جا شوید.

    مستندات: [نودها](/fa/nodes)، [دسترسی از راه دور](/fa/gateway/remote)، [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [زیرعامل‌ها](/fa/tools/subagents)، [TUI](/fa/web/tui).

  </Accordion>

  <Accordion title="آیا مرورگر OpenClaw می‌تواند headless اجرا شود؟">
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

    مقدار پیش‌فرض `false` (headful) است. حالت headless در برخی سایت‌ها احتمال بیشتری دارد بررسی‌های ضدبات را فعال کند. [Browser](/fa/tools/browser) را ببینید.

    حالت headless از **همان موتور Chromium** استفاده می‌کند و برای بیشتر خودکارسازی‌ها (فرم‌ها، کلیک‌ها، اسکرپینگ، ورودها) کار می‌کند. تفاوت‌های اصلی:

    - پنجره مرورگر قابل مشاهده‌ای وجود ندارد (اگر به تصویر نیاز دارید از اسکرین‌شات استفاده کنید).
    - بعضی سایت‌ها در حالت headless نسبت به خودکارسازی سخت‌گیرتر هستند (CAPTCHAها، ضدبات).
      برای مثال، X/Twitter اغلب نشست‌های headless را مسدود می‌کند.

  </Accordion>

  <Accordion title="چگونه از Brave برای کنترل مرورگر استفاده کنم؟">
    `browser.executablePath` را روی باینری Brave خود (یا هر مرورگر مبتنی بر Chromium) تنظیم کنید و Gateway را دوباره راه‌اندازی کنید.
    نمونه‌های کامل پیکربندی را در [Browser](/fa/tools/browser#use-brave-or-another-chromium-based-browser) ببینید.
  </Accordion>
</AccordionGroup>

## Gatewayها و نودهای راه دور

<AccordionGroup>
  <Accordion title="فرمان‌ها چگونه بین Telegram، Gateway و نودها منتشر می‌شوند؟">
    پیام‌های Telegram توسط **Gateway** مدیریت می‌شوند. Gateway عامل را اجرا می‌کند و
    فقط سپس وقتی به ابزار نود نیاز باشد، از طریق **Gateway WebSocket** نودها را فراخوانی می‌کند:

    Telegram → Gateway → عامل → `node.*` → نود → Gateway → Telegram

    نودها ترافیک ورودی ارائه‌دهنده را نمی‌بینند؛ فقط فراخوانی‌های RPC نود را دریافت می‌کنند.

  </Accordion>

  <Accordion title="اگر Gateway از راه دور میزبانی شده باشد، عامل من چگونه به رایانه من دسترسی پیدا می‌کند؟">
    پاسخ کوتاه: **رایانه خود را به‌عنوان یک نود جفت کنید**. Gateway جای دیگری اجرا می‌شود، اما می‌تواند
    ابزارهای `node.*` (صفحه‌نمایش، دوربین، سیستم) را روی ماشین محلی شما از طریق Gateway WebSocket فراخوانی کند.

    راه‌اندازی معمول:

    1. Gateway را روی میزبان همیشه‌روشن (VPS/سرور خانگی) اجرا کنید.
    2. میزبان Gateway و رایانه خود را روی یک tailnet یکسان قرار دهید.
    3. مطمئن شوید Gateway WS در دسترس است (اتصال tailnet یا تونل SSH).
    4. اپ macOS را به‌صورت محلی باز کنید و در حالت **Remote over SSH** (یا tailnet مستقیم) متصل شوید
       تا بتواند به‌عنوان یک نود ثبت شود.
    5. نود را روی Gateway تأیید کنید:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    هیچ پل TCP جداگانه‌ای لازم نیست؛ نودها از طریق Gateway WebSocket متصل می‌شوند.

    یادآوری امنیتی: جفت‌کردن یک نود macOS اجازه `system.run` را روی آن ماشین می‌دهد. فقط
    دستگاه‌هایی را جفت کنید که به آن‌ها اعتماد دارید، و [Security](/fa/gateway/security) را مرور کنید.

    مستندات: [نودها](/fa/nodes)، [پروتکل Gateway](/fa/gateway/protocol)، [حالت راه دور macOS](/fa/platforms/mac/remote)، [Security](/fa/gateway/security).

  </Accordion>

  <Accordion title="Tailscale متصل است اما پاسخی نمی‌گیرم. حالا چه کنم؟">
    موارد پایه را بررسی کنید:

    - Gateway در حال اجرا است: `openclaw gateway status`
    - سلامت Gateway: `openclaw status`
    - سلامت کانال: `openclaw channels status`

    سپس احراز هویت و مسیریابی را بررسی کنید:

    - اگر از Tailscale Serve استفاده می‌کنید، مطمئن شوید `gateway.auth.allowTailscale` درست تنظیم شده است.
    - اگر از طریق تونل SSH متصل می‌شوید، تأیید کنید تونل محلی بالا است و به پورت درست اشاره می‌کند.
    - تأیید کنید فهرست‌های مجاز شما (DM یا گروه) حساب شما را شامل می‌شوند.

    مستندات: [Tailscale](/fa/gateway/tailscale)، [دسترسی از راه دور](/fa/gateway/remote)، [کانال‌ها](/fa/channels).

  </Accordion>

  <Accordion title="آیا دو نمونه OpenClaw می‌توانند با هم صحبت کنند (محلی + VPS)؟">
    بله. پل داخلی "بات‌به‌بات" وجود ندارد، اما می‌توانید آن را به چند روش
    قابل اتکا سیم‌کشی کنید:

    **ساده‌ترین:** از یک کانال چت عادی استفاده کنید که هر دو بات به آن دسترسی دارند (Telegram/Slack/WhatsApp).
    کاری کنید بات A پیامی به بات B بفرستد، سپس اجازه دهید بات B مثل همیشه پاسخ دهد.

    **پل CLI (عمومی):** اسکریپتی اجرا کنید که Gateway دیگر را با
    `openclaw agent --message ... --deliver` فراخوانی کند و چتی را هدف بگیرد که بات دیگر
    در آن گوش می‌دهد. اگر یکی از بات‌ها روی یک VPS راه دور است، CLI خود را از طریق SSH/Tailscale
    به آن Gateway راه دور اشاره دهید ([دسترسی از راه دور](/fa/gateway/remote) را ببینید).

    الگوی نمونه (از ماشینی اجرا کنید که بتواند به Gateway هدف دسترسی داشته باشد):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نکته: یک گاردریل اضافه کنید تا دو بات بی‌پایان در حلقه نیفتند (فقط با mention، فهرست‌های
    مجاز کانال، یا قانون "به پیام‌های بات پاسخ نده").

    مستندات: [دسترسی از راه دور](/fa/gateway/remote)، [CLI عامل](/fa/cli/agent)، [ارسال عامل](/fa/tools/agent-send).

  </Accordion>

  <Accordion title="آیا برای چند عامل به VPSهای جداگانه نیاز دارم؟">
    خیر. یک Gateway می‌تواند چند عامل را میزبانی کند، هر کدام با فضای کاری، پیش‌فرض‌های مدل،
    و مسیریابی خودش. این راه‌اندازی معمول است و بسیار ارزان‌تر و ساده‌تر از اجرای
    یک VPS برای هر عامل است.

    فقط وقتی از VPSهای جداگانه استفاده کنید که به جداسازی سخت (مرزهای امنیتی) یا پیکربندی‌های
    بسیار متفاوتی نیاز دارید که نمی‌خواهید مشترک باشند. در غیر این صورت، یک Gateway نگه دارید و
    از چند عامل یا زیرعامل استفاده کنید.

  </Accordion>

  <Accordion title="آیا استفاده از نود روی لپ‌تاپ شخصی من به‌جای SSH از VPS مزیتی دارد؟">
    بله - نودها روش درجه‌یک برای دسترسی به لپ‌تاپ شما از یک Gateway راه دور هستند، و
    بیشتر از دسترسی shell را فعال می‌کنند. Gateway روی macOS/Linux (Windows از طریق WSL2) اجرا می‌شود و
    سبک است (یک VPS کوچک یا جعبه‌ای در حد Raspberry Pi کافی است؛ 4 گیگابایت RAM کاملاً کافی است)، بنابراین یک
    راه‌اندازی رایج، یک میزبان همیشه‌روشن به‌همراه لپ‌تاپ شما به‌عنوان نود است.

    - **SSH ورودی لازم نیست.** نودها به Gateway WebSocket خروجی متصل می‌شوند و از جفت‌سازی دستگاه استفاده می‌کنند.
    - **کنترل‌های اجرای امن‌تر.** `system.run` با فهرست‌های مجاز/تأییدهای نود روی آن لپ‌تاپ محدود می‌شود.
    - **ابزارهای دستگاه بیشتر.** نودها علاوه بر `system.run`، `canvas`، `camera` و `screen` را در معرض استفاده قرار می‌دهند.
    - **خودکارسازی مرورگر محلی.** Gateway را روی یک VPS نگه دارید، اما Chrome را از طریق میزبان نود روی لپ‌تاپ به‌صورت محلی اجرا کنید، یا از طریق Chrome MCP به Chrome محلی روی میزبان متصل شوید.

    SSH برای دسترسی shell موردی مناسب است، اما نودها برای گردش‌کارهای دائمی عامل و
    خودکارسازی دستگاه ساده‌ترند.

    مستندات: [نودها](/fa/nodes)، [CLI نودها](/fa/cli/nodes)، [Browser](/fa/tools/browser).

  </Accordion>

  <Accordion title="آیا نودها سرویس Gateway اجرا می‌کنند؟">
    خیر. مگر اینکه عمداً پروفایل‌های جداافتاده اجرا کنید، فقط **یک gateway** باید روی هر میزبان اجرا شود ([چند Gateway](/fa/gateway/multiple-gateways) را ببینید). نودها وسایل جانبی‌ای هستند که
    به gateway متصل می‌شوند (نودهای iOS/Android، یا "حالت نود" macOS در اپ menubar). برای میزبان‌های نود
    headless و کنترل CLI، [CLI میزبان Node](/fa/cli/node) را ببینید.

    برای تغییرات `gateway`، `discovery` و `canvasHost` راه‌اندازی مجدد کامل لازم است.

  </Accordion>

  <Accordion title="آیا راهی با API / RPC برای اعمال پیکربندی وجود دارد؟">
    بله.

    - `config.schema.lookup`: پیش از نوشتن، یک زیردرخت پیکربندی را با گره اسکیمای سطحی، راهنمای UI منطبق، و خلاصه‌های فرزندهای مستقیم آن بررسی کنید
    - `config.get`: اسنپ‌شات فعلی + هش را واکشی کنید
    - `config.patch`: به‌روزرسانی جزئی امن (برای بیشتر ویرایش‌های RPC ترجیح داده می‌شود)؛ در صورت امکان بارگذاری مجدد زنده انجام می‌دهد و وقتی لازم باشد دوباره راه‌اندازی می‌کند
    - `config.apply`: کل پیکربندی را اعتبارسنجی و جایگزین می‌کند؛ در صورت امکان بارگذاری مجدد زنده انجام می‌دهد و وقتی لازم باشد دوباره راه‌اندازی می‌کند
    - ابزار runtime مالک‌محور `gateway` همچنان از بازنویسی `tools.exec.ask` / `tools.exec.security` خودداری می‌کند؛ نام‌های مستعار قدیمی `tools.bash.*` به همان مسیرهای اجرایی محافظت‌شده نرمال‌سازی می‌شوند

  </Accordion>

  <Accordion title="پیکربندی حداقلی معقول برای نصب اول">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    این کار workspace شما را تنظیم می‌کند و محدود می‌کند چه کسی بتواند bot را اجرا کند.

  </Accordion>

  <Accordion title="چطور Tailscale را روی VPS راه‌اندازی کنم و از Mac وصل شوم؟">
    مراحل حداقلی:

    1. **نصب + ورود روی VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **نصب + ورود روی Mac**
       - از برنامه Tailscale استفاده کنید و وارد همان tailnet شوید.
    3. **فعال‌سازی MagicDNS (توصیه‌شده)**
       - در کنسول مدیریت Tailscale، MagicDNS را فعال کنید تا VPS یک نام پایدار داشته باشد.
    4. **استفاده از hostname در tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    اگر Control UI را بدون SSH می‌خواهید، از Tailscale Serve روی VPS استفاده کنید:

    ```bash
    openclaw gateway --tailscale serve
    ```

    این کار Gateway را به loopback محدود نگه می‌دارد و HTTPS را از طریق Tailscale در دسترس قرار می‌دهد. [Tailscale](/fa/gateway/tailscale) را ببینید.

  </Accordion>

  <Accordion title="چطور یک Mac node را به Gateway راه‌دور (Tailscale Serve) وصل کنم؟">
    Serve **Gateway Control UI + WS** را در دسترس قرار می‌دهد. Nodeها از همان endpoint مربوط به Gateway WS وصل می‌شوند.

    راه‌اندازی پیشنهادی:

    1. **مطمئن شوید VPS + Mac روی یک tailnet هستند**.
    2. **از برنامه macOS در حالت Remote استفاده کنید** (مقصد SSH می‌تواند hostname مربوط به tailnet باشد).
       برنامه پورت Gateway را tunnel می‌کند و به‌عنوان یک Node وصل می‌شود.
    3. **Node را روی Gateway تأیید کنید**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    مستندات: [پروتکل Gateway](/fa/gateway/protocol)، [کشف](/fa/gateway/discovery)، [حالت راه‌دور macOS](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="آیا باید روی لپ‌تاپ دوم نصب کنم یا فقط یک Node اضافه کنم؟">
    اگر روی لپ‌تاپ دوم فقط به **ابزارهای محلی** (screen/camera/exec) نیاز دارید، آن را به‌عنوان یک
    **Node** اضافه کنید. این کار یک Gateway واحد نگه می‌دارد و از پیکربندی تکراری جلوگیری می‌کند. ابزارهای Node محلی
    در حال حاضر فقط برای macOS هستند، اما قصد داریم آن‌ها را به سیستم‌عامل‌های دیگر هم گسترش دهیم.

    فقط وقتی Gateway دوم نصب کنید که به **جداسازی سخت‌گیرانه** یا دو bot کاملاً جدا نیاز دارید.

    مستندات: [Nodeها](/fa/nodes)، [CLI Nodeها](/fa/cli/nodes)، [چند Gateway](/fa/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغیرهای محیطی و بارگذاری .env

<AccordionGroup>
  <Accordion title="OpenClaw چطور متغیرهای محیطی را بارگذاری می‌کند؟">
    OpenClaw متغیرهای محیطی را از فرایند والد (shell، launchd/systemd، CI و غیره) می‌خواند و علاوه بر آن این موارد را بارگذاری می‌کند:

    - `.env` از working directory فعلی
    - fallback سراسری `.env` از `~/.openclaw/.env` (یا همان `$OPENCLAW_STATE_DIR/.env`)

    هیچ‌کدام از فایل‌های `.env` متغیرهای محیطی موجود را override نمی‌کنند.

    همچنین می‌توانید متغیرهای محیطی inline را در پیکربندی تعریف کنید (فقط اگر در محیط فرایند موجود نباشند اعمال می‌شوند):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    برای ترتیب تقدم و منابع کامل، [/environment](/fa/help/environment) را ببینید.

  </Accordion>

  <Accordion title="Gateway را از طریق service شروع کردم و متغیرهای محیطی‌ام ناپدید شدند. حالا چه کنم؟">
    دو راه‌حل رایج:

    1. کلیدهای گم‌شده را در `~/.openclaw/.env` بگذارید تا حتی وقتی service محیط shell شما را به ارث نمی‌برد هم برداشته شوند.
    2. import از shell را فعال کنید (سهولت اختیاری):

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

    این کار login shell شما را اجرا می‌کند و فقط کلیدهای موردانتظار گم‌شده را import می‌کند (هرگز override نمی‌کند). معادل‌های متغیر محیطی:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN را تنظیم کردم، اما وضعیت models نشان می‌دهد "Shell env: off." چرا؟'>
    `openclaw models status` گزارش می‌دهد که آیا **import از shell env** فعال است یا نه. "Shell env: off"
    به این معنی **نیست** که متغیرهای محیطی شما گم شده‌اند؛ فقط یعنی OpenClaw
    login shell شما را به‌صورت خودکار بارگذاری نمی‌کند.

    اگر Gateway به‌عنوان service اجرا شود (launchd/systemd)، محیط shell شما را
    به ارث نمی‌برد. با یکی از این کارها مشکل را رفع کنید:

    1. token را در `~/.openclaw/.env` بگذارید:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. یا import از shell را فعال کنید (`env.shellEnv.enabled: true`).
    3. یا آن را به block پیکربندی `env` اضافه کنید (فقط اگر گم باشد اعمال می‌شود).

    سپس Gateway را restart کنید و دوباره بررسی کنید:

    ```bash
    openclaw models status
    ```

    tokenهای Copilot از `COPILOT_GITHUB_TOKEN` خوانده می‌شوند (همچنین `GH_TOKEN` / `GITHUB_TOKEN`).
    [/concepts/model-providers](/fa/concepts/model-providers) و [/environment](/fa/help/environment) را ببینید.

  </Accordion>
</AccordionGroup>

## Sessionها و چند chat

<AccordionGroup>
  <Accordion title="چطور یک گفت‌وگوی تازه شروع کنم؟">
    `/new` یا `/reset` را به‌عنوان یک پیام مستقل بفرستید. [مدیریت Session](/fa/concepts/session) را ببینید.
  </Accordion>

  <Accordion title="اگر هیچ‌وقت /new نفرستم، Sessionها خودکار reset می‌شوند؟">
    Sessionها می‌توانند پس از `session.idleMinutes` منقضی شوند، اما این قابلیت **به‌صورت پیش‌فرض غیرفعال است** (پیش‌فرض **0**).
    برای فعال‌سازی انقضای بیکاری، آن را روی یک مقدار مثبت تنظیم کنید. وقتی فعال باشد، **پیام بعدی**
    پس از دوره بیکاری، برای آن chat key یک session id تازه شروع می‌کند.
    این کار transcriptها را حذف نمی‌کند؛ فقط یک session جدید شروع می‌کند.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="آیا راهی هست یک تیم از نمونه‌های OpenClaw بسازم (یک CEO و چندین agent)؟">
    بله، از طریق **multi-agent routing** و **sub-agents**. می‌توانید یک agent هماهنگ‌کننده
    و چند worker agent با workspaceها و مدل‌های خودشان بسازید.

    بااین‌حال، بهتر است این را یک **آزمایش سرگرم‌کننده** بدانید. مصرف token آن زیاد است و اغلب
    از استفاده از یک bot با sessionهای جداگانه کم‌بازده‌تر است. مدل معمولی که
    تصور می‌کنیم، یک bot است که با آن صحبت می‌کنید و برای کارهای موازی sessionهای متفاوت دارید. همان
    bot همچنین می‌تواند در صورت نیاز sub-agentها را spawn کند.

    مستندات: [Multi-agent routing](/fa/concepts/multi-agent)، [Sub-agents](/fa/tools/subagents)، [CLI Agentها](/fa/cli/agents).

  </Accordion>

  <Accordion title="چرا context وسط کار truncate شد؟ چطور از آن جلوگیری کنم؟">
    context مربوط به Session به پنجره مدل محدود است. chatهای طولانی، خروجی‌های بزرگ tool، یا فایل‌های زیاد
    می‌توانند باعث Compaction یا truncation شوند.

    کارهایی که کمک می‌کنند:

    - از bot بخواهید وضعیت فعلی را خلاصه کند و در یک فایل بنویسد.
    - پیش از کارهای طولانی از `/compact` استفاده کنید، و هنگام تغییر موضوع از `/new`.
    - context مهم را در workspace نگه دارید و از bot بخواهید دوباره آن را بخواند.
    - برای کارهای طولانی یا موازی از sub-agentها استفاده کنید تا chat اصلی کوچک‌تر بماند.
    - اگر این اتفاق زیاد رخ می‌دهد، مدلی با پنجره context بزرگ‌تر انتخاب کنید.

  </Accordion>

  <Accordion title="چطور OpenClaw را کامل reset کنم اما نصب‌شده نگه دارم؟">
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

    نکته‌ها:

    - اگر onboarding پیکربندی موجودی ببیند، گزینه **Reset** را هم پیشنهاد می‌دهد. [Onboarding (CLI)](/fa/start/wizard) را ببینید.
    - اگر از profileها (`--profile` / `OPENCLAW_PROFILE`) استفاده کرده‌اید، هر state dir را reset کنید (پیش‌فرض‌ها `~/.openclaw-<profile>` هستند).
    - reset توسعه: `openclaw gateway --dev --reset` (فقط توسعه؛ پیکربندی توسعه + credentials + sessionها + workspace را پاک می‌کند).

  </Accordion>

  <Accordion title='خطاهای "context too large" می‌گیرم؛ چطور reset یا compact کنم؟'>
    یکی از این‌ها را استفاده کنید:

    - **Compact** (گفت‌وگو را نگه می‌دارد اما turnهای قدیمی‌تر را خلاصه می‌کند):

      ```
      /compact
      ```

      یا برای هدایت خلاصه، `/compact <instructions>`.

    - **Reset** (session ID تازه برای همان chat key):

      ```
      /new
      /reset
      ```

    اگر همچنان رخ می‌دهد:

    - **هرس Session** (`agents.defaults.contextPruning`) را فعال یا تنظیم کنید تا خروجی قدیمی tool کوتاه شود.
    - از مدلی با پنجره context بزرگ‌تر استفاده کنید.

    مستندات: [Compaction](/fa/concepts/compaction)، [هرس Session](/fa/concepts/session-pruning)، [مدیریت Session](/fa/concepts/session).

  </Accordion>

  <Accordion title='چرا "LLM request rejected: messages.content.tool_use.input field required" می‌بینم؟'>
    این یک خطای اعتبارسنجی provider است: مدل یک block از نوع `tool_use` بدون
    `input` لازم تولید کرده است. معمولاً یعنی تاریخچه session کهنه یا خراب شده است (اغلب پس از threadهای طولانی
    یا تغییر tool/schema).

    رفع مشکل: با `/new` یک session تازه شروع کنید (پیام مستقل).

  </Accordion>

  <Accordion title="چرا هر ۳۰ دقیقه پیام Heartbeat می‌گیرم؟">
    Heartbeatها به‌صورت پیش‌فرض هر **30m** اجرا می‌شوند (هنگام استفاده از OAuth auth، هر **1h**). آن‌ها را تنظیم یا غیرفعال کنید:

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

    اگر `HEARTBEAT.md` وجود داشته باشد اما عملاً خالی باشد (فقط خط‌های خالی و headerهای markdown
    مثل `# Heading`)، OpenClaw برای صرفه‌جویی در API callها اجرای Heartbeat را رد می‌کند.
    اگر فایل موجود نباشد، Heartbeat همچنان اجرا می‌شود و مدل تصمیم می‌گیرد چه کند.

    overrideهای per-agent از `agents.list[].heartbeat` استفاده می‌کنند. مستندات: [Heartbeat](/fa/gateway/heartbeat).

  </Accordion>

  <Accordion title='آیا باید یک "bot account" به گروه WhatsApp اضافه کنم؟'>
    نه. OpenClaw روی **حساب خودتان** اجرا می‌شود، پس اگر شما در گروه باشید، OpenClaw می‌تواند آن را ببیند.
    به‌صورت پیش‌فرض، replyهای گروهی تا زمانی که senderها را مجاز نکنید مسدود هستند (`groupPolicy: "allowlist"`).

    اگر می‌خواهید فقط **شما** بتوانید replyهای گروهی را trigger کنید:

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

  <Accordion title="چطور JID یک گروه WhatsApp را به‌دست بیاورم؟">
    گزینه ۱ (سریع‌ترین): logها را tail کنید و یک پیام آزمایشی در گروه بفرستید:

    ```bash
    openclaw logs --follow --json
    ```

    دنبال `chatId` (یا `from`) بگردید که به `@g.us` ختم می‌شود، مانند:
    `1234567890-1234567890@g.us`.

    گزینه ۲ (اگر قبلاً پیکربندی/allowlist شده است): گروه‌ها را از پیکربندی فهرست کنید:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    مستندات: [WhatsApp](/fa/channels/whatsapp)، [Directory](/fa/cli/directory)، [Logs](/fa/cli/logs).

  </Accordion>

  <Accordion title="چرا OpenClaw در یک گروه reply نمی‌دهد؟">
    دو علت رایج:

    - mention gating روشن است (پیش‌فرض). باید bot را @mention کنید (یا با `mentionPatterns` مطابقت داشته باشید).
    - `channels.whatsapp.groups` را بدون `"*"` پیکربندی کرده‌اید و گروه در allowlist نیست.

    [گروه‌ها](/fa/channels/groups) و [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.

  </Accordion>

  <Accordion title="آیا گروه‌ها/threadها با DMها context مشترک دارند؟">
    chatهای مستقیم به‌صورت پیش‌فرض در session اصلی ادغام می‌شوند. گروه‌ها/channelها session keyهای خودشان را دارند، و topicهای Telegram / threadهای Discord sessionهای جدا هستند. [گروه‌ها](/fa/channels/groups) و [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.
  </Accordion>

  <Accordion title="چند workspace و agent می‌توانم بسازم؟">
    محدودیت سختی وجود ندارد. ده‌ها مورد (حتی صدها) مشکلی ندارد، اما مراقب این‌ها باشید:

    - **رشد دیسک:** sessionها + transcriptها زیر `~/.openclaw/agents/<agentId>/sessions/` قرار می‌گیرند.
    - **هزینه token:** agentهای بیشتر یعنی استفاده هم‌زمان بیشتر از مدل.
    - **سربار عملیات:** auth profileها، workspaceها، و channel routing به‌ازای هر agent.

    نکته‌ها:

    - برای هر agent یک workspace **فعال** نگه دارید (`agents.defaults.workspace`).
    - اگر دیسک رشد کرد، sessionهای قدیمی را prune کنید (JSONL یا store entryها را حذف کنید).
    - برای پیدا کردن workspaceهای سرگردان و mismatchهای profile از `openclaw doctor` استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم چند ربات یا چت را هم‌زمان اجرا کنم (Slack)، و چطور باید آن را راه‌اندازی کنم؟">
    بله. از **مسیریابی چندعاملی** استفاده کنید تا چند عامل ایزوله را اجرا کنید و پیام‌های ورودی را بر اساس
    کانال/حساب/همتا مسیریابی کنید. Slack به‌عنوان یک کانال پشتیبانی می‌شود و می‌تواند به عامل‌های مشخص متصل شود.

    دسترسی مرورگر قدرتمند است، اما به این معنی نیست که «هر کاری را که انسان می‌تواند انجام دهد» انجام می‌دهد؛ سازوکارهای ضدربات، CAPTCHAها، و MFA
    همچنان می‌توانند خودکارسازی را مسدود کنند. برای مطمئن‌ترین کنترل مرورگر، از Chrome MCP محلی روی میزبان
    استفاده کنید، یا از CDP روی ماشینی استفاده کنید که مرورگر را واقعاً اجرا می‌کند.

    راه‌اندازی پیشنهادی:

    - میزبان Gateway همیشه روشن (VPS/Mac mini).
    - یک عامل برای هر نقش (اتصال‌ها).
    - کانال(های) Slack متصل به آن عامل‌ها.
    - مرورگر محلی از طریق Chrome MCP یا یک Node در صورت نیاز.

    مستندات: [مسیریابی چندعاملی](/fa/concepts/multi-agent), [Slack](/fa/channels/slack),
    [مرورگر](/fa/tools/browser), [Nodeها](/fa/nodes).

  </Accordion>
</AccordionGroup>

## مدل‌ها، جابه‌جایی هنگام خرابی، و پروفایل‌های احراز هویت

پرسش و پاسخ مدل‌ها — پیش‌فرض‌ها، انتخاب، نام‌های مستعار، تعویض، جابه‌جایی هنگام خرابی، پروفایل‌های احراز هویت —
در [پرسش‌های متداول مدل‌ها](/fa/help/faq-models) قرار دارد.

## Gateway: پورت‌ها، «در حال اجرا است»، و حالت راه دور

<AccordionGroup>
  <Accordion title="Gateway از چه پورتی استفاده می‌کند؟">
    `gateway.port` پورت چندگانه واحد را برای WebSocket + HTTP (Control UI، hookها، و غیره) کنترل می‌کند.

    اولویت:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='چرا openclaw gateway status می‌گوید "Runtime: running" اما "Connectivity probe: failed"؟'>
    چون "running" دیدگاه **سرپرست** است (launchd/systemd/schtasks). بررسی اتصال یعنی CLI واقعاً به WebSocket درگاه وصل می‌شود.

    از `openclaw gateway status` استفاده کنید و به این خطوط اعتماد کنید:

    - `Probe target:` (نشانی‌ای که بررسی اتصال واقعاً استفاده کرده است)
    - `Listening:` (چیزی که واقعاً روی پورت bind شده است)
    - `Last gateway error:` (علت ریشه‌ای رایج وقتی فرایند زنده است اما پورت در حال گوش‌دادن نیست)

  </Accordion>

  <Accordion title='چرا openclaw gateway status مقدارهای متفاوتی برای "Config (cli)" و "Config (service)" نشان می‌دهد؟'>
    شما در حال ویرایش یک فایل پیکربندی هستید، در حالی که سرویس فایل دیگری را اجرا می‌کند (اغلب به‌دلیل ناهماهنگی `--profile` / `OPENCLAW_STATE_DIR`).

    رفع مشکل:

    ```bash
    openclaw gateway install --force
    ```

    آن را از همان `--profile` / محیطی اجرا کنید که می‌خواهید سرویس از آن استفاده کند.

  </Accordion>

  <Accordion title='عبارت "another gateway instance is already listening" یعنی چه؟'>
    OpenClaw با bind کردن فوری شنونده WebSocket هنگام راه‌اندازی، یک قفل زمان اجرا اعمال می‌کند (پیش‌فرض `ws://127.0.0.1:18789`). اگر bind با `EADDRINUSE` شکست بخورد، خطای `GatewayLockError` صادر می‌کند که نشان می‌دهد نمونه دیگری در حال گوش‌دادن است.

    رفع مشکل: نمونه دیگر را متوقف کنید، پورت را آزاد کنید، یا با `openclaw gateway --port <port>` اجرا کنید.

  </Accordion>

  <Accordion title="چگونه OpenClaw را در حالت راه دور اجرا کنم (کلاینت به Gateway در جای دیگری وصل شود)؟">
    `gateway.mode: "remote"` را تنظیم کنید و به یک URL راه دور WebSocket اشاره کنید، به‌صورت اختیاری همراه با اعتبارنامه‌های راه دور دارای راز مشترک:

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

    - `openclaw gateway` فقط وقتی شروع می‌شود که `gateway.mode` برابر `local` باشد (یا پرچم بازنویسی را بدهید).
    - برنامه macOS فایل پیکربندی را زیر نظر دارد و هنگام تغییر این مقدارها، حالت‌ها را زنده عوض می‌کند.
    - `gateway.remote.token` / `.password` فقط اعتبارنامه‌های راه دور سمت کلاینت هستند؛ آن‌ها به‌تنهایی احراز هویت Gateway محلی را فعال نمی‌کنند.

  </Accordion>

  <Accordion title='Control UI می‌گوید "unauthorized" (یا مدام دوباره وصل می‌شود). حالا چه کنم؟'>
    مسیر احراز هویت Gateway شما با روش احراز هویت UI مطابقت ندارد.

    واقعیت‌ها (از کد):

    - Control UI توکن را برای نشست برگه فعلی مرورگر و URL انتخاب‌شده Gateway در `sessionStorage` نگه می‌دارد، بنابراین تازه‌سازی‌های همان برگه بدون بازیابی ماندگاری توکن بلندمدت در localStorage همچنان کار می‌کنند.
    - در `AUTH_TOKEN_MISMATCH`، کلاینت‌های مورد اعتماد می‌توانند وقتی Gateway راهنمایی‌های تلاش دوباره را برمی‌گرداند (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`)، یک تلاش دوباره محدود با توکن دستگاه کش‌شده انجام دهند.
    - این تلاش دوباره با توکن کش‌شده اکنون از همان scopeهای تأییدشده کش‌شده که همراه توکن دستگاه ذخیره شده‌اند استفاده می‌کند. فراخواننده‌های دارای `deviceToken` صریح / `scopes` صریح همچنان به‌جای به‌ارث‌بردن scopeهای کش‌شده، مجموعه scope درخواستی خود را نگه می‌دارند.
    - بیرون از آن مسیر تلاش دوباره، اولویت احراز هویت اتصال ابتدا توکن/رمز عبور مشترک صریح، سپس `deviceToken` صریح، سپس توکن دستگاه ذخیره‌شده، و سپس توکن bootstrap است.
    - بررسی‌های scope توکن bootstrap دارای پیشوند نقش هستند. allowlist داخلی bootstrap operator فقط درخواست‌های operator را برآورده می‌کند؛ Node یا نقش‌های غیر operator دیگر همچنان به scopeهایی زیر پیشوند نقش خودشان نیاز دارند.

    رفع مشکل:

    - سریع‌ترین راه: `openclaw dashboard` (URL داشبورد را چاپ و کپی می‌کند، تلاش می‌کند آن را باز کند؛ اگر headless باشد راهنمای SSH نشان می‌دهد).
    - اگر هنوز توکن ندارید: `openclaw doctor --generate-gateway-token`.
    - اگر راه دور است، ابتدا تونل بزنید: `ssh -N -L 18789:127.0.0.1:18789 user@host` سپس `http://127.0.0.1:18789/` را باز کنید.
    - حالت راز مشترک: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` یا `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` را تنظیم کنید، سپس راز مطابق را در تنظیمات Control UI جای‌گذاری کنید.
    - حالت Tailscale Serve: مطمئن شوید `gateway.auth.allowTailscale` فعال است و URL مربوط به Serve را باز می‌کنید، نه یک URL خام loopback/tailnet که سرآیندهای هویت Tailscale را دور می‌زند.
    - حالت پراکسی مورد اعتماد: مطمئن شوید از مسیر پراکسی آگاه به هویت پیکربندی‌شده می‌آیید، نه یک URL خام Gateway. پراکسی‌های loopback روی همان میزبان نیز به `gateway.auth.trustedProxy.allowLoopback = true` نیاز دارند.
    - اگر ناهماهنگی پس از یک تلاش دوباره همچنان ادامه داشت، توکن دستگاه جفت‌شده را بچرخانید/دوباره تأیید کنید:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - اگر آن فراخوانی rotate گفت رد شده است، دو چیز را بررسی کنید:
      - نشست‌های دستگاه جفت‌شده فقط می‌توانند دستگاه **خودشان** را بچرخانند، مگر اینکه `operator.admin` هم داشته باشند
      - مقدارهای صریح `--scope` نمی‌توانند از scopeهای operator فعلی فراخواننده فراتر بروند
    - هنوز گیر کرده‌اید؟ `openclaw status --all` را اجرا کنید و [عیب‌یابی](/fa/gateway/troubleshooting) را دنبال کنید. برای جزئیات احراز هویت، [داشبورد](/fa/web/dashboard) را ببینید.

  </Accordion>

  <Accordion title="gateway.bind را روی tailnet تنظیم کردم، اما نمی‌تواند bind شود و چیزی گوش نمی‌دهد">
    bind مربوط به `tailnet` یک IP متعلق به Tailscale را از رابط‌های شبکه شما انتخاب می‌کند (100.64.0.0/10). اگر ماشین روی Tailscale نباشد (یا رابط down باشد)، چیزی برای bind شدن وجود ندارد.

    رفع مشکل:

    - Tailscale را روی آن میزبان شروع کنید (تا یک نشانی 100.x داشته باشد)، یا
    - به `gateway.bind: "loopback"` / `"lan"` تغییر دهید.

    نکته: `tailnet` صریح است. `auto`، loopback را ترجیح می‌دهد؛ وقتی bind فقط مخصوص tailnet می‌خواهید از `gateway.bind: "tailnet"` استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم چند Gateway را روی یک میزبان اجرا کنم؟">
    معمولاً نه؛ یک Gateway می‌تواند چند کانال پیام‌رسانی و عامل را اجرا کند. فقط وقتی به افزونگی (مثلاً ربات نجات) یا ایزولاسیون سخت نیاز دارید از چند Gateway استفاده کنید.

    بله، اما باید ایزوله کنید:

    - `OPENCLAW_CONFIG_PATH` (پیکربندی برای هر نمونه)
    - `OPENCLAW_STATE_DIR` (وضعیت برای هر نمونه)
    - `agents.defaults.workspace` (ایزولاسیون فضای کار)
    - `gateway.port` (پورت‌های یکتا)

    راه‌اندازی سریع (پیشنهادی):

    - برای هر نمونه از `openclaw --profile <name> ...` استفاده کنید (به‌صورت خودکار `~/.openclaw-<name>` را می‌سازد).
    - در پیکربندی هر پروفایل یک `gateway.port` یکتا تنظیم کنید (یا برای اجراهای دستی `--port` را بدهید).
    - یک سرویس برای هر پروفایل نصب کنید: `openclaw --profile <name> gateway install`.

    پروفایل‌ها نام سرویس‌ها را نیز پسوندگذاری می‌کنند (`ai.openclaw.<profile>`؛ موارد قدیمی `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    راهنمای کامل: [چند Gateway](/fa/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='عبارت "invalid handshake" / کد 1008 یعنی چه؟'>
    Gateway یک **سرور WebSocket** است و انتظار دارد نخستین پیام
    یک فریم `connect` باشد. اگر هر چیز دیگری دریافت کند، اتصال را
    با **کد 1008** (نقض policy) می‌بندد.

    علت‌های رایج:

    - شما URL مربوط به **HTTP** را در مرورگر باز کرده‌اید (`http://...`) به‌جای یک کلاینت WS.
    - از پورت یا مسیر اشتباه استفاده کرده‌اید.
    - یک پراکسی یا تونل سرآیندهای احراز هویت را حذف کرده یا یک درخواست غیر Gateway فرستاده است.

    رفع سریع:

    1. از URL مربوط به WS استفاده کنید: `ws://<host>:18789` (یا اگر HTTPS است `wss://...`).
    2. پورت WS را در یک برگه معمولی مرورگر باز نکنید.
    3. اگر احراز هویت روشن است، توکن/رمز عبور را در فریم `connect` بگنجانید.

    اگر از CLI یا TUI استفاده می‌کنید، URL باید شبیه این باشد:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    جزئیات پروتکل: [پروتکل Gateway](/fa/gateway/protocol).

  </Accordion>
</AccordionGroup>

## ثبت وقایع و اشکال‌زدایی

<AccordionGroup>
  <Accordion title="لاگ‌ها کجا هستند؟">
    لاگ‌های فایل (ساختاریافته):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    می‌توانید از طریق `logging.file` یک مسیر پایدار تنظیم کنید. سطح لاگ فایل با `logging.level` کنترل می‌شود. میزان جزئیات کنسول با `--verbose` و `logging.consoleLevel` کنترل می‌شود.

    سریع‌ترین دنبال‌کردن لاگ:

    ```bash
    openclaw logs --follow
    ```

    لاگ‌های سرویس/سرپرست (وقتی gateway از طریق launchd/systemd اجرا می‌شود):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` و `gateway.err.log` (پیش‌فرض: `~/.openclaw/logs/...`؛ پروفایل‌ها از `~/.openclaw-<profile>/logs/...` استفاده می‌کنند)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    برای اطلاعات بیشتر [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید.

  </Accordion>

  <Accordion title="چگونه سرویس Gateway را شروع/متوقف/بازراه‌اندازی کنم؟">
    از کمک‌کننده‌های gateway استفاده کنید:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر gateway را دستی اجرا می‌کنید، `openclaw gateway --force` می‌تواند پورت را پس بگیرد. [Gateway](/fa/gateway) را ببینید.

  </Accordion>

  <Accordion title="ترمینالم را در Windows بستم؛ چگونه OpenClaw را دوباره شروع کنم؟">
    **دو حالت نصب Windows** وجود دارد:

    **1) WSL2 (پیشنهادی):** Gateway داخل Linux اجرا می‌شود.

    PowerShell را باز کنید، وارد WSL شوید، سپس بازراه‌اندازی کنید:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر هرگز سرویس را نصب نکرده‌اید، آن را در پیش‌زمینه شروع کنید:

    ```bash
    openclaw gateway run
    ```

    **2) Windows بومی (پیشنهاد نمی‌شود):** Gateway مستقیماً در Windows اجرا می‌شود.

    PowerShell را باز کنید و اجرا کنید:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر آن را دستی اجرا می‌کنید (بدون سرویس)، از این استفاده کنید:

    ```powershell
    openclaw gateway run
    ```

    مستندات: [Windows (WSL2)](/fa/platforms/windows), [دفترچه اجرای سرویس Gateway](/fa/gateway).

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
    - جفت‌سازی کانال/allowlist پاسخ‌ها را مسدود می‌کند (پیکربندی کانال + لاگ‌ها را بررسی کنید).
    - WebChat/Dashboard بدون توکن درست باز است.

    اگر راه دور هستید، تأیید کنید اتصال تونل/Tailscale برقرار است و
    WebSocket مربوط به Gateway در دسترس است.

    مستندات: [کانال‌ها](/fa/channels), [عیب‌یابی](/fa/gateway/troubleshooting), [دسترسی راه دور](/fa/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason"؛ حالا چه کنم؟'>
    این معمولاً یعنی UI اتصال WebSocket را از دست داده است. بررسی کنید:

    1. آیا Gateway در حال اجراست؟ `openclaw gateway status`
    2. آیا Gateway سالم است؟ `openclaw status`
    3. آیا UI توکن درست را دارد؟ `openclaw dashboard`
    4. اگر راه دور است، آیا لینک تونل/Tailscale برقرار است؟

    سپس لاگ‌ها را دنبال کنید:

    ```bash
    openclaw logs --follow
    ```

    مستندات: [داشبورد](/fa/web/dashboard)، [دسترسی راه دور](/fa/gateway/remote)، [عیب‌یابی](/fa/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands شکست می‌خورد. چه چیزی را باید بررسی کنم؟">
    با لاگ‌ها و وضعیت کانال شروع کنید:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    سپس خطا را تطبیق دهید:

    - `BOT_COMMANDS_TOO_MUCH`: منوی Telegram ورودی‌های زیادی دارد. OpenClaw از قبل آن را تا حد مجاز Telegram کوتاه می‌کند و با فرمان‌های کمتر دوباره تلاش می‌کند، اما بعضی ورودی‌های منو هنوز باید حذف شوند. فرمان‌های Plugin/Skill/سفارشی را کاهش دهید، یا اگر به منو نیاز ندارید `channels.telegram.commands.native` را غیرفعال کنید.
    - `TypeError: fetch failed`، `Network request for 'setMyCommands' failed!`، یا خطاهای شبکه مشابه: اگر روی VPS هستید یا پشت پراکسی قرار دارید، تأیید کنید HTTPS خروجی مجاز است و DNS برای `api.telegram.org` کار می‌کند.

    اگر Gateway راه دور است، مطمئن شوید لاگ‌های میزبان Gateway را می‌بینید.

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

  <Accordion title="چگونه Gateway را کاملاً متوقف و سپس شروع کنم؟">
    اگر سرویس را نصب کرده‌اید:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    این کار **سرویس تحت نظارت** را متوقف/شروع می‌کند (launchd در macOS، systemd در Linux).
    وقتی Gateway به‌صورت یک daemon در پس‌زمینه اجرا می‌شود از این استفاده کنید.

    اگر در پیش‌زمینه اجرا می‌کنید، با Ctrl-C متوقف کنید، سپس:

    ```bash
    openclaw gateway run
    ```

    مستندات: [راهنمای عملیاتی سرویس Gateway](/fa/gateway).

  </Accordion>

  <Accordion title="توضیح ساده: openclaw gateway restart در برابر openclaw gateway">
    - `openclaw gateway restart`: **سرویس پس‌زمینه** را دوباره راه‌اندازی می‌کند (launchd/systemd).
    - `openclaw gateway`: gateway را برای این نشست ترمینال **در پیش‌زمینه** اجرا می‌کند.

    اگر سرویس را نصب کرده‌اید، از فرمان‌های gateway استفاده کنید. وقتی
    یک اجرای پیش‌زمینه و یک‌باره می‌خواهید، از `openclaw gateway` استفاده کنید.

  </Accordion>

  <Accordion title="سریع‌ترین راه برای گرفتن جزئیات بیشتر وقتی چیزی شکست می‌خورد">
    Gateway را با `--verbose` شروع کنید تا جزئیات کنسول بیشتری بگیرید. سپس فایل لاگ را برای احراز هویت کانال، مسیریابی مدل، و خطاهای RPC بررسی کنید.
  </Accordion>
</AccordionGroup>

## رسانه و پیوست‌ها

<AccordionGroup>
  <Accordion title="Skill من یک تصویر/PDF تولید کرد، اما چیزی ارسال نشد">
    پیوست‌های خروجی از عامل باید یک خط `MEDIA:<path-or-url>` داشته باشند (در خط مستقل خودش). [راه‌اندازی دستیار OpenClaw](/fa/start/openclaw) و [ارسال عامل](/fa/tools/agent-send) را ببینید.

    ارسال با CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    همچنین بررسی کنید:

    - کانال هدف از رسانه خروجی پشتیبانی می‌کند و با allowlistها مسدود نشده است.
    - فایل در محدوده اندازه ارائه‌دهنده است (تصاویر به حداکثر 2048px تغییر اندازه داده می‌شوند).
    - `tools.fs.workspaceOnly=true` ارسال‌های مسیر محلی را به workspace، temp/media-store، و فایل‌های اعتبارسنجی‌شده در sandbox محدود نگه می‌دارد.
    - `tools.fs.workspaceOnly=false` اجازه می‌دهد `MEDIA:` فایل‌های محلی میزبان را که عامل از قبل می‌تواند بخواند ارسال کند، اما فقط برای رسانه به‌علاوه انواع سند امن (تصویر، صوت، ویدئو، PDF، و سندهای Office). فایل‌های متن ساده و شبیه راز همچنان مسدود می‌شوند.

    [تصاویر](/fa/nodes/images) را ببینید.

  </Accordion>
</AccordionGroup>

## امنیت و کنترل دسترسی

<AccordionGroup>
  <Accordion title="آیا در معرض قرار دادن OpenClaw برای DMهای ورودی امن است؟">
    DMهای ورودی را ورودی غیرقابل اعتماد در نظر بگیرید. پیش‌فرض‌ها برای کاهش ریسک طراحی شده‌اند:

    - رفتار پیش‌فرض در کانال‌های دارای قابلیت DM، **جفت‌سازی** است:
      - فرستنده‌های ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ ربات پیام آن‌ها را پردازش نمی‌کند.
      - تأیید با: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - درخواست‌های در انتظار به **3 مورد برای هر کانال** محدود هستند؛ اگر کدی نرسید `openclaw pairing list --channel <channel> [--account <id>]` را بررسی کنید.
    - باز کردن عمومی DMها نیازمند opt-in صریح است (`dmPolicy: "open"` و allowlist `"*"`).

    برای آشکار کردن سیاست‌های پرریسک DM، `openclaw doctor` را اجرا کنید.

  </Accordion>

  <Accordion title="آیا prompt injection فقط برای ربات‌های عمومی نگران‌کننده است؟">
    خیر. prompt injection درباره **محتوای غیرقابل اعتماد** است، نه فقط اینکه چه کسی می‌تواند به ربات DM بدهد.
    اگر دستیار شما محتوای خارجی را می‌خواند (جستجو/دریافت وب، صفحه‌های مرورگر، ایمیل‌ها،
    مستندات، پیوست‌ها، لاگ‌های چسبانده‌شده)، آن محتوا می‌تواند شامل دستورهایی باشد که سعی
    می‌کنند مدل را ربوده و منحرف کنند. این حتی وقتی **شما تنها فرستنده هستید** هم می‌تواند رخ دهد.

    بزرگ‌ترین ریسک زمانی است که ابزارها فعال باشند: مدل می‌تواند فریب بخورد تا
    زمینه را بیرون‌ریزی کند یا از طرف شما ابزارها را فراخوانی کند. شعاع اثر را با این کارها کاهش دهید:

    - استفاده از یک عامل «خواننده» فقط‌خواندنی یا بدون ابزار برای خلاصه‌سازی محتوای غیرقابل اعتماد
    - خاموش نگه داشتن `web_search` / `web_fetch` / `browser` برای عامل‌های دارای ابزار
    - غیرقابل اعتماد دانستن متن رمزگشایی‌شده فایل/سند نیز: OpenResponses
      `input_file` و استخراج پیوست رسانه هر دو متن استخراج‌شده را به جای عبور دادن متن خام فایل، در
      نشانگرهای صریح مرز محتوای خارجی قرار می‌دهند
    - sandbox کردن و allowlistهای سخت‌گیرانه ابزار

    جزئیات: [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="آیا ربات من باید ایمیل، حساب GitHub، یا شماره تلفن خودش را داشته باشد؟">
    بله، برای بیشتر راه‌اندازی‌ها. جدا کردن ربات با حساب‌ها و شماره تلفن‌های مستقل
    اگر مشکلی پیش بیاید شعاع اثر را کاهش می‌دهد. همچنین چرخش
    اعتبارنامه‌ها یا لغو دسترسی بدون اثرگذاری بر حساب‌های شخصی شما را آسان‌تر می‌کند.

    کوچک شروع کنید. فقط به ابزارها و حساب‌هایی که واقعاً نیاز دارید دسترسی بدهید، و در صورت نیاز
    بعداً گسترش دهید.

    مستندات: [امنیت](/fa/gateway/security)، [جفت‌سازی](/fa/channels/pairing).

  </Accordion>

  <Accordion title="آیا می‌توانم به آن اختیار پیامک‌هایم را بدهم و آیا این امن است؟">
    ما اختیار کامل روی پیام‌های شخصی شما را توصیه **نمی‌کنیم**. امن‌ترین الگو این است:

    - DMها را در **حالت جفت‌سازی** یا یک allowlist محدود نگه دارید.
    - اگر می‌خواهید از طرف شما پیام بدهد، از یک **شماره یا حساب جداگانه** استفاده کنید.
    - اجازه دهید پیش‌نویس کند، سپس **پیش از ارسال تأیید کنید**.

    اگر می‌خواهید آزمایش کنید، این کار را روی یک حساب اختصاصی انجام دهید و آن را جدا نگه دارید. ببینید
    [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="آیا می‌توانم از مدل‌های ارزان‌تر برای کارهای دستیار شخصی استفاده کنم؟">
    بله، **اگر** عامل فقط چت است و ورودی قابل اعتماد است. رده‌های کوچک‌تر
    در برابر ربایش دستور آسیب‌پذیرتر هستند، بنابراین برای عامل‌های دارای ابزار
    یا هنگام خواندن محتوای غیرقابل اعتماد از آن‌ها پرهیز کنید. اگر مجبورید از مدل کوچک‌تر استفاده کنید،
    ابزارها را قفل کنید و داخل sandbox اجرا کنید. [امنیت](/fa/gateway/security) را ببینید.
  </Accordion>

  <Accordion title="در Telegram /start را اجرا کردم اما کد جفت‌سازی نگرفتم">
    کدهای جفت‌سازی **فقط** وقتی ارسال می‌شوند که یک فرستنده ناشناس به ربات پیام بدهد و
    `dmPolicy: "pairing"` فعال باشد. `/start` به‌تنهایی کدی تولید نمی‌کند.

    درخواست‌های در انتظار را بررسی کنید:

    ```bash
    openclaw pairing list telegram
    ```

    اگر دسترسی فوری می‌خواهید، شناسه فرستنده خود را allowlist کنید یا `dmPolicy: "open"`
    را برای آن حساب تنظیم کنید.

  </Accordion>

  <Accordion title="WhatsApp: آیا به مخاطبان من پیام می‌دهد؟ جفت‌سازی چگونه کار می‌کند؟">
    خیر. سیاست پیش‌فرض WhatsApp برای DM، **جفت‌سازی** است. فرستنده‌های ناشناس فقط یک کد جفت‌سازی می‌گیرند و پیامشان **پردازش نمی‌شود**. OpenClaw فقط به چت‌هایی پاسخ می‌دهد که دریافت می‌کند یا به ارسال‌های صریحی که شما راه‌اندازی می‌کنید.

    جفت‌سازی را با این تأیید کنید:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    درخواست‌های در انتظار را فهرست کنید:

    ```bash
    openclaw pairing list whatsapp
    ```

    اعلان شماره تلفن در ویزارد: برای تنظیم **allowlist/owner** شما استفاده می‌شود تا DMهای خودتان مجاز باشند. برای ارسال خودکار استفاده نمی‌شود. اگر روی شماره شخصی WhatsApp خود اجرا می‌کنید، از همان شماره استفاده کنید و `channels.whatsapp.selfChatMode` را فعال کنید.

  </Accordion>
</AccordionGroup>

## فرمان‌های چت، متوقف کردن وظایف، و «متوقف نمی‌شود»

<AccordionGroup>
  <Accordion title="چگونه جلوی نمایش پیام‌های داخلی سیستم در چت را بگیرم؟">
    بیشتر پیام‌های داخلی یا ابزار فقط وقتی ظاهر می‌شوند که **verbose**، **trace**، یا **reasoning**
    برای آن نشست فعال باشد.

    رفع مشکل در همان چتی که آن را می‌بینید:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    اگر هنوز شلوغ است، تنظیمات نشست را در Control UI بررسی کنید و verbose
    را روی **inherit** بگذارید. همچنین تأیید کنید از پروفایل رباتی استفاده نمی‌کنید که `verboseDefault` در پیکربندی
    روی `on` تنظیم شده باشد.

    مستندات: [تفکر و verbose](/fa/tools/thinking)، [امنیت](/fa/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="چگونه یک وظیفه در حال اجرا را متوقف/لغو کنم؟">
    هرکدام از این‌ها را **به‌عنوان یک پیام مستقل** ارسال کنید (بدون اسلش):

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

    این‌ها محرک‌های abort هستند (نه فرمان‌های اسلش).

    برای فرایندهای پس‌زمینه (از ابزار exec)، می‌توانید از عامل بخواهید اجرا کند:

    ```
    process action:kill sessionId:XXX
    ```

    مرور کلی فرمان‌های اسلش: [فرمان‌های اسلش](/fa/tools/slash-commands) را ببینید.

    بیشتر فرمان‌ها باید به‌عنوان یک پیام **مستقل** که با `/` شروع می‌شود ارسال شوند، اما چند میان‌بر (مثل `/status`) برای فرستنده‌های allowlist‌شده به‌صورت درون‌خطی هم کار می‌کنند.

  </Accordion>

  <Accordion title='چگونه از Telegram یک پیام Discord بفرستم؟ ("Cross-context messaging denied")'>
    OpenClaw پیام‌رسانی **بین ارائه‌دهنده‌ها** را به‌طور پیش‌فرض مسدود می‌کند. اگر فراخوانی ابزار
    به Telegram متصل باشد، به Discord ارسال نمی‌کند مگر اینکه صریحاً اجازه دهید.

    پیام‌رسانی بین ارائه‌دهنده‌ها را برای عامل فعال کنید:

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

  <Accordion title='چرا حس می‌شود ربات پیام‌های پشت‌سرهم سریع را "نادیده می‌گیرد"؟'>
    حالت صف کنترل می‌کند پیام‌های جدید چگونه با اجرای در جریان تعامل کنند. برای تغییر حالت‌ها از `/queue` استفاده کنید:

    - `steer` - همه هدایت‌های در انتظار را برای مرز مدل بعدی در اجرای فعلی صف می‌کند
    - `queue` - هدایت قدیمی یکی‌یکی
    - `followup` - پیام‌ها را یکی‌یکی اجرا می‌کند
    - `collect` - پیام‌ها را دسته‌بندی می‌کند و یک‌بار پاسخ می‌دهد
    - `steer-backlog` - اکنون هدایت می‌کند، سپس backlog را پردازش می‌کند
    - `interrupt` - اجرای فعلی را abort می‌کند و از نو شروع می‌کند

    حالت پیش‌فرض `steer` است. می‌توانید گزینه‌هایی مثل `debounce:0.5s cap:25 drop:summarize` را برای حالت‌های followup اضافه کنید. [صف فرمان](/fa/concepts/queue) و [صف هدایت](/fa/concepts/queue-steering) را ببینید.

  </Accordion>
</AccordionGroup>

## متفرقه

<AccordionGroup>
  <Accordion title='مدل پیش‌فرض برای Anthropic با کلید API چیست؟'>
    در OpenClaw، اطلاعات احراز هویت و انتخاب مدل از هم جدا هستند. تنظیم `ANTHROPIC_API_KEY` (یا ذخیره‌کردن کلید API Anthropic در پروفایل‌های احراز هویت) احراز هویت را فعال می‌کند، اما مدل پیش‌فرض واقعی همان چیزی است که در `agents.defaults.model.primary` پیکربندی می‌کنید (برای مثال، `anthropic/claude-sonnet-4-6` یا `anthropic/claude-opus-4-6`). اگر `No credentials found for profile "anthropic:default"` را می‌بینید، یعنی Gateway نتوانسته اطلاعات احراز هویت Anthropic را در فایل `auth-profiles.json` مورد انتظار برای عاملی که در حال اجراست پیدا کند.
  </Accordion>
</AccordionGroup>

---

هنوز گیر کرده‌اید؟ در [Discord](https://discord.com/invite/clawd) بپرسید یا یک [بحث GitHub](https://github.com/openclaw/openclaw/discussions) باز کنید.

## مرتبط

- [پرسش‌های متداول اجرای نخست](/fa/help/faq-first-run) — نصب، راه‌اندازی اولیه، احراز هویت، اشتراک‌ها، خطاهای اولیه
- [پرسش‌های متداول مدل‌ها](/fa/help/faq-models) — انتخاب مدل، جایگزینی هنگام خرابی، پروفایل‌های احراز هویت
- [عیب‌یابی](/fa/help/troubleshooting) — تریاژ بر اساس نشانه‌ها
