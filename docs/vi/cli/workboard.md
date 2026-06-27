---
read_when:
    - Bạn muốn kiểm tra hoặc tạo thẻ Workboard từ terminal
    - Bạn muốn điều phối các lượt chạy worker Workboard từ CLI
    - Bạn đang gỡ lỗi hành vi của Workboard CLI hoặc lệnh gạch chéo
summary: Tài liệu tham khảo CLI cho các thẻ `openclaw workboard`, điều phối và các lượt chạy tiến trình xử lý
title: CLI Bảng công việc
x-i18n:
    generated_at: "2026-06-27T17:21:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb6f5ab36b3f1f4d0eb06e5dfa9adbbe9bb14bf2ac389630da7725811ac6f47f
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` là bề mặt terminal cho
[Plugin Workboard](/vi/plugins/workboard) được đóng gói sẵn. Nó cho phép người vận hành liệt kê thẻ, tạo
thẻ, xem xét một thẻ, và yêu cầu Gateway đang chạy phân phối công việc sẵn sàng vào
các lượt chạy worker của tác nhân con.

Bật Plugin trước khi dùng lệnh:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## Cách dùng

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard dispatch [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

Lệnh đọc và ghi cùng cơ sở dữ liệu SQLite do Plugin sở hữu mà
dashboard và các công cụ tác nhân Workboard sử dụng. Id thẻ có thể được truyền bằng id đầy đủ hoặc bằng
tiền tố không mơ hồ khi một lệnh chấp nhận id thẻ.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

Đầu ra văn bản ở dạng gọn:

```text
7f4a2c10  ready     high    default agent-a  Fix stale worker heartbeat
```

Các cột là tiền tố id, trạng thái, mức ưu tiên, id bảng, id tác nhân tùy chọn, và tiêu đề.

Cờ:

| Cờ                   | Mục đích                                      |
| -------------------- | --------------------------------------------- |
| `--board <id>`       | Giới hạn kết quả trong một không gian tên bảng |
| `--status <status>`  | Giới hạn kết quả trong một trạng thái Workboard |
| `--include-archived` | Bao gồm thẻ đã lưu trữ trong đầu ra văn bản gọn |
| `--json`             | In danh sách thẻ đầy đủ dưới dạng JSON cho máy |

Đầu ra văn bản gọn mặc định ẩn thẻ đã lưu trữ để CLI khớp với
lệnh `/workboard list`. Truyền `--include-archived` để hiển thị chúng. Đầu ra JSON
giữ danh sách thẻ đầy đủ, bao gồm cả thẻ đã lưu trữ, cho tự động hóa hiện có.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

Cờ:

| Cờ                      | Mục đích                                      |
| ----------------------- | -------------------------------------------- |
| `--notes <text>`        | Ghi chú ban đầu của thẻ                      |
| `--status <status>`     | Trạng thái ban đầu, mặc định `todo`          |
| `--priority <priority>` | Mức ưu tiên, mặc định `normal`               |
| `--agent <id>`          | Gán thẻ cho một tác nhân hoặc id chủ sở hữu  |
| `--board <id>`          | Lưu thẻ trong một không gian tên bảng        |
| `--labels <items>`      | Nhãn phân tách bằng dấu phẩy                 |
| `--json`                | In thẻ đã tạo dưới dạng JSON cho máy         |

`create` ghi trực tiếp vào trạng thái SQLite của Workboard. Thẻ sẽ ngay lập tức
hiển thị trong tab Workboard của Control UI và với các công cụ Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

Đầu ra văn bản in dòng thẻ gọn và ghi chú. Đầu ra JSON trả về bản ghi thẻ đầy đủ,
bao gồm siêu dữ liệu thực thi, số lần thử, bình luận, liên kết, bằng chứng,
hiện vật, nhật ký worker, trạng thái giao thức, chẩn đoán, và siêu dữ liệu tự động hóa.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` trước tiên gọi phương thức RPC của Gateway đang chạy
`workboard.cards.dispatch`. Đường dẫn đó dùng cùng runtime tác nhân con như hành động
phân phối trên dashboard, nên các thẻ sẵn sàng sẽ trở thành các lượt chạy worker được theo dõi theo tác vụ với
khóa phiên được liên kết. Thẻ có tác nhân được gán sẽ dùng khóa phiên tác nhân con theo phạm vi tác nhân;
thẻ chưa được gán giữ khóa tác nhân con không theo phạm vi để tác nhân mặc định đã cấu hình của Gateway
được giữ nguyên.

Vòng lặp phân phối:

1. Đưa các thẻ con có dependency sẵn sàng lên `ready`.
2. Chặn claim đã hết hạn hoặc lượt chạy worker đã quá thời gian.
3. Ghi siêu dữ liệu phân phối trên các thẻ sẵn sàng.
4. Chọn một lô nhỏ các thẻ sẵn sàng chưa được claim.
5. Claim từng thẻ đã chọn cho bộ phân phối hoặc tác nhân được gán.
6. Bắt đầu một lượt chạy worker tác nhân con với ngữ cảnh thẻ được giới hạn và token claim
   của thẻ.
7. Lưu id lượt chạy worker, khóa phiên, liên kết tác vụ khi sổ cái tác vụ của Gateway
   báo cáo, trạng thái thực thi, và nhật ký worker trên thẻ.

Việc chọn được cố ý giữ thận trọng. Theo mặc định, một lần phân phối bắt đầu tối đa ba
worker, bỏ qua thẻ đã lưu trữ hoặc đã được claim, và chỉ bắt đầu một
thẻ cho mỗi chủ sở hữu hoặc tác nhân trong một lượt. Các thẻ đã thuộc về công việc đang chạy
hoặc đang review còn hoạt động sẽ được để lại cho lần phân phối sau.

Nếu khởi động worker thất bại sau khi một thẻ đã được claim, Workboard chặn thẻ đó,
xóa claim, và ghi lỗi vào siêu dữ liệu thực thi thẻ và nhật ký worker.
Điều này giữ các lần khởi động thất bại ở trạng thái nhìn thấy được thay vì âm thầm đưa
thẻ trở lại hàng đợi.

Nếu không cung cấp mục tiêu Gateway rõ ràng và Gateway cục bộ không khả dụng
hoặc chưa phơi bày phương thức phân phối Workboard, CLI sẽ fallback sang
phân phối chỉ dữ liệu trên trạng thái Workboard cục bộ. Phân phối chỉ dữ liệu vẫn có thể
đưa dependency lên sẵn sàng, dọn claim cũ, và chặn các lượt chạy quá thời gian, nhưng không
khởi động worker. Các lỗi xác thực, quyền, xác thực dữ liệu, và lỗi cho
mục tiêu `--url` hoặc `--token` rõ ràng được báo cáo trực tiếp.

Đầu ra văn bản báo cáo các lần khởi động worker:

```text
dispatch complete: started=2 failures=0
```

Đầu ra fallback là rõ ràng:

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

Đầu ra JSON bao gồm kết quả phân phối. Phân phối được Gateway hỗ trợ có thể bao gồm
`started` và `startFailures`; fallback chỉ dữ liệu bao gồm
`gatewayUnavailable: true`. Token claim được biên tập khỏi đầu ra JSON của thẻ.

Trong dashboard, cùng kết quả phân phối được hiển thị dưới dạng tóm tắt ngắn để
người vận hành có thể thấy bao nhiêu thẻ đã bắt đầu, được đưa lên sẵn sàng, bị chặn, được thu hồi, hoặc
thất bại mà không cần mở chi tiết thẻ.

## Tương đương với lệnh slash

Các kênh có khả năng lệnh có thể dùng lệnh slash tương ứng:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

Phân phối qua lệnh slash cũng dùng runtime tác nhân con của Gateway, nên nó tuân theo
cùng hành vi claim, khởi động worker, và lỗi như đường dẫn Gateway của dashboard và CLI.

`/workboard list` và `/workboard show` là các lệnh đọc dành cho người gửi lệnh được ủy quyền.
`/workboard create` và `/workboard dispatch` thay đổi trạng thái bảng và
yêu cầu trạng thái chủ sở hữu trên bề mặt trò chuyện hoặc một client Gateway có `operator.write`
hoặc `operator.admin`.

## Quyền

Đường dẫn phân phối CLI gọi RPC của Gateway với phạm vi `operator.read` và
`operator.write`. Token Gateway chỉ đọc có thể xem dữ liệu Workboard
thông qua các phương thức đọc, nhưng không thể tạo thẻ hoặc phân phối worker.

Các lệnh `list`, `create`, và `show` cục bộ hoạt động trên thư mục trạng thái OpenClaw cục bộ
được hồ sơ hiện tại sử dụng. Dùng `--dev` hoặc `--profile <name>` trên lệnh
`openclaw` cấp cao nhất khi bạn cần một gốc trạng thái khác.

## Khắc phục sự cố

### Không có thẻ nào xuất hiện

Xác nhận Plugin đã được bật cho cùng hồ sơ và gốc trạng thái:

```bash
openclaw plugins inspect workboard --runtime --json
```

Nếu dashboard hiển thị thẻ nhưng CLI thì không, hãy kiểm tra rằng cả hai lệnh dùng
cùng thiết lập `--dev` hoặc `--profile`.

### Dispatch báo chỉ dữ liệu

Khởi động hoặc khởi động lại Gateway:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Sau đó thử lại `openclaw workboard dispatch`. Fallback chỉ dữ liệu hữu ích cho việc dọn dẹp
trạng thái cục bộ, nhưng lượt chạy worker cần Gateway đang hoạt động.

### Dispatch không khởi động gì

Kiểm tra có ít nhất một thẻ `ready` không có claim đang hoạt động:

```bash
openclaw workboard list --status ready
```

Thẻ cũng có thể bị bỏ qua khi cùng chủ sở hữu đã có công việc đang chạy hoặc đang review.
Chuyển công việc đã hoàn thành sang `done`, giải phóng claim cũ thông qua các công cụ Workboard,
hoặc chạy phân phối lại sau khi worker đang hoạt động kết thúc.

## Liên quan

- [Plugin Workboard](/vi/plugins/workboard)
- [Tham chiếu CLI](/vi/cli)
- [Lệnh slash](/vi/tools/slash-commands)
- [Control UI](/vi/web/control-ui)
