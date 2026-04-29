---
read_when:
    - Bạn muốn gỡ bỏ dịch vụ Gateway và/hoặc xóa trạng thái cục bộ
    - Bạn muốn chạy thử trước
summary: Tham chiếu CLI cho `openclaw uninstall` (xóa dịch vụ Gateway + dữ liệu cục bộ)
title: Gỡ cài đặt
x-i18n:
    generated_at: "2026-04-29T22:35:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: b774fc006e989068b9126aff2a72888fd808a2e0e3d5ea8b57e6ab9d9f1b63ee
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Gỡ cài đặt dịch vụ Gateway + dữ liệu cục bộ (CLI vẫn giữ nguyên).

Tùy chọn:

- `--service`: xóa dịch vụ Gateway
- `--state`: xóa trạng thái và cấu hình
- `--workspace`: xóa các thư mục workspace
- `--app`: xóa ứng dụng macOS
- `--all`: xóa dịch vụ, trạng thái, workspace và ứng dụng
- `--yes`: bỏ qua lời nhắc xác nhận
- `--non-interactive`: tắt lời nhắc; yêu cầu `--yes`
- `--dry-run`: in các hành động mà không xóa tệp

Ví dụ:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

Ghi chú:

- Chạy `openclaw backup create` trước nếu bạn muốn có một bản snapshot có thể khôi phục trước khi xóa trạng thái hoặc workspace.
- `--all` là cách viết tắt để xóa dịch vụ, trạng thái, workspace và ứng dụng cùng lúc.
- `--non-interactive` yêu cầu `--yes`.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Gỡ cài đặt](/vi/install/uninstall)
