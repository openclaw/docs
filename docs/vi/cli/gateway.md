---
read_when:
    - Chạy Gateway từ CLI (môi trường phát triển hoặc máy chủ)
    - Gỡ lỗi xác thực Gateway, chế độ liên kết và khả năng kết nối
    - Phát hiện Gateway qua Bonjour (DNS-SD cục bộ + diện rộng)
sidebarTitle: Gateway
summary: CLI Gateway OpenClaw (`openclaw gateway`) — chạy, truy vấn và khám phá các Gateway
title: Gateway
x-i18n:
    generated_at: "2026-07-12T07:49:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75f8f4bebe585b213f486f08bf20015aeb89ca4d179f6d96c1008ec9d1cd00ea
    source_path: cli/gateway.md
    workflow: 16
---

Gateway là máy chủ WebSocket của OpenClaw (các kênh, Node, phiên, hook). Tất cả các lệnh con bên dưới đều nằm dưới `openclaw gateway ...`.

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
openclaw gateway run   # dạng tương đương, tường minh
```

<AccordionGroup>
  <Accordion title="Hành vi khi khởi động">
    - Từ chối khởi động trừ khi `gateway.mode=local` được đặt trong `~/.openclaw/openclaw.json`. Dùng `--allow-unconfigured` cho các lần chạy đặc biệt/phát triển; cờ này bỏ qua cơ chế bảo vệ mà không ghi hoặc sửa cấu hình.
    - `openclaw onboard --mode local` và `openclaw setup` ghi `gateway.mode=local`. Nếu tệp cấu hình tồn tại nhưng thiếu `gateway.mode`, tệp đó được coi là cấu hình bị hỏng/ghi đè và Gateway sẽ không tự suy đoán `local` cho bạn — hãy chạy lại quy trình thiết lập ban đầu, đặt khóa theo cách thủ công hoặc truyền `--allow-unconfigured`.
    - Việc liên kết ra ngoài loopback mà không có xác thực sẽ bị chặn.
    - Các giá trị `lan`, `tailnet` và `custom` của `--bind` hiện chỉ phân giải qua các đường dẫn IPv4; các thiết lập dùng máy chủ riêng chỉ có IPv6 cần một tiến trình phụ IPv4 hoặc proxy phía trước Gateway.
    - `SIGUSR1` kích hoạt khởi động lại trong tiến trình khi được phép. `commands.restart` (mặc định: bật) kiểm soát `SIGUSR1` được gửi từ bên ngoài; đặt thành `false` để chặn khởi động lại thủ công bằng tín hiệu hệ điều hành trong khi vẫn cho phép khởi động lại qua lệnh `gateway restart`, công cụ Gateway và thao tác áp dụng/cập nhật cấu hình.
    - `SIGINT`/`SIGTERM` dừng tiến trình nhưng không khôi phục trạng thái thiết bị đầu cuối tùy chỉnh — nếu bạn bọc CLI trong TUI hoặc đầu vào chế độ thô, hãy tự khôi phục thiết bị đầu cuối trước khi thoát.

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
  Chế độ công khai qua Tailscale: `off`, `serve`, `funnel`.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Đặt lại cấu hình serve/funnel của Tailscale khi tắt.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Khởi động mà không bắt buộc `gateway.mode=local`. Chỉ dùng để khởi tạo đặc biệt/phát triển; không lưu hoặc sửa cấu hình.
</ParamField>
<ParamField path="--dev" type="boolean">
  Tạo cấu hình phát triển + không gian làm việc nếu chưa có (bỏ qua `BOOTSTRAP.md`).
</ParamField>
<ParamField path="--reset" type="boolean">
  Đặt lại cấu hình phát triển, thông tin xác thực, phiên và không gian làm việc. Yêu cầu `--dev`.
</ParamField>
<ParamField path="--force" type="boolean">
  Dừng mọi trình lắng nghe hiện có trên cổng đích trước khi khởi động.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Ghi nhật ký chi tiết ra stdout/stderr.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Chỉ hiển thị nhật ký phần phụ trợ CLI trong bảng điều khiển (đồng thời bật stdout/stderr).
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

`--claude-cli-logs` là bí danh không còn được khuyến nghị của `--cli-backend-logs`.

Với `--bind custom`, hãy đặt `gateway.customBindHost` thành một địa chỉ IPv4. Mọi địa chỉ ngoài `127.0.0.1` hoặc `0.0.0.0` cũng yêu cầu `127.0.0.1` trên cùng cổng cho các máy khách trên cùng máy chủ; quá trình khởi động sẽ thất bại nếu một trong hai trình lắng nghe không thể liên kết. Địa chỉ đại diện `0.0.0.0` không thêm một bí danh bắt buộc riêng. Các thiết lập dùng máy chủ riêng chỉ có IPv6 cần một tiến trình phụ IPv4 hoặc proxy phía trước Gateway.

## Khởi động lại Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` yêu cầu Gateway đang chạy kiểm tra trước công việc đang hoạt động và lên lịch một lần khởi động lại hợp nhất sau khi công việc đó hoàn tất. Thời gian chờ bị giới hạn bởi `gateway.reload.deferralTimeoutMs` (mặc định: 5 phút / `300000`); khi hết khoảng thời gian này, việc khởi động lại sẽ bị buộc thực hiện. Đặt `deferralTimeoutMs: 0` để chờ vô thời hạn (kèm cảnh báo định kỳ rằng vẫn đang chờ) thay vì buộc thực hiện. Không thể kết hợp `--safe` với `--force` hoặc `--wait`.

`--skip-deferral` bỏ qua cổng trì hoãn do công việc đang hoạt động khi khởi động lại an toàn, vì vậy Gateway khởi động lại ngay lập tức ngay cả khi có báo cáo về yếu tố cản trở. Cờ này yêu cầu `--safe` — hãy dùng khi việc trì hoãn bị kẹt do một tác vụ mất kiểm soát.

`--wait <duration>` ghi đè khoảng thời gian chờ hoàn tất cho một lần khởi động lại thông thường (không an toàn). Chấp nhận giá trị mili giây thuần hoặc hậu tố đơn vị `ms`, `s`, `m`, `h`, `d` (ví dụ: `30s`, `5m`, `1h30m`); `--wait 0` chờ vô thời hạn. Không tương thích với `--force` hoặc `--safe`.

`--force` bỏ qua việc chờ công việc đang hoạt động hoàn tất và khởi động lại ngay lập tức. `restart` thông thường (không có cờ) giữ nguyên hành vi khởi động lại hiện có của trình quản lý dịch vụ.

<Warning>
`--password` nội tuyến có thể bị lộ trong danh sách tiến trình cục bộ. Nên dùng `--password-file`, biến môi trường hoặc `gateway.auth.password` được hỗ trợ bởi SecretRef.
</Warning>

### Lập hồ sơ Gateway

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` ghi thời gian của từng giai đoạn trong lúc khởi động, bao gồm độ trễ `eventLoopMax` theo từng giai đoạn và thời gian của bảng tra cứu Plugin (chỉ mục đã cài đặt, sổ đăng ký manifest, lập kế hoạch khởi động, xử lý ánh xạ chủ sở hữu).
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` ghi các dòng `restart trace:` trong phạm vi khởi động lại: xử lý tín hiệu, chờ công việc đang hoạt động hoàn tất, các giai đoạn tắt, lần khởi động tiếp theo, thời gian sẵn sàng và chỉ số bộ nhớ.
- `OPENCLAW_DIAGNOSTICS=timeline` cùng `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` ghi dòng thời gian chẩn đoán khởi động JSONL theo khả năng tốt nhất cho các bộ kiểm thử QA bên ngoài (tương đương cấu hình `diagnostics.flags: ["timeline"]`; đường dẫn vẫn chỉ có thể đặt qua biến môi trường). Thêm `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` để bao gồm các mẫu vòng lặp sự kiện.
- Chạy `pnpm build`, sau đó chạy `pnpm test:startup:gateway -- --runs 5 --warmup 1` để đo chuẩn quá trình khởi động Gateway dựa trên điểm vào CLI đã dựng: đầu ra tiến trình đầu tiên, `/healthz`, `/readyz`, thời gian theo dõi khởi động, độ trễ vòng lặp sự kiện và thời gian bảng tra cứu Plugin.
- Chạy `pnpm build`, sau đó chạy `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` để đo chuẩn quá trình khởi động lại trong tiến trình trên macOS hoặc Linux (không được hỗ trợ trên Windows; khởi động lại yêu cầu `SIGUSR1`). Lệnh này dùng `SIGUSR1`, bật cả hai chế độ theo dõi trong tiến trình con và ghi lại lần `/healthz` tiếp theo, lần `/readyz` tiếp theo, thời gian gián đoạn, thời gian sẵn sàng, CPU, RSS và các chỉ số theo dõi khởi động lại.
- `/healthz` biểu thị tiến trình còn hoạt động; `/readyz` biểu thị mức sẵn sàng sử dụng. Hãy coi các dòng theo dõi và đầu ra đo chuẩn là tín hiệu quy trách nhiệm cho chủ sở hữu, không phải kết luận hiệu năng hoàn chỉnh từ một khoảng đo hoặc mẫu duy nhất.

## Truy vấn một Gateway đang chạy

Tất cả các lệnh truy vấn đều dùng RPC qua WebSocket.

<Tabs>
  <Tab title="Chế độ đầu ra">
    - Mặc định: con người có thể đọc được (có màu trong TTY).
    - `--json`: JSON máy có thể đọc được (không có định kiểu/chỉ báo xoay).
    - `--no-color` (hoặc `NO_COLOR=1`): tắt ANSI trong khi vẫn giữ bố cục dành cho con người.

  </Tab>
  <Tab title="Tùy chọn dùng chung">
    - `--url <url>`: URL WebSocket của Gateway.
    - `--token <token>`: Token Gateway.
    - `--password <password>`: Mật khẩu Gateway.
    - `--timeout <ms>`: thời gian chờ/ngân sách thời gian (mặc định thay đổi theo từng lệnh; xem từng lệnh bên dưới).
    - `--expect-final`: chờ phản hồi "cuối cùng" (các lệnh gọi tác tử).

  </Tab>
</Tabs>

<Note>
Khi bạn đặt `--url`, CLI không dùng thông tin xác thực từ cấu hình hoặc môi trường làm phương án dự phòng. Hãy truyền rõ ràng `--token` hoặc `--password`. Thiếu thông tin xác thực được chỉ định rõ là một lỗi.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` là phép thăm dò trạng thái hoạt động: nó trả về ngay khi máy chủ có thể phản hồi HTTP. `/readyz` nghiêm ngặt hơn và duy trì trạng thái đỏ trong khi các tiến trình phụ Plugin khởi động, kênh hoặc hook đã cấu hình vẫn đang ổn định. Các phản hồi `/readyz` chi tiết cục bộ hoặc đã xác thực bao gồm một khối chẩn đoán `eventLoop` (độ trễ, mức sử dụng, tỷ lệ lõi CPU, cờ `degraded`).

<ParamField path="--port <port>" type="number">
  Nhắm đến một Gateway local loopback trên cổng này. Ghi đè `OPENCLAW_GATEWAY_URL` và `OPENCLAW_GATEWAY_PORT` cho lệnh gọi này.
</ParamField>

### `gateway usage-cost`

Lấy các bản tóm tắt chi phí sử dụng từ nhật ký phiên.

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
  Giới hạn bản tóm tắt trong một mã định danh tác tử đã cấu hình.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Tổng hợp trên tất cả các tác tử đã cấu hình. Không thể kết hợp với `--agent`.
</ParamField>

### `gateway stability`

Lấy bộ ghi độ ổn định chẩn đoán gần đây từ một Gateway đang chạy.

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
  Lọc theo loại sự kiện chẩn đoán, ví dụ: `payload.large` hoặc `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Chỉ bao gồm các sự kiện sau một số thứ tự chẩn đoán.
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
    - Bản ghi giữ lại siêu dữ liệu vận hành: tên sự kiện, số lượng, kích thước byte, số đo bộ nhớ, trạng thái hàng đợi/phiên, mã định danh phê duyệt, tên kênh/Plugin và bản tóm tắt phiên đã che thông tin nhạy cảm. Chúng loại trừ nội dung trò chuyện, phần thân Webhook, đầu ra công cụ, phần thân yêu cầu/phản hồi thô, token, cookie, giá trị bí mật, tên máy chủ và mã định danh phiên thô. Đặt `diagnostics.enabled: false` để tắt hoàn toàn bộ ghi.
    - Các lần Gateway thoát nghiêm trọng, hết thời gian chờ khi tắt và lỗi khởi động sau khi khởi động lại sẽ ghi cùng ảnh chụp nhanh chẩn đoán vào `~/.openclaw/logs/stability/openclaw-stability-*.json` khi bộ ghi có sự kiện. Kiểm tra gói mới nhất bằng `openclaw gateway stability --bundle latest`; `--limit`, `--type` và `--since-seq` cũng áp dụng cho đầu ra của gói.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Ghi một tệp zip chẩn đoán cục bộ được thiết kế cho báo cáo lỗi. Để biết mô hình quyền riêng tư và nội dung gói, hãy xem [Xuất dữ liệu chẩn đoán](/vi/gateway/diagnostics).

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
  URL WebSocket của Gateway cho bản chụp nhanh tình trạng.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token Gateway cho bản chụp nhanh tình trạng.
</ParamField>
<ParamField path="--password <password>" type="string">
  Mật khẩu Gateway cho bản chụp nhanh tình trạng.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Thời gian chờ của bản chụp nhanh trạng thái/tình trạng.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Bỏ qua việc tra cứu gói ổn định đã lưu.
</ParamField>
<ParamField path="--json" type="boolean">
  In đường dẫn đã ghi, kích thước và tệp kê khai dưới dạng JSON.
</ParamField>

Bản xuất đóng gói: `manifest.json` (danh mục tệp), `summary.md` (bản tóm tắt Markdown), `diagnostics.json` (bản tóm tắt cấu hình/nhật ký/khám phá/độ ổn định/trạng thái/tình trạng cấp cao nhất), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` và `stability/latest.json` khi có gói.

Bản xuất này được thiết kế để chia sẻ. Nó giữ lại các chi tiết vận hành hữu ích cho việc gỡ lỗi — các trường nhật ký an toàn, tên hệ thống con, mã trạng thái, khoảng thời gian, chế độ đã cấu hình, cổng, mã định danh Plugin/nhà cung cấp, cài đặt tính năng không bí mật và thông báo nhật ký vận hành đã được che bớt — đồng thời loại bỏ hoặc che bớt nội dung trò chuyện, nội dung Webhook, đầu ra công cụ, thông tin xác thực, cookie, mã định danh tài khoản/tin nhắn, nội dung lời nhắc/chỉ dẫn, tên máy chủ và các giá trị bí mật. Khi một thông báo nhật ký có vẻ là nội dung tải trọng của người dùng/cuộc trò chuyện/công cụ (ví dụ: "người dùng đã nói", "nội dung trò chuyện", "đầu ra công cụ", "nội dung Webhook"), bản xuất chỉ giữ lại thông tin rằng một thông báo đã bị loại bỏ cùng với số byte của thông báo đó.

### `gateway status`

Hiển thị dịch vụ Gateway (launchd/systemd/schtasks) cùng với phép kiểm tra kết nối/xác thực tùy chọn.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Thêm một đích kiểm tra rõ ràng. Địa chỉ từ xa đã cấu hình và localhost vẫn được kiểm tra.
</ParamField>
<ParamField path="--token <token>" type="string">
  Xác thực bằng token cho phép kiểm tra.
</ParamField>
<ParamField path="--password <password>" type="string">
  Xác thực bằng mật khẩu cho phép kiểm tra.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Thời gian chờ của phép kiểm tra.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Bỏ qua phép kiểm tra kết nối (chỉ hiển thị dịch vụ).
</ParamField>
<ParamField path="--deep" type="boolean">
  Quét cả các dịch vụ cấp hệ thống.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Nâng cấp phép kiểm tra kết nối thành phép kiểm tra đọc và thoát với mã khác 0 nếu thất bại. Không thể kết hợp với `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Ngữ nghĩa trạng thái">
    - Vẫn khả dụng cho mục đích chẩn đoán ngay cả khi cấu hình CLI cục bộ bị thiếu hoặc không hợp lệ.
    - Đầu ra mặc định xác minh trạng thái dịch vụ, kết nối WebSocket và khả năng xác thực hiển thị tại thời điểm bắt tay — không xác minh các thao tác đọc/ghi/quản trị.
    - Các phép kiểm tra không làm thay đổi trạng thái đối với việc xác thực thiết bị lần đầu: chúng sử dụng lại token thiết bị hiện có trong bộ nhớ đệm khi có, nhưng không bao giờ tạo danh tính thiết bị CLI mới hoặc bản ghi ghép nối chỉ đọc chỉ để kiểm tra trạng thái.
    - Phân giải các SecretRef xác thực đã cấu hình để xác thực phép kiểm tra khi có thể. Nếu một SecretRef bắt buộc chưa được phân giải, `--json` báo cáo `rpc.authWarning` khi kết nối/xác thực của phép kiểm tra thất bại; hãy truyền rõ ràng `--token`/`--password` hoặc sửa nguồn bí mật. Cảnh báo xác thực chưa phân giải sẽ bị ẩn sau khi phép kiểm tra thành công.
    - Đầu ra JSON bao gồm `gateway.version` khi Gateway đang chạy báo cáo giá trị này; `--require-rpc` có thể dùng tải trọng RPC `status.runtimeVersion` làm phương án dự phòng nếu phép kiểm tra bắt tay không thể cung cấp siêu dữ liệu phiên bản.
    - Dùng `--require-rpc` trong tập lệnh/tự động hóa khi một dịch vụ đang lắng nghe là chưa đủ và RPC phạm vi đọc cũng cần hoạt động bình thường.
    - `--deep` quét các bản cài đặt launchd/systemd/schtasks bổ sung; khi tìm thấy nhiều dịch vụ tương tự Gateway, đầu ra dành cho người dùng in các gợi ý dọn dẹp (thường chỉ nên chạy một Gateway trên mỗi máy) và báo cáo lần bàn giao khởi động lại gần đây của trình giám sát khi thích hợp.
    - `--deep` cũng chạy xác thực cấu hình ở chế độ nhận biết Plugin (`pluginValidation: "full"`) và hiển thị cảnh báo tệp kê khai Plugin (ví dụ: thiếu siêu dữ liệu cấu hình kênh). `gateway status` mặc định giữ đường dẫn chỉ đọc nhanh, bỏ qua việc xác thực Plugin.
    - Đầu ra dành cho người dùng bao gồm đường dẫn tệp nhật ký đã phân giải cùng với đường dẫn/tính hợp lệ của cấu hình CLI so với dịch vụ để giúp chẩn đoán sự sai lệch của hồ sơ hoặc thư mục trạng thái.

  </Accordion>
  <Accordion title="Kiểm tra sai lệch xác thực systemd trên Linux">
    - Các phép kiểm tra sai lệch xác thực của dịch vụ đọc cả `Environment=` và `EnvironmentFile=` từ đơn vị dịch vụ (bao gồm `%h`, đường dẫn trong dấu ngoặc kép, nhiều tệp và các tệp tùy chọn có tiền tố `-`).
    - Phân giải các SecretRef `gateway.auth.token` bằng môi trường thời gian chạy đã hợp nhất (môi trường lệnh dịch vụ trước, sau đó dùng môi trường tiến trình làm phương án dự phòng).
    - Các phép kiểm tra sai lệch token bỏ qua việc phân giải token cấu hình khi xác thực bằng token không thực sự hoạt động (`gateway.auth.mode` được đặt rõ ràng là `password`/`none`/`trusted-proxy`, hoặc chế độ chưa được đặt trong trường hợp mật khẩu có thể được ưu tiên và không có ứng viên token nào có thể được ưu tiên).

  </Accordion>
</AccordionGroup>

### `gateway probe`

Lệnh "gỡ lỗi mọi thứ". Lệnh này luôn kiểm tra:

- Gateway từ xa đã cấu hình của bạn (nếu có), và
- localhost (local loopback), **ngay cả khi địa chỉ từ xa đã được cấu hình**.

Truyền `--url` sẽ thêm đích rõ ràng đó trước cả hai đích trên. Đầu ra dành cho người dùng gắn nhãn các đích là `URL (được chỉ định rõ ràng)`, `Từ xa (đã cấu hình)` / `Từ xa (đã cấu hình, không hoạt động)` và `Local loopback`.

<Note>
Nếu có thể truy cập nhiều đích kiểm tra, tất cả đều được in ra. Đường hầm SSH, URL TLS/proxy và URL từ xa đã cấu hình có thể trỏ tới cùng một Gateway ngay cả khi dùng các cổng truyền tải khác nhau; `multiple_gateways` chỉ dành cho các Gateway có thể truy cập nhưng khác nhau hoặc có danh tính không rõ ràng. Việc chạy nhiều Gateway được hỗ trợ cho các hồ sơ cô lập (ví dụ: bot cứu hộ), nhưng hầu hết bản cài đặt chỉ chạy một Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Dùng cổng này cho đích kiểm tra local loopback và cổng từ xa của đường hầm SSH. Khi không có `--url`, tùy chọn này chỉ chọn đích local loopback thay vì URL môi trường Gateway đã cấu hình, cổng môi trường hoặc các đích từ xa.
</ParamField>

<AccordionGroup>
  <Accordion title="Diễn giải">
    - `Có thể truy cập: có` nghĩa là ít nhất một đích đã chấp nhận kết nối WebSocket.
    - `Khả năng: chỉ đọc|có thể ghi|có thể quản trị|đang chờ ghép nối|chỉ kết nối` báo cáo điều mà phép kiểm tra có thể xác minh về xác thực, tách biệt với khả năng truy cập.
    - `Phép kiểm tra đọc: đạt` nghĩa là các lệnh gọi RPC chi tiết thuộc phạm vi đọc (`health`/`status`/`system-presence`/`config.get`) cũng thành công.
    - `Phép kiểm tra đọc: bị giới hạn - thiếu phạm vi: operator.read` nghĩa là kết nối thành công nhưng RPC phạm vi đọc bị giới hạn. Được báo cáo là khả năng truy cập **suy giảm**, không phải thất bại hoàn toàn.
    - `Phép kiểm tra đọc: thất bại` sau `Kết nối: đạt` nghĩa là WebSocket đã kết nối nhưng chẩn đoán đọc tiếp theo đã hết thời gian chờ hoặc thất bại — cũng là **suy giảm**, không phải không thể truy cập.
    - Giống như `gateway status`, phép kiểm tra sử dụng lại thông tin xác thực thiết bị hiện có trong bộ nhớ đệm nhưng không tạo danh tính thiết bị hoặc trạng thái ghép nối lần đầu.
    - Mã thoát chỉ khác 0 khi không thể truy cập bất kỳ đích nào được kiểm tra.

  </Accordion>
  <Accordion title="Đầu ra JSON">
    Cấp cao nhất:

    - `ok`: có thể truy cập ít nhất một đích.
    - `degraded`: ít nhất một đích đã chấp nhận kết nối nhưng không hoàn tất đầy đủ chẩn đoán RPC chi tiết.
    - `capability`: khả năng tốt nhất được ghi nhận trên các đích có thể truy cập (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` hoặc `unknown`).
    - `primaryTargetId`: đích tốt nhất để coi là đích đang hoạt động, theo thứ tự: URL rõ ràng, đường hầm SSH, địa chỉ từ xa đã cấu hình, local loopback.
    - `warnings[]`: các bản ghi cảnh báo theo nỗ lực tối đa với `code`, `message`, `targetIds` tùy chọn.
    - `network`: các gợi ý URL local loopback/tailnet được suy ra từ cấu hình hiện tại và mạng của máy chủ.
    - `discovery.timeoutMs` / `discovery.count`: ngân sách khám phá/số lượng kết quả thực tế được dùng cho lượt kiểm tra này.

    Theo từng đích (`targets[].connect`): `ok` (khả năng truy cập + phân loại suy giảm), `rpcOk` (RPC chi tiết đầy đủ thành công), `scopeLimited` (RPC chi tiết thất bại do thiếu phạm vi toán tử).

    Theo từng đích (`targets[].auth`): `role` và `scopes` được báo cáo trong `hello-ok` khi có, cùng với phân loại `capability` được hiển thị.

  </Accordion>
  <Accordion title="Các mã cảnh báo thường gặp">
    - `ssh_tunnel_failed`: thiết lập đường hầm SSH thất bại; lệnh đã dùng các phép kiểm tra trực tiếp làm phương án dự phòng.
    - `multiple_gateways`: có thể truy cập các danh tính Gateway khác nhau, hoặc OpenClaw không thể xác minh rằng các đích có thể truy cập là cùng một Gateway. Đường hầm SSH, URL proxy hoặc URL từ xa đã cấu hình trỏ tới cùng một Gateway sẽ không kích hoạt cảnh báo này.
    - `auth_secretref_unresolved`: không thể phân giải SecretRef xác thực đã cấu hình cho một đích thất bại.
    - `probe_scope_limited`: kết nối WebSocket thành công, nhưng phép kiểm tra đọc bị giới hạn do thiếu `operator.read`.
    - `local_tls_runtime_unavailable`: TLS của Gateway cục bộ đã được bật nhưng OpenClaw không thể tải dấu vân tay chứng chỉ cục bộ.

  </Accordion>
</AccordionGroup>

#### Từ xa qua SSH (tương đương ứng dụng Mac)

Chế độ "Remote over SSH" của ứng dụng macOS sử dụng chuyển tiếp cổng cục bộ để một Gateway từ xa chỉ dùng local loopback có thể được truy cập tại `ws://127.0.0.1:<port>`.

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
  Chọn máy chủ Gateway đầu tiên được khám phá làm đích SSH từ điểm cuối khám phá đã phân giải (`local.` cộng với miền diện rộng đã cấu hình, nếu có). Các gợi ý chỉ có TXT sẽ bị bỏ qua.
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
  Token Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  Mật khẩu Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Ngân sách thời gian chờ.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Chủ yếu dành cho các RPC kiểu tác tử truyền phát các sự kiện trung gian trước tải trọng cuối cùng.
</ParamField>
<ParamField path="--json" type="boolean">
  Đầu ra JSON có thể đọc bằng máy.
</ParamField>

<Note>
`--params` phải là JSON hợp lệ và mỗi phương thức xác thực hình dạng tham số riêng của nó (các trường thừa hoặc đặt sai tên sẽ bị từ chối).
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

Dùng `--wrapper` khi dịch vụ được quản lý phải khởi động thông qua một tệp thực thi khác, chẳng hạn như một lớp đệm của trình quản lý bí mật hoặc trình trợ giúp chạy dưới danh nghĩa người dùng khác. Trình bao bọc nhận các đối số Gateway thông thường và chịu trách nhiệm cuối cùng thực thi `openclaw` hoặc Node với các đối số đó.

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

Bạn cũng có thể đặt trình bao bọc thông qua môi trường. `gateway install` xác thực rằng đường dẫn là một tệp thực thi, ghi trình bao bọc vào `ProgramArguments` của dịch vụ và lưu `OPENCLAW_WRAPPER` trong môi trường dịch vụ để dùng cho các lần buộc cài đặt lại, cập nhật và sửa chữa bằng doctor sau này.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Để xóa trình bao bọc đã lưu, hãy xóa giá trị `OPENCLAW_WRAPPER` trong khi cài đặt lại:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Tùy chọn lệnh">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>` (mặc định: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Hành vi vòng đời">
    - Sử dụng `gateway restart` để khởi động lại một dịch vụ được quản lý. Không nối tiếp `gateway stop` và `gateway start` để thay thế thao tác khởi động lại.
    - Trên macOS, theo mặc định, `gateway stop` sử dụng `launchctl bootout`, thao tác này xóa LaunchAgent khỏi phiên khởi động hiện tại mà không lưu trạng thái vô hiệu hóa — khả năng tự động khôi phục của KeepAlive vẫn hoạt động cho các sự cố sau này và `gateway start` bật lại một cách bình thường mà không cần chạy `launchctl enable` thủ công. Truyền `--disable` để ngăn KeepAlive và RunAtLoad một cách lâu dài, nhờ đó Gateway không khởi chạy lại cho đến lần chạy `gateway start` rõ ràng tiếp theo; hãy dùng tùy chọn này khi cần duy trì trạng thái dừng thủ công sau khi khởi động lại hệ thống.
    - Các lệnh vòng đời chấp nhận `--json` để dùng trong tập lệnh.

  </Accordion>
  <Accordion title="Xác thực và SecretRef tại thời điểm cài đặt">
    - Khi xác thực bằng mã thông báo yêu cầu mã thông báo và `gateway.auth.token` được quản lý bằng SecretRef, `gateway install` xác thực rằng SecretRef có thể được phân giải nhưng không lưu mã thông báo đã phân giải vào siêu dữ liệu môi trường dịch vụ.
    - Nếu xác thực bằng mã thông báo yêu cầu mã thông báo nhưng SecretRef mã thông báo đã cấu hình không thể phân giải, quá trình cài đặt sẽ từ chối tiếp tục thay vì lưu văn bản thuần dự phòng.
    - Đối với xác thực bằng mật khẩu trên `gateway run`, nên dùng `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` hoặc `gateway.auth.password` được hỗ trợ bởi SecretRef thay vì `--password` nội tuyến.
    - Trong chế độ xác thực được suy luận, `OPENCLAW_GATEWAY_PASSWORD` chỉ có trong shell không làm giảm yêu cầu về mã thông báo khi cài đặt; hãy dùng cấu hình lâu dài (`gateway.auth.password` hoặc `env` trong cấu hình) khi cài đặt một dịch vụ được quản lý.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình nhưng `gateway.auth.mode` chưa được đặt, quá trình cài đặt sẽ bị chặn cho đến khi chế độ được đặt rõ ràng.

  </Accordion>
</AccordionGroup>

## Khám phá các Gateway (Bonjour)

`gateway discover` quét tìm các tín hiệu Gateway (`_openclaw-gw._tcp`).

- DNS-SD đa hướng: `local.`
- DNS-SD đơn hướng (Bonjour diện rộng): chọn một miền (ví dụ: `openclaw.internal.`) và thiết lập DNS phân tách cùng một máy chủ DNS; xem [Bonjour](/vi/gateway/bonjour).

Chỉ các Gateway đã bật tính năng khám phá Bonjour (mặc định) mới quảng bá tín hiệu.

Các gợi ý TXT trên mỗi tín hiệu: `role` (gợi ý vai trò Gateway), `transport` (gợi ý phương thức truyền tải, ví dụ: `gateway`), `gatewayPort` (cổng WebSocket, thường là `18789`), `tailnetDns` (tên máy chủ MagicDNS, khi khả dụng), `gatewayTls` / `gatewayTlsSha256` (TLS đã bật + dấu vân tay chứng chỉ). `sshPort` và `cliPath` chỉ được công bố trong chế độ khám phá đầy đủ (`discovery.mdns.mode: "full"`; mặc định là `"minimal"`, chế độ này lược bỏ chúng — khi đó, máy khách mặc định dùng cổng `22` cho đích SSH).

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Thời gian chờ cho mỗi lệnh (duyệt/phân giải).
</ParamField>
<ParamField path="--json" type="boolean">
  Đầu ra máy có thể đọc được (đồng thời tắt định dạng và biểu tượng tiến trình).
</ParamField>

Ví dụ:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- Quét `local.` cùng với miền diện rộng đã cấu hình khi miền đó được bật.
- `wsUrl` trong đầu ra JSON được suy ra từ điểm cuối dịch vụ đã phân giải, không phải từ các gợi ý chỉ có trong TXT như `lanHost` hoặc `tailnetDns`.
- `discovery.mdns.mode` kiểm soát việc công bố `sshPort`/`cliPath` trên cả mDNS `local.` và DNS-SD diện rộng (xem phần trên).

</Note>

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Sổ tay vận hành Gateway](/vi/gateway)
