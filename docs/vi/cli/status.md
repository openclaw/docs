---
read_when:
    - Bạn muốn chẩn đoán nhanh về tình trạng kênh và những người nhận trong các phiên gần đây
    - Bạn muốn một trạng thái “tất cả” có thể dán được để gỡ lỗi
summary: Tài liệu tham khảo CLI cho `openclaw status` (chẩn đoán, thăm dò, ảnh chụp nhanh mức sử dụng)
title: Trạng thái
x-i18n:
    generated_at: "2026-04-29T22:34:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: a85613e1830dc24253847e6517d3e155c175bb39ff6b01031ac5cb4291e276fa
    source_path: cli/status.md
    workflow: 16
---

# `openclaw status`

Chẩn đoán cho kênh + phiên.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Ghi chú:

- `--deep` chạy các kiểm tra trực tiếp (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `openclaw status` thông thường đi theo luồng chỉ đọc nhanh và đánh dấu bộ nhớ là `not checked` thay vì không khả dụng khi bỏ qua việc kiểm tra bộ nhớ. Kiểm tra bảo mật nặng, khả năng tương thích Plugin và kiểm tra vector bộ nhớ được dành cho `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` và `openclaw memory status --deep`.
- `status --json --all` báo cáo chi tiết bộ nhớ từ runtime Plugin bộ nhớ đang hoạt động được chọn bởi `plugins.slots.memory`. Plugin bộ nhớ tùy chỉnh có thể để `agents.defaults.memorySearch.enabled` tích hợp sẵn ở trạng thái tắt mà vẫn báo cáo tệp, chunk, vector và trạng thái FTS riêng của chúng.
- `--usage` in các cửa sổ mức sử dụng nhà cung cấp đã chuẩn hóa dưới dạng `X% left`.
- Đầu ra trạng thái phiên tách `Execution:` khỏi `Runtime:`. `Execution` là đường dẫn sandbox (`direct`, `docker/*`), còn `Runtime` cho bạn biết phiên đang dùng `OpenClaw Pi Default`, `OpenAI Codex`, một backend CLI, hoặc một backend ACP như `codex (acp/acpx)`. Xem [Runtime tác tử](/vi/concepts/agent-runtimes) để biết sự phân biệt giữa nhà cung cấp/mô hình/runtime.
- Các trường thô `usage_percent` / `usagePercent` của MiniMax là hạn mức còn lại, nên OpenClaw đảo chúng trước khi hiển thị; các trường dựa trên số lượng được ưu tiên khi có. Phản hồi `model_remains` ưu tiên mục mô hình chat, suy ra nhãn cửa sổ từ dấu thời gian khi cần, và đưa tên mô hình vào nhãn gói.
- Khi snapshot phiên hiện tại thưa dữ liệu, `/status` có thể điền bù bộ đếm token và cache từ nhật ký mức sử dụng transcript gần nhất. Các giá trị trực tiếp khác 0 hiện có vẫn được ưu tiên hơn giá trị dự phòng từ transcript.
- Dự phòng transcript cũng có thể khôi phục nhãn mô hình runtime đang hoạt động khi mục phiên trực tiếp thiếu nhãn đó. Nếu mô hình transcript đó khác với mô hình đã chọn, status phân giải cửa sổ ngữ cảnh theo mô hình runtime đã khôi phục thay vì mô hình đã chọn.
- Đối với việc tính kích thước prompt, dự phòng transcript ưu tiên tổng lớn hơn theo hướng prompt khi metadata phiên bị thiếu hoặc nhỏ hơn, để các phiên nhà cung cấp tùy chỉnh không bị rút gọn thành hiển thị token `0`.
- Đầu ra bao gồm kho phiên theo từng tác tử khi cấu hình nhiều tác tử.
- Tổng quan bao gồm trạng thái cài đặt/runtime của Gateway + dịch vụ máy chủ node khi có.
- Tổng quan bao gồm kênh cập nhật + SHA git (đối với checkout từ mã nguồn).
- Thông tin cập nhật xuất hiện trong phần Tổng quan; nếu có bản cập nhật, status in gợi ý chạy `openclaw update` (xem [Cập nhật](/vi/install/updating)).
- Các bề mặt trạng thái chỉ đọc (`status`, `status --json`, `status --all`) phân giải SecretRef được hỗ trợ cho các đường dẫn cấu hình đích khi có thể.
- Nếu một SecretRef kênh được hỗ trợ đã được cấu hình nhưng không khả dụng trong đường dẫn lệnh hiện tại, status vẫn chỉ đọc và báo cáo đầu ra bị suy giảm thay vì bị lỗi. Đầu ra cho người dùng hiển thị cảnh báo như “token đã cấu hình không khả dụng trong đường dẫn lệnh này”, và đầu ra JSON bao gồm `secretDiagnostics`.
- Khi phân giải SecretRef cục bộ của lệnh thành công, status ưu tiên snapshot đã phân giải và xóa các dấu hiệu kênh tạm thời “secret unavailable” khỏi đầu ra cuối cùng.
- `status --all` bao gồm một hàng tổng quan Secrets và một phần chẩn đoán tóm tắt chẩn đoán secret (được rút gọn để dễ đọc) mà không dừng việc tạo báo cáo.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Doctor](/vi/gateway/doctor)
