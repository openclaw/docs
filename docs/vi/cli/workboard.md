---
read_when:
    - Bạn muốn kiểm tra hoặc tạo các thẻ Workboard từ terminal
    - Bạn muốn điều phối các lượt chạy worker Workboard từ CLI
    - Bạn đang gỡ lỗi hành vi của CLI Workboard hoặc lệnh dấu gạch chéo
summary: Tài liệu tham chiếu CLI cho các thẻ `openclaw workboard`, việc điều phối và các lượt chạy worker
title: CLI bảng công việc
x-i18n:
    generated_at: "2026-07-19T17:00:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 640260ea6f5959b3aee1cdce76f2501097bff79e9bf1741bdd9ff7a8b43e1a7f
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` là giao diện terminal cho [Plugin Workboard](/vi/plugins/workboard) đi kèm. Lệnh này cho phép người vận hành liệt kê thẻ, tạo thẻ, xem một thẻ và yêu cầu Gateway đang chạy phân phối công việc sẵn sàng vào các lượt chạy worker của subagent.

Bật Plugin trước khi sử dụng lệnh:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## Cách sử dụng

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard move <id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--max-starts <count>] [--admin] [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

Lệnh đọc và ghi cùng cơ sở dữ liệu SQLite do Plugin sở hữu mà bảng điều khiển và các công cụ Workboard sử dụng. ID thẻ là UUID; các lệnh chấp nhận ID thẻ cũng chấp nhận tiền tố ID không gây nhầm lẫn (đầu ra văn bản thu gọn hiển thị 8 ký tự đầu tiên).

Các giá trị `status` hợp lệ: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`. Các giá trị `priority` hợp lệ: `low`, `normal`, `high`, `urgent`.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

Đầu ra văn bản được thu gọn:

```text
7f4a2c10  ready     high    default agent-a  Khắc phục Heartbeat worker lỗi thời
```

Các cột lần lượt là tiền tố ID, trạng thái, mức ưu tiên, ID bảng, ID tác tử tùy chọn và tiêu đề.

| Cờ                   | Mục đích                                           |
| -------------------- | ------------------------------------------------- |
| `--board <id>`       | Giới hạn kết quả trong một không gian tên bảng    |
| `--status <status>`  | Giới hạn kết quả ở một trạng thái Workboard       |
| `--include-archived` | Bao gồm thẻ đã lưu trữ trong đầu ra văn bản thu gọn |
| `--json`             | In toàn bộ danh sách thẻ dưới dạng JSON máy đọc được |

Theo mặc định, đầu ra văn bản thu gọn ẩn các thẻ đã lưu trữ để CLI khớp với `/workboard list`. Truyền `--include-archived` để hiển thị chúng. Đầu ra JSON luôn giữ toàn bộ danh sách thẻ, bao gồm các thẻ đã lưu trữ, nhằm phục vụ quy trình tự động hóa hiện có.

## `create`

```bash
openclaw workboard create "Khắc phục Heartbeat worker lỗi thời" --priority high --labels bug,workboard
openclaw workboard create "Viết tài liệu Workboard" --status ready --agent docs-agent --board docs --notes "Trình bày CLI, lệnh dấu gạch chéo, phân phối và trạng thái SQLite."
```

| Cờ                      | Mục đích                                        |
| ----------------------- | ----------------------------------------------- |
| `--notes <text>`        | Ghi chú ban đầu của thẻ                         |
| `--status <status>`     | Trạng thái ban đầu, mặc định là `todo` |
| `--priority <priority>` | Mức ưu tiên, mặc định là `normal`         |
| `--agent <id>`          | Gán thẻ cho một tác tử hoặc ID chủ sở hữu       |
| `--board <id>`          | Lưu thẻ trong một không gian tên bảng           |
| `--labels <items>`      | Các nhãn phân tách bằng dấu phẩy                 |
| `--json`                | In thẻ đã tạo dưới dạng JSON máy đọc được       |

`create` ghi trực tiếp vào trạng thái SQLite của Workboard. Thẻ ngay lập tức xuất hiện trong thẻ Workboard của Control UI và trong các công cụ Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

Đầu ra văn bản in dòng thẻ thu gọn và ghi chú. Đầu ra JSON trả về toàn bộ bản ghi thẻ, bao gồm siêu dữ liệu thực thi, số lần thử, bình luận, liên kết, bằng chứng, thành phần tạo tác, nhật ký worker, trạng thái giao thức, dữ liệu chẩn đoán và siêu dữ liệu tự động hóa.

Trạng thái bằng chứng trong JSON là kết quả do worker báo cáo. `passed` ghi lại phần
tự đánh giá của worker về lệnh hoặc phép kiểm tra đính kèm; đây không phải là kết quả xác minh
độc lập.

## `move`

```bash
openclaw workboard move 7f4a2c10 --status review
openclaw workboard move 7f4a2c10 --status done --json
```

`move` thay đổi trạng thái của thẻ bằng cùng đường dẫn thao tác thủ công được dùng khi kéo thẻ trong bảng điều khiển. Lệnh chấp nhận ID thẻ đầy đủ hoặc tiền tố không gây nhầm lẫn. Các điều kiện giữ do phần phụ thuộc và lịch biểu đang hoạt động vẫn được áp dụng. Người vận hành có thể di chuyển một thẻ đã được nhận mà không cần token nhận việc của tác tử; token nhận việc vẫn chỉ dùng cho các thao tác thay đổi bằng công cụ tác tử và được che khỏi đầu ra JSON.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --max-starts 10
openclaw workboard dispatch --admin
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Trước tiên, `dispatch` gọi phương thức RPC `workboard.cards.dispatch` của Gateway đang chạy. Phương thức này sử dụng cùng runtime subagent như thao tác phân phối trên bảng điều khiển, vì vậy các thẻ sẵn sàng trở thành lượt chạy worker được theo dõi dưới dạng tác vụ với khóa phiên được liên kết. `--max-starts` sử dụng phương thức bổ sung `workboard.cards.dispatchWithOptions` để Gateway cũ từ chối tùy chọn trước khi khởi động bất kỳ worker nào; sau khi nâng cấp, hãy khởi động lại Gateway trước khi sử dụng cờ này. Các thẻ được gán tác tử sử dụng khóa phiên subagent theo phạm vi tác tử; thẻ chưa được gán giữ khóa subagent không giới hạn phạm vi để duy trì tác tử mặc định đã cấu hình của Gateway.

Vòng lặp phân phối:

1. Chuyển các thẻ con có phần phụ thuộc đã sẵn sàng sang `ready`.
2. Chặn các lượt nhận việc đã hết hạn hoặc các lượt chạy worker đã hết thời gian chờ.
3. Ghi siêu dữ liệu phân phối vào các thẻ sẵn sàng.
4. Chọn một lô nhỏ các thẻ sẵn sàng chưa được nhận.
5. Nhận từng thẻ đã chọn cho bộ phân phối hoặc tác tử được gán.
6. Khởi động một lượt chạy worker của subagent với ngữ cảnh thẻ bị giới hạn và token nhận việc của thẻ.
7. Lưu ID lượt chạy worker, khóa phiên, liên kết tác vụ khi sổ cái tác vụ của Gateway báo cáo, trạng thái thực thi và nhật ký worker vào thẻ.

Quá trình lựa chọn mang tính thận trọng: theo mặc định, một lần phân phối khởi động tối đa ba worker, bỏ qua các thẻ đã lưu trữ hoặc đã được nhận và chỉ khởi động một thẻ cho mỗi chủ sở hữu hoặc tác tử trong một lượt. Các thẻ đã thuộc về công việc đang chạy hoặc đang được review sẽ được để lại cho lần phân phối sau. Truyền `--max-starts <count>` với một số nguyên dương để thay đổi giới hạn mỗi lượt; quy tắc một thẻ cho mỗi chủ sở hữu vẫn được áp dụng, vì vậy số lượt khởi động thực tế có thể thấp hơn.

Nếu không thể khởi động worker sau khi thẻ đã được nhận, Workboard sẽ chặn thẻ đó, xóa trạng thái nhận việc và ghi lỗi vào siêu dữ liệu thực thi cùng nhật ký worker của thẻ, nhờ đó các lần khởi động thất bại vẫn hiển thị thay vì âm thầm đưa thẻ trở lại hàng đợi.

Nếu không chỉ định đích Gateway rõ ràng và Gateway cục bộ không khả dụng hoặc chưa cung cấp phương thức phân phối Workboard, CLI sẽ dự phòng bằng chế độ phân phối chỉ dữ liệu đối với trạng thái Workboard cục bộ. Chế độ phân phối chỉ dữ liệu vẫn có thể nâng cấp phần phụ thuộc, dọn dẹp lượt nhận việc lỗi thời và chặn các lượt chạy hết thời gian chờ, nhưng không khởi động worker. Các lỗi xác thực, quyền hạn và xác thực dữ liệu, cũng như lỗi đối với đích `--url` hoặc `--token` được chỉ định rõ ràng, sẽ được báo cáo trực tiếp thay vì kích hoạt cơ chế dự phòng.

Đầu ra văn bản báo cáo số worker được khởi động:

```text
phân phối hoàn tất: đã khởi động=2 lỗi=0
```

Đầu ra dự phòng được nêu rõ:

```text
gateway không khả dụng; chỉ phân phối dữ liệu: đã nâng cấp=1 đã chặn=0
```

Đầu ra JSON bao gồm kết quả phân phối. Phân phối dựa trên Gateway có thể bao gồm `started` và `startFailures`; chế độ dự phòng chỉ dữ liệu bao gồm `gatewayUnavailable: true`. Token nhận việc được che khỏi đầu ra JSON của thẻ.

Trong bảng điều khiển, cùng kết quả phân phối được hiển thị dưới dạng bản tóm tắt ngắn để người vận hành có thể xem có bao nhiêu thẻ đã được khởi động, nâng cấp, chặn, nhận lại hoặc gặp lỗi mà không cần mở chi tiết thẻ.

## Tương đương với lệnh dấu gạch chéo

Các kênh hỗ trợ lệnh có thể sử dụng lệnh dấu gạch chéo tương ứng:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Khắc phục Heartbeat worker lỗi thời
/workboard move 7f4a2c10 --status review
/workboard dispatch
```

Lệnh phân phối qua dấu gạch chéo cũng sử dụng runtime subagent của Gateway, vì vậy tuân theo cùng hành vi nhận việc, khởi động worker và xử lý lỗi như bảng điều khiển và đường dẫn Gateway của CLI.

`/workboard list` và `/workboard show` là các lệnh đọc dành cho người gửi lệnh được ủy quyền. `/workboard create`, `/workboard move` và `/workboard dispatch` thay đổi trạng thái bảng và yêu cầu trạng thái chủ sở hữu trên các giao diện trò chuyện hoặc một máy khách Gateway có `operator.write` hoặc `operator.admin`.

## Quyền

Đường dẫn phân phối CLI thường yêu cầu các phạm vi Gateway `operator.write` và `operator.read`. Các thẻ liên kết với không gian làm việc chạy trực tiếp trong đúng không gian làm việc của tác tử đã cấu hình; yêu cầu worktree được giới hạn trong thư mục đó thay vì cho phép máy chủ hiện thực hóa mã do kho lưu trữ kiểm soát. Worker được chọn phải có quyền truy cập sandbox Docker có thể ghi và không dùng chung vào chính xác không gian làm việc đó, một hàm băm container đang hoạt động khớp với các mount và chính sách được yêu cầu, đồng thời không có khả năng thoát ra máy chủ. Truyền `--admin` để yêu cầu rõ ràng `operator.admin`, cho phép một bản checkout khác trên máy chủ và sử dụng thiết lập worktree được quản lý thông thường; kết nối sẽ thất bại nếu phạm vi đó không được phê duyệt cho máy khách. Token Gateway chỉ đọc có thể kiểm tra dữ liệu Workboard thông qua các phương thức đọc, nhưng không thể tạo thẻ hoặc phân phối worker. Các giới hạn không gian làm việc không thay đổi thao tác di chuyển thẻ thủ công đối với bên gọi có quyền thay đổi Workboard.

Các lệnh cục bộ `list`, `create`, `show` và `move` thao tác trên thư mục trạng thái OpenClaw cục bộ mà hồ sơ hiện tại sử dụng. Sử dụng `--dev` hoặc `--profile <name>` trên lệnh `openclaw` cấp cao nhất khi cần một thư mục gốc trạng thái khác.

## Khắc phục sự cố

### Không xuất hiện thẻ nào

Xác nhận Plugin đã được bật cho cùng hồ sơ và thư mục gốc trạng thái:

```bash
openclaw plugins inspect workboard --runtime --json
```

Nếu bảng điều khiển hiển thị thẻ nhưng CLI không hiển thị, hãy kiểm tra xem cả hai lệnh có sử dụng cùng thiết lập `--dev` hoặc `--profile` hay không.

### Phân phối báo chỉ dữ liệu

Khởi động hoặc khởi động lại Gateway:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Sau đó thử lại `openclaw workboard dispatch`. Chế độ dự phòng chỉ dữ liệu hữu ích để dọn dẹp trạng thái cục bộ, nhưng các lượt chạy worker cần một Gateway đang hoạt động.

### Phân phối không khởi động gì

Kiểm tra xem có ít nhất một thẻ `ready` không có lượt nhận việc đang hoạt động hay không:

```bash
openclaw workboard list --status ready
```

Thẻ cũng có thể bị bỏ qua khi cùng chủ sở hữu đã có công việc đang chạy hoặc đang được review. Chuyển công việc đã hoàn tất sang `done`, giải phóng các lượt nhận việc lỗi thời thông qua công cụ Workboard hoặc chạy lại lệnh phân phối sau khi worker đang hoạt động hoàn tất.

## Liên quan

- [Plugin Workboard](/vi/plugins/workboard)
- [Tài liệu tham khảo CLI](/vi/cli)
- [Lệnh dấu gạch chéo](/vi/tools/slash-commands)
- [Control UI](/vi/web/control-ui)
