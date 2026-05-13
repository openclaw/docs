---
read_when:
    - Đang xử lý các kiểm soát đo từ xa / quyền riêng tư
    - Câu hỏi về dữ liệu nào được thu thập
summary: Dữ liệu đo từ xa về cài đặt được thu thập qua `clawhub sync` + tùy chọn từ chối tham gia.
x-i18n:
    generated_at: "2026-05-13T05:33:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Đo lường từ xa

ClawHub sử dụng **đo lường từ xa tối thiểu** để tính **số lượt cài đặt** (những gì thực sự đang được sử dụng) và hỗ trợ sắp xếp/lọc tốt hơn.
Điều này dựa trên lệnh CLI `clawhub sync`.

## Khi đo lường từ xa được thu thập

Dữ liệu đo lường từ xa chỉ được gửi khi:

- Bạn đã **đăng nhập** trong CLI (chúng tôi đã yêu cầu xác thực cho các luồng đồng bộ hóa/xuất bản).
- Bạn chạy `clawhub sync`.
- Đo lường từ xa **không bị tắt** (xem “Cách tắt” bên dưới).

Nếu bạn chưa đăng nhập, không có gì được báo cáo.

## Những gì chúng tôi thu thập

Mỗi lần chạy `clawhub sync`, CLI báo cáo một **ảnh chụp nhanh đầy đủ** về những gì tìm thấy, được nhóm theo gốc quét (“thư mục/gốc”).

Với mỗi gốc, chúng tôi lưu:

- `rootId`: một **băm SHA-256** của đường dẫn gốc chuẩn hóa (máy chủ không bao giờ thấy đường dẫn thô).
- `label`: một nhãn dễ đọc được suy ra từ hai đoạn đường dẫn cuối cùng (đường dẫn home được hiển thị bằng `~`).
- `firstSeenAt`, `lastSeenAt`, `expiredAt` tùy chọn.

Với mỗi kỹ năng được tìm thấy dưới một gốc, chúng tôi lưu:

- `skillId` (được phân giải theo slug; chỉ theo dõi các kỹ năng tồn tại trong registry).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (nỗ lực tốt nhất; hiện là phiên bản khớp với registry nếu biết).
- `removedAt` tùy chọn khi một lượt cài đặt đã được báo cáo trước đó biến mất khỏi một gốc.

### Những gì chúng tôi _không_ thu thập

- Không có đường dẫn thư mục tuyệt đối thô (chỉ `rootId` đã băm + một nhãn hiển thị ngắn).
- Không có nội dung tệp.
- Không có nhật ký theo từng lần chạy, prompt, hoặc đầu ra CLI khác.
- Không theo dõi các kỹ năng chưa được tải lên registry (các slug không xác định bị bỏ qua).

## Số lượt cài đặt

Chúng tôi duy trì hai bộ đếm cho mỗi kỹ năng:

- `installsCurrent`: người dùng duy nhất hiện đang cài đặt kỹ năng trong ít nhất một gốc đang hoạt động.
- `installsAllTime`: người dùng duy nhất từng báo cáo đã cài đặt kỹ năng.

### Nhiều gốc

Nếu bạn đồng bộ hóa từ nhiều thư mục, chúng tôi xử lý từng gốc quét độc lập. Một kỹ năng được coi là “hiện đang được cài đặt” nếu nó tồn tại trong **bất kỳ** gốc đang hoạt động nào.

### Phát hiện gỡ cài đặt

Vì `sync` báo cáo toàn bộ tập hợp cho mỗi gốc:

- Nếu một kỹ năng biến mất khỏi một gốc trong lần đồng bộ hóa tiếp theo, chúng tôi đánh dấu kỹ năng đó là đã bị xóa khỏi gốc đó.
- Nếu kỹ năng bị xóa khỏi tất cả các gốc của bạn, nó không còn được tính vào `installsCurrent`.
- `installsAllTime` không bao giờ giảm trừ khi bạn xóa dữ liệu đo lường từ xa (xem bên dưới).

### Tình trạng lỗi thời (120 ngày)

Các gốc không báo cáo dữ liệu đo lường từ xa trong **120 ngày** sẽ được đánh dấu là lỗi thời và các lượt cài đặt của chúng ngừng được tính vào `installsCurrent`.
Việc này được đánh giá theo cách trì hoãn (trong báo cáo đo lường từ xa tiếp theo) để tránh tác vụ nền.

## Tính minh bạch + quyền kiểm soát của người dùng

ClawHub cung cấp một tab “Đã cài đặt” riêng tư trên hồ sơ của chính bạn:

- Hiển thị chính xác các gốc + kỹ năng đã cài đặt mà chúng tôi lưu.
- Bao gồm chế độ xem **xuất JSON**.
- Bao gồm hành động **Xóa dữ liệu đo lường từ xa** để xóa toàn bộ dữ liệu đo lường từ xa đã lưu cho tài khoản của bạn.

Mọi người khác chỉ thấy **các bộ đếm lượt cài đặt tổng hợp**; không ai khác có thể thấy các gốc/thư mục của bạn.

Xóa tài khoản của bạn cũng sẽ xóa dữ liệu đo lường từ xa của bạn.

## Cách tắt đo lường từ xa

Đặt biến môi trường:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Khi đặt biến này, CLI sẽ không gửi dữ liệu đo lường từ xa trong lúc chạy `clawhub sync`.
