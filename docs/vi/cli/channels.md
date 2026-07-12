---
read_when:
    - Bạn muốn thêm hoặc xóa tài khoản kênh (Discord, Google Chat, iMessage, Matrix, Signal, Slack, Telegram, WhatsApp và các kênh khác)
    - Bạn muốn kiểm tra trạng thái kênh hoặc theo dõi liên tục nhật ký kênh
summary: Tài liệu tham khảo CLI cho `openclaw channels` (tài khoản, trạng thái, khả năng, phân giải, nhật ký, đăng nhập/đăng xuất)
title: Kênh
x-i18n:
    generated_at: "2026-07-12T07:46:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41220535917d645e87dca82bc5c27319eff0035fe14a8cb18f001192b3aad5bd
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Quản lý các tài khoản kênh trò chuyện và trạng thái thời gian chạy của chúng trên Gateway.

Tài liệu liên quan:

- Hướng dẫn về kênh: [Kênh](/vi/channels)
- Cấu hình Gateway: [Cấu hình](/vi/gateway/configuration)

## Các lệnh thường dùng

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` chỉ hiển thị các kênh trò chuyện: mặc định là các tài khoản đã cấu hình, kèm theo các thẻ trạng thái `installed`, `configured` và `enabled` cho từng tài khoản (`--json` để xuất dữ liệu cho máy xử lý). Truyền `--all` để hiển thị thêm các kênh đi kèm chưa có tài khoản nào được cấu hình và các kênh trong danh mục có thể cài đặt nhưng chưa có trên đĩa. Việc xác thực nhà cung cấp và sử dụng mô hình được quản lý ở nơi khác: dùng `openclaw models auth list` cho các hồ sơ xác thực nhà cung cấp, dùng `openclaw status` hoặc `openclaw models list` cho mức sử dụng/hạn ngạch.

## Trạng thái / khả năng / phân giải / nhật ký

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>` (mặc định `10000`), `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (yêu cầu `--channel`), `--target <dest>` (yêu cầu `--channel`), `--timeout <ms>` (mặc định `10000`, giới hạn tối đa `30000`), `--json`
- `channels resolve <entries...>`: `--channel <name>`, `--account <id>`, `--kind <auto|user|group>` (mặc định `auto`), `--json`
- `channels logs`: `--channel <name|all>` (mặc định `all`), `--lines <n>` (mặc định `200`), `--json`

`channels status --probe` là đường dẫn kiểm tra trực tiếp: trên một Gateway có thể kết nối, lệnh này chạy các bước kiểm tra
`probeAccount` và tùy chọn `auditAccount` cho từng tài khoản, vì vậy kết quả có thể bao gồm trạng thái
truyền tải cùng các kết quả thăm dò như `works`, `probe failed`, `audit ok` hoặc `audit failed`.
Nếu không thể kết nối đến Gateway, `channels status` sẽ chuyển sang hiển thị phần tóm tắt chỉ dựa trên cấu hình
thay vì kết quả thăm dò trực tiếp.

Không sử dụng `openclaw sessions`, `sessions.list` của Gateway hoặc công cụ
`sessions_list` của tác nhân làm tín hiệu về tình trạng socket của kênh. Các bề mặt này báo cáo
các hàng hội thoại đã lưu trữ, không phải trạng thái thời gian chạy của nhà cung cấp. Sau khi khởi động lại nhà cung cấp Discord,
một tài khoản đã kết nối nhưng không có hoạt động vẫn có thể ở trạng thái tốt dù chưa xuất hiện hàng phiên Discord nào
cho đến sự kiện hội thoại gửi đến hoặc gửi đi tiếp theo.

## Thêm / xóa tài khoản

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` hiển thị các cờ dành riêng cho từng kênh (token, khóa riêng tư, token ứng dụng, đường dẫn signal-cli, v.v.).
</Tip>

`channels remove` chỉ thao tác trên các Plugin kênh đã cài đặt/cấu hình. Trước tiên, hãy dùng `channels add` cho các kênh trong danh mục có thể cài đặt. Khi không có `--delete`, lệnh sẽ hỏi có vô hiệu hóa tài khoản hay không và giữ lại cấu hình của tài khoản; `--delete` xóa các mục cấu hình mà không hỏi xác nhận.
Đối với các Plugin kênh có nền tảng thời gian chạy, `channels remove` cũng yêu cầu Gateway đang chạy dừng tài khoản đã chọn trước khi cập nhật cấu hình, nhờ đó việc vô hiệu hóa hoặc xóa tài khoản không để trình lắng nghe cũ tiếp tục hoạt động cho đến lần khởi động lại.

Các cờ thêm không tương tác dùng chung cho các kênh: `--account <id>`, `--name <name>`, `--token`, `--token-file`, `--bot-token`, `--app-token`, `--secret`, `--secret-file`, `--password`, `--cli-path`, `--url`, `--base-url`, `--http-url`, `--auth-dir` và `--use-env` (xác thực dựa trên biến môi trường, chỉ dành cho tài khoản mặc định, tại những nơi được hỗ trợ). Các cờ dành riêng cho từng kênh bao gồm:

| Kênh        | Cờ                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`                                   |
| iMessage    | `--cli-path`, `--db-path`, `--service`, `--region`                                                   |
| Matrix      | `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit` |
| Nostr       | `--private-key`, `--relay-urls`                                                                      |
| Signal      | `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`                          |
| Tlon        | `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

Nếu cần cài đặt Plugin kênh trong quá trình chạy lệnh thêm bằng cờ, OpenClaw sử dụng nguồn cài đặt mặc định của kênh mà không mở lời nhắc cài đặt Plugin tương tác.

Khi chạy `openclaw channels add` mà không có cờ, trình hướng dẫn tương tác có thể yêu cầu:

- mã định danh tài khoản cho từng kênh đã chọn
- tên hiển thị tùy chọn cho các tài khoản đó
- `Định tuyến các tài khoản kênh này đến các tác nhân ngay bây giờ?`

Nếu xác nhận liên kết ngay, trình hướng dẫn sẽ hỏi tác nhân nào sẽ sở hữu từng tài khoản kênh đã cấu hình và ghi các liên kết định tuyến theo phạm vi tài khoản.

Bạn cũng có thể quản lý các quy tắc định tuyến tương tự sau này bằng `openclaw agents bindings`, `openclaw agents bind` và `openclaw agents unbind` (xem [tác nhân](/vi/cli/agents)).

Khi thêm một tài khoản không mặc định vào kênh vẫn đang sử dụng các thiết lập cấp cao nhất dành cho một tài khoản, OpenClaw chuyển các giá trị cấp cao nhất đó vào ánh xạ tài khoản của kênh trước khi ghi tài khoản mới. Quá trình chuyển đổi sử dụng lại một tài khoản đã đặt tên hiện có khi kênh chỉ có đúng một tài khoản, hoặc khi `defaultAccount` trỏ đến một tài khoản; nếu không, các giá trị sẽ được đưa vào `channels.<channel>.accounts.default`.

Hành vi định tuyến vẫn nhất quán:

- Các liên kết hiện có chỉ theo kênh (không có `accountId`) tiếp tục khớp với tài khoản mặc định.
- `channels add` không tự động tạo hoặc ghi lại các liên kết trong chế độ không tương tác.
- Thiết lập tương tác có thể tùy chọn thêm các liên kết theo phạm vi tài khoản.

Nếu cấu hình của bạn đã ở trạng thái hỗn hợp (có các tài khoản được đặt tên nhưng các giá trị một tài khoản cấp cao nhất vẫn còn), hãy chạy `openclaw doctor --fix` để chuyển các giá trị theo phạm vi tài khoản vào tài khoản đã được chọn để chuyển đổi cho kênh đó.

## Đăng nhập và đăng xuất (tương tác)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` hỗ trợ `--account <id>` và `--verbose`; `channels logout` hỗ trợ `--account <id>`.
- `channels login` và `logout` có thể suy ra kênh khi chỉ có một kênh đã cấu hình hỗ trợ thao tác đó; nếu có nhiều kênh, hãy truyền `--channel`.
- `channels logout` ưu tiên đường dẫn Gateway trực tiếp khi có thể kết nối, nhờ đó việc đăng xuất sẽ dừng mọi trình lắng nghe đang hoạt động trước khi xóa trạng thái xác thực của kênh. Nếu không thể kết nối đến Gateway cục bộ, lệnh sẽ chuyển sang dọn dẹp xác thực cục bộ; với `gateway.mode: "remote"`, lỗi Gateway sẽ khiến lệnh thất bại.
- Sau khi đăng nhập thành công, CLI yêu cầu một Gateway cục bộ có thể kết nối khởi động tài khoản; trong chế độ từ xa, CLI lưu thông tin xác thực cục bộ và thông báo rằng thời gian chạy từ xa chưa được khởi động lại.
- Chạy `channels login` từ một thiết bị đầu cuối trên máy chủ Gateway. `exec` của tác nhân chặn luồng đăng nhập tương tác này; nên sử dụng các công cụ đăng nhập tác nhân dành riêng cho kênh, chẳng hạn như `whatsapp_login`, từ cuộc trò chuyện khi có sẵn.

## Khắc phục sự cố

- Chạy `openclaw status --deep` để thực hiện thăm dò trên phạm vi rộng.
- Dùng `openclaw doctor` để được hướng dẫn khắc phục.
- `openclaw channels status` chuyển sang phần tóm tắt chỉ dựa trên cấu hình khi không thể kết nối đến Gateway. Nếu thông tin xác thực của một kênh được hỗ trợ được cấu hình qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại, lệnh sẽ báo cáo tài khoản đó là đã cấu hình kèm ghi chú về trạng thái suy giảm thay vì hiển thị là chưa cấu hình.

## Thăm dò khả năng

Tìm nạp các gợi ý về khả năng của nhà cung cấp (ý định/phạm vi nếu có) cùng với khả năng hỗ trợ tính năng tĩnh:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Lưu ý:

- `--channel` là tùy chọn; bỏ qua cờ này để liệt kê mọi kênh (bao gồm các kênh do Plugin cung cấp).
- `--account` chỉ hợp lệ khi đi cùng `--channel`.
- `--target` chấp nhận `channel:<id>` hoặc mã định danh kênh dạng số thô và chỉ áp dụng cho Discord. Đối với các kênh thoại Discord, bước kiểm tra quyền sẽ đánh dấu các quyền còn thiếu gồm `ViewChannel`, `Connect`, `Speak`, `SendMessages` và `ReadMessageHistory`.
- Các bước thăm dò phụ thuộc vào từng nhà cung cấp: danh tính bot Discord + ý định cùng quyền kênh tùy chọn; bot Slack + phạm vi người dùng; cờ bot Telegram + Webhook; phiên bản tiến trình nền Signal; token ứng dụng Microsoft Teams + vai trò/phạm vi Graph (được chú thích khi biết). Các kênh không có bước thăm dò sẽ báo cáo `Probe: unavailable`.

## Phân giải tên thành mã định danh

Phân giải tên kênh/người dùng thành mã định danh bằng danh bạ của nhà cung cấp:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Lưu ý:

- Dùng `--kind user|group|auto` để buộc loại đích.
- Quá trình phân giải ưu tiên các kết quả khớp đang hoạt động khi nhiều mục có cùng tên.
- `channels resolve` là thao tác chỉ đọc. Nếu tài khoản đã chọn được cấu hình qua SecretRef nhưng thông tin xác thực đó không khả dụng trong đường dẫn lệnh hiện tại, lệnh sẽ trả về các kết quả chưa phân giải ở trạng thái suy giảm kèm ghi chú thay vì hủy toàn bộ lần chạy.
- `channels resolve` không cài đặt các Plugin kênh. Hãy dùng `channels add --channel <name>` trước khi phân giải tên cho một kênh trong danh mục có thể cài đặt.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Tổng quan về kênh](/vi/channels)
