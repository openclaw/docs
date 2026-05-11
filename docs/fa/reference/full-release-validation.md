---
read_when:
    - اجرای اعتبارسنجی کامل انتشار یا اجرای دوبارهٔ آن
    - مقایسهٔ نمایه‌های اعتبارسنجی انتشار پایدار و کامل
    - عیب‌یابی شکست‌های مرحلهٔ اعتبارسنجی انتشار
summary: مراحل اعتبارسنجی کامل انتشار، گردش‌کارهای فرزند، پروفایل‌های انتشار، شناسه‌های اجرای دوباره، و شواهد
title: اعتبارسنجی کامل انتشار
x-i18n:
    generated_at: "2026-05-11T20:42:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3d83d15272e4f7cff82ef791c8dbeb6adc447626ada8ae221d074ee16b2cadd5
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` چتر انتشار است. این تنها نقطه ورود دستی
برای اثبات پیش از انتشار است، اما بیشتر کار در گردش‌کارهای فرزند انجام می‌شود تا یک
باکس ناموفق بتواند بدون شروع دوباره کل انتشار، دوباره اجرا شود.

آن را از یک ref گردش‌کار مورد اعتماد، معمولا `main`، اجرا کنید و شاخه انتشار،
تگ، یا SHA کامل کامیت را به‌عنوان `ref` پاس بدهید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

گردش‌کارهای فرزند از ref گردش‌کار مورد اعتماد برای harness و از ورودی
`ref` برای نامزد تحت آزمون استفاده می‌کنند. این کار هنگام اعتبارسنجی یک شاخه یا تگ انتشار قدیمی‌تر،
منطق اعتبارسنجی جدید را در دسترس نگه می‌دارد.

به‌صورت پیش‌فرض، `release_profile=stable` مسیرهای مسدودکننده انتشار را اجرا می‌کند و
soak زنده/Docker جامع را رد می‌کند. برای اضافه کردن مسیرهای soak به اجرای stable،
`run_release_soak=true` را پاس بدهید. `release_profile=full` همیشه مسیرهای soak را فعال می‌کند تا
پروفایل مشورتی گسترده هرگز بی‌صدا پوشش را از دست ندهد.

Package Acceptance معمولا tarball نامزد را از `ref` resolve شده می‌سازد،
از جمله اجراهای SHA کامل که با `pnpm ci:full-release` dispatch شده‌اند. پس از
انتشار بتا، برای استفاده دوباره از بسته npm منتشرشده در بررسی‌های انتشار، Package Acceptance، cross-OS،
Docker مسیر انتشار، و Telegram بسته، `release_package_spec=openclaw@YYYY.M.D-beta.N` را پاس بدهید. از `package_acceptance_package_spec`
فقط زمانی استفاده کنید که Package Acceptance باید عمدا بسته متفاوتی را اثبات کند.

## مرحله‌های سطح بالا

| مرحله                | جزئیات                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolve کردن هدف    | **Job:** `Resolve target ref`<br />**گردش‌کار فرزند:** هیچ‌کدام<br />**اثبات می‌کند:** شاخه انتشار، تگ، یا SHA کامل کامیت را resolve می‌کند و ورودی‌های انتخاب‌شده را ثبت می‌کند.<br />**اجرای دوباره:** اگر این مورد ناموفق شد، umbrella را دوباره اجرا کنید.                                                                                                                                                                                                                               |
| Vitest و CI عادی | **Job:** `Run normal full CI`<br />**گردش‌کار فرزند:** `CI`<br />**اثبات می‌کند:** گراف CI کامل دستی روی ref هدف، از جمله مسیرهای Linux Node، شاردهای Plugin همراه، قراردادهای کانال، سازگاری Node 22، `check`، `check-additional`، smoke ساخت، بررسی‌های مستندات، Python skills، Windows، macOS، i18n رابط کاربری Control، و Android از طریق umbrella.<br />**اجرای دوباره:** `rerun_group=ci`.                                                  |
| پیش‌انتشار Plugin    | **Job:** `Run plugin prerelease validation`<br />**گردش‌کار فرزند:** `Plugin Prerelease`<br />**اثبات می‌کند:** بررسی‌های ایستای Plugin مخصوص انتشار، پوشش Plugin عامل‌محور، شاردهای دسته کامل extension، مسیرهای Docker پیش‌انتشار Plugin، و artifact غیرمسدودکننده `plugin-inspector-advisory` برای triage سازگاری.<br />**اجرای دوباره:** `rerun_group=plugin-prerelease`.                                                                          |
| بررسی‌های انتشار       | **Job:** `Run release/live/Docker/QA validation`<br />**گردش‌کار فرزند:** `OpenClaw Release Checks`<br />**اثبات می‌کند:** smoke نصب، بررسی‌های بسته cross-OS، Package Acceptance، برابری QA Lab، Matrix زنده، و Telegram زنده. با `run_release_soak=true` یا `release_profile=full`، مجموعه‌های جامع زنده/E2E و chunkهای مسیر انتشار Docker را نیز اجرا می‌کند.<br />**اجرای دوباره:** `rerun_group=release-checks` یا یک handle محدودتر release-checks. |
| artifact بسته     | **Job:** `Prepare release package artifact`<br />**گردش‌کار فرزند:** هیچ‌کدام<br />**اثبات می‌کند:** tarball والد `release-package-under-test` را آن‌قدر زود ایجاد می‌کند که بررسی‌های روبه‌روی بسته که لازم نیست منتظر `OpenClaw Release Checks` بمانند، بتوانند از آن استفاده کنند.<br />**اجرای دوباره:** umbrella را دوباره اجرا کنید یا برای اجرای دوباره بسته منتشرشده، `release_package_spec` را ارائه دهید.                                                                                           |
| Telegram بسته     | **Job:** `Run package Telegram E2E`<br />**گردش‌کار فرزند:** `NPM Telegram Beta E2E`<br />**اثبات می‌کند:** اثبات بسته Telegram مبتنی بر artifact والد برای `rerun_group=all` با `release_profile=full`، یا اثبات Telegram بسته منتشرشده هنگامی که `release_package_spec` یا `npm_telegram_package_spec` تنظیم شده باشد.<br />**اجرای دوباره:** `rerun_group=npm-telegram` با `release_package_spec` یا `npm_telegram_package_spec`.                           |
| تاییدکننده umbrella    | **Job:** `Verify full validation`<br />**گردش‌کار فرزند:** هیچ‌کدام<br />**اثبات می‌کند:** نتیجه‌های ثبت‌شده اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین jobها را از گردش‌کارهای فرزند اضافه می‌کند.<br />**اجرای دوباره:** پس از سبز شدن اجرای دوباره یک فرزند ناموفق، فقط همین job را دوباره اجرا کنید.                                                                                                                                                                                    |

برای `ref=main` و `rerun_group=all`، یک umbrella جدیدتر جایگزین نمونه قدیمی‌تر می‌شود.
وقتی والد لغو شود، مانیتور آن هر گردش‌کار فرزندی را که قبلا dispatch کرده باشد
لغو می‌کند. اجراهای اعتبارسنجی شاخه انتشار و تگ، به‌صورت پیش‌فرض یکدیگر را
لغو نمی‌کنند.

## مرحله‌های بررسی انتشار

`OpenClaw Release Checks` بزرگ‌ترین گردش‌کار فرزند است. هدف را یک‌بار resolve می‌کند
و وقتی مرحله‌های روبه‌روی بسته یا Docker به آن نیاز داشته باشند، یک artifact مشترک
`release-package-under-test` آماده می‌کند.

| مرحله               | جزئیات                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| هدف انتشار      | **کار:** `Resolve target ref`<br />**گردش کار پشتیبان:** هیچ‌کدام<br />**آزمایش‌ها:** ارجاع انتخاب‌شده، SHA مورد انتظار اختیاری، پروفایل، گروه اجرای مجدد، و فیلتر مجموعه زنده متمرکز.<br />**اجرای مجدد:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                              |
| مصنوع بسته    | **کار:** `Prepare release package artifact`<br />**گردش کار پشتیبان:** هیچ‌کدام<br />**آزمایش‌ها:** یک tarball نامزد را بسته‌بندی یا resolve می‌کند و `release-package-under-test` را برای بررسی‌های پایین‌دستی مرتبط با بسته آپلود می‌کند.<br />**اجرای مجدد:** بسته آسیب‌دیده، گروه بین‌سیستمی، یا گروه زنده/E2E.                                                                                                                                                                                                              |
| دودسنجی نصب       | **کار:** `Run install smoke`<br />**گردش کار پشتیبان:** `Install Smoke`<br />**آزمایش‌ها:** مسیر نصب کامل با استفاده مجدد از تصویر دودسنجی Dockerfile ریشه، نصب بسته QR، دودسنجی‌های Docker ریشه و Gateway، آزمایش‌های Docker نصب‌کننده، دودسنجی ارائه‌دهنده تصویر نصب سراسری Bun، و E2E سریع نصب/حذف نصب Pluginهای همراه.<br />**اجرای مجدد:** `rerun_group=install-smoke`.                                                                                                                                 |
| بین‌سیستمی            | **کار:** `cross_os_release_checks`<br />**گردش کار پشتیبان:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**آزمایش‌ها:** مسیرهای تازه و ارتقا روی Linux، Windows و macOS برای ارائه‌دهنده و حالت انتخاب‌شده، با استفاده از tarball نامزد به‌همراه یک بسته مبنا.<br />**اجرای مجدد:** `rerun_group=cross-os`.                                                                                                                                                                                  |
| E2E مخزن و زنده   | **کار:** `Run repo/live E2E validation`<br />**گردش کار پشتیبان:** `OpenClaw Live And E2E Checks (Reusable)`<br />**آزمایش‌ها:** E2E مخزن، کش زنده، استریم websocket OpenAI، shardهای ارائه‌دهنده زنده بومی و Plugin، و harnessهای مدل/backend/gateway زنده با پشتیبانی Docker که توسط `release_profile` انتخاب می‌شوند.<br />**اجراها:** `run_release_soak=true`، `release_profile=full`، یا `rerun_group=live-e2e` متمرکز.<br />**اجرای مجدد:** `rerun_group=live-e2e`، به‌صورت اختیاری با `live_suite_filter`. |
| مسیر انتشار Docker | **کار:** `Run Docker release-path validation`<br />**گردش کار پشتیبان:** `OpenClaw Live And E2E Checks (Reusable)`<br />**آزمایش‌ها:** قطعه‌های Docker مسیر انتشار در برابر مصنوع بسته مشترک.<br />**اجراها:** `run_release_soak=true`، `release_profile=full`، یا `rerun_group=live-e2e` متمرکز.<br />**اجرای مجدد:** `rerun_group=live-e2e`.                                                                                                                                                      |
| پذیرش بسته  | **کار:** `Run package acceptance`<br />**گردش کار پشتیبان:** `Package Acceptance`<br />**آزمایش‌ها:** fixtureهای بسته Plugin آفلاین، به‌روزرسانی Plugin، پذیرش بسته Telegram با mock-OpenAI، و بررسی‌های بازمانده ارتقای منتشرشده در برابر همان tarball. بررسی‌های انتشار مسدودکننده از مبنای پیش‌فرض آخرین نسخه منتشرشده استفاده می‌کنند؛ بررسی‌های soak به هر انتشار پایدار npm در `2026.4.23` یا پس از آن به‌علاوه fixtureهای مسئله گزارش‌شده گسترش می‌یابند.<br />**اجرای مجدد:** `rerun_group=package`.                          |
| هم‌ارزی QA           | **کار:** `Run QA Lab parity lane` و `Run QA Lab parity report`<br />**گردش کار پشتیبان:** کارهای مستقیم<br />**آزمایش‌ها:** بسته‌های هم‌ارزی عاملی نامزد و مبنا، سپس گزارش هم‌ارزی.<br />**اجرای مجدد:** `rerun_group=qa-parity` یا `rerun_group=qa`.                                                                                                                                                                                                                                          |
| ماتریس زنده QA      | **کار:** `Run QA Lab live Matrix lane`<br />**گردش کار پشتیبان:** کار مستقیم<br />**آزمایش‌ها:** پروفایل QA ماتریس زنده سریع در محیط `qa-live-shared`.<br />**اجرای مجدد:** `rerun_group=qa-live` یا `rerun_group=qa`.                                                                                                                                                                                                                                                                           |
| Telegram زنده QA    | **کار:** `Run QA Lab live Telegram lane`<br />**گردش کار پشتیبان:** کار مستقیم<br />**آزمایش‌ها:** QA زنده Telegram با اجاره‌های اعتبارنامه Convex CI.<br />**اجرای مجدد:** `rerun_group=qa-live` یا `rerun_group=qa`.                                                                                                                                                                                                                                                                                       |
| تاییدکننده انتشار    | **کار:** `Verify release checks`<br />**گردش کار پشتیبان:** هیچ‌کدام<br />**آزمایش‌ها:** کارهای الزامی بررسی انتشار برای گروه اجرای مجدد انتخاب‌شده.<br />**اجرای مجدد:** پس از گذر کارهای فرزند متمرکز، دوباره اجرا کنید.                                                                                                                                                                                                                                                                                                    |

## قطعه‌های مسیر انتشار Docker

مرحله مسیر انتشار Docker این قطعه‌ها را زمانی اجرا می‌کند که `live_suite_filter`
خالی باشد:

| قطعه                                                           | پوشش                                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `core`                                                          | مسیرهای دودسنجی مسیر انتشار Docker هسته.                                                             |
| `package-update-openai`                                         | رفتار نصب/به‌روزرسانی بسته OpenAI، نصب درخواستی Codex، و فراخوانی‌های ابزار Chat Completions. |
| `package-update-anthropic`                                      | رفتار نصب و به‌روزرسانی بسته Anthropic.                                                    |
| `package-update-core`                                           | رفتار بسته و به‌روزرسانی مستقل از ارائه‌دهنده.                                                     |
| `plugins-runtime-plugins`                                       | مسیرهای runtime Plugin که رفتار Plugin را تمرین می‌دهند.                                               |
| `plugins-runtime-services`                                      | مسیرهای runtime Plugin متکی به سرویس و زنده؛ هنگام درخواست شامل OpenWebUI می‌شود.                  |
| `plugins-runtime-install-a` تا `plugins-runtime-install-h` | دسته‌های نصب/runtime Plugin که برای اعتبارسنجی موازی انتشار تقسیم شده‌اند.                             |

وقتی فقط یک مسیر Docker شکست خورده است، از `docker_lanes=<lane[,lane]>` هدفمند
روی گردش کار زنده/E2E قابل استفاده مجدد استفاده کنید. مصنوع‌های انتشار شامل فرمان‌های اجرای مجدد
به‌ازای هر مسیر با ورودی‌های مصنوع بسته و استفاده مجدد از تصویر هستند، در صورت موجود بودن.

## پروفایل‌های انتشار

`release_profile` عمدتا گستره زنده/ارائه‌دهنده را داخل بررسی‌های انتشار کنترل می‌کند.
این گزینه CI کامل عادی، پیش‌انتشار Plugin، دودسنجی نصب، پذیرش بسته،
یا QA Lab را حذف نمی‌کند. برای `stable`، E2E جامع مخزن/زنده و قطعه‌های
مسیر انتشار Docker پوشش soak هستند و زمانی اجرا می‌شوند که `run_release_soak=true`.
`full` پوشش soak را فعال می‌کند و همچنین باعث می‌شود اجرای چتری، E2E بسته Telegram
را در برابر مصنوع بسته انتشار والد اجرا کند، وقتی `rerun_group=all` باشد؛ بنابراین یک نامزد کامل
پیش از انتشار بی‌صدا آن مسیر بسته Telegram را رد نمی‌کند.

| پروفایل   | کاربرد مورد نظر                      | پوشش زنده/ارائه‌دهنده شامل‌شده                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | سریع‌ترین دودسنجی حیاتی برای انتشار.   | مسیر زنده OpenAI/core، مدل‌های زنده Docker برای OpenAI، هسته Gateway بومی، پروفایل Gateway بومی OpenAI، Plugin بومی OpenAI، و Gateway زنده Docker OpenAI.                     |
| `stable`  | پروفایل پیش‌فرض تایید انتشار. | `minimum` به‌علاوه دودسنجی Anthropic، Google، MiniMax، backend، harness آزمایش زنده بومی، backend زنده CLI در Docker، اتصال Docker ACP، harness Docker Codex، و یک shard دودسنجی OpenCode Go. |
| `full`    | جاروب مشورتی گسترده.             | `stable` به‌علاوه ارائه‌دهندگان مشورتی، shardهای زنده Plugin، و shardهای زنده رسانه.                                                                                                        |

## افزوده‌های فقط کامل

این مجموعه‌ها توسط `stable` رد می‌شوند و توسط `full` شامل می‌شوند:

| حوزه                             | پوشش فقط کامل                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| مدل‌های زنده Docker               | OpenCode Go، OpenRouter، xAI، Z.ai، و Fireworks.                                                                          |
| Gateway زنده Docker              | ارائه‌دهندگان مشورتی تقسیم‌شده به shardهای DeepSeek/Fireworks، OpenCode Go/OpenRouter، و xAI/Z.ai.                              |
| پروفایل‌های ارائه‌دهنده Gateway بومی | shardهای کامل Anthropic Opus و Sonnet/Haiku، Fireworks، DeepSeek، shardهای کامل مدل OpenCode Go، OpenRouter، xAI، و Z.ai. |
| shardهای زنده Plugin بومی        | Pluginهای A-K، L-N، O-Z دیگر، Moonshot، و xAI.                                                                             |
| shardهای زنده رسانه بومی         | گروه‌های صدا، موسیقی Google، موسیقی MiniMax، و ویدئو A-D.                                                                   |

`stable` شامل `native-live-src-gateway-profiles-anthropic-smoke` و
`native-live-src-gateway-profiles-opencode-go-smoke` است؛ `full` به‌جای آن از shardهای
گسترده‌تر مدل Anthropic و OpenCode Go استفاده می‌کند. اجراهای مجدد متمرکز همچنان می‌توانند از
دسته‌های تجمیعی `native-live-src-gateway-profiles-anthropic` یا
`native-live-src-gateway-profiles-opencode-go` استفاده کنند.

## اجراهای مجدد متمرکز

برای پرهیز از تکرار جعبه‌های انتشار نامرتبط، از `rerun_group` استفاده کنید:

| شناسه              | دامنه                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | همهٔ مراحل اعتبارسنجی کامل انتشار.                                                             |
| `ci`                | فقط فرزند CI کامل دستی.                                                                      |
| `plugin-prerelease` | فقط فرزند پیش‌انتشار Plugin.                                                                   |
| `release-checks`    | همهٔ مراحل بررسی‌های انتشار OpenClaw.                                                             |
| `install-smoke`     | آزمون دود نصب تا بررسی‌های انتشار.                                                           |
| `cross-os`          | بررسی‌های انتشار میان‌سیستم‌عاملی.                                                                        |
| `live-e2e`          | اعتبارسنجی E2E مخزن/زنده و مسیر انتشار Docker.                                               |
| `package`           | پذیرش بسته.                                                                             |
| `qa`                | هم‌ارزی QA به‌همراه مسیرهای زندهٔ QA.                                                                   |
| `qa-parity`         | فقط مسیرهای هم‌ارزی QA و گزارش.                                                                |
| `qa-live`           | فقط Matrix زندهٔ QA و Telegram.                                                               |
| `npm-telegram`      | E2E Telegram برای بستهٔ منتشرشده؛ به `release_package_spec` یا `npm_telegram_package_spec` نیاز دارد. |

وقتی یک مجموعهٔ زنده شکست خورده است، از `live_suite_filter` همراه با `rerun_group=live-e2e` استفاده کنید.
شناسه‌های معتبر فیلتر در گردش‌کار زنده/E2E قابل‌استفادهٔ مجدد تعریف شده‌اند، از جمله
`docker-live-models`، `live-gateway-docker`،
`live-gateway-anthropic-docker`، `live-gateway-google-docker`،
`live-gateway-minimax-docker`، `live-gateway-advisory-docker`،
`live-cli-backend-docker`، `live-acp-bind-docker` و
`live-codex-harness-docker`.

شناسهٔ `live-gateway-advisory-docker` یک شناسهٔ اجرای دوبارهٔ تجمیعی برای سه
شارد ارائه‌دهندهٔ خود است، بنابراین همچنان به همهٔ کارهای مشورتی Gateway در Docker منشعب می‌شود.

وقتی یک مسیر میان‌سیستم‌عاملی شکست خورده است، از `cross_os_suite_filter` همراه با `rerun_group=cross-os` استفاده کنید. این فیلتر یک شناسهٔ سیستم‌عامل، یک شناسهٔ مجموعه، یا یک جفت سیستم‌عامل/مجموعه را می‌پذیرد؛
برای مثال `windows/packaged-upgrade`، `windows` یا `packaged-fresh`. خلاصه‌های میان‌سیستم‌عاملی
زمان‌بندی‌های هر فاز را برای مسیرهای ارتقای بسته‌بندی‌شده شامل می‌شوند، و فرمان‌های طولانی‌مدت
خطوط Heartbeat را چاپ می‌کنند تا یک به‌روزرسانی گیرکردهٔ Windows پیش از پایان مهلت کار قابل مشاهده باشد.

مسیرهای بررسی انتشار QA مشورتی هستند. شکست فقط مربوط به QA به‌صورت هشدار گزارش می‌شود
و تأییدکنندهٔ بررسی انتشار را مسدود نمی‌کند؛ وقتی به شواهد تازهٔ QA نیاز دارید،
`rerun_group=qa`، `qa-parity` یا `qa-live` را دوباره اجرا کنید.

## شواهدی که باید نگه دارید

خلاصهٔ `اعتبارسنجی کامل انتشار` را به‌عنوان نمایهٔ سطح انتشار نگه دارید. این خلاصه به
شناسه‌های اجرای فرزند پیوند می‌دهد و جدول‌های کندترین کارها را شامل می‌شود. برای شکست‌ها، ابتدا
گردش‌کار فرزند را بررسی کنید، سپس کوچک‌ترین شناسهٔ مطابق بالا را دوباره اجرا کنید.

مصنوعات مفید:

- `release-package-under-test` از والد اعتبارسنجی کامل انتشار و `بررسی‌های انتشار OpenClaw`
- مصنوعات مسیر انتشار Docker زیر `.artifacts/docker-tests/`
- `package-under-test` پذیرش بسته و مصنوعات پذیرش Docker
- مصنوعات بررسی انتشار میان‌سیستم‌عاملی برای هر سیستم‌عامل و مجموعه
- مصنوعات هم‌ارزی QA، Matrix و Telegram

## فایل‌های گردش‌کار

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
