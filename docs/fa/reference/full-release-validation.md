---
read_when:
    - اجرای اعتبارسنجی کامل انتشار یا اجرای مجدد آن
    - مقایسهٔ پروفایل‌های اعتبارسنجی انتشار پایدار و کامل
    - اشکال‌زدایی از شکست‌های مرحلهٔ اعتبارسنجی انتشار
summary: مراحل اعتبارسنجی کامل انتشار، گردش‌کارهای فرزند، پروفایل‌های انتشار، شناسه‌های اجرای مجدد، و شواهد
title: اعتبارسنجی کامل انتشار
x-i18n:
    generated_at: "2026-05-02T12:01:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: feb4edec850fb97405575c869547b4851bc773507321690670553e6faafc8b0b
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` چتر انتشار است. این تنها نقطه ورود دستی
برای اثبات پیش از انتشار است، اما بیشتر کارها در گردش‌کارهای فرزند انجام می‌شود تا یک
باکس ناموفق بدون شروع دوباره کل انتشار قابل اجرای مجدد باشد.

آن را از یک ref گردش‌کار مورد اعتماد، معمولا `main`، اجرا کنید و شاخه انتشار،
برچسب، یا SHA کامل کامیت را به‌عنوان `ref` بدهید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

گردش‌کارهای فرزند از ref گردش‌کار مورد اعتماد برای هارنس و از ورودی
`ref` برای نامزد تحت آزمون استفاده می‌کنند. این کار منطق اعتبارسنجی جدید را
هنگام اعتبارسنجی یک شاخه یا برچسب انتشار قدیمی‌تر در دسترس نگه می‌دارد.

## مراحل سطح بالا

| مرحله                | جزئیات                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| رفع هدف    | **کار:** `Resolve target ref`<br />**گردش‌کار فرزند:** ندارد<br />**اثبات می‌کند:** شاخه انتشار، برچسب، یا SHA کامل کامیت را resolve می‌کند و ورودی‌های انتخاب‌شده را ثبت می‌کند.<br />**اجرای مجدد:** اگر این مورد شکست خورد، چتر را دوباره اجرا کنید.                                                                                                                                                                              |
| Vitest و CI عادی | **کار:** `Run normal full CI`<br />**گردش‌کار فرزند:** `CI`<br />**اثبات می‌کند:** گراف CI کامل دستی در برابر ref هدف، شامل مسیرهای Linux Node، شاردهای Plugin همراه، قراردادهای کانال، سازگاری Node 22، `check`، `check-additional`، اسموک ساخت، بررسی‌های مستندات، Python skills، Windows، macOS، i18n رابط کاربری Control، و Android از طریق چتر.<br />**اجرای مجدد:** `rerun_group=ci`. |
| پیش‌انتشار Plugin    | **کار:** `Run plugin prerelease validation`<br />**گردش‌کار فرزند:** `Plugin Prerelease`<br />**اثبات می‌کند:** بررسی‌های ایستای فقط انتشار برای Plugin، پوشش Plugin عاملی، شاردهای دسته کامل افزونه، و مسیرهای Docker پیش‌انتشار Plugin.<br />**اجرای مجدد:** `rerun_group=plugin-prerelease`.                                                                                                       |
| بررسی‌های انتشار       | **کار:** `Run release/live/Docker/QA validation`<br />**گردش‌کار فرزند:** `OpenClaw Release Checks`<br />**اثبات می‌کند:** اسموک نصب، بررسی‌های بسته میان‌سیستم‌عاملی، مجموعه‌های live/E2E، قطعه‌های مسیر انتشار Docker، Package Acceptance، برابری QA Lab، Matrix زنده، و Telegram زنده.<br />**اجرای مجدد:** `rerun_group=release-checks` یا یک هندل محدودتر release-checks.                                |
| بسته Telegram     | **کار:** `Run package Telegram E2E`<br />**گردش‌کار فرزند:** `NPM Telegram Beta E2E`<br />**اثبات می‌کند:** اثبات بسته Telegram مبتنی بر artifact برای `rerun_group=all` با `release_profile=full`، یا اثبات Telegram بسته منتشرشده وقتی `npm_telegram_package_spec` تنظیم شده باشد.<br />**اجرای مجدد:** `rerun_group=npm-telegram` با `npm_telegram_package_spec`.                                     |
| تاییدکننده چتر    | **کار:** `Verify full validation`<br />**گردش‌کار فرزند:** ندارد<br />**اثبات می‌کند:** نتیجه‌های ثبت‌شده اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین کارها را از گردش‌کارهای فرزند اضافه می‌کند.<br />**اجرای مجدد:** پس از سبز کردن یک فرزند ناموفق با اجرای مجدد، فقط این کار را دوباره اجرا کنید.                                                                                                                                   |

برای `ref=main` و `rerun_group=all`، یک چتر جدیدتر جایگزین چتر قدیمی‌تر می‌شود.
وقتی والد لغو می‌شود، مانیتور آن هر گردش‌کار فرزندی را که قبلا dispatch کرده
لغو می‌کند. اجرای اعتبارسنجی شاخه انتشار و برچسب به‌صورت پیش‌فرض یکدیگر را
لغو نمی‌کنند.

## مراحل بررسی‌های انتشار

`OpenClaw Release Checks` بزرگ‌ترین گردش‌کار فرزند است. هدف را یک بار resolve
می‌کند و وقتی مراحل روبه‌روی بسته یا Docker به آن نیاز داشته باشند، یک artifact
مشترک `release-package-under-test` آماده می‌کند.

| مرحله               | جزئیات                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| هدف انتشار      | **کار:** `Resolve target ref`<br />**گردش‌کار پشتیبان:** ندارد<br />**آزمون‌ها:** ref انتخاب‌شده، SHA مورد انتظار اختیاری، پروفایل، گروه اجرای مجدد، و فیلتر متمرکز مجموعه زنده.<br />**اجرای مجدد:** `rerun_group=release-checks`.                                                                                                                                                                           |
| artifact بسته    | **کار:** `Prepare release package artifact`<br />**گردش‌کار پشتیبان:** ندارد<br />**آزمون‌ها:** یک tarball نامزد را بسته‌بندی یا resolve می‌کند و `release-package-under-test` را برای بررسی‌های پایین‌دستی روبه‌روی بسته upload می‌کند.<br />**اجرای مجدد:** گروه بسته، میان‌سیستم‌عاملی، یا live/E2E متاثر.                                                                                                           |
| اسموک نصب       | **کار:** `Run install smoke`<br />**گردش‌کار پشتیبان:** `Install Smoke`<br />**آزمون‌ها:** مسیر نصب کامل با استفاده مجدد از تصویر اسموک Dockerfile ریشه، نصب بسته QR، اسموک‌های Docker ریشه و Gateway، آزمون‌های Docker نصاب، اسموک provider تصویر نصب global Bun، و E2E سریع نصب/حذف نصب Plugin همراه.<br />**اجرای مجدد:** `rerun_group=install-smoke`.                              |
| میان‌سیستم‌عاملی            | **کار:** `cross_os_release_checks`<br />**گردش‌کار پشتیبان:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**آزمون‌ها:** مسیرهای تازه و ارتقا روی Linux، Windows، و macOS برای provider و حالت انتخاب‌شده، با استفاده از tarball نامزد به‌علاوه یک بسته baseline.<br />**اجرای مجدد:** `rerun_group=cross-os`.                                                                               |
| E2E مخزن و زنده   | **کار:** `Run repo/live E2E validation`<br />**گردش‌کار پشتیبان:** `OpenClaw Live And E2E Checks (Reusable)`<br />**آزمون‌ها:** E2E مخزن، کش زنده، استریم websocket OpenAI، شاردهای provider زنده بومی و Plugin، و هارنس‌های model/backend/gateway زنده مبتنی بر Docker که توسط `release_profile` انتخاب می‌شوند.<br />**اجرای مجدد:** `rerun_group=live-e2e`، به‌صورت اختیاری با `live_suite_filter`. |
| مسیر انتشار Docker | **کار:** `Run Docker release-path validation`<br />**گردش‌کار پشتیبان:** `OpenClaw Live And E2E Checks (Reusable)`<br />**آزمون‌ها:** قطعه‌های Docker مسیر انتشار در برابر artifact بسته مشترک.<br />**اجرای مجدد:** `rerun_group=live-e2e`.                                                                                                                                                      |
| پذیرش بسته  | **کار:** `Run package acceptance`<br />**گردش‌کار پشتیبان:** `Package Acceptance`<br />**آزمون‌ها:** fixtureهای آفلاین بسته Plugin، به‌روزرسانی Plugin، و پذیرش بسته Telegram با mock-OpenAI در برابر همان tarball.<br />**اجرای مجدد:** `rerun_group=package`.                                                                                                                                  |
| برابری QA           | **کار:** `Run QA Lab parity lane` و `Run QA Lab parity report`<br />**گردش‌کار پشتیبان:** کارهای مستقیم<br />**آزمون‌ها:** بسته‌های برابری عاملی نامزد و baseline، سپس گزارش برابری.<br />**اجرای مجدد:** `rerun_group=qa-parity` یا `rerun_group=qa`.                                                                                                                                       |
| Matrix زنده QA      | **کار:** `Run QA Lab live Matrix lane`<br />**گردش‌کار پشتیبان:** کار مستقیم<br />**آزمون‌ها:** پروفایل سریع QA زنده Matrix در محیط `qa-live-shared`.<br />**اجرای مجدد:** `rerun_group=qa-live` یا `rerun_group=qa`.                                                                                                                                                                        |
| Telegram زنده QA    | **کار:** `Run QA Lab live Telegram lane`<br />**گردش‌کار پشتیبان:** کار مستقیم<br />**آزمون‌ها:** QA زنده Telegram با leaseهای credential مربوط به Convex CI.<br />**اجرای مجدد:** `rerun_group=qa-live` یا `rerun_group=qa`.                                                                                                                                                                                    |
| تاییدکننده انتشار    | **کار:** `Verify release checks`<br />**گردش‌کار پشتیبان:** ندارد<br />**آزمون‌ها:** کارهای ضروری release-check برای گروه اجرای مجدد انتخاب‌شده.<br />**اجرای مجدد:** پس از عبور کارهای فرزند متمرکز، دوباره اجرا کنید.                                                                                                                                                                                                 |

## قطعه‌های مسیر انتشار Docker

مرحله مسیر انتشار Docker وقتی `live_suite_filter` خالی باشد این قطعه‌ها را
اجرا می‌کند:

| قطعه                                                           | پوشش                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | مسیرهای اسموک مسیر انتشار Core Docker.                                   |
| `package-update-openai`                                         | رفتار نصب و به‌روزرسانی بسته OpenAI.                             |
| `package-update-anthropic`                                      | رفتار نصب و به‌روزرسانی بسته Anthropic.                          |
| `package-update-core`                                           | رفتار بسته و به‌روزرسانی مستقل از provider.                           |
| `plugins-runtime-plugins`                                       | مسیرهای runtime Plugin که رفتار Plugin را exercise می‌کنند.                     |
| `plugins-runtime-services`                                      | مسیرهای runtime Plugin مبتنی بر سرویس؛ هنگام درخواست شامل OpenWebUI است. |
| `plugins-runtime-install-a` تا `plugins-runtime-install-h` | دسته‌های نصب/runtime Plugin که برای اعتبارسنجی موازی انتشار تقسیم شده‌اند.   |

وقتی فقط یک مسیر Docker شکست خورده باشد، از `docker_lanes=<lane[,lane]>` هدفمند
روی گردش‌کار قابل استفاده مجدد live/E2E استفاده کنید. artifactهای انتشار شامل
دستورهای اجرای مجدد برای هر مسیر، با artifact بسته و ورودی‌های استفاده مجدد از
تصویر در صورت دسترس بودن هستند.

## پروفایل‌های انتشار

`release_profile` عمدتا گستره live/provider را داخل بررسی‌های انتشار کنترل می‌کند.
این گزینه CI کامل عادی، Plugin Prerelease، اسموک نصب، پذیرش بسته، QA Lab، یا
قطعه‌های مسیر انتشار Docker را حذف نمی‌کند. `full` همچنین باعث می‌شود چتر،
وقتی `rerun_group=all` باشد، E2E بسته Telegram را در برابر artifact بسته انتشار
اجرا کند، تا یک نامزد کامل پیش از انتشار به‌صورت بی‌صدا آن مسیر بسته Telegram را
رد نکند.

| پروفایل   | کاربرد مورد نظر                      | پوشش زنده/ارائه‌دهنده شامل‌شده                                                                                                                                               |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | سریع‌ترین smoke حیاتی برای انتشار.   | مسیر زنده OpenAI/هسته، مدل‌های زنده Docker برای OpenAI، هسته Gateway بومی، پروفایل Gateway بومی OpenAI، Plugin بومی OpenAI، و Gateway زنده Docker برای OpenAI.               |
| `stable`  | پروفایل پیش‌فرض تأیید انتشار. | `minimum` به‌علاوه Anthropic، Google، MiniMax، backend، چارچوب آزمون زنده بومی، backend زنده CLI در Docker، اتصال ACP در Docker، چارچوب Codex در Docker، و یک shard smoke برای OpenCode Go. |
| `full`    | پیمایش مشورتی گسترده.             | `stable` به‌علاوه ارائه‌دهندگان مشورتی، shardهای زنده Plugin، و shardهای زنده رسانه.                                                                                                  |

## افزوده‌های فقط full

این مجموعه‌ها توسط `stable` رد می‌شوند و توسط `full` شامل می‌شوند:

| حوزه                             | پوشش فقط full                                                              |
| -------------------------------- | ------------------------------------------------------------------------------- |
| مدل‌های زنده Docker               | OpenCode Go، OpenRouter، xAI، Z.ai، و Fireworks.                              |
| Gateway زنده Docker              | shard مشورتی برای DeepSeek، Fireworks، OpenCode Go، OpenRouter، xAI، و Z.ai. |
| پروفایل‌های ارائه‌دهنده Gateway بومی | Fireworks، DeepSeek، shardهای کامل مدل OpenCode Go، OpenRouter، xAI، و Z.ai.  |
| shardهای زنده Plugin بومی        | Plugins A-K، L-N، O-Z سایر، Moonshot، و xAI.                                 |
| shardهای زنده رسانه بومی         | Audio، Google music، MiniMax music، و گروه‌های ویدئو A-D.                       |

`stable` شامل `native-live-src-gateway-profiles-opencode-go-smoke` است؛ `full`
در عوض از shardهای گسترده‌تر مدل OpenCode Go استفاده می‌کند.

## اجرای دوباره متمرکز

از `rerun_group` برای جلوگیری از تکرار جعبه‌های انتشار نامرتبط استفاده کنید:

| شناسه              | محدوده                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | همه مراحل Full Release Validation.                                   |
| `ci`                | فقط فرزند CI کامل دستی.                                            |
| `plugin-prerelease` | فقط فرزند پیش‌انتشار Plugin.                                         |
| `release-checks`    | همه مراحل OpenClaw Release Checks.                                   |
| `install-smoke`     | Install Smoke تا بررسی‌های انتشار.                                 |
| `cross-os`          | بررسی‌های انتشار Cross-OS.                                              |
| `live-e2e`          | اعتبارسنجی E2E مخزن/زنده و مسیر انتشار Docker.                     |
| `package`           | Package Acceptance.                                                   |
| `qa`                | همترازی QA به‌علاوه مسیرهای زنده QA.                                         |
| `qa-parity`         | فقط مسیرهای همترازی QA و گزارش.                                      |
| `qa-live`           | فقط ماتریس زنده QA و Telegram.                                     |
| `npm-telegram`      | E2E مربوط به Telegram در بسته منتشرشده؛ به `npm_telegram_package_spec` نیاز دارد. |

وقتی یک مجموعه زنده شکست خورد، از `live_suite_filter` همراه با `rerun_group=live-e2e` استفاده کنید.
شناسه‌های معتبر فیلتر در گردش‌کار قابل‌استفاده‌مجدد زنده/E2E تعریف شده‌اند، از جمله
`docker-live-models`، `live-gateway-docker`،
`live-gateway-anthropic-docker`، `live-gateway-google-docker`،
`live-gateway-minimax-docker`، `live-gateway-advisory-docker`،
`live-cli-backend-docker`، `live-acp-bind-docker`، و
`live-codex-harness-docker`.

## شواهدی که باید نگه دارید

خلاصه `Full Release Validation` را به‌عنوان نمایه سطح انتشار نگه دارید. این خلاصه به
شناسه‌های اجرای فرزند پیوند می‌دهد و شامل جدول‌های کندترین job است. برای شکست‌ها، ابتدا گردش‌کار
فرزند را بررسی کنید، سپس کوچک‌ترین شناسه مطابق بالا را دوباره اجرا کنید.

مصنوعات مفید:

- `release-package-under-test` از `OpenClaw Release Checks`
- مصنوعات مسیر انتشار Docker زیر `.artifacts/docker-tests/`
- `package-under-test` مربوط به Package Acceptance و مصنوعات پذیرش Docker
- مصنوعات بررسی انتشار Cross-OS برای هر سیستم‌عامل و مجموعه
- مصنوعات همترازی QA، Matrix، و Telegram

## فایل‌های گردش‌کار

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
