---
read_when:
    - Gỡ lỗi các sự cố khám phá Bonjour trên macOS/iOS
    - Thay đổi loại dịch vụ mDNS, bản ghi TXT hoặc trải nghiệm khám phá
summary: Khám phá + gỡ lỗi Bonjour/mDNS (beacon của Gateway, ứng dụng khách và các chế độ lỗi thường gặp)
title: Khám phá Bonjour
x-i18n:
    generated_at: "2026-07-12T07:51:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0526c9e20dd02d143ae7aa4c8e1e6830763763e95c9a74c4d73332c5e5e155e
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw có thể sử dụng Bonjour (mDNS/DNS-SD) để khám phá một Gateway đang hoạt động (điểm cuối WebSocket). Việc duyệt multicast `local.` là một **tiện ích chỉ dành cho LAN**: Plugin `bonjour` đi kèm chịu trách nhiệm quảng bá trong LAN, tự động khởi động trên các máy chủ macOS và yêu cầu bật thủ công trên Linux, Windows cũng như các triển khai Gateway trong vùng chứa. Beacon này cũng có thể được phát qua một miền DNS-SD diện rộng đã cấu hình để khám phá xuyên mạng. Tính năng khám phá hoạt động theo cơ chế nỗ lực tối đa và **không** thay thế khả năng kết nối dựa trên SSH hoặc Tailnet.

## Bonjour diện rộng (DNS-SD Unicast) qua Tailscale

Nếu Node và Gateway nằm trên các mạng khác nhau, mDNS multicast không thể vượt qua ranh giới mạng. Hãy duy trì cùng trải nghiệm khám phá bằng cách chuyển sang **DNS-SD unicast** ("Bonjour diện rộng") qua Tailscale:

1. Chạy một máy chủ DNS trên máy chủ Gateway, có thể truy cập qua Tailnet.
2. Công bố các bản ghi DNS-SD cho `_openclaw-gw._tcp` trong một vùng chuyên dụng (ví dụ: `openclaw.internal.`).
3. Cấu hình **split DNS** của Tailscale để miền bạn chọn được phân giải qua máy chủ DNS đó cho các máy khách, bao gồm iOS.

`openclaw.internal.` ở trên chỉ là ví dụ — OpenClaw hỗ trợ mọi miền khám phá. Các Node iOS/Android duyệt cả `local.` và miền diện rộng đã cấu hình của bạn.

### Cấu hình Gateway

```json5
{
  gateway: { bind: "tailnet" }, // chỉ dành cho tailnet (khuyến nghị)
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

`discovery.wideArea.domain` cũng chấp nhận biến môi trường `OPENCLAW_WIDE_AREA_DOMAIN` làm phương án dự phòng khi chưa được đặt.

### Thiết lập máy chủ DNS một lần (máy chủ Gateway, chỉ macOS)

```bash
openclaw dns setup --apply
```

Lệnh này chỉ dành cho macOS và yêu cầu Homebrew cùng một kết nối Tailscale đang hoạt động. Lệnh cài đặt CoreDNS (`brew install coredns`) và cấu hình để:

- chỉ lắng nghe trên cổng 53 tại các giao diện Tailscale của Gateway
- phục vụ miền bạn chọn (ví dụ: `openclaw.internal.`) từ `~/.openclaw/dns/<domain>.db`

Trước tiên, hãy chạy không có `--apply` để xem trước kế hoạch (miền, đường dẫn tệp vùng, IP Tailnet được phát hiện, cấu hình được khuyến nghị) mà không cài đặt bất kỳ thứ gì.

Xác thực từ một máy đã kết nối Tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Cài đặt DNS của Tailscale

Trong bảng điều khiển quản trị Tailscale:

- Thêm một máy chủ định danh trỏ đến IP Tailnet của Gateway (UDP/TCP 53).
- Thêm split DNS để miền khám phá của bạn sử dụng máy chủ định danh đó.

Sau khi các máy khách chấp nhận DNS của Tailnet, các Node iOS và tính năng khám phá của CLI có thể duyệt `_openclaw-gw._tcp` trong miền khám phá của bạn mà không cần multicast.

### Bảo mật trình lắng nghe Gateway

Cổng WS của Gateway (mặc định `18789`) mặc định liên kết với local loopback. Để truy cập qua LAN/Tailnet, hãy liên kết rõ ràng và luôn bật xác thực. Với các thiết lập chỉ dành cho Tailnet, hãy đặt `gateway.bind: "tailnet"` trong `~/.openclaw/openclaw.json` rồi khởi động lại Gateway (hoặc ứng dụng thanh menu macOS).

## Thành phần quảng bá

Chỉ Gateway quảng bá `_openclaw-gw._tcp`. Hoạt động quảng bá multicast trong LAN đến từ Plugin `bonjour` đi kèm khi được bật; việc công bố DNS-SD diện rộng vẫn thuộc trách nhiệm của Gateway.

## Loại dịch vụ

- `_openclaw-gw._tcp` - beacon truyền tải của Gateway, được các Node macOS/iOS/Android sử dụng.

## Các khóa TXT (gợi ý không chứa bí mật)

| Khóa                          | Khi xuất hiện                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `role=gateway`                | Luôn luôn.                                                                     |
| `displayName=<friendly name>` | Luôn luôn.                                                                     |
| `lanHost=<hostname>.local`    | Luôn luôn.                                                                     |
| `gatewayPort=<port>`          | Luôn luôn (WS + HTTP của Gateway).                                             |
| `transport=gateway`           | Luôn luôn.                                                                     |
| `gatewayTls=1`                | Chỉ khi TLS được bật.                                                          |
| `gatewayTlsSha256=<sha256>`   | Chỉ khi TLS được bật và có dấu vân tay.                                        |
| `gatewayDirectReachable=1`    | Chỉ khi có thể truy cập trực tiếp Gateway (không chỉ qua đường dẫn chuyển tiếp/proxy). |
| `canvasPort=<port>`           | Chỉ khi máy chủ canvas được bật; hiện giống với `gatewayPort`.                 |
| `tailnetDns=<magicdns>`       | Chỉ ở chế độ mDNS đầy đủ; gợi ý tùy chọn khi Tailnet khả dụng.                 |
| `sshPort=<port>`              | Chỉ ở chế độ đầy đủ; bị lược bỏ trong chế độ tối thiểu và tắt.                 |
| `cliPath=<path>`              | Chỉ ở chế độ đầy đủ; bị lược bỏ trong chế độ tối thiểu và tắt.                 |

Lưu ý bảo mật:

- Các bản ghi TXT của Bonjour/mDNS **không được xác thực**. Máy khách không được coi TXT là nguồn định tuyến có thẩm quyền.
- Máy khách nên định tuyến bằng điểm cuối dịch vụ đã phân giải (SRV + A/AAAA). Chỉ coi `lanHost`, `tailnetDns`, `gatewayPort` và `gatewayTlsSha256` là gợi ý.
- Tính năng tự động chọn đích SSH cũng nên sử dụng máy chủ dịch vụ đã phân giải, không chỉ dựa vào các gợi ý TXT.
- Ghim TLS tuyệt đối không được cho phép `gatewayTlsSha256` được quảng bá ghi đè một giá trị ghim đã lưu trước đó.
- Các Node iOS/Android nên coi kết nối trực tiếp dựa trên khám phá là **chỉ dùng TLS** và yêu cầu người dùng xác nhận rõ ràng trước khi tin cậy dấu vân tay lần đầu.

## Gỡ lỗi trên macOS

Công cụ tích hợp:

```bash
# Duyệt các phiên bản
dns-sd -B _openclaw-gw._tcp local.

# Phân giải một phiên bản (thay thế <instance>)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

Nếu duyệt được nhưng phân giải thất bại, thông thường bạn đang gặp vấn đề về chính sách LAN hoặc trình phân giải mDNS.

## Gỡ lỗi trong nhật ký Gateway

Gateway ghi một tệp nhật ký luân phiên (được in khi khởi động dưới dạng `gateway log file: ...`). Hãy tìm các dòng `bonjour:`, đặc biệt là:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bộ giám sát coi các trạng thái `probing`, `announcing` đang hoạt động và các lần đổi tên mới xảy ra do xung đột là trạng thái đang xử lý. Nếu dịch vụ không bao giờ đạt trạng thái `announced`, OpenClaw sẽ tạo lại trình quảng bá và sau nhiều lần thất bại sẽ vô hiệu hóa Bonjour cho tiến trình Gateway đó thay vì quảng bá lại mãi mãi.

Bonjour sử dụng tên máy chủ hệ thống cho máy chủ `.local` được quảng bá khi đó là một nhãn DNS hợp lệ. Nếu tên máy chủ hệ thống chứa dấu cách, dấu gạch dưới hoặc ký tự khác không hợp lệ trong nhãn DNS, OpenClaw sẽ dùng `openclaw.local` làm phương án dự phòng. Hãy đặt `OPENCLAW_MDNS_HOSTNAME=<name>` trước khi khởi động Gateway nếu bạn cần một nhãn máy chủ cụ thể.

## Gỡ lỗi trên Node iOS

Node iOS sử dụng `NWBrowser` để khám phá `_openclaw-gw._tcp`.

Để thu thập nhật ký: Settings -> Gateway -> Advanced -> **Discovery Debug Logs**, sau đó Settings -> Gateway -> Advanced -> **Discovery Logs** -> tái hiện lỗi -> **Copy**. Nhật ký bao gồm các lần chuyển đổi trạng thái của trình duyệt và các thay đổi của tập kết quả.

## Khi nào nên bật Bonjour

Bonjour tự động khởi động khi Gateway được khởi động với cấu hình trống trên máy chủ macOS, vì ứng dụng cục bộ và các Node iOS/Android ở gần thường dựa vào tính năng khám phá trong cùng LAN.

Hãy bật rõ ràng khi tính năng tự động khám phá trong cùng LAN hữu ích trên Linux, Windows hoặc một máy chủ không phải macOS khác:

```bash
openclaw plugins enable bonjour
```

Khi được bật, Bonjour sử dụng `discovery.mdns.mode` để quyết định lượng siêu dữ liệu TXT cần công bố; cùng chế độ đó kiểm soát các gợi ý TXT tùy chọn trong bản ghi DNS-SD diện rộng. Các chế độ:

| Chế độ              | Hành vi                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` (mặc định) | Chỉ các khóa TXT cốt lõi; lược bỏ `sshPort`, `cliPath`, `tailnetDns`.                                                                                         |
| `full`              | Thêm `sshPort`, `cliPath`, `tailnetDns` — sử dụng khi máy khách cần các gợi ý này.                                                                             |
| `off`               | Ngăn multicast trong LAN mà không thay đổi trạng thái bật của Plugin; DNS-SD diện rộng vẫn có thể công bố beacon tối thiểu khi `discovery.wideArea.enabled` là true. |

## Khi nào nên tắt Bonjour

Hãy để Bonjour ở trạng thái tắt khi việc quảng bá multicast trong LAN không cần thiết, không khả dụng hoặc gây hại — các trường hợp phổ biến là máy chủ không chạy macOS, mạng cầu nối Docker, WSL hoặc chính sách mạng chặn multicast mDNS. Gateway vẫn có thể truy cập qua URL đã công bố, SSH, Tailnet hoặc DNS-SD diện rộng; chỉ tính năng tự động khám phá trong LAN là không đáng tin cậy.

Sử dụng giá trị ghi đè bằng biến môi trường cho các vấn đề theo phạm vi triển khai (an toàn cho ảnh Docker, tệp dịch vụ, tập lệnh khởi chạy, gỡ lỗi một lần — giá trị này biến mất khi môi trường không còn):

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Sử dụng cấu hình Plugin khi bạn chủ ý muốn tắt Plugin khám phá LAN đi kèm cho cấu hình OpenClaw đó:

```bash
openclaw plugins disable bonjour
```

## Các điểm dễ gặp lỗi với Docker

Plugin Bonjour đi kèm tự động vô hiệu hóa quảng bá multicast trong LAN ở các vùng chứa được phát hiện khi `OPENCLAW_DISABLE_BONJOUR` chưa được đặt. Mạng cầu nối Docker thường không chuyển tiếp multicast mDNS (`224.0.0.251:5353`) giữa vùng chứa và LAN, vì vậy việc quảng bá từ vùng chứa hiếm khi giúp tính năng khám phá hoạt động.

Các điểm dễ gặp lỗi:

- Bonjour tự động khởi động trên máy chủ macOS và yêu cầu bật thủ công ở các nền tảng khác. Việc để nó tắt không làm Gateway ngừng hoạt động — chỉ bỏ qua quảng bá multicast trong LAN.
- Việc tắt Bonjour không thay đổi `gateway.bind`; Docker vẫn mặc định dùng `OPENCLAW_GATEWAY_BIND=lan` để cổng máy chủ đã công bố hoạt động.
- Việc tắt Bonjour không vô hiệu hóa DNS-SD diện rộng. Hãy sử dụng khám phá diện rộng hoặc Tailnet khi Gateway và Node không nằm trong cùng một LAN.
- Việc sử dụng lại cùng `OPENCLAW_CONFIG_DIR` bên ngoài Docker không duy trì chính sách tự động vô hiệu hóa của vùng chứa.
- Chỉ đặt `OPENCLAW_DISABLE_BONJOUR=0` cho mạng máy chủ, macvlan hoặc mạng khác mà multicast mDNS được xác nhận có thể đi qua; đặt thành `1` để buộc vô hiệu hóa.

## Khắc phục sự cố Bonjour bị vô hiệu hóa

Nếu một Node không còn tự động khám phá Gateway sau khi thiết lập Docker:

1. Xác nhận Gateway đang chạy ở chế độ tự động, buộc bật hay buộc tắt:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Xác nhận bản thân Gateway có thể truy cập qua cổng đã công bố:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Sử dụng đích trực tiếp khi Bonjour bị vô hiệu hóa:
   - Giao diện điều khiển hoặc công cụ cục bộ: `http://127.0.0.1:18789`
   - Máy khách LAN: `http://<gateway-host>:18789`
   - Máy khách xuyên mạng: Tailnet MagicDNS, IP Tailnet, đường hầm SSH hoặc DNS-SD diện rộng

4. Nếu bạn chủ ý bật Plugin Bonjour trong Docker và buộc quảng bá bằng `OPENCLAW_DISABLE_BONJOUR=0`, hãy kiểm tra multicast từ máy chủ:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Nếu kết quả duyệt trống hoặc nhật ký Gateway hiển thị các lần hủy lặp lại từ bộ giám sát ciao, hãy khôi phục `OPENCLAW_DISABLE_BONJOUR=1` và sử dụng tuyến trực tiếp hoặc Tailnet.

## Các chế độ lỗi phổ biến

- **Bonjour không hoạt động xuyên mạng**: hãy dùng Tailnet hoặc SSH.
- **Multicast bị chặn**: một số mạng Wi-Fi vô hiệu hóa mDNS.
- **Trình quảng bá bị kẹt ở trạng thái thăm dò/thông báo**: máy chủ bị chặn multicast, cầu nối container, WSL hoặc việc giao diện mạng thay đổi liên tục có thể khiến trình quảng bá ciao ở trạng thái chưa được thông báo. OpenClaw thử lại vài lần, sau đó vô hiệu hóa Bonjour cho tiến trình Gateway hiện tại thay vì khởi động lại trình quảng bá vô hạn.
- **Mạng cầu nối Docker**: Bonjour tự động bị vô hiệu hóa trong các container được phát hiện. Chỉ đặt `OPENCLAW_DISABLE_BONJOUR=0` cho mạng máy chủ, macvlan hoặc mạng khác hỗ trợ mDNS.
- **Chế độ ngủ/giao diện mạng thay đổi liên tục**: macOS có thể tạm thời không trả về kết quả mDNS; hãy thử lại.
- **Duyệt được nhưng phân giải thất bại**: hãy giữ tên máy đơn giản (tránh biểu tượng cảm xúc hoặc dấu câu), sau đó khởi động lại Gateway. Tên phiên bản dịch vụ được tạo từ tên máy chủ, vì vậy tên quá phức tạp có thể khiến một số trình phân giải gặp nhầm lẫn.

## Tên phiên bản được thoát (`\032`)

Bonjour/DNS-SD thường thoát các byte trong tên phiên bản dịch vụ dưới dạng chuỗi thập phân `\DDD` (dấu cách trở thành `\032`). Đây là hành vi bình thường ở cấp giao thức; giao diện người dùng nên giải mã để hiển thị (iOS sử dụng `BonjourEscapes.decode`).

## Bật / tắt / cấu hình

| Thiết lập                                             | Hiệu lực                                                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `openclaw plugins enable bonjour`                    | Bật Plugin khám phá LAN đi kèm trên các máy chủ không được bật mặc định.                               |
| `openclaw plugins disable bonjour`                   | Tắt quảng bá multicast LAN bằng cách vô hiệu hóa Plugin đi kèm.                                        |
| `OPENCLAW_DISABLE_BONJOUR=1` (hoặc `true`/`yes`/`on`)  | Tắt quảng bá multicast LAN mà không thay đổi cấu hình Plugin.                                          |
| `OPENCLAW_DISABLE_BONJOUR=0` (hoặc `false`/`no`/`off`) | Buộc bật quảng bá multicast LAN, kể cả bên trong các container được phát hiện.                          |
| `discovery.mdns.mode`                                | `off` \| `minimal` (mặc định) \| `full` — xem các chế độ ở trên.                                       |
| `gateway.bind`                                       | Kiểm soát chế độ liên kết của Gateway trong `~/.openclaw/openclaw.json`.                               |
| `OPENCLAW_SSH_PORT`                                  | Ghi đè cổng SSH khi `sshPort` được quảng bá (chế độ đầy đủ).                                           |
| `OPENCLAW_TAILNET_DNS`                               | Công bố gợi ý MagicDNS trong TXT khi chế độ mDNS đầy đủ được bật.                                      |
| `OPENCLAW_CLI_PATH`                                  | Ghi đè đường dẫn CLI được quảng bá (chế độ đầy đủ).                                                     |

Theo mặc định, máy chủ macOS tự động khởi chạy Plugin khám phá LAN đi kèm. Khi Plugin Bonjour được bật và `OPENCLAW_DISABLE_BONJOUR` chưa được đặt, Bonjour sẽ quảng bá trên các máy chủ thông thường và tự động bị vô hiệu hóa bên trong các container được phát hiện (Docker, máy Fly.io và các môi trường chạy container phổ biến).

## Tài liệu liên quan

- Chính sách khám phá và lựa chọn phương thức truyền tải: [Khám phá](/vi/gateway/discovery)
- Ghép đôi Node + phê duyệt: [Ghép đôi Gateway](/vi/gateway/pairing)
