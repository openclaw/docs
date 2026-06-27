---
read_when:
    - در حال جست‌وجوی تعریف‌های کانال انتشار عمومی
    - اجرای اعتبارسنجی انتشار یا پذیرش بسته
    - در جستجوی نام‌گذاری نسخه و آهنگ انتشار
summary: مسیرهای انتشار، فهرست بررسی اپراتور، جعبه‌های اعتبارسنجی، نام‌گذاری نسخه‌ها، و آهنگ انتشار
title: سیاست انتشار
x-i18n:
    generated_at: "2026-06-27T18:46:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16873b02f09bd0f67ea16644630defc1b17b6f236572715df598a2253dba3b2d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw سه مسیر انتشار عمومی دارد:

- پایدار: انتشارهای برچسب‌خورده‌ای که به‌صورت پیش‌فرض در npm با `beta` منتشر می‌شوند، یا وقتی صریحا درخواست شود در npm با `latest` منتشر می‌شوند
- بتا: برچسب‌های پیش‌انتشار که در npm با `beta` منتشر می‌شوند
- توسعه: سرِ در حال حرکت `main`

## نام‌گذاری نسخه

- نسخه انتشار پایدار: `YYYY.M.PATCH`
  - برچسب Git: `vYYYY.M.PATCH`
- نسخه انتشار اصلاحی پایدار: `YYYY.M.PATCH-N`
  - برچسب Git: `vYYYY.M.PATCH-N`
- نسخه پیش‌انتشار بتا: `YYYY.M.PATCH-beta.N`
  - برچسب Git: `vYYYY.M.PATCH-beta.N`
- ماه یا وصله را با صفر پر نکنید
- از به‌روزرسانی فرایند انتشار ژوئن ۲۰۲۶ به بعد، جزء سوم یک
  شماره قطار انتشار ماهانه ترتیبی است، نه روز تقویمی. انتشارهای پایدار و بتا
  قطار فعلی را تعیین می‌کنند؛ برچسب‌های فقط آلفا شماره وصله بتا/پایدار را مصرف یا
  پیش نمی‌برند. برچسب‌های پیش از به‌روزرسانی و نسخه‌های npm نام‌های موجود خود را حفظ می‌کنند
  و معتبر می‌مانند؛ اتوماسیون انتشار همچنان آن‌ها را بر اساس سال، ماه، وصله، کانال، و شماره
  پیش‌انتشار یا اصلاحیه مقایسه می‌کند.
- ساخت‌های آلفا/شبانه از قطار وصله منتشرنشده بعدی استفاده می‌کنند و برای ساخت‌های تکراری فقط
  `alpha.N` را افزایش می‌دهند. وقتی آن وصله بتا داشته باشد، ساخت‌های آلفای جدید
  به وصله بعدی منتقل می‌شوند. هنگام انتخاب قطار بتا یا پایدار، برچسب‌های قدیمی فقط آلفا
  با شماره وصله بالاتر را نادیده بگیرید.
- نسخه‌های npm تغییرناپذیرند. اگر یک برچسب بتا قبلا منتشر شده است، آن را
  حذف، بازنشر یا دوباره استفاده نکنید؛ شماره بتای بعدی یا وصله ماهانه بعدی را بسازید.
  چون `2026.6.5-beta.1` در دوره گذار قبلا منتشر شده بود،
  قطارهای انتشار ژوئن ۲۰۲۶ باید از وصله `5` یا بالاتر استفاده کنند. قطارهای پایدار یا بتای جدید
  ژوئن ۲۰۲۶ را به‌صورت `2026.6.2`، `2026.6.3`، یا
  `2026.6.4` منتشر نکنید.
- پس از پایدار `2026.6.5`، قطار بتای جدید بعدی `2026.6.6-beta.1` است، حتی
  اگر برچسب‌های خودکار فقط آلفا با شماره وصله بالاتر از قبل وجود داشته باشند.
- `latest` یعنی انتشار پایدار npm که اکنون ترفیع داده شده است
- `beta` یعنی هدف نصب بتای فعلی
- انتشارهای پایدار و اصلاحی پایدار به‌صورت پیش‌فرض در npm با `beta` منتشر می‌شوند؛ اپراتورهای انتشار می‌توانند صریحا `latest` را هدف بگیرند، یا بعدا یک ساخت بتای ارزیابی‌شده را ترفیع دهند
- هر انتشار پایدار OpenClaw بسته npm، برنامه macOS، و نصب‌کننده‌های امضاشده
  Windows Hub را با هم عرضه می‌کند؛ انتشارهای بتا معمولا ابتدا مسیر npm/بسته را اعتبارسنجی و منتشر می‌کنند، و
  ساخت/امضا/محضرسازی/ترفیع برنامه بومی را برای پایدار نگه می‌دارند مگر اینکه صریحا درخواست شود

## آهنگ انتشار

- انتشارها ابتدا از بتا عبور می‌کنند
- پایدار فقط پس از اعتبارسنجی آخرین بتا می‌آید
- نگه‌دارندگان معمولا انتشارها را از شاخه `release/YYYY.M.PATCH` می‌سازند که
  از `main` فعلی ایجاد شده است، تا اعتبارسنجی و اصلاحات انتشار، توسعه جدید روی `main` را مسدود نکند
- اگر یک برچسب بتا push یا منتشر شده و به اصلاح نیاز داشته باشد، نگه‌دارندگان
  به‌جای حذف یا بازایجاد برچسب بتای قدیمی، برچسب `-beta.N` بعدی را می‌سازند
- رویه تفصیلی انتشار، تاییدها، اعتبارنامه‌ها، و یادداشت‌های بازیابی
  فقط برای نگه‌دارندگان است

## فهرست بررسی اپراتور انتشار

این فهرست بررسی شکل عمومی جریان انتشار است. اعتبارنامه‌های خصوصی،
امضا، محضرسازی، بازیابی dist-tag، و جزئیات rollback اضطراری در
runbook انتشار مخصوص نگه‌دارندگان باقی می‌ماند.

1. از `main` فعلی شروع کنید: آخرین تغییرات را pull کنید، تایید کنید commit هدف push شده است،
   و تایید کنید CI فعلی `main` آن‌قدر سبز هست که بتوان از آن شاخه گرفت.
2. بخش بالایی `CHANGELOG.md` را از PRهای ادغام‌شده و همه commitهای مستقیم
   از آخرین برچسب انتشار قابل‌دسترسی تولید کنید. مدخل‌ها را کاربرمحور نگه دارید،
   مدخل‌های هم‌پوشان PR/commit مستقیم را dedupe کنید، بازنویسی را commit کنید، آن را push کنید،
   و پیش از شاخه‌گیری یک بار دیگر rebase/pull کنید.
3. رکوردهای سازگاری انتشار را در
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts` مرور کنید. سازگاری منقضی‌شده را فقط وقتی حذف کنید که مسیر ارتقا همچنان پوشش داده شده باشد، یا ثبت کنید چرا
   عمدا نگه داشته می‌شود.
4. `release/YYYY.M.PATCH` را از `main` فعلی ایجاد کنید؛ کار معمول انتشار را
   مستقیما روی `main` انجام ندهید.
5. همه مکان‌های نسخه لازم را برای برچسب مورد نظر افزایش دهید، سپس
   `pnpm release:prep` را اجرا کنید. این دستور نسخه‌های Plugin، فهرست موجودی Plugin، شمای پیکربندی،
   فراداده پیکربندی کانال bundled، baseline مستندات پیکربندی، خروجی‌های Plugin SDK،
   و baseline API مربوط به Plugin SDK را به ترتیب درست تازه‌سازی می‌کند. هر drift تولیدشده را
   پیش از برچسب‌گذاری commit کنید. سپس preflight قطعی محلی را اجرا کنید:
   `pnpm check:test-types`، `pnpm check:architecture`،
   `pnpm build && pnpm ui:build`، و `pnpm release:check`.
6. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید. پیش از وجود برچسب،
   برای preflight فقطِ اعتبارسنجی، یک SHA کامل ۴۰ کاراکتری از شاخه انتشار مجاز است.
   preflight شواهد انتشار وابستگی را برای گراف وابستگی دقیقا checkoutشده تولید می‌کند
   و آن را در artifact مربوط به preflight npm ذخیره می‌کند. `preflight_run_id` موفق را ذخیره کنید.
7. همه تست‌های پیش از انتشار را با `Full Release Validation` برای شاخه انتشار،
   برچسب، یا SHA کامل commit آغاز کنید. این تنها نقطه ورود دستی
   برای چهار جعبه تست بزرگ انتشار است: Vitest، Docker، QA Lab، و Package.
8. اگر اعتبارسنجی شکست خورد، روی شاخه انتشار اصلاح کنید و کوچک‌ترین فایل، lane،
   job workflow، پروفایل بسته، provider، یا allowlist مدل شکست‌خورده‌ای را که
   اصلاح را اثبات می‌کند دوباره اجرا کنید. umbrella کامل را فقط وقتی دوباره اجرا کنید که سطح تغییر
   شواهد قبلی را stale کند.
9. برای یک نامزد بتای برچسب‌خورده،
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` را از شاخه مطابق
   `release/YYYY.M.PATCH` اجرا کنید. برای پایدار، انتشار منبع Windows مورد نیاز را هم پاس بدهید:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   این helper بررسی‌های انتشار تولیدشده محلی را اجرا می‌کند، شواهد full release validation و npm preflight را dispatch یا verify می‌کند، proof تازه/update مربوط به Parallels را در برابر tarball دقیق آماده‌شده به‌علاوه proof بسته Telegram اجرا می‌کند،
   برنامه‌های npm مربوط به Plugin و ClawHub را ثبت می‌کند، و فقط بعد از سبز شدن بسته شواهد،
   دستور دقیق `OpenClaw Release Publish` را چاپ می‌کند.
   `OpenClaw Release Publish` بسته‌های Plugin انتخاب‌شده یا همه بسته‌های قابل‌انتشار را
   به npm و همان مجموعه را به ClawHub به‌صورت موازی dispatch می‌کند، و سپس به محض موفقیت انتشار npm مربوط به Plugin،
   artifact آماده‌شده npm preflight مربوط به OpenClaw را با dist-tag مطابق ترفیع می‌دهد.
   پس از موفقیت فرزند انتشار npm مربوط به OpenClaw، صفحه GitHub release/prerelease مطابق را از بخش کامل و مطابق
   `CHANGELOG.md` ایجاد یا به‌روزرسانی می‌کند. انتشارهای پایدار منتشرشده در npm با `latest`
   به آخرین انتشار GitHub تبدیل می‌شوند؛ انتشارهای نگه‌داری پایدار که روی npm `beta` نگه داشته شده‌اند
   با `latest=false` در GitHub ایجاد می‌شوند. این workflow همچنین شواهد وابستگی preflight،
   manifest اعتبارسنجی کامل، و شواهد verification رجیستری پس از انتشار را برای پاسخ به incident پس از انتشار
   در GitHub release بارگذاری می‌کند. workflow انتشار run IDهای فرزند را بلافاصله چاپ می‌کند، gateهای release environment را که workflow token اجازه تاییدشان را دارد auto-approve می‌کند، jobهای فرزند شکست‌خورده را با tailهای log خلاصه می‌کند، GitHub release و شواهد وابستگی را به‌محض موفقیت انتشار npm مربوط به OpenClaw می‌بندد، هر زمان npm مربوط به OpenClaw منتشر می‌شود منتظر ClawHub می‌ماند، سپس `pnpm release:verify-beta` را اجرا می‌کند و شواهد پس از انتشار را برای GitHub release، بسته npm، بسته‌های npm انتخاب‌شده Plugin، بسته‌های انتخاب‌شده ClawHub، run IDهای workflow فرزند، و run ID اختیاری NPM Telegram بارگذاری می‌کند. مسیر ClawHub شکست‌های گذرای نصب وابستگی CLI را دوباره تلاش می‌کند، Pluginهایی را که preview آن‌ها پاس شده حتی وقتی یک preview cell flake می‌شود منتشر می‌کند، و با verification رجیستری برای هر نسخه مورد انتظار Plugin پایان می‌یابد تا انتشارهای جزئی قابل‌مشاهده و قابل‌تلاش دوباره بمانند. سپس پذیرش بسته پس از انتشار را در برابر بسته منتشرشده
   `openclaw@YYYY.M.PATCH-beta.N` یا
   `openclaw@beta` اجرا کنید. اگر یک پیش‌انتشار push یا منتشرشده به اصلاح نیاز داشته باشد،
   شماره پیش‌انتشار مطابق بعدی را بسازید؛ پیش‌انتشار قدیمی را حذف یا بازنویسی نکنید.
10. برای پایدار، فقط پس از اینکه بتای ارزیابی‌شده یا نامزد انتشار شواهد اعتبارسنجی
    لازم را داشت ادامه دهید. انتشار npm پایدار نیز از
    `OpenClaw Release Publish` عبور می‌کند و artifact موفق preflight را از طریق
    `preflight_run_id` دوباره استفاده می‌کند؛ آمادگی انتشار macOS پایدار همچنین به
    `.zip`، `.dmg`، `.dSYM.zip` بسته‌بندی‌شده، و `appcast.xml` به‌روزرسانی‌شده روی `main` نیاز دارد.
    workflow انتشار macOS پس از verify شدن assetهای انتشار، appcast امضاشده را به‌صورت خودکار روی `main` عمومی منتشر می‌کند؛ اگر branch protection جلوی push مستقیم را بگیرد، یک PR مربوط به appcast را باز یا به‌روزرسانی می‌کند. آمادگی Windows Hub پایدار به assetهای امضاشده `OpenClawCompanion-Setup-x64.exe`،
    `OpenClawCompanion-Setup-arm64.exe`، و
    `OpenClawCompanion-SHA256SUMS.txt` روی GitHub release مربوط به OpenClaw نیاز دارد.
    برچسب انتشار دقیق و امضاشده `openclaw/openclaw-windows-node` را به‌عنوان
    `windows_node_tag` و نگاشت digest نصب‌کننده تاییدشده نامزد آن را به‌عنوان
    `windows_node_installer_digests` پاس بدهید؛ `OpenClaw Release Publish`
    پیش‌نویس انتشار را نگه می‌دارد، `Windows Node Release` را dispatch می‌کند، و هر سه
    asset را پیش از انتشار verify می‌کند.
11. پس از انتشار، verifier پس از انتشار npm، E2E اختیاری Telegram مستقل برای npm منتشرشده
    وقتی به proof کانال پس از انتشار نیاز دارید،
    ترفیع dist-tag در صورت نیاز، verification صفحه GitHub release تولیدشده،
    مراحل اعلام انتشار را اجرا کنید، سپس پیش از اینکه یک انتشار پایدار را تمام‌شده بدانید،
    [بستن پایدار main](#stable-main-closeout) را کامل کنید.

## بستن پایدار main

انتشار پایدار تا وقتی `main` وضعیت انتشار واقعی عرضه‌شده را در خود نداشته باشد کامل نیست.

1. از تازه‌ترین `main` تمیز شروع کنید. `release/YYYY.M.PATCH` را در برابر آن ممیزی کنید و
   اصلاحات واقعیِ غایب از `main` را forward-port کنید. سازگاری، آزمون، یا آداپترهای اعتبارسنجیِ
   فقط مخصوص انتشار را کورکورانه به `main` جدیدتر ادغام نکنید.
2. `main` را روی نسخهٔ پایدار منتشرشده تنظیم کنید، نه قطار بعدیِ حدسی. پس از تغییر نسخهٔ ریشه،
   `pnpm release:prep` و سپس
   `pnpm deps:shrinkwrap:generate` را اجرا کنید.
3. بخش `## YYYY.M.PATCH` در `CHANGELOG.md` روی `main` باید دقیقاً با شاخهٔ انتشار تگ‌شده
   مطابقت داشته باشد. اگر انتشار mac به‌روزرسانی پایدار `appcast.xml` منتشر کرده است، آن را نیز
   اضافه کنید.
4. تا وقتی اپراتور صراحتاً آن قطار انتشار را شروع نکرده است، `YYYY.M.PATCH+1`، نسخهٔ بتا، یا
   بخش خالیِ تغییرات آینده را به `main` اضافه نکنید.
5. `pnpm release:generated:check`، `pnpm deps:shrinkwrap:check`، و
   `OPENCLAW_TESTBOX=1 pnpm check:changed` را اجرا کنید. push کنید، سپس پیش از اعلام اتمام
   انتشار پایدار، تأیید کنید که `origin/main` شامل نسخه و تغییرات منتشرشده است.
6. متغیرهای مخزن `RELEASE_ROLLBACK_DRILL_ID` و
   `RELEASE_ROLLBACK_DRILL_DATE` را پس از هر تمرین خصوصی rollback به‌روز نگه دارید.
   جمع‌بندی main پایدار OpenClaw از push روی `main` شروع می‌شود که پس از انتشار پایدار،
   نسخهٔ منتشرشده، changelog، و appcast را حمل می‌کند. این فرایند شواهد تغییرناپذیر پس از انتشار
   را می‌خواند تا تگ منتشرشده را به اجراهای اعتبارسنجی کامل انتشار و انتشار متصل کند، سپس وضعیت
   main پایدار، انتشار، دورهٔ soak پایدار اجباری، و شواهد عملکردیِ مسدودکننده را تأیید می‌کند. یک
   manifest جمع‌بندی تغییرناپذیر و checksum را به انتشار GitHub پیوست می‌کند. trigger خودکار push
   انتشارهای قدیمی را که پیش از شواهد تغییرناپذیر پس از انتشار هستند رد می‌کند؛ هرگز آن رد شدن را
   جمع‌بندی کامل‌شده تلقی نمی‌کند. جمع‌بندی کامل به هر دو asset و checksum مطابق نیاز دارد. یک
   manifest جزئی، SHA ثبت‌شدهٔ `main` و تمرین rollback خود را بازپخش می‌کند تا بایت‌های یکسان
   را دوباره تولید کند، سپس checksum گمشده را پیوست می‌کند؛ یک جفت نامعتبر، یا checksum بدون
   manifest، همچنان مسدودکننده می‌ماند. اجرای triggerشده با push بدون متغیرهای مخزنِ تمرین
   rollback بدون تکمیل جمع‌بندی رد می‌شود؛ رکورد تمرین گمشده یا قدیمی‌تر از ۹۰ روز همچنان
   جمع‌بندی دستیِ مبتنی بر شواهد را مسدود می‌کند. فرمان‌های بازیابی خصوصی در runbook مخصوص
   نگه‌دارندگان باقی می‌مانند. dispatch دستی را فقط برای تعمیر یا بازپخش جمع‌بندی پایدارِ مبتنی بر
   شواهد به کار ببرید. تگ اصلاح fallback قدیمی فقط زمانی می‌تواند از شواهد بستهٔ پایه دوباره استفاده کند
   که تگ اصلاح به همان commit منبعِ تگ پایدار پایه resolve شود. اصلاحی با منبع متفاوت باید شواهد
   بستهٔ خودش را منتشر و تأیید کند.

## پیش‌پرواز انتشار

- پیش از پیش‌پرواز انتشار، `pnpm check:test-types` را اجرا کنید تا TypeScript آزمون‌ها
  بیرون از گیت سریع‌تر محلی `pnpm check` همچنان پوشش داده شود
- پیش از پیش‌پرواز انتشار، `pnpm check:architecture` را اجرا کنید تا بررسی‌های گسترده‌تر
  چرخه import و مرزهای معماری بیرون از گیت سریع‌تر محلی سبز باشند
- پیش از `pnpm release:check`، دستور `pnpm build && pnpm ui:build` را اجرا کنید تا
  آرتیفکت‌های انتشار مورد انتظار `dist/*` و باندل Control UI برای مرحله
  اعتبارسنجی بسته‌بندی وجود داشته باشند
- پس از افزایش نسخه ریشه و پیش از برچسب‌گذاری، `pnpm release:prep` را اجرا کنید. این دستور
  همه تولیدکننده‌های قطعی انتشار را که معمولا پس از تغییر نسخه/پیکربندی/API دچار
  انحراف می‌شوند اجرا می‌کند: نسخه‌های Plugin، موجودی Plugin، schema پیکربندی پایه،
  فراداده پیکربندی کانال‌های باندل‌شده، baseline مستندات پیکربندی، exportهای SDK
  مربوط به Plugin، و baseline API مربوط به SDK افزونه. `pnpm release:check` همان
  گاردها را در حالت بررسی دوباره اجرا می‌کند و پیش از اجرای بررسی‌های انتشار بسته،
  همه خطاهای انحراف تولیدشده‌ای را که پیدا کند در یک گذر گزارش می‌دهد.
- همگام‌سازی نسخه Plugin، نسخه‌های بسته Plugin رسمی و کف‌های موجود
  `openclaw.compat.pluginApi` را به‌طور پیش‌فرض به نسخه انتشار OpenClaw به‌روزرسانی
  می‌کند. این فیلد را کف API مربوط به SDK/Runtime افزونه بدانید، نه فقط کپی نسخه
  بسته: برای انتشارهای فقط Plugin که عمدا با میزبان‌های قدیمی‌تر OpenClaw سازگار
  می‌مانند، کف را روی قدیمی‌ترین API میزبان پشتیبانی‌شده نگه دارید و این انتخاب را
  در اثبات انتشار Plugin مستند کنید.
- پیش از تایید انتشار، گردش‌کار دستی `Full Release Validation` را اجرا کنید تا همه
  جعبه‌های آزمون پیش از انتشار از یک نقطه ورود آغاز شوند. این گردش‌کار یک شاخه،
  برچسب، یا SHA کامل commit را می‌پذیرد، `CI` دستی را dispatch می‌کند، و
  `OpenClaw Release Checks` را برای smoke نصب، پذیرش بسته، بررسی‌های بسته
  میان‌سیستمی، برابری QA Lab، Matrix، و مسیرهای Telegram dispatch می‌کند. اجراهای
  پایدار و کامل همیشه live/E2E جامع و soak مسیر انتشار Docker را شامل می‌شوند؛
  `run_release_soak=true` برای soak صریح beta نگه داشته شده است. پذیرش بسته، E2E
  معیار بسته Telegram را در زمان اعتبارسنجی candidate فراهم می‌کند و از poller
  live همزمان دوم جلوگیری می‌کند.
  پس از انتشار beta، `release_package_spec` را ارائه کنید تا بسته npm منتشرشده
  در بررسی‌های انتشار، پذیرش بسته، و E2E بسته Telegram بدون ساخت دوباره tarball
  انتشار استفاده شود. `npm_telegram_package_spec` را فقط زمانی ارائه کنید که
  Telegram باید از بسته منتشرشده‌ای متفاوت از بقیه اعتبارسنجی انتشار استفاده کند.
  زمانی `package_acceptance_package_spec` را ارائه کنید که پذیرش بسته باید از
  بسته منتشرشده‌ای متفاوت از spec بسته انتشار استفاده کند. زمانی
  `evidence_package_spec` را ارائه کنید که گزارش شواهد انتشار باید ثابت کند
  اعتبارسنجی با یک بسته npm منتشرشده مطابقت دارد، بدون اینکه E2E Telegram را
  اجباری کند.
  مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- زمانی گردش‌کار دستی `Package Acceptance` را اجرا کنید که در حین ادامه کار انتشار،
  اثبات کانال جانبی برای یک candidate بسته می‌خواهید. از `source=npm` برای
  `openclaw@beta`، `openclaw@latest`، یا یک نسخه انتشار دقیق استفاده کنید؛ از
  `source=ref` برای بسته‌بندی یک شاخه/برچسب/SHA مورد اعتماد `package_ref` با harness
  فعلی `workflow_ref`؛ از `source=url` برای یک tarball عمومی HTTPS با SHA-256 الزامی
  و سیاست سخت‌گیرانه URL عمومی؛ از `source=trusted-url` برای یک سیاست منبع مورد
  اعتماد نام‌گذاری‌شده با `trusted_source_id` و SHA-256 الزامی؛ یا از
  `source=artifact` برای tarball بارگذاری‌شده توسط یک اجرای دیگر GitHub Actions.
  این گردش‌کار candidate را به `package-under-test` resolve می‌کند، زمان‌بند انتشار
  Docker E2E را در برابر همان tarball دوباره به‌کار می‌گیرد، و می‌تواند QA مربوط به
  Telegram را روی همان tarball با `telegram_mode=mock-openai` یا
  `telegram_mode=live-frontier` اجرا کند. وقتی مسیرهای Docker انتخاب‌شده شامل
  `published-upgrade-survivor` باشند، آرتیفکت بسته همان candidate است و
  `published_upgrade_survivor_baseline` baseline منتشرشده را انتخاب می‌کند.
  `update-restart-auth` از بسته candidate هم به‌عنوان CLI نصب‌شده و هم به‌عنوان
  package-under-test استفاده می‌کند تا مسیر restart مدیریت‌شده دستور update مربوط
  به candidate را تمرین کند.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  پروفایل‌های رایج:
  - `smoke`: مسیرهای نصب/کانال/agent، شبکه Gateway، و بارگذاری دوباره پیکربندی
  - `package`: مسیرهای بسته/update/restart/Plugin بومی آرتیفکت بدون OpenWebUI یا ClawHub زنده
  - `product`: پروفایل بسته به‌علاوه کانال‌های MCP، پاک‌سازی cron/subagent،
    جست‌وجوی وب OpenAI، و OpenWebUI
  - `full`: قطعه‌های مسیر انتشار Docker با OpenWebUI
  - `custom`: انتخاب دقیق `docker_lanes` برای اجرای دوباره متمرکز
- وقتی فقط به پوشش CI عادی و قطعی برای candidate انتشار نیاز دارید، گردش‌کار دستی
  `CI` را مستقیم اجرا کنید. dispatchهای دستی CI از محدوده‌بندی تغییرات عبور می‌کنند
  و shardهای Linux Node، shardهای Plugin باندل‌شده، shardهای قرارداد Plugin و کانال،
  سازگاری Node 22، `check-*`، `check-additional-*`، بررسی‌های smoke آرتیفکت ساخته‌شده،
  بررسی‌های مستندات، Skills پایتون، Windows، macOS، و مسیرهای i18n مربوط به
  Control UI را اجباری می‌کنند. اجراهای دستی مستقل CI فقط وقتی Android را اجرا
  می‌کنند که با `include_android=true` dispatch شده باشند؛ `Full Release Validation`
  این ورودی را برای فرزند CI خود پاس می‌دهد.
  مثال با Android: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- هنگام اعتبارسنجی telemetry انتشار، `pnpm qa:otel:smoke` را اجرا کنید. این دستور
  QA-lab را از طریق یک گیرنده محلی OTLP/HTTP تمرین می‌کند و export شدن trace،
  metric، و log به‌علاوه محدود بودن attributeهای trace و حذف/پنهان‌سازی محتوا و
  شناسه‌ها را بدون نیاز به Opik، Langfuse، یا collector خارجی دیگر تایید می‌کند.
- هنگام اعتبارسنجی سازگاری collector، `pnpm qa:otel:collector-smoke` را اجرا کنید.
  این دستور همان export مربوط به OTLP در QA-lab را پیش از assertionهای گیرنده محلی
  از طریق یک کانتینر Docker واقعی OpenTelemetry Collector عبور می‌دهد.
- هنگام اعتبارسنجی scraping محافظت‌شده Prometheus، `pnpm qa:prometheus:smoke` را
  اجرا کنید. این دستور QA-lab را تمرین می‌کند، scrapeهای بدون احراز هویت را رد
  می‌کند، و تایید می‌کند خانواده‌های metric حیاتی برای انتشار عاری از محتوای
  prompt، شناسه‌های خام، tokenهای auth، و مسیرهای محلی بمانند.
- وقتی می‌خواهید مسیرهای smoke مربوط به OpenTelemetry و Prometheus در checkout
  منبع پشت سر هم اجرا شوند، `pnpm qa:observability:smoke` را اجرا کنید.
- پیش از هر انتشار برچسب‌خورده، `pnpm release:check` را اجرا کنید
- پیش‌پرواز `OpenClaw NPM Release` پیش از بسته‌بندی tarball مربوط به npm، شواهد
  انتشار وابستگی را تولید می‌کند. گیت آسیب‌پذیری advisory مربوط به npm برای انتشار
  مسدودکننده است. ریسک manifest گذرا، سطح مالکیت/نصب وابستگی، و گزارش‌های تغییر
  وابستگی فقط شواهد انتشار هستند. گزارش تغییر وابستگی، candidate انتشار را با
  برچسب انتشار reachable قبلی مقایسه می‌کند.
- پیش‌پرواز شواهد وابستگی را با نام
  `openclaw-release-dependency-evidence-<tag>` بارگذاری می‌کند و همچنین آن را زیر
  `dependency-evidence/` داخل آرتیفکت آماده‌شده پیش‌پرواز npm تعبیه می‌کند. مسیر
  انتشار واقعی همان آرتیفکت پیش‌پرواز را دوباره استفاده می‌کند، سپس همان شواهد را
  با نام `openclaw-<version>-dependency-evidence.zip` به انتشار GitHub پیوست می‌کند.
- پس از وجود برچسب، برای توالی انتشار تغییر‌دهنده، `OpenClaw Release Publish` را
  اجرا کنید. آن را از `release/YYYY.M.PATCH` dispatch کنید، یا هنگام انتشار برچسبی
  که از `main` reachable است از `main` dispatch کنید، برچسب انتشار، شناسه اجرای
  پیش‌پرواز موفق npm مربوط به OpenClaw یعنی `preflight_run_id`، و
  `full_release_validation_run_id` موفق را پاس دهید، و scope پیش‌فرض انتشار Plugin
  یعنی `all-publishable` را نگه دارید مگر اینکه عمدا یک تعمیر متمرکز اجرا می‌کنید.
  این گردش‌کار انتشار npm مربوط به Plugin، انتشار ClawHub مربوط به Plugin، و انتشار
  npm مربوط به OpenClaw را سریالی می‌کند تا بسته core پیش از Pluginهای externalized
  خود منتشر نشود.
- `OpenClaw Release Publish` پایدار پس از وجود انتشار غیر prerelease منطبق
  `openclaw/openclaw-windows-node` به یک `windows_node_tag` دقیق نیاز دارد. همچنین
  به map تاییدشده candidate یعنی `windows_node_installer_digests` نیاز دارد. پیش از
  dispatch هر فرزند انتشار، تایید می‌کند که انتشار منبع منتشر شده، غیر prerelease
  است، installerهای x64/ARM64 الزامی را دارد، و همچنان با همان map تاییدشده
  مطابقت دارد. سپس در حالی که انتشار OpenClaw هنوز draft است، `Windows Node Release`
  را dispatch می‌کند و map digest پین‌شده installer را بدون تغییر حمل می‌کند.
  گردش‌کار فرزند، installerهای امضاشده Windows Hub را از همان برچسب دقیق دانلود
  می‌کند، آن‌ها را با digestهای پین‌شده تطبیق می‌دهد، تایید می‌کند امضاهای
  Authenticode آن‌ها روی runner ویندوز از امضاکننده مورد انتظار OpenClaw Foundation
  استفاده می‌کنند، یک manifest SHA-256 می‌نویسد، و installerها به‌علاوه manifest را
  روی انتشار معیار GitHub مربوط به OpenClaw بارگذاری می‌کند، سپس assetهای promoted
  را دوباره دانلود می‌کند و عضویت manifest و hashها را تایید می‌کند. والد پیش از
  انتشار، قرارداد asset فعلی x64، ARM64، و checksum را تایید می‌کند. بازیابی مستقیم
  پیش از جایگزینی assetهای قرارداد مورد انتظار با byteهای منبع پین‌شده، نام‌های
  asset غیرمنتظره `OpenClawCompanion-*` را رد می‌کند. `Windows Node Release` را فقط
  برای بازیابی به‌صورت دستی dispatch کنید، و همیشه یک برچسب دقیق، هرگز `latest`، به
  همراه map JSON صریح `expected_installer_digests` از انتشار منبع تاییدشده پاس
  دهید. لینک‌های دانلود وب‌سایت باید asset URLهای دقیق انتشار OpenClaw برای انتشار
  پایدار فعلی را هدف بگیرند، یا فقط پس از تایید اینکه redirect مربوط به latest در
  GitHub به همان انتشار اشاره می‌کند، از `releases/latest/download/...` استفاده
  کنند؛ فقط به صفحه انتشار repo همراه لینک ندهید.
- بررسی‌های انتشار اکنون در یک گردش‌کار دستی جداگانه اجرا می‌شوند:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` همچنین پیش از تایید انتشار، مسیر برابری mock در QA Lab
  به‌علاوه پروفایل live سریع Matrix و مسیر QA مربوط به Telegram را اجرا می‌کند. مسیرهای
  live از environment مربوط به `qa-live-shared` استفاده می‌کنند؛ Telegram همچنین از
  leaseهای credential مربوط به Convex CI استفاده می‌کند. وقتی موجودی کامل transport،
  media، و E2EE مربوط به Matrix را به‌صورت موازی می‌خواهید، گردش‌کار دستی
  `QA-Lab - All Lanes` را با `matrix_profile=all` و `matrix_shards=true` اجرا کنید.
- اعتبارسنجی runtime نصب و upgrade میان‌سیستمی بخشی از `OpenClaw Release Checks`
  عمومی و `Full Release Validation` است، که گردش‌کار قابل استفاده مجدد
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` را مستقیم فراخوانی
  می‌کنند
- این جداسازی عمدی است: مسیر واقعی انتشار npm را کوتاه، قطعی، و متمرکز بر آرتیفکت
  نگه دارید، در حالی که بررسی‌های live کندتر در مسیر خودشان می‌مانند تا publish را
  متوقف یا مسدود نکنند
- بررسی‌های انتشار دارای secret باید از طریق `Full Release Validation`
یا از ref گردش‌کار `main`/release dispatch شوند تا منطق گردش‌کار و
  secretها کنترل‌شده بمانند
- `OpenClaw Release Checks` یک شاخه، برچسب، یا SHA کامل commit را می‌پذیرد، تا زمانی
  که commit resolve‌شده از یک شاخه OpenClaw یا برچسب انتشار reachable باشد
- پیش‌پرواز فقط اعتبارسنجی `OpenClaw NPM Release` همچنین SHA کامل ۴۰ نویسه‌ای فعلی
  commit شاخه گردش‌کار را بدون نیاز به برچسب push‌شده می‌پذیرد
- آن مسیر SHA فقط برای اعتبارسنجی است و نمی‌تواند به publish واقعی promote شود
- در حالت SHA، گردش‌کار `v<package.json version>` را فقط برای بررسی فراداده بسته
  می‌سازد؛ publish واقعی همچنان به برچسب انتشار واقعی نیاز دارد
- هر دو گردش‌کار مسیر publish و promotion واقعی را روی runnerهای GitHub-hosted
  نگه می‌دارند، در حالی که مسیر اعتبارسنجی غیرتغییر‌دهنده می‌تواند از runnerهای
  بزرگ‌تر Blacksmith Linux استفاده کند
- آن گردش‌کار
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  را با استفاده از هر دو secret گردش‌کار `OPENAI_API_KEY` و `ANTHROPIC_API_KEY`
  اجرا می‌کند
- پیش‌پرواز انتشار npm دیگر منتظر مسیر جداگانه بررسی‌های انتشار نمی‌ماند
- پیش از برچسب‌گذاری محلی candidate انتشار، دستور
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` را اجرا کنید. این
  helper گاردریل‌های سریع انتشار، بررسی‌های انتشار npm/ClawHub مربوط به Plugin،
  build، build رابط کاربری، و `release:openclaw:npm:check` را به ترتیبی اجرا می‌کند
  که اشتباهات رایج مسدودکننده تایید را پیش از آغاز گردش‌کار publish در GitHub
  پیدا کند.
- پیش از تایید، دستور `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  را اجرا کنید، یا برچسب beta/correction منطبق را
- پس از انتشار npm، اجرا کنید
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (یا نسخهٔ بتا/اصلاحی مطابق) برای تأیید مسیر نصب رجیستری منتشرشده
  در یک پیشوند موقت تازه
- پس از انتشار بتا، `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` را اجرا کنید
  تا راه‌اندازی بستهٔ نصب‌شده، تنظیم Telegram، و E2E واقعی Telegram
  را در برابر بستهٔ npm منتشرشده با استفاده از مخزن مشترک اعتبارنامه‌های اجاره‌ای Telegram
  تأیید کنید. اجراهای موردی نگه‌دارندهٔ محلی می‌توانند متغیرهای Convex را حذف کنند و سه
  اعتبارنامهٔ محیطی `OPENCLAW_QA_TELEGRAM_*` را مستقیماً بدهند.
- برای اجرای اسموک کامل پس از انتشار بتا از ماشین نگه‌دارنده، از `pnpm release:beta-smoke -- --beta betaN` استفاده کنید. این ابزار کمکی اعتبارسنجی به‌روزرسانی npm و هدف تازهٔ Parallels را اجرا می‌کند، `NPM Telegram Beta E2E` را dispatch می‌کند، اجرای دقیق گردش‌کار را پایش می‌کند، artifact را دانلود می‌کند، و گزارش Telegram را چاپ می‌کند.
- نگه‌دارنده‌ها می‌توانند همان بررسی پس از انتشار را از GitHub Actions از طریق
  گردش‌کار دستی `NPM Telegram Beta E2E` اجرا کنند. این عمداً فقط دستی است و
  روی هر merge اجرا نمی‌شود.
- خودکارسازی انتشار نگه‌دارنده اکنون از preflight-then-promote استفاده می‌کند:
  - انتشار واقعی npm باید یک npm `preflight_run_id` موفق را گذرانده باشد
  - انتشار واقعی npm باید از همان شاخهٔ `main` یا
    `release/YYYY.M.PATCH` که اجرای preflight موفق از آن بوده dispatch شود
  - انتشارهای پایدار npm به‌صورت پیش‌فرض روی `beta` هستند
  - انتشار پایدار npm می‌تواند از طریق ورودی گردش‌کار صراحتاً `latest` را هدف بگیرد
  - جهش npm dist-tag مبتنی بر token اکنون در
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` قرار دارد، زیرا
    `npm dist-tag add` همچنان به `NPM_TOKEN` نیاز دارد، در حالی که مخزن منبع انتشار
    فقط OIDC را نگه می‌دارد
  - `macOS Release` عمومی فقط برای اعتبارسنجی است؛ وقتی یک tag فقط روی یک
    شاخهٔ انتشار وجود دارد اما گردش‌کار از `main` dispatch می‌شود،
    `public_release_branch=release/YYYY.M.PATCH` را تنظیم کنید
  - انتشار واقعی macOS باید macOS `preflight_run_id` و
    `validate_run_id` موفق را گذرانده باشد
  - مسیرهای انتشار واقعی به‌جای ساخت دوبارهٔ artifactها،
    artifactهای آماده‌شده را promote می‌کنند
- برای انتشارهای اصلاحی پایدار مانند `YYYY.M.PATCH-N`، تأییدکنندهٔ پس از انتشار
  همان مسیر ارتقای پیشوند موقت از `YYYY.M.PATCH` به `YYYY.M.PATCH-N` را نیز بررسی می‌کند
  تا اصلاحات انتشار نتوانند نصب‌های global قدیمی‌تر را بی‌صدا روی
  payload پایدار پایه باقی بگذارند
- preflight انتشار npm به‌صورت fail closed شکست می‌خورد مگر اینکه tarball هم
  `dist/control-ui/index.html` و هم یک payload غیرخالی `dist/control-ui/assets/` را شامل شود
  تا دوباره یک داشبورد مرورگر خالی منتشر نکنیم
- تأیید پس از انتشار همچنین بررسی می‌کند که entrypointهای Plugin منتشرشده و
  فرادادهٔ بسته در چیدمان رجیستری نصب‌شده حاضر باشند. انتشاری که
  payloadهای runtime گم‌شدهٔ Plugin را ارسال کند در تأییدکنندهٔ postpublish شکست می‌خورد و
  نمی‌تواند به `latest` promote شود.
- `pnpm test:install:smoke` همچنین بودجهٔ `unpackedSize` بستهٔ npm را روی
  tarball به‌روزرسانی نامزد اعمال می‌کند، بنابراین e2e نصب‌کننده تورم تصادفی بسته را
  پیش از مسیر انتشار release می‌گیرد
- اگر کار انتشار به برنامه‌ریزی CI، manifestهای زمان‌بندی افزونه، یا
  ماتریس‌های تست افزونه دست زده است، خروجی‌های ماتریس
  `plugin-prerelease-extension-shard` متعلق به planner را از
  `.github/workflows/plugin-prerelease.yml` پیش از تأیید بازتولید و بازبینی کنید تا یادداشت‌های انتشار
  چیدمان منسوخ CI را توصیف نکنند
- آمادگی انتشار پایدار macOS همچنین شامل سطح‌های به‌روزرسان است:
  - انتشار GitHub باید در نهایت شامل `.zip`، `.dmg`، و `.dSYM.zip` بسته‌بندی‌شده باشد
  - `appcast.xml` روی `main` باید پس از انتشار به zip پایدار جدید اشاره کند؛
    گردش‌کار انتشار macOS آن را به‌صورت خودکار commit می‌کند، یا وقتی push مستقیم مسدود باشد یک PR
    برای appcast باز می‌کند
  - برنامهٔ بسته‌بندی‌شده باید یک bundle id غیر-debug، یک URL فید Sparkle غیرخالی،
    و یک `CFBundleVersion` برابر یا بالاتر از حداقل build متعارف Sparkle
    برای آن نسخهٔ انتشار را حفظ کند

## جعبه‌های آزمون انتشار

`Full Release Validation` روشی است که اپراتورها همه آزمون‌های پیش از انتشار را از
یک نقطه ورود آغاز می‌کنند. برای اثبات یک commit سنجاق‌شده روی شاخه‌ای که سریع
تغییر می‌کند، از helper استفاده کنید تا هر workflow فرزند از یک شاخه موقت ثابت‌شده
روی SHA هدف اجرا شود:

```bash
pnpm ci:full-release --sha <full-sha>
```

این helper شاخه `release-ci/<sha>-...` را push می‌کند، `Full Release Validation`
را از همان شاخه با `ref=<sha>` اجرا می‌کند، بررسی می‌کند که `headSha` هر workflow
فرزند با هدف مطابق باشد، سپس شاخه موقت را حذف می‌کند. این کار از اثبات تصادفی
اجرای فرزندِ `main` جدیدتر جلوگیری می‌کند.

برای اعتبارسنجی شاخه یا tag انتشار، آن را از ref workflow مورد اعتماد `main`
اجرا کنید و شاخه یا tag انتشار را به‌عنوان `ref` بدهید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

این workflow، ref هدف را resolve می‌کند، `CI` دستی را با
`target_ref=<release-ref>` dispatch می‌کند، سپس `OpenClaw Release Checks` را
dispatch می‌کند. `OpenClaw Release Checks` آزمون‌های install smoke، بررسی‌های
انتشار میان‌سیستمی، پوشش live/E2E مسیر انتشار Docker وقتی soak فعال است،
Package Acceptance با E2E بسته canonical Telegram، هم‌ارزی QA Lab، Matrix زنده و
Telegram زنده را fan out می‌کند. اجرای full/all فقط زمانی قابل قبول است که خلاصه
`Full Release Validation`، `normal_ci`، `plugin_prerelease` و `release_checks` را
موفق نشان دهد، مگر اینکه یک اجرای مجدد متمرکز عمدا فرزند جداگانه `Plugin
Prerelease` را رد کرده باشد. فرزند مستقل `npm-telegram` را فقط برای اجرای مجدد
متمرکز بسته منتشرشده با `release_package_spec` یا
`npm_telegram_package_spec` استفاده کنید. خلاصه نهایی verifier شامل جدول‌های
کندترین job برای هر اجرای فرزند است، تا مدیر انتشار بتواند مسیر بحرانی فعلی را
بدون دانلود logها ببیند.
برای ماتریس کامل stage، نام دقیق jobهای workflow، تفاوت‌های profile پایدار و full،
artifactها و handleهای اجرای مجدد متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.
Workflowهای فرزند از ref مورد اعتمادی dispatch می‌شوند که `Full Release
Validation` را اجرا می‌کند، معمولا `--ref main`، حتی وقتی `ref` هدف به یک شاخه یا
tag انتشار قدیمی‌تر اشاره می‌کند. ورودی جداگانه‌ای برای workflow-ref مربوط به
Full Release Validation وجود ندارد؛ harness مورد اعتماد را با انتخاب ref اجرای
workflow انتخاب کنید. برای اثبات commit دقیق روی `main` متحرک از
`--ref main -f ref=<sha>` استفاده نکنید؛ SHAهای خام commit نمی‌توانند refهای
workflow dispatch باشند، پس از `pnpm ci:full-release --sha <sha>` برای ساخت شاخه
موقت سنجاق‌شده استفاده کنید.

از `release_profile` برای انتخاب گستره live/provider استفاده کنید:

- `minimum`: سریع‌ترین مسیر live و Docker حیاتی برای انتشار OpenAI/core
- `stable`: minimum به‌علاوه پوشش provider/backend پایدار برای تایید انتشار
- `full`: stable به‌علاوه پوشش advisory گسترده provider/media

اعتبارسنجی stable و full همیشه sweep جامع live/E2E، مسیر انتشار Docker و
ارتقای منتشرشده bounded upgrade-survivor را پیش از promotion اجرا می‌کنند.
از `run_release_soak=true` برای درخواست همان sweep برای beta استفاده کنید. آن sweep
چهار بسته stable آخر، به‌علاوه baselineهای سنجاق‌شده `2026.4.23` و `2026.5.2`
به‌علاوه پوشش قدیمی‌تر `2026.4.15` را پوشش می‌دهد، baselineهای تکراری را حذف
می‌کند و هر baseline را در job runner جداگانه Docker shard می‌کند.

`OpenClaw Release Checks` از ref workflow مورد اعتماد استفاده می‌کند تا ref هدف
را یک‌بار به‌عنوان `release-package-under-test` resolve کند و وقتی soak اجرا
می‌شود همان artifact را در بررسی‌های cross-OS، Package Acceptance و Docker
مسیر انتشار بازاستفاده می‌کند. این کار همه جعبه‌های رو به بسته را روی همان byteها
نگه می‌دارد و از buildهای تکراری بسته جلوگیری می‌کند. پس از اینکه beta از قبل
روی npm قرار گرفت، `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` را تنظیم
کنید تا release checks بسته shipped را یک‌بار دانلود کند، SHA منبع build آن را
از `dist/build-info.json` استخراج کند و همان artifact را برای laneهای cross-OS،
Package Acceptance، release-path Docker و package Telegram بازاستفاده کند.
install smoke میان‌سیستمی OpenAI وقتی متغیر repo/org تنظیم باشد از
`OPENCLAW_CROSS_OS_OPENAI_MODEL` استفاده می‌کند، وگرنه از `openai/gpt-5.4`، چون
این lane در حال اثبات نصب بسته، onboarding، startup Gateway و یک agent turn زنده
است، نه benchmark کردن کندترین مدل پیش‌فرض. ماتریس live provider گسترده‌تر همچنان
محل پوشش model-specific است.

بسته به stage انتشار، از این variantها استفاده کنید:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

از چتر full به‌عنوان اولین اجرای مجدد پس از یک fix متمرکز استفاده نکنید. اگر یک
جعبه fail شد، برای proof بعدی از workflow فرزند، job، lane Docker، profile بسته،
provider مدل یا lane QA شکست‌خورده استفاده کنید. چتر full را فقط وقتی دوباره اجرا
کنید که fix، orchestration مشترک انتشار را تغییر داده یا شواهد all-box قبلی را
کهنه کرده باشد. verifier نهایی چتر، idهای اجرای workflow فرزند ثبت‌شده را دوباره
بررسی می‌کند، پس پس از اینکه یک workflow فرزند با موفقیت دوباره اجرا شد، فقط job
والدِ fail شده `Verify full validation` را دوباره اجرا کنید.

برای بازیابی bounded، `rerun_group` را به چتر بدهید. `all` اجرای واقعی
release-candidate است، `ci` فقط فرزند CI معمولی را اجرا می‌کند، `plugin-prerelease`
فقط فرزند Plugin مخصوص انتشار را اجرا می‌کند، `release-checks` همه جعبه‌های
انتشار را اجرا می‌کند، و گروه‌های انتشار باریک‌تر عبارت‌اند از `install-smoke`،
`cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live` و `npm-telegram`.
اجرای مجدد متمرکز `npm-telegram` به `release_package_spec` یا
`npm_telegram_package_spec` نیاز دارد؛ اجراهای full/all از E2E بسته canonical
Telegram داخل Package Acceptance استفاده می‌کنند. اجرای مجدد متمرکز cross-OS
می‌تواند `cross_os_suite_filter=windows/packaged-upgrade` یا فیلتر OS/suite دیگری
را اضافه کند. شکست‌های QA release-check، اعتبارسنجی معمول انتشار را block می‌کنند،
از جمله drift لازم ابزار dynamic OpenClaw در tier استاندارد. اجراهای alpha
Tideclaw هنوز ممکن است laneهای release-check غیرمرتبط با package-safety را
advisory بدانند. وقتی `live_suite_filter` صراحتا یک lane زنده QA gated مانند
Discord، WhatsApp یا Slack را درخواست می‌کند، متغیر repo متناظر
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` باید فعال باشد؛ در غیر این صورت capture
ورودی به‌جای skip بی‌صدای lane، fail می‌شود.

### Vitest

جعبه Vitest همان workflow فرزند دستی `CI` است. CI دستی عمدا scoping تغییرات را
دور می‌زند و graph آزمون معمول را برای release candidate اجباری می‌کند: shardهای
Linux Node، shardهای Plugin bundled، shardهای contract Plugin و channel،
سازگاری Node 22، `check-*`، `check-additional-*`، بررسی‌های smoke artifact ساخته‌شده،
بررسی‌های docs، Skills پایتون، Windows، macOS و i18n مربوط به Control UI.
Android زمانی شامل می‌شود که `Full Release Validation` این جعبه را اجرا کند، چون
چتر `include_android=true` را پاس می‌دهد؛ CI دستی مستقل برای پوشش Android به
`include_android=true` نیاز دارد.

از این جعبه برای پاسخ به این پرسش استفاده کنید: «آیا درخت منبع، suite کامل آزمون
معمول را پاس کرد؟»
این همان اعتبارسنجی محصول در مسیر انتشار نیست. شواهدی که باید نگه دارید:

- خلاصه `Full Release Validation` که URL اجرای `CI` dispatch‌شده را نشان می‌دهد
- سبز بودن اجرای `CI` روی SHA هدف دقیق
- نام shardهای fail شده یا کند از jobهای CI هنگام بررسی regressionها
- artifactهای زمان‌بندی Vitest مانند `.artifacts/vitest-shard-timings.json` وقتی
  یک اجرا به تحلیل performance نیاز دارد

CI دستی را مستقیما فقط وقتی اجرا کنید که انتشار به CI معمول deterministic نیاز دارد
اما به جعبه‌های Docker، QA Lab، live، cross-OS یا package نیاز ندارد. برای CI
مستقیم غیر Android از دستور اول استفاده کنید. وقتی CI مستقیم release-candidate
باید Android را پوشش دهد، `include_android=true` را اضافه کنید:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

جعبه Docker در `OpenClaw Release Checks` از طریق
`openclaw-live-and-e2e-checks-reusable.yml`، به‌علاوه workflow
`install-smoke` در حالت release قرار دارد. این جعبه release candidate را از طریق
محیط‌های Docker بسته‌بندی‌شده اعتبارسنجی می‌کند، نه فقط آزمون‌های سطح source.

پوشش Docker انتشار شامل موارد زیر است:

- install smoke کامل با slow Bun global install smoke فعال
- آماده‌سازی/بازاستفاده image smoke مربوط به root Dockerfile بر اساس SHA هدف،
  با jobهای QR، root/gateway و installer/Bun smoke که به‌صورت shardهای جداگانه
  install-smoke اجرا می‌شوند
- laneهای E2E مخزن
- chunkهای Docker مسیر انتشار: `core`، `package-update-openai`،
  `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`،
  `plugins-runtime-services`,
  `plugins-runtime-install-a`، `plugins-runtime-install-b`،
  `plugins-runtime-install-c`، `plugins-runtime-install-d`،
  `plugins-runtime-install-e`، `plugins-runtime-install-f`،
  `plugins-runtime-install-g` و `plugins-runtime-install-h`
- پوشش OpenWebUI داخل chunk `plugins-runtime-services` هنگام درخواست
- laneهای جداشده نصب/حذف Plugin bundled
  `bundled-plugin-install-uninstall-0` تا
  `bundled-plugin-install-uninstall-23`
- suiteهای provider live/E2E و پوشش مدل live Docker وقتی release checks شامل
  suiteهای live باشند

پیش از اجرای مجدد از artifactهای Docker استفاده کنید. scheduler مسیر انتشار
`.artifacts/docker-tests/` را با logهای lane، `summary.json`، `failures.json`،
زمان‌بندی phaseها، JSON plan scheduler و دستورهای اجرای مجدد upload می‌کند.
برای بازیابی متمرکز، به‌جای اجرای مجدد همه chunkهای انتشار، از
`docker_lanes=<lane[,lane]>` روی workflow قابل بازاستفاده live/E2E استفاده کنید.
دستورهای اجرای مجدد تولیدشده وقتی در دسترس باشند شامل
`package_artifact_run_id` قبلی و ورودی‌های image آماده‌شده Docker هستند، تا یک
lane شکست‌خورده بتواند از همان tarball و imageهای GHCR بازاستفاده کند.

### QA Lab

جعبه QA Lab نیز بخشی از `OpenClaw Release Checks` است. این gate رفتار agentic و
release در سطح channel است، جدا از mechanics بسته Vitest و Docker.

پوشش QA Lab انتشار شامل موارد زیر است:

- lane هم‌ارزی mock که lane کاندید OpenAI را با baseline Opus 4.6 با استفاده از
  agentic parity pack مقایسه می‌کند
- profile سریع QA زنده Matrix با استفاده از محیط `qa-live-shared`
- lane QA زنده Telegram با استفاده از leaseهای credential در Convex CI
- `pnpm qa:otel:smoke`، `pnpm qa:otel:collector-smoke`،
  `pnpm qa:prometheus:smoke`، یا
  `pnpm qa:observability:smoke` وقتی telemetry انتشار به proof محلی صریح نیاز دارد

از این جعبه برای پاسخ به این پرسش استفاده کنید: «آیا انتشار در سناریوهای QA و
flowهای channel زنده درست رفتار می‌کند؟» هنگام تایید انتشار، URLهای artifact برای
laneهای parity، Matrix و Telegram را نگه دارید. پوشش کامل Matrix همچنان به‌عنوان
اجرای دستی sharded QA-Lab در دسترس است، نه lane پیش‌فرض حیاتی برای انتشار.

### Package

جعبه Package، gate محصول قابل نصب است. این جعبه با `Package Acceptance` و resolver
`scripts/resolve-openclaw-package-candidate.mjs` پشتیبانی می‌شود. resolver یک
candidate را به tarball `package-under-test` مصرف‌شده توسط Docker E2E normalize
می‌کند، inventory بسته را اعتبارسنجی می‌کند، version بسته و SHA-256 را ثبت می‌کند
و ref مربوط به workflow harness را جدا از ref منبع بسته نگه می‌دارد.

منابع candidate پشتیبانی‌شده:

- `source=npm`: `openclaw@beta`، `openclaw@latest`، یا یک نسخه انتشار دقیق OpenClaw
- `source=ref`: یک شاخه، برچسب، یا SHA کامل کامیتِ مورد اعتماد `package_ref` را با harness انتخاب‌شده `workflow_ref` بسته‌بندی کنید
- `source=url`: یک `.tgz` عمومی HTTPS را با `package_sha256` الزامی دانلود کنید؛ اعتبارنامه‌های URL، پورت‌های HTTPS غیراستاندارد، نام‌های میزبان یا نشانی‌های resolveشده خصوصی/داخلی/کاربرد ویژه، و redirectهای ناامن رد می‌شوند
- `source=trusted-url`: یک `.tgz` HTTPS را با `package_sha256` و `trusted_source_id` الزامی از یک policy نام‌گذاری‌شده در `.github/package-trusted-sources.json` دانلود کنید؛ از این گزینه برای mirrorهای سازمانی یا مخزن‌های package خصوصیِ تحت مالکیت نگه‌دارنده استفاده کنید، نه افزودن bypass شبکه خصوصی در سطح ورودی به `source=url`
- `source=artifact`: یک `.tgz` بارگذاری‌شده توسط اجرای دیگری از GitHub Actions را دوباره استفاده کنید

`OpenClaw Release Checks`، Package Acceptance را با `source=artifact`، artifact آماده‌شده package انتشار، `suite_profile=custom`، `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`، و `telegram_mode=mock-openai` اجرا می‌کند. Package Acceptance مهاجرت، update، restart به‌روزرسانی configured-auth، نصب live Skills از ClawHub، پاک‌سازی وابستگی‌های کهنه Plugin، fixtureهای Plugin آفلاین، به‌روزرسانی Plugin، و QA بسته Telegram را روی همان tarball resolveشده نگه می‌دارد. بررسی‌های مسدودکننده انتشار از baseline پیش‌فرضِ آخرین package منتشرشده استفاده می‌کنند؛ پروفایل beta با `run_release_soak=true`، `release_profile=stable`، یا `release_profile=full` به همه baselineهای پایدار منتشرشده در npm از `2026.4.23` تا `latest` به‌علاوه fixtureهای issueهای گزارش‌شده گسترش می‌یابد. برای یک candidate که قبلا منتشر شده است از Package Acceptance با `source=npm`، برای tarball محلی npm مبتنی بر SHA پیش از انتشار از `source=ref`، برای mirror سازمانی/خصوصی تحت مالکیت نگه‌دارنده از `source=trusted-url`، یا برای tarball آماده‌شده‌ای که توسط اجرای دیگری از GitHub Actions بارگذاری شده از `source=artifact` استفاده کنید. این جایگزین بومی GitHub برای بیشتر پوشش‌های package/update است که قبلا به Parallels نیاز داشتند. بررسی‌های انتشار میان‌سیستمی هنوز برای onboarding ویژه سیستم‌عامل، installer، و رفتار platform مهم هستند، اما اعتبارسنجی محصول package/update باید Package Acceptance را ترجیح دهد.

چک‌لیست canonical برای update و اعتبارسنجی Plugin، [آزمون updateها و Pluginها](/fa/help/testing-updates-plugins) است. هنگام تصمیم‌گیری درباره اینکه کدام lane محلی، Docker، Package Acceptance، یا release-check تغییر نصب/update Plugin، پاک‌سازی doctor، یا مهاجرت package منتشرشده را اثبات می‌کند، از آن استفاده کنید. مهاجرت کامل update منتشرشده از هر package پایدار `2026.4.23+` یک workflow دستی جداگانه `Update Migration` است، نه بخشی از Full Release CI.

سهل‌گیری legacy در package-acceptance عمدا محدود به بازه زمانی مشخصی است. packageها تا `2026.4.25` می‌توانند برای شکاف‌های metadata که قبلا در npm منتشر شده‌اند از مسیر سازگاری استفاده کنند: ورودی‌های inventory خصوصی QA که در tarball نیستند، نبود `gateway install --wrapper`، نبود patch fileها در fixture گیت مشتق‌شده از tarball، نبود `update.channel` پایدارشده، مکان‌های legacy برای record نصب Plugin، نبود پایداری record نصب marketplace، و مهاجرت metadata config هنگام `plugins update`. package منتشرشده `2026.4.26` ممکن است برای فایل‌های stamp metadata ساخت محلی که قبلا منتشر شده بودند هشدار بدهد. packageهای بعدی باید قراردادهای مدرن package را برآورده کنند؛ همان شکاف‌ها باعث شکست اعتبارسنجی انتشار می‌شوند.

وقتی پرسش انتشار درباره یک package واقعا قابل نصب است، از پروفایل‌های گسترده‌تر Package Acceptance استفاده کنید:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

پروفایل‌های رایج package:

- `smoke`: laneهای سریع نصب package/channel/agent، شبکه Gateway، و reload config
- `package`: قراردادهای install/update/restart/plugin package به‌علاوه proof نصب live Skills از ClawHub؛ این پیش‌فرض release-check است
- `product`: `package` به‌علاوه کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، و OpenWebUI
- `full`: بخش‌های release-path در Docker با OpenWebUI
- `custom`: فهرست دقیق `docker_lanes` برای اجرای دوباره متمرکز

برای proof مربوط به Telegram در package-candidate، `telegram_mode=mock-openai` یا `telegram_mode=live-frontier` را در Package Acceptance فعال کنید. این workflow tarball resolveشده `package-under-test` را به lane مربوط به Telegram پاس می‌دهد؛ workflow مستقل Telegram همچنان یک spec منتشرشده npm را برای بررسی‌های پس از انتشار می‌پذیرد.

## خودکارسازی انتشار release

`OpenClaw Release Publish` نقطه ورود mutating معمول برای انتشار است. این workflowهای trusted-publisher را به ترتیبی که release نیاز دارد هماهنگ می‌کند:

1. برچسب release را checkout کرده و SHA کامیت آن را resolve کنید.
2. بررسی کنید که برچسب از `main` یا `release/*` قابل دسترسی باشد.
3. `pnpm plugins:sync:check` را اجرا کنید.
4. `Plugin NPM Release` را با `publish_scope=all-publishable` و `ref=<release-sha>` dispatch کنید.
5. `Plugin ClawHub Release` را با همان scope و SHA dispatch کنید.
6. `OpenClaw NPM Release` را با برچسب release، dist-tag مربوط به npm، و `preflight_run_id` ذخیره‌شده پس از بررسی `full_release_validation_run_id` ذخیره‌شده dispatch کنید.
7. برای releaseهای پایدار، release گیت‌هاب را به‌صورت draft ایجاد یا به‌روزرسانی کنید، `Windows Node Release` را با `windows_node_tag` صریح و `windows_node_installer_digests` تاییدشده برای candidate dispatch کنید، و assetهای canonical installer/checksum را پیش از انتشار draft بررسی کنید.

نمونه انتشار beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

انتشار پایدار به dist-tag پیش‌فرض beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

ارتقای پایدار مستقیما به `latest` صریح است:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=latest
```

از workflowهای سطح پایین‌تر `Plugin NPM Release` و `Plugin ClawHub Release` فقط برای کارهای repair یا بازانتشار متمرکز استفاده کنید. وقتی `publish_openclaw_npm=true` باشد، `OpenClaw Release Publish` مقدار `plugin_publish_scope=selected` را رد می‌کند تا package اصلی بدون همه Pluginهای رسمی قابل انتشار، از جمله `@openclaw/diffs-language-pack`، منتشر نشود. برای repair یک Plugin انتخاب‌شده، `publish_openclaw_npm=false` را همراه با `plugin_publish_scope=selected` و `plugins=@openclaw/name` تنظیم کنید، یا workflow فرزند را مستقیم dispatch کنید.

## ورودی‌های workflow مربوط به NPM

`OpenClaw NPM Release` این ورودی‌های کنترل‌شده توسط operator را می‌پذیرد:

- `tag`: برچسب release الزامی مانند `v2026.4.2`، `v2026.4.2-1`، یا `v2026.4.2-beta.1`؛ وقتی `preflight_only=true` باشد، برای preflight صرفا اعتبارسنجی می‌تواند SHA کامل ۴۰کاراکتری کامیت فعلی شاخه workflow نیز باشد
- `preflight_only`: مقدار `true` فقط برای اعتبارسنجی/build/package، مقدار `false` برای مسیر انتشار واقعی
- `preflight_run_id`: در مسیر انتشار واقعی الزامی است تا workflow از tarball آماده‌شده در اجرای موفق preflight دوباره استفاده کند
- `npm_dist_tag`: برچسب هدف npm برای مسیر انتشار؛ مقدار پیش‌فرض `beta` است

`OpenClaw Release Publish` این ورودی‌های کنترل‌شده توسط operator را می‌پذیرد:

- `tag`: برچسب release الزامی؛ باید از قبل وجود داشته باشد
- `preflight_run_id`: شناسه اجرای موفق preflight مربوط به `OpenClaw NPM Release`؛ وقتی `publish_openclaw_npm=true` باشد الزامی است
- `full_release_validation_run_id`: شناسه اجرای موفق `Full Release Validation`؛ وقتی `publish_openclaw_npm=true` باشد الزامی است
- `windows_node_tag`: برچسب release دقیق و غیر prerelease مربوط به `openclaw/openclaw-windows-node`؛ برای انتشار پایدار OpenClaw الزامی است
- `windows_node_installer_digests`: نقشه JSON فشرده و تاییدشده برای candidate از نام‌های فعلی installer ویندوز به digestهای pinشده `sha256:` آن‌ها؛ برای انتشار پایدار OpenClaw الزامی است
- `npm_dist_tag`: برچسب هدف npm برای package OpenClaw
- `plugin_publish_scope`: مقدار پیش‌فرض `all-publishable` است؛ از `selected` فقط برای کار repair متمرکز فقط-Plugin با `publish_openclaw_npm=false` استفاده کنید
- `plugins`: نام‌های package با الگوی `@openclaw/*` جداشده با کاما، وقتی `plugin_publish_scope=selected` باشد
- `publish_openclaw_npm`: مقدار پیش‌فرض `true` است؛ فقط وقتی workflow را به‌عنوان هماهنگ‌کننده repair فقط-Plugin استفاده می‌کنید، `false` تنظیم کنید
- `wait_for_clawhub`: مقدار پیش‌فرض `false` است تا در دسترس بودن npm توسط sidecar ClawHub مسدود نشود؛ فقط وقتی completion workflow باید شامل completion در ClawHub باشد، `true` تنظیم کنید

`OpenClaw Release Checks` این ورودی‌های کنترل‌شده توسط operator را می‌پذیرد:

- `ref`: شاخه، برچسب، یا SHA کامل کامیت برای اعتبارسنجی. بررسی‌های دارای secret نیاز دارند که کامیت resolveشده از یک شاخه OpenClaw یا برچسب release قابل دسترسی باشد.
- `run_release_soak`: opt in برای live/E2E کامل، release-path در Docker، و soak upgrade-survivor از همه نسخه‌های قبلی برای بررسی‌های انتشار beta. با `release_profile=stable` و `release_profile=full` اجباری فعال می‌شود.

قوانین:

- برچسب‌های پایدار و correction می‌توانند در `beta` یا `latest` منتشر شوند
- برچسب‌های prerelease beta فقط می‌توانند در `beta` منتشر شوند
- برای `OpenClaw NPM Release`، ورودی SHA کامل کامیت فقط وقتی مجاز است که `preflight_only=true` باشد
- `OpenClaw Release Checks` و `Full Release Validation` همیشه فقط برای اعتبارسنجی هستند
- مسیر انتشار واقعی باید از همان `npm_dist_tag` استفاده کند که در preflight استفاده شده بود؛ workflow پیش از ادامه انتشار آن metadata را بررسی می‌کند

## توالی انتشار پایدار npm

هنگام ساخت یک release پایدار npm:

1. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید
   - پیش از وجود برچسب، می‌توانید از SHA کامل commit شاخهٔ workflow فعلی
     برای اجرای آزمایشی فقط-اعتبارسنجی workflow پیش‌پرواز استفاده کنید
2. برای جریان معمول ابتدا-بتا، `npm_dist_tag=beta` را انتخاب کنید، یا فقط زمانی `latest`
   را انتخاب کنید که عمداً انتشار پایدار مستقیم می‌خواهید
3. وقتی CI معمول به‌همراه پوشش زندهٔ prompt cache، Docker، QA Lab،
   Matrix و Telegram را از یک workflow دستی می‌خواهید، `Full Release Validation` را روی شاخهٔ انتشار، برچسب انتشار، یا SHA کامل
   commit اجرا کنید
4. اگر عمداً فقط به گراف آزمون معمول و قطعی نیاز دارید، به‌جای آن
   workflow دستی `CI` را روی ref انتشار اجرا کنید
5. برچسب انتشار دقیق و غیرپیش‌انتشار `openclaw/openclaw-windows-node` را انتخاب کنید
   که نصب‌کننده‌های امضاشدهٔ x64 و ARM64 آن باید منتشر شوند. آن را به‌عنوان
   `windows_node_tag` ذخیره کنید، و نقشهٔ digest اعتبارسنجی‌شدهٔ آن‌ها را به‌عنوان
   `windows_node_installer_digests` ذخیره کنید. ابزار کمکی release-candidate هر دو را ثبت می‌کند
   و آن‌ها را در فرمان انتشار تولیدشدهٔ خود می‌گنجاند.
6. `preflight_run_id` و `full_release_validation_run_id` موفق را ذخیره کنید
7. `OpenClaw Release Publish` را با همان `tag`، همان `npm_dist_tag`،
   `windows_node_tag` انتخاب‌شده، `windows_node_installer_digests` ذخیره‌شدهٔ آن،
   `preflight_run_id` ذخیره‌شده، و `full_release_validation_run_id` ذخیره‌شده اجرا کنید؛
   این کار Pluginهای externalized را پیش از ترویج بستهٔ npm مربوط به OpenClaw
   در npm و ClawHub منتشر می‌کند
8. اگر انتشار روی `beta` فرود آمد، از workflow
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   برای ترویج آن نسخهٔ پایدار از `beta` به `latest` استفاده کنید
9. اگر انتشار عمداً مستقیماً روی `latest` منتشر شد و `beta`
   باید فوراً همان ساخت پایدار را دنبال کند، از همان workflow انتشار
   برای اشاره دادن هر دو dist-tag به نسخهٔ پایدار استفاده کنید، یا اجازه دهید همگام‌سازی
   خودترمیم زمان‌بندی‌شدهٔ آن بعداً `beta` را جابه‌جا کند

تغییر dist-tag در مخزن دفترکل انتشار قرار دارد، چون همچنان به
`NPM_TOKEN` نیاز دارد، در حالی که مخزن منبع انتشار فقط-با-OIDC را نگه می‌دارد.

این کار باعث می‌شود هم مسیر انتشار مستقیم و هم مسیر ترویج ابتدا-بتا
مستند و برای اپراتور قابل مشاهده بمانند.

اگر نگه‌دارنده‌ای ناچار به استفادهٔ پشتیبان از احراز هویت محلی npm شود، هر فرمان
CLI (`op`) مربوط به 1Password را فقط داخل یک نشست tmux اختصاصی اجرا کنید. `op` را
مستقیماً از shell اصلی agent فراخوانی نکنید؛ نگه داشتن آن داخل tmux باعث می‌شود promptها،
هشدارها، و مدیریت OTP قابل مشاهده باشند و از هشدارهای مکرر میزبان جلوگیری می‌کند.

## ارجاع‌های عمومی

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

نگه‌دارندگان برای runbook واقعی از مستندات انتشار خصوصی در
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
استفاده می‌کنند.

## مرتبط

- [کانال‌های انتشار](/fa/install/development-channels)
