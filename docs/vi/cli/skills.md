---
read_when:
    - Bạn muốn xem những Skills nào đang có sẵn và sẵn sàng chạy
    - Bạn muốn tìm kiếm, cài đặt hoặc cập nhật Skills từ ClawHub
    - Bạn muốn gỡ lỗi các tệp nhị phân/biến môi trường/cấu hình bị thiếu cho Skills
summary: Tài liệu tham khảo CLI cho `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-04-29T22:34:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5059bf04c68dabe289d2c376407a52989c970e3d16e7637a2c83f4e24ad6564c
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Kiểm tra Skills cục bộ và cài đặt/cập nhật Skills từ ClawHub.

Liên quan:

- Hệ thống Skills: [Skills](/vi/tools/skills)
- Cấu hình Skills: [Cấu hình Skills](/vi/tools/skills-config)
- Bản cài đặt ClawHub: [ClawHub](/vi/tools/clawhub)

## Lệnh

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills install <slug> --agent <id>
openclaw skills update <slug>
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --json
openclaw skills check --agent <id>
```

`search`/`install`/`update` dùng trực tiếp ClawHub và cài đặt vào thư mục
`skills/` của workspace đang hoạt động. `list`/`info`/`check` vẫn kiểm tra
Skills cục bộ hiển thị với workspace và cấu hình hiện tại. Các lệnh dựa trên
workspace phân giải workspace đích từ `--agent <id>`, sau đó là thư mục làm việc
hiện tại khi nó nằm trong workspace agent đã cấu hình, rồi đến agent mặc định.

Lệnh CLI `install` này tải các thư mục Skills từ ClawHub. Các lần cài đặt phụ
thuộc Skills dựa trên Gateway được kích hoạt từ onboarding hoặc phần cài đặt
Skills sẽ dùng đường dẫn yêu cầu `skills.install` riêng.

Ghi chú:

- `search [query...]` chấp nhận truy vấn tùy chọn; bỏ qua để duyệt feed tìm
  kiếm ClawHub mặc định.
- `search --limit <n>` giới hạn số kết quả trả về.
- `install --force` ghi đè thư mục Skills hiện có trong workspace cho cùng
  slug.
- `--agent <id>` nhắm tới một workspace agent đã cấu hình và ghi đè suy luận
  từ thư mục làm việc hiện tại.
- `update --all` chỉ cập nhật các bản cài đặt ClawHub được theo dõi trong
  workspace đang hoạt động.
- `list` là hành động mặc định khi không cung cấp lệnh con.
- `list`, `info`, và `check` ghi đầu ra đã kết xuất của chúng vào stdout. Với
  `--json`, điều đó có nghĩa là payload máy đọc được vẫn nằm trên stdout cho
  pipe và script.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Skills](/vi/tools/skills)
