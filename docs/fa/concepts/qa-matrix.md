---
read_when:
    - اجرای pnpm openclaw qa matrix به‌صورت محلی
    - افزودن یا انتخاب سناریوهای تضمین کیفیت Matrix
    - رسیدگی به شکست‌های QA در Matrix، اتمام مهلت‌ها، یا پاک‌سازی گیرکرده
summary: 'مرجع نگه‌دارنده برای مسیر QA زنده Matrix مبتنی بر Docker: CLI، پروفایل‌ها، متغیرهای محیطی، سناریوها و آرتیفکت‌های خروجی.'
title: تضمین کیفیت Matrix
x-i18n:
    generated_at: "2026-04-29T22:45:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab862474e2abe45a1dcd66f025e3a3dd52a3417b0c1f42a26cd7944dd4053f5
    source_path: concepts/qa-matrix.md
    workflow: 16
---

لاین QA مربوط به Matrix، Plugin بسته‌بندی‌شده‌ی `@openclaw/matrix` را در برابر یک homeserver یک‌بارمصرف Tuwunel در Docker اجرا می‌کند، با حساب‌های موقت driver، SUT و observer به‌همراه اتاق‌های ازپیش‌ساخته‌شده. این پوشش زنده و واقعیِ ترابری برای Matrix است.

این ابزار فقط برای نگه‌دارندگان است. انتشارهای بسته‌بندی‌شده‌ی OpenClaw عمداً `qa-lab` را حذف می‌کنند، بنابراین `openclaw qa` فقط از طریق checkout منبع در دسترس است. checkoutهای منبع runner بسته‌بندی‌شده را مستقیماً بارگذاری می‌کنند — هیچ مرحله‌ی نصب Plugin لازم نیست.

برای زمینه‌ی گسترده‌تر چارچوب QA، به [نمای کلی QA](/fa/concepts/qa-e2e-automation) مراجعه کنید.

## شروع سریع

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

دستور ساده‌ی `pnpm openclaw qa matrix` با `--profile all` اجرا می‌شود و با اولین شکست متوقف نمی‌شود. برای دروازه‌ی انتشار از `--profile fast --fail-fast` استفاده کنید؛ هنگام اجرای کل فهرست به‌صورت موازی، کاتالوگ را با `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` shard کنید.

## این لاین چه کاری انجام می‌دهد

1. یک homeserver یک‌بارمصرف Tuwunel را در Docker آماده می‌کند (تصویر پیش‌فرض `ghcr.io/matrix-construct/tuwunel:v1.5.1`، نام سرور `matrix-qa.test`، پورت `28008`).
2. سه کاربر موقت ثبت می‌کند — `driver` (ترافیک ورودی را می‌فرستد)، `sut` (حساب Matrix متعلق به OpenClaw تحت آزمون)، `observer` (ضبط ترافیک شخص ثالث).
3. اتاق‌های موردنیاز سناریوهای انتخاب‌شده را آماده می‌کند (اصلی، threading، رسانه، restart، ثانویه، allowlist، E2EE، verification DM و غیره).
4. یک Gateway فرزند OpenClaw را با Plugin واقعی Matrix و محدود به حساب SUT شروع می‌کند؛ `qa-channel` در فرزند بارگذاری نمی‌شود.
5. سناریوها را به‌ترتیب اجرا می‌کند و رویدادها را از طریق کلاینت‌های Matrix مربوط به driver/observer مشاهده می‌کند.
6. homeserver را جمع‌آوری می‌کند، artifactهای گزارش و خلاصه را می‌نویسد، سپس خارج می‌شود.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### فلگ‌های رایج

| فلگ                  | پیش‌فرض                                       | توضیح                                                                                                            |
| --------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | پروفایل سناریو. [پروفایل‌ها](#profiles) را ببینید.                                                                           |
| `--fail-fast`         | خاموش                                           | پس از اولین check یا سناریوی ناموفق متوقف شود.                                                                         |
| `--scenario <id>`     | —                                             | فقط این سناریو را اجرا کند. قابل تکرار است. [سناریوها](#scenarios) را ببینید.                                                       |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | محل نوشتن گزارش‌ها، خلاصه، رویدادهای مشاهده‌شده و لاگ خروجی. مسیرهای نسبی نسبت به `--repo-root` resolve می‌شوند. |
| `--repo-root <path>`  | `process.cwd()`                               | ریشه‌ی مخزن هنگام فراخوانی از یک دایرکتوری کاری خنثی.                                                        |
| `--sut-account <id>`  | `sut`                                         | شناسه‌ی حساب Matrix داخل پیکربندی Gateway مربوط به QA.                                                                        |

### فلگ‌های Provider

این لاین از ترابری واقعی Matrix استفاده می‌کند، اما model provider قابل پیکربندی است:

| فلگ                     | پیش‌فرض          | توضیح                                                                                                                               |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` برای dispatch mock قطعی یا `live-frontier` برای providerهای frontier زنده. نام مستعار قدیمی `live-openai` همچنان کار می‌کند. |
| `--model <ref>`          | پیش‌فرض provider | ref اصلی `provider/model`.                                                                                                             |
| `--alt-model <ref>`      | پیش‌فرض provider | ref جایگزین `provider/model` برای سناریوهایی که در میانه‌ی اجرا تغییر می‌کنند.                                                                            |
| `--fast`                 | خاموش              | فعال‌سازی حالت سریع provider در جاهایی که پشتیبانی می‌شود.                                                                                                |

QA مربوط به Matrix گزینه‌های `--credential-source` یا `--credential-role` را نمی‌پذیرد. این لاین کاربران یک‌بارمصرف را به‌صورت محلی آماده می‌کند؛ هیچ استخر credential مشترکی برای lease کردن وجود ندارد.

## پروفایل‌ها

پروفایل انتخاب‌شده تعیین می‌کند کدام سناریوها اجرا شوند.

| پروفایل         | کاربرد                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (پیش‌فرض) | کاتالوگ کامل. کند اما جامع.                                                                                                                                                                                                   |
| `fast`          | زیرمجموعه‌ی دروازه‌ی انتشار که قرارداد ترابری زنده را تمرین می‌دهد: canary، mention gating، مسدودسازی allowlist، شکل پاسخ، ازسرگیری پس از restart، پیگیری thread، جداسازی thread، مشاهده‌ی reaction و تحویل metadata مربوط به تأیید exec. |
| `transport`     | سناریوهای threading، DM، اتاق، autojoin، mention/allowlist، approval و reaction در سطح ترابری.                                                                                                                                  |
| `media`         | پوشش پیوست تصویر، audio، video، PDF و EPUB.                                                                                                                                                                                  |
| `e2ee-smoke`    | حداقل پوشش E2EE — پاسخ رمزگذاری‌شده‌ی پایه، پیگیری thread، موفقیت bootstrap.                                                                                                                                                  |
| `e2ee-deep`     | سناریوهای جامع E2EE برای state-loss، backup، key و recovery.                                                                                                                                                                     |
| `e2ee-cli`      | سناریوهای CLI مربوط به `openclaw matrix encryption setup` و `verify *` که از طریق harness مربوط به QA هدایت می‌شوند.                                                                                                                                       |

نگاشت دقیق در `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts` قرار دارد.

## سناریوها

فهرست کامل شناسه‌های سناریو همان union با نام `MatrixQaScenarioId` در `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15` است. دسته‌ها شامل این موارد هستند:

- threading — `matrix-thread-*`، `matrix-subagent-thread-spawn`
- سطح بالا / DM / اتاق — `matrix-top-level-reply-shape`، `matrix-room-*`، `matrix-dm-*`
- streaming و پیشرفت ابزار — `matrix-room-partial-streaming-preview`، `matrix-room-quiet-streaming-preview`، `matrix-room-tool-progress-*`، `matrix-room-block-streaming`
- رسانه — `matrix-media-type-coverage`، `matrix-room-image-understanding-attachment`، `matrix-attachment-only-ignored`، `matrix-unsupported-media-safe`
- routing — `matrix-room-autojoin-invite`، `matrix-secondary-room-*`
- reactions — `matrix-reaction-*`
- approvals — `matrix-approval-*` (metadata مربوط به exec/plugin، fallback تکه‌تکه، deny reactions، threads و routing با `target: "both"`)
- restart و replay — `matrix-restart-*`، `matrix-stale-sync-replay-dedupe`، `matrix-room-membership-loss`، `matrix-homeserver-restart-resume`، `matrix-initial-catchup-then-incremental`
- mention gating، bot-to-bot و allowlistها — `matrix-mention-*`، `matrix-allowbots-*`، `matrix-allowlist-*`، `matrix-multi-actor-ordering`، `matrix-inbound-edit-*`، `matrix-mxid-prefixed-command-block`، `matrix-observer-allowlist-override`
- E2EE — `matrix-e2ee-*` (پاسخ پایه، پیگیری thread، bootstrap، چرخه‌ی عمر recovery key، گونه‌های state-loss، رفتار backup سرور، بهداشت device، راستی‌آزمایی SAS / QR / DM، restart، redaction artifact)
- CLI مربوط به E2EE — `matrix-e2ee-cli-*` (راه‌اندازی encryption، راه‌اندازی idempotent، شکست bootstrap، چرخه‌ی عمر recovery-key، چندحسابی، round-trip پاسخ Gateway، self-verification)

برای اجرای یک مجموعه‌ی دست‌چین‌شده، `--scenario <id>` را پاس بدهید (قابل تکرار)؛ برای نادیده گرفتن gating پروفایل، آن را با `--profile all` ترکیب کنید.

## متغیرهای محیطی

| متغیر                                  | پیش‌فرض                                  | اثر                                                                                                                                                                                                 |
| --------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (۳۰ دقیقه)                      | سقف سخت برای کل اجرا.                                                                                                                                                                                |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | محدوده زمانی برای پاسخ اولیه canary. CI انتشار این مقدار را روی runnerهای مشترک افزایش می‌دهد تا یک نوبت کند اولیه Gateway پیش از شروع پوشش سناریو باعث شکست نشود.                                 |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | پنجره سکوت برای assertionهای منفیِ بدون پاسخ. به زمان پایان اجرای `≤` محدود می‌شود.                                                                                                                 |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | محدوده زمانی برای برچیدن Docker. سطوح شکست شامل فرمان بازیابی `docker compose ... down --remove-orphans` هستند.                                                                                    |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | هنگام اعتبارسنجی در برابر نسخه‌ای متفاوت از Tuwunel، تصویر homeserver را بازنویسی کنید.                                                                                                            |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | روشن                                     | `0` خط‌های پیشرفت `[matrix-qa] ...` را در stderr خاموش می‌کند. `1` آن‌ها را اجباری روشن می‌کند.                                                                                                    |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | ویرایش‌شده                               | `1` بدنه پیام و `formatted_body` را در `matrix-qa-observed-events.json` نگه می‌دارد. پیش‌فرض برای امن نگه داشتن artifactهای CI، آن‌ها را ویرایش می‌کند.                                            |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | خاموش                                    | `1` خروج قطعی `process.exit` پس از نوشتن artifact را رد می‌کند. پیش‌فرض خروج را اجباری می‌کند، چون handleهای رمزنگاری native در matrix-js-sdk می‌توانند پس از تکمیل artifact، event loop را زنده نگه دارند. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | تنظیم‌نشده                               | وقتی توسط یک launcher بیرونی تنظیم شود (مثلاً `scripts/run-node.mjs`)، Matrix QA به‌جای شروع tee خودش، از همان مسیر log دوباره استفاده می‌کند.                                                     |

## artifactهای خروجی

در `--output-dir` نوشته می‌شود:

- `matrix-qa-report.md` — گزارش پروتکل Markdown (چه چیزی گذشت، شکست خورد، رد شد، و چرا).
- `matrix-qa-summary.json` — خلاصه ساخت‌یافته مناسب برای parsing در CI و dashboardها.
- `matrix-qa-observed-events.json` — رویدادهای Matrix مشاهده‌شده از clientهای driver و observer. بدنه‌ها ویرایش می‌شوند مگر اینکه `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` باشد؛ metadata تأیید با فیلدهای امن منتخب و پیش‌نمایش فرمان کوتاه‌شده خلاصه می‌شود.
- `matrix-qa-output.log` — stdout/stderr ترکیب‌شده از اجرا. اگر `OPENCLAW_RUN_NODE_OUTPUT_LOG` تنظیم شده باشد، به‌جای آن از log مربوط به launcher بیرونی دوباره استفاده می‌شود.

دایرکتوری خروجی پیش‌فرض `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` است تا اجراهای پیاپی یکدیگر را بازنویسی نکنند.

## نکته‌های triage

- **اجرا نزدیک پایان معلق می‌ماند:** handleهای رمزنگاری native در `matrix-js-sdk` می‌توانند بیش از عمر harness زنده بمانند. پیش‌فرض پس از نوشتن artifact یک `process.exit` تمیز را اجباری می‌کند؛ اگر `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` را تنظیم کرده‌اید، انتظار داشته باشید process باقی بماند.
- **خطای cleanup:** فرمان بازیابی چاپ‌شده را پیدا کنید (یک فراخوانی `docker compose ... down --remove-orphans`) و آن را دستی اجرا کنید تا port مربوط به homeserver آزاد شود.
- **پنجره‌های assertion منفی flaky در CI:** وقتی CI سریع است، `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` را کاهش دهید (پیش‌فرض ۸ ثانیه)؛ روی runnerهای مشترک کند آن را افزایش دهید.
- **برای گزارش باگ به بدنه‌های ویرایش‌شده نیاز دارید:** با `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` دوباره اجرا کنید و `matrix-qa-observed-events.json` را پیوست کنید. artifact حاصل را حساس در نظر بگیرید.
- **نسخه متفاوت Tuwunel:** `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` را به نسخه تحت آزمون اشاره دهید. lane فقط تصویر پیش‌فرض pin‌شده را بررسی می‌کند.

## قرارداد انتقال زنده

Matrix یکی از سه lane انتقال زنده (Matrix، Telegram، Discord) است که یک checklist قرارداد واحد را که در [نمای کلی QA → پوشش انتقال زنده](/fa/concepts/qa-e2e-automation#live-transport-coverage) تعریف شده، به اشتراک می‌گذارند. `qa-channel` همچنان مجموعه synthetic گسترده است و عمداً بخشی از آن Matrix نیست.

## مرتبط

- [نمای کلی QA](/fa/concepts/qa-e2e-automation) — پشته کلی QA و قرارداد انتقال زنده
- [کانال QA](/fa/channels/qa-channel) — adapter کانال synthetic برای سناریوهای repo-backed
- [آزمون](/fa/help/testing) — اجرای آزمون‌ها و افزودن پوشش QA
- [Matrix](/fa/channels/matrix) — Plugin کانال تحت آزمون
