---
read_when:
    - Bạn muốn một agent điều khiển Chrome thực đã đăng nhập của bạn từ điện thoại.
    - Bạn liên tục gặp lời nhắc "Allow remote debugging?" của Chrome khi không có ai ở bàn làm việc
    - Bạn muốn tìm hiểu mô hình bảo mật của việc tiếp quản trình duyệt thông qua tiện ích mở rộng
summary: 'Tiện ích mở rộng Chrome: cho phép OpenClaw điều khiển Chrome mà bạn đã đăng nhập mà không hiển thị lời nhắc gỡ lỗi từ xa'
title: Tiện ích mở rộng Chrome
x-i18n:
    generated_at: "2026-07-12T08:24:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb3f7d4bd9d933e0e876d21a1edf07bafbdc18d0196ce636981bd11ad5f2facd
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Tiện ích mở rộng Chrome

Tiện ích mở rộng OpenClaw dành cho Chrome cho phép tác nhân điều khiển các **tab Chrome đã đăng nhập của bạn** mà không cần khởi chạy một trình duyệt được quản lý riêng biệt và **không** gặp lời nhắc chặn "Allow remote debugging?" của Chrome.

Điều này quan trọng khi bạn điều khiển OpenClaw từ điện thoại (Telegram, WhatsApp, v.v.): [hồ sơ `user`](/vi/tools/browser#profiles-openclaw-user-chrome) kết nối qua cổng gỡ lỗi từ xa của Chrome, khiến hộp thoại đồng ý xuất hiện trên máy tính và không ai có thể nhấp vào khi bạn vắng mặt. Thay vào đó, tiện ích mở rộng sử dụng API `chrome.debugger`, vì vậy dấu hiệu duy nhất trong trang là biểu ngữ có thể đóng "OpenClaw started debugging this browser" của Chrome.

Đây cũng là mô hình được các tiện ích mở rộng Claude in Chrome của Anthropic và Codex Chrome của OpenAI sử dụng.

## Cách hoạt động

Gồm ba phần:

- **Dịch vụ điều khiển trình duyệt** (Gateway hoặc máy chủ Node): API mà công cụ `browser` gọi.
- **Bộ chuyển tiếp tiện ích mở rộng** (WebSocket local loopback): một máy chủ nhỏ được dịch vụ điều khiển khởi chạy trên `127.0.0.1`. Máy chủ này cung cấp một điểm cuối Chrome DevTools Protocol cho OpenClaw và giao tiếp với tiện ích mở rộng. Cả hai phía đều xác thực bằng một token cục bộ trên máy chủ (xem bên dưới).
- **Tiện ích mở rộng OpenClaw dành cho Chrome** (MV3): kết nối với các tab bằng `chrome.debugger`, chuyển tiếp lưu lượng CDP và quản lý **nhóm tab OpenClaw**.

OpenClaw chỉ nhìn thấy và điều khiển các tab nằm trong **nhóm tab OpenClaw**. Nhóm này là ranh giới đồng ý: kéo một tab vào để chia sẻ, kéo tab ra ngoài (hoặc nhấp vào nút trên thanh công cụ) để thu hồi quyền truy cập ngay lập tức.

## Cài đặt và ghép nối

1. In đường dẫn của tiện ích mở rộng chưa đóng gói:

   ```bash
   openclaw browser extension path
   ```

2. Mở `chrome://extensions`, bật **Developer mode**, nhấp vào **Load
   unpacked**, rồi chọn thư mục đã in.

3. In chuỗi ghép nối:

   ```bash
   openclaw browser extension pair
   ```

4. Nhấp vào biểu tượng OpenClaw trên thanh công cụ và dán chuỗi ghép nối vào cửa sổ bật lên.
   Huy hiệu chuyển thành **ON** khi tiện ích mở rộng kết nối với bộ chuyển tiếp.

Token ghép nối là một **bí mật cục bộ trên máy chủ** được tạo trong lần sử dụng đầu tiên và lưu trong `credentials/` thuộc thư mục trạng thái (chế độ `0600`). Mỗi máy chạy trình duyệt — máy chủ Gateway và từng máy chủ Node trình duyệt — sở hữu token riêng, vì vậy không cần truyền thông tin xác thực giữa các máy. Để luân phiên token, hãy xóa tệp `browser-extension-relay.secret` và ghép nối lại.

## Cách sử dụng

Chọn hồ sơ `chrome` tích hợp sẵn trong một lệnh gọi công cụ `browser`, hoặc đặt hồ sơ này làm mặc định:

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

- Chia sẻ một tab: nhấp vào nút OpenClaw trên thanh công cụ của tab đó (tab sẽ tham gia nhóm tab OpenClaw), hoặc kéo bất kỳ tab nào vào nhóm.
- Tác nhân cũng có thể mở các tab mới; những tab này sẽ tự động được đưa vào nhóm.
- Thu hồi quyền truy cập: nhấp lại vào nút, kéo tab ra khỏi nhóm hoặc đóng biểu ngữ gỡ lỗi của Chrome. Tác nhân sẽ mất quyền truy cập vào tab đó ngay lập tức.

## Từ xa / giữa nhiều máy

Chrome không nhất thiết phải chạy trên máy chủ Gateway. Có ba cấu trúc liên kết hoạt động:

- **Cùng máy chủ** (Gateway + Chrome trên một máy): ghép nối trên máy đó bằng `openclaw browser extension pair`. Bộ chuyển tiếp chỉ hoạt động trên local loopback.
- **Kết nối trực tiếp đến Gateway từ xa** (Chrome trên máy tính xách tay của bạn, Gateway trên VPS và **không có thành phần nào khác trên máy tính xách tay**): trên Gateway, chạy `openclaw browser extension pair --gateway-url wss://your-gateway.example.com`.
  Lệnh này in ra một chuỗi `wss://…/browser/extension#<secret>`; hãy tải và ghép nối tiện ích mở rộng trên máy tính xách tay. Tiện ích mở rộng kết nối **thẳng đến Gateway** qua `wss://` — không cần cài đặt OpenClaw, Node, CLI hoặc mở cổng đến trên máy tính xách tay. Đây là phương thức dành cho dịch vụ lưu trữ được quản lý.
- **Qua máy chủ Node trình duyệt** (Chrome trên một máy đã chạy Node OpenClaw): chạy `pair` trên Node và ghép nối cục bộ; Gateway chuyển tiếp các thao tác trình duyệt đến Node qua liên kết Node đã được xác thực hiện có.

Bí mật ghép nối dành riêng cho từng máy chủ (trong trường hợp kết nối trực tiếp là bí mật của Gateway), được xác thực bởi tuyến `/browser/extension` của Gateway. Đối với phương thức trực tiếp, hãy cung cấp Gateway qua TLS (`wss://`) để mã hóa bí mật ghép nối và lưu lượng CDP.
Bí mật vẫn nằm trong đoạn phân mảnh URL của chuỗi ghép nối và được cung cấp trong quá trình bắt tay WebSocket dưới dạng thông tin xác thực của giao thức con, vì vậy nhật ký truy cập thông thường của proxy không nhận được bí mật này trong URL yêu cầu. Hãy đảm bảo mọi proxy ngược đều giữ nguyên tiêu đề `Sec-WebSocket-Protocol` tiêu chuẩn.

## Chẩn đoán

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

`doctor` báo cáo kiểm tra **bộ chuyển tiếp tiện ích mở rộng Chrome** là thất bại cho đến khi cửa sổ bật lên của tiện ích mở rộng hiển thị **Connected**.

## Mô hình bảo mật

- Bộ chuyển tiếp chỉ liên kết với local loopback; cả hai phía WebSocket đều được xác thực bằng token dẫn xuất và phía tiện ích mở rộng được kiểm tra nguồn gốc để bảo đảm là `chrome-extension://`.
- Ghép nối trực tiếp với Gateway không chấp nhận token của bộ chuyển tiếp trong URL yêu cầu; thay vào đó, tiện ích mở rộng đi kèm truyền token trong danh sách giao thức con WebSocket.
- Tác nhân chỉ có thể nhìn thấy và điều khiển các tab trong **nhóm tab OpenClaw**. Các tab khác của bạn vẫn riêng tư.
- So với hồ sơ `user` (Chrome MCP), vốn làm lộ toàn bộ trình duyệt đã đăng nhập của bạn sau khi bạn chấp thuận lời nhắc gỡ lỗi từ xa, tiện ích mở rộng giới hạn phạm vi chia sẻ trong một nhóm tab mà bạn có thể kiểm soát nhanh chóng.

Xem thêm: [Trình duyệt](/vi/tools/browser) để biết đầy đủ mô hình hồ sơ cũng như các hồ sơ `openclaw` được quản lý và `user` của Chrome MCP.
