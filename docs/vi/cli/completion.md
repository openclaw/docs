---
read_when:
    - Bạn muốn tính năng tự động hoàn thành lệnh shell cho zsh/bash/fish/PowerShell
    - Bạn cần lưu các tập lệnh hoàn thành vào bộ nhớ đệm trong trạng thái OpenClaw
summary: Tài liệu tham khảo CLI cho `openclaw completion` (tạo/cài đặt các tập lệnh tự động hoàn thành lệnh shell)
title: Hoàn thành
x-i18n:
    generated_at: "2026-07-12T07:46:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67cb52a47036745150887c752d18e2dfa84fab2722c27c696142d23080bb2efd
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

Tạo các tập lệnh hoàn thành lệnh cho shell, lưu chúng vào bộ nhớ đệm trong trạng thái OpenClaw và tùy chọn cài đặt chúng vào hồ sơ shell của bạn.

## Cách sử dụng

```bash
openclaw completion                          # in tập lệnh zsh ra stdout
openclaw completion --shell fish             # in tập lệnh fish
openclaw completion --write-state            # lưu tập lệnh vào bộ nhớ đệm cho mọi shell
openclaw completion --write-state --install  # lưu vào bộ nhớ đệm, rồi cài đặt trong một bước
openclaw completion --shell bash --write-state
```

## Tùy chọn

- `-s, --shell <shell>`: shell đích (`zsh`, `bash`, `powershell`, `fish`; mặc định: `zsh`)
- `-i, --install`: cài đặt tính năng hoàn thành lệnh bằng cách thêm một dòng source cho tập lệnh đã lưu vào bộ nhớ đệm vào hồ sơ shell của bạn
- `--write-state`: ghi tập lệnh hoàn thành lệnh vào `$OPENCLAW_STATE_DIR/completions` (mặc định là `~/.openclaw/completions`) mà không in ra stdout; khi có `--shell`, chỉ ghi cho shell đó, nếu không sẽ ghi cho cả bốn shell
- `-y, --yes`: bỏ qua lời nhắc xác nhận cài đặt (không tương tác)

## Quy trình cài đặt

`--install` trỏ hồ sơ của bạn đến tập lệnh đã lưu vào bộ nhớ đệm, vì vậy bộ nhớ đệm phải tồn tại trước: nếu chưa có, lệnh sẽ thất bại và yêu cầu bạn chạy `openclaw completion --write-state`. Kết hợp `--write-state --install` để thực hiện cả hai trong một bước. Khi không có `--shell`, `--install` phát hiện shell từ `$SHELL` (dùng zsh làm phương án dự phòng).

Quá trình cài đặt ghi một khối `# OpenClaw Completion` nhỏ vào hồ sơ shell của bạn và thay thế mọi dòng `source <(openclaw completion ...)` cũ, chậm bằng dòng source đã lưu vào bộ nhớ đệm:

| Shell      | Hồ sơ                                                                                                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bash       | `~/.bashrc` (dùng `~/.bash_profile` làm phương án dự phòng khi không có `~/.bashrc`)                                                                                                       |
| fish       | `~/.config/fish/config.fish`                                                                                                                                                               |
| powershell | `~/.config/powershell/Microsoft.PowerShell_profile.ps1` (trên Windows: `Documents/PowerShell/Microsoft.PowerShell_profile.ps1`, hoặc `Documents/WindowsPowerShell/...` đối với Windows PowerShell) |
| zsh        | `~/.zshrc`                                                                                                                                                                                 |

## Ghi chú

- Khi không có `--install` hoặc `--write-state`, lệnh sẽ in tập lệnh ra stdout.
- Quá trình tạo tính năng hoàn thành lệnh chủ động tải toàn bộ cây lệnh, bao gồm các lệnh CLI của plugin, vì vậy các lệnh con lồng nhau cũng được đưa vào.
- `openclaw update` tự động làm mới bộ nhớ đệm hoàn thành lệnh sau khi cập nhật thành công; `openclaw doctor` có thể sửa chữa các thiết lập hoàn thành lệnh bị thiếu hoặc lỗi thời.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
