---
summary: مرجع تفصیلی برای حوزه‌های محصول و بررسی‌های پشت کارت امتیاز بلوغ OpenClaw.
title: رده‌بندی بلوغ
x-i18n:
    generated_at: "2026-07-02T08:36:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de1212d026348cc64719475d636c0af3ab330f12d246b63697126f5011965124
    source_path: maturity/taxonomy.md
    workflow: 16
---

# رده‌بندی بلوغ

<div className="maturity-hero maturity-hero-compact">
  <p className="maturity-kicker">مدل پشت کارت امتیاز</p>
  <p className="maturity-hero-title">سطوح &gt; دسته‌ها &gt; قابلیت‌ها &gt; شواهد.</p>
  <p>50 سطح در 4 خانواده گروه‌بندی شده‌اند، و هر دسته به مستندات مرجع و شناسه‌های پوشش QA پیوند داده شده است.</p>
  <p className="maturity-jump-links"><a href="#product-areas">مرور حوزه‌های محصول</a> / <a href="#taxonomy-details">باز کردن رده‌بندی تفصیلی</a> / <a href="/fa/maturity/scorecard">مشاهده امتیازها</a></p>
</div>

## نحوه خواندن این صفحه

سطح، یک حوزه محصول مانند زمان اجرای Gateway، Discord، یا برنامه macOS است. هر سطح شامل دسته‌هاست، و هر دسته شامل بررسی‌های سطح قابلیت است که سناریوهای QA آن‌ها را پوشش می‌دهند. برای قضاوت در سطح انتشار از کارت امتیاز استفاده کنید؛ از این صفحه برای بررسی مدل زیربنایی آن استفاده کنید.

## سطوح بلوغ

<div className="maturity-level-list">
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>برنامه‌ریزی‌شده</span></span></span><span>جهت‌گیری مشخص است، اما هیچ مسیر کاربری پشتیبانی‌شده‌ای وجود ندارد.</span><span className="maturity-level-promotion">ارتقا: مسئله طراحی، مالک، و سطح هدف وجود دارند.</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>آزمایشی</span></span></span><span>پشت ملاحظات، پرچم‌ها، بیلدهای منبع، یا جریان‌های فقط مخصوص نگه‌دارنده پیاده‌سازی شده است.</span><span className="maturity-level-promotion">ارتقا: نگه‌دارنده می‌تواند سناریو را از main فعلی اجرا کند.</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span></span><span>کاربران واقعی می‌توانند آن را امتحان کنند، اما تغییرات شکننده و UX ناقص مورد انتظار است.</span><span className="maturity-level-promotion">ارتقا: راه‌اندازی مستند، آزمون‌های پایه، ملاحظات شناخته‌شده، و دست‌کم یک اثبات در محیط واقعی.</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span></span><span>مسیر عمومی وجود دارد و گردش‌کار اصلی با ملاحظات محدود قابل استفاده است.</span><span className="maturity-level-promotion">ارتقا: مستندات نصب/به‌روزرسانی، آزمون‌های رگرسیون، راهنمای اجرای پشتیبانی، و اثبات موفق سناریو در محیط مورد انتظار.</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>پایدار</span></span></span><span>مسیر توصیه‌شده برای کاربران عادی. خرابی‌ها به‌عنوان رگرسیون تلقی می‌شوند.</span><span className="maturity-level-promotion">ارتقا: گیت انتشار، مسیر doctor/عیب‌یابی، مستندات گسترده، و اثبات مکرر در دنیای واقعی.</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-clawesome"><span className="maturity-level-code">M5</span><span>Clawesome</span></span></span><span>پرداخت‌شده، دلپذیر، خوب ابزارگذاری‌شده، و رقابتی با بهترین گردش‌کار قابل مقایسه.</span><span className="maturity-level-promotion">ارتقا: پایدار، به‌علاوه قبولی کارت امتیاز کاربر در میان کاربران نماینده.</span></div>
</div>

## حوزه‌های محصول

<a id="product-areas" />

<Tabs>
  <Tab title="هسته">

    <a className="maturity-surface-link" href="#cli">
      <span className="maturity-surface-title">CLI</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>پایدار</span></span><span>7 حوزه - 90% کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#gateway-runtime">
      <span className="maturity-surface-title">زمان اجرای Gateway</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>پایدار</span></span><span>13 حوزه - 89% کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#agent-runtime">
      <span className="maturity-surface-title">زمان اجرای عامل</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>9 حوزه - 79% کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#session-memory-and-context-engine">
      <span className="maturity-surface-title">نشست، حافظه، و موتور زمینه</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>9 حوزه - 79% کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#channel-framework">
      <span className="maturity-surface-title">چارچوب کانال</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>8 حوزه - 79% کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#observability">
      <span className="maturity-surface-title">مشاهده‌پذیری</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>5 حوزه - 79% کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#gateway-web-app">
      <span className="maturity-surface-title">برنامه وب Gateway</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۶ حوزه - ۷۹٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#plugins">
      <span className="maturity-surface-title">Pluginها</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۹ حوزه - ۷۹٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#security-auth-pairing-and-secrets">
      <span className="maturity-surface-title">امنیت، احراز هویت، جفت‌سازی و اسرار</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۶ حوزه - ۷۹٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#automation-cron-hooks-tasks-polling">
      <span className="maturity-surface-title">اتوماسیون: Cron، هوک‌ها، وظیفه‌ها، نظرسنجی</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۶ حوزه - ۷۹٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#media-understanding-and-media-generation">
      <span className="maturity-surface-title">درک رسانه و تولید رسانه</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۶ حوزه - ۶۸٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#voice-and-realtime-talk">
      <span className="maturity-surface-title">صدا و گفت‌وگوی بلادرنگ</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۶ حوزه - ۶۸٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#tui">
      <span className="maturity-surface-title">TUI</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۵ حوزه - ۶۶٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#clawhub">
      <span className="maturity-surface-title">ClawHub</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۴ حوزه - ۶۲٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#openclaw-app-sdk">
      <span className="maturity-surface-title">SDK برنامه OpenClaw</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۶ حوزه - ۵۳٪ کامل</span></span>
    </a>

  </Tab>
  <Tab title="سکو">

    <a className="maturity-surface-link" href="#linux-gateway-host">
      <span className="maturity-surface-title">میزبان Gateway لینوکس</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>پایدار</span></span><span>۵ حوزه - ۸۹٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#macos-gateway-host">
      <span className="maturity-surface-title">میزبان Gateway در macOS</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>پایدار</span></span><span>۷ حوزه - ۸۸٪ کامل</span></span>
    </a>
    <a className="maturity-surface-link" href="#android-app">
      <span className="maturity-surface-title">برنامه Android</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>پایدار</span></span><span>۷ حوزه - ۸۰٪ کامل</span></span>
    </a>
    <a className="maturity-surface-link" href="#ios-app">
      <span className="maturity-surface-title">برنامه iOS</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>پایدار</span></span><span>۸ حوزه - ۸۰٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#docker-and-podman-hosting">
      <span className="maturity-surface-title">میزبانی Docker و Podman</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۴ حوزه - ۷۹٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#windows-via-wsl2">
      <span className="maturity-surface-title">Windows از طریق WSL2</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۶ حوزه - ۷۹٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#raspberry-pi-and-small-linux-devices">
      <span className="maturity-surface-title">Raspberry Pi و دستگاه‌های کوچک لینوکسی</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۴ حوزه - ۷۹٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#macos-companion-app">
      <span className="maturity-surface-title">برنامه همراه macOS</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۸ حوزه - ۷۸٪ کامل</span></span>
    </a>


    <a className="maturity-surface-link" href="#native-windows">
      <span className="maturity-surface-title">Windows بومی</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۴ حوزه - ۶۶٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#kubernetes-hosting">
      <span className="maturity-surface-title">میزبانی Kubernetes</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۴ حوزه - ۶۱٪ کامل</span></span>
    </a>


    <a className="maturity-surface-link" href="#nix-install-path">
      <span className="maturity-surface-title">مسیر نصب Nix</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>آزمایشی</span></span><span>۵ حوزه - ۴۴٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#watchos-companion-surfaces">
      <span className="maturity-surface-title">سطوح همراه watchOS</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>آزمایشی</span></span><span>۵ حوزه - ۴۴٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#linux-companion-app">
      <span className="maturity-surface-title">برنامه همراه Linux</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>برنامه‌ریزی‌شده</span></span><span>۵ حوزه - ۲۱٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#native-windows-companion-app">
      <span className="maturity-surface-title">برنامه همراه Windows بومی</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>برنامه‌ریزی‌شده</span></span><span>۵ حوزه - ۲۱٪ کامل</span></span>
    </a>

  </Tab>
  <Tab title="کانال">

    <a className="maturity-surface-link" href="#discord">
      <span className="maturity-surface-title">Discord</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>پایدار</span></span><span>۶ حوزه - ۸۷٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#telegram">
      <span className="maturity-surface-title">Telegram</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۵ حوزه - ۷۸٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#slack">
      <span className="maturity-surface-title">Slack</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۵ حوزه - ۷۸٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#imessage-and-bluebubbles">
      <span className="maturity-surface-title">iMessage و BlueBubbles</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۵ حوزه - ۷۸٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#whatsapp">
      <span className="maturity-surface-title">WhatsApp</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۵ حوزه - ۷۸٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#matrix">
      <span className="maturity-surface-title">Matrix</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۶ حوزه - ۶۷٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#google-chat">
      <span className="maturity-surface-title">Google Chat</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۵ حوزه - ۶۶٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#microsoft-teams">
      <span className="maturity-surface-title">Microsoft Teams</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۵ حوزه - ۶۶٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#signal">
      <span className="maturity-surface-title">Signal</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۵ حوزه - ۶۶٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels">
      <span className="maturity-surface-title">Feishu، QQ Bot، WeChat، Yuanbao، Zalo، Zalo Personal، کانال‌های منطقه‌ای</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۴ حوزه - ۵۸٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat">
      <span className="maturity-surface-title">Mattermost، LINE، IRC، Nextcloud Talk، Nostr، Twitch، Tlon، Synology Chat</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۴ حوزه - ۵۴٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#voice-call-channel">
      <span className="maturity-surface-title">کانال تماس صوتی</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>آزمایشی</span></span><span>۵ حوزه - ۴۴٪ کامل</span></span>
    </a>

  </Tab>
  <Tab title="ارائه‌دهنده و ابزار">

    <a className="maturity-surface-link" href="#browser-automation-exec-and-sandbox-tools">
      <span className="maturity-surface-title">ابزارهای خودکارسازی مرورگر، exec، و sandbox</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۳ حوزه - ۷۹٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#openai-and-codex-provider-path">
      <span className="maturity-surface-title">مسیر ارائه‌دهنده OpenAI و Codex</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۵ حوزه - ۷۹٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#web-search-tools">
      <span className="maturity-surface-title">ابزارهای جست‌وجوی وب</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۴ حوزه - ۷۹٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#anthropic-provider-path">
      <span className="maturity-surface-title">مسیر ارائه‌دهنده Anthropic</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۵ حوزه - ۷۸٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#google-provider-path">
      <span className="maturity-surface-title">مسیر ارائه‌دهنده Google</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۵ حوزه - ۷۸٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#openrouter-provider-path">
      <span className="maturity-surface-title">مسیر ارائه‌دهنده OpenRouter</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>بتا</span></span><span>۴ حوزه - ۷۸٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#image-video-and-music-generation-tools">
      <span className="maturity-surface-title">ابزارهای تولید تصویر، ویدئو، و موسیقی</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۵ حوزه - ۶۸٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#local-model-providers-ollama-vllm-sglang-lm-studio">
      <span className="maturity-surface-title">ارائه‌دهندگان مدل محلی: Ollama، vLLM، SGLang، LM Studio</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۵ حوزه - ۶۸٪ کامل</span></span>
    </a>

    <a className="maturity-surface-link" href="#long-tail-hosted-providers">
      <span className="maturity-surface-title">ارائه‌دهندگان میزبانی‌شده long-tail</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>آلفا</span></span><span>۳ حوزه - ۶۸٪ کامل</span></span>
    </a>

  </Tab>
</Tabs>

## جزئیات

<a id="taxonomy-details" />

### هسته

<AccordionGroup>
  <Accordion title="CLI - M4 پایدار - ۷ حوزه">
    <a id="cli" />

    مسیرهای عادی راه‌اندازی و ترمیم در مستندات نصب، CLI، و Gateway مستند شده‌اند. مسیرهای ویژه پلتفرم Windows در ردیف‌های Windows از طریق WSL2 و Windows بومی پیگیری می‌شوند.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - ۴٪</span><span>کیفیت پایدار - ۸۳٪</span><span>کامل‌بودن پایدار - ۹۰٪</span><span><span className="maturity-lts maturity-lts-partial">جزئی - ۶</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی CLI</span>
          <span>6 قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>17%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "17%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">[فهرست](/fa/install/index)، [نصب‌کننده](/fa/install/installer)، [Node](/fa/install/node)، [به‌روزرسانی](/fa/install/updating)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی ورود اولیه و احراز هویت</span>
          <span>5 قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[ورود اولیه](/fa/cli/onboard)، [پیکربندی](/fa/cli/configure)، [نمای کلی ورود اولیه](/fa/start/onboarding-overview)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی Plugin و کانال</span>
          <span>5 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[ورود اولیه](/fa/cli/onboard)، [Pluginها](/fa/cli/plugins)، [کانال‌ها](/fa/cli/channels)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مدیریت سرویس Gateway</span>
          <span>5 قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>14%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "14%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">[Gateway](/fa/cli/gateway)، [به‌روزرسانی](/fa/install/updating)، [عیب‌یابی](/fa/gateway/troubleshooting)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مشاهده‌پذیری CLI</span>
          <span>5 قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">[وضعیت](/fa/cli/status)، [سلامت](/fa/cli/health)، [گزارش‌ها](/fa/cli/logs)، [تشخیص‌ها](/fa/gateway/diagnostics)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Doctor</span>
          <span>10 قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">[Doctor](/fa/cli/doctor)، [Doctor](/fa/gateway/doctor)، [اسرار](/fa/gateway/secrets)، [عیب‌یابی](/fa/gateway/troubleshooting)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">به‌روزرسانی‌ها و ارتقاها</span>
          <span>5 قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[به‌روزرسانی](/fa/install/updating)، [به‌روزرسانی](/fa/cli/update)، [عیب‌یابی](/fa/gateway/troubleshooting)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="زمان اجرای Gateway - M4 پایدار - 13 حوزه">
    <a id="gateway-runtime" />

    معماری هسته، احراز هویت، جفت‌سازی، مستندات پروتکل، مستندات daemon، و runbookهای CLI گسترده و به‌روز هستند.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 6%</span><span>کیفیت پایدار - 81%</span><span>کامل بودن پایدار - 89%</span><span><span className="maturity-lts maturity-lts-partial">جزئی - 12</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">تأییدها و اجرای راه‌دور</span>
          <span>۶ قابلیت / پشتیبانی‌شده توسط LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[پروتکل](/fa/gateway/protocol), [نمایه](/fa/gateway/security/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">APIهای HTTP</span>
          <span>۴ قابلیت / پشتیبانی‌شده توسط LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>25%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "25%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">[نمایه](/fa/gateway/index), [API HTTP Openai](/fa/gateway/openai-http-api), [API HTTP Openresponses](/fa/gateway/openresponses-http-api), [API HTTP فراخوانی ابزارها](/fa/gateway/tools-invoke-http-api), [هوک‌ها](/fa/automation/hooks), [نمایه](/fa/web/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">سطح وب میزبانی‌شده</span>
          <span>۴ قابلیت / پشتیبانی‌شده توسط LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">[نمایه](/fa/gateway/index), [معماری](/fa/concepts/architecture), [UI کنترل](/fa/web/control-ui), [چت وب](/fa/web/webchat), [بوم](/fa/refactor/canvas)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">APIهای RPC و رویدادهای Gateway</span>
          <span>۲۰ قابلیت / پشتیبانی‌شده توسط LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">[پروتکل](/fa/gateway/protocol), [نمایه](/fa/gateway/index), [معماری](/fa/concepts/architecture)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">احراز هویت دستگاه و جفت‌سازی</span>
          <span>۱۰ قابلیت / پشتیبانی‌شده توسط LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[پروتکل](/fa/gateway/protocol), [جفت‌سازی](/fa/gateway/pairing), [نمایه](/fa/gateway/security/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">دسترسی شبکه و کشف</span>
          <span>۶ قابلیت / پشتیبانی‌شده توسط LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[نمایه](/fa/gateway/index), [کشف](/fa/gateway/discovery), [پروتکل](/fa/gateway/protocol)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">گره‌ها و قابلیت‌های راه‌دور</span>
          <span>۸ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[پروتکل](/fa/gateway/protocol), [معماری](/fa/concepts/architecture), [نمایه](/fa/nodes/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">سلامت، عیب‌یابی و تعمیر</span>
          <span>۷ قابلیت / پشتیبانی‌شده توسط LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[نمایه](/fa/gateway/index), [عیب‌یابی](/fa/gateway/diagnostics), [دکتر](/fa/gateway/doctor)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">سازگاری پروتکل</span>
          <span>۷ توانمندی / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[پروتکل](/fa/gateway/protocol), [معماری](/fa/concepts/architecture), [Typebox](/fa/concepts/typebox), [پروتکل پل](/fa/gateway/bridge-protocol)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">نقش‌ها و مجوزها</span>
          <span>۵ توانمندی / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[پروتکل](/fa/gateway/protocol), [نمایه](/fa/gateway/security/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">چرخه حیات Gateway</span>
          <span>۷ توانمندی / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">[نمایه](/fa/gateway/index), [معماری](/fa/concepts/architecture)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">کنترل‌های امنیتی</span>
          <span>۶ توانمندی / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[نمایه](/fa/gateway/security/index), [پروتکل](/fa/gateway/protocol), [کشف](/fa/gateway/discovery)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">اتصال WebSocket</span>
          <span>۸ توانمندی / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">[پروتکل](/fa/gateway/protocol), [معماری](/fa/concepts/architecture)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="زمان اجرای عامل - بتای M3 - ۹ حوزه">
    <a id="agent-runtime" />

    حلقهٔ اصلی، مدل‌ها، مسیریابی ارائه‌دهنده و جریان‌دهی ابزارها در سطح درجه‌یک هستند، اما رفتار ارائه‌دهنده به‌صورت هفتگی تغییر می‌کند و برای هر انتشار به اثبات سناریویی نیاز دارد.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - ۳۳٪</span><span>کیفیت بتا - ۷۸٪</span><span>کامل‌بودن بتا - ۷۹٪</span><span><span className="maturity-lts maturity-lts-partial">جزئی - ۶</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">اجرای نوبت عامل</span>
          <span>۳ قابلیت / پشتیبانی‌شده توسط LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>29%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "29%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[حلقه عامل](/fa/concepts/agent-loop), [عامل](/fa/cli/agent), [محیط‌های اجرای عامل](/fa/concepts/agent-runtimes)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">محیط‌های اجرای خارجی و زیرعامل‌ها</span>
          <span>۴ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[محیط‌های اجرای عامل](/fa/concepts/agent-runtimes), [Anthropic](/fa/providers/anthropic), [Google](/fa/providers/google), [زیرعامل‌ها](/fa/tools/subagents)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">اجرای ارائه‌دهنده میزبانی‌شده</span>
          <span>۵ قابلیت / پشتیبانی‌شده توسط LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>20%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "20%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Openai](/fa/providers/openai), [Anthropic](/fa/providers/anthropic), [Google](/fa/providers/google), [مدل‌ها](/fa/concepts/models)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ارائه‌دهندگان محلی و خودمیزبان</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Ollama](/fa/providers/ollama), [مدل‌ها](/fa/concepts/models), [عامل](/fa/cli/agent)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">انتخاب مدل و محیط اجرا</span>
          <span>۴ قابلیت / پشتیبانی‌شده توسط LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>25%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "25%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[مدل‌ها](/fa/concepts/models), [مدل‌ها](/fa/cli/models), [Openai](/fa/providers/openai), [محیط‌های اجرای عامل](/fa/concepts/agent-runtimes)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">احراز هویت ارائه‌دهنده</span>
          <span>۱۰ قابلیت / پشتیبانی‌شده توسط LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>24%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "24%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[مدل‌ها](/fa/concepts/models), [عامل](/fa/cli/agent), [مدل‌ها](/fa/cli/models), [Openai](/fa/providers/openai), [Anthropic](/fa/providers/anthropic), [Google](/fa/providers/google), [زیرعامل‌ها](/fa/tools/subagents)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">جریان‌دهی و پیشرفت</span>
          <span>۲ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>56%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "56%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[جریان‌دهی](/fa/concepts/streaming), [حلقه عامل](/fa/concepts/agent-loop)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">فراخوانی‌های ابزار و مدیریت پاسخ</span>
          <span>۳ قابلیت / پشتیبانی‌شده توسط LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>65%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "65%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[حلقه عامل](/fa/concepts/agent-loop), [Ollama](/fa/providers/ollama)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">کنترل‌های اجرای ابزار</span>
          <span>۶ قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>50%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "50%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[سیاست Sandbox در برابر سیاست ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated), [حلقه عامل](/fa/concepts/agent-loop), [زیرعامل‌ها](/fa/tools/subagents)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="نشست، حافظه، و موتور زمینه - M3 Beta - ۹ حوزه">
    <a id="session-memory-and-context-engine" />

    مستندات قوی و پیاده‌سازی فعال. بلوغ به دوام رونوشت، کیفیت Compaction، و برابری میان کلاینت‌ها بستگی دارد.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - ۳۰٪</span><span>کیفیت Beta - ۷۷٪</span><span>کامل‌بودن Beta - ۷۹٪</span><span><span className="maturity-lts maturity-lts-partial">جزئی - ۶</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مدیریت نشست و رونوشت CLI</span>
          <span>۲ قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[نشست](/fa/concepts/session)، [Compaction مدیریت نشست](/fa/reference/session-management-compaction)، [نشست‌ها](/fa/cli/sessions)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مدیریت توکن</span>
          <span>۳ قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>20%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "20%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Compaction](/fa/concepts/compaction)، [زمینه](/fa/concepts/context)، [Compaction مدیریت نشست](/fa/reference/session-management-compaction)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">موتور زمینه</span>
          <span>۲ قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>57%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "57%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[زمینه](/fa/concepts/context)، [موتور زمینه](/fa/concepts/context-engine)، [مهار موتور زمینه Codex](/fa/plan/codex-context-engine-harness)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">برابری تاریخچه و نشست میان کلاینت‌ها</span>
          <span>۲ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>40%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "40%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[چت وب](/fa/web/webchat)، [Android](/fa/platforms/android)، [مسیریابی کانال](/fa/channels/channel-routing)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">عیب‌یابی، نگهداری، و بازیابی</span>
          <span>۳ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>40%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "40%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[عیب‌یابی](/fa/gateway/diagnostics)، [Compaction مدیریت نشست](/fa/reference/session-management-compaction)، [پرچم‌ها](/fa/diagnostics/flags)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">پرامپت‌ها و زمینه هسته</span>
          <span>۲ قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>38%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "38%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[زمینه](/fa/concepts/context)، [بهداشت رونوشت](/fa/reference/transcript-hygiene)، [Discord](/fa/channels/discord)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">حافظه</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>46%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "46%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[پیکربندی حافظه](/fa/reference/memory-config)، [Qmd حافظه](/fa/concepts/memory-qmd)، [حافظه](/fa/concepts/memory)، [Discord](/fa/channels/discord)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مسیریابی نشست</span>
          <span>۲ قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>25%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "25%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[نشست](/fa/concepts/session)، [مسیریابی کانال](/fa/channels/channel-routing)، [Discord](/fa/channels/discord)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ماندگاری Transcript</span>
          <span>۲ قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Compaction مدیریت جلسه](/fa/reference/session-management-compaction)، [بهداشت Transcript](/fa/reference/transcript-hygiene)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="چارچوب کانال - M3 بتا - 8 حوزه">
    <a id="channel-framework" />

    بسیاری از کانال‌ها قراردادهای تحویل و مسیریابی Gateway مشترکی دارند، اما رفتار کانال بسته به API بالادستی و محدودیت‌های سیاست حساب متفاوت است.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 13%</span><span>کیفیت بتا - 76%</span><span>کامل‌بودن بتا - 79%</span><span><span className="maturity-lts maturity-lts-partial">جزئی - 5</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">دستورهای کنش‌ها و تأییدهای کانال</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[گروه‌ها](/fa/channels/groups), [Discord](/fa/channels/discord), [Google Chat](/fa/channels/googlechat), [Signal](/fa/channels/signal), [Matrix](/fa/channels/matrix)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی کانال</span>
          <span>۵ قابلیت / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>14%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "14%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[فهرست](/fa/channels/index), [جفت‌سازی](/fa/channels/pairing), [عیب‌یابی](/fa/channels/troubleshooting), [Pluginهای کانال SDK](/fa/plugins/sdk-channel-plugins)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">رفتار رشته گروهی و اتاق محیطی</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>36%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "36%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[گروه‌ها](/fa/channels/groups), [پیام‌های گروهی](/fa/channels/group-messages), [رویدادهای اتاق محیطی](/fa/channels/ambient-room-events), [گروه‌های پخش همگانی](/fa/channels/broadcast-groups), [Discord](/fa/channels/discord)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">دسترسی ورودی و دروازه‌های هویت</span>
          <span>۵ قابلیت / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[گروه‌های دسترسی](/fa/channels/access-groups), [گروه‌ها](/fa/channels/groups), [Discord](/fa/channels/discord), [LINE](/fa/channels/line)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">پیوست‌های رسانه‌ای و داده‌های غنی کانال</span>
          <span>۴ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[LINE](/fa/channels/line), [Signal](/fa/channels/signal), [Google Chat](/fa/channels/googlechat), [Matrix](/fa/channels/matrix), [Discord](/fa/channels/discord)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">تحویل خروجی و خط لوله پاسخ</span>
          <span>۴ قابلیت / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>38%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "38%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[گروه‌ها](/fa/channels/groups), [رویدادهای اتاق محیطی](/fa/channels/ambient-room-events), [Discord](/fa/channels/discord), [Matrix](/fa/channels/matrix), [کانال‌های پیکربندی](/fa/gateway/config-channels)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مسیریابی و تحویل مکالمه</span>
          <span>۱۰ قابلیت / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[مسیریابی کانال](/fa/channels/channel-routing), [گروه‌ها](/fa/channels/groups), [Discord](/fa/channels/discord), [Matrix](/fa/channels/matrix), [عیب‌یابی](/fa/channels/troubleshooting), [مرجع پیکربندی](/fa/gateway/configuration-reference)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">سلامت وضعیت و کنترل‌های اپراتور</span>
          <span>۴ قابلیت / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[سلامت](/fa/gateway/health)، [مرجع پیکربندی](/fa/gateway/configuration-reference)، [عیب‌یابی](/fa/channels/troubleshooting)، [Discord](/fa/channels/discord)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="مشاهده‌پذیری - بتای M3 - ۵ حوزه">
    <a id="observability" />

    مستندات OTel، Prometheus، ثبت لاگ، و عیب‌یابی وجود دارد. به یک بازبینی بلوغ عمومی با محوریت «اپراتورها ابتدا باید به چه چیزی نگاه کنند» نیاز دارد.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 18%</span><span>کیفیت بتا - 75%</span><span>کامل بودن بتا - 79%</span><span><span className="maturity-lts maturity-lts-partial">جزئی - 3</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ناحیه</span><span>پوشش</span><span>کیفیت</span><span>کامل بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">سلامت و تعمیر</span>
          <span>12 قابلیت / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>28%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "28%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[سلامت](/fa/gateway/health), [Telegram](/fa/channels/telegram), [Doctor](/fa/cli/doctor), [Doctor](/fa/gateway/doctor), [زیرمسیرهای SDK](/fa/plugins/sdk-subpaths), [سلامت](/fa/cli/health), [پروتکل](/fa/gateway/protocol)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ثبت گزارش</span>
          <span>5 قابلیت / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[ثبت گزارش](/fa/logging), [ثبت گزارش](/fa/gateway/logging), [گزارش‌ها](/fa/cli/logs)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">گردآوری عیب‌یابی</span>
          <span>8 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[عیب‌یابی‌ها](/fa/gateway/diagnostics), [سلامت](/fa/gateway/health), [مهار Codex](/fa/plugins/codex-harness), [پروتکل](/fa/gateway/protocol)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">صدور تله‌متری</span>
          <span>13 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Hookها](/fa/plugins/hooks), [Opentelemetry](/fa/gateway/opentelemetry), [ثبت گزارش](/fa/logging), [زیرمسیرهای SDK](/fa/plugins/sdk-subpaths), [Otel عیب‌یابی](/fa/plugins/reference/diagnostics-otel), [Prometheus](/fa/gateway/prometheus), [Prometheus عیب‌یابی](/fa/plugins/reference/diagnostics-prometheus)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">عیب‌یابی نشست</span>
          <span>4 قابلیت / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Opentelemetry](/fa/gateway/opentelemetry), [Prometheus](/fa/gateway/prometheus), [عیب‌یابی‌ها](/fa/gateway/diagnostics), [پروتکل](/fa/gateway/protocol)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Gateway Web App - M3 Beta - 6 areas">
    <a id="gateway-web-app" />

    رابط کاربری وب همراه با جریان‌های جفت‌سازی، گفتگو، PWA، Talk، پوش و Gateway راه‌دور مستند شده است. پس از کارت‌های امتیاز مرورگرهای مختلف و PWA موبایل، آن را ارتقا دهید.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 4%</span><span>کیفیت بتا - 74%</span><span>کامل بودن بتا - 79%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">گفت‌وگوی بلادرنگ مرورگر</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[رابط کاربری کنترل](/fa/web/control-ui), [پروتکل](/fa/gateway/protocol), [گفت‌وگو](/fa/nodes/talk)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">دسترسی و اعتماد مرورگر</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[رابط کاربری کنترل](/fa/web/control-ui), [داشبورد](/fa/web/dashboard), [Tailscale](/fa/gateway/tailscale), [راه دور](/fa/gateway/remote)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">پیکربندی</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[رابط کاربری کنترل](/fa/web/control-ui), [پیکربندی](/fa/gateway/configuration)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">رابط کاربری مرورگر</span>
          <span>۱۰ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>8%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "8%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[رابط کاربری کنترل](/fa/web/control-ui), [نمایه](/fa/web/index), [داشبورد](/fa/web/dashboard), [پروتکل](/fa/gateway/protocol)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">گفت‌وگوهای وب‌چت</span>
          <span>۱۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>10%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "10%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[رابط کاربری کنترل](/fa/web/control-ui), [وب‌چت](/fa/web/webchat), [شروع کار](/fa/start/getting-started), [مسیریابی کانال](/fa/channels/channel-routing), [عملیات امن فایل](/fa/gateway/security/secure-file-operations)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">کنسول اپراتور</span>
          <span>۱۰ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>8%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "8%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[رابط کاربری کنترل](/fa/web/control-ui), [سلامت](/fa/gateway/health), [پروتکل](/fa/gateway/protocol), [داشبورد](/fa/web/dashboard)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Pluginها - M3 بتا - ۹ حوزه">
    <a id="plugins" />

    مستندات گسترده و شواهد قوی از زمان اجرای داخلی در سراسر مانیفست‌ها، کشف، بارگذاری، معماری ارائه‌دهنده/ابزار، و مرزهای تأیید وجود دارد. این ردیف را تا زمانی که اثبات API/زیرمسیرهای SDK عمومی و توزیع خارجی قوی‌تر شود، در بتا نگه دارید.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 12%</span><span>کیفیت بتا - 72%</span><span>کامل‌بودن بتا - 79%</span><span><span className="maturity-lts maturity-lts-partial">جزئی - 7</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">تألیف و بسته‌بندی Pluginها</span>
          <span>۸ قابلیت / دارای پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[ساخت Pluginها](/fa/plugins/building-plugins), [نمای کلی SDK](/fa/plugins/sdk-overview), [نقاط ورود SDK](/fa/plugins/sdk-entrypoints), [زیرمسیرهای SDK](/fa/plugins/sdk-subpaths), [مانیفست](/fa/plugins/manifest), [مرجع](/fa/plugins/reference)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Pluginهای همراه</span>
          <span>۵ قابلیت / دارای پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[فهرست Pluginها](/fa/plugins/plugin-inventory), [Pluginها](/fa/cli/plugins), [جزئیات داخلی معماری](/fa/plugins/architecture-internals)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugin بوم</span>
          <span>۶ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[بوم](/fa/plugins/reference/canvas), [بوم](/fa/refactor/canvas), [مرجع پیکربندی](/fa/gateway/configuration-reference)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">نصب و اجرای Pluginها</span>
          <span>۶ قابلیت / دارای پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۳۵٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "35%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[معماری](/fa/plugins/architecture), [جزئیات داخلی معماری](/fa/plugins/architecture-internals), [Pluginها](/fa/cli/plugins)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Pluginهای کانال</span>
          <span>۵ قابلیت / دارای پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Pluginهای کانال SDK](/fa/plugins/sdk-channel-plugins), [ورودی کانال SDK](/fa/plugins/sdk-channel-inbound), [خروجی کانال SDK](/fa/plugins/sdk-channel-outbound)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Pluginهای ارائه‌دهنده و ابزار</span>
          <span>۶ قابلیت / دارای پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۴۳٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "43%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Pluginهای ارائه‌دهنده SDK](/fa/plugins/sdk-provider-plugins), [Pluginهای ابزار](/fa/plugins/tool-plugins), [افزودن قابلیت‌ها](/fa/plugins/adding-capabilities)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">تأییدیه‌های Plugin</span>
          <span>۶ قابلیت / دارای پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[درخواست‌های مجوز Plugin](/fa/plugins/plugin-permission-requests), [تأییدیه‌های اجرا](/fa/tools/exec-approvals), [Pluginهای کانال SDK](/fa/plugins/sdk-channel-plugins)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">انتشار Pluginها</span>
          <span>۶ قابلیت / دارای پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Pluginها](/fa/cli/plugins), [سازگاری](/fa/plugins/compatibility), [انتشار](/fa/clawhub/publishing)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">آزمون Pluginها</span>
          <span>6 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>27%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "27%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[آزمون Sdk](/fa/plugins/sdk-testing), [راه‌اندازی Sdk](/fa/plugins/sdk-setup), [هارنس Codex](/fa/plugins/codex-harness)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="امنیت، احراز هویت، جفت‌سازی، و اسرار - M3 بتا - 6 حوزه">
    <a id="security-auth-pairing-and-secrets" />

    مستندات خوب و سطوح مقاوم‌سازی وجود دارند. پس از آنکه اجرای منظم سناریوهای ارتقا/امنیت ثابت کرد هیچ پس‌رفت راه‌اندازی وجود ندارد، آن را ارتقا دهید.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 16%</span><span>کیفیت بتا - 72%</span><span>کامل بودن بتا - 79%</span><span><span className="maturity-lts maturity-lts-partial">جزئی - 5</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">سیاست تأیید و محافظت‌های ابزار</span>
          <span>2 قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>50%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "50%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[تأییدهای Exec](/fa/tools/exec-approvals), [تأییدها](/fa/cli/approvals), [درخواست‌های مجوز Plugin](/fa/plugins/plugin-permission-requests), [بررسی‌های حسابرسی](/fa/gateway/security/audit-checks)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">احراز هویت Gateway و دسترسی راه دور</span>
          <span>9 قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[نمایه](/fa/gateway/security/index), [راهنمای اجرای مواجهه](/fa/gateway/security/exposure-runbook), [احراز هویت پروکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth), [Tailscale](/fa/gateway/tailscale), [راه دور](/fa/gateway/remote), [مرجع پیکربندی](/fa/gateway/configuration-reference), [Gateway](/fa/cli/gateway), [Doctor](/fa/cli/doctor), [رابط کاربری کنترل](/fa/web/control-ui), [کنترل مرورگر](/fa/tools/browser-control), [بررسی‌های حسابرسی](/fa/gateway/security/audit-checks)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">کنترل دسترسی کانال</span>
          <span>3 قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[جفت‌سازی](/fa/channels/pairing), [Telegram](/fa/channels/telegram), [گروه‌های دسترسی](/fa/channels/access-groups), [بررسی‌های حسابرسی](/fa/gateway/security/audit-checks)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">جفت‌سازی دستگاه و Node</span>
          <span>11 قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[پروتکل](/fa/gateway/protocol), [دستگاه‌ها](/fa/cli/devices), [جفت‌سازی](/fa/channels/pairing), [جفت‌سازی](/fa/gateway/pairing), [دامنه‌های عملگر](/fa/gateway/operator-scopes), [رابط کاربری کنترل](/fa/web/control-ui), [وب‌چت](/fa/web/webchat), [تأییدها](/fa/cli/approvals)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">اعتماد Plugin</span>
          <span>2 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[مانیفست](/fa/plugins/manifest), [درخواست‌های مجوز Plugin](/fa/plugins/plugin-permission-requests), [مدیریت Pluginها](/fa/plugins/manage-plugins), [بررسی‌های حسابرسی](/fa/gateway/security/audit-checks)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">بهداشت اعتبارنامه و اسرار</span>
          <span>5 قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>46%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "46%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[احراز هویت](/fa/gateway/authentication), [مدل‌ها](/fa/cli/models), [Openai](/fa/providers/openai), [Oauth](/fa/concepts/oauth), [اسرار](/fa/gateway/secrets), [اسرار](/fa/cli/secrets), [سطح اعتبارنامه Secretref](/fa/reference/secretref-credential-surface), [بررسی‌های حسابرسی](/fa/gateway/security/audit-checks)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="اتوماسیون: Cron، هوک‌ها، وظایف، نظرسنجی - M3 بتا - 6 حوزه">
    <a id="automation-cron-hooks-tasks-polling" />

    مستندسازی‌شده و قابل استفاده است، اما اثبات سناریو باید تحویل بدون حضور کاربر، تلاش‌های مجدد، و نمایانی شکست را پوشش دهد.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 2%</span><span>کیفیت بتا - 72%</span><span>کامل بودن بتا - 79%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">کارهای Cron</span>
          <span>۱۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[کارهای Cron](/fa/automation/cron-jobs), [Cron](/fa/cli/cron), [پروتکل](/fa/gateway/protocol), [وظایف](/fa/automation/tasks), [Discord](/fa/channels/discord)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ورود رویدادها</span>
          <span>۱۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Telegram](/fa/channels/telegram), [Zalo](/fa/channels/zalo), [عیب‌یابی](/fa/channels/troubleshooting), [iMessage از BlueBubbles](/fa/channels/imessage-from-bluebubbles), [یکپارچه‌سازی Gmail Pubsub](/fa/automation/cron-jobs#gmail-pubsub-integration), [Gmail Pubsub](/fa/automation/cron-jobs), [Webhookها](/fa/cli/webhooks), [Webhookها](/fa/automation/cron-jobs#webhooks), [Webhook](/fa/automation/cron-jobs)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">قلاب‌های خودکارسازی</span>
          <span>۱۱ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[قلاب‌ها](/fa/automation/hooks), [قلاب‌ها](/fa/cli/hooks), [قلاب‌ها](/fa/plugins/hooks), [درخواست‌های مجوز Plugin](/fa/plugins/plugin-permission-requests), [زیرمسیرهای SDK](/fa/plugins/sdk-subpaths)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">وظایف و جریان‌های پس‌زمینه</span>
          <span>۱۰ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[وظایف](/fa/automation/tasks), [نمایه](/fa/automation/index), [وظایف](/fa/cli/tasks), [TaskFlow](/fa/automation/taskflow), [زمان اجرای SDK](/fa/plugins/sdk-runtime)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Heartbeat</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۱۴٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "14%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[نمایه](/fa/automation/index), [Heartbeat](/fa/gateway/heartbeat), [تعهدها](/fa/concepts/commitments)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">کنترل‌های Polling</span>
          <span>۱۰ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Poll](/fa/cli/message), [پیام](/fa/cli/message), [Telegram](/fa/channels/telegram), [Microsoft Teams](/fa/channels/msteams), [فرایند پس‌زمینه](/fa/gateway/background-process)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="درک رسانه و تولید رسانه - M2 آلفا - ۶ حوزه">
    <a id="media-understanding-and-media-generation" />

    سطح گسترده‌ای از قابلیت‌ها وجود دارد، اما تفاوت ارائه‌دهنده‌ها، محدودیت‌های فایل و برابری Node/برنامه باعث می‌شود این بخش هنوز پایدار نباشد.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - ۲٪</span><span>کیفیت آلفا - ۶۴٪</span><span>کامل‌بودن آلفا - ۶۸٪</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">دریافت و دسترسی رسانه</span>
          <span>۸ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[نمای کلی رسانه](/fa/tools/media-overview)، [درک رسانه](/fa/nodes/media-understanding)، [عملیات امن فایل](/fa/gateway/security/secure-file-operations)، [Pdf](/fa/tools/pdf)، [تولید تصویر](/fa/tools/image-generation)، [Qr](/fa/cli/qr)، [Line](/fa/channels/line)، [Whatsapp](/fa/channels/whatsapp)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مدیریت رسانه در کانال</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[تصاویر](/fa/nodes/images)، [نمای کلی رسانه](/fa/tools/media-overview)، [Discord](/fa/channels/discord)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">پیکربندی رسانه</span>
          <span>۱ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[نمای کلی رسانه](/fa/tools/media-overview)، [تولید تصویر](/fa/tools/image-generation)، [Manifest](/fa/plugins/manifest)، [Codex Harness](/fa/plugins/codex-harness)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">تحویل متن به گفتار</span>
          <span>۲ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[Tts](/fa/tools/tts)، [نمای کلی رسانه](/fa/tools/media-overview)، [Discord](/fa/channels/discord)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">درک رسانه</span>
          <span>۱۲ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-category-docs">[صدا](/fa/nodes/audio)، [درک رسانه](/fa/nodes/media-understanding)، [نمای کلی رسانه](/fa/tools/media-overview)، [Whatsapp](/fa/channels/whatsapp)، [تصاویر](/fa/nodes/images)، [Infer](/fa/cli/infer)، [Pdf](/fa/tools/pdf)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">تولید رسانه</span>
          <span>۱۷ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>5%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "5%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-category-docs">[تولید تصویر](/fa/tools/image-generation)، [نمای کلی رسانه](/fa/tools/media-overview)، [Skills](/fa/tools/skills)، [تولید موسیقی](/fa/tools/music-generation)، [تولید ویدئو](/fa/tools/video-generation)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="صدا و گفت‌وگوی بلادرنگ - M2 آلفا - ۶ حوزه">
    <a id="voice-and-realtime-talk" />

    چندین پیاده‌سازی در Control UI، برنامه‌ها و ارائه‌دهندگان وجود دارد. پیش از بتا به کارت‌های امتیازدهی تأخیر، حالت‌های خرابی و راه‌اندازی نیاز دارد.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت آلفا - 61%</span><span>کامل‌بودن آلفا - 68%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ارائه‌دهندگان گفت‌وگو</span>
          <span>۷ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۱٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[Openai](/fa/providers/openai), [Google](/fa/providers/google), [Pluginهای ارائه‌دهنده SDK](/fa/plugins/sdk-provider-plugins), [گفت‌وگو](/fa/nodes/talk), [رابط کاربری کنترل](/fa/web/control-ui)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">جلسه‌های گفت‌وگوی بلادرنگ</span>
          <span>۱۱ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۱٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[گفت‌وگو](/fa/nodes/talk), [رابط کاربری کنترل](/fa/web/control-ui)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">گفتار و رونویسی</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۱٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[گفت‌وگو](/fa/nodes/talk), [Openai](/fa/providers/openai), [Google](/fa/providers/google)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">گفت‌وگوی برنامه بومی</span>
          <span>۴ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۱٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[گفت‌وگو](/fa/nodes/talk), [Voicewake](/fa/platforms/mac/voicewake)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">بیدارباش صوتی و مسیریابی</span>
          <span>۴ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۱٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[Voicewake](/fa/nodes/voicewake), [Voicewake](/fa/platforms/mac/voicewake), [هم‌پوشانی صوتی](/fa/platforms/mac/voice-overlay)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مشاهده‌پذیری گفت‌وگو</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۱٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[رابط کاربری کنترل](/fa/web/control-ui), [هم‌پوشانی صوتی](/fa/platforms/mac/voice-overlay), [گفت‌وگو](/fa/nodes/talk)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="TUI - آلفای M2 - ۵ حوزه">
    <a id="tui" />

    در مستندات و منبع وجود دارد، اما به‌عنوان یک گردش‌کار اصلی کاربر کمتر دیده می‌شود. به تعریف صریح سناریو نیاز دارد.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - ۰٪</span><span>کیفیت آلفا - ۵۹٪</span><span>کامل‌بودن آلفا - ۶۶٪</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">حالت‌های اجرا</span>
          <span>۱۴ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[TUI](/fa/cli/tui)، [TUI](/fa/web/tui)، [فهرست](/fa/cli/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ورودی و فرمان‌ها</span>
          <span>۸ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[TUI](/fa/web/tui)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مدیریت نشست</span>
          <span>۳ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[TUI](/fa/web/tui)، [نشست‌ها](/fa/cli/sessions)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">اجرای پوسته محلی</span>
          <span>۴ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[TUI](/fa/web/tui)، [TUI](/fa/cli/tui)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ایمنی رندر و خروجی</span>
          <span>۴ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[TUI](/fa/web/tui)، [QR](/fa/cli/qr)، [لاگ‌ها](/fa/cli/logs)، [تکمیل](/fa/cli/completion)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="ClawHub - M2 آلفا - ۴ حوزه">
    <a id="clawhub" />

    مستندات عمومی و مفهوم اکوسیستم وجود دارد. به کارت‌های امتیاز نصب، اعتماد، به‌روزرسانی، بازگردانی و سازگاری نیاز دارد.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت آلفا - 58%</span><span>کامل‌بودن آلفا - 62%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">انتشار</span>
          <span>۷ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-category-docs">[انتشار](/fa/clawhub/publishing), [ایجاد Skills](/fa/tools/creating-skills), [جامعه](/fa/plugins/community)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">کشف کاتالوگ</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[Plugin](/fa/tools/plugin), [Pluginها](/fa/cli/plugins), [Skills](/fa/cli/skills), [Skills](/fa/tools/skills), [جامعه](/fa/plugins/community)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">سازگاری و اعتماد</span>
          <span>۱۲ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>56%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "56%" }} /></span></span></div>
        <div className="maturity-category-docs">[Plugin](/fa/tools/plugin), [Pluginها](/fa/cli/plugins), [سازگاری](/fa/plugins/compatibility), [فهرست Plugin](/fa/plugins/plugin-inventory), [انتشار](/fa/clawhub/publishing), [Skills](/fa/tools/skills), [پیکربندی Skills](/fa/tools/skills-config)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">چرخه عمر و سلامت Plugin</span>
          <span>۲۶ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[Plugin](/fa/tools/plugin), [Pluginها](/fa/cli/plugins), [Skills](/fa/cli/skills), [Skills](/fa/tools/skills), [پروتکل](/fa/gateway/protocol), [بسته‌ها](/fa/plugins/bundles), [حل وابستگی](/fa/plugins/dependency-resolution)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="OpenClaw App SDK - آلفای M2 - ۶ حوزه">
    <a id="openclaw-app-sdk" />

    OpenClaw App SDK یک قرارداد متمایز برای برنامه خارجی است که از زمان اجرای Gateway و Plugin SDK جداست. امتیازدهی فعلی یک مسیر واقعی `@openclaw/sdk` را نشان می‌دهد، همراه با شکاف‌هایی در بسته‌بندی عمومی، کشف خودکار، تأییدها، کمک‌کننده‌ها و سازگاری.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 3%</span><span>کیفیت آلفا - 54%</span><span>کامل‌بودن آلفا - 53%</span><span><span className="maturity-lts maturity-lts-none">هیچ</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">API کلاینت</span>
          <span>۴ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>51%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "51%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>50%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "50%" }} /></span></span></div>
        <div className="maturity-category-docs">[Openclaw Sdk](/fa/gateway/external-apps)، [طراحی API Openclaw Sdk](/fa/gateway/external-apps)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">دسترسی Gateway</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">[Openclaw Sdk](/fa/gateway/external-apps)، [طراحی API Openclaw Sdk](/fa/gateway/external-apps)، [پروتکل](/fa/gateway/protocol)، [فهرست](/fa/gateway/security/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">گفت‌وگوهای عامل</span>
          <span>۶ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>52%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "52%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>52%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "52%" }} /></span></span></div>
        <div className="maturity-category-docs">[Openclaw Sdk](/fa/gateway/external-apps)، [طراحی API Openclaw Sdk](/fa/gateway/external-apps)، [پروتکل](/fa/gateway/protocol)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">رویدادها و تأییدها</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>52%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "52%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>52%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "52%" }} /></span></span></div>
        <div className="maturity-category-docs">[Openclaw Sdk](/fa/gateway/external-apps)، [طراحی API Openclaw Sdk](/fa/gateway/external-apps)، [پروتکل](/fa/gateway/protocol)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راهنماهای منبع</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>17%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "17%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-category-docs">[Openclaw Sdk](/fa/gateway/external-apps)، [طراحی API Openclaw Sdk](/fa/gateway/external-apps)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">سازگاری</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-category-docs">[طراحی API Openclaw Sdk](/fa/gateway/external-apps)، [Typebox](/fa/concepts/typebox)، [پروتکل](/fa/gateway/protocol)</div>
      </div>
    </div>

  </Accordion>

</AccordionGroup>

### پلتفرم

<AccordionGroup>
  <Accordion title="میزبان Gateway لینوکس - M4 پایدار - ۵ حوزه">
    <a id="linux-gateway-host" />

    زمان اجرای Node توصیه می‌شود، سرویس کاربر systemd مستند شده است، و راهنمای VPS/کانتینر گسترده است.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت بتا - 75%</span><span>کامل‌بودن پایدار - 89%</span><span><span className="maturity-lts maturity-lts-partial">جزئی - ۴</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی میزبان و به‌روزرسانی‌ها</span>
          <span>۴ قابلیت / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۵٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>۸۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[نمایه](/fa/install/index)، [به‌روزرسانی](/fa/install/updating)، [Linux](/fa/platforms/linux)، [نمایه](/fa/platforms/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">زمان اجرای Gateway و کنترل سرویس</span>
          <span>۶ قابلیت / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۵٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>۸۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[نمایه](/fa/gateway/index)، [Gateway](/fa/cli/gateway)، [Linux](/fa/platforms/linux)، [Vps](/fa/vps)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">دسترسی از راه دور و امنیت</span>
          <span>۶ قابلیت / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۵٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>۸۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[راه دور](/fa/gateway/remote)، [Tailscale](/fa/gateway/tailscale)، [راهنمای اجرای مواجهه](/fa/gateway/security/exposure-runbook)، [احراز هویت](/fa/gateway/authentication)، [اسرار](/fa/gateway/secrets)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">عیب‌یابی و تعمیر</span>
          <span>۴ قابلیت / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۵٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>۸۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[وضعیت](/fa/cli/status)، [گزارش‌ها](/fa/cli/logs)، [Doctor](/fa/cli/doctor)، [عیب‌یابی](/fa/gateway/diagnostics)، [نمایه](/fa/gateway/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">هدف‌های استقرار</span>
          <span>۳ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۵٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>۸۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">[Vps](/fa/vps)، [Docker](/fa/install/docker)، [Hetzner](/fa/install/hetzner)، [Digitalocean](/fa/install/digitalocean)، [Kubernetes](/fa/install/kubernetes)، [Podman](/fa/install/podman)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="میزبان Gateway در macOS - M4 پایدار - ۷ حوزه">
    <a id="macos-gateway-host" />

    مسیر سرویس LaunchAgent، حالت‌های محلی/راه دور Gateway، نصب CLI و یکپارچه‌سازی برنامه مستند شده‌اند.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - ۰٪</span><span>کیفیت بتا - ۷۴٪</span><span>کامل‌بودن پایدار - ۸۸٪</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی CLI</span>
          <span>۴ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">[Macos](/fa/platforms/macos)، [Gateway همراه](/fa/platforms/mac/bundled-gateway)، [نصب‌کننده](/fa/install/installer)، [Node](/fa/install/node)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">یکپارچه‌سازی Gateway محلی</span>
          <span>۹ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">[Macos](/fa/platforms/macos)، [Gateway همراه](/fa/platforms/mac/bundled-gateway)، [راه دور](/fa/platforms/mac/remote)، [نمایه](/fa/gateway/index)، [Gateway](/fa/cli/gateway)، [Bonjour](/fa/gateway/bonjour)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">حالت Gateway راه دور</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">[راه دور](/fa/platforms/mac/remote)، [راه دور](/fa/gateway/remote)، [Tailscale](/fa/gateway/tailscale)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">چرخه عمر سرویس Gateway</span>
          <span>۱۰ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">[Macos](/fa/platforms/macos)، [Gateway همراه](/fa/platforms/mac/bundled-gateway)، [Gateway](/fa/cli/gateway)، [نمایه](/fa/gateway/index)، [به‌روزرسانی](/fa/cli/update)، [به‌روزرسانی](/fa/install/updating)، [حذف نصب](/fa/install/uninstall)، [عیب‌یابی](/fa/gateway/troubleshooting)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">تشخیص و مشاهده‌پذیری</span>
          <span>۴ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">[Gateway همراه](/fa/platforms/mac/bundled-gateway)، [Macos](/fa/platforms/macos)، [Gateway](/fa/cli/gateway)، [Doctor](/fa/gateway/doctor)، [عیب‌یابی](/fa/gateway/troubleshooting)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مجوزها و قابلیت‌های بومی</span>
          <span>۴ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">[Macos](/fa/platforms/macos)، [راه دور](/fa/platforms/mac/remote)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">پروفایل‌ها و جداسازی</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">[چند Gateway](/fa/gateway/multiple-gateways)، [نمایه](/fa/gateway/index)، [Gateway](/fa/cli/gateway)</div>
      </div>
    </div>

  </Accordion>
  <Accordion title="برنامه Android - M4 پایدار - ۷ حوزه">
    <a id="android-app" />

    توزیع رسمی Google Play وجود دارد، مستندات ساخت/اجرای منبع نگهداری می‌شوند، و برنامه Android به‌عنوان یک گره همراه عادی برای کاربران مستند شده است.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت پایدار - 80%</span><span>کامل‌بودن پایدار - 80%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ضبط رسانه</span>
          <span>1 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[Android](/fa/platforms/android)، [دوربین](/fa/nodes/camera)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">گفت‌وگوی موبایل</span>
          <span>1 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[Android](/fa/platforms/android)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی اتصال</span>
          <span>1 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[Android](/fa/platforms/android)، [Bonjour](/fa/gateway/bonjour)، [جفت‌سازی](/fa/gateway/pairing)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">توزیع</span>
          <span>3 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[Android](/fa/platforms/android)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">تنظیمات</span>
          <span>1 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[Android](/fa/platforms/android)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">صدا</span>
          <span>1 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[Android](/fa/platforms/android)، [گفتار](/fa/nodes/talk)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">زمان اجرای دستگاه</span>
          <span>2 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[Android](/fa/platforms/android)، [عیب‌یابی](/fa/nodes/troubleshooting)، [پروتکل](/fa/gateway/protocol)</div>
      </div>
    </div>

  </Accordion>
  <Accordion title="برنامه iOS - M4 پایدار - 8 حوزه">
    <a id="ios-app" />

    توزیع رسمی از طریق App Store وجود دارد، push مبتنی بر رله مستند شده است، و برنامه iOS به‌عنوان یک گره همراه عادی برای کاربران مستند شده است.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت پایدار - 80%</span><span>کامل بودن پایدار - 80%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">رسانه و اشتراک‌گذاری</span>
          <span>1 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[Ios](/fa/platforms/ios), [دوربین](/fa/nodes/camera)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">بوم و صفحه‌نمایش</span>
          <span>1 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[Ios](/fa/platforms/ios), [بوم](/fa/plugins/reference/canvas)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">گفت‌وگو و نشست‌ها</span>
          <span>1 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[Ios](/fa/platforms/ios), [گفت‌وگوی وبی](/fa/web/webchat), [پروتکل](/fa/gateway/protocol)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی و عیب‌یابی Gateway</span>
          <span>7 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[Ios](/fa/platforms/ios), [جفت‌سازی](/fa/channels/pairing)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">توزیع</span>
          <span>1 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[Ios](/fa/platforms/ios)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">فرمان‌های دستگاه</span>
          <span>2 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[Ios](/fa/platforms/ios), [پروتکل](/fa/gateway/protocol)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">اعلان‌ها و پس‌زمینه</span>
          <span>1 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[Ios](/fa/platforms/ios), [پیکربندی](/fa/gateway/configuration)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">صدا</span>
          <span>1 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">[Ios](/fa/platforms/ios), [گفتار](/fa/nodes/talk)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="میزبانی Docker و Podman - بتای M3 - 4 حوزه">
    <a id="docker-and-podman-hosting" />

    مستندات نصب وجود دارند و مسیرهای رایج استقرار هستند. پس از آنکه آزمون‌های سریع انتشار به‌صورت تکرارشونده رفتار ارتقا و volume را ثبت کردند، ارتقا دهید.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 7%</span><span>کیفیت بتا - 71%</span><span>کامل‌بودن بتا - 79%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی کانتینر</span>
          <span>6 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Docker](/fa/install/docker)، [Podman](/fa/install/podman)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">عملیات کانتینر</span>
          <span>11 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Podman](/fa/install/podman)، [Docker Vm Runtime](/fa/install/docker-vm-runtime)، [Docker](/fa/install/docker)، [Hetzner](/fa/install/hetzner)، [Hostinger](/fa/install/hostinger)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">انتشار و اعتبارسنجی تصویر</span>
          <span>5 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>29%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "29%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Docker](/fa/install/docker)، [Docker Vm Runtime](/fa/install/docker-vm-runtime)، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">سندباکس و ابزارهای عامل</span>
          <span>3 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Docker](/fa/install/docker)، [Docker Vm Runtime](/fa/install/docker-vm-runtime)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Windows از طریق WSL2 - M3 بتا - 6 حوزه">
    <a id="windows-via-wsl2" />

    مسیر پیشنهادی Windows همراه با راهنمای systemd/user-service و مستندات زنجیره راه‌اندازی. پس از امتیازنامه‌های تکراری نصب/به‌روزرسانی ارتقا دهید.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 6%</span><span>کیفیت آلفا - 69%</span><span>کامل‌بودن بتا - 79%</span><span><span className="maturity-lts maturity-lts-partial">جزئی - 5</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی WSL</span>
          <span>۶ قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[ویندوز](/fa/platforms/windows), [شروع به کار](/fa/start/getting-started)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">CLI</span>
          <span>۸ قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[ویندوز](/fa/platforms/windows), [شروع به کار](/fa/start/getting-started), [به‌روزرسانی](/fa/install/updating), [Onboard](/fa/cli/onboard), [Doctor](/fa/cli/doctor), [وضعیت](/fa/cli/status), [گزارش‌ها](/fa/cli/logs)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">چرخهٔ عمر سرویس Gateway</span>
          <span>۱۰ قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[ویندوز](/fa/platforms/windows), [فهرست](/fa/gateway/index), [Doctor](/fa/gateway/doctor)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">دسترسی و درمعرض‌گذاری Gateway</span>
          <span>۱۱ قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[احراز هویت](/fa/gateway/authentication), [اسرار](/fa/gateway/secrets), [راه دور](/fa/gateway/remote), [راهنمای عملیاتی درمعرض‌گذاری](/fa/gateway/security/exposure-runbook), [ویندوز](/fa/platforms/windows)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">عیب‌یابی و تعمیر</span>
          <span>۶ قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>38%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "38%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[ویندوز](/fa/platforms/windows), [وضعیت](/fa/cli/status), [گزارش‌ها](/fa/cli/logs), [Doctor](/fa/cli/doctor), [Doctor](/fa/gateway/doctor)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مرورگر و رابط کاربری کنترل</span>
          <span>۶ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[عیب‌یابی CDP راه دور مرورگر WSL2 ویندوز](/fa/tools/browser-wsl2-windows-remote-cdp-troubleshooting), [مرورگر](/fa/tools/browser), [رابط کاربری کنترل](/fa/web/control-ui)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Raspberry Pi و دستگاه‌های کوچک Linux - بتای M3 - ۴ حوزه">
    <a id="raspberry-pi-and-small-linux-devices" />

    مستندات پلتفرم وجود دارد و مسیر Gateway مبتنی بر Linux است. برای ارتقا به سطح بالاتر، به اثبات smoke انتشار مخصوص سخت‌افزار نیاز دارد.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت آلفا - 67%</span><span>کامل‌بودن بتا - 79%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی و سازگاری</span>
          <span>۱۲ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Raspberry Pi](/fa/install/raspberry-pi), [نمایه](/fa/install/index), [پرسش‌های متداول اجرای اول](/fa/help/faq-first-run), [پرسش‌های متداول](/fa/help/faq), [Linux](/fa/platforms/linux), [نصاب](/fa/install/installer)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">دسترسی راه‌دور و احراز هویت</span>
          <span>۹ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Raspberry Pi](/fa/install/raspberry-pi), [احراز هویت](/fa/gateway/authentication), [رمزها](/fa/gateway/secrets), [جفت‌سازی](/fa/gateway/pairing), [دستگاه‌ها](/fa/cli/devices), [راه‌دور](/fa/gateway/remote), [Tailscale](/fa/gateway/tailscale)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">زمان اجرای Gateway</span>
          <span>۱۰ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[نمایه](/fa/gateway/index), [Gateway](/fa/cli/gateway), [Raspberry Pi](/fa/install/raspberry-pi), [Linux](/fa/platforms/linux), [VPS](/fa/vps)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">کارایی و عیب‌یابی</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Raspberry Pi](/fa/install/raspberry-pi), [Linux](/fa/platforms/linux), [سلامت](/fa/gateway/health), [عیب‌یابی](/fa/gateway/diagnostics)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="برنامه همراه macOS - M3 بتا - ۸ حوزه">
    <a id="macos-companion-app" />

    برنامه غنی نوار منو، مجوزها، حالت Node، Canvas، بیدارباش صوتی، WebChat و حالت راه‌دور وجود دارند. هنوز آن‌قدر سریع در حال تغییر است که Stable نباشد.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت آلفا - 66%</span><span>کامل‌بودن بتا - 78%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ناحیه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Canvas</span>
          <span>۴ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Canvas](/fa/platforms/mac/canvas), [Macos](/fa/platforms/macos), [گفت‌وگوی وب](/fa/web/webchat)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی محلی</span>
          <span>۷ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Gateway همراه](/fa/platforms/mac/bundled-gateway), [Macos](/fa/platforms/macos), [فرایند فرزند](/fa/platforms/mac/child-process), [راه‌اندازی توسعه](/fa/platforms/mac/dev-setup)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">وضعیت و تنظیمات</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[نوار منو](/fa/platforms/mac/menu-bar), [آیکون](/fa/platforms/mac/icon), [Macos](/fa/platforms/macos), [سلامت](/fa/platforms/mac/health), [ثبت لاگ](/fa/platforms/mac/logging), [راه دور](/fa/platforms/mac/remote)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">قابلیت‌های بومی</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Macos](/fa/platforms/macos), [Xpc](/fa/platforms/mac/xpc), [مجوزها](/fa/platforms/mac/permissions), [امضاکردن](/fa/platforms/mac/signing), [Peekaboo](/fa/platforms/mac/peekaboo)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">اتصال‌های راه دور</span>
          <span>۳ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[راه دور](/fa/platforms/mac/remote), [Macos](/fa/platforms/macos), [راه دور](/fa/gateway/remote)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">صدا و گفت‌وگو</span>
          <span>۳ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Voicewake](/fa/platforms/mac/voicewake), [هم‌پوشانی صوتی](/fa/platforms/mac/voice-overlay), [گفت‌وگو](/fa/nodes/talk), [Macos](/fa/platforms/macos)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">گفت‌وگوی وب</span>
          <span>۳ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[گفت‌وگوی وب](/fa/platforms/mac/webchat), [Macos](/fa/platforms/macos), [گفت‌وگوی وب](/fa/web/webchat)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">گفت‌وگوی وب راه دور</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[گفت‌وگوی وب](/fa/platforms/mac/webchat), [راه دور](/fa/gateway/remote), [راه دور](/fa/platforms/mac/remote)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Native Windows - M2 Alpha - 4 areas">
    <a id="native-windows" />

    جریان‌های اصلی CLI/Gateway کار می‌کنند، اما مستندات همچنان WSL2 را برای تجربهٔ کامل توصیه می‌کنند و نکات احتیاطی نسخهٔ بومی را فهرست می‌کنند.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت آلفا - 58%</span><span>کامل‌بودن آلفا - 66%</span><span><span className="maturity-lts maturity-lts-partial">جزئی - 1</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">CLI</span>
          <span>9 قابلیت / پشتیبانی‌شده با LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-category-docs">[فهرست](/fa/install/index), [نصب‌کننده](/fa/install/installer), [Windows](/fa/platforms/windows), [شروع کار](/fa/start/getting-started), [راه‌اندازی اولیه](/fa/cli/onboard)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مدیریت Gateway</span>
          <span>11 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Windows](/fa/platforms/windows), [فهرست](/fa/gateway/index), [Gateway](/fa/cli/gateway), [Doctor](/fa/cli/doctor)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">شبکه‌سازی</span>
          <span>4 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Windows](/fa/platforms/windows), [فهرست](/fa/gateway/index), [Gateway](/fa/cli/gateway)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">به‌روزرسانی‌ها</span>
          <span>4 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[به‌روزرسانی](/fa/install/updating), [CI](/fa/ci)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="میزبانی Kubernetes - M2 آلفا - 4 حوزه">
    <a id="kubernetes-hosting" />

    میزبانی Kubernetes یک مسیر متمایز استقرار خوشه مبتنی بر Kustomize است. امتیازدهی فعلی یک مسیر استقرار حداقلی واقعی را نشان می‌دهد که در زمینه‌های CI ویژه Kubernetes، بسته‌بندی ingress/TLS/NetworkPolicy، پشتیبان‌گیری/بازیابی، و سخت‌سازی نمایانی در محیط تولید شکاف‌هایی دارد.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت آلفا - 55%</span><span>کامل‌بودن آلفا - 61%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی استقرار</span>
          <span>5 توانمندی</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-category-docs">[Kubernetes](/fa/install/kubernetes), [نمایه](/fa/install/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">پیکربندی و رازها</span>
          <span>5 توانمندی</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-category-docs">[Kubernetes](/fa/install/kubernetes), [رازها](/fa/gateway/secrets), [محیط](/fa/help/environment)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">دسترسی و در معرض‌گذاری</span>
          <span>5 توانمندی</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-category-docs">[Kubernetes](/fa/install/kubernetes), [احراز هویت](/fa/gateway/authentication), [راه دور](/fa/gateway/remote), [راهنمای اجرایی در معرض‌گذاری](/fa/gateway/security/exposure-runbook)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">چرخه عمر خوشه</span>
          <span>5 توانمندی</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-category-docs">[Kubernetes](/fa/install/kubernetes), [نمایه](/fa/gateway/index)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="مسیر نصب Nix - M1 آزمایشی - 5 حوزه">
    <a id="nix-install-path" />

    جریان نصب اختیاری. پیش از ارتقا به آلفا/بتا، به وعده پشتیبانی روشن‌تری نیاز دارد.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت آزمایشی - 41%</span><span>کامل‌بودن آزمایشی - 44%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">تحویل نصب</span>
          <span>4 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[Nix](/fa/install/nix), [نمایه](/fa/install/index), [فهرست مستندات](/fa/start/docs-directory)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">چرخه عمر Plugin</span>
          <span>4 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[مدیریت Pluginها](/fa/plugins/manage-plugins), [Plugin](/fa/tools/plugin), [Nix](/fa/install/nix)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">فعال‌سازی و تجربه کاربری برنامه</span>
          <span>7 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[Nix](/fa/install/nix)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">پیکربندی و وضعیت</span>
          <span>7 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[Nix](/fa/install/nix), [راه‌اندازی](/fa/cli/setup), [محیط](/fa/help/environment)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">زمان اجرای سرویس و محافظ‌ها</span>
          <span>8 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[Nix](/fa/install/nix), [راه‌اندازی](/fa/cli/setup), [Doctor](/fa/cli/doctor), [به‌روزرسانی](/fa/cli/update)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="سطوح همراه watchOS - M1 آزمایشی - 5 حوزه">
    <a id="watchos-companion-surfaces" />

    منبع دارای سطوح برنامه/افزونه Watch است؛ مستندات عمومی هنوز این را به‌عنوان یک قابلیت کاربری ارائه نمی‌کنند.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت آزمایشی - 41%</span><span>کامل‌بودن آزمایشی - 44%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">تحویل و بازیابی</span>
          <span>7 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[iOS](/fa/platforms/ios)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">تأییدیه‌های اجرا</span>
          <span>3 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[تأییدیه‌های اجرا](/fa/tools/exec-approvals), [iOS](/fa/platforms/ios)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">توزیع و پشتیبانی</span>
          <span>6 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[iOS](/fa/platforms/ios)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">اعلان‌ها و پاسخ‌ها</span>
          <span>7 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[iOS](/fa/platforms/ios)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">رابط کاربری اپ Watch</span>
          <span>3 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[iOS](/fa/platforms/ios)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="اپ همراه Linux - M0 برنامه‌ریزی‌شده - 5 حوزه">
    <a id="linux-companion-app" />

    مستندات می‌گویند اپ‌های همراه بومی Linux برنامه‌ریزی شده‌اند؛ Gateway مسیر پشتیبانی‌شده Linux در حال حاضر است.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت آزمایشی - 19%</span><span>کامل بودن آزمایشی - 21%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">توزیع برنامه</span>
          <span>۳ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۱۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۲۱٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">[Linux](/fa/platforms/linux), [نمایه](/fa/platforms/index), [نمایه](/fa/install/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">اتصال Gateway</span>
          <span>۴ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۱۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۲۱٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">[Linux](/fa/platforms/linux), [نمایه](/fa/gateway/index), [جفت‌سازی](/fa/gateway/pairing), [راه دور](/fa/gateway/remote)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">گفتگو و نشست‌ها</span>
          <span>۳ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۱۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۲۱٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">[Linux](/fa/platforms/linux), [پروتکل](/fa/gateway/protocol), [وب‌چت](/fa/web/webchat)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">قابلیت‌های دسکتاپ</span>
          <span>۹ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۱۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۲۱٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">[Linux](/fa/platforms/linux), [تاییدهای اجرا](/fa/tools/exec-approvals), [رازها](/fa/gateway/secrets), [نمایه](/fa/nodes/index), [اجرا](/fa/tools/exec), [گفتگو](/fa/nodes/talk), [دوربین](/fa/nodes/camera)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">وضعیت و عیب‌یابی</span>
          <span>۷ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۱۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۲۱٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">[Linux](/fa/platforms/linux), [OpenClaw](/fa/start/openclaw), [Doctor](/fa/gateway/doctor)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="برنامه همراه بومی Windows - M0 برنامه‌ریزی‌شده - ۵ حوزه">
    <a id="native-windows-companion-app" />

    فقط برنامه‌ریزی‌شده.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - ۰٪</span><span>کیفیت آزمایشی - ۱۹٪</span><span>کامل‌بودن آزمایشی - ۲۱٪</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">نصب و به‌روزرسانی‌ها</span>
          <span>۴ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">[Windows](/fa/platforms/windows)، [نمایه](/fa/install/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">اتصال Gateway</span>
          <span>۳ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">[Windows](/fa/platforms/windows)، [نمایه](/fa/gateway/index)، [جفت‌سازی](/fa/gateway/pairing)، [راه‌دور](/fa/gateway/remote)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">نشست‌های چت</span>
          <span>۲ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">[Windows](/fa/platforms/windows)، [پروتکل](/fa/gateway/protocol)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">وضعیت و تعمیر</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">[Windows](/fa/platforms/windows)، [Doctor](/fa/gateway/doctor)، [نمایه](/fa/gateway/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ابزارهای دسکتاپ و مجوزها</span>
          <span>۱۰ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">[Windows](/fa/platforms/windows)، [نمایه](/fa/nodes/index)، [Exec](/fa/tools/exec)، [تأییدهای Exec](/fa/tools/exec-approvals)، [نمایه](/fa/gateway/security/index)</div>
      </div>
    </div>

  </Accordion>

</AccordionGroup>

### کانال

<AccordionGroup>
  <Accordion title="Discord - M4 پایدار - ۶ حوزه">
    <a id="discord" />

    مستندات عمیق و پوشش گسترده قابلیت‌ها. مسیرهای صوتی/واگذاری باید جداگانه به‌عنوان بتا/آلفا امتیازدهی شوند.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت بتا - 73%</span><span>کامل‌بودن پایدار - 87%</span><span><span className="maturity-lts maturity-lts-partial">جزئی - ۴</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی و عملیات کانال</span>
          <span>10 قابلیت / پشتیبانی‌شده توسط LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">[Discord](/fa/channels/discord)، [Discord](/fa/plugins/reference/discord)، [Fly](/fa/install/fly)، [دستورهای اسلش](/fa/tools/slash-commands)، [سلامت](/fa/gateway/health)، [کانال‌ها](/fa/cli/channels)، [کانال‌های پیکربندی](/fa/gateway/config-channels)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">دسترسی و هویت</span>
          <span>6 قابلیت / پشتیبانی‌شده توسط LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">[Discord](/fa/channels/discord)، [جفت‌سازی](/fa/channels/pairing)، [گروه‌های دسترسی](/fa/channels/access-groups)، [گروه‌ها](/fa/channels/groups)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مسیریابی و تحویل گفتگو</span>
          <span>12 قابلیت / پشتیبانی‌شده توسط LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">[Discord](/fa/channels/discord)، [مسیریابی کانال](/fa/channels/channel-routing)، [گروه‌ها](/fa/channels/groups)، [گروه‌های دسترسی](/fa/channels/access-groups)، [عامل‌های ACP](/fa/tools/acp-agents)، [زیرعامل‌ها](/fa/tools/subagents)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">رسانه و محتوای غنی</span>
          <span>1 قابلیت / پشتیبانی‌شده توسط LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">[Discord](/fa/channels/discord)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">کنترل‌ها و تأییدیه‌های بومی</span>
          <span>5 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">[Discord](/fa/channels/discord)، [دستورهای اسلش](/fa/tools/slash-commands)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">صدا و تماس‌های بی‌درنگ</span>
          <span>5 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">پایدار</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">[Discord](/fa/channels/discord)، [Openai](/fa/providers/openai)، [Elevenlabs](/fa/providers/elevenlabs)، [خودکارسازی QA E2E](/fa/concepts/qa-e2e-automation)، [کانال‌های پیکربندی](/fa/gateway/config-channels)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Telegram - M3 بتا - 5 حوزه">
    <a id="telegram" />

    کانال اصلی به‌اندازه کافی برای استفاده منظم بالغ است، اما تجربه کاربری با نوسان بالا و موارد مرزی رسانه‌ای به اثبات سناریویی تکرارشونده نیاز دارند.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت آلفا - 68%</span><span>کامل بودن بتا - 78%</span><span><span className="maturity-lts maturity-lts-full">کامل - 5</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ناحیه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی و عملیات کانال</span>
          <span>۱۰ قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Telegram](/fa/channels/telegram)، [پیکربندی کانال‌ها](/fa/gateway/config-channels)، [کانال‌ها](/fa/cli/channels)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">دسترسی و هویت</span>
          <span>۱۰ قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Telegram](/fa/channels/telegram)، [جفت‌سازی](/fa/channels/pairing)، [گروه‌های دسترسی](/fa/channels/access-groups)، [گروه‌ها](/fa/channels/groups)، [چندعاملی](/fa/concepts/multi-agent)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مسیریابی و تحویل مکالمه</span>
          <span>۱ قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Telegram](/fa/channels/telegram)، [گروه‌ها](/fa/channels/groups)، [چندعاملی](/fa/concepts/multi-agent)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">رسانه و محتوای غنی</span>
          <span>۱ قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Telegram](/fa/channels/telegram)، [مکان](/fa/channels/location)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">کنترل‌های بومی و تأییدها</span>
          <span>۹ قابلیت / پشتیبانی‌شده در LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۷٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Telegram](/fa/channels/telegram)، [تأییدهای Exec](/fa/tools/exec-approvals)، [واکنش‌ها](/fa/tools/reactions)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Slack - M3 بتا - ۵ ناحیه">
    <a id="slack" />

    مستندات کانال و سطح مسیریابی درجه‌یک. به کارت‌های امتیاز سناریوی نصب/مدیریت workspace نیاز دارد.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - ۰٪</span><span>کیفیت آلفا - ۶۶٪</span><span>کامل‌بودن بتا - ۷۸٪</span><span><span className="maturity-lts maturity-lts-full">کامل - ۵</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ناحیه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی و عملیات کانال</span>
          <span>۱۰ قابلیت / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Slack](/fa/channels/slack), [Slack](/fa/plugins/reference/slack), [اسرار](/fa/gateway/secrets), [اتوماسیون QA E2E](/fa/concepts/qa-e2e-automation), [عیب‌یابی](/fa/channels/troubleshooting)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">دسترسی و هویت</span>
          <span>۱ قابلیت / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Slack](/fa/channels/slack), [جفت‌سازی](/fa/channels/pairing)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مسیریابی و تحویل مکالمه</span>
          <span>۵ قابلیت / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Slack](/fa/channels/slack), [محافظت در برابر حلقه بات](/fa/channels/bot-loop-protection), [جفت‌سازی](/fa/channels/pairing)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">رسانه و محتوای غنی</span>
          <span>۱ قابلیت / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Slack](/fa/channels/slack), [اتوماسیون QA E2E](/fa/concepts/qa-e2e-automation)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">کنترل‌ها و تأییدهای بومی</span>
          <span>۸ قابلیت / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۶٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Slack](/fa/channels/slack), [دستورهای اسلش](/fa/tools/slash-commands), [تأییدهای Exec](/fa/tools/exec-approvals)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="iMessage و BlueBubbles - M3 بتا - ۵ ناحیه">
    <a id="imessage-and-bluebubbles" />

    اجرای پشتیبانی‌شده iMessage از طریق imsg روی میزبان macOS Messages واردشده انجام می‌شود؛ پیکربندی‌های قدیمی BlueBubbles به مهاجرت نیاز دارند. مجوزهای macOS، پوشش SSH، API خصوصی/SIP، و نکات احتیاطی مهاجرت را قابل مشاهده نگه دارید.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - ۰٪</span><span>کیفیت آلفا - ۶۶٪</span><span>کامل‌بودن بتا - ۷۸٪</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی و عملیات کانال</span>
          <span>11 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Bluebubbles Imessage](/fa/announcements/bluebubbles-imessage), [Imessage از Bluebubbles](/fa/channels/imessage-from-bluebubbles), [پیکربندی کانال‌ها](/fa/gateway/config-channels), [Imessage](/fa/channels/imessage)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">دسترسی و هویت</span>
          <span>6 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Imessage](/fa/channels/imessage), [Imessage از Bluebubbles](/fa/channels/imessage-from-bluebubbles), [پیکربندی کانال‌ها](/fa/gateway/config-channels)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مسیریابی و تحویل مکالمه</span>
          <span>4 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Imessage](/fa/channels/imessage)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">رسانه و محتوای غنی</span>
          <span>7 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Imessage](/fa/channels/imessage), [Imessage از Bluebubbles](/fa/channels/imessage-from-bluebubbles), [پیکربندی کانال‌ها](/fa/gateway/config-channels)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">کنترل‌ها و تأییدهای بومی</span>
          <span>3 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Imessage](/fa/channels/imessage)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="WhatsApp - M3 بتا - 5 حوزه">
    <a id="whatsapp" />

    مسیر هسته مهم و مستند شده است؛ ناپایداری بالادستی Baileys/session آن را پایین‌تر از پایدار نگه می‌دارد.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت آلفا - 66%</span><span>کامل‌بودن بتا - 78%</span><span><span className="maturity-lts maturity-lts-none">هیچ</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ناحیه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی و عملیات کانال</span>
          <span>5 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[WhatsApp](/fa/channels/whatsapp), [پیکربندی کانال‌ها](/fa/gateway/config-channels), [WhatsApp](/fa/plugins/reference/whatsapp), [اتوماسیون QA E2E](/fa/concepts/qa-e2e-automation), [Doctor](/fa/gateway/doctor)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">دسترسی و هویت</span>
          <span>7 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[WhatsApp](/fa/channels/whatsapp), [پیکربندی کانال‌ها](/fa/gateway/config-channels), [اتوماسیون QA E2E](/fa/concepts/qa-e2e-automation), [جفت‌سازی](/fa/channels/pairing)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مسیریابی و تحویل گفتگو</span>
          <span>4 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[WhatsApp](/fa/channels/whatsapp), [پیام‌های گروهی](/fa/channels/group-messages)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">رسانه و محتوای غنی</span>
          <span>2 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[WhatsApp](/fa/channels/whatsapp)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">کنترل‌ها و تأییدهای بومی</span>
          <span>2 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[WhatsApp](/fa/channels/whatsapp)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Matrix - M2 آلفا - 6 ناحیه">
    <a id="matrix" />

    از طریق Plugin بسته‌بندی‌شده پشتیبانی می‌شود. به امتیازنامه‌های پل، احراز هویت، و چرخه عمر اتاق نیاز دارد.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت آلفا - 60%</span><span>کامل‌بودن آلفا - 67%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی و عملیات کانال</span>
          <span>5 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">[Matrix](/fa/channels/matrix), [مهاجرت Matrix](/fa/channels/matrix-migration)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">دسترسی و هویت</span>
          <span>7 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">[Matrix](/fa/channels/matrix), [گروه‌ها](/fa/channels/groups), [محافظت در برابر حلقه بات](/fa/channels/bot-loop-protection)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مسیریابی و تحویل گفت‌وگو</span>
          <span>1 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">[Matrix](/fa/channels/matrix)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">رسانه و محتوای غنی</span>
          <span>1 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">[Matrix](/fa/channels/matrix)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">کنترل‌ها و تأییدهای بومی</span>
          <span>6 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">[Matrix](/fa/channels/matrix)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">رمزنگاری و راستی‌آزمایی</span>
          <span>3 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">[Matrix](/fa/channels/matrix), [مهاجرت Matrix](/fa/channels/matrix-migration)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Google Chat - M2 آلفا - 5 حوزه">
    <a id="google-chat" />

    کانال مستندسازی‌شده است، اما راه‌اندازی سازمانی/مدیر خطر بلوغ را افزایش می‌دهد.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت آلفا - 59%</span><span>کامل‌بودن آلفا - 66%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی و عملیات کانال</span>
          <span>16 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Googlechat](/fa/channels/googlechat), [Googlechat](/fa/plugins/reference/googlechat), [کانال‌های پیکربندی](/fa/gateway/config-channels), [مرجع CLI جادوگر](/fa/start/wizard-cli-reference), [اسرار](/fa/gateway/secrets), [سطح اعتبارنامه Secretref](/fa/reference/secretref-credential-surface), [سلامت](/fa/gateway/health), [فهرست Plugin](/fa/plugins/plugin-inventory), [نمایه](/fa/channels/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">دسترسی و هویت</span>
          <span>11 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Googlechat](/fa/channels/googlechat), [جفت‌سازی](/fa/channels/pairing), [گروه‌های دسترسی](/fa/channels/access-groups), [کانال‌های پیکربندی](/fa/gateway/config-channels), [محافظت در برابر چرخه Bot](/fa/channels/bot-loop-protection), [مسیریابی کانال](/fa/channels/channel-routing)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مسیریابی و تحویل گفتگو</span>
          <span>1 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Googlechat](/fa/channels/googlechat), [محافظت در برابر چرخه Bot](/fa/channels/bot-loop-protection), [گروه‌های دسترسی](/fa/channels/access-groups), [مسیریابی کانال](/fa/channels/channel-routing)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">رسانه و محتوای غنی</span>
          <span>1 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Googlechat](/fa/channels/googlechat), [پیام](/fa/cli/message), [درک رسانه](/fa/nodes/media-understanding), [سطح اعتبارنامه Secretref](/fa/reference/secretref-credential-surface)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">کنترل‌ها و تأییدهای بومی</span>
          <span>16 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Googlechat](/fa/channels/googlechat), [پیام](/fa/cli/message), [درک رسانه](/fa/nodes/media-understanding), [سطح اعتبارنامه Secretref](/fa/reference/secretref-credential-surface), [واکنش‌ها](/fa/tools/reactions), [دستورهای اسلش](/fa/tools/slash-commands), [عامل‌های پیکربندی](/fa/gateway/config-agents), [بازآرایی چرخه عمر پیام](/fa/concepts/message-lifecycle-refactor)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Microsoft Teams - M2 آلفا - 5 حوزه">
    <a id="microsoft-teams" />

    جریان‌های احراز هویت/مدیریت سازمانی به اثبات سناریوی صریح نیاز دارند.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت آلفا - 59%</span><span>کامل‌بودن آلفا - 66%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی و عملیات کانال</span>
          <span>۹ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Msteams](/fa/channels/msteams), [Msteams](/fa/plugins/reference/msteams), [کانال‌های پیکربندی](/fa/gateway/config-channels), [سلامت](/fa/gateway/health)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">دسترسی و هویت</span>
          <span>۹ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Msteams](/fa/channels/msteams), [جفت‌سازی](/fa/channels/pairing), [گروه‌های دسترسی](/fa/channels/access-groups)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مسیریابی و تحویل مکالمه</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Msteams](/fa/channels/msteams), [گروه‌ها](/fa/channels/groups), [مسیریابی کانال](/fa/channels/channel-routing)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">رسانه و محتوای غنی</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Msteams](/fa/channels/msteams)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">کنترل‌ها و تأییدهای بومی</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Msteams](/fa/channels/msteams), [تأییدهای پیشرفته Exec](/fa/tools/exec-approvals-advanced)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Signal - M2 آلفا - ۵ حوزه">
    <a id="signal" />

    مستندات کانال پشتیبانی‌شده وجود دارد؛ به اثبات قوی‌تر برای نصب و اتصال مجدد نیاز دارد.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت آلفا - 59%</span><span>کامل‌بودن آلفا - 66%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی و عملیات کانال</span>
          <span>7 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Signal](/fa/channels/signal), [Signal](/fa/plugins/reference/signal)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">دسترسی و هویت</span>
          <span>6 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Signal](/fa/channels/signal)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مسیریابی و تحویل مکالمه</span>
          <span>1 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Signal](/fa/channels/signal)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">رسانه و محتوای غنی</span>
          <span>7 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Signal](/fa/channels/signal)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">کنترل‌ها و تأییدهای بومی</span>
          <span>3 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">[Signal](/fa/channels/signal)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Feishu، QQ Bot، WeChat، Yuanbao، Zalo، Zalo Personal، کانال‌های منطقه‌ای - M2 آلفا - 4 حوزه">
    <a id="feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels" />

    پوشش منطقه‌ای مهم است، اما سطح پشتیبانی عمومی باید بر اساس نوع حساب، تأیید بالادستی و شواهد نگه‌دارنده تنظیم شود.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت آلفا - 55%</span><span>کامل‌بودن آلفا - 58%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ناحیه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی و عملیات کانال</span>
          <span>6 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[نمایه](/fa/channels/index), [جفت‌سازی](/fa/channels/pairing), [Feishu](/fa/plugins/reference/feishu), [جزئیات داخلی معماری](/fa/plugins/architecture-internals)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">دسترسی و هویت</span>
          <span>1 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">مستندات پیوندشده‌ای وجود ندارد</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مسیریابی و تحویل گفتگو</span>
          <span>1 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">مستندات پیوندشده‌ای وجود ندارد</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">رسانه و محتوای غنی</span>
          <span>1 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">مستندات پیوندشده‌ای وجود ندارد</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Mattermost، LINE، IRC، Nextcloud Talk، Nostr، Twitch، Tlon، Synology Chat - M2 آلفا - 4 ناحیه">
    <a id="mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat" />

    سطح‌های پشتیبانی‌شده وجود دارند، اما بلوغ احتمالاً بسته به بالادست و پوشش نگهدارنده متفاوت است. بعداً به‌صورت جداگانه امتیازدهی کنید.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت آلفا - 53%</span><span>کامل‌بودن آلفا - 54%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی و عملیات کانال</span>
          <span>1 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">بدون مستندات پیوندشده</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">دسترسی و هویت</span>
          <span>1 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">بدون مستندات پیوندشده</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مسیریابی و تحویل مکالمه</span>
          <span>1 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">بدون مستندات پیوندشده</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">رسانه و محتوای غنی</span>
          <span>1 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">بدون مستندات پیوندشده</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="کانال تماس صوتی - M1 آزمایشی - 5 حوزه">
    <a id="voice-call-channel" />

    مسیر اختیاری/Plugin با رفتار بی‌درنگ پیچیده. پیش از بتای عمومی به کارت امتیاز سناریو نیاز دارد.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت آزمایشی - 41%</span><span>کامل‌بودن آزمایشی - 44%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی و عملیات کانال</span>
          <span>۲ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[تماس صوتی](/fa/cli/voicecall)، [تماس صوتی](/fa/plugins/voice-call)، [پروتکل](/fa/gateway/protocol)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">دسترسی و هویت</span>
          <span>۱ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[تماس صوتی](/fa/plugins/voice-call)، [تماس صوتی](/fa/cli/voicecall)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مسیریابی و تحویل مکالمه</span>
          <span>۱ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[تماس صوتی](/fa/plugins/voice-call)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">رسانه و محتوای غنی</span>
          <span>۲ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[تماس صوتی](/fa/plugins/voice-call)، [فهرست موجودی Plugin](/fa/plugins/plugin-inventory)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">صدا و تماس‌های بلادرنگ</span>
          <span>۲ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">[تماس صوتی](/fa/plugins/voice-call)</div>
      </div>
    </div>

  </Accordion>

</AccordionGroup>

### ارائه‌دهنده و ابزار

<AccordionGroup>
  <Accordion title="اتوماسیون مرورگر، اجرا و ابزارهای sandbox - M3 بتا - ۳ حوزه">
    <a id="browser-automation-exec-and-sandbox-tools" />

    ابزارهای اصلی مستند شده‌اند، اما امنیت میزبان و تجربه کاربری مجوزها باید همچنان تحت بازبینی فعال امتیازنامه بمانند.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 21%</span><span>کیفیت بتا - 75%</span><span>کامل‌بودن بتا - 79%</span><span><span className="maturity-lts maturity-lts-partial">جزئی - ۲</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">اتوماسیون مرورگر</span>
          <span>۸ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۱۳٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[کنترل مرورگر](/fa/tools/browser-control), [آزمایش](/fa/help/testing), [مرورگر](/fa/tools/browser), [نمایه](/fa/gateway/security/index), [بررسی‌های ممیزی](/fa/gateway/security/audit-checks)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">فراخوانی و اجرای ابزار</span>
          <span>۶ قابلیت / پشتیبانی‌شده با LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۵۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "50%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[اجرا](/fa/tools/exec), [فرایند پس‌زمینه](/fa/gateway/background-process), [API HTTP فراخوانی ابزارها](/fa/gateway/tools-invoke-http-api), [دامنه‌های عملگر](/fa/gateway/operator-scopes), [پروتکل](/fa/gateway/protocol), [تأییدیه‌های اجرا](/fa/tools/exec-approvals), [تأییدیه‌های پیشرفته اجرا](/fa/tools/exec-approvals-advanced), [ارتقایافته](/fa/tools/elevated)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">سندباکس و خط‌مشی ابزار</span>
          <span>۶ قابلیت / پشتیبانی‌شده با LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۸٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[سندباکس‌سازی](/fa/gateway/sandboxing), [سندباکس در برابر خط‌مشی ابزار در برابر ارتقایافته](/fa/gateway/sandbox-vs-tool-policy-vs-elevated), [ابزارهای سندباکس چندعاملی](/fa/tools/multi-agent-sandbox-tools), [مرجع هارنس Codex](/fa/plugins/codex-harness-reference), [ابزارهای پیکربندی](/fa/gateway/config-tools)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="مسیر ارائه‌دهنده OpenAI و Codex - M3 بتا - ۵ حوزه">
    <a id="openai-and-codex-provider-path" />

    مستندات عمیق، مسیر OAuth/اشتراک، صدای بلادرنگ، تصویر، و رفتار سازگاری. نوسان ارائه‌دهنده، بدون اثبات کارت امتیاز انتشار، مانع رسیدن این بخش به پایدار می‌شود.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - ۲۶٪</span><span>کیفیت بتا - ۷۴٪</span><span>کامل بودن بتا - ۷۹٪</span><span><span className="maturity-lts maturity-lts-partial">جزئی - ۳</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مدل و احراز هویت</span>
          <span>۶ قابلیت / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۴۴٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Openai](/fa/providers/openai)، [هارنس Codex](/fa/plugins/codex-harness)، [مدل‌ها](/fa/concepts/models)، [Oauth](/fa/concepts/oauth)، [مرجع هارنس Codex](/fa/plugins/codex-harness-reference)، [پایش احراز هویت](/fa/gateway/authentication)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">سازگاری پاسخ‌ها و ابزار</span>
          <span>۴ قابلیت / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۴۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "40%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Openai](/fa/providers/openai)، [Openresponses Http Api](/fa/gateway/openresponses-http-api)، [Openai Http Api](/fa/gateway/openai-http-api)، [Pluginهای بومی Codex](/fa/plugins/codex-native-plugins)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">هارنس بومی Codex</span>
          <span>۲ قابلیت / با پشتیبانی LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۴۴٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[هارنس Codex](/fa/plugins/codex-harness)، [زمان اجرای هارنس Codex](/fa/plugins/codex-harness-runtime)، [مرجع هارنس Codex](/fa/plugins/codex-harness-reference)، [Pluginهای بومی Codex](/fa/plugins/codex-native-plugins)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ورودی تصویر و چندوجهی</span>
          <span>۲ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۷٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Openai](/fa/providers/openai)، [تولید تصویر](/fa/tools/image-generation)، [تصاویر](/fa/nodes/images)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">صدا و صوت بلادرنگ</span>
          <span>۲ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>۰٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>۶۷٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>۷۹٪</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Openai](/fa/providers/openai)، [Discord](/fa/channels/discord)، [تماس صوتی](/fa/plugins/voice-call)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="ابزارهای جستجوی وب - M3 بتا - ۴ حوزه">
    <a id="web-search-tools" />

    چندین ارائه‌دهنده و مستندات وجود دارد. برای هر خانواده ارائه‌دهنده به اثبات سهمیه/خطا/SSRF نیاز است.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - ۹٪</span><span>کیفیت بتا - ۷۴٪</span><span>کامل‌بودن بتا - ۷۹٪</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ارائه‌دهندگان جست‌وجو</span>
          <span>19 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>11%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "11%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[وب](/fa/tools/web), [جست‌وجوی Brave](/fa/tools/brave-search), [Tavily](/fa/tools/tavily), [جست‌وجوی Exa](/fa/tools/exa-search), [Firecrawl](/fa/tools/firecrawl), [جست‌وجوی Perplexity](/fa/tools/perplexity-search), [جست‌وجوی Duckduckgo](/fa/tools/duckduckgo-search), [جست‌وجوی Searxng](/fa/tools/searxng-search), [جست‌وجوی Gemini](/fa/tools/gemini-search), [جست‌وجوی Grok](/fa/tools/grok-search), [جست‌وجوی Kimi](/fa/tools/kimi-search), [جست‌وجوی Minimax](/fa/tools/minimax-search), [جست‌وجوی Ollama](/fa/tools/ollama-search), [زیرمسیرهای Sdk](/fa/plugins/sdk-subpaths), [نمای کلی Sdk](/fa/plugins/sdk-overview), [Manifest](/fa/plugins/manifest)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی و عیب‌یابی</span>
          <span>9 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[وب](/fa/tools/web), [واکشی وب](/fa/tools/web-fetch), [پرسش‌های متداول](/fa/help/faq), [هزینه‌های استفاده از API](/fa/reference/api-usage-costs), [جست‌وجوی Brave](/fa/tools/brave-search), [جست‌وجوی Perplexity](/fa/tools/perplexity-search), [Tavily](/fa/tools/tavily), [Firecrawl](/fa/tools/firecrawl)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ایمنی شبکه</span>
          <span>4 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[وب](/fa/tools/web), [واکشی وب](/fa/tools/web-fetch), [Firecrawl](/fa/tools/firecrawl), [جست‌وجوی Searxng](/fa/tools/searxng-search)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">دسترس‌پذیری ابزار و واکشی</span>
          <span>11 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>25%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "25%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[ابزارهای پیکربندی](/fa/gateway/config-tools), [واکشی وب](/fa/tools/web-fetch), [وب](/fa/tools/web), [پرسش‌های متداول](/fa/help/faq)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="مسیر ارائه‌دهنده Anthropic - M3 بتا - 5 حوزه">
    <a id="anthropic-provider-path" />

    ارائه‌دهنده مدل در سطح درجه‌یک. به اثبات سناریوی دوره‌ای برای احراز هویت/کاتالوگ/فراخوانی ابزار نیاز دارد.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت بتا - 71%</span><span>کامل‌بودن بتا - 78%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">احراز هویت و بازیابی ارائه‌دهنده</span>
          <span>۹ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Anthropic](/fa/providers/anthropic), [Doctor](/fa/gateway/doctor), [نمونه‌های پیکربندی](/fa/gateway/configuration-examples), [عیب‌یابی](/fa/gateway/troubleshooting), [کش‌کردن پرامپت](/fa/reference/prompt-caching)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">انتخاب مدل و زمان اجرا</span>
          <span>۱۰ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Anthropic](/fa/providers/anthropic), [پیکربندی عامل‌ها](/fa/gateway/config-agents), [مدل‌ها](/fa/concepts/models), [پشتانه‌های CLI](/fa/gateway/cli-backends)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">انتقال درخواست و معناشناسی نوبت</span>
          <span>۱۰ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">[Anthropic](/fa/providers/anthropic), [کش‌کردن پرامپت](/fa/reference/prompt-caching), [عیب‌یابی](/fa/gateway/troubleshooting), [پشتانه‌های CLI](/fa/gateway/cli-backends), [ارائه‌دهندگان مدل](/fa/concepts/model-providers)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">کش پرامپت و زمینه</span>
          <span>۵ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Anthropic](/fa/providers/anthropic), [کش‌کردن پرامپت](/fa/reference/prompt-caching), [عیب‌یابی](/fa/gateway/troubleshooting), [Heartbeat](/fa/gateway/heartbeat)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ورودی‌های رسانه‌ای</span>
          <span>۴ قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Anthropic](/fa/providers/anthropic), [پیکربندی عامل‌ها](/fa/gateway/config-agents)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="مسیر ارائه‌دهنده Google - M3 بتا - ۵ حوزه">
    <a id="google-provider-path" />

    ارائه‌دهنده درجه‌یک با سطوح مدل و بی‌درنگ. به امتیازدهی جداگانه Live/Talk نیاز دارد.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت آلفا - 66%</span><span>کامل‌بودن بتا - 78%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">تنظیم ارائه‌دهنده و اعتبارنامه‌ها</span>
          <span>10 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Google](/fa/providers/google), [ارائه‌دهندگان مدل](/fa/concepts/model-providers)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مسیریابی مدل و نقاط پایانی</span>
          <span>10 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Google](/fa/providers/google), [ارائه‌دهندگان مدل](/fa/concepts/model-providers), [Google](/fa/plugins/reference/google), [جستجوی Gemini](/fa/tools/gemini-search)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">اجرای مستقیم Gemini</span>
          <span>9 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Google](/fa/providers/google), [ارائه‌دهندگان مدل](/fa/concepts/model-providers), [مدل‌های پرسش‌های متداول](/fa/help/faq-models), [آزمایش زنده](/fa/help/testing-live)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">رسانه، جستجو، و بلادرنگ</span>
          <span>10 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Google](/fa/plugins/reference/google), [Google](/fa/providers/google)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ذخیره‌سازی پرامپت در کش</span>
          <span>5 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[ذخیره‌سازی پرامپت در کش](/fa/reference/prompt-caching), [Google](/fa/providers/google), [ارائه‌دهندگان مدل](/fa/concepts/model-providers), [مصرف توکن](/fa/reference/token-use)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="مسیر ارائه‌دهنده OpenRouter - بتای M3 - 4 حوزه">
    <a id="openrouter-provider-path" />

    مسیر یکپارچه ارائه‌دهنده مستند شده و ارزشمند است، اما رفتار اختصاصی هر مدل متفاوت است.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت آلفا - 66%</span><span>کامل‌بودن بتا - 78%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی و احراز هویت ارائه‌دهنده</span>
          <span>14 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Openrouter](/fa/providers/openrouter), [ارائه‌دهندگان مدل](/fa/concepts/model-providers), [پیکربندی](/fa/cli/configure), [احراز هویت](/fa/gateway/authentication), [محیط](/fa/help/environment), [مدل‌ها](/fa/cli/models), [مدل‌ها](/fa/concepts/models)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">زمان اجرای چت و نرمال‌سازی</span>
          <span>15 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Openrouter](/fa/providers/openrouter), [ارائه‌دهندگان مدل](/fa/concepts/model-providers), [کش‌گذاری پرامپت](/fa/reference/prompt-caching)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">بازیابی و عیب‌یابی ارائه‌دهنده</span>
          <span>5 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[جایگزینی مدل هنگام خرابی](/fa/concepts/model-failover), [Openrouter](/fa/providers/openrouter), [مدل‌ها](/fa/cli/models)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">تولید رسانه و گفتار</span>
          <span>7 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">بتا</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">[Openrouter](/fa/providers/openrouter), [تولید تصویر](/fa/tools/image-generation), [تولید موسیقی](/fa/tools/music-generation), [نمای کلی رسانه](/fa/tools/media-overview), [تولید ویدئو](/fa/tools/video-generation), [تبدیل متن به گفتار](/fa/tools/tts)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="ابزارهای تولید تصویر، ویدئو و موسیقی - M2 آلفا - 5 حوزه">
    <a id="image-video-and-music-generation-tools" />

    این قابلیت در میان ارائه‌دهندگان وجود دارد، اما کیفیت، تأخیر و سازگاری پارامترها بدون اثبات جداگانه برای هر ارائه‌دهنده بیش از حد متفاوت است و برای بتا مناسب نیست.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت آلفا - 61%</span><span>کامل‌بودن آلفا - 68%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>ناحیه</span><span>پوشش</span><span>کیفیت</span><span>کامل بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">مسیریابی و کشف رسانه</span>
          <span>4 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[پیکربندی عامل‌ها](/fa/gateway/config-agents), [تولید تصویر](/fa/tools/image-generation), [تولید ویدئو](/fa/tools/video-generation), [تولید موسیقی](/fa/tools/music-generation)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">چرخه عمر و تحویل وظیفه</span>
          <span>12 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[نمای کلی رسانه](/fa/tools/media-overview), [تولید تصویر](/fa/tools/image-generation), [تولید ویدئو](/fa/tools/video-generation), [تولید موسیقی](/fa/tools/music-generation)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">تولید تصویر</span>
          <span>9 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[تولید تصویر](/fa/tools/image-generation), [Infer](/fa/cli/infer), [نمای کلی رسانه](/fa/tools/media-overview)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">تولید ویدئو</span>
          <span>11 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[تولید ویدئو](/fa/tools/video-generation), [Runway](/fa/providers/runway), [Pixverse](/fa/providers/pixverse), [Fal](/fa/providers/fal), [Openrouter](/fa/providers/openrouter)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">تولید موسیقی</span>
          <span>6 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[تولید موسیقی](/fa/tools/music-generation)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="ارائه‌دهندگان مدل محلی: Ollama، vLLM، SGLang، LM Studio - M2 آلفا - 5 ناحیه">
    <a id="local-model-providers-ollama-vllm-sglang-lm-studio" />

    مفید و مستند شده، اما تفاوت محیط‌ها زیاد است.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت آلفا - 61%</span><span>کامل بودن آلفا - 68%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">راه‌اندازی، چرخه عمر، و عیب‌یابی ارائه‌دهنده</span>
          <span>12 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[مدل‌های محلی](/fa/gateway/local-models), [Lmstudio](/fa/providers/lmstudio), [Ollama](/fa/providers/ollama), [Vllm](/fa/providers/vllm), [سرویس‌های مدل محلی](/fa/gateway/local-model-services), [پیکربندی عامل‌ها](/fa/gateway/config-agents), [عیب‌یابی](/fa/gateway/troubleshooting), [عیب‌یاب](/fa/gateway/doctor)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Pluginهای بومی ارائه‌دهنده</span>
          <span>10 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[Ollama](/fa/providers/ollama), [Lmstudio](/fa/providers/lmstudio)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">سازگاری زمان اجرای سازگار با OpenAI</span>
          <span>8 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[Vllm](/fa/providers/vllm), [Sglang](/fa/providers/sglang), [مدل‌های محلی](/fa/gateway/local-models), [Lmstudio](/fa/providers/lmstudio)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">حافظه و جاسازی‌های محلی</span>
          <span>5 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[حافظه](/fa/concepts/memory), [عیب‌یاب](/fa/gateway/doctor)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ایمنی شبکه و کنترل‌های پرامپت</span>
          <span>2 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[نمایه](/fa/gateway/security/index), [ابزارهای پیکربندی](/fa/gateway/config-tools), [مدل‌های محلی](/fa/gateway/local-models)</div>
      </div>
    </div>

  </Accordion>

  <Accordion title="ارائه‌دهندگان میزبانی‌شده کم‌کاربرد - M2 آلفا - 3 حوزه">
    <a id="long-tail-hosted-providers" />

    صفحه‌های مستندات/مرجع زیادی وجود دارند؛ امتیاز باید از فراداده ارائه‌دهنده به‌همراه پوشش آزمون smoke زنده تولید شود.

    <div className="maturity-surface-rollup"><span>پوشش آزمایشی - 0%</span><span>کیفیت آلفا - 61%</span><span>کامل‌بودن آلفا - 68%</span><span><span className="maturity-lts maturity-lts-none">هیچ‌کدام</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>حوزه</span><span>پوشش</span><span>کیفیت</span><span>کامل‌بودن</span><span>مستندات</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ارائه‌دهندگان LLM میزبانی‌شده</span>
          <span>12 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[نمایه](/fa/providers/index), [ارائه‌دهندگان مدل](/fa/concepts/model-providers), [آزمون زنده](/fa/help/testing-live), [راه‌اندازی اولیه](/fa/cli/onboard)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ارائه‌دهندگان رسانه میزبانی‌شده</span>
          <span>8 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[مانیفست](/fa/plugins/manifest), [آزمون زنده](/fa/help/testing-live), [نمایه](/fa/providers/index)</div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">عملیات ارائه‌دهنده</span>
          <span>12 قابلیت</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">آزمایشی</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">آلفا</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">[نمایه](/fa/providers/index), [ارائه‌دهندگان مدل](/fa/concepts/model-providers), [مانیفست](/fa/plugins/manifest), [آزمون زنده](/fa/help/testing-live), [مدل‌ها](/fa/cli/models)</div>
      </div>
    </div>

  </Accordion>

</AccordionGroup>
