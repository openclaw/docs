---
read_when:
    - Chạy Gateway từ CLI (môi trường phát triển hoặc máy chủ)
    - Gỡ lỗi xác thực Gateway, chế độ ràng buộc và khả năng kết nối
    - Khám phá các Gateway qua Bonjour (DNS-SD cục bộ + diện rộng)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — chạy, truy vấn và khám phá các Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-05T01:44:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 521558189b150b2faa22f95ec32419ac9e02c5f47c72b9095f40d1432840c038
    source_path: cli/gateway.md
    workflow: 16
---

Gateway là máy chủ WebSocket của OpenClaw (kênh, nút, phiên, hook). Các lệnh con trong trang này nằm dưới `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Khám phá Bonjour" href="/vi/gateway/bonjour">
    Thiết lập mDNS cục bộ + DNS-SD diện rộng.
  </Card>
  <Card title="Tổng quan về khám phá" href="/vi/gateway/discovery">
    Cách OpenClaw quảng bá và tìm gateway.
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

Bí danh chạy ở foreground:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Hành vi khởi động">
    - Theo mặc định, Gateway từ chối khởi động trừ khi `gateway.mode=local` được đặt trong `~/.openclaw/openclaw.json`. Dùng `--allow-unconfigured` cho các lần chạy ad-hoc/dev.
    - `openclaw onboard --mode local` và `openclaw setup` được kỳ vọng sẽ ghi `gateway.mode=local`. Nếu tệp tồn tại nhưng thiếu `gateway.mode`, hãy coi đó là cấu hình bị hỏng hoặc bị ghi đè và sửa nó thay vì ngầm giả định chế độ cục bộ.
    - Nếu tệp tồn tại và thiếu `gateway.mode`, Gateway coi đó là hư hỏng cấu hình đáng ngờ và từ chối "đoán local" thay bạn.
    - Việc bind vượt ra ngoài loopback mà không có xác thực sẽ bị chặn (rào chắn an toàn).
    - `SIGUSR1` kích hoạt khởi động lại trong tiến trình khi được cho phép (`commands.restart` được bật theo mặc định; đặt `commands.restart: false` để chặn khởi động lại thủ công, trong khi công cụ/cấu hình gateway apply/update vẫn được phép).
    - Các handler `SIGINT`/`SIGTERM` dừng tiến trình gateway, nhưng không khôi phục bất kỳ trạng thái terminal tùy chỉnh nào. Nếu bạn bọc CLI bằng TUI hoặc đầu vào raw-mode, hãy khôi phục terminal trước khi thoát.

  </Accordion>
</AccordionGroup>

### Tùy chọn

<ParamField path="--port <port>" type="number">
  Cổng WebSocket (mặc định đến từ cấu hình/env; thường là `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Chế độ bind của listener.
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
  Cho phép gateway khởi động mà không có `gateway.mode=local` trong cấu hình. Chỉ bỏ qua guard khởi động cho bootstrap ad-hoc/dev; không ghi hoặc sửa tệp cấu hình.
</ParamField>
<ParamField path="--dev" type="boolean">
  Tạo cấu hình dev + workspace nếu thiếu (bỏ qua BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Đặt lại cấu hình dev + thông tin xác thực + phiên + workspace (yêu cầu `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Kill mọi listener hiện có trên cổng đã chọn trước khi khởi động.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Nhật ký chi tiết.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Chỉ hiển thị nhật ký backend CLI trong console (và bật stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Kiểu nhật ký Websocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Bí danh cho `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Ghi nhật ký các sự kiện luồng mô hình thô vào jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Đường dẫn jsonl của luồng thô.
</ParamField>

## Khởi động lại Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` yêu cầu Gateway đang chạy preflight công việc OpenClaw đang hoạt động trước khi khởi động lại. Nếu các thao tác trong hàng đợi, phân phối phản hồi, lượt chạy nhúng, hoặc lượt chạy tác vụ đang hoạt động, Gateway báo cáo các blocker, gộp các yêu cầu khởi động lại an toàn bị trùng lặp, và khởi động lại sau khi công việc đang hoạt động được rút hết. `restart` thông thường giữ hành vi service-manager hiện có để tương thích. Chỉ dùng `--force` khi bạn rõ ràng muốn đường dẫn ghi đè ngay lập tức.

<Warning>
`--password` inline có thể bị lộ trong danh sách tiến trình cục bộ. Ưu tiên `--password-file`, env, hoặc `gateway.auth.password` được hỗ trợ bởi SecretRef.
</Warning>

### Profiling khởi động

- Đặt `OPENCLAW_GATEWAY_STARTUP_TRACE=1` để ghi nhật ký thời gian từng pha trong khi Gateway khởi động, bao gồm độ trễ `eventLoopMax` theo từng pha và thời gian bảng tra cứu plugin cho installed-index, manifest registry, startup planning, và owner-map.
- Đặt `OPENCLAW_DIAGNOSTICS=timeline` cùng `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` để ghi timeline chẩn đoán khởi động JSONL theo best-effort cho các bộ kiểm thử QA bên ngoài. Bạn cũng có thể bật cờ bằng `diagnostics.flags: ["timeline"]` trong cấu hình; đường dẫn vẫn được cung cấp qua env. Thêm `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` để bao gồm các mẫu event-loop.
- Chạy `pnpm test:startup:gateway -- --runs 5 --warmup 1` để benchmark khởi động Gateway. Benchmark ghi lại đầu ra đầu tiên của tiến trình, `/healthz`, `/readyz`, thời gian startup trace, độ trễ event-loop, và chi tiết thời gian bảng tra cứu plugin.

## Truy vấn Gateway đang chạy

Tất cả lệnh truy vấn đều dùng WebSocket RPC.

<Tabs>
  <Tab title="Chế độ đầu ra">
    - Mặc định: dễ đọc cho người dùng (có màu trong TTY).
    - `--json`: JSON dễ đọc cho máy (không styling/spinner).
    - `--no-color` (hoặc `NO_COLOR=1`): tắt ANSI trong khi vẫn giữ bố cục cho người dùng.

  </Tab>
  <Tab title="Tùy chọn dùng chung">
    - `--url <url>`: URL WebSocket của Gateway.
    - `--token <token>`: token Gateway.
    - `--password <password>`: mật khẩu Gateway.
    - `--timeout <ms>`: timeout/ngân sách (khác nhau theo lệnh).
    - `--expect-final`: chờ phản hồi "final" (lệnh gọi agent).

  </Tab>
</Tabs>

<Note>
Khi bạn đặt `--url`, CLI không fallback về thông tin xác thực trong cấu hình hoặc môi trường. Truyền rõ ràng `--token` hoặc `--password`. Thiếu thông tin xác thực rõ ràng là lỗi.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Endpoint HTTP `/healthz` là probe liveness: nó trả về khi máy chủ có thể trả lời HTTP. Endpoint HTTP `/readyz` nghiêm ngặt hơn và vẫn đỏ trong khi startup plugin sidecar, kênh, hoặc hook đã cấu hình vẫn đang ổn định. Phản hồi readiness chi tiết cục bộ hoặc đã xác thực bao gồm khối chẩn đoán `eventLoop` với độ trễ event-loop, mức sử dụng event-loop, tỷ lệ lõi CPU, và cờ `degraded`.

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

Lấy trình ghi ổn định chẩn đoán gần đây từ Gateway đang chạy.

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
  Đọc bundle ổn định đã lưu thay vì gọi Gateway đang chạy. Dùng `--bundle latest` (hoặc chỉ `--bundle`) cho bundle mới nhất trong thư mục trạng thái, hoặc truyền trực tiếp đường dẫn JSON của bundle.
</ParamField>
<ParamField path="--export" type="boolean">
  Ghi một zip chẩn đoán hỗ trợ có thể chia sẻ thay vì in chi tiết ổn định.
</ParamField>
<ParamField path="--output <path>" type="string">
  Đường dẫn đầu ra cho `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Quyền riêng tư và hành vi bundle">
    - Bản ghi giữ siêu dữ liệu vận hành: tên sự kiện, số lượng, kích thước byte, số đo bộ nhớ, trạng thái hàng đợi/phiên, tên kênh/plugin, và tóm tắt phiên đã biên tập. Chúng không giữ văn bản chat, nội dung webhook, đầu ra công cụ, nội dung yêu cầu hoặc phản hồi thô, token, cookie, giá trị bí mật, hostname, hoặc id phiên thô. Đặt `diagnostics.enabled: false` để tắt hoàn toàn trình ghi.
    - Khi Gateway thoát nghiêm trọng, hết thời gian tắt, và khởi động lại thất bại khi startup, OpenClaw ghi cùng ảnh chụp chẩn đoán vào `~/.openclaw/logs/stability/openclaw-stability-*.json` khi trình ghi có sự kiện. Kiểm tra bundle mới nhất bằng `openclaw gateway stability --bundle latest`; `--limit`, `--type`, và `--since-seq` cũng áp dụng cho đầu ra bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Ghi một zip chẩn đoán cục bộ được thiết kế để đính kèm vào báo cáo lỗi. Để biết mô hình quyền riêng tư và nội dung bundle, xem [Xuất chẩn đoán](/vi/gateway/diagnostics).

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
  URL WebSocket của Gateway cho ảnh chụp health.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token Gateway cho ảnh chụp health.
</ParamField>
<ParamField path="--password <password>" type="string">
  Mật khẩu Gateway cho ảnh chụp health.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Timeout cho ảnh chụp trạng thái/health.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Bỏ qua tra cứu bundle ổn định đã lưu.
</ParamField>
<ParamField path="--json" type="boolean">
  In đường dẫn đã ghi, kích thước, và manifest dưới dạng JSON.
</ParamField>

Bản xuất chứa một manifest, tóm tắt Markdown, hình dạng cấu hình, chi tiết cấu hình đã làm sạch, tóm tắt nhật ký đã làm sạch, ảnh chụp trạng thái/health của Gateway đã làm sạch, và bundle ổn định mới nhất khi có.

Nó được thiết kế để chia sẻ. Nó giữ các chi tiết vận hành giúp gỡ lỗi, chẳng hạn như trường nhật ký OpenClaw an toàn, tên subsystem, mã trạng thái, thời lượng, chế độ đã cấu hình, cổng, id plugin, id provider, cài đặt tính năng không bí mật, và thông điệp nhật ký vận hành đã biên tập. Nó bỏ qua hoặc biên tập văn bản chat, nội dung webhook, đầu ra công cụ, thông tin xác thực, cookie, định danh tài khoản/tin nhắn, văn bản prompt/hướng dẫn, hostname, và giá trị bí mật. Khi một thông điệp kiểu LogTape trông giống văn bản payload người dùng/chat/công cụ, bản xuất chỉ giữ lại việc một thông điệp đã bị bỏ qua cùng số byte của nó.

### `gateway status`

`gateway status` hiển thị dịch vụ Gateway (launchd/systemd/schtasks) cộng với một probe tùy chọn về khả năng kết nối/xác thực.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Thêm một mục tiêu dò tìm rõ ràng. Remote đã cấu hình + localhost vẫn được dò tìm.
</ParamField>
<ParamField path="--token <token>" type="string">
  Xác thực bằng token cho lần dò tìm.
</ParamField>
<ParamField path="--password <password>" type="string">
  Xác thực bằng mật khẩu cho lần dò tìm.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Thời gian chờ dò tìm.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Bỏ qua dò tìm kết nối (chỉ xem dịch vụ).
</ParamField>
<ParamField path="--deep" type="boolean">
  Quét cả các dịch vụ cấp hệ thống.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Nâng cấp lần dò tìm kết nối mặc định thành dò tìm đọc và thoát với mã khác 0 khi lần dò tìm đọc đó thất bại. Không thể kết hợp với `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Status semantics">
    - `gateway status` vẫn khả dụng để chẩn đoán ngay cả khi cấu hình CLI cục bộ bị thiếu hoặc không hợp lệ.
    - `gateway status` mặc định xác minh trạng thái dịch vụ, kết nối WebSocket và khả năng xác thực nhìn thấy được tại thời điểm bắt tay. Nó không xác minh các thao tác đọc/ghi/quản trị.
    - Các lần dò tìm chẩn đoán không gây thay đổi đối với xác thực thiết bị lần đầu: chúng dùng lại token thiết bị đã lưu trong bộ nhớ đệm hiện có khi có, nhưng không tạo danh tính thiết bị CLI mới hoặc bản ghi ghép đôi thiết bị chỉ đọc chỉ để kiểm tra trạng thái.
    - `gateway status` phân giải các SecretRefs xác thực đã cấu hình cho xác thực dò tìm khi có thể.
    - Nếu SecretRef xác thực bắt buộc chưa được phân giải trong đường dẫn lệnh này, `gateway status --json` báo cáo `rpc.authWarning` khi kết nối/xác thực dò tìm thất bại; truyền rõ `--token`/`--password` hoặc phân giải nguồn secret trước.
    - Nếu lần dò tìm thành công, cảnh báo auth-ref chưa phân giải sẽ bị ẩn để tránh báo sai.
    - Dùng `--require-rpc` trong script và tự động hóa khi chỉ có dịch vụ đang lắng nghe là chưa đủ và bạn cũng cần các lệnh gọi RPC phạm vi đọc hoạt động tốt.
    - `--deep` thêm một lần quét nỗ lực tối đa cho các bản cài đặt launchd/systemd/schtasks bổ sung. Khi phát hiện nhiều dịch vụ giống Gateway, đầu ra cho người dùng in gợi ý dọn dẹp và cảnh báo rằng hầu hết thiết lập nên chạy một Gateway trên mỗi máy.
    - Đầu ra cho người dùng bao gồm đường dẫn log tệp đã phân giải cộng với ảnh chụp nhanh đường dẫn/tính hợp lệ cấu hình CLI so với dịch vụ để giúp chẩn đoán sai lệch profile hoặc thư mục trạng thái.

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - Trên các bản cài đặt Linux systemd, kiểm tra sai lệch xác thực dịch vụ đọc cả giá trị `Environment=` và `EnvironmentFile=` từ unit (bao gồm `%h`, đường dẫn có dấu ngoặc kép, nhiều tệp và các tệp tùy chọn có tiền tố `-`).
    - Kiểm tra sai lệch phân giải SecretRefs `gateway.auth.token` bằng env runtime đã hợp nhất (env lệnh dịch vụ trước, sau đó dự phòng bằng env tiến trình).
    - Nếu xác thực token thực tế không hoạt động (`gateway.auth.mode` rõ ràng là `password`/`none`/`trusted-proxy`, hoặc mode chưa đặt trong đó mật khẩu có thể thắng và không ứng viên token nào có thể thắng), kiểm tra sai lệch token bỏ qua phân giải token cấu hình.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` là lệnh "gỡ lỗi mọi thứ". Nó luôn dò tìm:

- Gateway remote đã cấu hình của bạn (nếu đã đặt), và
- localhost (loopback) **ngay cả khi remote đã được cấu hình**.

Nếu bạn truyền `--url`, mục tiêu rõ ràng đó được thêm vào trước cả hai. Đầu ra cho người dùng gắn nhãn các mục tiêu là:

- `URL (explicit)`
- `Remote (configured)` hoặc `Remote (configured, inactive)`
- `Local loopback`

<Note>
Nếu nhiều Gateway có thể truy cập được, lệnh sẽ in tất cả. Nhiều Gateway được hỗ trợ khi bạn dùng profile/cổng tách biệt (ví dụ: bot cứu hộ), nhưng hầu hết bản cài đặt vẫn chạy một Gateway duy nhất.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` nghĩa là ít nhất một mục tiêu đã chấp nhận kết nối WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` báo cáo những gì lần dò tìm có thể xác minh về xác thực. Nó tách biệt với khả năng truy cập.
    - `Read probe: ok` nghĩa là các lệnh gọi RPC chi tiết phạm vi đọc (`health`/`status`/`system-presence`/`config.get`) cũng thành công.
    - `Read probe: limited - missing scope: operator.read` nghĩa là kết nối thành công nhưng RPC phạm vi đọc bị giới hạn. Trạng thái này được báo cáo là khả năng truy cập **suy giảm**, không phải thất bại hoàn toàn.
    - `Read probe: failed` sau `Connect: ok` nghĩa là Gateway đã chấp nhận kết nối WebSocket, nhưng chẩn đoán đọc tiếp theo đã hết thời gian chờ hoặc thất bại. Đây cũng là khả năng truy cập **suy giảm**, không phải Gateway không thể truy cập.
    - Giống `gateway status`, probe dùng lại xác thực thiết bị đã lưu trong bộ nhớ đệm hiện có nhưng không tạo danh tính thiết bị lần đầu hoặc trạng thái ghép đôi.
    - Mã thoát khác 0 chỉ khi không có mục tiêu được dò tìm nào có thể truy cập.

  </Accordion>
  <Accordion title="JSON output">
    Cấp cao nhất:

    - `ok`: ít nhất một mục tiêu có thể truy cập.
    - `degraded`: ít nhất một mục tiêu đã chấp nhận kết nối nhưng không hoàn tất chẩn đoán RPC chi tiết đầy đủ.
    - `capability`: khả năng tốt nhất nhìn thấy trên các mục tiêu có thể truy cập (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, hoặc `unknown`).
    - `primaryTargetId`: mục tiêu tốt nhất để coi là mục tiêu thắng đang hoạt động theo thứ tự này: URL rõ ràng, đường hầm SSH, remote đã cấu hình, rồi local loopback.
    - `warnings[]`: bản ghi cảnh báo nỗ lực tối đa với `code`, `message` và `targetIds` tùy chọn.
    - `network`: gợi ý URL local loopback/tailnet bắt nguồn từ cấu hình hiện tại và mạng của host.
    - `discovery.timeoutMs` và `discovery.count`: ngân sách/kết quả đếm khám phá thực tế được dùng cho lượt dò tìm này.

    Theo từng mục tiêu (`targets[].connect`):

    - `ok`: khả năng truy cập sau kết nối + phân loại suy giảm.
    - `rpcOk`: RPC chi tiết đầy đủ thành công.
    - `scopeLimited`: RPC chi tiết thất bại do thiếu phạm vi operator.

    Theo từng mục tiêu (`targets[].auth`):

    - `role`: vai trò xác thực được báo cáo trong `hello-ok` khi có.
    - `scopes`: các phạm vi được cấp được báo cáo trong `hello-ok` khi có.
    - `capability`: phân loại khả năng xác thực được hiển thị cho mục tiêu đó.

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`: thiết lập đường hầm SSH thất bại; lệnh đã chuyển về dò tìm trực tiếp.
    - `multiple_gateways`: có thể truy cập nhiều hơn một mục tiêu; điều này không bình thường trừ khi bạn cố ý chạy các profile tách biệt, chẳng hạn như bot cứu hộ.
    - `auth_secretref_unresolved`: không thể phân giải SecretRef xác thực đã cấu hình cho một mục tiêu thất bại.
    - `probe_scope_limited`: kết nối WebSocket thành công, nhưng dò tìm đọc bị giới hạn do thiếu `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remote qua SSH (ngang bằng ứng dụng Mac)

Chế độ "Remote over SSH" của ứng dụng macOS dùng chuyển tiếp cổng cục bộ để Gateway remote (có thể chỉ được bind với loopback) có thể truy cập tại `ws://127.0.0.1:<port>`.

Tương đương trong CLI:

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
  Chọn host Gateway đầu tiên được phát hiện làm mục tiêu SSH từ endpoint khám phá đã phân giải (`local.` cộng với miền diện rộng đã cấu hình, nếu có). Các gợi ý chỉ TXT bị bỏ qua.
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
  Chủ yếu dành cho RPC kiểu agent phát luồng sự kiện trung gian trước payload cuối cùng.
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

Dùng `--wrapper` khi dịch vụ được quản lý phải khởi động thông qua một executable khác, ví dụ như shim trình quản lý secret hoặc trình trợ giúp run-as. Wrapper nhận các đối số Gateway bình thường và chịu trách nhiệm cuối cùng exec `openclaw` hoặc Node với các đối số đó.

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

Bạn cũng có thể đặt wrapper thông qua môi trường. `gateway install` xác thực rằng đường dẫn là một tệp executable, ghi wrapper vào `ProgramArguments` của dịch vụ và lưu `OPENCLAW_WRAPPER` trong môi trường dịch vụ cho các lần cài đặt lại bắt buộc, cập nhật và sửa chữa doctor sau này.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Để xóa wrapper đã lưu, hãy xóa `OPENCLAW_WRAPPER` trong khi cài đặt lại:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Command options">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - Dùng `gateway restart` để khởi động lại dịch vụ được quản lý. Đừng nối chuỗi `gateway stop` và `gateway start` để thay thế restart; trên macOS, `gateway stop` cố ý tắt LaunchAgent trước khi dừng nó.
    - `gateway restart --safe` yêu cầu Gateway đang chạy preflight công việc OpenClaw đang hoạt động và trì hoãn restart cho đến khi việc gửi trả lời, các lần chạy nhúng và các lần chạy tác vụ rút hết. `--safe` không thể kết hợp với `--force` hoặc `--wait`.
    - `gateway restart --wait 30s` ghi đè ngân sách drain restart đã cấu hình cho lần restart đó. Số không kèm đơn vị là mili giây; các đơn vị như `s`, `m` và `h` được chấp nhận. `--wait 0` chờ vô thời hạn.
    - `gateway restart --force` bỏ qua drain công việc đang hoạt động và restart ngay lập tức. Dùng tùy chọn này khi operator đã kiểm tra các bộ chặn tác vụ được liệt kê và muốn Gateway hoạt động trở lại ngay.
    - Các lệnh vòng đời chấp nhận `--json` để viết script.

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - Khi xác thực bằng token yêu cầu token và `gateway.auth.token` được quản lý bằng SecretRef, `gateway install` xác thực rằng SecretRef có thể phân giải được nhưng không lưu token đã phân giải vào siêu dữ liệu môi trường dịch vụ.
    - Nếu xác thực bằng token yêu cầu token và SecretRef token đã cấu hình chưa được phân giải, quá trình cài đặt sẽ thất bại theo hướng an toàn thay vì lưu văn bản thuần dự phòng.
    - Với xác thực bằng mật khẩu trên `gateway run`, hãy ưu tiên `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, hoặc `gateway.auth.password` dựa trên SecretRef thay vì `--password` nội tuyến.
    - Ở chế độ xác thực suy luận, `OPENCLAW_GATEWAY_PASSWORD` chỉ có trong shell không nới lỏng yêu cầu token khi cài đặt; hãy dùng cấu hình bền vững (`gateway.auth.password` hoặc `env` trong cấu hình) khi cài đặt một dịch vụ được quản lý.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, quá trình cài đặt sẽ bị chặn cho đến khi chế độ được đặt rõ ràng.

  </Accordion>
</AccordionGroup>

## Khám phá gateway (Bonjour)

`gateway discover` quét các beacon Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour diện rộng): chọn một miền (ví dụ: `openclaw.internal.`) và thiết lập DNS phân tách + một máy chủ DNS; xem [Bonjour](/vi/gateway/bonjour).

Chỉ những gateway đã bật khám phá Bonjour (mặc định) mới quảng bá beacon.

Bản ghi khám phá diện rộng bao gồm (TXT):

- `role` (gợi ý vai trò gateway)
- `transport` (gợi ý transport, ví dụ `gateway`)
- `gatewayPort` (cổng WebSocket, thường là `18789`)
- `sshPort` (tùy chọn; client mặc định mục tiêu SSH là `22` khi mục này vắng mặt)
- `tailnetDns` (tên máy chủ MagicDNS, khi có)
- `gatewayTls` / `gatewayTlsSha256` (TLS đã bật + vân tay chứng chỉ)
- `cliPath` (gợi ý cài đặt từ xa được ghi vào vùng diện rộng)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Thời gian chờ cho mỗi lệnh (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Đầu ra máy đọc được (đồng thời tắt styling/spinner).
</ParamField>

Ví dụ:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI quét `local.` cùng với miền diện rộng đã cấu hình khi có miền được bật.
- `wsUrl` trong đầu ra JSON được suy ra từ điểm cuối dịch vụ đã phân giải, không phải từ các gợi ý chỉ có trong TXT như `lanHost` hoặc `tailnetDns`.
- Trên mDNS `local.`, `sshPort` và `cliPath` chỉ được phát khi `discovery.mdns.mode` là `full`. DNS-SD diện rộng vẫn ghi `cliPath`; `sshPort` cũng vẫn là tùy chọn ở đó.

</Note>

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Runbook Gateway](/vi/gateway)
