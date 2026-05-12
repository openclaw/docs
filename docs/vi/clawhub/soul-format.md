---
read_when:
    - Xuất bản linh hồn
    - Gỡ lỗi các lỗi xuất bản soul
summary: Định dạng gói Soul, các tệp bắt buộc và giới hạn.
x-i18n:
    generated_at: "2026-05-12T00:58:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# Định dạng linh hồn

## Trên đĩa

Một linh hồn là một tệp duy nhất:

- `SOUL.md` (hoặc `soul.md`)

Hiện tại, onlycrabs.ai từ chối mọi tệp bổ sung.

## `SOUL.md`

- Markdown với YAML frontmatter tùy chọn.
- Máy chủ trích xuất siêu dữ liệu từ frontmatter trong khi phát hành.
- `description` được dùng làm phần tóm tắt linh hồn trong UI/tìm kiếm.

## Giới hạn

- Tổng kích thước gói: 50MB.
- Văn bản nhúng chỉ bao gồm `SOUL.md`.

## Slug

- Mặc định được suy ra từ tên thư mục.
- Phải viết thường và an toàn cho URL: `^[a-z0-9][a-z0-9-]*$`.

## Quản lý phiên bản + thẻ

- Mỗi lần phát hành tạo một phiên bản mới (semver).
- Thẻ là con trỏ dạng chuỗi đến một phiên bản; `latest` thường được dùng.
