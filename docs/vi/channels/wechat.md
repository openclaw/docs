---
read_when:
    - Bạn muốn kết nối OpenClaw với WeChat hoặc Weixin
    - Bạn đang cài đặt hoặc khắc phục sự cố Plugin kênh openclaw-weixin
    - Bạn cần hiểu cách các Plugin kênh bên ngoài chạy bên cạnh Gateway
summary: Thiết lập kênh WeChat thông qua Plugin openclaw-weixin bên ngoài
title: WeChat
x-i18n:
    generated_at: "2026-05-06T09:04:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 803557a4fc92056c63053a3388100a451b2d85d4e892877707b3c2e3a677c0b0
    source_path: channels/wechat.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw kết nối với WeChat thông qua Plugin kênh bên ngoài
`@tencent-weixin/openclaw-weixin` của Tencent.

Trạng thái: Plugin bên ngoài. Trò chuyện trực tiếp và phương tiện được hỗ trợ. Trò chuyện nhóm không được
metadata năng lực Plugin hiện tại quảng bá.

## Cách đặt tên

- **WeChat** là tên hiển thị với người dùng trong các tài liệu này.
- **Weixin** là tên được gói của Tencent và id Plugin sử dụng.
- `openclaw-weixin` là id kênh OpenClaw.
- `@tencent-weixin/openclaw-weixin` là gói npm.

Dùng `openclaw-weixin` trong các lệnh CLI và đường dẫn cấu hình.

## Cách hoạt động

Mã WeChat không nằm trong repo lõi OpenClaw. OpenClaw cung cấp hợp đồng Plugin
kênh chung, còn Plugin bên ngoài cung cấp runtime dành riêng cho WeChat:

1. `openclaw plugins install` cài đặt `@tencent-weixin/openclaw-weixin`.
2. Gateway phát hiện manifest Plugin và tải entrypoint của Plugin.
3. Plugin đăng ký id kênh `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` bắt đầu đăng nhập bằng QR.
5. Plugin lưu thông tin xác thực tài khoản trong thư mục trạng thái OpenClaw.
6. Khi Gateway khởi động, Plugin khởi động trình giám sát Weixin cho từng
   tài khoản đã cấu hình.
7. Tin nhắn WeChat đến được chuẩn hóa thông qua hợp đồng kênh, được định tuyến đến
   tác tử OpenClaw đã chọn, rồi được gửi lại qua đường dẫn gửi ra của Plugin.

Sự tách biệt đó rất quan trọng: lõi OpenClaw nên không phụ thuộc kênh. Đăng nhập WeChat,
lệnh gọi API Tencent iLink, tải lên/tải xuống phương tiện, token ngữ cảnh và giám sát
tài khoản đều thuộc trách nhiệm của Plugin bên ngoài.

## Cài đặt

Cài đặt nhanh:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Cài đặt thủ công:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

Khởi động lại Gateway sau khi cài đặt:

```bash
openclaw gateway restart
```

## Đăng nhập

Chạy đăng nhập bằng QR trên cùng máy đang chạy Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

Quét mã QR bằng WeChat trên điện thoại của bạn và xác nhận đăng nhập. Plugin lưu
token tài khoản cục bộ sau khi quét thành công.

Để thêm tài khoản WeChat khác, chạy lại cùng lệnh đăng nhập. Với nhiều
tài khoản, hãy cô lập phiên tin nhắn trực tiếp theo tài khoản, kênh và người gửi:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Kiểm soát truy cập

Tin nhắn trực tiếp dùng mô hình ghép nối và danh sách cho phép OpenClaw thông thường cho Plugin
kênh.

Phê duyệt người gửi mới:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Để xem đầy đủ mô hình kiểm soát truy cập, xem [Ghép nối](/vi/channels/pairing).

## Tương thích

Plugin kiểm tra phiên bản OpenClaw của máy chủ khi khởi động.

| Dòng Plugin | Phiên bản OpenClaw      | Thẻ npm  |
| ----------- | ----------------------- | -------- |
| `2.x`       | `>=2026.3.22`           | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22` | `legacy` |

Nếu Plugin báo rằng phiên bản OpenClaw của bạn quá cũ, hãy cập nhật
OpenClaw hoặc cài đặt dòng Plugin legacy:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Tiến trình sidecar

Plugin WeChat có thể chạy công việc trợ giúp bên cạnh Gateway trong khi giám sát
API Tencent iLink. Trong issue #68451, đường dẫn trợ giúp đó làm lộ một lỗi trong
cơ chế dọn dẹp Gateway cũ chung của OpenClaw: một tiến trình con có thể cố gắng dọn dẹp tiến trình
Gateway cha, gây vòng lặp khởi động lại dưới các trình quản lý tiến trình như systemd.

Cơ chế dọn dẹp khi khởi động hiện tại của OpenClaw loại trừ tiến trình hiện tại và các tiến trình tổ tiên của nó,
vì vậy một trình trợ giúp kênh không được giết Gateway đã khởi chạy nó. Bản sửa này là
chung; đây không phải là đường dẫn dành riêng cho WeChat trong lõi.

## Khắc phục sự cố

Kiểm tra cài đặt và trạng thái:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Nếu kênh hiển thị là đã cài đặt nhưng không kết nối, hãy xác nhận rằng Plugin đã được
bật rồi khởi động lại:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Nếu Gateway khởi động lại liên tục sau khi bật WeChat, hãy cập nhật cả OpenClaw và
Plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Nếu khi khởi động báo rằng gói Plugin đã cài đặt `requires compiled runtime
output for TypeScript entry`, gói npm đã được phát hành mà không có các tệp runtime
JavaScript đã biên dịch mà OpenClaw cần. Hãy cập nhật/cài đặt lại sau khi nhà phát hành Plugin
phát hành gói đã sửa, hoặc tạm thời tắt/gỡ cài đặt Plugin.

Tạm thời tắt:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Tài liệu liên quan

- Tổng quan kênh: [Kênh trò chuyện](/vi/channels)
- Ghép nối: [Ghép nối](/vi/channels/pairing)
- Định tuyến kênh: [Định tuyến kênh](/vi/channels/channel-routing)
- Kiến trúc Plugin: [Kiến trúc Plugin](/vi/plugins/architecture)
- SDK Plugin kênh: [SDK Plugin kênh](/vi/plugins/sdk-channel-plugins)
- Gói bên ngoài: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
