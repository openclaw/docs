---
read_when:
    - اجرای محلی `pnpm openclaw qa matrix`
    - افزودن یا انتخاب سناریوهای تضمین کیفیت Matrix
    - تریاژ شکست‌ها، وقفه‌ها یا پاک‌سازی گیرکردهٔ Matrix QA
summary: 'مرجع نگه‌دارنده برای مسیر QA زنده Matrix با پشتیبانی Docker: CLI، پروفایل‌ها، متغیرهای محیطی، سناریوها و مصنوعات خروجی.'
title: Matrix QA
x-i18n:
    generated_at: "2026-07-04T20:39:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4f7fd98b5e7fef7a30c8820c5a1fc48c199e4d09db34255e8b2287a047b339f
    source_path: concepts/qa-matrix.md
    workflow: 16
---

مسیر QA ماتریکس، Plugin همراه `@openclaw/matrix` را در برابر یک homeserver یک‌بارمصرف Tuwunel در Docker اجرا می‌کند، همراه با حساب‌های موقت driver، SUT و observer به‌علاوه اتاق‌های ازپیش‌کاشته‌شده. این همان پوشش زنده و واقعیِ انتقال برای Matrix است.

این ابزار فقط مخصوص نگه‌دارندگان است. انتشارهای بسته‌بندی‌شده OpenClaw عمداً `qa-lab` را حذف می‌کنند، بنابراین `openclaw qa` فقط از یک checkout سورس در دسترس است. Checkoutهای سورس runner همراه را مستقیماً بارگذاری می‌کنند - به مرحله نصب Plugin نیازی نیست.

برای زمینه گسترده‌تر چارچوب QA، [نمای کلی QA](/fa/concepts/qa-e2e-automation) را ببینید.

## شروع سریع

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

`pnpm openclaw qa matrix` ساده، `--profile all` را اجرا می‌کند و در نخستین شکست متوقف نمی‌شود. برای گیت انتشار از `--profile fast --fail-fast` استفاده کنید؛ هنگام اجرای کل موجودی به‌صورت موازی، کاتالوگ را با `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` شارد کنید.

## این مسیر چه می‌کند

1. یک homeserver یک‌بارمصرف Tuwunel را در Docker فراهم می‌کند (تصویر پیش‌فرض `ghcr.io/matrix-construct/tuwunel:v1.5.1`، نام سرور `matrix-qa.test`، پورت `28008`) پشت یک ضبط‌کننده محدودِ درخواست/پاسخ که داده‌ها را redact می‌کند.
2. سه کاربر موقت ثبت می‌کند - `driver` (ترافیک ورودی می‌فرستد)، `sut` (حساب Matrix متعلق به OpenClaw تحت آزمون)، `observer` (ثبت ترافیک شخص ثالث).
3. اتاق‌های لازم برای سناریوهای انتخاب‌شده را آماده می‌کند (اصلی، رشته‌بندی، رسانه، راه‌اندازی دوباره، ثانویه، allowlist، E2EE، DM تأیید، و غیره).
4. پروب پروتکلِ بی‌طرف نسبت به زیرلایه `matrix-qa-v1` را در برابر مرز ضبط‌شده Tuwunel اجرا می‌کند. تست‌های واحد قرارداد پروب را با fixture پروتکل Matrix اثبات می‌کنند؛ میزبان آداپتر انتقال QA متعارف در [#99707](https://github.com/openclaw/openclaw/pull/99707) مالک سیم‌کشی هدف واقعی Crabline است.
5. یک Gateway فرزند OpenClaw را با Plugin واقعی Matrix که به حساب SUT محدود شده شروع می‌کند؛ `qa-channel` در فرزند بارگذاری نمی‌شود.
6. سناریوها را به‌ترتیب اجرا می‌کند، رویدادها را از طریق کلاینت‌های Matrix مربوط به driver/observer مشاهده می‌کند و انتظارهای route/state را از ترافیک ضبط‌شده استخراج می‌کند.
7. homeserver را جمع‌آوری می‌کند، گزارش و artifactهای شواهد را می‌نویسد، سپس خارج می‌شود.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### فلگ‌های رایج

| فلگ                  | پیش‌فرض                                       | توضیح                                                                                                                                   |
| --------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | پروفایل سناریو. [پروفایل‌ها](#profiles) را ببینید.                                                                                                  |
| `--fail-fast`         | خاموش                                           | پس از نخستین بررسی یا سناریوی ناموفق متوقف شود.                                                                                                |
| `--scenario <id>`     | -                                             | فقط این سناریو را اجرا کند. قابل تکرار است. [سناریوها](#scenarios) را ببینید.                                                                              |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | محل نوشته‌شدن گزارش‌ها، خلاصه، موجودی route/state، رویدادهای مشاهده‌شده، و لاگ خروجی. مسیرهای نسبی نسبت به `--repo-root` حل می‌شوند. |
| `--repo-root <path>`  | `process.cwd()`                               | ریشه مخزن هنگام فراخوانی از یک دایرکتوری کاری خنثی.                                                                               |
| `--sut-account <id>`  | `sut`                                         | شناسه حساب Matrix داخل پیکربندی Gateway مربوط به QA.                                                                                               |

### فلگ‌های provider

این مسیر از انتقال واقعی Matrix استفاده می‌کند، اما provider مدل قابل پیکربندی است:

| فلگ                     | پیش‌فرض          | توضیح                                                                                                                               |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` برای dispatch mock قطعی یا `live-frontier` برای providerهای frontier زنده. alias قدیمی `live-openai` همچنان کار می‌کند. |
| `--model <ref>`          | پیش‌فرض provider | ref اصلی `provider/model`.                                                                                                             |
| `--alt-model <ref>`      | پیش‌فرض provider | ref جایگزین `provider/model` وقتی سناریوها در میانه اجرا تغییر می‌کنند.                                                                            |
| `--fast`                 | خاموش              | در صورت پشتیبانی، حالت سریع provider را فعال می‌کند.                                                                                                |

QA ماتریکس `--credential-source` یا `--credential-role` را نمی‌پذیرد. این مسیر کاربران یک‌بارمصرف را به‌صورت محلی فراهم می‌کند؛ هیچ مخزن اعتبارنامه مشترکی برای lease کردن وجود ندارد.

## پروفایل‌ها

پروفایل انتخاب‌شده تعیین می‌کند کدام سناریوها اجرا شوند.

| پروفایل         | کاربرد                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (پیش‌فرض) | کاتالوگ کامل. کند اما جامع.                                                                                                                                                                                                   |
| `fast`          | زیرمجموعه گیت انتشار که قرارداد انتقال زنده را تمرین می‌دهد: canary، mention gating، مسدودسازی allowlist، شکل پاسخ، ازسرگیری پس از restart، پیگیری رشته، ایزولاسیون رشته، مشاهده واکنش، و تحویل متادیتای تأیید exec. |
| `transport`     | سناریوهای رشته‌بندی سطح انتقال، DM، اتاق، autojoin، mention/allowlist، تأیید، و واکنش.                                                                                                                                  |
| `media`         | پوشش پیوست تصویر، صوت، ویدئو، PDF، EPUB.                                                                                                                                                                                  |
| `e2ee-smoke`    | حداقل پوشش E2EE - پاسخ رمزگذاری‌شده پایه، پیگیری رشته، موفقیت bootstrap.                                                                                                                                                  |
| `e2ee-deep`     | سناریوهای جامع E2EE برای ازدست‌رفتن state، پشتیبان‌گیری، کلید، و بازیابی.                                                                                                                                                                     |
| `e2ee-cli`      | سناریوهای CLI مربوط به `openclaw matrix encryption setup` و `verify *` که از طریق harness QA اجرا می‌شوند.                                                                                                                                       |

نگاشت دقیق در `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts` قرار دارد.

## سناریوها

فهرست کامل شناسه‌های سناریو همان union `MatrixQaScenarioId` در `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15` است. دسته‌ها شامل موارد زیر هستند:

- رشته‌بندی - `matrix-thread-*`، `matrix-subagent-thread-spawn`
- سطح بالا / DM / اتاق - `matrix-top-level-reply-shape`، `matrix-room-*`، `matrix-dm-*`
- جریان‌سازی و پیشرفت ابزار - `matrix-room-partial-streaming-preview`، `matrix-room-quiet-streaming-preview`، `matrix-room-tool-progress-*`، `matrix-room-block-streaming`
- رسانه - `matrix-media-type-coverage`، `matrix-room-image-understanding-attachment`، `matrix-attachment-only-ignored`، `matrix-unsupported-media-safe`
- مسیریابی - `matrix-room-autojoin-invite`، `matrix-secondary-room-*`
- واکنش‌ها - `matrix-reaction-*`
- تأییدها - `matrix-approval-*` (متادیتای exec/Plugin، fallback تکه‌تکه، واکنش‌های رد، رشته‌ها، و مسیریابی `target: "both"`)
- restart و replay - `matrix-restart-*`، `matrix-stale-sync-replay-dedupe`، `matrix-room-membership-loss`، `matrix-homeserver-restart-resume`، `matrix-initial-catchup-then-incremental`
- mention gating، bot-to-bot، و allowlistها - `matrix-mention-*`، `matrix-allowbots-*`، `matrix-allowlist-*`، `matrix-multi-actor-ordering`، `matrix-inbound-edit-*`، `matrix-mxid-prefixed-command-block`، `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (پاسخ پایه، پیگیری رشته، bootstrap، چرخه‌عمر کلید بازیابی، گونه‌های ازدست‌رفتن state، رفتار پشتیبان‌گیری سرور، بهداشت دستگاه، تأیید SAS / QR / DM، restart، redact کردن artifact)
- E2EE CLI - `matrix-e2ee-cli-*` (راه‌اندازی رمزگذاری، راه‌اندازی idempotent، شکست bootstrap، چرخه‌عمر recovery-key، چندحسابی، رفت‌وبرگشت gateway-reply، self-verification)

برای اجرای یک مجموعه دست‌چین‌شده، `--scenario <id>` (قابل تکرار) را پاس بدهید؛ برای نادیده گرفتن profile gating آن را با `--profile all` ترکیب کنید.

## متغیرهای محیطی

| متغیر                                  | پیش‌فرض                                  | اثر                                                                                                                                                                                                 |
| --------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 دقیقه)                      | حد بالای سخت‌گیرانه برای کل اجرا.                                                                                                                                                                   |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | حد زمانی برای پاسخ کانری اولیه. CI انتشار این مقدار را روی اجراکننده‌های مشترک افزایش می‌دهد تا کند بودن نخستین نوبت Gateway پیش از شروع پوشش سناریو باعث شکست نشود.                              |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | بازهٔ سکوت برای گزاره‌های منفیِ بدون پاسخ. به مقداری `≤` مهلت اجرای کلی محدود می‌شود.                                                                                                             |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | حد زمانی برای برچیدن Docker. خروجی‌های شکست شامل فرمان بازیابی `docker compose ... down --remove-orphans` هستند.                                                                                  |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | تصویر homeserver را هنگام اعتبارسنجی در برابر نسخهٔ متفاوتی از Tuwunel بازنویسی می‌کند.                                                                                                           |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | روشن                                     | `0` خطوط پیشرفت `[matrix-qa] ...` را در stderr بی‌صدا می‌کند. `1` آن‌ها را اجباری روشن می‌کند.                                                                                                    |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | پالایش‌شده                               | `1` بدنهٔ پیام و `formatted_body` را در `matrix-qa-observed-events.json` نگه می‌دارد. پیش‌فرض آن‌ها را پالایش می‌کند تا مصنوعات CI ایمن بمانند.                                                    |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | خاموش                                    | `1` اجرای قطعی `process.exit` پس از نوشتن مصنوع را رد می‌کند. پیش‌فرض خروج را اجباری می‌کند، چون هندل‌های رمزنگاری بومی matrix-js-sdk می‌توانند حلقهٔ رویداد را پس از تکمیل مصنوع زنده نگه دارند. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | تنظیم‌نشده                               | وقتی توسط راه‌انداز بیرونی تنظیم شود (مثلاً `scripts/run-node.mjs`)، QA ماتریکس به‌جای شروع tee خودش، همان مسیر لاگ را دوباره استفاده می‌کند.                                                     |

## مصنوعات خروجی

در `--output-dir` نوشته می‌شوند:

- `matrix-qa-report.md` - گزارش پروتکل Markdown (چه چیزی پاس شد، شکست خورد، رد شد، و چرا).
- `matrix-qa-summary.json` - خلاصهٔ ساخت‌یافته مناسب برای تجزیهٔ CI و داشبوردها.
- `matrix-qa-route-state-manifest.json` - موجودی پویای `matrix-qa-v1` که با شناسهٔ سناریو کلیدگذاری شده است. شکل‌های پالایش‌شدهٔ مسیر/بدنه، ترتیب درخواست‌ها، تلاش‌های دوبارهٔ مشاهده‌شده، خطاها، تداوم sync-token، و خانواده‌های وضعیت دستگاه/کلید/رسانه/پشتیبان مشاهده‌شده در همان اجرا را ثبت می‌کند. این مدرک اجرایی است، نه baseline ثبت‌شده در مخزن.
- `matrix-qa-observed-events.json` - رویدادهای مشاهده‌شدهٔ ماتریکس از کلاینت‌های driver و observer. بدنه‌ها پالایش می‌شوند مگر اینکه `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` باشد؛ فرادادهٔ تأیید با فیلدهای امن منتخب و پیش‌نمایش کوتاه‌شدهٔ فرمان خلاصه می‌شود.
- `matrix-qa-output.log` - stdout/stderr ترکیب‌شده از اجرا. اگر `OPENCLAW_RUN_NODE_OUTPUT_LOG` تنظیم شده باشد، به‌جای آن لاگ راه‌انداز بیرونی دوباره استفاده می‌شود.

دایرکتوری خروجی پیش‌فرض `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` است تا اجراهای پیاپی روی هم نوشته نشوند.

## نکات تریاژ

- **اجرا نزدیک پایان معلق می‌ماند:** هندل‌های رمزنگاری بومی `matrix-js-sdk` می‌توانند بیشتر از harness زنده بمانند. پیش‌فرض پس از نوشتن مصنوع یک `process.exit` تمیز را اجباری می‌کند؛ اگر `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` را تنظیم کرده‌اید، انتظار داشته باشید فرایند باقی بماند.
- **خطای پاک‌سازی:** فرمان بازیابی چاپ‌شده را پیدا کنید (فراخوانی `docker compose ... down --remove-orphans`) و آن را دستی اجرا کنید تا پورت homeserver آزاد شود.
- **بازه‌های گزارهٔ منفی ناپایدار در CI:** وقتی CI سریع است `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` را کاهش دهید (پیش‌فرض 8 ثانیه)؛ روی اجراکننده‌های مشترک کند آن را افزایش دهید.
- **برای گزارش باگ به بدنه‌های پالایش‌شده نیاز دارید:** با `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` دوباره اجرا کنید و `matrix-qa-observed-events.json` را پیوست کنید. با مصنوع حاصل مانند دادهٔ حساس رفتار کنید.
- **نسخهٔ متفاوت Tuwunel:** `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` را به نسخهٔ تحت آزمون اشاره دهید. این مسیر فقط تصویر پیش‌فرض سنجاق‌شده را بررسی می‌کند.

## قرارداد انتقال زنده

Matrix یکی از سه مسیر انتقال زنده (Matrix، Telegram، Discord) است که یک چک‌لیست قرارداد واحد را که در [نمای کلی QA → پوشش انتقال زنده](/fa/concepts/qa-e2e-automation#live-transport-coverage) تعریف شده به اشتراک می‌گذارند. `qa-channel` همچنان مجموعهٔ مصنوعی گسترده است و عمداً بخشی از آن ماتریس نیست.

## مرتبط

- [نمای کلی QA](/fa/concepts/qa-e2e-automation) - پشتهٔ کلی QA و قرارداد انتقال زنده
- [کانال QA](/fa/channels/qa-channel) - آداپتور کانال مصنوعی برای سناریوهای پشتیبانی‌شده با مخزن
- [آزمون](/fa/help/testing) - اجرای آزمون‌ها و افزودن پوشش QA
- [Matrix](/fa/channels/matrix) - Plugin کانال تحت آزمون
