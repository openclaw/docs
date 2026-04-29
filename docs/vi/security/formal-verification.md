---
permalink: /security/formal-verification/
read_when:
    - Xem xét các bảo đảm hoặc giới hạn của mô hình bảo mật hình thức
    - Tái tạo hoặc cập nhật các kiểm tra mô hình bảo mật TLA+/TLC
summary: Các mô hình bảo mật được kiểm chứng bằng máy cho các luồng có rủi ro cao nhất của OpenClaw.
title: Kiểm chứng hình thức (mô hình bảo mật)
x-i18n:
    generated_at: "2026-04-29T23:13:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f50fa9118a80054b8d556cd4f1901b2d5fcb37fb0866bd5357a1b0a46c74116
    source_path: security/formal-verification.md
    workflow: 16
---

Trang này theo dõi các **mô hình bảo mật hình thức** của OpenClaw (hiện nay là TLA+/TLC; thêm khi cần).

> Lưu ý: một số liên kết cũ hơn có thể tham chiếu đến tên dự án trước đây.

**Mục tiêu (kim chỉ nam):** cung cấp một lập luận được máy kiểm tra rằng OpenClaw thực thi
chính sách bảo mật dự kiến của mình (ủy quyền, cô lập phiên, kiểm soát truy cập công cụ và
an toàn trước cấu hình sai), theo các giả định rõ ràng.

**Hiện tại đây là gì:** một **bộ hồi quy bảo mật** có thể thực thi, theo hướng kẻ tấn công:

- Mỗi tuyên bố có một phép kiểm tra mô hình có thể chạy trên một không gian trạng thái hữu hạn.
- Nhiều tuyên bố có một **mô hình phủ định** đi kèm, tạo ra vết phản ví dụ cho một lớp lỗi thực tế.

**Hiện tại đây chưa phải là gì:** một bằng chứng rằng “OpenClaw bảo mật về mọi mặt” hoặc rằng toàn bộ phần triển khai TypeScript là đúng.

## Nơi lưu các mô hình

Các mô hình được duy trì trong một repo riêng: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Lưu ý quan trọng

- Đây là **mô hình**, không phải toàn bộ phần triển khai TypeScript. Có thể có độ lệch giữa mô hình và mã.
- Kết quả bị giới hạn bởi không gian trạng thái mà TLC khám phá; “xanh” không hàm ý bảo mật vượt ngoài các giả định và giới hạn đã được mô hình hóa.
- Một số tuyên bố dựa trên các giả định môi trường rõ ràng (ví dụ: triển khai đúng, đầu vào cấu hình đúng).

## Tái tạo kết quả

Hiện nay, kết quả được tái tạo bằng cách clone repo mô hình về máy cục bộ và chạy TLC (xem bên dưới). Một phiên bản trong tương lai có thể cung cấp:

- các mô hình chạy trên CI với artifact công khai (vết phản ví dụ, nhật ký chạy)
- một workflow “chạy mô hình này” được lưu trữ cho các phép kiểm tra nhỏ, có giới hạn

Bắt đầu:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned `tla2tools.jar` (TLA+ tools) and provides `bin/tlc` + Make targets.

make <target>
```

### Phơi lộ Gateway và cấu hình sai Gateway mở

**Tuyên bố:** bind vượt ra ngoài loopback mà không có auth có thể khiến việc xâm phạm từ xa trở nên khả thi / làm tăng mức phơi lộ; token/password chặn kẻ tấn công chưa xác thực (theo các giả định của mô hình).

- Các lượt chạy xanh:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Đỏ (dự kiến):
  - `make gateway-exposure-v2-negative`

Xem thêm: `docs/gateway-exposure-matrix.md` trong repo mô hình.

### Pipeline exec Node (năng lực rủi ro cao nhất)

**Tuyên bố:** `exec host=node` yêu cầu (a) allowlist lệnh node cộng với các lệnh đã khai báo và (b) phê duyệt trực tiếp khi được cấu hình; các phê duyệt được token hóa để ngăn phát lại (trong mô hình).

- Các lượt chạy xanh:
  - `make nodes-pipeline`
  - `make approvals-token`
- Đỏ (dự kiến):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Kho ghép cặp (kiểm soát DM)

**Tuyên bố:** các yêu cầu ghép cặp tôn trọng TTL và giới hạn yêu cầu đang chờ.

- Các lượt chạy xanh:
  - `make pairing`
  - `make pairing-cap`
- Đỏ (dự kiến):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Kiểm soát ingress (mention + bỏ qua lệnh điều khiển)

**Tuyên bố:** trong ngữ cảnh nhóm yêu cầu mention, một “lệnh điều khiển” trái phép không thể bỏ qua kiểm soát mention.

- Xanh:
  - `make ingress-gating`
- Đỏ (dự kiến):
  - `make ingress-gating-negative`

### Định tuyến/cô lập khóa phiên

**Tuyên bố:** các DM từ những peer khác nhau không bị gộp vào cùng một phiên trừ khi được liên kết/cấu hình rõ ràng.

- Xanh:
  - `make routing-isolation`
- Đỏ (dự kiến):
  - `make routing-isolation-negative`

## v1++: các mô hình có giới hạn bổ sung (đồng thời, thử lại, tính đúng của vết)

Đây là các mô hình tiếp nối nhằm siết chặt độ trung thực quanh các chế độ lỗi trong thực tế (cập nhật không nguyên tử, thử lại và fan-out tin nhắn).

### Tính đồng thời / tính idempotent của kho ghép cặp

**Tuyên bố:** kho ghép cặp nên thực thi `MaxPending` và tính idempotent ngay cả khi có các interleaving (tức là “check-then-write” phải nguyên tử / được khóa; refresh không nên tạo bản sao trùng lặp).

Điều này có nghĩa là:

- Với các yêu cầu đồng thời, bạn không thể vượt quá `MaxPending` cho một kênh.
- Các yêu cầu/refresh lặp lại cho cùng một `(channel, sender)` không nên tạo các hàng pending còn hiệu lực bị trùng lặp.

- Các lượt chạy xanh:
  - `make pairing-race` (kiểm tra giới hạn nguyên tử/được khóa)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Đỏ (dự kiến):
  - `make pairing-race-negative` (race giới hạn begin/commit không nguyên tử)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Tương quan vết / tính idempotent của ingress

**Tuyên bố:** ingestion nên giữ nguyên tương quan vết qua fan-out và có tính idempotent khi provider thử lại.

Điều này có nghĩa là:

- Khi một sự kiện bên ngoài trở thành nhiều tin nhắn nội bộ, mọi phần đều giữ cùng danh tính vết/sự kiện.
- Các lần thử lại không dẫn đến xử lý kép.
- Nếu thiếu ID sự kiện của provider, dedupe fallback về một khóa an toàn (ví dụ: trace ID) để tránh bỏ sót các sự kiện khác nhau.

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

### Độ ưu tiên dmScope trong định tuyến + identityLinks

**Tuyên bố:** định tuyến phải mặc định giữ các phiên DM được cô lập, và chỉ gộp phiên khi được cấu hình rõ ràng (độ ưu tiên theo kênh + liên kết danh tính).

Điều này có nghĩa là:

- Các override dmScope theo kênh phải thắng giá trị mặc định toàn cục.
- identityLinks chỉ nên gộp trong các nhóm được liên kết rõ ràng, không gộp giữa các peer không liên quan.

- Xanh:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Đỏ (dự kiến):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## Liên quan

- [Mô hình đe dọa](/vi/security/THREAT-MODEL-ATLAS)
- [Đóng góp cho mô hình đe dọa](/vi/security/CONTRIBUTING-THREAT-MODEL)
