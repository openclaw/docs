---
read_when:
    - نصب جدید، گیر کردن راه‌اندازی اولیه، یا خطاهای اجرای نخستین
    - انتخاب احراز هویت و اشتراک‌های ارائه‌دهنده
    - نمی‌توان به docs.openclaw.ai دسترسی داشت، نمی‌توان داشبورد را باز کرد، نصب گیر کرده است
sidebarTitle: First-run FAQ
summary: 'پرسش‌های متداول: راه‌اندازی سریع و پیکربندی اجرای نخست — نصب، ورود اولیه، احراز هویت، اشتراک‌ها، خطاهای اولیه'
title: 'پرسش‌های متداول: راه‌اندازی اجرای نخست'
x-i18n:
    generated_at: "2026-06-27T17:52:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 182022cc91cea7ec4857aeb222fe1d001a1476a90c221f610616cc7da7ba8a98
    source_path: help/faq-first-run.md
    workflow: 16
---

  پرسش‌وپاسخ شروع سریع و نخستین اجرا. برای عملیات روزمره، مدل‌ها، احراز هویت، نشست‌ها،
  و عیب‌یابی، [پرسش‌های متداول](/fa/help/faq) اصلی را ببینید.

  ## شروع سریع و راه‌اندازی نخستین اجرا

  <AccordionGroup>
  <Accordion title="گیر کرده‌ام، سریع‌ترین راه برای خارج شدن از بن‌بست">
    از یک عامل هوش مصنوعی محلی استفاده کنید که بتواند **دستگاه شما را ببیند**. این کار بسیار مؤثرتر از پرسیدن
    در Discord است، چون بیشتر موارد «گیر کرده‌ام» **مشکلات پیکربندی یا محیط محلی** هستند که
    کمک‌کنندگان راه دور نمی‌توانند آن‌ها را بررسی کنند.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    این ابزارها می‌توانند مخزن را بخوانند، فرمان‌ها را اجرا کنند، گزارش‌ها را بررسی کنند، و به رفع راه‌اندازی
    سطح دستگاه شما کمک کنند (PATH، سرویس‌ها، مجوزها، فایل‌های احراز هویت). از طریق نصب
    قابل‌هک (git)، **نسخه کامل منبع** را در اختیارشان بگذارید:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    این کار OpenClaw را **از یک checkout گیت** نصب می‌کند، بنابراین عامل می‌تواند کد + مستندات را بخواند و
    درباره نسخه دقیقی که اجرا می‌کنید استدلال کند. بعداً همیشه می‌توانید با اجرای دوباره نصب‌کننده بدون
    `--install-method git` به نسخه پایدار برگردید.

    نکته: از عامل بخواهید رفع مشکل را **برنامه‌ریزی و نظارت** کند (گام‌به‌گام)، سپس فقط
    فرمان‌های لازم را اجرا کنید. این کار تغییرات را کوچک و حسابرسی آن‌ها را آسان‌تر نگه می‌دارد.

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
    - `openclaw models status`: احراز هویت ارائه‌دهنده + در دسترس بودن مدل را بررسی می‌کند.
    - `openclaw doctor`: مشکلات رایج پیکربندی/وضعیت را اعتبارسنجی و تعمیر می‌کند.

    بررسی‌های مفید دیگر CLI: `openclaw status --all`، `openclaw logs --follow`،
    `openclaw gateway status`، `openclaw health --verbose`.

    چرخه عیب‌یابی سریع: [۶۰ ثانیه نخست اگر چیزی خراب است](/fa/help/faq#first-60-seconds-if-something-is-broken).
    مستندات نصب: [نصب](/fa/install)، [پرچم‌های نصب‌کننده](/fa/install/installer)، [به‌روزرسانی](/fa/install/updating).

  </Accordion>

  <Accordion title="Heartbeat مدام رد می‌شود. دلایل رد شدن یعنی چه؟">
    دلایل رایج رد شدن Heartbeat:

    - `quiet-hours`: خارج از بازه active-hours پیکربندی‌شده
    - `empty-heartbeat-file`: `HEARTBEAT.md` وجود دارد اما فقط شامل داربست خالی، نظر، سرآیند، fence، یا چک‌لیست خالی است
    - `no-tasks-due`: حالت وظیفه `HEARTBEAT.md` فعال است اما هنوز موعد هیچ‌یک از بازه‌های وظیفه نرسیده است
    - `alerts-disabled`: تمام نمایش‌پذیری Heartbeat غیرفعال است (`showOk`، `showAlerts`، و `useIndicator` همگی خاموش هستند)

    در حالت وظیفه، زمان‌های موعد فقط پس از تکمیل یک اجرای واقعی Heartbeat
    جلو برده می‌شوند. اجراهای ردشده وظیفه‌ها را کامل‌شده علامت نمی‌زنند.

    مستندات: [Heartbeat](/fa/gateway/heartbeat)، [اتوماسیون](/fa/automation).

  </Accordion>

  <Accordion title="روش پیشنهادی برای نصب و راه‌اندازی OpenClaw">
    مخزن اجرای از منبع و استفاده از فرایند آغازین را پیشنهاد می‌کند:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    جادوگر همچنین می‌تواند دارایی‌های UI را به‌صورت خودکار بسازد. پس از آغازین‌سازی، معمولاً Gateway را روی پورت **18789** اجرا می‌کنید.

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

  <Accordion title="پس از آغازین‌سازی چگونه داشبورد را باز کنم؟">
    جادوگر بلافاصله پس از آغازین‌سازی مرورگر شما را با یک نشانی داشبورد تمیز (بدون توکن) باز می‌کند و همچنین پیوند را در خلاصه چاپ می‌کند. آن زبانه را باز نگه دارید؛ اگر اجرا نشد، نشانی چاپ‌شده را روی همان دستگاه کپی/جای‌گذاری کنید.
  </Accordion>

  <Accordion title="چگونه داشبورد را روی localhost در برابر راه دور احراز هویت کنم؟">
    **Localhost (همان دستگاه):**

    - `http://127.0.0.1:18789/` را باز کنید.
    - اگر shared-secret auth خواست، توکن یا گذرواژه پیکربندی‌شده را در تنظیمات Control UI جای‌گذاری کنید.
    - منبع توکن: `gateway.auth.token` (یا `OPENCLAW_GATEWAY_TOKEN`).
    - منبع گذرواژه: `gateway.auth.password` (یا `OPENCLAW_GATEWAY_PASSWORD`).
    - اگر هنوز shared secret پیکربندی نشده است، با `openclaw doctor --generate-gateway-token` یک توکن بسازید.

    **نه روی localhost:**

    - **Tailscale Serve** (پیشنهادی): bind loopback را نگه دارید، `openclaw gateway --tailscale serve` را اجرا کنید، `https://<magicdns>/` را باز کنید. اگر `gateway.auth.allowTailscale` برابر `true` باشد، سرآیندهای هویت احراز هویت Control UI/وب‌سوکت را برآورده می‌کنند (بدون shared secret جای‌گذاری‌شده، با فرض میزبان gateway مورد اعتماد)؛ APIهای HTTP همچنان shared-secret auth می‌خواهند مگر اینکه عمداً از private-ingress `none` یا trusted-proxy HTTP auth استفاده کنید.
      تلاش‌های هم‌زمان ناموفق Serve auth از همان کلاینت پیش از ثبت شدن توسط محدودکننده احراز هویت ناموفق، سریال می‌شوند، بنابراین تلاش ناموفق دوم ممکن است از قبل `retry later` نشان دهد.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` را اجرا کنید (یا احراز هویت گذرواژه را پیکربندی کنید)، `http://<tailscale-ip>:18789/` را باز کنید، سپس shared secret منطبق را در تنظیمات داشبورد جای‌گذاری کنید.
    - **پراکسی معکوس آگاه از هویت**: Gateway را پشت یک پراکسی مورد اعتماد نگه دارید، `gateway.auth.mode: "trusted-proxy"` را پیکربندی کنید، سپس نشانی پراکسی را باز کنید. پراکسی‌های local loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند.
    - **تونل SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` سپس `http://127.0.0.1:18789/` را باز کنید. shared-secret auth همچنان روی تونل اعمال می‌شود؛ اگر درخواست شد توکن یا گذرواژه پیکربندی‌شده را جای‌گذاری کنید.

    برای حالت‌های bind و جزئیات احراز هویت، [داشبورد](/fa/web/dashboard) و [سطح‌های وب](/fa/web) را ببینید.

  </Accordion>

  <Accordion title="چرا برای تأییدهای چت دو پیکربندی تأیید exec وجود دارد؟">
    آن‌ها لایه‌های متفاوتی را کنترل می‌کنند:

    - `approvals.exec`: درخواست‌های تأیید را به مقصدهای چت ارسال می‌کند
    - `channels.<channel>.execApprovals`: آن کانال را برای تأییدهای exec به‌عنوان یک کلاینت تأیید بومی عمل می‌دهد

    سیاست exec میزبان همچنان دروازه تأیید واقعی است. پیکربندی چت فقط کنترل می‌کند درخواست‌های تأیید
    کجا ظاهر شوند و افراد چگونه بتوانند به آن‌ها پاسخ دهند.

    در بیشتر راه‌اندازی‌ها به هر دو **نیاز ندارید**:

    - اگر چت از قبل از فرمان‌ها و پاسخ‌ها پشتیبانی می‌کند، `/approve` در همان چت از مسیر مشترک کار می‌کند.
    - اگر یک کانال بومی پشتیبانی‌شده بتواند تأییدکنندگان را با اطمینان استنتاج کند، OpenClaw اکنون وقتی `channels.<channel>.execApprovals.enabled` تنظیم نشده یا `"auto"` باشد، تأییدهای بومی با اولویت DM را به‌طور خودکار فعال می‌کند.
    - وقتی کارت‌ها/دکمه‌های تأیید بومی در دسترس باشند، آن UI بومی مسیر اصلی است؛ عامل فقط زمانی باید یک فرمان دستی `/approve` درج کند که نتیجه ابزار بگوید تأییدهای چت در دسترس نیستند یا تأیید دستی تنها مسیر است.
    - از `approvals.exec` فقط زمانی استفاده کنید که درخواست‌ها باید به چت‌های دیگر یا اتاق‌های عملیاتی صریح نیز ارسال شوند.
    - از `channels.<channel>.execApprovals.target: "channel"` یا `"both"` فقط زمانی استفاده کنید که صریحاً می‌خواهید درخواست‌های تأیید دوباره در اتاق/موضوع مبدأ ارسال شوند.
    - تأییدهای Plugin دوباره جدا هستند: به‌طور پیش‌فرض از `/approve` در همان چت استفاده می‌کنند، ارسال اختیاری `approvals.plugin` دارند، و فقط برخی کانال‌های بومی مدیریت بومی تأیید Plugin را روی آن نگه می‌دارند.

    نسخه کوتاه: ارسال برای مسیریابی است، پیکربندی کلاینت بومی برای تجربه کاربری غنی‌تر و ویژه هر کانال است.
    [تأییدهای Exec](/fa/tools/exec-approvals) را ببینید.

  </Accordion>

  <Accordion title="به چه زمان اجرایی نیاز دارم؟">
    Node **>= 22** لازم است. `pnpm` پیشنهاد می‌شود. Bun برای Gateway **پیشنهاد نمی‌شود**.
  </Accordion>

  <Accordion title="آیا روی Raspberry Pi اجرا می‌شود؟">
    بله. Gateway سبک است - مستندات **512MB-1GB RAM**، **1 core**، و حدود **500MB**
    دیسک را برای استفاده شخصی کافی می‌دانند و اشاره می‌کنند که **Raspberry Pi 4 می‌تواند آن را اجرا کند**.

    اگر فضای تنفس بیشتری می‌خواهید (گزارش‌ها، رسانه، سرویس‌های دیگر)، **2GB پیشنهاد می‌شود**، اما
    حداقل سخت نیست.

    نکته: یک Raspberry Pi/VPS کوچک می‌تواند میزبان Gateway باشد، و شما می‌توانید **گره‌ها** را روی لپ‌تاپ/تلفن خود برای
    صفحه‌نمایش/دوربین/canvas محلی یا اجرای فرمان جفت کنید. [گره‌ها](/fa/nodes) را ببینید.

  </Accordion>

  <Accordion title="نکته‌ای برای نصب‌های Raspberry Pi دارید؟">
    نسخه کوتاه: کار می‌کند، اما انتظار لبه‌های ناصاف داشته باشید.

    - از سیستم‌عامل **64-bit** استفاده کنید و Node >= 22 را نگه دارید.
    - نصب **قابل‌هک (git)** را ترجیح دهید تا بتوانید گزارش‌ها را ببینید و سریع به‌روزرسانی کنید.
    - بدون کانال‌ها/Skills شروع کنید، سپس آن‌ها را یکی‌یکی اضافه کنید.
    - اگر به مشکلات عجیب باینری برخوردید، معمولاً مشکل **سازگاری ARM** است.

    مستندات: [Linux](/fa/platforms/linux)، [نصب](/fa/install).

  </Accordion>

  <Accordion title="روی wake up my friend گیر کرده است / آغازین‌سازی باز نمی‌شود. حالا چه؟">
    آن صفحه به دردسترس و احرازشده بودن Gateway وابسته است. TUI همچنین در نخستین hatch
    به‌طور خودکار «Wake up, my friend!» را می‌فرستد. اگر آن خط را با **بدون پاسخ**
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

  <Accordion title="آیا می‌توانم راه‌اندازی خود را بدون انجام دوباره آغازین‌سازی به یک دستگاه جدید (Mac mini) منتقل کنم؟">
    بله. **پوشه وضعیت** و **فضای کاری** را کپی کنید، سپس یک‌بار Doctor را اجرا کنید. این کار
    ربات شما را «دقیقاً همان‌طور» نگه می‌دارد (حافظه، تاریخچه نشست، احراز هویت، و وضعیت کانال)
    به شرطی که **هر دو** مکان را کپی کنید:

    1. OpenClaw را روی دستگاه جدید نصب کنید.
    2. `$OPENCLAW_STATE_DIR` (پیش‌فرض: `~/.openclaw`) را از دستگاه قدیمی کپی کنید.
    3. فضای کاری خود را کپی کنید (پیش‌فرض: `~/.openclaw/workspace`).
    4. `openclaw doctor` را اجرا کنید و سرویس Gateway را بازراه‌اندازی کنید.

    این کار پیکربندی، پروفایل‌های احراز هویت، اعتبارنامه‌های WhatsApp، نشست‌ها، و حافظه را حفظ می‌کند. اگر در
    حالت راه دور هستید، به یاد داشته باشید میزبان gateway مالک ذخیره‌گاه نشست و فضای کاری است.

    **مهم:** اگر فقط فضای کاری خود را به GitHub commit/push کنید، از
    **حافظه + فایل‌های راه‌انداز** پشتیبان می‌گیرید، اما از تاریخچه نشست یا احراز هویت **نه**. آن‌ها
    زیر `~/.openclaw/` قرار دارند (برای مثال `~/.openclaw/agents/<agentId>/sessions/`).

    مرتبط: [مهاجرت](/fa/install/migrating)، [چیزها روی دیسک کجا قرار دارند](/fa/help/faq#where-things-live-on-disk)،
    [فضای کاری عامل](/fa/concepts/agent-workspace)، [Doctor](/fa/gateway/doctor)،
    [حالت راه دور](/fa/gateway/remote).

  </Accordion>

  <Accordion title="کجا ببینم در آخرین نسخه چه چیز تازه‌ای هست؟">
    changelog در GitHub را بررسی کنید:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    تازه‌ترین ورودی‌ها در بالا هستند. اگر بخش بالایی با **Unreleased** علامت‌گذاری شده باشد، بخش تاریخ‌دار بعدی
    آخرین نسخه منتشرشده است. ورودی‌ها بر اساس **نکات برجسته**، **تغییرات**، و
    **رفع‌ها** گروه‌بندی می‌شوند (به‌علاوه بخش‌های مستندات/دیگر در صورت نیاز).

  </Accordion>

  <Accordion title="دسترسی به docs.openclaw.ai ممکن نیست (خطای SSL)">
    برخی اتصال‌های Comcast/Xfinity به‌اشتباه `docs.openclaw.ai` را از طریق Xfinity
    Advanced Security مسدود می‌کنند. آن را غیرفعال کنید یا `docs.openclaw.ai` را در فهرست مجاز بگذارید، سپس دوباره تلاش کنید.
    لطفاً با گزارش در اینجا به ما کمک کنید آن را از مسدودی خارج کنیم: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    اگر همچنان نمی‌توانید به سایت دسترسی پیدا کنید، مستندات در GitHub آینه شده‌اند:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="تفاوت بین پایدار و بتا">
    **پایدار** و **بتا**، **npm dist-tags** هستند، نه خط‌های کد جداگانه:

    - `latest` = پایدار
    - `beta` = بیلد اولیه برای آزمایش

    معمولاً یک انتشار پایدار ابتدا روی **beta** قرار می‌گیرد، سپس یک مرحله‌ی
    ارتقای صریح همان نسخه را به `latest` منتقل می‌کند. نگه‌دارندگان همچنین می‌توانند
    در صورت نیاز مستقیماً روی `latest` منتشر کنند. به همین دلیل beta و پایدار می‌توانند
    پس از ارتقا به **یک نسخه** اشاره کنند.

    ببینید چه چیزهایی تغییر کرده است:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    برای دستورهای نصب یک‌خطی و تفاوت بین beta و dev، آکاردئون زیر را ببینید.

  </Accordion>

  <Accordion title="چگونه نسخه‌ی بتا را نصب کنم و تفاوت بین beta و dev چیست؟">
    **Beta** همان npm dist-tag با نام `beta` است (ممکن است پس از ارتقا با `latest` یکی باشد).
    **Dev** سر متحرک `main` (git) است؛ وقتی منتشر شود، از npm dist-tag با نام `dev` استفاده می‌کند.

    دستورهای یک‌خطی (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    نصب‌کننده‌ی Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    جزئیات بیشتر: [کانال‌های توسعه](/fa/install/development-channels) و [پرچم‌های نصب‌کننده](/fa/install/installer).

  </Accordion>

  <Accordion title="چگونه آخرین بیت‌ها را امتحان کنم؟">
    دو گزینه:

    1. **کانال Dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    این کار به شاخه‌ی `main` سوییچ می‌کند و از سورس به‌روزرسانی می‌کند.

    2. **نصب قابل‌هک (از سایت نصب‌کننده):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    این کار یک ریپوی محلی به شما می‌دهد که می‌توانید آن را ویرایش کنید، سپس از طریق git به‌روزرسانی کنید.

    اگر ترجیح می‌دهید دستی یک کلون تمیز داشته باشید، استفاده کنید از:

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
    - **راه‌اندازی اولیه:** ۵ تا ۱۵ دقیقه، بسته به اینکه چند کانال/مدل را پیکربندی می‌کنید

    اگر گیر کرد، از [گیر کردن نصب‌کننده](#quick-start-and-first-run-setup)
    و حلقه‌ی اشکال‌زدایی سریع در [گیر کرده‌ام](#quick-start-and-first-run-setup) استفاده کنید.

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

  <Accordion title="نصب Windows می‌گوید git پیدا نشد یا openclaw شناسایی نشد">
    دو مشکل رایج در Windows:

    **1) خطای npm با spawn git / پیدا نشدن git**

    - **Git for Windows** را نصب کنید و مطمئن شوید `git` در PATH شما قرار دارد.
    - PowerShell را ببندید و دوباره باز کنید، سپس نصب‌کننده را دوباره اجرا کنید.

    **2) پس از نصب، openclaw شناسایی نمی‌شود**

    - پوشه‌ی bin سراسری npm شما در PATH نیست.
    - مسیر را بررسی کنید:

      ```powershell
      npm config get prefix
      ```

    - آن دایرکتوری را به PATH کاربر خود اضافه کنید (در Windows به پسوند `\bin` نیازی نیست؛ در بیشتر سیستم‌ها `%AppData%\npm` است).
    - پس از به‌روزرسانی PATH، PowerShell را ببندید و دوباره باز کنید.

    برای راه‌اندازی دسکتاپ، از برنامه‌ی بومی **Windows Hub** استفاده کنید. برای راه‌اندازی فقط ترمینالی،
    هم مسیرهای نصب‌کننده‌ی PowerShell و هم WSL2 Gateway پشتیبانی می‌شوند.
    مستندات: [Windows](/fa/platforms/windows).

  </Accordion>

  <Accordion title="خروجی exec در Windows متن چینی درهم‌ریخته نشان می‌دهد - چه کار کنم؟">
    این معمولاً یک ناهماهنگی صفحه‌کد کنسول در شل‌های بومی Windows است.

    نشانه‌ها:

    - خروجی `system.run`/`exec` متن چینی را به‌صورت mojibake نمایش می‌دهد
    - همان فرمان در یک پروفایل ترمینال دیگر درست به نظر می‌رسد

    راه‌حل سریع در PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    سپس Gateway را راه‌اندازی مجدد کنید و فرمان خود را دوباره امتحان کنید:

    ```powershell
    openclaw gateway restart
    ```

    اگر همچنان این مورد را روی آخرین OpenClaw بازتولید می‌کنید، آن را اینجا پیگیری/گزارش کنید:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="مستندات به پرسش من پاسخ نداد - چگونه پاسخ بهتری بگیرم؟">
    از **نصب قابل‌هک (git)** استفاده کنید تا سورس کامل و مستندات را به‌صورت محلی داشته باشید، سپس از
    ربات خود (یا Claude/Codex) _از همان پوشه_ بپرسید تا بتواند ریپو را بخواند و دقیق پاسخ دهد.

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

  <Accordion title="راهنماهای نصب ابری/VPS کجا هستند؟">
    ما یک **هاب میزبانی** با ارائه‌دهندگان رایج نگه می‌داریم. یکی را انتخاب کنید و راهنما را دنبال کنید:

    - [میزبانی VPS](/fa/vps) (همه‌ی ارائه‌دهندگان در یک مکان)
    - [Fly.io](/fa/install/fly)
    - [Hetzner](/fa/install/hetzner)
    - [exe.dev](/fa/install/exe-dev)

    نحوه‌ی کار در ابر: **Gateway روی سرور اجرا می‌شود**، و شما از لپ‌تاپ/تلفن خود
    از طریق Control UI (یا Tailscale/SSH) به آن دسترسی دارید. وضعیت + فضای کاری شما
    روی سرور قرار دارند، پس میزبان را منبع حقیقت در نظر بگیرید و از آن پشتیبان بگیرید.

    می‌توانید **گره‌ها** (Mac/iOS/Android/headless) را با آن Gateway ابری جفت کنید تا به
    صفحه‌نمایش/دوربین/canvas محلی دسترسی داشته باشید یا در حالی که
    Gateway در ابر باقی می‌ماند، روی لپ‌تاپ خود فرمان اجرا کنید.

    هاب: [پلتفرم‌ها](/fa/platforms). دسترسی از راه دور: [Gateway از راه دور](/fa/gateway/remote).
    گره‌ها: [گره‌ها](/fa/nodes)، [CLI گره‌ها](/fa/cli/nodes).

  </Accordion>

  <Accordion title="آیا می‌توانم از OpenClaw بخواهم خودش را به‌روزرسانی کند؟">
    پاسخ کوتاه: **ممکن است، توصیه نمی‌شود**. جریان به‌روزرسانی می‌تواند Gateway را راه‌اندازی مجدد کند
    (که نشست فعال را قطع می‌کند)، ممکن است به یک git checkout تمیز نیاز داشته باشد، و
    می‌تواند درخواست تأیید کند. امن‌تر: به‌روزرسانی‌ها را به‌عنوان اپراتور از یک شل اجرا کنید.

    از CLI استفاده کنید:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    اگر ناچارید از یک agent خودکار کنید:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    مستندات: [به‌روزرسانی](/fa/cli/update)، [به‌روزرسانی](/fa/install/updating).

  </Accordion>

  <Accordion title="راه‌اندازی اولیه دقیقاً چه کاری انجام می‌دهد؟">
    `openclaw onboard` مسیر راه‌اندازی پیشنهادی است. در **حالت محلی** شما را در این موارد راهنمایی می‌کند:

    - **راه‌اندازی مدل/احراز هویت** (provider OAuth، کلیدهای API، setup-token مربوط به Anthropic، به‌علاوه گزینه‌های مدل محلی مانند LM Studio)
    - مکان **فضای کاری** + فایل‌های بوت‌استرپ
    - **تنظیمات Gateway** (bind/port/auth/tailscale)
    - **کانال‌ها** (WhatsApp، Telegram، Discord، Mattermost، Signal، iMessage، به‌علاوه Pluginهای کانال همراه مانند QQ Bot)
    - **نصب daemon** (LaunchAgent در macOS؛ واحد کاربر systemd در Linux/WSL2)
    - **بررسی‌های سلامت** و انتخاب **skills**

    همچنین اگر مدل پیکربندی‌شده‌ی شما ناشناخته باشد یا احراز هویت نداشته باشد، هشدار می‌دهد.

  </Accordion>

  <Accordion title="آیا برای اجرای این به اشتراک Claude یا OpenAI نیاز دارم؟">
    خیر. می‌توانید OpenClaw را با **کلیدهای API** (Anthropic/OpenAI/دیگران) یا با
    **مدل‌های فقط محلی** اجرا کنید تا داده‌های شما روی دستگاهتان بماند. اشتراک‌ها (Claude
    Pro/Max یا OpenAI Codex) راه‌های اختیاری برای احراز هویت این providerها هستند.

    برای Anthropic در OpenClaw، تقسیم‌بندی عملی این است:

    - **کلید API Anthropic**: صورتحساب عادی Anthropic API
    - **احراز هویت Claude CLI / اشتراک Claude در OpenClaw**: کارکنان Anthropic
      به ما گفتند این استفاده دوباره مجاز است، و OpenClaw استفاده از `claude -p`
      را برای این یکپارچه‌سازی مجاز تلقی می‌کند، مگر اینکه Anthropic یک
      سیاست جدید منتشر کند

    برای میزبان‌های Gateway بلندمدت، کلیدهای API Anthropic همچنان
    راه‌اندازی قابل‌پیش‌بینی‌تری هستند. OpenAI Codex OAuth به‌طور صریح برای ابزارهای خارجی
    مانند OpenClaw پشتیبانی می‌شود.

    OpenClaw همچنین از گزینه‌های میزبانی‌شده‌ی دیگر با سبک اشتراک پشتیبانی می‌کند، از جمله
    **Qwen Cloud Coding Plan**، **MiniMax Coding Plan**، و
    **Z.AI / GLM Coding Plan**.

    مستندات: [Anthropic](/fa/providers/anthropic)، [OpenAI](/fa/providers/openai)،
    [Qwen Cloud](/fa/providers/qwen)،
    [MiniMax](/fa/providers/minimax)، [Z.AI (GLM)](/fa/providers/zai)،
    [مدل‌های محلی](/fa/gateway/local-models)، [مدل‌ها](/fa/concepts/models).

  </Accordion>

  <Accordion title="آیا می‌توانم بدون کلید API از اشتراک Claude Max استفاده کنم؟">
    بله.

    کارکنان Anthropic به ما گفتند استفاده از Claude CLI به سبک OpenClaw دوباره مجاز است، بنابراین
    OpenClaw احراز هویت اشتراک Claude و استفاده از `claude -p` را
    برای این یکپارچه‌سازی مجاز تلقی می‌کند، مگر اینکه Anthropic یک سیاست جدید منتشر کند. اگر
    قابل‌پیش‌بینی‌ترین راه‌اندازی سمت سرور را می‌خواهید، به‌جای آن از کلید API Anthropic استفاده کنید.

  </Accordion>

  <Accordion title="آیا از احراز هویت اشتراک Claude (Claude Pro یا Max) پشتیبانی می‌کنید؟">
    بله.

    کارکنان Anthropic به ما گفتند این استفاده دوباره مجاز است، بنابراین OpenClaw استفاده‌ی مجدد از
    Claude CLI و استفاده از `claude -p` را برای این یکپارچه‌سازی مجاز تلقی می‌کند
    مگر اینکه Anthropic یک سیاست جدید منتشر کند.

    setup-token مربوط به Anthropic همچنان به‌عنوان مسیر توکن پشتیبانی‌شده‌ی OpenClaw در دسترس است، اما OpenClaw اکنون در صورت امکان استفاده‌ی مجدد از Claude CLI و `claude -p` را ترجیح می‌دهد.
    برای بارهای کاری تولیدی یا چندکاربره، احراز هویت با کلید API Anthropic همچنان
    انتخاب امن‌تر و قابل‌پیش‌بینی‌تری است. اگر گزینه‌های میزبانی‌شده‌ی دیگری با سبک اشتراک
    در OpenClaw می‌خواهید، [OpenAI](/fa/providers/openai)، [Qwen / Model
    Cloud](/fa/providers/qwen)، [MiniMax](/fa/providers/minimax)، و [GLM
    Models](/fa/providers/zai) را ببینید.

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="چرا HTTP 429 rate_limit_error از Anthropic می‌بینم؟">
    این یعنی **سهمیه/محدودیت نرخ Anthropic** شما برای پنجره‌ی فعلی تمام شده است. اگر از
    **Claude CLI** استفاده می‌کنید، منتظر بمانید تا پنجره بازنشانی شود یا پلن خود را ارتقا دهید. اگر از
    **کلید API Anthropic** استفاده می‌کنید، Anthropic Console
    را برای مصرف/صورتحساب بررسی کنید و در صورت نیاز محدودیت‌ها را افزایش دهید.

    اگر پیام دقیقاً این باشد:
    `Extra usage is required for long context requests`، درخواست در حال تلاش برای استفاده از
    پنجرهٔ زمینهٔ ۱M متعلق به Anthropic است (یک مدل Claude 4.x با قابلیت GA برای ۱M یا پیکربندی قدیمی
    `context1m: true`). این فقط زمانی کار می‌کند که اعتبارنامهٔ شما برای
    صورت‌حساب زمینهٔ طولانی واجد شرایط باشد (صورت‌حساب کلید API یا مسیر ورود Claude در OpenClaw
    با Extra Usage فعال).

    نکته: یک **مدل جایگزین** تنظیم کنید تا OpenClaw بتواند زمانی که یک ارائه‌دهنده با محدودیت نرخ مواجه است همچنان پاسخ دهد.
    [مدل‌ها](/fa/cli/models)، [OAuth](/fa/concepts/oauth)، و
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/fa/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) را ببینید.

  </Accordion>

  <Accordion title="آیا AWS Bedrock پشتیبانی می‌شود؟">
    بله. OpenClaw یک ارائه‌دهندهٔ **Amazon Bedrock (Converse)** همراه دارد. وقتی نشانگرهای env مربوط به AWS حاضر باشند، OpenClaw می‌تواند کاتالوگ جریانی/متنی Bedrock را به‌صورت خودکار کشف کند و آن را به‌عنوان یک ارائه‌دهندهٔ ضمنی `amazon-bedrock` ادغام کند؛ در غیر این صورت می‌توانید `plugins.entries.amazon-bedrock.config.discovery.enabled` را به‌صراحت فعال کنید یا یک ورودی ارائه‌دهندهٔ دستی اضافه کنید. [Amazon Bedrock](/fa/providers/bedrock) و [ارائه‌دهندگان مدل](/fa/providers/models) را ببینید. اگر جریان کلید مدیریت‌شده را ترجیح می‌دهید، یک پراکسی سازگار با OpenAI در جلوی Bedrock همچنان گزینه‌ای معتبر است.
  </Accordion>

  <Accordion title="احراز هویت Codex چگونه کار می‌کند؟">
    OpenClaw از **OpenAI Code (Codex)** از طریق OAuth (ورود با ChatGPT) پشتیبانی می‌کند. برای راه‌اندازی رایج از
    `openai/gpt-5.5` استفاده کنید: احراز هویت اشتراک ChatGPT/Codex به‌همراه
    اجرای بومی app-server مربوط به Codex. ارجاع‌های قدیمی Codex GPT
    پیکربندی قدیمی هستند که با `openclaw doctor --fix` ترمیم می‌شوند. دسترسی مستقیم با کلید API مربوط به OpenAI
    همچنان برای سطوح API غیرعاملی OpenAI و برای مدل‌های عاملی
    از طریق یک پروفایل کلید API مرتب‌شدهٔ `openai` در دسترس است.
    [ارائه‌دهندگان مدل](/fa/concepts/model-providers) و [راه‌اندازی اولیه (CLI)](/fa/start/wizard) را ببینید.
  </Accordion>

  <Accordion title="چرا OpenClaw هنوز پیشوند قدیمی OpenAI Codex را ذکر می‌کند؟">
    `openai` شناسهٔ ارائه‌دهنده و پروفایل احراز هویت برای هم کلیدهای API مربوط به OpenAI و هم
    OAuth مربوط به ChatGPT/Codex است. ممکن است هنوز پیشوند قدیمی OpenAI Codex را در پیکربندی قدیمی و
    هشدارهای مهاجرت ببینید.
    پیکربندی‌های قدیمی‌تر همچنین از آن به‌عنوان پیشوند مدل استفاده می‌کردند:

    - `openai/gpt-5.5` = احراز هویت اشتراک ChatGPT/Codex با زمان‌اجرای بومی Codex برای نوبت‌های عامل
    - ارجاع قدیمی Codex GPT-5.5 = مسیر مدل قدیمی که با `openclaw doctor --fix` ترمیم می‌شود
    - `openai/gpt-5.5` به‌همراه یک پروفایل کلید API مرتب‌شدهٔ `openai` = احراز هویت کلید API برای یک مدل عامل OpenAI
    - شناسه‌های پروفایل احراز هویت قدیمی Codex = شناسهٔ پروفایل احراز هویت قدیمی که با `openclaw doctor --fix` مهاجرت داده می‌شود

    اگر مسیر مستقیم صورت‌حساب/محدودیت OpenAI Platform را می‌خواهید،
    `OPENAI_API_KEY` را تنظیم کنید. اگر احراز هویت اشتراک ChatGPT/Codex را می‌خواهید، با
    `openclaw models auth login --provider openai` وارد شوید. ارجاع مدل را به‌صورت
    `openai/gpt-5.5` نگه دارید؛ ارجاع‌های مدل قدیمی Codex پیکربندی قدیمی هستند که
    `openclaw doctor --fix` بازنویسی می‌کند.

  </Accordion>

  <Accordion title="چرا محدودیت‌های OAuth مربوط به Codex می‌تواند با وب ChatGPT فرق داشته باشد؟">
    OAuth مربوط به Codex از پنجره‌های سهمیهٔ مدیریت‌شده توسط OpenAI و وابسته به طرح استفاده می‌کند. در عمل،
    این محدودیت‌ها می‌توانند با تجربهٔ وب‌سایت/برنامهٔ ChatGPT متفاوت باشند، حتی وقتی
    هر دو به یک حساب وصل هستند.

    OpenClaw می‌تواند پنجره‌های مصرف/سهمیهٔ ارائه‌دهنده را که در حال حاضر قابل مشاهده‌اند در
    `openclaw models status` نشان دهد، اما امتیازهای ChatGPT-web را ابداع یا عادی‌سازی نمی‌کند
    تا به دسترسی مستقیم API تبدیل شوند. اگر مسیر مستقیم صورت‌حساب/محدودیت OpenAI Platform را می‌خواهید، از `openai/*` با یک کلید API استفاده کنید.

  </Accordion>

  <Accordion title="آیا از احراز هویت اشتراک OpenAI (Codex OAuth) پشتیبانی می‌کنید؟">
    بله. OpenClaw به‌طور کامل از **OAuth اشتراک OpenAI Code (Codex)** پشتیبانی می‌کند.
    OpenAI به‌صراحت استفاده از OAuth اشتراک را در ابزارها/گردش‌کارهای خارجی
    مانند OpenClaw مجاز می‌داند. راه‌اندازی اولیه می‌تواند جریان OAuth را برای شما اجرا کند.

    [OAuth](/fa/concepts/oauth)، [ارائه‌دهندگان مدل](/fa/concepts/model-providers)، و [راه‌اندازی اولیه (CLI)](/fa/start/wizard) را ببینید.

  </Accordion>

  <Accordion title="چگونه OAuth مربوط به Gemini CLI را راه‌اندازی کنم؟">
    Gemini CLI از یک **جریان احراز هویت Plugin** استفاده می‌کند، نه شناسهٔ کلاینت یا راز در `openclaw.json`.

    مراحل:

    1. Gemini CLI را به‌صورت محلی نصب کنید تا `gemini` در `PATH` باشد
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin را فعال کنید: `openclaw plugins enable google`
    3. وارد شوید: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. مدل پیش‌فرض پس از ورود: `google-gemini-cli/gemini-3-flash-preview`
    5. اگر درخواست‌ها شکست خوردند، `GOOGLE_CLOUD_PROJECT` یا `GOOGLE_CLOUD_PROJECT_ID` را روی میزبان Gateway تنظیم کنید

    این کار توکن‌های OAuth را در پروفایل‌های احراز هویت روی میزبان Gateway ذخیره می‌کند. جزئیات: [ارائه‌دهندگان مدل](/fa/concepts/model-providers).

  </Accordion>

  <Accordion title="آیا یک مدل محلی برای چت‌های معمولی مناسب است؟">
    معمولاً نه. OpenClaw به زمینهٔ بزرگ + ایمنی قوی نیاز دارد؛ کارت‌های کوچک قطع می‌شوند و نشت می‌کنند. اگر مجبورید، **بزرگ‌ترین** ساخت مدل را که می‌توانید به‌صورت محلی اجرا کنید (LM Studio) اجرا کنید و [/gateway/local-models](/fa/gateway/local-models) را ببینید. مدل‌های کوچک‌تر/کوانتیزه‌شده خطر تزریق پرامپت را افزایش می‌دهند - [امنیت](/fa/gateway/security) را ببینید.
  </Accordion>

  <Accordion title="چگونه ترافیک مدل میزبانی‌شده را در یک منطقهٔ مشخص نگه دارم؟">
    نقطه‌های پایانی محدود به منطقه را انتخاب کنید. OpenRouter گزینه‌های میزبانی‌شده در آمریکا را برای MiniMax، Kimi، و GLM ارائه می‌کند؛ نوع میزبانی‌شده در آمریکا را انتخاب کنید تا داده در همان منطقه بماند. همچنان می‌توانید Anthropic/OpenAI را در کنار این‌ها فهرست کنید؛ با استفاده از `models.mode: "merge"` تا جایگزین‌ها در دسترس بمانند و هم‌زمان ارائه‌دهندهٔ منطقه‌ای انتخاب‌شده رعایت شود.
  </Accordion>

  <Accordion title="آیا برای نصب این باید یک Mac Mini بخرم؟">
    نه. OpenClaw روی macOS یا Linux اجرا می‌شود (Windows از طریق WSL2). Mac mini اختیاری است - بعضی افراد
    یکی را به‌عنوان میزبان همیشه‌روشن می‌خرند، اما یک VPS کوچک، سرور خانگی، یا دستگاهی در ردهٔ Raspberry Pi هم کار می‌کند.

    فقط برای **ابزارهای مخصوص macOS** به Mac نیاز دارید. برای iMessage، از [iMessage](/fa/channels/imessage) با `imsg` روی هر Mac که وارد Messages شده است استفاده کنید. اگر Gateway روی Linux یا جای دیگری اجرا می‌شود، `channels.imessage.cliPath` را روی یک پوشش SSH تنظیم کنید که `imsg` را روی آن Mac اجرا می‌کند. اگر ابزارهای مخصوص macOS دیگری می‌خواهید، Gateway را روی Mac اجرا کنید یا یک Node macOS را جفت کنید.

    مستندات: [iMessage](/fa/channels/imessage)، [Nodeها](/fa/nodes)، [حالت راه‌دور Mac](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="آیا برای پشتیبانی iMessage به Mac mini نیاز دارم؟">
    به **نوعی دستگاه macOS** نیاز دارید که وارد Messages شده باشد. لازم **نیست** Mac mini باشد -
    هر Mac کار می‌کند. **از [iMessage](/fa/channels/imessage)** با `imsg` استفاده کنید؛ Gateway می‌تواند روی همان Mac اجرا شود، یا می‌تواند با یک پوشش SSH در `cliPath` جای دیگری اجرا شود.

    راه‌اندازی‌های رایج:

    - Gateway را روی Linux/VPS اجرا کنید، و `channels.imessage.cliPath` را روی یک پوشش SSH تنظیم کنید که `imsg` را روی یک Mac واردشده به Messages اجرا می‌کند.
    - اگر ساده‌ترین راه‌اندازی تک‌ماشینه را می‌خواهید، همه چیز را روی Mac اجرا کنید.

    مستندات: [iMessage](/fa/channels/imessage)، [Nodeها](/fa/nodes)،
    [حالت راه‌دور Mac](/fa/platforms/mac/remote).

  </Accordion>

  <Accordion title="اگر برای اجرای OpenClaw یک Mac mini بخرم، می‌توانم آن را به MacBook Pro خود وصل کنم؟">
    بله. **Mac mini می‌تواند Gateway را اجرا کند**، و MacBook Pro شما می‌تواند به‌عنوان یک
    **Node** (دستگاه همراه) وصل شود. Nodeها Gateway را اجرا نمی‌کنند - آن‌ها قابلیت‌های اضافی
    مانند صفحه‌نمایش/دوربین/بوم و `system.run` را روی همان دستگاه فراهم می‌کنند.

    الگوی رایج:

    - Gateway روی Mac mini (همیشه‌روشن).
    - MacBook Pro برنامهٔ macOS یا یک میزبان Node را اجرا می‌کند و با Gateway جفت می‌شود.
    - برای دیدن آن از `openclaw nodes status` / `openclaw nodes list` استفاده کنید.

    مستندات: [Nodeها](/fa/nodes)، [CLI مربوط به Nodeها](/fa/cli/nodes).

  </Accordion>

  <Accordion title="آیا می‌توانم از Bun استفاده کنم؟">
    Bun **توصیه نمی‌شود**. ما باگ‌های زمان‌اجرا می‌بینیم، به‌خصوص با WhatsApp و Telegram.
    برای Gatewayهای پایدار از **Node** استفاده کنید.

    اگر همچنان می‌خواهید Bun را آزمایش کنید، این کار را روی یک Gateway غیرتولیدی
    بدون WhatsApp/Telegram انجام دهید.

  </Accordion>

  <Accordion title="Telegram: چه چیزی در allowFrom قرار می‌گیرد؟">
    `channels.telegram.allowFrom` **شناسهٔ کاربر Telegram فرستندهٔ انسانی** است (عددی). نام کاربری ربات نیست.

    راه‌اندازی فقط شناسه‌های کاربر عددی را می‌پرسد. اگر از قبل ورودی‌های قدیمی `@username` در پیکربندی دارید، `openclaw doctor --fix` می‌تواند تلاش کند آن‌ها را حل کند.

    امن‌تر (بدون ربات شخص ثالث):

    - به ربات خود پیام مستقیم بدهید، سپس `openclaw logs --follow` را اجرا کنید و `from.id` را بخوانید.

    Bot API رسمی:

    - به ربات خود پیام مستقیم بدهید، سپس `https://api.telegram.org/bot<bot_token>/getUpdates` را فراخوانی کنید و `message.from.id` را بخوانید.

    شخص ثالث (کمتر خصوصی):

    - به `@userinfobot` یا `@getidsbot` پیام مستقیم بدهید.

    [/channels/telegram](/fa/channels/telegram#access-control-and-activation) را ببینید.

  </Accordion>

  <Accordion title="آیا چند نفر می‌توانند از یک شمارهٔ WhatsApp با نمونه‌های مختلف OpenClaw استفاده کنند؟">
    بله، از طریق **مسیریابی چندعاملی**. **DM** مربوط به WhatsApp هر فرستنده را (همتای `kind: "direct"`، فرستندهٔ E.164 مانند `+15551234567`) به یک `agentId` متفاوت متصل کنید تا هر شخص فضای کاری و ذخیرهٔ نشست خودش را داشته باشد. پاسخ‌ها همچنان از **همان حساب WhatsApp** می‌آیند، و کنترل دسترسی DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) برای هر حساب WhatsApp سراسری است. [مسیریابی چندعاملی](/fa/concepts/multi-agent) و [WhatsApp](/fa/channels/whatsapp) را ببینید.
  </Accordion>

  <Accordion title='آیا می‌توانم یک عامل «چت سریع» و یک عامل «Opus برای کدنویسی» اجرا کنم؟'>
    بله. از مسیریابی چندعاملی استفاده کنید: به هر عامل مدل پیش‌فرض خودش را بدهید، سپس مسیرهای ورودی (حساب ارائه‌دهنده یا همتاهای مشخص) را به هر عامل متصل کنید. پیکربندی نمونه در [مسیریابی چندعاملی](/fa/concepts/multi-agent) قرار دارد. همچنین [مدل‌ها](/fa/concepts/models) و [پیکربندی](/fa/gateway/configuration) را ببینید.
  </Accordion>

  <Accordion title="آیا Homebrew روی Linux کار می‌کند؟">
    بله. Homebrew از Linux (Linuxbrew) پشتیبانی می‌کند. راه‌اندازی سریع:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    اگر OpenClaw را از طریق systemd اجرا می‌کنید، مطمئن شوید PATH سرویس شامل `/home/linuxbrew/.linuxbrew/bin` (یا پیشوند brew شما) باشد تا ابزارهای نصب‌شده با `brew` در شل‌های غیرورودی قابل حل باشند.
    ساخت‌های اخیر همچنین دایرکتوری‌های bin رایج کاربر را در سرویس‌های systemd روی Linux در ابتدای مسیر قرار می‌دهند (برای مثال `~/.local/bin`، `~/.npm-global/bin`، `~/.local/share/pnpm`، `~/.bun/bin`) و وقتی `PNPM_HOME`، `NPM_CONFIG_PREFIX`، `BUN_INSTALL`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `NVM_DIR`، و `FNM_DIR` تنظیم شده باشند آن‌ها را رعایت می‌کنند.

  </Accordion>

  <Accordion title="تفاوت بین نصب git قابل هک و نصب npm">
    - **نصب قابل هک (git):** checkout کامل منبع، قابل ویرایش، بهترین گزینه برای مشارکت‌کنندگان.
      شما buildها را به‌صورت محلی اجرا می‌کنید و می‌توانید کد/مستندات را patch کنید.
    - **نصب npm:** نصب CLI سراسری، بدون repo، بهترین گزینه برای «فقط اجرا کن».
      به‌روزرسانی‌ها از dist-tagهای npm می‌آیند.

    مستندات: [شروع به کار](/fa/start/getting-started)، [به‌روزرسانی](/fa/install/updating).

  </Accordion>

  <Accordion title="آیا می‌توانم بعداً بین نصب‌های npm و git جابه‌جا شوم؟">
    بله. وقتی OpenClaw از قبل نصب شده است از `openclaw update --channel ...` استفاده کنید.
    این کار **داده‌های شما را حذف نمی‌کند** - فقط نصب کد OpenClaw را تغییر می‌دهد.
    وضعیت شما (`~/.openclaw`) و فضای کاری (`~/.openclaw/workspace`) دست‌نخورده می‌مانند.

    از npm به git:

    ```bash
    openclaw update --channel dev
    ```

    از git به npm:

    ```bash
    openclaw update --channel stable
    ```

    برای پیش‌نمایش تغییر حالت برنامه‌ریزی‌شده ابتدا `--dry-run` را اضافه کنید. به‌روزرساننده پیگیری‌های
    Doctor را اجرا می‌کند، منابع Plugin را برای کانال هدف تازه‌سازی می‌کند، و
    Gateway را بازراه‌اندازی می‌کند مگر اینکه `--no-restart` را پاس بدهید.

    نصب‌کننده هم می‌تواند هرکدام از حالت‌ها را اجباری کند:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    نکات پشتیبان‌گیری: [راهبرد پشتیبان‌گیری](/fa/help/faq#where-things-live-on-disk) را ببینید.

  </Accordion>

  <Accordion title="آیا باید Gateway را روی لپ‌تاپم اجرا کنم یا روی یک VPS؟">
    پاسخ کوتاه: **اگر اطمینان‌پذیری ۲۴/۷ می‌خواهید، از VPS استفاده کنید**. اگر کمترین اصطکاک را می‌خواهید و با خواب/راه‌اندازی مجدد مشکلی ندارید، آن را محلی اجرا کنید.

    **لپ‌تاپ (Gateway محلی)**

    - **مزایا:** بدون هزینه سرور، دسترسی مستقیم به فایل‌های محلی، پنجره مرورگر زنده.
    - **معایب:** خواب/قطع شبکه = قطع اتصال، به‌روزرسانی‌ها/راه‌اندازی مجدد سیستم‌عامل وقفه ایجاد می‌کند، باید بیدار بماند.

    **VPS / ابر**

    - **مزایا:** همیشه روشن، شبکه پایدار، بدون مشکل خواب لپ‌تاپ، نگه‌داری آسان‌تر در حالت اجرا.
    - **معایب:** اغلب بدون نمایشگر اجرا می‌شود (از اسکرین‌شات استفاده کنید)، فقط دسترسی فایل از راه دور، برای به‌روزرسانی‌ها باید SSH کنید.

    **نکته ویژه OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord همگی از روی VPS به‌خوبی کار می‌کنند. تنها مصالحه واقعی **مرورگر بدون نمایشگر** در برابر پنجره قابل مشاهده است. [مرورگر](/fa/tools/browser) را ببینید.

    **پیش‌فرض پیشنهادی:** اگر قبلا قطع اتصال Gateway داشته‌اید، VPS. اجرای محلی زمانی عالی است که فعالانه از Mac استفاده می‌کنید و دسترسی به فایل‌های محلی یا خودکارسازی UI با مرورگر قابل مشاهده می‌خواهید.

  </Accordion>

  <Accordion title="اجرای OpenClaw روی یک ماشین اختصاصی چقدر مهم است؟">
    الزامی نیست، اما **برای اطمینان‌پذیری و جداسازی توصیه می‌شود**.

    - **میزبان اختصاصی (VPS/Mac mini/Raspberry Pi):** همیشه روشن، وقفه‌های کمتر ناشی از خواب/راه‌اندازی مجدد، مجوزهای تمیزتر، نگه‌داری آسان‌تر در حالت اجرا.
    - **لپ‌تاپ/دسکتاپ مشترک:** برای آزمایش و استفاده فعال کاملا مناسب است، اما وقتی ماشین به خواب می‌رود یا به‌روزرسانی می‌شود، انتظار مکث داشته باشید.

    اگر بهترین حالت هر دو دنیا را می‌خواهید، Gateway را روی یک میزبان اختصاصی نگه دارید و لپ‌تاپتان را به‌عنوان یک **نود** برای ابزارهای صفحه‌نمایش/دوربین/اجرا جفت کنید. [نودها](/fa/nodes) را ببینید.
    برای راهنمایی امنیتی، [امنیت](/fa/gateway/security) را بخوانید.

  </Accordion>

  <Accordion title="حداقل نیازمندی‌های VPS و سیستم‌عامل پیشنهادی چیست؟">
    OpenClaw سبک است. برای یک Gateway پایه + یک کانال چت:

    - **حداقل مطلق:** ۱ vCPU، ۱GB RAM، حدود ۵۰۰MB دیسک.
    - **پیشنهادی:** ۱ تا ۲ vCPU، ۲GB RAM یا بیشتر برای فضای تنفس (لاگ‌ها، رسانه، چند کانال). ابزارهای Node و خودکارسازی مرورگر می‌توانند منابع زیادی مصرف کنند.

    سیستم‌عامل: از **Ubuntu LTS** (یا هر Debian/Ubuntu مدرن) استفاده کنید. مسیر نصب Linux آنجا بهتر آزمایش شده است.

    مستندات: [Linux](/fa/platforms/linux)، [میزبانی VPS](/fa/vps).

  </Accordion>

  <Accordion title="آیا می‌توانم OpenClaw را در VM اجرا کنم و نیازمندی‌ها چیست؟">
    بله. با VM همانند VPS برخورد کنید: باید همیشه روشن، قابل دسترسی، و دارای RAM کافی برای Gateway و هر کانالی باشد که فعال می‌کنید.

    راهنمای پایه:

    - **حداقل مطلق:** ۱ vCPU، ۱GB RAM.
    - **پیشنهادی:** اگر چند کانال، خودکارسازی مرورگر، یا ابزارهای رسانه اجرا می‌کنید، ۲GB RAM یا بیشتر.
    - **سیستم‌عامل:** Ubuntu LTS یا یک Debian/Ubuntu مدرن دیگر.

    اگر روی Windows هستید، برای راه‌اندازی دسکتاپ از **Windows Hub** استفاده کنید، یا وقتی مشخصا یک VM از نوع Gateway به سبک Linux با سازگاری گسترده ابزارها می‌خواهید، از WSL2 استفاده کنید. [Windows](/fa/platforms/windows)، [میزبانی VPS](/fa/vps) را ببینید.
    اگر macOS را در VM اجرا می‌کنید، [VM macOS](/fa/install/macos-vm) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [پرسش‌های متداول](/fa/help/faq) — پرسش‌های متداول اصلی (مدل‌ها، نشست‌ها، gateway، امنیت، موارد بیشتر)
- [نمای کلی نصب](/fa/install)
- [شروع به کار](/fa/start/getting-started)
- [عیب‌یابی](/fa/help/troubleshooting)
