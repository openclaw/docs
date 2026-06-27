---
read_when:
    - Bạn muốn tìm kiếm tài liệu OpenClaw trực tuyến từ terminal
    - Bạn cần biết CLI tài liệu gọi API tìm kiếm được lưu trữ nào
summary: Tham chiếu CLI cho `openclaw docs` (tìm kiếm chỉ mục tài liệu trực tiếp)
title: Tài liệu
x-i18n:
    generated_at: "2026-06-27T17:17:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8be22f689d40ffec29df9562b69444c0f8b9bb607dfcb79de20b3023e0eb30a
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Tìm kiếm chỉ mục tài liệu OpenClaw đang hoạt động từ terminal. Lệnh này gọi API tìm kiếm tài liệu do Cloudflare lưu trữ của OpenClaw và hiển thị kết quả trong terminal của bạn.

## Cách sử dụng

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

Đối số:

| Đối số       | Mô tả                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------- |
| `[query...]` | Truy vấn tìm kiếm dạng tự do. Truy vấn nhiều từ được nối bằng dấu cách và gửi thành một truy vấn. |

## Ví dụ

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Khi không có truy vấn, `openclaw docs` in URL điểm vào tài liệu cùng với một lệnh tìm kiếm mẫu thay vì chạy tìm kiếm.

## Cách hoạt động

`openclaw docs` gọi `https://docs.openclaw.ai/api/search` và hiển thị kết quả JSON. Lệnh gọi tìm kiếm dùng thời gian chờ cố định là 30 giây.

## Đầu ra

Trong terminal hỗ trợ hiển thị phong phú (TTY), kết quả được hiển thị dưới dạng một tiêu đề theo sau là danh sách gạch đầu dòng. Mỗi gạch đầu dòng hiển thị tiêu đề trang, URL tài liệu được liên kết và một đoạn trích ngắn ở dòng tiếp theo. Kết quả trống sẽ in "Không có kết quả.".

Trong đầu ra không hỗ trợ hiển thị phong phú (được pipe, `--no-color`, script), cùng dữ liệu đó được hiển thị dưới dạng Markdown:

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## Mã thoát

| Mã  | Ý nghĩa                                                           |
| --- | ----------------------------------------------------------------- |
| `0` | Tìm kiếm thành công (bao gồm phản hồi không có kết quả).          |
| `1` | Lệnh gọi API tìm kiếm tài liệu được lưu trữ thất bại; stderr được in nội tuyến. |

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tài liệu trực tiếp](https://docs.openclaw.ai)
