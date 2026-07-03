---
read_when:
    - پاسخ به پرسش‌های رایج پشتیبانی درباره راه‌اندازی، نصب، ورود اولیه یا زمان اجرا
    - بررسی اولیهٔ مشکلات گزارش‌شده توسط کاربر پیش از اشکال‌زدایی عمیق‌تر
summary: پرسش‌های متداول درباره راه‌اندازی، پیکربندی و استفاده از OpenClaw
title: پرسش‌های متداول
x-i18n:
    generated_at: "2026-07-03T17:33:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d55385d187c20dfce05022b76fcaa054c19fc22e46da66d4a24e2538dd95708
    source_path: help/faq.md
    workflow: 16
---

پاسخ‌های سریع به‌همراه عیب‌یابی عمیق‌تر برای راه‌اندازی‌های واقعی (توسعه محلی، VPS، چندعامله، کلیدهای OAuth/API، جایگزینی مدل هنگام خرابی). برای تشخیص‌های زمان اجرا، [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید. برای مرجع کامل پیکربندی، [پیکربندی](/fa/gateway/configuration) را ببینید.

## ۶۰ ثانیه اول وقتی چیزی خراب است

1. **وضعیت سریع (اولین بررسی)**

   ```bash
   openclaw status
   ```

   خلاصه محلی سریع: OS + به‌روزرسانی، دسترس‌پذیری gateway/service، عامل‌ها/نشست‌ها، پیکربندی provider + مشکلات زمان اجرا (وقتی gateway در دسترس باشد).

2. **گزارش قابل چسباندن (ایمن برای اشتراک‌گذاری)**

   ```bash
   openclaw status --all
   ```

   تشخیص فقط‌خواندنی با انتهای لاگ (توکن‌ها پوشانده می‌شوند).

3. **وضعیت Daemon + پورت**

   ```bash
   openclaw gateway status
   ```

   زمان اجرای supervisor در برابر دسترس‌پذیری RPC، URL هدف probe، و اینکه سرویس احتمالا از کدام پیکربندی استفاده کرده است را نشان می‌دهد.

4. **probeهای عمیق**

   ```bash
   openclaw status --deep
   ```

   یک probe زنده سلامت Gateway اجرا می‌کند، از جمله probeهای کانال وقتی پشتیبانی شوند
   (به یک Gateway در دسترس نیاز دارد). [Health](/fa/gateway/health) را ببینید.

5. **دنبال کردن آخرین لاگ**

   ```bash
   openclaw logs --follow
   ```

   اگر RPC از کار افتاده است، به این fallback کنید:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   لاگ‌های فایل از لاگ‌های سرویس جدا هستند؛ [Logging](/fa/logging) و [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید.

6. **اجرای doctor (تعمیرات)**

   ```bash
   openclaw doctor
   ```

   پیکربندی/وضعیت را تعمیر/مهاجرت می‌دهد + بررسی‌های سلامت را اجرا می‌کند. [Doctor](/fa/gateway/doctor) را ببینید.

7. **snapshot Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   از Gateway در حال اجرا یک snapshot کامل می‌خواهد (فقط WS). [Health](/fa/gateway/health) را ببینید.

## شروع سریع و راه‌اندازی اولین اجرا

پرسش‌وپاسخ اولین اجرا — نصب، onboard، مسیرهای auth، اشتراک‌ها، خرابی‌های اولیه —
در [پرسش‌های پرتکرار اولین اجرا](/fa/help/faq-first-run) قرار دارد.

## OpenClaw چیست؟

<AccordionGroup>
  <Accordion title="OpenClaw در یک پاراگراف چیست؟">
    OpenClaw یک دستیار هوش مصنوعی شخصی است که روی دستگاه‌های خودتان اجرا می‌کنید. روی سطح‌های پیام‌رسانی که از قبل استفاده می‌کنید پاسخ می‌دهد (WhatsApp، Telegram، Slack، Mattermost، Discord، Google Chat، Signal، iMessage، WebChat، و Pluginهای کانال همراه مانند QQ Bot) و همچنین می‌تواند روی پلتفرم‌های پشتیبانی‌شده صدا + یک Canvas زنده ارائه دهد. **Gateway** صفحه کنترل همیشه‌روشن است؛ دستیار همان محصول است.
  </Accordion>

  <Accordion title="ارزش پیشنهادی">
    OpenClaw «فقط یک wrapper برای Claude» نیست. این یک **صفحه کنترل محلی‌اول** است که به شما اجازه می‌دهد یک
    دستیار توانمند را روی **سخت‌افزار خودتان** اجرا کنید، از اپ‌های چتی که از قبل استفاده می‌کنید به آن دسترسی داشته باشید، با
    نشست‌های دارای state، حافظه، و ابزارها - بدون اینکه کنترل گردش‌کارهایتان را به یک
    SaaS میزبانی‌شده بسپارید.

    نکات برجسته:

    - **دستگاه‌های شما، داده‌های شما:** Gateway را هر جا که می‌خواهید اجرا کنید (Mac، Linux، VPS) و
      workspace + تاریخچه نشست را محلی نگه دارید.
    - **کانال‌های واقعی، نه یک sandbox وب:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc،
      به‌علاوه صدای موبایل و Canvas روی پلتفرم‌های پشتیبانی‌شده.
    - **مستقل از مدل:** از Anthropic، OpenAI، MiniMax، OpenRouter، و غیره، با مسیریابی
      و failover به‌ازای هر عامل استفاده کنید.
    - **گزینه فقط محلی:** مدل‌های محلی را اجرا کنید تا اگر خواستید **همه داده‌ها بتوانند روی دستگاه شما بمانند**.
    - **مسیریابی چندعامله:** عامل‌های جداگانه به‌ازای هر کانال، حساب، یا وظیفه، هرکدام با
      workspace و پیش‌فرض‌های خودش.
    - **متن‌باز و قابل هک:** بررسی، گسترش، و خودمیزبانی بدون قفل‌شدن به فروشنده.

    مستندات: [Gateway](/fa/gateway)، [کانال‌ها](/fa/channels)، [چندعامله](/fa/concepts/multi-agent)،
    [حافظه](/fa/concepts/memory).

  </Accordion>

  <Accordion title="همین حالا آن را راه‌اندازی کردم - اول چه کار کنم؟">
    پروژه‌های خوب برای شروع:

    - ساخت یک وب‌سایت (WordPress، Shopify، یا یک سایت static ساده).
    - نمونه‌سازی یک اپ موبایل (طرح کلی، صفحه‌ها، برنامه API).
    - سازمان‌دهی فایل‌ها و پوشه‌ها (پاک‌سازی، نام‌گذاری، برچسب‌گذاری).
    - اتصال Gmail و خودکارسازی خلاصه‌ها یا پیگیری‌ها.

    می‌تواند وظیفه‌های بزرگ را انجام دهد، اما وقتی آن‌ها را به فازها تقسیم کنید و
    از زیرعامل‌ها برای کار موازی استفاده کنید، بهترین عملکرد را دارد.

  </Accordion>

  <Accordion title="پنج کاربرد روزمره برتر OpenClaw چیست؟">
    بردهای روزمره معمولا این‌طور به نظر می‌رسند:

    - **خلاصه‌های شخصی:** خلاصه‌های inbox، تقویم، و خبرهایی که برایتان مهم است.
    - **پژوهش و پیش‌نویس:** پژوهش سریع، خلاصه‌ها، و پیش‌نویس‌های اولیه برای ایمیل‌ها یا docs.
    - **یادآورها و پیگیری‌ها:** تلنگرها و چک‌لیست‌های مبتنی بر Cron یا Heartbeat.
    - **خودکارسازی مرورگر:** پر کردن فرم‌ها، جمع‌آوری داده، و تکرار وظایف وب.
    - **هماهنگی بین دستگاه‌ها:** یک وظیفه را از گوشی خود بفرستید، بگذارید Gateway آن را روی یک سرور اجرا کند، و نتیجه را در چت تحویل بگیرید.

  </Accordion>

  <Accordion title="آیا OpenClaw می‌تواند برای lead gen، outreach، تبلیغات، و وبلاگ‌های یک SaaS کمک کند؟">
    بله، برای **پژوهش، qualification، و پیش‌نویس**. می‌تواند سایت‌ها را scan کند، فهرست‌های کوتاه بسازد،
    prospectها را خلاصه کند، و پیش‌نویس outreach یا متن تبلیغ بنویسد.

    برای **outreach یا اجرای تبلیغات**، انسان را در چرخه نگه دارید. از spam پرهیز کنید، قوانین محلی و
    سیاست‌های پلتفرم را رعایت کنید، و هر چیزی را قبل از ارسال بازبینی کنید. امن‌ترین الگو این است که
    OpenClaw پیش‌نویس کند و شما تأیید کنید.

    مستندات: [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="مزیت‌ها نسبت به Claude Code برای توسعه وب چیست؟">
    OpenClaw یک **دستیار شخصی** و لایه هماهنگی است، نه جایگزین IDE. برای سریع‌ترین چرخه کدنویسی مستقیم داخل یک repo از
    Claude Code یا Codex استفاده کنید. وقتی
    حافظه پایدار، دسترسی بین دستگاه‌ها، و ارکستراسیون ابزار می‌خواهید از OpenClaw استفاده کنید.

    مزیت‌ها:

    - **حافظه پایدار + workspace** در میان نشست‌ها
    - **دسترسی چندپلتفرمی** (WhatsApp، Telegram، TUI، WebChat)
    - **ارکستراسیون ابزار** (مرورگر، فایل‌ها، زمان‌بندی، hookها)
    - **Gateway همیشه‌روشن** (روی VPS اجرا کنید، از هر جا تعامل کنید)
    - **Nodeها** برای مرورگر/صفحه/دوربین/exec محلی

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills و خودکارسازی

<AccordionGroup>
  <Accordion title="چطور Skills را بدون dirty نگه داشتن repo سفارشی کنم؟">
    به‌جای ویرایش نسخه repo، از overrideهای مدیریت‌شده استفاده کنید. تغییرات خود را در `~/.openclaw/skills/<name>/SKILL.md` بگذارید (یا از طریق `skills.load.extraDirs` در `~/.openclaw/openclaw.json` یک پوشه اضافه کنید). تقدم این است: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → همراه → `skills.load.extraDirs`، بنابراین overrideهای مدیریت‌شده همچنان بدون دست زدن به git بر Skills همراه برتری دارند. اگر لازم است skill به‌صورت global نصب شود اما فقط برای بعضی عامل‌ها قابل مشاهده باشد، نسخه مشترک را در `~/.openclaw/skills` نگه دارید و visibility را با `agents.defaults.skills` و `agents.list[].skills` کنترل کنید. فقط ویرایش‌هایی که شایسته upstream هستند باید در repo باشند و به‌صورت PR ارسال شوند.
  </Accordion>

  <Accordion title="آیا می‌توانم Skills را از یک پوشه سفارشی load کنم؟">
    بله. دایرکتوری‌های اضافی را از طریق `skills.load.extraDirs` در `~/.openclaw/openclaw.json` اضافه کنید (پایین‌ترین تقدم). تقدم پیش‌فرض این است: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → همراه → `skills.load.extraDirs`. `clawhub` به‌طور پیش‌فرض در `./skills` نصب می‌کند، که OpenClaw در نشست بعدی آن را به‌عنوان `<workspace>/skills` در نظر می‌گیرد. اگر skill باید فقط برای عامل‌های خاصی قابل مشاهده باشد، آن را با `agents.defaults.skills` یا `agents.list[].skills` همراه کنید.
  </Accordion>

  <Accordion title="چطور می‌توانم برای وظیفه‌های مختلف از مدل‌ها یا تنظیمات متفاوت استفاده کنم؟">
    الگوهای پشتیبانی‌شده امروز این‌ها هستند:

    - **jobهای Cron**: jobهای ایزوله می‌توانند به‌ازای هر job یک override برای `model` تنظیم کنند.
    - **عامل‌ها**: وظیفه‌ها را به عامل‌های جداگانه با مدل‌های پیش‌فرض، سطح‌های thinking، و پارامترهای stream متفاوت مسیریابی کنید.
    - **تعویض در لحظه**: از `/model` برای تعویض مدل نشست جاری در هر زمان استفاده کنید.

    برای مثال، از یک مدل با تنظیمات متفاوت به‌ازای هر عامل استفاده کنید:

    ```json5
    {
      agents: {
        list: [
          {
            id: "coder",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "high",
            params: { temperature: 0.1 },
          },
          {
            id: "chat",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "off",
            params: { temperature: 0.8 },
          },
        ],
      },
    }
    ```

    پیش‌فرض‌های مشترک به‌ازای هر مدل را در `agents.defaults.models["provider/model"].params` بگذارید، سپس overrideهای ویژه هر عامل را در `agents.list[].params` تخت قرار دهید. برای همان مدل، entryهای تو در توی جداگانه `agents.list[].models["provider/model"].params` تعریف نکنید؛ `agents.list[].models` برای کاتالوگ مدل و overrideهای زمان اجرای هر عامل است.

    [jobهای Cron](/fa/automation/cron-jobs)، [مسیریابی چندعامله](/fa/concepts/multi-agent)، [پیکربندی](/fa/gateway/config-agents)، و [دستورهای Slash](/fa/tools/slash-commands) را ببینید.

  </Accordion>

  <Accordion title="bot هنگام انجام کار سنگین freeze می‌شود. چطور آن را offload کنم؟">
    از **زیرعامل‌ها** برای وظیفه‌های طولانی یا موازی استفاده کنید. زیرعامل‌ها در نشست خودشان اجرا می‌شوند،
    خلاصه برمی‌گردانند، و چت اصلی شما را responsive نگه می‌دارند.

    از bot خود بخواهید «برای این وظیفه یک زیرعامل spawn کند» یا از `/subagents` استفاده کنید.
    در چت از `/status` استفاده کنید تا ببینید Gateway همین حالا چه کار می‌کند (و آیا مشغول است یا نه).

    نکته توکن: وظیفه‌های طولانی و زیرعامل‌ها هر دو توکن مصرف می‌کنند. اگر هزینه مهم است، یک
    مدل ارزان‌تر برای زیرعامل‌ها از طریق `agents.defaults.subagents.model` تنظیم کنید.

    مستندات: [زیرعامل‌ها](/fa/tools/subagents)، [وظایف پس‌زمینه](/fa/automation/tasks).

  </Accordion>

  <Accordion title="نشست‌های زیرعامل وابسته به thread در Discord چگونه کار می‌کنند؟">
    از bindingهای thread استفاده کنید. می‌توانید یک thread در Discord را به یک زیرعامل یا هدف نشست bind کنید تا پیام‌های پیگیری در آن thread روی همان نشست bindشده بمانند.

    جریان پایه:

    - با `sessions_spawn` و با استفاده از `thread: true` spawn کنید (و به‌صورت اختیاری `mode: "session"` برای پیگیری پایدار).
    - یا به‌صورت دستی با `/focus <target>` bind کنید.
    - از `/agents` برای بررسی وضعیت binding استفاده کنید.
    - از `/session idle <duration|off>` و `/session max-age <duration|off>` برای کنترل auto-unfocus استفاده کنید.
    - از `/unfocus` برای جدا کردن thread استفاده کنید.

    پیکربندی لازم:

    - پیش‌فرض‌های global: `session.threadBindings.enabled`، `session.threadBindings.idleHours`، `session.threadBindings.maxAgeHours`.
    - overrideهای Discord: `channels.discord.threadBindings.enabled`، `channels.discord.threadBindings.idleHours`، `channels.discord.threadBindings.maxAgeHours`.
    - auto-bind هنگام spawn: `channels.discord.threadBindings.spawnSessions` به‌طور پیش‌فرض `true` است؛ برای غیرفعال کردن spawn نشست‌های وابسته به thread، آن را روی `false` بگذارید.

    مستندات: [زیرعامل‌ها](/fa/tools/subagents)، [Discord](/fa/channels/discord)، [مرجع پیکربندی](/fa/gateway/configuration-reference)، [دستورهای Slash](/fa/tools/slash-commands).

  </Accordion>

  <Accordion title="یک زیرعامل تمام شد، اما update تکمیل به جای اشتباه رفت یا اصلا post نشد. چه چیزی را بررسی کنم؟">
    ابتدا مسیر requester resolvedشده را بررسی کنید:

    - تحویل زیرعامل در حالت completion، وقتی thread یا مسیر گفت‌وگوی bindشده‌ای وجود داشته باشد، آن را ترجیح می‌دهد.
    - اگر origin تکمیل فقط یک کانال داشته باشد، OpenClaw به مسیر ذخیره‌شده نشست requester (`lastChannel` / `lastTo` / `lastAccountId`) fallback می‌کند تا تحویل مستقیم همچنان بتواند موفق شود.
    - اگر نه مسیر bindشده‌ای وجود داشته باشد و نه مسیر ذخیره‌شده قابل استفاده‌ای، تحویل مستقیم می‌تواند fail شود و نتیجه به‌جای post فوری در چت، به تحویل نشست در queue fallback می‌کند.
    - targetهای نامعتبر یا stale همچنان می‌توانند queue fallback یا خرابی نهایی تحویل را force کنند.
    - اگر آخرین پاسخ قابل مشاهده assistant در child دقیقا توکن خاموش `NO_REPLY` / `no_reply`، یا دقیقا `ANNOUNCE_SKIP` باشد، OpenClaw عمدا announce را سرکوب می‌کند به‌جای اینکه progress قدیمی‌تر stale را post کند.
    - خروجی tool/toolResult به متن نتیجه child ترفیع داده نمی‌شود؛ نتیجه همان آخرین پاسخ قابل مشاهده assistant در child است.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [Sub-agents](/fa/tools/subagents)، [Background Tasks](/fa/automation/tasks)، [Session Tools](/fa/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron یا یادآورها اجرا نمی‌شوند. چه چیزی را باید بررسی کنم؟">
    Cron داخل فرایند Gateway اجرا می‌شود. اگر Gateway به‌صورت پیوسته در حال اجرا نباشد،
    کارهای زمان‌بندی‌شده اجرا نخواهند شد.

    چک‌لیست:

    - تأیید کنید cron فعال است (`cron.enabled`) و `OPENCLAW_SKIP_CRON` تنظیم نشده است.
    - بررسی کنید Gateway به‌صورت 24/7 در حال اجراست (بدون خواب/راه‌اندازی مجدد).
    - تنظیمات منطقه زمانی کار را بررسی کنید (`--tz` در برابر منطقه زمانی میزبان).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [اتوماسیون](/fa/automation).

  </Accordion>

  <Accordion title="Cron اجرا شد، اما چیزی به کانال ارسال نشد. چرا؟">
    ابتدا حالت تحویل را بررسی کنید:

    - `--no-deliver` / `delivery.mode: "none"` یعنی انتظار نمی‌رود ارسال fallback توسط اجراکننده انجام شود.
    - هدف اعلام ناموجود یا نامعتبر (`channel` / `to`) یعنی اجراکننده تحویل خروجی را رد کرده است.
    - خطاهای احراز هویت کانال (`unauthorized`، `Forbidden`) یعنی اجراکننده تلاش کرده تحویل دهد، اما اعتبارنامه‌ها مانع شده‌اند.
    - نتیجه ایزوله و بی‌صدا (فقط `NO_REPLY` / `no_reply`) عمداً غیرقابل‌تحویل در نظر گرفته می‌شود، بنابراین اجراکننده تحویل fallback صف‌شده را هم سرکوب می‌کند.

    برای کارهای Cron ایزوله، وقتی مسیر چت در دسترس باشد، عامل همچنان می‌تواند مستقیماً با ابزار `message`
    ارسال کند. `--announce` فقط مسیر fallback اجراکننده را برای متن نهایی که عامل قبلاً ارسال نکرده کنترل می‌کند.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [Background Tasks](/fa/automation/tasks).

  </Accordion>

  <Accordion title="چرا یک اجرای Cron ایزوله مدل‌ها را تغییر داد یا یک بار تلاش مجدد کرد؟">
    این معمولاً مسیر زنده تغییر مدل است، نه زمان‌بندی تکراری.

    Cron ایزوله می‌تواند یک واگذاری مدل زمان اجرا را پایدار کند و وقتی اجرای فعال
    `LiveSessionModelSwitchError` پرتاب می‌کند، دوباره تلاش کند. تلاش مجدد ارائه‌دهنده/مدل تغییریافته را نگه می‌دارد،
    و اگر تغییر شامل بازنویسی پروفایل احراز هویت جدید باشد، Cron آن را هم پیش از تلاش مجدد پایدار می‌کند.

    قواعد انتخاب مرتبط:

    - بازنویسی مدل hook Gmail، در صورت کاربرد، ابتدا برنده می‌شود.
    - سپس `model` هر کار.
    - سپس هر بازنویسی مدل ذخیره‌شده برای نشست Cron.
    - سپس انتخاب عادی مدل عامل/پیش‌فرض.

    حلقه تلاش مجدد محدود است. پس از تلاش اولیه به‌علاوه 2 تلاش مجدد برای تغییر،
    Cron به‌جای حلقه بی‌پایان متوقف می‌شود.

    Debug:

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
    openclaw skills install @owner/<skill-slug>
    openclaw skills install @owner/<skill-slug> --version <version>
    openclaw skills install @owner/<skill-slug> --force
    openclaw skills install @owner/<skill-slug> --global
    openclaw skills update --all
    openclaw skills update --all --global
    openclaw skills list --eligible
    openclaw skills check
    ```

    `openclaw skills install` بومی به‌طور پیش‌فرض در دایرکتوری `skills/`
    فضای کاری فعال می‌نویسد. برای نصب در دایرکتوری مدیریت‌شده مشترک
    Skills برای همه عامل‌های محلی، `--global` را اضافه کنید. CLI جداگانه `clawhub` را
    فقط زمانی نصب کنید که می‌خواهید Skills خودتان را منتشر یا همگام‌سازی کنید. اگر می‌خواهید محدود کنید
    کدام عامل‌ها می‌توانند Skills مشترک را ببینند، از `agents.defaults.skills` یا `agents.list[].skills` استفاده کنید.

  </Accordion>

  <Accordion title="آیا OpenClaw می‌تواند کارها را طبق زمان‌بندی یا به‌صورت پیوسته در پس‌زمینه اجرا کند؟">
    بله. از زمان‌بند Gateway استفاده کنید:

    - **کارهای Cron** برای کارهای زمان‌بندی‌شده یا تکرارشونده (در راه‌اندازی‌های مجدد پایدار می‌مانند).
    - **Heartbeat** برای بررسی‌های دوره‌ای «نشست اصلی».
    - **کارهای ایزوله** برای عامل‌های خودمختار که خلاصه‌ها را پست می‌کنند یا به چت‌ها تحویل می‌دهند.

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [اتوماسیون](/fa/automation)،
    [Heartbeat](/fa/gateway/heartbeat).

  </Accordion>

  <Accordion title="آیا می‌توانم Skills مخصوص Apple macOS را از Linux اجرا کنم؟">
    نه مستقیماً. Skills مربوط به macOS با `metadata.openclaw.os` به‌علاوه باینری‌های لازم محدود می‌شوند، و Skills فقط زمانی در prompt سیستم ظاهر می‌شوند که روی **میزبان Gateway** واجد شرایط باشند. روی Linux، Skills فقط `darwin` (مانند `apple-notes`، `apple-reminders`، `things-mac`) بارگذاری نمی‌شوند مگر اینکه این محدودسازی را بازنویسی کنید.

    سه الگوی پشتیبانی‌شده دارید:

    **گزینه A - Gateway را روی Mac اجرا کنید (ساده‌ترین).**
    Gateway را جایی اجرا کنید که باینری‌های macOS وجود دارند، سپس از Linux در [حالت remote](#gateway-ports-already-running-and-remote-mode) یا از طریق Tailscale متصل شوید. Skills به‌طور عادی بارگذاری می‌شوند، چون میزبان Gateway، macOS است.

    **گزینه B - از یک Node macOS استفاده کنید (بدون SSH).**
    Gateway را روی Linux اجرا کنید، یک Node macOS (برنامه menubar) را pair کنید، و **Node Run Commands** را روی Mac روی "Always Ask" یا "Always Allow" تنظیم کنید. وقتی باینری‌های لازم روی Node وجود داشته باشند، OpenClaw می‌تواند Skills فقط macOS را واجد شرایط بداند. عامل آن Skills را از طریق ابزار `nodes` اجرا می‌کند. اگر "Always Ask" را انتخاب کنید، تأیید "Always Allow" در prompt آن فرمان را به allowlist اضافه می‌کند.

    **گزینه C - باینری‌های macOS را از طریق SSH proxy کنید (پیشرفته).**
    Gateway را روی Linux نگه دارید، اما کاری کنید باینری‌های CLI لازم به wrapperهای SSH resolve شوند که روی Mac اجرا می‌شوند. سپس Skill را بازنویسی کنید تا Linux را مجاز کند و واجد شرایط بماند.

    1. یک wrapper SSH برای باینری بسازید (مثال: `memo` برای Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. wrapper را روی `PATH` در میزبان Linux قرار دهید (برای مثال `~/bin/memo`).
    3. فراداده Skill را (در فضای کاری یا `~/.openclaw/skills`) بازنویسی کنید تا Linux را مجاز کند:

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
    امروز به‌صورت built-in وجود ندارد.

    گزینه‌ها:

    - **Skill / Plugin سفارشی:** برای دسترسی قابل‌اعتماد به API بهترین گزینه است (Notion/HeyGen هر دو API دارند).
    - **اتوماسیون مرورگر:** بدون کد کار می‌کند، اما کندتر و شکننده‌تر است.

    اگر می‌خواهید context را برای هر مشتری جدا نگه دارید (گردش‌کارهای آژانس)، یک الگوی ساده این است:

    - یک صفحه Notion برای هر مشتری (context + ترجیحات + کار فعال).
    - از عامل بخواهید در ابتدای یک نشست آن صفحه را fetch کند.

    اگر ادغام بومی می‌خواهید، یک درخواست ویژگی باز کنید یا یک Skill
    هدف‌گرفته به آن APIها بسازید.

    نصب Skills:

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    نصب‌های بومی در دایرکتوری `skills/` فضای کاری فعال قرار می‌گیرند. برای Skills مشترک بین همه عامل‌های محلی، از `openclaw skills install @owner/<skill-slug> --global` استفاده کنید (یا آن‌ها را به‌صورت دستی در `~/.openclaw/skills/<name>/SKILL.md` قرار دهید). اگر فقط برخی عامل‌ها باید یک نصب مشترک را ببینند، `agents.defaults.skills` یا `agents.list[].skills` را پیکربندی کنید. برخی Skills انتظار دارند باینری‌ها از طریق Homebrew نصب شده باشند؛ روی Linux یعنی Linuxbrew (ورودی FAQ مربوط به Homebrew Linux را در بالا ببینید). به [Skills](/fa/tools/skills)، [پیکربندی Skills](/fa/tools/skills-config)، و [ClawHub](/fa/clawhub) مراجعه کنید.

  </Accordion>

  <Accordion title="چگونه از Chrome موجودم که وارد آن شده‌ام با OpenClaw استفاده کنم؟">
    از پروفایل مرورگر built-in با نام `user` استفاده کنید، که از طریق Chrome DevTools MCP متصل می‌شود:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    اگر نام سفارشی می‌خواهید، یک پروفایل MCP صریح بسازید:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    این مسیر می‌تواند از مرورگر میزبان محلی یا یک Node مرورگر متصل استفاده کند. اگر Gateway جای دیگری اجرا می‌شود، یا یک میزبان Node روی ماشین مرورگر اجرا کنید یا به‌جای آن از CDP remote استفاده کنید.

    محدودیت‌های فعلی `existing-session` / `user`:

    - actionها مبتنی بر ref هستند، نه مبتنی بر CSS-selector
    - uploadها به `ref` / `inputRef` نیاز دارند و در حال حاضر هر بار از یک فایل پشتیبانی می‌کنند
    - `responsebody`، export PDF، رهگیری download، و actionهای batch هنوز به یک مرورگر مدیریت‌شده یا پروفایل CDP خام نیاز دارند

  </Accordion>
</AccordionGroup>

## Sandbox و حافظه

<AccordionGroup>
  <Accordion title="آیا مستند اختصاصی sandboxing وجود دارد؟">
    بله. [Sandboxing](/fa/gateway/sandboxing) را ببینید. برای setup مخصوص Docker (Gateway کامل در Docker یا imageهای sandbox)، [Docker](/fa/install/docker) را ببینید.
  </Accordion>

  <Accordion title="Docker محدود به نظر می‌رسد - چگونه قابلیت‌های کامل را فعال کنم؟">
    image پیش‌فرض با اولویت امنیت طراحی شده و به‌عنوان کاربر `node` اجرا می‌شود، بنابراین
    packageهای سیستم، Homebrew، یا مرورگرهای bundled را شامل نمی‌شود. برای setup کامل‌تر:

    - `/home/node` را با `OPENCLAW_HOME_VOLUME` پایدار کنید تا cacheها باقی بمانند.
    - dependencyهای سیستم را با `OPENCLAW_IMAGE_APT_PACKAGES` در image bake کنید.
    - مرورگرهای Playwright را از طریق CLI bundled نصب کنید:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` را تنظیم کنید و مطمئن شوید مسیر پایدار شده است.

    مستندات: [Docker](/fa/install/docker)، [مرورگر](/fa/tools/browser).

  </Accordion>

  <Accordion title="آیا می‌توانم DMها را شخصی نگه دارم اما گروه‌ها را با یک عامل عمومی/sandboxed کنم؟">
    بله - اگر ترافیک خصوصی شما **DMها** و ترافیک عمومی شما **گروه‌ها** باشد.

    از `agents.defaults.sandbox.mode: "non-main"` استفاده کنید تا نشست‌های گروه/کانال (کلیدهای غیر main) در backend sandbox پیکربندی‌شده اجرا شوند، در حالی که نشست DM اصلی روی میزبان باقی می‌ماند. اگر backend انتخاب نکنید، Docker پیش‌فرض است. سپس با `tools.sandbox.tools` محدود کنید چه ابزارهایی در نشست‌های sandboxed در دسترس باشند.

    راهنمای setup + پیکربندی نمونه: [گروه‌ها: DMهای شخصی + گروه‌های عمومی](/fa/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع کلیدی پیکربندی: [پیکربندی Gateway](/fa/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="چگونه یک پوشه میزبان را به sandbox bind کنم؟">
    `agents.defaults.sandbox.docker.binds` را روی `["host:path:mode"]` تنظیم کنید (مثلاً `"/home/user/src:/src:ro"`). bindهای global و هر عامل با هم merge می‌شوند؛ bindهای هر عامل وقتی `scope: "shared"` باشد نادیده گرفته می‌شوند. برای هر چیز حساس از `:ro` استفاده کنید و به یاد داشته باشید bindها دیواره‌های فایل‌سیستم sandbox را دور می‌زنند.

    OpenClaw منابع bind را هم در برابر مسیر نرمال‌شده و هم مسیر canonical که از طریق عمیق‌ترین جد موجود resolve شده اعتبارسنجی می‌کند. این یعنی فرارهای symlink-parent همچنان fail closed می‌شوند، حتی وقتی آخرین segment مسیر هنوز وجود ندارد، و بررسی‌های allowed-root همچنان پس از resolve شدن symlink اعمال می‌شوند.

    برای مثال‌ها و نکات ایمنی، [Sandboxing](/fa/gateway/sandboxing#custom-bind-mounts) و [Sandbox در برابر Tool Policy در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) را ببینید.

  </Accordion>

  <Accordion title="حافظه چگونه کار می‌کند؟">
    حافظه OpenClaw فقط فایل‌های Markdown در فضای کاری عامل است:

    - یادداشت‌های روزانه در `memory/YYYY-MM-DD.md`
    - یادداشت‌های بلندمدت curated در `MEMORY.md` (فقط نشست‌های اصلی/خصوصی)

    OpenClaw همچنین یک **silent pre-compaction memory flush** اجرا می‌کند تا به مدل یادآوری کند
    پیش از auto-compaction یادداشت‌های بادوام بنویسد. این فقط وقتی اجرا می‌شود که فضای کاری
    قابل نوشتن باشد (sandboxهای read-only آن را رد می‌کنند). [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>

  <Accordion title="حافظه مدام چیزها را فراموش می‌کند. چطور آن را ماندگار کنم؟">
    از بات بخواهید **واقعیت را در حافظه بنویسد**. یادداشت‌های بلندمدت به `MEMORY.md`
    تعلق دارند، و زمینه کوتاه‌مدت داخل `memory/YYYY-MM-DD.md` می‌رود.

    این هنوز حوزه‌ای است که در حال بهبود آن هستیم. یادآوری به مدل برای ذخیره خاطره‌ها کمک می‌کند؛
    خودش می‌داند چه کار کند. اگر همچنان فراموش می‌کند، بررسی کنید Gateway در هر اجرا از همان
    فضای کاری استفاده می‌کند.

    مستندات: [حافظه](/fa/concepts/memory)، [فضای کاری عامل](/fa/concepts/agent-workspace).

  </Accordion>

  <Accordion title="آیا حافظه برای همیشه ماندگار است؟ محدودیت‌ها چیست؟">
    فایل‌های حافظه روی دیسک قرار دارند و تا وقتی آن‌ها را حذف نکنید باقی می‌مانند. محدودیت، فضای
    ذخیره‌سازی شماست، نه مدل. **زمینه نشست** همچنان به پنجره زمینه مدل محدود است،
    بنابراین گفتگوهای طولانی می‌توانند فشرده یا کوتاه شوند. به همین دلیل
    جستجوی حافظه وجود دارد - فقط بخش‌های مرتبط را دوباره به زمینه برمی‌گرداند.

    مستندات: [حافظه](/fa/concepts/memory)، [زمینه](/fa/concepts/context).

  </Accordion>

  <Accordion title="آیا جستجوی معنایی حافظه به کلید API OpenAI نیاز دارد؟">
    فقط اگر از **تعبیه‌سازی‌های OpenAI** استفاده کنید. OAuth متعلق به Codex چت/تکمیل‌ها را پوشش می‌دهد و
    دسترسی به تعبیه‌سازی‌ها را **نمی‌دهد**، بنابراین **ورود با Codex (OAuth یا
    ورود CLI متعلق به Codex)** برای جستجوی معنایی حافظه کمکی نمی‌کند. تعبیه‌سازی‌های OpenAI
    همچنان به یک کلید API واقعی نیاز دارند (`OPENAI_API_KEY` یا `models.providers.openai.apiKey`).

    اگر ارائه‌دهنده‌ای را صریح تنظیم نکنید، OpenClaw از تعبیه‌سازی‌های OpenAI استفاده می‌کند. پیکربندی‌های قدیمی
    که هنوز `memorySearch.provider = "auto"` دارند نیز به OpenAI نگاشت می‌شوند.
    اگر هیچ کلید API متعلق به OpenAI در دسترس نباشد، جستجوی معنایی حافظه تا زمانی که
    یک کلید پیکربندی کنید یا ارائه‌دهنده دیگری را صریح انتخاب کنید، در دسترس نمی‌ماند.

    اگر ترجیح می‌دهید محلی بمانید، `memorySearch.provider = "local"` را تنظیم کنید (و در صورت تمایل
    `memorySearch.fallback = "none"`). اگر تعبیه‌سازی‌های Gemini را می‌خواهید، مقدار
    `memorySearch.provider = "gemini"` را تنظیم کنید و `GEMINI_API_KEY` (یا
    `memorySearch.remote.apiKey`) را ارائه دهید. ما از مدل‌های تعبیه‌سازی **OpenAI، سازگار با OpenAI، Gemini،
    Voyage، Mistral، Bedrock، Ollama، LM Studio، GitHub Copilot، DeepInfra، یا محلی**
    پشتیبانی می‌کنیم - برای جزئیات راه‌اندازی، [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>
</AccordionGroup>

## چیزها روی دیسک کجا قرار دارند

<AccordionGroup>
  <Accordion title="آیا همه داده‌های استفاده‌شده با OpenClaw به‌صورت محلی ذخیره می‌شوند؟">
    خیر - **وضعیت OpenClaw محلی است**، اما **سرویس‌های خارجی همچنان چیزهایی را که برایشان می‌فرستید می‌بینند**.

    - **به‌صورت پیش‌فرض محلی:** نشست‌ها، فایل‌های حافظه، پیکربندی، و فضای کاری روی میزبان Gateway قرار دارند
      (`~/.openclaw` + پوشه فضای کاری شما).
    - **به‌ناچار راه‌دور:** پیام‌هایی که به ارائه‌دهندگان مدل (Anthropic/OpenAI/غیره) می‌فرستید به
      APIهای آن‌ها می‌روند، و پلتفرم‌های چت (WhatsApp/Telegram/Slack/غیره) داده‌های پیام را روی
      سرورهای خود ذخیره می‌کنند.
    - **شما ردپا را کنترل می‌کنید:** استفاده از مدل‌های محلی اعلان‌ها را روی دستگاه شما نگه می‌دارد، اما ترافیک کانال
      همچنان از سرورهای همان کانال عبور می‌کند.

    مرتبط: [فضای کاری عامل](/fa/concepts/agent-workspace)، [حافظه](/fa/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw داده‌های خود را کجا ذخیره می‌کند؟">
    همه‌چیز زیر `$OPENCLAW_STATE_DIR` قرار دارد (پیش‌فرض: `~/.openclaw`):

    | مسیر                                                            | هدف                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | پیکربندی اصلی (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | واردسازی OAuth قدیمی (در اولین استفاده داخل پروفایل‌های احراز هویت کپی می‌شود)       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | پروفایل‌های احراز هویت (OAuth، کلیدهای API، و `keyRef`/`tokenRef` اختیاری)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | محتوای محرمانه اختیاری با پشتوانه فایل برای ارائه‌دهندگان SecretRef از نوع `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | فایل سازگاری قدیمی (ورودی‌های ایستای `api_key` پاک‌سازی شده‌اند)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | وضعیت ارائه‌دهنده (مثلاً `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | وضعیت هر عامل (agentDir + نشست‌ها)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | تاریخچه و وضعیت گفتگو (برای هر عامل)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | فراداده نشست (برای هر عامل)                                       |

    مسیر قدیمی تک‌عاملی: `~/.openclaw/agent/*` (توسط `openclaw doctor` مهاجرت داده می‌شود).

    **فضای کاری** شما (AGENTS.md، فایل‌های حافظه، skills، و غیره) جداست و از طریق `agents.defaults.workspace` پیکربندی می‌شود (پیش‌فرض: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md باید کجا قرار بگیرند؟">
    این فایل‌ها در **فضای کاری عامل** قرار می‌گیرند، نه در `~/.openclaw`.

    - **فضای کاری (برای هر عامل)**: `AGENTS.md`، `SOUL.md`، `IDENTITY.md`، `USER.md`،
      `MEMORY.md`، `memory/YYYY-MM-DD.md`، و `HEARTBEAT.md` اختیاری.
      ریشه حروف‌کوچک `memory.md` فقط ورودی تعمیر قدیمی است؛ وقتی هر دو فایل وجود داشته باشند،
      `openclaw doctor --fix` می‌تواند آن را در `MEMORY.md` ادغام کند.
    - **پوشه وضعیت (`~/.openclaw`)**: پیکربندی، وضعیت کانال/ارائه‌دهنده، پروفایل‌های احراز هویت، نشست‌ها، لاگ‌ها،
      و Skills مشترک (`~/.openclaw/skills`).

    فضای کاری پیش‌فرض `~/.openclaw/workspace` است و از این طریق قابل پیکربندی است:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    اگر بات پس از راه‌اندازی دوباره «فراموش می‌کند»، تأیید کنید Gateway در هر اجرا از همان
    فضای کاری استفاده می‌کند (و به یاد داشته باشید: حالت راه‌دور از فضای کاری **میزبان gateway**
    استفاده می‌کند، نه لپ‌تاپ محلی شما).

    نکته: اگر یک رفتار یا ترجیح ماندگار می‌خواهید، از بات بخواهید **آن را در
    AGENTS.md یا MEMORY.md بنویسد** به‌جای اینکه به تاریخچه چت تکیه کنید.

    [فضای کاری عامل](/fa/concepts/agent-workspace) و [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>

  <Accordion title="آیا می‌توانم SOUL.md را بزرگ‌تر کنم؟">
    بله. `SOUL.md` یکی از فایل‌های راه‌انداز فضای کاری است که به زمینه
    عامل تزریق می‌شود. محدودیت پیش‌فرض تزریق برای هر فایل `20000` نویسه است،
    و بودجه کل راه‌انداز در همه فایل‌ها `60000` نویسه است.

    پیش‌فرض‌های مشترک را در پیکربندی OpenClaw خود تغییر دهید:

    ```json5
    {
      agents: {
        defaults: {
          bootstrapMaxChars: 50000,
          bootstrapTotalMaxChars: 300000,
        },
      },
    }
    ```

    یا یک عامل را بازنویسی کنید:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            bootstrapMaxChars: 50000,
            bootstrapTotalMaxChars: 300000,
          },
        ],
      },
    }
    ```

    از `/context` برای بررسی اندازه‌های خام در برابر تزریق‌شده و اینکه آیا کوتاه‌سازی رخ داده است استفاده کنید.
    `SOUL.md` را روی صدا، موضع، و شخصیت متمرکز نگه دارید؛ قواعد عملیاتی را
    در `AGENTS.md` و واقعیت‌های ماندگار را در حافظه بگذارید.

    [زمینه](/fa/concepts/context) و [پیکربندی عامل](/fa/gateway/config-agents) را ببینید.

  </Accordion>

  <Accordion title="راهبرد پیشنهادی پشتیبان‌گیری">
    **فضای کاری عامل** خود را در یک مخزن git **خصوصی** قرار دهید و از آن در جایی
    خصوصی پشتیبان بگیرید (برای مثال GitHub خصوصی). این کار حافظه + فایل‌های AGENTS/SOUL/USER
    را ثبت می‌کند، و به شما اجازه می‌دهد بعداً «ذهن» دستیار را بازیابی کنید.

    هیچ‌چیزی زیر `~/.openclaw` را commit نکنید (اعتبارنامه‌ها، نشست‌ها، توکن‌ها، یا محتوای محرمانه رمزگذاری‌شده).
    اگر به بازیابی کامل نیاز دارید، هم از فضای کاری و هم از پوشه وضعیت
    جداگانه پشتیبان بگیرید (پرسش مهاجرت بالا را ببینید).

    مستندات: [فضای کاری عامل](/fa/concepts/agent-workspace).

  </Accordion>

  <Accordion title="چطور OpenClaw را به‌طور کامل حذف نصب کنم؟">
    راهنمای اختصاصی را ببینید: [حذف نصب](/fa/install/uninstall).
  </Accordion>

  <Accordion title="آیا عامل‌ها می‌توانند بیرون از فضای کاری کار کنند؟">
    بله. فضای کاری **cwd پیش‌فرض** و لنگر حافظه است، نه یک sandbox سخت‌گیرانه.
    مسیرهای نسبی داخل فضای کاری resolve می‌شوند، اما مسیرهای مطلق می‌توانند به مکان‌های دیگر
    میزبان دسترسی داشته باشند مگر اینکه sandboxing فعال باشد. اگر به جداسازی نیاز دارید، از
    [`agents.defaults.sandbox`](/fa/gateway/sandboxing) یا تنظیمات sandbox هر عامل استفاده کنید. اگر
    می‌خواهید یک مخزن پوشه کاری پیش‌فرض باشد، `workspace` همان عامل را
    به ریشه مخزن اشاره دهید. مخزن OpenClaw فقط کد منبع است؛
    فضای کاری را جدا نگه دارید مگر اینکه عمداً بخواهید عامل داخل آن کار کند.

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
    وضعیت نشست در مالکیت **میزبان gateway** است. اگر در حالت راه‌دور هستید، محل ذخیره نشستی که برایتان مهم است روی دستگاه راه‌دور است، نه لپ‌تاپ محلی شما. [مدیریت نشست](/fa/concepts/session) را ببینید.
  </Accordion>
</AccordionGroup>

## مبانی پیکربندی

<AccordionGroup>
  <Accordion title="قالب پیکربندی چیست؟ کجا قرار دارد؟">
    OpenClaw یک پیکربندی **JSON5** اختیاری را از `$OPENCLAW_CONFIG_PATH` می‌خواند (پیش‌فرض: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    اگر فایل وجود نداشته باشد، از پیش‌فرض‌های نسبتاً ایمن استفاده می‌کند (از جمله فضای کاری پیش‌فرض `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='من gateway.bind: "lan" (یا "tailnet") را تنظیم کردم و حالا چیزی گوش نمی‌دهد / UI می‌گوید مجاز نیست'>
    bindهای غیر local loopback **به یک مسیر احراز هویت معتبر gateway نیاز دارند**. در عمل یعنی:

    - احراز هویت با راز مشترک: توکن یا گذرواژه
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

    یادداشت‌ها:

    - `gateway.remote.token` / `.password` به‌تنهایی احراز هویت gateway محلی را فعال نمی‌کنند.
    - مسیرهای فراخوانی محلی فقط وقتی `gateway.auth.*` تنظیم نشده باشد می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند.
    - برای احراز هویت با گذرواژه، به‌جای آن `gateway.auth.mode: "password"` به‌همراه `gateway.auth.password` (یا `OPENCLAW_GATEWAY_PASSWORD`) را تنظیم کنید.
    - اگر `gateway.auth.token` / `gateway.auth.password` صریحاً از طریق SecretRef پیکربندی شده و resolve نشده باشد، resolution بسته و شکست‌خورده تمام می‌شود (بدون پوشاندن توسط fallback راه‌دور).
    - راه‌اندازی‌های Control UI با راز مشترک از طریق `connect.params.auth.token` یا `connect.params.auth.password` احراز هویت می‌کنند (در تنظیمات برنامه/UI ذخیره می‌شود). حالت‌های دارای هویت مثل Tailscale Serve یا `trusted-proxy` به‌جای آن از سرآیندهای درخواست استفاده می‌کنند. از قرار دادن رازهای مشترک در URLها پرهیز کنید.
    - با `gateway.auth.mode: "trusted-proxy"`، reverse proxyهای loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح و یک ورودی loopback در `gateway.trustedProxies` نیاز دارند.

  </Accordion>

  <Accordion title="چرا حالا روی localhost به توکن نیاز دارم؟">
    OpenClaw احراز هویت gateway را به‌صورت پیش‌فرض اعمال می‌کند، از جمله loopback. در مسیر پیش‌فرض معمولی، این یعنی احراز هویت توکنی: اگر هیچ مسیر احراز هویت صریحی پیکربندی نشده باشد، راه‌اندازی gateway به حالت توکن resolve می‌شود و برای همان راه‌اندازی یک توکن فقط-زمان-اجرا تولید می‌کند، بنابراین **کلاینت‌های WS محلی باید احراز هویت کنند**. وقتی کلاینت‌ها به یک راز پایدار در میان راه‌اندازی‌های دوباره نیاز دارند، `gateway.auth.token`، `gateway.auth.password`، `OPENCLAW_GATEWAY_TOKEN`، یا `OPENCLAW_GATEWAY_PASSWORD` را صریح پیکربندی کنید. این کار جلوی فراخوانی Gateway توسط فرایندهای محلی دیگر را می‌گیرد.

    اگر مسیر احراز هویت متفاوتی را ترجیح می‌دهید، می‌توانید صراحتاً حالت گذرواژه را انتخاب کنید (یا، برای پراکسی‌های معکوس آگاه از هویت، `trusted-proxy`). اگر **واقعاً** loopback باز می‌خواهید، `gateway.auth.mode: "none"` را صراحتاً در پیکربندی خود تنظیم کنید. Doctor هر زمان می‌تواند برای شما یک توکن تولید کند: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="آیا پس از تغییر پیکربندی باید راه‌اندازی مجدد کنم؟">
    Gateway پیکربندی را پایش می‌کند و از بارگذاری مجدد داغ پشتیبانی می‌کند:

    - `gateway.reload.mode: "hybrid"` (پیش‌فرض): تغییرات ایمن را داغ اعمال می‌کند، و برای موارد حیاتی راه‌اندازی مجدد می‌کند
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
    - اگر اصلاً بنر نمی‌خواهید، env `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

  </Accordion>

  <Accordion title="چگونه جست‌وجوی وب (و واکشی وب) را فعال کنم؟">
    `web_fetch` بدون کلید API کار می‌کند. `web_search` به ارائه‌دهنده انتخاب‌شده شما بستگی دارد:

    - ارائه‌دهندگان متکی به API مانند Brave، Exa، Firecrawl، Gemini، Kimi، MiniMax Search، Perplexity، و Tavily به راه‌اندازی کلید API معمول خود نیاز دارند.
    - Grok می‌تواند از xAI OAuth احراز هویت مدل دوباره استفاده کند، یا به `XAI_API_KEY` / پیکربندی جست‌وجوی وب Plugin برگردد.
    - Ollama Web Search بدون کلید است، اما از میزبان Ollama پیکربندی‌شده شما استفاده می‌کند و به `ollama signin` نیاز دارد.
    - DuckDuckGo بدون کلید است، اما یک یکپارچه‌سازی غیررسمی مبتنی بر HTML است.
    - SearXNG بدون کلید/خودمیزبان است؛ `SEARXNG_BASE_URL` یا `plugins.entries.searxng.config.webSearch.baseUrl` را پیکربندی کنید.

    **توصیه‌شده:** `openclaw configure --section web` را اجرا کنید و یک ارائه‌دهنده انتخاب کنید.
    جایگزین‌های محیطی:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: xAI OAuth، `XAI_API_KEY`
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

    پیکربندی جست‌وجوی وب ویژه ارائه‌دهنده اکنون زیر `plugins.entries.<plugin>.config.webSearch.*` قرار دارد.
    مسیرهای ارائه‌دهنده قدیمی `tools.web.search.*` هنوز موقتاً برای سازگاری بارگذاری می‌شوند، اما نباید برای پیکربندی‌های جدید استفاده شوند.
    پیکربندی fallback واکشی وب Firecrawl زیر `plugins.entries.firecrawl.config.webFetch.*` قرار دارد.

    یادداشت‌ها:

    - اگر از فهرست‌های مجاز استفاده می‌کنید، `web_search`/`web_fetch`/`x_search` یا `group:web` را اضافه کنید.
    - `web_fetch` به‌طور پیش‌فرض فعال است (مگر اینکه صراحتاً غیرفعال شده باشد).
    - اگر `tools.web.fetch.provider` حذف شده باشد، OpenClaw به‌طور خودکار نخستین ارائه‌دهنده fallback آماده واکشی را از اعتبارنامه‌های موجود تشخیص می‌دهد. Plugin رسمی Firecrawl آن fallback را فراهم می‌کند.
    - daemonها متغیرهای env را از `~/.openclaw/.env` (یا محیط سرویس) می‌خوانند.

    مستندات: [ابزارهای وب](/fa/tools/web).

  </Accordion>

  <Accordion title="config.apply پیکربندی من را پاک کرد. چگونه بازیابی کنم و از آن جلوگیری کنم؟">
    `config.apply` **کل پیکربندی** را جایگزین می‌کند. اگر یک شیء ناقص بفرستید، همه چیز دیگر حذف می‌شود.

    OpenClaw فعلی از بسیاری پاک‌نویسی‌های تصادفی جلوگیری می‌کند:

    - نوشتن‌های پیکربندی متعلق به OpenClaw، کل پیکربندی پس از تغییر را پیش از نوشتن اعتبارسنجی می‌کنند.
    - نوشتن‌های نامعتبر یا مخرب متعلق به OpenClaw رد می‌شوند و به‌صورت `openclaw.json.rejected.*` ذخیره می‌شوند.
    - اگر یک ویرایش مستقیم راه‌اندازی یا بارگذاری مجدد داغ را خراب کند، Gateway به‌صورت بسته شکست می‌خورد یا بارگذاری مجدد را رد می‌کند؛ `openclaw.json` را بازنویسی نمی‌کند.
    - `openclaw doctor --fix` مالک تعمیر است و می‌تواند آخرین نسخه سالم شناخته‌شده را بازیابی کند و در عین حال فایل ردشده را به‌صورت `openclaw.json.clobbered.*` ذخیره کند.

    بازیابی:

    - `openclaw logs --follow` را برای `Invalid config at`، `Config write rejected:`، یا `config reload skipped (invalid config)` بررسی کنید.
    - جدیدترین `openclaw.json.clobbered.*` یا `openclaw.json.rejected.*` را کنار پیکربندی فعال بررسی کنید.
    - `openclaw config validate` و `openclaw doctor --fix` را اجرا کنید.
    - فقط کلیدهای موردنظر را با `openclaw config set` یا `config.patch` برگردانید.
    - اگر آخرین نسخه سالم شناخته‌شده یا payload ردشده ندارید، از پشتیبان بازیابی کنید، یا `openclaw doctor` را دوباره اجرا کنید و کانال‌ها/مدل‌ها را دوباره پیکربندی کنید.
    - اگر این غیرمنتظره بود، یک باگ ثبت کنید و آخرین پیکربندی شناخته‌شده یا هر پشتیبان خود را ضمیمه کنید.
    - یک عامل کدنویسی محلی اغلب می‌تواند یک پیکربندی کارا را از لاگ‌ها یا تاریخچه بازسازی کند.

    پیشگیری:

    - برای تغییرات کوچک از `openclaw config set` استفاده کنید.
    - برای ویرایش‌های تعاملی از `openclaw configure` استفاده کنید.
    - وقتی از مسیر دقیق یا شکل فیلد مطمئن نیستید، ابتدا از `config.schema.lookup` استفاده کنید؛ این یک گره طرح‌واره کم‌عمق به‌همراه خلاصه‌های فرزند فوری برای drill-down برمی‌گرداند.
    - برای ویرایش‌های جزئی RPC از `config.patch` استفاده کنید؛ `config.apply` را فقط برای جایگزینی کامل پیکربندی نگه دارید.
    - اگر از ابزار عامل‌محور `gateway` از یک اجرای عامل استفاده می‌کنید، همچنان نوشتن در `tools.exec.ask` / `tools.exec.security` را رد می‌کند (از جمله نام‌های مستعار قدیمی `tools.bash.*` که به همان مسیرهای exec محافظت‌شده عادی‌سازی می‌شوند).

    مستندات: [پیکربندی](/fa/cli/config)، [پیکربندی کردن](/fa/cli/configure)، [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-rejected-invalid-config)، [Doctor](/fa/gateway/doctor).

  </Accordion>

  <Accordion title="چگونه یک Gateway مرکزی را با workerهای تخصصی در میان دستگاه‌ها اجرا کنم؟">
    الگوی رایج **یک Gateway** (مثلاً Raspberry Pi) به‌علاوه **nodeها** و **عامل‌ها** است:

    - **Gateway (مرکزی):** مالک کانال‌ها (Signal/WhatsApp)، مسیریابی، و sessionها است.
    - **Nodeها (دستگاه‌ها):** Macها/iOS/Android به‌عنوان دستگاه‌های جانبی متصل می‌شوند و ابزارهای محلی (`system.run`، `canvas`، `camera`) را در معرض استفاده قرار می‌دهند.
    - **عامل‌ها (workerها):** مغزها/فضاهای کاری جداگانه برای نقش‌های ویژه (مثلاً "Hetzner ops"، "Personal data").
    - **زیرعامل‌ها:** وقتی موازی‌سازی می‌خواهید، کار پس‌زمینه را از یک عامل اصلی spawn کنید.
    - **TUI:** به Gateway وصل شوید و بین عامل‌ها/sessionها جابه‌جا شوید.

    مستندات: [Nodeها](/fa/nodes)، [دسترسی از راه دور](/fa/gateway/remote)، [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [زیرعامل‌ها](/fa/tools/subagents)، [TUI](/fa/web/tui).

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

    پیش‌فرض `false` (headful) است. Headless در بعضی سایت‌ها بیشتر احتمال دارد بررسی‌های ضدبات را فعال کند. [مرورگر](/fa/tools/browser) را ببینید.

    Headless از **همان موتور Chromium** استفاده می‌کند و برای بیشتر خودکارسازی‌ها (فرم‌ها، کلیک‌ها، scraping، ورودها) کار می‌کند. تفاوت‌های اصلی:

    - پنجره مرورگر قابل‌مشاهده‌ای وجود ندارد (اگر تصویر لازم دارید از screenshotها استفاده کنید).
    - بعضی سایت‌ها در حالت headless درباره خودکارسازی سخت‌گیرترند (CAPTCHAها، ضدبات).
      برای مثال، X/Twitter اغلب sessionهای headless را مسدود می‌کند.

  </Accordion>

  <Accordion title="چگونه از Brave برای کنترل مرورگر استفاده کنم؟">
    `browser.executablePath` را روی binary مربوط به Brave خود (یا هر مرورگر مبتنی بر Chromium) تنظیم کنید و Gateway را راه‌اندازی مجدد کنید.
    نمونه‌های کامل پیکربندی را در [مرورگر](/fa/tools/browser#use-brave-or-another-chromium-based-browser) ببینید.
  </Accordion>
</AccordionGroup>

## Gatewayها و nodeهای راه دور

<AccordionGroup>
  <Accordion title="دستورها چگونه بین Telegram، gateway، و nodeها منتشر می‌شوند؟">
    پیام‌های Telegram توسط **gateway** پردازش می‌شوند. gateway عامل را اجرا می‌کند و فقط زمانی که یک ابزار node لازم باشد، nodeها را از طریق **Gateway WebSocket** فراخوانی می‌کند:

    Telegram → Gateway → عامل → `node.*` → Node → Gateway → Telegram

    Nodeها ترافیک ورودی ارائه‌دهنده را نمی‌بینند؛ فقط فراخوانی‌های RPC مربوط به node را دریافت می‌کنند.

  </Accordion>

  <Accordion title="اگر Gateway از راه دور میزبانی شود، عامل من چگونه می‌تواند به رایانه‌ام دسترسی داشته باشد؟">
    پاسخ کوتاه: **رایانه خود را به‌عنوان یک node جفت کنید**. Gateway جای دیگری اجرا می‌شود، اما می‌تواند ابزارهای `node.*` (صفحه‌نمایش، دوربین، سیستم) را روی ماشین محلی شما از طریق Gateway WebSocket فراخوانی کند.

    راه‌اندازی معمول:

    1. Gateway را روی میزبان همیشه‌روشن (VPS/سرور خانگی) اجرا کنید.
    2. میزبان Gateway + رایانه خود را روی همان tailnet قرار دهید.
    3. مطمئن شوید Gateway WS قابل دسترسی است (bind در tailnet یا تونل SSH).
    4. برنامه macOS را به‌صورت محلی باز کنید و در حالت **Remote over SSH** (یا tailnet مستقیم)
       متصل شوید تا بتواند به‌عنوان node ثبت شود.
    5. node را روی Gateway تأیید کنید:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    هیچ پل TCP جداگانه‌ای لازم نیست؛ nodeها از طریق Gateway WebSocket متصل می‌شوند.

    یادآوری امنیتی: جفت‌سازی یک node macOS امکان `system.run` را روی آن ماشین فراهم می‌کند. فقط
    دستگاه‌هایی را جفت کنید که به آن‌ها اعتماد دارید، و [امنیت](/fa/gateway/security) را مرور کنید.

    مستندات: [Nodeها](/fa/nodes)، [پروتکل Gateway](/fa/gateway/protocol)، [حالت راه دور macOS](/fa/platforms/mac/remote)، [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="Tailscale وصل است اما پاسخی دریافت نمی‌کنم. حالا چه کنم؟">
    موارد پایه را بررسی کنید:

    - Gateway در حال اجرا است: `openclaw gateway status`
    - سلامت Gateway: `openclaw status`
    - سلامت کانال: `openclaw channels status`

    سپس احراز هویت و مسیریابی را بررسی کنید:

    - اگر از Tailscale Serve استفاده می‌کنید، مطمئن شوید `gateway.auth.allowTailscale` درست تنظیم شده است.
    - اگر از طریق تونل SSH متصل می‌شوید، تأیید کنید تونل محلی فعال است و به پورت درست اشاره می‌کند.
    - تأیید کنید فهرست‌های مجاز شما (DM یا گروه) حساب شما را شامل می‌شوند.

    مستندات: [Tailscale](/fa/gateway/tailscale)، [دسترسی از راه دور](/fa/gateway/remote)، [کانال‌ها](/fa/channels).

  </Accordion>

  <Accordion title="آیا دو نمونه OpenClaw می‌توانند با هم صحبت کنند (محلی + VPS)؟">
    بله. پل داخلی "bot-to-bot" وجود ندارد، اما می‌توانید آن را به چند روش قابل‌اعتماد سیم‌کشی کنید:

    **ساده‌ترین:** از یک کانال گفت‌وگوی معمولی استفاده کنید که هر دو bot بتوانند به آن دسترسی داشته باشند (Telegram/Slack/WhatsApp).
    کاری کنید Bot A پیامی به Bot B بفرستد، سپس بگذارید Bot B طبق معمول پاسخ دهد.

    **پل CLI (عمومی):** اسکریپتی اجرا کنید که Gateway دیگر را با
    `openclaw agent --message ... --deliver` فراخوانی کند، و گفت‌وگویی را هدف بگیرد که bot دیگر در آن گوش می‌دهد. اگر یک bot روی VPS راه دور است، CLI خود را از طریق SSH/Tailscale به آن Gateway راه دور
    اشاره دهید ([دسترسی از راه دور](/fa/gateway/remote) را ببینید).

    الگوی نمونه (از ماشینی اجرا کنید که بتواند به Gateway هدف برسد):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نکته: یک guardrail اضافه کنید تا دو bot بی‌پایان loop نزنند (فقط با mention، فهرست‌های مجاز کانال،
    یا قانون "به پیام‌های bot پاسخ نده").

    مستندات: [دسترسی از راه دور](/fa/gateway/remote)، [CLI عامل](/fa/cli/agent)، [ارسال عامل](/fa/tools/agent-send).

  </Accordion>

  <Accordion title="آیا برای چند عامل به VPSهای جداگانه نیاز دارم؟">
    خیر. یک Gateway می‌تواند چند عامل را میزبانی کند، هرکدام با فضای کاری، پیش‌فرض‌های مدل،
    و مسیریابی خودش. این راه‌اندازی معمول است و بسیار ارزان‌تر و ساده‌تر از اجرای
    یک VPS برای هر عامل است.

    فقط زمانی از VPSهای جداگانه استفاده کنید که به جداسازی سخت (مرزهای امنیتی) یا پیکربندی‌های بسیار
    متفاوتی نیاز دارید که نمی‌خواهید به اشتراک بگذارید. در غیر این صورت، یک Gateway نگه دارید و
    از چند عامل یا زیرعامل استفاده کنید.

  </Accordion>

  <Accordion title="آیا استفاده از Node روی لپ‌تاپ شخصی من به‌جای SSH از یک VPS مزیتی دارد؟">
    بله - Nodeها روش درجه‌اول برای دسترسی به لپ‌تاپ شما از یک Gateway راه‌دور هستند و
    چیزی فراتر از دسترسی شِل را فعال می‌کنند. Gateway روی macOS/Linux (و Windows از طریق WSL2) اجرا می‌شود و
    سبک است (یک VPS کوچک یا دستگاهی در حد Raspberry Pi کافی است؛ ۴ گیگابایت RAM کاملاً بس است)، بنابراین یک
    چیدمان رایج، یک میزبان همیشه‌روشن به‌همراه لپ‌تاپ شما به‌عنوان Node است.

    - **نیازی به SSH ورودی نیست.** Nodeها به WebSocket Gateway وصل می‌شوند و از جفت‌سازی دستگاه استفاده می‌کنند.
    - **کنترل‌های اجرای امن‌تر.** `system.run` روی همان لپ‌تاپ با فهرست‌های مجاز/تأییدیه‌های Node محدود می‌شود.
    - **ابزارهای دستگاه بیشتر.** Nodeها علاوه بر `system.run`، ابزارهای `canvas`، `camera` و `screen` را ارائه می‌کنند.
    - **اتوماسیون مرورگر محلی.** Gateway را روی یک VPS نگه دارید، اما Chrome را به‌صورت محلی از طریق میزبان Node روی لپ‌تاپ اجرا کنید، یا از طریق Chrome MCP به Chrome محلی روی میزبان متصل شوید.

    SSH برای دسترسی موردی به شِل مناسب است، اما Nodeها برای گردش‌کارهای مداوم عامل و
    اتوماسیون دستگاه ساده‌ترند.

    مستندات: [Nodeها](/fa/nodes)، [CLI Nodeها](/fa/cli/nodes)، [مرورگر](/fa/tools/browser).

  </Accordion>

  <Accordion title="آیا Nodeها یک سرویس Gateway اجرا می‌کنند؟">
    خیر. مگر اینکه عمداً پروفایل‌های ایزوله اجرا کنید، فقط **یک gateway** باید روی هر میزبان اجرا شود (ببینید [چند Gateway](/fa/gateway/multiple-gateways)). Nodeها پیرامون‌هایی هستند که به
    gateway وصل می‌شوند (Nodeهای iOS/Android، یا «حالت Node» در macOS در برنامه نوار منو). برای میزبان‌های Node
    بدون رابط گرافیکی و کنترل CLI، [CLI میزبان Node](/fa/cli/node) را ببینید.

    برای تغییرات سطح `gateway`، `discovery` و Pluginهای میزبانی‌شده، راه‌اندازی مجدد کامل لازم است.

  </Accordion>

  <Accordion title="آیا راهی از طریق API / RPC برای اعمال پیکربندی وجود دارد؟">
    بله.

    - `config.schema.lookup`: پیش از نوشتن، یک زیردرخت پیکربندی را همراه با گره سطحی schema آن، راهنمای UI منطبق، و خلاصه‌های فرزندان مستقیم بررسی کنید
    - `config.get`: snapshot + hash فعلی را دریافت کنید
    - `config.patch`: به‌روزرسانی جزئی امن (برای بیشتر ویرایش‌های RPC ترجیح داده می‌شود)؛ هرجا ممکن باشد hot-reload می‌کند و هرجا لازم باشد راه‌اندازی مجدد انجام می‌دهد
    - `config.apply`: پیکربندی کامل را اعتبارسنجی + جایگزین می‌کند؛ هرجا ممکن باشد hot-reload می‌کند و هرجا لازم باشد راه‌اندازی مجدد انجام می‌دهد
    - ابزار runtime روبه‌عامل `gateway` همچنان از بازنویسی `tools.exec.ask` / `tools.exec.security` خودداری می‌کند؛ aliasهای قدیمی `tools.bash.*` به همان مسیرهای محافظت‌شده exec نرمال‌سازی می‌شوند

  </Accordion>

  <Accordion title="حداقل پیکربندی معقول برای نصب اول">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    این کار workspace شما را تنظیم می‌کند و محدود می‌کند چه کسی می‌تواند bot را فعال کند.

  </Accordion>

  <Accordion title="چطور Tailscale را روی یک VPS راه‌اندازی کنم و از Mac خود وصل شوم؟">
    مراحل حداقلی:

    1. **نصب + ورود روی VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **نصب + ورود روی Mac**
       - از برنامه Tailscale استفاده کنید و به همان tailnet وارد شوید.
    3. **فعال‌کردن MagicDNS (توصیه‌شده)**
       - در کنسول مدیریتی Tailscale، MagicDNS را فعال کنید تا VPS نام پایداری داشته باشد.
    4. **استفاده از نام میزبان tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    اگر Control UI را بدون SSH می‌خواهید، از Tailscale Serve روی VPS استفاده کنید:

    ```bash
    openclaw gateway --tailscale serve
    ```

    این کار gateway را به loopback متصل نگه می‌دارد و HTTPS را از طریق Tailscale در دسترس قرار می‌دهد. [Tailscale](/fa/gateway/tailscale) را ببینید.

  </Accordion>

  <Accordion title="چطور یک Node مک را به یک Gateway راه‌دور (Tailscale Serve) وصل کنم؟">
    Serve، **Control UI + WS مربوط به Gateway** را در دسترس قرار می‌دهد. Nodeها از طریق همان endpoint مربوط به Gateway WS وصل می‌شوند.

    چیدمان پیشنهادی:

    1. **مطمئن شوید VPS + Mac روی یک tailnet هستند**.
    2. **از برنامه macOS در حالت راه‌دور استفاده کنید** (هدف SSH می‌تواند نام میزبان tailnet باشد).
       برنامه پورت Gateway را تونل می‌کند و به‌عنوان Node وصل می‌شود.
    3. **Node را روی gateway تأیید کنید**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    مستندات: [پروتکل Gateway](/fa/gateway/protocol)، [کشف](/fa/gateway/discovery)، [حالت راه‌دور macOS](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="آیا باید روی لپ‌تاپ دوم نصب کنم یا فقط یک Node اضافه کنم؟">
    اگر فقط به **ابزارهای محلی** (screen/camera/exec) روی لپ‌تاپ دوم نیاز دارید، آن را به‌عنوان
    **Node** اضافه کنید. این کار یک Gateway واحد را حفظ می‌کند و از پیکربندی تکراری جلوگیری می‌کند. ابزارهای Node محلی
    در حال حاضر فقط برای macOS هستند، اما قصد داریم آن‌ها را به سیستم‌عامل‌های دیگر هم گسترش دهیم.

    فقط وقتی Gateway دوم نصب کنید که به **ایزوله‌سازی سخت** یا دو bot کاملاً جدا نیاز دارید.

    مستندات: [Nodeها](/fa/nodes)، [CLI Nodeها](/fa/cli/nodes)، [چند Gateway](/fa/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغیرهای محیطی و بارگذاری .env

<AccordionGroup>
  <Accordion title="OpenClaw متغیرهای محیطی را چگونه بارگذاری می‌کند؟">
    OpenClaw متغیرهای محیطی را از فرایند والد (shell، launchd/systemd، CI و غیره) می‌خواند و علاوه بر آن بارگذاری می‌کند:

    - `.env` از دایرکتوری کاری فعلی
    - یک fallback سراسری `.env` از `~/.openclaw/.env` (یا همان `$OPENCLAW_STATE_DIR/.env`)

    هیچ‌کدام از فایل‌های `.env` متغیرهای محیطی موجود را override نمی‌کنند.
    متغیرهای credential ارائه‌دهنده برای workspace `.env` یک استثنا هستند: کلیدهایی مانند
    `GEMINI_API_KEY`، `XAI_API_KEY` یا `MISTRAL_API_KEY` از workspace
    `.env` نادیده گرفته می‌شوند و باید در محیط فرایند، `~/.openclaw/.env` یا `env` پیکربندی قرار بگیرند.

    همچنین می‌توانید متغیرهای محیطی inline را در پیکربندی تعریف کنید (فقط در صورتی اعمال می‌شوند که در env فرایند وجود نداشته باشند):

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

    1. کلیدهای جاافتاده را در `~/.openclaw/.env` بگذارید تا حتی وقتی سرویس env شِل شما را به ارث نمی‌برد، خوانده شوند.
    2. واردسازی شِل را فعال کنید (سهولت opt-in):

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

    این کار شِل login شما را اجرا می‌کند و فقط کلیدهای موردانتظارِ موجود‌نبودن را وارد می‌کند (هرگز override نمی‌کند). معادل‌های متغیر محیطی:
    `OPENCLAW_LOAD_SHELL_ENV=1`، `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN را تنظیم کردم، اما وضعیت مدل‌ها "Shell env: off." را نشان می‌دهد. چرا؟'>
    `openclaw models status` گزارش می‌دهد که آیا **واردسازی env شِل** فعال است یا نه. "Shell env: off"
    به این معنی **نیست** که متغیرهای محیطی شما وجود ندارند - فقط یعنی OpenClaw شِل login
    شما را به‌طور خودکار بارگذاری نمی‌کند.

    اگر Gateway به‌عنوان سرویس اجرا می‌شود (launchd/systemd)، محیط شِل شما را
    به ارث نمی‌برد. با یکی از این کارها اصلاح کنید:

    1. token را در `~/.openclaw/.env` بگذارید:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. یا واردسازی شِل را فعال کنید (`env.shellEnv.enabled: true`).
    3. یا آن را به بلوک `env` پیکربندی خود اضافه کنید (فقط اگر موجود نباشد اعمال می‌شود).

    سپس gateway را راه‌اندازی مجدد کنید و دوباره بررسی کنید:

    ```bash
    openclaw models status
    ```

    tokenهای Copilot از `COPILOT_GITHUB_TOKEN` خوانده می‌شوند (همچنین `GH_TOKEN` / `GITHUB_TOKEN`).
    [/concepts/model-providers](/fa/concepts/model-providers) و [/environment](/fa/help/environment) را ببینید.

  </Accordion>
</AccordionGroup>

## نشست‌ها و چند گفت‌وگو

<AccordionGroup>
  <Accordion title="چطور یک گفت‌وگوی تازه شروع کنم؟">
    `/new` یا `/reset` را به‌عنوان یک پیام مستقل ارسال کنید. [مدیریت نشست](/fa/concepts/session) را ببینید.
  </Accordion>

  <Accordion title="اگر هرگز /new نفرستم، نشست‌ها خودکار reset می‌شوند؟">
    نشست‌ها می‌توانند پس از `session.idleMinutes` منقضی شوند، اما این قابلیت **به‌صورت پیش‌فرض غیرفعال است** (پیش‌فرض **0**).
    برای فعال‌کردن انقضای بیکاری، آن را روی یک مقدار مثبت تنظیم کنید. وقتی فعال باشد، **پیام بعدی**
    پس از دوره بیکاری، برای آن کلید chat یک شناسه نشست تازه شروع می‌کند.
    این کار transcriptها را حذف نمی‌کند - فقط یک نشست جدید شروع می‌کند.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="آیا راهی هست که تیمی از نمونه‌های OpenClaw بسازم (یک CEO و چندین عامل)؟">
    بله، از طریق **مسیریابی چندعاملی** و **زیرعامل‌ها**. می‌توانید یک عامل هماهنگ‌کننده
    و چند عامل worker با workspaceها و مدل‌های خودشان بسازید.

    با این حال، بهتر است این را یک **آزمایش سرگرم‌کننده** در نظر بگیرید. مصرف token آن زیاد است و اغلب
    از استفاده از یک bot با نشست‌های جداگانه کم‌بازده‌تر است. مدل معمولی که تصور می‌کنیم
    یک bot است که با آن صحبت می‌کنید، با نشست‌های متفاوت برای کار موازی. همان
    bot نیز می‌تواند در صورت نیاز زیرعامل‌ها را spawn کند.

    مستندات: [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [زیرعامل‌ها](/fa/tools/subagents)، [CLI عامل‌ها](/fa/cli/agents).

  </Accordion>

  <Accordion title="چرا context وسط کار کوتاه شد؟ چطور از آن جلوگیری کنم؟">
    context نشست به پنجره مدل محدود است. chatهای طولانی، خروجی‌های بزرگ ابزار، یا تعداد زیادی
    فایل می‌توانند Compaction یا کوتاه‌سازی را فعال کنند.

    چیزهایی که کمک می‌کنند:

    - از bot بخواهید وضعیت فعلی را خلاصه کند و آن را در یک فایل بنویسد.
    - پیش از کارهای طولانی از `/compact` استفاده کنید، و هنگام تغییر موضوع از `/new`.
    - context مهم را در workspace نگه دارید و از bot بخواهید دوباره آن را بخواند.
    - برای کارهای طولانی یا موازی از زیرعامل‌ها استفاده کنید تا chat اصلی کوچک‌تر بماند.
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

    - Onboarding اگر یک پیکربندی موجود ببیند، گزینه **Reset** را هم ارائه می‌کند. [Onboarding (CLI)](/fa/start/wizard) را ببینید.
    - اگر از profileها (`--profile` / `OPENCLAW_PROFILE`) استفاده کرده‌اید، هر state dir را reset کنید (پیش‌فرض‌ها `~/.openclaw-<profile>` هستند).
    - reset توسعه: `openclaw gateway --dev --reset` (فقط توسعه؛ پیکربندی توسعه + credentialها + نشست‌ها + workspace را پاک می‌کند).

  </Accordion>

  <Accordion title='خطاهای "context too large" می‌گیرم - چطور reset یا compact کنم؟'>
    از یکی از این‌ها استفاده کنید:

    - **Compact** (گفت‌وگو را نگه می‌دارد اما turnهای قدیمی‌تر را خلاصه می‌کند):

      ```
      /compact
      ```

      یا برای هدایت خلاصه، `/compact <instructions>` را استفاده کنید.

    - **Reset** (شناسه نشست تازه برای همان کلید chat):

      ```
      /new
      /reset
      ```

    اگر همچنان رخ می‌دهد:

    - **هرس نشست** (`agents.defaults.contextPruning`) را فعال یا تنظیم کنید تا خروجی ابزارهای قدیمی کوتاه شود.
    - از مدلی با پنجره context بزرگ‌تر استفاده کنید.

    مستندات: [Compaction](/fa/concepts/compaction)، [هرس نشست](/fa/concepts/session-pruning)، [مدیریت نشست](/fa/concepts/session).

  </Accordion>

  <Accordion title='چرا "LLM request rejected: messages.content.tool_use.input field required" را می‌بینم؟'>
    این یک خطای اعتبارسنجی ارائه‌دهنده است: مدل یک بلوک `tool_use` بدون `input` لازم منتشر کرده است.
    معمولاً یعنی تاریخچه نشست کهنه یا خراب شده است (اغلب پس از threadهای طولانی
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

    اگر `HEARTBEAT.md` وجود داشته باشد اما عملا خالی باشد (فقط خط‌های خالی،
    توضیحات Markdown/HTML، سرفصل‌های Markdown مثل `# Heading`، نشانگرهای fence،
    یا stubهای خالی checklist)، OpenClaw اجرای Heartbeat را برای صرفه‌جویی در فراخوانی‌های API رد می‌کند.
    اگر فایل وجود نداشته باشد، Heartbeat همچنان اجرا می‌شود و مدل تصمیم می‌گیرد چه کاری انجام دهد.

    بازنویسی‌های هر agent از `agents.list[].heartbeat` استفاده می‌کنند. مستندات: [Heartbeat](/fa/gateway/heartbeat).

  </Accordion>

  <Accordion title='آیا باید یک «حساب ربات» به گروه WhatsApp اضافه کنم؟'>
    خیر. OpenClaw روی **حساب خودتان** اجرا می‌شود، پس اگر شما در گروه باشید، OpenClaw می‌تواند آن را ببیند.
    به‌صورت پیش‌فرض، پاسخ‌های گروهی تا وقتی فرستنده‌ها را مجاز نکنید مسدود هستند (`groupPolicy: "allowlist"`).

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

  <Accordion title="چگونه JID یک گروه WhatsApp را بگیرم؟">
    گزینه ۱ (سریع‌ترین): گزارش‌ها را دنبال کنید و یک پیام آزمایشی در گروه بفرستید:

    ```bash
    openclaw logs --follow --json
    ```

    به دنبال `chatId` (یا `from`) باشید که به `@g.us` ختم می‌شود، مثل:
    `1234567890-1234567890@g.us`.

    گزینه ۲ (اگر از قبل پیکربندی/allowlist شده است): گروه‌ها را از config فهرست کنید:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    مستندات: [WhatsApp](/fa/channels/whatsapp)، [فهرست](/fa/cli/directory)، [گزارش‌ها](/fa/cli/logs).

  </Accordion>

  <Accordion title="چرا OpenClaw در گروه پاسخ نمی‌دهد؟">
    دو علت رایج:

    - دروازه‌گذاری mention روشن است (پیش‌فرض). باید bot را @mention کنید (یا با `mentionPatterns` تطبیق دهید).
    - شما `channels.whatsapp.groups` را بدون `"*"` پیکربندی کرده‌اید و گروه در allowlist نیست.

    [گروه‌ها](/fa/channels/groups) و [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.

  </Accordion>

  <Accordion title="آیا گروه‌ها/threadها context را با DMها به اشتراک می‌گذارند؟">
    چت‌های مستقیم به‌صورت پیش‌فرض به session اصلی جمع می‌شوند. گروه‌ها/channelها کلیدهای session خودشان را دارند، و topicهای Telegram / threadهای Discord sessionهای جداگانه هستند. [گروه‌ها](/fa/channels/groups) و [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.
  </Accordion>

  <Accordion title="چند workspace و agent می‌توانم بسازم؟">
    محدودیت سختی وجود ندارد. ده‌ها (حتی صدها) مورد مشکلی ندارند، اما مراقب این موارد باشید:

    - **رشد دیسک:** sessionها + transcriptها زیر `~/.openclaw/agents/<agentId>/sessions/` قرار دارند.
    - **هزینه token:** agentهای بیشتر یعنی استفاده هم‌زمان بیشتر از مدل.
    - **سربار عملیات:** پروفایل‌های احراز هویت، workspaceها، و routing کانال برای هر agent.

    نکته‌ها:

    - برای هر agent یک workspace **فعال** نگه دارید (`agents.defaults.workspace`).
    - اگر دیسک رشد کرد، sessionهای قدیمی را هرس کنید (JSONL یا entryهای store را حذف کنید).
    - از `openclaw doctor` برای پیدا کردن workspaceهای سرگردان و ناهماهنگی‌های profile استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم چند bot یا chat را هم‌زمان اجرا کنم (Slack)، و چطور باید آن را راه‌اندازی کنم؟">
    بله. از **Routing چند-Agent** برای اجرای چند agent ایزوله و route کردن پیام‌های ورودی بر اساس
    channel/account/peer استفاده کنید. Slack به‌عنوان یک channel پشتیبانی می‌شود و می‌تواند به agentهای مشخص bind شود.

    دسترسی browser قدرتمند است، اما به معنی «انجام هر کاری که انسان می‌تواند» نیست - ضدربات، CAPTCHAها، و MFA همچنان می‌توانند
    automation را مسدود کنند. برای قابل‌اعتمادترین کنترل browser، از Chrome MCP محلی روی host استفاده کنید،
    یا روی ماشینی که واقعا browser را اجرا می‌کند از CDP استفاده کنید.

    راه‌اندازی پیشنهادی:

    - host همیشه‌روشن Gateway (VPS/Mac mini).
    - یک agent برای هر نقش (bindingها).
    - channel(های) Slack متصل به آن agentها.
    - browser محلی از طریق Chrome MCP یا یک node در صورت نیاز.

    مستندات: [Routing چند-Agent](/fa/concepts/multi-agent)، [Slack](/fa/channels/slack)،
    [Browser](/fa/tools/browser)، [Nodeها](/fa/nodes).

  </Accordion>
</AccordionGroup>

## مدل‌ها، failover، و پروفایل‌های احراز هویت

پرسش‌وپاسخ مدل‌ها — پیش‌فرض‌ها، انتخاب، aliasها، تغییر، failover، پروفایل‌های احراز هویت —
در [پرسش‌های متداول مدل‌ها](/fa/help/faq-models) قرار دارد.

## Gateway: پورت‌ها، «already running»، و حالت remote

<AccordionGroup>
  <Accordion title="Gateway از چه پورتی استفاده می‌کند؟">
    `gateway.port` پورت multiplexed واحد را برای WebSocket + HTTP (Control UI، hookها، و غیره) کنترل می‌کند.

    تقدم:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='چرا openclaw gateway status می‌گوید "Runtime: running" اما "Connectivity probe: failed"؟'>
    چون "running" دید **supervisor** است (launchd/systemd/schtasks). Connectivity probe همان CLI است که واقعا به WebSocket Gateway وصل می‌شود.

    از `openclaw gateway status` استفاده کنید و به این خط‌ها اعتماد کنید:

    - `Probe target:` (URLی که probe واقعا استفاده کرده است)
    - `Listening:` (چیزی که واقعا روی پورت bind شده است)
    - `Last gateway error:` (علت ریشه‌ای رایج وقتی process زنده است اما پورت listening نیست)

  </Accordion>

  <Accordion title='چرا openclaw gateway status مقدار "Config (cli)" و "Config (service)" متفاوت نشان می‌دهد؟'>
    شما در حال ویرایش یک فایل config هستید در حالی که service فایل دیگری را اجرا می‌کند (اغلب ناهماهنگی `--profile` / `OPENCLAW_STATE_DIR`).

    راه‌حل:

    ```bash
    openclaw gateway install --force
    ```

    آن را از همان `--profile` / environmentی اجرا کنید که می‌خواهید service استفاده کند.

  </Accordion>

  <Accordion title='معنی "another gateway instance is already listening" چیست؟'>
    OpenClaw با bind کردن listener WebSocket بلافاصله هنگام startup (پیش‌فرض `ws://127.0.0.1:18789`) یک lock runtime اعمال می‌کند. اگر bind با `EADDRINUSE` شکست بخورد، `GatewayLockError` پرتاب می‌کند که نشان می‌دهد instance دیگری از قبل listening است.

    راه‌حل: instance دیگر را متوقف کنید، پورت را آزاد کنید، یا با `openclaw gateway --port <port>` اجرا کنید.

  </Accordion>

  <Accordion title="چگونه OpenClaw را در حالت remote اجرا کنم (client به Gateway جای دیگری وصل می‌شود)؟">
    `gateway.mode: "remote"` را تنظیم کنید و به یک URL WebSocket remote اشاره کنید، به‌صورت اختیاری همراه با credentialهای remote مبتنی بر shared-secret:

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

    - `openclaw gateway` فقط وقتی start می‌شود که `gateway.mode` برابر `local` باشد (یا override flag را پاس بدهید).
    - برنامه macOS فایل config را watch می‌کند و وقتی این مقدارها تغییر کنند، modeها را live عوض می‌کند.
    - `gateway.remote.token` / `.password` فقط credentialهای remote سمت client هستند؛ آن‌ها به‌تنهایی احراز هویت Gateway محلی را فعال نمی‌کنند.

  </Accordion>

  <Accordion title='Control UI می‌گوید "unauthorized" (یا مدام reconnect می‌کند). حالا چه کنم؟'>
    مسیر احراز هویت Gateway شما و روش احراز هویت UI با هم مطابقت ندارند.

    واقعیت‌ها (از code):

    - Control UI، token را برای session برگه فعلی browser و URL Gateway انتخاب‌شده در `sessionStorage` نگه می‌دارد، بنابراین refreshهای همان برگه بدون بازگردانی پایداری token بلندمدت در localStorage همچنان کار می‌کنند.
    - در `AUTH_TOKEN_MISMATCH`، clientهای trusted می‌توانند وقتی Gateway hintهای retry برمی‌گرداند (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`) یک retry محدود با device token cache‌شده انجام دهند.
    - آن retry با token cache‌شده اکنون scopeهای approved cache‌شده‌ای را که همراه device token ذخیره شده‌اند دوباره استفاده می‌کند. callerهای explicit `deviceToken` / explicit `scopes` همچنان به‌جای به ارث بردن scopeهای cache‌شده، مجموعه scope درخواستی خودشان را نگه می‌دارند.
    - خارج از آن مسیر retry، تقدم احراز هویت connect ابتدا shared token/password صریح است، سپس `deviceToken` صریح، سپس device token ذخیره‌شده، سپس bootstrap token.
    - bootstrap کد setup داخلی، یک node device token با `scopes: []` به‌علاوه یک operator handoff token محدود برای onboarding موبایل trusted برمی‌گرداند. operator handoff می‌تواند configuration بومی زمان setup را بخواند اما scopeهای mutation برای pairing یا `operator.admin` را اعطا نمی‌کند.

    راه‌حل:

    - سریع‌ترین: `openclaw dashboard` (URL داشبورد را چاپ + کپی می‌کند، سعی می‌کند باز کند؛ اگر headless باشد hint مربوط به SSH را نشان می‌دهد).
    - اگر هنوز token ندارید: `openclaw doctor --generate-gateway-token`.
    - اگر remote است، ابتدا tunnel بزنید: `ssh -N -L 18789:127.0.0.1:18789 user@host` سپس `http://127.0.0.1:18789/` را باز کنید.
    - حالت shared-secret: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` یا `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` را تنظیم کنید، سپس secret مطابق را در تنظیمات Control UI paste کنید.
    - حالت Tailscale Serve: مطمئن شوید `gateway.auth.allowTailscale` فعال است و دارید URL مربوط به Serve را باز می‌کنید، نه یک URL خام loopback/tailnet که headerهای هویت Tailscale را دور می‌زند.
    - حالت trusted-proxy: مطمئن شوید از طریق proxy آگاه از هویت پیکربندی‌شده وارد می‌شوید، نه یک URL خام Gateway. proxyهای local loopback روی همان host هم به `gateway.auth.trustedProxy.allowLoopback = true` نیاز دارند.
    - اگر mismatch پس از یک retry همچنان باقی بود، paired device token را rotate/دوباره approve کنید:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - اگر آن rotate call گفت denied شده است، دو مورد را بررسی کنید:
      - sessionهای paired-device فقط می‌توانند device **خودشان** را rotate کنند مگر اینکه `operator.admin` هم داشته باشند
      - مقدارهای explicit `--scope` نمی‌توانند از scopeهای operator فعلی caller فراتر بروند
    - هنوز گیر کرده‌اید؟ `openclaw status --all` را اجرا کنید و [عیب‌یابی](/fa/gateway/troubleshooting) را دنبال کنید. برای جزئیات احراز هویت، [داشبورد](/fa/web/dashboard) را ببینید.

  </Accordion>

  <Accordion title="gateway.bind را روی tailnet تنظیم کردم اما نمی‌تواند bind شود و چیزی listening نیست">
    bind با `tailnet` یک IP Tailscale را از interfaceهای شبکه شما انتخاب می‌کند (100.64.0.0/10). اگر ماشین روی Tailscale نباشد (یا interface down باشد)، چیزی برای bind شدن وجود ندارد.

    راه‌حل:

    - Tailscale را روی آن host start کنید (تا یک آدرس 100.x داشته باشد)، یا
    - به `gateway.bind: "loopback"` / `"lan"` تغییر دهید.

    نکته: `tailnet` صریح است. `auto`، loopback را ترجیح می‌دهد؛ وقتی bind فقط مخصوص tailnet می‌خواهید، از `gateway.bind: "tailnet"` استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم چند Gateway را روی یک host اجرا کنم؟">
    معمولا خیر - یک Gateway می‌تواند چند channel پیام‌رسان و agent را اجرا کند. فقط وقتی چند Gateway استفاده کنید که به افزونگی (مثلا: rescue bot) یا ایزولاسیون سخت نیاز دارید.

    بله، اما باید ایزوله کنید:

    - `OPENCLAW_CONFIG_PATH` (config برای هر instance)
    - `OPENCLAW_STATE_DIR` (state برای هر instance)
    - `agents.defaults.workspace` (ایزولاسیون workspace)
    - `gateway.port` (پورت‌های یکتا)

    راه‌اندازی سریع (پیشنهادی):

    - برای هر instance از `openclaw --profile <name> ...` استفاده کنید (به‌صورت خودکار `~/.openclaw-<name>` را می‌سازد).
    - در config هر profile یک `gateway.port` یکتا تنظیم کنید (یا برای اجراهای دستی `--port` را پاس بدهید).
    - یک service برای هر profile نصب کنید: `openclaw --profile <name> gateway install`.

    profileها نام serviceها را هم suffix می‌کنند (`ai.openclaw.<profile>`؛ legacy `com.openclaw.*`، `openclaw-gateway-<profile>.service`، `OpenClaw Gateway (<profile>)`).
    راهنمای کامل: [چند Gateway](/fa/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='معنی "invalid handshake" / کد 1008 چیست؟'>
    Gateway یک **سرور WebSocket** است، و انتظار دارد اولین پیام
    یک frame از نوع `connect` باشد. اگر چیز دیگری دریافت کند، connection را
    با **کد 1008** (policy violation) می‌بندد.

    علت‌های رایج:

    - شما URL مربوط به **HTTP** را در browser باز کرده‌اید (`http://...`) به‌جای WS client.
    - از پورت یا path اشتباه استفاده کرده‌اید.
    - یک proxy یا tunnel headerهای auth را حذف کرده یا یک درخواست غیر-Gateway فرستاده است.

    راه‌حل‌های سریع:

    1. از URL مربوط به WS استفاده کنید: `ws://<host>:18789` (یا اگر HTTPS است، `wss://...`).
    2. پورت WS را در یک برگه معمولی browser باز نکنید.
    3. اگر auth روشن است، token/password را در frame `connect` قرار دهید.

    اگر از CLI یا TUI استفاده می‌کنید، URL باید این‌طور باشد:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    جزئیات protocol: [protocol Gateway](/fa/gateway/protocol).

  </Accordion>
</AccordionGroup>

## گزارش‌گیری و debugging

<AccordionGroup>
  <Accordion title="گزارش‌ها کجا هستند؟">
    گزارش‌های فایل (structured):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    می‌توانید از طریق `logging.file` یک مسیر پایدار تنظیم کنید. سطح لاگ فایل با `logging.level` کنترل می‌شود. میزان جزئیات کنسول با `--verbose` و `logging.consoleLevel` کنترل می‌شود.

    سریع‌ترین دنبال‌کردن لاگ:

    ```bash
    openclaw logs --follow
    ```

    لاگ‌های سرویس/سرپرست (وقتی gateway از طریق launchd/systemd اجرا می‌شود):

    - خروجی استاندارد launchd در macOS: `~/Library/Logs/openclaw/gateway.log` (پروفایل‌ها از `gateway-<profile>.log` استفاده می‌کنند؛ stderr سرکوب می‌شود)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    برای اطلاعات بیشتر، [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید.

  </Accordion>

  <Accordion title="چطور سرویس Gateway را شروع/متوقف/بازراه‌اندازی کنم؟">
    از کمک‌کننده‌های gateway استفاده کنید:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر gateway را دستی اجرا می‌کنید، `openclaw gateway --force` می‌تواند پورت را پس بگیرد. [Gateway](/fa/gateway) را ببینید.

  </Accordion>

  <Accordion title="ترمینالم را در Windows بستم - چطور OpenClaw را بازراه‌اندازی کنم؟">
    **سه حالت نصب Windows** وجود دارد:

    **1) راه‌اندازی محلی Windows Hub:** برنامه بومی یک WSL Gateway محلی متعلق به برنامه را مدیریت می‌کند.

    **OpenClaw Companion** را از منوی Start یا tray باز کنید، سپس از
    **راه‌اندازی Gateway** یا زبانه اتصالات استفاده کنید.

    **2) WSL2 Gateway دستی:** Gateway داخل Linux اجرا می‌شود.

    PowerShell را باز کنید، وارد WSL شوید، سپس بازراه‌اندازی کنید:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر سرویس را هرگز نصب نکرده‌اید، آن را در پیش‌زمینه شروع کنید:

    ```bash
    openclaw gateway run
    ```

    **3) CLI/Gateway بومی Windows:** Gateway مستقیما در Windows اجرا می‌شود.

    PowerShell را باز کنید و اجرا کنید:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر آن را دستی اجرا می‌کنید (بدون سرویس)، از این استفاده کنید:

    ```powershell
    openclaw gateway run
    ```

    مستندات: [Windows](/fa/platforms/windows)، [راهنمای اجرای سرویس Gateway](/fa/gateway).

  </Accordion>

  <Accordion title="Gateway بالا آمده اما پاسخ‌ها هرگز نمی‌رسند. چه چیزی را بررسی کنم؟">
    با یک بررسی سریع سلامت شروع کنید:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    علت‌های رایج:

    - احراز هویت مدل روی **میزبان gateway** بارگذاری نشده است (`models status` را بررسی کنید).
    - جفت‌سازی/allowlist کانال جلوی پاسخ‌ها را می‌گیرد (پیکربندی کانال + لاگ‌ها را بررسی کنید).
    - WebChat/Dashboard بدون توکن درست باز است.

    اگر از راه دور هستید، تأیید کنید اتصال تونل/Tailscale برقرار است و
    WebSocket مربوط به Gateway در دسترس است.

    مستندات: [کانال‌ها](/fa/channels)، [عیب‌یابی](/fa/gateway/troubleshooting)، [دسترسی از راه دور](/fa/gateway/remote).

  </Accordion>

  <Accordion title='"ارتباط با gateway قطع شد: بدون دلیل" - حالا چه؟'>
    این معمولا یعنی UI اتصال WebSocket را از دست داده است. بررسی کنید:

    1. آیا Gateway در حال اجراست؟ `openclaw gateway status`
    2. آیا Gateway سالم است؟ `openclaw status`
    3. آیا UI توکن درست را دارد؟ `openclaw dashboard`
    4. اگر از راه دور است، آیا پیوند تونل/Tailscale برقرار است؟

    سپس لاگ‌ها را دنبال کنید:

    ```bash
    openclaw logs --follow
    ```

    مستندات: [Dashboard](/fa/web/dashboard)، [دسترسی از راه دور](/fa/gateway/remote)، [عیب‌یابی](/fa/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands ناموفق می‌شود. چه چیزی را بررسی کنم؟">
    با لاگ‌ها و وضعیت کانال شروع کنید:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    سپس خطا را تطبیق دهید:

    - `BOT_COMMANDS_TOO_MUCH`: منوی Telegram ورودی‌های زیادی دارد. OpenClaw همین حالا هم آن را تا حد Telegram کوتاه می‌کند و با فرمان‌های کمتر دوباره تلاش می‌کند، اما هنوز باید بعضی ورودی‌های منو حذف شوند. فرمان‌های plugin/skill/سفارشی را کاهش دهید، یا اگر به منو نیاز ندارید `channels.telegram.commands.native` را غیرفعال کنید.
    - `TypeError: fetch failed`، `Network request for 'setMyCommands' failed!`، یا خطاهای شبکه مشابه: اگر روی VPS هستید یا پشت پروکسی قرار دارید، تأیید کنید HTTPS خروجی مجاز است و DNS برای `api.telegram.org` کار می‌کند.

    اگر Gateway از راه دور است، مطمئن شوید لاگ‌ها را روی میزبان Gateway می‌بینید.

    مستندات: [Telegram](/fa/channels/telegram)، [عیب‌یابی کانال](/fa/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI هیچ خروجی نشان نمی‌دهد. چه چیزی را بررسی کنم؟">
    ابتدا تأیید کنید Gateway در دسترس است و عامل می‌تواند اجرا شود:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    در TUI، از `/status` برای دیدن وضعیت فعلی استفاده کنید. اگر انتظار پاسخ در یک کانال چت را دارید،
    مطمئن شوید تحویل فعال است (`/deliver on`).

    مستندات: [TUI](/fa/web/tui)، [فرمان‌های Slash](/fa/tools/slash-commands).

  </Accordion>

  <Accordion title="چطور Gateway را کاملا متوقف و سپس شروع کنم؟">
    اگر سرویس را نصب کرده‌اید:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    این کار **سرویس تحت نظارت** را متوقف/شروع می‌کند (launchd روی macOS، systemd روی Linux).
    وقتی Gateway در پس‌زمینه به‌عنوان daemon اجرا می‌شود، از این استفاده کنید.

    اگر در پیش‌زمینه اجرا می‌کنید، با Ctrl-C متوقف کنید، سپس:

    ```bash
    openclaw gateway run
    ```

    مستندات: [راهنمای اجرای سرویس Gateway](/fa/gateway).

  </Accordion>

  <Accordion title="توضیح ساده: openclaw gateway restart در برابر openclaw gateway">
    - `openclaw gateway restart`: **سرویس پس‌زمینه** را بازراه‌اندازی می‌کند (launchd/systemd).
    - `openclaw gateway`: gateway را برای این نشست ترمینال **در پیش‌زمینه** اجرا می‌کند.

    اگر سرویس را نصب کرده‌اید، از فرمان‌های gateway استفاده کنید. وقتی
    یک اجرای موردی و پیش‌زمینه می‌خواهید، از `openclaw gateway` استفاده کنید.

  </Accordion>

  <Accordion title="سریع‌ترین راه برای گرفتن جزئیات بیشتر وقتی چیزی شکست می‌خورد">
    Gateway را با `--verbose` شروع کنید تا جزئیات بیشتری در کنسول بگیرید. سپس فایل لاگ را برای احراز هویت کانال، مسیریابی مدل، و خطاهای RPC بررسی کنید.
  </Accordion>
</AccordionGroup>

## رسانه و پیوست‌ها

<AccordionGroup>
  <Accordion title="skill من یک تصویر/PDF تولید کرد، اما چیزی ارسال نشد">
    پیوست‌های خروجی از عامل باید از فیلدهای رسانه ساختاریافته مانند `media`، `mediaUrl`، `path`، یا `filePath` استفاده کنند. [راه‌اندازی دستیار OpenClaw](/fa/start/openclaw) و [ارسال عامل](/fa/tools/agent-send) را ببینید.

    ارسال با CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    همچنین بررسی کنید:

    - کانال مقصد از رسانه خروجی پشتیبانی می‌کند و توسط allowlist مسدود نشده است.
    - فایل در محدوده اندازه ارائه‌دهنده است (تصاویر تا حداکثر 2048px تغییر اندازه داده می‌شوند).
    - `tools.fs.workspaceOnly=true` ارسال‌های مسیر محلی را به workspace، temp/media-store، و فایل‌های تأییدشده توسط sandbox محدود نگه می‌دارد.
    - `tools.fs.workspaceOnly=false` اجازه می‌دهد ارسال‌های رسانه محلی ساختاریافته از فایل‌های host-local استفاده کنند که عامل از قبل می‌تواند بخواند، اما فقط برای رسانه به‌علاوه انواع سند امن (تصاویر، صوت، ویدئو، PDF، اسناد Office، و اسناد متنی تأییدشده مانند Markdown/MD، TXT، JSON، YAML، و YML). این اسکنر راز نیست: یک `secret.txt` یا `config.json` قابل خواندن برای عامل می‌تواند وقتی extension و اعتبارسنجی محتوا تطبیق دارند پیوست شود. فایل‌های حساس را بیرون از مسیرهای قابل خواندن برای عامل نگه دارید، یا برای ارسال‌های مسیر محلی سخت‌گیرانه‌تر `tools.fs.workspaceOnly=true` را نگه دارید.

    [تصاویر](/fa/nodes/images) را ببینید.

  </Accordion>
</AccordionGroup>

## امنیت و کنترل دسترسی

<AccordionGroup>
  <Accordion title="آیا در معرض DMهای ورودی قرار دادن OpenClaw امن است؟">
    DMهای ورودی را ورودی غیرقابل اعتماد در نظر بگیرید. پیش‌فرض‌ها برای کاهش ریسک طراحی شده‌اند:

    - رفتار پیش‌فرض در کانال‌های دارای قابلیت DM **جفت‌سازی** است:
      - فرستنده‌های ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ ربات پیام آن‌ها را پردازش نمی‌کند.
      - تأیید با: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - درخواست‌های در انتظار به **3 تا برای هر کانال** محدود می‌شوند؛ اگر کدی نرسید، `openclaw pairing list --channel <channel> [--account <id>]` را بررسی کنید.
    - باز کردن عمومی DMها به opt-in صریح نیاز دارد (`dmPolicy: "open"` و allowlist `"*"`).

    برای آشکار کردن سیاست‌های پرریسک DM، `openclaw doctor` را اجرا کنید.

  </Accordion>

  <Accordion title="آیا تزریق پرامپت فقط برای ربات‌های عمومی نگران‌کننده است؟">
    نه. تزریق پرامپت درباره **محتوای غیرقابل اعتماد** است، نه فقط اینکه چه کسی می‌تواند به ربات DM بدهد.
    اگر دستیار شما محتوای خارجی می‌خواند (جست‌وجو/واکشی وب، صفحه‌های مرورگر، ایمیل‌ها،
    مستندات، پیوست‌ها، لاگ‌های چسبانده‌شده)، آن محتوا می‌تواند شامل دستورالعمل‌هایی باشد که تلاش می‌کنند
    مدل را بربایند. این می‌تواند حتی وقتی **شما تنها فرستنده هستید** هم رخ دهد.

    بزرگ‌ترین ریسک وقتی است که ابزارها فعال هستند: مدل می‌تواند فریب بخورد تا
    context را بیرون بکشد یا ابزارها را از طرف شما فراخوانی کند. شعاع اثر را با این کارها کاهش دهید:

    - استفاده از یک عامل "خواننده" فقط‌خواندنی یا بدون ابزار برای خلاصه‌کردن محتوای غیرقابل اعتماد
    - خاموش نگه داشتن `web_search` / `web_fetch` / `browser` برای عامل‌های دارای ابزار
    - غیرقابل اعتماد دانستن متن فایل/سند رمزگشایی‌شده نیز: OpenResponses
      `input_file` و استخراج پیوست رسانه هر دو متن استخراج‌شده را
      به‌جای عبور دادن متن خام فایل، در نشانگرهای مرز محتوای خارجی صریح می‌پیچند
    - sandboxing و allowlistهای سخت‌گیرانه ابزار

    جزئیات: [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="آیا OpenClaw به دلیل استفاده از TypeScript/Node به جای Rust/WASM امنیت کمتری دارد؟">
    زبان و runtime مهم هستند، اما ریسک اصلی برای یک عامل شخصی نیستند.
    ریسک‌های عملی OpenClaw عبارت‌اند از در معرض قرار گرفتن gateway، اینکه چه کسی می‌تواند به
    ربات پیام بدهد، تزریق پرامپت، دامنه ابزار، مدیریت اعتبارنامه، دسترسی مرورگر، دسترسی exec،
    و اعتماد به skill یا plugin شخص ثالث.

    Rust و WASM می‌توانند برای بعضی دسته‌های کد ایزوله‌سازی قوی‌تری فراهم کنند، اما
    تزریق پرامپت، allowlistهای بد، در معرض قرار گرفتن عمومی gateway،
    ابزارهای بیش‌ازحد گسترده، یا پروفایل مرورگری را که از قبل به حساب‌های حساس وارد شده
    حل نمی‌کنند. این موارد را کنترل‌های اصلی بدانید:

    - Gateway را خصوصی یا احراز هویت‌شده نگه دارید
    - برای DMها و گروه‌ها از جفت‌سازی و allowlistها استفاده کنید
    - ابزارهای پرریسک را برای ورودی‌های غیرقابل اعتماد رد یا sandbox کنید
    - فقط plugins و skills مورد اعتماد را نصب کنید
    - پس از تغییرات پیکربندی، `openclaw security audit --deep` را اجرا کنید

    جزئیات: [امنیت](/fa/gateway/security)، [Sandboxing](/fa/gateway/sandboxing).

  </Accordion>

  <Accordion title="گزارش‌هایی درباره نمونه‌های در معرض قرار گرفته OpenClaw دیدم. چه چیزی را بررسی کنم؟">
    ابتدا استقرار واقعی خودتان را بررسی کنید:

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    یک خط مبنای امن‌تر این است:

    - Gateway به `loopback` متصل باشد، یا فقط از طریق دسترسی خصوصی احراز هویت‌شده
      مانند tailnet، تونل SSH، احراز هویت توکن/گذرواژه، یا یک پروکسی مورد اعتماد با پیکربندی درست
      در معرض باشد
    - DMها در حالت `pairing` یا `allowlist` باشند
    - گروه‌ها allowlist شده و mention-gated باشند مگر اینکه همه اعضا مورد اعتماد باشند
    - ابزارهای پرریسک (`exec`، `browser`، `gateway`، `cron`) برای عامل‌هایی که محتوای غیرقابل اعتماد می‌خوانند رد شده یا به‌شدت
      محدود شده باشند
    - هرجا اجرای ابزار به شعاع اثر کوچک‌تری نیاز دارد، sandboxing فعال باشد

    اتصال‌های عمومی بدون احراز هویت، DMها/گروه‌های باز همراه با ابزارها، و کنترل مرورگر در معرض
    یافته‌هایی هستند که باید اول رفع شوند. جزئیات:
    [چک‌لیست ممیزی امنیتی](/fa/gateway/security#security-audit-checklist).

  </Accordion>

  <Accordion title="آیا نصب Skillsهای ClawHub و plugins شخص ثالث امن است؟">
    Skills و plugins شخص ثالث را کدی بدانید که انتخاب می‌کنید به آن اعتماد کنید.
    صفحه‌های skill در ClawHub وضعیت اسکن را پیش از نصب نشان می‌دهند، اما اسکن‌ها
    مرز امنیتی کامل نیستند. OpenClaw در جریان‌های نصب/به‌روزرسانی plugin یا skill،
    مسدودسازی محلی خطرناک-code داخلی اجرا نمی‌کند؛ برای تصمیم‌های allow/block محلی
    از `security.installPolicy` تحت مالکیت operator استفاده کنید.

    الگوی امن‌تر:

    - نویسندگان مورد اعتماد و نسخه‌های پین‌شده را ترجیح دهید
    - پیش از فعال‌سازی، skill یا plugin را بخوانید
    - allowlistهای plugin و skill را محدود نگه دارید
    - جریان‌های کاری ورودی غیرقابل اعتماد را در sandbox با حداقل ابزارها اجرا کنید
    - از دادن دسترسی گسترده filesystem، exec، مرورگر، یا رازها به کد شخص ثالث پرهیز کنید

    جزئیات: [Skills](/fa/tools/skills)، [Pluginها](/fa/tools/plugin)،
    [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="آیا ربات من باید ایمیل، حساب GitHub یا شماره تلفن جداگانه داشته باشد؟">
    بله، برای بیشتر راه‌اندازی‌ها. جدا کردن ربات با حساب‌ها و شماره‌تلفن‌های مستقل
    دامنه آسیب را در صورت بروز مشکل کاهش می‌دهد. این کار همچنین چرخاندن
    اعتبارنامه‌ها یا لغو دسترسی را بدون اثرگذاری بر حساب‌های شخصی شما آسان‌تر می‌کند.

    کوچک شروع کنید. فقط به ابزارها و حساب‌هایی که واقعا نیاز دارید دسترسی بدهید، و
    در صورت نیاز بعدا گسترش دهید.

    مستندات: [امنیت](/fa/gateway/security)، [جفت‌سازی](/fa/channels/pairing).

  </Accordion>

  <Accordion title="آیا می‌توانم روی پیامک‌هایم به آن اختیار بدهم و آیا این کار امن است؟">
    ما اختیار کامل روی پیام‌های شخصی شما را توصیه **نمی‌کنیم**. امن‌ترین الگو این است:

    - پیام‌های مستقیم را در **حالت جفت‌سازی** یا یک فهرست مجاز محدود نگه دارید.
    - اگر می‌خواهید از طرف شما پیام بفرستد، از یک **شماره یا حساب جداگانه** استفاده کنید.
    - بگذارید پیش‌نویس کند، سپس **پیش از ارسال تأیید کنید**.

    اگر می‌خواهید آزمایش کنید، این کار را روی یک حساب اختصاصی انجام دهید و آن را جدا نگه دارید. ببینید
    [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="آیا می‌توانم برای وظایف دستیار شخصی از مدل‌های ارزان‌تر استفاده کنم؟">
    بله، **اگر** عامل فقط چتی باشد و ورودی قابل اعتماد باشد. رده‌های کوچک‌تر
    بیشتر در برابر ربایش دستورالعمل آسیب‌پذیرند، پس برای عامل‌های دارای ابزار
    یا هنگام خواندن محتوای نامطمئن از آن‌ها پرهیز کنید. اگر ناچارید از یک مدل کوچک‌تر استفاده کنید،
    ابزارها را محدود کنید و داخل یک sandbox اجرا کنید. ببینید [امنیت](/fa/gateway/security).
  </Accordion>

  <Accordion title="در Telegram دستور /start را اجرا کردم اما کد جفت‌سازی دریافت نکردم">
    کدهای جفت‌سازی **فقط** وقتی ارسال می‌شوند که یک فرستنده ناشناس به ربات پیام بدهد و
    `dmPolicy: "pairing"` فعال باشد. `/start` به‌تنهایی کدی ایجاد نمی‌کند.

    درخواست‌های در انتظار را بررسی کنید:

    ```bash
    openclaw pairing list telegram
    ```

    اگر دسترسی فوری می‌خواهید، شناسه فرستنده خود را در فهرست مجاز بگذارید یا برای آن حساب
    `dmPolicy: "open"` را تنظیم کنید.

  </Accordion>

  <Accordion title="WhatsApp: آیا به مخاطبان من پیام می‌دهد؟ جفت‌سازی چگونه کار می‌کند؟">
    خیر. سیاست پیش‌فرض پیام مستقیم WhatsApp **جفت‌سازی** است. فرستنده‌های ناشناس فقط یک کد جفت‌سازی می‌گیرند و پیام آن‌ها **پردازش نمی‌شود**. OpenClaw فقط به چت‌هایی پاسخ می‌دهد که دریافت می‌کند یا به ارسال‌های صریحی که شما فعال می‌کنید.

    جفت‌سازی را با این دستور تأیید کنید:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    درخواست‌های در انتظار را فهرست کنید:

    ```bash
    openclaw pairing list whatsapp
    ```

    اعلان شماره تلفن در راهنما: از آن برای تنظیم **فهرست مجاز/مالک** شما استفاده می‌شود تا پیام‌های مستقیم خودتان مجاز باشند. برای ارسال خودکار استفاده نمی‌شود. اگر روی شماره شخصی WhatsApp خود اجرا می‌کنید، از همان شماره استفاده کنید و `channels.whatsapp.selfChatMode` را فعال کنید.

  </Accordion>
</AccordionGroup>

## فرمان‌های چت، متوقف کردن وظایف، و «متوقف نمی‌شود»

<AccordionGroup>
  <Accordion title="چگونه جلوی نمایش پیام‌های داخلی سیستم در چت را بگیرم؟">
    بیشتر پیام‌های داخلی یا ابزار فقط وقتی ظاهر می‌شوند که **verbose**، **trace** یا **reasoning**
    برای آن نشست فعال باشد.

    در همان چتی که آن را می‌بینید اصلاح کنید:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    اگر هنوز پر سر و صداست، تنظیمات نشست را در رابط کاربری کنترل بررسی کنید و verbose
    را روی **inherit** بگذارید. همچنین مطمئن شوید از پروفایل رباتی استفاده نمی‌کنید که در پیکربندی
    `verboseDefault` آن روی `on` تنظیم شده باشد.

    مستندات: [فکر کردن و verbose](/fa/tools/thinking)، [امنیت](/fa/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="چگونه یک وظیفه در حال اجرا را متوقف/لغو کنم؟">
    هرکدام از این‌ها را **به‌صورت یک پیام مستقل** بفرستید (بدون اسلش):

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

    بیشتر فرمان‌ها باید به‌صورت یک پیام **مستقل** ارسال شوند که با `/` شروع می‌شود، اما چند میان‌بر (مانند `/status`) برای فرستنده‌های حاضر در فهرست مجاز به‌صورت درون‌خطی هم کار می‌کنند.

  </Accordion>

  <Accordion title='چگونه از Telegram یک پیام Discord بفرستم؟ ("Cross-context messaging denied")'>
    OpenClaw به‌طور پیش‌فرض پیام‌رسانی **میان‌ارائه‌دهنده‌ای** را مسدود می‌کند. اگر یک فراخوانی ابزار
    به Telegram مقید باشد، به Discord ارسال نمی‌کند مگر اینکه صریحا اجازه دهید.

    پیام‌رسانی میان‌ارائه‌دهنده‌ای را برای عامل فعال کنید:

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

    پس از ویرایش پیکربندی، Gateway را راه‌اندازی مجدد کنید.

  </Accordion>

  <Accordion title='چرا حس می‌شود ربات پیام‌های پشت‌سرهم را «نادیده می‌گیرد»؟'>
    اعلان‌های میانه اجرا به‌طور پیش‌فرض به اجرای فعال هدایت می‌شوند. برای انتخاب رفتار اجرای فعال از `/queue` استفاده کنید:

    - `steer` - اجرای فعال را در مرز بعدی مدل هدایت کنید
    - `followup` - پیام‌ها را در صف بگذارید و پس از پایان اجرای فعلی، آن‌ها را یکی‌یکی اجرا کنید
    - `collect` - پیام‌های سازگار را در صف بگذارید و پس از پایان اجرای فعلی یک‌بار پاسخ دهید
    - `interrupt` - اجرای فعلی را لغو کنید و از نو شروع کنید

    حالت پیش‌فرض `steer` است. برای حالت‌های صف‌شده می‌توانید گزینه‌هایی مانند `debounce:0.5s cap:25 drop:summarize` اضافه کنید. [صف فرمان](/fa/concepts/queue) و [صف هدایت](/fa/concepts/queue-steering) را ببینید.

  </Accordion>
</AccordionGroup>

## متفرقه

<AccordionGroup>
  <Accordion title='مدل پیش‌فرض Anthropic با یک کلید API چیست؟'>
    در OpenClaw، اعتبارنامه‌ها و انتخاب مدل جدا هستند. تنظیم `ANTHROPIC_API_KEY` (یا ذخیره یک کلید API Anthropic در پروفایل‌های احراز هویت) احراز هویت را فعال می‌کند، اما مدل پیش‌فرض واقعی همان چیزی است که در `agents.defaults.model.primary` پیکربندی می‌کنید (برای مثال، `anthropic/claude-sonnet-4-6` یا `anthropic/claude-opus-4-6`). اگر `No credentials found for profile "anthropic:default"` را می‌بینید، یعنی Gateway نتوانسته اعتبارنامه‌های Anthropic را در `auth-profiles.json` مورد انتظار برای عاملی که در حال اجراست پیدا کند.
  </Accordion>
</AccordionGroup>

---

هنوز گیر کرده‌اید؟ در [Discord](https://discord.com/invite/clawd) بپرسید یا یک [بحث GitHub](https://github.com/openclaw/openclaw/discussions) باز کنید.

## مرتبط

- [پرسش‌های متداول اجرای اول](/fa/help/faq-first-run) — نصب، راه‌اندازی اولیه، احراز هویت، اشتراک‌ها، خطاهای اولیه
- [پرسش‌های متداول مدل‌ها](/fa/help/faq-models) — انتخاب مدل، failover، پروفایل‌های احراز هویت
- [عیب‌یابی](/fa/help/troubleshooting) — تریاژ بر اساس نشانه
