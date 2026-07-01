---
read_when:
    - Bạn đang kết nối các bề mặt sử dụng/hạn ngạch của nhà cung cấp
    - Bạn cần giải thích hành vi theo dõi mức sử dụng hoặc yêu cầu xác thực
summary: Bề mặt theo dõi mức sử dụng và yêu cầu thông tin xác thực
title: Theo dõi mức sử dụng
x-i18n:
    generated_at: "2026-07-01T18:14:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa9b2b0b19ca0b4beeea40bfd50b07a92155178d5ec0e1877013843e0caba4fb
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Đây là gì

- Lấy mức sử dụng/hạn mức của nhà cung cấp trực tiếp từ các endpoint sử dụng của họ.
- Không có chi phí ước tính; chỉ có các khoảng hạn mức hoặc tóm tắt trạng thái tài khoản do nhà cung cấp báo cáo.
- Đầu ra trạng thái khoảng hạn mức dễ đọc cho con người được chuẩn hóa thành `X% left`, ngay cả khi API thượng nguồn báo cáo hạn mức đã dùng, hạn mức còn lại, hoặc chỉ các số đếm thô. Các nhà cung cấp không có khoảng hạn mức có thể đặt lại có thể hiển thị văn bản tóm tắt của nhà cung cấp thay thế, chẳng hạn như số dư.
- `/status` cấp phiên và `session_status` có thể dùng mục sử dụng transcript mới nhất làm dự phòng khi snapshot phiên trực tiếp còn thưa dữ liệu. Dự phòng đó điền các bộ đếm token/cache còn thiếu, có thể khôi phục nhãn model runtime đang hoạt động, và ưu tiên tổng lớn hơn theo hướng prompt khi siêu dữ liệu phiên bị thiếu hoặc nhỏ hơn. Các giá trị trực tiếp khác không bằng 0 hiện có vẫn được ưu tiên.

## Nơi nó xuất hiện

- `/status` trong các cuộc trò chuyện: thẻ trạng thái nhiều emoji với token phiên + chi phí ước tính (chỉ API key). Mức sử dụng của nhà cung cấp hiển thị cho **nhà cung cấp model hiện tại** khi có sẵn dưới dạng khoảng `X% left` đã chuẩn hóa hoặc văn bản tóm tắt của nhà cung cấp.
- `/usage off|tokens|full` trong các cuộc trò chuyện: phần chân trang mức sử dụng theo từng phản hồi.
- `/usage cost` trong các cuộc trò chuyện: tóm tắt chi phí cục bộ được tổng hợp từ nhật ký phiên OpenClaw.
- CLI: `openclaw status --usage` in bảng phân tích đầy đủ theo từng nhà cung cấp.
- CLI: `openclaw channels list` in cùng snapshot mức sử dụng bên cạnh cấu hình nhà cung cấp (dùng `--no-usage` để bỏ qua).
- Thanh menu macOS: mục "Usage" trong Context (chỉ khi có sẵn).

## Chế độ chân trang mức sử dụng mặc định

`/usage off|tokens|full` đặt chân trang cho một phiên và được ghi nhớ cho phiên đó. `messages.responseUsage` khởi tạo chế độ đó cho các phiên chưa chọn, để chân trang có thể bật theo mặc định mà không cần gõ `/usage` mỗi lần.

Đặt một chế độ cho mọi kênh, hoặc một map theo từng kênh với dự phòng `default`:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### Ba trạng thái phiên riêng biệt

Trường `responseUsage` của một phiên có ba trạng thái có thể biểu diễn, mỗi trạng thái có ngữ nghĩa khác nhau:

| Trạng thái | Giá trị được lưu | Chế độ hiệu lực |
| ------------------- | ------------------------------- | --------------------------------------------------------------------- |
| **Chưa đặt / kế thừa** | `undefined` (vắng mặt) | Chuyển tiếp sang mặc định cấu hình `messages.responseUsage`, rồi `off`. |
| **Tắt rõ ràng** | `"off"` (đã lưu) | Luôn tắt — mặc định cấu hình không phải off không thể bật lại chân trang. |
| **Bật rõ ràng** | `"tokens"` hoặc `"full"` (đã lưu) | Chế độ đó, bất kể mặc định cấu hình. |

### Thứ tự ưu tiên

Chế độ hiệu lực = ghi đè phiên → mục cấu hình kênh → `default` → `off`.

Một `/usage off` rõ ràng được **lưu bền vững** dưới dạng giá trị literal `"off"` trong phiên, không giống với "chưa đặt." Điều này có nghĩa là mặc định `messages.responseUsage` không phải off không thể bật lại chân trang sau khi người dùng đã tắt nó rõ ràng.

### Đặt lại so với tắt

- `/usage off` — buộc tắt chân trang và lưu lựa chọn đó. Mặc định được cấu hình không phải off không thể ghi đè điều này.
- `/usage reset` (bí danh: `inherit`, `clear`, `default`) — xóa ghi đè phiên. Sau đó phiên **kế thừa** mặc định cấu hình hiệu lực (`messages.responseUsage`). Nếu không có mặc định được cấu hình, chân trang sẽ tắt (không đổi so với trước). Dùng lệnh này để "quay lại mặc định" mà không bật chân trang một cách rõ ràng.
- Việc đặt lại toàn bộ phiên (`/reset` hoặc `/new`) hoặc rollover phiên **giữ nguyên** tùy chọn chế độ sử dụng rõ ràng để lựa chọn hiển thị của người dùng tồn tại qua các lần rollover phiên. Chỉ `/usage reset` (và các bí danh của nó) mới thực sự xóa ghi đè.

### Hành vi chuyển đổi

`/usage` không có đối số sẽ xoay vòng: off → tokens → full → off. Điểm bắt đầu của chu kỳ là chế độ hiện tại **hiệu lực** (ghi đè phiên chuyển tiếp sang mặc định cấu hình khi chưa đặt), nên chu kỳ luôn nhất quán với những gì người dùng thấy trong chân trang.

### Cấu hình

Khi không có cấu hình, hành vi trước đây vẫn giữ nguyên (chân trang tắt cho đến khi dùng `/usage`). Dùng `/usage reset` để xóa ghi đè phiên và kế thừa lại mặc định đã cấu hình.

## Chân trang `/usage full` tùy chỉnh

`/usage full` hiển thị chân trang gọn tích hợp sẵn với model, reasoning, nhanh/chậm, cửa sổ context, và chi phí khi các trường đó có sẵn. Các trường token và cache vẫn có sẵn cho template tùy chỉnh. Không cần tệp template.

`messages.usageTemplate` chỉ dành cho các bố cục tùy chỉnh nâng cao. Giá trị là đường dẫn tệp JSON (hỗ trợ `~`) hoặc một đối tượng inline, và nó thay thế chân trang tích hợp khi hợp lệ:

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Template bị thiếu hoặc rỗng sẽ âm thầm quay về chân trang tích hợp sẵn. Template được cấu hình nhưng không đọc được hoặc không hợp lệ cũng quay về chân trang tích hợp sẵn và phát cảnh báo cho operator.

Bắt đầu template tùy chỉnh từ hình dạng tích hợp sẵn, rồi chỉnh các phần bạn muốn thay đổi:

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

Mỗi bề mặt là danh sách có thứ tự gồm các **mảnh**; engine render từng mảnh, loại bỏ các mảnh rỗng, và nối các mảnh còn lại bằng `sep`. Một bề mặt không có mục sẽ dùng `output.default`.

### Đường dẫn hợp đồng

Một mảnh đọc giá trị từ hợp đồng theo từng lượt bằng dot-path. Giá trị vắng mặt là rỗng (vì vậy guard `when` hoặc `|fallback` giữ cho mảnh sạch).

| Đường dẫn | Ý nghĩa |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| `surface` | id kênh (`discord`/`telegram`/v.v.) |
| `model.provider` / `model.display_name` | id nhà cung cấp / id model |
| `model.reasoning` | mức effort (`off` đến `xhigh`) |
| `model.is_fallback` / `model.is_override` | bool: đã dùng dự phòng / model được ghim |
| `state.fast_mode` | bool: nhanh so với chậm |
| `context.max_tokens` / `context.pct_used` | ngân sách cửa sổ / 0-100 đã dùng |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens` | tổng hợp lượt |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct` | guard hiển thị token và phần trăm cache |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | chỉ lần gọi model cuối cùng |
| `cost.turn_usd` | chi phí lượt ước tính |
| `identity.name` / `identity.emoji` | tên agent / emoji đã chọn |

(Các khoảng giới hạn tốc độ của nhà cung cấp **không** nằm trong hợp đồng này.)

### Động từ

Đưa một giá trị qua các động từ từ trái sang phải; đoạn không phải động từ là giá trị dự phòng.

| Động từ | Hiệu ứng | Ví dụ |
| --------------- | ------------------------------------- | --------------------------------- |
| `num` | số đếm gọn | `272000 -> 272k` |
| `fixed:N` | N chữ số thập phân (mặc định 2) | `0.0377` |
| `dur` | giây sang thời lượng | `14820 -> 4h07m` |
| `pct` | thêm `%` | `96 -> 96%` |
| `inv` | `100 - x` | từ đã dùng sang còn lại |
| `alias:TABLE` | tra cứu trong `aliases`, lặp lại nếu không có trong danh sách | `medium -> 🌗` |
| `meter:W:SCALE` | thanh glyph W ô trên giá trị 0-100 | `[⣿⣿⠐⠐⠐]` (`meter:1` = một glyph) |

### Dạng mảnh

- `{ "text": "📚 {context.max_tokens|num}" }`: literal + nội suy.
- `{ "when": "<path>", "text": "..." }`: chỉ render nếu đường dẫn là truthy.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: ánh xạ giá trị sang glyph.
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

render, ví dụ, `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`.

## Nhà cung cấp + thông tin xác thực

- **Anthropic (Claude)**: Token OAuth trong hồ sơ xác thực.
- **GitHub Copilot**: Token OAuth trong hồ sơ xác thực.
- **Gemini CLI**: Token OAuth trong hồ sơ xác thực.
  - Mức sử dụng JSON quay về `stats`; `stats.cached` được chuẩn hóa thành
    `cacheRead`.
- **OpenAI Codex**: Token OAuth trong hồ sơ xác thực (accountId được dùng khi có).
- **MiniMax**: Khóa API hoặc hồ sơ xác thực OAuth của MiniMax. OpenClaw coi
  `minimax`, `minimax-cn`, và `minimax-portal` là cùng một bề mặt hạn mức
  MiniMax, ưu tiên OAuth MiniMax đã lưu khi có, và nếu không thì quay về
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, hoặc `MINIMAX_API_KEY`.
  Việc thăm dò mức sử dụng lấy máy chủ Coding Plan từ `models.providers.minimax-portal.baseUrl`
  hoặc `models.providers.minimax.baseUrl` khi được cấu hình, và nếu không thì dùng
  máy chủ MiniMax CN.
  Các trường thô `usage_percent` / `usagePercent` của MiniMax biểu thị hạn mức
  **còn lại**, nên OpenClaw đảo ngược chúng trước khi hiển thị; các trường dựa
  trên số lượng được ưu tiên khi có.
  - Nhãn cửa sổ coding-plan đến từ các trường giờ/phút của provider khi
    có, rồi quay về khoảng `start_time` / `end_time`.
  - Nếu endpoint coding-plan trả về `model_remains`, OpenClaw ưu tiên mục
    chat-model, suy ra nhãn cửa sổ từ dấu thời gian khi không có các trường
    `window_hours` / `window_minutes` rõ ràng, và đưa tên mô hình vào nhãn gói.
- **Xiaomi MiMo**: Khóa API qua env/config/kho xác thực (`XIAOMI_API_KEY`).
- **z.ai**: Khóa API qua env/config/kho xác thực.
- **DeepSeek**: Khóa API qua env/config/kho xác thực (`DEEPSEEK_API_KEY`).
  OpenClaw gọi endpoint số dư của DeepSeek và hiển thị số dư do provider báo cáo
  dưới dạng văn bản thay vì cửa sổ hạn mức phần trăm còn lại.

Mức sử dụng bị ẩn khi không thể phân giải xác thực mức sử dụng provider khả dụng. Provider
có thể cung cấp logic xác thực mức sử dụng dành riêng cho plugin; nếu không, OpenClaw quay về
thông tin xác thực OAuth/khóa API khớp từ hồ sơ xác thực, biến môi trường,
hoặc cấu hình.

## Liên quan

- [Mức dùng token và chi phí](/vi/reference/token-use)
- [Mức sử dụng API và chi phí](/vi/reference/api-usage-costs)
- [Lưu bộ nhớ đệm prompt](/vi/reference/prompt-caching)
