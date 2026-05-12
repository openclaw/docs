---
read_when:
    - نصب تازه، گیر کردن فرآیند راه‌اندازی اولیه، یا خطاهای اجرای نخست
    - انتخاب احراز هویت و اشتراک‌های ارائه‌دهنده
    - نمی‌توان به docs.openclaw.ai دسترسی پیدا کرد، نمی‌توان داشبورد را باز کرد، نصب گیر کرده است
sidebarTitle: First-run FAQ
summary: 'پرسش‌های متداول: شروع سریع و راه‌اندازی اجرای نخست — نصب، آماده‌سازی اولیه، احراز هویت، اشتراک‌ها، خطاهای اولیه'
title: 'پرسش‌های متداول: راه‌اندازی در نخستین اجرا'
x-i18n:
    generated_at: "2026-05-12T00:59:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24ce8cda091fd7d1bdcb405d421a1a3cabb134c3cc36b42f11b9b3f97782794b
    source_path: help/faq-first-run.md
    workflow: 16
---

  سؤالات و پاسخ‌های شروع سریع و اجرای نخست. برای عملیات روزمره، مدل‌ها، احراز هویت، نشست‌ها،
  و عیب‌یابی، [سؤالات متداول](/fa/help/faq) اصلی را ببینید.

  ## شروع سریع و راه‌اندازی اجرای نخست

  <AccordionGroup>
  <Accordion title="گیر کرده‌ام، سریع‌ترین راه برای رها شدن">
    از یک عامل هوش مصنوعی محلی استفاده کنید که بتواند **دستگاه شما را ببیند**. این کار بسیار مؤثرتر از پرسیدن
    در Discord است، چون بیشتر موارد «گیر کرده‌ام» **مشکلات پیکربندی یا محیط محلی** هستند که
    کمک‌کنندگان راه دور نمی‌توانند بررسی کنند.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    این ابزارها می‌توانند repo را بخوانند، فرمان‌ها را اجرا کنند، لاگ‌ها را بررسی کنند، و به رفع راه‌اندازی
    در سطح دستگاه شما کمک کنند (PATH، سرویس‌ها، مجوزها، فایل‌های احراز هویت). از طریق
    نصب قابل‌هک (git)، **checkout کامل منبع** را به آن‌ها بدهید:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    این فرمان OpenClaw را **از یک git checkout** نصب می‌کند، پس عامل می‌تواند کد + مستندات را بخواند و
    درباره نسخه دقیقی که اجرا می‌کنید استدلال کند. همیشه می‌توانید بعداً با اجرای دوباره نصب‌کننده بدون
    `--install-method git` به نسخه پایدار برگردید.

    نکته: از عامل بخواهید رفع مشکل را **برنامه‌ریزی و نظارت** کند (گام‌به‌گام)، سپس فقط
    فرمان‌های لازم را اجرا کند. این کار تغییرات را کوچک و ممیزی آن‌ها را آسان‌تر نگه می‌دارد.

    اگر یک باگ یا رفع واقعی پیدا کردید، لطفاً یک issue در GitHub ثبت کنید یا یک PR بفرستید:
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
    - `openclaw models status`: احراز هویت provider + دسترس‌پذیری مدل را بررسی می‌کند.
    - `openclaw doctor`: مشکلات رایج پیکربندی/وضعیت را اعتبارسنجی و تعمیر می‌کند.

    بررسی‌های CLI مفید دیگر: `openclaw status --all`، `openclaw logs --follow`،
    `openclaw gateway status`، `openclaw health --verbose`.

    حلقه اشکال‌زدایی سریع: [۶۰ ثانیه اول اگر چیزی خراب است](/fa/help/faq#first-60-seconds-if-something-is-broken).
    مستندات نصب: [نصب](/fa/install)، [فلگ‌های نصب‌کننده](/fa/install/installer)، [به‌روزرسانی](/fa/install/updating).

  </Accordion>

  <Accordion title="Heartbeat مدام رد می‌شود. دلیل‌های رد شدن یعنی چه؟">
    دلیل‌های رایج رد شدن Heartbeat:

    - `quiet-hours`: بیرون از بازه active-hours پیکربندی‌شده
    - `empty-heartbeat-file`: `HEARTBEAT.md` وجود دارد اما فقط داربست خالی/فقط‌سربرگ دارد
    - `no-tasks-due`: حالت وظیفه `HEARTBEAT.md` فعال است اما هنوز هیچ‌کدام از بازه‌های وظایف موعدشان نرسیده است
    - `alerts-disabled`: همه قابلیت‌های نمایش Heartbeat غیرفعال‌اند (`showOk`، `showAlerts`، و `useIndicator` همگی خاموش‌اند)

    در حالت وظیفه، زمان‌های موعد فقط پس از تکمیل یک اجرای واقعی Heartbeat
    جلو برده می‌شوند. اجراهای ردشده وظایف را تکمیل‌شده علامت‌گذاری نمی‌کنند.

    مستندات: [Heartbeat](/fa/gateway/heartbeat)، [اتوماسیون](/fa/automation).

  </Accordion>

  <Accordion title="روش پیشنهادی برای نصب و راه‌اندازی OpenClaw">
    repo اجرای از منبع و استفاده از onboarding را توصیه می‌کند:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    wizard همچنین می‌تواند دارایی‌های UI را خودکار بسازد. پس از onboarding، معمولاً Gateway را روی پورت **18789** اجرا می‌کنید.

    از منبع (مشارکت‌کنندگان/dev):

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

  <Accordion title="بعد از onboarding چگونه داشبورد را باز کنم؟">
    wizard بلافاصله پس از onboarding مرورگر شما را با یک URL تمیز (بدون توکن) برای داشبورد باز می‌کند و همچنین پیوند را در خلاصه چاپ می‌کند. آن زبانه را باز نگه دارید؛ اگر باز نشد، URL چاپ‌شده را روی همان دستگاه copy/paste کنید.
  </Accordion>

  <Accordion title="چگونه داشبورد را روی localhost در برابر remote احراز هویت کنم؟">
    **Localhost (همان دستگاه):**

    - `http://127.0.0.1:18789/` را باز کنید.
    - اگر احراز هویت shared-secret خواست، توکن یا گذرواژه پیکربندی‌شده را در تنظیمات Control UI جای‌گذاری کنید.
    - منبع توکن: `gateway.auth.token` (یا `OPENCLAW_GATEWAY_TOKEN`).
    - منبع گذرواژه: `gateway.auth.password` (یا `OPENCLAW_GATEWAY_PASSWORD`).
    - اگر هنوز هیچ shared secret پیکربندی نشده است، با `openclaw doctor --generate-gateway-token` یک توکن تولید کنید.

    **نه روی localhost:**

    - **Tailscale Serve** (توصیه‌شده): bind loopback را نگه دارید، `openclaw gateway --tailscale serve` را اجرا کنید، `https://<magicdns>/` را باز کنید. اگر `gateway.auth.allowTailscale` برابر `true` باشد، headerهای هویت احراز هویت Control UI/WebSocket را برآورده می‌کنند (بدون shared secret جای‌گذاری‌شده، با فرض اعتماد به میزبان gateway)؛ APIهای HTTP همچنان به احراز هویت shared-secret نیاز دارند مگر اینکه عمداً از private-ingress `none` یا احراز هویت HTTP با trusted-proxy استفاده کنید.
      تلاش‌های هم‌زمان ناموفق Serve auth از همان کلاینت پیش از ثبت شدن توسط failed-auth limiter سریالی می‌شوند، بنابراین تلاش ناموفق دوم می‌تواند از قبل `retry later` نشان دهد.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` را اجرا کنید (یا احراز هویت گذرواژه را پیکربندی کنید)، `http://<tailscale-ip>:18789/` را باز کنید، سپس shared secret مطابق را در تنظیمات داشبورد جای‌گذاری کنید.
    - **Reverse proxy آگاه از هویت**: Gateway را پشت یک proxy مورداعتماد نگه دارید، `gateway.auth.mode: "trusted-proxy"` را پیکربندی کنید، سپس URL proxy را باز کنید. proxyهای loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند.
    - **تونل SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` سپس `http://127.0.0.1:18789/` را باز کنید. احراز هویت shared-secret همچنان روی تونل اعمال می‌شود؛ اگر خواسته شد، توکن یا گذرواژه پیکربندی‌شده را جای‌گذاری کنید.

    برای حالت‌های bind و جزئیات احراز هویت، [داشبورد](/fa/web/dashboard) و [سطح‌های وب](/fa/web) را ببینید.

  </Accordion>

  <Accordion title="چرا برای تأییدهای chat دو پیکربندی exec approval وجود دارد؟">
    آن‌ها لایه‌های متفاوتی را کنترل می‌کنند:

    - `approvals.exec`: promptهای تأیید را به مقصدهای chat ارسال می‌کند
    - `channels.<channel>.execApprovals`: آن کانال را برای exec approvals به‌عنوان یک کلاینت تأیید بومی عمل می‌دهد

    سیاست exec میزبان همچنان دروازه واقعی تأیید است. پیکربندی chat فقط کنترل می‌کند promptهای تأیید
    کجا ظاهر شوند و افراد چگونه بتوانند به آن‌ها پاسخ دهند.

    در بیشتر راه‌اندازی‌ها به **هر دو** نیاز ندارید:

    - اگر chat از قبل از فرمان‌ها و پاسخ‌ها پشتیبانی می‌کند، `/approve` در همان chat از مسیر مشترک کار می‌کند.
    - اگر یک کانال بومی پشتیبانی‌شده بتواند تأییدکنندگان را با ایمنی استنباط کند، OpenClaw اکنون وقتی `channels.<channel>.execApprovals.enabled` تنظیم نشده یا `"auto"` است، تأییدهای بومی DM-first را خودکار فعال می‌کند.
    - وقتی کارت‌ها/دکمه‌های تأیید بومی در دسترس‌اند، آن UI بومی مسیر اصلی است؛ عامل فقط وقتی باید فرمان دستی `/approve` را شامل کند که نتیجه ابزار بگوید تأییدهای chat در دسترس نیستند یا تأیید دستی تنها مسیر است.
    - از `approvals.exec` فقط وقتی استفاده کنید که promptها باید به chatهای دیگر یا اتاق‌های ops صریح هم ارسال شوند.
    - از `channels.<channel>.execApprovals.target: "channel"` یا `"both"` فقط وقتی استفاده کنید که صریحاً می‌خواهید promptهای تأیید دوباره در اتاق/موضوع مبدأ ارسال شوند.
    - تأییدهای Plugin دوباره جدا هستند: آن‌ها به‌صورت پیش‌فرض از `/approve` در همان chat، ارسال اختیاری `approvals.plugin`، و فقط در بعضی کانال‌های بومی از مدیریت plugin-approval-native در کنار آن استفاده می‌کنند.

    نسخه کوتاه: forwarding برای مسیریابی است، پیکربندی کلاینت بومی برای UX غنی‌تر و ویژه کانال است.
    [Exec Approvals](/fa/tools/exec-approvals) را ببینید.

  </Accordion>

  <Accordion title="به چه runtime نیاز دارم؟">
    Node **>= 22** لازم است. `pnpm` توصیه می‌شود. Bun برای Gateway **توصیه نمی‌شود**.
  </Accordion>

  <Accordion title="آیا روی Raspberry Pi اجرا می‌شود؟">
    بله. Gateway سبک است - مستندات **512MB-1GB RAM**، **1 core**، و حدود **500MB**
    دیسک را برای استفاده شخصی کافی می‌دانند، و اشاره می‌کنند که **Raspberry Pi 4 می‌تواند آن را اجرا کند**.

    اگر فضای تنفسی بیشتری می‌خواهید (لاگ‌ها، رسانه، سرویس‌های دیگر)، **2GB توصیه می‌شود**، اما
    حداقل سخت نیست.

    نکته: یک Pi/VPS کوچک می‌تواند میزبان Gateway باشد، و می‌توانید **nodeها** را روی لپ‌تاپ/گوشی خود برای
    صفحه محلی/دوربین/canvas یا اجرای فرمان pair کنید. [Nodes](/fa/nodes) را ببینید.

  </Accordion>

  <Accordion title="نکته‌ای برای نصب‌های Raspberry Pi دارید؟">
    نسخه کوتاه: کار می‌کند، اما انتظار لبه‌های زبر داشته باشید.

    - از سیستم‌عامل **64-bit** استفاده کنید و Node >= 22 را نگه دارید.
    - **نصب قابل‌هک (git)** را ترجیح دهید تا بتوانید لاگ‌ها را ببینید و سریع به‌روزرسانی کنید.
    - بدون کانال‌ها/Skills شروع کنید، سپس آن‌ها را یکی‌یکی اضافه کنید.
    - اگر به مشکلات binary عجیب برخوردید، معمولاً مشکل **سازگاری ARM** است.

    مستندات: [Linux](/fa/platforms/linux)، [نصب](/fa/install).

  </Accordion>

  <Accordion title="روی wake up my friend گیر کرده است / onboarding سر از تخم درنمی‌آورد. حالا چه؟">
    آن صفحه به در دسترس بودن و احراز هویت شدن Gateway وابسته است. TUI همچنین در نخستین hatch
    به‌صورت خودکار "Wake up, my friend!" را می‌فرستد. اگر آن خط را با **بدون پاسخ**
    می‌بینید و توکن‌ها روی 0 می‌مانند، عامل هرگز اجرا نشده است.

    1. Gateway را restart کنید:

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

    اگر Gateway راه دور است، مطمئن شوید اتصال tunnel/Tailscale برقرار است و UI
    به Gateway درست اشاره می‌کند. [دسترسی راه دور](/fa/gateway/remote) را ببینید.

  </Accordion>

  <Accordion title="آیا می‌توانم راه‌اندازی خود را بدون تکرار onboarding به دستگاه جدید (Mac mini) منتقل کنم؟">
    بله. **دایرکتوری وضعیت** و **workspace** را کپی کنید، سپس یک بار Doctor را اجرا کنید. این کار
    bot شما را «دقیقاً همان» نگه می‌دارد (حافظه، تاریخچه نشست، احراز هویت، و وضعیت کانال)
    تا وقتی که **هر دو** مکان را کپی کنید:

    1. OpenClaw را روی دستگاه جدید نصب کنید.
    2. `$OPENCLAW_STATE_DIR` (پیش‌فرض: `~/.openclaw`) را از دستگاه قدیمی کپی کنید.
    3. workspace خود را کپی کنید (پیش‌فرض: `~/.openclaw/workspace`).
    4. `openclaw doctor` را اجرا کنید و سرویس Gateway را restart کنید.

    این کار config، پروفایل‌های احراز هویت، اعتبارنامه‌های WhatsApp، نشست‌ها، و memory را حفظ می‌کند. اگر در
    حالت remote هستید، به یاد داشته باشید میزبان gateway مالک session store و workspace است.

    **مهم:** اگر فقط workspace خود را به GitHub commit/push کنید، دارید از
    **memory + فایل‌های bootstrap** پشتیبان می‌گیرید، اما **نه** از تاریخچه نشست یا احراز هویت. آن‌ها
    زیر `~/.openclaw/` زندگی می‌کنند (برای نمونه `~/.openclaw/agents/<agentId>/sessions/`).

    مرتبط: [مهاجرت](/fa/install/migrating)، [چیزها روی دیسک کجا زندگی می‌کنند](/fa/help/faq#where-things-live-on-disk)،
    [workspace عامل](/fa/concepts/agent-workspace)، [Doctor](/fa/gateway/doctor)،
    [حالت remote](/fa/gateway/remote).

  </Accordion>

  <Accordion title="از کجا ببینم در آخرین نسخه چه چیز جدیدی آمده است؟">
    changelog GitHub را بررسی کنید:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    جدیدترین مدخل‌ها در بالا هستند. اگر بخش بالایی با **Unreleased** علامت‌گذاری شده باشد، بخش تاریخ‌دار بعدی
    آخرین نسخه منتشرشده است. مدخل‌ها بر اساس **Highlights**، **Changes**، و
    **Fixes** گروه‌بندی می‌شوند (به‌علاوه بخش‌های docs/other در صورت نیاز).

  </Accordion>

  <Accordion title="نمی‌توانم به docs.openclaw.ai دسترسی داشته باشم (خطای SSL)">
    برخی اتصال‌های Comcast/Xfinity به‌اشتباه `docs.openclaw.ai` را از طریق Xfinity
    Advanced Security مسدود می‌کنند. آن را غیرفعال کنید یا `docs.openclaw.ai` را allowlist کنید، سپس دوباره تلاش کنید.
    لطفاً با گزارش در اینجا به رفع مسدودی آن کمک کنید: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    اگر هنوز نمی‌توانید به سایت برسید، مستندات روی GitHub mirror شده‌اند:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="تفاوت بین پایدار و بتا">
    **پایدار** و **بتا** **dist-tagهای npm** هستند، نه خطوط کد جداگانه:

    - `latest` = پایدار
    - `beta` = ساخت اولیه برای آزمایش

    معمولاً یک انتشار پایدار ابتدا روی **بتا** قرار می‌گیرد، سپس یک مرحلهٔ
    ارتقای صریح همان نسخه را به `latest` منتقل می‌کند. نگه‌دارندگان همچنین می‌توانند
    در صورت نیاز مستقیماً روی `latest` منتشر کنند. به همین دلیل بتا و پایدار پس از
    ارتقا می‌توانند به **همان نسخه** اشاره کنند.

    ببینید چه چیزهایی تغییر کرده است:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    برای دستورهای تک‌خطی نصب و تفاوت بین بتا و dev، آکاردئون زیر را ببینید.

  </Accordion>

  <Accordion title="چگونه نسخهٔ بتا را نصب کنم و تفاوت بین بتا و dev چیست؟">
    **بتا** همان dist-tag در npm با نام `beta` است (ممکن است پس از ارتقا با `latest` یکسان باشد).
    **Dev** سر متحرک `main` (در git) است؛ وقتی منتشر شود، از dist-tag در npm با نام `dev` استفاده می‌کند.

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

    1. **کانال Dev (checkout در git):**

    ```bash
    openclaw update --channel dev
    ```

    این کار به شاخهٔ `main` جابه‌جا می‌شود و از منبع به‌روزرسانی می‌کند.

    2. **نصب قابل‌هک (از سایت نصب‌کننده):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    این کار یک مخزن محلی قابل ویرایش به شما می‌دهد که سپس می‌توانید از طریق git به‌روزرسانی کنید.

    اگر ترجیح می‌دهید به‌صورت دستی یک clone تمیز داشته باشید، از این استفاده کنید:

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

    اگر متوقف شد، از [گیرکردن نصب‌کننده](#quick-start-and-first-run-setup)
    و حلقهٔ سریع اشکال‌زدایی در [گیر کرده‌ام](#quick-start-and-first-run-setup) استفاده کنید.

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

  <Accordion title="نصب Windows می‌گوید git پیدا نشد یا openclaw شناخته نمی‌شود">
    دو مشکل رایج در Windows:

    **۱) خطای npm با spawn git / git پیدا نشد**

    - **Git for Windows** را نصب کنید و مطمئن شوید `git` در PATH شما قرار دارد.
    - PowerShell را ببندید و دوباره باز کنید، سپس نصب‌کننده را دوباره اجرا کنید.

    **۲) پس از نصب، openclaw شناخته نمی‌شود**

    - پوشهٔ bin سراسری npm شما در PATH نیست.
    - مسیر را بررسی کنید:

      ```powershell
      npm config get prefix
      ```

    - آن دایرکتوری را به PATH کاربری خود اضافه کنید (در Windows پسوند `\bin` لازم نیست؛ در بیشتر سیستم‌ها `%AppData%\npm` است).
    - پس از به‌روزرسانی PATH، PowerShell را ببندید و دوباره باز کنید.

    اگر روان‌ترین راه‌اندازی Windows را می‌خواهید، به‌جای Windows بومی از **WSL2** استفاده کنید.
    مستندات: [Windows](/fa/platforms/windows).

  </Accordion>

  <Accordion title="خروجی exec در Windows متن چینی درهم‌ریخته نشان می‌دهد - چه کار کنم؟">
    این معمولاً ناسازگاری صفحهٔ کد کنسول در shellهای بومی Windows است.

    نشانه‌ها:

    - خروجی `system.run`/`exec` چینی را به‌صورت mojibake نمایش می‌دهد
    - همان دستور در یک پروفایل ترمینال دیگر درست به نظر می‌رسد

    راه‌حل سریع در PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    سپس Gateway را راه‌اندازی مجدد کنید و دستور خود را دوباره امتحان کنید:

    ```powershell
    openclaw gateway restart
    ```

    اگر همچنان این مشکل را در آخرین OpenClaw بازتولید می‌کنید، آن را اینجا پیگیری/گزارش کنید:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="مستندات به پرسش من پاسخ نداد - چگونه پاسخ بهتری بگیرم؟">
    از **نصب قابل‌هک (git)** استفاده کنید تا کل منبع و مستندات را به‌صورت محلی داشته باشید، سپس
    از bot خود (یا Claude/Codex) _از همان پوشه_ بپرسید تا بتواند repo را بخواند و دقیق پاسخ دهد.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    جزئیات بیشتر: [نصب](/fa/install) و [پرچم‌های نصب‌کننده](/fa/install/installer).

  </Accordion>

  <Accordion title="چگونه OpenClaw را روی Linux نصب کنم؟">
    پاسخ کوتاه: راهنمای Linux را دنبال کنید، سپس onboarding را اجرا کنید.

    - مسیر سریع Linux + نصب سرویس: [Linux](/fa/platforms/linux).
    - راهنمای کامل گام‌به‌گام: [شروع به کار](/fa/start/getting-started).
    - نصب‌کننده + به‌روزرسانی‌ها: [نصب و به‌روزرسانی‌ها](/fa/install/updating).

  </Accordion>

  <Accordion title="چگونه OpenClaw را روی VPS نصب کنم؟">
    هر VPS مبتنی بر Linux کار می‌کند. روی سرور نصب کنید، سپس از SSH/Tailscale برای دسترسی به Gateway استفاده کنید.

    راهنماها: [exe.dev](/fa/install/exe-dev)، [Hetzner](/fa/install/hetzner)، [Fly.io](/fa/install/fly).
    دسترسی از راه دور: [Gateway از راه دور](/fa/gateway/remote).

  </Accordion>

  <Accordion title="راهنماهای نصب ابری/VPS کجا هستند؟">
    ما یک **هاب میزبانی** با ارائه‌دهندگان رایج نگه می‌داریم. یکی را انتخاب کنید و راهنما را دنبال کنید:

    - [میزبانی VPS](/fa/vps) (همهٔ ارائه‌دهندگان در یک جا)
    - [Fly.io](/fa/install/fly)
    - [Hetzner](/fa/install/hetzner)
    - [exe.dev](/fa/install/exe-dev)

    سازوکار آن در ابر: **Gateway روی سرور اجرا می‌شود** و شما از
    لپ‌تاپ/تلفن خود از طریق Control UI (یا Tailscale/SSH) به آن دسترسی دارید. وضعیت + workspace شما
    روی سرور قرار دارد، بنابراین میزبان را منبع حقیقت در نظر بگیرید و از آن پشتیبان بگیرید.

    می‌توانید **nodeها** (Mac/iOS/Android/headless) را به آن Gateway ابری جفت کنید تا به
    صفحه/دوربین/canvas محلی دسترسی داشته باشید یا در حالی که
    Gateway در ابر می‌ماند، دستورهایی را روی لپ‌تاپ خود اجرا کنید.

    هاب: [پلتفرم‌ها](/fa/platforms). دسترسی از راه دور: [Gateway از راه دور](/fa/gateway/remote).
    Nodeها: [Nodeها](/fa/nodes)، [CLI Nodeها](/fa/cli/nodes).

  </Accordion>

  <Accordion title="آیا می‌توانم از OpenClaw بخواهم خودش را به‌روزرسانی کند؟">
    پاسخ کوتاه: **ممکن است، توصیه نمی‌شود**. جریان به‌روزرسانی می‌تواند
    Gateway را راه‌اندازی مجدد کند (که نشست فعال را قطع می‌کند)، ممکن است به یک checkout تمیز git نیاز داشته باشد، و
    می‌تواند برای تأیید درخواست بدهد. امن‌تر است: به‌روزرسانی‌ها را به‌عنوان اپراتور از یک shell اجرا کنید.

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

  <Accordion title="onboarding دقیقاً چه کاری انجام می‌دهد؟">
    `openclaw onboard` مسیر راه‌اندازی پیشنهادی است. در **حالت محلی** شما را در این موارد راهنمایی می‌کند:

    - **راه‌اندازی مدل/احراز هویت** (OAuth ارائه‌دهنده، کلیدهای API، setup-token برای Anthropic، به‌علاوهٔ گزینه‌های مدل محلی مانند LM Studio)
    - مکان **Workspace** + فایل‌های bootstrap
    - **تنظیمات Gateway** (bind/port/auth/tailscale)
    - **کانال‌ها** (WhatsApp، Telegram، Discord، Mattermost، Signal، iMessage، به‌علاوهٔ Pluginهای کانال همراه مانند QQ Bot)
    - **نصب daemon** (LaunchAgent روی macOS؛ واحد کاربری systemd روی Linux/WSL2)
    - **بررسی‌های سلامت** و انتخاب **Skills**

    همچنین اگر مدل پیکربندی‌شدهٔ شما ناشناخته باشد یا احراز هویت نداشته باشد، هشدار می‌دهد.

  </Accordion>

  <Accordion title="آیا برای اجرای این به اشتراک Claude یا OpenAI نیاز دارم؟">
    نه. می‌توانید OpenClaw را با **کلیدهای API** (Anthropic/OpenAI/دیگران) یا با
    **مدل‌های فقط محلی** اجرا کنید تا داده‌های شما روی دستگاهتان بماند. اشتراک‌ها (Claude
    Pro/Max یا OpenAI Codex) روش‌های اختیاری برای احراز هویت آن ارائه‌دهندگان هستند.

    برای Anthropic در OpenClaw، تفکیک عملی این است:

    - **کلید API Anthropic**: صورتحساب عادی API Anthropic
    - **Claude CLI / احراز هویت اشتراک Claude در OpenClaw**: کارکنان Anthropic
      به ما گفته‌اند این استفاده دوباره مجاز است، و OpenClaw استفاده از `claude -p`
      را برای این یکپارچه‌سازی مجاز در نظر می‌گیرد مگر اینکه Anthropic سیاست جدیدی منتشر کند

    برای میزبان‌های gateway بلندمدت، کلیدهای API Anthropic همچنان راه‌اندازی
    قابل‌پیش‌بینی‌تری هستند. OAuth در OpenAI Codex به‌صراحت برای ابزارهای بیرونی
    مانند OpenClaw پشتیبانی می‌شود.

    OpenClaw همچنین از گزینه‌های میزبانی‌شدهٔ دیگر با سبک اشتراکی، از جمله
    **Qwen Cloud Coding Plan**، **MiniMax Coding Plan** و
    **Z.AI / GLM Coding Plan** پشتیبانی می‌کند.

    مستندات: [Anthropic](/fa/providers/anthropic)، [OpenAI](/fa/providers/openai)،
    [Qwen Cloud](/fa/providers/qwen)،
    [MiniMax](/fa/providers/minimax)، [مدل‌های GLM](/fa/providers/glm)،
    [مدل‌های محلی](/fa/gateway/local-models)، [مدل‌ها](/fa/concepts/models).

  </Accordion>

  <Accordion title="آیا می‌توانم از اشتراک Claude Max بدون کلید API استفاده کنم؟">
    بله.

    کارکنان Anthropic به ما گفته‌اند استفادهٔ شبیه OpenClaw از Claude CLI دوباره مجاز است، بنابراین
    OpenClaw احراز هویت اشتراک Claude و استفاده از `claude -p` را برای این یکپارچه‌سازی
    مجاز در نظر می‌گیرد مگر اینکه Anthropic سیاست جدیدی منتشر کند. اگر
    قابل‌پیش‌بینی‌ترین راه‌اندازی سمت سرور را می‌خواهید، به‌جای آن از کلید API Anthropic استفاده کنید.

  </Accordion>

  <Accordion title="آیا از احراز هویت اشتراک Claude (Claude Pro یا Max) پشتیبانی می‌کنید؟">
    بله.

    کارکنان Anthropic به ما گفته‌اند این استفاده دوباره مجاز است، بنابراین OpenClaw
    استفادهٔ مجدد از Claude CLI و استفاده از `claude -p` را برای این یکپارچه‌سازی
    مجاز در نظر می‌گیرد مگر اینکه Anthropic سیاست جدیدی منتشر کند.

    setup-token برای Anthropic همچنان به‌عنوان مسیر توکن پشتیبانی‌شده در OpenClaw در دسترس است، اما OpenClaw اکنون در صورت وجود، استفادهٔ مجدد از Claude CLI و `claude -p` را ترجیح می‌دهد.
    برای بارهای کاری تولیدی یا چندکاربره، احراز هویت با کلید API Anthropic همچنان
    انتخاب امن‌تر و قابل‌پیش‌بینی‌تری است. اگر گزینه‌های میزبانی‌شدهٔ دیگر با
    سبک اشتراکی را در OpenClaw می‌خواهید، [OpenAI](/fa/providers/openai)، [Qwen / Model
    Cloud](/fa/providers/qwen)، [MiniMax](/fa/providers/minimax)، و [مدل‌های GLM](/fa/providers/glm)
    را ببینید.

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="چرا HTTP 429 rate_limit_error از Anthropic می‌بینم؟">
    این یعنی **سهمیه/محدودیت نرخ Anthropic** شما برای پنجرهٔ زمانی فعلی تمام شده است. اگر از
    **Claude CLI** استفاده می‌کنید، منتظر بمانید پنجره بازنشانی شود یا طرح خود را ارتقا دهید. اگر از
    **کلید API Anthropic** استفاده می‌کنید، Anthropic Console را برای
    مصرف/صورتحساب بررسی کنید و در صورت نیاز محدودیت‌ها را افزایش دهید.

    اگر پیام مشخصاً این است:
    `Extra usage is required for long context requests`، درخواست در حال تلاش برای استفاده از
    بتای زمینهٔ ۱ میلیونی Anthropic (`context1m: true`) است. این فقط زمانی کار می‌کند که
    اعتبار شما واجد شرایط صورتحساب زمینهٔ بلند باشد (صورتحساب کلید API یا
    مسیر ورود Claude در OpenClaw با فعال بودن Extra Usage).

    نکته: یک **مدل جایگزین** تنظیم کنید تا OpenClaw هنگام محدودیت نرخ یک ارائه‌دهنده همچنان بتواند پاسخ دهد.
    [مدل‌ها](/fa/cli/models)، [OAuth](/fa/concepts/oauth)، و
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/fa/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) را ببینید.

  </Accordion>

  <Accordion title="آیا AWS Bedrock پشتیبانی می‌شود؟">
    بله. OpenClaw یک ارائه‌دهنده‌ی همراه **Amazon Bedrock (Converse)** دارد. با وجود نشانگرهای env مربوط به AWS، OpenClaw می‌تواند کاتالوگ Bedrock مخصوص streaming/text را به‌طور خودکار کشف کند و آن را به‌عنوان یک ارائه‌دهنده‌ی ضمنی `amazon-bedrock` ادغام کند؛ در غیر این صورت می‌توانید `plugins.entries.amazon-bedrock.config.discovery.enabled` را صراحتاً فعال کنید یا یک ورودی ارائه‌دهنده‌ی دستی اضافه کنید. [Amazon Bedrock](/fa/providers/bedrock) و [ارائه‌دهندگان مدل](/fa/providers/models) را ببینید. اگر جریان کلید مدیریت‌شده را ترجیح می‌دهید، یک پروکسی سازگار با OpenAI جلوی Bedrock همچنان گزینه‌ای معتبر است.
  </Accordion>

  <Accordion title="احراز هویت Codex چگونه کار می‌کند؟">
    OpenClaw از **OpenAI Code (Codex)** از طریق OAuth (ورود با ChatGPT) پشتیبانی می‌کند. برای راه‌اندازی رایج از
    `openai/gpt-5.5` استفاده کنید: احراز هویت اشتراک ChatGPT/Codex به‌همراه
    اجرای بومی سرور برنامه‌ی Codex. ارجاع‌های مدل `openai-codex/gpt-*`
    پیکربندی قدیمی هستند که با `openclaw doctor --fix` اصلاح می‌شوند. دسترسی
    مستقیم با کلید API OpenAI همچنان برای سطوح OpenAI API غیرعاملی و برای مدل‌های
    عامل از طریق یک پروفایل کلید API مرتب‌شده‌ی `openai-codex` در دسترس است.
    [ارائه‌دهندگان مدل](/fa/concepts/model-providers) و [راه‌اندازی اولیه (CLI)](/fa/start/wizard) را ببینید.
  </Accordion>

  <Accordion title="چرا OpenClaw همچنان به openai-codex اشاره می‌کند؟">
    `openai-codex` شناسه‌ی ارائه‌دهنده و پروفایل احراز هویت برای OAuth مربوط به ChatGPT/Codex است.
    پیکربندی‌های قدیمی‌تر از آن به‌عنوان پیشوند مدل هم استفاده می‌کردند:

    - `openai/gpt-5.5` = احراز هویت اشتراک ChatGPT/Codex با runtime بومی Codex برای نوبت‌های عامل
    - `openai-codex/gpt-5.5` = مسیر مدل قدیمی که با `openclaw doctor --fix` اصلاح می‌شود
    - `openai/gpt-5.5` به‌همراه یک پروفایل کلید API مرتب‌شده‌ی `openai-codex` = احراز هویت با کلید API برای یک مدل عامل OpenAI
    - `openai-codex:...` = شناسه‌ی پروفایل احراز هویت، نه ارجاع مدل

    اگر مسیر مستقیم صورت‌حساب/محدودیت OpenAI Platform را می‌خواهید،
    `OPENAI_API_KEY` را تنظیم کنید. اگر احراز هویت اشتراک ChatGPT/Codex را می‌خواهید، با
    `openclaw models auth login --provider openai-codex` وارد شوید. ارجاع مدل را به‌صورت
    `openai/gpt-5.5` نگه دارید؛ ارجاع‌های مدل `openai-codex/*` پیکربندی قدیمی هستند که
    `openclaw doctor --fix` بازنویسی می‌کند.

  </Accordion>

  <Accordion title="چرا محدودیت‌های OAuth مربوط به Codex می‌تواند با وب ChatGPT متفاوت باشد؟">
    OAuth مربوط به Codex از پنجره‌های سهمیه‌ی مدیریت‌شده توسط OpenAI و وابسته به طرح استفاده می‌کند. در عمل،
    این محدودیت‌ها می‌توانند با تجربه‌ی وب‌سایت/برنامه‌ی ChatGPT متفاوت باشند، حتی وقتی
    هر دو به یک حساب متصل هستند.

    OpenClaw می‌تواند پنجره‌های استفاده/سهمیه‌ی ارائه‌دهنده را که در حال حاضر قابل مشاهده‌اند در
    `openclaw models status` نشان دهد، اما استحقاق‌های وب ChatGPT را به دسترسی مستقیم API
    جعل یا نرمال‌سازی نمی‌کند. اگر مسیر مستقیم صورت‌حساب/محدودیت OpenAI Platform
    را می‌خواهید، از `openai/*` با یک کلید API استفاده کنید.

  </Accordion>

  <Accordion title="آیا از احراز هویت اشتراک OpenAI (OAuth مربوط به Codex) پشتیبانی می‌کنید؟">
    بله. OpenClaw به‌طور کامل از **OAuth اشتراک OpenAI Code (Codex)** پشتیبانی می‌کند.
    OpenAI صراحتاً استفاده از OAuth اشتراک را در ابزارها/جریان‌های کاری خارجی
    مانند OpenClaw مجاز می‌داند. راه‌اندازی اولیه می‌تواند جریان OAuth را برای شما اجرا کند.

    [OAuth](/fa/concepts/oauth)، [ارائه‌دهندگان مدل](/fa/concepts/model-providers)، و [راه‌اندازی اولیه (CLI)](/fa/start/wizard) را ببینید.

  </Accordion>

  <Accordion title="چگونه OAuth مربوط به Gemini CLI را راه‌اندازی کنم؟">
    Gemini CLI از یک **جریان احراز هویت Plugin** استفاده می‌کند، نه client id یا secret در `openclaw.json`.

    مراحل:

    1. Gemini CLI را به‌صورت محلی نصب کنید تا `gemini` روی `PATH` باشد
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin را فعال کنید: `openclaw plugins enable google`
    3. وارد شوید: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. مدل پیش‌فرض پس از ورود: `google-gemini-cli/gemini-3-flash-preview`
    5. اگر درخواست‌ها ناموفق بودند، `GOOGLE_CLOUD_PROJECT` یا `GOOGLE_CLOUD_PROJECT_ID` را روی میزبان Gateway تنظیم کنید

    این کار توکن‌های OAuth را در پروفایل‌های احراز هویت روی میزبان Gateway ذخیره می‌کند. جزئیات: [ارائه‌دهندگان مدل](/fa/concepts/model-providers).

  </Accordion>

  <Accordion title="آیا یک مدل محلی برای گفت‌وگوهای معمولی مناسب است؟">
    معمولاً نه. OpenClaw به زمینه‌ی بزرگ + ایمنی قوی نیاز دارد؛ کارت‌های کوچک کوتاه می‌کنند و نشت می‌دهند. اگر مجبورید، **بزرگ‌ترین** ساخت مدل را که می‌توانید به‌صورت محلی اجرا کنید (LM Studio) اجرا کنید و [/gateway/local-models](/fa/gateway/local-models) را ببینید. مدل‌های کوچک‌تر/کوانتیزه‌شده خطر prompt-injection را افزایش می‌دهند - [امنیت](/fa/gateway/security) را ببینید.
  </Accordion>

  <Accordion title="چگونه ترافیک مدل میزبانی‌شده را در یک منطقه‌ی مشخص نگه دارم؟">
    endpointهای مقید به منطقه را انتخاب کنید. OpenRouter گزینه‌های میزبانی‌شده در آمریکا را برای MiniMax، Kimi، و GLM ارائه می‌دهد؛ نوع میزبانی‌شده در آمریکا را انتخاب کنید تا داده در همان منطقه بماند. همچنان می‌توانید Anthropic/OpenAI را کنار این‌ها فهرست کنید، با استفاده از `models.mode: "merge"` تا گزینه‌های جایگزین در دسترس بمانند و هم‌زمان ارائه‌دهنده‌ی منطقه‌ای انتخاب‌شده رعایت شود.
  </Accordion>

  <Accordion title="آیا برای نصب این باید Mac Mini بخرم؟">
    نه. OpenClaw روی macOS یا Linux اجرا می‌شود (Windows از طریق WSL2). Mac mini اختیاری است - بعضی افراد
    آن را به‌عنوان میزبان همیشه‌روشن می‌خرند، اما یک VPS کوچک، سرور خانگی، یا دستگاهی در رده‌ی Raspberry Pi هم کار می‌کند.

    فقط برای **ابزارهای مختص macOS** به Mac نیاز دارید. برای iMessage، از [iMessage](/fa/channels/imessage) با `imsg` روی هر Mac که وارد Messages شده استفاده کنید. اگر Gateway روی Linux یا جای دیگری اجرا می‌شود، `channels.imessage.cliPath` را به یک wrapper مربوط به SSH تنظیم کنید که `imsg` را روی آن Mac اجرا می‌کند. اگر ابزارهای دیگری که مختص macOS هستند می‌خواهید، Gateway را روی یک Mac اجرا کنید یا یک macOS node جفت کنید.

    مستندات: [iMessage](/fa/channels/imessage)، [Nodeها](/fa/nodes)، [حالت راه‌دور Mac](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="آیا برای پشتیبانی iMessage به Mac mini نیاز دارم؟">
    به **یک دستگاه macOS** نیاز دارید که وارد Messages شده باشد. لازم نیست Mac mini باشد -
    هر Mac کافی است. **از [iMessage](/fa/channels/imessage)** با `imsg` استفاده کنید؛ Gateway می‌تواند روی همان Mac اجرا شود، یا می‌تواند جای دیگری با یک wrapper مربوط به SSH در `cliPath` اجرا شود.

    راه‌اندازی‌های رایج:

    - Gateway را روی Linux/VPS اجرا کنید و `channels.imessage.cliPath` را به یک wrapper مربوط به SSH تنظیم کنید که `imsg` را روی یک Mac واردشده به Messages اجرا می‌کند.
    - اگر ساده‌ترین راه‌اندازی تک‌ماشینه را می‌خواهید، همه‌چیز را روی Mac اجرا کنید.

    مستندات: [iMessage](/fa/channels/imessage)، [Nodeها](/fa/nodes)،
    [حالت راه‌دور Mac](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="اگر یک Mac mini برای اجرای OpenClaw بخرم، آیا می‌توانم آن را به MacBook Pro خود وصل کنم؟">
    بله. **Mac mini می‌تواند Gateway را اجرا کند**، و MacBook Pro شما می‌تواند به‌عنوان یک
    **node** (دستگاه همراه) وصل شود. Nodeها Gateway را اجرا نمی‌کنند - آن‌ها قابلیت‌های اضافی
    مانند صفحه‌نمایش/دوربین/canvas و `system.run` را روی آن دستگاه فراهم می‌کنند.

    الگوی رایج:

    - Gateway روی Mac mini (همیشه‌روشن).
    - MacBook Pro برنامه‌ی macOS یا یک میزبان node را اجرا می‌کند و با Gateway جفت می‌شود.
    - برای دیدن آن از `openclaw nodes status` / `openclaw nodes list` استفاده کنید.

    مستندات: [Nodeها](/fa/nodes)، [CLI مربوط به Nodeها](/fa/cli/nodes).

  </Accordion>

  <Accordion title="آیا می‌توانم از Bun استفاده کنم؟">
    Bun **توصیه نمی‌شود**. ما باگ‌های runtime می‌بینیم، به‌ویژه با WhatsApp و Telegram.
    برای Gatewayهای پایدار از **Node** استفاده کنید.

    اگر همچنان می‌خواهید با Bun آزمایش کنید، این کار را روی یک Gateway غیرتولیدی
    بدون WhatsApp/Telegram انجام دهید.

  </Accordion>

  <Accordion title="Telegram: چه چیزی در allowFrom قرار می‌گیرد؟">
    `channels.telegram.allowFrom` **شناسه‌ی کاربر Telegram فرستنده‌ی انسانی** است (عددی). این نام کاربری bot نیست.

    راه‌اندازی فقط شناسه‌های عددی کاربر را می‌پرسد. اگر از قبل ورودی‌های قدیمی `@username` در پیکربندی دارید، `openclaw doctor --fix` می‌تواند برای resolve کردن آن‌ها تلاش کند.

    ایمن‌تر (بدون bot شخص ثالث):

    - به bot خود پیام مستقیم بدهید، سپس `openclaw logs --follow` را اجرا کنید و `from.id` را بخوانید.

    Bot API رسمی:

    - به bot خود پیام مستقیم بدهید، سپس `https://api.telegram.org/bot<bot_token>/getUpdates` را فراخوانی کنید و `message.from.id` را بخوانید.

    شخص ثالث (حریم خصوصی کمتر):

    - به `@userinfobot` یا `@getidsbot` پیام مستقیم بدهید.

    [/channels/telegram](/fa/channels/telegram#access-control-and-activation) را ببینید.

  </Accordion>

  <Accordion title="آیا چند نفر می‌توانند از یک شماره‌ی WhatsApp با نمونه‌های متفاوت OpenClaw استفاده کنند؟">
    بله، از طریق **مسیریابی چندعاملی**. WhatsApp **DM** هر فرستنده (peer با `kind: "direct"`، فرستنده‌ی E.164 مثل `+15551234567`) را به یک `agentId` متفاوت bind کنید، تا هر شخص workspace و store نشست خود را داشته باشد. پاسخ‌ها همچنان از **همان حساب WhatsApp** می‌آیند، و کنترل دسترسی DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) در سطح هر حساب WhatsApp سراسری است. [مسیریابی چندعاملی](/fa/concepts/multi-agent) و [WhatsApp](/fa/channels/whatsapp) را ببینید.
  </Accordion>

  <Accordion title='آیا می‌توانم یک عامل "گفت‌وگوی سریع" و یک عامل "Opus برای کدنویسی" اجرا کنم؟'>
    بله. از مسیریابی چندعاملی استفاده کنید: برای هر عامل مدل پیش‌فرض خودش را بدهید، سپس routeهای ورودی (حساب ارائه‌دهنده یا peerهای مشخص) را به هر عامل bind کنید. نمونه پیکربندی در [مسیریابی چندعاملی](/fa/concepts/multi-agent) قرار دارد. همچنین [مدل‌ها](/fa/concepts/models) و [پیکربندی](/fa/gateway/configuration) را ببینید.
  </Accordion>

  <Accordion title="آیا Homebrew روی Linux کار می‌کند؟">
    بله. Homebrew از Linux پشتیبانی می‌کند (Linuxbrew). راه‌اندازی سریع:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    اگر OpenClaw را از طریق systemd اجرا می‌کنید، مطمئن شوید PATH سرویس شامل `/home/linuxbrew/.linuxbrew/bin` (یا پیشوند brew شما) باشد تا ابزارهای نصب‌شده با `brew` در shellهای غیر login قابل resolve باشند.
    ساخت‌های اخیر همچنین دایرکتوری‌های رایج bin کاربر را در سرویس‌های Linux systemd به ابتدای مسیر اضافه می‌کنند (برای مثال `~/.local/bin`، `~/.npm-global/bin`، `~/.local/share/pnpm`، `~/.bun/bin`) و هنگام تنظیم بودن `PNPM_HOME`، `NPM_CONFIG_PREFIX`، `BUN_INSTALL`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `NVM_DIR`، و `FNM_DIR` به آن‌ها احترام می‌گذارند.

  </Accordion>

  <Accordion title="تفاوت بین نصب git قابل هک و نصب npm">
    - **نصب قابل هک (git):** checkout کامل منبع، قابل ویرایش، بهترین گزینه برای مشارکت‌کنندگان.
      buildها را به‌صورت محلی اجرا می‌کنید و می‌توانید کد/مستندات را patch کنید.
    - **نصب npm:** نصب سراسری CLI، بدون repo، بهترین گزینه برای «فقط اجرا کن».
      به‌روزرسانی‌ها از dist-tagهای npm می‌آیند.

    مستندات: [شروع به کار](/fa/start/getting-started)، [به‌روزرسانی](/fa/install/updating).

  </Accordion>

  <Accordion title="آیا می‌توانم بعداً بین نصب‌های npm و git جابه‌جا شوم؟">
    بله. وقتی OpenClaw از قبل نصب شده است، از `openclaw update --channel ...` استفاده کنید.
    این کار **داده‌های شما را حذف نمی‌کند** - فقط نصب کد OpenClaw را تغییر می‌دهد.
    state شما (`~/.openclaw`) و workspace شما (`~/.openclaw/workspace`) دست‌نخورده می‌مانند.

    از npm به git:

    ```bash
    openclaw update --channel dev
    ```

    از git به npm:

    ```bash
    openclaw update --channel stable
    ```

    برای پیش‌نمایش تغییر حالت برنامه‌ریزی‌شده، ابتدا `--dry-run` را اضافه کنید. updater پیگیری‌های
    Doctor را اجرا می‌کند، منابع Plugin را برای channel هدف تازه‌سازی می‌کند، و
    Gateway را restart می‌کند مگر اینکه `--no-restart` را پاس بدهید.

    installer هم می‌تواند هر یک از حالت‌ها را اجباری کند:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    نکات پشتیبان‌گیری: [راهبرد پشتیبان‌گیری](/fa/help/faq#where-things-live-on-disk) را ببینید.

  </Accordion>

  <Accordion title="آیا باید Gateway را روی لپ‌تاپم اجرا کنم یا روی VPS؟">
    پاسخ کوتاه: **اگر قابلیت اطمینان ۲۴/۷ می‌خواهید، از VPS استفاده کنید**. اگر کمترین
    اصطکاک را می‌خواهید و با sleep/restartها مشکلی ندارید، آن را محلی اجرا کنید.

    **لپ‌تاپ (Gateway محلی)**

    - **مزایا:** بدون هزینه‌ی سرور، دسترسی مستقیم به فایل‌های محلی، پنجره‌ی مرورگر زنده.
    - **معایب:** sleep/افت شبکه = قطع اتصال‌ها، به‌روزرسانی‌ها/rebootهای سیستم‌عامل اختلال ایجاد می‌کنند، باید بیدار بماند.

    **VPS / cloud**

    - **مزایا:** همیشه روشن، شبکه پایدار، بدون مشکل خواب رفتن لپ‌تاپ، نگه‌داشتن آن در حال اجرا آسان‌تر است.
    - **معایب:** اغلب بدون نمایشگر اجرا می‌شود (از اسکرین‌شات‌ها استفاده کنید)، فقط دسترسی راه‌دور به فایل‌ها، برای به‌روزرسانی‌ها باید SSH بزنید.

    **نکته مخصوص OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord همگی از یک VPS به‌خوبی کار می‌کنند. تنها مصالحه واقعی، **مرورگر بدون نمایشگر** در برابر یک پنجره قابل مشاهده است. [مرورگر](/fa/tools/browser) را ببینید.

    **پیش‌فرض پیشنهادی:** اگر قبلا قطع شدن gateway داشتید، VPS. محلی زمانی عالی است که فعالانه از Mac استفاده می‌کنید و دسترسی به فایل‌های محلی یا خودکارسازی UI با مرورگر قابل مشاهده می‌خواهید.

  </Accordion>

  <Accordion title="اجرای OpenClaw روی یک ماشین اختصاصی چقدر مهم است؟">
    الزامی نیست، اما **برای قابلیت اطمینان و جداسازی توصیه می‌شود**.

    - **میزبان اختصاصی (VPS/Mac mini/Pi):** همیشه روشن، وقفه‌های کمتر بر اثر خواب/راه‌اندازی مجدد، مجوزهای تمیزتر، نگه‌داشتن آن در حال اجرا آسان‌تر است.
    - **لپ‌تاپ/دسکتاپ مشترک:** برای آزمایش و استفاده فعال کاملا مناسب است، اما وقتی ماشین به خواب می‌رود یا به‌روزرسانی می‌شود، انتظار مکث داشته باشید.

    اگر بهترینِ هر دو حالت را می‌خواهید، Gateway را روی یک میزبان اختصاصی نگه دارید و لپ‌تاپ خود را به‌عنوان یک **Node** برای ابزارهای صفحه‌نمایش/دوربین/exec محلی جفت کنید. [Nodeها](/fa/nodes) را ببینید.
    برای راهنمایی امنیتی، [امنیت](/fa/gateway/security) را بخوانید.

  </Accordion>

  <Accordion title="حداقل نیازمندی‌های VPS و سیستم‌عامل پیشنهادی چیست؟">
    OpenClaw سبک است. برای یک Gateway پایه + یک کانال چت:

    - **حداقل مطلق:** 1 vCPU، 1GB RAM، حدود 500MB دیسک.
    - **پیشنهادی:** 1-2 vCPU، 2GB RAM یا بیشتر برای فضای اضافه (لاگ‌ها، رسانه، چند کانال). ابزارهای Node و خودکارسازی مرورگر می‌توانند منابع زیادی مصرف کنند.

    سیستم‌عامل: از **Ubuntu LTS** (یا هر Debian/Ubuntu مدرن) استفاده کنید. مسیر نصب Linux در آنجا بهتر آزمایش شده است.

    مستندات: [Linux](/fa/platforms/linux)، [میزبانی VPS](/fa/vps).

  </Accordion>

  <Accordion title="آیا می‌توانم OpenClaw را در VM اجرا کنم و نیازمندی‌ها چیست؟">
    بله. با VM مانند VPS رفتار کنید: باید همیشه روشن، قابل دسترس، و دارای
    RAM کافی برای Gateway و هر کانالی باشد که فعال می‌کنید.

    راهنمای پایه:

    - **حداقل مطلق:** 1 vCPU، 1GB RAM.
    - **پیشنهادی:** اگر چند کانال، خودکارسازی مرورگر، یا ابزارهای رسانه را اجرا می‌کنید، 2GB RAM یا بیشتر.
    - **سیستم‌عامل:** Ubuntu LTS یا یک Debian/Ubuntu مدرن دیگر.

    اگر روی Windows هستید، **WSL2 آسان‌ترین راه‌اندازی به سبک VM** است و بهترین سازگاری
    ابزارها را دارد. [Windows](/fa/platforms/windows)، [میزبانی VPS](/fa/vps) را ببینید.
    اگر macOS را در VM اجرا می‌کنید، [macOS VM](/fa/install/macos-vm) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [پرسش‌های متداول](/fa/help/faq) — پرسش‌های متداول اصلی (مدل‌ها، نشست‌ها، Gateway، امنیت، موارد بیشتر)
- [نمای کلی نصب](/fa/install)
- [شروع کار](/fa/start/getting-started)
- [عیب‌یابی](/fa/help/troubleshooting)
