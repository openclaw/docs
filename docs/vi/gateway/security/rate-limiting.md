---
read_when:
    - Máy khách gặp lỗi `rate limit exceeded for <method>`, `AUTH_RATE_LIMITED` hoặc lỗi khóa truy cập
    - Bạn muốn tinh chỉnh `gateway.auth.rateLimit`
    - Bạn đang phân tích cơ chế bảo vệ chống tấn công vét cạn trên một Gateway được công khai ra bên ngoài
    - Bạn cần biết những bề mặt Gateway nào bị giới hạn tốc độ và giới hạn cụ thể là bao nhiêu
summary: 'Tài liệu tham khảo về mọi giới hạn tốc độ của Gateway: khóa trước xác thực, điều tiết trình duyệt và Webhook, cơ chế dự phòng cho thao tác ghi trên mặt phẳng điều khiển, giới hạn phiên ACP và thời gian chờ giữa các lần khởi động lại'
title: Giới hạn tốc độ
x-i18n:
    generated_at: "2026-07-19T05:50:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7aa37b65347610bedfb1db8f661e7ba75ef3cdfed0ba73c4ce53d80acace1e48
    source_path: gateway/security/rate-limiting.md
    workflow: 16
---

Gateway áp dụng một số giới hạn tốc độ độc lập. Chúng bảo vệ các
ranh giới khác nhau, dùng các danh tính khác nhau làm khóa và trả về các dạng lỗi khác nhau.
Trang này là tài liệu tham chiếu cho tất cả các giới hạn đó.

Tổng quan:

| Bề mặt                             | Giới hạn (mặc định)                  | Khóa theo                         | Có thể cấu hình             |
| ----------------------------------- | -------------------------------- | -------------------------------- | ------------------------ |
| Xác thực thất bại (token/mật khẩu/thiết bị) | 10 lần thất bại / 60 giây, khóa 5 phút | IP + phạm vi thông tin xác thực            | `gateway.auth.rateLimit` |
| Xác thực WS từ trình duyệt thất bại     | tương tự, loopback **không** được miễn    | IP hoặc nguồn gốc trang từ loopback | `gateway.auth.rateLimit` |
| Xác thực Webhook (`/hooks`) thất bại    | 20 lần thất bại / 60 giây, khóa 60 giây   | IP                               | không                       |
| RPC ghi trên mặt phẳng điều khiển            | 30 yêu cầu / 60 giây cho mỗi phương thức     | phương thức + thiết bị + IP             | không                       |
| Tạo phiên ACP                | 120 phiên / 10 giây               | thực thể trình chuyển đổi              | nội bộ                 |
| Chu kỳ khởi động lại Gateway              | thời gian chờ 30 giây giữa các lần khởi động lại    | tiến trình                          | không                       |

## Lần thử xác thực (trước xác thực)

Các lần thử xác thực thất bại bị giới hạn theo từng IP máy khách trước khi
xử lý bất kỳ yêu cầu nào. Đây là cơ chế bảo vệ chống vét cạn cho các Gateway được công khai.

- Chỉ thông tin xác thực _sai_ mới được tính. Thông tin xác thực bị thiếu (máy khách chưa từng
  gửi token) và các lần xác thực thành công không tiêu tốn hạn mức; một lần
  xác thực thành công sẽ đặt lại bộ đếm cho IP đó.
- Mặc định: 10 lần thất bại trong mỗi 60 giây, sau đó khóa IP đó trong 5 phút.
- Loopback (`127.0.0.1` / `::1`) được miễn theo mặc định để các phiên CLI cục bộ
  không thể bị khóa.
- Các bộ đếm được phân phạm vi theo từng lớp thông tin xác thực, vì vậy lưu lượng dồn dập nhắm vào một bề mặt
  không chiếm chỗ của bề mặt khác. Các phạm vi bao gồm token/mật khẩu Gateway
  dùng chung, token thiết bị, ghép nối Node, phê duyệt lại Node đã ghép nối,
  token khởi tạo thiết bị và việc phát hành thử thách watchOS.

Trong thời gian bị khóa, các lần thử kết nối thất bại với:

```json
{
  "code": "INVALID_REQUEST",
  "message": "unauthorized: too many failed authentication attempts (retry later)",
  "retryable": true,
  "retryAfterMs": 297000,
  "details": {
    "code": "AUTH_RATE_LIMITED",
    "authReason": "rate_limited",
    "recommendedNextStep": "wait_then_retry"
  }
}
```

Các lần thử từ những IP khác (bao gồm loopback) không bị ảnh hưởng trong thời gian khóa.

Điều chỉnh tại `gateway.auth.rateLimit` trong `openclaw.json`:

```json
{
  "gateway": {
    "auth": {
      "rateLimit": {
        "maxAttempts": 10,
        "windowMs": 60000,
        "lockoutMs": 300000,
        "exemptLoopback": true
      }
    }
  }
}
```

Các mục `AUTH_RATE_LIMITED` lặp lại trong nhật ký Gateway có nghĩa là ai đó đang
đoán thông tin xác thực; xem [cẩm nang xử lý phơi lộ](/vi/gateway/security/exposure-runbook).

### Kết nối từ trình duyệt

Các kết nối WebSocket mang tiêu đề `Origin` của trình duyệt sử dụng cùng
các giới hạn nhưng chế độ miễn loopback **luôn tắt** — một trang độc hại trong
trình duyệt cục bộ vẫn là máy khách không đáng tin cậy, vì vậy localhost không được miễn trừ
trên đường dẫn đó. Khi kết nối như vậy đến _từ_ một địa chỉ loopback, các
lần thất bại của nó được khóa theo nguồn gốc trang đã chuẩn hóa (ví dụ:
`browser-origin:https://evil.example`) thay vì IP loopback dùng chung,
vì vậy mỗi nguồn gốc có một nhóm hạn mức riêng; từ các địa chỉ không phải loopback, khóa
vẫn là IP máy khách. Không thể cấu hình hành vi này.

### Webhook

Đầu vào HTTP `/hooks` có bộ giới hạn thất bại riêng: 20 lần
xác thực thất bại trong mỗi 60 giây cho mỗi IP máy khách, sau đó khóa 60 giây.
Loopback không được miễn. Xác thực hook thành công sẽ đặt lại bộ đếm. Các yêu cầu
bị giới hạn nhận HTTP `429 Too Many Requests` dạng văn bản thuần với tiêu đề `Retry-After`
(giây). Các giới hạn là cố định; nếu một tích hợp hợp lệ chạm ngưỡng này,
hãy sửa thông tin xác thực thay vì thử lại dồn dập hơn.

## Lệnh ghi trên mặt phẳng điều khiển (cơ chế dự phòng sau xác thực)

Các RPC quản trị phía ghi (`config.apply`, `config.patch`, `plugins.install`,
`plugins.setEnabled`, `plugins.uninstall`, `update.run`, `worktrees.*`,
`gateway.restart.request`, ...) còn bị giới hạn tốc độ bổ sung **sau khi**
ủy quyền: 30 yêu cầu trong mỗi 60 giây, cho mỗi phương thức, cho mỗi
`deviceId+clientIp`.

Đây không phải là ranh giới bảo mật — các bên gọi đã có `operator.admin` — mà
là cơ chế dự phòng nhằm giới hạn các vòng lặp máy khách hoặc tác tử mất kiểm soát liên tục gọi các
thao tác tốn kém. Việc sử dụng tương tác không bao giờ chạm ngưỡng này; mỗi phương thức có nhóm hạn mức riêng, vì vậy
việc bật/tắt một Plugin không tiêu tốn hạn mức của các lệnh ghi cấu hình.

Khi vượt ngưỡng, yêu cầu thất bại với lỗi có thể thử lại:

```json
{
  "code": "UNAVAILABLE",
  "message": "rate limit exceeded for config.patch; retry after 35s",
  "retryable": true,
  "retryAfterMs": 34539,
  "details": { "method": "config.patch", "limit": "30 per 60s" }
}
```

Máy khách nên tuân thủ `retryAfterMs`. Giới hạn là cố định (không thể cấu hình);
các nhóm hạn mức tự hết hạn và được tác vụ bảo trì Gateway dọn dẹp.

## Tạo phiên ACP

Trình chuyển đổi ACP giới hạn việc tạo phiên ở mức 120 phiên mới trong mỗi khoảng
10 giây cho mỗi thực thể trình chuyển đổi. Việc vượt ngưỡng khiến yêu cầu thất bại với một lỗi
có thông báo chứa thời gian chờ (không có trường `retryAfterMs` có cấu trúc
trên đường dẫn này):

```
Đã vượt quá giới hạn tốc độ tạo phiên ACP cho <method>; hãy thử lại sau <n> giây.
```

Điều này giới hạn các máy khách mất kiểm soát tạo phiên trong vòng lặp; việc sử dụng IDE và
tác tử thông thường luôn thấp hơn nhiều so với ngưỡng này.

## Thời gian chờ khởi động lại

Các yêu cầu khởi động lại Gateway được gộp lại, sau đó áp dụng thời gian chờ 30 giây giữa
các chu kỳ khởi động lại. Yêu cầu khởi động lại trong thời gian chờ sẽ được lên lịch sau khi thời gian đó
kết thúc thay vì bị từ chối. Cơ chế này tách biệt với bộ giới hạn mặt phẳng điều khiển
ở trên: `gateway.restart.request` tiêu tốn một vị trí trong hạn mức mặt phẳng điều khiển _và_
lần khởi động lại phát sinh phải tuân theo thời gian chờ.

## Ghi chú vận hành

- Tất cả bộ giới hạn đều nằm trong bộ nhớ và áp dụng cho từng tiến trình; nhiều Gateway không
  chia sẻ trạng thái. Việc thay thế tiến trình Gateway sẽ xóa các bộ đếm do Gateway sở hữu
  (khóa xác thực, giới hạn Webhook, các nhóm hạn mức mặt phẳng điều khiển). Thời gian
  chờ khởi động lại được thiết kế để tồn tại qua các chu kỳ khởi động lại trong tiến trình — đó chính là
  đối tượng mà nó giới hạn — và chỉ được đặt lại cùng tiến trình. Giới hạn phiên ACP
  thuộc về thực thể trình chuyển đổi của nó và được đặt lại khi thực thể đó
  được tạo lại, không phải khi Gateway khởi động lại.
- Các ánh xạ nhóm hạn mức có giới hạn (giới hạn cứng về số mục cùng với việc dọn dẹp định kỳ), vì vậy
  lưu lượng dồn dập với các khóa duy nhất không thể làm bộ nhớ tăng vô hạn.
- Khi máy khách ở sau proxy ngược, IP hiệu lực là IP máy khách đã phân giải;
  xem [xác thực proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth) để biết cách
  các tiêu đề proxy được xác thực trước khi có thể ảnh hưởng đến IP đó.
- Tín hiệu thử lại khác nhau tùy bề mặt: các bộ giới hạn RPC của Gateway trả về
  `retryable: true` cùng với `retryAfterMs`, đầu vào Webhook sử dụng HTTP 429
  với tiêu đề `Retry-After`, còn ACP nhúng thời gian chờ vào thông báo lỗi.
  Trong mọi trường hợp, hãy chờ theo khoảng thời gian được chỉ định thay vì thử lại
  ngay lập tức.
