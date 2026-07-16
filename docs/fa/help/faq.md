---
read_when:
    - پاسخ به پرسش‌های رایج پشتیبانی درباره راه‌اندازی، نصب، شروع به کار یا زمان اجرا
    - اولویت‌بندی مشکلات گزارش‌شده توسط کاربران پیش از اشکال‌زدایی عمیق‌تر
summary: پرسش‌های متداول درباره راه‌اندازی، پیکربندی و استفاده از OpenClaw
title: پرسش‌های متداول
x-i18n:
    generated_at: "2026-07-16T16:33:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 913757fcc748a15370dc49874b54184d891c954df45b76c8a3212da5bc1da845
    source_path: help/faq.md
    workflow: 16
---

پاسخ‌های سریع به‌همراه عیب‌یابی عمیق‌تر برای راه‌اندازی‌های واقعی (توسعه محلی، VPS، چندعاملی، کلیدهای OAuth/API، جایگزینی مدل هنگام خرابی). برای عیب‌یابی زمان اجرا، به [عیب‌یابی](/fa/gateway/troubleshooting) مراجعه کنید. برای مرجع کامل پیکربندی، به [پیکربندی](/fa/gateway/configuration) مراجعه کنید.

## ۶۰ ثانیه نخست در صورت بروز مشکل

<Steps>
  <Step title="وضعیت سریع">
    ```bash
    openclaw status
    ```
    خلاصه سریع محلی: سیستم‌عامل + به‌روزرسانی، دسترسی‌پذیری gateway/سرویس، عامل‌ها/نشست‌ها، پیکربندی ارائه‌دهنده + مشکلات زمان اجرا (هنگامی که Gateway در دسترس است).
  </Step>
  <Step title="گزارش قابل جای‌گذاری (ایمن برای اشتراک‌گذاری)">
    ```bash
    openclaw status --all
    ```
    عیب‌یابی فقط‌خواندنی همراه با انتهای گزارش وقایع (توکن‌ها حذف شده‌اند).
  </Step>
  <Step title="وضعیت دیمن + درگاه">
    ```bash
    openclaw gateway status
    ```
    زمان اجرای ناظر را در مقایسه با دسترسی‌پذیری RPC، نشانی URL هدف کاوش، و پیکربندی‌ای که احتمالاً سرویس استفاده کرده است نشان می‌دهد.
  </Step>
  <Step title="کاوش‌های عمیق">
    ```bash
    openclaw status --deep
    ```
    کاوش زنده سلامت Gateway، شامل کاوش کانال‌ها در صورت پشتیبانی (نیازمند Gateway در دسترس). به [سلامت](/fa/gateway/health) مراجعه کنید.
  </Step>
  <Step title="دنبال‌کردن جدیدترین گزارش وقایع">
    ```bash
    openclaw logs --follow
    ```
    اگر RPC قطع است، از این روش جایگزین استفاده کنید:
    ```bash
    tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
    ```
    گزارش‌های وقایع فایل از گزارش‌های وقایع سرویس جدا هستند؛ به [ثبت وقایع](/fa/logging) و [عیب‌یابی](/fa/gateway/troubleshooting) مراجعه کنید.
  </Step>
  <Step title="اجرای عیب‌یاب (تعمیرات)">
    ```bash
    openclaw doctor
    ```
    پیکربندی و وضعیت را تعمیر/مهاجرت می‌دهد، سپس بررسی‌های سلامت را اجرا می‌کند. به [عیب‌یاب](/fa/gateway/doctor) مراجعه کنید.
  </Step>
  <Step title="تصویر لحظه‌ای Gateway (فقط WS)">
    ```bash
    openclaw health --json
    openclaw health --verbose   # در صورت خطا، نشانی URL هدف + مسیر پیکربندی را نشان می‌دهد
    ```
    از Gateway در حال اجرا یک تصویر لحظه‌ای کامل درخواست می‌کند. به [سلامت](/fa/gateway/health) مراجعه کنید.
  </Step>
</Steps>

## شروع سریع و راه‌اندازی نخستین اجرا

پرسش‌وپاسخ نخستین اجرا — نصب، ورود اولیه، مسیرهای احراز هویت، اشتراک‌ها، خطاهای اولیه — در [پرسش‌های متداول نخستین اجرا](/fa/help/faq-first-run) قرار دارد.

## OpenClaw چیست؟

<AccordionGroup>
  <Accordion title="OpenClaw در یک بند چیست؟">
    OpenClaw یک دستیار هوش مصنوعی شخصی است که آن را روی دستگاه‌های خود اجرا می‌کنید. در بسترهای پیام‌رسانی‌ای که از قبل استفاده می‌کنید پاسخ می‌دهد (Discord، Google Chat، iMessage، Mattermost، Signal، Slack، Telegram، WebChat، WhatsApp و Pluginهای کانال همراه مانند QQ Bot) و در پلتفرم‌های پشتیبانی‌شده می‌تواند صدا و Canvas زنده نیز ارائه کند. **Gateway** صفحه کنترل همیشه‌فعال است؛ محصول، خود دستیار است.
  </Accordion>

  <Accordion title="ارزش پیشنهادی">
    OpenClaw «فقط یک پوشش برای Claude» نیست. این یک **صفحه کنترل محلی‌محور** است که دستیاری توانمند را روی **سخت‌افزار خودتان** اجرا می‌کند، از طریق برنامه‌های گفت‌وگویی که از قبل استفاده می‌کنید در دسترس است و نشست‌های حالت‌مند، حافظه و ابزارها را فراهم می‌کند؛ بدون سپردن گردش‌های کاری شما به SaaS میزبانی‌شده.

    - **دستگاه‌های شما، داده‌های شما**: Gateway را هرجا می‌خواهید (Mac، Linux، VPS) اجرا کنید و فضای کاری و تاریخچه نشست را محلی نگه دارید.
    - **کانال‌های واقعی، نه محیط آزمایشی وب**: Discord/iMessage/Signal/Slack/Telegram/WhatsApp/و غیره، به‌علاوه صدای موبایل و Canvas در پلتفرم‌های پشتیبانی‌شده.
    - **مستقل از مدل**: از Anthropic، MiniMax، OpenAI، OpenRouter و غیره با مسیریابی و جایگزینی هنگام خرابی برای هر عامل استفاده کنید.
    - **گزینه صرفاً محلی**: مدل‌های محلی را اجرا کنید تا همه داده‌ها بتوانند روی دستگاه شما باقی بمانند.
    - **مسیریابی چندعاملی**: عامل‌ها را بر اساس کانال، حساب یا وظیفه جدا کنید؛ هرکدام فضای کاری و پیش‌فرض‌های خود را دارند.
    - **متن‌باز و قابل تغییر**: بدون وابستگی انحصاری به فروشنده، آن را بررسی، گسترش و خودمیزبانی کنید.

    مستندات: [Gateway](/fa/gateway)، [کانال‌ها](/fa/channels)، [چندعاملی](/fa/concepts/multi-agent)، [حافظه](/fa/concepts/memory).

  </Accordion>

  <Accordion title="تازه آن را راه‌اندازی کرده‌ام؛ ابتدا چه‌کار کنم؟">
    پروژه‌های مناسب برای شروع: ساخت وب‌سایت (WordPress، Shopify یا وبگاه ایستا)؛ نمونه‌سازی اولیه یک برنامه موبایل (طرح کلی، صفحه‌ها، برنامه API)؛ سازمان‌دهی فایل‌ها و پوشه‌ها؛ اتصال Gmail و خودکارسازی خلاصه‌ها یا پیگیری‌ها.

    این ابزار می‌تواند وظایف بزرگ را انجام دهد، اما بهترین عملکرد را زمانی دارد که کار به چند مرحله تقسیم شود و برای کار موازی از زیرعامل‌ها استفاده شود.

  </Accordion>

  <Accordion title="پنج مورد استفاده روزمره برتر برای OpenClaw چیست؟">
    - **گزارش‌های خلاصه شخصی**: خلاصه‌های صندوق ورودی، تقویم و اخبار مورد توجه شما.
    - **پژوهش و پیش‌نویس‌نویسی**: پژوهش سریع، خلاصه‌سازی و نخستین پیش‌نویس ایمیل‌ها یا اسناد.
    - **یادآوری‌ها و پیگیری‌ها**: تلنگرها و فهرست‌های بررسی مبتنی بر Cron یا Heartbeat.
    - **خودکارسازی مرورگر**: تکمیل فرم‌ها، گردآوری داده و تکرار وظایف وب.
    - **هماهنگی میان دستگاه‌ها**: وظیفه‌ای را از تلفن خود ارسال کنید، بگذارید Gateway آن را روی سرور اجرا کند و نتیجه را در گفت‌وگو تحویل بگیرید.

  </Accordion>

  <Accordion title="آیا OpenClaw می‌تواند برای جذب مشتری بالقوه، ارتباط‌گیری، تبلیغات و وبلاگ‌های یک SaaS کمک کند؟">
    بله، برای **پژوهش، ارزیابی و پیش‌نویس‌نویسی**: پیمایش وبگاه‌ها، ساخت فهرست‌های کوتاه، خلاصه‌سازی مشتریان بالقوه و نوشتن پیش‌نویس پیام‌های ارتباط‌گیری یا متن تبلیغاتی.

    برای **اجرای ارتباط‌گیری یا تبلیغات**، انسان را در چرخه نگه دارید. از هرزنامه خودداری کنید، قوانین محلی و سیاست‌های پلتفرم را رعایت کنید و همه‌چیز را پیش از ارسال بازبینی کنید. بگذارید OpenClaw پیش‌نویس تهیه کند؛ شما تأیید کنید.

    مستندات: [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="مزیت‌های آن در مقایسه با Claude Code برای توسعه وب چیست؟">
    OpenClaw یک **دستیار شخصی** و لایه هماهنگی است، نه جایگزین IDE. برای سریع‌ترین چرخه مستقیم کدنویسی درون مخزن، از Claude Code یا Codex استفاده کنید. برای حافظه پایدار، دسترسی میان دستگاه‌ها و هماهنگ‌سازی ابزارها، از OpenClaw استفاده کنید.

    - حافظه و فضای کاری پایدار میان نشست‌ها.
    - دسترسی چندپلتفرمی (Telegram، WhatsApp، TUI، WebChat).
    - هماهنگ‌سازی ابزارها (مرورگر، فایل‌ها، زمان‌بندی، قلاب‌ها).
    - Gateway همیشه‌فعال (اجرا روی VPS و تعامل از هرجا).
    - Nodeها برای مرورگر/صفحه‌نمایش/دوربین/اجرای محلی.

    نمونه‌ها: [https://openclaw.ai/showcase](https://openclaw.ai/showcase).

  </Accordion>
</AccordionGroup>

## Skills و خودکارسازی

<AccordionGroup>
  <Accordion title="چگونه Skills را بدون کثیف نگه‌داشتن مخزن سفارشی کنم؟">
    به‌جای ویرایش نسخه مخزن، از بازنویسی‌های مدیریت‌شده استفاده کنید. تغییرات را در `~/.openclaw/skills/<name>/SKILL.md` قرار دهید (یا از طریق `skills.load.extraDirs` در `~/.openclaw/openclaw.json` پوشه‌ای اضافه کنید). ترتیب اولویت: `<workspace>/skills` -> `<workspace>/.agents/skills` -> `~/.agents/skills` -> `~/.openclaw/skills` -> همراه -> `skills.load.extraDirs`؛ بنابراین بازنویسی‌های مدیریت‌شده بدون دست‌زدن به git بر Skills همراه اولویت دارند. برای نصب سراسری و محدودکردن نمایش به برخی عامل‌ها، نسخه مشترک را در `~/.openclaw/skills` نگه دارید و نمایش را با `agents.defaults.skills` / `agents.list[].skills` کنترل کنید. فقط ویرایش‌هایی که شایسته ارسال به بالادست هستند باید به‌صورت PR برای نسخه مخزن ارسال شوند.
  </Accordion>

  <Accordion title="آیا می‌توانم Skills را از پوشه‌ای سفارشی بارگذاری کنم؟">
    بله: پوشه‌ها را از طریق `skills.load.extraDirs` در `~/.openclaw/openclaw.json` اضافه کنید (کمترین اولویت در ترتیب بالا). `clawhub` به‌طور پیش‌فرض در `./skills` نصب می‌شود که OpenClaw در نشست بعدی آن را به‌عنوان `<workspace>/skills` در نظر می‌گیرد. برای محدودکردن نمایش به عامل‌های خاص، آن را با `agents.defaults.skills` یا `agents.list[].skills` همراه کنید.
  </Accordion>

  <Accordion title="چگونه می‌توانم برای وظایف مختلف از مدل‌ها یا تنظیمات متفاوت استفاده کنم؟">
    الگوهای پشتیبانی‌شده:

    - **کارهای Cron**: کارهای مجزا می‌توانند برای هر کار یک بازنویسی `model` تعیین کنند.
    - **عامل‌ها**: وظایف را به عامل‌های جداگانه با مدل‌های پیش‌فرض، سطوح تفکر و پارامترهای پخش متفاوت هدایت کنید.
    - **تغییر برحسب نیاز**: `/model` مدل نشست فعلی را در هر زمان تغییر می‌دهد.

    نمونه — مدل یکسان، تنظیمات متفاوت برای هر عامل:

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

    پیش‌فرض‌های مشترک هر مدل را در `agents.defaults.models["provider/model"].params` و سپس بازنویسی‌های مختص هر عامل را در `agents.list[].params` مسطح قرار دهید. مدل یکسان را زیر `agents.list[].models["provider/model"].params` تودرتو تکرار نکنید؛ آن مسیر برای کاتالوگ مدل هر عامل و بازنویسی‌های زمان اجرا است.

    به [کارهای Cron](/fa/automation/cron-jobs)، [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [پیکربندی](/fa/gateway/config-agents)، [دستورهای اسلش](/fa/tools/slash-commands) مراجعه کنید.

  </Accordion>

  <Accordion title="ربات هنگام انجام کار سنگین متوقف می‌شود. چگونه آن را واگذار کنم؟">
    برای وظایف طولانی یا موازی از **زیرعامل‌ها** استفاده کنید: آن‌ها در نشست خود اجرا می‌شوند، خلاصه‌ای برمی‌گردانند و گفت‌وگوی اصلی شما را پاسخ‌گو نگه می‌دارند. از ربات بخواهید «برای این وظیفه یک زیرعامل ایجاد کند» یا از `/subagents` استفاده کنید. برای مشاهده اینکه Gateway در حال حاضر مشغول است یا نه، از `/status` استفاده کنید.

    هم وظایف طولانی و هم زیرعامل‌ها توکن مصرف می‌کنند؛ اگر هزینه مهم است، از طریق `agents.defaults.subagents.model` مدل ارزان‌تری برای زیرعامل‌ها تعیین کنید.

    مستندات: [زیرعامل‌ها](/fa/tools/subagents)، [وظایف پس‌زمینه](/fa/automation/tasks).

  </Accordion>

  <Accordion title="نشست‌های زیرعامل وابسته به رشته در Discord چگونه کار می‌کنند؟">
    یک رشته Discord را به زیرعامل یا هدف نشست متصل کنید تا پیام‌های بعدی در آن، در همان نشست متصل باقی بمانند.

    - با `sessions_spawn` و با استفاده از `thread: true` ایجاد کنید (در صورت تمایل، `mode: "session"` برای پیگیری پایدار).
    - یا با `/focus <target>` به‌صورت دستی متصل کنید.
    - `/agents` وضعیت اتصال را بررسی می‌کند.
    - `/session idle <duration|off>` و `/session max-age <duration|off>` خروج خودکار از تمرکز را کنترل می‌کنند.
    - `/unfocus` رشته را جدا می‌کند.

    پیکربندی: `session.threadBindings.enabled` (کلید سراسری)، `session.threadBindings.idleHours` (پیش‌فرض `24`، `0` غیرفعال می‌کند)، `session.threadBindings.maxAgeHours` (پیش‌فرض `0` = بدون سقف سخت) و بازنویسی‌های هر کانال `channels.discord.threadBindings.{enabled,idleHours,maxAgeHours}`. ‏`channels.discord.threadBindings.spawnSessions` اتصال خودکار هنگام ایجاد را کنترل می‌کند (پیش‌فرض `true`).

    مستندات: [زیرعامل‌ها](/fa/tools/subagents)، [Discord](/fa/channels/discord)، [مرجع پیکربندی](/fa/gateway/configuration-reference)، [دستورهای اسلش](/fa/tools/slash-commands).

  </Accordion>

  <Accordion title="یک زیرعامل تمام شد، اما به‌روزرسانی تکمیل به جای اشتباه رفت یا هرگز ارسال نشد. چه چیزی را بررسی کنم؟">
    مسیر حل‌شده درخواست‌کننده را بررسی کنید:

    - تحویل زیرعامل در حالت تکمیل، در صورت وجود، رشته یا مسیر گفت‌وگوی متصل را ترجیح می‌دهد.
    - اگر مبدأ تکمیل فقط یک کانال داشته باشد، OpenClaw به مسیر ذخیره‌شده نشست درخواست‌کننده (`lastChannel` / `lastTo` / `lastAccountId`) برمی‌گردد تا تحویل مستقیم همچنان موفق شود.
    - بدون مسیر متصل و بدون مسیر ذخیره‌شده قابل استفاده: تحویل مستقیم ممکن است ناموفق باشد و نتیجه به‌جای ارسال فوری، به تحویل صف‌شده نشست برمی‌گردد.
    - هدف‌های نامعتبر یا منقضی نیز می‌توانند موجب بازگشت به صف یا شکست نهایی تحویل شوند.
    - اگر آخرین پاسخ قابل مشاهده دستیار فرزند دقیقاً `NO_REPLY` / `no_reply` یا `ANNOUNCE_SKIP` باشد، OpenClaw عمداً به‌جای ارسال پیشرفت قدیمی‌تر، اعلان را سرکوب می‌کند.

    عیب‌یابی: `openclaw tasks show <lookup>` که در آن `<lookup>` شناسه وظیفه، شناسه اجرا یا کلید نشست است.

    مستندات: [زیرعامل‌ها](/fa/tools/subagents)، [وظایف پس‌زمینه](/fa/automation/tasks)، [ابزارهای نشست](/fa/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron یا یادآوری‌ها اجرا نمی‌شوند. چه چیزی را بررسی کنم؟">
    Cron درون فرایند Gateway اجرا می‌شود؛ اگر Gateway به‌طور پیوسته در حال اجرا نباشد، فعال نمی‌شود.

    - تأیید کنید Cron فعال است (`cron.enabled`) و `OPENCLAW_SKIP_CRON` تنظیم نشده است.
    - تأیید کنید Gateway به‌صورت 24/7 در حال اجرا است (بدون خواب/راه‌اندازی مجدد).
    - منطقه زمانی کار را بررسی کنید (`--tz` در مقایسه با منطقه زمانی میزبان).

    اشکال‌زدایی:
    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [خودکارسازی](/fa/automation).

  </Accordion>

  <Accordion title="Cron اجرا شد، اما چیزی به کانال ارسال نشد. چرا؟">
    حالت تحویل را بررسی کنید:

    - `--no-deliver` / `delivery.mode: "none"`: انتظار نمی‌رود ارسال جایگزین اجراکننده انجام شود.
    - مقصد اعلان وجود ندارد یا نامعتبر است (`channel` / `to`): اجراکننده از تحویل خروجی صرف‌نظر کرد.
    - خطاهای احراز هویت کانال (`unauthorized`، `Forbidden`): اجراکننده برای تحویل تلاش کرد، اما اعتبارنامه‌ها مانع آن شدند.
    - یک نتیجهٔ ایزولهٔ بی‌صدا (فقط `NO_REPLY` / `no_reply`) عمداً تحویل‌ناپذیر در نظر گرفته می‌شود؛ بنابراین تحویل جایگزین صف‌شده نیز متوقف می‌شود.

    برای کارهای Cron ایزوله، اگر مسیر گفت‌وگویی در دسترس باشد، عامل همچنان می‌تواند مستقیماً با ابزار `message` ارسال کند. `--announce` فقط تحویل جایگزین اجراکننده را برای متن نهایی‌ای کنترل می‌کند که عامل پیش‌تر خودش ارسال نکرده است.

    اشکال‌زدایی:
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <lookup>
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [وظایف پس‌زمینه](/fa/automation/tasks).

  </Accordion>

  <Accordion title="چرا اجرای ایزولهٔ Cron مدل را تغییر داد یا یک‌بار دوباره تلاش کرد؟">
    این مسیر زندهٔ تغییر مدل است، نه زمان‌بندی تکراری. Cron ایزوله واگذاری مدل زمان اجرا را پایدار می‌کند و هنگامی که اجرای فعال `LiveSessionModelSwitchError` را پرتاب کند، با حفظ ارائه‌دهنده/مدل تغییرکرده (و هر بازنویسی نمایهٔ احراز هویت تغییرکرده) دوباره تلاش می‌کند.

    اولویت انتخاب مدل: ابتدا بازنویسی مدل قلاب Gmail ‏(`hooks.gmail.model`)، سپس `model` هر کار، پس از آن هر بازنویسی ذخیره‌شدهٔ مدل نشست Cron و در نهایت انتخاب عادی مدل عامل/پیش‌فرض.

    حلقهٔ تلاش مجدد به تلاش اولیه به‌اضافهٔ 2 تلاش مجدد برای تغییر محدود است؛ سپس Cron به‌جای ادامهٔ بی‌پایان حلقه متوقف می‌شود.

    اشکال‌زدایی:
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [CLI مربوط به cron](/fa/cli/cron).

  </Accordion>

  <Accordion title="چگونه Skills را روی Linux نصب کنم؟">
    از فرمان‌های بومی `openclaw skills` استفاده کنید یا Skills را در فضای کاری خود قرار دهید؛ رابط کاربری Skills در macOS روی Linux در دسترس نیست. Skills را در [https://clawhub.ai](https://clawhub.ai) مرور کنید.

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

    `openclaw skills install` بومی به‌طور پیش‌فرض در پوشهٔ `skills/` فضای کاری فعال می‌نویسد. برای نصب در پوشهٔ مدیریت‌شدهٔ مشترک Skills برای همهٔ عامل‌های محلی، `--global` را اضافه کنید. CLI جداگانهٔ `clawhub` را فقط برای انتشار یا همگام‌سازی Skills خود نصب کنید. برای محدودکردن اینکه کدام عامل‌ها Skills مشترک را ببینند، از `agents.defaults.skills` یا `agents.list[].skills` استفاده کنید.

  </Accordion>

  <Accordion title="آیا OpenClaw می‌تواند وظایف را طبق برنامه یا به‌طور پیوسته در پس‌زمینه اجرا کند؟">
    بله، از طریق زمان‌بند Gateway:

    - **کارهای Cron** برای وظایف زمان‌بندی‌شده یا تکرارشونده (پس از راه‌اندازی مجدد نیز باقی می‌مانند).
    - **Heartbeat** برای بررسی‌های دوره‌ای نشست اصلی.
    - **کارهای ایزوله** برای عامل‌های خودکاری که خلاصه‌ها را منتشر می‌کنند یا به گفت‌وگوها تحویل می‌دهند.

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [خودکارسازی](/fa/automation)، [Heartbeat](/fa/gateway/heartbeat).

  </Accordion>

  <Accordion title="آیا می‌توانم Skills مختص Apple macOS را از Linux اجرا کنم؟">
    نه به‌طور مستقیم. Skills مربوط به macOS با `metadata.openclaw.os` و فایل‌های اجرایی لازم محدود می‌شوند و فقط هنگامی بارگذاری می‌شوند که روی **میزبان Gateway** واجد شرایط باشند. در Linux، Skills صرفاً مختص `darwin` ‏(`apple-notes`، `apple-reminders`، `things-mac`) بارگذاری نمی‌شوند، مگر اینکه این محدودیت را بازنویسی کنید.

    سه الگوی پشتیبانی‌شده:

    **گزینهٔ A - اجرای Gateway روی Mac (ساده‌ترین)**. Gateway را جایی اجرا کنید که فایل‌های اجرایی macOS وجود دارند، سپس از Linux در [حالت دوردست](#gateway-ports-already-running-and-remote-mode) یا از طریق Tailscale متصل شوید. Skills به‌طور عادی بارگذاری می‌شوند، زیرا میزبان Gateway ‏macOS است.

    **گزینهٔ B - استفاده از یک Node مربوط به macOS (بدون SSH)**. Gateway را روی Linux اجرا کنید، یک Node مربوط به macOS (برنامهٔ نوار منو) را جفت کنید و **Node Run Commands** را روی Mac روی "Always Ask" یا "Always Allow" تنظیم کنید. OpenClaw وقتی فایل‌های اجرایی لازم روی Node وجود داشته باشند، Skills مختص macOS را واجد شرایط در نظر می‌گیرد؛ عامل آن‌ها را از طریق ابزار `nodes` اجرا می‌کند. با "Always Ask"، تأیید "Always Allow" در پیام درخواست، آن فرمان را به فهرست مجاز اضافه می‌کند.

    **گزینهٔ C - پراکسی‌کردن فایل‌های اجرایی macOS از طریق SSH (پیشرفته)**. Gateway را روی Linux نگه دارید، اما کاری کنید فایل‌های اجرایی CLI لازم به پوشش‌های SSH منتهی شوند که روی یک Mac اجرا می‌شوند؛ سپس Skill را بازنویسی کنید تا Linux را مجاز کند و واجد شرایط باقی بماند.

    1. یک پوشش SSH برای فایل اجرایی ایجاد کنید (مثال: `memo` برای Apple Notes):
       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```
    2. پوشش را روی `PATH` میزبان Linux قرار دهید (برای مثال `~/bin/memo`).
    3. فرادادهٔ Skill را بازنویسی کنید (فضای کاری یا `~/.openclaw/skills`) تا Linux مجاز شود:
       ```markdown
       ---
       name: apple-notes
       description: مدیریت Apple Notes از طریق CLI مربوط به memo در macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```
    4. نشست جدیدی آغاز کنید تا تصویر لحظه‌ای Skills تازه‌سازی شود.

  </Accordion>

  <Accordion title="آیا یک یکپارچه‌سازی Notion یا HeyGen دارید؟">
    در حال حاضر به‌صورت داخلی وجود ندارد. گزینه‌ها:

    - **Skill / Plugin سفارشی**: بهترین گزینه برای دسترسی مطمئن به API است (هر دو API دارند).
    - **خودکارسازی مرورگر**: بدون کدنویسی کار می‌کند، اما کندتر و شکننده‌تر است.

    برای زمینهٔ مجزای هر مشتری به سبک آژانسی: برای هر مشتری یک صفحهٔ Notion نگه دارید (زمینه + ترجیحات + کار فعال) و از عامل بخواهید در آغاز نشست آن صفحه را دریافت کند.

    برای یک یکپارچه‌سازی بومی، یک درخواست قابلیت باز کنید یا Skillی بر پایهٔ آن APIها بسازید.

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    نصب‌های بومی در پوشهٔ `skills/` فضای کاری فعال قرار می‌گیرند؛ برای همهٔ عامل‌های محلی از `--global` استفاده کنید، یا برای محدودکردن مشاهده‌پذیری `agents.defaults.skills` / `agents.list[].skills` را پیکربندی کنید. برخی Skills انتظار فایل‌های اجرایی نصب‌شده با Homebrew را دارند؛ در Linux این یعنی Linuxbrew.

    [Skills](/fa/tools/skills)، [پیکربندی Skills](/fa/tools/skills-config)، [ClawHub](/fa/clawhub) را ببینید.

  </Accordion>

  <Accordion title="چگونه از Chrome موجود خود که وارد حساب شده است با OpenClaw استفاده کنم؟">
    از نمایهٔ داخلی مرورگر `user` استفاده کنید که از طریق Chrome DevTools MCP متصل می‌شود:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    برای یک نام سفارشی، یک نمایهٔ صریح MCP ایجاد کنید:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    این می‌تواند از مرورگر میزبان محلی یا یک Node مرورگر متصل استفاده کند. اگر Gateway جای دیگری اجرا می‌شود، یک میزبان Node روی دستگاه مرورگر اجرا کنید یا از CDP راه دور استفاده کنید.

    محدودیت‌های فعلی نمایه‌های `existing-session` / `user` در مقایسه با نمایهٔ مدیریت‌شدهٔ `openclaw`:

    - `click`، `type`، `hover`، `scrollIntoView`، `drag` و `select` به ارجاع‌های تصویر لحظه‌ای نیاز دارند، نه انتخابگرهای CSS.
    - قلاب‌های بارگذاری به `ref` یا `inputRef` نیاز دارند؛ هر بار یک فایل و بدون `element` مربوط به CSS.
    - `responsebody`، خروجی PDF، رهگیری بارگیری و کنش‌های دسته‌ای همچنان به مسیر مرورگر مدیریت‌شده نیاز دارند.

    برای مقایسهٔ کامل، [مرورگر](/fa/tools/browser#existing-session-via-chrome-devtools-mcp) را ببینید.

  </Accordion>
</AccordionGroup>

## جعبهٔ شنی و حافظه

<AccordionGroup>
  <Accordion title="آیا مستندات اختصاصی برای جعبهٔ شنی وجود دارد؟">
    بله: [جعبهٔ شنی](/fa/gateway/sandboxing). برای راه‌اندازی مختص Docker (Gateway کامل در Docker یا تصاویر جعبهٔ شنی)، [Docker](/fa/install/docker) را ببینید.
  </Accordion>

  <Accordion title="Docker محدود به نظر می‌رسد؛ چگونه همهٔ قابلیت‌ها را فعال کنم؟">
    تصویر پیش‌فرض امنیت‌محور است و با کاربر `node` اجرا می‌شود؛ بنابراین بسته‌های سیستمی، Homebrew و مرورگرهای همراه را شامل نمی‌شود. برای راه‌اندازی کامل‌تر:

    - `/home/node` را با `OPENCLAW_HOME_VOLUME` پایدار کنید تا حافظه‌های نهان باقی بمانند.
    - وابستگی‌های سیستمی را با `OPENCLAW_IMAGE_APT_PACKAGES` درون تصویر بگنجانید.
    - مرورگرهای Playwright را از طریق CLI همراه نصب کنید: `node /app/node_modules/playwright-core/cli.js install chromium`.
    - `PLAYWRIGHT_BROWSERS_PATH` را تنظیم و آن مسیر را پایدار کنید.

    مستندات: [Docker](/fa/install/docker)، [مرورگر](/fa/tools/browser).

  </Accordion>

  <Accordion title="آیا می‌توانم با یک عامل، پیام‌های مستقیم را شخصی نگه دارم اما گروه‌ها را عمومی/جعبه‌شنی کنم؟">
    بله، اگر ترافیک خصوصی **پیام‌های مستقیم** و ترافیک عمومی **گروه‌ها** باشد. `agents.defaults.sandbox.mode: "non-main"` را تنظیم کنید تا نشست‌های گروه/کانال (کلیدهای غیر اصلی) در پس‌زمینهٔ جعبهٔ شنی پیکربندی‌شده اجرا شوند، درحالی‌که نشست اصلی پیام مستقیم روی میزبان باقی می‌ماند. پس از فعال‌شدن جعبهٔ شنی، Docker پس‌زمینهٔ پیش‌فرض است. ابزارهای در دسترس در نشست‌های جعبه‌شنی را از طریق `tools.sandbox.tools` محدود کنید.

    راهنمای راه‌اندازی: [گروه‌ها: پیام‌های مستقیم شخصی + گروه‌های عمومی](/fa/channels/groups#pattern-personal-dms-public-groups-single-agent). مرجع کلیدی: [پیکربندی Gateway](/fa/gateway/config-agents#agentsdefaultssandbox).

  </Accordion>

  <Accordion title="چگونه یک پوشهٔ میزبان را به جعبهٔ شنی متصل کنم؟">
    `agents.defaults.sandbox.docker.binds` را روی `["host:container:mode"]` تنظیم کنید (برای مثال `"/home/user/src:/src:ro"`). اتصال‌های سراسری و مختص عامل ادغام می‌شوند؛ وقتی `scope: "shared"` باشد، اتصال‌های مختص عامل نادیده گرفته می‌شوند. برای هر مورد حساس از `:ro` استفاده کنید؛ اتصال‌ها دیواره‌های سیستم فایل جعبهٔ شنی را دور می‌زنند.

    OpenClaw منابع اتصال را هم در برابر مسیر عادی‌سازی‌شده و هم در برابر مسیر متعارفی که از طریق عمیق‌ترین نیای موجود حل شده است اعتبارسنجی می‌کند؛ بنابراین گریز از طریق والد پیوند نمادین، حتی وقتی بخش نهایی مسیر هنوز وجود ندارد، به‌صورت ایمن رد می‌شود.

    [جعبهٔ شنی](/fa/gateway/sandboxing#custom-bind-mounts) و [جعبهٔ شنی در برابر خط‌مشی ابزار در برابر سطح دسترسی بالاتر](/fa/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) را ببینید.

  </Accordion>

  <Accordion title="حافظه چگونه کار می‌کند؟">
    حافظهٔ OpenClaw شامل فایل‌های Markdown در فضای کاری عامل است: یادداشت‌های روزانه در `memory/YYYY-MM-DD.md` و یادداشت‌های بلندمدت گزینش‌شده در `MEMORY.md` (فقط نشست‌های اصلی/خصوصی).

    OpenClaw همچنین پیش از آنکه Compaction گفت‌وگو را خلاصه کند، یک **تخلیهٔ حافظهٔ بی‌صدای پیش از Compaction** اجرا می‌کند و به مدل یادآوری می‌کند ابتدا یادداشت‌های ماندگار را بنویسد. این فرایند فقط هنگامی اجرا می‌شود که فضای کاری قابل نوشتن باشد (جعبه‌های شنی فقط‌خواندنی از آن صرف‌نظر می‌کنند)؛ برای غیرفعال‌کردن از `agents.defaults.compaction.memoryFlush.enabled: false` استفاده کنید. [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>

  <Accordion title="حافظه مدام چیزها را فراموش می‌کند. چگونه آن‌ها را ماندگار کنم؟">
    از ربات بخواهید **واقعیت را در حافظه بنویسد**: یادداشت‌های بلندمدت در `MEMORY.md` و زمینهٔ کوتاه‌مدت در `memory/YYYY-MM-DD.md` قرار می‌گیرند. یادآوری به مدل برای ذخیرهٔ خاطرات معمولاً مشکل را برطرف می‌کند. اگر همچنان فراموش می‌کند، بررسی کنید که Gateway در هر اجرا از همان فضای کاری استفاده کند.

    مستندات: [حافظه](/fa/concepts/memory)، [فضای کاری عامل](/fa/concepts/agent-workspace).

  </Accordion>

  <Accordion title="آیا حافظه برای همیشه باقی می‌ماند؟ محدودیت‌ها چیست؟">
    فایل‌های حافظه روی دیسک قرار دارند و تا زمان حذف‌شدن باقی می‌مانند؛ محدودیت، فضای ذخیره‌سازی شماست، نه مدل. **بافت نشست** همچنان به پنجرهٔ بافت مدل محدود است، بنابراین مکالمه‌های طولانی ممکن است فشرده یا کوتاه شوند—به همین دلیل جست‌وجوی حافظه وجود دارد و فقط بخش‌های مرتبط را دوباره وارد بافت می‌کند.

    مستندات: [حافظه](/fa/concepts/memory)، [بافت](/fa/concepts/context).

  </Accordion>

  <Accordion title="آیا جست‌وجوی معنایی حافظه به کلید API ‏OpenAI نیاز دارد؟">
    فقط اگر از **تعبیه‌سازی‌های OpenAI** استفاده کنید که ارائه‌دهندهٔ پیش‌فرض است. OAuth ‏Codex چت/تکمیل‌ها را پوشش می‌دهد و دسترسی به تعبیه‌سازی‌ها را **اعطا نمی‌کند**، بنابراین ورود با Codex (از طریق OAuth یا ورود با Codex CLI) جست‌وجوی معنایی حافظه را فعال نمی‌کند. تعبیه‌سازی‌های OpenAI همچنان به یک کلید API واقعی نیاز دارند (`OPENAI_API_KEY` یا `models.providers.openai.apiKey`).

    برای اجرای محلی، `agents.defaults.memorySearch.provider: "local"` (GGUF/llama.cpp) را تنظیم کنید. سایر ارائه‌دهندگان پشتیبانی‌شده: Bedrock، DeepInfra، Gemini ‏(`GEMINI_API_KEY` یا `memorySearch.remote.apiKey`)، GitHub Copilot، LM Studio، Mistral، Ollama، سازگار با OpenAI و Voyage. برای جزئیات راه‌اندازی، [حافظه](/fa/concepts/memory) و [جست‌وجوی حافظه](/fa/concepts/memory-search) را ببینید.

  </Accordion>
</AccordionGroup>

## محل ذخیرهٔ موارد روی دیسک

<AccordionGroup>
  <Accordion title="آیا همهٔ داده‌های استفاده‌شده با OpenClaw به‌صورت محلی ذخیره می‌شوند؟">
    خیر: **وضعیت خود OpenClaw محلی است**، اما **سرویس‌های خارجی همچنان مواردی را که برایشان ارسال می‌کنید می‌بینند**.

    - **به‌طور پیش‌فرض محلی**: نشست‌ها، فایل‌های حافظه، پیکربندی و فضای کاری روی میزبان Gateway قرار دارند (`~/.openclaw` به‌همراه پوشهٔ فضای کاری شما).
    - **بنا به ضرورت راه‌دور**: پیام‌های ارسال‌شده به ارائه‌دهندگان مدل (Anthropic/OpenAI/و غیره) به APIهای آن‌ها می‌روند و پلتفرم‌های چت (Slack/Telegram/WhatsApp/و غیره) داده‌های پیام را روی سرورهای خود ذخیره می‌کنند.
    - **ردپای داده را شما کنترل می‌کنید**: مدل‌های محلی درخواست‌ها را روی دستگاه شما نگه می‌دارند، اما ترافیک کانال همچنان از سرورهای آن کانال عبور می‌کند.

    مرتبط: [فضای کاری عامل](/fa/concepts/agent-workspace)، [حافظه](/fa/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw داده‌های خود را کجا ذخیره می‌کند؟">
    همه‌چیز در `$OPENCLAW_STATE_DIR` قرار دارد (پیش‌فرض: `~/.openclaw`):

    | مسیر                                                               | کاربرد                                                            |
    | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                                 | پیکربندی اصلی (JSON5)                                                 |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                        | واردکردن OAuth قدیمی (در نخستین استفاده در پروفایل‌های احراز هویت کپی می‌شود)        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json`     | پروفایل‌های احراز هویت (OAuth، کلیدهای API، `keyRef`/`tokenRef` اختیاری)        |
    | `$OPENCLAW_STATE_DIR/secrets.json`                                  | محتوای محرمانهٔ اختیاری مبتنی بر فایل برای ارائه‌دهندگان SecretRef ‏`file`   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`              | فایل سازگاری قدیمی (ورودی‌های ایستای `api_key` پاک‌سازی شده‌اند)        |
    | `$OPENCLAW_STATE_DIR/credentials/`                                  | وضعیت ارائه‌دهنده (برای مثال `whatsapp/<accountId>/creds.json`)      |
    | `$OPENCLAW_STATE_DIR/agents/`                                       | وضعیت هر عامل (agentDir به‌همراه آثار قدیمی/بایگانی‌شدهٔ نشست)        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/openclaw-agent.sqlite`  | وضعیت SQLite هر عامل، شامل ردیف‌های نشست و رونوشت‌ها      |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                    | منابع مهاجرت نشست قدیمی و آثار بایگانی/پشتیبانی      |

    مسیر قدیمی تک‌عاملی `~/.openclaw/agent/*` توسط `openclaw doctor` مهاجرت داده می‌شود.

    **فضای کاری** شما (AGENTS.md، فایل‌های حافظه، Skills و غیره) جداست و از طریق `agents.defaults.workspace` پیکربندی می‌شود (پیش‌فرض: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md باید کجا قرار گیرند؟">
    این فایل‌ها در **فضای کاری عامل** قرار می‌گیرند، نه در `~/.openclaw`.

    - **فضای کاری (برای هر عامل)**: `AGENTS.md`، `SOUL.md`، `IDENTITY.md`، `USER.md`، `MEMORY.md`، `memory/YYYY-MM-DD.md`، و `HEARTBEAT.md` اختیاری. ریشهٔ حروف‌کوچک `memory.md` فقط ورودی تعمیر قدیمی است؛ وقتی هر دو وجود داشته باشند، `openclaw doctor --fix` می‌تواند آن را با `MEMORY.md` ادغام کند.
    - **پوشهٔ وضعیت (`~/.openclaw`)**: پیکربندی، وضعیت کانال/ارائه‌دهنده، پروفایل‌های احراز هویت، نشست‌ها، گزارش‌ها و Skills مشترک (`~/.openclaw/skills`).

    فضای کاری پیش‌فرض `~/.openclaw/workspace` است و می‌توان آن را پیکربندی کرد:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    اگر ربات پس از راه‌اندازی مجدد «فراموش می‌کند»، تأیید کنید که Gateway در هر اجرا از همان فضای کاری استفاده می‌کند (حالت راه‌دور از فضای کاری **میزبان Gateway** استفاده می‌کند، نه لپ‌تاپ محلی شما).

    نکته: برای رفتار یا ترجیح پایدار، از ربات بخواهید به‌جای تکیه بر تاریخچهٔ چت، **آن را در AGENTS.md یا MEMORY.md بنویسد**.

    [فضای کاری عامل](/fa/concepts/agent-workspace) و [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>

  <Accordion title="آیا می‌توانم SOUL.md را بزرگ‌تر کنم؟">
    بله. `SOUL.md` یکی از فایل‌های راه‌انداز فضای کاری است که به بافت عامل تزریق می‌شود. محدودیت پیش‌فرض تزریق برای هر فایل `20000` نویسه است؛ بودجهٔ کلی راه‌اندازی در همهٔ فایل‌ها `60000` نویسه است.

    پیش‌فرض‌های مشترک را تغییر دهید:

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

    یا یک عامل را در `agents.list[].bootstrapMaxChars` / `bootstrapTotalMaxChars` بازنویسی کنید.

    برای بررسی اندازه‌های خام در مقایسه با اندازه‌های تزریق‌شده و اینکه آیا کوتاه‌سازی رخ داده است، از `/context` استفاده کنید. `SOUL.md` را بر لحن، موضع و شخصیت متمرکز نگه دارید؛ قواعد عملیاتی را در `AGENTS.md` و واقعیت‌های پایدار را در حافظه قرار دهید.

    [بافت](/fa/concepts/context) و [پیکربندی عامل](/fa/gateway/config-agents) را ببینید.

  </Accordion>

  <Accordion title="راهبرد پیشنهادی پشتیبان‌گیری">
    **فضای کاری عامل** خود را در یک مخزن git **خصوصی** قرار دهید و از آن در مکانی خصوصی پشتیبان بگیرید (برای مثال GitHub خصوصی). این کار حافظه و فایل‌های AGENTS/SOUL/USER را ثبت می‌کند و به شما امکان می‌دهد بعداً «ذهن» دستیار را بازیابی کنید.

    هیچ‌چیز از زیر `~/.openclaw` (اعتبارنامه‌ها، نشست‌ها، توکن‌ها، محتوای رمزگذاری‌شدهٔ اسرار) را commit **نکنید**. برای بازیابی کامل، از فضای کاری و پوشهٔ وضعیت به‌صورت جداگانه پشتیبان بگیرید.

    مستندات: [فضای کاری عامل](/fa/concepts/agent-workspace).

  </Accordion>

  <Accordion title="چگونه OpenClaw را کاملاً حذف کنم؟">
    [حذف نصب](/fa/install/uninstall) را ببینید.
  </Accordion>

  <Accordion title="آیا عامل‌ها می‌توانند بیرون از فضای کاری فعالیت کنند؟">
    بله. فضای کاری **cwd پیش‌فرض** و لنگر حافظه است، نه یک sandbox سخت‌گیرانه. مسیرهای نسبی درون فضای کاری تفکیک می‌شوند؛ مسیرهای مطلق می‌توانند به سایر مکان‌های میزبان دسترسی پیدا کنند، مگر اینکه sandbox فعال باشد. برای جداسازی، از [`agents.defaults.sandbox`](/fa/gateway/sandboxing) یا تنظیمات sandbox هر عامل استفاده کنید. برای تبدیل یک مخزن به پوشهٔ کاری پیش‌فرض، `workspace` آن عامل را به ریشهٔ مخزن اشاره دهید—خود مخزن OpenClaw فقط کد منبع است، بنابراین فضای کاری را جدا نگه دارید، مگر اینکه عمداً بخواهید عامل درون آن کار کند.

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

  <Accordion title="حالت راه‌دور: مخزن نشست کجاست؟">
    وضعیت نشست متعلق به **میزبان Gateway** است. در حالت راه‌دور، مخزن نشست موردنظر شما روی دستگاه راه‌دور قرار دارد، نه لپ‌تاپ محلی‌تان. [مدیریت نشست](/fa/concepts/session) را ببینید.
  </Accordion>
</AccordionGroup>

## مبانی پیکربندی

<AccordionGroup>
  <Accordion title="قالب پیکربندی چیست؟ کجا قرار دارد؟">
    OpenClaw یک پیکربندی اختیاری **JSON5** را از `$OPENCLAW_CONFIG_PATH` می‌خواند (پیش‌فرض: `~/.openclaw/openclaw.json`). اگر فایل وجود نداشته باشد، از پیش‌فرض‌های نسبتاً امن، از جمله فضای کاری پیش‌فرض `~/.openclaw/workspace`، استفاده می‌کند.
  </Accordion>

  <Accordion title='gateway.bind: "lan" (یا "tailnet") را تنظیم کردم و اکنون هیچ‌چیز گوش نمی‌دهد / رابط کاربری می‌گوید مجاز نیست'>
    اتصال‌های غیر-loopback **به یک مسیر معتبر احراز هویت Gateway نیاز دارند**: احراز هویت با راز مشترک (توکن یا گذرواژه)، یا `gateway.auth.mode: "trusted-proxy"` پشت یک پراکسی معکوس هویت‌آگاه که به‌درستی پیکربندی شده باشد.

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

    - `gateway.remote.token` / `.password` به‌تنهایی احراز هویت محلی Gateway را فعال **نمی‌کنند**؛ مسیرهای فراخوانی محلی فقط زمانی می‌توانند از `gateway.remote.*` به‌عنوان بازگشت استفاده کنند که `gateway.auth.*` تنظیم نشده باشد.
    - برای احراز هویت با گذرواژه، `gateway.auth.mode: "password"` را به‌همراه `gateway.auth.password` (یا `OPENCLAW_GATEWAY_PASSWORD`) تنظیم کنید.
    - اگر `gateway.auth.token` / `.password` صراحتاً از طریق SecretRef پیکربندی شده باشد و تفکیک نشود، فرایند تفکیک به‌صورت بسته شکست می‌خورد (هیچ بازگشت راه‌دوری آن را پنهان نمی‌کند).
    - راه‌اندازی‌های رابط کاربری Control با راز مشترک از طریق `connect.params.auth.token` یا `connect.params.auth.password` احراز هویت می‌شوند (در تنظیمات برنامه/رابط کاربری ذخیره می‌شود). حالت‌های دارای هویت مانند Tailscale Serve یا `trusted-proxy` به‌جای آن از سرآیندهای درخواست استفاده می‌کنند—از قراردادن رازهای مشترک در URLها خودداری کنید.
    - با `gateway.auth.mode: "trusted-proxy"`، پراکسی‌های معکوس loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح و یک ورودی loopback در `gateway.trustedProxies` نیاز دارند.

  </Accordion>

  <Accordion title="چرا اکنون روی localhost به توکن نیاز دارم؟">
    OpenClaw احراز هویت Gateway را به‌طور پیش‌فرض، از جمله برای loopback، اعمال می‌کند. اگر هیچ مسیر احراز هویت صریحی پیکربندی نشده باشد، راه‌اندازی به حالت توکن می‌رود و برای همان راه‌اندازی یک توکن صرفاً زمان‌اجرا تولید می‌کند؛ بنابراین کلاینت‌های WS محلی باید احراز هویت شوند. این کار مانع می‌شود سایر فرایندهای محلی Gateway را فراخوانی کنند.

    هنگامی که کلاینت‌ها به یک راز پایدار میان راه‌اندازی‌های مجدد نیاز دارند، `gateway.auth.token`، `gateway.auth.password`، `OPENCLAW_GATEWAY_TOKEN` یا `OPENCLAW_GATEWAY_PASSWORD` را صراحتاً پیکربندی کنید. همچنین می‌توانید حالت گذرواژه یا `trusted-proxy` را برای پراکسی‌های معکوس هویت‌آگاه انتخاب کنید. برای loopback باز، `gateway.auth.mode: "none"` را صراحتاً تنظیم کنید. `openclaw doctor --generate-gateway-token` در هر زمان یک توکن تولید می‌کند.

  </Accordion>

  <Accordion title="آیا پس از تغییر پیکربندی باید راه‌اندازی مجدد کنم؟">
    Gateway پیکربندی را زیر نظر می‌گیرد و از بارگذاری مجدد آنی پشتیبانی می‌کند: `gateway.reload.mode: "hybrid"` (پیش‌فرض) تغییرات امن را به‌صورت آنی اعمال می‌کند و برای تغییرات حیاتی راه‌اندازی مجدد انجام می‌دهد. `hot`، `restart` و `off` نیز پشتیبانی می‌شوند. بیشتر تغییرات `tools.*`، سیاست `agents.*`، `session.*` و `messages.*` بلافاصله و بدون هیچ اقدام بارگذاری مجددی اعمال می‌شوند؛ تغییرات اتصال/درگاه `gateway.*` به راه‌اندازی مجدد نیاز دارند.
  </Accordion>

  <Accordion title="چگونه شعارهای بامزهٔ CLI را غیرفعال کنم؟">
    `cli.banner.taglineMode` را تنظیم کنید:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: متن شعار را پنهان می‌کند، اما خط عنوان/نسخهٔ بنر را نگه می‌دارد.
    - `default`: همیشه از `All your chats, one OpenClaw.` استفاده می‌کند.
    - `random`: شعارهای بامزه/فصلی چرخشی (رفتار پیش‌فرض).
    - برای حذف کامل بنر، متغیر محیطی `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

  </Accordion>

  <Accordion title="چگونه جست‌وجوی وب (و واکشی وب) را فعال کنم؟">
    `web_fetch` بدون کلید API کار می‌کند. `web_search` به ارائه‌دهندهٔ انتخابی شما بستگی دارد:

    | ارائه‌دهنده | بدون نیاز به کلید | متغیر(های) محیطی |
    | --- | --- | --- |
    | Brave | خیر | `BRAVE_API_KEY` |
    | DuckDuckGo | بله (غیررسمی و مبتنی بر HTML) | - |
    | Exa | خیر | `EXA_API_KEY` |
    | Firecrawl | خیر | `FIRECRAWL_API_KEY` |
    | Gemini | خیر | `GEMINI_API_KEY` |
    | Grok | خیر (OAuth متعلق به xAI یا کلید) | `XAI_API_KEY` |
    | Kimi | خیر | `KIMI_API_KEY` یا `MOONSHOT_API_KEY` |
    | MiniMax Search | خیر | `MINIMAX_CODE_PLAN_KEY`، `MINIMAX_CODING_API_KEY` یا `MINIMAX_API_KEY` |
    | Ollama Web Search | بله (به `ollama signin` نیاز دارد) | - |
    | Perplexity | خیر | `PERPLEXITY_API_KEY` یا `OPENROUTER_API_KEY` |
    | SearXNG | بله (خودمیزبان) | `SEARXNG_BASE_URL` |
    | Tavily | خیر | `TAVILY_API_KEY` |

    Grok همچنین می‌تواند از OAuth متعلق به xAI در احراز هویت مدل (`openclaw onboard --auth-choice xai-oauth`) دوباره استفاده کند.

    **توصیه‌شده**: `openclaw configure --section web` و یک ارائه‌دهنده انتخاب کنید.

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
            provider: "firecrawl", // اختیاری؛ برای تشخیص خودکار حذف کنید
          },
        },
      },
    }
    ```

    پیکربندی جست‌وجوی وب ویژه هر ارائه‌دهنده در `plugins.entries.<plugin>.config.webSearch.*` قرار دارد. مسیرهای قدیمی ارائه‌دهنده در `tools.web.search.*` همچنان برای سازگاری بارگذاری می‌شوند، اما نباید در پیکربندی‌های جدید استفاده شوند. پیکربندی جایگزین واکشی وب Firecrawl در `plugins.entries.firecrawl.config.webFetch.*` قرار دارد.

    - فهرست‌های مجاز: `web_search`/`web_fetch`/`x_search` را اضافه کنید، یا برای هر سه از `group:web` استفاده کنید.
    - `web_fetch` به‌طور پیش‌فرض فعال است.
    - اگر `tools.web.fetch.provider` حذف شده باشد، OpenClaw نخستین ارائه‌دهنده آماده جایگزین واکشی را بر اساس اعتبارنامه‌های موجود به‌طور خودکار تشخیص می‌دهد؛ Plugin رسمی Firecrawl این قابلیت جایگزین را فراهم می‌کند.
    - دیمون‌ها متغیرهای محیطی را از `~/.openclaw/.env` (یا محیط سرویس) می‌خوانند.

    مستندات: [ابزارهای وب](/fa/tools/web).

  </Accordion>

  <Accordion title="config.apply پیکربندی من را پاک کرد. چگونه آن را بازیابی و از تکرار این اتفاق جلوگیری کنم؟">
    `config.apply` **کل پیکربندی** را جایگزین می‌کند؛ یک شیء جزئی همه موارد دیگر را حذف می‌کند.

    نسخه فعلی OpenClaw در برابر بیشتر بازنویسی‌های تصادفی محافظت می‌کند:

    - عملیات نوشتن پیکربندی تحت مالکیت OpenClaw، پیش از نوشتن کل پیکربندی حاصل از تغییر را اعتبارسنجی می‌کند.
    - عملیات نوشتن نامعتبر یا مخرب تحت مالکیت OpenClaw رد می‌شود و با نام `openclaw.json.rejected.*` ذخیره می‌شود.
    - ویرایش مستقیمی که راه‌اندازی یا بارگذاری مجدد فوری را مختل کند، باعث می‌شود Gateway به‌صورت بسته شکست بخورد یا از بارگذاری مجدد صرف‌نظر کند؛ این کار `openclaw.json` را بازنویسی نمی‌کند.
    - `openclaw doctor --fix` مسئول تعمیر است، می‌تواند آخرین نسخه سالم شناخته‌شده را بازیابی کند و فایل ردشده را با نام `openclaw.json.clobbered.*` ذخیره می‌کند.

    بازیابی:

    - در `openclaw logs --follow` به‌دنبال `Invalid config at`، `Config write rejected:` یا `config reload skipped (invalid config)` بگردید.
    - جدیدترین `openclaw.json.clobbered.*` یا `openclaw.json.rejected.*` کنار پیکربندی فعال را بررسی کنید.
    - `openclaw config validate` و `openclaw doctor --fix` را اجرا کنید.
    - فقط کلیدهای موردنظر را با `openclaw config set` یا `config.patch` بازگردانید.
    - اگر آخرین نسخه سالم شناخته‌شده یا محتوای ردشده‌ای وجود ندارد: از نسخه پشتیبان بازیابی کنید، یا `openclaw doctor` را دوباره اجرا و کانال‌ها/مدل‌ها را مجدداً پیکربندی کنید.
    - در صورت از‌دست‌رفتن غیرمنتظره: با آخرین پیکربندی شناخته‌شده یا یک نسخه پشتیبان، گزارش اشکال ثبت کنید. یک عامل کدنویسی محلی اغلب می‌تواند از روی گزارش‌ها یا تاریخچه، پیکربندی سالمی را بازسازی کند.

    برای پیشگیری: برای تغییرات کوچک از `openclaw config set`، برای ویرایش تعاملی از `openclaw configure`، برای بررسی مسیری ناآشنا از `config.schema.lookup` (یک گره کم‌عمق طرح‌واره به‌همراه خلاصه فرزندان مستقیم را برمی‌گرداند) و برای ویرایش‌های جزئی RPC از `config.patch` استفاده کنید؛ `config.apply` را فقط برای جایگزینی کامل پیکربندی نگه دارید. ابزار زمان‌اجرای `gateway` که در اختیار عامل قرار دارد، حتی از طریق نام‌های مستعار قدیمی `tools.bash.*` نیز از بازنویسی `tools.exec.ask` / `tools.exec.security` خودداری می‌کند.

    مستندات: [پیکربندی](/fa/cli/config)، [پیکربندی تعاملی](/fa/cli/configure)، [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-rejected-invalid-config)، [Doctor](/fa/gateway/doctor).

  </Accordion>

  <Accordion title="چگونه یک Gateway مرکزی را با کارکنان تخصصی در چند دستگاه اجرا کنم؟">
    الگوی رایج: **یک Gateway** (برای مثال یک Raspberry Pi) به‌همراه **Nodeها** و **عامل‌ها**.

    - **Gateway (مرکزی)**: مالک کانال‌ها (Signal/WhatsApp)، مسیریابی و نشست‌ها است.
    - **Nodeها (دستگاه‌ها)**: دستگاه‌های Mac/iOS/Android به‌عنوان تجهیزات جانبی متصل می‌شوند و ابزارهای محلی (`system.run`، `canvas`، `camera`) را ارائه می‌کنند.
    - **عامل‌ها (کارکنان)**: مغزها/فضاهای کاری جداگانه برای نقش‌های تخصصی (برای مثال عملیات در برابر داده‌های شخصی).
    - **زیرعامل‌ها**: برای اجرای موازی، کارهای پس‌زمینه را از یک عامل اصلی ایجاد می‌کنند.
    - **TUI**: به Gateway متصل شوید و میان عامل‌ها/نشست‌ها جابه‌جا شوید.

    مستندات: [Nodeها](/fa/nodes)، [دسترسی راه‌دور](/fa/gateway/remote)، [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [زیرعامل‌ها](/fa/tools/subagents)، [TUI](/fa/web/tui).

  </Accordion>

  <Accordion title="آیا مرورگر OpenClaw می‌تواند به‌صورت بدون رابط گرافیکی اجرا شود؟">
    بله:

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

    مقدار پیش‌فرض `false` (با رابط گرافیکی) است. حالت بدون رابط گرافیکی در برخی وب‌سایت‌ها احتمال بیشتری دارد که بررسی‌های ضدربات را فعال کند (X/Twitter اغلب نشست‌های بدون رابط گرافیکی را مسدود می‌کند). این حالت از همان موتور Chromium استفاده می‌کند و برای بیشتر خودکارسازی‌ها کار می‌کند؛ تفاوت اصلی، نبود پنجره قابل‌مشاهده مرورگر است (برای مشاهده بصری از نماگرفت استفاده کنید). [مرورگر](/fa/tools/browser) را ببینید.

  </Accordion>

  <Accordion title="چگونه از Brave برای کنترل مرورگر استفاده کنم؟">
    `browser.executablePath` را روی فایل اجرایی Brave خود (یا هر مرورگر مبتنی بر Chromium) تنظیم و Gateway را مجدداً راه‌اندازی کنید. [مرورگر](/fa/tools/browser#use-brave-or-another-chromium-based-browser) را ببینید.
  </Accordion>
</AccordionGroup>

## Gatewayها و Nodeهای راه‌دور

<AccordionGroup>
  <Accordion title="فرمان‌ها چگونه میان Telegram، Gateway و Nodeها منتقل می‌شوند؟">
    پیام‌های Telegram توسط **Gateway** مدیریت می‌شوند؛ Gateway عامل را اجرا می‌کند و تنها در صورت نیاز به ابزار Node، از طریق **وب‌سوکت Gateway** آن Node را فراخوانی می‌کند:

    Telegram -> Gateway -> عامل -> `node.*` -> Node -> Gateway -> Telegram

    Nodeها ترافیک ورودی ارائه‌دهنده را نمی‌بینند؛ آن‌ها فقط فراخوانی‌های RPC مربوط به Node را دریافت می‌کنند.

  </Accordion>

  <Accordion title="اگر Gateway از راه دور میزبانی شود، عامل من چگونه می‌تواند به رایانه‌ام دسترسی پیدا کند؟">
    رایانه خود را به‌عنوان یک **Node** جفت کنید. Gateway در جای دیگری اجرا می‌شود، اما می‌تواند ابزارهای `node.*` (صفحه‌نمایش، دوربین، سیستم) را از طریق وب‌سوکت Gateway روی دستگاه محلی شما فراخوانی کند.

    1. Gateway را روی میزبان همیشه‌روشن (VPS/سرور خانگی) اجرا کنید.
    2. میزبان Gateway و رایانه خود را در یک tailnet قرار دهید.
    3. مطمئن شوید وب‌سوکت Gateway قابل‌دسترسی است (اتصال به tailnet یا تونل SSH).
    4. برنامه macOS را به‌صورت محلی باز کنید و در حالت **Remote over SSH** (یا مستقیماً از طریق tailnet) متصل شوید تا به‌عنوان یک Node ثبت شود.
    5. Node را تأیید کنید:
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    به پل TCP جداگانه‌ای نیاز نیست؛ Nodeها از طریق وب‌سوکت Gateway متصل می‌شوند.

    یادآوری امنیتی: جفت‌کردن یک Node مبتنی بر macOS، `system.run` را روی آن دستگاه مجاز می‌کند. فقط دستگاه‌های مورداعتماد را جفت کنید؛ [امنیت](/fa/gateway/security) را مرور کنید.

    مستندات: [Nodeها](/fa/nodes)، [پروتکل Gateway](/fa/gateway/protocol)، [حالت راه‌دور macOS](/fa/platforms/mac/remote)، [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="Tailscale متصل است، اما پاسخی دریافت نمی‌کنم. حالا چه‌کار کنم؟">
    موارد پایه را بررسی کنید:

    ```bash
    openclaw gateway status
    openclaw status
    openclaw channels status
    ```

    سپس احراز هویت و مسیریابی را بررسی کنید: اگر از Tailscale Serve استفاده می‌کنید، تأیید کنید که `gateway.auth.allowTailscale` درست تنظیم شده است؛ اگر از طریق تونل SSH متصل می‌شوید، تأیید کنید که تونل برقرار است و به درگاه درست اشاره می‌کند؛ همچنین تأیید کنید فهرست‌های مجاز پیام خصوصی/گروه، حساب شما را شامل می‌شوند.

    مستندات: [Tailscale](/fa/gateway/tailscale)، [دسترسی راه‌دور](/fa/gateway/remote)، [کانال‌ها](/fa/channels).

  </Accordion>

  <Accordion title="آیا دو نمونه OpenClaw می‌توانند با یکدیگر ارتباط برقرار کنند (محلی + VPS)؟">
    بله، هرچند پل داخلی ربات‌به‌ربات وجود ندارد.

    **ساده‌ترین روش**: از یک کانال گفت‌وگوی عادی استفاده کنید که هر دو ربات به آن دسترسی دارند (Slack/Telegram/WhatsApp). اجازه دهید ربات A به ربات B پیام بدهد و سپس ربات B طبق معمول پاسخ دهد.

    **پل CLI (عمومی)**: اسکریپتی اجرا کنید که Gateway دیگر را با `openclaw agent --message ... --deliver` فراخوانی کند و گفت‌وگویی را هدف قرار دهد که ربات دیگر در آن شنونده است. اگر یکی از ربات‌ها روی یک VPS راه‌دور قرار دارد، CLI خود را از طریق SSH/Tailscale به آن Gateway راه‌دور هدایت کنید ([دسترسی راه‌دور](/fa/gateway/remote) را ببینید):

    ```bash
    openclaw agent --message "سلام از ربات محلی" --deliver --channel telegram --reply-to <chat-id>
    ```

    یک محدودیت حفاظتی اضافه کنید تا دو ربات وارد حلقه بی‌پایان نشوند (فقط هنگام اشاره، فهرست‌های مجاز کانال یا قانون «به پیام‌های ربات پاسخ نده»).

    مستندات: [دسترسی راه‌دور](/fa/gateway/remote)، [CLI عامل](/fa/cli/agent)، [ارسال عامل](/fa/tools/agent-send).

  </Accordion>

  <Accordion title="آیا برای چند عامل به VPSهای جداگانه نیاز دارم؟">
    خیر. یک Gateway چندین عامل را میزبانی می‌کند که هرکدام فضای کاری، پیش‌فرض‌های مدل و مسیریابی مختص خود را دارند؛ این راه‌اندازی معمول است و از داشتن یک VPS برای هر عامل بسیار ارزان‌تر/ساده‌تر است. فقط برای جداسازی سخت‌گیرانه (مرزهای امنیتی) یا پیکربندی‌های بسیار متفاوتی که نمی‌خواهید به‌اشتراک گذاشته شوند، از VPSهای جداگانه استفاده کنید.
  </Accordion>

  <Accordion title="آیا استفاده از یک Node روی لپ‌تاپ شخصی‌ام به‌جای SSH از یک VPS مزیتی دارد؟">
    بله: Nodeها روش درجه‌یک دسترسی به لپ‌تاپ از یک Gateway راه‌دور هستند و امکاناتی فراتر از دسترسی پوسته فراهم می‌کنند. Gateway روی macOS/Linux (و Windows از طریق WSL2) اجرا می‌شود و سبک است (یک VPS کوچک یا دستگاهی هم‌رده Raspberry Pi مناسب است؛ 4 GB حافظه RAM کافی است)، بنابراین راه‌اندازی رایج شامل یک میزبان همیشه‌روشن به‌همراه لپ‌تاپ شما به‌عنوان Node است.

    - **بدون نیاز به SSH ورودی** - Nodeها از طریق جفت‌سازی دستگاه، اتصال خروجی به وب‌سوکت Gateway برقرار می‌کنند.
    - **کنترل‌های اجرای ایمن‌تر** - `system.run` با فهرست‌های مجاز/تأییدهای Node روی همان لپ‌تاپ محدود می‌شود.
    - **ابزارهای بیشتر دستگاه** - Nodeها علاوه بر `system.run`، ابزارهای `canvas`، `camera` و `screen` را ارائه می‌کنند.
    - **خودکارسازی محلی مرورگر** - Gateway را روی VPS نگه دارید، اما Chrome را به‌صورت محلی از طریق میزبان Node اجرا کنید، یا با Chrome MCP به Chrome محلی متصل شوید.

    SSH برای دسترسی موردی به پوسته مناسب است؛ Nodeها برای گردش‌کارهای مستمر عامل و خودکارسازی دستگاه ساده‌تر هستند.

    مستندات: [Nodeها](/fa/nodes)، [CLI مربوط به Nodeها](/fa/cli/nodes)، [مرورگر](/fa/tools/browser).

  </Accordion>

  <Accordion title="آیا Nodeها سرویس Gateway اجرا می‌کنند؟">
    خیر. در هر میزبان فقط باید **یک Gateway** اجرا شود، مگر اینکه عمداً پروفایل‌های جداگانه اجرا کنید ([چند Gateway](/fa/gateway/multiple-gateways) را ببینید). Nodeها تجهیزات جانبی متصل‌شونده به Gateway هستند (Nodeهای iOS/Android یا «حالت Node» در برنامه نوار منوی macOS). برای میزبان‌های Node بدون رابط گرافیکی و کنترل CLI، [CLI میزبان Node](/fa/cli/node) را ببینید.

    برای `gateway`، `discovery` و تغییرات سطح Plugin میزبانی‌شده، راه‌اندازی مجدد کامل لازم است.

  </Accordion>

  <Accordion title="آیا روشی مبتنی بر API / RPC برای اعمال پیکربندی وجود دارد؟">
    بله:

    - `config.schema.lookup`: پیش از نوشتن، یک زیردرخت پیکربندی را همراه با گره کم‌عمق طرح‌واره آن، راهنمای رابط کاربری منطبق و خلاصه‌های فرزندان بلافصل بررسی کنید.
    - `config.get`: اسنپ‌شات فعلی را همراه با هش دریافت کنید.
    - `config.patch`: به‌روزرسانی جزئی امن (برای بیشتر ویرایش‌های RPC ترجیح داده می‌شود)؛ در صورت امکان بازبارگذاری گرم انجام می‌دهد و در صورت نیاز راه‌اندازی مجدد می‌کند.
    - `config.apply`: کل پیکربندی را اعتبارسنجی و جایگزین کنید؛ در صورت امکان بازبارگذاری گرم انجام می‌دهد و در صورت نیاز راه‌اندازی مجدد می‌کند.
    - ابزار زمان اجرای `gateway` که در اختیار عامل است، همچنان از بازنویسی `tools.exec.ask` / `tools.exec.security` خودداری می‌کند؛ نام‌های مستعار قدیمی `tools.bash.*` به همان مسیرهای محافظت‌شده نرمال‌سازی می‌شوند.

  </Accordion>

  <Accordion title="حداقل پیکربندی معقول برای نخستین نصب">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    فضای کاری را تنظیم می‌کند و افرادی را که می‌توانند ربات را فعال کنند محدود می‌سازد.

  </Accordion>

  <Accordion title="چگونه Tailscale را روی یک VPS راه‌اندازی کنم و از Mac خود متصل شوم؟">
    1. **نصب و ورود به سیستم روی VPS**:
       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```
    2. با استفاده از برنامه Tailscale و همان tailnet، **روی Mac خود نصب و وارد سیستم شوید**.
    3. در کنسول مدیریت Tailscale، **MagicDNS را فعال کنید** تا VPS نامی پایدار داشته باشد.
    4. **از نام میزبان tailnet استفاده کنید**: برای SSH از `ssh user@your-vps.tailnet-xxxx.ts.net`؛ برای WS مربوط به Gateway از `ws://your-vps.tailnet-xxxx.ts.net:18789`.

    برای استفاده از رابط کاربری کنترل بدون SSH، روی VPS از Tailscale Serve استفاده کنید:

    ```bash
    openclaw gateway --tailscale serve
    ```

    با این کار Gateway به loopback مقید می‌ماند و HTTPS از طریق Tailscale در دسترس قرار می‌گیرد. [Tailscale](/fa/gateway/tailscale) را ببینید.

  </Accordion>

  <Accordion title="چگونه یک Node مک را به Gateway راه دور متصل کنم (Tailscale Serve)؟">
    Serve، **رابط کاربری کنترل Gateway و WS** را در دسترس قرار می‌دهد؛ Nodeها از طریق همان نقطه پایانی WS مربوط به Gateway متصل می‌شوند.

    1. مطمئن شوید VPS و Mac روی یک tailnet هستند.
    2. از برنامه macOS در حالت Remote استفاده کنید (هدف SSH می‌تواند نام میزبان tailnet باشد) — این برنامه پورت Gateway را تونل می‌کند و به‌عنوان یک Node متصل می‌شود.
    3. Node را تأیید کنید:
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    مستندات: [پروتکل Gateway](/fa/gateway/protocol)، [کشف](/fa/gateway/discovery)، [حالت راه دور macOS](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="آیا باید روی لپ‌تاپ دوم نصب کنم یا فقط یک Node اضافه کنم؟">
    برای استفاده صرفاً از **ابزارهای محلی** (صفحه‌نمایش/دوربین/اجرا) روی لپ‌تاپ دوم، آن را به‌عنوان یک **Node** اضافه کنید — یک Gateway خواهید داشت و پیکربندی تکراری ایجاد نمی‌شود. ابزارهای محلی Node در حال حاضر فقط در macOS در دسترس‌اند. تنها برای **جداسازی کامل** یا داشتن دو ربات کاملاً مجزا، Gateway دومی نصب کنید.

    مستندات: [Nodeها](/fa/nodes)، [CLI مربوط به Nodeها](/fa/cli/nodes)، [چند Gateway](/fa/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغیرهای محیطی و بارگذاری .env

<AccordionGroup>
  <Accordion title="OpenClaw چگونه متغیرهای محیطی را بارگذاری می‌کند؟">
    OpenClaw متغیرهای محیطی را از فرایند والد (پوسته، launchd/systemd، CI و غیره) می‌خواند و افزون بر آن، موارد زیر را بارگذاری می‌کند:

    - `.env` از دایرکتوری کاری فعلی.
    - یک `.env` سراسری به‌عنوان جایگزین از `~/.openclaw/.env` (`$OPENCLAW_STATE_DIR/.env`).

    هیچ‌یک از فایل‌های `.env` متغیرهای محیطی موجود را بازنویسی نمی‌کنند. کلیدهای اعتبارنامه ارائه‌دهنده و مسیریابی نقطه پایانی، برای `.env` فضای کاری استثنا هستند: کلیدهایی مانند `GEMINI_API_KEY`، `XAI_API_KEY`، `MISTRAL_API_KEY` یا هر کلیدی که به `_ENDPOINT` ختم شود (و سایر متغیرهای محیطی احراز هویت یا نقطه پایانی ارائه‌دهندگان همراه) از `.env` فضای کاری نادیده گرفته می‌شوند و باید در محیط فرایند، `~/.openclaw/.env` یا پیکربندی `env` قرار گیرند.

    متغیرهای محیطی درون‌خطی در پیکربندی تنها در صورت نبودن در محیط فرایند اعمال می‌شوند:

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    برای تقدم کامل و منابع، به [/محیط](/fa/help/environment) مراجعه کنید.

  </Accordion>

  <Accordion title="Gateway را از طریق سرویس اجرا کردم و متغیرهای محیطی‌ام ناپدید شدند. حالا چه کنم؟">
    دو راه‌حل وجود دارد:

    1. کلیدهای مفقود را در `~/.openclaw/.env` قرار دهید تا حتی وقتی سرویس محیط پوسته را به ارث نمی‌برد، بارگذاری شوند.
    2. وارد کردن از پوسته را فعال کنید (امکان اختیاری برای سهولت):
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
       این کار پوسته ورود به سیستم را اجرا می‌کند و فقط کلیدهای مورد انتظارِ مفقود را وارد می‌کند (هرگز بازنویسی نمی‌کند). معادل‌های متغیر محیطی: `OPENCLAW_LOAD_SHELL_ENV=1`، `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN را تنظیم کرده‌ام، اما وضعیت مدل‌ها "Shell env: off." را نشان می‌دهد. چرا؟'>
    `openclaw models status` گزارش می‌دهد که آیا **وارد کردن محیط پوسته** فعال است یا نه. "Shell env: off" به این معنا **نیست** که متغیرهای محیطی شما وجود ندارند — فقط یعنی OpenClaw پوسته ورود به سیستم را به‌طور خودکار بارگذاری نمی‌کند.

    اگر Gateway به‌عنوان سرویس (launchd/systemd) اجرا شود، محیط پوسته شما را به ارث نمی‌برد. برای رفع مشکل، توکن را در `~/.openclaw/.env` قرار دهید، `env.shellEnv.enabled: true` را فعال کنید یا آن را به پیکربندی `env` بیفزایید (فقط در صورت نبودن اعمال می‌شود)، سپس Gateway را راه‌اندازی مجدد و دوباره بررسی کنید:

    ```bash
    openclaw models status
    ```

    توکن‌های Copilot با این ترتیب یافت می‌شوند: ابتدا `OPENCLAW_GITHUB_TOKEN`، سپس `COPILOT_GITHUB_TOKEN`، بعد `GH_TOKEN` و در پایان `GITHUB_TOKEN`.

    به [/مفاهیم/ارائه‌دهندگان مدل](/fa/concepts/model-providers) و [/محیط](/fa/help/environment) مراجعه کنید.

  </Accordion>
</AccordionGroup>

## نشست‌ها و چند گفت‌وگو

<AccordionGroup>
  <Accordion title="چگونه یک گفت‌وگوی تازه آغاز کنم؟">
    `/new` یا `/reset` را به‌صورت یک پیام مستقل ارسال کنید. [مدیریت نشست](/fa/concepts/session) را ببینید.
  </Accordion>

  <Accordion title="اگر هرگز /new را ارسال نکنم، نشست‌ها به‌طور خودکار بازنشانی می‌شوند؟">
    بله. سیاست پیش‌فرض بازنشانی **روزانه** است: نشست در ساعت محلی پیکربندی‌شده روی میزبان Gateway (`session.reset.atHour`، مقدار پیش‌فرض `4`، 0-23) و بر اساس زمان آغاز نشست فعلی به نشست جدید منتقل می‌شود. برای استفاده از بازنشانی مبتنی بر بی‌کاری، از `mode: "idle"` و `session.reset.idleMinutes` استفاده کنید؛ این تنظیم نشست را پس از مدتی عدم فعالیت منقضی می‌کند (بر اساس آخرین تعامل واقعی، نه رویدادهای سیستمی Heartbeat/Cron/اجرا).

    ```json5
    {
      session: {
        reset: { mode: "daily", atHour: 4 },
        resetByType: {
          group: { mode: "idle", idleMinutes: 120 },
          thread: { mode: "daily", atHour: 6 },
        },
        resetByChannel: {
          discord: { mode: "idle", idleMinutes: 10080 },
        },
      },
    }
    ```

    `resetByType` از `direct` (نام مستعار قدیمی `dm`)، `group` و `thread` پشتیبانی می‌کند. `session.idleMinutes` قدیمی در سطح بالا، هنگامی که هیچ بلوک `session.reset`/`resetByType` تنظیم نشده باشد، همچنان به‌عنوان نام مستعار سازگاری برای پیش‌فرض حالت بی‌کاری کار می‌کند. نشست‌هایی که نشست CLI فعال و تحت مالکیت ارائه‌دهنده دارند، با پیش‌فرض روزانه ضمنی قطع نمی‌شوند. برای چرخه عمر کامل، [مدیریت نشست](/fa/concepts/session) را ببینید.

  </Accordion>

  <Accordion title="آیا راهی برای ساخت یک تیم از نمونه‌های OpenClaw وجود دارد (یک مدیرعامل و چندین عامل)؟">
    بله، از طریق **مسیریابی چندعاملی** و **زیرعامل‌ها**: یک عامل هماهنگ‌کننده به‌همراه چند عامل اجرایی که فضای کاری و مدل‌های خود را دارند.

    بهتر است این را آزمایشی سرگرم‌کننده در نظر بگیرید — مصرف توکن آن زیاد است و اغلب از یک ربات با نشست‌های جداگانه کارایی کمتری دارد. الگوی معمول، یک ربات است که با آن گفت‌وگو می‌کنید و برای کارهای موازی نشست‌های متفاوتی دارد و در صورت نیاز زیرعامل ایجاد می‌کند.

    مستندات: [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [زیرعامل‌ها](/fa/tools/subagents)، [CLI عامل‌ها](/fa/cli/agents).

  </Accordion>

  <Accordion title="چرا زمینه در میانه کار کوتاه شد؟ چگونه از آن جلوگیری کنم؟">
    زمینه نشست به پنجره مدل محدود است. گفت‌وگوهای طولانی، خروجی‌های بزرگ ابزار یا فایل‌های متعدد می‌توانند موجب Compaction یا کوتاه‌سازی شوند.

    - از ربات بخواهید وضعیت فعلی را خلاصه کند و در یک فایل بنویسد.
    - پیش از کارهای طولانی از `/compact` و هنگام تغییر موضوع از `/new` استفاده کنید.
    - زمینه مهم را در فضای کاری نگه دارید و از ربات بخواهید آن را دوباره بخواند.
    - برای کارهای طولانی یا موازی از زیرعامل‌ها استفاده کنید تا گفت‌وگوی اصلی کوچک‌تر بماند.
    - اگر این اتفاق زیاد رخ می‌دهد، مدلی با پنجره زمینه بزرگ‌تر انتخاب کنید.

  </Accordion>

  <Accordion title="چگونه OpenClaw را کاملاً بازنشانی کنم، اما نصب‌شده نگه دارم؟">
    ```bash
    openclaw reset
    ```

    بازنشانی کامل و غیرتعاملی:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    سپس راه‌اندازی را دوباره اجرا کنید:

    ```bash
    openclaw onboard --install-daemon
    ```

    اگر فرایند آغازبه‌کار پیکربندی موجودی را تشخیص دهد، گزینه **بازنشانی** را نیز ارائه می‌دهد؛ [آغازبه‌کار (CLI)](/fa/start/wizard) را ببینید. اگر از پروفایل‌ها (`--profile` / `OPENCLAW_PROFILE`) استفاده کرده‌اید، دایرکتوری وضعیت هرکدام را بازنشانی کنید (پیش‌فرض `~/.openclaw-<profile>`). بازنشانی مخصوص توسعه: `openclaw gateway --dev --reset` پیکربندی توسعه، اعتبارنامه‌ها، نشست‌ها و فضای کاری را پاک می‌کند.

  </Accordion>

  <Accordion title='خطاهای "context too large" دریافت می‌کنم — چگونه بازنشانی یا فشرده‌سازی کنم؟'>
    - **Compaction** (گفت‌وگو را نگه می‌دارد و نوبت‌های قدیمی‌تر را خلاصه می‌کند): `/compact` یا `/compact <instructions>` برای هدایت خلاصه.
    - **بازنشانی** (شناسه نشست تازه برای همان کلید گفت‌وگو): `/new` یا `/reset`.

    اگر مشکل ادامه داشت، **هرس نشست** (`agents.defaults.contextPruning`) را برای کوتاه‌کردن خروجی قدیمی ابزار تنظیم کنید یا از مدلی با پنجره زمینه بزرگ‌تر استفاده کنید.

    مستندات: [Compaction](/fa/concepts/compaction)، [هرس نشست](/fa/concepts/session-pruning)، [مدیریت نشست](/fa/concepts/session).

  </Accordion>

  <Accordion title='چرا پیام "LLM request rejected: messages.content.tool_use.input field required" را می‌بینم؟'>
    خطای اعتبارسنجی ارائه‌دهنده: مدل یک بلوک `tool_use` را بدون `input` الزامی تولید کرده است. معمولاً به این معناست که تاریخچه نشست قدیمی یا خراب شده است (اغلب پس از رشته‌های طولانی یا تغییر ابزار/طرح‌واره).

    راه‌حل: با `/new` یک نشست تازه آغاز کنید (به‌صورت پیام مستقل).

  </Accordion>

  <Accordion title="چرا هر 30 دقیقه پیام‌های Heartbeat دریافت می‌کنم؟">
    Heartbeatها به‌طور پیش‌فرض هر **30m** اجرا می‌شوند؛ یا وقتی حالت احراز هویت نهایی، OAuth/توکن Anthropic باشد (از جمله استفاده مجدد از Claude CLI) و `heartbeat.every` تنظیم نشده باشد، هر **1h** اجرا می‌شوند. برای تنظیم یا غیرفعال‌سازی:

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

    اگر `HEARTBEAT.md` وجود داشته باشد اما عملاً خالی باشد (فقط شامل خطوط خالی، نظرهای Markdown/HTML، عنوان‌های ATX، نشانگرهای حصار یا جای‌نگهدارهای خالی موارد فهرست باشد)، OpenClaw برای صرفه‌جویی در فراخوانی‌های API اجرای Heartbeat را رد می‌کند. اگر فایل وجود نداشته باشد، Heartbeat همچنان اجرا می‌شود و مدل تصمیم می‌گیرد چه کاری انجام دهد.

    بازنویسی‌های ویژه هر عامل از `agents.list[].heartbeat` استفاده می‌کنند. مستندات: [Heartbeat](/fa/gateway/heartbeat).

  </Accordion>

  <Accordion title='آیا باید یک "حساب ربات" به گروه WhatsApp اضافه کنم؟'>
    خیر. OpenClaw روی **حساب خودتان** اجرا می‌شود — اگر عضو گروه باشید، OpenClaw می‌تواند آن را ببیند. پاسخ‌های گروه به‌طور پیش‌فرض تا زمانی که فرستندگان را مجاز کنید (`groupPolicy: "allowlist"`) مسدود هستند.

    برای محدودکردن پاسخ‌های گروه فقط به خودتان:

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

  <Accordion title="چگونه JID یک گروه WhatsApp را به‌دست آورم؟">
    سریع‌ترین راه: گزارش‌ها را به‌صورت زنده دنبال کنید و در گروه یک پیام آزمایشی بفرستید.

    ```bash
    openclaw logs --follow --json
    ```

    به‌دنبال `chatId` (یا `from`) بگردید که به `@g.us` ختم می‌شود، مانند `1234567890-1234567890@g.us`.

    اگر از قبل پیکربندی یا در فهرست مجاز قرار داده شده است، گروه‌ها را از پیکربندی فهرست کنید:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    مستندات: [WhatsApp](/fa/channels/whatsapp)، [دایرکتوری](/fa/cli/directory)، [گزارش‌ها](/fa/cli/logs).

  </Accordion>

  <Accordion title="چرا OpenClaw در یک گروه پاسخ نمی‌دهد؟">
    دو علت رایج: دروازه‌گذاری منشن به‌طور پیش‌فرض فعال است (باید ربات را با @ منشن کنید یا با `mentionPatterns` مطابقت داشته باشید)، یا `channels.whatsapp.groups` را بدون `"*"` پیکربندی کرده‌اید و گروه در فهرست مجاز نیست.

    [گروه‌ها](/fa/channels/groups) و [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.

  </Accordion>

  <Accordion title="آیا گروه‌ها/رشته‌ها زمینه را با پیام‌های مستقیم به اشتراک می‌گذارند؟">
    چت‌های مستقیم به‌طور پیش‌فرض در نشست اصلی ادغام می‌شوند. گروه‌ها/کانال‌ها کلیدهای نشست خود را دارند و موضوعات Telegram / رشته‌های Discord نشست‌های جداگانه هستند. [گروه‌ها](/fa/channels/groups) و [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.
  </Accordion>

  <Accordion title="چند فضای کاری و عامل می‌توانم ایجاد کنم؟">
    محدودیت سختی وجود ندارد — ده‌ها یا حتی صدها مورد مشکلی ندارد، اما مراقب این موارد باشید:

    - **رشد فضای دیسک**: نشست‌های فعال و رونوشت‌ها در پایگاه‌داده SQLite مختص هر عامل نگهداری می‌شوند؛ مصنوعات قدیمی/بایگانی همچنان ممکن است زیر `~/.openclaw/agents/<agentId>/sessions/` انباشته شوند.
    - **هزینه توکن**: عامل‌های بیشتر به‌معنای استفاده هم‌زمان بیشتر از مدل است.
    - **سربار عملیاتی**: پروفایل‌های احراز هویت، فضاهای کاری و مسیریابی کانال برای هر عامل.

    برای هر عامل یک فضای کاری **فعال** (`agents.defaults.workspace`) نگه دارید، اگر مصرف دیسک افزایش یافت نشست‌های قدیمی را با `openclaw sessions cleanup` هرس کنید (وضعیت فعال SQLite را دستی ویرایش نکنید) و برای یافتن فضاهای کاری سرگردان و ناهماهنگی پروفایل‌ها از `openclaw doctor` استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم چند ربات یا چت را هم‌زمان اجرا کنم (Slack) و چگونه باید آن را راه‌اندازی کنم؟">
    بله، از طریق **مسیریابی چندعاملی**: چند عامل ایزوله را اجرا کنید و پیام‌های ورودی را بر اساس کانال/حساب/همتا مسیریابی کنید. Slack به‌عنوان یک کانال پشتیبانی می‌شود و می‌توان آن را به عامل‌های مشخصی متصل کرد.

    دسترسی مرورگر قدرتمند است، اما به‌معنای «انجام هر کاری که انسان می‌تواند» نیست — سازوکارهای ضدربات، CAPTCHAها و MFA همچنان می‌توانند جلوی خودکارسازی را بگیرند. برای مطمئن‌ترین کنترل، از Chrome MCP محلی روی میزبان یا CDP روی دستگاهی که مرورگر را واقعاً اجرا می‌کند استفاده کنید.

    راه‌اندازی پیشنهادی: میزبان Gateway همیشه‌روشن (VPS/Mac mini)، یک عامل برای هر نقش (اتصال‌ها)، کانال‌های Slack متصل به آن عامل‌ها و در صورت نیاز مرورگر محلی از طریق Chrome MCP یا یک Node.

    مستندات: [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [Slack](/fa/channels/slack)، [مرورگر](/fa/tools/browser)، [Nodeها](/fa/nodes).

  </Accordion>
</AccordionGroup>

## مدل‌ها، انتقال در خرابی و پروفایل‌های احراز هویت

پرسش‌وپاسخ مدل‌ها — پیش‌فرض‌ها، انتخاب، نام‌های مستعار، تعویض، انتقال در خرابی و پروفایل‌های احراز هویت — در [پرسش‌های متداول مدل‌ها](/fa/help/faq-models) قرار دارد.

## Gateway: درگاه‌ها، «از قبل در حال اجرا» و حالت دوردست

<AccordionGroup>
  <Accordion title="Gateway از چه درگاهی استفاده می‌کند؟">
    `gateway.port` درگاه چندگانه واحد برای WebSocket + HTTP (رابط کنترل، هوک‌ها و غیره) را کنترل می‌کند. ترتیب تقدم:

    ```text
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > پیش‌فرض 18789
    ```

  </Accordion>

  <Accordion title='چرا openclaw gateway status عبارت "Runtime: running" را نشان می‌دهد، اما "Connectivity probe: failed" را گزارش می‌کند؟'>
    «در حال اجرا» دیدگاه **ناظر** (launchd/systemd/schtasks) است؛ وارسی اتصال، اتصال واقعی CLI به WebSocket در Gateway است. به این سطرها در `openclaw gateway status` اعتماد کنید: `Probe target:` (نشانی URL استفاده‌شده توسط وارسی)، `Listening:` (آنچه واقعاً به درگاه متصل است)، `Last gateway error:` (علت ریشه‌ای رایج هنگامی که فرایند زنده است اما درگاه گوش نمی‌دهد).
  </Accordion>

  <Accordion title='چرا openclaw gateway status مقادیر متفاوتی برای "Config (cli)" و "Config (service)" نشان می‌دهد؟'>
    شما یک فایل پیکربندی را ویرایش می‌کنید، درحالی‌که سرویس فایل دیگری را اجرا می‌کند (اغلب ناهماهنگی `--profile` / `OPENCLAW_STATE_DIR`).

    برای رفع مشکل، فرمان زیر را از همان `--profile` / محیطی اجرا کنید که می‌خواهید سرویس استفاده کند:

    ```bash
    openclaw gateway install --force
    ```

  </Accordion>

  <Accordion title='عبارت "another gateway instance is already listening" چه معنایی دارد؟'>
    OpenClaw با اتصال فوری شنونده WebSocket هنگام راه‌اندازی، قفل زمان اجرا را اعمال می‌کند (پیش‌فرض `ws://127.0.0.1:18789`). اگر اتصال با `EADDRINUSE` شکست بخورد، `GatewayLockError` («نمونه دیگری از Gateway از قبل در حال گوش‌دادن است») را صادر می‌کند.

    راه‌حل: نمونه دیگر را متوقف کنید، درگاه را آزاد کنید یا با `openclaw gateway --port <port>` اجرا کنید.

  </Accordion>

  <Accordion title="چگونه OpenClaw را در حالت دوردست اجرا کنم (کارخواه به Gateway در جای دیگری متصل شود)؟">
    `gateway.mode: "remote"` را تنظیم کنید و آن را به یک نشانی WebSocket دوردست اشاره دهید؛ در صورت تمایل، اعتبارنامه‌های دوردست مبتنی بر راز مشترک را نیز اضافه کنید:

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

    - `openclaw gateway` تنها زمانی راه‌اندازی می‌شود که `gateway.mode` برابر `local` باشد (یا یک پرچم بازنویسی ارسال کنید).
    - برنامه macOS فایل پیکربندی را زیر نظر دارد و هنگام تغییر این مقادیر، حالت‌ها را به‌صورت زنده عوض می‌کند.
    - `gateway.remote.token` / `.password` فقط اعتبارنامه‌های دوردست سمت کارخواه هستند؛ این موارد به‌تنهایی احراز هویت Gateway محلی را فعال نمی‌کنند.

  </Accordion>

  <Accordion title='رابط کنترل می‌گوید "unauthorized" (یا مدام دوباره متصل می‌شود). اکنون چه کنم؟'>
    مسیر احراز هویت Gateway و روش احراز هویت رابط کاربری با یکدیگر مطابقت ندارند.

    واقعیت‌ها (برگرفته از کد):

    - رابط کنترل، توکن را در `sessionStorage` و محدود به برگه فعلی مرورگر و نشانی انتخاب‌شده Gateway نگه می‌دارد؛ بنابراین بازآوری در همان برگه بدون ماندگاری طولانی‌مدت توکن در localStorage همچنان کار می‌کند.
    - در `AUTH_TOKEN_MISMATCH`، کارخواه‌های مورد اعتماد می‌توانند هنگامی که Gateway راهنمایی‌های تلاش مجدد (`canRetryWithDeviceToken=true`، `recommendedNextStep=retry_with_device_token`) را برمی‌گرداند، یک تلاش مجدد محدود با توکن دستگاه ذخیره‌شده انجام دهند.
    - آن تلاش مجدد با توکن ذخیره‌شده، محدوده‌های تأییدشده ذخیره‌شده همراه توکن دستگاه را دوباره استفاده می‌کند؛ فراخواننده‌های صریح `deviceToken` / صریح `scopes` به‌جای به‌ارث‌بردن محدوده‌های ذخیره‌شده، مجموعه محدوده درخواستی خود را حفظ می‌کنند.
    - خارج از آن مسیر تلاش مجدد، تقدم احراز هویت اتصال به‌ترتیب شامل توکن/گذرواژه مشترک صریح، سپس `deviceToken` صریح، سپس توکن ذخیره‌شده دستگاه و در پایان توکن راه‌اندازی اولیه است.
    - راه‌اندازی اولیه داخلی با کد راه‌اندازی، یک توکن دستگاه Node با `scopes: []` به‌همراه یک توکن محدود تحویل به اپراتور برای ورود امن تلفن همراه برمی‌گرداند. تحویل اپراتور می‌تواند پیکربندی بومی زمان راه‌اندازی را بخواند، اما محدوده‌های تغییر جفت‌سازی یا `operator.admin` را اعطا نمی‌کند.

    راه‌حل:

    - سریع‌ترین راه: `openclaw dashboard` (نشانی داشبورد را چاپ و کپی می‌کند و برای بازکردن آن می‌کوشد؛ در محیط بدون نمایشگر، راهنمای SSH نشان می‌دهد).
    - هنوز توکنی ندارید: `openclaw doctor --generate-gateway-token`.
    - دوردست: ابتدا با `ssh -N -L 18789:127.0.0.1:18789 user@host` تونل ایجاد کنید، سپس `http://127.0.0.1:18789/` را باز کنید.
    - حالت راز مشترک: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` یا `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` را تنظیم کنید، سپس راز متناظر را در تنظیمات رابط کنترل جای‌گذاری کنید.
    - حالت Tailscale Serve: تأیید کنید `gateway.auth.allowTailscale` فعال است و نشانی Serve را باز می‌کنید، نه یک نشانی خام loopback/tailnet که سرآیندهای هویت Tailscale را دور می‌زند.
    - حالت پراکسی مورد اعتماد: تأیید کنید که از طریق پراکسی پیکربندی‌شده و آگاه از هویت وارد می‌شوید. پراکسی‌های loopback روی همان میزبان نیز به `gateway.auth.trustedProxy.allowLoopback = true` نیاز دارند.
    - ناهماهنگی پس از یک تلاش مجدد همچنان باقی است: توکن دستگاه جفت‌شده را تعویض/دوباره تأیید کنید:
      ```bash
      openclaw devices list
      openclaw devices rotate --device <id> --role operator
      ```
    - تعویض رد شد: نشست‌های دستگاه جفت‌شده فقط می‌توانند توکن دستگاه **خودشان** را تعویض کنند، مگر اینکه `operator.admin` را نیز داشته باشند؛ همچنین مقادیر صریح `--scope` نمی‌توانند از محدوده‌های اپراتوری فعلی فراخواننده فراتر روند.
    - همچنان گرفتارید: `openclaw status --all` به‌همراه [عیب‌یابی](/fa/gateway/troubleshooting). برای جزئیات احراز هویت، [داشبورد](/fa/web/dashboard) را ببینید.

  </Accordion>

  <Accordion title="gateway.bind را روی tailnet تنظیم کردم، اما فقط روی loopback گوش می‌دهد">
    اتصال `tailnet` یک IP متعلق به Tailscale را از رابط‌های شبکه شما انتخاب می‌کند (100.64.0.0/10). اگر دستگاه در Tailscale نباشد (یا رابط غیرفعال باشد)، Gateway به‌جای در معرض قراردادن یک رابط شبکه دیگر، به loopback برمی‌گردد.

    راه‌حل: Tailscale را روی آن میزبان راه‌اندازی و Gateway را دوباره راه‌اندازی کنید، یا صریحاً به `gateway.bind: "loopback"` / `"lan"` تغییر دهید.

    `tailnet` صریح است؛ `auto`، loopback را ترجیح می‌دهد. برای محدودکردن دسترسی غیر loopback به Tailnet و درعین‌حال حفظ شنونده الزامی `127.0.0.1` روی همان میزبان، از `gateway.bind: "tailnet"` استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم چند Gateway را روی یک میزبان اجرا کنم؟">
    معمولاً خیر — یک Gateway می‌تواند چند کانال پیام‌رسانی و عامل را اجرا کند. از چند Gateway فقط برای افزونگی (برای مثال یک ربات نجات) یا ایزوله‌سازی سخت استفاده کنید و هرکدام را با `OPENCLAW_CONFIG_PATH`، `OPENCLAW_STATE_DIR`، `agents.defaults.workspace` و `gateway.port` یکتا ایزوله کنید.

    پیشنهاد: `openclaw --profile <name> ...` برای هر نمونه (به‌طور خودکار `~/.openclaw-<name>` را ایجاد می‌کند)، یک `gateway.port` یکتا برای پیکربندی هر پروفایل (یا `--port` برای اجرای دستی) و یک سرویس برای هر پروفایل با `openclaw --profile <name> gateway install`.

    پروفایل‌ها همچنین به نام سرویس‌ها پسوند اضافه می‌کنند: launchd `ai.openclaw.<profile>`، systemd `openclaw-gateway-<profile>.service`، Windows `OpenClaw Gateway (<profile>)`. واحد systemd بدون پسوند `openclaw-gateway` فقط برای پروفایل پیش‌فرض وجود دارد؛ نام قدیمی واحد systemd پیش از تغییر نام، یعنی `clawdbot-gateway`، به‌طور خودکار مهاجرت داده می‌شود.

    راهنمای کامل: [چند Gateway](/fa/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='عبارت "invalid handshake" / کد 1008 چه معنایی دارد؟'>
    Gateway یک **سرور WebSocket** است و انتظار دارد نخستین پیام یک فریم `connect` باشد. هر چیز دیگری اتصال را با **کد 1008** (نقض خط‌مشی) می‌بندد.

    علت‌های رایج: نشانی **HTTP** را به‌جای کارخواه WS در مرورگر باز کرده‌اید، از درگاه/مسیر اشتباه استفاده کرده‌اید یا یک پراکسی/تونل سرآیندهای احراز هویت را حذف کرده یا درخواستی غیرمرتبط با Gateway فرستاده است.

    راه‌حل: از نشانی WS (`ws://<host>:18789` یا `wss://...` روی HTTPS) استفاده کنید، درگاه WS را در یک برگه عادی مرورگر باز نکنید و هنگامی که احراز هویت فعال است، توکن/گذرواژه را در فریم `connect` قرار دهید. نمونه CLI/TUI:

    ```bash
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    جزئیات پروتکل: [پروتکل Gateway](/fa/gateway/protocol).

  </Accordion>
</AccordionGroup>

## ثبت گزارش و اشکال‌زدایی

<AccordionGroup>
  <Accordion title="گزارش‌ها کجا هستند؟">
    گزارش‌های فایل (ساخت‌یافته): `/tmp/openclaw/openclaw-YYYY-MM-DD.log`. مسیر پایدار را از طریق `logging.file` تنظیم کنید؛ سطح گزارش فایل از طریق `logging.level`؛ میزان جزئیات کنسول از طریق `--verbose` و `logging.consoleLevel`.

    سریع‌ترین دنبال‌کردن گزارش:

    ```bash
    openclaw logs --follow
    ```

    گزارش‌های سرویس/ناظر (هنگامی که Gateway از طریق launchd/systemd اجرا می‌شود):

    - خروجی استاندارد launchd در macOS: `~/Library/Logs/openclaw/gateway.log` (پروفایل‌ها از `gateway-<profile>.log` استفاده می‌کنند؛ خروجی خطا سرکوب می‌شود).
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`.
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`.

    برای اطلاعات بیشتر [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید.

  </Accordion>

  <Accordion title="چگونه سرویس Gateway را راه‌اندازی/متوقف/دوباره راه‌اندازی کنم؟">
    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر Gateway را دستی اجرا می‌کنید، `openclaw gateway --force` می‌تواند درگاه را بازپس گیرد. [Gateway](/fa/gateway) را ببینید.

  </Accordion>

  <Accordion title="ترمینالم را در Windows بستم — چگونه OpenClaw را دوباره راه‌اندازی کنم؟">
    سه حالت نصب در Windows:

    **1) راه‌اندازی محلی Windows Hub**: برنامه بومی، یک Gateway محلی در WSL را که متعلق به برنامه است مدیریت می‌کند. **OpenClaw Companion** را از منوی Start یا سینی سیستم باز کنید، سپس از **Gateway Setup** یا برگه Connections استفاده کنید.

    **2) Gateway دستی WSL2**: Gateway درون Linux اجرا می‌شود.
    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```
    اگر هرگز سرویس را نصب نکرده‌اید، آن را در پیش‌زمینه راه‌اندازی کنید: `openclaw gateway run`.

    **3) CLI/Gateway بومی Windows**: مستقیماً در Windows اجرا می‌شود.
    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```
    اگر آن را به‌صورت دستی اجرا می‌کنید (بدون سرویس): `openclaw gateway run`.

    مستندات: [Windows](/fa/platforms/windows)، [راهنمای عملیاتی سرویس Gateway](/fa/gateway).

  </Accordion>

  <Accordion title="Gateway فعال است اما پاسخ‌ها هرگز نمی‌رسند. چه چیزی را باید بررسی کنم؟">
    بررسی سریع سلامت:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    علت‌های رایج: احراز هویت مدل در **میزبان Gateway** بارگذاری نشده است (`models status` را بررسی کنید)، جفت‌سازی/فهرست مجاز کانال مانع پاسخ‌ها می‌شود (پیکربندی و گزارش‌های کانال را بررسی کنید)، یا WebChat/Dashboard بدون توکن صحیح باز است. اگر اتصال راه دور است، تأیید کنید که اتصال تونل/Tailscale برقرار و WebSocket مربوط به Gateway در دسترس است.

    مستندات: [کانال‌ها](/fa/channels)، [عیب‌یابی](/fa/gateway/troubleshooting)، [دسترسی راه دور](/fa/gateway/remote).

  </Accordion>

  <Accordion title='"اتصال به Gateway قطع شد: بدون دلیل" — حالا چه کنم؟'>
    معمولاً یعنی رابط کاربری اتصال WebSocket را از دست داده است. بررسی کنید: آیا Gateway در حال اجراست (`openclaw gateway status`)؟ آیا سالم است (`openclaw status`)؟ آیا رابط کاربری توکن صحیح را دارد (`openclaw dashboard`)؟ اگر اتصال راه دور است، آیا پیوند تونل/Tailscale برقرار است؟

    سپس گزارش‌ها را به‌صورت زنده دنبال کنید:

    ```bash
    openclaw logs --follow
    ```

    مستندات: [داشبورد](/fa/web/dashboard)، [دسترسی راه دور](/fa/gateway/remote)، [عیب‌یابی](/fa/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands ناموفق است. چه چیزی را باید بررسی کنم؟">
    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    سپس خطا را تطبیق دهید:

    - `BOT_COMMANDS_TOO_MUCH`: منوی Telegram ورودی‌های بیش از حدی دارد. OpenClaw از قبل تعداد را تا سقف Telegram کاهش می‌دهد و با فرمان‌های کمتری دوباره تلاش می‌کند، اما ممکن است همچنان برخی ورودی‌های منو حذف شوند. تعداد فرمان‌های Plugin/skill/سفارشی را کاهش دهید، یا اگر به منو نیاز ندارید `channels.telegram.commands.native` را غیرفعال کنید.
    - `TypeError: fetch failed`، `Network request for 'setMyCommands' failed!` یا خطاهای شبکه‌ای مشابه: در یک VPS یا پشت پراکسی، تأیید کنید که HTTPS خروجی مجاز است و DNS برای `api.telegram.org` کار می‌کند.

    اگر Gateway راه دور است، گزارش‌ها را روی میزبان Gateway بررسی کنید.

    مستندات: [Telegram](/fa/channels/telegram)، [عیب‌یابی کانال](/fa/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI هیچ خروجی‌ای نشان نمی‌دهد. چه چیزی را باید بررسی کنم؟">
    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    در TUI، برای مشاهده وضعیت فعلی از `/status` استفاده کنید. اگر انتظار دارید پاسخ‌ها در یک کانال گفتگو برسند، تأیید کنید که تحویل فعال است (`/deliver on`).

    مستندات: [TUI](/fa/web/tui)، [فرمان‌های اسلش](/fa/tools/slash-commands).

  </Accordion>

  <Accordion title="چگونه Gateway را کاملاً متوقف و سپس راه‌اندازی کنم؟">
    اگر سرویس را نصب کرده‌اید (launchd در macOS، ‏systemd در Linux):

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    در پیش‌زمینه، با Ctrl-C آن را متوقف کنید، سپس `openclaw gateway run`.

    مستندات: [راهنمای عملیاتی سرویس Gateway](/fa/gateway).

  </Accordion>

  <Accordion title="توضیح ساده: openclaw gateway restart در برابر openclaw gateway">
    `openclaw gateway restart` **سرویس پس‌زمینه** (launchd/systemd) را مجدداً راه‌اندازی می‌کند. `openclaw gateway`، Gateway را برای این نشست ترمینال **در پیش‌زمینه** اجرا می‌کند. اگر سرویس را نصب کرده‌اید از زیرفرمان‌های gateway استفاده کنید؛ برای اجرای موردی از اجرای ساده در پیش‌زمینه استفاده کنید.
  </Accordion>

  <Accordion title="سریع‌ترین راه برای دریافت جزئیات بیشتر هنگام بروز خطا">
    برای جزئیات بیشتر در کنسول، Gateway را با `--verbose` راه‌اندازی کنید، سپس فایل گزارش را برای خطاهای احراز هویت کانال، مسیریابی مدل و RPC بررسی کنید.
  </Accordion>
</AccordionGroup>

## رسانه و پیوست‌ها

<AccordionGroup>
  <Accordion title="skill من یک تصویر/PDF تولید کرد، اما چیزی ارسال نشد">
    پیوست‌های خروجی از عامل باید از فیلدهای رسانه‌ای ساخت‌یافته مانند `media`، `mediaUrl`، `path` یا `filePath` استفاده کنند. به [راه‌اندازی دستیار OpenClaw](/fa/start/openclaw) و [ارسال عامل](/fa/tools/agent-send) مراجعه کنید.

    ```bash
    openclaw message send --target +15555550123 --message "بفرمایید" --media /path/to/file.png
    ```

    همچنین بررسی کنید: کانال مقصد از رسانه خروجی پشتیبانی می‌کند و توسط فهرست‌های مجاز مسدود نشده است؛ فایل در محدوده اندازه ارائه‌دهنده قرار دارد (اندازه تصاویر به حداکثر ضلع 2048px تغییر می‌کند)؛ `tools.fs.workspaceOnly=true` ارسال مسیر محلی را به فضای کاری، محل موقت/ذخیره‌گاه رسانه و فایل‌های اعتبارسنجی‌شده در sandbox محدود می‌کند؛ `tools.fs.workspaceOnly=false` (پیش‌فرض) اجازه می‌دهد ارسال‌های رسانه محلی ساخت‌یافته از فایل‌های محلی میزبان که عامل از قبل قادر به خواندن آن‌هاست استفاده کنند؛ این شامل رسانه‌ها و انواع امن سند است (تصاویر، صدا، ویدئو، PDF، اسناد Office و اسناد متنی اعتبارسنجی‌شده مانند Markdown/MD، ‏TXT، ‏JSON، ‏YAML/YML). این یک اسکنر اسرار نیست — اگر پسوند و اعتبارسنجی محتوا مطابقت داشته باشند، یک `secret.txt` یا `config.json` قابل‌خواندن برای عامل می‌تواند پیوست شود. فایل‌های حساس را خارج از مسیرهای قابل‌خواندن برای عامل نگه دارید، یا برای ارسال‌های سخت‌گیرانه‌تر از مسیر محلی، `tools.fs.workspaceOnly=true` را حفظ کنید.

    به [تصاویر](/fa/nodes/images) مراجعه کنید.

  </Accordion>
</AccordionGroup>

## امنیت و کنترل دسترسی

<AccordionGroup>
  <Accordion title="آیا در معرض پیام‌های خصوصی ورودی قرار دادن OpenClaw امن است؟">
    پیام‌های خصوصی ورودی را ورودی نامطمئن در نظر بگیرید. پیش‌فرض‌ها خطر را کاهش می‌دهند:

    - رفتار پیش‌فرض در کانال‌هایی که قابلیت پیام خصوصی دارند، **جفت‌سازی** است: فرستندگان ناشناس یک کد جفت‌سازی دریافت می‌کنند و پیامشان پردازش نمی‌شود. با `openclaw pairing approve --channel <channel> [--account <id>] <code>` تأیید کنید. درخواست‌های در انتظار به **3 مورد در هر کانال** محدود می‌شوند؛ اگر کدی نرسید، `openclaw pairing list --channel <channel> [--account <id>]` را بررسی کنید.
    - عمومی‌کردن پیام‌های خصوصی به فعال‌سازی صریح نیاز دارد (`dmPolicy: "open"` و فهرست مجاز `"*"`).

    برای آشکارکردن سیاست‌های پرخطر پیام خصوصی، `openclaw doctor` را اجرا کنید.

  </Accordion>

  <Accordion title="آیا تزریق پرامپت فقط برای ربات‌های عمومی نگران‌کننده است؟">
    خیر. تزریق پرامپت به **محتوای نامطمئن** مربوط است، نه فقط به اینکه چه کسی می‌تواند به ربات پیام خصوصی بدهد. اگر دستیار شما محتوای خارجی را می‌خواند (جست‌وجو/واکشی وب، صفحه‌های مرورگر، ایمیل‌ها، اسناد، پیوست‌ها، گزارش‌های جای‌گذاری‌شده)، آن محتوا می‌تواند حاوی دستورهایی برای ربودن کنترل مدل باشد — حتی اگر تنها فرستنده خودتان باشید.

    بیشترین خطر زمانی است که ابزارها فعال‌اند: ممکن است مدل فریب بخورد و زمینه را استخراج کند یا از طرف شما ابزارها را فراخوانی کند. دامنه آسیب را کاهش دهید:

    - برای خلاصه‌سازی محتوای نامطمئن، از یک عامل «خواننده» فقط‌خواندنی یا بدون ابزار استفاده کنید
    - برای عامل‌های دارای ابزار، `web_search` / `web_fetch` / `browser` را غیرفعال نگه دارید
    - متن رمزگشایی‌شده فایل/سند را نیز نامطمئن در نظر بگیرید: هم `input_file` در OpenResponses و هم استخراج پیوست رسانه، متن استخراج‌شده را به‌جای عبور مستقیم متن خام فایل، در نشانگرهای مرزی صریح محتوای خارجی قرار می‌دهند
    - از sandbox و فهرست‌های مجاز سخت‌گیرانه ابزارها استفاده کنید

    جزئیات: [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="آیا OpenClaw به‌دلیل استفاده از TypeScript/Node به‌جای Rust/WASM امنیت کمتری دارد؟">
    زبان و محیط اجرا مهم‌اند، اما خطر اصلی برای یک عامل شخصی نیستند. خطرهای عملی عبارت‌اند از در معرض قرار گرفتن Gateway، اینکه چه کسی می‌تواند به ربات پیام دهد، تزریق پرامپت، دامنه ابزارها، مدیریت اطلاعات احراز هویت، دسترسی مرورگر، دسترسی exec و اعتماد به skill/Plugin شخص ثالث.

    Rust و WASM می‌توانند برای برخی دسته‌های کد جداسازی قوی‌تری فراهم کنند، اما تزریق پرامپت، فهرست‌های مجاز نامناسب، در معرض قرار گرفتن عمومی Gateway، ابزارهای بیش‌ازحد گسترده یا نمایه مرورگری را که از قبل وارد حساب‌های حساس شده است حل نمی‌کنند. این موارد را کنترل‌های اصلی در نظر بگیرید: Gateway را خصوصی یا دارای احراز هویت نگه دارید، برای پیام‌های خصوصی/گروه‌ها از جفت‌سازی و فهرست‌های مجاز استفاده کنید، ابزارهای پرخطر را برای ورودی‌های نامطمئن رد یا در sandbox اجرا کنید، فقط Pluginها و skillهای مورد اعتماد را نصب کنید و پس از تغییرات پیکربندی `openclaw security audit --deep` را اجرا کنید.

    جزئیات: [امنیت](/fa/gateway/security)، [اجرای sandbox](/fa/gateway/sandboxing).

  </Accordion>

  <Accordion title="گزارش‌هایی درباره نمونه‌های در معرض دسترس OpenClaw دیدم. چه چیزی را باید بررسی کنم؟">
    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    یک خط مبنای امن‌تر: Gateway به `loopback` متصل باشد، یا فقط از طریق دسترسی خصوصی احرازشده در معرض قرار گیرد (tailnet، تونل SSH، احراز هویت با توکن/گذرواژه یا یک پراکسی مورد اعتماد با پیکربندی صحیح)؛ پیام‌های خصوصی در حالت `pairing` یا `allowlist` باشند؛ گروه‌ها در فهرست مجاز قرار گیرند و به اشاره‌کردن مشروط باشند، مگر اینکه همه اعضا مورد اعتماد باشند؛ ابزارهای پرخطر (`exec`، `browser`، `gateway`، `cron`) برای عامل‌هایی که محتوای نامطمئن می‌خوانند رد شوند یا دامنه‌شان به‌شدت محدود باشد؛ هرجا اجرای ابزار به دامنه آسیب کوچک‌تری نیاز دارد، sandbox فعال باشد.

    اتصال‌های عمومی بدون احراز هویت، پیام‌های خصوصی/گروه‌های باز همراه با ابزارها و کنترل مرورگرِ در معرض دسترس، یافته‌هایی هستند که باید ابتدا برطرف شوند. جزئیات: [openclaw security audit](/fa/gateway/security#openclaw-security-audit).

  </Accordion>

  <Accordion title="آیا نصب skillهای ClawHub و Pluginهای شخص ثالث امن است؟">
    با skillها و Pluginهای شخص ثالث مانند کدی رفتار کنید که خودتان اعتماد به آن را انتخاب می‌کنید. صفحه‌های skill در ClawHub پیش از نصب وضعیت اسکن را نمایش می‌دهند، اما اسکن‌ها یک مرز امنیتی کامل نیستند. OpenClaw هنگام نصب یا به‌روزرسانی Plugin/skill مسدودسازی داخلی و محلی کد خطرناک را اجرا نمی‌کند؛ برای تصمیم‌های مجاز/مسدودسازی محلی از `security.installPolicy` تحت مالکیت اپراتور استفاده کنید.

    الگوی امن‌تر: نویسندگان مورد اعتماد و نسخه‌های ثابت را ترجیح دهید، پیش از فعال‌سازی skill/Plugin آن را بخوانید، فهرست‌های مجاز Plugin/skill را محدود نگه دارید، گردش‌کارهای دارای ورودی نامطمئن را در یک sandbox با حداقل ابزارها اجرا کنید و از دادن دسترسی گسترده به سامانه فایل، exec، مرورگر یا اسرار به کد شخص ثالث خودداری کنید.

    جزئیات: [Skills](/fa/tools/skills)، [Pluginها](/fa/tools/plugin)، [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="آیا ربات من باید ایمیل، حساب GitHub یا شماره تلفن مختص خودش را داشته باشد؟">
    بله، برای بیشتر راه‌اندازی‌ها. جداسازی ربات با حساب‌ها و شماره‌تلفن‌های جداگانه، در صورت بروز مشکل دامنه آسیب را کاهش می‌دهد و چرخش اطلاعات احراز هویت یا لغو دسترسی را بدون تأثیر بر حساب‌های شخصی آسان‌تر می‌کند.

    از محدوده کوچک شروع کنید: فقط به ابزارها و حساب‌هایی که واقعاً نیاز دارید دسترسی بدهید و در صورت نیاز بعداً آن را گسترش دهید.

    مستندات: [امنیت](/fa/gateway/security)، [جفت‌سازی](/fa/channels/pairing).

  </Accordion>

  <Accordion title="آیا می‌توانم کنترل خودکار پیام‌های متنی‌ام را به آن بدهم و آیا این کار امن است؟">
    ما کنترل خودکار کامل پیام‌های شخصی را توصیه **نمی‌کنیم**. امن‌ترین الگو: پیام‌های خصوصی را در **حالت جفت‌سازی** یا یک فهرست مجاز محدود نگه دارید، اگر قرار است از طرف شما پیام بفرستد از یک **شماره یا حساب جداگانه** استفاده کنید و اجازه دهید پیش‌نویس تهیه کند، درحالی‌که شما **پیش از ارسال تأیید می‌کنید**.

    برای آزمایش، این کار را روی یک حساب اختصاصی و جداشده انجام دهید. به [امنیت](/fa/gateway/security) مراجعه کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم برای وظایف دستیار شخصی از مدل‌های ارزان‌تر استفاده کنم؟">
    بله، **اگر** عامل فقط برای گفتگو است و ورودی مورد اعتماد است. رده‌های کوچک‌تر در برابر ربایش دستور آسیب‌پذیرترند، بنابراین برای عامل‌های دارای ابزار یا هنگام خواندن محتوای نامطمئن از آن‌ها استفاده نکنید. اگر ناچارید از مدل کوچک‌تری استفاده کنید، ابزارها را محدود کنید و آن را داخل یک sandbox اجرا کنید. به [امنیت](/fa/gateway/security) مراجعه کنید.
  </Accordion>

  <Accordion title="در Telegram فرمان /start را اجرا کردم اما کد جفت‌سازی دریافت نکردم">
    کدهای جفت‌سازی **فقط** زمانی ارسال می‌شوند که یک فرستنده ناشناس به ربات پیام دهد و `dmPolicy: "pairing"` فعال باشد؛ `/start` به‌تنهایی کدی تولید نمی‌کند.

    درخواست‌های در انتظار را بررسی کنید:

    ```bash
    openclaw pairing list telegram
    ```

    برای دسترسی فوری، شناسه فرستنده خود را در فهرست مجاز قرار دهید یا برای آن حساب `dmPolicy: "open"` را تنظیم کنید.

  </Accordion>

  <Accordion title="WhatsApp: آیا به مخاطبان من پیام می‌دهد؟ جفت‌سازی چگونه کار می‌کند؟">
    خیر. سیاست پیش‌فرض پیام خصوصی WhatsApp، **جفت‌سازی** است. فرستندگان ناشناس فقط یک کد جفت‌سازی دریافت می‌کنند؛ پیام آن‌ها **پردازش نمی‌شود**. OpenClaw فقط به گفتگوهایی که دریافت می‌کند یا ارسال‌های صریحی که شما فعال می‌کنید پاسخ می‌دهد.

    ```bash
    openclaw pairing approve whatsapp <code>
    openclaw pairing list whatsapp
    ```

    اعلان شماره تلفنِ جادوگر، **فهرست مجاز/مالک** را تنظیم می‌کند تا پیام‌های خصوصی خودتان مجاز باشند — این شماره برای ارسال خودکار استفاده نمی‌شود. برای شماره شخصی WhatsApp خود، همان شماره را وارد و `channels.whatsapp.selfChatMode` را فعال کنید.

  </Accordion>
</AccordionGroup>

## فرمان‌های چت، لغو وظایف و «متوقف نمی‌شود»

<AccordionGroup>
  <Accordion title="چگونه نمایش پیام‌های داخلی سیستم را در چت متوقف کنم؟">
    بیشتر پیام‌های داخلی/ابزار فقط زمانی نمایش داده می‌شوند که **حالت پرجزئیات**، **ردیابی** یا **استدلال** برای آن نشست فعال باشد.

    در همان چتی که این پیام‌ها را می‌بینید، مشکل را برطرف کنید:

    ```text
    /verbose off
    /trace off
    /reasoning off
    ```

    اگر همچنان شلوغ است: تنظیمات نشست را در رابط کنترل بررسی کنید و حالت پرجزئیات را روی **ارث‌بری** بگذارید؛ مطمئن شوید از نمایه رباتی استفاده نمی‌کنید که در پیکربندی دارای `verboseDefault: "on"` است.

    مستندات: [تفکر و حالت پرجزئیات](/fa/tools/thinking)، [امنیت](/fa/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="چگونه یک وظیفه در حال اجرا را متوقف/لغو کنم؟">
    برای فعال‌کردن لغو، هرکدام از این موارد را **به‌صورت پیامی مستقل** (بدون اسلش) ارسال کنید: `stop`، `stop action`، `stop current action`، `stop run`، `stop current run`، `stop agent`، `stop the agent`، `stop openclaw`، `openclaw stop`، `stop don't do anything`، `stop do not do anything`، `stop doing anything`، `do not do that`، `please stop`، `stop please`، `abort`، `esc`، `exit`، `interrupt`، `halt`. محرک‌های رایج غیرفارسی (فرانسوی، آلمانی، اسپانیایی، چینی، ژاپنی، هندی، عربی و روسی) نیز کار می‌کنند.

    برای فرایندهای پس‌زمینه‌ای که ابزار اجرا راه‌اندازی کرده است، از عامل بخواهید این فرمان را اجرا کند:

    ```text
    process action:kill sessionId:XXX
    ```

    بیشتر فرمان‌های اسلش باید به‌صورت پیامی **مستقل** که با `/` آغاز می‌شود ارسال شوند، اما چند میان‌بر (مانند `/status`) برای فرستندگان موجود در فهرست مجاز به‌صورت درون‌خطی نیز کار می‌کنند. [فرمان‌های اسلش](/fa/tools/slash-commands) را ببینید.

  </Accordion>

  <Accordion title='چگونه از Telegram به Discord پیام بفرستم؟ («پیام‌رسانی بین‌زمینه‌ای رد شد»)'>
    OpenClaw پیام‌رسانی **بین ارائه‌دهندگان** را به‌طور پیش‌فرض مسدود می‌کند. اگر فراخوانی ابزاری به Telegram متصل باشد، تا زمانی که صریحاً آن را مجاز نکنید به Discord ارسال نخواهد کرد — این تغییر بلافاصله اعمال می‌شود و نیازی به راه‌اندازی مجدد Gateway نیست:

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

  </Accordion>

  <Accordion title='چرا به نظر می‌رسد ربات پیام‌های سریع و پیاپی را «نادیده می‌گیرد»؟'>
    به‌طور پیش‌فرض، اعلان‌های میان‌اجرا به اجرای فعال هدایت می‌شوند. برای انتخاب رفتار اجرای فعال از `/queue` استفاده کنید:

    - `steer` (پیش‌فرض) — اجرای فعال را در مرز بعدی مدل هدایت می‌کند.
    - `followup` — پیام‌ها را در صف قرار می‌دهد و پس از پایان اجرای فعلی، آن‌ها را یکی‌یکی اجرا می‌کند.
    - `collect` — پیام‌های سازگار را در صف قرار می‌دهد و پس از پایان اجرای فعلی، یک‌بار پاسخ می‌دهد.
    - `interrupt` — اجرای فعلی را لغو می‌کند و اجرای تازه‌ای را آغاز می‌کند.

    گزینه‌هایی مانند `debounce:0.5s cap:25 drop:summarize` را به حالت‌های صف اضافه کنید. [صف فرمان](/fa/concepts/queue) و [صف هدایت](/fa/concepts/queue-steering) را ببینید.

  </Accordion>
</AccordionGroup>

## متفرقه

<AccordionGroup>
  <Accordion title='مدل پیش‌فرض Anthropic هنگام استفاده از کلید API چیست؟'>
    اعتبارنامه‌ها و انتخاب مدل از هم جدا هستند. تنظیم `ANTHROPIC_API_KEY` (یا ذخیره کلید API متعلق به Anthropic در نمایه‌های احراز هویت) احراز هویت را فعال می‌کند، اما مدل پیش‌فرض واقعی همان مدلی است که در `agents.defaults.model.primary` پیکربندی می‌کنید (برای مثال `anthropic/claude-sonnet-4-6` یا `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` یعنی Gateway نتوانسته است اعتبارنامه‌های Anthropic را در `auth-profiles.json` مورد انتظار برای عامل در حال اجرا پیدا کند.
  </Accordion>
</AccordionGroup>

---

هنوز مشکل دارید؟ در [Discord](https://discord.com/invite/clawd) بپرسید یا یک [گفت‌وگوی GitHub](https://github.com/openclaw/openclaw/discussions) باز کنید.

## مرتبط

- [پرسش‌های متداول نخستین اجرا](/fa/help/faq-first-run) — نصب، راه‌اندازی اولیه، احراز هویت، اشتراک‌ها، خطاهای اولیه
- [پرسش‌های متداول مدل‌ها](/fa/help/faq-models) — انتخاب مدل، جایگزینی هنگام خرابی، نمایه‌های احراز هویت
- [عیب‌یابی](/fa/help/troubleshooting) — بررسی اولیه بر اساس نشانه‌ها
