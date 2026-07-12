---
read_when:
    - Bạn muốn kết nối OpenClaw với WeChat hoặc Weixin
    - Bạn đang cài đặt hoặc khắc phục sự cố Plugin kênh openclaw-weixin
    - Bạn cần hiểu cách các Plugin kênh bên ngoài chạy cùng với Gateway
summary: Thiết lập kênh WeChat thông qua plugin openclaw-weixin bên ngoài
title: WeChat
x-i18n:
    generated_at: "2026-07-12T07:44:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98faf95f9fb76deedb7df9adf3092083722a77bdd793de98c41a6f715cc0d14a
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw kết nối với WeChat thông qua plugin kênh bên ngoài
`@tencent-weixin/openclaw-weixin` của Tencent.

Trạng thái: plugin bên ngoài, do nhóm Tencent Weixin duy trì. Hỗ trợ trò chuyện
trực tiếp và nội dung đa phương tiện. Trò chuyện nhóm không được công bố trong
siêu dữ liệu khả năng của plugin (plugin chỉ khai báo trò chuyện trực tiếp).

## Cách đặt tên

- **WeChat** là tên hiển thị cho người dùng trong tài liệu này.
- **Weixin** là tên được dùng trong gói của Tencent và mã định danh plugin.
- `openclaw-weixin` là mã định danh kênh OpenClaw (`weixin` và `wechat` hoạt động như các bí danh).
- `@tencent-weixin/openclaw-weixin` là gói npm.

Sử dụng `openclaw-weixin` trong các lệnh CLI và đường dẫn cấu hình.

## Cách hoạt động

Mã WeChat không nằm trong kho mã nguồn lõi của OpenClaw. OpenClaw cung cấp hợp
đồng plugin kênh chung, còn plugin bên ngoài cung cấp môi trường thực thi dành
riêng cho WeChat:

1. `openclaw plugins install` cài đặt `@tencent-weixin/openclaw-weixin`.
2. Gateway phát hiện tệp kê khai plugin và tải điểm vào của plugin.
3. Plugin đăng ký mã định danh kênh `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` bắt đầu đăng nhập bằng mã QR.
5. Plugin lưu thông tin xác thực tài khoản trong thư mục trạng thái của OpenClaw
   (mặc định là `~/.openclaw`).
6. Khi Gateway khởi động, plugin khởi chạy trình giám sát Weixin cho từng tài
   khoản đã cấu hình.
7. Tin nhắn WeChat đến được chuẩn hóa thông qua hợp đồng kênh, định tuyến đến
   tác nhân OpenClaw đã chọn và gửi phản hồi qua đường dẫn gửi đi của plugin.

Sự phân tách này rất quan trọng: lõi OpenClaw không phụ thuộc vào kênh. Việc đăng
nhập WeChat, các lệnh gọi API Tencent iLink, tải lên/tải xuống nội dung đa phương
tiện, token ngữ cảnh và giám sát tài khoản thuộc trách nhiệm của plugin bên ngoài.

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

Chạy đăng nhập bằng mã QR trên cùng máy đang chạy Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

Quét mã QR bằng WeChat trên điện thoại và xác nhận đăng nhập. Plugin sẽ lưu
token tài khoản cục bộ sau khi quét thành công.

Để thêm một tài khoản WeChat khác, hãy chạy lại cùng lệnh đăng nhập. Khi sử dụng
nhiều tài khoản, hãy cô lập các phiên tin nhắn trực tiếp theo tài khoản, kênh và
người gửi:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Kiểm soát truy cập

Tin nhắn trực tiếp sử dụng mô hình ghép nối và danh sách cho phép thông thường
của OpenClaw dành cho các plugin kênh.

Phê duyệt người gửi mới:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Để xem đầy đủ mô hình kiểm soát truy cập, hãy tham khảo [Ghép nối](/vi/channels/pairing).

## Khả năng tương thích

Plugin kiểm tra phiên bản OpenClaw của máy chủ khi khởi động.

| Dòng plugin | Phiên bản OpenClaw                                                | Thẻ npm  |
| ----------- | ----------------------------------------------------------------- | -------- |
| `2.x`       | `>=2026.5.12` (2.4.6 hiện tại; các bản 2.x đầu tiên chấp nhận `>=2026.3.22`) | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22`                                         | `legacy` |

Nếu plugin báo phiên bản OpenClaw của bạn quá cũ, hãy cập nhật OpenClaw hoặc cài
đặt dòng plugin cũ:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Tiến trình sidecar

Plugin WeChat có thể chạy tác vụ hỗ trợ bên cạnh Gateway trong khi giám sát API
Tencent iLink. Trong sự cố #68451, đường dẫn tác vụ hỗ trợ này đã làm lộ một lỗi
trong cơ chế dọn dẹp Gateway cũ dùng chung của OpenClaw: một tiến trình con có
thể cố dọn dẹp tiến trình Gateway cha, gây ra vòng lặp khởi động lại dưới các
trình quản lý tiến trình như systemd.

Cơ chế dọn dẹp khi khởi động hiện tại của OpenClaw loại trừ tiến trình hiện tại
và các tiến trình tổ tiên của nó, vì vậy tác vụ hỗ trợ của kênh không thể kết
thúc Gateway đã khởi chạy nó. Bản sửa lỗi này mang tính tổng quát; đây không phải
là đường dẫn dành riêng cho WeChat trong lõi.

## Khắc phục sự cố

Kiểm tra trạng thái cài đặt và hoạt động:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Nếu kênh hiển thị là đã cài đặt nhưng không kết nối, hãy xác nhận plugin đã được
bật rồi khởi động lại:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Nếu Gateway liên tục khởi động lại sau khi bật WeChat, hãy cập nhật cả OpenClaw
và plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Nếu khi khởi động có thông báo rằng gói plugin đã cài đặt `requires compiled runtime
output for TypeScript entry`, thì gói npm đã được phát hành mà không có các tệp
môi trường thực thi JavaScript đã biên dịch mà OpenClaw cần. Hãy cập nhật/cài đặt
lại sau khi nhà phát hành plugin cung cấp gói đã sửa, hoặc tạm thời tắt/gỡ cài đặt
plugin.

Tạm thời tắt:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Tài liệu liên quan

- Tổng quan về kênh: [Các kênh trò chuyện](/vi/channels)
- Ghép nối: [Ghép nối](/vi/channels/pairing)
- Định tuyến kênh: [Định tuyến kênh](/vi/channels/channel-routing)
- Kiến trúc Plugin: [Kiến trúc Plugin](/vi/plugins/architecture)
- SDK plugin kênh: [SDK Plugin kênh](/vi/plugins/sdk-channel-plugins)
- Gói bên ngoài: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
