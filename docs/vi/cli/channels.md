---
read_when:
    - Bạn muốn thêm/xóa các tài khoản kênh (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Bạn muốn kiểm tra trạng thái kênh hoặc theo dõi nhật ký kênh
summary: Tài liệu tham chiếu CLI cho `openclaw channels` (tài khoản, trạng thái, đăng nhập/đăng xuất, nhật ký)
title: Kênh
x-i18n:
    generated_at: "2026-05-11T20:25:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58a964b4db9526defab6ee47b7a99c11086e345d42c8d20f5262fc134337947f
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

`channels list` chỉ hiển thị các kênh trò chuyện: theo mặc định là các tài khoản đã cấu hình, với thẻ trạng thái `installed`, `configured` và `enabled` cho từng tài khoản. Truyền `--all` để cũng hiển thị các kênh đi kèm chưa có tài khoản được cấu hình và các kênh trong catalog có thể cài đặt nhưng chưa có trên đĩa. Nhà cung cấp xác thực (OAuth + khóa API) và ảnh chụp nhanh mức sử dụng/hạn mức của nhà cung cấp mô hình không còn được in ở đây; dùng `openclaw models auth list` cho hồ sơ xác thực nhà cung cấp và `openclaw status` hoặc `openclaw models list` cho mức sử dụng.

## Trạng thái / khả năng / phân giải / nhật ký

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (chỉ với `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` là đường dẫn trực tiếp: trên một gateway có thể truy cập, nó chạy các kiểm tra `probeAccount` theo từng tài khoản và `auditAccount` tùy chọn, nên đầu ra có thể bao gồm trạng thái truyền tải cùng kết quả thăm dò như `works`, `probe failed`, `audit ok` hoặc `audit failed`. Nếu gateway không thể truy cập, `channels status` quay về các bản tóm tắt chỉ dựa trên cấu hình thay vì đầu ra thăm dò trực tiếp.

Không dùng `openclaw sessions`, Gateway `sessions.list` hoặc công cụ agent `sessions_list` làm tín hiệu tình trạng socket của kênh. Các bề mặt đó báo cáo các hàng hội thoại đã lưu, không phải trạng thái runtime của nhà cung cấp. Sau khi nhà cung cấp Discord khởi động lại, một tài khoản đã kết nối nhưng im lặng có thể vẫn khỏe mạnh dù không có hàng phiên Discord nào xuất hiện cho đến sự kiện hội thoại đến hoặc đi tiếp theo.

## Thêm / xóa tài khoản

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` hiển thị các cờ theo từng kênh (token, khóa riêng tư, app token, đường dẫn signal-cli, v.v.).
</Tip>

`channels remove` chỉ hoạt động trên các Plugin kênh đã cài đặt/cấu hình. Dùng `channels add` trước cho các kênh catalog có thể cài đặt.
Với các Plugin kênh có runtime hỗ trợ, `channels remove` cũng yêu cầu Gateway đang chạy dừng tài khoản đã chọn trước khi cập nhật cấu hình, nên việc vô hiệu hóa hoặc xóa tài khoản sẽ không để listener cũ tiếp tục hoạt động cho đến khi khởi động lại.

Các bề mặt thêm không tương tác thường gặp gồm:

- kênh bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- trường truyền tải Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- trường Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- trường Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- trường Nostr: `--private-key`, `--relay-urls`
- trường Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` cho xác thực tài khoản mặc định dựa trên env khi được hỗ trợ

Nếu một Plugin kênh cần được cài đặt trong khi chạy lệnh thêm điều khiển bằng cờ, OpenClaw dùng nguồn cài đặt mặc định của kênh đó mà không mở lời nhắc cài đặt Plugin tương tác.

Khi bạn chạy `openclaw channels add` không có cờ, trình hướng dẫn tương tác có thể nhắc:

- id tài khoản cho từng kênh đã chọn
- tên hiển thị tùy chọn cho các tài khoản đó
- `Route these channel accounts to agents now?`

Nếu bạn xác nhận liên kết ngay, trình hướng dẫn sẽ hỏi agent nào nên sở hữu từng tài khoản kênh đã cấu hình và ghi các liên kết định tuyến theo phạm vi tài khoản.

Bạn cũng có thể quản lý các quy tắc định tuyến tương tự sau này bằng `openclaw agents bindings`, `openclaw agents bind` và `openclaw agents unbind` (xem [agents](/vi/cli/agents)).

Khi bạn thêm một tài khoản không mặc định vào kênh vẫn đang dùng thiết lập cấp cao nhất cho một tài khoản, OpenClaw nâng cấp các giá trị cấp cao nhất theo phạm vi tài khoản vào bản đồ tài khoản của kênh trước khi ghi tài khoản mới. Hầu hết kênh đặt các giá trị đó vào `channels.<channel>.accounts.default`, nhưng các kênh đi kèm có thể giữ lại một tài khoản đã nâng cấp khớp sẵn có. Matrix là ví dụ hiện tại: nếu đã có một tài khoản có tên, hoặc `defaultAccount` trỏ đến một tài khoản có tên hiện có, quá trình nâng cấp sẽ giữ lại tài khoản đó thay vì tạo `accounts.default` mới.

Hành vi định tuyến vẫn nhất quán:

- Các liên kết chỉ theo kênh hiện có (không có `accountId`) tiếp tục khớp với tài khoản mặc định.
- `channels add` không tự động tạo hoặc ghi lại liên kết ở chế độ không tương tác.
- Thiết lập tương tác có thể tùy chọn thêm liên kết theo phạm vi tài khoản.

Nếu cấu hình của bạn đã ở trạng thái hỗn hợp (có tài khoản có tên và giá trị một tài khoản cấp cao nhất vẫn được đặt), hãy chạy `openclaw doctor --fix` để chuyển các giá trị theo phạm vi tài khoản vào tài khoản đã nâng cấp được chọn cho kênh đó. Hầu hết kênh nâng cấp vào `accounts.default`; Matrix có thể giữ lại một mục tiêu có tên/mặc định hiện có.

## Đăng nhập và đăng xuất (tương tác)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` hỗ trợ `--verbose`.
- `channels login` và `logout` có thể suy ra kênh khi chỉ có một mục tiêu đăng nhập được hỗ trợ đã cấu hình.
- `channels logout` ưu tiên đường dẫn Gateway trực tiếp khi có thể truy cập, để đăng xuất dừng mọi listener đang hoạt động trước khi xóa trạng thái xác thực kênh. Nếu không thể truy cập Gateway cục bộ, nó quay về dọn dẹp xác thực cục bộ.
- Chạy `channels login` từ terminal trên máy chủ gateway. Agent `exec` chặn luồng đăng nhập tương tác này; nên dùng các công cụ đăng nhập agent gốc theo kênh, như `whatsapp_login`, từ trò chuyện khi có sẵn.

## Khắc phục sự cố

- Chạy `openclaw status --deep` để thăm dò rộng.
- Dùng `openclaw doctor` để nhận các bản sửa có hướng dẫn.
- `openclaw channels list` không còn in ảnh chụp nhanh mức sử dụng/hạn mức của nhà cung cấp mô hình. Với các thông tin đó, dùng `openclaw status` (tổng quan) hoặc `openclaw models list` (theo từng nhà cung cấp).
- `openclaw channels status` quay về các bản tóm tắt chỉ dựa trên cấu hình khi gateway không thể truy cập. Nếu thông tin xác thực kênh được hỗ trợ được cấu hình qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại, nó báo cáo tài khoản đó là đã cấu hình với ghi chú suy giảm thay vì hiển thị là chưa cấu hình.

## Thăm dò khả năng

Lấy gợi ý khả năng của nhà cung cấp (intents/scopes khi có) cùng hỗ trợ tính năng tĩnh:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Ghi chú:

- `--channel` là tùy chọn; bỏ qua để liệt kê mọi kênh (bao gồm cả extensions).
- `--account` chỉ hợp lệ với `--channel`.
- `--target` chấp nhận `channel:<id>` hoặc id kênh số thô và chỉ áp dụng cho Discord. Với kênh thoại Discord, kiểm tra quyền đánh dấu các quyền còn thiếu `ViewChannel`, `Connect`, `Speak`, `SendMessages` và `ReadMessageHistory`.
- Các thăm dò tùy theo nhà cung cấp: Discord intents + quyền kênh tùy chọn; Slack bot + phạm vi người dùng; cờ Telegram bot + Webhook; phiên bản daemon Signal; app token Microsoft Teams + vai trò/phạm vi Graph (được chú thích khi biết). Các kênh không có thăm dò báo cáo `Probe: unavailable`.

## Phân giải tên thành ID

Phân giải tên kênh/người dùng thành ID bằng thư mục của nhà cung cấp:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Ghi chú:

- Dùng `--kind user|group|auto` để ép kiểu mục tiêu.
- Phân giải ưu tiên các kết quả khớp đang hoạt động khi nhiều mục có cùng tên.
- `channels resolve` là chỉ đọc. Nếu một tài khoản đã chọn được cấu hình qua SecretRef nhưng thông tin xác thực đó không khả dụng trong đường dẫn lệnh hiện tại, lệnh trả về kết quả chưa phân giải ở trạng thái suy giảm kèm ghi chú thay vì hủy toàn bộ lượt chạy.
- `channels resolve` không cài đặt Plugin kênh. Dùng `channels add --channel <name>` trước khi phân giải tên cho một kênh catalog có thể cài đặt.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tổng quan kênh](/vi/channels)
