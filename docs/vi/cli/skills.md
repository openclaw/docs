---
read_when:
    - Bạn muốn xem các Skills hiện có và sẵn sàng chạy
    - Bạn muốn tìm kiếm, cài đặt hoặc cập nhật Skills từ ClawHub
    - Bạn muốn gỡ lỗi các tệp nhị phân, môi trường hoặc cấu hình bị thiếu cho Skills
summary: Tham chiếu CLI cho `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-05-02T20:43:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: d819cdc421151a0093423f57a9e974489e9cc02de644358bd5700ee75181192e
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
openclaw skills check --agent <id>
openclaw skills check --json
```

`search`/`install`/`update` dùng trực tiếp ClawHub và cài đặt vào thư mục
`skills/` của không gian làm việc đang hoạt động. `list`/`info`/`check` vẫn kiểm
tra các Skills cục bộ hiển thị với không gian làm việc và cấu hình hiện tại.
Các lệnh dựa trên không gian làm việc phân giải không gian làm việc đích từ
`--agent <id>`, sau đó là thư mục làm việc hiện tại khi thư mục đó nằm trong một
không gian làm việc tác nhân đã cấu hình, rồi đến tác nhân mặc định.

Lệnh CLI `install` này tải các thư mục Skills từ ClawHub. Các lượt cài đặt phụ
thuộc Skills dựa trên Gateway, được kích hoạt từ quy trình thiết lập ban đầu
hoặc cài đặt Skills, dùng đường dẫn yêu cầu `skills.install` riêng.

Ghi chú:

- `search [query...]` chấp nhận một truy vấn tùy chọn; bỏ qua để duyệt nguồn cấp
  tìm kiếm ClawHub mặc định.
- `search --limit <n>` giới hạn số kết quả trả về.
- `install --force` ghi đè thư mục Skills hiện có trong không gian làm việc cho
  cùng một slug.
- `--agent <id>` nhắm đến một không gian làm việc tác nhân đã cấu hình và ghi đè
  suy luận từ thư mục làm việc hiện tại.
- `update --all` chỉ cập nhật các bản cài đặt ClawHub được theo dõi trong không
  gian làm việc đang hoạt động.
- `check --agent <id>` kiểm tra không gian làm việc của tác nhân đã chọn và báo
  cáo những Skills sẵn sàng nào thực sự hiển thị với prompt hoặc bề mặt lệnh của
  tác nhân đó.
- `list` là hành động mặc định khi không cung cấp lệnh con.
- `list`, `info` và `check` ghi đầu ra đã kết xuất của chúng vào stdout. Với
  `--json`, điều đó có nghĩa là tải trọng có thể đọc bằng máy vẫn ở trên stdout
  cho pipe và script.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Skills](/vi/tools/skills)
