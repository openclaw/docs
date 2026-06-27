---
x-i18n:
    generated_at: "2026-06-27T17:08:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c67d049eb1d0f1d4e675a71e69b2d34d3ce5c733ca9582bf08ac717c233644
    source_path: AGENTS.md
    workflow: 16
---

# Hướng dẫn tài liệu

Thư mục này sở hữu việc biên soạn tài liệu, quy tắc liên kết Mintlify và chính sách i18n cho tài liệu.

## Quy tắc Mintlify

- Tài liệu được lưu trữ trên Mintlify (`https://docs.openclaw.ai`).
- Liên kết tài liệu nội bộ trong `docs/**/*.md` phải giữ dạng tương đối từ gốc, không có hậu tố `.md` hoặc `.mdx` (ví dụ: `[Cấu hình](/gateway/configuration)`).
- Tham chiếu chéo đến mục nên dùng anchor trên đường dẫn tương đối từ gốc (ví dụ: `[Hook](/gateway/configuration-reference#hooks)`).
- Tiêu đề tài liệu nên tránh dấu gạch ngang dài và dấu nháy đơn vì việc tạo anchor của Mintlify dễ lỗi với chúng.
- README và các tài liệu khác được GitHub render nên giữ URL tài liệu tuyệt đối để liên kết hoạt động bên ngoài Mintlify.
- Nội dung tài liệu phải giữ tính chung: không có tên thiết bị cá nhân, hostname hoặc đường dẫn cục bộ; dùng placeholder như `user@gateway-host`.

## Quy tắc nội dung tài liệu

- Với tài liệu, nội dung UI và danh sách chọn, sắp xếp dịch vụ/nhà cung cấp theo thứ tự bảng chữ cái trừ khi mục đó đang mô tả rõ thứ tự runtime hoặc thứ tự tự động phát hiện.
- Giữ cách đặt tên Plugin đi kèm nhất quán với các quy tắc thuật ngữ Plugin trên toàn repo trong `AGENTS.md` gốc.

## Tài liệu nội bộ

- Tài liệu vận hành riêng tư dài hạn thuộc về `~/Projects/manager/docs/`.
- Tài liệu nháp/bản sao nội bộ cục bộ trong repo có thể nằm dưới `docs/internal/` đã bị ignore.
- Không bao giờ thêm các trang `docs/internal/**` vào điều hướng `docs/docs.json` hoặc liên kết đến chúng từ tài liệu công khai.
- `scripts/docs-sync-publish.mjs` loại trừ và cắt bỏ `docs/internal/**` khỏi repo xuất bản công khai `openclaw/docs` nếu một trang bị buộc thêm về sau.
- Tài liệu nội bộ có thể nhắc đến đường dẫn repo, tên ứng dụng riêng tư, tên mục 1Password và sổ tay vận hành, nhưng không bao giờ bao gồm giá trị bí mật.

## Chỉnh sửa bảng điểm mức độ trưởng thành

`taxonomy.yaml` và `qa/maturity-scores.yaml` là đầu vào nguồn; tài liệu mức độ trưởng thành được tạo dưới `docs/maturity/` là các hình chiếu và không nên chỉnh sửa thủ công cho điểm số, LTS, taxonomy, hồ sơ QA hoặc bảng bằng chứng.
`scripts/qa/render-maturity-docs.ts` sở hữu việc tạo; dùng `pnpm maturity:render` để làm mới tài liệu đã commit và `pnpm maturity:check` để xác minh chúng.
`.github/workflows/maturity-scorecard.yml` render bản xem trước artifact và có thể mở PR tài liệu được tạo; `.github/workflows/openclaw-release-checks.yml` dispatch nó cho QA bản phát hành.
Giữ dữ liệu `qa-evidence.json.scorecard` xác định được trong artifact GitHub Actions trừ khi maintainer yêu cầu rõ ràng một hình chiếu đã được làm sạch và commit.
Ghi đè thủ công phải thay đổi trạng thái nguồn trong một PR và giải thích lý do cùng bằng chứng công khai hoặc đã biên tập.

## i18n tài liệu

- Tài liệu bằng ngôn ngữ nước ngoài không được duy trì trong repo này. Đầu ra xuất bản được tạo nằm trong repo `openclaw/docs` riêng (thường được clone cục bộ là `../openclaw-docs`).
- Không thêm hoặc chỉnh sửa tài liệu đã bản địa hóa dưới `docs/<locale>/**` ở đây.
- Xem tài liệu tiếng Anh trong repo này cùng các tệp thuật ngữ là nguồn sự thật.
- Pipeline: cập nhật tài liệu tiếng Anh ở đây, cập nhật `docs/.i18n/glossary.<locale>.json` khi cần, rồi để đồng bộ repo xuất bản và `scripts/docs-i18n` chạy trong `openclaw/docs`.
- Trước khi chạy lại `scripts/docs-i18n`, thêm mục thuật ngữ cho mọi thuật ngữ kỹ thuật mới, tiêu đề trang hoặc nhãn điều hướng ngắn phải giữ bằng tiếng Anh hoặc dùng bản dịch cố định.
- `pnpm docs:check-i18n-glossary` là cơ chế bảo vệ cho các tiêu đề tài liệu tiếng Anh đã thay đổi và nhãn tài liệu nội bộ ngắn.
- Bộ nhớ dịch nằm trong các tệp `docs/.i18n/*.tm.jsonl` được tạo trong repo xuất bản.
- Xem `docs/.i18n/README.md`.
