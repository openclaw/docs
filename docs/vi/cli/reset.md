---
read_when:
    - Bạn muốn xóa sạch trạng thái cục bộ trong khi vẫn giữ CLI đã cài đặt
    - Bạn muốn chạy thử để xem những gì sẽ bị xóa
summary: Tài liệu tham chiếu CLI cho `openclaw reset` (đặt lại trạng thái/cấu hình cục bộ)
title: Đặt lại
x-i18n:
    generated_at: "2026-04-29T22:33:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4a4aba32fb44905d079bf2a22e582a3affbe9809eac9af237ce3e48da72b42c
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

Đặt lại cấu hình/trạng thái cục bộ (giữ CLI đã cài đặt).

Tùy chọn:

- `--scope <scope>`: `config`, `config+creds+sessions`, hoặc `full`
- `--yes`: bỏ qua lời nhắc xác nhận
- `--non-interactive`: tắt lời nhắc; yêu cầu `--scope` và `--yes`
- `--dry-run`: in ra các hành động mà không xóa tệp

Ví dụ:

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

Ghi chú:

- Chạy `openclaw backup create` trước nếu bạn muốn có một bản chụp có thể khôi phục trước khi xóa trạng thái cục bộ.
- Nếu bạn bỏ qua `--scope`, `openclaw reset` sử dụng lời nhắc tương tác để chọn nội dung cần xóa.
- `--non-interactive` chỉ hợp lệ khi cả `--scope` và `--yes` đều được đặt.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
