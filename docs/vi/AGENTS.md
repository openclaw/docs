---
x-i18n:
    generated_at: "2026-07-12T07:41:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8712b1aeb2e605055c22cf308049e5e74fdf33061870026be20bd55cb0c3d1d
    source_path: AGENTS.md
    workflow: 16
---

# Hướng dẫn tài liệu

Thư mục này quản lý việc biên soạn tài liệu, các quy tắc liên kết Mintlify và chính sách quốc tế hóa tài liệu.

## Quy tắc Mintlify

- Tài liệu được lưu trữ trên Mintlify (`https://docs.openclaw.ai`).
- Các liên kết nội bộ trong `docs/**/*.md` phải giữ dạng đường dẫn tương đối từ gốc và không có hậu tố `.md` hoặc `.mdx` (ví dụ: `[Cấu hình](/gateway/configuration)`).
- Các tham chiếu chéo đến phần nội dung phải sử dụng neo trên đường dẫn tương đối từ gốc (ví dụ: `[Hook](/gateway/configuration-reference#hooks)`).
- Tiêu đề tài liệu nên tránh dấu gạch ngang dài và dấu nháy đơn vì cơ chế tạo neo của Mintlify không ổn định với các ký tự này.
- README và các tài liệu khác được GitHub kết xuất nên giữ URL tài liệu tuyệt đối để liên kết hoạt động bên ngoài Mintlify.
- Nội dung tài liệu phải mang tính khái quát: không dùng tên thiết bị cá nhân, tên máy chủ hoặc đường dẫn cục bộ; hãy dùng phần giữ chỗ như `user@gateway-host`.

## Quy tắc nội dung tài liệu

- Đối với tài liệu, văn bản giao diện người dùng và danh sách lựa chọn, hãy sắp xếp dịch vụ/nhà cung cấp theo thứ tự bảng chữ cái, trừ khi phần đó mô tả rõ ràng thứ tự thời gian chạy hoặc thứ tự tự động phát hiện.
- Giữ cách đặt tên Plugin đi kèm nhất quán với các quy tắc thuật ngữ Plugin áp dụng trên toàn kho lưu trữ trong `AGENTS.md` ở thư mục gốc.
- Không bao giờ chỉnh sửa thủ công tài liệu được tạo tự động: `docs/plugins/reference/**`, `docs/plugins/reference.md` và `docs/plugins/plugin-inventory.md` được tạo từ `pnpm plugins:inventory:gen`; `docs/docs_map.md` từ `pnpm docs:map:gen`; `docs/maturity/**` từ `pnpm maturity:render`.

## Tài liệu nội bộ

- Tài liệu riêng tư dài hạn dành cho người vận hành thuộc về `~/Projects/manager/docs/`.
- Tài liệu nháp/bản sao nội bộ cục bộ của kho lưu trữ có thể nằm trong thư mục bị bỏ qua `docs/internal/`.
- Không bao giờ thêm các trang `docs/internal/**` vào phần điều hướng của `docs/docs.json` hoặc liên kết đến chúng từ tài liệu công khai.
- `scripts/docs-sync-publish.mjs` loại trừ và dọn bỏ `docs/internal/**` khỏi kho lưu trữ phát hành công khai `openclaw/docs` nếu sau này một trang bị cưỡng chế thêm vào.
- Tài liệu nội bộ có thể đề cập đến đường dẫn trong kho lưu trữ, tên ứng dụng riêng tư, tên mục trong 1Password và quy trình vận hành, nhưng tuyệt đối không được chứa giá trị bí mật.

## Chỉnh sửa bảng điểm mức độ hoàn thiện

`taxonomy.yaml` và `qa/maturity-scores.yaml` là các đầu vào nguồn; tài liệu mức độ hoàn thiện được tạo tự động trong `docs/maturity/` là các bản biểu diễn và không nên được chỉnh sửa thủ công đối với điểm số, LTS, hệ thống phân loại, hồ sơ QA hoặc bảng bằng chứng.
`scripts/qa/render-maturity-docs.ts` quản lý việc tạo tài liệu; dùng `pnpm maturity:render` để làm mới các tài liệu đã cam kết và `pnpm maturity:check` để xác minh chúng.
`.github/workflows/maturity-scorecard.yml` kết xuất bản xem trước của hiện vật và có thể mở các PR tài liệu được tạo tự động; `.github/workflows/openclaw-release-checks.yml` kích hoạt quy trình này cho QA bản phát hành.
Giữ dữ liệu `qa-evidence.json.scorecard` có tính xác định trong các hiện vật GitHub Actions, trừ khi người bảo trì yêu cầu rõ ràng một bản biểu diễn đã được làm sạch để cam kết.
Các ghi đè thủ công phải thay đổi trạng thái nguồn trong một PR và giải thích lý do cùng với bằng chứng công khai hoặc đã được biên tập ẩn thông tin nhạy cảm.

## Quốc tế hóa tài liệu

- Tài liệu bằng ngôn ngữ khác không được duy trì trong kho lưu trữ này. Đầu ra phát hành được tạo tự động nằm trong kho lưu trữ `openclaw/docs` riêng biệt (thường được sao chép cục bộ dưới dạng `../openclaw-docs`).
- Không thêm hoặc chỉnh sửa tài liệu bản địa hóa trong `docs/<locale>/**` tại đây.
- Xem tài liệu tiếng Anh trong kho lưu trữ này cùng các tệp bảng thuật ngữ là nguồn chính xác.
- Quy trình: cập nhật tài liệu tiếng Anh tại đây, cập nhật `docs/.i18n/glossary.<locale>.json` khi cần, sau đó để quá trình đồng bộ kho lưu trữ phát hành và `scripts/docs-i18n` chạy trong `openclaw/docs`.
- Trước khi chạy lại `scripts/docs-i18n`, hãy thêm các mục vào bảng thuật ngữ cho mọi thuật ngữ kỹ thuật, tiêu đề trang hoặc nhãn điều hướng ngắn mới cần được giữ nguyên bằng tiếng Anh hoặc dùng bản dịch cố định.
- `pnpm docs:check-i18n-glossary` là cơ chế bảo vệ cho các tiêu đề tài liệu tiếng Anh và nhãn tài liệu nội bộ ngắn đã thay đổi.
- Bộ nhớ dịch nằm trong các tệp `docs/.i18n/*.tm.jsonl` được tạo tự động trong kho lưu trữ phát hành.
- Xem `docs/.i18n/README.md`.
