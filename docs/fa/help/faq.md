---
read_when:
    - پاسخ‌گویی به پرسش‌های رایج پشتیبانی دربارهٔ راه‌اندازی، نصب، شروع به کار یا زمان اجرا
    - تریاژ مشکلات گزارش‌شده توسط کاربران پیش از اشکال‌زدایی عمیق‌تر
summary: پرسش‌های متداول درباره راه‌اندازی، پیکربندی و استفاده از OpenClaw
title: پرسش‌های متداول
x-i18n:
    generated_at: "2026-05-10T19:47:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 121de36647f7452969b760d6b6ab0a6b1b776d63987ca6ba0be1c8cf4c9f85e9
    source_path: help/faq.md
    workflow: 16
---

پاسخ‌های سریع همراه با عیب‌یابی عمیق‌تر برای راه‌اندازی‌های واقعی (توسعه محلی، VPS، چندعاملی، OAuth/کلیدهای API، failover مدل). برای تشخیص‌های زمان اجرا، [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید. برای مرجع کامل پیکربندی، [پیکربندی](/fa/gateway/configuration) را ببینید.

## ۶۰ ثانیه اول اگر چیزی خراب است

1. **وضعیت سریع (بررسی اول)**

   ```bash
   openclaw status
   ```

   خلاصه سریع محلی: OS + به‌روزرسانی، دسترسی‌پذیری gateway/سرویس، agentها/sessionها، پیکربندی provider + مشکلات زمان اجرا (وقتی gateway در دسترس باشد).

2. **گزارش قابل چسباندن (ایمن برای اشتراک‌گذاری)**

   ```bash
   openclaw status --all
   ```

   تشخیص فقط‌خواندنی همراه با انتهای log (tokenها ویرایش شده‌اند).

3. **وضعیت daemon + port**

   ```bash
   openclaw gateway status
   ```

   زمان اجرای supervisor در برابر دسترسی‌پذیری RPC، URL هدف probe، و اینکه سرویس احتمالا از کدام پیکربندی استفاده کرده است را نشان می‌دهد.

4. **probeهای عمیق**

   ```bash
   openclaw status --deep
   ```

   یک probe زنده سلامت gateway را اجرا می‌کند، شامل probeهای channel وقتی پشتیبانی شوند
   (به یک gateway قابل دسترسی نیاز دارد). [سلامت](/fa/gateway/health) را ببینید.

5. **دنبال کردن آخرین log**

   ```bash
   openclaw logs --follow
   ```

   اگر RPC از کار افتاده است، از این fallback استفاده کنید:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   logهای فایل از logهای سرویس جدا هستند؛ [ثبت وقایع](/fa/logging) و [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید.

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

   از gateway در حال اجرا یک snapshot کامل درخواست می‌کند (فقط WS). [سلامت](/fa/gateway/health) را ببینید.

## شروع سریع و راه‌اندازی اجرای اول

پرسش‌وپاسخ اجرای اول — نصب، onboarding، مسیرهای احراز هویت، subscriptionها، خطاهای اولیه —
در [پرسش‌های متداول اجرای اول](/fa/help/faq-first-run) قرار دارد.

## OpenClaw چیست؟

<AccordionGroup>
  <Accordion title="OpenClaw در یک پاراگراف چیست؟">
    OpenClaw یک دستیار AI شخصی است که روی دستگاه‌های خودتان اجرا می‌کنید. روی سطح‌های پیام‌رسانی که همین حالا استفاده می‌کنید پاسخ می‌دهد (WhatsApp، Telegram، Slack، Mattermost، Discord، Google Chat، Signal، iMessage، WebChat، و Pluginهای channel همراه مانند QQ Bot) و روی پلتفرم‌های پشتیبانی‌شده می‌تواند voice + یک Canvas زنده هم ارائه کند. **Gateway** صفحه کنترل همیشه‌روشن است؛ دستیار همان محصول است.
  </Accordion>

  <Accordion title="ارزش پیشنهادی">
    OpenClaw «فقط یک wrapper برای Claude» نیست. این یک **صفحه کنترل local-first** است که به شما اجازه می‌دهد یک
    دستیار توانمند را روی **سخت‌افزار خودتان** اجرا کنید، از اپ‌های چتی که همین حالا استفاده می‌کنید به آن دسترسی داشته باشید، با
    sessionهای stateful، حافظه، و ابزارها - بدون اینکه کنترل workflowهای خود را به یک SaaS میزبانی‌شده بسپارید.

    نکات برجسته:

    - **دستگاه‌های شما، داده‌های شما:** Gateway را هرجا می‌خواهید اجرا کنید (Mac، Linux، VPS) و
      workspace + تاریخچه session را محلی نگه دارید.
    - **channelهای واقعی، نه یک sandbox وب:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc،
      به‌علاوه voice موبایل و Canvas روی پلتفرم‌های پشتیبانی‌شده.
    - **مستقل از مدل:** از Anthropic، OpenAI، MiniMax، OpenRouter، و غیره، با مسیریابی
      و failover برای هر agent استفاده کنید.
    - **گزینه فقط محلی:** مدل‌های محلی را اجرا کنید تا اگر بخواهید **همه داده‌ها بتوانند روی دستگاه شما بمانند**.
    - **مسیریابی چندعاملی:** agentهای جدا برای هر channel، حساب، یا task، هرکدام با
      workspace و پیش‌فرض‌های خودش.
    - **متن‌باز و قابل هک:** بررسی، گسترش، و self-host بدون vendor lock-in.

    مستندات: [Gateway](/fa/gateway)، [Channelها](/fa/channels)، [چندعاملی](/fa/concepts/multi-agent)،
    [حافظه](/fa/concepts/memory).

  </Accordion>

  <Accordion title="همین حالا آن را راه‌اندازی کردم - اول چه کار کنم؟">
    پروژه‌های خوب برای شروع:

    - ساخت یک وب‌سایت (WordPress، Shopify، یا یک سایت static ساده).
    - نمونه‌سازی یک اپ موبایل (طرح کلی، screenها، برنامه API).
    - سازمان‌دهی فایل‌ها و پوشه‌ها (پاک‌سازی، نام‌گذاری، tagگذاری).
    - اتصال Gmail و خودکارسازی summaryها یا follow-upها.

    می‌تواند taskهای بزرگ را انجام دهد، اما وقتی آن‌ها را به phaseها تقسیم کنید و
    از sub-agentها برای کار موازی استفاده کنید، بهترین عملکرد را دارد.

  </Accordion>

  <Accordion title="پنج مورد استفاده روزمره برتر برای OpenClaw چیست؟">
    موفقیت‌های روزمره معمولا این شکل را دارند:

    - **گزارش‌های شخصی:** خلاصه‌هایی از inbox، calendar، و خبرهایی که برایتان مهم است.
    - **پژوهش و پیش‌نویس‌نویسی:** پژوهش سریع، summaryها، و پیش‌نویس‌های اولیه برای emailها یا docs.
    - **یادآورها و follow-upها:** nudges و checklistهای هدایت‌شده با Cron یا Heartbeat.
    - **خودکارسازی مرورگر:** پر کردن formها، جمع‌آوری داده، و تکرار taskهای وب.
    - **هماهنگی بین دستگاه‌ها:** یک task را از گوشی‌تان بفرستید، بگذارید Gateway آن را روی server اجرا کند، و نتیجه را در chat دریافت کنید.

  </Accordion>

  <Accordion title="آیا OpenClaw می‌تواند برای lead gen، outreach، ads، و blogهای یک SaaS کمک کند؟">
    بله، برای **پژوهش، qualification، و پیش‌نویس‌نویسی**. می‌تواند سایت‌ها را scan کند، shortlist بسازد،
    prospectها را خلاصه کند، و پیش‌نویس outreach یا ad copy بنویسد.

    برای **outreach یا اجرای ad**، انسان را در چرخه نگه دارید. از spam پرهیز کنید، قوانین محلی و
    سیاست‌های platform را رعایت کنید، و پیش از ارسال هرچیزی آن را بازبینی کنید. امن‌ترین الگو این است که
    OpenClaw پیش‌نویس کند و شما تأیید کنید.

    مستندات: [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="مزایا در مقایسه با Claude Code برای توسعه وب چیست؟">
    OpenClaw یک **دستیار شخصی** و لایه هماهنگی است، نه جایگزین IDE. برای سریع‌ترین چرخه مستقیم کدنویسی داخل یک repo از
    Claude Code یا Codex استفاده کنید. وقتی حافظه بادوام، دسترسی بین دستگاه‌ها، و orchestration ابزارها را می‌خواهید از OpenClaw استفاده کنید.

    مزایا:

    - **حافظه پایدار + workspace** در سراسر sessionها
    - **دسترسی چندپلتفرمی** (WhatsApp، Telegram، TUI، WebChat)
    - **orchestration ابزارها** (مرورگر، فایل‌ها، زمان‌بندی، hookها)
    - **Gateway همیشه‌روشن** (اجرا روی یک VPS، تعامل از هرجا)
    - **Nodeها** برای مرورگر/صفحه‌نمایش/دوربین/exec محلی

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills و خودکارسازی

<AccordionGroup>
  <Accordion title="چطور Skills را بدون dirty نگه داشتن repo سفارشی کنم؟">
    به‌جای ویرایش کپی repo از overrideهای مدیریت‌شده استفاده کنید. تغییرات خود را در `~/.openclaw/skills/<name>/SKILL.md` قرار دهید (یا از طریق `skills.load.extraDirs` در `~/.openclaw/openclaw.json` یک پوشه اضافه کنید). اولویت به‌ترتیب `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` است، بنابراین overrideهای مدیریت‌شده همچنان بدون دست زدن به git بر skills همراه برتری دارند. اگر لازم است skill به‌صورت global نصب شود اما فقط برای بعضی agentها قابل مشاهده باشد، کپی مشترک را در `~/.openclaw/skills` نگه دارید و visibility را با `agents.defaults.skills` و `agents.list[].skills` کنترل کنید. فقط ویرایش‌هایی که ارزش upstream شدن دارند باید در repo بمانند و به‌صورت PR ارسال شوند.
  </Accordion>

  <Accordion title="آیا می‌توانم Skills را از یک پوشه سفارشی load کنم؟">
    بله. directoryهای اضافی را از طریق `skills.load.extraDirs` در `~/.openclaw/openclaw.json` اضافه کنید (پایین‌ترین اولویت). اولویت پیش‌فرض `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` است. `clawhub` به‌صورت پیش‌فرض در `./skills` نصب می‌کند، که OpenClaw در session بعدی آن را به‌عنوان `<workspace>/skills` در نظر می‌گیرد. اگر skill باید فقط برای agentهای خاصی قابل مشاهده باشد، آن را با `agents.defaults.skills` یا `agents.list[].skills` همراه کنید.
  </Accordion>

  <Accordion title="چطور می‌توانم برای taskهای مختلف از مدل‌های مختلف استفاده کنم؟">
    الگوهای پشتیبانی‌شده امروز این‌ها هستند:

    - **Cron jobها**: jobهای ایزوله می‌توانند برای هر job یک override برای `model` تنظیم کنند.
    - **Sub-agentها**: taskها را به agentهای جداگانه با مدل‌های پیش‌فرض متفاوت route کنید.
    - **تعویض در لحظه**: از `/model` برای تعویض مدل session فعلی در هر زمان استفاده کنید.

    [Cron jobها](/fa/automation/cron-jobs)، [مسیریابی چندعاملی](/fa/concepts/multi-agent)، و [دستورهای Slash](/fa/tools/slash-commands) را ببینید.

  </Accordion>

  <Accordion title="bot هنگام کار سنگین freeze می‌شود. چطور آن را offload کنم؟">
    برای taskهای طولانی یا موازی از **sub-agentها** استفاده کنید. Sub-agentها در session خودشان اجرا می‌شوند،
    یک summary برمی‌گردانند، و chat اصلی شما را پاسخ‌گو نگه می‌دارند.

    از bot خود بخواهید «برای این task یک sub-agent اجرا کند» یا از `/subagents` استفاده کنید.
    در chat از `/status` استفاده کنید تا ببینید Gateway همین حالا چه کاری انجام می‌دهد (و آیا busy است یا نه).

    نکته token: taskهای طولانی و sub-agentها هر دو token مصرف می‌کنند. اگر هزینه برایتان مهم است، از طریق
    `agents.defaults.subagents.model` یک مدل ارزان‌تر برای sub-agentها تنظیم کنید.

    مستندات: [Sub-agentها](/fa/tools/subagents)، [Taskهای پس‌زمینه](/fa/automation/tasks).

  </Accordion>

  <Accordion title="sessionهای subagent وابسته به thread در Discord چطور کار می‌کنند؟">
    از bindingهای thread استفاده کنید. می‌توانید یک thread در Discord را به یک subagent یا target یک session bind کنید تا پیام‌های follow-up در آن thread روی همان session bindشده بمانند.

    جریان پایه:

    - با `sessions_spawn` و استفاده از `thread: true` spawn کنید (و در صورت نیاز `mode: "session"` برای follow-up پایدار).
    - یا به‌صورت دستی با `/focus <target>` bind کنید.
    - از `/agents` برای بررسی وضعیت binding استفاده کنید.
    - از `/session idle <duration|off>` و `/session max-age <duration|off>` برای کنترل auto-unfocus استفاده کنید.
    - از `/unfocus` برای جدا کردن thread استفاده کنید.

    پیکربندی لازم:

    - پیش‌فرض‌های global: `session.threadBindings.enabled`، `session.threadBindings.idleHours`، `session.threadBindings.maxAgeHours`.
    - overrideهای Discord: `channels.discord.threadBindings.enabled`، `channels.discord.threadBindings.idleHours`، `channels.discord.threadBindings.maxAgeHours`.
    - auto-bind هنگام spawn: `channels.discord.threadBindings.spawnSessions` به‌صورت پیش‌فرض `true` است؛ برای غیرفعال کردن spawnهای session وابسته به thread آن را روی `false` بگذارید.

    مستندات: [Sub-agentها](/fa/tools/subagents)، [Discord](/fa/channels/discord)، [مرجع پیکربندی](/fa/gateway/configuration-reference)، [دستورهای Slash](/fa/tools/slash-commands).

  </Accordion>

  <Accordion title="یک subagent تمام شد، اما update تکمیل به جای اشتباه رفت یا هرگز post نشد. چه چیزی را بررسی کنم؟">
    ابتدا route حل‌شده requester را بررسی کنید:

    - تحویل subagent در حالت completion، وقتی thread یا route مکالمه bindشده‌ای وجود داشته باشد، همان را ترجیح می‌دهد.
    - اگر origin تکمیل فقط یک channel داشته باشد، OpenClaw به route ذخیره‌شده requester session (`lastChannel` / `lastTo` / `lastAccountId`) fallback می‌کند تا تحویل مستقیم همچنان بتواند موفق شود.
    - اگر نه route bindشده‌ای وجود داشته باشد و نه route ذخیره‌شده قابل استفاده‌ای، تحویل مستقیم می‌تواند fail شود و نتیجه به‌جای post فوری در chat، به تحویل queueشده session fallback می‌کند.
    - targetهای نامعتبر یا stale همچنان می‌توانند queue fallback یا failure نهایی تحویل را اجبار کنند.
    - اگر آخرین پاسخ قابل مشاهده assistant در child دقیقا token ساکت `NO_REPLY` / `no_reply`، یا دقیقا `ANNOUNCE_SKIP` باشد، OpenClaw عمدا announce را به‌جای post کردن progress قدیمی‌تر و stale سرکوب می‌کند.
    - اگر child پس از فقط tool callها timeout شود، announce می‌تواند آن را به‌جای replay کردن خروجی خام ابزار، به یک summary کوتاه از progress جزئی collapse کند.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [Sub-agentها](/fa/tools/subagents)، [Taskهای پس‌زمینه](/fa/automation/tasks)، [ابزارهای Session](/fa/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron یا یادآورها اجرا نمی‌شوند. چه چیزی را بررسی کنم؟">
    Cron داخل فرایند Gateway اجرا می‌شود. اگر Gateway به‌صورت پیوسته در حال اجرا نباشد،
    jobهای زمان‌بندی‌شده اجرا نخواهند شد.

    Checklist:

    - تأیید کنید cron فعال است (`cron.enabled`) و `OPENCLAW_SKIP_CRON` تنظیم نشده است.
    - بررسی کنید Gateway به‌صورت 24/7 در حال اجراست (بدون sleep/restart).
    - تنظیمات timezone را برای job بررسی کنید (`--tz` در برابر timezone میزبان).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    مستندات: [Cron jobها](/fa/automation/cron-jobs)، [خودکارسازی و Taskها](/fa/automation).

  </Accordion>

  <Accordion title="Cron اجرا شد، اما چیزی به کانال ارسال نشد. چرا؟">
    ابتدا حالت تحویل را بررسی کنید:

    - `--no-deliver` / `delivery.mode: "none"` یعنی انتظار نمی‌رود ارسال جایگزین توسط اجراکننده انجام شود.
    - هدف اعلانِ ناموجود یا نامعتبر (`channel` / `to`) یعنی اجراکننده تحویل خروجی را نادیده گرفته است.
    - خطاهای احراز هویت کانال (`unauthorized`, `Forbidden`) یعنی اجراکننده تلاش کرده تحویل دهد اما اعتبارنامه‌ها مانع شده‌اند.
    - نتیجهٔ ایزولهٔ بی‌صدا (فقط `NO_REPLY` / `no_reply`) عمداً غیرقابل‌تحویل تلقی می‌شود، بنابراین اجراکننده تحویل جایگزینِ صف‌شده را هم سرکوب می‌کند.

    برای کارهای Cron ایزوله، عامل همچنان می‌تواند وقتی مسیر چت در دسترس است
    مستقیماً با ابزار `message` ارسال کند. `--announce` فقط مسیر جایگزین
    اجراکننده را برای متن نهایی‌ای کنترل می‌کند که عامل قبلاً ارسال نکرده است.

    اشکال‌زدایی:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [وظایف پس‌زمینه](/fa/automation/tasks).

  </Accordion>

  <Accordion title="چرا یک اجرای Cron ایزوله مدل‌ها را عوض کرد یا یک بار دوباره تلاش کرد؟">
    این معمولاً مسیر زندهٔ تعویض مدل است، نه زمان‌بندی تکراری.

    Cron ایزوله می‌تواند یک تحویل مدل در زمان اجرا را پایدار کند و وقتی اجرای فعال
    `LiveSessionModelSwitchError` پرتاب می‌کند دوباره تلاش کند. تلاش مجدد همان
    ارائه‌دهنده/مدلِ تعویض‌شده را نگه می‌دارد، و اگر تعویض شامل یک بازنویسی تازهٔ
    پروفایل احراز هویت باشد، Cron آن را هم پیش از تلاش مجدد پایدار می‌کند.

    قواعد انتخاب مرتبط:

    - بازنویسی مدل در قلاب Gmail، وقتی قابل اعمال باشد، اولویت اول را دارد.
    - سپس `model` هر کار.
    - سپس هر بازنویسی ذخیره‌شدهٔ مدلِ نشست Cron.
    - سپس انتخاب عادی مدلِ عامل/پیش‌فرض.

    حلقهٔ تلاش مجدد محدود است. پس از تلاش اولیه به‌علاوهٔ 2 تلاش مجدد برای تعویض،
    Cron به‌جای چرخیدن بی‌پایان متوقف می‌شود.

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

    `openclaw skills install` بومی، در پوشهٔ `skills/` فضای کاری فعال
    می‌نویسد. CLI جداگانهٔ `clawhub` را فقط زمانی نصب کنید که بخواهید Skills
    خودتان را منتشر یا همگام‌سازی کنید. برای نصب‌های مشترک بین عامل‌ها، Skill را زیر
    `~/.openclaw/skills` بگذارید و اگر می‌خواهید محدود کنید کدام عامل‌ها بتوانند آن را ببینند، از
    `agents.defaults.skills` یا
    `agents.list[].skills` استفاده کنید.

  </Accordion>

  <Accordion title="آیا OpenClaw می‌تواند وظایف را طبق زمان‌بندی یا به‌صورت پیوسته در پس‌زمینه اجرا کند؟">
    بله. از زمان‌بند Gateway استفاده کنید:

    - **کارهای Cron** برای وظایف زمان‌بندی‌شده یا تکرارشونده (پس از راه‌اندازی مجدد پایدار می‌مانند).
    - **Heartbeat** برای بررسی‌های دوره‌ای «نشست اصلی».
    - **کارهای ایزوله** برای عامل‌های خودمختاری که خلاصه‌ها را منتشر می‌کنند یا به چت‌ها تحویل می‌دهند.

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [اتوماسیون و وظایف](/fa/automation)،
    [Heartbeat](/fa/gateway/heartbeat).

  </Accordion>

  <Accordion title="آیا می‌توانم Skills مخصوص Apple macOS را از Linux اجرا کنم؟">
    نه مستقیماً. Skills مربوط به macOS با `metadata.openclaw.os` به‌همراه باینری‌های لازم کنترل می‌شوند، و Skills فقط وقتی در اعلان سیستم ظاهر می‌شوند که روی **میزبان Gateway** واجد شرایط باشند. روی Linux، Skills فقط مخصوص `darwin` (مانند `apple-notes`، `apple-reminders`، `things-mac`) بارگذاری نمی‌شوند مگر اینکه این کنترل را بازنویسی کنید.

    سه الگوی پشتیبانی‌شده دارید:

    **گزینهٔ A - Gateway را روی یک Mac اجرا کنید (ساده‌ترین).**
    Gateway را جایی اجرا کنید که باینری‌های macOS وجود دارند، سپس از Linux در [حالت راه‌دور](#gateway-ports-already-running-and-remote-mode) یا از طریق Tailscale وصل شوید. Skills به‌صورت عادی بارگذاری می‌شوند، چون میزبان Gateway، macOS است.

    **گزینهٔ B - از یک Node مربوط به macOS استفاده کنید (بدون SSH).**
    Gateway را روی Linux اجرا کنید، یک Node مربوط به macOS (برنامهٔ نوار منو) را جفت کنید، و **Node Run Commands** را روی Mac روی «Always Ask» یا «Always Allow» بگذارید. OpenClaw می‌تواند Skills فقط مخصوص macOS را وقتی باینری‌های لازم روی Node وجود دارند واجد شرایط تلقی کند. عامل این Skills را از طریق ابزار `nodes` اجرا می‌کند. اگر «Always Ask» را انتخاب کنید، تأیید «Always Allow» در اعلان، آن فرمان را به فهرست مجاز اضافه می‌کند.

    **گزینهٔ C - باینری‌های macOS را از طریق SSH پراکسی کنید (پیشرفته).**
    Gateway را روی Linux نگه دارید، اما کاری کنید باینری‌های CLI لازم به پوشش‌های SSH resolve شوند که روی یک Mac اجرا می‌شوند. سپس Skill را بازنویسی کنید تا Linux را مجاز کند و واجد شرایط بماند.

    1. یک پوشش SSH برای باینری بسازید (مثال: `memo` برای Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. پوشش را روی `PATH` میزبان Linux قرار دهید (برای مثال `~/bin/memo`).
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

    - **Skill / Plugin سفارشی:** بهترین گزینه برای دسترسی قابل‌اعتماد به API (Notion/HeyGen هر دو API دارند).
    - **اتوماسیون مرورگر:** بدون کدنویسی کار می‌کند اما کندتر و شکننده‌تر است.

    اگر می‌خواهید زمینه را برای هر مشتری نگه دارید (گردش‌کارهای آژانسی)، یک الگوی ساده این است:

    - یک صفحهٔ Notion برای هر مشتری (زمینه + ترجیحات + کار فعال).
    - از عامل بخواهید در آغاز نشست آن صفحه را دریافت کند.

    اگر یک یکپارچه‌سازی بومی می‌خواهید، یک درخواست قابلیت باز کنید یا یک Skill
    هدف‌گیری‌کنندهٔ آن APIها بسازید.

    نصب Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    نصب‌های بومی در پوشهٔ `skills/` فضای کاری فعال قرار می‌گیرند. برای Skills مشترک بین عامل‌ها، آن‌ها را در `~/.openclaw/skills/<name>/SKILL.md` قرار دهید. اگر فقط برخی عامل‌ها باید یک نصب مشترک را ببینند، `agents.defaults.skills` یا `agents.list[].skills` را پیکربندی کنید. برخی Skills انتظار دارند باینری‌ها از طریق Homebrew نصب شده باشند؛ روی Linux این یعنی Linuxbrew (ورودی FAQ مربوط به Homebrew Linux را در بالا ببینید). [Skills](/fa/tools/skills)، [پیکربندی Skills](/fa/tools/skills-config)، و [ClawHub](/fa/clawhub) را ببینید.

  </Accordion>

  <Accordion title="چگونه از Chrome موجودِ واردشده به حساب کاربری‌ام با OpenClaw استفاده کنم؟">
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

    این مسیر می‌تواند از مرورگر میزبان local یا یک Node مرورگر متصل استفاده کند. اگر Gateway جای دیگری اجرا می‌شود، یا یک میزبان Node را روی دستگاه مرورگر اجرا کنید یا به‌جای آن از CDP راه‌دور استفاده کنید.

    محدودیت‌های فعلی برای `existing-session` / `user`:

    - کنش‌ها مبتنی بر ref هستند، نه مبتنی بر انتخابگر CSS
    - بارگذاری‌ها به `ref` / `inputRef` نیاز دارند و فعلاً هر بار از یک فایل پشتیبانی می‌کنند
    - `responsebody`، خروجی PDF، رهگیری دانلود، و کنش‌های دسته‌ای هنوز به یک مرورگر مدیریت‌شده یا پروفایل CDP خام نیاز دارند

  </Accordion>
</AccordionGroup>

## Sandboxing و حافظه

<AccordionGroup>
  <Accordion title="آیا سند اختصاصی برای Sandboxing وجود دارد؟">
    بله. [Sandboxing](/fa/gateway/sandboxing) را ببینید. برای راه‌اندازی ویژهٔ Docker (Gateway کامل در Docker یا تصویرهای sandbox)، [Docker](/fa/install/docker) را ببینید.
  </Accordion>

  <Accordion title="Docker محدود به نظر می‌رسد - چگونه قابلیت‌های کامل را فعال کنم؟">
    تصویر پیش‌فرض با اولویت امنیت طراحی شده و با کاربر `node` اجرا می‌شود، بنابراین
    شامل بسته‌های سیستم، Homebrew، یا مرورگرهای همراه نیست. برای راه‌اندازی کامل‌تر:

    - `/home/node` را با `OPENCLAW_HOME_VOLUME` پایدار کنید تا cacheها باقی بمانند.
    - وابستگی‌های سیستم را با `OPENCLAW_DOCKER_APT_PACKAGES` در تصویر bake کنید.
    - مرورگرهای Playwright را از طریق CLI همراه نصب کنید:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` را تنظیم کنید و مطمئن شوید مسیر پایدار می‌ماند.

    مستندات: [Docker](/fa/install/docker)، [مرورگر](/fa/tools/browser).

  </Accordion>

  <Accordion title="آیا می‌توانم DMها را شخصی نگه دارم اما گروه‌ها را با یک عامل عمومی/sandboxed کنم؟">
    بله - اگر ترافیک خصوصی شما **DMها** و ترافیک عمومی شما **گروه‌ها** باشد.

    از `agents.defaults.sandbox.mode: "non-main"` استفاده کنید تا نشست‌های گروه/کانال (کلیدهای غیر اصلی) در backend پیکربندی‌شدهٔ sandbox اجرا شوند، در حالی‌که نشست اصلی DM روی میزبان باقی می‌ماند. اگر backend انتخاب نکنید، Docker پیش‌فرض است. سپس ابزارهای در دسترس در نشست‌های sandboxed را از طریق `tools.sandbox.tools` محدود کنید.

    راهنمای راه‌اندازی + پیکربندی نمونه: [گروه‌ها: DMهای شخصی + گروه‌های عمومی](/fa/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع کلیدی پیکربندی: [پیکربندی Gateway](/fa/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="چگونه یک پوشهٔ میزبان را در sandbox bind کنم؟">
    `agents.defaults.sandbox.docker.binds` را روی `["host:path:mode"]` تنظیم کنید (مثلاً `"/home/user/src:/src:ro"`). bindهای سراسری و هر عامل با هم merge می‌شوند؛ وقتی `scope: "shared"` باشد، bindهای هر عامل نادیده گرفته می‌شوند. برای هر چیز حساس از `:ro` استفاده کنید و به خاطر داشته باشید bindها از دیوارهای فایل‌سیستم sandbox عبور می‌کنند.

    OpenClaw منابع bind را هم در برابر مسیر نرمال‌شده و هم مسیر canonical حل‌شده از طریق عمیق‌ترین جد موجود اعتبارسنجی می‌کند. یعنی فرارهای والدِ symlink حتی وقتی آخرین بخش مسیر هنوز وجود ندارد هم بسته می‌مانند، و بررسی‌های ریشهٔ مجاز همچنان پس از resolve شدن symlink اعمال می‌شوند.

    برای نمونه‌ها و نکات ایمنی، [Sandboxing](/fa/gateway/sandboxing#custom-bind-mounts) و [Sandbox در برابر سیاست ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) را ببینید.

  </Accordion>

  <Accordion title="حافظه چگونه کار می‌کند؟">
    حافظهٔ OpenClaw فقط فایل‌های Markdown در فضای کاری عامل است:

    - یادداشت‌های روزانه در `memory/YYYY-MM-DD.md`
    - یادداشت‌های بلندمدتِ گزینش‌شده در `MEMORY.md` (فقط نشست‌های اصلی/خصوصی)

    OpenClaw همچنین یک **flush بی‌صدای حافظه پیش از Compaction** اجرا می‌کند تا به مدل
    یادآوری کند پیش از auto-compaction یادداشت‌های پایدار بنویسد. این فقط وقتی اجرا می‌شود که فضای کاری
    قابل‌نوشتن باشد (sandboxهای فقط‌خواندنی آن را رد می‌کنند). [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>

  <Accordion title="حافظه مدام چیزها را فراموش می‌کند. چگونه آن را ماندگار کنم؟">
    از بات بخواهید **واقعیت را در حافظه بنویسد**. یادداشت‌های بلندمدت باید در `MEMORY.md` باشند،
    و زمینهٔ کوتاه‌مدت در `memory/YYYY-MM-DD.md` قرار می‌گیرد.

    این هنوز حوزه‌ای است که در حال بهبود آن هستیم. یادآوری به مدل برای ذخیرهٔ خاطرات کمک می‌کند؛
    خودش می‌داند چه کاری انجام دهد. اگر همچنان فراموش می‌کند، بررسی کنید Gateway در هر اجرا از همان
    فضای کاری استفاده می‌کند.

    مستندات: [حافظه](/fa/concepts/memory)، [فضای کاری عامل](/fa/concepts/agent-workspace).

  </Accordion>

  <Accordion title="آیا حافظه برای همیشه پایدار می‌ماند؟ محدودیت‌ها چیست؟">
    فایل‌های حافظه روی دیسک زندگی می‌کنند و تا زمانی که آن‌ها را حذف نکنید باقی می‌مانند. محدودیت، فضای
    ذخیره‌سازی شماست، نه مدل. **زمینهٔ نشست** همچنان به پنجرهٔ زمینهٔ مدل
    محدود است، بنابراین گفتگوهای طولانی می‌توانند compact یا truncate شوند. به همین دلیل
    جستجوی حافظه وجود دارد - فقط بخش‌های مرتبط را دوباره به زمینه می‌آورد.

    مستندات: [حافظه](/fa/concepts/memory)، [زمینه](/fa/concepts/context).

  </Accordion>

  <Accordion title="آیا جست‌وجوی معنایی حافظه به کلید API OpenAI نیاز دارد؟">
    فقط اگر از **تعبیه‌های OpenAI** استفاده کنید. OAuth مربوط به Codex چت/تکمیل‌ها را پوشش می‌دهد و
    دسترسی به تعبیه‌ها را **نمی‌دهد**، بنابراین **ورود با Codex (OAuth یا ورود CLI مربوط به
    Codex)** به جست‌وجوی معنایی حافظه کمکی نمی‌کند. تعبیه‌های OpenAI
    همچنان به یک کلید API واقعی نیاز دارند (`OPENAI_API_KEY` یا `models.providers.openai.apiKey`).

    اگر ارائه‌دهنده‌ای را صریح تنظیم نکنید، OpenClaw زمانی که بتواند
    یک کلید API را resolve کند (پروفایل‌های احراز هویت، `models.providers.*.apiKey`، یا متغیرهای محیطی)، به‌صورت خودکار ارائه‌دهنده‌ای را انتخاب می‌کند.
    اگر کلید OpenAI resolve شود، OpenAI را ترجیح می‌دهد، در غیر این صورت اگر کلید Gemini
    resolve شود Gemini را انتخاب می‌کند، سپس Voyage، سپس Mistral. اگر هیچ کلید راه‌دوری در دسترس نباشد، جست‌وجوی
    حافظه تا زمانی که آن را پیکربندی کنید غیرفعال می‌ماند. اگر مسیر مدل محلی
    پیکربندی و حاضر باشد، OpenClaw
    `local` را ترجیح می‌دهد. Ollama زمانی پشتیبانی می‌شود که صریحاً
    `memorySearch.provider = "ollama"` را تنظیم کنید.

    اگر ترجیح می‌دهید محلی بمانید، `memorySearch.provider = "local"` را تنظیم کنید (و در صورت نیاز
    `memorySearch.fallback = "none"`). اگر تعبیه‌های Gemini را می‌خواهید،
    `memorySearch.provider = "gemini"` را تنظیم کنید و `GEMINI_API_KEY` (یا
    `memorySearch.remote.apiKey`) را ارائه دهید. ما از مدل‌های تعبیه‌سازی **OpenAI، Gemini، Voyage، Mistral، Ollama، یا local** پشتیبانی می‌کنیم
    - برای جزئیات راه‌اندازی، [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>
</AccordionGroup>

## محل قرارگیری چیزها روی دیسک

<AccordionGroup>
  <Accordion title="آیا همه داده‌های استفاده‌شده با OpenClaw به‌صورت محلی ذخیره می‌شوند؟">
    خیر - **وضعیت OpenClaw محلی است**، اما **سرویس‌های خارجی همچنان آنچه را برایشان ارسال می‌کنید می‌بینند**.

    - **به‌صورت پیش‌فرض محلی:** نشست‌ها، فایل‌های حافظه، پیکربندی، و workspace روی میزبان Gateway قرار دارند
      (`~/.openclaw` + دایرکتوری workspace شما).
    - **به ضرورت راه‌دور:** پیام‌هایی که برای ارائه‌دهندگان مدل (Anthropic/OpenAI/و غیره) می‌فرستید به
      APIهای آن‌ها می‌روند، و پلتفرم‌های چت (WhatsApp/Telegram/Slack/و غیره) داده‌های پیام را روی
      سرورهای خود ذخیره می‌کنند.
    - **شما ردپا را کنترل می‌کنید:** استفاده از مدل‌های محلی promptها را روی دستگاه شما نگه می‌دارد، اما ترافیک کانال
      همچنان از سرورهای همان کانال عبور می‌کند.

    مرتبط: [workspace عامل](/fa/concepts/agent-workspace)، [حافظه](/fa/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw داده‌های خود را کجا ذخیره می‌کند؟">
    همه‌چیز زیر `$OPENCLAW_STATE_DIR` قرار می‌گیرد (پیش‌فرض: `~/.openclaw`):

    | مسیر                                                            | هدف                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | پیکربندی اصلی (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | واردکردن OAuth قدیمی (در نخستین استفاده در پروفایل‌های احراز هویت کپی می‌شود)       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | پروفایل‌های احراز هویت (OAuth، کلیدهای API، و `keyRef`/`tokenRef` اختیاری)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | payload اختیاری راز با پشتوانه فایل برای ارائه‌دهندگان SecretRef از نوع `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | فایل سازگاری قدیمی (ورودی‌های ایستای `api_key` پاک‌سازی شده‌اند)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | وضعیت ارائه‌دهنده (مثلاً `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | وضعیت هر عامل (agentDir + نشست‌ها)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | تاریخچه و وضعیت گفت‌وگو (برای هر عامل)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | فراداده نشست (برای هر عامل)                                       |

    مسیر قدیمی تک‌عاملی: `~/.openclaw/agent/*` (با `openclaw doctor` مهاجرت داده می‌شود).

    **workspace** شما (AGENTS.md، فایل‌های حافظه، Skills، و غیره) جداست و از طریق `agents.defaults.workspace` پیکربندی می‌شود (پیش‌فرض: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md باید کجا قرار بگیرند؟">
    این فایل‌ها در **workspace عامل** قرار می‌گیرند، نه در `~/.openclaw`.

    - **Workspace (برای هر عامل)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` اختیاری.
      ریشه حروف کوچک `memory.md` فقط ورودی تعمیر قدیمی است؛ `openclaw doctor --fix`
      می‌تواند وقتی هر دو فایل وجود دارند آن را در `MEMORY.md` ادغام کند.
    - **دایرکتوری وضعیت (`~/.openclaw`)**: پیکربندی، وضعیت کانال/ارائه‌دهنده، پروفایل‌های احراز هویت، نشست‌ها، گزارش‌ها،
      و Skills مشترک (`~/.openclaw/skills`).

    workspace پیش‌فرض `~/.openclaw/workspace` است و از این طریق قابل پیکربندی است:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    اگر bot پس از restart «فراموش می‌کند»، تأیید کنید Gateway در هر اجرا از همان
    workspace استفاده می‌کند (و به یاد داشته باشید: حالت راه‌دور از workspace **میزبان gateway**
    استفاده می‌کند، نه لپ‌تاپ محلی شما).

    نکته: اگر رفتار یا ترجیحی پایدار می‌خواهید، از bot بخواهید **آن را در
    AGENTS.md یا MEMORY.md بنویسد** به‌جای اینکه به تاریخچه چت تکیه کنید.

    [workspace عامل](/fa/concepts/agent-workspace) و [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>

  <Accordion title="راهبرد پیشنهادی پشتیبان‌گیری">
    **workspace عامل** خود را در یک مخزن git **خصوصی** قرار دهید و آن را جایی
    خصوصی پشتیبان‌گیری کنید (برای مثال GitHub خصوصی). این کار حافظه + فایل‌های AGENTS/SOUL/USER
    را ثبت می‌کند و به شما اجازه می‌دهد بعداً «ذهن» دستیار را بازیابی کنید.

    هیچ‌چیز زیر `~/.openclaw` را commit نکنید (اعتبارنامه‌ها، نشست‌ها، توکن‌ها، یا payloadهای راز رمزگذاری‌شده).
    اگر به بازیابی کامل نیاز دارید، هم workspace و هم دایرکتوری وضعیت را
    جداگانه پشتیبان‌گیری کنید (پرسش مهاجرت بالا را ببینید).

    مستندات: [workspace عامل](/fa/concepts/agent-workspace).

  </Accordion>

  <Accordion title="چگونه OpenClaw را به‌طور کامل حذف نصب کنم؟">
    راهنمای اختصاصی را ببینید: [حذف نصب](/fa/install/uninstall).
  </Accordion>

  <Accordion title="آیا عامل‌ها می‌توانند بیرون از workspace کار کنند؟">
    بله. workspace **cwd پیش‌فرض** و تکیه‌گاه حافظه است، نه یک sandbox سخت‌گیرانه.
    مسیرهای نسبی داخل workspace resolve می‌شوند، اما مسیرهای مطلق می‌توانند به
    مکان‌های دیگر میزبان دسترسی داشته باشند مگر اینکه sandboxing فعال باشد. اگر به جداسازی نیاز دارید، از
    [`agents.defaults.sandbox`](/fa/gateway/sandboxing) یا تنظیمات sandbox هر عامل استفاده کنید. اگر
    می‌خواهید یک repo دایرکتوری کاری پیش‌فرض باشد، `workspace` آن عامل را
    به ریشه repo اشاره دهید. repo مربوط به OpenClaw فقط کد منبع است؛
    workspace را جدا نگه دارید مگر اینکه عمداً بخواهید عامل داخل آن کار کند.

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

  <Accordion title="حالت راه‌دور: محل ذخیره نشست کجاست؟">
    وضعیت نشست در مالکیت **میزبان gateway** است. اگر در حالت راه‌دور هستید، ذخیره‌گاه نشستی که برایتان مهم است روی دستگاه راه‌دور است، نه لپ‌تاپ محلی شما. [مدیریت نشست](/fa/concepts/session) را ببینید.
  </Accordion>
</AccordionGroup>

## مبانی پیکربندی

<AccordionGroup>
  <Accordion title="فرمت پیکربندی چیست؟ کجاست؟">
    OpenClaw یک پیکربندی اختیاری **JSON5** را از `$OPENCLAW_CONFIG_PATH` می‌خواند (پیش‌فرض: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    اگر فایل وجود نداشته باشد، از پیش‌فرض‌های نسبتاً ایمن استفاده می‌کند (از جمله workspace پیش‌فرض `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='من gateway.bind: "lan" (یا "tailnet") را تنظیم کردم و حالا هیچ‌چیز listen نمی‌کند / UI می‌گوید unauthorized'>
    bindهای غیر-loopback **به یک مسیر معتبر احراز هویت gateway نیاز دارند**. در عمل یعنی:

    - احراز هویت راز مشترک: توکن یا رمز عبور
    - `gateway.auth.mode: "trusted-proxy"` پشت یک reverse proxy هویت‌آگاه که درست پیکربندی شده است

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

    - `gateway.remote.token` / `.password` به‌تنهایی احراز هویت gateway محلی را فعال **نمی‌کنند**.
    - مسیرهای فراخوانی محلی فقط زمانی می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند که `gateway.auth.*` تنظیم نشده باشد.
    - برای احراز هویت با رمز عبور، به‌جای آن `gateway.auth.mode: "password"` را همراه با `gateway.auth.password` (یا `OPENCLAW_GATEWAY_PASSWORD`) تنظیم کنید.
    - اگر `gateway.auth.token` / `gateway.auth.password` صریحاً از طریق SecretRef پیکربندی شده و resolve نشده باشد، resolution به‌صورت بسته شکست می‌خورد (بدون پوشاندن با fallback راه‌دور).
    - راه‌اندازی‌های Control UI با راز مشترک از طریق `connect.params.auth.token` یا `connect.params.auth.password` احراز هویت می‌شوند (در تنظیمات app/UI ذخیره می‌شود). حالت‌های دارای هویت مانند Tailscale Serve یا `trusted-proxy` به‌جای آن از headerهای درخواست استفاده می‌کنند. از قرار دادن رازهای مشترک در URLها خودداری کنید.
    - با `gateway.auth.mode: "trusted-proxy"`، reverse proxyهای loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح و یک ورودی loopback در `gateway.trustedProxies` نیاز دارند.

  </Accordion>

  <Accordion title="چرا حالا روی localhost به توکن نیاز دارم؟">
    OpenClaw احراز هویت gateway را به‌صورت پیش‌فرض enforce می‌کند، از جمله loopback. در مسیر پیش‌فرض معمولی یعنی احراز هویت با توکن: اگر هیچ مسیر احراز هویت صریحی پیکربندی نشده باشد، راه‌اندازی gateway به حالت توکن resolve می‌شود و برای همان راه‌اندازی یک توکن فقط-زمان‌اجرا تولید می‌کند، بنابراین **clientهای WS محلی باید احراز هویت شوند**. وقتی clientها به یک راز پایدار بین restartها نیاز دارند، `gateway.auth.token`، `gateway.auth.password`، `OPENCLAW_GATEWAY_TOKEN`، یا `OPENCLAW_GATEWAY_PASSWORD` را صریحاً پیکربندی کنید. این کار مانع می‌شود فرایندهای محلی دیگر Gateway را فراخوانی کنند.

    اگر مسیر احراز هویت متفاوتی را ترجیح می‌دهید، می‌توانید صریحاً حالت رمز عبور را انتخاب کنید (یا برای reverse proxyهای هویت‌آگاه، `trusted-proxy`). اگر **واقعاً** loopback باز می‌خواهید، `gateway.auth.mode: "none"` را صریحاً در پیکربندی خود تنظیم کنید. Doctor هر زمان می‌تواند برای شما توکن تولید کند: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="آیا پس از تغییر پیکربندی باید restart کنم؟">
    Gateway پیکربندی را watch می‌کند و از hot-reload پشتیبانی می‌کند:

    - `gateway.reload.mode: "hybrid"` (پیش‌فرض): تغییرات ایمن را hot-apply می‌کند، برای تغییرات بحرانی restart می‌کند
    - `hot`، `restart`، `off` نیز پشتیبانی می‌شوند

  </Accordion>

  <Accordion title="چگونه taglineهای بامزه CLI را غیرفعال کنم؟">
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
    - اگر اصلاً banner نمی‌خواهید، env `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

  </Accordion>

  <Accordion title="چگونه جست‌وجوی وب (و fetch وب) را فعال کنم؟">
    `web_fetch` بدون کلید API کار می‌کند. `web_search` به ارائه‌دهنده انتخابی شما
    بستگی دارد:

    - ارائه‌دهندگان مبتنی بر API مانند Brave، Exa، Firecrawl، Gemini، Grok، Kimi، MiniMax Search، Perplexity، و Tavily به راه‌اندازی معمول کلید API خود نیاز دارند.
    - Ollama Web Search بدون کلید است، اما از میزبان Ollama پیکربندی‌شده شما استفاده می‌کند و به `ollama signin` نیاز دارد.
    - DuckDuckGo بدون کلید است، اما یک یکپارچه‌سازی غیررسمی مبتنی بر HTML است.
    - SearXNG بدون کلید/خودمیزبان است؛ `SEARXNG_BASE_URL` یا `plugins.entries.searxng.config.webSearch.baseUrl` را پیکربندی کنید.

    **پیشنهاد:** `openclaw configure --section web` را اجرا کنید و یک ارائه‌دهنده انتخاب کنید.
    گزینه‌های جایگزین محیطی:

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
    مسیرهای قدیمی ارائه‌دهنده در `tools.web.search.*` همچنان موقتاً برای سازگاری بارگذاری می‌شوند، اما نباید برای پیکربندی‌های جدید استفاده شوند.
    پیکربندی جایگزین واکشی وب Firecrawl زیر `plugins.entries.firecrawl.config.webFetch.*` قرار دارد.

    نکته‌ها:

    - اگر از فهرست‌های مجاز استفاده می‌کنید، `web_search`/`web_fetch`/`x_search` یا `group:web` را اضافه کنید.
    - `web_fetch` به‌طور پیش‌فرض فعال است (مگر اینکه صراحتاً غیرفعال شده باشد).
    - اگر `tools.web.fetch.provider` حذف شود، OpenClaw نخستین ارائه‌دهنده جایگزینِ آماده برای واکشی را از میان اعتبارنامه‌های موجود به‌طور خودکار تشخیص می‌دهد. امروز ارائه‌دهنده همراه، Firecrawl است.
    - daemonها متغیرهای محیطی را از `~/.openclaw/.env` (یا محیط سرویس) می‌خوانند.

    مستندات: [ابزارهای وب](/fa/tools/web).

  </Accordion>

  <Accordion title="config.apply پیکربندی من را پاک کرد. چگونه بازیابی کنم و از تکرار آن جلوگیری کنم؟">
    `config.apply` **کل پیکربندی** را جایگزین می‌کند. اگر یک شیء ناقص بفرستید، همه چیز
    دیگر حذف می‌شود.

    OpenClaw فعلی از بسیاری از بازنویسی‌های تصادفی جلوگیری می‌کند:

    - نوشتن‌های پیکربندیِ متعلق به OpenClaw، کل پیکربندی پس از تغییر را پیش از نوشتن اعتبارسنجی می‌کنند.
    - نوشتن‌های نامعتبر یا مخربِ متعلق به OpenClaw رد می‌شوند و به‌صورت `openclaw.json.rejected.*` ذخیره می‌شوند.
    - اگر یک ویرایش مستقیم باعث خرابی راه‌اندازی یا بازبارگذاری داغ شود، Gateway در حالت بسته شکست می‌خورد یا بازبارگذاری را رد می‌کند؛ `openclaw.json` را بازنویسی نمی‌کند.
    - `openclaw doctor --fix` مالک تعمیر است و می‌تواند آخرین نسخه سالم شناخته‌شده را بازیابی کند، در حالی که فایل ردشده را به‌صورت `openclaw.json.clobbered.*` ذخیره می‌کند.

    بازیابی:

    - در `openclaw logs --follow` به‌دنبال `Invalid config at`، `Config write rejected:`، یا `config reload skipped (invalid config)` بگردید.
    - جدیدترین `openclaw.json.clobbered.*` یا `openclaw.json.rejected.*` کنار پیکربندی فعال را بررسی کنید.
    - `openclaw config validate` و `openclaw doctor --fix` را اجرا کنید.
    - فقط کلیدهای موردنظر را با `openclaw config set` یا `config.patch` برگردانید.
    - اگر آخرین نسخه سالم شناخته‌شده یا payload ردشده ندارید، از پشتیبان بازیابی کنید، یا دوباره `openclaw doctor` را اجرا کنید و کانال‌ها/مدل‌ها را دوباره پیکربندی کنید.
    - اگر این اتفاق غیرمنتظره بود، یک باگ ثبت کنید و آخرین پیکربندی شناخته‌شده یا هر پشتیبان موجود را پیوست کنید.
    - یک عامل کدنویسی محلی اغلب می‌تواند از روی لاگ‌ها یا تاریخچه، یک پیکربندی کارا بازسازی کند.

    پیشگیری:

    - برای تغییرات کوچک از `openclaw config set` استفاده کنید.
    - برای ویرایش‌های تعاملی از `openclaw configure` استفاده کنید.
    - وقتی از مسیر دقیق یا شکل فیلد مطمئن نیستید، ابتدا از `config.schema.lookup` استفاده کنید؛ این دستور یک گره سطحی schema به‌همراه خلاصه‌های فرزندهای مستقیم برای پایین رفتن در ساختار برمی‌گرداند.
    - برای ویرایش‌های جزئی RPC از `config.patch` استفاده کنید؛ `config.apply` را فقط برای جایگزینی کامل پیکربندی نگه دارید.
    - اگر از ابزار مالک‌محور `gateway` در اجرای یک عامل استفاده می‌کنید، همچنان نوشتن در `tools.exec.ask` / `tools.exec.security` (از جمله نام‌های مستعار قدیمی `tools.bash.*` که به همان مسیرهای محافظت‌شده exec نرمال‌سازی می‌شوند) را رد می‌کند.

    مستندات: [پیکربندی](/fa/cli/config)، [پیکربندی تعاملی](/fa/cli/configure)، [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-rejected-invalid-config)، [Doctor](/fa/gateway/doctor).

  </Accordion>

  <Accordion title="چگونه یک Gateway مرکزی با workerهای تخصصی در چند دستگاه اجرا کنم؟">
    الگوی رایج **یک Gateway** (مثلاً Raspberry Pi) به‌همراه **Nodeها** و **عامل‌ها** است:

    - **Gateway (مرکزی):** مالک کانال‌ها (Signal/WhatsApp)، مسیریابی، و sessionها است.
    - **Nodeها (دستگاه‌ها):** Macها/iOS/Android به‌عنوان لوازم جانبی متصل می‌شوند و ابزارهای محلی (`system.run`، `canvas`، `camera`) را در دسترس می‌گذارند.
    - **عامل‌ها (workerها):** مغزها/فضاهای کاری جداگانه برای نقش‌های ویژه (مثلاً "عملیات Hetzner"، "داده‌های شخصی").
    - **زیرعامل‌ها:** وقتی موازی‌سازی می‌خواهید، کار پس‌زمینه را از یک عامل اصلی ایجاد می‌کنند.
    - **TUI:** به Gateway متصل شوید و بین عامل‌ها/sessionها جابه‌جا شوید.

    مستندات: [Nodeها](/fa/nodes)، [دسترسی راه‌دور](/fa/gateway/remote)، [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [زیرعامل‌ها](/fa/tools/subagents)، [TUI](/fa/web/tui).

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

    مقدار پیش‌فرض `false` (با پنجره) است. حالت headless در برخی سایت‌ها احتمال بیشتری دارد که بررسی‌های ضدبات را فعال کند. [مرورگر](/fa/tools/browser) را ببینید.

    حالت headless از **همان موتور Chromium** استفاده می‌کند و برای بیشتر خودکارسازی‌ها (فرم‌ها، کلیک‌ها، scraping، ورودها) کار می‌کند. تفاوت‌های اصلی:

    - پنجره مرورگر قابل‌مشاهده نیست (اگر به تصویر نیاز دارید از اسکرین‌شات استفاده کنید).
    - برخی سایت‌ها در حالت headless درباره خودکارسازی سخت‌گیرتر هستند (CAPTCHAها، ضدبات).
      برای مثال، X/Twitter اغلب sessionهای headless را مسدود می‌کند.

  </Accordion>

  <Accordion title="چگونه از Brave برای کنترل مرورگر استفاده کنم؟">
    `browser.executablePath` را روی باینری Brave خود (یا هر مرورگر مبتنی بر Chromium) تنظیم کنید و Gateway را دوباره راه‌اندازی کنید.
    نمونه‌های کامل پیکربندی را در [مرورگر](/fa/tools/browser#use-brave-or-another-chromium-based-browser) ببینید.
  </Accordion>
</AccordionGroup>

## Gatewayها و Nodeهای راه‌دور

<AccordionGroup>
  <Accordion title="دستورها چگونه بین Telegram، Gateway، و Nodeها منتشر می‌شوند؟">
    پیام‌های Telegram توسط **Gateway** مدیریت می‌شوند. Gateway عامل را اجرا می‌کند و
    فقط وقتی به ابزار Node نیاز باشد، از طریق **Gateway WebSocket** با Nodeها تماس می‌گیرد:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodeها ترافیک ورودی ارائه‌دهنده را نمی‌بینند؛ آن‌ها فقط فراخوانی‌های RPC مربوط به Node را دریافت می‌کنند.

  </Accordion>

  <Accordion title="اگر Gateway راه‌دور میزبانی شده باشد، عامل من چگونه می‌تواند به رایانه من دسترسی داشته باشد؟">
    پاسخ کوتاه: **رایانه خود را به‌عنوان یک Node جفت کنید**. Gateway در جای دیگری اجرا می‌شود، اما می‌تواند
    ابزارهای `node.*` (صفحه‌نمایش، دوربین، سیستم) را از طریق Gateway WebSocket روی ماشین محلی شما فراخوانی کند.

    راه‌اندازی معمول:

    1. Gateway را روی میزبان همیشه روشن (VPS/سرور خانگی) اجرا کنید.
    2. میزبان Gateway و رایانه خود را در یک tailnet مشترک قرار دهید.
    3. مطمئن شوید Gateway WS در دسترس است (bind روی tailnet یا تونل SSH).
    4. برنامه macOS را به‌صورت محلی باز کنید و در حالت **راه‌دور از طریق SSH** (یا tailnet مستقیم) متصل شوید
       تا بتواند به‌عنوان Node ثبت شود.
    5. Node را روی Gateway تأیید کنید:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    هیچ پل TCP جداگانه‌ای لازم نیست؛ Nodeها از طریق Gateway WebSocket متصل می‌شوند.

    یادآوری امنیتی: جفت‌کردن یک Node macOS امکان اجرای `system.run` روی آن ماشین را می‌دهد. فقط
    دستگاه‌هایی را جفت کنید که به آن‌ها اعتماد دارید، و [امنیت](/fa/gateway/security) را مرور کنید.

    مستندات: [Nodeها](/fa/nodes)، [پروتکل Gateway](/fa/gateway/protocol)، [حالت راه‌دور macOS](/fa/platforms/mac/remote)، [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="Tailscale متصل است اما پاسخی دریافت نمی‌کنم. حالا چه کنم؟">
    موارد پایه را بررسی کنید:

    - Gateway در حال اجرا است: `openclaw gateway status`
    - سلامت Gateway: `openclaw status`
    - سلامت کانال: `openclaw channels status`

    سپس احراز هویت و مسیریابی را بررسی کنید:

    - اگر از Tailscale Serve استفاده می‌کنید، مطمئن شوید `gateway.auth.allowTailscale` درست تنظیم شده است.
    - اگر از طریق تونل SSH متصل می‌شوید، تأیید کنید تونل محلی فعال است و به پورت درست اشاره می‌کند.
    - تأیید کنید فهرست‌های مجاز شما (DM یا گروه) حساب شما را شامل می‌شوند.

    مستندات: [Tailscale](/fa/gateway/tailscale)، [دسترسی راه‌دور](/fa/gateway/remote)، [کانال‌ها](/fa/channels).

  </Accordion>

  <Accordion title="آیا دو نمونه OpenClaw می‌توانند با هم صحبت کنند (محلی + VPS)؟">
    بله. پل داخلی «ربات به ربات» وجود ندارد، اما می‌توانید آن را با چند روش
    قابل‌اعتماد راه‌اندازی کنید:

    **ساده‌ترین:** از یک کانال گفت‌وگوی عادی استفاده کنید که هر دو ربات به آن دسترسی دارند (Telegram/Slack/WhatsApp).
    از Bot A بخواهید پیامی به Bot B بفرستد، سپس بگذارید Bot B طبق معمول پاسخ دهد.

    **پل CLI (عمومی):** اسکریپتی اجرا کنید که Gateway دیگر را با
    `openclaw agent --message ... --deliver` فراخوانی کند و یک گفت‌وگو را هدف بگیرد که ربات دیگر
    در آن گوش می‌دهد. اگر یک ربات روی VPS راه‌دور است، CLI خود را از طریق SSH/Tailscale به آن Gateway راه‌دور
    اشاره دهید ([دسترسی راه‌دور](/fa/gateway/remote) را ببینید).

    الگوی نمونه (از ماشینی اجرا کنید که می‌تواند به Gateway هدف برسد):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نکته: یک guardrail اضافه کنید تا دو ربات بی‌پایان وارد حلقه نشوند (فقط با mention، فهرست‌های مجاز کانال،
    یا قانون «به پیام‌های ربات پاسخ نده»).

    مستندات: [دسترسی راه‌دور](/fa/gateway/remote)، [CLI عامل](/fa/cli/agent)، [ارسال عامل](/fa/tools/agent-send).

  </Accordion>

  <Accordion title="آیا برای چند عامل به VPSهای جداگانه نیاز دارم؟">
    خیر. یک Gateway می‌تواند چند عامل را میزبانی کند، که هرکدام فضای کاری، پیش‌فرض‌های مدل،
    و مسیریابی خود را دارند. این راه‌اندازی عادی است و از اجرای یک VPS برای هر عامل بسیار ارزان‌تر و ساده‌تر است.

    فقط وقتی از VPSهای جداگانه استفاده کنید که به جداسازی سخت (مرزهای امنیتی) یا پیکربندی‌های بسیار
    متفاوتی نیاز دارید که نمی‌خواهید مشترک باشند. در غیر این صورت، یک Gateway نگه دارید و
    از چند عامل یا زیرعامل استفاده کنید.

  </Accordion>

  <Accordion title="آیا استفاده از Node روی لپ‌تاپ شخصی من به‌جای SSH از یک VPS مزیتی دارد؟">
    بله - Nodeها روش درجه‌یک برای دسترسی به لپ‌تاپ شما از یک Gateway راه‌دور هستند، و
    چیزی بیش از دسترسی shell فراهم می‌کنند. Gateway روی macOS/Linux (Windows از طریق WSL2) اجرا می‌شود و
    سبک است (یک VPS کوچک یا جعبه‌ای در کلاس Raspberry Pi کافی است؛ ۴ GB RAM کاملاً کافی است)، بنابراین یک
    راه‌اندازی رایج شامل یک میزبان همیشه روشن به‌همراه لپ‌تاپ شما به‌عنوان Node است.

    - **به SSH ورودی نیازی نیست.** Nodeها به Gateway WebSocket اتصال خروجی برقرار می‌کنند و از جفت‌سازی دستگاه استفاده می‌کنند.
    - **کنترل‌های اجرای امن‌تر.** `system.run` با فهرست‌های مجاز/تأییدهای Node روی همان لپ‌تاپ کنترل می‌شود.
    - **ابزارهای دستگاه بیشتر.** Nodeها علاوه بر `system.run`، `canvas`، `camera`، و `screen` را در دسترس می‌گذارند.
    - **خودکارسازی مرورگر محلی.** Gateway را روی یک VPS نگه دارید، اما Chrome را به‌صورت محلی از طریق میزبان Node روی لپ‌تاپ اجرا کنید، یا از طریق Chrome MCP به Chrome محلی روی میزبان متصل شوید.

    SSH برای دسترسی shell موردی مناسب است، اما Nodeها برای جریان‌های کاری مداوم عامل و
    خودکارسازی دستگاه ساده‌ترند.

    مستندات: [Nodeها](/fa/nodes)، [CLI Nodeها](/fa/cli/nodes)، [مرورگر](/fa/tools/browser).

  </Accordion>

  <Accordion title="آیا Nodeها سرویس Gateway اجرا می‌کنند؟">
    خیر. در هر میزبان فقط **یک gateway** باید اجرا شود، مگر اینکه عمداً پروفایل‌های جداشده اجرا کنید ([چند Gateway](/fa/gateway/multiple-gateways) را ببینید). Nodeها لوازم جانبی‌ای هستند که
    به gateway متصل می‌شوند (Nodeهای iOS/Android، یا «حالت Node» macOS در برنامه menubar). برای میزبان‌های Node
    بدون رابط گرافیکی و کنترل CLI، [CLI میزبان Node](/fa/cli/node) را ببینید.

    برای تغییرات `gateway`، `discovery`، و سطح Plugin میزبانی‌شده، راه‌اندازی مجدد کامل لازم است.

  </Accordion>

  <Accordion title="آیا راه API / RPC برای اعمال پیکربندی وجود دارد؟">
    بله.

    - `config.schema.lookup`: پیش از نوشتن، یک زیردرخت پیکربندی را همراه با گره schema کم‌عمق آن، راهنمای UI منطبق، و خلاصه‌های فرزند بلافصل بررسی کنید
    - `config.get`: دریافت snapshot + hash فعلی
    - `config.patch`: به‌روزرسانی جزئی ایمن (برای بیشتر ویرایش‌های RPC ترجیح دارد)؛ هرجا ممکن باشد hot-reload می‌کند و هرجا لازم باشد restart می‌کند
    - `config.apply`: اعتبارسنجی + جایگزینی کل پیکربندی؛ هرجا ممکن باشد hot-reload می‌کند و هرجا لازم باشد restart می‌کند
    - ابزار runtime مالک‌محور `gateway` همچنان از بازنویسی `tools.exec.ask` / `tools.exec.security` سر باز می‌زند؛ aliasهای قدیمی `tools.bash.*` به همان مسیرهای exec محافظت‌شده نرمال‌سازی می‌شوند

  </Accordion>

  <Accordion title="پیکربندی حداقلی سالم برای نصب اول">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    این workspace شما را تنظیم می‌کند و محدود می‌کند چه کسی می‌تواند bot را فعال کند.

  </Accordion>

  <Accordion title="چطور Tailscale را روی VPS راه‌اندازی کنم و از Mac خودم وصل شوم؟">
    مراحل حداقلی:

    1. **نصب + ورود روی VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **نصب + ورود روی Mac شما**
       - از برنامه Tailscale استفاده کنید و وارد همان tailnet شوید.
    3. **فعال‌سازی MagicDNS (توصیه‌شده)**
       - در کنسول مدیریتی Tailscale، MagicDNS را فعال کنید تا VPS یک نام پایدار داشته باشد.
    4. **استفاده از hostname مربوط به tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    اگر Control UI را بدون SSH می‌خواهید، از Tailscale Serve روی VPS استفاده کنید:

    ```bash
    openclaw gateway --tailscale serve
    ```

    این کار gateway را به loopback متصل نگه می‌دارد و HTTPS را از طریق Tailscale در دسترس قرار می‌دهد. [Tailscale](/fa/gateway/tailscale) را ببینید.

  </Accordion>

  <Accordion title="چطور یک node روی Mac را به یک Gateway راه‌دور وصل کنم (Tailscale Serve)؟">
    Serve، **Gateway Control UI + WS** را در دسترس قرار می‌دهد. Nodeها از طریق همان endpoint مربوط به Gateway WS وصل می‌شوند.

    راه‌اندازی پیشنهادی:

    1. **مطمئن شوید VPS + Mac روی همان tailnet هستند**.
    2. **از برنامه macOS در حالت Remote استفاده کنید** (هدف SSH می‌تواند hostname مربوط به tailnet باشد).
       برنامه پورت Gateway را tunnel می‌کند و به‌عنوان node وصل می‌شود.
    3. **node را روی gateway تأیید کنید**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    مستندات: [پروتکل Gateway](/fa/gateway/protocol)، [کشف](/fa/gateway/discovery)، [حالت راه‌دور macOS](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="آیا باید روی لپ‌تاپ دوم نصب کنم یا فقط یک node اضافه کنم؟">
    اگر فقط به **ابزارهای محلی** (screen/camera/exec) روی لپ‌تاپ دوم نیاز دارید، آن را به‌عنوان
    **node** اضافه کنید. این کار یک Gateway واحد را حفظ می‌کند و از پیکربندی تکراری جلوگیری می‌کند. ابزارهای node محلی
    فعلاً فقط macOS هستند، اما قصد داریم آن‌ها را به سیستم‌عامل‌های دیگر هم گسترش دهیم.

    فقط زمانی Gateway دوم نصب کنید که به **جداسازی سخت** یا دو bot کاملاً جدا نیاز دارید.

    مستندات: [Nodeها](/fa/nodes)، [CLI مربوط به Nodeها](/fa/cli/nodes)، [چند Gateway](/fa/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars و بارگذاری .env

<AccordionGroup>
  <Accordion title="OpenClaw چطور متغیرهای محیطی را بارگذاری می‌کند؟">
    OpenClaw متغیرهای محیطی را از پردازه والد (shell، launchd/systemd، CI و غیره) می‌خواند و علاوه بر آن موارد زیر را بارگذاری می‌کند:

    - `.env` از دایرکتوری کاری فعلی
    - یک fallback سراسری `.env` از `~/.openclaw/.env` (یا همان `$OPENCLAW_STATE_DIR/.env`)

    هیچ‌کدام از فایل‌های `.env` متغیرهای محیطی موجود را override نمی‌کنند.

    همچنین می‌توانید متغیرهای محیطی inline را در پیکربندی تعریف کنید (فقط اگر در env پردازه موجود نباشند اعمال می‌شود):

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

  <Accordion title="Gateway را از طریق service شروع کردم و متغیرهای محیطی من ناپدید شدند. حالا چه کنم؟">
    دو راه‌حل رایج:

    1. کلیدهای گم‌شده را در `~/.openclaw/.env` بگذارید تا حتی وقتی service متغیرهای محیطی shell شما را inherit نمی‌کند هم برداشته شوند.
    2. import کردن shell را فعال کنید (سهولت opt-in):

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

    این login shell شما را اجرا می‌کند و فقط کلیدهای مورد انتظارِ گم‌شده را import می‌کند (هرگز override نمی‌کند). معادل‌های متغیر محیطی:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='من COPILOT_GITHUB_TOKEN را تنظیم کردم، اما وضعیت مدل‌ها "Shell env: off." نشان می‌دهد. چرا؟'>
    `openclaw models status` گزارش می‌دهد که آیا **shell env import** فعال است یا نه. "Shell env: off"
    به این معنا **نیست** که متغیرهای محیطی شما گم شده‌اند - فقط یعنی OpenClaw به‌طور خودکار
    login shell شما را بارگذاری نمی‌کند.

    اگر Gateway به‌عنوان service اجرا شود (launchd/systemd)، محیط shell شما را inherit
    نمی‌کند. با یکی از این کارها درستش کنید:

    1. token را در `~/.openclaw/.env` بگذارید:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. یا shell import را فعال کنید (`env.shellEnv.enabled: true`).
    3. یا آن را به بلوک `env` در پیکربندی خود اضافه کنید (فقط اگر موجود نباشد اعمال می‌شود).

    سپس gateway را restart کنید و دوباره بررسی کنید:

    ```bash
    openclaw models status
    ```

    tokenهای Copilot از `COPILOT_GITHUB_TOKEN` خوانده می‌شوند (همچنین `GH_TOKEN` / `GITHUB_TOKEN`).
    [/concepts/model-providers](/fa/concepts/model-providers) و [/environment](/fa/help/environment) را ببینید.

  </Accordion>
</AccordionGroup>

## جلسه‌ها و چند chat

<AccordionGroup>
  <Accordion title="چطور یک گفت‌وگوی تازه شروع کنم؟">
    `/new` یا `/reset` را به‌عنوان یک پیام مستقل ارسال کنید. [مدیریت session](/fa/concepts/session) را ببینید.
  </Accordion>

  <Accordion title="اگر هرگز /new نفرستم، sessionها خودکار reset می‌شوند؟">
    Sessionها می‌توانند پس از `session.idleMinutes` منقضی شوند، اما این به‌صورت **پیش‌فرض غیرفعال** است (پیش‌فرض **0**).
    برای فعال کردن انقضای بیکاری، آن را روی مقدار مثبت تنظیم کنید. وقتی فعال باشد، **پیام بعدی**
    پس از دوره بیکاری یک شناسه session تازه برای آن کلید chat شروع می‌کند.
    این transcriptها را حذف نمی‌کند - فقط یک session جدید شروع می‌کند.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="آیا راهی هست یک تیم از instanceهای OpenClaw بسازم (یک CEO و تعداد زیادی agent)؟">
    بله، از طریق **multi-agent routing** و **sub-agents**. می‌توانید یک agent هماهنگ‌کننده
    و چند agent کاری با workspaceها و مدل‌های خودشان بسازید.

    بااین‌حال، بهتر است این را یک **آزمایش سرگرم‌کننده** در نظر بگیرید. مصرف token بالایی دارد و اغلب
    از استفاده از یک bot با sessionهای جداگانه کم‌بازده‌تر است. مدل معمولی که
    در نظر داریم یک bot است که با آن صحبت می‌کنید، با sessionهای مختلف برای کارهای موازی. همان
    bot همچنین می‌تواند در صورت نیاز sub-agentها را spawn کند.

    مستندات: [Multi-agent routing](/fa/concepts/multi-agent)، [Sub-agents](/fa/tools/subagents)، [CLI مربوط به Agentها](/fa/cli/agents).

  </Accordion>

  <Accordion title="چرا context وسط کار truncate شد؟ چطور از آن جلوگیری کنم؟">
    Context هر session به پنجره مدل محدود است. chatهای طولانی، خروجی‌های بزرگ ابزارها، یا فایل‌های زیاد
    می‌توانند باعث Compaction یا truncation شوند.

    موارد کمک‌کننده:

    - از bot بخواهید وضعیت فعلی را خلاصه کند و در یک فایل بنویسد.
    - قبل از کارهای طولانی از `/compact` استفاده کنید، و هنگام تغییر موضوع از `/new`.
    - context مهم را در workspace نگه دارید و از bot بخواهید آن را دوباره بخواند.
    - برای کارهای طولانی یا موازی از sub-agentها استفاده کنید تا chat اصلی کوچک‌تر بماند.
    - اگر این اتفاق زیاد می‌افتد، مدلی با پنجره context بزرگ‌تر انتخاب کنید.

  </Accordion>

  <Accordion title="چطور OpenClaw را کاملاً reset کنم اما نصب‌شده نگه دارم؟">
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

    - اگر onboarding یک پیکربندی موجود ببیند، **Reset** را هم پیشنهاد می‌کند. [Onboarding (CLI)](/fa/start/wizard) را ببینید.
    - اگر از profileها (`--profile` / `OPENCLAW_PROFILE`) استفاده کرده‌اید، هر state dir را reset کنید (پیش‌فرض‌ها `~/.openclaw-<profile>` هستند).
    - reset مخصوص dev: `openclaw gateway --dev --reset` (فقط dev؛ پیکربندی dev + credentials + sessions + workspace را پاک می‌کند).

  </Accordion>

  <Accordion title='خطاهای "context too large" می‌گیرم - چطور reset یا compact کنم؟'>
    از یکی از این‌ها استفاده کنید:

    - **Compact** (گفت‌وگو را نگه می‌دارد اما turnهای قدیمی‌تر را خلاصه می‌کند):

      ```
      /compact
      ```

      یا `/compact <instructions>` برای هدایت خلاصه.

    - **Reset** (شناسه session تازه برای همان کلید chat):

      ```
      /new
      /reset
      ```

    اگر همچنان رخ می‌دهد:

    - **session pruning** (`agents.defaults.contextPruning`) را فعال یا تنظیم کنید تا خروجی قدیمی ابزارها trim شود.
    - از مدلی با پنجره context بزرگ‌تر استفاده کنید.

    مستندات: [Compaction](/fa/concepts/compaction)، [Session pruning](/fa/concepts/session-pruning)، [مدیریت session](/fa/concepts/session).

  </Accordion>

  <Accordion title='چرا "LLM request rejected: messages.content.tool_use.input field required" را می‌بینم؟'>
    این یک خطای اعتبارسنجی provider است: مدل یک بلوک `tool_use` بدون `input` الزامی تولید کرده است.
    معمولاً یعنی تاریخچه session قدیمی یا خراب شده است (اغلب پس از threadهای طولانی
    یا تغییر ابزار/schema).

    راه‌حل: با `/new` یک session تازه شروع کنید (پیام مستقل).

  </Accordion>

  <Accordion title="چرا هر 30 دقیقه پیام‌های heartbeat می‌گیرم؟">
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

    اگر `HEARTBEAT.md` وجود داشته باشد اما عملاً خالی باشد (فقط خط‌های خالی و headerهای markdown
    مثل `# Heading`)، OpenClaw اجرای heartbeat را برای صرفه‌جویی در API callها رد می‌کند.
    اگر فایل وجود نداشته باشد، heartbeat همچنان اجرا می‌شود و مدل تصمیم می‌گیرد چه کاری انجام دهد.

    Overrideهای per-agent از `agents.list[].heartbeat` استفاده می‌کنند. مستندات: [Heartbeat](/fa/gateway/heartbeat).

  </Accordion>

  <Accordion title='آیا لازم است یک "bot account" به گروه WhatsApp اضافه کنم؟'>
    خیر. OpenClaw روی **حساب خود شما** اجرا می‌شود، بنابراین اگر شما در گروه باشید، OpenClaw می‌تواند آن را ببیند.
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

  <Accordion title="چطور JID یک گروه WhatsApp را بگیرم؟">
    گزینه 1 (سریع‌ترین): logها را tail کنید و یک پیام آزمایشی در گروه بفرستید:

    ```bash
    openclaw logs --follow --json
    ```

    دنبال `chatId` (یا `from`) بگردید که به `@g.us` ختم می‌شود، مثل:
    `1234567890-1234567890@g.us`.

    گزینه 2 (اگر قبلاً پیکربندی/allowlist شده): گروه‌ها را از پیکربندی فهرست کنید:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    مستندات: [WhatsApp](/fa/channels/whatsapp)، [Directory](/fa/cli/directory)، [Logs](/fa/cli/logs).

  </Accordion>

  <Accordion title="چرا OpenClaw در یک گروه پاسخ نمی‌دهد؟">
    دو علت رایج:

    - Mention gating روشن است (پیش‌فرض). باید bot را @mention کنید (یا با `mentionPatterns` تطبیق دهید).
    - شما `channels.whatsapp.groups` را بدون `"*"` پیکربندی کرده‌اید و گروه در allowlist نیست.

    [Groups](/fa/channels/groups) و [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.

  </Accordion>

  <Accordion title="آیا گروه‌ها/threadها context را با DMها به اشتراک می‌گذارند؟">
    chatهای مستقیم به‌صورت پیش‌فرض به session اصلی collapse می‌شوند. گروه‌ها/channelها کلیدهای session خودشان را دارند، و topicهای Telegram / threadهای Discord sessionهای جداگانه هستند. [Groups](/fa/channels/groups) و [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.
  </Accordion>

  <Accordion title="چند فضای کاری و عامل می‌توانم ایجاد کنم؟">
    محدودیت سختی وجود ندارد. ده‌ها مورد (حتی صدها مورد) مشکلی ندارد، اما مراقب این موارد باشید:

    - **رشد دیسک:** نشست‌ها + رونوشت‌ها زیر `~/.openclaw/agents/<agentId>/sessions/` قرار می‌گیرند.
    - **هزینه توکن:** عامل‌های بیشتر یعنی استفاده هم‌زمان بیشتر از مدل.
    - **سربار عملیاتی:** پروفایل‌های احراز هویت، فضاهای کاری و مسیریابی کانال برای هر عامل.

    نکته‌ها:

    - برای هر عامل یک فضای کاری **فعال** نگه دارید (`agents.defaults.workspace`).
    - اگر دیسک رشد کرد، نشست‌های قدیمی را پاک‌سازی کنید (JSONL یا ورودی‌های ذخیره را حذف کنید).
    - برای پیدا کردن فضاهای کاری سرگردان و ناسازگاری‌های پروفایل از `openclaw doctor` استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم چند بات یا گفتگو را هم‌زمان اجرا کنم (Slack)، و آن را چطور تنظیم کنم؟">
    بله. از **مسیریابی چندعاملی** استفاده کنید تا چند عامل ایزوله را اجرا کنید و پیام‌های ورودی را بر اساس
    کانال/حساب/همتا مسیریابی کنید. Slack به‌عنوان یک کانال پشتیبانی می‌شود و می‌تواند به عامل‌های مشخص متصل شود.

    دسترسی مرورگر قدرتمند است، اما به معنی «انجام هر کاری که انسان می‌تواند» نیست؛ ضدبات، CAPTCHA و MFA هنوز
    می‌توانند خودکارسازی را مسدود کنند. برای قابل‌اعتمادترین کنترل مرورگر، از Chrome MCP محلی روی میزبان
    استفاده کنید، یا از CDP روی ماشینی استفاده کنید که واقعا مرورگر را اجرا می‌کند.

    تنظیم پیشنهادی:

    - میزبان Gateway همیشه روشن (VPS/Mac mini).
    - یک عامل برای هر نقش (bindingها).
    - کانال(های) Slack متصل به آن عامل‌ها.
    - مرورگر محلی از طریق Chrome MCP یا یک گره در صورت نیاز.

    مستندات: [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [Slack](/fa/channels/slack)،
    [مرورگر](/fa/tools/browser)، [گره‌ها](/fa/nodes).

  </Accordion>
</AccordionGroup>

## مدل‌ها، failover، و پروفایل‌های احراز هویت

پرسش‌وپاسخ مدل‌ها — پیش‌فرض‌ها، انتخاب، aliasها، جابه‌جایی، failover، پروفایل‌های احراز هویت —
در [پرسش‌های متداول مدل‌ها](/fa/help/faq-models) قرار دارد.

## Gateway: پورت‌ها، «از قبل در حال اجرا»، و حالت راه دور

<AccordionGroup>
  <Accordion title="Gateway از چه پورتی استفاده می‌کند؟">
    `gateway.port` پورت multiplexed واحد را برای WebSocket + HTTP کنترل می‌کند (Control UI، hookها و غیره).

    تقدم:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='چرا openclaw gateway status می‌گوید "Runtime: running" اما "Connectivity probe: failed"؟'>
    چون «running» دید **supervisor** است (launchd/systemd/schtasks). بررسی اتصال، خود CLI است که واقعا به WebSocket گیت‌وی وصل می‌شود.

    از `openclaw gateway status` استفاده کنید و به این خط‌ها اعتماد کنید:

    - `Probe target:` (نشانی‌ای که probe واقعا استفاده کرده است)
    - `Listening:` (آنچه واقعا روی پورت bind شده است)
    - `Last gateway error:` (علت ریشه‌ای رایج وقتی فرایند زنده است اما پورت گوش نمی‌دهد)

  </Accordion>

  <Accordion title='چرا openclaw gateway status مقادیر متفاوتی برای "Config (cli)" و "Config (service)" نشان می‌دهد؟'>
    شما در حال ویرایش یک فایل پیکربندی هستید، در حالی که سرویس با فایل دیگری اجرا می‌شود (اغلب ناسازگاری `--profile` / `OPENCLAW_STATE_DIR`).

    رفع:

    ```bash
    openclaw gateway install --force
    ```

    این را از همان `--profile` / محیطی اجرا کنید که می‌خواهید سرویس از آن استفاده کند.

  </Accordion>

  <Accordion title='عبارت "another gateway instance is already listening" یعنی چه؟'>
    OpenClaw با bind کردن فوری شنونده WebSocket هنگام راه‌اندازی، یک قفل runtime اعمال می‌کند (پیش‌فرض `ws://127.0.0.1:18789`). اگر bind با `EADDRINUSE` شکست بخورد، `GatewayLockError` پرتاب می‌کند که نشان می‌دهد نمونه دیگری از قبل در حال گوش دادن است.

    رفع: نمونه دیگر را متوقف کنید، پورت را آزاد کنید، یا با `openclaw gateway --port <port>` اجرا کنید.

  </Accordion>

  <Accordion title="چطور OpenClaw را در حالت راه دور اجرا کنم (کلاینت به Gateway در جای دیگر وصل شود)؟">
    `gateway.mode: "remote"` را تنظیم کنید و به یک URL راه دور WebSocket اشاره کنید، در صورت نیاز همراه با اعتبارنامه‌های راه دور shared-secret:

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

    - `openclaw gateway` فقط وقتی شروع می‌شود که `gateway.mode` برابر `local` باشد (یا flag override را بدهید).
    - برنامه macOS فایل پیکربندی را زیر نظر می‌گیرد و با تغییر این مقادیر، حالت‌ها را زنده عوض می‌کند.
    - `gateway.remote.token` / `.password` فقط اعتبارنامه‌های راه دور سمت کلاینت هستند؛ به‌تنهایی احراز هویت Gateway محلی را فعال نمی‌کنند.

  </Accordion>

  <Accordion title='Control UI می‌گوید "unauthorized" (یا مدام دوباره وصل می‌شود). حالا چه کار کنم؟'>
    مسیر احراز هویت Gateway شما و روش احراز هویت UI با هم سازگار نیستند.

    واقعیت‌ها (از کد):

    - Control UI توکن را برای نشست فعلی تب مرورگر و URL گیت‌وی انتخاب‌شده در `sessionStorage` نگه می‌دارد، بنابراین refresh در همان تب بدون بازگرداندن پایداری توکن بلندمدت localStorage همچنان کار می‌کند.
    - در `AUTH_TOKEN_MISMATCH`، کلاینت‌های مورد اعتماد می‌توانند وقتی Gateway راهنمای retry برمی‌گرداند (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`)، یک تلاش مجدد محدود با توکن دستگاه cache‌شده انجام دهند.
    - این تلاش مجدد با توکن cache‌شده اکنون از scopeهای تأییدشده cache‌شده‌ای استفاده می‌کند که همراه با توکن دستگاه ذخیره شده‌اند. فراخواننده‌های دارای `deviceToken` صریح / `scopes` صریح همچنان به‌جای ارث‌بری scopeهای cache‌شده، مجموعه scope درخواستی خود را نگه می‌دارند.
    - خارج از آن مسیر تلاش مجدد، تقدم احراز هویت اتصال ابتدا token/password مشترک صریح، سپس `deviceToken` صریح، سپس توکن دستگاه ذخیره‌شده، و سپس توکن bootstrap است.
    - بررسی scope توکن bootstrap با پیشوند نقش انجام می‌شود. allowlist داخلی operator در bootstrap فقط درخواست‌های operator را برآورده می‌کند؛ نقش‌های node یا دیگر نقش‌های غیر operator همچنان به scopeهایی زیر پیشوند نقش خودشان نیاز دارند.

    رفع:

    - سریع‌ترین راه: `openclaw dashboard` (URL داشبورد را چاپ و کپی می‌کند، تلاش می‌کند باز کند؛ اگر headless باشد راهنمای SSH نشان می‌دهد).
    - اگر هنوز توکن ندارید: `openclaw doctor --generate-gateway-token`.
    - اگر راه دور است، اول tunnel بسازید: `ssh -N -L 18789:127.0.0.1:18789 user@host` سپس `http://127.0.0.1:18789/` را باز کنید.
    - حالت shared-secret: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` یا `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` را تنظیم کنید، سپس secret مطابق را در تنظیمات Control UI paste کنید.
    - حالت Tailscale Serve: مطمئن شوید `gateway.auth.allowTailscale` فعال است و URL مربوط به Serve را باز می‌کنید، نه یک URL خام loopback/tailnet که headerهای هویت Tailscale را دور می‌زند.
    - حالت trusted-proxy: مطمئن شوید از طریق proxy آگاه از هویت پیکربندی‌شده وارد می‌شوید، نه یک URL خام Gateway. proxyهای loopback روی همان میزبان نیز به `gateway.auth.trustedProxy.allowLoopback = true` نیاز دارند.
    - اگر ناسازگاری پس از یک retry همچنان باقی بود، توکن دستگاه جفت‌شده را rotate/دوباره تأیید کنید:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - اگر آن فراخوانی rotate گفت رد شده است، دو چیز را بررسی کنید:
      - نشست‌های paired-device فقط می‌توانند دستگاه **خودشان** را rotate کنند مگر اینکه `operator.admin` هم داشته باشند
      - مقدارهای صریح `--scope` نمی‌توانند از scopeهای operator فعلی فراخواننده فراتر بروند
    - هنوز گیر کرده‌اید؟ `openclaw status --all` را اجرا کنید و [عیب‌یابی](/fa/gateway/troubleshooting) را دنبال کنید. برای جزئیات احراز هویت، [داشبورد](/fa/web/dashboard) را ببینید.

  </Accordion>

  <Accordion title="gateway.bind را روی tailnet گذاشته‌ام اما نمی‌تواند bind کند و هیچ‌چیز گوش نمی‌دهد">
    bind با `tailnet` یک IP مربوط به Tailscale را از رابط‌های شبکه شما انتخاب می‌کند (100.64.0.0/10). اگر ماشین روی Tailscale نباشد (یا رابط down باشد)، چیزی برای bind شدن وجود ندارد.

    رفع:

    - Tailscale را روی آن میزبان شروع کنید (تا یک نشانی 100.x داشته باشد)، یا
    - به `gateway.bind: "loopback"` / `"lan"` تغییر دهید.

    نکته: `tailnet` صریح است. `auto`، loopback را ترجیح می‌دهد؛ وقتی bind فقط مخصوص tailnet می‌خواهید از `gateway.bind: "tailnet"` استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم چند Gateway را روی یک میزبان اجرا کنم؟">
    معمولا نه؛ یک Gateway می‌تواند چند کانال پیام‌رسانی و عامل را اجرا کند. فقط وقتی به افزونگی (مثلا بات نجات) یا ایزوله‌سازی سخت نیاز دارید از چند Gateway استفاده کنید.

    بله، اما باید ایزوله کنید:

    - `OPENCLAW_CONFIG_PATH` (پیکربندی برای هر نمونه)
    - `OPENCLAW_STATE_DIR` (state برای هر نمونه)
    - `agents.defaults.workspace` (ایزوله‌سازی فضای کاری)
    - `gateway.port` (پورت‌های یکتا)

    تنظیم سریع (پیشنهادی):

    - برای هر نمونه از `openclaw --profile <name> ...` استفاده کنید (به‌طور خودکار `~/.openclaw-<name>` را ایجاد می‌کند).
    - در پیکربندی هر پروفایل یک `gateway.port` یکتا تنظیم کنید (یا برای اجراهای دستی `--port` بدهید).
    - یک سرویس برای هر پروفایل نصب کنید: `openclaw --profile <name> gateway install`.

    پروفایل‌ها همچنین پسوندی به نام سرویس‌ها اضافه می‌کنند (`ai.openclaw.<profile>`؛ legacy `com.openclaw.*`، `openclaw-gateway-<profile>.service`، `OpenClaw Gateway (<profile>)`).
    راهنمای کامل: [چند Gateway](/fa/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='عبارت "invalid handshake" / کد 1008 یعنی چه؟'>
    Gateway یک **سرور WebSocket** است، و انتظار دارد اولین پیام
    یک frame از نوع `connect` باشد. اگر چیز دیگری دریافت کند، اتصال را
    با **کد 1008** (نقض policy) می‌بندد.

    علت‌های رایج:

    - شما URL مربوط به **HTTP** را در مرورگر باز کرده‌اید (`http://...`) به‌جای یک کلاینت WS.
    - از پورت یا مسیر اشتباه استفاده کرده‌اید.
    - یک proxy یا tunnel، headerهای احراز هویت را حذف کرده یا درخواستی غیر از Gateway فرستاده است.

    رفع سریع:

    1. از URL مربوط به WS استفاده کنید: `ws://<host>:18789` (یا اگر HTTPS است `wss://...`).
    2. پورت WS را در یک تب عادی مرورگر باز نکنید.
    3. اگر احراز هویت فعال است، token/password را در frame مربوط به `connect` بگنجانید.

    اگر از CLI یا TUI استفاده می‌کنید، URL باید شبیه این باشد:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    جزئیات پروتکل: [پروتکل Gateway](/fa/gateway/protocol).

  </Accordion>
</AccordionGroup>

## گزارش‌گیری و اشکال‌زدایی

<AccordionGroup>
  <Accordion title="لاگ‌ها کجا هستند؟">
    لاگ‌های فایل (ساختاریافته):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    می‌توانید از طریق `logging.file` یک مسیر پایدار تنظیم کنید. سطح لاگ فایل با `logging.level` کنترل می‌شود. میزان پرگویی کنسول با `--verbose` و `logging.consoleLevel` کنترل می‌شود.

    سریع‌ترین دنبال‌کردن لاگ:

    ```bash
    openclaw logs --follow
    ```

    لاگ‌های سرویس/supervisor (وقتی گیت‌وی از طریق launchd/systemd اجرا می‌شود):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` و `gateway.err.log` (پیش‌فرض: `~/.openclaw/logs/...`؛ پروفایل‌ها از `~/.openclaw-<profile>/logs/...` استفاده می‌کنند)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    برای اطلاعات بیشتر [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید.

  </Accordion>

  <Accordion title="چطور سرویس Gateway را شروع/متوقف/راه‌اندازی مجدد کنم؟">
    از helperهای gateway استفاده کنید:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر گیت‌وی را دستی اجرا می‌کنید، `openclaw gateway --force` می‌تواند پورت را پس بگیرد. [Gateway](/fa/gateway) را ببینید.

  </Accordion>

  <Accordion title="ترمینال خود را در Windows بستم - چطور OpenClaw را دوباره راه‌اندازی کنم؟">
    **دو حالت نصب Windows** وجود دارد:

    **1) WSL2 (پیشنهادی):** Gateway داخل Linux اجرا می‌شود.

    PowerShell را باز کنید، وارد WSL شوید، سپس دوباره راه‌اندازی کنید:

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

    اگر آن را دستی اجرا می‌کنید (بدون سرویس)، استفاده کنید از:

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
    - جفت‌سازی/allowlist کانال پاسخ‌ها را مسدود کرده است (پیکربندی کانال + لاگ‌ها را بررسی کنید).
    - WebChat/Dashboard بدون توکن درست باز است.

    اگر از راه دور هستید، تأیید کنید اتصال تونل/Tailscale برقرار است و
    Gateway WebSocket در دسترس است.

    مستندات: [کانال‌ها](/fa/channels)، [عیب‌یابی](/fa/gateway/troubleshooting)، [دسترسی راه دور](/fa/gateway/remote).

  </Accordion>

  <Accordion title='"اتصال از Gateway قطع شد: بدون دلیل" - حالا چه؟'>
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

  <Accordion title="Telegram setMyCommands ناموفق می‌شود. چه چیزی را بررسی کنم؟">
    با لاگ‌ها و وضعیت کانال شروع کنید:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    سپس خطا را تطبیق دهید:

    - `BOT_COMMANDS_TOO_MUCH`: منوی Telegram ورودی‌های بیش از حدی دارد. OpenClaw از قبل آن را تا حد مجاز Telegram کوتاه می‌کند و با فرمان‌های کمتر دوباره تلاش می‌کند، اما برخی ورودی‌های منو همچنان باید حذف شوند. فرمان‌های Plugin/Skill/سفارشی را کاهش دهید، یا اگر به منو نیاز ندارید `channels.telegram.commands.native` را غیرفعال کنید.
    - `TypeError: fetch failed`، `Network request for 'setMyCommands' failed!`، یا خطاهای شبکه مشابه: اگر روی VPS هستید یا پشت پروکسی قرار دارید، تأیید کنید HTTPS خروجی مجاز است و DNS برای `api.telegram.org` کار می‌کند.

    اگر Gateway راه دور است، مطمئن شوید لاگ‌ها را روی میزبان Gateway می‌بینید.

    مستندات: [Telegram](/fa/channels/telegram)، [عیب‌یابی کانال](/fa/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI هیچ خروجی نشان نمی‌دهد. چه چیزی را بررسی کنم؟">
    ابتدا تأیید کنید Gateway در دسترس است و عامل می‌تواند اجرا شود:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    در TUI، از `/status` برای دیدن وضعیت فعلی استفاده کنید. اگر انتظار پاسخ در یک
    کانال چت دارید، مطمئن شوید تحویل فعال است (`/deliver on`).

    مستندات: [TUI](/fa/web/tui)، [فرمان‌های Slash](/fa/tools/slash-commands).

  </Accordion>

  <Accordion title="چگونه Gateway را کاملاً متوقف و سپس شروع کنم؟">
    اگر سرویس را نصب کرده‌اید:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    این کار **سرویس تحت نظارت** را متوقف/شروع می‌کند (launchd در macOS، systemd در Linux).
    وقتی Gateway به‌عنوان daemon در پس‌زمینه اجرا می‌شود، از این استفاده کنید.

    اگر در پیش‌زمینه اجرا می‌کنید، با Ctrl-C متوقف کنید، سپس:

    ```bash
    openclaw gateway run
    ```

    مستندات: [راهنمای اجرای سرویس Gateway](/fa/gateway).

  </Accordion>

  <Accordion title="توضیح ساده: openclaw gateway restart در برابر openclaw gateway">
    - `openclaw gateway restart`: **سرویس پس‌زمینه** را دوباره راه‌اندازی می‌کند (launchd/systemd).
    - `openclaw gateway`: Gateway را برای این نشست ترمینال **در پیش‌زمینه** اجرا می‌کند.

    اگر سرویس را نصب کرده‌اید، از فرمان‌های gateway استفاده کنید. وقتی
    یک اجرای پیش‌زمینه و یک‌باره می‌خواهید، از `openclaw gateway` استفاده کنید.

  </Accordion>

  <Accordion title="سریع‌ترین راه برای گرفتن جزئیات بیشتر وقتی چیزی شکست می‌خورد">
    Gateway را با `--verbose` شروع کنید تا جزئیات کنسول بیشتری بگیرید. سپس فایل لاگ را برای احراز هویت کانال، مسیریابی مدل، و خطاهای RPC بررسی کنید.
  </Accordion>
</AccordionGroup>

## رسانه و پیوست‌ها

<AccordionGroup>
  <Accordion title="Skill من تصویر/PDF تولید کرد، اما چیزی ارسال نشد">
    پیوست‌های خروجی از عامل باید یک خط `MEDIA:<path-or-url>` داشته باشند (در خط جداگانه خودش). [راه‌اندازی دستیار OpenClaw](/fa/start/openclaw) و [ارسال عامل](/fa/tools/agent-send) را ببینید.

    ارسال با CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    همچنین بررسی کنید:

    - کانال مقصد از رسانه خروجی پشتیبانی می‌کند و توسط allowlistها مسدود نشده است.
    - فایل در محدوده اندازه provider است (اندازه تصاویر به حداکثر 2048px تغییر داده می‌شود).
    - `tools.fs.workspaceOnly=true` ارسال‌های مسیر محلی را به workspace، temp/media-store، و فایل‌های اعتبارسنجی‌شده توسط sandbox محدود نگه می‌دارد.
    - `tools.fs.workspaceOnly=false` اجازه می‌دهد `MEDIA:` فایل‌های محلی میزبان را که عامل از قبل می‌تواند بخواند ارسال کند، اما فقط برای رسانه و انواع سند ایمن (تصاویر، صوت، ویدیو، PDF، و اسناد Office). فایل‌های متن ساده و شبیه به secret همچنان مسدود می‌شوند.

    [تصاویر](/fa/nodes/images) را ببینید.

  </Accordion>
</AccordionGroup>

## امنیت و کنترل دسترسی

<AccordionGroup>
  <Accordion title="آیا در معرض DMهای ورودی قرار دادن OpenClaw امن است؟">
    با DMهای ورودی مثل ورودی نامطمئن رفتار کنید. پیش‌فرض‌ها برای کاهش ریسک طراحی شده‌اند:

    - رفتار پیش‌فرض روی کانال‌های دارای قابلیت DM، **جفت‌سازی** است:
      - فرستندگان ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ bot پیام آن‌ها را پردازش نمی‌کند.
      - با این فرمان تأیید کنید: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - درخواست‌های در انتظار به **3 مورد برای هر کانال** محدود می‌شوند؛ اگر کدی نرسید، `openclaw pairing list --channel <channel> [--account <id>]` را بررسی کنید.
    - عمومی باز کردن DMها به opt-in صریح نیاز دارد (`dmPolicy: "open"` و allowlist `"*"`).

    برای آشکار کردن سیاست‌های DM پرریسک، `openclaw doctor` را اجرا کنید.

  </Accordion>

  <Accordion title="آیا تزریق prompt فقط برای botهای عمومی نگرانی است؟">
    خیر. تزریق prompt درباره **محتوای نامطمئن** است، نه فقط اینکه چه کسی می‌تواند به bot پیام DM بدهد.
    اگر دستیار شما محتوای خارجی را می‌خواند (جست‌وجو/واکشی وب، صفحه‌های مرورگر، ایمیل‌ها،
    مستندات، پیوست‌ها، لاگ‌های چسبانده‌شده)، آن محتوا می‌تواند دستورهایی داشته باشد که تلاش می‌کنند
    مدل را منحرف کنند. این ممکن است حتی وقتی **شما تنها فرستنده هستید** رخ دهد.

    بزرگ‌ترین ریسک زمانی است که ابزارها فعال هستند: مدل می‌تواند فریب بخورد تا
    context را استخراج کند یا از طرف شما ابزارها را فراخوانی کند. شعاع اثر را با این کارها کاهش دهید:

    - استفاده از یک عامل فقط‌خواندنی یا بدون ابزار برای خلاصه‌سازی محتوای نامطمئن
    - خاموش نگه داشتن `web_search` / `web_fetch` / `browser` برای عامل‌های دارای ابزار
    - رفتار با متن رمزگشایی‌شده فایل/سند به‌عنوان نامطمئن نیز: OpenResponses
      `input_file` و استخراج پیوست رسانه هر دو متن استخراج‌شده را به‌جای عبور دادن متن خام فایل،
      در نشانگرهای مرزی صریح محتوای خارجی می‌پیچند
    - sandboxing و allowlistهای سخت‌گیرانه ابزار

    جزئیات: [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="آیا bot من باید ایمیل، حساب GitHub، یا شماره تلفن خودش را داشته باشد؟">
    بله، برای بیشتر راه‌اندازی‌ها. جدا کردن bot با حساب‌ها و شماره‌های تلفن جداگانه
    اگر مشکلی پیش بیاید شعاع اثر را کاهش می‌دهد. همچنین چرخاندن
    اعتبارنامه‌ها یا لغو دسترسی را بدون اثرگذاری روی حساب‌های شخصی شما آسان‌تر می‌کند.

    کوچک شروع کنید. فقط به ابزارها و حساب‌هایی که واقعاً نیاز دارید دسترسی بدهید، و
    در صورت نیاز بعداً گسترش دهید.

    مستندات: [امنیت](/fa/gateway/security)، [جفت‌سازی](/fa/channels/pairing).

  </Accordion>

  <Accordion title="آیا می‌توانم به آن روی پیام‌های متنی خودم اختیار بدهم و آیا این امن است؟">
    ما اختیار کامل روی پیام‌های شخصی شما را توصیه **نمی‌کنیم**. امن‌ترین الگو این است:

    - DMها را در **حالت جفت‌سازی** یا یک allowlist محدود نگه دارید.
    - اگر می‌خواهید از طرف شما پیام بدهد، از یک **شماره یا حساب جداگانه** استفاده کنید.
    - بگذارید پیش‌نویس کند، سپس **قبل از ارسال تأیید کنید**.

    اگر می‌خواهید آزمایش کنید، این کار را روی یک حساب اختصاصی انجام دهید و آن را جدا نگه دارید. [امنیت](/fa/gateway/security) را ببینید.

  </Accordion>

  <Accordion title="آیا می‌توانم برای وظایف دستیار شخصی از مدل‌های ارزان‌تر استفاده کنم؟">
    بله، **اگر** عامل فقط چت باشد و ورودی مورد اعتماد باشد. رده‌های کوچک‌تر
    نسبت به ربایش دستور حساس‌تر هستند، پس برای عامل‌های دارای ابزار
    یا هنگام خواندن محتوای نامطمئن از آن‌ها پرهیز کنید. اگر مجبورید از مدل کوچک‌تر استفاده کنید، ابزارها را قفل کنید و داخل sandbox اجرا کنید. [امنیت](/fa/gateway/security) را ببینید.
  </Accordion>

  <Accordion title="در Telegram فرمان /start را اجرا کردم اما کد جفت‌سازی نگرفتم">
    کدهای جفت‌سازی **فقط** وقتی ارسال می‌شوند که یک فرستنده ناشناس به bot پیام بدهد و
    `dmPolicy: "pairing"` فعال باشد. `/start` به‌تنهایی کدی تولید نمی‌کند.

    درخواست‌های در انتظار را بررسی کنید:

    ```bash
    openclaw pairing list telegram
    ```

    اگر دسترسی فوری می‌خواهید، شناسه فرستنده خود را allowlist کنید یا برای آن حساب `dmPolicy: "open"` را تنظیم کنید.

  </Accordion>

  <Accordion title="WhatsApp: آیا به مخاطبان من پیام می‌دهد؟ جفت‌سازی چگونه کار می‌کند؟">
    خیر. سیاست پیش‌فرض DM در WhatsApp **جفت‌سازی** است. فرستندگان ناشناس فقط یک کد جفت‌سازی می‌گیرند و پیامشان **پردازش نمی‌شود**. OpenClaw فقط به چت‌هایی پاسخ می‌دهد که دریافت می‌کند یا به ارسال‌های صریحی که شما شروع می‌کنید.

    جفت‌سازی را با این فرمان تأیید کنید:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    درخواست‌های در انتظار را فهرست کنید:

    ```bash
    openclaw pairing list whatsapp
    ```

    درخواست شماره تلفن در wizard: از آن برای تنظیم **allowlist/مالک** شما استفاده می‌شود تا DMهای خودتان مجاز باشند. برای ارسال خودکار استفاده نمی‌شود. اگر روی شماره شخصی WhatsApp خود اجرا می‌کنید، از همان شماره استفاده کنید و `channels.whatsapp.selfChatMode` را فعال کنید.

  </Accordion>
</AccordionGroup>

## فرمان‌های چت، لغو وظایف، و «متوقف نمی‌شود»

<AccordionGroup>
  <Accordion title="چگونه جلوی نمایش پیام‌های داخلی سیستم در چت را بگیرم؟">
    بیشتر پیام‌های داخلی یا ابزار فقط وقتی ظاهر می‌شوند که **verbose**، **trace**، یا **reasoning** برای آن نشست فعال باشد.

    در همان چتی که آن را می‌بینید اصلاح کنید:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    اگر هنوز پر سروصداست، تنظیمات نشست را در Control UI بررسی کنید و verbose را
    روی **inherit** بگذارید. همچنین تأیید کنید از پروفایل bot با `verboseDefault` تنظیم‌شده
    روی `on` در پیکربندی استفاده نمی‌کنید.

    مستندات: [Thinking و verbose](/fa/tools/thinking)، [امنیت](/fa/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="چگونه یک وظیفه در حال اجرا را متوقف/لغو کنم؟">
    هرکدام از این‌ها را **به‌عنوان یک پیام مستقل** بفرستید (بدون slash):

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

    این‌ها محرک‌های لغو هستند (نه فرمان‌های slash).

    برای فرایندهای پس‌زمینه (از ابزار exec)، می‌توانید از عامل بخواهید اجرا کند:

    ```
    process action:kill sessionId:XXX
    ```

    نمای کلی فرمان‌های slash: [فرمان‌های Slash](/fa/tools/slash-commands) را ببینید.

    بیشتر فرمان‌ها باید به‌صورت یک پیام **مستقل** که با `/` شروع می‌شود ارسال شوند، اما چند میانبر (مثل `/status`) برای فرستندگان allowlist‌شده به‌صورت inline هم کار می‌کنند.

  </Accordion>

  <Accordion title='چگونه از Telegram پیام Discord ارسال کنم؟ ("پیام‌رسانی بین‌context رد شد")'>
    OpenClaw به‌صورت پیش‌فرض پیام‌رسانی **بین providerها** را مسدود می‌کند. اگر فراخوانی ابزار
    به Telegram متصل باشد، به Discord ارسال نمی‌کند مگر اینکه صریحاً اجازه دهید.

    پیام‌رسانی بین providerها را برای عامل فعال کنید:

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

  <Accordion title='چرا احساس می‌شود bot پیام‌های پشت‌سرهم سریع را "نادیده می‌گیرد"؟'>
    حالت صف کنترل می‌کند پیام‌های جدید چگونه با یک اجرای در جریان تعامل داشته باشند. برای تغییر حالت‌ها از `/queue` استفاده کنید:

    - `steer` - همه steeringهای در انتظار را برای مرز مدل بعدی در اجرای فعلی صف می‌کند
    - `queue` - steering قدیمی یکی‌یکی
    - `followup` - پیام‌ها را یکی‌یکی اجرا می‌کند
    - `collect` - پیام‌ها را دسته‌بندی می‌کند و یک‌بار پاسخ می‌دهد
    - `steer-backlog` - اکنون steer می‌کند، سپس backlog را پردازش می‌کند
    - `interrupt` - اجرای فعلی را لغو می‌کند و از نو شروع می‌کند

    حالت پیش‌فرض `steer` است. برای حالت‌های پیگیری می‌توانید گزینه‌هایی مانند `debounce:0.5s cap:25 drop:summarize` اضافه کنید. [صف فرمان](/fa/concepts/queue) و [صف هدایت](/fa/concepts/queue-steering) را ببینید.

  </Accordion>
</AccordionGroup>

## متفرقه

<AccordionGroup>
  <Accordion title='مدل پیش‌فرض Anthropic با یک کلید API چیست؟'>
    در OpenClaw، اعتبارنامه‌ها و انتخاب مدل از هم جدا هستند. تنظیم `ANTHROPIC_API_KEY` (یا ذخیره کردن کلید API Anthropic در نمایه‌های احراز هویت) احراز هویت را فعال می‌کند، اما مدل پیش‌فرض واقعی همان چیزی است که در `agents.defaults.model.primary` پیکربندی می‌کنید (برای مثال، `anthropic/claude-sonnet-4-6` یا `anthropic/claude-opus-4-6`). اگر `No credentials found for profile "anthropic:default"` را می‌بینید، یعنی Gateway نتوانسته است اعتبارنامه‌های Anthropic را در فایل `auth-profiles.json` مورد انتظار برای عاملی که در حال اجراست پیدا کند.
  </Accordion>
</AccordionGroup>

---

هنوز گیر کرده‌اید؟ در [Discord](https://discord.com/invite/clawd) بپرسید یا یک [بحث GitHub](https://github.com/openclaw/openclaw/discussions) باز کنید.

## مرتبط

- [پرسش‌های متداول اجرای نخست](/fa/help/faq-first-run) — نصب، راه‌اندازی اولیه، احراز هویت، اشتراک‌ها، خطاهای اولیه
- [پرسش‌های متداول مدل‌ها](/fa/help/faq-models) — انتخاب مدل، جایگزینی هنگام خرابی، نمایه‌های احراز هویت
- [عیب‌یابی](/fa/help/troubleshooting) — تریاژ بر پایه نشانه‌ها
