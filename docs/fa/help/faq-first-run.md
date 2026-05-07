---
read_when:
    - نصب تازه، گیر کردن فرایند راه‌اندازی اولیه، یا خطاهای اجرای نخست
    - انتخاب احراز هویت و اشتراک‌های ارائه‌دهنده
    - نمی‌توان به docs.openclaw.ai دسترسی پیدا کرد، نمی‌توان داشبورد را باز کرد، نصب گیر کرده است
sidebarTitle: First-run FAQ
summary: 'پرسش‌های متداول: راه‌اندازی سریع و تنظیمات اجرای نخست — نصب، آماده‌سازی اولیه، احراز هویت، اشتراک‌ها، خطاهای اولیه'
title: 'پرسش‌های متداول: راه‌اندازی در اجرای نخست'
x-i18n:
    generated_at: "2026-05-07T13:20:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 347a09ebdbdf564389b406de3d5d47d097ead33d33eed4a68880bfbcaf82e048
    source_path: help/faq-first-run.md
    workflow: 16
---

  شروع سریع و پرسش‌وپاسخ اجرای نخست. برای عملیات روزمره، مدل‌ها، احراز هویت، نشست‌ها،
  و عیب‌یابی، [FAQ](/fa/help/faq) اصلی را ببینید.

  ## شروع سریع و راه‌اندازی اجرای نخست

  <AccordionGroup>
  <Accordion title="گیر کرده‌ام، سریع‌ترین راه برای خارج شدن از بن‌بست">
    از یک عامل هوش مصنوعی محلی استفاده کنید که بتواند **دستگاه شما را ببیند**. این بسیار مؤثرتر از پرسیدن
    در Discord است، چون بیشتر موارد «گیر کرده‌ام» **مشکلات پیکربندی یا محیط محلی** هستند که
    کمک‌کنندگان راه دور نمی‌توانند بررسی کنند.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    این ابزارها می‌توانند مخزن را بخوانند، فرمان‌ها را اجرا کنند، گزارش‌ها را بررسی کنند و به رفع راه‌اندازی
    سطح دستگاه شما (PATH، سرویس‌ها، مجوزها، فایل‌های احراز هویت) کمک کنند. با نصب
    قابل‌دستکاری (git)، **checkout کامل منبع** را به آن‌ها بدهید:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    این کار OpenClaw را **از یک git checkout** نصب می‌کند، تا عامل بتواند کد + مستندات را بخواند و
    درباره نسخه دقیقی که اجرا می‌کنید استدلال کند. همیشه می‌توانید بعداً با اجرای دوباره نصب‌کننده بدون
    `--install-method git` به نسخه پایدار برگردید.

    نکته: از عامل بخواهید رفع مشکل را **برنامه‌ریزی و نظارت** کند (گام‌به‌گام)، سپس فقط
    فرمان‌های لازم را اجرا کنید. این کار تغییرات را کوچک و بررسی آن‌ها را آسان‌تر نگه می‌دارد.

    اگر یک باگ یا اصلاح واقعی پیدا کردید، لطفاً یک issue در GitHub ثبت کنید یا یک PR بفرستید:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    با این فرمان‌ها شروع کنید (هنگام درخواست کمک، خروجی‌ها را به اشتراک بگذارید):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    کارکرد آن‌ها:

    - `openclaw status`: نمای فوری از سلامت gateway/agent + پیکربندی پایه.
    - `openclaw models status`: احراز هویت provider + در دسترس بودن مدل را بررسی می‌کند.
    - `openclaw doctor`: مشکلات رایج پیکربندی/وضعیت را اعتبارسنجی و تعمیر می‌کند.

    بررسی‌های CLI مفید دیگر: `openclaw status --all`، `openclaw logs --follow`،
    `openclaw gateway status`، `openclaw health --verbose`.

    چرخه عیب‌یابی سریع: [۶۰ ثانیه اول اگر چیزی خراب است](/fa/help/faq#first-60-seconds-if-something-is-broken).
    مستندات نصب: [نصب](/fa/install)، [پرچم‌های نصب‌کننده](/fa/install/installer)، [به‌روزرسانی](/fa/install/updating).

  </Accordion>

  <Accordion title="Heartbeat مدام رد می‌شود. دلایل رد شدن چه معنایی دارند؟">
    دلایل رایج رد شدن heartbeat:

    - `quiet-hours`: خارج از بازه active-hours پیکربندی‌شده
    - `empty-heartbeat-file`: `HEARTBEAT.md` وجود دارد اما فقط شامل اسکلت‌بندی خالی/فقط-سربرگ است
    - `no-tasks-due`: حالت وظیفه `HEARTBEAT.md` فعال است اما هنوز موعد هیچ‌کدام از بازه‌های وظیفه نرسیده است
    - `alerts-disabled`: تمام قابلیت مشاهده heartbeat غیرفعال است (`showOk`، `showAlerts`، و `useIndicator` همگی خاموش هستند)

    در حالت وظیفه، زمان‌های موعد فقط پس از تکمیل یک اجرای واقعی heartbeat
    جلو برده می‌شوند. اجراهای ردشده وظیفه‌ها را تکمیل‌شده علامت نمی‌زنند.

    مستندات: [Heartbeat](/fa/gateway/heartbeat)، [اتوماسیون و وظیفه‌ها](/fa/automation).

  </Accordion>

  <Accordion title="روش پیشنهادی برای نصب و راه‌اندازی OpenClaw">
    مخزن، اجرا از منبع و استفاده از onboarding را توصیه می‌کند:

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

    اگر هنوز نصب سراسری ندارید، آن را با `pnpm openclaw onboard` اجرا کنید.

  </Accordion>

  <Accordion title="پس از onboarding چگونه داشبورد را باز کنم؟">
    جادوگر بلافاصله پس از onboarding مرورگر شما را با یک URL تمیز (بدون توکن) برای داشبورد باز می‌کند و همچنین پیوند را در خلاصه چاپ می‌کند. آن برگه را باز نگه دارید؛ اگر اجرا نشد، URL چاپ‌شده را روی همان دستگاه کپی/جای‌گذاری کنید.
  </Accordion>

  <Accordion title="چگونه داشبورد را روی localhost در برابر حالت راه دور احراز هویت کنم؟">
    **Localhost (همان دستگاه):**

    - `http://127.0.0.1:18789/` را باز کنید.
    - اگر احراز هویت shared-secret خواست، توکن یا گذرواژه پیکربندی‌شده را در تنظیمات رابط کاربری کنترل جای‌گذاری کنید.
    - منبع توکن: `gateway.auth.token` (یا `OPENCLAW_GATEWAY_TOKEN`).
    - منبع گذرواژه: `gateway.auth.password` (یا `OPENCLAW_GATEWAY_PASSWORD`).
    - اگر هنوز shared secret پیکربندی نشده است، با `openclaw doctor --generate-gateway-token` یک توکن بسازید.

    **غیر از localhost:**

    - **Tailscale Serve** (پیشنهادی): bind را روی loopback نگه دارید، `openclaw gateway --tailscale serve` را اجرا کنید، `https://<magicdns>/` را باز کنید. اگر `gateway.auth.allowTailscale` برابر `true` باشد، سربرگ‌های هویت احراز هویت رابط کاربری کنترل/WebSocket را برآورده می‌کنند (بدون shared secret جای‌گذاری‌شده، با فرض میزبان gateway مورد اعتماد)؛ APIهای HTTP همچنان به احراز هویت shared-secret نیاز دارند، مگر اینکه عمداً از private-ingress `none` یا احراز هویت HTTP با trusted-proxy استفاده کنید.
      تلاش‌های هم‌زمان ناموفق احراز هویت Serve از همان client، پیش از ثبت‌شدن توسط محدودکننده failed-auth، سریالی می‌شوند؛ بنابراین تلاش ناموفق دوم می‌تواند از قبل `retry later` را نشان دهد.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` را اجرا کنید (یا احراز هویت با گذرواژه را پیکربندی کنید)، `http://<tailscale-ip>:18789/` را باز کنید، سپس shared secret متناظر را در تنظیمات داشبورد جای‌گذاری کنید.
    - **reverse proxy آگاه از هویت**: Gateway را پشت یک proxy مورد اعتماد نگه دارید، `gateway.auth.mode: "trusted-proxy"` را پیکربندی کنید، سپس URL proxy را باز کنید. proxyهای loopback همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند.
    - **تونل SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` سپس `http://127.0.0.1:18789/` را باز کنید. احراز هویت shared-secret همچنان روی تونل اعمال می‌شود؛ اگر درخواست شد، توکن یا گذرواژه پیکربندی‌شده را جای‌گذاری کنید.

    برای حالت‌های bind و جزئیات احراز هویت، [داشبورد](/fa/web/dashboard) و [سطوح وب](/fa/web) را ببینید.

  </Accordion>

  <Accordion title="چرا برای تأییدهای chat دو پیکربندی تأیید exec وجود دارد؟">
    آن‌ها لایه‌های متفاوتی را کنترل می‌کنند:

    - `approvals.exec`: درخواست‌های تأیید را به مقصدهای chat ارسال می‌کند
    - `channels.<channel>.execApprovals`: آن channel را به‌عنوان یک client تأیید بومی برای تأییدهای exec عمل می‌دهد

    سیاست exec میزبان همچنان دروازه واقعی تأیید است. پیکربندی chat فقط کنترل می‌کند درخواست‌های تأیید
    کجا ظاهر شوند و افراد چگونه بتوانند به آن‌ها پاسخ دهند.

    در بیشتر راه‌اندازی‌ها به **هر دو** نیاز ندارید:

    - اگر chat از قبل از فرمان‌ها و پاسخ‌ها پشتیبانی می‌کند، `/approve` همان chat از مسیر مشترک کار می‌کند.
    - اگر یک channel بومی پشتیبانی‌شده بتواند تأییدکنندگان را با اطمینان استنباط کند، OpenClaw اکنون وقتی `channels.<channel>.execApprovals.enabled` تنظیم نشده یا `"auto"` باشد، تأییدهای بومی اول-DM را خودکار فعال می‌کند.
    - وقتی کارت‌ها/دکمه‌های تأیید بومی در دسترس باشند، آن UI بومی مسیر اصلی است؛ عامل فقط زمانی باید یک فرمان دستی `/approve` اضافه کند که نتیجه ابزار بگوید تأییدهای chat در دسترس نیستند یا تأیید دستی تنها مسیر است.
    - از `approvals.exec` فقط زمانی استفاده کنید که درخواست‌ها باید به chatهای دیگر یا اتاق‌های ops صریح نیز ارسال شوند.
    - از `channels.<channel>.execApprovals.target: "channel"` یا `"both"` فقط زمانی استفاده کنید که صراحتاً می‌خواهید درخواست‌های تأیید دوباره در اتاق/موضوع مبدأ ارسال شوند.
    - تأییدهای Plugin دوباره جدا هستند: آن‌ها به‌صورت پیش‌فرض از `/approve` همان chat، ارسال اختیاری `approvals.plugin`، و فقط در بعضی channelهای بومی از رسیدگی plugin-approval-native اضافه استفاده می‌کنند.

    نسخه کوتاه: ارسال برای مسیریابی است، پیکربندی client بومی برای UX غنی‌تر و مخصوص channel است.
    [تأییدهای Exec](/fa/tools/exec-approvals) را ببینید.

  </Accordion>

  <Accordion title="به چه runtime نیاز دارم؟">
    Node **>= 22** لازم است. `pnpm` توصیه می‌شود. Bun برای Gateway **توصیه نمی‌شود**.
  </Accordion>

  <Accordion title="آیا روی Raspberry Pi اجرا می‌شود؟">
    بله. Gateway سبک است - مستندات **512MB-1GB RAM**، **1 core**، و حدود **500MB**
    دیسک را برای استفاده شخصی کافی می‌دانند، و اشاره می‌کنند که **Raspberry Pi 4 می‌تواند آن را اجرا کند**.

    اگر فضای تنفسی بیشتری می‌خواهید (گزارش‌ها، رسانه، سرویس‌های دیگر)، **2GB توصیه می‌شود**، اما
    حداقل سخت‌گیرانه نیست.

    نکته: یک Pi/VPS کوچک می‌تواند میزبان Gateway باشد، و می‌توانید **nodeها** را روی لپ‌تاپ/تلفن خود برای
    صفحه‌نمایش/دوربین/canvas محلی یا اجرای فرمان جفت کنید. [Nodeها](/fa/nodes) را ببینید.

  </Accordion>

  <Accordion title="نکته‌ای برای نصب روی Raspberry Pi دارید؟">
    نسخه کوتاه: کار می‌کند، اما انتظار ناهمواری‌هایی را داشته باشید.

    - از یک سیستم‌عامل **64-bit** استفاده کنید و Node >= 22 را نگه دارید.
    - نصب **قابل‌دستکاری (git)** را ترجیح دهید تا بتوانید گزارش‌ها را ببینید و سریع به‌روزرسانی کنید.
    - بدون channelها/Skills شروع کنید، سپس آن‌ها را یکی‌یکی اضافه کنید.
    - اگر با مشکلات عجیب binary روبه‌رو شدید، معمولاً یک مشکل **سازگاری ARM** است.

    مستندات: [Linux](/fa/platforms/linux)، [نصب](/fa/install).

  </Accordion>

  <Accordion title="روی wake up my friend گیر کرده است / onboarding باز نمی‌شود. حالا چه کنم؟">
    آن صفحه به قابل دسترس و احراز هویت‌شده بودن Gateway وابسته است. TUI همچنین در نخستین hatch
    به‌صورت خودکار "Wake up, my friend!" را می‌فرستد. اگر آن خط را با **بدون پاسخ**
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

    اگر Gateway راه دور است، مطمئن شوید اتصال تونل/Tailscale برقرار است و UI
    به Gateway درست اشاره می‌کند. [دسترسی راه دور](/fa/gateway/remote) را ببینید.

  </Accordion>

  <Accordion title="آیا می‌توانم راه‌اندازی خود را بدون انجام دوباره onboarding به یک دستگاه جدید (Mac mini) منتقل کنم؟">
    بله. **پوشه وضعیت** و **workspace** را کپی کنید، سپس یک‌بار Doctor را اجرا کنید. این کار
    bot شما را «دقیقاً همان‌طور» نگه می‌دارد (حافظه، تاریخچه نشست، احراز هویت، و وضعیت channel)
    به شرطی که **هر دو** مکان را کپی کنید:

    1. OpenClaw را روی دستگاه جدید نصب کنید.
    2. `$OPENCLAW_STATE_DIR` (پیش‌فرض: `~/.openclaw`) را از دستگاه قدیمی کپی کنید.
    3. workspace خود را کپی کنید (پیش‌فرض: `~/.openclaw/workspace`).
    4. `openclaw doctor` را اجرا کنید و سرویس Gateway را بازراه‌اندازی کنید.

    این کار پیکربندی، پروفایل‌های احراز هویت، اعتبارنامه‌های WhatsApp، نشست‌ها، و حافظه را حفظ می‌کند. اگر در
    حالت راه دور هستید، به یاد داشته باشید میزبان gateway مالک session store و workspace است.

    **مهم:** اگر فقط workspace خود را commit/push به GitHub کنید، دارید از
    **memory + bootstrap files** پشتیبان می‌گیرید، اما **نه** از تاریخچه نشست یا احراز هویت. آن‌ها
    زیر `~/.openclaw/` هستند (برای مثال `~/.openclaw/agents/<agentId>/sessions/`).

    مرتبط: [مهاجرت](/fa/install/migrating)، [چیزها روی دیسک کجا هستند](/fa/help/faq#where-things-live-on-disk)،
    [workspace عامل](/fa/concepts/agent-workspace)، [Doctor](/fa/gateway/doctor)،
    [حالت راه دور](/fa/gateway/remote).

  </Accordion>

  <Accordion title="کجا ببینم در آخرین نسخه چه چیز جدیدی است؟">
    changelog GitHub را بررسی کنید:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    جدیدترین ورودی‌ها در بالا هستند. اگر بخش بالایی با **Unreleased** علامت‌گذاری شده باشد، بخش تاریخ‌دار بعدی
    آخرین نسخه منتشرشده است. ورودی‌ها بر اساس **Highlights**، **Changes**، و
    **Fixes** گروه‌بندی شده‌اند (به‌علاوه بخش‌های مستندات/دیگر در صورت نیاز).

  </Accordion>

  <Accordion title="نمی‌توانم به docs.openclaw.ai دسترسی پیدا کنم (خطای SSL)">
    بعضی اتصال‌های Comcast/Xfinity به‌اشتباه `docs.openclaw.ai` را از طریق Xfinity
    Advanced Security مسدود می‌کنند. آن را غیرفعال کنید یا `docs.openclaw.ai` را allowlist کنید، سپس دوباره تلاش کنید.
    لطفاً با گزارش در اینجا به ما کمک کنید آن را رفع انسداد کنیم: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    اگر همچنان نمی‌توانید به سایت دسترسی پیدا کنید، مستندات روی GitHub نیز mirror شده‌اند:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="تفاوت بین stable و beta">
    **Stable** و **beta**، **dist-tag های npm** هستند، نه خط‌های کد جداگانه:

    - `latest` = stable
    - `beta` = بیلد اولیه برای آزمایش

    معمولاً یک انتشار stable ابتدا روی **beta** قرار می‌گیرد، سپس یک مرحلهٔ
    promotion صریح همان نسخه را به `latest` منتقل می‌کند. نگه‌دارندگان همچنین می‌توانند
    در صورت نیاز مستقیماً روی `latest` منتشر کنند. به همین دلیل beta و stable ممکن است
    پس از promotion به **همان نسخه** اشاره کنند.

    ببینید چه چیزهایی تغییر کرده است:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    برای دستورهای تک‌خطی نصب و تفاوت بین beta و dev، accordion زیر را ببینید.

  </Accordion>

  <Accordion title="چگونه نسخهٔ beta را نصب کنم و تفاوت beta و dev چیست؟">
    **Beta** همان dist-tag npm یعنی `beta` است (ممکن است پس از promotion با `latest` یکی باشد).
    **Dev** سرِ متحرک `main` (git) است؛ وقتی منتشر شود، از dist-tag npm یعنی `dev` استفاده می‌کند.

    دستورهای تک‌خطی (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    نصب‌کنندهٔ Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    جزئیات بیشتر: [کانال‌های توسعه](/fa/install/development-channels) و [پرچم‌های نصب‌کننده](/fa/install/installer).

  </Accordion>

  <Accordion title="چگونه تازه‌ترین بیت‌ها را امتحان کنم؟">
    دو گزینه:

    1. **کانال dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    این کار به شاخهٔ `main` می‌رود و از سورس به‌روزرسانی می‌کند.

    2. **نصب قابل‌هک (از سایت نصب‌کننده):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    این یک مخزن محلی به شما می‌دهد که می‌توانید آن را ویرایش کنید و سپس از طریق git به‌روزرسانی کنید.

    اگر ترجیح می‌دهید خودتان یک clone تمیز بسازید، از این استفاده کنید:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    مستندات: [به‌روزرسانی](/fa/cli/update)، [کانال‌های توسعه](/fa/install/development-channels)،
    [نصب](/fa/install).

  </Accordion>

  <Accordion title="نصب و onboarding معمولاً چقدر طول می‌کشد؟">
    راهنمای تقریبی:

    - **نصب:** ۲ تا ۵ دقیقه
    - **Onboarding:** ۵ تا ۱۵ دقیقه، بسته به اینکه چند کانال/مدل را پیکربندی می‌کنید

    اگر گیر کرد، از [گیر کردن نصب‌کننده](#quick-start-and-first-run-setup)
    و چرخهٔ سریع اشکال‌زدایی در [گیر کرده‌ام](#quick-start-and-first-run-setup) استفاده کنید.

  </Accordion>

  <Accordion title="نصب‌کننده گیر کرده است؟ چگونه بازخورد بیشتری بگیرم؟">
    نصب‌کننده را با **خروجی verbose** دوباره اجرا کنید:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    نصب beta با verbose:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    برای نصب قابل‌هک (git):

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

  <Accordion title="نصب در Windows می‌گوید git پیدا نشد یا openclaw شناخته نشد">
    دو مشکل رایج در Windows:

    **1) خطای npm با spawn git / git پیدا نشد**

    - **Git for Windows** را نصب کنید و مطمئن شوید `git` در PATH شما قرار دارد.
    - PowerShell را ببندید و دوباره باز کنید، سپس نصب‌کننده را دوباره اجرا کنید.

    **2) پس از نصب، openclaw شناخته نمی‌شود**

    - پوشهٔ bin سراسری npm شما در PATH نیست.
    - مسیر را بررسی کنید:

      ```powershell
      npm config get prefix
      ```

    - آن دایرکتوری را به PATH کاربر خود اضافه کنید (در Windows پسوند `\bin` لازم نیست؛ در بیشتر سیستم‌ها `%AppData%\npm` است).
    - پس از به‌روزرسانی PATH، PowerShell را ببندید و دوباره باز کنید.

    اگر روان‌ترین راه‌اندازی Windows را می‌خواهید، به‌جای Windows بومی از **WSL2** استفاده کنید.
    مستندات: [Windows](/fa/platforms/windows).

  </Accordion>

  <Accordion title="خروجی exec در Windows متن چینی درهم‌ریخته نشان می‌دهد - چه کار کنم؟">
    این معمولاً ناسازگاری code page کنسول در shell های بومی Windows است.

    نشانه‌ها:

    - خروجی `system.run`/`exec` متن چینی را به‌صورت mojibake نمایش می‌دهد
    - همان دستور در یک پروفایل ترمینال دیگر درست به نظر می‌رسد

    راه‌حل سریع در PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    سپس Gateway را restart کنید و دستور خود را دوباره امتحان کنید:

    ```powershell
    openclaw gateway restart
    ```

    اگر همچنان این مشکل را در آخرین OpenClaw بازتولید می‌کنید، آن را اینجا پیگیری/گزارش کنید:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="مستندات به پرسش من پاسخ نداد - چگونه پاسخ بهتری بگیرم؟">
    از **نصب قابل‌هک (git)** استفاده کنید تا سورس کامل و مستندات را به‌صورت محلی داشته باشید، سپس از bot خود
    (یا Claude/Codex) _از داخل همان پوشه_ بپرسید تا بتواند repo را بخواند و دقیق پاسخ دهد.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    جزئیات بیشتر: [نصب](/fa/install) و [پرچم‌های نصب‌کننده](/fa/install/installer).

  </Accordion>

  <Accordion title="چگونه OpenClaw را روی Linux نصب کنم؟">
    پاسخ کوتاه: راهنمای Linux را دنبال کنید، سپس onboarding را اجرا کنید.

    - مسیر سریع Linux + نصب service: [Linux](/fa/platforms/linux).
    - راهنمای کامل: [شروع به کار](/fa/start/getting-started).
    - نصب‌کننده + به‌روزرسانی‌ها: [نصب و به‌روزرسانی‌ها](/fa/install/updating).

  </Accordion>

  <Accordion title="چگونه OpenClaw را روی VPS نصب کنم؟">
    هر VPS مبتنی بر Linux کار می‌کند. روی server نصب کنید، سپس برای دسترسی به Gateway از SSH/Tailscale استفاده کنید.

    راهنماها: [exe.dev](/fa/install/exe-dev)، [Hetzner](/fa/install/hetzner)، [Fly.io](/fa/install/fly).
    دسترسی راه‌دور: [Gateway راه‌دور](/fa/gateway/remote).

  </Accordion>

  <Accordion title="راهنماهای نصب cloud/VPS کجا هستند؟">
    ما یک **هاب hosting** با provider های رایج نگه می‌داریم. یکی را انتخاب کنید و راهنما را دنبال کنید:

    - [میزبانی VPS](/fa/vps) (همهٔ provider ها در یک جا)
    - [Fly.io](/fa/install/fly)
    - [Hetzner](/fa/install/hetzner)
    - [exe.dev](/fa/install/exe-dev)

    نحوهٔ کار در cloud: **Gateway روی server اجرا می‌شود** و شما از laptop/phone خود
    از طریق Control UI (یا Tailscale/SSH) به آن دسترسی پیدا می‌کنید. state + workspace شما
    روی server زندگی می‌کنند، پس host را منبع حقیقت بدانید و از آن backup بگیرید.

    می‌توانید **node ها** (Mac/iOS/Android/headless) را به آن Gateway ابری pair کنید تا به
    screen/camera/canvas محلی دسترسی داشته باشید یا فرمان‌هایی را روی laptop خود اجرا کنید، در حالی که
    Gateway در cloud باقی می‌ماند.

    هاب: [پلتفرم‌ها](/fa/platforms). دسترسی راه‌دور: [Gateway راه‌دور](/fa/gateway/remote).
    Node ها: [Node ها](/fa/nodes)، [CLI Node ها](/fa/cli/nodes).

  </Accordion>

  <Accordion title="آیا می‌توانم از OpenClaw بخواهم خودش را به‌روزرسانی کند؟">
    پاسخ کوتاه: **ممکن است، توصیه نمی‌شود**. جریان به‌روزرسانی می‌تواند
    Gateway را restart کند (که session فعال را قطع می‌کند)، ممکن است به یک git checkout تمیز نیاز داشته باشد، و
    می‌تواند برای تأیید prompt کند. امن‌تر: به‌روزرسانی‌ها را به‌عنوان operator از یک shell اجرا کنید.

    از CLI استفاده کنید:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    اگر مجبورید از یک agent خودکارسازی کنید:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    مستندات: [به‌روزرسانی](/fa/cli/update)، [به‌روزرسانی کردن](/fa/install/updating).

  </Accordion>

  <Accordion title="onboarding واقعاً چه کار می‌کند؟">
    `openclaw onboard` مسیر پیشنهادی setup است. در **حالت محلی** شما را در این موارد راهنمایی می‌کند:

    - **راه‌اندازی مدل/auth** (provider OAuth، کلیدهای API، setup-token آنتروپیک، به‌علاوهٔ گزینه‌های مدل محلی مانند LM Studio)
    - محل **Workspace** + فایل‌های bootstrap
    - **تنظیمات Gateway** (bind/port/auth/tailscale)
    - **کانال‌ها** (WhatsApp، Telegram، Discord، Mattermost، Signal، iMessage، به‌علاوهٔ Plugin های کانال bundled مانند QQ Bot)
    - **نصب daemon** (LaunchAgent در macOS؛ unit کاربر systemd در Linux/WSL2)
    - انتخاب **health check ها** و **skills**

    همچنین اگر مدل پیکربندی‌شدهٔ شما ناشناخته باشد یا auth نداشته باشد، هشدار می‌دهد.

  </Accordion>

  <Accordion title="آیا برای اجرای این به اشتراک Claude یا OpenAI نیاز دارم؟">
    نه. می‌توانید OpenClaw را با **کلیدهای API** (Anthropic/OpenAI/سایر موارد) یا با
    **مدل‌های فقط محلی** اجرا کنید تا داده‌های شما روی دستگاهتان بماند. اشتراک‌ها (Claude
    Pro/Max یا OpenAI Codex) راه‌های اختیاری برای احراز هویت آن provider ها هستند.

    برای Anthropic در OpenClaw، تقسیم‌بندی عملی این است:

    - **کلید API آنتروپیک**: billing معمول Anthropic API
    - **Claude CLI / auth اشتراک Claude در OpenClaw**: کارکنان Anthropic
      به ما گفته‌اند این استفاده دوباره مجاز است، و OpenClaw استفاده از `claude -p`
      را برای این integration مجاز می‌داند مگر اینکه Anthropic سیاست جدیدی منتشر کند

    برای host های gateway بلندمدت، کلیدهای API آنتروپیک همچنان setup
    قابل‌پیش‌بینی‌تری هستند. OAuth مربوط به OpenAI Codex به‌صراحت برای ابزارهای خارجی
    مانند OpenClaw پشتیبانی می‌شود.

    OpenClaw همچنین از گزینه‌های میزبانی‌شدهٔ دیگری با سبک اشتراک پشتیبانی می‌کند، از جمله
    **Qwen Cloud Coding Plan**، **MiniMax Coding Plan** و
    **Z.AI / GLM Coding Plan**.

    مستندات: [Anthropic](/fa/providers/anthropic)، [OpenAI](/fa/providers/openai)،
    [Qwen Cloud](/fa/providers/qwen)،
    [MiniMax](/fa/providers/minimax)، [مدل‌های GLM](/fa/providers/glm)،
    [مدل‌های محلی](/fa/gateway/local-models)، [مدل‌ها](/fa/concepts/models).

  </Accordion>

  <Accordion title="آیا می‌توانم بدون کلید API از اشتراک Claude Max استفاده کنم؟">
    بله.

    کارکنان Anthropic به ما گفته‌اند استفادهٔ شبیه OpenClaw از Claude CLI دوباره مجاز است، بنابراین
    OpenClaw احراز هویت اشتراک Claude و استفاده از `claude -p` را
    برای این integration مجاز می‌داند مگر اینکه Anthropic سیاست جدیدی منتشر کند. اگر
    قابل‌پیش‌بینی‌ترین setup سمت server را می‌خواهید، به‌جای آن از کلید API آنتروپیک استفاده کنید.

  </Accordion>

  <Accordion title="آیا از auth اشتراک Claude (Claude Pro یا Max) پشتیبانی می‌کنید؟">
    بله.

    کارکنان Anthropic به ما گفته‌اند این استفاده دوباره مجاز است، بنابراین OpenClaw استفادهٔ مجدد از
    Claude CLI و استفاده از `claude -p` را برای این integration مجاز می‌داند
    مگر اینکه Anthropic سیاست جدیدی منتشر کند.

    setup-token آنتروپیک همچنان به‌عنوان یک مسیر token پشتیبانی‌شدهٔ OpenClaw در دسترس است، اما OpenClaw اکنون استفادهٔ مجدد از Claude CLI و `claude -p` را در صورت امکان ترجیح می‌دهد.
    برای workload های production یا چندکاربره، auth با کلید API آنتروپیک همچنان انتخاب
    امن‌تر و قابل‌پیش‌بینی‌تری است. اگر گزینه‌های میزبانی‌شدهٔ دیگری با سبک اشتراک
    در OpenClaw می‌خواهید، [OpenAI](/fa/providers/openai)، [Qwen / Model
    Cloud](/fa/providers/qwen)، [MiniMax](/fa/providers/minimax)، و [مدل‌های GLM](/fa/providers/glm) را ببینید.

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="چرا از Anthropic خطای HTTP 429 rate_limit_error می‌بینم؟">
    این یعنی **quota/rate limit آنتروپیک** شما برای window فعلی تمام شده است. اگر از
    **Claude CLI** استفاده می‌کنید، صبر کنید تا window reset شود یا plan خود را ارتقا دهید. اگر از
    **کلید API آنتروپیک** استفاده می‌کنید، Anthropic Console را
    برای usage/billing بررسی کنید و در صورت نیاز limit ها را افزایش دهید.

    اگر پیام به‌طور مشخص این باشد:
    `Extra usage is required for long context requests`، درخواست در حال تلاش برای استفاده از نسخهٔ بتای زمینهٔ ۱ میلیونی Anthropic (`context1m: true`) است. این فقط زمانی کار می‌کند که اعتبارنامهٔ شما واجد شرایط صورتحساب زمینهٔ طولانی باشد (صورتحساب کلید API یا مسیر ورود Claude در OpenClaw با فعال بودن Extra Usage).

    نکته: یک **مدل جایگزین** تنظیم کنید تا OpenClaw بتواند وقتی یک ارائه‌دهنده با محدودیت نرخ مواجه است همچنان پاسخ دهد.
    [مدل‌ها](/fa/cli/models)، [OAuth](/fa/concepts/oauth)، و
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/fa/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) را ببینید.

  </Accordion>

  <Accordion title="آیا AWS Bedrock پشتیبانی می‌شود؟">
    بله. OpenClaw یک ارائه‌دهندهٔ داخلی **Amazon Bedrock (Converse)** دارد. با وجود نشانگرهای env مربوط به AWS، OpenClaw می‌تواند کاتالوگ Bedrock برای streaming/text را به‌صورت خودکار کشف کند و آن را به‌عنوان ارائه‌دهندهٔ ضمنی `amazon-bedrock` ادغام کند؛ در غیر این صورت می‌توانید `plugins.entries.amazon-bedrock.config.discovery.enabled` را صراحتاً فعال کنید یا یک ورودی ارائه‌دهندهٔ دستی اضافه کنید. [Amazon Bedrock](/fa/providers/bedrock) و [ارائه‌دهندگان مدل](/fa/providers/models) را ببینید. اگر یک جریان کلید مدیریت‌شده را ترجیح می‌دهید، یک پراکسی سازگار با OpenAI در جلوی Bedrock همچنان گزینه‌ای معتبر است.
  </Accordion>

  <Accordion title="احراز هویت Codex چگونه کار می‌کند؟">
    OpenClaw از **OpenAI Code (Codex)** از طریق OAuth (ورود با ChatGPT) پشتیبانی می‌کند. برای راه‌اندازی رایج، از
    `openai/gpt-5.5` با `agentRuntime.id: "codex"` استفاده کنید:
    احراز هویت اشتراک ChatGPT/Codex به‌همراه اجرای بومی app-server مربوط به Codex. فقط وقتی از
    `openai-codex/gpt-5.5` استفاده کنید که OAuth مربوط به Codex را از طریق runtime پیش‌فرض
    Codex می‌خواهید. دسترسی مستقیم با کلید API مربوط به OpenAI همچنان برای سطح‌های API غیرعاملی
    OpenAI و برای مدل‌های عاملی از طریق یک پروفایل کلید API مرتب‌شدهٔ
    `openai-codex` در دسترس است.
    [ارائه‌دهندگان مدل](/fa/concepts/model-providers) و [راه‌اندازی اولیه (CLI)](/fa/start/wizard) را ببینید.
  </Accordion>

  <Accordion title="چرا OpenClaw هنوز از openai-codex نام می‌برد؟">
    `openai-codex` شناسهٔ ارائه‌دهنده و پروفایل احراز هویت برای OAuth مربوط به ChatGPT/Codex است.
    پیکربندی‌های قدیمی‌تر از آن به‌عنوان پیشوند مدل هم استفاده می‌کردند:

    - `openai/gpt-5.5` = احراز هویت اشتراک ChatGPT/Codex با runtime بومی Codex برای نوبت‌های عامل
    - `openai-codex/gpt-5.5` = مسیر مدل قدیمی که با `openclaw doctor --fix` تعمیر می‌شود
    - `openai/gpt-5.5` به‌علاوهٔ یک پروفایل کلید API مرتب‌شدهٔ `openai-codex` = احراز هویت کلید API برای یک مدل عامل OpenAI
    - `openai-codex:...` = شناسهٔ پروفایل احراز هویت، نه یک ارجاع مدل

    اگر مسیر صورتحساب/محدودیت مستقیم OpenAI Platform را می‌خواهید،
    `OPENAI_API_KEY` را تنظیم کنید. اگر احراز هویت اشتراک ChatGPT/Codex را می‌خواهید، با
    `openclaw models auth login --provider openai-codex` وارد شوید. ارجاع مدل را به‌صورت
    `openai/gpt-5.5` نگه دارید؛ ارجاع‌های مدل `openai-codex/*` پیکربندی قدیمی هستند که
    `openclaw doctor --fix` بازنویسی می‌کند.

  </Accordion>

  <Accordion title="چرا محدودیت‌های OAuth مربوط به Codex می‌توانند با وب ChatGPT متفاوت باشند؟">
    OAuth مربوط به Codex از پنجره‌های سهمیهٔ مدیریت‌شده توسط OpenAI و وابسته به طرح استفاده می‌کند. در عمل،
    این محدودیت‌ها می‌توانند با تجربهٔ وب‌سایت/اپ ChatGPT متفاوت باشند، حتی وقتی
    هر دو به یک حساب متصل باشند.

    OpenClaw می‌تواند پنجره‌های مصرف/سهمیهٔ ارائه‌دهنده را که در حال حاضر قابل مشاهده‌اند در
    `openclaw models status` نشان دهد، اما استحقاق‌های وب ChatGPT را اختراع یا به دسترسی مستقیم API
    نرمال‌سازی نمی‌کند. اگر مسیر صورتحساب/محدودیت مستقیم OpenAI Platform را می‌خواهید، از `openai/*` با یک کلید API استفاده کنید.

  </Accordion>

  <Accordion title="آیا از احراز هویت اشتراک OpenAI (OAuth مربوط به Codex) پشتیبانی می‌کنید؟">
    بله. OpenClaw به‌طور کامل از **OAuth اشتراک OpenAI Code (Codex)** پشتیبانی می‌کند.
    OpenAI صراحتاً استفاده از OAuth اشتراکی را در ابزارها/گردش‌کارهای خارجی
    مانند OpenClaw مجاز می‌داند. راه‌اندازی اولیه می‌تواند جریان OAuth را برای شما اجرا کند.

    [OAuth](/fa/concepts/oauth)، [ارائه‌دهندگان مدل](/fa/concepts/model-providers)، و [راه‌اندازی اولیه (CLI)](/fa/start/wizard) را ببینید.

  </Accordion>

  <Accordion title="چگونه OAuth مربوط به Gemini CLI را راه‌اندازی کنم؟">
    Gemini CLI از یک **جریان احراز هویت Plugin** استفاده می‌کند، نه از client id یا secret در `openclaw.json`.

    مراحل:

    1. Gemini CLI را به‌صورت محلی نصب کنید تا `gemini` در `PATH` باشد
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin را فعال کنید: `openclaw plugins enable google`
    3. وارد شوید: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. مدل پیش‌فرض پس از ورود: `google-gemini-cli/gemini-3-flash-preview`
    5. اگر درخواست‌ها شکست خوردند، `GOOGLE_CLOUD_PROJECT` یا `GOOGLE_CLOUD_PROJECT_ID` را روی میزبان gateway تنظیم کنید

    این کار توکن‌های OAuth را در پروفایل‌های احراز هویت روی میزبان gateway ذخیره می‌کند. جزئیات: [ارائه‌دهندگان مدل](/fa/concepts/model-providers).

  </Accordion>

  <Accordion title="آیا یک مدل محلی برای گفت‌وگوهای معمولی مناسب است؟">
    معمولاً نه. OpenClaw به زمینهٔ بزرگ + ایمنی قوی نیاز دارد؛ کارت‌های کوچک کوتاه می‌کنند و نشت می‌دهند. اگر مجبورید، **بزرگ‌ترین** ساخت مدل را که می‌توانید به‌صورت محلی اجرا کنید (LM Studio) اجرا کنید و [/gateway/local-models](/fa/gateway/local-models) را ببینید. مدل‌های کوچک‌تر/quantized خطر prompt-injection را افزایش می‌دهند - [امنیت](/fa/gateway/security) را ببینید.
  </Accordion>

  <Accordion title="چگونه ترافیک مدل میزبانی‌شده را در یک منطقهٔ مشخص نگه دارم؟">
    نقطه‌پایان‌های مقید به منطقه را انتخاب کنید. OpenRouter گزینه‌های میزبانی‌شده در آمریکا را برای MiniMax، Kimi، و GLM ارائه می‌کند؛ نوع میزبانی‌شده در آمریکا را انتخاب کنید تا داده در همان منطقه بماند. همچنان می‌توانید Anthropic/OpenAI را در کنار این‌ها فهرست کنید، با استفاده از `models.mode: "merge"` تا گزینه‌های جایگزین در دسترس بمانند و در عین حال ارائه‌دهندهٔ منطقه‌ای انتخاب‌شده رعایت شود.
  </Accordion>

  <Accordion title="آیا برای نصب این باید Mac Mini بخرم؟">
    نه. OpenClaw روی macOS یا Linux اجرا می‌شود (Windows از طریق WSL2). Mac mini اختیاری است - بعضی‌ها
    یکی را به‌عنوان میزبان همیشه روشن می‌خرند، اما یک VPS کوچک، سرور خانگی، یا دستگاهی در ردهٔ Raspberry Pi هم کار می‌کند.

    فقط برای **ابزارهای مختص macOS** به Mac نیاز دارید. برای iMessage، از [BlueBubbles](/fa/channels/bluebubbles) استفاده کنید (توصیه‌شده) - سرور BlueBubbles روی هر Mac اجرا می‌شود، و Gateway می‌تواند روی Linux یا جای دیگری اجرا شود. اگر ابزارهای دیگری می‌خواهید که فقط مخصوص macOS هستند، Gateway را روی یک Mac اجرا کنید یا یک گره macOS را pair کنید.

    مستندات: [BlueBubbles](/fa/channels/bluebubbles)، [گره‌ها](/fa/nodes)، [حالت راه‌دور Mac](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="آیا برای پشتیبانی از iMessage به Mac mini نیاز دارم؟">
    به **یک دستگاه macOS** نیاز دارید که به Messages وارد شده باشد. لازم نیست Mac mini باشد -
    هر Mac کار می‌کند. برای iMessage **از [BlueBubbles](/fa/channels/bluebubbles) استفاده کنید** (توصیه‌شده) - سرور BlueBubbles روی macOS اجرا می‌شود، در حالی که Gateway می‌تواند روی Linux یا جای دیگری اجرا شود.

    راه‌اندازی‌های رایج:

    - Gateway را روی Linux/VPS اجرا کنید، و سرور BlueBubbles را روی هر Mac که به Messages وارد شده است اجرا کنید.
    - اگر ساده‌ترین راه‌اندازی تک‌دستگاهی را می‌خواهید، همه‌چیز را روی Mac اجرا کنید.

    مستندات: [BlueBubbles](/fa/channels/bluebubbles)، [گره‌ها](/fa/nodes)،
    [حالت راه‌دور Mac](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="اگر برای اجرای OpenClaw یک Mac mini بخرم، می‌توانم آن را به MacBook Pro خودم وصل کنم؟">
    بله. **Mac mini می‌تواند Gateway را اجرا کند**، و MacBook Pro شما می‌تواند به‌عنوان
    **گره** (دستگاه همراه) وصل شود. گره‌ها Gateway را اجرا نمی‌کنند - آن‌ها قابلیت‌های اضافی
    مانند صفحه‌نمایش/دوربین/canvas و `system.run` را روی همان دستگاه فراهم می‌کنند.

    الگوی رایج:

    - Gateway روی Mac mini (همیشه روشن).
    - MacBook Pro اپ macOS یا یک میزبان گره را اجرا می‌کند و با Gateway pair می‌شود.
    - برای دیدن آن از `openclaw nodes status` / `openclaw nodes list` استفاده کنید.

    مستندات: [گره‌ها](/fa/nodes)، [CLI گره‌ها](/fa/cli/nodes).

  </Accordion>

  <Accordion title="آیا می‌توانم از Bun استفاده کنم؟">
    Bun **توصیه نمی‌شود**. ما خطاهای runtime می‌بینیم، به‌ویژه با WhatsApp و Telegram.
    برای gatewayهای پایدار از **Node** استفاده کنید.

    اگر همچنان می‌خواهید Bun را آزمایش کنید، این کار را روی یک gateway غیرتولیدی
    بدون WhatsApp/Telegram انجام دهید.

  </Accordion>

  <Accordion title="Telegram: چه چیزی در allowFrom قرار می‌گیرد؟">
    `channels.telegram.allowFrom` **شناسهٔ کاربری Telegram فرستندهٔ انسانی** است (عددی). نام کاربری bot نیست.

    راه‌اندازی فقط شناسه‌های کاربری عددی را درخواست می‌کند. اگر از قبل ورودی‌های قدیمی `@username` در پیکربندی دارید، `openclaw doctor --fix` می‌تواند تلاش کند آن‌ها را resolve کند.

    امن‌تر (بدون bot شخص ثالث):

    - به bot خود DM بدهید، سپس `openclaw logs --follow` را اجرا کنید و `from.id` را بخوانید.

    Bot API رسمی:

    - به bot خود DM بدهید، سپس `https://api.telegram.org/bot<bot_token>/getUpdates` را فراخوانی کنید و `message.from.id` را بخوانید.

    شخص ثالث (حریم خصوصی کمتر):

    - به `@userinfobot` یا `@getidsbot` DM بدهید.

    [/channels/telegram](/fa/channels/telegram#access-control-and-activation) را ببینید.

  </Accordion>

  <Accordion title="آیا چند نفر می‌توانند از یک شمارهٔ WhatsApp با نمونه‌های مختلف OpenClaw استفاده کنند؟">
    بله، از طریق **مسیریابی چندعاملی**. **DM** مربوط به WhatsApp هر فرستنده را (peer با `kind: "direct"`، فرستندهٔ E.164 مانند `+15551234567`) به یک `agentId` متفاوت bind کنید، تا هر نفر workspace و store نشست خودش را داشته باشد. پاسخ‌ها همچنان از **همان حساب WhatsApp** ارسال می‌شوند، و کنترل دسترسی DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) در هر حساب WhatsApp سراسری است. [مسیریابی چندعاملی](/fa/concepts/multi-agent) و [WhatsApp](/fa/channels/whatsapp) را ببینید.
  </Accordion>

  <Accordion title='آیا می‌توانم یک عامل "گفت‌وگوی سریع" و یک عامل "Opus برای کدنویسی" اجرا کنم؟'>
    بله. از مسیریابی چندعاملی استفاده کنید: به هر عامل مدل پیش‌فرض خودش را بدهید، سپس مسیرهای ورودی (حساب ارائه‌دهنده یا peerهای مشخص) را به هر عامل bind کنید. پیکربندی نمونه در [مسیریابی چندعاملی](/fa/concepts/multi-agent) قرار دارد. همچنین [مدل‌ها](/fa/concepts/models) و [پیکربندی](/fa/gateway/configuration) را ببینید.
  </Accordion>

  <Accordion title="آیا Homebrew روی Linux کار می‌کند؟">
    بله. Homebrew از Linux پشتیبانی می‌کند (Linuxbrew). راه‌اندازی سریع:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    اگر OpenClaw را از طریق systemd اجرا می‌کنید، مطمئن شوید PATH مربوط به سرویس شامل `/home/linuxbrew/.linuxbrew/bin` (یا پیشوند brew شما) باشد تا ابزارهای نصب‌شده با `brew` در shellهای غیر login resolve شوند.
    ساخت‌های اخیر همچنین مسیرهای رایج bin کاربر را در سرویس‌های Linux systemd به ابتدا اضافه می‌کنند (برای مثال `~/.local/bin`، `~/.npm-global/bin`، `~/.local/share/pnpm`، `~/.bun/bin`) و وقتی `PNPM_HOME`، `NPM_CONFIG_PREFIX`، `BUN_INSTALL`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `NVM_DIR`، و `FNM_DIR` تنظیم باشند به آن‌ها احترام می‌گذارند.

  </Accordion>

  <Accordion title="تفاوت بین نصب قابل هک با git و نصب npm">
    - **نصب قابل هک (git):** checkout کامل سورس، قابل ویرایش، بهترین گزینه برای مشارکت‌کنندگان.
      شما buildها را به‌صورت محلی اجرا می‌کنید و می‌توانید کد/مستندات را patch کنید.
    - **نصب npm:** نصب CLI سراسری، بدون repo، بهترین گزینه برای «فقط اجرا کن».
      به‌روزرسانی‌ها از dist-tagهای npm می‌آیند.

    مستندات: [شروع به کار](/fa/start/getting-started)، [به‌روزرسانی](/fa/install/updating).

  </Accordion>

  <Accordion title="آیا می‌توانم بعداً بین نصب‌های npm و git جابه‌جا شوم؟">
    بله. وقتی OpenClaw از قبل نصب شده است از `openclaw update --channel ...` استفاده کنید.
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

    برای پیش‌نمایش تغییر حالت برنامه‌ریزی‌شده، ابتدا `--dry-run` را اضافه کنید. به‌روزرسان
    پیگیری‌های Doctor را اجرا می‌کند، منابع Plugin را برای کانال هدف تازه‌سازی می‌کند، و
    gateway را restart می‌کند مگر اینکه `--no-restart` را پاس بدهید.

    نصب‌کننده هم می‌تواند هر دو حالت را اجباری کند:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    نکته‌های پشتیبان‌گیری: [راهبرد پشتیبان‌گیری](/fa/help/faq#where-things-live-on-disk) را ببینید.

  </Accordion>

  <Accordion title="آیا باید Gateway را روی لپ‌تاپم اجرا کنم یا روی VPS؟">
    پاسخ کوتاه: **اگر قابلیت اطمینان ۲۴/۷ می‌خواهید، از VPS استفاده کنید**. اگر
    کمترین اصطکاک را می‌خواهید و با sleep/restart مشکلی ندارید، آن را محلی اجرا کنید.

    **لپ‌تاپ (Gateway محلی)**

    - **مزایا:** بدون هزینه سرور، دسترسی مستقیم به فایل‌های محلی، پنجره مرورگر زنده.
    - **معایب:** خواب/قطعی شبکه = قطع اتصال‌ها، به‌روزرسانی‌ها/راه‌اندازی‌های دوباره سیستم‌عامل اختلال ایجاد می‌کنند، باید بیدار بماند.

    **VPS / ابر**

    - **مزایا:** همیشه روشن، شبکه پایدار، بدون مشکل خواب لپ‌تاپ، نگه داشتن آن در حال اجرا آسان‌تر است.
    - **معایب:** اغلب بدون محیط گرافیکی اجرا می‌شود (از اسکرین‌شات‌ها استفاده کنید)، فقط دسترسی از راه دور به فایل‌ها، برای به‌روزرسانی‌ها باید SSH کنید.

    **یادداشت مخصوص OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord همگی از روی یک VPS به‌خوبی کار می‌کنند. تنها مصالحه واقعی بین **مرورگر بدون محیط گرافیکی** و پنجره قابل مشاهده است. [مرورگر](/fa/tools/browser) را ببینید.

    **پیش‌فرض پیشنهادی:** اگر قبلاً قطع اتصال Gateway داشته‌اید، VPS. حالت محلی زمانی عالی است که فعالانه از Mac استفاده می‌کنید و دسترسی به فایل‌های محلی یا خودکارسازی UI با مرورگر قابل مشاهده می‌خواهید.

  </Accordion>

  <Accordion title="اجرای OpenClaw روی یک ماشین اختصاصی چقدر مهم است؟">
    الزامی نیست، اما **برای قابلیت اطمینان و ایزوله‌سازی توصیه می‌شود**.

    - **میزبان اختصاصی (VPS/Mac mini/Pi):** همیشه روشن، اختلال‌های کمتر ناشی از خواب/راه‌اندازی دوباره، مجوزهای تمیزتر، نگه داشتن آن در حال اجرا آسان‌تر است.
    - **لپ‌تاپ/دسکتاپ مشترک:** برای آزمایش و استفاده فعال کاملاً مناسب است، اما وقتی ماشین به خواب می‌رود یا به‌روزرسانی می‌شود، انتظار توقف داشته باشید.

    اگر بهترین حالت هر دو را می‌خواهید، Gateway را روی یک میزبان اختصاصی نگه دارید و لپ‌تاپ خود را به‌عنوان یک **Node** برای ابزارهای صفحه محلی/دوربین/exec جفت کنید. [Nodeها](/fa/nodes) را ببینید.
    برای راهنمایی امنیتی، [امنیت](/fa/gateway/security) را بخوانید.

  </Accordion>

  <Accordion title="حداقل نیازمندی‌های VPS و سیستم‌عامل پیشنهادی چیست؟">
    OpenClaw سبک است. برای یک Gateway پایه + یک کانال چت:

    - **حداقل مطلق:** ۱ vCPU، ۱ گیگابایت RAM، حدود ۵۰۰ مگابایت دیسک.
    - **پیشنهادی:** ۱ تا ۲ vCPU، ۲ گیگابایت RAM یا بیشتر برای فضای مانور (لاگ‌ها، رسانه، چندین کانال). ابزارهای Node و خودکارسازی مرورگر می‌توانند منابع زیادی مصرف کنند.

    سیستم‌عامل: از **Ubuntu LTS** (یا هر Debian/Ubuntu مدرن) استفاده کنید. مسیر نصب Linux در آنجا بهتر آزمایش شده است.

    مستندات: [Linux](/fa/platforms/linux)، [میزبانی VPS](/fa/vps).

  </Accordion>

  <Accordion title="آیا می‌توانم OpenClaw را در VM اجرا کنم و نیازمندی‌ها چیست؟">
    بله. با VM همانند VPS رفتار کنید: باید همیشه روشن، در دسترس، و دارای RAM کافی
    برای Gateway و هر کانالی باشد که فعال می‌کنید.

    راهنمای پایه:

    - **حداقل مطلق:** ۱ vCPU، ۱ گیگابایت RAM.
    - **پیشنهادی:** اگر چندین کانال، خودکارسازی مرورگر، یا ابزارهای رسانه‌ای اجرا می‌کنید، ۲ گیگابایت RAM یا بیشتر.
    - **سیستم‌عامل:** Ubuntu LTS یا Debian/Ubuntu مدرن دیگر.

    اگر روی Windows هستید، **WSL2 آسان‌ترین راه‌اندازی به سبک VM** است و بهترین سازگاری
    ابزارها را دارد. [Windows](/fa/platforms/windows)، [میزبانی VPS](/fa/vps) را ببینید.
    اگر macOS را در VM اجرا می‌کنید، [macOS VM](/fa/install/macos-vm) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [FAQ](/fa/help/faq) — پرسش‌های متداول اصلی (مدل‌ها، نشست‌ها، gateway، امنیت، موارد بیشتر)
- [نمای کلی نصب](/fa/install)
- [شروع به کار](/fa/start/getting-started)
- [عیب‌یابی](/fa/help/troubleshooting)
