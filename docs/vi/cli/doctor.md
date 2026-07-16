---
read_when:
    - Bạn gặp sự cố kết nối/xác thực và muốn được hướng dẫn cách khắc phục
    - Bạn đã cập nhật và muốn kiểm tra nhanh tính hợp lý
summary: Tài liệu tham khảo CLI cho `openclaw doctor` (kiểm tra tình trạng + sửa chữa có hướng dẫn)
title: Trình sửa lỗi
x-i18n:
    generated_at: "2026-07-16T14:12:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 322af63f52a3d864e46da332353ca921a4462e13fa849986d936524759f80ccc
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Các bước kiểm tra tình trạng và khắc phục nhanh cho Gateway, kênh, plugin, Skills, định tuyến mô hình, trạng thái cục bộ và di chuyển cấu hình. Sử dụng lệnh này bất cứ khi nào có điều gì đó không hoạt động như mong đợi và bạn muốn một lệnh giải thích vấn đề.

Liên quan:

- Khắc phục sự cố: [Khắc phục sự cố](/vi/gateway/troubleshooting)
- Kiểm tra bảo mật: [Bảo mật](/vi/gateway/security)

## Chế độ hoạt động

Doctor có năm chế độ hoạt động:

| Chế độ hoạt động            | Lệnh                                      | Hành vi                                                                                   |
| --------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| Kiểm tra                    | `openclaw doctor`                        | Các bước kiểm tra hướng đến người dùng và lời nhắc có hướng dẫn.                          |
| Sửa chữa                    | `openclaw doctor --fix`                        | Áp dụng các sửa chữa được hỗ trợ, dùng lời nhắc trừ khi sửa chữa không tương tác là an toàn. |
| Lint                        | `openclaw doctor --lint`                        | Các phát hiện có cấu trúc, chỉ đọc dành cho CI, kiểm tra sơ bộ và cổng đánh giá.           |
| Bảo trì SQLite dùng chung   | `openclaw doctor --state-sqlite compact`                        | Thực hiện rõ ràng việc checkpoint, thu gọn và xác minh cơ sở dữ liệu trạng thái dùng chung chuẩn. |
| Di chuyển SQLite phiên      | `openclaw doctor --session-sqlite <mode>`                        | Kiểm tra, nhập, xác thực, thu gọn, khôi phục hoặc hoàn nguyên trạng thái phiên.             |

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

Đối với quyền dành riêng cho từng kênh, hãy dùng các phép thăm dò kênh thay cho `doctor`:

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
| `--non-interactive`              | Chạy không có lời nhắc; chỉ thực hiện các bước di chuyển an toàn và sửa chữa không liên quan đến dịch vụ.                                                                               |
| `--generate-gateway-token`              | Tạo và cấu hình token Gateway.                                                                                                                                                         |
| `--allow-exec`              | Cho phép doctor thực thi các SecretRef `exec` đã cấu hình trong khi xác minh bí mật.                                                                                       |
| `--deep`              | Quét các dịch vụ hệ thống để tìm các bản cài đặt Gateway bổ sung; báo cáo các lần bàn giao khởi động lại gần đây của trình giám sát Gateway.                                            |
| `--lint`              | Chạy các bước kiểm tra tình trạng đã được hiện đại hóa ở chế độ chỉ đọc và xuất các phát hiện chẩn đoán.                                                                               |
| `--post-upgrade`              | Chạy các phép thăm dò khả năng tương thích plugin sau nâng cấp; các phát hiện được gửi đến stdout; mã thoát là 1 nếu có bất kỳ phát hiện cấp độ lỗi nào.                                |
| `--state-sqlite <mode>`              | Chạy bảo trì SQLite trạng thái dùng chung một cách rõ ràng. Chế độ duy nhất là `compact`.                                                                                     |
| `--session-sqlite <mode>`              | Chạy chế độ di chuyển SQLite phiên được chỉ định: `inspect`, `dry-run`, `import`, `validate`, `compact`, `recover` hoặc `restore`. |
| `--session-sqlite-store <path>`              | Với `--session-sqlite`: chọn một đường dẫn kho `sessions.json` cũ.                                                                                                                  |
| `--session-sqlite-agent <id>`              | Với `--session-sqlite`: chọn một tác tử đã cấu hình.                                                                                                                                   |
| `--session-sqlite-all-agents`              | Với `--session-sqlite`: chọn các kho tác tử đã cấu hình và được phát hiện.                                                                                                             |
| `--github-issue`              | Với `--session-sqlite recover`: chuẩn bị báo cáo sự cố openclaw/openclaw đã được làm sạch; doctor tạo báo cáo bằng `gh` sau `--yes` hoặc xác nhận tương tác.             |
| `--json`              | Với `--lint`: các phát hiện dạng JSON. Với `--post-upgrade`: `{ probesRun, findings }`. Với `--state-sqlite` hoặc `--session-sqlite`: báo cáo bảo trì dạng JSON.                  |
| `--severity-min <level>`              | Với `--lint`: loại bỏ các phát hiện dưới `info`, `warning` hoặc `error`.                                                                     |
| `--all`              | Với `--lint`: chạy tất cả các bước kiểm tra đã đăng ký, bao gồm các bước kiểm tra phải chủ động bật và bị loại khỏi tập mặc định.                                            |
| `--skip <id>`              | Với `--lint`: bỏ qua một ID bước kiểm tra. Có thể lặp lại.                                                                                                                   |
| `--only <id>`              | Với `--lint`: chỉ chạy các ID bước kiểm tra đã cho. Có thể lặp lại.                                                                                                          |

`--severity-min`, `--all`, `--only` và `--skip` chỉ được chấp nhận khi dùng cùng `--lint`; `--json` được chấp nhận với `--lint`, `--post-upgrade`, `--state-sqlite` và `--session-sqlite`.

## Chế độ lint

`openclaw doctor --lint` chỉ đọc: không có lời nhắc, không sửa chữa, không ghi lại cấu hình/trạng thái.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

Đầu ra cho người dùng được trình bày gọn:

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

| Mã | Ý nghĩa                                                                  |
| -- | ------------------------------------------------------------------------ |
| `0` | Không có phát hiện nào bằng hoặc cao hơn ngưỡng mức độ nghiêm trọng đã chọn. |
| `1` | Có ít nhất một phát hiện đạt ngưỡng đã chọn.                              |
| `2` | Lệnh hoặc môi trường chạy bị lỗi trước khi có thể tạo các phát hiện lint. |

`--severity-min` kiểm soát cả những phát hiện được in ra và ngưỡng thoát: `openclaw doctor --lint --severity-min error` có thể không in gì và thoát với mã `0` ngay cả khi tồn tại các phát hiện `info`/`warning` có mức độ nghiêm trọng thấp hơn.

`--all` kiểm soát những bước kiểm tra được chọn trước khi lọc theo mức độ nghiêm trọng. Theo mặc định, quá trình lint loại trừ các bước kiểm tra chuyên sâu, mang tính lịch sử hoặc có nhiều khả năng phát hiện phần dư thừa cũ có thể sửa chữa; dùng `--all` để chạy toàn bộ danh mục. `--only <id>` là bộ chọn chính xác nhất và có thể chạy bất kỳ bước kiểm tra nào đã đăng ký theo ID.

`core/doctor/local-audio-acceleration` báo cáo lệnh STT cục bộ được tự động chọn, bằng chứng riêng biệt về backend có khả năng hỗ trợ/được yêu cầu/được quan sát và thứ tự dự phòng mà không tải mô hình giọng nói. Bước này tạo một phát hiện mang tính thông tin, vì vậy hãy thêm `--severity-min info` để hiển thị.

## Kiểm tra tình trạng có cấu trúc

Các bước kiểm tra doctor hiện đại sử dụng một hợp đồng phân tách nhỏ:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` hỗ trợ `doctor --lint`. `repair()` là tùy chọn và chỉ chạy trong `doctor --fix` / `doctor --repair`. Các bước kiểm tra chưa được di chuyển sang cấu trúc này vẫn sử dụng luồng đóng góp doctor cũ.

Ngữ cảnh sửa chữa có thể mang các yêu cầu `dryRun`/`diff`; kết quả sửa chữa có thể trả về `diffs` có cấu trúc (chỉnh sửa cấu hình/tệp) và `effects` (tác dụng phụ liên quan đến dịch vụ, tiến trình, gói, trạng thái hoặc các loại khác), nhờ đó các bước kiểm tra đã chuyển đổi có thể dần hướng tới `doctor --fix --dry-run` mà không chuyển việc lập kế hoạch thay đổi vào `detect()`.

`repair()` báo cáo `status: "repaired" | "skipped" | "failed"` (nếu bỏ qua trạng thái thì có nghĩa là `repaired`). Khi thao tác sửa chữa trả về `skipped` hoặc `failed`, doctor báo cáo lý do và bỏ qua bước xác thực cho lần kiểm tra đó. Sau khi sửa chữa thành công, doctor chạy lại `detect()` trong phạm vi các phát hiện đã sửa; nếu phát hiện vẫn còn, doctor báo cáo cảnh báo sửa chữa thay vì coi thay đổi là hoàn tất.

Một phát hiện bao gồm:

| Trường             | Mục đích                                                |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | ID ổn định cho bộ lọc bỏ qua/chỉ định và danh sách cho phép của CI.     |
| `severity`        | `info`, `warning` hoặc `error`.                         |
| `message`         | Mô tả vấn đề mà con người có thể đọc được.                      |
| `path`            | Đường dẫn cấu hình, tệp hoặc đường dẫn logic khi có.          |
| `line` / `column` | Vị trí nguồn khi có.                        |
| `ocPath`          | Địa chỉ `oc://` chính xác khi một lần kiểm tra có thể trỏ đến địa chỉ đó. |
| `fixHint`         | Hành động được đề xuất cho người vận hành hoặc bản tóm tắt sửa chữa.           |

Các lần kiểm tra doctor lõi đã được hiện đại hóa vẫn gắn với phần đóng góp doctor có thứ tự sở hữu hành vi `doctor` / `doctor --fix` dành cho con người. Registry tình trạng có cấu trúc dùng chung là điểm mở rộng: các lần kiểm tra đi kèm và dựa trên Plugin chạy sau các lần kiểm tra doctor lõi khi gói sở hữu đăng ký chúng trong đường dẫn lệnh đang hoạt động. `openclaw/plugin-sdk/health` cung cấp cùng hợp đồng đó cho tác giả Plugin.

## Lựa chọn lần kiểm tra

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` và `--skip` chấp nhận ID đầy đủ của lần kiểm tra và có thể được lặp lại. Nếu một ID `--only` chưa được đăng ký, sẽ không có lần kiểm tra nào chạy cho ID đó; hãy dùng `checksRun`/`checksSkipped` trong đầu ra để xác nhận rằng một cổng tập trung chọn đúng các lần kiểm tra bạn mong đợi.

## Chế độ sau nâng cấp

`openclaw doctor --post-upgrade` chạy các phép thăm dò khả năng tương thích của Plugin để nối tiếp sau một lần dựng hoặc nâng cấp. Các phát hiện được gửi đến stdout; mã thoát là 1 nếu bất kỳ phát hiện nào có `level: "error"`. Thêm `--json` để nhận một phong bì mà máy có thể đọc được (`{ probesRun, findings }`), phù hợp cho CI, skill `fork-upgrade` của cộng đồng và các công cụ kiểm tra nhanh sau nâng cấp khác. Nếu chỉ mục Plugin đã cài đặt bị thiếu hoặc sai định dạng, chế độ JSON vẫn phát phong bì kèm một phát hiện lỗi `plugin.index_unavailable`.

Khởi động ảnh bộ chứa là ngoại lệ đối với quy trình thông thường "chạy doctor sau khi
cập nhật". Khi `openclaw gateway run` khởi động trên một phiên bản OpenClaw mới, nó
chạy các thao tác sửa chữa an toàn cho trạng thái và Plugin trước khi báo sẵn sàng. Nếu thao tác sửa chữa không thể
hoàn tất an toàn, quá trình khởi động sẽ thoát và yêu cầu bạn chạy chính ảnh đó một lần với
`openclaw doctor --fix` trên cùng trạng thái/cấu hình được gắn kết trước khi khởi động lại
bộ chứa theo cách thông thường.

## Compaction SQLite trạng thái dùng chung

`openclaw doctor --state-sqlite compact` là thao tác bảo trì ngoại tuyến được gọi tường minh cho
cơ sở dữ liệu trạng thái dùng chung chuẩn tại
`<state-dir>/state/openclaw.sqlite`. Lệnh này không chấp nhận đường dẫn cơ sở dữ liệu
tùy ý, không bao giờ được hoạt động Gateway thông thường gọi và không thuộc
`openclaw doctor --fix`. Lệnh lấy cùng khóa sở hữu trạng thái như
khi Gateway khởi động và giữ khóa đó trong suốt quá trình xác thực, checkpoint, `VACUUM` và
các lần kiểm tra tính toàn vẹn cuối cùng. Lệnh từ chối chạy khi một Gateway hoặc một
lệnh bảo trì SQLite khác đang sở hữu khóa đó. Khóa trạng thái vẫn hoạt động khi
`OPENCLAW_ALLOW_MULTI_GATEWAY=1` bỏ qua phiên bản đơn nhất của Gateway theo từng cấu hình, vì vậy
shell của người vận hành không cần kế thừa môi trường của dịch vụ Gateway để
phát hiện dịch vụ này trong quá trình bảo trì.

Trước tiên, hãy dừng Gateway và tạo một bản sao lưu đã xác minh:

```bash
openclaw gateway stop
openclaw backup create --verify
openclaw doctor --state-sqlite compact --json
openclaw gateway start
```

Lệnh này:

1. Yêu cầu một tệp thông thường tại đường dẫn trạng thái dùng chung chuẩn. Cơ sở dữ liệu
   bị thiếu được báo cáo là `skipped` và lệnh thoát thành công.
2. Xác thực phiên bản lược đồ hiện được hỗ trợ và
   `schema_meta.role = "global"` trước khi checkpoint hoặc thay đổi tệp.
3. Yêu cầu `wal_checkpoint(TRUNCATE)` không bận. Hãy dừng mọi tiến trình OpenClaw
   còn lại và thử lại nếu checkpoint đang bận.
4. Đặt `auto_vacuum` thành `INCREMENTAL`, chạy `VACUUM` đầy đủ và thực hiện checkpoint
   lần nữa.
5. Chạy `quick_check`, `integrity_check` và `foreign_key_check`, sau đó
   áp dụng lại quyền chỉ dành cho chủ sở hữu đối với cơ sở dữ liệu và các tệp sidecar SQLite.

Đầu ra JSON báo cáo kích thước cơ sở dữ liệu và WAL, số trang trong freelist, kích thước trang và
giá trị `auto_vacuum` trước và sau khi compaction, cùng số byte thu hồi được và
kết quả `quick_check` và `integrity_check`. `foreign_key_check` được thực thi
theo cơ chế đóng khi lỗi và không có trường thành công riêng. SQLite báo cáo `auto_vacuum` là
`0` khi không có, `1` khi đầy đủ và `2` khi tăng dần.

Compaction thất bại mà không thay đổi dữ liệu khi lược đồ đã cũ, mới hơn
bản dựng OpenClaw đang chạy hoặc thuộc về cơ sở dữ liệu của agent. Trước tiên, hãy chạy
`openclaw doctor --fix` cho lược đồ trạng thái dùng chung cũ hơn. Hãy khôi phục một
bản sao lưu tương thích hoặc nâng cấp OpenClaw nếu lược đồ mới hơn.

## Di chuyển SQLite của phiên

OpenClaw tự động nhập các hàng phiên cũ và lịch sử bản ghi hội thoại vào cơ sở dữ liệu
SQLite của từng agent trong khi Gateway khởi động và trong khi chạy
`openclaw doctor --fix`. `openclaw doctor --session-sqlite <mode>` là
công cụ kiểm tra và xác thực chuyên biệt cho quá trình di chuyển đó. Các hàng phiên
thời gian chạy hiện tại nằm trong
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Các tệp
`sessions.json` cũ là nguồn di chuyển. Các tệp JSONL bản ghi hội thoại đang hoạt động được
nhập rồi lưu trữ ra khỏi thư mục phiên đang hoạt động sau khi
nhập thành công; các tệp JSONL thuộc tầng lưu trữ vẫn là hiện vật hỗ trợ, không phải
phương án dự phòng thời gian chạy.

Các chế độ:

| Chế độ       | Hành vi                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inspect`  | Đọc số lượng trong nguồn cũ và SQLite, cùng các tệp JSONL không được tham chiếu, mà không nhập.                                       |
| `dry-run`  | Phân tích các mục cũ và tệp JSONL bản ghi hội thoại, đếm các hàng có thể nhập và báo cáo sự cố mà không ghi hàng SQLite. |
| `import`   | Nhập các mục cũ và sự kiện bản ghi hội thoại vào SQLite cho các đích đã chọn.                                      |
| `validate` | So sánh các nguồn cũ đã chọn với các hàng SQLite và số lượng sự kiện bản ghi hội thoại.                                   |
| `compact`  | Checkpoint và VACUUM các cơ sở dữ liệu SQLite của agent đã chọn để thu hồi các trang trống sau khi xóa lượng lớn dữ liệu hoặc dọn dẹp kho lưu trữ.    |
| `recover`  | Khôi phục lần chạy di chuyển thất bại gần nhất, xác thực các đích của lần chạy đó và chuẩn bị báo cáo sự cố GitHub đã được làm sạch.            |
| `restore`  | Khôi phục các hiện vật bản ghi hội thoại đã lưu trữ từ manifest di chuyển đã ghi nhận mà không xóa dữ liệu SQLite.                  |

Bộ chọn:

- Mặc định: kho agent mặc định đã cấu hình, khi tệp kho cũ đó tồn tại.
- `--session-sqlite-agent <id>`: một agent đã cấu hình.
- `--session-sqlite-all-agents`: các kho agent đã cấu hình cộng với các kho agent được phát hiện.
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
bị thiếu trong SQLite, ID phiên khác nhau hoặc số lượng sự kiện bản ghi hội thoại khác nhau.
Khi dùng `--session-sqlite-store <path>`, hãy kiểm tra để bảo đảm báo cáo chứa
số lượng đích mong đợi; một đường dẫn kho được chỉ định tường minh nhưng không tồn tại sẽ không chọn đích nào.

Thao tác xóa của SQLite trước tiên thu hồi các trang bên trong cơ sở dữ liệu; chúng không nhất thiết
làm tệp cơ sở dữ liệu thu nhỏ ngay lập tức. Sau khi xóa hoặc lưu trữ các
bản ghi hội thoại lớn, hãy chạy `openclaw doctor --session-sqlite compact --session-sqlite-all-agents`
để checkpoint các tệp WAL, chạy `VACUUM` và báo cáo kích thước cơ sở dữ liệu cùng WAL
trước/sau. Compaction yêu cầu một tệp thông thường có lược đồ agent hiện tại,
siêu dữ liệu chủ sở hữu bền vững của agent đã chọn và không có handle đang mở trong tiến trình
doctor. Các chế độ phá hủy `import`, `compact`, `recover` và `restore`
giữ cùng khóa sở hữu trạng thái như khi Gateway khởi động trong toàn bộ hoạt động;
`inspect`, `dry-run` và `validate` vẫn chỉ đọc và không lấy khóa đó. Hãy dừng
Gateway trước. Các chế độ phá hủy sẽ thất bại thay vì chạy đua với thao tác ghi trực tiếp hoặc
với một lệnh bảo trì khác. Đích `--session-sqlite-store`
có tính phá hủy phải nằm trong thư mục trạng thái đang hoạt động; hãy đặt `OPENCLAW_STATE_DIR` thành
thư mục trạng thái sở hữu kho trước khi bảo trì một bản cài đặt khác.
Các đích có liên kết cứng hiện hữu bị từ chối vì một đường dẫn khác có thể dùng chung
inode cơ sở dữ liệu bên ngoài thư mục trạng thái đã khóa. Các bước kiểm tra quyền sở hữu tương tự
bao phủ các tệp sidecar WAL, bộ nhớ dùng chung và nhật ký hoàn tác của SQLite.

Mỗi lần nhập ghi một manifest vào
`~/.openclaw/session-sqlite-migration-runs/` trước khi di chuyển các hiện vật bản ghi hội thoại
vào kho lưu trữ. Nếu quá trình khởi động báo cáo di chuyển SQLite của phiên thất bại sau khi
các hiện vật đã được di chuyển, hãy chạy khôi phục:

```bash
openclaw doctor --session-sqlite recover --github-issue
```

Quá trình khôi phục chọn manifest di chuyển thất bại gần nhất, chỉ khôi phục
các hiện vật đã lưu trữ của manifest, xác thực các đích bị ảnh hưởng, làm mới
các báo cáo `.failure.md` và `.failure.json` đã được làm sạch, đồng thời chuẩn bị nội dung sự cố GitHub
không chứa nội dung bản ghi hội thoại, môi trường thô, bí mật và
cấu hình không giới hạn. Khi không tồn tại manifest di chuyển thất bại nhưng cơ sở dữ liệu SQLite
của một agent đã chọn bị hỏng, không phải cơ sở dữ liệu hoặc có các tệp sidecar nhật ký mà không có
cơ sở dữ liệu chính, quá trình khôi phục sao chép toàn bộ tập tệp vào một thư mục kiểm tra
tạm thời. SQLite có thể hoàn tác một nhật ký nóng hợp lệ trong bản sao dùng một lần đó
trước khi `quick_check`, `integrity_check` và `foreign_key_check` chạy, trong khi
các tệp điều tra gốc vẫn không bị thay đổi. Các lần kiểm tra tính toàn vẹn thất bại hoặc
các tệp sidecar mồ côi sẽ bảo toàn các tệp DB, WAL, SHM và nhật ký hoàn tác bằng cách đổi tên
toàn bộ tập đã phát hiện với một hậu tố `.corrupt-<timestamp>`. Khi bắt được lỗi đổi tên,
các tệp đã di chuyển được hoàn tác trước khi báo lỗi, vì vậy một
tập tệp có thể khôi phục sẽ không bị âm thầm chia tách. Hãy dừng Gateway trước khi khôi phục;
việc sao chép hoặc đổi tên một tập tệp SQLite đang thay đổi là không an toàn và có hành vi
khác nhau giữa các hệ điều hành. Với `--github-issue --yes`, doctor dùng
GitHub CLI để tạo sự cố trong `openclaw/openclaw`; nếu không có xác nhận,
doctor ghi báo cáo hỗ trợ cục bộ và in URL sự cố đã điền sẵn.

`restore` vẫn là thao tác hoàn tác cấp thấp hơn. Thao tác này dùng các bản ghi
`sourcePath -> archivePath` trong manifest, chỉ di chuyển các hiện vật đã lưu trữ trở lại khi
đường dẫn gốc bị thiếu, báo cáo xung đột khi cả hai đường dẫn đều tồn tại và giữ nguyên
cơ sở dữ liệu SQLite.

### Hạ cấp sau khi di chuyển SQLite của phiên

Trước khi khởi động một phiên bản OpenClaw cũ hơn dựa trên tệp, hãy khôi phục các
hiện vật bản ghi hội thoại cũ đã lưu trữ:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Các phiên bản cũ đọc các mục `sessions.json` và các đường dẫn `sessionFile` được ghi
trong các mục đó. Sau khi di chuyển sang SQLite, các lần nhập thành công sẽ chuyển bản chép lời JSONL
đang hoạt động vào `session-sqlite-import-archive/`, vì vậy runtime cũ không thể
thấy lịch sử đó cho đến khi thao tác khôi phục chuyển các thành phần được ghi trong manifest trở lại
đường dẫn ban đầu của chúng.

Thao tác khôi phục không xóa dữ liệu SQLite. Các phiên được tạo sau khi chuyển sang SQLite
chỉ tồn tại trong SQLite và sẽ không xuất hiện trong runtime cũ. Nếu sau đó
bạn nâng cấp lại, hãy chạy trình tự xác thực di chuyển thông thường ở trên để OpenClaw có thể
so sánh các thành phần cũ đã khôi phục với các hàng SQLite trước khi nhập.

## Ghi chú

- Trong chế độ Nix (`OPENCLAW_NIX_MODE=1`), các bước kiểm tra doctor chỉ đọc vẫn hoạt động, nhưng `doctor --fix`, `doctor --repair`, `doctor --yes` và `doctor --generate-gateway-token` bị vô hiệu hóa vì `openclaw.json` là bất biến. Thay vào đó, hãy chỉnh sửa nguồn Nix cho bản cài đặt này; đối với nix-openclaw, hãy sử dụng [Hướng dẫn bắt đầu nhanh](https://github.com/openclaw/nix-openclaw#quick-start) ưu tiên agent.
- Các lời nhắc tương tác (sửa lỗi keychain/OAuth, v.v.) chỉ chạy khi stdin là TTY và `--non-interactive` **không** được đặt. Các lần chạy không giao diện (cron, Telegram, không có terminal) sẽ bỏ qua lời nhắc.
- Các lần chạy `doctor` không tương tác bỏ qua việc tải sớm Plugin để các bước kiểm tra tình trạng không giao diện luôn nhanh. Các phiên tương tác vẫn tải những bề mặt Plugin cần thiết cho quy trình kiểm tra tình trạng/sửa chữa cũ.
- `--lint` nghiêm ngặt hơn `--non-interactive`: luôn chỉ đọc, không bao giờ nhắc và không bao giờ áp dụng các lần di chuyển an toàn. Sử dụng `doctor --fix` hoặc `doctor --repair` khi bạn muốn doctor thực hiện thay đổi.
- Theo mặc định, doctor không thực thi các SecretRef `exec` khi kiểm tra bí mật. Chỉ sử dụng `--allow-exec` (có hoặc không có `--lint`) khi bạn chủ đích muốn doctor chạy các trình phân giải bí mật đã cấu hình đó.
- Bất kỳ thao tác ghi cấu hình nào (bao gồm sửa chữa `--fix`) đều luân chuyển bản sao lưu sang `~/.openclaw/openclaw.json.bak` (với vòng được đánh số `.bak.1`..`.bak.4`). `--fix` cũng loại bỏ các khóa cấu hình không xác định được báo cáo bởi quá trình xác thực schema, đồng thời liệt kê từng mục bị loại bỏ; thao tác này được bỏ qua khi đang cập nhật để trạng thái nâng cấp mới ghi một phần không bị loại bỏ trước khi quá trình di chuyển hoàn tất.
- Đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một trình giám sát khác quản lý vòng đời Gateway. Doctor vẫn báo cáo tình trạng Gateway/dịch vụ và áp dụng các sửa chữa không liên quan đến dịch vụ, nhưng bỏ qua việc cài đặt/khởi động/khởi động lại/bootstrap dịch vụ và dọn dẹp dịch vụ cũ.
- Trên Linux, doctor bỏ qua các unit systemd bổ sung giống Gateway nhưng không hoạt động và không ghi lại siêu dữ liệu lệnh/điểm vào cho dịch vụ Gateway systemd đang chạy trong quá trình sửa chữa. Hãy dừng dịch vụ trước hoặc sử dụng `openclaw gateway install --force` để thay thế trình khởi chạy đang hoạt động.
- `doctor --fix --non-interactive` báo cáo các định nghĩa dịch vụ Gateway bị thiếu hoặc lỗi thời nhưng không cài đặt hay ghi lại chúng bên ngoài chế độ sửa chữa cập nhật. Chạy `openclaw gateway install` khi thiếu dịch vụ hoặc `openclaw gateway install --force` để thay thế trình khởi chạy.
- Các bước kiểm tra tính toàn vẹn của trạng thái phát hiện các tệp bản chép lời mồ côi trong thư mục phiên. Việc lưu trữ chúng dưới dạng `.deleted.<timestamp>` yêu cầu xác nhận tương tác; `--fix`, `--yes` và các lần chạy không giao diện giữ nguyên chúng tại chỗ.
- Doctor quét `~/.openclaw/cron/jobs.json` (hoặc `cron.store`) để tìm các dạng tác vụ cron cũ và ghi lại chúng trước khi nhập các hàng chuẩn hóa vào SQLite.
- Doctor báo cáo các tác vụ cron có giá trị ghi đè `payload.model` rõ ràng, bao gồm số lượng theo không gian tên nhà cung cấp và các điểm không khớp với `agents.defaults.model`, nhờ đó có thể nhìn thấy các tác vụ theo lịch không kế thừa mô hình mặc định trong quá trình điều tra xác thực hoặc thanh toán.
- Doctor báo cáo các tác vụ cron vẫn được đánh dấu là đang thực thi (`state.runningAtMs`), điều này có thể khiến `openclaw cron list` hiển thị chúng là `running`. Bước kiểm tra này chỉ đọc: nếu hiện không có Gateway nào đang thực thi một tác vụ được đánh dấu, lần khởi động dịch vụ cron tiếp theo sẽ ghi nhận lần chạy bị gián đoạn và xóa dấu đánh dấu.
- Trên Linux, doctor cảnh báo khi crontab của người dùng vẫn chạy `~/.openclaw/bin/ensure-whatsapp.sh` cũ không còn được bảo trì, có thể báo cáo sai `Gateway inactive` khi cron không có môi trường bus người dùng systemd.
- Khi WhatsApp được bật, doctor kiểm tra vòng lặp sự kiện Gateway bị suy giảm khi các máy khách `openclaw-tui` cục bộ vẫn đang chạy. `doctor --fix` chỉ dừng các máy khách TUI cục bộ đã xác minh để phản hồi WhatsApp không bị xếp hàng sau các vòng lặp làm mới TUI lỗi thời.
- Doctor ghi lại các tham chiếu mô hình `codex/*` và `openai-codex/*` cũ thành tham chiếu `openai/*` chuẩn hóa trên các mô hình chính, phương án dự phòng, danh sách mô hình được phép, mô hình tạo ảnh/video, giá trị ghi đè heartbeat/subagent/compaction, hook, giá trị ghi đè mô hình kênh, payload cron và ghim tuyến phiên/bản chép lời lỗi thời. `--fix` cũng hợp nhất cấu hình `models.providers.codex` và `models.providers.openai-codex` cũ khi an toàn, di chuyển các hồ sơ xác thực `openai-codex:*` và mục `auth.order.openai-codex` cũ sang `openai:*`, chuyển ý định Codex sang các mục `agentRuntime.id: "codex"` có phạm vi theo nhà cung cấp/mô hình, loại bỏ các ghim runtime toàn agent/phiên lỗi thời và duy trì các tham chiếu agent OpenAI đã sửa chữa trên tuyến xác thực Codex thay vì xác thực trực tiếp bằng khóa API OpenAI.
- Doctor báo cáo các danh sách `auth.order.<provider>` không rỗng mà tất cả hồ sơ được tham chiếu đều đã biến mất trong khi vẫn tồn tại thông tin xác thực tương thích được lưu trữ. `doctor --fix` chỉ xóa các giá trị ghi đè lỗi thời đó, khôi phục lựa chọn thông tin xác thực tự động theo từng agent; các thứ tự rỗng rõ ràng, danh sách còn hoạt động một phần và thứ tự không có thông tin xác thực tương thích được lưu trữ vẫn không thay đổi. Nếu kho xác thực SQLite đang hoạt động không thể đọc được hoặc có định dạng sai, doctor sẽ giải thích lý do bỏ qua sửa chữa này. Hãy khởi động lại Gateway đang chạy trước khi kiểm tra lại trạng thái xác thực nếu chế độ tải lại cấu hình của Gateway không tự động áp dụng thao tác ghi.
- Doctor dọn dẹp trạng thái staging phần phụ thuộc Plugin cũ từ các phiên bản OpenClaw trước đây và liên kết lại gói `openclaw` của máy chủ cho các Plugin npm được quản lý khai báo gói này là phần phụ thuộc ngang hàng. Doctor cũng sửa chữa các Plugin có thể tải xuống bị thiếu nhưng được cấu hình tham chiếu (`plugins.entries`, các kênh đã cấu hình, cài đặt nhà cung cấp/tìm kiếm đã cấu hình, runtime agent đã cấu hình). Trong quá trình cập nhật gói, doctor bỏ qua việc sửa chữa Plugin bằng trình quản lý gói cho đến khi hoàn tất thay thế gói; sau đó, hãy chạy lại `openclaw doctor --fix` nếu một Plugin đã cấu hình vẫn cần khôi phục. Nếu tải xuống thất bại, doctor báo cáo lỗi cài đặt và giữ nguyên mục Plugin đã cấu hình cho lần sửa chữa tiếp theo.
- Doctor sửa chữa cấu hình Plugin lỗi thời bằng cách loại bỏ các id Plugin bị thiếu khỏi `plugins.allow`/`plugins.deny`/`plugins.entries`, cùng với cấu hình kênh treo tương ứng, đích Heartbeat và giá trị ghi đè mô hình kênh, khi quá trình khám phá Plugin hoạt động bình thường.
- Doctor cách ly cấu hình Plugin không hợp lệ bằng cách vô hiệu hóa mục `plugins.entries.<id>` bị ảnh hưởng và loại bỏ payload `config` không hợp lệ của mục đó. Quá trình khởi động Gateway vốn đã chỉ bỏ qua Plugin lỗi đó để các Plugin và kênh khác tiếp tục chạy.
- Doctor loại bỏ `plugins.entries.codex.config.codexDynamicToolsProfile` đã ngừng sử dụng; app-server Codex luôn giữ các công cụ không gian làm việc gốc Codex ở dạng gốc.
- Doctor tự động di chuyển cấu hình Talk phẳng cũ (`talk.voiceId`, `talk.modelId` và các mục liên quan) sang `talk.provider` + `talk.providers.<provider>`. Các lần chạy `doctor --fix` lặp lại không còn báo cáo/áp dụng việc chuẩn hóa Talk khi khác biệt duy nhất là thứ tự khóa đối tượng.
- Doctor bao gồm bước kiểm tra mức độ sẵn sàng của tìm kiếm bộ nhớ và có thể đề xuất `openclaw configure --section model` khi thiếu thông tin xác thực embedding.
- Doctor cảnh báo khi chưa cấu hình chủ sở hữu lệnh. Chủ sở hữu lệnh là tài khoản người vận hành là con người được phép chạy các lệnh chỉ dành cho chủ sở hữu và phê duyệt các hành động nguy hiểm. Ghép cặp DM chỉ cho phép một người trò chuyện với bot; nếu bạn đã phê duyệt người gửi trước khi cơ chế bootstrap chủ sở hữu đầu tiên tồn tại, hãy đặt `commands.ownerAllowFrom` một cách rõ ràng.
- Doctor báo cáo ghi chú thông tin khi các agent chế độ Codex được cấu hình và có tài nguyên Codex CLI cá nhân trong thư mục Codex home của người vận hành. Các lần khởi chạy app-server Codex cục bộ sử dụng thư mục home riêng biệt theo từng agent; nếu cần, trước tiên hãy cài đặt Plugin Codex, sau đó sử dụng `openclaw migrate plan codex` để kiểm kê các tài nguyên cần được chủ đích đưa vào sử dụng.
- Doctor cảnh báo khi các Skills được phép cho agent mặc định không khả dụng trong môi trường runtime hiện tại (thiếu tệp nhị phân, biến môi trường, cấu hình hoặc yêu cầu hệ điều hành). `doctor --fix` có thể vô hiệu hóa các Skills không khả dụng đó bằng `skills.entries.<skill>.enabled=false`; thay vào đó, hãy cài đặt/cấu hình yêu cầu còn thiếu nếu bạn muốn duy trì Skill ở trạng thái hoạt động.
- Nếu chế độ sandbox được bật nhưng Docker không khả dụng, doctor báo cáo cảnh báo rõ ràng kèm cách khắc phục (`install Docker` hoặc `openclaw config set agents.defaults.sandbox.mode off`).
- Nếu có các tệp registry sandbox hoặc thư mục shard cũ (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` hoặc `~/.openclaw/sandbox/browsers/`), doctor sẽ báo cáo chúng; `--fix` di chuyển các mục hợp lệ vào SQLite và cách ly các tệp cũ không hợp lệ.
- Nếu `gateway.auth.token`/`gateway.auth.password` do SecretRef quản lý và không khả dụng trong đường dẫn lệnh hiện tại, doctor báo cáo cảnh báo chỉ đọc và không ghi thông tin xác thực dự phòng dưới dạng văn bản thuần túy. Đối với SecretRef dựa trên exec, doctor bỏ qua việc thực thi trừ khi có `--allow-exec`.
- Nếu quá trình kiểm tra SecretRef của kênh thất bại trong đường dẫn sửa lỗi, doctor tiếp tục và báo cáo cảnh báo thay vì thoát sớm.
- Sau khi di chuyển thư mục trạng thái, doctor cảnh báo khi các tài khoản Telegram hoặc Discord mặc định đã bật phụ thuộc vào phương án dự phòng từ môi trường và `TELEGRAM_BOT_TOKEN` hoặc `DISCORD_BOT_TOKEN` không khả dụng cho tiến trình doctor.
- Việc tự động phân giải tên người dùng `allowFrom` của Telegram (`doctor --fix`) yêu cầu token Telegram có thể phân giải trong đường dẫn lệnh hiện tại. Nếu không thể kiểm tra token, doctor báo cáo cảnh báo và bỏ qua việc tự động phân giải trong lần chạy đó.

## macOS: giá trị ghi đè môi trường `launchctl`

Nếu trước đây bạn đã chạy `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (hoặc `...PASSWORD`), giá trị đó sẽ ghi đè tệp cấu hình và có thể gây ra lỗi "không được ủy quyền" dai dẳng.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Doctor của Gateway](/vi/gateway/doctor)
