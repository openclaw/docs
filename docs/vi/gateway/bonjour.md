---
read_when:
    - Gỡ lỗi sự cố phát hiện Bonjour trên macOS/iOS
    - Thay đổi loại dịch vụ mDNS, bản ghi TXT hoặc UX khám phá
summary: Phát hiện + gỡ lỗi Bonjour/mDNS (tín hiệu quảng bá Gateway, máy khách và các dạng lỗi thường gặp)
title: Phát hiện Bonjour
x-i18n:
    generated_at: "2026-05-11T20:28:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03bd9403591a389c06d3131e4c110d4ccf711eee56cbe9a5c9baed2b6df8fb80
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw có thể dùng Bonjour (mDNS / DNS-SD) để phát hiện một Gateway đang hoạt động (điểm cuối WebSocket).
Duyệt multicast `local.` là một **tiện ích chỉ dành cho LAN**. Plugin `bonjour`
đi kèm sở hữu việc quảng bá LAN. Plugin này tự khởi động trên máy chủ macOS và là tùy chọn bật thủ công trên
Linux, Windows và các triển khai Gateway trong container. Để phát hiện xuyên mạng, cùng một
beacon cũng có thể được công bố thông qua một miền DNS-SD diện rộng đã cấu hình. Việc phát hiện
vẫn theo cơ chế nỗ lực tối đa và **không** thay thế kết nối dựa trên SSH hoặc Tailnet.

## Bonjour diện rộng (Unicast DNS-SD) qua Tailscale

Nếu node và gateway nằm trên các mạng khác nhau, multicast mDNS sẽ không đi qua
ranh giới mạng. Bạn có thể giữ cùng trải nghiệm phát hiện bằng cách chuyển sang **unicast DNS-SD**
("Wide-Area Bonjour") qua Tailscale.

Các bước cấp cao:

1. Chạy một máy chủ DNS trên máy chủ gateway (có thể truy cập qua Tailnet).
2. Công bố các bản ghi DNS-SD cho `_openclaw-gw._tcp` dưới một zone chuyên dụng
   (ví dụ: `openclaw.internal.`).
3. Cấu hình **split DNS** của Tailscale để miền bạn chọn phân giải qua
   máy chủ DNS đó cho các client (bao gồm iOS).

OpenClaw hỗ trợ mọi miền phát hiện; `openclaw.internal.` chỉ là một ví dụ.
Các node iOS/Android duyệt cả `local.` và miền diện rộng đã cấu hình của bạn.

### Cấu hình Gateway (khuyến nghị)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### Thiết lập máy chủ DNS một lần (máy chủ gateway)

```bash
openclaw dns setup --apply
```

Lệnh này cài đặt CoreDNS và cấu hình để:

- chỉ lắng nghe trên cổng 53 trên các giao diện Tailscale của gateway
- phục vụ miền bạn chọn (ví dụ: `openclaw.internal.`) từ `~/.openclaw/dns/<domain>.db`

Xác thực từ một máy đã kết nối với tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Cài đặt DNS của Tailscale

Trong bảng điều khiển quản trị Tailscale:

- Thêm một nameserver trỏ đến IP tailnet của gateway (UDP/TCP 53).
- Thêm split DNS để miền phát hiện của bạn dùng nameserver đó.

Khi client chấp nhận DNS của tailnet, các node iOS và cơ chế phát hiện của CLI có thể duyệt
`_openclaw-gw._tcp` trong miền phát hiện của bạn mà không cần multicast.

### Bảo mật trình lắng nghe Gateway (khuyến nghị)

Cổng Gateway WS (mặc định `18789`) mặc định bind vào loopback. Để truy cập LAN/tailnet,
hãy bind rõ ràng và giữ bật xác thực.

Đối với thiết lập chỉ dành cho tailnet:

- Đặt `gateway.bind: "tailnet"` trong `~/.openclaw/openclaw.json`.
- Khởi động lại Gateway (hoặc khởi động lại ứng dụng thanh menu macOS).

## Thành phần quảng bá

Chỉ Gateway quảng bá `_openclaw-gw._tcp`. Quảng bá multicast LAN được
cung cấp bởi Plugin `bonjour` đi kèm khi Plugin được bật; việc công bố
DNS-SD diện rộng vẫn do Gateway sở hữu.

## Loại dịch vụ

- `_openclaw-gw._tcp` - beacon truyền tải gateway (được các node macOS/iOS/Android sử dụng).

## Khóa TXT (gợi ý không bí mật)

Gateway quảng bá các gợi ý nhỏ không bí mật để giúp các luồng UI thuận tiện:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (chỉ khi TLS được bật)
- `gatewayTlsSha256=<sha256>` (chỉ khi TLS được bật và fingerprint có sẵn)
- `canvasPort=<port>` (chỉ khi canvas host được bật; hiện tại giống với `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (chỉ ở chế độ mDNS full, gợi ý tùy chọn khi Tailnet có sẵn)
- `sshPort=<port>` (chỉ ở chế độ mDNS full; DNS-SD diện rộng có thể bỏ qua khóa này)
- `cliPath=<path>` (chỉ ở chế độ mDNS full; DNS-SD diện rộng vẫn ghi khóa này như một gợi ý cài đặt từ xa)

Ghi chú bảo mật:

- Bản ghi TXT của Bonjour/mDNS **không được xác thực**. Client không được xem TXT là nguồn định tuyến có thẩm quyền.
- Client nên định tuyến bằng điểm cuối dịch vụ đã phân giải (SRV + A/AAAA). Chỉ xem `lanHost`, `tailnetDns`, `gatewayPort` và `gatewayTlsSha256` là gợi ý.
- Tự động nhắm mục tiêu SSH cũng nên dùng máy chủ dịch vụ đã phân giải, không dùng các gợi ý chỉ có trong TXT.
- TLS pinning tuyệt đối không được cho phép `gatewayTlsSha256` được quảng bá ghi đè một pin đã lưu trước đó.
- Các node iOS/Android nên xem kết nối trực tiếp dựa trên phát hiện là **chỉ TLS** và yêu cầu người dùng xác nhận rõ ràng trước khi tin cậy fingerprint lần đầu.

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
sự cố resolver mDNS.

## Gỡ lỗi trong log Gateway

Gateway ghi một tệp log luân phiên (được in khi khởi động dưới dạng
`gateway log file: ...`). Tìm các dòng `bonjour:`, đặc biệt là:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Watchdog xem các trạng thái `probing`, `announcing` đang hoạt động và các lần đổi tên mới do xung đột là
trạng thái đang xử lý. Nếu dịch vụ không bao giờ đạt `announced`, cuối cùng OpenClaw
tạo lại advertiser và, sau nhiều lần thất bại, vô hiệu hóa Bonjour cho tiến trình
Gateway đó thay vì tiếp tục quảng bá lại mãi mãi.

Bonjour dùng hostname hệ thống cho máy chủ `.local` được quảng bá khi đó là
một nhãn DNS hợp lệ. Nếu hostname hệ thống chứa dấu cách, dấu gạch dưới hoặc ký tự
không hợp lệ khác đối với nhãn DNS, OpenClaw dùng dự phòng `openclaw.local`. Đặt
`OPENCLAW_MDNS_HOSTNAME=<name>` trước khi khởi động Gateway khi bạn cần một
nhãn máy chủ rõ ràng.

## Gỡ lỗi trên node iOS

Node iOS dùng `NWBrowser` để phát hiện `_openclaw-gw._tcp`.

Để thu thập log:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → tái hiện → **Copy**

Log bao gồm các chuyển tiếp trạng thái browser và thay đổi tập kết quả.

## Khi nào bật Bonjour

Bonjour tự khởi động cho lần khởi động Gateway với cấu hình trống trên máy chủ macOS vì
ứng dụng cục bộ và các node iOS/Android gần đó thường dựa vào phát hiện cùng LAN.

Bật Bonjour rõ ràng khi tự động phát hiện cùng LAN hữu ích trên Linux,
Windows hoặc một máy chủ không phải macOS khác:

```bash
openclaw plugins enable bonjour
```

Khi được bật, Bonjour dùng `discovery.mdns.mode` để quyết định lượng siêu dữ liệu TXT
cần công bố. Chế độ mặc định là `minimal`; chỉ dùng `full` khi client cục bộ cần
gợi ý `cliPath` hoặc `sshPort`, và dùng `off` để chặn multicast LAN mà không
thay đổi trạng thái bật Plugin.

## Khi nào tắt Bonjour

Để Bonjour tắt khi quảng bá multicast LAN là không cần thiết, không khả dụng,
hoặc có hại. Các trường hợp phổ biến là máy chủ không phải macOS, mạng bridge Docker,
WSL, hoặc chính sách mạng chặn multicast mDNS. Trong các môi trường đó,
Gateway vẫn có thể truy cập qua URL đã công bố, SSH, Tailnet hoặc DNS-SD
diện rộng, nhưng tự động phát hiện LAN không đáng tin cậy.

Ưu tiên override môi trường hiện có khi vấn đề nằm trong phạm vi triển khai:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Cài đặt đó vô hiệu hóa quảng bá multicast LAN mà không thay đổi cấu hình Plugin.
Nó an toàn cho ảnh Docker, tệp dịch vụ, script khởi chạy và gỡ lỗi một lần
vì cài đặt biến mất khi môi trường không còn.

Dùng cấu hình Plugin khi bạn chủ ý muốn tắt Plugin phát hiện LAN đi kèm
cho cấu hình OpenClaw đó:

```bash
openclaw plugins disable bonjour
```

## Lưu ý dễ gặp với Docker

Plugin Bonjour đi kèm tự động vô hiệu hóa quảng bá multicast LAN trong các
container được phát hiện khi `OPENCLAW_DISABLE_BONJOUR` chưa được đặt. Mạng bridge Docker
thường không chuyển tiếp multicast mDNS (`224.0.0.251:5353`) giữa container
và LAN, vì vậy việc quảng bá từ container hiếm khi giúp phát hiện hoạt động.

Các lưu ý quan trọng:

- Bonjour tự khởi động trên máy chủ macOS và là tùy chọn bật thủ công ở nơi khác. Để nó
  tắt không làm dừng Gateway; việc đó chỉ bỏ qua quảng bá multicast LAN.
- Tắt Bonjour không thay đổi `gateway.bind`; Docker vẫn mặc định là
  `OPENCLAW_GATEWAY_BIND=lan` để cổng host đã công bố có thể hoạt động.
- Tắt Bonjour không tắt DNS-SD diện rộng. Dùng phát hiện diện rộng
  hoặc Tailnet khi Gateway và node không nằm trên cùng LAN.
- Dùng lại cùng `OPENCLAW_CONFIG_DIR` bên ngoài Docker không lưu giữ chính sách
  tự động tắt của container.
- Chỉ đặt `OPENCLAW_DISABLE_BONJOUR=0` cho host networking, macvlan hoặc một
  mạng khác mà multicast mDNS chắc chắn đi qua; đặt thành `1` để buộc tắt.

## Khắc phục sự cố Bonjour đã tắt

Nếu một node không còn tự động phát hiện Gateway sau khi thiết lập Docker:

1. Xác nhận Gateway đang chạy ở chế độ tự động, buộc bật hay buộc tắt:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Xác nhận chính Gateway có thể truy cập qua cổng đã công bố:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Dùng mục tiêu trực tiếp khi Bonjour bị tắt:
   - Control UI hoặc công cụ cục bộ: `http://127.0.0.1:18789`
   - Client LAN: `http://<gateway-host>:18789`
   - Client xuyên mạng: Tailnet MagicDNS, IP Tailnet, đường hầm SSH hoặc
     DNS-SD diện rộng

4. Nếu bạn cố ý bật Plugin Bonjour trong Docker và buộc quảng bá
   bằng `OPENCLAW_DISABLE_BONJOUR=0`, hãy kiểm thử multicast từ host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Nếu kết quả duyệt trống hoặc log Gateway cho thấy các lần hủy ciao watchdog
   lặp lại, hãy khôi phục `OPENCLAW_DISABLE_BONJOUR=1` và dùng tuyến trực tiếp hoặc
   Tailnet.

## Chế độ lỗi thường gặp

- **Bonjour không đi qua các mạng**: dùng Tailnet hoặc SSH.
- **Multicast bị chặn**: một số mạng Wi-Fi tắt mDNS.
- **Advertiser kẹt trong probing/announcing**: các máy chủ có multicast bị chặn,
  bridge container, WSL hoặc biến động giao diện có thể khiến advertiser ciao ở
  trạng thái chưa được công bố. OpenClaw thử lại vài lần rồi vô hiệu hóa Bonjour
  cho tiến trình Gateway hiện tại thay vì khởi động lại advertiser mãi mãi.
- **Mạng bridge Docker**: Bonjour tự động tắt trong các container được phát hiện.
  Chỉ đặt `OPENCLAW_DISABLE_BONJOUR=0` cho host, macvlan hoặc một
  mạng khác hỗ trợ mDNS.
- **Ngủ / biến động giao diện**: macOS có thể tạm thời mất kết quả mDNS; hãy thử lại.
- **Duyệt hoạt động nhưng phân giải thất bại**: giữ tên máy đơn giản (tránh emoji hoặc
  dấu câu), rồi khởi động lại Gateway. Tên instance dịch vụ được suy ra từ
  tên máy chủ, vì vậy tên quá phức tạp có thể làm một số resolver nhầm lẫn.

## Tên instance đã escape (`\032`)

Bonjour/DNS-SD thường escape byte trong tên instance dịch vụ thành các chuỗi `\DDD`
thập phân (ví dụ: dấu cách trở thành `\032`).

- Điều này là bình thường ở cấp giao thức.
- UI nên giải mã để hiển thị (iOS dùng `BonjourEscapes.decode`).

## Bật / tắt / cấu hình

- Các máy chủ macOS tự động khởi động Plugin khám phá LAN đi kèm theo mặc định.
- `openclaw plugins enable bonjour` bật Plugin khám phá LAN đi kèm trên các máy chủ không được bật mặc định.
- `openclaw plugins disable bonjour` tắt quảng bá multicast LAN bằng cách tắt Plugin đi kèm.
- `OPENCLAW_DISABLE_BONJOUR=1` tắt quảng bá multicast LAN mà không thay đổi cấu hình Plugin; các giá trị truthy được chấp nhận là `1`, `true`, `yes` và `on` (cũ: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` buộc bật quảng bá multicast LAN, kể cả bên trong các container được phát hiện; các giá trị falsy được chấp nhận là `0`, `false`, `no` và `off`.
- Khi Plugin Bonjour được bật và `OPENCLAW_DISABLE_BONJOUR` chưa được đặt, Bonjour quảng bá trên các máy chủ thông thường và tự động tắt bên trong các container được phát hiện.
- `gateway.bind` trong `~/.openclaw/openclaw.json` kiểm soát chế độ bind của Gateway.
- `OPENCLAW_SSH_PORT` ghi đè cổng SSH khi `sshPort` được quảng bá (cũ: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` công bố gợi ý MagicDNS trong TXT khi chế độ đầy đủ mDNS được bật (cũ: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` ghi đè đường dẫn CLI được quảng bá (cũ: `OPENCLAW_CLI_PATH`).

## Tài liệu liên quan

- Chính sách khám phá và lựa chọn giao thức truyền tải: [Khám phá](/vi/gateway/discovery)
- Ghép nối Node + phê duyệt: [Ghép nối Gateway](/vi/gateway/pairing)
