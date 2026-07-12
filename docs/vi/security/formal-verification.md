---
permalink: /security/formal-verification/
read_when:
    - Rà soát các đảm bảo hoặc giới hạn của mô hình bảo mật chính thức
    - Tái hiện hoặc cập nhật các kiểm tra mô hình bảo mật TLA+/TLC
summary: Các mô hình bảo mật được kiểm chứng bằng máy cho những luồng có rủi ro cao nhất của OpenClaw.
title: Xác minh hình thức (mô hình bảo mật)
x-i18n:
    generated_at: "2026-07-12T08:22:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86342f6e2f54c08d5e0f8a08d0d488459650a6ace35e985ff886f847540202c9
    source_path: security/formal-verification.md
    workflow: 16
---

Các mô hình bảo mật hình thức của OpenClaw (hiện sử dụng TLA+/TLC) cung cấp một lập luận được máy kiểm chứng rằng các luồng có rủi ro cao nhất cụ thể — ủy quyền, cô lập phiên, kiểm soát công cụ và an toàn trước cấu hình sai — thực thi chính sách dự kiến theo các giả định được nêu rõ.

> Lưu ý: một số liên kết cũ có thể đề cập đến tên trước đây của dự án.

## Nội dung này là gì

Một bộ kiểm thử hồi quy bảo mật có thể thực thi, được định hướng theo góc nhìn của kẻ tấn công:

- Mỗi tuyên bố đều có một phép kiểm tra mô hình có thể chạy trên một không gian trạng thái hữu hạn.
- Nhiều tuyên bố có một mô hình âm đi kèm, tạo ra vết phản ví dụ cho một lớp lỗi thực tế.

Đây **không** phải là bằng chứng cho thấy OpenClaw an toàn về mọi mặt và cũng không xác minh toàn bộ phần triển khai TypeScript.

## Vị trí của các mô hình

Các mô hình được duy trì trong một kho lưu trữ riêng: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

<Note>
Kho lưu trữ đó hiện không thể truy cập được (tại thời điểm viết, GitHub trả về "Repository not found"). Nếu bạn vẫn gặp lỗi này, hãy hỏi trong các kênh dành cho người bảo trì OpenClaw để biết vị trí hiện tại trước khi cho rằng các mô hình đã bị xóa.
</Note>

## Điểm cần lưu ý

- Đây là các mô hình, không phải toàn bộ phần triển khai TypeScript — mô hình và mã có thể sai lệch so với nhau.
- Kết quả bị giới hạn bởi không gian trạng thái mà TLC khám phá. Kết quả đạt không đồng nghĩa với tính bảo mật vượt quá các giả định và giới hạn đã được mô hình hóa.
- Một số tuyên bố dựa trên các giả định rõ ràng về môi trường (ví dụ: triển khai đúng và đầu vào cấu hình chính xác).

## Tái tạo kết quả

Sao chép kho lưu trữ mô hình và chạy TLC:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Yêu cầu Java 11+ (TLC chạy trên JVM).
# Kho lưu trữ cung cấp tla2tools.jar được cố định phiên bản, bin/tlc và các đích Make.

make <target>
```

Hiện chưa có tích hợp CI trở lại kho lưu trữ này; một phiên bản trong tương lai có thể bổ sung các mô hình chạy bằng CI kèm theo các sản phẩm công khai (vết phản ví dụ, nhật ký chạy) hoặc một quy trình được lưu trữ để "chạy mô hình này" cho các phép kiểm tra nhỏ có giới hạn.

## Các tuyên bố và đích

### Mức độ phơi bày của Gateway và cấu hình sai khiến Gateway mở

**Tuyên bố:** theo các giả định của mô hình, việc liên kết ra ngoài local loopback mà không có xác thực có thể khiến việc xâm nhập từ xa trở nên khả thi và làm tăng mức độ phơi bày; token/mật khẩu sẽ chặn những kẻ tấn công chưa được xác thực.

| Kết quả       | Đích                                                             |
| ------------- | ---------------------------------------------------------------- |
| Đạt           | `make gateway-exposure-v2`, `make gateway-exposure-v2-protected` |
| Không đạt (dự kiến) | `make gateway-exposure-v2-negative`                        |

Xem thêm `docs/gateway-exposure-matrix.md` trong kho lưu trữ mô hình.

### Quy trình thực thi của Node (khả năng có rủi ro cao nhất)

**Tuyên bố:** trong mô hình, `exec host=node` yêu cầu (a) danh sách cho phép lệnh của Node cùng các lệnh đã khai báo và (b) phê duyệt trực tiếp khi được cấu hình; các phê duyệt được gắn token để ngăn phát lại.

| Kết quả       | Đích                                                            |
| ------------- | --------------------------------------------------------------- |
| Đạt           | `make nodes-pipeline`, `make approvals-token`                   |
| Không đạt (dự kiến) | `make nodes-pipeline-negative`, `make approvals-token-negative` |

### Kho ghép nối (kiểm soát tin nhắn trực tiếp)

**Tuyên bố:** các yêu cầu ghép nối tuân thủ TTL và giới hạn số yêu cầu đang chờ xử lý.

| Kết quả       | Đích                                                 |
| ------------- | ---------------------------------------------------- |
| Đạt           | `make pairing`, `make pairing-cap`                   |
| Không đạt (dự kiến) | `make pairing-negative`, `make pairing-cap-negative` |

### Kiểm soát đầu vào (lượt đề cập và hành vi bỏ qua bằng lệnh điều khiển)

**Tuyên bố:** trong ngữ cảnh nhóm yêu cầu lượt đề cập, một lệnh điều khiển không được ủy quyền không thể bỏ qua cơ chế kiểm soát lượt đề cập.

| Kết quả       | Đích                           |
| ------------- | ------------------------------ |
| Đạt           | `make ingress-gating`          |
| Không đạt (dự kiến) | `make ingress-gating-negative` |

### Định tuyến và cô lập khóa phiên

**Tuyên bố:** tin nhắn trực tiếp từ các đối tác khác nhau không bị gộp vào cùng một phiên, trừ khi được liên kết hoặc cấu hình rõ ràng.

| Kết quả       | Đích                              |
| ------------- | --------------------------------- |
| Đạt           | `make routing-isolation`          |
| Không đạt (dự kiến) | `make routing-isolation-negative` |

## Các mô hình v1++: tính đồng thời, thử lại và tính chính xác của vết

Các mô hình tiếp nối giúp nâng cao độ sát thực đối với những chế độ lỗi trong thực tế: cập nhật không nguyên tử, thử lại và phân phối một tin nhắn thành nhiều nhánh.

### Tính đồng thời và tính lũy đẳng của kho ghép nối

**Tuyên bố:** kho ghép nối thực thi `MaxPending` và tính lũy đẳng ngay cả khi các thao tác xen kẽ — thao tác kiểm tra rồi ghi phải mang tính nguyên tử/được khóa và thao tác làm mới không được tạo bản trùng lặp. Cụ thể: các yêu cầu đồng thời không thể vượt quá `MaxPending` đối với một kênh và các yêu cầu/lần làm mới lặp lại cho cùng một `(channel, sender)` không tạo ra các hàng đang chờ còn hiệu lực bị trùng lặp.

| Kết quả       | Đích                                                                                                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Đạt           | `make pairing-race` (kiểm tra giới hạn nguyên tử/được khóa), `make pairing-idempotency`, `make pairing-refresh`, `make pairing-refresh-race`                                |
| Không đạt (dự kiến) | `make pairing-race-negative` (tranh chấp giới hạn begin/commit không nguyên tử), `make pairing-idempotency-negative`, `make pairing-refresh-negative`, `make pairing-refresh-race-negative` |

### Tương quan vết và tính lũy đẳng của đầu vào

**Tuyên bố:** quá trình tiếp nhận duy trì tương quan vết khi phân phối thành nhiều nhánh và có tính lũy đẳng khi nhà cung cấp thử lại. Khi một sự kiện bên ngoài trở thành nhiều tin nhắn nội bộ, mọi phần đều giữ nguyên định danh vết/sự kiện; việc thử lại không khiến sự kiện bị xử lý hai lần; nếu thiếu ID sự kiện của nhà cung cấp, cơ chế loại bỏ trùng lặp sẽ dự phòng bằng một khóa an toàn (ví dụ: ID vết) để tránh loại bỏ các sự kiện khác biệt.

| Kết quả       | Đích                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Đạt           | `make ingress-trace`, `make ingress-trace2`, `make ingress-idempotency`, `make ingress-dedupe-fallback`                                     |
| Không đạt (dự kiến) | `make ingress-trace-negative`, `make ingress-trace2-negative`, `make ingress-idempotency-negative`, `make ingress-dedupe-fallback-negative` |

### Thứ tự ưu tiên của `dmScope` trong định tuyến và `identityLinks`

**Tuyên bố:** theo mặc định, định tuyến giữ các phiên tin nhắn trực tiếp tách biệt và chỉ gộp các phiên khi được cấu hình rõ ràng, thông qua thứ tự ưu tiên theo kênh và các liên kết danh tính. `dmScope` dành riêng cho từng kênh sẽ được ưu tiên hơn các giá trị mặc định toàn cục; `identityLinks` chỉ gộp các phiên trong những nhóm được liên kết rõ ràng, không gộp giữa các đối tác không liên quan.

| Kết quả       | Đích                                                                      |
| ------------- | ------------------------------------------------------------------------- |
| Đạt           | `make routing-precedence`, `make routing-identitylinks`                   |
| Không đạt (dự kiến) | `make routing-precedence-negative`, `make routing-identitylinks-negative` |

## Liên quan

- [Mô hình mối đe dọa](/vi/security/THREAT-MODEL-ATLAS)
- [Đóng góp cho mô hình mối đe dọa](/vi/security/CONTRIBUTING-THREAT-MODEL)
- [Ứng phó sự cố](/vi/security/incident-response)
