---
read_when:
    - Bạn muốn kiểm tra hoặc tạo các thẻ Workboard từ terminal
    - Bạn muốn điều phối các lượt chạy worker Workboard từ CLI
    - Bạn đang gỡ lỗi hành vi của CLI Workboard hoặc lệnh gạch chéo
summary: Tài liệu tham khảo CLI cho các thẻ `openclaw workboard`, việc phân phối và các lượt chạy worker
title: CLI Workboard
x-i18n:
    generated_at: "2026-07-12T07:47:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c62dd10aff146cae9f7475423148cf61fedb39983b065a9815c629349b4e233
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` là giao diện dòng lệnh trong terminal dành cho [Plugin Workboard](/vi/plugins/workboard) đi kèm. Lệnh này cho phép người vận hành liệt kê các thẻ, tạo thẻ, xem chi tiết một thẻ và yêu cầu Gateway đang chạy phân phối công việc sẵn sàng thành các lượt chạy worker của tác tử phụ.

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
openclaw workboard dispatch [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

Lệnh đọc và ghi cùng cơ sở dữ liệu SQLite do Plugin sở hữu mà bảng điều khiển và các công cụ tác tử Workboard sử dụng. ID thẻ là UUID; các lệnh chấp nhận ID thẻ cũng chấp nhận tiền tố ID không mơ hồ (đầu ra văn bản thu gọn hiển thị 8 ký tự đầu tiên).

Các giá trị `status` hợp lệ: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`. Các giá trị `priority` hợp lệ: `low`, `normal`, `high`, `urgent`.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

Đầu ra văn bản có dạng thu gọn:

```text
7f4a2c10  ready     high    default agent-a  Fix stale worker heartbeat
```

Các cột lần lượt là tiền tố ID, trạng thái, mức ưu tiên, ID bảng, ID tác tử tùy chọn và tiêu đề.

| Cờ                   | Mục đích                                                       |
| -------------------- | -------------------------------------------------------------- |
| `--board <id>`       | Giới hạn kết quả trong một không gian tên bảng                 |
| `--status <status>`  | Giới hạn kết quả ở một trạng thái Workboard                    |
| `--include-archived` | Bao gồm các thẻ đã lưu trữ trong đầu ra văn bản thu gọn        |
| `--json`             | In toàn bộ danh sách thẻ dưới dạng JSON cho máy xử lý          |

Theo mặc định, đầu ra văn bản thu gọn ẩn các thẻ đã lưu trữ để CLI khớp với `/workboard list`. Truyền `--include-archived` để hiển thị chúng. Đầu ra JSON luôn giữ toàn bộ danh sách thẻ, bao gồm các thẻ đã lưu trữ, để hỗ trợ các quy trình tự động hóa hiện có.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

| Cờ                      | Mục đích                                                |
| ----------------------- | ------------------------------------------------------- |
| `--notes <text>`        | Ghi chú ban đầu của thẻ                                 |
| `--status <status>`     | Trạng thái ban đầu, mặc định là `todo`                  |
| `--priority <priority>` | Mức ưu tiên, mặc định là `normal`                       |
| `--agent <id>`          | Gán thẻ cho một tác tử hoặc ID chủ sở hữu               |
| `--board <id>`          | Lưu thẻ trong một không gian tên bảng                   |
| `--labels <items>`      | Các nhãn phân tách bằng dấu phẩy                        |
| `--json`                | In thẻ đã tạo dưới dạng JSON cho máy xử lý              |

`create` ghi trực tiếp vào trạng thái SQLite của Workboard. Thẻ hiển thị ngay lập tức trong thẻ Workboard của Control UI và với các công cụ Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

Đầu ra văn bản in dòng thẻ thu gọn và ghi chú. Đầu ra JSON trả về toàn bộ bản ghi thẻ, bao gồm siêu dữ liệu thực thi, các lần thử, bình luận, liên kết, bằng chứng, tạo phẩm, nhật ký worker, trạng thái giao thức, thông tin chẩn đoán và siêu dữ liệu tự động hóa.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Trước tiên, `dispatch` gọi phương thức RPC `workboard.cards.dispatch` của Gateway đang chạy. Phương thức này sử dụng cùng môi trường thực thi tác tử phụ như thao tác phân phối trên bảng điều khiển, vì vậy các thẻ sẵn sàng trở thành các lượt chạy worker được theo dõi theo tác vụ với khóa phiên được liên kết. Các thẻ được gán tác tử sử dụng khóa phiên tác tử phụ theo phạm vi tác tử; các thẻ chưa được gán giữ khóa tác tử phụ không có phạm vi để duy trì tác tử mặc định đã cấu hình của Gateway.

Vòng lặp phân phối:

1. Chuyển các thẻ con có phần phụ thuộc đã sẵn sàng sang `ready`.
2. Chặn các quyền nhận việc đã hết hạn hoặc các lượt chạy worker đã hết thời gian chờ.
3. Ghi siêu dữ liệu phân phối vào các thẻ sẵn sàng.
4. Chọn một lô nhỏ các thẻ sẵn sàng chưa được nhận.
5. Nhận từng thẻ đã chọn cho bộ phân phối hoặc tác tử được chỉ định.
6. Bắt đầu một lượt chạy worker của tác tử phụ với ngữ cảnh thẻ được giới hạn và mã thông báo nhận việc của thẻ.
7. Lưu ID lượt chạy worker, khóa phiên, liên kết tác vụ khi sổ cái tác vụ của Gateway báo cáo, trạng thái thực thi và nhật ký worker vào thẻ.

Quá trình lựa chọn có tính thận trọng: theo mặc định, mỗi lần phân phối bắt đầu tối đa ba worker, bỏ qua các thẻ đã lưu trữ hoặc đã được nhận và chỉ bắt đầu một thẻ cho mỗi chủ sở hữu hoặc tác tử trong một lượt. Các thẻ đã thuộc về công việc đang chạy hoặc đang được xem xét sẽ được để lại cho lần phân phối sau.

Nếu không thể bắt đầu worker sau khi thẻ đã được nhận, Workboard sẽ chặn thẻ đó, xóa quyền nhận việc và ghi lỗi vào siêu dữ liệu thực thi cũng như nhật ký worker của thẻ, giúp các lần khởi động thất bại vẫn hiển thị thay vì âm thầm đưa thẻ trở lại hàng đợi.

Nếu không chỉ định đích Gateway rõ ràng và Gateway cục bộ không khả dụng hoặc chưa cung cấp phương thức phân phối Workboard, CLI sẽ chuyển sang phương án dự phòng chỉ phân phối dữ liệu dựa trên trạng thái Workboard cục bộ. Phân phối chỉ dữ liệu vẫn có thể thúc đẩy các phần phụ thuộc, dọn dẹp quyền nhận việc cũ và chặn các lượt chạy đã hết thời gian chờ, nhưng không bắt đầu worker. Các lỗi xác thực, quyền hạn và kiểm tra tính hợp lệ, cũng như lỗi đối với đích `--url` hoặc `--token` được chỉ định rõ ràng, sẽ được báo cáo trực tiếp thay vì kích hoạt phương án dự phòng.

Đầu ra văn bản báo cáo số worker được bắt đầu:

```text
dispatch complete: started=2 failures=0
```

Đầu ra dự phòng được nêu rõ:

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

Đầu ra JSON bao gồm kết quả phân phối. Phân phối qua Gateway có thể bao gồm `started` và `startFailures`; phương án dự phòng chỉ dữ liệu bao gồm `gatewayUnavailable: true`. Mã thông báo nhận việc được che khỏi đầu ra JSON của thẻ.

Trên bảng điều khiển, kết quả phân phối tương tự được hiển thị dưới dạng bản tóm tắt ngắn để người vận hành có thể thấy số lượng thẻ đã được bắt đầu, thúc đẩy, chặn, nhận lại hoặc thất bại mà không cần mở chi tiết thẻ.

## Tương đương với lệnh gạch chéo

Các kênh hỗ trợ lệnh có thể sử dụng lệnh gạch chéo tương ứng:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

Phân phối bằng lệnh gạch chéo cũng sử dụng môi trường thực thi tác tử phụ của Gateway, vì vậy tuân theo cùng hành vi nhận việc, bắt đầu worker và xử lý lỗi như bảng điều khiển và đường dẫn Gateway của CLI.

`/workboard list` và `/workboard show` là các lệnh đọc dành cho người gửi lệnh được ủy quyền. `/workboard create` và `/workboard dispatch` thay đổi trạng thái bảng và yêu cầu trạng thái chủ sở hữu trên các bề mặt trò chuyện hoặc một máy khách Gateway có `operator.write` hoặc `operator.admin`.

## Quyền hạn

Đường dẫn phân phối của CLI gọi RPC Gateway với các phạm vi `operator.read` và `operator.write`. Mã thông báo Gateway chỉ đọc có thể xem dữ liệu Workboard qua các phương thức đọc, nhưng không thể tạo thẻ hoặc phân phối worker.

Các lệnh cục bộ `list`, `create` và `show` thao tác trên thư mục trạng thái OpenClaw cục bộ mà hồ sơ hiện tại sử dụng. Sử dụng `--dev` hoặc `--profile <name>` trên lệnh `openclaw` cấp cao nhất khi cần một thư mục gốc trạng thái khác.

## Khắc phục sự cố

### Không có thẻ nào xuất hiện

Xác nhận Plugin được bật cho cùng hồ sơ và thư mục gốc trạng thái:

```bash
openclaw plugins inspect workboard --runtime --json
```

Nếu bảng điều khiển hiển thị thẻ nhưng CLI không hiển thị, hãy kiểm tra để bảo đảm cả hai lệnh sử dụng cùng cài đặt `--dev` hoặc `--profile`.

### Phân phối báo chỉ dữ liệu

Khởi động hoặc khởi động lại Gateway:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Sau đó thử lại `openclaw workboard dispatch`. Phương án dự phòng chỉ dữ liệu hữu ích để dọn dẹp trạng thái cục bộ, nhưng các lượt chạy worker cần một Gateway đang hoạt động.

### Phân phối không bắt đầu công việc nào

Kiểm tra xem có ít nhất một thẻ `ready` không có quyền nhận việc đang hoạt động:

```bash
openclaw workboard list --status ready
```

Thẻ cũng có thể bị bỏ qua khi cùng chủ sở hữu đã có công việc đang chạy hoặc đang được xem xét. Chuyển công việc đã hoàn tất sang `done`, giải phóng các quyền nhận việc cũ bằng công cụ Workboard hoặc chạy lại lệnh phân phối sau khi worker đang hoạt động hoàn tất.

## Liên quan

- [Plugin Workboard](/vi/plugins/workboard)
- [Tài liệu tham khảo CLI](/vi/cli)
- [Lệnh gạch chéo](/vi/tools/slash-commands)
- [Control UI](/vi/web/control-ui)
