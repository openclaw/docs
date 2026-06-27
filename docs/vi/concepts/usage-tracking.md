---
read_when:
    - Bạn đang kết nối các bề mặt sử dụng/hạn mức của nhà cung cấp
    - Bạn cần giải thích hành vi theo dõi việc sử dụng hoặc các yêu cầu xác thực
summary: Các giao diện theo dõi mức sử dụng và yêu cầu về thông tin xác thực
title: Theo dõi mức sử dụng
x-i18n:
    generated_at: "2026-06-27T17:27:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 953f9671093c26f874b19fc0e6f8aee0ebf3379d4a6698bc8548abf942e37a59
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Đây là gì

- Kéo mức sử dụng/hạn mức của nhà cung cấp trực tiếp từ endpoint sử dụng của họ.
- Không có chi phí ước tính; chỉ có các cửa sổ hạn mức do nhà cung cấp báo cáo hoặc tóm tắt trạng thái tài khoản.
- Đầu ra trạng thái cửa sổ hạn mức dễ đọc được chuẩn hóa thành `X% left`, ngay cả khi API thượng nguồn báo cáo hạn mức đã dùng, hạn mức còn lại, hoặc chỉ số đếm thô. Các nhà cung cấp không có cửa sổ hạn mức có thể đặt lại có thể hiển thị văn bản tóm tắt của nhà cung cấp thay thế, chẳng hạn như số dư.
- `/status` cấp phiên và `session_status` có thể quay về mục sử dụng transcript mới nhất khi ảnh chụp nhanh phiên trực tiếp còn thưa dữ liệu. Cơ chế dự phòng đó điền các bộ đếm token/cache còn thiếu, có thể khôi phục nhãn mô hình runtime đang hoạt động, và ưu tiên tổng lớn hơn theo hướng prompt khi metadata phiên bị thiếu hoặc nhỏ hơn. Các giá trị trực tiếp khác không bằng 0 hiện có vẫn được ưu tiên.

## Xuất hiện ở đâu

- `/status` trong cuộc trò chuyện: thẻ trạng thái giàu emoji với token phiên + chi phí ước tính (chỉ API key). Mức sử dụng nhà cung cấp hiển thị cho **nhà cung cấp mô hình hiện tại** khi có, dưới dạng cửa sổ `X% left` đã chuẩn hóa hoặc văn bản tóm tắt của nhà cung cấp.
- `/usage off|tokens|full` trong cuộc trò chuyện: phần chân mức sử dụng theo từng phản hồi (OAuth chỉ hiển thị token).
- `/usage cost` trong cuộc trò chuyện: tóm tắt chi phí cục bộ được tổng hợp từ nhật ký phiên OpenClaw.
- CLI: `openclaw status --usage` in phân tích đầy đủ theo từng nhà cung cấp.
- CLI: `openclaw channels list` in cùng ảnh chụp nhanh mức sử dụng bên cạnh cấu hình nhà cung cấp (dùng `--no-usage` để bỏ qua).
- Thanh menu macOS: mục "Mức sử dụng" trong Ngữ cảnh (chỉ khi có).

## Chế độ phần chân mức sử dụng mặc định

`/usage off|tokens|full` đặt phần chân cho một phiên và được ghi nhớ cho phiên đó. `messages.responseUsage` khởi tạo chế độ đó cho các phiên chưa chọn chế độ, để phần chân có thể bật mặc định mà không cần gõ `/usage` mỗi lần.

Đặt một chế độ cho mọi kênh, hoặc một ánh xạ theo từng kênh với dự phòng `default`:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### Ba trạng thái phiên riêng biệt

Trường `responseUsage` của phiên có ba trạng thái có thể biểu diễn, mỗi trạng thái có ngữ nghĩa khác nhau:

| Trạng thái                    | Giá trị đã lưu                 | Chế độ hiệu lực                                                             |
| ----------------------------- | ------------------------------ | -------------------------------------------------------------------------- |
| **Chưa đặt / kế thừa**        | `undefined` (vắng mặt)         | Rơi tiếp về mặc định cấu hình `messages.responseUsage`, rồi `off`.         |
| **Tắt rõ ràng**               | `"off"` (đã lưu)               | Luôn tắt — mặc định cấu hình khác `off` không thể bật lại phần chân.       |
| **Bật rõ ràng**               | `"tokens"` hoặc `"full"` (đã lưu) | Chế độ đó, bất kể mặc định cấu hình.                                      |

### Thứ tự ưu tiên

Chế độ hiệu lực = ghi đè phiên → mục cấu hình kênh → `default` → `off`.

Một `/usage off` rõ ràng được **lưu bền vững** dưới dạng giá trị nguyên văn `"off"` trong phiên, không giống với "chưa đặt." Điều này có nghĩa là mặc định `messages.responseUsage` khác `off` không thể bật lại phần chân sau khi người dùng đã tắt rõ ràng.

### Đặt lại so với tắt

- `/usage off` — buộc tắt phần chân và lưu bền vững lựa chọn đó. Mặc định khác `off` đã cấu hình không thể ghi đè điều này.
- `/usage reset` (bí danh: `inherit`, `clear`, `default`) — xóa ghi đè phiên. Sau đó phiên **kế thừa** mặc định cấu hình hiệu lực (`messages.responseUsage`). Nếu không có mặc định nào được cấu hình, phần chân sẽ tắt (không đổi so với trước). Dùng lệnh này để "quay lại mặc định" mà không bật phần chân một cách rõ ràng.
- Đặt lại toàn bộ phiên (`/reset` hoặc `/new`) hoặc chuyển phiên **giữ nguyên** tùy chọn chế độ mức sử dụng rõ ràng để lựa chọn hiển thị của người dùng tồn tại qua các lần chuyển phiên. Chỉ `/usage reset` (và các bí danh của nó) thực sự xóa ghi đè.

### Hành vi chuyển đổi

`/usage` không có đối số sẽ xoay vòng: off → tokens → full → off. Điểm bắt đầu của vòng xoay là chế độ hiện tại **có hiệu lực** (ghi đè phiên rơi tiếp về mặc định cấu hình khi chưa đặt), nên vòng xoay luôn nhất quán với những gì người dùng thấy trong phần chân.

### Cấu hình

Khi không có cấu hình, hành vi trước đây được giữ nguyên (phần chân tắt cho đến khi dùng `/usage`). Dùng `/usage reset` để xóa ghi đè phiên và kế thừa lại mặc định đã cấu hình.

## Phần chân `/usage full` tùy chỉnh

`/usage full` hiển thị phần chân nhỏ gọn tích hợp sẵn với mô hình, reasoning, nhanh/chậm, cửa sổ ngữ cảnh, token lượt, cache, và chi phí khi các trường đó có sẵn. Không cần tệp mẫu.

`messages.usageTemplate` chỉ dành cho bố cục tùy chỉnh nâng cao. Giá trị là đường dẫn tệp JSON (hỗ trợ `~`) hoặc một object nội tuyến, và nó thay thế phần chân tích hợp sẵn khi hợp lệ:

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Các mẫu bị thiếu hoặc rỗng âm thầm quay về phần chân tích hợp sẵn. Các mẫu đã cấu hình nhưng không đọc được hoặc không hợp lệ cũng quay về phần chân tích hợp sẵn và phát cảnh báo cho vận hành viên.

Bắt đầu mẫu tùy chỉnh từ hình dạng tích hợp sẵn, rồi chỉnh các phần bạn muốn thay đổi:

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

### Hình dạng

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

Mỗi surface là danh sách **mảnh** có thứ tự; engine render từng mảnh, loại bỏ các mảnh rỗng, và nối các mảnh còn lại bằng `sep`. Surface không có mục riêng sẽ dùng `output.default`.

### Đường dẫn hợp đồng

Một mảnh đọc giá trị từ hợp đồng theo từng lượt bằng dot-path. Giá trị vắng mặt là rỗng (nên một guard `when` hoặc `|fallback` giữ cho mảnh sạch).

| Đường dẫn                                                                          | Ý nghĩa                                  |
| ---------------------------------------------------------------------------------- | ---------------------------------------- |
| `surface`                                                                          | id kênh (`discord`/`telegram`/v.v.)      |
| `model.provider` / `model.display_name`                                            | id nhà cung cấp / id mô hình             |
| `model.reasoning`                                                                  | effort (`off` đến `xhigh`)               |
| `model.is_fallback` / `model.is_override`                                          | bool: đã dùng dự phòng / mô hình được ghim |
| `state.fast_mode`                                                                  | bool: nhanh so với chậm                  |
| `context.max_tokens` / `context.pct_used`                                          | ngân sách cửa sổ / 0-100 đã dùng         |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                | tổng hợp lượt                            |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct`   | guard hiển thị token và phần trăm cache  |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | chỉ lệnh gọi mô hình cuối cùng          |
| `cost.turn_usd`                                                                    | chi phí lượt ước tính                    |
| `identity.name` / `identity.emoji`                                                 | tên agent / emoji đã chọn                |

(Cửa sổ giới hạn tốc độ của nhà cung cấp **không** nằm trong hợp đồng này.)

### Động từ

Đưa một giá trị qua các động từ từ trái sang phải; đoạn không phải động từ là giá trị dự phòng.

| Động từ         | Hiệu ứng                              | Ví dụ                              |
| --------------- | ------------------------------------- | ---------------------------------- |
| `num`           | số đếm rút gọn                        | `272000 -> 272k`                   |
| `fixed:N`       | N chữ số thập phân (mặc định 2)       | `0.0377`                           |
| `dur`           | giây thành thời lượng                 | `14820 -> 4h07m`                   |
| `pct`           | thêm `%`                              | `96 -> 96%`                        |
| `inv`           | `100 - x`                             | từ đã dùng sang còn lại            |
| `alias:TABLE`   | tra cứu trong `aliases`, lặp lại nếu không có trong danh sách | `medium -> 🌗` |
| `meter:W:SCALE` | thanh glyph W ô trên giá trị 0-100    | `[⣿⣿⠐⠐⠐]` (`meter:1` = một glyph) |

### Dạng mảnh

- `{ "text": "📚 {context.max_tokens|num}" }`: literal + nội suy.
- `{ "when": "<path>", "text": "..." }`: chỉ render nếu đường dẫn là truthy.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: giá trị thành glyph.
- `{ "each": "limits.windows", "item": "{label}" }`: lặp qua một mảng.

### Ví dụ

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

hiển thị, ví dụ: `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`.

## Nhà cung cấp + thông tin xác thực

- **Anthropic (Claude)**: Mã thông báo OAuth trong hồ sơ xác thực.
- **GitHub Copilot**: Mã thông báo OAuth trong hồ sơ xác thực.
- **Gemini CLI**: Mã thông báo OAuth trong hồ sơ xác thực.
  - Mức sử dụng JSON sẽ dùng dự phòng `stats`; `stats.cached` được chuẩn hóa thành
    `cacheRead`.
- **OpenAI Codex**: Mã thông báo OAuth trong hồ sơ xác thực (`accountId` được dùng khi có).
- **MiniMax**: Khóa API hoặc hồ sơ xác thực OAuth MiniMax. OpenClaw xem
  `minimax`, `minimax-cn`, và `minimax-portal` là cùng một bề mặt hạn mức
  MiniMax, ưu tiên OAuth MiniMax đã lưu khi có, và nếu không thì dùng dự phòng
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, hoặc `MINIMAX_API_KEY`.
  Việc thăm dò mức sử dụng lấy máy chủ Coding Plan từ `models.providers.minimax-portal.baseUrl`
  hoặc `models.providers.minimax.baseUrl` khi được cấu hình, và nếu không thì dùng
  máy chủ MiniMax CN.
  Các trường thô `usage_percent` / `usagePercent` của MiniMax biểu thị hạn mức
  **còn lại**, nên OpenClaw đảo ngược chúng trước khi hiển thị; các trường dựa
  trên số lượng sẽ được ưu tiên khi có.
  - Nhãn cửa sổ coding-plan lấy từ các trường giờ/phút của nhà cung cấp khi
    có, rồi dùng dự phòng khoảng `start_time` / `end_time`.
  - Nếu endpoint coding-plan trả về `model_remains`, OpenClaw ưu tiên mục
    mô hình chat, suy ra nhãn cửa sổ từ dấu thời gian khi không có các trường
    `window_hours` / `window_minutes` rõ ràng, và đưa tên mô hình vào nhãn gói.
- **Xiaomi MiMo**: Khóa API qua env/config/kho xác thực (`XIAOMI_API_KEY`).
- **z.ai**: Khóa API qua env/config/kho xác thực.
- **DeepSeek**: Khóa API qua env/config/kho xác thực (`DEEPSEEK_API_KEY`).
  OpenClaw gọi endpoint số dư của DeepSeek và hiển thị số dư do nhà cung cấp
  báo cáo dưới dạng văn bản thay vì cửa sổ hạn mức phần trăm còn lại.

Mức sử dụng bị ẩn khi không thể phân giải xác thực mức sử dụng nhà cung cấp khả dụng.
Nhà cung cấp có thể cung cấp logic xác thực mức sử dụng dành riêng cho Plugin; nếu không,
OpenClaw dùng dự phòng bằng cách khớp thông tin xác thực OAuth/khóa API từ hồ sơ
xác thực, biến môi trường, hoặc cấu hình.

## Liên quan

- [Mức sử dụng token và chi phí](/vi/reference/token-use)
- [Mức sử dụng API và chi phí](/vi/reference/api-usage-costs)
- [Lưu bộ nhớ đệm prompt](/vi/reference/prompt-caching)
