---
read_when:
    - Gỡ lỗi các sự cố phát hiện Bonjour trên macOS/iOS
    - Thay đổi loại dịch vụ mDNS, bản ghi TXT hoặc trải nghiệm phát hiện
summary: Phát hiện Bonjour/mDNS + gỡ lỗi (tín hiệu quảng bá của Gateway, máy khách và các dạng lỗi phổ biến)
title: Khám phá Bonjour
x-i18n:
    generated_at: "2026-04-29T22:41:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0720451843aae0509949324e51f3a23dc69e366e68de851c595ce76c8ab0eec9
    source_path: gateway/bonjour.md
    workflow: 16
---

# Khám phá Bonjour / mDNS

OpenClaw sử dụng Bonjour (mDNS / DNS‑SD) để khám phá một Gateway đang hoạt động (điểm cuối WebSocket).
Duyệt multicast `local.` là một **tiện ích chỉ dành cho LAN**. Plugin `bonjour`
được đóng gói sở hữu việc quảng bá LAN và được bật theo mặc định. Đối với khám phá xuyên mạng,
beacon tương tự cũng có thể được xuất bản thông qua một miền DNS-SD diện rộng đã cấu hình.
Khám phá vẫn là nỗ lực tối đa và **không** thay thế kết nối dựa trên SSH hoặc Tailnet.

## Bonjour diện rộng (Unicast DNS-SD) qua Tailscale

Nếu node và gateway nằm trên các mạng khác nhau, multicast mDNS sẽ không đi qua
ranh giới đó. Bạn có thể giữ cùng trải nghiệm khám phá bằng cách chuyển sang **unicast DNS‑SD**
("Wide‑Area Bonjour") qua Tailscale.

Các bước cấp cao:

1. Chạy máy chủ DNS trên máy chủ gateway (có thể truy cập qua Tailnet).
2. Xuất bản bản ghi DNS‑SD cho `_openclaw-gw._tcp` dưới một zone chuyên dụng
   (ví dụ: `openclaw.internal.`).
3. Cấu hình Tailscale **split DNS** để miền bạn chọn được phân giải qua
   máy chủ DNS đó cho các client (bao gồm iOS).

OpenClaw hỗ trợ bất kỳ miền khám phá nào; `openclaw.internal.` chỉ là một ví dụ.
Các node iOS/Android duyệt cả `local.` và miền diện rộng đã cấu hình của bạn.

### Cấu hình Gateway (khuyến nghị)

```json5
{
  gateway: { bind: "tailnet" }, // chỉ tailnet (khuyến nghị)
  discovery: { wideArea: { enabled: true } }, // bật xuất bản DNS-SD diện rộng
}
```

### Thiết lập máy chủ DNS một lần (máy chủ gateway)

```bash
openclaw dns setup --apply
```

Lệnh này cài đặt CoreDNS và cấu hình để:

- chỉ lắng nghe trên cổng 53 trên các giao diện Tailscale của gateway
- phục vụ miền bạn chọn (ví dụ: `openclaw.internal.`) từ `~/.openclaw/dns/<domain>.db`

Xác thực từ một máy đã kết nối tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Cài đặt DNS của Tailscale

Trong bảng điều khiển quản trị Tailscale:

- Thêm một nameserver trỏ tới IP tailnet của gateway (UDP/TCP 53).
- Thêm split DNS để miền khám phá của bạn sử dụng nameserver đó.

Sau khi client chấp nhận DNS tailnet, các node iOS và khám phá CLI có thể duyệt
`_openclaw-gw._tcp` trong miền khám phá của bạn mà không cần multicast.

### Bảo mật trình lắng nghe Gateway (khuyến nghị)

Cổng WS của Gateway (mặc định `18789`) mặc định bind vào loopback. Để truy cập LAN/tailnet,
hãy bind rõ ràng và giữ xác thực được bật.

Đối với thiết lập chỉ tailnet:

- Đặt `gateway.bind: "tailnet"` trong `~/.openclaw/openclaw.json`.
- Khởi động lại Gateway (hoặc khởi động lại ứng dụng thanh menu macOS).

## Thành phần quảng bá

Chỉ Gateway quảng bá `_openclaw-gw._tcp`. Quảng bá multicast LAN được
cung cấp bởi Plugin `bonjour` được đóng gói; xuất bản DNS-SD diện rộng vẫn
thuộc sở hữu của Gateway.

## Loại dịch vụ

- `_openclaw-gw._tcp` — beacon truyền tải gateway (được các node macOS/iOS/Android sử dụng).

## Khóa TXT (gợi ý không bí mật)

Gateway quảng bá các gợi ý nhỏ không bí mật để giúp luồng UI thuận tiện:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (chỉ khi TLS được bật)
- `gatewayTlsSha256=<sha256>` (chỉ khi TLS được bật và có fingerprint)
- `canvasPort=<port>` (chỉ khi canvas host được bật; hiện giống với `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (chỉ chế độ đầy đủ mDNS, gợi ý tùy chọn khi có Tailnet)
- `sshPort=<port>` (chỉ chế độ đầy đủ mDNS; DNS-SD diện rộng có thể bỏ qua)
- `cliPath=<path>` (chỉ chế độ đầy đủ mDNS; DNS-SD diện rộng vẫn ghi nó làm gợi ý cài đặt từ xa)

Ghi chú bảo mật:

- Bản ghi TXT Bonjour/mDNS **không được xác thực**. Client không được xem TXT là định tuyến có thẩm quyền.
- Client nên định tuyến bằng điểm cuối dịch vụ đã phân giải (SRV + A/AAAA). Chỉ xem `lanHost`, `tailnetDns`, `gatewayPort`, và `gatewayTlsSha256` là gợi ý.
- Tự động nhắm mục tiêu SSH cũng nên dùng máy chủ dịch vụ đã phân giải, không chỉ dùng gợi ý TXT.
- Ghim TLS không bao giờ được cho phép `gatewayTlsSha256` được quảng bá ghi đè một pin đã lưu trước đó.
- Các node iOS/Android nên xem kết nối trực tiếp dựa trên khám phá là **chỉ TLS** và yêu cầu người dùng xác nhận rõ ràng trước khi tin cậy fingerprint lần đầu.

## Gỡ lỗi trên macOS

Các công cụ tích hợp hữu ích:

- Duyệt instance:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Phân giải một instance (thay `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Nếu duyệt hoạt động nhưng phân giải thất bại, bạn thường đang gặp chính sách LAN hoặc
vấn đề bộ phân giải mDNS.

## Gỡ lỗi trong log Gateway

Gateway ghi một tệp log xoay vòng (được in khi khởi động dưới dạng
`gateway log file: ...`). Tìm các dòng `bonjour:`, đặc biệt:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour dùng hostname hệ thống cho máy chủ `.local` được quảng bá khi đó là một
nhãn DNS hợp lệ. Nếu hostname hệ thống chứa dấu cách, dấu gạch dưới hoặc ký tự
nhãn DNS không hợp lệ khác, OpenClaw fallback về `openclaw.local`. Đặt
`OPENCLAW_MDNS_HOSTNAME=<name>` trước khi khởi động Gateway khi bạn cần một
nhãn máy chủ rõ ràng.

## Gỡ lỗi trên node iOS

Node iOS dùng `NWBrowser` để khám phá `_openclaw-gw._tcp`.

Để thu thập log:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → tái hiện → **Copy**

Log bao gồm chuyển đổi trạng thái trình duyệt và thay đổi tập kết quả.

## Khi nào tắt Bonjour

Chỉ tắt Bonjour khi quảng bá multicast LAN không khả dụng hoặc gây hại.
Trường hợp phổ biến là Gateway chạy phía sau mạng bridge Docker, WSL hoặc
chính sách mạng loại bỏ multicast mDNS. Trong các môi trường đó, Gateway
vẫn có thể truy cập qua URL đã xuất bản, SSH, Tailnet hoặc DNS-SD diện rộng,
nhưng tự động khám phá LAN không đáng tin cậy.

Ưu tiên override môi trường hiện có khi vấn đề nằm trong phạm vi triển khai:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Thiết lập đó tắt quảng bá multicast LAN mà không thay đổi cấu hình Plugin.
Nó an toàn cho image Docker, tệp service, script khởi chạy và gỡ lỗi một lần
vì thiết lập biến mất khi môi trường không còn.

Chỉ dùng cấu hình Plugin khi bạn chủ ý muốn tắt Plugin khám phá LAN được đóng gói
cho cấu hình OpenClaw đó:

```bash
openclaw plugins disable bonjour
```

## Lưu ý Docker

Plugin Bonjour được đóng gói tự động tắt quảng bá multicast LAN trong container
được phát hiện khi `OPENCLAW_DISABLE_BONJOUR` chưa được đặt. Mạng bridge Docker
thường không chuyển tiếp multicast mDNS (`224.0.0.251:5353`) giữa container
và LAN, nên quảng bá từ container hiếm khi giúp khám phá hoạt động.

Các lưu ý quan trọng:

- Tắt Bonjour không dừng Gateway. Nó chỉ dừng quảng bá multicast LAN.
- Tắt Bonjour không thay đổi `gateway.bind`; Docker vẫn mặc định là
  `OPENCLAW_GATEWAY_BIND=lan` để cổng host đã xuất bản có thể hoạt động.
- Tắt Bonjour không tắt DNS-SD diện rộng. Hãy dùng khám phá diện rộng
  hoặc Tailnet khi Gateway và node không nằm trên cùng LAN.
- Tái sử dụng cùng `OPENCLAW_CONFIG_DIR` bên ngoài Docker không duy trì
  chính sách tự động tắt của container.
- Chỉ đặt `OPENCLAW_DISABLE_BONJOUR=0` cho host networking, macvlan hoặc một
  mạng khác đã biết là cho phép multicast mDNS đi qua; đặt thành `1` để buộc tắt.

## Khắc phục sự cố Bonjour bị tắt

Nếu một node không còn tự động khám phá Gateway sau khi thiết lập Docker:

1. Xác nhận Gateway đang chạy ở chế độ auto, buộc bật hoặc buộc tắt:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Xác nhận chính Gateway có thể truy cập qua cổng đã xuất bản:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Dùng đích trực tiếp khi Bonjour bị tắt:
   - Control UI hoặc công cụ cục bộ: `http://127.0.0.1:18789`
   - Client LAN: `http://<gateway-host>:18789`
   - Client xuyên mạng: Tailnet MagicDNS, IP Tailnet, SSH tunnel hoặc
     DNS-SD diện rộng

4. Nếu bạn cố ý bật Bonjour trong Docker bằng
   `OPENCLAW_DISABLE_BONJOUR=0`, hãy kiểm tra multicast từ host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Nếu kết quả duyệt trống hoặc log Gateway hiển thị các lần hủy watchdog ciao
   lặp lại, khôi phục `OPENCLAW_DISABLE_BONJOUR=1` và dùng tuyến trực tiếp hoặc
   Tailnet.

## Chế độ lỗi thường gặp

- **Bonjour không đi qua các mạng**: dùng Tailnet hoặc SSH.
- **Multicast bị chặn**: một số mạng Wi‑Fi tắt mDNS.
- **Advertiser kẹt ở probing/announcing**: máy chủ có multicast bị chặn,
  bridge container, WSL hoặc biến động giao diện có thể khiến ciao advertiser ở
  trạng thái chưa được công bố. OpenClaw thử lại vài lần rồi tắt Bonjour
  cho tiến trình Gateway hiện tại thay vì khởi động lại advertiser mãi mãi.
- **Mạng bridge Docker**: Bonjour tự động tắt trong container được phát hiện.
  Chỉ đặt `OPENCLAW_DISABLE_BONJOUR=0` cho host, macvlan hoặc một
  mạng hỗ trợ mDNS khác.
- **Sleep / biến động giao diện**: macOS có thể tạm thời mất kết quả mDNS; hãy thử lại.
- **Duyệt hoạt động nhưng phân giải thất bại**: giữ tên máy đơn giản (tránh emoji hoặc
  dấu câu), rồi khởi động lại Gateway. Tên instance dịch vụ được lấy từ
  tên host, nên tên quá phức tạp có thể làm một số bộ phân giải nhầm lẫn.

## Tên instance đã escape (`\032`)

Bonjour/DNS‑SD thường escape byte trong tên instance dịch vụ dưới dạng chuỗi thập phân `\DDD`
(ví dụ dấu cách trở thành `\032`).

- Điều này bình thường ở cấp giao thức.
- UI nên giải mã để hiển thị (iOS dùng `BonjourEscapes.decode`).

## Tắt / cấu hình

- `openclaw plugins disable bonjour` tắt quảng bá multicast LAN bằng cách tắt Plugin được đóng gói.
- `openclaw plugins enable bonjour` khôi phục Plugin khám phá LAN mặc định.
- `OPENCLAW_DISABLE_BONJOUR=1` tắt quảng bá multicast LAN mà không thay đổi cấu hình Plugin; các giá trị truthy được chấp nhận là `1`, `true`, `yes`, và `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` buộc bật quảng bá multicast LAN, bao gồm cả bên trong container được phát hiện; các giá trị falsy được chấp nhận là `0`, `false`, `no`, và `off`.
- Khi `OPENCLAW_DISABLE_BONJOUR` chưa được đặt, Bonjour quảng bá trên host bình thường và tự động tắt bên trong container được phát hiện.
- `gateway.bind` trong `~/.openclaw/openclaw.json` kiểm soát chế độ bind của Gateway.
- `OPENCLAW_SSH_PORT` ghi đè cổng SSH khi `sshPort` được quảng bá (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` xuất bản gợi ý MagicDNS trong TXT khi chế độ đầy đủ mDNS được bật (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` ghi đè đường dẫn CLI được quảng bá (legacy: `OPENCLAW_CLI_PATH`).

## Tài liệu liên quan

- Chính sách khám phá và chọn truyền tải: [Khám phá](/vi/gateway/discovery)
- Ghép nối node + phê duyệt: [Ghép nối Gateway](/vi/gateway/pairing)
