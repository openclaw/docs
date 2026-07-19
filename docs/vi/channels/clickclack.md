---
read_when:
    - Kết nối OpenClaw với một không gian làm việc ClickClack
    - Kiểm thử danh tính bot ClickClack
summary: Thiết lập kênh bằng token bot ClickClack và cú pháp đích
title: ClickClack
x-i18n:
    generated_at: "2026-07-19T05:33:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a8bc8acba1bf02acfb515ff486a04fc709e0be77caaf5d5e9e11e71a812bf73b
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack kết nối OpenClaw với một không gian làm việc ClickClack tự lưu trữ thông qua token bot ClickClack được hỗ trợ trực tiếp.

Sử dụng cách này khi bạn muốn một agent OpenClaw xuất hiện dưới dạng người dùng bot ClickClack. ClickClack hỗ trợ bot dịch vụ độc lập và bot thuộc sở hữu người dùng; bot thuộc sở hữu người dùng giữ một `owner_user_id` và chỉ nhận các phạm vi token mà bạn cấp.

## Thiết lập nhanh

Trong ClickClack, mở **Workspace settings → Integrations → OpenClaw**, tạo một
bot bằng **Setup code (recommended)**, rồi sao chép lệnh được tạo:

```bash
openclaw channels add clickclack --code 'https://clickclack.example.com/#XXXX-XXXX-XXXX'
```

Mã thiết lập chỉ dùng một lần và hết hạn sau 10 phút. OpenClaw xác nhận mã,
nhận token bot mới được cấp cùng các cài đặt không gian làm việc, lưu tài khoản,
xác minh kết nối và báo cáo Gateway đang chạy có nhận được tài khoản hay không.
Bản thân mã thiết lập không được lưu trong cấu hình OpenClaw.

Việc xác nhận mã thiết lập sử dụng HTTPS cho các máy chủ công khai. HTTP thuần cũng được hỗ trợ cho
các bản cài đặt cục bộ trên mạng loopback hoặc mạng riêng, bao gồm `localhost`,
địa chỉ IP riêng và tên máy chủ nội bộ chỉ phân giải thành
địa chỉ riêng.

Nếu OpenClaw đang chạy, ClickClack sẽ tự động kết nối và không cần lệnh thứ hai.
Nếu không, hãy khởi động bằng:

```bash
openclaw gateway
```

Bạn cũng có thể truyền mã riêng biệt với URL máy chủ:

```bash
openclaw channels add clickclack --code XXXX-XXXX-XXXX --base-url https://clickclack.example.com
```

Để thiết lập có hướng dẫn, hãy chạy:

```bash
openclaw onboard
```

Chọn ClickClack, sau đó nhập URL máy chủ, token bot và không gian làm việc khi
được nhắc. Quá trình thiết lập có hướng dẫn sẽ kiểm tra máy chủ, token và không gian làm việc sau khi lưu;
kiểm tra thất bại không loại bỏ cấu hình.

### Phương án khác: token thủ công

Chọn **Manual token** trong ClickClack khi cấu hình một máy khách không phải OpenClaw hoặc
khi bạn thực sự cần tự quản lý token:

```bash
openclaw channels add clickclack --base-url https://clickclack.example.com --token ccb_... --workspace default
```

`workspace` chấp nhận mã định danh không gian làm việc (`wsp_...`), slug hoặc tên hiển thị.
Không thể kết hợp `--code` với `--token`, `--token-file` hoặc `--use-env`.

### Phương án khác: token dựa trên biến môi trường

Tài khoản mặc định có thể đọc `CLICKCLACK_BOT_TOKEN` thay vì lưu token
trong cấu hình:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw channels add clickclack --base-url https://clickclack.example.com --workspace default --use-env
openclaw gateway
```

Các tài khoản có tên phải sử dụng token đã cấu hình hoặc tệp token; biến môi trường
dùng chung được chủ ý giới hạn cho tài khoản mặc định.

### Tham chiếu JSON5

Cấu trúc cấu hình tương đương là:

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

Một tài khoản chỉ được coi là đã cấu hình khi `baseUrl`, một nguồn token và
`workspace` đều được thiết lập. Nguồn token có thể là `token`, `tokenFile` hoặc
`CLICKCLACK_BOT_TOKEN` đối với tài khoản mặc định. `workspace` chấp nhận mã định danh không gian làm việc
(`wsp_...`), slug hoặc tên; Gateway phân giải giá trị đó thành mã định danh khi khởi động.

### Các khóa cấu hình tài khoản

| Khóa                     | Mặc định             | Ghi chú                                                                                   |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | không có (bắt buộc)     | URL máy chủ ClickClack.                                                                  |
| `token`                 | không có                | Token bot dưới dạng chuỗi thuần hoặc tham chiếu bí mật (`source: "env" \| "file" \| "exec"`).        |
| `tokenFile`             | không có                | Đường dẫn đến tệp token bot; được ưu tiên hơn `token`.                                |
| `workspace`             | không có (bắt buộc)     | Mã định danh, slug hoặc tên của không gian làm việc.                                                            |
| `replyMode`             | `"agent"`           | `"agent"` chạy toàn bộ pipeline agent; `"model"` gửi các lượt hoàn thành mô hình trực tiếp ngắn. |
| `defaultTo`             | `"channel:general"` | Đích được sử dụng khi đường gửi đi không cung cấp đích.                                      |
| `allowFrom`             | `["*"]`             | Danh sách cho phép mã định danh người dùng đối với tin nhắn trực tiếp và tin nhắn kênh gửi đến.                                 |
| `botUserId`             | tự động phát hiện       | Được phân giải từ danh tính token bot khi khởi động.                                        |
| `agentId`               | tuyến mặc định       | Ghim tin nhắn gửi đến của tài khoản này vào một agent.                                       |
| `toolsAllow`            | không có                | Danh sách công cụ được phép cho phản hồi của agent từ tài khoản này.                                     |
| `model`, `systemPrompt` | không có                | Được sử dụng bởi các lượt hoàn thành `replyMode: "model"`.                                               |
| `commandMenu`           | `true`              | Công bố các lệnh gốc vào tính năng tự động hoàn thành của trình soạn thảo ClickClack.                            |
| `reconnectMs`           | `1500`              | Độ trễ kết nối lại theo thời gian thực (100 đến 60000).                                                |

Nếu `plugins.allow` là một danh sách hạn chế không rỗng, việc chọn rõ ràng
ClickClack trong quá trình thiết lập kênh hoặc chạy `openclaw plugins enable clickclack`
sẽ thêm `clickclack` vào danh sách đó. Quá trình cài đặt trong bước hướng dẫn ban đầu cũng sử dụng
hành vi chọn rõ ràng này. Các đường dẫn này không ghi đè `plugins.deny` hoặc
cài đặt `plugins.enabled: false` toàn cục. Việc chạy trực tiếp
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

- `replyMode: "agent"` (mặc định) chuyển tiếp tin nhắn gửi đến qua pipeline agent thông thường, bao gồm ghi lại phiên và chính sách công cụ.
- `replyMode: "model"` bỏ qua pipeline agent và sử dụng `llm.complete` của môi trường chạy Plugin để bot phản hồi trực tiếp, với định dạng tùy chọn theo `model` và `systemPrompt`. Nhà cung cấp và mô hình được chọn chịu trách nhiệm về ngân sách hoàn thành.

Chế độ mô hình chạy các lượt hoàn thành dựa trên mã định danh agent bot đã phân giải, việc này yêu cầu
bit tin cậy `plugins.entries.clickclack.llm.allowAgentIdOverride: true` được bật rõ ràng:

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

Hãy để bit tin cậy tắt nếu bạn chỉ sử dụng chế độ phản hồi `agent` mặc định;
chế độ đó không cần bit này.

## Menu lệnh

Khi Gateway khởi động, mỗi tài khoản đã cấu hình sẽ công bố các
lệnh gốc của OpenClaw lên ClickClack. Chúng xuất hiện trong tính năng tự động hoàn thành của trình soạn thảo, được gắn nhãn bằng
tên định danh của bot. Tập lệnh được công bố sẽ được thay thế toàn bộ sau mỗi lần khởi động,
bao gồm cả việc xóa menu cũ khi danh mục lệnh gốc trống.

Đồng bộ menu lệnh được bật theo mặc định. Đặt `commandMenu: false` trên một tài khoản
để từ chối sử dụng:

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
riêng lẻ. Các token được tạo trước khi menu lệnh ra mắt có thể cần được
bổ sung phạm vi hoặc thay thế bằng token mới.

Quá trình đồng bộ được thực hiện theo khả năng tốt nhất và chạy một lần mỗi khi Gateway khởi động. Phạm vi bị thiếu hoặc lỗi mạng
sẽ ghi cảnh báo; máy chủ ClickClack cũ không có điểm cuối này sẽ ghi ở
cấp độ gỡ lỗi. Không lỗi nào trong số này chặn quá trình khởi động thời gian thực. Các menu vẫn
khả dụng khi agent ngoại tuyến và bị xóa khi bot rời khỏi
không gian làm việc.

Bản phát hành này chỉ công bố đặc tả lệnh gốc. Bí danh và các danh mục
lệnh của skill, Plugin hoặc lệnh tùy chỉnh không được thêm vào menu. Nếu một
tên cũng được đăng ký dưới dạng lệnh gạch chéo HTTP, ClickClack sẽ chuyển tiếp
đăng ký đó trước; các lệnh menu khác tiếp tục đi qua quy trình phân phối
tin nhắn thông thường.

Sử dụng chế độ `agent` để thu thập bằng chứng tương quan giữa các dịch vụ. Với một
mã định danh tin nhắn ClickClack có thẩm quyền ở dạng `msg_<ulid>` chuẩn, kênh sẽ suy ra
mã định danh lượt chạy OpenClaw tất định `clickclack:<message-id>`. Sau đó, mỗi lệnh gọi mô hình
hiển thị trong dữ liệu chẩn đoán dưới dạng `clickclack:<message-id>:model:<n>`; khi
lượt đó sử dụng ClawRouter, cùng mã định danh lệnh gọi mô hình được gửi dưới dạng `X-Request-ID`.
Chế độ `model` bỏ qua dữ liệu chẩn đoán phiên/lượt chạy agent thông thường và do đó
không phù hợp với đường dẫn bằng chứng này.

Khi một sự kiện thời gian thực chứa `payload.correlation_id` đã được xác thực,
kênh truyền giá trị đó dưới dạng `X-Correlation-ID` trong lần tìm nạp tin nhắn có thẩm quyền và
các yêu cầu phản hồi ClickClack phát sinh. Các giá trị sử dụng tập hợp 128 ký tự an toàn
của ClickClack (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` và `-`); các giá trị không hợp lệ
bị bỏ qua. Những phép nối này chỉ chứa mã định danh, tuyệt đối không chứa nội dung tin nhắn,
prompt, lượt hoàn thành, thông tin xác thực hoặc đầu ra công cụ.

## Phân phối nội dung đa phương tiện bền vững

Các phản hồi của agent có chứa nội dung đa phương tiện sử dụng cơ chế phân phối bền vững bắt buộc. OpenClaw gán
các nonce tin nhắn và tải lên ổn định cho từng phần trước lần ghi ClickClack đầu tiên, nhờ đó
lần thử lại sẽ tái sử dụng cùng lượt tải lên và tin nhắn thay vì tiêu tốn hạn ngạch lưu trữ
hoặc công bố bản trùng lặp. Nếu một lượt tải lên đã tồn tại sau khi khởi động lại,
OpenClaw không đọc lại đường dẫn cục bộ ban đầu hoặc URL nội dung đa phương tiện từ xa.

Hợp đồng khôi phục này yêu cầu máy chủ ClickClack hỗ trợ:

- `GET /api/uploads/by-nonce` với
  `X-ClickClack-Upload-Nonce: supported` trong cả kết quả tìm thấy và không tìm thấy.
- `GET /api/messages/by-nonce` với
  `X-ClickClack-Message-Nonce: supported` trong cả kết quả tìm thấy và không tìm thấy.
- Tạo tin nhắn và liên kết tệp đính kèm theo cách lũy đẳng đối với cùng
  nonce và lượt tải lên trong phạm vi chủ sở hữu.

Mã 404 chung của máy chủ cũ không được coi là bằng chứng rằng một lượt gửi không tồn tại.
OpenClaw để trạng thái phân phối chưa được giải quyết thay vì mạo hiểm tạo bản trùng lặp; hãy cập nhật
ClickClack trước khi bật các phản hồi agent tạo nội dung đa phương tiện.

## Hàng hoạt động của agent

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

- **Mặc định tắt.** Các thiết lập tiêu chuẩn và máy chủ ClickClack cũ không bị ảnh hưởng.
- **Yêu cầu phạm vi token `agent_activity:write`.** Phạm vi này tách biệt với `bot:write` và không được kế thừa từ phạm vi đó; hãy tạo token bot với `--scopes bot:write,agent_activity:write` (hoặc cấp phạm vi này cho token hiện có) trước khi bật tùy chọn.
- **Suy giảm theo nỗ lực tối đa.** Nếu token thiếu `agent_activity:write` hoặc máy chủ từ chối ghi hoạt động, lỗi sẽ được ghi nhật ký và câu trả lời cuối cùng vẫn được gửi bình thường; không có hàng hoạt động nào xuất hiện.
- Các hàng được nhóm theo từng lượt (`turn_id`), được hợp nhất để mỗi bước logic tương ứng với một hàng, và các hàng công cụ sử dụng cùng định dạng tiến trình như Discord/Slack/Telegram (tên công cụ cùng chi tiết lệnh).
- **Siêu dữ liệu ghi nhận nguồn.** Các bài đăng do tác tử tạo (các hàng hoạt động và câu trả lời cuối cùng) mang các trường `author_model` và `author_thinking` được phân giải từ mô hình thực tế dùng cho lượt đó (kể cả sau khi dự phòng). Máy chủ không định nghĩa các cột này sẽ bỏ qua những trường JSON không xác định; máy chủ lưu trữ chúng có thể trả lời câu hỏi "mô hình nào đã nói dòng này, ở mức độ suy luận nào" cho từng tin nhắn.

## Đích

- `channel:<name-or-id>` gửi đến một kênh trong không gian làm việc. Đích không có tiền tố mặc định là `channel:`.
- `dm:<user_id>` tạo hoặc tái sử dụng cuộc trò chuyện trực tiếp với người dùng đó.
- `thread:<message_id>` trả lời trong luồng bắt nguồn từ tin nhắn đó.

Đích gửi đi được chỉ định rõ cũng có thể mang tiền tố nhà cung cấp `clickclack:` hoặc `cc:`.

Nội dung đa phương tiện gửi đi sử dụng API tải lên của ClickClack rồi đính kèm bản tải lên bền vững
vào tin nhắn kênh, câu trả lời trong luồng hoặc tin nhắn trực tiếp đã tạo. Tệp cục bộ và URL
nội dung đa phương tiện từ xa được hỗ trợ tuân theo chính sách truy cập nội dung đa phương tiện thông thường của OpenClaw, với giới hạn
64 MiB cho mỗi tệp. Các lượt gửi bền vững trong hàng đợi sử dụng nonce riêng theo phạm vi chủ sở hữu cho từng
phần tải lên và tin nhắn, sau đó thử lại việc liên kết tệp đính kèm với chính các
đối tượng đó. Xem [Phân phối nội dung đa phương tiện bền vững](#durable-media-delivery) để biết hợp đồng máy chủ
và hành vi khôi phục.

Ví dụ:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Quyền

Các phạm vi token ClickClack được API ClickClack thực thi.

- `bot:read`: đọc dữ liệu không gian làm việc/kênh/tin nhắn/luồng/tin nhắn trực tiếp/thời gian thực/hồ sơ.
- `bot:write`: `bot:read` cùng với tin nhắn kênh, câu trả lời trong luồng, tin nhắn trực tiếp, nội dung tải lên và xuất bản menu lệnh.
- `bot:admin`: `bot:write` cùng với khả năng tạo kênh.
- `commands:write`: xuất bản menu lệnh của bot. Được bao gồm trong các gói `bot:write` và `bot:admin` hiện tại, đồng thời có thể được cấp riêng lẻ.
- `agent_activity:write`: các hàng hoạt động bền vững của tác tử (`agent_commentary` / `agent_tool`). Không được kế thừa bởi `bot:write` hoặc `bot:admin`; chỉ bắt buộc khi `agentActivity: true` được đặt.

OpenClaw chỉ cần `bot:write` hiện tại cho trò chuyện tác tử thông thường và đồng bộ menu lệnh. Thêm `agent_activity:write` khi bật [các hàng hoạt động của tác tử](#agent-activity-rows).

## Khắc phục sự cố

- `ClickClack is not configured for account "<id>"`: đặt `baseUrl`, `token` (ví dụ qua `CLICKCLACK_BOT_TOKEN`) và `workspace` cho tài khoản đó.
- `ClickClack workspace not found: <value>`: đặt `workspace` thành id, slug hoặc tên không gian làm việc do ClickClack trả về.
- Không có câu trả lời đến: xác nhận token có quyền đọc theo thời gian thực và lưu ý rằng bot bỏ qua tin nhắn của chính nó cũng như tin nhắn từ các bot khác.
- Gửi đến kênh không thành công: xác minh bot là thành viên của không gian làm việc và có `bot:write`.
- Không có menu lệnh: xác nhận `commandMenu` không phải là `false`, máy chủ ClickClack hỗ trợ `PUT /api/bots/self/commands` và token có `commands:write`.
