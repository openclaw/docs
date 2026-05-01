---
read_when:
    - Bạn muốn thêm/xóa tài khoản kênh (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Bạn muốn kiểm tra trạng thái kênh hoặc theo dõi nhật ký kênh
summary: Tham chiếu CLI cho `openclaw channels` (tài khoản, trạng thái, đăng nhập/đăng xuất, nhật ký)
title: Kênh
x-i18n:
    generated_at: "2026-05-01T10:46:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f673a626b46cd4c8ba7eb28963d27e7e3f630dd86723332faab9b4c86553da9
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

`channels status --probe` là đường dẫn trực tiếp: trên một gateway có thể truy cập, lệnh này chạy các kiểm tra `probeAccount` và `auditAccount` tùy chọn theo từng tài khoản, vì vậy đầu ra có thể bao gồm trạng thái transport cùng kết quả kiểm tra như `works`, `probe failed`, `audit ok`, hoặc `audit failed`.
Nếu không thể truy cập gateway, `channels status` sẽ chuyển sang phần tóm tắt chỉ dựa trên cấu hình thay vì đầu ra kiểm tra trực tiếp.

## Thêm / xóa tài khoản

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` hiển thị các cờ theo từng kênh (token, khóa riêng tư, app token, đường dẫn signal-cli, v.v.).
</Tip>

`channels remove` chỉ hoạt động trên các channel plugin đã cài đặt/cấu hình. Hãy dùng `channels add` trước cho các kênh trong danh mục có thể cài đặt.

Các bề mặt thêm không tương tác thường gặp bao gồm:

- kênh bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Trường transport của Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Trường Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Trường Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Trường Nostr: `--private-key`, `--relay-urls`
- Trường Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` cho xác thực tài khoản mặc định dựa trên env ở nơi được hỗ trợ

Nếu một channel plugin cần được cài đặt trong khi chạy lệnh thêm bằng cờ, OpenClaw sử dụng nguồn cài đặt mặc định của kênh mà không mở lời nhắc cài đặt Plugin tương tác.

Khi bạn chạy `openclaw channels add` không có cờ, trình hướng dẫn tương tác có thể nhắc:

- mã định danh tài khoản cho mỗi kênh đã chọn
- tên hiển thị tùy chọn cho các tài khoản đó
- `Bind configured channel accounts to agents now?`

Nếu bạn xác nhận liên kết ngay, trình hướng dẫn sẽ hỏi agent nào nên sở hữu từng tài khoản kênh đã cấu hình và ghi các liên kết định tuyến theo phạm vi tài khoản.

Bạn cũng có thể quản lý các quy tắc định tuyến tương tự sau này bằng `openclaw agents bindings`, `openclaw agents bind`, và `openclaw agents unbind` (xem [agents](/vi/cli/agents)).

Khi bạn thêm một tài khoản không mặc định vào một kênh vẫn đang dùng thiết lập cấp cao nhất cho một tài khoản, OpenClaw nâng cấp các giá trị cấp cao nhất theo phạm vi tài khoản vào bản đồ tài khoản của kênh trước khi ghi tài khoản mới. Hầu hết kênh đặt các giá trị đó vào `channels.<channel>.accounts.default`, nhưng các kênh đi kèm có thể giữ lại một tài khoản được nâng cấp đang khớp hiện có. Matrix là ví dụ hiện tại: nếu đã có một tài khoản được đặt tên, hoặc `defaultAccount` trỏ tới một tài khoản được đặt tên hiện có, quá trình nâng cấp sẽ giữ tài khoản đó thay vì tạo `accounts.default` mới.

Hành vi định tuyến vẫn nhất quán:

- Các liên kết chỉ theo kênh hiện có (không có `accountId`) tiếp tục khớp với tài khoản mặc định.
- `channels add` không tự động tạo hoặc ghi lại liên kết ở chế độ không tương tác.
- Thiết lập tương tác có thể tùy chọn thêm liên kết theo phạm vi tài khoản.

Nếu cấu hình của bạn đã ở trạng thái hỗn hợp (có tài khoản được đặt tên và các giá trị một tài khoản cấp cao nhất vẫn được đặt), hãy chạy `openclaw doctor --fix` để di chuyển các giá trị theo phạm vi tài khoản vào tài khoản được nâng cấp đã chọn cho kênh đó. Hầu hết kênh nâng cấp vào `accounts.default`; Matrix có thể giữ lại đích được đặt tên/mặc định hiện có thay thế.

## Đăng nhập và đăng xuất (tương tác)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` hỗ trợ `--verbose`.
- `channels login` và `logout` có thể suy ra kênh khi chỉ một đích đăng nhập được hỗ trợ đã được cấu hình.
- Chạy `channels login` từ terminal trên máy chủ gateway. Agent `exec` chặn luồng đăng nhập tương tác này; nên dùng các công cụ đăng nhập agent gốc của kênh, chẳng hạn như `whatsapp_login`, từ chat khi có sẵn.

## Khắc phục sự cố

- Chạy `openclaw status --deep` để kiểm tra rộng.
- Dùng `openclaw doctor` để sửa lỗi có hướng dẫn.
- `openclaw channels list` in `Claude: HTTP 403 ... user:profile` → ảnh chụp nhanh mức sử dụng cần scope `user:profile`. Dùng `--no-usage`, hoặc cung cấp khóa phiên claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), hoặc xác thực lại qua Claude CLI.
- `openclaw channels status` chuyển sang phần tóm tắt chỉ dựa trên cấu hình khi không thể truy cập gateway. Nếu thông tin xác thực kênh được hỗ trợ được cấu hình qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại, lệnh sẽ báo cáo tài khoản đó là đã cấu hình kèm ghi chú suy giảm thay vì hiển thị là chưa cấu hình.

## Kiểm tra khả năng

Lấy các gợi ý khả năng của nhà cung cấp (intents/scopes khi có) cùng hỗ trợ tính năng tĩnh:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Ghi chú:

- `--channel` là tùy chọn; bỏ qua để liệt kê mọi kênh (bao gồm extensions).
- `--account` chỉ hợp lệ với `--channel`.
- `--target` chấp nhận `channel:<id>` hoặc mã định danh kênh số thô và chỉ áp dụng cho Discord.
- Các phép kiểm tra phụ thuộc vào nhà cung cấp: Discord intents + quyền kênh tùy chọn; Slack bot + user scopes; cờ bot Telegram + webhook; phiên bản daemon Signal; app token Microsoft Teams + vai trò/scopes Graph (được chú thích khi biết). Các kênh không có phép kiểm tra báo cáo `Probe: unavailable`.

## Phân giải tên thành ID

Phân giải tên kênh/người dùng thành ID bằng thư mục của nhà cung cấp:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Ghi chú:

- Dùng `--kind user|group|auto` để ép buộc loại đích.
- Quá trình phân giải ưu tiên các kết quả khớp đang hoạt động khi nhiều mục có cùng tên.
- `channels resolve` là chỉ đọc. Nếu tài khoản đã chọn được cấu hình qua SecretRef nhưng thông tin xác thực đó không khả dụng trong đường dẫn lệnh hiện tại, lệnh trả về kết quả chưa phân giải bị suy giảm kèm ghi chú thay vì hủy toàn bộ lượt chạy.
- `channels resolve` không cài đặt channel plugin. Dùng `channels add --channel <name>` trước khi phân giải tên cho một kênh trong danh mục có thể cài đặt.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tổng quan kênh](/vi/channels)
