---
read_when:
    - Bạn muốn chẩn đoán nhanh tình trạng kênh + những người nhận trong các phiên gần đây
    - Bạn muốn một trạng thái "tất cả" có thể dán trực tiếp để gỡ lỗi
summary: Tài liệu tham khảo CLI cho `openclaw status` (chẩn đoán, phép thăm dò, ảnh chụp nhanh mức sử dụng)
title: openclaw status
x-i18n:
    generated_at: "2026-07-12T07:49:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37b8a3297adbef855b468466ec1001d0721eef066899eb20d94c18933a8f257e
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

| Cờ                      | Mô tả                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `--all`                 | Chẩn đoán đầy đủ (chỉ đọc, có thể sao chép để chia sẻ). Bao gồm kiểm tra bảo mật, khả năng tương thích của plugin và phép dò vector bộ nhớ. |
| `--deep`                | Chạy các phép dò trực tiếp (WhatsApp Web + Telegram + Discord + Slack + Signal). Đồng thời bật kiểm tra bảo mật.          |
| `--usage`               | In các khoảng sử dụng nhà cung cấp đã chuẩn hóa dưới dạng `X% left`.                                                       |
| `--json`                | Đầu ra máy có thể đọc được.                                                                                               |
| `--verbose` / `--debug` | Đồng thời in kết quả phân giải đích Gateway thô trước báo cáo.                                                            |

Lệnh `openclaw status` thông thường vẫn sử dụng đường dẫn chỉ đọc nhanh và đánh dấu bộ nhớ là
`not checked` thay vì không khả dụng khi bỏ qua việc kiểm tra bộ nhớ. Các phép
kiểm tra bảo mật chuyên sâu, khả năng tương thích của plugin và dò vector bộ nhớ được dành cho
`openclaw status --all`, `openclaw status --deep`, `openclaw security audit`
và `openclaw memory status --deep`.

## Phân giải phiên và mô hình

- Đầu ra trạng thái phiên tách `Execution:` khỏi `Runtime:`. `Execution`
  là đường dẫn sandbox (`direct`, `docker/*`), còn `Runtime` cho biết
  phiên đang sử dụng `OpenClaw Default`, `OpenAI Codex`, một phần phụ trợ
  CLI hay một phần phụ trợ ACP như `codex (acp/acpx)`. Xem
  [môi trường thực thi tác nhân](/vi/concepts/agent-runtimes) để biết sự khác biệt giữa
  nhà cung cấp, mô hình và môi trường thực thi.
- Khi ảnh chụp nhanh của phiên hiện tại thiếu dữ liệu, `/status` có thể bổ sung các bộ đếm token
  và bộ nhớ đệm từ nhật ký sử dụng bản ghi gần đây nhất. Các giá trị trực tiếp
  khác không hiện có vẫn được ưu tiên hơn các giá trị dự phòng từ bản ghi.
- Cơ chế dự phòng từ bản ghi cũng có thể khôi phục nhãn mô hình thực thi đang hoạt động khi
  mục phiên trực tiếp bị thiếu nhãn này. Nếu mô hình trong bản ghi đó khác
  với mô hình đã chọn, trạng thái sẽ phân giải cửa sổ ngữ cảnh dựa trên
  mô hình thực thi đã khôi phục thay vì mô hình đã chọn.
- Khi tính kích thước lời nhắc, cơ chế dự phòng từ bản ghi ưu tiên tổng số
  hướng đến lời nhắc lớn hơn khi siêu dữ liệu phiên bị thiếu hoặc nhỏ hơn, để
  các phiên dùng nhà cung cấp tùy chỉnh không bị thu gọn thành hiển thị `0` token.
- Khi một phiên được ghim vào mô hình khác với mô hình chính đã cấu hình,
  trạng thái sẽ in cả hai giá trị, lý do (`session override`) và
  gợi ý `/model default`. Mô hình chính đã cấu hình áp dụng cho các phiên mới hoặc
  chưa ghim; các phiên đã ghim hiện có vẫn giữ lựa chọn của phiên
  cho đến khi được xóa.
- Đầu ra bao gồm kho phiên theo từng tác nhân khi cấu hình nhiều tác nhân.

## Mức sử dụng và hạn ngạch

- `--usage` in các khoảng sử dụng nhà cung cấp đã chuẩn hóa dưới dạng `X% left`.
- Các trường `usage_percent` / `usagePercent` thô của MiniMax biểu thị hạn ngạch còn lại,
  vì vậy OpenClaw đảo chúng trước khi hiển thị; các trường dựa trên số lượng được ưu tiên khi
  có. Phản hồi `model_remains` ưu tiên mục mô hình trò chuyện, suy ra
  nhãn khoảng từ dấu thời gian khi cần và đưa tên mô hình vào
  nhãn gói.
- Lỗi làm mới giá mô hình được hiển thị dưới dạng cảnh báo giá không bắt buộc.
  Chúng không có nghĩa là Gateway hoặc các kênh gặp sự cố.

## Tổng quan và trạng thái cập nhật

- Phần tổng quan bao gồm trạng thái cài đặt/thực thi của dịch vụ máy chủ Gateway + Node khi
  có, cùng với thời gian hoạt động ngắn gọn của tiến trình Gateway và thời gian hoạt động của hệ thống máy chủ.
- Phần tổng quan bao gồm kênh cập nhật + SHA git (đối với các bản sao mã nguồn).
- Thông tin cập nhật xuất hiện trong phần Tổng quan; nếu có bản cập nhật, trạng thái
  sẽ in gợi ý chạy `openclaw update` (xem [Cập nhật](/vi/install/updating)).

## Bí mật

- Các bề mặt trạng thái chỉ đọc (`status`, `status --json`, `status --all`)
  phân giải các SecretRef được hỗ trợ cho những đường dẫn cấu hình mục tiêu khi
  có thể.
- Nếu SecretRef của một kênh được hỗ trợ đã được cấu hình nhưng không khả dụng trong
  đường dẫn lệnh hiện tại, trạng thái vẫn ở chế độ chỉ đọc và báo cáo đầu ra
  suy giảm thay vì bị lỗi. Đầu ra cho người đọc hiển thị các cảnh báo như "token đã cấu hình
  không khả dụng trong đường dẫn lệnh này", còn đầu ra JSON bao gồm
  `secretDiagnostics`.
- Khi quá trình phân giải SecretRef cục bộ theo lệnh thành công, trạng thái ưu tiên
  ảnh chụp nhanh đã phân giải và xóa các dấu hiệu kênh tạm thời "bí mật không khả dụng"
  khỏi đầu ra cuối cùng.
- `status --all` bao gồm một hàng tổng quan về Bí mật và một phần chẩn đoán
  tóm tắt các chẩn đoán bí mật (được cắt ngắn để dễ đọc) mà không
  dừng quá trình tạo báo cáo.

## Bộ nhớ

`status --json --all` báo cáo chi tiết bộ nhớ từ môi trường thực thi plugin bộ nhớ đang hoạt động
được chọn bởi `plugins.slots.memory`. Các plugin bộ nhớ tùy chỉnh có thể để
`agents.defaults.memorySearch.enabled` tích hợp sẵn ở trạng thái tắt mà vẫn báo cáo
trạng thái tệp, khối, vector và FTS riêng của chúng.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Doctor](/vi/gateway/doctor)
