---
read_when:
    - Chạy hoặc gỡ lỗi tiến trình Gateway
summary: Sổ tay vận hành cho dịch vụ Gateway, vòng đời và vận hành
title: Sổ tay vận hành Gateway
x-i18n:
    generated_at: "2026-05-10T19:35:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54f868e0b263e346876fb5c4f6a359e8a6f6802871f6931668ebe57140ca2711
    source_path: gateway/index.md
    workflow: 16
---

Sử dụng trang này cho khởi động ngày 1 và vận hành ngày 2 của dịch vụ Gateway.

<CardGroup cols={2}>
  <Card title="Khắc phục sự cố chuyên sâu" icon="siren" href="/vi/gateway/troubleshooting">
    Chẩn đoán theo triệu chứng trước, với các chuỗi lệnh chính xác và dấu hiệu nhật ký.
  </Card>
  <Card title="Cấu hình" icon="sliders" href="/vi/gateway/configuration">
    Hướng dẫn thiết lập theo tác vụ + tham chiếu cấu hình đầy đủ.
  </Card>
  <Card title="Quản lý bí mật" icon="key-round" href="/vi/gateway/secrets">
    Hợp đồng SecretRef, hành vi ảnh chụp nhanh khi chạy, và thao tác di chuyển/tải lại.
  </Card>
  <Card title="Hợp đồng kế hoạch bí mật" icon="shield-check" href="/vi/gateway/secrets-plan-contract">
    Quy tắc target/path chính xác của `secrets apply` và hành vi auth-profile chỉ dùng tham chiếu.
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

Mốc khỏe mạnh: `Runtime: running`, `Connectivity probe: ok`, và `Capability: ...` khớp với điều bạn mong đợi. Dùng `openclaw gateway status --require-rpc` khi bạn cần bằng chứng RPC phạm vi đọc, không chỉ khả năng kết nối.

  </Step>

  <Step title="Xác thực trạng thái sẵn sàng của kênh">

```bash
openclaw channels status --probe
```

Với một gateway có thể truy cập, lệnh này chạy các phép dò kênh trực tiếp theo từng tài khoản và các kiểm tra tùy chọn.
Nếu gateway không thể truy cập, CLI sẽ chuyển sang tóm tắt kênh chỉ dựa trên cấu hình thay vì
đầu ra dò trực tiếp.

  </Step>
</Steps>

<Note>
Tải lại cấu hình Gateway theo dõi đường dẫn tệp cấu hình đang hoạt động (được phân giải từ mặc định profile/state, hoặc `OPENCLAW_CONFIG_PATH` khi được đặt).
Chế độ mặc định là `gateway.reload.mode="hybrid"`.
Sau lần tải thành công đầu tiên, tiến trình đang chạy phục vụ ảnh chụp nhanh cấu hình trong bộ nhớ đang hoạt động; tải lại thành công sẽ hoán đổi ảnh chụp nhanh đó một cách nguyên tử.
</Note>

## Mô hình thời gian chạy

- Một tiến trình luôn bật cho định tuyến, mặt phẳng điều khiển, và kết nối kênh.
- Một cổng ghép kênh duy nhất cho:
  - Điều khiển/RPC WebSocket
  - HTTP APIs, tương thích OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Giao diện điều khiển và hook
- Chế độ bind mặc định: `loopback`.
- Mặc định yêu cầu xác thực. Thiết lập shared-secret dùng
  `gateway.auth.token` / `gateway.auth.password` (hoặc
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), và thiết lập reverse-proxy không phải loopback
  có thể dùng `gateway.auth.mode: "trusted-proxy"`.

## Endpoint tương thích OpenAI

Bề mặt tương thích có đòn bẩy cao nhất của OpenClaw hiện là:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Vì sao tập này quan trọng:

- Hầu hết tích hợp Open WebUI, LobeChat, và LibreChat dò `/v1/models` trước.
- Nhiều pipeline RAG và bộ nhớ mong đợi `/v1/embeddings`.
- Các client gốc agent ngày càng ưu tiên `/v1/responses`.

Ghi chú lập kế hoạch:

- `/v1/models` ưu tiên agent: nó trả về `openclaw`, `openclaw/default`, và `openclaw/<agentId>`.
- `openclaw/default` là alias ổn định luôn ánh xạ tới agent mặc định đã cấu hình.
- Dùng `x-openclaw-model` khi bạn muốn ghi đè provider/model backend; nếu không, thiết lập model và embedding thông thường của agent được chọn vẫn giữ quyền kiểm soát.

Tất cả endpoint này chạy trên cổng Gateway chính và dùng cùng ranh giới xác thực operator đáng tin cậy như phần còn lại của Gateway HTTP API.

### Thứ tự ưu tiên cổng và bind

| Cài đặt      | Thứ tự phân giải                                              |
| ------------ | ------------------------------------------------------------- |
| Cổng Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Chế độ bind    | CLI/ghi đè → `gateway.bind` → `loopback`                    |

Dịch vụ gateway đã cài đặt ghi lại `--port` đã phân giải trong metadata của supervisor. Sau khi thay đổi `gateway.port`, hãy chạy `openclaw doctor --fix` hoặc `openclaw gateway install --force` để launchd/systemd/schtasks khởi động tiến trình trên cổng mới.

Khởi động Gateway dùng cùng cổng và bind hiệu dụng khi nó gieo các origin
Giao diện điều khiển cục bộ cho bind không phải loopback. Ví dụ, `--bind lan --port 3000`
gieo `http://localhost:3000` và `http://127.0.0.1:3000` trước khi quá trình xác thực
thời gian chạy diễn ra. Thêm rõ ràng mọi origin trình duyệt từ xa, chẳng hạn URL proxy HTTPS, vào
`gateway.controlUi.allowedOrigins`.

### Chế độ tải lại nóng

| `gateway.reload.mode` | Hành vi                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | Không tải lại cấu hình                           |
| `hot`                 | Chỉ áp dụng thay đổi an toàn khi nóng                |
| `restart`             | Khởi động lại khi có thay đổi yêu cầu tải lại         |
| `hybrid` (mặc định)    | Áp dụng nóng khi an toàn, khởi động lại khi bắt buộc |

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

`gateway status --deep` dành cho khám phá dịch vụ bổ sung (LaunchDaemons/đơn vị systemd hệ thống
/schtasks), không phải phép dò tình trạng RPC sâu hơn.

## Nhiều gateway (cùng host)

Hầu hết cài đặt nên chạy một gateway trên mỗi máy. Một gateway duy nhất có thể lưu trữ nhiều
agent và kênh.

Bạn chỉ cần nhiều gateway khi cố ý muốn cô lập hoặc có một bot cứu hộ.

Các kiểm tra hữu ích:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Điều cần mong đợi:

- `gateway status --deep` có thể báo cáo `Other gateway-like services detected (best effort)`
  và in gợi ý dọn dẹp khi các cài đặt launchd/systemd/schtasks cũ vẫn còn.
- `gateway probe` có thể cảnh báo về `multiple reachable gateways` khi nhiều hơn một target
  trả lời.
- Nếu điều đó là cố ý, hãy cô lập cổng, cấu hình/trạng thái, và thư mục gốc workspace cho từng gateway.

Checklist cho mỗi instance:

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
Dự phòng: SSH tunnel.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Sau đó kết nối client cục bộ tới `ws://127.0.0.1:18789`.

<Warning>
SSH tunnel không bỏ qua xác thực gateway. Với xác thực shared-secret, client vẫn
phải gửi `token`/`password` ngay cả qua tunnel. Với các chế độ mang định danh,
yêu cầu vẫn phải thỏa mãn đường dẫn xác thực đó.
</Warning>

Xem: [Gateway từ xa](/vi/gateway/remote), [Xác thực](/vi/gateway/authentication), [Tailscale](/vi/gateway/tailscale).

## Giám sát và vòng đời dịch vụ

Dùng các lần chạy được giám sát để có độ tin cậy giống production.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Dùng `openclaw gateway restart` để khởi động lại. Không nối chuỗi `openclaw gateway stop` và `openclaw gateway start` làm cách thay thế khởi động lại.

Trên macOS, `gateway stop` mặc định dùng `launchctl bootout` — thao tác này gỡ LaunchAgent khỏi phiên khởi động hiện tại mà không lưu trạng thái vô hiệu hóa, nên tự khôi phục KeepAlive vẫn hoạt động sau các crash bất ngờ và `gateway start` bật lại sạch sẽ. Để chặn tự respawn bền vững qua các lần khởi động lại, truyền `--disable`: `openclaw gateway stop --disable`.

Nhãn LaunchAgent là `ai.openclaw.gateway` (mặc định) hoặc `ai.openclaw.<profile>` (profile có tên). `openclaw doctor` kiểm tra và sửa drift cấu hình dịch vụ.

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

Khởi động được quản lý native trên Windows dùng Scheduled Task tên `OpenClaw Gateway`
(hoặc `OpenClaw Gateway (<profile>)` cho profile có tên). Nếu bị từ chối tạo Scheduled Task,
OpenClaw sẽ chuyển sang launcher trong thư mục Startup theo người dùng
trỏ tới `gateway.cmd` bên trong thư mục trạng thái.

  </Tab>

  <Tab title="Linux (system service)">

Dùng system unit cho host nhiều người dùng/luôn bật.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Dùng cùng phần thân dịch vụ như user unit, nhưng cài đặt nó dưới
`/etc/systemd/system/openclaw-gateway[-<profile>].service` và điều chỉnh
`ExecStart=` nếu binary `openclaw` của bạn nằm ở nơi khác.

Đừng đồng thời để `openclaw doctor --fix` cài đặt dịch vụ gateway cấp người dùng cho cùng profile/cổng. Doctor từ chối cài đặt tự động đó khi phát hiện dịch vụ OpenClaw gateway cấp hệ thống; dùng `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi system unit sở hữu vòng đời.

  </Tab>
</Tabs>

## Đường dẫn nhanh cho profile dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Mặc định bao gồm trạng thái/cấu hình cô lập và cổng gateway cơ sở `19001`.

## Tham chiếu nhanh giao thức (góc nhìn operator)

- Frame đầu tiên của client phải là `connect`.
- Gateway trả về ảnh chụp nhanh `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, giới hạn/chính sách).
- `hello-ok.features.methods` / `events` là danh sách khám phá thận trọng, không phải
  bản dump được tạo của mọi helper route có thể gọi.
- Yêu cầu: `req(method, params)` → `res(ok/payload|error)`.
- Sự kiện phổ biến bao gồm `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, các sự kiện vòng đời pairing/approval, và `shutdown`.

Các lần chạy agent có hai giai đoạn:

1. Ack chấp nhận ngay lập tức (`status:"accepted"`)
2. Phản hồi hoàn tất cuối cùng (`status:"ok"|"error"`), với các sự kiện `agent` được stream ở giữa.

Xem tài liệu giao thức đầy đủ: [Giao thức Gateway](/vi/gateway/protocol).

## Kiểm tra vận hành

### Liveness

- Mở WS và gửi `connect`.
- Mong đợi phản hồi `hello-ok` có ảnh chụp nhanh.

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Khôi phục khoảng trống

Sự kiện không được phát lại. Khi có khoảng trống trình tự, hãy làm mới trạng thái (`health`, `system-presence`) trước khi tiếp tục.

## Dấu hiệu lỗi thường gặp

| Dấu hiệu                                                      | Vấn đề có khả năng xảy ra                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Bind không phải loopback mà không có đường dẫn xác thực Gateway hợp lệ                             |
| `another gateway instance is already listening` / `EADDRINUSE` | Xung đột cổng                                                                   |
| `Gateway start blocked: set gateway.mode=local`                | Cấu hình được đặt ở chế độ remote, hoặc dấu chế độ local bị thiếu trong cấu hình bị hỏng |
| `unauthorized` trong khi kết nối                                  | Xác thực không khớp giữa client và Gateway                                        |

Để xem đầy đủ các bước chẩn đoán, hãy dùng [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting).

## Đảm bảo an toàn

- Client giao thức Gateway thất bại nhanh khi Gateway không khả dụng (không có fallback ngầm định sang kênh trực tiếp).
- Các frame đầu tiên không hợp lệ/không phải kết nối sẽ bị từ chối và đóng.
- Tắt một cách êm thấm phát sự kiện `shutdown` trước khi đóng socket.

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
