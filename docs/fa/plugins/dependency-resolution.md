---
read_when:
    - شما در حال اشکال‌زدایی تعمیر وابستگی زمان اجرای Plugin همراه هستید
    - شما رفتار راه‌اندازی Plugin، doctor، یا نصب از طریق مدیر بسته را تغییر می‌دهید
    - شما در حال نگهداری نصب‌های بسته‌بندی‌شدهٔ OpenClaw یا مانیفست‌های Plugin همراه هستید
sidebarTitle: Dependencies
summary: OpenClaw چگونه وابستگی‌های زمان اجرای Pluginهای همراه را برنامه‌ریزی، مرحله‌بندی و ترمیم می‌کند
title: حل وابستگی‌های Plugin
x-i18n:
    generated_at: "2026-05-01T11:51:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: e09245c2b7e2f1fb2a61d64f0f9dc77e7df7da58fd71608c391e3865345b7bc9
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw همهٔ درخت وابستگی Pluginهای bundled را در زمان نصب package نصب نمی‌کند. ابتدا از config و فرادادهٔ Plugin یک طرح مؤثر Plugin استخراج می‌کند، سپس وابستگی‌های runtime را فقط برای Pluginهای bundled متعلق به OpenClaw که طرح واقعاً می‌تواند load کند stage می‌کند.

این صفحه وابستگی‌های runtime بسته‌بندی‌شده برای Pluginهای bundled OpenClaw را پوشش می‌دهد. Pluginهای شخص ثالث و مسیرهای سفارشی Plugin همچنان از فرمان‌های صریح نصب Plugin مانند `openclaw plugins install` و `openclaw plugins update` استفاده می‌کنند.

## تقسیم مسئولیت

OpenClaw مالک طرح و policy است:

- کدام Pluginها برای این config فعال هستند
- کدام ریشه‌های وابستگی قابل نوشتن یا فقط خواندنی هستند
- چه زمانی repair مجاز است
- کدام شناسه‌های Plugin برای startup stage می‌شوند
- بررسی‌های نهایی پیش از import کردن moduleهای runtime Plugin

مدیر package مالک همگرا کردن وابستگی‌ها است:

- resolution گراف package
- مدیریت وابستگی‌های production، optional و peer
- چیدمان `node_modules`
- یکپارچگی package
- فرادادهٔ lock و install

در عمل، OpenClaw باید تصمیم بگیرد چه چیزی باید وجود داشته باشد. `pnpm` یا `npm` باید filesystem را با آن تصمیم هماهنگ کند.

OpenClaw همچنین مالک قفل هماهنگی در سطح هر install root است. مدیران package از تراکنش نصب خودشان محافظت می‌کنند، اما نوشتن‌های manifest توسط OpenClaw، copy/rename در stage ایزوله، validation نهایی، یا import کردن Plugin را در برابر Gateway، doctor یا فرایند CLI دیگری که همان ریشهٔ وابستگی runtime را لمس می‌کند، serialize نمی‌کنند.

## طرح مؤثر Plugin

طرح مؤثر Plugin از config به‌علاوهٔ فرادادهٔ کشف‌شدهٔ Plugin استخراج می‌شود. این ورودی‌ها می‌توانند وابستگی‌های runtime Pluginهای bundled را فعال کنند:

- `plugins.entries.<id>.enabled`
- `plugins.allow`، `plugins.deny` و `plugins.enabled`
- config قدیمی channel مانند `channels.telegram.enabled`
- providerها، modelها یا ارجاع‌های backend در CLI که به یک Plugin نیاز دارند
- پیش‌فرض‌های manifest bundled مانند `enabledByDefault`
- index Plugin نصب‌شده و فرادادهٔ manifest bundled

غیرفعال‌سازی صریح مقدم است. یک Plugin غیرفعال، شناسهٔ Plugin ردشده، سیستم Plugin غیرفعال، یا channel غیرفعال، repair وابستگی runtime را trigger نمی‌کند. وضعیت auth ذخیره‌شده به‌تنهایی نیز یک channel یا provider bundled را فعال نمی‌کند.

طرح Plugin ورودی پایدار است. materialization وابستگی تولیدشده خروجی آن طرح است.

## جریان startup

startup در Gateway، config را parse می‌کند و پیش از load شدن moduleهای runtime Plugin، جدول lookup Pluginهای startup را می‌سازد. سپس startup وابستگی‌های runtime را فقط برای `startupPluginIds` انتخاب‌شده توسط آن طرح stage می‌کند.

برای نصب‌های packaged، staging وابستگی پیش از import کردن Plugin مجاز است. پس از staging، loader runtime، Pluginهای startup را با repair نصب غیرفعال import می‌کند؛ در آن نقطه، materialization وابستگی مفقود به‌عنوان failure در load در نظر گرفته می‌شود، نه یک loop دیگر برای repair.

وقتی staging وابستگی startup به بعد از HTTP bind موکول می‌شود، readiness در Gateway تا زمانی که وابستگی‌های Pluginهای startup انتخاب‌شده materialize شوند و runtime Plugin startup load شود، روی دلیل `plugin-runtime-deps` blocked می‌ماند.

## زمان اجرای repair

repair وابستگی runtime باید زمانی اجرا شود که یکی از این موارد درست باشد:

- طرح مؤثر Plugin تغییر کرده و Pluginهای bundled اضافه می‌کند که به وابستگی‌های runtime نیاز دارند
- manifest وابستگی تولیدشده دیگر با طرح مؤثر مطابقت ندارد
- sentinelهای package نصب‌شدهٔ مورد انتظار مفقود یا ناقص هستند
- `openclaw doctor --fix` یا `openclaw plugins deps --repair` درخواست شده است

repair وابستگی runtime نباید فقط به این دلیل اجرا شود که OpenClaw started است. یک startup عادی با طرح بدون تغییر و materialization کامل وابستگی باید کار مدیر package را skip کند.

فرمان‌هایی که config را ویرایش می‌کنند، Pluginها را فعال می‌کنند، یا یافته‌های doctor را repair می‌کنند، می‌توانند یک‌بار وارد حالت طرح Plugin شوند، وابستگی‌های bundled تازه موردنیاز را materialize کنند، سپس به جریان عادی فرمان برگردند. `openclaw onboard` محلی و `openclaw configure` پس از اینکه config را با موفقیت write کنند این کار را خودکار انجام می‌دهند، بنابراین اجرای بعدی Gateway پس از اینکه startup از قبل آغاز شده است packageهای bundled Plugin مفقود را کشف نمی‌کند. onboarding/configure از راه دور برای runtime deps محلی read-only می‌ماند.

## قانون hot reload

مسیرهای hot reload که می‌توانند Pluginهای فعال را تغییر دهند باید پیش از load کردن runtime Plugin دوباره از حالت طرح Plugin عبور کنند. reload باید طرح مؤثر جدید Plugin را با طرح قبلی compare کند، وابستگی‌های مفقود را برای Pluginهای bundled تازه فعال stage کند، سپس runtime تحت تأثیر را load یا restart کند.

اگر reload کردن config طرح مؤثر Plugin را تغییر ندهد، نباید وابستگی‌های runtime bundled را repair کند.

## اجرای مدیر package

OpenClaw یک manifest نصب تولیدشده برای وابستگی‌های runtime bundled انتخاب‌شده می‌نویسد و مدیر package را در install root وابستگی runtime اجرا می‌کند. وقتی `pnpm` در دسترس باشد آن را ترجیح می‌دهد و در غیر این صورت به runner `npm` bundled با Node fallback می‌کند.

مسیر `pnpm` از وابستگی‌های production استفاده می‌کند، lifecycle scriptها را غیرفعال می‌کند، workspace را نادیده می‌گیرد، و store را داخل install root نگه می‌دارد:

```bash
pnpm install \
  --prod \
  --ignore-scripts \
  --ignore-workspace \
  --config.frozen-lockfile=false \
  --config.minimum-release-age=0 \
  --config.store-dir=<install-root>/.openclaw-pnpm-store \
  --config.node-linker=hoisted \
  --config.virtual-store-dir=.pnpm
```

fallback `npm` از wrapper امن نصب npm با وابستگی‌های production، lifecycle scriptهای غیرفعال، حالت workspace غیرفعال، audit غیرفعال، خروجی fund غیرفعال، رفتار legacy برای peer dependency، و خروجی package-lock فعال برای install root تولیدشده استفاده می‌کند.

پس از نصب، OpenClaw پیش از قابل مشاهده کردن درخت وابستگی stage‌شده برای ریشهٔ وابستگی runtime، آن را validate می‌کند. staging ایزوله در ریشهٔ وابستگی runtime کپی می‌شود و دوباره validate می‌شود.

کل بخش repair/materialization با یک قفل install-root محافظت می‌شود. مالک‌های فعلی lock، PID، زمان شروع فرایند در صورت موجود بودن، و زمان ایجاد را ثبت می‌کنند. lockهای legacy بدون evidence زمان شروع فرایند یا زمان ایجاد، فقط بر اساس سن filesystem بازپس‌گرفته می‌شوند، بنابراین lockهای Docker PID 1 بازیافت‌شده بدون اینکه نصب‌های فعلی عادی و طولانی‌مدت صرفاً بر اساس سن expire شوند، recover می‌شوند.

## ریشه‌های نصب

نصب‌های packaged نباید directoryهای package فقط خواندنی را mutate کنند. OpenClaw می‌تواند ریشه‌های وابستگی را از لایه‌های packaged بخواند، اما وابستگی‌های runtime تولیدشده را در یک stage قابل نوشتن می‌نویسد، مانند:

- `OPENCLAW_PLUGIN_STAGE_DIR`
- `$STATE_DIRECTORY`
- `~/.openclaw/plugin-runtime-deps`
- `/var/lib/openclaw/plugin-runtime-deps` در نصب‌های container-style

ریشهٔ قابل نوشتن هدف نهایی materialization است. ریشه‌های قدیمی‌تر فقط خواندنی فقط در صورت نیاز به‌عنوان لایه‌های compatibility نگه داشته می‌شوند.

وقتی یک update بسته‌بندی‌شدهٔ OpenClaw ریشهٔ قابل نوشتن versioned را تغییر می‌دهد اما طرح وابستگی Pluginهای bundled انتخاب‌شده همچنان توسط ریشهٔ stage‌شدهٔ قبلی برآورده می‌شود، repair به‌جای اجرای دوبارهٔ مدیر package، همان درخت `node_modules` قبلی را reuse می‌کند. ریشهٔ versioned جدید همچنان mirror فعلی runtime package خودش را می‌گیرد، بنابراین کد Plugin از package فعلی OpenClaw می‌آید در حالی که درخت‌های وابستگی بدون تغییر در updateها shared می‌شوند. reuse ریشه‌های قبلی دارای lock فعال وابستگی runtime OpenClaw را skip می‌کند، بنابراین ریشهٔ جدید به درخت وابستگی‌ای link نمی‌شود که Gateway، doctor یا فرایند CLI دیگری در حال حاضر در حال repair کردن آن است.

## فرمان‌های doctor و CLI

از `plugins deps` برای inspect یا repair کردن materialization وابستگی runtime Pluginهای bundled استفاده کنید:

```bash
openclaw plugins deps
openclaw plugins deps --json
openclaw plugins deps --repair
openclaw plugins deps --prune
```

وقتی وضعیت وابستگی بخشی از سلامت گسترده‌تر نصب است، از doctor استفاده کنید:

```bash
openclaw doctor
openclaw doctor --fix
```

`plugins deps` و doctor روی وابستگی‌های runtime Pluginهای bundled متعلق به OpenClaw که توسط طرح مؤثر Plugin انتخاب شده‌اند عمل می‌کنند. آن‌ها فرمان‌های نصب یا update برای Pluginهای شخص ثالث نیستند.

## عیب‌یابی

اگر یک نصب packaged وابستگی‌های runtime bundled مفقود گزارش کرد:

1. `openclaw plugins deps --json` را اجرا کنید تا طرح انتخاب‌شده و packageهای مفقود را inspect کنید.
2. `openclaw plugins deps --repair` یا `openclaw doctor --fix` را اجرا کنید تا stage وابستگی قابل نوشتن repair شود.
3. اگر install root فقط خواندنی است، `OPENCLAW_PLUGIN_STAGE_DIR` را روی یک مسیر قابل نوشتن تنظیم کنید و repair را دوباره اجرا کنید.
4. اگر وابستگی مفقود، load شدن Plugin startup را blocked کرده بود، پس از repair، Gateway را restart کنید.

در source checkoutها، نصب workspace معمولاً وابستگی‌های Pluginهای bundled را فراهم می‌کند. برای repair وابستگی source، به‌جای اینکه در گام اول از repair وابستگی runtime packaged استفاده کنید، `pnpm install` را اجرا کنید.
