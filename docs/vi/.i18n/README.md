---
x-i18n:
    generated_at: "2026-04-29T22:22:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e1cf417b0c04d001bc494fbe03ac2fcb66866f759e21646dbfd1a9c3a968bff
    source_path: .i18n/README.md
    workflow: 16
---

# Tài nguyên i18n của tài liệu OpenClaw

Thư mục này lưu cấu hình dịch cho repo tài liệu nguồn.

Các trang locale được tạo và bộ nhớ dịch locale trực tiếp hiện nằm trong repo xuất bản (`openclaw/docs`, checkout cục bộ cùng cấp `~/Projects/openclaw-docs`).

## Tệp

- `glossary.<lang>.json` — ánh xạ thuật ngữ ưu tiên (được dùng trong hướng dẫn prompt).
- `<lang>.tm.jsonl` — bộ nhớ dịch (bộ nhớ đệm) được đánh khóa theo workflow + model + hàm băm văn bản. Trong repo này, các tệp TM locale được tạo theo nhu cầu.

## Định dạng glossary

`glossary.<lang>.json` là một mảng các mục:

```json
{
  "source": "troubleshooting",
  "target": "故障排除",
  "ignore_case": true,
  "whole_word": false
}
```

Trường:

- `source`: Cụm từ tiếng Anh (hoặc nguồn) nên ưu tiên.
- `target`: bản dịch đầu ra ưu tiên.

## Ghi chú

- Các mục glossary được truyền cho model dưới dạng **hướng dẫn prompt** (không phải ghi đè tất định).
- `scripts/docs-i18n` vẫn sở hữu việc tạo bản dịch.
- Repo nguồn đồng bộ tài liệu tiếng Anh vào repo xuất bản; việc tạo locale chạy ở đó cho từng locale khi push, theo lịch, và khi dispatch bản phát hành.
