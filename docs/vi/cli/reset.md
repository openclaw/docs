---
read_when:
    - Bạn muốn xóa sạch trạng thái cục bộ nhưng vẫn giữ CLI đã cài đặt
    - Bạn muốn chạy thử để xem những gì sẽ bị xóa
summary: Tài liệu tham chiếu CLI cho `openclaw reset` (đặt lại trạng thái/cấu hình cục bộ)
title: Đặt lại
x-i18n:
    generated_at: "2026-07-19T05:42:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 54f1d320ee368dae4a4bfb32dea73d19eb35f9f30edd12d9c2580ab7e6a26fa6
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
- `--non-interactive`: tắt lời nhắc; yêu cầu `--scope` và `--yes`
- `--dry-run`: in các thao tác mà không xóa tệp

## Phạm vi

| Phạm vi                 | Nội dung bị xóa                                                             | Dừng Gateway trước |
| ----------------------- | --------------------------------------------------------------------------- | ------------------ |
| `config`                | chỉ tệp cấu hình                                                             | không              |
| `config+creds+sessions` | tệp cấu hình, thư mục OAuth/thông tin xác thực, các thư mục phiên theo từng tác nhân | có                 |
| `full`                  | thư mục trạng thái (bao gồm cơ sở dữ liệu SQLite dùng chung) cùng các thư mục không gian làm việc | có                 |

`config+creds+sessions` và `full` dừng dịch vụ Gateway được quản lý đang chạy trước khi xóa trạng thái.

## Ghi chú

- Trước tiên, hãy chạy `openclaw backup create` để tạo ảnh chụp nhanh có thể khôi phục trước khi xóa trạng thái cục bộ.
- Trạng thái thiết lập không gian làm việc và các chứng thực là các hàng trong cơ sở dữ liệu SQLite dùng chung, vì vậy `full` xóa chúng cùng thư mục trạng thái; hiện không có tệp chứng thực phụ trợ nào cần xóa riêng.
- Nếu không có `--scope`, `openclaw reset` sẽ nhắc tương tác để chọn phạm vi cần xóa.
- `--non-interactive` chỉ hợp lệ khi cả `--scope` và `--yes` đều được đặt.
- `config+creds+sessions` và `full` in `Next: openclaw onboard --install-daemon` khi hoàn tất.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
