---
read_when:
    - در حال جست‌وجو برای تعریف‌های کانال انتشار عمومی
    - اجرای اعتبارسنجی انتشار یا پذیرش بسته
    - در جست‌وجوی نام‌گذاری نسخه‌ها و آهنگ انتشار
summary: لاین‌های انتشار، چک‌لیست اپراتور، جعبه‌های اعتبارسنجی، نام‌گذاری نسخه، و آهنگ انتشار
title: سیاست انتشار
x-i18n:
    generated_at: "2026-07-04T18:15:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00772c1a2ad62eb7138b1eda581786390835add0a96996114cac2fd77edb367
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw در حال حاضر سه کانال به‌روزرسانی کاربرمحور ارائه می‌کند:

- stable: کانال انتشار ارتقایافتهٔ موجود، که تا زمان تکمیل نقطه‌عطف CLI/کانال جداگانه همچنان از طریق
  npm `latest` resolve می‌شود
- beta: تگ‌های پیش‌انتشار که در npm `beta` منتشر می‌شوند
- dev: سر متحرک `main`

به‌صورت جداگانه، اپراتورهای انتشار می‌توانند بستهٔ core مربوط به ماه کامل‌شدهٔ پیشین
را از patch `33` به بعد در npm `extended-stable` منتشر کنند. خط final عادیِ ماه جاری
روی npm `latest` ادامه پیدا می‌کند؛ این تفکیک انتشار در سمت اپراتور، به‌تنهایی resolution کانال به‌روزرسانی CLI را تغییر نمی‌دهد.

## نام‌گذاری نسخه

- نسخهٔ انتشار ماهانهٔ npm extended-stable: `YYYY.M.PATCH`، با `PATCH >= 33`
  - تگ Git: `vYYYY.M.PATCH`
- نسخهٔ انتشار final روزانه/عادی: `YYYY.M.PATCH`، با `PATCH < 33`
  - تگ Git: `vYYYY.M.PATCH`
- نسخهٔ انتشار اصلاح fallback عادی: `YYYY.M.PATCH-N`
  - تگ Git: `vYYYY.M.PATCH-N`
- نسخهٔ پیش‌انتشار beta: `YYYY.M.PATCH-beta.N`
  - تگ Git: `vYYYY.M.PATCH-beta.N`
- ماه یا patch را با صفر در ابتدا ننویسید
- از به‌روزرسانی فرایند انتشار ژوئن ۲۰۲۶ به بعد، مؤلفهٔ سوم یک
  شمارهٔ ترتیبی قطار انتشار ماهانه است، نه روز تقویمی. انتشارهای stable و beta
  قطار فعلی را تعیین می‌کنند؛ تگ‌های فقط alpha شمارهٔ patch مربوط به beta/stable را مصرف یا
  جلو نمی‌برند. تگ‌ها و نسخه‌های npm پیش از این به‌روزرسانی نام‌های موجود خود را حفظ می‌کنند
  و معتبر می‌مانند؛ اتوماسیون انتشار همچنان آن‌ها را بر اساس سال، ماه، patch، کانال، و شمارهٔ
  پیش‌انتشار یا اصلاح مقایسه می‌کند.
- بیلدهای alpha/nightly از قطار patch منتشرنشدهٔ بعدی استفاده می‌کنند و برای بیلدهای تکراری فقط
  `alpha.N` را افزایش می‌دهند. وقتی آن patch یک beta داشته باشد، بیلدهای alpha جدید
  به patch بعدی منتقل می‌شوند. هنگام انتخاب قطار beta یا stable، تگ‌های قدیمی فقط alpha با
  شماره‌های patch بالاتر را نادیده بگیرید.
- نسخه‌های npm تغییرناپذیرند. اگر یک تگ beta قبلاً منتشر شده باشد، آن را
  حذف، دوباره منتشر، یا دوباره استفاده نکنید؛ در عوض شمارهٔ beta بعدی یا patch ماهانهٔ بعدی را cut کنید.
  چون `2026.6.5-beta.1` در زمان گذار قبلاً منتشر شده بود، قطارهای انتشار ژوئن ۲۰۲۶
  باید از patch `5` یا بالاتر استفاده کنند. قطارهای stable یا beta جدید ژوئن ۲۰۲۶ را با
  `2026.6.2`، `2026.6.3`، یا `2026.6.4` منتشر نکنید.
- پس از final عادی `2026.6.5`، قطار beta جدید بعدی
  `2026.6.6-beta.1` است، حتی
  اگر تگ‌های خودکار فقط alpha با شماره‌های patch بالاتر از قبل وجود داشته باشند.
- `latest` همچنان از خط npm عادی/روزانهٔ فعلی پیروی می‌کند
- `beta` یعنی هدف نصب beta فعلی
- `extended-stable` یعنی بستهٔ npm پشتیبانی‌شدهٔ ماه پیشین، از patch
  `33` به بعد؛ patch `34` و بعد از آن انتشارهای نگهداشت روی همان خط ماهانه هستند
- مسیر اختصاصی extended-stable ماهانه فقط بستهٔ core npm را منتشر می‌کند. این مسیر
  plugins، artifactهای macOS یا Windows، GitHub Release،
  dist-tagهای مخزن خصوصی، Docker imageها، artifactهای موبایل، یا دانلودهای وب‌سایت را منتشر نمی‌کند.

## آهنگ انتشار

- انتشارها ابتدا به beta می‌روند
- stable فقط پس از اعتبارسنجی آخرین beta دنبال می‌شود
- نگه‌دارندگان معمولاً انتشارها را از شاخهٔ `release/YYYY.M.PATCH` که
  از `main` فعلی ساخته شده است cut می‌کنند، تا اعتبارسنجی و اصلاح‌های انتشار جلوی
  توسعهٔ جدید روی `main` را نگیرد
- اگر یک تگ beta push یا منتشر شده باشد و به اصلاح نیاز داشته باشد، نگه‌دارندگان
  به‌جای حذف یا بازسازی تگ beta قدیمی، تگ `-beta.N` بعدی را cut می‌کنند
- رویهٔ تفصیلی انتشار، تأییدها، اعتبارنامه‌ها، و یادداشت‌های بازیابی
  فقط مخصوص نگه‌دارندگان است

## انتشار ماهانهٔ extended-stable فقط برای npm

این یک استثنای اختصاصی نسبت به رویهٔ عادی انتشار در پایین است. برای یک
ماه کامل‌شدهٔ `YYYY.M`، شاخهٔ `extended-stable/YYYY.M.33` را بسازید؛ `vYYYY.M.33` و
patchهای نگهداشت بعدی را از همان شاخه منتشر کنید. تگ انتشار، نوک شاخه،
checkout، نسخهٔ package، پیش‌پرواز npm، و اجرای اعتبارسنجی کامل انتشار باید
همگی همان commit را مشخص کنند. `main` محافظت‌شده باید از قبل شامل نسخهٔ final مربوط به یک ماه تقویمی
کاملاً بعدتر و زیر patch `33` باشد؛ patchهای نگهداشت حتی پس از آنکه `main` بیش از یک ماه جلو می‌رود
همچنان واجد شرایط می‌مانند.

پیش‌پرواز npm و اعتبارسنجی کامل انتشار را از همان شاخهٔ extended-stable دقیق اجرا کنید،
سپس هر دو run ID را ذخیره کنید:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable

gh workflow run full-release-validation.yml \
  --ref extended-stable/YYYY.M.33 \
  -f ref=extended-stable/YYYY.M.33 \
  -f release_profile=stable
```

`release_profile=stable` پروفایل عمق اعتبارسنجی موجود است؛ این گزینه
از dist-tag npm `extended-stable` جداست و عمداً بدون تغییر مانده است.

پس از موفقیت هر دو اجرا و آماده شدن محیط انتشار npm، tarball دقیق پیش‌پرواز را
ارتقا دهید. patch `P` باید `33` یا بیشتر باشد:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id>
```

برای یک fork یا تمرین غیرتولیدی که عمداً نمی‌تواند سیاست ماهانهٔ
`.33` یا ماه `main` محافظت‌شده را برآورده کند، به هر دو dispatch پیش‌پرواز و انتشار npm
`-f bypass_extended_stable_guard=true` را اضافه کنید.
مقدار پیش‌فرض `false` است. این bypass فقط با `npm_dist_tag=extended-stable` پذیرفته می‌شود و
در خلاصهٔ workflow ثبت می‌شود. این گزینه ref متعارف workflow
`extended-stable/YYYY.M.33`، برابری نوک شاخه/تگ/checkout، syntax تگ final،
برابری نسخهٔ package/tag، هویت run و manifest ارجاع‌شده،
منشأ tarball، تأیید محیط، readback registry، یا شواهد repair selector
را دور نمی‌زند.

workflow انتشار هویت runهای ارجاع‌شده، digest tarball آماده‌شده،
و هر دو selector رجیستری npm را بررسی می‌کند. پس از موفقیت workflow، نتیجه را
به‌طور مستقل تأیید کنید:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

هر دو دستور باید `YYYY.M.P` را برگردانند. اگر انتشار موفق شود اما readback selector
شکست بخورد، نسخهٔ package تغییرناپذیر را دوباره منتشر نکنید. از همان دستور repair
`npm dist-tag add openclaw@YYYY.M.P extended-stable` که در خلاصهٔ always-run workflow شکست‌خورده چاپ شده است استفاده کنید،
سپس هر دو readback مستقل را تکرار کنید. rollback به selector قبلی یک تصمیم جداگانهٔ اپراتور است، نه
مسیر repair readback.

چک‌لیست عادی پایین همچنان مالک beta، `latest`، GitHub Release،
plugins، macOS، Windows، و انتشار سایر پلتفرم‌ها است. آن گام‌ها را
برای این مسیر extended-stable فقط npm اجرا نکنید.

## چک‌لیست اپراتور انتشار عادی

این چک‌لیست شکل عمومی جریان انتشار است. اعتبارنامه‌های خصوصی،
امضا، notarization، بازیابی dist-tag، و جزئیات rollback اضطراری در
runbook انتشار مخصوص نگه‌دارندگان باقی می‌مانند.

1. از `main` فعلی شروع کنید: آخرین تغییرات را pull کنید، تأیید کنید commit هدف push شده است،
   و تأیید کنید CI فعلی `main` به‌اندازه کافی سبز است که بتوان از آن branch گرفت.
2. بخش بالایی `CHANGELOG.md` را از PRهای merge شده و همه commitهای مستقیم
   از آخرین release tag قابل‌دسترسی تولید کنید. ورودی‌ها را کاربرمحور نگه دارید،
   ورودی‌های هم‌پوشان PR/commit مستقیم را dedupe کنید، بازنویسی را commit و push کنید،
   و پیش از branch گرفتن یک بار دیگر rebase/pull کنید.
3. رکوردهای سازگاری release را در
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts` بررسی کنید. سازگاری منقضی‌شده را فقط وقتی حذف کنید
   که مسیر upgrade همچنان پوشش دارد، یا ثبت کنید چرا عمداً نگه داشته شده است.
4. `release/YYYY.M.PATCH` را از `main` فعلی بسازید؛ کار عادی release را
   مستقیماً روی `main` انجام ندهید.
5. هر محل نسخه لازم را برای tag موردنظر bump کنید، سپس
   `pnpm release:prep` را اجرا کنید. این دستور نسخه‌های plugin، موجودی plugin، schema پیکربندی،
   metadata پیکربندی channelهای bundled، baseline مستندات پیکربندی، exportهای SDK مربوط به plugin،
   و baseline API مربوط به SDK مربوط به plugin را با ترتیب درست refresh می‌کند. هر drift تولیدشده را
   پیش از tag کردن commit کنید. سپس preflight قطعی محلی را اجرا کنید:
   `pnpm check:test-types`، `pnpm check:architecture`،
   `pnpm build && pnpm ui:build`، و `pnpm release:check`.
6. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید. پیش از وجود tag،
   یک SHA کامل ۴۰ کاراکتری از release branch برای preflight فقط جهت اعتبارسنجی
   مجاز است. preflight شواهد release وابستگی‌ها را برای graph دقیق وابستگی‌های
   checkout شده تولید می‌کند و آن را در artifact مربوط به preflight npm ذخیره می‌کند.
   `preflight_run_id` موفق را ذخیره کنید.
7. همه تست‌های پیش از release را با `Full Release Validation` برای
   release branch، tag، یا SHA کامل commit شروع کنید. این تنها entrypoint دستی
   برای چهار test box بزرگ release است: Vitest، Docker، QA Lab، و Package.
8. اگر اعتبارسنجی شکست خورد، روی release branch اصلاح کنید و کوچک‌ترین
   فایل، lane، job workflow، profile package، provider، یا model allowlist شکست‌خورده را
   که اصلاح را اثبات می‌کند دوباره اجرا کنید. umbrella کامل را فقط وقتی دوباره اجرا کنید
   که سطح تغییریافته شواهد قبلی را stale کرده باشد.
9. برای candidate بتای tag شده،
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` را از branch متناظر
   `release/YYYY.M.PATCH` اجرا کنید. برای stable، source release ویندوز لازم را هم پاس دهید:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   helper بررسی‌های محلی generated-release را اجرا می‌کند، شواهد full release validation و npm preflight را dispatch یا verify می‌کند، proof تازه/update مربوط به Parallels را علیه tarball دقیق آماده‌شده به‌همراه proof package مربوط به Telegram اجرا می‌کند، planهای plugin npm و ClawHub را ثبت می‌کند، و فقط پس از سبز شدن evidence bundle دستور دقیق
   `OpenClaw Release Publish` را چاپ می‌کند.
   `OpenClaw Release Publish` packageهای plugin انتخاب‌شده یا همه packageهای قابل publish را
   به npm و همان مجموعه را به ClawHub به‌صورت parallel dispatch می‌کند، و سپس artifact آماده‌شده OpenClaw npm preflight را با dist-tag متناظر به‌محض موفقیت publish plugin npm promote می‌کند.
   پس از موفقیت child مربوط به publish در OpenClaw npm، صفحه GitHub release/prerelease متناظر را از بخش کامل و متناظر
   `CHANGELOG.md` ایجاد یا به‌روزرسانی می‌کند. releaseهای stable منتشرشده به npm `latest` به
   GitHub latest release تبدیل می‌شوند؛ releaseهای نگه‌داری stable که روی npm `beta` نگه داشته شده‌اند
   با GitHub `latest=false` ایجاد می‌شوند. workflow همچنین شواهد dependency مربوط به preflight،
   manifest full-validation، و شواهد verification رجیستری postpublish را برای پاسخ به incident پس از release
   در GitHub release آپلود می‌کند. workflow publish فوراً child run IDها را چاپ می‌کند، gateهای release environment را که workflow token مجاز به approve کردنشان است auto-approve می‌کند، child jobهای شکست‌خورده را با log tailها خلاصه می‌کند، GitHub release و dependency evidence را به‌محض موفقیت publish در OpenClaw npm close out می‌کند، هر زمان OpenClaw npm در حال publish شدن باشد منتظر ClawHub می‌ماند، سپس `pnpm release:verify-beta` را اجرا می‌کند و شواهد postpublish را برای GitHub release، package npm، packageهای plugin npm انتخاب‌شده، packageهای ClawHub انتخاب‌شده، child workflow run IDها، و NPM Telegram run ID اختیاری آپلود می‌کند. مسیر ClawHub شکست‌های transient نصب dependency در CLI را retry می‌کند، pluginهایی را که preview آن‌ها pass شده حتی وقتی یک preview cell flake می‌شود publish می‌کند، و با verification رجیستری برای هر نسخه موردانتظار plugin پایان می‌یابد تا publishهای partial همچنان قابل‌مشاهده و قابل retry بمانند. سپس package acceptance پس از publish را علیه package منتشرشده
   `openclaw@YYYY.M.PATCH-beta.N` یا
   `openclaw@beta` اجرا کنید. اگر prerelease push شده یا منتشرشده به fix نیاز داشت،
   شماره prerelease متناظر بعدی را cut کنید؛ prerelease قدیمی را حذف یا بازنویسی نکنید.
10. برای stable، فقط پس از اینکه بتا یا release candidate بررسی‌شده شواهد اعتبارسنجی لازم را داشت
    ادامه دهید. publish stable npm نیز از طریق
    `OpenClaw Release Publish` انجام می‌شود و artifact موفق preflight را از طریق
    `preflight_run_id` دوباره استفاده می‌کند؛ آمادگی release stable macOS همچنین به
    `.zip`، `.dmg`، `.dSYM.zip` بسته‌بندی‌شده، و `appcast.xml` به‌روزشده روی `main` نیاز دارد.
    workflow publish macOS پس از verify شدن assetهای release، appcast امضاشده را به‌صورت خودکار روی `main` عمومی publish می‌کند؛ اگر branch protection مانع push مستقیم شود، یک PR مربوط به appcast را باز یا update می‌کند. آمادگی Windows Hub برای stable به assetهای امضاشده `OpenClawCompanion-Setup-x64.exe`،
    `OpenClawCompanion-Setup-arm64.exe`، و
    `OpenClawCompanion-SHA256SUMS.txt` روی GitHub release مربوط به OpenClaw نیاز دارد.
    tag دقیق release امضاشده `openclaw/openclaw-windows-node` را به‌عنوان
    `windows_node_tag` و map digest نصب‌کننده candidate-approved آن را به‌عنوان
    `windows_node_installer_digests` پاس دهید؛ `OpenClaw Release Publish` draft release را نگه می‌دارد، `Windows Node Release` را dispatch می‌کند، و هر سه asset را پیش از publication verify می‌کند.
11. پس از publish، verifier پس از publish مربوط به npm، E2E اختیاری Telegram برای npm منتشرشده standalone وقتی به proof channel پس از publish نیاز دارید،
    promote کردن dist-tag در صورت نیاز، verify صفحه GitHub release تولیدشده،
    مراحل اعلام release، و سپس [closeout پایدار main](#stable-main-closeout) را پیش از تمام‌شده دانستن release stable کامل کنید.

## closeout پایدار main

انتشار stable تا وقتی `main` state واقعی release ship شده را حمل نکند کامل نیست.

1. از تازه‌ترین `main` شروع کنید. `release/YYYY.M.PATCH` را نسبت به آن audit کنید و
   fixهای واقعی را که در `main` غایب‌اند forward-port کنید. سازگاری، test، یا adapterهای اعتبارسنجی مخصوص release را کورکورانه به `main` جدیدتر merge نکنید.
2. `main` را روی نسخه stable ship شده تنظیم کنید، نه یک train بعدی speculative. پس از تغییر نسخه root،
   `pnpm release:prep` را اجرا کنید، سپس
   `pnpm deps:shrinkwrap:generate`.
3. بخش `## YYYY.M.PATCH` مربوط به `CHANGELOG.md` روی `main` را دقیقاً با
   release branch tag شده یکسان کنید. وقتی release mac یکی منتشر کرده است، update مربوط به stable `appcast.xml` را هم شامل کنید.
4. تا وقتی operator صراحتاً آن release train را شروع نکرده است، `YYYY.M.PATCH+1`، نسخه بتا، یا بخش changelog آینده خالی را به `main` اضافه نکنید.
5. `pnpm release:generated:check`، `pnpm deps:shrinkwrap:check`، و
   `OPENCLAW_TESTBOX=1 pnpm check:changed` را اجرا کنید. push کنید، سپس پیش از تمام‌شده دانستن release stable تأیید کنید `origin/main`
   نسخه ship شده و changelog را شامل می‌شود.
6. متغیرهای repository یعنی `RELEASE_ROLLBACK_DRILL_ID` و
   `RELEASE_ROLLBACK_DRILL_DATE` را پس از هر rollback drill خصوصی current نگه دارید.
   `OpenClaw Stable Main Closeout` از push مربوط به `main` شروع می‌کند که نسخه ship شده، changelog، و appcast را پس از انتشار stable حمل می‌کند. این workflow شواهد immutable postpublish را می‌خواند تا tag ship شده را به Full Release Validation و Publish runهای آن bind کند، سپس state پایدار main، release، soak الزامی stable، و شواهد performance مسدودکننده را verify می‌کند. یک manifest closeout و checksum immutable را به GitHub release attach می‌کند. trigger خودکار push releaseهای legacy را که پیش از شواهد immutable postpublish هستند skip می‌کند؛ هرگز آن skip را closeout کامل‌شده تلقی نمی‌کند. closeout کامل به هر دو asset و checksum متناظر نیاز دارد. manifest partial، SHA ثبت‌شده `main` و rollback drill خود را replay می‌کند تا byteهای یکسان را regenerate کند، سپس checksum گمشده را attach می‌کند؛ pair نامعتبر، یا checksum بدون manifest، همچنان blocking می‌ماند. run تحریک‌شده با push بدون متغیرهای repository مربوط به rollback drill، بدون تکمیل closeout skip می‌شود؛ رکورد drill گمشده یا قدیمی‌تر از ۹۰ روز همچنان closeout دستی evidence-backed را block می‌کند. دستورهای recovery خصوصی در runbook فقط مخصوص maintainer باقی می‌مانند.
   از dispatch دستی فقط برای repair یا replay کردن closeout stable مبتنی بر evidence استفاده کنید.
   یک correction tag fallback مربوط به legacy می‌تواند فقط وقتی شواهد base-package را دوباره استفاده کند
   که correction tag به همان source commit مربوط به base stable tag resolve شود.
   correction با source متفاوت باید شواهد package خودش را publish و verify کند.

## Release preflight

- پیش از پیش‌پرواز انتشار، `pnpm check:test-types` را اجرا کنید تا TypeScript تست‌ها خارج از گیت سریع‌تر محلی `pnpm check` همچنان پوشش داده شود
- پیش از پیش‌پرواز انتشار، `pnpm check:architecture` را اجرا کنید تا بررسی‌های گسترده‌تر چرخه import و مرزهای معماری خارج از گیت سریع‌تر محلی سبز باشند
- پیش از `pnpm release:check`، `pnpm build && pnpm ui:build` را اجرا کنید تا آرتیفکت‌های انتشار مورد انتظار `dist/*` و باندل Control UI برای مرحله اعتبارسنجی pack وجود داشته باشند
- پس از افزایش نسخه ریشه و پیش از tag کردن، `pnpm release:prep` را اجرا کنید. این فرمان همه تولیدکننده‌های قطعی انتشار را که معمولا پس از تغییر نسخه/پیکربندی/API دچار drift می‌شوند اجرا می‌کند: نسخه‌های Plugin، موجودی Plugin، schema پیکربندی پایه، فراداده پیکربندی کانال‌های باندل‌شده، baseline مستندات پیکربندی، exportهای plugin SDK، و baseline API plugin SDK. `pnpm release:check` این guardها را دوباره در حالت check اجرا می‌کند و پیش از اجرای بررسی‌های انتشار پکیج، هر خطای drift تولیدشده‌ای را که پیدا کند در یک گذر گزارش می‌دهد.
- همگام‌سازی نسخه Plugin، نسخه‌های پکیج Plugin رسمی و floorهای موجود `openclaw.compat.pluginApi` را به‌طور پیش‌فرض به نسخه انتشار OpenClaw به‌روزرسانی می‌کند. با آن فیلد به‌عنوان floor مربوط به API زمان اجرای/plugin SDK رفتار کنید، نه فقط کپی نسخه پکیج: برای انتشارهای فقط Plugin که عمدا با میزبان‌های قدیمی‌تر OpenClaw سازگار می‌مانند، floor را روی قدیمی‌ترین API میزبان پشتیبانی‌شده نگه دارید و این انتخاب را در اثبات انتشار Plugin مستند کنید.
- پیش از تأیید انتشار، workflow دستی `Full Release Validation` را اجرا کنید تا همه test boxهای پیش از انتشار از یک نقطه ورود آغاز شوند. این workflow یک branch، tag، یا SHA کامل commit می‌پذیرد، `CI` دستی را dispatch می‌کند، و `OpenClaw Release Checks` را برای smoke نصب، پذیرش پکیج، بررسی‌های پکیج میان‌سیستمی، هم‌ارزی QA Lab، Matrix، و laneهای Telegram dispatch می‌کند. اجراهای پایدار و کامل همیشه شامل live/E2E جامع و soak مسیر انتشار Docker هستند؛ `run_release_soak=true` برای soak صریح beta حفظ شده است. Package Acceptance در زمان اعتبارسنجی candidate، E2E Telegram پکیج canonical را فراهم می‌کند و از poller زنده هم‌زمان دوم جلوگیری می‌کند.
  پس از انتشار beta، `release_package_spec` را ارائه کنید تا پکیج npm منتشرشده در release checks، Package Acceptance، و E2E Telegram پکیج بدون بازساخت tarball انتشار دوباره استفاده شود. فقط زمانی `npm_telegram_package_spec` را ارائه کنید که Telegram باید از پکیج منتشرشده‌ای متفاوت از بقیه اعتبارسنجی انتشار استفاده کند. زمانی `package_acceptance_package_spec` را ارائه کنید که Package Acceptance باید از پکیج منتشرشده‌ای متفاوت از spec پکیج انتشار استفاده کند. زمانی `evidence_package_spec` را ارائه کنید که گزارش شواهد انتشار باید اثبات کند اعتبارسنجی با یک پکیج npm منتشرشده منطبق است، بدون اینکه Telegram E2E را اجبار کند.
  مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- زمانی workflow دستی `Package Acceptance` را اجرا کنید که در حین ادامه کار انتشار، اثبات side-channel برای یک candidate پکیج می‌خواهید. از `source=npm` برای `openclaw@beta`، `openclaw@latest`، یا نسخه انتشار دقیق؛ از `source=ref` برای pack کردن branch/tag/SHA معتبر `package_ref` با harness فعلی `workflow_ref`؛ از `source=url` برای tarball عمومی HTTPS با SHA-256 الزامی و سیاست سخت‌گیرانه URL عمومی؛ از `source=trusted-url` برای سیاست named trusted-source با `trusted_source_id` و SHA-256 الزامی؛ یا از `source=artifact` برای tarball آپلودشده توسط اجرای دیگری از GitHub Actions استفاده کنید. این workflow candidate را به `package-under-test` resolve می‌کند، release scheduler مربوط به Docker E2E را در برابر آن tarball دوباره استفاده می‌کند، و می‌تواند QA Telegram را با `telegram_mode=mock-openai` یا `telegram_mode=live-frontier` روی همان tarball اجرا کند. وقتی laneهای Docker انتخاب‌شده شامل `published-upgrade-survivor` باشند، آرتیفکت پکیج همان candidate است و `published_upgrade_survivor_baseline`، baseline منتشرشده را انتخاب می‌کند. `update-restart-auth` از پکیج candidate هم به‌عنوان CLI نصب‌شده و هم به‌عنوان package-under-test استفاده می‌کند تا مسیر restart مدیریت‌شده فرمان update مربوط به candidate را تمرین کند.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  profileهای رایج:
  - `smoke`: laneهای نصب/کانال/agent، شبکه Gateway، و بارگذاری مجدد پیکربندی
  - `package`: laneهای پکیج/update/restart/plugin بومی آرتیفکت، بدون OpenWebUI یا ClawHub زنده
  - `product`: profile پکیج به‌علاوه کانال‌های MCP، پاک‌سازی cron/subagent،
    جست‌وجوی وب OpenAI، و OpenWebUI
  - `full`: chunkهای مسیر انتشار Docker با OpenWebUI
  - `custom`: انتخاب دقیق `docker_lanes` برای rerun متمرکز
- زمانی workflow دستی `CI` را مستقیما اجرا کنید که فقط به پوشش CI معمول قطعی برای release candidate نیاز دارید. dispatchهای CI دستی از scoping تغییرات عبور می‌کنند و shardهای Linux Node، shardهای Plugin باندل‌شده، shardهای قرارداد Plugin و کانال، سازگاری Node 22، `check-*`، `check-additional-*`، بررسی‌های smoke آرتیفکت ساخته‌شده، بررسی‌های docs، Python skills، Windows، macOS، و laneهای i18n Control UI را اجباری می‌کنند. اجراهای مستقل CI دستی فقط زمانی Android را اجرا می‌کنند که با `include_android=true` dispatch شوند؛ `Full Release Validation` این input را برای فرزند CI خود پاس می‌دهد.
  مثال با Android: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- هنگام اعتبارسنجی telemetry انتشار، `pnpm qa:otel:smoke` را اجرا کنید. این فرمان QA-lab را از طریق گیرنده محلی OTLP/HTTP تمرین می‌کند و export شدن trace، metric، و log، به‌علاوه attributeهای trace محدودشده و redaction محتوا/شناسه را بدون نیاز به Opik، Langfuse، یا collector خارجی دیگر تأیید می‌کند.
- هنگام اعتبارسنجی سازگاری collector، `pnpm qa:otel:collector-smoke` را اجرا کنید. این فرمان همان export مربوط به QA-lab OTLP را پیش از assertهای گیرنده محلی از طریق یک container واقعی Docker مربوط به OpenTelemetry Collector عبور می‌دهد.
- هنگام اعتبارسنجی scraping محافظت‌شده Prometheus، `pnpm qa:prometheus:smoke` را اجرا کنید. این فرمان QA-lab را تمرین می‌کند، scrapeهای بدون احراز هویت را رد می‌کند، و تأیید می‌کند خانواده‌های metric حیاتی برای انتشار از محتوای prompt، شناسه‌های خام، توکن‌های auth، و مسیرهای محلی خالی بمانند.
- زمانی که laneهای smoke مربوط به OpenTelemetry و Prometheus در source-checkout را پشت سر هم می‌خواهید، `pnpm qa:observability:smoke` را اجرا کنید.
- پیش از هر انتشار tagشده، `pnpm release:check` را اجرا کنید
- پیش‌پرواز `OpenClaw NPM Release` پیش از pack کردن tarball npm، شواهد انتشار وابستگی را تولید می‌کند. گیت آسیب‌پذیری advisory npm انتشار را مسدود می‌کند. گزارش‌های ریسک manifest گذرا، سطح ownership/install وابستگی، و تغییر وابستگی فقط شواهد انتشار هستند. گزارش تغییر وابستگی، release candidate را با tag انتشار قابل دسترسی قبلی مقایسه می‌کند.
- پیش‌پرواز شواهد وابستگی را با نام `openclaw-release-dependency-evidence-<tag>` آپلود می‌کند و همچنین آن را زیر `dependency-evidence/` داخل آرتیفکت پیش‌پرواز npm آماده‌شده جاسازی می‌کند. مسیر publish واقعی از همان آرتیفکت پیش‌پرواز دوباره استفاده می‌کند، سپس همان شواهد را با نام `openclaw-<version>-dependency-evidence.zip` به GitHub release پیوست می‌کند.
- پس از اینکه tag وجود داشت، برای توالی publish تغییردهنده `OpenClaw Release Publish` را اجرا کنید. آن را از `release/YYYY.M.PATCH` dispatch کنید، یا هنگام انتشار tag قابل دسترسی از main از `main`، tag انتشار، `preflight_run_id` موفق npm OpenClaw، و `full_release_validation_run_id` موفق را پاس دهید، و scope پیش‌فرض publish Plugin یعنی `all-publishable` را نگه دارید مگر اینکه عمدا در حال اجرای repair متمرکز باشید. این workflow، publish کردن Plugin در npm، publish کردن Plugin در ClawHub، و publish کردن OpenClaw در npm را سریالی می‌کند تا پکیج core پیش از Pluginهای externalized خود منتشر نشود.
- `OpenClaw Release Publish` پایدار پس از وجود انتشار non-prerelease مطابق `openclaw/openclaw-windows-node`، به `windows_node_tag` دقیق نیاز دارد. همچنین به map تأییدشده candidate یعنی `windows_node_installer_digests` نیاز دارد. پیش از dispatch کردن هر publish child، تأیید می‌کند که انتشار منبع منتشرشده، non-prerelease است، installerهای x64/ARM64 لازم را دارد، و همچنان با آن map تأییدشده منطبق است. سپس در حالی که انتشار OpenClaw هنوز draft است، `Windows Node Release` را dispatch می‌کند و map digest installer پین‌شده را بدون تغییر حمل می‌کند. workflow فرزند، installerهای امضاشده Windows Hub را از همان tag دقیق دانلود می‌کند، آن‌ها را با digestهای پین‌شده تطبیق می‌دهد، تأیید می‌کند امضاهای Authenticode آن‌ها روی Windows runner از signer مورد انتظار OpenClaw Foundation استفاده می‌کنند، یک manifest SHA-256 می‌نویسد، و installerها به‌علاوه manifest را روی GitHub release canonical مربوط به OpenClaw آپلود می‌کند، سپس assetهای promoteشده را دوباره دانلود می‌کند و عضویت در manifest و hashها را تأیید می‌کند. parent پیش از publication قرارداد asset فعلی x64، ARM64، و checksum را تأیید می‌کند. recovery مستقیم، پیش از جایگزین کردن assetهای قرارداد مورد انتظار با byteهای منبع پین‌شده، نام‌های asset غیرمنتظره `OpenClawCompanion-*` را رد می‌کند. `Windows Node Release` را فقط برای recovery به‌صورت دستی dispatch کنید، و همیشه tag دقیق پاس دهید، هرگز `latest`، به‌همراه map JSON صریح `expected_installer_digests` از انتشار منبع تأییدشده. لینک‌های دانلود وب‌سایت باید URLهای دقیق asset انتشار OpenClaw برای انتشار پایدار فعلی را هدف بگیرند، یا فقط پس از تأیید اینکه redirect مربوط به latest در GitHub به همان انتشار اشاره می‌کند، از `releases/latest/download/...` استفاده کنند؛ فقط به صفحه انتشار repo همراه لینک ندهید.
- اکنون بررسی‌های انتشار در یک workflow دستی جدا اجرا می‌شوند:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` همچنین پیش از تأیید انتشار، lane هم‌ارزی mock مربوط به QA Lab به‌علاوه profile سریع live Matrix و lane QA Telegram را اجرا می‌کند. laneهای live از environment `qa-live-shared` استفاده می‌کنند؛ Telegram همچنین از leaseهای credential مربوط به Convex CI استفاده می‌کند. زمانی که موجودی کامل transport، media، و E2EE مربوط به Matrix را به‌صورت موازی می‌خواهید، workflow دستی `QA-Lab - All Lanes` را با `matrix_profile=all` و `matrix_shards=true` اجرا کنید.
- اعتبارسنجی runtime نصب و upgrade میان‌سیستمی بخشی از `OpenClaw Release Checks` عمومی و `Full Release Validation` است که workflow قابل استفاده مجدد
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` را مستقیما فراخوانی می‌کنند
- این جداسازی عمدی است: مسیر انتشار واقعی npm را کوتاه، قطعی، و متمرکز بر آرتیفکت نگه دارید، در حالی که بررسی‌های live کندتر در lane خودشان می‌مانند تا publish را متوقف یا مسدود نکنند
- بررسی‌های انتشار دارای secret باید از طریق `Full Release
Validation` یا از workflow ref مربوط به `main`/release dispatch شوند تا منطق workflow و secretها کنترل‌شده بمانند
- `OpenClaw Release Checks` یک branch، tag، یا SHA کامل commit را می‌پذیرد، به شرطی که commit resolveشده از یک branch یا tag انتشار OpenClaw قابل دسترسی باشد
- پیش‌پرواز فقط اعتبارسنجی `OpenClaw NPM Release` همچنین SHA کامل ۴۰ کاراکتری commit مربوط به workflow-branch فعلی را بدون نیاز به tag pushشده می‌پذیرد
- آن مسیر SHA فقط برای اعتبارسنجی است و نمی‌تواند به publish واقعی promote شود
- در حالت SHA، workflow فقط برای بررسی فراداده پکیج `v<package.json version>` را می‌سازد؛ publish واقعی همچنان به tag انتشار واقعی نیاز دارد
- هر دو workflow مسیر publish و promotion واقعی را روی runnerهای GitHub-hosted نگه می‌دارند، در حالی که مسیر اعتبارسنجی non-mutating می‌تواند از runnerهای بزرگ‌تر Blacksmith Linux استفاده کند
- آن workflow این فرمان را اجرا می‌کند
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  با استفاده از هر دو secret workflow یعنی `OPENAI_API_KEY` و `ANTHROPIC_API_KEY`
- پیش‌پرواز انتشار npm دیگر منتظر lane جداگانه بررسی‌های انتشار نمی‌ماند
- پیش از tag کردن محلی یک release candidate، اجرا کنید:
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. این helper guardrailهای سریع انتشار، بررسی‌های انتشار Plugin در npm/ClawHub، build، build UI، و `release:openclaw:npm:check` را به ترتیبی اجرا می‌کند که خطاهای رایج مسدودکننده تأیید را پیش از شروع workflow publish در GitHub بگیرد.
- پیش از تأیید، اجرا کنید:
  `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (یا tag مطابق beta/correction)
- پس از publish در npm، اجرا کنید
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (یا نسخه بتا/اصلاحی مطابق) برای راستی‌آزمایی مسیر نصب رجیستری منتشرشده
  در یک پیشوند موقت تازه
- پس از انتشار بتا، `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  را اجرا کنید تا آماده‌سازی بسته نصب‌شده، راه‌اندازی Telegram، و E2E واقعی Telegram
  در برابر بسته npm منتشرشده با استفاده از مجموعه مشترک اعتبارنامه‌های اجاره‌ای Telegram
  را راستی‌آزمایی کنید. اجرای موردی محلی توسط نگهدارنده می‌تواند متغیرهای Convex را حذف کند و سه
  اعتبارنامه محیطی `OPENCLAW_QA_TELEGRAM_*` را مستقیما پاس بدهد.
- برای اجرای اسموک کامل پس از انتشار بتا از ماشین نگهدارنده، از `pnpm release:beta-smoke -- --beta betaN` استفاده کنید. این ابزار کمکی اعتبارسنجی به‌روزرسانی npm در Parallels/هدف تازه، اجرای `NPM Telegram Beta E2E`، نظرسنجی اجرای دقیق workflow، دانلود artifact، و چاپ گزارش Telegram را انجام می‌دهد.
- نگهدارندگان می‌توانند همین بررسی پس از انتشار را از GitHub Actions از طریق
  workflow دستی `NPM Telegram Beta E2E` اجرا کنند. این عمدا فقط دستی است و
  در هر merge اجرا نمی‌شود.
- خودکارسازی انتشار نگهدارنده اکنون از پیش‌پرواز-سپس-ارتقا استفاده می‌کند:
  - انتشار واقعی npm باید یک `preflight_run_id` موفق npm را گذرانده باشد
  - انتشار واقعی npm باید از همان شاخه `main` یا
    `release/YYYY.M.PATCH` که اجرای پیش‌پرواز موفق از آن بوده dispatch شود
  - انتشارهای پایدار npm به‌طور پیش‌فرض روی `beta` قرار می‌گیرند
  - انتشار پایدار npm می‌تواند به‌طور صریح از طریق ورودی workflow هدف `latest` داشته باشد
  - تغییر dist-tag مبتنی بر توکن npm اکنون در
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` قرار دارد، زیرا
    `npm dist-tag add` همچنان به `NPM_TOKEN` نیاز دارد، در حالی که مخزن منبع انتشار
    فقط مبتنی بر OIDC را نگه می‌دارد
  - `macOS Release` عمومی فقط برای اعتبارسنجی است؛ وقتی یک tag فقط روی یک
    شاخه انتشار وجود دارد اما workflow از `main` dispatch می‌شود،
    `public_release_branch=release/YYYY.M.PATCH` را تنظیم کنید
  - انتشار واقعی macOS باید `preflight_run_id` و
    `validate_run_id` موفق macOS را گذرانده باشد
  - مسیرهای انتشار واقعی artifactهای آماده‌شده را ارتقا می‌دهند، به‌جای اینکه
    دوباره آنها را بسازند
- برای انتشارهای اصلاحی پایدار مانند `YYYY.M.PATCH-N`، راستی‌آزمای پس از انتشار
  همان مسیر ارتقای پیشوند موقت از `YYYY.M.PATCH` به `YYYY.M.PATCH-N`
  را نیز بررسی می‌کند تا اصلاحات انتشار نتوانند بی‌صدا نصب‌های global قدیمی‌تر را روی
  payload پایه پایدار باقی بگذارند
- پیش‌پرواز انتشار npm به‌صورت بسته fail می‌شود مگر اینکه tarball هم
  `dist/control-ui/index.html` و هم یک payload غیرخالی `dist/control-ui/assets/` داشته باشد
  تا دوباره یک داشبورد مرورگر خالی منتشر نکنیم
- راستی‌آزمایی پس از انتشار همچنین بررسی می‌کند که entrypointهای Plugin منتشرشده و
  metadata بسته در چیدمان رجیستری نصب‌شده حضور داشته باشند. انتشاری که
  payloadهای runtime مربوط به Plugin را جا انداخته باشد، در راستی‌آزمای پس از انتشار fail می‌شود و
  نمی‌تواند به `latest` ارتقا یابد.
- `pnpm test:install:smoke` همچنین بودجه `unpackedSize` بسته npm را روی
  tarball به‌روزرسانی کاندید اعمال می‌کند، بنابراین e2e نصب‌کننده، بزرگ‌شدن تصادفی بسته را
  پیش از مسیر انتشار release می‌گیرد
- اگر کار انتشار به برنامه‌ریزی CI، manifestهای زمان‌بندی extension، یا
  ماتریس‌های تست extension دست زده است، خروجی‌های ماتریس
  `plugin-prerelease-extension-shard` متعلق به planner را از
  `.github/workflows/plugin-prerelease.yml` پیش از تایید دوباره تولید و بازبینی کنید تا یادداشت‌های انتشار
  چیدمان قدیمی CI را توصیف نکنند
- آمادگی انتشار پایدار macOS همچنین شامل سطوح updater است:
  - انتشار GitHub باید در نهایت شامل `.zip`، `.dmg`، و `.dSYM.zip` بسته‌بندی‌شده باشد
  - `appcast.xml` روی `main` باید پس از انتشار به zip پایدار جدید اشاره کند؛
    workflow انتشار macOS آن را به‌طور خودکار commit می‌کند، یا وقتی push مستقیم مسدود باشد یک PR مربوط به appcast
    باز می‌کند
  - برنامه بسته‌بندی‌شده باید یک bundle id غیر debug، یک URL غیرخالی Sparkle feed،
    و یک `CFBundleVersion` برابر یا بالاتر از کف canonical build در Sparkle
    برای آن نسخه انتشار را حفظ کند

## جعبه‌های آزمون انتشار

`Full Release Validation` روشی است که اپراتورها با آن همه آزمون‌های پیش از انتشار را از
یک نقطه ورود آغاز می‌کنند. برای اثبات یک کامیت ثابت‌شده روی شاخه‌ای که سریع تغییر می‌کند، از
helper استفاده کنید تا هر workflow فرزند از یک شاخه موقت که روی SHA هدف ثابت شده است اجرا شود:

```bash
pnpm ci:full-release --sha <full-sha>
```

helper شاخه `release-ci/<sha>-...` را push می‌کند، `Full Release Validation` را
از همان شاخه با `ref=<sha>` dispatch می‌کند، بررسی می‌کند که `headSha` همه workflowهای فرزند
با هدف مطابقت داشته باشد، سپس شاخه موقت را حذف می‌کند. این کار از اثبات تصادفی یک اجرای فرزند
جدیدترِ `main` جلوگیری می‌کند.

برای اعتبارسنجی شاخه یا tag انتشار، آن را از ref قابل‌اعتماد workflow در `main` اجرا کنید
و شاخه یا tag انتشار را به‌عنوان `ref` پاس دهید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

workflow، ref هدف را resolve می‌کند، `CI` دستی را با
`target_ref=<release-ref>` dispatch می‌کند، سپس `OpenClaw Release Checks` را dispatch می‌کند.
`OpenClaw Release Checks` آزمون‌های دود نصب، بررسی‌های انتشار میان‌سیستمی، پوشش live/E2E مسیر انتشار Docker در زمان فعال بودن soak، Package Acceptance با E2E بسته canonical Telegram، هم‌ترازی QA Lab، Matrix زنده، و Telegram زنده را fan out می‌کند. اجرای کامل/all فقط وقتی قابل قبول است که خلاصه `Full Release Validation`
موفقیت `normal_ci`، `plugin_prerelease`، و `release_checks` را نشان دهد، مگر اینکه یک rerun متمرکز عمدا فرزند جداگانه `Plugin
Prerelease` را رد کرده باشد. فرزند مستقل `npm-telegram` را فقط برای rerun متمرکز بسته منتشرشده با `release_package_spec` یا
`npm_telegram_package_spec` استفاده کنید. خلاصه نهایی
verifier شامل جدول‌های کندترین job برای هر اجرای فرزند است، تا مدیر انتشار بتواند مسیر بحرانی فعلی را بدون دانلود logها ببیند.
برای ماتریس کامل مرحله‌ها، نام دقیق jobهای workflow، تفاوت‌های پروفایل stable در برابر full، artifactها، و handleهای rerun متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.
workflowهای فرزند از ref قابل‌اعتمادی dispatch می‌شوند که `Full Release
Validation` را اجرا می‌کند، معمولا `--ref main`، حتی وقتی `ref` هدف به یک شاخه یا tag انتشار قدیمی‌تر اشاره دارد. ورودی جداگانه‌ای برای workflow-ref در Full Release Validation وجود ندارد؛ با انتخاب ref اجرای workflow، harness قابل‌اعتماد را انتخاب کنید.
برای اثبات دقیق کامیت روی `main` متحرک از `--ref main -f ref=<sha>` استفاده نکنید؛
SHAهای خام کامیت نمی‌توانند refهای workflow dispatch باشند، پس از
`pnpm ci:full-release --sha <sha>` برای ساخت شاخه موقت ثابت‌شده استفاده کنید.

از `release_profile` برای انتخاب گستره live/provider استفاده کنید:

- `minimum`: سریع‌ترین مسیر live و Docker حیاتی برای انتشار OpenAI/core
- `stable`: minimum به‌علاوه پوشش provider/backend پایدار برای تایید انتشار
- `full`: stable به‌علاوه پوشش گسترده مشورتی provider/media

اعتبارسنجی stable و full همیشه پیش از promotion، sweep کامل live/E2E، مسیر انتشار Docker، و upgrade-survivor منتشرشده محدود را اجرا می‌کنند.
از `run_release_soak=true` برای درخواست همان sweep برای beta استفاده کنید. آن sweep چهار بسته stable آخر به‌علاوه baselineهای ثابت‌شده `2026.4.23` و `2026.5.2`
به‌علاوه پوشش قدیمی‌تر `2026.4.15` را پوشش می‌دهد، baselineهای تکراری را حذف می‌کند و هر baseline را در job runner جداگانه Docker shard می‌کند.

`OpenClaw Release Checks` از ref قابل‌اعتماد workflow برای resolve کردن ref هدف
یک‌بار به‌عنوان `release-package-under-test` استفاده می‌کند و وقتی soak اجرا می‌شود، همان artifact را در بررسی‌های cross-OS، Package Acceptance، و Docker مسیر انتشار بازاستفاده می‌کند. این کار همه جعبه‌های روبه‌روی بسته را روی همان byteها نگه می‌دارد و از buildهای تکراری بسته جلوگیری می‌کند.
پس از اینکه یک beta از قبل روی npm قرار گرفت، `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` را تنظیم کنید تا release checks بسته shipped را یک‌بار دانلود کند، SHA منبع build آن را از `dist/build-info.json` استخراج کند، و همان artifact را برای laneهای cross-OS، Package Acceptance، Docker مسیر انتشار، و Telegram بسته بازاستفاده کند.
آزمون دود نصب OpenAI میان‌سیستمی وقتی متغیر repo/org تنظیم شده باشد از `OPENCLAW_CROSS_OS_OPENAI_MODEL` استفاده می‌کند، در غیر این صورت از `openai/gpt-5.4`، چون این lane نصب بسته، onboarding، راه‌اندازی gateway، و یک گردش agent زنده را اثبات می‌کند، نه benchmark کردن کندترین مدل پیش‌فرض. ماتریس گسترده‌تر provider زنده همچنان محل پوشش ویژه مدل است.

بسته به مرحله انتشار، از این variantها استفاده کنید:

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

از umbrella کامل به‌عنوان نخستین rerun پس از یک fix متمرکز استفاده نکنید. اگر یک جعبه
failed شد، برای اثبات بعدی از workflow فرزند failed، job، lane Docker، پروفایل بسته، provider مدل، یا lane QA استفاده کنید. umbrella کامل را فقط وقتی دوباره اجرا کنید که fix، هماهنگ‌سازی مشترک انتشار را تغییر داده باشد یا شواهد all-box قبلی را کهنه کرده باشد. verifier نهایی umbrella شناسه‌های ثبت‌شده اجرای workflow فرزند را دوباره بررسی می‌کند، پس پس از اینکه یک workflow فرزند با موفقیت rerun شد، فقط job والد failed با نام
`Verify full validation` را rerun کنید.

برای بازیابی محدود، `rerun_group` را به umbrella پاس دهید. `all` اجرای واقعی release-candidate است، `ci` فقط فرزند CI معمولی را اجرا می‌کند، `plugin-prerelease`
فقط فرزند Plugin مخصوص انتشار را اجرا می‌کند، `release-checks` هر جعبه انتشار را اجرا می‌کند، و گروه‌های باریک‌تر انتشار عبارت‌اند از `install-smoke`، `cross-os`،
`live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، و `npm-telegram`.
rerunهای متمرکز `npm-telegram` به `release_package_spec` یا
`npm_telegram_package_spec` نیاز دارند؛ اجراهای full/all از E2E canonical package Telegram داخل Package Acceptance استفاده می‌کنند. rerunهای متمرکز
cross-OS می‌توانند `cross_os_suite_filter=windows/packaged-upgrade` یا
فیلتر OS/suite دیگری اضافه کنند. failureهای QA release-check، اعتبارسنجی معمول انتشار را block می‌کنند، از جمله drift الزامی ابزار dynamic OpenClaw در tier استاندارد.
اجراهای alpha در Tideclaw همچنان ممکن است laneهای release-check غیر package-safety را مشورتی تلقی کنند. وقتی `live_suite_filter` صراحتا یک lane زنده QA gated مثل Discord، WhatsApp، یا Slack را درخواست می‌کند، متغیر repo متناظر
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` باید فعال باشد؛ در غیر این صورت capture ورودی به‌جای رد کردن بی‌صدای lane، failed می‌شود.

### Vitest

جعبه Vitest همان workflow فرزند `CI` دستی است. CI دستی عمدا
scoping مبتنی بر تغییرات را دور می‌زند و graph آزمون معمول را برای release
candidate اجباری می‌کند: shardهای Linux Node، shardهای bundled-plugin، shardهای قرارداد Plugin و channel، سازگاری Node 22، `check-*`، `check-additional-*`،
آزمون‌های دود built-artifact، بررسی‌های docs، Python skills، Windows، macOS،
و i18n در Control UI. وقتی `Full Release Validation` جعبه را اجرا می‌کند Android هم لحاظ می‌شود، چون umbrella مقدار `include_android=true` را پاس می‌دهد؛ CI دستی مستقل برای پوشش Android به `include_android=true` نیاز دارد.

از این جعبه برای پاسخ به این پرسش استفاده کنید: «آیا source tree کل مجموعه آزمون معمول را پاس کرد؟»
این با اعتبارسنجی محصول در مسیر انتشار یکسان نیست. شواهدی که باید نگه دارید:

- خلاصه `Full Release Validation` که URL اجرای `CI` dispatch‌شده را نشان می‌دهد
- سبز بودن اجرای `CI` روی SHA دقیق هدف
- نام shardهای failed یا کند از jobهای CI هنگام بررسی regressionها
- artifactهای زمان‌بندی Vitest مثل `.artifacts/vitest-shard-timings.json` وقتی
  یک اجرا به تحلیل performance نیاز دارد

CI دستی را فقط وقتی مستقیم اجرا کنید که انتشار به CI معمول deterministic نیاز دارد اما
به جعبه‌های Docker، QA Lab، live، cross-OS، یا package نیاز ندارد. برای CI مستقیم بدون Android از فرمان اول استفاده کنید. وقتی CI مستقیم
release-candidate باید Android را پوشش دهد، `include_android=true` را اضافه کنید:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

جعبه Docker از طریق `openclaw-live-and-e2e-checks-reusable.yml` در
`OpenClaw Release Checks`، به‌علاوه workflow
`install-smoke` در حالت انتشار قرار دارد. این جعبه release candidate را از طریق محیط‌های Docker بسته‌بندی‌شده اعتبارسنجی می‌کند، نه فقط آزمون‌های سطح source.

پوشش Docker انتشار شامل موارد زیر است:

- آزمون دود نصب کامل با آزمون دود نصب global کند Bun فعال
- آماده‌سازی/بازاستفاده تصویر دود root Dockerfile بر اساس SHA هدف، با jobهای QR،
  root/gateway، و installer/Bun smoke که به‌عنوان shardهای جداگانه install-smoke اجرا می‌شوند
- laneهای E2E repository
- chunkهای Docker مسیر انتشار: `core`، `package-update-openai`،
  `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`،
  `plugins-runtime-services`،
  `plugins-runtime-install-a`، `plugins-runtime-install-b`،
  `plugins-runtime-install-c`، `plugins-runtime-install-d`،
  `plugins-runtime-install-e`، `plugins-runtime-install-f`،
  `plugins-runtime-install-g`، و `plugins-runtime-install-h`
- پوشش OpenWebUI داخل chunk `plugins-runtime-services` هنگام درخواست
- laneهای تقسیم‌شده نصب/حذف نصب Pluginهای bundled
  `bundled-plugin-install-uninstall-0` تا
  `bundled-plugin-install-uninstall-23`
- مجموعه‌های provider live/E2E و پوشش مدل زنده Docker وقتی release checks
  شامل مجموعه‌های live باشد

پیش از rerun از artifactهای Docker استفاده کنید. scheduler مسیر انتشار
`.artifacts/docker-tests/` را با logهای lane، `summary.json`، `failures.json`،
زمان‌بندی phaseها، JSON برنامه scheduler، و فرمان‌های rerun upload می‌کند. برای بازیابی متمرکز،
به‌جای rerun کردن همه chunkهای انتشار، از `docker_lanes=<lane[,lane]>` روی workflow قابل‌استفاده‌مجدد live/E2E استفاده کنید. فرمان‌های rerun تولیدشده، وقتی موجود باشند، شامل
`package_artifact_run_id` قبلی و ورودی‌های تصویر آماده Docker هستند، تا یک
lane failed بتواند همان tarball و imageهای GHCR را بازاستفاده کند.

### QA Lab

جعبه QA Lab هم بخشی از `OpenClaw Release Checks` است. این gate انتشار رفتار agentic و سطح channel است، جدا از Vitest و mechanics بسته Docker.

پوشش QA Lab انتشار شامل موارد زیر است:

- lane هم‌ترازی mock که lane candidate OpenAI را با baseline Opus 4.6
  با استفاده از agentic parity pack مقایسه می‌کند
- پروفایل سریع live Matrix QA با استفاده از محیط `qa-live-shared`
- lane live Telegram QA با استفاده از leaseهای credential Convex CI
- `pnpm qa:otel:smoke`، `pnpm qa:otel:collector-smoke`،
  `pnpm qa:prometheus:smoke`، یا
  `pnpm qa:observability:smoke` وقتی telemetry انتشار به اثبات محلی صریح نیاز دارد

از این جعبه برای پاسخ به این پرسش استفاده کنید: «آیا انتشار در سناریوهای QA و
flowهای channel زنده درست رفتار می‌کند؟» هنگام تایید انتشار، URLهای artifact برای laneهای parity، Matrix، و Telegram را نگه دارید. پوشش کامل Matrix همچنان به‌عنوان یک اجرای دستی sharded QA-Lab در دسترس است، نه lane حیاتی پیش‌فرض انتشار.

### Package

جعبه Package همان gate محصول قابل نصب است. این جعبه با
`Package Acceptance` و resolver
`scripts/resolve-openclaw-package-candidate.mjs` پشتیبانی می‌شود. resolver یک
candidate را به tarball `package-under-test` که Docker E2E مصرف می‌کند normalize می‌کند، موجودی بسته را اعتبارسنجی می‌کند، نسخه بسته و SHA-256 را ثبت می‌کند، و ref harness workflow را از ref منبع بسته جدا نگه می‌دارد.

منابع candidate پشتیبانی‌شده:

- `source=npm`: `openclaw@beta`، `openclaw@latest`، یا یک نسخهٔ انتشار دقیق OpenClaw
  version
- `source=ref`: یک شاخه، برچسب، یا SHA کامل کامیتِ معتبر `package_ref` را
  با هارنس انتخاب‌شدهٔ `workflow_ref` بسته‌بندی کنید
- `source=url`: یک `.tgz` عمومی HTTPS را همراه با `package_sha256` الزامی دانلود کنید؛
  اعتبارنامه‌های URL، پورت‌های HTTPS غیراستاندارد، نام‌های میزبان یا نشانی‌های
  resolve‌شدهٔ خصوصی/داخلی/کاربرد ویژه، و redirectهای ناامن رد می‌شوند
- `source=trusted-url`: یک `.tgz` مبتنی بر HTTPS را همراه با
  `package_sha256` و `trusted_source_id` الزامی از یک policy نام‌گذاری‌شده در
  `.github/package-trusted-sources.json` دانلود کنید؛ از این گزینه برای mirrorهای
  سازمانی یا مخزن‌های بستهٔ خصوصیِ متعلق به نگه‌دارندگان استفاده کنید، نه اینکه یک
  bypass شبکهٔ خصوصی در سطح ورودی به `source=url` اضافه کنید
- `source=artifact`: از یک `.tgz` که توسط اجرای دیگری از GitHub Actions بارگذاری شده است دوباره استفاده کنید

`OpenClaw Release Checks` پذیرش بسته را با `source=artifact`، آرتیفکت
بستهٔ انتشار آماده‌شده، `suite_profile=custom`،
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`،
و `telegram_mode=mock-openai` اجرا می‌کند. پذیرش بسته، QA مربوط به مهاجرت، به‌روزرسانی،
راه‌اندازی دوبارهٔ به‌روزرسانی احراز هویتِ پیکربندی‌شده، نصب زندهٔ Skill از ClawHub، پاک‌سازی وابستگی‌های کهنهٔ Plugin، fixtureهای Plugin آفلاین،
به‌روزرسانی Plugin، و بستهٔ Telegram را در برابر همان tarball resolve‌شده نگه می‌دارد.
بررسی‌های مسدودکنندهٔ انتشار از baseline پیش‌فرضِ آخرین بستهٔ منتشرشده استفاده می‌کنند؛
پروفایل beta با `run_release_soak=true`، `release_profile=stable`، یا
`release_profile=full` به همهٔ baselineهای پایدار منتشرشده در npm از
`2026.4.23` تا `latest` به‌علاوهٔ fixtureهای issue گزارش‌شده گسترش می‌یابد. از
پذیرش بسته با `source=npm` برای نامزدی که قبلاً منتشر شده است،
`source=ref` برای یک tarball محلی npm مبتنی بر SHA پیش از انتشار،
`source=trusted-url` برای یک mirror سازمانی/خصوصیِ متعلق به نگه‌دارندگان، یا
`source=artifact` برای tarball آماده‌شده‌ای که توسط اجرای دیگری از GitHub Actions بارگذاری شده است استفاده کنید.
این جایگزین بومی GitHub برای بیشتر پوشش بسته/به‌روزرسانی است که پیش‌تر به
Parallels نیاز داشت. بررسی‌های انتشار میان‌سیستمی هنوز برای onboarding ویژهٔ سیستم‌عامل،
نصب‌کننده، و رفتار پلتفرم اهمیت دارند، اما اعتبارسنجی محصولِ بسته/به‌روزرسانی باید
پذیرش بسته را ترجیح دهد.

چک‌لیست canonical برای اعتبارسنجی به‌روزرسانی و Plugin این است:
[آزمودن به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins). هنگام تصمیم‌گیری
دربارهٔ اینکه کدام lane محلی، Docker، پذیرش بسته، یا بررسی انتشار، نصب/به‌روزرسانی
Plugin، پاک‌سازی doctor، یا تغییر مهاجرت بستهٔ منتشرشده را اثبات می‌کند، از آن استفاده کنید.
مهاجرت جامع به‌روزرسانی منتشرشده از هر بستهٔ پایدار `2026.4.23+` یک workflow دستی جداگانهٔ
`Update Migration` است و بخشی از Full Release CI نیست.

سهل‌گیری قدیمی پذیرش بسته عمداً محدود به زمان است. بسته‌ها تا
`2026.4.25` ممکن است از مسیر سازگاری برای خلأهای metadata که قبلاً در npm منتشر شده‌اند
استفاده کنند: ورودی‌های خصوصی موجودی QA که در tarball وجود ندارند، نبود
`gateway install --wrapper`، نبود فایل‌های patch در fixture گیتِ مشتق‌شده از tarball،
نبود `update.channel` پایدارشده، مکان‌های قدیمی install-record مربوط به Plugin،
نبود پایداری install-record بازارچه، و مهاجرت metadata پیکربندی هنگام `plugins update`.
بستهٔ منتشرشدهٔ `2026.4.26` ممکن است برای فایل‌های stamp مربوط به metadata ساخت محلی
که قبلاً ارسال شده‌اند هشدار بدهد. بسته‌های بعدی باید قراردادهای مدرن بسته را رعایت کنند؛
همان خلأها باعث شکست اعتبارسنجی انتشار می‌شوند.

وقتی پرسش انتشار دربارهٔ یک بستهٔ واقعاً قابل نصب است، از پروفایل‌های گسترده‌تر پذیرش بسته استفاده کنید:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

پروفایل‌های رایج بسته:

- `smoke`: laneهای سریع نصب بسته/کانال/عامل، شبکهٔ Gateway، و بارگذاری دوبارهٔ پیکربندی
- `package`: قراردادهای بستهٔ نصب/به‌روزرسانی/راه‌اندازی دوباره/Plugin به‌علاوهٔ اثبات نصب زندهٔ Skill از ClawHub؛ این پیش‌فرض بررسی انتشار است
- `product`: `package` به‌علاوهٔ کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، و OpenWebUI
- `full`: بخش‌های مسیر انتشار Docker همراه با OpenWebUI
- `custom`: فهرست دقیق `docker_lanes` برای اجرای دوبارهٔ متمرکز

برای اثبات Telegram مربوط به نامزد بسته، `telegram_mode=mock-openai` یا
`telegram_mode=live-frontier` را در پذیرش بسته فعال کنید. workflow، tarball
resolve‌شدهٔ `package-under-test` را به lane Telegram منتقل می‌کند؛ workflow مستقل
Telegram همچنان یک spec منتشرشدهٔ npm را برای بررسی‌های پس از انتشار می‌پذیرد.

## خودکارسازی انتشار منظم

برای beta، `latest`، Plugin، GitHub Release، و انتشار پلتفرم،
`OpenClaw Release Publish` entrypoint عادیِ تغییردهنده است. مسیر monthly
`.33+` فقط npm برای extended-stable از این orchestrator استفاده نمی‌کند. workflow منظم
workflowهای trusted-publisher را به ترتیبی که انتشار نیاز دارد هماهنگ می‌کند:

1. برچسب انتشار را checkout کنید و SHA کامیت آن را resolve کنید.
2. تأیید کنید که برچسب از `main` یا `release/*` قابل دسترسی است.
3. `pnpm plugins:sync:check` را اجرا کنید.
4. `Plugin NPM Release` را با `publish_scope=all-publishable` و
   `ref=<release-sha>` dispatch کنید.
5. `Plugin ClawHub Release` را با همان scope و SHA dispatch کنید.
6. پس از تأیید `full_release_validation_run_id` ذخیره‌شده، `OpenClaw NPM Release` را
   با برچسب انتشار، npm dist-tag، و `preflight_run_id` ذخیره‌شده dispatch کنید.
7. برای انتشارهای پایدار، GitHub release را به‌صورت draft ایجاد یا به‌روزرسانی کنید،
   `Windows Node Release` را با `windows_node_tag` صریح و
   `windows_node_installer_digests` تأییدشده برای نامزد dispatch کنید، و پیش از انتشار draft
   آرتیفکت‌های canonical نصب‌کننده/checksum را تأیید کنید.

نمونهٔ انتشار beta:

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

ارتقای پایدار مستقیم به `latest` صریح است:

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

از workflowهای سطح پایین‌تر `Plugin NPM Release` و `Plugin ClawHub Release`
فقط برای کار تعمیر یا بازانتشار متمرکز استفاده کنید. `OpenClaw Release Publish` وقتی
`publish_openclaw_npm=true` باشد، `plugin_publish_scope=selected` را رد می‌کند تا بستهٔ core
نتواند بدون همهٔ Pluginهای رسمی قابل انتشار، از جمله
`@openclaw/diffs-language-pack`، ارسال شود. برای تعمیر یک Plugin انتخاب‌شده،
`publish_openclaw_npm=false` را همراه با `plugin_publish_scope=selected` و
`plugins=@openclaw/name` تنظیم کنید، یا workflow فرزند را مستقیم dispatch کنید.

## ورودی‌های workflow مربوط به NPM

`OpenClaw NPM Release` این ورودی‌های تحت کنترل operator را می‌پذیرد:

- `tag`: برچسب انتشار الزامی مانند `v2026.4.2`، `v2026.4.2-1`، یا
  `v2026.4.2-beta.1`؛ وقتی `preflight_only=true` باشد، می‌تواند SHA کامل ۴۰نویسه‌ای
  فعلیِ کامیت شاخهٔ workflow برای preflight فقط-اعتبارسنجی نیز باشد
- `preflight_only`: `true` برای فقط اعتبارسنجی/ساخت/بسته، `false` برای مسیر انتشار واقعی
- `preflight_run_id`: در مسیر انتشار واقعی الزامی است تا workflow از tarball آماده‌شدهٔ
  اجرای preflight موفق دوباره استفاده کند
- `full_release_validation_run_id`: برای انتشار واقعی monthly extended-stable و انتشار منظم
  غیر-beta الزامی است تا workflow اجرای اعتبارسنجی دقیق را احراز کند
- `npm_dist_tag`: برچسب هدف npm برای مسیر انتشار؛ `alpha`، `beta`،
  `latest`، یا `extended-stable` را می‌پذیرد و پیش‌فرض آن `beta` است. patch نهایی `33` و بعد از آن باید
  از `extended-stable` استفاده کنند؛ به‌طور پیش‌فرض، `extended-stable` patchهای پیشین را رد می‌کند و همیشه
  برچسب‌های غیرنهایی را رد می‌کند.
- `bypass_extended_stable_guard`: boolean فقط برای آزمون، پیش‌فرض `false`؛ با
  `npm_dist_tag=extended-stable`، eligibility مربوط به monthly extended-stable را bypass می‌کند، در حالی که
  بررسی‌های هویت انتشار، آرتیفکت، approval، و readback را حفظ می‌کند.

`OpenClaw Release Publish` این ورودی‌های تحت کنترل operator را می‌پذیرد:

- `tag`: برچسب انتشار الزامی؛ باید از قبل وجود داشته باشد
- `preflight_run_id`: id اجرای موفق preflight مربوط به `OpenClaw NPM Release`؛
  وقتی `publish_openclaw_npm=true` باشد الزامی است
- `full_release_validation_run_id`: id اجرای موفق `Full Release Validation`؛
  وقتی `publish_openclaw_npm=true` باشد الزامی است
- `windows_node_tag`: برچسب انتشار دقیق و غیر-prerelease مربوط به `openclaw/openclaw-windows-node`؛
  برای انتشار پایدار OpenClaw الزامی است
- `windows_node_installer_digests`: نگاشت JSON فشردهٔ تأییدشده برای نامزد، از
  نام‌های فعلی نصب‌کنندهٔ Windows به digestهای pinned شدهٔ `sha256:` آن‌ها؛ برای انتشار پایدار OpenClaw الزامی است
- `npm_dist_tag`: برچسب هدف npm برای بستهٔ OpenClaw
- `plugin_publish_scope`: پیش‌فرض `all-publishable` است؛ فقط برای
  کار تعمیر متمرکزِ فقط-Plugin با `publish_openclaw_npm=false` از `selected` استفاده کنید
- `plugins`: نام‌های بستهٔ `@openclaw/*` جداشده با کاما وقتی
  `plugin_publish_scope=selected` باشد
- `publish_openclaw_npm`: پیش‌فرض `true` است؛ فقط وقتی workflow را به‌عنوان orchestrator تعمیر فقط-Plugin استفاده می‌کنید
  آن را `false` تنظیم کنید
- `wait_for_clawhub`: پیش‌فرض `false` است تا دسترس‌پذیری npm توسط sidecar مربوط به
  ClawHub مسدود نشود؛ فقط وقتی completion workflow باید شامل completion مربوط به
  ClawHub باشد آن را `true` تنظیم کنید

`OpenClaw Release Checks` این ورودی‌های تحت کنترل operator را می‌پذیرد:

- `ref`: شاخه، برچسب، یا SHA کامل کامیت برای اعتبارسنجی. بررسی‌هایی که secret دارند
  نیاز دارند کامیت resolve‌شده از یک شاخهٔ OpenClaw یا برچسب انتشار قابل دسترسی باشد.
- `run_release_soak`: برای بررسی‌های انتشار beta، soak جامع live/E2E، مسیر انتشار Docker، و
  upgrade-survivor از همهٔ نسخه‌ها تاکنون را فعال می‌کند. این گزینه توسط
  `release_profile=stable` و `release_profile=full` اجباری می‌شود.

قواعد:

- نسخه‌های نهایی منظم و correction پایین‌تر از patch `33` ممکن است به
  `beta` یا `latest` منتشر شوند. نسخه‌های نهایی در patch `33` یا بالاتر باید به
  `extended-stable` منتشر شوند، و نسخه‌های دارای پسوند correction در آن مرز رد می‌شوند.
- برچسب‌های prerelease مربوط به beta فقط ممکن است به `beta` منتشر شوند
- برای `OpenClaw NPM Release`، ورودی SHA کامل کامیت فقط وقتی مجاز است که
  `preflight_only=true` باشد
- `OpenClaw Release Checks` و `Full Release Validation` همیشه فقط-اعتبارسنجی هستند
- مسیر انتشار واقعی باید همان `npm_dist_tag` استفاده‌شده در preflight را به کار ببرد؛
  workflow پیش از انتشار، ادامه‌داشتن آن metadata را تأیید می‌کند

## توالی انتشار پایدار منظم beta/latest

این توالی قدیمی برای انتشار منظم orchestrated است که مالک
Pluginها، GitHub Release، Windows، و کارهای دیگر پلتفرم نیز هست. این مسیر، مسیر
monthly `.33+` فقط npm برای extended-stable نیست که در ابتدای این صفحه مستند شده است.

هنگام cut کردن یک انتشار پایدار orchestrated منظم:

1. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید
   - پیش از وجود داشتن تگ، می‌توانید از SHA کامل commit شاخهٔ workflow فعلی
     برای اجرای آزمایشیِ فقط اعتبارسنجیِ workflow پیش‌پرواز استفاده کنید
2. برای جریان عادیِ ابتدا beta، `npm_dist_tag=beta` را انتخاب کنید، یا فقط زمانی
   `latest` را انتخاب کنید که عمداً انتشار پایدار مستقیم می‌خواهید
3. وقتی CI عادی به‌همراه پوشش زندهٔ prompt cache، Docker، QA Lab،
   Matrix و Telegram را از یک workflow دستی می‌خواهید، `Full Release Validation` را
   روی شاخهٔ انتشار، تگ انتشار، یا SHA کامل commit اجرا کنید
4. اگر عمداً فقط به گراف آزمون عادیِ قطعی نیاز دارید، به‌جای آن workflow دستی
   `CI` را روی ref انتشار اجرا کنید
5. تگ انتشار دقیق و غیرپیش‌انتشار `openclaw/openclaw-windows-node` را انتخاب کنید
   که نصب‌کننده‌های امضاشدهٔ x64 و ARM64 آن باید منتشر شوند. آن را به‌عنوان
   `windows_node_tag` ذخیره کنید و نقشهٔ digest اعتبارسنجی‌شدهٔ آن‌ها را به‌عنوان
   `windows_node_installer_digests` ذخیره کنید. helper نامزد انتشار هر دو را ثبت
   می‌کند و آن‌ها را در فرمان انتشار تولیدشدهٔ خود می‌گنجاند.
6. `preflight_run_id` و `full_release_validation_run_id` موفق را ذخیره کنید
7. `OpenClaw Release Publish` را با همان `tag`، همان `npm_dist_tag`،
   `windows_node_tag` انتخاب‌شده، `windows_node_installer_digests` ذخیره‌شدهٔ آن،
   `preflight_run_id` ذخیره‌شده، و `full_release_validation_run_id` ذخیره‌شده اجرا کنید؛
   این کار پیش از ارتقای بستهٔ npm مربوط به OpenClaw، Pluginهای بیرونی‌شده را در npm و
   ClawHub منتشر می‌کند
8. اگر انتشار روی `beta` فرود آمد، از workflow
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   استفاده کنید تا آن نسخهٔ پایدار را از `beta` به `latest` ارتقا دهید
9. اگر انتشار عمداً مستقیماً روی `latest` منتشر شد و `beta` باید بلافاصله
   همان build پایدار را دنبال کند، از همان workflow انتشار استفاده کنید تا هر دو
   dist-tag به نسخهٔ پایدار اشاره کنند، یا اجازه دهید همگام‌سازی خودترمیم‌گرِ
   زمان‌بندی‌شدهٔ آن بعداً `beta` را جابه‌جا کند

تغییر dist-tag در مخزن دفترکل انتشار قرار دارد، چون هنوز به
`NPM_TOKEN` نیاز دارد، در حالی که مخزن منبع انتشار فقط مبتنی بر OIDC را نگه می‌دارد.

این کار هم مسیر انتشار مستقیم و هم مسیر ارتقای ابتدا beta را مستند و برای اپراتور
قابل مشاهده نگه می‌دارد.

اگر یک نگه‌دارنده ناچار شود به احراز هویت محلی npm برگردد، هر فرمان
1Password CLI (`op`) را فقط داخل یک نشست اختصاصی tmux اجرا کنید. `op` را
مستقیماً از پوستهٔ اصلی عامل فراخوانی نکنید؛ نگه داشتن آن داخل tmux باعث می‌شود
promptها، هشدارها و مدیریت OTP قابل مشاهده باشند و از هشدارهای مکرر میزبان جلوگیری می‌کند.

## منابع عمومی

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

نگه‌دارندگان برای runbook واقعی از مستندات خصوصی انتشار در
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
استفاده می‌کنند.

## مرتبط

- [کانال‌های انتشار](/fa/install/development-channels)
