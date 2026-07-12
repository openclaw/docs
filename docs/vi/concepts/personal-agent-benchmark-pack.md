---
read_when:
    - Chạy các kiểm tra độ tin cậy cho tác nhân cá nhân cục bộ
    - Mở rộng danh mục kịch bản QA được lưu trong kho mã nguồn
    - Xác minh lời nhắc, phản hồi, bộ nhớ, biên tập thông tin nhạy cảm, việc tiếp tục sử dụng công cụ an toàn, trạng thái tác vụ, chẩn đoán an toàn để chia sẻ, tuyên bố hoàn thành có bằng chứng và khả năng khôi phục sau lỗi
summary: Các kịch bản qa-channel cục bộ để kiểm tra quy trình làm việc của trợ lý cá nhân bảo vệ quyền riêng tư.
title: Bộ tiêu chuẩn đánh giá tác nhân cá nhân
x-i18n:
    generated_at: "2026-07-12T07:49:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35da45e4b22b1044a777fa8d6bce87f9ace377950dd0af3f2419b40cfe4d9be6
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

Gói Điểm chuẩn Tác nhân Cá nhân là một gói kịch bản QA nhỏ được lưu trong repo dành cho
các quy trình trợ lý cá nhân cục bộ. Đây không phải là điểm chuẩn mô hình dùng chung và
không cần trình chạy mới: gói này tái sử dụng ngăn xếp QA riêng tư ([tổng quan về QA](/vi/concepts/qa-e2e-automation)),
[kênh QA](/vi/channels/qa-channel) tổng hợp và danh mục YAML
`qa/scenarios` hiện có.

## Kịch bản

Mười kịch bản, được định nghĩa trong `qa/scenarios/personal/*.yaml`:

| ID kịch bản                                | Nội dung kiểm tra                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `personal-reminder-roundtrip`              | Lời nhắc cá nhân giả thông qua cơ chế gửi cron cục bộ                                                   |
| `personal-channel-thread-reply`            | Định tuyến tin nhắn trực tiếp giả và phản hồi luồng qua `qa-channel`                                    |
| `personal-memory-preference-recall`        | Truy hồi tùy chọn giả từ các tệp bộ nhớ trong không gian làm việc QA tạm thời                           |
| `personal-redaction-no-secret-leak`        | Kiểm tra không phản hồi lại bí mật giả                                                                  |
| `personal-tool-safety-followthrough`       | Tiếp tục thao tác công cụ an toàn dựa trên thao tác đọc sau một lượt ngắn theo kiểu phê duyệt           |
| `personal-approval-denial-stop`            | Hành vi dừng khi bị từ chối phê duyệt đối với yêu cầu đọc cục bộ nhạy cảm                               |
| `personal-task-followthrough-status`       | Báo cáo trạng thái tác vụ dựa trên bằng chứng, phân biệt rõ đang chờ, bị chặn và đã hoàn tất            |
| `personal-share-safe-diagnostics-artifact` | Hiện vật chẩn đoán an toàn để chia sẻ, giữ lại trạng thái hữu ích nhưng loại bỏ nội dung cá nhân thô    |
| `personal-no-fake-progress`                | Tuyên bố hoàn tất dựa trên bằng chứng, tránh báo cáo tiến độ giả trước khi có bằng chứng cục bộ         |
| `personal-failure-recovery`                | Khôi phục sau lỗi, báo cáo trạng thái một phần và duy trì ranh giới thử lại rõ ràng                     |

Siêu dữ liệu mà máy có thể đọc của gói này (danh sách ID, tiêu đề, mô tả) nằm trong
`extensions/qa-lab/src/scenario-packs.ts` dưới tên `QA_PERSONAL_AGENT_SCENARIO_IDS`.
Chạy gói bằng `--pack personal-agent`:

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` được cộng thêm với các cờ `--scenario` lặp lại. Các kịch bản được chỉ định rõ sẽ chạy
trước, sau đó các kịch bản trong gói chạy theo thứ tự `QA_PERSONAL_AGENT_SCENARIO_IDS`,
đồng thời loại bỏ các mục trùng lặp.

Gói này nhắm đến `qa-channel` với `mock-openai` hoặc một luồng nhà cung cấp QA cục bộ
khác. Không trỏ gói này đến các dịch vụ trò chuyện trực tiếp hoặc tài khoản cá nhân thật.

## Mô hình quyền riêng tư

Các kịch bản chỉ sử dụng người dùng giả, tùy chọn giả, bí mật giả và
không gian làm việc Gateway QA tạm thời do bộ kiểm thử tạo ra. Chúng không được đọc hoặc
ghi vào bộ nhớ người dùng, phiên, thông tin xác thực, tác nhân khởi chạy, cấu hình toàn cục
hoặc trạng thái Gateway đang hoạt động của OpenClaw.

Các hiện vật được lưu trong thư mục hiện vật hiện có của bộ QA và được xử lý
như đầu ra kiểm thử. Các phép kiểm tra biên tập sử dụng dấu hiệu giả để có thể an toàn
kiểm tra lỗi và báo cáo chúng trong các vấn đề.

## Mở rộng gói

Thêm các trường hợp `.yaml` mới trong `qa/scenarios/personal/`, sau đó thêm ID kịch bản
vào `QA_PERSONAL_AGENT_SCENARIO_IDS`. Giữ mỗi trường hợp nhỏ gọn, cục bộ, có tính xác định
trong `mock-openai` và tập trung vào một hành vi của trợ lý cá nhân.

Các ứng viên phù hợp để triển khai tiếp: kiểm tra xuất quỹ đạo đã biên tập, kiểm tra
quy trình Plugin chỉ chạy cục bộ.

Tránh thêm trình chạy, Plugin, phần phụ thuộc, phương thức vận chuyển trực tiếp hoặc trình đánh giá mô hình mới
cho đến khi danh mục kịch bản có đủ trường hợp ổn định để chứng minh sự cần thiết của bề mặt đó.
