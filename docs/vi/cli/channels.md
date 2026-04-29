---
read_when:
    - Bạn muốn thêm/xóa tài khoản kênh (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Bạn muốn kiểm tra trạng thái kênh hoặc theo dõi nhật ký kênh
summary: Tham chiếu CLI cho `openclaw channels` (tài khoản, trạng thái, đăng nhập/đăng xuất, nhật ký)
title: Kênh
x-i18n:
    generated_at: "2026-04-29T22:30:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc3c5983114c17e0e7284450aa161b658312c05864db65e09d6d764e357cd1f
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Quản lý tài khoản kênh chat và trạng thái runtime của chúng trên Gateway.

Tài liệu liên quan:

- Hướng dẫn kênh: [Kênh](/vi/channels)
- Cấu hình Gateway: [Cấu hình](/vi/gateway/configuration)

## Lệnh thường dùng

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Trạng thái / khả năng / phân giải / nhật ký

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (chỉ với `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` là đường dẫn trực tiếp: trên một Gateway có thể truy cập, lệnh này chạy các kiểm tra `probeAccount` theo từng tài khoản và `auditAccount` tùy chọn, vì vậy đầu ra có thể bao gồm trạng thái transport cùng với kết quả thăm dò như `works`, `probe failed`, `audit ok` hoặc `audit failed`. Nếu Gateway không thể truy cập, `channels status` sẽ chuyển sang các bản tóm tắt chỉ dựa trên cấu hình thay vì đầu ra thăm dò trực tiếp.

## Thêm / xóa tài khoản

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` hiển thị các cờ theo từng kênh (token, khóa riêng tư, app token, đường dẫn signal-cli, v.v.).
</Tip>

Các bề mặt thêm không tương tác thường gặp bao gồm:

- kênh bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Trường transport Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Trường Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Trường Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Trường Nostr: `--private-key`, `--relay-urls`
- Trường Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` cho xác thực tài khoản mặc định dựa trên env khi được hỗ trợ

Nếu một Plugin kênh cần được cài đặt trong quá trình chạy lệnh thêm bằng cờ, OpenClaw sẽ dùng nguồn cài đặt mặc định của kênh đó mà không mở lời nhắc cài đặt Plugin tương tác.

Khi bạn chạy `openclaw channels add` không có cờ, trình hướng dẫn tương tác có thể nhắc:

- mã định danh tài khoản cho từng kênh đã chọn
- tên hiển thị tùy chọn cho các tài khoản đó
- `Bind configured channel accounts to agents now?`

Nếu bạn xác nhận liên kết ngay, trình hướng dẫn sẽ hỏi agent nào nên sở hữu từng tài khoản kênh đã cấu hình và ghi các liên kết định tuyến theo phạm vi tài khoản.

Bạn cũng có thể quản lý các quy tắc định tuyến tương tự sau này bằng `openclaw agents bindings`, `openclaw agents bind` và `openclaw agents unbind` (xem [agents](/vi/cli/agents)).

Khi bạn thêm một tài khoản không mặc định vào kênh vẫn đang dùng thiết lập cấp cao nhất cho một tài khoản, OpenClaw sẽ chuyển các giá trị cấp cao nhất theo phạm vi tài khoản vào map tài khoản của kênh trước khi ghi tài khoản mới. Hầu hết các kênh đặt các giá trị đó vào `channels.<channel>.accounts.default`, nhưng các kênh đi kèm có thể giữ lại một tài khoản được thăng cấp hiện có nếu khớp. Matrix là ví dụ hiện tại: nếu đã tồn tại một tài khoản có tên, hoặc `defaultAccount` trỏ đến một tài khoản có tên hiện có, quá trình thăng cấp sẽ giữ lại tài khoản đó thay vì tạo `accounts.default` mới.

Hành vi định tuyến vẫn nhất quán:

- Các liên kết chỉ theo kênh hiện có (không có `accountId`) tiếp tục khớp với tài khoản mặc định.
- `channels add` không tự động tạo hoặc ghi lại các liên kết ở chế độ không tương tác.
- Thiết lập tương tác có thể tùy chọn thêm các liên kết theo phạm vi tài khoản.

Nếu cấu hình của bạn đã ở trạng thái hỗn hợp (có tài khoản có tên và các giá trị một tài khoản cấp cao nhất vẫn được đặt), hãy chạy `openclaw doctor --fix` để di chuyển các giá trị theo phạm vi tài khoản vào tài khoản được thăng cấp đã chọn cho kênh đó. Hầu hết các kênh thăng cấp vào `accounts.default`; Matrix có thể giữ lại một mục tiêu có tên/mặc định hiện có thay vào đó.

## Đăng nhập và đăng xuất (tương tác)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` hỗ trợ `--verbose`.
- `channels login` và `logout` có thể suy ra kênh khi chỉ cấu hình một mục tiêu đăng nhập được hỗ trợ.
- Chạy `channels login` từ terminal trên máy chủ Gateway. Agent `exec` chặn luồng đăng nhập tương tác này; nên dùng các công cụ đăng nhập agent gốc của kênh, chẳng hạn như `whatsapp_login`, từ chat khi có sẵn.

## Khắc phục sự cố

- Chạy `openclaw status --deep` để thăm dò rộng.
- Dùng `openclaw doctor` để sửa lỗi có hướng dẫn.
- `openclaw channels list` in `Claude: HTTP 403 ... user:profile` → ảnh chụp nhanh mức sử dụng cần phạm vi `user:profile`. Dùng `--no-usage`, hoặc cung cấp khóa phiên claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), hoặc xác thực lại qua Claude CLI.
- `openclaw channels status` chuyển sang các bản tóm tắt chỉ dựa trên cấu hình khi Gateway không thể truy cập. Nếu thông tin xác thực của kênh được hỗ trợ được cấu hình qua SecretRef nhưng không có sẵn trong đường dẫn lệnh hiện tại, lệnh sẽ báo cáo tài khoản đó là đã cấu hình kèm ghi chú suy giảm thay vì hiển thị là chưa cấu hình.

## Thăm dò khả năng

Lấy các gợi ý khả năng của nhà cung cấp (intent/phạm vi khi có sẵn) cùng với hỗ trợ tính năng tĩnh:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Ghi chú:

- `--channel` là tùy chọn; bỏ qua để liệt kê mọi kênh (bao gồm plugins).
- `--account` chỉ hợp lệ với `--channel`.
- `--target` chấp nhận `channel:<id>` hoặc mã định danh kênh dạng số thô và chỉ áp dụng cho Discord.
- Các thăm dò phụ thuộc vào nhà cung cấp: Discord intents + quyền kênh tùy chọn; phạm vi Slack bot + user; cờ Telegram bot + Webhook; phiên bản daemon Signal; app token Microsoft Teams + vai trò/phạm vi Graph (được chú thích khi biết). Các kênh không có thăm dò sẽ báo cáo `Probe: unavailable`.

## Phân giải tên thành ID

Phân giải tên kênh/người dùng thành ID bằng thư mục của nhà cung cấp:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Ghi chú:

- Dùng `--kind user|group|auto` để buộc kiểu mục tiêu.
- Việc phân giải ưu tiên các kết quả khớp đang hoạt động khi nhiều mục có cùng tên.
- `channels resolve` là chỉ đọc. Nếu một tài khoản được chọn được cấu hình qua SecretRef nhưng thông tin xác thực đó không có sẵn trong đường dẫn lệnh hiện tại, lệnh sẽ trả về các kết quả chưa phân giải bị suy giảm kèm ghi chú thay vì hủy toàn bộ lần chạy.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tổng quan về kênh](/vi/channels)
