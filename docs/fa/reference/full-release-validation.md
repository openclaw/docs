---
read_when:
    - اجرای اعتبارسنجی کامل انتشار یا اجرای دوبارهٔ آن
    - مقایسهٔ پروفایل‌های اعتبارسنجی انتشار پایدار و کامل
    - اشکال‌زدایی شکست‌های مرحله اعتبارسنجی انتشار
summary: مراحل اعتبارسنجی کامل انتشار، گردش‌های کاری فرزند، نمایه‌های انتشار، شناسه‌های اجرای مجدد، و شواهد
title: اعتبارسنجی کامل انتشار
x-i18n:
    generated_at: "2026-05-03T11:44:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5ebe41b7f1fdd019bf7d4adc64648e7aa7ff1691314bc19ba78008e9e6858f2
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` چتر انتشار است. این تنها نقطه ورود دستی برای اثبات پیش از انتشار است، اما بیشتر کار در workflowهای فرزند انجام می‌شود تا یک باکس ناموفق بتواند بدون شروع دوباره کل انتشار، دوباره اجرا شود.

آن را از یک ref قابل اعتماد workflow، معمولا `main`، اجرا کنید و شاخه انتشار، تگ، یا SHA کامل کامیت را به‌عنوان `ref` بدهید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

workflowهای فرزند از ref قابل اعتماد workflow برای harness و از ورودی `ref` برای کاندیدای تحت آزمون استفاده می‌کنند. این باعث می‌شود هنگام اعتبارسنجی یک شاخه انتشار یا تگ قدیمی‌تر، منطق اعتبارسنجی جدید در دسترس بماند.

Package Acceptance معمولا tarball کاندیدا را از `ref` حل‌شده می‌سازد، از جمله اجراهای SHA کامل که با `pnpm ci:full-release` dispatch شده‌اند. پس از انتشار، `package_acceptance_package_spec=openclaw@YYYY.M.D` (یا `openclaw@beta`/`openclaw@latest`) را بدهید تا همان ماتریس بسته/به‌روزرسانی به‌جای آن روی بسته npm ارسال‌شده اجرا شود.

## مرحله‌های سطح بالا

| مرحله                | جزئیات                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| حل هدف    | **Job:** `Resolve target ref`<br />**workflow فرزند:** ندارد<br />**اثبات می‌کند:** شاخه انتشار، تگ، یا SHA کامل کامیت را حل می‌کند و ورودی‌های انتخاب‌شده را ثبت می‌کند.<br />**اجرای دوباره:** اگر این ناموفق شد، چتر را دوباره اجرا کنید.                                                                                                                                                                              |
| Vitest و CI عادی | **Job:** `Run normal full CI`<br />**workflow فرزند:** `CI`<br />**اثبات می‌کند:** گراف CI کامل دستی را در برابر ref هدف، شامل laneهای Linux Node، shardهای Plugin همراه، قراردادهای کانال، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های docs، Python skills، Windows، macOS، i18n رابط Control، و Android از طریق چتر.<br />**اجرای دوباره:** `rerun_group=ci`. |
| پیش‌انتشار Plugin    | **Job:** `Run plugin prerelease validation`<br />**workflow فرزند:** `Plugin Prerelease`<br />**اثبات می‌کند:** بررسی‌های ایستای فقط-انتشار Plugin، پوشش Plugin عامل‌محور، shardهای کامل دسته extension، و laneهای Docker پیش‌انتشار Plugin.<br />**اجرای دوباره:** `rerun_group=plugin-prerelease`.                                                                                                       |
| بررسی‌های انتشار       | **Job:** `Run release/live/Docker/QA validation`<br />**workflow فرزند:** `OpenClaw Release Checks`<br />**اثبات می‌کند:** install smoke، بررسی‌های بسته بین‌سیستم‌عاملی، suiteهای live/E2E، chunkهای مسیر انتشار Docker، Package Acceptance، برابری QA Lab، Matrix زنده، و Telegram زنده.<br />**اجرای دوباره:** `rerun_group=release-checks` یا یک handle محدودتر release-checks.                                |
| مصنوع بسته     | **Job:** `Prepare release package artifact`<br />**workflow فرزند:** ندارد<br />**اثبات می‌کند:** tarball والد `release-package-under-test` را آن‌قدر زود می‌سازد که بررسی‌های روبه‌روی بسته لازم نباشد منتظر `OpenClaw Release Checks` بمانند.<br />**اجرای دوباره:** چتر را دوباره اجرا کنید یا برای `rerun_group=npm-telegram` مقدار `npm_telegram_package_spec` را ارائه دهید.                                   |
| بسته Telegram     | **Job:** `Run package Telegram E2E`<br />**workflow فرزند:** `NPM Telegram Beta E2E`<br />**اثبات می‌کند:** اثبات بسته Telegram با پشتوانه مصنوع والد برای `rerun_group=all` همراه با `release_profile=full`، یا اثبات Telegram بسته منتشرشده وقتی `npm_telegram_package_spec` تنظیم شده باشد.<br />**اجرای دوباره:** `rerun_group=npm-telegram` با `npm_telegram_package_spec`.                              |
| راستی‌آزمای چتر    | **Job:** `Verify full validation`<br />**workflow فرزند:** ندارد<br />**اثبات می‌کند:** نتیجه‌های ثبت‌شده اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین jobها را از workflowهای فرزند اضافه می‌کند.<br />**اجرای دوباره:** پس از سبز شدن یک فرزند ناموفق با اجرای دوباره، فقط این job را دوباره اجرا کنید.                                                                                                                                   |

برای `ref=main` و `rerun_group=all`، یک چتر جدیدتر جایگزین چتر قدیمی‌تر می‌شود. وقتی والد لغو می‌شود، monitor آن هر workflow فرزندی را که قبلا dispatch کرده است لغو می‌کند. اجراهای اعتبارسنجی شاخه انتشار و تگ به‌صورت پیش‌فرض یکدیگر را لغو نمی‌کنند.

## مرحله‌های بررسی انتشار

`OpenClaw Release Checks` بزرگ‌ترین workflow فرزند است. هدف را یک‌بار حل می‌کند و وقتی مرحله‌های روبه‌روی بسته یا Docker به آن نیاز داشته باشند، یک مصنوع مشترک `release-package-under-test` آماده می‌کند.

| مرحله               | جزئیات                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| هدف انتشار      | **Job:** `Resolve target ref`<br />**workflow پشتیبان:** ندارد<br />**آزمون‌ها:** ref انتخاب‌شده، SHA مورد انتظار اختیاری، profile، گروه اجرای دوباره، و فیلتر suite زنده متمرکز.<br />**اجرای دوباره:** `rerun_group=release-checks`.                                                                                                                                                                           |
| مصنوع بسته    | **Job:** `Prepare release package artifact`<br />**workflow پشتیبان:** ندارد<br />**آزمون‌ها:** یک tarball کاندیدا را pack یا resolve می‌کند و `release-package-under-test` را برای بررسی‌های پایین‌دستی روبه‌روی بسته upload می‌کند.<br />**اجرای دوباره:** گروه بسته، cross-OS، یا live/E2E تحت تاثیر.                                                                                                           |
| Install smoke       | **Job:** `Run install smoke`<br />**workflow پشتیبان:** `Install Smoke`<br />**آزمون‌ها:** مسیر کامل نصب با استفاده دوباره از تصویر smoke مربوط به root Dockerfile، نصب بسته QR، smokeهای root و Gateway Docker، آزمون‌های Docker نصاب، smoke ارائه‌دهنده تصویر نصب سراسری Bun، و E2E سریع نصب/حذف نصب Pluginهای همراه.<br />**اجرای دوباره:** `rerun_group=install-smoke`.                              |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**workflow پشتیبان:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**آزمون‌ها:** laneهای تازه و ارتقا روی Linux، Windows، و macOS برای provider و mode انتخاب‌شده، با استفاده از tarball کاندیدا به‌همراه یک بسته baseline.<br />**اجرای دوباره:** `rerun_group=cross-os`.                                                                               |
| E2E مخزن و زنده   | **Job:** `Run repo/live E2E validation`<br />**workflow پشتیبان:** `OpenClaw Live And E2E Checks (Reusable)`<br />**آزمون‌ها:** E2E مخزن، cache زنده، streaming websocket OpenAI، shardهای provider و Plugin زنده native، و harnessهای مدل/backend/Gateway زنده با پشتوانه Docker که با `release_profile` انتخاب شده‌اند.<br />**اجرای دوباره:** `rerun_group=live-e2e`، به‌صورت اختیاری با `live_suite_filter`. |
| مسیر انتشار Docker | **Job:** `Run Docker release-path validation`<br />**workflow پشتیبان:** `OpenClaw Live And E2E Checks (Reusable)`<br />**آزمون‌ها:** chunkهای Docker مسیر انتشار در برابر مصنوع بسته مشترک.<br />**اجرای دوباره:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **Job:** `Run package acceptance`<br />**workflow پشتیبان:** `Package Acceptance`<br />**آزمون‌ها:** fixtureهای آفلاین بسته Plugin، به‌روزرسانی Plugin، پذیرش بسته Telegram با mock-OpenAI، و بررسی‌های بازماندن ارتقای منتشرشده از هر انتشار npm پایدار در یا پس از `2026.4.23` در برابر همان tarball.<br />**اجرای دوباره:** `rerun_group=package`.                                         |
| برابری QA           | **Job:** `Run QA Lab parity lane` و `Run QA Lab parity report`<br />**workflow پشتیبان:** jobهای مستقیم<br />**آزمون‌ها:** بسته‌های برابری عامل‌محور کاندیدا و baseline، سپس گزارش برابری.<br />**اجرای دوباره:** `rerun_group=qa-parity` یا `rerun_group=qa`.                                                                                                                                       |
| Matrix زنده QA      | **Job:** `Run QA Lab live Matrix lane`<br />**workflow پشتیبان:** job مستقیم<br />**آزمون‌ها:** profile سریع QA زنده Matrix در محیط `qa-live-shared`.<br />**اجرای دوباره:** `rerun_group=qa-live` یا `rerun_group=qa`.                                                                                                                                                                        |
| Telegram زنده QA    | **Job:** `Run QA Lab live Telegram lane`<br />**workflow پشتیبان:** job مستقیم<br />**آزمون‌ها:** QA زنده Telegram با leaseهای credential مربوط به Convex CI.<br />**اجرای دوباره:** `rerun_group=qa-live` یا `rerun_group=qa`.                                                                                                                                                                                    |
| راستی‌آزمای انتشار    | **Job:** `Verify release checks`<br />**workflow پشتیبان:** ندارد<br />**آزمون‌ها:** jobهای لازم release-check برای گروه اجرای دوباره انتخاب‌شده.<br />**اجرای دوباره:** پس از عبور jobهای فرزند متمرکز، دوباره اجرا کنید.                                                                                                                                                                                                 |

## chunkهای مسیر انتشار Docker

مرحله مسیر انتشار Docker وقتی `live_suite_filter` خالی باشد این chunkها را اجرا می‌کند:

| chunk                                                           | پوشش                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | laneهای smoke مسیر انتشار Docker هسته.                                   |
| `package-update-openai`                                         | رفتار نصب و به‌روزرسانی بسته OpenAI.                             |
| `package-update-anthropic`                                      | رفتار نصب و به‌روزرسانی بسته Anthropic.                          |
| `package-update-core`                                           | رفتار بسته و به‌روزرسانی مستقل از provider.                           |
| `plugins-runtime-plugins`                                       | laneهای runtime Plugin که رفتار Plugin را تمرین می‌کنند.                     |
| `plugins-runtime-services`                                      | laneهای runtime Plugin با پشتوانه سرویس؛ در صورت درخواست شامل OpenWebUI می‌شود. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | دسته‌های نصب/runtime Plugin که برای اعتبارسنجی انتشار موازی split شده‌اند.   |

از `docker_lanes=<lane[,lane]>` هدفمند در گردش‌کار زنده/E2E قابل‌استفاده‌مجدد استفاده کنید وقتی
فقط یک مسیر Docker شکست خورده است. آرتیفکت‌های انتشار شامل فرمان‌های اجرای مجدد
برای هر مسیر، همراه با ورودی‌های استفادهٔ مجدد از آرتیفکت بسته و تصویر، در صورت موجود بودن هستند.

## نمایه‌های انتشار

`release_profile` عمدتاً گسترهٔ زنده/ارائه‌دهنده را داخل بررسی‌های انتشار کنترل می‌کند.
این گزینه CI کامل معمول، پیش‌انتشار Plugin، دودسنجی نصب، پذیرش بسته، QA Lab، یا بخش‌های
مسیر انتشار Docker را حذف نمی‌کند. `full` همچنین باعث می‌شود اجرای چتری، Telegram E2E بسته را
در برابر آرتیفکت بستهٔ انتشار والد اجرا کند وقتی `rerun_group=all` باشد، تا یک نامزد کامل پیش از انتشار
بی‌سروصدا آن مسیر بستهٔ Telegram را رد نکند.

| نمایه     | کاربرد مورد نظر                   | پوشش زنده/ارائه‌دهندهٔ شامل‌شده                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | سریع‌ترین دودسنجی حیاتی انتشار.   | مسیر زندهٔ OpenAI/هسته، مدل‌های زندهٔ Docker برای OpenAI، هستهٔ Gateway بومی، نمایهٔ Gateway بومی OpenAI، Plugin بومی OpenAI، و Gateway زندهٔ Docker برای OpenAI.                |
| `stable`  | نمایهٔ پیش‌فرض تأیید انتشار.      | `minimum` به‌علاوهٔ دودسنجی Anthropic، Google، MiniMax، backend، چارچوب آزمون زندهٔ بومی، backend زندهٔ CLI در Docker، اتصال ACP در Docker، چارچوب Codex در Docker، و یک قطعهٔ دودسنجی OpenCode Go. |
| `full`    | پیمایش مشورتی گسترده.             | `stable` به‌علاوهٔ ارائه‌دهندگان مشورتی، قطعه‌های زندهٔ Plugin، و قطعه‌های زندهٔ رسانه.                                                                                           |

## افزوده‌های فقط `full`

این مجموعه‌ها توسط `stable` رد می‌شوند و توسط `full` شامل می‌شوند:

| ناحیه                            | پوشش فقط `full`                                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| مدل‌های زندهٔ Docker             | OpenCode Go، OpenRouter، xAI، Z.ai، و Fireworks.                                                                           |
| Gateway زندهٔ Docker             | قطعهٔ مشورتی برای DeepSeek، Fireworks، OpenCode Go، OpenRouter، xAI، و Z.ai.                                             |
| نمایه‌های ارائه‌دهندهٔ Gateway بومی | قطعه‌های کامل Anthropic Opus و Sonnet/Haiku، Fireworks، DeepSeek، قطعه‌های کامل مدل OpenCode Go، OpenRouter، xAI، و Z.ai. |
| قطعه‌های زندهٔ Plugin بومی       | Pluginهای A-K، L-N، O-Z دیگر، Moonshot، و xAI.                                                                             |
| قطعه‌های زندهٔ رسانهٔ بومی       | Audio، Google music، MiniMax music، و گروه‌های ویدیو A-D.                                                                 |

`stable` شامل `native-live-src-gateway-profiles-anthropic-smoke` و
`native-live-src-gateway-profiles-opencode-go-smoke` است؛ `full` به‌جای آن از قطعه‌های گسترده‌تر
مدل Anthropic و OpenCode Go استفاده می‌کند. اجراهای مجدد متمرکز همچنان می‌توانند از شناسه‌های تجمیعی
`native-live-src-gateway-profiles-anthropic` یا
`native-live-src-gateway-profiles-opencode-go` استفاده کنند.

## اجراهای مجدد متمرکز

از `rerun_group` استفاده کنید تا از تکرار جعبه‌های انتشار نامرتبط جلوگیری شود:

| شناسه               | دامنه                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | همهٔ مراحل اعتبارسنجی کامل انتشار.                                   |
| `ci`                | فقط فرزند CI کامل دستی.                                              |
| `plugin-prerelease` | فقط فرزند پیش‌انتشار Plugin.                                         |
| `release-checks`    | همهٔ مراحل بررسی‌های انتشار OpenClaw.                                |
| `install-smoke`     | دودسنجی نصب از طریق بررسی‌های انتشار.                                |
| `cross-os`          | بررسی‌های انتشار Cross-OS.                                           |
| `live-e2e`          | E2E مخزن/زنده و اعتبارسنجی مسیر انتشار Docker.                      |
| `package`           | پذیرش بسته.                                                          |
| `qa`                | هم‌ارزی QA به‌علاوهٔ مسیرهای زندهٔ QA.                               |
| `qa-parity`         | فقط مسیرهای هم‌ارزی QA و گزارش.                                      |
| `qa-live`           | فقط ماتریس زندهٔ QA و Telegram.                                      |
| `npm-telegram`      | Telegram E2E بستهٔ منتشرشده؛ به `npm_telegram_package_spec` نیاز دارد. |

از `live_suite_filter` همراه با `rerun_group=live-e2e` استفاده کنید وقتی یک مجموعهٔ زنده شکست خورده است.
شناسه‌های معتبر فیلتر در گردش‌کار زنده/E2E قابل‌استفاده‌مجدد تعریف شده‌اند، از جمله
`docker-live-models`، `live-gateway-docker`،
`live-gateway-anthropic-docker`، `live-gateway-google-docker`،
`live-gateway-minimax-docker`، `live-gateway-advisory-docker`،
`live-cli-backend-docker`، `live-acp-bind-docker`، و
`live-codex-harness-docker`.

## شواهدی که باید نگه داشت

خلاصهٔ `Full Release Validation` را به‌عنوان نمایهٔ سطح انتشار نگه دارید. این خلاصه به شناسه‌های اجرای
فرزند پیوند می‌دهد و جدول‌های کندترین کارها را شامل می‌شود. برای شکست‌ها، ابتدا گردش‌کار فرزند را بررسی کنید،
سپس کوچک‌ترین شناسهٔ مطابق بالا را دوباره اجرا کنید.

آرتیفکت‌های مفید:

- `release-package-under-test` از والد Full Release Validation و `OpenClaw Release Checks`
- آرتیفکت‌های مسیر انتشار Docker زیر `.artifacts/docker-tests/`
- `package-under-test` پذیرش بسته و آرتیفکت‌های پذیرش Docker
- آرتیفکت‌های بررسی انتشار Cross-OS برای هر سیستم‌عامل و مجموعه
- آرتیفکت‌های هم‌ارزی QA، Matrix، و Telegram

## فایل‌های گردش‌کار

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
