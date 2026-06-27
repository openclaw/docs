---
description: Real-world OpenClaw projects from the community
read_when:
    - در جست‌وجوی نمونه‌های واقعی استفاده از OpenClaw
    - به‌روزرسانی نکات برجستهٔ پروژه‌های جامعه کاربری
summary: پروژه‌ها و یکپارچه‌سازی‌های ساخته‌شده توسط جامعه که با OpenClaw قدرت می‌گیرند
title: ویترین
x-i18n:
    generated_at: "2026-06-27T18:54:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 999f89403c1d022e795c0017e5aa7543a4a021ba98cf601b37ce2835136a86a1
    source_path: start/showcase.md
    workflow: 16
---

پروژه‌های OpenClaw دموهای اسباب‌بازی نیستند. افراد در حال عرضهٔ چرخه‌های بازبینی PR، اپلیکیشن‌های موبایل، اتوماسیون خانگی، سیستم‌های صوتی، ابزارهای توسعه، و گردش‌کارهای سنگین از نظر حافظه از همان کانال‌هایی هستند که از قبل استفاده می‌کنند — ساخت‌های بومیِ چت روی Telegram، WhatsApp، Discord و ترمینال‌ها؛ اتوماسیون واقعی برای رزرو، خرید و پشتیبانی بدون انتظار برای API؛ و یکپارچه‌سازی‌های دنیای فیزیکی با چاپگرها، جاروبرقی‌ها، دوربین‌ها، و سیستم‌های خانگی.

<Info>
**می‌خواهید معرفی شوید؟** پروژهٔ خود را در [#self-promotion در Discord](https://discord.gg/clawd) به اشتراک بگذارید یا [@openclaw را در X تگ کنید](https://x.com/openclaw).
</Info>

## تازه‌های Discord

نمونه‌های برجستهٔ اخیر در کدنویسی، ابزارهای توسعه، موبایل، و ساخت محصول بومیِ چت.

<CardGroup cols={2}>

<Card title="بازبینی PR تا بازخورد Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode تغییر را تمام می‌کند، یک PR باز می‌کند، OpenClaw diff را بازبینی می‌کند و در Telegram با پیشنهادها به‌همراه یک حکم روشن برای ادغام پاسخ می‌دهد.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="بازخورد بازبینی PR از OpenClaw که در Telegram تحویل داده شده است" />
</Card>

<Card title="Skill انبار شراب در چند دقیقه" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

از "Robby" (@openclaw) یک skill محلی برای انبار شراب خواسته شد. یک خروجی CSV نمونه و مسیر ذخیره‌سازی درخواست می‌کند، سپس skill را می‌سازد و آزمایش می‌کند (در نمونه، ۹۶۲ بطری).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw در حال ساخت یک skill محلی انبار شراب از CSV" />
</Card>

<Card title="خلبان خودکار خرید Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

برنامهٔ غذایی هفتگی، اقلام همیشگی، رزرو بازهٔ تحویل، تأیید سفارش. بدون API، فقط کنترل مرورگر.

  <img src="/assets/showcase/tesco-shop.jpg" alt="اتوماسیون خرید Tesco از طریق چت" />
</Card>

<Card title="SNAG تبدیل اسکرین‌شات به Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

با کلید میانبر یک ناحیه از صفحه را انتخاب کنید، Gemini vision، و Markdown فوری در کلیپ‌بوردتان.

  <img src="/assets/showcase/snag.png" alt="ابزار SNAG برای تبدیل اسکرین‌شات به markdown" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

اپلیکیشن دسکتاپ برای مدیریت skills و فرمان‌ها میان Agents، Claude، Codex و OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="اپلیکیشن Agents UI" />
</Card>

<Card title="یادداشت‌های صوتی Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

papla.media TTS را بسته‌بندی می‌کند و نتایج را به‌صورت یادداشت صوتی Telegram می‌فرستد (بدون پخش خودکار آزاردهنده).

  <img src="/assets/showcase/papla-tts.jpg" alt="خروجی یادداشت صوتی Telegram از TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

ابزار کمکی نصب‌شده با Homebrew برای فهرست‌کردن، بررسی، و پایش نشست‌های محلی OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor روی ClawHub" />
</Card>

<Card title="کنترل چاپگر سه‌بعدی Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

کنترل و عیب‌یابی چاپگرهای BambuLab: وضعیت، کارها، دوربین، AMS، کالیبراسیون، و موارد بیشتر.

  <img src="/assets/showcase/bambu-cli.png" alt="skill مربوط به Bambu CLI روی ClawHub" />
</Card>

<Card title="حمل‌ونقل وین (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

حرکت‌های لحظه‌ای، اختلال‌ها، وضعیت آسانسور، و مسیریابی برای حمل‌ونقل عمومی وین.

  <img src="/assets/showcase/wienerlinien.png" alt="skill مربوط به Wiener Linien روی ClawHub" />
</Card>

<Card title="وعده‌های مدرسه ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

رزرو خودکار وعدهٔ مدرسه در بریتانیا از طریق ParentPay. برای کلیک قابل‌اعتماد روی خانه‌های جدول از مختصات ماوس استفاده می‌کند.
</Card>

<Card title="بارگذاری R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

بارگذاری در Cloudflare R2/S3 و تولید لینک‌های دانلود امن و از پیش امضاشده. برای نمونه‌های راه دور OpenClaw مفید است.

  <img src="/assets/showcase/r2-upload.png" alt="skill بارگذاری R2 روی ClawHub" />
</Card>

<Card title="اپلیکیشن iOS از طریق Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

یک اپلیکیشن کامل iOS با نقشه‌ها و ضبط صدا ساخته شد و کاملاً از طریق چت Telegram روی TestFlight منتشر شد.

  <img src="/assets/showcase/ios-testflight.jpg" alt="اپلیکیشن iOS روی TestFlight" />
</Card>

<Card title="دستیار سلامت Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

دستیار سلامت شخصی مبتنی بر AI که داده‌های Oura ring را با تقویم، قرارها، و برنامهٔ باشگاه یکپارچه می‌کند.

  <img src="/assets/showcase/oura-health.png" alt="دستیار سلامت Oura ring" />
</Card>

<Card title="تیم رؤیایی Kev (بیش از ۱۴ عامل)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

بیش از ۱۴ عامل زیر یک gateway با یک هماهنگ‌کنندهٔ Opus 4.5 که کارها را به کارگران Codex واگذار می‌کند. برای سندباکس‌کردن عامل‌ها، [شرح فنی](https://github.com/adam91holt/orchestrated-ai-articles) و [Clawdspace](https://github.com/adam91holt/clawdspace) را ببینید.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI برای Linear که با گردش‌کارهای عامل‌محور (Claude Code، OpenClaw) یکپارچه می‌شود. مسائل، پروژه‌ها، و گردش‌کارها را از ترمینال مدیریت کنید.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

خواندن، ارسال، و بایگانی پیام‌ها از طریق Beeper Desktop. از API محلی MCP در Beeper استفاده می‌کند تا عامل‌ها بتوانند همهٔ چت‌های شما (iMessage، WhatsApp، و موارد بیشتر) را در یک مکان مدیریت کنند.
</Card>

</CardGroup>

## اتوماسیون و گردش‌کارها

زمان‌بندی، کنترل مرورگر، چرخه‌های پشتیبانی، و بخش «فقط این کار را برایم انجام بده» محصول.

<CardGroup cols={2}>

<Card title="کنترل تصفیه‌کنندهٔ هوای Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code کنترل‌های تصفیه‌کننده را کشف و تأیید کرد، سپس OpenClaw مدیریت کیفیت هوای اتاق را بر عهده می‌گیرد.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="کنترل تصفیه‌کنندهٔ هوای Winix از طریق OpenClaw" />
</Card>

<Card title="عکس‌های زیبای دوربین آسمان" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

با یک دوربین سقفی فعال می‌شود: از OpenClaw بخواهید هر وقت آسمان زیبا به نظر می‌رسد، یک عکس از آسمان بگیرد. یک skill طراحی کرد و عکس را گرفت.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="تصویر فوری آسمان با دوربین سقفی که OpenClaw ثبت کرده است" />
</Card>

<Card title="صحنهٔ تصویری گزارش صبحگاهی" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

یک prompt زمان‌بندی‌شده هر صبح یک تصویر صحنه تولید می‌کند (هوا، کارها، تاریخ، پست یا نقل‌قول محبوب) از طریق یک شخصیت OpenClaw.
</Card>

<Card title="رزرو زمین پادل" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

بررسی‌کنندهٔ ظرفیت Playtomic به‌همراه CLI رزرو. دیگر هرگز زمین خالی را از دست ندهید.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="اسکرین‌شات padel-cli" />
</Card>

<Card title="دریافت اسناد حسابداری" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

PDFها را از ایمیل جمع‌آوری می‌کند و اسناد را برای مشاور مالیاتی آماده می‌سازد. حسابداری ماهانه با خلبان خودکار.
</Card>

<Card title="حالت توسعهٔ تنبلانه روی کاناپه" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

یک سایت شخصی کامل را هنگام تماشای Netflix از طریق Telegram بازسازی کرد — از Notion به Astro، مهاجرت ۱۸ پست، DNS به Cloudflare. هرگز لپ‌تاپ را باز نکرد.
</Card>

<Card title="عامل جستجوی شغل" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

آگهی‌های شغلی را جستجو می‌کند، آن‌ها را با کلیدواژه‌های CV تطبیق می‌دهد، و فرصت‌های مرتبط را با لینک‌ها برمی‌گرداند. با استفاده از JSearch API در ۳۰ دقیقه ساخته شد.
</Card>

<Card title="سازندهٔ skill برای Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw به Jira وصل شد، سپس در لحظه یک skill جدید تولید کرد (پیش از آنکه روی ClawHub وجود داشته باشد).
</Card>

<Card title="skill مربوط به Todoist از طریق Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

کارهای Todoist را خودکار کرد و OpenClaw را واداشت skill را مستقیماً در چت Telegram تولید کند.
</Card>

<Card title="تحلیل TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

از طریق اتوماسیون مرورگر وارد TradingView می‌شود، از نمودارها اسکرین‌شات می‌گیرد، و در صورت درخواست تحلیل تکنیکال انجام می‌دهد. نیازی به API نیست — فقط کنترل مرورگر.
</Card>

<Card title="پشتیبانی خودکار Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

یک کانال Slack شرکت را پایش می‌کند، پاسخ‌های مفید می‌دهد، و اعلان‌ها را به Telegram ارسال می‌کند. بدون اینکه از او خواسته شود، یک باگ تولید را در یک اپلیکیشن مستقرشده به‌صورت خودکار برطرف کرد.
</Card>

</CardGroup>

## دانش و حافظه

سیستم‌هایی که دانش شخصی یا تیمی را نمایه‌سازی، جستجو، به خاطر سپردن، و روی آن استدلال می‌کنند.

<CardGroup cols={2}>

<Card title="یادگیری چینی xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

موتور یادگیری چینی با بازخورد تلفظ و جریان‌های مطالعه از طریق OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="بازخورد تلفظ xuezh" />
</Card>

<Card title="گنجینهٔ حافظه WhatsApp" icon="vault">
  **Community** • `memory` `transcription` `indexing`

خروجی‌های کامل WhatsApp را وارد می‌کند، بیش از ۱۰۰۰ یادداشت صوتی را رونویسی می‌کند، با logهای git تطبیق می‌دهد، و گزارش‌های markdown لینک‌دار تولید می‌کند.
</Card>

<Card title="جستجوی معنایی Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

با استفاده از Qdrant به‌همراه embeddingهای OpenAI یا Ollama، جستجوی برداری را به نشانک‌های Karakeep اضافه می‌کند.
</Card>

<Card title="حافظهٔ Inside-Out-2" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

مدیر حافظهٔ جداگانه‌ای که فایل‌های نشست را به خاطره‌ها، سپس باورها، و سپس یک مدل خودِ در حال تکامل تبدیل می‌کند.
</Card>

</CardGroup>

## صدا و تلفن

نقاط ورود گفتارمحور، پل‌های تلفنی، و گردش‌کارهای سنگین از نظر رونویسی.

<CardGroup cols={2}>

<Card title="پل تلفنی Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

پل HTTP از دستیار صوتی Vapi به OpenClaw. تماس‌های تلفنی تقریباً بلادرنگ با عامل شما.
</Card>

<Card title="رونویسی OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

رونویسی صوتی چندزبانه از طریق OpenRouter (Gemini، و موارد بیشتر). روی ClawHub در دسترس است.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="skill رونویسی OpenRouter روی ClawHub" />
</Card>

</CardGroup>

## زیرساخت و استقرار

بسته‌بندی، استقرار، و یکپارچه‌سازی‌هایی که اجرای OpenClaw و گسترش آن را آسان‌تر می‌کنند.

<CardGroup cols={2}>

<Card title="افزونهٔ Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

OpenClaw gateway در حال اجرا روی Home Assistant OS با پشتیبانی از تونل SSH و وضعیت پایدار.
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

دستگاه‌های Home Assistant را با زبان طبیعی کنترل و خودکارسازی کنید.

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant skill on ClawHub" />
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

پیکربندی OpenClaw مبتنی بر Nix و آماده‌به‌کار برای استقرارهای تکرارپذیر.
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

مهارت تقویم با استفاده از khal و vdirsyncer. یکپارچه‌سازی تقویم خودمیزبان.

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV calendar skill on ClawHub" />
</Card>

</CardGroup>

## خانه و سخت‌افزار

بخش دنیای فیزیکی OpenClaw: خانه‌ها، حسگرها، دوربین‌ها، جاروبرقی‌ها، و دستگاه‌های دیگر.

<CardGroup cols={2}>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

خودکارسازی خانه با رویکرد بومی Nix و OpenClaw به‌عنوان رابط، به‌همراه داشبوردهای Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

جاروبرقی رباتی Roborock خود را از طریق گفت‌وگوی طبیعی کنترل کنید.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## پروژه‌های جامعه

چیزهایی که از یک گردش‌کار منفرد فراتر رفتند و به محصولات یا اکوسیستم‌های گسترده‌تر تبدیل شدند.

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **جامعه** • `marketplace` `astronomy` `webapp`

بازار کامل تجهیزات نجومی. ساخته‌شده با اکوسیستم OpenClaw و پیرامون آن.
</Card>

</CardGroup>

## پروژه خود را ارسال کنید

<Steps>
  <Step title="Share it">
    در [#self-promotion در Discord](https://discord.gg/clawd) پست بگذارید یا [به @openclaw توییت کنید](https://x.com/openclaw).
  </Step>
  <Step title="Include details">
    به ما بگویید چه کاری انجام می‌دهد، به مخزن یا نسخه نمایشی لینک بدهید، و اگر اسکرین‌شات دارید آن را به اشتراک بگذارید.
  </Step>
  <Step title="Get featured">
    پروژه‌های برجسته را به این صفحه اضافه می‌کنیم.
  </Step>
</Steps>

## مرتبط

- [شروع به کار](/fa/start/getting-started)
- [OpenClaw](/fa/start/openclaw)
