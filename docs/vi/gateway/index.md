---
read_when:
    - Chạy hoặc gỡ lỗi tiến trình Gateway
summary: Sổ tay vận hành cho dịch vụ Gateway, vòng đời và công tác vận hành
title: Sổ tay vận hành Gateway
x-i18n:
    generated_at: "2026-04-29T22:43:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14f3d288c426848bc176291ff084a2b63b00e81739cd02f31fdf517d230d8111
    source_path: gateway/index.md
    workflow: 16
---

Dùng trang này cho khởi động ngày đầu và vận hành ngày thứ hai của dịch vụ Gateway.

<CardGroup cols={2}>
  <Card title="Deep troubleshooting" icon="siren" href="/vi/gateway/troubleshooting">
    Chẩn đoán theo triệu chứng trước, với các chuỗi lệnh chính xác và dấu hiệu nhật ký.
  </Card>
  <Card title="Configuration" icon="sliders" href="/vi/gateway/configuration">
    Hướng dẫn thiết lập theo tác vụ + tài liệu tham chiếu cấu hình đầy đủ.
  </Card>
  <Card title="Secrets management" icon="key-round" href="/vi/gateway/secrets">
    Hợp đồng SecretRef, hành vi ảnh chụp nhanh lúc chạy, và thao tác di chuyển/tải lại.
  </Card>
  <Card title="Secrets plan contract" icon="shield-check" href="/vi/gateway/secrets-plan-contract">
    Quy tắc đích/đường dẫn chính xác của `secrets apply` và hành vi hồ sơ xác thực chỉ dùng tham chiếu.
  </Card>
</CardGroup>

## Khởi động cục bộ trong 5 phút

<Steps>
  <Step title="Start the Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Verify service health">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Đường cơ sở khỏe mạnh: `Runtime: running`, `Connectivity probe: ok`, và `Capability: ...` khớp với điều bạn mong đợi. Dùng `openclaw gateway status --require-rpc` khi bạn cần bằng chứng RPC phạm vi đọc, không chỉ khả năng truy cập được.

  </Step>

  <Step title="Validate channel readiness">

```bash
openclaw channels status --probe
```

Với một gateway có thể truy cập, lệnh này chạy các phép dò kênh trực tiếp theo từng tài khoản và các kiểm tra tùy chọn.
Nếu gateway không truy cập được, CLI sẽ chuyển sang phần tóm tắt kênh chỉ dựa trên cấu hình thay vì
kết quả dò trực tiếp.

  </Step>
</Steps>

<Note>
Tải lại cấu hình Gateway theo dõi đường dẫn tệp cấu hình đang hoạt động (được phân giải từ mặc định hồ sơ/trạng thái, hoặc `OPENCLAW_CONFIG_PATH` khi được đặt).
Chế độ mặc định là `gateway.reload.mode="hybrid"`.
Sau lần tải thành công đầu tiên, tiến trình đang chạy phục vụ ảnh chụp nhanh cấu hình đang hoạt động trong bộ nhớ; tải lại thành công sẽ hoán đổi ảnh chụp nhanh đó một cách nguyên tử.
</Note>

## Mô hình lúc chạy

- Một tiến trình luôn bật cho định tuyến, mặt phẳng điều khiển, và kết nối kênh.
- Một cổng ghép kênh duy nhất cho:
  - Điều khiển/RPC WebSocket
  - API HTTP, tương thích OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - UI điều khiển và hook
- Chế độ bind mặc định: `loopback`.
- Xác thực được yêu cầu theo mặc định. Thiết lập bí mật dùng chung sử dụng
  `gateway.auth.token` / `gateway.auth.password` (hoặc
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), và thiết lập reverse-proxy
  không phải loopback có thể dùng `gateway.auth.mode: "trusted-proxy"`.

## Endpoint tương thích OpenAI

Bề mặt tương thích có tác động cao nhất của OpenClaw hiện là:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Vì sao tập này quan trọng:

- Hầu hết tích hợp Open WebUI, LobeChat, và LibreChat dò `/v1/models` trước.
- Nhiều pipeline RAG và bộ nhớ kỳ vọng `/v1/embeddings`.
- Các client gốc tác nhân ngày càng ưu tiên `/v1/responses`.

Ghi chú lập kế hoạch:

- `/v1/models` ưu tiên tác nhân: nó trả về `openclaw`, `openclaw/default`, và `openclaw/<agentId>`.
- `openclaw/default` là bí danh ổn định luôn ánh xạ tới tác nhân mặc định đã cấu hình.
- Dùng `x-openclaw-model` khi bạn muốn ghi đè nhà cung cấp/mô hình backend; nếu không, mô hình và thiết lập embedding thông thường của tác nhân đã chọn vẫn nắm quyền kiểm soát.

Tất cả các mục này chạy trên cổng Gateway chính và dùng cùng ranh giới xác thực toán tử tin cậy như phần còn lại của API HTTP Gateway.

### Thứ tự ưu tiên cổng và bind

| Thiết lập      | Thứ tự phân giải                                              |
| ------------ | ------------------------------------------------------------- |
| Cổng Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Chế độ bind    | CLI/ghi đè → `gateway.bind` → `loopback`                    |

Các dịch vụ gateway đã cài đặt ghi lại `--port` đã phân giải trong metadata của supervisor. Sau khi đổi `gateway.port`, chạy `openclaw doctor --fix` hoặc `openclaw gateway install --force` để launchd/systemd/schtasks khởi động tiến trình trên cổng mới.

Khởi động Gateway dùng cùng cổng và bind hiệu lực khi nó gieo các origin
Control UI cục bộ cho bind không phải loopback. Ví dụ, `--bind lan --port 3000`
gieo `http://localhost:3000` và `http://127.0.0.1:3000` trước khi xác thực
lúc chạy diễn ra. Thêm rõ ràng mọi origin trình duyệt từ xa, chẳng hạn URL proxy HTTPS, vào
`gateway.controlUi.allowedOrigins`.

### Chế độ tải lại nóng

| `gateway.reload.mode` | Hành vi                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | Không tải lại cấu hình                           |
| `hot`                 | Chỉ áp dụng các thay đổi an toàn khi nóng                |
| `restart`             | Khởi động lại khi có thay đổi yêu cầu tải lại         |
| `hybrid` (mặc định)    | Áp dụng nóng khi an toàn, khởi động lại khi cần |

## Bộ lệnh cho toán tử

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

`gateway status --deep` dành cho khám phá dịch vụ bổ sung (LaunchDaemons/systemd system
units/schtasks), không phải phép dò sức khỏe RPC sâu hơn.

## Nhiều gateway (cùng máy chủ)

Hầu hết cài đặt nên chạy một gateway trên mỗi máy. Một gateway duy nhất có thể lưu trữ nhiều
tác nhân và kênh.

Bạn chỉ cần nhiều gateway khi chủ ý muốn cô lập hoặc có bot cứu hộ.

Các kiểm tra hữu ích:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Điều cần kỳ vọng:

- `gateway status --deep` có thể báo cáo `Other gateway-like services detected (best effort)`
  và in gợi ý dọn dẹp khi các cài đặt launchd/systemd/schtasks cũ vẫn còn.
- `gateway probe` có thể cảnh báo về `multiple reachable gateways` khi có hơn một đích
  trả lời.
- Nếu đó là chủ ý, hãy cô lập cổng, cấu hình/trạng thái, và gốc workspace cho từng gateway.

Danh sách kiểm tra cho từng instance:

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

## Endpoint não thời gian thực VoiceClaw

OpenClaw cung cấp endpoint WebSocket thời gian thực tương thích VoiceClaw tại
`/voiceclaw/realtime`. Dùng endpoint này khi client desktop VoiceClaw cần nói chuyện
trực tiếp với não OpenClaw thời gian thực thay vì đi qua một tiến trình chuyển tiếp
riêng.

Endpoint này dùng Gemini Live cho âm thanh thời gian thực và gọi OpenClaw như
não bằng cách cung cấp công cụ OpenClaw trực tiếp cho Gemini Live. Lệnh gọi công cụ trả về kết quả
`working` ngay lập tức để giữ lượt thoại phản hồi nhanh, sau đó OpenClaw
thực thi công cụ thực tế bất đồng bộ và chèn kết quả trở lại phiên
trực tiếp. Đặt `GEMINI_API_KEY` trong môi trường tiến trình gateway. Nếu
xác thực gateway được bật, client desktop gửi token hoặc mật khẩu gateway
trong thông điệp `session.config` đầu tiên.

Truy cập não thời gian thực chạy các lệnh tác nhân OpenClaw được chủ sở hữu ủy quyền. Giới hạn
`gateway.auth.mode: "none"` cho các instance thử nghiệm chỉ loopback. Kết nối
não thời gian thực không cục bộ yêu cầu xác thực gateway.

Đối với gateway thử nghiệm cô lập, chạy một instance riêng với cổng, cấu hình,
và trạng thái riêng:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

Sau đó cấu hình VoiceClaw để dùng:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## Truy cập từ xa

Ưu tiên: Tailscale/VPN.
Dự phòng: SSH tunnel.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Sau đó kết nối client cục bộ tới `ws://127.0.0.1:18789`.

<Warning>
SSH tunnel không bỏ qua xác thực gateway. Với xác thực bí mật dùng chung, client vẫn
phải gửi `token`/`password` ngay cả qua tunnel. Với các chế độ mang danh tính,
yêu cầu vẫn phải thỏa mãn đường dẫn xác thực đó.
</Warning>

Xem: [Gateway từ xa](/vi/gateway/remote), [Xác thực](/vi/gateway/authentication), [Tailscale](/vi/gateway/tailscale).

## Giám sát và vòng đời dịch vụ

Dùng chạy có giám sát để có độ tin cậy giống sản xuất.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Dùng `openclaw gateway restart` để khởi động lại. Không nối chuỗi `openclaw gateway stop` và `openclaw gateway start`; trên macOS, `gateway stop` cố ý vô hiệu hóa LaunchAgent trước khi dừng nó.

Nhãn LaunchAgent là `ai.openclaw.gateway` (mặc định) hoặc `ai.openclaw.<profile>` (hồ sơ có tên). `openclaw doctor` kiểm tra và sửa chữa trôi lệch cấu hình dịch vụ.

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

Khởi động được quản lý gốc trên Windows dùng Scheduled Task có tên `OpenClaw Gateway`
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

Dùng cùng nội dung dịch vụ như user unit, nhưng cài đặt dưới
`/etc/systemd/system/openclaw-gateway[-<profile>].service` và điều chỉnh
`ExecStart=` nếu binary `openclaw` của bạn nằm ở nơi khác.

Không đồng thời để `openclaw doctor --fix` cài đặt dịch vụ gateway cấp người dùng cho cùng hồ sơ/cổng. Doctor từ chối cài đặt tự động đó khi phát hiện dịch vụ gateway OpenClaw cấp hệ thống; dùng `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi system unit sở hữu vòng đời.

  </Tab>
</Tabs>

## Đường tắt hồ sơ dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Mặc định bao gồm trạng thái/cấu hình cô lập và cổng gateway cơ sở `19001`.

## Tham chiếu nhanh giao thức (góc nhìn toán tử)

- Khung client đầu tiên phải là `connect`.
- Gateway trả về ảnh chụp nhanh `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, giới hạn/chính sách).
- `hello-ok.features.methods` / `events` là danh sách khám phá thận trọng, không phải
  bản kết xuất được tạo của mọi tuyến helper có thể gọi.
- Yêu cầu: `req(method, params)` → `res(ok/payload|error)`.
- Sự kiện phổ biến bao gồm `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, sự kiện vòng đời ghép nối/phê duyệt, và `shutdown`.

Lượt chạy tác nhân có hai giai đoạn:

1. Xác nhận đã chấp nhận ngay lập tức (`status:"accepted"`)
2. Phản hồi hoàn tất cuối cùng (`status:"ok"|"error"`), với các sự kiện `agent` được stream ở giữa.

Xem tài liệu giao thức đầy đủ: [Giao thức Gateway](/vi/gateway/protocol).

## Kiểm tra vận hành

### Tính sống còn

- Mở WS và gửi `connect`.
- Chờ phản hồi `hello-ok` kèm ảnh chụp trạng thái.

### Trạng thái sẵn sàng

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Khôi phục khi thiếu trình tự

Sự kiện không được phát lại. Khi có khoảng thiếu trong chuỗi, hãy làm mới trạng thái (`health`, `system-presence`) trước khi tiếp tục.

## Dấu hiệu lỗi thường gặp

| Dấu hiệu                                                       | Vấn đề có khả năng xảy ra                                                         |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Liên kết không phải loopback mà không có đường dẫn xác thực Gateway hợp lệ        |
| `another gateway instance is already listening` / `EADDRINUSE` | Xung đột cổng                                                                     |
| `Gateway start blocked: set gateway.mode=local`                | Cấu hình đặt ở chế độ từ xa, hoặc dấu chế độ cục bộ bị thiếu trong cấu hình hỏng |
| `unauthorized` trong khi kết nối                               | Xác thực giữa client và Gateway không khớp                                        |

Để xem đầy đủ các bước chẩn đoán, hãy dùng [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting).

## Bảo đảm an toàn

- Các client giao thức Gateway thất bại nhanh khi Gateway không khả dụng (không có cơ chế dự phòng ngầm về kênh trực tiếp).
- Các khung đầu tiên không hợp lệ/không phải connect bị từ chối và đóng.
- Tắt nhẹ nhàng sẽ phát sự kiện `shutdown` trước khi đóng socket.

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
