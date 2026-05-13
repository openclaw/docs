---
read_when:
    - Xuất bản các linh hồn
    - Gỡ lỗi các lỗi xuất bản soul
summary: Định dạng gói Soul, các tệp bắt buộc, giới hạn.
x-i18n:
    generated_at: "2026-05-13T05:33:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# Định dạng linh hồn

## Trên ổ đĩa

Một linh hồn là một tệp duy nhất:

- `SOUL.md` (hoặc `soul.md`)

Hiện tại, onlycrabs.ai từ chối mọi tệp bổ sung.

## `SOUL.md`

- Markdown với YAML frontmatter tùy chọn.
- Máy chủ trích xuất metadata từ frontmatter trong quá trình publish.
- `description` được dùng làm phần tóm tắt linh hồn trong UI/tìm kiếm.

## Giới hạn

- Tổng kích thước gói: 50MB.
- Văn bản embedding chỉ bao gồm `SOUL.md`.

## Slug

- Theo mặc định được suy ra từ tên thư mục.
- Phải là chữ thường và an toàn cho URL: `^[a-z0-9][a-z0-9-]*$`.

## Quản lý phiên bản + thẻ

- Mỗi lần publish tạo một phiên bản mới (semver).
- Thẻ là con trỏ chuỗi đến một phiên bản; `latest` thường được sử dụng.
