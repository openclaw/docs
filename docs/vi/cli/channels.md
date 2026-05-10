---
read_when:
    - Bạn muốn thêm/xóa tài khoản kênh (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Bạn muốn kiểm tra trạng thái kênh hoặc theo dõi nhật ký kênh
summary: Tham chiếu CLI cho `openclaw channels` (accounts, status, login/logout, logs)
title: Kênh
x-i18n:
    generated_at: "2026-05-10T19:27:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: e860f2863e148a46b9beb7f855eb9f30addc1b012f1430bf33c544c5e321821d
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

`channels list` chỉ hiển thị các kênh trò chuyện: mặc định là các tài khoản đã cấu hình, với các thẻ trạng thái `installed`, `configured`, và `enabled` cho mỗi tài khoản. Truyền `--all` để cũng hiển thị các kênh đi kèm chưa có tài khoản được cấu hình và các kênh trong danh mục có thể cài đặt nhưng chưa có trên đĩa. Nhà cung cấp xác thực (OAuth + khóa API) và ảnh chụp nhanh mức sử dụng/hạn mức của nhà cung cấp mô hình không còn được in ở đây; dùng `openclaw models auth list` cho hồ sơ xác thực nhà cung cấp và `openclaw status` hoặc `openclaw models list` cho mức sử dụng.

## Trạng thái / khả năng / phân giải / nhật ký

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (chỉ với `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` là đường dẫn trực tiếp: trên một Gateway có thể truy cập, lệnh này chạy các kiểm tra `probeAccount` và `auditAccount` tùy chọn theo từng tài khoản, vì vậy đầu ra có thể bao gồm trạng thái vận chuyển cùng kết quả thăm dò như `works`, `probe failed`, `audit ok`, hoặc `audit failed`. Nếu không thể truy cập Gateway, `channels status` sẽ quay về các bản tóm tắt chỉ dựa trên cấu hình thay vì đầu ra thăm dò trực tiếp.

Không dùng `openclaw sessions`, Gateway `sessions.list`, hoặc công cụ agent `sessions_list` làm tín hiệu về tình trạng socket của kênh. Các bề mặt đó báo cáo các hàng hội thoại đã lưu, không phải trạng thái runtime của nhà cung cấp. Sau khi nhà cung cấp Discord khởi động lại, một tài khoản đã kết nối nhưng yên lặng có thể vẫn khỏe mạnh trong khi không có hàng phiên Discord nào xuất hiện cho đến sự kiện hội thoại gửi vào hoặc gửi ra tiếp theo.

## Thêm / xóa tài khoản

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` hiển thị các cờ theo từng kênh (token, khóa riêng, app token, đường dẫn signal-cli, v.v.).
</Tip>

`channels remove` chỉ hoạt động trên các Plugin kênh đã cài đặt/cấu hình. Dùng `channels add` trước cho các kênh danh mục có thể cài đặt.
Đối với các Plugin kênh có runtime hỗ trợ, `channels remove` cũng yêu cầu Gateway đang chạy dừng tài khoản đã chọn trước khi cập nhật cấu hình, để việc vô hiệu hóa hoặc xóa tài khoản không để listener cũ tiếp tục hoạt động cho đến khi khởi động lại.

Các bề mặt thêm không tương tác thường gặp gồm:

- kênh bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Trường vận chuyển Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Trường Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Trường Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Trường Nostr: `--private-key`, `--relay-urls`
- Trường Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` cho xác thực dựa trên env của tài khoản mặc định khi được hỗ trợ

Nếu cần cài đặt một Plugin kênh trong lúc chạy lệnh thêm dựa trên cờ, OpenClaw sẽ dùng nguồn cài đặt mặc định của kênh mà không mở lời nhắc cài đặt Plugin tương tác.

Khi bạn chạy `openclaw channels add` không có cờ, trình hướng dẫn tương tác có thể nhắc:

- id tài khoản cho mỗi kênh được chọn
- tên hiển thị tùy chọn cho các tài khoản đó
- `Route these channel accounts to agents now?`

Nếu bạn xác nhận liên kết ngay, trình hướng dẫn sẽ hỏi agent nào nên sở hữu từng tài khoản kênh đã cấu hình và ghi các liên kết định tuyến theo phạm vi tài khoản.

Bạn cũng có thể quản lý các quy tắc định tuyến tương tự sau đó bằng `openclaw agents bindings`, `openclaw agents bind`, và `openclaw agents unbind` (xem [agents](/vi/cli/agents)).

Khi bạn thêm một tài khoản không mặc định vào một kênh vẫn đang dùng thiết lập cấp cao nhất cho một tài khoản, OpenClaw sẽ nâng cấp các giá trị cấp cao nhất theo phạm vi tài khoản vào bản đồ tài khoản của kênh trước khi ghi tài khoản mới. Hầu hết kênh đặt các giá trị đó vào `channels.<channel>.accounts.default`, nhưng các kênh đi kèm có thể giữ lại một tài khoản đã nâng cấp khớp sẵn có. Matrix là ví dụ hiện tại: nếu đã có một tài khoản được đặt tên, hoặc `defaultAccount` trỏ tới một tài khoản được đặt tên hiện có, quá trình nâng cấp sẽ giữ lại tài khoản đó thay vì tạo `accounts.default` mới.

Hành vi định tuyến vẫn nhất quán:

- Các liên kết chỉ theo kênh hiện có (không có `accountId`) tiếp tục khớp với tài khoản mặc định.
- `channels add` không tự động tạo hoặc ghi lại liên kết ở chế độ không tương tác.
- Thiết lập tương tác có thể tùy chọn thêm các liên kết theo phạm vi tài khoản.

Nếu cấu hình của bạn đã ở trạng thái hỗn hợp (có tài khoản được đặt tên và các giá trị một tài khoản cấp cao nhất vẫn được đặt), hãy chạy `openclaw doctor --fix` để chuyển các giá trị theo phạm vi tài khoản vào tài khoản đã nâng cấp được chọn cho kênh đó. Hầu hết kênh nâng cấp vào `accounts.default`; Matrix có thể giữ lại một đích được đặt tên/mặc định hiện có thay thế.

## Đăng nhập và đăng xuất (tương tác)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` hỗ trợ `--verbose`.
- `channels login` và `logout` có thể suy ra kênh khi chỉ cấu hình một đích đăng nhập được hỗ trợ.
- `channels logout` ưu tiên đường dẫn Gateway trực tiếp khi có thể truy cập, vì vậy đăng xuất sẽ dừng mọi listener đang hoạt động trước khi xóa trạng thái xác thực của kênh. Nếu không thể truy cập Gateway cục bộ, lệnh sẽ quay về dọn dẹp xác thực cục bộ.
- Chạy `channels login` từ một terminal trên máy chủ gateway. Agent `exec` chặn luồng đăng nhập tương tác này; các công cụ đăng nhập agent gốc của kênh, chẳng hạn như `whatsapp_login`, nên được dùng từ trò chuyện khi có sẵn.

## Khắc phục sự cố

- Chạy `openclaw status --deep` để thăm dò rộng.
- Dùng `openclaw doctor` để nhận các bản sửa có hướng dẫn.
- `openclaw channels list` không còn in ảnh chụp nhanh mức sử dụng/hạn mức nhà cung cấp mô hình. Với các thông tin đó, dùng `openclaw status` (tổng quan) hoặc `openclaw models list` (theo từng nhà cung cấp).
- `openclaw channels status` quay về các bản tóm tắt chỉ dựa trên cấu hình khi không thể truy cập gateway. Nếu thông tin xác thực kênh được hỗ trợ được cấu hình qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại, lệnh sẽ báo cáo tài khoản đó là đã cấu hình kèm ghi chú suy giảm thay vì hiển thị là chưa cấu hình.

## Thăm dò khả năng

Lấy gợi ý khả năng của nhà cung cấp (intents/scopes khi có) cùng hỗ trợ tính năng tĩnh:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Ghi chú:

- `--channel` là tùy chọn; bỏ qua để liệt kê mọi kênh (bao gồm extensions).
- `--account` chỉ hợp lệ với `--channel`.
- `--target` chấp nhận `channel:<id>` hoặc id kênh số thô và chỉ áp dụng cho Discord. Với kênh thoại Discord, kiểm tra quyền sẽ gắn cờ các quyền còn thiếu `ViewChannel`, `Connect`, `Speak`, `SendMessages`, và `ReadMessageHistory`.
- Các thăm dò phụ thuộc nhà cung cấp: intents Discord + quyền kênh tùy chọn; bot Slack + phạm vi người dùng; cờ bot Telegram + webhook; phiên bản daemon Signal; app token Microsoft Teams + vai trò/phạm vi Graph (được chú thích khi biết). Các kênh không có thăm dò sẽ báo cáo `Probe: unavailable`.

## Phân giải tên thành ID

Phân giải tên kênh/người dùng thành ID bằng thư mục của nhà cung cấp:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Ghi chú:

- Dùng `--kind user|group|auto` để buộc kiểu đích.
- Việc phân giải ưu tiên các kết quả khớp đang hoạt động khi nhiều mục chia sẻ cùng tên.
- `channels resolve` là chỉ đọc. Nếu tài khoản đã chọn được cấu hình qua SecretRef nhưng thông tin xác thực đó không khả dụng trong đường dẫn lệnh hiện tại, lệnh sẽ trả về kết quả chưa phân giải bị suy giảm kèm ghi chú thay vì hủy toàn bộ lần chạy.
- `channels resolve` không cài đặt Plugin kênh. Dùng `channels add --channel <name>` trước khi phân giải tên cho một kênh danh mục có thể cài đặt.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tổng quan kênh](/vi/channels)
