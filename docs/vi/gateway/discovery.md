---
read_when:
    - Triển khai hoặc thay đổi cơ chế khám phá/quảng bá Bonjour
    - Điều chỉnh chế độ kết nối từ xa (trực tiếp so với SSH)
    - Thiết kế cơ chế khám phá và ghép đôi Node từ xa
summary: Khám phá Node và các phương thức truyền tải (Bonjour, Tailscale, SSH) để tìm Gateway
title: Khám phá và các phương thức truyền tải
x-i18n:
    generated_at: "2026-07-12T07:57:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a3f1a6a1212ab0bc7021e77c88de059edcb8e09eff90d3e1e59451b9b20876b
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw có hai bài toán khám phá có liên quan nhưng khác biệt:

1. **Điều khiển từ xa dành cho người vận hành**: ứng dụng trên thanh menu macOS điều khiển một Gateway đang chạy ở nơi khác.
2. **Ghép đôi Node**: iOS/Android (và các Node trong tương lai) tìm một Gateway và ghép đôi an toàn.

Toàn bộ hoạt động khám phá/quảng bá mạng nằm trong **Node Gateway**
(`openclaw gateway`); các máy khách (ứng dụng Mac, iOS) chỉ đóng vai trò sử dụng.

## Thuật ngữ

- **Gateway**: một tiến trình chạy dài hạn duy nhất, sở hữu trạng thái (phiên,
  ghép đôi, sổ đăng ký Node) và vận hành các kênh. Hầu hết cấu hình sử dụng một
  Gateway trên mỗi máy chủ; cũng có thể thiết lập nhiều Gateway biệt lập.
- **Gateway WS (mặt phẳng điều khiển)**: điểm cuối WebSocket mặc định tại
  `127.0.0.1:18789`; liên kết điểm cuối này với LAN/tailnet thông qua `gateway.bind`.
- **Phương thức truyền WS trực tiếp**: điểm cuối Gateway WS hướng ra LAN/tailnet (không dùng SSH).
- **Phương thức truyền SSH (dự phòng)**: điều khiển từ xa bằng cách chuyển tiếp
  `127.0.0.1:18789` qua SSH.
- **Cầu nối TCP cũ (đã loại bỏ)**: phương thức truyền Node cũ (xem
  [Giao thức cầu nối](/vi/gateway/bridge-protocol)); không còn được quảng bá để
  khám phá và không còn thuộc các bản dựng hiện tại.

Chi tiết giao thức: [Giao thức Gateway](/vi/gateway/protocol),
[Giao thức cầu nối (cũ)](/vi/gateway/bridge-protocol).

## Tại sao cả kết nối trực tiếp và SSH đều tồn tại

- **WS trực tiếp** mang lại trải nghiệm người dùng tốt nhất trên cùng một mạng và trong một tailnet:
  tự động khám phá qua Bonjour trên LAN, token ghép đôi và ACL do Gateway quản lý,
  đồng thời không yêu cầu quyền truy cập shell.
- **SSH** là phương án dự phòng phổ quát: hoạt động ở bất cứ đâu có quyền truy cập SSH,
  kể cả giữa các mạng không liên quan, không bị ảnh hưởng bởi sự cố multicast/mDNS
  và không cần thêm cổng đến nào ngoài SSH.

## Nguồn dữ liệu khám phá

### 1) Bonjour / DNS-SD

Bonjour multicast hoạt động theo cơ chế nỗ lực tối đa và không thể đi xuyên qua các mạng. OpenClaw
cũng hỗ trợ duyệt cùng một tín hiệu Gateway qua miền DNS-SD diện rộng đã cấu hình,
nhờ đó hoạt động khám phá có thể bao phủ cả `local.` trên cùng một LAN và một miền
DNS-SD unicast đã cấu hình để khám phá xuyên mạng.

**Gateway** quảng bá điểm cuối WS qua Bonjour khi Plugin `bonjour` đi kèm
được bật; máy khách duyệt và hiển thị danh sách "chọn một Gateway",
sau đó lưu điểm cuối đã chọn.

Chi tiết về khắc phục sự cố và tín hiệu: [Bonjour](/vi/gateway/bonjour).

#### Chi tiết tín hiệu dịch vụ

- Loại dịch vụ: `_openclaw-gw._tcp` (tín hiệu phương thức truyền Gateway).
- Khóa TXT (không chứa bí mật):

  | Khóa                        | Ghi chú                                                                                                                                                                  |
  | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | `role=gateway`              | Luôn có mặt.                                                                                                                                                             |
  | `transport=gateway`         | Luôn có mặt.                                                                                                                                                             |
  | `displayName=<name>`        | Tên hiển thị do người vận hành cấu hình.                                                                                                                                 |
  | `lanHost=<hostname>.local`  | Chỉ dành cho trình quảng bá mDNS trên LAN; DNS-SD diện rộng không ghi giá trị này.                                                                                        |
  | `gatewayPort=18789`         | Cổng Gateway WS + HTTP.                                                                                                                                                  |
  | `gatewayTls=1`              | Chỉ có khi TLS được bật.                                                                                                                                                 |
  | `gatewayTlsSha256=<sha256>` | Chỉ có khi TLS được bật và có sẵn dấu vân tay.                                                                                                                           |
  | `tailnetDns=<magicdns>`     | Gợi ý tùy chọn; được tự động phát hiện khi có Tailscale.                                                                                                                 |
  | `sshPort=<port>`            | Chỉ có khi `discovery.mdns.mode="full"`; bị lược bỏ (SSH mặc định dùng `22`) trong chế độ `"minimal"` mặc định, trên cả trình quảng bá LAN và DNS-SD diện rộng.           |
  | `cliPath=<path>`            | Chịu cùng điều kiện `discovery.mdns.mode="full"` như `sshPort`; gợi ý cho bản cài đặt từ xa về đường dẫn CLI.                                                            |

  Khóa TXT `canvasPort` được định nghĩa trong hợp đồng khám phá của Plugin cho một
  cổng máy chủ canvas trong tương lai, nhưng hiện không có đường dẫn mã nào đặt giá trị,
  vì vậy hiện nay khóa này không bao giờ được phát ra.

Lưu ý bảo mật:

- Các bản ghi TXT của Bonjour/mDNS **không được xác thực**. Máy khách chỉ được coi
  các giá trị TXT là gợi ý về trải nghiệm người dùng.
- Việc định tuyến (máy chủ/cổng) nên ưu tiên **điểm cuối dịch vụ đã phân giải**
  (SRV + A/AAAA) thay vì `lanHost`, `tailnetDns` hoặc `gatewayPort` do TXT cung cấp.
- Cơ chế ghim TLS tuyệt đối không được để `gatewayTlsSha256` được quảng bá ghi đè
  lên mã ghim đã lưu trước đó.
- Các Node iOS/Android phải yêu cầu xác nhận rõ ràng "tin cậy dấu vân tay này"
  trước khi lưu mã ghim lần đầu (xác minh ngoài băng)
  bất cứ khi nào tuyến đã chọn dựa trên bảo mật/TLS.

Bật, tắt và ghi đè:

- `openclaw plugins enable bonjour` bật quảng bá multicast trên LAN.
- `discovery.mdns.mode` trong `openclaw.json` kiểm soát việc phát mDNS:
  `"minimal"` (mặc định), `"full"` (thêm `cliPath`/`sshPort` vào cả tín hiệu LAN
  và mọi vùng DNS-SD diện rộng), hoặc `"off"` (tắt mDNS).
- `OPENCLAW_DISABLE_BONJOUR=1` buộc tắt quảng bá; `discovery.mdns.mode="off"`
  tắt quảng bá độc lập. `OPENCLAW_DISABLE_BONJOUR=0` là lựa chọn tham gia rõ ràng,
  ghi đè việc Plugin tự động vô hiệu hóa bên trong môi trường container được phát hiện
  (Docker, containerd, Kubernetes, LXC); tùy chọn này không ghi đè
  `discovery.mdns.mode="off"`. Plugin `bonjour` đi kèm tự động khởi động trên
  máy chủ macOS (`enabledByDefaultOnPlatforms: ["darwin"]`) và tự động vô hiệu hóa
  bên trong các container được phát hiện; Linux, Windows và các môi trường triển khai
  trong container khác cần chạy rõ ràng `plugins enable bonjour`.
- `gateway.bind` trong `~/.openclaw/openclaw.json` kiểm soát chế độ liên kết của Gateway.
- `OPENCLAW_SSH_PORT` ghi đè cổng SSH được quảng bá (chỉ có hiệu lực
  khi `discovery.mdns.mode="full"`).
- `OPENCLAW_TAILNET_DNS` công bố một gợi ý `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` ghi đè đường dẫn CLI được quảng bá.

### 2) Tailnet (xuyên mạng)

Đối với các Gateway trên những mạng vật lý khác nhau, Bonjour sẽ không hữu ích. Đích
trực tiếp được khuyến nghị là tên Tailscale MagicDNS (ưu tiên) hoặc một
địa chỉ IP tailnet ổn định.

Nếu Gateway phát hiện đang chạy dưới Tailscale, nó sẽ công bố
`tailnetDns` dưới dạng gợi ý tùy chọn cho máy khách (bao gồm cả các tín hiệu diện rộng).
Ứng dụng macOS ưu tiên tên MagicDNS hơn địa chỉ IP Tailscale thô khi khám phá
Gateway; cách này vẫn đáng tin cậy khi địa chỉ IP tailnet thay đổi (Node khởi động lại,
CGNAT cấp lại địa chỉ), vì MagicDNS tự động phân giải thành địa chỉ IP hiện tại.

Đối với việc ghép đôi Node di động, các gợi ý khám phá không bao giờ làm giảm
mức độ bảo mật của phương thức truyền trên các tuyến tailnet/công khai:

- iOS/Android vẫn yêu cầu một đường kết nối tailnet/công khai lần đầu an toàn
  (`wss://` hoặc Tailscale Serve/Funnel).
- Địa chỉ IP tailnet thô được khám phá là một gợi ý định tuyến, không phải quyền
  sử dụng `ws://` từ xa không mã hóa.
- Kết nối trực tiếp qua `ws://` trên LAN riêng tư vẫn được hỗ trợ.
- Để có đường dẫn Tailscale đơn giản nhất trên các Node di động, hãy dùng Tailscale Serve
  để cả hoạt động khám phá và thiết lập đều phân giải đến cùng một điểm cuối MagicDNS an toàn.

### 3) Đích thủ công / SSH

Khi không có tuyến trực tiếp (hoặc kết nối trực tiếp bị tắt), máy khách luôn có thể
kết nối qua SSH bằng cách chuyển tiếp cổng Gateway local loopback. Xem
[Truy cập từ xa](/vi/gateway/remote).

## Lựa chọn phương thức truyền (chính sách máy khách)

1. Nếu đã cấu hình một điểm cuối trực tiếp được ghép đôi và có thể truy cập, hãy sử dụng điểm cuối đó.
2. Nếu không, khi hoạt động khám phá tìm thấy một Gateway trên `local.` hoặc miền diện rộng
   đã cấu hình, hãy cung cấp lựa chọn một chạm "Sử dụng Gateway này" và lưu nó làm
   điểm cuối trực tiếp.
3. Nếu không, khi đã cấu hình DNS/IP tailnet, hãy thử kết nối trực tiếp. Đối với các Node di động trên
   tuyến tailnet/công khai, kết nối trực tiếp có nghĩa là điểm cuối an toàn, không phải
   `ws://` từ xa không mã hóa.
4. Nếu không, chuyển sang SSH làm phương án dự phòng.

## Ghép đôi và xác thực (phương thức truyền trực tiếp)

Gateway là nguồn dữ liệu chuẩn xác cho việc chấp nhận Node/máy khách:

- Yêu cầu ghép đôi được tạo/phê duyệt/từ chối trong Gateway (xem
  [Ghép đôi Gateway](/vi/gateway/pairing)).
- Gateway thực thi xác thực (token/cặp khóa), phạm vi/ACL (Gateway không phải là một
  proxy thô đến mọi phương thức) và giới hạn tốc độ.

## Trách nhiệm theo thành phần

- **Gateway**: quảng bá các tín hiệu khám phá, sở hữu quyết định ghép đôi, lưu trữ
  điểm cuối WS.
- **Ứng dụng macOS**: giúp bạn chọn Gateway, hiển thị lời nhắc ghép đôi, chỉ sử dụng SSH
  làm phương án dự phòng.
- **Các Node iOS/Android**: duyệt Bonjour để thuận tiện, kết nối với
  Gateway WS đã ghép đôi.

## Liên quan

- [Truy cập từ xa](/vi/gateway/remote)
- [Tailscale](/vi/gateway/tailscale)
- [Khám phá Bonjour](/vi/gateway/bonjour)
