---
x-i18n:
    generated_at: "2026-04-29T22:22:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b046833f9a15dc61894ab9e808a09a9fb055ef7ada5c3d4893fbe5f70dec126
    source_path: AGENTS.md
    workflow: 16
---

# Hướng dẫn tài liệu

Thư mục này sở hữu việc biên soạn tài liệu, quy tắc liên kết Mintlify và chính sách i18n tài liệu.

## Quy tắc Mintlify

- Tài liệu được lưu trữ trên Mintlify (`https://docs.openclaw.ai`).
- Liên kết tài liệu nội bộ trong `docs/**/*.md` phải giữ dạng tương đối từ gốc, không có hậu tố `.md` hoặc `.mdx` (ví dụ: `[Config](/gateway/configuration)`).
- Tham chiếu chéo đến mục nên dùng anchor trên đường dẫn tương đối từ gốc (ví dụ: `[Hooks](/gateway/configuration-reference#hooks)`).
- Tiêu đề tài liệu nên tránh dấu gạch ngang dài và dấu nháy đơn vì việc tạo anchor của Mintlify không ổn định với các ký tự đó.
- README và các tài liệu khác được GitHub render nên giữ URL tài liệu tuyệt đối để liên kết hoạt động bên ngoài Mintlify.
- Nội dung tài liệu phải giữ tính khái quát: không có tên thiết bị cá nhân, hostname hoặc đường dẫn cục bộ; dùng placeholder như `user@gateway-host`.

## Quy tắc nội dung tài liệu

- Với tài liệu, nội dung UI và danh sách chọn, hãy sắp xếp dịch vụ/nhà cung cấp theo thứ tự bảng chữ cái trừ khi mục đó mô tả rõ thứ tự runtime hoặc thứ tự tự động phát hiện.
- Giữ cách đặt tên Plugin được đóng gói nhất quán với các quy tắc thuật ngữ Plugin trên toàn repo trong `AGENTS.md` gốc.

## i18n tài liệu

- Tài liệu ngôn ngữ nước ngoài không được duy trì trong repo này. Đầu ra xuất bản được tạo nằm trong repo `openclaw/docs` riêng (thường được clone cục bộ dưới dạng `../openclaw-docs`).
- Không thêm hoặc chỉnh sửa tài liệu đã bản địa hóa dưới `docs/<locale>/**` ở đây.
- Xem tài liệu tiếng Anh trong repo này cùng các tệp glossary là nguồn chân lý.
- Quy trình: cập nhật tài liệu tiếng Anh ở đây, cập nhật `docs/.i18n/glossary.<locale>.json` khi cần, sau đó để đồng bộ repo xuất bản và `scripts/docs-i18n` chạy trong `openclaw/docs`.
- Trước khi chạy lại `scripts/docs-i18n`, hãy thêm mục glossary cho mọi thuật ngữ kỹ thuật, tiêu đề trang hoặc nhãn điều hướng ngắn mới cần giữ bằng tiếng Anh hoặc dùng bản dịch cố định.
- `pnpm docs:check-i18n-glossary` là lớp bảo vệ cho tiêu đề tài liệu tiếng Anh đã thay đổi và nhãn tài liệu nội bộ ngắn.
- Bộ nhớ dịch nằm trong các tệp `docs/.i18n/*.tm.jsonl` được tạo trong repo xuất bản.
- Xem `docs/.i18n/README.md`.
