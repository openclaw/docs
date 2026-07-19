---
read_when:
    - Bạn muốn chẩn đoán nhanh tình trạng kênh + những người nhận trong phiên gần đây
    - Bạn muốn trạng thái "all" có thể dán trực tiếp để gỡ lỗi
summary: Tài liệu tham khảo CLI cho `openclaw status` (chẩn đoán, thăm dò, ảnh chụp nhanh mức sử dụng)
title: openclaw status
x-i18n:
    generated_at: "2026-07-19T05:48:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: abf35fe5e60e7fce94aacf86c009d77ac1cc993e0099d294d248e7b884a3f9dc
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

| Cờ                      | Mô tả                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--all`                 | Chẩn đoán đầy đủ (chỉ đọc, có thể dán). Bao gồm kiểm tra bảo mật, khả năng tương thích của plugin và các phép dò vectơ bộ nhớ. |
| `--deep`                | Chạy các phép dò trực tiếp (WhatsApp Web + Telegram + Discord + Slack + Signal). Đồng thời bật kiểm tra bảo mật.              |
| `--usage`               | In các cửa sổ sử dụng nhà cung cấp đã chuẩn hóa dưới dạng `X% left`.                                                   |
| `--json`                | Đầu ra có thể đọc bằng máy.                                                                                                  |
| `--verbose` / `--debug` | Đồng thời in kết quả phân giải đích Gateway thô trước báo cáo.                                                               |

Lệnh `openclaw status` thông thường vẫn đi theo luồng chỉ đọc nhanh và đánh dấu bộ nhớ là
`not checked` thay vì không khả dụng khi bỏ qua việc kiểm tra bộ nhớ. Các phép
kiểm tra bảo mật chuyên sâu, khả năng tương thích của plugin và phép dò vectơ bộ nhớ được dành cho
`openclaw status --all`, `openclaw status --deep`, `openclaw security audit`,
và `openclaw memory status --deep`.

## Phân giải phiên và mô hình

- Đầu ra trạng thái phiên tách biệt `Execution:` với `Runtime:`. `Execution`
  là đường dẫn sandbox (`direct`, `docker/*`), còn `Runtime` cho biết
  phiên đang sử dụng `OpenClaw Default`, `OpenAI Codex`, backend CLI
  hay backend ACP như `codex (acp/acpx)`. Xem
  [Môi trường thực thi tác nhân](/vi/concepts/agent-runtimes) để biết sự khác biệt giữa
  nhà cung cấp/mô hình/môi trường thực thi.
- Khi ảnh chụp nhanh của phiên hiện tại có ít dữ liệu, `/status` có thể bổ sung các bộ đếm
  token và bộ nhớ đệm từ nhật ký sử dụng bản ghi gần nhất. Các giá trị trực tiếp
  khác không hiện có vẫn được ưu tiên hơn các giá trị dự phòng từ bản ghi.
- Cơ chế dự phòng từ bản ghi cũng có thể khôi phục nhãn mô hình môi trường thực thi đang hoạt động khi
  mục phiên trực tiếp bị thiếu nhãn này. Nếu mô hình trong bản ghi đó khác
  với mô hình đã chọn, trạng thái sẽ phân giải cửa sổ ngữ cảnh theo
  mô hình môi trường thực thi đã khôi phục thay vì mô hình đã chọn.
- Để tính kích thước prompt, cơ chế dự phòng từ bản ghi ưu tiên tổng số lớn hơn
  hướng đến prompt khi siêu dữ liệu phiên bị thiếu hoặc nhỏ hơn, nhờ đó
  các phiên dùng nhà cung cấp tùy chỉnh không bị rút gọn thành hiển thị `0` token.
- Khi một phiên được ghim vào mô hình khác với mô hình chính đã cấu hình,
  trạng thái sẽ in cả hai giá trị, lý do (`session override`) và
  gợi ý `/model default`. Mô hình chính đã cấu hình áp dụng cho các phiên mới hoặc
  chưa được ghim; các phiên đã ghim hiện có giữ nguyên lựa chọn của phiên
  cho đến khi bị xóa.
- Đầu ra bao gồm kho phiên theo từng tác nhân khi cấu hình
  nhiều tác nhân.

## Mức sử dụng và hạn ngạch

- `--usage` in các cửa sổ sử dụng nhà cung cấp đã chuẩn hóa dưới dạng `X% left`.
- Các trường `usage_percent` / `usagePercent` thô của MiniMax biểu thị hạn ngạch còn lại,
  vì vậy OpenClaw đảo ngược chúng trước khi hiển thị; các trường dựa trên số lượng được ưu tiên khi
  có mặt. Phản hồi `model_remains` ưu tiên mục mô hình trò chuyện, suy ra
  nhãn cửa sổ từ dấu thời gian khi cần và bao gồm tên mô hình trong
  nhãn gói.
- Lỗi làm mới giá mô hình được hiển thị dưới dạng cảnh báo giá tùy chọn.
  Chúng không có nghĩa là Gateway hoặc các kênh đang gặp sự cố.

## Tổng quan và trạng thái cập nhật

- Phần tổng quan bao gồm trạng thái cài đặt/vận hành dịch vụ máy chủ Gateway + node khi
  có sẵn, cùng thời gian hoạt động ngắn gọn của tiến trình Gateway và thời gian hoạt động của hệ thống máy chủ.
- Phần tổng quan bao gồm kênh cập nhật + SHA git (đối với các bản sao mã nguồn).
- Thông tin cập nhật xuất hiện trong phần Tổng quan; nếu có bản cập nhật,
  trạng thái sẽ in gợi ý chạy `openclaw update` (xem [Cập nhật](/vi/install/updating)).

## Bí mật

- Khi Gateway đang chạy có bất kỳ chủ sở hữu SecretRef bị cô lập nào từ lúc khởi động, tải lại hoặc ghi cấu hình, trạng thái sẽ bao gồm `degradedSecretOwners` trong JSON và một hàng tổng quan **Bí mật bị suy giảm** trong đầu ra cho người đọc. Mỗi mục nêu tên chủ sở hữu, trạng thái suy giảm (`cold` hoặc `stale`), các đường dẫn cấu hình và lý do đã được che. Chủ sở hữu nguội không khả dụng; chủ sở hữu cũ tiếp tục dùng các giá trị tốt đã biết gần nhất.
- Các bề mặt trạng thái chỉ đọc (`status`, `status --json`, `status --all`)
  phân giải các SecretRef được hỗ trợ cho những đường dẫn cấu hình mục tiêu khi
  có thể.
- Nếu một SecretRef kênh được hỗ trợ đã được cấu hình nhưng không khả dụng trong
  đường dẫn lệnh hiện tại, trạng thái vẫn chỉ đọc và báo cáo đầu ra bị suy giảm
  thay vì gặp sự cố. Đầu ra cho người đọc hiển thị các cảnh báo như "token đã cấu hình
  không khả dụng trong đường dẫn lệnh này", còn đầu ra JSON bao gồm
  `secretDiagnostics`.
- Khi việc phân giải SecretRef cục bộ của lệnh thành công, trạng thái ưu tiên
  ảnh chụp nhanh đã phân giải và xóa các dấu kênh "bí mật không khả dụng"
  tạm thời khỏi đầu ra cuối cùng.
- `status --all` bao gồm một hàng tổng quan Bí mật và một phần chẩn đoán
  tóm tắt chẩn đoán bí mật (được rút gọn để dễ đọc) mà không
  dừng quá trình tạo báo cáo.

## Bộ nhớ

`status --json --all` báo cáo chi tiết bộ nhớ từ môi trường thực thi plugin bộ nhớ đang hoạt động
được chọn bởi `plugins.slots.memory`. Các plugin bộ nhớ tùy chỉnh có thể để
`agents.defaults.memorySearch.enabled` tích hợp sẵn ở trạng thái tắt mà vẫn báo cáo
các tệp, phân đoạn, vectơ và trạng thái FTS của riêng chúng.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Doctor](/vi/gateway/doctor)
