---
read_when:
    - Bạn gặp sự cố kết nối/xác thực và muốn được hướng dẫn cách khắc phục
    - Bạn đã cập nhật và muốn kiểm tra nhanh tính hợp lý
summary: Tài liệu tham khảo CLI cho `openclaw doctor` (kiểm tra tình trạng + sửa chữa có hướng dẫn)
title: Chẩn đoán
x-i18n:
    generated_at: "2026-07-19T05:43:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e2b0aa9b51d7bccd4357d3ec747be514a0245b44a90e6e6c7ea789ab68420465
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Các bước kiểm tra tình trạng và khắc phục nhanh cho Gateway, các kênh, plugin, Skills, định tuyến mô hình, trạng thái cục bộ và di chuyển cấu hình. Hãy sử dụng lệnh này bất cứ khi nào có thành phần không hoạt động như mong đợi và bạn muốn một lệnh giải thích nguyên nhân.

Khi trạng thái Gateway báo cáo các chủ sở hữu SecretRef bị suy giảm, doctor sẽ in cảnh báo **Suy giảm thời gian chạy bí mật** kèm theo mọi chủ sở hữu nguội hoặc lỗi thời, đường dẫn cấu hình bị ảnh hưởng, lý do đã được che thông tin nhạy cảm và lệnh thử lại `openclaw secrets reload`.

Khi các sự kiện đầu vào của kênh bị chuyển vào hàng đợi thư lỗi, doctor sẽ nêu tên từng tài khoản kênh bị ảnh hưởng và trỏ đến [`openclaw channels dead-letters list`](/vi/cli/channels#inbound-dead-letters) để kiểm tra và khôi phục.

Liên quan:

- Khắc phục sự cố: [Khắc phục sự cố](/vi/gateway/troubleshooting)
- Kiểm tra bảo mật: [Bảo mật](/vi/gateway/security)

## Chế độ hoạt động

Doctor có năm chế độ hoạt động:

| Chế độ hoạt động          | Lệnh                                      | Hành vi                                                                                       |
| ------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| Kiểm tra                  | `openclaw doctor`                        | Các bước kiểm tra hướng đến con người và lời nhắc có hướng dẫn.                               |
| Sửa chữa                  | `openclaw doctor --fix`                        | Áp dụng các sửa chữa được hỗ trợ, sử dụng lời nhắc trừ khi có thể sửa chữa an toàn ở chế độ không tương tác. |
| Lint                      | `openclaw doctor --lint`                        | Các phát hiện có cấu trúc, chỉ đọc dành cho CI, kiểm tra trước và cổng review.                 |
| Bảo trì SQLite dùng chung | `openclaw doctor --state-sqlite compact`                        | Chủ động tạo checkpoint, thu gọn và xác minh cơ sở dữ liệu trạng thái dùng chung chuẩn.       |
| Di chuyển SQLite phiên    | `openclaw doctor --session-sqlite <mode>`                        | Kiểm tra, nhập, xác thực, thu gọn, khôi phục hoặc phục hồi trạng thái phiên.                   |

Ưu tiên `--lint` khi quy trình tự động hóa cần kết quả ổn định. Ưu tiên `--fix` khi người vận hành muốn doctor chỉnh sửa cấu hình hoặc trạng thái.

## Ví dụ

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
openclaw doctor --state-sqlite compact
openclaw doctor --state-sqlite compact --json
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-agent main --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Đối với các quyền riêng theo kênh, hãy sử dụng các phép dò kênh thay vì `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

`channels capabilities` báo cáo các quyền có hiệu lực của bot đối với một đích kênh cụ thể. `channels status --probe` kiểm tra tất cả các kênh đã cấu hình và các đích tự động tham gia thoại.

## Tùy chọn

| Tùy chọn                        | Tác dụng                                                                                                                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-workspace-suggestions`              | Tắt các đề xuất về bộ nhớ/tìm kiếm trong không gian làm việc.                                                                                                                          |
| `--yes`              | Chấp nhận các giá trị mặc định mà không hiển thị lời nhắc.                                                                                                                             |
| `--repair` / `--fix` | Áp dụng các sửa chữa không liên quan đến dịch vụ được đề xuất mà không hiển thị lời nhắc (`--fix` là bí danh). Việc cài đặt/ghi lại dịch vụ Gateway vẫn yêu cầu xác nhận tương tác hoặc các lệnh `gateway` rõ ràng. |
| `--force`              | Áp dụng các sửa chữa mạnh tay, bao gồm ghi đè cấu hình dịch vụ tùy chỉnh.                                                                                                              |
| `--non-interactive`              | Chạy không có lời nhắc; chỉ thực hiện các quá trình di chuyển an toàn và sửa chữa không liên quan đến dịch vụ.                                                                         |
| `--generate-gateway-token`              | Tạo và cấu hình token Gateway.                                                                                                                                                         |
| `--allow-exec`              | Cho phép doctor thực thi các SecretRef `exec` đã cấu hình trong khi xác minh bí mật.                                                                                       |
| `--deep`              | Quét các dịch vụ hệ thống để tìm các bản cài đặt Gateway bổ sung; báo cáo các lần bàn giao khởi động lại gần đây của trình giám sát Gateway.                                           |
| `--lint`              | Chạy các bước kiểm tra tình trạng đã được hiện đại hóa ở chế độ chỉ đọc và xuất các phát hiện chẩn đoán.                                                                               |
| `--post-upgrade`              | Chạy các phép dò tương thích plugin sau nâng cấp; các phát hiện được ghi ra stdout; mã thoát là 1 nếu có bất kỳ phát hiện cấp lỗi nào.                                                  |
| `--state-sqlite <mode>`              | Chạy bảo trì SQLite trạng thái dùng chung một cách rõ ràng. Chế độ duy nhất là `compact`.                                                                                     |
| `--session-sqlite <mode>`              | Chạy chế độ di chuyển SQLite phiên được nhắm mục tiêu: `inspect`, `dry-run`, `import`, `validate`, `compact`, `recover` hoặc `restore`. |
| `--session-sqlite-store <path>`              | Với `--session-sqlite`: chọn một đường dẫn kho `sessions.json` cũ.                                                                                                                  |
| `--session-sqlite-agent <id>`              | Với `--session-sqlite`: chọn một tác tử đã cấu hình.                                                                                                                                   |
| `--session-sqlite-all-agents`              | Với `--session-sqlite`: chọn các kho tác tử đã cấu hình và được phát hiện.                                                                                                             |
| `--github-issue`              | Với `--session-sqlite recover`: chuẩn bị báo cáo sự cố openclaw/openclaw đã được loại bỏ thông tin nhạy cảm; doctor tạo báo cáo đó bằng `gh` sau `--yes` hoặc sau khi xác nhận tương tác. |
| `--json`              | Với `--lint`: các phát hiện dạng JSON. Với `--post-upgrade`: `{ probesRun, findings }`. Với `--state-sqlite` hoặc `--session-sqlite`: báo cáo bảo trì dạng JSON.                 |
| `--severity-min <level>`              | Với `--lint`: loại bỏ các phát hiện dưới `info`, `warning` hoặc `error`.                                                                      |
| `--all`              | Với `--lint`: chạy tất cả các bước kiểm tra đã đăng ký, bao gồm các bước kiểm tra phải chủ động bật và bị loại khỏi tập mặc định.                                            |
| `--skip <id>`              | Với `--lint`: bỏ qua một mã bước kiểm tra. Có thể lặp lại.                                                                                                                    |
| `--only <id>`              | Với `--lint`: chỉ chạy các mã bước kiểm tra đã cho. Có thể lặp lại.                                                                                                          |

`--severity-min`, `--all`, `--only` và `--skip` chỉ được chấp nhận khi dùng cùng `--lint`; `--json` được chấp nhận với `--lint`, `--post-upgrade`, `--state-sqlite` và `--session-sqlite`.

## Chế độ lint

`openclaw doctor --lint` là chế độ chỉ đọc: không có lời nhắc, không sửa chữa, không ghi lại cấu hình/trạng thái.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

Đầu ra dành cho con người rất ngắn gọn:

```text
doctor --lint: đã chạy 6 bước kiểm tra, có 1 phát hiện
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode chưa được đặt; việc khởi động Gateway sẽ bị chặn.
    cách khắc phục: Chạy `openclaw configure` và đặt chế độ Gateway (local/remote), hoặc chạy `openclaw config set gateway.mode local`.
```

Đầu ra JSON là giao diện dành cho tập lệnh:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode chưa được đặt; việc khởi động Gateway sẽ bị chặn.",
      "path": "gateway.mode",
      "fixHint": "Chạy `openclaw configure` và đặt chế độ Gateway (local/remote), hoặc chạy `openclaw config set gateway.mode local`."
    }
  ]
}
```

Mã thoát:

| Mã | Ý nghĩa                                                               |
| -- | --------------------------------------------------------------------- |
| `0` | Không có phát hiện nào đạt hoặc vượt ngưỡng mức độ nghiêm trọng đã chọn. |
| `1` | Có ít nhất một phát hiện đạt ngưỡng đã chọn.                           |
| `2` | Lệnh/thời gian chạy thất bại trước khi có thể tạo các phát hiện lint.  |

`--severity-min` kiểm soát cả những phát hiện được in và ngưỡng thoát: `openclaw doctor --lint --severity-min error` có thể không in gì và thoát với mã `0` ngay cả khi tồn tại các phát hiện `info`/`warning` có mức độ nghiêm trọng thấp hơn.

`--all` kiểm soát những bước kiểm tra được chọn trước khi lọc theo mức độ nghiêm trọng. Theo mặc định, lượt chạy lint loại trừ các bước kiểm tra chuyên sâu, mang tính lịch sử hoặc có nhiều khả năng phát hiện phần dư thừa cũ có thể sửa chữa; hãy dùng `--all` để lấy toàn bộ danh mục. `--only <id>` là bộ chọn chính xác nhất và có thể chạy bất kỳ bước kiểm tra đã đăng ký nào theo mã.

`core/doctor/local-audio-acceleration` báo cáo lệnh STT cục bộ được chọn tự động, bằng chứng riêng biệt về backend có khả năng đáp ứng/được yêu cầu/được quan sát và thứ tự dự phòng mà không cần tải mô hình giọng nói. Bước này tạo một phát hiện mang tính thông tin, vì vậy hãy thêm `--severity-min info` để hiển thị phát hiện đó.

## Kiểm tra tình trạng có cấu trúc

Các bước kiểm tra doctor hiện đại sử dụng một hợp đồng phân tách nhỏ:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` hỗ trợ `doctor --lint`. `repair()` là tùy chọn và chỉ chạy trong `doctor --fix` / `doctor --repair`. Các bước kiểm tra chưa được di chuyển sang cấu trúc này vẫn sử dụng luồng đóng góp doctor cũ.

Ngữ cảnh sửa chữa có thể mang các yêu cầu `dryRun`/`diff`; kết quả sửa chữa có thể trả về `diffs` có cấu trúc (chỉnh sửa cấu hình/tệp) và `effects` (dịch vụ, tiến trình, gói, trạng thái hoặc các tác dụng phụ khác), nhờ đó các bước kiểm tra đã chuyển đổi có thể phát triển hướng tới `doctor --fix --dry-run` mà không chuyển việc lập kế hoạch thay đổi vào `detect()`.

`repair()` báo cáo `status: "repaired" | "skipped" | "failed"` (bỏ qua trạng thái có nghĩa là `repaired`). Khi quá trình sửa chữa trả về `skipped` hoặc `failed`, doctor báo cáo lý do và bỏ qua bước xác thực cho kiểm tra đó. Sau khi sửa chữa thành công, doctor chạy lại `detect()` trong phạm vi các phát hiện đã sửa; nếu phát hiện vẫn còn, doctor báo cáo cảnh báo sửa chữa thay vì coi thay đổi là hoàn tất.

Một phát hiện bao gồm:

| Trường             | Mục đích                                                |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | ID ổn định cho các bộ lọc bỏ qua/chỉ định và danh sách cho phép của CI.     |
| `severity`        | `info`, `warning` hoặc `error`.                         |
| `message`         | Mô tả vấn đề mà con người có thể đọc được.                      |
| `path`            | Cấu hình, tệp hoặc đường dẫn logic khi có.          |
| `line` / `column` | Vị trí nguồn khi có.                        |
| `ocPath`          | Địa chỉ `oc://` chính xác khi một kiểm tra có thể trỏ tới địa chỉ đó. |
| `fixHint`         | Hành động đề xuất cho người vận hành hoặc bản tóm tắt sửa chữa.           |

Các kiểm tra doctor cốt lõi đã được hiện đại hóa vẫn gắn với phần đóng góp doctor có thứ tự sở hữu hành vi `doctor` / `doctor --fix` dành cho con người của chúng. Registry tình trạng có cấu trúc dùng chung là điểm mở rộng: các kiểm tra đi kèm và dựa trên Plugin chạy sau các kiểm tra doctor cốt lõi khi gói sở hữu chúng đăng ký chúng trong đường dẫn lệnh đang hoạt động. `openclaw/plugin-sdk/health` cung cấp cùng hợp đồng đó cho tác giả Plugin.

## Lựa chọn kiểm tra

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` và `--skip` chấp nhận ID kiểm tra đầy đủ và có thể được lặp lại. Nếu một ID `--only` chưa được đăng ký, sẽ không có kiểm tra nào chạy cho ID đó; hãy dùng `checksRun`/`checksSkipped` trong đầu ra để xác nhận rằng một cổng kiểm tra tập trung chọn đúng các kiểm tra bạn mong đợi.

## Chế độ sau nâng cấp

`openclaw doctor --post-upgrade` chạy các phép thăm dò khả năng tương thích của Plugin để nối chuỗi sau khi xây dựng hoặc nâng cấp. Các phát hiện được ghi vào stdout; mã thoát là 1 nếu bất kỳ phát hiện nào có `level: "error"`. Thêm `--json` để nhận một lớp bao có thể đọc bằng máy (`{ probesRun, findings }`), phù hợp với CI, skill `fork-upgrade` của cộng đồng và các công cụ kiểm tra nhanh sau nâng cấp khác. Nếu chỉ mục Plugin đã cài đặt bị thiếu hoặc sai định dạng, chế độ JSON vẫn phát lớp bao với một phát hiện lỗi `plugin.index_unavailable`.

Khởi động ảnh container là ngoại lệ đối với luồng thông thường "chạy doctor sau khi
cập nhật". Khi `openclaw gateway run` khởi động trên một phiên bản OpenClaw mới, nó
chạy các bước sửa chữa an toàn cho trạng thái và Plugin trước khi báo cáo sẵn sàng. Nếu quá trình sửa chữa không thể
hoàn tất an toàn, quá trình khởi động sẽ thoát và yêu cầu bạn chạy chính ảnh đó một lần với
`openclaw doctor --fix` trên cùng trạng thái/cấu hình đã gắn kết trước khi khởi động lại
container theo cách thông thường.

## Di chuyển trạng thái cũ

`openclaw doctor --fix` là chủ sở hữu duy nhất của các quá trình di chuyển lâu bền từ tệp sang SQLite. Nó xác thực và tiếp nhận từng nguồn được nhận dạng, ghi và xác minh các hàng chuẩn, ghi lại biên nhận di chuyển, sau đó xóa nguồn đã ngừng sử dụng. Mã thời gian chạy không thực hiện nhập lười hoặc đọc dự phòng.

Điều này bao gồm các tệp OAuth MCP đã ngừng sử dụng trong `<state-dir>/mcp-oauth/*.json`. Hãy dừng Gateway trước khi sửa chữa. Doctor nhập thông tin xác thực hợp lệ vào `<state-dir>/state/openclaw.sqlite`, giữ nguyên phiên SQLite chuẩn hiện có khi cả hai kho cùng tồn tại, loại bỏ giá trị OAuth `state` lâu bền đã lỗi thời và dùng biên nhận của nó để ngăn một tệp cũ được tạo lại khôi phục thông tin xác thực đã đăng xuất. Các tệp phụ `.lock` đã ngừng sử dụng sẽ đóng khi lỗi: nếu Doctor báo cáo một chủ sở hữu cũ, hãy xác minh rằng không có tiến trình OpenClaw cũ nào đang chạy, xóa tệp phụ đó và chạy lại Doctor.

## Compaction SQLite trạng thái dùng chung

Xem [Lược đồ cơ sở dữ liệu](/vi/reference/database-schemas) để biết về quản lý phiên bản lược đồ, kiểm tra tính toàn vẹn và khôi phục khi hạ cấp.

`openclaw doctor --state-sqlite compact` là hoạt động bảo trì ngoại tuyến tường minh cho
cơ sở dữ liệu trạng thái dùng chung chuẩn tại
`<state-dir>/state/openclaw.sqlite`. Lệnh này không chấp nhận đường dẫn cơ sở dữ liệu
tùy ý, không bao giờ được hoạt động Gateway thông thường gọi và không phải là một phần của
`openclaw doctor --fix`. Lệnh lấy cùng khóa quyền sở hữu trạng thái như khi
Gateway khởi động và giữ khóa trong suốt quá trình xác thực, tạo điểm kiểm tra, `VACUUM` và
các bước kiểm tra tính toàn vẹn cuối cùng. Lệnh từ chối chạy khi một Gateway hoặc một
lệnh bảo trì SQLite khác đang sở hữu khóa đó. Khóa trạng thái vẫn hoạt động khi
`OPENCLAW_ALLOW_MULTI_GATEWAY=1` bỏ qua phiên bản Gateway đơn nhất theo từng cấu hình, vì vậy
shell của người vận hành không cần kế thừa môi trường của dịch vụ Gateway để
quá trình bảo trì phát hiện được dịch vụ này.

Trước tiên, hãy dừng Gateway và tạo một bản sao lưu đã xác minh:

```bash
openclaw gateway stop
openclaw backup create --verify
openclaw doctor --state-sqlite compact --json
openclaw gateway start
```

Lệnh này:

1. Yêu cầu một tệp thông thường tại đường dẫn trạng thái dùng chung chuẩn. Cơ sở dữ liệu
   bị thiếu được báo cáo là `skipped` và thoát thành công.
2. Xác thực phiên bản lược đồ hiện được hỗ trợ và
   `schema_meta.role = "global"` trước khi tạo điểm kiểm tra hoặc thay đổi tệp.
3. Yêu cầu `wal_checkpoint(TRUNCATE)` không bận. Hãy dừng mọi tiến trình OpenClaw
   còn lại và thử lại nếu điểm kiểm tra đang bận.
4. Đặt `auto_vacuum` thành `INCREMENTAL`, chạy `VACUUM` đầy đủ và tạo điểm kiểm tra
   lần nữa.
5. Chạy `quick_check`, `integrity_check` và `foreign_key_check`, sau đó
   áp dụng lại quyền chỉ dành cho chủ sở hữu đối với cơ sở dữ liệu và các tệp phụ SQLite.

Đầu ra JSON báo cáo kích thước cơ sở dữ liệu và WAL, số trang trong danh sách trống, kích thước trang và
giá trị `auto_vacuum` trước và sau Compaction, cùng số byte đã thu hồi và
kết quả `quick_check` và `integrity_check`. `foreign_key_check` được thực thi theo chế độ
đóng khi lỗi và không có trường thành công riêng. SQLite báo cáo `auto_vacuum` dưới dạng
`0` khi không có, `1` khi đầy đủ và `2` khi tăng dần.

Compaction thất bại mà không thay đổi dữ liệu khi lược đồ đã cũ, mới hơn
bản dựng OpenClaw đang chạy hoặc thuộc về cơ sở dữ liệu của agent. Trước tiên, hãy chạy
`openclaw doctor --fix` đối với lược đồ trạng thái dùng chung cũ hơn. Khôi phục một
bản sao lưu tương thích hoặc nâng cấp OpenClaw đối với lược đồ mới hơn.

## Di chuyển SQLite của phiên

OpenClaw tự động nhập các hàng phiên cũ và lịch sử bản chép lời vào cơ sở dữ liệu
SQLite của từng agent trong quá trình khởi động Gateway và trong
`openclaw doctor --fix`. `openclaw doctor --session-sqlite <mode>` là
công cụ kiểm tra và xác thực chuyên biệt cho quá trình di chuyển đó. Các hàng phiên
thời gian chạy hiện tại nằm trong
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Các tệp
`sessions.json` cũ là nguồn di chuyển. Các tệp JSONL bản chép lời đang hoạt động được
nhập và lưu trữ ra khỏi thư mục phiên đang hoạt động sau khi nhập
thành công; các tệp JSONL ở tầng lưu trữ vẫn là hiện vật hỗ trợ, không phải
nguồn dự phòng thời gian chạy.

Các chế độ:

| Chế độ       | Hành vi                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inspect`  | Đọc số lượng cũ và SQLite, cùng các tệp JSONL không được tham chiếu, mà không nhập.                                       |
| `dry-run`  | Phân tích các mục cũ và tệp JSONL bản chép lời, đếm số hàng có thể nhập và báo cáo vấn đề mà không ghi hàng SQLite. |
| `import`   | Nhập các mục cũ và sự kiện bản chép lời vào SQLite cho các mục tiêu đã chọn.                                      |
| `validate` | So sánh các nguồn cũ đã chọn với các hàng SQLite và số lượng sự kiện bản chép lời.                                   |
| `compact`  | Tạo điểm kiểm tra và VACUUM các cơ sở dữ liệu SQLite của agent đã chọn để thu hồi các trang trống sau khi xóa nhiều dữ liệu hoặc dọn dẹp kho lưu trữ.    |
| `recover`  | Khôi phục lần chạy di chuyển thất bại gần nhất, xác thực các mục tiêu của lần chạy đó và chuẩn bị báo cáo vấn đề GitHub đã được làm sạch.            |
| `restore`  | Khôi phục các hiện vật bản chép lời đã lưu trữ từ manifest di chuyển được ghi lại mà không xóa dữ liệu SQLite.                  |

Bộ chọn:

- Mặc định: kho agent mặc định đã cấu hình, khi tệp kho cũ đó tồn tại.
- `--session-sqlite-agent <id>`: một agent đã cấu hình.
- `--session-sqlite-all-agents`: các kho agent đã cấu hình cùng các kho agent được phát hiện.
- `--session-sqlite-store <path>`: một đường dẫn `sessions.json` cũ được chỉ định tường minh.

Trình tự kiểm tra thủ công:

```bash
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-all-agents --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
```

Hãy sao lưu thư mục trạng thái OpenClaw trước khi chạy `import` trên một bản cài đặt có
lịch sử quan trọng. `validate` thoát với mã khác 0 khi một mục cũ đã chọn
bị thiếu trong SQLite, ID phiên khác nhau hoặc số lượng sự kiện bản chép lời khác nhau.
Khi dùng `--session-sqlite-store <path>`, hãy kiểm tra rằng báo cáo chứa
số lượng mục tiêu dự kiến; một đường dẫn kho tường minh không tồn tại sẽ không chọn mục tiêu nào.

Các thao tác xóa SQLite trước tiên thu hồi các trang bên trong cơ sở dữ liệu; chúng không nhất thiết
làm tệp cơ sở dữ liệu thu nhỏ ngay lập tức. Sau khi xóa hoặc lưu trữ các
bản chép lời lớn, hãy chạy `openclaw doctor --session-sqlite compact --session-sqlite-all-agents`
để tạo điểm kiểm tra cho các tệp WAL, chạy `VACUUM` và báo cáo kích thước cơ sở dữ liệu và WAL
trước/sau. Compaction yêu cầu một tệp thông thường có lược đồ agent hiện tại,
siêu dữ liệu chủ sở hữu lâu bền của agent đã chọn và không có handle đang mở trong tiến trình
doctor. Các chế độ phá hủy `import`, `compact`, `recover` và `restore`
giữ cùng khóa quyền sở hữu trạng thái như khi Gateway khởi động trong toàn bộ hoạt động của chúng;
`inspect`, `dry-run` và `validate` vẫn chỉ đọc và không lấy khóa. Trước tiên, hãy dừng
Gateway. Các chế độ phá hủy thất bại thay vì chạy đua với thao tác ghi trực tiếp hoặc
một lệnh bảo trì khác. Mục tiêu `--session-sqlite-store`
phá hủy phải nằm trong thư mục trạng thái đang hoạt động; hãy đặt `OPENCLAW_STATE_DIR` thành
thư mục trạng thái sở hữu kho trước khi bảo trì một bản cài đặt khác.
Các mục tiêu liên kết cứng hiện có bị từ chối vì một đường dẫn khác có thể dùng chung
inode cơ sở dữ liệu bên ngoài thư mục trạng thái đã khóa. Các bước kiểm tra quyền sở hữu tương tự
bao phủ các tệp phụ WAL, bộ nhớ dùng chung và nhật ký hoàn tác của SQLite.

Mỗi lần nhập ghi một manifest vào
`~/.openclaw/session-sqlite-migration-runs/` trước khi chuyển các hiện vật bản chép lời
vào kho lưu trữ. Nếu quá trình khởi động báo cáo một lần di chuyển SQLite của phiên thất bại sau khi
các hiện vật đã được di chuyển, hãy chạy khôi phục:

```bash
openclaw doctor --session-sqlite recover --github-issue
```

Quá trình khôi phục chọn manifest di chuyển bị lỗi gần nhất, chỉ khôi phục các
cấu phần đã lưu trữ của manifest, xác thực các đích bị ảnh hưởng, làm mới các báo cáo
`.failure.md` và `.failure.json` đã được làm sạch, đồng thời chuẩn bị nội dung
sự cố GitHub không chứa nội dung bản ghi hội thoại, môi trường thô, bí mật và
cấu hình không giới hạn. Khi không có manifest di chuyển bị lỗi nhưng cơ sở dữ liệu
SQLite của tác nhân đã chọn bị hỏng, không phải là cơ sở dữ liệu hoặc có các tệp
nhật ký phụ nhưng không có cơ sở dữ liệu chính, quá trình khôi phục sẽ sao chép
toàn bộ tập hợp tệp vào một thư mục kiểm tra tạm thời. SQLite có thể hoàn tác
một nhật ký nóng hợp lệ trong bản sao dùng một lần đó trước khi chạy
`quick_check`, `integrity_check` và `foreign_key_check`, trong khi các tệp
điều tra ban đầu vẫn không bị thay đổi. Các lần kiểm tra tính toàn vẹn thất bại
hoặc các tệp phụ mồ côi sẽ bảo toàn các tệp DB, WAL, SHM và nhật ký hoàn tác bằng
cách đổi tên toàn bộ tập hợp được phát hiện với cùng một hậu tố `.corrupt-<timestamp>`.
Nếu bắt được lỗi đổi tên, các tệp đã di chuyển sẽ được hoàn tác trước khi báo lỗi,
nhờ đó tập hợp tệp có thể khôi phục không bị âm thầm chia tách. Hãy dừng Gateway
trước khi khôi phục; việc sao chép hoặc đổi tên một tập hợp tệp SQLite đang thay
đổi là không an toàn và có hành vi khác nhau giữa các hệ điều hành. Với
`--github-issue --yes`, doctor sử dụng GitHub CLI để tạo sự cố trong
`openclaw/openclaw`; nếu không có xác nhận, công cụ sẽ ghi báo cáo hỗ trợ cục bộ
và in URL sự cố đã được điền sẵn.

`restore` vẫn là thao tác hoàn tác cấp thấp hơn. Thao tác này sử dụng
các bản ghi `sourcePath -> archivePath` của manifest, chỉ di chuyển các cấu phần đã lưu trữ
trở lại khi đường dẫn ban đầu không tồn tại, báo cáo xung đột khi cả hai đường dẫn
đều tồn tại và giữ nguyên cơ sở dữ liệu SQLite.

### Hạ cấp sau khi di chuyển phiên sang SQLite

Trước khi khởi động một phiên bản OpenClaw cũ hơn sử dụng tệp, hãy khôi phục các
cấu phần bản ghi hội thoại cũ đã lưu trữ:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Các phiên bản cũ hơn đọc các mục `sessions.json` và các đường dẫn
`sessionFile` được ghi trong những mục đó. Sau khi di chuyển sang SQLite,
các lần nhập thành công sẽ chuyển bản ghi hội thoại JSONL đang hoạt động vào
`session-sqlite-import-archive/`, vì vậy runtime cũ hơn không thể thấy lịch sử đó cho đến khi
thao tác khôi phục chuyển các cấu phần được ghi trong manifest trở lại đường dẫn
ban đầu của chúng.

Thao tác khôi phục không xóa dữ liệu SQLite. Các phiên được tạo sau khi chuyển
sang SQLite chỉ tồn tại trong SQLite và sẽ không xuất hiện trong runtime cũ hơn.
Nếu sau đó bạn nâng cấp lại, hãy chạy trình tự xác thực di chuyển thông thường
ở trên để OpenClaw có thể so sánh các cấu phần cũ đã khôi phục với các hàng
SQLite trước khi nhập.

## Ghi chú

- Ở chế độ Nix (`OPENCLAW_NIX_MODE=1`), các bước kiểm tra doctor chỉ đọc vẫn hoạt động, nhưng `doctor --fix`, `doctor --repair`, `doctor --yes` và `doctor --generate-gateway-token` bị vô hiệu hóa vì `openclaw.json` là bất biến. Thay vào đó, hãy chỉnh sửa nguồn Nix cho bản cài đặt này; với nix-openclaw, hãy sử dụng [Bắt đầu nhanh](https://github.com/openclaw/nix-openclaw#quick-start) ưu tiên agent.
- Các lời nhắc tương tác (sửa lỗi keychain/OAuth, v.v.) chỉ chạy khi stdin là TTY và `--non-interactive` **không** được đặt. Các lượt chạy không giao diện (cron, Telegram, không có terminal) sẽ bỏ qua lời nhắc.
- Các lượt chạy `doctor` không tương tác bỏ qua việc tải sớm plugin để các bước kiểm tra tình trạng không giao diện luôn nhanh. Các phiên tương tác vẫn tải những bề mặt plugin cần thiết cho luồng kiểm tra tình trạng/sửa chữa cũ.
- `--lint` nghiêm ngặt hơn `--non-interactive`: luôn chỉ đọc, không bao giờ hiển thị lời nhắc và không bao giờ áp dụng các bước di chuyển an toàn. Sử dụng `doctor --fix` hoặc `doctor --repair` khi bạn muốn doctor thực hiện thay đổi.
- Theo mặc định, Doctor không thực thi các SecretRef `exec` khi kiểm tra bí mật. Chỉ sử dụng `--allow-exec` (có hoặc không có `--lint`) khi bạn chủ ý muốn doctor chạy các trình phân giải bí mật đã cấu hình đó.
- Mọi thao tác ghi cấu hình (bao gồm sửa chữa `--fix`) đều luân chuyển bản sao lưu sang `~/.openclaw/openclaw.json.bak` (với vòng được đánh số từ `.bak.1`..`.bak.4`). `--fix` cũng loại bỏ các khóa cấu hình không xác định do quá trình xác thực schema báo cáo và liệt kê từng mục bị xóa; thao tác này bị bỏ qua khi đang cập nhật để trạng thái nâng cấp mới ghi một phần không bị loại bỏ trước khi quá trình di chuyển hoàn tất.
- Nếu không thể phân tích cú pháp `openclaw.json` và không thể khôi phục cấu hình tốt gần nhất, `doctor --fix` giữ nguyên bản gốc dưới tên `openclaw.json.clobbered.<timestamp>`, không thay đổi tệp hiện tại và thoát với lỗi thay vì ghi một bản thay thế không đầy đủ.
- Đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một trình giám sát khác quản lý vòng đời Gateway. Doctor vẫn báo cáo tình trạng Gateway/dịch vụ và áp dụng các sửa chữa không liên quan đến dịch vụ, nhưng bỏ qua việc cài đặt/khởi động/khởi động lại/bootstrap dịch vụ và dọn dẹp dịch vụ cũ.
- Doctor báo cáo giới hạn heap đã áp dụng của Gateway được quản lý và cách suy ra thích ứng được dùng cho giới hạn bộ nhớ hiện tại của máy chủ hoặc vùng chứa. Sử dụng `openclaw gateway status` để xem cùng báo cáo đó bên ngoài một lượt sửa chữa.
- Trên Linux, doctor bỏ qua các unit systemd bổ sung giống gateway nhưng không hoạt động và không ghi lại metadata lệnh/điểm vào cho một dịch vụ gateway systemd đang chạy trong quá trình sửa chữa. Trước tiên hãy dừng dịch vụ hoặc sử dụng `openclaw gateway install --force` để thay thế trình khởi chạy đang hoạt động.
- `doctor --fix --non-interactive` báo cáo các định nghĩa dịch vụ gateway bị thiếu hoặc lỗi thời nhưng không cài đặt hay ghi lại chúng bên ngoài chế độ sửa chữa cập nhật. Chạy `openclaw gateway install` khi dịch vụ bị thiếu hoặc `openclaw gateway install --force` để thay thế trình khởi chạy.
- Các bước kiểm tra tính toàn vẹn của trạng thái phát hiện những tệp bản chép lời mồ côi trong thư mục phiên. Việc lưu trữ chúng dưới dạng `.deleted.<timestamp>` yêu cầu xác nhận tương tác; `--fix`, `--yes` và các lượt chạy không giao diện sẽ giữ nguyên chúng.
- Doctor quét `~/.openclaw/cron/jobs.json` (hoặc `cron.store`) để tìm các dạng công việc cron cũ và ghi lại chúng trước khi nhập các hàng chuẩn hóa vào SQLite.
- Doctor báo cáo các công việc cron có giá trị ghi đè `payload.model` rõ ràng, bao gồm số lượng theo không gian tên nhà cung cấp và các điểm không khớp với `agents.defaults.model`, nhờ đó những công việc theo lịch không kế thừa mô hình mặc định sẽ hiển thị trong quá trình điều tra xác thực hoặc thanh toán.
- Doctor báo cáo các công việc cron vẫn được đánh dấu đang thực thi (`state.runningAtMs`), điều có thể khiến `openclaw cron list` hiển thị chúng dưới dạng `running`. Bước kiểm tra này chỉ đọc: nếu hiện không có Gateway nào đang thực thi một công việc được đánh dấu, lần khởi động dịch vụ cron tiếp theo sẽ ghi nhận lượt chạy bị gián đoạn và xóa dấu.
- Trên Linux, doctor cảnh báo khi crontab của người dùng vẫn chạy `~/.openclaw/bin/ensure-whatsapp.sh` cũ không còn được bảo trì, vốn có thể báo cáo sai `Gateway inactive` khi cron không có môi trường bus người dùng systemd.
- Khi WhatsApp được bật, doctor kiểm tra vòng lặp sự kiện Gateway bị suy giảm trong khi các máy khách `openclaw-tui` cục bộ vẫn đang chạy. `doctor --fix` chỉ dừng các máy khách TUI cục bộ đã xác minh để phản hồi WhatsApp không bị xếp hàng phía sau những vòng lặp làm mới TUI lỗi thời.
- Khi có các biến môi trường proxy HTTP(S) nhưng `tools.web.fetch.useTrustedEnvProxy` bị vô hiệu hóa, doctor giải thích rằng `web_fetch` vẫn sử dụng định tuyến trực tiếp, chạy một phép thăm dò ngắn về khả năng kết nối TLS trực tiếp và nêu rõ tùy chọn đồng ý bật. Doctor không bao giờ tự động bật việc tin cậy proxy.
- Doctor ghi lại các tham chiếu mô hình `codex/*` và `openai-codex/*` cũ thành các tham chiếu `openai/*` chuẩn hóa trên các mô hình chính, phương án dự phòng, danh sách mô hình được phép, mô hình tạo hình ảnh/video, giá trị ghi đè heartbeat/subagent/compaction, hook, giá trị ghi đè mô hình kênh, payload cron và ghim tuyến phiên/bản chép lời lỗi thời. `--fix` cũng hợp nhất cấu hình `models.providers.codex` và `models.providers.openai-codex` cũ khi an toàn, di chuyển các hồ sơ xác thực `openai-codex:*` và mục `auth.order.openai-codex` cũ sang `openai:*`, chuyển ý định Codex sang các mục `agentRuntime.id: "codex"` theo phạm vi nhà cung cấp/mô hình, xóa các ghim thời gian chạy toàn agent/phiên lỗi thời và giữ các tham chiếu agent OpenAI đã sửa chữa trên định tuyến xác thực Codex thay vì xác thực trực tiếp bằng khóa API OpenAI.
- Doctor báo cáo các danh sách `auth.order.<provider>` không rỗng mà tất cả hồ sơ được tham chiếu đều đã biến mất trong khi vẫn tồn tại thông tin xác thực tương thích được lưu trữ. `doctor --fix` chỉ xóa những giá trị ghi đè lỗi thời đó, khôi phục việc tự động chọn thông tin xác thực theo từng agent; thứ tự rỗng rõ ràng, danh sách còn một phần hoạt động và thứ tự không có thông tin xác thực tương thích được lưu trữ sẽ không thay đổi. Nếu kho xác thực SQLite đang hoạt động không thể đọc được hoặc sai định dạng, doctor sẽ giải thích lý do bỏ qua sửa chữa này. Hãy khởi động lại Gateway đang chạy trước khi kiểm tra lại trạng thái xác thực nếu chế độ tải lại cấu hình của Gateway không tự động áp dụng thao tác ghi.
- Doctor dọn dẹp trạng thái tạm chuyển tiếp phụ thuộc plugin cũ từ các phiên bản OpenClaw trước đây và liên kết lại gói `openclaw` của máy chủ cho các plugin npm được quản lý khai báo gói đó là phụ thuộc ngang hàng. Doctor cũng sửa chữa các plugin có thể tải xuống bị thiếu nhưng được cấu hình tham chiếu (`plugins.entries`, các kênh đã cấu hình, cài đặt nhà cung cấp/tìm kiếm đã cấu hình, môi trường chạy agent đã cấu hình). Trong quá trình cập nhật gói, doctor bỏ qua việc sửa chữa plugin bằng trình quản lý gói cho đến khi hoàn tất thay thế gói; sau đó hãy chạy lại `openclaw doctor --fix` nếu một plugin đã cấu hình vẫn cần khôi phục. Nếu tải xuống thất bại, doctor báo cáo lỗi cài đặt và giữ nguyên mục plugin đã cấu hình cho lần sửa chữa tiếp theo.
- Doctor sửa chữa cấu hình plugin lỗi thời bằng cách xóa các id plugin bị thiếu khỏi `plugins.allow`/`plugins.deny`/`plugins.entries`, cùng với cấu hình kênh treo tương ứng, đích heartbeat và giá trị ghi đè mô hình kênh khi quá trình khám phá plugin hoạt động bình thường.
- Doctor cách ly cấu hình plugin không hợp lệ bằng cách vô hiệu hóa mục `plugins.entries.<id>` bị ảnh hưởng và xóa payload `config` không hợp lệ của mục đó. Quá trình khởi động Gateway vốn đã chỉ bỏ qua plugin lỗi đó để các plugin và kênh khác tiếp tục chạy.
- Doctor xóa `plugins.entries.codex.config.codexDynamicToolsProfile` đã ngừng sử dụng; app-server Codex luôn giữ các công cụ không gian làm việc gốc Codex ở dạng gốc.
- Doctor tự động di chuyển cấu hình Talk phẳng cũ (`talk.voiceId`, `talk.modelId` và các mục liên quan) sang `talk.provider` + `talk.providers.<provider>`. Các lượt chạy `doctor --fix` lặp lại không còn báo cáo/áp dụng việc chuẩn hóa Talk khi điểm khác biệt duy nhất là thứ tự khóa đối tượng.
- Doctor bao gồm bước kiểm tra mức độ sẵn sàng của tìm kiếm bộ nhớ và có thể đề xuất `openclaw configure --section model` khi thiếu thông tin xác thực nhúng.
- Doctor cảnh báo khi chưa cấu hình chủ sở hữu lệnh. Chủ sở hữu lệnh là tài khoản người vận hành cho phép chạy các lệnh chỉ dành cho chủ sở hữu và phê duyệt các hành động nguy hiểm. Việc ghép cặp DM chỉ cho phép một người trò chuyện với bot; nếu bạn đã phê duyệt một người gửi trước khi cơ chế bootstrap chủ sở hữu đầu tiên tồn tại, hãy đặt rõ ràng `commands.ownerAllowFrom`.
- Doctor báo cáo một ghi chú thông tin khi các agent ở chế độ Codex được cấu hình và có tài sản Codex CLI cá nhân trong thư mục gốc Codex của người vận hành. Các lần khởi chạy app-server Codex cục bộ sử dụng thư mục gốc riêng biệt cho từng agent; trước tiên hãy cài đặt plugin Codex nếu cần, sau đó sử dụng `openclaw migrate plan codex` để kiểm kê những tài sản cần được chủ ý đưa vào sử dụng.
- Doctor cảnh báo khi các skill được phép cho agent mặc định không khả dụng trong môi trường chạy hiện tại (thiếu tệp nhị phân, biến môi trường, cấu hình hoặc yêu cầu hệ điều hành). `doctor --fix` có thể vô hiệu hóa các skill không khả dụng đó bằng `skills.entries.<skill>.enabled=false`; thay vào đó, hãy cài đặt/cấu hình yêu cầu còn thiếu nếu bạn muốn giữ skill hoạt động.
- Nếu chế độ sandbox được bật nhưng Docker không khả dụng, doctor báo cáo cảnh báo rõ ràng kèm cách khắc phục (`install Docker` hoặc `openclaw config set agents.defaults.sandbox.mode off`).
- Nếu tồn tại các tệp registry sandbox hoặc thư mục phân mảnh cũ (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` hoặc `~/.openclaw/sandbox/browsers/`), doctor sẽ báo cáo chúng; `--fix` di chuyển các mục hợp lệ vào SQLite và cách ly các tệp cũ không hợp lệ.
- Nếu `gateway.auth.token`/`gateway.auth.password` được SecretRef quản lý và không khả dụng trong đường dẫn lệnh hiện tại, doctor báo cáo cảnh báo chỉ đọc và không ghi thông tin xác thực dự phòng ở dạng văn bản thuần túy. Đối với SecretRef dựa trên exec, doctor bỏ qua việc thực thi trừ khi có `--allow-exec`.
- Nếu quá trình kiểm tra SecretRef của kênh thất bại trong đường dẫn sửa lỗi, doctor tiếp tục và báo cáo cảnh báo thay vì thoát sớm.
- Sau khi di chuyển thư mục trạng thái, doctor cảnh báo khi các tài khoản Telegram hoặc Discord mặc định đã bật phụ thuộc vào phương án dự phòng từ môi trường và `TELEGRAM_BOT_TOKEN` hoặc `DISCORD_BOT_TOKEN` không khả dụng cho tiến trình doctor.
- Việc tự động phân giải tên người dùng `allowFrom` của Telegram (`doctor --fix`) yêu cầu token Telegram có thể phân giải trong đường dẫn lệnh hiện tại. Nếu không thể kiểm tra token, doctor báo cáo cảnh báo và bỏ qua việc tự động phân giải trong lượt đó.

## macOS: giá trị ghi đè env `launchctl`

Nếu trước đây bạn đã chạy `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (hoặc `...PASSWORD`), giá trị đó sẽ ghi đè tệp cấu hình và có thể gây ra lỗi "unauthorized" kéo dài.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Doctor Gateway](/vi/gateway/doctor)
