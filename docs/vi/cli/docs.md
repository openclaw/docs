---
read_when:
    - Bạn muốn tìm kiếm tài liệu OpenClaw trực tiếp từ terminal
    - Bạn cần biết CLI tài liệu gọi API tìm kiếm được lưu trữ nào
summary: Tài liệu tham khảo CLI cho `openclaw docs` (tìm kiếm trong chỉ mục tài liệu trực tiếp)
title: Tài liệu
x-i18n:
    generated_at: "2026-07-12T07:45:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0b575f0b76d40a53dd4f79c55fd65969a24eae27e27bd1c46d395f61fe89e42
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Tìm kiếm chỉ mục tài liệu OpenClaw trực tuyến từ terminal.

## Cách sử dụng

```bash
openclaw docs                       # in điểm truy cập tài liệu và ví dụ tìm kiếm
openclaw docs <query...>            # tìm kiếm trong chỉ mục tài liệu trực tuyến
```

| Đối số       | Mô tả                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------- |
| `[query...]` | Truy vấn tìm kiếm dạng tự do. Các truy vấn nhiều từ được nối bằng dấu cách và gửi cùng nhau. |

Khi không có truy vấn, `openclaw docs` sẽ in URL điểm truy cập tài liệu và một lệnh tìm kiếm mẫu thay vì thực hiện tìm kiếm.

## Ví dụ

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

## Cách hoạt động

`openclaw docs` gọi `https://docs.openclaw.ai/api/search` và hiển thị kết quả JSON. Yêu cầu tìm kiếm sử dụng thời gian chờ cố định là 30 giây.

## Đầu ra

Trong terminal có hỗ trợ hiển thị phong phú (TTY), kết quả được hiển thị dưới dạng một tiêu đề, theo sau là danh sách dấu đầu dòng: tiêu đề trang, URL tài liệu có liên kết và một đoạn trích ngắn ở dòng tiếp theo. Khi không có kết quả, hệ thống in "Không có kết quả.".

Trong đầu ra không hỗ trợ hiển thị phong phú (được chuyển qua đường ống, `--no-color`, tập lệnh), cùng dữ liệu đó được hiển thị dưới dạng Markdown:

```markdown
# Tìm kiếm tài liệu: <query>

- [Tiêu đề](https://docs.openclaw.ai/...) - đoạn trích
- [Tiêu đề](https://docs.openclaw.ai/...) - đoạn trích
```

## Mã thoát

| Mã  | Ý nghĩa                                                                                  |
| --- | ---------------------------------------------------------------------------------------- |
| `0` | Tìm kiếm thành công, bao gồm cả phản hồi không có kết quả.                               |
| `1` | Lệnh gọi API tìm kiếm tài liệu được lưu trữ đã thất bại; stderr in thông báo lỗi.         |

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tài liệu trực tuyến](https://docs.openclaw.ai)
