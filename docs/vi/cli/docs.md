---
read_when:
    - Bạn muốn tìm kiếm tài liệu OpenClaw trực tuyến từ dòng lệnh
summary: Tài liệu tham khảo CLI cho `openclaw docs` (tìm kiếm chỉ mục tài liệu trực tiếp)
title: Tài liệu
x-i18n:
    generated_at: "2026-04-29T22:31:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d208f5b9a3576ce0597abca600df109db054d20068359a9f2070ac30b1a8f69
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Tìm kiếm chỉ mục tài liệu trực tiếp.

Đối số:

- `[query...]`: các thuật ngữ tìm kiếm để gửi tới chỉ mục tài liệu trực tiếp

Ví dụ:

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Ghi chú:

- Khi không có truy vấn, `openclaw docs` sẽ mở điểm vào tìm kiếm tài liệu trực tiếp.
- Các truy vấn nhiều từ được chuyển tiếp dưới dạng một yêu cầu tìm kiếm duy nhất.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
