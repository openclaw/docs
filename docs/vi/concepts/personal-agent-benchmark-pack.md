---
read_when:
    - Chạy các kiểm tra độ tin cậy của agent cá nhân cục bộ
    - Mở rộng danh mục kịch bản QA dựa trên repo
    - Xác minh nhắc nhở, trả lời, bộ nhớ, biên tập thông tin nhạy cảm, tiếp tục công cụ an toàn, trạng thái tác vụ, chẩn đoán an toàn để chia sẻ, tuyên bố hoàn tất có bằng chứng hỗ trợ, và khôi phục sau lỗi
summary: Các kịch bản qa-channel cục bộ để kiểm tra quy trình làm việc của trợ lý cá nhân bảo vệ quyền riêng tư.
title: Gói benchmark tác tử cá nhân
x-i18n:
    generated_at: "2026-06-27T17:25:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5a6b653abbba0718a6287d4e471435f15ef5823aa62abd238a14d955fdc1e5a
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

Gói benchmark tác nhân cá nhân là một gói kịch bản QA nhỏ, được hậu thuẫn bởi repo, dành cho các quy trình trợ lý cá nhân cục bộ. Đây không phải là benchmark mô hình chung và không yêu cầu một runner mới. Gói này tái sử dụng stack QA riêng tư được mô tả trong [tổng quan QA](/vi/concepts/qa-e2e-automation), [kênh QA](/vi/channels/qa-channel) tổng hợp, và catalog YAML `qa/scenarios` hiện có.

Gói đầu tiên được cố ý giữ phạm vi hẹp:

- nhắc việc cá nhân giả thông qua phân phối cron cục bộ
- định tuyến DM giả và phản hồi luồng giả thông qua `qa-channel`
- truy hồi tùy chọn giả từ các tệp bộ nhớ workspace QA tạm thời
- kiểm tra không lặp lại bí mật giả
- thực thi tiếp công cụ có hậu thuẫn đọc an toàn sau một lượt ngắn kiểu phê duyệt
- hành vi dừng khi từ chối phê duyệt cho một yêu cầu đọc cục bộ nhạy cảm
- báo cáo trạng thái tác vụ có hậu thuẫn bằng bằng chứng, giữ riêng các trạng thái đang chờ, bị chặn và hoàn tất
- artifact chẩn đoán an toàn để chia sẻ, giữ trạng thái hữu ích trong khi bỏ qua nội dung cá nhân thô
- tuyên bố hoàn thành có hậu thuẫn bằng bằng chứng, tránh tiến độ giả trước khi có bằng chứng cục bộ
- khôi phục sau lỗi, báo cáo trạng thái một phần và giữ ranh giới thử lại rõ ràng

## Kịch bản

Metadata gói có thể đọc bằng máy nằm trong
`extensions/qa-lab/src/scenario-packs.ts`. Chạy gói bằng
`--pack personal-agent`:

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` có tính cộng dồn với các cờ `--scenario` lặp lại. Các kịch bản tường minh chạy trước, sau đó các kịch bản của gói chạy theo thứ tự `QA_PERSONAL_AGENT_SCENARIO_IDS` với các mục trùng lặp đã được loại bỏ.

Gói này được thiết kế cho `qa-channel` với `mock-openai` hoặc một lane nhà cung cấp QA cục bộ khác. Không nên trỏ nó tới các dịch vụ chat trực tiếp hoặc tài khoản cá nhân thật.

## Mô Hình Quyền Riêng Tư

Các kịch bản chỉ dùng người dùng giả, tùy chọn giả, bí mật giả và workspace Gateway QA tạm thời do bộ kiểm thử tạo ra. Chúng không được đọc hoặc ghi bộ nhớ người dùng OpenClaw thật, phiên, thông tin xác thực, launch agent, cấu hình toàn cục, hoặc trạng thái Gateway trực tiếp.

Artifact nằm trong thư mục artifact bộ QA hiện có và nên được xử lý như đầu ra kiểm thử. Các kiểm tra biên tập dùng marker giả nên lỗi vẫn an toàn để kiểm tra và ghi vào issue.

## Mở Rộng Gói

Thêm các trường hợp `.yaml` mới dưới `qa/scenarios/personal/`, rồi thêm id kịch bản vào `QA_PERSONAL_AGENT_SCENARIO_IDS`. Giữ mỗi trường hợp nhỏ, cục bộ, xác định được trong `mock-openai`, và tập trung vào một hành vi trợ lý cá nhân.

Các ứng viên tiếp theo phù hợp:

- kiểm tra xuất quỹ đạo đã biên tập
- kiểm tra quy trình Plugin chỉ cục bộ

Tránh thêm runner, Plugin, phụ thuộc, transport trực tiếp, hoặc bộ chấm mô hình mới cho đến khi catalog kịch bản có đủ trường hợp ổn định để biện minh cho bề mặt đó.
