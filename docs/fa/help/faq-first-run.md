---
read_when:
    - نصب جدید، گیر کردن راه‌اندازی اولیه، یا خطاهای اجرای نخست
    - انتخاب احراز هویت و اشتراک‌های ارائه‌دهنده
    - نمی‌توان به docs.openclaw.ai دسترسی پیدا کرد، نمی‌توان داشبورد را باز کرد، نصب گیر کرده است
sidebarTitle: First-run FAQ
summary: 'پرسش‌های متداول: شروع سریع و راه‌اندازی اولین اجرا — نصب، آنبوردینگ، احراز هویت، اشتراک‌ها، خطاهای اولیه'
title: 'پرسش‌های متداول: راه‌اندازی نخستین اجرا'
x-i18n:
    generated_at: "2026-05-10T19:46:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: f19f755d41dc09c17e20845487037d1edc338d0edff5fc0190973f3d72a7f0ab
    source_path: help/faq-first-run.md
    workflow: 16
---

  راهنمای شروع سریع و پرسش‌وپاسخ اجرای نخست. برای عملیات روزمره، مدل‌ها، احراز هویت، نشست‌ها،
  و عیب‌یابی، [پرسش‌های متداول](/fa/help/faq) اصلی را ببینید.

  ## شروع سریع و راه‌اندازی اجرای نخست

  <AccordionGroup>
  <Accordion title="گیر کرده‌ام؛ سریع‌ترین راه برای خارج شدن از این وضعیت">
    از یک عامل هوش مصنوعی محلی استفاده کنید که بتواند **ماشین شما را ببیند**. این کار بسیار مؤثرتر از پرسیدن
    در Discord است، چون بیشتر موارد «گیر کرده‌ام» مربوط به **مشکلات پیکربندی یا محیط محلی** هستند که
    کمک‌کنندگان راه دور نمی‌توانند بررسی کنند.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    این ابزارها می‌توانند مخزن را بخوانند، فرمان‌ها را اجرا کنند، گزارش‌ها را بررسی کنند، و به رفع راه‌اندازی
    سطح ماشین شما کمک کنند (PATH، سرویس‌ها، مجوزها، فایل‌های احراز هویت). از طریق نصب قابل هک (git)
    **دریافت کامل کد منبع** را در اختیارشان بگذارید:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    این کار OpenClaw را **از یک دریافت git** نصب می‌کند، بنابراین عامل می‌تواند کد + مستندات را بخواند و
    درباره نسخه دقیقی که اجرا می‌کنید استدلال کند. همیشه می‌توانید بعداً با اجرای دوباره نصب‌کننده بدون
    `--install-method git` به نسخه پایدار برگردید.

    نکته: از عامل بخواهید رفع مشکل را **برنامه‌ریزی و نظارت** کند (گام‌به‌گام)، سپس فقط فرمان‌های
    لازم را اجرا کنید. این کار تغییرات را کوچک و بررسی آن‌ها را آسان‌تر نگه می‌دارد.

    اگر یک اشکال یا رفع واقعی پیدا کردید، لطفاً یک مسئله GitHub ثبت کنید یا یک PR بفرستید:
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
    - `openclaw models status`: احراز هویت ارائه‌دهنده + دردسترس‌بودن مدل را بررسی می‌کند.
    - `openclaw doctor`: مشکلات رایج پیکربندی/وضعیت را اعتبارسنجی و تعمیر می‌کند.

    بررسی‌های مفید دیگر CLI: `openclaw status --all`، `openclaw logs --follow`،
    `openclaw gateway status`، `openclaw health --verbose`.

    چرخه عیب‌یابی سریع: [۶۰ ثانیه اول اگر چیزی خراب است](/fa/help/faq#first-60-seconds-if-something-is-broken).
    مستندات نصب: [نصب](/fa/install)، [پرچم‌های نصب‌کننده](/fa/install/installer)، [به‌روزرسانی](/fa/install/updating).

  </Accordion>

  <Accordion title="Heartbeat مدام رد می‌شود. دلیل‌های رد شدن چه معنایی دارند؟">
    دلیل‌های رایج رد شدن heartbeat:

    - `quiet-hours`: بیرون از بازه active-hours پیکربندی‌شده
    - `empty-heartbeat-file`: `HEARTBEAT.md` وجود دارد اما فقط داربست خالی/فقط-سرآیند دارد
    - `no-tasks-due`: حالت وظیفه `HEARTBEAT.md` فعال است اما هنوز موعد هیچ‌یک از بازه‌های وظیفه نرسیده است
    - `alerts-disabled`: همه قابلیت‌های نمایش heartbeat غیرفعال‌اند (`showOk`، `showAlerts`، و `useIndicator` همگی خاموش‌اند)

    در حالت وظیفه، زمان‌مهرهای موعد فقط پس از کامل شدن یک اجرای heartbeat واقعی
    جلو برده می‌شوند. اجراهای ردشده وظیفه‌ها را کامل‌شده علامت نمی‌زنند.

    مستندات: [Heartbeat](/fa/gateway/heartbeat)، [اتوماسیون و وظیفه‌ها](/fa/automation).

  </Accordion>

  <Accordion title="روش پیشنهادی برای نصب و راه‌اندازی OpenClaw">
    مخزن اجرای از منبع و استفاده از onboarding را توصیه می‌کند:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    جادوگر همچنین می‌تواند دارایی‌های UI را به‌صورت خودکار بسازد. پس از onboarding، معمولاً Gateway را روی پورت **18789** اجرا می‌کنید.

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

  <Accordion title="پس از onboarding چگونه dashboard را باز کنم؟">
    جادوگر درست بعد از onboarding مرورگر شما را با یک URL تمیز (بدون توکن) برای dashboard باز می‌کند و پیوند را نیز در خلاصه چاپ می‌کند. آن زبانه را باز نگه دارید؛ اگر اجرا نشد، URL چاپ‌شده را روی همان ماشین کپی/پیست کنید.
  </Accordion>

  <Accordion title="چگونه dashboard را روی localhost در برابر راه دور احراز هویت کنم؟">
    **Localhost (همان ماشین):**

    - `http://127.0.0.1:18789/` را باز کنید.
    - اگر احراز هویت shared-secret خواست، توکن یا گذرواژه پیکربندی‌شده را در تنظیمات Control UI وارد کنید.
    - منبع توکن: `gateway.auth.token` (یا `OPENCLAW_GATEWAY_TOKEN`).
    - منبع گذرواژه: `gateway.auth.password` (یا `OPENCLAW_GATEWAY_PASSWORD`).
    - اگر هنوز هیچ shared secret پیکربندی نشده است، با `openclaw doctor --generate-gateway-token` یک توکن بسازید.

    **نه روی localhost:**

    - **Tailscale Serve** (توصیه‌شده): bind را روی loopback نگه دارید، `openclaw gateway --tailscale serve` را اجرا کنید، `https://<magicdns>/` را باز کنید. اگر `gateway.auth.allowTailscale` برابر `true` باشد، سرآیندهای هویت احراز هویت Control UI/WebSocket را برآورده می‌کنند (بدون shared secret پیست‌شده، با فرض میزبان gateway مورد اعتماد)؛ HTTP APIها همچنان به احراز هویت shared-secret نیاز دارند، مگر اینکه عمداً از private-ingress `none` یا احراز هویت HTTP با trusted-proxy استفاده کنید.
      تلاش‌های بد همزمان برای احراز هویت Serve از یک کلاینت، پیش از ثبت شدن توسط محدودکننده failed-auth، سری‌سازی می‌شوند، بنابراین تلاش دوباره بد دوم می‌تواند همین حالا `retry later` نشان دهد.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` را اجرا کنید (یا احراز هویت گذرواژه را پیکربندی کنید)، `http://<tailscale-ip>:18789/` را باز کنید، سپس shared secret مطابق را در تنظیمات dashboard وارد کنید.
    - **پراکسی معکوس آگاه از هویت**: Gateway را پشت یک پراکسی مورد اعتماد نگه دارید، `gateway.auth.mode: "trusted-proxy"` را پیکربندی کنید، سپس URL پراکسی را باز کنید. پراکسی‌های loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند.
    - **تونل SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` سپس `http://127.0.0.1:18789/` را باز کنید. احراز هویت shared-secret همچنان روی تونل اعمال می‌شود؛ اگر درخواست شد، توکن یا گذرواژه پیکربندی‌شده را وارد کنید.

    برای جزئیات حالت‌های bind و احراز هویت، [Dashboard](/fa/web/dashboard) و [سطح‌های وب](/fa/web) را ببینید.

  </Accordion>

  <Accordion title="چرا برای تأییدهای گفت‌وگو دو پیکربندی exec approval وجود دارد؟">
    آن‌ها لایه‌های متفاوتی را کنترل می‌کنند:

    - `approvals.exec`: درخواست‌های تأیید را به مقصدهای گفت‌وگو هدایت می‌کند
    - `channels.<channel>.execApprovals`: باعث می‌شود آن کانال برای exec approvals مانند یک کلاینت تأیید بومی عمل کند

    سیاست exec میزبان همچنان دروازه واقعی تأیید است. پیکربندی گفت‌وگو فقط کنترل می‌کند درخواست‌های تأیید
    کجا ظاهر شوند و افراد چگونه بتوانند به آن‌ها پاسخ دهند.

    در بیشتر راه‌اندازی‌ها به **هر دو** نیاز ندارید:

    - اگر گفت‌وگو از قبل از فرمان‌ها و پاسخ‌ها پشتیبانی می‌کند، `/approve` در همان گفت‌وگو از مسیر مشترک کار می‌کند.
    - اگر یک کانال بومی پشتیبانی‌شده بتواند تأییدکنندگان را با اطمینان استنتاج کند، OpenClaw اکنون وقتی `channels.<channel>.execApprovals.enabled` تنظیم نشده یا `"auto"` است، تأییدهای بومی DM-first را به‌طور خودکار فعال می‌کند.
    - وقتی کارت‌ها/دکمه‌های تأیید بومی در دسترس هستند، آن UI بومی مسیر اصلی است؛ عامل فقط زمانی باید یک فرمان دستی `/approve` اضافه کند که نتیجه ابزار بگوید تأییدهای گفت‌وگو در دسترس نیستند یا تأیید دستی تنها مسیر است.
    - از `approvals.exec` فقط وقتی استفاده کنید که درخواست‌ها باید به گفت‌وگوهای دیگر یا اتاق‌های عملیات صریح نیز هدایت شوند.
    - از `channels.<channel>.execApprovals.target: "channel"` یا `"both"` فقط وقتی استفاده کنید که صراحتاً می‌خواهید درخواست‌های تأیید در اتاق/موضوع مبدأ هم ارسال شوند.
    - تأییدهای Plugin دوباره جدا هستند: آن‌ها به‌طور پیش‌فرض از `/approve` در همان گفت‌وگو، ارسال اختیاری `approvals.plugin`، و فقط در برخی کانال‌های بومی از مدیریت plugin-approval-native در لایه بالاتر استفاده می‌کنند.

    نسخه کوتاه: forwarding برای مسیریابی است، پیکربندی کلاینت بومی برای UX غنی‌تر و مختص کانال.
    [Exec Approvals](/fa/tools/exec-approvals) را ببینید.

  </Accordion>

  <Accordion title="به چه runtime نیاز دارم؟">
    Node **>= 22** لازم است. `pnpm` توصیه می‌شود. Bun برای Gateway **توصیه نمی‌شود**.
  </Accordion>

  <Accordion title="آیا روی Raspberry Pi اجرا می‌شود؟">
    بله. Gateway سبک است - مستندات **512MB-1GB RAM**، **1 core**، و حدود **500MB**
    دیسک را برای استفاده شخصی کافی می‌دانند و اشاره می‌کنند که **Raspberry Pi 4 می‌تواند آن را اجرا کند**.

    اگر فضای بیشتری می‌خواهید (گزارش‌ها، رسانه، سرویس‌های دیگر)، **2GB توصیه می‌شود**، اما
    حداقل سخت‌گیرانه نیست.

    نکته: یک Pi/VPS کوچک می‌تواند میزبان Gateway باشد، و می‌توانید **nodeها** را روی لپ‌تاپ/گوشی خود برای
    اجرای محلی صفحه/دوربین/canvas یا فرمان جفت کنید. [Nodes](/fa/nodes) را ببینید.

  </Accordion>

  <Accordion title="نکته‌ای برای نصب روی Raspberry Pi دارید؟">
    نسخه کوتاه: کار می‌کند، اما انتظار لبه‌های ناصاف داشته باشید.

    - از سیستم‌عامل **64-bit** استفاده کنید و Node >= 22 را نگه دارید.
    - نصب **قابل هک (git)** را ترجیح دهید تا بتوانید گزارش‌ها را ببینید و سریع به‌روزرسانی کنید.
    - بدون کانال‌ها/Skills شروع کنید، سپس آن‌ها را یکی‌یکی اضافه کنید.
    - اگر با مشکلات عجیب باینری روبه‌رو شدید، معمولاً مشکل **سازگاری ARM** است.

    مستندات: [Linux](/fa/platforms/linux)، [نصب](/fa/install).

  </Accordion>

  <Accordion title="روی wake up my friend گیر کرده است / onboarding باز نمی‌شود. حالا چه کنم؟">
    آن صفحه به در دسترس و احراز هویت‌شده بودن Gateway وابسته است. TUI همچنین در نخستین hatch،
    "Wake up, my friend!" را به‌صورت خودکار می‌فرستد. اگر آن خط را با **بدون پاسخ**
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

    3. اگر همچنان معلق ماند، اجرا کنید:

    ```bash
    openclaw doctor
    ```

    اگر Gateway راه دور است، مطمئن شوید تونل/اتصال Tailscale برقرار است و UI
    به Gateway درست اشاره می‌کند. [دسترسی راه دور](/fa/gateway/remote) را ببینید.

  </Accordion>

  <Accordion title="آیا می‌توانم راه‌اندازی‌ام را بدون انجام دوباره onboarding به یک ماشین جدید (Mac mini) منتقل کنم؟">
    بله. **دایرکتوری وضعیت** و **فضای کاری** را کپی کنید، سپس یک بار Doctor را اجرا کنید. این کار
    bot شما را «دقیقاً همان‌طور» نگه می‌دارد (حافظه، تاریخچه نشست، احراز هویت، و وضعیت کانال)،
    به شرطی که **هر دو** مکان را کپی کنید:

    1. OpenClaw را روی ماشین جدید نصب کنید.
    2. `$OPENCLAW_STATE_DIR` (پیش‌فرض: `~/.openclaw`) را از ماشین قدیمی کپی کنید.
    3. فضای کاری خود را کپی کنید (پیش‌فرض: `~/.openclaw/workspace`).
    4. `openclaw doctor` را اجرا کنید و سرویس Gateway را راه‌اندازی دوباره کنید.

    این کار پیکربندی، پروفایل‌های احراز هویت، اعتبارنامه‌های WhatsApp، نشست‌ها، و حافظه را حفظ می‌کند. اگر در
    حالت راه دور هستید، به خاطر داشته باشید میزبان gateway مالک ذخیره‌گاه نشست و فضای کاری است.

    **مهم:** اگر فقط فضای کاری خود را در GitHub commit/push کنید، از
    **حافظه + فایل‌های bootstrap** پشتیبان می‌گیرید، اما از تاریخچه نشست یا احراز هویت **نه**. آن‌ها
    زیر `~/.openclaw/` قرار دارند (برای مثال `~/.openclaw/agents/<agentId>/sessions/`).

    مرتبط: [مهاجرت](/fa/install/migrating)، [چیزها روی دیسک کجا قرار دارند](/fa/help/faq#where-things-live-on-disk)،
    [فضای کاری عامل](/fa/concepts/agent-workspace)، [Doctor](/fa/gateway/doctor)،
    [حالت راه دور](/fa/gateway/remote).

  </Accordion>

  <Accordion title="کجا ببینم در آخرین نسخه چه چیزهایی جدید است؟">
    changelog در GitHub را بررسی کنید:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    جدیدترین مدخل‌ها در بالا هستند. اگر بخش بالایی با **Unreleased** علامت‌گذاری شده باشد، بخش تاریخ‌دار بعدی
    آخرین نسخه منتشرشده است. مدخل‌ها بر اساس **Highlights**، **Changes**، و
    **Fixes** گروه‌بندی شده‌اند (به‌علاوه بخش‌های مستندات/دیگر در صورت نیاز).

  </Accordion>

  <Accordion title="به docs.openclaw.ai دسترسی ندارم (خطای SSL)">
    برخی اتصال‌های Comcast/Xfinity به‌اشتباه `docs.openclaw.ai` را از طریق Xfinity
    Advanced Security مسدود می‌کنند. آن را غیرفعال کنید یا `docs.openclaw.ai` را در فهرست مجاز بگذارید، سپس دوباره امتحان کنید.
    لطفاً با گزارش در اینجا به ما کمک کنید آن را رفع انسداد کنیم: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    اگر هنوز نمی‌توانید به سایت دسترسی پیدا کنید، مستندات در GitHub آینه شده‌اند:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="تفاوت بین stable و beta">
    **Stable** و **beta**، **dist-tagهای npm** هستند، نه شاخه‌های کد جداگانه:

    - `latest` = پایدار
    - `beta` = بیلد اولیه برای آزمایش

    معمولا یک انتشار پایدار ابتدا روی **beta** قرار می‌گیرد، سپس یک مرحلهٔ
    ارتقای صریح همان نسخه را به `latest` منتقل می‌کند. نگه‌دارندگان همچنین می‌توانند
    در صورت نیاز مستقیم روی `latest` منتشر کنند. به همین دلیل beta و stable می‌توانند
    پس از ارتقا به **همان نسخه** اشاره کنند.

    ببینید چه چیزی تغییر کرده است:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    برای دستورهای نصب یک‌خطی و تفاوت بین beta و dev، Accordion زیر را ببینید.

  </Accordion>

  <Accordion title="چگونه نسخهٔ beta را نصب کنم و تفاوت beta و dev چیست؟">
    **Beta** همان dist-tag‏ npm با نام `beta` است (ممکن است پس از ارتقا با `latest` یکی باشد).
    **Dev** سر متحرک `main` (git) است؛ وقتی منتشر شود، از dist-tag‏ npm با نام `dev` استفاده می‌کند.

    دستورهای یک‌خطی (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    نصب‌کنندهٔ Windows‏ (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    جزئیات بیشتر: [کانال‌های توسعه](/fa/install/development-channels) و [پرچم‌های نصب‌کننده](/fa/install/installer).

  </Accordion>

  <Accordion title="چگونه جدیدترین بیت‌ها را امتحان کنم؟">
    دو گزینه:

    1. **کانال dev‏ (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    این کار به شاخهٔ `main` جابه‌جا می‌شود و از روی منبع به‌روزرسانی می‌کند.

    2. **نصب قابل‌دستکاری (از سایت نصب‌کننده):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    این کار یک مخزن محلی به شما می‌دهد که می‌توانید ویرایشش کنید و سپس از طریق git به‌روزرسانی کنید.

    اگر ترجیح می‌دهید یک clone تمیز را دستی انجام دهید، از این استفاده کنید:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    مستندات: [به‌روزرسانی](/fa/cli/update)، [کانال‌های توسعه](/fa/install/development-channels)،
    [نصب](/fa/install).

  </Accordion>

  <Accordion title="نصب و onboarding معمولا چقدر طول می‌کشد؟">
    راهنمای تقریبی:

    - **نصب:** ۲ تا ۵ دقیقه
    - **Onboarding:** ۵ تا ۱۵ دقیقه، بسته به اینکه چند کانال/مدل را پیکربندی می‌کنید

    اگر گیر کرد، از [گیر کردن نصب‌کننده](#quick-start-and-first-run-setup)
    و حلقهٔ سریع اشکال‌زدایی در [گیر کرده‌ام](#quick-start-and-first-run-setup) استفاده کنید.

  </Accordion>

  <Accordion title="نصب‌کننده گیر کرده است؟ چگونه بازخورد بیشتری بگیرم؟">
    نصب‌کننده را با **خروجی پرجزئیات** دوباره اجرا کنید:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    نصب beta با خروجی پرجزئیات:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    برای نصب قابل‌دستکاری (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    معادل Windows‏ (PowerShell):

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

    **1) خطای npm با spawn git / پیدا نشدن git**

    - **Git for Windows** را نصب کنید و مطمئن شوید `git` در PATH شما قرار دارد.
    - PowerShell را ببندید و دوباره باز کنید، سپس نصب‌کننده را دوباره اجرا کنید.

    **2) پس از نصب، openclaw شناخته نمی‌شود**

    - پوشهٔ bin سراسری npm شما در PATH نیست.
    - مسیر را بررسی کنید:

      ```powershell
      npm config get prefix
      ```

    - آن دایرکتوری را به PATH کاربر خود اضافه کنید (در Windows نیازی به پسوند `\bin` نیست؛ در بیشتر سیستم‌ها `%AppData%\npm` است).
    - پس از به‌روزرسانی PATH، PowerShell را ببندید و دوباره باز کنید.

    اگر روان‌ترین راه‌اندازی Windows را می‌خواهید، به‌جای Windows بومی از **WSL2** استفاده کنید.
    مستندات: [Windows](/fa/platforms/windows).

  </Accordion>

  <Accordion title="خروجی exec در Windows متن چینی ناخوانا نشان می‌دهد - چه کار کنم؟">
    این معمولا ناشی از ناهماهنگی صفحهٔ کد کنسول در شِل‌های بومی Windows است.

    نشانه‌ها:

    - خروجی `system.run`/`exec` چینی را به‌صورت mojibake نمایش می‌دهد
    - همان فرمان در پروفایل ترمینال دیگری درست دیده می‌شود

    راه‌حل سریع در PowerShell:

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

    اگر همچنان این را در آخرین نسخهٔ OpenClaw بازتولید می‌کنید، آن را اینجا پیگیری/گزارش کنید:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="مستندات به پرسش من پاسخ نداد - چگونه پاسخ بهتری بگیرم؟">
    از **نصب قابل‌دستکاری (git)** استفاده کنید تا کل منبع و مستندات را به‌صورت محلی داشته باشید، سپس از ربات خود
    (یا Claude/Codex) _از همان پوشه_ بپرسید تا بتواند مخزن را بخواند و دقیق پاسخ دهد.

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

  <Accordion title="چگونه OpenClaw را روی یک VPS نصب کنم؟">
    هر VPS لینوکسی کار می‌کند. روی سرور نصب کنید، سپس برای دسترسی به Gateway از SSH/Tailscale استفاده کنید.

    راهنماها: [exe.dev](/fa/install/exe-dev)، [Hetzner](/fa/install/hetzner)، [Fly.io](/fa/install/fly).
    دسترسی از راه دور: [Gateway از راه دور](/fa/gateway/remote).

  </Accordion>

  <Accordion title="راهنماهای نصب cloud/VPS کجا هستند؟">
    ما یک **هاب میزبانی** با ارائه‌دهندگان رایج نگه می‌داریم. یکی را انتخاب کنید و راهنما را دنبال کنید:

    - [میزبانی VPS](/fa/vps) (همهٔ ارائه‌دهندگان در یک جا)
    - [Fly.io](/fa/install/fly)
    - [Hetzner](/fa/install/hetzner)
    - [exe.dev](/fa/install/exe-dev)

    در cloud این‌طور کار می‌کند: **Gateway روی سرور اجرا می‌شود** و شما
    از لپ‌تاپ/تلفن خود از طریق Control UI (یا Tailscale/SSH) به آن دسترسی پیدا می‌کنید. وضعیت + workspace شما
    روی سرور قرار دارد، پس میزبان را منبع حقیقت بدانید و از آن پشتیبان بگیرید.

    می‌توانید **Nodeها** (Mac/iOS/Android/headless) را با آن Gateway ابری pair کنید تا به
    صفحه‌نمایش/دوربین/canvas محلی دسترسی داشته باشید یا در حالی که
    Gateway در cloud می‌ماند، روی لپ‌تاپ خود فرمان اجرا کنید.

    هاب: [پلتفرم‌ها](/fa/platforms). دسترسی از راه دور: [Gateway از راه دور](/fa/gateway/remote).
    Nodeها: [Nodeها](/fa/nodes)، [CLI‏ Nodeها](/fa/cli/nodes).

  </Accordion>

  <Accordion title="آیا می‌توانم از OpenClaw بخواهم خودش را به‌روزرسانی کند؟">
    پاسخ کوتاه: **ممکن است، توصیه نمی‌شود**. جریان به‌روزرسانی می‌تواند
    Gateway را دوباره راه‌اندازی کند (که نشست فعال را قطع می‌کند)، ممکن است به یک git checkout تمیز نیاز داشته باشد، و
    می‌تواند درخواست تأیید کند. امن‌تر: به‌روزرسانی‌ها را به‌عنوان اپراتور از یک شِل اجرا کنید.

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

  <Accordion title="onboarding دقیقا چه کاری انجام می‌دهد؟">
    `openclaw onboard` مسیر راه‌اندازی پیشنهادی است. در **حالت محلی** شما را از این مراحل عبور می‌دهد:

    - **راه‌اندازی مدل/auth** (OAuth ارائه‌دهنده، کلیدهای API، setup-token‏ Anthropic، به‌علاوه گزینه‌های مدل محلی مثل LM Studio)
    - مکان **Workspace** + فایل‌های bootstrap
    - **تنظیمات Gateway** (bind/port/auth/tailscale)
    - **کانال‌ها** (WhatsApp، Telegram، Discord، Mattermost، Signal، iMessage، به‌علاوه Pluginهای کانال بسته‌بندی‌شده مثل QQ Bot)
    - **نصب daemon** (LaunchAgent در macOS؛ واحد کاربری systemd در Linux/WSL2)
    - **بررسی‌های سلامت** و انتخاب **Skills**

    همچنین اگر مدل پیکربندی‌شدهٔ شما ناشناخته باشد یا auth نداشته باشد، هشدار می‌دهد.

  </Accordion>

  <Accordion title="آیا برای اجرای این به اشتراک Claude یا OpenAI نیاز دارم؟">
    خیر. می‌توانید OpenClaw را با **کلیدهای API** (Anthropic/OpenAI/دیگران) یا با
    **مدل‌های فقط محلی** اجرا کنید تا داده‌های شما روی دستگاهتان بماند. اشتراک‌ها (Claude
    Pro/Max یا OpenAI Codex) روش‌های اختیاری برای احراز هویت این ارائه‌دهندگان هستند.

    برای Anthropic در OpenClaw، تقسیم عملی این است:

    - **کلید API‏ Anthropic**: صورت‌حساب معمول API‏ Anthropic
    - **Claude CLI / احراز هویت اشتراک Claude در OpenClaw**: کارکنان Anthropic
      به ما گفتند این استفاده دوباره مجاز است، و OpenClaw استفاده از `claude -p`
      را برای این یکپارچه‌سازی مجاز تلقی می‌کند مگر اینکه Anthropic سیاست جدیدی منتشر کند

    برای میزبان‌های Gateway بلندمدت، کلیدهای API‏ Anthropic همچنان راه‌اندازی
    قابل‌پیش‌بینی‌تری هستند. OAuth‏ OpenAI Codex به‌صراحت برای ابزارهای خارجی
    مثل OpenClaw پشتیبانی می‌شود.

    OpenClaw همچنین از گزینه‌های میزبانی‌شدهٔ دیگر با سبک اشتراک، از جمله
    **Qwen Cloud Coding Plan**، **MiniMax Coding Plan** و
    **Z.AI / GLM Coding Plan** پشتیبانی می‌کند.

    مستندات: [Anthropic](/fa/providers/anthropic)، [OpenAI](/fa/providers/openai)،
    [Qwen Cloud](/fa/providers/qwen)،
    [MiniMax](/fa/providers/minimax)، [مدل‌های GLM](/fa/providers/glm)،
    [مدل‌های محلی](/fa/gateway/local-models)، [مدل‌ها](/fa/concepts/models).

  </Accordion>

  <Accordion title="آیا می‌توانم بدون کلید API از اشتراک Claude Max استفاده کنم؟">
    بله.

    کارکنان Anthropic به ما گفتند استفاده از Claude CLI به سبک OpenClaw دوباره مجاز است، بنابراین
    OpenClaw احراز هویت اشتراک Claude و استفاده از `claude -p` را برای این یکپارچه‌سازی
    مجاز تلقی می‌کند، مگر اینکه Anthropic سیاست جدیدی منتشر کند. اگر
    قابل‌پیش‌بینی‌ترین راه‌اندازی سمت سرور را می‌خواهید، به‌جای آن از کلید API‏ Anthropic استفاده کنید.

  </Accordion>

  <Accordion title="آیا از احراز هویت اشتراک Claude (Claude Pro یا Max) پشتیبانی می‌کنید؟">
    بله.

    کارکنان Anthropic به ما گفتند این استفاده دوباره مجاز است، بنابراین OpenClaw استفادهٔ دوباره از
    Claude CLI و استفاده از `claude -p` را برای این یکپارچه‌سازی
    مجاز تلقی می‌کند، مگر اینکه Anthropic سیاست جدیدی منتشر کند.

    setup-token‏ Anthropic همچنان به‌عنوان یک مسیر توکن پشتیبانی‌شده در OpenClaw موجود است، اما OpenClaw اکنون در صورت در دسترس بودن، استفادهٔ دوباره از Claude CLI و `claude -p` را ترجیح می‌دهد.
    برای بارهای کاری production یا چندکاربره، احراز هویت با کلید API‏ Anthropic همچنان
    گزینهٔ امن‌تر و قابل‌پیش‌بینی‌تری است. اگر گزینه‌های میزبانی‌شدهٔ دیگر با سبک اشتراک
    در OpenClaw می‌خواهید، [OpenAI](/fa/providers/openai)، [Qwen / Model
    Cloud](/fa/providers/qwen)، [MiniMax](/fa/providers/minimax)، و [مدل‌های GLM](/fa/providers/glm)
    را ببینید.

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="چرا HTTP 429 rate_limit_error از Anthropic می‌بینم؟">
    یعنی **سهمیه/محدودیت نرخ Anthropic** شما برای پنجرهٔ فعلی تمام شده است. اگر از
    **Claude CLI** استفاده می‌کنید، منتظر بازنشانی پنجره بمانید یا پلن خود را ارتقا دهید. اگر از
    **کلید API‏ Anthropic** استفاده می‌کنید، Anthropic Console را
    برای مصرف/صورت‌حساب بررسی کنید و در صورت نیاز محدودیت‌ها را افزایش دهید.

    اگر پیام دقیقاً این باشد:
    `Extra usage is required for long context requests`، درخواست در حال تلاش برای استفاده از بتای زمینهٔ ۱M Anthropic است (`context1m: true`). این فقط زمانی کار می‌کند که اعتبار شما واجد شرایط صورت‌حساب‌گیری زمینهٔ بلند باشد (صورت‌حساب‌گیری کلید API یا مسیر ورود Claude در OpenClaw با Extra Usage فعال).

    نکته: یک **مدل جایگزین** تنظیم کنید تا OpenClaw بتواند وقتی یک ارائه‌دهنده محدودیت نرخ دارد همچنان پاسخ دهد.
    [Models](/fa/cli/models)، [OAuth](/fa/concepts/oauth)، و
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/fa/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) را ببینید.

  </Accordion>

  <Accordion title="آیا AWS Bedrock پشتیبانی می‌شود؟">
    بله. OpenClaw یک ارائه‌دهندهٔ **Amazon Bedrock (Converse)** همراه دارد. وقتی نشانگرهای محیطی AWS حاضر باشند، OpenClaw می‌تواند کاتالوگ Bedrock برای streaming/text را خودکار کشف کند و آن را به‌عنوان یک ارائه‌دهندهٔ ضمنی `amazon-bedrock` ادغام کند؛ در غیر این صورت می‌توانید `plugins.entries.amazon-bedrock.config.discovery.enabled` را صراحتاً فعال کنید یا یک ورودی ارائه‌دهندهٔ دستی اضافه کنید. [Amazon Bedrock](/fa/providers/bedrock) و [ارائه‌دهندگان مدل](/fa/providers/models) را ببینید. اگر جریان کلید مدیریت‌شده را ترجیح می‌دهید، یک پراکسی سازگار با OpenAI در جلوی Bedrock همچنان گزینهٔ معتبری است.
  </Accordion>

  <Accordion title="احراز هویت Codex چگونه کار می‌کند؟">
    OpenClaw از **OpenAI Code (Codex)** از طریق OAuth (ورود ChatGPT) پشتیبانی می‌کند. برای راه‌اندازی رایج از
    `openai/gpt-5.5` استفاده کنید: احراز هویت اشتراک ChatGPT/Codex به‌همراه
    اجرای بومی app-server در Codex. ارجاع‌های مدل `openai-codex/gpt-*`
    پیکربندی قدیمی هستند که با `openclaw doctor --fix` ترمیم می‌شوند. دسترسی مستقیم با کلید API
    OpenAI همچنان برای سطوح API غیرعامل OpenAI و برای مدل‌های عامل
    از طریق یک پروفایل کلید API مرتب‌شدهٔ `openai-codex` در دسترس است.
    [ارائه‌دهندگان مدل](/fa/concepts/model-providers) و [آنبوردینگ (CLI)](/fa/start/wizard) را ببینید.
  </Accordion>

  <Accordion title="چرا OpenClaw هنوز به openai-codex اشاره می‌کند؟">
    `openai-codex` شناسهٔ ارائه‌دهنده و پروفایل احراز هویت برای OAuth مربوط به ChatGPT/Codex است.
    پیکربندی‌های قدیمی‌تر از آن به‌عنوان پیشوند مدل هم استفاده می‌کردند:

    - `openai/gpt-5.5` = احراز هویت اشتراک ChatGPT/Codex با runtime بومی Codex برای نوبت‌های عامل
    - `openai-codex/gpt-5.5` = مسیر مدل قدیمی که با `openclaw doctor --fix` ترمیم می‌شود
    - `openai/gpt-5.5` به‌همراه یک پروفایل کلید API مرتب‌شدهٔ `openai-codex` = احراز هویت کلید API برای یک مدل عامل OpenAI
    - `openai-codex:...` = شناسهٔ پروفایل احراز هویت، نه ارجاع مدل

    اگر مسیر مستقیم صورت‌حساب‌گیری/محدودیت OpenAI Platform را می‌خواهید،
    `OPENAI_API_KEY` را تنظیم کنید. اگر احراز هویت اشتراک ChatGPT/Codex را می‌خواهید، با
    `openclaw models auth login --provider openai-codex` وارد شوید. ارجاع مدل را به‌صورت
    `openai/gpt-5.5` نگه دارید؛ ارجاع‌های مدل `openai-codex/*` پیکربندی قدیمی هستند که
    `openclaw doctor --fix` بازنویسی می‌کند.

  </Accordion>

  <Accordion title="چرا محدودیت‌های OAuth در Codex می‌تواند با وب ChatGPT فرق داشته باشد؟">
    OAuth در Codex از پنجره‌های سهمیهٔ مدیریت‌شده توسط OpenAI و وابسته به طرح استفاده می‌کند. در عمل،
    این محدودیت‌ها می‌توانند با تجربهٔ وب‌سایت/اپ ChatGPT متفاوت باشند، حتی وقتی
    هر دو به یک حساب وصل هستند.

    OpenClaw می‌تواند پنجره‌های مصرف/سهمیهٔ ارائه‌دهنده را که اکنون قابل مشاهده‌اند در
    `openclaw models status` نشان دهد، اما استحقاق‌های ChatGPT-web را به دسترسی مستقیم API
    جعل یا نرمال‌سازی نمی‌کند. اگر مسیر مستقیم صورت‌حساب‌گیری/محدودیت OpenAI Platform
    را می‌خواهید، از `openai/*` با یک کلید API استفاده کنید.

  </Accordion>

  <Accordion title="آیا از احراز هویت اشتراک OpenAI (OAuth در Codex) پشتیبانی می‌کنید؟">
    بله. OpenClaw به‌طور کامل از **OAuth اشتراک OpenAI Code (Codex)** پشتیبانی می‌کند.
    OpenAI صراحتاً استفاده از OAuth اشتراک را در ابزارها/گردش‌کارهای خارجی
    مانند OpenClaw مجاز می‌داند. آنبوردینگ می‌تواند جریان OAuth را برای شما اجرا کند.

    [OAuth](/fa/concepts/oauth)، [ارائه‌دهندگان مدل](/fa/concepts/model-providers)، و [آنبوردینگ (CLI)](/fa/start/wizard) را ببینید.

  </Accordion>

  <Accordion title="چگونه OAuth مربوط به Gemini CLI را راه‌اندازی کنم؟">
    Gemini CLI از یک **جریان احراز هویت Plugin** استفاده می‌کند، نه یک client id یا secret در `openclaw.json`.

    مراحل:

    1. Gemini CLI را به‌صورت محلی نصب کنید تا `gemini` روی `PATH` باشد
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin را فعال کنید: `openclaw plugins enable google`
    3. وارد شوید: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. مدل پیش‌فرض پس از ورود: `google-gemini-cli/gemini-3-flash-preview`
    5. اگر درخواست‌ها ناموفق بودند، `GOOGLE_CLOUD_PROJECT` یا `GOOGLE_CLOUD_PROJECT_ID` را روی میزبان gateway تنظیم کنید

    این کار توکن‌های OAuth را در پروفایل‌های احراز هویت روی میزبان gateway ذخیره می‌کند. جزئیات: [ارائه‌دهندگان مدل](/fa/concepts/model-providers).

  </Accordion>

  <Accordion title="آیا یک مدل محلی برای گفت‌وگوهای معمولی مناسب است؟">
    معمولاً خیر. OpenClaw به زمینهٔ بزرگ + ایمنی قوی نیاز دارد؛ کارت‌های کوچک کوتاه می‌کنند و نشت می‌دهند. اگر مجبورید، **بزرگ‌ترین** ساخت مدل را که می‌توانید به‌صورت محلی اجرا کنید (LM Studio) اجرا کنید و [/gateway/local-models](/fa/gateway/local-models) را ببینید. مدل‌های کوچک‌تر/کوانتیده خطر تزریق پرامپت را افزایش می‌دهند - [امنیت](/fa/gateway/security) را ببینید.
  </Accordion>

  <Accordion title="چگونه ترافیک مدل میزبانی‌شده را در یک منطقهٔ مشخص نگه دارم؟">
    endpointهای مقید به منطقه را انتخاب کنید. OpenRouter گزینه‌های میزبانی‌شده در آمریکا را برای MiniMax، Kimi، و GLM ارائه می‌کند؛ گونهٔ میزبانی‌شده در آمریکا را انتخاب کنید تا داده در همان منطقه بماند. همچنان می‌توانید Anthropic/OpenAI را کنار این‌ها فهرست کنید، با استفاده از `models.mode: "merge"` تا جایگزین‌ها در دسترس بمانند و در عین حال ارائه‌دهندهٔ منطقه‌ای انتخابی شما رعایت شود.
  </Accordion>

  <Accordion title="آیا برای نصب این باید Mac Mini بخرم؟">
    خیر. OpenClaw روی macOS یا Linux اجرا می‌شود (Windows از طریق WSL2). Mac mini اختیاری است - بعضی افراد
    آن را به‌عنوان یک میزبان همیشه‌روشن می‌خرند، اما یک VPS کوچک، سرور خانگی، یا دستگاهی در کلاس Raspberry Pi هم کار می‌کند.

    فقط برای **ابزارهای مخصوص macOS** به Mac نیاز دارید. برای iMessage، از [iMessage](/fa/channels/imessage) با `imsg` روی هر Mac که وارد Messages شده استفاده کنید. اگر Gateway روی Linux یا جای دیگری اجرا می‌شود، `channels.imessage.cliPath` را روی یک wrapper مبتنی بر SSH تنظیم کنید که `imsg` را روی آن Mac اجرا می‌کند. اگر ابزارهای دیگری می‌خواهید که فقط روی macOS هستند، Gateway را روی Mac اجرا کنید یا یک Node مبتنی بر macOS را جفت کنید.

    مستندات: [iMessage](/fa/channels/imessage)، [Nodeها](/fa/nodes)، [حالت راه‌دور Mac](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="آیا برای پشتیبانی iMessage به Mac mini نیاز دارم؟">
    به **یک دستگاه macOS** نیاز دارید که وارد Messages شده باشد. لازم **نیست** Mac mini باشد -
    هر Macای کار می‌کند. **از [iMessage](/fa/channels/imessage)** با `imsg` استفاده کنید؛ Gateway می‌تواند روی همان Mac اجرا شود، یا می‌تواند جای دیگری با یک wrapper `cliPath` مبتنی بر SSH اجرا شود.

    راه‌اندازی‌های رایج:

    - Gateway را روی Linux/VPS اجرا کنید و `channels.imessage.cliPath` را روی یک wrapper مبتنی بر SSH تنظیم کنید که `imsg` را روی Mac واردشده به Messages اجرا می‌کند.
    - اگر ساده‌ترین راه‌اندازی تک‌ماشینه را می‌خواهید، همه‌چیز را روی Mac اجرا کنید.

    مستندات: [iMessage](/fa/channels/imessage)، [Nodeها](/fa/nodes)،
    [حالت راه‌دور Mac](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="اگر برای اجرای OpenClaw یک Mac mini بخرم، می‌توانم آن را به MacBook Pro خود وصل کنم؟">
    بله. **Mac mini می‌تواند Gateway را اجرا کند**، و MacBook Pro شما می‌تواند به‌عنوان یک
    **Node** (دستگاه همراه) وصل شود. Nodeها Gateway را اجرا نمی‌کنند - آن‌ها قابلیت‌های اضافی
    مانند screen/camera/canvas و `system.run` را روی همان دستگاه ارائه می‌کنند.

    الگوی رایج:

    - Gateway روی Mac mini (همیشه‌روشن).
    - MacBook Pro اپ macOS یا یک میزبان Node را اجرا می‌کند و با Gateway جفت می‌شود.
    - برای دیدن آن از `openclaw nodes status` / `openclaw nodes list` استفاده کنید.

    مستندات: [Nodeها](/fa/nodes)، [CLI مربوط به Nodeها](/fa/cli/nodes).

  </Accordion>

  <Accordion title="آیا می‌توانم از Bun استفاده کنم؟">
    Bun **توصیه نمی‌شود**. ما باگ‌های runtime می‌بینیم، به‌ویژه با WhatsApp و Telegram.
    برای gatewayهای پایدار از **Node** استفاده کنید.

    اگر همچنان می‌خواهید Bun را آزمایش کنید، این کار را روی یک gateway غیرتولیدی
    بدون WhatsApp/Telegram انجام دهید.

  </Accordion>

  <Accordion title="Telegram: چه چیزی در allowFrom قرار می‌گیرد؟">
    `channels.telegram.allowFrom` **شناسهٔ کاربر Telegram فرستندهٔ انسانی** است (عددی). نام کاربری ربات نیست.

    راه‌اندازی فقط شناسه‌های عددی کاربر را درخواست می‌کند. اگر از قبل ورودی‌های قدیمی `@username` در پیکربندی دارید، `openclaw doctor --fix` می‌تواند تلاش کند آن‌ها را resolve کند.

    امن‌تر (بدون ربات شخص ثالث):

    - به ربات خود DM بدهید، سپس `openclaw logs --follow` را اجرا کنید و `from.id` را بخوانید.

    Bot API رسمی:

    - به ربات خود DM بدهید، سپس `https://api.telegram.org/bot<bot_token>/getUpdates` را فراخوانی کنید و `message.from.id` را بخوانید.

    شخص ثالث (خصوصی‌تر نیست):

    - به `@userinfobot` یا `@getidsbot` DM بدهید.

    [/channels/telegram](/fa/channels/telegram#access-control-and-activation) را ببینید.

  </Accordion>

  <Accordion title="آیا چند نفر می‌توانند از یک شمارهٔ WhatsApp با نمونه‌های مختلف OpenClaw استفاده کنند؟">
    بله، از طریق **مسیریابی چندعامله**. **DM** هر فرستنده در WhatsApp (peer با `kind: "direct"`، فرستندهٔ E.164 مانند `+15551234567`) را به یک `agentId` متفاوت bind کنید، تا هر شخص workspace و session store خودش را داشته باشد. پاسخ‌ها همچنان از **همان حساب WhatsApp** می‌آیند، و کنترل دسترسی DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) برای هر حساب WhatsApp سراسری است. [مسیریابی چندعامله](/fa/concepts/multi-agent) و [WhatsApp](/fa/channels/whatsapp) را ببینید.
  </Accordion>

  <Accordion title='آیا می‌توانم یک عامل "fast chat" و یک عامل "Opus for coding" اجرا کنم؟'>
    بله. از مسیریابی چندعامله استفاده کنید: برای هر عامل مدل پیش‌فرض خودش را تعیین کنید، سپس مسیرهای ورودی (حساب ارائه‌دهنده یا peerهای مشخص) را به هر عامل bind کنید. نمونهٔ پیکربندی در [مسیریابی چندعامله](/fa/concepts/multi-agent) قرار دارد. همچنین [مدل‌ها](/fa/concepts/models) و [پیکربندی](/fa/gateway/configuration) را ببینید.
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
    ساخت‌های اخیر همچنین مسیرهای رایج bin کاربر را در سرویس‌های systemd روی Linux در ابتدای PATH قرار می‌دهند (برای مثال `~/.local/bin`، `~/.npm-global/bin`، `~/.local/share/pnpm`، `~/.bun/bin`) و هنگام تنظیم‌شدن `PNPM_HOME`، `NPM_CONFIG_PREFIX`، `BUN_INSTALL`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `NVM_DIR`، و `FNM_DIR` آن‌ها را رعایت می‌کنند.

  </Accordion>

  <Accordion title="تفاوت بین نصب قابل‌هک با git و نصب npm">
    - **نصب قابل‌هک (git):** checkout کامل سورس، قابل ویرایش، بهترین گزینه برای مشارکت‌کنندگان.
      بیلدها را به‌صورت محلی اجرا می‌کنید و می‌توانید کد/مستندات را patch کنید.
    - **نصب npm:** نصب CLI سراسری، بدون repo، بهترین گزینه برای «فقط اجرا کردن».
      به‌روزرسانی‌ها از dist-tagهای npm می‌آیند.

    مستندات: [شروع کار](/fa/start/getting-started)، [به‌روزرسانی](/fa/install/updating).

  </Accordion>

  <Accordion title="آیا بعداً می‌توانم بین نصب‌های npm و git جابه‌جا شوم؟">
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

    برای پیش‌نمایش اولیهٔ تغییر حالت برنامه‌ریزی‌شده، `--dry-run` را اضافه کنید. به‌روزرساننده
    پیگیری‌های Doctor را اجرا می‌کند، منابع Plugin را برای کانال هدف تازه‌سازی می‌کند، و
    gateway را restart می‌کند مگر اینکه `--no-restart` را پاس دهید.

    نصب‌کننده هم می‌تواند هر یک از حالت‌ها را اجباری کند:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    نکته‌های پشتیبان‌گیری: [راهبرد پشتیبان‌گیری](/fa/help/faq#where-things-live-on-disk) را ببینید.

  </Accordion>

  <Accordion title="آیا باید Gateway را روی لپ‌تاپم اجرا کنم یا روی VPS؟">
    پاسخ کوتاه: **اگر قابلیت اطمینان ۲۴/۷ می‌خواهید، از VPS استفاده کنید**. اگر کمترین دردسر را می‌خواهید و با خوابیدن سیستم/راه‌اندازی مجدد مشکلی ندارید، آن را به‌صورت محلی اجرا کنید.

    **لپ‌تاپ (Gateway محلی)**

    - **مزایا:** بدون هزینه سرور، دسترسی مستقیم به فایل‌های محلی، پنجره مرورگر زنده.
    - **معایب:** خوابیدن/قطع شبکه = قطع اتصال، به‌روزرسانی‌های سیستم‌عامل/راه‌اندازی مجدد اختلال ایجاد می‌کند، باید بیدار بماند.

    **VPS / ابر**

    - **مزایا:** همیشه روشن، شبکه پایدار، بدون مشکل خوابیدن لپ‌تاپ، آسان‌تر برای روشن نگه داشتن.
    - **معایب:** اغلب به‌صورت headless اجرا می‌شود (از اسکرین‌شات‌ها استفاده کنید)، فقط دسترسی فایل از راه دور، برای به‌روزرسانی‌ها باید SSH کنید.

    **نکته مخصوص OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord همگی از روی VPS به‌خوبی کار می‌کنند. تنها بده‌بستان واقعی **مرورگر headless** در برابر پنجره قابل مشاهده است. [مرورگر](/fa/tools/browser) را ببینید.

    **پیش‌فرض پیشنهادی:** اگر قبلا قطع اتصال gateway داشته‌اید، VPS. حالت محلی زمانی عالی است که فعالانه از Mac استفاده می‌کنید و دسترسی به فایل‌های محلی یا خودکارسازی UI با مرورگر قابل مشاهده می‌خواهید.

  </Accordion>

  <Accordion title="اجرای OpenClaw روی یک ماشین اختصاصی چقدر مهم است؟">
    الزامی نیست، اما **برای قابلیت اطمینان و ایزوله‌سازی توصیه می‌شود**.

    - **میزبان اختصاصی (VPS/Mac mini/Pi):** همیشه روشن، وقفه‌های کمتر به‌دلیل خوابیدن/راه‌اندازی مجدد، مجوزهای تمیزتر، آسان‌تر برای روشن نگه داشتن.
    - **لپ‌تاپ/دسکتاپ مشترک:** برای آزمایش و استفاده فعال کاملا مناسب است، اما وقتی ماشین می‌خوابد یا به‌روزرسانی می‌شود انتظار مکث داشته باشید.

    اگر بهترین حالت هر دو دنیا را می‌خواهید، Gateway را روی یک میزبان اختصاصی نگه دارید و لپ‌تاپ خود را به‌عنوان یک **Node** برای ابزارهای صفحه‌نمایش/دوربین/اجرا جفت کنید. [Nodes](/fa/nodes) را ببینید.
    برای راهنمایی امنیتی، [امنیت](/fa/gateway/security) را بخوانید.

  </Accordion>

  <Accordion title="حداقل نیازمندی‌های VPS و سیستم‌عامل پیشنهادی چیست؟">
    OpenClaw سبک است. برای یک Gateway پایه + یک کانال چت:

    - **حداقل مطلق:** 1 vCPU، 1GB RAM، حدود 500MB دیسک.
    - **پیشنهادی:** 1-2 vCPU، 2GB RAM یا بیشتر برای فضای تنفس (لاگ‌ها، رسانه، چند کانال). ابزارهای Node و خودکارسازی مرورگر می‌توانند پرمصرف باشند.

    سیستم‌عامل: از **Ubuntu LTS** (یا هر Debian/Ubuntu مدرن) استفاده کنید. مسیر نصب Linux در آنجا بهتر آزموده شده است.

    مستندات: [Linux](/fa/platforms/linux)، [میزبانی VPS](/fa/vps).

  </Accordion>

  <Accordion title="آیا می‌توانم OpenClaw را در یک VM اجرا کنم و نیازمندی‌ها چیست؟">
    بله. با VM مثل VPS برخورد کنید: باید همیشه روشن، قابل دسترسی، و دارای RAM کافی برای Gateway و هر کانالی باشد که فعال می‌کنید.

    راهنمای پایه:

    - **حداقل مطلق:** 1 vCPU، 1GB RAM.
    - **پیشنهادی:** اگر چند کانال، خودکارسازی مرورگر، یا ابزارهای رسانه اجرا می‌کنید، 2GB RAM یا بیشتر.
    - **سیستم‌عامل:** Ubuntu LTS یا یک Debian/Ubuntu مدرن دیگر.

    اگر روی Windows هستید، **WSL2 آسان‌ترین راه‌اندازی به سبک VM است** و بهترین سازگاری ابزارها را دارد. [Windows](/fa/platforms/windows)، [میزبانی VPS](/fa/vps) را ببینید.
    اگر macOS را در یک VM اجرا می‌کنید، [macOS VM](/fa/install/macos-vm) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [FAQ](/fa/help/faq) — پرسش‌های متداول اصلی (مدل‌ها، نشست‌ها، gateway، امنیت، موارد بیشتر)
- [نمای کلی نصب](/fa/install)
- [شروع به کار](/fa/start/getting-started)
- [عیب‌یابی](/fa/help/troubleshooting)
