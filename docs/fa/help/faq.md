---
read_when:
    - پاسخ به پرسش‌های رایج پشتیبانی درباره راه‌اندازی، نصب، آشناسازی یا زمان اجرا
    - تریاژ مسائل گزارش‌شده توسط کاربران پیش از اشکال‌زدایی عمیق‌تر
summary: پرسش‌های متداول درباره راه‌اندازی، پیکربندی و استفاده از OpenClaw
title: پرسش‌های متداول
x-i18n:
    generated_at: "2026-06-27T17:53:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40b32792c202944576cd983ecf8bf794551bc50986d6b5c985a8ddfe0ecf0b34
    source_path: help/faq.md
    workflow: 16
---

پاسخ‌های سریع به‌همراه عیب‌یابی عمیق‌تر برای راه‌اندازی‌های واقعی (توسعه محلی، VPS، چندعاملی، کلیدهای OAuth/API، failover مدل). برای تشخیص‌های زمان اجرا، [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید. برای مرجع کامل پیکربندی، [پیکربندی](/fa/gateway/configuration) را ببینید.

## ۶۰ ثانیه اول اگر چیزی خراب است

1. **وضعیت سریع (اولین بررسی)**

   ```bash
   openclaw status
   ```

   خلاصه محلی سریع: سیستم‌عامل + به‌روزرسانی، دسترسی‌پذیری gateway/service، agentها/sessionها، پیکربندی provider + مشکلات زمان اجرا (وقتی Gateway در دسترس باشد).

2. **گزارش قابل چسباندن (ایمن برای اشتراک‌گذاری)**

   ```bash
   openclaw status --all
   ```

   تشخیص فقط‌خواندنی همراه با انتهای log (tokenها حذف شده‌اند).

3. **وضعیت daemon + port**

   ```bash
   openclaw gateway status
   ```

   زمان اجرای supervisor در برابر دسترسی‌پذیری RPC، نشانی URL هدف probe، و اینکه سرویس احتمالا از کدام پیکربندی استفاده کرده است را نشان می‌دهد.

4. **probeهای عمیق**

   ```bash
   openclaw status --deep
   ```

   یک probe زنده سلامت Gateway را اجرا می‌کند، شامل probeهای channel وقتی پشتیبانی شوند
   (به یک Gateway در دسترس نیاز دارد). [سلامت](/fa/gateway/health) را ببینید.

5. **دنبال کردن جدیدترین log**

   ```bash
   openclaw logs --follow
   ```

   اگر RPC قطع است، به این برگردید:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   logهای فایل از logهای سرویس جدا هستند؛ [ثبت رویداد](/fa/logging) و [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید.

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

پرسش‌وپاسخ اولین اجرا — نصب، onboard، مسیرهای auth، اشتراک‌ها، خطاهای اولیه —
در [پرسش‌های متداول اولین اجرا](/fa/help/faq-first-run) قرار دارد.

## OpenClaw چیست؟

<AccordionGroup>
  <Accordion title="OpenClaw در یک پاراگراف چیست؟">
    OpenClaw یک دستیار هوش مصنوعی شخصی است که روی دستگاه‌های خودتان اجرا می‌کنید. روی سطح‌های پیام‌رسانی که از قبل استفاده می‌کنید پاسخ می‌دهد (WhatsApp، Telegram، Slack، Mattermost، Discord، Google Chat، Signal، iMessage، WebChat، و Pluginهای channel همراه مثل QQ Bot) و همچنین می‌تواند روی پلتفرم‌های پشتیبانی‌شده voice + یک Canvas زنده ارائه کند. **Gateway** صفحه کنترل همیشه‌روشن است؛ دستیار همان محصول است.
  </Accordion>

  <Accordion title="ارزش پیشنهادی">
    OpenClaw «فقط یک wrapper برای Claude» نیست. یک **صفحه کنترل local-first** است که به شما اجازه می‌دهد یک
    دستیار توانمند را روی **سخت‌افزار خودتان** اجرا کنید، از اپ‌های chat که از قبل استفاده می‌کنید به آن دسترسی داشته باشید، همراه با
    sessionهای stateful، حافظه، و ابزارها - بدون اینکه کنترل workflowهای خود را به یک
    SaaS میزبانی‌شده بسپارید.

    نکات برجسته:

    - **دستگاه‌های شما، داده‌های شما:** Gateway را هرجا که می‌خواهید اجرا کنید (Mac، Linux، VPS) و
      workspace + تاریخچه session را محلی نگه دارید.
    - **channelهای واقعی، نه یک sandbox وب:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc،
      به‌علاوه voice موبایل و Canvas روی پلتفرم‌های پشتیبانی‌شده.
    - **بی‌طرف نسبت به مدل:** از Anthropic، OpenAI، MiniMax، OpenRouter، و غیره، با routing
      و failover برای هر agent استفاده کنید.
    - **گزینه فقط‌محلی:** مدل‌های محلی را اجرا کنید تا اگر بخواهید **همه داده‌ها بتوانند روی دستگاه شما بمانند**.
    - **routing چندعاملی:** agentهای جدا برای هر channel، account، یا task، هرکدام با
      workspace و پیش‌فرض‌های خودش.
    - **متن‌باز و قابل دستکاری:** بدون vendor lock-in بررسی کنید، گسترش دهید، و self-host کنید.

    مستندات: [Gateway](/fa/gateway)، [Channelها](/fa/channels)، [چندعاملی](/fa/concepts/multi-agent)،
    [حافظه](/fa/concepts/memory).

  </Accordion>

  <Accordion title="همین الان راه‌اندازی کردم - اول چه کار کنم؟">
    پروژه‌های خوب برای شروع:

    - یک وب‌سایت بسازید (WordPress، Shopify، یا یک سایت static ساده).
    - یک اپ موبایل prototype کنید (طرح کلی، صفحه‌ها، طرح API).
    - فایل‌ها و پوشه‌ها را سازمان‌دهی کنید (پاک‌سازی، نام‌گذاری، برچسب‌گذاری).
    - Gmail را وصل کنید و خلاصه‌ها یا پیگیری‌ها را خودکار کنید.

    می‌تواند taskهای بزرگ را انجام دهد، اما وقتی آن‌ها را به phaseها تقسیم کنید و
    از sub agentها برای کار موازی استفاده کنید بهترین عملکرد را دارد.

  </Accordion>

  <Accordion title="پنج مورد استفاده روزمره برتر برای OpenClaw چیست؟">
    بردهای روزمره معمولا شبیه این‌ها هستند:

    - **خلاصه‌های شخصی:** خلاصه‌های inbox، calendar، و news که برایتان مهم است.
    - **پژوهش و پیش‌نویس:** پژوهش سریع، خلاصه‌ها، و پیش‌نویس‌های اولیه برای emailها یا docs.
    - **یادآورها و پیگیری‌ها:** تلنگرها و checklistهای مبتنی بر Cron یا Heartbeat.
    - **خودکارسازی مرورگر:** پر کردن فرم‌ها، جمع‌آوری داده، و تکرار taskهای وب.
    - **هماهنگی بین دستگاه‌ها:** یک task را از گوشی خود بفرستید، بگذارید Gateway آن را روی یک سرور اجرا کند، و نتیجه را در chat پس بگیرید.

  </Accordion>

  <Accordion title="آیا OpenClaw می‌تواند در lead gen، outreach، ads، و blogها برای یک SaaS کمک کند؟">
    بله، برای **پژوهش، qualification، و پیش‌نویس**. می‌تواند سایت‌ها را scan کند، shortlist بسازد،
    prospectها را خلاصه کند، و پیش‌نویس‌های outreach یا ad copy بنویسد.

    برای **اجرای outreach یا ad**، انسان را در loop نگه دارید. از spam پرهیز کنید، قوانین محلی و
    سیاست‌های پلتفرم را رعایت کنید، و قبل از ارسال هر چیزی آن را بازبینی کنید. ایمن‌ترین الگو این است که
    OpenClaw پیش‌نویس کند و شما تایید کنید.

    مستندات: [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="مزیت‌ها نسبت به Claude Code برای توسعه وب چیست؟">
    OpenClaw یک **دستیار شخصی** و لایه هماهنگی است، نه جایگزین IDE. از
    Claude Code یا Codex برای سریع‌ترین loop مستقیم کدنویسی داخل یک repo استفاده کنید. وقتی
    حافظه پایدار، دسترسی بین دستگاه‌ها، و orchestration ابزار می‌خواهید از OpenClaw استفاده کنید.

    مزیت‌ها:

    - **حافظه + workspace پایدار** بین sessionها
    - **دسترسی چندپلتفرمی** (WhatsApp، Telegram، TUI، WebChat)
    - **orchestration ابزار** (مرورگر، فایل‌ها، زمان‌بندی، hookها)
    - **Gateway همیشه‌روشن** (روی VPS اجرا کنید، از هرجا تعامل کنید)
    - **Nodeها** برای مرورگر/صفحه‌نمایش/دوربین/exec محلی

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills و خودکارسازی

<AccordionGroup>
  <Accordion title="چطور Skills را بدون dirty نگه داشتن repo سفارشی کنم؟">
    به‌جای ویرایش کپی repo، از overrideهای مدیریت‌شده استفاده کنید. تغییرهای خود را در `~/.openclaw/skills/<name>/SKILL.md` بگذارید (یا از طریق `skills.load.extraDirs` در `~/.openclaw/openclaw.json` یک پوشه اضافه کنید). اولویت به‌ترتیب `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` است، پس overrideهای مدیریت‌شده همچنان بدون دست زدن به git بر Skills همراه غلبه می‌کنند. اگر لازم است skill به‌صورت global نصب شود اما فقط برای بعضی agentها قابل مشاهده باشد، کپی shared را در `~/.openclaw/skills` نگه دارید و visibility را با `agents.defaults.skills` و `agents.list[].skills` کنترل کنید. فقط ویرایش‌هایی که ارزش upstream شدن دارند باید در repo باشند و به‌صورت PR ارسال شوند.
  </Accordion>

  <Accordion title="آیا می‌توانم Skills را از یک پوشه سفارشی load کنم؟">
    بله. directoryهای اضافی را از طریق `skills.load.extraDirs` در `~/.openclaw/openclaw.json` اضافه کنید (پایین‌ترین اولویت). اولویت پیش‌فرض `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` است. `clawhub` به‌طور پیش‌فرض در `./skills` نصب می‌کند، که OpenClaw در session بعدی آن را به‌عنوان `<workspace>/skills` در نظر می‌گیرد. اگر skill باید فقط برای agentهای خاصی قابل مشاهده باشد، آن را با `agents.defaults.skills` یا `agents.list[].skills` همراه کنید.
  </Accordion>

  <Accordion title="چطور می‌توانم برای taskهای مختلف از مدل‌ها یا تنظیمات متفاوت استفاده کنم؟">
    الگوهای پشتیبانی‌شده امروز این‌ها هستند:

    - **Cron jobs**: jobهای ایزوله می‌توانند برای هر job یک override برای `model` تنظیم کنند.
    - **Agentها**: taskها را به agentهای جدا با مدل‌های پیش‌فرض، thinking levelها، و stream params متفاوت route کنید.
    - **تعویض on-demand**: از `/model` برای تعویض مدل session فعلی در هر زمان استفاده کنید.

    برای مثال، از یک مدل واحد با تنظیمات متفاوت برای هر agent استفاده کنید:

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

    پیش‌فرض‌های shared برای هر مدل را در `agents.defaults.models["provider/model"].params` بگذارید، سپس overrideهای مخصوص agent را در `agents.list[].params` تخت قرار دهید. برای همان مدل، entryهای nested جداگانه `agents.list[].models["provider/model"].params` تعریف نکنید؛ `agents.list[].models` برای catalog مدل و overrideهای زمان اجرای مخصوص هر agent است.

    [Cron jobs](/fa/automation/cron-jobs)، [routing چندعاملی](/fa/concepts/multi-agent)، [پیکربندی](/fa/gateway/config-agents)، و [دستورهای slash](/fa/tools/slash-commands) را ببینید.

  </Accordion>

  <Accordion title="bot هنگام انجام کار سنگین freeze می‌کند. چطور آن را offload کنم؟">
    برای taskهای طولانی یا موازی از **sub-agentها** استفاده کنید. sub-agentها در session خودشان اجرا می‌شوند،
    یک خلاصه برمی‌گردانند، و chat اصلی شما را responsive نگه می‌دارند.

    از bot خود بخواهید «برای این task یک sub-agent spawn کند» یا از `/subagents` استفاده کنید.
    از `/status` در chat استفاده کنید تا ببینید Gateway همین حالا چه کار می‌کند (و آیا busy است).

    نکته token: taskهای طولانی و sub-agentها هر دو token مصرف می‌کنند. اگر هزینه مهم است، یک
    مدل ارزان‌تر را از طریق `agents.defaults.subagents.model` برای sub-agentها تنظیم کنید.

    مستندات: [Sub-agentها](/fa/tools/subagents)، [taskهای پس‌زمینه](/fa/automation/tasks).

  </Accordion>

  <Accordion title="sessionهای subagent وابسته به thread در Discord چطور کار می‌کنند؟">
    از thread bindingها استفاده کنید. می‌توانید یک thread در Discord را به هدف subagent یا session bind کنید تا پیام‌های follow-up در آن thread روی همان session bound بمانند.

    flow پایه:

    - با `sessions_spawn` و با استفاده از `thread: true` spawn کنید (و به‌صورت اختیاری `mode: "session"` برای follow-up پایدار).
    - یا به‌صورت دستی با `/focus <target>` bind کنید.
    - از `/agents` برای بررسی وضعیت binding استفاده کنید.
    - از `/session idle <duration|off>` و `/session max-age <duration|off>` برای کنترل auto-unfocus استفاده کنید.
    - از `/unfocus` برای detach کردن thread استفاده کنید.

    پیکربندی لازم:

    - پیش‌فرض‌های global: `session.threadBindings.enabled`، `session.threadBindings.idleHours`، `session.threadBindings.maxAgeHours`.
    - overrideهای Discord: `channels.discord.threadBindings.enabled`، `channels.discord.threadBindings.idleHours`، `channels.discord.threadBindings.maxAgeHours`.
    - auto-bind هنگام spawn: `channels.discord.threadBindings.spawnSessions` به‌طور پیش‌فرض `true` است؛ برای غیرفعال کردن spawnهای session وابسته به thread آن را روی `false` بگذارید.

    مستندات: [Sub-agentها](/fa/tools/subagents)، [Discord](/fa/channels/discord)، [مرجع پیکربندی](/fa/gateway/configuration-reference)، [دستورهای slash](/fa/tools/slash-commands).

  </Accordion>

  <Accordion title="یک subagent تمام شد، اما به‌روزرسانی completion به جای اشتباه رفت یا اصلا post نشد. چه چیزی را بررسی کنم؟">
    ابتدا route درخواست‌کننده resolve شده را بررسی کنید:

    - تحویل subagent در حالت completion وقتی thread یا conversation route وابسته‌ای وجود داشته باشد، آن را ترجیح می‌دهد.
    - اگر origin completion فقط یک channel داشته باشد، OpenClaw به route ذخیره‌شده session درخواست‌کننده (`lastChannel` / `lastTo` / `lastAccountId`) برمی‌گردد تا تحویل مستقیم همچنان بتواند موفق شود.
    - اگر نه route وابسته‌ای وجود داشته باشد و نه route ذخیره‌شده قابل‌استفاده‌ای، تحویل مستقیم می‌تواند fail شود و نتیجه به‌جای post فوری به chat به تحویل session صف‌شده برمی‌گردد.
    - targetهای نامعتبر یا stale همچنان می‌توانند fallback به queue یا شکست نهایی تحویل را تحمیل کنند.
    - اگر آخرین پاسخ assistant قابل مشاهده child دقیقا token خاموش `NO_REPLY` / `no_reply`، یا دقیقا `ANNOUNCE_SKIP` باشد، OpenClaw عمدا announce را suppress می‌کند تا progress قدیمی‌تر و stale را post نکند.
    - خروجی Tool/toolResult به متن نتیجه child promote نمی‌شود؛ نتیجه همان آخرین پاسخ assistant قابل مشاهده child است.

    اشکال‌زدایی:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [زیرعامل‌ها](/fa/tools/subagents)، [وظایف پس‌زمینه](/fa/automation/tasks)، [ابزارهای نشست](/fa/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron یا یادآورها اجرا نمی‌شوند. چه چیزی را بررسی کنم؟">
    Cron داخل فرایند Gateway اجرا می‌شود. اگر Gateway به‌صورت پیوسته در حال اجرا نباشد،
    کارهای زمان‌بندی‌شده اجرا نخواهند شد.

    چک‌لیست:

    - تأیید کنید cron فعال است (`cron.enabled`) و `OPENCLAW_SKIP_CRON` تنظیم نشده است.
    - بررسی کنید Gateway به‌صورت ۲۴/۷ در حال اجراست (بدون خواب/راه‌اندازی مجدد).
    - تنظیمات منطقه زمانی کار را بررسی کنید (`--tz` در برابر منطقه زمانی میزبان).

    اشکال‌زدایی:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [اتوماسیون](/fa/automation).

  </Accordion>

  <Accordion title="Cron اجرا شد، اما چیزی به کانال ارسال نشد. چرا؟">
    ابتدا حالت تحویل را بررسی کنید:

    - `--no-deliver` / `delivery.mode: "none"` یعنی هیچ ارسال جایگزین توسط اجراکننده انتظار نمی‌رود.
    - هدف اعلامِ ناموجود یا نامعتبر (`channel` / `to`) یعنی اجراکننده تحویل خروجی را رد کرده است.
    - شکست‌های احراز هویت کانال (`unauthorized`, `Forbidden`) یعنی اجراکننده تلاش کرده تحویل دهد اما اعتبارنامه‌ها مانع شده‌اند.
    - نتیجه ایزوله بی‌صدا (فقط `NO_REPLY` / `no_reply`) عمداً غیرقابل‌تحویل در نظر گرفته می‌شود، بنابراین اجراکننده تحویل جایگزین صف‌شده را هم سرکوب می‌کند.

    برای کارهای Cron ایزوله، عامل همچنان می‌تواند وقتی مسیر چت در دسترس است مستقیماً با ابزار `message`
    ارسال کند. `--announce` فقط مسیر جایگزین اجراکننده را برای متن نهایی کنترل می‌کند
    که عامل قبلاً ارسال نکرده است.

    اشکال‌زدایی:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [وظایف پس‌زمینه](/fa/automation/tasks).

  </Accordion>

  <Accordion title="چرا یک اجرای Cron ایزوله مدل‌ها را عوض کرد یا یک‌بار دوباره تلاش کرد؟">
    این معمولاً مسیر تعویض مدل زنده است، نه زمان‌بندی تکراری.

    Cron ایزوله می‌تواند یک واگذاری مدل زمان اجرا را پایدار کند و وقتی اجرای فعال
    `LiveSessionModelSwitchError` پرتاب می‌کند، دوباره تلاش کند. تلاش مجدد، ارائه‌دهنده/مدلِ تعویض‌شده
    را نگه می‌دارد، و اگر تعویض یک بازنویسی نمایه احراز هویت جدید همراه داشته باشد، Cron
    آن را هم پیش از تلاش مجدد پایدار می‌کند.

    قواعد انتخاب مرتبط:

    - بازنویسی مدل قلاب Gmail، در صورت کاربرد، اولویت اول را دارد.
    - سپس `model` هر کار.
    - سپس هر بازنویسی مدل ذخیره‌شده برای نشست Cron.
    - سپس انتخاب عادی مدل پیش‌فرض/عامل.

    حلقه تلاش مجدد محدود است. پس از تلاش اولیه به‌علاوه ۲ تلاش مجددِ تعویض،
    Cron به‌جای حلقه بی‌پایان متوقف می‌شود.

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
    openclaw skills install @owner/<skill-slug>
    openclaw skills install @owner/<skill-slug> --version <version>
    openclaw skills install @owner/<skill-slug> --force
    openclaw skills install @owner/<skill-slug> --global
    openclaw skills update --all
    openclaw skills update --all --global
    openclaw skills list --eligible
    openclaw skills check
    ```

    نصب بومی `openclaw skills install` به‌طور پیش‌فرض در دایرکتوری `skills/`
    فضای کاری فعال می‌نویسد. `--global` را اضافه کنید تا در دایرکتوری مدیریت‌شده مشترک
    Skills برای همه عامل‌های محلی نصب شود. CLI جداگانه `clawhub` را
    فقط زمانی نصب کنید که می‌خواهید Skills خودتان را منتشر یا همگام‌سازی کنید. اگر می‌خواهید محدود کنید
    کدام عامل‌ها می‌توانند Skills مشترک را ببینند، از
    `agents.defaults.skills` یا `agents.list[].skills` استفاده کنید.

  </Accordion>

  <Accordion title="آیا OpenClaw می‌تواند وظایف را طبق زمان‌بندی یا به‌صورت پیوسته در پس‌زمینه اجرا کند؟">
    بله. از زمان‌بند Gateway استفاده کنید:

    - **کارهای Cron** برای وظایف زمان‌بندی‌شده یا تکرارشونده (پس از راه‌اندازی مجدد هم پایدار می‌مانند).
    - **Heartbeat** برای بررسی‌های دوره‌ای «نشست اصلی».
    - **کارهای ایزوله** برای عامل‌های خودمختاری که خلاصه‌ها را پست می‌کنند یا به چت‌ها تحویل می‌دهند.

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [اتوماسیون](/fa/automation)،
    [Heartbeat](/fa/gateway/heartbeat).

  </Accordion>

  <Accordion title="آیا می‌توانم Skills مخصوص Apple macOS را از Linux اجرا کنم؟">
    نه مستقیماً. Skills مربوط به macOS با `metadata.openclaw.os` به‌علاوه باینری‌های لازم محدود می‌شوند، و Skills فقط وقتی در اعلان سیستم ظاهر می‌شوند که روی **میزبان Gateway** واجد شرایط باشند. روی Linux، Skills فقط `darwin` (مانند `apple-notes`، `apple-reminders`، `things-mac`) بارگذاری نمی‌شوند مگر اینکه این محدودیت را بازنویسی کنید.

    سه الگوی پشتیبانی‌شده دارید:

    **گزینه A - اجرای Gateway روی Mac (ساده‌ترین).**
    Gateway را جایی اجرا کنید که باینری‌های macOS وجود دارند، سپس از Linux در [حالت راه‌دور](#gateway-ports-already-running-and-remote-mode) یا از طریق Tailscale وصل شوید. Skills به‌طور عادی بارگذاری می‌شوند چون میزبان Gateway macOS است.

    **گزینه B - استفاده از یک گره macOS (بدون SSH).**
    Gateway را روی Linux اجرا کنید، یک گره macOS (برنامه نوار منو) را جفت کنید، و **فرمان‌های اجرای Node** را روی Mac روی «Always Ask» یا «Always Allow» تنظیم کنید. OpenClaw می‌تواند Skills مخصوص macOS را وقتی باینری‌های لازم روی گره وجود دارند واجد شرایط در نظر بگیرد. عامل آن Skills را از طریق ابزار `nodes` اجرا می‌کند. اگر «Always Ask» را انتخاب کنید، تأیید «Always Allow» در اعلان، آن فرمان را به فهرست مجاز اضافه می‌کند.

    **گزینه C - پروکسی کردن باینری‌های macOS از طریق SSH (پیشرفته).**
    Gateway را روی Linux نگه دارید، اما کاری کنید باینری‌های CLI لازم به پوشش‌های SSH resolve شوند که روی یک Mac اجرا می‌شوند. سپس Skill را بازنویسی کنید تا Linux مجاز شود و واجد شرایط بماند.

    1. یک پوشش SSH برای باینری بسازید (مثال: `memo` برای Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. پوشش را روی `PATH` در میزبان Linux قرار دهید (برای مثال `~/bin/memo`).
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

  <Accordion title="آیا یک یکپارچه‌سازی Notion یا HeyGen دارید؟">
    امروز به‌صورت داخلی وجود ندارد.

    گزینه‌ها:

    - **Skill / Plugin سفارشی:** بهترین گزینه برای دسترسی API قابل اعتماد (Notion/HeyGen هر دو API دارند).
    - **اتوماسیون مرورگر:** بدون کد کار می‌کند اما کندتر و شکننده‌تر است.

    اگر می‌خواهید زمینه را برای هر مشتری نگه دارید (گردش‌کارهای آژانسی)، یک الگوی ساده این است:

    - یک صفحه Notion برای هر مشتری (زمینه + ترجیحات + کار فعال).
    - از عامل بخواهید در شروع نشست آن صفحه را واکشی کند.

    اگر یک یکپارچه‌سازی بومی می‌خواهید، یک درخواست ویژگی باز کنید یا Skillی
    هدف‌گیرنده آن APIها بسازید.

    نصب Skills:

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    نصب‌های بومی در دایرکتوری `skills/` فضای کاری فعال قرار می‌گیرند. برای Skills مشترک میان همه عامل‌های محلی، از `openclaw skills install @owner/<skill-slug> --global` استفاده کنید (یا آن‌ها را دستی در `~/.openclaw/skills/<name>/SKILL.md` قرار دهید). اگر فقط برخی عامل‌ها باید یک نصب مشترک را ببینند، `agents.defaults.skills` یا `agents.list[].skills` را پیکربندی کنید. برخی Skills انتظار دارند باینری‌هایی از طریق Homebrew نصب شده باشند؛ روی Linux یعنی Linuxbrew (ورودی FAQ مربوط به Homebrew Linux در بالا را ببینید). [Skills](/fa/tools/skills)، [پیکربندی Skills](/fa/tools/skills-config)، و [ClawHub](/fa/clawhub) را ببینید.

  </Accordion>

  <Accordion title="چگونه از Chrome موجود و واردشده خودم با OpenClaw استفاده کنم؟">
    از نمایه مرورگر داخلی `user` استفاده کنید، که از طریق Chrome DevTools MCP متصل می‌شود:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    اگر نام سفارشی می‌خواهید، یک نمایه MCP صریح بسازید:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    این مسیر می‌تواند از مرورگر میزبان محلی یا یک گره مرورگر متصل استفاده کند. اگر Gateway جای دیگری اجرا می‌شود، یا یک میزبان گره را روی ماشین مرورگر اجرا کنید یا به‌جای آن از CDP راه‌دور استفاده کنید.

    محدودیت‌های فعلی در `existing-session` / `user`:

    - actions مبتنی بر ref هستند، نه مبتنی بر انتخاب‌گر CSS
    - uploadها به `ref` / `inputRef` نیاز دارند و فعلاً هر بار از یک فایل پشتیبانی می‌کنند
    - `responsebody`، صدور PDF، رهگیری download، و actions دسته‌ای هنوز به یک مرورگر مدیریت‌شده یا نمایه CDP خام نیاز دارند

  </Accordion>
</AccordionGroup>

## سندباکسینگ و حافظه

<AccordionGroup>
  <Accordion title="آیا سند اختصاصی برای سندباکسینگ وجود دارد؟">
    بله. [سندباکسینگ](/fa/gateway/sandboxing) را ببینید. برای راه‌اندازی مخصوص Docker (Gateway کامل در Docker یا تصاویر سندباکس)، [Docker](/fa/install/docker) را ببینید.
  </Accordion>

  <Accordion title="Docker محدود به نظر می‌رسد - چگونه قابلیت‌های کامل را فعال کنم؟">
    تصویر پیش‌فرض امنیت‌محور است و با کاربر `node` اجرا می‌شود، بنابراین
    بسته‌های سیستمی، Homebrew، یا مرورگرهای همراه را شامل نمی‌شود. برای راه‌اندازی کامل‌تر:

    - `/home/node` را با `OPENCLAW_HOME_VOLUME` پایدار کنید تا cacheها باقی بمانند.
    - وابستگی‌های سیستمی را با `OPENCLAW_IMAGE_APT_PACKAGES` در تصویر bake کنید.
    - مرورگرهای Playwright را از طریق CLI همراه نصب کنید:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` را تنظیم کنید و مطمئن شوید مسیر پایدار می‌ماند.

    مستندات: [Docker](/fa/install/docker)، [مرورگر](/fa/tools/browser).

  </Accordion>

  <Accordion title="آیا می‌توانم DMها را شخصی نگه دارم اما گروه‌ها را با یک عامل عمومی/سندباکس‌شده کنم؟">
    بله - اگر ترافیک خصوصی شما **DMها** و ترافیک عمومی شما **گروه‌ها** باشد.

    از `agents.defaults.sandbox.mode: "non-main"` استفاده کنید تا نشست‌های گروه/کانال (کلیدهای غیر اصلی) در backend سندباکس پیکربندی‌شده اجرا شوند، در حالی که نشست DM اصلی روی میزبان بماند. اگر backendی انتخاب نکنید، Docker پیش‌فرض است. سپس از طریق `tools.sandbox.tools` محدود کنید چه ابزارهایی در نشست‌های سندباکس‌شده در دسترس باشند.

    راهنمای راه‌اندازی + پیکربندی نمونه: [گروه‌ها: DMهای شخصی + گروه‌های عمومی](/fa/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع پیکربندی کلیدی: [پیکربندی Gateway](/fa/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="چگونه یک پوشه میزبان را به سندباکس bind کنم؟">
    `agents.defaults.sandbox.docker.binds` را روی `["host:path:mode"]` تنظیم کنید (مثلاً `"/home/user/src:/src:ro"`). bindهای سراسری و هر عامل با هم merge می‌شوند؛ bindهای هر عامل وقتی `scope: "shared"` باشد نادیده گرفته می‌شوند. برای هر چیز حساس از `:ro` استفاده کنید و به یاد داشته باشید bindها دیوارهای فایل‌سیستم سندباکس را دور می‌زنند.

    OpenClaw منابع bind را هم در برابر مسیر نرمال‌شده و هم مسیر canonical که از طریق عمیق‌ترین ancestor موجود resolve شده اعتبارسنجی می‌کند. یعنی خروج از طریق والد symlink همچنان fail closed می‌شود حتی وقتی آخرین بخش مسیر هنوز وجود ندارد، و بررسی‌های ریشه مجاز همچنان پس از resolve شدن symlink اعمال می‌شوند.

    برای نمونه‌ها و نکات ایمنی، [سندباکسینگ](/fa/gateway/sandboxing#custom-bind-mounts) و [سندباکس در برابر سیاست ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) را ببینید.

  </Accordion>

  <Accordion title="حافظه چگونه کار می‌کند؟">
    حافظه OpenClaw فقط فایل‌های Markdown در فضای کاری عامل است:

    - یادداشت‌های روزانه در `memory/YYYY-MM-DD.md`
    - یادداشت‌های بلندمدت گزینش‌شده در `MEMORY.md` (فقط نشست‌های اصلی/خصوصی)

    OpenClaw همچنین یک **تخلیه حافظه بی‌صدای پیش از Compaction** اجرا می‌کند تا به مدل
    یادآوری کند پیش از Compaction خودکار، یادداشت‌های پایدار بنویسد. این فقط وقتی اجرا می‌شود که فضای کاری
    قابل نوشتن باشد (سندباکس‌های فقط‌خواندنی آن را رد می‌کنند). [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>

  <Accordion title="حافظه مدام چیزها را فراموش می‌کند. چطور کاری کنم ماندگار شوند؟">
    از بات بخواهید **آن واقعیت را در حافظه بنویسد**. یادداشت‌های بلندمدت باید در `MEMORY.md` باشند،
    و زمینه کوتاه‌مدت در `memory/YYYY-MM-DD.md` قرار می‌گیرد.

    این هنوز بخشی است که در حال بهبود آن هستیم. یادآوری به مدل برای ذخیره خاطره‌ها کمک می‌کند؛
    خودش می‌داند چه کار کند. اگر همچنان فراموش می‌کند، بررسی کنید Gateway در هر اجرا از همان
    workspace استفاده می‌کند.

    مستندات: [حافظه](/fa/concepts/memory)، [workspace عامل](/fa/concepts/agent-workspace).

  </Accordion>

  <Accordion title="آیا حافظه برای همیشه ماندگار می‌ماند؟ محدودیت‌ها چیست؟">
    فایل‌های حافظه روی دیسک قرار دارند و تا وقتی شما حذفشان نکنید باقی می‌مانند. محدودیت، فضای
    ذخیره‌سازی شماست، نه مدل. **زمینه نشست** همچنان به پنجره زمینه مدل محدود است،
    بنابراین گفتگوهای طولانی می‌توانند Compaction شوند یا برش بخورند. به همین دلیل
    جستجوی حافظه وجود دارد - فقط بخش‌های مرتبط را دوباره به زمینه برمی‌گرداند.

    مستندات: [حافظه](/fa/concepts/memory)، [زمینه](/fa/concepts/context).

  </Accordion>

  <Accordion title="آیا جستجوی معنایی حافظه به کلید API از OpenAI نیاز دارد؟">
    فقط اگر از **جاسازی‌های OpenAI** استفاده کنید. OAuth مربوط به Codex چت/تکمیل‌ها را پوشش می‌دهد و
    به دسترسی جاسازی‌ها **مجوز نمی‌دهد**، بنابراین **ورود با Codex (OAuth یا ورود Codex CLI)**
    برای جستجوی معنایی حافظه کمکی نمی‌کند. جاسازی‌های OpenAI
    همچنان به یک کلید API واقعی نیاز دارند (`OPENAI_API_KEY` یا `models.providers.openai.apiKey`).

    اگر provider را به‌صراحت تنظیم نکنید، OpenClaw از جاسازی‌های OpenAI استفاده می‌کند. پیکربندی‌های قدیمی
    که هنوز `memorySearch.provider = "auto"` دارند نیز به OpenAI تبدیل می‌شوند.
    اگر هیچ کلید API از OpenAI در دسترس نباشد، جستجوی معنایی حافظه تا زمانی که
    کلیدی پیکربندی کنید یا provider دیگری را صریحاً انتخاب کنید، در دسترس نخواهد بود.

    اگر ترجیح می‌دهید محلی بمانید، `memorySearch.provider = "local"` را تنظیم کنید (و در صورت تمایل
    `memorySearch.fallback = "none"`). اگر جاسازی‌های Gemini را می‌خواهید،
    `memorySearch.provider = "gemini"` را تنظیم کنید و `GEMINI_API_KEY` (یا
    `memorySearch.remote.apiKey`) را ارائه دهید. ما از مدل‌های جاسازی **OpenAI، سازگار با OpenAI، Gemini،
    Voyage، Mistral، Bedrock، Ollama، LM Studio، GitHub Copilot، DeepInfra، یا محلی**
    پشتیبانی می‌کنیم - برای جزئیات راه‌اندازی، [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>
</AccordionGroup>

## محل قرارگیری چیزها روی دیسک

<AccordionGroup>
  <Accordion title="آیا همه داده‌هایی که با OpenClaw استفاده می‌شوند به‌صورت محلی ذخیره می‌شوند؟">
    نه - **وضعیت OpenClaw محلی است**، اما **سرویس‌های خارجی همچنان آنچه را برایشان می‌فرستید می‌بینند**.

    - **محلی به‌صورت پیش‌فرض:** نشست‌ها، فایل‌های حافظه، پیکربندی، و workspace روی میزبان Gateway قرار دارند
      (`~/.openclaw` + دایرکتوری workspace شما).
    - **از سر ضرورت راه‌دور:** پیام‌هایی که به providerهای مدل (Anthropic/OpenAI/و غیره) می‌فرستید به
      APIهای آن‌ها می‌روند، و پلتفرم‌های چت (WhatsApp/Telegram/Slack/و غیره) داده‌های پیام را روی
      سرورهای خود ذخیره می‌کنند.
    - **شما ردپا را کنترل می‌کنید:** استفاده از مدل‌های محلی promptها را روی دستگاه شما نگه می‌دارد، اما ترافیک
      کانال همچنان از سرورهای همان کانال عبور می‌کند.

    مرتبط: [workspace عامل](/fa/concepts/agent-workspace)، [حافظه](/fa/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw داده‌های خود را کجا ذخیره می‌کند؟">
    همه‌چیز زیر `$OPENCLAW_STATE_DIR` قرار می‌گیرد (پیش‌فرض: `~/.openclaw`):

    | مسیر                                                            | هدف                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | پیکربندی اصلی (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | واردسازی OAuth قدیمی (در نخستین استفاده در پروفایل‌های احراز هویت کپی می‌شود)       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | پروفایل‌های احراز هویت (OAuth، کلیدهای API، و `keyRef`/`tokenRef` اختیاری)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | payload اختیاری secret با پشتیبانی فایل برای providerهای SecretRef از نوع `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | فایل سازگاری قدیمی (ورودی‌های ثابت `api_key` پاک‌سازی شده‌اند)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | وضعیت provider (مثلاً `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | وضعیت هر عامل (agentDir + نشست‌ها)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | تاریخچه و وضعیت گفتگو (برای هر عامل)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | فراداده نشست (برای هر عامل)                                       |

    مسیر قدیمی تک‌عاملی: `~/.openclaw/agent/*` (با `openclaw doctor` مهاجرت داده می‌شود).

    **workspace** شما (AGENTS.md، فایل‌های حافظه، Skills، و غیره) جداست و از طریق `agents.defaults.workspace` پیکربندی می‌شود (پیش‌فرض: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md باید کجا باشند؟">
    این فایل‌ها در **workspace عامل** قرار دارند، نه در `~/.openclaw`.

    - **Workspace (برای هر عامل)**: `AGENTS.md`، `SOUL.md`، `IDENTITY.md`، `USER.md`،
      `MEMORY.md`، `memory/YYYY-MM-DD.md`، `HEARTBEAT.md` اختیاری.
      ریشه با حروف کوچک `memory.md` فقط ورودی ترمیم قدیمی است؛ `openclaw doctor --fix`
      وقتی هر دو فایل وجود داشته باشند می‌تواند آن را در `MEMORY.md` ادغام کند.
    - **دایرکتوری وضعیت (`~/.openclaw`)**: پیکربندی، وضعیت کانال/provider، پروفایل‌های احراز هویت، نشست‌ها، لاگ‌ها،
      و Skills مشترک (`~/.openclaw/skills`).

    workspace پیش‌فرض `~/.openclaw/workspace` است و از این طریق قابل پیکربندی است:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    اگر بات پس از راه‌اندازی دوباره «فراموش می‌کند»، تأیید کنید Gateway در هر اجرا از همان
    workspace استفاده می‌کند (و به یاد داشته باشید: حالت راه‌دور از workspace **میزبان gateway**
    استفاده می‌کند، نه لپ‌تاپ محلی شما).

    نکته: اگر یک رفتار یا ترجیح ماندگار می‌خواهید، از بات بخواهید آن را **در
    AGENTS.md یا MEMORY.md بنویسد** به‌جای اینکه به تاریخچه چت تکیه کنید.

    [workspace عامل](/fa/concepts/agent-workspace) و [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>

  <Accordion title="آیا می‌توانم SOUL.md را بزرگ‌تر کنم؟">
    بله. `SOUL.md` یکی از فایل‌های bootstrap workspace است که به زمینه
    عامل تزریق می‌شود. محدودیت پیش‌فرض تزریق برای هر فایل `20000` نویسه است،
    و بودجه کل bootstrap در میان فایل‌ها `60000` نویسه است.

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

    یا برای یک عامل override کنید:

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

    از `/context` برای بررسی اندازه‌های خام در برابر تزریق‌شده و اینکه برش رخ داده یا نه استفاده کنید.
    `SOUL.md` را روی صدا، موضع، و شخصیت متمرکز نگه دارید؛ قواعد عملیاتی را
    در `AGENTS.md` و واقعیت‌های ماندگار را در حافظه بگذارید.

    [زمینه](/fa/concepts/context) و [پیکربندی عامل](/fa/gateway/config-agents) را ببینید.

  </Accordion>

  <Accordion title="راهبرد پشتیبان‌گیری پیشنهادی">
    **workspace عامل** خود را در یک مخزن git **خصوصی** قرار دهید و آن را در جایی
    خصوصی پشتیبان‌گیری کنید (برای مثال GitHub خصوصی). این کار حافظه + فایل‌های AGENTS/SOUL/USER
    را ثبت می‌کند و به شما اجازه می‌دهد بعداً «ذهن» دستیار را بازیابی کنید.

    هیچ‌چیز زیر `~/.openclaw` را commit نکنید (اعتبارنامه‌ها، نشست‌ها، توکن‌ها، یا payloadهای secret رمزگذاری‌شده).
    اگر به بازیابی کامل نیاز دارید، هم workspace و هم دایرکتوری وضعیت را
    جداگانه پشتیبان‌گیری کنید (پرسش مهاجرت بالا را ببینید).

    مستندات: [workspace عامل](/fa/concepts/agent-workspace).

  </Accordion>

  <Accordion title="چطور OpenClaw را به‌طور کامل حذف نصب کنم؟">
    راهنمای اختصاصی را ببینید: [حذف نصب](/fa/install/uninstall).
  </Accordion>

  <Accordion title="آیا عامل‌ها می‌توانند بیرون از workspace کار کنند؟">
    بله. workspace **cwd پیش‌فرض** و لنگر حافظه است، نه یک sandbox سخت.
    مسیرهای نسبی داخل workspace resolve می‌شوند، اما مسیرهای مطلق می‌توانند به مکان‌های دیگر
    میزبان دسترسی داشته باشند، مگر اینکه sandboxing فعال باشد. اگر به جداسازی نیاز دارید، از
    [`agents.defaults.sandbox`](/fa/gateway/sandboxing) یا تنظیمات sandbox برای هر عامل استفاده کنید. اگر
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
    وضعیت نشست متعلق به **میزبان gateway** است. اگر در حالت راه‌دور هستید، محل ذخیره نشست موردنظر شما روی دستگاه راه‌دور است، نه لپ‌تاپ محلی شما. [مدیریت نشست](/fa/concepts/session) را ببینید.
  </Accordion>
</AccordionGroup>

## مبانی پیکربندی

<AccordionGroup>
  <Accordion title="فرمت پیکربندی چیست؟ کجاست؟">
    OpenClaw یک پیکربندی اختیاری **JSON5** را از `$OPENCLAW_CONFIG_PATH` می‌خواند (پیش‌فرض: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    اگر فایل وجود نداشته باشد، از پیش‌فرض‌های نسبتاً امن استفاده می‌کند (از جمله workspace پیش‌فرض `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='من gateway.bind: "lan" (یا "tailnet") را تنظیم کردم و حالا هیچ‌چیز گوش نمی‌دهد / UI می‌گوید unauthorized'>
    bindهای غیر loopback **به یک مسیر معتبر احراز هویت gateway نیاز دارند**. در عمل یعنی:

    - احراز هویت با secret مشترک: توکن یا گذرواژه
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
    - برای احراز هویت با گذرواژه، به‌جای آن `gateway.auth.mode: "password"` همراه با `gateway.auth.password` (یا `OPENCLAW_GATEWAY_PASSWORD`) را تنظیم کنید.
    - اگر `gateway.auth.token` / `gateway.auth.password` به‌صراحت از طریق SecretRef پیکربندی شده باشد و resolve نشود، resolution به‌شکل fail-closed شکست می‌خورد (بدون پوشاندن با fallback راه‌دور).
    - راه‌اندازی‌های Control UI با secret مشترک از طریق `connect.params.auth.token` یا `connect.params.auth.password` احراز هویت می‌کنند (در تنظیمات app/UI ذخیره می‌شود). حالت‌های دارای هویت مانند Tailscale Serve یا `trusted-proxy` به‌جای آن از headerهای درخواست استفاده می‌کنند. از گذاشتن secretهای مشترک در URLها خودداری کنید.
    - با `gateway.auth.mode: "trusted-proxy"`، reverse proxyهای loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح و یک ورودی loopback در `gateway.trustedProxies` نیاز دارند.

  </Accordion>

  <Accordion title="چرا حالا روی localhost به توکن نیاز دارم؟">
    OpenClaw احراز هویت gateway را به‌صورت پیش‌فرض اجرا می‌کند، از جمله loopback. در مسیر پیش‌فرض معمول، این یعنی احراز هویت با توکن: اگر هیچ مسیر احراز هویت صریحی پیکربندی نشده باشد، راه‌اندازی gateway به حالت توکن resolve می‌شود و برای همان راه‌اندازی یک توکن فقط در زمان اجرا تولید می‌کند، بنابراین **کلاینت‌های WS محلی باید احراز هویت کنند**. وقتی کلاینت‌ها به یک secret پایدار در میان راه‌اندازی‌های دوباره نیاز دارند، `gateway.auth.token`، `gateway.auth.password`، `OPENCLAW_GATEWAY_TOKEN`، یا `OPENCLAW_GATEWAY_PASSWORD` را به‌صراحت پیکربندی کنید. این کار جلوی فراخوانی Gateway توسط فرایندهای محلی دیگر را می‌گیرد.

    اگر مسیر احراز هویت متفاوتی را ترجیح می‌دهید، می‌توانید حالت رمز عبور را صراحتاً انتخاب کنید (یا برای reverse proxyهای آگاه از هویت، `trusted-proxy`). اگر **واقعاً** loopback باز می‌خواهید، `gateway.auth.mode: "none"` را صراحتاً در پیکربندی خود تنظیم کنید. Doctor هر زمان می‌تواند برای شما یک توکن تولید کند: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="آیا پس از تغییر پیکربندی باید راه‌اندازی مجدد کنم؟">
    Gateway پیکربندی را پایش می‌کند و از بارگذاری مجدد بدون توقف پشتیبانی می‌کند:

    - `gateway.reload.mode: "hybrid"` (پیش‌فرض): اعمال بدون توقف برای تغییرات امن، راه‌اندازی مجدد برای تغییرات حساس
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
    `web_fetch` بدون کلید API کار می‌کند. `web_search` به ارائه‌دهنده انتخاب‌شده شما وابسته است:

    - ارائه‌دهندگان مبتنی بر API مانند Brave، Exa، Firecrawl، Gemini، Kimi، MiniMax Search، Perplexity و Tavily به تنظیمات معمول کلید API خود نیاز دارند.
    - Grok می‌تواند از xAI OAuth مربوط به احراز هویت مدل دوباره استفاده کند، یا به `XAI_API_KEY` / پیکربندی جست‌وجوی وب Plugin برگردد.
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

    پیکربندی جست‌وجوی وب ویژه هر ارائه‌دهنده اکنون زیر `plugins.entries.<plugin>.config.webSearch.*` قرار دارد.
    مسیرهای ارائه‌دهنده قدیمی `tools.web.search.*` هنوز موقتاً برای سازگاری بارگذاری می‌شوند، اما نباید برای پیکربندی‌های جدید استفاده شوند.
    پیکربندی fallback واکشی وب Firecrawl زیر `plugins.entries.firecrawl.config.webFetch.*` قرار دارد.

    نکات:

    - اگر از allowlistها استفاده می‌کنید، `web_search`/`web_fetch`/`x_search` یا `group:web` را اضافه کنید.
    - `web_fetch` به‌طور پیش‌فرض فعال است (مگر اینکه صراحتاً غیرفعال شود).
    - اگر `tools.web.fetch.provider` حذف شده باشد، OpenClaw نخستین ارائه‌دهنده fallback آماده واکشی را از میان اعتبارنامه‌های موجود به‌طور خودکار تشخیص می‌دهد. Plugin رسمی Firecrawl این fallback را فراهم می‌کند.
    - Daemonها env varها را از `~/.openclaw/.env` (یا محیط سرویس) می‌خوانند.

    مستندات: [ابزارهای وب](/fa/tools/web).

  </Accordion>

  <Accordion title="config.apply پیکربندی من را پاک کرد. چگونه بازیابی کنم و از این مشکل جلوگیری کنم؟">
    `config.apply` **کل پیکربندی** را جایگزین می‌کند. اگر یک شیء جزئی بفرستید، همه چیز دیگر حذف می‌شود.

    OpenClaw فعلی از بسیاری از بازنویسی‌های تصادفی محافظت می‌کند:

    - نوشتن‌های پیکربندی متعلق به OpenClaw، کل پیکربندی پس از تغییر را پیش از نوشتن اعتبارسنجی می‌کنند.
    - نوشتن‌های نامعتبر یا مخرب متعلق به OpenClaw رد می‌شوند و به‌صورت `openclaw.json.rejected.*` ذخیره می‌شوند.
    - اگر یک ویرایش مستقیم راه‌اندازی یا بارگذاری مجدد بدون توقف را خراب کند، Gateway بسته و ایمن شکست می‌خورد یا بارگذاری مجدد را رد می‌کند؛ `openclaw.json` را بازنویسی نمی‌کند.
    - `openclaw doctor --fix` مالک تعمیر است و می‌تواند آخرین نسخه سالم شناخته‌شده را بازیابی کند، در حالی که فایل ردشده را به‌صورت `openclaw.json.clobbered.*` ذخیره می‌کند.

    بازیابی:

    - `openclaw logs --follow` را برای `Invalid config at`، `Config write rejected:`، یا `config reload skipped (invalid config)` بررسی کنید.
    - جدیدترین `openclaw.json.clobbered.*` یا `openclaw.json.rejected.*` کنار پیکربندی فعال را بررسی کنید.
    - `openclaw config validate` و `openclaw doctor --fix` را اجرا کنید.
    - فقط کلیدهای موردنظر را با `openclaw config set` یا `config.patch` برگردانید.
    - اگر آخرین نسخه سالم شناخته‌شده یا payload ردشده ندارید، از پشتیبان بازیابی کنید، یا `openclaw doctor` را دوباره اجرا کنید و کانال‌ها/مدل‌ها را دوباره پیکربندی کنید.
    - اگر این غیرمنتظره بود، یک باگ ثبت کنید و آخرین پیکربندی شناخته‌شده یا هر پشتیبانی را ضمیمه کنید.
    - یک عامل کدنویسی محلی اغلب می‌تواند از روی لاگ‌ها یا تاریخچه، یک پیکربندی کارآمد را بازسازی کند.

    جلوگیری:

    - برای تغییرات کوچک از `openclaw config set` استفاده کنید.
    - برای ویرایش‌های تعاملی از `openclaw configure` استفاده کنید.
    - وقتی از مسیر دقیق یا شکل فیلد مطمئن نیستید، ابتدا از `config.schema.lookup` استفاده کنید؛ این یک گره schema سطحی به‌همراه خلاصه‌های فرزند فوری برای بررسی عمیق‌تر برمی‌گرداند.
    - برای ویرایش‌های جزئی RPC از `config.patch` استفاده کنید؛ `config.apply` را فقط برای جایگزینی کامل پیکربندی نگه دارید.
    - اگر از ابزار عامل‌محور `gateway` از داخل اجرای عامل استفاده می‌کنید، همچنان نوشتن در `tools.exec.ask` / `tools.exec.security` (از جمله aliasهای قدیمی `tools.bash.*` که به همان مسیرهای exec محافظت‌شده نرمال می‌شوند) را رد می‌کند.

    مستندات: [پیکربندی](/fa/cli/config)، [پیکربندی کردن](/fa/cli/configure)، [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-rejected-invalid-config)، [Doctor](/fa/gateway/doctor).

  </Accordion>

  <Accordion title="چگونه یک Gateway مرکزی با workerهای تخصصی روی دستگاه‌های مختلف اجرا کنم؟">
    الگوی رایج **یک Gateway** (مثلاً Raspberry Pi) به‌همراه **گره‌ها** و **عامل‌ها** است:

    - **Gateway (مرکزی):** مالک کانال‌ها (Signal/WhatsApp)، مسیریابی و نشست‌ها است.
    - **گره‌ها (دستگاه‌ها):** Macها/iOS/Android به‌عنوان تجهیزات جانبی متصل می‌شوند و ابزارهای محلی (`system.run`، `canvas`، `camera`) را ارائه می‌کنند.
    - **عامل‌ها (workerها):** مغزها/فضاهای کاری جداگانه برای نقش‌های ویژه (مثلاً "Hetzner ops"، "Personal data").
    - **زیرعامل‌ها:** وقتی موازی‌سازی می‌خواهید، کار پس‌زمینه را از یک عامل اصلی ایجاد کنید.
    - **TUI:** به Gateway وصل شوید و بین عامل‌ها/نشست‌ها جابه‌جا شوید.

    مستندات: [گره‌ها](/fa/nodes)، [دسترسی از راه دور](/fa/gateway/remote)، [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [زیرعامل‌ها](/fa/tools/subagents)، [TUI](/fa/web/tui).

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

    مقدار پیش‌فرض `false` (با رابط قابل مشاهده) است. حالت headless در برخی سایت‌ها احتمال بیشتری دارد بررسی‌های ضدربات را فعال کند. [مرورگر](/fa/tools/browser) را ببینید.

    حالت headless از **همان موتور Chromium** استفاده می‌کند و برای بیشتر خودکارسازی‌ها (فرم‌ها، کلیک‌ها، scraping، ورودها) کار می‌کند. تفاوت‌های اصلی:

    - پنجره مرورگر قابل مشاهده وجود ندارد (اگر به تصویر نیاز دارید از screenshot استفاده کنید).
    - برخی سایت‌ها درباره خودکارسازی در حالت headless سخت‌گیرترند (CAPTCHAها، ضدربات).
      برای مثال، X/Twitter اغلب نشست‌های headless را مسدود می‌کند.

  </Accordion>

  <Accordion title="چگونه از Brave برای کنترل مرورگر استفاده کنم؟">
    `browser.executablePath` را روی باینری Brave خود (یا هر مرورگر مبتنی بر Chromium) تنظیم کنید و Gateway را راه‌اندازی مجدد کنید.
    نمونه‌های کامل پیکربندی را در [مرورگر](/fa/tools/browser#use-brave-or-another-chromium-based-browser) ببینید.
  </Accordion>
</AccordionGroup>

## Gatewayها و گره‌های راه دور

<AccordionGroup>
  <Accordion title="فرمان‌ها چگونه بین Telegram، Gateway و گره‌ها منتشر می‌شوند؟">
    پیام‌های Telegram توسط **Gateway** مدیریت می‌شوند. Gateway عامل را اجرا می‌کند و فقط وقتی ابزار گره لازم باشد، سپس از طریق **Gateway WebSocket** گره‌ها را فراخوانی می‌کند:

    Telegram → Gateway → عامل → `node.*` → گره → Gateway → Telegram

    گره‌ها ترافیک ورودی ارائه‌دهنده را نمی‌بینند؛ آن‌ها فقط فراخوانی‌های RPC گره را دریافت می‌کنند.

  </Accordion>

  <Accordion title="اگر Gateway از راه دور میزبانی شود، عامل من چگونه می‌تواند به رایانه من دسترسی داشته باشد؟">
    پاسخ کوتاه: **رایانه خود را به‌عنوان یک گره pair کنید**. Gateway جای دیگری اجرا می‌شود، اما می‌تواند ابزارهای `node.*` (صفحه، دوربین، سیستم) را روی دستگاه محلی شما از طریق Gateway WebSocket فراخوانی کند.

    راه‌اندازی معمول:

    1. Gateway را روی میزبان همیشه‌روشن (VPS/سرور خانگی) اجرا کنید.
    2. میزبان Gateway و رایانه خود را در یک tailnet قرار دهید.
    3. مطمئن شوید Gateway WS در دسترس است (اتصال tailnet یا تونل SSH).
    4. برنامه macOS را محلی باز کنید و در حالت **Remote over SSH** (یا tailnet مستقیم) متصل شوید
       تا بتواند به‌عنوان گره ثبت شود.
    5. گره را روی Gateway تأیید کنید:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    هیچ پل TCP جداگانه‌ای لازم نیست؛ گره‌ها از طریق Gateway WebSocket متصل می‌شوند.

    یادآوری امنیتی: pair کردن یک گره macOS اجازه `system.run` را روی آن دستگاه می‌دهد. فقط دستگاه‌هایی را pair کنید که به آن‌ها اعتماد دارید، و [امنیت](/fa/gateway/security) را مرور کنید.

    مستندات: [گره‌ها](/fa/nodes)، [پروتکل Gateway](/fa/gateway/protocol)، [حالت راه دور macOS](/fa/platforms/mac/remote)، [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="Tailscale متصل است اما پاسخی دریافت نمی‌کنم. حالا چه کنم؟">
    موارد پایه را بررسی کنید:

    - Gateway در حال اجرا است: `openclaw gateway status`
    - سلامت Gateway: `openclaw status`
    - سلامت کانال: `openclaw channels status`

    سپس احراز هویت و مسیریابی را بررسی کنید:

    - اگر از Tailscale Serve استفاده می‌کنید، مطمئن شوید `gateway.auth.allowTailscale` درست تنظیم شده است.
    - اگر از طریق تونل SSH متصل می‌شوید، تأیید کنید تونل محلی بالا است و به پورت درست اشاره می‌کند.
    - تأیید کنید allowlistهای شما (DM یا گروه) حساب شما را شامل می‌شوند.

    مستندات: [Tailscale](/fa/gateway/tailscale)، [دسترسی از راه دور](/fa/gateway/remote)، [کانال‌ها](/fa/channels).

  </Accordion>

  <Accordion title="آیا دو نمونه OpenClaw می‌توانند با هم صحبت کنند (محلی + VPS)؟">
    بله. پل داخلی "bot-to-bot" وجود ندارد، اما می‌توانید آن را به چند روش قابل اعتماد وصل کنید:

    **ساده‌ترین:** از یک کانال چت معمولی استفاده کنید که هر دو بات به آن دسترسی دارند (Telegram/Slack/WhatsApp).
    کاری کنید Bot A پیامی به Bot B بفرستد، سپس بگذارید Bot B طبق معمول پاسخ دهد.

    **پل CLI (عمومی):** اسکریپتی اجرا کنید که Gateway دیگر را با
    `openclaw agent --message ... --deliver` فراخوانی کند و یک چت را هدف بگیرد که بات دیگر در آن گوش می‌دهد. اگر یک بات روی VPS راه دور است، CLI خود را از طریق SSH/Tailscale به آن Gateway راه دور اشاره دهید ( [دسترسی از راه دور](/fa/gateway/remote) را ببینید).

    الگوی نمونه (از دستگاهی اجرا کنید که می‌تواند به Gateway هدف برسد):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نکته: یک محافظ اضافه کنید تا دو بات بی‌پایان loop نشوند (فقط با mention، allowlistهای کانال،
    یا قانون "به پیام‌های بات پاسخ نده").

    مستندات: [دسترسی از راه دور](/fa/gateway/remote)، [CLI عامل](/fa/cli/agent)، [ارسال عامل](/fa/tools/agent-send).

  </Accordion>

  <Accordion title="آیا برای چند عامل به VPSهای جداگانه نیاز دارم؟">
    خیر. یک Gateway می‌تواند چند عامل را میزبانی کند، هرکدام با فضای کاری، پیش‌فرض‌های مدل،
    و مسیریابی مخصوص خود. این راه‌اندازی معمول است و از اجرای یک VPS برای هر عامل بسیار ارزان‌تر و ساده‌تر است.

    فقط وقتی از VPSهای جداگانه استفاده کنید که به جداسازی سخت (مرزهای امنیتی) یا پیکربندی‌های بسیار متفاوتی نیاز دارید که نمی‌خواهید به اشتراک بگذارید. در غیر این صورت، یک Gateway نگه دارید و از چند عامل یا زیرعامل استفاده کنید.

  </Accordion>

  <Accordion title="آیا استفاده از یک Node روی لپ‌تاپ شخصی‌ام به‌جای SSH از یک VPS مزیتی دارد؟">
    بله - Nodeها روش درجه‌اول برای دسترسی به لپ‌تاپ شما از یک Gateway راه‌دور هستند و
    فراتر از دسترسی shell امکانات فراهم می‌کنند. Gateway روی macOS/Linux اجرا می‌شود (Windows از طریق WSL2) و
    سبک است (یک VPS کوچک یا دستگاهی در سطح Raspberry Pi کافی است؛ ۴ GB RAM کاملا کافی است)، بنابراین یک
    چیدمان رایج، یک میزبان همیشه‌روشن به‌همراه لپ‌تاپ شما به‌عنوان Node است.

    - **نیازی به SSH ورودی نیست.** Nodeها به WebSocket مربوط به Gateway وصل می‌شوند و از جفت‌سازی دستگاه استفاده می‌کنند.
    - **کنترل‌های اجرای امن‌تر.** `system.run` با allowlistها/تأییدهای Node روی همان لپ‌تاپ محدود می‌شود.
    - **ابزارهای دستگاه بیشتر.** Nodeها علاوه بر `system.run`، `canvas`، `camera` و `screen` را هم ارائه می‌کنند.
    - **اتوماسیون مرورگر محلی.** Gateway را روی یک VPS نگه دارید، اما Chrome را به‌صورت محلی از طریق میزبان Node روی لپ‌تاپ اجرا کنید، یا از طریق Chrome MCP به Chrome محلی روی میزبان متصل شوید.

    SSH برای دسترسی shell موردی مناسب است، اما Nodeها برای گردش‌کارهای مداوم عامل و
    اتوماسیون دستگاه ساده‌ترند.

    مستندات: [Nodeها](/fa/nodes)، [CLI Nodeها](/fa/cli/nodes)، [مرورگر](/fa/tools/browser).

  </Accordion>

  <Accordion title="آیا Nodeها سرویس Gateway اجرا می‌کنند؟">
    خیر. فقط **یک gateway** باید روی هر میزبان اجرا شود، مگر اینکه عمدا پروفایل‌های ایزوله اجرا کنید (نگاه کنید به [چند Gateway](/fa/gateway/multiple-gateways)). Nodeها پیرامونی‌هایی هستند که
    به gateway وصل می‌شوند (Nodeهای iOS/Android، یا «حالت Node» macOS در برنامه menubar). برای میزبان‌های Node
    بدون رابط گرافیکی و کنترل CLI، [CLI میزبان Node](/fa/cli/node) را ببینید.

    برای تغییرات سطح `gateway`، `discovery` و Pluginهای میزبانی‌شده، راه‌اندازی مجدد کامل لازم است.

  </Accordion>

  <Accordion title="آیا راه API / RPC برای اعمال config وجود دارد؟">
    بله.

    - `config.schema.lookup`: پیش از نوشتن، یک زیردرخت config را همراه با Node سطحی schema، راهنمای UI تطبیق‌یافته و خلاصه‌های فرزندهای مستقیم بررسی کنید
    - `config.get`: snapshot فعلی + hash را دریافت کنید
    - `config.patch`: به‌روزرسانی جزئی امن (برای بیشتر ویرایش‌های RPC ترجیحی)؛ هرجا ممکن باشد hot-reload می‌کند و هرجا لازم باشد راه‌اندازی مجدد انجام می‌دهد
    - `config.apply`: اعتبارسنجی + جایگزینی کل config؛ هرجا ممکن باشد hot-reload می‌کند و هرجا لازم باشد راه‌اندازی مجدد انجام می‌دهد
    - ابزار runtime مربوط به `gateway` برای عامل همچنان بازنویسی `tools.exec.ask` / `tools.exec.security` را رد می‌کند؛ aliasهای legacy مربوط به `tools.bash.*` به همان مسیرهای exec محافظت‌شده normalize می‌شوند

  </Accordion>

  <Accordion title="حداقل config معقول برای اولین نصب">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    این کار workspace شما را تنظیم می‌کند و محدود می‌کند چه کسی بتواند bot را فعال کند.

  </Accordion>

  <Accordion title="چگونه Tailscale را روی یک VPS راه‌اندازی کنم و از Mac خودم وصل شوم؟">
    گام‌های حداقلی:

    1. **نصب + ورود روی VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **نصب + ورود روی Mac**
       - از برنامه Tailscale استفاده کنید و وارد همان tailnet شوید.
    3. **فعال‌سازی MagicDNS (توصیه‌شده)**
       - در کنسول مدیریت Tailscale، MagicDNS را فعال کنید تا VPS نامی پایدار داشته باشد.
    4. **استفاده از hostname مربوط به tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    اگر Control UI را بدون SSH می‌خواهید، از Tailscale Serve روی VPS استفاده کنید:

    ```bash
    openclaw gateway --tailscale serve
    ```

    این کار gateway را به loopback محدود نگه می‌دارد و HTTPS را از طریق Tailscale در دسترس می‌گذارد. [Tailscale](/fa/gateway/tailscale) را ببینید.

  </Accordion>

  <Accordion title="چگونه یک Node روی Mac را به یک Gateway راه‌دور وصل کنم (Tailscale Serve)؟">
    Serve، **Control UI + WS مربوط به Gateway** را در دسترس می‌گذارد. Nodeها از طریق همان endpoint مربوط به Gateway WS وصل می‌شوند.

    راه‌اندازی پیشنهادی:

    1. **مطمئن شوید VPS + Mac روی همان tailnet هستند**.
    2. **از برنامه macOS در حالت Remote استفاده کنید** (هدف SSH می‌تواند hostname مربوط به tailnet باشد).
       برنامه پورت Gateway را tunnel می‌کند و به‌عنوان Node وصل می‌شود.
    3. **Node را روی gateway تأیید کنید**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    مستندات: [پروتکل Gateway](/fa/gateway/protocol)، [Discovery](/fa/gateway/discovery)، [حالت راه‌دور macOS](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="آیا باید روی لپ‌تاپ دوم نصب کنم یا فقط یک Node اضافه کنم؟">
    اگر فقط به **ابزارهای محلی** (screen/camera/exec) روی لپ‌تاپ دوم نیاز دارید، آن را به‌عنوان
    **Node** اضافه کنید. این کار یک Gateway واحد نگه می‌دارد و از config تکراری جلوگیری می‌کند. ابزارهای Node محلی
    در حال حاضر فقط برای macOS هستند، اما قصد داریم آن‌ها را به سیستم‌عامل‌های دیگر هم گسترش دهیم.

    فقط وقتی Gateway دوم نصب کنید که به **ایزوله‌سازی سخت** یا دو bot کاملا جدا نیاز دارید.

    مستندات: [Nodeها](/fa/nodes)، [CLI Nodeها](/fa/cli/nodes)، [چند Gateway](/fa/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغیرهای محیطی و بارگذاری .env

<AccordionGroup>
  <Accordion title="OpenClaw چگونه متغیرهای محیطی را بارگذاری می‌کند؟">
    OpenClaw متغیرهای محیطی را از فرایند والد (shell، launchd/systemd، CI و غیره) می‌خواند و علاوه بر آن این‌ها را بارگذاری می‌کند:

    - `.env` از دایرکتوری کاری فعلی
    - یک fallback سراسری `.env` از `~/.openclaw/.env` (یا همان `$OPENCLAW_STATE_DIR/.env`)

    هیچ‌کدام از فایل‌های `.env` متغیرهای محیطی موجود را override نمی‌کنند.
    متغیرهای credential مربوط به provider یک استثنا برای `.env` workspace هستند: کلیدهایی مانند
    `GEMINI_API_KEY`، `XAI_API_KEY` یا `MISTRAL_API_KEY` از `.env` مربوط به workspace
    نادیده گرفته می‌شوند و باید در محیط فرایند، `~/.openclaw/.env` یا config `env` قرار بگیرند.

    همچنین می‌توانید متغیرهای محیطی inline را در config تعریف کنید (فقط اگر در env فرایند موجود نباشند اعمال می‌شوند):

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

  <Accordion title="Gateway را از طریق سرویس شروع کردم و متغیرهای محیطی‌ام ناپدید شدند. حالا چه کار کنم؟">
    دو اصلاح رایج:

    1. کلیدهای گمشده را در `~/.openclaw/.env` قرار دهید تا حتی وقتی سرویس env مربوط به shell شما را به ارث نمی‌برد، برداشته شوند.
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

    این کار shell ورود شما را اجرا می‌کند و فقط کلیدهای موردانتظارِ گمشده را import می‌کند (هرگز override نمی‌کند). معادل‌های متغیر محیطی:
    `OPENCLAW_LOAD_SHELL_ENV=1`، `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN را تنظیم کردم، اما وضعیت مدل‌ها "Shell env: off." نشان می‌دهد. چرا؟'>
    `openclaw models status` گزارش می‌دهد که آیا **import از shell env** فعال است یا نه. "Shell env: off"
    به این معنی **نیست** که متغیرهای محیطی شما گم شده‌اند - فقط یعنی OpenClaw به‌طور خودکار
    shell ورود شما را بارگذاری نمی‌کند.

    اگر Gateway به‌عنوان سرویس اجرا شود (launchd/systemd)، محیط shell شما را
    به ارث نمی‌برد. با یکی از این روش‌ها اصلاح کنید:

    1. token را در `~/.openclaw/.env` قرار دهید:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. یا import از shell را فعال کنید (`env.shellEnv.enabled: true`).
    3. یا آن را به بلوک `env` در config خود اضافه کنید (فقط اگر موجود نباشد اعمال می‌شود).

    سپس gateway را restart کنید و دوباره بررسی کنید:

    ```bash
    openclaw models status
    ```

    tokenهای Copilot از `COPILOT_GITHUB_TOKEN` خوانده می‌شوند (همچنین `GH_TOKEN` / `GITHUB_TOKEN`).
    [/concepts/model-providers](/fa/concepts/model-providers) و [/environment](/fa/help/environment) را ببینید.

  </Accordion>
</AccordionGroup>

## جلسه‌ها و چند گفت‌وگو

<AccordionGroup>
  <Accordion title="چگونه یک گفت‌وگوی تازه شروع کنم؟">
    `/new` یا `/reset` را به‌عنوان یک پیام مستقل ارسال کنید. [مدیریت جلسه](/fa/concepts/session) را ببینید.
  </Accordion>

  <Accordion title="اگر هرگز /new نفرستم، آیا جلسه‌ها به‌طور خودکار reset می‌شوند؟">
    جلسه‌ها می‌توانند پس از `session.idleMinutes` منقضی شوند، اما این به‌صورت **پیش‌فرض غیرفعال** است (پیش‌فرض **0**).
    برای فعال‌سازی انقضای idle، آن را روی یک مقدار مثبت تنظیم کنید. وقتی فعال باشد، **پیام بعدی**
    پس از دوره idle، یک شناسه جلسه تازه برای همان کلید chat شروع می‌کند.
    این کار transcriptها را حذف نمی‌کند - فقط یک جلسه جدید شروع می‌کند.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="آیا راهی هست که تیمی از instanceهای OpenClaw بسازم (یک CEO و چندین عامل)؟">
    بله، از طریق **مسیریابی چندعاملی** و **زیرعامل‌ها**. می‌توانید یک عامل coordinator
    و چند عامل worker با workspaceها و مدل‌های خودشان بسازید.

    با این حال، بهتر است این را یک **آزمایش سرگرم‌کننده** بدانید. مصرف token آن زیاد است و اغلب
    از استفاده از یک bot با جلسه‌های جداگانه کم‌بازده‌تر است. مدل معمولی که ما
    در نظر داریم، یک bot است که با آن صحبت می‌کنید و برای کارهای موازی جلسه‌های متفاوت دارد. همان
    bot می‌تواند هنگام نیاز زیرعامل‌ها را هم spawn کند.

    مستندات: [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [زیرعامل‌ها](/fa/tools/subagents)، [CLI عامل‌ها](/fa/cli/agents).

  </Accordion>

  <Accordion title="چرا context در میانه کار truncate شد؟ چگونه از آن جلوگیری کنم؟">
    context جلسه به پنجره مدل محدود است. chatهای طولانی، خروجی‌های بزرگ ابزار، یا فایل‌های زیاد
    می‌توانند Compaction یا truncation را فعال کنند.

    چیزهایی که کمک می‌کنند:

    - از bot بخواهید وضعیت فعلی را خلاصه کند و آن را در یک فایل بنویسد.
    - پیش از کارهای طولانی از `/compact` استفاده کنید، و هنگام تغییر موضوع از `/new`.
    - context مهم را در workspace نگه دارید و از bot بخواهید آن را دوباره بخواند.
    - برای کار طولانی یا موازی از زیرعامل‌ها استفاده کنید تا chat اصلی کوچک‌تر بماند.
    - اگر این اتفاق زیاد رخ می‌دهد، مدلی با پنجره context بزرگ‌تر انتخاب کنید.

  </Accordion>

  <Accordion title="چگونه OpenClaw را کاملا reset کنم اما نصب‌شده نگه دارم؟">
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

    - اگر onboarding یک config موجود ببیند، **Reset** را هم پیشنهاد می‌دهد. [Onboarding (CLI)](/fa/start/wizard) را ببینید.
    - اگر از profileها استفاده کرده‌اید (`--profile` / `OPENCLAW_PROFILE`)، هر state dir را reset کنید (پیش‌فرض‌ها `~/.openclaw-<profile>` هستند).
    - reset توسعه: `openclaw gateway --dev --reset` (فقط توسعه؛ config توسعه + credentialها + جلسه‌ها + workspace را پاک می‌کند).

  </Accordion>

  <Accordion title='خطاهای "context too large" می‌گیرم - چگونه reset یا compact کنم؟'>
    یکی از این‌ها را استفاده کنید:

    - **Compact** (گفت‌وگو را نگه می‌دارد اما turnهای قدیمی‌تر را خلاصه می‌کند):

      ```
      /compact
      ```

      یا `/compact <instructions>` برای هدایت خلاصه.

    - **Reset** (شناسه جلسه تازه برای همان کلید chat):

      ```
      /new
      /reset
      ```

    اگر همچنان رخ می‌دهد:

    - **هرس جلسه** (`agents.defaults.contextPruning`) را فعال یا تنظیم کنید تا خروجی ابزار قدیمی trim شود.
    - از مدلی با پنجره context بزرگ‌تر استفاده کنید.

    مستندات: [Compaction](/fa/concepts/compaction)، [هرس جلسه](/fa/concepts/session-pruning)، [مدیریت جلسه](/fa/concepts/session).

  </Accordion>

  <Accordion title='چرا "LLM request rejected: messages.content.tool_use.input field required" را می‌بینم؟'>
    این یک خطای اعتبارسنجی provider است: مدل یک بلوک `tool_use` بدون `input` الزامی
    تولید کرده است. معمولا یعنی تاریخچه جلسه stale یا خراب شده است (اغلب پس از threadهای طولانی
    یا تغییر ابزار/schema).

    اصلاح: با `/new` یک جلسه تازه شروع کنید (پیام مستقل).

  </Accordion>

  <Accordion title="چرا هر ۳۰ دقیقه پیام‌های Heartbeat دریافت می‌کنم؟">
    Heartbeatها به‌صورت پیش‌فرض هر **30m** اجرا می‌شوند (**1h** هنگام استفاده از OAuth auth). آن‌ها را تنظیم یا غیرفعال کنید:

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

    اگر `HEARTBEAT.md` وجود داشته باشد اما عملا خالی باشد (فقط خطوط خالی،
    دیدگاه‌های Markdown/HTML، سرفصل‌های Markdown مانند `# Heading`، نشانگرهای fence،
    یا stubهای خالی چک‌لیست)، OpenClaw اجرای Heartbeat را برای صرفه‌جویی در فراخوانی‌های API رد می‌کند.
    اگر فایل وجود نداشته باشد، Heartbeat همچنان اجرا می‌شود و مدل تصمیم می‌گیرد چه کاری انجام دهد.

    بازنویسی‌های ویژه هر عامل از `agents.list[].heartbeat` استفاده می‌کنند. مستندات: [Heartbeat](/fa/gateway/heartbeat).

  </Accordion>

  <Accordion title='آیا باید یک «حساب ربات» به یک گروه WhatsApp اضافه کنم؟'>
    خیر. OpenClaw روی **حساب خودتان** اجرا می‌شود، پس اگر شما در گروه باشید، OpenClaw می‌تواند آن را ببیند.
    به‌طور پیش‌فرض، پاسخ‌های گروهی تا زمانی که فرستنده‌ها را مجاز کنید (`groupPolicy: "allowlist"`) مسدود هستند.

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
    گزینه ۱ (سریع‌ترین): گزارش‌ها را دنبال کنید و یک پیام آزمایشی در گروه بفرستید:

    ```bash
    openclaw logs --follow --json
    ```

    به‌دنبال `chatId` (یا `from`) بگردید که به `@g.us` ختم می‌شود، مانند:
    `1234567890-1234567890@g.us`.

    گزینه ۲ (اگر از قبل پیکربندی/در allowlist قرار داده شده است): گروه‌ها را از پیکربندی فهرست کنید:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    مستندات: [WhatsApp](/fa/channels/whatsapp)، [فهرست](/fa/cli/directory)، [گزارش‌ها](/fa/cli/logs).

  </Accordion>

  <Accordion title="چرا OpenClaw در یک گروه پاسخ نمی‌دهد؟">
    دو علت رایج:

    - gating بر اساس mention روشن است (پیش‌فرض). باید ربات را @mention کنید (یا با `mentionPatterns` مطابقت دهید).
    - شما `channels.whatsapp.groups` را بدون `"*"` پیکربندی کرده‌اید و گروه در allowlist نیست.

    [گروه‌ها](/fa/channels/groups) و [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.

  </Accordion>

  <Accordion title="آیا گروه‌ها/رشته‌ها زمینه را با DMها به اشتراک می‌گذارند؟">
    چت‌های مستقیم به‌طور پیش‌فرض در نشست اصلی ادغام می‌شوند. گروه‌ها/کانال‌ها کلیدهای نشست خودشان را دارند، و موضوع‌های Telegram / رشته‌های Discord نشست‌های جداگانه هستند. [گروه‌ها](/fa/channels/groups) و [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.
  </Accordion>

  <Accordion title="چند workspace و عامل می‌توانم ایجاد کنم؟">
    محدودیت سختی وجود ندارد. ده‌ها (حتی صدها) مورد مشکلی ندارد، اما مراقب این موارد باشید:

    - **رشد دیسک:** نشست‌ها + transcriptها زیر `~/.openclaw/agents/<agentId>/sessions/` قرار می‌گیرند.
    - **هزینه توکن:** عامل‌های بیشتر یعنی استفاده هم‌زمان بیشتر از مدل.
    - **سربار عملیات:** پروفایل‌های احراز هویت، workspaceها، و مسیریابی کانال به‌ازای هر عامل.

    نکته‌ها:

    - برای هر عامل یک workspace **فعال** نگه دارید (`agents.defaults.workspace`).
    - اگر دیسک رشد کرد، نشست‌های قدیمی را هرس کنید (JSONL یا ورودی‌های ذخیره را حذف کنید).
    - از `openclaw doctor` برای پیدا کردن workspaceهای پراکنده و ناسازگاری‌های پروفایل استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم چند ربات یا چت را هم‌زمان اجرا کنم (Slack)، و چگونه باید آن را راه‌اندازی کنم؟">
    بله. از **مسیریابی چندعاملی** برای اجرای چند عامل ایزوله و مسیریابی پیام‌های ورودی بر اساس
    کانال/حساب/همتا استفاده کنید. Slack به‌عنوان یک کانال پشتیبانی می‌شود و می‌تواند به عامل‌های مشخصی متصل شود.

    دسترسی مرورگر قدرتمند است، اما به معنی «هر کاری که انسان می‌تواند انجام دهد» نیست - ضدربات، CAPTCHAها، و MFA همچنان می‌توانند
    automation را مسدود کنند. برای قابل‌اعتمادترین کنترل مرورگر، از Chrome MCP محلی روی میزبان استفاده کنید،
    یا از CDP روی دستگاهی استفاده کنید که واقعا مرورگر را اجرا می‌کند.

    راه‌اندازی پیشنهادی:

    - میزبان Gateway همیشه روشن (VPS/Mac mini).
    - یک عامل برای هر نقش (bindingها).
    - کانال(های) Slack متصل به آن عامل‌ها.
    - مرورگر محلی از طریق Chrome MCP یا یک node در صورت نیاز.

    مستندات: [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [Slack](/fa/channels/slack)،
    [مرورگر](/fa/tools/browser)، [Nodeها](/fa/nodes).

  </Accordion>
</AccordionGroup>

## مدل‌ها، failover، و پروفایل‌های احراز هویت

پرسش‌وپاسخ مدل — پیش‌فرض‌ها، انتخاب، aliasها، جابه‌جایی، failover، پروفایل‌های احراز هویت —
در [پرسش‌های متداول مدل‌ها](/fa/help/faq-models) قرار دارد.

## Gateway: پورت‌ها، «از قبل در حال اجرا»، و حالت remote

<AccordionGroup>
  <Accordion title="Gateway از چه پورتی استفاده می‌کند؟">
    `gateway.port` پورت multiplexed واحد را برای WebSocket + HTTP (Control UI، hookها، و غیره) کنترل می‌کند.

    اولویت:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='چرا openclaw gateway status می‌گوید "Runtime: running" اما "Connectivity probe: failed"؟'>
    چون «در حال اجرا» نمای **supervisor** است (launchd/systemd/schtasks). connectivity probe همان CLI است که واقعا به WebSocket مربوط به gateway متصل می‌شود.

    از `openclaw gateway status` استفاده کنید و به این خط‌ها اعتماد کنید:

    - `Probe target:` (URLی که probe واقعا استفاده کرده است)
    - `Listening:` (چیزی که واقعا روی پورت bind شده است)
    - `Last gateway error:` (علت ریشه‌ای رایج وقتی فرایند زنده است اما پورت listen نمی‌کند)

  </Accordion>

  <Accordion title='چرا openclaw gateway status مقدارهای متفاوتی برای "Config (cli)" و "Config (service)" نشان می‌دهد؟'>
    شما در حال ویرایش یک فایل پیکربندی هستید در حالی که سرویس پیکربندی دیگری را اجرا می‌کند (اغلب ناسازگاری `--profile` / `OPENCLAW_STATE_DIR`).

    رفع مشکل:

    ```bash
    openclaw gateway install --force
    ```

    آن را از همان `--profile` / محیطی اجرا کنید که می‌خواهید سرویس از آن استفاده کند.

  </Accordion>

  <Accordion title='عبارت "another gateway instance is already listening" یعنی چه؟'>
    OpenClaw با bind کردن listener مربوط به WebSocket بلافاصله هنگام شروع (پیش‌فرض `ws://127.0.0.1:18789`) یک قفل runtime اعمال می‌کند. اگر bind با `EADDRINUSE` شکست بخورد، `GatewayLockError` پرتاب می‌کند که نشان می‌دهد یک instance دیگر از قبل در حال listen کردن است.

    رفع مشکل: instance دیگر را متوقف کنید، پورت را آزاد کنید، یا با `openclaw gateway --port <port>` اجرا کنید.

  </Accordion>

  <Accordion title="چگونه OpenClaw را در حالت remote اجرا کنم (کلاینت به Gateway در جای دیگری متصل می‌شود)؟">
    `gateway.mode: "remote"` را تنظیم کنید و به یک URL راه دور WebSocket اشاره کنید، در صورت تمایل همراه با اعتبارنامه‌های remote مبتنی بر shared-secret:

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

    - `openclaw gateway` فقط زمانی شروع می‌شود که `gateway.mode` برابر `local` باشد (یا flag بازنویسی را بدهید).
    - برنامه macOS فایل پیکربندی را زیر نظر می‌گیرد و وقتی این مقدارها تغییر کنند، حالت‌ها را زنده عوض می‌کند.
    - `gateway.remote.token` / `.password` فقط اعتبارنامه‌های remote سمت کلاینت هستند؛ به‌تنهایی احراز هویت Gateway محلی را فعال نمی‌کنند.

  </Accordion>

  <Accordion title='Control UI می‌گوید "unauthorized" (یا مدام دوباره متصل می‌شود). حالا چه کنم؟'>
    مسیر احراز هویت gateway شما و روش احراز هویت UI با هم مطابقت ندارند.

    واقعیت‌ها (از کد):

    - Control UI توکن را برای نشست tab فعلی مرورگر و URL انتخاب‌شده gateway در `sessionStorage` نگه می‌دارد، بنابراین refreshهای همان tab بدون بازگرداندن ماندگاری توکن long-lived در localStorage همچنان کار می‌کنند.
    - در `AUTH_TOKEN_MISMATCH`، کلاینت‌های مورد اعتماد می‌توانند وقتی gateway hintهای retry برمی‌گرداند (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`) یک retry محدود با یک توکن دستگاه cached انجام دهند.
    - آن retry با توکن cached اکنون scopeهای تاییدشده cached ذخیره‌شده همراه توکن دستگاه را دوباره استفاده می‌کند. فراخوان‌های explicit `deviceToken` / explicit `scopes` همچنان به‌جای ارث‌بری scopeهای cached، مجموعه scope درخواستی خودشان را نگه می‌دارند.
    - خارج از آن مسیر retry، اولویت احراز هویت اتصال ابتدا shared token/password صریح، سپس `deviceToken` صریح، سپس توکن دستگاه ذخیره‌شده، سپس bootstrap token است.
    - bootstrap داخلی با setup-code فقط node است. پس از تایید، یک توکن دستگاه node با `scopes: []` برمی‌گرداند و operator token واگذارشده برنمی‌گرداند.

    رفع مشکل:

    - سریع‌ترین: `openclaw dashboard` (URL داشبورد را چاپ + کپی می‌کند، تلاش می‌کند باز کند؛ اگر headless باشد hint مربوط به SSH را نشان می‌دهد).
    - اگر هنوز توکن ندارید: `openclaw doctor --generate-gateway-token`.
    - اگر remote است، ابتدا tunnel بزنید: `ssh -N -L 18789:127.0.0.1:18789 user@host` سپس `http://127.0.0.1:18789/` را باز کنید.
    - حالت shared-secret: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` یا `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` را تنظیم کنید، سپس secret متناظر را در تنظیمات Control UI جای‌گذاری کنید.
    - حالت Tailscale Serve: مطمئن شوید `gateway.auth.allowTailscale` فعال است و URL مربوط به Serve را باز می‌کنید، نه یک URL خام loopback/tailnet که headerهای هویت Tailscale را دور می‌زند.
    - حالت trusted-proxy: مطمئن شوید از طریق proxy آگاه از هویت پیکربندی‌شده وارد می‌شوید، نه یک URL خام gateway. proxyهای loopback روی همان میزبان نیز به `gateway.auth.trustedProxy.allowLoopback = true` نیاز دارند.
    - اگر ناسازگاری پس از یک retry ادامه داشت، توکن دستگاه جفت‌شده را rotate/دوباره تایید کنید:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - اگر آن فراخوان rotate گفت رد شده است، دو مورد را بررسی کنید:
      - نشست‌های دستگاه جفت‌شده فقط می‌توانند دستگاه **خودشان** را rotate کنند، مگر اینکه `operator.admin` هم داشته باشند
      - مقدارهای explicit `--scope` نمی‌توانند از scopeهای operator فعلی caller فراتر بروند
    - هنوز گیر کرده‌اید؟ `openclaw status --all` را اجرا کنید و [عیب‌یابی](/fa/gateway/troubleshooting) را دنبال کنید. برای جزئیات احراز هویت، [داشبورد](/fa/web/dashboard) را ببینید.

  </Accordion>

  <Accordion title="gateway.bind را روی tailnet تنظیم کردم اما نمی‌تواند bind کند و هیچ‌چیز listen نمی‌کند">
    bind با `tailnet` یک IP مربوط به Tailscale را از interfaceهای شبکه شما انتخاب می‌کند (100.64.0.0/10). اگر دستگاه روی Tailscale نباشد (یا interface خاموش باشد)، چیزی برای bind کردن وجود ندارد.

    رفع مشکل:

    - Tailscale را روی آن میزبان شروع کنید (تا یک آدرس 100.x داشته باشد)، یا
    - به `gateway.bind: "loopback"` / `"lan"` تغییر دهید.

    نکته: `tailnet` صریح است. `auto`، loopback را ترجیح می‌دهد؛ وقتی bind فقط برای tailnet می‌خواهید از `gateway.bind: "tailnet"` استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم چند Gateway را روی یک میزبان اجرا کنم؟">
    معمولا خیر - یک Gateway می‌تواند چندین کانال پیام‌رسان و عامل را اجرا کند. فقط وقتی به redundancy (مثلا ربات نجات) یا ایزولاسیون سخت نیاز دارید از چند Gateway استفاده کنید.

    بله، اما باید ایزوله کنید:

    - `OPENCLAW_CONFIG_PATH` (پیکربندی به‌ازای هر instance)
    - `OPENCLAW_STATE_DIR` (state به‌ازای هر instance)
    - `agents.defaults.workspace` (ایزولاسیون workspace)
    - `gateway.port` (پورت‌های یکتا)

    راه‌اندازی سریع (پیشنهادی):

    - برای هر instance از `openclaw --profile <name> ...` استفاده کنید (به‌طور خودکار `~/.openclaw-<name>` را ایجاد می‌کند).
    - در پیکربندی هر پروفایل یک `gateway.port` یکتا تنظیم کنید (یا برای اجراهای دستی `--port` بدهید).
    - یک سرویس به‌ازای هر پروفایل نصب کنید: `openclaw --profile <name> gateway install`.

    پروفایل‌ها همچنین نام سرویس‌ها را پسوندگذاری می‌کنند (`ai.openclaw.<profile>`؛ legacy `com.openclaw.*`، `openclaw-gateway-<profile>.service`، `OpenClaw Gateway (<profile>)`).
    راهنمای کامل: [چند Gateway](/fa/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='عبارت "invalid handshake" / کد 1008 یعنی چه؟'>
    Gateway یک **سرور WebSocket** است، و انتظار دارد اولین پیام حتما
    یک frame از نوع `connect` باشد. اگر هر چیز دیگری دریافت کند، اتصال را
    با **کد 1008** (نقض سیاست) می‌بندد.

    علت‌های رایج:

    - شما URL مربوط به **HTTP** را در مرورگر باز کرده‌اید (`http://...`) به‌جای یک کلاینت WS.
    - از پورت یا مسیر اشتباه استفاده کرده‌اید.
    - یک proxy یا tunnel headerهای احراز هویت را حذف کرده یا یک درخواست غیر Gateway فرستاده است.

    رفع سریع:

    1. از URL مربوط به WS استفاده کنید: `ws://<host>:18789` (یا اگر HTTPS است `wss://...`).
    2. پورت WS را در یک tab معمولی مرورگر باز نکنید.
    3. اگر احراز هویت روشن است، token/password را در frame مربوط به `connect` وارد کنید.

    اگر از CLI یا TUI استفاده می‌کنید، URL باید شبیه این باشد:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    جزئیات پروتکل: [پروتکل Gateway](/fa/gateway/protocol).

  </Accordion>
</AccordionGroup>

## ثبت گزارش و اشکال‌زدایی

<AccordionGroup>
  <Accordion title="گزارش‌ها کجا هستند؟">
    گزارش‌های فایل (ساختاریافته):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    می‌توانید یک مسیر پایدار را از طریق `logging.file` تنظیم کنید. سطح گزارش فایل با `logging.level` کنترل می‌شود. پرگویی کنسول با `--verbose` و `logging.consoleLevel` کنترل می‌شود.

    سریع‌ترین دنباله‌گیری گزارش:

    ```bash
    openclaw logs --follow
    ```

    گزارش‌های سرویس/سرپرست (وقتی Gateway از طریق launchd/systemd اجرا می‌شود):

    - خروجی stdout مربوط به macOS launchd: `~/Library/Logs/openclaw/gateway.log` (پروفایل‌ها از `gateway-<profile>.log` استفاده می‌کنند؛ stderr سرکوب می‌شود)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    برای اطلاعات بیشتر، [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید.

  </Accordion>

  <Accordion title="چگونه سرویس Gateway را شروع/متوقف/راه‌اندازی مجدد کنم؟">
    از کمک‌کننده‌های Gateway استفاده کنید:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر Gateway را دستی اجرا می‌کنید، `openclaw gateway --force` می‌تواند درگاه را بازپس بگیرد. [Gateway](/fa/gateway) را ببینید.

  </Accordion>

  <Accordion title="ترمینالم را در Windows بستم - چگونه OpenClaw را دوباره راه‌اندازی کنم؟">
    **سه حالت نصب Windows** وجود دارد:

    **۱) راه‌اندازی محلی Windows Hub:** برنامه بومی یک Gateway محلی مبتنی بر WSL را که مالکیتش با برنامه است مدیریت می‌کند.

    **OpenClaw Companion** را از منوی Start یا tray باز کنید، سپس از
    **Gateway Setup** یا زبانه Connections استفاده کنید.

    **۲) Gateway دستی WSL2:** Gateway داخل Linux اجرا می‌شود.

    PowerShell را باز کنید، وارد WSL شوید، سپس راه‌اندازی مجدد کنید:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر هرگز سرویس را نصب نکرده‌اید، آن را در پیش‌زمینه شروع کنید:

    ```bash
    openclaw gateway run
    ```

    **۳) CLI/Gateway بومی Windows:** Gateway مستقیما در Windows اجرا می‌شود.

    PowerShell را باز کنید و اجرا کنید:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر آن را دستی اجرا می‌کنید (بدون سرویس)، از این استفاده کنید:

    ```powershell
    openclaw gateway run
    ```

    مستندات: [Windows](/fa/platforms/windows)، [راهنمای عملیاتی سرویس Gateway](/fa/gateway).

  </Accordion>

  <Accordion title="Gateway فعال است اما پاسخ‌ها هرگز نمی‌رسند. چه چیزی را بررسی کنم؟">
    با یک بررسی سلامت سریع شروع کنید:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    علت‌های رایج:

    - احراز هویت مدل روی **میزبان Gateway** بارگذاری نشده است (`models status` را بررسی کنید).
    - جفت‌سازی کانال/فهرست مجاز مانع پاسخ‌ها می‌شود (پیکربندی کانال + گزارش‌ها را بررسی کنید).
    - WebChat/Dashboard بدون توکن درست باز است.

    اگر راه دور هستید، تأیید کنید اتصال تونل/Tailscale برقرار است و
    WebSocket مربوط به Gateway در دسترس است.

    مستندات: [کانال‌ها](/fa/channels)، [عیب‌یابی](/fa/gateway/troubleshooting)، [دسترسی راه دور](/fa/gateway/remote).

  </Accordion>

  <Accordion title='"اتصال از Gateway قطع شد: بدون دلیل" - حالا چه کنم؟'>
    این معمولا یعنی UI اتصال WebSocket را از دست داده است. بررسی کنید:

    1. آیا Gateway در حال اجراست؟ `openclaw gateway status`
    2. آیا Gateway سالم است؟ `openclaw status`
    3. آیا UI توکن درست را دارد؟ `openclaw dashboard`
    4. اگر راه دور است، آیا پیوند تونل/Tailscale برقرار است؟

    سپس گزارش‌ها را دنبال کنید:

    ```bash
    openclaw logs --follow
    ```

    مستندات: [Dashboard](/fa/web/dashboard)، [دسترسی راه دور](/fa/gateway/remote)، [عیب‌یابی](/fa/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands شکست می‌خورد. چه چیزی را بررسی کنم؟">
    با گزارش‌ها و وضعیت کانال شروع کنید:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    سپس خطا را تطبیق دهید:

    - `BOT_COMMANDS_TOO_MUCH`: منوی Telegram ورودی‌های بیش از حدی دارد. OpenClaw از قبل تا سقف Telegram کوتاه می‌کند و با فرمان‌های کمتر دوباره تلاش می‌کند، اما هنوز باید برخی ورودی‌های منو حذف شوند. فرمان‌های plugin/skill/سفارشی را کاهش دهید، یا اگر به منو نیاز ندارید `channels.telegram.commands.native` را غیرفعال کنید.
    - `TypeError: fetch failed`، `Network request for 'setMyCommands' failed!`، یا خطاهای شبکه مشابه: اگر روی VPS هستید یا پشت پروکسی قرار دارید، تأیید کنید HTTPS خروجی مجاز است و DNS برای `api.telegram.org` کار می‌کند.

    اگر Gateway راه دور است، مطمئن شوید گزارش‌ها را روی میزبان Gateway می‌بینید.

    مستندات: [Telegram](/fa/channels/telegram)، [عیب‌یابی کانال](/fa/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI هیچ خروجی نشان نمی‌دهد. چه چیزی را بررسی کنم؟">
    ابتدا تأیید کنید Gateway در دسترس است و عامل می‌تواند اجرا شود:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    در TUI، از `/status` برای دیدن وضعیت فعلی استفاده کنید. اگر انتظار پاسخ در یک کانال گفت‌وگو
    دارید، مطمئن شوید تحویل فعال است (`/deliver on`).

    مستندات: [TUI](/fa/web/tui)، [فرمان‌های اسلش](/fa/tools/slash-commands).

  </Accordion>

  <Accordion title="چگونه Gateway را کاملا متوقف و سپس شروع کنم؟">
    اگر سرویس را نصب کرده‌اید:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    این کار **سرویس تحت نظارت** را متوقف/شروع می‌کند (launchd در macOS، systemd در Linux).
    وقتی Gateway در پس‌زمینه به عنوان daemon اجرا می‌شود از این استفاده کنید.

    اگر در پیش‌زمینه اجرا می‌کنید، با Ctrl-C متوقف کنید، سپس:

    ```bash
    openclaw gateway run
    ```

    مستندات: [راهنمای عملیاتی سرویس Gateway](/fa/gateway).

  </Accordion>

  <Accordion title="توضیح ساده: openclaw gateway restart در برابر openclaw gateway">
    - `openclaw gateway restart`: **سرویس پس‌زمینه** را راه‌اندازی مجدد می‌کند (launchd/systemd).
    - `openclaw gateway`: Gateway را برای این نشست ترمینال **در پیش‌زمینه** اجرا می‌کند.

    اگر سرویس را نصب کرده‌اید، از فرمان‌های Gateway استفاده کنید. زمانی از `openclaw gateway` استفاده کنید که
    یک اجرای موردی و پیش‌زمینه می‌خواهید.

  </Accordion>

  <Accordion title="سریع‌ترین راه برای گرفتن جزئیات بیشتر وقتی چیزی شکست می‌خورد">
    Gateway را با `--verbose` شروع کنید تا جزئیات بیشتری در کنسول بگیرید. سپس فایل گزارش را برای احراز هویت کانال، مسیریابی مدل، و خطاهای RPC بررسی کنید.
  </Accordion>
</AccordionGroup>

## رسانه و پیوست‌ها

<AccordionGroup>
  <Accordion title="Skill من یک تصویر/PDF تولید کرد، اما چیزی ارسال نشد">
    پیوست‌های خروجی از عامل باید از فیلدهای رسانه ساختاریافته مانند `media`، `mediaUrl`، `path`، یا `filePath` استفاده کنند. [راه‌اندازی دستیار OpenClaw](/fa/start/openclaw) و [ارسال عامل](/fa/tools/agent-send) را ببینید.

    ارسال با CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    همچنین بررسی کنید:

    - کانال هدف از رسانه خروجی پشتیبانی می‌کند و توسط فهرست‌های مجاز مسدود نشده است.
    - فایل در محدوده اندازه ارائه‌دهنده است (تصاویر به حداکثر 2048px تغییر اندازه داده می‌شوند).
    - `tools.fs.workspaceOnly=true` ارسال‌های مسیر محلی را به فضای کاری، temp/media-store، و فایل‌های اعتبارسنجی‌شده در sandbox محدود نگه می‌دارد.
    - `tools.fs.workspaceOnly=false` به ارسال‌های رسانه محلی ساختاریافته اجازه می‌دهد از فایل‌های محلی میزبان که عامل از قبل می‌تواند بخواند استفاده کنند، اما فقط برای رسانه به‌علاوه نوع‌های سند امن (تصاویر، صدا، ویدیو، PDF، اسناد Office، و اسناد متنی اعتبارسنجی‌شده مانند Markdown/MD، TXT، JSON، YAML، و YML). این یک اسکنر راز نیست: یک `secret.txt` یا `config.json` قابل‌خواندن توسط عامل وقتی افزونه و اعتبارسنجی محتوا مطابقت داشته باشند می‌تواند پیوست شود. فایل‌های حساس را خارج از مسیرهای قابل‌خواندن توسط عامل نگه دارید، یا برای ارسال‌های مسیر محلی سخت‌گیرانه‌تر `tools.fs.workspaceOnly=true` را نگه دارید.

    [تصاویر](/fa/nodes/images) را ببینید.

  </Accordion>
</AccordionGroup>

## امنیت و کنترل دسترسی

<AccordionGroup>
  <Accordion title="آیا در معرض قرار دادن OpenClaw برای پیام‌های مستقیم ورودی امن است؟">
    پیام‌های مستقیم ورودی را ورودی نامطمئن در نظر بگیرید. پیش‌فرض‌ها برای کاهش ریسک طراحی شده‌اند:

    - رفتار پیش‌فرض در کانال‌های دارای قابلیت DM **جفت‌سازی** است:
      - فرستندگان ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ ربات پیام آن‌ها را پردازش نمی‌کند.
      - تأیید با: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - درخواست‌های در انتظار به **۳ مورد در هر کانال** محدود می‌شوند؛ اگر کدی نرسید `openclaw pairing list --channel <channel> [--account <id>]` را بررسی کنید.
    - باز کردن عمومی پیام‌های مستقیم به موافقت صریح نیاز دارد (`dmPolicy: "open"` و فهرست مجاز `"*"`).

    برای نمایان کردن سیاست‌های DM پرریسک، `openclaw doctor` را اجرا کنید.

  </Accordion>

  <Accordion title="آیا تزریق prompt فقط برای ربات‌های عمومی یک نگرانی است؟">
    خیر. تزریق prompt درباره **محتوای نامطمئن** است، نه فقط اینکه چه کسی می‌تواند به ربات DM بدهد.
    اگر دستیار شما محتوای خارجی را می‌خواند (جست‌وجو/واکشی وب، صفحه‌های مرورگر، ایمیل‌ها،
    مستندات، پیوست‌ها، گزارش‌های چسبانده‌شده)، آن محتوا می‌تواند شامل دستورهایی باشد که تلاش می‌کنند
    مدل را منحرف کنند. این حتی وقتی **شما تنها فرستنده هستید** هم می‌تواند رخ دهد.

    بزرگ‌ترین ریسک وقتی است که ابزارها فعال هستند: مدل می‌تواند فریب بخورد تا
    زمینه را بیرون بکشد یا به نمایندگی از شما ابزارها را فراخوانی کند. شعاع اثر را با این کارها کاهش دهید:

    - استفاده از یک عامل «خواننده» فقط‌خواندنی یا بدون ابزار برای خلاصه‌سازی محتوای نامطمئن
    - خاموش نگه داشتن `web_search` / `web_fetch` / `browser` برای عامل‌های دارای ابزار
    - نامطمئن دانستن متن رمزگشایی‌شده فایل/سند نیز: OpenResponses
      `input_file` و استخراج پیوست رسانه هر دو متن استخراج‌شده را به جای ارسال متن خام فایل
      در نشانگرهای مرزی صریح محتوای خارجی می‌پیچند
    - sandbox کردن و فهرست‌های مجاز سخت‌گیرانه برای ابزارها

    جزئیات: [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="آیا OpenClaw چون به جای Rust/WASM از TypeScript/Node استفاده می‌کند کم‌امن‌تر است؟">
    زبان و runtime مهم هستند، اما ریسک اصلی برای یک عامل شخصی نیستند.
    ریسک‌های عملی OpenClaw عبارت‌اند از در معرض بودن Gateway، اینکه چه کسی می‌تواند به
    ربات پیام بدهد، تزریق prompt، دامنه ابزار، مدیریت اعتبارنامه، دسترسی مرورگر، دسترسی exec،
    و اعتماد به skill یا plugin شخص ثالث.

    Rust و WASM می‌توانند برای برخی دسته‌های کد جداسازی قوی‌تری فراهم کنند، اما
    تزریق prompt، فهرست‌های مجاز بد، در معرض بودن Gateway عمومی،
    ابزارهای بیش از حد گسترده، یا پروفایل مرورگری را که از قبل به حساب‌های حساس
    وارد شده است حل نمی‌کنند. این‌ها را کنترل‌های اصلی در نظر بگیرید:

    - Gateway را خصوصی یا احراز هویت‌شده نگه دارید
    - برای پیام‌های مستقیم و گروه‌ها از جفت‌سازی و فهرست‌های مجاز استفاده کنید
    - ابزارهای پرریسک را برای ورودی‌های نامطمئن رد یا sandbox کنید
    - فقط plugins و skills مورد اعتماد را نصب کنید
    - پس از تغییرات پیکربندی، `openclaw security audit --deep` را اجرا کنید

    جزئیات: [امنیت](/fa/gateway/security)، [Sandboxing](/fa/gateway/sandboxing).

  </Accordion>

  <Accordion title="گزارش‌هایی درباره نمونه‌های OpenClaw در معرض دید دیدم. چه چیزی را بررسی کنم؟">
    ابتدا استقرار واقعی خود را بررسی کنید:

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    یک خط پایه امن‌تر این است:

    - Gateway متصل به `loopback`، یا فقط از طریق دسترسی خصوصی احراز هویت‌شده
      مانند tailnet، تونل SSH، احراز هویت با توکن/گذرواژه، یا پروکسی مورد اعتماد
      درست پیکربندی‌شده در معرض قرار گرفته باشد
    - پیام‌های مستقیم در حالت `pairing` یا `allowlist`
    - گروه‌ها در فهرست مجاز باشند و مگر اینکه هر عضو مورد اعتماد باشد، به ذکر نام محدود شده باشند
    - ابزارهای پرریسک (`exec`، `browser`، `gateway`، `cron`) برای عامل‌هایی که محتوای نامطمئن می‌خوانند رد شده یا به‌شدت
      محدود شده باشند
    - هر جا اجرای ابزار به شعاع اثر کوچک‌تری نیاز دارد، sandboxing فعال باشد

    اتصال‌های عمومی بدون احراز هویت، پیام‌های مستقیم/گروه‌های باز با ابزارها، و کنترل مرورگر
    در معرض دید، یافته‌هایی هستند که باید ابتدا اصلاح شوند. جزئیات:
    [چک‌لیست ممیزی امنیت](/fa/gateway/security#security-audit-checklist).

  </Accordion>

  <Accordion title="آیا Skills در ClawHub و plugins شخص ثالث برای نصب امن هستند؟">
    skills و plugins شخص ثالث را کدی در نظر بگیرید که انتخاب می‌کنید به آن اعتماد کنید.
    صفحه‌های skill در ClawHub وضعیت اسکن را پیش از نصب نشان می‌دهند، اما اسکن‌ها
    یک مرز امنیتی کامل نیستند. OpenClaw در جریان‌های نصب/به‌روزرسانی plugin یا skill
    مسدودسازی داخلی محلی برای کد خطرناک را اجرا نمی‌کند؛ برای تصمیم‌های محلی اجازه/مسدودسازی
    از `security.installPolicy` تحت مالکیت اپراتور استفاده کنید.

    الگوی امن‌تر:

    - نویسندگان مورد اعتماد و نسخه‌های pin شده را ترجیح دهید
    - پیش از فعال‌سازی، skill یا plugin را بخوانید
    - فهرست‌های مجاز plugin و skill را محدود نگه دارید
    - جریان‌های کاری ورودی نامطمئن را در یک sandbox با حداقل ابزارها اجرا کنید
    - از دادن دسترسی گسترده به فایل‌سیستم، exec، مرورگر، یا رازها به کد شخص ثالث خودداری کنید

    جزئیات: [Skills](/fa/tools/skills), [Pluginها](/fa/tools/plugin),
    [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="آیا ربات من باید ایمیل، حساب GitHub، یا شماره تلفن خودش را داشته باشد؟">
    بله، برای بیشتر راه‌اندازی‌ها. جدا کردن ربات با حساب‌ها و شماره‌های تلفن جداگانه
    دامنه آسیب را در صورت بروز مشکل کاهش می‌دهد. این کار همچنین چرخاندن
    اعتبارنامه‌ها یا لغو دسترسی را بدون تأثیر بر حساب‌های شخصی شما آسان‌تر می‌کند.

    از کوچک شروع کنید. فقط به ابزارها و حساب‌هایی دسترسی بدهید که واقعاً نیاز دارید، و
    بعداً در صورت نیاز گسترش دهید.

    مستندات: [امنیت](/fa/gateway/security), [جفت‌سازی](/fa/channels/pairing).

  </Accordion>

  <Accordion title="آیا می‌توانم به آن روی پیام‌های متنی‌ام خودمختاری بدهم و آیا این امن است؟">
    ما خودمختاری کامل روی پیام‌های شخصی شما را توصیه **نمی‌کنیم**. امن‌ترین الگو این است:

    - پیام‌های خصوصی را در **حالت جفت‌سازی** یا یک فهرست مجاز محدود نگه دارید.
    - اگر می‌خواهید از طرف شما پیام بدهد، از یک **شماره یا حساب جداگانه** استفاده کنید.
    - بگذارید پیش‌نویس کند، سپس **پیش از ارسال تأیید کنید**.

    اگر می‌خواهید آزمایش کنید، این کار را روی یک حساب اختصاصی انجام دهید و آن را جدا نگه دارید. ببینید
    [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="آیا می‌توانم برای کارهای دستیار شخصی از مدل‌های ارزان‌تر استفاده کنم؟">
    بله، **اگر** عامل فقط برای چت باشد و ورودی قابل اعتماد باشد. رده‌های کوچک‌تر
    در برابر ربایش دستورالعمل آسیب‌پذیرترند، پس برای عامل‌های دارای ابزار
    یا هنگام خواندن محتوای غیرقابل اعتماد از آن‌ها اجتناب کنید. اگر مجبورید از مدل کوچک‌تر استفاده کنید،
    ابزارها را قفل کنید و داخل یک sandbox اجرا کنید. ببینید [امنیت](/fa/gateway/security).
  </Accordion>

  <Accordion title="در Telegram دستور /start را اجرا کردم اما کد جفت‌سازی نگرفتم">
    کدهای جفت‌سازی **فقط** زمانی فرستاده می‌شوند که یک فرستنده ناشناس به ربات پیام بدهد و
    `dmPolicy: "pairing"` فعال باشد. `/start` به‌تنهایی کدی تولید نمی‌کند.

    درخواست‌های معلق را بررسی کنید:

    ```bash
    openclaw pairing list telegram
    ```

    اگر دسترسی فوری می‌خواهید، شناسه فرستنده خود را در فهرست مجاز قرار دهید یا برای آن حساب
    `dmPolicy: "open"` را تنظیم کنید.

  </Accordion>

  <Accordion title="WhatsApp: آیا به مخاطبان من پیام می‌دهد؟ جفت‌سازی چگونه کار می‌کند؟">
    نه. سیاست پیش‌فرض پیام خصوصی WhatsApp **جفت‌سازی** است. فرستندگان ناشناس فقط یک کد جفت‌سازی می‌گیرند و پیام آن‌ها **پردازش نمی‌شود**. OpenClaw فقط به چت‌هایی پاسخ می‌دهد که دریافت می‌کند یا به ارسال‌های صریحی که شما آغاز می‌کنید.

    جفت‌سازی را با این دستور تأیید کنید:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    درخواست‌های معلق را فهرست کنید:

    ```bash
    openclaw pairing list whatsapp
    ```

    اعلان شماره تلفن در wizard: از آن برای تنظیم **فهرست مجاز/مالک** شما استفاده می‌شود تا پیام‌های خصوصی خودتان مجاز باشند. برای ارسال خودکار استفاده نمی‌شود. اگر روی شماره شخصی WhatsApp خود اجرا می‌کنید، از همان شماره استفاده کنید و `channels.whatsapp.selfChatMode` را فعال کنید.

  </Accordion>
</AccordionGroup>

## فرمان‌های چت، لغو کارها، و «متوقف نمی‌شود»

<AccordionGroup>
  <Accordion title="چگونه جلوی نمایش پیام‌های داخلی سیستم در چت را بگیرم؟">
    بیشتر پیام‌های داخلی یا ابزار فقط زمانی ظاهر می‌شوند که **verbose**، **trace**، یا **reasoning** برای آن نشست فعال باشد.

    در همان چتی که آن را می‌بینید رفع کنید:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    اگر هنوز پر سر و صداست، تنظیمات نشست را در رابط کاربری کنترل بررسی کنید و verbose
    را روی **ارث‌بری** بگذارید. همچنین مطمئن شوید از پروفایل رباتی استفاده نمی‌کنید که در پیکربندی
    `verboseDefault` روی `on` تنظیم شده باشد.

    مستندات: [تفکر و verbose](/fa/tools/thinking), [امنیت](/fa/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="چگونه یک کار در حال اجرا را متوقف/لغو کنم؟">
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

    بیشتر فرمان‌ها باید به‌صورت پیام **مستقل** که با `/` شروع می‌شود فرستاده شوند، اما چند میان‌بر (مثل `/status`) برای فرستندگان حاضر در فهرست مجاز به‌صورت درون‌خطی هم کار می‌کنند.

  </Accordion>

  <Accordion title='چگونه از Telegram پیام Discord بفرستم؟ ("Cross-context messaging denied")'>
    OpenClaw به‌طور پیش‌فرض پیام‌رسانی **میان ارائه‌دهنده‌ها** را مسدود می‌کند. اگر یک فراخوانی ابزار
    به Telegram متصل باشد، به Discord ارسال نمی‌کند مگر این‌که صریحاً اجازه دهید.

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

    پس از ویرایش پیکربندی، Gateway را راه‌اندازی مجدد کنید.

  </Accordion>

  <Accordion title='چرا به نظر می‌رسد ربات پیام‌های سریع و پشت‌سرهم را "نادیده می‌گیرد"؟'>
    اعلان‌های میانه اجرا به‌طور پیش‌فرض به اجرای فعال هدایت می‌شوند. از `/queue` برای انتخاب رفتار اجرای فعال استفاده کنید:

    - `steer` - اجرای فعال را در مرز مدل بعدی هدایت می‌کند
    - `followup` - پیام‌ها را در صف می‌گذارد و پس از پایان اجرای فعلی، آن‌ها را یکی‌یکی اجرا می‌کند
    - `collect` - پیام‌های سازگار را در صف می‌گذارد و پس از پایان اجرای فعلی یک‌بار پاسخ می‌دهد
    - `interrupt` - اجرای فعلی را لغو می‌کند و از نو شروع می‌کند

    حالت پیش‌فرض `steer` است. برای حالت‌های صف‌شده می‌توانید گزینه‌هایی مثل `debounce:0.5s cap:25 drop:summarize` اضافه کنید. [صف فرمان](/fa/concepts/queue) و [صف هدایت](/fa/concepts/queue-steering) را ببینید.

  </Accordion>
</AccordionGroup>

## متفرقه

<AccordionGroup>
  <Accordion title='مدل پیش‌فرض برای Anthropic با کلید API چیست؟'>
    در OpenClaw، اعتبارنامه‌ها و انتخاب مدل جدا هستند. تنظیم `ANTHROPIC_API_KEY` (یا ذخیره کردن یک کلید API مربوط به Anthropic در پروفایل‌های احراز هویت) احراز هویت را فعال می‌کند، اما مدل پیش‌فرض واقعی همان چیزی است که در `agents.defaults.model.primary` پیکربندی می‌کنید (برای مثال، `anthropic/claude-sonnet-4-6` یا `anthropic/claude-opus-4-6`). اگر `No credentials found for profile "anthropic:default"` را می‌بینید، یعنی Gateway نتوانسته اعتبارنامه‌های Anthropic را در `auth-profiles.json` مورد انتظار برای عاملی که در حال اجراست پیدا کند.
  </Accordion>
</AccordionGroup>

---

هنوز گیر کرده‌اید؟ در [Discord](https://discord.com/invite/clawd) بپرسید یا یک [بحث GitHub](https://github.com/openclaw/openclaw/discussions) باز کنید.

## مرتبط

- [پرسش‌های متداول اجرای اول](/fa/help/faq-first-run) — نصب، راه‌اندازی اولیه، احراز هویت، اشتراک‌ها، خطاهای اولیه
- [پرسش‌های متداول مدل‌ها](/fa/help/faq-models) — انتخاب مدل، failover، پروفایل‌های احراز هویت
- [عیب‌یابی](/fa/help/troubleshooting) — تریاژ بر اساس نشانه‌ها
