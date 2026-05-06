---
read_when:
    - Gỡ lỗi các sự cố khám phá Bonjour trên macOS/iOS
    - Thay đổi loại dịch vụ mDNS, bản ghi TXT hoặc trải nghiệm khám phá
summary: Khám phá + gỡ lỗi Bonjour/mDNS (tín hiệu quảng bá của Gateway, máy khách và các kiểu lỗi thường gặp)
title: Khám phá Bonjour
x-i18n:
    generated_at: "2026-05-06T09:11:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7b7d029e6eb6bee90eb96e7ea169ecadf3bda6d969b2450349c5716a950e205
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw có thể dùng Bonjour (mDNS / DNS-SD) để khám phá một Gateway đang hoạt động (điểm cuối WebSocket).
Duyệt multicast `local.` là một **tiện ích chỉ dành cho LAN**. Plugin `bonjour`
đi kèm sở hữu việc quảng bá LAN. Plugin này tự khởi động trên các máy chủ macOS và cần bật tùy chọn trên
Linux, Windows, và các triển khai Gateway trong container. Để khám phá xuyên mạng, cùng
beacon đó cũng có thể được xuất bản qua một miền DNS-SD diện rộng đã cấu hình. Khám phá
vẫn là best-effort và **không** thay thế kết nối dựa trên SSH hoặc Tailnet.

## Bonjour diện rộng (Unicast DNS-SD) qua Tailscale

Nếu Node và Gateway nằm trên các mạng khác nhau, multicast mDNS sẽ không đi qua
ranh giới đó. Bạn có thể giữ nguyên UX khám phá bằng cách chuyển sang **unicast DNS-SD**
("Bonjour Diện Rộng") qua Tailscale.

Các bước tổng quan:

1. Chạy máy chủ DNS trên máy chủ Gateway (có thể truy cập qua Tailnet).
2. Xuất bản các bản ghi DNS-SD cho `_openclaw-gw._tcp` dưới một zone chuyên dụng
   (ví dụ: `openclaw.internal.`).
3. Cấu hình **split DNS** của Tailscale để miền bạn chọn phân giải qua
   máy chủ DNS đó cho các client (bao gồm iOS).

OpenClaw hỗ trợ bất kỳ miền khám phá nào; `openclaw.internal.` chỉ là một ví dụ.
Các Node iOS/Android duyệt cả `local.` và miền diện rộng đã cấu hình của bạn.

### Cấu hình Gateway (khuyến nghị)

```json5
{
  gateway: { bind: "tailnet" }, // chỉ tailnet (khuyến nghị)
  discovery: { wideArea: { enabled: true } }, // bật xuất bản DNS-SD diện rộng
}
```

### Thiết lập máy chủ DNS một lần (máy chủ Gateway)

```bash
openclaw dns setup --apply
```

Lệnh này cài đặt CoreDNS và cấu hình để:

- chỉ lắng nghe trên cổng 53 trên các giao diện Tailscale của Gateway
- phục vụ miền bạn chọn (ví dụ: `openclaw.internal.`) từ `~/.openclaw/dns/<domain>.db`

Xác thực từ một máy đã kết nối tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Cài đặt DNS của Tailscale

Trong bảng điều khiển quản trị Tailscale:

- Thêm một nameserver trỏ tới IP tailnet của Gateway (UDP/TCP 53).
- Thêm split DNS để miền khám phá của bạn dùng nameserver đó.

Khi client chấp nhận DNS tailnet, các Node iOS và khám phá CLI có thể duyệt
`_openclaw-gw._tcp` trong miền khám phá của bạn mà không cần multicast.

### Bảo mật listener của Gateway (khuyến nghị)

Cổng WS của Gateway (mặc định `18789`) mặc định bind vào loopback. Để truy cập
LAN/tailnet, hãy bind rõ ràng và giữ xác thực được bật.

Với thiết lập chỉ tailnet:

- Đặt `gateway.bind: "tailnet"` trong `~/.openclaw/openclaw.json`.
- Khởi động lại Gateway (hoặc khởi động lại ứng dụng thanh menu macOS).

## Thành phần quảng bá

Chỉ Gateway quảng bá `_openclaw-gw._tcp`. Quảng bá LAN multicast được
cung cấp bởi Plugin `bonjour` đi kèm khi Plugin được bật; xuất bản
DNS-SD diện rộng vẫn thuộc sở hữu của Gateway.

## Loại dịch vụ

- `_openclaw-gw._tcp` - beacon truyền tải Gateway (được các Node macOS/iOS/Android dùng).

## Khóa TXT (gợi ý không bí mật)

Gateway quảng bá các gợi ý nhỏ không bí mật để làm các luồng UI thuận tiện hơn:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (chỉ khi TLS được bật)
- `gatewayTlsSha256=<sha256>` (chỉ khi TLS được bật và fingerprint có sẵn)
- `canvasPort=<port>` (chỉ khi canvas host được bật; hiện tại giống `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (chỉ chế độ mDNS đầy đủ, gợi ý tùy chọn khi Tailnet có sẵn)
- `sshPort=<port>` (chỉ chế độ mDNS đầy đủ; DNS-SD diện rộng có thể bỏ qua)
- `cliPath=<path>` (chỉ chế độ mDNS đầy đủ; DNS-SD diện rộng vẫn ghi khóa này như một gợi ý cài đặt từ xa)

Ghi chú bảo mật:

- Bản ghi TXT Bonjour/mDNS **không được xác thực**. Client không được coi TXT là định tuyến có thẩm quyền.
- Client nên định tuyến bằng điểm cuối dịch vụ đã phân giải (SRV + A/AAAA). Chỉ coi `lanHost`, `tailnetDns`, `gatewayPort`, và `gatewayTlsSha256` là gợi ý.
- Tự động nhắm đích SSH cũng nên dùng máy chủ dịch vụ đã phân giải, không dùng các gợi ý chỉ có trong TXT.
- Ghim TLS không bao giờ được cho phép `gatewayTlsSha256` được quảng bá ghi đè một pin đã lưu trước đó.
- Các Node iOS/Android nên coi kết nối trực tiếp dựa trên khám phá là **chỉ TLS** và yêu cầu người dùng xác nhận rõ ràng trước khi tin cậy fingerprint lần đầu.

## Gỡ lỗi trên macOS

Các công cụ tích hợp hữu ích:

- Duyệt các instance:

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

Gateway ghi một tệp log xoay vòng (được in khi khởi động dưới dạng
`gateway log file: ...`). Tìm các dòng `bonjour:`, đặc biệt là:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour dùng hostname hệ thống cho máy chủ `.local` được quảng bá khi đó là một
nhãn DNS hợp lệ. Nếu hostname hệ thống chứa dấu cách, dấu gạch dưới, hoặc một
ký tự nhãn DNS không hợp lệ khác, OpenClaw sẽ fallback về `openclaw.local`. Đặt
`OPENCLAW_MDNS_HOSTNAME=<name>` trước khi khởi động Gateway khi bạn cần một
nhãn máy chủ rõ ràng.

## Gỡ lỗi trên Node iOS

Node iOS dùng `NWBrowser` để khám phá `_openclaw-gw._tcp`.

Để thu thập log:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → tái hiện → **Copy**

Log bao gồm các chuyển đổi trạng thái browser và thay đổi tập kết quả.

## Khi nào bật Bonjour

Bonjour tự khởi động khi Gateway khởi động với cấu hình rỗng trên máy chủ macOS vì
ứng dụng cục bộ và các Node iOS/Android lân cận thường dựa vào khám phá cùng LAN.

Bật Bonjour rõ ràng khi tự động khám phá cùng LAN hữu ích trên Linux,
Windows, hoặc máy chủ không phải macOS khác:

```bash
openclaw plugins enable bonjour
```

Khi được bật, Bonjour dùng `discovery.mdns.mode` để quyết định lượng metadata TXT
cần xuất bản. Chế độ mặc định là `minimal`; chỉ dùng `full` khi client cục bộ cần
gợi ý `cliPath` hoặc `sshPort`, và dùng `off` để chặn LAN multicast mà không
thay đổi trạng thái bật Plugin.

## Khi nào tắt Bonjour

Giữ Bonjour tắt khi quảng bá LAN multicast là không cần thiết, không khả dụng,
hoặc có hại. Các trường hợp phổ biến là máy chủ không phải macOS, mạng Docker bridge,
WSL, hoặc chính sách mạng loại bỏ multicast mDNS. Trong các môi trường đó,
Gateway vẫn có thể truy cập qua URL đã xuất bản, SSH, Tailnet, hoặc DNS-SD
diện rộng, nhưng tự động khám phá LAN không đáng tin cậy.

Ưu tiên override môi trường hiện có khi vấn đề thuộc phạm vi triển khai:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Thiết lập đó tắt quảng bá LAN multicast mà không thay đổi cấu hình Plugin.
Nó an toàn cho image Docker, tệp dịch vụ, script khởi chạy, và gỡ lỗi một lần
vì thiết lập biến mất khi môi trường không còn.

Dùng cấu hình Plugin khi bạn chủ ý muốn tắt Plugin khám phá LAN đi kèm
cho cấu hình OpenClaw đó:

```bash
openclaw plugins disable bonjour
```

## Lưu ý Docker

Plugin Bonjour đi kèm tự động tắt quảng bá LAN multicast trong các container
được phát hiện khi `OPENCLAW_DISABLE_BONJOUR` chưa được đặt. Mạng Docker bridge
thường không chuyển tiếp multicast mDNS (`224.0.0.251:5353`) giữa container
và LAN, nên việc quảng bá từ container hiếm khi làm khám phá hoạt động.

Các lưu ý quan trọng:

- Bonjour tự khởi động trên máy chủ macOS và cần bật tùy chọn ở nơi khác. Để
  tắt không dừng Gateway; nó chỉ bỏ qua quảng bá LAN multicast.
- Tắt Bonjour không thay đổi `gateway.bind`; Docker vẫn mặc định là
  `OPENCLAW_GATEWAY_BIND=lan` để cổng host đã xuất bản có thể hoạt động.
- Tắt Bonjour không tắt DNS-SD diện rộng. Dùng khám phá diện rộng
  hoặc Tailnet khi Gateway và Node không nằm trên cùng LAN.
- Tái sử dụng cùng `OPENCLAW_CONFIG_DIR` bên ngoài Docker không lưu chính sách
  tự động tắt của container.
- Chỉ đặt `OPENCLAW_DISABLE_BONJOUR=0` cho host networking, macvlan, hoặc một
  mạng khác mà mDNS multicast được biết là đi qua; đặt thành `1` để buộc tắt.

## Khắc phục sự cố Bonjour bị tắt

Nếu một Node không còn tự động khám phá Gateway sau khi thiết lập Docker:

1. Xác nhận Gateway đang chạy ở chế độ tự động, buộc bật, hay buộc tắt:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Xác nhận bản thân Gateway có thể truy cập qua cổng đã xuất bản:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Dùng đích trực tiếp khi Bonjour bị tắt:
   - Control UI hoặc công cụ cục bộ: `http://127.0.0.1:18789`
   - Client LAN: `http://<gateway-host>:18789`
   - Client xuyên mạng: Tailnet MagicDNS, IP Tailnet, đường hầm SSH, hoặc
     DNS-SD diện rộng

4. Nếu bạn cố ý bật Plugin Bonjour trong Docker và buộc quảng bá
   bằng `OPENCLAW_DISABLE_BONJOUR=0`, hãy kiểm thử multicast từ host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Nếu duyệt trống hoặc log Gateway hiển thị các hủy ciao watchdog lặp lại,
   khôi phục `OPENCLAW_DISABLE_BONJOUR=1` và dùng tuyến trực tiếp hoặc
   Tailnet.

## Các chế độ lỗi phổ biến

- **Bonjour không đi qua các mạng**: dùng Tailnet hoặc SSH.
- **Multicast bị chặn**: một số mạng Wi-Fi tắt mDNS.
- **Advertiser kẹt trong probing/announcing**: các máy chủ bị chặn multicast,
  bridge container, WSL, hoặc biến động giao diện có thể khiến advertiser ciao ở
  trạng thái chưa công bố. OpenClaw thử lại vài lần rồi tắt Bonjour
  cho tiến trình Gateway hiện tại thay vì khởi động lại advertiser mãi mãi.
- **Mạng Docker bridge**: Bonjour tự động tắt trong các container được phát hiện.
  Chỉ đặt `OPENCLAW_DISABLE_BONJOUR=0` cho host, macvlan, hoặc mạng khác
  có khả năng mDNS.
- **Sleep / biến động giao diện**: macOS có thể tạm thời mất kết quả mDNS; thử lại.
- **Duyệt hoạt động nhưng phân giải thất bại**: giữ tên máy đơn giản (tránh emoji hoặc
  dấu câu), rồi khởi động lại Gateway. Tên instance dịch vụ được lấy từ
  tên host, nên các tên quá phức tạp có thể làm một số resolver nhầm lẫn.

## Tên instance đã escape (`\032`)

Bonjour/DNS-SD thường escape byte trong tên instance dịch vụ dưới dạng chuỗi decimal `\DDD`
(ví dụ dấu cách trở thành `\032`).

- Đây là bình thường ở cấp giao thức.
- UI nên decode để hiển thị (iOS dùng `BonjourEscapes.decode`).

## Bật / tắt / cấu hình

- Máy chủ macOS mặc định tự khởi động Plugin khám phá LAN đi kèm.
- `openclaw plugins enable bonjour` bật Plugin khám phá LAN đi kèm trên các máy chủ nơi Plugin này không được bật mặc định.
- `openclaw plugins disable bonjour` tắt quảng bá LAN multicast bằng cách tắt Plugin đi kèm.
- `OPENCLAW_DISABLE_BONJOUR=1` tắt quảng bá LAN multicast mà không thay đổi cấu hình Plugin; các giá trị truthy được chấp nhận là `1`, `true`, `yes`, và `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` buộc bật quảng bá LAN multicast, bao gồm cả bên trong các container được phát hiện; các giá trị falsy được chấp nhận là `0`, `false`, `no`, và `off`.
- Khi Plugin Bonjour được bật và `OPENCLAW_DISABLE_BONJOUR` chưa được đặt, Bonjour quảng bá trên các máy chủ bình thường và tự động tắt bên trong các container được phát hiện.
- `gateway.bind` trong `~/.openclaw/openclaw.json` kiểm soát chế độ bind của Gateway.
- `OPENCLAW_SSH_PORT` override cổng SSH khi `sshPort` được quảng bá (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` xuất bản gợi ý MagicDNS trong TXT khi chế độ mDNS đầy đủ được bật (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` override đường dẫn CLI được quảng bá (legacy: `OPENCLAW_CLI_PATH`).

## Tài liệu liên quan

- Chính sách khám phá và lựa chọn truyền tải: [Discovery](/vi/gateway/discovery)
- Ghép nối Node + phê duyệt: [Ghép nối Gateway](/vi/gateway/pairing)
