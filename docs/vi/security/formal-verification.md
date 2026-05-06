---
permalink: /security/formal-verification/
read_when:
    - Đánh giá các bảo đảm hoặc giới hạn của mô hình bảo mật hình thức
    - Tái hiện hoặc cập nhật các kiểm tra mô hình bảo mật TLA+/TLC
summary: Các mô hình bảo mật được kiểm tra bằng máy cho các đường dẫn có rủi ro cao nhất của OpenClaw.
title: Kiểm chứng hình thức (mô hình bảo mật)
x-i18n:
    generated_at: "2026-05-06T09:29:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298b92f27abb8321be807fe4d95c7cd568a0fb8f543d168863b2adb9b3ddcde4
    source_path: security/formal-verification.md
    workflow: 16
---

Trang này theo dõi các **mô hình bảo mật chính thức** của OpenClaw (hiện tại là TLA+/TLC; bổ sung thêm khi cần).

> Lưu ý: một số liên kết cũ có thể tham chiếu đến tên dự án trước đây.

**Mục tiêu (kim chỉ nam):** cung cấp một lập luận được máy kiểm chứng rằng OpenClaw thực thi
chính sách bảo mật dự kiến của mình (ủy quyền, cô lập phiên, kiểm soát công cụ và
an toàn trước cấu hình sai), theo các giả định rõ ràng.

**Hiện tại đây là gì:** một **bộ kiểm thử hồi quy bảo mật** có thể thực thi, do kẻ tấn công dẫn dắt:

- Mỗi khẳng định có một lượt kiểm chứng mô hình có thể chạy trên một không gian trạng thái hữu hạn.
- Nhiều khẳng định có một **mô hình âm tính** đi kèm, tạo ra vết phản ví dụ cho một lớp lỗi thực tế.

**Đây chưa phải là gì:** một bằng chứng rằng "OpenClaw an toàn ở mọi khía cạnh" hoặc rằng toàn bộ triển khai TypeScript là đúng.

## Nơi lưu các mô hình

Các mô hình được duy trì trong một repo riêng: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Các lưu ý quan trọng

- Đây là **mô hình**, không phải toàn bộ triển khai TypeScript. Có thể có độ lệch giữa mô hình và mã.
- Kết quả bị giới hạn bởi không gian trạng thái mà TLC khám phá; trạng thái "xanh" không hàm ý bảo mật vượt ngoài các giả định và giới hạn đã được mô hình hóa.
- Một số khẳng định dựa vào các giả định môi trường rõ ràng (ví dụ: triển khai đúng, đầu vào cấu hình đúng).

## Tái tạo kết quả

Hiện tại, kết quả được tái tạo bằng cách clone repo mô hình về máy cục bộ và chạy TLC (xem bên dưới). Một phiên bản trong tương lai có thể cung cấp:

- Các mô hình chạy trên CI với hiện vật công khai (vết phản ví dụ, nhật ký chạy)
- một quy trình "chạy mô hình này" được lưu trữ cho các kiểm tra nhỏ, có giới hạn

Bắt đầu:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned `tla2tools.jar` (TLA+ tools) and provides `bin/tlc` + Make targets.

make <target>
```

### Phơi lộ Gateway và cấu hình sai Gateway mở

**Khẳng định:** liên kết vượt ngoài loopback khi không có xác thực có thể khiến việc xâm nhập từ xa trở nên khả thi / làm tăng mức phơi lộ; token/mật khẩu chặn kẻ tấn công chưa xác thực (theo các giả định của mô hình).

- Các lượt chạy xanh:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Đỏ (dự kiến):
  - `make gateway-exposure-v2-negative`

Xem thêm: `docs/gateway-exposure-matrix.md` trong repo mô hình.

### Đường ống thực thi Node (năng lực rủi ro cao nhất)

**Khẳng định:** `exec host=node` yêu cầu (a) allowlist lệnh node cùng các lệnh đã khai báo và (b) phê duyệt trực tiếp khi được cấu hình; các phê duyệt được token hóa để ngăn phát lại (trong mô hình).

- Các lượt chạy xanh:
  - `make nodes-pipeline`
  - `make approvals-token`
- Đỏ (dự kiến):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Kho ghép đôi (kiểm soát DM)

**Khẳng định:** các yêu cầu ghép đôi tuân thủ TTL và giới hạn số yêu cầu đang chờ.

- Các lượt chạy xanh:
  - `make pairing`
  - `make pairing-cap`
- Đỏ (dự kiến):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Kiểm soát đầu vào (nhắc tên + bỏ qua lệnh điều khiển)

**Khẳng định:** trong ngữ cảnh nhóm yêu cầu nhắc tên, một "lệnh điều khiển" trái phép không thể bỏ qua kiểm soát nhắc tên.

- Xanh:
  - `make ingress-gating`
- Đỏ (dự kiến):
  - `make ingress-gating-negative`

### Cô lập định tuyến/khóa phiên

**Khẳng định:** các DM từ những peer khác nhau không bị gộp vào cùng một phiên trừ khi được liên kết/cấu hình rõ ràng.

- Xanh:
  - `make routing-isolation`
- Đỏ (dự kiến):
  - `make routing-isolation-negative`

## v1++: các mô hình giới hạn bổ sung (đồng thời, thử lại, tính đúng của vết)

Đây là các mô hình tiếp nối giúp tăng độ sát thực quanh các chế độ lỗi trong thực tế (cập nhật không nguyên tử, thử lại và phát tán thông điệp).

### Đồng thời / tính lũy đẳng của kho ghép đôi

**Khẳng định:** một kho ghép đôi nên thực thi `MaxPending` và tính lũy đẳng ngay cả khi có các xen kẽ thực thi (tức là "kiểm tra rồi ghi" phải là nguyên tử / được khóa; làm mới không nên tạo bản sao trùng lặp).

Ý nghĩa:

- Khi có các yêu cầu đồng thời, không thể vượt quá `MaxPending` cho một kênh.
- Các yêu cầu/lần làm mới lặp lại cho cùng một `(channel, sender)` không nên tạo ra các hàng đang chờ còn hiệu lực bị trùng lặp.

- Các lượt chạy xanh:
  - `make pairing-race` (kiểm tra giới hạn nguyên tử/được khóa)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Đỏ (dự kiến):
  - `make pairing-race-negative` (đua giới hạn begin/commit không nguyên tử)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Tương quan vết / tính lũy đẳng đầu vào

**Khẳng định:** quá trình nạp đầu vào nên giữ nguyên tương quan vết khi phát tán và có tính lũy đẳng khi nhà cung cấp thử lại.

Ý nghĩa:

- Khi một sự kiện bên ngoài trở thành nhiều thông điệp nội bộ, mọi phần đều giữ cùng danh tính vết/sự kiện.
- Các lần thử lại không dẫn đến xử lý kép.
- Nếu thiếu ID sự kiện của nhà cung cấp, chống trùng lặp rơi về một khóa an toàn (ví dụ: ID vết) để tránh bỏ mất các sự kiện khác nhau.

- Xanh:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Đỏ (dự kiến):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Mức ưu tiên dmScope định tuyến + identityLinks

**Khẳng định:** định tuyến phải giữ các phiên DM được cô lập theo mặc định, và chỉ gộp phiên khi được cấu hình rõ ràng (mức ưu tiên kênh + liên kết danh tính).

Ý nghĩa:

- Các override dmScope dành riêng cho kênh phải thắng mặc định toàn cục.
- identityLinks chỉ nên gộp trong các nhóm được liên kết rõ ràng, không gộp giữa các peer không liên quan.

- Xanh:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Đỏ (dự kiến):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## Liên quan

- [Mô hình mối đe dọa](/vi/security/THREAT-MODEL-ATLAS)
- [Đóng góp cho mô hình mối đe dọa](/vi/security/CONTRIBUTING-THREAT-MODEL)
