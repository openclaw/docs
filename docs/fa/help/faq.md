---
read_when:
    - پاسخ به پرسش‌های رایج پشتیبانی درباره راه‌اندازی، نصب، شروع به کار یا زمان اجرا
    - تریاژ مشکلات گزارش‌شده توسط کاربران پیش از اشکال‌زدایی عمیق‌تر
summary: پرسش‌های متداول درباره راه‌اندازی، پیکربندی و استفاده از OpenClaw
title: پرسش‌های متداول
x-i18n:
    generated_at: "2026-05-06T17:57:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d5724af921ab660da3d4453779f269bda440fb27518638541312e489f203318
    source_path: help/faq.md
    workflow: 16
---

پاسخ‌های سریع به‌همراه عیب‌یابی عمیق‌تر برای راه‌اندازی‌های واقعی (توسعه محلی، VPS، چندعامله، OAuth/API keys، failover مدل). برای عیب‌یابی زمان اجرا، [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید. برای مرجع کامل پیکربندی، [پیکربندی](/fa/gateway/configuration) را ببینید.

## ۶۰ ثانیه اول اگر چیزی خراب است

1. **وضعیت سریع (اولین بررسی)**

   ```bash
   openclaw status
   ```

   خلاصه محلی سریع: سیستم‌عامل + به‌روزرسانی، دسترسی‌پذیری gateway/service، agents/sessions، پیکربندی provider + مشکلات زمان اجرا (وقتی Gateway در دسترس باشد).

2. **گزارش قابل چسباندن (امن برای اشتراک‌گذاری)**

   ```bash
   openclaw status --all
   ```

   تشخیص فقط‌خواندنی با دنباله لاگ (توکن‌ها پوشانده می‌شوند).

3. **وضعیت daemon + port**

   ```bash
   openclaw gateway status
   ```

   زمان اجرای supervisor در برابر دسترسی‌پذیری RPC، URL هدف probe، و اینکه سرویس احتمالاً از کدام پیکربندی استفاده کرده است را نشان می‌دهد.

4. **probeهای عمیق**

   ```bash
   openclaw status --deep
   ```

   یک probe سلامت زنده Gateway اجرا می‌کند، شامل probeهای کانال در صورت پشتیبانی
   (به Gateway در دسترس نیاز دارد). [سلامت](/fa/gateway/health) را ببینید.

5. **دنباله آخرین لاگ**

   ```bash
   openclaw logs --follow
   ```

   اگر RPC قطع است، به این fallback کنید:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   لاگ‌های فایل از لاگ‌های سرویس جدا هستند؛ [لاگ‌گیری](/fa/logging) و [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید.

6. **اجرای doctor (تعمیرها)**

   ```bash
   openclaw doctor
   ```

   پیکربندی/وضعیت را تعمیر/مهاجرت می‌کند + بررسی‌های سلامت را اجرا می‌کند. [Doctor](/fa/gateway/doctor) را ببینید.

7. **snapshot Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   از Gateway در حال اجرا یک snapshot کامل می‌خواهد (فقط WS). [سلامت](/fa/gateway/health) را ببینید.

## شروع سریع و راه‌اندازی اولین اجرا

پرسش‌وپاسخ اولین اجرا - نصب، onboarding، مسیرهای auth، اشتراک‌ها، خطاهای اولیه -
در [پرسش‌های رایج اولین اجرا](/fa/help/faq-first-run) قرار دارد.

## OpenClaw چیست؟

<AccordionGroup>
  <Accordion title="OpenClaw در یک پاراگراف چیست؟">
    OpenClaw یک دستیار هوش مصنوعی شخصی است که روی دستگاه‌های خودتان اجرا می‌کنید. روی سطوح پیام‌رسانی‌ای که همین حالا استفاده می‌کنید پاسخ می‌دهد (WhatsApp، Telegram، Slack، Mattermost، Discord، Google Chat، Signal، iMessage، WebChat، و pluginهای کانال bundled مانند QQ Bot) و همچنین می‌تواند روی پلتفرم‌های پشتیبانی‌شده voice + یک Canvas زنده ارائه کند. **Gateway** صفحه کنترل همیشه‌روشن است؛ دستیار همان محصول است.
  </Accordion>

  <Accordion title="ارزش پیشنهادی">
    OpenClaw «فقط یک wrapper برای Claude» نیست. یک **صفحه کنترل local-first** است که به شما اجازه می‌دهد یک
    دستیار توانمند را روی **سخت‌افزار خودتان** اجرا کنید، از برنامه‌های چتی که همین حالا استفاده می‌کنید به آن دسترسی داشته باشید، با
    sessionهای stateful، حافظه، و ابزارها - بدون اینکه کنترل گردش‌کارهایتان را به یک
    SaaS میزبانی‌شده بسپارید.

    نکات برجسته:

    - **دستگاه‌های شما، داده‌های شما:** Gateway را هرجا می‌خواهید اجرا کنید (Mac، Linux، VPS) و
      workspace + تاریخچه session را محلی نگه دارید.
    - **کانال‌های واقعی، نه sandbox وب:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc،
      به‌علاوه voice موبایل و Canvas روی پلتفرم‌های پشتیبانی‌شده.
    - **مستقل از مدل:** از Anthropic، OpenAI، MiniMax، OpenRouter و غیره استفاده کنید، با routing
      و failover برای هر agent.
    - **گزینه فقط محلی:** مدل‌های محلی را اجرا کنید تا اگر خواستید **همه داده‌ها روی دستگاه شما بمانند**.
    - **routing چندعامله:** agentهای جداگانه برای هر کانال، حساب، یا task، هرکدام با
      workspace و پیش‌فرض‌های خودش.
    - **متن‌باز و قابل هک:** بدون vendor lock-in بررسی، گسترش، و self-host کنید.

    مستندات: [Gateway](/fa/gateway)، [کانال‌ها](/fa/channels)، [چندعامله](/fa/concepts/multi-agent)،
    [حافظه](/fa/concepts/memory).

  </Accordion>

  <Accordion title="تازه راه‌اندازی‌اش کرده‌ام - اول چه کار کنم؟">
    پروژه‌های اول خوب:

    - ساخت یک وب‌سایت (WordPress، Shopify، یا یک سایت static ساده).
    - نمونه‌سازی یک اپ موبایل (طرح کلی، screenها، برنامه API).
    - سازمان‌دهی فایل‌ها و پوشه‌ها (پاک‌سازی، نام‌گذاری، برچسب‌گذاری).
    - اتصال Gmail و خودکارسازی خلاصه‌ها یا follow upها.

    می‌تواند taskهای بزرگ را انجام دهد، اما وقتی آن‌ها را به فازها تقسیم کنید و
    از sub agentها برای کار موازی استفاده کنید بهترین عملکرد را دارد.

  </Accordion>

  <Accordion title="پنج کاربرد روزمره برتر OpenClaw چیست؟">
    بردهای روزمره معمولاً شبیه این‌ها هستند:

    - **خلاصه‌های شخصی:** خلاصه‌های inbox، تقویم، و خبرهایی که برایتان مهم است.
    - **پژوهش و پیش‌نویس‌نویسی:** پژوهش سریع، خلاصه‌ها، و پیش‌نویس‌های اولیه برای ایمیل‌ها یا مستندات.
    - **یادآورها و follow upها:** تلنگرها و چک‌لیست‌های مبتنی بر Cron یا Heartbeat.
    - **خودکارسازی مرورگر:** پر کردن فرم‌ها، جمع‌آوری داده‌ها، و تکرار taskهای وب.
    - **هماهنگی بین دستگاه‌ها:** یک task را از تلفن خود بفرستید، بگذارید Gateway آن را روی یک سرور اجرا کند، و نتیجه را در چت دریافت کنید.

  </Accordion>

  <Accordion title="آیا OpenClaw می‌تواند در lead gen، outreach، تبلیغات، و بلاگ‌ها برای یک SaaS کمک کند؟">
    بله برای **پژوهش، qualification، و پیش‌نویس‌نویسی**. می‌تواند سایت‌ها را scan کند، shortlist بسازد،
    prospectها را خلاصه کند، و پیش‌نویس متن outreach یا تبلیغ بنویسد.

    برای **اجرای outreach یا تبلیغات**، انسان را در چرخه نگه دارید. از spam پرهیز کنید، قوانین محلی و
    سیاست‌های پلتفرم را رعایت کنید، و هرچیزی را قبل از ارسال بازبینی کنید. امن‌ترین الگو این است که
    OpenClaw پیش‌نویس کند و شما تأیید کنید.

    مستندات: [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="مزیت‌ها نسبت به Claude Code برای توسعه وب چیست؟">
    OpenClaw یک **دستیار شخصی** و لایه هماهنگی است، نه جایگزین IDE. از
    Claude Code یا Codex برای سریع‌ترین loop کدنویسی مستقیم داخل یک repo استفاده کنید. وقتی
    حافظه پایدار، دسترسی بین دستگاهی، و orchestration ابزار می‌خواهید از OpenClaw استفاده کنید.

    مزیت‌ها:

    - **حافظه + workspace پایدار** در sessionهای مختلف
    - **دسترسی چندپلتفرمی** (WhatsApp، Telegram، TUI، WebChat)
    - **orchestration ابزار** (مرورگر، فایل‌ها، scheduling، hookها)
    - **Gateway همیشه‌روشن** (روی VPS اجرا کنید، از هرجا تعامل کنید)
    - **Nodeها** برای مرورگر/screen/camera/exec محلی

    نمایش: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills و خودکارسازی

<AccordionGroup>
  <Accordion title="چطور Skills را بدون dirty نگه داشتن repo سفارشی کنم؟">
    به‌جای ویرایش کپی repo، از overrideهای مدیریت‌شده استفاده کنید. تغییراتتان را در `~/.openclaw/skills/<name>/SKILL.md` بگذارید (یا از طریق `skills.load.extraDirs` در `~/.openclaw/openclaw.json` یک پوشه اضافه کنید). اولویت به‌ترتیب `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` است، بنابراین overrideهای مدیریت‌شده همچنان بدون دست زدن به git بر Skills bundled غلبه می‌کنند. اگر لازم دارید skill به‌صورت global نصب شود اما فقط برای بعضی agentها دیده شود، کپی shared را در `~/.openclaw/skills` نگه دارید و visibility را با `agents.defaults.skills` و `agents.list[].skills` کنترل کنید. فقط ویرایش‌هایی که ارزش upstream شدن دارند باید در repo قرار بگیرند و به‌صورت PR خارج شوند.
  </Accordion>

  <Accordion title="آیا می‌توانم Skills را از یک پوشه سفارشی load کنم؟">
    بله. directoryهای اضافی را از طریق `skills.load.extraDirs` در `~/.openclaw/openclaw.json` اضافه کنید (کمترین اولویت). اولویت پیش‌فرض `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` است. `clawhub` به‌طور پیش‌فرض در `./skills` نصب می‌کند، که OpenClaw در session بعدی آن را به‌عنوان `<workspace>/skills` در نظر می‌گیرد. اگر skill باید فقط برای agentهای مشخصی دیده شود، آن را با `agents.defaults.skills` یا `agents.list[].skills` همراه کنید.
  </Accordion>

  <Accordion title="چطور می‌توانم برای taskهای مختلف از مدل‌های مختلف استفاده کنم؟">
    الگوهای پشتیبانی‌شده امروز این‌ها هستند:

    - **Cron jobها**: jobهای isolated می‌توانند برای هر job یک override برای `model` تنظیم کنند.
    - **Sub-agentها**: taskها را به agentهای جداگانه با مدل‌های پیش‌فرض متفاوت route کنید.
    - **تعویض در لحظه**: از `/model` برای تعویض مدل session فعلی در هر زمان استفاده کنید.

    [Cron jobها](/fa/automation/cron-jobs)، [routing چندعامله](/fa/concepts/multi-agent)، و [دستورهای slash](/fa/tools/slash-commands) را ببینید.

  </Accordion>

  <Accordion title="bot هنگام انجام کار سنگین freeze می‌شود. چطور آن را offload کنم؟">
    برای taskهای طولانی یا موازی از **sub-agentها** استفاده کنید. Sub-agentها در session خودشان اجرا می‌شوند،
    خلاصه برمی‌گردانند، و چت اصلی شما را responsive نگه می‌دارند.

    از bot خود بخواهید «برای این task یک sub-agent spawn کند» یا از `/subagents` استفاده کنید.
    برای دیدن اینکه Gateway همین حالا چه می‌کند (و آیا busy است یا نه) در چت از `/status` استفاده کنید.

    نکته token: taskهای طولانی و sub-agentها هر دو token مصرف می‌کنند. اگر هزینه مهم است، از طریق
    `agents.defaults.subagents.model` یک مدل ارزان‌تر برای sub-agentها تنظیم کنید.

    مستندات: [Sub-agentها](/fa/tools/subagents)، [taskهای پس‌زمینه](/fa/automation/tasks).

  </Accordion>

  <Accordion title="sessionهای subagent وابسته به thread روی Discord چگونه کار می‌کنند؟">
    از thread bindingها استفاده کنید. می‌توانید یک thread در Discord را به یک subagent یا session target bind کنید تا پیام‌های follow-up در آن thread روی همان session bound بمانند.

    جریان پایه:

    - با `sessions_spawn` و با استفاده از `thread: true` spawn کنید (و در صورت تمایل `mode: "session"` برای follow-up پایدار).
    - یا به‌صورت دستی با `/focus <target>` bind کنید.
    - از `/agents` برای بررسی وضعیت binding استفاده کنید.
    - از `/session idle <duration|off>` و `/session max-age <duration|off>` برای کنترل auto-unfocus استفاده کنید.
    - از `/unfocus` برای جدا کردن thread استفاده کنید.

    پیکربندی لازم:

    - پیش‌فرض‌های global: `session.threadBindings.enabled`، `session.threadBindings.idleHours`، `session.threadBindings.maxAgeHours`.
    - overrideهای Discord: `channels.discord.threadBindings.enabled`، `channels.discord.threadBindings.idleHours`، `channels.discord.threadBindings.maxAgeHours`.
    - auto-bind هنگام spawn: `channels.discord.threadBindings.spawnSessions` به‌طور پیش‌فرض `true` است؛ برای غیرفعال کردن spawnهای session وابسته به thread آن را روی `false` بگذارید.

    مستندات: [Sub-agentها](/fa/tools/subagents)، [Discord](/fa/channels/discord)، [مرجع پیکربندی](/fa/gateway/configuration-reference)، [دستورهای slash](/fa/tools/slash-commands).

  </Accordion>

  <Accordion title="یک subagent تمام شد، اما update تکمیل به جای اشتباه رفت یا هرگز post نشد. چه چیزی را بررسی کنم؟">
    ابتدا requester route resolved را بررسی کنید:

    - تحویل subagent در completion-mode وقتی thread یا conversation route bound وجود داشته باشد، آن را ترجیح می‌دهد.
    - اگر completion origin فقط یک channel داشته باشد، OpenClaw به route ذخیره‌شده session درخواست‌دهنده (`lastChannel` / `lastTo` / `lastAccountId`) fallback می‌کند تا تحویل مستقیم همچنان بتواند موفق شود.
    - اگر نه route bound و نه route ذخیره‌شده قابل استفاده وجود داشته باشد، تحویل مستقیم می‌تواند fail شود و نتیجه به‌جای post فوری در chat به تحویل queued session fallback می‌کند.
    - targetهای نامعتبر یا stale همچنان می‌توانند queue fallback یا failure نهایی تحویل را force کنند.
    - اگر آخرین پاسخ assistant قابل مشاهده child دقیقاً token ساکت `NO_REPLY` / `no_reply`، یا دقیقاً `ANNOUNCE_SKIP` باشد، OpenClaw عمداً announce را به‌جای post کردن progress قدیمی‌تر stale سرکوب می‌کند.
    - اگر child پس از فقط tool callها timeout شود، announce می‌تواند به‌جای replay کردن tool output خام، آن را به یک خلاصه کوتاه partial-progress تبدیل کند.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [Sub-agentها](/fa/tools/subagents)، [taskهای پس‌زمینه](/fa/automation/tasks)، [ابزارهای session](/fa/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron یا یادآورها fire نمی‌شوند. چه چیزی را بررسی کنم؟">
    Cron داخل فرایند Gateway اجرا می‌شود. اگر Gateway به‌صورت پیوسته در حال اجرا نباشد،
    jobهای scheduled اجرا نمی‌شوند.

    چک‌لیست:

    - تأیید کنید cron فعال است (`cron.enabled`) و `OPENCLAW_SKIP_CRON` تنظیم نشده است.
    - بررسی کنید Gateway به‌صورت 24/7 اجرا می‌شود (بدون sleep/restart).
    - تنظیمات timezone را برای job بررسی کنید (`--tz` در برابر timezone میزبان).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    مستندات: [Cron jobها](/fa/automation/cron-jobs)، [خودکارسازی و taskها](/fa/automation).

  </Accordion>

  <Accordion title="Cron اجرا شد، اما چیزی به کانال ارسال نشد. چرا؟">
    ابتدا حالت تحویل را بررسی کنید:

    - `--no-deliver` / `delivery.mode: "none"` یعنی انتظار نمی‌رود ارسال fallback توسط اجراکننده انجام شود.
    - هدف اعلان گم‌شده یا نامعتبر (`channel` / `to`) یعنی اجراکننده تحویل خروجی را رد کرده است.
    - خطاهای احراز هویت کانال (`unauthorized`, `Forbidden`) یعنی اجراکننده تلاش کرده تحویل دهد، اما اعتبارنامه‌ها مانع شده‌اند.
    - نتیجهٔ ایزولهٔ ساکت (فقط `NO_REPLY` / `no_reply`) عمداً غیرقابل‌تحویل در نظر گرفته می‌شود، بنابراین اجراکننده تحویل fallback صف‌شده را نیز سرکوب می‌کند.

    برای کارهای Cron ایزوله، عامل همچنان می‌تواند وقتی مسیر گفت‌وگو در دسترس است مستقیماً با ابزار `message`
    ارسال کند. `--announce` فقط مسیر fallback اجراکننده را برای متن نهایی‌ای کنترل می‌کند که عامل از قبل ارسال نکرده است.

    عیب‌یابی:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [کارهای پس‌زمینه](/fa/automation/tasks).

  </Accordion>

  <Accordion title="چرا یک اجرای Cron ایزوله مدل را عوض کرد یا یک‌بار دوباره تلاش کرد؟">
    این معمولاً مسیر زندهٔ تعویض مدل است، نه زمان‌بندی تکراری.

    Cron ایزوله می‌تواند تحویل مدل زمان اجرا را پایدار کند و وقتی اجرای فعال
    `LiveSessionModelSwitchError` پرتاب می‌کند دوباره تلاش کند. تلاش دوباره همان
    ارائه‌دهنده/مدلِ تعویض‌شده را نگه می‌دارد، و اگر تعویض شامل override پروفایل احراز هویت تازه‌ای باشد، Cron
    آن را هم پیش از تلاش دوباره پایدار می‌کند.

    قواعد انتخاب مرتبط:

    - override مدل قلاب Gmail در صورت کاربرد، اولویت نخست را دارد.
    - سپس `model` هر کار.
    - سپس هر override ذخیره‌شدهٔ مدل نشست Cron.
    - سپس انتخاب عادی مدل عامل/پیش‌فرض.

    حلقهٔ تلاش دوباره محدود است. پس از تلاش اولیه به‌علاوهٔ 2 تلاش دوباره برای تعویض،
    Cron به‌جای حلقهٔ بی‌پایان متوقف می‌شود.

    عیب‌یابی:

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

    `openclaw skills install` بومی در پوشهٔ `skills/`
    فضای کاری فعال می‌نویسد. CLI جداگانهٔ `clawhub` را فقط زمانی نصب کنید که می‌خواهید Skills خودتان را منتشر یا
    همگام‌سازی کنید. برای نصب‌های مشترک میان عامل‌ها، Skill را زیر
    `~/.openclaw/skills` قرار دهید و اگر می‌خواهید مشخص کنید کدام عامل‌ها بتوانند آن را ببینند، از
    `agents.defaults.skills` یا
    `agents.list[].skills` استفاده کنید.

  </Accordion>

  <Accordion title="آیا OpenClaw می‌تواند کارها را طبق برنامه یا به‌طور پیوسته در پس‌زمینه اجرا کند؟">
    بله. از زمان‌بند Gateway استفاده کنید:

    - **کارهای Cron** برای کارهای زمان‌بندی‌شده یا تکرارشونده (پس از راه‌اندازی دوباره هم باقی می‌مانند).
    - **Heartbeat** برای بررسی‌های دوره‌ای «نشست اصلی».
    - **کارهای ایزوله** برای عامل‌های خودمختاری که خلاصه‌ها را پست می‌کنند یا به گفت‌وگوها تحویل می‌دهند.

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [اتوماسیون و کارها](/fa/automation)،
    [Heartbeat](/fa/gateway/heartbeat).

  </Accordion>

  <Accordion title="آیا می‌توانم Skills مخصوص Apple macOS را از Linux اجرا کنم؟">
    نه مستقیماً. Skills مربوط به macOS با `metadata.openclaw.os` به‌علاوهٔ باینری‌های لازم محدود می‌شوند، و Skills فقط وقتی در prompt سیستم ظاهر می‌شوند که روی **میزبان Gateway** واجد شرایط باشند. روی Linux، Skills فقط مخصوص `darwin` (مانند `apple-notes`، `apple-reminders`، `things-mac`) بارگذاری نمی‌شوند مگر اینکه محدودسازی را override کنید.

    سه الگوی پشتیبانی‌شده دارید:

    **گزینه A - Gateway را روی Mac اجرا کنید (ساده‌ترین).**
    Gateway را جایی اجرا کنید که باینری‌های macOS وجود دارند، سپس از Linux در [حالت راه‌دور](#gateway-ports-already-running-and-remote-mode) یا از طریق Tailscale وصل شوید. Skills به‌طور عادی بارگذاری می‌شوند، چون میزبان Gateway همان macOS است.

    **گزینه B - از یک Node مربوط به macOS استفاده کنید (بدون SSH).**
    Gateway را روی Linux اجرا کنید، یک Node مربوط به macOS (برنامهٔ نوار منو) را جفت کنید، و **Node Run Commands** را روی Mac روی «همیشه بپرس» یا «همیشه اجازه بده» بگذارید. OpenClaw می‌تواند وقتی باینری‌های لازم روی Node وجود دارند، Skills فقط مخصوص macOS را واجد شرایط بداند. عامل آن Skills را از طریق ابزار `nodes` اجرا می‌کند. اگر «همیشه بپرس» را انتخاب کنید، تأیید «همیشه اجازه بده» در prompt آن فرمان را به allowlist اضافه می‌کند.

    **گزینه C - باینری‌های macOS را از طریق SSH پراکسی کنید (پیشرفته).**
    Gateway را روی Linux نگه دارید، اما کاری کنید باینری‌های CLI لازم به wrapperهای SSH resolve شوند که روی Mac اجرا می‌شوند. سپس Skill را override کنید تا Linux را مجاز کند و همچنان واجد شرایط بماند.

    1. یک wrapper SSH برای باینری بسازید (نمونه: `memo` برای Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. wrapper را روی میزبان Linux در `PATH` قرار دهید (مثلاً `~/bin/memo`).
    3. فرادادهٔ Skill را (در فضای کاری یا `~/.openclaw/skills`) override کنید تا Linux را مجاز کند:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. یک نشست تازه شروع کنید تا snapshot مربوط به Skills تازه‌سازی شود.

  </Accordion>

  <Accordion title="آیا integration برای Notion یا HeyGen دارید؟">
    امروز به‌صورت داخلی وجود ندارد.

    گزینه‌ها:

    - **Skill / Plugin سفارشی:** بهترین گزینه برای دسترسی قابل‌اعتماد به API است (Notion/HeyGen هر دو API دارند).
    - **اتوماسیون مرورگر:** بدون کد کار می‌کند، اما کندتر و شکننده‌تر است.

    اگر می‌خواهید زمینه را برای هر مشتری نگه دارید (جریان‌های کاری آژانسی)، یک الگوی ساده این است:

    - یک صفحهٔ Notion برای هر مشتری (زمینه + ترجیحات + کار فعال).
    - از عامل بخواهید در ابتدای نشست آن صفحه را دریافت کند.

    اگر integration بومی می‌خواهید، یک درخواست قابلیت باز کنید یا Skillای بسازید
    که آن APIها را هدف بگیرد.

    نصب Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    نصب‌های بومی در پوشهٔ `skills/` فضای کاری فعال قرار می‌گیرند. برای Skills مشترک میان عامل‌ها، آن‌ها را در `~/.openclaw/skills/<name>/SKILL.md` بگذارید. اگر فقط بعضی عامل‌ها باید یک نصب مشترک را ببینند، `agents.defaults.skills` یا `agents.list[].skills` را پیکربندی کنید. بعضی Skills انتظار دارند باینری‌ها از طریق Homebrew نصب شده باشند؛ روی Linux یعنی Linuxbrew (مدخل پرسش‌های متداول Homebrew برای Linux را در بالا ببینید). [Skills](/fa/tools/skills)، [پیکربندی Skills](/fa/tools/skills-config)، و [ClawHub](/fa/tools/clawhub) را ببینید.

  </Accordion>

  <Accordion title="چگونه از Chrome فعلی خودم که وارد حساب شده است با OpenClaw استفاده کنم؟">
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

    این مسیر می‌تواند از مرورگر میزبان local یا یک Node مرورگر متصل استفاده کند. اگر Gateway جای دیگری اجرا می‌شود، یا یک میزبان Node را روی دستگاه مرورگر اجرا کنید یا به‌جای آن از CDP راه‌دور استفاده کنید.

    محدودیت‌های فعلی روی `existing-session` / `user`:

    - کنش‌ها مبتنی بر ref هستند، نه مبتنی بر CSS-selector
    - بارگذاری‌ها به `ref` / `inputRef` نیاز دارند و فعلاً هر بار از یک فایل پشتیبانی می‌کنند
    - `responsebody`، خروجی PDF، رهگیری دانلود، و کنش‌های دسته‌ای هنوز به مرورگر مدیریت‌شده یا پروفایل CDP خام نیاز دارند

  </Accordion>
</AccordionGroup>

## sandboxing و حافظه

<AccordionGroup>
  <Accordion title="آیا سند اختصاصی sandboxing وجود دارد؟">
    بله. [Sandboxing](/fa/gateway/sandboxing) را ببینید. برای راه‌اندازی مخصوص Docker (Gateway کامل در Docker یا imageهای sandbox)، [Docker](/fa/install/docker) را ببینید.
  </Accordion>

  <Accordion title="Docker محدود به نظر می‌رسد - چگونه قابلیت‌های کامل را فعال کنم؟">
    image پیش‌فرض امنیت‌محور است و به‌عنوان کاربر `node` اجرا می‌شود، بنابراین
    بسته‌های سیستمی، Homebrew، یا مرورگرهای همراه را شامل نمی‌شود. برای راه‌اندازی کامل‌تر:

    - `/home/node` را با `OPENCLAW_HOME_VOLUME` پایدار کنید تا cacheها باقی بمانند.
    - وابستگی‌های سیستمی را با `OPENCLAW_DOCKER_APT_PACKAGES` در image bake کنید.
    - مرورگرهای Playwright را از طریق CLI همراه نصب کنید:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` را تنظیم کنید و مطمئن شوید مسیر پایدار شده است.

    مستندات: [Docker](/fa/install/docker)، [مرورگر](/fa/tools/browser).

  </Accordion>

  <Accordion title="آیا می‌توانم DMها را شخصی نگه دارم اما گروه‌ها را با یک عامل عمومی/sandboxed کنم؟">
    بله - اگر ترافیک خصوصی شما **DMها** و ترافیک عمومی شما **گروه‌ها** باشند.

    از `agents.defaults.sandbox.mode: "non-main"` استفاده کنید تا نشست‌های گروه/کانال (کلیدهای غیر اصلی) در backend پیکربندی‌شدهٔ sandbox اجرا شوند، در حالی که نشست اصلی DM روی میزبان باقی می‌ماند. اگر یکی را انتخاب نکنید، Docker backend پیش‌فرض است. سپس ابزارهای در دسترس در نشست‌های sandboxed را از طریق `tools.sandbox.tools` محدود کنید.

    راهنمای گام‌به‌گام راه‌اندازی + پیکربندی نمونه: [گروه‌ها: DMهای شخصی + گروه‌های عمومی](/fa/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع کلیدی پیکربندی: [پیکربندی Gateway](/fa/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="چگونه یک پوشهٔ میزبان را به sandbox متصل کنم؟">
    `agents.defaults.sandbox.docker.binds` را روی `["host:path:mode"]` تنظیم کنید (مثلاً `"/home/user/src:/src:ro"`). bindهای سراسری و مخصوص هر عامل ادغام می‌شوند؛ bindهای مخصوص هر عامل وقتی `scope: "shared"` باشد نادیده گرفته می‌شوند. برای هر چیز حساس از `:ro` استفاده کنید و به‌خاطر داشته باشید که bindها دیوارهای فایل‌سیستم sandbox را دور می‌زنند.

    OpenClaw منابع bind را هم در برابر مسیر نرمال‌شده و هم مسیر canonical که از طریق عمیق‌ترین ancestor موجود resolve شده اعتبارسنجی می‌کند. این یعنی خروج از طریق والد symlink همچنان بسته می‌ماند، حتی وقتی آخرین بخش مسیر هنوز وجود ندارد، و بررسی‌های ریشهٔ مجاز همچنان پس از resolve شدن symlink اعمال می‌شوند.

    برای نمونه‌ها و نکات ایمنی، [Sandboxing](/fa/gateway/sandboxing#custom-bind-mounts) و [Sandbox در برابر سیاست ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) را ببینید.

  </Accordion>

  <Accordion title="حافظه چگونه کار می‌کند؟">
    حافظهٔ OpenClaw فقط فایل‌های Markdown در فضای کاری عامل است:

    - یادداشت‌های روزانه در `memory/YYYY-MM-DD.md`
    - یادداشت‌های بلندمدت گزینش‌شده در `MEMORY.md` (فقط نشست‌های اصلی/خصوصی)

    OpenClaw همچنین یک **flush حافظهٔ ساکت پیش از Compaction** اجرا می‌کند تا به مدل یادآوری کند
    پیش از auto-compaction یادداشت‌های بادوام بنویسد. این فقط وقتی اجرا می‌شود که فضای کاری
    نوشتنی باشد (sandboxهای فقط‌خواندنی آن را رد می‌کنند). [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>

  <Accordion title="حافظه مدام چیزها را فراموش می‌کند. چگونه آن را ماندگار کنم؟">
    از bot بخواهید **آن واقعیت را در حافظه بنویسد**. یادداشت‌های بلندمدت در `MEMORY.md`
    قرار می‌گیرند، زمینهٔ کوتاه‌مدت در `memory/YYYY-MM-DD.md` می‌رود.

    این هنوز حوزه‌ای است که در حال بهبود آن هستیم. یادآوری به مدل برای ذخیرهٔ حافظه‌ها کمک می‌کند؛
    خودش می‌داند چه کند. اگر همچنان فراموش می‌کند، بررسی کنید Gateway در هر اجرا از همان
    فضای کاری استفاده می‌کند.

    مستندات: [حافظه](/fa/concepts/memory)، [فضای کاری عامل](/fa/concepts/agent-workspace).

  </Accordion>

  <Accordion title="آیا حافظه برای همیشه پایدار می‌ماند؟ محدودیت‌ها چیست؟">
    فایل‌های حافظه روی دیسک زندگی می‌کنند و تا وقتی شما آن‌ها را حذف نکنید باقی می‌مانند. محدودیت، فضای
    ذخیره‌سازی شماست، نه مدل. **زمینهٔ نشست** همچنان به پنجرهٔ زمینهٔ مدل
    محدود است، بنابراین گفت‌وگوهای طولانی می‌توانند compact یا truncate شوند. به همین دلیل
    جست‌وجوی حافظه وجود دارد - فقط بخش‌های مرتبط را به زمینه برمی‌گرداند.

    مستندات: [حافظه](/fa/concepts/memory)، [زمینه](/fa/concepts/context).

  </Accordion>

  <Accordion title="آیا جستجوی حافظهٔ معنایی به کلید API OpenAI نیاز دارد؟">
    فقط اگر از **جاسازی‌های OpenAI** استفاده کنید. Codex OAuth چت/تکمیل‌ها را پوشش می‌دهد و
    دسترسی به جاسازی‌ها را **نمی‌دهد**، بنابراین **ورود با Codex (OAuth یا
    ورود Codex CLI)** برای جستجوی حافظهٔ معنایی کمکی نمی‌کند. جاسازی‌های OpenAI
    همچنان به یک کلید API واقعی نیاز دارند (`OPENAI_API_KEY` یا `models.providers.openai.apiKey`).

    اگر ارائه‌دهنده‌ای را صراحتا تنظیم نکنید، OpenClaw وقتی بتواند یک کلید API را
    تشخیص دهد، یک ارائه‌دهنده را خودکار انتخاب می‌کند (پروفایل‌های احراز هویت، `models.providers.*.apiKey`، یا متغیرهای محیطی).
    اگر کلید OpenAI تشخیص داده شود، OpenAI را ترجیح می‌دهد؛ در غیر این صورت اگر کلید Gemini
    تشخیص داده شود Gemini، سپس Voyage، و سپس Mistral را انتخاب می‌کند. اگر هیچ کلید راه‌دوری
    در دسترس نباشد، جستجوی حافظه تا زمانی که آن را پیکربندی کنید غیرفعال می‌ماند. اگر مسیر مدل محلی
    پیکربندی و موجود باشد، OpenClaw
    `local` را ترجیح می‌دهد. Ollama زمانی پشتیبانی می‌شود که صراحتا
    `memorySearch.provider = "ollama"` را تنظیم کنید.

    اگر ترجیح می‌دهید محلی بمانید، `memorySearch.provider = "local"` را تنظیم کنید (و به‌صورت اختیاری
    `memorySearch.fallback = "none"`). اگر جاسازی‌های Gemini را می‌خواهید،
    `memorySearch.provider = "gemini"` را تنظیم کنید و `GEMINI_API_KEY` (یا
    `memorySearch.remote.apiKey`) را ارائه دهید. ما از مدل‌های جاسازی **OpenAI، Gemini، Voyage، Mistral، Ollama، یا local**
    پشتیبانی می‌کنیم - برای جزئیات راه‌اندازی، [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>
</AccordionGroup>

## چیزها روی دیسک کجا قرار دارند

<AccordionGroup>
  <Accordion title="آیا همهٔ داده‌های استفاده‌شده با OpenClaw به‌صورت محلی ذخیره می‌شوند؟">
    نه - **وضعیت OpenClaw محلی است**، اما **سرویس‌های خارجی همچنان آنچه برایشان می‌فرستید را می‌بینند**.

    - **به‌صورت پیش‌فرض محلی:** نشست‌ها، فایل‌های حافظه، پیکربندی، و فضای کاری روی میزبان Gateway قرار دارند
      (`~/.openclaw` + پوشهٔ فضای کاری شما).
    - **به‌اجبار راه‌دور:** پیام‌هایی که برای ارائه‌دهندگان مدل (Anthropic/OpenAI/و غیره) می‌فرستید به
      APIهای آن‌ها می‌روند، و پلتفرم‌های چت (WhatsApp/Telegram/Slack/و غیره) داده‌های پیام را روی
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
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | واردسازی OAuth قدیمی (در نخستین استفاده به پروفایل‌های احراز هویت کپی می‌شود)       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | پروفایل‌های احراز هویت (OAuth، کلیدهای API، و `keyRef`/`tokenRef` اختیاری)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | بار محرمانهٔ اختیاریِ مبتنی بر فایل برای ارائه‌دهندگان SecretRef نوع `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | فایل سازگاری قدیمی (ورودی‌های ثابت `api_key` پاک‌سازی شده‌اند)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | وضعیت ارائه‌دهنده (مثلا `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | وضعیت هر عامل (agentDir + نشست‌ها)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | تاریخچه و وضعیت گفتگو (برای هر عامل)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | فرادادهٔ نشست (برای هر عامل)                                       |

    مسیر قدیمی تک‌عاملی: `~/.openclaw/agent/*` (توسط `openclaw doctor` مهاجرت داده می‌شود).

    **فضای کاری** شما (AGENTS.md، فایل‌های حافظه، مهارت‌ها، و غیره) جداست و از طریق `agents.defaults.workspace` پیکربندی می‌شود (پیش‌فرض: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md باید کجا قرار داشته باشند؟">
    این فایل‌ها در **فضای کاری عامل** قرار دارند، نه در `~/.openclaw`.

    - **فضای کاری (برای هر عامل)**: `AGENTS.md`، `SOUL.md`، `IDENTITY.md`، `USER.md`،
      `MEMORY.md`، `memory/YYYY-MM-DD.md`، و `HEARTBEAT.md` اختیاری.
      `memory.md` ریشه با حروف کوچک فقط ورودی تعمیر قدیمی است؛ وقتی هر دو فایل وجود داشته باشند، `openclaw doctor --fix`
      می‌تواند آن را در `MEMORY.md` ادغام کند.
    - **پوشهٔ وضعیت (`~/.openclaw`)**: پیکربندی، وضعیت کانال/ارائه‌دهنده، پروفایل‌های احراز هویت، نشست‌ها، گزارش‌ها،
      و Skills مشترک (`~/.openclaw/skills`).

    فضای کاری پیش‌فرض `~/.openclaw/workspace` است و از این طریق قابل پیکربندی است:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    اگر ربات پس از راه‌اندازی دوباره «فراموش می‌کند»، تأیید کنید که Gateway در هر اجرا از همان
    فضای کاری استفاده می‌کند (و به یاد داشته باشید: حالت راه‌دور از **فضای کاری میزبان gateway**
    استفاده می‌کند، نه لپ‌تاپ محلی شما).

    نکته: اگر یک رفتار یا ترجیح پایدار می‌خواهید، از ربات بخواهید **آن را در
    AGENTS.md یا MEMORY.md بنویسد**، نه اینکه به تاریخچهٔ چت تکیه کنید.

    [فضای کاری عامل](/fa/concepts/agent-workspace) و [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>

  <Accordion title="راهبرد پیشنهادی پشتیبان‌گیری">
    **فضای کاری عامل** خود را در یک مخزن git **خصوصی** بگذارید و آن را در جایی
    خصوصی پشتیبان بگیرید (برای مثال GitHub خصوصی). این کار حافظه + فایل‌های AGENTS/SOUL/USER
    را ثبت می‌کند و به شما اجازه می‌دهد بعدا «ذهن» دستیار را بازیابی کنید.

    هیچ‌چیز زیر `~/.openclaw` را commit نکنید (اعتبارنامه‌ها، نشست‌ها، توکن‌ها، یا بارهای محرمانهٔ رمزگذاری‌شده).
    اگر به بازیابی کامل نیاز دارید، هم فضای کاری و هم پوشهٔ وضعیت را
    جداگانه پشتیبان بگیرید (پرسش مهاجرت بالا را ببینید).

    مستندات: [فضای کاری عامل](/fa/concepts/agent-workspace).

  </Accordion>

  <Accordion title="چگونه OpenClaw را به‌طور کامل حذف نصب کنم؟">
    راهنمای اختصاصی را ببینید: [حذف نصب](/fa/install/uninstall).
  </Accordion>

  <Accordion title="آیا عامل‌ها می‌توانند خارج از فضای کاری کار کنند؟">
    بله. فضای کاری **cwd پیش‌فرض** و لنگر حافظه است، نه یک جعبهٔ شنی سخت‌گیرانه.
    مسیرهای نسبی داخل فضای کاری resolve می‌شوند، اما مسیرهای مطلق می‌توانند به مکان‌های دیگر
    میزبان دسترسی داشته باشند مگر اینکه جعبهٔ شنی فعال شده باشد. اگر به جداسازی نیاز دارید، از
    [`agents.defaults.sandbox`](/fa/gateway/sandboxing) یا تنظیمات جعبهٔ شنی هر عامل استفاده کنید. اگر
    می‌خواهید یک مخزن پوشهٔ کاری پیش‌فرض باشد، `workspace` آن عامل را به ریشهٔ مخزن اشاره دهید. مخزن OpenClaw فقط کد منبع است؛
    فضای کاری را جدا نگه دارید مگر اینکه عمدا بخواهید عامل داخل آن کار کند.

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

  <Accordion title="حالت راه‌دور: ذخیره‌گاه نشست کجاست؟">
    وضعیت نشست متعلق به **میزبان gateway** است. اگر در حالت راه‌دور هستید، ذخیره‌گاه نشستی که برایتان مهم است روی دستگاه راه‌دور است، نه لپ‌تاپ محلی شما. [مدیریت نشست](/fa/concepts/session) را ببینید.
  </Accordion>
</AccordionGroup>

## مبانی پیکربندی

<AccordionGroup>
  <Accordion title="قالب پیکربندی چیست؟ کجاست؟">
    OpenClaw یک پیکربندی **JSON5** اختیاری را از `$OPENCLAW_CONFIG_PATH` می‌خواند (پیش‌فرض: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    اگر فایل وجود نداشته باشد، از پیش‌فرض‌های نسبتا ایمن استفاده می‌کند (از جمله فضای کاری پیش‌فرض `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='من gateway.bind: "lan" (یا "tailnet") را تنظیم کردم و حالا چیزی گوش نمی‌دهد / رابط کاربری می‌گوید غیرمجاز است'>
    اتصال‌های غیر-loopback **به یک مسیر معتبر احراز هویت gateway نیاز دارند**. در عمل یعنی:

    - احراز هویت shared-secret: توکن یا گذرواژه
    - `gateway.auth.mode: "trusted-proxy"` پشت یک پراکسی معکوس هویت‌آگاه که درست پیکربندی شده باشد

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
    - اگر `gateway.auth.token` / `gateway.auth.password` صراحتا از طریق SecretRef پیکربندی شده و resolve نشده باشد، فرایند resolve به‌صورت بسته شکست می‌خورد (بدون پوشاندن با fallback راه‌دور).
    - راه‌اندازی‌های Control UI با shared-secret از طریق `connect.params.auth.token` یا `connect.params.auth.password` احراز هویت می‌شوند (در تنظیمات برنامه/رابط کاربری ذخیره می‌شود). حالت‌های دارای هویت مانند Tailscale Serve یا `trusted-proxy` به‌جای آن از سرآیندهای درخواست استفاده می‌کنند. از گذاشتن رازهای مشترک در URLها خودداری کنید.
    - با `gateway.auth.mode: "trusted-proxy"`، پراکسی‌های معکوس loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح و یک ورودی loopback در `gateway.trustedProxies` نیاز دارند.

  </Accordion>

  <Accordion title="چرا حالا روی localhost به توکن نیاز دارم؟">
    OpenClaw احراز هویت gateway را به‌صورت پیش‌فرض اعمال می‌کند، از جمله loopback. در مسیر پیش‌فرض معمولی این یعنی احراز هویت توکنی: اگر مسیر احراز هویت صریحی پیکربندی نشده باشد، راه‌اندازی gateway به حالت توکن resolve می‌شود و برای همان راه‌اندازی یک توکن فقط زمان اجرا تولید می‌کند، بنابراین **کلاینت‌های WS محلی باید احراز هویت کنند**. وقتی کلاینت‌ها به یک راز پایدار میان راه‌اندازی‌های دوباره نیاز دارند، `gateway.auth.token`، `gateway.auth.password`، `OPENCLAW_GATEWAY_TOKEN`، یا `OPENCLAW_GATEWAY_PASSWORD` را صراحتا پیکربندی کنید. این کار مانع فراخوانی Gateway توسط فرایندهای محلی دیگر می‌شود.

    اگر مسیر احراز هویت متفاوتی را ترجیح می‌دهید، می‌توانید صراحتا حالت گذرواژه را انتخاب کنید (یا برای پراکسی‌های معکوس هویت‌آگاه، `trusted-proxy`). اگر **واقعا** loopback باز می‌خواهید، `gateway.auth.mode: "none"` را صراحتا در پیکربندی خود تنظیم کنید. Doctor هر زمان می‌تواند برایتان توکن تولید کند: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="آیا پس از تغییر پیکربندی باید راه‌اندازی دوباره انجام دهم؟">
    Gateway پیکربندی را زیر نظر دارد و از بارگذاری دوبارهٔ داغ پشتیبانی می‌کند:

    - `gateway.reload.mode: "hybrid"` (پیش‌فرض): تغییرات ایمن را داغ اعمال می‌کند و برای تغییرات حیاتی راه‌اندازی دوباره انجام می‌دهد
    - `hot`، `restart`، `off` نیز پشتیبانی می‌شوند

  </Accordion>

  <Accordion title="چگونه شعارهای بامزهٔ CLI را غیرفعال کنم؟">
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

    - `off`: متن شعار را پنهان می‌کند اما خط عنوان/نسخهٔ بنر را نگه می‌دارد.
    - `default`: هر بار از `All your chats, one OpenClaw.` استفاده می‌کند.
    - `random`: شعارهای بامزه/فصلی چرخشی (رفتار پیش‌فرض).
    - اگر اصلا بنر نمی‌خواهید، متغیر محیطی `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

  </Accordion>

  <Accordion title="چگونه جستجوی وب (و واکشی وب) را فعال کنم؟">
    `web_fetch` بدون کلید API کار می‌کند. `web_search` به ارائه‌دهندهٔ انتخاب‌شدهٔ شما
    وابسته است:

    - ارائه‌دهندگان مبتنی بر API مانند Brave، Exa، Firecrawl، Gemini، Grok، Kimi، MiniMax Search، Perplexity، و Tavily به راه‌اندازی معمول کلید API خود نیاز دارند.
    - Ollama Web Search بدون کلید است، اما از میزبان Ollama پیکربندی‌شدهٔ شما استفاده می‌کند و به `ollama signin` نیاز دارد.
    - DuckDuckGo بدون کلید است، اما یک یکپارچه‌سازی غیررسمی مبتنی بر HTML است.
    - SearXNG بدون کلید/خودمیزبان است؛ `SEARXNG_BASE_URL` یا `plugins.entries.searxng.config.webSearch.baseUrl` را پیکربندی کنید.

    **پیشنهاد می‌شود:** `openclaw configure --section web` را اجرا کنید و یک ارائه‌دهنده انتخاب کنید.
    جایگزین‌های محیطی:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` یا `MOONSHOT_API_KEY`
    - جست‌وجوی MiniMax: `MINIMAX_CODE_PLAN_KEY`، `MINIMAX_CODING_API_KEY`، یا `MINIMAX_API_KEY`
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
    - `web_fetch` به‌صورت پیش‌فرض فعال است (مگر این‌که صراحتا غیرفعال شده باشد).
    - اگر `tools.web.fetch.provider` حذف شود، OpenClaw نخستین ارائه‌دهنده آماده جایگزین واکشی را از اعتبارنامه‌های موجود به‌طور خودکار شناسایی می‌کند. امروز ارائه‌دهنده همراه‌شده Firecrawl است.
    - دیمون‌ها متغیرهای محیطی را از `~/.openclaw/.env` (یا محیط سرویس) می‌خوانند.

    مستندات: [ابزارهای وب](/fa/tools/web).

  </Accordion>

  <Accordion title="config.apply پیکربندی من را پاک کرد. چگونه بازیابی کنم و از تکرار آن جلوگیری کنم؟">
    `config.apply` **کل پیکربندی** را جایگزین می‌کند. اگر یک شیء جزئی بفرستید، هر چیز
    دیگری حذف می‌شود.

    نسخه فعلی OpenClaw در برابر بسیاری از بازنویسی‌های تصادفی محافظت می‌کند:

    - نوشتن‌های پیکربندی متعلق به OpenClaw پیش از نوشتن، کل پیکربندی پس از تغییر را اعتبارسنجی می‌کنند.
    - نوشتن‌های نامعتبر یا مخرب متعلق به OpenClaw رد می‌شوند و با نام `openclaw.json.rejected.*` ذخیره می‌شوند.
    - اگر یک ویرایش مستقیم راه‌اندازی یا بارگذاری مجدد داغ را خراب کند، Gateway به‌صورت بسته شکست می‌خورد یا بارگذاری مجدد را رد می‌کند؛ `openclaw.json` را بازنویسی نمی‌کند.
    - `openclaw doctor --fix` مالک تعمیر است و می‌تواند آخرین نسخه سالم شناخته‌شده را بازیابی کند، در حالی که فایل ردشده را با نام `openclaw.json.clobbered.*` ذخیره می‌کند.

    بازیابی:

    - `openclaw logs --follow` را برای `Invalid config at`، `Config write rejected:`، یا `config reload skipped (invalid config)` بررسی کنید.
    - جدیدترین `openclaw.json.clobbered.*` یا `openclaw.json.rejected.*` را کنار پیکربندی فعال بررسی کنید.
    - `openclaw config validate` و `openclaw doctor --fix` را اجرا کنید.
    - فقط کلیدهای مورد نظر را با `openclaw config set` یا `config.patch` برگردانید.
    - اگر آخرین نسخه سالم شناخته‌شده یا payload ردشده ندارید، از پشتیبان بازیابی کنید، یا `openclaw doctor` را دوباره اجرا کنید و کانال‌ها/مدل‌ها را دوباره پیکربندی کنید.
    - اگر این اتفاق غیرمنتظره بود، یک باگ ثبت کنید و آخرین پیکربندی شناخته‌شده یا هر پشتیبان خود را ضمیمه کنید.
    - یک عامل کدنویسی محلی اغلب می‌تواند از روی لاگ‌ها یا تاریخچه، یک پیکربندی کارآمد بازسازی کند.

    جلوگیری:

    - برای تغییرات کوچک از `openclaw config set` استفاده کنید.
    - برای ویرایش‌های تعاملی از `openclaw configure` استفاده کنید.
    - وقتی از مسیر دقیق یا شکل فیلد مطمئن نیستید، ابتدا از `config.schema.lookup` استفاده کنید؛ این دستور یک گره schema سطحی به‌همراه خلاصه‌های مستقیم فرزندان برای کاوش عمیق‌تر برمی‌گرداند.
    - برای ویرایش‌های RPC جزئی از `config.patch` استفاده کنید؛ `config.apply` را فقط برای جایگزینی کامل پیکربندی نگه دارید.
    - اگر از ابزار مالک‌-فقطِ `gateway` در اجرای یک عامل استفاده می‌کنید، همچنان نوشتن در `tools.exec.ask` / `tools.exec.security` را رد می‌کند (از جمله نام‌های مستعار قدیمی `tools.bash.*` که به همان مسیرهای محافظت‌شده اجرا عادی‌سازی می‌شوند).

    مستندات: [پیکربندی](/fa/cli/config)، [پیکربندی تعاملی](/fa/cli/configure)، [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-rejected-invalid-config)، [Doctor](/fa/gateway/doctor).

  </Accordion>

  <Accordion title="چگونه یک Gateway مرکزی را با کارکنان تخصصی در چند دستگاه اجرا کنم؟">
    الگوی رایج **یک Gateway** (برای مثال Raspberry Pi) به‌همراه **Nodeها** و **عامل‌ها** است:

    - **Gateway (مرکزی):** مالک کانال‌ها (Signal/WhatsApp)، مسیریابی، و نشست‌ها است.
    - **Nodeها (دستگاه‌ها):** مک‌ها/iOS/Android به‌عنوان پیرامونی متصل می‌شوند و ابزارهای محلی (`system.run`، `canvas`، `camera`) را در دسترس می‌گذارند.
    - **عامل‌ها (کارکنان):** مغزها/فضاهای کاری جداگانه برای نقش‌های ویژه (برای مثال "عملیات Hetzner"، "داده‌های شخصی").
    - **زیرعامل‌ها:** وقتی موازی‌سازی می‌خواهید، کار پس‌زمینه را از یک عامل اصلی ایجاد می‌کنند.
    - **TUI:** به Gateway وصل شوید و بین عامل‌ها/نشست‌ها جابه‌جا شوید.

    مستندات: [Nodeها](/fa/nodes)، [دسترسی راه دور](/fa/gateway/remote)، [مسیریابی چندعامله](/fa/concepts/multi-agent)، [زیرعامل‌ها](/fa/tools/subagents)، [TUI](/fa/web/tui).

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

    مقدار پیش‌فرض `false` است (با رابط گرافیکی). اجرای بدون رابط گرافیکی در برخی سایت‌ها بیشتر احتمال دارد بررسی‌های ضدبات را فعال کند. [مرورگر](/fa/tools/browser) را ببینید.

    اجرای بدون رابط گرافیکی از **همان موتور Chromium** استفاده می‌کند و برای بیشتر اتوماسیون‌ها (فرم‌ها، کلیک‌ها، scraping، ورودها) کار می‌کند. تفاوت‌های اصلی:

    - پنجره مرورگر قابل مشاهده نیست (اگر به تصویر نیاز دارید، از اسکرین‌شات استفاده کنید).
    - بعضی سایت‌ها نسبت به اتوماسیون در حالت بدون رابط گرافیکی سخت‌گیرترند (کپچاها، ضدبات).
      برای مثال، X/Twitter اغلب نشست‌های بدون رابط گرافیکی را مسدود می‌کند.

  </Accordion>

  <Accordion title="چگونه از Brave برای کنترل مرورگر استفاده کنم؟">
    `browser.executablePath` را روی فایل اجرایی Brave خود (یا هر مرورگر مبتنی بر Chromium) تنظیم کنید و Gateway را دوباره راه‌اندازی کنید.
    نمونه‌های کامل پیکربندی را در [مرورگر](/fa/tools/browser#use-brave-or-another-chromium-based-browser) ببینید.
  </Accordion>
</AccordionGroup>

## Gatewayها و Nodeهای راه دور

<AccordionGroup>
  <Accordion title="دستورها چگونه بین Telegram، Gateway، و Nodeها منتشر می‌شوند؟">
    پیام‌های Telegram توسط **Gateway** مدیریت می‌شوند. Gateway عامل را اجرا می‌کند و
    فقط سپس وقتی به ابزار Node نیاز باشد، از طریق **وب‌سوکت Gateway** با Nodeها تماس می‌گیرد:

    Telegram → Gateway → عامل → `node.*` → Node → Gateway → Telegram

    Nodeها ترافیک ورودی ارائه‌دهنده را نمی‌بینند؛ آن‌ها فقط فراخوانی‌های RPC مربوط به Node را دریافت می‌کنند.

  </Accordion>

  <Accordion title="اگر Gateway از راه دور میزبانی شده باشد، عامل من چگونه می‌تواند به رایانه من دسترسی داشته باشد؟">
    پاسخ کوتاه: **رایانه خود را به‌عنوان یک Node جفت کنید**. Gateway جای دیگری اجرا می‌شود، اما می‌تواند
    ابزارهای `node.*` (صفحه‌نمایش، دوربین، سیستم) را روی دستگاه محلی شما از طریق وب‌سوکت Gateway فراخوانی کند.

    راه‌اندازی معمول:

    1. Gateway را روی میزبان همیشه‌روشن (VPS/سرور خانگی) اجرا کنید.
    2. میزبان Gateway و رایانه خود را در یک tailnet مشترک قرار دهید.
    3. مطمئن شوید WS Gateway در دسترس است (اتصال tailnet یا تونل SSH).
    4. برنامه macOS را به‌صورت محلی باز کنید و در حالت **راه دور از طریق SSH** (یا tailnet مستقیم) وصل شوید
       تا بتواند به‌عنوان یک Node ثبت شود.
    5. Node را روی Gateway تأیید کنید:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    هیچ پل TCP جداگانه‌ای لازم نیست؛ Nodeها از طریق وب‌سوکت Gateway وصل می‌شوند.

    یادآوری امنیتی: جفت‌کردن یک Node macOS اجازه `system.run` را روی آن دستگاه می‌دهد. فقط
    دستگاه‌هایی را جفت کنید که به آن‌ها اعتماد دارید، و [امنیت](/fa/gateway/security) را مرور کنید.

    مستندات: [Nodeها](/fa/nodes)، [پروتکل Gateway](/fa/gateway/protocol)، [حالت راه دور macOS](/fa/platforms/mac/remote)، [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="Tailscale وصل است اما پاسخی نمی‌گیرم. حالا چه کنم؟">
    موارد پایه را بررسی کنید:

    - Gateway در حال اجرا است: `openclaw gateway status`
    - سلامت Gateway: `openclaw status`
    - سلامت کانال: `openclaw channels status`

    سپس احراز هویت و مسیریابی را بررسی کنید:

    - اگر از Tailscale Serve استفاده می‌کنید، مطمئن شوید `gateway.auth.allowTailscale` درست تنظیم شده است.
    - اگر از طریق تونل SSH وصل می‌شوید، تأیید کنید تونل محلی فعال است و به پورت درست اشاره می‌کند.
    - تأیید کنید فهرست‌های مجاز شما (پیام مستقیم یا گروه) حساب شما را شامل می‌شوند.

    مستندات: [Tailscale](/fa/gateway/tailscale)، [دسترسی راه دور](/fa/gateway/remote)، [کانال‌ها](/fa/channels).

  </Accordion>

  <Accordion title="آیا دو نمونه OpenClaw می‌توانند با هم صحبت کنند (محلی + VPS)؟">
    بله. پل داخلی "ربات به ربات" وجود ندارد، اما می‌توانید آن را به چند روش
    قابل اعتماد سیم‌کشی کنید:

    **ساده‌ترین:** از یک کانال چت معمولی استفاده کنید که هر دو ربات به آن دسترسی دارند (Telegram/Slack/WhatsApp).
    بگذارید ربات A پیامی به ربات B بفرستد، سپس ربات B مثل همیشه پاسخ دهد.

    **پل CLI (عمومی):** اسکریپتی اجرا کنید که Gateway دیگر را با
    `openclaw agent --message ... --deliver` فراخوانی کند، و چتی را هدف بگیرد که ربات دیگر
    در آن گوش می‌دهد. اگر یک ربات روی VPS راه دور است، CLI خود را از طریق SSH/Tailscale
    به آن Gateway راه دور اشاره دهید ([دسترسی راه دور](/fa/gateway/remote) را ببینید).

    الگوی نمونه (از دستگاهی اجرا کنید که می‌تواند به Gateway هدف دسترسی داشته باشد):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نکته: یک حفاظ اضافه کنید تا دو ربات بی‌پایان در حلقه نیفتند (فقط با mention، فهرست‌های مجاز
    کانال، یا قانون "به پیام‌های ربات پاسخ نده").

    مستندات: [دسترسی راه دور](/fa/gateway/remote)، [CLI عامل](/fa/cli/agent)، [ارسال عامل](/fa/tools/agent-send).

  </Accordion>

  <Accordion title="آیا برای چند عامل به VPSهای جداگانه نیاز دارم؟">
    خیر. یک Gateway می‌تواند چند عامل را میزبانی کند، هرکدام با فضای کاری، پیش‌فرض‌های مدل،
    و مسیریابی خودش. این راه‌اندازی معمول است و بسیار ارزان‌تر و ساده‌تر از اجرای
    یک VPS برای هر عامل است.

    فقط وقتی از VPSهای جداگانه استفاده کنید که به ایزولاسیون سخت (مرزهای امنیتی) یا پیکربندی‌های
    بسیار متفاوتی نیاز دارید که نمی‌خواهید مشترک باشند. در غیر این صورت، یک Gateway نگه دارید و
    از چند عامل یا زیرعامل استفاده کنید.

  </Accordion>

  <Accordion title="آیا استفاده از یک Node روی لپ‌تاپ شخصی‌ام به‌جای SSH از یک VPS مزیتی دارد؟">
    بله - Nodeها راه درجه‌یک دسترسی به لپ‌تاپ شما از یک Gateway راه دور هستند، و
    فراتر از دسترسی پوسته را فعال می‌کنند. Gateway روی macOS/Linux (Windows از طریق WSL2) اجرا می‌شود و
    سبک است (یک VPS کوچک یا دستگاهی در حد Raspberry Pi کافی است؛ 4 GB RAM کاملا کافی است)، بنابراین یک
    راه‌اندازی رایج، یک میزبان همیشه‌روشن به‌همراه لپ‌تاپ شما به‌عنوان Node است.

    - **به SSH ورودی نیاز نیست.** Nodeها به وب‌سوکت Gateway اتصال خروجی برقرار می‌کنند و از جفت‌سازی دستگاه استفاده می‌کنند.
    - **کنترل‌های اجرای ایمن‌تر.** `system.run` با فهرست‌های مجاز/تأییدیه‌های Node روی همان لپ‌تاپ کنترل می‌شود.
    - **ابزارهای دستگاه بیشتر.** Nodeها علاوه بر `system.run`، `canvas`، `camera`، و `screen` را در دسترس می‌گذارند.
    - **اتوماسیون مرورگر محلی.** Gateway را روی VPS نگه دارید، اما Chrome را به‌صورت محلی از طریق میزبان Node روی لپ‌تاپ اجرا کنید، یا از طریق Chrome MCP به Chrome محلی روی میزبان متصل شوید.

    SSH برای دسترسی پوسته موردی مناسب است، اما Nodeها برای جریان‌های کاری مداوم عامل و
    اتوماسیون دستگاه ساده‌ترند.

    مستندات: [Nodeها](/fa/nodes)، [CLI Nodeها](/fa/cli/nodes)، [مرورگر](/fa/tools/browser).

  </Accordion>

  <Accordion title="آیا Nodeها سرویس Gateway اجرا می‌کنند؟">
    خیر. فقط **یک gateway** باید روی هر میزبان اجرا شود مگر این‌که عمدا پروفایل‌های ایزوله اجرا کنید ([چند Gateway](/fa/gateway/multiple-gateways) را ببینید). Nodeها پیرامونی‌هایی هستند که به gateway وصل می‌شوند
    (Nodeهای iOS/Android، یا "حالت Node" macOS در برنامه نوار منو). برای میزبان‌های Node بدون رابط گرافیکی
    و کنترل CLI، [CLI میزبان Node](/fa/cli/node) را ببینید.

    برای تغییرات `gateway`، `discovery`، و `canvasHost` راه‌اندازی مجدد کامل لازم است.

  </Accordion>

  <Accordion title="آیا راه API / RPC برای اعمال پیکربندی وجود دارد؟">
    بله.

    - `config.schema.lookup`: پیش از نوشتن، یک زیردرخت پیکربندی را همراه با گره طرح‌واره کم‌عمق آن، راهنمای UI منطبق، و خلاصه‌های فرزندان بلافصل بررسی می‌کند
    - `config.get`: تصویر لحظه‌ای فعلی + هش را دریافت می‌کند
    - `config.patch`: به‌روزرسانی جزئی ایمن (برای بیشتر ویرایش‌های RPC ترجیح داده می‌شود)؛ هرجا ممکن باشد hot-reload می‌کند و هرجا لازم باشد راه‌اندازی مجدد انجام می‌دهد
    - `config.apply`: اعتبارسنجی + جایگزینی کامل پیکربندی؛ هرجا ممکن باشد hot-reload می‌کند و هرجا لازم باشد راه‌اندازی مجدد انجام می‌دهد
    - ابزار زمان‌اجرای فقط-مالک `gateway` همچنان از بازنویسی `tools.exec.ask` / `tools.exec.security` خودداری می‌کند؛ نام‌های مستعار قدیمی `tools.bash.*` به همان مسیرهای محافظت‌شده exec نرمال‌سازی می‌شوند

  </Accordion>

  <Accordion title="حداقل پیکربندی معقول برای نصب نخست">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    این کار فضای کاری شما را تنظیم می‌کند و محدود می‌کند چه کسی بتواند ربات را فعال کند.

  </Accordion>

  <Accordion title="چگونه Tailscale را روی یک VPS راه‌اندازی کنم و از Mac خود وصل شوم؟">
    گام‌های حداقلی:

    1. **نصب + ورود روی VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **نصب + ورود روی Mac**
       - از برنامه Tailscale استفاده کنید و به همان tailnet وارد شوید.
    3. **فعال‌سازی MagicDNS (پیشنهادی)**
       - در کنسول مدیریت Tailscale، MagicDNS را فعال کنید تا VPS یک نام پایدار داشته باشد.
    4. **استفاده از نام میزبان tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    اگر Control UI را بدون SSH می‌خواهید، از Tailscale Serve روی VPS استفاده کنید:

    ```bash
    openclaw gateway --tailscale serve
    ```

    این کار Gateway را مقید به loopback نگه می‌دارد و HTTPS را از طریق Tailscale در دسترس قرار می‌دهد. [Tailscale](/fa/gateway/tailscale) را ببینید.

  </Accordion>

  <Accordion title="چگونه یک Node روی Mac را به Gateway راه‌دور وصل کنم (Tailscale Serve)؟">
    Serve، **Control UI مربوط به Gateway + WS** را در دسترس قرار می‌دهد. Nodeها از طریق همان نقطه پایانی Gateway WS وصل می‌شوند.

    راه‌اندازی پیشنهادی:

    1. **مطمئن شوید VPS + Mac روی یک tailnet هستند**.
    2. **از برنامه macOS در حالت راه‌دور استفاده کنید** (هدف SSH می‌تواند نام میزبان tailnet باشد).
       برنامه درگاه Gateway را تونل می‌کند و به‌عنوان یک Node وصل می‌شود.
    3. **Node را روی Gateway تأیید کنید**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    مستندات: [پروتکل Gateway](/fa/gateway/protocol)، [کشف](/fa/gateway/discovery)، [حالت راه‌دور macOS](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="آیا باید روی لپ‌تاپ دوم نصب کنم یا فقط یک Node اضافه کنم؟">
    اگر روی لپ‌تاپ دوم فقط به **ابزارهای محلی** (صفحه/دوربین/exec) نیاز دارید، آن را به‌عنوان یک
    **Node** اضافه کنید. این کار یک Gateway واحد نگه می‌دارد و از پیکربندی تکراری جلوگیری می‌کند. ابزارهای Node محلی
    در حال حاضر فقط برای macOS هستند، اما قصد داریم آن‌ها را به سیستم‌عامل‌های دیگر نیز گسترش دهیم.

    فقط زمانی یک Gateway دوم نصب کنید که به **جداسازی سخت‌گیرانه** یا دو ربات کاملاً جداگانه نیاز دارید.

    مستندات: [Nodeها](/fa/nodes)، [CLI مربوط به Nodeها](/fa/cli/nodes)، [چند Gateway](/fa/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغیرهای محیطی و بارگذاری .env

<AccordionGroup>
  <Accordion title="OpenClaw چگونه متغیرهای محیطی را بارگذاری می‌کند؟">
    OpenClaw متغیرهای محیطی را از فرایند والد (پوسته، launchd/systemd، CI، و غیره) می‌خواند و افزون بر آن موارد زیر را بارگذاری می‌کند:

    - `.env` از دایرکتوری کاری فعلی
    - یک `.env` سراسری جایگزین از `~/.openclaw/.env` (همان `$OPENCLAW_STATE_DIR/.env`)

    هیچ‌کدام از فایل‌های `.env` متغیرهای محیطی موجود را بازنویسی نمی‌کنند.

    همچنین می‌توانید متغیرهای محیطی درون‌خطی را در پیکربندی تعریف کنید (فقط اگر در محیط فرایند موجود نباشند اعمال می‌شوند):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    برای ترتیب تقدم کامل و منابع، [/environment](/fa/help/environment) را ببینید.

  </Accordion>

  <Accordion title="Gateway را از طریق سرویس شروع کردم و متغیرهای محیطی من ناپدید شدند. حالا چه کنم؟">
    دو راه‌حل رایج:

    1. کلیدهای گم‌شده را در `~/.openclaw/.env` قرار دهید تا حتی وقتی سرویس محیط پوسته شما را به ارث نمی‌برد هم برداشته شوند.
    2. وارد کردن پوسته را فعال کنید (امکان راحتی opt-in):

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

    این کار پوسته ورود شما را اجرا می‌کند و فقط کلیدهای مورد انتظارِ گم‌شده را وارد می‌کند (هرگز بازنویسی نمی‌کند). معادل‌های متغیر محیطی:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='من COPILOT_GITHUB_TOKEN را تنظیم کردم، اما وضعیت مدل‌ها "Shell env: off." نشان می‌دهد. چرا؟'>
    `openclaw models status` گزارش می‌دهد آیا **وارد کردن محیط پوسته** فعال است یا نه. "Shell env: off"
    به این معنی **نیست** که متغیرهای محیطی شما گم شده‌اند - فقط یعنی OpenClaw پوسته ورود
    شما را به‌طور خودکار بارگذاری نمی‌کند.

    اگر Gateway به‌عنوان سرویس اجرا شود (launchd/systemd)، محیط پوسته شما را به ارث
    نمی‌برد. با انجام یکی از این‌ها اصلاح کنید:

    1. توکن را در `~/.openclaw/.env` قرار دهید:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. یا وارد کردن پوسته را فعال کنید (`env.shellEnv.enabled: true`).
    3. یا آن را به بلوک `env` در پیکربندی خود اضافه کنید (فقط اگر موجود نباشد اعمال می‌شود).

    سپس Gateway را راه‌اندازی مجدد کنید و دوباره بررسی کنید:

    ```bash
    openclaw models status
    ```

    توکن‌های Copilot از `COPILOT_GITHUB_TOKEN` خوانده می‌شوند (همچنین `GH_TOKEN` / `GITHUB_TOKEN`).
    [/concepts/model-providers](/fa/concepts/model-providers) و [/environment](/fa/help/environment) را ببینید.

  </Accordion>
</AccordionGroup>

## جلسه‌ها و چند گفت‌وگو

<AccordionGroup>
  <Accordion title="چگونه یک گفت‌وگوی تازه شروع کنم؟">
    `/new` یا `/reset` را به‌عنوان یک پیام مستقل بفرستید. [مدیریت جلسه](/fa/concepts/session) را ببینید.
  </Accordion>

  <Accordion title="اگر هرگز /new نفرستم، آیا جلسه‌ها خودکار بازنشانی می‌شوند؟">
    جلسه‌ها می‌توانند پس از `session.idleMinutes` منقضی شوند، اما این قابلیت **به‌طور پیش‌فرض غیرفعال است** (پیش‌فرض **0**).
    آن را روی یک مقدار مثبت بگذارید تا انقضای بیکاری فعال شود. وقتی فعال باشد، **پیام بعدی**
    پس از دوره بیکاری یک شناسه جلسه تازه برای آن کلید گفت‌وگو شروع می‌کند.
    این کار رونوشت‌ها را حذف نمی‌کند - فقط یک جلسه جدید شروع می‌کند.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="آیا راهی هست که تیمی از نمونه‌های OpenClaw بسازم (یک CEO و چندین agent)؟">
    بله، از طریق **مسیریابی چند-agent** و **زیر-agentها**. می‌توانید یک agent هماهنگ‌کننده
    و چند agent کاری با فضاهای کاری و مدل‌های جداگانه بسازید.

    با این حال، بهتر است این را یک **آزمایش سرگرم‌کننده** بدانید. مصرف توکن بالایی دارد و اغلب
    از استفاده از یک ربات با جلسه‌های جداگانه کم‌بازده‌تر است. مدل معمولی که
    در نظر داریم یک ربات است که با آن صحبت می‌کنید، با جلسه‌های مختلف برای کار موازی. همان
    ربات همچنین می‌تواند در صورت نیاز زیر-agentها را ایجاد کند.

    مستندات: [مسیریابی چند-agent](/fa/concepts/multi-agent)، [زیر-agentها](/fa/tools/subagents)، [CLI مربوط به Agentها](/fa/cli/agents).

  </Accordion>

  <Accordion title="چرا context وسط کار کوتاه شد؟ چگونه از آن جلوگیری کنم؟">
    context جلسه با پنجره مدل محدود می‌شود. گفت‌وگوهای طولانی، خروجی‌های بزرگ ابزارها، یا فایل‌های زیاد
    می‌توانند باعث Compaction یا کوتاه‌سازی شوند.

    کارهایی که کمک می‌کنند:

    - از ربات بخواهید وضعیت فعلی را خلاصه کند و آن را در یک فایل بنویسد.
    - پیش از کارهای طولانی از `/compact` استفاده کنید، و هنگام تغییر موضوع از `/new`.
    - context مهم را در فضای کاری نگه دارید و از ربات بخواهید دوباره آن را بخواند.
    - برای کارهای طولانی یا موازی از زیر-agentها استفاده کنید تا گفت‌وگوی اصلی کوچک‌تر بماند.
    - اگر این اتفاق زیاد رخ می‌دهد، مدلی با پنجره context بزرگ‌تر انتخاب کنید.

  </Accordion>

  <Accordion title="چگونه OpenClaw را کاملاً بازنشانی کنم اما نصب‌شده نگه دارم؟">
    از دستور بازنشانی استفاده کنید:

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

    - اگر onboarding پیکربندی موجودی ببیند، **Reset** را نیز پیشنهاد می‌کند. [Onboarding (CLI)](/fa/start/wizard) را ببینید.
    - اگر از پروفایل‌ها استفاده کرده‌اید (`--profile` / `OPENCLAW_PROFILE`)، هر دایرکتوری وضعیت را بازنشانی کنید (پیش‌فرض‌ها `~/.openclaw-<profile>` هستند).
    - بازنشانی توسعه: `openclaw gateway --dev --reset` (فقط برای توسعه؛ پیکربندی توسعه + اعتبارنامه‌ها + جلسه‌ها + فضای کاری را پاک می‌کند).

  </Accordion>

  <Accordion title='خطاهای "context too large" می‌گیرم - چگونه بازنشانی یا فشرده کنم؟'>
    از یکی از این‌ها استفاده کنید:

    - **فشرده‌سازی** (گفت‌وگو را نگه می‌دارد اما نوبت‌های قدیمی‌تر را خلاصه می‌کند):

      ```
      /compact
      ```

      یا `/compact <instructions>` برای هدایت خلاصه.

    - **بازنشانی** (شناسه جلسه تازه برای همان کلید گفت‌وگو):

      ```
      /new
      /reset
      ```

    اگر ادامه داشت:

    - **هرس جلسه** (`agents.defaults.contextPruning`) را فعال یا تنظیم کنید تا خروجی ابزارهای قدیمی کوتاه شود.
    - از مدلی با پنجره context بزرگ‌تر استفاده کنید.

    مستندات: [Compaction](/fa/concepts/compaction)، [هرس جلسه](/fa/concepts/session-pruning)، [مدیریت جلسه](/fa/concepts/session).

  </Accordion>

  <Accordion title='چرا "LLM request rejected: messages.content.tool_use.input field required" را می‌بینم؟'>
    این یک خطای اعتبارسنجی provider است: مدل یک بلوک `tool_use` بدون `input` الزامی
    منتشر کرده است. معمولاً یعنی تاریخچه جلسه کهنه یا خراب شده است (اغلب پس از رشته‌های طولانی
    یا تغییر ابزار/طرح‌واره).

    راه‌حل: با `/new` یک جلسه تازه شروع کنید (پیام مستقل).

  </Accordion>

  <Accordion title="چرا هر ۳۰ دقیقه پیام‌های Heartbeat دریافت می‌کنم؟">
    Heartbeatها به‌طور پیش‌فرض هر **30m** اجرا می‌شوند (هنگام استفاده از احراز هویت OAuth، **1h**). آن‌ها را تنظیم یا غیرفعال کنید:

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

    اگر `HEARTBEAT.md` وجود داشته باشد اما عملاً خالی باشد (فقط خط‌های خالی و سرآیندهای markdown
    مانند `# Heading`)، OpenClaw اجرای Heartbeat را برای صرفه‌جویی در فراخوانی‌های API رد می‌کند.
    اگر فایل وجود نداشته باشد، Heartbeat همچنان اجرا می‌شود و مدل تصمیم می‌گیرد چه کند.

    بازنویسی‌های هر-agent از `agents.list[].heartbeat` استفاده می‌کنند. مستندات: [Heartbeat](/fa/gateway/heartbeat).

  </Accordion>

  <Accordion title='آیا باید یک "حساب ربات" به یک گروه WhatsApp اضافه کنم؟'>
    نه. OpenClaw روی **حساب خودتان** اجرا می‌شود، بنابراین اگر شما در گروه باشید، OpenClaw می‌تواند آن را ببیند.
    به‌طور پیش‌فرض، پاسخ‌های گروهی تا زمانی که فرستنده‌ها را مجاز نکنید مسدود هستند (`groupPolicy: "allowlist"`).

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
    گزینه ۱ (سریع‌ترین): لاگ‌ها را دنبال کنید و یک پیام آزمایشی در گروه بفرستید:

    ```bash
    openclaw logs --follow --json
    ```

    دنبال `chatId` (یا `from`) بگردید که به `@g.us` ختم می‌شود، مانند:
    `1234567890-1234567890@g.us`.

    گزینه ۲ (اگر از پیش پیکربندی/allowlist شده است): گروه‌ها را از پیکربندی فهرست کنید:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    مستندات: [WhatsApp](/fa/channels/whatsapp)، [Directory](/fa/cli/directory)، [Logs](/fa/cli/logs).

  </Accordion>

  <Accordion title="چرا OpenClaw در گروه پاسخ نمی‌دهد؟">
    دو علت رایج:

    - محدودسازی بر اساس اشاره روشن است (پیش‌فرض). باید ربات را @mention کنید (یا با `mentionPatterns` منطبق شوید).
    - شما `channels.whatsapp.groups` را بدون `"*"` پیکربندی کرده‌اید و گروه در allowlist نیست.

    [گروه‌ها](/fa/channels/groups) و [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.

  </Accordion>

  <Accordion title="آیا گروه‌ها/رشته‌ها context را با پیام‌های مستقیم به اشتراک می‌گذارند؟">
    گفت‌وگوهای مستقیم به‌طور پیش‌فرض در جلسه اصلی ادغام می‌شوند. گروه‌ها/کانال‌ها کلیدهای جلسه خودشان را دارند، و موضوعات Telegram / رشته‌های Discord جلسه‌های جداگانه هستند. [گروه‌ها](/fa/channels/groups) و [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.
  </Accordion>

  <Accordion title="چند فضای کاری و عامل می‌توانم بسازم؟">
    محدودیت سختی وجود ندارد. ده‌ها مورد (حتی صدها مورد) مشکلی ندارد، اما مراقب این موارد باشید:

    - **رشد دیسک:** نشست‌ها + رونوشت‌ها زیر `~/.openclaw/agents/<agentId>/sessions/` قرار دارند.
    - **هزینه توکن:** عامل‌های بیشتر یعنی استفاده هم‌زمان بیشتر از مدل.
    - **سربار عملیاتی:** پروفایل‌های احراز هویت، فضاهای کاری، و مسیریابی کانال برای هر عامل.

    نکته‌ها:

    - برای هر عامل یک فضای کاری **فعال** نگه دارید (`agents.defaults.workspace`).
    - اگر دیسک رشد کرد، نشست‌های قدیمی را پاک‌سازی کنید (JSONL یا ورودی‌های ذخیره را حذف کنید).
    - برای پیدا کردن فضاهای کاری سرگردان و ناهماهنگی‌های پروفایل از `openclaw doctor` استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم چند بات یا چت را هم‌زمان اجرا کنم (Slack)، و چطور باید آن را راه‌اندازی کنم؟">
    بله. از **مسیریابی چندعاملی** استفاده کنید تا چند عامل ایزوله را اجرا کنید و پیام‌های ورودی را بر اساس
    کانال/حساب/همتا مسیریابی کنید. Slack به‌عنوان یک کانال پشتیبانی می‌شود و می‌تواند به عامل‌های مشخصی متصل شود.

    دسترسی مرورگر قدرتمند است، اما «هر کاری که انسان می‌تواند انجام دهد» نیست؛ ضدبات، CAPTCHAها، و MFA همچنان می‌توانند
    خودکارسازی را مسدود کنند. برای قابل‌اعتمادترین کنترل مرورگر، از Chrome MCP محلی روی میزبان استفاده کنید،
    یا از CDP روی همان ماشینی استفاده کنید که مرورگر را واقعاً اجرا می‌کند.

    راه‌اندازی پیشنهادی:

    - میزبان Gateway همیشه روشن (VPS/Mac mini).
    - یک عامل برای هر نقش (اتصال‌ها).
    - کانال‌های Slack متصل به آن عامل‌ها.
    - مرورگر محلی از طریق Chrome MCP یا یک node در صورت نیاز.

    مستندات: [مسیریابی چندعاملی](/fa/concepts/multi-agent), [Slack](/fa/channels/slack),
    [مرورگر](/fa/tools/browser), [Nodeها](/fa/nodes).

  </Accordion>
</AccordionGroup>

## مدل‌ها، failover، و پروفایل‌های احراز هویت

پرسش‌وپاسخ مدل‌ها — پیش‌فرض‌ها، انتخاب، aliasها، جابه‌جایی، failover، پروفایل‌های احراز هویت —
در [پرسش‌های متداول مدل‌ها](/fa/help/faq-models) قرار دارد.

## Gateway: پورت‌ها، «already running»، و حالت راه‌دور

<AccordionGroup>
  <Accordion title="Gateway از چه پورتی استفاده می‌کند؟">
    `gateway.port` تک پورت چندگانه‌شده برای WebSocket + HTTP (Control UI، hookها، و غیره) را کنترل می‌کند.

    اولویت:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='چرا openclaw gateway status می‌گوید "Runtime: running" اما "Connectivity probe: failed"؟'>
    چون «running» نمای **supervisor** است (launchd/systemd/schtasks). پروب اتصال، CLI است که واقعاً به WebSocket مربوط به gateway وصل می‌شود.

    از `openclaw gateway status` استفاده کنید و به این خط‌ها اعتماد کنید:

    - `Probe target:` (نشانی‌ای که پروب واقعاً استفاده کرده است)
    - `Listening:` (چیزی که واقعاً روی پورت bind شده است)
    - `Last gateway error:` (علت ریشه‌ای رایج وقتی فرایند زنده است اما پورت در حال گوش دادن نیست)

  </Accordion>

  <Accordion title='چرا openclaw gateway status مقدارهای "Config (cli)" و "Config (service)" متفاوت نشان می‌دهد؟'>
    شما یک فایل پیکربندی را ویرایش می‌کنید در حالی که سرویس با فایل دیگری اجرا می‌شود (اغلب ناهماهنگی `--profile` / `OPENCLAW_STATE_DIR`).

    رفع مشکل:

    ```bash
    openclaw gateway install --force
    ```

    این دستور را از همان `--profile` / محیطی اجرا کنید که می‌خواهید سرویس از آن استفاده کند.

  </Accordion>

  <Accordion title='عبارت "another gateway instance is already listening" یعنی چه؟'>
    OpenClaw با bind کردن فوری شنونده WebSocket هنگام شروع (پیش‌فرض `ws://127.0.0.1:18789`) یک قفل زمان اجرا اعمال می‌کند. اگر bind با `EADDRINUSE` شکست بخورد، `GatewayLockError` پرتاب می‌کند که نشان می‌دهد نمونه دیگری از قبل در حال گوش دادن است.

    رفع مشکل: نمونه دیگر را متوقف کنید، پورت را آزاد کنید، یا با `openclaw gateway --port <port>` اجرا کنید.

  </Accordion>

  <Accordion title="چطور OpenClaw را در حالت راه‌دور اجرا کنم (کلاینت به Gateway در جای دیگری وصل شود)؟">
    `gateway.mode: "remote"` را تنظیم کنید و به یک URL راه‌دور WebSocket اشاره کنید، به‌صورت اختیاری همراه با اعتبارنامه‌های راه‌دور shared-secret:

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

    - `openclaw gateway` فقط وقتی شروع می‌شود که `gateway.mode` برابر `local` باشد (یا flag override را پاس دهید).
    - برنامه macOS فایل پیکربندی را زیر نظر می‌گیرد و وقتی این مقدارها تغییر کنند، به‌صورت زنده حالت را عوض می‌کند.
    - `gateway.remote.token` / `.password` فقط اعتبارنامه‌های راه‌دور سمت کلاینت هستند؛ آن‌ها به‌تنهایی احراز هویت gateway محلی را فعال نمی‌کنند.

  </Accordion>

  <Accordion title='Control UI می‌گوید "unauthorized" (یا مدام دوباره وصل می‌شود). حالا چه کنم؟'>
    مسیر احراز هویت gateway شما با روش احراز هویت UI هم‌خوانی ندارد.

    واقعیت‌ها (از کد):

    - Control UI توکن را برای نشست تب فعلی مرورگر و URL انتخاب‌شده gateway در `sessionStorage` نگه می‌دارد، بنابراین refreshهای همان تب بدون بازگرداندن ماندگاری توکن طولانی‌مدت localStorage همچنان کار می‌کنند.
    - در `AUTH_TOKEN_MISMATCH`، کلاینت‌های مورد اعتماد می‌توانند وقتی gateway راهنمای retry برمی‌گرداند (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`)، یک تلاش دوباره محدود با device token کش‌شده انجام دهند.
    - آن retry با cached-token اکنون از scopeهای تأییدشده کش‌شده که همراه device token ذخیره شده‌اند دوباره استفاده می‌کند. فراخوان‌های explicit `deviceToken` / explicit `scopes` همچنان مجموعه scope درخواستی خود را نگه می‌دارند، به‌جای اینکه scopeهای کش‌شده را به ارث ببرند.
    - خارج از آن مسیر retry، اولویت احراز هویت اتصال ابتدا shared token/password صریح است، سپس `deviceToken` صریح، سپس device token ذخیره‌شده، سپس bootstrap token.
    - بررسی‌های scope مربوط به bootstrap token با پیشوند نقش هستند. allowlist داخلی bootstrap operator فقط درخواست‌های operator را برآورده می‌کند؛ node یا نقش‌های غیر operator دیگر همچنان به scopeها زیر پیشوند نقش خودشان نیاز دارند.

    رفع مشکل:

    - سریع‌ترین راه: `openclaw dashboard` (URL داشبورد را چاپ + کپی می‌کند، تلاش می‌کند باز کند؛ اگر headless باشد راهنمای SSH را نشان می‌دهد).
    - اگر هنوز توکن ندارید: `openclaw doctor --generate-gateway-token`.
    - اگر راه‌دور است، ابتدا tunnel بزنید: `ssh -N -L 18789:127.0.0.1:18789 user@host` سپس `http://127.0.0.1:18789/` را باز کنید.
    - حالت shared-secret: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` یا `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` را تنظیم کنید، سپس secret متناظر را در تنظیمات Control UI وارد کنید.
    - حالت Tailscale Serve: مطمئن شوید `gateway.auth.allowTailscale` فعال است و URL مربوط به Serve را باز می‌کنید، نه یک URL خام loopback/tailnet که headerهای هویت Tailscale را دور می‌زند.
    - حالت trusted-proxy: مطمئن شوید از طریق proxy آگاه از هویت پیکربندی‌شده می‌آیید، نه یک URL خام gateway. proxyهای loopback همان میزبان هم به `gateway.auth.trustedProxy.allowLoopback = true` نیاز دارند.
    - اگر پس از همان یک retry ناهماهنگی ادامه داشت، device token جفت‌شده را rotate/دوباره تأیید کنید:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - اگر آن فراخوان rotate گفت رد شده است، دو مورد را بررسی کنید:
      - نشست‌های paired-device فقط می‌توانند device **خودشان** را rotate کنند، مگر اینکه `operator.admin` هم داشته باشند
      - مقدارهای explicit `--scope` نمی‌توانند از scopeهای operator فعلی فراخواننده فراتر بروند
    - هنوز گیر کرده‌اید؟ `openclaw status --all` را اجرا کنید و [عیب‌یابی](/fa/gateway/troubleshooting) را دنبال کنید. برای جزئیات احراز هویت [داشبورد](/fa/web/dashboard) را ببینید.

  </Accordion>

  <Accordion title="gateway.bind را روی tailnet گذاشتم اما نمی‌تواند bind کند و هیچ‌چیز گوش نمی‌دهد">
    bind مربوط به `tailnet` یک IP از Tailscale را از interfaceهای شبکه شما انتخاب می‌کند (100.64.0.0/10). اگر ماشین روی Tailscale نباشد (یا interface پایین باشد)، چیزی برای bind کردن وجود ندارد.

    رفع مشکل:

    - Tailscale را روی آن میزبان شروع کنید (تا یک نشانی 100.x داشته باشد)، یا
    - به `gateway.bind: "loopback"` / `"lan"` تغییر دهید.

    نکته: `tailnet` صریح است. `auto` loopback را ترجیح می‌دهد؛ وقتی bind فقط برای tailnet می‌خواهید، از `gateway.bind: "tailnet"` استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم چند Gateway را روی یک میزبان اجرا کنم؟">
    معمولاً نه - یک Gateway می‌تواند چند کانال پیام‌رسانی و عامل را اجرا کند. فقط وقتی از چند Gateway استفاده کنید که به افزونگی (مثلاً: بات نجات) یا ایزولاسیون سخت نیاز دارید.

    بله، اما باید ایزوله کنید:

    - `OPENCLAW_CONFIG_PATH` (پیکربندی برای هر نمونه)
    - `OPENCLAW_STATE_DIR` (state برای هر نمونه)
    - `agents.defaults.workspace` (ایزولاسیون فضای کاری)
    - `gateway.port` (پورت‌های یکتا)

    راه‌اندازی سریع (پیشنهادی):

    - برای هر نمونه از `openclaw --profile <name> ...` استفاده کنید (به‌صورت خودکار `~/.openclaw-<name>` می‌سازد).
    - در پیکربندی هر پروفایل یک `gateway.port` یکتا تنظیم کنید (یا برای اجرای دستی `--port` را پاس دهید).
    - سرویس مخصوص هر پروفایل را نصب کنید: `openclaw --profile <name> gateway install`.

    پروفایل‌ها پسوندی هم به نام سرویس‌ها اضافه می‌کنند (`ai.openclaw.<profile>`؛ legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    راهنمای کامل: [چند gateway](/fa/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='عبارت "invalid handshake" / کد 1008 یعنی چه؟'>
    Gateway یک **سرور WebSocket** است، و انتظار دارد اولین پیام
    یک frame از نوع `connect` باشد. اگر چیز دیگری دریافت کند، اتصال را
    با **کد 1008** (نقض policy) می‌بندد.

    علت‌های رایج:

    - شما URL مربوط به **HTTP** را در مرورگر باز کرده‌اید (`http://...`) به‌جای یک کلاینت WS.
    - از پورت یا مسیر اشتباه استفاده کرده‌اید.
    - یک proxy یا tunnel، headerهای احراز هویت را حذف کرده یا یک درخواست غیر Gateway فرستاده است.

    رفع سریع:

    1. از URL مربوط به WS استفاده کنید: `ws://<host>:18789` (یا اگر HTTPS است `wss://...`).
    2. پورت WS را در یک تب معمولی مرورگر باز نکنید.
    3. اگر احراز هویت فعال است، token/password را در frame مربوط به `connect` وارد کنید.

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
    لاگ‌های فایل (ساخت‌یافته):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    می‌توانید از طریق `logging.file` یک مسیر پایدار تنظیم کنید. سطح لاگ فایل با `logging.level` کنترل می‌شود. میزان جزئیات کنسول با `--verbose` و `logging.consoleLevel` کنترل می‌شود.

    سریع‌ترین دنبال کردن لاگ:

    ```bash
    openclaw logs --follow
    ```

    لاگ‌های سرویس/supervisor (وقتی gateway از طریق launchd/systemd اجرا می‌شود):

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

    اگر gateway را دستی اجرا می‌کنید، `openclaw gateway --force` می‌تواند پورت را بازپس بگیرد. [Gateway](/fa/gateway) را ببینید.

  </Accordion>

  <Accordion title="ترمینالم را روی Windows بستم - چطور OpenClaw را restart کنم؟">
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

    **2) Windows بومی (پیشنهاد نمی‌شود):** Gateway مستقیماً در Windows اجرا می‌شود.

    PowerShell را باز کنید و اجرا کنید:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر آن را دستی اجرا می‌کنید (بدون سرویس)، استفاده کنید از:

    ```powershell
    openclaw gateway run
    ```

    مستندات: [Windows (WSL2)](/fa/platforms/windows), [راهنمای عملیاتی سرویس Gateway](/fa/gateway).

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

    - احراز هویت مدل روی **میزبان Gateway** بارگذاری نشده است (`models status` را بررسی کنید).
    - جفت‌سازی/allowlist کانال جلوی پاسخ‌ها را می‌گیرد (پیکربندی کانال و لاگ‌ها را بررسی کنید).
    - WebChat/Dashboard بدون توکن درست باز است.

    اگر راه دور هستید، تأیید کنید اتصال تونل/Tailscale برقرار است و
    WebSocket مربوط به Gateway در دسترس است.

    مستندات: [کانال‌ها](/fa/channels)، [عیب‌یابی](/fa/gateway/troubleshooting)، [دسترسی راه دور](/fa/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - حالا چه؟'>
    این معمولاً یعنی UI اتصال WebSocket را از دست داده است. بررسی کنید:

    1. آیا Gateway در حال اجراست؟ `openclaw gateway status`
    2. آیا Gateway سالم است؟ `openclaw status`
    3. آیا UI توکن درست را دارد؟ `openclaw dashboard`
    4. اگر راه دور است، آیا لینک تونل/Tailscale برقرار است؟

    سپس لاگ‌ها را دنبال کنید:

    ```bash
    openclaw logs --follow
    ```

    مستندات: [Dashboard](/fa/web/dashboard)، [دسترسی راه دور](/fa/gateway/remote)، [عیب‌یابی](/fa/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands ناموفق می‌شود. چه چیزی را باید بررسی کنم؟">
    از لاگ‌ها و وضعیت کانال شروع کنید:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    سپس خطا را تطبیق دهید:

    - `BOT_COMMANDS_TOO_MUCH`: منوی Telegram ورودی‌های بیش از حدی دارد. OpenClaw از قبل تعداد را تا سقف Telegram کم می‌کند و با فرمان‌های کمتر دوباره تلاش می‌کند، اما هنوز بعضی ورودی‌های منو باید حذف شوند. فرمان‌های plugin/skill/سفارشی را کاهش دهید، یا اگر به منو نیاز ندارید `channels.telegram.commands.native` را غیرفعال کنید.
    - `TypeError: fetch failed`، `Network request for 'setMyCommands' failed!`، یا خطاهای شبکه مشابه: اگر روی VPS هستید یا پشت پراکسی قرار دارید، تأیید کنید HTTPS خروجی مجاز است و DNS برای `api.telegram.org` کار می‌کند.

    اگر Gateway راه دور است، مطمئن شوید لاگ‌ها را روی میزبان Gateway می‌بینید.

    مستندات: [Telegram](/fa/channels/telegram)، [عیب‌یابی کانال](/fa/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI هیچ خروجی‌ای نشان نمی‌دهد. چه چیزی را باید بررسی کنم؟">
    ابتدا تأیید کنید Gateway قابل دسترسی است و agent می‌تواند اجرا شود:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    در TUI، از `/status` برای دیدن وضعیت فعلی استفاده کنید. اگر انتظار پاسخ در یک کانال چت دارید،
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
    وقتی Gateway به‌صورت daemon در پس‌زمینه اجرا می‌شود از این استفاده کنید.

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
    اجرای یک‌باره و پیش‌زمینه می‌خواهید از `openclaw gateway` استفاده کنید.

  </Accordion>

  <Accordion title="سریع‌ترین راه برای گرفتن جزئیات بیشتر وقتی چیزی ناموفق می‌شود">
    Gateway را با `--verbose` شروع کنید تا جزئیات کنسول بیشتری بگیرید. سپس فایل لاگ را برای احراز هویت کانال، مسیریابی مدل، و خطاهای RPC بررسی کنید.
  </Accordion>
</AccordionGroup>

## رسانه و پیوست‌ها

<AccordionGroup>
  <Accordion title="Skill من یک تصویر/PDF تولید کرد، اما چیزی ارسال نشد">
    پیوست‌های خروجی از agent باید شامل یک خط `MEDIA:<path-or-url>` باشند (در خط جداگانه خودش). [راه‌اندازی دستیار OpenClaw](/fa/start/openclaw) و [ارسال agent](/fa/tools/agent-send) را ببینید.

    ارسال با CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    همچنین بررسی کنید:

    - کانال مقصد از رسانه خروجی پشتیبانی می‌کند و توسط allowlist مسدود نشده است.
    - فایل در محدوده اندازه provider است (تصاویر تا حداکثر 2048px تغییر اندازه داده می‌شوند).
    - `tools.fs.workspaceOnly=true` ارسال‌های مسیر محلی را به workspace، temp/media-store، و فایل‌های تأییدشده توسط sandbox محدود نگه می‌دارد.
    - `tools.fs.workspaceOnly=false` اجازه می‌دهد `MEDIA:` فایل‌های محلی میزبان را که agent از قبل می‌تواند بخواند ارسال کند، اما فقط برای رسانه و انواع سند امن (تصویر، صدا، ویدیو، PDF، و اسناد Office). متن ساده و فایل‌های شبیه راز همچنان مسدود می‌شوند.

    [تصاویر](/fa/nodes/images) را ببینید.

  </Accordion>
</AccordionGroup>

## امنیت و کنترل دسترسی

<AccordionGroup>
  <Accordion title="آیا در معرض DMهای ورودی قرار دادن OpenClaw امن است؟">
    DMهای ورودی را ورودی غیرقابل اعتماد در نظر بگیرید. پیش‌فرض‌ها برای کاهش ریسک طراحی شده‌اند:

    - رفتار پیش‌فرض در کانال‌های دارای قابلیت DM، **جفت‌سازی** است:
      - فرستنده‌های ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ بات پیام آن‌ها را پردازش نمی‌کند.
      - با این فرمان تأیید کنید: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - درخواست‌های معلق به **3 عدد برای هر کانال** محدود می‌شوند؛ اگر کدی نرسید، `openclaw pairing list --channel <channel> [--account <id>]` را بررسی کنید.
    - باز کردن عمومی DMها نیاز به opt-in صریح دارد (`dmPolicy: "open"` و allowlist `"*"`).

    برای آشکار کردن سیاست‌های پرریسک DM، `openclaw doctor` را اجرا کنید.

  </Accordion>

  <Accordion title="آیا prompt injection فقط برای بات‌های عمومی نگرانی است؟">
    نه. prompt injection درباره **محتوای غیرقابل اعتماد** است، نه فقط اینکه چه کسی می‌تواند به بات DM بدهد.
    اگر دستیار شما محتوای خارجی را می‌خواند (جست‌وجو/واکشی وب، صفحه‌های مرورگر، ایمیل‌ها،
    مستندات، پیوست‌ها، لاگ‌های چسبانده‌شده)، آن محتوا می‌تواند شامل دستورهایی باشد که تلاش می‌کنند
    مدل را منحرف کنند. این حتی وقتی **شما تنها فرستنده هستید** هم می‌تواند رخ دهد.

    بزرگ‌ترین ریسک وقتی است که ابزارها فعال هستند: مدل می‌تواند فریب بخورد تا
    context را بیرون بکشد یا از طرف شما ابزارها را فراخوانی کند. دامنه اثر را با این کارها کاهش دهید:

    - استفاده از یک agent «خواننده» فقط‌خواندنی یا بدون ابزار برای خلاصه کردن محتوای غیرقابل اعتماد
    - خاموش نگه داشتن `web_search` / `web_fetch` / `browser` برای agentهای دارای ابزار
    - متن رمزگشایی‌شده فایل/سند را هم غیرقابل اعتماد در نظر بگیرید: OpenResponses
      `input_file` و استخراج پیوست رسانه هر دو متن استخراج‌شده را به‌جای عبور دادن متن خام فایل،
      در نشانگرهای مرزی صریح محتوای خارجی قرار می‌دهند
    - sandbox کردن و allowlistهای سخت‌گیرانه ابزارها

    جزئیات: [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="آیا بات من باید ایمیل، حساب GitHub، یا شماره تلفن خودش را داشته باشد؟">
    بله، برای بیشتر راه‌اندازی‌ها. جدا کردن بات با حساب‌ها و شماره تلفن‌های جداگانه
    دامنه اثر را اگر مشکلی پیش بیاید کاهش می‌دهد. این همچنین چرخاندن
    اعتبارنامه‌ها یا لغو دسترسی را بدون اثر گذاشتن بر حساب‌های شخصی شما آسان‌تر می‌کند.

    کوچک شروع کنید. فقط به ابزارها و حساب‌هایی که واقعاً نیاز دارید دسترسی بدهید، و
    بعداً در صورت نیاز گسترش دهید.

    مستندات: [امنیت](/fa/gateway/security)، [جفت‌سازی](/fa/channels/pairing).

  </Accordion>

  <Accordion title="آیا می‌توانم به آن اختیار پیامک‌هایم را بدهم و آیا این امن است؟">
    ما اختیار کامل روی پیام‌های شخصی شما را توصیه **نمی‌کنیم**. امن‌ترین الگو این است:

    - DMها را در **حالت جفت‌سازی** یا یک allowlist محدود نگه دارید.
    - اگر می‌خواهید از طرف شما پیام بدهد، از یک **شماره یا حساب جداگانه** استفاده کنید.
    - بگذارید پیش‌نویس کند، سپس **قبل از ارسال تأیید کنید**.

    اگر می‌خواهید آزمایش کنید، این کار را روی یک حساب اختصاصی انجام دهید و آن را جدا نگه دارید. ببینید
    [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="آیا می‌توانم برای کارهای دستیار شخصی از مدل‌های ارزان‌تر استفاده کنم؟">
    بله، **اگر** agent فقط چت است و ورودی قابل اعتماد است. رده‌های کوچک‌تر
    در برابر ربایش دستور آسیب‌پذیرتر هستند، پس برای agentهای دارای ابزار
    یا هنگام خواندن محتوای غیرقابل اعتماد از آن‌ها پرهیز کنید. اگر مجبورید از مدل کوچک‌تر استفاده کنید، ابزارها را قفل کنید
    و داخل sandbox اجرا کنید. [امنیت](/fa/gateway/security) را ببینید.
  </Accordion>

  <Accordion title="در Telegram، /start را اجرا کردم اما کد جفت‌سازی نگرفتم">
    کدهای جفت‌سازی **فقط** وقتی ارسال می‌شوند که یک فرستنده ناشناس به بات پیام بدهد و
    `dmPolicy: "pairing"` فعال باشد. `/start` به‌تنهایی کد تولید نمی‌کند.

    درخواست‌های معلق را بررسی کنید:

    ```bash
    openclaw pairing list telegram
    ```

    اگر دسترسی فوری می‌خواهید، شناسه فرستنده خود را در allowlist بگذارید یا `dmPolicy: "open"`
    را برای آن حساب تنظیم کنید.

  </Accordion>

  <Accordion title="WhatsApp: آیا به مخاطبان من پیام می‌دهد؟ جفت‌سازی چطور کار می‌کند؟">
    نه. سیاست پیش‌فرض DM در WhatsApp، **جفت‌سازی** است. فرستنده‌های ناشناس فقط یک کد جفت‌سازی می‌گیرند و پیام آن‌ها **پردازش نمی‌شود**. OpenClaw فقط به چت‌هایی پاسخ می‌دهد که دریافت می‌کند یا به ارسال‌های صریحی که شما فعال می‌کنید.

    جفت‌سازی را با این فرمان تأیید کنید:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    درخواست‌های معلق را فهرست کنید:

    ```bash
    openclaw pairing list whatsapp
    ```

    درخواست شماره تلفن در wizard: برای تنظیم **allowlist/مالک** شما استفاده می‌شود تا DMهای خودتان مجاز باشند. برای ارسال خودکار استفاده نمی‌شود. اگر روی شماره شخصی WhatsApp خود اجرا می‌کنید، از همان شماره استفاده کنید و `channels.whatsapp.selfChatMode` را فعال کنید.

  </Accordion>
</AccordionGroup>

## فرمان‌های چت، لغو کردن کارها، و «متوقف نمی‌شود»

<AccordionGroup>
  <Accordion title="چطور جلوی نمایش پیام‌های داخلی سیستم در چت را بگیرم؟">
    بیشتر پیام‌های داخلی یا ابزار فقط وقتی ظاهر می‌شوند که **verbose**، **trace**، یا **reasoning** برای آن نشست فعال باشد.

    در همان چتی که آن را می‌بینید اصلاح کنید:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    اگر هنوز پرنویز است، تنظیمات نشست را در Control UI بررسی کنید و verbose
    را روی **inherit** بگذارید. همچنین تأیید کنید از پروفایل باتی استفاده نمی‌کنید که `verboseDefault` در پیکربندی روی
    `on` تنظیم شده باشد.

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

    برای فرایندهای پس‌زمینه (از ابزار exec)، می‌توانید از agent بخواهید اجرا کند:

    ```
    process action:kill sessionId:XXX
    ```

    نمای کلی فرمان‌های اسلش: [فرمان‌های اسلش](/fa/tools/slash-commands) را ببینید.

    بیشتر فرمان‌ها باید به‌صورت یک پیام **مستقل** که با `/` شروع می‌شود ارسال شوند، اما چند میان‌بر (مثل `/status`) برای فرستنده‌های موجود در allowlist به‌صورت inline هم کار می‌کنند.

  </Accordion>

  <Accordion title='چطور از Telegram یک پیام Discord بفرستم؟ ("Cross-context messaging denied")'>
    OpenClaw پیام‌رسانی **بین providerها** را به‌صورت پیش‌فرض مسدود می‌کند. اگر یک فراخوانی ابزار به
    Telegram مقید باشد، به Discord ارسال نمی‌کند مگر اینکه صریحاً آن را مجاز کنید.

    پیام‌رسانی بین providerها را برای agent فعال کنید:

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

  <Accordion title='چرا به نظر می‌رسد بات پیام‌های پشت‌سرهم سریع را "نادیده می‌گیرد"؟'>
    حالت صف کنترل می‌کند پیام‌های جدید چطور با یک اجرای در حال انجام تعامل کنند. برای تغییر حالت‌ها از `/queue` استفاده کنید:

    - `steer` - همه steeringهای معلق را برای مرز مدل بعدی در اجرای فعلی صف می‌کند
    - `queue` - steering قدیمیِ یکی‌درمیان
    - `followup` - پیام‌ها را یکی‌یکی اجرا می‌کند
    - `collect` - پیام‌ها را دسته‌بندی می‌کند و یک‌بار پاسخ می‌دهد
    - `steer-backlog` - اکنون steer می‌کند، سپس backlog را پردازش می‌کند
    - `interrupt` - اجرای فعلی را لغو می‌کند و از نو شروع می‌کند

    حالت پیش‌فرض `steer` است. برای حالت‌های پیگیری می‌توانید گزینه‌هایی مانند `debounce:0.5s cap:25 drop:summarize` اضافه کنید. [صف فرمان](/fa/concepts/queue) و [صف هدایت](/fa/concepts/queue-steering) را ببینید.

  </Accordion>
</AccordionGroup>

## متفرقه

<AccordionGroup>
  <Accordion title='مدل پیش‌فرض برای Anthropic با یک کلید API چیست؟'>
    در OpenClaw، اعتبارنامه‌ها و انتخاب مدل جدا هستند. تنظیم `ANTHROPIC_API_KEY` (یا ذخیره یک کلید API Anthropic در پروفایل‌های احراز هویت) احراز هویت را فعال می‌کند، اما مدل پیش‌فرض واقعی همان چیزی است که در `agents.defaults.model.primary` پیکربندی می‌کنید (برای مثال، `anthropic/claude-sonnet-4-6` یا `anthropic/claude-opus-4-6`). اگر `No credentials found for profile "anthropic:default"` را می‌بینید، یعنی Gateway نتوانسته اعتبارنامه‌های Anthropic را در `auth-profiles.json` مورد انتظار برای عاملی که در حال اجراست پیدا کند.
  </Accordion>
</AccordionGroup>

---

هنوز گیر کرده‌اید؟ در [Discord](https://discord.com/invite/clawd) بپرسید یا یک [بحث GitHub](https://github.com/openclaw/openclaw/discussions) باز کنید.

## مرتبط

- [پرسش‌های متداول اجرای نخست](/fa/help/faq-first-run) — نصب، راه‌اندازی اولیه، احراز هویت، اشتراک‌ها، خطاهای اولیه
- [پرسش‌های متداول مدل‌ها](/fa/help/faq-models) — انتخاب مدل، failover، پروفایل‌های احراز هویت
- [عیب‌یابی](/fa/help/troubleshooting) — تریاژ بر اساس نشانه‌ها
