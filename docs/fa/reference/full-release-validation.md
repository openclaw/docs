---
read_when:
    - اجرای اعتبارسنجی کامل انتشار یا اجرای دوبارهٔ آن
    - مقایسه پروفایل‌های اعتبارسنجی انتشار پایدار و کامل
    - اشکال‌زدایی از شکست‌های مرحلهٔ اعتبارسنجی انتشار
summary: مراحل اعتبارسنجی کامل انتشار، گردش‌کارهای فرزند، شناسه‌های اجرای مجدد، و شواهد
title: اعتبارسنجی کامل انتشار
x-i18n:
    generated_at: "2026-05-05T01:51:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cf696761f516fc7f8e9606a2a06fab61a644731330eb484a388f276767a9e0d
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` چتر انتشار است. این تنها نقطه ورود دستی برای اثبات پیش از انتشار است، اما بیشتر کارها در گردش‌کارهای فرزند انجام می‌شود تا یک محیط ناموفق بتواند بدون شروع دوباره کل انتشار، دوباره اجرا شود.

آن را از یک ارجاع گردش‌کار مورد اعتماد، معمولاً `main`، اجرا کنید و شاخه انتشار، برچسب، یا SHA کامل commit را به‌عنوان `ref` ارسال کنید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

گردش‌کارهای فرزند از ارجاع گردش‌کار مورد اعتماد برای چارچوب آزمون و از ورودی `ref` برای نامزد تحت آزمون استفاده می‌کنند. این کار باعث می‌شود هنگام اعتبارسنجی یک شاخه یا برچسب انتشار قدیمی‌تر، منطق اعتبارسنجی جدید در دسترس بماند.

به‌طور پیش‌فرض، `release_profile=stable` مسیرهای مسدودکننده انتشار را اجرا می‌کند و soak کامل زنده/Docker را رد می‌کند. برای گنجاندن مسیرهای soak در یک اجرای پایدار، `run_release_soak=true` را ارسال کنید. `release_profile=full` همیشه مسیرهای soak را فعال می‌کند تا نمایه مشورتی گسترده هرگز پوشش را بی‌صدا از دست ندهد.

Package Acceptance معمولاً tarball نامزد را از `ref` حل‌شده می‌سازد، از جمله اجراهای SHA کامل که با `pnpm ci:full-release` dispatch شده‌اند. پس از انتشار، `package_acceptance_package_spec=openclaw@YYYY.M.D` (یا `openclaw@beta`/`openclaw@latest`) را ارسال کنید تا همان ماتریس package/update به‌جای آن روی package منتشرشده npm اجرا شود.

## مرحله‌های سطح بالا

| مرحله                | جزئیات                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| حل هدف    | **کار:** `Resolve target ref`<br />**گردش‌کار فرزند:** هیچ‌کدام<br />**اثبات می‌کند:** شاخه انتشار، برچسب، یا SHA کامل commit را حل می‌کند و ورودی‌های انتخاب‌شده را ثبت می‌کند.<br />**اجرای دوباره:** اگر این مورد ناموفق شد، چتر را دوباره اجرا کنید.                                                                                                                                                                                                                               |
| Vitest و CI عادی | **کار:** `Run normal full CI`<br />**گردش‌کار فرزند:** `CI`<br />**اثبات می‌کند:** گراف CI کامل دستی را روی ارجاع هدف اجرا می‌کند، شامل مسیرهای Linux Node، shardهای Plugin همراه، قراردادهای کانال، سازگاری Node 22، `check`، `check-additional`، smoke ساخت، بررسی‌های مستندات، Python skills، Windows، macOS، i18n Control UI، و Android از طریق چتر.<br />**اجرای دوباره:** `rerun_group=ci`.                                                  |
| پیش‌انتشار Plugin    | **کار:** `Run plugin prerelease validation`<br />**گردش‌کار فرزند:** `Plugin Prerelease`<br />**اثبات می‌کند:** بررسی‌های ایستای فقط انتشار برای Plugin، پوشش Plugin عاملی، shardهای دسته کامل extension، و مسیرهای Docker پیش‌انتشار Plugin.<br />**اجرای دوباره:** `rerun_group=plugin-prerelease`.                                                                                                                                                        |
| بررسی‌های انتشار       | **کار:** `Run release/live/Docker/QA validation`<br />**گردش‌کار فرزند:** `OpenClaw Release Checks`<br />**اثبات می‌کند:** smoke نصب، بررسی‌های package میان‌سیستمی، Package Acceptance، هم‌ارزی QA Lab، Matrix زنده، و Telegram زنده. با `run_release_soak=true` یا `release_profile=full`، مجموعه‌های کامل زنده/E2E و قطعه‌های مسیر انتشار Docker را نیز اجرا می‌کند.<br />**اجرای دوباره:** `rerun_group=release-checks` یا یک handle محدودتر release-checks. |
| artifact مربوط به package     | **کار:** `Prepare release package artifact`<br />**گردش‌کار فرزند:** هیچ‌کدام<br />**اثبات می‌کند:** tarball والد `release-package-under-test` را آن‌قدر زود ایجاد می‌کند که بررسی‌های روبه‌package که نیاز ندارند منتظر `OpenClaw Release Checks` بمانند، بتوانند از آن استفاده کنند.<br />**اجرای دوباره:** چتر را دوباره اجرا کنید یا برای `rerun_group=npm-telegram` مقدار `npm_telegram_package_spec` را ارائه دهید.                                                                                    |
| Package Telegram     | **کار:** `Run package Telegram E2E`<br />**گردش‌کار فرزند:** `NPM Telegram Beta E2E`<br />**اثبات می‌کند:** اثبات package Telegram مبتنی بر artifact والد برای `rerun_group=all` با `release_profile=full`، یا اثبات Telegram برای package منتشرشده وقتی `npm_telegram_package_spec` تنظیم شده باشد.<br />**اجرای دوباره:** `rerun_group=npm-telegram` با `npm_telegram_package_spec`.                                                                               |
| تأییدکننده چتر    | **کار:** `Verify full validation`<br />**گردش‌کار فرزند:** هیچ‌کدام<br />**اثبات می‌کند:** نتیجه‌های ثبت‌شده اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین کارها را از گردش‌کارهای فرزند اضافه می‌کند.<br />**اجرای دوباره:** پس از اینکه یک فرزند ناموفق را دوباره اجرا کردید تا سبز شود، فقط همین کار را دوباره اجرا کنید.                                                                                                                                                                                    |

برای `ref=main` و `rerun_group=all`، یک چتر جدیدتر جایگزین چتر قدیمی‌تر می‌شود.
وقتی والد لغو می‌شود، پایشگر آن هر گردش‌کار فرزندی را که قبلاً dispatch کرده است لغو می‌کند. اجراهای اعتبارسنجی شاخه انتشار و برچسب به‌طور پیش‌فرض یکدیگر را لغو نمی‌کنند.

## مرحله‌های بررسی انتشار

`OpenClaw Release Checks` بزرگ‌ترین گردش‌کار فرزند است. هدف را یک‌بار حل می‌کند و هنگامی که مرحله‌های روبه‌package یا روبه‌Docker به آن نیاز دارند، یک artifact مشترک `release-package-under-test` آماده می‌کند.

| مرحله               | جزئیات                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| هدف انتشار      | **Job:** `Resolve target ref`<br />**گردش‌کار پشتیبان:** ندارد<br />**آزمون‌ها:** ref انتخاب‌شده، SHA مورد انتظار اختیاری، نمایه، گروه اجرای دوباره، و فیلتر متمرکز مجموعه live.<br />**اجرای دوباره:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                   |
| مصنوعه بسته    | **Job:** `Prepare release package artifact`<br />**گردش‌کار پشتیبان:** ندارد<br />**آزمون‌ها:** یک tarball نامزد را بسته‌بندی یا حل می‌کند و `release-package-under-test` را برای بررسی‌های پایین‌دستیِ مرتبط با بسته بارگذاری می‌کند.<br />**اجرای دوباره:** گروه بسته، cross-OS، یا live/E2E متأثر.                                                                                                                                                                                |
| smoke نصب       | **Job:** `Run install smoke`<br />**گردش‌کار پشتیبان:** `Install Smoke`<br />**آزمون‌ها:** مسیر کامل نصب با استفاده مجدد از تصویر smoke در Dockerfile ریشه، نصب بسته QR، smokeهای Docker ریشه و Gateway، آزمون‌های Docker نصب‌کننده، smoke نصب سراسری Bun برای image-provider، و E2E سریع نصب/حذف Pluginهای همراه.<br />**اجرای دوباره:** `rerun_group=install-smoke`.                                                                                                   |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**گردش‌کار پشتیبان:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**آزمون‌ها:** مسیرهای تازه و ارتقا روی Linux، Windows، و macOS برای provider و حالت انتخاب‌شده، با استفاده از tarball نامزد به‌همراه یک بسته مبنا.<br />**اجرای دوباره:** `rerun_group=cross-os`.                                                                                                                                                              |
| E2E مخزن و live   | **Job:** `Run repo/live E2E validation`<br />**گردش‌کار پشتیبان:** `OpenClaw Live And E2E Checks (Reusable)`<br />**آزمون‌ها:** E2E مخزن، کش live، استریم websocket OpenAI، provider live بومی و shardهای Plugin، و harnessهای live مبتنی بر Docker برای model/backend/gateway که با `release_profile` انتخاب می‌شوند.<br />**اجراها:** `run_release_soak=true`، `release_profile=full`، یا `rerun_group=live-e2e` متمرکز.<br />**اجرای دوباره:** `rerun_group=live-e2e`، به‌صورت اختیاری با `live_suite_filter`. |
| مسیر انتشار Docker | **Job:** `Run Docker release-path validation`<br />**گردش‌کار پشتیبان:** `OpenClaw Live And E2E Checks (Reusable)`<br />**آزمون‌ها:** chunkهای Docker مسیر انتشار در برابر مصنوعه بسته مشترک.<br />**اجراها:** `run_release_soak=true`، `release_profile=full`، یا `rerun_group=live-e2e` متمرکز.<br />**اجرای دوباره:** `rerun_group=live-e2e`.                                                                                                                                       |
| پذیرش بسته  | **Job:** `Run package acceptance`<br />**گردش‌کار پشتیبان:** `Package Acceptance`<br />**آزمون‌ها:** fixtureهای آفلاین بسته Plugin، به‌روزرسانی Plugin، پذیرش بسته Telegram با mock-OpenAI، و بررسی‌های دوام ارتقای منتشرشده در برابر همان tarball. بررسی‌های مسدودکننده انتشار از مبنای پیش‌فرض آخرین نسخه منتشرشده استفاده می‌کنند؛ بررسی‌های soak به همه انتشارهای پایدار npm در یا بعد از `2026.4.23` به‌همراه fixtureهای مسئله گزارش‌شده گسترش می‌یابند.<br />**اجرای دوباره:** `rerun_group=package`.                          |
| همسانی QA           | **Job:** `Run QA Lab parity lane` و `Run QA Lab parity report`<br />**گردش‌کار پشتیبان:** jobهای مستقیم<br />**آزمون‌ها:** بسته‌های همسانی agentic نامزد و مبنا، سپس گزارش همسانی.<br />**اجرای دوباره:** `rerun_group=qa-parity` یا `rerun_group=qa`.                                                                                                                                                                                                                         |
| Matrix live در QA      | **Job:** `Run QA Lab live Matrix lane`<br />**گردش‌کار پشتیبان:** job مستقیم<br />**آزمون‌ها:** نمایه سریع QA live در Matrix در محیط `qa-live-shared`.<br />**اجرای دوباره:** `rerun_group=qa-live` یا `rerun_group=qa`.                                                                                                                                                                                                                                                                |
| Telegram live در QA    | **Job:** `Run QA Lab live Telegram lane`<br />**گردش‌کار پشتیبان:** job مستقیم<br />**آزمون‌ها:** QA live در Telegram با leaseهای credential در Convex CI.<br />**اجرای دوباره:** `rerun_group=qa-live` یا `rerun_group=qa`.                                                                                                                                                                                                                                                          |
| تأییدکننده انتشار    | **Job:** `Verify release checks`<br />**گردش‌کار پشتیبان:** ندارد<br />**آزمون‌ها:** jobهای ضروری release-check برای گروه اجرای دوباره انتخاب‌شده.<br />**اجرای دوباره:** پس از گذر jobهای فرزند متمرکز دوباره اجرا کنید.                                                                                                                                                                                                                                                       |

## chunkهای مسیر انتشار Docker

مرحله مسیر انتشار Docker این chunkها را زمانی اجرا می‌کند که `live_suite_filter`
خالی باشد:

| Chunk                                                           | پوشش                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | مسیرهای smoke مسیر انتشار Core Docker.                                   |
| `package-update-openai`                                         | رفتار نصب و به‌روزرسانی بسته OpenAI.                             |
| `package-update-anthropic`                                      | رفتار نصب و به‌روزرسانی بسته Anthropic.                          |
| `package-update-core`                                           | رفتار بسته و به‌روزرسانی بی‌طرف نسبت به provider.                           |
| `plugins-runtime-plugins`                                       | مسیرهای runtime در Plugin که رفتار Plugin را اجرا می‌کنند.                     |
| `plugins-runtime-services`                                      | مسیرهای runtime در Plugin که با سرویس پشتیبانی می‌شوند؛ هنگام درخواست شامل OpenWebUI است. |
| `plugins-runtime-install-a` تا `plugins-runtime-install-h` | دسته‌های نصب/runtime در Plugin که برای اعتبارسنجی موازی انتشار تقسیم شده‌اند.   |

وقتی فقط یک مسیر Docker شکست خورده است، از `docker_lanes=<lane[,lane]>` هدفمند روی گردش‌کار live/E2E قابل استفاده مجدد استفاده کنید. مصنوعه‌های انتشار شامل فرمان‌های اجرای دوباره برای هر مسیر با ورودی‌های مصنوعه بسته و استفاده مجدد از تصویر هستند، هرگاه در دسترس باشند.

## نمایه‌های انتشار

`release_profile` عمدتاً گستره live/provider را درون بررسی‌های انتشار کنترل می‌کند.
این گزینه CI کامل عادی، Plugin Prerelease، smoke نصب، پذیرش بسته، یا QA Lab را حذف نمی‌کند. برای `stable`، E2E جامع مخزن/live و chunkهای مسیر انتشار Docker پوشش soak هستند و زمانی اجرا می‌شوند که `run_release_soak=true`.
`full` پوشش soak را اجباری می‌کند و همچنین باعث می‌شود اجرای umbrella، E2E بسته Telegram را در برابر مصنوعه بسته انتشار والد اجرا کند وقتی `rerun_group=all` باشد، بنابراین یک نامزد کامل پیش از انتشار آن مسیر بسته Telegram را بی‌صدا رد نمی‌کند.

| نمایه   | کاربرد مورد نظر                      | پوشش live/provider شامل‌شده                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | سریع‌ترین smoke حیاتی برای انتشار.   | مسیر live OpenAI/core، مدل‌های live در Docker برای OpenAI، core بومی Gateway، نمایه بومی Gateway برای OpenAI، Plugin بومی OpenAI، و Gateway live در Docker برای OpenAI.                     |
| `stable`  | نمایه پیش‌فرض تأیید انتشار. | `minimum` به‌علاوه smoke Anthropic، Google، MiniMax، backend، harness آزمون live بومی، backend زنده CLI در Docker، bind مربوط به Docker ACP، harness مربوط به Docker Codex، و یک shard smoke برای OpenCode Go. |
| `full`    | پیمایش مشاوره‌ای گسترده.             | `stable` به‌علاوه providerهای مشاوره‌ای، shardهای live در Plugin، و shardهای live رسانه.                                                                                                        |

## افزوده‌های فقط full

این مجموعه‌ها توسط `stable` رد می‌شوند و توسط `full` شامل می‌شوند:

| حوزه                             | پوشش فقط full                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| مدل‌های live در Docker               | OpenCode Go، OpenRouter، xAI، Z.ai، و Fireworks.                                                                          |
| Gateway live در Docker              | providerهای مشاوره‌ای که به shardهای DeepSeek/Fireworks، OpenCode Go/OpenRouter، و xAI/Z.ai تقسیم شده‌اند.                              |
| نمایه‌های provider بومی Gateway | shardهای کامل Anthropic Opus و Sonnet/Haiku، Fireworks، DeepSeek، shardهای کامل مدل OpenCode Go، OpenRouter، xAI، و Z.ai. |
| shardهای live بومی Plugin        | Plugins A-K، L-N، O-Z other، Moonshot، و xAI.                                                                             |
| shardهای live بومی رسانه         | گروه‌های صوت، موسیقی Google، موسیقی MiniMax، و ویدئو A-D.                                                                   |

`stable` شامل `native-live-src-gateway-profiles-anthropic-smoke` و
`native-live-src-gateway-profiles-opencode-go-smoke` است؛ `full` به‌جای آن از shardهای گسترده‌تر
مدل Anthropic و OpenCode Go استفاده می‌کند. اجراهای دوباره متمرکز همچنان می‌توانند از handleهای تجمیعی
`native-live-src-gateway-profiles-anthropic` یا
`native-live-src-gateway-profiles-opencode-go` استفاده کنند.

## اجراهای دوباره متمرکز

برای جلوگیری از تکرار boxهای انتشار نامرتبط از `rerun_group` استفاده کنید:

| شناسه              | دامنه                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | همهٔ مراحل اعتبارسنجی کامل انتشار.                                   |
| `ci`                | فقط فرزند CI کامل دستی.                                            |
| `plugin-prerelease` | فقط فرزند پیش‌انتشار Plugin.                                         |
| `release-checks`    | همهٔ مراحل بررسی‌های انتشار OpenClaw.                                   |
| `install-smoke`     | Install Smoke از طریق بررسی‌های انتشار.                                 |
| `cross-os`          | بررسی‌های انتشار میان‌سیستم‌عاملی.                                              |
| `live-e2e`          | اعتبارسنجی E2E زنده/مخزن و مسیر انتشار Docker.                     |
| `package`           | پذیرش بسته.                                                   |
| `qa`                | برابری QA به‌علاوه مسیرهای زنده QA.                                         |
| `qa-parity`         | فقط مسیرهای برابری QA و گزارش.                                      |
| `qa-live`           | فقط ماتریس زنده QA و Telegram.                                     |
| `npm-telegram`      | E2E بستهٔ منتشرشدهٔ Telegram؛ به `npm_telegram_package_spec` نیاز دارد. |

وقتی یک مجموعهٔ زنده شکست خورد، از `live_suite_filter` همراه با `rerun_group=live-e2e` استفاده کنید.
شناسه‌های معتبر فیلتر در گردش‌کار قابل‌استفادهٔ مجدد زنده/E2E تعریف شده‌اند، از جمله
`docker-live-models`، `live-gateway-docker`،
`live-gateway-anthropic-docker`، `live-gateway-google-docker`،
`live-gateway-minimax-docker`، `live-gateway-advisory-docker`،
`live-cli-backend-docker`، `live-acp-bind-docker`، و
`live-codex-harness-docker`.

شناسهٔ `live-gateway-advisory-docker` یک شناسهٔ اجرای دوبارهٔ تجمیعی برای سه شارد ارائه‌دهندهٔ آن است، بنابراین همچنان به همهٔ کارهای Gateway مشورتی Docker منشعب می‌شود.

وقتی یک مسیر میان‌سیستم‌عاملی شکست خورد، از `cross_os_suite_filter` همراه با `rerun_group=cross-os` استفاده کنید. این فیلتر یک شناسهٔ سیستم‌عامل، یک شناسهٔ مجموعه، یا یک جفت سیستم‌عامل/مجموعه را می‌پذیرد، برای مثال `windows/packaged-upgrade`، `windows`، یا `packaged-fresh`. خلاصه‌های میان‌سیستم‌عاملی زمان‌بندی‌های هر فاز را برای مسیرهای ارتقای بسته‌بندی‌شده شامل می‌شوند، و فرمان‌های طولانی‌مدت خطوط Heartbeat چاپ می‌کنند تا به‌روزرسانی گیرکردهٔ Windows پیش از پایان مهلت کار قابل مشاهده باشد.

مسیرهای بررسی انتشار QA مشورتی هستند. شکست فقط-QA به‌صورت هشدار گزارش می‌شود و راستی‌آزمای بررسی انتشار را مسدود نمی‌کند؛ وقتی به شواهد تازهٔ QA نیاز دارید، `rerun_group=qa`،
`qa-parity`، یا `qa-live` را دوباره اجرا کنید.

## شواهدی که باید نگه دارید

خلاصهٔ `Full Release Validation` را به‌عنوان نمایهٔ سطح انتشار نگه دارید. این خلاصه به شناسه‌های اجرای فرزند پیوند می‌دهد و جدول‌های کندترین کارها را شامل می‌شود. برای شکست‌ها، ابتدا گردش‌کار فرزند را بررسی کنید، سپس کوچک‌ترین شناسهٔ منطبق بالا را دوباره اجرا کنید.

آرتیفکت‌های مفید:

- `release-package-under-test` از والد اعتبارسنجی کامل انتشار و `OpenClaw Release Checks`
- آرتیفکت‌های مسیر انتشار Docker زیر `.artifacts/docker-tests/`
- `package-under-test` پذیرش بسته و آرتیفکت‌های پذیرش Docker
- آرتیفکت‌های بررسی انتشار میان‌سیستم‌عاملی برای هر سیستم‌عامل و مجموعه
- آرتیفکت‌های برابری QA، Matrix، و Telegram

## فایل‌های گردش‌کار

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
