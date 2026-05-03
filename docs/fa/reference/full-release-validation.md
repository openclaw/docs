---
read_when:
    - اجرای اعتبارسنجی کامل انتشار یا اجرای مجدد آن
    - مقایسهٔ پروفایل‌های اعتبارسنجی انتشار پایدار و کامل
    - اشکال‌زدایی از شکست‌های مرحلهٔ اعتبارسنجی انتشار
summary: مراحل اعتبارسنجی کامل انتشار، گردش‌کارهای فرزند، پروفایل‌های انتشار، شناسه‌های اجرای مجدد، و شواهد
title: اعتبارسنجی کامل انتشار
x-i18n:
    generated_at: "2026-05-03T21:39:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 038901ad751c00b35f69d7ec5caf74e577dcf2350d7658037c3ecc9ff5fab6d7
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` چتر انتشار است. این تنها نقطه ورود دستی
برای اثبات پیش از انتشار است، اما بیشتر کار در گردش‌کارهای فرزند انجام می‌شود تا
یک جعبه ناموفق بدون شروع دوباره کل انتشار بازاجرایی شود.

آن را از یک ارجاع گردش‌کار مورد اعتماد، معمولاً `main`، اجرا کنید و شاخه انتشار،
برچسب، یا SHA کامل commit را به‌عنوان `ref` بدهید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

گردش‌کارهای فرزند از ارجاع گردش‌کار مورد اعتماد برای ابزار اجرا و از ورودی
`ref` برای نامزد تحت آزمون استفاده می‌کنند. این باعث می‌شود منطق اعتبارسنجی جدید
هنگام اعتبارسنجی یک شاخه یا برچسب انتشار قدیمی‌تر در دسترس بماند.

Package Acceptance معمولاً tarball نامزد را از `ref` حل‌شده می‌سازد، از جمله
اجراهای SHA کامل که با `pnpm ci:full-release` dispatch شده‌اند. پس از انتشار،
`package_acceptance_package_spec=openclaw@YYYY.M.D` (یا
`openclaw@beta`/`openclaw@latest`) را بدهید تا همان ماتریس بسته/به‌روزرسانی را
در عوض روی بسته npm ارسال‌شده اجرا کند.

## مراحل سطح بالا

| مرحله                | جزئیات                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| حل هدف    | **کار:** `Resolve target ref`<br />**گردش‌کار فرزند:** هیچ‌کدام<br />**اثبات می‌کند:** شاخه انتشار، برچسب، یا SHA کامل commit را حل می‌کند و ورودی‌های انتخاب‌شده را ثبت می‌کند.<br />**بازاجرا:** اگر این مورد شکست خورد، چتر را بازاجرا کنید.                                                                                                                                                                              |
| Vitest و CI عادی | **کار:** `Run normal full CI`<br />**گردش‌کار فرزند:** `CI`<br />**اثبات می‌کند:** گراف CI کامل دستی را در برابر ارجاع هدف، شامل مسیرهای Linux Node، شاردهای Plugin بسته‌بندی‌شده، قراردادهای کانال، سازگاری Node 22، `check`، `check-additional`، smoke ساخت، بررسی‌های مستندات، Skills پایتون، Windows، macOS، i18n رابط کاربری کنترل، و Android از طریق چتر.<br />**بازاجرا:** `rerun_group=ci`. |
| پیش‌انتشار Plugin    | **کار:** `Run plugin prerelease validation`<br />**گردش‌کار فرزند:** `Plugin Prerelease`<br />**اثبات می‌کند:** بررسی‌های ایستای Plugin مخصوص انتشار، پوشش Plugin عاملی، شاردهای دسته‌ای کامل extension، و مسیرهای Docker پیش‌انتشار Plugin.<br />**بازاجرا:** `rerun_group=plugin-prerelease`.                                                                                                       |
| بررسی‌های انتشار       | **کار:** `Run release/live/Docker/QA validation`<br />**گردش‌کار فرزند:** `OpenClaw Release Checks`<br />**اثبات می‌کند:** smoke نصب، بررسی‌های بسته میان‌سیستمی، مجموعه‌های live/E2E، تکه‌های مسیر انتشار Docker، Package Acceptance، هم‌ارزی QA Lab، Matrix زنده، و Telegram زنده.<br />**بازاجرا:** `rerun_group=release-checks` یا یک handle محدودتر release-checks.                                |
| artifact بسته     | **کار:** `Prepare release package artifact`<br />**گردش‌کار فرزند:** هیچ‌کدام<br />**اثبات می‌کند:** tarball والد `release-package-under-test` را به‌اندازه کافی زود می‌سازد تا بررسی‌های بسته‌محور که نیازی به انتظار برای `OpenClaw Release Checks` ندارند اجرا شوند.<br />**بازاجرا:** چتر را بازاجرا کنید یا برای `rerun_group=npm-telegram` مقدار `npm_telegram_package_spec` را فراهم کنید.                                   |
| بسته Telegram     | **کار:** `Run package Telegram E2E`<br />**گردش‌کار فرزند:** `NPM Telegram Beta E2E`<br />**اثبات می‌کند:** اثبات بسته Telegram مبتنی بر artifact والد برای `rerun_group=all` همراه با `release_profile=full`، یا اثبات Telegram بسته منتشرشده وقتی `npm_telegram_package_spec` تنظیم شده باشد.<br />**بازاجرا:** `rerun_group=npm-telegram` همراه با `npm_telegram_package_spec`.                              |
| اعتبارسنج چتر    | **کار:** `Verify full validation`<br />**گردش‌کار فرزند:** هیچ‌کدام<br />**اثبات می‌کند:** نتیجه‌های ثبت‌شده اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین کارها را از گردش‌کارهای فرزند پیوست می‌کند.<br />**بازاجرا:** پس از سبز کردن یک فرزند ناموفق، فقط همین کار را بازاجرا کنید.                                                                                                                                   |

برای `ref=main` و `rerun_group=all`، یک چتر جدیدتر جایگزین چتر قدیمی‌تر می‌شود.
وقتی والد لغو می‌شود، پایشگر آن هر گردش‌کار فرزندی را که قبلاً dispatch کرده
است لغو می‌کند. اجراهای اعتبارسنجی شاخه انتشار و برچسب به‌صورت پیش‌فرض یکدیگر
را لغو نمی‌کنند.

## مراحل بررسی‌های انتشار

`OpenClaw Release Checks` بزرگ‌ترین گردش‌کار فرزند است. این گردش‌کار هدف را
یک‌بار حل می‌کند و وقتی مراحل بسته‌محور یا Dockerمحور به آن نیاز دارند، یک
artifact مشترک `release-package-under-test` آماده می‌کند.

| مرحله               | جزئیات                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| هدف انتشار      | **کار:** `Resolve target ref`<br />**گردش‌کار پشتیبان:** هیچ‌کدام<br />**آزمون‌ها:** ارجاع انتخاب‌شده، SHA مورد انتظار اختیاری، پروفایل، گروه بازاجرا، و فیلتر مجموعه live متمرکز.<br />**بازاجرا:** `rerun_group=release-checks`.                                                                                                                                                                           |
| artifact بسته    | **کار:** `Prepare release package artifact`<br />**گردش‌کار پشتیبان:** هیچ‌کدام<br />**آزمون‌ها:** یک tarball نامزد را بسته‌بندی یا حل می‌کند و `release-package-under-test` را برای بررسی‌های پایین‌دستی بسته‌محور بارگذاری می‌کند.<br />**بازاجرا:** گروه بسته، میان‌سیستمی، یا live/E2E تحت تأثیر.                                                                                                           |
| smoke نصب       | **کار:** `Run install smoke`<br />**گردش‌کار پشتیبان:** `Install Smoke`<br />**آزمون‌ها:** مسیر نصب کامل با استفاده دوباره از تصویر smoke ریشه Dockerfile، نصب بسته QR، smokeهای Docker ریشه و Gateway، آزمون‌های Docker نصب‌کننده، smoke ارائه‌دهنده تصویر نصب سراسری Bun، و E2E سریع نصب/حذف نصب Pluginهای بسته‌بندی‌شده.<br />**بازاجرا:** `rerun_group=install-smoke`.                              |
| میان‌سیستمی            | **کار:** `cross_os_release_checks`<br />**گردش‌کار پشتیبان:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**آزمون‌ها:** مسیرهای تازه و ارتقا روی Linux، Windows، و macOS برای ارائه‌دهنده و حالت انتخاب‌شده، با استفاده از tarball نامزد به‌همراه یک بسته مبنا.<br />**بازاجرا:** `rerun_group=cross-os`.                                                                               |
| مخزن و live E2E   | **کار:** `Run repo/live E2E validation`<br />**گردش‌کار پشتیبان:** `OpenClaw Live And E2E Checks (Reusable)`<br />**آزمون‌ها:** E2E مخزن، cache زنده، streaming websocket OpenAI، شاردهای ارائه‌دهنده و Plugin زنده native، و ابزارهای مدل/backend/Gateway زنده مبتنی بر Docker که با `release_profile` انتخاب می‌شوند.<br />**بازاجرا:** `rerun_group=live-e2e`، به‌صورت اختیاری همراه با `live_suite_filter`. |
| مسیر انتشار Docker | **کار:** `Run Docker release-path validation`<br />**گردش‌کار پشتیبان:** `OpenClaw Live And E2E Checks (Reusable)`<br />**آزمون‌ها:** تکه‌های Docker مسیر انتشار در برابر artifact بسته مشترک.<br />**بازاجرا:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **کار:** `Run package acceptance`<br />**گردش‌کار پشتیبان:** `Package Acceptance`<br />**آزمون‌ها:** fixtureهای بسته Plugin آفلاین، به‌روزرسانی Plugin، پذیرش بسته Telegram با mock-OpenAI، و بررسی‌های survivor ارتقای منتشرشده از هر انتشار npm پایدار در یا پس از `2026.4.23` در برابر همان tarball.<br />**بازاجرا:** `rerun_group=package`.                                         |
| هم‌ارزی QA           | **کار:** `Run QA Lab parity lane` و `Run QA Lab parity report`<br />**گردش‌کار پشتیبان:** کارهای مستقیم<br />**آزمون‌ها:** بسته‌های هم‌ارزی عاملی نامزد و مبنا، سپس گزارش هم‌ارزی.<br />**بازاجرا:** `rerun_group=qa-parity` یا `rerun_group=qa`.                                                                                                                                       |
| QA live Matrix      | **کار:** `Run QA Lab live Matrix lane`<br />**گردش‌کار پشتیبان:** کار مستقیم<br />**آزمون‌ها:** پروفایل QA سریع Matrix زنده در محیط `qa-live-shared`.<br />**بازاجرا:** `rerun_group=qa-live` یا `rerun_group=qa`.                                                                                                                                                                        |
| QA live Telegram    | **کار:** `Run QA Lab live Telegram lane`<br />**گردش‌کار پشتیبان:** کار مستقیم<br />**آزمون‌ها:** QA زنده Telegram با leaseهای اعتبارنامه Convex CI.<br />**بازاجرا:** `rerun_group=qa-live` یا `rerun_group=qa`.                                                                                                                                                                                    |
| اعتبارسنج انتشار    | **کار:** `Verify release checks`<br />**گردش‌کار پشتیبان:** هیچ‌کدام<br />**آزمون‌ها:** کارهای الزامی release-check برای گروه بازاجرای انتخاب‌شده.<br />**بازاجرا:** پس از موفقیت کارهای فرزند متمرکز بازاجرا کنید.                                                                                                                                                                                                 |

## تکه‌های مسیر انتشار Docker

مرحله مسیر انتشار Docker این تکه‌ها را وقتی `live_suite_filter` خالی است اجرا
می‌کند:

| تکه                                                           | پوشش                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | مسیرهای smoke مسیر انتشار Core Docker.                                   |
| `package-update-openai`                                         | رفتار نصب و به‌روزرسانی بسته OpenAI.                             |
| `package-update-anthropic`                                      | رفتار نصب و به‌روزرسانی بسته Anthropic.                          |
| `package-update-core`                                           | رفتار بسته و به‌روزرسانی مستقل از ارائه‌دهنده.                           |
| `plugins-runtime-plugins`                                       | مسیرهای runtime Plugin که رفتار Plugin را تمرین می‌کنند.                     |
| `plugins-runtime-services`                                      | مسیرهای runtime Plugin مبتنی بر سرویس؛ در صورت درخواست شامل OpenWebUI است. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | دسته‌های نصب/runtime Plugin که برای اعتبارسنجی انتشار موازی تقسیم شده‌اند.   |

در workflow زنده/E2E قابل‌استفاده‌مجدد، زمانی که فقط یک lane مربوط به Docker شکست خورده است، از `docker_lanes=<lane[,lane]>` هدفمند استفاده کنید. artifactهای انتشار، در صورت در دسترس بودن، شامل دستورهای rerun به‌ازای هر lane همراه با ورودی‌های استفادهٔ دوباره از artifact بسته و image هستند.

## پروفایل‌های انتشار

`release_profile` عمدتاً گسترهٔ زنده/provider را در بررسی‌های انتشار کنترل می‌کند.
این گزینه CI کامل عادی، پیش‌انتشار Plugin، install smoke، پذیرش بسته، QA Lab، یا بخش‌های مسیر انتشار Docker را حذف نمی‌کند. `full` همچنین باعث می‌شود umbrella run در حالت
`rerun_group=all`، package Telegram E2E را در برابر artifact بستهٔ انتشار والد اجرا کند، بنابراین یک کاندیدای کامل پیش از انتشار بی‌صدا آن lane بستهٔ Telegram را رد نمی‌کند.

| پروفایل   | کاربرد موردنظر                      | پوشش زنده/provider شامل‌شده                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | سریع‌ترین smoke حیاتی برای انتشار.   | مسیر زنده OpenAI/هسته، مدل‌های زنده Docker برای OpenAI، هستهٔ native gateway، پروفایل native OpenAI gateway، Plugin native OpenAI، و Docker live gateway OpenAI.                     |
| `stable`  | پروفایل پیش‌فرض تأیید انتشار. | `minimum` به‌علاوهٔ Anthropic smoke، Google، MiniMax، backend، native live test harness، Docker live CLI backend، Docker ACP bind، Docker Codex harness، و یک shard مربوط به OpenCode Go smoke. |
| `full`    | پیمایش advisory گسترده.             | `stable` به‌علاوهٔ providerهای advisory، shardهای زندهٔ plugin، و shardهای زندهٔ رسانه.                                                                                                        |

## افزوده‌های فقط مخصوص Full

این suiteها توسط `stable` رد می‌شوند و توسط `full` شامل می‌شوند:

| حوزه                             | پوشش فقط مخصوص Full                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| مدل‌های زنده Docker               | OpenCode Go، OpenRouter، xAI، Z.ai، و Fireworks.                                                                          |
| Docker live gateway              | providerهای advisory که به shardهای DeepSeek/Fireworks، OpenCode Go/OpenRouter، و xAI/Z.ai تقسیم شده‌اند.                              |
| پروفایل‌های provider مربوط به Native gateway | shardهای کامل Anthropic Opus و Sonnet/Haiku، Fireworks، DeepSeek، shardهای کامل مدل OpenCode Go، OpenRouter، xAI، و Z.ai. |
| shardهای زندهٔ Native plugin        | Plugins A-K، L-N، O-Z other، Moonshot، و xAI.                                                                             |
| shardهای زندهٔ Native media         | Audio، Google music، MiniMax music، و video groups A-D.                                                                   |

`stable` شامل `native-live-src-gateway-profiles-anthropic-smoke` و
`native-live-src-gateway-profiles-opencode-go-smoke` است؛ `full` به‌جای آن از shardهای گسترده‌تر مدل Anthropic و OpenCode Go استفاده می‌کند. rerunهای متمرکز همچنان می‌توانند از handleهای تجمیعی `native-live-src-gateway-profiles-anthropic` یا
`native-live-src-gateway-profiles-opencode-go` استفاده کنند.

## rerunهای متمرکز

برای پرهیز از تکرار boxهای انتشار نامرتبط، از `rerun_group` استفاده کنید:

| handle              | دامنه                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | همهٔ مرحله‌های Full Release Validation.                                   |
| `ci`                | فقط child مربوط به CI کامل دستی.                                            |
| `plugin-prerelease` | فقط child مربوط به پیش‌انتشار Plugin.                                         |
| `release-checks`    | همهٔ مرحله‌های OpenClaw Release Checks.                                   |
| `install-smoke`     | Install Smoke از طریق بررسی‌های انتشار.                                 |
| `cross-os`          | بررسی‌های انتشار Cross-OS.                                              |
| `live-e2e`          | اعتبارسنجی Repo/live E2E و مسیر انتشار Docker.                     |
| `package`           | Package Acceptance.                                                   |
| `qa`                | برابری QA به‌علاوهٔ laneهای زندهٔ QA.                                         |
| `qa-parity`         | فقط laneهای برابری QA و گزارش.                                      |
| `qa-live`           | فقط Matrix زندهٔ QA و Telegram.                                     |
| `npm-telegram`      | Telegram E2E برای بستهٔ منتشرشده؛ به `npm_telegram_package_spec` نیاز دارد. |

وقتی یک suite زنده شکست خورده است، همراه با `rerun_group=live-e2e` از `live_suite_filter` استفاده کنید.
شناسه‌های معتبر filter در workflow زنده/E2E قابل‌استفاده‌مجدد تعریف شده‌اند، از جمله
`docker-live-models`، `live-gateway-docker`،
`live-gateway-anthropic-docker`، `live-gateway-google-docker`،
`live-gateway-minimax-docker`، `live-gateway-advisory-docker`،
`live-cli-backend-docker`، `live-acp-bind-docker`، و
`live-codex-harness-docker`.

handle مربوط به `live-gateway-advisory-docker` یک handle تجمیعی rerun برای سه shard provider خودش است، بنابراین همچنان به همهٔ jobهای advisory Docker gateway گسترش پیدا می‌کند.

## شواهدی که باید نگه دارید

خلاصهٔ `Full Release Validation` را به‌عنوان شاخص سطح انتشار نگه دارید. این خلاصه به شناسه‌های run فرزند لینک می‌دهد و شامل جدول‌های کندترین jobهاست. برای failureها، ابتدا workflow فرزند را بررسی کنید، سپس کوچک‌ترین handle منطبق بالا را دوباره اجرا کنید.

artifactهای مفید:

- `release-package-under-test` از والد Full Release Validation و `OpenClaw Release Checks`
- artifactهای مسیر انتشار Docker زیر `.artifacts/docker-tests/`
- `package-under-test` مربوط به Package Acceptance و artifactهای پذیرش Docker
- artifactهای بررسی انتشار Cross-OS برای هر OS و suite
- artifactهای برابری QA، Matrix، و Telegram

## فایل‌های workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
