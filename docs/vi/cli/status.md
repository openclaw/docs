---
read_when:
    - Bạn muốn chẩn đoán nhanh về tình trạng hoạt động của kênh + người nhận phiên gần đây
    - Bạn muốn một trạng thái "all" có thể dán được để gỡ lỗi
summary: Tham chiếu CLI cho `openclaw status` (chẩn đoán, thăm dò, ảnh chụp nhanh mức sử dụng)
title: openclaw status
x-i18n:
    generated_at: "2026-06-27T17:20:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aeb9e99b2aa9eb12fe97c8ee018ac6a5227cad990d151c3579d16009c5b9258a
    source_path: cli/status.md
    workflow: 16
---

Chẩn đoán cho các kênh + phiên.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Ghi chú:

- `--deep` chạy các phép thăm dò trực tiếp (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `openclaw status` thông thường vẫn ở đường dẫn chỉ đọc nhanh và đánh dấu bộ nhớ là `not checked` thay vì không khả dụng khi bỏ qua kiểm tra bộ nhớ. Kiểm tra bảo mật nặng, khả năng tương thích plugin và các phép thăm dò vector bộ nhớ được để cho `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` và `openclaw memory status --deep`.
- `status --json --all` báo cáo chi tiết bộ nhớ từ runtime plugin bộ nhớ đang hoạt động được chọn bởi `plugins.slots.memory`. Plugin bộ nhớ tùy chỉnh có thể để `agents.defaults.memorySearch.enabled` tích hợp sẵn bị tắt và vẫn báo cáo tệp, đoạn, vector và trạng thái FTS của riêng chúng.
- `--usage` in các cửa sổ mức dùng provider đã chuẩn hóa dưới dạng `X% left`.
- Đầu ra trạng thái phiên tách `Execution:` khỏi `Runtime:`. `Execution` là đường dẫn sandbox (`direct`, `docker/*`), còn `Runtime` cho biết phiên đang dùng `OpenClaw Default`, `OpenAI Codex`, một backend CLI, hoặc một backend ACP như `codex (acp/acpx)`. Xem [Runtime tác nhân](/vi/concepts/agent-runtimes) để biết sự khác biệt giữa provider/model/runtime.
- Các trường thô `usage_percent` / `usagePercent` của MiniMax là hạn mức còn lại, nên OpenClaw đảo ngược chúng trước khi hiển thị; các trường dựa trên số đếm sẽ được ưu tiên khi có. Phản hồi `model_remains` ưu tiên mục model trò chuyện, suy ra nhãn cửa sổ từ dấu thời gian khi cần, và đưa tên model vào nhãn gói.
- Khi ảnh chụp phiên hiện tại thưa dữ liệu, `/status` có thể điền bù bộ đếm token và cache từ nhật ký mức dùng transcript gần nhất. Các giá trị trực tiếp khác 0 hiện có vẫn được ưu tiên hơn giá trị dự phòng từ transcript.
- `/status` bao gồm thời gian hoạt động ngắn gọn của tiến trình Gateway và thời gian hoạt động của hệ thống máy chủ.
- Dự phòng transcript cũng có thể khôi phục nhãn model runtime đang hoạt động khi mục phiên trực tiếp bị thiếu nhãn đó. Nếu model trong transcript đó khác với model đã chọn, status phân giải cửa sổ ngữ cảnh theo model runtime đã khôi phục thay vì model đã chọn.
- Khi một phiên được ghim vào model khác với model chính đã cấu hình, status in cả hai giá trị, lý do (`session override`) và gợi ý rõ ràng (`/model default`). Model chính đã cấu hình áp dụng cho các phiên mới hoặc chưa ghim; các phiên đã ghim hiện có giữ lựa chọn phiên của chúng cho đến khi được xóa.
- Đối với kế toán kích thước prompt, dự phòng transcript ưu tiên tổng lớn hơn theo hướng prompt khi metadata phiên bị thiếu hoặc nhỏ hơn, để các phiên provider tùy chỉnh không bị sụp về hiển thị token `0`.
- Đầu ra bao gồm các kho phiên theo từng tác nhân khi cấu hình nhiều tác nhân.
- Tổng quan bao gồm trạng thái cài đặt/runtime của dịch vụ Gateway + máy chủ node khi có.
- Tổng quan bao gồm kênh cập nhật + SHA git (đối với checkout từ mã nguồn).
- Thông tin cập nhật xuất hiện trong Tổng quan; nếu có bản cập nhật, status in gợi ý chạy `openclaw update` (xem [Cập nhật](/vi/install/updating)).
- Lỗi làm mới giá model được hiển thị dưới dạng cảnh báo giá tùy chọn. Chúng không có nghĩa là Gateway hoặc các kênh không khỏe mạnh.
- Các bề mặt trạng thái chỉ đọc (`status`, `status --json`, `status --all`) phân giải các SecretRefs được hỗ trợ cho các đường dẫn cấu hình mục tiêu khi có thể.
- Nếu một SecretRef kênh được hỗ trợ đã được cấu hình nhưng không khả dụng trong đường dẫn lệnh hiện tại, status vẫn chỉ đọc và báo cáo đầu ra bị suy giảm thay vì bị lỗi. Đầu ra cho người đọc hiển thị cảnh báo như "token đã cấu hình không khả dụng trong đường dẫn lệnh này", và đầu ra JSON bao gồm `secretDiagnostics`.
- Khi phân giải SecretRef cục bộ theo lệnh thành công, status ưu tiên ảnh chụp đã phân giải và xóa các dấu hiệu kênh "secret không khả dụng" tạm thời khỏi đầu ra cuối cùng.
- `status --all` bao gồm một hàng tổng quan Secrets và một phần chẩn đoán tóm tắt chẩn đoán secret (được cắt ngắn để dễ đọc) mà không dừng quá trình tạo báo cáo.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Doctor](/vi/gateway/doctor)
