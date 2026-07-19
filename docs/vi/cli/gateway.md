---
read_when:
    - Chạy Gateway từ CLI (môi trường phát triển hoặc máy chủ)
    - Gỡ lỗi xác thực Gateway, chế độ liên kết và khả năng kết nối
    - Phát hiện Gateway qua Bonjour (cục bộ + DNS-SD diện rộng)
    - Tích hợp trình giám sát tiến trình Gateway bên ngoài
sidebarTitle: Gateway
summary: CLI Gateway OpenClaw (`openclaw gateway`) — chạy, truy vấn và khám phá các Gateway
title: Gateway
x-i18n:
    generated_at: "2026-07-19T05:46:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7b7b8be9139e975be1a890e7a6fe09af526aaa4261d92198d4388a06e6d13216
    source_path: cli/gateway.md
    workflow: 16
---

Gateway là máy chủ WebSocket của OpenClaw (kênh, node, phiên, hook). Tất cả các lệnh con bên dưới nằm trong `openclaw gateway ...`.

<CardGroup cols={3}>
  <Card title="Khám phá Bonjour" href="/vi/gateway/bonjour">
    Thiết lập mDNS cục bộ + DNS-SD diện rộng.
  </Card>
  <Card title="Tổng quan về khám phá" href="/vi/gateway/discovery">
    Cách OpenClaw quảng bá và tìm các Gateway.
  </Card>
  <Card title="Cấu hình" href="/vi/gateway/configuration">
    Các khóa cấu hình Gateway cấp cao nhất.
  </Card>
</CardGroup>

## Chạy Gateway

```bash
openclaw gateway
openclaw gateway run   # tương đương, dạng tường minh
```

<AccordionGroup>
  <Accordion title="Hành vi khởi động">
    - Từ chối khởi động trừ khi `gateway.mode=local` được đặt trong `~/.openclaw/openclaw.json`. Dùng `--allow-unconfigured` cho các lần chạy tùy thời điểm/phát triển; tùy chọn này bỏ qua cơ chế bảo vệ mà không ghi hoặc sửa cấu hình.
    - Khi quá trình khởi động phát hiện cấu hình không hợp lệ nhưng có thể sửa, terminal tương tác sẽ đề nghị chạy `openclaw doctor --fix` và thử khởi động lại một lần sau khi được đồng ý. Các lần chạy không tương tác không bao giờ tự động sửa; thay vào đó, chúng in ra lệnh cần dùng. Nếu cấu hình sau khi sửa vẫn không hợp lệ, quá trình khởi động vẫn dừng.
    - `openclaw onboard --mode local` và `openclaw setup` ghi `gateway.mode=local`. Nếu tệp cấu hình tồn tại nhưng thiếu `gateway.mode`, trường hợp đó được coi là cấu hình bị hỏng/ghi đè và Gateway từ chối tự đoán `local` cho bạn — hãy chạy lại quy trình thiết lập ban đầu, đặt khóa theo cách thủ công hoặc truyền `--allow-unconfigured`.
    - Không được phép liên kết ra ngoài loopback nếu không có xác thực.
    - Các giá trị `--bind` gồm `lan`, `tailnet` và `custom` hiện được phân giải qua các đường dẫn chỉ dùng IPv4; các thiết lập tự cung cấp máy chủ chỉ dùng IPv6 cần một sidecar IPv4 hoặc proxy phía trước Gateway.
    - `SIGUSR1` kích hoạt khởi động lại trong tiến trình khi được cấp quyền. `commands.restart` (mặc định: bật) kiểm soát `SIGUSR1` được gửi từ bên ngoài; đặt thành `false` để chặn khởi động lại thủ công bằng tín hiệu hệ điều hành. Công cụ `gateway` dành cho agent chỉ có quyền đọc; các agent yêu cầu khởi động lại thông qua công cụ ủy quyền `openclaw` đã được con người phê duyệt.
    - `SIGINT`/`SIGTERM` dừng tiến trình nhưng không khôi phục trạng thái terminal tùy chỉnh — nếu bạn bọc CLI trong TUI hoặc đầu vào chế độ thô, hãy tự khôi phục terminal trước khi thoát.

  </Accordion>
</AccordionGroup>

### Tùy chọn

<ParamField path="--port <port>" type="number">
  Cổng WebSocket (mặc định lấy từ cấu hình/biến môi trường; thường là `18789`).
</ParamField>
<ParamField path="--bind <mode>" type="string">
  Chế độ liên kết: `loopback` (mặc định), `lan`, `tailnet`, `auto`, `custom`.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token dùng chung cho `connect.params.auth.token`. Mặc định là `OPENCLAW_GATEWAY_TOKEN` khi được đặt.
</ParamField>
<ParamField path="--auth <mode>" type="string">
  Chế độ xác thực: `none`, `token`, `password`, `trusted-proxy`.
</ParamField>
<ParamField path="--password <password>" type="string">
  Mật khẩu cho `--auth password`.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Đọc mật khẩu Gateway từ một tệp.
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  Cách công khai qua Tailscale: `off`, `serve`, `funnel`.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Đặt lại cấu hình serve/funnel của Tailscale khi tắt.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Khởi động mà không bắt buộc `gateway.mode=local`. Chỉ dành cho khởi tạo tùy thời điểm/phát triển; không lưu hoặc sửa cấu hình.
</ParamField>
<ParamField path="--dev" type="boolean">
  Tạo cấu hình phát triển + không gian làm việc nếu chưa có (bỏ qua `BOOTSTRAP.md`).
</ParamField>
<ParamField path="--reset" type="boolean">
  Đặt lại cấu hình phát triển, thông tin xác thực, phiên và không gian làm việc. Yêu cầu `--dev`.
</ParamField>
<ParamField path="--force" type="boolean">
  Dừng mọi trình lắng nghe hiện có trên cổng đích trước khi khởi động. Trong shell không tương tác, tùy chọn này từ chối dừng trình lắng nghe Gateway đã được xác minh; thay vào đó, hãy dùng `--dev` hoặc một `--profile` biệt lập với cổng còn trống.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Ghi nhật ký chi tiết vào stdout/stderr.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Chỉ hiển thị nhật ký backend CLI trong bảng điều khiển (đồng thời bật stdout/stderr).
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  Kiểu nhật ký WebSocket: `auto`, `full`, `compact`.
</ParamField>
<ParamField path="--compact" type="boolean">
  Bí danh của `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Ghi các sự kiện luồng mô hình thô vào JSONL.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Đường dẫn JSONL của luồng thô.
</ParamField>

`--claude-cli-logs` là bí danh đã lỗi thời của `--cli-backend-logs`.

Đối với `--bind custom`, hãy đặt `gateway.customBindHost` thành một địa chỉ IPv4. Mọi địa chỉ ngoài `127.0.0.1` hoặc `0.0.0.0` cũng yêu cầu `127.0.0.1` trên cùng cổng cho các máy khách cùng máy chủ; quá trình khởi động thất bại nếu một trong hai trình lắng nghe không thể liên kết. Ký tự đại diện `0.0.0.0` không thêm một bí danh bắt buộc riêng. Các thiết lập tự cung cấp máy chủ chỉ dùng IPv6 cần một sidecar IPv4 hoặc proxy phía trước Gateway.

## Khởi động lại Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` yêu cầu Gateway đang chạy kiểm tra trước công việc đang hoạt động và lên lịch một lần khởi động lại hợp nhất sau khi công việc đó hoàn tất. Thời gian chờ bị giới hạn bởi `gateway.reload.deferralTimeoutMs` (mặc định: 5 phút / `300000`); khi hết thời lượng cho phép, việc khởi động lại sẽ bị buộc thực hiện. Đặt `deferralTimeoutMs: 0` để chờ vô thời hạn (kèm cảnh báo định kỳ rằng vẫn đang chờ) thay vì buộc thực hiện. `--safe` không thể kết hợp với `--force` hoặc `--wait`.

`--skip-deferral` bỏ qua cơ chế trì hoãn do công việc đang hoạt động khi khởi động lại an toàn, vì vậy Gateway khởi động lại ngay cả khi có trình chặn được báo cáo. Tùy chọn này yêu cầu `--safe` — hãy dùng khi quá trình trì hoãn bị kẹt do một tác vụ mất kiểm soát.

`--wait <duration>` ghi đè thời lượng cho phép để hoàn tất công việc đối với một lần khởi động lại thông thường (không an toàn). Chấp nhận số mili giây thuần hoặc các hậu tố đơn vị `ms`, `s`, `m`, `h`, `d` (ví dụ: `30s`, `5m`, `1h30m`); `--wait 0` chờ vô thời hạn. Không tương thích với `--force` hoặc `--safe`.

`--force` bỏ qua việc chờ công việc đang hoạt động hoàn tất và khởi động lại ngay lập tức. `restart` thông thường (không có cờ) giữ nguyên hành vi khởi động lại hiện có của trình quản lý dịch vụ.

<Warning>
`--password` nội tuyến có thể bị lộ trong danh sách tiến trình cục bộ. Nên dùng `--password-file`, biến môi trường hoặc `gateway.auth.password` dựa trên SecretRef.
</Warning>

### Trình giám sát bên ngoài

Chỉ đặt `OPENCLAW_SUPERVISOR_MODE=external` khi một trình quản lý tiến trình khác quản lý vòng đời Gateway. Trong chế độ này:

- `openclaw gateway restart` giữ nguyên hành vi an toàn, bắt buộc và chờ có giới hạn hiện có, đồng thời nhắm đến Gateway đang chạy đã được xác minh thay vì launchd, systemd hoặc Task Scheduler.
- Các thao tác cài đặt, khởi động, dừng và gỡ cài đặt dịch vụ gốc bị từ chối, kèm hướng dẫn sử dụng trình giám sát bên ngoài.
- Tính năng tự cập nhật OpenClaw bị từ chối để trình giám sát có thể dừng Gateway, thay thế và hoàn tất runtime, rồi khởi động lại một cách an toàn.
- Một lần khởi động lại bằng tiến trình mới sẽ ghi bàn giao SQLite có giới hạn trước khi thoát sạch. Nếu không thể lưu, Gateway chuyển sang khởi động lại trong tiến trình thay vì thoát mà không có bàn giao có thể sử dụng.

`OPENCLAW_SERVICE_REPAIR_POLICY=external` vẫn là một chính sách sửa chữa riêng của Doctor. Biến này không khai báo quyền sở hữu runtime; các trình giám sát cần cả hai hành vi phải đặt cả hai biến.

Các trình giám sát bên ngoài có thể thương lượng và sử dụng bàn giao khởi động lại thông qua hợp đồng máy ẩn:

```bash
openclaw gateway restart-handoff capabilities --json
openclaw gateway restart-handoff consume --expected-pid <pid> --json
```

Phiên bản giao thức `1` hỗ trợ thao tác `consume`. Quá trình sử dụng xác thực PID dự kiến và các trường bàn giao có giới hạn trong một giao dịch SQLite tức thời. Bản bàn giao được chấp nhận sẽ bị xóa trước khi trả về thành công, nên các bên sử dụng đồng thời hoặc phát lại không thể cùng chấp nhận bản đó. Trường hợp PID không khớp được giữ lại cho chủ sở hữu tương ứng; các hàng bị thiếu, hết hạn hoặc không hợp lệ không cho phép khởi động lại.

Các yêu cầu máy hợp lệ trả về JSON với mã thoát `0`, kể cả các kết quả không khởi động lại. Đối số không hợp lệ trả về `reason: "invalid-expected-pid"` với mã thoát `2`; lỗi kho lưu trạng thái trả về `reason: "store-unavailable"` với mã thoát `1`. Trình giám sát nên thăm dò `capabilities` trên chính runtime hoặc trình khởi chạy sẽ sử dụng, thay vì suy luận hỗ trợ từ chuỗi phiên bản OpenClaw hoặc đọc trực tiếp lược đồ SQLite riêng tư.

### Lập hồ sơ Gateway

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` ghi thời gian của các giai đoạn trong quá trình khởi động, bao gồm độ trễ `eventLoopMax` theo từng giai đoạn và thời gian của bảng tra cứu plugin (chỉ mục đã cài đặt, registry manifest, lập kế hoạch khởi động, công việc ánh xạ chủ sở hữu).
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` ghi các dòng `restart trace:` trong phạm vi khởi động lại: xử lý tín hiệu, chờ công việc đang hoạt động hoàn tất, các giai đoạn tắt, lần khởi động tiếp theo, thời gian sẵn sàng và các chỉ số bộ nhớ.
- `OPENCLAW_DIAGNOSTICS=timeline` cùng `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` ghi dòng thời gian chẩn đoán khởi động JSONL theo nỗ lực tối đa cho các bộ kiểm thử QA bên ngoài (tương đương cấu hình `diagnostics.flags: ["timeline"]`; đường dẫn vẫn chỉ được đặt qua biến môi trường). Thêm `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` để bao gồm các mẫu vòng lặp sự kiện.
- `pnpm build` rồi `pnpm test:startup:gateway -- --runs 5 --warmup 1` đo chuẩn quá trình khởi động Gateway dựa trên điểm vào CLI đã được build: đầu ra tiến trình đầu tiên, `/healthz`, `/readyz`, thời gian dấu vết khởi động, độ trễ vòng lặp sự kiện và thời gian của bảng tra cứu plugin.
- `pnpm build` rồi `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` đo chuẩn việc khởi động lại trong tiến trình trên macOS hoặc Linux (không được hỗ trợ trên Windows; việc khởi động lại yêu cầu `SIGUSR1`). Sử dụng `SIGUSR1`, bật cả hai dấu vết trong tiến trình con và ghi lại `/healthz` tiếp theo, `/readyz` tiếp theo, thời gian ngừng hoạt động, thời gian sẵn sàng, CPU, RSS và các chỉ số dấu vết khởi động lại.
- `/healthz` biểu thị khả năng còn hoạt động; `/readyz` biểu thị trạng thái sẵn sàng sử dụng. Hãy coi các dòng dấu vết và đầu ra đo chuẩn là tín hiệu quy trách nhiệm cho chủ sở hữu, không phải kết luận hoàn chỉnh về hiệu năng dựa trên một khoảng thời gian hoặc mẫu duy nhất.

## Truy vấn Gateway đang chạy

Tất cả các lệnh truy vấn đều sử dụng RPC qua WebSocket.

<Tabs>
  <Tab title="Chế độ đầu ra">
    - Mặc định: con người có thể đọc được (có màu trong TTY).
    - `--json`: JSON máy có thể đọc được (không có kiểu trình bày/vòng xoay tiến trình).
    - `--no-color` (hoặc `NO_COLOR=1`): tắt ANSI trong khi giữ bố cục cho người đọc.

  </Tab>
  <Tab title="Tùy chọn dùng chung">
    - `--url <url>`: URL WebSocket của Gateway.
    - `--token <token>`: token Gateway.
    - `--password <password>`: mật khẩu Gateway.
    - `--timeout <ms>`: thời gian chờ/thời lượng cho phép (mặc định thay đổi theo từng lệnh; xem từng lệnh bên dưới).
    - `--expect-final`: chờ phản hồi "cuối cùng" (lệnh gọi của agent).

  </Tab>
</Tabs>

<Note>
Khi bạn đặt `--url`, CLI không dùng thông tin xác thực từ cấu hình hoặc biến môi trường làm phương án dự phòng. Hãy truyền rõ `--token` hoặc `--password`. Thiếu thông tin xác thực được truyền rõ ràng là một lỗi.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` là một phép thăm dò khả năng hoạt động: nó trả về ngay khi máy chủ có thể phản hồi HTTP. `/readyz` nghiêm ngặt hơn và vẫn ở trạng thái đỏ trong khi các sidecar Plugin khởi động, kênh hoặc hook đã cấu hình vẫn đang ổn định. Các phản hồi `/readyz` chi tiết cục bộ hoặc đã xác thực bao gồm một khối chẩn đoán `eventLoop` (độ trễ, mức sử dụng, tỷ lệ lõi CPU, cờ `degraded`).

<ParamField path="--port <port>" type="number">
  Nhắm đến một Gateway loopback cục bộ trên cổng này. Ghi đè `OPENCLAW_GATEWAY_URL` và `OPENCLAW_GATEWAY_PORT` cho lần gọi này.
</ParamField>

### `gateway usage-cost`

Tải bản tóm tắt chi phí sử dụng từ nhật ký phiên.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Số ngày cần đưa vào.
</ParamField>
<ParamField path="--agent <id>" type="string">
  Giới hạn bản tóm tắt trong một id tác nhân đã cấu hình.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Tổng hợp trên tất cả tác nhân đã cấu hình. Không thể kết hợp với `--agent`.
</ParamField>

### `gateway stability`

Tải trình ghi độ ổn định chẩn đoán gần đây từ một Gateway đang chạy.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Số sự kiện gần đây tối đa cần đưa vào (tối đa `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Lọc theo loại sự kiện chẩn đoán, ví dụ `payload.large` hoặc `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Chỉ đưa vào các sự kiện sau một số thứ tự chẩn đoán.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Đọc một gói độ ổn định đã lưu thay vì gọi Gateway đang chạy. `--bundle latest` (hoặc chỉ `--bundle`) chọn gói mới nhất trong thư mục trạng thái; bạn cũng có thể truyền trực tiếp đường dẫn JSON của gói.
</ParamField>
<ParamField path="--export" type="boolean">
  Ghi một tệp zip chẩn đoán hỗ trợ có thể chia sẻ thay vì in chi tiết độ ổn định.
</ParamField>
<ParamField path="--output <path>" type="string">
  Đường dẫn đầu ra cho `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Quyền riêng tư và hành vi của gói">
    - Các bản ghi giữ lại siêu dữ liệu vận hành: tên sự kiện, số lượng, kích thước byte, số liệu bộ nhớ, trạng thái hàng đợi/phiên, id phê duyệt, tên kênh/Plugin và bản tóm tắt phiên đã biên tập. Chúng loại trừ văn bản trò chuyện, nội dung Webhook, đầu ra công cụ, nội dung thô của yêu cầu/phản hồi, token, cookie, giá trị bí mật, tên máy chủ và id phiên thô. Đặt `diagnostics.enabled: false` để tắt hoàn toàn trình ghi.
    - Các lần Gateway thoát nghiêm trọng, hết thời gian chờ tắt và lỗi khởi động lại sẽ ghi cùng ảnh chụp chẩn đoán vào `~/.openclaw/logs/stability/openclaw-stability-*.json` khi trình ghi có sự kiện. Kiểm tra gói mới nhất bằng `openclaw gateway stability --bundle latest`; `--limit`, `--type` và `--since-seq` cũng áp dụng cho đầu ra của gói.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Ghi một tệp zip chẩn đoán cục bộ được thiết kế cho báo cáo lỗi. Để biết mô hình quyền riêng tư và nội dung gói, hãy xem [Xuất chẩn đoán](/vi/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Đường dẫn tệp zip đầu ra. Mặc định là một bản xuất hỗ trợ trong thư mục trạng thái.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Số dòng nhật ký đã làm sạch tối đa cần đưa vào.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Số byte nhật ký tối đa cần kiểm tra.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket của Gateway cho ảnh chụp tình trạng.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token Gateway cho ảnh chụp tình trạng.
</ParamField>
<ParamField path="--password <password>" type="string">
  Mật khẩu Gateway cho ảnh chụp tình trạng.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Thời gian chờ ảnh chụp trạng thái/tình trạng.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Bỏ qua việc tra cứu gói độ ổn định đã lưu.
</ParamField>
<ParamField path="--json" type="boolean">
  In đường dẫn đã ghi, kích thước và manifest dưới dạng JSON.
</ParamField>

Bản xuất đóng gói: `manifest.json` (danh mục tệp), `summary.md` (bản tóm tắt Markdown), `diagnostics.json` (bản tóm tắt cấu hình/nhật ký/khám phá/độ ổn định/trạng thái/tình trạng cấp cao nhất), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` và `stability/latest.json` khi có gói.

Bản xuất được thiết kế để chia sẻ. Nó giữ lại các chi tiết vận hành hữu ích cho việc gỡ lỗi — các trường nhật ký an toàn, tên hệ thống con, mã trạng thái, khoảng thời gian, chế độ đã cấu hình, cổng, id Plugin/nhà cung cấp, cài đặt tính năng không bí mật và thông báo nhật ký vận hành đã biên tập — đồng thời bỏ qua hoặc biên tập văn bản trò chuyện, nội dung Webhook, đầu ra công cụ, thông tin xác thực, cookie, định danh tài khoản/tin nhắn, văn bản lời nhắc/chỉ dẫn, tên máy chủ và giá trị bí mật. Khi một thông báo nhật ký có vẻ là văn bản tải trọng của người dùng/trò chuyện/công cụ (ví dụ "người dùng đã nói", "văn bản trò chuyện", "đầu ra công cụ", "nội dung Webhook"), bản xuất chỉ giữ lại thông tin rằng một tin nhắn đã bị bỏ qua cùng số byte của nó.

### `gateway status`

Hiển thị dịch vụ Gateway (launchd/systemd/schtasks) cùng một phép thăm dò kết nối/xác thực tùy chọn.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Thêm một mục tiêu thăm dò rõ ràng. Địa chỉ từ xa đã cấu hình và localhost vẫn được thăm dò.
</ParamField>
<ParamField path="--token <token>" type="string">
  Xác thực bằng token cho phép thăm dò.
</ParamField>
<ParamField path="--password <password>" type="string">
  Xác thực bằng mật khẩu cho phép thăm dò.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Thời gian chờ thăm dò.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Bỏ qua phép thăm dò kết nối (chế độ xem chỉ dịch vụ).
</ParamField>
<ParamField path="--deep" type="boolean">
  Quét cả các dịch vụ cấp hệ thống.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Nâng cấp phép thăm dò kết nối thành phép thăm dò đọc và thoát với mã khác 0 nếu thất bại. Không thể kết hợp với `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Ngữ nghĩa trạng thái">
    - Vẫn khả dụng để chẩn đoán ngay cả khi cấu hình CLI cục bộ bị thiếu hoặc không hợp lệ.
    - Đầu ra mặc định xác minh trạng thái dịch vụ, kết nối WebSocket và khả năng xác thực hiển thị tại thời điểm bắt tay — không phải các thao tác đọc/ghi/quản trị.
    - Các phép thăm dò không làm thay đổi dữ liệu đối với xác thực thiết bị lần đầu: chúng tái sử dụng token thiết bị đã lưu vào bộ nhớ đệm nếu có, nhưng không bao giờ tạo danh tính thiết bị CLI mới hoặc bản ghi ghép nối chỉ đọc chỉ để kiểm tra trạng thái.
    - Phân giải các SecretRef xác thực đã cấu hình cho việc xác thực phép thăm dò khi có thể. Nếu một SecretRef bắt buộc chưa được phân giải, `--json` báo cáo `rpc.authWarning` khi kết nối/xác thực thăm dò thất bại; hãy truyền rõ ràng `--token`/`--password` hoặc sửa nguồn bí mật. Cảnh báo xác thực chưa phân giải sẽ bị ẩn sau khi phép thăm dò thành công.
    - Đầu ra JSON bao gồm `gateway.version` khi Gateway đang chạy báo cáo trường này; `--require-rpc` có thể dự phòng bằng tải trọng RPC `status.runtimeVersion` nếu phép thăm dò bắt tay không thể cung cấp siêu dữ liệu phiên bản.
    - Dùng `--require-rpc` trong tập lệnh/tự động hóa khi một dịch vụ đang lắng nghe là chưa đủ và RPC phạm vi đọc cũng cần ở trạng thái tốt.
    - `--deep` quét các bản cài đặt launchd/systemd/schtasks bổ sung; khi tìm thấy nhiều dịch vụ giống Gateway, đầu ra dành cho người đọc sẽ in gợi ý dọn dẹp (thường chỉ chạy một Gateway trên mỗi máy) và báo cáo một lần bàn giao khởi động lại gần đây của trình giám sát khi có liên quan.
    - `--deep` cũng chạy xác thực cấu hình ở chế độ nhận biết Plugin (`pluginValidation: "full"`) và hiển thị cảnh báo manifest Plugin (ví dụ thiếu siêu dữ liệu cấu hình kênh). `gateway status` mặc định giữ đường dẫn chỉ đọc nhanh, bỏ qua xác thực Plugin.
    - Đầu ra dành cho người đọc bao gồm đường dẫn tệp nhật ký đã phân giải cùng các đường dẫn/tính hợp lệ của cấu hình CLI so với dịch vụ để hỗ trợ chẩn đoán sai lệch hồ sơ hoặc thư mục trạng thái.
    - Đầu ra dành cho người đọc bao gồm `Gateway heap:` với giới hạn được áp dụng và cách suy ra thích ứng của giới hạn đó. Đầu ra JSON cung cấp cùng báo cáo dưới dạng `service.gatewayHeap`.

  </Accordion>
  <Accordion title="Kiểm tra sai lệch xác thực systemd trên Linux">
    - Các kiểm tra sai lệch xác thực dịch vụ đọc cả `Environment=` và `EnvironmentFile=` từ unit (bao gồm `%h`, đường dẫn đặt trong dấu ngoặc kép, nhiều tệp và các tệp `-` tùy chọn).
    - Phân giải SecretRef `gateway.auth.token` bằng môi trường thời gian chạy đã hợp nhất (môi trường lệnh dịch vụ trước, sau đó dự phòng bằng môi trường tiến trình).
    - Các kiểm tra sai lệch token bỏ qua việc phân giải token cấu hình khi xác thực bằng token không thực sự hoạt động (`gateway.auth.mode` được đặt rõ ràng thành `password`/`none`/`trusted-proxy`, hoặc chế độ chưa đặt trong trường hợp mật khẩu có thể thắng và không ứng viên token nào có thể thắng).

  </Accordion>
</AccordionGroup>

### `gateway probe`

Lệnh "gỡ lỗi mọi thứ". Lệnh này luôn thăm dò:

- Gateway từ xa đã cấu hình của bạn (nếu có), và
- localhost (loopback), **ngay cả khi đã cấu hình địa chỉ từ xa**.

Truyền `--url` sẽ thêm mục tiêu rõ ràng đó trước cả hai mục tiêu trên. Đầu ra dành cho người đọc gắn nhãn các mục tiêu là `URL (explicit)`, `Remote (configured)` / `Remote (configured, inactive)` và `Local loopback`.

<Note>
Nếu có thể truy cập nhiều mục tiêu thăm dò, tất cả đều được in. Một đường hầm SSH, URL TLS/proxy và URL từ xa đã cấu hình có thể trỏ đến cùng một Gateway ngay cả khi sử dụng các cổng truyền tải khác nhau; `multiple_gateways` được dành riêng cho các Gateway có thể truy cập nhưng khác biệt hoặc không rõ ràng về danh tính. Việc chạy nhiều Gateway được hỗ trợ cho các hồ sơ cô lập (ví dụ bot cứu hộ), nhưng hầu hết bản cài đặt chỉ chạy một Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Dùng cổng này cho mục tiêu thăm dò loopback cục bộ và cổng từ xa của đường hầm SSH. Khi không có `--url`, tùy chọn này chỉ chọn mục tiêu loopback cục bộ thay vì URL môi trường Gateway đã cấu hình, cổng môi trường hoặc các mục tiêu từ xa.
</ParamField>

<AccordionGroup>
  <Accordion title="Diễn giải">
    - `Reachable: yes` nghĩa là ít nhất một mục tiêu đã chấp nhận kết nối WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` báo cáo những gì phép thăm dò có thể xác minh về xác thực, tách biệt với khả năng truy cập.
    - `Read probe: ok` nghĩa là các lệnh gọi RPC chi tiết thuộc phạm vi đọc (`health`/`status`/`system-presence`/`config.get`) cũng đã thành công.
    - `Read probe: limited - missing scope: operator.read` nghĩa là kết nối thành công nhưng RPC phạm vi đọc bị hạn chế. Được báo cáo là khả năng truy cập **suy giảm**, không phải thất bại hoàn toàn.
    - `Read probe: failed` sau `Connect: ok` nghĩa là WebSocket đã kết nối nhưng chẩn đoán đọc tiếp theo hết thời gian chờ hoặc thất bại — cũng là trạng thái **suy giảm**, không phải không thể truy cập.
    - Giống như `gateway status`, phép thăm dò tái sử dụng xác thực thiết bị đã lưu trong bộ nhớ đệm nhưng không tạo danh tính thiết bị hoặc trạng thái ghép nối lần đầu.
    - Mã thoát chỉ khác 0 khi không thể truy cập bất kỳ mục tiêu nào đã thăm dò.

  </Accordion>
  <Accordion title="Đầu ra JSON">
    Cấp cao nhất:

    - `ok`: có thể kết nối đến ít nhất một đích.
    - `degraded`: ít nhất một đích đã chấp nhận kết nối nhưng không hoàn tất chẩn đoán RPC chi tiết đầy đủ.
    - `capability`: khả năng tốt nhất ghi nhận được trên các đích có thể kết nối (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` hoặc `unknown`).
    - `primaryTargetId`: đích tốt nhất được xem là đích đang hoạt động, theo thứ tự: URL tường minh, đường hầm SSH, máy từ xa đã cấu hình, loopback cục bộ.
    - `warnings[]`: các bản ghi cảnh báo theo khả năng tốt nhất với `code`, `message`, và `targetIds` tùy chọn.
    - `network`: các gợi ý URL loopback/tailnet cục bộ được suy ra từ cấu hình hiện tại và mạng của máy chủ.
    - `discovery.timeoutMs` / `discovery.count`: ngân sách khám phá/số lượng kết quả thực tế được sử dụng cho lượt thăm dò này.

    Theo từng đích (`targets[].connect`): `ok` (khả năng kết nối + phân loại suy giảm), `rpcOk` (RPC chi tiết đầy đủ thành công), `scopeLimited` (RPC chi tiết thất bại do thiếu phạm vi operator).

    Theo từng đích (`targets[].auth`): `role` và `scopes` được báo cáo trong `hello-ok` khi có, cùng với phân loại `capability` được hiển thị.

  </Accordion>
  <Accordion title="Các mã cảnh báo phổ biến">
    - `ssh_tunnel_failed`: không thể thiết lập đường hầm SSH; lệnh đã chuyển sang thăm dò trực tiếp.
    - `multiple_gateways`: có thể kết nối đến các danh tính gateway khác nhau, hoặc OpenClaw không thể xác minh rằng các đích có thể kết nối là cùng một gateway. Đường hầm SSH, URL proxy hoặc URL từ xa đã cấu hình trỏ đến cùng một gateway sẽ không kích hoạt cảnh báo này.
    - `auth_secretref_unresolved`: không thể phân giải SecretRef xác thực đã cấu hình cho một đích bị lỗi.
    - `probe_scope_limited`: kết nối WebSocket thành công, nhưng thăm dò đọc bị giới hạn do thiếu `operator.read`.
    - `local_tls_runtime_unavailable`: TLS của Gateway cục bộ đã được bật nhưng OpenClaw không thể tải dấu vân tay chứng chỉ cục bộ.

  </Accordion>
</AccordionGroup>

#### Từ xa qua SSH (tương đương với ứng dụng Mac)

Chế độ "Remote over SSH" của ứng dụng macOS sử dụng chuyển tiếp cổng cục bộ để gateway từ xa chỉ nghe trên loopback có thể được truy cập tại `ws://127.0.0.1:<port>`.

Lệnh CLI tương đương:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` hoặc `user@host:port` (cổng mặc định là `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Tệp danh tính.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Chọn máy chủ gateway đầu tiên được khám phá làm đích SSH từ điểm cuối khám phá đã phân giải (`local.` cộng với miền diện rộng đã cấu hình, nếu có). Các gợi ý chỉ có TXT sẽ bị bỏ qua.
</ParamField>

Giá trị mặc định của cấu hình (tùy chọn): `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`.

### `gateway call <method>`

Trình trợ giúp RPC cấp thấp.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Chuỗi đối tượng JSON cho các tham số.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket của Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token của Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  Mật khẩu của Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Ngân sách thời gian chờ.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Chủ yếu dành cho các RPC kiểu agent phát trực tiếp các sự kiện trung gian trước tải trọng cuối cùng.
</ParamField>
<ParamField path="--json" type="boolean">
  Đầu ra JSON có thể đọc bằng máy.
</ParamField>

<Note>
`--params` phải là JSON hợp lệ và mỗi phương thức xác thực hình dạng tham số riêng (các trường thừa hoặc sai tên sẽ bị từ chối).
</Note>

## Quản lý dịch vụ Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Cài đặt bằng trình bao bọc

Sử dụng `--wrapper` khi dịch vụ được quản lý phải khởi động thông qua một tệp thực thi khác, chẳng hạn như một shim của trình quản lý bí mật hoặc trình trợ giúp chạy dưới danh tính khác. Trình bao bọc nhận các đối số Gateway thông thường và chịu trách nhiệm cuối cùng thực thi `openclaw` hoặc Node với các đối số đó.

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

Bạn cũng có thể thiết lập trình bao bọc thông qua môi trường. `gateway install` xác thực rằng đường dẫn là một tệp thực thi, ghi trình bao bọc vào `ProgramArguments` của dịch vụ và lưu `OPENCLAW_WRAPPER` trong môi trường dịch vụ để dùng cho các lần buộc cài đặt lại, cập nhật và sửa chữa bằng doctor sau này.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Để xóa một trình bao bọc đã được lưu, hãy xóa `OPENCLAW_WRAPPER` trong khi cài đặt lại:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Tùy chọn lệnh">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node>` (mặc định: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--force`, `--json`

  </Accordion>
  <Accordion title="Hành vi vòng đời">
    - `gateway start` có tính lũy đẳng: khi dịch vụ được quản lý đã chạy, lệnh sẽ báo cáo tiến trình đang chạy và giữ nguyên trạng thái. Dịch vụ đã được nạp nhưng đang dừng vẫn được khởi động như trước.
    - Dùng `gateway restart` để khởi động lại dịch vụ được quản lý. Không nối tiếp `gateway stop` và `gateway start` để thay thế thao tác khởi động lại.
    - Trong shell không tương tác, `gateway stop` yêu cầu `--force`. Thiết bị đầu cuối tương tác vẫn giữ hành vi hiện có là không hiển thị lời nhắc. Đối với tự động hóa và kiểm thử, nên dùng `gateway run --dev` hoặc một `--profile` biệt lập với cổng còn trống.
    - Trên macOS, `gateway stop` mặc định dùng `launchctl bootout`, thao tác này xóa LaunchAgent khỏi phiên khởi động hiện tại mà không lưu trạng thái vô hiệu hóa — cơ chế tự động khôi phục của KeepAlive vẫn hoạt động cho các sự cố trong tương lai và `gateway start` bật lại một cách gọn gàng mà không cần `launchctl enable` thủ công. Truyền `--disable` để liên tục chặn KeepAlive và RunAtLoad, nhờ đó Gateway không tái khởi chạy cho đến lần `gateway start` tường minh tiếp theo; dùng tùy chọn này khi trạng thái dừng thủ công cần được duy trì qua các lần khởi động lại hệ thống.
    - Các thay đổi vòng đời Gateway nối thêm các bản ghi kiểm toán khóa-giá trị theo cơ chế nỗ lực tối đa vào `<state-dir>/logs/gateway-restart.log`, bao gồm các thao tác khởi động, dừng và khởi động lại từ CLI, yêu cầu khởi động lại an toàn, khởi động lại từ trình giám sát và bàn giao tách rời.
    - Các lệnh vòng đời chấp nhận `--json` để dùng trong tập lệnh.

  </Accordion>
  <Accordion title="Định cỡ heap cho Gateway được quản lý">
    - `gateway install` ghi một giá trị `NODE_OPTIONS` chỉ dành cho heap cho dịch vụ Gateway được quản lý. Giá trị này nhắm đến 50% bộ nhớ bị giới hạn khi Node báo cáo giới hạn của vùng chứa hoặc dịch vụ, nếu không thì là 50% bộ nhớ vật lý.
    - Phạm vi mục tiêu danh nghĩa là 2048–8192 MiB, với giới hạn bổ sung dành 75% dung lượng dự phòng cho bộ nhớ native. Trên các máy chủ nhỏ, giới hạn dung lượng dự phòng đó có thể khiến giới hạn được áp dụng thấp hơn mức sàn danh nghĩa 2048 MiB.
    - Một `--max-old-space-size` tường minh và hợp lệ đã được lưu trong dịch vụ đã cài đặt sẽ được giữ nguyên qua các lần buộc cài đặt lại và sửa chữa bằng doctor. Các cờ `NODE_OPTIONS` khác không được chuyển vào dịch vụ được quản lý.
    - `NODE_OPTIONS` của shell xung quanh không ghi đè chính sách này. Dùng `gateway status` hoặc `doctor` để kiểm tra giá trị đã cài đặt; chạy `openclaw gateway install --force` để tạo lại siêu dữ liệu dịch vụ cũ không có thiết lập heap được quản lý.
    - Chính sách này chỉ áp dụng cho dịch vụ Gateway được quản lý. `gateway run` chạy ở tiền cảnh, các dịch vụ node và các đơn vị trình giám sát viết thủ công vẫn giữ cấu hình thời gian chạy riêng.

  </Accordion>
  <Accordion title="Xác thực và SecretRef tại thời điểm cài đặt">
    - Khi xác thực bằng token yêu cầu token và `gateway.auth.token` được quản lý bằng SecretRef, `gateway install` xác thực rằng SecretRef có thể được phân giải nhưng không lưu token đã phân giải vào siêu dữ liệu môi trường dịch vụ.
    - Nếu xác thực bằng token yêu cầu token nhưng SecretRef của token đã cấu hình không thể phân giải, quá trình cài đặt sẽ đóng an toàn thay vì lưu văn bản thuần dự phòng.
    - Đối với xác thực bằng mật khẩu trên `gateway run`, nên dùng `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` hoặc `gateway.auth.password` dựa trên SecretRef thay cho `--password` nội tuyến.
    - Trong chế độ xác thực được suy luận, `OPENCLAW_GATEWAY_PASSWORD` chỉ có trong shell không làm giảm yêu cầu về token khi cài đặt; hãy dùng cấu hình bền vững (`gateway.auth.password` hoặc `env` trong cấu hình) khi cài đặt dịch vụ được quản lý.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình còn `gateway.auth.mode` chưa được đặt, quá trình cài đặt sẽ bị chặn cho đến khi chế độ được đặt tường minh.

  </Accordion>
</AccordionGroup>

## Khám phá Gateway (Bonjour)

`gateway discover` quét các beacon Gateway (`_openclaw-gw._tcp`).

- DNS-SD đa hướng: `local.`
- DNS-SD đơn hướng (Bonjour diện rộng): chọn một miền (ví dụ: `openclaw.internal.`) và thiết lập DNS phân tách cùng một máy chủ DNS; xem [Bonjour](/vi/gateway/bonjour).

Chỉ những Gateway đã bật tính năng khám phá Bonjour (mặc định) mới quảng bá beacon.

Các gợi ý TXT trên mỗi beacon: `role` (gợi ý vai trò Gateway), `transport` (gợi ý phương thức truyền tải, ví dụ `gateway`), `gatewayPort` (cổng WebSocket, thường là `18789`), `tailnetDns` (tên máy chủ MagicDNS, khi có), `gatewayTls` / `gatewayTlsSha256` (TLS đã bật + dấu vân tay chứng chỉ). `sshPort` và `cliPath` chỉ được công bố trong chế độ khám phá đầy đủ (`discovery.mdns.mode: "full"`; mặc định là `"minimal"`, chế độ này bỏ qua chúng — sau đó, máy khách mặc định dùng cổng `22` cho các đích SSH).

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Thời gian chờ cho mỗi lệnh (duyệt/phân giải).
</ParamField>
<ParamField path="--json" type="boolean">
  Đầu ra có thể đọc bằng máy (đồng thời tắt định kiểu/vòng xoay tiến trình).
</ParamField>

Ví dụ:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- Quét `local.` cùng miền diện rộng đã cấu hình khi miền đó được bật.
- `wsUrl` trong đầu ra JSON được suy ra từ điểm cuối dịch vụ đã phân giải, không phải từ các gợi ý chỉ có trong TXT như `lanHost` hoặc `tailnetDns`.
- `discovery.mdns.mode` kiểm soát việc công bố `sshPort`/`cliPath` trên cả mDNS `local.` và DNS-SD diện rộng (xem phần trên).

</Note>

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Cẩm nang vận hành Gateway](/vi/gateway)
