---
read_when:
    - Chạy hoặc gỡ lỗi tiến trình Gateway
summary: Cẩm nang vận hành dịch vụ Gateway, vòng đời và hoạt động vận hành
title: Sổ tay vận hành Gateway
x-i18n:
    generated_at: "2026-07-16T15:17:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d8b50b6041905c321887ea0f579f8d4c3b74552b2b72c37ec655e43a53dfc130
    source_path: gateway/index.md
    workflow: 16
---

Dùng trang này để khởi động ngày đầu tiên và vận hành từ ngày thứ hai trở đi cho dịch vụ Gateway.

<CardGroup cols={2}>
  <Card title="Khắc phục sự cố chuyên sâu" icon="siren" href="/vi/gateway/troubleshooting">
    Chẩn đoán theo triệu chứng với chuỗi lệnh chính xác và dấu hiệu nhật ký.
  </Card>
  <Card title="Cấu hình" icon="sliders" href="/vi/gateway/configuration">
    Hướng dẫn thiết lập theo tác vụ + tài liệu tham khảo cấu hình đầy đủ.
  </Card>
  <Card title="Quản lý bí mật" icon="key-round" href="/vi/gateway/secrets">
    Hợp đồng SecretRef, hành vi ảnh chụp nhanh khi chạy và các thao tác di chuyển/tải lại.
  </Card>
  <Card title="Hợp đồng kế hoạch bí mật" icon="shield-check" href="/vi/gateway/secrets-plan-contract">
    Các quy tắc đích/đường dẫn chính xác của `secrets apply` và hành vi hồ sơ xác thực chỉ dùng tham chiếu.
  </Card>
</CardGroup>

## Khởi động cục bộ trong 5 phút

<Steps>
  <Step title="Khởi động Gateway">

```bash
openclaw gateway --port 18789
# phản chiếu debug/trace sang stdio
openclaw gateway --port 18789 --verbose
# buộc dừng trình lắng nghe trên cổng đã chọn, rồi khởi động
openclaw gateway --force
```

  </Step>

  <Step title="Xác minh tình trạng dịch vụ">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Đường cơ sở lành mạnh: `Runtime: running`, `Connectivity probe: ok` và một dòng `Capability` khớp với điều bạn mong đợi. Dùng `openclaw gateway status --require-rpc` để chứng minh RPC phạm vi đọc, không chỉ khả năng kết nối.

  </Step>

  <Step title="Xác thực trạng thái sẵn sàng của kênh">

```bash
openclaw channels status --probe
```

Khi Gateway có thể truy cập, lệnh này chạy trực tiếp các phép thăm dò kênh theo từng tài khoản và các lượt kiểm tra tùy chọn. Nếu không thể truy cập Gateway, CLI chuyển sang bản tóm tắt kênh chỉ dựa trên cấu hình.

  </Step>
</Steps>

<Note>
Tính năng tải lại cấu hình Gateway theo dõi đường dẫn tệp cấu hình đang hoạt động (được phân giải từ giá trị mặc định của hồ sơ/trạng thái, hoặc `OPENCLAW_CONFIG_PATH` khi được đặt). Chế độ mặc định là `gateway.reload.mode="hybrid"`. Sau lần tải thành công đầu tiên, tiến trình đang chạy phục vụ ảnh chụp nhanh cấu hình đang hoạt động trong bộ nhớ; một lần tải lại thành công sẽ thay thế ảnh chụp nhanh đó theo cách nguyên tử.
</Note>

## Mô hình thời gian chạy

- Một tiến trình luôn bật để định tuyến, vận hành mặt phẳng điều khiển và kết nối kênh.
- Một cổng ghép kênh duy nhất cho:
  - Điều khiển/RPC qua WebSocket
  - Các API HTTP (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Các tuyến HTTP của Plugin, chẳng hạn như `/api/v1/admin/rpc` tùy chọn
  - Giao diện điều khiển và các hook
- Chế độ liên kết mặc định: `loopback`. Bên trong môi trường container được phát hiện, giá trị mặc định hiệu dụng là `auto` (phân giải thành `0.0.0.0` để chuyển tiếp cổng), trừ khi Tailscale serve/funnel đang hoạt động; trường hợp đó luôn buộc dùng `loopback`.
- Xác thực được yêu cầu theo mặc định. Các thiết lập bí mật dùng chung sử dụng `gateway.auth.token` / `gateway.auth.password` (hoặc `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), còn các thiết lập proxy ngược không phải loopback có thể sử dụng `gateway.auth.mode: "trusted-proxy"`.

## Điểm cuối tương thích với OpenAI

Bề mặt tương thích có tác động lớn nhất của OpenClaw:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Lý do tập hợp này quan trọng:

- Hầu hết tích hợp Open WebUI, LobeChat và LibreChat thăm dò `/v1/models` trước.
- Nhiều quy trình RAG và bộ nhớ yêu cầu `/v1/embeddings`.
- Các ứng dụng khách dành riêng cho tác nhân ngày càng ưu tiên `/v1/responses`.

`/v1/models` ưu tiên tác nhân: điểm cuối này trả về `openclaw`, `openclaw/default` và `openclaw/<agentId>` cho mọi tác nhân đã cấu hình. `openclaw/default` là bí danh ổn định luôn ánh xạ đến tác nhân mặc định đã cấu hình. Gửi `x-openclaw-model` khi bạn muốn ghi đè nhà cung cấp/mô hình phía máy chủ; nếu không, thiết lập mô hình và embedding thông thường của tác nhân đã chọn vẫn nắm quyền kiểm soát.

Tất cả các điểm cuối này chạy trên cổng Gateway chính và sử dụng cùng ranh giới xác thực dành cho người vận hành đáng tin cậy như phần còn lại của API HTTP Gateway.

RPC quản trị qua HTTP (`POST /api/v1/admin/rpc`) là một tuyến Plugin riêng biệt, mặc định tắt, dành cho công cụ trên máy chủ không thể sử dụng RPC qua WebSocket. Xem [RPC quản trị qua HTTP](/vi/plugins/admin-http-rpc).

### Thứ tự ưu tiên cổng và liên kết

| Thiết lập      | Thứ tự phân giải                                                     |
| ------------ | -------------------------------------------------------------------- |
| Cổng Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789`        |
| Chế độ liên kết    | CLI/ghi đè → `gateway.bind` → `loopback` (hoặc `auto` trong container) |

Các dịch vụ Gateway đã cài đặt ghi lại `--port` đã phân giải trong siêu dữ liệu của trình giám sát. Sau khi thay đổi `gateway.port`, hãy chạy `openclaw doctor --fix` hoặc `openclaw gateway install --force` để launchd/systemd/schtasks khởi động tiến trình trên cổng mới.

Quá trình khởi động Gateway sử dụng cùng cổng và liên kết hiệu dụng khi tạo sẵn các nguồn gốc Giao diện điều khiển cục bộ cho các liên kết không phải loopback. Ví dụ, `--bind lan --port 3000` tạo sẵn `http://localhost:3000` và `http://127.0.0.1:3000` trước khi chạy xác thực thời gian chạy. Thêm rõ ràng mọi nguồn gốc trình duyệt từ xa, chẳng hạn như URL proxy HTTPS, vào `gateway.controlUi.allowedOrigins`.

### Các chế độ tải lại nóng

| `gateway.reload.mode` | Hành vi                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | Không tải lại cấu hình                           |
| `hot`                 | Chỉ áp dụng các thay đổi an toàn khi tải nóng                |
| `restart`             | Khởi động lại khi có thay đổi yêu cầu tải lại         |
| `hybrid` (mặc định)    | Áp dụng nóng khi an toàn, khởi động lại khi cần |

## Bộ lệnh dành cho người vận hành

```bash
openclaw gateway status
openclaw gateway status --deep   # thêm thao tác quét dịch vụ ở cấp hệ thống
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` dùng để khám phá thêm dịch vụ (LaunchDaemons/đơn vị hệ thống systemd/schtasks), không phải để thăm dò tình trạng RPC chuyên sâu hơn.

## Nhiều Gateway (cùng máy chủ)

Hầu hết bản cài đặt nên chạy một Gateway trên mỗi máy. Một Gateway duy nhất có thể lưu trữ nhiều tác nhân và kênh. Bạn chỉ cần nhiều Gateway khi chủ đích muốn cô lập hoặc cần bot cứu hộ.

Các bước kiểm tra hữu ích:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Kết quả dự kiến:

- `gateway status --deep` có thể báo cáo `Other gateway-like services detected (best effort)` và in gợi ý dọn dẹp khi các bản cài đặt launchd/systemd/schtasks cũ vẫn còn tồn tại.
- `gateway probe` có thể cảnh báo về `multiple reachable gateway identities` khi các Gateway riêng biệt phản hồi hoặc khi OpenClaw không thể chứng minh các đích có thể truy cập là cùng một Gateway. Đường hầm SSH, URL proxy hoặc URL từ xa đã cấu hình đến cùng một Gateway vẫn là một Gateway với nhiều phương thức truyền tải, ngay cả khi các cổng truyền tải khác nhau.
- Nếu đây là chủ đích, hãy cô lập các cổng, cấu hình/trạng thái và thư mục gốc không gian làm việc theo từng Gateway.

Danh sách kiểm tra cho từng phiên bản:

- `gateway.port` duy nhất
- `OPENCLAW_CONFIG_PATH` duy nhất
- `OPENCLAW_STATE_DIR` duy nhất
- `agents.defaults.workspace` duy nhất

Ví dụ:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Thiết lập chi tiết: [/gateway/multiple-gateways](/vi/gateway/multiple-gateways).

## Truy cập từ xa

Ưu tiên: Tailscale/VPN.
Phương án dự phòng: đường hầm SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Sau đó kết nối các ứng dụng khách cục bộ với `ws://127.0.0.1:18789`.

<Warning>
Đường hầm SSH không bỏ qua xác thực Gateway. Đối với xác thực bằng bí mật dùng chung, ứng dụng khách vẫn
phải gửi `token`/`password` ngay cả qua đường hầm. Đối với các chế độ mang danh tính,
yêu cầu vẫn phải đáp ứng đường dẫn xác thực đó.
</Warning>

Xem: [Gateway từ xa](/vi/gateway/remote), [Xác thực](/vi/gateway/authentication), [Tailscale](/vi/gateway/tailscale).

## Giám sát và vòng đời dịch vụ

Dùng các lần chạy có giám sát để đạt độ tin cậy tương tự môi trường sản xuất.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Dùng `openclaw gateway restart` để khởi động lại. Không nối tiếp `openclaw gateway stop` và `openclaw gateway start` để thay thế thao tác khởi động lại.

Trên macOS, `gateway stop` mặc định sử dụng `launchctl bootout`. Thao tác này xóa LaunchAgent khỏi phiên khởi động hiện tại mà không lưu trạng thái vô hiệu hóa, nhờ đó khả năng tự động phục hồi KeepAlive vẫn hoạt động sau sự cố bất ngờ và `gateway start` kích hoạt lại một cách sạch sẽ. Để ngăn tự động tái khởi chạy một cách lâu dài qua các lần khởi động lại, hãy truyền `--disable`: `openclaw gateway stop --disable`.

Nhãn LaunchAgent là `ai.openclaw.gateway` (mặc định) hoặc `ai.openclaw.<profile>` (hồ sơ có tên). `openclaw doctor` kiểm tra và sửa sai lệch cấu hình dịch vụ.

  </Tab>

  <Tab title="Linux (systemd người dùng)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Để duy trì sau khi đăng xuất, hãy bật chế độ lingering:

```bash
sudo loginctl enable-linger $(whoami)
```

Trên máy chủ không màn hình và không có phiên máy tính để bàn, đồng thời bảo đảm `XDG_RUNTIME_DIR` được đặt (`export XDG_RUNTIME_DIR=/run/user/$(id -u)`) trước khi thử lại các lệnh `systemctl --user`.

Ví dụ đơn vị người dùng thủ công khi bạn cần đường dẫn cài đặt tùy chỉnh:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (gốc)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Khởi động được quản lý gốc trên Windows sử dụng một Tác vụ theo lịch có tên `OpenClaw Gateway`
(hoặc `OpenClaw Gateway (<profile>)` cho hồ sơ có tên). Nếu việc tạo Tác vụ theo lịch
bị từ chối, OpenClaw chuyển sang trình khởi chạy trong thư mục Startup theo từng người dùng,
trỏ đến `gateway.cmd` bên trong thư mục trạng thái.

  </Tab>

  <Tab title="Linux (dịch vụ hệ thống)">

Dùng đơn vị hệ thống cho máy chủ nhiều người dùng/luôn bật.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Dùng cùng nội dung dịch vụ như đơn vị người dùng, nhưng cài đặt dưới
`/etc/systemd/system/openclaw-gateway[-<profile>].service` và điều chỉnh
`ExecStart=` nếu tệp nhị phân `openclaw` nằm ở nơi khác.

Không đồng thời cho phép `openclaw doctor --fix` cài đặt dịch vụ Gateway cấp người dùng cho cùng hồ sơ/cổng. Doctor từ chối việc cài đặt tự động đó khi tìm thấy dịch vụ Gateway OpenClaw cấp hệ thống; dùng `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi đơn vị hệ thống sở hữu vòng đời.

  </Tab>
</Tabs>

Lỗi cấu hình không hợp lệ thoát với mã `78`. Các đơn vị systemd trên Linux sử dụng `RestartPreventExitStatus=78` để ngừng khởi chạy lại cho đến khi cấu hình được sửa. launchd và Windows Task Scheduler không có quy tắc dừng tương đương theo mã thoát, vì vậy Gateway cũng lưu lịch sử khởi động không sạch diễn ra nhanh và ngăn tự động khởi động tài khoản kênh/nhà cung cấp sau nhiều lần khởi động thất bại. Trong chế độ an toàn đó, mặt phẳng điều khiển vẫn khởi động để kiểm tra và sửa chữa, việc tải nóng cấu hình và `secrets.reload` từ chối tự động khởi động lại kênh, còn yêu cầu rõ ràng `channels.start` của người vận hành có thể ghi đè việc ngăn chặn.

## Đường dẫn nhanh cho hồ sơ phát triển

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Các giá trị mặc định bao gồm trạng thái/cấu hình cô lập và cổng Gateway cơ sở `19001`.

## Tham chiếu nhanh giao thức (góc nhìn người vận hành)

- Khung dữ liệu đầu tiên của máy khách phải là `connect`.
- Gateway trả về một khung `hello-ok` với `snapshot` (`presence`, `health`, `stateVersion`, `uptimeMs`) cùng các giới hạn `policy` (`maxPayload`, `maxBufferedBytes`, `tickIntervalMs`).
- `hello-ok.features.methods` / `events` là danh sách khám phá có tính thận trọng, không phải
  bản kết xuất được tạo tự động của mọi tuyến trợ giúp có thể gọi.
- Yêu cầu: `req(method, params)` → `res(ok/payload|error)`.
- Các sự kiện phổ biến gồm `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, sự kiện tùy chọn
  `session.approval`, `sessions.changed`, `presence`, `tick`, `health`,
  `heartbeat`, các sự kiện vòng đời ghép nối/phê duyệt và `shutdown`.

Các lượt chạy của tác nhân có hai giai đoạn:

1. Xác nhận đã chấp nhận ngay lập tức (`status:"accepted"`)
2. Phản hồi hoàn tất cuối cùng (`status:"ok"|"error"`), với các sự kiện `agent` được truyền phát ở giữa.

Xem tài liệu giao thức đầy đủ: [Giao thức Gateway](/vi/gateway/protocol).

## Kiểm tra vận hành

### Khả năng hoạt động

- Mở WS và gửi `connect`.
- Chờ phản hồi `hello-ok` kèm ảnh chụp trạng thái.

### Mức độ sẵn sàng

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Khôi phục khi có khoảng trống

Các sự kiện không được phát lại. Khi có khoảng trống trong chuỗi, hãy làm mới trạng thái (`health`, `system-presence`) trước khi tiếp tục.

## Các dấu hiệu lỗi phổ biến

| Dấu hiệu                                                        | Vấn đề có khả năng xảy ra                                                     |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Liên kết không phải loopback nhưng không có đường dẫn xác thực Gateway hợp lệ |
| `another gateway instance is already listening` / `EADDRINUSE` | Xung đột cổng                                                                |
| `Gateway start blocked: set gateway.mode=local`                | Cấu hình được đặt ở chế độ từ xa hoặc `gateway.mode` bị thiếu trong cấu hình bị hỏng |
| `unauthorized` trong khi kết nối                               | Xác thực không khớp giữa máy khách và Gateway                                |

Để xem đầy đủ các bước chẩn đoán, hãy dùng [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting).

## Bảo đảm an toàn

- Các máy khách giao thức Gateway dừng ngay khi Gateway không khả dụng (không có cơ chế ngầm định dự phòng trực tiếp sang kênh).
- Các khung đầu tiên không hợp lệ/không phải khung kết nối sẽ bị từ chối và đóng.
- Khi tắt đúng quy trình, sự kiện `shutdown` được phát trước khi đóng socket.

## Liên quan

- [Cấu hình](/vi/gateway/configuration)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
- [Tiến trình nền](/vi/gateway/background-process)
- [Tình trạng hệ thống](/vi/gateway/health)
- [Doctor](/vi/gateway/doctor)
- [Xác thực](/vi/gateway/authentication)
- [Truy cập từ xa](/vi/gateway/remote)
- [Quản lý thông tin bí mật](/vi/gateway/secrets)
