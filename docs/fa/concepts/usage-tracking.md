---
read_when:
    - شما در حال اتصال سطوح استفاده/سهمیهٔ ارائه‌دهنده هستید
    - باید رفتار رهگیری استفاده یا الزامات احراز هویت را توضیح دهید
summary: سطوح ردیابی استفاده و الزامات اعتبارنامه
title: ردیابی استفاده
x-i18n:
    generated_at: "2026-07-01T18:17:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa9b2b0b19ca0b4beeea40bfd50b07a92155178d5ec0e1877013843e0caba4fb
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## چیست

- استفاده/سهمیهٔ ارائه‌دهنده را مستقیماً از endpointهای استفادهٔ خودشان می‌گیرد.
- بدون هزینه‌های تخمینی؛ فقط پنجره‌های سهمیه یا خلاصه‌های وضعیت حساب که ارائه‌دهنده گزارش کرده است.
- خروجی وضعیت پنجرهٔ سهمیهٔ خوانا برای انسان به `X% left` نرمال‌سازی می‌شود، حتی وقتی API بالادستی سهمیهٔ مصرف‌شده، سهمیهٔ باقی‌مانده، یا فقط شمارش‌های خام را گزارش کند. ارائه‌دهندگانی که پنجره‌های سهمیهٔ قابل بازنشانی ندارند می‌توانند به‌جای آن متن خلاصهٔ ارائه‌دهنده را نشان دهند، مثل موجودی.
- `/status` در سطح نشست و `session_status` می‌توانند وقتی snapshot زندهٔ نشست کم‌اطلاعات است، به آخرین ورودی استفادهٔ transcript برگردند. آن fallback شمارنده‌های token/cache جاافتاده را پر می‌کند، می‌تواند برچسب مدل runtime فعال را بازیابی کند، و وقتی فرادادهٔ نشست وجود ندارد یا کوچک‌تر است، مجموع بزرگ‌ترِ prompt-محور را ترجیح می‌دهد. مقدارهای زندهٔ غیرصفر موجود همچنان اولویت دارند.

## کجا نمایش داده می‌شود

- `/status` در چت‌ها: کارت وضعیت پر از emoji با tokenهای نشست + هزینهٔ تخمینی (فقط کلید API). استفادهٔ ارائه‌دهنده برای **ارائه‌دهندهٔ مدل فعلی** وقتی در دسترس باشد به‌صورت پنجرهٔ نرمال‌شدهٔ `X% left` یا متن خلاصهٔ ارائه‌دهنده نمایش داده می‌شود.
- `/usage off|tokens|full` در چت‌ها: footer استفاده برای هر پاسخ.
- `/usage cost` در چت‌ها: خلاصهٔ هزینهٔ محلی که از logهای نشست OpenClaw تجمیع شده است.
- CLI: `openclaw status --usage` یک تفکیک کامل برای هر ارائه‌دهنده چاپ می‌کند.
- CLI: `openclaw channels list` همان snapshot استفاده را کنار پیکربندی ارائه‌دهنده چاپ می‌کند (برای رد کردن از `--no-usage` استفاده کنید).
- نوار منوی macOS: بخش «استفاده» زیر «زمینه» (فقط اگر در دسترس باشد).

## حالت پیش‌فرض footer استفاده

`/usage off|tokens|full` footer را برای یک نشست تنظیم می‌کند و برای همان نشست به خاطر سپرده می‌شود. `messages.responseUsage` این حالت را برای نشست‌هایی که هنوز حالتی انتخاب نکرده‌اند seed می‌کند، بنابراین footer می‌تواند بدون تایپ کردن `/usage` در هر بار، به‌صورت پیش‌فرض روشن باشد.

برای هر channel یک حالت تنظیم کنید، یا یک نگاشت برای هر channel با fallback به `default`:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### سه وضعیت متمایز نشست

فیلد `responseUsage` یک نشست سه وضعیت قابل نمایش دارد که هرکدام semantics متفاوتی دارند:

| وضعیت | مقدار ذخیره‌شده | حالت مؤثر |
| ------------------- | ------------------------------- | --------------------------------------------------------------------- |
| **تنظیم‌نشده / ارث‌بری** | `undefined` (غایب) | به پیش‌فرض پیکربندی `messages.responseUsage` و سپس `off` می‌رسد. |
| **خاموشِ صریح** | `"off"` (ذخیره‌شده) | همیشه خاموش است؛ پیش‌فرض پیکربندی غیرخاموش نمی‌تواند footer را دوباره فعال کند. |
| **روشنِ صریح** | `"tokens"` یا `"full"` (ذخیره‌شده) | همان حالت، صرف‌نظر از پیش‌فرض پیکربندی. |

### اولویت

حالت مؤثر = override نشست → ورودی پیکربندی channel → `default` → `off`.

یک `/usage off` صریح به‌عنوان مقدار literal `"off"` در نشست **ماندگار** می‌شود، نه مثل «تنظیم‌نشده». یعنی پیش‌فرض غیرخاموش `messages.responseUsage` نمی‌تواند بعد از اینکه کاربر صریحاً آن را غیرفعال کرده است، footer را دوباره روشن کند.

### بازنشانی در برابر خاموش کردن

- `/usage off` — footer را به‌اجبار خاموش می‌کند و آن انتخاب را ماندگار می‌کند. پیش‌فرض غیرخاموشِ پیکربندی‌شده نمی‌تواند این را override کند.
- `/usage reset` (aliasها: `inherit`، `clear`، `default`) — override نشست را پاک می‌کند. سپس نشست پیش‌فرض پیکربندی مؤثر (`messages.responseUsage`) را **به ارث می‌برد**. اگر هیچ پیش‌فرضی پیکربندی نشده باشد، footer خاموش است (مثل قبل بدون تغییر). از این برای «بازگشت به پیش‌فرض» بدون روشن کردن صریح footer استفاده کنید.
- بازنشانی کامل نشست (`/reset` یا `/new`) یا rollover نشست، ترجیح صریح حالت استفاده را **حفظ می‌کند** تا انتخاب نمایشی کاربر در rolloverهای نشست باقی بماند. فقط `/usage reset` (و aliasهای آن) واقعاً override را پاک می‌کند.

### رفتار toggle

`/usage` بدون آرگومان چرخه می‌زند: off → tokens → full → off. نقطهٔ شروع چرخه حالت فعلی **مؤثر** است (override نشست که هنگام تنظیم‌نبودن به پیش‌فرض پیکربندی می‌رسد)، بنابراین چرخه همیشه با چیزی که کاربر در footer می‌بیند سازگار است.

### پیکربندی

بدون پیکربندی، رفتار قبلی برقرار می‌ماند (footer تا `/usage` خاموش است). برای پاک کردن override نشست و ارث‌بری دوباره از پیش‌فرض پیکربندی‌شده، از `/usage reset` استفاده کنید.

## footer سفارشی `/usage full`

`/usage full` وقتی فیلدها در دسترس باشند یک footer فشردهٔ داخلی با مدل، reasoning، fast/slow، پنجرهٔ context و هزینه نشان می‌دهد. فیلدهای token و cache برای templateهای سفارشی همچنان در دسترس می‌مانند. هیچ فایل template لازم نیست.

`messages.usageTemplate` فقط برای چیدمان‌های سفارشی پیشرفته است. مقدار آن یک مسیر فایل JSON (با پشتیبانی از `~`) یا یک object درون‌خطی است، و وقتی معتبر باشد footer داخلی را جایگزین می‌کند:

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

templateهای جاافتاده یا خالی بی‌صدا به footer داخلی برمی‌گردند. templateهای پیکربندی‌شدهٔ خواندنی‌نبودنی یا نامعتبر نیز به footer داخلی برمی‌گردند و یک هشدار operator منتشر می‌کنند.

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
      { "text": "{model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": "🔄" } },
      { "map": "model.is_override", "cases": { "true": "📌" } },
      { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
      {
        "when": "context.max_tokens",
        "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
        {
          "when": "context.max_tokens",
          "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### ساختار

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

هر surface یک فهرست مرتب از **piece**ها است؛ engine هرکدام را render می‌کند، خالی‌ها را حذف می‌کند، و باقی‌مانده‌ها را با `sep` به هم وصل می‌کند. surface بدون ورودی از `output.default` استفاده می‌کند.

### مسیرهای contract

یک piece مقدارها را از contract هر turn با dot-path می‌خواند. مقدارهای غایب خالی هستند (پس یک guard با `when` یا یک `|fallback`، piece را تمیز نگه می‌دارد).

| مسیر | معنی |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| `surface` | شناسهٔ channel (`discord`/`telegram`/و غیره) |
| `model.provider` / `model.display_name` | شناسهٔ ارائه‌دهنده / شناسهٔ مدل |
| `model.reasoning` | effort (از `off` تا `xhigh`) |
| `model.is_fallback` / `model.is_override` | bool: fallback استفاده شده / مدل pin شده |
| `state.fast_mode` | bool: fast در برابر slow |
| `context.max_tokens` / `context.pct_used` | بودجهٔ پنجره / 0-100 مصرف‌شده |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens` | تجمیع turn |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct` | guardهای نمایش token و درصد cache |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | فقط فراخوانی نهایی مدل |
| `cost.turn_usd` | هزینهٔ تخمینی turn |
| `identity.name` / `identity.emoji` | نام agent / emoji انتخاب‌شده |

(پنجره‌های rate-limit ارائه‌دهنده در این contract **نیستند**.)

### فعل‌ها

یک مقدار را از چپ به راست از میان فعل‌ها pipe کنید؛ segment غیر‌فعل fallback است.

| فعل | اثر | مثال |
| --------------- | ------------------------------------- | --------------------------------- |
| `num` | شمارش فشرده | `272000 -> 272k` |
| `fixed:N` | N رقم اعشار (پیش‌فرض 2) | `0.0377` |
| `dur` | ثانیه به duration | `14820 -> 4h07m` |
| `pct` | افزودن `%` | `96 -> 96%` |
| `inv` | `100 - x` | برای تبدیل مصرف‌شده به باقی‌مانده |
| `alias:TABLE` | جست‌وجو در `aliases`، اگر فهرست نشده بود echo | `medium -> 🌗` |
| `meter:W:SCALE` | نوار glyph با W خانه روی مقدار 0-100 | `[⣿⣿⠐⠐⠐]` (`meter:1` = یک glyph) |

### شکل‌های piece

- `{ "text": "📚 {context.max_tokens|num}" }`: literal + interpolation.
- `{ "when": "<path>", "text": "..." }`: فقط اگر مسیر truthy باشد render می‌شود.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: مقدار به glyph.
- `{ "each": "limits.windows", "item": "{label}" }`: پیمایش یک array.

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

برای مثال `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k` را render می‌کند.

## ارائه‌دهندگان + credentialها

- **Anthropic (Claude)**: توکن‌های OAuth در نمایه‌های احراز هویت.
- **GitHub Copilot**: توکن‌های OAuth در نمایه‌های احراز هویت.
- **Gemini CLI**: توکن‌های OAuth در نمایه‌های احراز هویت.
  - کاربرد JSON به `stats` بازمی‌گردد؛ `stats.cached` به
    `cacheRead` نرمال‌سازی می‌شود.
- **OpenAI Codex**: توکن‌های OAuth در نمایه‌های احراز هویت (`accountId` در صورت وجود استفاده می‌شود).
- **MiniMax**: کلید API یا نمایه احراز هویت OAuth مربوط به MiniMax. OpenClaw
  `minimax`، `minimax-cn` و `minimax-portal` را به‌عنوان سطح سهمیه یکسان MiniMax
  در نظر می‌گیرد، در صورت وجود OAuth ذخیره‌شده MiniMax را ترجیح می‌دهد، و در غیر این صورت
  به `MINIMAX_CODE_PLAN_KEY`، `MINIMAX_CODING_API_KEY` یا `MINIMAX_API_KEY` بازمی‌گردد.
  پایش کاربرد، میزبان Coding Plan را هنگام پیکربندی از `models.providers.minimax-portal.baseUrl`
  یا `models.providers.minimax.baseUrl` استخراج می‌کند، و در غیر این صورت از
  میزبان MiniMax CN استفاده می‌کند.
  فیلدهای خام `usage_percent` / `usagePercent` در MiniMax به معنی سهمیه **باقی‌مانده**
  هستند، بنابراین OpenClaw پیش از نمایش آن‌ها را وارونه می‌کند؛ فیلدهای مبتنی بر تعداد، در صورت
  وجود، اولویت دارند.
  - برچسب‌های پنجره coding-plan، در صورت وجود، از فیلدهای ساعت/دقیقه ارائه‌دهنده
    می‌آیند، سپس به بازه `start_time` / `end_time` بازمی‌گردند.
  - اگر نقطه پایانی coding-plan مقدار `model_remains` را برگرداند، OpenClaw ورودی
    مدل گفت‌وگو را ترجیح می‌دهد، وقتی فیلدهای صریح
    `window_hours` / `window_minutes` وجود ندارند برچسب پنجره را از مُهرهای زمانی
    استخراج می‌کند، و نام مدل را در برچسب طرح قرار می‌دهد.
- **Xiaomi MiMo**: کلید API از طریق env/config/auth store (`XIAOMI_API_KEY`).
- **z.ai**: کلید API از طریق env/config/auth store.
- **DeepSeek**: کلید API از طریق env/config/auth store (`DEEPSEEK_API_KEY`).
  OpenClaw نقطه پایانی موجودی DeepSeek را فراخوانی می‌کند و موجودی گزارش‌شده توسط ارائه‌دهنده را
  به‌جای پنجره سهمیه درصد باقی‌مانده، به‌صورت متن نشان می‌دهد.

وقتی هیچ احراز هویت کاربرد ارائه‌دهنده قابل‌استفاده‌ای قابل resolve نباشد، کاربرد پنهان می‌شود. ارائه‌دهندگان
می‌توانند منطق احراز هویت کاربرد ویژه Plugin ارائه کنند؛ در غیر این صورت OpenClaw به
اعتبارنامه‌های OAuth/API-key مطابق از نمایه‌های احراز هویت، متغیرهای محیطی،
یا پیکربندی بازمی‌گردد.

## مرتبط

- [استفاده از توکن و هزینه‌ها](/fa/reference/token-use)
- [کاربرد و هزینه‌های API](/fa/reference/api-usage-costs)
- [کش کردن پرامپت](/fa/reference/prompt-caching)
