---
read_when:
    - Bạn muốn chẩn đoán nhanh về tình trạng hoạt động của kênh + người nhận phiên gần đây
    - Bạn muốn một trạng thái "all" có thể dán được để gỡ lỗi
summary: Tài liệu tham khảo CLI cho `openclaw status` (chẩn đoán, thăm dò, ảnh chụp nhanh mức sử dụng)
title: openclaw status
x-i18n:
    generated_at: "2026-05-11T20:26:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c887878a62c88ebdd81947a23ae4d3ea1f78b1654175b65469ccc4cba2ecdff
    source_path: cli/status.md
    workflow: 16
---

Chẩn đoán cho kênh + phiên.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Ghi chú:

- `--deep` chạy các phép thăm dò trực tiếp (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `openclaw status` thông thường giữ nguyên đường dẫn chỉ đọc nhanh và đánh dấu bộ nhớ là `not checked` thay vì không khả dụng khi bỏ qua bước kiểm tra bộ nhớ. Kiểm toán bảo mật nặng, khả năng tương thích Plugin và các phép thăm dò vector bộ nhớ được dành cho `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` và `openclaw memory status --deep`.
- `status --json --all` báo cáo chi tiết bộ nhớ từ runtime Plugin bộ nhớ đang hoạt động được chọn bởi `plugins.slots.memory`. Plugin bộ nhớ tùy chỉnh có thể để `agents.defaults.memorySearch.enabled` tích hợp sẵn ở trạng thái tắt mà vẫn báo cáo tệp, đoạn, vector và trạng thái FTS của riêng chúng.
- `--usage` in các cửa sổ sử dụng nhà cung cấp đã chuẩn hóa dưới dạng `X% left`.
- Đầu ra trạng thái phiên tách `Execution:` khỏi `Runtime:`. `Execution` là đường dẫn sandbox (`direct`, `docker/*`), còn `Runtime` cho biết phiên đang dùng `OpenClaw Pi Default`, `OpenAI Codex`, một backend CLI, hoặc một backend ACP như `codex (acp/acpx)`. Xem [runtime tác nhân](/vi/concepts/agent-runtimes) để biết sự phân biệt giữa nhà cung cấp/mô hình/runtime.
- Các trường `usage_percent` / `usagePercent` thô của MiniMax là hạn mức còn lại, nên OpenClaw đảo ngược chúng trước khi hiển thị; các trường dựa trên số đếm được ưu tiên khi có. Phản hồi `model_remains` ưu tiên mục mô hình trò chuyện, suy ra nhãn cửa sổ từ dấu thời gian khi cần và đưa tên mô hình vào nhãn gói.
- Khi ảnh chụp nhanh phiên hiện tại thưa thớt, `/status` có thể điền bù các bộ đếm token và bộ nhớ đệm từ nhật ký sử dụng bản ghi gần nhất. Các giá trị trực tiếp khác không hiện có vẫn được ưu tiên hơn giá trị dự phòng từ bản ghi.
- `/status` bao gồm thời gian hoạt động quy trình Gateway và thời gian hoạt động hệ thống máy chủ ở dạng gọn.
- Dự phòng bản ghi cũng có thể khôi phục nhãn mô hình runtime đang hoạt động khi mục phiên trực tiếp bị thiếu nhãn đó. Nếu mô hình bản ghi đó khác với mô hình đã chọn, status sẽ phân giải cửa sổ ngữ cảnh theo mô hình runtime đã khôi phục thay vì mô hình đã chọn.
- Với việc tính kích thước prompt, dự phòng bản ghi ưu tiên tổng lớn hơn theo hướng prompt khi siêu dữ liệu phiên bị thiếu hoặc nhỏ hơn, để các phiên nhà cung cấp tùy chỉnh không bị thu gọn thành hiển thị token `0`.
- Đầu ra bao gồm kho phiên theo từng tác nhân khi cấu hình nhiều tác nhân.
- Tổng quan bao gồm trạng thái cài đặt/runtime của Gateway + dịch vụ máy chủ Node khi có.
- Tổng quan bao gồm kênh cập nhật + SHA git (cho các checkout từ nguồn).
- Thông tin cập nhật xuất hiện trong phần Tổng quan; nếu có bản cập nhật, status in gợi ý chạy `openclaw update` (xem [Cập nhật](/vi/install/updating)).
- Lỗi làm mới giá mô hình được hiển thị dưới dạng cảnh báo giá tùy chọn. Chúng không có nghĩa là Gateway hoặc các kênh không lành mạnh.
- Các bề mặt trạng thái chỉ đọc (`status`, `status --json`, `status --all`) phân giải SecretRef được hỗ trợ cho các đường dẫn cấu hình mục tiêu của chúng khi có thể.
- Nếu một SecretRef kênh được hỗ trợ đã được cấu hình nhưng không khả dụng trong đường dẫn lệnh hiện tại, status vẫn chỉ đọc và báo cáo đầu ra suy giảm thay vì bị lỗi. Đầu ra cho người dùng hiển thị cảnh báo như "token đã cấu hình không khả dụng trong đường dẫn lệnh này", và đầu ra JSON bao gồm `secretDiagnostics`.
- Khi phân giải SecretRef cục bộ theo lệnh thành công, status ưu tiên ảnh chụp nhanh đã phân giải và xóa các dấu hiệu kênh "secret không khả dụng" tạm thời khỏi đầu ra cuối cùng.
- `status --all` bao gồm một hàng tổng quan về Secrets và một phần chẩn đoán tóm tắt chẩn đoán secret (được rút gọn để dễ đọc) mà không dừng việc tạo báo cáo.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Doctor](/vi/gateway/doctor)
