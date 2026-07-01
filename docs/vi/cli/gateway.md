---
read_when:
    - Chạy Gateway từ CLI (dev hoặc máy chủ)
    - Gỡ lỗi xác thực Gateway, chế độ bind và kết nối
    - Khám phá gateway qua Bonjour (DNS-SD cục bộ + diện rộng)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — chạy, truy vấn và khám phá các Gateway
title: Gateway
x-i18n:
    generated_at: "2026-07-01T08:11:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80f329ebd154f6fd0e87869c498c58fc6d5276a21934f8a36837653bd68a2d22
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
    - Theo mặc định, Gateway từ chối khởi động trừ khi `gateway.mode=local` được đặt trong `~/.openclaw/openclaw.json`. Dùng `--allow-unconfigured` cho các lần chạy tạm thời/phát triển.
    - `openclaw onboard --mode local` và `openclaw setup` được kỳ vọng sẽ ghi `gateway.mode=local`. Nếu tệp tồn tại nhưng thiếu `gateway.mode`, hãy xem đó là cấu hình bị hỏng hoặc bị ghi đè và sửa nó thay vì ngầm giả định chế độ local.
    - Nếu tệp tồn tại và thiếu `gateway.mode`, Gateway xem đó là hư hỏng cấu hình đáng ngờ và từ chối "đoán local" thay bạn.
    - Việc bind vượt quá loopback mà không có xác thực sẽ bị chặn (lan can an toàn).
    - `lan`, `tailnet`, và `custom` hiện phân giải qua các đường dẫn BYOH chỉ IPv4.
    - BYOH chỉ IPv6 hiện chưa được hỗ trợ nguyên bản trên đường dẫn này. Dùng một sidecar hoặc proxy IPv4 nếu chính máy chủ chỉ có IPv6.
    - `SIGUSR1` kích hoạt khởi động lại trong tiến trình khi được cho phép (`commands.restart` được bật theo mặc định; đặt `commands.restart: false` để chặn khởi động lại thủ công, trong khi gateway tool/config apply/update vẫn được phép).
    - Các handler `SIGINT`/`SIGTERM` dừng tiến trình gateway, nhưng chúng không khôi phục bất kỳ trạng thái terminal tùy chỉnh nào. Nếu bạn bọc CLI bằng TUI hoặc đầu vào raw-mode, hãy khôi phục terminal trước khi thoát.

  </Accordion>
</AccordionGroup>

### Tùy chọn

<ParamField path="--port <port>" type="number">
  Cổng WebSocket (mặc định đến từ config/env; thường là `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Chế độ bind listener. `lan`, `tailnet`, và `custom` hiện phân giải qua các đường dẫn chỉ IPv4.
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
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  Hiện kỳ vọng một địa chỉ IPv4. Với BYOH chỉ IPv6, đặt một sidecar hoặc proxy IPv4 trước Gateway và trỏ OpenClaw tới endpoint IPv4 đó.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Cho phép gateway khởi động mà không có `gateway.mode=local` trong cấu hình. Chỉ bỏ qua guard khởi động cho bootstrap tạm thời/phát triển; không ghi hoặc sửa tệp cấu hình.
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
  Kiểu nhật ký Websocket.
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

`openclaw gateway restart --safe` yêu cầu Gateway đang chạy kiểm tra trước công việc đang hoạt động và lên lịch một lần khởi động lại gộp sau khi công việc đang hoạt động được xử lý xong. Khởi động lại an toàn mặc định chờ công việc đang hoạt động tối đa đến `gateway.reload.deferralTimeoutMs` đã cấu hình (mặc định 5 phút); khi ngân sách đó hết, quá trình khởi động lại sẽ bị cưỡng bức. Đặt `gateway.reload.deferralTimeoutMs` thành `0` để chờ an toàn vô thời hạn và không bao giờ cưỡng bức. `restart` thường giữ hành vi service-manager hiện có; `--force` vẫn là đường dẫn ghi đè ngay lập tức.

`openclaw gateway restart --safe --skip-deferral` chạy cùng quá trình khởi động lại phối hợp có nhận biết OpenClaw như `--safe`, nhưng bỏ qua cổng trì hoãn do công việc đang hoạt động để Gateway phát lệnh khởi động lại ngay cả khi có blocker được báo cáo. Dùng nó như lối thoát cho operator khi một lần trì hoãn bị giữ bởi một task run bị kẹt và chỉ dùng `--safe` có thể bị giới hạn bởi `gateway.reload.deferralTimeoutMs`. `--skip-deferral` yêu cầu `--safe`.

<Warning>
`--password` inline có thể bị lộ trong danh sách tiến trình cục bộ. Ưu tiên `--password-file`, env, hoặc `gateway.auth.password` được hỗ trợ bởi SecretRef.
</Warning>

### Hồ sơ hiệu năng Gateway

- Đặt `OPENCLAW_GATEWAY_STARTUP_TRACE=1` để ghi thời gian từng pha trong quá trình Gateway khởi động, bao gồm độ trễ `eventLoopMax` theo từng pha và thời gian bảng tra cứu Plugin cho installed-index, manifest registry, startup planning, và owner-map work.
- Đặt `OPENCLAW_GATEWAY_RESTART_TRACE=1` để ghi các dòng `restart trace:` theo phạm vi khởi động lại cho xử lý tín hiệu khởi động lại, drain công việc đang hoạt động, các pha shutdown, lần khởi động kế tiếp, thời điểm sẵn sàng, và chỉ số bộ nhớ.
- Đặt `OPENCLAW_DIAGNOSTICS=timeline` cùng `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` để ghi một timeline chẩn đoán khởi động JSONL best-effort cho các harness QA bên ngoài. Bạn cũng có thể bật cờ bằng `diagnostics.flags: ["timeline"]` trong cấu hình; đường dẫn vẫn được cung cấp qua env. Thêm `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` để bao gồm các mẫu event-loop.
- Chạy `pnpm build` trước, rồi `pnpm test:startup:gateway -- --runs 5 --warmup 1` để benchmark khởi động Gateway so với entry CLI đã build. Benchmark ghi lại output tiến trình đầu tiên, `/healthz`, `/readyz`, thời gian startup trace, độ trễ event-loop, và chi tiết thời gian bảng tra cứu Plugin.
- Chạy `pnpm build` trước, rồi `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` để benchmark khởi động lại Gateway trong tiến trình so với entry CLI đã build trên macOS hoặc Linux. Benchmark khởi động lại dùng SIGUSR1, bật cả startup trace và restart trace trong tiến trình con, và ghi lại `/healthz` tiếp theo, `/readyz` tiếp theo, downtime, thời điểm sẵn sàng, CPU, RSS, và chỉ số restart trace.
- Xem `/healthz` là liveness và `/readyz` là readiness có thể sử dụng. Các dòng trace và output benchmark dùng để quy trách nhiệm cho owner; đừng xem một trace span hoặc một mẫu là kết luận hiệu năng hoàn chỉnh.

## Truy vấn Gateway đang chạy

Tất cả lệnh truy vấn dùng WebSocket RPC.

<Tabs>
  <Tab title="Chế độ output">
    - Mặc định: dễ đọc cho con người (có màu trong TTY).
    - `--json`: JSON để máy đọc (không styling/spinner).
    - `--no-color` (hoặc `NO_COLOR=1`): tắt ANSI trong khi vẫn giữ bố cục cho con người.

  </Tab>
  <Tab title="Tùy chọn dùng chung">
    - `--url <url>`: URL WebSocket của Gateway.
    - `--token <token>`: token Gateway.
    - `--password <password>`: mật khẩu Gateway.
    - `--timeout <ms>`: timeout/ngân sách (thay đổi theo lệnh).
    - `--expect-final`: chờ phản hồi "final" (agent calls).

  </Tab>
</Tabs>

<Note>
Khi bạn đặt `--url`, CLI không fallback về thông tin xác thực trong cấu hình hoặc môi trường. Truyền rõ `--token` hoặc `--password`. Thiếu thông tin xác thực rõ ràng là lỗi.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

Endpoint HTTP `/healthz` là probe liveness: nó trả về khi máy chủ có thể trả lời HTTP. Endpoint HTTP `/readyz` nghiêm ngặt hơn và vẫn đỏ trong khi các sidecar Plugin khởi động, kênh, hoặc hook đã cấu hình vẫn đang ổn định. Các phản hồi readiness chi tiết cục bộ hoặc đã xác thực bao gồm một khối chẩn đoán `eventLoop` với độ trễ event-loop, mức sử dụng event-loop, tỷ lệ lõi CPU, và cờ `degraded`.

<ParamField path="--port <port>" type="number">
  Nhắm tới một Gateway local loopback trên cổng này. Tùy chọn này ghi đè `OPENCLAW_GATEWAY_URL` và `OPENCLAW_GATEWAY_PORT` cho lệnh health.
</ParamField>

### `gateway usage-cost`

Lấy tóm tắt chi phí sử dụng từ nhật ký phiên.

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
  Giới hạn phạm vi tóm tắt chi phí vào một id agent đã cấu hình.
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
  Lọc theo loại sự kiện chẩn đoán, chẳng hạn như `payload.large` hoặc `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Chỉ bao gồm các sự kiện sau một số thứ tự chẩn đoán.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Đọc một bundle ổn định đã lưu thay vì gọi Gateway đang chạy. Dùng `--bundle latest` (hoặc chỉ `--bundle`) cho bundle mới nhất dưới thư mục trạng thái, hoặc truyền trực tiếp một đường dẫn JSON bundle.
</ParamField>
<ParamField path="--export" type="boolean">
  Ghi một zip chẩn đoán hỗ trợ có thể chia sẻ thay vì in chi tiết ổn định.
</ParamField>
<ParamField path="--output <path>" type="string">
  Đường dẫn output cho `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Quyền riêng tư và hành vi bundle">
    - Bản ghi giữ siêu dữ liệu vận hành: tên sự kiện, số lượng, kích thước byte, chỉ số bộ nhớ, trạng thái hàng đợi/phiên, id phê duyệt, tên kênh/Plugin, và tóm tắt phiên đã biên tập. Chúng không giữ văn bản chat, body webhook, output tool, body request hoặc response thô, token, cookie, giá trị bí mật, hostname, hoặc id phiên thô. Đặt `diagnostics.enabled: false` để tắt hoàn toàn bộ ghi.
    - Khi Gateway thoát lỗi nghiêm trọng, timeout shutdown, và lỗi khởi động sau restart, OpenClaw ghi cùng snapshot chẩn đoán vào `~/.openclaw/logs/stability/openclaw-stability-*.json` khi bộ ghi có sự kiện. Kiểm tra bundle mới nhất bằng `openclaw gateway stability --bundle latest`; `--limit`, `--type`, và `--since-seq` cũng áp dụng cho output bundle.

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
  Đường dẫn zip đầu ra. Mặc định là bản xuất hỗ trợ trong thư mục trạng thái.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Số dòng nhật ký đã làm sạch tối đa cần bao gồm.
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

Bản xuất chứa một manifest, bản tóm tắt Markdown, hình dạng cấu hình, chi tiết cấu hình đã làm sạch, tóm tắt nhật ký đã làm sạch, ảnh chụp nhanh trạng thái/tình trạng Gateway đã làm sạch, và gói ổn định mới nhất nếu có.

Bản xuất này được thiết kế để chia sẻ. Nó giữ lại các chi tiết vận hành hỗ trợ gỡ lỗi, chẳng hạn như các trường nhật ký OpenClaw an toàn, tên hệ thống con, mã trạng thái, thời lượng, chế độ đã cấu hình, cổng, id plugin, id nhà cung cấp, thiết lập tính năng không bí mật, và thông điệp nhật ký vận hành đã được biên tập. Nó bỏ qua hoặc biên tập nội dung trò chuyện, thân webhook, đầu ra công cụ, thông tin xác thực, cookie, mã định danh tài khoản/tin nhắn, văn bản prompt/chỉ dẫn, tên máy chủ, và giá trị bí mật. Khi một thông điệp kiểu LogTape trông giống văn bản tải trọng người dùng/trò chuyện/công cụ, bản xuất chỉ giữ lại rằng một thông điệp đã bị bỏ qua cùng với số byte của nó.

### `gateway status`

`gateway status` hiển thị dịch vụ Gateway (launchd/systemd/schtasks) cùng với một phép dò tùy chọn về khả năng kết nối/xác thực.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Thêm mục tiêu dò rõ ràng. Remote đã cấu hình + localhost vẫn được dò.
</ParamField>
<ParamField path="--token <token>" type="string">
  Xác thực token cho phép dò.
</ParamField>
<ParamField path="--password <password>" type="string">
  Xác thực mật khẩu cho phép dò.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Thời gian chờ dò.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Bỏ qua phép dò kết nối (chỉ xem dịch vụ).
</ParamField>
<ParamField path="--deep" type="boolean">
  Quét cả các dịch vụ cấp hệ thống.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Nâng cấp phép dò kết nối mặc định thành phép dò đọc và thoát khác 0 khi phép dò đọc đó thất bại. Không thể kết hợp với `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Ngữ nghĩa trạng thái">
    - `gateway status` vẫn khả dụng để chẩn đoán ngay cả khi cấu hình CLI cục bộ bị thiếu hoặc không hợp lệ.
    - `gateway status` mặc định chứng minh trạng thái dịch vụ, kết nối WebSocket, và khả năng xác thực nhìn thấy tại thời điểm bắt tay. Nó không chứng minh các thao tác đọc/ghi/quản trị.
    - Các phép dò chẩn đoán không gây đột biến đối với xác thực thiết bị lần đầu: chúng dùng lại token thiết bị đã lưu trong bộ nhớ đệm nếu có, nhưng không tạo danh tính thiết bị CLI mới hoặc bản ghi ghép đôi thiết bị chỉ đọc chỉ để kiểm tra trạng thái.
    - `gateway status` phân giải các SecretRef xác thực đã cấu hình cho xác thực phép dò khi có thể.
    - Nếu một SecretRef xác thực bắt buộc không được phân giải trong đường dẫn lệnh này, `gateway status --json` báo cáo `rpc.authWarning` khi kết nối/xác thực dò thất bại; truyền rõ ràng `--token`/`--password` hoặc phân giải nguồn bí mật trước.
    - Nếu phép dò thành công, cảnh báo auth-ref chưa phân giải sẽ bị ẩn để tránh dương tính giả.
    - Khi bật dò, đầu ra JSON bao gồm `gateway.version` khi Gateway đang chạy báo cáo nó; `--require-rpc` có thể dự phòng về tải trọng RPC `status.runtimeVersion` nếu phép dò bắt tay tiếp theo không cung cấp được siêu dữ liệu phiên bản.
    - Dùng `--require-rpc` trong script và tự động hóa khi một dịch vụ đang lắng nghe là chưa đủ và bạn cũng cần các lệnh gọi RPC phạm vi đọc hoạt động khỏe mạnh.
    - `--deep` thêm quét nỗ lực tối đa để tìm các cài đặt launchd/systemd/schtasks bổ sung. Khi phát hiện nhiều dịch vụ giống gateway, đầu ra cho người đọc in gợi ý dọn dẹp và cảnh báo rằng hầu hết thiết lập nên chạy một gateway trên mỗi máy.
    - `--deep` cũng báo cáo một lần chuyển giao khởi động lại supervisor Gateway gần đây khi tiến trình dịch vụ đã thoát sạch để supervisor bên ngoài khởi động lại.
    - `--deep` chạy xác thực cấu hình ở chế độ nhận biết plugin (`pluginValidation: "full"`) và hiển thị cảnh báo manifest plugin đã cấu hình (ví dụ thiếu siêu dữ liệu cấu hình kênh) để các kiểm tra smoke cài đặt và cập nhật bắt được chúng. `gateway status` mặc định giữ đường dẫn chỉ đọc nhanh bỏ qua xác thực plugin.
    - Đầu ra cho người đọc bao gồm đường dẫn nhật ký tệp đã phân giải cùng với ảnh chụp nhanh đường dẫn/tính hợp lệ cấu hình CLI-so-với-dịch vụ để giúp chẩn đoán trôi lệch hồ sơ hoặc thư mục trạng thái.

  </Accordion>
  <Accordion title="Kiểm tra trôi lệch xác thực Linux systemd">
    - Trên các cài đặt Linux systemd, kiểm tra trôi lệch xác thực dịch vụ đọc cả giá trị `Environment=` và `EnvironmentFile=` từ unit (bao gồm `%h`, đường dẫn có dấu ngoặc kép, nhiều tệp, và các tệp `-` tùy chọn).
    - Kiểm tra trôi lệch phân giải SecretRef `gateway.auth.token` bằng môi trường runtime đã hợp nhất (môi trường lệnh dịch vụ trước, sau đó dự phòng về môi trường tiến trình).
    - Nếu xác thực token không thực sự hoạt động (`gateway.auth.mode` rõ ràng là `password`/`none`/`trusted-proxy`, hoặc mode chưa đặt trong đó mật khẩu có thể thắng và không có ứng viên token nào có thể thắng), kiểm tra token-drift bỏ qua phân giải token cấu hình.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` là lệnh "gỡ lỗi mọi thứ". Nó luôn dò:

- gateway remote đã cấu hình của bạn (nếu đã đặt), và
- localhost (local loopback) **ngay cả khi remote đã được cấu hình**.

Nếu bạn truyền `--url`, mục tiêu rõ ràng đó được thêm trước cả hai mục tiêu. Đầu ra cho người đọc gắn nhãn các mục tiêu là:

- `URL (explicit)`
- `Remote (configured)` hoặc `Remote (configured, inactive)`
- `Local loopback`

<Note>
Nếu nhiều mục tiêu dò có thể truy cập, nó sẽ in tất cả. Một đường hầm SSH, URL TLS/proxy, và URL remote đã cấu hình đều có thể trỏ đến cùng một gateway ngay cả khi cổng truyền tải của chúng khác nhau; `multiple_gateways` được dành cho các gateway có thể truy cập nhưng khác biệt hoặc mơ hồ về danh tính. Nhiều gateway được hỗ trợ khi bạn dùng các hồ sơ tách biệt (ví dụ bot cứu hộ), nhưng hầu hết cài đặt vẫn chạy một gateway duy nhất.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Dùng cổng này cho mục tiêu dò local loopback và cổng remote của đường hầm SSH. Khi không có `--url`, tùy chọn này chọn mục tiêu local loopback thay vì URL môi trường gateway đã cấu hình, cổng môi trường, hoặc mục tiêu remote.
</ParamField>

<AccordionGroup>
  <Accordion title="Diễn giải">
    - `Reachable: yes` nghĩa là ít nhất một mục tiêu đã chấp nhận kết nối WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` báo cáo những gì phép dò có thể chứng minh về xác thực. Nó tách biệt với khả năng truy cập.
    - `Read probe: ok` nghĩa là các lệnh gọi RPC chi tiết phạm vi đọc (`health`/`status`/`system-presence`/`config.get`) cũng thành công.
    - `Read probe: limited - missing scope: operator.read` nghĩa là kết nối thành công nhưng RPC phạm vi đọc bị giới hạn. Điều này được báo cáo là khả năng truy cập **suy giảm**, không phải thất bại hoàn toàn.
    - `Read probe: failed` sau `Connect: ok` nghĩa là Gateway đã chấp nhận kết nối WebSocket, nhưng chẩn đoán đọc tiếp theo đã hết thời gian chờ hoặc thất bại. Đây cũng là khả năng truy cập **suy giảm**, không phải Gateway không thể truy cập.
    - Giống `gateway status`, probe dùng lại xác thực thiết bị đã lưu trong bộ nhớ đệm nhưng không tạo danh tính thiết bị lần đầu hoặc trạng thái ghép đôi.
    - Mã thoát chỉ khác 0 khi không có mục tiêu nào được dò có thể truy cập.

  </Accordion>
  <Accordion title="Đầu ra JSON">
    Cấp cao nhất:

    - `ok`: ít nhất một mục tiêu có thể truy cập.
    - `degraded`: ít nhất một mục tiêu đã chấp nhận kết nối nhưng không hoàn tất chẩn đoán RPC chi tiết đầy đủ.
    - `capability`: khả năng tốt nhất đã thấy trên các mục tiêu có thể truy cập (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, hoặc `unknown`).
    - `primaryTargetId`: mục tiêu tốt nhất để xem là bên thắng đang hoạt động theo thứ tự này: URL rõ ràng, đường hầm SSH, remote đã cấu hình, rồi local loopback.
    - `warnings[]`: bản ghi cảnh báo nỗ lực tối đa với `code`, `message`, và `targetIds` tùy chọn.
    - `network`: gợi ý URL local loopback/tailnet được dẫn xuất từ cấu hình hiện tại và mạng máy chủ.
    - `discovery.timeoutMs` và `discovery.count`: ngân sách khám phá/số lượng kết quả thực tế đã dùng cho lượt dò này.

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
    - `ssh_tunnel_failed`: Thiết lập đường hầm SSH thất bại; lệnh đã dự phòng về các phép dò trực tiếp.
    - `multiple_gateways`: các danh tính gateway khác biệt có thể truy cập, hoặc OpenClaw không thể chứng minh các mục tiêu có thể truy cập là cùng một gateway. Đường hầm SSH, URL proxy, hoặc URL remote đã cấu hình tới cùng một gateway không kích hoạt cảnh báo này.
    - `auth_secretref_unresolved`: một SecretRef xác thực đã cấu hình không thể phân giải cho mục tiêu thất bại.
    - `probe_scope_limited`: Kết nối WebSocket thành công, nhưng phép dò đọc bị giới hạn do thiếu `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remote qua SSH (tương đương ứng dụng Mac)

Chế độ "Remote over SSH" của ứng dụng macOS dùng chuyển tiếp cổng cục bộ để gateway remote (có thể chỉ được bind vào loopback) trở nên có thể truy cập tại `ws://127.0.0.1:<port>`.

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
  Chọn máy chủ gateway đầu tiên được khám phá làm mục tiêu SSH từ endpoint khám phá đã phân giải (`local.` cộng với miền diện rộng đã cấu hình, nếu có). Gợi ý chỉ TXT bị bỏ qua.
</ParamField>

Cấu hình (tùy chọn, dùng làm mặc định):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Trình hỗ trợ RPC cấp thấp.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Chuỗi đối tượng JSON cho params.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket Gateway.
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
  Chủ yếu dành cho các RPC kiểu agent truyền dòng sự kiện trung gian trước tải trọng cuối cùng.
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

### Cài đặt với trình bao bọc

Dùng `--wrapper` khi dịch vụ được quản lý phải khởi động thông qua một tệp thực thi khác, ví dụ một
shim của trình quản lý bí mật hoặc một helper chạy dưới danh nghĩa người dùng khác. Trình bao bọc nhận các đối số Gateway thông thường và
chịu trách nhiệm cuối cùng thực thi `openclaw` hoặc Node với các đối số đó.

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
một tệp có thể thực thi, ghi trình bao bọc vào `ProgramArguments` của dịch vụ, và lưu bền
`OPENCLAW_WRAPPER` trong môi trường dịch vụ cho các lần cài đặt lại bắt buộc, cập nhật, và sửa chữa bằng doctor
về sau.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Để xóa một trình bao bọc đã được lưu bền, hãy xóa `OPENCLAW_WRAPPER` trong lúc cài đặt lại:

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
    - Trên macOS, theo mặc định `gateway stop` dùng `launchctl bootout`, thao tác này xóa LaunchAgent khỏi phiên khởi động hiện tại mà không lưu bền trạng thái tắt — tính năng tự khôi phục KeepAlive vẫn hoạt động cho các sự cố về sau và `gateway start` bật lại sạch sẽ mà không cần `launchctl enable` thủ công. Truyền `--disable` để chặn KeepAlive và RunAtLoad một cách bền vững, để Gateway không tái sinh cho đến lần `gateway start` rõ ràng tiếp theo; dùng tùy chọn này khi một lần dừng thủ công cần tồn tại qua các lần khởi động lại máy hoặc khởi động lại hệ thống.
    - `gateway restart --safe` yêu cầu Gateway đang chạy kiểm tra trước công việc đang hoạt động và lên lịch một lần khởi động lại gộp sau khi công việc đang hoạt động được xả hết. Khởi động lại an toàn mặc định chờ công việc đang hoạt động tối đa theo `gateway.reload.deferralTimeoutMs` đã cấu hình (mặc định 5 phút); khi ngân sách đó hết, lần khởi động lại sẽ bị bắt buộc. Đặt `gateway.reload.deferralTimeoutMs` thành `0` để chờ an toàn vô thời hạn và không bao giờ bắt buộc. Không thể kết hợp `--safe` với `--force` hoặc `--wait`.
    - `gateway restart --wait 30s` ghi đè ngân sách xả trước khi khởi động lại đã cấu hình cho lần khởi động lại đó. Số trần là mili giây; các đơn vị như `s`, `m`, và `h` được chấp nhận. `--wait 0` chờ vô thời hạn.
    - `gateway restart --safe --skip-deferral` chạy khởi động lại an toàn có nhận biết OpenClaw nhưng bỏ qua cổng trì hoãn, để Gateway phát ra lệnh khởi động lại ngay cả khi có báo cáo về các tác nhân chặn. Đây là lối thoát cho người vận hành khi các trì hoãn do lượt chạy tác vụ bị kẹt; yêu cầu `--safe`.
    - `gateway restart --force` bỏ qua bước xả công việc đang hoạt động và khởi động lại ngay lập tức. Dùng tùy chọn này khi người vận hành đã kiểm tra các tác vụ chặn được liệt kê và muốn Gateway hoạt động trở lại ngay.
    - Các lệnh vòng đời chấp nhận `--json` để viết script.

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - Khi xác thực bằng token yêu cầu token và `gateway.auth.token` được quản lý bằng SecretRef, `gateway install` xác thực rằng SecretRef có thể phân giải nhưng không lưu bền token đã phân giải vào siêu dữ liệu môi trường dịch vụ.
    - Nếu xác thực bằng token yêu cầu token và SecretRef token đã cấu hình chưa được phân giải, quá trình cài đặt sẽ đóng lỗi thay vì lưu bền văn bản thuần dự phòng.
    - Với xác thực bằng mật khẩu trên `gateway run`, ưu tiên `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, hoặc `gateway.auth.password` dựa trên SecretRef thay vì `--password` nội tuyến.
    - Trong chế độ xác thực suy luận, `OPENCLAW_GATEWAY_PASSWORD` chỉ có trong shell không nới lỏng các yêu cầu token khi cài đặt; hãy dùng cấu hình bền vững (`gateway.auth.password` hoặc `env` trong cấu hình) khi cài đặt một dịch vụ được quản lý.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, quá trình cài đặt sẽ bị chặn cho đến khi mode được đặt rõ ràng.

  </Accordion>
</AccordionGroup>

## Khám phá Gateway (Bonjour)

`gateway discover` quét các beacon Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour diện rộng): chọn một miền (ví dụ: `openclaw.internal.`) và thiết lập split DNS + một máy chủ DNS; xem [Bonjour](/vi/gateway/bonjour).

Chỉ các Gateway đã bật khám phá Bonjour (mặc định) mới quảng bá beacon.

Các bản ghi khám phá diện rộng có thể bao gồm các gợi ý TXT này:

- `role` (gợi ý vai trò Gateway)
- `transport` (gợi ý transport, ví dụ `gateway`)
- `gatewayPort` (cổng WebSocket, thường là `18789`)
- `sshPort` (chỉ ở chế độ khám phá đầy đủ; client mặc định mục tiêu SSH là `22` khi không có)
- `tailnetDns` (tên máy chủ MagicDNS, khi có)
- `gatewayTls` / `gatewayTlsSha256` (TLS đã bật + vân tay chứng chỉ)
- `cliPath` (chỉ ở chế độ khám phá đầy đủ)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Thời gian chờ cho mỗi lệnh (duyệt/phân giải).
</ParamField>
<ParamField path="--json" type="boolean">
  Đầu ra máy đọc được (cũng tắt định kiểu/spinner).
</ParamField>

Ví dụ:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI quét `local.` cộng với miền diện rộng đã cấu hình khi một miền được bật.
- `wsUrl` trong đầu ra JSON được dẫn xuất từ điểm cuối dịch vụ đã phân giải, không phải từ các gợi ý chỉ có trong TXT như `lanHost` hoặc `tailnetDns`.
- Trên mDNS `local.` và DNS-SD diện rộng, `sshPort` và `cliPath` chỉ được công bố khi `discovery.mdns.mode` là `full`.

</Note>

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Runbook Gateway](/vi/gateway)
