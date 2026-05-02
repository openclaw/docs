---
read_when:
    - نصب جدید، گیر کردن راه‌اندازی اولیه، یا خطاهای اجرای نخست
    - انتخاب احراز هویت و اشتراک‌های ارائه‌دهنده
    - نمی‌توان به docs.openclaw.ai دسترسی پیدا کرد، نمی‌توان داشبورد را باز کرد، نصب گیر کرده است
sidebarTitle: First-run FAQ
summary: 'پرسش‌های متداول: راه‌اندازی سریع و تنظیمات اجرای نخست — نصب، آغاز به کار، احراز هویت، اشتراک‌ها، خطاهای اولیه'
title: 'سؤالات متداول: راه‌اندازی اولیه'
x-i18n:
    generated_at: "2026-05-02T11:49:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 469fbd24fea69d91c5b0408dff9c7d7b2382f9c59430a1d5331cb5dcabdce295
    source_path: help/faq-first-run.md
    workflow: 16
---

  شروع سریع و پرسش‌وپاسخ اجرای نخست. برای عملیات روزمره، مدل‌ها، احراز هویت، جلسه‌ها،
  و عیب‌یابی، [پرسش‌های متداول](/fa/help/faq) اصلی را ببینید.

  ## شروع سریع و راه‌اندازی اجرای نخست

  <AccordionGroup>
  <Accordion title="I am stuck, fastest way to get unstuck">
    از یک عامل هوش مصنوعی محلی استفاده کنید که بتواند **دستگاه شما را ببیند**. این روش بسیار مؤثرتر از پرسیدن
    در Discord است، چون بیشتر موارد «گیر کرده‌ام» **مشکلات پیکربندی یا محیط محلی** هستند که
    کمک‌کننده‌های راه دور نمی‌توانند بررسی کنند.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    این ابزارها می‌توانند مخزن را بخوانند، فرمان‌ها را اجرا کنند، لاگ‌ها را بررسی کنند، و به رفع راه‌اندازی
    سطح دستگاه شما کمک کنند (PATH، سرویس‌ها، مجوزها، فایل‌های احراز هویت). با نصب قابل‌هک (git)،
    **checkout کامل منبع** را در اختیارشان بگذارید:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    این کار OpenClaw را **از یک git checkout** نصب می‌کند، بنابراین عامل می‌تواند کد + مستندات را بخواند و
    درباره نسخه دقیقی که اجرا می‌کنید استدلال کند. همیشه می‌توانید بعداً با اجرای دوباره نصب‌کننده بدون
    `--install-method git` به نسخه پایدار برگردید.

    نکته: از عامل بخواهید رفع مشکل را **برنامه‌ریزی و نظارت** کند (گام‌به‌گام)، سپس فقط
    فرمان‌های لازم را اجرا کند. این کار تغییرات را کوچک و بازبینی‌شان را آسان‌تر نگه می‌دارد.

    اگر یک اشکال یا رفع واقعی پیدا کردید، لطفاً یک issue در GitHub ثبت کنید یا یک PR بفرستید:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    با این فرمان‌ها شروع کنید (هنگام درخواست کمک، خروجی‌ها را به اشتراک بگذارید):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    کارکرد آن‌ها:

    - `openclaw status`: نمای سریع از سلامت gateway/agent + پیکربندی پایه.
    - `openclaw models status`: احراز هویت ارائه‌دهنده + دسترس‌پذیری مدل را بررسی می‌کند.
    - `openclaw doctor`: مشکلات رایج پیکربندی/وضعیت را اعتبارسنجی و تعمیر می‌کند.

    بررسی‌های CLI مفید دیگر: `openclaw status --all`، `openclaw logs --follow`،
    `openclaw gateway status`، `openclaw health --verbose`.

    چرخه سریع اشکال‌زدایی: [۶۰ ثانیه نخست اگر چیزی خراب است](#first-60-seconds-if-something-is-broken).
    مستندات نصب: [نصب](/fa/install)، [پرچم‌های نصب‌کننده](/fa/install/installer)، [به‌روزرسانی](/fa/install/updating).

  </Accordion>

  <Accordion title="Heartbeat keeps skipping. What do the skip reasons mean?">
    دلیل‌های رایج رد شدن Heartbeat:

    - `quiet-hours`: خارج از بازه active-hours پیکربندی‌شده
    - `empty-heartbeat-file`: `HEARTBEAT.md` وجود دارد اما فقط داربست خالی/فقط‌سربرگ دارد
    - `no-tasks-due`: حالت وظیفه `HEARTBEAT.md` فعال است اما هنوز زمان هیچ‌کدام از بازه‌های وظیفه نرسیده است
    - `alerts-disabled`: همه نمایش‌پذیری Heartbeat غیرفعال است (`showOk`، `showAlerts`، و `useIndicator` همگی خاموش‌اند)

    در حالت وظیفه، زمان‌های سررسید فقط پس از کامل شدن یک اجرای Heartbeat واقعی
    جلو برده می‌شوند. اجراهای ردشده وظیفه‌ها را تکمیل‌شده علامت نمی‌زنند.

    مستندات: [Heartbeat](/fa/gateway/heartbeat)، [اتوماسیون و وظیفه‌ها](/fa/automation).

  </Accordion>

  <Accordion title="Recommended way to install and set up OpenClaw">
    مخزن اجرای از منبع و استفاده از onboarding را توصیه می‌کند:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    جادوگر همچنین می‌تواند دارایی‌های UI را به‌صورت خودکار بسازد. پس از onboarding، معمولاً Gateway را روی پورت **18789** اجرا می‌کنید.

    از منبع (مشارکت‌کنندگان/توسعه):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    اگر هنوز نصب سراسری ندارید، آن را از طریق `pnpm openclaw onboard` اجرا کنید.

  </Accordion>

  <Accordion title="How do I open the dashboard after onboarding?">
    جادوگر درست پس از onboarding مرورگر شما را با یک URL تمیز (بدون توکن) برای داشبورد باز می‌کند و همچنین لینک را در خلاصه چاپ می‌کند. آن زبانه را باز نگه دارید؛ اگر اجرا نشد، URL چاپ‌شده را روی همان دستگاه کپی/جای‌گذاری کنید.
  </Accordion>

  <Accordion title="How do I authenticate the dashboard on localhost vs remote?">
    **Localhost (همان دستگاه):**

    - `http://127.0.0.1:18789/` را باز کنید.
    - اگر احراز هویت shared-secret خواست، توکن یا گذرواژه پیکربندی‌شده را در تنظیمات Control UI جای‌گذاری کنید.
    - منبع توکن: `gateway.auth.token` (یا `OPENCLAW_GATEWAY_TOKEN`).
    - منبع گذرواژه: `gateway.auth.password` (یا `OPENCLAW_GATEWAY_PASSWORD`).
    - اگر هنوز shared secret پیکربندی نشده است، با `openclaw doctor --generate-gateway-token` یک توکن بسازید.

    **نه روی localhost:**

    - **Tailscale Serve** (توصیه‌شده): bind را روی loopback نگه دارید، `openclaw gateway --tailscale serve` را اجرا کنید، `https://<magicdns>/` را باز کنید. اگر `gateway.auth.allowTailscale` برابر `true` باشد، سربرگ‌های هویت، احراز هویت Control UI/WebSocket را برآورده می‌کنند (بدون shared secret جای‌گذاری‌شده، با فرض میزبان Gateway مورد اعتماد)؛ APIهای HTTP همچنان به احراز هویت shared-secret نیاز دارند مگر اینکه عمداً از private-ingress `none` یا احراز هویت HTTP با trusted-proxy استفاده کنید.
      تلاش‌های هم‌زمان ناموفق برای احراز هویت Serve از همان کلاینت پیش از ثبت در محدودکننده احراز هویت ناموفق سریالی می‌شوند، بنابراین تلاش ناموفق دوم می‌تواند از قبل `retry later` را نشان دهد.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` را اجرا کنید (یا احراز هویت گذرواژه را پیکربندی کنید)، `http://<tailscale-ip>:18789/` را باز کنید، سپس shared secret مطابق را در تنظیمات داشبورد جای‌گذاری کنید.
    - **reverse proxy آگاه از هویت**: Gateway را پشت یک proxy مورد اعتماد نگه دارید، `gateway.auth.mode: "trusted-proxy"` را پیکربندی کنید، سپس URL proxy را باز کنید. proxyهای loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند.
    - **تونل SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` سپس `http://127.0.0.1:18789/` را باز کنید. احراز هویت shared-secret همچنان روی تونل اعمال می‌شود؛ اگر درخواست شد، توکن یا گذرواژه پیکربندی‌شده را جای‌گذاری کنید.

    برای حالت‌های bind و جزئیات احراز هویت، [داشبورد](/fa/web/dashboard) و [سطوح وب](/fa/web) را ببینید.

  </Accordion>

  <Accordion title="Why are there two exec approval configs for chat approvals?">
    آن‌ها لایه‌های متفاوتی را کنترل می‌کنند:

    - `approvals.exec`: درخواست‌های تأیید را به مقصدهای چت ارسال می‌کند
    - `channels.<channel>.execApprovals`: آن کانال را به یک کلاینت تأیید بومی برای تأییدهای exec تبدیل می‌کند

    سیاست exec میزبان همچنان دروازه تأیید واقعی است. پیکربندی چت فقط کنترل می‌کند درخواست‌های
    تأیید کجا ظاهر شوند و افراد چگونه بتوانند به آن‌ها پاسخ دهند.

    در بیشتر راه‌اندازی‌ها به **هر دو** نیاز ندارید:

    - اگر چت از قبل از فرمان‌ها و پاسخ‌ها پشتیبانی می‌کند، `/approve` در همان چت از مسیر مشترک کار می‌کند.
    - اگر یک کانال بومی پشتیبانی‌شده بتواند تأییدکنندگان را ایمن استنباط کند، OpenClaw اکنون وقتی `channels.<channel>.execApprovals.enabled` تنظیم نشده یا `"auto"` است، تأییدهای بومی DM-first را خودکار فعال می‌کند.
    - وقتی کارت‌ها/دکمه‌های تأیید بومی در دسترس‌اند، آن UI بومی مسیر اصلی است؛ عامل فقط زمانی باید یک فرمان دستی `/approve` اضافه کند که نتیجه ابزار بگوید تأییدهای چت در دسترس نیستند یا تأیید دستی تنها مسیر است.
    - از `approvals.exec` فقط زمانی استفاده کنید که درخواست‌ها باید به چت‌های دیگر یا اتاق‌های عملیاتی صریح نیز ارسال شوند.
    - از `channels.<channel>.execApprovals.target: "channel"` یا `"both"` فقط زمانی استفاده کنید که صریحاً می‌خواهید درخواست‌های تأیید دوباره در اتاق/موضوع مبدأ پست شوند.
    - تأییدهای Plugin دوباره جدا هستند: به‌طور پیش‌فرض از `/approve` در همان چت، ارسال اختیاری `approvals.plugin`، و فقط در برخی کانال‌های بومی، مدیریت بومی تأیید Plugin در کنار آن استفاده می‌کنند.

    نسخه کوتاه: ارسال برای مسیریابی است، پیکربندی کلاینت بومی برای UX غنی‌تر مخصوص کانال است.
    [تأییدهای Exec](/fa/tools/exec-approvals) را ببینید.

  </Accordion>

  <Accordion title="What runtime do I need?">
    Node **>= 22** لازم است. `pnpm` توصیه می‌شود. Bun برای Gateway **توصیه نمی‌شود**.
  </Accordion>

  <Accordion title="Does it run on Raspberry Pi?">
    بله. Gateway سبک است - مستندات **512MB-1GB RAM**، **1 core**، و حدود **500MB**
    دیسک را برای استفاده شخصی کافی می‌دانند و اشاره می‌کنند که **Raspberry Pi 4 می‌تواند آن را اجرا کند**.

    اگر فضای تنفس بیشتری می‌خواهید (لاگ‌ها، رسانه، سرویس‌های دیگر)، **2GB توصیه می‌شود**، اما
    حداقل سخت‌گیرانه نیست.

    نکته: یک Pi/VPS کوچک می‌تواند میزبان Gateway باشد، و می‌توانید **nodes** را روی لپ‌تاپ/تلفن خود برای
    صفحه/دوربین/canvas محلی یا اجرای فرمان جفت کنید. [Nodes](/fa/nodes) را ببینید.

  </Accordion>

  <Accordion title="Any tips for Raspberry Pi installs?">
    نسخه کوتاه: کار می‌کند، اما انتظار ناهمواری داشته باشید.

    - از یک OS **64-bit** استفاده کنید و Node >= 22 را نگه دارید.
    - نصب **قابل‌هک (git)** را ترجیح دهید تا بتوانید لاگ‌ها را ببینید و سریع به‌روزرسانی کنید.
    - بدون کانال‌ها/skills شروع کنید، سپس آن‌ها را یکی‌یکی اضافه کنید.
    - اگر به مشکلات عجیب دودویی برخوردید، معمولاً مشکل **سازگاری ARM** است.

    مستندات: [Linux](/fa/platforms/linux)، [نصب](/fa/install).

  </Accordion>

  <Accordion title="It is stuck on wake up my friend / onboarding will not hatch. What now?">
    آن صفحه به دردسترس بودن و احراز هویت Gateway وابسته است. TUI همچنین
    «Wake up, my friend!» را به‌طور خودکار در نخستین hatch می‌فرستد. اگر آن خط را با **بدون پاسخ**
    می‌بینید و توکن‌ها روی 0 می‌مانند، عامل هرگز اجرا نشده است.

    1. Gateway را بازراه‌اندازی کنید:

    ```bash
    openclaw gateway restart
    ```

    2. وضعیت + احراز هویت را بررسی کنید:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. اگر هنوز گیر می‌کند، اجرا کنید:

    ```bash
    openclaw doctor
    ```

    اگر Gateway راه دور است، مطمئن شوید تونل/اتصال Tailscale برقرار است و UI
    به Gateway درست اشاره می‌کند. [دسترسی راه دور](/fa/gateway/remote) را ببینید.

  </Accordion>

  <Accordion title="Can I migrate my setup to a new machine (Mac mini) without redoing onboarding?">
    بله. **دایرکتوری وضعیت** و **workspace** را کپی کنید، سپس یک‌بار Doctor را اجرا کنید. این کار
    bot شما را «دقیقاً همان» نگه می‌دارد (حافظه، تاریخچه جلسه، احراز هویت، و وضعیت کانال)
    به شرطی که **هر دو** مکان را کپی کنید:

    1. OpenClaw را روی دستگاه جدید نصب کنید.
    2. `$OPENCLAW_STATE_DIR` (پیش‌فرض: `~/.openclaw`) را از دستگاه قدیمی کپی کنید.
    3. workspace خود را کپی کنید (پیش‌فرض: `~/.openclaw/workspace`).
    4. `openclaw doctor` را اجرا کنید و سرویس Gateway را بازراه‌اندازی کنید.

    این کار پیکربندی، پروفایل‌های احراز هویت، اعتبارنامه‌های WhatsApp، جلسه‌ها، و حافظه را حفظ می‌کند. اگر در
    حالت راه دور هستید، به یاد داشته باشید میزبان gateway مالک session store و workspace است.

    **مهم:** اگر فقط workspace خود را به GitHub commit/push کنید، دارید از
    **حافظه + فایل‌های bootstrap** پشتیبان می‌گیرید، اما **نه** تاریخچه جلسه یا احراز هویت را. آن‌ها
    زیر `~/.openclaw/` هستند (برای مثال `~/.openclaw/agents/<agentId>/sessions/`).

    مرتبط: [مهاجرت](/fa/install/migrating)، [چیزها کجای دیسک قرار دارند](#where-things-live-on-disk)،
    [workspace عامل](/fa/concepts/agent-workspace)، [Doctor](/fa/gateway/doctor)،
    [حالت راه دور](/fa/gateway/remote).

  </Accordion>

  <Accordion title="Where do I see what is new in the latest version?">
    changelog در GitHub را بررسی کنید:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    جدیدترین ورودی‌ها در بالا هستند. اگر بخش بالایی با **Unreleased** علامت‌گذاری شده باشد، بخش تاریخ‌دار بعدی
    آخرین نسخه منتشرشده است. ورودی‌ها بر اساس **برجسته‌ها**، **تغییرات**، و
    **رفع‌ها** گروه‌بندی می‌شوند (به‌علاوه بخش‌های مستندات/دیگر در صورت نیاز).

  </Accordion>

  <Accordion title="Cannot access docs.openclaw.ai (SSL error)">
    برخی اتصال‌های Comcast/Xfinity به‌اشتباه `docs.openclaw.ai` را از طریق Xfinity
    Advanced Security مسدود می‌کنند. آن را غیرفعال کنید یا `docs.openclaw.ai` را در allowlist بگذارید، سپس دوباره تلاش کنید.
    لطفاً با گزارش در اینجا به رفع مسدودی کمک کنید: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    اگر هنوز نمی‌توانید به سایت برسید، مستندات روی GitHub آینه شده‌اند:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="تفاوت بین پایدار و بتا">
    **پایدار** و **بتا**، **برچسب‌های توزیع npm** هستند، نه خط‌های کد جداگانه:

    - `latest` = پایدار
    - `beta` = ساخت اولیه برای آزمایش

    معمولاً یک انتشار پایدار ابتدا روی **بتا** قرار می‌گیرد، سپس یک مرحله
    ارتقای صریح همان نسخه را به `latest` منتقل می‌کند. نگه‌دارندگان همچنین می‌توانند
    در صورت نیاز مستقیماً به `latest` منتشر کنند. به همین دلیل بتا و پایدار ممکن است
    پس از ارتقا به **همان نسخه** اشاره کنند.

    ببینید چه چیزهایی تغییر کرده است:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    برای دستورهای نصب یک‌خطی و تفاوت بین بتا و dev، آکاردئون زیر را ببینید.

  </Accordion>

  <Accordion title="چگونه نسخه بتا را نصب کنم و تفاوت بین بتا و dev چیست؟">
    **بتا** همان برچسب توزیع npm یعنی `beta` است (ممکن است پس از ارتقا با `latest` یکی باشد).
    **Dev** سر متحرک `main` (git) است؛ وقتی منتشر شود، از برچسب توزیع npm یعنی `dev` استفاده می‌کند.

    دستورهای یک‌خطی (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    نصب‌کننده Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    جزئیات بیشتر: [کانال‌های توسعه](/fa/install/development-channels) و [پرچم‌های نصب‌کننده](/fa/install/installer).

  </Accordion>

  <Accordion title="چگونه آخرین بیت‌ها را امتحان کنم؟">
    دو گزینه:

    1. **کانال Dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    این دستور به شاخه `main` تغییر می‌دهد و از منبع به‌روزرسانی می‌کند.

    2. **نصب قابل هک (از سایت نصب‌کننده):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    این کار یک مخزن محلی به شما می‌دهد که می‌توانید ویرایشش کنید، سپس از طریق git به‌روزرسانی کنید.

    اگر ترجیح می‌دهید به‌صورت دستی یک clone تمیز داشته باشید، استفاده کنید از:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    مستندات: [به‌روزرسانی](/fa/cli/update)، [کانال‌های توسعه](/fa/install/development-channels)،
    [نصب](/fa/install).

  </Accordion>

  <Accordion title="نصب و راه‌اندازی اولیه معمولاً چقدر طول می‌کشد؟">
    راهنمای تقریبی:

    - **نصب:** ۲ تا ۵ دقیقه
    - **راه‌اندازی اولیه:** ۵ تا ۱۵ دقیقه، بسته به تعداد کانال‌ها/مدل‌هایی که پیکربندی می‌کنید

    اگر گیر کرد، از [نصب‌کننده گیر کرده است](#quick-start-and-first-run-setup)
    و چرخه سریع اشکال‌زدایی در [گیر کرده‌ام](#quick-start-and-first-run-setup) استفاده کنید.

  </Accordion>

  <Accordion title="نصب‌کننده گیر کرده است؟ چگونه بازخورد بیشتری بگیرم؟">
    نصب‌کننده را با **خروجی پرجزئیات** دوباره اجرا کنید:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    نصب بتا با خروجی پرجزئیات:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    برای نصب قابل هک (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    معادل Windows (PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    گزینه‌های بیشتر: [پرچم‌های نصب‌کننده](/fa/install/installer).

  </Accordion>

  <Accordion title="نصب Windows می‌گوید git پیدا نشد یا openclaw شناخته نمی‌شود">
    دو مشکل رایج Windows:

    **۱) خطای npm با spawn git / پیدا نشدن git**

    - **Git for Windows** را نصب کنید و مطمئن شوید `git` در PATH شما قرار دارد.
    - PowerShell را ببندید و دوباره باز کنید، سپس نصب‌کننده را دوباره اجرا کنید.

    **۲) پس از نصب، openclaw شناخته نمی‌شود**

    - پوشه bin سراسری npm شما در PATH نیست.
    - مسیر را بررسی کنید:

      ```powershell
      npm config get prefix
      ```

    - آن دایرکتوری را به PATH کاربر خود اضافه کنید (در Windows پسوند `\bin` لازم نیست؛ در بیشتر سیستم‌ها `%AppData%\npm` است).
    - پس از به‌روزرسانی PATH، PowerShell را ببندید و دوباره باز کنید.

    اگر روان‌ترین راه‌اندازی Windows را می‌خواهید، به‌جای Windows بومی از **WSL2** استفاده کنید.
    مستندات: [Windows](/fa/platforms/windows).

  </Accordion>

  <Accordion title="خروجی exec در Windows متن چینی به‌هم‌ریخته نشان می‌دهد - چه کنم؟">
    این معمولاً ناسازگاری code page کنسول در shellهای بومی Windows است.

    نشانه‌ها:

    - خروجی `system.run`/`exec` چینی را به‌صورت mojibake نمایش می‌دهد
    - همان دستور در یک پروفایل ترمینال دیگر درست دیده می‌شود

    راهکار سریع در PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    سپس Gateway را بازراه‌اندازی کنید و دستور خود را دوباره امتحان کنید:

    ```powershell
    openclaw gateway restart
    ```

    اگر همچنان این مشکل را در آخرین نسخه OpenClaw بازتولید می‌کنید، آن را اینجا پیگیری/گزارش کنید:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="مستندات به پرسش من پاسخ نداد - چگونه پاسخ بهتری بگیرم؟">
    از **نصب قابل هک (git)** استفاده کنید تا کل منبع و مستندات را به‌صورت محلی داشته باشید، سپس
    از ربات خود (یا Claude/Codex) _از همان پوشه_ بپرسید تا بتواند مخزن را بخواند و دقیق پاسخ دهد.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    جزئیات بیشتر: [نصب](/fa/install) و [پرچم‌های نصب‌کننده](/fa/install/installer).

  </Accordion>

  <Accordion title="چگونه OpenClaw را روی Linux نصب کنم؟">
    پاسخ کوتاه: راهنمای Linux را دنبال کنید، سپس راه‌اندازی اولیه را اجرا کنید.

    - مسیر سریع Linux + نصب سرویس: [Linux](/fa/platforms/linux).
    - راهنمای کامل مرحله‌به‌مرحله: [شروع به کار](/fa/start/getting-started).
    - نصب‌کننده + به‌روزرسانی‌ها: [نصب و به‌روزرسانی‌ها](/fa/install/updating).

  </Accordion>

  <Accordion title="چگونه OpenClaw را روی VPS نصب کنم؟">
    هر VPS لینوکسی کار می‌کند. روی سرور نصب کنید، سپس از SSH/Tailscale برای دسترسی به Gateway استفاده کنید.

    راهنماها: [exe.dev](/fa/install/exe-dev)، [Hetzner](/fa/install/hetzner)، [Fly.io](/fa/install/fly).
    دسترسی از راه دور: [Gateway از راه دور](/fa/gateway/remote).

  </Accordion>

  <Accordion title="راهنماهای نصب cloud/VPS کجا هستند؟">
    ما یک **هاب میزبانی** با ارائه‌دهندگان رایج نگه می‌داریم. یکی را انتخاب کنید و راهنما را دنبال کنید:

    - [میزبانی VPS](/fa/vps) (همه ارائه‌دهندگان در یک مکان)
    - [Fly.io](/fa/install/fly)
    - [Hetzner](/fa/install/hetzner)
    - [exe.dev](/fa/install/exe-dev)

    نحوه کار آن در cloud: **Gateway روی سرور اجرا می‌شود** و شما از لپ‌تاپ/گوشی خود
    از طریق Control UI (یا Tailscale/SSH) به آن دسترسی دارید. وضعیت + workspace شما
    روی سرور قرار دارد، پس میزبان را منبع حقیقت بدانید و از آن نسخه پشتیبان بگیرید.

    می‌توانید **nodeها** (Mac/iOS/Android/headless) را به آن Gateway ابری جفت کنید تا به
    صفحه/دوربین/canvas محلی دسترسی داشته باشید یا در حالی که
    Gateway در cloud می‌ماند، روی لپ‌تاپ خود دستور اجرا کنید.

    هاب: [پلتفرم‌ها](/fa/platforms). دسترسی از راه دور: [Gateway از راه دور](/fa/gateway/remote).
    Nodeها: [Nodeها](/fa/nodes)، [CLI Nodeها](/fa/cli/nodes).

  </Accordion>

  <Accordion title="آیا می‌توانم از OpenClaw بخواهم خودش را به‌روزرسانی کند؟">
    پاسخ کوتاه: **ممکن است، توصیه نمی‌شود**. جریان به‌روزرسانی می‌تواند
    Gateway را بازراه‌اندازی کند (که نشست فعال را قطع می‌کند)، ممکن است به git checkout تمیز نیاز داشته باشد، و
    ممکن است درخواست تأیید کند. امن‌تر است: به‌روزرسانی‌ها را به‌عنوان اپراتور از یک shell اجرا کنید.

    از CLI استفاده کنید:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    اگر باید از یک عامل خودکار کنید:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    مستندات: [به‌روزرسانی](/fa/cli/update)، [به‌روزرسانی کردن](/fa/install/updating).

  </Accordion>

  <Accordion title="راه‌اندازی اولیه واقعاً چه می‌کند؟">
    `openclaw onboard` مسیر راه‌اندازی توصیه‌شده است. در **حالت محلی** شما را از این مراحل عبور می‌دهد:

    - **راه‌اندازی مدل/احراز هویت** (OAuth ارائه‌دهنده، کلیدهای API، setup-token آنتروپیک، به‌علاوه گزینه‌های مدل محلی مانند LM Studio)
    - مکان **Workspace** + فایل‌های bootstrap
    - **تنظیمات Gateway** (bind/port/auth/tailscale)
    - **کانال‌ها** (WhatsApp، Telegram، Discord، Mattermost، Signal، iMessage، به‌علاوه Pluginهای کانال همراه مانند QQ Bot)
    - **نصب Daemon** (LaunchAgent در macOS؛ واحد کاربر systemd در Linux/WSL2)
    - **بررسی‌های سلامت** و انتخاب **Skills**

    همچنین اگر مدل پیکربندی‌شده شما ناشناخته باشد یا احراز هویت نداشته باشد هشدار می‌دهد.

  </Accordion>

  <Accordion title="آیا برای اجرای این به اشتراک Claude یا OpenAI نیاز دارم؟">
    نه. می‌توانید OpenClaw را با **کلیدهای API** (Anthropic/OpenAI/دیگران) یا با
    **مدل‌های فقط محلی** اجرا کنید تا داده‌هایتان روی دستگاه خودتان بماند. اشتراک‌ها (Claude
    Pro/Max یا OpenAI Codex) روش‌های اختیاری برای احراز هویت این ارائه‌دهندگان هستند.

    برای Anthropic در OpenClaw، تقسیم عملی این است:

    - **کلید API Anthropic**: صورت‌حساب معمول API Anthropic
    - **Claude CLI / احراز هویت اشتراک Claude در OpenClaw**: کارکنان Anthropic
      به ما گفتند این استفاده دوباره مجاز است، و OpenClaw استفاده از `claude -p`
      را برای این یکپارچه‌سازی مجاز تلقی می‌کند، مگر اینکه Anthropic سیاست جدیدی
      منتشر کند

    برای میزبان‌های Gateway بلندمدت، کلیدهای API Anthropic همچنان راه‌اندازی
    قابل پیش‌بینی‌تری هستند. OAuth مربوط به OpenAI Codex به‌طور صریح برای ابزارهای
    خارجی مانند OpenClaw پشتیبانی می‌شود.

    OpenClaw همچنین از گزینه‌های میزبانی‌شده دیگر با سبک اشتراکی پشتیبانی می‌کند، از جمله
    **Qwen Cloud Coding Plan**، **MiniMax Coding Plan**، و
    **Z.AI / GLM Coding Plan**.

    مستندات: [Anthropic](/fa/providers/anthropic)، [OpenAI](/fa/providers/openai)،
    [Qwen Cloud](/fa/providers/qwen)،
    [MiniMax](/fa/providers/minimax)، [مدل‌های GLM](/fa/providers/glm)،
    [مدل‌های محلی](/fa/gateway/local-models)، [مدل‌ها](/fa/concepts/models).

  </Accordion>

  <Accordion title="آیا می‌توانم از اشتراک Claude Max بدون کلید API استفاده کنم؟">
    بله.

    کارکنان Anthropic به ما گفتند استفاده از Claude CLI به سبک OpenClaw دوباره مجاز است، بنابراین
    OpenClaw احراز هویت اشتراک Claude و استفاده از `claude -p` را برای این یکپارچه‌سازی
    مجاز تلقی می‌کند، مگر اینکه Anthropic سیاست جدیدی منتشر کند. اگر
    قابل پیش‌بینی‌ترین راه‌اندازی سمت سرور را می‌خواهید، به‌جای آن از کلید API Anthropic استفاده کنید.

  </Accordion>

  <Accordion title="آیا از احراز هویت اشتراک Claude (Claude Pro یا Max) پشتیبانی می‌کنید؟">
    بله.

    کارکنان Anthropic به ما گفتند این استفاده دوباره مجاز است، بنابراین OpenClaw
    استفاده مجدد از Claude CLI و استفاده از `claude -p` را برای این یکپارچه‌سازی
    مجاز تلقی می‌کند، مگر اینکه Anthropic سیاست جدیدی منتشر کند.

    setup-token آنتروپیک همچنان به‌عنوان یک مسیر token پشتیبانی‌شده OpenClaw در دسترس است، اما OpenClaw اکنون هنگام دسترس بودن، استفاده مجدد از Claude CLI و `claude -p` را ترجیح می‌دهد.
    برای workloadهای تولیدی یا چندکاربره، احراز هویت با کلید API Anthropic همچنان
    انتخاب امن‌تر و قابل پیش‌بینی‌تری است. اگر گزینه‌های میزبانی‌شده دیگر با سبک
    اشتراکی را در OpenClaw می‌خواهید، [OpenAI](/fa/providers/openai)، [Qwen / Model
    Cloud](/fa/providers/qwen)، [MiniMax](/fa/providers/minimax)، و [مدل‌های GLM](/fa/providers/glm) را ببینید.

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="چرا HTTP 429 rate_limit_error از Anthropic می‌بینم؟">
    یعنی **سهمیه/محدودیت نرخ Anthropic** شما برای بازه فعلی تمام شده است. اگر از
    **Claude CLI** استفاده می‌کنید، منتظر بمانید بازه بازنشانی شود یا طرح خود را ارتقا دهید. اگر از
    **کلید API Anthropic** استفاده می‌کنید، Anthropic Console را
    برای مصرف/صورت‌حساب بررسی کنید و در صورت نیاز محدودیت‌ها را افزایش دهید.

    اگر پیام مشخصاً این است:
    `Extra usage is required for long context requests`، درخواست در تلاش است از
    بتای زمینه 1M متعلق به Anthropic (`context1m: true`) استفاده کند. این فقط زمانی کار می‌کند که
    اعتبارنامه شما واجد شرایط صورت‌حساب زمینه بلند باشد (صورت‌حساب کلید API یا مسیر
    ورود Claude در OpenClaw با Extra Usage فعال).

    نکته: یک **مدل جایگزین** تنظیم کنید تا OpenClaw وقتی یک ارائه‌دهنده با محدودیت نرخ روبه‌رو است همچنان بتواند پاسخ دهد.
    [مدل‌ها](/fa/cli/models)، [OAuth](/fa/concepts/oauth)، و
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/fa/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) را ببینید.

  </Accordion>

  <Accordion title="آیا AWS Bedrock پشتیبانی می‌شود؟">
    بله. OpenClaw یک ارائه‌دهنده همراه **Amazon Bedrock (Converse)** دارد. با وجود نشانگرهای env مربوط به AWS، OpenClaw می‌تواند کاتالوگ Bedrock برای streaming/text را خودکار کشف کند و آن را به‌عنوان یک ارائه‌دهنده ضمنی `amazon-bedrock` ادغام کند؛ در غیر این صورت می‌توانید `plugins.entries.amazon-bedrock.config.discovery.enabled` را صراحتا فعال کنید یا یک ورودی ارائه‌دهنده دستی اضافه کنید. [Amazon Bedrock](/fa/providers/bedrock) و [ارائه‌دهندگان مدل](/fa/providers/models) را ببینید. اگر جریان کلید مدیریت‌شده را ترجیح می‌دهید، یک پراکسی سازگار با OpenAI در جلوی Bedrock همچنان گزینه معتبری است.
  </Accordion>

  <Accordion title="احراز هویت Codex چگونه کار می‌کند؟">
    OpenClaw از **OpenAI Code (Codex)** از طریق OAuth (ورود با ChatGPT) پشتیبانی می‌کند. برای راه‌اندازی رایج از
    `openai/gpt-5.5` با `agentRuntime.id: "codex"` استفاده کنید:
    احراز هویت اشتراک ChatGPT/Codex به‌همراه اجرای بومی سرور برنامه Codex. فقط زمانی از
    `openai-codex/gpt-5.5` استفاده کنید که OAuth مربوط به Codex را از طریق اجراکننده پیش‌فرض
    PI می‌خواهید. برای دسترسی مستقیم با کلید API مربوط به OpenAI، از `openai/gpt-5.5` بدون override زمان اجرای Codex استفاده کنید.
    [ارائه‌دهندگان مدل](/fa/concepts/model-providers) و [راه‌اندازی اولیه (CLI)](/fa/start/wizard) را ببینید.
  </Accordion>

  <Accordion title="چرا OpenClaw هنوز به openai-codex اشاره می‌کند؟">
    `openai-codex` شناسه ارائه‌دهنده و نمایه احراز هویت برای OAuth مربوط به ChatGPT/Codex است.
    همچنین پیشوند صریح مدل PI برای OAuth مربوط به Codex است:

    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = احراز هویت اشتراک ChatGPT/Codex با زمان اجرای بومی Codex
    - `openai-codex/gpt-5.5` = مسیر OAuth مربوط به Codex در PI
    - `openai/gpt-5.5` بدون override زمان اجرای Codex = مسیر مستقیم کلید API مربوط به OpenAI در PI
    - `openai-codex:...` = شناسه نمایه احراز هویت، نه ارجاع مدل

    اگر مسیر مستقیم صورت‌حساب/محدودیت OpenAI Platform را می‌خواهید،
    `OPENAI_API_KEY` را تنظیم کنید. اگر احراز هویت اشتراک ChatGPT/Codex را می‌خواهید، با
    `openclaw models auth login --provider openai-codex` وارد شوید. برای زمان اجرای بومی Codex،
    ارجاع مدل را به‌صورت `openai/gpt-5.5` نگه دارید و
    `agentRuntime.id: "codex"` را تنظیم کنید. ارجاع‌های مدل `openai-codex/*` را فقط برای اجرای PI
    استفاده کنید.

  </Accordion>

  <Accordion title="چرا محدودیت‌های OAuth مربوط به Codex می‌تواند با وب ChatGPT متفاوت باشد؟">
    OAuth مربوط به Codex از پنجره‌های سهمیه وابسته به طرح و مدیریت‌شده توسط OpenAI استفاده می‌کند. در عمل،
    این محدودیت‌ها می‌توانند با تجربه وب‌سایت/برنامه ChatGPT متفاوت باشند، حتی وقتی
    هر دو به یک حساب متصل هستند.

    OpenClaw می‌تواند پنجره‌های مصرف/سهمیه ارائه‌دهنده را که اکنون قابل مشاهده‌اند در
    `openclaw models status` نشان دهد، اما حق‌دسترسی‌های وب ChatGPT را به دسترسی مستقیم API
    تبدیل یا یکسان‌سازی نمی‌کند. اگر مسیر مستقیم صورت‌حساب/محدودیت OpenAI Platform را می‌خواهید، از `openai/*` با یک کلید API استفاده کنید.

  </Accordion>

  <Accordion title="آیا از احراز هویت اشتراک OpenAI (OAuth مربوط به Codex) پشتیبانی می‌کنید؟">
    بله. OpenClaw به‌طور کامل از **OAuth اشتراک OpenAI Code (Codex)** پشتیبانی می‌کند.
    OpenAI صراحتا استفاده از OAuth اشتراک را در ابزارها/گردش‌کارهای خارجی
    مانند OpenClaw مجاز می‌داند. راه‌اندازی اولیه می‌تواند جریان OAuth را برای شما اجرا کند.

    [OAuth](/fa/concepts/oauth)، [ارائه‌دهندگان مدل](/fa/concepts/model-providers)، و [راه‌اندازی اولیه (CLI)](/fa/start/wizard) را ببینید.

  </Accordion>

  <Accordion title="چگونه OAuth مربوط به Gemini CLI را راه‌اندازی کنم؟">
    Gemini CLI از یک **جریان احراز هویت Plugin** استفاده می‌کند، نه یک شناسه یا secret کلاینت در `openclaw.json`.

    مراحل:

    1. Gemini CLI را محلی نصب کنید تا `gemini` در `PATH` باشد
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin را فعال کنید: `openclaw plugins enable google`
    3. وارد شوید: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. مدل پیش‌فرض پس از ورود: `google-gemini-cli/gemini-3-flash-preview`
    5. اگر درخواست‌ها شکست خوردند، `GOOGLE_CLOUD_PROJECT` یا `GOOGLE_CLOUD_PROJECT_ID` را روی میزبان Gateway تنظیم کنید

    این کار توکن‌های OAuth را در نمایه‌های احراز هویت روی میزبان Gateway ذخیره می‌کند. جزئیات: [ارائه‌دهندگان مدل](/fa/concepts/model-providers).

  </Accordion>

  <Accordion title="آیا یک مدل محلی برای گفت‌وگوهای معمولی مناسب است؟">
    معمولا خیر. OpenClaw به زمینه بزرگ + ایمنی قوی نیاز دارد؛ کارت‌های کوچک کوتاه می‌کنند و نشت می‌دهند. اگر مجبورید، **بزرگ‌ترین** ساخت مدل را که می‌توانید محلی اجرا کنید (LM Studio) اجرا کنید و [/gateway/local-models](/fa/gateway/local-models) را ببینید. مدل‌های کوچک‌تر/کوانتیزه‌شده خطر prompt-injection را افزایش می‌دهند - [امنیت](/fa/gateway/security) را ببینید.
  </Accordion>

  <Accordion title="چگونه ترافیک مدل میزبانی‌شده را در یک منطقه مشخص نگه دارم؟">
    endpointهای مقید به منطقه را انتخاب کنید. OpenRouter گزینه‌های میزبانی‌شده در آمریکا را برای MiniMax، Kimi، و GLM ارائه می‌کند؛ نوع میزبانی‌شده در آمریکا را انتخاب کنید تا داده‌ها در همان منطقه بمانند. همچنان می‌توانید Anthropic/OpenAI را در کنار این‌ها فهرست کنید، با استفاده از `models.mode: "merge"` تا fallbackها در دسترس بمانند و در عین حال ارائه‌دهنده منطقه‌ای انتخاب‌شده رعایت شود.
  </Accordion>

  <Accordion title="آیا برای نصب این باید Mac Mini بخرم؟">
    خیر. OpenClaw روی macOS یا Linux اجرا می‌شود (Windows از طریق WSL2). Mac mini اختیاری است - بعضی افراد
    یکی را به‌عنوان میزبان همیشه‌روشن می‌خرند، اما یک VPS کوچک، سرور خانگی، یا دستگاهی در رده Raspberry Pi هم کار می‌کند.

    فقط برای **ابزارهای مخصوص macOS** به Mac نیاز دارید. برای iMessage، از [BlueBubbles](/fa/channels/bluebubbles) (توصیه‌شده) استفاده کنید - سرور BlueBubbles روی هر Mac اجرا می‌شود، و Gateway می‌تواند روی Linux یا جای دیگری اجرا شود. اگر ابزارهای دیگری می‌خواهید که فقط مخصوص macOS هستند، Gateway را روی یک Mac اجرا کنید یا یک node با macOS جفت کنید.

    مستندات: [BlueBubbles](/fa/channels/bluebubbles)، [Nodeها](/fa/nodes)، [حالت راه دور Mac](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="آیا برای پشتیبانی iMessage به Mac mini نیاز دارم؟">
    به **یک دستگاه macOS** نیاز دارید که وارد Messages شده باشد. لازم نیست Mac mini باشد -
    هر Mac کار می‌کند. **از [BlueBubbles](/fa/channels/bluebubbles) استفاده کنید** (توصیه‌شده) برای iMessage - سرور BlueBubbles روی macOS اجرا می‌شود، در حالی که Gateway می‌تواند روی Linux یا جای دیگری اجرا شود.

    راه‌اندازی‌های رایج:

    - Gateway را روی Linux/VPS اجرا کنید، و سرور BlueBubbles را روی هر Mac واردشده به Messages اجرا کنید.
    - اگر ساده‌ترین راه‌اندازی تک‌دستگاهی را می‌خواهید، همه‌چیز را روی Mac اجرا کنید.

    مستندات: [BlueBubbles](/fa/channels/bluebubbles)، [Nodeها](/fa/nodes)،
    [حالت راه دور Mac](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="اگر برای اجرای OpenClaw یک Mac mini بخرم، آیا می‌توانم آن را به MacBook Pro خود وصل کنم؟">
    بله. **Mac mini می‌تواند Gateway را اجرا کند**، و MacBook Pro شما می‌تواند به‌عنوان یک
    **node** (دستگاه همراه) وصل شود. Nodeها Gateway را اجرا نمی‌کنند - آن‌ها قابلیت‌های اضافی
    مانند screen/camera/canvas و `system.run` را روی همان دستگاه فراهم می‌کنند.

    الگوی رایج:

    - Gateway روی Mac mini (همیشه‌روشن).
    - MacBook Pro برنامه macOS یا یک میزبان node را اجرا می‌کند و با Gateway جفت می‌شود.
    - برای دیدن آن از `openclaw nodes status` / `openclaw nodes list` استفاده کنید.

    مستندات: [Nodeها](/fa/nodes)، [CLI مربوط به Nodeها](/fa/cli/nodes).

  </Accordion>

  <Accordion title="آیا می‌توانم از Bun استفاده کنم؟">
    Bun **توصیه نمی‌شود**. ما باگ‌های زمان اجرا می‌بینیم، به‌ویژه با WhatsApp و Telegram.
    برای Gatewayهای پایدار از **Node** استفاده کنید.

    اگر هنوز می‌خواهید Bun را امتحان کنید، این کار را روی یک Gateway غیرتولیدی
    بدون WhatsApp/Telegram انجام دهید.

  </Accordion>

  <Accordion title="Telegram: چه چیزی در allowFrom قرار می‌گیرد؟">
    `channels.telegram.allowFrom` **شناسه کاربری Telegram فرستنده انسانی** است (عددی). نام کاربری bot نیست.

    راه‌اندازی فقط شناسه‌های کاربری عددی را درخواست می‌کند. اگر از قبل ورودی‌های قدیمی `@username` در پیکربندی دارید، `openclaw doctor --fix` می‌تواند تلاش کند آن‌ها را resolve کند.

    امن‌تر (بدون bot شخص ثالث):

    - به bot خود پیام مستقیم بدهید، سپس `openclaw logs --follow` را اجرا کنید و `from.id` را بخوانید.

    Bot API رسمی:

    - به bot خود پیام مستقیم بدهید، سپس `https://api.telegram.org/bot<bot_token>/getUpdates` را فراخوانی کنید و `message.from.id` را بخوانید.

    شخص ثالث (حریم خصوصی کمتر):

    - به `@userinfobot` یا `@getidsbot` پیام مستقیم بدهید.

    [/channels/telegram](/fa/channels/telegram#access-control-and-activation) را ببینید.

  </Accordion>

  <Accordion title="آیا چند نفر می‌توانند با نمونه‌های متفاوت OpenClaw از یک شماره WhatsApp استفاده کنند؟">
    بله، از طریق **مسیریابی چندعاملی**. **DM** مربوط به WhatsApp هر فرستنده (همتا با `kind: "direct"`، فرستنده E.164 مانند `+15551234567`) را به یک `agentId` متفاوت bind کنید، تا هر شخص workspace و session store خودش را داشته باشد. پاسخ‌ها همچنان از **همان حساب WhatsApp** می‌آیند، و کنترل دسترسی DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) برای هر حساب WhatsApp سراسری است. [مسیریابی چندعاملی](/fa/concepts/multi-agent) و [WhatsApp](/fa/channels/whatsapp) را ببینید.
  </Accordion>

  <Accordion title='آیا می‌توانم یک agent «چت سریع» و یک agent «Opus برای کدنویسی» اجرا کنم؟'>
    بله. از مسیریابی چندعاملی استفاده کنید: به هر agent مدل پیش‌فرض خودش را بدهید، سپس مسیرهای ورودی (حساب ارائه‌دهنده یا همتاهای مشخص) را به هر agent bind کنید. نمونه پیکربندی در [مسیریابی چندعاملی](/fa/concepts/multi-agent) قرار دارد. همچنین [مدل‌ها](/fa/concepts/models) و [پیکربندی](/fa/gateway/configuration) را ببینید.
  </Accordion>

  <Accordion title="آیا Homebrew روی Linux کار می‌کند؟">
    بله. Homebrew از Linux (Linuxbrew) پشتیبانی می‌کند. راه‌اندازی سریع:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    اگر OpenClaw را از طریق systemd اجرا می‌کنید، مطمئن شوید PATH سرویس شامل `/home/linuxbrew/.linuxbrew/bin` (یا پیشوند brew شما) باشد تا ابزارهای نصب‌شده با `brew` در shellهای غیر login resolve شوند.
    ساخت‌های اخیر همچنین دایرکتوری‌های رایج bin کاربر را در سرویس‌های Linux systemd به ابتدا اضافه می‌کنند (برای مثال `~/.local/bin`، `~/.npm-global/bin`، `~/.local/share/pnpm`، `~/.bun/bin`) و در صورت تنظیم بودن، `PNPM_HOME`، `NPM_CONFIG_PREFIX`، `BUN_INSTALL`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `NVM_DIR`، و `FNM_DIR` را رعایت می‌کنند.

  </Accordion>

  <Accordion title="تفاوت بین نصب git قابل‌هک و نصب npm">
    - **نصب قابل‌هک (git):** دریافت کامل سورس، قابل ویرایش، بهترین گزینه برای مشارکت‌کنندگان.
      ساخت‌ها را محلی اجرا می‌کنید و می‌توانید کد/مستندات را patch کنید.
    - **نصب npm:** نصب CLI سراسری، بدون repo، بهترین گزینه برای «فقط اجرا کن».
      به‌روزرسانی‌ها از dist-tagهای npm می‌آیند.

    مستندات: [شروع به کار](/fa/start/getting-started)، [به‌روزرسانی](/fa/install/updating).

  </Accordion>

  <Accordion title="آیا بعدا می‌توانم بین نصب‌های npm و git جابه‌جا شوم؟">
    بله. وقتی OpenClaw از قبل نصب شده است، از `openclaw update --channel ...` استفاده کنید.
    این **داده‌های شما را حذف نمی‌کند** - فقط نصب کد OpenClaw را تغییر می‌دهد.
    وضعیت شما (`~/.openclaw`) و workspace شما (`~/.openclaw/workspace`) دست‌نخورده می‌مانند.

    از npm به git:

    ```bash
    openclaw update --channel dev
    ```

    از git به npm:

    ```bash
    openclaw update --channel stable
    ```

    برای پیش‌نمایش جابه‌جایی حالت برنامه‌ریزی‌شده، ابتدا `--dry-run` را اضافه کنید. به‌روزرساننده
    پیگیری‌های Doctor را اجرا می‌کند، سورس‌های plugin را برای کانال هدف refresh می‌کند، و
    gateway را restart می‌کند مگر اینکه `--no-restart` را پاس کنید.

    نصب‌کننده هم می‌تواند هر یک از دو حالت را force کند:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    نکات پشتیبان‌گیری: [راهبرد پشتیبان‌گیری](#where-things-live-on-disk) را ببینید.

  </Accordion>

  <Accordion title="آیا باید Gateway را روی لپ‌تاپ خود اجرا کنم یا روی VPS؟">
    پاسخ کوتاه: **اگر پایداری 24/7 می‌خواهید، از VPS استفاده کنید**. اگر
    کمترین اصطکاک را می‌خواهید و با sleep/restart مشکلی ندارید، آن را محلی اجرا کنید.

    **لپ‌تاپ (Gateway محلی)**

    - **مزایا:** بدون هزینه سرور، دسترسی مستقیم به فایل‌های محلی، پنجره مرورگر زنده.
    - **معایب:** sleep/قطع شبکه = قطع اتصال، به‌روزرسانی‌ها/rebootهای سیستم‌عامل اختلال ایجاد می‌کنند، باید بیدار بماند.

    **VPS / cloud**

    - **مزایا:** همیشه روشن، شبکه پایدار، بدون مشکل خواب رفتن لپ‌تاپ، نگه‌داشتن آن در حال اجرا آسان‌تر است.
    - **معایب:** اغلب بدون نمایشگر اجرا می‌شود (از اسکرین‌شات‌ها استفاده کنید)، فقط دسترسی فایل از راه دور دارد، برای به‌روزرسانی‌ها باید SSH کنید.

    **یادداشت مخصوص OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord همگی از یک VPS بدون مشکل کار می‌کنند. تنها مصالحه واقعی بین **مرورگر بدون نمایشگر** و یک پنجره قابل مشاهده است. [مرورگر](/fa/tools/browser) را ببینید.

    **پیش‌فرض پیشنهادی:** اگر قبلاً قطع اتصال Gateway داشته‌اید، VPS. حالت محلی زمانی عالی است که فعالانه از Mac استفاده می‌کنید و دسترسی فایل محلی یا خودکارسازی UI با مرورگر قابل مشاهده می‌خواهید.

  </Accordion>

  <Accordion title="اجرای OpenClaw روی یک ماشین اختصاصی چقدر مهم است؟">
    الزامی نیست، اما **برای قابلیت اطمینان و ایزوله‌سازی توصیه می‌شود**.

    - **میزبان اختصاصی (VPS/Mac mini/Pi):** همیشه روشن، وقفه‌های کمتر ناشی از خواب/راه‌اندازی مجدد، مجوزهای تمیزتر، نگه‌داشتن آن در حال اجرا آسان‌تر است.
    - **لپ‌تاپ/دسکتاپ مشترک:** برای آزمایش و استفاده فعال کاملاً مناسب است، اما هنگام خواب رفتن یا به‌روزرسانی ماشین انتظار مکث داشته باشید.

    اگر بهترین حالت هر دو جهان را می‌خواهید، Gateway را روی یک میزبان اختصاصی نگه دارید و لپ‌تاپ خود را به‌عنوان یک **Node** برای ابزارهای صفحه‌نمایش/دوربین/اجرا محلی جفت کنید. [Nodes](/fa/nodes) را ببینید.
    برای راهنمایی امنیتی، [امنیت](/fa/gateway/security) را بخوانید.

  </Accordion>

  <Accordion title="حداقل نیازمندی‌های VPS و سیستم‌عامل پیشنهادی چیست؟">
    OpenClaw سبک است. برای یک Gateway پایه + یک کانال گفت‌وگو:

    - **حداقل مطلق:** ۱ vCPU، ۱GB RAM، حدود ۵۰۰MB دیسک.
    - **پیشنهادی:** ۱ تا ۲ vCPU، ۲GB RAM یا بیشتر برای ظرفیت اضافه (لاگ‌ها، رسانه، چند کانال). ابزارهای Node و خودکارسازی مرورگر می‌توانند منابع زیادی مصرف کنند.

    سیستم‌عامل: از **Ubuntu LTS** (یا هر Debian/Ubuntu مدرن) استفاده کنید. مسیر نصب Linux در آنجا بهتر آزمایش شده است.

    مستندات: [Linux](/fa/platforms/linux)، [میزبانی VPS](/fa/vps).

  </Accordion>

  <Accordion title="آیا می‌توانم OpenClaw را در یک VM اجرا کنم و نیازمندی‌ها چیست؟">
    بله. با یک VM همانند یک VPS رفتار کنید: باید همیشه روشن، قابل دسترس، و دارای RAM کافی
    برای Gateway و هر کانالی باشد که فعال می‌کنید.

    راهنمای پایه:

    - **حداقل مطلق:** ۱ vCPU، ۱GB RAM.
    - **پیشنهادی:** اگر چند کانال، خودکارسازی مرورگر، یا ابزارهای رسانه اجرا می‌کنید، ۲GB RAM یا بیشتر.
    - **سیستم‌عامل:** Ubuntu LTS یا یک Debian/Ubuntu مدرن دیگر.

    اگر روی Windows هستید، **WSL2 آسان‌ترین راه‌اندازی به سبک VM است** و بهترین سازگاری
    ابزارها را دارد. [Windows](/fa/platforms/windows)، [میزبانی VPS](/fa/vps) را ببینید.
    اگر macOS را در یک VM اجرا می‌کنید، [macOS VM](/fa/install/macos-vm) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [پرسش‌های متداول](/fa/help/faq) — پرسش‌های متداول اصلی (مدل‌ها، نشست‌ها، gateway، امنیت، موارد بیشتر)
- [نمای کلی نصب](/fa/install)
- [شروع به کار](/fa/start/getting-started)
- [عیب‌یابی](/fa/help/troubleshooting)
