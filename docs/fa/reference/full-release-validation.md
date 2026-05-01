---
read_when:
    - اجرای یا اجرای دوبارهٔ اعتبارسنجی کامل انتشار
    - مقایسهٔ پروفایل‌های اعتبارسنجی انتشار پایدار و کامل
    - اشکال‌زدایی از شکست‌های مرحلهٔ اعتبارسنجی انتشار
summary: مراحل اعتبارسنجی کامل انتشار، گردش‌کارهای فرزند، پروفایل‌های انتشار، شناسه‌های اجرای مجدد، و شواهد
title: اعتبارسنجی کامل انتشار
x-i18n:
    generated_at: "2026-05-01T11:52:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcbfafd744437c160c09a9c508a639781549193669b300e5249023f9f5dd4afe
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` چتر انتشار است. این تنها نقطهٔ ورود دستی
برای اثبات پیش از انتشار است، اما بیشتر کارها در workflowهای فرزند انجام می‌شود تا یک
باکس ناموفق را بتوان بدون شروع دوبارهٔ کل انتشار، دوباره اجرا کرد.

آن را از یک ref مورداعتماد workflow، معمولاً `main`، اجرا کنید و شاخهٔ انتشار،
tag، یا commit SHA کامل را به‌عنوان `ref` پاس دهید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

workflowهای فرزند از ref مورداعتماد workflow برای harness و از ورودی
`ref` برای نامزد تحت آزمون استفاده می‌کنند. این باعث می‌شود هنگام اعتبارسنجی
یک شاخه یا tag انتشار قدیمی‌تر، منطق جدید اعتبارسنجی در دسترس بماند.

## مرحله‌های سطح بالا

| مرحله                 | جزئیات                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| حل هدف     | **Job:** `Resolve target ref`<br />**workflow فرزند:** ندارد<br />**اثبات می‌کند:** شاخهٔ انتشار، tag، یا commit SHA کامل را حل می‌کند و ورودی‌های انتخاب‌شده را ثبت می‌کند.<br />**اجرای دوباره:** اگر این مورد شکست خورد، چتر را دوباره اجرا کنید.                                                                                                                                                                              |
| Vitest و CI معمولی  | **Job:** `Run normal full CI`<br />**workflow فرزند:** `CI`<br />**اثبات می‌کند:** گراف CI کامل دستی در برابر ref هدف، شامل laneهای Linux Node، shardهای Plugin باندل‌شده، قراردادهای کانال، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های مستندات، Skills پایتون، Windows، macOS، i18n رابط کاربری Control، و Android از طریق چتر.<br />**اجرای دوباره:** `rerun_group=ci`. |
| پیش‌انتشار Plugin     | **Job:** `Run plugin prerelease validation`<br />**workflow فرزند:** `Plugin Prerelease`<br />**اثبات می‌کند:** بررسی‌های ایستای مخصوص انتشار برای Plugin، پوشش Plugin عاملی، shardهای کامل دستهٔ extension، و laneهای Docker پیش‌انتشار Plugin.<br />**اجرای دوباره:** `rerun_group=plugin-prerelease`.                                                                                                       |
| بررسی‌های انتشار        | **Job:** `Run release/live/Docker/QA validation`<br />**workflow فرزند:** `OpenClaw Release Checks`<br />**اثبات می‌کند:** install smoke، بررسی‌های بستهٔ cross-OS، مجموعه‌های live/E2E، بخش‌های مسیر انتشار Docker، Package Acceptance، برابری QA Lab، Matrix زنده، و Telegram زنده.<br />**اجرای دوباره:** `rerun_group=release-checks` یا یک handle محدودتر برای release-checks.                                |
| Telegram پس از انتشار | **Job:** `Run post-publish Telegram E2E`<br />**workflow فرزند:** `NPM Telegram Beta E2E`<br />**اثبات می‌کند:** اثبات اختیاری Telegram برای بستهٔ منتشرشده وقتی `npm_telegram_package_spec` تنظیم شده باشد.<br />**اجرای دوباره:** `rerun_group=npm-telegram`.                                                                                                                                                     |
| اعتبارسنج چتر     | **Job:** `Verify full validation`<br />**workflow فرزند:** ندارد<br />**اثبات می‌کند:** نتیجه‌های ثبت‌شدهٔ اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین jobها را از workflowهای فرزند اضافه می‌کند.<br />**اجرای دوباره:** پس از سبز شدن اجرای دوبارهٔ یک فرزند ناموفق، فقط همین job را دوباره اجرا کنید.                                                                                                                                   |

برای `ref=main` و `rerun_group=all`، یک چتر جدیدتر جایگزین یک چتر قدیمی‌تر می‌شود.
وقتی والد لغو شود، monitor آن هر workflow فرزندی را که قبلاً dispatch کرده است
لغو می‌کند. اجرای اعتبارسنجی شاخهٔ انتشار و tag به‌صورت پیش‌فرض یکدیگر را
لغو نمی‌کنند.

## مرحله‌های بررسی انتشار

`OpenClaw Release Checks` بزرگ‌ترین workflow فرزند است. این workflow هدف را
یک‌بار حل می‌کند و وقتی مرحله‌های مربوط به بسته یا Docker به آن نیاز داشته باشند،
یک artifact مشترک `release-package-under-test` آماده می‌کند.

| مرحله               | جزئیات                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| هدف انتشار      | **Job:** `Resolve target ref`<br />**workflow پشتیبان:** ندارد<br />**آزمون‌ها:** ref انتخاب‌شده، SHA موردانتظار اختیاری، profile، rerun group، و فیلتر متمرکز مجموعهٔ live.<br />**اجرای دوباره:** `rerun_group=release-checks`.                                                                                                                                                                           |
| artifact بسته    | **Job:** `Prepare release package artifact`<br />**workflow پشتیبان:** ندارد<br />**آزمون‌ها:** یک tarball نامزد را بسته‌بندی یا حل می‌کند و `release-package-under-test` را برای بررسی‌های پایین‌دستی مرتبط با بسته بارگذاری می‌کند.<br />**اجرای دوباره:** گروه بسته، cross-OS، یا live/E2E آسیب‌دیده.                                                                                                           |
| Install smoke       | **Job:** `Run install smoke`<br />**workflow پشتیبان:** `Install Smoke`<br />**آزمون‌ها:** مسیر نصب کامل با استفادهٔ دوباره از تصویر smoke ریشهٔ Dockerfile، نصب بستهٔ QR، smokeهای Docker ریشه و Gateway، آزمون‌های Docker نصب‌کننده، smoke نصب سراسری Bun برای image-provider، و Docker E2E سریع Pluginهای باندل‌شده.<br />**اجرای دوباره:** `rerun_group=install-smoke`.                                         |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**workflow پشتیبان:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**آزمون‌ها:** laneهای fresh و upgrade روی Linux، Windows، و macOS برای provider و mode انتخاب‌شده، با استفاده از tarball نامزد به‌همراه یک بستهٔ baseline.<br />**اجرای دوباره:** `rerun_group=cross-os`.                                                                               |
| E2E مخزن و live   | **Job:** `Run repo/live E2E validation`<br />**workflow پشتیبان:** `OpenClaw Live And E2E Checks (Reusable)`<br />**آزمون‌ها:** E2E مخزن، cache زنده، streaming وب‌سوکت OpenAI، shardهای provider و Plugin زندهٔ native، و harnessهای مدل/backend/Gateway زنده با پشتیبانی Docker که توسط `release_profile` انتخاب می‌شوند.<br />**اجرای دوباره:** `rerun_group=live-e2e`، به‌صورت اختیاری همراه با `live_suite_filter`. |
| مسیر انتشار Docker | **Job:** `Run Docker release-path validation`<br />**workflow پشتیبان:** `OpenClaw Live And E2E Checks (Reusable)`<br />**آزمون‌ها:** بخش‌های Docker مسیر انتشار در برابر artifact بستهٔ مشترک.<br />**اجرای دوباره:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **Job:** `Run package acceptance`<br />**workflow پشتیبان:** `Package Acceptance`<br />**آزمون‌ها:** سازگاری وابستگی کانال باندل‌شدهٔ native artifact، fixtureهای آفلاین بستهٔ Plugin، و پذیرش بستهٔ Telegram با mock-OpenAI در برابر همان tarball.<br />**اجرای دوباره:** `rerun_group=package`.                                                                                       |
| برابری QA           | **Job:** `Run QA Lab parity lane` و `Run QA Lab parity report`<br />**workflow پشتیبان:** jobهای مستقیم<br />**آزمون‌ها:** packهای برابری عاملی نامزد و baseline، سپس گزارش برابری.<br />**اجرای دوباره:** `rerun_group=qa-parity` یا `rerun_group=qa`.                                                                                                                                       |
| Matrix زندهٔ QA      | **Job:** `Run QA Lab live Matrix lane`<br />**workflow پشتیبان:** job مستقیم<br />**آزمون‌ها:** profile سریع QA زندهٔ Matrix در محیط `qa-live-shared`.<br />**اجرای دوباره:** `rerun_group=qa-live` یا `rerun_group=qa`.                                                                                                                                                                        |
| Telegram زندهٔ QA    | **Job:** `Run QA Lab live Telegram lane`<br />**workflow پشتیبان:** job مستقیم<br />**آزمون‌ها:** QA زندهٔ Telegram با leaseهای credential مربوط به Convex CI.<br />**اجرای دوباره:** `rerun_group=qa-live` یا `rerun_group=qa`.                                                                                                                                                                                    |
| اعتبارسنج انتشار    | **Job:** `Verify release checks`<br />**workflow پشتیبان:** ندارد<br />**آزمون‌ها:** jobهای لازم release-check برای rerun group انتخاب‌شده.<br />**اجرای دوباره:** پس از عبور jobهای فرزند متمرکز، دوباره اجرا کنید.                                                                                                                                                                                                 |

## بخش‌های مسیر انتشار Docker

مرحلهٔ مسیر انتشار Docker وقتی `live_suite_filter` خالی باشد این بخش‌ها را اجرا می‌کند:

| بخش                                                                                       | پوشش                                                                |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                                                      | laneهای smoke مسیر انتشار Core Docker.                                   |
| `package-update-openai`                                                                     | رفتار نصب و به‌روزرسانی بستهٔ OpenAI.                             |
| `package-update-anthropic`                                                                  | رفتار نصب و به‌روزرسانی بستهٔ Anthropic.                          |
| `package-update-core`                                                                       | رفتار بسته و به‌روزرسانی مستقل از provider.                           |
| `plugins-runtime-plugins`                                                                   | laneهای runtime Plugin که رفتار Plugin را تمرین می‌کنند.                     |
| `plugins-runtime-services`                                                                  | laneهای runtime Plugin با پشتیبانی سرویس؛ وقتی درخواست شود شامل OpenWebUI است. |
| `plugins-runtime-install-a` تا `plugins-runtime-install-h`                             | دسته‌های نصب/runtime Plugin که برای اعتبارسنجی موازی انتشار تقسیم شده‌اند.   |
| `bundled-channels-core`                                                                     | رفتار Docker کانال باندل‌شده.                                        |
| `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` | رفتار به‌روزرسانی کانال باندل‌شده.                                        |
| `bundled-channels-contracts`                                                                | بررسی‌های قرارداد کانال باندل‌شده در مسیر انتشار Docker.             |

از `docker_lanes=<lane[,lane]>` هدفمند در گردش‌کار زنده/E2E قابل استفادهٔ مجدد استفاده کنید، وقتی
فقط یک مسیر Docker ناموفق شده است. آرتیفکت‌های انتشار در صورت موجود بودن،
دستورهای اجرای دوبارهٔ هر مسیر را همراه با ورودی‌های استفادهٔ دوباره از آرتیفکت بسته و تصویر شامل می‌شوند.

## پروفایل‌های انتشار

`release_profile` فقط گسترهٔ زنده/ارائه‌دهنده را داخل بررسی‌های انتشار کنترل می‌کند. این گزینه
CI کامل معمولی، پیش‌انتشار Plugin، دودآزمایی نصب، پذیرش بسته،
QA Lab، یا بخش‌های مسیر انتشار Docker را حذف نمی‌کند.

| پروفایل   | کاربرد موردنظر                      | پوشش زنده/ارائه‌دهندهٔ شامل‌شده                                                                                                                                               |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | سریع‌ترین دودآزمایی حیاتی برای انتشار.   | مسیر زندهٔ OpenAI/هسته، مدل‌های زندهٔ Docker برای OpenAI، هستهٔ Gateway بومی، پروفایل Gateway بومی OpenAI، Plugin بومی OpenAI، و Gateway زندهٔ Docker OpenAI.               |
| `stable`  | پروفایل پیش‌فرض تأیید انتشار. | `minimum` به‌علاوهٔ Anthropic، Google، MiniMax، backend، چارچوب آزمون زندهٔ بومی، backend زندهٔ CLI در Docker، اتصال ACP در Docker، چارچوب Codex در Docker، و یک قطعهٔ دودآزمایی OpenCode Go. |
| `full`    | پویش مشورتی گسترده.             | `stable` به‌علاوهٔ ارائه‌دهندگان مشورتی، قطعه‌های زندهٔ Plugin، و قطعه‌های زندهٔ رسانه.                                                                                                  |

## افزوده‌های فقط کامل

این مجموعه‌ها توسط `stable` رد می‌شوند و توسط `full` شامل می‌شوند:

| حوزه                             | پوشش فقط کامل                                                              |
| -------------------------------- | ------------------------------------------------------------------------------- |
| مدل‌های زندهٔ Docker               | OpenCode Go، OpenRouter، xAI، Z.ai، و Fireworks.                              |
| Gateway زندهٔ Docker              | قطعهٔ مشورتی برای DeepSeek، Fireworks، OpenCode Go، OpenRouter، xAI، و Z.ai. |
| پروفایل‌های ارائه‌دهندهٔ Gateway بومی | Fireworks، DeepSeek، قطعه‌های کامل مدل OpenCode Go، OpenRouter، xAI، و Z.ai.  |
| قطعه‌های زندهٔ Plugin بومی        | Plugins A-K، L-N، O-Z other، Moonshot، و xAI.                                 |
| قطعه‌های زندهٔ رسانهٔ بومی         | گروه‌های صوت، موسیقی Google، موسیقی MiniMax، و ویدئو A-D.                       |

`stable` شامل `native-live-src-gateway-profiles-opencode-go-smoke` است؛ `full`
به‌جای آن از قطعه‌های گسترده‌تر مدل OpenCode Go استفاده می‌کند.

## اجرای دوبارهٔ متمرکز

از `rerun_group` استفاده کنید تا جعبه‌های انتشار نامرتبط تکرار نشوند:

| شناسه              | محدوده                                             |
| ------------------- | ------------------------------------------------- |
| `all`               | همهٔ مرحله‌های اعتبارسنجی انتشار کامل.               |
| `ci`                | فقط فرزند CI کامل دستی.                        |
| `plugin-prerelease` | فقط فرزند پیش‌انتشار Plugin.                     |
| `release-checks`    | همهٔ مرحله‌های بررسی‌های انتشار OpenClaw.               |
| `install-smoke`     | دودآزمایی نصب از طریق بررسی‌های انتشار.             |
| `cross-os`          | بررسی‌های انتشار میان‌سیستم‌عاملی.                          |
| `live-e2e`          | اعتبارسنجی E2E مخزن/زنده و مسیر انتشار Docker. |
| `package`           | پذیرش بسته.                               |
| `qa`                | هم‌ارزی QA به‌علاوهٔ مسیرهای زندهٔ QA.                     |
| `qa-parity`         | فقط مسیرهای هم‌ارزی QA و گزارش.                  |
| `qa-live`           | فقط Matrix زندهٔ QA و Telegram.                 |
| `npm-telegram`      | فقط E2E اختیاری Telegram پس از انتشار.          |

وقتی یک مجموعهٔ زنده ناموفق شد، از `live_suite_filter` همراه با `rerun_group=live-e2e` استفاده کنید.
شناسه‌های معتبر فیلتر در گردش‌کار زنده/E2E قابل استفادهٔ مجدد تعریف شده‌اند، از جمله
`docker-live-models`، `live-gateway-docker`،
`live-gateway-anthropic-docker`، `live-gateway-google-docker`،
`live-gateway-minimax-docker`، `live-gateway-advisory-docker`،
`live-cli-backend-docker`، `live-acp-bind-docker`، و
`live-codex-harness-docker`.

## شواهدی که باید نگه دارید

خلاصهٔ `Full Release Validation` را به‌عنوان نمایهٔ سطح انتشار نگه دارید. این خلاصه به
شناسه‌های اجرای فرزند پیوند می‌دهد و جدول‌های کندترین کارها را شامل می‌شود. برای خرابی‌ها، ابتدا گردش‌کار
فرزند را بررسی کنید، سپس کوچک‌ترین شناسهٔ منطبق بالا را دوباره اجرا کنید.

آرتیفکت‌های مفید:

- `release-package-under-test` از `OpenClaw Release Checks`
- آرتیفکت‌های مسیر انتشار Docker زیر `.artifacts/docker-tests/`
- `package-under-test` پذیرش بسته و آرتیفکت‌های پذیرش Docker
- آرتیفکت‌های بررسی انتشار میان‌سیستم‌عاملی برای هر سیستم‌عامل و مجموعه
- آرتیفکت‌های هم‌ارزی QA، Matrix، و Telegram

## فایل‌های گردش‌کار

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
