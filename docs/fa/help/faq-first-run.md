---
read_when:
    - نصب جدید، گیر کردن فرایند راه‌اندازی اولیه، یا خطاهای اجرای نخست
    - انتخاب احراز هویت و اشتراک‌های ارائه‌دهنده
    - نمی‌توان به docs.openclaw.ai دسترسی پیدا کرد، نمی‌توان داشبورد را باز کرد، نصب گیر کرده است
sidebarTitle: First-run FAQ
summary: 'پرسش‌های متداول: شروع سریع و راه‌اندازی اولین اجرا — نصب، آماده‌سازی اولیه، احراز هویت، اشتراک‌ها، خطاهای اولیه'
title: 'پرسش‌های متداول: راه‌اندازی اجرای نخست'
x-i18n:
    generated_at: "2026-04-29T22:58:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 959e5c8a94cce6369af84d3d1e252dbfb22acb5891ac1d8b64722c4c40679e65
    source_path: help/faq-first-run.md
    workflow: 16
---

  شروع سریع و پرسش‌وپاسخ اجرای نخست. برای عملیات روزمره، مدل‌ها، احراز هویت، نشست‌ها،
  و عیب‌یابی، [پرسش‌های متداول](/fa/help/faq) اصلی را ببینید.

  ## شروع سریع و راه‌اندازی اجرای نخست

  <AccordionGroup>
  <Accordion title="گیر کرده‌ام، سریع‌ترین راه برای رهایی">
    از یک عامل هوش مصنوعی محلی استفاده کنید که بتواند **دستگاه شما را ببیند**. این بسیار مؤثرتر از پرسیدن
    در Discord است، چون بیشتر موارد «گیر کرده‌ام» **مشکلات پیکربندی یا محیط محلی** هستند که
    کمک‌کنندگان از راه دور نمی‌توانند بررسی کنند.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    این ابزارها می‌توانند مخزن را بخوانند، فرمان‌ها را اجرا کنند، گزارش‌ها را بررسی کنند، و به رفع راه‌اندازی
    در سطح دستگاه شما کمک کنند (PATH، سرویس‌ها، مجوزها، فایل‌های احراز هویت). با نصب
    قابل دستکاری (git)، **checkout کامل منبع** را در اختیارشان بگذارید:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    این کار OpenClaw را **از یک checkout گیت** نصب می‌کند، بنابراین عامل می‌تواند کد + مستندات را بخواند و
    درباره نسخه دقیقی که اجرا می‌کنید استدلال کند. همیشه می‌توانید بعداً با اجرای دوباره نصب‌کننده بدون
    `--install-method git` به نسخه پایدار برگردید.

    نکته: از عامل بخواهید اصلاح را **برنامه‌ریزی و نظارت** کند (گام‌به‌گام)، سپس فقط
    فرمان‌های ضروری را اجرا کند. این کار تغییرات را کوچک و حسابرسی آن‌ها را آسان‌تر نگه می‌دارد.

    اگر یک باگ یا اصلاح واقعی پیدا کردید، لطفاً یک issue در GitHub ثبت کنید یا یک PR بفرستید:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    با این فرمان‌ها شروع کنید (هنگام درخواست کمک، خروجی‌ها را به اشتراک بگذارید):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    کاری که انجام می‌دهند:

    - `openclaw status`: نمای سریع از سلامت gateway/agent + پیکربندی پایه.
    - `openclaw models status`: احراز هویت ارائه‌دهنده + دسترس‌پذیری مدل را بررسی می‌کند.
    - `openclaw doctor`: مشکلات رایج پیکربندی/وضعیت را اعتبارسنجی و تعمیر می‌کند.

    بررسی‌های CLI مفید دیگر: `openclaw status --all`، `openclaw logs --follow`،
    `openclaw gateway status`، `openclaw health --verbose`.

    چرخه عیب‌یابی سریع: [۶۰ ثانیه اول اگر چیزی خراب است](#first-60-seconds-if-something-is-broken).
    مستندات نصب: [نصب](/fa/install)، [پرچم‌های نصب‌کننده](/fa/install/installer)، [به‌روزرسانی](/fa/install/updating).

  </Accordion>

  <Accordion title="Heartbeat مدام رد می‌شود. دلایل رد شدن چه معنایی دارند؟">
    دلایل رایج رد شدن Heartbeat:

    - `quiet-hours`: خارج از پنجره active-hours پیکربندی‌شده
    - `empty-heartbeat-file`: `HEARTBEAT.md` وجود دارد اما فقط شامل چارچوب خالی/فقط-سربرگ است
    - `no-tasks-due`: حالت وظیفه `HEARTBEAT.md` فعال است اما هنوز موعد هیچ‌یک از بازه‌های وظیفه نرسیده است
    - `alerts-disabled`: تمام قابلیت دید Heartbeat غیرفعال است (`showOk`، `showAlerts`، و `useIndicator` همگی خاموش هستند)

    در حالت وظیفه، زمان‌های موعد فقط پس از تکمیل یک اجرای واقعی Heartbeat
    جلو برده می‌شوند. اجراهای ردشده وظیفه‌ها را تکمیل‌شده علامت نمی‌زنند.

    مستندات: [Heartbeat](/fa/gateway/heartbeat)، [خودکارسازی و وظیفه‌ها](/fa/automation).

  </Accordion>

  <Accordion title="روش پیشنهادی برای نصب و راه‌اندازی OpenClaw">
    مخزن، اجرا از منبع و استفاده از onboarding را توصیه می‌کند:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    راهنما همچنین می‌تواند دارایی‌های UI را به‌صورت خودکار بسازد. پس از onboarding، معمولاً Gateway را روی پورت **18789** اجرا می‌کنید.

    از منبع (مشارکت‌کنندگان/توسعه‌دهندگان):

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
    راهنما درست پس از onboarding مرورگر شما را با یک URL تمیزِ داشبورد (بدون توکن) باز می‌کند و همچنین پیوند را در خلاصه چاپ می‌کند. آن زبانه را باز نگه دارید؛ اگر اجرا نشد، URL چاپ‌شده را روی همان دستگاه کپی/پیست کنید.
  </Accordion>

  <Accordion title="چگونه داشبورد را روی localhost در برابر راه دور احراز هویت کنم؟">
    **Localhost (همان دستگاه):**

    - `http://127.0.0.1:18789/` را باز کنید.
    - اگر احراز هویت shared-secret خواست، توکن یا گذرواژه پیکربندی‌شده را در تنظیمات Control UI وارد کنید.
    - منبع توکن: `gateway.auth.token` (یا `OPENCLAW_GATEWAY_TOKEN`).
    - منبع گذرواژه: `gateway.auth.password` (یا `OPENCLAW_GATEWAY_PASSWORD`).
    - اگر هنوز هیچ راز مشترکی پیکربندی نشده است، با `openclaw doctor --generate-gateway-token` یک توکن بسازید.

    **نه روی localhost:**

    - **Tailscale Serve** (توصیه‌شده): bind را loopback نگه دارید، `openclaw gateway --tailscale serve` را اجرا کنید، `https://<magicdns>/` را باز کنید. اگر `gateway.auth.allowTailscale` برابر `true` باشد، هدرهای هویت احراز هویت Control UI/WebSocket را تأمین می‌کنند (بدون راز مشترک واردشده، با فرض قابل اعتماد بودن میزبان Gateway)؛ APIهای HTTP همچنان به احراز هویت shared-secret نیاز دارند مگر اینکه عمداً از private-ingress `none` یا احراز هویت HTTP با trusted-proxy استفاده کنید.
      تلاش‌های بد هم‌زمان Serve auth از همان کلاینت پیش از ثبت شدن توسط محدودکننده failed-auth سری‌سازی می‌شوند، بنابراین تلاش بد دوم می‌تواند از همین حالا `retry later` را نشان دهد.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` را اجرا کنید (یا احراز هویت با گذرواژه را پیکربندی کنید)، `http://<tailscale-ip>:18789/` را باز کنید، سپس راز مشترک متناظر را در تنظیمات داشبورد وارد کنید.
    - **پراکسی معکوس آگاه از هویت**: Gateway را پشت یک پراکسی قابل اعتماد نگه دارید، `gateway.auth.mode: "trusted-proxy"` را پیکربندی کنید، سپس URL پراکسی را باز کنید. پراکسی‌های loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند.
    - **تونل SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` سپس `http://127.0.0.1:18789/` را باز کنید. احراز هویت shared-secret همچنان روی تونل اعمال می‌شود؛ اگر درخواست شد، توکن یا گذرواژه پیکربندی‌شده را وارد کنید.

    برای حالت‌های bind و جزئیات احراز هویت، [داشبورد](/fa/web/dashboard) و [سطح‌های وب](/fa/web) را ببینید.

  </Accordion>

  <Accordion title="چرا برای تأییدهای چت دو پیکربندی تأیید exec وجود دارد؟">
    آن‌ها لایه‌های متفاوتی را کنترل می‌کنند:

    - `approvals.exec`: اعلان‌های تأیید را به مقصدهای چت ارسال می‌کند
    - `channels.<channel>.execApprovals`: آن کانال را به‌عنوان کلاینت تأیید بومی برای تأییدهای exec عمل می‌دهد

    سیاست exec میزبان همچنان دروازه تأیید واقعی است. پیکربندی چت فقط کنترل می‌کند اعلان‌های تأیید
    کجا ظاهر شوند و افراد چگونه بتوانند به آن‌ها پاسخ دهند.

    در بیشتر راه‌اندازی‌ها به **هر دو** نیاز ندارید:

    - اگر چت از قبل از فرمان‌ها و پاسخ‌ها پشتیبانی می‌کند، `/approve` همان چت از مسیر مشترک کار می‌کند.
    - اگر یک کانال بومی پشتیبانی‌شده بتواند تأییدکنندگان را با اطمینان استنباط کند، OpenClaw اکنون وقتی `channels.<channel>.execApprovals.enabled` تنظیم نشده یا `"auto"` باشد، تأییدهای بومی DM-first را به‌صورت خودکار فعال می‌کند.
    - وقتی کارت‌ها/دکمه‌های تأیید بومی در دسترس باشند، آن UI بومی مسیر اصلی است؛ عامل فقط وقتی باید فرمان دستی `/approve` را اضافه کند که نتیجه ابزار بگوید تأییدهای چت در دسترس نیستند یا تأیید دستی تنها مسیر است.
    - فقط وقتی از `approvals.exec` استفاده کنید که اعلان‌ها باید به چت‌های دیگر یا اتاق‌های عملیات صریح نیز ارسال شوند.
    - فقط وقتی از `channels.<channel>.execApprovals.target: "channel"` یا `"both"` استفاده کنید که صریحاً می‌خواهید اعلان‌های تأیید به اتاق/موضوع مبدأ برگردانده شوند.
    - تأییدهای Plugin دوباره جدا هستند: آن‌ها به‌طور پیش‌فرض از `/approve` همان چت استفاده می‌کنند، ارسال اختیاری `approvals.plugin` دارند، و فقط برخی کانال‌های بومی، مدیریت plugin-approval-native را در کنار آن نگه می‌دارند.

    نسخه کوتاه: forwarding برای مسیریابی است، پیکربندی کلاینت بومی برای UX غنی‌ترِ ویژه هر کانال است.
    [تأییدهای Exec](/fa/tools/exec-approvals) را ببینید.

  </Accordion>

  <Accordion title="به چه runtime نیاز دارم؟">
    Node **>= 22** الزامی است. `pnpm` توصیه می‌شود. Bun برای Gateway **توصیه نمی‌شود**.
  </Accordion>

  <Accordion title="آیا روی Raspberry Pi اجرا می‌شود؟">
    بله. Gateway سبک است - مستندات **512MB-1GB RAM**، **1 core**، و حدود **500MB**
    دیسک را برای استفاده شخصی کافی می‌دانند و اشاره می‌کنند که **Raspberry Pi 4 می‌تواند آن را اجرا کند**.

    اگر فضای اضافه می‌خواهید (گزارش‌ها، رسانه، سرویس‌های دیگر)، **2GB توصیه می‌شود**، اما
    حداقل سختگیرانه نیست.

    نکته: یک Pi/VPS کوچک می‌تواند Gateway را میزبانی کند، و می‌توانید **nodeها** را روی لپ‌تاپ/گوشی خود برای
    صفحه‌نمایش/دوربین/canvas محلی یا اجرای فرمان جفت کنید. [Nodeها](/fa/nodes) را ببینید.

  </Accordion>

  <Accordion title="نکته‌ای برای نصب روی Raspberry Pi هست؟">
    نسخه کوتاه: کار می‌کند، اما انتظار ناهمواری داشته باشید.

    - از سیستم‌عامل **64-bit** استفاده کنید و Node >= 22 را نگه دارید.
    - نصب **قابل دستکاری (git)** را ترجیح دهید تا بتوانید گزارش‌ها را ببینید و سریع به‌روزرسانی کنید.
    - بدون کانال‌ها/Skills شروع کنید، سپس آن‌ها را یکی‌یکی اضافه کنید.
    - اگر با مشکلات باینری عجیب روبه‌رو شدید، معمولاً مشکل **سازگاری ARM** است.

    مستندات: [Linux](/fa/platforms/linux)، [نصب](/fa/install).

  </Accordion>

  <Accordion title="روی wake up my friend گیر کرده است / onboarding باز نمی‌شود. حالا چه؟">
    آن صفحه به در دسترس و احراز هویت‌شده بودن Gateway بستگی دارد. TUI همچنین
    هنگام نخستین hatch، «Wake up, my friend!» را به‌صورت خودکار می‌فرستد. اگر آن خط را با **بدون پاسخ**
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

    3. اگر همچنان گیر کرد، اجرا کنید:

    ```bash
    openclaw doctor
    ```

    اگر Gateway راه دور است، مطمئن شوید اتصال تونل/Tailscale برقرار است و UI
    به Gateway درست اشاره می‌کند. [دسترسی راه دور](/fa/gateway/remote) را ببینید.

  </Accordion>

  <Accordion title="آیا می‌توانم راه‌اندازی‌ام را بدون انجام دوباره onboarding به یک دستگاه جدید (Mac mini) منتقل کنم؟">
    بله. **دایرکتوری وضعیت** و **فضای کاری** را کپی کنید، سپس یک بار Doctor را اجرا کنید. این کار
    بات شما را «دقیقاً همان‌طور» نگه می‌دارد (حافظه، تاریخچه نشست، احراز هویت، و وضعیت کانال)
    به شرطی که **هر دو** مکان را کپی کنید:

    1. OpenClaw را روی دستگاه جدید نصب کنید.
    2. `$OPENCLAW_STATE_DIR` (پیش‌فرض: `~/.openclaw`) را از دستگاه قدیمی کپی کنید.
    3. فضای کاری خود را کپی کنید (پیش‌فرض: `~/.openclaw/workspace`).
    4. `openclaw doctor` را اجرا کنید و سرویس Gateway را بازراه‌اندازی کنید.

    این کار پیکربندی، پروفایل‌های احراز هویت، اعتبارنامه‌های WhatsApp، نشست‌ها، و حافظه را حفظ می‌کند. اگر در
    حالت راه دور هستید، به یاد داشته باشید که میزبان gateway مالک session store و workspace است.

    **مهم:** اگر فقط فضای کاری خود را به GitHub commit/push کنید، از
    **حافظه + فایل‌های bootstrap** پشتیبان می‌گیرید، اما **نه** از تاریخچه نشست یا احراز هویت. آن‌ها
    زیر `~/.openclaw/` زندگی می‌کنند (برای مثال `~/.openclaw/agents/<agentId>/sessions/`).

    مرتبط: [مهاجرت](/fa/install/migrating)، [محل قرارگیری چیزها روی دیسک](#where-things-live-on-disk)،
    [فضای کاری عامل](/fa/concepts/agent-workspace)، [Doctor](/fa/gateway/doctor)،
    [حالت راه دور](/fa/gateway/remote).

  </Accordion>

  <Accordion title="کجا ببینم در آخرین نسخه چه چیز تازه‌ای وجود دارد؟">
    changelog در GitHub را بررسی کنید:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    تازه‌ترین ورودی‌ها در بالا هستند. اگر بخش بالایی با **Unreleased** علامت‌گذاری شده باشد، بخش تاریخ‌دار بعدی
    آخرین نسخه منتشرشده است. ورودی‌ها بر اساس **برجسته‌ها**، **تغییرات**، و
    **اصلاح‌ها** گروه‌بندی شده‌اند (به‌علاوه بخش‌های مستندات/دیگر در صورت نیاز).

  </Accordion>

  <Accordion title="نمی‌توانم به docs.openclaw.ai دسترسی پیدا کنم (خطای SSL)">
    برخی اتصال‌های Comcast/Xfinity به‌اشتباه `docs.openclaw.ai` را از طریق Xfinity
    Advanced Security مسدود می‌کنند. آن را غیرفعال کنید یا `docs.openclaw.ai` را در فهرست مجاز قرار دهید، سپس دوباره تلاش کنید.
    لطفاً با گزارش کردن در اینجا به ما کمک کنید آن را رفع انسداد کنیم: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    اگر هنوز نمی‌توانید به سایت برسید، مستندات روی GitHub آینه شده‌اند:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="تفاوت بین پایدار و بتا">
    **پایدار** و **بتا**، **npm dist-tag** هستند، نه خط‌های کد جداگانه:

    - `latest` = پایدار
    - `beta` = بیلد اولیه برای آزمایش

    معمولاً یک انتشار پایدار ابتدا روی **بتا** قرار می‌گیرد، سپس یک گام
    ارتقای صریح همان نسخه را به `latest` منتقل می‌کند. نگه‌دارندگان همچنین می‌توانند
    در صورت نیاز مستقیماً روی `latest` منتشر کنند. به همین دلیل بتا و پایدار می‌توانند
    پس از ارتقا به **همان نسخه** اشاره کنند.

    ببینید چه چیزهایی تغییر کرده است:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    برای دستورهای نصب تک‌خطی و تفاوت بین بتا و dev، آکاردئون زیر را ببینید.

  </Accordion>

  <Accordion title="چگونه نسخه بتا را نصب کنم و تفاوت بین بتا و dev چیست؟">
    **بتا** همان npm dist-tag به نام `beta` است (ممکن است پس از ارتقا با `latest` یکی باشد).
    **Dev** سرِ متحرک `main` (git) است؛ وقتی منتشر شود، از npm dist-tag به نام `dev` استفاده می‌کند.

    دستورهای تک‌خطی (macOS/Linux):

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

  <Accordion title="چگونه تازه‌ترین بیت‌ها را امتحان کنم؟">
    دو گزینه:

    1. **کانال Dev (checkout از git):**

    ```bash
    openclaw update --channel dev
    ```

    این کار به شاخه `main` سوییچ می‌کند و از روی منبع به‌روزرسانی می‌کند.

    2. **نصب قابل‌دستکاری (از سایت نصب‌کننده):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    این به شما یک repo محلی می‌دهد که می‌توانید ویرایشش کنید، سپس از طریق git به‌روزرسانی کنید.

    اگر ترجیح می‌دهید خودتان یک clone تمیز انجام دهید، از این استفاده کنید:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    مستندات: [به‌روزرسانی](/fa/cli/update)، [کانال‌های توسعه](/fa/install/development-channels)،
    [نصب](/fa/install).

  </Accordion>

  <Accordion title="نصب و آماده‌سازی اولیه معمولاً چقدر طول می‌کشد؟">
    راهنمای تقریبی:

    - **نصب:** ۲ تا ۵ دقیقه
    - **آماده‌سازی اولیه:** ۵ تا ۱۵ دقیقه، بسته به این‌که چند کانال/مدل را پیکربندی می‌کنید

    اگر گیر کرد، از [گیر کردن نصب‌کننده](#quick-start-and-first-run-setup)
    و حلقه عیب‌یابی سریع در [گیر کرده‌ام](#quick-start-and-first-run-setup) استفاده کنید.

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

    برای نصب قابل‌دستکاری (git):

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

    **1) خطای npm با spawn git / git پیدا نشد**

    - **Git for Windows** را نصب کنید و مطمئن شوید `git` در PATH شما قرار دارد.
    - PowerShell را ببندید و دوباره باز کنید، سپس نصب‌کننده را دوباره اجرا کنید.

    **2) پس از نصب، openclaw شناخته نمی‌شود**

    - پوشه bin سراسری npm شما در PATH نیست.
    - مسیر را بررسی کنید:

      ```powershell
      npm config get prefix
      ```

    - آن پوشه را به PATH کاربر خود اضافه کنید (در Windows پسوند `\bin` لازم نیست؛ در بیشتر سیستم‌ها `%AppData%\npm` است).
    - پس از به‌روزرسانی PATH، PowerShell را ببندید و دوباره باز کنید.

    اگر روان‌ترین راه‌اندازی Windows را می‌خواهید، به‌جای Windows بومی از **WSL2** استفاده کنید.
    مستندات: [Windows](/fa/platforms/windows).

  </Accordion>

  <Accordion title="خروجی exec در Windows متن چینی به‌هم‌ریخته نشان می‌دهد - چه کار کنم؟">
    این معمولاً ناسازگاری code page کنسول در shellهای بومی Windows است.

    نشانه‌ها:

    - خروجی `system.run`/`exec` حروف چینی را به‌صورت mojibake نمایش می‌دهد
    - همان دستور در یک پروفایل ترمینال دیگر درست دیده می‌شود

    راه‌حل سریع در PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    سپس Gateway را دوباره راه‌اندازی کنید و دستور خود را دوباره امتحان کنید:

    ```powershell
    openclaw gateway restart
    ```

    اگر هنوز این مشکل را روی آخرین نسخه OpenClaw بازتولید می‌کنید، آن را در اینجا پیگیری/گزارش کنید:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="مستندات به پرسش من پاسخ نداد - چگونه پاسخ بهتری بگیرم؟">
    از **نصب قابل‌دستکاری (git)** استفاده کنید تا کل منبع و مستندات را محلی داشته باشید، سپس از
    ربات خود (یا Claude/Codex) _از همان پوشه_ بپرسید تا بتواند repo را بخواند و دقیق پاسخ دهد.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    جزئیات بیشتر: [نصب](/fa/install) و [پرچم‌های نصب‌کننده](/fa/install/installer).

  </Accordion>

  <Accordion title="چگونه OpenClaw را روی Linux نصب کنم؟">
    پاسخ کوتاه: راهنمای Linux را دنبال کنید، سپس آماده‌سازی اولیه را اجرا کنید.

    - مسیر سریع Linux + نصب سرویس: [Linux](/fa/platforms/linux).
    - راهنمای کامل: [شروع کار](/fa/start/getting-started).
    - نصب‌کننده + به‌روزرسانی‌ها: [نصب و به‌روزرسانی‌ها](/fa/install/updating).

  </Accordion>

  <Accordion title="چگونه OpenClaw را روی یک VPS نصب کنم؟">
    هر VPS لینوکسی کار می‌کند. روی سرور نصب کنید، سپس با SSH/Tailscale به Gateway دسترسی پیدا کنید.

    راهنماها: [exe.dev](/fa/install/exe-dev)، [Hetzner](/fa/install/hetzner)، [Fly.io](/fa/install/fly).
    دسترسی راه‌دور: [Gateway راه‌دور](/fa/gateway/remote).

  </Accordion>

  <Accordion title="راهنماهای نصب cloud/VPS کجا هستند؟">
    ما یک **هاب میزبانی** با ارائه‌دهندگان رایج نگه می‌داریم. یکی را انتخاب کنید و راهنما را دنبال کنید:

    - [میزبانی VPS](/fa/vps) (همه ارائه‌دهندگان در یک جا)
    - [Fly.io](/fa/install/fly)
    - [Hetzner](/fa/install/hetzner)
    - [exe.dev](/fa/install/exe-dev)

    نحوه کار در cloud: **Gateway روی سرور اجرا می‌شود**، و شما از
    لپ‌تاپ/گوشی خود از طریق Control UI (یا Tailscale/SSH) به آن دسترسی پیدا می‌کنید. وضعیت + workspace شما
    روی سرور زندگی می‌کند، پس میزبان را منبع حقیقت بدانید و از آن پشتیبان بگیرید.

    می‌توانید **Nodeها** (Mac/iOS/Android/headless) را با آن Gateway ابری pair کنید تا به
    صفحه/دوربین/canvas محلی دسترسی داشته باشید یا در حالی که Gateway در cloud می‌ماند،
    روی لپ‌تاپ خود دستور اجرا کنید.

    هاب: [پلتفرم‌ها](/fa/platforms). دسترسی راه‌دور: [Gateway راه‌دور](/fa/gateway/remote).
    Nodeها: [Nodeها](/fa/nodes)، [CLI Nodeها](/fa/cli/nodes).

  </Accordion>

  <Accordion title="آیا می‌توانم از OpenClaw بخواهم خودش را به‌روزرسانی کند؟">
    پاسخ کوتاه: **ممکن است، توصیه نمی‌شود**. جریان به‌روزرسانی می‌تواند Gateway را
    دوباره راه‌اندازی کند (که نشست فعال را قطع می‌کند)، ممکن است به یک git checkout تمیز نیاز داشته باشد، و
    می‌تواند تأیید بخواهد. امن‌تر است: به‌روزرسانی‌ها را به‌عنوان operator از یک shell اجرا کنید.

    از CLI استفاده کنید:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    اگر باید از یک agent خودکارسازی کنید:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    مستندات: [به‌روزرسانی](/fa/cli/update)، [به‌روزرسانی](/fa/install/updating).

  </Accordion>

  <Accordion title="آماده‌سازی اولیه دقیقاً چه کار می‌کند؟">
    `openclaw onboard` مسیر راه‌اندازی پیشنهادی است. در **حالت محلی** شما را از این مراحل عبور می‌دهد:

    - **راه‌اندازی مدل/احراز هویت** (OAuth ارائه‌دهنده، کلیدهای API، setup-token مربوط به Anthropic، به‌علاوه گزینه‌های مدل محلی مانند LM Studio)
    - محل **Workspace** + فایل‌های bootstrap
    - **تنظیمات Gateway** (bind/port/auth/tailscale)
    - **کانال‌ها** (WhatsApp، Telegram، Discord، Mattermost، Signal، iMessage، به‌علاوه pluginهای کانال همراه مثل QQ Bot)
    - **نصب daemon** (LaunchAgent در macOS؛ واحد کاربری systemd در Linux/WSL2)
    - **بررسی‌های سلامت** و انتخاب **Skills**

    همچنین اگر مدل پیکربندی‌شده شما ناشناخته باشد یا احراز هویت نداشته باشد، هشدار می‌دهد.

  </Accordion>

  <Accordion title="آیا برای اجرای این به اشتراک Claude یا OpenAI نیاز دارم؟">
    نه. می‌توانید OpenClaw را با **کلیدهای API** (Anthropic/OpenAI/دیگران) یا با
    **مدل‌های فقط‌محلی** اجرا کنید تا داده‌هایتان روی دستگاه خودتان بماند. اشتراک‌ها (Claude
    Pro/Max یا OpenAI Codex) راه‌های اختیاری برای احراز هویت نزد آن ارائه‌دهندگان هستند.

    برای Anthropic در OpenClaw، تقسیم عملی این است:

    - **کلید API Anthropic**: صورتحساب معمول API Anthropic
    - **Claude CLI / احراز هویت اشتراک Claude در OpenClaw**: کارکنان Anthropic
      به ما گفته‌اند که این استفاده دوباره مجاز است، و OpenClaw استفاده از `claude -p`
      را برای این یکپارچه‌سازی مجاز تلقی می‌کند مگر این‌که Anthropic سیاست جدیدی
      منتشر کند

    برای میزبان‌های Gateway بلندمدت، کلیدهای API Anthropic همچنان
    راه‌اندازی قابل‌پیش‌بینی‌تری هستند. OAuth مربوط به OpenAI Codex صراحتاً برای ابزارهای خارجی
    مانند OpenClaw پشتیبانی می‌شود.

    OpenClaw همچنین از گزینه‌های میزبانی‌شده دیگر به سبک اشتراک، از جمله
    **Qwen Cloud Coding Plan**، **MiniMax Coding Plan**، و
    **Z.AI / GLM Coding Plan** پشتیبانی می‌کند.

    مستندات: [Anthropic](/fa/providers/anthropic)، [OpenAI](/fa/providers/openai)،
    [Qwen Cloud](/fa/providers/qwen)،
    [MiniMax](/fa/providers/minimax)، [مدل‌های GLM](/fa/providers/glm)،
    [مدل‌های محلی](/fa/gateway/local-models)، [مدل‌ها](/fa/concepts/models).

  </Accordion>

  <Accordion title="آیا می‌توانم بدون کلید API از اشتراک Claude Max استفاده کنم؟">
    بله.

    کارکنان Anthropic به ما گفته‌اند استفاده از Claude CLI به سبک OpenClaw دوباره مجاز است، بنابراین
    OpenClaw احراز هویت اشتراک Claude و استفاده از `claude -p` را برای این یکپارچه‌سازی
    مجاز تلقی می‌کند مگر این‌که Anthropic سیاست جدیدی منتشر کند. اگر
    قابل‌پیش‌بینی‌ترین راه‌اندازی سمت سرور را می‌خواهید، به‌جای آن از کلید API Anthropic استفاده کنید.

  </Accordion>

  <Accordion title="آیا از احراز هویت اشتراک Claude (Claude Pro یا Max) پشتیبانی می‌کنید؟">
    بله.

    کارکنان Anthropic به ما گفته‌اند این استفاده دوباره مجاز است، بنابراین OpenClaw استفاده مجدد از
    Claude CLI و استفاده از `claude -p` را برای این یکپارچه‌سازی مجاز تلقی می‌کند
    مگر این‌که Anthropic سیاست جدیدی منتشر کند.

    setup-token مربوط به Anthropic همچنان به‌عنوان یک مسیر توکن پشتیبانی‌شده OpenClaw در دسترس است، اما OpenClaw اکنون در صورت دسترس بودن، استفاده مجدد از Claude CLI و `claude -p` را ترجیح می‌دهد.
    برای workloadهای تولیدی یا چندکاربره، احراز هویت با کلید API Anthropic همچنان
    گزینه امن‌تر و قابل‌پیش‌بینی‌تر است. اگر گزینه‌های میزبانی‌شده دیگر به سبک اشتراک را در OpenClaw می‌خواهید، [OpenAI](/fa/providers/openai)، [Qwen / Model
    Cloud](/fa/providers/qwen)، [MiniMax](/fa/providers/minimax)، و [مدل‌های GLM](/fa/providers/glm) را ببینید.

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="چرا HTTP 429 rate_limit_error از Anthropic می‌بینم؟">
    یعنی **سهمیه/محدودیت نرخ Anthropic** شما برای پنجره فعلی تمام شده است. اگر از
    **Claude CLI** استفاده می‌کنید، منتظر بمانید پنجره بازنشانی شود یا plan خود را ارتقا دهید. اگر از
    یک **کلید API Anthropic** استفاده می‌کنید، Anthropic Console را
    برای مصرف/صورتحساب بررسی کنید و در صورت نیاز محدودیت‌ها را افزایش دهید.

    اگر پیام مشخصاً این باشد:
    `Extra usage is required for long context requests`، درخواست در تلاش است از
    بتای context 1M مربوط به Anthropic (`context1m: true`) استفاده کند. این فقط وقتی کار می‌کند که
    credential شما واجد شرایط صورتحساب long-context باشد (صورتحساب کلید API یا مسیر
    ورود Claude در OpenClaw با Extra Usage فعال).

    نکته: یک **مدل پشتیبان** تنظیم کنید تا OpenClaw بتواند هنگام محدودیت نرخ یک ارائه‌دهنده، همچنان پاسخ دهد.
    [مدل‌ها](/fa/cli/models)، [OAuth](/fa/concepts/oauth)، و
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/fa/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) را ببینید.

  </Accordion>

  <Accordion title="آیا AWS Bedrock پشتیبانی می‌شود؟">
    بله. OpenClaw یک ارائه‌دهنده **Amazon Bedrock (Converse)** داخلی دارد. وقتی نشانگرهای محیطی AWS وجود داشته باشند، OpenClaw می‌تواند کاتالوگ Bedrock برای استریم/متن را به‌صورت خودکار کشف کند و آن را به‌عنوان ارائه‌دهنده ضمنی `amazon-bedrock` ادغام کند؛ در غیر این صورت می‌توانید `plugins.entries.amazon-bedrock.config.discovery.enabled` را صراحتا فعال کنید یا یک ورودی ارائه‌دهنده دستی اضافه کنید. [Amazon Bedrock](/fa/providers/bedrock) و [ارائه‌دهندگان مدل](/fa/providers/models) را ببینید. اگر جریان کلید مدیریت‌شده را ترجیح می‌دهید، یک پراکسی سازگار با OpenAI در جلوی Bedrock همچنان گزینه‌ای معتبر است.
  </Accordion>

  <Accordion title="احراز هویت Codex چگونه کار می‌کند؟">
    OpenClaw از **OpenAI Code (Codex)** از طریق OAuth (ورود با ChatGPT) پشتیبانی می‌کند. برای Codex OAuth از طریق اجراکننده پیش‌فرض PI از
    `openai-codex/gpt-5.5` استفاده کنید. برای دسترسی مستقیم با کلید API OpenAI از
    `openai/gpt-5.5` استفاده کنید. GPT-5.5 همچنین می‌تواند از
    اشتراک/OAuth از طریق `openai-codex/gpt-5.5` یا اجراهای بومی سرور اپ Codex
    با `openai/gpt-5.5` و `agentRuntime.id: "codex"` استفاده کند.
    [ارائه‌دهندگان مدل](/fa/concepts/model-providers) و [راه‌اندازی اولیه (CLI)](/fa/start/wizard) را ببینید.
  </Accordion>

  <Accordion title="چرا OpenClaw هنوز openai-codex را ذکر می‌کند؟">
    `openai-codex` شناسه ارائه‌دهنده و پروفایل احراز هویت برای ChatGPT/Codex OAuth است.
    همچنین پیشوند صریح مدل PI برای Codex OAuth است:

    - `openai/gpt-5.5` = مسیر فعلی مستقیم با کلید API OpenAI در PI
    - `openai-codex/gpt-5.5` = مسیر Codex OAuth در PI
    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = مسیر بومی سرور اپ Codex
    - `openai-codex:...` = شناسه پروفایل احراز هویت، نه مرجع مدل

    اگر مسیر مستقیم صورتحساب/محدودیت OpenAI Platform را می‌خواهید،
    `OPENAI_API_KEY` را تنظیم کنید. اگر احراز هویت اشتراک ChatGPT/Codex را می‌خواهید، با
    `openclaw models auth login --provider openai-codex` وارد شوید و برای اجراهای PI از
    مراجع مدل `openai-codex/*` استفاده کنید.

  </Accordion>

  <Accordion title="چرا محدودیت‌های Codex OAuth می‌تواند با وب ChatGPT فرق داشته باشد؟">
    Codex OAuth از پنجره‌های سهمیه وابسته به طرح و مدیریت‌شده توسط OpenAI استفاده می‌کند. در عمل،
    این محدودیت‌ها می‌توانند با تجربه وب‌سایت/اپ ChatGPT متفاوت باشند، حتی وقتی
    هر دو به یک حساب متصل هستند.

    OpenClaw می‌تواند پنجره‌های مصرف/سهمیه ارائه‌دهنده را که اکنون قابل مشاهده‌اند در
    `openclaw models status` نشان دهد، اما استحقاق‌های وب ChatGPT را به دسترسی مستقیم API
    اختراع یا نرمال‌سازی نمی‌کند. اگر مسیر مستقیم صورتحساب/محدودیت OpenAI Platform
    را می‌خواهید، از `openai/*` با یک کلید API استفاده کنید.

  </Accordion>

  <Accordion title="آیا از احراز هویت اشتراک OpenAI (Codex OAuth) پشتیبانی می‌کنید؟">
    بله. OpenClaw به‌طور کامل از **OAuth اشتراک OpenAI Code (Codex)** پشتیبانی می‌کند.
    OpenAI صراحتا استفاده از OAuth اشتراک را در ابزارها/گردش‌کارهای خارجی
    مانند OpenClaw مجاز می‌داند. راه‌اندازی اولیه می‌تواند جریان OAuth را برای شما اجرا کند.

    [OAuth](/fa/concepts/oauth)، [ارائه‌دهندگان مدل](/fa/concepts/model-providers)، و [راه‌اندازی اولیه (CLI)](/fa/start/wizard) را ببینید.

  </Accordion>

  <Accordion title="چگونه Gemini CLI OAuth را راه‌اندازی کنم؟">
    Gemini CLI از یک **جریان احراز هویت Plugin** استفاده می‌کند، نه شناسه کلاینت یا راز در `openclaw.json`.

    مراحل:

    1. Gemini CLI را به‌صورت محلی نصب کنید تا `gemini` در `PATH` باشد
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin را فعال کنید: `openclaw plugins enable google`
    3. وارد شوید: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. مدل پیش‌فرض پس از ورود: `google-gemini-cli/gemini-3-flash-preview`
    5. اگر درخواست‌ها ناموفق بودند، `GOOGLE_CLOUD_PROJECT` یا `GOOGLE_CLOUD_PROJECT_ID` را روی میزبان Gateway تنظیم کنید

    این کار توکن‌های OAuth را در پروفایل‌های احراز هویت روی میزبان Gateway ذخیره می‌کند. جزئیات: [ارائه‌دهندگان مدل](/fa/concepts/model-providers).

  </Accordion>

  <Accordion title="آیا مدل محلی برای گفت‌وگوهای معمولی مناسب است؟">
    معمولا نه. OpenClaw به زمینه بزرگ + ایمنی قوی نیاز دارد؛ کارت‌های کوچک کوتاه می‌کنند و نشت می‌دهند. اگر مجبورید، **بزرگ‌ترین** ساخت مدل را که می‌توانید به‌صورت محلی اجرا کنید (LM Studio) اجرا کنید و [/gateway/local-models](/fa/gateway/local-models) را ببینید. مدل‌های کوچک‌تر/کوانتیزه‌شده خطر تزریق پرامپت را افزایش می‌دهند - [امنیت](/fa/gateway/security) را ببینید.
  </Accordion>

  <Accordion title="چگونه ترافیک مدل میزبانی‌شده را در یک منطقه مشخص نگه دارم؟">
    نقاط پایانی پین‌شده به منطقه را انتخاب کنید. OpenRouter گزینه‌های میزبانی‌شده در آمریکا را برای MiniMax، Kimi، و GLM ارائه می‌دهد؛ برای نگه‌داشتن داده در همان منطقه، گونه میزبانی‌شده در آمریکا را انتخاب کنید. همچنان می‌توانید Anthropic/OpenAI را در کنار این‌ها فهرست کنید، با استفاده از `models.mode: "merge"` تا پشتیبان‌ها در دسترس بمانند و در عین حال ارائه‌دهنده منطقه‌ای انتخابی شما رعایت شود.
  </Accordion>

  <Accordion title="آیا برای نصب این باید Mac Mini بخرم؟">
    نه. OpenClaw روی macOS یا Linux اجرا می‌شود (Windows از طریق WSL2). Mac mini اختیاری است - بعضی افراد
    یکی می‌خرند تا به‌عنوان میزبان همیشه روشن استفاده کنند، اما یک VPS کوچک، سرور خانگی، یا دستگاهی در کلاس Raspberry Pi هم کار می‌کند.

    فقط برای **ابزارهای مخصوص macOS** به Mac نیاز دارید. برای iMessage، از [BlueBubbles](/fa/channels/bluebubbles) استفاده کنید (توصیه‌شده) - سرور BlueBubbles روی هر Mac اجرا می‌شود، و Gateway می‌تواند روی Linux یا جای دیگر اجرا شود. اگر ابزارهای دیگری می‌خواهید که فقط روی macOS هستند، Gateway را روی Mac اجرا کنید یا یک نود macOS جفت کنید.

    مستندات: [BlueBubbles](/fa/channels/bluebubbles)، [نودها](/fa/nodes)، [حالت راه‌دور Mac](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="آیا برای پشتیبانی از iMessage به Mac mini نیاز دارم؟">
    به **یک دستگاه macOS** نیاز دارید که وارد Messages شده باشد. لازم **نیست** Mac mini باشد -
    هر Mac کافی است. برای iMessage **از [BlueBubbles](/fa/channels/bluebubbles)** استفاده کنید (توصیه‌شده) - سرور BlueBubbles روی macOS اجرا می‌شود، در حالی که Gateway می‌تواند روی Linux یا جای دیگر اجرا شود.

    پیکربندی‌های رایج:

    - Gateway را روی Linux/VPS اجرا کنید، و سرور BlueBubbles را روی هر Mac که وارد Messages شده اجرا کنید.
    - اگر ساده‌ترین پیکربندی تک‌ماشینه را می‌خواهید، همه‌چیز را روی Mac اجرا کنید.

    مستندات: [BlueBubbles](/fa/channels/bluebubbles)، [نودها](/fa/nodes)،
    [حالت راه‌دور Mac](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="اگر برای اجرای OpenClaw یک Mac mini بخرم، می‌توانم آن را به MacBook Pro خودم وصل کنم؟">
    بله. **Mac mini می‌تواند Gateway را اجرا کند**، و MacBook Pro شما می‌تواند به‌عنوان یک
    **نود** (دستگاه همراه) وصل شود. نودها Gateway را اجرا نمی‌کنند - قابلیت‌های اضافی
    مثل صفحه‌نمایش/دوربین/بوم و `system.run` را روی همان دستگاه ارائه می‌دهند.

    الگوی رایج:

    - Gateway روی Mac mini (همیشه روشن).
    - MacBook Pro اپ macOS یا یک میزبان نود را اجرا می‌کند و با Gateway جفت می‌شود.
    - برای دیدن آن از `openclaw nodes status` / `openclaw nodes list` استفاده کنید.

    مستندات: [نودها](/fa/nodes)، [CLI نودها](/fa/cli/nodes).

  </Accordion>

  <Accordion title="می‌توانم از Bun استفاده کنم؟">
    Bun **توصیه نمی‌شود**. ما باگ‌های زمان اجرا می‌بینیم، به‌ویژه با WhatsApp و Telegram.
    برای Gatewayهای پایدار از **Node** استفاده کنید.

    اگر هنوز می‌خواهید با Bun آزمایش کنید، آن را روی یک Gateway غیرتولیدی
    بدون WhatsApp/Telegram انجام دهید.

  </Accordion>

  <Accordion title="Telegram: چه چیزی در allowFrom قرار می‌گیرد؟">
    `channels.telegram.allowFrom` **شناسه کاربری Telegram فرستنده انسانی** است (عددی). نام کاربری بات نیست.

    راه‌اندازی فقط شناسه‌های کاربری عددی را می‌خواهد. اگر از قبل ورودی‌های قدیمی `@username` در پیکربندی دارید، `openclaw doctor --fix` می‌تواند تلاش کند آن‌ها را resolve کند.

    ایمن‌تر (بدون بات شخص ثالث):

    - به بات خودتان پیام خصوصی بدهید، سپس `openclaw logs --follow` را اجرا کنید و `from.id` را بخوانید.

    Bot API رسمی:

    - به بات خودتان پیام خصوصی بدهید، سپس `https://api.telegram.org/bot<bot_token>/getUpdates` را فراخوانی کنید و `message.from.id` را بخوانید.

    شخص ثالث (حریم خصوصی کمتر):

    - به `@userinfobot` یا `@getidsbot` پیام خصوصی بدهید.

    [/channels/telegram](/fa/channels/telegram#access-control-and-activation) را ببینید.

  </Accordion>

  <Accordion title="آیا چند نفر می‌توانند با یک شماره WhatsApp از نمونه‌های مختلف OpenClaw استفاده کنند؟">
    بله، از طریق **مسیریابی چندعاملی**. **پیام خصوصی** WhatsApp هر فرستنده (همتا با `kind: "direct"`، فرستنده E.164 مثل `+15551234567`) را به یک `agentId` متفاوت وصل کنید، تا هر شخص فضای کاری و ذخیره نشست خودش را داشته باشد. پاسخ‌ها همچنان از **همان حساب WhatsApp** می‌آیند، و کنترل دسترسی پیام خصوصی (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) برای هر حساب WhatsApp سراسری است. [مسیریابی چندعاملی](/fa/concepts/multi-agent) و [WhatsApp](/fa/channels/whatsapp) را ببینید.
  </Accordion>

  <Accordion title='می‌توانم یک عامل "گفت‌وگوی سریع" و یک عامل "Opus برای کدنویسی" اجرا کنم؟'>
    بله. از مسیریابی چندعاملی استفاده کنید: به هر عامل مدل پیش‌فرض خودش را بدهید، سپس مسیرهای ورودی (حساب ارائه‌دهنده یا همتاهای مشخص) را به هر عامل وصل کنید. پیکربندی نمونه در [مسیریابی چندعاملی](/fa/concepts/multi-agent) آمده است. همچنین [مدل‌ها](/fa/concepts/models) و [پیکربندی](/fa/gateway/configuration) را ببینید.
  </Accordion>

  <Accordion title="آیا Homebrew روی Linux کار می‌کند؟">
    بله. Homebrew از Linux (Linuxbrew) پشتیبانی می‌کند. راه‌اندازی سریع:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    اگر OpenClaw را از طریق systemd اجرا می‌کنید، مطمئن شوید PATH سرویس شامل `/home/linuxbrew/.linuxbrew/bin` (یا پیشوند brew شما) باشد تا ابزارهای نصب‌شده با `brew` در شل‌های غیرورودی resolve شوند.
    ساخت‌های اخیر همچنین دایرکتوری‌های رایج bin کاربر را در سرویس‌های Linux systemd در ابتدا اضافه می‌کنند (برای مثال `~/.local/bin`، `~/.npm-global/bin`، `~/.local/share/pnpm`، `~/.bun/bin`) و وقتی تنظیم شده باشند به `PNPM_HOME`، `NPM_CONFIG_PREFIX`، `BUN_INSTALL`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `NVM_DIR`، و `FNM_DIR` احترام می‌گذارند.

  </Accordion>

  <Accordion title="تفاوت بین نصب قابل هک با git و نصب npm">
    - **نصب قابل هک (git):** دریافت کامل سورس، قابل ویرایش، بهترین گزینه برای مشارکت‌کنندگان.
      شما buildها را به‌صورت محلی اجرا می‌کنید و می‌توانید کد/مستندات را patch کنید.
    - **نصب npm:** نصب CLI سراسری، بدون repo، بهترین گزینه برای «فقط اجرا کردنش».
      به‌روزرسانی‌ها از dist-tagهای npm می‌آیند.

    مستندات: [شروع به کار](/fa/start/getting-started)، [به‌روزرسانی](/fa/install/updating).

  </Accordion>

  <Accordion title="آیا بعدا می‌توانم بین نصب npm و git جابه‌جا شوم؟">
    بله. وقتی OpenClaw از قبل نصب شده است از `openclaw update --channel ...` استفاده کنید.
    این کار **داده‌های شما را حذف نمی‌کند** - فقط نصب کد OpenClaw را تغییر می‌دهد.
    وضعیت شما (`~/.openclaw`) و فضای کاری شما (`~/.openclaw/workspace`) دست‌نخورده می‌مانند.

    از npm به git:

    ```bash
    openclaw update --channel dev
    ```

    از git به npm:

    ```bash
    openclaw update --channel stable
    ```

    برای پیش‌نمایش تغییر حالت برنامه‌ریزی‌شده ابتدا `--dry-run` را اضافه کنید. به‌روزرسان
    پیگیری‌های Doctor را اجرا می‌کند، منابع Plugin را برای کانال هدف تازه‌سازی می‌کند، و
    Gateway را restart می‌کند مگر اینکه `--no-restart` را پاس بدهید.

    نصب‌کننده هم می‌تواند هرکدام از حالت‌ها را اجبار کند:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    نکات پشتیبان‌گیری: [راهبرد پشتیبان‌گیری](#where-things-live-on-disk) را ببینید.

  </Accordion>

  <Accordion title="Gateway را روی لپ‌تاپم اجرا کنم یا روی VPS؟">
    پاسخ کوتاه: **اگر قابلیت اطمینان ۲۴/۷ می‌خواهید، از VPS استفاده کنید**. اگر
    کمترین اصطکاک را می‌خواهید و با sleep/restart مشکلی ندارید، آن را محلی اجرا کنید.

    **لپ‌تاپ (Gateway محلی)**

    - **مزایا:** بدون هزینه سرور، دسترسی مستقیم به فایل‌های محلی، پنجره مرورگر زنده.
    - **معایب:** sleep/قطع شبکه = قطع اتصال، به‌روزرسانی‌ها/rebootهای سیستم‌عامل اختلال ایجاد می‌کنند، باید بیدار بماند.

    **VPS / cloud**

    - **مزایا:** همیشه روشن، شبکه پایدار، بدون مشکل sleep لپ‌تاپ، نگه‌داشتن آن در حال اجرا ساده‌تر است.
    - **معایب:** اغلب headless اجرا می‌شود (از اسکرین‌شات استفاده کنید)، فقط دسترسی راه‌دور به فایل، برای به‌روزرسانی‌ها باید SSH کنید.

    **نکته مخصوص OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord همگی از VPS به‌خوبی کار می‌کنند. تنها بده‌بستان واقعی **مرورگر headless** در برابر پنجره قابل مشاهده است. [مرورگر](/fa/tools/browser) را ببینید.

    **پیش‌فرض پیشنهادی:** اگر قبلاً قطع اتصال Gateway داشته‌اید، VPS. حالت محلی زمانی عالی است که فعالانه از Mac استفاده می‌کنید و دسترسی به فایل‌های محلی یا خودکارسازی UI با مرورگر قابل مشاهده می‌خواهید.

  </Accordion>

  <Accordion title="اجرای OpenClaw روی یک دستگاه اختصاصی چقدر مهم است؟">
    الزامی نیست، اما **برای قابلیت اطمینان و ایزوله‌سازی توصیه می‌شود**.

    - **میزبان اختصاصی (VPS/Mac mini/Pi):** همیشه روشن، وقفه‌های کمتر ناشی از خواب/راه‌اندازی مجدد، مجوزهای تمیزتر، و نگه‌داری آسان‌تر در حالت اجرا.
    - **لپ‌تاپ/دسکتاپ مشترک:** برای آزمایش و استفاده فعال کاملاً مناسب است، اما وقتی دستگاه به حالت خواب می‌رود یا به‌روزرسانی می‌شود، انتظار توقف داشته باشید.

    اگر بهترین حالت هر دو را می‌خواهید، Gateway را روی یک میزبان اختصاصی نگه دارید و لپ‌تاپ خود را به‌عنوان یک **Node** برای ابزارهای صفحه‌نمایش/دوربین/اجرا جفت کنید. [Nodes](/fa/nodes) را ببینید.
    برای راهنمایی امنیتی، [Security](/fa/gateway/security) را بخوانید.

  </Accordion>

  <Accordion title="حداقل نیازمندی‌های VPS و سیستم‌عامل پیشنهادی چیست؟">
    OpenClaw سبک است. برای یک Gateway پایه + یک کانال چت:

    - **حداقل مطلق:** 1 vCPU، ‏1GB RAM، حدود 500MB دیسک.
    - **پیشنهادی:** 1-2 vCPU، ‏2GB RAM یا بیشتر برای فضای مانور (لاگ‌ها، رسانه، چند کانال). ابزارهای Node و خودکارسازی مرورگر می‌توانند منابع زیادی مصرف کنند.

    سیستم‌عامل: از **Ubuntu LTS** (یا هر Debian/Ubuntu مدرن) استفاده کنید. مسیر نصب Linux در آنجا بهتر آزمایش شده است.

    مستندات: [Linux](/fa/platforms/linux)، [میزبانی VPS](/fa/vps).

  </Accordion>

  <Accordion title="آیا می‌توانم OpenClaw را در VM اجرا کنم و نیازمندی‌ها چیست؟">
    بله. با VM همانند VPS رفتار کنید: باید همیشه روشن، در دسترس، و دارای RAM کافی
    برای Gateway و هر کانالی باشد که فعال می‌کنید.

    راهنمای پایه:

    - **حداقل مطلق:** 1 vCPU، ‏1GB RAM.
    - **پیشنهادی:** اگر چند کانال، خودکارسازی مرورگر، یا ابزارهای رسانه‌ای اجرا می‌کنید، 2GB RAM یا بیشتر.
    - **سیستم‌عامل:** Ubuntu LTS یا یک Debian/Ubuntu مدرن دیگر.

    اگر روی Windows هستید، **WSL2 ساده‌ترین راه‌اندازی به سبک VM است** و بهترین سازگاری
    با ابزارها را دارد. [Windows](/fa/platforms/windows)، [میزبانی VPS](/fa/vps) را ببینید.
    اگر macOS را در VM اجرا می‌کنید، [macOS VM](/fa/install/macos-vm) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [FAQ](/fa/help/faq) — پرسش‌های متداول اصلی (مدل‌ها، نشست‌ها، Gateway، امنیت، موارد بیشتر)
- [نمای کلی نصب](/fa/install)
- [شروع به کار](/fa/start/getting-started)
- [عیب‌یابی](/fa/help/troubleshooting)
