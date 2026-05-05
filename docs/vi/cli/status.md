---
read_when:
    - Bạn muốn chẩn đoán nhanh về tình trạng kênh + người nhận phiên gần đây
    - Bạn muốn một trạng thái “tất cả” có thể dán được để gỡ lỗi
summary: Tham chiếu CLI cho `openclaw status` (chẩn đoán, thăm dò, ảnh chụp nhanh mức sử dụng)
title: Trạng thái
x-i18n:
    generated_at: "2026-05-05T06:16:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5025ed99d351a43adc60b6896349366b225fd7ecb8ab422dba376f2d157f0033
    source_path: cli/status.md
    workflow: 16
---

# `openclaw status`

Chẩn đoán cho các kênh + phiên.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Ghi chú:

- `--deep` chạy các phép thăm dò trực tiếp (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `openclaw status` thuần túy vẫn đi theo đường dẫn chỉ đọc nhanh và đánh dấu bộ nhớ là `not checked` thay vì không khả dụng khi bỏ qua kiểm tra bộ nhớ. Kiểm tra bảo mật nặng, tương thích plugin và thăm dò memory-vector được để cho `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` và `openclaw memory status --deep`.
- `status --json --all` báo cáo chi tiết bộ nhớ từ runtime plugin bộ nhớ đang hoạt động được chọn bởi `plugins.slots.memory`. Plugin bộ nhớ tùy chỉnh có thể để `agents.defaults.memorySearch.enabled` tích hợp sẵn ở trạng thái tắt mà vẫn báo cáo các tệp, chunk, vector và trạng thái FTS của riêng chúng.
- `--usage` in các cửa sổ sử dụng nhà cung cấp đã chuẩn hóa dưới dạng `X% left`.
- Đầu ra trạng thái phiên tách `Execution:` khỏi `Runtime:`. `Execution` là đường dẫn sandbox (`direct`, `docker/*`), còn `Runtime` cho biết phiên đang dùng `OpenClaw Pi Default`, `OpenAI Codex`, một backend CLI, hoặc một backend ACP như `codex (acp/acpx)`. Xem [Runtime tác tử](/vi/concepts/agent-runtimes) để phân biệt nhà cung cấp/mô hình/runtime.
- Các trường thô `usage_percent` / `usagePercent` của MiniMax là hạn mức còn lại, nên OpenClaw đảo ngược chúng trước khi hiển thị; các trường dựa trên số đếm được ưu tiên khi có mặt. Phản hồi `model_remains` ưu tiên mục mô hình chat, suy ra nhãn cửa sổ từ dấu thời gian khi cần, và đưa tên mô hình vào nhãn gói.
- Khi ảnh chụp nhanh phiên hiện tại thưa dữ liệu, `/status` có thể điền bù bộ đếm token và cache từ nhật ký sử dụng transcript gần nhất. Các giá trị trực tiếp khác không hiện có vẫn được ưu tiên hơn giá trị dự phòng từ transcript.
- `/status` bao gồm thời gian hoạt động quy trình Gateway và thời gian hoạt động hệ thống máy chủ ở dạng gọn.
- Dự phòng transcript cũng có thể khôi phục nhãn mô hình runtime đang hoạt động khi mục phiên trực tiếp thiếu nhãn đó. Nếu mô hình transcript đó khác với mô hình đã chọn, trạng thái phân giải cửa sổ ngữ cảnh theo mô hình runtime đã khôi phục thay vì mô hình đã chọn.
- Đối với hạch toán kích thước prompt, dự phòng transcript ưu tiên tổng lớn hơn theo hướng prompt khi siêu dữ liệu phiên bị thiếu hoặc nhỏ hơn, để các phiên nhà cung cấp tùy chỉnh không bị thu gọn thành hiển thị `0` token.
- Đầu ra bao gồm kho phiên theo từng tác tử khi cấu hình nhiều tác tử.
- Tổng quan bao gồm trạng thái cài đặt/runtime của Gateway + dịch vụ máy chủ node khi có sẵn.
- Tổng quan bao gồm kênh cập nhật + SHA git (đối với bản checkout từ mã nguồn).
- Thông tin cập nhật hiển thị trong phần Tổng quan; nếu có bản cập nhật, trạng thái in gợi ý chạy `openclaw update` (xem [Cập nhật](/vi/install/updating)).
- Các bề mặt trạng thái chỉ đọc (`status`, `status --json`, `status --all`) phân giải SecretRef được hỗ trợ cho các đường dẫn cấu hình được nhắm đến khi có thể.
- Nếu một SecretRef kênh được hỗ trợ đã được cấu hình nhưng không khả dụng trong đường dẫn lệnh hiện tại, trạng thái vẫn chỉ đọc và báo cáo đầu ra suy giảm thay vì bị lỗi. Đầu ra cho người đọc hiển thị cảnh báo như “token đã cấu hình không khả dụng trong đường dẫn lệnh này”, và đầu ra JSON bao gồm `secretDiagnostics`.
- Khi phân giải SecretRef cục bộ theo lệnh thành công, trạng thái ưu tiên ảnh chụp nhanh đã phân giải và xóa các dấu hiệu kênh “secret không khả dụng” tạm thời khỏi đầu ra cuối cùng.
- `status --all` bao gồm một hàng tổng quan Secrets và một phần chẩn đoán tóm tắt chẩn đoán secret (được rút gọn để dễ đọc) mà không dừng việc tạo báo cáo.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Doctor](/vi/gateway/doctor)
