---
description: Real-world OpenClaw projects from the community
read_when:
    - جست‌وجوی نمونه‌های واقعی استفاده از OpenClaw
    - به‌روزرسانی نکات برجستهٔ پروژه‌های جامعه کاربری
summary: پروژه‌ها و یکپارچه‌سازی‌های ساخته‌شده توسط جامعه که با OpenClaw قدرت گرفته‌اند
title: نمایشگاه
x-i18n:
    generated_at: "2026-07-02T08:39:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0530aae85db5414b61c968dcc290178b2b33a540c7f86d556e9bad69cf374fb7
    source_path: start/showcase.md
    workflow: 16
---

پروژه‌های OpenClaw دموهای اسباب‌بازی نیستند. افراد در حال عرضه حلقه‌های بازبینی PR، اپ‌های موبایل، اتوماسیون خانگی، سیستم‌های صوتی، ابزارهای توسعه، و گردش‌کارهای سنگین از نظر حافظه از همان کانال‌هایی هستند که پیش‌تر استفاده می‌کردند — ساخت‌های بومیِ چت روی Telegram، WhatsApp، Discord و ترمینال‌ها؛ اتوماسیون واقعی برای رزرو، خرید و پشتیبانی بدون انتظار برای API؛ و یکپارچه‌سازی‌های دنیای فیزیکی با چاپگرها، جاروبرقی‌ها، دوربین‌ها و سیستم‌های خانگی.

<Info>
**می‌خواهید معرفی شوید؟** پروژه‌تان را در [#self-promotion در Discord](https://discord.gg/clawd) به اشتراک بگذارید یا [@openclaw را در X تگ کنید](https://x.com/openclaw).
</Info>

## تازه از Discord

نمونه‌های برجسته اخیر در کدنویسی، ابزارهای توسعه، موبایل، و ساخت محصول بومیِ چت.

<CardGroup cols={2}>

<Card title="بازخورد بازبینی PR در Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode تغییر را تمام می‌کند، یک PR باز می‌کند، OpenClaw diff را بازبینی می‌کند و در Telegram با پیشنهادها به‌همراه یک حکم ادغام روشن پاسخ می‌دهد.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="بازخورد بازبینی PR در OpenClaw که در Telegram تحویل داده شده است" />
</Card>

<Card title="Skill سرداب شراب در چند دقیقه" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

از «Robby» (@openclaw) یک skill محلی برای سرداب شراب خواسته شد. یک خروجی CSV نمونه و یک مسیر ذخیره‌سازی درخواست می‌کند، سپس skill را می‌سازد و آزمایش می‌کند (۹۶۲ بطری در مثال).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw در حال ساخت یک skill محلی سرداب شراب از CSV" />
</Card>

<Card title="خلبان خودکار خرید Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

برنامه غذایی هفتگی، موارد همیشگی، رزرو بازه تحویل، تأیید سفارش. بدون API، فقط کنترل مرورگر.

  <img src="/assets/showcase/tesco-shop.jpg" alt="اتوماسیون خرید Tesco از طریق چت" />
</Card>

<Card title="SNAG از اسکرین‌شات به Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

یک ناحیه از صفحه را با کلید میانبر بگیرید، دید Gemini، و Markdown فوری در کلیپ‌بوردتان.

  <img src="/assets/showcase/snag.png" alt="ابزار SNAG از اسکرین‌شات به markdown" />
</Card>

<Card title="رابط کاربری Agents" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

اپ دسکتاپ برای مدیریت skills و فرمان‌ها در Agents، Claude، Codex و OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="اپ رابط کاربری Agents" />
</Card>

<Card title="یادداشت‌های صوتی Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

papla.media TTS را بسته‌بندی می‌کند و نتایج را به‌صورت یادداشت‌های صوتی Telegram می‌فرستد (بدون پخش خودکار آزاردهنده).

  <img src="/assets/showcase/papla-tts.jpg" alt="خروجی یادداشت صوتی Telegram از TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

ابزار کمکی نصب‌شده با Homebrew برای فهرست کردن، بازرسی و پایش نشست‌های محلی OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor در ClawHub" />
</Card>

<Card title="کنترل چاپگر سه‌بعدی Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

کنترل و عیب‌یابی چاپگرهای BambuLab: وضعیت، کارها، دوربین، AMS، کالیبراسیون و موارد بیشتر.

  <img src="/assets/showcase/bambu-cli.png" alt="skill مربوط به Bambu CLI در ClawHub" />
</Card>

<Card title="حمل‌ونقل وین (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

حرکت‌های لحظه‌ای، اختلال‌ها، وضعیت آسانسور، و مسیریابی برای حمل‌ونقل عمومی وین.

  <img src="/assets/showcase/wienerlinien.png" alt="skill مربوط به Wiener Linien در ClawHub" />
</Card>

<Card title="وعده‌های غذایی مدرسه ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

رزرو خودکار وعده‌های غذایی مدارس بریتانیا از طریق ParentPay. برای کلیک قابل‌اعتماد روی سلول‌های جدول از مختصات ماوس استفاده می‌کند.
</Card>

<Card title="آپلود R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

آپلود به Cloudflare R2/S3 و تولید لینک‌های دانلود امن ازپیش‌امضاشده. برای نمونه‌های OpenClaw راه‌دور مفید است.

  <img src="/assets/showcase/r2-upload.png" alt="skill آپلود R2 در ClawHub" />
</Card>

<Card title="اپ iOS از طریق Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

یک اپ کامل iOS با نقشه‌ها و ضبط صدا ساخته شد و کاملاً از طریق چت Telegram برای توزیع در App Store آماده شد.
</Card>

<Card title="دستیار سلامت Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

دستیار سلامت هوش مصنوعی شخصی که داده‌های حلقه Oura را با تقویم، قرارها و برنامه باشگاه یکپارچه می‌کند.

  <img src="/assets/showcase/oura-health.png" alt="دستیار سلامت حلقه Oura" />
</Card>

<Card title="تیم رؤیایی Kev (بیش از ۱۴ agent)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

بیش از ۱۴ agent زیر یک Gateway با یک هماهنگ‌کننده Opus 4.5 که کار را به workerهای Codex واگذار می‌کند. برای sandbox کردن agentها، [نوشتار فنی](https://github.com/adam91holt/orchestrated-ai-articles) و [Clawdspace](https://github.com/adam91holt/clawdspace) را ببینید.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI برای Linear که با گردش‌کارهای agentic (Claude Code، OpenClaw) یکپارچه می‌شود. issueها، پروژه‌ها و گردش‌کارها را از ترمینال مدیریت کنید.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

خواندن، ارسال و آرشیو پیام‌ها از طریق Beeper Desktop. از API محلی MCP در Beeper استفاده می‌کند تا agentها بتوانند همه چت‌های شما (iMessage، WhatsApp و موارد بیشتر) را در یک جا مدیریت کنند.
</Card>

</CardGroup>

## اتوماسیون و گردش‌کارها

زمان‌بندی، کنترل مرورگر، حلقه‌های پشتیبانی، و بخش «فقط این کار را برایم انجام بده» محصول.

<CardGroup cols={2}>

<Card title="کنترل دستگاه تصفیه هوای Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code کنترل‌های دستگاه تصفیه را کشف و تأیید کرد، سپس OpenClaw مسئول مدیریت کیفیت هوای اتاق می‌شود.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="کنترل دستگاه تصفیه هوای Winix از طریق OpenClaw" />
</Card>

<Card title="عکس‌های زیبای دوربین آسمان" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

با یک دوربین روی بام فعال می‌شود: از OpenClaw بخواهید هر وقت آسمان زیبا به نظر می‌رسد یک عکس از آسمان بگیرد. یک skill طراحی کرد و عکس را گرفت.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="نماگرفت آسمان از دوربین بام که توسط OpenClaw ثبت شده است" />
</Card>

<Card title="صحنه تصویری گزارش صبحگاهی" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

یک پرامپت زمان‌بندی‌شده هر صبح یک تصویر صحنه تولید می‌کند (آب‌وهوا، کارها، تاریخ، پست یا نقل‌قول محبوب) از طریق یک شخصیت OpenClaw.
</Card>

<Card title="رزرو زمین پدل" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

بررسی‌کننده دسترس‌پذیری Playtomic به‌همراه CLI رزرو. دیگر هیچ زمین خالی را از دست ندهید.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="اسکرین‌شات padel-cli" />
</Card>

<Card title="دریافت ورودی حسابداری" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

PDFها را از ایمیل جمع‌آوری می‌کند و اسناد را برای مشاور مالیاتی آماده می‌کند. حسابداری ماهانه روی خلبان خودکار.
</Card>

<Card title="حالت توسعه از روی کاناپه" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

یک سایت شخصی کامل را از طریق Telegram در حال تماشای Netflix دوباره ساخت — از Notion به Astro، ۱۸ پست مهاجرت داده شد، DNS به Cloudflare. هرگز لپ‌تاپ را باز نکرد.
</Card>

<Card title="agent جست‌وجوی کار" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

آگهی‌های شغلی را جست‌وجو می‌کند، آن‌ها را با کلیدواژه‌های CV تطبیق می‌دهد، و فرصت‌های مرتبط را با لینک‌ها برمی‌گرداند. در ۳۰ دقیقه با استفاده از JSearch API ساخته شد.
</Card>

<Card title="سازنده skill برای Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw به Jira متصل شد، سپس در لحظه یک skill جدید تولید کرد (پیش از آنکه در ClawHub وجود داشته باشد).
</Card>

<Card title="skill مربوط به Todoist از طریق Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

کارهای Todoist را خودکار کرد و OpenClaw را واداشت skill را مستقیماً در چت Telegram تولید کند.
</Card>

<Card title="تحلیل TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

از طریق اتوماسیون مرورگر وارد TradingView می‌شود، از نمودارها اسکرین‌شات می‌گیرد، و بنا به درخواست تحلیل تکنیکال انجام می‌دهد. نیازی به API نیست — فقط کنترل مرورگر.
</Card>

<Card title="پشتیبانی خودکار Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

یک کانال Slack شرکتی را پایش می‌کند، پاسخ‌های مفید می‌دهد، و اعلان‌ها را به Telegram فوروارد می‌کند. بدون آنکه از او خواسته شود، یک باگ تولیدی را در یک اپ مستقرشده به‌طور خودمختار رفع کرد.
</Card>

</CardGroup>

## دانش و حافظه

سیستم‌هایی که دانش شخصی یا تیمی را ایندکس می‌کنند، جست‌وجو می‌کنند، به خاطر می‌سپارند و روی آن استدلال می‌کنند.

<CardGroup cols={2}>

<Card title="یادگیری چینی xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

موتور یادگیری چینی با بازخورد تلفظ و جریان‌های مطالعه از طریق OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="بازخورد تلفظ xuezh" />
</Card>

<Card title="خزانه حافظه WhatsApp" icon="vault">
  **Community** • `memory` `transcription` `indexing`

خروجی‌های کامل WhatsApp را دریافت می‌کند، بیش از ۱۰۰۰ یادداشت صوتی را رونویسی می‌کند، با لاگ‌های git مقابله می‌کند، و گزارش‌های markdown لینک‌دار خروجی می‌دهد.
</Card>

<Card title="جست‌وجوی معنایی Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

با استفاده از Qdrant به‌همراه embeddingهای OpenAI یا Ollama، جست‌وجوی برداری را به نشانک‌های Karakeep اضافه می‌کند.
</Card>

<Card title="حافظه Inside-Out-2" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

مدیر حافظه جداگانه‌ای که فایل‌های نشست را به خاطره‌ها، سپس باورها، و بعد به یک مدل خودِ در حال تکامل تبدیل می‌کند.
</Card>

</CardGroup>

## صدا و تلفن

نقاط ورود گفتارمحور، پل‌های تلفنی، و گردش‌کارهای سنگین از نظر رونویسی.

<CardGroup cols={2}>

<Card title="پل تلفنی Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

دستیار صوتی Vapi به پل HTTP برای OpenClaw. تماس‌های تلفنی تقریباً بلادرنگ با agent شما.
</Card>

<Card title="رونویسی OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

رونویسی صوتی چندزبانه از طریق OpenRouter (Gemini و موارد بیشتر). در ClawHub در دسترس است.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="skill رونویسی OpenRouter در ClawHub" />
</Card>

</CardGroup>

## زیرساخت و استقرار

بسته‌بندی، استقرار، و یکپارچه‌سازی‌هایی که اجرای OpenClaw و گسترش آن را آسان‌تر می‌کنند.

<CardGroup cols={2}>

<Card title="افزونه Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway مربوط به OpenClaw که روی Home Assistant OS با پشتیبانی از تونل SSH و وضعیت پایدار اجرا می‌شود.
</Card>

<Card title="مهارت Home Assistant" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

دستگاه‌های Home Assistant را با زبان طبیعی کنترل و خودکارسازی کنید.

  <img src="/assets/showcase/homeassistant.png" alt="مهارت Home Assistant در ClawHub" />
</Card>

<Card title="بسته‌بندی Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

پیکربندی nixified برای OpenClaw با امکانات کامل، برای استقرارهای بازتولیدپذیر.
</Card>

<Card title="تقویم CalDAV" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

مهارت تقویم با استفاده از khal و vdirsyncer. یکپارچه‌سازی تقویم خودمیزبان.

  <img src="/assets/showcase/caldav-calendar.png" alt="مهارت تقویم CalDAV در ClawHub" />
</Card>

</CardGroup>

## خانه و سخت‌افزار

بخش جهان فیزیکی OpenClaw: خانه‌ها، حسگرها، دوربین‌ها، جاروبرقی‌ها و دستگاه‌های دیگر.

<CardGroup cols={2}>

<Card title="خودکارسازی GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

خودکارسازی خانه به‌صورت بومی Nix با OpenClaw به‌عنوان رابط، به‌همراه داشبوردهای Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="داشبورد Grafana برای GoHome" />
</Card>

<Card title="جاروبرقی Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

جاروبرقی رباتیک Roborock خود را از طریق گفت‌وگوی طبیعی کنترل کنید.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="وضعیت Roborock" />
</Card>

</CardGroup>

## پروژه‌های جامعه

چیزهایی که از یک گردش‌کار منفرد فراتر رفتند و به محصولات یا زیست‌بوم‌های گسترده‌تر تبدیل شدند.

<CardGroup cols={2}>

<Card title="بازار StarSwap" icon="star" href="https://star-swap.com/">
  **جامعه** • `marketplace` `astronomy` `webapp`

بازار کامل تجهیزات نجومی. ساخته‌شده با و پیرامون زیست‌بوم OpenClaw.
</Card>

</CardGroup>

## پروژه خود را ارسال کنید

<Steps>
  <Step title="آن را به‌اشتراک بگذارید">
    در [#self-promotion در Discord](https://discord.gg/clawd) پست کنید یا [برای @openclaw توییت کنید](https://x.com/openclaw).
  </Step>
  <Step title="جزئیات را بگنجانید">
    به ما بگویید چه کاری انجام می‌دهد، به مخزن یا دمو پیوند بدهید، و اگر اسکرین‌شات دارید، آن را به‌اشتراک بگذارید.
  </Step>
  <Step title="برگزیده شوید">
    پروژه‌های برجسته را به این صفحه اضافه خواهیم کرد.
  </Step>
</Steps>

## مرتبط

- [شروع به کار](/fa/start/getting-started)
- [OpenClaw](/fa/start/openclaw)
