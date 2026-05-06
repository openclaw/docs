---
read_when:
    - Chạy hoặc gỡ lỗi tiến trình Gateway
summary: Sổ tay vận hành cho dịch vụ Gateway, vòng đời và các tác vụ vận hành
title: Sổ tay vận hành Gateway
x-i18n:
    generated_at: "2026-05-06T09:12:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 592eb379cc75402246676cbb23b1dca39b98f559c214c92983b5a3685cff7ab7
    source_path: gateway/index.md
    workflow: 16
---

Sử dụng trang này cho khởi động ngày đầu và vận hành ngày sau của dịch vụ Gateway.

<CardGroup cols={2}>
  <Card title="Khắc phục sự cố chuyên sâu" icon="siren" href="/vi/gateway/troubleshooting">
    Chẩn đoán theo triệu chứng trước, với các chuỗi lệnh chính xác và chữ ký nhật ký.
  </Card>
  <Card title="Cấu hình" icon="sliders" href="/vi/gateway/configuration">
    Hướng dẫn thiết lập theo tác vụ + tài liệu tham chiếu cấu hình đầy đủ.
  </Card>
  <Card title="Quản lý bí mật" icon="key-round" href="/vi/gateway/secrets">
    Hợp đồng SecretRef, hành vi ảnh chụp nhanh runtime, và các thao tác di chuyển/tải lại.
  </Card>
  <Card title="Hợp đồng kế hoạch bí mật" icon="shield-check" href="/vi/gateway/secrets-plan-contract">
    Quy tắc target/path chính xác của `secrets apply` và hành vi hồ sơ xác thực chỉ dùng tham chiếu.
  </Card>
</CardGroup>

## Khởi động cục bộ trong 5 phút

<Steps>
  <Step title="Khởi động Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Xác minh tình trạng dịch vụ">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Mốc cơ sở khỏe mạnh: `Runtime: running`, `Connectivity probe: ok`, và `Capability: ...` khớp với những gì bạn mong đợi. Dùng `openclaw gateway status --require-rpc` khi bạn cần bằng chứng RPC phạm vi đọc, không chỉ khả năng truy cập.

  </Step>

  <Step title="Xác thực mức sẵn sàng của kênh">

```bash
openclaw channels status --probe
```

Với một gateway có thể truy cập, lệnh này chạy các phép thăm dò kênh trực tiếp theo từng tài khoản và các kiểm tra tùy chọn.
Nếu gateway không thể truy cập, CLI sẽ chuyển sang tóm tắt kênh chỉ dựa trên cấu hình thay vì
đầu ra thăm dò trực tiếp.

  </Step>
</Steps>

<Note>
Tải lại cấu hình Gateway theo dõi đường dẫn tệp cấu hình đang hoạt động (được phân giải từ mặc định hồ sơ/trạng thái, hoặc `OPENCLAW_CONFIG_PATH` khi được đặt).
Chế độ mặc định là `gateway.reload.mode="hybrid"`.
Sau lần tải thành công đầu tiên, tiến trình đang chạy phục vụ ảnh chụp nhanh cấu hình trong bộ nhớ đang hoạt động; tải lại thành công sẽ hoán đổi ảnh chụp nhanh đó một cách nguyên tử.
</Note>

## Mô hình runtime

- Một tiến trình luôn bật cho định tuyến, control plane và kết nối kênh.
- Một cổng ghép kênh duy nhất cho:
  - Điều khiển/RPC WebSocket
  - API HTTP, tương thích OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI và hook
- Chế độ bind mặc định: `loopback`.
- Xác thực được yêu cầu theo mặc định. Thiết lập dùng bí mật dùng chung sử dụng
  `gateway.auth.token` / `gateway.auth.password` (hoặc
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), và các thiết lập reverse proxy
  không phải loopback có thể dùng `gateway.auth.mode: "trusted-proxy"`.

## Endpoint tương thích OpenAI

Bề mặt tương thích có đòn bẩy cao nhất của OpenClaw hiện là:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Vì sao tập hợp này quan trọng:

- Hầu hết tích hợp Open WebUI, LobeChat và LibreChat thăm dò `/v1/models` trước.
- Nhiều pipeline RAG và bộ nhớ kỳ vọng `/v1/embeddings`.
- Các client gốc agent ngày càng ưu tiên `/v1/responses`.

Ghi chú lập kế hoạch:

- `/v1/models` ưu tiên agent: nó trả về `openclaw`, `openclaw/default`, và `openclaw/<agentId>`.
- `openclaw/default` là bí danh ổn định luôn ánh xạ tới agent mặc định đã cấu hình.
- Dùng `x-openclaw-model` khi bạn muốn ghi đè provider/model backend; nếu không, thiết lập model và embedding bình thường của agent đã chọn vẫn nắm quyền điều khiển.

Tất cả các endpoint này chạy trên cổng Gateway chính và dùng cùng ranh giới xác thực operator đáng tin cậy như phần còn lại của API HTTP Gateway.

### Thứ tự ưu tiên cổng và bind

| Thiết lập    | Thứ tự phân giải                                             |
| ------------ | ------------------------------------------------------------- |
| Cổng Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Chế độ bind  | CLI/ghi đè → `gateway.bind` → `loopback`                    |

Các dịch vụ gateway đã cài đặt ghi lại `--port` đã phân giải trong siêu dữ liệu supervisor. Sau khi thay đổi `gateway.port`, chạy `openclaw doctor --fix` hoặc `openclaw gateway install --force` để launchd/systemd/schtasks khởi động tiến trình trên cổng mới.

Khởi động Gateway dùng cùng cổng và bind hiệu dụng khi nó gieo origin
Control UI cục bộ cho bind không phải loopback. Ví dụ, `--bind lan --port 3000`
gieo `http://localhost:3000` và `http://127.0.0.1:3000` trước khi xác thực
runtime chạy. Thêm mọi origin trình duyệt từ xa, chẳng hạn URL proxy HTTPS, vào
`gateway.controlUi.allowedOrigins` một cách tường minh.

### Chế độ tải lại nóng

| `gateway.reload.mode` | Hành vi                                      |
| --------------------- | ------------------------------------------- |
| `off`                 | Không tải lại cấu hình                      |
| `hot`                 | Chỉ áp dụng các thay đổi an toàn khi nóng   |
| `restart`             | Khởi động lại khi có thay đổi cần tải lại   |
| `hybrid` (mặc định)   | Áp dụng nóng khi an toàn, khởi động lại khi cần |

## Bộ lệnh operator

```bash
openclaw gateway status
openclaw gateway status --deep   # adds a system-level service scan
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` dùng để phát hiện dịch vụ bổ sung (LaunchDaemons/đơn vị hệ thống systemd/schtasks), không phải là phép thăm dò tình trạng RPC sâu hơn.

## Nhiều gateway (cùng máy chủ)

Hầu hết cài đặt nên chạy một gateway trên mỗi máy. Một gateway duy nhất có thể lưu trữ nhiều
agent và kênh.

Bạn chỉ cần nhiều gateway khi chủ đích muốn cô lập hoặc có bot cứu hộ.

Các kiểm tra hữu ích:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Điều cần kỳ vọng:

- `gateway status --deep` có thể báo cáo `Other gateway-like services detected (best effort)`
  và in gợi ý dọn dẹp khi các cài đặt launchd/systemd/schtasks cũ vẫn còn.
- `gateway probe` có thể cảnh báo về `multiple reachable gateways` khi nhiều hơn một target
  phản hồi.
- Nếu đó là chủ đích, hãy cô lập cổng, cấu hình/trạng thái, và thư mục gốc workspace cho từng gateway.

Danh sách kiểm tra cho mỗi phiên bản:

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
Dự phòng: đường hầm SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Sau đó kết nối client cục bộ tới `ws://127.0.0.1:18789`.

<Warning>
Đường hầm SSH không bỏ qua xác thực gateway. Với xác thực bí mật dùng chung, client vẫn
phải gửi `token`/`password` ngay cả qua đường hầm. Với các chế độ mang danh tính,
yêu cầu vẫn phải thỏa mãn đường dẫn xác thực đó.
</Warning>

Xem: [Gateway từ xa](/vi/gateway/remote), [Xác thực](/vi/gateway/authentication), [Tailscale](/vi/gateway/tailscale).

## Giám sát và vòng đời dịch vụ

Dùng các lần chạy được giám sát để có độ tin cậy giống môi trường production.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Dùng `openclaw gateway restart` để khởi động lại. Không nối chuỗi `openclaw gateway stop` và `openclaw gateway start`; trên macOS, `gateway stop` chủ đích vô hiệu hóa LaunchAgent trước khi dừng nó.

Nhãn LaunchAgent là `ai.openclaw.gateway` (mặc định) hoặc `ai.openclaw.<profile>` (hồ sơ có tên). `openclaw doctor` kiểm tra và sửa sai lệch cấu hình dịch vụ.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Để duy trì sau khi đăng xuất, bật lingering:

```bash
sudo loginctl enable-linger <user>
```

Ví dụ user-unit thủ công khi bạn cần đường dẫn cài đặt tùy chỉnh:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Khởi động được quản lý native trên Windows dùng Scheduled Task có tên `OpenClaw Gateway`
(hoặc `OpenClaw Gateway (<profile>)` cho hồ sơ có tên). Nếu việc tạo Scheduled Task
bị từ chối, OpenClaw chuyển sang launcher trong thư mục Startup theo từng người dùng
trỏ tới `gateway.cmd` bên trong thư mục trạng thái.

  </Tab>

  <Tab title="Linux (system service)">

Dùng system unit cho máy chủ nhiều người dùng/luôn bật.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Dùng cùng phần thân dịch vụ như user unit, nhưng cài đặt nó dưới
`/etc/systemd/system/openclaw-gateway[-<profile>].service` và điều chỉnh
`ExecStart=` nếu binary `openclaw` của bạn nằm ở nơi khác.

Đừng để `openclaw doctor --fix` cũng cài đặt dịch vụ gateway cấp người dùng cho cùng hồ sơ/cổng. Doctor từ chối cài đặt tự động đó khi tìm thấy dịch vụ gateway OpenClaw cấp hệ thống; dùng `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi system unit sở hữu vòng đời.

  </Tab>
</Tabs>

## Lối nhanh cho hồ sơ dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Mặc định bao gồm trạng thái/cấu hình cô lập và cổng gateway cơ sở `19001`.

## Tham chiếu nhanh protocol (góc nhìn operator)

- Khung client đầu tiên phải là `connect`.
- Gateway trả về ảnh chụp nhanh `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, giới hạn/chính sách).
- `hello-ok.features.methods` / `events` là danh sách phát hiện thận trọng, không phải
  bản xuất được tạo của mọi tuyến helper có thể gọi.
- Yêu cầu: `req(method, params)` → `res(ok/payload|error)`.
- Các sự kiện phổ biến gồm `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, các sự kiện vòng đời ghép cặp/phê duyệt, và `shutdown`.

Các lần chạy agent có hai giai đoạn:

1. Ack chấp nhận tức thì (`status:"accepted"`)
2. Phản hồi hoàn tất cuối cùng (`status:"ok"|"error"`), với các sự kiện `agent` được stream ở giữa.

Xem tài liệu protocol đầy đủ: [Protocol Gateway](/vi/gateway/protocol).

## Kiểm tra vận hành

### Liveness

- Mở WS và gửi `connect`.
- Kỳ vọng phản hồi `hello-ok` kèm ảnh chụp nhanh.

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Khôi phục khoảng trống

Sự kiện không được phát lại. Khi có khoảng trống trình tự, làm mới trạng thái (`health`, `system-presence`) trước khi tiếp tục.

## Chữ ký lỗi phổ biến

| Chữ ký                                                        | Vấn đề có khả năng xảy ra                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | Bind không phải loopback mà không có đường dẫn xác thực gateway hợp lệ          |
| `another gateway instance is already listening` / `EADDRINUSE` | Xung đột cổng                                                                   |
| `Gateway start blocked: set gateway.mode=local`               | Cấu hình được đặt sang chế độ từ xa, hoặc dấu chế độ cục bộ bị thiếu trong cấu hình hỏng |
| `unauthorized` during connect                                 | Không khớp xác thực giữa client và gateway                                      |

Để có đầy đủ các chuỗi chẩn đoán, dùng [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting).

## Bảo đảm an toàn

- Máy khách giao thức Gateway báo lỗi ngay khi Gateway không khả dụng (không có dự phòng ngầm sang kênh trực tiếp).
- Các khung đầu tiên không hợp lệ/không phải kết nối bị từ chối và đóng.
- Tắt máy nhẹ nhàng phát sự kiện `shutdown` trước khi đóng ổ cắm.

---

Liên quan:

- [Khắc phục sự cố](/vi/gateway/troubleshooting)
- [Tiến trình nền](/vi/gateway/background-process)
- [Cấu hình](/vi/gateway/configuration)
- [Sức khỏe](/vi/gateway/health)
- [Doctor](/vi/gateway/doctor)
- [Xác thực](/vi/gateway/authentication)

## Liên quan

- [Cấu hình](/vi/gateway/configuration)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
- [Truy cập từ xa](/vi/gateway/remote)
- [Quản lý bí mật](/vi/gateway/secrets)
