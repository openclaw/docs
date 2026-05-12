---
read_when:
    - Đang xử lý các biện pháp kiểm soát đo lường từ xa / quyền riêng tư
    - Câu hỏi về dữ liệu nào được thu thập
summary: Dữ liệu đo từ xa về quá trình cài đặt được thu thập qua `clawhub sync` + tùy chọn không tham gia.
x-i18n:
    generated_at: "2026-05-12T00:58:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Dữ liệu đo từ xa

ClawHub sử dụng **dữ liệu đo từ xa tối thiểu** để tính **số lượt cài đặt** (những gì thực sự đang được sử dụng) và hỗ trợ sắp xếp/lọc tốt hơn.
Điều này dựa trên lệnh CLI `clawhub sync`.

## Khi dữ liệu đo từ xa được thu thập

Dữ liệu đo từ xa chỉ được gửi khi:

- Bạn đã **đăng nhập** trong CLI (chúng tôi đã yêu cầu xác thực cho các luồng sync/publish).
- Bạn chạy `clawhub sync`.
- Dữ liệu đo từ xa **không bị tắt** (xem “Cách tắt” bên dưới).

Nếu bạn chưa đăng nhập, không có gì được báo cáo.

## Những gì chúng tôi thu thập

Trong mỗi lần `clawhub sync`, CLI báo cáo một **bản chụp đầy đủ** về những gì nó tìm thấy, được nhóm theo gốc quét (“thư mục/gốc”).

Với mỗi gốc, chúng tôi lưu:

- `rootId`: một **hàm băm SHA-256** của đường dẫn gốc chuẩn hóa (máy chủ không bao giờ thấy đường dẫn thô).
- `label`: nhãn dễ đọc cho con người, được dẫn xuất từ hai đoạn đường dẫn cuối cùng (đường dẫn home được hiển thị bằng `~`).
- `firstSeenAt`, `lastSeenAt`, tùy chọn `expiredAt`.

Với mỗi skill được tìm thấy dưới một gốc, chúng tôi lưu:

- `skillId` (được phân giải theo slug; chỉ những skill tồn tại trong registry mới được theo dõi).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (nỗ lực tốt nhất; hiện là phiên bản khớp với registry nếu biết).
- tùy chọn `removedAt` khi một bản cài đặt đã được báo cáo trước đó biến mất khỏi một gốc.

### Những gì chúng tôi _không_ thu thập

- Không có đường dẫn thư mục tuyệt đối thô (chỉ `rootId` đã băm + một nhãn hiển thị ngắn).
- Không có nội dung tệp.
- Không có nhật ký theo từng lần chạy, prompt hoặc đầu ra CLI khác.
- Không theo dõi các skill chưa được tải lên registry (các slug không xác định bị bỏ qua).

## Số lượt cài đặt

Chúng tôi duy trì hai bộ đếm cho mỗi skill:

- `installsCurrent`: số người dùng duy nhất hiện đã cài đặt skill trong ít nhất một gốc đang hoạt động.
- `installsAllTime`: số người dùng duy nhất từng báo cáo đã cài đặt skill.

### Nhiều gốc

Nếu bạn sync từ nhiều thư mục, chúng tôi xử lý từng gốc quét một cách độc lập. Một skill được xem là “hiện đã cài đặt” nếu nó tồn tại trong **bất kỳ** gốc đang hoạt động nào.

### Phát hiện gỡ cài đặt

Vì `sync` báo cáo toàn bộ tập hợp theo từng gốc:

- Nếu một skill biến mất khỏi một gốc trong lần sync tiếp theo, chúng tôi đánh dấu skill đó là đã bị xóa khỏi gốc đó.
- Nếu skill bị xóa khỏi tất cả các gốc của bạn, skill đó không còn được tính vào `installsCurrent`.
- `installsAllTime` không bao giờ giảm trừ khi bạn xóa dữ liệu đo từ xa (xem bên dưới).

### Quá hạn (120 ngày)

Các gốc không báo cáo dữ liệu đo từ xa trong **120 ngày** sẽ được đánh dấu là quá hạn và các bản cài đặt của chúng ngừng được tính vào `installsCurrent`.
Việc này được đánh giá một cách lười biếng (trong báo cáo dữ liệu đo từ xa tiếp theo) để tránh các tác vụ nền.

## Minh bạch + quyền kiểm soát của người dùng

ClawHub cung cấp một tab “Đã cài đặt” riêng tư trên hồ sơ của chính bạn:

- Hiển thị chính xác các gốc + skill đã cài đặt mà chúng tôi lưu trữ.
- Bao gồm chế độ xem **xuất JSON**.
- Bao gồm hành động **Xóa dữ liệu đo từ xa** để xóa tất cả dữ liệu đo từ xa đã lưu cho tài khoản của bạn.

Những người khác chỉ thấy **bộ đếm lượt cài đặt tổng hợp**; không ai khác có thể thấy các gốc/thư mục của bạn.

Xóa tài khoản của bạn cũng xóa dữ liệu đo từ xa của bạn.

## Cách tắt dữ liệu đo từ xa

Đặt biến môi trường:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Khi biến này được đặt, CLI sẽ không gửi dữ liệu đo từ xa trong lúc `clawhub sync`.
