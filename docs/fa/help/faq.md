---
read_when:
    - پاسخ به پرسش‌های رایج پشتیبانی درباره راه‌اندازی، نصب، شروع به کار یا زمان اجرا
    - تریاژ مشکلات گزارش‌شده از سوی کاربران پیش از اشکال‌زدایی عمیق‌تر
summary: پرسش‌های متداول دربارهٔ راه‌اندازی، پیکربندی و استفاده از OpenClaw
title: پرسش‌های متداول
x-i18n:
    generated_at: "2026-05-07T13:22:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: b208e28def6b9a1165130bc02f9e2646c3b16d203dfc8c0d59dc664f388c2ef8
    source_path: help/faq.md
    workflow: 16
---

پاسخ‌های سریع به‌همراه عیب‌یابی عمیق‌تر برای راه‌اندازی‌های واقعی (توسعه محلی، VPS، چندعاملی، کلیدهای OAuth/API، جایگزینی مدل هنگام خطا). برای عیب‌یابی زمان اجرا، [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید. برای مرجع کامل پیکربندی، [پیکربندی](/fa/gateway/configuration) را ببینید.

## ۶۰ ثانیه اول اگر چیزی خراب است

1. **وضعیت سریع (بررسی اول)**

   ```bash
   openclaw status
   ```

   خلاصه سریع محلی: سیستم‌عامل + به‌روزرسانی، دسترسی‌پذیری gateway/سرویس، عامل‌ها/نشست‌ها، پیکربندی ارائه‌دهنده + مشکلات زمان اجرا (وقتی Gateway در دسترس باشد).

2. **گزارش قابل چسباندن (امن برای اشتراک‌گذاری)**

   ```bash
   openclaw status --all
   ```

   تشخیص فقط‌خواندنی همراه با انتهای لاگ (توکن‌ها پوشانده شده‌اند).

3. **وضعیت daemon + پورت**

   ```bash
   openclaw gateway status
   ```

   زمان اجرای supervisor در برابر دسترسی‌پذیری RPC، URL هدف probe، و اینکه سرویس احتمالا از کدام پیکربندی استفاده کرده است را نشان می‌دهد.

4. **probeهای عمیق**

   ```bash
   openclaw status --deep
   ```

   یک probe زنده سلامت Gateway اجرا می‌کند، از جمله probeهای کانال وقتی پشتیبانی شوند
   (به Gateway قابل دسترسی نیاز دارد). [سلامت](/fa/gateway/health) را ببینید.

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

7. **snapshot از Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   از Gateway در حال اجرا یک snapshot کامل می‌خواهد (فقط WS). [سلامت](/fa/gateway/health) را ببینید.

## شروع سریع و راه‌اندازی اجرای اول

پرسش‌وپاسخ اجرای اول — نصب، onboarding، مسیرهای احراز هویت، اشتراک‌ها، خطاهای اولیه —
در [پرسش‌های متداول اجرای اول](/fa/help/faq-first-run) قرار دارد.

## OpenClaw چیست؟

<AccordionGroup>
  <Accordion title="OpenClaw در یک پاراگراف چیست؟">
    OpenClaw یک دستیار هوش مصنوعی شخصی است که روی دستگاه‌های خودتان اجرا می‌کنید. روی همان بسترهای پیام‌رسانی که از قبل استفاده می‌کنید پاسخ می‌دهد (WhatsApp، Telegram، Slack، Mattermost، Discord، Google Chat، Signal، iMessage، WebChat، و Pluginهای کانال همراه مانند QQ Bot) و روی پلتفرم‌های پشتیبانی‌شده می‌تواند صدا + یک Canvas زنده هم ارائه دهد. **Gateway** سطح کنترل همیشه‌روشن است؛ دستیار همان محصول است.
  </Accordion>

  <Accordion title="ارزش پیشنهادی">
    OpenClaw «فقط یک wrapper برای Claude» نیست. این یک **سطح کنترل local-first** است که به شما اجازه می‌دهد
    یک دستیار توانمند را روی **سخت‌افزار خودتان** اجرا کنید، از برنامه‌های چتی که از قبل استفاده می‌کنید به آن دسترسی داشته باشید، با
    نشست‌های stateful، حافظه، و ابزارها - بدون اینکه کنترل گردش‌کارهای خود را به یک SaaS میزبانی‌شده بسپارید.

    نکات برجسته:

    - **دستگاه‌های شما، داده‌های شما:** Gateway را هرجا می‌خواهید اجرا کنید (Mac، Linux، VPS) و
      workspace + تاریخچه نشست را محلی نگه دارید.
    - **کانال‌های واقعی، نه sandbox وب:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/غیره،
      به‌علاوه صدای موبایل و Canvas روی پلتفرم‌های پشتیبانی‌شده.
    - **بی‌طرف نسبت به مدل:** از Anthropic، OpenAI، MiniMax، OpenRouter، و غیره، با مسیریابی
      و failover برای هر عامل استفاده کنید.
    - **گزینه فقط‌محلی:** مدل‌های محلی را اجرا کنید تا اگر بخواهید **همه داده‌ها روی دستگاه شما بمانند**.
    - **مسیریابی چندعاملی:** عامل‌های جداگانه برای هر کانال، حساب، یا وظیفه، هرکدام با
      workspace و پیش‌فرض‌های خودش.
    - **متن‌باز و قابل دستکاری:** بدون قفل‌شدگی به فروشنده، بررسی، گسترش، و self-host کنید.

    مستندات: [Gateway](/fa/gateway)، [کانال‌ها](/fa/channels)، [چندعاملی](/fa/concepts/multi-agent)،
    [حافظه](/fa/concepts/memory).

  </Accordion>

  <Accordion title="همین الان راه‌اندازی‌اش کردم - اول چه کار کنم؟">
    پروژه‌های اول خوب:

    - یک وب‌سایت بسازید (WordPress، Shopify، یا یک سایت static ساده).
    - نمونه اولیه یک اپ موبایل بسازید (طرح کلی، صفحه‌ها، برنامه API).
    - فایل‌ها و پوشه‌ها را مرتب کنید (پاک‌سازی، نام‌گذاری، tagگذاری).
    - Gmail را وصل کنید و خلاصه‌ها یا follow upها را خودکار کنید.

    می‌تواند وظایف بزرگ را انجام دهد، اما وقتی آن‌ها را به فازها تقسیم کنید و
    از زیرعامل‌ها برای کار موازی استفاده کنید بهترین عملکرد را دارد.

  </Accordion>

  <Accordion title="پنج کاربرد روزمره برتر OpenClaw چیست؟">
    بردهای روزمره معمولا شبیه این‌ها هستند:

    - **خلاصه‌های شخصی:** خلاصه‌های inbox، تقویم، و خبرهایی که برایتان مهم‌اند.
    - **پژوهش و پیش‌نویس‌نویسی:** پژوهش سریع، خلاصه‌ها، و پیش‌نویس‌های اولیه برای ایمیل‌ها یا مستندات.
    - **یادآورها و follow upها:** nudges و چک‌لیست‌های مبتنی بر Cron یا Heartbeat.
    - **خودکارسازی مرورگر:** پر کردن فرم‌ها، جمع‌آوری داده، و تکرار وظایف وب.
    - **هماهنگی بین دستگاه‌ها:** یک وظیفه را از تلفن خود بفرستید، بگذارید Gateway آن را روی سرور اجرا کند، و نتیجه را در چت بگیرید.

  </Accordion>

  <Accordion title="آیا OpenClaw می‌تواند در lead gen، outreach، تبلیغات، و بلاگ‌ها برای یک SaaS کمک کند؟">
    بله برای **پژوهش، ارزیابی، و پیش‌نویس‌نویسی**. می‌تواند سایت‌ها را اسکن کند، فهرست‌های کوتاه بسازد،
    مشتریان احتمالی را خلاصه کند، و پیش‌نویس outreach یا متن تبلیغ بنویسد.

    برای **اجرای outreach یا تبلیغات**، انسان را در حلقه نگه دارید. از spam پرهیز کنید، قوانین محلی و
    سیاست‌های پلتفرم را رعایت کنید، و قبل از ارسال هرچیزی آن را بازبینی کنید. امن‌ترین الگو این است که
    OpenClaw پیش‌نویس کند و شما تایید کنید.

    مستندات: [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="مزیت‌ها نسبت به Claude Code برای توسعه وب چیست؟">
    OpenClaw یک **دستیار شخصی** و لایه هماهنگی است، نه جایگزین IDE. برای سریع‌ترین چرخه مستقیم کدنویسی داخل repo از
    Claude Code یا Codex استفاده کنید. وقتی حافظه پایدار، دسترسی بین‌دستگاهی، و orchestration ابزار می‌خواهید از OpenClaw استفاده کنید.

    مزیت‌ها:

    - **حافظه + workspace پایدار** در میان نشست‌ها
    - **دسترسی چندپلتفرمی** (WhatsApp، Telegram، TUI، WebChat)
    - **orchestration ابزار** (مرورگر، فایل‌ها، زمان‌بندی، hookها)
    - **Gateway همیشه‌روشن** (روی VPS اجرا کنید، از هرجا تعامل کنید)
    - **Nodeها** برای مرورگر/صفحه/دوربین/exec محلی

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills و خودکارسازی

<AccordionGroup>
  <Accordion title="چطور Skills را بدون dirty نگه داشتن repo سفارشی کنم؟">
    به‌جای ویرایش کپی repo از overrideهای مدیریت‌شده استفاده کنید. تغییرات خود را در `~/.openclaw/skills/<name>/SKILL.md` بگذارید (یا از طریق `skills.load.extraDirs` در `~/.openclaw/openclaw.json` یک پوشه اضافه کنید). اولویت به‌ترتیب `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` است، بنابراین overrideهای مدیریت‌شده بدون دست زدن به git همچنان بر Skills همراه غلبه می‌کنند. اگر باید skill به‌صورت global نصب شود اما فقط برای بعضی عامل‌ها visible باشد، کپی shared را در `~/.openclaw/skills` نگه دارید و visibility را با `agents.defaults.skills` و `agents.list[].skills` کنترل کنید. فقط ویرایش‌هایی که ارزش upstream شدن دارند باید در repo قرار بگیرند و به‌صورت PR ارسال شوند.
  </Accordion>

  <Accordion title="آیا می‌توانم Skills را از یک پوشه سفارشی بارگذاری کنم؟">
    بله. دایرکتوری‌های اضافی را از طریق `skills.load.extraDirs` در `~/.openclaw/openclaw.json` اضافه کنید (کمترین اولویت). اولویت پیش‌فرض `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` است. `clawhub` به‌طور پیش‌فرض در `./skills` نصب می‌کند، که OpenClaw آن را در نشست بعدی به‌عنوان `<workspace>/skills` در نظر می‌گیرد. اگر skill باید فقط برای عامل‌های خاصی visible باشد، آن را با `agents.defaults.skills` یا `agents.list[].skills` همراه کنید.
  </Accordion>

  <Accordion title="چطور می‌توانم برای وظایف مختلف از مدل‌های متفاوت استفاده کنم؟">
    امروز الگوهای پشتیبانی‌شده این‌ها هستند:

    - **jobهای Cron**: jobهای isolated می‌توانند برای هر job یک override برای `model` تنظیم کنند.
    - **زیرعامل‌ها**: وظایف را به عامل‌های جداگانه با مدل‌های پیش‌فرض متفاوت route کنید.
    - **تغییر بر اساس نیاز**: برای تغییر مدل نشست فعلی در هر زمان از `/model` استفاده کنید.

    [jobهای Cron](/fa/automation/cron-jobs)، [مسیریابی چندعاملی](/fa/concepts/multi-agent)، و [دستورهای Slash](/fa/tools/slash-commands) را ببینید.

  </Accordion>

  <Accordion title="bot هنگام انجام کار سنگین freeze می‌کند. چطور آن را offload کنم؟">
    برای وظایف طولانی یا موازی از **زیرعامل‌ها** استفاده کنید. زیرعامل‌ها در نشست خودشان اجرا می‌شوند،
    یک خلاصه برمی‌گردانند، و چت اصلی شما را پاسخ‌گو نگه می‌دارند.

    از bot خود بخواهید «برای این وظیفه یک sub-agent ایجاد کند» یا از `/subagents` استفاده کنید.
    برای دیدن اینکه Gateway همین حالا چه کار می‌کند (و آیا مشغول است) در چت از `/status` استفاده کنید.

    نکته توکن: وظایف طولانی و زیرعامل‌ها هر دو توکن مصرف می‌کنند. اگر هزینه مهم است، از طریق
    `agents.defaults.subagents.model` برای زیرعامل‌ها یک مدل ارزان‌تر تنظیم کنید.

    مستندات: [زیرعامل‌ها](/fa/tools/subagents)، [وظایف پس‌زمینه](/fa/automation/tasks).

  </Accordion>

  <Accordion title="نشست‌های زیرعامل وابسته به thread در Discord چطور کار می‌کنند؟">
    از bindingهای thread استفاده کنید. می‌توانید یک thread در Discord را به یک زیرعامل یا هدف نشست bind کنید تا پیام‌های follow-up در آن thread روی همان نشست bindشده بمانند.

    جریان پایه:

    - با `sessions_spawn` و با `thread: true` ایجاد کنید (و در صورت تمایل `mode: "session"` برای follow-up پایدار).
    - یا با `/focus <target>` به‌صورت دستی bind کنید.
    - برای بررسی وضعیت binding از `/agents` استفاده کنید.
    - برای کنترل auto-unfocus از `/session idle <duration|off>` و `/session max-age <duration|off>` استفاده کنید.
    - برای جدا کردن thread از `/unfocus` استفاده کنید.

    پیکربندی لازم:

    - پیش‌فرض‌های global: `session.threadBindings.enabled`، `session.threadBindings.idleHours`، `session.threadBindings.maxAgeHours`.
    - overrideهای Discord: `channels.discord.threadBindings.enabled`، `channels.discord.threadBindings.idleHours`، `channels.discord.threadBindings.maxAgeHours`.
    - auto-bind هنگام spawn: `channels.discord.threadBindings.spawnSessions` به‌طور پیش‌فرض `true` است؛ برای غیرفعال کردن session spawnهای وابسته به thread آن را روی `false` بگذارید.

    مستندات: [زیرعامل‌ها](/fa/tools/subagents)، [Discord](/fa/channels/discord)، [مرجع پیکربندی](/fa/gateway/configuration-reference)، [دستورهای Slash](/fa/tools/slash-commands).

  </Accordion>

  <Accordion title="یک زیرعامل تمام شد، اما update تکمیل به جای اشتباه رفت یا اصلا ارسال نشد. چه چیزی را بررسی کنم؟">
    اول route درخواست‌کننده resolveشده را بررسی کنید:

    - تحویل زیرعامل در حالت تکمیل، وقتی thread یا conversation route bindشده‌ای وجود داشته باشد، آن را ترجیح می‌دهد.
    - اگر origin تکمیل فقط یک کانال داشته باشد، OpenClaw به route ذخیره‌شده نشست درخواست‌کننده (`lastChannel` / `lastTo` / `lastAccountId`) fallback می‌کند تا تحویل مستقیم همچنان بتواند موفق شود.
    - اگر نه route bindشده وجود داشته باشد و نه route ذخیره‌شده قابل استفاده، تحویل مستقیم می‌تواند fail شود و نتیجه به‌جای ارسال فوری به چت، به تحویل queued نشست fallback می‌کند.
    - هدف‌های نامعتبر یا stale همچنان می‌توانند fallback به queue یا شکست نهایی تحویل را اجباری کنند.
    - اگر آخرین پاسخ visible دستیار child دقیقا token بی‌صدای `NO_REPLY` / `no_reply`، یا دقیقا `ANNOUNCE_SKIP` باشد، OpenClaw عمدا announce را سرکوب می‌کند تا progress قدیمی‌تر stale را post نکند.
    - اگر child بعد از فقط tool callها timed out شود، announce می‌تواند آن را به یک خلاصه کوتاه از progress جزئی تبدیل کند، به‌جای اینکه خروجی خام ابزار را replay کند.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [زیرعامل‌ها](/fa/tools/subagents)، [وظایف پس‌زمینه](/fa/automation/tasks)، [ابزارهای نشست](/fa/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron یا یادآورها fire نمی‌شوند. چه چیزی را بررسی کنم؟">
    Cron داخل فرایند Gateway اجرا می‌شود. اگر Gateway پیوسته در حال اجرا نباشد،
    jobهای زمان‌بندی‌شده اجرا نمی‌شوند.

    چک‌لیست:

    - تایید کنید cron فعال است (`cron.enabled`) و `OPENCLAW_SKIP_CRON` تنظیم نشده است.
    - بررسی کنید Gateway به‌صورت ۲۴/۷ در حال اجراست (بدون sleep/restart).
    - تنظیمات timezone را برای job بررسی کنید (`--tz` در برابر timezone میزبان).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    مستندات: [jobهای Cron](/fa/automation/cron-jobs)، [خودکارسازی و وظایف](/fa/automation).

  </Accordion>

  <Accordion title="Cron اجرا شد، اما چیزی به کانال ارسال نشد. چرا؟">
    ابتدا حالت تحویل را بررسی کنید:

    - `--no-deliver` / `delivery.mode: "none"` یعنی انتظار نمی‌رود ارسال پشتیبان اجراکننده انجام شود.
    - هدف اعلامیِ ناموجود یا نامعتبر (`channel` / `to`) یعنی اجراکننده تحویل خروجی را نادیده گرفته است.
    - خطاهای احراز هویت کانال (`unauthorized`, `Forbidden`) یعنی اجراکننده برای تحویل تلاش کرده اما اعتبارنامه‌ها مانع شده‌اند.
    - نتیجهٔ ایزولهٔ بی‌صدا (فقط `NO_REPLY` / `no_reply`) عمدا غیرقابل‌تحویل تلقی می‌شود، بنابراین اجراکننده تحویل پشتیبانِ صف‌شده را هم سرکوب می‌کند.

    برای کارهای Cron ایزوله، عامل همچنان می‌تواند وقتی مسیر گفت‌وگو در دسترس است، مستقیما با ابزار `message`
    ارسال کند. `--announce` فقط مسیر پشتیبان اجراکننده را برای متن نهایی‌ای کنترل می‌کند
    که عامل از قبل ارسال نکرده است.

    اشکال‌زدایی:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [کارهای پس‌زمینه](/fa/automation/tasks).

  </Accordion>

  <Accordion title="چرا یک اجرای Cron ایزوله مدل را عوض کرد یا یک بار دوباره تلاش کرد؟">
    این معمولا مسیر زندهٔ تعویض مدل است، نه زمان‌بندی تکراری.

    Cron ایزوله می‌تواند واگذاری مدل زمان اجرا را پایدار کند و وقتی اجرای فعال
    `LiveSessionModelSwitchError` پرتاب می‌کند، دوباره تلاش کند. تلاش دوباره همان
    ارائه‌دهنده/مدلِ تعویض‌شده را نگه می‌دارد، و اگر تعویض شامل بازنویسی پروفایل احراز هویت جدید باشد، Cron
    آن را هم پیش از تلاش دوباره پایدار می‌کند.

    قواعد مرتبط انتخاب:

    - بازنویسی مدل قلاب Gmail در صورت کاربرد، اولویت نخست را دارد.
    - سپس `model` هر کار.
    - سپس هر بازنویسی ذخیره‌شدهٔ مدل نشست Cron.
    - سپس انتخاب معمول مدل عامل/پیش‌فرض.

    حلقهٔ تلاش دوباره محدود است. پس از تلاش اولیه به‌علاوهٔ ۲ تلاش دوباره برای تعویض،
    Cron به‌جای حلقهٔ بی‌پایان متوقف می‌شود.

    اشکال‌زدایی:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [CLI مربوط به cron](/fa/cli/cron).

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

    `openclaw skills install` بومی، در پوشهٔ `skills/`
    فضای کاری فعال می‌نویسد. CLI جداگانهٔ `clawhub` را فقط وقتی نصب کنید که می‌خواهید Skills خودتان را منتشر یا
    همگام‌سازی کنید. برای نصب‌های مشترک بین عامل‌ها، Skill را زیر
    `~/.openclaw/skills` بگذارید و اگر می‌خواهید مشخص کنید کدام عامل‌ها بتوانند آن را ببینند، از
    `agents.defaults.skills` یا
    `agents.list[].skills` استفاده کنید.

  </Accordion>

  <Accordion title="آیا OpenClaw می‌تواند کارها را طبق زمان‌بندی یا به‌صورت پیوسته در پس‌زمینه اجرا کند؟">
    بله. از زمان‌بند Gateway استفاده کنید:

    - **کارهای Cron** برای کارهای زمان‌بندی‌شده یا تکرارشونده (پس از راه‌اندازی مجدد هم باقی می‌مانند).
    - **Heartbeat** برای بررسی‌های دوره‌ای «نشست اصلی».
    - **کارهای ایزوله** برای عامل‌های خودمختاری که خلاصه‌ها را پست می‌کنند یا به گفت‌وگوها تحویل می‌دهند.

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [خودکارسازی و کارها](/fa/automation)،
    [Heartbeat](/fa/gateway/heartbeat).

  </Accordion>

  <Accordion title="آیا می‌توانم Skills مخصوص Apple macOS را از Linux اجرا کنم؟">
    نه مستقیما. Skills مخصوص macOS با `metadata.openclaw.os` به‌علاوهٔ باینری‌های لازم محدود می‌شوند، و Skills فقط وقتی در اعلان سیستم ظاهر می‌شوند که روی **میزبان Gateway** واجد شرایط باشند. روی Linux، Skills فقط برای `darwin` (مانند `apple-notes`، `apple-reminders`، `things-mac`) بارگذاری نمی‌شوند، مگر اینکه این محدودسازی را بازنویسی کنید.

    سه الگوی پشتیبانی‌شده دارید:

    **گزینهٔ الف - Gateway را روی یک Mac اجرا کنید (ساده‌ترین).**
    Gateway را جایی اجرا کنید که باینری‌های macOS وجود دارند، سپس از Linux در [حالت راه دور](#gateway-ports-already-running-and-remote-mode) یا از طریق Tailscale وصل شوید. Skills به‌طور معمول بارگذاری می‌شوند چون میزبان Gateway همان macOS است.

    **گزینهٔ ب - از یک گره macOS استفاده کنید (بدون SSH).**
    Gateway را روی Linux اجرا کنید، یک گره macOS (برنامهٔ نوار منو) را جفت کنید، و **فرمان‌های اجرای Node** را روی Mac روی «همیشه بپرس» یا «همیشه اجازه بده» تنظیم کنید. وقتی باینری‌های لازم روی گره وجود داشته باشند، OpenClaw می‌تواند Skills مخصوص macOS را واجد شرایط در نظر بگیرد. عامل آن Skills را از طریق ابزار `nodes` اجرا می‌کند. اگر «همیشه بپرس» را انتخاب کنید، تایید «همیشه اجازه بده» در اعلان، آن فرمان را به فهرست مجاز اضافه می‌کند.

    **گزینهٔ ج - باینری‌های macOS را از طریق SSH واسطه کنید (پیشرفته).**
    Gateway را روی Linux نگه دارید، اما کاری کنید باینری‌های CLI لازم به پوشش‌های SSH resolve شوند که روی یک Mac اجرا می‌شوند. سپس Skill را بازنویسی کنید تا Linux را مجاز کند و واجد شرایط باقی بماند.

    1. یک پوشش SSH برای باینری بسازید (مثال: `memo` برای Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. پوشش را روی `PATH` در میزبان Linux بگذارید (برای مثال `~/bin/memo`).
    3. فرادادهٔ Skill را بازنویسی کنید (در فضای کاری یا `~/.openclaw/skills`) تا Linux را مجاز کند:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. یک نشست جدید شروع کنید تا snapshot مربوط به Skills تازه‌سازی شود.

  </Accordion>

  <Accordion title="آیا یکپارچه‌سازی Notion یا HeyGen دارید؟">
    امروز به‌صورت داخلی وجود ندارد.

    گزینه‌ها:

    - **Skill / Plugin سفارشی:** بهترین گزینه برای دسترسی قابل‌اعتماد به API است (Notion/HeyGen هر دو API دارند).
    - **خودکارسازی مرورگر:** بدون کد کار می‌کند، اما کندتر و شکننده‌تر است.

    اگر می‌خواهید متن زمینه را برای هر مشتری نگه دارید (گردش‌کارهای آژانسی)، یک الگوی ساده این است:

    - یک صفحهٔ Notion برای هر مشتری (متن زمینه + ترجیح‌ها + کار فعال).
    - از عامل بخواهید در آغاز نشست آن صفحه را دریافت کند.

    اگر یکپارچه‌سازی بومی می‌خواهید، یک درخواست قابلیت باز کنید یا Skillی
    برای آن APIها بسازید.

    نصب Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    نصب‌های بومی در پوشهٔ `skills/` فضای کاری فعال قرار می‌گیرند. برای Skills مشترک بین عامل‌ها، آن‌ها را در `~/.openclaw/skills/<name>/SKILL.md` بگذارید. اگر فقط بعضی عامل‌ها باید یک نصب مشترک را ببینند، `agents.defaults.skills` یا `agents.list[].skills` را پیکربندی کنید. برخی Skills انتظار دارند باینری‌ها از طریق Homebrew نصب شده باشند؛ روی Linux یعنی Linuxbrew (ورودی پرسش‌های متداول Homebrew Linux را در بالا ببینید). ببینید [Skills](/fa/tools/skills)، [پیکربندی Skills](/fa/tools/skills-config)، و [ClawHub](/fa/tools/clawhub).

  </Accordion>

  <Accordion title="چگونه از Chrome فعلی‌ام که از قبل وارد آن شده‌ام با OpenClaw استفاده کنم؟">
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

    این مسیر می‌تواند از مرورگر میزبان محلی یا یک گره مرورگر متصل استفاده کند. اگر Gateway در جای دیگری اجرا می‌شود، یا یک میزبان گره را روی ماشین مرورگر اجرا کنید یا به‌جای آن از CDP راه دور استفاده کنید.

    محدودیت‌های فعلی `existing-session` / `user`:

    - کنش‌ها بر پایهٔ ref هستند، نه بر پایهٔ گزینشگر CSS
    - بارگذاری‌ها به `ref` / `inputRef` نیاز دارند و فعلا هر بار از یک فایل پشتیبانی می‌کنند
    - `responsebody`، خروجی‌گیری PDF، رهگیری دانلود، و کنش‌های دسته‌ای هنوز به مرورگر مدیریت‌شده یا پروفایل CDP خام نیاز دارند

  </Accordion>
</AccordionGroup>

## Sandboxing و حافظه

<AccordionGroup>
  <Accordion title="آیا مستند جداگانه‌ای برای Sandboxing وجود دارد؟">
    بله. [Sandboxing](/fa/gateway/sandboxing) را ببینید. برای راه‌اندازی مخصوص Docker (Gateway کامل در Docker یا تصویرهای sandbox)، [Docker](/fa/install/docker) را ببینید.
  </Accordion>

  <Accordion title="Docker محدود به نظر می‌رسد - چگونه قابلیت‌های کامل را فعال کنم؟">
    تصویر پیش‌فرض امنیت‌محور است و به‌عنوان کاربر `node` اجرا می‌شود، بنابراین
    بسته‌های سیستم، Homebrew، یا مرورگرهای همراه را شامل نمی‌شود. برای راه‌اندازی کامل‌تر:

    - `/home/node` را با `OPENCLAW_HOME_VOLUME` پایدار کنید تا cacheها باقی بمانند.
    - وابستگی‌های سیستم را با `OPENCLAW_DOCKER_APT_PACKAGES` داخل تصویر bake کنید.
    - مرورگرهای Playwright را از طریق CLI همراه نصب کنید:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` را تنظیم کنید و مطمئن شوید مسیر پایدار شده است.

    مستندات: [Docker](/fa/install/docker)، [مرورگر](/fa/tools/browser).

  </Accordion>

  <Accordion title="آیا می‌توانم DMها را شخصی نگه دارم اما گروه‌ها را با یک عامل عمومی/sandboxed کنم؟">
    بله - اگر ترافیک خصوصی شما **DMها** و ترافیک عمومی شما **گروه‌ها** باشد.

    از `agents.defaults.sandbox.mode: "non-main"` استفاده کنید تا نشست‌های گروه/کانال (کلیدهای غیر اصلی) در backend پیکربندی‌شدهٔ sandbox اجرا شوند، در حالی که نشست DM اصلی روی میزبان باقی می‌ماند. اگر backend انتخاب نکنید، Docker پیش‌فرض است. سپس از طریق `tools.sandbox.tools` محدود کنید چه ابزارهایی در نشست‌های sandboxed در دسترس باشند.

    راهنمای راه‌اندازی + پیکربندی نمونه: [گروه‌ها: DMهای شخصی + گروه‌های عمومی](/fa/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع کلیدی پیکربندی: [پیکربندی Gateway](/fa/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="چگونه یک پوشهٔ میزبان را داخل sandbox وصل کنم؟">
    `agents.defaults.sandbox.docker.binds` را روی `["host:path:mode"]` تنظیم کنید (مثلا `"/home/user/src:/src:ro"`). اتصال‌های سراسری و هر عامل با هم ادغام می‌شوند؛ وقتی `scope: "shared"` باشد، اتصال‌های هر عامل نادیده گرفته می‌شوند. برای هر چیز حساس از `:ro` استفاده کنید و به یاد داشته باشید اتصال‌ها دیوارهای filesystem مربوط به sandbox را دور می‌زنند.

    OpenClaw منابع اتصال را هم در برابر مسیر نرمال‌شده و هم مسیر canonical که از طریق عمیق‌ترین ancestor موجود resolve شده است، اعتبارسنجی می‌کند. یعنی فرار از طریق والد symlink همچنان fail closed می‌شود، حتی وقتی آخرین بخش مسیر هنوز وجود ندارد، و بررسی‌های ریشهٔ مجاز پس از resolve شدن symlink همچنان اعمال می‌شوند.

    برای مثال‌ها و نکات ایمنی، [Sandboxing](/fa/gateway/sandboxing#custom-bind-mounts) و [Sandbox در برابر سیاست ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) را ببینید.

  </Accordion>

  <Accordion title="حافظه چگونه کار می‌کند؟">
    حافظهٔ OpenClaw فقط فایل‌های Markdown در فضای کاری عامل است:

    - یادداشت‌های روزانه در `memory/YYYY-MM-DD.md`
    - یادداشت‌های بلندمدت گزینش‌شده در `MEMORY.md` (فقط نشست‌های اصلی/خصوصی)

    OpenClaw همچنین یک **flush بی‌صدای حافظه پیش از compaction** اجرا می‌کند تا به مدل یادآوری کند
    پیش از auto-compaction یادداشت‌های پایدار بنویسد. این فقط وقتی اجرا می‌شود که فضای کاری
    قابل نوشتن باشد (sandboxهای فقط‌خواندنی آن را نادیده می‌گیرند). [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>

  <Accordion title="حافظه مدام چیزها را فراموش می‌کند. چگونه آن را ماندگار کنم؟">
    از ربات بخواهید **واقعیت را در حافظه بنویسد**. یادداشت‌های بلندمدت باید در `MEMORY.md` باشند،
    متن زمینهٔ کوتاه‌مدت در `memory/YYYY-MM-DD.md` قرار می‌گیرد.

    این هنوز حوزه‌ای است که در حال بهبود آن هستیم. یادآوری به مدل برای ذخیرهٔ حافظه‌ها کمک می‌کند؛
    خودش می‌داند چه باید بکند. اگر همچنان فراموش می‌کند، بررسی کنید Gateway در هر اجرا از همان
    فضای کاری استفاده می‌کند.

    مستندات: [حافظه](/fa/concepts/memory)، [فضای کاری عامل](/fa/concepts/agent-workspace).

  </Accordion>

  <Accordion title="آیا حافظه برای همیشه پایدار می‌ماند؟ محدودیت‌ها چیست؟">
    فایل‌های حافظه روی دیسک زندگی می‌کنند و تا زمانی که آن‌ها را حذف نکنید باقی می‌مانند. محدودیت، فضای
    ذخیره‌سازی شماست، نه مدل. **متن زمینهٔ نشست** همچنان به پنجرهٔ متن زمینهٔ مدل
    محدود است، بنابراین گفت‌وگوهای طولانی می‌توانند compact یا truncate شوند. به همین دلیل
    جست‌وجوی حافظه وجود دارد - فقط بخش‌های مرتبط را دوباره به متن زمینه برمی‌گرداند.

    مستندات: [حافظه](/fa/concepts/memory)، [متن زمینه](/fa/concepts/context).

  </Accordion>

  <Accordion title="آیا جستجوی حافظهٔ معنایی به کلید API مربوط به OpenAI نیاز دارد؟">
    فقط اگر از **embeddingهای OpenAI** استفاده کنید. OAuth مربوط به Codex چت/تکمیل‌ها را پوشش می‌دهد و
    دسترسی به embeddingها را اعطا **نمی‌کند**، بنابراین **ورود با Codex (OAuth یا ورود
    Codex CLI)** برای جستجوی حافظهٔ معنایی کمکی نمی‌کند. embeddingهای OpenAI
    همچنان به یک کلید API واقعی نیاز دارند (`OPENAI_API_KEY` یا `models.providers.openai.apiKey`).

    اگر ارائه‌دهنده‌ای را صریحاً تنظیم نکنید، OpenClaw وقتی بتواند یک کلید API را
    resolve کند، به‌صورت خودکار یک ارائه‌دهنده را انتخاب می‌کند (auth profiles، `models.providers.*.apiKey`، یا env vars).
    اگر کلید OpenAI resolve شود، OpenAI را ترجیح می‌دهد؛ در غیر این صورت اگر کلید Gemini
    resolve شود Gemini را، سپس Voyage و بعد Mistral را انتخاب می‌کند. اگر هیچ کلید راه دوری در دسترس نباشد، جستجوی
    حافظه تا زمانی که آن را پیکربندی کنید غیرفعال می‌ماند. اگر مسیر مدل محلی
    پیکربندی شده و موجود باشد، OpenClaw
    `local` را ترجیح می‌دهد. Ollama زمانی پشتیبانی می‌شود که صریحاً
    `memorySearch.provider = "ollama"` را تنظیم کنید.

    اگر ترجیح می‌دهید محلی بمانید، `memorySearch.provider = "local"` را تنظیم کنید (و در صورت تمایل
    `memorySearch.fallback = "none"` را). اگر embeddingهای Gemini را می‌خواهید،
    `memorySearch.provider = "gemini"` را تنظیم کنید و `GEMINI_API_KEY` (یا
    `memorySearch.remote.apiKey`) را ارائه دهید. ما از مدل‌های embedding مربوط به **OpenAI، Gemini، Voyage، Mistral، Ollama، یا local** پشتیبانی می‌کنیم
    - برای جزئیات راه‌اندازی، [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>
</AccordionGroup>

## چیزها روی دیسک کجا قرار دارند

<AccordionGroup>
  <Accordion title="آیا همهٔ داده‌هایی که با OpenClaw استفاده می‌شوند به‌صورت محلی ذخیره می‌شوند؟">
    خیر - **وضعیت OpenClaw محلی است**، اما **سرویس‌های خارجی همچنان آنچه را برایشان می‌فرستید می‌بینند**.

    - **محلی به‌صورت پیش‌فرض:** نشست‌ها، فایل‌های حافظه، پیکربندی، و فضای کاری روی میزبان Gateway قرار دارند
      (`~/.openclaw` + دایرکتوری فضای کاری شما).
    - **راه دور از سر ضرورت:** پیام‌هایی که به ارائه‌دهندگان مدل (Anthropic/OpenAI/و غیره) می‌فرستید به
      APIهای آن‌ها می‌روند، و پلتفرم‌های چت (WhatsApp/Telegram/Slack/و غیره) داده‌های پیام را روی
      سرورهای خودشان ذخیره می‌کنند.
    - **شما ردپا را کنترل می‌کنید:** استفاده از مدل‌های محلی promptها را روی ماشین شما نگه می‌دارد، اما ترافیک کانال
      همچنان از سرورهای همان کانال عبور می‌کند.

    مرتبط: [فضای کاری عامل](/fa/concepts/agent-workspace)، [حافظه](/fa/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw داده‌هایش را کجا ذخیره می‌کند؟">
    همه‌چیز زیر `$OPENCLAW_STATE_DIR` قرار دارد (پیش‌فرض: `~/.openclaw`):

    | مسیر                                                            | هدف                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | پیکربندی اصلی (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | واردسازی OAuth قدیمی (در اولین استفاده در auth profiles کپی می‌شود)       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | auth profiles (OAuth، کلیدهای API، و `keyRef`/`tokenRef` اختیاری)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | payload اختیاری secret مبتنی بر فایل برای ارائه‌دهندگان SecretRef از نوع `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | فایل سازگاری قدیمی (ورودی‌های ایستای `api_key` پاک‌سازی شده‌اند)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | وضعیت ارائه‌دهنده (مثلاً `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | وضعیت جداگانهٔ هر عامل (agentDir + نشست‌ها)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | تاریخچه و وضعیت گفتگو (برای هر عامل)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | metadata نشست (برای هر عامل)                                       |

    مسیر قدیمی تک‌عاملی: `~/.openclaw/agent/*` (توسط `openclaw doctor` منتقل می‌شود).

    **فضای کاری** شما (AGENTS.md، فایل‌های حافظه، skills، و غیره) جداست و از طریق `agents.defaults.workspace` پیکربندی می‌شود (پیش‌فرض: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md باید کجا قرار بگیرند؟">
    این فایل‌ها در **فضای کاری عامل** قرار می‌گیرند، نه در `~/.openclaw`.

    - **فضای کاری (برای هر عامل)**: `AGENTS.md`، `SOUL.md`، `IDENTITY.md`، `USER.md`،
      `MEMORY.md`، `memory/YYYY-MM-DD.md`، `HEARTBEAT.md` اختیاری.
      ریشهٔ lowercase یعنی `memory.md` فقط ورودی repair قدیمی است؛ `openclaw doctor --fix`
      وقتی هر دو فایل وجود داشته باشند می‌تواند آن را در `MEMORY.md` ادغام کند.
    - **دایرکتوری وضعیت (`~/.openclaw`)**: پیکربندی، وضعیت کانال/ارائه‌دهنده، auth profiles، نشست‌ها، لاگ‌ها،
      و Skills مشترک (`~/.openclaw/skills`).

    فضای کاری پیش‌فرض `~/.openclaw/workspace` است و از طریق این تنظیم قابل پیکربندی است:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    اگر ربات پس از restart «فراموش می‌کند»، تأیید کنید که Gateway در هر اجرا از همان
    فضای کاری استفاده می‌کند (و به خاطر داشته باشید: حالت راه دور از فضای کاری **میزبان gateway**
    استفاده می‌کند، نه لپ‌تاپ محلی شما).

    نکته: اگر یک رفتار یا ترجیح پایدار می‌خواهید، از ربات بخواهید **آن را در
    AGENTS.md یا MEMORY.md بنویسد**، نه اینکه به تاریخچهٔ چت تکیه کنید.

    [فضای کاری عامل](/fa/concepts/agent-workspace) و [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>

  <Accordion title="راهبرد پشتیبان‌گیری پیشنهادی">
    **فضای کاری عامل** خود را در یک repo خصوصی git قرار دهید و آن را در جایی
    خصوصی پشتیبان‌گیری کنید (برای مثال GitHub private). این کار حافظه + فایل‌های AGENTS/SOUL/USER
    را ثبت می‌کند و به شما اجازه می‌دهد بعداً «ذهن» دستیار را بازیابی کنید.

    هیچ چیزی را زیر `~/.openclaw` commit نکنید (اعتبارنامه‌ها، نشست‌ها، tokenها، یا payloadهای secrets رمزگذاری‌شده).
    اگر به بازیابی کامل نیاز دارید، هم فضای کاری و هم دایرکتوری وضعیت را
    جداگانه پشتیبان‌گیری کنید (پرسش migration بالا را ببینید).

    مستندات: [فضای کاری عامل](/fa/concepts/agent-workspace).

  </Accordion>

  <Accordion title="چگونه OpenClaw را به‌طور کامل حذف نصب کنم؟">
    راهنمای اختصاصی را ببینید: [حذف نصب](/fa/install/uninstall).
  </Accordion>

  <Accordion title="آیا عامل‌ها می‌توانند بیرون از فضای کاری کار کنند؟">
    بله. فضای کاری **cwd پیش‌فرض** و لنگر حافظه است، نه یک sandbox سخت‌گیرانه.
    مسیرهای نسبی داخل فضای کاری resolve می‌شوند، اما مسیرهای مطلق می‌توانند به مکان‌های دیگر
    میزبان دسترسی داشته باشند مگر اینکه sandboxing فعال باشد. اگر به ایزوله‌سازی نیاز دارید، از
    [`agents.defaults.sandbox`](/fa/gateway/sandboxing) یا تنظیمات sandbox برای هر عامل استفاده کنید. اگر
    می‌خواهید یک repo دایرکتوری کاری پیش‌فرض باشد، `workspace` همان عامل را به
    ریشهٔ repo اشاره دهید. repo مربوط به OpenClaw فقط source code است؛
    فضای کاری را جدا نگه دارید مگر اینکه عمداً بخواهید عامل داخل آن کار کند.

    مثال (repo به‌عنوان cwd پیش‌فرض):

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

  <Accordion title="حالت راه دور: session store کجاست؟">
    وضعیت نشست در مالکیت **میزبان gateway** است. اگر در حالت راه دور هستید، session store موردنظر شما روی ماشین راه دور است، نه لپ‌تاپ محلی شما. [مدیریت نشست](/fa/concepts/session) را ببینید.
  </Accordion>
</AccordionGroup>

## اصول اولیهٔ پیکربندی

<AccordionGroup>
  <Accordion title="فرمت پیکربندی چیست؟ کجاست؟">
    OpenClaw یک پیکربندی **JSON5** اختیاری را از `$OPENCLAW_CONFIG_PATH` می‌خواند (پیش‌فرض: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    اگر فایل وجود نداشته باشد، از پیش‌فرض‌های نسبتاً امن استفاده می‌کند (از جمله فضای کاری پیش‌فرض `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='من gateway.bind: "lan" (یا "tailnet") را تنظیم کردم و حالا هیچ‌چیزی listen نمی‌کند / UI می‌گوید unauthorized'>
    bindهای غیر loopback **به یک مسیر auth معتبر برای gateway نیاز دارند**. در عمل یعنی:

    - auth با shared-secret: token یا password
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

    - `gateway.remote.token` / `.password` به‌تنهایی auth محلی gateway را فعال **نمی‌کنند**.
    - مسیرهای فراخوانی محلی فقط وقتی `gateway.auth.*` تنظیم نشده باشد می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند.
    - برای auth با password، به‌جای آن `gateway.auth.mode: "password"` به‌همراه `gateway.auth.password` (یا `OPENCLAW_GATEWAY_PASSWORD`) را تنظیم کنید.
    - اگر `gateway.auth.token` / `gateway.auth.password` صریحاً از طریق SecretRef پیکربندی شده و unresolved باشد، resolution به‌صورت fail closed انجام می‌شود (بدون پوشاندن با remote fallback).
    - راه‌اندازی‌های Control UI با shared-secret از طریق `connect.params.auth.token` یا `connect.params.auth.password` احراز هویت می‌کنند (در تنظیمات app/UI ذخیره می‌شود). حالت‌های حامل هویت مانند Tailscale Serve یا `trusted-proxy` به‌جای آن از headerهای request استفاده می‌کنند. از قرار دادن shared secretها در URLها پرهیز کنید.
    - با `gateway.auth.mode: "trusted-proxy"`، reverse proxyهای loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح و یک ورودی loopback در `gateway.trustedProxies` نیاز دارند.

  </Accordion>

  <Accordion title="چرا حالا روی localhost به token نیاز دارم؟">
    OpenClaw به‌صورت پیش‌فرض auth مربوط به gateway را enforce می‌کند، از جمله loopback. در مسیر پیش‌فرض معمول، این یعنی auth با token: اگر هیچ مسیر auth صریحی پیکربندی نشده باشد، startup مربوط به gateway به حالت token resolve می‌شود و برای همان startup یک token فقط در زمان runtime تولید می‌کند، بنابراین **کلاینت‌های WS محلی باید احراز هویت کنند**. وقتی کلاینت‌ها به یک secret پایدار در restartها نیاز دارند، `gateway.auth.token`، `gateway.auth.password`، `OPENCLAW_GATEWAY_TOKEN`، یا `OPENCLAW_GATEWAY_PASSWORD` را صریحاً پیکربندی کنید. این کار جلوی فراخوانی Gateway توسط دیگر پردازه‌های محلی را می‌گیرد.

    اگر مسیر auth متفاوتی را ترجیح می‌دهید، می‌توانید صریحاً حالت password را انتخاب کنید (یا برای reverse proxyهای آگاه از هویت، `trusted-proxy`). اگر **واقعاً** loopback باز می‌خواهید، `gateway.auth.mode: "none"` را صریحاً در پیکربندی خود تنظیم کنید. Doctor هر زمان می‌تواند برای شما token تولید کند: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="آیا پس از تغییر پیکربندی باید restart کنم؟">
    Gateway پیکربندی را watch می‌کند و از hot-reload پشتیبانی می‌کند:

    - `gateway.reload.mode: "hybrid"` (پیش‌فرض): تغییرات امن را hot-apply می‌کند و برای موارد critical restart می‌کند
    - `hot`، `restart`، `off` نیز پشتیبانی می‌شوند

  </Accordion>

  <Accordion title="چگونه taglineهای بامزهٔ CLI را غیرفعال کنم؟">
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
    - `random`: taglineهای چرخشی بامزه/فصلی (رفتار پیش‌فرض).
    - اگر اصلاً هیچ banner نمی‌خواهید، env `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

  </Accordion>

  <Accordion title="چگونه web search (و web fetch) را فعال کنم؟">
    `web_fetch` بدون کلید API کار می‌کند. `web_search` به ارائه‌دهندهٔ انتخابی شما
    وابسته است:

    - ارائه‌دهندگان مبتنی بر API مانند Brave، Exa، Firecrawl، Gemini، Grok، Kimi، MiniMax Search، Perplexity، و Tavily به راه‌اندازی معمول کلید API خود نیاز دارند.
    - Ollama Web Search بدون کلید است، اما از میزبان Ollama پیکربندی‌شدهٔ شما استفاده می‌کند و به `ollama signin` نیاز دارد.
    - DuckDuckGo بدون کلید است، اما یک یکپارچه‌سازی غیررسمی مبتنی بر HTML است.
    - SearXNG بدون کلید/خودمیزبان است؛ `SEARXNG_BASE_URL` یا `plugins.entries.searxng.config.webSearch.baseUrl` را پیکربندی کنید.

    **پیشنهادی:** `openclaw configure --section web` را اجرا کنید و یک ارائه‌دهنده انتخاب کنید.
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

    پیکربندی جست‌وجوی وب ویژه هر ارائه‌دهنده اکنون زیر `plugins.entries.<plugin>.config.webSearch.*` قرار دارد.
    مسیرهای قدیمی ارائه‌دهنده در `tools.web.search.*` هنوز به‌طور موقت برای سازگاری بارگذاری می‌شوند، اما نباید برای پیکربندی‌های جدید استفاده شوند.
    پیکربندی جایگزین دریافت وب Firecrawl زیر `plugins.entries.firecrawl.config.webFetch.*` قرار دارد.

    نکته‌ها:

    - اگر از فهرست‌های مجاز استفاده می‌کنید، `web_search`/`web_fetch`/`x_search` یا `group:web` را اضافه کنید.
    - `web_fetch` به‌صورت پیش‌فرض فعال است (مگر اینکه صراحتا غیرفعال شده باشد).
    - اگر `tools.web.fetch.provider` حذف شود، OpenClaw نخستین ارائه‌دهنده جایگزین آماده برای دریافت را از میان اعتبارنامه‌های موجود به‌طور خودکار شناسایی می‌کند. امروز ارائه‌دهنده همراه Firecrawl است.
    - daemonها متغیرهای محیطی را از `~/.openclaw/.env` (یا محیط سرویس) می‌خوانند.

    مستندات: [ابزارهای وب](/fa/tools/web).

  </Accordion>

  <Accordion title="config.apply پیکربندی من را پاک کرد. چگونه آن را بازیابی کنم و از تکرار آن جلوگیری کنم؟">
    `config.apply` **کل پیکربندی** را جایگزین می‌کند. اگر یک شیء جزئی بفرستید، همه چیزهای
    دیگر حذف می‌شوند.

    نسخه فعلی OpenClaw جلوی بسیاری از بازنویسی‌های تصادفی را می‌گیرد:

    - نوشتن‌های پیکربندی متعلق به OpenClaw پیش از نوشتن، کل پیکربندی پس از تغییر را اعتبارسنجی می‌کنند.
    - نوشتن‌های نامعتبر یا مخرب متعلق به OpenClaw رد می‌شوند و با نام `openclaw.json.rejected.*` ذخیره می‌شوند.
    - اگر یک ویرایش مستقیم راه‌اندازی یا بارگذاری مجدد داغ را خراب کند، Gateway به‌صورت بسته شکست می‌خورد یا بارگذاری مجدد را رد می‌کند؛ `openclaw.json` را بازنویسی نمی‌کند.
    - `openclaw doctor --fix` مالک ترمیم است و می‌تواند آخرین نسخه سالم شناخته‌شده را بازیابی کند و هم‌زمان فایل ردشده را با نام `openclaw.json.clobbered.*` ذخیره کند.

    بازیابی:

    - در `openclaw logs --follow` به‌دنبال `Invalid config at`، `Config write rejected:`، یا `config reload skipped (invalid config)` بگردید.
    - جدیدترین `openclaw.json.clobbered.*` یا `openclaw.json.rejected.*` را کنار پیکربندی فعال بررسی کنید.
    - `openclaw config validate` و `openclaw doctor --fix` را اجرا کنید.
    - فقط کلیدهای موردنظر را با `openclaw config set` یا `config.patch` برگردانید.
    - اگر آخرین نسخه سالم شناخته‌شده یا محتوای ردشده ندارید، از نسخه پشتیبان بازیابی کنید، یا دوباره `openclaw doctor` را اجرا کنید و کانال‌ها/مدل‌ها را دوباره پیکربندی کنید.
    - اگر این اتفاق غیرمنتظره بود، یک باگ ثبت کنید و آخرین پیکربندی شناخته‌شده یا هر نسخه پشتیبان را ضمیمه کنید.
    - یک عامل کدنویسی محلی اغلب می‌تواند از روی گزارش‌ها یا تاریخچه، یک پیکربندی کارآمد را بازسازی کند.

    جلوگیری:

    - برای تغییرات کوچک از `openclaw config set` استفاده کنید.
    - برای ویرایش‌های تعاملی از `openclaw configure` استفاده کنید.
    - وقتی درباره مسیر دقیق یا شکل فیلد مطمئن نیستید، ابتدا از `config.schema.lookup` استفاده کنید؛ این یک گره طرح‌واره کم‌عمق به‌همراه خلاصه‌های فرزند بلافاصله برای بررسی عمیق‌تر برمی‌گرداند.
    - برای ویرایش‌های RPC جزئی از `config.patch` استفاده کنید؛ `config.apply` را فقط برای جایگزینی کامل پیکربندی نگه دارید.
    - اگر در اجرای یک عامل از ابزار فقط-مالک `gateway` استفاده می‌کنید، همچنان نوشتن در `tools.exec.ask` / `tools.exec.security` (از جمله نام‌های مستعار قدیمی `tools.bash.*` که به همان مسیرهای exec محافظت‌شده عادی‌سازی می‌شوند) را رد می‌کند.

    مستندات: [پیکربندی](/fa/cli/config)، [پیکربندی تعاملی](/fa/cli/configure)، [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-rejected-invalid-config)، [Doctor](/fa/gateway/doctor).

  </Accordion>

  <Accordion title="چگونه یک Gateway مرکزی را با workerهای تخصصی در دستگاه‌های مختلف اجرا کنم؟">
    الگوی رایج **یک Gateway** (برای مثال Raspberry Pi) به‌همراه **nodeها** و **عامل‌ها** است:

    - **Gateway (مرکزی):** مالک کانال‌ها (Signal/WhatsApp)، مسیریابی، و نشست‌ها است.
    - **Nodeها (دستگاه‌ها):** Macها/iOS/Android به‌عنوان پیرامونی متصل می‌شوند و ابزارهای محلی (`system.run`، `canvas`، `camera`) را ارائه می‌کنند.
    - **عامل‌ها (workerها):** مغزها/فضاهای کاری جدا برای نقش‌های ویژه (برای مثال "عملیات Hetzner"، "داده‌های شخصی").
    - **زیرعامل‌ها:** وقتی موازی‌سازی می‌خواهید، کار پس‌زمینه را از یک عامل اصلی ایجاد کنید.
    - **TUI:** به Gateway متصل شوید و بین عامل‌ها/نشست‌ها جابه‌جا شوید.

    مستندات: [Nodeها](/fa/nodes)، [دسترسی راه‌دور](/fa/gateway/remote)، [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [زیرعامل‌ها](/fa/tools/subagents)، [TUI](/fa/web/tui).

  </Accordion>

  <Accordion title="آیا مرورگر OpenClaw می‌تواند به‌صورت headless اجرا شود؟">
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

    مقدار پیش‌فرض `false` است (headful). حالت headless در برخی سایت‌ها احتمال بیشتری دارد بررسی‌های ضدربات را فعال کند. [مرورگر](/fa/tools/browser) را ببینید.

    حالت headless از **همان موتور Chromium** استفاده می‌کند و برای بیشتر خودکارسازی‌ها (فرم‌ها، کلیک‌ها، scraping، ورودها) کار می‌کند. تفاوت‌های اصلی:

    - پنجره مرورگر قابل‌مشاهده‌ای وجود ندارد (اگر به تصویر نیاز دارید از اسکرین‌شات استفاده کنید).
    - برخی سایت‌ها درباره خودکارسازی در حالت headless سخت‌گیرتر هستند (CAPTCHAها، ضدربات).
      برای مثال، X/Twitter اغلب نشست‌های headless را مسدود می‌کند.

  </Accordion>

  <Accordion title="چگونه از Brave برای کنترل مرورگر استفاده کنم؟">
    `browser.executablePath` را روی فایل اجرایی Brave خود (یا هر مرورگر مبتنی بر Chromium) تنظیم کنید و Gateway را راه‌اندازی مجدد کنید.
    نمونه‌های کامل پیکربندی را در [مرورگر](/fa/tools/browser#use-brave-or-another-chromium-based-browser) ببینید.
  </Accordion>
</AccordionGroup>

## Gatewayها و nodeهای راه‌دور

<AccordionGroup>
  <Accordion title="فرمان‌ها چگونه بین Telegram، Gateway، و nodeها منتقل می‌شوند؟">
    پیام‌های Telegram توسط **Gateway** مدیریت می‌شوند. Gateway عامل را اجرا می‌کند و
    فقط سپس، وقتی به ابزار node نیاز باشد، از طریق **Gateway WebSocket** با nodeها تماس می‌گیرد:

    Telegram → Gateway → عامل → `node.*` → Node → Gateway → Telegram

    Nodeها ترافیک ورودی ارائه‌دهنده را نمی‌بینند؛ آن‌ها فقط فراخوانی‌های RPC مربوط به node را دریافت می‌کنند.

  </Accordion>

  <Accordion title="اگر Gateway به‌صورت راه‌دور میزبانی شود، عامل من چگونه می‌تواند به رایانه من دسترسی پیدا کند؟">
    پاسخ کوتاه: **رایانه خود را به‌عنوان node جفت کنید**. Gateway جای دیگری اجرا می‌شود، اما می‌تواند
    ابزارهای `node.*` (صفحه، دوربین، سیستم) را روی دستگاه محلی شما از طریق Gateway WebSocket فراخوانی کند.

    راه‌اندازی معمول:

    1. Gateway را روی میزبان همیشه‌روشن (VPS/سرور خانگی) اجرا کنید.
    2. میزبان Gateway و رایانه خود را روی یک tailnet قرار دهید.
    3. مطمئن شوید Gateway WS در دسترس است (اتصال tailnet یا تونل SSH).
    4. برنامه macOS را به‌صورت محلی باز کنید و در حالت **راه‌دور از طریق SSH** (یا tailnet مستقیم) متصل شوید
       تا بتواند به‌عنوان node ثبت شود.
    5. node را روی Gateway تایید کنید:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    هیچ پل TCP جداگانه‌ای لازم نیست؛ nodeها از طریق Gateway WebSocket متصل می‌شوند.

    یادآوری امنیتی: جفت‌کردن یک node macOS اجازه اجرای `system.run` را روی آن دستگاه می‌دهد. فقط
    دستگاه‌هایی را جفت کنید که به آن‌ها اعتماد دارید، و [امنیت](/fa/gateway/security) را مرور کنید.

    مستندات: [Nodeها](/fa/nodes)، [پروتکل Gateway](/fa/gateway/protocol)، [حالت راه‌دور macOS](/fa/platforms/mac/remote)، [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="Tailscale وصل است اما پاسخی دریافت نمی‌کنم. حالا چه کنم؟">
    موارد پایه را بررسی کنید:

    - Gateway در حال اجرا است: `openclaw gateway status`
    - سلامت Gateway: `openclaw status`
    - سلامت کانال: `openclaw channels status`

    سپس احراز هویت و مسیریابی را بررسی کنید:

    - اگر از Tailscale Serve استفاده می‌کنید، مطمئن شوید `gateway.auth.allowTailscale` درست تنظیم شده است.
    - اگر از طریق تونل SSH متصل می‌شوید، تایید کنید تونل محلی فعال است و به پورت درست اشاره می‌کند.
    - تایید کنید فهرست‌های مجاز شما (DM یا گروه) شامل حساب شما هستند.

    مستندات: [Tailscale](/fa/gateway/tailscale)، [دسترسی راه‌دور](/fa/gateway/remote)، [کانال‌ها](/fa/channels).

  </Accordion>

  <Accordion title="آیا دو نمونه OpenClaw می‌توانند با هم صحبت کنند (محلی + VPS)؟">
    بله. پل داخلی "bot-to-bot" وجود ندارد، اما می‌توانید آن را به چند روش
    قابل‌اعتماد وصل کنید:

    **ساده‌ترین:** از یک کانال گفت‌وگوی معمولی استفاده کنید که هر دو ربات به آن دسترسی دارند (Telegram/Slack/WhatsApp).
    کاری کنید Bot A پیامی به Bot B بفرستد، سپس بگذارید Bot B طبق معمول پاسخ دهد.

    **پل CLI (عمومی):** اسکریپتی اجرا کنید که Gateway دیگر را با
    `openclaw agent --message ... --deliver` فراخوانی کند و یک گفت‌وگو را هدف بگیرد که ربات دیگر
    در آن گوش می‌دهد. اگر یک ربات روی VPS راه‌دور است، CLI خود را از طریق SSH/Tailscale به آن Gateway راه‌دور
    متصل کنید ([دسترسی راه‌دور](/fa/gateway/remote) را ببینید).

    الگوی نمونه (از دستگاهی اجرا کنید که می‌تواند به Gateway مقصد برسد):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نکته: یک حفاظ اضافه کنید تا دو ربات بی‌پایان در حلقه نیفتند (فقط با mention، فهرست‌های
    مجاز کانال، یا قانون "به پیام‌های ربات پاسخ نده").

    مستندات: [دسترسی راه‌دور](/fa/gateway/remote)، [CLI عامل](/fa/cli/agent)، [ارسال عامل](/fa/tools/agent-send).

  </Accordion>

  <Accordion title="آیا برای چند عامل به VPSهای جداگانه نیاز دارم؟">
    خیر. یک Gateway می‌تواند چند عامل را میزبانی کند، هرکدام با فضای کاری، پیش‌فرض‌های مدل،
    و مسیریابی خودش. این راه‌اندازی معمول است و بسیار ارزان‌تر و ساده‌تر از اجرای
    یک VPS برای هر عامل است.

    فقط زمانی از VPSهای جداگانه استفاده کنید که به جداسازی سخت (مرزهای امنیتی) یا پیکربندی‌های
    بسیار متفاوتی نیاز دارید که نمی‌خواهید به اشتراک بگذارید. در غیر این صورت، یک Gateway نگه دارید و
    از چند عامل یا زیرعامل استفاده کنید.

  </Accordion>

  <Accordion title="آیا استفاده از node روی لپ‌تاپ شخصی من به‌جای SSH از یک VPS مزیتی دارد؟">
    بله - nodeها راه درجه‌یک برای دسترسی به لپ‌تاپ شما از یک Gateway راه‌دور هستند، و
    چیزهایی فراتر از دسترسی shell را فعال می‌کنند. Gateway روی macOS/Linux (Windows از طریق WSL2) اجرا می‌شود و
    سبک است (یک VPS کوچک یا جعبه‌ای در حد Raspberry Pi کافی است؛ ۴ گیگابایت RAM کاملا کافی است)، بنابراین یک
    راه‌اندازی رایج، یک میزبان همیشه‌روشن به‌همراه لپ‌تاپ شما به‌عنوان node است.

    - **به SSH ورودی نیازی نیست.** Nodeها به Gateway WebSocket وصل می‌شوند و از جفت‌سازی دستگاه استفاده می‌کنند.
    - **کنترل‌های اجرای امن‌تر.** `system.run` روی آن لپ‌تاپ با فهرست‌های مجاز/تاییدیه‌های node کنترل می‌شود.
    - **ابزارهای بیشتر دستگاه.** Nodeها علاوه بر `system.run`، `canvas`، `camera`، و `screen` را ارائه می‌کنند.
    - **خودکارسازی مرورگر محلی.** Gateway را روی VPS نگه دارید، اما Chrome را به‌صورت محلی از طریق میزبان node روی لپ‌تاپ اجرا کنید، یا از طریق Chrome MCP به Chrome محلی روی میزبان متصل شوید.

    SSH برای دسترسی shell موقت مناسب است، اما nodeها برای جریان‌های کاری مداوم عامل و
    خودکارسازی دستگاه ساده‌تر هستند.

    مستندات: [Nodeها](/fa/nodes)، [CLI Nodeها](/fa/cli/nodes)، [مرورگر](/fa/tools/browser).

  </Accordion>

  <Accordion title="آیا nodeها یک سرویس gateway اجرا می‌کنند؟">
    خیر. فقط **یک gateway** باید روی هر میزبان اجرا شود، مگر اینکه عمدا پروفایل‌های جداافتاده اجرا کنید ([چند Gateway](/fa/gateway/multiple-gateways) را ببینید). Nodeها پیرامونی‌هایی هستند که به
    gateway متصل می‌شوند (nodeهای iOS/Android، یا "حالت node" macOS در برنامه نوار منو). برای میزبان‌های node
    بدون رابط گرافیکی و کنترل CLI، [CLI میزبان Node](/fa/cli/node) را ببینید.

    برای تغییرات `gateway`، `discovery`، و سطح Pluginهای میزبانی‌شده، راه‌اندازی مجدد کامل لازم است.

  </Accordion>

  <Accordion title="آیا راه API / RPC برای اعمال پیکربندی وجود دارد؟">
    بله.

    - `config.schema.lookup`: پیش از نوشتن، یک زیردرخت پیکربندی را همراه با گره سطحی schema، راهنمای UI منطبق، و خلاصه‌های فوری فرزندان بررسی می‌کند
    - `config.get`: snapshot + hash فعلی را دریافت می‌کند
    - `config.patch`: به‌روزرسانی جزئی امن (گزینه ترجیحی برای بیشتر ویرایش‌های RPC)؛ هرجا ممکن باشد hot-reload می‌کند و هرجا لازم باشد بازراه‌اندازی می‌کند
    - `config.apply`: کل پیکربندی را اعتبارسنجی + جایگزین می‌کند؛ هرجا ممکن باشد hot-reload می‌کند و هرجا لازم باشد بازراه‌اندازی می‌کند
    - ابزار runtime مخصوص مالک `gateway` همچنان از بازنویسی `tools.exec.ask` / `tools.exec.security` خودداری می‌کند؛ aliasهای قدیمی `tools.bash.*` به همان مسیرهای محافظت‌شده exec نرمال‌سازی می‌شوند

  </Accordion>

  <Accordion title="پیکربندی حداقلی و معقول برای اولین نصب">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    این کار workspace شما را تنظیم می‌کند و محدود می‌کند چه کسی می‌تواند bot را فعال کند.

  </Accordion>

  <Accordion title="چطور Tailscale را روی یک VPS راه‌اندازی کنم و از Mac خودم وصل شوم؟">
    مراحل حداقلی:

    1. **نصب + ورود روی VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **نصب + ورود روی Mac شما**
       - از برنامه Tailscale استفاده کنید و وارد همان tailnet شوید.
    3. **فعال‌سازی MagicDNS (توصیه‌شده)**
       - در کنسول مدیریت Tailscale، MagicDNS را فعال کنید تا VPS یک نام پایدار داشته باشد.
    4. **استفاده از hostname مربوط به tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    اگر Control UI را بدون SSH می‌خواهید، از Tailscale Serve روی VPS استفاده کنید:

    ```bash
    openclaw gateway --tailscale serve
    ```

    این کار Gateway را روی loopback نگه می‌دارد و HTTPS را از طریق Tailscale در دسترس قرار می‌دهد. [Tailscale](/fa/gateway/tailscale) را ببینید.

  </Accordion>

  <Accordion title="چطور یک Mac node را به یک Gateway راه‌دور (Tailscale Serve) وصل کنم؟">
    Serve، **Gateway Control UI + WS** را در دسترس قرار می‌دهد. Nodeها از همان endpoint مربوط به Gateway WS وصل می‌شوند.

    راه‌اندازی پیشنهادی:

    1. **مطمئن شوید VPS + Mac در یک tailnet هستند**.
    2. **از برنامه macOS در حالت Remote استفاده کنید** (هدف SSH می‌تواند hostname مربوط به tailnet باشد).
       برنامه پورت Gateway را tunnel می‌کند و به‌عنوان یک Node وصل می‌شود.
    3. **Node را** روی Gateway تأیید کنید:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    مستندات: [پروتکل Gateway](/fa/gateway/protocol)، [Discovery](/fa/gateway/discovery)، [حالت راه‌دور macOS](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="باید روی لپ‌تاپ دوم نصب کنم یا فقط یک Node اضافه کنم؟">
    اگر فقط به **ابزارهای محلی** (screen/camera/exec) روی لپ‌تاپ دوم نیاز دارید، آن را به‌عنوان یک
    **Node** اضافه کنید. این کار یک Gateway واحد نگه می‌دارد و از پیکربندی تکراری جلوگیری می‌کند. ابزارهای Node محلی
    در حال حاضر فقط مخصوص macOS هستند، اما قصد داریم آن‌ها را به OSهای دیگر هم گسترش دهیم.

    فقط زمانی Gateway دوم نصب کنید که به **جداسازی سخت** یا دو bot کاملاً جدا نیاز دارید.

    مستندات: [Nodeها](/fa/nodes)، [CLI مربوط به Nodeها](/fa/cli/nodes)، [چند Gateway](/fa/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغیرهای محیطی و بارگذاری .env

<AccordionGroup>
  <Accordion title="OpenClaw چگونه متغیرهای محیطی را بارگذاری می‌کند؟">
    OpenClaw متغیرهای محیطی را از فرایند والد (shell، launchd/systemd، CI و غیره) می‌خواند و علاوه بر آن، این موارد را بارگذاری می‌کند:

    - `.env` از دایرکتوری کاری فعلی
    - یک fallback سراسری `.env` از `~/.openclaw/.env` (معروف به `$OPENCLAW_STATE_DIR/.env`)

    هیچ‌کدام از فایل‌های `.env`، متغیرهای محیطی موجود را override نمی‌کنند.

    همچنین می‌توانید متغیرهای محیطی inline را در پیکربندی تعریف کنید (فقط اگر در process env موجود نباشند اعمال می‌شود):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    برای precedence و sourceهای کامل، [/environment](/fa/help/environment) را ببینید.

  </Accordion>

  <Accordion title="Gateway را از طریق سرویس شروع کردم و متغیرهای محیطی‌ام ناپدید شدند. حالا چه کنم؟">
    دو راه‌حل رایج:

    1. کلیدهای گم‌شده را در `~/.openclaw/.env` قرار دهید تا حتی وقتی سرویس env مربوط به shell شما را به ارث نمی‌برد، برداشته شوند.
    2. import از shell را فعال کنید (راحتی opt-in):

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

    این کار shell ورود شما را اجرا می‌کند و فقط کلیدهای مورد انتظارِ گم‌شده را import می‌کند (هرگز override نمی‌کند). معادل‌های متغیر محیطی:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN را تنظیم کردم، اما وضعیت مدل‌ها "Shell env: off." نشان می‌دهد. چرا؟'>
    `openclaw models status` گزارش می‌دهد که آیا **import از shell env** فعال است یا نه. "Shell env: off"
    به این معنا **نیست** که متغیرهای محیطی شما گم شده‌اند - فقط یعنی OpenClaw به‌صورت خودکار
    shell ورود شما را بارگذاری نمی‌کند.

    اگر Gateway به‌عنوان سرویس (launchd/systemd) اجرا شود، environment مربوط به shell شما را
    به ارث نمی‌برد. با انجام یکی از این کارها مشکل را حل کنید:

    1. token را در `~/.openclaw/.env` قرار دهید:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. یا import از shell را فعال کنید (`env.shellEnv.enabled: true`).
    3. یا آن را به بلوک `env` در پیکربندی خود اضافه کنید (فقط اگر گم شده باشد اعمال می‌شود).

    سپس Gateway را بازراه‌اندازی کنید و دوباره بررسی کنید:

    ```bash
    openclaw models status
    ```

    tokenهای Copilot از `COPILOT_GITHUB_TOKEN` خوانده می‌شوند (همچنین `GH_TOKEN` / `GITHUB_TOKEN`).
    [/concepts/model-providers](/fa/concepts/model-providers) و [/environment](/fa/help/environment) را ببینید.

  </Accordion>
</AccordionGroup>

## جلسه‌ها و چندین chat

<AccordionGroup>
  <Accordion title="چطور یک گفت‌وگوی تازه شروع کنم؟">
    `/new` یا `/reset` را به‌عنوان یک پیام مستقل ارسال کنید. [مدیریت جلسه](/fa/concepts/session) را ببینید.
  </Accordion>

  <Accordion title="اگر هرگز /new ارسال نکنم، sessionها خودکار reset می‌شوند؟">
    Sessionها می‌توانند پس از `session.idleMinutes` منقضی شوند، اما این قابلیت **به‌صورت پیش‌فرض غیرفعال است** (پیش‌فرض **0**).
    برای فعال‌سازی انقضای idle، آن را روی یک مقدار مثبت تنظیم کنید. وقتی فعال باشد، **پیام بعدی**
    پس از دوره idle، یک session id تازه برای آن chat key شروع می‌کند.
    این کار transcriptها را حذف نمی‌کند - فقط یک session جدید شروع می‌کند.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="آیا راهی برای ساخت یک تیم از نمونه‌های OpenClaw وجود دارد (یک مدیرعامل و چندین عامل)؟">
    بله، از طریق **مسیریابی چندعاملی** و **زیرعامل‌ها**. می‌توانید یک عامل هماهنگ‌کننده
    و چندین عامل اجرایی با فضای کاری و مدل‌های مخصوص خودشان بسازید.

    با این حال، بهتر است این را یک **آزمایش سرگرم‌کننده** بدانید. مصرف توکن آن زیاد است و اغلب
    از استفاده از یک بات با نشست‌های جداگانه کارآمدی کمتری دارد. مدل معمولی که ما
    تصور می‌کنیم یک بات است که با آن صحبت می‌کنید، با نشست‌های متفاوت برای کار موازی. آن
    بات همچنین می‌تواند در صورت نیاز زیرعامل‌ها را ایجاد کند.

    مستندات: [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [زیرعامل‌ها](/fa/tools/subagents)، [CLI عامل‌ها](/fa/cli/agents).

  </Accordion>

  <Accordion title="چرا زمینه در میانه کار کوتاه شد؟ چگونه از آن جلوگیری کنم؟">
    زمینه نشست به پنجره مدل محدود است. گفت‌وگوهای طولانی، خروجی‌های بزرگ ابزار، یا فایل‌های زیاد
    می‌توانند باعث Compaction یا کوتاه‌سازی شوند.

    چه چیزهایی کمک می‌کند:

    - از بات بخواهید وضعیت فعلی را خلاصه کند و آن را در یک فایل بنویسد.
    - پیش از کارهای طولانی از `/compact` استفاده کنید، و هنگام تغییر موضوع از `/new`.
    - زمینه مهم را در فضای کاری نگه دارید و از بات بخواهید آن را دوباره بخواند.
    - برای کارهای طولانی یا موازی از زیرعامل‌ها استفاده کنید تا گفت‌وگوی اصلی کوچک‌تر بماند.
    - اگر این اتفاق زیاد رخ می‌دهد، مدلی با پنجره زمینه بزرگ‌تر انتخاب کنید.

  </Accordion>

  <Accordion title="چگونه OpenClaw را کاملا بازنشانی کنم اما نصب‌شده نگه دارم؟">
    از فرمان بازنشانی استفاده کنید:

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

    - فرایند ورود نیز اگر پیکربندی موجودی ببیند، **بازنشانی** را پیشنهاد می‌کند. [ورود (CLI)](/fa/start/wizard) را ببینید.
    - اگر از پروفایل‌ها (`--profile` / `OPENCLAW_PROFILE`) استفاده کرده‌اید، هر دایرکتوری وضعیت را بازنشانی کنید (پیش‌فرض‌ها `~/.openclaw-<profile>` هستند).
    - بازنشانی توسعه: `openclaw gateway --dev --reset` (فقط برای توسعه؛ پیکربندی توسعه + اعتبارنامه‌ها + نشست‌ها + فضای کاری را پاک می‌کند).

  </Accordion>

  <Accordion title='خطاهای "context too large" می‌گیرم - چگونه بازنشانی یا فشرده‌سازی کنم؟'>
    از یکی از این‌ها استفاده کنید:

    - **فشرده‌سازی** (گفت‌وگو را نگه می‌دارد اما نوبت‌های قدیمی‌تر را خلاصه می‌کند):

      ```
      /compact
      ```

      یا برای هدایت خلاصه از `/compact <instructions>` استفاده کنید.

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
    این یک خطای اعتبارسنجی ارائه‌دهنده است: مدل یک بلوک `tool_use` بدون
    `input` الزامی تولید کرده است. معمولا یعنی تاریخچه نشست قدیمی یا خراب شده است (اغلب پس از رشته‌های طولانی
    یا تغییر ابزار/طرحواره).

    راه‌حل: یک نشست تازه با `/new` شروع کنید (پیام مستقل).

  </Accordion>

  <Accordion title="چرا هر ۳۰ دقیقه پیام‌های Heartbeat دریافت می‌کنم؟">
    Heartbeatها به‌طور پیش‌فرض هر **30m** اجرا می‌شوند (**1h** هنگام استفاده از احراز هویت OAuth). آن‌ها را تنظیم یا غیرفعال کنید:

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

    اگر `HEARTBEAT.md` وجود داشته باشد اما عملا خالی باشد (فقط خطوط خالی و سربرگ‌های markdown
    مانند `# Heading`)، OpenClaw اجرای Heartbeat را برای صرفه‌جویی در فراخوانی‌های API رد می‌کند.
    اگر فایل وجود نداشته باشد، Heartbeat همچنان اجرا می‌شود و مدل تصمیم می‌گیرد چه کاری انجام دهد.

    بازنویسی‌های مخصوص هر عامل از `agents.list[].heartbeat` استفاده می‌کنند. مستندات: [Heartbeat](/fa/gateway/heartbeat).

  </Accordion>

  <Accordion title='آیا باید یک "حساب بات" را به یک گروه WhatsApp اضافه کنم؟'>
    خیر. OpenClaw روی **حساب خود شما** اجرا می‌شود، بنابراین اگر شما در گروه باشید، OpenClaw می‌تواند آن را ببیند.
    به‌طور پیش‌فرض، پاسخ‌های گروهی تا زمانی که فرستنده‌ها را مجاز نکنید مسدود هستند (`groupPolicy: "allowlist"`).

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

  <Accordion title="چگونه JID یک گروه WhatsApp را به دست بیاورم؟">
    گزینه ۱ (سریع‌ترین): گزارش‌ها را دنبال کنید و یک پیام آزمایشی در گروه بفرستید:

    ```bash
    openclaw logs --follow --json
    ```

    به دنبال `chatId` (یا `from`) باشید که به `@g.us` ختم می‌شود، مانند:
    `1234567890-1234567890@g.us`.

    گزینه ۲ (اگر قبلا پیکربندی/در فهرست مجاز قرار داده شده است): گروه‌ها را از پیکربندی فهرست کنید:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    مستندات: [WhatsApp](/fa/channels/whatsapp)، [دایرکتوری](/fa/cli/directory)، [گزارش‌ها](/fa/cli/logs).

  </Accordion>

  <Accordion title="چرا OpenClaw در یک گروه پاسخ نمی‌دهد؟">
    دو علت رایج:

    - دروازه‌گذاری اشاره روشن است (پیش‌فرض). باید بات را @mention کنید (یا با `mentionPatterns` تطبیق دهید).
    - شما `channels.whatsapp.groups` را بدون `"*"` پیکربندی کرده‌اید و گروه در فهرست مجاز نیست.

    [گروه‌ها](/fa/channels/groups) و [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.

  </Accordion>

  <Accordion title="آیا گروه‌ها/رشته‌ها با پیام‌های مستقیم زمینه مشترک دارند؟">
    گفت‌وگوهای مستقیم به‌طور پیش‌فرض به نشست اصلی فروکاسته می‌شوند. گروه‌ها/کانال‌ها کلیدهای نشست خودشان را دارند، و موضوع‌های Telegram / رشته‌های Discord نشست‌های جداگانه هستند. [گروه‌ها](/fa/channels/groups) و [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.
  </Accordion>

  <Accordion title="چند فضای کاری و عامل می‌توانم ایجاد کنم؟">
    محدودیت سختی وجود ندارد. ده‌ها (حتی صدها) مورد مشکلی ندارد، اما مراقب این موارد باشید:

    - **رشد دیسک:** نشست‌ها + رونوشت‌ها زیر `~/.openclaw/agents/<agentId>/sessions/` قرار دارند.
    - **هزینه توکن:** عامل‌های بیشتر یعنی استفاده هم‌زمان بیشتر از مدل.
    - **سربار عملیاتی:** پروفایل‌های احراز هویت، فضاهای کاری، و مسیریابی کانال برای هر عامل.

    نکات:

    - برای هر عامل یک فضای کاری **فعال** نگه دارید (`agents.defaults.workspace`).
    - اگر دیسک رشد کرد، نشست‌های قدیمی را هرس کنید (JSONL یا ورودی‌های ذخیره را حذف کنید).
    - از `openclaw doctor` برای پیدا کردن فضاهای کاری سرگردان و ناهماهنگی‌های پروفایل استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم چند بات یا چت را هم‌زمان اجرا کنم (Slack)، و چطور باید آن را تنظیم کنم؟">
    بله. از **مسیریابی چندعامله** استفاده کنید تا چند عامل ایزوله اجرا شوند و پیام‌های ورودی بر اساس
    کانال/حساب/همتا مسیریابی شوند. Slack به عنوان یک کانال پشتیبانی می‌شود و می‌تواند به عامل‌های مشخص متصل شود.

    دسترسی مرورگر قدرتمند است، اما به معنی «انجام هر کاری که انسان می‌تواند انجام دهد» نیست - ضدبات، CAPTCHAها، و MFA همچنان می‌توانند
    خودکارسازی را مسدود کنند. برای قابل‌اعتمادترین کنترل مرورگر، از Chrome MCP محلی روی میزبان استفاده کنید،
    یا از CDP روی ماشینی استفاده کنید که واقعا مرورگر را اجرا می‌کند.

    تنظیم پیشنهادی:

    - میزبان Gateway همیشه روشن (VPS/Mac mini).
    - یک عامل برای هر نقش (اتصال‌ها).
    - کانال‌های Slack متصل به آن عامل‌ها.
    - مرورگر محلی از طریق Chrome MCP یا یک گره در صورت نیاز.

    مستندات: [مسیریابی چندعامله](/fa/concepts/multi-agent)، [Slack](/fa/channels/slack)،
    [مرورگر](/fa/tools/browser)، [گره‌ها](/fa/nodes).

  </Accordion>
</AccordionGroup>

## مدل‌ها، جایگزینی در خطا، و پروفایل‌های احراز هویت

پرسش‌وپاسخ مدل - پیش‌فرض‌ها، انتخاب، نام‌های مستعار، تعویض، جایگزینی در خطا، پروفایل‌های احراز هویت -
در [پرسش‌های متداول مدل‌ها](/fa/help/faq-models) قرار دارد.

## Gateway: پورت‌ها، «already running»، و حالت راه دور

<AccordionGroup>
  <Accordion title="Gateway از چه پورتی استفاده می‌کند؟">
    `gateway.port` پورت تک‌کاناله برای WebSocket + HTTP را کنترل می‌کند (Control UI، hookها، و غیره).

    تقدم:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='چرا openclaw gateway status می‌گوید "Runtime: running" اما "Connectivity probe: failed"؟'>
    چون «running» دیدگاه **ناظر** است (launchd/systemd/schtasks). پروب اتصال، خود CLI است که واقعا به WebSocket Gateway وصل می‌شود.

    از `openclaw gateway status` استفاده کنید و به این خط‌ها اعتماد کنید:

    - `Probe target:` (نشانی‌ای که پروب واقعا استفاده کرده است)
    - `Listening:` (چیزی که واقعا روی پورت bind شده است)
    - `Last gateway error:` (علت ریشه‌ای رایج وقتی فرایند زنده است اما پورت listening نیست)

  </Accordion>

  <Accordion title='چرا openclaw gateway status مقادیر متفاوتی برای "Config (cli)" و "Config (service)" نشان می‌دهد؟'>
    شما یک فایل پیکربندی را ویرایش می‌کنید در حالی که سرویس فایل دیگری را اجرا می‌کند (اغلب ناهماهنگی `--profile` / `OPENCLAW_STATE_DIR`).

    رفع:

    ```bash
    openclaw gateway install --force
    ```

    این را از همان `--profile` / محیطی اجرا کنید که می‌خواهید سرویس از آن استفاده کند.

  </Accordion>

  <Accordion title='عبارت "another gateway instance is already listening" یعنی چه؟'>
    OpenClaw با bind کردن فوری شنونده WebSocket در زمان راه‌اندازی، یک قفل runtime اعمال می‌کند (پیش‌فرض `ws://127.0.0.1:18789`). اگر bind با `EADDRINUSE` شکست بخورد، `GatewayLockError` پرتاب می‌کند که نشان می‌دهد نمونه دیگری از قبل در حال listening است.

    رفع: نمونه دیگر را متوقف کنید، پورت را آزاد کنید، یا با `openclaw gateway --port <port>` اجرا کنید.

  </Accordion>

  <Accordion title="چطور OpenClaw را در حالت راه دور اجرا کنم (کلاینت به Gateway در جای دیگری وصل شود)؟">
    `gateway.mode: "remote"` را تنظیم کنید و به یک URL راه دور WebSocket اشاره کنید، به‌صورت اختیاری همراه با اعتبارنامه‌های راه دور shared-secret:

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

    نکات:

    - `openclaw gateway` فقط وقتی شروع می‌شود که `gateway.mode` برابر `local` باشد (یا فلگ override را بدهید).
    - برنامه macOS فایل پیکربندی را پایش می‌کند و وقتی این مقادیر تغییر کنند، زنده حالت‌ها را عوض می‌کند.
    - `gateway.remote.token` / `.password` فقط اعتبارنامه‌های راه دور سمت کلاینت هستند؛ به‌خودی‌خود احراز هویت Gateway محلی را فعال نمی‌کنند.

  </Accordion>

  <Accordion title='Control UI می‌گوید "unauthorized" (یا مدام دوباره وصل می‌شود). حالا چه کنم؟'>
    مسیر احراز هویت Gateway شما و روش احراز هویت UI با هم تطابق ندارند.

    واقعیت‌ها (از کد):

    - Control UI توکن را برای نشست فعلی تب مرورگر و URL انتخاب‌شده Gateway در `sessionStorage` نگه می‌دارد، بنابراین refreshهای همان تب بدون بازگرداندن ماندگاری توکن بلندمدت localStorage همچنان کار می‌کنند.
    - در `AUTH_TOKEN_MISMATCH`، کلاینت‌های مورد اعتماد می‌توانند وقتی Gateway راهنمای retry برمی‌گرداند (`canRetryWithDeviceToken=true`، `recommendedNextStep=retry_with_device_token`)، یک retry محدود با توکن دستگاه کش‌شده انجام دهند.
    - آن retry با توکن کش‌شده اکنون scopeهای تاییدشده کش‌شده ذخیره‌شده همراه توکن دستگاه را دوباره استفاده می‌کند. فراخوان‌های صریح `deviceToken` / صریح `scopes` همچنان به جای ارث‌بری از scopeهای کش‌شده، مجموعه scope درخواستی خود را نگه می‌دارند.
    - بیرون از آن مسیر retry، تقدم احراز هویت اتصال اول با توکن/رمزعبور مشترک صریح، سپس `deviceToken` صریح، سپس توکن دستگاه ذخیره‌شده، سپس توکن bootstrap است.
    - بررسی scope توکن bootstrap دارای پیشوند نقش است. allowlist عملگر bootstrap داخلی فقط درخواست‌های عملگر را برآورده می‌کند؛ node یا نقش‌های غیرعملگر دیگر همچنان به scopeهایی زیر پیشوند نقش خودشان نیاز دارند.

    رفع:

    - سریع‌ترین: `openclaw dashboard` (URL داشبورد را چاپ + کپی می‌کند، تلاش می‌کند باز کند؛ اگر headless باشد راهنمای SSH نشان می‌دهد).
    - اگر هنوز توکن ندارید: `openclaw doctor --generate-gateway-token`.
    - اگر راه دور است، اول تونل بزنید: `ssh -N -L 18789:127.0.0.1:18789 user@host` سپس `http://127.0.0.1:18789/` را باز کنید.
    - حالت shared-secret: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` یا `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` را تنظیم کنید، سپس secret مطابق را در تنظیمات Control UI وارد کنید.
    - حالت Tailscale Serve: مطمئن شوید `gateway.auth.allowTailscale` فعال است و دارید URL مربوط به Serve را باز می‌کنید، نه یک URL خام loopback/tailnet که headerهای هویت Tailscale را دور می‌زند.
    - حالت trusted-proxy: مطمئن شوید از مسیر پراکسی identity-aware پیکربندی‌شده وارد می‌شوید، نه یک URL خام Gateway. پراکسی‌های loopback روی همان میزبان هم به `gateway.auth.trustedProxy.allowLoopback = true` نیاز دارند.
    - اگر پس از یک retry ناهماهنگی باقی ماند، توکن دستگاه جفت‌شده را rotate/دوباره تایید کنید:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - اگر آن فراخوان rotate گفت denied شده است، دو چیز را بررسی کنید:
      - نشست‌های دستگاه جفت‌شده فقط می‌توانند دستگاه **خودشان** را rotate کنند، مگر اینکه `operator.admin` هم داشته باشند
      - مقادیر صریح `--scope` نمی‌توانند از scopeهای عملگر فعلی فراخواننده فراتر بروند
    - هنوز گیر کرده‌اید؟ `openclaw status --all` را اجرا کنید و [عیب‌یابی](/fa/gateway/troubleshooting) را دنبال کنید. برای جزئیات احراز هویت [داشبورد](/fa/web/dashboard) را ببینید.

  </Accordion>

  <Accordion title="gateway.bind را روی tailnet گذاشتم اما نمی‌تواند bind کند و چیزی listening نیست">
    bind با `tailnet` یک IP متعلق به Tailscale را از رابط‌های شبکه شما انتخاب می‌کند (100.64.0.0/10). اگر ماشین روی Tailscale نباشد (یا رابط down باشد)، چیزی برای bind کردن وجود ندارد.

    رفع:

    - Tailscale را روی آن میزبان شروع کنید (تا یک نشانی 100.x داشته باشد)، یا
    - به `gateway.bind: "loopback"` / `"lan"` تغییر دهید.

    نکته: `tailnet` صریح است. `auto` loopback را ترجیح می‌دهد؛ وقتی bind فقط tailnet می‌خواهید، از `gateway.bind: "tailnet"` استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم چند Gateway را روی یک میزبان اجرا کنم؟">
    معمولا نه - یک Gateway می‌تواند چند کانال پیام‌رسانی و عامل را اجرا کند. فقط وقتی به افزونگی (مثلا: بات نجات) یا ایزوله‌سازی سخت نیاز دارید از چند Gateway استفاده کنید.

    بله، اما باید ایزوله کنید:

    - `OPENCLAW_CONFIG_PATH` (پیکربندی برای هر نمونه)
    - `OPENCLAW_STATE_DIR` (state برای هر نمونه)
    - `agents.defaults.workspace` (ایزوله‌سازی فضای کاری)
    - `gateway.port` (پورت‌های یکتا)

    تنظیم سریع (پیشنهادی):

    - برای هر نمونه از `openclaw --profile <name> ...` استفاده کنید (به‌صورت خودکار `~/.openclaw-<name>` را ایجاد می‌کند).
    - در پیکربندی هر پروفایل یک `gateway.port` یکتا تنظیم کنید (یا برای اجراهای دستی `--port` بدهید).
    - یک سرویس مخصوص هر پروفایل نصب کنید: `openclaw --profile <name> gateway install`.

    پروفایل‌ها نام سرویس‌ها را هم پسونددار می‌کنند (`ai.openclaw.<profile>`؛ قدیمی `com.openclaw.*`، `openclaw-gateway-<profile>.service`، `OpenClaw Gateway (<profile>)`).
    راهنمای کامل: [چند Gateway](/fa/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='عبارت "invalid handshake" / کد 1008 یعنی چه؟'>
    Gateway یک **سرور WebSocket** است، و انتظار دارد اولین پیام
    یک فریم `connect` باشد. اگر چیز دیگری دریافت کند، اتصال را
    با **کد 1008** (نقض policy) می‌بندد.

    علت‌های رایج:

    - به جای کلاینت WS، URL مربوط به **HTTP** را در مرورگر باز کرده‌اید (`http://...`).
    - از پورت یا مسیر اشتباه استفاده کرده‌اید.
    - یک پراکسی یا تونل headerهای احراز هویت را حذف کرده یا یک درخواست غیر Gateway فرستاده است.

    رفع‌های سریع:

    1. از URL مربوط به WS استفاده کنید: `ws://<host>:18789` (یا اگر HTTPS است `wss://...`).
    2. پورت WS را در یک تب معمولی مرورگر باز نکنید.
    3. اگر احراز هویت روشن است، توکن/رمزعبور را در فریم `connect` بگنجانید.

    اگر از CLI یا TUI استفاده می‌کنید، URL باید شبیه این باشد:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    جزئیات پروتکل: [پروتکل Gateway](/fa/gateway/protocol).

  </Accordion>
</AccordionGroup>

## لاگ‌گیری و اشکال‌زدایی

<AccordionGroup>
  <Accordion title="لاگ‌ها کجا هستند؟">
    لاگ‌های فایل (ساختاریافته):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    می‌توانید از طریق `logging.file` یک مسیر پایدار تنظیم کنید. سطح لاگ فایل با `logging.level` کنترل می‌شود. جزئیات خروجی کنسول با `--verbose` و `logging.consoleLevel` کنترل می‌شود.

    سریع‌ترین tail لاگ:

    ```bash
    openclaw logs --follow
    ```

    لاگ‌های سرویس/ناظر (وقتی gateway از طریق launchd/systemd اجرا می‌شود):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` و `gateway.err.log` (پیش‌فرض: `~/.openclaw/logs/...`؛ پروفایل‌ها از `~/.openclaw-<profile>/logs/...` استفاده می‌کنند)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    برای اطلاعات بیشتر [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید.

  </Accordion>

  <Accordion title="چطور سرویس Gateway را شروع/متوقف/restart کنم؟">
    از helperهای gateway استفاده کنید:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر gateway را دستی اجرا می‌کنید، `openclaw gateway --force` می‌تواند پورت را پس بگیرد. [Gateway](/fa/gateway) را ببینید.

  </Accordion>

  <Accordion title="ترمینالم را در Windows بستم - چطور OpenClaw را restart کنم؟">
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

    **2) Windows بومی (پیشنهاد نمی‌شود):** Gateway مستقیما در Windows اجرا می‌شود.

    PowerShell را باز کنید و اجرا کنید:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر آن را دستی اجرا می‌کنید (بدون سرویس)، از این استفاده کنید:

    ```powershell
    openclaw gateway run
    ```

    مستندات: [Windows (WSL2)](/fa/platforms/windows)، [runbook سرویس Gateway](/fa/gateway).

  </Accordion>

  <Accordion title="Gateway بالا است اما پاسخ‌ها هرگز نمی‌رسند. چه چیزی را بررسی کنم؟">
    با یک بررسی سلامت سریع شروع کنید:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    علت‌های رایج:

    - احراز هویت مدل روی **میزبان Gateway** بارگذاری نشده است (`models status` را بررسی کنید).
    - جفت‌سازی/فهرست مجاز کانال جلوی پاسخ‌ها را می‌گیرد (پیکربندی کانال + گزارش‌ها را بررسی کنید).
    - وب‌چت/داشبورد بدون توکن درست باز است.

    اگر از راه دور هستید، تأیید کنید اتصال تونل/Tailscale برقرار است و
    وب‌سوکت Gateway در دسترس است.

    مستندات: [کانال‌ها](/fa/channels)، [عیب‌یابی](/fa/gateway/troubleshooting)، [دسترسی از راه دور](/fa/gateway/remote).

  </Accordion>

  <Accordion title='"قطع اتصال از Gateway: بدون دلیل" - حالا چه کار کنم؟'>
    این معمولاً یعنی رابط کاربری اتصال وب‌سوکت را از دست داده است. بررسی کنید:

    1. آیا Gateway در حال اجراست؟ `openclaw gateway status`
    2. آیا Gateway سالم است؟ `openclaw status`
    3. آیا رابط کاربری توکن درست را دارد؟ `openclaw dashboard`
    4. اگر از راه دور هستید، آیا پیوند تونل/Tailscale برقرار است؟

    سپس گزارش‌ها را دنبال کنید:

    ```bash
    openclaw logs --follow
    ```

    مستندات: [داشبورد](/fa/web/dashboard)، [دسترسی از راه دور](/fa/gateway/remote)، [عیب‌یابی](/fa/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands ناموفق می‌شود. چه چیزی را بررسی کنم؟">
    با گزارش‌ها و وضعیت کانال شروع کنید:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    سپس خطا را تطبیق دهید:

    - `BOT_COMMANDS_TOO_MUCH`: منوی Telegram ورودی‌های بیش از حدی دارد. OpenClaw از قبل آن را تا حد Telegram کوتاه می‌کند و با فرمان‌های کمتر دوباره تلاش می‌کند، اما هنوز باید بعضی ورودی‌های منو حذف شوند. فرمان‌های Plugin/skill/سفارشی را کاهش دهید، یا اگر به منو نیاز ندارید `channels.telegram.commands.native` را غیرفعال کنید.
    - `TypeError: fetch failed`، `Network request for 'setMyCommands' failed!`، یا خطاهای شبکه مشابه: اگر روی VPS هستید یا پشت پراکسی قرار دارید، تأیید کنید HTTPS خروجی مجاز است و DNS برای `api.telegram.org` کار می‌کند.

    اگر Gateway از راه دور است، مطمئن شوید گزارش‌ها را روی میزبان Gateway می‌بینید.

    مستندات: [Telegram](/fa/channels/telegram)، [عیب‌یابی کانال](/fa/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI هیچ خروجی نشان نمی‌دهد. چه چیزی را بررسی کنم؟">
    ابتدا تأیید کنید Gateway در دسترس است و عامل می‌تواند اجرا شود:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    در TUI، از `/status` برای دیدن وضعیت فعلی استفاده کنید. اگر انتظار پاسخ در یک کانال گفت‌وگو را دارید،
    مطمئن شوید تحویل فعال است (`/deliver on`).

    مستندات: [TUI](/fa/web/tui)، [فرمان‌های اسلش](/fa/tools/slash-commands).

  </Accordion>

  <Accordion title="چطور Gateway را کامل متوقف و سپس شروع کنم؟">
    اگر سرویس را نصب کرده‌اید:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    این کار **سرویس تحت نظارت** را متوقف/شروع می‌کند (launchd در macOS، systemd در Linux).
    زمانی از این استفاده کنید که Gateway به‌صورت daemon در پس‌زمینه اجرا می‌شود.

    اگر در پیش‌زمینه اجرا می‌کنید، با Ctrl-C متوقف کنید، سپس:

    ```bash
    openclaw gateway run
    ```

    مستندات: [راهنمای عملیاتی سرویس Gateway](/fa/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart در برابر openclaw gateway">
    - `openclaw gateway restart`: **سرویس پس‌زمینه** را دوباره راه‌اندازی می‌کند (launchd/systemd).
    - `openclaw gateway`: Gateway را برای این نشست ترمینال **در پیش‌زمینه** اجرا می‌کند.

    اگر سرویس را نصب کرده‌اید، از فرمان‌های Gateway استفاده کنید. زمانی از `openclaw gateway` استفاده کنید که
    یک اجرای یک‌باره و پیش‌زمینه می‌خواهید.

  </Accordion>

  <Accordion title="سریع‌ترین راه برای دریافت جزئیات بیشتر وقتی چیزی ناموفق می‌شود">
    Gateway را با `--verbose` شروع کنید تا جزئیات کنسول بیشتری بگیرید. سپس فایل گزارش را برای احراز هویت کانال، مسیریابی مدل، و خطاهای RPC بررسی کنید.
  </Accordion>
</AccordionGroup>

## رسانه و پیوست‌ها

<AccordionGroup>
  <Accordion title="Skills من یک تصویر/PDF تولید کرد، اما چیزی ارسال نشد">
    پیوست‌های خروجی از عامل باید شامل یک خط `MEDIA:<path-or-url>` باشند (در خطی مستقل). [راه‌اندازی دستیار OpenClaw](/fa/start/openclaw) و [ارسال عامل](/fa/tools/agent-send) را ببینید.

    ارسال با CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    همچنین بررسی کنید:

    - کانال مقصد از رسانه خروجی پشتیبانی می‌کند و توسط فهرست‌های مجاز مسدود نشده است.
    - فایل در محدوده اندازه ارائه‌دهنده است (اندازه تصاویر حداکثر تا 2048px تغییر می‌کند).
    - `tools.fs.workspaceOnly=true` ارسال‌های مسیر محلی را به فضای کاری، temp/media-store، و فایل‌های تأییدشده در سندباکس محدود نگه می‌دارد.
    - `tools.fs.workspaceOnly=false` اجازه می‌دهد `MEDIA:` فایل‌های محلی میزبان را که عامل از قبل می‌تواند بخواند ارسال کند، اما فقط برای رسانه به‌علاوه نوع‌های سند امن (تصویر، صدا، ویدئو، PDF، و سندهای Office). فایل‌های متن ساده و شبیه راز همچنان مسدود می‌شوند.

    [تصاویر](/fa/nodes/images) را ببینید.

  </Accordion>
</AccordionGroup>

## امنیت و کنترل دسترسی

<AccordionGroup>
  <Accordion title="آیا در معرض DMهای ورودی قرار دادن OpenClaw امن است؟">
    DMهای ورودی را ورودی نامطمئن در نظر بگیرید. پیش‌فرض‌ها برای کاهش ریسک طراحی شده‌اند:

    - رفتار پیش‌فرض در کانال‌هایی که DM دارند **جفت‌سازی** است:
      - فرستنده‌های ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ ربات پیامشان را پردازش نمی‌کند.
      - تأیید با: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - درخواست‌های در انتظار به **3 تا در هر کانال** محدود می‌شوند؛ اگر کدی نرسید `openclaw pairing list --channel <channel> [--account <id>]` را بررسی کنید.
    - عمومی باز کردن DMها به opt-in صریح نیاز دارد (`dmPolicy: "open"` و فهرست مجاز `"*"`).

    برای آشکار کردن سیاست‌های پرریسک DM، `openclaw doctor` را اجرا کنید.

  </Accordion>

  <Accordion title="آیا تزریق پرامپت فقط برای ربات‌های عمومی نگرانی است؟">
    خیر. تزریق پرامپت درباره **محتوای نامطمئن** است، نه فقط اینکه چه کسی می‌تواند به ربات DM بدهد.
    اگر دستیار شما محتوای خارجی می‌خواند (جست‌وجو/دریافت وب، صفحه‌های مرورگر، ایمیل‌ها،
    مستندات، پیوست‌ها، گزارش‌های چسبانده‌شده)، آن محتوا می‌تواند شامل دستورهایی باشد که تلاش می‌کنند
    مدل را منحرف کنند. این می‌تواند حتی وقتی **شما تنها فرستنده هستید** هم رخ دهد.

    بزرگ‌ترین ریسک زمانی است که ابزارها فعال‌اند: مدل می‌تواند فریب بخورد تا
    زمینه را نشت دهد یا از طرف شما ابزارها را فراخوانی کند. شعاع اثر را با این کارها کاهش دهید:

    - استفاده از یک عامل «خواننده» فقط‌خواندنی یا بدون ابزار برای خلاصه‌سازی محتوای نامطمئن
    - خاموش نگه داشتن `web_search` / `web_fetch` / `browser` برای عامل‌های ابزارفعال
    - نامطمئن در نظر گرفتن متن رمزگشایی‌شده فایل/سند نیز: OpenResponses
      `input_file` و استخراج پیوست رسانه هر دو متن استخراج‌شده را به‌جای عبور دادن متن خام فایل
      در نشانگرهای مرزی صریح محتوای خارجی می‌پیچند
    - سندباکس‌کردن و فهرست‌های مجاز سخت‌گیرانه ابزار

    جزئیات: [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="آیا ربات من باید ایمیل، حساب GitHub، یا شماره تلفن خودش را داشته باشد؟">
    بله، برای بیشتر راه‌اندازی‌ها. جدا کردن ربات با حساب‌ها و شماره تلفن‌های جداگانه
    اگر مشکلی پیش بیاید شعاع اثر را کاهش می‌دهد. این کار همچنین چرخاندن
    اعتبارنامه‌ها یا لغو دسترسی را بدون اثرگذاری بر حساب‌های شخصی شما آسان‌تر می‌کند.

    کوچک شروع کنید. فقط به ابزارها و حساب‌هایی که واقعاً نیاز دارید دسترسی بدهید، و
    بعداً در صورت نیاز گسترش دهید.

    مستندات: [امنیت](/fa/gateway/security)، [جفت‌سازی](/fa/channels/pairing).

  </Accordion>

  <Accordion title="آیا می‌توانم به آن روی پیامک‌هایم خودمختاری بدهم و آیا این امن است؟">
    ما خودمختاری کامل روی پیام‌های شخصی شما را توصیه **نمی‌کنیم**. امن‌ترین الگو این است:

    - DMها را در **حالت جفت‌سازی** یا یک فهرست مجاز محدود نگه دارید.
    - اگر می‌خواهید از طرف شما پیام بدهد، از یک **شماره یا حساب جداگانه** استفاده کنید.
    - بگذارید پیش‌نویس کند، سپس **قبل از ارسال تأیید کنید**.

    اگر می‌خواهید آزمایش کنید، این کار را روی یک حساب اختصاصی انجام دهید و آن را جدا نگه دارید. ببینید
    [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="آیا می‌توانم برای وظایف دستیار شخصی از مدل‌های ارزان‌تر استفاده کنم؟">
    بله، **اگر** عامل فقط گفت‌وگویی باشد و ورودی قابل اعتماد باشد. رده‌های کوچک‌تر
    در برابر ربایش دستور آسیب‌پذیرترند، پس برای عامل‌های ابزارفعال
    یا هنگام خواندن محتوای نامطمئن از آن‌ها پرهیز کنید. اگر باید از مدل کوچک‌تر استفاده کنید،
    ابزارها را قفل کنید و داخل سندباکس اجرا کنید. [امنیت](/fa/gateway/security) را ببینید.
  </Accordion>

  <Accordion title="در Telegram /start را اجرا کردم اما کد جفت‌سازی نگرفتم">
    کدهای جفت‌سازی **فقط** وقتی ارسال می‌شوند که فرستنده ناشناس به ربات پیام بدهد و
    `dmPolicy: "pairing"` فعال باشد. `/start` به‌تنهایی کد تولید نمی‌کند.

    درخواست‌های در انتظار را بررسی کنید:

    ```bash
    openclaw pairing list telegram
    ```

    اگر دسترسی فوری می‌خواهید، شناسه فرستنده خود را در فهرست مجاز قرار دهید یا برای آن حساب
    `dmPolicy: "open"` را تنظیم کنید.

  </Accordion>

  <Accordion title="WhatsApp: آیا به مخاطبان من پیام می‌دهد؟ جفت‌سازی چگونه کار می‌کند؟">
    خیر. سیاست پیش‌فرض DM در WhatsApp **جفت‌سازی** است. فرستنده‌های ناشناس فقط یک کد جفت‌سازی می‌گیرند و پیامشان **پردازش نمی‌شود**. OpenClaw فقط به گفت‌وگوهایی پاسخ می‌دهد که دریافت می‌کند یا به ارسال‌های صریحی که شما راه‌اندازی می‌کنید.

    تأیید جفت‌سازی با:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    فهرست درخواست‌های در انتظار:

    ```bash
    openclaw pairing list whatsapp
    ```

    درخواست شماره تلفن در جادوگر: از آن برای تنظیم **فهرست مجاز/مالک** شما استفاده می‌شود تا DMهای خودتان مجاز باشند. برای ارسال خودکار استفاده نمی‌شود. اگر روی شماره شخصی WhatsApp خود اجرا می‌کنید، از همان شماره استفاده کنید و `channels.whatsapp.selfChatMode` را فعال کنید.

  </Accordion>
</AccordionGroup>

## فرمان‌های گفت‌وگو، لغو وظایف، و «متوقف نمی‌شود»

<AccordionGroup>
  <Accordion title="چطور جلوی نمایش پیام‌های داخلی سیستم در گفت‌وگو را بگیرم؟">
    بیشتر پیام‌های داخلی یا ابزار فقط وقتی ظاهر می‌شوند که **verbose**، **trace**، یا **reasoning** برای آن نشست فعال باشد.

    در گفت‌وگویی که آن را می‌بینید رفع کنید:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    اگر هنوز پرنویز است، تنظیمات نشست را در رابط کاربری کنترل بررسی کنید و verbose
    را روی **ارث‌بری** بگذارید. همچنین تأیید کنید از پروفایل رباتی استفاده نمی‌کنید که در پیکربندی
    `verboseDefault` روی `on` تنظیم شده باشد.

    مستندات: [تفکر و verbose](/fa/tools/thinking)، [امنیت](/fa/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="چطور یک وظیفه در حال اجرا را متوقف/لغو کنم؟">
    هرکدام از این‌ها را **به‌عنوان پیام مستقل** ارسال کنید (بدون اسلش):

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

    بیشتر فرمان‌ها باید به‌عنوان پیام **مستقل** که با `/` شروع می‌شود ارسال شوند، اما چند میان‌بر (مثل `/status`) برای فرستنده‌های فهرست مجاز درون‌خطی هم کار می‌کنند.

  </Accordion>

  <Accordion title='چطور از Telegram پیام Discord بفرستم؟ ("پیام‌رسانی میان‌زمینه‌ای رد شد")'>
    OpenClaw به‌صورت پیش‌فرض پیام‌رسانی **میان ارائه‌دهنده‌ای** را مسدود می‌کند. اگر فراخوانی ابزار به
    Telegram متصل باشد، به Discord ارسال نمی‌کند مگر اینکه صراحتاً اجازه دهید.

    پیام‌رسانی میان ارائه‌دهنده‌ای را برای عامل فعال کنید:

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

  <Accordion title='چرا حس می‌شود ربات پیام‌های پشت‌سرهم سریع را "نادیده می‌گیرد"؟'>
    حالت صف کنترل می‌کند پیام‌های جدید چگونه با اجرای در جریان تعامل کنند. برای تغییر حالت‌ها از `/queue` استفاده کنید:

    - `steer` - همه هدایت‌های در انتظار را برای مرز بعدی مدل در اجرای فعلی صف می‌کند
    - `queue` - هدایت قدیمی، یکی‌یکی
    - `followup` - پیام‌ها را یکی‌یکی اجرا می‌کند
    - `collect` - پیام‌ها را دسته‌بندی می‌کند و یک‌بار پاسخ می‌دهد
    - `steer-backlog` - اکنون هدایت می‌کند، سپس backlog را پردازش می‌کند
    - `interrupt` - اجرای فعلی را لغو می‌کند و از نو شروع می‌کند

    حالت پیش‌فرض `steer` است. برای حالت‌های پیگیری می‌توانید گزینه‌هایی مانند `debounce:0.5s cap:25 drop:summarize` اضافه کنید. [صف فرمان](/fa/concepts/queue) و [صف هدایت](/fa/concepts/queue-steering) را ببینید.

  </Accordion>
</AccordionGroup>

## متفرقه

<AccordionGroup>
  <Accordion title='مدل پیش‌فرض Anthropic با یک کلید API چیست؟'>
    در OpenClaw، اعتبارنامه‌ها و انتخاب مدل جدا هستند. تنظیم `ANTHROPIC_API_KEY` (یا ذخیره کردن یک کلید API Anthropic در نمایه‌های احراز هویت) احراز هویت را فعال می‌کند، اما مدل پیش‌فرض واقعی همان چیزی است که در `agents.defaults.model.primary` پیکربندی می‌کنید (برای مثال، `anthropic/claude-sonnet-4-6` یا `anthropic/claude-opus-4-6`). اگر `No credentials found for profile "anthropic:default"` را می‌بینید، یعنی Gateway نتوانسته است اعتبارنامه‌های Anthropic را در `auth-profiles.json` مورد انتظار برای عاملی که در حال اجراست پیدا کند.
  </Accordion>
</AccordionGroup>

---

هنوز گیر کرده‌اید؟ در [Discord](https://discord.com/invite/clawd) بپرسید یا یک [گفت‌وگوی GitHub](https://github.com/openclaw/openclaw/discussions) باز کنید.

## مرتبط

- [پرسش‌های متداول اجرای نخست](/fa/help/faq-first-run) — نصب، راه‌اندازی اولیه، احراز هویت، اشتراک‌ها، خطاهای اولیه
- [پرسش‌های متداول مدل‌ها](/fa/help/faq-models) — انتخاب مدل، failover، نمایه‌های احراز هویت
- [عیب‌یابی](/fa/help/troubleshooting) — تریاژ بر اساس نشانه‌ها
