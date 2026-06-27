---
read_when:
    - اجرای یا اجرای مجدد اعتبارسنجی کامل انتشار
    - مقایسه پروفایل‌های اعتبارسنجی انتشار پایدار و کامل
    - اشکال‌زدایی شکست‌های مرحله اعتبارسنجی انتشار
summary: مراحل اعتبارسنجی انتشار کامل، جریان‌های کاری فرزند، پروفایل‌های انتشار، دستگیره‌های اجرای دوباره، و شواهد
title: اعتبارسنجی کامل انتشار
x-i18n:
    generated_at: "2026-06-27T18:47:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 791930254e3cac7da101d809cfc9b56773225159574d3727189f67cf85bd3fce
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` چتر انتشار است. این نقطهٔ ورود دستی واحد برای اثبات پیش از انتشار است، اما بیشتر کار در گردش‌کارهای فرزند انجام می‌شود تا بتوان یک محیط ناموفق را بدون شروع دوبارهٔ کل انتشار، دوباره اجرا کرد.

آن را از یک مرجع گردش‌کار مورد اعتماد، معمولاً `main`، اجرا کنید و شاخهٔ انتشار، برچسب، یا SHA کامل commit را به‌عنوان `ref` پاس دهید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

گردش‌کارهای فرزند از مرجع گردش‌کار مورد اعتماد برای harness و از ورودی `ref` برای نامزد تحت آزمون استفاده می‌کنند. این باعث می‌شود منطق اعتبارسنجی جدید هنگام اعتبارسنجی یک شاخه یا برچسب انتشار قدیمی‌تر هم در دسترس باشد.

`release_profile=stable` و `release_profile=full` همیشه soak کامل live/Docker را اجرا می‌کنند. برای گنجاندن همان مسیرهای soak با پروفایل بتا، `run_release_soak=true` را پاس دهید. انتشار پایدار، مانیفست اعتبارسنجی بدون این soak و شواهد مسدودکنندهٔ کارایی محصول را رد می‌کند.

Package Acceptance معمولاً tarball نامزد را از `ref` حل‌شده می‌سازد، از جمله اجراهای full-SHA که با `pnpm ci:full-release` dispatch شده‌اند. پس از انتشار بتا، `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` را پاس دهید تا بستهٔ npm منتشرشده در بررسی‌های انتشار، Package Acceptance، cross-OS، Docker مسیر انتشار، و package Telegram دوباره استفاده شود. فقط زمانی از `package_acceptance_package_spec` استفاده کنید که Package Acceptance باید عمداً بسته‌ای متفاوت را اثبات کند. مسیر بستهٔ live مربوط به Codex plugin همان وضعیت را دنبال می‌کند: مقدارهای منتشرشدهٔ `release_package_spec` مقدار `codex_plugin_spec=npm:@openclaw/codex@<version>` را مشتق می‌کنند؛ اجراهای SHA/artifact، `extensions/codex` را از ref انتخاب‌شده pack می‌کنند؛ و اپراتورها می‌توانند `codex_plugin_spec` را مستقیماً برای منابع Plugin از نوع `npm:`، `npm-pack:`، یا `git:` تنظیم کنند. این مسیر، تأیید نصب صریح Codex CLI مورد نیاز آن Plugin را اعطا می‌کند، سپس preflight مربوط به Codex CLI و turnهای عامل OpenAI در همان نشست را اجرا می‌کند.

## مرحله‌های سطح بالا

| مرحله | جزئیات |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| حل هدف | **Job:** `Resolve target ref`<br />**گردش‌کار فرزند:** هیچ‌کدام<br />**اثبات می‌کند:** شاخهٔ انتشار، برچسب، یا SHA کامل commit را حل می‌کند و ورودی‌های انتخاب‌شده را ثبت می‌کند.<br />**اجرای دوباره:** اگر این مرحله ناموفق شد، umbrella را دوباره اجرا کنید. |
| Vitest و CI عادی | **Job:** `Run normal full CI`<br />**گردش‌کار فرزند:** `CI`<br />**اثبات می‌کند:** گراف کامل CI دستی در برابر ref هدف، شامل مسیرهای Linux Node، shardهای Plugin بسته‌بندی‌شده، shardهای قرارداد Plugin و channel، سازگاری Node 22، `check-*`، `check-additional-*`، بررسی‌های smoke آرتیفکت ساخته‌شده، بررسی‌های مستندات، Skills پایتون، Windows، macOS، i18n مربوط به Control UI، و Android از طریق umbrella.<br />**اجرای دوباره:** `rerun_group=ci`. |
| پیش‌انتشار Plugin | **Job:** `Run plugin prerelease validation`<br />**گردش‌کار فرزند:** `Plugin Prerelease`<br />**اثبات می‌کند:** بررسی‌های ایستای فقط مخصوص انتشار برای Plugin، پوشش agentic Plugin، shardهای کامل دستهٔ extension، مسیرهای Docker پیش‌انتشار Plugin، و یک آرتیفکت غیرمسدودکنندهٔ `plugin-inspector-advisory` برای triage سازگاری.<br />**اجرای دوباره:** `rerun_group=plugin-prerelease`. |
| بررسی‌های انتشار | **Job:** `Run release/live/Docker/QA validation`<br />**گردش‌کار فرزند:** `OpenClaw Release Checks`<br />**اثبات می‌کند:** smoke نصب، بررسی‌های بستهٔ cross-OS، Package Acceptance، برابری QA Lab، Matrix live، و Telegram live. پروفایل‌های پایدار و کامل همچنین مجموعه‌های کامل live/E2E و chunkهای Docker مسیر انتشار را اجرا می‌کنند؛ بتا می‌تواند با `run_release_soak=true` وارد شود.<br />**اجرای دوباره:** `rerun_group=release-checks` یا یک handle محدودتر برای release-checks. |
| Package Telegram | **Job:** `Run package Telegram E2E`<br />**گردش‌کار فرزند:** `NPM Telegram Beta E2E`<br />**اثبات می‌کند:** یک Telegram E2E متمرکز برای بستهٔ منتشرشده، زمانی که `release_package_spec` یا `npm_telegram_package_spec` تنظیم شده باشد. اعتبارسنجی کامل نامزد به‌جای آن از Package Acceptance Telegram E2E رسمی استفاده می‌کند.<br />**اجرای دوباره:** `rerun_group=npm-telegram` همراه با `release_package_spec` یا `npm_telegram_package_spec`. |
| تأییدکنندهٔ umbrella | **Job:** `Verify full validation`<br />**گردش‌کار فرزند:** هیچ‌کدام<br />**اثبات می‌کند:** نتیجه‌های ثبت‌شدهٔ اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین job را از گردش‌کارهای فرزند اضافه می‌کند.<br />**اجرای دوباره:** پس از اجرای دوبارهٔ یک فرزند ناموفق تا سبز شدن، فقط همین job را دوباره اجرا کنید. |

برای `ref=main` و `rerun_group=all`، یک umbrella جدیدتر جایگزین یک umbrella قدیمی‌تر می‌شود. وقتی والد لغو می‌شود، مانیتور آن هر گردش‌کار فرزندی را که قبلاً dispatch کرده است لغو می‌کند. اجراهای اعتبارسنجی شاخهٔ انتشار و برچسب به‌طور پیش‌فرض یکدیگر را لغو نمی‌کنند.

## مرحله‌های بررسی انتشار

`OpenClaw Release Checks` بزرگ‌ترین گردش‌کار فرزند است. هدف را یک‌بار حل می‌کند و وقتی مرحله‌های مرتبط با بسته یا Docker به آن نیاز داشته باشند، یک آرتیفکت مشترک `release-package-under-test` آماده می‌کند.

| مرحله               | جزئیات                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| هدف انتشار      | **وظیفه:** `Resolve target ref`<br />**گردش‌کار پشتیبان:** هیچ‌کدام<br />**آزمون‌ها:** ref انتخاب‌شده، SHA مورد انتظار اختیاری، پروفایل، گروه اجرای دوباره، و فیلتر مجموعه زنده متمرکز.<br />**اجرای دوباره:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                              |
| آرتیفکت بسته    | **وظیفه:** `Prepare release package artifact`<br />**گردش‌کار پشتیبان:** هیچ‌کدام<br />**آزمون‌ها:** یک tarball نامزد را بسته‌بندی یا حل می‌کند و `release-package-under-test` را برای بررسی‌های پایین‌دستیِ روبه‌روی بسته بارگذاری می‌کند.<br />**اجرای دوباره:** گروه بسته، بین‌سیستم‌عاملی، یا زنده/E2E متأثر.                                                                                                                                                                                                              |
| دودآزمون نصب       | **وظیفه:** `Run install smoke`<br />**گردش‌کار پشتیبان:** `Install Smoke`<br />**آزمون‌ها:** مسیر نصب کامل با استفاده دوباره از تصویر دودآزمون Dockerfile ریشه، نصب بسته QR، دودآزمون‌های Docker ریشه و Gateway، آزمون‌های Docker نصب‌کننده، دودآزمون فراهم‌کننده تصویر با نصب سراسری Bun، و E2E سریع نصب/حذف نصب Plugin همراه.<br />**اجرای دوباره:** `rerun_group=install-smoke`.                                                                                                                                 |
| بین‌سیستم‌عاملی            | **وظیفه:** `cross_os_release_checks`<br />**گردش‌کار پشتیبان:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**آزمون‌ها:** مسیرهای تازه و ارتقا روی Linux، Windows و macOS برای فراهم‌کننده و حالت انتخاب‌شده، با استفاده از tarball نامزد به‌همراه یک بسته مبنا.<br />**اجرای دوباره:** `rerun_group=cross-os`.                                                                                                                                                                                  |
| E2E مخزن و زنده   | **وظیفه:** `Run repo/live E2E validation`<br />**گردش‌کار پشتیبان:** `OpenClaw Live And E2E Checks (Reusable)`<br />**آزمون‌ها:** E2E مخزن، کش زنده، جریان‌سازی websocket OpenAI، شاردهای فراهم‌کننده زنده بومی و Plugin، و هارنس‌های مدل/backend/Gateway زنده مبتنی بر Docker که با `release_profile` انتخاب می‌شوند.<br />**اجراها:** `run_release_soak=true`، `release_profile=full`، یا `rerun_group=live-e2e` متمرکز.<br />**اجرای دوباره:** `rerun_group=live-e2e`، به‌صورت اختیاری با `live_suite_filter`. |
| مسیر انتشار Docker | **وظیفه:** `Run Docker release-path validation`<br />**گردش‌کار پشتیبان:** `OpenClaw Live And E2E Checks (Reusable)`<br />**آزمون‌ها:** قطعه‌های Docker مسیر انتشار در برابر آرتیفکت بسته مشترک.<br />**اجراها:** `run_release_soak=true`، `release_profile=full`، یا `rerun_group=live-e2e` متمرکز.<br />**اجرای دوباره:** `rerun_group=live-e2e`.                                                                                                                                                      |
| پذیرش بسته  | **وظیفه:** `Run package acceptance`<br />**گردش‌کار پشتیبان:** `Package Acceptance`<br />**آزمون‌ها:** fixtureهای آفلاین بسته Plugin، به‌روزرسانی Plugin، E2E بسته canonical mock-OpenAI Telegram، و بررسی‌های بازماندن از ارتقای منتشرشده در برابر همان tarball. بررسی‌های مسدودکننده انتشار از آخرین مبنای منتشرشده پیش‌فرض استفاده می‌کنند؛ بررسی‌های soak به هر انتشار پایدار npm در `2026.4.23` یا پس از آن، به‌علاوه fixtureهای issueهای گزارش‌شده، گسترش می‌یابند.<br />**اجرای دوباره:** `rerun_group=package`.                   |
| هم‌ارزی QA           | **وظیفه:** `Run QA Lab parity lane` و `Run QA Lab parity report`<br />**گردش‌کار پشتیبان:** وظایف مستقیم<br />**آزمون‌ها:** بسته‌های هم‌ارزی agentic نامزد و مبنا، سپس گزارش هم‌ارزی.<br />**اجرای دوباره:** `rerun_group=qa-parity` یا `rerun_group=qa`.                                                                                                                                                                                                                                          |
| Matrix زنده QA      | **وظیفه:** `Run QA Lab live Matrix lane`<br />**گردش‌کار پشتیبان:** وظیفه مستقیم<br />**آزمون‌ها:** پروفایل QA زنده سریع Matrix در محیط `qa-live-shared`.<br />**اجرای دوباره:** `rerun_group=qa-live` یا `rerun_group=qa`.                                                                                                                                                                                                                                                                           |
| Telegram زنده QA    | **وظیفه:** `Run QA Lab live Telegram lane`<br />**گردش‌کار پشتیبان:** وظیفه مستقیم<br />**آزمون‌ها:** QA زنده Telegram با leaseهای اعتبارنامه Convex CI.<br />**اجرای دوباره:** `rerun_group=qa-live` یا `rerun_group=qa`.                                                                                                                                                                                                                                                                                       |
| تأییدکننده انتشار    | **وظیفه:** `Verify release checks`<br />**گردش‌کار پشتیبان:** هیچ‌کدام<br />**آزمون‌ها:** وظایف ضروری بررسی انتشار برای گروه اجرای دوباره انتخاب‌شده.<br />**اجرای دوباره:** پس از موفقیت وظایف فرزند متمرکز، دوباره اجرا کنید.                                                                                                                                                                                                                                                                                                    |

## قطعه‌های مسیر انتشار Docker

مرحله مسیر انتشار Docker این قطعه‌ها را زمانی اجرا می‌کند که `live_suite_filter`
خالی باشد:

| قطعه                                                           | پوشش                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | مسیرهای دودآزمون مسیر انتشار Docker هسته.                                                                                      |
| `package-update-openai`                                         | رفتار نصب/به‌روزرسانی بسته OpenAI، نصب درخواستی Codex، نوبت‌های زنده Plugin Codex، و فراخوانی‌های ابزار Chat Completions. |
| `package-update-anthropic`                                      | رفتار نصب و به‌روزرسانی بسته Anthropic.                                                                             |
| `package-update-core`                                           | رفتار بسته و به‌روزرسانی بی‌طرف نسبت به فراهم‌کننده.                                                                              |
| `plugins-runtime-plugins`                                       | مسیرهای runtime Plugin که رفتار Plugin را اجرا می‌کنند.                                                                        |
| `plugins-runtime-services`                                      | مسیرهای runtime Plugin مبتنی بر سرویس و زنده؛ هنگام درخواست شامل OpenWebUI می‌شود.                                           |
| `plugins-runtime-install-a` تا `plugins-runtime-install-h` | دسته‌های نصب/runtime Plugin که برای اعتبارسنجی موازی انتشار تقسیم شده‌اند.                                                      |

وقتی فقط یک مسیر Docker شکست خورده است، در گردش‌کار قابل‌استفاده‌مجدد زنده/E2E از
`docker_lanes=<lane[,lane]>` هدفمند استفاده کنید. آرتیفکت‌های انتشار در صورت
دردسترس‌بودن، فرمان‌های اجرای دوباره مخصوص هر مسیر را با ورودی‌های آرتیفکت بسته
و استفاده دوباره از تصویر شامل می‌شوند.

## پروفایل‌های انتشار

`release_profile` عمدتاً گستره زنده/فراهم‌کننده را درون بررسی‌های انتشار کنترل می‌کند.
این گزینه CI کامل عادی، Plugin Prerelease، دودآزمون نصب، پذیرش بسته،
یا QA Lab را حذف نمی‌کند. پروفایل‌های پایدار و کامل همیشه پوشش جامع E2E مخزن/زنده
و soak مسیر انتشار Docker را اجرا می‌کنند. پروفایل بتا می‌تواند با
`run_release_soak=true` آن را فعال کند. Package Acceptance برای هر نامزد کامل،
E2E بسته canonical Telegram را فراهم می‌کند، بنابراین umbrella آن poller زنده را
تکرار نمی‌کند.

| پروفایل   | کاربرد موردنظر                      | پوشش زنده/فراهم‌کننده گنجانده‌شده                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | سریع‌ترین دودآزمون حیاتی برای انتشار.   | مسیر زنده OpenAI/هسته، مدل‌های زنده Docker برای OpenAI، هسته Gateway بومی، پروفایل Gateway بومی OpenAI، Plugin بومی OpenAI، و OpenAI در Gateway زنده Docker.                     |
| `stable`  | پروفایل پیش‌فرض تأیید انتشار. | `minimum` به‌علاوه دودآزمون Anthropic، Google، MiniMax، backend، هارنس آزمون زنده بومی، backend زنده CLI در Docker، اتصال ACP در Docker، هارنس Codex در Docker، و یک شارد دودآزمون OpenCode Go. |
| `full`    | پیمایش مشورتی گسترده.             | `stable` به‌علاوه فراهم‌کنندگان مشورتی، شاردهای زنده Plugin، و شاردهای زنده رسانه.                                                                                                        |

## افزوده‌های فقط کامل

این مجموعه‌ها توسط `stable` رد می‌شوند و توسط `full` گنجانده می‌شوند:

| حوزه                             | پوشش فقط کامل                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| مدل‌های زنده Docker               | OpenCode Go، OpenRouter، xAI، Z.ai، و Fireworks.                                                                          |
| Gateway زنده Docker              | فراهم‌کنندگان مشورتی تقسیم‌شده به شاردهای DeepSeek/Fireworks، OpenCode Go/OpenRouter، و xAI/Z.ai.                              |
| پروفایل‌های فراهم‌کننده Gateway بومی | شاردهای کامل Anthropic Opus و Sonnet/Haiku، Fireworks، DeepSeek، شاردهای کامل مدل OpenCode Go، OpenRouter، xAI، و Z.ai. |
| شاردهای زنده Plugin بومی        | Pluginهای A-K، L-N، O-Z دیگر، Moonshot، و xAI.                                                                             |
| شاردهای زنده رسانه بومی         | گروه‌های صوت، موسیقی Google، موسیقی MiniMax، و ویدئو A-D.                                                                   |

`stable` شامل `native-live-src-gateway-profiles-anthropic-smoke` و
`native-live-src-gateway-profiles-opencode-go-smoke` است؛ `full` به‌جای آن از شاردهای
گسترده‌تر مدل Anthropic و OpenCode Go استفاده می‌کند. اجرای دوباره متمرکز همچنان می‌تواند از
handleهای تجمیعی `native-live-src-gateway-profiles-anthropic` یا
`native-live-src-gateway-profiles-opencode-go` استفاده کند.

## اجرای دوباره متمرکز

برای جلوگیری از تکرار باکس‌های انتشار نامرتبط، از `rerun_group` استفاده کنید:

| شناسه              | دامنه                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | همه مراحل اعتبارسنجی کامل انتشار.                                                             |
| `ci`                | فقط فرزند CI کامل دستی.                                                                        |
| `plugin-prerelease` | فقط فرزند پیش‌انتشار Plugin.                                                                   |
| `release-checks`    | همه مراحل بررسی‌های انتشار OpenClaw.                                                           |
| `install-smoke`     | Install Smoke تا بررسی‌های انتشار.                                                           |
| `cross-os`          | بررسی‌های انتشار میان‌سیستم‌عاملی.                                                            |
| `live-e2e`          | اعتبارسنجی E2E مخزن/زنده و مسیر انتشار Docker.                                                |
| `package`           | پذیرش بسته.                                                                                    |
| `qa`                | برابری QA به‌همراه مسیرهای زنده QA.                                                           |
| `qa-parity`         | فقط مسیرهای برابری QA و گزارش.                                                                |
| `qa-live`           | Matrix/Telegram زنده QA به‌همراه مسیرهای دارای گیت Discord، WhatsApp و Slack هنگام فعال بودن. |
| `npm-telegram`      | E2E Telegram برای بسته منتشرشده؛ به `release_package_spec` یا `npm_telegram_package_spec` نیاز دارد. |

وقتی یک مجموعه زنده شکست خورد، از `live_suite_filter` همراه با `rerun_group=live-e2e` استفاده کنید.
شناسه‌های فیلتر معتبر در گردش‌کار قابل‌استفاده‌مجدد زنده/E2E تعریف شده‌اند، از جمله
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`, و
`live-codex-harness-docker`.

شناسه `live-gateway-advisory-docker` یک شناسه اجرای دوباره تجمیعی برای سه شارد ارائه‌دهنده آن است،
بنابراین همچنان به همه کارهای Gateway مشورتی Docker منشعب می‌شود.

وقتی یک مسیر میان‌سیستم‌عاملی شکست خورد، از `cross_os_suite_filter` همراه با `rerun_group=cross-os` استفاده کنید. این فیلتر یک شناسه سیستم‌عامل، یک شناسه مجموعه، یا یک جفت سیستم‌عامل/مجموعه را می‌پذیرد؛ برای مثال `windows/packaged-upgrade`، `windows` یا `packaged-fresh`. خلاصه‌های میان‌سیستم‌عاملی برای مسیرهای ارتقای بسته‌بندی‌شده زمان‌بندی هر فاز را شامل می‌شوند، و فرمان‌های طولانی‌اجرا خطوط Heartbeat چاپ می‌کنند تا یک به‌روزرسانی گیرکرده Windows پیش از پایان مهلت کار قابل مشاهده باشد.

شکست‌های بررسی انتشار QA اعتبارسنجی عادی انتشار را مسدود می‌کنند. Drift ابزار پویای ضروری OpenClaw در سطح استاندارد نیز تأییدکننده بررسی انتشار را مسدود می‌کند. اجراهای آلفای Tideclaw همچنان می‌توانند مسیرهای بررسی انتشار غیرمرتبط با ایمنی بسته را مشورتی در نظر بگیرند. وقتی `live_suite_filter` به‌طور صریح یک مسیر زنده QA دارای گیت مانند Discord، WhatsApp یا Slack را درخواست می‌کند، متغیر مخزن متناظر `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` باید فعال باشد؛ در غیر این صورت، دریافت ورودی به‌جای نادیده‌گرفتن بی‌صدای مسیر شکست می‌خورد. وقتی به شواهد تازه QA نیاز دارید، `rerun_group=qa`، `qa-parity` یا `qa-live` را دوباره اجرا کنید.

## شواهدی که باید نگه دارید

خلاصه `Full Release Validation` را به‌عنوان نمایه سطح انتشار نگه دارید. این خلاصه به شناسه‌های اجرای فرزند پیوند می‌دهد و جدول‌های کندترین کارها را شامل می‌شود. برای شکست‌ها، ابتدا گردش‌کار فرزند را بررسی کنید، سپس کوچک‌ترین شناسه منطبق بالا را دوباره اجرا کنید.

آرتیفکت‌های مفید:

- `release-package-under-test` از `OpenClaw Release Checks`
- آرتیفکت‌های مسیر انتشار Docker زیر `.artifacts/docker-tests/`
- `package-under-test` پذیرش بسته و آرتیفکت‌های پذیرش Docker
- آرتیفکت‌های بررسی انتشار میان‌سیستم‌عاملی برای هر سیستم‌عامل و مجموعه
- آرتیفکت‌های برابری QA، Matrix و Telegram

## فایل‌های گردش‌کار

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
