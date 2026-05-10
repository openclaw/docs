---
read_when:
    - Chạy Gateway từ CLI (môi trường phát triển hoặc máy chủ)
    - Gỡ lỗi xác thực Gateway, các chế độ bind và khả năng kết nối
    - Phát hiện các Gateway qua Bonjour (DNS-SD cục bộ + diện rộng)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — chạy, truy vấn và khám phá các Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-10T19:28:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e436abba80f643f3b0bfc0a7d2f344beb18c3849a49e5d0825767ae7a81ae1d
    source_path: cli/gateway.md
    workflow: 16
---

Gateway là máy chủ WebSocket của OpenClaw (kênh, nút, phiên, hook). Các lệnh con trên trang này nằm dưới `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Khám phá Bonjour" href="/vi/gateway/bonjour">
    Thiết lập mDNS cục bộ + DNS-SD diện rộng.
  </Card>
  <Card title="Tổng quan về khám phá" href="/vi/gateway/discovery">
    Cách OpenClaw quảng bá và tìm Gateway.
  </Card>
  <Card title="Cấu hình" href="/vi/gateway/configuration">
    Các khóa cấu hình Gateway cấp cao nhất.
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
    - Theo mặc định, Gateway từ chối khởi động trừ khi `gateway.mode=local` được đặt trong `~/.openclaw/openclaw.json`. Dùng `--allow-unconfigured` cho các lần chạy tạm thời/phát triển.
    - `openclaw onboard --mode local` và `openclaw setup` được kỳ vọng sẽ ghi `gateway.mode=local`. Nếu tệp tồn tại nhưng thiếu `gateway.mode`, hãy xem đó là cấu hình bị hỏng hoặc bị ghi đè và sửa nó thay vì mặc nhiên giả định chế độ cục bộ.
    - Nếu tệp tồn tại và thiếu `gateway.mode`, Gateway xem đó là hư hỏng cấu hình đáng ngờ và từ chối "đoán là cục bộ" thay bạn.
    - Việc bind vượt ra ngoài loopback mà không có xác thực sẽ bị chặn (lan can an toàn).
    - `SIGUSR1` kích hoạt khởi động lại trong tiến trình khi được cho phép (`commands.restart` được bật theo mặc định; đặt `commands.restart: false` để chặn khởi động lại thủ công, trong khi công cụ/cấu hình Gateway apply/update vẫn được cho phép).
    - Bộ xử lý `SIGINT`/`SIGTERM` dừng tiến trình Gateway, nhưng chúng không khôi phục bất kỳ trạng thái terminal tùy chỉnh nào. Nếu bạn bọc CLI bằng TUI hoặc đầu vào raw-mode, hãy khôi phục terminal trước khi thoát.

  </Accordion>
</AccordionGroup>

### Tùy chọn

<ParamField path="--port <port>" type="number">
  Cổng WebSocket (mặc định lấy từ cấu hình/env; thường là `18789`).
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
  Đọc mật khẩu Gateway từ một tệp.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Phơi bày Gateway qua Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Đặt lại cấu hình Tailscale serve/funnel khi tắt.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Cho phép Gateway khởi động mà không có `gateway.mode=local` trong cấu hình. Chỉ bỏ qua chốt bảo vệ khởi động cho bootstrap tạm thời/phát triển; không ghi hoặc sửa tệp cấu hình.
</ParamField>
<ParamField path="--dev" type="boolean">
  Tạo cấu hình phát triển + workspace nếu thiếu (bỏ qua BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Đặt lại cấu hình phát triển + thông tin xác thực + phiên + workspace (yêu cầu `--dev`).
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
  Ghi các sự kiện luồng mô hình thô vào jsonl.
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

`openclaw gateway restart --safe` yêu cầu Gateway đang chạy kiểm tra trước công việc OpenClaw đang hoạt động trước khi khởi động lại. Nếu các thao tác đã xếp hàng, phân phối phản hồi, lần chạy nhúng hoặc lần chạy tác vụ đang hoạt động, Gateway báo cáo các yếu tố chặn, gộp các yêu cầu khởi động lại an toàn trùng lặp và khởi động lại sau khi công việc đang hoạt động được xử lý xong. `restart` thuần giữ hành vi service-manager hiện có để tương thích. Chỉ dùng `--force` khi bạn rõ ràng muốn đường dẫn ghi đè ngay lập tức.

`openclaw gateway restart --safe --skip-deferral` chạy cùng cơ chế khởi động lại phối hợp có nhận thức về OpenClaw như `--safe`, nhưng bỏ qua cổng trì hoãn do công việc đang hoạt động để Gateway phát lệnh khởi động lại ngay cả khi có báo cáo về yếu tố chặn. Dùng nó như lối thoát cho người vận hành khi một trì hoãn bị ghim bởi một lần chạy tác vụ bị kẹt và chỉ dùng `--safe` sẽ chờ vô thời hạn. `--skip-deferral` yêu cầu `--safe`.

<Warning>
`--password` nội tuyến có thể bị lộ trong danh sách tiến trình cục bộ. Nên dùng `--password-file`, env, hoặc `gateway.auth.password` được hỗ trợ bởi SecretRef.
</Warning>

### Lập hồ sơ khởi động

- Đặt `OPENCLAW_GATEWAY_STARTUP_TRACE=1` để ghi thời lượng các pha trong quá trình khởi động Gateway, bao gồm độ trễ `eventLoopMax` theo từng pha và thời lượng bảng tra cứu Plugin cho installed-index, manifest registry, startup planning và owner-map.
- Đặt `OPENCLAW_DIAGNOSTICS=timeline` với `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` để ghi timeline chẩn đoán khởi động JSONL theo khả năng tối đa cho các harness QA bên ngoài. Bạn cũng có thể bật cờ bằng `diagnostics.flags: ["timeline"]` trong cấu hình; đường dẫn vẫn được cung cấp qua env. Thêm `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` để bao gồm các mẫu event-loop.
- Chạy `pnpm test:startup:gateway -- --runs 5 --warmup 1` để benchmark khởi động Gateway. Benchmark ghi lại đầu ra tiến trình đầu tiên, `/healthz`, `/readyz`, thời lượng startup trace, độ trễ event-loop và chi tiết thời lượng bảng tra cứu Plugin.

## Truy vấn một Gateway đang chạy

Tất cả lệnh truy vấn đều dùng WebSocket RPC.

<Tabs>
  <Tab title="Chế độ đầu ra">
    - Mặc định: dễ đọc cho người dùng (có màu trong TTY).
    - `--json`: JSON đọc được bằng máy (không có styling/spinner).
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
Khi bạn đặt `--url`, CLI không fallback về thông tin xác thực từ cấu hình hoặc môi trường. Hãy truyền rõ ràng `--token` hoặc `--password`. Thiếu thông tin xác thực rõ ràng là lỗi.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Endpoint HTTP `/healthz` là phép dò liveness: nó trả về khi máy chủ có thể trả lời HTTP. Endpoint HTTP `/readyz` nghiêm ngặt hơn và giữ trạng thái đỏ trong khi các sidecar Plugin khởi động, kênh hoặc hook đã cấu hình vẫn đang ổn định. Phản hồi readiness chi tiết cục bộ hoặc đã xác thực bao gồm khối chẩn đoán `eventLoop` với độ trễ event-loop, mức sử dụng event-loop, tỷ lệ lõi CPU và cờ `degraded`.

### `gateway usage-cost`

Lấy bản tóm tắt usage-cost từ nhật ký phiên.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Số ngày cần bao gồm.
</ParamField>

### `gateway stability`

Lấy bộ ghi stability chẩn đoán gần đây từ một Gateway đang chạy.

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
  Chỉ bao gồm sự kiện sau một số thứ tự chẩn đoán.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Đọc một bundle stability đã lưu thay vì gọi Gateway đang chạy. Dùng `--bundle latest` (hoặc chỉ `--bundle`) cho bundle mới nhất trong thư mục trạng thái, hoặc truyền trực tiếp đường dẫn JSON bundle.
</ParamField>
<ParamField path="--export" type="boolean">
  Ghi một tệp zip chẩn đoán hỗ trợ có thể chia sẻ thay vì in chi tiết stability.
</ParamField>
<ParamField path="--output <path>" type="string">
  Đường dẫn đầu ra cho `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Quyền riêng tư và hành vi bundle">
    - Bản ghi giữ siêu dữ liệu vận hành: tên sự kiện, số lượng, kích thước byte, chỉ số bộ nhớ, trạng thái hàng đợi/phiên, tên kênh/Plugin và tóm tắt phiên đã biên tập. Chúng không giữ văn bản trò chuyện, body Webhook, đầu ra công cụ, body yêu cầu hoặc phản hồi thô, token, cookie, giá trị bí mật, hostname hoặc id phiên thô. Đặt `diagnostics.enabled: false` để tắt hoàn toàn bộ ghi.
    - Khi Gateway thoát nghiêm trọng, timeout khi tắt và lỗi khởi động lại, OpenClaw ghi cùng snapshot chẩn đoán vào `~/.openclaw/logs/stability/openclaw-stability-*.json` khi bộ ghi có sự kiện. Kiểm tra bundle mới nhất bằng `openclaw gateway stability --bundle latest`; `--limit`, `--type` và `--since-seq` cũng áp dụng cho đầu ra bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Ghi một tệp zip chẩn đoán cục bộ được thiết kế để đính kèm vào báo cáo lỗi. Để biết mô hình quyền riêng tư và nội dung bundle, xem [Diagnostics Export](/vi/gateway/diagnostics).

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
  Timeout cho snapshot trạng thái/health.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Bỏ qua tra cứu bundle stability đã lưu.
</ParamField>
<ParamField path="--json" type="boolean">
  In đường dẫn đã ghi, kích thước và manifest dưới dạng JSON.
</ParamField>

Bản xuất chứa manifest, bản tóm tắt Markdown, hình dạng cấu hình, chi tiết cấu hình đã làm sạch, tóm tắt nhật ký đã làm sạch, snapshot trạng thái/health Gateway đã làm sạch và bundle stability mới nhất khi có.

Nó được dùng để chia sẻ. Nó giữ các chi tiết vận hành giúp gỡ lỗi, chẳng hạn các trường nhật ký OpenClaw an toàn, tên subsystem, mã trạng thái, thời lượng, chế độ đã cấu hình, cổng, id Plugin, id nhà cung cấp, thiết lập tính năng không bí mật và thông báo nhật ký vận hành đã biên tập. Nó bỏ qua hoặc biên tập văn bản trò chuyện, body Webhook, đầu ra công cụ, thông tin xác thực, cookie, định danh tài khoản/tin nhắn, văn bản prompt/hướng dẫn, hostname và giá trị bí mật. Khi một thông báo kiểu LogTape trông giống văn bản payload người dùng/trò chuyện/công cụ, bản xuất chỉ giữ việc một thông báo đã bị bỏ qua cùng với số byte của nó.

### `gateway status`

`gateway status` hiển thị dịch vụ Gateway (launchd/systemd/schtasks) cùng với phép dò tùy chọn về khả năng kết nối/xác thực.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Thêm mục tiêu thăm dò rõ ràng. Remote đã cấu hình + localhost vẫn được thăm dò.
</ParamField>
<ParamField path="--token <token>" type="string">
  Xác thực bằng token cho thăm dò.
</ParamField>
<ParamField path="--password <password>" type="string">
  Xác thực bằng mật khẩu cho thăm dò.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Thời gian chờ thăm dò.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Bỏ qua thăm dò kết nối (chỉ xem dịch vụ).
</ParamField>
<ParamField path="--deep" type="boolean">
  Quét cả các dịch vụ cấp hệ thống.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Nâng cấp thăm dò kết nối mặc định thành thăm dò đọc và thoát với mã khác 0 khi thăm dò đọc đó thất bại. Không thể kết hợp với `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Ngữ nghĩa trạng thái">
    - `gateway status` vẫn khả dụng cho chẩn đoán ngay cả khi cấu hình CLI cục bộ bị thiếu hoặc không hợp lệ.
    - `gateway status` mặc định chứng minh trạng thái dịch vụ, kết nối WebSocket và khả năng xác thực hiển thị tại thời điểm bắt tay. Nó không chứng minh các thao tác đọc/ghi/quản trị.
    - Các thăm dò chẩn đoán không gây thay đổi đối với xác thực thiết bị lần đầu: chúng dùng lại token thiết bị đã lưu trong bộ nhớ đệm khi có, nhưng không tạo danh tính thiết bị CLI mới hoặc bản ghi ghép đôi thiết bị chỉ đọc chỉ để kiểm tra trạng thái.
    - `gateway status` phân giải SecretRef xác thực đã cấu hình cho xác thực thăm dò khi có thể.
    - Nếu SecretRef xác thực bắt buộc chưa được phân giải trong đường dẫn lệnh này, `gateway status --json` báo cáo `rpc.authWarning` khi kết nối/xác thực thăm dò thất bại; truyền rõ `--token`/`--password` hoặc phân giải nguồn bí mật trước.
    - Nếu thăm dò thành công, cảnh báo auth-ref chưa phân giải sẽ bị ẩn để tránh cảnh báo sai.
    - Dùng `--require-rpc` trong script và tự động hóa khi một dịch vụ đang lắng nghe là chưa đủ và bạn cũng cần các lệnh gọi RPC phạm vi đọc hoạt động tốt.
    - `--deep` thêm một lượt quét nỗ lực tối đa cho các bản cài đặt launchd/systemd/schtasks bổ sung. Khi phát hiện nhiều dịch vụ giống Gateway, đầu ra cho người dùng in gợi ý dọn dẹp và cảnh báo rằng hầu hết thiết lập chỉ nên chạy một Gateway trên mỗi máy.
    - `--deep` cũng báo cáo một lần bàn giao khởi động lại trình giám sát Gateway gần đây khi tiến trình dịch vụ đã thoát sạch để trình giám sát bên ngoài khởi động lại.
    - Đầu ra cho người dùng bao gồm đường dẫn tệp nhật ký đã phân giải cùng ảnh chụp đường dẫn/tính hợp lệ cấu hình CLI so với dịch vụ để giúp chẩn đoán lệch profile hoặc state-dir.

  </Accordion>
  <Accordion title="Kiểm tra lệch xác thực systemd trên Linux">
    - Trên các bản cài đặt systemd Linux, kiểm tra lệch xác thực dịch vụ đọc cả giá trị `Environment=` và `EnvironmentFile=` từ unit (bao gồm `%h`, đường dẫn có dấu nháy, nhiều tệp và tệp tùy chọn `-`).
    - Kiểm tra lệch phân giải SecretRef `gateway.auth.token` bằng env runtime đã hợp nhất (env lệnh dịch vụ trước, sau đó dự phòng về env tiến trình).
    - Nếu xác thực token thực tế không hoạt động (`gateway.auth.mode` rõ ràng là `password`/`none`/`trusted-proxy`, hoặc mode chưa đặt trong đó mật khẩu có thể thắng và không ứng viên token nào có thể thắng), kiểm tra lệch token bỏ qua phân giải token cấu hình.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` là lệnh "gỡ lỗi mọi thứ". Nó luôn thăm dò:

- Gateway remote đã cấu hình của bạn (nếu đã đặt), và
- localhost (local loopback) **ngay cả khi remote đã được cấu hình**.

Nếu bạn truyền `--url`, mục tiêu rõ ràng đó sẽ được thêm trước cả hai. Đầu ra cho người dùng gắn nhãn các mục tiêu là:

- `URL (explicit)`
- `Remote (configured)` hoặc `Remote (configured, inactive)`
- `Local loopback`

<Note>
Nếu nhiều Gateway có thể truy cập được, lệnh sẽ in tất cả. Nhiều Gateway được hỗ trợ khi bạn dùng các profile/cổng tách biệt (ví dụ: bot cứu hộ), nhưng hầu hết bản cài đặt vẫn chạy một Gateway duy nhất.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Diễn giải">
    - `Reachable: yes` nghĩa là ít nhất một mục tiêu đã chấp nhận kết nối WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` báo cáo điều thăm dò có thể chứng minh về xác thực. Nó tách biệt với khả năng truy cập.
    - `Read probe: ok` nghĩa là các lệnh gọi RPC chi tiết phạm vi đọc (`health`/`status`/`system-presence`/`config.get`) cũng thành công.
    - `Read probe: limited - missing scope: operator.read` nghĩa là kết nối thành công nhưng RPC phạm vi đọc bị giới hạn. Trạng thái này được báo cáo là khả năng truy cập **suy giảm**, không phải thất bại hoàn toàn.
    - `Read probe: failed` sau `Connect: ok` nghĩa là Gateway đã chấp nhận kết nối WebSocket, nhưng chẩn đoán đọc tiếp theo hết thời gian chờ hoặc thất bại. Đây cũng là khả năng truy cập **suy giảm**, không phải Gateway không thể truy cập.
    - Giống `gateway status`, thăm dò dùng lại xác thực thiết bị đã lưu trong bộ nhớ đệm nhưng không tạo danh tính thiết bị lần đầu hoặc trạng thái ghép đôi.
    - Mã thoát khác 0 chỉ khi không có mục tiêu nào được thăm dò có thể truy cập.

  </Accordion>
  <Accordion title="Đầu ra JSON">
    Cấp cao nhất:

    - `ok`: ít nhất một mục tiêu có thể truy cập.
    - `degraded`: ít nhất một mục tiêu đã chấp nhận kết nối nhưng không hoàn tất chẩn đoán RPC chi tiết đầy đủ.
    - `capability`: khả năng tốt nhất thấy được trên các mục tiêu có thể truy cập (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, hoặc `unknown`).
    - `primaryTargetId`: mục tiêu tốt nhất để coi là bên thắng đang hoạt động theo thứ tự này: URL rõ ràng, SSH tunnel, remote đã cấu hình, rồi local loopback.
    - `warnings[]`: bản ghi cảnh báo nỗ lực tối đa với `code`, `message` và `targetIds` tùy chọn.
    - `network`: gợi ý URL local loopback/tailnet được suy ra từ cấu hình hiện tại và mạng máy chủ.
    - `discovery.timeoutMs` và `discovery.count`: ngân sách khám phá/số kết quả thực tế đã dùng cho lượt thăm dò này.

    Theo từng mục tiêu (`targets[].connect`):

    - `ok`: khả năng truy cập sau kết nối + phân loại suy giảm.
    - `rpcOk`: RPC chi tiết đầy đủ thành công.
    - `scopeLimited`: RPC chi tiết thất bại do thiếu phạm vi operator.

    Theo từng mục tiêu (`targets[].auth`):

    - `role`: vai trò xác thực được báo cáo trong `hello-ok` khi có.
    - `scopes`: các phạm vi được cấp báo cáo trong `hello-ok` khi có.
    - `capability`: phân loại khả năng xác thực được hiển thị cho mục tiêu đó.

  </Accordion>
  <Accordion title="Mã cảnh báo thường gặp">
    - `ssh_tunnel_failed`: thiết lập SSH tunnel thất bại; lệnh đã quay về thăm dò trực tiếp.
    - `multiple_gateways`: nhiều hơn một mục tiêu có thể truy cập; điều này bất thường trừ khi bạn cố ý chạy các profile tách biệt, chẳng hạn như bot cứu hộ.
    - `auth_secretref_unresolved`: SecretRef xác thực đã cấu hình không thể được phân giải cho một mục tiêu thất bại.
    - `probe_scope_limited`: kết nối WebSocket thành công, nhưng thăm dò đọc bị giới hạn do thiếu `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remote qua SSH (tương đương ứng dụng Mac)

Chế độ "Remote over SSH" của ứng dụng macOS dùng chuyển tiếp cổng cục bộ để Gateway remote (có thể chỉ được bind vào loopback) có thể truy cập tại `ws://127.0.0.1:<port>`.

Tương đương CLI:

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
  Chọn máy chủ Gateway được phát hiện đầu tiên làm mục tiêu SSH từ endpoint khám phá đã phân giải (`local.` cộng với miền diện rộng đã cấu hình, nếu có). Gợi ý chỉ TXT bị bỏ qua.
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
  Chuỗi đối tượng JSON cho tham số.
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
  Đầu ra JSON máy đọc được.
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

Dùng `--wrapper` khi dịch vụ được quản lý phải khởi động thông qua một executable khác, ví dụ như một
shim trình quản lý bí mật hoặc trình trợ giúp chạy dưới danh tính khác. Wrapper nhận các đối số Gateway thông thường và
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
một tệp executable, ghi wrapper vào `ProgramArguments` của dịch vụ và lưu bền
`OPENCLAW_WRAPPER` trong môi trường dịch vụ cho các lần cài đặt lại bắt buộc, cập nhật và sửa chữa bằng doctor
sau này.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Để xóa một wrapper đã lưu bền, hãy xóa `OPENCLAW_WRAPPER` khi cài đặt lại:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Tùy chọn lệnh">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - Dùng `gateway restart` để khởi động lại một dịch vụ được quản lý. Không nối chuỗi `gateway stop` và `gateway start` để thay thế thao tác khởi động lại.
    - Trên macOS, `gateway stop` mặc định dùng `launchctl bootout`, thao tác này gỡ LaunchAgent khỏi phiên khởi động hiện tại mà không lưu trạng thái vô hiệu hóa — tính năng tự khôi phục KeepAlive vẫn hoạt động cho các lần sự cố trong tương lai và `gateway start` bật lại sạch sẽ mà không cần `launchctl enable` thủ công. Truyền `--disable` để chặn lâu dài KeepAlive và RunAtLoad, nhờ đó gateway không tự chạy lại cho đến lần `gateway start` rõ ràng tiếp theo; dùng tùy chọn này khi thao tác dừng thủ công cần tồn tại qua các lần khởi động lại hoặc khởi động lại hệ thống.
    - `gateway restart --safe` yêu cầu Gateway đang chạy kiểm tra trước công việc OpenClaw đang hoạt động và hoãn khởi động lại cho đến khi việc gửi phản hồi, các lần chạy nhúng và các lần chạy tác vụ rút hết. Không thể kết hợp `--safe` với `--force` hoặc `--wait`.
    - `gateway restart --wait 30s` ghi đè ngân sách rút cạn khi khởi động lại đã cấu hình cho lần khởi động lại đó. Số trần là mili giây; các đơn vị như `s`, `m` và `h` được chấp nhận. `--wait 0` chờ vô thời hạn.
    - `gateway restart --safe --skip-deferral` chạy khởi động lại an toàn có nhận biết OpenClaw nhưng bỏ qua cổng hoãn, nên Gateway phát lệnh khởi động lại ngay cả khi có báo cáo về các trình chặn. Đây là lối thoát cho người vận hành khi việc hoãn do lần chạy tác vụ bị kẹt; yêu cầu `--safe`.
    - `gateway restart --force` bỏ qua bước rút cạn công việc đang hoạt động và khởi động lại ngay lập tức. Dùng tùy chọn này khi người vận hành đã kiểm tra các trình chặn tác vụ được liệt kê và muốn Gateway hoạt động lại ngay.
    - Các lệnh vòng đời chấp nhận `--json` để dùng trong script.

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - Khi xác thực bằng token yêu cầu token và `gateway.auth.token` được quản lý bằng SecretRef, `gateway install` xác thực rằng SecretRef có thể được phân giải nhưng không lưu token đã phân giải vào siêu dữ liệu môi trường dịch vụ.
    - Nếu xác thực bằng token yêu cầu token và SecretRef token đã cấu hình chưa được phân giải, quá trình cài đặt sẽ đóng an toàn thay vì lưu văn bản thuần dự phòng.
    - Với xác thực bằng mật khẩu trên `gateway run`, ưu tiên `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, hoặc `gateway.auth.password` dựa trên SecretRef thay vì `--password` nội tuyến.
    - Ở chế độ xác thực suy luận, `OPENCLAW_GATEWAY_PASSWORD` chỉ có trong shell không nới lỏng yêu cầu token khi cài đặt; hãy dùng cấu hình bền vững (`gateway.auth.password` hoặc cấu hình `env`) khi cài đặt một dịch vụ được quản lý.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, quá trình cài đặt sẽ bị chặn cho đến khi chế độ được đặt rõ ràng.

  </Accordion>
</AccordionGroup>

## Khám phá Gateway (Bonjour)

`gateway discover` quét các beacon Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): chọn một miền (ví dụ: `openclaw.internal.`) và thiết lập split DNS + máy chủ DNS; xem [Bonjour](/vi/gateway/bonjour).

Chỉ các Gateway đã bật khám phá Bonjour (mặc định) mới quảng bá beacon.

Các bản ghi khám phá Wide-Area bao gồm (TXT):

- `role` (gợi ý vai trò Gateway)
- `transport` (gợi ý transport, ví dụ `gateway`)
- `gatewayPort` (cổng WebSocket, thường là `18789`)
- `sshPort` (tùy chọn; client mặc định mục tiêu SSH là `22` khi không có giá trị này)
- `tailnetDns` (tên máy chủ MagicDNS, khi có)
- `gatewayTls` / `gatewayTlsSha256` (TLS đã bật + dấu vân tay chứng chỉ)
- `cliPath` (gợi ý cài đặt từ xa được ghi vào vùng wide-area)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Thời gian chờ theo lệnh (duyệt/phân giải).
</ParamField>
<ParamField path="--json" type="boolean">
  Đầu ra máy có thể đọc (đồng thời tắt định dạng/spinner).
</ParamField>

Ví dụ:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI quét `local.` cộng với miền wide-area đã cấu hình khi miền đó được bật.
- `wsUrl` trong đầu ra JSON được suy ra từ endpoint dịch vụ đã phân giải, không phải từ các gợi ý chỉ có trong TXT như `lanHost` hoặc `tailnetDns`.
- Trên mDNS `local.`, `sshPort` và `cliPath` chỉ được phát khi `discovery.mdns.mode` là `full`. Wide-area DNS-SD vẫn ghi `cliPath`; `sshPort` cũng vẫn là tùy chọn ở đó.

</Note>

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Runbook Gateway](/vi/gateway)
