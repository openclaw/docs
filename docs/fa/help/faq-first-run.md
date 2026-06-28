---
read_when:
    - نصب جدید، گیر کردن در راه‌اندازی اولیه، یا خطاهای اجرای نخست
    - انتخاب اشتراک‌های احراز هویت و ارائه‌دهنده
    - نمی‌توان به docs.openclaw.ai دسترسی پیدا کرد، نمی‌توان داشبورد را باز کرد، نصب گیر کرده است
sidebarTitle: First-run FAQ
summary: 'پرسش‌های متداول: راه‌اندازی سریع و اجرای نخست — نصب، آماده‌سازی اولیه، احراز هویت، اشتراک‌ها، خطاهای اولیه'
title: 'FAQ: راه‌اندازی اجرای نخست'
x-i18n:
    generated_at: "2026-06-28T20:43:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ef4122bc0c3068806591ccdc1bf7f3eb5a81cc7efd2066d07f948fe953284be
    source_path: help/faq-first-run.md
    workflow: 16
---

  پرسش‌وپاسخ شروع سریع و اجرای نخست. برای عملیات روزمره، مدل‌ها، احراز هویت، نشست‌ها،
  و عیب‌یابی، [FAQ](/fa/help/faq) اصلی را ببینید.

  ## شروع سریع و راه‌اندازی اجرای نخست

  <AccordionGroup>
  <Accordion title="گیر کرده‌ام، سریع‌ترین راه برای خارج شدن از این وضعیت">
    از یک عامل هوش مصنوعی محلی استفاده کنید که بتواند **دستگاه شما را ببیند**. این کار بسیار مؤثرتر از پرسیدن
    در Discord است، چون بیشتر موارد «گیر کرده‌ام» **مشکلات پیکربندی یا محیط محلی** هستند که
    کمک‌کنندگان راه‌دور نمی‌توانند بررسی کنند.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    این ابزارها می‌توانند مخزن را بخوانند، فرمان‌ها را اجرا کنند، لاگ‌ها را بررسی کنند، و به رفع راه‌اندازی
    سطح دستگاه شما کمک کنند (PATH، سرویس‌ها، مجوزها، فایل‌های احراز هویت). از طریق
    نصب قابل‌هک (git)، **checkout کامل منبع** را به آن‌ها بدهید:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    این کار OpenClaw را **از یک git checkout** نصب می‌کند، بنابراین عامل می‌تواند کد + مستندات را بخواند و
    درباره نسخه دقیقی که اجرا می‌کنید استدلال کند. بعداً همیشه می‌توانید با اجرای دوباره نصب‌کننده بدون
    `--install-method git` به نسخه پایدار برگردید.

    نکته: از عامل بخواهید رفع مشکل را **برنامه‌ریزی و نظارت** کند (گام‌به‌گام)، سپس فقط
    فرمان‌های ضروری را اجرا کند. این کار تغییرات را کوچک و حسابرسی آن‌ها را آسان‌تر نگه می‌دارد.

    اگر یک باگ یا اصلاح واقعی پیدا کردید، لطفاً یک issue در GitHub ثبت کنید یا یک PR بفرستید:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    با این فرمان‌ها شروع کنید (هنگام درخواست کمک، خروجی‌ها را هم به اشتراک بگذارید):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    کارکرد آن‌ها:

    - `openclaw status`: نمای فوری از سلامت gateway/agent + پیکربندی پایه.
    - `openclaw models status`: احراز هویت provider + دسترس‌پذیری مدل را بررسی می‌کند.
    - `openclaw doctor`: مشکلات رایج پیکربندی/وضعیت را اعتبارسنجی و تعمیر می‌کند.

    بررسی‌های مفید دیگر CLI: `openclaw status --all`، `openclaw logs --follow`،
    `openclaw gateway status`، `openclaw health --verbose`.

    حلقه عیب‌یابی سریع: [۶۰ ثانیه اول اگر چیزی خراب است](/fa/help/faq#first-60-seconds-if-something-is-broken).
    مستندات نصب: [نصب](/fa/install)، [پرچم‌های نصب‌کننده](/fa/install/installer)، [به‌روزرسانی](/fa/install/updating).

  </Accordion>

  <Accordion title="Heartbeat مدام رد می‌شود. دلیل‌های رد شدن یعنی چه؟">
    دلیل‌های رایج رد شدن Heartbeat:

    - `quiet-hours`: خارج از بازه active-hours پیکربندی‌شده
    - `empty-heartbeat-file`: `HEARTBEAT.md` وجود دارد اما فقط شامل داربست خالی، نظر، سربرگ، fence، یا چک‌لیست خالی است
    - `no-tasks-due`: حالت وظیفه `HEARTBEAT.md` فعال است اما هنوز موعد هیچ‌یک از بازه‌های وظیفه نرسیده است
    - `alerts-disabled`: همه قابلیت‌های نمایش Heartbeat غیرفعال است (`showOk`، `showAlerts`، و `useIndicator` همگی خاموش هستند)

    در حالت وظیفه، زمان‌های سررسید فقط پس از کامل شدن یک اجرای واقعی Heartbeat
    جلو برده می‌شوند. اجراهای ردشده، وظیفه‌ها را کامل‌شده علامت نمی‌زنند.

    مستندات: [Heartbeat](/fa/gateway/heartbeat)، [اتوماسیون](/fa/automation).

  </Accordion>

  <Accordion title="روش پیشنهادی برای نصب و راه‌اندازی OpenClaw">
    مخزن توصیه می‌کند از منبع اجرا کنید و از onboarding استفاده کنید:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    wizard همچنین می‌تواند دارایی‌های UI را به‌صورت خودکار بسازد. پس از onboarding، معمولاً Gateway را روی پورت **18789** اجرا می‌کنید.

    از منبع (مشارکت‌کنندگان/توسعه‌دهندگان):

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

  <Accordion title="پس از onboarding چطور dashboard را باز کنم؟">
    wizard بلافاصله پس از onboarding مرورگر شما را با یک URL تمیز dashboard (بدون توکن) باز می‌کند و لینک را در خلاصه هم چاپ می‌کند. آن تب را باز نگه دارید؛ اگر اجرا نشد، URL چاپ‌شده را روی همان دستگاه کپی/پیست کنید.
  </Accordion>

  <Accordion title="چطور dashboard را روی localhost در برابر راه‌دور احراز هویت کنم؟">
    **Localhost (همان دستگاه):**

    - `http://127.0.0.1:18789/` را باز کنید.
    - اگر shared-secret auth خواست، توکن یا گذرواژه پیکربندی‌شده را در تنظیمات Control UI جای‌گذاری کنید.
    - منبع توکن: `gateway.auth.token` (یا `OPENCLAW_GATEWAY_TOKEN`).
    - منبع گذرواژه: `gateway.auth.password` (یا `OPENCLAW_GATEWAY_PASSWORD`).
    - اگر هنوز هیچ shared secret پیکربندی نشده است، با `openclaw doctor --generate-gateway-token` یک توکن بسازید.

    **نه روی localhost:**

    - **Tailscale Serve** (پیشنهادی): bind را روی loopback نگه دارید، `openclaw gateway --tailscale serve` را اجرا کنید، `https://<magicdns>/` را باز کنید. اگر `gateway.auth.allowTailscale` برابر `true` باشد، سرآیندهای هویت، احراز هویت Control UI/WebSocket را برآورده می‌کنند (بدون shared secret جای‌گذاری‌شده، با فرض میزبان gateway مورداعتماد)؛ HTTP APIها همچنان به shared-secret auth نیاز دارند مگر اینکه عمداً از private-ingress `none` یا trusted-proxy HTTP auth استفاده کنید.
      تلاش‌های احراز هویت Serve ناموفق هم‌زمان از یک کلاینت، پیش از ثبت شدن توسط محدودکننده failed-auth به‌ترتیب انجام می‌شوند، بنابراین تلاش بد دوم می‌تواند از قبل `retry later` نشان دهد.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` را اجرا کنید (یا password auth را پیکربندی کنید)، `http://<tailscale-ip>:18789/` را باز کنید، سپس shared secret مطابق را در تنظیمات dashboard جای‌گذاری کنید.
    - **reverse proxy آگاه از هویت**: Gateway را پشت یک proxy مورداعتماد نگه دارید، `gateway.auth.mode: "trusted-proxy"` را پیکربندی کنید، سپس URL proxy را باز کنید. proxyهای loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند.
    - **تونل SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` سپس `http://127.0.0.1:18789/` را باز کنید. shared-secret auth همچنان روی تونل اعمال می‌شود؛ اگر درخواست شد، توکن یا گذرواژه پیکربندی‌شده را جای‌گذاری کنید.

    برای حالت‌های bind و جزئیات احراز هویت، [Dashboard](/fa/web/dashboard) و [سطوح وب](/fa/web) را ببینید.

  </Accordion>

  <Accordion title="چرا برای تأییدهای exec دو پیکربندی approval وجود دارد؟">
    آن‌ها لایه‌های متفاوتی را کنترل می‌کنند:

    - `approvals.exec`: درخواست‌های approval را به مقصدهای چت ارسال می‌کند
    - `channels.<channel>.execApprovals`: آن کانال را به‌عنوان یک کلاینت approval بومی برای تأییدهای exec عمل می‌دهد

    سیاست exec میزبان همچنان gate واقعی approval است. پیکربندی چت فقط کنترل می‌کند درخواست‌های approval
    کجا ظاهر شوند و افراد چطور بتوانند به آن‌ها پاسخ دهند.

    در بیشتر راه‌اندازی‌ها به **هر دو** نیاز ندارید:

    - اگر چت از قبل از فرمان‌ها و پاسخ‌ها پشتیبانی کند، `/approve` همان چت از مسیر مشترک کار می‌کند.
    - اگر یک کانال بومی پشتیبانی‌شده بتواند approverها را با ایمنی استنباط کند، OpenClaw اکنون approvalهای بومی DM-first را وقتی `channels.<channel>.execApprovals.enabled` تنظیم نشده یا `"auto"` است به‌طور خودکار فعال می‌کند.
    - وقتی کارت‌ها/دکمه‌های approval بومی در دسترس باشند، آن UI بومی مسیر اصلی است؛ عامل فقط زمانی باید یک فرمان دستی `/approve` وارد کند که نتیجه ابزار بگوید approvalهای چت در دسترس نیستند یا approval دستی تنها مسیر است.
    - فقط وقتی از `approvals.exec` استفاده کنید که درخواست‌ها باید به چت‌های دیگر یا اتاق‌های عملیات صریح هم ارسال شوند.
    - فقط وقتی از `channels.<channel>.execApprovals.target: "channel"` یا `"both"` استفاده کنید که صریحاً می‌خواهید درخواست‌های approval به اتاق/موضوع مبدأ بازفرستاده شوند.
    - approvalهای Plugin دوباره جدا هستند: به‌طور پیش‌فرض از `/approve` همان چت استفاده می‌کنند، forwarding اختیاری `approvals.plugin` دارند، و فقط بعضی کانال‌های بومی، مدیریت plugin-approval-native را در کنار آن نگه می‌دارند.

    نسخه کوتاه: forwarding برای مسیریابی است، پیکربندی کلاینت بومی برای UX غنی‌تر مخصوص کانال است.
    [Exec Approvals](/fa/tools/exec-approvals) را ببینید.

  </Accordion>

  <Accordion title="به چه runtimeای نیاز دارم؟">
    Node **>= 22** لازم است. `pnpm` توصیه می‌شود. Bun برای Gateway **توصیه نمی‌شود**.
  </Accordion>

  <Accordion title="آیا روی Raspberry Pi اجرا می‌شود؟">
    بله. Gateway سبک است - مستندات **512MB-1GB RAM**، **1 core**، و حدود **500MB**
    دیسک را برای استفاده شخصی کافی می‌دانند، و اشاره می‌کنند که **Raspberry Pi 4 می‌تواند آن را اجرا کند**.

    اگر فضای تنفس بیشتری می‌خواهید (لاگ‌ها، رسانه، سرویس‌های دیگر)، **2GB توصیه می‌شود**، اما
    حداقل سختگیرانه نیست.

    نکته: یک Raspberry Pi/VPS کوچک می‌تواند میزبان Gateway باشد، و می‌توانید **nodeها** را روی لپ‌تاپ/گوشی خود برای
    اجرای محلی صفحه/دوربین/canvas یا فرمان جفت کنید. [Nodeها](/fa/nodes) را ببینید.

  </Accordion>

  <Accordion title="نکته‌ای برای نصب روی Raspberry Pi هست؟">
    نسخه کوتاه: کار می‌کند، اما انتظار لبه‌های ناصاف داشته باشید.

    - از سیستم‌عامل **64-bit** استفاده کنید و Node >= 22 را نگه دارید.
    - **نصب قابل‌هک (git)** را ترجیح دهید تا بتوانید لاگ‌ها را ببینید و سریع به‌روزرسانی کنید.
    - بدون کانال‌ها/skills شروع کنید، سپس آن‌ها را یکی‌یکی اضافه کنید.
    - اگر با مشکلات عجیب binary روبه‌رو شدید، معمولاً مشکل **سازگاری ARM** است.

    مستندات: [Linux](/fa/platforms/linux)، [نصب](/fa/install).

  </Accordion>

  <Accordion title="روی wake up my friend گیر کرده است / onboarding باز نمی‌شود. حالا چه کنم؟">
    آن صفحه به قابل‌دسترسی و احرازهویت‌شده بودن Gateway وابسته است. TUI همچنین
    هنگام اولین hatch، به‌طور خودکار "Wake up, my friend!" را می‌فرستد. اگر آن خط را با **بدون پاسخ**
    می‌بینید و توکن‌ها روی 0 می‌مانند، عامل هرگز اجرا نشده است.

    1. Gateway را بازراه‌اندازی کنید:

    ```bash
    openclaw gateway restart
    ```

    2. status + auth را بررسی کنید:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. اگر همچنان گیر کرد، اجرا کنید:

    ```bash
    openclaw doctor
    ```

    اگر Gateway راه‌دور است، مطمئن شوید اتصال tunnel/Tailscale برقرار است و UI
    به Gateway درست اشاره می‌کند. [دسترسی راه‌دور](/fa/gateway/remote) را ببینید.

  </Accordion>

  <Accordion title="آیا می‌توانم راه‌اندازی خود را بدون انجام دوباره onboarding به یک دستگاه جدید (Mac mini) منتقل کنم؟">
    بله. **دایرکتوری وضعیت** و **workspace** را کپی کنید، سپس Doctor را یک بار اجرا کنید. این کار
    bot شما را «دقیقاً همان‌طور» نگه می‌دارد (حافظه، تاریخچه نشست، احراز هویت، و وضعیت کانال)
    به شرطی که **هر دو** مکان را کپی کنید:

    1. OpenClaw را روی دستگاه جدید نصب کنید.
    2. `$OPENCLAW_STATE_DIR` (پیش‌فرض: `~/.openclaw`) را از دستگاه قدیمی کپی کنید.
    3. workspace خود را کپی کنید (پیش‌فرض: `~/.openclaw/workspace`).
    4. `openclaw doctor` را اجرا کنید و سرویس Gateway را بازراه‌اندازی کنید.

    این کار پیکربندی، پروفایل‌های auth، credsهای WhatsApp، نشست‌ها، و حافظه را حفظ می‌کند. اگر در
    حالت راه‌دور هستید، به یاد داشته باشید میزبان gateway مالک session store و workspace است.

    **مهم:** اگر فقط workspace خود را در GitHub commit/push کنید، از
    **حافظه + فایل‌های bootstrap** پشتیبان می‌گیرید، اما از تاریخچه نشست یا auth **نه**. آن‌ها
    زیر `~/.openclaw/` قرار دارند (برای مثال `~/.openclaw/agents/<agentId>/sessions/`).

    مرتبط: [مهاجرت](/fa/install/migrating)، [چیزها کجای دیسک قرار دارند](/fa/help/faq#where-things-live-on-disk)،
    [workspace عامل](/fa/concepts/agent-workspace)، [Doctor](/fa/gateway/doctor)،
    [حالت راه‌دور](/fa/gateway/remote).

  </Accordion>

  <Accordion title="کجا ببینم در آخرین نسخه چه چیز تازه‌ای هست؟">
    changelog در GitHub را بررسی کنید:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    تازه‌ترین ورودی‌ها در بالا هستند. اگر بخش بالایی با **Unreleased** علامت‌گذاری شده باشد، بخش تاریخ‌دار بعدی
    آخرین نسخه منتشرشده است. ورودی‌ها بر اساس **نکات برجسته**، **تغییرات**، و
    **اصلاحات** گروه‌بندی می‌شوند (به‌علاوه بخش‌های مستندات/دیگر در صورت نیاز).

  </Accordion>

  <Accordion title="نمی‌توانم به docs.openclaw.ai دسترسی داشته باشم (خطای SSL)">
    بعضی اتصال‌های Comcast/Xfinity به‌اشتباه `docs.openclaw.ai` را از طریق Xfinity
    Advanced Security مسدود می‌کنند. آن را غیرفعال کنید یا `docs.openclaw.ai` را allowlist کنید، سپس دوباره تلاش کنید.
    لطفاً با گزارش دادن اینجا به ما کمک کنید آن را از انسداد خارج کنیم: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    اگر هنوز نمی‌توانید به سایت دسترسی پیدا کنید، مستندات در GitHub آینه شده‌اند:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="تفاوت بین پایدار و بتا">
    **پایدار** و **بتا**، **dist-tagهای npm** هستند، نه خط‌های کد جداگانه:

    - `latest` = پایدار
    - `beta` = ساخت اولیه برای آزمایش

    معمولاً یک انتشار پایدار ابتدا روی **بتا** قرار می‌گیرد، سپس یک مرحلهٔ
    ارتقای صریح همان نسخه را به `latest` منتقل می‌کند. نگه‌دارندگان همچنین می‌توانند
    در صورت نیاز مستقیم روی `latest` منتشر کنند. به همین دلیل بتا و پایدار می‌توانند
    پس از ارتقا به **همان نسخه** اشاره کنند.

    ببینید چه چیزی تغییر کرده است:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    برای دستورهای نصب یک‌خطی و تفاوت بین بتا و توسعه، آکاردئون زیر را ببینید.

  </Accordion>

  <Accordion title="چگونه نسخهٔ بتا را نصب کنم و تفاوت بین بتا و توسعه چیست؟">
    **بتا** همان dist-tag در npm با نام `beta` است (ممکن است پس از ارتقا با `latest` یکی باشد).
    **توسعه** سرِ متحرک `main` در git است؛ وقتی منتشر شود، از dist-tag در npm با نام `dev` استفاده می‌کند.

    دستورهای یک‌خطی (macOS/Linux):

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

  <Accordion title="چگونه جدیدترین بیت‌ها را امتحان کنم؟">
    دو گزینه:

    1. **کانال توسعه (checkout در git):**

    ```bash
    openclaw update --channel dev
    ```

    این کار به شاخهٔ `main` جابه‌جا می‌شود و از منبع به‌روزرسانی می‌کند.

    2. **نصب قابل‌دستکاری (از سایت نصب‌کننده):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    این به شما یک مخزن محلی می‌دهد که می‌توانید آن را ویرایش کنید، سپس از طریق git به‌روزرسانی کنید.

    اگر یک clone تمیز دستی را ترجیح می‌دهید، استفاده کنید:

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
    - **راه‌اندازی اولیهٔ QuickStart:** معمولاً چند دقیقه
    - **راه‌اندازی اولیهٔ کامل:** زمانی طولانی‌تر می‌شود که ورود به provider، جفت‌سازی کانال، نصب daemon،
      دانلودهای شبکه، Skills، یا plugins اختیاری به تنظیمات اضافه نیاز داشته باشند

    جادوگر CLI این جدول زمانی را از ابتدا نشان می‌دهد. می‌توانید مراحل اختیاری را رد کنید و
    بعداً با `openclaw configure` برگردید.

    اگر گیر کرد، از [گیر کردن نصب‌کننده](#quick-start-and-first-run-setup)
    و چرخهٔ سریع اشکال‌زدایی در [گیر کرده‌ام](#quick-start-and-first-run-setup) استفاده کنید.

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

    **۱) خطای npm با spawn git / پیدا نشدن git**

    - **Git for Windows** را نصب کنید و مطمئن شوید `git` در PATH شما قرار دارد.
    - PowerShell را ببندید و دوباره باز کنید، سپس نصب‌کننده را دوباره اجرا کنید.

    **۲) پس از نصب، openclaw شناخته نمی‌شود**

    - پوشهٔ bin سراسری npm شما در PATH نیست.
    - مسیر را بررسی کنید:

      ```powershell
      npm config get prefix
      ```

    - آن دایرکتوری را به PATH کاربر خود اضافه کنید (در Windows پسوند `\bin` لازم نیست؛ در بیشتر سیستم‌ها `%AppData%\npm` است).
    - پس از به‌روزرسانی PATH، PowerShell را ببندید و دوباره باز کنید.

    برای راه‌اندازی دسکتاپ، از برنامهٔ بومی **Windows Hub** استفاده کنید. برای راه‌اندازی
    فقط-ترمینال، هم نصب‌کنندهٔ PowerShell و هم مسیرهای WSL2 Gateway پشتیبانی می‌شوند.
    مستندات: [Windows](/fa/platforms/windows).

  </Accordion>

  <Accordion title="خروجی exec در Windows متن چینی درهم‌ریخته نشان می‌دهد - چه کار کنم؟">
    این معمولاً ناهماهنگی code page کنسول در shellهای بومی Windows است.

    نشانه‌ها:

    - خروجی `system.run`/`exec` چینی را به‌صورت mojibake نمایش می‌دهد
    - همان فرمان در پروفایل ترمینال دیگر درست دیده می‌شود

    راه‌حل سریع در PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    سپس Gateway را بازراه‌اندازی کنید و فرمان خود را دوباره امتحان کنید:

    ```powershell
    openclaw gateway restart
    ```

    اگر همچنان این مشکل را روی آخرین OpenClaw بازتولید می‌کنید، آن را اینجا پیگیری/گزارش کنید:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="مستندات به پرسش من پاسخ نداد - چگونه پاسخ بهتری بگیرم؟">
    از **نصب قابل‌دستکاری (git)** استفاده کنید تا کل منبع و مستندات را به‌صورت محلی داشته باشید، سپس از
    ربات خود (یا Claude/Codex) _از همان پوشه_ بپرسید تا بتواند مخزن را بخواند و دقیق پاسخ دهد.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    جزئیات بیشتر: [نصب](/fa/install) و [پرچم‌های نصب‌کننده](/fa/install/installer).

  </Accordion>

  <Accordion title="چگونه OpenClaw را روی Linux نصب کنم؟">
    پاسخ کوتاه: راهنمای Linux را دنبال کنید، سپس راه‌اندازی اولیه را اجرا کنید.

    - مسیر سریع Linux + نصب سرویس: [Linux](/fa/platforms/linux).
    - راهنمای کامل گام‌به‌گام: [شروع به کار](/fa/start/getting-started).
    - نصب‌کننده + به‌روزرسانی‌ها: [نصب و به‌روزرسانی‌ها](/fa/install/updating).

  </Accordion>

  <Accordion title="چگونه OpenClaw را روی یک VPS نصب کنم؟">
    هر VPS مبتنی بر Linux کار می‌کند. روی سرور نصب کنید، سپس از SSH/Tailscale برای دسترسی به Gateway استفاده کنید.

    راهنماها: [exe.dev](/fa/install/exe-dev)، [Hetzner](/fa/install/hetzner)، [Fly.io](/fa/install/fly).
    دسترسی از راه دور: [Gateway از راه دور](/fa/gateway/remote).

  </Accordion>

  <Accordion title="راهنماهای نصب cloud/VPS کجا هستند؟">
    ما یک **مرکز میزبانی** با providerهای رایج نگه می‌داریم. یکی را انتخاب کنید و راهنما را دنبال کنید:

    - [میزبانی VPS](/fa/vps) (همهٔ providerها در یک جا)
    - [Fly.io](/fa/install/fly)
    - [Hetzner](/fa/install/hetzner)
    - [exe.dev](/fa/install/exe-dev)

    نحوهٔ کار در cloud: **Gateway روی سرور اجرا می‌شود** و شما از
    لپ‌تاپ/تلفن خود از طریق Control UI (یا Tailscale/SSH) به آن دسترسی دارید. state + workspace شما
    روی سرور قرار دارند، بنابراین host را منبع حقیقت بدانید و از آن پشتیبان بگیرید.

    می‌توانید **nodeها** (Mac/iOS/Android/headless) را به آن Gateway ابری جفت کنید تا به
    صفحه/دوربین/canvas محلی دسترسی داشته باشید یا فرمان‌ها را روی لپ‌تاپ خود اجرا کنید، در حالی که
    Gateway در cloud باقی می‌ماند.

    مرکز: [پلتفرم‌ها](/fa/platforms). دسترسی از راه دور: [Gateway از راه دور](/fa/gateway/remote).
    nodeها: [Nodeها](/fa/nodes)، [CLI Nodeها](/fa/cli/nodes).

  </Accordion>

  <Accordion title="آیا می‌توانم از OpenClaw بخواهم خودش را به‌روزرسانی کند؟">
    پاسخ کوتاه: **ممکن است، توصیه نمی‌شود**. جریان به‌روزرسانی می‌تواند
    Gateway را بازراه‌اندازی کند (که session فعال را قطع می‌کند)، ممکن است به یک checkout تمیز git نیاز داشته باشد، و
    می‌تواند درخواست تأیید کند. امن‌تر: به‌روزرسانی‌ها را به‌عنوان operator از یک shell اجرا کنید.

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

  <Accordion title="راه‌اندازی اولیه دقیقاً چه کاری انجام می‌دهد؟">
    `openclaw onboard` مسیر توصیه‌شده برای راه‌اندازی است. در **حالت محلی** شما را از این مراحل عبور می‌دهد:

    - **راه‌اندازی مدل/auth** (OAuth مربوط به provider، کلیدهای API، setup-token برای Anthropic، به‌علاوه گزینه‌های مدل محلی مانند LM Studio)
    - محل **workspace** + فایل‌های bootstrap
    - **تنظیمات Gateway** (bind/port/auth/tailscale)
    - **کانال‌ها** (WhatsApp، Telegram، Discord، Mattermost، Signal، iMessage، به‌علاوه plugins کانال همراه مانند QQ Bot)
    - **نصب daemon** (LaunchAgent در macOS؛ واحد کاربر systemd در Linux/WSL2)
    - انتخاب **بررسی‌های سلامت** و **Skills**

    همچنین پیش از شروع promptهای اصلی، انتظارات مدت‌زمان را تنظیم می‌کند و اگر
    مدل پیکربندی‌شدهٔ شما ناشناخته باشد یا auth نداشته باشد هشدار می‌دهد.

  </Accordion>

  <Accordion title="آیا برای اجرای این به اشتراک Claude یا OpenAI نیاز دارم؟">
    نه. می‌توانید OpenClaw را با **کلیدهای API** (Anthropic/OpenAI/دیگران) یا با
    **مدل‌های فقط-محلی** اجرا کنید تا داده‌های شما روی دستگاه خودتان بماند. اشتراک‌ها (Claude
    Pro/Max یا OpenAI Codex) راه‌های اختیاری برای احراز هویت آن providerها هستند.

    برای Anthropic در OpenClaw، تقسیم عملی این است:

    - **کلید API Anthropic**: صورتحساب عادی API Anthropic
    - **Claude CLI / احراز هویت اشتراک Claude در OpenClaw**: کارکنان Anthropic
      به ما گفتند این استفاده دوباره مجاز است، و OpenClaw استفاده از `claude -p`
      را برای این یکپارچه‌سازی مجاز تلقی می‌کند مگر اینکه Anthropic سیاست جدیدی منتشر کند

    برای hostهای gateway طولانی‌مدت، کلیدهای API Anthropic همچنان راه‌اندازی
    قابل‌پیش‌بینی‌تری هستند. OAuth مربوط به OpenAI Codex به‌طور صریح برای ابزارهای
    خارجی مانند OpenClaw پشتیبانی می‌شود.

    OpenClaw همچنین از گزینه‌های میزبانی‌شدهٔ دیگر با سبک اشتراک از جمله
    **Qwen Cloud Coding Plan**، **MiniMax Coding Plan**، و
    **Z.AI / GLM Coding Plan** پشتیبانی می‌کند.

    مستندات: [Anthropic](/fa/providers/anthropic)، [OpenAI](/fa/providers/openai)،
    [Qwen Cloud](/fa/providers/qwen)،
    [MiniMax](/fa/providers/minimax)، [Z.AI (GLM)](/fa/providers/zai)،
    [مدل‌های محلی](/fa/gateway/local-models)، [مدل‌ها](/fa/concepts/models).

  </Accordion>

  <Accordion title="آیا می‌توانم بدون کلید API از اشتراک Claude Max استفاده کنم؟">
    بله.

    کارکنان Anthropic به ما گفتند استفاده از Claude CLI به سبک OpenClaw دوباره مجاز است، بنابراین
    OpenClaw احراز هویت اشتراک Claude و استفاده از `claude -p` را برای این یکپارچه‌سازی
    مجاز تلقی می‌کند مگر اینکه Anthropic سیاست جدیدی منتشر کند. اگر
    قابل‌پیش‌بینی‌ترین راه‌اندازی سمت سرور را می‌خواهید، به‌جای آن از کلید API Anthropic استفاده کنید.

  </Accordion>

  <Accordion title="آیا از احراز هویت اشتراک Claude (Claude Pro یا Max) پشتیبانی می‌کنید؟">
    بله.

    کارکنان Anthropic به ما گفتند این استفاده دوباره مجاز است، بنابراین OpenClaw
    استفادهٔ دوباره از Claude CLI و استفاده از `claude -p` را برای این یکپارچه‌سازی
    مجاز تلقی می‌کند مگر اینکه Anthropic سیاست جدیدی منتشر کند.

    setup-token مربوط به Anthropic همچنان به‌عنوان یک مسیر token پشتیبانی‌شده در OpenClaw در دسترس است، اما OpenClaw اکنون استفادهٔ دوباره از Claude CLI و `claude -p` را در صورت وجود ترجیح می‌دهد.
    برای بارهای کاری production یا چندکاربره، احراز هویت با کلید API Anthropic همچنان
    انتخاب امن‌تر و قابل‌پیش‌بینی‌تری است. اگر گزینه‌های میزبانی‌شدهٔ دیگر با سبک اشتراک
    در OpenClaw می‌خواهید، [OpenAI](/fa/providers/openai)، [Qwen / Model
    Cloud](/fa/providers/qwen)، [MiniMax](/fa/providers/minimax)، و [GLM
    Models](/fa/providers/zai) را ببینید.

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

  <AccordionGroup>
  <Accordion title="چرا خطای HTTP 429 rate_limit_error را از Anthropic می‌بینم؟">
    یعنی **سهمیه/محدودیت نرخ Anthropic** شما برای پنجرهٔ فعلی تمام شده است. اگر از
    **Claude CLI** استفاده می‌کنید، منتظر بازنشانی پنجره بمانید یا طرح خود را ارتقا دهید. اگر از
    **کلید API Anthropic** استفاده می‌کنید، Anthropic Console را
    برای مصرف/صورت‌حساب بررسی کنید و در صورت نیاز محدودیت‌ها را افزایش دهید.

    اگر پیام مشخصاً این باشد:
    `Extra usage is required for long context requests`، درخواست در حال تلاش برای استفاده از
    پنجرهٔ زمینهٔ 1M Anthropic است (یک مدل Claude 4.x با قابلیت GA برای 1M یا پیکربندی قدیمی
    `context1m: true`). این فقط وقتی کار می‌کند که اعتبارنامهٔ شما واجد شرایط
    صورت‌حساب زمینهٔ بلند باشد (صورت‌حساب کلید API یا مسیر ورود Claude در OpenClaw
    با فعال بودن Extra Usage).

    نکته: یک **مدل جایگزین** تنظیم کنید تا OpenClaw بتواند هنگامی که یک ارائه‌دهنده با محدودیت نرخ مواجه است، همچنان پاسخ دهد.
    [مدل‌ها](/fa/cli/models)، [OAuth](/fa/concepts/oauth)، و
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/fa/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) را ببینید.

  </Accordion>

  <Accordion title="آیا AWS Bedrock پشتیبانی می‌شود؟">
    بله. OpenClaw یک ارائه‌دهندهٔ همراه **Amazon Bedrock (Converse)** دارد. با وجود نشانگرهای env مربوط به AWS، OpenClaw می‌تواند کاتالوگ Bedrock برای جریان/متن را به‌صورت خودکار کشف کند و آن را به‌عنوان ارائه‌دهندهٔ ضمنی `amazon-bedrock` ادغام کند؛ در غیر این صورت می‌توانید `plugins.entries.amazon-bedrock.config.discovery.enabled` را صریحاً فعال کنید یا یک ورودی ارائه‌دهندهٔ دستی اضافه کنید. [Amazon Bedrock](/fa/providers/bedrock) و [ارائه‌دهندگان مدل](/fa/providers/models) را ببینید. اگر جریان کلید مدیریت‌شده را ترجیح می‌دهید، یک پراکسی سازگار با OpenAI در برابر Bedrock همچنان گزینه‌ای معتبر است.
  </Accordion>

  <Accordion title="احراز هویت Codex چگونه کار می‌کند؟">
    OpenClaw از **OpenAI Code (Codex)** از طریق OAuth (ورود با ChatGPT) پشتیبانی می‌کند. برای
    راه‌اندازی رایج از `openai/gpt-5.5` استفاده کنید: احراز هویت اشتراک ChatGPT/Codex به‌همراه
    اجرای بومی سرور برنامهٔ Codex. ارجاع‌های قدیمی GPT مربوط به Codex پیکربندی قدیمی هستند که با
    `openclaw doctor --fix` ترمیم می‌شوند. دسترسی مستقیم با کلید API OpenAI
    برای سطح‌های API غیرعاملی OpenAI و برای مدل‌های عامل
    از طریق یک نمایهٔ کلید API مرتب‌شدهٔ `openai` همچنان در دسترس است.
    [ارائه‌دهندگان مدل](/fa/concepts/model-providers) و [راه‌اندازی اولیه (CLI)](/fa/start/wizard) را ببینید.
  </Accordion>

  <Accordion title="چرا OpenClaw هنوز پیشوند قدیمی OpenAI Codex را ذکر می‌کند؟">
    `openai` شناسهٔ ارائه‌دهنده و نمایهٔ احراز هویت برای هم کلیدهای API OpenAI و هم
    OAuth ChatGPT/Codex است. ممکن است هنوز پیشوند قدیمی OpenAI Codex را در پیکربندی قدیمی و
    هشدارهای مهاجرت ببینید.
    پیکربندی‌های قدیمی‌تر از آن به‌عنوان پیشوند مدل نیز استفاده می‌کردند:

    - `openai/gpt-5.5` = احراز هویت اشتراک ChatGPT/Codex با runtime بومی Codex برای نوبت‌های عامل
    - ارجاع قدیمی Codex GPT-5.5 = مسیر مدل قدیمی که با `openclaw doctor --fix` ترمیم می‌شود
    - `openai/gpt-5.5` به‌همراه یک نمایهٔ کلید API مرتب‌شدهٔ `openai` = احراز هویت کلید API برای یک مدل عامل OpenAI
    - شناسه‌های نمایهٔ احراز هویت قدیمی Codex = شناسهٔ نمایهٔ احراز هویت قدیمی که با `openclaw doctor --fix` مهاجرت داده می‌شود

    اگر مسیر مستقیم صورت‌حساب/محدودیت OpenAI Platform را می‌خواهید،
    `OPENAI_API_KEY` را تنظیم کنید. اگر احراز هویت اشتراک ChatGPT/Codex را می‌خواهید، با
    `openclaw models auth login --provider openai` وارد شوید. ارجاع مدل را به‌صورت
    `openai/gpt-5.5` نگه دارید؛ ارجاع‌های مدل قدیمی Codex پیکربندی قدیمی هستند که
    `openclaw doctor --fix` بازنویسی می‌کند.

  </Accordion>

  <Accordion title="چرا محدودیت‌های OAuth Codex می‌تواند با وب ChatGPT متفاوت باشد؟">
    OAuth Codex از پنجره‌های سهمیهٔ مدیریت‌شده توسط OpenAI و وابسته به طرح استفاده می‌کند. در عمل،
    این محدودیت‌ها می‌توانند با تجربهٔ وب‌سایت/برنامهٔ ChatGPT متفاوت باشند، حتی وقتی
    هر دو به یک حساب متصل هستند.

    OpenClaw می‌تواند پنجره‌های مصرف/سهمیهٔ ارائه‌دهنده را که در حال حاضر قابل مشاهده‌اند در
    `openclaw models status` نشان دهد، اما امتیازهای وب ChatGPT را اختراع یا نرمال‌سازی
    و به دسترسی مستقیم API تبدیل نمی‌کند. اگر مسیر مستقیم صورت‌حساب/محدودیت OpenAI Platform را می‌خواهید،
    از `openai/*` با یک کلید API استفاده کنید.

  </Accordion>

  <Accordion title="آیا از احراز هویت اشتراک OpenAI (OAuth Codex) پشتیبانی می‌کنید؟">
    بله. OpenClaw کاملاً از **OAuth اشتراک OpenAI Code (Codex)** پشتیبانی می‌کند.
    OpenAI صریحاً استفاده از OAuth اشتراک را در ابزارها/گردش‌کارهای خارجی
    مانند OpenClaw مجاز می‌داند. راه‌اندازی اولیه می‌تواند جریان OAuth را برای شما اجرا کند.

    [OAuth](/fa/concepts/oauth)، [ارائه‌دهندگان مدل](/fa/concepts/model-providers)، و [راه‌اندازی اولیه (CLI)](/fa/start/wizard) را ببینید.

  </Accordion>

  <Accordion title="چگونه OAuth مربوط به Gemini CLI را راه‌اندازی کنم؟">
    Gemini CLI از یک **جریان احراز هویت Plugin** استفاده می‌کند، نه شناسهٔ کلاینت یا secret در `openclaw.json`.

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
    معمولاً نه. OpenClaw به زمینهٔ بزرگ + ایمنی قوی نیاز دارد؛ کارت‌های کوچک کوتاه می‌کنند و نشت می‌دهند. اگر مجبورید، **بزرگ‌ترین** ساخت مدل را که می‌توانید به‌صورت محلی اجرا کنید (LM Studio) اجرا کنید و [/gateway/local-models](/fa/gateway/local-models) را ببینید. مدل‌های کوچک‌تر/کوانتیزه‌شده خطر تزریق پرامپت را افزایش می‌دهند - [امنیت](/fa/gateway/security) را ببینید.
  </Accordion>

  <Accordion title="چگونه ترافیک مدل‌های میزبانی‌شده را در یک منطقهٔ مشخص نگه دارم؟">
    endpointهای محدود به منطقه را انتخاب کنید. OpenRouter گزینه‌های میزبانی‌شده در ایالات متحده را برای MiniMax، Kimi و GLM ارائه می‌کند؛ نوع میزبانی‌شده در ایالات متحده را انتخاب کنید تا داده در همان منطقه بماند. همچنان می‌توانید Anthropic/OpenAI را در کنار این‌ها فهرست کنید، با استفاده از `models.mode: "merge"` تا جایگزین‌ها در دسترس بمانند و در عین حال ارائه‌دهندهٔ منطقه‌ای انتخاب‌شده رعایت شود.
  </Accordion>

  <Accordion title="آیا برای نصب این باید Mac Mini بخرم؟">
    نه. OpenClaw روی macOS یا Linux اجرا می‌شود (Windows از طریق WSL2). Mac mini اختیاری است - برخی افراد
    یکی می‌خرند تا به‌عنوان میزبان همیشه روشن باشد، اما یک VPS کوچک، سرور خانگی، یا دستگاهی در کلاس Raspberry Pi هم کار می‌کند.

    فقط برای **ابزارهای فقط macOS** به Mac نیاز دارید. برای iMessage، از [iMessage](/fa/channels/imessage) با `imsg` روی هر Mac واردشده به Messages استفاده کنید. اگر Gateway روی Linux یا جای دیگری اجرا می‌شود، `channels.imessage.cliPath` را به یک wrapper مبتنی بر SSH تنظیم کنید که `imsg` را روی آن Mac اجرا می‌کند. اگر ابزارهای فقط macOS دیگری می‌خواهید، Gateway را روی یک Mac اجرا کنید یا یک گره macOS را جفت کنید.

    مستندات: [iMessage](/fa/channels/imessage)، [گره‌ها](/fa/nodes)، [حالت راه دور Mac](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="آیا برای پشتیبانی iMessage به Mac mini نیاز دارم؟">
    به **یک دستگاه macOS** نیاز دارید که وارد Messages شده باشد. لازم نیست Mac mini باشد -
    هر Mac کار می‌کند. **از [iMessage](/fa/channels/imessage)** با `imsg` استفاده کنید؛ Gateway می‌تواند روی همان Mac اجرا شود، یا می‌تواند جای دیگری با یک wrapper مبتنی بر SSH در `cliPath` اجرا شود.

    راه‌اندازی‌های رایج:

    - Gateway را روی Linux/VPS اجرا کنید، و `channels.imessage.cliPath` را به یک wrapper مبتنی بر SSH تنظیم کنید که `imsg` را روی یک Mac واردشده به Messages اجرا می‌کند.
    - اگر ساده‌ترین راه‌اندازی تک‌ماشینه را می‌خواهید، همه چیز را روی Mac اجرا کنید.

    مستندات: [iMessage](/fa/channels/imessage)، [گره‌ها](/fa/nodes)،
    [حالت راه دور Mac](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="اگر برای اجرای OpenClaw یک Mac mini بخرم، آیا می‌توانم آن را به MacBook Pro خود وصل کنم؟">
    بله. **Mac mini می‌تواند Gateway را اجرا کند**، و MacBook Pro شما می‌تواند به‌عنوان یک
    **گره** (دستگاه همراه) متصل شود. گره‌ها Gateway را اجرا نمی‌کنند - آن‌ها قابلیت‌های اضافه‌ای
    مانند صفحه‌نمایش/دوربین/بوم و `system.run` را روی همان دستگاه فراهم می‌کنند.

    الگوی رایج:

    - Gateway روی Mac mini (همیشه روشن).
    - MacBook Pro برنامهٔ macOS یا یک میزبان گره را اجرا می‌کند و با Gateway جفت می‌شود.
    - برای دیدن آن از `openclaw nodes status` / `openclaw nodes list` استفاده کنید.

    مستندات: [گره‌ها](/fa/nodes)، [CLI گره‌ها](/fa/cli/nodes).

  </Accordion>

  <Accordion title="آیا می‌توانم از Bun استفاده کنم؟">
    Bun **توصیه نمی‌شود**. ما خطاهای runtime می‌بینیم، به‌ویژه با WhatsApp و Telegram.
    برای Gatewayهای پایدار از **Node** استفاده کنید.

    اگر همچنان می‌خواهید Bun را آزمایش کنید، این کار را روی یک Gateway غیرتولیدی
    بدون WhatsApp/Telegram انجام دهید.

  </Accordion>

  <Accordion title="Telegram: در allowFrom چه چیزی قرار می‌گیرد؟">
    `channels.telegram.allowFrom` **شناسهٔ کاربری Telegram فرستندهٔ انسانی** است (عددی). نام کاربری bot نیست.

    راه‌اندازی فقط شناسه‌های کاربری عددی را درخواست می‌کند. اگر از قبل ورودی‌های قدیمی `@username` در پیکربندی دارید، `openclaw doctor --fix` می‌تواند تلاش کند آن‌ها را resolve کند.

    ایمن‌تر (بدون bot شخص ثالث):

    - به bot خود DM بدهید، سپس `openclaw logs --follow` را اجرا کنید و `from.id` را بخوانید.

    Bot API رسمی:

    - به bot خود DM بدهید، سپس `https://api.telegram.org/bot<bot_token>/getUpdates` را فراخوانی کنید و `message.from.id` را بخوانید.

    شخص ثالث (کم‌خصوصی‌تر):

    - به `@userinfobot` یا `@getidsbot` DM بدهید.

    [/channels/telegram](/fa/channels/telegram#access-control-and-activation) را ببینید.

  </Accordion>

  <Accordion title="آیا چند نفر می‌توانند از یک شمارهٔ WhatsApp با نمونه‌های مختلف OpenClaw استفاده کنند؟">
    بله، از طریق **مسیریابی چندعاملی**. **DM** هر فرستنده در WhatsApp (همتای `kind: "direct"`، فرستندهٔ E.164 مانند `+15551234567`) را به یک `agentId` متفاوت متصل کنید، تا هر شخص workspace و ذخیره‌گاه نشست خودش را داشته باشد. پاسخ‌ها همچنان از **همان حساب WhatsApp** می‌آیند، و کنترل دسترسی DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) برای هر حساب WhatsApp سراسری است. [مسیریابی چندعاملی](/fa/concepts/multi-agent) و [WhatsApp](/fa/channels/whatsapp) را ببینید.
  </Accordion>

  <Accordion title='آیا می‌توانم یک عامل «گفت‌وگوی سریع» و یک عامل «Opus برای کدنویسی» اجرا کنم؟'>
    بله. از مسیریابی چندعاملی استفاده کنید: برای هر عامل مدل پیش‌فرض خودش را تعیین کنید، سپس مسیرهای ورودی (حساب ارائه‌دهنده یا همتاهای مشخص) را به هر عامل متصل کنید. نمونهٔ پیکربندی در [مسیریابی چندعاملی](/fa/concepts/multi-agent) قرار دارد. همچنین [مدل‌ها](/fa/concepts/models) و [پیکربندی](/fa/gateway/configuration) را ببینید.
  </Accordion>

  <Accordion title="آیا Homebrew روی Linux کار می‌کند؟">
    بله. Homebrew از Linux (Linuxbrew) پشتیبانی می‌کند. راه‌اندازی سریع:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    اگر OpenClaw را از طریق systemd اجرا می‌کنید، مطمئن شوید PATH سرویس شامل `/home/linuxbrew/.linuxbrew/bin` (یا پیشوند brew شما) باشد تا ابزارهای نصب‌شده با `brew` در shellهای غیرورودی resolve شوند.
    ساخت‌های اخیر همچنین دایرکتوری‌های bin رایج کاربر را در سرویس‌های systemd روی Linux در ابتدای مسیر قرار می‌دهند (برای مثال `~/.local/bin`، `~/.npm-global/bin`، `~/.local/share/pnpm`، `~/.bun/bin`) و در صورت تنظیم بودن، `PNPM_HOME`، `NPM_CONFIG_PREFIX`، `BUN_INSTALL`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `NVM_DIR`، و `FNM_DIR` را رعایت می‌کنند.

  </Accordion>

  <Accordion title="تفاوت بین نصب git قابل هک و نصب npm">
    - **نصب قابل هک (git):** checkout کامل منبع، قابل ویرایش، بهترین گزینه برای مشارکت‌کنندگان.
      شما buildها را محلی اجرا می‌کنید و می‌توانید کد/مستندات را patch کنید.
    - **نصب npm:** نصب سراسری CLI، بدون repo، بهترین گزینه برای «فقط اجرا کن».
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

    برای پیش‌نمایش تغییر حالت برنامه‌ریزی‌شده ابتدا `--dry-run` را اضافه کنید. به‌روزرسان اجرا می‌شود
    پیگیری‌های Doctor، منابع Plugin را برای کانال هدف تازه‌سازی می‌کند و
    Gateway را بازراه‌اندازی می‌کند مگر اینکه `--no-restart` را پاس دهید.

    نصب‌کننده می‌تواند هرکدام از حالت‌ها را نیز اجباری کند:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    نکات پشتیبان‌گیری: [راهبرد پشتیبان‌گیری](/fa/help/faq#where-things-live-on-disk) را ببینید.

  </Accordion>

  <Accordion title="آیا باید Gateway را روی لپ‌تاپم اجرا کنم یا روی VPS؟">
    پاسخ کوتاه: **اگر قابلیت اطمینان ۲۴/۷ می‌خواهید، از VPS استفاده کنید**. اگر می‌خواهید
    کمترین اصطکاک را داشته باشید و با خواب/بازراه‌اندازی مشکلی ندارید، آن را به‌صورت محلی اجرا کنید.

    **لپ‌تاپ (Gateway محلی)**

    - **مزایا:** بدون هزینه سرور، دسترسی مستقیم به فایل‌های محلی، پنجره زنده مرورگر.
    - **معایب:** خواب/قطعی شبکه = قطع اتصال، به‌روزرسانی‌های سیستم‌عامل/راه‌اندازی‌های مجدد وقفه ایجاد می‌کنند، باید بیدار بماند.

    **VPS / ابر**

    - **مزایا:** همیشه روشن، شبکه پایدار، بدون مشکلات خواب لپ‌تاپ، نگه‌داشتن آن در حالت اجرا آسان‌تر است.
    - **معایب:** اغلب بدون رابط گرافیکی اجرا می‌شود (از اسکرین‌شات‌ها استفاده کنید)، فقط دسترسی فایل از راه دور، برای به‌روزرسانی‌ها باید SSH کنید.

    **یادداشت مخصوص OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord همگی از VPS به‌خوبی کار می‌کنند. تنها بده‌بستان واقعی **مرورگر بدون رابط گرافیکی** در برابر یک پنجره قابل مشاهده است. [مرورگر](/fa/tools/browser) را ببینید.

    **پیش‌فرض پیشنهادی:** اگر قبلاً قطع اتصال Gateway داشتید، VPS. حالت محلی وقتی عالی است که فعالانه از Mac استفاده می‌کنید و دسترسی به فایل محلی یا خودکارسازی UI با مرورگر قابل مشاهده می‌خواهید.

  </Accordion>

  <Accordion title="اجرای OpenClaw روی یک ماشین اختصاصی چقدر مهم است؟">
    الزامی نیست، اما **برای قابلیت اطمینان و ایزوله‌سازی توصیه می‌شود**.

    - **میزبان اختصاصی (VPS/Mac mini/Raspberry Pi):** همیشه روشن، وقفه‌های خواب/راه‌اندازی مجدد کمتر، مجوزهای تمیزتر، نگه‌داشتن آن در حالت اجرا آسان‌تر.
    - **لپ‌تاپ/رایانه رومیزی مشترک:** برای آزمایش و استفاده فعال کاملاً مناسب است، اما هنگام خوابیدن یا به‌روزرسانی ماشین انتظار مکث داشته باشید.

    اگر بهترین حالت هر دو را می‌خواهید، Gateway را روی یک میزبان اختصاصی نگه دارید و لپ‌تاپتان را به‌عنوان یک **گره** برای ابزارهای صفحه‌نمایش/دوربین/اجرا محلی جفت کنید. [گره‌ها](/fa/nodes) را ببینید.
    برای راهنمایی امنیتی، [امنیت](/fa/gateway/security) را بخوانید.

  </Accordion>

  <Accordion title="حداقل نیازمندی‌های VPS و سیستم‌عامل پیشنهادی چیست؟">
    OpenClaw سبک است. برای یک Gateway پایه + یک کانال چت:

    - **حداقل مطلق:** ۱ vCPU، ۱GB RAM، حدود ۵۰۰MB دیسک.
    - **پیشنهادی:** ۱-۲ vCPU، ۲GB RAM یا بیشتر برای فضای تنفس (لاگ‌ها، رسانه، کانال‌های متعدد). ابزارهای Node و خودکارسازی مرورگر می‌توانند منابع زیادی مصرف کنند.

    سیستم‌عامل: از **Ubuntu LTS** (یا هر Debian/Ubuntu مدرن) استفاده کنید. مسیر نصب Linux در آنجا بیشترین آزمایش را داشته است.

    مستندات: [Linux](/fa/platforms/linux)، [میزبانی VPS](/fa/vps).

  </Accordion>

  <Accordion title="آیا می‌توانم OpenClaw را در یک VM اجرا کنم و نیازمندی‌ها چیست؟">
    بله. با VM همانند VPS رفتار کنید: باید همیشه روشن، قابل دسترس، و دارای
    RAM کافی برای Gateway و هر کانالی باشد که فعال می‌کنید.

    راهنمای پایه:

    - **حداقل مطلق:** ۱ vCPU، ۱GB RAM.
    - **پیشنهادی:** اگر چند کانال، خودکارسازی مرورگر، یا ابزارهای رسانه را اجرا می‌کنید، ۲GB RAM یا بیشتر.
    - **سیستم‌عامل:** Ubuntu LTS یا Debian/Ubuntu مدرن دیگر.

    اگر روی Windows هستید، برای راه‌اندازی دسکتاپ از **Windows Hub** استفاده کنید، یا وقتی
    مشخصاً یک VM از نوع Gateway به سبک Linux با سازگاری گسترده ابزارها می‌خواهید
    از WSL2 استفاده کنید. [Windows](/fa/platforms/windows)، [میزبانی VPS](/fa/vps) را ببینید.
    اگر macOS را در VM اجرا می‌کنید، [macOS VM](/fa/install/macos-vm) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [پرسش‌های متداول](/fa/help/faq) — پرسش‌های متداول اصلی (مدل‌ها، نشست‌ها، gateway، امنیت، موارد بیشتر)
- [نمای کلی نصب](/fa/install)
- [شروع به کار](/fa/start/getting-started)
- [عیب‌یابی](/fa/help/troubleshooting)
