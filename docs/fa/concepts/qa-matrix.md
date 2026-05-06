---
read_when:
    - اجرای pnpm openclaw qa matrix به‌صورت محلی
    - افزودن یا انتخاب سناریوهای QA برای Matrix
    - تریاژ شکست‌های QA ماتریس، اتمام زمان‌ها، یا پاک‌سازی گیرکرده
summary: 'مرجع نگه‌دارنده برای مسیر QA زنده Matrix با پشتوانه Docker: CLI، پروفایل‌ها، env vars، سناریوها، و مصنوعات خروجی.'
title: تضمین کیفیت ماتریس
x-i18n:
    generated_at: "2026-05-06T09:13:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c6d836492368c470468547950d3765a64187694852222a5a1f0ae4185569abe
    source_path: concepts/qa-matrix.md
    workflow: 16
---

مسیر QA ماتریکس، Plugin همراه `@openclaw/matrix` را در برابر یک homeserver موقت Tuwunel در Docker، با حساب‌های موقت driver، SUT و observer به‌همراه اتاق‌های seedشده اجرا می‌کند. این پوشش زنده و واقعیِ transport برای Matrix است.

این ابزار فقط برای نگه‌دارندگان است. انتشارهای بسته‌بندی‌شده OpenClaw عمداً `qa-lab` را حذف می‌کنند، بنابراین `openclaw qa` فقط از یک checkout منبع در دسترس است. checkoutهای منبع runner همراه را مستقیماً بارگذاری می‌کنند - هیچ مرحله نصب Plugin لازم نیست.

برای زمینه گسترده‌تر چارچوب QA، [نمای کلی QA](/fa/concepts/qa-e2e-automation) را ببینید.

## شروع سریع

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

دستور ساده `pnpm openclaw qa matrix` با `--profile all` اجرا می‌شود و در اولین شکست متوقف نمی‌شود. برای یک release gate از `--profile fast --fail-fast` استفاده کنید؛ هنگام اجرای کل موجودی به‌صورت موازی، catalog را با `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` shard کنید.

## این مسیر چه می‌کند

1. یک homeserver موقت Tuwunel را در Docker آماده می‌کند (image پیش‌فرض `ghcr.io/matrix-construct/tuwunel:v1.5.1`، نام سرور `matrix-qa.test`، پورت `28008`).
2. سه کاربر موقت ثبت می‌کند - `driver` (ترافیک ورودی را ارسال می‌کند)، `sut` (حساب Matrix تحت آزمون OpenClaw)، `observer` (ثبت ترافیک شخص ثالث).
3. اتاق‌های لازم برای سناریوهای انتخاب‌شده را seed می‌کند (main، threading، media، restart، secondary، allowlist، E2EE، verification DM و غیره).
4. یک Gateway فرزند OpenClaw را با Plugin واقعی Matrix محدود به حساب SUT شروع می‌کند؛ `qa-channel` در فرزند بارگذاری نمی‌شود.
5. سناریوها را به‌ترتیب اجرا می‌کند و رویدادها را از طریق clientهای Matrix مربوط به driver/observer مشاهده می‌کند.
6. homeserver را tear down می‌کند، artifactهای report و summary را می‌نویسد و سپس خارج می‌شود.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### flagهای رایج

| Flag                  | پیش‌فرض                                      | توضیح                                                                                                           |
| --------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | profile سناریو. [Profileها](#profiles) را ببینید.                                                              |
| `--fail-fast`         | خاموش                                         | پس از اولین check یا سناریوی ناموفق متوقف شود.                                                                |
| `--scenario <id>`     | -                                             | فقط این سناریو را اجرا کند. تکرارپذیر است. [سناریوها](#scenarios) را ببینید.                                  |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | محل نوشتن reportها، summary، رویدادهای مشاهده‌شده، و output log. مسیرهای نسبی نسبت به `--repo-root` resolve می‌شوند. |
| `--repo-root <path>`  | `process.cwd()`                               | ریشه repository هنگام فراخوانی از یک working directory خنثی.                                                   |
| `--sut-account <id>`  | `sut`                                         | شناسه حساب Matrix داخل config مربوط به QA Gateway.                                                            |

### flagهای provider

این مسیر از transport واقعی Matrix استفاده می‌کند، اما provider مدل قابل پیکربندی است:

| Flag                     | پیش‌فرض         | توضیح                                                                                                                               |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` برای dispatch mock قطعی یا `live-frontier` برای providerهای frontier زنده. alias قدیمی `live-openai` همچنان کار می‌کند. |
| `--model <ref>`          | پیش‌فرض provider | ref اصلی `provider/model`.                                                                                                          |
| `--alt-model <ref>`      | پیش‌فرض provider | ref جایگزین `provider/model` برای سناریوهایی که در میانه اجرا switch می‌کنند.                                                       |
| `--fast`                 | خاموش            | fast mode provider را، در صورت پشتیبانی، فعال می‌کند.                                                                               |

Matrix QA گزینه‌های `--credential-source` یا `--credential-role` را نمی‌پذیرد. این مسیر کاربران موقت را به‌صورت محلی آماده می‌کند؛ هیچ credential pool مشترکی برای lease کردن وجود ندارد.

## Profileها

profile انتخاب‌شده تعیین می‌کند کدام سناریوها اجرا شوند.

| Profile         | کاربرد                                                                                                                                                                                                                              |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (پیش‌فرض) | catalog کامل. کند اما جامع.                                                                                                                                                                                                        |
| `fast`          | زیرمجموعه release-gate که contract زنده transport را تمرین می‌دهد: canary، mention gating، allowlist block، reply shape، restart resume، thread follow-up، thread isolation، reaction observation، و تحویل metadata برای exec approval. |
| `transport`     | سناریوهای threading، DM، room، autojoin، mention/allowlist، approval، و reaction در سطح transport.                                                                                                                                 |
| `media`         | پوشش attachment برای image، audio، video، PDF، EPUB.                                                                                                                                                                               |
| `e2ee-smoke`    | حداقل پوشش E2EE - پاسخ encrypted پایه، thread follow-up، bootstrap موفق.                                                                                                                                                          |
| `e2ee-deep`     | سناریوهای جامع E2EE برای state-loss، backup، key، و recovery.                                                                                                                                                                      |
| `e2ee-cli`      | سناریوهای CLI مربوط به `openclaw matrix encryption setup` و `verify *` که از طریق QA harness اجرا می‌شوند.                                                                                                                        |

نگاشت دقیق در `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts` قرار دارد.

## سناریوها

فهرست کامل شناسه‌های سناریو union مربوط به `MatrixQaScenarioId` در `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15` است. دسته‌ها شامل موارد زیر هستند:

- threading - `matrix-thread-*`، `matrix-subagent-thread-spawn`
- top-level / DM / room - `matrix-top-level-reply-shape`، `matrix-room-*`، `matrix-dm-*`
- streaming و tool progress - `matrix-room-partial-streaming-preview`، `matrix-room-quiet-streaming-preview`، `matrix-room-tool-progress-*`، `matrix-room-block-streaming`
- media - `matrix-media-type-coverage`، `matrix-room-image-understanding-attachment`، `matrix-attachment-only-ignored`، `matrix-unsupported-media-safe`
- routing - `matrix-room-autojoin-invite`، `matrix-secondary-room-*`
- reactions - `matrix-reaction-*`
- approvals - `matrix-approval-*` (metadata مربوط به exec/plugin، chunked fallback، deny reactions، threads، و routing با `target: "both"`)
- restart و replay - `matrix-restart-*`، `matrix-stale-sync-replay-dedupe`، `matrix-room-membership-loss`، `matrix-homeserver-restart-resume`، `matrix-initial-catchup-then-incremental`
- mention gating، bot-to-bot، و allowlistها - `matrix-mention-*`، `matrix-allowbots-*`، `matrix-allowlist-*`، `matrix-multi-actor-ordering`، `matrix-inbound-edit-*`، `matrix-mxid-prefixed-command-block`، `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (پاسخ پایه، thread follow-up، bootstrap، چرخه عمر recovery key، گونه‌های state-loss، رفتار backup سرور، device hygiene، راستی‌آزمایی SAS / QR / DM، restart، redaction artifact)
- E2EE CLI - `matrix-e2ee-cli-*` (encryption setup، setup idempotent، شکست bootstrap، چرخه عمر recovery-key، multi-account، round-trip مربوط به gateway-reply، self-verification)

برای اجرای مجموعه‌ای انتخابی، `--scenario <id>` (تکرارپذیر) را بدهید؛ برای نادیده گرفتن profile gating آن را با `--profile all` ترکیب کنید.

## متغیرهای محیطی

| متغیر                                   | پیش‌فرض                                  | اثر                                                                                                                                                                                                     |
| --------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (۳۰ دقیقه)                     | سقف سخت برای کل اجرا.                                                                                                                                                                                   |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                  | حد زمانی برای پاسخ canary اولیه. CI انتشار این مقدار را روی اجراکننده‌های مشترک افزایش می‌دهد تا کندی اولین نوبت Gateway پیش از شروع پوشش سناریو باعث شکست نشود.                                    |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                   | پنجره سکوت برای ادعاهای منفیِ بدون پاسخ. به `≤` زمان پایان اجرای کلی محدود می‌شود.                                                                                                                     |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                  | حد زمانی برای جمع‌آوری Docker. سطح‌های شکست شامل فرمان بازیابی `docker compose ... down --remove-orphans` هستند.                                                                                      |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | برای اعتبارسنجی در برابر نسخه‌ای متفاوت از Tuwunel، تصویر homeserver را بازنویسی می‌کند.                                                                                                               |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | روشن                                     | `0` خطوط پیشرفت `[matrix-qa] ...` را در stderr بی‌صدا می‌کند. `1` آن‌ها را اجباری روشن می‌کند.                                                                                                         |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | حذف‌شده                                  | `1` بدنه پیام و `formatted_body` را در `matrix-qa-observed-events.json` نگه می‌دارد. پیش‌فرض برای ایمن نگه داشتن مصنوعات CI، آن‌ها را حذف می‌کند.                                                      |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | خاموش                                    | `1` خروج قطعی `process.exit` پس از نوشتن مصنوع را رد می‌کند. پیش‌فرض خروج را اجباری می‌کند، چون handleهای رمزنگاری بومی matrix-js-sdk می‌توانند پس از تکمیل مصنوع نیز حلقه رویداد را زنده نگه دارند. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | تنظیم‌نشده                               | وقتی توسط یک راه‌انداز بیرونی تنظیم شود، برای نمونه `scripts/run-node.mjs`، QA ماتریکس به‌جای شروع tee خودش، همان مسیر log را دوباره استفاده می‌کند.                                                  |

## مصنوعات خروجی

در `--output-dir` نوشته می‌شود:

- `matrix-qa-report.md` - گزارش پروتکل Markdown (چه چیزی قبول شد، شکست خورد، رد شد، و چرا).
- `matrix-qa-summary.json` - خلاصه ساخت‌یافته مناسب برای تحلیل CI و داشبوردها.
- `matrix-qa-observed-events.json` - رویدادهای مشاهده‌شده Matrix از کلاینت‌های راه‌انداز و ناظر. بدنه‌ها حذف می‌شوند مگر اینکه `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` باشد؛ فراداده تأیید با فیلدهای ایمن انتخاب‌شده و پیش‌نمایش فرمان کوتاه‌شده خلاصه می‌شود.
- `matrix-qa-output.log` - خروجی ترکیبی stdout/stderr از اجرا. اگر `OPENCLAW_RUN_NODE_OUTPUT_LOG` تنظیم شده باشد، به‌جای آن log راه‌انداز بیرونی دوباره استفاده می‌شود.

پوشه خروجی پیش‌فرض `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` است تا اجراهای پیاپی یکدیگر را بازنویسی نکنند.

## نکات تریاژ

- **اجرا نزدیک پایان گیر می‌کند:** handleهای رمزنگاری بومی `matrix-js-sdk` می‌توانند بیشتر از harness زنده بمانند. پیش‌فرض پس از نوشتن مصنوع یک `process.exit` تمیز را اجباری می‌کند؛ اگر `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` را unset کرده باشید، انتظار داشته باشید فرایند باقی بماند.
- **خطای جمع‌آوری:** فرمان بازیابی چاپ‌شده را پیدا کنید (یک فراخوانی `docker compose ... down --remove-orphans`) و آن را دستی اجرا کنید تا پورت homeserver آزاد شود.
- **پنجره‌های ادعای منفی ناپایدار در CI:** وقتی CI سریع است، `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` را کاهش دهید (پیش‌فرض ۸ ثانیه)؛ روی اجراکننده‌های مشترک کند آن را افزایش دهید.
- **برای گزارش باگ به بدنه‌های حذف‌شده نیاز دارید:** با `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` دوباره اجرا کنید و `matrix-qa-observed-events.json` را پیوست کنید. با مصنوع حاصل به‌عنوان داده حساس رفتار کنید.
- **نسخه متفاوت Tuwunel:** `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` را به نسخه تحت آزمایش اشاره دهید. این lane فقط تصویر پیش‌فرض پین‌شده را بررسی می‌کند.

## قرارداد انتقال زنده

Matrix یکی از سه lane انتقال زنده (Matrix، Telegram، Discord) است که یک چک‌لیست قراردادی واحد تعریف‌شده در [نمای کلی QA → پوشش انتقال زنده](/fa/concepts/qa-e2e-automation#live-transport-coverage) را به اشتراک می‌گذارند. `qa-channel` همچنان مجموعه مصنوعی گسترده است و عمداً بخشی از آن matrix نیست.

## مرتبط

- [نمای کلی QA](/fa/concepts/qa-e2e-automation) - پشته کلی QA و قرارداد انتقال زنده
- [کانال QA](/fa/channels/qa-channel) - آداپتور کانال مصنوعی برای سناریوهای پشتیبانی‌شده با مخزن
- [آزمایش](/fa/help/testing) - اجرای آزمایش‌ها و افزودن پوشش QA
- [Matrix](/fa/channels/matrix) - Plugin کانال تحت آزمایش
