---
x-i18n:
    generated_at: "2026-05-10T19:20:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4fb1075777cead58155336aa27359c8c149748bec8a854ff1de1f75a992b8c8f
    source_path: AGENTS.md
    workflow: 16
---

# Hướng Dẫn Tài Liệu

Thư mục này sở hữu việc soạn thảo tài liệu, quy tắc liên kết Mintlify và chính sách i18n cho tài liệu.

## Quy Tắc Mintlify

- Tài liệu được lưu trữ trên Mintlify (`https://docs.openclaw.ai`).
- Các liên kết tài liệu nội bộ trong `docs/**/*.md` phải giữ dạng tương đối với gốc, không có hậu tố `.md` hoặc `.mdx` (ví dụ: `[Config](/gateway/configuration)`).
- Tham chiếu chéo đến mục nên dùng anchor trên đường dẫn tương đối với gốc (ví dụ: `[Hooks](/gateway/configuration-reference#hooks)`).
- Tiêu đề tài liệu nên tránh dấu gạch ngang dài và dấu nháy đơn vì quá trình tạo anchor của Mintlify dễ lỗi với các ký tự đó.
- README và các tài liệu khác được hiển thị trên GitHub nên giữ URL tài liệu tuyệt đối để liên kết hoạt động bên ngoài Mintlify.
- Nội dung tài liệu phải giữ tính chung: không có tên thiết bị cá nhân, hostname hoặc đường dẫn cục bộ; dùng placeholder như `user@gateway-host`.

## Quy Tắc Nội Dung Tài Liệu

- Với tài liệu, nội dung UI và danh sách trình chọn, sắp xếp dịch vụ/nhà cung cấp theo thứ tự bảng chữ cái trừ khi mục đó đang mô tả rõ thứ tự runtime hoặc thứ tự tự động phát hiện.
- Giữ cách đặt tên Plugin đi kèm nhất quán với các quy tắc thuật ngữ Plugin trên toàn repo trong `AGENTS.md` gốc.

## Tài Liệu Nội Bộ

- Tài liệu vận hành riêng tư tồn tại lâu dài thuộc về `~/Projects/manager/docs/`.
- Tài liệu nháp/bản sao nội bộ cục bộ trong repo có thể nằm dưới `docs/internal/` bị ignore.
- Không bao giờ thêm các trang `docs/internal/**` vào điều hướng `docs/docs.json` hoặc liên kết chúng từ tài liệu công khai.
- `scripts/docs-sync-publish.mjs` loại trừ và cắt bỏ `docs/internal/**` khỏi repo phát hành công khai `openclaw/docs` nếu một trang bị buộc thêm vào sau này.
- Tài liệu nội bộ có thể nhắc đến đường dẫn repo, tên ứng dụng riêng tư, tên mục 1Password và runbook, nhưng không bao giờ bao gồm giá trị bí mật.

## i18n Cho Tài Liệu

- Tài liệu tiếng nước ngoài không được duy trì trong repo này. Đầu ra phát hành được tạo nằm trong repo `openclaw/docs` riêng biệt (thường được clone cục bộ thành `../openclaw-docs`).
- Không thêm hoặc chỉnh sửa tài liệu bản địa hóa dưới `docs/<locale>/**` tại đây.
- Xem tài liệu tiếng Anh trong repo này cùng các tệp glossary là nguồn sự thật.
- Pipeline: cập nhật tài liệu tiếng Anh tại đây, cập nhật `docs/.i18n/glossary.<locale>.json` khi cần, rồi để quá trình đồng bộ repo phát hành và `scripts/docs-i18n` chạy trong `openclaw/docs`.
- Trước khi chạy lại `scripts/docs-i18n`, thêm mục glossary cho mọi thuật ngữ kỹ thuật, tiêu đề trang hoặc nhãn điều hướng ngắn mới cần giữ bằng tiếng Anh hoặc dùng bản dịch cố định.
- `pnpm docs:check-i18n-glossary` là guard cho các tiêu đề tài liệu tiếng Anh đã thay đổi và nhãn tài liệu nội bộ ngắn.
- Translation memory nằm trong các tệp `docs/.i18n/*.tm.jsonl` được tạo trong repo phát hành.
- Xem `docs/.i18n/README.md`.
