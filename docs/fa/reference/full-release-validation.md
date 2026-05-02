---
read_when:
    - اجرای اعتبارسنجی کامل انتشار یا اجرای مجدد آن
    - مقایسه پروفایل‌های اعتبارسنجی انتشار پایدار و کامل
    - اشکال‌زدایی از خرابی‌های مرحلهٔ اعتبارسنجی انتشار
summary: مراحل اعتبارسنجی کامل انتشار، گردش‌کارهای فرزند، پروفایل‌های انتشار، شناسه‌های اجرای مجدد و شواهد
title: اعتبارسنجی کامل انتشار
x-i18n:
    generated_at: "2026-05-02T20:59:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ce1e5a72227ca202335fe68b537491a0b68a0bb2af431aa56c41cf20989e88c
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` چتر انتشار است. این تنها نقطه ورود دستی برای اثبات پیش از انتشار است، اما بیشتر کار در workflowهای فرزند انجام می‌شود تا یک باکس ناموفق بدون شروع دوباره کل انتشار قابل اجرای مجدد باشد.

آن را از یک ref workflow مورد اعتماد، معمولا `main`، اجرا کنید و شاخه انتشار، تگ یا SHA کامل commit را به‌عنوان `ref` بدهید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

workflowهای فرزند از ref workflow مورد اعتماد برای harness و از ورودی `ref` برای candidate تحت آزمون استفاده می‌کنند. این کار باعث می‌شود منطق اعتبارسنجی جدید هنگام اعتبارسنجی یک شاخه یا تگ انتشار قدیمی‌تر نیز در دسترس باشد.

پذیرش بسته معمولا tarball مربوط به candidate را از `ref` resolve‌شده می‌سازد، از جمله اجراهای SHA کامل که با `pnpm ci:full-release` dispatch شده‌اند. پس از انتشار، `package_acceptance_package_spec=openclaw@YYYY.M.D` (یا `openclaw@beta`/`openclaw@latest`) را بدهید تا همان ماتریس بسته/به‌روزرسانی به‌جای آن روی بسته npm منتشرشده اجرا شود.

## مرحله‌های سطح بالا

| مرحله                | جزئیات                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| حل target    | **Job:** `Resolve target ref`<br />**workflow فرزند:** ندارد<br />**اثبات می‌کند:** شاخه انتشار، تگ، یا SHA کامل commit را resolve می‌کند و ورودی‌های انتخاب‌شده را ثبت می‌کند.<br />**اجرای مجدد:** اگر این مورد ناموفق شد، چتر را دوباره اجرا کنید.                                                                                                                                                                              |
| Vitest و CI معمولی | **Job:** `Run normal full CI`<br />**workflow فرزند:** `CI`<br />**اثبات می‌کند:** گراف CI کامل دستی را در برابر target ref اجرا می‌کند، شامل laneهای Linux Node، shardهای Plugin همراه، قراردادهای کانال، سازگاری Node 22، `check`، `check-additional`، smoke ساخت، بررسی‌های مستندات، Skills پایتون، Windows، macOS، i18n رابط کاربری کنترل، و Android از طریق چتر.<br />**اجرای مجدد:** `rerun_group=ci`. |
| پیش‌انتشار Plugin    | **Job:** `Run plugin prerelease validation`<br />**workflow فرزند:** `Plugin Prerelease`<br />**اثبات می‌کند:** بررسی‌های ایستای مختص انتشار Plugin، پوشش Plugin عامل‌محور، shardهای دسته کامل extension، و laneهای Docker پیش‌انتشار Plugin.<br />**اجرای مجدد:** `rerun_group=plugin-prerelease`.                                                                                                       |
| بررسی‌های انتشار       | **Job:** `Run release/live/Docker/QA validation`<br />**workflow فرزند:** `OpenClaw Release Checks`<br />**اثبات می‌کند:** smoke نصب، بررسی‌های بسته میان‌سیستمی، مجموعه‌های live/E2E، chunkهای مسیر انتشار Docker، پذیرش بسته، هم‌ارزی QA Lab، Matrix زنده، و Telegram زنده.<br />**اجرای مجدد:** `rerun_group=release-checks` یا یک handle محدودتر برای release-checks.                                |
| بسته Telegram     | **Job:** `Run package Telegram E2E`<br />**workflow فرزند:** `NPM Telegram Beta E2E`<br />**اثبات می‌کند:** اثبات بسته Telegram مبتنی بر artifact برای `rerun_group=all` با `release_profile=full`، یا اثبات Telegram بسته منتشرشده وقتی `npm_telegram_package_spec` تنظیم شده باشد.<br />**اجرای مجدد:** `rerun_group=npm-telegram` با `npm_telegram_package_spec`.                                     |
| راستی‌آزمای چتر    | **Job:** `Verify full validation`<br />**workflow فرزند:** ندارد<br />**اثبات می‌کند:** نتیجه‌های ثبت‌شده اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین jobها را از workflowهای فرزند اضافه می‌کند.<br />**اجرای مجدد:** پس از سبز شدن اجرای مجدد یک فرزند ناموفق، فقط این job را دوباره اجرا کنید.                                                                                                                                   |

برای `ref=main` و `rerun_group=all`، یک چتر جدیدتر جایگزین چتر قدیمی‌تر می‌شود. وقتی parent لغو شود، monitor آن هر workflow فرزندی را که قبلا dispatch کرده باشد لغو می‌کند. اجرای اعتبارسنجی شاخه انتشار و تگ به‌صورت پیش‌فرض یکدیگر را لغو نمی‌کنند.

## مرحله‌های بررسی انتشار

`OpenClaw Release Checks` بزرگ‌ترین workflow فرزند است. این workflow هدف را یک‌بار resolve می‌کند و وقتی مرحله‌های مرتبط با بسته یا Docker به آن نیاز داشته باشند، یک artifact مشترک `release-package-under-test` آماده می‌کند.

| مرحله               | جزئیات                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| target انتشار      | **Job:** `Resolve target ref`<br />**workflow پشتیبان:** ندارد<br />**آزمون‌ها:** ref انتخاب‌شده، SHA مورد انتظار اختیاری، profile، گروه اجرای مجدد، و فیلتر متمرکز مجموعه live.<br />**اجرای مجدد:** `rerun_group=release-checks`.                                                                                                                                                                           |
| artifact بسته    | **Job:** `Prepare release package artifact`<br />**workflow پشتیبان:** ندارد<br />**آزمون‌ها:** یک tarball candidate را pack یا resolve می‌کند و `release-package-under-test` را برای بررسی‌های پایین‌دستی مرتبط با بسته upload می‌کند.<br />**اجرای مجدد:** گروه بسته، cross-OS، یا live/E2E تحت تاثیر.                                                                                                           |
| smoke نصب       | **Job:** `Run install smoke`<br />**workflow پشتیبان:** `Install Smoke`<br />**آزمون‌ها:** مسیر نصب کامل با استفاده دوباره از image smoke مربوط به Dockerfile ریشه، نصب بسته QR، smokeهای Docker ریشه و Gateway، آزمون‌های Docker نصب‌کننده، smoke نصب سراسری Bun برای image-provider، و E2E سریع نصب/حذف Plugin همراه.<br />**اجرای مجدد:** `rerun_group=install-smoke`.                              |
| میان‌سیستمی            | **Job:** `cross_os_release_checks`<br />**workflow پشتیبان:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**آزمون‌ها:** laneهای تازه و ارتقا روی Linux، Windows، و macOS برای provider و mode انتخاب‌شده، با استفاده از tarball candidate به‌همراه یک بسته baseline.<br />**اجرای مجدد:** `rerun_group=cross-os`.                                                                               |
| E2E مخزن و live   | **Job:** `Run repo/live E2E validation`<br />**workflow پشتیبان:** `OpenClaw Live And E2E Checks (Reusable)`<br />**آزمون‌ها:** E2E مخزن، cache زنده، streaming websocket OpenAI، provider زنده native و shardهای Plugin، و harnessهای مدل/backend/Gateway زنده مبتنی بر Docker که توسط `release_profile` انتخاب می‌شوند.<br />**اجرای مجدد:** `rerun_group=live-e2e`، به‌صورت اختیاری با `live_suite_filter`. |
| مسیر انتشار Docker | **Job:** `Run Docker release-path validation`<br />**workflow پشتیبان:** `OpenClaw Live And E2E Checks (Reusable)`<br />**آزمون‌ها:** chunkهای Docker مسیر انتشار در برابر artifact بسته مشترک.<br />**اجرای مجدد:** `rerun_group=live-e2e`.                                                                                                                                                      |
| پذیرش بسته  | **Job:** `Run package acceptance`<br />**workflow پشتیبان:** `Package Acceptance`<br />**آزمون‌ها:** fixtureهای بسته Plugin آفلاین، به‌روزرسانی Plugin، پذیرش بسته Telegram با OpenAI شبیه‌سازی‌شده، و بررسی‌های survivor ارتقای منتشرشده از هر انتشار پایدار npm در یا پس از `2026.4.23` در برابر همان tarball.<br />**اجرای مجدد:** `rerun_group=package`.                                         |
| هم‌ارزی QA           | **Job:** `Run QA Lab parity lane` و `Run QA Lab parity report`<br />**workflow پشتیبان:** jobهای مستقیم<br />**آزمون‌ها:** packهای هم‌ارزی عامل‌محور candidate و baseline، سپس گزارش هم‌ارزی.<br />**اجرای مجدد:** `rerun_group=qa-parity` یا `rerun_group=qa`.                                                                                                                                       |
| Matrix زنده QA      | **Job:** `Run QA Lab live Matrix lane`<br />**workflow پشتیبان:** job مستقیم<br />**آزمون‌ها:** profile سریع QA برای Matrix زنده در محیط `qa-live-shared`.<br />**اجرای مجدد:** `rerun_group=qa-live` یا `rerun_group=qa`.                                                                                                                                                                        |
| Telegram زنده QA    | **Job:** `Run QA Lab live Telegram lane`<br />**workflow پشتیبان:** job مستقیم<br />**آزمون‌ها:** QA زنده Telegram با leaseهای credential مربوط به Convex CI.<br />**اجرای مجدد:** `rerun_group=qa-live` یا `rerun_group=qa`.                                                                                                                                                                                    |
| راستی‌آزمای انتشار    | **Job:** `Verify release checks`<br />**workflow پشتیبان:** ندارد<br />**آزمون‌ها:** jobهای لازم release-check برای گروه اجرای مجدد انتخاب‌شده.<br />**اجرای مجدد:** پس از پاس شدن jobهای فرزند متمرکز دوباره اجرا کنید.                                                                                                                                                                                                 |

## chunkهای مسیر انتشار Docker

مرحله مسیر انتشار Docker وقتی `live_suite_filter` خالی باشد این chunkها را اجرا می‌کند:

| chunk                                                           | پوشش                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | laneهای smoke مسیر انتشار Core Docker.                                   |
| `package-update-openai`                                         | رفتار نصب و به‌روزرسانی بسته OpenAI.                             |
| `package-update-anthropic`                                      | رفتار نصب و به‌روزرسانی بسته Anthropic.                          |
| `package-update-core`                                           | رفتار بسته و به‌روزرسانی مستقل از provider.                           |
| `plugins-runtime-plugins`                                       | laneهای runtime Plugin که رفتار Plugin را exercise می‌کنند.                     |
| `plugins-runtime-services`                                      | laneهای runtime Plugin مبتنی بر سرویس؛ شامل OpenWebUI در صورت درخواست. |
| `plugins-runtime-install-a` تا `plugins-runtime-install-h` | دسته‌های نصب/runtime Plugin که برای اعتبارسنجی انتشار موازی تقسیم شده‌اند.   |

وقتی فقط یک lane مربوط به Docker ناموفق شده باشد، از `docker_lanes=<lane[,lane]>` هدفمند روی workflow قابل استفاده دوباره live/E2E استفاده کنید. artifactهای انتشار شامل commandهای اجرای مجدد به‌ازای هر lane هستند، همراه با ورودی‌های artifact بسته و استفاده دوباره از image وقتی در دسترس باشند.

## profileهای انتشار

`release_profile` عمدتاً گستره live/provider را درون بررسی‌های انتشار کنترل می‌کند.
این گزینه CI کامل معمولی، Plugin Prerelease، دودآزمون نصب، پذیرش بسته،
QA Lab، یا بخش‌های مسیر انتشار Docker را حذف نمی‌کند. `full` همچنین باعث می‌شود
اجرای چتری، هنگام `rerun_group=all`، E2E مربوط به Telegram بسته را در برابر آرتیفکت بسته انتشار اجرا کند؛ بنابراین یک نامزد کامل پیش از انتشار بی‌سروصدا آن مسیر بسته Telegram را نادیده نمی‌گیرد.

| نمایه | کاربرد مورد نظر | پوشش live/provider شامل‌شده |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | سریع‌ترین دودآزمون حیاتی برای انتشار. | مسیر live مربوط به OpenAI/core، مدل‌های live در Docker برای OpenAI، هسته Gateway بومی، نمایه Gateway بومی OpenAI، Plugin بومی OpenAI، و Gateway live مربوط به OpenAI در Docker. |
| `stable` | نمایه پیش‌فرض تأیید انتشار. | `minimum` به‌علاوه Anthropic، Google، MiniMax، backend، چارچوب آزمون live بومی، backend مربوط به CLI live در Docker، اتصال Docker ACP، چارچوب Docker Codex، و یک شارد دودآزمون OpenCode Go. |
| `full` | جاروب مشورتی گسترده. | `stable` به‌علاوه ارائه‌دهندگان مشورتی، شاردهای live مربوط به Plugin، و شاردهای live رسانه. |

## افزوده‌های مختص Full

این مجموعه‌ها توسط `stable` رد می‌شوند و توسط `full` شامل می‌شوند:

| حوزه | پوشش مختص Full |
| -------------------------------- | ------------------------------------------------------------------------------- |
| مدل‌های live در Docker | OpenCode Go، OpenRouter، xAI، Z.ai، و Fireworks. |
| Gateway live در Docker | شارد مشورتی برای DeepSeek، Fireworks، OpenCode Go، OpenRouter، xAI، و Z.ai. |
| نمایه‌های ارائه‌دهنده Gateway بومی | Fireworks، DeepSeek، شاردهای کامل مدل OpenCode Go، OpenRouter، xAI، و Z.ai. |
| شاردهای live مربوط به Plugin بومی | Plugin‌های A-K، L-N، سایر O-Z، Moonshot، و xAI. |
| شاردهای live رسانه بومی | صدا، موسیقی Google، موسیقی MiniMax، و گروه‌های ویدئو A-D. |

`stable` شامل `native-live-src-gateway-profiles-opencode-go-smoke` است؛ `full`
به‌جای آن از شاردهای گسترده‌تر مدل OpenCode Go استفاده می‌کند.

## اجرای دوباره متمرکز

از `rerun_group` استفاده کنید تا از تکرار جعبه‌های انتشار نامرتبط جلوگیری شود:

| شناسه | دامنه |
| ------------------- | --------------------------------------------------------------------- |
| `all` | همه مراحل اعتبارسنجی کامل انتشار. |
| `ci` | فقط فرزند CI کامل دستی. |
| `plugin-prerelease` | فقط فرزند Plugin Prerelease. |
| `release-checks` | همه مراحل OpenClaw Release Checks. |
| `install-smoke` | Install Smoke تا بررسی‌های انتشار. |
| `cross-os` | بررسی‌های انتشار میان‌سیستمی. |
| `live-e2e` | اعتبارسنجی E2E مربوط به repo/live و مسیر انتشار Docker. |
| `package` | پذیرش بسته. |
| `qa` | هم‌ارزی QA به‌علاوه مسیرهای live مربوط به QA. |
| `qa-parity` | فقط مسیرهای هم‌ارزی QA و گزارش. |
| `qa-live` | فقط Matrix و Telegram مربوط به QA live. |
| `npm-telegram` | E2E مربوط به Telegram برای بسته منتشرشده؛ به `npm_telegram_package_spec` نیاز دارد. |

وقتی یک مجموعه live شکست خورده است، از `live_suite_filter` همراه با `rerun_group=live-e2e` استفاده کنید.
شناسه‌های معتبر فیلتر در گردش‌کار قابل استفاده مجدد live/E2E تعریف شده‌اند، از جمله
`docker-live-models`، `live-gateway-docker`،
`live-gateway-anthropic-docker`، `live-gateway-google-docker`،
`live-gateway-minimax-docker`، `live-gateway-advisory-docker`،
`live-cli-backend-docker`، `live-acp-bind-docker`، و
`live-codex-harness-docker`.

## شواهدی که باید نگه داشت

خلاصه `Full Release Validation` را به‌عنوان نمایه سطح انتشار نگه دارید. این خلاصه به
شناسه‌های اجرای فرزند پیوند می‌دهد و جدول‌های کندترین jobها را شامل می‌شود. برای شکست‌ها، ابتدا گردش‌کار فرزند را بررسی کنید، سپس کوچک‌ترین شناسه منطبق بالا را دوباره اجرا کنید.

آرتیفکت‌های مفید:

- `release-package-under-test` از `OpenClaw Release Checks`
- آرتیفکت‌های مسیر انتشار Docker زیر `.artifacts/docker-tests/`
- آرتیفکت‌های `package-under-test` مربوط به Package Acceptance و آرتیفکت‌های پذیرش Docker
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
