---
read_when:
    - Bạn muốn thêm/xóa các tài khoản kênh (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Bạn muốn kiểm tra trạng thái kênh hoặc theo dõi nhật ký kênh
summary: Tài liệu tham chiếu CLI cho `openclaw channels` (tài khoản, trạng thái, đăng nhập/đăng xuất, nhật ký)
title: Kênh
x-i18n:
    generated_at: "2026-05-02T10:35:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3aff374e81e0845805b9baf09d6b63dfe8270cb48606f74f3f1f2dcd56b552c4
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Quản lý tài khoản kênh trò chuyện và trạng thái runtime của chúng trên Gateway.

Tài liệu liên quan:

- Hướng dẫn kênh: [Kênh](/vi/channels)
- Cấu hình Gateway: [Cấu hình](/vi/gateway/configuration)

## Lệnh phổ biến

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

`channels status --probe` là đường dẫn trực tiếp: trên một gateway có thể kết nối, lệnh này chạy các kiểm tra `probeAccount` theo từng tài khoản và `auditAccount` tùy chọn, nên đầu ra có thể bao gồm trạng thái truyền tải cùng kết quả thăm dò như `works`, `probe failed`, `audit ok`, hoặc `audit failed`. Nếu không thể kết nối tới gateway, `channels status` sẽ chuyển sang các bản tóm tắt chỉ dựa trên cấu hình thay vì đầu ra thăm dò trực tiếp.

Không dùng `openclaw sessions`, Gateway `sessions.list`, hoặc công cụ `sessions_list` của agent làm tín hiệu tình trạng socket của kênh. Các bề mặt đó báo cáo các hàng hội thoại đã lưu, không phải trạng thái runtime của nhà cung cấp. Sau khi nhà cung cấp Discord khởi động lại, một tài khoản đã kết nối nhưng yên lặng có thể vẫn khỏe mạnh dù không có hàng phiên Discord nào xuất hiện cho đến sự kiện hội thoại đến hoặc đi tiếp theo.

## Thêm / xóa tài khoản

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` hiển thị các cờ theo từng kênh (token, khóa riêng tư, app token, đường dẫn signal-cli, v.v.).
</Tip>

`channels remove` chỉ thao tác trên các Plugin kênh đã cài đặt/cấu hình. Trước tiên hãy dùng `channels add` cho các kênh danh mục có thể cài đặt.
Với các Plugin kênh có runtime hỗ trợ, `channels remove` cũng yêu cầu Gateway đang chạy dừng tài khoản đã chọn trước khi cập nhật cấu hình, nên việc tắt hoặc xóa một tài khoản sẽ không để listener cũ tiếp tục hoạt động cho đến khi khởi động lại.

Các bề mặt thêm không tương tác phổ biến bao gồm:

- kênh bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- trường truyền tải Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- trường Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- trường Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- trường Nostr: `--private-key`, `--relay-urls`
- trường Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` cho xác thực tài khoản mặc định dựa trên env ở nơi được hỗ trợ

Nếu một Plugin kênh cần được cài đặt trong khi chạy lệnh thêm bằng cờ, OpenClaw dùng nguồn cài đặt mặc định của kênh đó mà không mở lời nhắc cài đặt Plugin tương tác.

Khi bạn chạy `openclaw channels add` mà không có cờ, trình hướng dẫn tương tác có thể nhắc:

- id tài khoản cho từng kênh đã chọn
- tên hiển thị tùy chọn cho các tài khoản đó
- `Bind configured channel accounts to agents now?`

Nếu bạn xác nhận liên kết ngay, trình hướng dẫn sẽ hỏi agent nào nên sở hữu từng tài khoản kênh đã cấu hình và ghi các liên kết định tuyến theo phạm vi tài khoản.

Bạn cũng có thể quản lý cùng các quy tắc định tuyến này sau bằng `openclaw agents bindings`, `openclaw agents bind`, và `openclaw agents unbind` (xem [agents](/vi/cli/agents)).

Khi bạn thêm một tài khoản không mặc định vào một kênh vẫn đang dùng thiết lập cấp cao nhất cho một tài khoản, OpenClaw nâng cấp các giá trị cấp cao nhất theo phạm vi tài khoản vào bản đồ tài khoản của kênh trước khi ghi tài khoản mới. Hầu hết các kênh đặt các giá trị đó vào `channels.<channel>.accounts.default`, nhưng các kênh đi kèm có thể giữ lại một tài khoản đã nâng cấp khớp hiện có. Matrix là ví dụ hiện tại: nếu đã có một tài khoản được đặt tên, hoặc `defaultAccount` trỏ đến một tài khoản được đặt tên hiện có, quá trình nâng cấp sẽ giữ tài khoản đó thay vì tạo `accounts.default` mới.

Hành vi định tuyến vẫn nhất quán:

- Các liên kết chỉ theo kênh hiện có (không có `accountId`) tiếp tục khớp với tài khoản mặc định.
- `channels add` không tự động tạo hoặc viết lại liên kết trong chế độ không tương tác.
- Thiết lập tương tác có thể tùy chọn thêm các liên kết theo phạm vi tài khoản.

Nếu cấu hình của bạn đã ở trạng thái hỗn hợp (có tài khoản được đặt tên và các giá trị cấp cao nhất cho một tài khoản vẫn được đặt), chạy `openclaw doctor --fix` để chuyển các giá trị theo phạm vi tài khoản vào tài khoản đã nâng cấp được chọn cho kênh đó. Hầu hết các kênh nâng cấp vào `accounts.default`; Matrix có thể giữ lại một mục tiêu được đặt tên/mặc định hiện có thay thế.

## Đăng nhập và đăng xuất (tương tác)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` hỗ trợ `--verbose`.
- `channels login` và `logout` có thể suy luận kênh khi chỉ có một mục tiêu đăng nhập được hỗ trợ đã cấu hình.
- `channels logout` ưu tiên đường dẫn Gateway trực tiếp khi có thể kết nối, nên đăng xuất sẽ dừng mọi listener đang hoạt động trước khi xóa trạng thái xác thực kênh. Nếu không thể kết nối tới Gateway cục bộ, lệnh sẽ chuyển sang dọn dẹp xác thực cục bộ.
- Chạy `channels login` từ terminal trên máy chủ gateway. Agent `exec` chặn luồng đăng nhập tương tác này; các công cụ đăng nhập agent gốc theo kênh, chẳng hạn `whatsapp_login`, nên được dùng từ trò chuyện khi có sẵn.

## Khắc phục sự cố

- Chạy `openclaw status --deep` để thăm dò rộng.
- Dùng `openclaw doctor` để sửa lỗi có hướng dẫn.
- `openclaw channels list` in `Claude: HTTP 403 ... user:profile` → ảnh chụp nhanh mức sử dụng cần phạm vi `user:profile`. Dùng `--no-usage`, hoặc cung cấp khóa phiên claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), hoặc xác thực lại qua Claude CLI.
- `openclaw channels status` chuyển sang các bản tóm tắt chỉ dựa trên cấu hình khi không thể kết nối tới gateway. Nếu một thông tin xác thực kênh được hỗ trợ được cấu hình qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại, lệnh báo cáo tài khoản đó là đã cấu hình kèm ghi chú suy giảm thay vì hiển thị là chưa cấu hình.

## Thăm dò khả năng

Lấy gợi ý khả năng của nhà cung cấp (intent/phạm vi khi có sẵn) cùng hỗ trợ tính năng tĩnh:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Ghi chú:

- `--channel` là tùy chọn; bỏ qua để liệt kê mọi kênh (bao gồm extensions).
- `--account` chỉ hợp lệ với `--channel`.
- `--target` chấp nhận `channel:<id>` hoặc id kênh số thô và chỉ áp dụng cho Discord.
- Thăm dò tùy theo nhà cung cấp: intent Discord + quyền kênh tùy chọn; phạm vi bot + user của Slack; cờ bot Telegram + Webhook; phiên bản daemon Signal; app token Microsoft Teams + vai trò/phạm vi Graph (được chú thích ở nơi đã biết). Các kênh không có thăm dò báo cáo `Probe: unavailable`.

## Phân giải tên thành ID

Phân giải tên kênh/user thành ID bằng thư mục của nhà cung cấp:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Ghi chú:

- Dùng `--kind user|group|auto` để ép kiểu mục tiêu.
- Phân giải ưu tiên các kết quả khớp đang hoạt động khi nhiều mục chia sẻ cùng tên.
- `channels resolve` là chỉ đọc. Nếu một tài khoản được chọn được cấu hình qua SecretRef nhưng thông tin xác thực đó không khả dụng trong đường dẫn lệnh hiện tại, lệnh trả về kết quả chưa phân giải suy giảm kèm ghi chú thay vì hủy toàn bộ lần chạy.
- `channels resolve` không cài đặt Plugin kênh. Dùng `channels add --channel <name>` trước khi phân giải tên cho một kênh danh mục có thể cài đặt.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tổng quan kênh](/vi/channels)
