---
read_when:
    - Bạn muốn thêm/xóa tài khoản kênh (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Bạn muốn kiểm tra trạng thái kênh hoặc theo dõi nhật ký kênh
summary: Tài liệu tham khảo CLI cho `openclaw channels` (tài khoản, trạng thái, đăng nhập/đăng xuất, nhật ký)
title: Kênh
x-i18n:
    generated_at: "2026-05-07T13:13:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: a78d7a5306c822314052151e0a9aa8bed347481f59d9a19f92240dfa562e4b23
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Quản lý tài khoản kênh trò chuyện và trạng thái runtime của chúng trên Gateway.

Tài liệu liên quan:

- Hướng dẫn kênh: [Kênh](/vi/channels)
- Cấu hình Gateway: [Cấu hình](/vi/gateway/configuration)

## Lệnh thường dùng

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` chỉ hiển thị các kênh trò chuyện: mặc định là các tài khoản đã cấu hình, với thẻ trạng thái `installed`, `configured` và `enabled` cho từng tài khoản. Truyền `--all` để cũng hiển thị các kênh đi kèm chưa có tài khoản được cấu hình và các kênh trong catalog có thể cài đặt nhưng chưa có trên ổ đĩa. Nhà cung cấp xác thực (OAuth + khóa API) và ảnh chụp nhanh mức sử dụng/hạn mức của nhà cung cấp mô hình không còn được in ở đây; dùng `openclaw models auth list` cho hồ sơ xác thực nhà cung cấp và `openclaw status` hoặc `openclaw models list` cho mức sử dụng.

## Trạng thái / khả năng / phân giải / nhật ký

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (chỉ với `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` là đường dẫn trực tiếp: trên Gateway có thể truy cập, lệnh này chạy các kiểm tra `probeAccount` theo từng tài khoản và `auditAccount` tùy chọn, vì vậy đầu ra có thể bao gồm trạng thái truyền tải cùng kết quả probe như `works`, `probe failed`, `audit ok` hoặc `audit failed`. Nếu không thể truy cập Gateway, `channels status` quay về các bản tóm tắt chỉ dựa trên cấu hình thay vì đầu ra probe trực tiếp.

Không dùng `openclaw sessions`, Gateway `sessions.list` hoặc công cụ `sessions_list` của agent làm tín hiệu sức khỏe socket kênh. Các bề mặt đó báo cáo các hàng hội thoại đã lưu, không phải trạng thái runtime của nhà cung cấp. Sau khi nhà cung cấp Discord khởi động lại, một tài khoản đã kết nối nhưng yên lặng có thể vẫn khỏe mạnh trong khi không có hàng phiên Discord nào xuất hiện cho đến sự kiện hội thoại đến hoặc đi tiếp theo.

## Thêm / xóa tài khoản

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` hiển thị các cờ theo từng kênh (token, khóa riêng tư, app token, đường dẫn signal-cli, v.v.).
</Tip>

`channels remove` chỉ hoạt động trên các Plugin kênh đã cài đặt/cấu hình. Dùng `channels add` trước cho các kênh trong catalog có thể cài đặt.
Đối với các Plugin kênh được runtime hỗ trợ, `channels remove` cũng yêu cầu Gateway đang chạy dừng tài khoản đã chọn trước khi cập nhật cấu hình, vì vậy việc vô hiệu hóa hoặc xóa tài khoản sẽ không để listener cũ tiếp tục hoạt động cho đến khi khởi động lại.

Các bề mặt thêm không tương tác thường dùng gồm:

- kênh bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Trường truyền tải Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Trường Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Trường Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Trường Nostr: `--private-key`, `--relay-urls`
- Trường Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` cho xác thực tài khoản mặc định dựa trên env ở nơi được hỗ trợ

Nếu cần cài đặt một Plugin kênh trong lệnh thêm điều khiển bằng cờ, OpenClaw dùng nguồn cài đặt mặc định của kênh mà không mở lời nhắc cài đặt Plugin tương tác.

Khi bạn chạy `openclaw channels add` mà không có cờ, trình hướng dẫn tương tác có thể nhắc:

- id tài khoản cho từng kênh đã chọn
- tên hiển thị tùy chọn cho các tài khoản đó
- `Bind configured channel accounts to agents now?`

Nếu bạn xác nhận liên kết ngay, trình hướng dẫn sẽ hỏi agent nào nên sở hữu từng tài khoản kênh đã cấu hình và ghi các liên kết định tuyến theo phạm vi tài khoản.

Bạn cũng có thể quản lý các quy tắc định tuyến tương tự sau này bằng `openclaw agents bindings`, `openclaw agents bind` và `openclaw agents unbind` (xem [agent](/vi/cli/agents)).

Khi bạn thêm một tài khoản không mặc định vào kênh vẫn đang dùng thiết lập cấp cao nhất cho một tài khoản, OpenClaw thăng cấp các giá trị cấp cao nhất theo phạm vi tài khoản vào bản đồ tài khoản của kênh trước khi ghi tài khoản mới. Hầu hết kênh đặt các giá trị đó vào `channels.<channel>.accounts.default`, nhưng các kênh đi kèm có thể giữ lại một tài khoản đã thăng cấp khớp sẵn có. Matrix là ví dụ hiện tại: nếu một tài khoản có tên đã tồn tại, hoặc `defaultAccount` trỏ đến một tài khoản có tên đã tồn tại, việc thăng cấp sẽ giữ tài khoản đó thay vì tạo `accounts.default` mới.

Hành vi định tuyến vẫn nhất quán:

- Các liên kết chỉ theo kênh hiện có (không có `accountId`) tiếp tục khớp với tài khoản mặc định.
- `channels add` không tự động tạo hoặc viết lại liên kết ở chế độ không tương tác.
- Thiết lập tương tác có thể tùy chọn thêm các liên kết theo phạm vi tài khoản.

Nếu cấu hình của bạn đã ở trạng thái hỗn hợp (có tài khoản đặt tên và các giá trị một tài khoản cấp cao nhất vẫn được đặt), chạy `openclaw doctor --fix` để chuyển các giá trị theo phạm vi tài khoản vào tài khoản đã thăng cấp được chọn cho kênh đó. Hầu hết kênh thăng cấp vào `accounts.default`; Matrix có thể giữ lại mục tiêu có tên/mặc định đã tồn tại.

## Đăng nhập và đăng xuất (tương tác)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` hỗ trợ `--verbose`.
- `channels login` và `logout` có thể suy luận kênh khi chỉ có một mục tiêu đăng nhập được hỗ trợ đã cấu hình.
- `channels logout` ưu tiên đường dẫn Gateway trực tiếp khi có thể truy cập, nên đăng xuất sẽ dừng mọi listener đang hoạt động trước khi xóa trạng thái xác thực kênh. Nếu không thể truy cập Gateway cục bộ, lệnh quay về dọn dẹp xác thực cục bộ.
- Chạy `channels login` từ terminal trên máy chủ gateway. Agent `exec` chặn luồng đăng nhập tương tác này; nên dùng các công cụ đăng nhập agent gốc theo kênh, chẳng hạn như `whatsapp_login`, từ cuộc trò chuyện khi có sẵn.

## Khắc phục sự cố

- Chạy `openclaw status --deep` để probe rộng.
- Dùng `openclaw doctor` để sửa lỗi có hướng dẫn.
- `openclaw channels list` không còn in ảnh chụp nhanh mức sử dụng/hạn mức nhà cung cấp mô hình. Với các thông tin đó, dùng `openclaw status` (tổng quan) hoặc `openclaw models list` (theo từng nhà cung cấp).
- `openclaw channels status` quay về các bản tóm tắt chỉ dựa trên cấu hình khi không thể truy cập gateway. Nếu thông tin xác thực kênh được hỗ trợ được cấu hình qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại, lệnh sẽ báo cáo tài khoản đó là đã cấu hình kèm ghi chú suy giảm thay vì hiển thị là chưa cấu hình.

## Probe khả năng

Lấy gợi ý khả năng của nhà cung cấp (intents/scopes khi có) cộng với hỗ trợ tính năng tĩnh:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Ghi chú:

- `--channel` là tùy chọn; bỏ qua để liệt kê mọi kênh (bao gồm extensions).
- `--account` chỉ hợp lệ với `--channel`.
- `--target` chấp nhận `channel:<id>` hoặc id kênh dạng số thô và chỉ áp dụng cho Discord. Với kênh thoại Discord, kiểm tra quyền sẽ đánh dấu thiếu `ViewChannel`, `Connect`, `Speak`, `SendMessages` và `ReadMessageHistory`.
- Probe là đặc thù theo nhà cung cấp: Discord intents + quyền kênh tùy chọn; Slack bot + user scopes; cờ bot Telegram + webhook; phiên bản daemon Signal; app token Microsoft Teams + vai trò/phạm vi Graph (được chú thích khi biết). Các kênh không có probe báo cáo `Probe: unavailable`.

## Phân giải tên thành ID

Phân giải tên kênh/người dùng thành ID bằng thư mục nhà cung cấp:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Ghi chú:

- Dùng `--kind user|group|auto` để ép kiểu mục tiêu.
- Phân giải ưu tiên các kết quả khớp đang hoạt động khi nhiều mục có cùng tên.
- `channels resolve` là chỉ đọc. Nếu một tài khoản đã chọn được cấu hình qua SecretRef nhưng thông tin xác thực đó không khả dụng trong đường dẫn lệnh hiện tại, lệnh trả về kết quả chưa phân giải bị suy giảm kèm ghi chú thay vì hủy toàn bộ lần chạy.
- `channels resolve` không cài đặt Plugin kênh. Dùng `channels add --channel <name>` trước khi phân giải tên cho một kênh trong catalog có thể cài đặt.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tổng quan kênh](/vi/channels)
