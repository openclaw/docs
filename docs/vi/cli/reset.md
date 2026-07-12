---
read_when:
    - Bạn muốn xóa sạch trạng thái cục bộ nhưng vẫn giữ nguyên CLI đã cài đặt
    - Bạn muốn chạy thử để xem những gì sẽ bị xóa
summary: Tài liệu tham khảo CLI cho `openclaw reset` (đặt lại trạng thái/cấu hình cục bộ)
title: Đặt lại
x-i18n:
    generated_at: "2026-07-12T07:51:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f18af9c5e187217de4c02f4b55de9a1c94f7246b74056dc660aa172168edcef9
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

Đặt lại cấu hình/trạng thái cục bộ (vẫn giữ CLI đã cài đặt).

```bash
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

## Tùy chọn

- `--scope <scope>`: `config`, `config+creds+sessions` hoặc `full`
- `--yes`: bỏ qua lời nhắc xác nhận
- `--non-interactive`: vô hiệu hóa lời nhắc; yêu cầu `--scope` và `--yes`
- `--dry-run`: in các thao tác mà không xóa tệp

## Phạm vi

| Phạm vi                | Nội dung bị xóa                                                                                                               | Dừng Gateway trước |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `config`               | chỉ tệp cấu hình                                                                                                              | không              |
| `config+creds+sessions` | tệp cấu hình, thư mục OAuth/thông tin xác thực, các thư mục phiên của từng tác tử                                             | có                 |
| `full`                 | thư mục trạng thái (bao gồm cấu hình/thông tin xác thực nếu nằm bên trong) cùng các thư mục không gian làm việc và chứng thực không gian làm việc | có                 |

`config+creds+sessions` và `full` dừng dịch vụ Gateway được quản lý đang chạy trước khi xóa trạng thái.

## Ghi chú

- Trước tiên, hãy chạy `openclaw backup create` để tạo ảnh chụp nhanh có thể khôi phục trước khi xóa trạng thái cục bộ.
- Khi không có `--scope`, `openclaw reset` sẽ tương tác hỏi phạm vi cần xóa.
- `--non-interactive` chỉ hợp lệ khi cả `--scope` và `--yes` đều được đặt.
- Khi hoàn tất, `config+creds+sessions` và `full` in `Next: openclaw onboard --install-daemon`.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
