---
read_when:
    - می‌خواهید خلاصه‌های ذخیره‌شدهٔ رونوشت‌ها را از ترمینال بخوانید
    - به مسیرِ خلاصهٔ مارک‌داونِ رونوشت‌ها نیاز دارید
    - شما در حال اشکال‌زدایی چیدمان ذخیره‌سازی رونوشت‌های هسته هستید
summary: مرجع CLI برای `openclaw transcripts` (فهرست‌کردن، نمایش و یافتن رونوشت‌های ذخیره‌شده)
title: CLI رونوشت‌ها
x-i18n:
    generated_at: "2026-07-12T09:51:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde02e924339c64cf6acd5c4b6162785dcfccf4a1df2aac0d9d52d5306511579
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

بازرس فقط‌خواندنی برای رونوشت‌هایی که ابزار عامل `transcripts` می‌نویسد.
ضبط، واردکردن و خلاصه‌سازی از طریق همان ابزار انجام می‌شود، نه این CLI.

مصنوعات در زیر شاخهٔ وضعیت قرار دارند:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

شاخهٔ وضعیت پیش‌فرض `~/.openclaw` است؛ برای بازنویسی آن از `OPENCLAW_STATE_DIR` استفاده کنید.
شاخهٔ تاریخ از زمان شروع نشست گرفته می‌شود؛ شاخهٔ نشست یک نامک امن برای سامانهٔ فایل است که از شناسهٔ نشست ساخته می‌شود.

## فرمان‌ها

```bash
openclaw transcripts list
openclaw transcripts show <session>
openclaw transcripts show YYYY-MM-DD/<session>
openclaw transcripts path <session>
openclaw transcripts path YYYY-MM-DD/<session>
openclaw transcripts path <session> --dir
openclaw transcripts path <session> --metadata
openclaw transcripts path <session> --transcript
openclaw transcripts list --json
openclaw transcripts show <session> --json
openclaw transcripts path <session> --json
```

| فرمان                         | توضیحات                                                  |
| ----------------------------- | -------------------------------------------------------- |
| `list`                        | نشست‌های ذخیره‌شده را فهرست می‌کند.                      |
| `show <session>`              | فایل ذخیره‌شدهٔ `summary.md` را چاپ می‌کند.              |
| `path <session>`              | مسیر `summary.md` را چاپ می‌کند.                         |
| `path <session> --dir`        | شاخهٔ نشست را چاپ می‌کند.                                |
| `path <session> --metadata`   | فایل `metadata.json` را چاپ می‌کند.                      |
| `path <session> --transcript` | فایل `transcript.jsonl` را چاپ می‌کند.                   |
| `--json`                      | خروجی ماشین‌خوان را چاپ می‌کند (برای هر زیرفرمان).       |

`<session>` یک شناسهٔ نشست ساده یا یک گزینش‌گر دارای تاریخ
(`YYYY-MM-DD/<session>`) را می‌پذیرد. وقتی یک شناسهٔ نشست در بیش از یک روز
وجود دارد، از قالب دارای تاریخ استفاده کنید؛ برای مثال `openclaw transcripts show
2026-05-22/standup`. شناسه‌های پیش‌فرض نشست شامل مُهر زمانی و پسوندی تصادفی
هستند؛ تنها زمانی به نشست شناسه‌ای ثابت بدهید که آن شناسه در همان روز یکتا باشد.

## خروجی

`list` برای هر نشست یک خط با مقادیر جداشده با نویسهٔ تب چاپ می‌کند: گزینش‌گر، زمان شروع، عنوان و
مسیر خلاصه.

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  جلسهٔ هماهنگی هفتگی  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

گزینش‌گر امن‌ترین مقداری است که می‌توان دوباره به `show` یا `path` داد.

`list --json` اشیایی با `sessionId`، `selector`، `date`، `title`،
`startedAt`، `stoppedAt`، `source`، `path`، `summaryPath` و `hasSummary` برمی‌گرداند.

`show --json` فرادادهٔ ذخیره‌شدهٔ نشست، گزینش‌گر، شاخهٔ نشست،
مسیر خلاصه و متن Markdown خلاصه را برمی‌گرداند.

`path --json` مسیر انتخاب‌شده و موجودبودن آن فایل را برمی‌گرداند.

## چندین نشست در هر روز

نشست‌ها ابتدا بر اساس تاریخ و سپس بر اساس شناسهٔ نشست گروه‌بندی می‌شوند. ده جلسه در یک روز به
ده پوشهٔ هم‌سطح تبدیل می‌شوند:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

برای خودکارسازی از شناسه‌های تولیدشدهٔ پیش‌فرض استفاده کنید. تنها زمانی از یک شناسهٔ ثابت مانند `standup` استفاده کنید
که در همان تاریخ تکرار نشود.

## خلاصه‌های مفقود

نشست‌های زنده هنگام توقف نشست، `summary.md` را می‌نویسند؛ رونوشت‌های واردشده
آن را بلافاصله پس از واردکردن می‌نویسند. ممکن است یک نشست بدون خلاصه در `list`
ظاهر شود، اگر ضبط همچنان فعال باشد، ارائه‌دهنده‌ای هنگام توقف ناموفق شده باشد، یا
فراداده پیش از رسیدن هر گفتاری نوشته شده باشد.

برای بررسی رونوشت خامِ فقط‌افزودنی از `path <session> --transcript` استفاده کنید،
یا کنش `summarize` ابزار `transcripts` را اجرا کنید تا خلاصهٔ Markdown
دوباره تولید شود.

## پیکربندی

ضبط نیازمند فعال‌سازی صریح است (منابع زنده می‌توانند بپیوندند و صدای جلسه را ضبط کنند). آن را
با پیکربندی زیر فعال کنید:

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

- `enabled` (پیش‌فرض `false`): ابزار را فعال می‌کند.
- `maxUtterances` (پیش‌فرض `2000`، محدودشده به 1-10000): اندازهٔ میانگیر گفتار برای هر
  نشست.

منابع شروع خودکار را با `transcripts.autoStart` پیکربندی کنید. هر ورودی با موجودبودن
فعال می‌شود؛ برای غیرفعال‌کردن آن منبع، ورودی‌اش را حذف کنید. `discord-voice`
منبع همراهِ دارای قابلیت شروع خودکار است و به `guildId` و
`channelId` نیاز دارد:

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      }
    ]
  }
}
```
