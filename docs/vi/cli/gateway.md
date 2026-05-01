---
read_when:
    - Chạy Gateway từ CLI (môi trường phát triển hoặc máy chủ)
    - Gỡ lỗi xác thực Gateway, các chế độ ràng buộc và khả năng kết nối
    - Phát hiện các Gateway qua Bonjour (DNS-SD cục bộ + diện rộng)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — chạy, truy vấn và phát hiện các Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-01T10:46:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 127a6ccb4baa1ad5e5051db0bc7ef0ed30d410c4c3d13f36356483a6e03dce4c
    source_path: cli/gateway.md
    workflow: 16
---

Gateway là máy chủ WebSocket của OpenClaw (kênh, nút, phiên, hook). Các lệnh con trong trang này nằm dưới `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/vi/gateway/bonjour">
    Thiết lập mDNS cục bộ + DNS-SD diện rộng.
  </Card>
  <Card title="Discovery overview" href="/vi/gateway/discovery">
    Cách OpenClaw quảng bá và tìm Gateway.
  </Card>
  <Card title="Configuration" href="/vi/gateway/configuration">
    Các khóa cấu hình Gateway cấp cao nhất.
  </Card>
</CardGroup>

## Chạy Gateway

Chạy một tiến trình Gateway cục bộ:

```bash
openclaw gateway
```

Bí danh chạy nền trước:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Startup behavior">
    - Theo mặc định, Gateway từ chối khởi động trừ khi `gateway.mode=local` được đặt trong `~/.openclaw/openclaw.json`. Dùng `--allow-unconfigured` cho các lần chạy ad-hoc/dev.
    - `openclaw onboard --mode local` và `openclaw setup` được kỳ vọng sẽ ghi `gateway.mode=local`. Nếu tệp tồn tại nhưng thiếu `gateway.mode`, hãy xem đó là cấu hình bị hỏng hoặc bị ghi đè và sửa nó thay vì ngầm giả định chế độ cục bộ.
    - Nếu tệp tồn tại và thiếu `gateway.mode`, Gateway xem đó là hư hại cấu hình đáng ngờ và từ chối "đoán local" cho bạn.
    - Việc bind vượt ra ngoài loopback mà không có xác thực sẽ bị chặn (lan can an toàn).
    - `SIGUSR1` kích hoạt khởi động lại trong tiến trình khi được phép (`commands.restart` được bật theo mặc định; đặt `commands.restart: false` để chặn khởi động lại thủ công, trong khi thao tác áp dụng/cập nhật công cụ/cấu hình Gateway vẫn được cho phép).
    - Các handler `SIGINT`/`SIGTERM` dừng tiến trình Gateway, nhưng chúng không khôi phục bất kỳ trạng thái terminal tùy chỉnh nào. Nếu bạn bọc CLI bằng TUI hoặc đầu vào raw-mode, hãy khôi phục terminal trước khi thoát.

  </Accordion>
</AccordionGroup>

### Tùy chọn

<ParamField path="--port <port>" type="number">
  Cổng WebSocket (mặc định lấy từ cấu hình/env; thường là `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Chế độ bind listener.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Ghi đè chế độ xác thực.
</ParamField>
<ParamField path="--token <token>" type="string">
  Ghi đè token (cũng đặt `OPENCLAW_GATEWAY_TOKEN` cho tiến trình).
</ParamField>
<ParamField path="--password <password>" type="string">
  Ghi đè mật khẩu.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Đọc mật khẩu Gateway từ một tệp.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Công khai Gateway qua Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Đặt lại cấu hình serve/funnel của Tailscale khi tắt.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Cho phép Gateway khởi động khi không có `gateway.mode=local` trong cấu hình. Chỉ bỏ qua cơ chế bảo vệ khởi động cho bootstrap ad-hoc/dev; không ghi hoặc sửa tệp cấu hình.
</ParamField>
<ParamField path="--dev" type="boolean">
  Tạo cấu hình dev + workspace nếu thiếu (bỏ qua BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Đặt lại cấu hình dev + thông tin xác thực + phiên + workspace (yêu cầu `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Kết thúc mọi listener hiện có trên cổng đã chọn trước khi khởi động.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Nhật ký chi tiết.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Chỉ hiển thị nhật ký backend CLI trong console (và bật stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Kiểu nhật ký WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Bí danh cho `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Ghi các sự kiện luồng mô hình thô vào jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Đường dẫn jsonl luồng thô.
</ParamField>

<Warning>
`--password` nội tuyến có thể bị lộ trong danh sách tiến trình cục bộ. Nên dùng `--password-file`, env, hoặc `gateway.auth.password` được hỗ trợ bởi SecretRef.
</Warning>

### Lập hồ sơ khởi động

- Đặt `OPENCLAW_GATEWAY_STARTUP_TRACE=1` để ghi nhật ký thời gian từng pha trong quá trình khởi động Gateway, bao gồm độ trễ `eventLoopMax` theo từng pha và thời gian bảng tra cứu Plugin cho installed-index, manifest registry, lập kế hoạch khởi động và công việc owner-map.
- Đặt `OPENCLAW_DIAGNOSTICS=timeline` với `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` để ghi timeline chẩn đoán khởi động JSONL theo nỗ lực tốt nhất cho các bộ công cụ QA bên ngoài. Bạn cũng có thể bật cờ bằng `diagnostics.flags: ["timeline"]` trong cấu hình; đường dẫn vẫn được cung cấp qua env. Thêm `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` để bao gồm mẫu event-loop.
- Chạy `pnpm test:startup:gateway -- --runs 5 --warmup 1` để benchmark khởi động Gateway. Benchmark ghi lại đầu ra tiến trình đầu tiên, `/healthz`, `/readyz`, thời gian startup trace, độ trễ event-loop và chi tiết thời gian bảng tra cứu Plugin.

## Truy vấn một Gateway đang chạy

Tất cả lệnh truy vấn đều dùng WebSocket RPC.

<Tabs>
  <Tab title="Output modes">
    - Mặc định: dễ đọc cho người dùng (có màu trong TTY).
    - `--json`: JSON để máy đọc (không styling/spinner).
    - `--no-color` (hoặc `NO_COLOR=1`): tắt ANSI trong khi vẫn giữ bố cục cho người đọc.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: URL WebSocket của Gateway.
    - `--token <token>`: token Gateway.
    - `--password <password>`: mật khẩu Gateway.
    - `--timeout <ms>`: timeout/ngân sách thời gian (khác nhau theo lệnh).
    - `--expect-final`: chờ phản hồi "final" (lời gọi agent).

  </Tab>
</Tabs>

<Note>
Khi bạn đặt `--url`, CLI không fallback về thông tin xác thực từ cấu hình hoặc môi trường. Hãy truyền rõ `--token` hoặc `--password`. Thiếu thông tin xác thực rõ ràng là lỗi.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Endpoint HTTP `/healthz` là probe liveness: nó trả về khi máy chủ có thể trả lời HTTP. Endpoint HTTP `/readyz` nghiêm ngặt hơn và vẫn đỏ trong khi các phụ thuộc runtime Plugin khi khởi động, sidecar, kênh hoặc hook đã cấu hình vẫn đang ổn định. Các phản hồi readiness chi tiết cục bộ hoặc đã xác thực bao gồm một khối chẩn đoán `eventLoop` với độ trễ event-loop, mức sử dụng event-loop, tỷ lệ lõi CPU và cờ `degraded`.

### `gateway usage-cost`

Lấy tóm tắt chi phí sử dụng từ nhật ký phiên.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Số ngày cần bao gồm.
</ParamField>

### `gateway stability`

Lấy bộ ghi ổn định chẩn đoán gần đây từ một Gateway đang chạy.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Số sự kiện gần đây tối đa cần bao gồm (tối đa `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Lọc theo loại sự kiện chẩn đoán, chẳng hạn như `payload.large` hoặc `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Chỉ bao gồm các sự kiện sau một số thứ tự chẩn đoán.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Đọc một bundle ổn định đã lưu thay vì gọi Gateway đang chạy. Dùng `--bundle latest` (hoặc chỉ `--bundle`) cho bundle mới nhất trong thư mục trạng thái, hoặc truyền trực tiếp đường dẫn JSON của bundle.
</ParamField>
<ParamField path="--export" type="boolean">
  Ghi một tệp zip chẩn đoán hỗ trợ có thể chia sẻ thay vì in chi tiết ổn định.
</ParamField>
<ParamField path="--output <path>" type="string">
  Đường dẫn đầu ra cho `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - Bản ghi giữ siêu dữ liệu vận hành: tên sự kiện, số lượng, kích thước byte, chỉ số bộ nhớ, trạng thái hàng đợi/phiên, tên kênh/Plugin và tóm tắt phiên đã biên tập. Chúng không giữ văn bản chat, body Webhook, đầu ra công cụ, body yêu cầu hoặc phản hồi thô, token, cookie, giá trị bí mật, hostname hoặc id phiên thô. Đặt `diagnostics.enabled: false` để tắt hoàn toàn bộ ghi.
    - Khi Gateway thoát nghiêm trọng, timeout khi tắt và lỗi khởi động lại, OpenClaw ghi cùng snapshot chẩn đoán vào `~/.openclaw/logs/stability/openclaw-stability-*.json` khi bộ ghi có sự kiện. Kiểm tra bundle mới nhất bằng `openclaw gateway stability --bundle latest`; `--limit`, `--type` và `--since-seq` cũng áp dụng cho đầu ra bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Ghi một tệp zip chẩn đoán cục bộ được thiết kế để đính kèm vào báo cáo lỗi. Để biết mô hình quyền riêng tư và nội dung bundle, xem [Xuất chẩn đoán](/vi/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Đường dẫn zip đầu ra. Mặc định là một bản xuất hỗ trợ trong thư mục trạng thái.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Số dòng nhật ký đã làm sạch tối đa cần bao gồm.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Số byte nhật ký tối đa cần kiểm tra.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket của Gateway cho snapshot health.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token Gateway cho snapshot health.
</ParamField>
<ParamField path="--password <password>" type="string">
  Mật khẩu Gateway cho snapshot health.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Timeout snapshot trạng thái/health.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Bỏ qua tra cứu bundle ổn định đã lưu.
</ParamField>
<ParamField path="--json" type="boolean">
  In đường dẫn đã ghi, kích thước và manifest dưới dạng JSON.
</ParamField>

Bản xuất chứa một manifest, tóm tắt Markdown, hình dạng cấu hình, chi tiết cấu hình đã làm sạch, tóm tắt nhật ký đã làm sạch, snapshot trạng thái/health của Gateway đã làm sạch và bundle ổn định mới nhất khi có.

Nó được thiết kế để chia sẻ. Nó giữ các chi tiết vận hành giúp gỡ lỗi, chẳng hạn như các trường nhật ký OpenClaw an toàn, tên hệ thống con, mã trạng thái, thời lượng, chế độ đã cấu hình, cổng, id Plugin, id provider, thiết lập tính năng không bí mật và thông điệp nhật ký vận hành đã biên tập. Nó bỏ qua hoặc biên tập văn bản chat, body Webhook, đầu ra công cụ, thông tin xác thực, cookie, định danh tài khoản/tin nhắn, văn bản prompt/instruction, hostname và giá trị bí mật. Khi một thông điệp kiểu LogTape trông giống văn bản payload người dùng/chat/công cụ, bản xuất chỉ giữ lại việc một thông điệp đã bị bỏ qua cùng số byte của nó.

### `gateway status`

`gateway status` hiển thị dịch vụ Gateway (launchd/systemd/schtasks) cùng một probe tùy chọn về khả năng kết nối/xác thực.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Thêm mục tiêu probe rõ ràng. Remote đã cấu hình + localhost vẫn được probe.
</ParamField>
<ParamField path="--token <token>" type="string">
  Xác thực token cho probe.
</ParamField>
<ParamField path="--password <password>" type="string">
  Xác thực mật khẩu cho probe.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Timeout probe.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Bỏ qua probe kết nối (chỉ xem dịch vụ).
</ParamField>
<ParamField path="--deep" type="boolean">
  Quét cả dịch vụ cấp hệ thống.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Nâng cấp probe kết nối mặc định thành probe đọc và thoát khác 0 khi probe đọc đó thất bại. Không thể kết hợp với `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Ngữ nghĩa trạng thái">
    - `gateway status` vẫn khả dụng cho chẩn đoán ngay cả khi cấu hình CLI cục bộ bị thiếu hoặc không hợp lệ.
    - `gateway status` mặc định xác minh trạng thái dịch vụ, kết nối WebSocket và khả năng xác thực hiển thị tại thời điểm bắt tay. Nó không xác minh các thao tác đọc/ghi/quản trị.
    - Các probe chẩn đoán không thay đổi trạng thái đối với xác thực thiết bị lần đầu: chúng tái sử dụng token thiết bị đã được lưu trong bộ nhớ đệm khi có, nhưng không tạo danh tính thiết bị CLI mới hoặc bản ghi ghép đôi thiết bị chỉ đọc mới chỉ để kiểm tra trạng thái.
    - `gateway status` phân giải các SecretRefs xác thực đã cấu hình cho xác thực probe khi có thể.
    - Nếu một SecretRef xác thực bắt buộc không được phân giải trong đường dẫn lệnh này, `gateway status --json` báo cáo `rpc.authWarning` khi kết nối/xác thực probe thất bại; truyền `--token`/`--password` rõ ràng hoặc phân giải nguồn bí mật trước.
    - Nếu probe thành công, các cảnh báo auth-ref chưa phân giải sẽ bị ẩn để tránh dương tính giả.
    - Dùng `--require-rpc` trong script và tự động hóa khi một dịch vụ đang lắng nghe là chưa đủ và bạn cũng cần các lệnh gọi RPC phạm vi đọc hoạt động bình thường.
    - `--deep` thêm một lần quét theo best-effort để tìm các cài đặt launchd/systemd/schtasks bổ sung. Khi phát hiện nhiều dịch vụ giống gateway, đầu ra cho người đọc sẽ in gợi ý dọn dẹp và cảnh báo rằng hầu hết thiết lập chỉ nên chạy một gateway trên mỗi máy.
    - Đầu ra cho người đọc bao gồm đường dẫn log tệp đã phân giải cùng ảnh chụp nhanh đường dẫn/tính hợp lệ cấu hình CLI-so-với-dịch-vụ để giúp chẩn đoán profile hoặc state-dir bị lệch.

  </Accordion>
  <Accordion title="Kiểm tra lệch xác thực systemd trên Linux">
    - Trên các cài đặt Linux systemd, kiểm tra lệch xác thực dịch vụ đọc cả giá trị `Environment=` và `EnvironmentFile=` từ unit (bao gồm `%h`, đường dẫn có trích dẫn, nhiều tệp và các tệp tùy chọn `-`).
    - Kiểm tra lệch phân giải SecretRefs `gateway.auth.token` bằng env runtime đã hợp nhất (env lệnh dịch vụ trước, sau đó dự phòng sang env tiến trình).
    - Nếu xác thực token không thực sự hoạt động (`gateway.auth.mode` rõ ràng là `password`/`none`/`trusted-proxy`, hoặc mode chưa đặt trong đó password có thể thắng và không có ứng viên token nào có thể thắng), kiểm tra lệch token sẽ bỏ qua phân giải token cấu hình.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` là lệnh "gỡ lỗi mọi thứ". Lệnh này luôn probe:

- gateway từ xa đã cấu hình của bạn (nếu đã đặt), và
- localhost (loopback) **ngay cả khi remote đã được cấu hình**.

Nếu bạn truyền `--url`, mục tiêu rõ ràng đó sẽ được thêm trước cả hai. Đầu ra cho người đọc gắn nhãn các mục tiêu là:

- `URL (explicit)`
- `Remote (configured)` hoặc `Remote (configured, inactive)`
- `Local loopback`

<Note>
Nếu có nhiều gateway truy cập được, lệnh sẽ in tất cả. Nhiều gateway được hỗ trợ khi bạn dùng profile/port tách biệt (ví dụ: bot cứu hộ), nhưng hầu hết cài đặt vẫn chạy một gateway duy nhất.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Diễn giải">
    - `Reachable: yes` nghĩa là ít nhất một mục tiêu đã chấp nhận kết nối WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` báo cáo điều probe có thể xác minh về xác thực. Nó tách biệt với khả năng truy cập.
    - `Read probe: ok` nghĩa là các lệnh gọi RPC chi tiết phạm vi đọc (`health`/`status`/`system-presence`/`config.get`) cũng thành công.
    - `Read probe: limited - missing scope: operator.read` nghĩa là kết nối thành công nhưng RPC phạm vi đọc bị giới hạn. Trạng thái này được báo cáo là khả năng truy cập **suy giảm**, không phải thất bại hoàn toàn.
    - `Read probe: failed` sau `Connect: ok` nghĩa là Gateway đã chấp nhận kết nối WebSocket, nhưng chẩn đoán đọc theo sau bị hết thời gian chờ hoặc thất bại. Đây cũng là khả năng truy cập **suy giảm**, không phải Gateway không truy cập được.
    - Giống như `gateway status`, probe tái sử dụng xác thực thiết bị đã lưu trong bộ nhớ đệm nhưng không tạo danh tính thiết bị lần đầu hoặc trạng thái ghép đôi.
    - Mã thoát chỉ khác 0 khi không có mục tiêu đã probe nào truy cập được.

  </Accordion>
  <Accordion title="Đầu ra JSON">
    Cấp trên cùng:

    - `ok`: ít nhất một mục tiêu truy cập được.
    - `degraded`: ít nhất một mục tiêu đã chấp nhận kết nối nhưng không hoàn tất đầy đủ chẩn đoán RPC chi tiết.
    - `capability`: khả năng tốt nhất thấy được trên các mục tiêu truy cập được (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, hoặc `unknown`).
    - `primaryTargetId`: mục tiêu tốt nhất để xem là mục tiêu thắng đang hoạt động theo thứ tự này: URL rõ ràng, SSH tunnel, remote đã cấu hình, rồi local loopback.
    - `warnings[]`: bản ghi cảnh báo best-effort với `code`, `message` và `targetIds` tùy chọn.
    - `network`: gợi ý URL local loopback/tailnet suy ra từ cấu hình hiện tại và mạng của host.
    - `discovery.timeoutMs` và `discovery.count`: ngân sách/kết quả discovery thực tế đã dùng cho lượt probe này.

    Theo từng mục tiêu (`targets[].connect`):

    - `ok`: khả năng truy cập sau phân loại connect + degraded.
    - `rpcOk`: RPC chi tiết đầy đủ thành công.
    - `scopeLimited`: RPC chi tiết thất bại do thiếu phạm vi operator.

    Theo từng mục tiêu (`targets[].auth`):

    - `role`: vai trò xác thực được báo cáo trong `hello-ok` khi có.
    - `scopes`: các phạm vi đã cấp được báo cáo trong `hello-ok` khi có.
    - `capability`: phân loại khả năng xác thực được hiển thị cho mục tiêu đó.

  </Accordion>
  <Accordion title="Mã cảnh báo thường gặp">
    - `ssh_tunnel_failed`: thiết lập SSH tunnel thất bại; lệnh đã dự phòng sang probe trực tiếp.
    - `multiple_gateways`: hơn một mục tiêu truy cập được; điều này bất thường trừ khi bạn cố ý chạy profile tách biệt, chẳng hạn như bot cứu hộ.
    - `auth_secretref_unresolved`: không thể phân giải SecretRef xác thực đã cấu hình cho một mục tiêu thất bại.
    - `probe_scope_limited`: kết nối WebSocket thành công, nhưng probe đọc bị giới hạn do thiếu `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remote qua SSH (tương đương ứng dụng Mac)

Chế độ "Remote over SSH" của ứng dụng macOS dùng một port-forward cục bộ để gateway từ xa (có thể chỉ được bind vào loopback) có thể truy cập tại `ws://127.0.0.1:<port>`.

Tương đương trên CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` hoặc `user@host:port` (port mặc định là `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Tệp định danh.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Chọn host gateway đầu tiên được phát hiện làm mục tiêu SSH từ endpoint discovery đã phân giải (`local.` cộng với miền diện rộng đã cấu hình, nếu có). Các gợi ý chỉ TXT sẽ bị bỏ qua.
</ParamField>

Cấu hình (tùy chọn, dùng làm mặc định):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Trình trợ giúp RPC cấp thấp.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Chuỗi đối tượng JSON cho params.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket của Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  Mật khẩu Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  Ngân sách thời gian chờ.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Chủ yếu dành cho RPC kiểu agent truyền phát các sự kiện trung gian trước payload cuối cùng.
</ParamField>
<ParamField path="--json" type="boolean">
  Đầu ra JSON cho máy đọc.
</ParamField>

<Note>
`--params` phải là JSON hợp lệ.
</Note>

## Quản lý dịch vụ Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Cài đặt với wrapper

Dùng `--wrapper` khi dịch vụ được quản lý phải khởi động thông qua một executable khác, ví dụ một
shim trình quản lý bí mật hoặc trình trợ giúp chạy dưới người dùng khác. Wrapper nhận các đối số Gateway thông thường và
chịu trách nhiệm cuối cùng exec `openclaw` hoặc Node với các đối số đó.

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

Bạn cũng có thể đặt wrapper qua môi trường. `gateway install` xác thực rằng đường dẫn là
một tệp executable, ghi wrapper vào `ProgramArguments` của dịch vụ và lưu bền
`OPENCLAW_WRAPPER` trong môi trường dịch vụ cho các lần cài đặt lại bắt buộc, cập nhật và sửa chữa doctor
về sau.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Để gỡ một wrapper đã lưu bền, xóa `OPENCLAW_WRAPPER` trong khi cài đặt lại:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Tùy chọn lệnh">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`

  </Accordion>
  <Accordion title="Hành vi vòng đời">
    - Dùng `gateway restart` để khởi động lại một dịch vụ được quản lý. Không nối chuỗi `gateway stop` và `gateway start` như một cách thay thế restart; trên macOS, `gateway stop` cố ý vô hiệu hóa LaunchAgent trước khi dừng nó.
    - Các lệnh vòng đời chấp nhận `--json` cho scripting.

  </Accordion>
  <Accordion title="Xác thực và SecretRefs tại thời điểm cài đặt">
    - Khi xác thực token yêu cầu token và `gateway.auth.token` được quản lý bằng SecretRef, `gateway install` xác thực rằng SecretRef có thể phân giải nhưng không lưu bền token đã phân giải vào metadata môi trường dịch vụ.
    - Nếu xác thực token yêu cầu token và SecretRef token đã cấu hình chưa phân giải, cài đặt sẽ thất bại đóng thay vì lưu bền plaintext dự phòng.
    - Với xác thực mật khẩu trên `gateway run`, ưu tiên `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` hoặc `gateway.auth.password` được SecretRef hỗ trợ thay vì `--password` inline.
    - Trong chế độ xác thực suy luận, `OPENCLAW_GATEWAY_PASSWORD` chỉ trong shell không nới lỏng yêu cầu token khi cài đặt; hãy dùng cấu hình bền vững (`gateway.auth.password` hoặc cấu hình `env`) khi cài đặt một dịch vụ được quản lý.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa đặt, cài đặt sẽ bị chặn cho đến khi mode được đặt rõ ràng.

  </Accordion>
</AccordionGroup>

## Khám phá gateway (Bonjour)

`gateway discover` quét beacon Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): chọn một miền (ví dụ: `openclaw.internal.`) và thiết lập split DNS + máy chủ DNS; xem [Bonjour](/vi/gateway/bonjour).

Chỉ các gateway đã bật discovery Bonjour (mặc định) mới quảng bá beacon.

Bản ghi discovery diện rộng bao gồm (TXT):

- `role` (gợi ý vai trò gateway)
- `transport` (gợi ý transport, ví dụ `gateway`)
- `gatewayPort` (port WebSocket, thường là `18789`)
- `sshPort` (tùy chọn; client mặc định mục tiêu SSH là `22` khi không có)
- `tailnetDns` (tên host MagicDNS, khi có)
- `gatewayTls` / `gatewayTlsSha256` (TLS đã bật + dấu vân tay chứng chỉ)
- `cliPath` (gợi ý cài đặt từ xa được ghi vào zone diện rộng)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Thời gian chờ theo từng lệnh (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Đầu ra cho máy đọc (cũng tắt styling/spinner).
</ParamField>

Ví dụ:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI quét `local.` cùng với miền mạng diện rộng đã cấu hình khi miền đó được bật.
- `wsUrl` trong đầu ra JSON được suy ra từ điểm cuối dịch vụ đã phân giải, không phải từ các gợi ý chỉ có trong TXT như `lanHost` hoặc `tailnetDns`.
- Trên mDNS `local.`, `sshPort` và `cliPath` chỉ được phát quảng bá khi `discovery.mdns.mode` là `full`. DNS-SD mạng diện rộng vẫn ghi `cliPath`; `sshPort` cũng vẫn là tùy chọn ở đó.

</Note>

## Liên quan

- [Tài liệu tham chiếu CLI](/vi/cli)
- [Sổ tay vận hành Gateway](/vi/gateway)
