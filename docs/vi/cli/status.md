---
read_when:
    - Bạn muốn chẩn đoán nhanh tình trạng kênh + người nhận phiên gần đây
    - Bạn muốn trạng thái "all" có thể dán được để gỡ lỗi
summary: Tài liệu tham chiếu CLI cho `openclaw status` (chẩn đoán, phép thăm dò, ảnh chụp nhanh mức sử dụng)
title: openclaw status
x-i18n:
    generated_at: "2026-05-06T09:06:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1929db64f09e9494736f09d0d9c1ae1fb72d7308a7124e616e8247ff32aa3185
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
- `openclaw status` thông thường vẫn dùng đường dẫn chỉ đọc nhanh và đánh dấu bộ nhớ là `not checked` thay vì không khả dụng khi bỏ qua kiểm tra bộ nhớ. Kiểm tra bảo mật nặng, tương thích Plugin và thăm dò vector bộ nhớ được dành cho `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` và `openclaw memory status --deep`.
- `status --json --all` báo cáo chi tiết bộ nhớ từ runtime Plugin bộ nhớ đang hoạt động được chọn bởi `plugins.slots.memory`. Các Plugin bộ nhớ tùy chỉnh có thể để `agents.defaults.memorySearch.enabled` tích hợp sẵn ở trạng thái tắt mà vẫn báo cáo trạng thái tệp, chunk, vector và FTS của riêng chúng.
- `--usage` in các cửa sổ mức dùng nhà cung cấp đã chuẩn hóa dưới dạng `X% left`.
- Đầu ra trạng thái phiên tách `Execution:` khỏi `Runtime:`. `Execution` là đường dẫn sandbox (`direct`, `docker/*`), còn `Runtime` cho biết phiên đang dùng `OpenClaw Pi Default`, `OpenAI Codex`, một backend CLI hoặc một backend ACP như `codex (acp/acpx)`. Xem [runtime tác nhân](/vi/concepts/agent-runtimes) để biết sự khác biệt giữa nhà cung cấp/mô hình/runtime.
- Các trường thô `usage_percent` / `usagePercent` của MiniMax là hạn mức còn lại, nên OpenClaw đảo ngược chúng trước khi hiển thị; các trường dựa trên số đếm được ưu tiên khi có. Phản hồi `model_remains` ưu tiên mục mô hình chat, suy ra nhãn cửa sổ từ dấu thời gian khi cần, và bao gồm tên mô hình trong nhãn gói.
- Khi ảnh chụp nhanh phiên hiện tại thưa thông tin, `/status` có thể điền bù bộ đếm token và cache từ nhật ký mức dùng bản ghi phiên gần nhất. Các giá trị trực tiếp khác không hiện có vẫn được ưu tiên hơn giá trị dự phòng từ bản ghi phiên.
- `/status` bao gồm thời gian hoạt động ngắn gọn của tiến trình Gateway và thời gian hoạt động của hệ thống máy chủ.
- Dự phòng bản ghi phiên cũng có thể khôi phục nhãn mô hình runtime đang hoạt động khi mục phiên trực tiếp bị thiếu nhãn đó. Nếu mô hình trong bản ghi phiên đó khác với mô hình đã chọn, trạng thái sẽ phân giải cửa sổ ngữ cảnh theo mô hình runtime được khôi phục thay vì mô hình đã chọn.
- Đối với tính toán kích thước prompt, dự phòng bản ghi phiên ưu tiên tổng lớn hơn theo hướng prompt khi siêu dữ liệu phiên bị thiếu hoặc nhỏ hơn, để các phiên nhà cung cấp tùy chỉnh không bị thu gọn thành hiển thị `0` token.
- Đầu ra bao gồm kho phiên theo từng tác nhân khi nhiều tác nhân được cấu hình.
- Tổng quan bao gồm trạng thái cài đặt/runtime của Gateway + dịch vụ máy chủ Node khi có.
- Tổng quan bao gồm kênh cập nhật + SHA git (đối với checkout từ mã nguồn).
- Thông tin cập nhật xuất hiện trong Tổng quan; nếu có bản cập nhật, trạng thái in gợi ý chạy `openclaw update` (xem [Cập nhật](/vi/install/updating)).
- Các bề mặt trạng thái chỉ đọc (`status`, `status --json`, `status --all`) phân giải SecretRefs được hỗ trợ cho các đường dẫn cấu hình mục tiêu của chúng khi có thể.
- Nếu một SecretRef kênh được hỗ trợ đã được cấu hình nhưng không khả dụng trong đường dẫn lệnh hiện tại, trạng thái vẫn chỉ đọc và báo cáo đầu ra suy giảm thay vì bị lỗi. Đầu ra cho người dùng hiển thị cảnh báo như "token đã cấu hình không khả dụng trong đường dẫn lệnh này", và đầu ra JSON bao gồm `secretDiagnostics`.
- Khi phân giải SecretRef cục bộ theo lệnh thành công, trạng thái ưu tiên ảnh chụp nhanh đã phân giải và xóa các dấu hiệu kênh tạm thời "secret không khả dụng" khỏi đầu ra cuối cùng.
- `status --all` bao gồm một hàng tổng quan Secrets và một phần chẩn đoán tóm tắt chẩn đoán secret (được cắt ngắn để dễ đọc) mà không dừng quá trình tạo báo cáo.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Doctor](/vi/gateway/doctor)
