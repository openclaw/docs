---
read_when:
    - Bạn đang kết nối các giao diện hiển thị mức sử dụng/hạn ngạch của nhà cung cấp
    - Bạn cần giải thích hành vi theo dõi mức sử dụng hoặc các yêu cầu xác thực
summary: Các giao diện theo dõi mức sử dụng và yêu cầu về thông tin xác thực
title: Theo dõi mức sử dụng
x-i18n:
    generated_at: "2026-07-12T07:53:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c413dcbe838d94c57ba3f6ef9609331e139de6d0abbdb3860753a519bd490314
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Đây là gì

- Lấy trực tiếp mức sử dụng/hạn mức của nhà cung cấp từ endpoint sử dụng của từng nhà cung cấp. Không ước tính hóa đơn của nhà cung cấp; chỉ hiển thị tên gói, khoảng thời gian hạn mức, số dư, mức chi tiêu, ngân sách, lịch sử chi phí hằng ngày, phân bổ theo token/mô hình hoặc bản tóm tắt trạng thái tài khoản do nhà cung cấp báo cáo.
- Đầu ra khoảng thời gian hạn mức dễ đọc được chuẩn hóa thành `còn X%`, ngay cả khi nhà cung cấp báo cáo hạn mức đã dùng, hạn mức còn lại hoặc chỉ số đếm thô. Các nhà cung cấp không có khoảng thời gian hạn mức có thể đặt lại sẽ hiển thị văn bản tóm tắt của nhà cung cấp thay thế (ví dụ: số dư).
- `/status` ở cấp phiên và công cụ `session_status` dùng dự phòng nhật ký bản chép lời của phiên khi ảnh chụp nhanh phiên trực tiếp thiếu dữ liệu token/mô hình. Cơ chế dự phòng đó điền các bộ đếm token/bộ nhớ đệm còn thiếu, có thể khôi phục nhãn mô hình thời gian chạy đang hoạt động và ưu tiên tổng số lớn hơn theo hướng prompt khi siêu dữ liệu phiên bị thiếu hoặc nhỏ hơn (`totalTokensFresh !== true`, bằng không hoặc thấp hơn giá trị suy ra từ bản chép lời). Các giá trị trực tiếp khác không luôn được ưu tiên hơn cơ chế dự phòng.

## Xuất hiện ở đâu

- `/status` trong cuộc trò chuyện: thẻ trạng thái có số token của phiên và chi phí ước tính (chỉ với mô hình dùng khóa API). Mức sử dụng của nhà cung cấp được hiển thị cho **nhà cung cấp mô hình hiện tại** khi có sẵn, dưới dạng khoảng thời gian `còn X%` đã chuẩn hóa hoặc văn bản tóm tắt của nhà cung cấp.
- `/usage off|tokens|full` trong cuộc trò chuyện: chân trang mức sử dụng cho mỗi phản hồi.
- `/usage cost` trong cuộc trò chuyện: bản tóm tắt chi phí cục bộ được tổng hợp từ nhật ký phiên OpenClaw.
- CLI: `openclaw status --usage` in ra bảng phân tích đầy đủ về mức sử dụng/hạn mức theo từng nhà cung cấp.
- CLI: `openclaw models status` liệt kê hồ sơ xác thực OAuth/token và hiển thị bản tóm tắt khoảng thời gian sử dụng bên cạnh mỗi nhà cung cấp có dữ liệu này.
- Giao diện điều khiển: **Mức sử dụng** hiển thị các thẻ gói và hóa đơn của nhà cung cấp phía trên phần phân tích token và chi phí ước tính do OpenClaw suy ra từ phiên. Thông tin xác thực API quản trị của Anthropic và OpenAI bổ sung mức chi tiêu hôm nay, trong 7 ngày và 30 ngày do nhà cung cấp báo cáo, xu hướng hằng ngày, tổng số token, các mô hình hàng đầu và các danh mục chi phí.
- Giao diện điều khiển: cửa sổ bật lên vòng ngữ cảnh trong trình soạn tin nhắn trò chuyện hiển thị **mức sử dụng gói** cho các nhà cung cấp theo thuê bao — các thanh theo từng khoảng thời gian (5 giờ, hằng tuần, theo phạm vi mô hình) cùng thời gian đặt lại, gói của nhà cung cấp khi biết (ví dụ: `Max (20x)`) và tín dụng sử dụng bổ sung. Các phiên được tính phí qua gói sẽ ẩn ước tính chi phí theo token; các phiên được tính phí qua API vẫn giữ `Chi phí ước tính` và bảng phân tích chi phí theo loại. Các thiết lập CLI Claude Code (`claude-cli`) sử dụng lại cùng dữ liệu mức sử dụng thuê bao Anthropic.
- Thanh menu macOS: mục gốc "Mức sử dụng" xuất hiện bên dưới Ngữ cảnh khi có ảnh chụp nhanh mức sử dụng của nhà cung cấp. Xem [Thanh menu](/vi/platforms/mac/menu-bar).

`openclaw channels list` không còn in mức sử dụng của nhà cung cấp; thay vào đó, lệnh này hướng người dùng đến `openclaw status` hoặc `openclaw models list`.

## Lịch sử chi phí Anthropic và OpenAI

Hạn mức thuê bao và hóa đơn API là hai bề mặt khác nhau của nhà cung cấp:

- Thông tin xác thực thuê bao/thiết lập Anthropic tiếp tục hiển thị các khoảng thời gian hạn mức Claude và ngân sách sử dụng bổ sung tùy chọn. Đặt `ANTHROPIC_ADMIN_KEY` hoặc `ANTHROPIC_ADMIN_API_KEY` để hiển thị lịch sử API Mức sử dụng và Chi phí của tổ chức. Thông tin xác thực nhà cung cấp Anthropic bắt đầu bằng `sk-ant-admin` được tự động phát hiện.
- OAuth OpenAI ChatGPT/Codex tiếp tục hiển thị gói, các khoảng thời gian hạn mức và số dư tín dụng. Đặt `OPENAI_ADMIN_KEY` để hiển thị lịch sử chi phí và mức sử dụng lượt hoàn thành của tổ chức; tùy chọn đặt `OPENAI_PROJECT_ID` để giới hạn trong một dự án. OpenClaw không bao giờ gửi thông tin xác thực suy luận từ `OPENAI_API_KEY`, cấu hình nhà cung cấp hoặc hồ sơ xác thực đến các API tổ chức vì những khóa đó có thể thuộc về endpoint tùy chỉnh.

Thông tin xác thực quản trị được ưu tiên vì cung cấp dữ liệu hóa đơn thực tế của tổ chức. OpenClaw không kết hợp các tổng số do nhà cung cấp báo cáo này với ước tính phiên cục bộ; hai phần chủ ý trả lời các câu hỏi khác nhau.

## Chế độ chân trang mức sử dụng mặc định

`/usage off|tokens|full` đặt chân trang cho một phiên và lựa chọn này được ghi nhớ cho phiên đó. `messages.responseUsage` khởi tạo chế độ này cho các phiên chưa chọn chế độ, nhờ đó chân trang có thể được bật theo mặc định mà không cần nhập `/usage` mỗi lần.

Đặt một chế độ cho mọi kênh hoặc một ánh xạ theo từng kênh với phương án dự phòng `default`:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // hoặc: { "default": "off", "discord": "full" }
  },
}
```

Các giá trị được chấp nhận: `"off"`, `"tokens"`, `"full"` và bí danh cũ `"on"` (được xử lý như `"tokens"`).

### Ba trạng thái phiên riêng biệt

Trường `responseUsage` của một phiên có ba trạng thái có thể biểu diễn, mỗi trạng thái có ngữ nghĩa khác nhau:

| Trạng thái                 | Giá trị được lưu                | Chế độ có hiệu lực                                                                |
| -------------------------- | ------------------------------- | --------------------------------------------------------------------------------- |
| **Chưa đặt / kế thừa**     | `undefined` (không có)          | Chuyển tiếp đến mặc định cấu hình `messages.responseUsage`, sau đó là `off`.       |
| **Tắt rõ ràng**            | `"off"` (được lưu)              | Luôn tắt; mặc định cấu hình khác `off` không thể bật lại chân trang.               |
| **Bật rõ ràng**            | `"tokens"` hoặc `"full"` (được lưu) | Chế độ đó, bất kể mặc định cấu hình.                                           |

### Thứ tự ưu tiên

Chế độ có hiệu lực = ghi đè của phiên → mục cấu hình kênh → `default` → `off`.

Lệnh `/usage off` rõ ràng được **lưu bền vững** dưới dạng giá trị nguyên văn `"off"` trong phiên, không giống với trạng thái "chưa đặt". Mặc định `messages.responseUsage` khác `off` không thể bật lại chân trang sau khi người dùng đã tắt rõ ràng.

### Đặt lại và tắt

- `/usage off` buộc tắt chân trang và lưu bền vững lựa chọn đó. Mặc định khác `off` đã cấu hình không thể ghi đè lựa chọn này.
- `/usage reset` (các bí danh: `default`, `inherit`, `inherited`, `clear`, `unpin`) xóa ghi đè của phiên. Sau đó, phiên **kế thừa** mặc định cấu hình có hiệu lực (`messages.responseUsage`). Nếu không cấu hình mặc định, chân trang vẫn tắt.
- Việc đặt lại toàn bộ phiên (`/reset` hoặc `/new`) hay chuyển vòng phiên sẽ **giữ nguyên** tùy chọn chế độ mức sử dụng rõ ràng để lựa chọn hiển thị của người dùng được duy trì qua các lần chuyển vòng phiên. Chỉ `/usage reset` (và các bí danh của nó) mới xóa ghi đè.

### Hành vi chuyển đổi

`/usage` không có đối số sẽ tuần tự chuyển đổi: tắt → token → đầy đủ → tắt. Điểm bắt đầu của chu kỳ là chế độ hiện tại **có hiệu lực** (ghi đè của phiên chuyển tiếp đến mặc định cấu hình khi chưa đặt), vì vậy chu kỳ luôn khớp với nội dung người dùng hiện thấy trong chân trang.

### Cấu hình

Khi không có cấu hình, hành vi trước đây vẫn được giữ nguyên (chân trang tắt cho đến khi dùng `/usage`). Dùng `/usage reset` để xóa ghi đè của phiên và kế thừa lại mặc định đã cấu hình.

## Chân trang `/usage full` tùy chỉnh

`/usage tokens` luôn kết xuất một dòng thuần túy `Mức sử dụng: X vào / Y ra` (cùng các hậu tố bộ nhớ đệm và chi phí ước tính khi có). Chỉ `/usage full` kết xuất chân trang phong phú hơn được mô tả bên dưới.

`/usage full` hiển thị chân trang nhỏ gọn tích hợp sẵn với mô hình, mức suy luận, nhanh/chậm, cửa sổ ngữ cảnh và chi phí khi các trường đó có sẵn. Chân trang tích hợp sẵn không yêu cầu tệp mẫu.

`messages.usageTemplate` chỉ dành cho bố cục tùy chỉnh nâng cao. Giá trị là đường dẫn tệp JSON (hỗ trợ `~`) hoặc đối tượng nội tuyến và sẽ thay thế chân trang tích hợp sẵn khi hợp lệ. Đường dẫn tệp được theo dõi và tải lại trực tiếp khi có thay đổi.

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Mẫu bị thiếu hoặc rỗng sẽ âm thầm dùng chân trang tích hợp sẵn làm phương án dự phòng. Mẫu đã cấu hình nhưng không thể đọc hoặc không hợp lệ (JSON lỗi hoặc cấu trúc không có phần đầu ra nào có thể kết xuất) cũng sẽ dùng chân trang tích hợp sẵn làm phương án dự phòng và phát cảnh báo cho người vận hành.

Hãy bắt đầu mẫu tùy chỉnh từ cấu trúc tích hợp sẵn, sau đó chỉnh sửa các phần bạn muốn thay đổi:

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
        "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
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
          "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### Cấu trúc

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // chuỗi (1 ký hiệu/ký tự) hoặc mảng
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // nối các phần còn lại
    "default": [/* các phần */], // phương án dự phòng cho mọi bề mặt
    "surfaces": {
      "discord": [/* các phần */],
      "telegram": [/* các phần */],
    },
  },
}
```

Mỗi bề mặt là một danh sách **các phần** có thứ tự; bộ máy kết xuất từng phần, loại bỏ các phần rỗng và nối các phần còn lại bằng `sep`. Bề mặt không có mục tương ứng sẽ dùng `output.default`.

### Đường dẫn hợp đồng

Một phần đọc các giá trị từ hợp đồng theo từng lượt bằng đường dẫn dấu chấm. Các giá trị không có được xem là rỗng (vì vậy điều kiện bảo vệ `when` hoặc `|fallback` giữ cho phần đó gọn gàng).

| Đường dẫn                                                                          | Ý nghĩa                                                                                                     |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `surface`                                                                           | mã định danh kênh (`discord`/`telegram`/v.v.)                                                               |
| `agentId` / `chat_type`                                                             | mã định danh tác nhân sở hữu / loại bề mặt trò chuyện                                                       |
| `model.id` / `model.display_name` / `model.provider`                                | mã định danh mô hình / tên hiển thị / mã định danh nhà cung cấp                                             |
| `model.actual`, `model.resolved_ref`                                                | tham chiếu nhà cung cấp/mô hình thực sự được dùng cho lượt                                                  |
| `model.requested`                                                                   | tham chiếu nhà cung cấp/mô hình được yêu cầu (trước khi dự phòng)                                           |
| `model.reasoning`                                                                   | mức độ (`off` đến `xhigh`)                                                                                  |
| `model.is_fallback` / `model.is_override`                                           | bool: đã dùng phương án dự phòng / mô hình đã được ghim                                                     |
| `model.override_source` / `model.auth_mode`                                         | nhãn nguồn ghi đè / chế độ thông tin xác thực (`oauth`, `api-key`, `token`, `mixed`, `aws-sdk`, `unknown`)   |
| `state.fast_mode`                                                                   | bool: nhanh hay chậm                                                                                        |
| `state.compactions`                                                                 | số lần Compaction trong phiên                                                                               |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | hạn mức cửa sổ / số token đã chiếm dụng / tỷ lệ đã dùng từ 0-100                                           |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | tổng hợp theo lượt                                                                                          |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | số token đọc bộ nhớ đệm và ghi bộ nhớ đệm cho lượt                                                         |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | các điều kiện bảo vệ hiển thị token                                                                         |
| `usage.cache_hit_pct`                                                               | tỷ lệ phần đọc bộ nhớ đệm trong tổng số token của lời nhắc                                                  |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | chỉ lệnh gọi mô hình cuối cùng (cũng có `cache_read_tokens`, `cache_write_tokens`, `total_tokens`)           |
| `cost.turn_usd` / `cost.available`                                                  | chi phí ước tính của lượt / liệu có phân giải được bảng chi phí hay không                                   |
| `timing.duration_ms`                                                                | thời lượng thực tế của lượt                                                                                 |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | tên danh tính tác nhân / emoji / ảnh đại diện                                                               |
| `session.id`                                                                        | mã định danh phiên                                                                                          |

(Các cửa sổ giới hạn tốc độ của nhà cung cấp **không** thuộc hợp đồng này; hiện không có đường dẫn nào có giá trị dạng mảng, vì vậy một phần tử `each` không có gì để lặp.)

### Động từ

Truyền một giá trị qua các động từ từ trái sang phải; phân đoạn không phải động từ là giá trị dự phòng.

| Động từ         | Tác dụng                                          | Ví dụ                             |
| --------------- | ------------------------------------------------- | --------------------------------- |
| `num`           | rút gọn số đếm                                    | `272000 -> 272k`                  |
| `fixed:N`       | N chữ số thập phân (mặc định là 2)                | `0.0377`                          |
| `dur`           | chuyển số giây thành thời lượng                   | `14820 -> 4h07m`                  |
| `pct`           | thêm `%`                                          | `96 -> 96%`                       |
| `inv`           | `100 - x`                                         | từ tỷ lệ đã dùng sang còn lại     |
| `alias:TABLE`   | tra cứu trong `aliases`, giữ nguyên nếu không có  | `medium -> 🌗`                    |
| `meter:W:SCALE` | thanh ký tự W ô cho một giá trị từ 0-100          | `[⣿⣿⠐⠐⠐]` (`meter:1` = một ký tự) |

### Các dạng phần tử

- `{ "text": "📚 {context.max_tokens|num}" }`: văn bản cố định + nội suy.
- `{ "when": "<path>", "text": "..." }`: chỉ kết xuất nếu đường dẫn có giá trị đúng.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: ánh xạ giá trị thành ký tự (trường hợp `_default` bao phủ các giá trị không khớp).
- `{ "each": "<array-path>", "item": "{label}" }`: lặp qua một đường dẫn có giá trị dạng mảng (không có đường dẫn nào trong hợp đồng hiện tại là mảng).

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

kết xuất, chẳng hạn, thành `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`.

## Nhà cung cấp + thông tin xác thực

Thông tin sử dụng bị ẩn khi không thể phân giải được thông tin xác thực sử dụng hợp lệ của nhà cung cấp. OpenClaw tự động phát hiện các Plugin nhà cung cấp đã bật có khai báo `contracts.usageProviders` và triển khai cả `resolveUsageAuth` lẫn `fetchUsageSnapshot`; không có danh sách cho phép riêng dành cho nhà cung cấp trong lõi. Hợp đồng tĩnh giúp giới hạn phạm vi phát hiện mà không cần nhập mọi Plugin nhà cung cấp. Mỗi Plugin sở hữu điểm cuối thượng nguồn và ánh xạ phản hồi của mình. Ảnh chụp nhanh dùng chung giữ cho tên gói, cửa sổ hạn ngạch, số dư, chi tiêu và ngân sách không phụ thuộc vào nhà cung cấp để các thành phần CLI, ứng dụng và giao diện điều khiển sử dụng.

- **Anthropic (Claude)**: Token OAuth trong hồ sơ xác thực. Nếu token OAuth thiếu phạm vi `user:profile`, hệ thống chuyển sang dự phòng bằng phiên web `claude.ai` (`CLAUDE_AI_SESSION_KEY`, `CLAUDE_WEB_SESSION_KEY` hoặc cookie `sessionKey=` trong `CLAUDE_WEB_COOKIE`) khi được thiết lập. Các giới hạn theo phạm vi mô hình và chi tiêu/ngân sách hằng tháng cho mức sử dụng bổ sung đã bật được đưa vào khi Anthropic báo cáo chúng. Thay vào đó, khóa Anthropic Admin API được chỉ định rõ ràng hoặc hồ sơ nhà cung cấp `sk-ant-admin...` được tự động phát hiện sẽ hiển thị chi phí tổ chức trong 30 ngày và lịch sử Messages API.
- **ClawRouter**: Khóa API (`CLAWROUTER_API_KEY`). Hiển thị cửa sổ ngân sách hằng tháng và ngân sách USD có kiểu khi được cấu hình; nếu không, hiển thị tổng chi tiêu cùng bản tóm tắt yêu cầu/token/chi phí.
- **DeepSeek**: Khóa API qua biến môi trường/cấu hình/kho xác thực (`DEEPSEEK_API_KEY`). Hiển thị từng số dư tiền tệ do nhà cung cấp báo cáo.
- **GitHub Copilot**: Token OAuth trong hồ sơ xác thực.
- **Gemini CLI**: Token OAuth trong hồ sơ xác thực.
- **MiniMax**: Khóa API hoặc hồ sơ xác thực OAuth của MiniMax. OpenClaw coi `minimax`, `minimax-cn` và `minimax-portal` là cùng một bề mặt hạn ngạch MiniMax, ưu tiên OAuth MiniMax đã lưu khi có và nếu không thì chuyển sang dự phòng bằng `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` hoặc `MINIMAX_API_KEY`. Việc thăm dò mức sử dụng lấy máy chủ Coding Plan từ `models.providers.minimax-portal.baseUrl` hoặc `models.providers.minimax.baseUrl` khi được cấu hình; nếu không, hệ thống sử dụng máy chủ MiniMax CN. Các trường thô `usage_percent` / `usagePercent` của MiniMax biểu thị hạn ngạch **còn lại**, vì vậy OpenClaw đảo ngược chúng trước khi hiển thị; các trường dựa trên số lượng được ưu tiên khi có.
  - Nhãn cửa sổ lấy từ các trường giờ/phút của nhà cung cấp khi có, sau đó chuyển sang dự phòng bằng khoảng thời gian `start_time` / `end_time`.
  - Nếu điểm cuối của gói lập trình trả về `model_remains`, OpenClaw ưu tiên mục mô hình trò chuyện, suy ra nhãn cửa sổ từ dấu thời gian khi không có các trường `window_hours` / `window_minutes` rõ ràng và đưa tên mô hình vào nhãn gói.
- **OpenAI (gói Codex/ChatGPT)**: Token OAuth trong hồ sơ xác thực (gửi tiêu đề `ChatGPT-Account-Id` khi có mã định danh tài khoản). Hiển thị gói ChatGPT, các cửa sổ Codex có thể đặt lại và số dư tín dụng khi được báo cáo. Tín dụng vẫn là tín dụng của nhà cung cấp; OpenClaw không gắn nhãn chúng là đô la. `OPENAI_ADMIN_KEY` bổ sung chi phí tổ chức trong 30 ngày và lịch sử sử dụng completions khi khóa có quyền truy cập Usage Dashboard. Thông tin xác thực suy luận không bao giờ được chuyển tiếp đến các API của tổ chức.
- **OpenRouter**: Khóa API hoặc khóa API được OAuth hỗ trợ (`OPENROUTER_API_KEY` hoặc hồ sơ xác thực). Kết hợp điểm cuối tín dụng tài khoản với điểm cuối hạn ngạch khóa để số dư/chi tiêu tài khoản, ngân sách khóa và mức sử dụng hằng ngày/hằng tuần/hằng tháng xuất hiện khi thông tin xác thực có thể truy cập chúng. Mỗi điểm cuối đều có thể bổ sung độc lập cho ảnh chụp nhanh.
- **Venice**: Khóa API qua biến môi trường/cấu hình/kho xác thực (`VENICE_API_KEY`). Hiển thị số dư USD và DIEM cùng mức sử dụng phân bổ theo kỷ nguyên DIEM khi được báo cáo.
- **Xiaomi MiMo**: Hai bề mặt sử dụng riêng biệt. Hình thức trả theo mức sử dụng dùng khóa API (`XIAOMI_API_KEY`); Token Plan dùng một khóa riêng (`XIAOMI_TOKEN_PLAN_API_KEY`). Hiện cả hai đều không báo cáo cửa sổ hạn ngạch.
- **z.ai**: Khóa API qua biến môi trường/cấu hình/kho xác thực (`ZAI_API_KEY` hoặc `Z_AI_API_KEY`).

## Liên quan

- [Mức sử dụng token và chi phí](/vi/reference/token-use)
- [Mức sử dụng API và chi phí](/vi/reference/api-usage-costs)
- [Bộ nhớ đệm lời nhắc](/vi/reference/prompt-caching)
- [Thanh menu](/vi/platforms/mac/menu-bar)
