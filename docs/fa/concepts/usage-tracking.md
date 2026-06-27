---
read_when:
    - در حال اتصال سطوح استفاده/سهمیهٔ ارائه‌دهنده هستید
    - باید رفتار ردیابی استفاده یا الزامات احراز هویت را توضیح دهید
summary: سطوح رهگیری مصرف و الزامات اعتبارنامه
title: ردیابی استفاده
x-i18n:
    generated_at: "2026-06-27T17:38:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 953f9671093c26f874b19fc0e6f8aee0ebf3379d4a6698bc8548abf942e37a59
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## چیستی آن

- استفاده/سهمیه ارائه‌دهنده را مستقیما از endpointهای استفاده آن‌ها می‌گیرد.
- بدون هزینه‌های تخمینی؛ فقط پنجره‌های سهمیه گزارش‌شده توسط ارائه‌دهنده یا خلاصه‌های وضعیت حساب.
- خروجی وضعیت پنجره سهمیه خوانا برای انسان به `X% left` نرمال‌سازی می‌شود، حتی وقتی API بالادستی سهمیه مصرف‌شده، سهمیه باقی‌مانده، یا فقط شمارش‌های خام را گزارش کند. ارائه‌دهندگانی که پنجره‌های سهمیه قابل بازنشانی ندارند، می‌توانند به‌جای آن متن خلاصه ارائه‌دهنده، مثل موجودی، نشان دهند.
- `/status` در سطح نشست و `session_status` می‌توانند وقتی snapshot زنده نشست کم‌جزئیات است، به آخرین ورودی استفاده transcript برگردند. این fallback شمارنده‌های token/cache گمشده را پر می‌کند، می‌تواند برچسب مدل runtime فعال را بازیابی کند، و وقتی metadata نشست موجود نیست یا کوچک‌تر است، جمع بزرگ‌ترِ مبتنی بر prompt را ترجیح می‌دهد. مقدارهای زنده غیرصفر موجود همچنان اولویت دارند.

## کجا نمایش داده می‌شود

- `/status` در چت‌ها: کارت وضعیت سرشار از emoji با tokenهای نشست + هزینه تخمینی (فقط کلید API). استفاده ارائه‌دهنده برای **ارائه‌دهنده مدل فعلی**، وقتی موجود باشد، به‌صورت پنجره نرمال‌شده `X% left` یا متن خلاصه ارائه‌دهنده نشان داده می‌شود.
- `/usage off|tokens|full` در چت‌ها: footer استفاده برای هر پاسخ (OAuth فقط tokenها را نشان می‌دهد).
- `/usage cost` در چت‌ها: خلاصه هزینه محلی که از لاگ‌های نشست OpenClaw تجمیع شده است.
- CLI: `openclaw status --usage` breakdown کامل برای هر ارائه‌دهنده را چاپ می‌کند.
- CLI: `openclaw channels list` همان snapshot استفاده را کنار پیکربندی ارائه‌دهنده چاپ می‌کند (برای رد شدن از `--no-usage` استفاده کنید).
- نوار منوی macOS: بخش «Usage» زیر Context (فقط اگر موجود باشد).

## حالت پیش‌فرض footer استفاده

`/usage off|tokens|full` footer را برای یک نشست تنظیم می‌کند و برای همان نشست به‌خاطر سپرده می‌شود. `messages.responseUsage` این حالت را برای نشست‌هایی که هنوز یکی را انتخاب نکرده‌اند مقداردهی اولیه می‌کند، تا footer بتواند بدون تایپ کردن هر بارِ `/usage` به‌طور پیش‌فرض روشن باشد.

یک حالت برای همه کانال‌ها تنظیم کنید، یا یک نگاشت برای هر کانال با fallback به `default`:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### سه وضعیت متمایز نشست

فیلد `responseUsage` یک نشست سه وضعیت قابل نمایش دارد، که هرکدام semantics متفاوتی دارند:

| وضعیت               | مقدار ذخیره‌شده                    | حالت مؤثر                                                        |
| ------------------- | ------------------------------- | --------------------------------------------------------------------- |
| **تنظیم‌نشده / ارث‌بری** | `undefined` (غایب)            | به پیش‌فرض پیکربندی `messages.responseUsage` و سپس `off` می‌رسد. |
| **خاموش صریح**    | `"off"` (ذخیره‌شده)                | همیشه خاموش - پیش‌فرض پیکربندی غیرخاموش نمی‌تواند footer را دوباره فعال کند.    |
| **روشن صریح**     | `"tokens"` یا `"full"` (ذخیره‌شده) | همان حالت، فارغ از پیش‌فرض پیکربندی.                              |

### اولویت

حالت مؤثر = override نشست → ورودی پیکربندی کانال → `default` → `off`.

یک `/usage off` صریح به‌صورت مقدار لفظی `"off"` در نشست **persist** می‌شود، نه همانند «تنظیم‌نشده». یعنی پیش‌فرض غیرخاموش `messages.responseUsage` پس از اینکه کاربر صریحا آن را غیرفعال کرد، نمی‌تواند footer را دوباره روشن کند.

### بازنشانی در برابر خاموش کردن

- `/usage off` - footer را اجبارا خاموش می‌کند و آن انتخاب را persist می‌کند. پیش‌فرض پیکربندی‌شده غیرخاموش نمی‌تواند این را override کند.
- `/usage reset` (aliasها: `inherit`، `clear`، `default`) - override نشست را پاک می‌کند. سپس نشست پیش‌فرض پیکربندی مؤثر (`messages.responseUsage`) را **به ارث می‌برد**. اگر هیچ پیش‌فرضی پیکربندی نشده باشد، footer خاموش است (بدون تغییر نسبت به قبل). از این برای «بازگشت به پیش‌فرض» بدون روشن کردن صریح footer استفاده کنید.
- بازنشانی کامل نشست (`/reset` یا `/new`) یا rollover نشست، ترجیح صریح حالت استفاده را **حفظ می‌کند** تا انتخاب نمایش کاربر در rolloverهای نشست باقی بماند. فقط `/usage reset` (و aliasهایش) واقعا override را پاک می‌کند.

### رفتار تغییر وضعیت

`/usage` بدون آرگومان‌ها چرخه می‌زند: off → tokens → full → off. نقطه شروع چرخه حالت فعلی **مؤثر** است (override نشست وقتی تنظیم نشده باشد به پیش‌فرض پیکربندی می‌رسد)، بنابراین چرخه همیشه با چیزی که کاربر در footer می‌بیند سازگار است.

### پیکربندی

بدون پیکربندی، رفتار قبلی برقرار می‌ماند (footer خاموش تا زمان `/usage`). از `/usage reset` برای پاک کردن override نشست و ارث‌بری دوباره از پیش‌فرض پیکربندی‌شده استفاده کنید.

## footer سفارشی `/usage full`

`/usage full` وقتی فیلدها موجود باشند، یک footer compact داخلی با مدل، reasoning، fast/slow، پنجره context، tokenهای turn، cache، و هزینه نشان می‌دهد. هیچ فایل template لازم نیست.

`messages.usageTemplate` فقط برای چیدمان‌های سفارشی پیشرفته است. مقدار آن مسیر فایل JSON (با پشتیبانی از `~`) یا یک شیء inline است، و وقتی معتبر باشد جایگزین footer داخلی می‌شود:

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

templateهای گمشده یا خالی بی‌سروصدا به footer داخلی fallback می‌کنند. templateهای پیکربندی‌شده خواندنی‌نبودنی یا نامعتبر نیز به footer داخلی fallback می‌کنند و یک هشدار operator صادر می‌کنند.

templateهای سفارشی را از شکل داخلی شروع کنید، سپس بخش‌هایی را که می‌خواهید تغییر دهید ویرایش کنید:

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": {
    "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿",
    "block": "░▏▎▍▌▋▊▉█",
    "shade": "░▒▓█",
    "moon": "🌑🌘🌗🌖🌕",
    "level": "▁▂▃▄▅▆▇█",
    "weather": ["🥶", "☁️", "🌥", "⛅️", "🌤", "☀️"],
    "plants": ["🪾", "🍂", "🌱", "☘️", "🍀", "🌿"],
    "moons6": ["🌑", "🌚", "🌘", "🌗", "🌖", "🌝"],
  },
  "aliases": {
    "models": {
      "claude-opus-4-6": "opus46",
      "claude-opus-4-8": "opus48",
      "claude-sonnet-4-6": "sonnet46",
      "claude-haiku-4-5": "haiku45",
      "gpt-5.5": "gpt5.5",
    },
    "reasoning": {
      "off": "🌑",
      "minimal": "🌚",
      "low": "🌘",
      "medium": "🌗",
      "high": "🌕",
      "xhigh": "🌝",
    },
  },
  "output": {
    "sep": "",
    "default": [
      { "text": "{model.provider}{identity.emoji|🤖} {model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": " 🔄" } },
      { "map": "model.is_override", "cases": { "true": " 📌" } },
      { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
      {
        "when": "context.max_tokens",
        "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      {
        "when": "usage.has_split_tokens",
        "text": " ↕️ {usage.input_tokens|num|?}/{usage.output_tokens|num|?}",
      },
      { "when": "usage.has_total_only_tokens", "text": " ↕️ {usage.total_tokens|num}" },
      { "when": "usage.cache_hit_pct", "text": " 🗄 {usage.cache_hit_pct|pct}" },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖} {model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡️", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        {
          "when": "usage.has_split_tokens",
          "text": " ↕️ {usage.input_tokens|num|?}/{usage.output_tokens|num|?}",
        },
        { "when": "usage.has_total_only_tokens", "text": " ↕️ {usage.total_tokens|num}" },
        { "when": "usage.cache_hit_pct", "text": " 🗄 {usage.cache_hit_pct|pct}" },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### شکل

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // string (1 glyph/char) or array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // joins surviving pieces
    "default": [
      /* pieces */
    ], // fallback for any surface
    "surfaces": {
      "discord": [
        /* pieces */
      ],
      "telegram": [
        /* pieces */
      ],
    },
  },
}
```

هر surface فهرستی مرتب از **piece**ها است؛ engine هرکدام را render می‌کند، موارد خالی را حذف می‌کند، و باقی‌مانده‌ها را با `sep` به هم وصل می‌کند. surface بدون ورودی از `output.default` استفاده می‌کند.

### مسیرهای قرارداد

یک piece مقدارها را از قرارداد هر turn با dot-path می‌خواند. مقدارهای غایب خالی هستند (پس guard با `when` یا `|fallback` piece را تمیز نگه می‌دارد).

| مسیر                                                                                | معنا                                |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| `surface`                                                                           | شناسه کانال (`discord`/`telegram`/و غیره) |
| `model.provider` / `model.display_name`                                             | شناسه ارائه‌دهنده / شناسه مدل                 |
| `model.reasoning`                                                                   | effort (`off` تا `xhigh`)         |
| `model.is_fallback` / `model.is_override`                                           | bool: fallback استفاده‌شده / مدل pin شده     |
| `state.fast_mode`                                                                   | bool: سریع در برابر کند                     |
| `context.max_tokens` / `context.pct_used`                                           | بودجه پنجره / 0-100 استفاده‌شده             |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | تجمیع turn                         |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct`    | guardهای نمایش token و درصد cache |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | فقط فراخوانی نهایی مدل                  |
| `cost.turn_usd`                                                                     | هزینه تخمینی turn                    |
| `identity.name` / `identity.emoji`                                                  | نام agent / emoji انتخاب‌شده              |

(پنجره‌های rate-limit ارائه‌دهنده در این قرارداد **نیستند**.)

### فعل‌ها

یک مقدار را از چپ به راست از میان فعل‌ها عبور دهید؛ segment غیر‌فعل fallback است.

| فعل            | اثر                                | مثال                           |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | شمارش compact                         | `272000 -> 272k`                  |
| `fixed:N`       | N رقم اعشار (پیش‌فرض 2)                | `0.0377`                          |
| `dur`           | ثانیه به duration                   | `14820 -> 4h07m`                  |
| `pct`           | افزودن `%`                            | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | برای تبدیل استفاده‌شده به باقی‌مانده             |
| `alias:TABLE`   | lookup در `aliases`، echo اگر فهرست نشده باشد | `medium -> 🌗`                    |
| `meter:W:SCALE` | نوار glyph با W سلول روی مقدار 0-100   | `[⣿⣿⠐⠐⠐]` (`meter:1` = یک glyph) |

### شکل‌های piece

- `{ "text": "📚 {context.max_tokens|num}" }`: literal + interpolation.
- `{ "when": "<path>", "text": "..." }`: فقط اگر path truthy باشد render می‌کند.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: مقدار به glyph.
- `{ "each": "limits.windows", "item": "{label}" }`: روی یک array iterate می‌کند.

### مثال

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿" },
  "aliases": { "reasoning": { "medium": "🌗", "high": "🌕" } },
  "output": {
    "surfaces": {
      "discord": [
        { "text": "{model.display_name}" },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
      ],
    },
  },
}
```

برای نمونه `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k` را رندر می‌کند.

## ارائه‌دهندگان + اعتبارنامه‌ها

- **Anthropic (Claude)**: توکن‌های OAuth در پروفایل‌های احراز هویت.
- **GitHub Copilot**: توکن‌های OAuth در پروفایل‌های احراز هویت.
- **Gemini CLI**: توکن‌های OAuth در پروفایل‌های احراز هویت.
  - مصرف JSON به `stats` برمی‌گردد؛ `stats.cached` به
    `cacheRead` نرمال‌سازی می‌شود.
- **OpenAI Codex**: توکن‌های OAuth در پروفایل‌های احراز هویت (در صورت وجود، از accountId استفاده می‌شود).
- **MiniMax**: کلید API یا پروفایل احراز هویت OAuth MiniMax. OpenClaw
  `minimax`، `minimax-cn` و `minimax-portal` را به‌عنوان یک سطح سهمیه MiniMax
  یکسان در نظر می‌گیرد، در صورت وجود OAuth ذخیره‌شده MiniMax را ترجیح می‌دهد، و در غیر این صورت
  به `MINIMAX_CODE_PLAN_KEY`، `MINIMAX_CODING_API_KEY` یا `MINIMAX_API_KEY` برمی‌گردد.
  نظرسنجی مصرف، میزبان Coding Plan را هنگام پیکربندی از `models.providers.minimax-portal.baseUrl`
  یا `models.providers.minimax.baseUrl` استخراج می‌کند، و در غیر این صورت از
  میزبان MiniMax CN استفاده می‌کند.
  فیلدهای خام `usage_percent` / `usagePercent` در MiniMax به معنی سهمیه
  **باقی‌مانده** هستند، بنابراین OpenClaw پیش از نمایش آن‌ها را معکوس می‌کند؛ فیلدهای مبتنی بر شمارش
  در صورت وجود اولویت دارند.
  - برچسب‌های پنجره coding-plan در صورت وجود از فیلدهای ساعت/دقیقه ارائه‌دهنده
    می‌آیند، سپس به بازه `start_time` / `end_time` برمی‌گردند.
  - اگر نقطه پایانی coding-plan مقدار `model_remains` را برگرداند، OpenClaw ورودی
    مدل چت را ترجیح می‌دهد، وقتی فیلدهای صریح
    `window_hours` / `window_minutes` غایب باشند برچسب پنجره را از timestampها استخراج می‌کند، و نام مدل
    را در برچسب طرح وارد می‌کند.
- **Xiaomi MiMo**: کلید API از طریق env/config/auth store (`XIAOMI_API_KEY`).
- **z.ai**: کلید API از طریق env/config/auth store.
- **DeepSeek**: کلید API از طریق env/config/auth store (`DEEPSEEK_API_KEY`).
  OpenClaw نقطه پایانی موجودی DeepSeek را فراخوانی می‌کند و موجودی گزارش‌شده توسط ارائه‌دهنده
  را به‌جای پنجره سهمیه درصدِ باقی‌مانده، به‌صورت متن نشان می‌دهد.

وقتی هیچ احراز هویت قابل استفاده‌ای برای مصرف ارائه‌دهنده قابل حل نباشد، مصرف پنهان می‌شود. ارائه‌دهندگان
می‌توانند منطق احراز هویت مصرف ویژه Plugin را فراهم کنند؛ در غیر این صورت OpenClaw به
اعتبارنامه‌های OAuth/API-key منطبق از پروفایل‌های احراز هویت، متغیرهای محیطی،
یا config برمی‌گردد.

## مرتبط

- [استفاده از توکن و هزینه‌ها](/fa/reference/token-use)
- [مصرف API و هزینه‌ها](/fa/reference/api-usage-costs)
- [کش کردن پرامپت](/fa/reference/prompt-caching)
