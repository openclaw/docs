---
read_when:
    - در حال مدیریت Nodeهای جفت‌شده هستید (دوربین‌ها، صفحه‌نمایش، بوم)
    - باید درخواست‌ها را تأیید کنید یا فرمان‌های Node را فراخوانی کنید
summary: مرجع CLI برای `openclaw nodes` (وضعیت، جفت‌سازی، فراخوانی، دوربین/بوم/صفحه‌نمایش/موقعیت مکانی/اعلان)
title: Nodeها
x-i18n:
    generated_at: "2026-07-16T15:47:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5b57235006d803fe09f626a65157dfb1f620d3d3c6f337e33132bcffdf4f1e37
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Nodeهای جفت‌شده (دستگاه‌ها) را مدیریت و قابلیت‌های Node را فراخوانی کنید.

مرتبط: [نمای کلی Nodeها](/fa/nodes) - [حضور رایانه فعال](/nodes/presence) - [Nodeهای دوربین](/fa/nodes/camera) - [Nodeهای تصویر](/fa/nodes/images)

گزینه‌های مشترک در همه زیرفرمان‌ها: `--url <url>`، `--token <token>`، `--timeout <ms>` (پیش‌فرض `10000`)، `--json`.

## وضعیت

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

هر دو `status` و `list`، گزینه‌های `--connected` (فقط Nodeهای متصل) و `--last-connected <duration>` (برای مثال `24h`، `7d`؛ فقط Nodeهایی که در طول مدت مشخص‌شده متصل شده‌اند) را می‌پذیرند. `list`، Nodeهای در انتظار و جفت‌شده را در جدول‌های جداگانه نمایش می‌دهد و ردیف‌های جفت‌شده شامل مدت‌زمان سپری‌شده از آخرین اتصال (Last Connect) هستند؛ `status` یک جدول ادغام‌شده را با جزئیات قابلیت، نسخه و آخرین ورودی هر Node نمایش می‌دهد. یک Node متصل macOS، آخرین ورودی را فقط زمانی گزارش می‌کند که مجوز Accessibility اعطا شده باشد و تازه‌ترین ردیف با `active` علامت‌گذاری می‌شود؛ به [حضور رایانه فعال](/nodes/presence) مراجعه کنید. `describe` قابلیت‌ها، مجوزها، فعالیت و فرمان‌های فراخوانی مؤثر/در انتظار یک Node را چاپ می‌کند.

## جفت‌سازی

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

این فرمان‌ها مخزن `node.pair.*` متعلق به Gateway را کنترل می‌کنند که از جفت‌سازی دستگاه (`openclaw devices approve`)، که دست‌دهی `connect` مربوط به WS در Node را کنترل می‌کند، جدا است. برای آگاهی از ارتباط این دو، به [Nodeها](/fa/nodes) مراجعه کنید.

- `remove` ورودی نقش جفت‌شده Node را لغو می‌کند. برای یک Node مبتنی بر دستگاه، این کار نقش `node` را در مخزن جفت‌سازی دستگاه لغو و نشست‌های نقش Node آن را قطع می‌کند: دستگاهی با چند نقش، ردیف خود را حفظ می‌کند و فقط نقش `node` را از دست می‌دهد؛ ردیف دستگاهی که فقط نقش Node دارد حذف می‌شود. همچنین هر رکورد منطبق قدیمی جفت‌سازی Node متعلق به Gateway را پاک می‌کند.
- `pending` فقط به محدوده `operator.pairing` نیاز دارد.
- `gateway.nodes.pairing.autoApproveCidrs` می‌تواند برای جفت‌سازی دستگاه `role: node` در نخستین بار و با اعتماد صریح، مرحله انتظار را رد کند. به‌طور پیش‌فرض غیرفعال است؛ ارتقای نقش‌ها را تأیید نمی‌کند.
- `gateway.nodes.pairing.sshVerify` (به‌طور پیش‌فرض فعال) جفت‌سازی دستگاه `role: node` را در نخستین بار، هنگامی‌که Gateway بتواند کلید دستگاه را از طریق SSH به میزبان Node تأیید کند، به‌طور خودکار تأیید می‌کند؛ نخستین سطح قابلیت نیز در همان مرحله تأیید می‌شود. به [جفت‌سازی Node](/fa/gateway/pairing#ssh-verified-device-auto-approval-default) مراجعه کنید.
- الزامات محدوده `approve` از فرمان‌های اعلام‌شده درخواست در انتظار پیروی می‌کنند:
  - درخواست بدون فرمان: `operator.pairing`
  - فرمان‌های عادی Node: `operator.pairing` + `operator.write`
  - فرمان‌های حساس از نظر مدیریتی (`system.run`، `system.run.prepare`، `system.which`، `browser.proxy`، `fs.listDir` و `system.execApprovals.get/set`): `operator.pairing` + `operator.admin`
- محدوده `remove`: ‏`operator.pairing` می‌تواند ردیف‌های Node غیرعملگر را حذف کند؛ فراخواننده‌ای با توکن دستگاه که نقش Node خود را در دستگاهی با چند نقش لغو می‌کند، علاوه بر آن به `operator.admin` نیاز دارد.

## فراخوانی

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

پرچم‌ها:

- `--command <command>` (الزامی): برای مثال `canvas.eval`.
- `--params <json>`: رشته شیء JSON (پیش‌فرض `{}`).
- `--invoke-timeout <ms>`: مهلت زمانی فراخوانی Node (پیش‌فرض `15000`).
- `--idempotency-key <key>`: کلید اختیاری هم‌توانی.

`system.run` و `system.run.prepare` در اینجا مسدود هستند؛ در عوض برای اجرای پوسته از ابزار `exec` همراه با `host=node` استفاده کنید. `system.which` از طریق `invoke` مجاز است.

## اعلان، پوش، موقعیت مکانی، صفحه‌نمایش

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` یک اعلان محلی به Nodeای ارسال می‌کند که `system.notify` را اعلام کرده است؛ از جمله Nodeهای macOS،‏ iOS،‏ Android و watchOS مستقیم. تحویل مستقیم به watchOS مستلزم فعال‌بودن OpenClaw است. به `--title` یا `--body` نیاز دارد. گزینه‌ها: `--sound <name>`، `--priority <passive|active|timeSensitive>`، `--delivery <system|overlay|auto>` (پیش‌فرض `system`)، `--invoke-timeout <ms>` (پیش‌فرض `15000`).
- `push` یک پوش آزمایشی APNs به یک Node مبتنی بر iOS ارسال می‌کند. گزینه‌ها: `--title <text>` (پیش‌فرض `OpenClaw`)، `--body <text>`، `--environment <sandbox|production>` برای نادیده‌گرفتن محیط APNs شناسایی‌شده.
- `location get` موقعیت مکانی فعلی Node را دریافت می‌کند. گزینه‌ها: `--max-age <ms>` (استفاده مجدد از تعیین موقعیت ذخیره‌شده)، `--accuracy <coarse|balanced|precise>`، `--location-timeout <ms>` (پیش‌فرض `10000`)، `--invoke-timeout <ms>` (پیش‌فرض `20000`).
- `screen record` یک کلیپ کوتاه ضبط و مسیر ذخیره‌شده را چاپ می‌کند (یا با `--json`، JSON می‌نویسد). گزینه‌ها: `--screen <index>` (پیش‌فرض `0`)، `--duration <ms|10s>` (پیش‌فرض `10000`)، `--fps <fps>` (پیش‌فرض `10`)، `--no-audio`، `--out <path>`، `--invoke-timeout <ms>` (پیش‌فرض `120000`).

فرمان‌های دوربین و Canvas مستندات جداگانه‌ای دارند: [Nodeهای دوربین](/fa/nodes/camera)، [Canvas](/fa/platforms/mac/canvas). ‏Canvas توسط Plugin آزمایشی همراه Canvas پیاده‌سازی شده است؛ هسته، `openclaw nodes canvas` را به‌عنوان نقطه اتصال سازگاری حفظ می‌کند.

## مرتبط

- [مرجع CLI](/fa/cli)
- [Nodeها](/fa/nodes)
