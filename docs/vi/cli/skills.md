---
read_when:
    - Bạn muốn xem các Skills nào có sẵn và sẵn sàng chạy
    - Bạn muốn tìm kiếm, cài đặt hoặc cập nhật Skills từ ClawHub
    - Bạn muốn gỡ lỗi khi thiếu tệp nhị phân/biến môi trường/cấu hình cho Skills
summary: Tham chiếu CLI cho `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-05-10T19:29:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90663068f51cd3aabe9cfcf60e319ce9f9016e338488797869162608132a9e87
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Kiểm tra Skills cục bộ và cài đặt/cập nhật Skills từ ClawHub.

Liên quan:

- Hệ thống Skills: [Skills](/vi/tools/skills)
- Cấu hình Skills: [Cấu hình Skills](/vi/tools/skills-config)
- Cài đặt ClawHub: [ClawHub](/vi/clawhub/cli)

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
tra các Skills cục bộ hiển thị với không gian làm việc và cấu hình hiện tại. Các
lệnh dựa trên không gian làm việc phân giải không gian làm việc đích từ
`--agent <id>`, rồi đến thư mục làm việc hiện tại khi thư mục đó nằm trong một
không gian làm việc tác tử đã cấu hình, rồi đến tác tử mặc định.

Lệnh CLI `install` này tải các thư mục Skills từ ClawHub. Các cài đặt phụ thuộc
Skills do Gateway hỗ trợ, được kích hoạt từ quá trình thiết lập ban đầu hoặc phần
cài đặt Skills, dùng đường dẫn yêu cầu `skills.install` riêng.

Ghi chú:

- `search [query...]` chấp nhận một truy vấn tùy chọn; bỏ qua để duyệt nguồn cấp
  tìm kiếm ClawHub mặc định.
- `search --limit <n>` giới hạn số kết quả được trả về.
- `install --force` ghi đè thư mục Skills hiện có trong không gian làm việc cho
  cùng slug.
- `--agent <id>` nhắm đến một không gian làm việc tác tử đã cấu hình và ghi đè
  suy luận từ thư mục làm việc hiện tại.
- `update --all` chỉ cập nhật các bản cài đặt ClawHub được theo dõi trong không
  gian làm việc đang hoạt động.
- `check --agent <id>` kiểm tra không gian làm việc của tác tử đã chọn và báo cáo
  những Skills sẵn sàng nào thực sự hiển thị với prompt hoặc bề mặt lệnh của tác
  tử đó.
- `list` là hành động mặc định khi không cung cấp lệnh con.
- `list`, `info`, và `check` ghi đầu ra đã kết xuất vào stdout. Với `--json`,
  điều đó nghĩa là payload có thể đọc bằng máy vẫn ở stdout cho pipe và script.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Skills](/vi/tools/skills)
