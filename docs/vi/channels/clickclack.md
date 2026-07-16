---
read_when:
    - Kết nối OpenClaw với không gian làm việc ClickClack
    - Kiểm thử danh tính bot ClickClack
summary: Thiết lập kênh bằng token bot ClickClack và cú pháp đích
title: ClickClack
x-i18n:
    generated_at: "2026-07-16T14:00:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c422664ecdc9e41eb1810ca61654b886f1c51357fb9f48054d30c20a86ea8bc
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack kết nối OpenClaw với một không gian làm việc ClickClack tự lưu trữ thông qua token bot ClickClack hạng nhất.

Hãy dùng cách này khi bạn muốn một agent OpenClaw xuất hiện dưới dạng người dùng bot ClickClack. ClickClack hỗ trợ bot dịch vụ độc lập và bot do người dùng sở hữu; bot do người dùng sở hữu giữ một `owner_user_id` và chỉ nhận các phạm vi token mà bạn cấp.

## Thiết lập nhanh

Trong ClickClack, mở **Workspace settings → Integrations → OpenClaw**, tạo một
bot và sao chép token của bot đó. Sau đó cấu hình kênh:

```bash
openclaw channels add clickclack --base-url https://clickclack.example.com --token ccb_... --workspace default
```

`workspace` chấp nhận id không gian làm việc (`wsp_...`), slug hoặc tên hiển thị.
`channels add` xác minh máy chủ, token và không gian làm việc sau khi lưu, rồi
báo cáo liệu Gateway đang chạy đã nhận tài khoản mới hay chưa. Nếu OpenClaw
đang chạy, ClickClack sẽ tự động kết nối và không cần lệnh thứ hai.
Nếu không, hãy khởi động bằng:

```bash
openclaw gateway
```

Để thiết lập có hướng dẫn, hãy chạy:

```bash
openclaw onboard
```

Chọn ClickClack, sau đó nhập URL máy chủ, token bot và không gian làm việc khi
được nhắc. Quy trình thiết lập có hướng dẫn sẽ kiểm tra máy chủ, token và không gian làm việc sau khi lưu; nếu
kiểm tra thất bại, cấu hình vẫn không bị loại bỏ.

### Phương án khác: token dựa trên biến môi trường

Tài khoản mặc định có thể đọc `CLICKCLACK_BOT_TOKEN` thay vì lưu token
trong cấu hình:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw channels add clickclack --base-url https://clickclack.example.com --workspace default --use-env
openclaw gateway
```

Tài khoản có tên phải sử dụng token đã cấu hình hoặc tệp token; biến môi trường
dùng chung được chủ ý giới hạn ở tài khoản mặc định.

### Tham chiếu JSON5

Dạng cấu hình tương đương là:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

Một tài khoản chỉ được coi là đã cấu hình khi `baseUrl`, nguồn token và
`workspace` đều được đặt. Nguồn token có thể là `token`, `tokenFile` hoặc
`CLICKCLACK_BOT_TOKEN` đối với tài khoản mặc định. `workspace` chấp nhận id không gian làm việc
(`wsp_...`), slug hoặc tên; Gateway phân giải giá trị đó thành id khi khởi động.

### Các khóa cấu hình tài khoản

| Khóa                    | Mặc định            | Ghi chú                                                                                 |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | không có (bắt buộc) | URL máy chủ ClickClack.                                                                 |
| `token`                 | không có            | Token bot dưới dạng chuỗi thuần hoặc tham chiếu bí mật (`source: "env" \| "file" \| "exec"`).             |
| `tokenFile`             | không có            | Đường dẫn đến tệp token bot; được ưu tiên hơn `token`.                        |
| `workspace`             | không có (bắt buộc) | Id, slug hoặc tên không gian làm việc.                                                   |
| `replyMode`             | `"agent"`           | `"agent"` chạy toàn bộ quy trình agent; `"model"` gửi các lượt hoàn thành mô hình trực tiếp ngắn. |
| `defaultTo`             | `"channel:general"` | Đích được dùng khi đường gửi đi không cung cấp đích.                                     |
| `allowFrom`             | `["*"]`             | Danh sách cho phép theo id người dùng đối với DM và tin nhắn kênh đến.                   |
| `botUserId`             | tự động phát hiện   | Được phân giải từ danh tính của token bot khi khởi động.                                 |
| `agentId`               | mặc định của tuyến  | Ghim tin nhắn đến của tài khoản này vào một agent.                                      |
| `toolsAllow`            | không có            | Danh sách công cụ được phép dùng cho phản hồi của agent từ tài khoản này.                |
| `model`, `systemPrompt` | không có            | Được dùng bởi các lượt hoàn thành `replyMode: "model"`.                                    |
| `commandMenu`           | `true`              | Công bố các lệnh gốc lên tính năng tự động hoàn thành trong trình soạn thảo ClickClack.  |
| `reconnectMs`           | `1500`              | Độ trễ kết nối lại theo thời gian thực (100 đến 60000).                                  |

Nếu `plugins.allow` là một danh sách hạn chế không rỗng, việc chọn rõ ràng
ClickClack trong phần thiết lập kênh hoặc chạy `openclaw plugins enable clickclack`
sẽ thêm `clickclack` vào danh sách đó. Việc cài đặt trong quy trình nhập môn sử dụng cùng
hành vi chọn rõ ràng. Các đường dẫn này không ghi đè `plugins.deny` hoặc
thiết lập `plugins.enabled: false` toàn cục. Việc gọi trực tiếp
`openclaw plugins install @openclaw/clickclack` tuân theo chính sách
cài đặt Plugin thông thường và cũng ghi ClickClack vào danh sách cho phép hiện có.

## Nhiều bot

Mỗi tài khoản mở kết nối thời gian thực ClickClack riêng và sử dụng token bot riêng.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## Chế độ phản hồi

- `replyMode: "agent"` (mặc định) điều phối tin nhắn đến qua quy trình agent thông thường, bao gồm ghi phiên và chính sách công cụ.
- `replyMode: "model"` bỏ qua quy trình agent và sử dụng `llm.complete` của runtime Plugin để phản hồi trực tiếp qua bot, có thể được định hình bằng `model` và `systemPrompt`. Nhà cung cấp và mô hình được chọn sở hữu ngân sách hoàn thành.

Chế độ mô hình chạy các lượt hoàn thành dựa trên id agent bot đã phân giải, việc này yêu cầu
bit tin cậy `plugins.entries.clickclack.llm.allowAgentIdOverride: true` được đặt rõ ràng:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
}
```

Giữ bit tin cậy ở trạng thái tắt nếu bạn chỉ sử dụng chế độ phản hồi `agent` mặc định;
chế độ đó không cần bit này.

## Trình đơn lệnh

Khi Gateway khởi động, mỗi tài khoản đã cấu hình sẽ công bố các lệnh gốc của
OpenClaw lên ClickClack. Chúng xuất hiện trong tính năng tự động hoàn thành của trình soạn thảo với nhãn là
handle của bot. Tập lệnh đã công bố được thay thế toàn bộ sau mỗi lần khởi động,
bao gồm cả việc xóa trình đơn cũ khi danh mục lệnh gốc trống.

Đồng bộ trình đơn lệnh được bật theo mặc định. Đặt `commandMenu: false` trên một tài khoản
để không tham gia:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      commandMenu: false,
    },
  },
}
```

Token cần `commands:write`. Các gói `bot:write` và
`bot:admin` hiện tại của ClickClack bao gồm phạm vi đó, và phạm vi này cũng có thể được cấp
riêng lẻ. Các token được tạo trước khi trình đơn lệnh ra mắt có thể cần được
bổ sung phạm vi hoặc thay thế bằng token mới.

Quá trình đồng bộ được thực hiện theo khả năng tốt nhất và chạy một lần cho mỗi lần Gateway khởi động. Thiếu phạm vi hoặc lỗi
mạng sẽ ghi cảnh báo; máy chủ ClickClack cũ không có endpoint này sẽ ghi ở
mức gỡ lỗi. Không lỗi nào trong số này ngăn quá trình khởi động thời gian thực. Trình đơn vẫn
khả dụng khi agent ngoại tuyến và sẽ bị xóa khi bot rời khỏi
không gian làm việc.

Bản phát hành này chỉ công bố đặc tả lệnh gốc. Bí danh và
các danh mục lệnh của skill, Plugin hoặc lệnh tùy chỉnh không được thêm vào trình đơn. Nếu một
tên cũng được đăng ký làm lệnh gạch chéo HTTP, ClickClack sẽ điều phối
đăng ký đó trước; các lệnh khác trong trình đơn tiếp tục đi qua cơ chế phân phối
tin nhắn thông thường.

Sử dụng chế độ `agent` để thu thập bằng chứng tương quan giữa các dịch vụ. Với id tin nhắn
ClickClack có thẩm quyền ở dạng `msg_<ulid>` chuẩn, kênh suy ra
id lượt chạy OpenClaw xác định `clickclack:<message-id>`. Sau đó, mỗi lần gọi mô hình
được hiển thị trong chẩn đoán dưới dạng `clickclack:<message-id>:model:<n>`; khi
lượt đó sử dụng ClawRouter, cùng id lần gọi mô hình sẽ được gửi dưới dạng `X-Request-ID`.
Chế độ `model` bỏ qua chẩn đoán lượt chạy/phiên agent thông thường, do đó
không phù hợp với đường thu thập bằng chứng này.

Khi một sự kiện thời gian thực chứa `payload.correlation_id` đã được xác thực,
kênh chuyển tiếp giá trị đó dưới dạng `X-Correlation-ID` trong lần truy xuất tin nhắn có thẩm quyền và
các yêu cầu phản hồi ClickClack tạo ra. Các giá trị sử dụng
tập ký tự an toàn 128 ký tự của ClickClack (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` và `-`); các giá trị không hợp lệ
bị bỏ qua. Các phép nối này chỉ chứa mã định danh, tuyệt đối không chứa nội dung tin nhắn,
lời nhắc, lượt hoàn thành, thông tin xác thực hoặc đầu ra công cụ.

## Phân phối nội dung đa phương tiện bền vững

Các phản hồi của agent chứa nội dung đa phương tiện sử dụng cơ chế phân phối bền vững bắt buộc. OpenClaw gán
nonce ổn định cho từng phần tin nhắn và lượt tải lên trước lần ghi ClickClack đầu tiên, vì vậy
khi thử lại sẽ tái sử dụng cùng lượt tải lên và tin nhắn thay vì tiêu thụ hạn ngạch lưu trữ
hoặc công bố nội dung trùng lặp. Nếu lượt tải lên đã tồn tại sau khi khởi động lại,
OpenClaw không đọc lại đường dẫn cục bộ gốc hoặc URL nội dung đa phương tiện từ xa.

Hợp đồng khôi phục này yêu cầu máy chủ ClickClack hỗ trợ:

- `GET /api/uploads/by-nonce` với
  `X-ClickClack-Upload-Nonce: supported` đối với cả kết quả tìm thấy và không tìm thấy.
- `GET /api/messages/by-nonce` với
  `X-ClickClack-Message-Nonce: supported` đối với cả kết quả tìm thấy và không tìm thấy.
- Tạo tin nhắn và liên kết tệp đính kèm theo cách bất biến khi lặp lại đối với cùng
  nonce và lượt tải lên có phạm vi theo chủ sở hữu.

Mã 404 chung từ máy chủ cũ không được coi là bằng chứng cho thấy một lần gửi không tồn tại.
OpenClaw giữ trạng thái phân phối chưa được giải quyết thay vì mạo hiểm tạo bản sao; hãy cập nhật
ClickClack trước khi bật các phản hồi agent tạo nội dung đa phương tiện.

## Các hàng hoạt động của agent

Theo mặc định, kênh ClickClack không hiển thị gì trong khi một lượt agent đang chạy; chỉ phản hồi cuối cùng được gửi đến. Đặt `agentActivity: true` trên một tài khoản để công bố các hàng tin nhắn `agent_commentary` và `agent_tool` bền vững trong khi lượt đang diễn ra:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      agentActivity: true,
    },
  },
}
```

Yêu cầu và hành vi:

- **Tắt theo mặc định.** Các thiết lập tiêu chuẩn và máy chủ ClickClack cũ không bị ảnh hưởng.
- **Yêu cầu phạm vi token `agent_activity:write`.** Phạm vi này tách biệt với `bot:write` và không được kế thừa từ phạm vi đó; hãy tạo token bot với `--scopes bot:write,agent_activity:write` (hoặc cấp phạm vi này cho token hiện có) trước khi bật tùy chọn.
- **Suy giảm theo khả năng tốt nhất.** Nếu token thiếu `agent_activity:write` hoặc máy chủ từ chối ghi hoạt động, lỗi sẽ được ghi nhật ký và phản hồi cuối cùng vẫn được phân phối bình thường; không có hàng hoạt động nào xuất hiện.
- Các hàng được nhóm theo từng lượt (`turn_id`), được hợp nhất để mỗi bước logic tương ứng với một hàng, và các hàng công cụ sử dụng cùng định dạng tiến trình như Discord/Slack/Telegram (tên công cụ cộng với chi tiết lệnh).
- **Siêu dữ liệu phân bổ.** Các bài đăng do agent tạo (các hàng hoạt động và phản hồi cuối cùng) mang các trường `author_model` và `author_thinking` được phân giải từ mô hình thực tế dùng cho lượt đó (bao gồm cả sau khi dự phòng). Các máy chủ không định nghĩa những cột này sẽ bỏ qua các trường JSON không xác định; các máy chủ lưu chúng có thể trả lời "mô hình nào đã nói dòng này, ở mức độ suy luận nào" cho từng tin nhắn.

## Đích

- `channel:<name-or-id>` gửi đến một kênh trong không gian làm việc. Các đích không có tiền tố mặc định là `channel:`.
- `dm:<user_id>` tạo hoặc tái sử dụng cuộc trò chuyện trực tiếp với người dùng đó.
- `thread:<message_id>` trả lời trong luồng bắt nguồn từ tin nhắn đó.

Các đích gửi đi được chỉ định rõ cũng có thể mang tiền tố nhà cung cấp `clickclack:` hoặc `cc:`.

Nội dung đa phương tiện gửi đi sử dụng API tải lên của ClickClack, sau đó đính kèm bản tải lên bền vững
vào tin nhắn kênh, câu trả lời trong luồng hoặc tin nhắn trực tiếp đã tạo. Các tệp cục bộ và URL nội dung
đa phương tiện từ xa được hỗ trợ tuân theo chính sách truy cập nội dung đa phương tiện thông thường của OpenClaw, với giới hạn
64 MiB cho mỗi tệp. Các lượt gửi bền vững trong hàng đợi sử dụng nonce riêng theo phạm vi chủ sở hữu cho từng
phần tải lên và tin nhắn, sau đó thử lại việc liên kết tệp đính kèm với chính các
đối tượng đó. Xem [Phân phối nội dung đa phương tiện bền vững](#durable-media-delivery) để biết hợp đồng
máy chủ và hành vi khôi phục.

Ví dụ:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Quyền

Các phạm vi token ClickClack được API ClickClack thực thi.

- `bot:read`: đọc dữ liệu không gian làm việc/kênh/tin nhắn/luồng/tin nhắn trực tiếp/thời gian thực/hồ sơ.
- `bot:write`: `bot:read` cộng với tin nhắn kênh, câu trả lời trong luồng, tin nhắn trực tiếp, lượt tải lên và xuất bản menu lệnh.
- `bot:admin`: `bot:write` cộng với khả năng tạo kênh.
- `commands:write`: xuất bản menu lệnh của bot. Có trong các gói `bot:write` và `bot:admin` hiện tại, đồng thời có thể được cấp riêng.
- `agent_activity:write`: các hàng hoạt động bền vững của tác nhân (`agent_commentary` / `agent_tool`). Không được kế thừa bởi `bot:write` hoặc `bot:admin`; chỉ bắt buộc khi `agentActivity: true` được đặt.

OpenClaw chỉ cần `bot:write` hiện tại cho hoạt động trò chuyện thông thường của tác nhân và đồng bộ hóa menu lệnh. Thêm `agent_activity:write` khi bật [các hàng hoạt động của tác nhân](#agent-activity-rows).

## Khắc phục sự cố

- `ClickClack is not configured for account "<id>"`: đặt `baseUrl`, `token` (ví dụ thông qua `CLICKCLACK_BOT_TOKEN`) và `workspace` cho tài khoản đó.
- `ClickClack workspace not found: <value>`: đặt `workspace` thành id, slug hoặc tên không gian làm việc do ClickClack trả về.
- Không có câu trả lời gửi đến: xác nhận token có quyền đọc thời gian thực và lưu ý rằng bot bỏ qua tin nhắn của chính nó cũng như tin nhắn từ các bot khác.
- Gửi đến kênh không thành công: xác minh bot là thành viên của không gian làm việc và có `bot:write`.
- Không có menu lệnh: xác nhận `commandMenu` không phải là `false`, máy chủ ClickClack hỗ trợ `PUT /api/bots/self/commands` và token có `commands:write`.
