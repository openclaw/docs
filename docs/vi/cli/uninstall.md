---
read_when:
    - Bạn muốn xóa dịch vụ Gateway và/hoặc trạng thái cục bộ
    - Bạn muốn chạy thử trước
summary: Tài liệu tham khảo CLI cho `openclaw uninstall` (gỡ bỏ dịch vụ Gateway + dữ liệu cục bộ)
title: Gỡ cài đặt
x-i18n:
    generated_at: "2026-07-12T07:52:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1e2e3996cf6d5c0fd11e5054c8fe60f7f8d25047193bb13944ca170bf77b581a
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Gỡ cài đặt dịch vụ Gateway và/hoặc dữ liệu cục bộ. Bản thân CLI không bị
xóa; hãy gỡ cài đặt riêng qua npm/pnpm.

## Tùy chọn

| Cờ                  | Mặc định | Mô tả                                                   |
| ------------------- | -------- | ------------------------------------------------------- |
| `--service`         | `false`  | Xóa dịch vụ Gateway.                                    |
| `--state`           | `false`  | Xóa trạng thái và cấu hình.                             |
| `--workspace`       | `false`  | Xóa các thư mục không gian làm việc.                    |
| `--app`             | `false`  | Xóa ứng dụng macOS.                                     |
| `--all`             | `false`  | Cách viết tắt của `--service --state --workspace --app`. |
| `--yes`             | `false`  | Bỏ qua lời nhắc xác nhận.                               |
| `--non-interactive` | `false`  | Tắt lời nhắc; yêu cầu `--yes`.                          |
| `--dry-run`         | `false`  | In các thao tác dự kiến mà không xóa tệp.               |

Khi không có cờ phạm vi, một trình chọn nhiều mục tương tác sẽ yêu cầu chọn các thành phần
cần xóa (dịch vụ, trạng thái và không gian làm việc được chọn sẵn theo mặc định).

## Ví dụ

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

## Lưu ý

- Trước tiên, hãy chạy `openclaw backup create` để tạo một bản chụp có thể khôi phục trước khi xóa
  trạng thái hoặc các không gian làm việc.
- `--state` giữ nguyên các thư mục không gian làm việc đã cấu hình, trừ khi
  `--workspace` cũng được chọn.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Gỡ cài đặt](/vi/install/uninstall)
