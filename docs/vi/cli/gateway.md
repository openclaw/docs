---
read_when:
    - Chạy Gateway từ CLI (phát triển hoặc máy chủ)
    - Gỡ lỗi xác thực Gateway, chế độ liên kết và khả năng kết nối
    - Khám phá Gateway qua Bonjour (DNS-SD cục bộ + diện rộng)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — chạy, truy vấn và phát hiện các Gateway
title: Gateway
x-i18n:
    generated_at: "2026-06-27T17:18:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de9aaeff1b592e867ffadf49a076e6e0f7069b966244b19d4eed91993c3ad738
    source_path: cli/gateway.md
    workflow: 16
---

Gateway là máy chủ WebSocket của OpenClaw (kênh, nút, phiên, hook). Các lệnh con trong trang này nằm dưới `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Khám phá Bonjour" href="/vi/gateway/bonjour">
    Thiết lập mDNS cục bộ + DNS-SD diện rộng.
  </Card>
  <Card title="Tổng quan về khám phá" href="/vi/gateway/discovery">
    Cách OpenClaw quảng bá và tìm các gateway.
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

Bí danh chạy foreground:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Hành vi khởi động">
    - Theo mặc định, Gateway từ chối khởi động trừ khi `gateway.mode=local` được đặt trong `~/.openclaw/openclaw.json`. Dùng `--allow-unconfigured` cho các lần chạy ad-hoc/dev.
    - `openclaw onboard --mode local` và `openclaw setup` được kỳ vọng sẽ ghi `gateway.mode=local`. Nếu tệp tồn tại nhưng thiếu `gateway.mode`, hãy xem đó là cấu hình bị hỏng hoặc bị ghi đè và sửa nó thay vì ngầm giả định chế độ local.
    - Nếu tệp tồn tại và thiếu `gateway.mode`, Gateway xem đó là hư hỏng cấu hình đáng ngờ và từ chối "đoán local" cho bạn.
    - Việc bind ra ngoài loopback mà không có xác thực bị chặn (rào chắn an toàn).
    - `lan`, `tailnet` và `custom` hiện phân giải qua các đường dẫn BYOH chỉ IPv4.
    - BYOH chỉ IPv6 hiện chưa được hỗ trợ nguyên bản trên đường dẫn này. Dùng một sidecar hoặc proxy IPv4 nếu chính host chỉ có IPv6.
    - `SIGUSR1` kích hoạt khởi động lại trong tiến trình khi được cho phép (`commands.restart` được bật theo mặc định; đặt `commands.restart: false` để chặn khởi động lại thủ công, trong khi công cụ gateway/config apply/update vẫn được cho phép).
    - Trình xử lý `SIGINT`/`SIGTERM` dừng tiến trình gateway, nhưng chúng không khôi phục bất kỳ trạng thái terminal tùy chỉnh nào. Nếu bạn bọc CLI bằng TUI hoặc đầu vào raw-mode, hãy khôi phục terminal trước khi thoát.

  </Accordion>
</AccordionGroup>

### Tùy chọn

<ParamField path="--port <port>" type="number">
  Cổng WebSocket (mặc định đến từ config/env; thường là `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Chế độ bind listener. `lan`, `tailnet` và `custom` hiện phân giải qua các đường dẫn chỉ IPv4.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Ghi đè chế độ xác thực.
</ParamField>
<ParamField path="--token <token>" type="string">
  Ghi đè token (đồng thời đặt `OPENCLAW_GATEWAY_TOKEN` cho tiến trình).
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
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  Hiện kỳ vọng một địa chỉ IPv4. Với BYOH chỉ IPv6, hãy đặt một sidecar hoặc proxy IPv4 phía trước Gateway và trỏ OpenClaw tới endpoint IPv4 đó.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Cho phép gateway khởi động khi config không có `gateway.mode=local`. Chỉ bỏ qua guard khởi động cho bootstrap ad-hoc/dev; không ghi hoặc sửa tệp cấu hình.
</ParamField>
<ParamField path="--dev" type="boolean">
  Tạo config dev + workspace nếu thiếu (bỏ qua BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Đặt lại config dev + thông tin xác thực + phiên + workspace (yêu cầu `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Kill mọi listener hiện có trên cổng đã chọn trước khi khởi động.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Log chi tiết.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Chỉ hiển thị log backend CLI trong console (và bật stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Kiểu log WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Bí danh cho `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Ghi log các sự kiện luồng mô hình thô vào jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Đường dẫn jsonl của luồng thô.
</ParamField>

## Khởi động lại Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` yêu cầu Gateway đang chạy preflight công việc OpenClaw đang hoạt động trước khi khởi động lại. Nếu có thao tác trong hàng đợi, chuyển phát phản hồi, lượt chạy nhúng hoặc lượt chạy tác vụ đang hoạt động, Gateway báo cáo các blocker, gộp các yêu cầu khởi động lại an toàn trùng lặp và khởi động lại sau khi công việc đang hoạt động đã rút hết. `restart` thông thường giữ hành vi service-manager hiện có để tương thích. Chỉ dùng `--force` khi bạn rõ ràng muốn đường dẫn ghi đè tức thì.

`openclaw gateway restart --safe --skip-deferral` chạy cùng quy trình khởi động lại phối hợp có nhận thức OpenClaw như `--safe`, nhưng bỏ qua cổng trì hoãn do công việc đang hoạt động để Gateway phát lệnh khởi động lại ngay cả khi có blocker được báo cáo. Dùng nó như lối thoát cho operator khi một trì hoãn bị ghim bởi một lượt chạy tác vụ bị kẹt và chỉ dùng `--safe` sẽ chờ vô thời hạn. `--skip-deferral` yêu cầu `--safe`.

<Warning>
`--password` inline có thể bị lộ trong danh sách tiến trình cục bộ. Ưu tiên `--password-file`, env, hoặc `gateway.auth.password` dựa trên SecretRef.
</Warning>

### Profiling Gateway

- Đặt `OPENCLAW_GATEWAY_STARTUP_TRACE=1` để ghi log thời gian từng pha trong quá trình khởi động Gateway, bao gồm độ trễ `eventLoopMax` theo từng pha và thời gian bảng tra cứu Plugin cho installed-index, manifest registry, lập kế hoạch khởi động và công việc owner-map.
- Đặt `OPENCLAW_GATEWAY_RESTART_TRACE=1` để ghi log các dòng `restart trace:` theo phạm vi khởi động lại cho xử lý tín hiệu khởi động lại, rút công việc đang hoạt động, các pha tắt, lần khởi động kế tiếp, thời điểm sẵn sàng và chỉ số bộ nhớ.
- Đặt `OPENCLAW_DIAGNOSTICS=timeline` với `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` để ghi một timeline chẩn đoán khởi động JSONL theo best-effort cho các harness QA bên ngoài. Bạn cũng có thể bật cờ bằng `diagnostics.flags: ["timeline"]` trong config; đường dẫn vẫn được cung cấp qua env. Thêm `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` để bao gồm mẫu event-loop.
- Chạy `pnpm build` trước, sau đó `pnpm test:startup:gateway -- --runs 5 --warmup 1` để benchmark khởi động Gateway với entry CLI đã build. Benchmark ghi lại output tiến trình đầu tiên, `/healthz`, `/readyz`, thời gian startup trace, độ trễ event-loop và chi tiết thời gian bảng tra cứu Plugin.
- Chạy `pnpm build` trước, sau đó `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` để benchmark khởi động lại Gateway trong tiến trình với entry CLI đã build trên macOS hoặc Linux. Benchmark khởi động lại dùng SIGUSR1, bật cả startup trace và restart trace trong tiến trình con, rồi ghi lại `/healthz` kế tiếp, `/readyz` kế tiếp, thời gian gián đoạn, thời điểm sẵn sàng, CPU, RSS và chỉ số restart trace.
- Xem `/healthz` là liveness và `/readyz` là readiness có thể sử dụng. Các dòng trace và output benchmark dùng để quy kết cho chủ sở hữu; đừng xem một span trace hoặc một mẫu là kết luận hiệu năng hoàn chỉnh.

## Truy vấn Gateway đang chạy

Tất cả lệnh truy vấn dùng WebSocket RPC.

<Tabs>
  <Tab title="Chế độ output">
    - Mặc định: dễ đọc cho con người (có màu trong TTY).
    - `--json`: JSON đọc được bằng máy (không styling/spinner).
    - `--no-color` (hoặc `NO_COLOR=1`): tắt ANSI trong khi vẫn giữ bố cục cho con người.

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
Khi bạn đặt `--url`, CLI không fallback về thông tin xác thực trong config hoặc environment. Truyền rõ ràng `--token` hoặc `--password`. Thiếu thông tin xác thực rõ ràng là lỗi.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

Endpoint HTTP `/healthz` là probe liveness: nó trả về khi máy chủ có thể trả lời HTTP. Endpoint HTTP `/readyz` nghiêm ngặt hơn và vẫn đỏ trong khi startup Plugin sidecar, kênh hoặc hook đã cấu hình vẫn đang ổn định. Phản hồi readiness chi tiết cục bộ hoặc đã xác thực bao gồm khối chẩn đoán `eventLoop` với độ trễ event-loop, mức sử dụng event-loop, tỷ lệ lõi CPU và cờ `degraded`.

<ParamField path="--port <port>" type="number">
  Nhắm tới một Gateway local loopback trên cổng này. Điều này ghi đè `OPENCLAW_GATEWAY_URL` và `OPENCLAW_GATEWAY_PORT` cho lệnh gọi health.
</ParamField>

### `gateway usage-cost`

Lấy tóm tắt chi phí sử dụng từ log phiên.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Số ngày cần bao gồm.
</ParamField>
<ParamField path="--agent <id>" type="string">
  Giới hạn tóm tắt chi phí vào một id agent đã cấu hình.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Tổng hợp tóm tắt chi phí trên tất cả agent đã cấu hình. Không thể kết hợp với `--agent`.
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
  Lọc theo loại sự kiện chẩn đoán, chẳng hạn `payload.large` hoặc `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Chỉ bao gồm các sự kiện sau một số thứ tự chẩn đoán.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Đọc một stability bundle đã lưu thay vì gọi Gateway đang chạy. Dùng `--bundle latest` (hoặc chỉ `--bundle`) cho bundle mới nhất trong thư mục trạng thái, hoặc truyền trực tiếp đường dẫn JSON của bundle.
</ParamField>
<ParamField path="--export" type="boolean">
  Ghi một zip chẩn đoán hỗ trợ có thể chia sẻ thay vì in chi tiết stability.
</ParamField>
<ParamField path="--output <path>" type="string">
  Đường dẫn output cho `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Quyền riêng tư và hành vi bundle">
    - Bản ghi giữ siêu dữ liệu vận hành: tên sự kiện, số lượng, kích thước byte, số đo bộ nhớ, trạng thái hàng đợi/phiên, tên kênh/Plugin và tóm tắt phiên đã biên tập. Chúng không giữ nội dung chat, thân webhook, output công cụ, thân request hoặc response thô, token, cookie, giá trị bí mật, hostname hoặc id phiên thô. Đặt `diagnostics.enabled: false` để tắt hoàn toàn bộ ghi.
    - Khi Gateway thoát nghiêm trọng, timeout tắt và lỗi khởi động lại, OpenClaw ghi cùng snapshot chẩn đoán vào `~/.openclaw/logs/stability/openclaw-stability-*.json` khi bộ ghi có sự kiện. Kiểm tra bundle mới nhất bằng `openclaw gateway stability --bundle latest`; `--limit`, `--type` và `--since-seq` cũng áp dụng cho output bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Ghi một zip chẩn đoán cục bộ được thiết kế để đính kèm vào báo cáo lỗi. Về mô hình quyền riêng tư và nội dung bundle, xem [Xuất chẩn đoán](/vi/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Đường dẫn zip đầu ra. Mặc định là bản xuất hỗ trợ trong thư mục trạng thái.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Số dòng nhật ký đã khử nhạy cảm tối đa cần đưa vào.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Số byte nhật ký tối đa cần kiểm tra.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket của Gateway cho ảnh chụp nhanh tình trạng.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token Gateway cho ảnh chụp nhanh tình trạng.
</ParamField>
<ParamField path="--password <password>" type="string">
  Mật khẩu Gateway cho ảnh chụp nhanh tình trạng.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Thời gian chờ ảnh chụp nhanh trạng thái/tình trạng.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Bỏ qua tra cứu gói ổn định đã lưu.
</ParamField>
<ParamField path="--json" type="boolean">
  In đường dẫn đã ghi, kích thước và manifest dưới dạng JSON.
</ParamField>

Bản xuất chứa manifest, bản tóm tắt Markdown, hình dạng cấu hình, chi tiết cấu hình đã khử nhạy cảm, tóm tắt nhật ký đã khử nhạy cảm, ảnh chụp nhanh trạng thái/tình trạng Gateway đã khử nhạy cảm, và gói ổn định mới nhất khi có.

Nó được thiết kế để chia sẻ. Nó giữ lại các chi tiết vận hành hỗ trợ gỡ lỗi, chẳng hạn như các trường nhật ký OpenClaw an toàn, tên hệ thống con, mã trạng thái, thời lượng, chế độ đã cấu hình, cổng, id Plugin, id nhà cung cấp, cài đặt tính năng không bí mật, và thông điệp nhật ký vận hành đã biên tập. Nó bỏ qua hoặc biên tập văn bản trò chuyện, nội dung webhook, đầu ra công cụ, thông tin xác thực, cookie, mã định danh tài khoản/tin nhắn, văn bản prompt/chỉ dẫn, tên máy chủ, và giá trị bí mật. Khi một thông điệp kiểu LogTape trông giống văn bản tải trọng người dùng/trò chuyện/công cụ, bản xuất chỉ giữ lại thông tin rằng một thông điệp đã bị bỏ qua cùng số byte của nó.

### `gateway status`

`gateway status` hiển thị dịch vụ Gateway (launchd/systemd/schtasks) cùng với phép thăm dò tùy chọn về khả năng kết nối/xác thực.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Thêm một mục tiêu thăm dò rõ ràng. Remote đã cấu hình + localhost vẫn được thăm dò.
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
  Bỏ qua phép thăm dò kết nối (chỉ xem dịch vụ).
</ParamField>
<ParamField path="--deep" type="boolean">
  Quét cả các dịch vụ cấp hệ thống.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Nâng cấp phép thăm dò kết nối mặc định thành phép thăm dò đọc và thoát khác 0 khi phép thăm dò đọc đó thất bại. Không thể kết hợp với `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Status semantics">
    - `gateway status` vẫn khả dụng để chẩn đoán ngay cả khi cấu hình CLI cục bộ bị thiếu hoặc không hợp lệ.
    - `gateway status` mặc định chứng minh trạng thái dịch vụ, kết nối WebSocket, và khả năng xác thực hiển thị tại thời điểm bắt tay. Nó không chứng minh các thao tác đọc/ghi/quản trị.
    - Các phép thăm dò chẩn đoán không thay đổi xác thực thiết bị lần đầu: chúng tái sử dụng token thiết bị đã lưu trong bộ nhớ đệm khi có, nhưng không tạo danh tính thiết bị CLI mới hoặc bản ghi ghép đôi thiết bị chỉ đọc mới chỉ để kiểm tra trạng thái.
    - `gateway status` phân giải các SecretRef xác thực đã cấu hình cho xác thực thăm dò khi có thể.
    - Nếu một SecretRef xác thực bắt buộc chưa được phân giải trong đường dẫn lệnh này, `gateway status --json` báo cáo `rpc.authWarning` khi kết nối/xác thực thăm dò thất bại; truyền rõ ràng `--token`/`--password` hoặc phân giải nguồn bí mật trước.
    - Nếu phép thăm dò thành công, cảnh báo auth-ref chưa phân giải sẽ bị ẩn để tránh dương tính giả.
    - Khi thăm dò được bật, đầu ra JSON bao gồm `gateway.version` khi Gateway đang chạy báo cáo nó; `--require-rpc` có thể dự phòng sang tải trọng RPC `status.runtimeVersion` nếu phép thăm dò bắt tay tiếp theo không thể cung cấp siêu dữ liệu phiên bản.
    - Dùng `--require-rpc` trong script và tự động hóa khi chỉ có dịch vụ đang lắng nghe là chưa đủ và bạn cũng cần các lệnh gọi RPC phạm vi đọc hoạt động khỏe mạnh.
    - `--deep` thêm phép quét nỗ lực tối đa để tìm các bản cài launchd/systemd/schtasks bổ sung. Khi phát hiện nhiều dịch vụ giống gateway, đầu ra cho người đọc in gợi ý dọn dẹp và cảnh báo rằng hầu hết thiết lập chỉ nên chạy một gateway trên mỗi máy.
    - `--deep` cũng báo cáo một lần chuyển giao khởi động lại Gateway supervisor gần đây khi tiến trình dịch vụ đã thoát sạch để một supervisor bên ngoài khởi động lại.
    - `--deep` chạy xác thực cấu hình ở chế độ nhận biết Plugin (`pluginValidation: "full"`) và hiển thị các cảnh báo manifest Plugin đã cấu hình (ví dụ thiếu siêu dữ liệu cấu hình kênh) để các kiểm tra smoke cài đặt và cập nhật bắt được chúng. `gateway status` mặc định giữ đường dẫn chỉ đọc nhanh bỏ qua xác thực Plugin.
    - Đầu ra cho người đọc bao gồm đường dẫn nhật ký tệp đã phân giải cùng ảnh chụp nhanh đường dẫn/tính hợp lệ cấu hình CLI-so-với-dịch vụ để giúp chẩn đoán lệch profile hoặc state-dir.

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - Trên các bản cài Linux systemd, kiểm tra lệch xác thực dịch vụ đọc cả giá trị `Environment=` và `EnvironmentFile=` từ unit (bao gồm `%h`, đường dẫn có dấu nháy, nhiều tệp, và tệp tùy chọn `-`).
    - Kiểm tra lệch phân giải SecretRef `gateway.auth.token` bằng env runtime đã hợp nhất (env lệnh dịch vụ trước, sau đó dự phòng env tiến trình).
    - Nếu xác thực token thực tế không hoạt động (`gateway.auth.mode` rõ ràng là `password`/`none`/`trusted-proxy`, hoặc mode chưa đặt nơi mật khẩu có thể thắng và không có ứng viên token nào có thể thắng), kiểm tra lệch token sẽ bỏ qua phân giải token cấu hình.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` là lệnh "gỡ lỗi mọi thứ". Nó luôn thăm dò:

- gateway từ xa đã cấu hình của bạn (nếu đã đặt), và
- localhost (loopback) **ngay cả khi remote đã được cấu hình**.

Nếu bạn truyền `--url`, mục tiêu rõ ràng đó được thêm vào trước cả hai. Đầu ra cho người đọc gắn nhãn các mục tiêu là:

- `URL (explicit)`
- `Remote (configured)` hoặc `Remote (configured, inactive)`
- `Local loopback`

<Note>
Nếu nhiều mục tiêu thăm dò có thể truy cập được, nó in tất cả. Một đường hầm SSH, URL TLS/proxy, và URL remote đã cấu hình đều có thể trỏ đến cùng một gateway ngay cả khi các cổng transport của chúng khác nhau; `multiple_gateways` được dành cho các gateway có thể truy cập nhưng khác biệt hoặc mơ hồ về danh tính. Nhiều gateway được hỗ trợ khi bạn dùng các profile cô lập (ví dụ bot cứu hộ), nhưng hầu hết bản cài vẫn chạy một gateway duy nhất.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Dùng cổng này cho mục tiêu thăm dò local loopback và cổng remote của đường hầm SSH. Khi không có `--url`, tùy chọn này chọn mục tiêu local loopback thay vì URL môi trường gateway đã cấu hình, cổng môi trường, hoặc các mục tiêu remote.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` nghĩa là ít nhất một mục tiêu đã chấp nhận kết nối WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` báo cáo điều phép thăm dò có thể chứng minh về xác thực. Nó tách biệt với khả năng truy cập.
    - `Read probe: ok` nghĩa là các lệnh gọi RPC chi tiết phạm vi đọc (`health`/`status`/`system-presence`/`config.get`) cũng đã thành công.
    - `Read probe: limited - missing scope: operator.read` nghĩa là kết nối đã thành công nhưng RPC phạm vi đọc bị giới hạn. Điều này được báo cáo là khả năng truy cập **suy giảm**, không phải thất bại hoàn toàn.
    - `Read probe: failed` sau `Connect: ok` nghĩa là Gateway đã chấp nhận kết nối WebSocket, nhưng chẩn đoán đọc tiếp theo hết thời gian chờ hoặc thất bại. Đây cũng là khả năng truy cập **suy giảm**, không phải Gateway không thể truy cập.
    - Giống `gateway status`, probe tái sử dụng xác thực thiết bị đã lưu trong bộ nhớ đệm nhưng không tạo danh tính thiết bị lần đầu hoặc trạng thái ghép đôi.
    - Mã thoát chỉ khác 0 khi không có mục tiêu nào được thăm dò có thể truy cập.

  </Accordion>
  <Accordion title="JSON output">
    Cấp cao nhất:

    - `ok`: ít nhất một mục tiêu có thể truy cập.
    - `degraded`: ít nhất một mục tiêu đã chấp nhận kết nối nhưng không hoàn tất đầy đủ chẩn đoán RPC chi tiết.
    - `capability`: khả năng tốt nhất đã thấy trên các mục tiêu có thể truy cập (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, hoặc `unknown`).
    - `primaryTargetId`: mục tiêu tốt nhất để xem là bên thắng đang hoạt động theo thứ tự này: URL rõ ràng, đường hầm SSH, remote đã cấu hình, rồi local loopback.
    - `warnings[]`: bản ghi cảnh báo nỗ lực tối đa với `code`, `message`, và `targetIds` tùy chọn.
    - `network`: gợi ý URL local loopback/tailnet được suy ra từ cấu hình hiện tại và mạng của máy chủ.
    - `discovery.timeoutMs` và `discovery.count`: ngân sách/kết quả khám phá thực tế được dùng cho lượt thăm dò này.

    Theo từng mục tiêu (`targets[].connect`):

    - `ok`: khả năng truy cập sau kết nối + phân loại suy giảm.
    - `rpcOk`: RPC chi tiết đầy đủ thành công.
    - `scopeLimited`: RPC chi tiết thất bại do thiếu phạm vi operator.

    Theo từng mục tiêu (`targets[].auth`):

    - `role`: vai trò xác thực được báo cáo trong `hello-ok` khi có.
    - `scopes`: các phạm vi đã cấp được báo cáo trong `hello-ok` khi có.
    - `capability`: phân loại khả năng xác thực được hiển thị cho mục tiêu đó.

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`: thiết lập đường hầm SSH thất bại; lệnh đã dự phòng sang thăm dò trực tiếp.
    - `multiple_gateways`: các danh tính gateway khác nhau có thể truy cập, hoặc OpenClaw không thể chứng minh các mục tiêu có thể truy cập là cùng một gateway. Đường hầm SSH, URL proxy, hoặc URL remote đã cấu hình tới cùng một gateway không kích hoạt cảnh báo này.
    - `auth_secretref_unresolved`: SecretRef xác thực đã cấu hình không thể được phân giải cho một mục tiêu thất bại.
    - `probe_scope_limited`: kết nối WebSocket thành công, nhưng phép thăm dò đọc bị giới hạn do thiếu `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remote qua SSH (tương đương ứng dụng Mac)

Chế độ "Remote over SSH" của ứng dụng macOS dùng chuyển tiếp cổng cục bộ để gateway từ xa (có thể chỉ bind vào loopback) có thể truy cập tại `ws://127.0.0.1:<port>`.

Tương đương trong CLI:

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
  Chọn máy chủ gateway đầu tiên được phát hiện làm mục tiêu SSH từ endpoint khám phá đã phân giải (`local.` cộng với miền diện rộng đã cấu hình, nếu có). Gợi ý chỉ-TXT bị bỏ qua.
</ParamField>

Cấu hình (tùy chọn, được dùng làm mặc định):

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
  Chủ yếu dành cho RPC kiểu agent truyền trực tuyến các sự kiện trung gian trước tải trọng cuối cùng.
</ParamField>
<ParamField path="--json" type="boolean">
  Đầu ra JSON có thể đọc bằng máy.
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

### Cài đặt bằng wrapper

Dùng `--wrapper` khi dịch vụ được quản lý phải khởi động thông qua một tệp thực thi khác, ví dụ một
shim quản lý bí mật hoặc một trình trợ giúp chạy dưới quyền người dùng khác. Wrapper nhận các đối số Gateway bình thường và
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

Bạn cũng có thể đặt wrapper thông qua môi trường. `gateway install` xác thực rằng đường dẫn là
một tệp thực thi được, ghi wrapper vào `ProgramArguments` của dịch vụ, và lưu bền vững
`OPENCLAW_WRAPPER` trong môi trường dịch vụ cho các lần cài đặt lại bắt buộc, cập nhật, và sửa chữa bằng doctor
sau này.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Để gỡ một wrapper đã được lưu bền vững, hãy xóa `OPENCLAW_WRAPPER` khi cài đặt lại:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Command options">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - Dùng `gateway restart` để khởi động lại một dịch vụ được quản lý. Không nối chuỗi `gateway stop` và `gateway start` để thay thế thao tác khởi động lại.
    - Trên macOS, theo mặc định `gateway stop` dùng `launchctl bootout`, thao tác này gỡ LaunchAgent khỏi phiên khởi động hiện tại mà không lưu bền vững trạng thái vô hiệu hóa — tính năng tự phục hồi KeepAlive vẫn hoạt động cho các lần sập trong tương lai và `gateway start` bật lại sạch sẽ mà không cần chạy thủ công `launchctl enable`. Truyền `--disable` để chặn KeepAlive và RunAtLoad một cách bền vững, để Gateway không tự khởi động lại cho đến lần `gateway start` rõ ràng tiếp theo; dùng tùy chọn này khi một lần dừng thủ công cần tồn tại qua các lần khởi động lại hoặc khởi động lại hệ thống.
    - `gateway restart --safe` yêu cầu Gateway đang chạy kiểm tra trước công việc OpenClaw đang hoạt động và hoãn khởi động lại cho đến khi việc gửi phản hồi, các lượt chạy nhúng, và các lượt chạy tác vụ được xả hết. Không thể kết hợp `--safe` với `--force` hoặc `--wait`.
    - `gateway restart --wait 30s` ghi đè ngân sách xả chờ khởi động lại đã cấu hình cho lần khởi động lại đó. Số không kèm đơn vị là mili giây; các đơn vị như `s`, `m`, và `h` được chấp nhận. `--wait 0` chờ vô thời hạn.
    - `gateway restart --safe --skip-deferral` chạy thao tác khởi động lại an toàn có nhận biết OpenClaw nhưng bỏ qua cổng hoãn, để Gateway phát ra lệnh khởi động lại ngay cả khi có báo cáo yếu tố chặn. Đây là lối thoát cho người vận hành khi hoãn do lượt chạy tác vụ bị kẹt; yêu cầu `--safe`.
    - `gateway restart --force` bỏ qua bước xả công việc đang hoạt động và khởi động lại ngay lập tức. Dùng tùy chọn này khi người vận hành đã kiểm tra các tác vụ chặn được liệt kê và muốn đưa Gateway trở lại ngay.
    - Các lệnh vòng đời chấp nhận `--json` cho mục đích viết script.

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - Khi xác thực bằng token yêu cầu token và `gateway.auth.token` được quản lý bằng SecretRef, `gateway install` xác thực rằng SecretRef có thể phân giải được nhưng không lưu bền vững token đã phân giải vào metadata môi trường dịch vụ.
    - Nếu xác thực bằng token yêu cầu token và SecretRef token đã cấu hình không phân giải được, quá trình cài đặt thất bại theo hướng đóng an toàn thay vì lưu bền vững plaintext dự phòng.
    - Với xác thực bằng mật khẩu trên `gateway run`, ưu tiên `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, hoặc `gateway.auth.password` được hỗ trợ bởi SecretRef thay vì `--password` nội tuyến.
    - Trong chế độ xác thực suy luận, `OPENCLAW_GATEWAY_PASSWORD` chỉ có trong shell không nới lỏng yêu cầu token khi cài đặt; hãy dùng cấu hình bền vững (`gateway.auth.password` hoặc `env` trong cấu hình) khi cài đặt một dịch vụ được quản lý.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, quá trình cài đặt bị chặn cho đến khi mode được đặt rõ ràng.

  </Accordion>
</AccordionGroup>

## Khám phá gateway (Bonjour)

`gateway discover` quét các beacon Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): chọn một miền (ví dụ: `openclaw.internal.`) và thiết lập split DNS + một máy chủ DNS; xem [Bonjour](/vi/gateway/bonjour).

Chỉ các gateway đã bật khám phá Bonjour (mặc định) mới quảng bá beacon.

Các bản ghi khám phá diện rộng có thể bao gồm những gợi ý TXT này:

- `role` (gợi ý vai trò gateway)
- `transport` (gợi ý transport, ví dụ `gateway`)
- `gatewayPort` (cổng WebSocket, thường là `18789`)
- `sshPort` (chỉ ở chế độ khám phá đầy đủ; client mặc định mục tiêu SSH là `22` khi không có giá trị này)
- `tailnetDns` (tên máy chủ MagicDNS, khi có)
- `gatewayTls` / `gatewayTlsSha256` (đã bật TLS + dấu vân tay chứng chỉ)
- `cliPath` (chỉ ở chế độ khám phá đầy đủ)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Thời gian chờ cho mỗi lệnh (duyệt/phân giải).
</ParamField>
<ParamField path="--json" type="boolean">
  Đầu ra máy có thể đọc được (đồng thời tắt styling/spinner).
</ParamField>

Ví dụ:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI quét `local.` cộng với miền diện rộng đã cấu hình khi có miền được bật.
- `wsUrl` trong đầu ra JSON được suy ra từ endpoint dịch vụ đã phân giải, không phải từ các gợi ý chỉ có trong TXT như `lanHost` hoặc `tailnetDns`.
- Trên mDNS `local.` và DNS-SD diện rộng, `sshPort` và `cliPath` chỉ được xuất bản khi `discovery.mdns.mode` là `full`.

</Note>

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Runbook Gateway](/vi/gateway)
