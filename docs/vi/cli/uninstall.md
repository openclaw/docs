---
read_when:
    - Bạn muốn gỡ bỏ dịch vụ Gateway và/hoặc trạng thái cục bộ
    - Bạn muốn chạy thử trước
summary: Tham chiếu CLI cho `openclaw uninstall` (xóa dịch vụ gateway + dữ liệu cục bộ)
title: Gỡ cài đặt
x-i18n:
    generated_at: "2026-06-27T17:21:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f90fa8cf513e2e8cd422c3b8a880e7fd20fb71131a3ec88260e765daa2ace543
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Gỡ cài đặt dịch vụ gateway + dữ liệu cục bộ (CLI vẫn được giữ lại).

Tùy chọn:

- `--service`: xóa dịch vụ gateway
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

- Chạy `openclaw backup create` trước nếu bạn muốn có một bản chụp có thể khôi phục trước khi xóa trạng thái hoặc workspace.
- `--state` giữ lại các thư mục workspace đã cấu hình trừ khi `--workspace` cũng được chọn.
- `--all` là cách viết tắt để xóa dịch vụ, trạng thái, workspace và ứng dụng cùng lúc.
- `--non-interactive` yêu cầu `--yes`.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Gỡ cài đặt](/vi/install/uninstall)
