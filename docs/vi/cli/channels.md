---
read_when:
    - Bạn muốn thêm hoặc xóa tài khoản kênh (Discord, Google Chat, iMessage, Matrix, Signal, Slack, Telegram, WhatsApp và các kênh khác)
    - Bạn muốn kiểm tra trạng thái kênh hoặc theo dõi nhật ký kênh theo thời gian thực
    - Bạn cần kiểm tra hoặc gửi lại một sự kiện kênh đến bị lỗi
summary: Tài liệu tham khảo CLI cho `openclaw channels` (tài khoản, trạng thái, thư không gửi được, khả năng, phân giải, nhật ký, đăng nhập/đăng xuất)
title: Kênh
x-i18n:
    generated_at: "2026-07-22T02:14:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 858f1f65de9b26dba3be712789141bc42cd0908c3a9284e40c3273c6972a0c65
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
openclaw channels dead-letters list --channel telegram --account default
```

`channels list` chỉ hiển thị các kênh trò chuyện: theo mặc định là các tài khoản đã cấu hình, với các thẻ trạng thái `installed`, `configured` và `enabled` cho từng tài khoản (`--json` dành cho đầu ra máy đọc). Truyền `--all` để cũng hiển thị các kênh đi kèm chưa có tài khoản được cấu hình và các kênh trong danh mục có thể cài đặt nhưng chưa có trên đĩa. Xác thực nhà cung cấp và mức sử dụng mô hình nằm ở nơi khác: `openclaw models auth list` dành cho hồ sơ xác thực nhà cung cấp, `openclaw status` hoặc `openclaw models list` dành cho mức sử dụng/hạn mức.

## Trạng thái / khả năng / phân giải / nhật ký

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>` (mặc định `10000`), `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (yêu cầu `--channel`), `--target <dest>` (yêu cầu `--channel`), `--timeout <ms>` (mặc định `10000`, giới hạn tối đa ở `30000`), `--json`
- `channels resolve <entries...>`: `--channel <name>`, `--account <id>`, `--kind <auto|user|group>` (mặc định `auto`), `--json`
- `channels logs`: `--channel <name|all>` (mặc định `all`), `--lines <n>` (mặc định `200`), `--json`

`channels status --probe` là đường dẫn trực tiếp: trên một gateway có thể truy cập, lệnh này chạy các phép kiểm tra
`probeAccount` và `auditAccount` tùy chọn cho từng tài khoản, vì vậy đầu ra có thể bao gồm trạng thái
vận chuyển cùng các kết quả thăm dò như `works`, `probe failed`, `audit ok` hoặc `audit failed`.
Nếu không thể truy cập gateway, `channels status` chuyển sang các bản tóm tắt chỉ dựa trên cấu hình
thay vì đầu ra thăm dò trực tiếp.

## Thư chết đầu vào

Các sự kiện đầu vào đã dùng hết chính sách thử lại sẽ được giữ trong cơ sở dữ liệu trạng thái dùng chung trong khoảng thời gian lưu giữ mục lỗi hiện có của hàng đợi. Kiểm tra một tài khoản kênh bằng:

```bash
openclaw channels dead-letters list --channel telegram --account default
openclaw channels dead-letters list --channel telegram --account default --json
```

Chế độ xem văn bản hiển thị mã định danh sự kiện, lý do lỗi, số lần thử và thời gian kể từ khi xảy ra lỗi. Đầu ra JSON cũng bao gồm tải trọng được lưu giữ, siêu dữ liệu, làn và dấu thời gian của các lần thử để chẩn đoán.

Sau khi khắc phục vấn đề gốc, hãy đưa lại một sự kiện vào hàng đợi bằng mã định danh sự kiện ban đầu của nó:

```bash
openclaw channels dead-letters resubmit <event-id> --channel telegram --account default
```

Chạy các lệnh này trên máy chủ Gateway để chúng truy cập cùng cơ sở dữ liệu trạng thái dùng chung với thời gian chạy của kênh. Việc gửi lại giữ nguyên tải trọng, siêu dữ liệu và làn, nhưng đặt lại bộ đếm số lần thử và tuổi của mục trong hàng đợi. Thao tác này thay thế nguyên tử dấu lỗi của sự kiện đó, vì vậy việc lặp lại lệnh khi sự kiện đang chờ hoặc đã được nhận xử lý sẽ bị từ chối thay vì tạo một lượt điều phối thứ hai. Kênh đang chạy sẽ nhận sự kiện trong lần tháo hàng đợi đầu vào tiếp theo. Các sự kiện đã hoàn tất vẫn ở trạng thái kết thúc và không thể gửi lại. Các hàng lỗi được tạo trước khi tính năng lưu giữ tải trọng được thêm vào vẫn có thể xuất hiện trong danh sách, nhưng việc gửi lại sẽ bị từ chối vì tải trọng của chúng không khả dụng.

`openclaw health` báo cáo số lượng thư chết và thời gian kể từ lỗi lâu nhất cho từng tài khoản kênh. `openclaw doctor` nêu tên các tài khoản bị ảnh hưởng và trỏ về lệnh kiểm tra.

Không sử dụng `openclaw sessions`, `sessions.list` của Gateway hoặc công cụ
`sessions_list` của tác tử làm tín hiệu về tình trạng socket của kênh. Các bề mặt này báo cáo
các hàng hội thoại đã lưu, không phải trạng thái thời gian chạy của nhà cung cấp. Sau khi nhà cung cấp Discord
khởi động lại, một tài khoản đã kết nối nhưng không có hoạt động vẫn có thể khỏe mạnh dù không có hàng phiên Discord nào
xuất hiện cho đến sự kiện hội thoại đầu vào hoặc đầu ra tiếp theo.

## Thêm / xóa tài khoản

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` hiển thị các cờ theo từng kênh (token, khóa riêng tư, token ứng dụng, đường dẫn signal-cli, v.v.).
</Tip>

`channels remove` chỉ hoạt động trên các plugin kênh đã cài đặt/cấu hình. Trước tiên, hãy dùng `channels add` cho các kênh trong danh mục có thể cài đặt. Nếu không có `--delete`, lệnh sẽ hỏi có vô hiệu hóa tài khoản hay không và giữ lại cấu hình của tài khoản; `--delete` xóa các mục cấu hình mà không nhắc xác nhận.
Đối với các plugin kênh được hỗ trợ bởi thời gian chạy, `channels remove` cũng yêu cầu Gateway đang chạy dừng tài khoản đã chọn trước khi cập nhật cấu hình, để việc vô hiệu hóa hoặc xóa tài khoản không khiến trình lắng nghe cũ tiếp tục hoạt động cho đến khi khởi động lại.

Các cờ thêm không tương tác do lõi sở hữu là `--account <id>`, `--name <name>`, `--token`, `--token-file` và `--use-env` (xác thực dựa trên biến môi trường, chỉ tài khoản mặc định, tại nơi được hỗ trợ). Các plugin kênh cung cấp cờ thiết lập riêng, bao gồm `--bot-token`, `--app-token`, `--secret`, `--secret-file`, `--password`, `--cli-path`, `--url`, `--base-url`, `--workspace`, `--http-url` và `--auth-dir`. Các cờ dành riêng cho từng kênh bao gồm:

| Kênh        | Cờ                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`                                   |
| iMessage    | `--cli-path`, `--db-path`, `--service`, `--region`                                                   |
| Matrix      | `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit` |
| Nostr       | `--private-key`, `--relay-urls`                                                                      |
| Signal      | `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`                          |
| Tlon        | `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

Nếu cần cài đặt plugin kênh trong một lệnh thêm dựa trên cờ, OpenClaw sử dụng nguồn cài đặt mặc định của kênh mà không mở lời nhắc cài đặt plugin tương tác.

Khi chạy `openclaw channels add` mà không có tài khoản, thông tin xác thực hoặc cờ cấu hình kênh trực tiếp, trình hướng dẫn tương tác có thể hiển thị lời nhắc. Mã định danh kênh theo vị trí và `--channel <id>` đều chọn trước kênh đó mà không bỏ qua hướng dẫn:

```bash
openclaw channels add telegram
openclaw channels add --channel telegram
```

Trình hướng dẫn có thể yêu cầu:

- mã định danh tài khoản cho từng kênh đã chọn
- tên hiển thị tùy chọn cho các tài khoản đó
- `Route these channel accounts to agents now?`

Nếu xác nhận liên kết ngay, trình hướng dẫn sẽ hỏi tác tử nào nên sở hữu từng tài khoản kênh đã cấu hình và ghi các liên kết định tuyến theo phạm vi tài khoản.

Sau đó, cũng có thể quản lý các quy tắc định tuyến tương tự bằng `openclaw agents bindings`, `openclaw agents bind` và `openclaw agents unbind` (xem [tác tử](/vi/cli/agents)).

Khi thêm một tài khoản không phải mặc định vào kênh vẫn đang sử dụng các thiết lập cấp cao nhất dành cho một tài khoản, OpenClaw chuyển các giá trị cấp cao nhất đó vào ánh xạ tài khoản của kênh trước khi ghi tài khoản mới. Quá trình chuyển đổi tái sử dụng một tài khoản có tên hiện có khi kênh có chính xác một tài khoản, hoặc khi `defaultAccount` trỏ đến một tài khoản; nếu không, các giá trị sẽ được đặt vào `channels.<channel>.accounts.default`.

Hành vi định tuyến vẫn nhất quán:

- Các liên kết hiện có chỉ dành cho kênh (không có `accountId`) tiếp tục khớp với tài khoản mặc định.
- `channels add` không tự động tạo hoặc ghi lại các liên kết trong chế độ không tương tác.
- Thiết lập tương tác có thể tùy chọn thêm các liên kết theo phạm vi tài khoản.

Nếu cấu hình đã ở trạng thái hỗn hợp (có các tài khoản được đặt tên và các giá trị dành cho một tài khoản ở cấp cao nhất vẫn được đặt), hãy chạy `openclaw doctor --fix` để chuyển các giá trị theo phạm vi tài khoản vào tài khoản đã được chuyển đổi được chọn cho kênh đó.

## Đăng nhập và đăng xuất (tương tác)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` hỗ trợ `--account <id>` và `--verbose`; `channels logout` hỗ trợ `--account <id>`.
- `channels login` và `logout` có thể suy ra kênh khi chỉ có một kênh đã cấu hình hỗ trợ hành động đó; nếu có nhiều kênh, hãy truyền `--channel`.
- `channels logout` ưu tiên đường dẫn Gateway trực tiếp khi có thể truy cập, để việc đăng xuất dừng mọi trình lắng nghe đang hoạt động trước khi xóa trạng thái xác thực kênh. Nếu không thể truy cập Gateway cục bộ, lệnh chuyển sang dọn dẹp xác thực cục bộ; với `gateway.mode: "remote"`, lỗi gateway sẽ khiến lệnh thất bại.
- Sau khi đăng nhập thành công, CLI yêu cầu một Gateway cục bộ có thể truy cập khởi động tài khoản; trong chế độ từ xa, CLI lưu xác thực cục bộ và thông báo rằng thời gian chạy từ xa chưa được khởi động lại.
- Chạy `channels login` từ một thiết bị đầu cuối trên máy chủ gateway. `exec` của tác tử chặn luồng đăng nhập tương tác này; nên sử dụng các công cụ đăng nhập tác tử gốc của kênh, chẳng hạn như `whatsapp_login`, từ cuộc trò chuyện khi có sẵn.

## Khắc phục sự cố

- Chạy `openclaw status --deep` để thăm dò tổng quát.
- Sử dụng `openclaw doctor` để được hướng dẫn khắc phục.
- `openclaw channels status` chuyển sang các bản tóm tắt chỉ dựa trên cấu hình khi không thể truy cập gateway. Nếu thông tin xác thực của một kênh được hỗ trợ được cấu hình qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại, lệnh sẽ báo cáo tài khoản đó là đã cấu hình kèm ghi chú về trạng thái suy giảm thay vì hiển thị là chưa cấu hình.

## Thăm dò khả năng

Tìm nạp các gợi ý về khả năng của nhà cung cấp (ý định/phạm vi khi có sẵn) cùng với hỗ trợ tính năng tĩnh:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Lưu ý:

- `--channel` là tùy chọn; bỏ qua để liệt kê mọi kênh (bao gồm cả các kênh do plugin cung cấp).
- `--account` chỉ hợp lệ khi dùng với `--channel`.
- `--target` chấp nhận `channel:<id>` hoặc mã định danh kênh dạng số thô và chỉ áp dụng cho Discord. Đối với các kênh thoại Discord, phép kiểm tra quyền sẽ đánh dấu các quyền còn thiếu gồm `ViewChannel`, `Connect`, `Speak`, `SendMessages` và `ReadMessageHistory`.
- Các phép thăm dò dành riêng cho từng nhà cung cấp: danh tính bot Discord + ý định cùng quyền kênh tùy chọn; phạm vi bot + người dùng của Slack; cờ bot + webhook của Telegram; phiên bản daemon của Signal; token ứng dụng + vai trò/phạm vi Graph của Microsoft Teams (được chú thích khi biết). Các kênh không có phép thăm dò sẽ báo cáo `Probe: unavailable`.

## Phân giải tên thành mã định danh

Phân giải tên kênh/người dùng thành mã định danh bằng thư mục của nhà cung cấp:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Lưu ý:

- Sử dụng `--kind user|group|auto` để buộc kiểu đích.
- Quá trình phân giải ưu tiên các kết quả khớp đang hoạt động khi nhiều mục có cùng tên.
- `channels resolve` chỉ cho phép đọc. Nếu tài khoản đã chọn được cấu hình qua SecretRef nhưng thông tin xác thực đó không khả dụng trong đường dẫn lệnh hiện tại, lệnh sẽ trả về các kết quả chưa phân giải ở trạng thái suy giảm kèm ghi chú thay vì hủy toàn bộ lượt chạy.
- `channels resolve` không cài đặt các Plugin kênh. Sử dụng `channels add --channel <name>` trước khi phân giải tên cho một kênh trong danh mục có thể cài đặt.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Tổng quan về các kênh](/vi/channels)
