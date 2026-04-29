---
read_when:
    - Bạn muốn tính năng tự động hoàn thành shell cho zsh/bash/fish/PowerShell
    - Bạn cần lưu vào bộ nhớ đệm các script tự động hoàn thành dưới trạng thái OpenClaw
summary: Tham chiếu CLI cho `openclaw completion` (tạo/cài đặt các script hoàn tất shell)
title: Hoàn tất
x-i18n:
    generated_at: "2026-04-29T22:30:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d064723b97f09105154197e4ef35b98ccb61e4b775f3fd990b18958f751f713
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

Tạo các script tự động hoàn thành cho shell và tùy chọn cài đặt chúng vào hồ sơ shell của bạn.

## Cách sử dụng

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## Tùy chọn

- `-s, --shell <shell>`: shell đích (`zsh`, `bash`, `powershell`, `fish`; mặc định: `zsh`)
- `-i, --install`: cài đặt tự động hoàn thành bằng cách thêm một dòng source vào hồ sơ shell của bạn
- `--write-state`: ghi script tự động hoàn thành vào `$OPENCLAW_STATE_DIR/completions` mà không in ra stdout
- `-y, --yes`: bỏ qua lời nhắc xác nhận cài đặt

## Ghi chú

- `--install` ghi một khối nhỏ "OpenClaw Completion" vào hồ sơ shell của bạn và trỏ khối đó tới script đã lưu trong bộ nhớ đệm.
- Nếu không có `--install` hoặc `--write-state`, lệnh sẽ in script ra stdout.
- Việc tạo tự động hoàn thành sẽ tải trước cây lệnh để bao gồm cả các lệnh con lồng nhau.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
