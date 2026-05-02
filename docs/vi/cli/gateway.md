---
read_when:
    - Chạy Gateway từ CLI (môi trường phát triển hoặc máy chủ)
    - Gỡ lỗi xác thực Gateway, các chế độ liên kết và kết nối
    - Khám phá Gateway qua Bonjour (cục bộ + DNS-SD diện rộng)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — chạy, truy vấn và phát hiện các Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-02T22:17:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7f948a8f0ee6e065afa02f354e690ad5cc4f71bdb8b8674f1b0396c439ab242
    source_path: cli/gateway.md
    workflow: 16
---

Gateway là máy chủ WebSocket của OpenClaw (kênh, nút, phiên, hook). Các lệnh con trên trang này nằm dưới `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Khám phá Bonjour" href="/vi/gateway/bonjour">
    Thiết lập mDNS cục bộ + DNS-SD diện rộng.
  </Card>
  <Card title="Tổng quan khám phá" href="/vi/gateway/discovery">
    Cách OpenClaw quảng bá và tìm Gateway.
  </Card>
  <Card title="Cấu hình" href="/vi/gateway/configuration">
    Các khóa cấu hình gateway cấp cao nhất.
  </Card>
</CardGroup>

## Chạy Gateway

Chạy một tiến trình Gateway cục bộ:

```bash
openclaw gateway
```

Bí danh chạy tiền cảnh:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Hành vi khởi động">
    - Theo mặc định, Gateway từ chối khởi động trừ khi `gateway.mode=local` được đặt trong `~/.openclaw/openclaw.json`. Dùng `--allow-unconfigured` cho các lần chạy ad-hoc/dev.
    - `openclaw onboard --mode local` và `openclaw setup` được kỳ vọng sẽ ghi `gateway.mode=local`. Nếu tệp tồn tại nhưng thiếu `gateway.mode`, hãy xem đó là cấu hình bị hỏng hoặc bị ghi đè và sửa nó thay vì ngầm giả định chế độ cục bộ.
    - Nếu tệp tồn tại và thiếu `gateway.mode`, Gateway xem đó là hư hại cấu hình đáng ngờ và từ chối "đoán local" thay bạn.
    - Việc bind ra ngoài loopback mà không có xác thực sẽ bị chặn (lan can an toàn).
    - `SIGUSR1` kích hoạt khởi động lại trong tiến trình khi được cho phép (`commands.restart` được bật theo mặc định; đặt `commands.restart: false` để chặn khởi động lại thủ công, trong khi công cụ/cấu hình gateway áp dụng/cập nhật vẫn được cho phép).
    - Trình xử lý `SIGINT`/`SIGTERM` dừng tiến trình gateway, nhưng không khôi phục bất kỳ trạng thái terminal tùy chỉnh nào. Nếu bạn bọc CLI bằng TUI hoặc đầu vào raw-mode, hãy khôi phục terminal trước khi thoát.

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
  Đọc mật khẩu gateway từ một tệp.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Công khai Gateway qua Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Đặt lại cấu hình Tailscale serve/funnel khi tắt.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Cho phép khởi động gateway khi không có `gateway.mode=local` trong cấu hình. Chỉ bỏ qua cơ chế bảo vệ khởi động cho bootstrap ad-hoc/dev; không ghi hoặc sửa tệp cấu hình.
</ParamField>
<ParamField path="--dev" type="boolean">
  Tạo cấu hình dev + workspace nếu còn thiếu (bỏ qua BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Đặt lại cấu hình dev + thông tin xác thực + phiên + workspace (yêu cầu `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Dừng mọi listener hiện có trên cổng đã chọn trước khi khởi động.
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
  Ghi sự kiện luồng mô hình thô vào jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Đường dẫn jsonl của luồng thô.
</ParamField>

<Warning>
`--password` nội tuyến có thể bị lộ trong danh sách tiến trình cục bộ. Nên dùng `--password-file`, env, hoặc `gateway.auth.password` được hỗ trợ bởi SecretRef.
</Warning>

### Profiling khởi động

- Đặt `OPENCLAW_GATEWAY_STARTUP_TRACE=1` để ghi thời gian từng pha trong quá trình khởi động Gateway, bao gồm độ trễ `eventLoopMax` theo từng pha và thời gian bảng tra cứu Plugin cho installed-index, manifest registry, lập kế hoạch khởi động và công việc owner-map.
- Đặt `OPENCLAW_DIAGNOSTICS=timeline` cùng `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` để ghi một timeline chẩn đoán khởi động JSONL theo best-effort cho các bộ kiểm thử QA bên ngoài. Bạn cũng có thể bật cờ bằng `diagnostics.flags: ["timeline"]` trong cấu hình; đường dẫn vẫn được cung cấp qua env. Thêm `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` để bao gồm các mẫu event-loop.
- Chạy `pnpm test:startup:gateway -- --runs 5 --warmup 1` để benchmark khởi động Gateway. Benchmark ghi lại đầu ra tiến trình đầu tiên, `/healthz`, `/readyz`, thời gian trace khởi động, độ trễ event-loop và chi tiết thời gian bảng tra cứu Plugin.

## Truy vấn một Gateway đang chạy

Tất cả lệnh truy vấn đều dùng WebSocket RPC.

<Tabs>
  <Tab title="Chế độ đầu ra">
    - Mặc định: dễ đọc cho người dùng (có màu trong TTY).
    - `--json`: JSON để máy đọc (không styling/spinner).
    - `--no-color` (hoặc `NO_COLOR=1`): tắt ANSI trong khi vẫn giữ bố cục cho người đọc.

  </Tab>
  <Tab title="Tùy chọn dùng chung">
    - `--url <url>`: URL WebSocket của Gateway.
    - `--token <token>`: token Gateway.
    - `--password <password>`: mật khẩu Gateway.
    - `--timeout <ms>`: timeout/ngân sách thời gian (khác nhau theo lệnh).
    - `--expect-final`: chờ phản hồi "final" (lệnh gọi agent).

  </Tab>
</Tabs>

<Note>
Khi bạn đặt `--url`, CLI không fallback về thông tin xác thực trong cấu hình hoặc môi trường. Truyền `--token` hoặc `--password` một cách tường minh. Thiếu thông tin xác thực tường minh là lỗi.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Endpoint HTTP `/healthz` là probe liveness: nó trả về khi máy chủ có thể trả lời HTTP. Endpoint HTTP `/readyz` nghiêm ngặt hơn và vẫn ở trạng thái đỏ khi sidecar Plugin khởi động, kênh hoặc hook đã cấu hình vẫn đang ổn định. Phản hồi readiness chi tiết cục bộ hoặc đã xác thực bao gồm khối chẩn đoán `eventLoop` với độ trễ event-loop, mức sử dụng event-loop, tỷ lệ lõi CPU và cờ `degraded`.

### `gateway usage-cost`

Lấy tóm tắt usage-cost từ nhật ký phiên.

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
  Chỉ bao gồm sự kiện sau một số thứ tự chẩn đoán.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Đọc một gói ổn định đã lưu thay vì gọi Gateway đang chạy. Dùng `--bundle latest` (hoặc chỉ `--bundle`) cho gói mới nhất trong thư mục trạng thái, hoặc truyền trực tiếp đường dẫn JSON của gói.
</ParamField>
<ParamField path="--export" type="boolean">
  Ghi một tệp zip chẩn đoán hỗ trợ có thể chia sẻ thay vì in chi tiết ổn định.
</ParamField>
<ParamField path="--output <path>" type="string">
  Đường dẫn đầu ra cho `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Quyền riêng tư và hành vi gói">
    - Bản ghi giữ siêu dữ liệu vận hành: tên sự kiện, số đếm, kích thước byte, số đọc bộ nhớ, trạng thái hàng đợi/phiên, tên kênh/Plugin và tóm tắt phiên đã biên tập. Chúng không giữ văn bản chat, nội dung webhook, đầu ra công cụ, nội dung yêu cầu hoặc phản hồi thô, token, cookie, giá trị bí mật, hostname hoặc id phiên thô. Đặt `diagnostics.enabled: false` để tắt hoàn toàn bộ ghi.
    - Khi Gateway thoát do lỗi nghiêm trọng, timeout khi tắt và lỗi khởi động sau khi restart, OpenClaw ghi cùng snapshot chẩn đoán vào `~/.openclaw/logs/stability/openclaw-stability-*.json` khi bộ ghi có sự kiện. Kiểm tra gói mới nhất bằng `openclaw gateway stability --bundle latest`; `--limit`, `--type` và `--since-seq` cũng áp dụng cho đầu ra gói.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Ghi một tệp zip chẩn đoán cục bộ được thiết kế để đính kèm vào báo cáo lỗi. Để biết mô hình quyền riêng tư và nội dung gói, xem [Xuất chẩn đoán](/vi/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Đường dẫn zip đầu ra. Mặc định là bản xuất hỗ trợ trong thư mục trạng thái.
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
  Bỏ qua tra cứu gói ổn định đã lưu.
</ParamField>
<ParamField path="--json" type="boolean">
  In đường dẫn đã ghi, kích thước và manifest dưới dạng JSON.
</ParamField>

Bản xuất chứa một manifest, bản tóm tắt Markdown, hình dạng cấu hình, chi tiết cấu hình đã làm sạch, tóm tắt nhật ký đã làm sạch, snapshot trạng thái/health Gateway đã làm sạch và gói ổn định mới nhất nếu có.

Nó được thiết kế để chia sẻ. Nó giữ các chi tiết vận hành giúp gỡ lỗi, chẳng hạn như các trường nhật ký OpenClaw an toàn, tên hệ thống con, mã trạng thái, thời lượng, chế độ đã cấu hình, cổng, id Plugin, id provider, thiết lập tính năng không bí mật và thông điệp nhật ký vận hành đã biên tập. Nó bỏ qua hoặc biên tập văn bản chat, nội dung webhook, đầu ra công cụ, thông tin xác thực, cookie, mã định danh tài khoản/tin nhắn, văn bản prompt/hướng dẫn, hostname và giá trị bí mật. Khi một thông điệp kiểu LogTape trông giống văn bản payload người dùng/chat/công cụ, bản xuất chỉ giữ việc một thông điệp đã bị bỏ qua cùng số byte của nó.

### `gateway status`

`gateway status` hiển thị dịch vụ Gateway (launchd/systemd/schtasks) cộng với một probe tùy chọn về khả năng kết nối/xác thực.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Thêm một mục tiêu probe tường minh. Remote đã cấu hình + localhost vẫn được probe.
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
  Bỏ qua probe kết nối (chế độ xem chỉ dịch vụ).
</ParamField>
<ParamField path="--deep" type="boolean">
  Quét cả các dịch vụ cấp hệ thống.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Nâng cấp probe kết nối mặc định thành probe đọc và thoát khác không khi probe đọc đó thất bại. Không thể kết hợp với `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Ngữ nghĩa trạng thái">
    - `gateway status` vẫn khả dụng cho chẩn đoán ngay cả khi cấu hình CLI cục bộ bị thiếu hoặc không hợp lệ.
    - Theo mặc định, `gateway status` xác minh trạng thái dịch vụ, kết nối WebSocket và khả năng xác thực hiển thị tại thời điểm handshake. Nó không xác minh các thao tác đọc/ghi/quản trị.
    - Các phép dò chẩn đoán không gây thay đổi đối với xác thực thiết bị lần đầu: chúng tái sử dụng token thiết bị đã được lưu trong bộ nhớ đệm nếu có, nhưng không tạo danh tính thiết bị CLI mới hoặc bản ghi ghép đôi thiết bị chỉ đọc mới chỉ để kiểm tra trạng thái.
    - `gateway status` phân giải các SecretRef xác thực đã cấu hình cho xác thực phép dò khi có thể.
    - Nếu SecretRef xác thực bắt buộc không được phân giải trong luồng lệnh này, `gateway status --json` báo cáo `rpc.authWarning` khi kết nối/xác thực của phép dò thất bại; hãy truyền rõ ràng `--token`/`--password` hoặc phân giải nguồn bí mật trước.
    - Nếu phép dò thành công, cảnh báo tham chiếu xác thực chưa phân giải sẽ bị ẩn để tránh cảnh báo sai.
    - Dùng `--require-rpc` trong script và tự động hóa khi chỉ có dịch vụ đang lắng nghe là chưa đủ và bạn cũng cần các lệnh gọi RPC phạm vi đọc ở trạng thái khỏe mạnh.
    - `--deep` thêm một lần quét best-effort để tìm các bản cài đặt launchd/systemd/schtasks bổ sung. Khi phát hiện nhiều dịch vụ giống Gateway, đầu ra dành cho người đọc in gợi ý dọn dẹp và cảnh báo rằng hầu hết thiết lập chỉ nên chạy một Gateway trên mỗi máy.
    - Đầu ra dành cho người đọc bao gồm đường dẫn log tệp đã phân giải cùng ảnh chụp nhanh đường dẫn/tính hợp lệ của cấu hình CLI so với dịch vụ để giúp chẩn đoán drift profile hoặc state-dir.

  </Accordion>
  <Accordion title="Kiểm tra drift xác thực Linux systemd">
    - Trên các bản cài đặt Linux systemd, kiểm tra drift xác thực dịch vụ đọc cả giá trị `Environment=` và `EnvironmentFile=` từ unit (bao gồm `%h`, đường dẫn được trích dẫn, nhiều tệp và các tệp `-` tùy chọn).
    - Kiểm tra drift phân giải SecretRef `gateway.auth.token` bằng môi trường runtime đã hợp nhất (môi trường lệnh dịch vụ trước, rồi fallback về môi trường tiến trình).
    - Nếu xác thực bằng token không thực sự hoạt động (`gateway.auth.mode` được đặt rõ là `password`/`none`/`trusted-proxy`, hoặc mode chưa đặt trong đó password có thể được chọn và không ứng viên token nào có thể được chọn), kiểm tra drift token sẽ bỏ qua phân giải token cấu hình.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` là lệnh "gỡ lỗi mọi thứ". Nó luôn dò:

- Gateway từ xa đã cấu hình của bạn (nếu có), và
- localhost (loopback) **ngay cả khi remote đã được cấu hình**.

Nếu bạn truyền `--url`, đích rõ ràng đó được thêm trước cả hai. Đầu ra dành cho người đọc gắn nhãn các đích là:

- `URL (explicit)`
- `Remote (configured)` hoặc `Remote (configured, inactive)`
- `Local loopback`

<Note>
Nếu có thể truy cập nhiều Gateway, lệnh sẽ in tất cả. Nhiều Gateway được hỗ trợ khi bạn dùng các hồ sơ/cổng tách biệt (ví dụ: một bot cứu hộ), nhưng hầu hết bản cài đặt vẫn chạy một Gateway duy nhất.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Diễn giải">
    - `Reachable: yes` nghĩa là ít nhất một đích đã chấp nhận kết nối WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` báo cáo điều mà phép dò có thể xác minh về xác thực. Nó tách biệt với khả năng truy cập.
    - `Read probe: ok` nghĩa là các lệnh gọi RPC chi tiết thuộc phạm vi đọc (`health`/`status`/`system-presence`/`config.get`) cũng thành công.
    - `Read probe: limited - missing scope: operator.read` nghĩa là kết nối thành công nhưng RPC phạm vi đọc bị giới hạn. Điều này được báo cáo là khả năng truy cập **suy giảm**, không phải thất bại hoàn toàn.
    - `Read probe: failed` sau `Connect: ok` nghĩa là Gateway đã chấp nhận kết nối WebSocket, nhưng chẩn đoán đọc tiếp theo đã hết thời gian chờ hoặc thất bại. Đây cũng là khả năng truy cập **suy giảm**, không phải Gateway không thể truy cập.
    - Giống `gateway status`, phép dò tái sử dụng xác thực thiết bị đã lưu trong bộ nhớ đệm nhưng không tạo danh tính thiết bị lần đầu hoặc trạng thái ghép đôi.
    - Mã thoát chỉ khác 0 khi không có đích nào được dò có thể truy cập.

  </Accordion>
  <Accordion title="Đầu ra JSON">
    Cấp trên cùng:

    - `ok`: ít nhất một đích có thể truy cập.
    - `degraded`: ít nhất một đích đã chấp nhận kết nối nhưng không hoàn tất chẩn đoán RPC chi tiết đầy đủ.
    - `capability`: khả năng tốt nhất thấy được trên các đích có thể truy cập (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, hoặc `unknown`).
    - `primaryTargetId`: đích tốt nhất để xem là đích thắng đang hoạt động theo thứ tự này: URL rõ ràng, đường hầm SSH, remote đã cấu hình, rồi local loopback.
    - `warnings[]`: bản ghi cảnh báo best-effort với `code`, `message` và `targetIds` tùy chọn.
    - `network`: gợi ý URL local loopback/tailnet được suy ra từ cấu hình hiện tại và mạng của host.
    - `discovery.timeoutMs` và `discovery.count`: ngân sách khám phá/số lượng kết quả thực tế được dùng cho lượt dò này.

    Theo từng đích (`targets[].connect`):

    - `ok`: khả năng truy cập sau kết nối + phân loại suy giảm.
    - `rpcOk`: RPC chi tiết đầy đủ thành công.
    - `scopeLimited`: RPC chi tiết thất bại do thiếu phạm vi operator.

    Theo từng đích (`targets[].auth`):

    - `role`: vai trò xác thực được báo cáo trong `hello-ok` khi có.
    - `scopes`: các phạm vi được cấp được báo cáo trong `hello-ok` khi có.
    - `capability`: phân loại khả năng xác thực được hiển thị cho đích đó.

  </Accordion>
  <Accordion title="Mã cảnh báo thường gặp">
    - `ssh_tunnel_failed`: thiết lập đường hầm SSH thất bại; lệnh đã fallback về các phép dò trực tiếp.
    - `multiple_gateways`: có thể truy cập nhiều hơn một đích; điều này bất thường trừ khi bạn cố ý chạy các hồ sơ tách biệt, chẳng hạn như bot cứu hộ.
    - `auth_secretref_unresolved`: không thể phân giải SecretRef xác thực đã cấu hình cho một đích thất bại.
    - `probe_scope_limited`: kết nối WebSocket thành công, nhưng phép dò đọc bị giới hạn do thiếu `operator.read`.

  </Accordion>
</AccordionGroup>

#### Từ xa qua SSH (tương đương với ứng dụng Mac)

Chế độ "Từ xa qua SSH" của ứng dụng macOS dùng một chuyển tiếp cổng cục bộ để Gateway từ xa (có thể chỉ lắng nghe trên loopback) có thể truy cập tại `ws://127.0.0.1:<port>`.

Tương đương trên CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` hoặc `user@host:port` (cổng mặc định là `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Tệp định danh.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Chọn host Gateway đầu tiên được phát hiện làm đích SSH từ endpoint khám phá đã phân giải (`local.` cộng với miền diện rộng đã cấu hình, nếu có). Các gợi ý chỉ có TXT bị bỏ qua.
</ParamField>

Cấu hình (tùy chọn, dùng làm mặc định):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Trợ giúp RPC cấp thấp.

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
  Token của Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  Mật khẩu Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  Ngân sách thời gian chờ.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Chủ yếu dành cho các RPC kiểu tác tử truyền phát các sự kiện trung gian trước phần dữ liệu cuối cùng.
</ParamField>
<ParamField path="--json" type="boolean">
  Đầu ra JSON máy có thể đọc.
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

### Cài đặt với trình bao bọc

Dùng `--wrapper` khi dịch vụ được quản lý phải khởi động thông qua một tệp thực thi khác, ví dụ một
shim của trình quản lý bí mật hoặc trợ giúp chạy với tư cách khác. Trình bao bọc nhận các đối số Gateway bình thường và
chịu trách nhiệm cuối cùng gọi exec `openclaw` hoặc Node với các đối số đó.

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

Bạn cũng có thể đặt trình bao bọc thông qua môi trường. `gateway install` xác thực rằng đường dẫn là
một tệp thực thi, ghi trình bao bọc vào `ProgramArguments` của dịch vụ và lưu bền vững
`OPENCLAW_WRAPPER` trong môi trường dịch vụ cho các lần cài đặt lại bắt buộc, cập nhật và sửa chữa bằng doctor sau này.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Để xóa trình bao bọc đã lưu bền vững, hãy xóa `OPENCLAW_WRAPPER` trong khi cài đặt lại:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Tùy chọn lệnh">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="Hành vi vòng đời">
    - Dùng `gateway restart` để khởi động lại dịch vụ được quản lý. Không nối chuỗi `gateway stop` và `gateway start` để thay thế cho restart; trên macOS, `gateway stop` cố ý vô hiệu hóa LaunchAgent trước khi dừng nó.
    - `gateway restart --wait 30s` ghi đè ngân sách drain khởi động lại đã cấu hình cho lần khởi động lại đó. Số không kèm đơn vị là mili giây; các đơn vị như `s`, `m` và `h` được chấp nhận. `--wait 0` chờ vô thời hạn.
    - `gateway restart --force` bỏ qua drain công việc đang hoạt động và khởi động lại ngay lập tức. Dùng tùy chọn này khi một operator đã kiểm tra các tác vụ chặn được liệt kê và muốn đưa Gateway trở lại ngay.
    - Các lệnh vòng đời chấp nhận `--json` để viết script.

  </Accordion>
  <Accordion title="Xác thực và SecretRef tại thời điểm cài đặt">
    - Khi xác thực bằng token yêu cầu token và `gateway.auth.token` do SecretRef quản lý, `gateway install` xác thực rằng SecretRef có thể phân giải nhưng không lưu bền vững token đã phân giải vào siêu dữ liệu môi trường dịch vụ.
    - Nếu xác thực bằng token yêu cầu token và SecretRef token đã cấu hình không được phân giải, quá trình cài đặt sẽ thất bại theo hướng an toàn thay vì lưu bền vững plaintext fallback.
    - Với xác thực bằng mật khẩu trên `gateway run`, hãy ưu tiên `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` hoặc `gateway.auth.password` dựa trên SecretRef thay vì `--password` trực tiếp trên dòng lệnh.
    - Trong chế độ xác thực suy luận, `OPENCLAW_GATEWAY_PASSWORD` chỉ đặt trong shell không nới lỏng yêu cầu token khi cài đặt; hãy dùng cấu hình bền vững (`gateway.auth.password` hoặc cấu hình `env`) khi cài đặt dịch vụ được quản lý.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, quá trình cài đặt bị chặn cho đến khi mode được đặt rõ ràng.

  </Accordion>
</AccordionGroup>

## Khám phá các Gateway (Bonjour)

`gateway discover` quét tìm tín hiệu quảng bá Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Bonjour diện rộng): chọn một miền (ví dụ: `openclaw.internal.`) và thiết lập split DNS + máy chủ DNS; xem [Bonjour](/vi/gateway/bonjour).

Chỉ các Gateway bật khám phá Bonjour (mặc định) mới quảng bá tín hiệu này.

Các bản ghi khám phá diện rộng bao gồm (TXT):

- `role` (gợi ý vai trò Gateway)
- `transport` (gợi ý phương thức vận chuyển, ví dụ `gateway`)
- `gatewayPort` (cổng WebSocket, thường là `18789`)
- `sshPort` (tùy chọn; client mặc định đích SSH là `22` khi không có)
- `tailnetDns` (hostname MagicDNS, khi có)
- `gatewayTls` / `gatewayTlsSha256` (TLS đã bật + dấu vân tay chứng chỉ)
- `cliPath` (gợi ý cài đặt từ xa được ghi vào zone diện rộng)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Thời gian chờ cho mỗi lệnh (duyệt/phân giải).
</ParamField>
<ParamField path="--json" type="boolean">
  Đầu ra máy có thể đọc được (cũng tắt định kiểu/chỉ báo xoay).
</ParamField>

Ví dụ:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI quét `local.` cùng với miền diện rộng đã cấu hình khi miền đó được bật.
- `wsUrl` trong đầu ra JSON được suy ra từ điểm cuối dịch vụ đã phân giải, không phải từ các gợi ý chỉ TXT như `lanHost` hoặc `tailnetDns`.
- Trên mDNS `local.`, `sshPort` và `cliPath` chỉ được quảng bá khi `discovery.mdns.mode` là `full`. DNS-SD diện rộng vẫn ghi `cliPath`; `sshPort` cũng vẫn là tùy chọn ở đó.

</Note>

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Runbook Gateway](/vi/gateway)
