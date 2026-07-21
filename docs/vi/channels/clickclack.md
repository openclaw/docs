---
read_when:
    - Kết nối OpenClaw với một không gian làm việc ClickClack
    - Kiểm thử danh tính bot ClickClack
summary: Thiết lập kênh bằng token bot ClickClack và cú pháp đích
title: ClickClack
x-i18n:
    generated_at: "2026-07-21T13:29:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 761538cdd7a916415719131b9ff2f40bf3e3e0eab0f7bda450250886acde8a64
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack kết nối OpenClaw với một không gian làm việc ClickClack tự lưu trữ thông qua token bot ClickClack được hỗ trợ trực tiếp.

Sử dụng cách này khi bạn muốn một agent OpenClaw xuất hiện dưới dạng người dùng bot ClickClack. ClickClack hỗ trợ bot dịch vụ độc lập và bot thuộc sở hữu của người dùng; bot thuộc sở hữu của người dùng giữ một `owner_user_id` và chỉ nhận các phạm vi token mà bạn cấp.

## Thiết lập nhanh

Trong ClickClack, mở **Workspace settings → Integrations → OpenClaw**, tạo một
bot bằng **Setup code (recommended)** rồi sao chép lệnh được tạo:

```bash
openclaw channels add clickclack --code 'https://clickclack.example.com/#XXXX-XXXX-XXXX'
```

Đối với frontend và API có origin riêng biệt hoặc API được gắn dưới một đường dẫn, ClickClack sẽ cung cấp
endpoint xác nhận chính xác thay thế:

```bash
openclaw channels add clickclack --code 'https://api.example.com/services/clickclack/api/bot-setup-codes/claim#XXXX-XXXX-XXXX'
```

Mã thiết lập chỉ dùng được một lần và hết hạn sau 10 phút. OpenClaw xác nhận mã,
nhận token bot mới được tạo cùng các thiết lập không gian làm việc, lưu tài khoản,
xác minh kết nối và báo cáo liệu Gateway đang chạy đã nhận cấu hình đó hay chưa.
Đối với các endpoint chính xác có phiên bản, OpenClaw xác thực và lưu API base chuẩn
do ClickClack trả về, bao gồm mọi tiền tố đường dẫn. Bản thân mã thiết lập
không được lưu trong cấu hình OpenClaw.

Việc xác nhận mã thiết lập sử dụng HTTPS cho các máy chủ công khai. HTTP thuần cũng được hỗ trợ cho
các bản cài đặt cục bộ trên địa chỉ loopback như `localhost` và `127.0.0.1`.

Nếu OpenClaw đang chạy, ClickClack sẽ tự động kết nối và không cần lệnh thứ hai.
Nếu không, hãy khởi động bằng:

```bash
openclaw gateway
```

Bạn cũng có thể truyền mã riêng với URL máy chủ:

```bash
openclaw channels add clickclack --code XXXX-XXXX-XXXX --base-url https://clickclack.example.com
```

Để thiết lập có hướng dẫn, hãy chạy:

```bash
openclaw onboard
```

Chọn ClickClack, sau đó nhập URL máy chủ, token bot và không gian làm việc khi
được nhắc. Quy trình thiết lập có hướng dẫn sẽ kiểm tra máy chủ, token và không gian làm việc sau khi lưu;
kiểm tra thất bại không loại bỏ cấu hình.

### Phương án khác: token thủ công

Chọn **Manual token** trong ClickClack khi cấu hình một ứng dụng khách không phải OpenClaw hoặc
khi bạn cần tự quản lý token một cách rõ ràng:

```bash
openclaw channels add clickclack --base-url https://clickclack.example.com --token ccb_... --workspace default
```

`workspace` chấp nhận id không gian làm việc (`wsp_...`), slug hoặc tên hiển thị.
Không thể kết hợp `--code` với `--token`, `--token-file` hoặc `--use-env`.

### Phương án khác: token dựa trên biến môi trường

Tài khoản mặc định có thể đọc `CLICKCLACK_BOT_TOKEN` thay vì lưu token
trong cấu hình:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw channels add clickclack --base-url https://clickclack.example.com --workspace default --use-env
openclaw gateway
```

Các tài khoản được đặt tên phải sử dụng token đã cấu hình hoặc tệp token; biến môi trường
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

Một tài khoản chỉ được coi là đã cấu hình khi `baseUrl`, nguồn token và
`workspace` đều được thiết lập. Nguồn token có thể là `token`, `tokenFile` hoặc
`CLICKCLACK_BOT_TOKEN` đối với tài khoản mặc định. `workspace` chấp nhận id không gian làm việc
(`wsp_...`), slug hoặc tên; Gateway phân giải giá trị này thành id khi khởi động.

### Các khóa cấu hình tài khoản

| Khóa                    | Mặc định            | Ghi chú                                                                                 |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | không có (bắt buộc) | URL ClickClack công khai dùng cho các liên kết hiển thị trên trình duyệt.                |
| `apiBaseUrl`            | `baseUrl`           | Endpoint máy chủ với máy chủ tùy chọn cho lưu lượng REST và WebSocket thời gian thực.    |
| `token`                 | không có            | Token bot dưới dạng chuỗi thuần hoặc tham chiếu bí mật (`source: "env" \| "file" \| "exec"`).             |
| `tokenFile`             | không có            | Đường dẫn đến tệp token bot; được ưu tiên hơn `token`.                        |
| `workspace`             | không có (bắt buộc) | Id, slug hoặc tên không gian làm việc.                                                   |
| `replyMode`             | `"agent"`           | `"agent"` chạy toàn bộ pipeline agent; `"model"` gửi các phản hồi hoàn thành trực tiếp ngắn từ mô hình. |
| `defaultTo`             | `"channel:general"` | Đích được sử dụng khi đường dẫn gửi đi không cung cấp đích.                              |
| `allowFrom`             | `["*"]`             | Danh sách cho phép theo id người dùng đối với tin nhắn trực tiếp và tin nhắn kênh đến.   |
| `botUserId`             | tự động phát hiện   | Được phân giải từ danh tính token bot khi khởi động.                                     |
| `agentId`               | định tuyến mặc định | Ghim tin nhắn đến của tài khoản này vào một agent.                                       |
| `toolsAllow`            | không có            | Danh sách công cụ được phép dùng cho phản hồi của agent từ tài khoản này.                |
| `model`, `systemPrompt` | không có            | Được dùng bởi các phản hồi hoàn thành `replyMode: "model"`.                                |
| `commandMenu`           | `true`              | Xuất bản các lệnh gốc vào tính năng tự động hoàn thành của trình soạn thảo ClickClack.   |
| `reconnectMs`           | `1500`              | Độ trễ kết nối lại theo thời gian thực (100 đến 60000).                                  |
| `discussions`           | đã tắt              | Thiết lập kênh được quản lý theo từng phiên; xem [Thảo luận phiên](#session-discussions). |

### Duy trì tên máy chủ công khai có cổng xác thực

Sử dụng `apiBaseUrl` khi ClickClack và Gateway OpenClaw chạy trên cùng một máy chủ
nhưng tên máy chủ ClickClack công khai được bảo vệ bởi Gateway xác thực
như Cloudflare Access:

```json5
{
  channels: {
    clickclack: {
      baseUrl: "https://clack.openclaw.ai",
      apiBaseUrl: "http://127.0.0.1:8484",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
    },
  },
}
```

Tên máy chủ công khai có thể tiếp tục được bảo vệ hoàn toàn bằng cổng xác thực đối với người dùng trình duyệt. OpenClaw
sử dụng endpoint loopback cho các yêu cầu REST, xác minh thiết lập và
WebSocket thời gian thực, trong khi các liên kết `embedUrl` và `openUrl` của cuộc thảo luận tiếp tục
sử dụng `baseUrl` công khai. Nếu bỏ qua `apiBaseUrl`, mọi lưu lượng sẽ sử dụng
`baseUrl`, duy trì hành vi hiện có.

Nếu `plugins.allow` là một danh sách hạn chế không rỗng, việc chọn rõ ràng
ClickClack trong thiết lập kênh hoặc chạy `openclaw plugins enable clickclack`
sẽ thêm `clickclack` vào danh sách đó. Việc cài đặt trong quy trình khởi tạo sử dụng cùng
hành vi chọn rõ ràng. Các đường dẫn này không ghi đè `plugins.deny` hoặc
thiết lập `plugins.enabled: false` toàn cục. Việc chạy trực tiếp
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

## Thảo luận phiên

Bật thảo luận trên một tài khoản ClickClack để cấp cho mỗi phiên OpenClaw một
kênh ClickClack chuyên dụng. Token tài khoản phải bao gồm
`channels:write` (gói `bot:admin` có bao gồm phạm vi này); token thiết lập `bot:write`
thông thường không thể tạo hoặc đồng bộ hóa kênh.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      discussions: {
        enabled: true,
        workspace: "default",
        controlUrlBase: "https://team.openclaw.ai",
        section: "Sessions",
      },
    },
  },
}
```

`discussions.workspace` chấp nhận cùng id, slug hoặc tên hiển thị của không gian làm việc
như `workspace` ở cấp tài khoản và mặc định dùng giá trị đó. `section` kiểm soát
phần thanh bên ClickClack và mặc định là `Sessions`. Khi
`controlUrlBase` được thiết lập, kênh được quản lý sẽ liên kết ngược đến tuyến phiên thực tế của Control UI,
`/chat?session=<encoded-session-key>`.

Chỉ bật thảo luận trên đúng một tài khoản ClickClack. Nhà cung cấp Gateway
không có bộ chọn tài khoản, vì vậy nhiều tài khoản thảo luận đang bật sẽ bị từ chối
thay vì chọn một tài khoản theo thứ tự cấu hình.

Việc mở một cuộc thảo luận sẽ tạo một kênh ClickClack công khai được đánh dấu là do bên ngoài
quản lý. Plugin giữ đồng bộ nhãn phiên, danh mục và trạng thái lưu trữ.
Khôi phục một phiên sẽ khôi phục kênh của phiên đó; xóa danh mục phiên
sẽ chuyển kênh trở lại phần mặc định đã cấu hình. Xóa một
phiên OpenClaw sẽ lưu trữ kênh ClickClack thay vì xóa kênh, để
lịch sử vẫn còn khả dụng. Plugin đối soát các liên kết khi RPC thảo luận
được sử dụng và khoảng một lần mỗi phút khi có bất kỳ liên kết nào tồn tại.

Tin nhắn đến trong một kênh được quản lý sử dụng một phiên phụ xác định
dưới cùng id agent với phiên chính được đính kèm. Agent phụ được cho biết
cần quan sát phiên chính nào và có thể sử dụng `sessions_history` và `session_status`
(`changesSince` hữu ích cho các lần kiểm tra gia tăng). Agent này chỉ sử dụng `sessions_send`
khi những người trong cuộc thảo luận yêu cầu chuyển tiếp hoặc định hướng phiên chính.
Liên kết, tham chiếu quyền sở hữu được quản lý và danh tính ngang hàng của phiên phụ bao gồm
id phiên OpenClaw cụ thể cùng với máy chủ và kênh ClickClack đã ghim.
Việc đặt lại khóa phiên có thể tái sử dụng hoặc chuyển tài khoản sang đích khác sẽ thu hồi
kênh cũ ở cục bộ, lưu trữ kênh đó khi thông tin xác thực cũ vẫn dùng được và
không thể tái sử dụng bản ghi hội thoại phụ của kênh. Tin nhắn đến qua một
liên kết đã lưu trữ, đặt lại, tắt hoặc chuyển đích sẽ bị loại bỏ thay vì
quay về định tuyến kênh thông thường của tài khoản. Các liên kết đã giải phóng để lại một
dấu mốc kênh bị thu hồi bền vững để các sự kiện thời gian thực đến trễ vẫn bị từ chối theo mặc định. Quyền sở hữu
từ xa được định danh theo máy chủ ClickClack và id kênh, vì vậy việc đổi tên tài khoản cục bộ
không thể biến một kênh được quản lý thành kênh thông thường.

Giữ `tools.sessions.visibility` ở giá trị mặc định an toàn hơn là `tree`. Plugin
cài đặt một quyền cấp có phạm vi máy chủ chỉ giữa từng phiên phụ và phiên chính
được đính kèm của phiên đó, cùng một hook chính sách công cụ chặn việc khám phá phiên và
các đích liên phiên. Hook chỉ cho phép `sessions_history`, `session_status` và
`sessions_send` đối với phiên chính được đính kèm và ngăn lệnh gọi trạng thái
thay đổi mô hình của phiên đó. Các công cụ này vẫn phải có trong
danh sách công cụ hiệu lực được phép dùng của agent. Prompt hệ thống chỉ mang tính hướng dẫn; quyền cấp của máy chủ
và hook mới là ranh giới ủy quyền.

Máy chủ ClickClack phải hỗ trợ các trường kênh được quản lý (`external_managed`,
`external_ref`, `external_url` và `sidebar_section`) khi tạo và
cập nhật kênh, đồng thời trả về chúng trong phản hồi kênh. OpenClaw xác minh hợp đồng đó
trước khi lưu một liên kết. Nếu phản hồi tạo bị thất lạc, lần mở tiếp theo sẽ tiếp nhận
kênh theo `external_ref` do máy chủ thực thi thay vì tạo một kênh khác.
Cho đến khi kết quả đó được đối soát, phần giữ chỗ đang chờ sẽ cách ly
các sự kiện chưa được liên kết khác trong không gian làm việc đích. Trình đối soát tổng quát
tiếp nhận kênh khi cùng phiên đó vẫn còn hoạt động hoặc lưu trữ kênh sau khi
đặt lại; trình này xóa phần giữ chỗ khi không có kênh từ xa nào được tạo.
Tham chiếu đó chứa một không gian tên lâu dài cho mỗi bản cài đặt OpenClaw cùng với
hàm băm của khóa phiên, id phiên cụ thể, đích ClickClack và thế hệ
liên kết lâu dài. Các Gateway riêng biệt không thể tiếp nhận kênh của nhau,
các phiên đã đặt lại không thể kế thừa lịch sử kênh cũ, và một vòng chuyển đổi tài khoản hoặc không gian làm việc
không thể tiếp nhận lại kênh trước đó. Các liên kết cũng được ghim vào
URL máy chủ ClickClack đã cấu hình và bị vô hiệu hóa nếu tài khoản được
chuyển sang đích khác. Việc thay đổi hoặc xóa `controlUrlBase` sẽ cập nhật hoặc xóa liên kết
kênh được quản lý trong lượt đối soát tiếp theo. Việc thay đổi
`discussions.workspace` sẽ lưu trữ và giải phóng liên kết cũ trước khi một kênh
có thể được mở trong không gian làm việc mới khi thông tin xác thực của không gian làm việc cũ vẫn
được cấu hình. Nếu token đã được thay thế bằng thông tin xác thực có phạm vi không gian làm việc
không thể truy cập không gian làm việc cũ, OpenClaw ghi nhận kênh cũ là đã bị thu hồi và
giải phóng liên kết mà không thử token thay thế; hãy lưu trữ kênh còn sót lại đó
khỏi ClickClack.

Phiên chính được đính kèm cũng nhận được một công cụ `discussion` chỉ dùng để kéo dữ liệu. Công cụ này đọc
các tin nhắn mới nhất và câu trả lời luồng gần đây dưới dạng một bản ghi đã thoát ký tự và có thông tin quy nguồn
cho mỗi tin nhắn, đồng thời không có tác dụng phụ về ghi hoặc vòng đời. Các phép tra cứu gốc kênh và luồng
có ngân sách yêu cầu cố định; kết quả cảnh báo rõ ràng khi
giới hạn an toàn đó có thể bỏ sót một luồng cũ vẫn đang hoạt động.

## Chế độ trả lời

- `replyMode: "agent"` (mặc định) điều phối tin nhắn đến thông qua pipeline tác nhân thông thường, bao gồm ghi phiên và chính sách công cụ.
- `replyMode: "model"` bỏ qua pipeline tác nhân và sử dụng `llm.complete` của runtime plugin để bot trả lời trực tiếp, có thể được định hình bằng `model` và `systemPrompt`. Nhà cung cấp và mô hình được chọn sở hữu ngân sách hoàn thành.

Chế độ mô hình chạy các lượt hoàn thành dựa trên id tác nhân bot đã phân giải, yêu cầu
bit tin cậy `plugins.entries.clickclack.llm.allowAgentIdOverride: true` rõ ràng:

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

Giữ bit tin cậy ở trạng thái tắt nếu bạn chỉ sử dụng chế độ trả lời `agent` mặc định; chế độ đó
không cần bit này.

## Menu lệnh

Khi Gateway khởi động, mỗi tài khoản đã cấu hình sẽ xuất bản các
lệnh gốc của OpenClaw lên ClickClack. Chúng xuất hiện trong tính năng tự động hoàn thành của trình soạn thảo, được gắn nhãn bằng
định danh của bot. Tập lệnh đã xuất bản được thay thế toàn bộ sau mỗi lần khởi động,
bao gồm cả việc xóa menu cũ khi danh mục lệnh gốc trống.

Đồng bộ menu lệnh được bật theo mặc định. Đặt `commandMenu: false` trên một tài khoản
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
`bot:admin` hiện tại của ClickClack bao gồm phạm vi đó, và cũng có thể cấp
riêng lẻ. Các token được tạo trước khi menu lệnh được giới thiệu có thể cần được
thêm phạm vi hoặc thay thế bằng token mới.

Quá trình đồng bộ hoạt động theo nỗ lực tối đa và chạy một lần mỗi khi Gateway khởi động. Thiếu phạm vi hoặc lỗi mạng
sẽ ghi cảnh báo; máy chủ ClickClack cũ không có điểm cuối sẽ ghi nhật ký ở
mức gỡ lỗi. Không lỗi nào trong số này chặn quá trình khởi động theo thời gian thực. Menu vẫn
khả dụng khi tác nhân ngoại tuyến và bị xóa khi bot rời khỏi
không gian làm việc.

Bản phát hành này chỉ xuất bản đặc tả lệnh gốc. Bí danh và
các danh mục lệnh của skill, plugin hoặc lệnh tùy chỉnh không được thêm vào menu. Nếu một
tên cũng được đăng ký làm lệnh gạch chéo HTTP, ClickClack sẽ điều phối đăng ký đó
trước; các lệnh menu khác tiếp tục đi qua quy trình phân phối tin nhắn
thông thường.

Sử dụng chế độ `agent` để thu thập bằng chứng tương quan giữa các dịch vụ. Với một
id tin nhắn ClickClack có thẩm quyền ở dạng `msg_<ulid>` chuẩn, kênh sẽ suy ra
id lượt chạy OpenClaw xác định `clickclack:<message-id>`. Sau đó, mỗi lệnh gọi mô hình
hiển thị trong chẩn đoán dưới dạng `clickclack:<message-id>:model:<n>`; khi lượt đó
sử dụng ClawRouter, cùng id lệnh gọi mô hình được gửi dưới dạng `X-Request-ID`.
Chế độ `model` bỏ qua chẩn đoán lượt chạy/phiên tác nhân thông thường và vì vậy
không phù hợp với đường dẫn bằng chứng này.

Khi một sự kiện thời gian thực chứa `payload.correlation_id` đã được xác thực,
kênh mang giá trị đó dưới dạng `X-Correlation-ID` trong yêu cầu tìm nạp tin nhắn có thẩm quyền và
các yêu cầu trả lời ClickClack tạo ra từ đó. Các giá trị sử dụng
tập 128 ký tự an toàn của ClickClack (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` và `-`); các giá trị không hợp lệ
sẽ bị bỏ qua. Các phép nối này chỉ chứa mã định danh, tuyệt đối không chứa nội dung tin nhắn,
prompt, lượt hoàn thành, thông tin xác thực hoặc đầu ra công cụ.

## Phân phối nội dung đa phương tiện lâu dài

Các câu trả lời của tác nhân có chứa nội dung đa phương tiện sử dụng cơ chế phân phối lâu dài bắt buộc. OpenClaw gán
nonce ổn định cho mỗi phần tin nhắn và mỗi nội dung tải lên trước lần ghi ClickClack đầu tiên, nhờ đó
một lần thử lại sẽ tái sử dụng cùng nội dung tải lên và tin nhắn thay vì tiêu tốn hạn mức lưu trữ
hoặc xuất bản bản trùng lặp. Nếu nội dung tải lên đã tồn tại sau khi khởi động lại,
OpenClaw không đọc lại đường dẫn cục bộ ban đầu hoặc URL nội dung đa phương tiện từ xa.

Hợp đồng khôi phục này yêu cầu máy chủ ClickClack hỗ trợ:

- `GET /api/uploads/by-nonce` với
  `X-ClickClack-Upload-Nonce: supported` trên cả kết quả tìm thấy và không tìm thấy.
- `GET /api/messages/by-nonce` với
  `X-ClickClack-Message-Nonce: supported` trên cả kết quả tìm thấy và không tìm thấy.
- Tạo tin nhắn và liên kết tệp đính kèm có tính lũy đẳng cho cùng
  nonce và nội dung tải lên có phạm vi chủ sở hữu.

Mã 404 chung của máy chủ cũ không được xem là bằng chứng rằng lượt gửi không tồn tại.
OpenClaw để trạng thái phân phối chưa được giải quyết thay vì mạo hiểm tạo bản trùng lặp; hãy cập nhật
ClickClack trước khi bật câu trả lời của tác nhân tạo nội dung đa phương tiện.

## Hàng hoạt động của tác nhân

Theo mặc định, kênh ClickClack không hiển thị gì trong khi một lượt tác nhân đang chạy; chỉ câu trả lời cuối cùng được gửi đến. Đặt `agentActivity: true` trên một tài khoản để xuất bản các hàng tin nhắn `agent_commentary` và `agent_tool` lâu dài trong khi lượt đang diễn ra:

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
- **Yêu cầu phạm vi token `agent_activity:write`.** Phạm vi này tách biệt với `bot:write` và không được kế thừa từ phạm vi đó; hãy tạo token bot với `--scopes bot:write,agent_activity:write` (hoặc cấp phạm vi cho token hiện có) trước khi bật tùy chọn.
- **Suy giảm theo nỗ lực tối đa.** Nếu token thiếu `agent_activity:write` hoặc máy chủ từ chối ghi hoạt động, lỗi sẽ được ghi nhật ký và câu trả lời cuối cùng vẫn được phân phối bình thường; không có hàng hoạt động nào xuất hiện.
- Các hàng được nhóm theo từng lượt (`turn_id`), được hợp nhất để mỗi bước logic tương ứng với một hàng, và các hàng công cụ sử dụng cùng định dạng tiến trình như Discord/Slack/Telegram (tên công cụ cùng chi tiết lệnh).
- **Siêu dữ liệu quy nguồn.** Các bài đăng do tác nhân tạo (hàng hoạt động và câu trả lời cuối cùng) mang các trường `author_model` và `author_thinking` được phân giải từ mô hình thực tế được dùng cho lượt đó (kể cả sau khi dùng phương án dự phòng). Các máy chủ không định nghĩa các cột này sẽ bỏ qua các trường JSON không xác định; các máy chủ lưu chúng có thể trả lời “mô hình nào đã nói dòng này, ở mức suy nghĩ nào” cho từng tin nhắn.

## Đích

- `channel:<name-or-id>` gửi đến một kênh trong không gian làm việc. Các đích trần mặc định là `channel:`.
- `dm:<user_id>` tạo hoặc tái sử dụng cuộc trò chuyện trực tiếp với người dùng đó.
- `thread:<message_id>` trả lời trong luồng bắt nguồn từ tin nhắn đó.

Các đích gửi đi rõ ràng cũng có thể mang tiền tố nhà cung cấp `clickclack:` hoặc `cc:`.

Nội dung đa phương tiện gửi đi sử dụng API tải lên của ClickClack, sau đó đính kèm nội dung tải lên lâu dài
vào tin nhắn kênh, câu trả lời luồng hoặc DM đã tạo. Các tệp cục bộ và
URL nội dung đa phương tiện từ xa được hỗ trợ tuân theo chính sách truy cập nội dung đa phương tiện thông thường của OpenClaw, với giới hạn
64 MiB cho mỗi tệp. Các lượt gửi bền vững trong hàng đợi sử dụng nonce có phạm vi chủ sở hữu riêng cho từng
nội dung tải lên và phần tin nhắn, sau đó thử lại việc liên kết tệp đính kèm với chính các
đối tượng đó. Xem [Phân phối nội dung đa phương tiện lâu dài](#durable-media-delivery) để biết hợp đồng máy chủ
và hành vi khôi phục.

Ví dụ:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Quyền

Các phạm vi token ClickClack được API ClickClack thực thi.

- `bot:read`: đọc dữ liệu không gian làm việc/kênh/tin nhắn/luồng/DM/thời gian thực/hồ sơ.
- `bot:write`: `bot:read` cùng với tin nhắn kênh, câu trả lời luồng, DM, nội dung tải lên và xuất bản menu lệnh.
- `bot:admin`: `bot:write` cùng với khả năng tạo kênh.
- `commands:write`: xuất bản menu lệnh của bot. Có trong các gói `bot:write` và `bot:admin` hiện tại và có thể cấp riêng lẻ.
- `agent_activity:write`: các hàng hoạt động tác nhân lâu dài (`agent_commentary` / `agent_tool`). Không được kế thừa bởi `bot:write` hoặc `bot:admin`; chỉ bắt buộc khi đặt `agentActivity: true`.

OpenClaw chỉ cần `bot:write` hiện tại cho trò chuyện tác nhân thông thường và đồng bộ menu lệnh. Thêm `agent_activity:write` khi bật [hàng hoạt động của tác nhân](#agent-activity-rows).

## Khắc phục sự cố

- `ClickClack is not configured for account "<id>"`: đặt `baseUrl`, `token` (ví dụ thông qua `CLICKCLACK_BOT_TOKEN`) và `workspace` cho tài khoản đó.
- `ClickClack workspace not found: <value>`: đặt `workspace` thành id, slug hoặc tên không gian làm việc do ClickClack trả về.
- Không có câu trả lời đến: xác nhận token có quyền đọc theo thời gian thực và lưu ý rằng bot bỏ qua tin nhắn của chính nó và tin nhắn từ các bot khác.
- Gửi đến kênh thất bại: xác minh bot là thành viên của không gian làm việc và có `bot:write`.
- Không có menu lệnh: xác nhận `commandMenu` không phải là `false`, máy chủ ClickClack hỗ trợ `PUT /api/bots/self/commands` và token có `commands:write`.
