---
permalink: /security/formal-verification/
read_when:
    - Xem xét các bảo đảm hoặc giới hạn của mô hình bảo mật chính thức
    - Tái hiện hoặc cập nhật các kiểm tra mô hình bảo mật TLA+/TLC
summary: Các mô hình bảo mật được kiểm chứng bằng máy cho những đường dẫn có rủi ro cao nhất của OpenClaw.
title: Xác minh hình thức (các mô hình bảo mật)
x-i18n:
    generated_at: "2026-07-19T06:22:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 185ee5c1cff7325f10827330c0c7e55ddc3ca40caf6088d4c930ae5e090d6b27
    source_path: security/formal-verification.md
    workflow: 16
---

Các mô hình bảo mật chính thức của OpenClaw (hiện nay là TLA+/TLC) cung cấp một lập luận được máy kiểm tra rằng các đường dẫn cụ thể có rủi ro cao nhất — ủy quyền, cô lập phiên, kiểm soát công cụ và an toàn trước cấu hình sai — thực thi chính sách dự kiến của chúng theo các giả định đã được nêu rõ.

> Lưu ý: một số liên kết cũ có thể đề cập đến tên trước đây của dự án.

## Đây là gì

Một bộ kiểm thử hồi quy bảo mật có thể thực thi, được định hướng bởi kẻ tấn công:

- Mỗi tuyên bố đều có một phép kiểm tra mô hình có thể chạy trên một không gian trạng thái hữu hạn.
- Nhiều tuyên bố có một mô hình âm đi kèm, tạo ra dấu vết phản ví dụ cho một lớp lỗi thực tế.

Đây **không phải** là bằng chứng rằng OpenClaw an toàn về mọi mặt và không xác minh toàn bộ phần triển khai TypeScript.

## Vị trí của các mô hình

Các mô hình được duy trì trong một kho lưu trữ riêng: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

<Note>
Kho lưu trữ đó hiện không thể truy cập được (GitHub trả về "Repository not found" tại thời điểm viết bài này). Nếu bạn vẫn không thể truy cập, hãy hỏi trong các kênh dành cho người bảo trì OpenClaw về vị trí hiện tại trước khi cho rằng các mô hình đã bị xóa.
</Note>

## Lưu ý

- Đây là các mô hình, không phải toàn bộ phần triển khai TypeScript — có thể xảy ra sai lệch giữa mô hình và mã.
- Kết quả bị giới hạn bởi không gian trạng thái mà TLC khám phá. Trạng thái xanh không hàm ý tính bảo mật vượt ngoài các giả định và giới hạn được mô hình hóa.
- Một số tuyên bố phụ thuộc vào các giả định rõ ràng về môi trường (ví dụ: triển khai đúng và đầu vào cấu hình đúng).

## Tái tạo kết quả

Sao chép kho lưu trữ mô hình và chạy TLC:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Yêu cầu Java 11+ (TLC chạy trên JVM).
# Kho lưu trữ cung cấp tla2tools.jar có phiên bản được cố định cùng bin/tlc và các mục tiêu Make.

make <target>
```

Chưa có tích hợp CI trở lại kho lưu trữ này; một phiên bản trong tương lai có thể bổ sung các mô hình chạy bằng CI cùng những thành phần tạo tác công khai (dấu vết phản ví dụ, nhật ký chạy) hoặc một quy trình "chạy mô hình này" được lưu trữ cho các phép kiểm tra có giới hạn nhỏ.

## Tuyên bố và mục tiêu

### Mức độ phơi bày của Gateway và cấu hình sai Gateway mở

**Tuyên bố:** việc liên kết ngoài loopback mà không có xác thực có thể khiến hành vi xâm phạm từ xa trở thành khả thi và làm tăng mức độ phơi bày; theo các giả định của mô hình, token/mật khẩu sẽ chặn những kẻ tấn công chưa được xác thực.

| Kết quả       | Mục tiêu                                                          |
| ------------- | ----------------------------------------------------------------- |
| Xanh          | `make gateway-exposure-v2`, `make gateway-exposure-v2-protected` |
| Đỏ (dự kiến) | `make gateway-exposure-v2-negative`                              |

Xem thêm `docs/gateway-exposure-matrix.md` trong kho lưu trữ mô hình.

### Pipeline thực thi Node (khả năng có rủi ro cao nhất)

**Tuyên bố:** `exec host=node` yêu cầu (a) danh sách cho phép lệnh Node cùng các lệnh đã khai báo và (b) phê duyệt trực tiếp khi được cấu hình; trong mô hình, các phê duyệt được mã hóa bằng token để ngăn phát lại.

| Kết quả       | Mục tiêu                                                        |
| ------------- | --------------------------------------------------------------- |
| Xanh          | `make nodes-pipeline`, `make approvals-token`                   |
| Đỏ (dự kiến) | `make nodes-pipeline-negative`, `make approvals-token-negative` |

### Kho ghép nối (kiểm soát DM)

**Tuyên bố:** các yêu cầu ghép nối tuân thủ TTL và giới hạn số yêu cầu đang chờ xử lý.

| Kết quả       | Mục tiêu                                              |
| ------------- | ---------------------------------------------------- |
| Xanh          | `make pairing`, `make pairing-cap`                   |
| Đỏ (dự kiến) | `make pairing-negative`, `make pairing-cap-negative` |

### Kiểm soát đầu vào (đề cập và bỏ qua lệnh điều khiển)

**Tuyên bố:** trong ngữ cảnh nhóm yêu cầu đề cập, một lệnh điều khiển không được phép không thể bỏ qua cơ chế kiểm soát đề cập.

| Kết quả       | Mục tiêu                       |
| ------------- | ------------------------------ |
| Xanh          | `make ingress-gating`          |
| Đỏ (dự kiến) | `make ingress-gating-negative` |

### Định tuyến và cô lập khóa phiên

**Tuyên bố:** DM từ các đối tác khác nhau không bị gộp vào cùng một phiên, trừ khi được liên kết hoặc cấu hình rõ ràng.

| Kết quả       | Mục tiêu                          |
| ------------- | --------------------------------- |
| Xanh          | `make routing-isolation`          |
| Đỏ (dự kiến) | `make routing-isolation-negative` |

## Các mô hình v1++: tính đồng thời, thử lại, độ chính xác của dấu vết

Các mô hình tiếp nối giúp nâng cao độ trung thực đối với những chế độ lỗi trong thực tế: cập nhật không nguyên tử, thử lại và phân tán thông điệp.

### Tính đồng thời và tính lũy đẳng của kho ghép nối

**Tuyên bố:** kho ghép nối thực thi `MaxPending` và tính lũy đẳng ngay cả khi các thao tác xen kẽ — thao tác kiểm tra rồi ghi phải mang tính nguyên tử/được khóa và thao tác làm mới không được tạo bản sao. Cụ thể: các yêu cầu đồng thời không thể vượt quá `MaxPending` đối với một kênh và các yêu cầu/lần làm mới lặp lại cho cùng một `(channel, sender)` không tạo ra các hàng đang chờ xử lý còn hiệu lực bị trùng lặp.

| Kết quả       | Mục tiêu                                                                                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Xanh          | `make pairing-race` (kiểm tra giới hạn nguyên tử/được khóa), `make pairing-idempotency`, `make pairing-refresh`, `make pairing-refresh-race`                                              |
| Đỏ (dự kiến) | `make pairing-race-negative` (tranh chấp giới hạn bắt đầu/commit không nguyên tử), `make pairing-idempotency-negative`, `make pairing-refresh-negative`, `make pairing-refresh-race-negative` |

### Tương quan dấu vết và tính lũy đẳng của đầu vào

**Tuyên bố:** quá trình tiếp nhận duy trì tương quan dấu vết trong toàn bộ quá trình phân tán và có tính lũy đẳng khi nhà cung cấp thử lại. Khi một sự kiện bên ngoài trở thành nhiều thông điệp nội bộ, mọi phần đều giữ nguyên danh tính dấu vết/sự kiện; các lần thử lại không xử lý hai lần; nếu thiếu ID sự kiện của nhà cung cấp, cơ chế loại bỏ trùng lặp sẽ dùng một khóa an toàn làm phương án dự phòng (ví dụ: ID dấu vết) để tránh loại bỏ các sự kiện khác nhau.

| Kết quả       | Mục tiêu                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Xanh          | `make ingress-trace`, `make ingress-trace2`, `make ingress-idempotency`, `make ingress-dedupe-fallback`                                     |
| Đỏ (dự kiến) | `make ingress-trace-negative`, `make ingress-trace2-negative`, `make ingress-idempotency-negative`, `make ingress-dedupe-fallback-negative` |

### Thứ tự ưu tiên dmScope trong định tuyến và identityLinks

**Tuyên bố:** thứ tự ưu tiên `dmScope` và các liên kết danh tính hoạt động một cách xác định: phạm vi `main` mặc định chia sẻ một phiên liên tục cho các DM của một chủ sở hữu duy nhất (mặc định của tác nhân cá nhân), trong khi mọi phạm vi cô lập đã cấu hình (`per-peer`, `per-channel-peer`, `per-account-channel-peer`) giữ các phiên DM tách biệt hoàn toàn. Các giá trị ghi đè `dmScope` dành riêng cho từng kênh được ưu tiên hơn các giá trị mặc định toàn cục; `identityLinks` chỉ gộp các phiên trong những nhóm được liên kết rõ ràng, không gộp giữa các đối tác không liên quan. Các hộp thư đến nhiều người dùng được kỳ vọng sẽ chọn một phạm vi cô lập (quy trình kiểm tra bảo mật thời gian chạy khuyến nghị điều này khi phát hiện lưu lượng DM nhiều người dùng).

| Kết quả       | Mục tiêu                                                                  |
| ------------- | ------------------------------------------------------------------------- |
| Xanh          | `make routing-precedence`, `make routing-identitylinks`                   |
| Đỏ (dự kiến) | `make routing-precedence-negative`, `make routing-identitylinks-negative` |

## Liên quan

- [Mô hình mối đe dọa](/vi/security/THREAT-MODEL-ATLAS)
- [Đóng góp cho mô hình mối đe dọa](/vi/security/CONTRIBUTING-THREAT-MODEL)
- [Ứng phó sự cố](/vi/security/incident-response)
