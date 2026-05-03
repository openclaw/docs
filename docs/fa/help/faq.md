---
read_when:
    - پاسخ به پرسش‌های رایج دربارهٔ راه‌اندازی، نصب، آغازبه‌کار، یا پشتیبانی زمان اجرا
    - ارزیابی و اولویت‌بندی مشکلات گزارش‌شده توسط کاربران پیش از اشکال‌زدایی عمیق‌تر
summary: پرسش‌های متداول درباره راه‌اندازی، پیکربندی و استفاده از OpenClaw
title: پرسش‌های متداول
x-i18n:
    generated_at: "2026-05-03T21:36:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 372220d62f872db1427b2836662bc8cc74e07d2cdfb651c105d3df25131855dd
    source_path: help/faq.md
    workflow: 16
---

Quick answers plus deeper troubleshooting for real-world setups (local dev, VPS, multi-agent, OAuth/API keys, model failover). For runtime diagnostics, see [Troubleshooting](/fa/gateway/troubleshooting). For the full config reference, see [Configuration](/fa/gateway/configuration).

## First 60 seconds if something is broken

1. **Quick status (first check)**

   ```bash
   openclaw status
   ```

   Fast local summary: OS + update, gateway/service reachability, agents/sessions, provider config + runtime issues (when gateway is reachable).

2. **Pasteable report (safe to share)**

   ```bash
   openclaw status --all
   ```

   Read-only diagnosis with log tail (tokens redacted).

3. **Daemon + port state**

   ```bash
   openclaw gateway status
   ```

   Shows supervisor runtime vs RPC reachability, the probe target URL, and which config the service likely used.

4. **Deep probes**

   ```bash
   openclaw status --deep
   ```

   Runs a live gateway health probe, including channel probes when supported
   (requires a reachable gateway). See [Health](/fa/gateway/health).

5. **Tail the latest log**

   ```bash
   openclaw logs --follow
   ```

   If RPC is down, fall back to:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   File logs are separate from service logs; see [Logging](/fa/logging) and [Troubleshooting](/fa/gateway/troubleshooting).

6. **Run the doctor (repairs)**

   ```bash
   openclaw doctor
   ```

   Repairs/migrates config/state + runs health checks. See [Doctor](/fa/gateway/doctor).

7. **Gateway snapshot**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Asks the running gateway for a full snapshot (WS-only). See [Health](/fa/gateway/health).

## Quick start and first-run setup

First-run Q&A — install, onboard, auth routes, subscriptions, initial failures —
lives on the [First-run FAQ](/fa/help/faq-first-run).

## What is OpenClaw?

<AccordionGroup>
  <Accordion title="What is OpenClaw, in one paragraph?">
    OpenClaw is a personal AI assistant you run on your own devices. It replies on the messaging surfaces you already use (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, and bundled channel plugins such as QQ Bot) and can also do voice + a live Canvas on supported platforms. The **Gateway** is the always-on control plane; the assistant is the product.
  </Accordion>

  <Accordion title="Value proposition">
    OpenClaw is not "just a Claude wrapper." It's a **local-first control plane** that lets you run a
    capable assistant on **your own hardware**, reachable from the chat apps you already use, with
    stateful sessions, memory, and tools - without handing control of your workflows to a hosted
    SaaS.

    Highlights:

    - **Your devices, your data:** run the Gateway wherever you want (Mac, Linux, VPS) and keep the
      workspace + session history local.
    - **Real channels, not a web sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      plus mobile voice and Canvas on supported platforms.
    - **Model-agnostic:** use Anthropic, OpenAI, MiniMax, OpenRouter, etc., with per-agent routing
      and failover.
    - **Local-only option:** run local models so **all data can stay on your device** if you want.
    - **Multi-agent routing:** separate agents per channel, account, or task, each with its own
      workspace and defaults.
    - **Open source and hackable:** inspect, extend, and self-host without vendor lock-in.

    Docs: [Gateway](/fa/gateway), [Channels](/fa/channels), [Multi-agent](/fa/concepts/multi-agent),
    [Memory](/fa/concepts/memory).

  </Accordion>

  <Accordion title="I just set it up - what should I do first?">
    Good first projects:

    - Build a website (WordPress, Shopify, or a simple static site).
    - Prototype a mobile app (outline, screens, API plan).
    - Organize files and folders (cleanup, naming, tagging).
    - Connect Gmail and automate summaries or follow ups.

    It can handle large tasks, but it works best when you split them into phases and
    use sub agents for parallel work.

  </Accordion>

  <Accordion title="What are the top five everyday use cases for OpenClaw?">
    Everyday wins usually look like:

    - **Personal briefings:** summaries of inbox, calendar, and news you care about.
    - **Research and drafting:** quick research, summaries, and first drafts for emails or docs.
    - **Reminders and follow ups:** cron or heartbeat driven nudges and checklists.
    - **Browser automation:** filling forms, collecting data, and repeating web tasks.
    - **Cross device coordination:** send a task from your phone, let the Gateway run it on a server, and get the result back in chat.

  </Accordion>

  <Accordion title="Can OpenClaw help with lead gen, outreach, ads, and blogs for a SaaS?">
    Yes for **research, qualification, and drafting**. It can scan sites, build shortlists,
    summarize prospects, and write outreach or ad copy drafts.

    For **outreach or ad runs**, keep a human in the loop. Avoid spam, follow local laws and
    platform policies, and review anything before it is sent. The safest pattern is to let
    OpenClaw draft and you approve.

    Docs: [Security](/fa/gateway/security).

  </Accordion>

  <Accordion title="What are the advantages vs Claude Code for web development?">
    OpenClaw is a **personal assistant** and coordination layer, not an IDE replacement. Use
    Claude Code or Codex for the fastest direct coding loop inside a repo. Use OpenClaw when you
    want durable memory, cross-device access, and tool orchestration.

    Advantages:

    - **Persistent memory + workspace** across sessions
    - **Multi-platform access** (WhatsApp, Telegram, TUI, WebChat)
    - **Tool orchestration** (browser, files, scheduling, hooks)
    - **Always-on Gateway** (run on a VPS, interact from anywhere)
    - **Nodes** for local browser/screen/camera/exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills and automation

<AccordionGroup>
  <Accordion title="How do I customize skills without keeping the repo dirty?">
    Use managed overrides instead of editing the repo copy. Put your changes in `~/.openclaw/skills/<name>/SKILL.md` (or add a folder via `skills.load.extraDirs` in `~/.openclaw/openclaw.json`). Precedence is `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, so managed overrides still win over bundled skills without touching git. If you need the skill installed globally but only visible to some agents, keep the shared copy in `~/.openclaw/skills` and control visibility with `agents.defaults.skills` and `agents.list[].skills`. Only upstream-worthy edits should live in the repo and go out as PRs.
  </Accordion>

  <Accordion title="Can I load skills from a custom folder?">
    Yes. Add extra directories via `skills.load.extraDirs` in `~/.openclaw/openclaw.json` (lowest precedence). Default precedence is `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` installs into `./skills` by default, which OpenClaw treats as `<workspace>/skills` on the next session. If the skill should only be visible to certain agents, pair that with `agents.defaults.skills` or `agents.list[].skills`.
  </Accordion>

  <Accordion title="How can I use different models for different tasks?">
    Today the supported patterns are:

    - **Cron jobs**: isolated jobs can set a `model` override per job.
    - **Sub-agents**: route tasks to separate agents with different default models.
    - **On-demand switch**: use `/model` to switch the current session model at any time.

    See [Cron jobs](/fa/automation/cron-jobs), [Multi-Agent Routing](/fa/concepts/multi-agent), and [Slash commands](/fa/tools/slash-commands).

  </Accordion>

  <Accordion title="The bot freezes while doing heavy work. How do I offload that?">
    Use **sub-agents** for long or parallel tasks. Sub-agents run in their own session,
    return a summary, and keep your main chat responsive.

    Ask your bot to "spawn a sub-agent for this task" or use `/subagents`.
    Use `/status` in chat to see what the Gateway is doing right now (and whether it is busy).

    Token tip: long tasks and sub-agents both consume tokens. If cost is a concern, set a
    cheaper model for sub-agents via `agents.defaults.subagents.model`.

    Docs: [Sub-agents](/fa/tools/subagents), [Background Tasks](/fa/automation/tasks).

  </Accordion>

  <Accordion title="How do thread-bound subagent sessions work on Discord?">
    Use thread bindings. You can bind a Discord thread to a subagent or session target so follow-up messages in that thread stay on that bound session.

    Basic flow:

    - Spawn with `sessions_spawn` using `thread: true` (and optionally `mode: "session"` for persistent follow-up).
    - Or manually bind with `/focus <target>`.
    - Use `/agents` to inspect binding state.
    - Use `/session idle <duration|off>` and `/session max-age <duration|off>` to control auto-unfocus.
    - Use `/unfocus` to detach the thread.

    Required config:

    - Global defaults: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord overrides: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Auto-bind on spawn: `channels.discord.threadBindings.spawnSessions` defaults to `true`; set it to `false` to disable thread-bound session spawns.

    Docs: [Sub-agents](/fa/tools/subagents), [Discord](/fa/channels/discord), [Configuration Reference](/fa/gateway/configuration-reference), [Slash commands](/fa/tools/slash-commands).

  </Accordion>

  <Accordion title="A subagent finished, but the completion update went to the wrong place or never posted. What should I check?">
    Check the resolved requester route first:

    - Completion-mode subagent delivery prefers any bound thread or conversation route when one exists.
    - If the completion origin only carries a channel, OpenClaw falls back to the requester session's stored route (`lastChannel` / `lastTo` / `lastAccountId`) so direct delivery can still succeed.
    - If neither a bound route nor a usable stored route exists, direct delivery can fail and the result falls back to queued session delivery instead of posting immediately to chat.
    - Invalid or stale targets can still force queue fallback or final delivery failure.
    - If the child's last visible assistant reply is the exact silent token `NO_REPLY` / `no_reply`, or exactly `ANNOUNCE_SKIP`, OpenClaw intentionally suppresses the announce instead of posting stale earlier progress.
    - If the child timed out after only tool calls, the announce can collapse that into a short partial-progress summary instead of replaying raw tool output.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Sub-agents](/fa/tools/subagents), [Background Tasks](/fa/automation/tasks), [Session Tools](/fa/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron or reminders do not fire. What should I check?">
    Cron runs inside the Gateway process. If the Gateway is not running continuously,
    scheduled jobs will not run.

    Checklist:

    - Confirm cron is enabled (`cron.enabled`) and `OPENCLAW_SKIP_CRON` is not set.
    - Check the Gateway is running 24/7 (no sleep/restarts).
    - Verify timezone settings for the job (`--tz` vs host timezone).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Docs: [Cron jobs](/fa/automation/cron-jobs), [Automation & Tasks](/fa/automation).

  </Accordion>

  <Accordion title="Cron اجرا شد، اما چیزی به کانال ارسال نشد. چرا؟">
    ابتدا حالت تحویل را بررسی کنید:

    - `--no-deliver` / `delivery.mode: "none"` یعنی ارسال جایگزین توسط اجراکننده انتظار نمی‌رود.
    - هدف اعلامیِ ناموجود یا نامعتبر (`channel` / `to`) یعنی اجراکننده تحویل خروجی را رد کرده است.
    - خطاهای احراز هویت کانال (`unauthorized`, `Forbidden`) یعنی اجراکننده تلاش کرده تحویل دهد، اما اعتبارنامه‌ها مانع شده‌اند.
    - نتیجهٔ ایزولهٔ خاموش (فقط `NO_REPLY` / `no_reply`) عمداً غیرقابل‌تحویل تلقی می‌شود، بنابراین اجراکننده تحویل جایگزینِ صف‌شده را هم سرکوب می‌کند.

    برای کارهای Cron ایزوله، وقتی مسیر چت در دسترس باشد، عامل همچنان می‌تواند با ابزار `message`
    مستقیماً ارسال کند. `--announce` فقط مسیر جایگزین اجراکننده را برای متن نهایی‌ای کنترل می‌کند
    که عامل قبلاً ارسال نکرده است.

    اشکال‌زدایی:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [کارهای پس‌زمینه](/fa/automation/tasks).

  </Accordion>

  <Accordion title="چرا یک اجرای Cron ایزوله مدل را عوض کرد یا یک‌بار دوباره تلاش کرد؟">
    این معمولاً مسیر تعویض مدل زنده است، نه زمان‌بندی تکراری.

    Cron ایزوله می‌تواند یک واگذاری مدل زمان اجرا را پایدار کند و وقتی اجرای فعال
    `LiveSessionModelSwitchError` پرتاب می‌کند، دوباره تلاش کند. تلاش مجدد همان
    ارائه‌دهنده/مدلِ تعویض‌شده را نگه می‌دارد، و اگر تعویض، بازنویسی پروفایل احراز هویت تازه‌ای
    همراه داشته باشد، Cron آن را هم پیش از تلاش مجدد پایدار می‌کند.

    قواعد انتخاب مرتبط:

    - بازنویسی مدل هوک Gmail، وقتی قابل اعمال باشد، اولویت اول را دارد.
    - سپس `model` هر کار.
    - سپس هر بازنویسی مدل ذخیره‌شده برای نشست Cron.
    - سپس انتخاب عادی مدل عامل/پیش‌فرض.

    حلقهٔ تلاش مجدد محدود است. پس از تلاش اولیه به‌علاوهٔ ۲ تلاش مجدد برای تعویض،
    Cron به‌جای حلقهٔ بی‌پایان متوقف می‌شود.

    اشکال‌زدایی:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [CLI کرون](/fa/cli/cron).

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

    فرمان بومی `openclaw skills install` در پوشهٔ `skills/`
    فضای کاری فعال می‌نویسد. CLI جداگانهٔ `clawhub` را فقط وقتی نصب کنید که می‌خواهید Skills خودتان را منتشر یا
    همگام‌سازی کنید. برای نصب‌های مشترک بین عامل‌ها، Skill را زیر
    `~/.openclaw/skills` قرار دهید و اگر می‌خواهید مشخص کنید کدام عامل‌ها آن را ببینند، از
    `agents.defaults.skills` یا
    `agents.list[].skills` استفاده کنید.

  </Accordion>

  <Accordion title="آیا OpenClaw می‌تواند کارها را طبق زمان‌بندی یا به‌صورت پیوسته در پس‌زمینه اجرا کند؟">
    بله. از زمان‌بند Gateway استفاده کنید:

    - **کارهای Cron** برای کارهای زمان‌بندی‌شده یا تکرارشونده (پس از راه‌اندازی مجدد پایدار می‌مانند).
    - **Heartbeat** برای بررسی‌های دوره‌ای «نشست اصلی».
    - **کارهای ایزوله** برای عامل‌های خودکاری که خلاصه‌ها را پست می‌کنند یا به چت‌ها تحویل می‌دهند.

    مستندات: [کارهای Cron](/fa/automation/cron-jobs)، [خودکارسازی و کارها](/fa/automation)،
    [Heartbeat](/fa/gateway/heartbeat).

  </Accordion>

  <Accordion title="آیا می‌توانم Skills مخصوص Apple macOS را از Linux اجرا کنم؟">
    نه مستقیماً. Skills مربوط به macOS با `metadata.openclaw.os` به‌علاوهٔ باینری‌های لازم محدود می‌شوند، و Skills فقط وقتی در اعلان سیستم ظاهر می‌شوند که روی **میزبان Gateway** واجد شرایط باشند. روی Linux، Skills فقط برای `darwin` (مانند `apple-notes`، `apple-reminders`، `things-mac`) بارگذاری نمی‌شوند مگر اینکه محدودسازی را بازنویسی کنید.

    سه الگوی پشتیبانی‌شده دارید:

    **گزینهٔ A - Gateway را روی Mac اجرا کنید (ساده‌ترین).**
    Gateway را جایی اجرا کنید که باینری‌های macOS وجود دارند، سپس از Linux در [حالت راه‌دور](#gateway-ports-already-running-and-remote-mode) یا از طریق Tailscale وصل شوید. Skills به‌طور عادی بارگذاری می‌شوند، چون میزبان Gateway، macOS است.

    **گزینهٔ B - از یک نود macOS استفاده کنید (بدون SSH).**
    Gateway را روی Linux اجرا کنید، یک نود macOS (برنامهٔ نوار منو) را جفت کنید، و **Node Run Commands** را روی Mac روی "Always Ask" یا "Always Allow" تنظیم کنید. وقتی باینری‌های لازم روی نود وجود داشته باشند، OpenClaw می‌تواند Skills مخصوص macOS را واجد شرایط بداند. عامل آن Skills را از طریق ابزار `nodes` اجرا می‌کند. اگر "Always Ask" را انتخاب کنید، تأیید "Always Allow" در اعلان، آن فرمان را به فهرست مجاز اضافه می‌کند.

    **گزینهٔ C - باینری‌های macOS را از طریق SSH پروکسی کنید (پیشرفته).**
    Gateway را روی Linux نگه دارید، اما باینری‌های CLI لازم را به wrapperهای SSH تبدیل کنید که روی Mac اجرا می‌شوند. سپس Skill را بازنویسی کنید تا Linux را مجاز کند و واجد شرایط بماند.

    1. برای باینری یک wrapper SSH بسازید (مثال: `memo` برای Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. wrapper را روی `PATH` میزبان Linux قرار دهید (برای مثال `~/bin/memo`).
    3. فرادادهٔ Skill را بازنویسی کنید (در فضای کاری یا `~/.openclaw/skills`) تا Linux را مجاز کند:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. یک نشست تازه شروع کنید تا snapshot مربوط به Skills تازه‌سازی شود.

  </Accordion>

  <Accordion title="آیا یکپارچه‌سازی Notion یا HeyGen دارید؟">
    امروز به‌صورت داخلی وجود ندارد.

    گزینه‌ها:

    - **Skill / Plugin سفارشی:** بهترین گزینه برای دسترسی مطمئن به API است (Notion و HeyGen هر دو API دارند).
    - **خودکارسازی مرورگر:** بدون کد کار می‌کند، اما کندتر و شکننده‌تر است.

    اگر می‌خواهید برای هر مشتری زمینه را جدا نگه دارید (گردش‌کارهای آژانسی)، یک الگوی ساده این است:

    - یک صفحهٔ Notion برای هر مشتری (زمینه + ترجیحات + کار فعال).
    - از عامل بخواهید در ابتدای نشست آن صفحه را واکشی کند.

    اگر یکپارچه‌سازی بومی می‌خواهید، درخواست ویژگی ثبت کنید یا Skillای
    بسازید که آن APIها را هدف بگیرد.

    نصب Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    نصب‌های بومی در پوشهٔ `skills/` فضای کاری فعال قرار می‌گیرند. برای Skills مشترک بین عامل‌ها، آن‌ها را در `~/.openclaw/skills/<name>/SKILL.md` قرار دهید. اگر فقط برخی عامل‌ها باید یک نصب مشترک را ببینند، `agents.defaults.skills` یا `agents.list[].skills` را پیکربندی کنید. بعضی Skills انتظار دارند باینری‌ها از طریق Homebrew نصب شده باشند؛ روی Linux یعنی Linuxbrew (ورودی پرسش‌های متداول Homebrew Linux را در بالا ببینید). [Skills](/fa/tools/skills)، [پیکربندی Skills](/fa/tools/skills-config)، و [ClawHub](/fa/tools/clawhub) را ببینید.

  </Accordion>

  <Accordion title="چگونه از Chrome واردشدهٔ فعلی خود با OpenClaw استفاده کنم؟">
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

    این مسیر می‌تواند از مرورگر میزبان local یا یک نود مرورگر متصل استفاده کند. اگر Gateway جای دیگری اجرا می‌شود، یا یک میزبان نود روی ماشین مرورگر اجرا کنید یا به‌جای آن از CDP راه‌دور استفاده کنید.

    محدودیت‌های فعلی در `existing-session` / `user`:

    - کنش‌ها مبتنی بر ref هستند، نه مبتنی بر انتخابگر CSS
    - بارگذاری‌ها به `ref` / `inputRef` نیاز دارند و فعلاً هر بار از یک فایل پشتیبانی می‌کنند
    - `responsebody`، خروجی PDF، رهگیری دانلود، و کنش‌های دسته‌ای هنوز به یک مرورگر مدیریت‌شده یا پروفایل CDP خام نیاز دارند

  </Accordion>
</AccordionGroup>

## Sandboxing و حافظه

<AccordionGroup>
  <Accordion title="آیا مستندات اختصاصی برای sandboxing وجود دارد؟">
    بله. [Sandboxing](/fa/gateway/sandboxing) را ببینید. برای راه‌اندازی مخصوص Docker (Gateway کامل در Docker یا imageهای sandbox)، [Docker](/fa/install/docker) را ببینید.
  </Accordion>

  <Accordion title="Docker محدود به نظر می‌رسد - چگونه همهٔ قابلیت‌ها را فعال کنم؟">
    image پیش‌فرض با اولویت امنیت ساخته شده و به‌عنوان کاربر `node` اجرا می‌شود، بنابراین
    شامل بسته‌های سیستمی، Homebrew، یا مرورگرهای همراه نیست. برای راه‌اندازی کامل‌تر:

    - `/home/node` را با `OPENCLAW_HOME_VOLUME` پایدار کنید تا cacheها باقی بمانند.
    - وابستگی‌های سیستمی را با `OPENCLAW_DOCKER_APT_PACKAGES` داخل image بگنجانید.
    - مرورگرهای Playwright را از طریق CLI همراه نصب کنید:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` را تنظیم کنید و مطمئن شوید مسیر پایدار است.

    مستندات: [Docker](/fa/install/docker)، [مرورگر](/fa/tools/browser).

  </Accordion>

  <Accordion title="آیا می‌توانم DMها را شخصی نگه دارم اما گروه‌ها را با یک عامل عمومی/sandboxed کنم؟">
    بله - اگر ترافیک خصوصی شما **DMها** و ترافیک عمومی شما **گروه‌ها** باشد.

    از `agents.defaults.sandbox.mode: "non-main"` استفاده کنید تا نشست‌های گروه/کانال (کلیدهای غیر اصلی) در backend پیکربندی‌شدهٔ sandbox اجرا شوند، در حالی‌که نشست اصلی DM روی میزبان باقی می‌ماند. اگر backendای انتخاب نکنید، Docker پیش‌فرض است. سپس با `tools.sandbox.tools` محدود کنید چه ابزارهایی در نشست‌های sandboxed در دسترس باشند.

    راهنمای راه‌اندازی + نمونه پیکربندی: [گروه‌ها: DMهای شخصی + گروه‌های عمومی](/fa/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع کلیدی پیکربندی: [پیکربندی Gateway](/fa/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="چگونه یک پوشهٔ میزبان را به sandbox متصل کنم؟">
    `agents.defaults.sandbox.docker.binds` را روی `["host:path:mode"]` تنظیم کنید (مثلاً `"/home/user/src:/src:ro"`). bindهای سراسری و هر-عامل ادغام می‌شوند؛ وقتی `scope: "shared"` باشد، bindهای هر-عامل نادیده گرفته می‌شوند. برای هر چیز حساس از `:ro` استفاده کنید و به یاد داشته باشید bindها دیوارهای فایل‌سیستم sandbox را دور می‌زنند.

    OpenClaw منابع bind را هم در برابر مسیر نرمال‌شده و هم مسیر canonical که از طریق عمیق‌ترین نیای موجود resolve شده اعتبارسنجی می‌کند. یعنی خروج از مسیر از طریق والد symlink همچنان fail closed می‌شود، حتی وقتی آخرین بخش مسیر هنوز وجود ندارد، و بررسی‌های ریشهٔ مجاز پس از resolve شدن symlink هم اعمال می‌شوند.

    برای نمونه‌ها و نکته‌های ایمنی، [Sandboxing](/fa/gateway/sandboxing#custom-bind-mounts) و [Sandbox در برابر سیاست ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) را ببینید.

  </Accordion>

  <Accordion title="حافظه چگونه کار می‌کند؟">
    حافظهٔ OpenClaw فقط فایل‌های Markdown در فضای کاری عامل است:

    - یادداشت‌های روزانه در `memory/YYYY-MM-DD.md`
    - یادداشت‌های بلندمدت گزینش‌شده در `MEMORY.md` (فقط نشست‌های اصلی/خصوصی)

    OpenClaw همچنین یک **flush خاموش حافظه پیش از compaction** اجرا می‌کند تا به مدل یادآوری کند
    پیش از auto-compaction یادداشت‌های پایدار بنویسد. این فقط وقتی اجرا می‌شود که فضای کاری
    قابل نوشتن باشد (sandboxهای فقط‌خواندنی آن را رد می‌کنند). [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>

  <Accordion title="حافظه مدام چیزها را فراموش می‌کند. چگونه آن را ماندگار کنم؟">
    از ربات بخواهید **آن واقعیت را در حافظه بنویسد**. یادداشت‌های بلندمدت در `MEMORY.md` قرار می‌گیرند،
    زمینهٔ کوتاه‌مدت در `memory/YYYY-MM-DD.md`.

    این هنوز حوزه‌ای است که در حال بهبود آن هستیم. یادآوری به مدل برای ذخیرهٔ حافظه‌ها کمک می‌کند؛
    خودش می‌داند چه کند. اگر همچنان فراموش می‌کند، بررسی کنید Gateway در هر اجرا از همان
    فضای کاری استفاده می‌کند.

    مستندات: [حافظه](/fa/concepts/memory)، [فضای کاری عامل](/fa/concepts/agent-workspace).

  </Accordion>

  <Accordion title="آیا حافظه برای همیشه باقی می‌ماند؟ محدودیت‌ها چیست؟">
    فایل‌های حافظه روی دیسک زندگی می‌کنند و تا وقتی حذفشان نکنید باقی می‌مانند. محدودیت، فضای ذخیره‌سازی شماست،
    نه مدل. **زمینهٔ نشست** همچنان به پنجرهٔ زمینهٔ مدل محدود است، بنابراین گفت‌وگوهای طولانی می‌توانند compact یا truncate شوند. به همین دلیل
    جست‌وجوی حافظه وجود دارد - فقط بخش‌های مرتبط را به زمینه برمی‌گرداند.

    مستندات: [حافظه](/fa/concepts/memory)، [زمینه](/fa/concepts/context).

  </Accordion>

  <Accordion title="آیا جستجوی معنایی حافظه به کلید API OpenAI نیاز دارد؟">
    فقط اگر از **OpenAI embeddings** استفاده کنید. Codex OAuth چت/تکمیل‌ها را پوشش می‌دهد و
    دسترسی به embeddings را **اعطا نمی‌کند**، بنابراین **ورود با Codex (OAuth یا
    ورود Codex CLI)** برای جستجوی معنایی حافظه کمکی نمی‌کند. OpenAI embeddings
    همچنان به یک کلید API واقعی نیاز دارد (`OPENAI_API_KEY` یا `models.providers.openai.apiKey`).

    اگر provider را صراحتا تنظیم نکنید، OpenClaw وقتی بتواند یک کلید API را پیدا کند
    به‌صورت خودکار یک provider را انتخاب می‌کند (auth profiles، `models.providers.*.apiKey`، یا env vars).
    اگر کلید OpenAI پیدا شود OpenAI را ترجیح می‌دهد، وگرنه اگر کلید Gemini
    پیدا شود Gemini را، سپس Voyage، سپس Mistral. اگر هیچ کلید راه‌دوری در دسترس نباشد، جستجوی حافظه
    تا زمانی که آن را پیکربندی کنید غیرفعال می‌ماند. اگر یک مسیر مدل محلی
    پیکربندی‌شده و موجود داشته باشید، OpenClaw
    `local` را ترجیح می‌دهد. Ollama زمانی پشتیبانی می‌شود که صراحتا
    `memorySearch.provider = "ollama"` را تنظیم کنید.

    اگر ترجیح می‌دهید محلی بمانید، `memorySearch.provider = "local"` را تنظیم کنید (و در صورت تمایل
    `memorySearch.fallback = "none"`). اگر Gemini embeddings می‌خواهید،
    `memorySearch.provider = "gemini"` را تنظیم کنید و `GEMINI_API_KEY` (یا
    `memorySearch.remote.apiKey`) را ارائه دهید. ما از مدل‌های embedding متعلق به **OpenAI، Gemini، Voyage، Mistral، Ollama، یا local** پشتیبانی می‌کنیم
    - برای جزئیات راه‌اندازی، [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>
</AccordionGroup>

## چیزها روی دیسک کجا قرار دارند

<AccordionGroup>
  <Accordion title="آیا همه داده‌های استفاده‌شده با OpenClaw به‌صورت محلی ذخیره می‌شوند؟">
    خیر - **وضعیت OpenClaw محلی است**، اما **سرویس‌های خارجی همچنان چیزهایی را که برایشان می‌فرستید می‌بینند**.

    - **محلی به‌صورت پیش‌فرض:** نشست‌ها، فایل‌های حافظه، پیکربندی، و workspace روی میزبان Gateway قرار دارند
      (`~/.openclaw` + دایرکتوری workspace شما).
    - **راه‌دور به‌ناچار:** پیام‌هایی که به providerهای مدل (Anthropic/OpenAI/غیره) می‌فرستید به
      APIهای آن‌ها می‌روند، و پلتفرم‌های چت (WhatsApp/Telegram/Slack/غیره) داده‌های پیام را روی
      سرورهای خودشان ذخیره می‌کنند.
    - **شما ردپا را کنترل می‌کنید:** استفاده از مدل‌های محلی promptها را روی دستگاه شما نگه می‌دارد، اما ترافیک channel
      همچنان از سرورهای همان channel عبور می‌کند.

    مرتبط: [workspace عامل](/fa/concepts/agent-workspace)، [حافظه](/fa/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw داده‌های خود را کجا ذخیره می‌کند؟">
    همه چیز زیر `$OPENCLAW_STATE_DIR` قرار دارد (پیش‌فرض: `~/.openclaw`):

    | مسیر                                                            | هدف                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | پیکربندی اصلی (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | واردسازی OAuth قدیمی (در اولین استفاده در auth profiles کپی می‌شود)       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles (OAuth، کلیدهای API، و `keyRef`/`tokenRef` اختیاری)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | payload محرمانه اختیاری مبتنی بر فایل برای providerهای SecretRef از نوع `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | فایل سازگاری قدیمی (ورودی‌های ثابت `api_key` پاک‌سازی شده‌اند)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | وضعیت provider (مثلا `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | وضعیت هر عامل (agentDir + نشست‌ها)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | تاریخچه و وضعیت گفتگو (برای هر عامل)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | فراداده نشست (برای هر عامل)                                       |

    مسیر قدیمی تک‌عاملی: `~/.openclaw/agent/*` (توسط `openclaw doctor` مهاجرت داده می‌شود).

    **workspace** شما (AGENTS.md، فایل‌های حافظه، skills، و غیره) جداست و از طریق `agents.defaults.workspace` پیکربندی می‌شود (پیش‌فرض: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md باید کجا قرار داشته باشند؟">
    این فایل‌ها در **workspace عامل** قرار دارند، نه در `~/.openclaw`.

    - **Workspace (برای هر عامل)**: `AGENTS.md`، `SOUL.md`، `IDENTITY.md`، `USER.md`،
      `MEMORY.md`، `memory/YYYY-MM-DD.md`، و `HEARTBEAT.md` اختیاری.
      ریشه کوچک‌حرف `memory.md` فقط ورودی تعمیر قدیمی است؛ `openclaw doctor --fix`
      وقتی هر دو فایل وجود داشته باشند می‌تواند آن را در `MEMORY.md` ادغام کند.
    - **دایرکتوری وضعیت (`~/.openclaw`)**: پیکربندی، وضعیت channel/provider، auth profiles، نشست‌ها، لاگ‌ها،
      و Skills مشترک (`~/.openclaw/skills`).

    workspace پیش‌فرض `~/.openclaw/workspace` است و از این طریق قابل پیکربندی است:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    اگر bot پس از راه‌اندازی دوباره «فراموش می‌کند»، بررسی کنید Gateway در هر اجرا از همان
    workspace استفاده می‌کند (و به یاد داشته باشید: حالت راه‌دور از workspace **میزبان gateway**
    استفاده می‌کند، نه لپ‌تاپ محلی شما).

    نکته: اگر یک رفتار یا ترجیح پایدار می‌خواهید، از bot بخواهید آن را **در
    AGENTS.md یا MEMORY.md بنویسد**، نه اینکه به تاریخچه چت تکیه کنید.

    [workspace عامل](/fa/concepts/agent-workspace) و [حافظه](/fa/concepts/memory) را ببینید.

  </Accordion>

  <Accordion title="راهبرد پشتیبان‌گیری پیشنهادی">
    **workspace عامل** خود را در یک repo خصوصی git قرار دهید و آن را در جایی
    خصوصی پشتیبان بگیرید (برای مثال GitHub private). این کار حافظه + فایل‌های AGENTS/SOUL/USER
    را ثبت می‌کند و به شما اجازه می‌دهد بعدا «ذهن» دستیار را بازیابی کنید.

    هیچ چیزی را زیر `~/.openclaw` commit نکنید (credentials، نشست‌ها، tokenها، یا payloadهای محرمانه رمزگذاری‌شده).
    اگر به بازیابی کامل نیاز دارید، هم workspace و هم دایرکتوری وضعیت را
    جداگانه پشتیبان بگیرید (پرسش مهاجرت در بالا را ببینید).

    مستندات: [workspace عامل](/fa/concepts/agent-workspace).

  </Accordion>

  <Accordion title="چگونه OpenClaw را کاملا حذف نصب کنم؟">
    راهنمای اختصاصی را ببینید: [حذف نصب](/fa/install/uninstall).
  </Accordion>

  <Accordion title="آیا عامل‌ها می‌توانند خارج از workspace کار کنند؟">
    بله. workspace **cwd پیش‌فرض** و تکیه‌گاه حافظه است، نه یک sandbox سخت‌گیرانه.
    مسیرهای نسبی داخل workspace resolve می‌شوند، اما مسیرهای مطلق می‌توانند به مکان‌های دیگر
    میزبان دسترسی داشته باشند، مگر اینکه sandboxing فعال باشد. اگر به ایزوله‌سازی نیاز دارید، از
    [`agents.defaults.sandbox`](/fa/gateway/sandboxing) یا تنظیمات sandbox برای هر عامل استفاده کنید. اگر
    می‌خواهید یک repo دایرکتوری کاری پیش‌فرض باشد، `workspace` آن عامل را به ریشه repo اشاره دهید. repo OpenClaw فقط کد منبع است؛
    workspace را جدا نگه دارید مگر اینکه عمدا بخواهید عامل داخل آن کار کند.

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

  <Accordion title="حالت راه‌دور: محل session store کجاست؟">
    وضعیت نشست متعلق به **میزبان gateway** است. اگر در حالت راه‌دور هستید، session store مورد نظر شما روی دستگاه راه‌دور است، نه لپ‌تاپ محلی شما. [مدیریت نشست](/fa/concepts/session) را ببینید.
  </Accordion>
</AccordionGroup>

## مبانی پیکربندی

<AccordionGroup>
  <Accordion title="فرمت پیکربندی چیست؟ کجاست؟">
    OpenClaw یک پیکربندی **JSON5** اختیاری را از `$OPENCLAW_CONFIG_PATH` می‌خواند (پیش‌فرض: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    اگر فایل وجود نداشته باشد، از پیش‌فرض‌های نسبتا امن استفاده می‌کند (از جمله workspace پیش‌فرض `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='من gateway.bind: "lan" (یا "tailnet") را تنظیم کردم و حالا چیزی گوش نمی‌دهد / UI می‌گوید unauthorized'>
    اتصال‌های non-loopback **به یک مسیر معتبر احراز هویت gateway نیاز دارند**. در عمل یعنی:

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

    نکات:

    - `gateway.remote.token` / `.password` به‌تنهایی احراز هویت gateway محلی را فعال **نمی‌کنند**.
    - مسیرهای فراخوانی محلی فقط وقتی `gateway.auth.*` تنظیم نشده باشد می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند.
    - برای احراز هویت password، به‌جای آن `gateway.auth.mode: "password"` به‌همراه `gateway.auth.password` (یا `OPENCLAW_GATEWAY_PASSWORD`) را تنظیم کنید.
    - اگر `gateway.auth.token` / `gateway.auth.password` صراحتا از طریق SecretRef پیکربندی شده و resolve نشود، resolution بسته شکست می‌خورد (بدون پوشاندن با fallback راه‌دور).
    - راه‌اندازی‌های Control UI با shared-secret از طریق `connect.params.auth.token` یا `connect.params.auth.password` احراز هویت می‌کنند (در تنظیمات app/UI ذخیره می‌شود). حالت‌های حامل هویت مانند Tailscale Serve یا `trusted-proxy` به‌جای آن از request headerها استفاده می‌کنند. از قرار دادن shared secretها در URLها پرهیز کنید.
    - با `gateway.auth.mode: "trusted-proxy"`، reverse proxyهای loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح و یک ورودی loopback در `gateway.trustedProxies` نیاز دارند.

  </Accordion>

  <Accordion title="چرا حالا روی localhost به token نیاز دارم؟">
    OpenClaw احراز هویت gateway را به‌صورت پیش‌فرض enforce می‌کند، از جمله روی loopback. در مسیر پیش‌فرض معمول یعنی احراز هویت token: اگر هیچ مسیر احراز هویت صریحی پیکربندی نشده باشد، راه‌اندازی gateway به حالت token resolve می‌شود و یکی را به‌صورت خودکار تولید می‌کند و در `gateway.auth.token` ذخیره می‌کند، بنابراین **clientهای WS محلی باید احراز هویت شوند**. این کار مانع می‌شود فرایندهای محلی دیگر Gateway را فراخوانی کنند.

    اگر مسیر احراز هویت متفاوتی را ترجیح می‌دهید، می‌توانید صراحتا حالت password را انتخاب کنید (یا برای reverse proxyهای آگاه از هویت، `trusted-proxy`). اگر **واقعا** loopback باز می‌خواهید، `gateway.auth.mode: "none"` را صراحتا در پیکربندی خود تنظیم کنید. Doctor هر زمان می‌تواند برای شما token تولید کند: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="آیا پس از تغییر پیکربندی باید restart کنم؟">
    Gateway پیکربندی را watch می‌کند و از hot-reload پشتیبانی می‌کند:

    - `gateway.reload.mode: "hybrid"` (پیش‌فرض): تغییرات امن را hot-apply می‌کند، برای موارد حیاتی restart می‌کند
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
    - اگر اصلا banner نمی‌خواهید، env `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

  </Accordion>

  <Accordion title="چگونه web search (و web fetch) را فعال کنم؟">
    `web_fetch` بدون کلید API کار می‌کند. `web_search` به provider انتخاب‌شده شما
    بستگی دارد:

    - providerهای مبتنی بر API مانند Brave، Exa، Firecrawl، Gemini، Grok، Kimi، MiniMax Search، Perplexity، و Tavily به راه‌اندازی معمول کلید API خود نیاز دارند.
    - Ollama Web Search بدون کلید است، اما از میزبان Ollama پیکربندی‌شده شما استفاده می‌کند و به `ollama signin` نیاز دارد.
    - DuckDuckGo بدون کلید است، اما یک integration غیررسمی مبتنی بر HTML است.
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

    پیکربندی جست‌وجوی وب مخصوص ارائه‌دهنده اکنون زیر `plugins.entries.<plugin>.config.webSearch.*` قرار دارد.
    مسیرهای ارائه‌دهنده قدیمی `tools.web.search.*` هنوز به‌طور موقت برای سازگاری بارگذاری می‌شوند، اما نباید برای پیکربندی‌های جدید استفاده شوند.
    پیکربندی جایگزین دریافت وب Firecrawl زیر `plugins.entries.firecrawl.config.webFetch.*` قرار دارد.

    نکات:

    - اگر از فهرست‌های مجاز استفاده می‌کنید، `web_search`/`web_fetch`/`x_search` یا `group:web` را اضافه کنید.
    - `web_fetch` به‌صورت پیش‌فرض فعال است (مگر اینکه صراحتا غیرفعال شده باشد).
    - اگر `tools.web.fetch.provider` حذف شود، OpenClaw نخستین ارائه‌دهنده جایگزین دریافت آماده را از میان اعتبارنامه‌های موجود به‌طور خودکار شناسایی می‌کند. امروز ارائه‌دهنده همراه، Firecrawl است.
    - دیمون‌ها متغیرهای محیطی را از `~/.openclaw/.env` (یا محیط سرویس) می‌خوانند.

    مستندات: [ابزارهای وب](/fa/tools/web).

  </Accordion>

  <Accordion title="config.apply پیکربندی من را پاک کرد. چگونه آن را بازیابی کنم و از تکرار آن جلوگیری کنم؟">
    `config.apply` **کل پیکربندی** را جایگزین می‌کند. اگر یک شیء جزئی بفرستید، همه چیز
    دیگر حذف می‌شود.

    OpenClaw فعلی در برابر بسیاری از بازنویسی‌های تصادفی محافظت می‌کند:

    - نوشتن‌های پیکربندی تحت مالکیت OpenClaw پیش از نوشتن، کل پیکربندی پس از تغییر را اعتبارسنجی می‌کنند.
    - نوشتن‌های نامعتبر یا مخرب تحت مالکیت OpenClaw رد می‌شوند و به‌صورت `openclaw.json.rejected.*` ذخیره می‌شوند.
    - اگر ویرایش مستقیم باعث خرابی راه‌اندازی یا بارگذاری مجدد داغ شود، Gateway بسته می‌ماند یا بارگذاری مجدد را رد می‌کند؛ `openclaw.json` را بازنویسی نمی‌کند.
    - `openclaw doctor --fix` مسئول تعمیر است و می‌تواند آخرین وضعیت سالم شناخته‌شده را بازیابی کند، در حالی که فایل ردشده را به‌صورت `openclaw.json.clobbered.*` ذخیره می‌کند.

    بازیابی:

    - در `openclaw logs --follow` به‌دنبال `Invalid config at`، `Config write rejected:`، یا `config reload skipped (invalid config)` بگردید.
    - جدیدترین `openclaw.json.clobbered.*` یا `openclaw.json.rejected.*` را کنار پیکربندی فعال بررسی کنید.
    - `openclaw config validate` و `openclaw doctor --fix` را اجرا کنید.
    - فقط کلیدهای موردنظر را با `openclaw config set` یا `config.patch` برگردانید.
    - اگر آخرین وضعیت سالم شناخته‌شده یا payload ردشده ندارید، از نسخه پشتیبان بازیابی کنید، یا دوباره `openclaw doctor` را اجرا کنید و کانال‌ها/مدل‌ها را دوباره پیکربندی کنید.
    - اگر این اتفاق غیرمنتظره بود، یک باگ ثبت کنید و آخرین پیکربندی شناخته‌شده یا هر نسخه پشتیبان خود را ضمیمه کنید.
    - یک عامل کدنویسی محلی اغلب می‌تواند از روی لاگ‌ها یا تاریخچه، یک پیکربندی قابل‌کار را بازسازی کند.

    پیشگیری:

    - برای تغییرات کوچک از `openclaw config set` استفاده کنید.
    - برای ویرایش‌های تعاملی از `openclaw configure` استفاده کنید.
    - وقتی درباره مسیر دقیق یا شکل فیلد مطمئن نیستید، ابتدا از `config.schema.lookup` استفاده کنید؛ این دستور یک گره schema سطحی به‌همراه خلاصه‌های فرزند بلافاصله برای کاوش مرحله‌ای برمی‌گرداند.
    - برای ویرایش‌های جزئی RPC از `config.patch` استفاده کنید؛ `config.apply` را فقط برای جایگزینی کامل پیکربندی نگه دارید.
    - اگر از ابزار فقط-مالک `gateway` در اجرای یک عامل استفاده می‌کنید، همچنان نوشتن در `tools.exec.ask` / `tools.exec.security` را رد می‌کند (از جمله نام‌های مستعار قدیمی `tools.bash.*` که به همان مسیرهای exec محافظت‌شده نرمال‌سازی می‌شوند).

    مستندات: [پیکربندی](/fa/cli/config)، [پیکربندی تعاملی](/fa/cli/configure)، [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-rejected-invalid-config)، [Doctor](/fa/gateway/doctor).

  </Accordion>

  <Accordion title="چگونه یک Gateway مرکزی را با workerهای تخصصی روی دستگاه‌های مختلف اجرا کنم؟">
    الگوی رایج **یک Gateway** (مثلا Raspberry Pi) به‌همراه **nodeها** و **عامل‌ها** است:

    - **Gateway (مرکزی):** مالک کانال‌ها (Signal/WhatsApp)، مسیریابی و نشست‌ها است.
    - **Nodeها (دستگاه‌ها):** Mac/iOS/Android به‌صورت ابزارهای جانبی متصل می‌شوند و ابزارهای محلی (`system.run`، `canvas`، `camera`) را ارائه می‌کنند.
    - **عامل‌ها (workerها):** مغزها/فضاهای کاری جداگانه برای نقش‌های ویژه (مثلا «عملیات Hetzner»، «داده‌های شخصی»).
    - **زیرعامل‌ها:** وقتی موازی‌سازی می‌خواهید، کار پس‌زمینه را از یک عامل اصلی ایجاد کنید.
    - **TUI:** به Gateway متصل شوید و بین عامل‌ها/نشست‌ها جابه‌جا شوید.

    مستندات: [Nodeها](/fa/nodes)، [دسترسی راه دور](/fa/gateway/remote)، [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [زیرعامل‌ها](/fa/tools/subagents)، [TUI](/fa/web/tui).

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

    مقدار پیش‌فرض `false` (headful) است. حالت headless در برخی سایت‌ها احتمال بیشتری دارد بررسی‌های ضدبات را فعال کند. [مرورگر](/fa/tools/browser) را ببینید.

    Headless از **همان موتور Chromium** استفاده می‌کند و برای بیشتر خودکارسازی‌ها (فرم‌ها، کلیک‌ها، scraping، ورودها) کار می‌کند. تفاوت‌های اصلی:

    - پنجره مرورگر قابل‌مشاهده‌ای وجود ندارد (اگر به تصویر نیاز دارید از screenshot استفاده کنید).
    - برخی سایت‌ها درباره خودکارسازی در حالت headless سخت‌گیرتر هستند (CAPTCHAها، ضدبات).
      برای مثال، X/Twitter اغلب نشست‌های headless را مسدود می‌کند.

  </Accordion>

  <Accordion title="چگونه از Brave برای کنترل مرورگر استفاده کنم؟">
    `browser.executablePath` را روی باینری Brave خود (یا هر مرورگر مبتنی بر Chromium) تنظیم کنید و Gateway را راه‌اندازی مجدد کنید.
    نمونه‌های کامل پیکربندی را در [مرورگر](/fa/tools/browser#use-brave-or-another-chromium-based-browser) ببینید.
  </Accordion>
</AccordionGroup>

## Gatewayها و nodeهای راه دور

<AccordionGroup>
  <Accordion title="دستورها چگونه بین Telegram، Gateway و nodeها منتشر می‌شوند؟">
    پیام‌های Telegram توسط **Gateway** مدیریت می‌شوند. Gateway عامل را اجرا می‌کند و
    فقط سپس، وقتی به ابزار node نیاز باشد، از طریق **Gateway WebSocket** با nodeها تماس می‌گیرد:

    Telegram → Gateway → عامل → `node.*` → Node → Gateway → Telegram

    Nodeها ترافیک ورودی ارائه‌دهنده را نمی‌بینند؛ آن‌ها فقط فراخوانی‌های RPC مربوط به node را دریافت می‌کنند.

  </Accordion>

  <Accordion title="اگر Gateway از راه دور میزبانی شود، عامل من چگونه می‌تواند به رایانه من دسترسی داشته باشد؟">
    پاسخ کوتاه: **رایانه خود را به‌عنوان یک node pair کنید**. Gateway در جای دیگری اجرا می‌شود، اما می‌تواند
    ابزارهای `node.*` (screen، camera، system) را از طریق Gateway WebSocket روی ماشین محلی شما فراخوانی کند.

    راه‌اندازی معمول:

    1. Gateway را روی میزبان همیشه‌روشن (VPS/سرور خانگی) اجرا کنید.
    2. میزبان Gateway و رایانه خود را در یک tailnet قرار دهید.
    3. مطمئن شوید Gateway WS قابل‌دسترسی است (bind روی tailnet یا تونل SSH).
    4. برنامه macOS را به‌صورت محلی باز کنید و در حالت **Remote over SSH** (یا tailnet مستقیم)
       وصل شوید تا بتواند به‌عنوان node ثبت شود.
    5. node را روی Gateway تأیید کنید:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    به bridge TCP جداگانه نیاز نیست؛ nodeها از طریق Gateway WebSocket متصل می‌شوند.

    یادآوری امنیتی: pair کردن یک node macOS امکان `system.run` را روی آن ماشین می‌دهد. فقط
    دستگاه‌هایی را pair کنید که به آن‌ها اعتماد دارید، و [امنیت](/fa/gateway/security) را مرور کنید.

    مستندات: [Nodeها](/fa/nodes)، [پروتکل Gateway](/fa/gateway/protocol)، [حالت راه دور macOS](/fa/platforms/mac/remote)، [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="Tailscale وصل است اما هیچ پاسخی دریافت نمی‌کنم. حالا چه کنم؟">
    موارد پایه را بررسی کنید:

    - Gateway در حال اجراست: `openclaw gateway status`
    - سلامت Gateway: `openclaw status`
    - سلامت کانال: `openclaw channels status`

    سپس احراز هویت و مسیریابی را بررسی کنید:

    - اگر از Tailscale Serve استفاده می‌کنید، مطمئن شوید `gateway.auth.allowTailscale` درست تنظیم شده است.
    - اگر از طریق تونل SSH وصل می‌شوید، تأیید کنید تونل محلی فعال است و به پورت درست اشاره می‌کند.
    - تأیید کنید فهرست‌های مجاز شما (DM یا گروه) شامل حساب شما هستند.

    مستندات: [Tailscale](/fa/gateway/tailscale)، [دسترسی راه دور](/fa/gateway/remote)، [کانال‌ها](/fa/channels).

  </Accordion>

  <Accordion title="آیا دو نمونه OpenClaw می‌توانند با یکدیگر صحبت کنند (محلی + VPS)؟">
    بله. bridge داخلی «bot-to-bot» وجود ندارد، اما می‌توانید آن را به چند روش
    قابل‌اعتماد وصل کنید:

    **ساده‌ترین:** از یک کانال گفت‌وگوی معمولی استفاده کنید که هر دو bot به آن دسترسی دارند (Telegram/Slack/WhatsApp).
    کاری کنید Bot A پیامی به Bot B بفرستد، سپس بگذارید Bot B طبق معمول پاسخ دهد.

    **bridge CLI (عمومی):** اسکریپتی اجرا کنید که Gateway دیگر را با
    `openclaw agent --message ... --deliver` فراخوانی کند و یک گفت‌وگو را هدف بگیرد که bot دیگر
    در آن گوش می‌دهد. اگر یک bot روی VPS راه دور است، CLI خود را از طریق SSH/Tailscale به آن Gateway راه دور
    اشاره دهید ([دسترسی راه دور](/fa/gateway/remote) را ببینید).

    الگوی نمونه (از ماشینی اجرا کنید که می‌تواند به Gateway هدف برسد):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نکته: یک محافظ اضافه کنید تا دو bot بی‌پایان وارد حلقه نشوند (فقط-mention، فهرست‌های مجاز کانال،
    یا قانون «به پیام‌های bot پاسخ نده»).

    مستندات: [دسترسی راه دور](/fa/gateway/remote)، [CLI عامل](/fa/cli/agent)، [ارسال عامل](/fa/tools/agent-send).

  </Accordion>

  <Accordion title="آیا برای چند عامل به VPSهای جداگانه نیاز دارم؟">
    خیر. یک Gateway می‌تواند چند عامل را میزبانی کند، هرکدام با فضای کاری، پیش‌فرض‌های مدل،
    و مسیریابی خودش. این راه‌اندازی معمول است و بسیار ارزان‌تر و ساده‌تر از اجرای
    یک VPS برای هر عامل است.

    فقط وقتی از VPSهای جداگانه استفاده کنید که به جداسازی سخت (مرزهای امنیتی) یا پیکربندی‌های بسیار
    متفاوتی نیاز دارید که نمی‌خواهید مشترک باشند. در غیر این صورت، یک Gateway را نگه دارید و
    از چند عامل یا زیرعامل استفاده کنید.

  </Accordion>

  <Accordion title="آیا استفاده از node روی لپ‌تاپ شخصی من به‌جای SSH از یک VPS مزیتی دارد؟">
    بله - nodeها روش درجه‌یک برای دسترسی به لپ‌تاپ شما از یک Gateway راه دور هستند، و
    بیش از دسترسی shell را فعال می‌کنند. Gateway روی macOS/Linux (Windows از طریق WSL2) اجرا می‌شود و
    سبک است (یک VPS کوچک یا دستگاهی در حد Raspberry Pi کافی است؛ 4 GB RAM کاملا کافی است)، بنابراین یک
    راه‌اندازی رایج شامل یک میزبان همیشه‌روشن به‌همراه لپ‌تاپ شما به‌عنوان node است.

    - **به SSH ورودی نیاز نیست.** Nodeها به Gateway WebSocket متصل می‌شوند و از pairing دستگاه استفاده می‌کنند.
    - **کنترل‌های اجرای امن‌تر.** `system.run` با فهرست‌های مجاز/تأییدهای node روی آن لپ‌تاپ کنترل می‌شود.
    - **ابزارهای دستگاه بیشتر.** Nodeها علاوه بر `system.run`، `canvas`، `camera` و `screen` را ارائه می‌کنند.
    - **خودکارسازی مرورگر محلی.** Gateway را روی VPS نگه دارید، اما Chrome را به‌صورت محلی از طریق میزبان node روی لپ‌تاپ اجرا کنید، یا از طریق Chrome MCP به Chrome محلی روی میزبان متصل شوید.

    SSH برای دسترسی موقت shell مناسب است، اما nodeها برای workflowهای مداوم عامل و
    خودکارسازی دستگاه ساده‌تر هستند.

    مستندات: [Nodeها](/fa/nodes)، [CLI Nodeها](/fa/cli/nodes)، [مرورگر](/fa/tools/browser).

  </Accordion>

  <Accordion title="آیا nodeها سرویس gateway اجرا می‌کنند؟">
    خیر. فقط **یک gateway** باید در هر میزبان اجرا شود، مگر اینکه عمدا profileهای جداشده اجرا کنید ([چند gateway](/fa/gateway/multiple-gateways) را ببینید). Nodeها ابزارهای جانبی هستند که
    به gateway متصل می‌شوند (nodeهای iOS/Android، یا «حالت node» macOS در برنامه menubar). برای میزبان‌های node
    بدون رابط گرافیکی و کنترل CLI، [CLI میزبان Node](/fa/cli/node) را ببینید.

    برای تغییرات `gateway`، `discovery` و `canvasHost` راه‌اندازی مجدد کامل لازم است.

  </Accordion>

  <Accordion title="آیا روشی API / RPC برای اعمال پیکربندی وجود دارد؟">
    بله.

    - `config.schema.lookup`: پیش از نوشتن، یک زیردرخت پیکربندی را با گره schema سطحی، hint رابط کاربری مطابق، و خلاصه‌های فرزند بلافاصله بررسی می‌کند
    - `config.get`: snapshot فعلی + hash را دریافت می‌کند
    - `config.patch`: به‌روزرسانی جزئی امن (برای بیشتر ویرایش‌های RPC ترجیح داده می‌شود)؛ وقتی ممکن باشد hot-reload می‌کند و وقتی لازم باشد راه‌اندازی مجدد می‌کند
    - `config.apply`: اعتبارسنجی + جایگزینی کل پیکربندی؛ وقتی ممکن باشد hot-reload می‌کند و وقتی لازم باشد راه‌اندازی مجدد می‌کند
    - ابزار runtime فقط-مالک `gateway` همچنان از بازنویسی `tools.exec.ask` / `tools.exec.security` خودداری می‌کند؛ نام‌های مستعار قدیمی `tools.bash.*` به همان مسیرهای exec محافظت‌شده نرمال‌سازی می‌شوند

  </Accordion>

  <Accordion title="پیکربندی حداقلی و معقول برای نصب نخست">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    این کار workspace شما را تنظیم می‌کند و محدود می‌کند چه کسانی می‌توانند bot را فعال کنند.

  </Accordion>

  <Accordion title="چگونه Tailscale را روی یک VPS راه‌اندازی کنم و از Mac خودم وصل شوم؟">
    مراحل حداقلی:

    1. **نصب + ورود در VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **نصب + ورود در Mac خودتان**
       - از برنامه Tailscale استفاده کنید و به همان tailnet وارد شوید.
    3. **فعال‌سازی MagicDNS (توصیه‌شده)**
       - در کنسول مدیریتی Tailscale، MagicDNS را فعال کنید تا VPS نامی پایدار داشته باشد.
    4. **استفاده از نام میزبان tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    اگر Control UI را بدون SSH می‌خواهید، از Tailscale Serve روی VPS استفاده کنید:

    ```bash
    openclaw gateway --tailscale serve
    ```

    این کار gateway را مقید به loopback نگه می‌دارد و HTTPS را از طریق Tailscale در دسترس قرار می‌دهد. [Tailscale](/fa/gateway/tailscale) را ببینید.

  </Accordion>

  <Accordion title="چگونه یک گره Mac را به یک Gateway راه‌دور (Tailscale Serve) وصل کنم؟">
    Serve، **Gateway Control UI + WS** را در دسترس قرار می‌دهد. گره‌ها از طریق همان endpoint مربوط به Gateway WS وصل می‌شوند.

    راه‌اندازی پیشنهادی:

    1. **مطمئن شوید VPS + Mac روی همان tailnet هستند**.
    2. **از برنامه macOS در حالت راه‌دور استفاده کنید** (هدف SSH می‌تواند نام میزبان tailnet باشد).
       برنامه پورت Gateway را تونل می‌کند و به‌عنوان یک گره وصل می‌شود.
    3. **گره را تأیید کنید** روی gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    مستندات: [پروتکل Gateway](/fa/gateway/protocol)، [کشف](/fa/gateway/discovery)، [حالت راه‌دور macOS](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="آیا باید روی لپ‌تاپ دوم نصب کنم یا فقط یک گره اضافه کنم؟">
    اگر فقط به **ابزارهای محلی** (screen/camera/exec) روی لپ‌تاپ دوم نیاز دارید، آن را به‌عنوان یک
    **گره** اضافه کنید. این کار یک Gateway واحد را حفظ می‌کند و از پیکربندی تکراری جلوگیری می‌کند. ابزارهای گره محلی
    در حال حاضر فقط مخصوص macOS هستند، اما قصد داریم آن‌ها را به OSهای دیگر هم گسترش دهیم.

    Gateway دوم را فقط زمانی نصب کنید که به **جداسازی سخت** یا دو bot کاملاً جدا نیاز دارید.

    مستندات: [گره‌ها](/fa/nodes)، [CLI گره‌ها](/fa/cli/nodes)، [Gatewayهای متعدد](/fa/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغیرهای محیطی و بارگذاری .env

<AccordionGroup>
  <Accordion title="OpenClaw چگونه متغیرهای محیطی را بارگذاری می‌کند؟">
    OpenClaw متغیرهای محیطی را از فرایند والد (shell، launchd/systemd، CI و غیره) می‌خواند و افزون بر آن موارد زیر را بارگذاری می‌کند:

    - `.env` از دایرکتوری کاری فعلی
    - یک `.env` عمومی fallback از `~/.openclaw/.env` (یا همان `$OPENCLAW_STATE_DIR/.env`)

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

    برای precedence و sourceهای کامل، [/environment](/fa/help/environment) را ببینید.

  </Accordion>

  <Accordion title="Gateway را از طریق سرویس شروع کردم و متغیرهای محیطی من ناپدید شدند. حالا چه کنم؟">
    دو راه‌حل رایج:

    1. کلیدهای گمشده را در `~/.openclaw/.env` بگذارید تا حتی وقتی سرویس env مربوط به shell شما را به ارث نمی‌برد هم برداشته شوند.
    2. وارد کردن shell را فعال کنید (امکانی اختیاری):

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

    این کار shell ورود شما را اجرا می‌کند و فقط کلیدهای مورد انتظارِ گمشده را وارد می‌کند (هرگز بازنویسی نمی‌کند). معادل‌های متغیر محیطی:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN را تنظیم کردم، اما وضعیت مدل‌ها "Shell env: off." نشان می‌دهد. چرا؟'>
    `openclaw models status` گزارش می‌دهد که آیا **وارد کردن env از shell** فعال است یا نه. "Shell env: off"
    به این معنی **نیست** که متغیرهای محیطی شما گم شده‌اند - فقط یعنی OpenClaw
    shell ورود شما را به‌طور خودکار بارگذاری نمی‌کند.

    اگر Gateway به‌عنوان سرویس اجرا شود (launchd/systemd)، محیط shell شما را
    به ارث نمی‌برد. با یکی از این روش‌ها مشکل را رفع کنید:

    1. توکن را در `~/.openclaw/.env` بگذارید:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. یا وارد کردن shell را فعال کنید (`env.shellEnv.enabled: true`).
    3. یا آن را به block مربوط به `env` در پیکربندی خود اضافه کنید (فقط اگر وجود نداشته باشد اعمال می‌شود).

    سپس gateway را بازراه‌اندازی کنید و دوباره بررسی کنید:

    ```bash
    openclaw models status
    ```

    توکن‌های Copilot از `COPILOT_GITHUB_TOKEN` خوانده می‌شوند (همچنین `GH_TOKEN` / `GITHUB_TOKEN`).
    [/concepts/model-providers](/fa/concepts/model-providers) و [/environment](/fa/help/environment) را ببینید.

  </Accordion>
</AccordionGroup>

## نشست‌ها و چندین چت

<AccordionGroup>
  <Accordion title="چگونه یک گفت‌وگوی تازه شروع کنم؟">
    `/new` یا `/reset` را به‌عنوان یک پیام مستقل بفرستید. [مدیریت نشست](/fa/concepts/session) را ببینید.
  </Accordion>

  <Accordion title="اگر هرگز /new نفرستم، آیا نشست‌ها به‌طور خودکار reset می‌شوند؟">
    نشست‌ها می‌توانند پس از `session.idleMinutes` منقضی شوند، اما این قابلیت **به‌صورت پیش‌فرض غیرفعال است** (پیش‌فرض **0**).
    برای فعال کردن انقضای idle، آن را روی یک مقدار مثبت تنظیم کنید. وقتی فعال باشد، **پیام بعدی**
    پس از دوره idle، یک session id تازه برای آن chat key شروع می‌کند.
    این کار transcriptها را حذف نمی‌کند - فقط یک نشست جدید شروع می‌کند.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="آیا راهی برای ساختن تیمی از نمونه‌های OpenClaw وجود دارد (یک CEO و چندین agent)؟">
    بله، از طریق **مسیریابی چند-agent** و **sub-agentها**. می‌توانید یک agent هماهنگ‌کننده
    و چندین agent اجرایی با workspaceها و مدل‌های خودشان بسازید.

    با این حال، بهتر است این را یک **آزمایش سرگرم‌کننده** ببینید. مصرف token آن زیاد است و اغلب
    از استفاده از یک bot با نشست‌های جداگانه کم‌بازده‌تر است. مدل معمولی که ما
    تصور می‌کنیم یک bot است که با آن صحبت می‌کنید، همراه با نشست‌های مختلف برای کار موازی. آن
    bot همچنین می‌تواند در صورت نیاز sub-agent ایجاد کند.

    مستندات: [مسیریابی چند-agent](/fa/concepts/multi-agent)، [Sub-agentها](/fa/tools/subagents)، [Agents CLI](/fa/cli/agents).

  </Accordion>

  <Accordion title="چرا context وسط کار کوتاه شد؟ چگونه از آن جلوگیری کنم؟">
    context نشست با پنجره مدل محدود می‌شود. چت‌های طولانی، خروجی‌های بزرگ ابزار، یا تعداد زیاد
    فایل‌ها می‌توانند باعث Compaction یا کوتاه‌سازی شوند.

    چیزهایی که کمک می‌کنند:

    - از bot بخواهید وضعیت فعلی را خلاصه کند و آن را در یک فایل بنویسد.
    - پیش از کارهای طولانی از `/compact` استفاده کنید، و هنگام تغییر موضوع از `/new`.
    - context مهم را در workspace نگه دارید و از bot بخواهید آن را دوباره بخواند.
    - برای کار طولانی یا موازی از sub-agentها استفاده کنید تا چت اصلی کوچک‌تر بماند.
    - اگر این اتفاق زیاد رخ می‌دهد، مدلی با پنجره context بزرگ‌تر انتخاب کنید.

  </Accordion>

  <Accordion title="چگونه OpenClaw را کاملاً reset کنم ولی نصب‌شده نگه دارم؟">
    از فرمان reset استفاده کنید:

    ```bash
    openclaw reset
    ```

    reset کامل غیرتعاملی:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    سپس راه‌اندازی را دوباره اجرا کنید:

    ```bash
    openclaw onboard --install-daemon
    ```

    نکته‌ها:

    - Onboarding هم اگر پیکربندی موجودی ببیند، **Reset** را پیشنهاد می‌دهد. [Onboarding (CLI)](/fa/start/wizard) را ببینید.
    - اگر از profileها استفاده کردید (`--profile` / `OPENCLAW_PROFILE`)، هر state dir را reset کنید (پیش‌فرض‌ها `~/.openclaw-<profile>` هستند).
    - reset توسعه: `openclaw gateway --dev --reset` (فقط توسعه؛ پیکربندی توسعه + credentialها + نشست‌ها + workspace را پاک می‌کند).

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

    - **هرس نشست** (`agents.defaults.contextPruning`) را فعال یا تنظیم کنید تا خروجی ابزار قدیمی trim شود.
    - از مدلی با پنجره context بزرگ‌تر استفاده کنید.

    مستندات: [Compaction](/fa/concepts/compaction)، [هرس نشست](/fa/concepts/session-pruning)، [مدیریت نشست](/fa/concepts/session).

  </Accordion>

  <Accordion title='چرا "LLM request rejected: messages.content.tool_use.input field required" را می‌بینم؟'>
    این یک خطای اعتبارسنجی provider است: مدل یک block مربوط به `tool_use` بدون
    `input` لازم تولید کرده است. معمولاً یعنی تاریخچه نشست stale یا خراب شده است (اغلب پس از threadهای طولانی
    یا تغییر ابزار/schema).

    راه‌حل: با `/new` یک نشست تازه شروع کنید (پیام مستقل).

  </Accordion>

  <Accordion title="چرا هر ۳۰ دقیقه پیام Heartbeat می‌گیرم؟">
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

    اگر `HEARTBEAT.md` وجود داشته باشد اما عملاً خالی باشد (فقط خطوط خالی و headerهای markdown
    مانند `# Heading`)، OpenClaw اجرای heartbeat را برای صرفه‌جویی در فراخوانی‌های API رد می‌کند.
    اگر فایل وجود نداشته باشد، heartbeat همچنان اجرا می‌شود و مدل تصمیم می‌گیرد چه کند.

    overrideهای مخصوص هر agent از `agents.list[].heartbeat` استفاده می‌کنند. مستندات: [Heartbeat](/fa/gateway/heartbeat).

  </Accordion>

  <Accordion title='آیا باید یک "bot account" به گروه WhatsApp اضافه کنم؟'>
    خیر. OpenClaw روی **حساب خودتان** اجرا می‌شود، بنابراین اگر شما در گروه باشید، OpenClaw می‌تواند آن را ببیند.
    به‌صورت پیش‌فرض، پاسخ‌های گروهی تا وقتی فرستنده‌ها را مجاز نکنید مسدود هستند (`groupPolicy: "allowlist"`).

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
    گزینه ۱ (سریع‌ترین): logها را دنبال کنید و یک پیام آزمایشی در گروه بفرستید:

    ```bash
    openclaw logs --follow --json
    ```

    به‌دنبال `chatId` (یا `from`) باشید که به `@g.us` ختم می‌شود، مانند:
    `1234567890-1234567890@g.us`.

    گزینه ۲ (اگر از قبل پیکربندی/allowlist شده): گروه‌ها را از پیکربندی فهرست کنید:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    مستندات: [WhatsApp](/fa/channels/whatsapp)، [Directory](/fa/cli/directory)، [Logs](/fa/cli/logs).

  </Accordion>

  <Accordion title="چرا OpenClaw در گروه پاسخ نمی‌دهد؟">
    دو علت رایج:

    - gate کردن با mention روشن است (پیش‌فرض). باید bot را @mention کنید (یا با `mentionPatterns` تطبیق بدهید).
    - `channels.whatsapp.groups` را بدون `"*"` پیکربندی کرده‌اید و گروه در allowlist نیست.

    [گروه‌ها](/fa/channels/groups) و [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.

  </Accordion>

  <Accordion title="آیا گروه‌ها/threadها context را با DMها به‌اشتراک می‌گذارند؟">
    چت‌های مستقیم به‌صورت پیش‌فرض به نشست اصلی collapse می‌شوند. گروه‌ها/channelها session keyهای خودشان را دارند، و topicهای Telegram / threadهای Discord نشست‌های جداگانه‌اند. [گروه‌ها](/fa/channels/groups) و [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.
  </Accordion>

  <Accordion title="چند workspace و agent می‌توانم بسازم؟">
    محدودیت سختی وجود ندارد. چند ده مورد (حتی چند صد مورد) مشکلی ندارد، اما مراقب این‌ها باشید:

    - **رشد دیسک:** نشست‌ها + transcriptها زیر `~/.openclaw/agents/<agentId>/sessions/` قرار دارند.
    - **هزینه token:** agentهای بیشتر یعنی استفاده هم‌زمان بیشتر از مدل.
    - **سربار عملیاتی:** auth profileهای هر agent، workspaceها، و مسیریابی channel.

    نکته‌ها:

    - برای هر agent یک workspace **فعال** نگه دارید (`agents.defaults.workspace`).
    - اگر دیسک رشد کرد، نشست‌های قدیمی را هرس کنید (JSONL یا store entryها را حذف کنید).
    - از `openclaw doctor` برای پیدا کردن workspaceهای stray و mismatchهای profile استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم چند بات یا چت را هم‌زمان اجرا کنم (Slack)، و چطور باید آن را راه‌اندازی کنم؟">
    بله. از **مسیریابی چندعاملی** استفاده کنید تا چند عامل ایزوله را اجرا کنید و پیام‌های ورودی را بر اساس
    کانال/حساب/همتا مسیریابی کنید. Slack به‌عنوان یک کانال پشتیبانی می‌شود و می‌تواند به عامل‌های مشخصی متصل شود.

    دسترسی مرورگر قدرتمند است، اما به معنی «انجام هر کاری که انسان می‌تواند انجام دهد» نیست - ضدبات، CAPTCHAها و MFA همچنان می‌توانند
    اتوماسیون را مسدود کنند. برای قابل‌اعتمادترین کنترل مرورگر، از Chrome MCP محلی روی میزبان استفاده کنید،
    یا از CDP روی ماشینی استفاده کنید که واقعاً مرورگر را اجرا می‌کند.

    راه‌اندازی پیشنهادی:

    - میزبان Gateway همیشه روشن (VPS/Mac mini).
    - یک عامل برای هر نقش (اتصال‌ها).
    - کانال(های) Slack متصل به آن عامل‌ها.
    - مرورگر محلی از طریق Chrome MCP یا یک Node در صورت نیاز.

    مستندات: [مسیریابی چندعاملی](/fa/concepts/multi-agent)، [Slack](/fa/channels/slack)،
    [مرورگر](/fa/tools/browser)، [Nodeها](/fa/nodes).

  </Accordion>
</AccordionGroup>

## مدل‌ها، failover، و پروفایل‌های احراز هویت

پرسش‌وپاسخ مدل‌ها — پیش‌فرض‌ها، انتخاب، نام‌های مستعار، جابه‌جایی، failover، پروفایل‌های احراز هویت —
در [پرسش‌های پرتکرار مدل‌ها](/fa/help/faq-models) قرار دارد.

## Gateway: پورت‌ها، «already running»، و حالت remote

<AccordionGroup>
  <Accordion title="Gateway از چه پورتی استفاده می‌کند؟">
    `gateway.port` پورت چندگانه‌سازی‌شده واحد را برای WebSocket + HTTP (Control UI، hookها، و غیره) کنترل می‌کند.

    ترتیب اولویت:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='چرا openclaw gateway status می‌گوید "Runtime: running" اما "Connectivity probe: failed"؟'>
    چون «running» دید **supervisor** است (launchd/systemd/schtasks). پروب اتصال یعنی CLI واقعاً به WebSocket مربوط به gateway وصل می‌شود.

    از `openclaw gateway status` استفاده کنید و به این خطوط اعتماد کنید:

    - `Probe target:` (نشانی‌ای که پروب واقعاً استفاده کرده است)
    - `Listening:` (آنچه واقعاً روی پورت bind شده است)
    - `Last gateway error:` (علت ریشه‌ای رایج وقتی فرایند زنده است اما پورت listen نمی‌کند)

  </Accordion>

  <Accordion title='چرا openclaw gateway status مقدارهای متفاوتی برای "Config (cli)" و "Config (service)" نشان می‌دهد؟'>
    شما در حال ویرایش یک فایل پیکربندی هستید در حالی که سرویس با فایل دیگری اجرا می‌شود (اغلب به‌دلیل ناهماهنگی `--profile` / `OPENCLAW_STATE_DIR`).

    راه‌حل:

    ```bash
    openclaw gateway install --force
    ```

    این دستور را از همان `--profile` / محیطی اجرا کنید که می‌خواهید سرویس از آن استفاده کند.

  </Accordion>

  <Accordion title='عبارت "another gateway instance is already listening" یعنی چه؟'>
    OpenClaw با bind کردن فوری listener مربوط به WebSocket هنگام راه‌اندازی، یک قفل runtime اعمال می‌کند (پیش‌فرض `ws://127.0.0.1:18789`). اگر bind با `EADDRINUSE` شکست بخورد، `GatewayLockError` پرتاب می‌کند که نشان می‌دهد نمونه دیگری از قبل در حال listen است.

    راه‌حل: نمونه دیگر را متوقف کنید، پورت را آزاد کنید، یا با `openclaw gateway --port <port>` اجرا کنید.

  </Accordion>

  <Accordion title="چگونه OpenClaw را در حالت remote اجرا کنم (client به Gateway دیگری وصل شود)؟">
    `gateway.mode: "remote"` را تنظیم کنید و آن را به یک URL راه‌دور WebSocket اشاره دهید، در صورت نیاز با credentialهای راه‌دور shared-secret:

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
    - برنامه macOS فایل پیکربندی را پایش می‌کند و وقتی این مقدارها تغییر کنند، به‌صورت زنده حالت‌ها را عوض می‌کند.
    - `gateway.remote.token` / `.password` فقط credentialهای remote سمت client هستند؛ به‌تنهایی احراز هویت gateway محلی را فعال نمی‌کنند.

  </Accordion>

  <Accordion title='Control UI می‌گوید "unauthorized" (یا مدام دوباره وصل می‌شود). حالا چه کنم؟'>
    مسیر احراز هویت gateway شما با روش احراز هویت UI مطابقت ندارد.

    واقعیت‌ها (از کد):

    - Control UI توکن را برای نشست فعلی تب مرورگر و URL انتخاب‌شده Gateway در `sessionStorage` نگه می‌دارد، بنابراین refresh همان تب بدون بازگرداندن پایداری توکن بلندمدت در localStorage همچنان کار می‌کند.
    - در `AUTH_TOKEN_MISMATCH`، clientهای مورد اعتماد می‌توانند وقتی gateway راهنمایی‌های retry برمی‌گرداند (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`)، یک retry محدود با device token کش‌شده انجام دهند.
    - آن retry با cached-token اکنون از scopeهای تأییدشده کش‌شده که همراه device token ذخیره شده‌اند دوباره استفاده می‌کند. فراخوان‌های explicit `deviceToken` / explicit `scopes` همچنان به‌جای به ارث بردن scopeهای کش‌شده، مجموعه scope درخواستی خود را حفظ می‌کنند.
    - خارج از آن مسیر retry، اولویت احراز هویت اتصال ابتدا shared token/password صریح، سپس `deviceToken` صریح، سپس device token ذخیره‌شده، و سپس bootstrap token است.
    - بررسی scope برای bootstrap token با پیشوند نقش انجام می‌شود. allowlist داخلی bootstrap operator فقط درخواست‌های operator را برآورده می‌کند؛ node یا نقش‌های غیر-operator دیگر همچنان به scopeهایی زیر پیشوند نقش خودشان نیاز دارند.

    راه‌حل:

    - سریع‌ترین: `openclaw dashboard` (URL داشبورد را چاپ و کپی می‌کند، تلاش می‌کند باز کند؛ اگر headless باشد راهنمای SSH نشان می‌دهد).
    - اگر هنوز token ندارید: `openclaw doctor --generate-gateway-token`.
    - اگر remote است، ابتدا tunnel بزنید: `ssh -N -L 18789:127.0.0.1:18789 user@host` سپس `http://127.0.0.1:18789/` را باز کنید.
    - حالت shared-secret: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` یا `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` را تنظیم کنید، سپس secret مطابق را در تنظیمات Control UI وارد کنید.
    - حالت Tailscale Serve: مطمئن شوید `gateway.auth.allowTailscale` فعال است و URL مربوط به Serve را باز می‌کنید، نه یک URL خام loopback/tailnet که headerهای هویت Tailscale را دور می‌زند.
    - حالت trusted-proxy: مطمئن شوید از طریق پراکسی identity-aware پیکربندی‌شده وارد می‌شوید، نه یک URL خام gateway. پراکسی‌های same-host loopback نیز به `gateway.auth.trustedProxy.allowLoopback = true` نیاز دارند.
    - اگر ناهماهنگی پس از یک retry همچنان باقی ماند، device token جفت‌شده را rotate/دوباره تأیید کنید:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - اگر آن فراخوان rotate گفت رد شده است، دو مورد را بررسی کنید:
      - نشست‌های paired-device فقط می‌توانند device **خودشان** را rotate کنند مگر اینکه `operator.admin` هم داشته باشند
      - مقدارهای صریح `--scope` نمی‌توانند از scopeهای operator فعلی فراخواننده فراتر بروند
    - هنوز گیر کرده‌اید؟ `openclaw status --all` را اجرا کنید و [عیب‌یابی](/fa/gateway/troubleshooting) را دنبال کنید. برای جزئیات احراز هویت، [داشبورد](/fa/web/dashboard) را ببینید.

  </Accordion>

  <Accordion title="gateway.bind را روی tailnet گذاشته‌ام اما نمی‌تواند bind کند و چیزی listen نمی‌کند">
    bind با `tailnet` یک IP مربوط به Tailscale را از interfaceهای شبکه شما انتخاب می‌کند (100.64.0.0/10). اگر ماشین روی Tailscale نباشد (یا interface پایین باشد)، چیزی برای bind وجود ندارد.

    راه‌حل:

    - Tailscale را روی آن میزبان شروع کنید (تا یک نشانی 100.x داشته باشد)، یا
    - به `gateway.bind: "loopback"` / `"lan"` تغییر دهید.

    نکته: `tailnet` صریح است. `auto`، loopback را ترجیح می‌دهد؛ وقتی bind فقط مخصوص tailnet می‌خواهید، از `gateway.bind: "tailnet"` استفاده کنید.

  </Accordion>

  <Accordion title="آیا می‌توانم چند Gateway را روی یک میزبان اجرا کنم؟">
    معمولاً نه - یک Gateway می‌تواند چند کانال پیام‌رسانی و عامل را اجرا کند. فقط وقتی به افزونگی (مثلاً: بات نجات) یا ایزوله‌سازی سخت نیاز دارید از چند Gateway استفاده کنید.

    بله، اما باید ایزوله کنید:

    - `OPENCLAW_CONFIG_PATH` (پیکربندی برای هر نمونه)
    - `OPENCLAW_STATE_DIR` (state برای هر نمونه)
    - `agents.defaults.workspace` (ایزوله‌سازی workspace)
    - `gateway.port` (پورت‌های یکتا)

    راه‌اندازی سریع (پیشنهادی):

    - برای هر نمونه از `openclaw --profile <name> ...` استفاده کنید (به‌صورت خودکار `~/.openclaw-<name>` را می‌سازد).
    - در پیکربندی هر profile یک `gateway.port` یکتا تنظیم کنید (یا برای اجراهای دستی `--port` بدهید).
    - یک سرویس per-profile نصب کنید: `openclaw --profile <name> gateway install`.

    Profileها همچنین پسوندی به نام سرویس‌ها اضافه می‌کنند (`ai.openclaw.<profile>`؛ legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    راهنمای کامل: [چند gateway](/fa/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='عبارت "invalid handshake" / کد 1008 یعنی چه؟'>
    Gateway یک **سرور WebSocket** است، و انتظار دارد نخستین پیام
    یک frame از نوع `connect` باشد. اگر چیز دیگری دریافت کند، اتصال را
    با **کد 1008** (نقض سیاست) می‌بندد.

    علت‌های رایج:

    - شما URL مربوط به **HTTP** را در مرورگر باز کرده‌اید (`http://...`) به‌جای client مربوط به WS.
    - از پورت یا مسیر اشتباه استفاده کرده‌اید.
    - یک پراکسی یا tunnel هدرهای احراز هویت را حذف کرده یا یک درخواست غیر-Gateway فرستاده است.

    راه‌حل‌های سریع:

    1. از URL مربوط به WS استفاده کنید: `ws://<host>:18789` (یا اگر HTTPS است `wss://...`).
    2. پورت WS را در یک تب عادی مرورگر باز نکنید.
    3. اگر احراز هویت فعال است، token/password را در frame مربوط به `connect` قرار دهید.

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
    لاگ‌های فایلی (ساخت‌یافته):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    می‌توانید یک مسیر پایدار را از طریق `logging.file` تنظیم کنید. سطح لاگ فایل با `logging.level` کنترل می‌شود. پرگویی کنسول با `--verbose` و `logging.consoleLevel` کنترل می‌شود.

    سریع‌ترین tail لاگ:

    ```bash
    openclaw logs --follow
    ```

    لاگ‌های سرویس/supervisor (وقتی gateway از طریق launchd/systemd اجرا می‌شود):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` و `gateway.err.log` (پیش‌فرض: `~/.openclaw/logs/...`؛ profileها از `~/.openclaw-<profile>/logs/...` استفاده می‌کنند)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    برای اطلاعات بیشتر [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید.

  </Accordion>

  <Accordion title="چگونه سرویس Gateway را شروع/متوقف/restart کنم؟">
    از helperهای gateway استفاده کنید:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    اگر gateway را دستی اجرا می‌کنید، `openclaw gateway --force` می‌تواند پورت را پس بگیرد. [Gateway](/fa/gateway) را ببینید.

  </Accordion>

  <Accordion title="ترمینالم را در Windows بستم - چگونه OpenClaw را restart کنم؟">
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

    **2) Windows Native (پیشنهاد نمی‌شود):** Gateway مستقیماً در Windows اجرا می‌شود.

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
    با یک health sweep سریع شروع کنید:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    علت‌های رایج:

    - احراز هویت مدل روی **میزبان gateway** بارگذاری نشده است (`models status` را بررسی کنید).
    - pairing/allowlist کانال پاسخ‌ها را مسدود می‌کند (پیکربندی کانال + لاگ‌ها را بررسی کنید).
    - WebChat/Dashboard بدون token درست باز است.

    اگر remote هستید، تأیید کنید اتصال tunnel/Tailscale برقرار است و
    WebSocket مربوط به Gateway قابل دسترسی است.

    مستندات: [کانال‌ها](/fa/channels)، [عیب‌یابی](/fa/gateway/troubleshooting)، [دسترسی remote](/fa/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - حالا چه کنم؟'>
    این معمولاً یعنی UI اتصال WebSocket را از دست داده است. بررسی کنید:

    1. آیا Gateway در حال اجراست؟ `openclaw gateway status`
    2. آیا Gateway سالم است؟ `openclaw status`
    3. آیا UI توکن درست را دارد؟ `openclaw dashboard`
    4. اگر راه‌دور است، آیا پیوند تونل/Tailscale برقرار است؟

    سپس لاگ‌ها را دنبال کنید:

    ```bash
    openclaw logs --follow
    ```

    مستندات: [داشبورد](/fa/web/dashboard)، [دسترسی راه‌دور](/fa/gateway/remote)، [عیب‌یابی](/fa/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands شکست می‌خورد. چه چیزی را باید بررسی کنم؟">
    با لاگ‌ها و وضعیت کانال شروع کنید:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    سپس خطا را تطبیق دهید:

    - `BOT_COMMANDS_TOO_MUCH`: منوی Telegram تعداد ورودی‌های زیادی دارد. OpenClaw از قبل آن را تا حد Telegram کوتاه می‌کند و با فرمان‌های کمتر دوباره تلاش می‌کند، اما هنوز باید بعضی ورودی‌های منو حذف شوند. فرمان‌های Plugin/skill/سفارشی را کاهش دهید، یا اگر به منو نیاز ندارید `channels.telegram.commands.native` را غیرفعال کنید.
    - `TypeError: fetch failed`، `Network request for 'setMyCommands' failed!`، یا خطاهای شبکه‌ای مشابه: اگر روی VPS هستید یا پشت پروکسی قرار دارید، تأیید کنید HTTPS خروجی مجاز است و DNS برای `api.telegram.org` کار می‌کند.

    اگر Gateway راه‌دور است، مطمئن شوید لاگ‌ها را روی میزبان Gateway می‌بینید.

    مستندات: [Telegram](/fa/channels/telegram)، [عیب‌یابی کانال](/fa/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI هیچ خروجی‌ای نشان نمی‌دهد. چه چیزی را باید بررسی کنم؟">
    ابتدا تأیید کنید Gateway در دسترس است و عامل می‌تواند اجرا شود:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    در TUI، از `/status` برای دیدن وضعیت فعلی استفاده کنید. اگر انتظار پاسخ در یک کانال
    چت دارید، مطمئن شوید تحویل فعال است (`/deliver on`).

    مستندات: [TUI](/fa/web/tui)، [فرمان‌های اسلش](/fa/tools/slash-commands).

  </Accordion>

  <Accordion title="چطور Gateway را کامل متوقف و سپس شروع کنم؟">
    اگر سرویس را نصب کرده‌اید:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    این کار **سرویس تحت نظارت** را متوقف/شروع می‌کند (launchd در macOS، systemd در Linux).
    وقتی Gateway به‌صورت daemon در پس‌زمینه اجرا می‌شود، از این روش استفاده کنید.

    اگر در پیش‌زمینه اجرا می‌کنید، با Ctrl-C متوقف کنید، سپس:

    ```bash
    openclaw gateway run
    ```

    مستندات: [راهنمای عملیاتی سرویس Gateway](/fa/gateway).

  </Accordion>

  <Accordion title="توضیح ساده: openclaw gateway restart در برابر openclaw gateway">
    - `openclaw gateway restart`: **سرویس پس‌زمینه** را دوباره راه‌اندازی می‌کند (launchd/systemd).
    - `openclaw gateway`: Gateway را برای این نشست ترمینال **در پیش‌زمینه** اجرا می‌کند.

    اگر سرویس را نصب کرده‌اید، از فرمان‌های gateway استفاده کنید. وقتی
    اجرای یک‌باره در پیش‌زمینه می‌خواهید، از `openclaw gateway` استفاده کنید.

  </Accordion>

  <Accordion title="سریع‌ترین راه برای گرفتن جزئیات بیشتر وقتی چیزی شکست می‌خورد">
    Gateway را با `--verbose` شروع کنید تا جزئیات بیشتری در کنسول بگیرید. سپس فایل لاگ را برای احراز هویت کانال، مسیریابی مدل، و خطاهای RPC بررسی کنید.
  </Accordion>
</AccordionGroup>

## رسانه و پیوست‌ها

<AccordionGroup>
  <Accordion title="skill من یک تصویر/PDF تولید کرد، اما چیزی ارسال نشد">
    پیوست‌های خروجی از عامل باید شامل یک خط `MEDIA:<path-or-url>` باشند (در خط خودش). [راه‌اندازی دستیار OpenClaw](/fa/start/openclaw) و [ارسال عامل](/fa/tools/agent-send) را ببینید.

    ارسال با CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    همچنین بررسی کنید:

    - کانال مقصد از رسانه خروجی پشتیبانی می‌کند و توسط فهرست‌های مجاز مسدود نشده است.
    - فایل در محدوده اندازه ارائه‌دهنده است (تصاویر به حداکثر 2048px تغییر اندازه داده می‌شوند).
    - `tools.fs.workspaceOnly=true` ارسال‌های مسیر محلی را به workspace، temp/media-store، و فایل‌های اعتبارسنجی‌شده توسط sandbox محدود نگه می‌دارد.
    - `tools.fs.workspaceOnly=false` به `MEDIA:` اجازه می‌دهد فایل‌های محلی میزبان را که عامل از قبل می‌تواند بخواند ارسال کند، اما فقط برای رسانه و انواع سند ایمن (تصاویر، صدا، ویدیو، PDF، و اسناد Office). متن ساده و فایل‌های شبیه راز همچنان مسدود می‌شوند.

    [تصاویر](/fa/nodes/images) را ببینید.

  </Accordion>
</AccordionGroup>

## امنیت و کنترل دسترسی

<AccordionGroup>
  <Accordion title="آیا در معرض DMهای ورودی قرار دادن OpenClaw ایمن است؟">
    DMهای ورودی را ورودی نامطمئن در نظر بگیرید. پیش‌فرض‌ها برای کاهش ریسک طراحی شده‌اند:

    - رفتار پیش‌فرض در کانال‌های دارای قابلیت DM، **جفت‌سازی** است:
      - فرستنده‌های ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ ربات پیام آن‌ها را پردازش نمی‌کند.
      - تأیید با: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - درخواست‌های در انتظار به **3 عدد برای هر کانال** محدود می‌شوند؛ اگر کدی نرسید، `openclaw pairing list --channel <channel> [--account <id>]` را بررسی کنید.
    - باز کردن DMها به‌صورت عمومی به انتخاب صریح نیاز دارد (`dmPolicy: "open"` و فهرست مجاز `"*"`).

    برای آشکار کردن سیاست‌های پرریسک DM، `openclaw doctor` را اجرا کنید.

  </Accordion>

  <Accordion title="آیا تزریق پرامپت فقط برای ربات‌های عمومی نگران‌کننده است؟">
    نه. تزریق پرامپت درباره **محتوای نامطمئن** است، نه فقط اینکه چه کسی می‌تواند به ربات DM بدهد.
    اگر دستیار شما محتوای خارجی می‌خواند (جست‌وجو/واکشی وب، صفحه‌های مرورگر، ایمیل‌ها،
    مستندات، پیوست‌ها، لاگ‌های چسبانده‌شده)، آن محتوا می‌تواند شامل دستورهایی باشد که سعی می‌کنند
    مدل را منحرف کنند. این حتی اگر **شما تنها فرستنده باشید** هم می‌تواند رخ دهد.

    بزرگ‌ترین ریسک زمانی است که ابزارها فعال باشند: مدل می‌تواند فریب بخورد تا
    context را برون‌ریزی کند یا از طرف شما ابزارها را فراخوانی کند. دامنه اثر را این‌گونه کاهش دهید:

    - استفاده از یک عامل «خواننده» فقط‌خواندنی یا بدون ابزار برای خلاصه‌سازی محتوای نامطمئن
    - خاموش نگه داشتن `web_search` / `web_fetch` / `browser` برای عامل‌های دارای ابزار
    - متن فایل/سند رمزگشایی‌شده را نیز نامطمئن در نظر گرفتن: OpenResponses
      `input_file` و استخراج پیوست رسانه‌ای هر دو متن استخراج‌شده را
      به‌جای عبور دادن متن خام فایل، در نشانگرهای صریح مرز محتوای خارجی می‌پیچند
    - sandboxing و فهرست‌های مجاز سخت‌گیرانه برای ابزارها

    جزئیات: [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="آیا ربات من باید ایمیل، حساب GitHub، یا شماره تلفن خودش را داشته باشد؟">
    بله، برای بیشتر راه‌اندازی‌ها. جدا کردن ربات با حساب‌ها و شماره تلفن‌های جداگانه
    دامنه اثر را در صورت بروز مشکل کاهش می‌دهد. این همچنین چرخاندن
    اعتبارنامه‌ها یا لغو دسترسی را بدون اثر گذاشتن روی حساب‌های شخصی شما آسان‌تر می‌کند.

    کوچک شروع کنید. فقط به ابزارها و حساب‌هایی که واقعاً نیاز دارید دسترسی بدهید، و
    بعداً در صورت نیاز گسترش دهید.

    مستندات: [امنیت](/fa/gateway/security)، [جفت‌سازی](/fa/channels/pairing).

  </Accordion>

  <Accordion title="آیا می‌توانم به آن روی پیام‌های متنی‌ام خودمختاری بدهم و آیا این ایمن است؟">
    ما خودمختاری کامل روی پیام‌های شخصی شما را توصیه **نمی‌کنیم**. ایمن‌ترین الگو این است:

    - DMها را در **حالت جفت‌سازی** یا یک فهرست مجاز محدود نگه دارید.
    - اگر می‌خواهید از طرف شما پیام بدهد، از یک **شماره یا حساب جداگانه** استفاده کنید.
    - اجازه دهید پیش‌نویس کند، سپس **پیش از ارسال تأیید کنید**.

    اگر می‌خواهید آزمایش کنید، این کار را روی یک حساب اختصاصی انجام دهید و آن را جدا نگه دارید. ببینید
    [امنیت](/fa/gateway/security).

  </Accordion>

  <Accordion title="آیا می‌توانم برای وظایف دستیار شخصی از مدل‌های ارزان‌تر استفاده کنم؟">
    بله، **اگر** عامل فقط چت می‌کند و ورودی مورد اعتماد است. رده‌های کوچک‌تر
    در برابر ربایش دستور آسیب‌پذیرترند، پس برای عامل‌های دارای ابزار
    یا هنگام خواندن محتوای نامطمئن از آن‌ها پرهیز کنید. اگر ناچارید از یک مدل کوچک‌تر استفاده کنید، ابزارها را محدود کنید
    و داخل sandbox اجرا کنید. [امنیت](/fa/gateway/security) را ببینید.
  </Accordion>

  <Accordion title="در Telegram، /start را اجرا کردم اما کد جفت‌سازی نگرفتم">
    کدهای جفت‌سازی **فقط** وقتی ارسال می‌شوند که یک فرستنده ناشناس به ربات پیام بدهد و
    `dmPolicy: "pairing"` فعال باشد. `/start` به‌تنهایی کد تولید نمی‌کند.

    درخواست‌های در انتظار را بررسی کنید:

    ```bash
    openclaw pairing list telegram
    ```

    اگر دسترسی فوری می‌خواهید، sender id خود را در فهرست مجاز بگذارید یا برای آن حساب `dmPolicy: "open"`
    تنظیم کنید.

  </Accordion>

  <Accordion title="WhatsApp: آیا به مخاطبان من پیام می‌دهد؟ جفت‌سازی چطور کار می‌کند؟">
    نه. سیاست پیش‌فرض DM در WhatsApp، **جفت‌سازی** است. فرستنده‌های ناشناس فقط یک کد جفت‌سازی می‌گیرند و پیامشان **پردازش نمی‌شود**. OpenClaw فقط به چت‌هایی پاسخ می‌دهد که دریافت می‌کند یا به ارسال‌های صریحی که شما آغاز می‌کنید.

    جفت‌سازی را با این فرمان تأیید کنید:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    درخواست‌های در انتظار را فهرست کنید:

    ```bash
    openclaw pairing list whatsapp
    ```

    درخواست شماره تلفن در ویزارد: برای تنظیم **فهرست مجاز/مالک** شما استفاده می‌شود تا DMهای خودتان مجاز باشند. برای ارسال خودکار استفاده نمی‌شود. اگر روی شماره شخصی WhatsApp خود اجرا می‌کنید، از همان شماره استفاده کنید و `channels.whatsapp.selfChatMode` را فعال کنید.

  </Accordion>
</AccordionGroup>

## فرمان‌های چت، لغو وظایف، و «متوقف نمی‌شود»

<AccordionGroup>
  <Accordion title="چطور جلوی نمایش پیام‌های داخلی سیستم در چت را بگیرم؟">
    بیشتر پیام‌های داخلی یا ابزاری فقط وقتی ظاهر می‌شوند که **verbose**، **trace**، یا **reasoning** برای آن نشست فعال باشد.

    در همان چتی که آن را می‌بینید اصلاح کنید:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    اگر هنوز پر سر و صداست، تنظیمات نشست را در Control UI بررسی کنید و verbose
    را روی **inherit** بگذارید. همچنین تأیید کنید از پروفایل رباتی استفاده نمی‌کنید که `verboseDefault` در config روی
    `on` تنظیم شده باشد.

    مستندات: [تفکر و verbose](/fa/tools/thinking)، [امنیت](/fa/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="چطور یک وظیفه در حال اجرا را متوقف/لغو کنم؟">
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

    این‌ها محرک‌های لغو هستند (نه فرمان‌های اسلش).

    برای فرایندهای پس‌زمینه (از ابزار exec)، می‌توانید از عامل بخواهید اجرا کند:

    ```
    process action:kill sessionId:XXX
    ```

    نمای کلی فرمان‌های اسلش: [فرمان‌های اسلش](/fa/tools/slash-commands) را ببینید.

    بیشتر فرمان‌ها باید به‌عنوان یک پیام **مستقل** که با `/` شروع می‌شود ارسال شوند، اما چند میان‌بر (مثل `/status`) برای فرستنده‌های موجود در فهرست مجاز به‌صورت درون‌خطی هم کار می‌کنند.

  </Accordion>

  <Accordion title='چطور از Telegram یک پیام Discord بفرستم؟ ("Cross-context messaging denied")'>
    OpenClaw به‌طور پیش‌فرض پیام‌رسانی **بین ارائه‌دهنده‌ها** را مسدود می‌کند. اگر فراخوانی ابزار به
    Telegram مقید باشد، به Discord ارسال نمی‌کند مگر اینکه صریحاً اجازه دهید.

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

    پس از ویرایش config، Gateway را دوباره راه‌اندازی کنید.

  </Accordion>

  <Accordion title='چرا به نظر می‌رسد ربات پیام‌های پشت‌سرهم را «نادیده» می‌گیرد؟'>
    حالت صف کنترل می‌کند پیام‌های جدید چگونه با اجرای در حال انجام تعامل کنند. برای تغییر حالت‌ها از `/queue` استفاده کنید:

    - `steer` - همه هدایت‌های در انتظار را برای مرز مدل بعدی در اجرای فعلی صف می‌کند
    - `queue` - هدایت قدیمی یکی‌درمیان
    - `followup` - پیام‌ها را یکی‌یکی اجرا می‌کند
    - `collect` - پیام‌ها را دسته‌بندی می‌کند و یک‌بار پاسخ می‌دهد
    - `steer-backlog` - اکنون هدایت می‌کند، سپس backlog را پردازش می‌کند
    - `interrupt` - اجرای فعلی را لغو می‌کند و از نو شروع می‌کند

    حالت پیش‌فرض `steer` است. برای حالت‌های followup می‌توانید گزینه‌هایی مثل `debounce:0.5s cap:25 drop:summarize` اضافه کنید. [صف فرمان](/fa/concepts/queue) و [صف هدایت](/fa/concepts/queue-steering) را ببینید.

  </Accordion>
</AccordionGroup>

## متفرقه

<AccordionGroup>
  <Accordion title='مدل پیش‌فرض Anthropic با کلید API چیست؟'>
    در OpenClaw، اطلاعات احراز هویت و انتخاب مدل از هم جدا هستند. تنظیم `ANTHROPIC_API_KEY` (یا ذخیره کردن کلید API مربوط به Anthropic در پروفایل‌های احراز هویت) احراز هویت را فعال می‌کند، اما مدل پیش‌فرض واقعی همان چیزی است که در `agents.defaults.model.primary` پیکربندی می‌کنید (برای مثال، `anthropic/claude-sonnet-4-6` یا `anthropic/claude-opus-4-6`). اگر `No credentials found for profile "anthropic:default"` را می‌بینید، یعنی Gateway نتوانسته اطلاعات احراز هویت Anthropic را در `auth-profiles.json` مورد انتظار برای عاملی که در حال اجراست پیدا کند.
  </Accordion>
</AccordionGroup>

---

هنوز مشکل دارید؟ در [Discord](https://discord.com/invite/clawd) بپرسید یا یک [گفت‌وگوی GitHub](https://github.com/openclaw/openclaw/discussions) باز کنید.

## مرتبط

- [سؤالات متداول اجرای نخست](/fa/help/faq-first-run) — نصب، راه‌اندازی اولیه، احراز هویت، اشتراک‌ها، خطاهای اولیه
- [سؤالات متداول مدل‌ها](/fa/help/faq-models) — انتخاب مدل، جایگزینی در صورت خرابی، پروفایل‌های احراز هویت
- [عیب‌یابی](/fa/help/troubleshooting) — بررسی بر اساس نشانه‌ها
