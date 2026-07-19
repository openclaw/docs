---
read_when:
    - Bạn muốn một agent điều khiển Chrome đang đăng nhập thực tế của bạn từ điện thoại.
    - Bạn liên tục gặp lời nhắc “Allow remote debugging?” của Chrome khi không có ai ở bàn làm việc
    - Bạn muốn tìm hiểu mô hình bảo mật của việc chiếm quyền điều khiển trình duyệt thông qua tiện ích mở rộng
summary: 'Tiện ích Chrome: cho phép OpenClaw điều khiển Chrome đã đăng nhập của bạn mà không cần lời nhắc gỡ lỗi từ xa'
title: Tiện ích mở rộng Chrome
x-i18n:
    generated_at: "2026-07-19T17:00:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3d974f62bb5697a23dd6a6852137ce6af5a8a4a2a8ff738eec0098f259e8faa0
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Tiện ích Chrome

Tiện ích Chrome của OpenClaw cho phép một tác nhân điều khiển các **thẻ Chrome
đã đăng nhập của bạn** mà không cần khởi chạy một trình duyệt được quản lý riêng và **không**
gặp lời nhắc chặn "Allow remote debugging?" của Chrome.

Điều này rất quan trọng khi bạn điều khiển OpenClaw từ điện thoại (Telegram, WhatsApp, v.v.):
[profile `user`](/vi/tools/browser#profiles-openclaw-user-chrome) kết nối qua
cổng gỡ lỗi từ xa của Chrome, khiến một hộp thoại đồng ý xuất hiện trên máy tính nhưng không ai có thể
nhấp vào khi bạn vắng mặt. Thay vào đó, tiện ích sử dụng API `chrome.debugger`,
nên gợi ý duy nhất trong trang là biểu ngữ có thể đóng của Chrome: "OpenClaw started debugging
this browser".

Đây cũng là mô hình được các tiện ích Chrome Claude của Anthropic và Codex của OpenAI
sử dụng.

## Cách hoạt động

Ba thành phần:

- **Dịch vụ điều khiển trình duyệt** (Gateway hoặc máy chủ node): API mà công cụ `browser`
  gọi.
- **Relay tiện ích** (WebSocket loopback): một máy chủ nhỏ mà dịch vụ điều khiển
  khởi động trên `127.0.0.1`. Máy chủ này cung cấp một điểm cuối Chrome DevTools Protocol cho
  OpenClaw và giao tiếp với tiện ích. Cả hai phía đều xác thực bằng một
  token cục bộ trên máy chủ (xem bên dưới).
- **Tiện ích Chrome OpenClaw** (MV3): kết nối với các thẻ bằng `chrome.debugger`,
  chuyển tiếp lưu lượng CDP và quản lý **nhóm thẻ OpenClaw**.

OpenClaw chỉ nhìn thấy và điều khiển các thẻ nằm trong **nhóm thẻ OpenClaw**. Nhóm này
là ranh giới đồng ý: kéo một thẻ vào để chia sẻ, kéo thẻ ra (hoặc nhấp vào
nút trên thanh công cụ) để thu hồi quyền truy cập ngay lập tức.

## Cài đặt và ghép nối

1. In đường dẫn của tiện ích chưa đóng gói:

   ```bash
   openclaw browser extension path
   ```

2. Mở `chrome://extensions`, bật **Developer mode**, nhấp vào **Load
   unpacked** và chọn thư mục đã được in.

3. In chuỗi ghép nối:

   ```bash
   openclaw browser extension pair
   ```

4. Nhấp vào biểu tượng OpenClaw trên thanh công cụ và dán chuỗi ghép nối vào cửa sổ bật lên.
   Huy hiệu chuyển thành **BẬT** khi tiện ích kết nối với relay.

Token ghép nối là một **bí mật cục bộ trên máy chủ** được tạo khi sử dụng lần đầu và lưu trữ
trong `credentials/` ở thư mục trạng thái (chế độ `0600`). Mỗi máy
chạy trình duyệt — máy chủ Gateway và mọi máy chủ node trình duyệt — sở hữu
token riêng, vì vậy không cần truyền thông tin xác thực giữa các máy. Để xoay vòng token, hãy xóa tệp
`browser-extension-relay.secret` rồi ghép nối lại.

## Sử dụng

Chọn profile `chrome` tích hợp sẵn trong lệnh gọi công cụ `browser`, hoặc đặt nó làm
mặc định:

```bash
openclaw config set browser.defaultProfile chrome
```

```json5
{
  browser: {
    profiles: {
      chrome: { driver: "extension", color: "#FF4500" },
    },
  },
}
```

- Chia sẻ một thẻ: nhấp vào nút OpenClaw trên thanh công cụ của thẻ đó (thẻ sẽ tham gia
  nhóm thẻ OpenClaw), hoặc kéo bất kỳ thẻ nào vào nhóm.
- Tác nhân cũng có thể mở các thẻ mới; các thẻ đó tự động được đưa vào nhóm.
- Thu hồi: nhấp lại vào nút, kéo thẻ ra khỏi nhóm hoặc đóng
  biểu ngữ gỡ lỗi của Chrome. Tác nhân mất quyền truy cập vào thẻ đó ngay lập tức.

### Bảng điều khiển bên trợ lý thẻ

Sau khi ghép nối tiện ích, hãy nhấp vào **Mở trợ lý thẻ** trong cửa sổ bật lên trên thanh công cụ.
OpenClaw cấu hình `sidepanel.html` cho chính xác thẻ Chrome đó; manifest không có
đường dẫn bảng điều khiển bên toàn cục. Vì vậy, mỗi thẻ có một tài liệu bảng điều khiển riêng,
phiên Gateway, đăng ký thông báo và liên kết công cụ trình duyệt có kiểu riêng.

Bảng điều khiển không đưa URL trang, tiêu đề, DOM hoặc văn bản hiển thị vào
tin nhắn của bạn. Nó chỉ gửi văn bản bạn nhập. Các hành động trình duyệt mang một
liên kết riêng được Gateway xác thực, chứa thẻ Chrome và đích CDP, còn
công cụ trình duyệt từ chối các nỗ lực thay thế đích đó hoặc sử dụng các hành động
trên toàn trình duyệt. Phản hồi nằm trong bảng điều khiển (`deliver: false`); chúng không kế thừa
tuyến Telegram, Discord hoặc kênh khác.

Trợ lý là một thiết bị Gateway chuyên dụng đã ghép nối, có các phạm vi `operator.read` và
`operator.write`. Khi sử dụng lần đầu, hãy kiểm tra và phê duyệt yêu cầu của thiết bị:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Tiện ích giữ lại danh tính thiết bị đó và token thiết bị do Gateway cấp,
được giới hạn trong điểm cuối Gateway chính tắc đã cấp chúng. Việc ghép nối với một
Gateway khác sẽ tạo quyền quản lý danh tính, token và phiên riêng biệt; thông tin xác thực và
phiên không bao giờ được tái sử dụng giữa các điểm cuối. Tiện ích không lưu giữ
bí mật dùng chung của Gateway. Một bảng điều khiển chỉ có thể đăng ký các phiên thẻ của chính nó và
Gateway lọc các sự kiện đó trước khi phân phối.

Nếu kết nối Gateway bị ngắt trong khi đang chạy, tiện ích vẫn duy trì quyền quản lý lâu dài
đối với ID lượt chạy đó. Khi kết nối lại, tiện ích hủy lượt chạy chưa được giải quyết trước khi
bật lại bất kỳ bảng điều khiển nào, rồi tải lại lịch sử bản ghi. Bước đóng khi có lỗi này
ngăn các hành động trình duyệt tiếp tục diễn ra mà không được quan sát trong thời gian gián đoạn phân phối.

Việc đóng một thẻ sẽ ngay lập tức xóa đăng ký đang hoạt động của thẻ, hủy mọi lượt chạy
đang hiển thị và đánh dấu phiên của thẻ đó là đã lưu trữ. Nếu Gateway tạm thời
ngoại tuyến, tiện ích lưu giữ yêu cầu lưu trữ đang chờ và chỉ thử lại khi
chính điểm cuối Gateway đó kết nối lại; tiện ích không bao giờ gửi yêu cầu lưu trữ đến một
Gateway khác. Sau khi trình duyệt gặp sự cố, lần khởi chạy tiếp theo sẽ lưu trữ các phiên
do phiên bản trình duyệt trước để lại. Các phiên đã lưu trữ từ chối công việc mới, trong khi
bản ghi của chúng vẫn có trong lịch sử phiên. Khóa trợ lý trình duyệt là
các phiên luồng, vì vậy hoạt động bảo trì thông thường theo tuổi và số lượng mục vẫn bảo toàn chúng. Ngân sách
đĩa phiên theo tác nhân vẫn được áp dụng (mặc định `2gb`) và có thể loại bỏ
các phiên cũ nhất khi chịu áp lực; xem [bảo trì phiên](/vi/reference/session-management-compaction#store-maintenance-and-disk-controls).

Bảng điều khiển bên hiện yêu cầu relay tiện ích do Gateway lưu trữ hoặc
relay Gateway từ xa trực tiếp. Relay loopback trên một node trình duyệt hiện chưa thể
cung cấp tuyến node mà liên kết thẻ có kiểu yêu cầu, vì vậy bảng điều khiển từ chối
cấu trúc liên kết đó thay vì dự phòng sang định tuyến trên toàn trình duyệt.

## Gửi trang đến OpenClaw

Sử dụng **Gửi trang đến OpenClaw** trong cửa sổ bật lên trên thanh công cụ để chia sẻ văn bản trang có thể đọc
với phiên OpenClaw chính của bạn. Bạn có thể thêm ghi chú tùy chọn, sử dụng menu chuột phải
của trang hoặc vùng chọn, hoặc nhấn `Alt+Shift+S`. OpenClaw ưu tiên vùng chọn hiện tại của bạn
nếu có, đưa nội dung chia sẻ vào hàng đợi dưới dạng sự kiện hệ thống và đánh thức
phiên chính ngay lập tức.

Thẻ không cần nằm trong nhóm thẻ OpenClaw. Đây là lượt chia sẻ rõ ràng,
chỉ diễn ra một lần: không có nội dung nào khác trên trang bị tiết lộ và thao tác này không cấp quyền truy cập
liên tục. Google Docs được xuất dưới dạng văn bản thuần bằng phiên trình duyệt
đã đăng nhập của bạn mà không cần thiết lập Google API. Các luồng X và Twitter được trích xuất mà không có
giao diện bao quanh.

Văn bản trang được bao bọc trong ranh giới an toàn nội dung bên ngoài của OpenClaw. Ghi chú
tùy chọn của bạn nằm ngoài ranh giới đó dưới dạng chỉ dẫn của riêng bạn. Văn bản trang
và vùng chọn được giới hạn ở khoảng 120.000 ký tự và có dấu hiệu cắt ngắn
khi bị rút gọn.

Tính năng chia sẻ trang hoạt động khi relay tiện ích được Gateway lưu trữ, sử dụng
ghép nối cùng máy chủ hoặc ghép nối Gateway `wss://` trực tiếp. Các relay do node lưu trữ hiện
trả về lỗi rõ ràng. Để ánh xạ lại phím tắt, hãy mở
`chrome://extensions/shortcuts`.

## Từ xa / nhiều máy

Chrome không nhất thiết phải chạy trên máy chủ Gateway. Ba cấu trúc liên kết được hỗ trợ:

- **Cùng máy chủ** (Gateway + Chrome trên một máy): ghép nối trên máy đó bằng
  `openclaw browser extension pair`. Relay chỉ dùng loopback.
  Nếu Gateway cục bộ sử dụng TLS, hãy truyền rõ tên máy chủ trong chứng chỉ bằng
  `--gateway-url wss://gateway-host.example`; quá trình ghép nối không bao giờ thay thế bằng địa chỉ IP loopback.
- **Trực tiếp đến Gateway từ xa** (Chrome trên máy tính xách tay của bạn, Gateway trên VPS và
  **không có gì khác trên máy tính xách tay**): trên Gateway, chạy
  `openclaw browser extension pair --gateway-url wss://your-gateway.example.com`.
  Lệnh này in ra một chuỗi `wss://…/browser/extension#<secret>`; tải và ghép nối
  tiện ích trên máy tính xách tay. Tiện ích kết nối **thẳng đến Gateway**
  qua `wss://` — không cần cài đặt OpenClaw, Node, CLI hay mở cổng đến trên
  máy tính xách tay. Đây là phương thức dành cho dịch vụ lưu trữ được quản lý.
- **Qua máy chủ node trình duyệt** (Chrome trên một máy đã chạy node OpenClaw):
  chạy `pair` trên node và ghép nối cục bộ; Gateway chuyển tiếp các hành động trình duyệt
  đến node qua liên kết node đã được xác thực hiện có.

Bí mật ghép nối là riêng cho từng máy chủ (của Gateway trong trường hợp trực tiếp), được xác thực bởi
tuyến `/browser/extension` của Gateway. Đối với phương thức trực tiếp, hãy cung cấp Gateway
qua TLS (`wss://`) để mã hóa bí mật ghép nối và lưu lượng CDP.
Bí mật vẫn nằm trong fragment URL của chuỗi ghép nối và được cung cấp trong
quá trình bắt tay WebSocket dưới dạng thông tin xác thực giao thức con, vì vậy nhật ký truy cập
proxy thông thường không nhận được bí mật trong URL yêu cầu. Đảm bảo mọi proxy ngược đều bảo toàn
header `Sec-WebSocket-Protocol` tiêu chuẩn.

## Chẩn đoán

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

`doctor` báo kiểm tra **relay tiện ích Chrome** là thất bại cho đến khi
cửa sổ bật lên của tiện ích hiển thị **Đã kết nối**.

## Mô hình bảo mật

- Relay chỉ liên kết với loopback; cả hai phía WebSocket đều được xác thực bằng
  token dẫn xuất và phía tiện ích được kiểm tra nguồn gốc đối với `chrome-extension://`.
- Ghép nối Gateway trực tiếp không chấp nhận token relay trong URL yêu cầu;
  thay vào đó, tiện ích đi kèm mang token trong danh sách giao thức con WebSocket.
- Tác nhân chỉ có thể nhìn thấy và điều khiển các thẻ trong **nhóm thẻ OpenClaw**. Các
  thẻ khác của bạn vẫn riêng tư.
- Các lượt chạy trong bảng điều khiển bên được giới hạn phạm vi hai lần: quá trình phân phối của Gateway sử dụng
  danh sách cho phép theo phiên, còn các công cụ trình duyệt thực thi liên kết thẻ/đích Chrome
  được truyền bên ngoài prompt.
- So với profile `user` (Chrome MCP), vốn làm lộ toàn bộ
  trình duyệt đã đăng nhập của bạn sau khi bạn phê duyệt lời nhắc gỡ lỗi từ xa, tiện ích
  giữ phạm vi chia sẻ giới hạn trong một nhóm thẻ mà bạn có thể kiểm soát ngay lập tức.

Xem thêm: [Trình duyệt](/vi/tools/browser) để biết đầy đủ mô hình profile và các profile
`openclaw` được quản lý cùng Chrome MCP `user`.
