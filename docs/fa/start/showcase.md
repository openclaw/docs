---
description: Real-world OpenClaw projects from the community
read_when:
    - به‌دنبال نمونه‌های واقعی استفاده از OpenClaw
    - به‌روزرسانی نکات برجستهٔ پروژه‌های جامعه
summary: پروژه‌ها و یکپارچه‌سازی‌های ساخته‌شده توسط جامعه و مبتنی بر OpenClaw
title: ویترین
x-i18n:
    generated_at: "2026-04-29T23:37:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: db901336bb0814eae93453331a58aa267024afeb53f259f5e2a4d71df1039ad2
    source_path: start/showcase.md
    workflow: 16
---

پروژه‌های OpenClaw دموهای اسباب‌بازی نیستند. افراد در حال ارائه‌ی چرخه‌های بازبینی PR، اپلیکیشن‌های موبایل، اتوماسیون خانگی، سیستم‌های صوتی، ابزارهای توسعه، و گردش‌کارهای سنگین از نظر حافظه از همان کانال‌هایی هستند که از قبل استفاده می‌کنند — ساخت‌های بومیِ چت روی Telegram، WhatsApp، Discord، و ترمینال‌ها؛ اتوماسیون واقعی برای رزرو، خرید، و پشتیبانی بدون انتظار برای API؛ و یکپارچه‌سازی‌های دنیای فیزیکی با چاپگرها، جاروبرقی‌ها، دوربین‌ها، و سیستم‌های خانگی.

<Info>
**می‌خواهید معرفی شوید؟** پروژه‌ی خود را در [#self-promotion در Discord](https://discord.gg/clawd) به اشتراک بگذارید یا [@openclaw را در X تگ کنید](https://x.com/openclaw).
</Info>

## ویدیوها

اگر کوتاه‌ترین مسیر را از «این چیست؟» تا «خب، فهمیدم» می‌خواهید، از اینجا شروع کنید.

<CardGroup cols={3}>

<Card title="راهنمای کامل راه‌اندازی" href="https://www.youtube.com/watch?v=SaWSPZoPX34">
  VelvetShark، ۲۸ دقیقه. نصب، آماده‌سازی، و رسیدن به نخستین دستیارِ کارآمد از ابتدا تا انتها.
</Card>

<Card title="نمایش گزیده‌ی جامعه" href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">
  مروری سریع‌تر بر پروژه‌ها، سطوح، و گردش‌کارهای واقعی ساخته‌شده پیرامون OpenClaw.
</Card>

<Card title="پروژه‌ها در دنیای واقعی" href="https://www.youtube.com/watch?v=5kkIJNUGFho">
  نمونه‌هایی از جامعه، از چرخه‌های کدنویسی بومیِ چت تا سخت‌افزار و اتوماسیون شخصی.
</Card>

</CardGroup>

## تازه‌ها از Discord

نمونه‌های برجسته‌ی اخیر در کدنویسی، ابزارهای توسعه، موبایل، و ساخت محصول بومیِ چت.

<CardGroup cols={2}>

<Card title="بازبینی PR تا بازخورد Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode تغییر را تمام می‌کند، یک PR باز می‌کند، OpenClaw تفاوت‌ها را بازبینی می‌کند و در Telegram با پیشنهادها به‌همراه یک نظر روشن درباره‌ی ادغام پاسخ می‌دهد.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="بازخورد بازبینی PR توسط OpenClaw که در Telegram تحویل داده شده است" />
</Card>

<Card title="Skill سرداب شراب در چند دقیقه" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

از «Robby» (@openclaw) یک Skill محلی برای سرداب شراب خواسته شد. یک خروجی CSV نمونه و مسیر ذخیره‌سازی درخواست می‌کند، سپس Skill را می‌سازد و آزمایش می‌کند (در مثال، ۹۶۲ بطری).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw در حال ساخت یک Skill محلی سرداب شراب از CSV" />
</Card>

<Card title="خلبان خودکار خرید Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

برنامه‌ی غذایی هفتگی، موارد همیشگی، رزرو بازه‌ی تحویل، تأیید سفارش. بدون API، فقط کنترل مرورگر.

  <img src="/assets/showcase/tesco-shop.jpg" alt="اتوماسیون خرید Tesco از طریق چت" />
</Card>

<Card title="SNAG از اسکرین‌شات به Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

با کلید میانبر یک ناحیه از صفحه را انتخاب کنید، Gemini vision، و Markdown فوری در کلیپ‌بوردتان.

  <img src="/assets/showcase/snag.png" alt="ابزار SNAG برای تبدیل اسکرین‌شات به markdown" />
</Card>

<Card title="رابط کاربری Agents" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

اپلیکیشن دسکتاپ برای مدیریت Skills و فرمان‌ها در Agents، Claude، Codex، و OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="اپلیکیشن رابط کاربری Agents" />
</Card>

<Card title="یادداشت‌های صوتی Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

TTS متعلق به papla.media را پوشش می‌دهد و نتایج را به‌صورت یادداشت صوتی Telegram می‌فرستد (بدون پخش خودکار آزاردهنده).

  <img src="/assets/showcase/papla-tts.jpg" alt="خروجی یادداشت صوتی Telegram از TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

کمک‌ابزار نصب‌شده با Homebrew برای فهرست‌کردن، بررسی، و پایش نشست‌های محلی OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor در ClawHub" />
</Card>

<Card title="کنترل چاپگر سه‌بعدی Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

کنترل و عیب‌یابی چاپگرهای BambuLab: وضعیت، کارها، دوربین، AMS، کالیبراسیون، و موارد بیشتر.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill مربوط به Bambu CLI در ClawHub" />
</Card>

<Card title="حمل‌ونقل وین (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

حرکت‌های بی‌درنگ، اختلال‌ها، وضعیت آسانسور، و مسیریابی برای حمل‌ونقل عمومی وین.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill مربوط به Wiener Linien در ClawHub" />
</Card>

<Card title="وعده‌های مدرسه ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

رزرو خودکار وعده‌های مدرسه در بریتانیا از طریق ParentPay. برای کلیک قابل‌اعتماد روی سلول‌های جدول از مختصات ماوس استفاده می‌کند.
</Card>

<Card title="آپلود R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

آپلود به Cloudflare R2/S3 و تولید لینک‌های دانلود امنِ ازپیش‌امضاشده. برای نمونه‌های OpenClaw راه‌دور مفید است.
</Card>

<Card title="اپلیکیشن iOS از طریق Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

یک اپلیکیشن کامل iOS با نقشه‌ها و ضبط صدا ساخته شد و کاملاً از طریق چت Telegram روی TestFlight منتشر شد.

  <img src="/assets/showcase/ios-testflight.jpg" alt="اپلیکیشن iOS روی TestFlight" />
</Card>

<Card title="دستیار سلامت Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

دستیار سلامت هوش مصنوعی شخصی که داده‌های حلقه‌ی Oura را با تقویم، قرارها، و برنامه‌ی باشگاه یکپارچه می‌کند.

  <img src="/assets/showcase/oura-health.png" alt="دستیار سلامت حلقه‌ی Oura" />
</Card>

<Card title="تیم رؤیایی Kev (بیش از ۱۴ عامل)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

بیش از ۱۴ عامل زیر یک Gateway با یک هماهنگ‌کننده‌ی Opus 4.5 که کار را به کارگران Codex واگذار می‌کند. برای سندباکس‌کردن عامل‌ها، [نوشتار فنی](https://github.com/adam91holt/orchestrated-ai-articles) و [Clawdspace](https://github.com/adam91holt/clawdspace) را ببینید.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI برای Linear که با گردش‌کارهای عاملی (Claude Code، OpenClaw) یکپارچه می‌شود. مسئله‌ها، پروژه‌ها، و گردش‌کارها را از ترمینال مدیریت کنید.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

خواندن، ارسال، و بایگانی پیام‌ها از طریق Beeper Desktop. از API محلی MCP در Beeper استفاده می‌کند تا عامل‌ها بتوانند همه‌ی چت‌های شما (iMessage، WhatsApp، و موارد بیشتر) را در یک مکان مدیریت کنند.
</Card>

</CardGroup>

## اتوماسیون و گردش‌کارها

زمان‌بندی، کنترل مرورگر، چرخه‌های پشتیبانی، و جنبه‌ی «فقط این کار را برایم انجام بده» در محصول.

<CardGroup cols={2}>

<Card title="کنترل تصفیه‌کننده‌ی هوای Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code کنترل‌های تصفیه‌کننده را کشف و تأیید کرد، سپس OpenClaw مدیریت کیفیت هوای اتاق را بر عهده می‌گیرد.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="کنترل تصفیه‌کننده‌ی هوای Winix از طریق OpenClaw" />
</Card>

<Card title="عکس‌های زیبای دوربین آسمان" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

با یک دوربین سقفی فعال می‌شود: از OpenClaw بخواهید هر وقت آسمان زیبا به نظر می‌رسد یک عکس از آن بگیرد. یک Skill طراحی کرد و عکس را گرفت.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="نمای آسمان با دوربین سقفی که توسط OpenClaw ثبت شده است" />
</Card>

<Card title="صحنه‌ی بصری گزارش صبحگاهی" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

یک پرامپت زمان‌بندی‌شده هر صبح از طریق یک شخصیت OpenClaw یک تصویر صحنه تولید می‌کند (آب‌وهوا، کارها، تاریخ، پست یا نقل‌قول محبوب).
</Card>

<Card title="رزرو زمین پدل" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

بررسی‌کننده‌ی ظرفیت Playtomic به‌همراه CLI رزرو. دیگر هیچ زمین آزادی را از دست ندهید.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="اسکرین‌شات padel-cli" />
</Card>

<Card title="دریافت ورودی حسابداری" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

PDFها را از ایمیل جمع‌آوری می‌کند و اسناد را برای مشاور مالیاتی آماده می‌کند. حسابداری ماهانه با خلبان خودکار.
</Card>

<Card title="حالت توسعه‌ی تنبل روی مبل" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

بازسازی کامل یک سایت شخصی از طریق Telegram هنگام تماشای Netflix — مهاجرت از Notion به Astro، انتقال ۱۸ پست، DNS به Cloudflare. هرگز لپ‌تاپ باز نشد.
</Card>

<Card title="عامل جست‌وجوی شغل" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

آگهی‌های شغلی را جست‌وجو می‌کند، با کلیدواژه‌های رزومه تطبیق می‌دهد، و فرصت‌های مرتبط را با لینک‌ها برمی‌گرداند. در ۳۰ دقیقه با استفاده از JSearch API ساخته شد.
</Card>

<Card title="سازنده‌ی Skill برای Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw به Jira متصل شد، سپس در لحظه یک Skill جدید تولید کرد (پیش از آنکه روی ClawHub وجود داشته باشد).
</Card>

<Card title="Skill مربوط به Todoist از طریق Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

کارهای Todoist را خودکار کرد و OpenClaw را واداشت Skill را مستقیماً در چت Telegram تولید کند.
</Card>

<Card title="تحلیل TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

از طریق اتوماسیون مرورگر وارد TradingView می‌شود، از نمودارها اسکرین‌شات می‌گیرد، و در صورت درخواست تحلیل تکنیکال انجام می‌دهد. نیازی به API نیست — فقط کنترل مرورگر.
</Card>

<Card title="پشتیبانی خودکار Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

یک کانال شرکتی Slack را زیر نظر می‌گیرد، پاسخ‌های مفید می‌دهد، و اعلان‌ها را به Telegram می‌فرستد. به‌صورت خودمختار و بدون درخواست، یک باگ تولیدی را در یک اپلیکیشن مستقرشده رفع کرد.
</Card>

</CardGroup>

## دانش و حافظه

سیستم‌هایی که دانش شخصی یا تیمی را نمایه‌سازی، جست‌وجو، به‌خاطر سپرده، و درباره‌ی آن استدلال می‌کنند.

<CardGroup cols={2}>

<Card title="یادگیری چینی xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

موتور یادگیری چینی با بازخورد تلفظ و جریان‌های مطالعه از طریق OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="بازخورد تلفظ xuezh" />
</Card>

<Card title="گاوصندوق حافظه‌ی WhatsApp" icon="vault">
  **Community** • `memory` `transcription` `indexing`

خروجی‌های کامل WhatsApp را وارد می‌کند، بیش از ۱ هزار یادداشت صوتی را رونویسی می‌کند، با لاگ‌های git تطبیق متقابل می‌دهد، و گزارش‌های markdown لینک‌شده تولید می‌کند.
</Card>

<Card title="جست‌وجوی معنایی Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

جست‌وجوی برداری را با استفاده از Qdrant به‌همراه embeddings از OpenAI یا Ollama به نشانک‌های Karakeep اضافه می‌کند.
</Card>

<Card title="حافظه‌ی Inside-Out-2" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

مدیر حافظه‌ی جداگانه‌ای که فایل‌های نشست را به خاطره‌ها، سپس باورها، و سپس یک مدل خودِ در حال تکامل تبدیل می‌کند.
</Card>

</CardGroup>

## صدا و تلفن

نقاط ورود گفتار-محور، پل‌های تلفنی، و گردش‌کارهای سنگین از نظر رونویسی.

<CardGroup cols={2}>

<Card title="پل تلفنی Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

پل دستیار صوتی Vapi به HTTP در OpenClaw. تماس‌های تلفنی نزدیک به بی‌درنگ با عامل شما.
</Card>

<Card title="رونویسی OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

رونویسی صوتی چندزبانه از طریق OpenRouter (Gemini و موارد دیگر). در ClawHub در دسترس است.
</Card>

</CardGroup>

## زیرساخت و استقرار

بسته‌بندی، استقرار و یکپارچه‌سازی‌هایی که اجرای OpenClaw و گسترش آن را آسان‌تر می‌کنند.

<CardGroup cols={2}>

<Card title="افزونه Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway مربوط به OpenClaw که روی Home Assistant OS اجرا می‌شود، با پشتیبانی از تونل SSH و وضعیت پایدار.
</Card>

<Card title="skill مربوط به Home Assistant" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`

کنترل و خودکارسازی دستگاه‌های Home Assistant از طریق زبان طبیعی.
</Card>

<Card title="بسته‌بندی Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

پیکربندی nixified آماده‌به‌کار OpenClaw برای استقرارهای بازتولیدپذیر.
</Card>

<Card title="تقویم CalDAV" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`

Skill تقویم با استفاده از khal و vdirsyncer. یکپارچه‌سازی تقویم خودمیزبان.
</Card>

</CardGroup>

## خانه و سخت‌افزار

جنبه فیزیکی OpenClaw: خانه‌ها، حسگرها، دوربین‌ها، جاروبرقی‌ها و دستگاه‌های دیگر.

<CardGroup cols={2}>

<Card title="خودکارسازی GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

خودکارسازی خانه مبتنی بر Nix، با OpenClaw به‌عنوان رابط، به‌همراه داشبوردهای Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="داشبورد GoHome Grafana" />
</Card>

<Card title="جاروبرقی Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

جاروبرقی رباتیک Roborock خود را از طریق گفت‌وگوی طبیعی کنترل کنید.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="وضعیت Roborock" />
</Card>

</CardGroup>

## پروژه‌های جامعه کاربری

مواردی که از یک گردش‌کار منفرد فراتر رفتند و به محصولات یا اکوسیستم‌های گسترده‌تر تبدیل شدند.

<CardGroup cols={2}>

<Card title="بازار StarSwap" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`

بازار کامل تجهیزات نجومی. ساخته‌شده با اکوسیستم OpenClaw و پیرامون آن.
</Card>

</CardGroup>

## پروژه خود را ارسال کنید

<Steps>
  <Step title="آن را به اشتراک بگذارید">
    در [#self-promotion در Discord](https://discord.gg/clawd) پست کنید یا [به @openclaw توییت کنید](https://x.com/openclaw).
  </Step>
  <Step title="جزئیات را اضافه کنید">
    به ما بگویید چه کاری انجام می‌دهد، به مخزن یا نسخه نمایشی لینک دهید، و اگر اسکرین‌شات دارید آن را به اشتراک بگذارید.
  </Step>
  <Step title="برجسته شوید">
    ما پروژه‌های شاخص را به این صفحه اضافه می‌کنیم.
  </Step>
</Steps>

## مرتبط

- [شروع کار](/fa/start/getting-started)
- [OpenClaw](/fa/start/openclaw)
