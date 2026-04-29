---
read_when:
    - پاسخ به پرسش‌های رایج پشتیبانی درباره راه‌اندازی، نصب، آماده‌سازی اولیه یا زمان اجرا
    - بررسی اولیه مشکلات گزارش‌شده توسط کاربران پیش از اشکال‌زدایی عمیق‌تر
summary: پرسش‌های متداول درباره راه‌اندازی، پیکربندی و استفاده از OpenClaw
title: پرسش‌های متداول
x-i18n:
    generated_at: "2026-04-29T22:59:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6f6a8b549962a57b98760ba40ba4579dad319c9ccd411560c030ee80799d11b
    source_path: help/faq.md
    workflow: 16
---

پاسخ‌های سریع به‌همراه عیب‌یابی عمیق‌تر برای راه‌اندازی‌های واقعی (توسعه محلی، VPS، چندعاملی، کلیدهای OAuth/API، جایگزینی مدل). برای عیب‌یابی زمان اجرا، [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید. برای مرجع کامل پیکربندی، [پیکربندی](/fa/gateway/configuration) را ببینید.

## ۶۰ ثانیه اول اگر چیزی خراب است

1. **وضعیت سریع (اولین بررسی)**

   ```bash
   openclaw status
   ```

   خلاصه سریع محلی: سیستم‌عامل + به‌روزرسانی، دسترس‌پذیری gateway/service، عامل‌ها/جلسه‌ها، پیکربندی ارائه‌دهنده + مشکلات زمان اجرا (وقتی Gateway در دسترس باشد).

2. **گزارش قابل چسباندن (امن برای اشتراک‌گذاری)**

   ```bash
   openclaw status --all
   ```

   تشخیص فقط‌خواندنی همراه با انتهای گزارش‌ها (توکن‌ها پوشانده می‌شوند).

3. **وضعیت Daemon + پورت**

   ```bash
   openclaw gateway status
   ```

   زمان اجرای ناظر در برابر دسترس‌پذیری RPC، URL هدف probe، و پیکربندی‌ای را نشان می‌دهد که سرویس احتمالاً استفاده کرده است.

4. **probeهای عمیق**

   ```bash
   openclaw status --deep
   ```

   یک probe زنده سلامت Gateway اجرا می‌کند، از جمله probeهای کانال وقتی پشتیبانی شوند
   (به Gateway قابل دسترسی نیاز دارد). [سلامت](/fa/gateway/health) را ببینید.

5. **دنبال کردن آخرین گزارش**

   ```bash
   openclaw logs --follow
   ```

   اگر RPC از دسترس خارج است، به این برگردید:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   گزارش‌های فایل از گزارش‌های سرویس جدا هستند؛ [گزارش‌گیری](/fa/logging) و [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید.

6. **اجرای doctor (تعمیرها)**

   ```bash
   openclaw doctor
   ```

   پیکربندی/وضعیت را تعمیر/مهاجرت می‌دهد + بررسی‌های سلامت را اجرا می‌کند. [Doctor](/fa/gateway/doctor) را ببینید.

7. **نمای لحظه‌ای Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   از Gateway در حال اجرا یک نمای لحظه‌ای کامل می‌خواهد (فقط WS). [سلامت](/fa/gateway/health) را ببینید.

## شروع سریع و راه‌اندازی اجرای اول

پرسش‌وپاسخ اجرای اول — نصب، راه‌اندازی اولیه، مسیرهای احراز هویت، اشتراک‌ها، خطاهای اولیه —
در [پرسش‌های متداول اجرای اول](/fa/help/faq-first-run) قرار دارد.

## OpenClaw چیست؟

<AccordionGroup>
  <Accordion title="OpenClaw، در یک پاراگراف، چیست؟">
    OpenClaw یک دستیار هوش مصنوعی شخصی است که روی دستگاه‌های خودتان اجرا می‌کنید. روی پیام‌رسان‌هایی که همین حالا استفاده می‌کنید پاسخ می‌دهد (WhatsApp، Telegram، Slack، Mattermost، Discord، Google Chat، Signal، iMessage، WebChat، و Pluginهای کانال همراه مانند QQ Bot) و همچنین روی پلتفرم‌های پشتیبانی‌شده می‌تواند صدا + Canvas زنده ارائه کند. **Gateway** صفحه کنترل همیشه‌روشن است؛ دستیار همان محصول است.
  </Accordion>

  <Accordion title="پیشنهاد ارزش">
    OpenClaw «فقط یک پوشش Claude» نیست. یک **صفحه کنترل local-first** است که به شما اجازه می‌دهد
    یک دستیار توانمند را روی **سخت‌افزار خودتان** اجرا کنید، از برنامه‌های گفتگویی که همین حالا استفاده می‌کنید به آن دسترسی داشته باشید، با
    جلسه‌های حالت‌دار، حافظه، و ابزارها - بدون سپردن کنترل جریان‌های کاری‌تان به یک SaaS
    میزبانی‌شده.

    نکات برجسته:

    - **دستگاه‌های شما، داده‌های شما:** Gateway را هر جا که می‌خواهید اجرا کنید (Mac، Linux، VPS) و
      workspace + تاریخچه جلسه را محلی نگه دارید.
    - **کانال‌های واقعی، نه یک جعبه‌شنی وب:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc،
      به‌همراه صدای موبایل و Canvas روی پلتفرم‌های پشتیبانی‌شده.
    - **مستقل از مدل:** از Anthropic، OpenAI، MiniMax، OpenRouter و غیره، با مسیریابی
      و جایگزینی برای هر عامل استفاده کنید.
    - **گزینه فقط‌محلی:** مدل‌های محلی را اجرا کنید تا اگر خواستید **همه داده‌ها بتوانند روی دستگاه شما بمانند**.
    - **مسیریابی چندعاملی:** عامل‌های جداگانه برای هر کانال، حساب، یا کار، هرکدام با
      workspace و پیش‌فرض‌های خودش.
    - **متن‌باز و قابل هک:** بدون قفل‌شدگی به فروشنده، بررسی، گسترش، و خودمیزبانی کنید.

    مستندات: [Gateway](/fa/gateway)، [کانال‌ها](/fa/channels)، [چندعاملی](/fa/concepts/multi-agent)،
    [حافظه](/fa/concepts/memory).

  </Accordion>

  <Accordion title="تازه راه‌اندازی‌اش کردم - اول چه کار کنم؟">
    پروژه‌های خوب برای شروع:

    - ساخت یک وب‌سایت (WordPress، Shopify، یا یک سایت ایستای ساده).
    - نمونه‌سازی یک اپ موبایل (طرح کلی، صفحه‌ها، برنامه API).
    - سازمان‌دهی فایل‌ها و پوشه‌ها (پاک‌سازی، نام‌گذاری، برچسب‌گذاری).
    - اتصال Gmail و خودکارسازی خلاصه‌ها یا پیگیری‌ها.

    می‌تواند کارهای بزرگ را انجام دهد، اما وقتی آن‌ها را به فازها تقسیم کنید و
    از زیرعامل‌ها برای کار موازی استفاده کنید بهترین نتیجه را می‌دهد.

  </Accordion>

  <Accordion title="پنج کاربرد روزمره برتر OpenClaw کدام‌اند؟">
    بردهای روزمره معمولاً این‌طور هستند:

    - **خلاصه‌های شخصی:** خلاصه‌هایی از صندوق ورودی، تقویم، و خبرهایی که برایتان مهم است.
    - **پژوهش و پیش‌نویس‌نویسی:** پژوهش سریع، خلاصه‌ها، و پیش‌نویس‌های اولیه برای ایمیل‌ها یا مستندات.
    - **یادآورها و پیگیری‌ها:** تلنگرها و چک‌لیست‌های مبتنی بر Cron یا Heartbeat.
    - **اتوماسیون مرورگر:** پر کردن فرم‌ها، جمع‌آوری داده‌ها، و تکرار کارهای وب.
    - **هماهنگی بین دستگاه‌ها:** یک کار را از گوشی‌تان بفرستید، بگذارید Gateway آن را روی سرور اجرا کند، و نتیجه را در گفتگو پس بگیرید.

  </Accordion>

  <Accordion title="آیا OpenClaw می‌تواند در جذب سرنخ، ارتباط‌گیری، تبلیغات، و وبلاگ‌ها برای یک SaaS کمک کند؟">
    بله، برای **پژوهش، صلاحیت‌سنجی، و پیش‌نویس‌نویسی**. می‌تواند سایت‌ها را اسکن کند، فهرست‌های کوتاه بسازد،
    مشتریان احتمالی را خلاصه کند، و پیش‌نویس متن‌های ارتباط‌گیری یا تبلیغاتی بنویسد.

    برای **اجرای ارتباط‌گیری یا تبلیغات**، انسان را در چرخه نگه دارید. از هرزنامه پرهیز کنید، قوانین محلی و
    سیاست‌های پلتفرم را رعایت کنید، و پیش از ارسال هرچیز آن را بازبینی کنید. امن‌ترین الگو این است که
    OpenClaw پیش‌نویس کند و شما تأیید کنید.

    مستندات: [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="مزیت‌ها نسبت به Claude Code برای توسعه وب چیست؟">
    OpenClaw یک **دستیار شخصی** و لایه هماهنگی است، نه جایگزین IDE. برای سریع‌ترین چرخه مستقیم کدنویسی داخل یک repo از
    Claude Code یا Codex استفاده کنید. وقتی حافظه ماندگار، دسترسی بین دستگاه‌ها، و ارکستراسیون ابزار می‌خواهید، از OpenClaw استفاده کنید.

    مزیت‌ها:

    - **حافظه + workspace پایدار** در سراسر جلسه‌ها
    - **دسترسی چندپلتفرمی** (WhatsApp، Telegram، TUI، WebChat)
    - **ارکستراسیون ابزار** (مرورگر، فایل‌ها، زمان‌بندی، hookها)
    - **Gateway همیشه‌روشن** (روی VPS اجرا کنید، از هرجا تعامل کنید)
    - **Nodeها** برای مرورگر/صفحه‌نمایش/دوربین/exec محلی

    ویترین: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills و اتوماسیون

<AccordionGroup>
  <Accordion title="چطور Skills را بدون کثیف نگه داشتن repo سفارشی کنم؟">
    به‌جای ویرایش نسخه repo، از بازنویسی‌های مدیریت‌شده استفاده کنید. تغییراتتان را در `~/.openclaw/skills/<name>/SKILL.md` بگذارید (یا از طریق `skills.load.extraDirs` در `~/.openclaw/openclaw.json` یک پوشه اضافه کنید). تقدم این است: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → همراه → `skills.load.extraDirs`، بنابراین بازنویسی‌های مدیریت‌شده بدون دست زدن به git همچنان بر Skills همراه اولویت دارند. اگر لازم است Skill به‌صورت سراسری نصب شود اما فقط برای بعضی عامل‌ها قابل مشاهده باشد، نسخه مشترک را در `~/.openclaw/skills` نگه دارید و با `agents.defaults.skills` و `agents.list[].skills` دیدپذیری را کنترل کنید. فقط ویرایش‌هایی که شایسته upstream هستند باید در repo بمانند و به‌صورت PR ارسال شوند.
  </Accordion>

  <Accordion title="آیا می‌توانم Skills را از یک پوشه سفارشی بارگذاری کنم؟">
    بله. دایرکتوری‌های اضافی را از طریق `skills.load.extraDirs` در `~/.openclaw/openclaw.json` اضافه کنید (کمترین تقدم). تقدم پیش‌فرض این است: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → همراه → `skills.load.extraDirs`. `clawhub` به‌طور پیش‌فرض در `./skills` نصب می‌کند، که OpenClaw در جلسه بعدی آن را به‌عنوان `<workspace>/skills` در نظر می‌گیرد. اگر Skill باید فقط برای عامل‌های مشخصی قابل مشاهده باشد، آن را با `agents.defaults.skills` یا `agents.list[].skills` همراه کنید.
  </Accordion>

  <Accordion title="چطور می‌توانم برای کارهای مختلف از مدل‌های مختلف استفاده کنم؟">
    الگوهای پشتیبانی‌شده امروز این‌ها هستند:

    - **کارهای Cron**: کارهای ایزوله می‌توانند برای هر کار یک override برای `model` تنظیم کنند.
    - **زیرعامل‌ها**: کارها را به عامل‌های جداگانه با مدل‌های پیش‌فرض متفاوت هدایت کنید.
    - **تغییر در زمان درخواست**: از `/model` برای تغییر مدل جلسه فعلی در هر زمان استفاده کنید.

    [کارهای Cron](/fa/automation/cron-jobs)، [مسیریابی چندعاملی](/fa/concepts/multi-agent)، و [فرمان‌های اسلش](/fa/tools/slash-commands) را ببینید.

  </Accordion>

  <Accordion title="بات هنگام انجام کار سنگین متوقف می‌شود. چطور آن را واگذار کنم؟">
    برای کارهای طولانی یا موازی از **زیرعامل‌ها** استفاده کنید. زیرعامل‌ها در جلسه خودشان اجرا می‌شوند،
    خلاصه‌ای برمی‌گردانند، و گفتگوی اصلی شما را پاسخگو نگه می‌دارند.

    از بات خود بخواهید «برای این کار یک زیرعامل ایجاد کند» یا از `/subagents` استفاده کنید.
    از `/status` در گفتگو استفاده کنید تا ببینید Gateway همین حالا چه می‌کند (و آیا مشغول است یا نه).

    نکته توکن: کارهای طولانی و زیرعامل‌ها هر دو توکن مصرف می‌کنند. اگر هزینه دغدغه است، از طریق
    `agents.defaults.subagents.model` یک مدل ارزان‌تر برای زیرعامل‌ها تنظیم کنید.

    مستندات: [زیرعامل‌ها](/fa/tools/subagents)، [کارهای پس‌زمینه](/fa/automation/tasks).

  </Accordion>

  <Accordion title="جلسه‌های زیرعامل وابسته به رشته در Discord چگونه کار می‌کنند؟">
    از اتصال‌های رشته استفاده کنید. می‌توانید یک رشته Discord را به یک زیرعامل یا هدف جلسه وصل کنید تا پیام‌های بعدی در همان رشته روی همان جلسه متصل باقی بمانند.

    جریان پایه:

    - با `sessions_spawn` و با استفاده از `thread: true` ایجاد کنید (و به‌صورت اختیاری `mode: "session"` برای پیگیری پایدار).
    - یا با `/focus <target>` به‌صورت دستی وصل کنید.
    - از `/agents` برای بررسی وضعیت اتصال استفاده کنید.
    - از `/session idle <duration|off>` و `/session max-age <duration|off>` برای کنترل auto-unfocus استفاده کنید.
    - از `/unfocus` برای جدا کردن رشته استفاده کنید.

    پیکربندی لازم:

    - پیش‌فرض‌های سراسری: `session.threadBindings.enabled`، `session.threadBindings.idleHours`، `session.threadBindings.maxAgeHours`.
    - بازنویسی‌های Discord: `channels.discord.threadBindings.enabled`، `channels.discord.threadBindings.idleHours`، `channels.discord.threadBindings.maxAgeHours`.
    - اتصال خودکار هنگام ایجاد: `channels.discord.threadBindings.spawnSubagentSessions: true` را تنظیم کنید.

    مستندات: [زیرعامل‌ها](/fa/tools/subagents)، [Discord](/fa/channels/discord)، [مرجع پیکربندی](/fa/gateway/configuration-reference)، [فرمان‌های اسلش](/fa/tools/slash-commands).

  </Accordion>

  <Accordion title="یک زیرعامل تمام شد، اما به‌روزرسانی تکمیل به جای اشتباه رفت یا اصلاً ارسال نشد. چه چیزی را بررسی کنم؟">
    ابتدا مسیر درخواست‌کننده حل‌شده را بررسی کنید:

    - تحویل زیرعامل در حالت تکمیل، وقتی رشته یا مسیر گفتگوی متصل وجود داشته باشد، آن را ترجیح می‌دهد.
    - اگر مبدأ تکمیل فقط یک کانال داشته باشد، OpenClaw به مسیر ذخیره‌شده جلسه درخواست‌کننده (`lastChannel` / `lastTo` / `lastAccountId`) برمی‌گردد تا تحویل مستقیم همچنان بتواند موفق شود.
    - اگر نه مسیر متصلی وجود داشته باشد و نه مسیر ذخیره‌شده قابل استفاده‌ای، تحویل مستقیم می‌تواند شکست بخورد و نتیجه به‌جای ارسال فوری به گفتگو، به تحویل صف‌شده جلسه برگردد.
    - هدف‌های نامعتبر یا کهنه همچنان می‌توانند fallback به صف یا شکست نهایی تحویل را تحمیل کنند.
    - اگر آخرین پاسخ قابل مشاهده دستیارِ فرزند دقیقاً توکن خاموش `NO_REPLY` / `no_reply`، یا دقیقاً `ANNOUNCE_SKIP` باشد، OpenClaw عمداً announce را سرکوب می‌کند به‌جای اینکه پیشرفت کهنه قبلی را ارسال کند.
    - اگر فرزند پس از فقط فراخوانی‌های ابزار timeout شود، announce می‌تواند آن را به یک خلاصه کوتاه از پیشرفت جزئی تبدیل کند به‌جای اینکه خروجی خام ابزار را بازپخش کند.

    اشکال‌زدایی:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [زیرعامل‌ها](/fa/tools/subagents)، [کارهای پس‌زمینه](/fa/automation/tasks)، [ابزارهای جلسه](/fa/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron یا یادآورها اجرا نمی‌شوند. چه چیزی را بررسی کنم؟">
    Cron داخل فرایند Gateway اجرا می‌شود. اگر Gateway به‌طور پیوسته در حال اجرا نباشد،
    کارهای زمان‌بندی‌شده اجرا نمی‌شوند.

    چک‌لیست:

    - تأیید کنید cron فعال است (`cron.enabled`) و `OPENCLAW_SKIP_CRON` تنظیم نشده است.
    - بررسی کنید Gateway به‌صورت ۲۴/۷ در حال اجرا است (بدون sleep/restarts).
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

    - `--no-deliver` / `delivery.mode: "none"` یعنی انتظار نمی‌رود ارسال جایگزین توسط اجراکننده انجام شود.
    - هدف اعلامِ گم‌شده یا نامعتبر (`channel` / `to`) یعنی اجراکننده تحویل خروجی را رد کرده است.
    - شکست‌های احراز هویت کانال (`unauthorized`, `Forbidden`) یعنی اجراکننده تلاش کرده تحویل دهد اما اعتبارنامه‌ها مانع شده‌اند.
    - نتیجه ایزوله‌شده و بی‌صدا (فقط `NO_REPLY` / `no_reply`) عمداً غیرقابل تحویل در نظر گرفته می‌شود، بنابراین اجراکننده تحویل جایگزین صف‌شده را هم سرکوب می‌کند.

    برای کارهای cron ایزوله، وقتی مسیر گفت‌وگو در دسترس باشد، عامل همچنان می‌تواند مستقیماً با ابزار `message`
    ارسال کند. `--announce` فقط مسیر جایگزین اجراکننده
    برای متن نهایی‌ای را کنترل می‌کند که عامل از قبل ارسال نکرده است.

    اشکال‌زدایی:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [کارهای پس‌زمینه](/fa/automation/tasks).

  </Accordion>

  <Accordion title="چرا یک اجرای cron ایزوله مدل‌ها را عوض کرد یا یک بار دوباره تلاش کرد؟">
    این معمولاً مسیر تعویض مدل زنده است، نه زمان‌بندی تکراری.

    cron ایزوله می‌تواند یک واگذاری مدل در زمان اجرا را پایدار کند و وقتی اجرای فعال
    `LiveSessionModelSwitchError` پرتاب می‌کند دوباره تلاش کند. تلاش دوباره، ارائه‌دهنده/مدلِ تعویض‌شده
    را نگه می‌دارد، و اگر تعویض شامل یک بازنویسی پروفایل احراز هویت جدید باشد، cron
    آن را هم پیش از تلاش دوباره پایدار می‌کند.

    قواعد انتخاب مرتبط:

    - بازنویسی مدل hook جیمیل، وقتی قابل اعمال باشد، اولویت نخست را دارد.
    - سپس `model` هر کار.
    - سپس هر بازنویسی مدل ذخیره‌شده برای نشست cron.
    - سپس انتخاب معمول مدل عامل/پیش‌فرض.

    حلقه تلاش دوباره محدود است. پس از تلاش اولیه به‌علاوه ۲ تلاش دوباره برای تعویض،
    cron به‌جای حلقه بی‌پایان متوقف می‌شود.

    اشکال‌زدایی:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [CLI cron](/fa/cli/cron).

  </Accordion>

  <Accordion title="چگونه Skills را روی Linux نصب کنم؟">
    از فرمان‌های بومی `openclaw skills` استفاده کنید یا Skills را در فضای کاری خود قرار دهید. رابط کاربری macOS Skills روی Linux در دسترس نیست.
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

    `openclaw skills install` بومی در دایرکتوری `skills/`
    فضای کاری فعال می‌نویسد. CLI جداگانه `clawhub` را فقط وقتی نصب کنید که می‌خواهید Skills خودتان را منتشر یا
    همگام‌سازی کنید. برای نصب‌های مشترک بین عامل‌ها، skill را زیر
    `~/.openclaw/skills` قرار دهید و اگر می‌خواهید محدود کنید کدام عامل‌ها بتوانند آن را ببینند، از
    `agents.defaults.skills` یا
    `agents.list[].skills` استفاده کنید.

  </Accordion>

  <Accordion title="آیا OpenClaw می‌تواند کارها را طبق زمان‌بندی یا به‌صورت پیوسته در پس‌زمینه اجرا کند؟">
    بله. از زمان‌بند Gateway استفاده کنید:

    - **کارهای Cron** برای کارهای زمان‌بندی‌شده یا تکرارشونده (در میان راه‌اندازی‌های دوباره پایدار می‌مانند).
    - **Heartbeat** برای بررسی‌های دوره‌ای «نشست اصلی».
    - **کارهای ایزوله** برای عامل‌های خودکاری که خلاصه‌ها را پست می‌کنند یا به گفت‌وگوها تحویل می‌دهند.

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [اتوماسیون و کارها](/fa/automation)،
    [Heartbeat](/fa/gateway/heartbeat).

  </Accordion>

  <Accordion title="آیا می‌توانم Skills مخصوص Apple macOS را از Linux اجرا کنم؟">
    نه به‌صورت مستقیم. Skills مربوط به macOS با `metadata.openclaw.os` به‌علاوه باینری‌های لازم محدود می‌شوند، و Skills فقط وقتی در پرامپت سیستم ظاهر می‌شوند که روی **میزبان Gateway** واجد شرایط باشند. روی Linux، Skills فقط `darwin` (مانند `apple-notes`، `apple-reminders`، `things-mac`) بارگیری نمی‌شوند مگر اینکه این محدودیت را بازنویسی کنید.

    سه الگوی پشتیبانی‌شده دارید:

    **گزینه A - Gateway را روی Mac اجرا کنید (ساده‌ترین).**
    Gateway را جایی اجرا کنید که باینری‌های macOS وجود دارند، سپس از Linux در [حالت راه‌دور](#gateway-ports-already-running-and-remote-mode) یا از طریق Tailscale وصل شوید. Skills به‌طور معمول بارگیری می‌شوند چون میزبان Gateway macOS است.

    **گزینه B - از یک Node مربوط به macOS استفاده کنید (بدون SSH).**
    Gateway را روی Linux اجرا کنید، یک Node مربوط به macOS (برنامه نوار منو) را جفت کنید، و **فرمان‌های اجرای Node** را روی Mac روی "Always Ask" یا "Always Allow" تنظیم کنید. OpenClaw می‌تواند Skills مخصوص macOS را وقتی باینری‌های لازم روی Node وجود دارند، واجد شرایط در نظر بگیرد. عامل آن Skills را از طریق ابزار `nodes` اجرا می‌کند. اگر "Always Ask" را انتخاب کنید، تأیید "Always Allow" در پرامپت آن فرمان را به فهرست مجاز اضافه می‌کند.

    **گزینه C - باینری‌های macOS را از طریق SSH پراکسی کنید (پیشرفته).**
    Gateway را روی Linux نگه دارید، اما کاری کنید باینری‌های CLI لازم به wrapperهای SSH resolve شوند که روی Mac اجرا می‌شوند. سپس skill را بازنویسی کنید تا Linux را مجاز کند و واجد شرایط بماند.

    1. برای باینری یک wrapper SSH بسازید (مثال: `memo` برای Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. wrapper را روی میزبان Linux در `PATH` قرار دهید (برای مثال `~/bin/memo`).
    3. فراداده skill را (در فضای کاری یا `~/.openclaw/skills`) بازنویسی کنید تا Linux مجاز شود:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. یک نشست جدید شروع کنید تا snapshot مربوط به Skills تازه شود.

  </Accordion>

  <Accordion title="آیا یک یکپارچه‌سازی Notion یا HeyGen دارید؟">
    امروز به‌صورت داخلی وجود ندارد.

    گزینه‌ها:

    - **skill / Plugin سفارشی:** بهترین گزینه برای دسترسی قابل اتکا به API است (Notion/HeyGen هر دو API دارند).
    - **اتوماسیون مرورگر:** بدون کد کار می‌کند اما کندتر و شکننده‌تر است.

    اگر می‌خواهید زمینه را برای هر مشتری نگه دارید (گردش‌کارهای آژانس)، یک الگوی ساده این است:

    - یک صفحه Notion برای هر مشتری (زمینه + ترجیحات + کار فعال).
    - از عامل بخواهید در آغاز نشست آن صفحه را واکشی کند.

    اگر یک یکپارچه‌سازی بومی می‌خواهید، یک درخواست قابلیت باز کنید یا یک skill
    هدف‌گرفته به آن APIها بسازید.

    نصب Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    نصب‌های بومی در دایرکتوری `skills/` فضای کاری فعال قرار می‌گیرند. برای Skills مشترک بین عامل‌ها، آن‌ها را در `~/.openclaw/skills/<name>/SKILL.md` قرار دهید. اگر فقط بعضی عامل‌ها باید یک نصب مشترک را ببینند، `agents.defaults.skills` یا `agents.list[].skills` را پیکربندی کنید. بعضی Skills انتظار دارند باینری‌هایی از طریق Homebrew نصب شده باشند؛ روی Linux این یعنی Linuxbrew (مدخل پرسش‌های متداول Homebrew Linux در بالا را ببینید). [Skills](/fa/tools/skills)، [پیکربندی Skills](/fa/tools/skills-config)، و [ClawHub](/fa/tools/clawhub) را ببینید.

  </Accordion>

  <Accordion title="چگونه از Chrome موجود خودم که به آن وارد شده‌ام با OpenClaw استفاده کنم؟">
    از پروفایل مرورگر داخلی `user` استفاده کنید، که از طریق Chrome DevTools MCP متصل می‌شود:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    اگر یک نام سفارشی می‌خواهید، یک پروفایل MCP صریح بسازید:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    این مسیر می‌تواند از مرورگر میزبان محلی یا یک Node مرورگر متصل استفاده کند. اگر Gateway جای دیگری اجرا می‌شود، یا یک میزبان Node روی ماشین مرورگر اجرا کنید یا به‌جای آن از CDP راه‌دور استفاده کنید.

    محدودیت‌های فعلی در `existing-session` / `user`:

    - کنش‌ها مبتنی بر ref هستند، نه مبتنی بر CSS-selector
    - بارگذاری‌ها به `ref` / `inputRef` نیاز دارند و در حال حاضر هر بار از یک فایل پشتیبانی می‌کنند
    - `responsebody`، خروجی PDF، رهگیری دانلود، و کنش‌های دسته‌ای هنوز به یک مرورگر مدیریت‌شده یا پروفایل خام CDP نیاز دارند

  </Accordion>
</AccordionGroup>

## Sandboxing و حافظه

<AccordionGroup>
  <Accordion title="آیا مستند اختصاصی sandboxing وجود دارد؟">
    بله. [Sandboxing](/fa/gateway/sandboxing) را ببینید. برای راه‌اندازی مخصوص Docker (Gateway کامل در Docker یا تصویرهای sandbox)، [Docker](/fa/install/docker) را ببینید.
  </Accordion>

  <Accordion title="Docker محدود به نظر می‌رسد - چگونه قابلیت‌های کامل را فعال کنم؟">
    تصویر پیش‌فرض امنیت‌محور است و به‌عنوان کاربر `node` اجرا می‌شود، بنابراین
    بسته‌های سیستمی، Homebrew، یا مرورگرهای همراه را شامل نمی‌شود. برای راه‌اندازی کامل‌تر:

    - `/home/node` را با `OPENCLAW_HOME_VOLUME` پایدار کنید تا cacheها باقی بمانند.
    - وابستگی‌های سیستمی را با `OPENCLAW_DOCKER_APT_PACKAGES` در تصویر بگنجانید.
    - مرورگرهای Playwright را از طریق CLI همراه نصب کنید:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` را تنظیم کنید و مطمئن شوید مسیر پایدار است.

    مستندات: [Docker](/fa/install/docker)، [مرورگر](/fa/tools/browser).

  </Accordion>

  <Accordion title="آیا می‌توانم DMها را شخصی نگه دارم اما گروه‌ها را با یک عامل عمومی/sandboxed کنم؟">
    بله - اگر ترافیک خصوصی شما **DMها** و ترافیک عمومی شما **گروه‌ها** باشد.

    از `agents.defaults.sandbox.mode: "non-main"` استفاده کنید تا نشست‌های گروه/کانال (کلیدهای non-main) در backend پیکربندی‌شده sandbox اجرا شوند، در حالی که نشست اصلی DM روی میزبان بماند. اگر backend انتخاب نکنید، Docker پیش‌فرض است. سپس ابزارهای در دسترس در نشست‌های sandboxed را از طریق `tools.sandbox.tools` محدود کنید.

    راهنمای راه‌اندازی + پیکربندی نمونه: [گروه‌ها: DMهای شخصی + گروه‌های عمومی](/fa/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع پیکربندی کلیدی: [پیکربندی Gateway](/fa/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="چگونه یک پوشه میزبان را به sandbox متصل کنم؟">
    `agents.defaults.sandbox.docker.binds` را روی `["host:path:mode"]` تنظیم کنید (مثلاً `"/home/user/src:/src:ro"`). bindهای سراسری و هر عامل با هم ادغام می‌شوند؛ وقتی `scope: "shared"` باشد، bindهای هر عامل نادیده گرفته می‌شوند. برای هر چیز حساس از `:ro` استفاده کنید و به خاطر داشته باشید bindها دیوارهای فایل‌سیستم sandbox را دور می‌زنند.

    OpenClaw منابع bind را هم نسبت به مسیر نرمال‌شده و هم نسبت به مسیر canonical که از طریق عمیق‌ترین جد موجود resolve شده است، اعتبارسنجی می‌کند. این یعنی فرارهای والد symlink حتی وقتی آخرین بخش مسیر هنوز وجود ندارد نیز بسته می‌مانند، و بررسی‌های ریشه مجاز پس از resolve شدن symlink همچنان اعمال می‌شوند.

    برای مثال‌ها و نکته‌های ایمنی، [Sandboxing](/fa/gateway/sandboxing#custom-bind-mounts) و [Sandbox در برابر سیاست ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) را ببینید.

  </Accordion>

  <Accordion title="حافظه چگونه کار می‌کند؟">
    حافظه OpenClaw فقط فایل‌های Markdown در فضای کاری عامل است:

    - یادداشت‌های روزانه در `memory/YYYY-MM-DD.md`
    - یادداشت‌های بلندمدت گزینش‌شده در `MEMORY.md` (فقط نشست‌های اصلی/خصوصی)

    OpenClaw همچنین یک **flush بی‌صدای حافظه پیش از Compaction** اجرا می‌کند تا به مدل یادآوری کند
    پیش از auto-compaction یادداشت‌های ماندگار بنویسد. این فقط وقتی اجرا می‌شود که فضای کاری
    قابل نوشتن باشد (sandboxهای فقط‌خواندنی از آن عبور می‌کنند). [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>

  <Accordion title="حافظه مدام چیزها را فراموش می‌کند. چگونه کاری کنم بماند؟">
    از بات بخواهید **آن واقعیت را در حافظه بنویسد**. یادداشت‌های بلندمدت باید در `MEMORY.md` باشند،
    زمینه کوتاه‌مدت در `memory/YYYY-MM-DD.md` قرار می‌گیرد.

    این هنوز حوزه‌ای است که داریم بهبودش می‌دهیم. یادآوری به مدل برای ذخیره خاطرات کمک می‌کند؛
    خودش می‌داند چه کند. اگر همچنان فراموش می‌کند، بررسی کنید Gateway در هر اجرا از همان
    فضای کاری استفاده می‌کند.

    مستندات: [حافظه](/fa/concepts/memory)، [فضای کاری عامل](/fa/concepts/agent-workspace).

  </Accordion>

  <Accordion title="آیا حافظه برای همیشه پایدار می‌ماند؟ محدودیت‌ها چیست؟">
    فایل‌های حافظه روی دیسک زندگی می‌کنند و تا وقتی آن‌ها را حذف نکنید پایدار می‌مانند. محدودیت، فضای ذخیره‌سازی
    شماست، نه مدل. **زمینه نشست** همچنان توسط پنجره زمینه مدل
    محدود می‌شود، بنابراین گفت‌وگوهای طولانی می‌توانند compact یا truncate شوند. به همین دلیل
    جست‌وجوی حافظه وجود دارد - فقط بخش‌های مرتبط را دوباره به زمینه می‌آورد.

    مستندات: [حافظه](/fa/concepts/memory)، [زمینه](/fa/concepts/context).

  </Accordion>

  <Accordion title="آیا جست‌وجوی معنایی حافظه به کلید API OpenAI نیاز دارد؟">
    فقط اگر از **embeddingهای OpenAI** استفاده کنید. Codex OAuth چت/تکمیل‌ها را پوشش می‌دهد و
    دسترسی به embeddingها را **اعطا نمی‌کند**، بنابراین **ورود با Codex (OAuth یا
    ورود Codex CLI)** برای جست‌وجوی معنایی حافظه کمکی نمی‌کند. embeddingهای OpenAI
    همچنان به یک کلید API واقعی نیاز دارند (`OPENAI_API_KEY` یا `models.providers.openai.apiKey`).

    اگر provider را صراحتا تنظیم نکنید، OpenClaw وقتی بتواند یک کلید API را resolve کند
    (auth profileها، `models.providers.*.apiKey`، یا متغیرهای env)، به‌صورت خودکار یک provider را انتخاب می‌کند.
    اگر یک کلید OpenAI resolve شود، OpenAI را ترجیح می‌دهد؛ وگرنه اگر یک کلید Gemini
    resolve شود Gemini را، سپس Voyage، سپس Mistral. اگر هیچ کلید راه‌دوری موجود نباشد، جست‌وجوی حافظه
    تا زمانی که آن را پیکربندی کنید غیرفعال می‌ماند. اگر یک مسیر مدل محلی
    پیکربندی‌شده و موجود داشته باشید، OpenClaw
    `local` را ترجیح می‌دهد. Ollama وقتی پشتیبانی می‌شود که صراحتا
    `memorySearch.provider = "ollama"` را تنظیم کنید.

    اگر ترجیح می‌دهید محلی بمانید، `memorySearch.provider = "local"` را تنظیم کنید (و در صورت تمایل
    `memorySearch.fallback = "none"`). اگر embeddingهای Gemini را می‌خواهید،
    `memorySearch.provider = "gemini"` را تنظیم کنید و `GEMINI_API_KEY` (یا
    `memorySearch.remote.apiKey`) را ارائه دهید. ما از مدل‌های embedding **OpenAI، Gemini، Voyage، Mistral، Ollama، یا local**
    پشتیبانی می‌کنیم - برای جزئیات راه‌اندازی، [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>
</AccordionGroup>

## چیزها کجا روی دیسک قرار دارند

<AccordionGroup>
  <Accordion title="آیا همه داده‌های استفاده‌شده با OpenClaw به‌صورت محلی ذخیره می‌شوند؟">
    خیر - **وضعیت OpenClaw محلی است**، اما **سرویس‌های خارجی همچنان آنچه برایشان می‌فرستید را می‌بینند**.

    - **به‌صورت پیش‌فرض محلی:** sessionها، فایل‌های حافظه، config و workspace روی میزبان Gateway قرار دارند
      (`~/.openclaw` + دایرکتوری workspace شما).
    - **به‌ضرورت راه‌دور:** پیام‌هایی که به providerهای مدل (Anthropic/OpenAI/غیره) می‌فرستید به
      APIهای آن‌ها می‌روند، و پلتفرم‌های چت (WhatsApp/Telegram/Slack/غیره) داده‌های پیام را روی
      سرورهای خود ذخیره می‌کنند.
    - **شما ردپا را کنترل می‌کنید:** استفاده از مدل‌های محلی promptها را روی ماشین شما نگه می‌دارد، اما ترافیک channel
      همچنان از سرورهای همان channel عبور می‌کند.

    مرتبط: [workspace عامل](/fa/concepts/agent-workspace)، [حافظه](/fa/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw داده‌های خود را کجا ذخیره می‌کند؟">
    همه چیز زیر `$OPENCLAW_STATE_DIR` قرار دارد (پیش‌فرض: `~/.openclaw`):

    | مسیر                                                            | هدف                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | config اصلی (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | import قدیمی OAuth (در اولین استفاده داخل auth profileها کپی می‌شود)       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | auth profileها (OAuth، کلیدهای API، و `keyRef`/`tokenRef` اختیاری)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | payload اختیاری secret مبتنی بر فایل برای providerهای SecretRef از نوع `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | فایل سازگاری قدیمی (ورودی‌های static `api_key` پاک‌سازی شده‌اند)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | وضعیت provider (مثلا `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | وضعیت هر عامل (agentDir + sessionها)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | تاریخچه و وضعیت مکالمه (برای هر عامل)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | فراداده session (برای هر عامل)                                       |

    مسیر قدیمی تک‌عامله: `~/.openclaw/agent/*` (با `openclaw doctor` مهاجرت داده می‌شود).

    **workspace** شما (AGENTS.md، فایل‌های حافظه، skills و غیره) جداست و از طریق `agents.defaults.workspace` پیکربندی می‌شود (پیش‌فرض: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md کجا باید قرار داشته باشند؟">
    این فایل‌ها در **workspace عامل** قرار دارند، نه در `~/.openclaw`.

    - **Workspace (برای هر عامل)**: `AGENTS.md`، `SOUL.md`، `IDENTITY.md`، `USER.md`,
      `MEMORY.md`، `memory/YYYY-MM-DD.md`، و `HEARTBEAT.md` اختیاری.
      ریشه lowercase `memory.md` فقط ورودی repair قدیمی است؛ `openclaw doctor --fix`
      وقتی هر دو فایل وجود داشته باشند می‌تواند آن را در `MEMORY.md` ادغام کند.
    - **دایرکتوری وضعیت (`~/.openclaw`)**: config، وضعیت channel/provider، auth profileها، sessionها، logها،
      و Skills مشترک (`~/.openclaw/skills`).

    workspace پیش‌فرض `~/.openclaw/workspace` است و از این راه قابل پیکربندی است:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    اگر bot بعد از restart «فراموش» می‌کند، تأیید کنید Gateway در هر اجرا از همان
    workspace استفاده می‌کند (و به یاد داشته باشید: حالت راه‌دور از workspace
    **میزبان gateway** استفاده می‌کند، نه لپ‌تاپ محلی شما).

    نکته: اگر یک رفتار یا preference پایدار می‌خواهید، از bot بخواهید **آن را در
    AGENTS.md یا MEMORY.md بنویسد** نه اینکه به تاریخچه چت تکیه کنید.

    [workspace عامل](/fa/concepts/agent-workspace) و [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>

  <Accordion title="راهبرد پیشنهادی backup">
    **workspace عامل** خود را در یک repo خصوصی git بگذارید و آن را در جایی
    خصوصی backup بگیرید (برای مثال GitHub private). این کار حافظه + فایل‌های AGENTS/SOUL/USER
    را ثبت می‌کند و به شما اجازه می‌دهد بعدا «ذهن» assistant را restore کنید.

    هیچ چیزی زیر `~/.openclaw` (credentials، sessionها، tokenها، یا payloadهای secret رمزگذاری‌شده) را commit نکنید.
    اگر به restore کامل نیاز دارید، هم workspace و هم دایرکتوری وضعیت را
    جداگانه backup بگیرید (پرسش migration بالا را ببینید).

    مستندات: [workspace عامل](/fa/concepts/agent-workspace).

  </Accordion>

  <Accordion title="چگونه OpenClaw را کاملا uninstall کنم؟">
    راهنمای اختصاصی را ببینید: [Uninstall](/fa/install/uninstall).
  </Accordion>

  <Accordion title="آیا عامل‌ها می‌توانند بیرون از workspace کار کنند؟">
    بله. workspace همان **cwd پیش‌فرض** و لنگر حافظه است، نه یک sandbox سخت.
    مسیرهای نسبی داخل workspace resolve می‌شوند، اما مسیرهای absolute می‌توانند به مکان‌های دیگر
    میزبان دسترسی داشته باشند مگر اینکه sandboxing فعال باشد. اگر به isolation نیاز دارید، از
    [`agents.defaults.sandbox`](/fa/gateway/sandboxing) یا تنظیمات sandbox برای هر عامل استفاده کنید. اگر
    می‌خواهید یک repo دایرکتوری کاری پیش‌فرض باشد، `workspace` همان عامل را به ریشه repo اشاره دهید.
    repoی OpenClaw فقط source code است؛ workspace را جدا نگه دارید مگر اینکه عمدا بخواهید عامل داخل آن کار کند.

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

  <Accordion title="حالت راه‌دور: session store کجاست؟">
    وضعیت session در مالکیت **میزبان gateway** است. اگر در حالت راه‌دور هستید، session store موردنیاز شما روی ماشین راه‌دور است، نه لپ‌تاپ محلی شما. [مدیریت session](/fa/concepts/session) را ببینید.
  </Accordion>
</AccordionGroup>

## مبانی config

<AccordionGroup>
  <Accordion title="فرمت config چیست؟ کجاست؟">
    OpenClaw یک config اختیاری **JSON5** را از `$OPENCLAW_CONFIG_PATH` می‌خواند (پیش‌فرض: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    اگر فایل وجود نداشته باشد، از پیش‌فرض‌های نسبتا امن استفاده می‌کند (از جمله workspace پیش‌فرض `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='من gateway.bind: "lan" (یا "tailnet") را تنظیم کردم و حالا چیزی listen نمی‌کند / UI می‌گوید unauthorized'>
    bindهای غیر loopback **به یک مسیر معتبر احراز هویت gateway نیاز دارند**. در عمل یعنی:

    - احراز هویت با shared-secret: token یا password
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
    - برای احراز هویت با password، به‌جای آن `gateway.auth.mode: "password"` به‌همراه `gateway.auth.password` (یا `OPENCLAW_GATEWAY_PASSWORD`) را تنظیم کنید.
    - اگر `gateway.auth.token` / `gateway.auth.password` صراحتا از طریق SecretRef پیکربندی شده و resolve نشده باشد، resolution به‌شکل بسته fail می‌شود (بدون masking با fallback راه‌دور).
    - setupهای Control UI با shared-secret از طریق `connect.params.auth.token` یا `connect.params.auth.password` احراز هویت می‌کنند (در تنظیمات app/UI ذخیره می‌شود). حالت‌های دارای هویت مانند Tailscale Serve یا `trusted-proxy` به‌جای آن از request headerها استفاده می‌کنند. از قرار دادن shared secretها در URLها خودداری کنید.
    - با `gateway.auth.mode: "trusted-proxy"`، reverse proxyهای loopback روی همان host به `gateway.auth.trustedProxy.allowLoopback = true` صریح و یک ورودی loopback در `gateway.trustedProxies` نیاز دارند.

  </Accordion>

  <Accordion title="چرا حالا روی localhost به token نیاز دارم؟">
    OpenClaw به‌صورت پیش‌فرض احراز هویت gateway را enforce می‌کند، شامل loopback. در مسیر پیش‌فرض معمولی، این یعنی احراز هویت token: اگر هیچ مسیر احراز هویت صریحی پیکربندی نشده باشد، startup gateway به حالت token resolve می‌شود و یکی را به‌صورت خودکار generate می‌کند و در `gateway.auth.token` ذخیره می‌کند، بنابراین **کلاینت‌های WS محلی باید احراز هویت شوند**. این کار مانع فراخوانی Gateway توسط فرایندهای محلی دیگر می‌شود.

    اگر مسیر احراز هویت متفاوتی را ترجیح می‌دهید، می‌توانید صراحتا حالت password را انتخاب کنید (یا برای reverse proxyهای آگاه از هویت، `trusted-proxy`). اگر **واقعا** loopback باز می‌خواهید، `gateway.auth.mode: "none"` را صراحتا در config خود تنظیم کنید. Doctor هر زمان می‌تواند برای شما token تولید کند: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="آیا بعد از تغییر config باید restart کنم؟">
    Gateway config را watch می‌کند و از hot-reload پشتیبانی می‌کند:

    - `gateway.reload.mode: "hybrid"` (پیش‌فرض): تغییرات امن را hot-apply می‌کند، برای موارد critical restart می‌کند
    - `hot`، `restart`، `off` نیز پشتیبانی می‌شوند

  </Accordion>

  <Accordion title="چگونه taglineهای بامزه CLI را غیرفعال کنم؟">
    `cli.banner.taglineMode` را در config تنظیم کنید:

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
    - اگر اصلا banner نمی‌خواهید، env `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

  </Accordion>

  <Accordion title="چگونه web search (و web fetch) را فعال کنم؟">
    `web_fetch` بدون کلید API کار می‌کند. `web_search` به provider انتخاب‌شده شما وابسته است:

    - providerهای API-backed مانند Brave، Exa، Firecrawl، Gemini، Grok، Kimi، MiniMax Search، Perplexity و Tavily به setup معمول کلید API خود نیاز دارند.
    - Ollama Web Search بدون کلید است، اما از میزبان Ollama پیکربندی‌شده شما استفاده می‌کند و به `ollama signin` نیاز دارد.
    - DuckDuckGo بدون کلید است، اما یک integration غیررسمی مبتنی بر HTML است.
    - SearXNG بدون کلید/خودمیزبان است؛ `SEARXNG_BASE_URL` یا `plugins.entries.searxng.config.webSearch.baseUrl` را پیکربندی کنید.

    **پیشنهادی:** `openclaw configure --section web` را اجرا کنید و یک provider انتخاب کنید.
    جایگزین‌های environment:

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

    پیکربندی جست‌وجوی وب ویژهٔ ارائه‌دهنده اکنون زیر `plugins.entries.<plugin>.config.webSearch.*` قرار دارد.
    مسیرهای قدیمی ارائه‌دهنده در `tools.web.search.*` هنوز موقتاً برای سازگاری بارگذاری می‌شوند، اما نباید برای پیکربندی‌های جدید استفاده شوند.
    پیکربندی جایگزین واکشی وب Firecrawl زیر `plugins.entries.firecrawl.config.webFetch.*` قرار دارد.

    نکات:

    - اگر از فهرست‌های مجاز استفاده می‌کنید، `web_search`/`web_fetch`/`x_search` یا `group:web` را اضافه کنید.
    - `web_fetch` به‌صورت پیش‌فرض فعال است (مگر اینکه صراحتاً غیرفعال شده باشد).
    - اگر `tools.web.fetch.provider` حذف شود، OpenClaw نخستین ارائه‌دهندهٔ جایگزین آماده برای واکشی را از میان اعتبارنامه‌های موجود به‌صورت خودکار تشخیص می‌دهد. امروز ارائه‌دهندهٔ همراه Firecrawl است.
    - دیمون‌ها متغیرهای محیطی را از `~/.openclaw/.env` (یا محیط سرویس) می‌خوانند.

    مستندات: [ابزارهای وب](/fa/tools/web).

  </Accordion>

  <Accordion title="config.apply پیکربندی من را پاک کرد. چگونه بازیابی کنم و از تکرار آن جلوگیری کنم؟">
    `config.apply` **کل پیکربندی** را جایگزین می‌کند. اگر یک شیء جزئی بفرستید، همهٔ موارد
    دیگر حذف می‌شوند.

    OpenClaw فعلی از بسیاری از بازنویسی‌های تصادفی جلوگیری می‌کند:

    - نوشتن‌های پیکربندی متعلق به OpenClaw، کل پیکربندی پس از تغییر را پیش از نوشتن اعتبارسنجی می‌کنند.
    - نوشتن‌های نامعتبر یا مخرب متعلق به OpenClaw رد می‌شوند و با نام `openclaw.json.rejected.*` ذخیره می‌شوند.
    - اگر یک ویرایش مستقیم راه‌اندازی یا بارگذاری مجدد داغ را خراب کند، Gateway آخرین پیکربندی سالم شناخته‌شده را بازمی‌گرداند و فایل ردشده را با نام `openclaw.json.clobbered.*` ذخیره می‌کند.
    - عامل اصلی پس از بازیابی یک هشدار بوت دریافت می‌کند تا پیکربندی بد را دوباره کورکورانه ننویسد.

    بازیابی:

    - `openclaw logs --follow` را برای `Config auto-restored from last-known-good`، `Config write rejected:` یا `config reload restored last-known-good config` بررسی کنید.
    - جدیدترین `openclaw.json.clobbered.*` یا `openclaw.json.rejected.*` را کنار پیکربندی فعال بررسی کنید.
    - اگر پیکربندی فعالِ بازیابی‌شده کار می‌کند، آن را نگه دارید، سپس فقط کلیدهای موردنظر را با `openclaw config set` یا `config.patch` برگردانید.
    - `openclaw config validate` و `openclaw doctor` را اجرا کنید.
    - اگر آخرین پیکربندی سالم شناخته‌شده یا payload ردشده ندارید، از نسخهٔ پشتیبان بازیابی کنید، یا دوباره `openclaw doctor` را اجرا کنید و کانال‌ها/مدل‌ها را دوباره پیکربندی کنید.
    - اگر این رخداد غیرمنتظره بود، یک باگ ثبت کنید و آخرین پیکربندی شناخته‌شده یا هر نسخهٔ پشتیبان خود را ضمیمه کنید.
    - یک عامل کدنویسی محلی اغلب می‌تواند از روی لاگ‌ها یا تاریخچه، یک پیکربندی کارا را بازسازی کند.

    جلوگیری:

    - برای تغییرات کوچک از `openclaw config set` استفاده کنید.
    - برای ویرایش‌های تعاملی از `openclaw configure` استفاده کنید.
    - وقتی از مسیر دقیق یا شکل فیلد مطمئن نیستید، ابتدا از `config.schema.lookup` استفاده کنید؛ این دستور یک گره schema سطحی به‌همراه خلاصه‌های فرزند بلافصل برای کاوش مرحله‌ای برمی‌گرداند.
    - برای ویرایش‌های RPC جزئی از `config.patch` استفاده کنید؛ `config.apply` را فقط برای جایگزینی کامل پیکربندی نگه دارید.
    - اگر از ابزار مالک‌محور `gateway` در اجرای یک عامل استفاده می‌کنید، همچنان نوشتن در `tools.exec.ask` / `tools.exec.security` را رد می‌کند (از جمله نام‌های مستعار قدیمی `tools.bash.*` که به همان مسیرهای محافظت‌شدهٔ exec نرمال‌سازی می‌شوند).

    مستندات: [پیکربندی](/fa/cli/config)، [پیکربندی تعاملی](/fa/cli/configure)، [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-restored-last-known-good-config)، [Doctor](/fa/gateway/doctor).

  </Accordion>

  <Accordion title="چگونه یک Gateway مرکزی را با workerهای تخصصی در چند دستگاه اجرا کنم؟">
    الگوی رایج **یک Gateway** (مثلاً Raspberry Pi) به‌همراه **nodeها** و **عامل‌ها** است:

    - **Gateway (مرکزی):** مالک کانال‌ها (Signal/WhatsApp)، مسیریابی و sessionها است.
    - **Nodeها (دستگاه‌ها):** Macها/iOS/Android به‌عنوان ابزار جانبی متصل می‌شوند و ابزارهای محلی (`system.run`، `canvas`، `camera`) را ارائه می‌کنند.
    - **عامل‌ها (workerها):** مغزها/فضاهای کاری جداگانه برای نقش‌های ویژه (مثلاً «عملیات Hetzner»، «داده‌های شخصی»).
    - **زیرعامل‌ها:** وقتی موازی‌سازی می‌خواهید، کار پس‌زمینه را از یک عامل اصلی ایجاد کنید.
    - **TUI:** به Gateway متصل شوید و بین عامل‌ها/sessionها جابه‌جا شوید.

    مستندات: [Nodeها](/fa/nodes)، [دسترسی راه‌دور](/fa/gateway/remote)، [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [زیرعامل‌ها](/fa/tools/subagents)، [TUI](/fa/web/tui).

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

    مقدار پیش‌فرض `false` (headful) است. حالت headless در برخی سایت‌ها بیشتر احتمال دارد بررسی‌های ضدبات را فعال کند. [مرورگر](/fa/tools/browser) را ببینید.

    حالت headless از **همان موتور Chromium** استفاده می‌کند و برای بیشتر اتوماسیون‌ها (فرم‌ها، کلیک‌ها، scraping، ورودها) کار می‌کند. تفاوت‌های اصلی:

    - هیچ پنجرهٔ مرورگر قابل‌مشاهده‌ای وجود ندارد (اگر به تصویر نیاز دارید از اسکرین‌شات استفاده کنید).
    - برخی سایت‌ها در حالت headless نسبت به اتوماسیون سخت‌گیرتر هستند (CAPTCHAها، ضدبات).
      برای مثال، X/Twitter اغلب sessionهای headless را مسدود می‌کند.

  </Accordion>

  <Accordion title="چگونه از Brave برای کنترل مرورگر استفاده کنم؟">
    `browser.executablePath` را روی باینری Brave خود (یا هر مرورگر مبتنی بر Chromium) تنظیم کنید و Gateway را بازراه‌اندازی کنید.
    نمونه‌های کامل پیکربندی را در [مرورگر](/fa/tools/browser#use-brave-or-another-chromium-based-browser) ببینید.
  </Accordion>
</AccordionGroup>

## Gatewayها و nodeهای راه‌دور

<AccordionGroup>
  <Accordion title="فرمان‌ها چگونه بین Telegram، gateway و nodeها منتشر می‌شوند؟">
    پیام‌های Telegram توسط **gateway** مدیریت می‌شوند. gateway عامل را اجرا می‌کند و
    فقط زمانی که به ابزار node نیاز باشد، nodeها را از طریق **Gateway WebSocket** فراخوانی می‌کند:

    Telegram → Gateway → عامل → `node.*` → Node → Gateway → Telegram

    Nodeها ترافیک ورودی ارائه‌دهنده را نمی‌بینند؛ آن‌ها فقط فراخوانی‌های RPC مربوط به node را دریافت می‌کنند.

  </Accordion>

  <Accordion title="اگر Gateway از راه دور میزبانی شود، عامل من چگونه می‌تواند به رایانه‌ام دسترسی پیدا کند؟">
    پاسخ کوتاه: **رایانهٔ خود را به‌عنوان node جفت کنید**. Gateway در جای دیگری اجرا می‌شود، اما می‌تواند
    ابزارهای `node.*` (صفحه‌نمایش، دوربین، سیستم) را روی ماشین محلی شما از طریق Gateway WebSocket فراخوانی کند.

    راه‌اندازی معمول:

    1. Gateway را روی میزبان همیشه‌روشن اجرا کنید (VPS/سرور خانگی).
    2. میزبان Gateway و رایانهٔ خود را روی یک tailnet قرار دهید.
    3. مطمئن شوید Gateway WS در دسترس است (bind روی tailnet یا تونل SSH).
    4. برنامهٔ macOS را به‌صورت محلی باز کنید و در حالت **Remote over SSH** (یا tailnet مستقیم)
       وصل شوید تا بتواند به‌عنوان node ثبت شود.
    5. node را روی Gateway تأیید کنید:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    هیچ پل TCP جداگانه‌ای لازم نیست؛ nodeها از طریق Gateway WebSocket متصل می‌شوند.

    یادآوری امنیتی: جفت‌کردن یک node در macOS امکان `system.run` را روی آن ماشین فراهم می‌کند. فقط
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
    - اگر از طریق تونل SSH وصل می‌شوید، تأیید کنید تونل محلی فعال است و به پورت درست اشاره می‌کند.
    - تأیید کنید فهرست‌های مجاز شما (DM یا گروه) شامل حساب شما هستند.

    مستندات: [Tailscale](/fa/gateway/tailscale)، [دسترسی راه‌دور](/fa/gateway/remote)، [کانال‌ها](/fa/channels).

  </Accordion>

  <Accordion title="آیا دو نمونهٔ OpenClaw می‌توانند با هم صحبت کنند (محلی + VPS)؟">
    بله. پل داخلی «bot-to-bot» وجود ندارد، اما می‌توانید آن را به چند روش
    قابل‌اعتماد راه‌اندازی کنید:

    **ساده‌ترین:** از یک کانال گفت‌وگوی معمولی استفاده کنید که هر دو بات به آن دسترسی دارند (Telegram/Slack/WhatsApp).
    کاری کنید Bot A پیامی به Bot B بفرستد، سپس اجازه دهید Bot B طبق معمول پاسخ دهد.

    **پل CLI (عمومی):** اسکریپتی اجرا کنید که Gateway دیگر را با
    `openclaw agent --message ... --deliver` فراخوانی کند و یک گفت‌وگو را هدف بگیرد که بات دیگر
    در آن گوش می‌دهد. اگر یک بات روی VPS راه‌دور است، CLI خود را از طریق SSH/Tailscale
    به آن Gateway راه‌دور اشاره دهید ([دسترسی راه‌دور](/fa/gateway/remote) را ببینید).

    الگوی نمونه (از ماشینی اجرا کنید که بتواند به Gateway هدف دسترسی پیدا کند):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نکته: یک محافظ اضافه کنید تا دو بات بی‌پایان در حلقه نیفتند (فقط با mention، فهرست‌های مجاز کانال،
    یا قانون «به پیام‌های بات پاسخ نده»).

    مستندات: [دسترسی راه‌دور](/fa/gateway/remote)، [CLI عامل](/fa/cli/agent)، [ارسال عامل](/fa/tools/agent-send).

  </Accordion>

  <Accordion title="آیا برای چند عامل به VPSهای جداگانه نیاز دارم؟">
    خیر. یک Gateway می‌تواند چند عامل را میزبانی کند، هرکدام با فضای کاری، پیش‌فرض‌های مدل،
    و مسیریابی خودش. این راه‌اندازی عادی است و بسیار ارزان‌تر و ساده‌تر از اجرای
    یک VPS برای هر عامل است.

    فقط زمانی از VPSهای جداگانه استفاده کنید که به جداسازی سخت (مرزهای امنیتی) یا پیکربندی‌های بسیار
    متفاوتی نیاز دارید که نمی‌خواهید به اشتراک بگذارید. در غیر این صورت، یک Gateway نگه دارید و
    از چند عامل یا زیرعامل استفاده کنید.

  </Accordion>

  <Accordion title="آیا استفاده از node روی لپ‌تاپ شخصی‌ام به‌جای SSH از VPS مزیتی دارد؟">
    بله - nodeها روش درجه‌یک برای دسترسی به لپ‌تاپ شما از یک Gateway راه‌دور هستند، و
    بیش از دسترسی shell را فعال می‌کنند. Gateway روی macOS/Linux (Windows از طریق WSL2) اجرا می‌شود و
    سبک است (یک VPS کوچک یا جعبه‌ای در حد Raspberry Pi کافی است؛ ۴ گیگابایت RAM کاملاً کافی است)، بنابراین یک
    راه‌اندازی رایج شامل یک میزبان همیشه‌روشن به‌همراه لپ‌تاپ شما به‌عنوان node است.

    - **به SSH ورودی نیاز ندارد.** Nodeها به Gateway WebSocket متصل می‌شوند و از جفت‌سازی دستگاه استفاده می‌کنند.
    - **کنترل‌های اجرای امن‌تر.** `system.run` با فهرست‌های مجاز/تأییدهای node روی همان لپ‌تاپ محافظت می‌شود.
    - **ابزارهای دستگاه بیشتر.** Nodeها علاوه بر `system.run`، `canvas`، `camera` و `screen` را ارائه می‌کنند.
    - **اتوماسیون مرورگر محلی.** Gateway را روی VPS نگه دارید، اما Chrome را به‌صورت محلی از طریق میزبان node روی لپ‌تاپ اجرا کنید، یا از طریق Chrome MCP به Chrome محلی روی میزبان متصل شوید.

    SSH برای دسترسی shell موردی مناسب است، اما nodeها برای workflowهای مداوم عامل و
    اتوماسیون دستگاه ساده‌تر هستند.

    مستندات: [Nodeها](/fa/nodes)، [CLI نودها](/fa/cli/nodes)، [مرورگر](/fa/tools/browser).

  </Accordion>

  <Accordion title="آیا nodeها سرویس gateway اجرا می‌کنند؟">
    خیر. فقط **یک gateway** باید روی هر میزبان اجرا شود، مگر اینکه عمداً profileهای جداافتاده اجرا کنید ([چند Gateway](/fa/gateway/multiple-gateways) را ببینید). Nodeها ابزارهای جانبی هستند که
    به gateway متصل می‌شوند (nodeهای iOS/Android، یا «حالت node» در macOS در برنامهٔ menubar). برای میزبان‌های node
    بدون رابط گرافیکی و کنترل CLI، [CLI میزبان Node](/fa/cli/node) را ببینید.

    برای تغییرات `gateway`، `discovery` و `canvasHost` بازراه‌اندازی کامل لازم است.

  </Accordion>

  <Accordion title="آیا روشی API / RPC برای اعمال پیکربندی وجود دارد؟">
    بله.

    - `config.schema.lookup`: پیش از نوشتن، یک زیر‌درخت پیکربندی را همراه با گره schema سطحی، راهنمای UI منطبق، و خلاصه‌های فرزند بلافصل بررسی کنید
    - `config.get`: snapshot فعلی + hash را واکشی کنید
    - `config.patch`: به‌روزرسانی جزئی امن (برای بیشتر ویرایش‌های RPC ترجیح داده می‌شود)؛ در صورت امکان hot-reload می‌کند و در صورت نیاز بازراه‌اندازی می‌کند
    - `config.apply`: اعتبارسنجی + جایگزینی کل پیکربندی؛ در صورت امکان hot-reload می‌کند و در صورت نیاز بازراه‌اندازی می‌کند
    - ابزار runtime مالک‌محور `gateway` همچنان از بازنویسی `tools.exec.ask` / `tools.exec.security` خودداری می‌کند؛ نام‌های مستعار قدیمی `tools.bash.*` به همان مسیرهای محافظت‌شدهٔ exec نرمال‌سازی می‌شوند

  </Accordion>

  <Accordion title="پیکربندی حداقلی و معقول برای اولین نصب">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    این کار محیط کاری شما را تنظیم می‌کند و محدود می‌کند چه کسی می‌تواند بات را فعال کند.

  </Accordion>

  <Accordion title="چگونه Tailscale را روی یک VPS راه‌اندازی کنم و از Mac خود وصل شوم؟">
    مراحل حداقلی:

    1. **نصب + ورود روی VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **نصب + ورود روی Mac**
       - از برنامه Tailscale استفاده کنید و به همان tailnet وارد شوید.
    3. **فعال‌سازی MagicDNS (توصیه‌شده)**
       - در کنسول مدیریت Tailscale، MagicDNS را فعال کنید تا VPS یک نام پایدار داشته باشد.
    4. **استفاده از نام میزبان tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    اگر Control UI را بدون SSH می‌خواهید، از Tailscale Serve روی VPS استفاده کنید:

    ```bash
    openclaw gateway --tailscale serve
    ```

    این کار Gateway را محدود به loopback نگه می‌دارد و HTTPS را از طریق Tailscale در دسترس قرار می‌دهد. [Tailscale](/fa/gateway/tailscale) را ببینید.

  </Accordion>

  <Accordion title="چگونه یک Node در Mac را به یک Gateway راه دور (Tailscale Serve) وصل کنم؟">
    Serve، **Gateway Control UI + WS** را در دسترس قرار می‌دهد. Nodeها از طریق همان endpoint مربوط به Gateway WS وصل می‌شوند.

    راه‌اندازی پیشنهادی:

    1. **مطمئن شوید VPS + Mac در همان tailnet هستند**.
    2. **از برنامه macOS در حالت Remote استفاده کنید** (هدف SSH می‌تواند نام میزبان tailnet باشد).
       برنامه پورت Gateway را تونل می‌کند و به‌عنوان یک Node وصل می‌شود.
    3. **Node را** روی Gateway تأیید کنید:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    مستندات: [پروتکل Gateway](/fa/gateway/protocol)، [کشف](/fa/gateway/discovery)، [حالت راه دور macOS](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="آیا باید روی لپ‌تاپ دوم نصب کنم یا فقط یک Node اضافه کنم؟">
    اگر فقط به **ابزارهای محلی** (screen/camera/exec) روی لپ‌تاپ دوم نیاز دارید، آن را به‌عنوان یک
    **Node** اضافه کنید. این کار یک Gateway واحد را حفظ می‌کند و از پیکربندی تکراری جلوگیری می‌کند. ابزارهای محلی Node
    فعلاً فقط برای macOS هستند، اما قصد داریم آن‌ها را به سیستم‌عامل‌های دیگر هم گسترش دهیم.

    فقط زمانی یک Gateway دوم نصب کنید که به **جداسازی سخت‌گیرانه** یا دو بات کاملاً جدا نیاز دارید.

    مستندات: [Nodeها](/fa/nodes)، [CLI Nodeها](/fa/cli/nodes)، [چند Gateway](/fa/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغیرهای محیطی و بارگذاری .env

<AccordionGroup>
  <Accordion title="OpenClaw چگونه متغیرهای محیطی را بارگذاری می‌کند؟">
    OpenClaw متغیرهای محیطی را از فرایند والد (shell، launchd/systemd، CI و غیره) می‌خواند و علاوه بر آن این موارد را بارگذاری می‌کند:

    - `.env` از دایرکتوری کاری فعلی
    - یک `.env` سراسری جایگزین از `~/.openclaw/.env` (یا همان `$OPENCLAW_STATE_DIR/.env`)

    هیچ‌کدام از فایل‌های `.env` متغیرهای محیطی موجود را بازنویسی نمی‌کنند.

    همچنین می‌توانید متغیرهای محیطی inline را در پیکربندی تعریف کنید (فقط اگر در محیط فرایند وجود نداشته باشند اعمال می‌شوند):

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

  <Accordion title="Gateway را از طریق سرویس شروع کردم و متغیرهای محیطی من ناپدید شدند. حالا چه کنم؟">
    دو راه‌حل رایج:

    1. کلیدهای گم‌شده را در `~/.openclaw/.env` بگذارید تا حتی وقتی سرویس محیط shell شما را به ارث نمی‌برد، خوانده شوند.
    2. وارد کردن shell را فعال کنید (امکان اختیاری برای سهولت):

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

    این کار shell ورود شما را اجرا می‌کند و فقط کلیدهای مورد انتظارِ گم‌شده را وارد می‌کند (هرگز بازنویسی نمی‌کند). معادل‌های متغیر محیطی:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='من COPILOT_GITHUB_TOKEN را تنظیم کرده‌ام، اما وضعیت مدل‌ها "Shell env: off." را نشان می‌دهد. چرا؟'>
    `openclaw models status` گزارش می‌دهد که آیا **وارد کردن محیط shell** فعال است یا نه. "Shell env: off"
    به این معنی **نیست** که متغیرهای محیطی شما گم شده‌اند - فقط یعنی OpenClaw به‌طور خودکار
    shell ورود شما را بارگذاری نمی‌کند.

    اگر Gateway به‌عنوان سرویس اجرا می‌شود (launchd/systemd)، محیط shell شما را
    به ارث نمی‌برد. با یکی از این روش‌ها آن را اصلاح کنید:

    1. توکن را در `~/.openclaw/.env` بگذارید:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. یا وارد کردن shell را فعال کنید (`env.shellEnv.enabled: true`).
    3. یا آن را به بلوک `env` در پیکربندی خود اضافه کنید (فقط اگر وجود نداشته باشد اعمال می‌شود).

    سپس Gateway را راه‌اندازی مجدد کنید و دوباره بررسی کنید:

    ```bash
    openclaw models status
    ```

    توکن‌های Copilot از `COPILOT_GITHUB_TOKEN` خوانده می‌شوند (همچنین `GH_TOKEN` / `GITHUB_TOKEN`).
    [/concepts/model-providers](/fa/concepts/model-providers) و [/environment](/fa/help/environment) را ببینید.

  </Accordion>
</AccordionGroup>

## نشست‌ها و چندین گفتگو

<AccordionGroup>
  <Accordion title="چگونه یک گفتگوی تازه شروع کنم؟">
    `/new` یا `/reset` را به‌عنوان یک پیام مستقل بفرستید. [مدیریت نشست](/fa/concepts/session) را ببینید.
  </Accordion>

  <Accordion title="اگر هرگز /new نفرستم، نشست‌ها به‌طور خودکار بازنشانی می‌شوند؟">
    نشست‌ها می‌توانند پس از `session.idleMinutes` منقضی شوند، اما این قابلیت **به‌صورت پیش‌فرض غیرفعال است** (پیش‌فرض **0**).
    برای فعال‌سازی انقضای بیکاری، آن را روی یک مقدار مثبت تنظیم کنید. وقتی فعال باشد، **پیام بعدی**
    پس از دوره بیکاری، یک شناسه نشست تازه برای آن کلید گفتگو شروع می‌کند.
    این کار رونوشت‌ها را حذف نمی‌کند - فقط یک نشست جدید شروع می‌کند.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="آیا راهی هست یک تیم از نمونه‌های OpenClaw بسازم (یک مدیرعامل و تعداد زیادی agent)؟">
    بله، از طریق **مسیریابی چندعاملی** و **sub-agentها**. می‌توانید یک agent هماهنگ‌کننده
    و چند agent کاری با محیط‌های کاری و مدل‌های جداگانه بسازید.

    با این حال، بهتر است این را یک **آزمایش سرگرم‌کننده** بدانید. مصرف توکن آن زیاد است و اغلب
    از استفاده از یک بات با نشست‌های جداگانه کم‌بازده‌تر است. مدل معمولی که
    تصور می‌کنیم، یک بات است که با آن صحبت می‌کنید و برای کارهای موازی نشست‌های متفاوت دارد. همان
    بات می‌تواند در صورت نیاز sub-agent هم ایجاد کند.

    مستندات: [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [Sub-agentها](/fa/tools/subagents)، [CLI Agentها](/fa/cli/agents).

  </Accordion>

  <Accordion title="چرا context در میانه کار کوتاه شد؟ چگونه از آن جلوگیری کنم؟">
    context نشست به پنجره مدل محدود است. گفتگوهای طولانی، خروجی‌های بزرگ ابزارها، یا فایل‌های زیاد
    می‌توانند باعث Compaction یا کوتاه‌سازی شوند.

    موارد کمک‌کننده:

    - از بات بخواهید وضعیت فعلی را خلاصه کند و در یک فایل بنویسد.
    - پیش از کارهای طولانی از `/compact` استفاده کنید، و هنگام تغییر موضوع از `/new`.
    - context مهم را در محیط کاری نگه دارید و از بات بخواهید آن را دوباره بخواند.
    - برای کارهای طولانی یا موازی از sub-agentها استفاده کنید تا گفتگوی اصلی کوچک‌تر بماند.
    - اگر این اتفاق زیاد رخ می‌دهد، مدلی با پنجره context بزرگ‌تر انتخاب کنید.

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

    - اگر onboarding یک پیکربندی موجود ببیند، گزینه **Reset** را هم ارائه می‌دهد. [Onboarding (CLI)](/fa/start/wizard) را ببینید.
    - اگر از profileها استفاده کرده‌اید (`--profile` / `OPENCLAW_PROFILE`)، هر دایرکتوری وضعیت را جداگانه بازنشانی کنید (پیش‌فرض‌ها `~/.openclaw-<profile>` هستند).
    - بازنشانی توسعه: `openclaw gateway --dev --reset` (فقط dev؛ پیکربندی dev + credentials + نشست‌ها + محیط کاری را پاک می‌کند).

  </Accordion>

  <Accordion title='خطاهای "context too large" می‌گیرم - چگونه بازنشانی یا compact کنم؟'>
    یکی از این‌ها را استفاده کنید:

    - **Compact** (گفتگو را نگه می‌دارد اما نوبت‌های قدیمی‌تر را خلاصه می‌کند):

      ```
      /compact
      ```

      یا برای هدایت خلاصه، `/compact <instructions>`.

    - **Reset** (شناسه نشست تازه برای همان کلید گفتگو):

      ```
      /new
      /reset
      ```

    اگر همچنان رخ می‌دهد:

    - **هرس نشست** (`agents.defaults.contextPruning`) را فعال یا تنظیم کنید تا خروجی قدیمی ابزارها کوتاه شود.
    - از مدلی با پنجره context بزرگ‌تر استفاده کنید.

    مستندات: [Compaction](/fa/concepts/compaction)، [هرس نشست](/fa/concepts/session-pruning)، [مدیریت نشست](/fa/concepts/session).

  </Accordion>

  <Accordion title='چرا "LLM request rejected: messages.content.tool_use.input field required" را می‌بینم؟'>
    این یک خطای اعتبارسنجی provider است: مدل یک بلوک `tool_use` بدون `input` موردنیاز
    تولید کرده است. معمولاً یعنی تاریخچه نشست کهنه یا خراب شده است (اغلب پس از رشته‌گفتگوهای طولانی
    یا تغییر ابزار/طرحواره).

    راه‌حل: با `/new` یک نشست تازه شروع کنید (پیام مستقل).

  </Accordion>

  <Accordion title="چرا هر ۳۰ دقیقه پیام‌های heartbeat دریافت می‌کنم؟">
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

    اگر `HEARTBEAT.md` وجود داشته باشد اما عملاً خالی باشد (فقط خطوط خالی و سرخط‌های markdown
    مانند `# Heading`)، OpenClaw اجرای heartbeat را برای صرفه‌جویی در فراخوانی‌های API رد می‌کند.
    اگر فایل وجود نداشته باشد، heartbeat همچنان اجرا می‌شود و مدل تصمیم می‌گیرد چه کند.

    overrideهای مخصوص هر agent از `agents.list[].heartbeat` استفاده می‌کنند. مستندات: [Heartbeat](/fa/gateway/heartbeat).

  </Accordion>

  <Accordion title='آیا لازم است یک "حساب بات" به یک گروه WhatsApp اضافه کنم؟'>
    نه. OpenClaw روی **حساب خود شما** اجرا می‌شود، بنابراین اگر شما در گروه باشید، OpenClaw می‌تواند آن را ببیند.
    به‌صورت پیش‌فرض، پاسخ‌های گروهی تا زمانی که فرستنده‌ها را مجاز نکنید مسدود هستند (`groupPolicy: "allowlist"`).

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
    گزینه ۱ (سریع‌ترین): لاگ‌ها را دنبال کنید و یک پیام آزمایشی در گروه بفرستید:

    ```bash
    openclaw logs --follow --json
    ```

    به دنبال `chatId` (یا `from`) بگردید که به `@g.us` ختم می‌شود، مانند:
    `1234567890-1234567890@g.us`.

    گزینه ۲ (اگر از قبل پیکربندی/allowlist شده است): گروه‌ها را از پیکربندی فهرست کنید:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    مستندات: [WhatsApp](/fa/channels/whatsapp)، [Directory](/fa/cli/directory)، [Logs](/fa/cli/logs).

  </Accordion>

  <Accordion title="چرا OpenClaw در گروه پاسخ نمی‌دهد؟">
    دو علت رایج:

    - gating اشاره روشن است (پیش‌فرض). باید بات را @mention کنید (یا با `mentionPatterns` تطبیق دهید).
    - `channels.whatsapp.groups` را بدون `"*"` پیکربندی کرده‌اید و گروه در allowlist نیست.

    [گروه‌ها](/fa/channels/groups) و [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.

  </Accordion>

  <Accordion title="آیا گروه‌ها/رشته‌گفتگوها context را با پیام‌های خصوصی مشترک دارند؟">
    گفتگوهای مستقیم به‌صورت پیش‌فرض در نشست اصلی ادغام می‌شوند. گروه‌ها/کانال‌ها کلیدهای نشست خودشان را دارند، و topicهای Telegram / threadهای Discord نشست‌های جداگانه هستند. [گروه‌ها](/fa/channels/groups) و [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.
  </Accordion>

  <Accordion title="چند محیط کاری و agent می‌توانم بسازم؟">
    هیچ محدودیت سختی وجود ندارد. ده‌ها (حتی صدها) مورد هم مشکلی ندارد، اما مراقب این موارد باشید:

    - **رشد دیسک:** نشست‌ها + رونوشت‌ها زیر `~/.openclaw/agents/<agentId>/sessions/` قرار دارند.
    - **هزینه توکن:** agentهای بیشتر یعنی استفاده هم‌زمان بیشتر از مدل.
    - **سربار عملیاتی:** profileهای احراز هویت، محیط‌های کاری، و مسیریابی کانال برای هر agent.

    نکته‌ها:

    - برای هر agent یک محیط کاری **فعال** نگه دارید (`agents.defaults.workspace`).
    - اگر دیسک رشد کرد، نشست‌های قدیمی را هرس کنید (JSONL یا ورودی‌های store را حذف کنید).
    - از `openclaw doctor` برای یافتن محیط‌های کاری سرگردان و ناسازگاری‌های profile استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم چند ربات یا چت را هم‌زمان اجرا کنم (Slack)، و چگونه باید آن را راه‌اندازی کنم؟">
    بله. از **مسیریابی چندعاملی** برای اجرای چند عامل ایزوله و مسیریابی پیام‌های ورودی بر اساس
    کانال/حساب/همتا استفاده کنید. Slack به‌عنوان یک کانال پشتیبانی می‌شود و می‌تواند به عامل‌های مشخصی متصل شود.

    دسترسی مرورگر قدرتمند است، اما به معنای «انجام هر کاری که انسان می‌تواند انجام دهد» نیست - ضدربات‌ها، CAPTCHAها، و MFA همچنان می‌توانند
    خودکارسازی را مسدود کنند. برای قابل‌اعتمادترین کنترل مرورگر، از Chrome MCP محلی روی میزبان استفاده کنید،
    یا از CDP روی ماشینی استفاده کنید که واقعا مرورگر را اجرا می‌کند.

    راه‌اندازی پیشنهادی:

    - میزبان Gateway همیشه‌روشن (VPS/Mac mini).
    - یک عامل برای هر نقش (اتصال‌ها).
    - کانال(های) Slack متصل به آن عامل‌ها.
    - مرورگر محلی از طریق Chrome MCP یا یک Node در صورت نیاز.

    مستندات: [مسیریابی چندعاملی](/fa/concepts/multi-agent), [Slack](/fa/channels/slack),
    [مرورگر](/fa/tools/browser), [Nodes](/fa/nodes).

  </Accordion>
</AccordionGroup>

## مدل‌ها، جایگزینی هنگام خرابی، و پروفایل‌های احراز هویت

پرسش‌وپاسخ مدل‌ها — پیش‌فرض‌ها، انتخاب، نام‌های مستعار، جابه‌جایی، جایگزینی هنگام خرابی، پروفایل‌های احراز هویت —
در [پرسش‌های متداول مدل‌ها](/fa/help/faq-models) قرار دارد.

## Gateway: پورت‌ها، «از قبل در حال اجرا»، و حالت راه‌دور

<AccordionGroup>
  <Accordion title="Gateway از چه پورتی استفاده می‌کند؟">
    `gateway.port` پورت چندمنظوره واحد را برای WebSocket + HTTP (Control UI، hookها، و غیره) کنترل می‌کند.

    اولویت:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='چرا openclaw gateway status می‌گوید "Runtime: running" اما "Connectivity probe: failed"؟'>
    چون "running" دید **supervisor** است (launchd/systemd/schtasks). سنجش اتصال، اتصال واقعی CLI به WebSocket گیت‌وی است.

    از `openclaw gateway status` استفاده کنید و به این خط‌ها اعتماد کنید:

    - `Probe target:` (نشانی‌ای که سنجش واقعا استفاده کرده است)
    - `Listening:` (چیزی که واقعا روی پورت bind شده است)
    - `Last gateway error:` (علت ریشه‌ای رایج وقتی فرایند زنده است اما پورت در حال گوش‌دادن نیست)

  </Accordion>

  <Accordion title='چرا openclaw gateway status مقادیر "Config (cli)" و "Config (service)" را متفاوت نشان می‌دهد؟'>
    شما در حال ویرایش یک فایل پیکربندی هستید، در حالی که سرویس با فایل دیگری اجرا می‌شود (اغلب ناهماهنگی `--profile` / `OPENCLAW_STATE_DIR`).

    رفع:

    ```bash
    openclaw gateway install --force
    ```

    این را از همان `--profile` / محیطی اجرا کنید که می‌خواهید سرویس از آن استفاده کند.

  </Accordion>

  <Accordion title='عبارت "another gateway instance is already listening" به چه معناست؟'>
    OpenClaw با bind کردن فوری شنونده WebSocket هنگام راه‌اندازی، یک قفل زمان اجرا اعمال می‌کند (پیش‌فرض `ws://127.0.0.1:18789`). اگر bind با `EADDRINUSE` شکست بخورد، `GatewayLockError` پرتاب می‌کند که نشان می‌دهد نمونه دیگری از قبل در حال گوش‌دادن است.

    رفع: نمونه دیگر را متوقف کنید، پورت را آزاد کنید، یا با `openclaw gateway --port <port>` اجرا کنید.

  </Accordion>

  <Accordion title="چگونه OpenClaw را در حالت راه‌دور اجرا کنم (کلاینت به Gateway در جای دیگری وصل شود)؟">
    `gateway.mode: "remote"` را تنظیم کنید و به یک URL راه‌دور WebSocket اشاره کنید، به‌صورت اختیاری با اعتبارنامه‌های راه‌دور shared-secret:

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

    - `openclaw gateway` فقط وقتی شروع می‌شود که `gateway.mode` برابر `local` باشد (یا پرچم override را پاس بدهید).
    - برنامه macOS فایل پیکربندی را رصد می‌کند و وقتی این مقادیر تغییر کنند، حالت‌ها را زنده عوض می‌کند.
    - `gateway.remote.token` / `.password` فقط اعتبارنامه‌های راه‌دور سمت کلاینت هستند؛ به‌تنهایی احراز هویت گیت‌وی محلی را فعال نمی‌کنند.

  </Accordion>

  <Accordion title='Control UI می‌گوید "unauthorized" (یا مدام دوباره وصل می‌شود). حالا چه کنم؟'>
    مسیر احراز هویت گیت‌وی شما و روش احراز هویت UI با هم مطابقت ندارند.

    واقعیت‌ها (از کد):

    - Control UI توکن را برای نشست تب فعلی مرورگر و URL گیت‌وی انتخاب‌شده در `sessionStorage` نگه می‌دارد، بنابراین refreshهای همان تب بدون بازگرداندن پایداری توکن long-lived در localStorage همچنان کار می‌کنند.
    - در `AUTH_TOKEN_MISMATCH`، کلاینت‌های مورد اعتماد می‌توانند وقتی گیت‌وی راهنمای retry برمی‌گرداند (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`)، یک تلاش مجدد محدود با توکن دستگاه cacheشده انجام دهند.
    - آن تلاش مجدد cached-token اکنون از scopeهای تاییدشده cacheشده‌ای که همراه توکن دستگاه ذخیره شده‌اند دوباره استفاده می‌کند. فراخوان‌های صریح `deviceToken` / `scopes` صریح همچنان به‌جای ارث‌بری scopeهای cacheشده، مجموعه scope درخواستی خود را نگه می‌دارند.
    - بیرون از آن مسیر retry، اولویت احراز هویت اتصال ابتدا shared token/password صریح، سپس `deviceToken` صریح، سپس توکن دستگاه ذخیره‌شده، و سپس bootstrap token است.
    - بررسی‌های scope توکن bootstrap دارای پیشوند نقش هستند. allowlist داخلی bootstrap operator فقط درخواست‌های operator را برآورده می‌کند؛ node یا نقش‌های غیر-operator دیگر همچنان به scopeهایی زیر پیشوند نقش خودشان نیاز دارند.

    رفع:

    - سریع‌ترین: `openclaw dashboard` (URL داشبورد را چاپ و کپی می‌کند، تلاش می‌کند باز کند؛ اگر headless باشد راهنمای SSH نشان می‌دهد).
    - اگر هنوز توکن ندارید: `openclaw doctor --generate-gateway-token`.
    - اگر راه‌دور است، ابتدا تونل بزنید: `ssh -N -L 18789:127.0.0.1:18789 user@host` سپس `http://127.0.0.1:18789/` را باز کنید.
    - حالت shared-secret: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` یا `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` را تنظیم کنید، سپس secret مطابق را در تنظیمات Control UI بچسبانید.
    - حالت Tailscale Serve: مطمئن شوید `gateway.auth.allowTailscale` فعال است و URL Serve را باز می‌کنید، نه URL خام loopback/tailnet که headerهای هویت Tailscale را دور می‌زند.
    - حالت trusted-proxy: مطمئن شوید از طریق proxy هویت‌آگاه پیکربندی‌شده وارد می‌شوید، نه URL خام گیت‌وی. proxyهای loopback روی همان میزبان نیز به `gateway.auth.trustedProxy.allowLoopback = true` نیاز دارند.
    - اگر ناهماهنگی پس از یک retry باقی ماند، توکن دستگاه pairشده را rotate/دوباره تایید کنید:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - اگر آن فراخوان rotate گفت رد شده است، دو چیز را بررسی کنید:
      - نشست‌های paired-device فقط می‌توانند دستگاه **خودشان** را rotate کنند، مگر اینکه `operator.admin` هم داشته باشند
      - مقادیر صریح `--scope` نمی‌توانند از scopeهای فعلی operator فراخواننده فراتر بروند
    - هنوز گیر کرده‌اید؟ `openclaw status --all` را اجرا کنید و [عیب‌یابی](/fa/gateway/troubleshooting) را دنبال کنید. برای جزئیات احراز هویت، [داشبورد](/fa/web/dashboard) را ببینید.

  </Accordion>

  <Accordion title="gateway.bind را روی tailnet گذاشته‌ام اما نمی‌تواند bind کند و چیزی گوش نمی‌دهد">
    bind با `tailnet` یک IP Tailscale را از interfaceهای شبکه شما انتخاب می‌کند (100.64.0.0/10). اگر ماشین روی Tailscale نباشد (یا interface پایین باشد)، چیزی برای bind کردن وجود ندارد.

    رفع:

    - Tailscale را روی آن میزبان شروع کنید (تا یک نشانی 100.x داشته باشد)، یا
    - به `gateway.bind: "loopback"` / `"lan"` تغییر دهید.

    نکته: `tailnet` صریح است. `auto`، loopback را ترجیح می‌دهد؛ وقتی bind فقط برای tailnet می‌خواهید، از `gateway.bind: "tailnet"` استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم چند Gateway را روی یک میزبان اجرا کنم؟">
    معمولا نه - یک Gateway می‌تواند چند کانال پیام‌رسانی و عامل را اجرا کند. فقط زمانی از چند Gateway استفاده کنید که به افزونگی (مثلا: ربات نجات) یا ایزوله‌سازی سخت نیاز دارید.

    بله، اما باید ایزوله کنید:

    - `OPENCLAW_CONFIG_PATH` (پیکربندی جداگانه برای هر نمونه)
    - `OPENCLAW_STATE_DIR` (state جداگانه برای هر نمونه)
    - `agents.defaults.workspace` (ایزوله‌سازی workspace)
    - `gateway.port` (پورت‌های یکتا)

    راه‌اندازی سریع (پیشنهادی):

    - برای هر نمونه از `openclaw --profile <name> ...` استفاده کنید (به‌طور خودکار `~/.openclaw-<name>` را ایجاد می‌کند).
    - در پیکربندی هر profile، یک `gateway.port` یکتا تنظیم کنید (یا برای اجراهای دستی `--port` را پاس بدهید).
    - سرویس جداگانه برای هر profile نصب کنید: `openclaw --profile <name> gateway install`.

    profileها همچنین نام سرویس‌ها را پسونددار می‌کنند (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    راهنمای کامل: [چند گیت‌وی](/fa/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='عبارت "invalid handshake" / کد 1008 به چه معناست؟'>
    Gateway یک **سرور WebSocket** است، و انتظار دارد نخستین پیام
    یک frame از نوع `connect` باشد. اگر چیز دیگری دریافت کند، اتصال را
    با **کد 1008** (نقض policy) می‌بندد.

    علت‌های رایج:

    - URL **HTTP** را در مرورگر باز کرده‌اید (`http://...`) به‌جای یک کلاینت WS.
    - از پورت یا مسیر اشتباه استفاده کرده‌اید.
    - یک proxy یا tunnel headerهای احراز هویت را حذف کرده یا یک درخواست غیر-Gateway فرستاده است.

    رفع‌های سریع:

    1. از URL مربوط به WS استفاده کنید: `ws://<host>:18789` (یا اگر HTTPS است `wss://...`).
    2. پورت WS را در یک تب معمولی مرورگر باز نکنید.
    3. اگر احراز هویت روشن است، توکن/گذرواژه را در frame مربوط به `connect` قرار دهید.

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

    می‌توانید از طریق `logging.file` یک مسیر پایدار تنظیم کنید. سطح لاگ فایل با `logging.level` کنترل می‌شود. پرگویی کنسول با `--verbose` و `logging.consoleLevel` کنترل می‌شود.

    سریع‌ترین دنبال‌کردن لاگ:

    ```bash
    openclaw logs --follow
    ```

    لاگ‌های سرویس/supervisor (وقتی گیت‌وی از طریق launchd/systemd اجرا می‌شود):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` و `gateway.err.log` (پیش‌فرض: `~/.openclaw/logs/...`; profileها از `~/.openclaw-<profile>/logs/...` استفاده می‌کنند)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    برای اطلاعات بیشتر [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید.

  </Accordion>

  <Accordion title="چگونه سرویس Gateway را شروع/متوقف/راه‌اندازی مجدد کنم؟">
    از helperهای gateway استفاده کنید:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر گیت‌وی را دستی اجرا می‌کنید، `openclaw gateway --force` می‌تواند پورت را پس بگیرد. [Gateway](/fa/gateway) را ببینید.

  </Accordion>

  <Accordion title="ترمینالم را در Windows بستم - چگونه OpenClaw را دوباره راه‌اندازی کنم؟">
    **دو حالت نصب Windows** وجود دارد:

    **1) WSL2 (پیشنهادی):** Gateway داخل Linux اجرا می‌شود.

    PowerShell را باز کنید، وارد WSL شوید، سپس راه‌اندازی مجدد کنید:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر هیچ‌وقت سرویس را نصب نکرده‌اید، آن را در foreground شروع کنید:

    ```bash
    openclaw gateway run
    ```

    **2) Windows بومی (پیشنهاد نمی‌شود):** Gateway مستقیما در Windows اجرا می‌شود.

    PowerShell را باز کنید و اجرا کنید:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر آن را دستی اجرا می‌کنید (بدون سرویس)، استفاده کنید از:

    ```powershell
    openclaw gateway run
    ```

    مستندات: [Windows (WSL2)](/fa/platforms/windows), [runbook سرویس Gateway](/fa/gateway).

  </Accordion>

  <Accordion title="Gateway فعال است اما پاسخ‌ها هرگز نمی‌رسند. چه چیزی را باید بررسی کنم؟">
    با یک بررسی سلامت سریع شروع کنید:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    علت‌های رایج:

    - احراز هویت مدل روی **میزبان گیت‌وی** بارگذاری نشده است (`models status` را بررسی کنید).
    - pairing/allowlist کانال پاسخ‌ها را مسدود می‌کند (پیکربندی کانال + لاگ‌ها را بررسی کنید).
    - WebChat/Dashboard بدون توکن درست باز است.

    اگر راه‌دور هستید، تایید کنید اتصال tunnel/Tailscale فعال است و
    WebSocket گیت‌وی قابل دسترسی است.

    مستندات: [کانال‌ها](/fa/channels), [عیب‌یابی](/fa/gateway/troubleshooting), [دسترسی راه‌دور](/fa/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - حالا چه کنم؟'>
    این معمولا یعنی UI اتصال WebSocket را از دست داده است. بررسی کنید:

    1. آیا Gateway در حال اجرا است؟ `openclaw gateway status`
    2. آیا Gateway سالم است؟ `openclaw status`
    3. آیا رابط کاربری توکن درست را دارد؟ `openclaw dashboard`
    4. اگر ریموت است، آیا تونل/لینک Tailscale برقرار است؟

    سپس لاگ‌ها را دنبال کنید:

    ```bash
    openclaw logs --follow
    ```

    مستندات: [داشبورد](/fa/web/dashboard)، [دسترسی ریموت](/fa/gateway/remote)، [عیب‌یابی](/fa/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands ناموفق می‌شود. چه چیزی را باید بررسی کنم؟">
    با لاگ‌ها و وضعیت کانال شروع کنید:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    سپس خطا را مطابقت دهید:

    - `BOT_COMMANDS_TOO_MUCH`: منوی Telegram ورودی‌های بیش از حدی دارد. OpenClaw از قبل آن را تا سقف Telegram کوتاه می‌کند و با فرمان‌های کمتر دوباره تلاش می‌کند، اما هنوز باید برخی ورودی‌های منو حذف شوند. فرمان‌های Plugin/skill/سفارشی را کاهش دهید، یا اگر به منو نیاز ندارید `channels.telegram.commands.native` را غیرفعال کنید.
    - `TypeError: fetch failed`، `Network request for 'setMyCommands' failed!`، یا خطاهای شبکه مشابه: اگر روی VPS هستید یا پشت پروکسی قرار دارید، تأیید کنید HTTPS خروجی مجاز است و DNS برای `api.telegram.org` کار می‌کند.

    اگر Gateway ریموت است، مطمئن شوید که لاگ‌ها را روی میزبان Gateway می‌بینید.

    مستندات: [Telegram](/fa/channels/telegram)، [عیب‌یابی کانال](/fa/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI هیچ خروجی نشان نمی‌دهد. چه چیزی را باید بررسی کنم؟">
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

  <Accordion title="چگونه Gateway را کامل متوقف و سپس شروع کنم؟">
    اگر سرویس را نصب کرده‌اید:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    این کار **سرویس تحت نظارت** را متوقف/شروع می‌کند (launchd در macOS، systemd در Linux).
    وقتی Gateway به‌صورت daemon در پس‌زمینه اجرا می‌شود، از این استفاده کنید.

    اگر در پیش‌زمینه اجرا می‌کنید، با Ctrl-C متوقف کنید، سپس:

    ```bash
    openclaw gateway run
    ```

    مستندات: [دفترچه اجرای سرویس Gateway](/fa/gateway).

  </Accordion>

  <Accordion title="توضیح ساده: openclaw gateway restart در برابر openclaw gateway">
    - `openclaw gateway restart`: **سرویس پس‌زمینه** را بازراه‌اندازی می‌کند (launchd/systemd).
    - `openclaw gateway`: gateway را برای این نشست ترمینال **در پیش‌زمینه** اجرا می‌کند.

    اگر سرویس را نصب کرده‌اید، از فرمان‌های gateway استفاده کنید. وقتی
    یک اجرای تک‌باره و پیش‌زمینه می‌خواهید، از `openclaw gateway` استفاده کنید.

  </Accordion>

  <Accordion title="سریع‌ترین راه برای دریافت جزئیات بیشتر هنگام شکست چیزی">
    Gateway را با `--verbose` شروع کنید تا جزئیات بیشتری در کنسول دریافت کنید. سپس فایل لاگ را برای احراز هویت کانال، مسیریابی مدل، و خطاهای RPC بررسی کنید.
  </Accordion>
</AccordionGroup>

## رسانه و پیوست‌ها

<AccordionGroup>
  <Accordion title="skill من یک تصویر/PDF تولید کرد، اما چیزی ارسال نشد">
    پیوست‌های خروجی از عامل باید یک خط `MEDIA:<path-or-url>` داشته باشند (در خط خودش). [راه‌اندازی دستیار OpenClaw](/fa/start/openclaw) و [ارسال عامل](/fa/tools/agent-send) را ببینید.

    ارسال با CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    همچنین بررسی کنید:

    - کانال مقصد از رسانه خروجی پشتیبانی می‌کند و توسط allowlistها مسدود نشده است.
    - فایل در محدوده اندازه ارائه‌دهنده قرار دارد (تصاویر به حداکثر 2048px تغییر اندازه داده می‌شوند).
    - `tools.fs.workspaceOnly=true` ارسال‌های مسیر محلی را به workspace، temp/media-store، و فایل‌های تأییدشده توسط sandbox محدود می‌کند.
    - `tools.fs.workspaceOnly=false` به `MEDIA:` اجازه می‌دهد فایل‌های محلی میزبان را که عامل از قبل می‌تواند بخواند ارسال کند، اما فقط برای رسانه و انواع سند امن (تصاویر، صدا، ویدئو، PDF، و اسناد Office). متن ساده و فایل‌های شبیه به راز همچنان مسدود می‌شوند.

    [تصاویر](/fa/nodes/images) را ببینید.

  </Accordion>
</AccordionGroup>

## امنیت و کنترل دسترسی

<AccordionGroup>
  <Accordion title="آیا در معرض گذاشتن OpenClaw برای DMهای ورودی امن است؟">
    DMهای ورودی را ورودی غیرقابل اعتماد در نظر بگیرید. پیش‌فرض‌ها برای کاهش ریسک طراحی شده‌اند:

    - رفتار پیش‌فرض در کانال‌هایی که قابلیت DM دارند **جفت‌سازی** است:
      - فرستندگان ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ بات پیام آن‌ها را پردازش نمی‌کند.
      - تأیید با: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - درخواست‌های در انتظار به **3 مورد برای هر کانال** محدود شده‌اند؛ اگر کدی نرسید، `openclaw pairing list --channel <channel> [--account <id>]` را بررسی کنید.
    - باز کردن عمومی DMها به opt-in صریح نیاز دارد (`dmPolicy: "open"` و allowlist `"*"`).

    برای آشکار کردن سیاست‌های DM پرریسک، `openclaw doctor` را اجرا کنید.

  </Accordion>

  <Accordion title="آیا prompt injection فقط برای بات‌های عمومی نگرانی محسوب می‌شود؟">
    خیر. prompt injection درباره **محتوای غیرقابل اعتماد** است، نه فقط اینکه چه کسی می‌تواند به بات DM بدهد.
    اگر دستیار شما محتوای خارجی را می‌خواند (جست‌وجو/واکشی وب، صفحه‌های مرورگر، ایمیل‌ها،
    اسناد، پیوست‌ها، لاگ‌های چسبانده‌شده)، آن محتوا می‌تواند دستورالعمل‌هایی داشته باشد که تلاش می‌کنند
    مدل را تصاحب کنند. این حتی زمانی هم می‌تواند رخ دهد که **شما تنها فرستنده هستید**.

    بزرگ‌ترین ریسک زمانی است که ابزارها فعال هستند: مدل می‌تواند فریب بخورد تا
    context را خارج کند یا از طرف شما ابزارها را فراخوانی کند. دامنه اثر را با این کارها کاهش دهید:

    - استفاده از یک عامل "خواننده" فقط‌خواندنی یا بدون ابزار برای خلاصه کردن محتوای غیرقابل اعتماد
    - خاموش نگه داشتن `web_search` / `web_fetch` / `browser` برای عامل‌های دارای ابزار
    - غیرقابل اعتماد دانستن متن فایل/سند رمزگشایی‌شده هم: OpenResponses
      `input_file` و استخراج پیوست رسانه‌ای هر دو متن استخراج‌شده را در
      نشانگرهای مرزی صریح محتوای خارجی می‌پیچند، به‌جای اینکه متن خام فایل را عبور دهند
    - sandbox کردن و allowlistهای سخت‌گیرانه ابزار

    جزئیات: [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="آیا بات من باید ایمیل، حساب GitHub، یا شماره تلفن خودش را داشته باشد؟">
    بله، برای بیشتر راه‌اندازی‌ها. جداسازی بات با حساب‌ها و شماره‌تلفن‌های جداگانه
    دامنه اثر را در صورت بروز مشکل کاهش می‌دهد. این کار همچنین چرخاندن
    اعتبارنامه‌ها یا لغو دسترسی را بدون اثر گذاشتن بر حساب‌های شخصی شما آسان‌تر می‌کند.

    کوچک شروع کنید. فقط به ابزارها و حساب‌هایی که واقعاً نیاز دارید دسترسی بدهید، و در صورت نیاز
    بعداً گسترش دهید.

    مستندات: [امنیت](/fa/gateway/security)، [جفت‌سازی](/fa/channels/pairing).

  </Accordion>

  <Accordion title="آیا می‌توانم به آن اختیار پیامک‌هایم را بدهم و آیا این امن است؟">
    ما اختیار کامل روی پیام‌های شخصی شما را توصیه **نمی‌کنیم**. امن‌ترین الگو این است:

    - DMها را در **حالت جفت‌سازی** یا یک allowlist محدود نگه دارید.
    - اگر می‌خواهید از طرف شما پیام بفرستد، از یک **شماره یا حساب جداگانه** استفاده کنید.
    - اجازه دهید پیش‌نویس کند، سپس **قبل از ارسال تأیید کنید**.

    اگر می‌خواهید آزمایش کنید، این کار را روی یک حساب اختصاصی انجام دهید و آن را ایزوله نگه دارید. [امنیت](/fa/gateway/security) را ببینید.

  </Accordion>

  <Accordion title="آیا می‌توانم برای کارهای دستیار شخصی از مدل‌های ارزان‌تر استفاده کنم؟">
    بله، **اگر** عامل فقط گفت‌وگویی باشد و ورودی قابل اعتماد باشد. رده‌های کوچک‌تر
    در برابر ربایش دستورالعمل آسیب‌پذیرترند، پس برای عامل‌های دارای ابزار
    یا هنگام خواندن محتوای غیرقابل اعتماد از آن‌ها پرهیز کنید. اگر باید از مدل کوچک‌تر استفاده کنید، ابزارها را قفل کنید
    و داخل sandbox اجرا کنید. [امنیت](/fa/gateway/security) را ببینید.
  </Accordion>

  <Accordion title="در Telegram فرمان /start را اجرا کردم اما کد جفت‌سازی نگرفتم">
    کدهای جفت‌سازی **فقط** زمانی ارسال می‌شوند که یک فرستنده ناشناس به بات پیام بدهد و
    `dmPolicy: "pairing"` فعال باشد. `/start` به‌تنهایی کد تولید نمی‌کند.

    درخواست‌های در انتظار را بررسی کنید:

    ```bash
    openclaw pairing list telegram
    ```

    اگر دسترسی فوری می‌خواهید، شناسه فرستنده خود را در allowlist قرار دهید یا `dmPolicy: "open"`
    را برای آن حساب تنظیم کنید.

  </Accordion>

  <Accordion title="WhatsApp: آیا به مخاطبان من پیام می‌دهد؟ جفت‌سازی چگونه کار می‌کند؟">
    خیر. سیاست پیش‌فرض DM در WhatsApp **جفت‌سازی** است. فرستندگان ناشناس فقط یک کد جفت‌سازی دریافت می‌کنند و پیامشان **پردازش نمی‌شود**. OpenClaw فقط به گفت‌وگوهایی پاسخ می‌دهد که دریافت می‌کند یا به ارسال‌های صریحی که شما فعال می‌کنید.

    جفت‌سازی را با این فرمان تأیید کنید:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    درخواست‌های در انتظار را فهرست کنید:

    ```bash
    openclaw pairing list whatsapp
    ```

    اعلان شماره تلفن در راهنما: برای تنظیم **allowlist/owner** شما استفاده می‌شود تا DMهای خودتان مجاز باشند. برای ارسال خودکار استفاده نمی‌شود. اگر روی شماره شخصی WhatsApp خود اجرا می‌کنید، از همان شماره استفاده کنید و `channels.whatsapp.selfChatMode` را فعال کنید.

  </Accordion>
</AccordionGroup>

## فرمان‌های گفت‌وگو، لغو کردن وظایف، و «متوقف نمی‌شود»

<AccordionGroup>
  <Accordion title="چگونه جلوی نمایش پیام‌های داخلی سیستم در گفت‌وگو را بگیرم؟">
    بیشتر پیام‌های داخلی یا ابزار فقط وقتی ظاهر می‌شوند که **verbose**، **trace**، یا **reasoning** برای آن نشست فعال باشد.

    در همان گفت‌وگویی که آن را می‌بینید اصلاح کنید:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    اگر همچنان پرسر و صدا است، تنظیمات نشست را در Control UI بررسی کنید و verbose
    را روی **inherit** بگذارید. همچنین تأیید کنید از پروفایل باتی استفاده نمی‌کنید که `verboseDefault` در config
    روی `on` تنظیم شده باشد.

    مستندات: [تفکر و verbose](/fa/tools/thinking)، [امنیت](/fa/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="چگونه یک وظیفه در حال اجرا را متوقف/لغو کنم؟">
    هرکدام از این‌ها را **به‌صورت پیام مستقل** ارسال کنید (بدون اسلش):

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

    مرور کلی فرمان‌های اسلش: [فرمان‌های اسلش](/fa/tools/slash-commands) را ببینید.

    بیشتر فرمان‌ها باید به‌صورت پیام **مستقل** که با `/` شروع می‌شود ارسال شوند، اما چند میانبر (مانند `/status`) برای فرستندگان موجود در allowlist به‌صورت درون‌خطی هم کار می‌کنند.

  </Accordion>

  <Accordion title='چگونه از Telegram پیام Discord ارسال کنم؟ ("Cross-context messaging denied")'>
    OpenClaw به‌طور پیش‌فرض پیام‌رسانی **میان ارائه‌دهنده‌ها** را مسدود می‌کند. اگر فراخوانی ابزار
    به Telegram متصل باشد، به Discord ارسال نخواهد کرد مگر اینکه صریحاً اجازه دهید.

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

    پس از ویرایش config، gateway را بازراه‌اندازی کنید.

  </Accordion>

  <Accordion title='چرا به نظر می‌رسد بات پیام‌های سریع و پشت‌سرهم را "نادیده می‌گیرد"؟'>
    حالت صف کنترل می‌کند پیام‌های جدید چگونه با یک اجرای در جریان تعامل کنند. برای تغییر حالت‌ها از `/queue` استفاده کنید:

    - `steer` - هدایت را برای مرز مدل بعدی در اجرای فعلی صف می‌کند
    - `followup` - پیام‌ها را یکی‌یکی اجرا می‌کند
    - `collect` - پیام‌ها را دسته‌بندی می‌کند و یک‌بار پاسخ می‌دهد
    - `steer-backlog` - اکنون هدایت می‌کند، سپس backlog را پردازش می‌کند
    - `interrupt` - اجرای فعلی را لغو می‌کند و از نو شروع می‌کند

    حالت پیش‌فرض `steer` است. می‌توانید گزینه‌هایی مانند `debounce:0.5s cap:25 drop:summarize` را برای حالت‌های followup اضافه کنید. [صف فرمان](/fa/concepts/queue) را ببینید.

  </Accordion>
</AccordionGroup>

## متفرقه

<AccordionGroup>
  <Accordion title='مدل پیش‌فرض Anthropic با کلید API چیست؟'>
    در OpenClaw، اطلاعات احراز هویت و انتخاب مدل جدا هستند. تنظیم `ANTHROPIC_API_KEY` (یا ذخیره‌کردن کلید API مربوط به Anthropic در پروفایل‌های احراز هویت) احراز هویت را فعال می‌کند، اما مدل پیش‌فرض واقعی همان چیزی است که در `agents.defaults.model.primary` پیکربندی می‌کنید (برای مثال، `anthropic/claude-sonnet-4-6` یا `anthropic/claude-opus-4-6`). اگر `No credentials found for profile "anthropic:default"` را می‌بینید، یعنی Gateway نتوانسته اطلاعات احراز هویت Anthropic را در فایل مورد انتظار `auth-profiles.json` برای عاملی که در حال اجراست پیدا کند.
  </Accordion>
</AccordionGroup>

---

هنوز گیر کرده‌اید؟ در [Discord](https://discord.com/invite/clawd) بپرسید یا یک [بحث GitHub](https://github.com/openclaw/openclaw/discussions) باز کنید.

## مرتبط

- [پرسش‌های متداول اجرای نخست](/fa/help/faq-first-run) — نصب، راه‌اندازی اولیه، احراز هویت، اشتراک‌ها، خطاهای اولیه
- [پرسش‌های متداول مدل‌ها](/fa/help/faq-models) — انتخاب مدل، failover، پروفایل‌های احراز هویت
- [عیب‌یابی](/fa/help/troubleshooting) — تریاژ بر اساس نشانه‌ها
