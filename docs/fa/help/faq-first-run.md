---
read_when:
    - نصب جدید، گیر کردن فرایند راه‌اندازی اولیه، یا خطاهای اجرای نخست
    - انتخاب احراز هویت و اشتراک‌های ارائه‌دهنده
    - دسترسی به docs.openclaw.ai ممکن نیست، داشبورد باز نمی‌شود، نصب گیر کرده است
sidebarTitle: First-run FAQ
summary: 'سؤالات متداول: شروع سریع و پیکربندی اجرای نخست — نصب، راه‌اندازی اولیه، احراز هویت، اشتراک‌ها، خرابی‌های اولیه'
title: 'پرسش‌های متداول: راه‌اندازی اولیه'
x-i18n:
    generated_at: "2026-05-02T22:20:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1205a046617c5d25ca1b180fca1a34fe0a5e7d0fc6a820ef44ebba4d723236f5
    source_path: help/faq-first-run.md
    workflow: 16
---

  پرسش‌وپاسخ راه‌اندازی سریع و اجرای نخست. برای عملیات روزمره، مدل‌ها، احراز هویت، نشست‌ها،
  و عیب‌یابی، پرسش‌های متداول اصلی را ببینید: [پرسش‌های متداول](/fa/help/faq).

  ## راه‌اندازی سریع و تنظیمات اجرای نخست

  <AccordionGroup>
  <Accordion title="گیر کرده‌ام، سریع‌ترین راه برای بیرون آمدن از بن‌بست">
    از یک عامل هوش مصنوعی محلی استفاده کنید که بتواند **دستگاه شما را ببیند**. این کار بسیار مؤثرتر از پرسیدن
    در Discord است، چون بیشتر موارد «گیر کرده‌ام» به **مشکلات پیکربندی یا محیط محلی** مربوط‌اند که
    کمک‌کنندگان راه دور نمی‌توانند بررسی کنند.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    این ابزارها می‌توانند مخزن را بخوانند، فرمان‌ها را اجرا کنند، لاگ‌ها را بررسی کنند، و به رفع تنظیمات
    سطح دستگاه شما کمک کنند (PATH، سرویس‌ها، مجوزها، فایل‌های احراز هویت). با نصب قابل‌هک (git)،
    **checkout کامل منبع** را در اختیارشان بگذارید:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    این کار OpenClaw را **از یک checkout گیت** نصب می‌کند، بنابراین عامل می‌تواند کد + مستندات را بخواند و
    درباره نسخه دقیقی که اجرا می‌کنید استدلال کند. همیشه می‌توانید بعدا با اجرای دوباره نصب‌کننده بدون
    `--install-method git` به نسخه پایدار برگردید.

    نکته: از عامل بخواهید رفع مشکل را **برنامه‌ریزی و نظارت** کند (گام‌به‌گام)، سپس فقط
    فرمان‌های ضروری را اجرا کند. این کار تغییرات را کوچک و بررسی آن‌ها را آسان‌تر نگه می‌دارد.

    اگر یک باگ واقعی یا اصلاحی پیدا کردید، لطفا یک issue در GitHub ثبت کنید یا یک PR بفرستید:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    با این فرمان‌ها شروع کنید (هنگام درخواست کمک، خروجی‌ها را به اشتراک بگذارید):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    کار آن‌ها:

    - `openclaw status`: نمایی سریع از سلامت gateway/agent + پیکربندی پایه.
    - `openclaw models status`: احراز هویت ارائه‌دهنده + دردسترس‌بودن مدل را بررسی می‌کند.
    - `openclaw doctor`: مشکلات رایج پیکربندی/وضعیت را اعتبارسنجی و ترمیم می‌کند.

    بررسی‌های مفید دیگر CLI: `openclaw status --all`، `openclaw logs --follow`،
    `openclaw gateway status`، `openclaw health --verbose`.

    چرخه عیب‌یابی سریع: [۶۰ ثانیه اول اگر چیزی خراب است](/fa/help/faq#first-60-seconds-if-something-is-broken).
    مستندات نصب: [نصب](/fa/install)، [فلگ‌های نصب‌کننده](/fa/install/installer)، [به‌روزرسانی](/fa/install/updating).

  </Accordion>

  <Accordion title="Heartbeat مدام رد می‌شود. دلیل‌های رد شدن یعنی چه؟">
    دلیل‌های رایج رد شدن heartbeat:

    - `quiet-hours`: خارج از بازه active-hours پیکربندی‌شده
    - `empty-heartbeat-file`: `HEARTBEAT.md` وجود دارد اما فقط داربست خالی/فقط‌سربرگ دارد
    - `no-tasks-due`: حالت وظیفه `HEARTBEAT.md` فعال است اما هنوز موعد هیچ‌کدام از بازه‌های وظیفه نرسیده است
    - `alerts-disabled`: همه نمایش‌های heartbeat غیرفعال شده‌اند (`showOk`، `showAlerts`، و `useIndicator` همگی خاموش‌اند)

    در حالت وظیفه، مهرزمان‌های موعد فقط پس از کامل شدن اجرای واقعی heartbeat
    جلو برده می‌شوند. اجراهای ردشده، وظیفه‌ها را تکمیل‌شده علامت نمی‌زنند.

    مستندات: [Heartbeat](/fa/gateway/heartbeat)، [اتوماسیون و وظیفه‌ها](/fa/automation).

  </Accordion>

  <Accordion title="روش پیشنهادی برای نصب و راه‌اندازی OpenClaw">
    مخزن پیشنهاد می‌کند از سورس اجرا کنید و از onboarding استفاده کنید:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    ویزارد همچنین می‌تواند assetهای رابط کاربری را به‌طور خودکار بسازد. پس از onboarding، معمولا Gateway را روی پورت **18789** اجرا می‌کنید.

    از سورس (مشارکت‌کنندگان/توسعه):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    اگر هنوز نصب global ندارید، آن را با `pnpm openclaw onboard` اجرا کنید.

  </Accordion>

  <Accordion title="پس از onboarding چطور داشبورد را باز کنم؟">
    ویزارد بلافاصله پس از onboarding مرورگر شما را با یک URL تمیزِ داشبورد (بدون توکن) باز می‌کند و همچنین لینک را در خلاصه چاپ می‌کند. آن تب را باز نگه دارید؛ اگر اجرا نشد، URL چاپ‌شده را روی همان دستگاه کپی/پیست کنید.
  </Accordion>

  <Accordion title="چطور داشبورد را روی localhost در برابر راه دور احراز هویت کنم؟">
    **Localhost (همان دستگاه):**

    - `http://127.0.0.1:18789/` را باز کنید.
    - اگر احراز هویت shared-secret خواست، توکن یا گذرواژه پیکربندی‌شده را در تنظیمات رابط کاربری کنترل جای‌گذاری کنید.
    - منبع توکن: `gateway.auth.token` (یا `OPENCLAW_GATEWAY_TOKEN`).
    - منبع گذرواژه: `gateway.auth.password` (یا `OPENCLAW_GATEWAY_PASSWORD`).
    - اگر هنوز shared secret پیکربندی نشده است، با `openclaw doctor --generate-gateway-token` یک توکن بسازید.

    **نه روی localhost:**

    - **Tailscale Serve** (پیشنهادی): bind را روی loopback نگه دارید، `openclaw gateway --tailscale serve` را اجرا کنید، `https://<magicdns>/` را باز کنید. اگر `gateway.auth.allowTailscale` برابر `true` باشد، سربرگ‌های هویت احراز هویت رابط کاربری کنترل/WebSocket را تأمین می‌کنند (بدون shared secret جای‌گذاری‌شده، با فرض میزبان Gateway مورداعتماد)؛ APIهای HTTP همچنان به احراز هویت shared-secret نیاز دارند مگر اینکه عمدا از private-ingress `none` یا احراز هویت HTTP با trusted-proxy استفاده کنید.
      تلاش‌های همزمان ناموفق برای احراز هویت Serve از همان کلاینت، پیش از اینکه محدودکننده failed-auth آن‌ها را ثبت کند، سریالی می‌شوند؛ بنابراین دومین تلاش ناموفق می‌تواند از قبل `retry later` نشان دهد.
    - **bind در Tailnet**: `openclaw gateway --bind tailnet --token "<token>"` را اجرا کنید (یا احراز هویت گذرواژه را پیکربندی کنید)، `http://<tailscale-ip>:18789/` را باز کنید، سپس shared secret متناظر را در تنظیمات داشبورد جای‌گذاری کنید.
    - **پراکسی معکوس آگاه از هویت**: Gateway را پشت یک پراکسی مورداعتماد نگه دارید، `gateway.auth.mode: "trusted-proxy"` را پیکربندی کنید، سپس URL پراکسی را باز کنید. پراکسی‌های loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند.
    - **تونل SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` سپس `http://127.0.0.1:18789/` را باز کنید. احراز هویت shared-secret همچنان روی تونل اعمال می‌شود؛ اگر خواسته شد توکن یا گذرواژه پیکربندی‌شده را جای‌گذاری کنید.

    برای حالت‌های bind و جزئیات احراز هویت، [داشبورد](/fa/web/dashboard) و [سطح‌های وب](/fa/web) را ببینید.

  </Accordion>

  <Accordion title="چرا برای تأییدهای chat دو پیکربندی exec approval وجود دارد؟">
    آن‌ها لایه‌های متفاوتی را کنترل می‌کنند:

    - `approvals.exec`: درخواست‌های تأیید را به مقصدهای chat ارسال می‌کند
    - `channels.<channel>.execApprovals`: آن channel را برای exec approvals به یک کلاینت تأیید بومی تبدیل می‌کند

    سیاست exec میزبان همچنان دروازه واقعی تأیید است. پیکربندی chat فقط کنترل می‌کند درخواست‌های تأیید
    کجا ظاهر شوند و افراد چگونه بتوانند به آن‌ها پاسخ دهند.

    در بیشتر تنظیمات به **هر دو** نیاز ندارید:

    - اگر chat از قبل از فرمان‌ها و پاسخ‌ها پشتیبانی کند، `/approve` در همان chat از مسیر مشترک کار می‌کند.
    - اگر یک channel بومی پشتیبانی‌شده بتواند تأییدکنندگان را با اطمینان استنباط کند، OpenClaw اکنون وقتی `channels.<channel>.execApprovals.enabled` تنظیم نشده یا `"auto"` باشد، تأییدهای بومی DM-first را خودکار فعال می‌کند.
    - وقتی کارت‌ها/دکمه‌های تأیید بومی در دسترس باشند، آن رابط کاربری بومی مسیر اصلی است؛ عامل فقط زمانی باید فرمان دستی `/approve` را درج کند که نتیجه ابزار بگوید chat approvals در دسترس نیستند یا تأیید دستی تنها مسیر است.
    - فقط وقتی از `approvals.exec` استفاده کنید که درخواست‌ها باید به chatهای دیگر یا اتاق‌های صریح عملیات هم ارسال شوند.
    - فقط وقتی از `channels.<channel>.execApprovals.target: "channel"` یا `"both"` استفاده کنید که صراحتا می‌خواهید درخواست‌های تأیید به اتاق/موضوع مبدأ ارسال شوند.
    - تأییدهای Plugin دوباره جدا هستند: آن‌ها به‌طور پیش‌فرض از `/approve` در همان chat، ارسال اختیاری `approvals.plugin`، و فقط در برخی channelهای بومی از handling بومی تأیید Plugin در کنار آن استفاده می‌کنند.

    نسخه کوتاه: forwarding برای مسیریابی است، پیکربندی کلاینت بومی برای تجربه کاربری غنی‌تر و اختصاصی channel است.
    [Exec Approvals](/fa/tools/exec-approvals) را ببینید.

  </Accordion>

  <Accordion title="به چه runtime نیاز دارم؟">
    Node **>= 22** لازم است. `pnpm` پیشنهاد می‌شود. Bun برای Gateway **پیشنهاد نمی‌شود**.
  </Accordion>

  <Accordion title="آیا روی Raspberry Pi اجرا می‌شود؟">
    بله. Gateway سبک است - مستندات **512MB-1GB RAM**، **1 core**، و حدود **500MB**
    دیسک را برای استفاده شخصی کافی می‌دانند و اشاره می‌کنند که **Raspberry Pi 4 می‌تواند آن را اجرا کند**.

    اگر فضای اضافه می‌خواهید (لاگ‌ها، رسانه، سرویس‌های دیگر)، **2GB پیشنهاد می‌شود**، اما
    حداقل سختگیرانه نیست.

    نکته: یک Pi/VPS کوچک می‌تواند میزبان Gateway باشد، و می‌توانید **nodeها** را روی لپ‌تاپ/تلفن خود برای
    صفحه‌نمایش/دوربین/canvas محلی یا اجرای فرمان pair کنید. [Nodeها](/fa/nodes) را ببینید.

  </Accordion>

  <Accordion title="نکته‌ای برای نصب روی Raspberry Pi دارید؟">
    نسخه کوتاه: کار می‌کند، اما انتظار لبه‌های ناصاف داشته باشید.

    - از یک سیستم‌عامل **64-bit** استفاده کنید و Node >= 22 را نگه دارید.
    - نصب **قابل‌هک (git)** را ترجیح دهید تا بتوانید لاگ‌ها را ببینید و سریع به‌روزرسانی کنید.
    - بدون channelها/Skills شروع کنید، سپس آن‌ها را یکی‌یکی اضافه کنید.
    - اگر به مشکلات عجیب binary برخوردید، معمولا مشکل **سازگاری ARM** است.

    مستندات: [Linux](/fa/platforms/linux)، [نصب](/fa/install).

  </Accordion>

  <Accordion title="روی wake up my friend گیر کرده است / onboarding از تخم بیرون نمی‌آید. حالا چه کنم؟">
    آن صفحه به قابل‌دسترسی و احرازهویت‌شده بودن Gateway وابسته است. TUI همچنین
    "Wake up, my friend!" را در نخستین hatch به‌طور خودکار می‌فرستد. اگر آن خط را با **بدون پاسخ**
    می‌بینید و توکن‌ها روی 0 می‌مانند، عامل هرگز اجرا نشده است.

    1. Gateway را راه‌اندازی دوباره کنید:

    ```bash
    openclaw gateway restart
    ```

    2. وضعیت + احراز هویت را بررسی کنید:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. اگر هنوز معلق ماند، اجرا کنید:

    ```bash
    openclaw doctor
    ```

    اگر Gateway راه دور است، مطمئن شوید اتصال tunnel/Tailscale برقرار است و رابط کاربری
    به Gateway درست اشاره می‌کند. [دسترسی راه دور](/fa/gateway/remote) را ببینید.

  </Accordion>

  <Accordion title="آیا می‌توانم تنظیماتم را بدون انجام دوباره onboarding به دستگاه جدید (Mac mini) منتقل کنم؟">
    بله. **دایرکتوری وضعیت** و **workspace** را کپی کنید، سپس یک بار Doctor را اجرا کنید. این کار
    بات شما را «دقیقا همان‌طور» نگه می‌دارد (حافظه، تاریخچه نشست، احراز هویت، و وضعیت channel)
    به شرطی که **هر دو** مکان را کپی کنید:

    1. OpenClaw را روی دستگاه جدید نصب کنید.
    2. `$OPENCLAW_STATE_DIR` (پیش‌فرض: `~/.openclaw`) را از دستگاه قدیمی کپی کنید.
    3. workspace خود را کپی کنید (پیش‌فرض: `~/.openclaw/workspace`).
    4. `openclaw doctor` را اجرا کنید و سرویس Gateway را راه‌اندازی دوباره کنید.

    این کار پیکربندی، پروفایل‌های احراز هویت، اعتبارنامه‌های WhatsApp، نشست‌ها، و حافظه را حفظ می‌کند. اگر در
    حالت راه دور هستید، به یاد داشته باشید میزبان gateway مالک ذخیره نشست و workspace است.

    **مهم:** اگر فقط workspace خود را commit/push کنید، از **حافظه + فایل‌های bootstrap** پشتیبان می‌گیرید،
    اما از تاریخچه نشست یا احراز هویت **نه**. آن‌ها زیر `~/.openclaw/` قرار دارند
    (برای مثال `~/.openclaw/agents/<agentId>/sessions/`).

    مرتبط: [مهاجرت](/fa/install/migrating)، [چیزها روی دیسک کجا قرار دارند](/fa/help/faq#where-things-live-on-disk)،
    [workspace عامل](/fa/concepts/agent-workspace)، [Doctor](/fa/gateway/doctor)،
    [حالت راه دور](/fa/gateway/remote).

  </Accordion>

  <Accordion title="کجا ببینم در آخرین نسخه چه چیز تازه‌ای وجود دارد؟">
    changelog در GitHub را بررسی کنید:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    تازه‌ترین ورودی‌ها در بالا هستند. اگر بخش بالایی با **Unreleased** علامت‌گذاری شده باشد، بخش تاریخ‌دار بعدی
    آخرین نسخه منتشرشده است. ورودی‌ها بر اساس **Highlights**، **Changes**، و
    **Fixes** گروه‌بندی شده‌اند (به‌علاوه بخش‌های مستندات/دیگر در صورت نیاز).

  </Accordion>

  <Accordion title="نمی‌توانم به docs.openclaw.ai دسترسی پیدا کنم (خطای SSL)">
    برخی اتصال‌های Comcast/Xfinity به‌اشتباه `docs.openclaw.ai` را از طریق Xfinity
    Advanced Security مسدود می‌کنند. آن را غیرفعال کنید یا `docs.openclaw.ai` را allowlist کنید، سپس دوباره تلاش کنید.
    لطفا با گزارش در اینجا به ما کمک کنید آن را از انسداد خارج کنیم: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    اگر هنوز نمی‌توانید به سایت دسترسی پیدا کنید، مستندات در GitHub آینه‌سازی شده‌اند:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="تفاوت بین پایدار و بتا">
    **پایدار** و **بتا**، **npm dist-tags** هستند، نه خط‌های کد جداگانه:

    - `latest` = پایدار
    - `beta` = بیلد زودهنگام برای آزمایش

    معمولا، یک انتشار پایدار ابتدا روی **beta** قرار می‌گیرد، سپس یک مرحله
    ارتقای صریح همان نسخه را به `latest` منتقل می‌کند. نگه‌دارندگان همچنین می‌توانند
    در صورت نیاز مستقیما روی `latest` منتشر کنند. به همین دلیل، بتا و پایدار می‌توانند
    پس از ارتقا به **همان نسخه** اشاره کنند.

    ببینید چه چیزی تغییر کرده است:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    برای تک‌خطی‌های نصب و تفاوت بین بتا و dev، آکاردئون زیر را ببینید.

  </Accordion>

  <Accordion title="چگونه نسخه بتا را نصب کنم و تفاوت بین بتا و dev چیست؟">
    **بتا** همان npm dist-tag به نام `beta` است (ممکن است پس از ارتقا با `latest` یکسان باشد).
    **Dev** سرِ متحرک `main` (git) است؛ وقتی منتشر شود، از npm dist-tag به نام `dev` استفاده می‌کند.

    تک‌خطی‌ها (macOS/Linux):

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

    این کار به شاخه `main` سوییچ می‌کند و از سورس به‌روزرسانی می‌کند.

    2. **نصب قابل هک (از سایت نصب‌کننده):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    این کار یک مخزن محلی به شما می‌دهد که می‌توانید آن را ویرایش کنید، سپس از طریق git به‌روزرسانی کنید.

    اگر یک کلون تمیز دستی را ترجیح می‌دهید، از این استفاده کنید:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    مستندات: [به‌روزرسانی](/fa/cli/update)، [کانال‌های توسعه](/fa/install/development-channels)،
    [نصب](/fa/install).

  </Accordion>

  <Accordion title="نصب و آغازبه‌کار معمولا چقدر طول می‌کشد؟">
    راهنمای تقریبی:

    - **نصب:** ۲ تا ۵ دقیقه
    - **آغازبه‌کار:** ۵ تا ۱۵ دقیقه بسته به اینکه چند کانال/مدل را پیکربندی می‌کنید

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
    دو مشکل رایج در Windows:

    **۱) خطای npm با spawn git / پیدا نشدن git**

    - **Git for Windows** را نصب کنید و مطمئن شوید `git` در PATH شما قرار دارد.
    - PowerShell را ببندید و دوباره باز کنید، سپس نصب‌کننده را دوباره اجرا کنید.

    **۲) openclaw پس از نصب شناخته نمی‌شود**

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

  <Accordion title="خروجی exec در Windows متن چینی به‌هم‌ریخته نشان می‌دهد - چه کار کنم؟">
    این معمولا یک ناهماهنگی صفحه کد کنسول در شل‌های بومی Windows است.

    نشانه‌ها:

    - خروجی `system.run`/`exec`، متن چینی را به‌صورت mojibake نمایش می‌دهد
    - همان فرمان در پروفایل ترمینال دیگری درست به نظر می‌رسد

    راهکار سریع در PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    سپس Gateway را دوباره راه‌اندازی کنید و فرمان خود را دوباره امتحان کنید:

    ```powershell
    openclaw gateway restart
    ```

    اگر هنوز این مشکل را در آخرین نسخه OpenClaw بازتولید می‌کنید، آن را در اینجا پیگیری/گزارش کنید:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="مستندات به پرسش من پاسخ نداد - چگونه پاسخ بهتری بگیرم؟">
    از **نصب قابل هک (git)** استفاده کنید تا سورس و مستندات کامل را به‌صورت محلی داشته باشید، سپس از
    ربات خود (یا Claude/Codex) _از همان پوشه_ بپرسید تا بتواند مخزن را بخواند و دقیق پاسخ دهد.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    جزئیات بیشتر: [نصب](/fa/install) و [پرچم‌های نصب‌کننده](/fa/install/installer).

  </Accordion>

  <Accordion title="چگونه OpenClaw را روی Linux نصب کنم؟">
    پاسخ کوتاه: راهنمای Linux را دنبال کنید، سپس آغازبه‌کار را اجرا کنید.

    - مسیر سریع Linux + نصب سرویس: [Linux](/fa/platforms/linux).
    - راهنمای کامل گام‌به‌گام: [شروع کار](/fa/start/getting-started).
    - نصب‌کننده + به‌روزرسانی‌ها: [نصب و به‌روزرسانی‌ها](/fa/install/updating).

  </Accordion>

  <Accordion title="چگونه OpenClaw را روی VPS نصب کنم؟">
    هر VPS مبتنی بر Linux کار می‌کند. روی سرور نصب کنید، سپس برای دسترسی به Gateway از SSH/Tailscale استفاده کنید.

    راهنماها: [exe.dev](/fa/install/exe-dev)، [Hetzner](/fa/install/hetzner)، [Fly.io](/fa/install/fly).
    دسترسی راه‌دور: [Gateway راه‌دور](/fa/gateway/remote).

  </Accordion>

  <Accordion title="راهنماهای نصب ابری/VPS کجا هستند؟">
    ما یک **هاب میزبانی** با ارائه‌دهندگان رایج نگه می‌داریم. یکی را انتخاب کنید و راهنما را دنبال کنید:

    - [میزبانی VPS](/fa/vps) (همه ارائه‌دهندگان در یک جا)
    - [Fly.io](/fa/install/fly)
    - [Hetzner](/fa/install/hetzner)
    - [exe.dev](/fa/install/exe-dev)

    نحوه کار در ابر: **Gateway روی سرور اجرا می‌شود**، و شما از
    لپ‌تاپ/تلفن خود از طریق Control UI (یا Tailscale/SSH) به آن دسترسی پیدا می‌کنید. وضعیت + فضای کاری شما
    روی سرور قرار دارد، پس میزبان را منبع حقیقت در نظر بگیرید و از آن پشتیبان بگیرید.

    می‌توانید **nodes** (Mac/iOS/Android/headless) را به آن Gateway ابری جفت کنید تا به
    صفحه/دوربین/canvas محلی دسترسی داشته باشید یا در حالی که
    Gateway در ابر است، روی لپ‌تاپ خود فرمان اجرا کنید.

    هاب: [پلتفرم‌ها](/fa/platforms). دسترسی راه‌دور: [Gateway راه‌دور](/fa/gateway/remote).
    Nodes: [Nodes](/fa/nodes)، [CLI مربوط به Nodes](/fa/cli/nodes).

  </Accordion>

  <Accordion title="آیا می‌توانم از OpenClaw بخواهم خودش را به‌روزرسانی کند؟">
    پاسخ کوتاه: **ممکن است، توصیه نمی‌شود**. جریان به‌روزرسانی می‌تواند
    Gateway را دوباره راه‌اندازی کند (که نشست فعال را قطع می‌کند)، ممکن است به یک git checkout تمیز نیاز داشته باشد، و
    می‌تواند برای تایید درخواست کند. ایمن‌تر: به‌روزرسانی‌ها را به‌عنوان اپراتور از یک شل اجرا کنید.

    از CLI استفاده کنید:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    اگر ناچارید از یک عامل خودکارسازی کنید:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    مستندات: [به‌روزرسانی](/fa/cli/update)، [به‌روزرسانی](/fa/install/updating).

  </Accordion>

  <Accordion title="آغازبه‌کار دقیقا چه کاری انجام می‌دهد؟">
    `openclaw onboard` مسیر پیشنهادی راه‌اندازی است. در **حالت محلی** شما را از این موارد عبور می‌دهد:

    - **راه‌اندازی مدل/احراز هویت** (OAuth ارائه‌دهنده، کلیدهای API، setup-token مربوط به Anthropic، به‌علاوه گزینه‌های مدل محلی مانند LM Studio)
    - مکان **فضای کاری** + فایل‌های bootstrap
    - **تنظیمات Gateway** (bind/port/auth/tailscale)
    - **کانال‌ها** (WhatsApp، Telegram، Discord، Mattermost، Signal، iMessage، به‌علاوه Pluginهای کانال بسته‌بندی‌شده مانند QQ Bot)
    - **نصب Daemon** (LaunchAgent در macOS؛ واحد کاربر systemd در Linux/WSL2)
    - **بررسی‌های سلامت** و انتخاب **Skills**

    همچنین اگر مدل پیکربندی‌شده شما ناشناخته باشد یا احراز هویت نداشته باشد، هشدار می‌دهد.

  </Accordion>

  <Accordion title="آیا برای اجرای این به اشتراک Claude یا OpenAI نیاز دارم؟">
    خیر. می‌توانید OpenClaw را با **کلیدهای API** (Anthropic/OpenAI/سایر موارد) یا با
    **مدل‌های فقط محلی** اجرا کنید تا داده‌هایتان روی دستگاهتان بماند. اشتراک‌ها (Claude
    Pro/Max یا OpenAI Codex) روش‌های اختیاری برای احراز هویت آن ارائه‌دهندگان هستند.

    برای Anthropic در OpenClaw، تفکیک عملی این است:

    - **کلید API Anthropic**: صورت‌حساب معمول API Anthropic
    - **Claude CLI / احراز هویت اشتراک Claude در OpenClaw**: کارکنان Anthropic
      به ما گفته‌اند این استفاده دوباره مجاز است، و OpenClaw استفاده از `claude -p`
      را برای این یکپارچه‌سازی مجاز تلقی می‌کند مگر اینکه Anthropic سیاست جدیدی منتشر کند

    برای میزبان‌های gateway بلندمدت، کلیدهای API Anthropic همچنان راه‌اندازی
    قابل پیش‌بینی‌تری هستند. OpenAI Codex OAuth صراحتا برای ابزارهای خارجی
    مانند OpenClaw پشتیبانی می‌شود.

    OpenClaw همچنین از گزینه‌های میزبانی‌شده دیگر با سبک اشتراک، از جمله
    **Qwen Cloud Coding Plan**، **MiniMax Coding Plan**، و
    **Z.AI / GLM Coding Plan** پشتیبانی می‌کند.

    مستندات: [Anthropic](/fa/providers/anthropic)، [OpenAI](/fa/providers/openai)،
    [Qwen Cloud](/fa/providers/qwen)،
    [MiniMax](/fa/providers/minimax)، [مدل‌های GLM](/fa/providers/glm)،
    [مدل‌های محلی](/fa/gateway/local-models)، [مدل‌ها](/fa/concepts/models).

  </Accordion>

  <Accordion title="آیا می‌توانم از اشتراک Claude Max بدون کلید API استفاده کنم؟">
    بله.

    کارکنان Anthropic به ما گفته‌اند استفاده به سبک OpenClaw از Claude CLI دوباره مجاز است، بنابراین
    OpenClaw احراز هویت اشتراک Claude و استفاده از `claude -p` را
    برای این یکپارچه‌سازی مجاز تلقی می‌کند مگر اینکه Anthropic سیاست جدیدی منتشر کند. اگر
    قابل پیش‌بینی‌ترین راه‌اندازی سمت سرور را می‌خواهید، به‌جای آن از یک کلید API Anthropic استفاده کنید.

  </Accordion>

  <Accordion title="آیا از احراز هویت اشتراک Claude (Claude Pro یا Max) پشتیبانی می‌کنید؟">
    بله.

    کارکنان Anthropic به ما گفته‌اند این استفاده دوباره مجاز است، بنابراین OpenClaw استفاده مجدد از
    Claude CLI و استفاده از `claude -p` را برای این یکپارچه‌سازی
    مجاز تلقی می‌کند مگر اینکه Anthropic سیاست جدیدی منتشر کند.

    setup-token مربوط به Anthropic همچنان به‌عنوان یک مسیر توکن پشتیبانی‌شده OpenClaw در دسترس است، اما OpenClaw اکنون در صورت امکان استفاده مجدد از Claude CLI و `claude -p` را ترجیح می‌دهد.
    برای بارهای کاری تولیدی یا چندکاربره، احراز هویت با کلید API Anthropic همچنان
    انتخاب ایمن‌تر و قابل پیش‌بینی‌تری است. اگر گزینه‌های میزبانی‌شده دیگر با سبک اشتراک
    را در OpenClaw می‌خواهید، [OpenAI](/fa/providers/openai)، [Qwen / Model
    Cloud](/fa/providers/qwen)، [MiniMax](/fa/providers/minimax)، و [مدل‌های GLM](/fa/providers/glm)
    را ببینید.

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="چرا HTTP 429 rate_limit_error از Anthropic می‌بینم؟">
    این یعنی **سهمیه/محدودیت نرخ Anthropic** شما برای پنجره فعلی تمام شده است. اگر از
    **Claude CLI** استفاده می‌کنید، منتظر بمانید تا پنجره بازنشانی شود یا پلن خود را ارتقا دهید. اگر از
    **کلید API Anthropic** استفاده می‌کنید، Anthropic Console
    را برای مصرف/صورت‌حساب بررسی کنید و در صورت نیاز محدودیت‌ها را افزایش دهید.

    اگر پیام مشخصاً این باشد:
    `Extra usage is required for long context requests`، درخواست در حال تلاش برای استفاده از بتای زمینه ۱ میلیونی Anthropic (`context1m: true`) است. این فقط زمانی کار می‌کند که
    اعتبارنامه شما واجد شرایط صورت‌حساب زمینه طولانی باشد (صورت‌حساب کلید API یا مسیر ورود Claude در OpenClaw با فعال بودن Extra Usage).

    نکته: یک **مدل جایگزین** تنظیم کنید تا OpenClaw بتواند وقتی یک ارائه‌دهنده با محدودیت نرخ مواجه است، همچنان پاسخ دهد.
    [مدل‌ها](/fa/cli/models)، [OAuth](/fa/concepts/oauth)، و
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/fa/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) را ببینید.

  </Accordion>

  <Accordion title="آیا AWS Bedrock پشتیبانی می‌شود؟">
    بله. OpenClaw یک ارائه‌دهنده داخلی **Amazon Bedrock (Converse)** دارد. با وجود نشانگرهای محیطی AWS، OpenClaw می‌تواند کاتالوگ جریانی/متنی Bedrock را خودکار کشف کند و آن را به‌عنوان ارائه‌دهنده ضمنی `amazon-bedrock` ادغام کند؛ در غیر این صورت می‌توانید `plugins.entries.amazon-bedrock.config.discovery.enabled` را صراحتاً فعال کنید یا یک ورودی ارائه‌دهنده دستی اضافه کنید. [Amazon Bedrock](/fa/providers/bedrock) و [ارائه‌دهندگان مدل](/fa/providers/models) را ببینید. اگر جریان کلید مدیریت‌شده را ترجیح می‌دهید، یک پراکسی سازگار با OpenAI در جلوی Bedrock همچنان گزینه معتبری است.
  </Accordion>

  <Accordion title="احراز هویت Codex چگونه کار می‌کند؟">
    OpenClaw از **OpenAI Code (Codex)** از طریق OAuth (ورود با ChatGPT) پشتیبانی می‌کند. برای راه‌اندازی رایج از
    `openai/gpt-5.5` همراه با `agentRuntime.id: "codex"` استفاده کنید:
    احراز هویت اشتراک ChatGPT/Codex به‌همراه اجرای بومی سرور برنامه Codex. فقط زمانی از
    `openai-codex/gpt-5.5` استفاده کنید که OAuth مربوط به Codex را از طریق اجراکننده پیش‌فرض
    PI می‌خواهید. برای دسترسی مستقیم با کلید API متعلق به OpenAI از `openai/gpt-5.5` بدون override زمان‌اجرای Codex استفاده کنید.
    [ارائه‌دهندگان مدل](/fa/concepts/model-providers) و [راه‌اندازی اولیه (CLI)](/fa/start/wizard) را ببینید.
  </Accordion>

  <Accordion title="چرا OpenClaw هنوز به openai-codex اشاره می‌کند؟">
    `openai-codex` شناسه ارائه‌دهنده و پروفایل احراز هویت برای OAuth مربوط به ChatGPT/Codex است.
    همچنین پیشوند مدل صریح PI برای OAuth مربوط به Codex است:

    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = احراز هویت اشتراک ChatGPT/Codex با زمان‌اجرای بومی Codex
    - `openai-codex/gpt-5.5` = مسیر OAuth مربوط به Codex در PI
    - `openai/gpt-5.5` بدون override زمان‌اجرای Codex = مسیر مستقیم کلید API متعلق به OpenAI در PI
    - `openai-codex:...` = شناسه پروفایل احراز هویت، نه ارجاع مدل

    اگر مسیر مستقیم صورت‌حساب/محدودیت OpenAI Platform را می‌خواهید،
    `OPENAI_API_KEY` را تنظیم کنید. اگر احراز هویت اشتراک ChatGPT/Codex را می‌خواهید، با
    `openclaw models auth login --provider openai-codex` وارد شوید. برای زمان‌اجرای بومی Codex،
    ارجاع مدل را به‌صورت `openai/gpt-5.5` نگه دارید و
    `agentRuntime.id: "codex"` را تنظیم کنید. از ارجاع‌های مدل `openai-codex/*` فقط برای اجراهای PI استفاده کنید.

  </Accordion>

  <Accordion title="چرا محدودیت‌های OAuth مربوط به Codex می‌تواند با وب ChatGPT متفاوت باشد؟">
    OAuth مربوط به Codex از پنجره‌های سهمیه وابسته به پلن و مدیریت‌شده توسط OpenAI استفاده می‌کند. در عمل،
    این محدودیت‌ها می‌توانند با تجربه وب‌سایت/برنامه ChatGPT متفاوت باشند، حتی وقتی
    هر دو به یک حساب متصل هستند.

    OpenClaw می‌تواند پنجره‌های استفاده/سهمیه ارائه‌دهنده را که در حال حاضر قابل مشاهده‌اند، در
    `openclaw models status` نشان دهد، اما حق‌دسترسی‌های وب ChatGPT را ابداع یا نرمال‌سازی نمی‌کند
    تا به دسترسی مستقیم API تبدیل شوند. اگر مسیر مستقیم صورت‌حساب/محدودیت OpenAI Platform را می‌خواهید، از `openai/*` با کلید API استفاده کنید.

  </Accordion>

  <Accordion title="آیا از احراز هویت اشتراک OpenAI (OAuth مربوط به Codex) پشتیبانی می‌کنید؟">
    بله. OpenClaw به‌طور کامل از **OAuth اشتراک OpenAI Code (Codex)** پشتیبانی می‌کند.
    OpenAI صراحتاً استفاده از OAuth اشتراک را در ابزارها/گردش‌کارهای خارجی
    مانند OpenClaw مجاز می‌داند. راه‌اندازی اولیه می‌تواند جریان OAuth را برای شما اجرا کند.

    [OAuth](/fa/concepts/oauth)، [ارائه‌دهندگان مدل](/fa/concepts/model-providers)، و [راه‌اندازی اولیه (CLI)](/fa/start/wizard) را ببینید.

  </Accordion>

  <Accordion title="چگونه OAuth مربوط به Gemini CLI را راه‌اندازی کنم؟">
    Gemini CLI از یک **جریان احراز هویت Plugin** استفاده می‌کند، نه شناسه یا راز کلاینت در `openclaw.json`.

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
    معمولاً نه. OpenClaw به زمینه بزرگ + ایمنی قوی نیاز دارد؛ کارت‌های کوچک کوتاه می‌کنند و نشت می‌دهند. اگر مجبورید، **بزرگ‌ترین** ساخت مدل را که می‌توانید به‌صورت محلی اجرا کنید (LM Studio) اجرا کنید و [/gateway/local-models](/fa/gateway/local-models) را ببینید. مدل‌های کوچک‌تر/کوانتیده‌شده خطر تزریق پرامپت را افزایش می‌دهند - [امنیت](/fa/gateway/security) را ببینید.
  </Accordion>

  <Accordion title="چگونه ترافیک مدل میزبانی‌شده را در یک منطقه مشخص نگه دارم؟">
    endpointهای قفل‌شده به منطقه را انتخاب کنید. OpenRouter گزینه‌های میزبانی‌شده در آمریکا را برای MiniMax، Kimi، و GLM ارائه می‌کند؛ گونه میزبانی‌شده در آمریکا را انتخاب کنید تا داده در همان منطقه بماند. همچنان می‌توانید Anthropic/OpenAI را در کنار این‌ها فهرست کنید، با استفاده از `models.mode: "merge"` تا مدل‌های جایگزین در دسترس بمانند و در عین حال ارائه‌دهنده منطقه‌ای انتخاب‌شده شما رعایت شود.
  </Accordion>

  <Accordion title="آیا باید برای نصب این یک Mac Mini بخرم؟">
    نه. OpenClaw روی macOS یا Linux اجرا می‌شود (Windows از طریق WSL2). Mac mini اختیاری است - بعضی افراد
    یکی را به‌عنوان میزبان همیشه‌روشن می‌خرند، اما یک VPS کوچک، سرور خانگی، یا جعبه‌ای در کلاس Raspberry Pi هم کار می‌کند.

    شما فقط برای **ابزارهای فقط macOS** به Mac نیاز دارید. برای iMessage، از [BlueBubbles](/fa/channels/bluebubbles) (توصیه‌شده) استفاده کنید - سرور BlueBubbles روی هر Mac اجرا می‌شود، و Gateway می‌تواند روی Linux یا جای دیگر اجرا شود. اگر ابزارهای فقط macOS دیگری می‌خواهید، Gateway را روی Mac اجرا کنید یا یک macOS node را جفت کنید.

    مستندات: [BlueBubbles](/fa/channels/bluebubbles)، [Nodeها](/fa/nodes)، [حالت راه‌دور Mac](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="آیا برای پشتیبانی iMessage به Mac mini نیاز دارم؟">
    به **یک دستگاه macOS** نیاز دارید که وارد Messages شده باشد. لازم نیست Mac mini باشد -
    هر Mac کار می‌کند. **برای iMessage از [BlueBubbles](/fa/channels/bluebubbles)** (توصیه‌شده) استفاده کنید - سرور BlueBubbles روی macOS اجرا می‌شود، در حالی که Gateway می‌تواند روی Linux یا جای دیگر اجرا شود.

    راه‌اندازی‌های رایج:

    - Gateway را روی Linux/VPS اجرا کنید، و سرور BlueBubbles را روی هر Mac که وارد Messages شده است اجرا کنید.
    - اگر ساده‌ترین راه‌اندازی تک‌ماشینه را می‌خواهید، همه‌چیز را روی Mac اجرا کنید.

    مستندات: [BlueBubbles](/fa/channels/bluebubbles)، [Nodeها](/fa/nodes)،
    [حالت راه‌دور Mac](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="اگر برای اجرای OpenClaw یک Mac mini بخرم، می‌توانم آن را به MacBook Pro خود وصل کنم؟">
    بله. **Mac mini می‌تواند Gateway را اجرا کند**، و MacBook Pro شما می‌تواند به‌عنوان یک
    **node** (دستگاه همراه) متصل شود. Nodeها Gateway را اجرا نمی‌کنند - آن‌ها قابلیت‌های اضافی
    مثل صفحه‌نمایش/دوربین/canvas و `system.run` را روی آن دستگاه فراهم می‌کنند.

    الگوی رایج:

    - Gateway روی Mac mini (همیشه‌روشن).
    - MacBook Pro برنامه macOS یا یک میزبان node را اجرا می‌کند و با Gateway جفت می‌شود.
    - برای دیدن آن از `openclaw nodes status` / `openclaw nodes list` استفاده کنید.

    مستندات: [Nodeها](/fa/nodes)، [CLI مربوط به Nodeها](/fa/cli/nodes).

  </Accordion>

  <Accordion title="آیا می‌توانم از Bun استفاده کنم؟">
    Bun **توصیه نمی‌شود**. ما باگ‌های زمان‌اجرا، به‌ویژه با WhatsApp و Telegram، می‌بینیم.
    برای Gatewayهای پایدار از **Node** استفاده کنید.

    اگر همچنان می‌خواهید Bun را آزمایش کنید، این کار را روی Gateway غیرتولیدی
    بدون WhatsApp/Telegram انجام دهید.

  </Accordion>

  <Accordion title="Telegram: در allowFrom چه چیزی قرار می‌گیرد؟">
    `channels.telegram.allowFrom` **شناسه کاربری Telegram فرستنده انسانی** است (عددی). نام کاربری bot نیست.

    راه‌اندازی فقط شناسه‌های کاربری عددی را می‌پرسد. اگر از قبل ورودی‌های قدیمی `@username` در پیکربندی دارید، `openclaw doctor --fix` می‌تواند تلاش کند آن‌ها را resolve کند.

    امن‌تر (بدون bot شخص ثالث):

    - به bot خود DM بدهید، سپس `openclaw logs --follow` را اجرا کنید و `from.id` را بخوانید.

    Bot API رسمی:

    - به bot خود DM بدهید، سپس `https://api.telegram.org/bot<bot_token>/getUpdates` را فراخوانی کنید و `message.from.id` را بخوانید.

    شخص ثالث (خصوصی‌بودن کمتر):

    - به `@userinfobot` یا `@getidsbot` پیام مستقیم بدهید.

    [/channels/telegram](/fa/channels/telegram#access-control-and-activation) را ببینید.

  </Accordion>

  <Accordion title="آیا چند نفر می‌توانند از یک شماره WhatsApp با نمونه‌های متفاوت OpenClaw استفاده کنند؟">
    بله، از طریق **مسیریابی چندعامله**. **DM** مربوط به WhatsApp هر فرستنده را (peer با `kind: "direct"`، فرستنده E.164 مانند `+15551234567`) به یک `agentId` متفاوت bind کنید، تا هر فرد فضای کاری و مخزن نشست خودش را داشته باشد. پاسخ‌ها همچنان از **همان حساب WhatsApp** می‌آیند، و کنترل دسترسی DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) برای هر حساب WhatsApp سراسری است. [مسیریابی چندعامله](/fa/concepts/multi-agent) و [WhatsApp](/fa/channels/whatsapp) را ببینید.
  </Accordion>

  <Accordion title='آیا می‌توانم یک عامل «گفت‌وگوی سریع» و یک عامل «Opus برای کدنویسی» اجرا کنم؟'>
    بله. از مسیریابی چندعامله استفاده کنید: به هر عامل مدل پیش‌فرض خودش را بدهید، سپس مسیرهای ورودی (حساب ارائه‌دهنده یا peerهای مشخص) را به هر عامل bind کنید. پیکربندی نمونه در [مسیریابی چندعامله](/fa/concepts/multi-agent) قرار دارد. همچنین [مدل‌ها](/fa/concepts/models) و [پیکربندی](/fa/gateway/configuration) را ببینید.
  </Accordion>

  <Accordion title="آیا Homebrew روی Linux کار می‌کند؟">
    بله. Homebrew از Linux پشتیبانی می‌کند (Linuxbrew). راه‌اندازی سریع:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    اگر OpenClaw را از طریق systemd اجرا می‌کنید، مطمئن شوید PATH سرویس شامل `/home/linuxbrew/.linuxbrew/bin` (یا پیشوند brew شما) باشد تا ابزارهای نصب‌شده با `brew` در shellهای غیرورودی resolve شوند.
    buildهای اخیر همچنین دایرکتوری‌های bin رایج کاربر را در سرویس‌های Linux systemd به ابتدا اضافه می‌کنند (برای مثال `~/.local/bin`، `~/.npm-global/bin`، `~/.local/share/pnpm`، `~/.bun/bin`) و وقتی `PNPM_HOME`، `NPM_CONFIG_PREFIX`، `BUN_INSTALL`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `NVM_DIR`، و `FNM_DIR` تنظیم شده باشند، آن‌ها را رعایت می‌کنند.

  </Accordion>

  <Accordion title="تفاوت بین نصب git قابل هک و نصب npm">
    - **نصب قابل هک (git):** checkout کامل سورس، قابل ویرایش، بهترین گزینه برای مشارکت‌کنندگان.
      buildها را محلی اجرا می‌کنید و می‌توانید کد/مستندات را patch کنید.
    - **نصب npm:** نصب CLI سراسری، بدون repo، بهترین گزینه برای «فقط اجراش کن».
      به‌روزرسانی‌ها از dist-tagهای npm می‌آیند.

    مستندات: [شروع به کار](/fa/start/getting-started)، [به‌روزرسانی](/fa/install/updating).

  </Accordion>

  <Accordion title="آیا بعداً می‌توانم بین نصب‌های npm و git جابه‌جا شوم؟">
    بله. وقتی OpenClaw از قبل نصب شده است، از `openclaw update --channel ...` استفاده کنید.
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

    برای پیش‌نمایش تغییر حالت برنامه‌ریزی‌شده، ابتدا `--dry-run` را اضافه کنید. به‌روزرسان
    پیگیری‌های Doctor را اجرا می‌کند، منابع Plugin را برای کانال هدف تازه‌سازی می‌کند، و
    Gateway را restart می‌کند مگر اینکه `--no-restart` را پاس کنید.

    نصب‌کننده هم می‌تواند هر دو حالت را اجبار کند:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    نکات پشتیبان‌گیری: [راهبرد پشتیبان‌گیری](/fa/help/faq#where-things-live-on-disk) را ببینید.

  </Accordion>

  <Accordion title="آیا باید Gateway را روی لپ‌تاپم اجرا کنم یا روی VPS؟">
    پاسخ کوتاه: **اگر قابلیت اطمینان ۲۴/۷ می‌خواهید، از VPS استفاده کنید**. اگر
    کمترین اصطکاک را می‌خواهید و با خواب/راه‌اندازی‌های مجدد مشکلی ندارید، آن را محلی اجرا کنید.

    **لپ‌تاپ (Gateway محلی)**

    - **مزایا:** بدون هزینهٔ سرور، دسترسی مستقیم به فایل‌های محلی، پنجرهٔ مرورگر زنده.
    - **معایب:** خواب رفتن/قطع شبکه = قطع اتصال، به‌روزرسانی‌ها/راه‌اندازی‌های مجدد سیستم‌عامل باعث وقفه می‌شوند، باید بیدار بماند.

    **VPS / ابر**

    - **مزایا:** همیشه روشن، شبکهٔ پایدار، بدون مشکل خواب رفتن لپ‌تاپ، نگه‌داشتن آن در حال اجرا آسان‌تر است.
    - **معایب:** اغلب بدون نمایشگر اجرا می‌شود (از اسکرین‌شات‌ها استفاده کنید)، فقط دسترسی از راه دور به فایل‌ها، برای به‌روزرسانی‌ها باید از SSH استفاده کنید.

    **نکتهٔ ویژهٔ OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord همگی از روی VPS به‌خوبی کار می‌کنند. تنها مصالحهٔ واقعی **مرورگر بدون رابط گرافیکی** در برابر پنجرهٔ قابل مشاهده است. [مرورگر](/fa/tools/browser) را ببینید.

    **پیش‌فرض پیشنهادی:** اگر قبلاً با قطع اتصال Gateway روبه‌رو بوده‌اید، VPS. اجرای محلی وقتی عالی است که فعالانه از Mac استفاده می‌کنید و دسترسی به فایل‌های محلی یا خودکارسازی UI با مرورگر قابل مشاهده می‌خواهید.

  </Accordion>

  <Accordion title="اجرای OpenClaw روی یک ماشین اختصاصی چقدر مهم است؟">
    الزامی نیست، اما **برای قابلیت اطمینان و جداسازی توصیه می‌شود**.

    - **میزبان اختصاصی (VPS/Mac mini/Pi):** همیشه روشن، وقفه‌های کمتر ناشی از خواب رفتن/راه‌اندازی مجدد، مجوزهای تمیزتر، نگه‌داشتن آن در حال اجرا آسان‌تر است.
    - **لپ‌تاپ/دسکتاپ مشترک:** برای آزمایش و استفادهٔ فعال کاملاً مناسب است، اما هنگام خواب رفتن یا به‌روزرسانی ماشین انتظار مکث داشته باشید.

    اگر بهترین حالت هر دو را می‌خواهید، Gateway را روی یک میزبان اختصاصی نگه دارید و لپ‌تاپ خود را به‌عنوان یک **Node** برای ابزارهای صفحه‌نمایش/دوربین/اجرای محلی جفت کنید. [Nodeها](/fa/nodes) را ببینید.
    برای راهنمایی امنیتی، [امنیت](/fa/gateway/security) را بخوانید.

  </Accordion>

  <Accordion title="حداقل نیازمندی‌های VPS و سیستم‌عامل پیشنهادی چیست؟">
    OpenClaw سبک است. برای یک Gateway پایه + یک کانال چت:

    - **حداقل مطلق:** 1 vCPU، 1GB RAM، حدود 500MB دیسک.
    - **پیشنهادی:** 1-2 vCPU، 2GB RAM یا بیشتر برای فضای اضافه (لاگ‌ها، رسانه، چندین کانال). ابزارهای Node و خودکارسازی مرورگر می‌توانند منابع زیادی مصرف کنند.

    سیستم‌عامل: از **Ubuntu LTS** (یا هر Debian/Ubuntu مدرن) استفاده کنید. مسیر نصب Linux در آنجا بهتر آزمایش شده است.

    مستندات: [Linux](/fa/platforms/linux)، [میزبانی VPS](/fa/vps).

  </Accordion>

  <Accordion title="آیا می‌توانم OpenClaw را در یک VM اجرا کنم و نیازمندی‌ها چیست؟">
    بله. با یک VM همانند VPS رفتار کنید: باید همیشه روشن، قابل دسترسی، و دارای
    RAM کافی برای Gateway و هر کانالی باشد که فعال می‌کنید.

    راهنمای پایه:

    - **حداقل مطلق:** 1 vCPU، 1GB RAM.
    - **پیشنهادی:** اگر چندین کانال، خودکارسازی مرورگر، یا ابزارهای رسانه اجرا می‌کنید، 2GB RAM یا بیشتر.
    - **سیستم‌عامل:** Ubuntu LTS یا یک Debian/Ubuntu مدرن دیگر.

    اگر روی Windows هستید، **WSL2 آسان‌ترین راه‌اندازی به سبک VM** است و بهترین سازگاری
    ابزارها را دارد. [Windows](/fa/platforms/windows)، [میزبانی VPS](/fa/vps) را ببینید.
    اگر macOS را در یک VM اجرا می‌کنید، [VM macOS](/fa/install/macos-vm) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [پرسش‌های متداول](/fa/help/faq) — پرسش‌های متداول اصلی (مدل‌ها، نشست‌ها، Gateway، امنیت، و موارد بیشتر)
- [نمای کلی نصب](/fa/install)
- [شروع به کار](/fa/start/getting-started)
- [عیب‌یابی](/fa/help/troubleshooting)
