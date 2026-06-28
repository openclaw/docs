---
read_when:
    - Triển khai hoặc thay đổi phát hiện/quảng bá Bonjour
    - Điều chỉnh các chế độ kết nối từ xa (trực tiếp so với SSH)
    - Thiết kế phát hiện node + ghép nối cho các node từ xa
summary: Khám phá Node và các phương thức truyền tải (Bonjour, Tailscale, SSH) để tìm Gateway
title: Khám phá và các phương thức truyền tải
x-i18n:
    generated_at: "2026-05-06T09:12:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f53e1292d9e5b402186c48c777e7e665c790981a64679c783ae8d8a1f170ee1
    source_path: gateway/discovery.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw có hai vấn đề riêng biệt nhìn bề ngoài có vẻ giống nhau:

1. **Điều khiển từ xa của người vận hành**: ứng dụng thanh menu macOS điều khiển một Gateway đang chạy ở nơi khác.
2. **Ghép đôi Node**: iOS/Android (và các Node trong tương lai) tìm Gateway và ghép đôi an toàn.

Mục tiêu thiết kế là giữ toàn bộ việc khám phá/quảng bá mạng trong **Node Gateway** (`openclaw gateway`) và giữ các client (ứng dụng Mac, iOS) là bên tiêu thụ.

## Thuật ngữ

- **Gateway**: một tiến trình Gateway chạy lâu dài duy nhất sở hữu trạng thái (phiên, ghép đôi, sổ đăng ký Node) và chạy các kênh. Hầu hết thiết lập dùng một Gateway trên mỗi máy chủ; các thiết lập nhiều Gateway cô lập cũng có thể dùng được.
- **Gateway WS (mặt phẳng điều khiển)**: endpoint WebSocket trên `127.0.0.1:18789` theo mặc định; có thể bind vào LAN/tailnet qua `gateway.bind`.
- **Truyền tải WS trực tiếp**: endpoint Gateway WS hướng LAN/tailnet (không dùng SSH).
- **Truyền tải SSH (dự phòng)**: điều khiển từ xa bằng cách chuyển tiếp `127.0.0.1:18789` qua SSH.
- **Cầu nối TCP cũ (đã gỡ bỏ)**: truyền tải Node cũ hơn (xem
  [Giao thức cầu nối](/vi/gateway/bridge-protocol)); không còn được quảng bá cho
  khám phá và không còn là một phần của các bản dựng hiện tại.

Chi tiết giao thức:

- [Giao thức Gateway](/vi/gateway/protocol)
- [Giao thức cầu nối (cũ)](/vi/gateway/bridge-protocol)

## Vì sao chúng tôi giữ cả trực tiếp và SSH

- **WS trực tiếp** mang lại UX tốt nhất trên cùng mạng và trong một tailnet:
  - tự động khám phá trên LAN qua Bonjour
  - token ghép đôi + ACL do Gateway sở hữu
  - không cần quyền truy cập shell; bề mặt giao thức có thể giữ chặt chẽ và dễ kiểm toán
- **SSH** vẫn là phương án dự phòng phổ quát:
  - hoạt động ở bất cứ đâu bạn có quyền truy cập SSH (ngay cả qua các mạng không liên quan)
  - vượt qua các vấn đề multicast/mDNS
  - không yêu cầu cổng inbound mới ngoài SSH

## Đầu vào khám phá (cách client biết Gateway ở đâu)

### 1) Khám phá Bonjour / DNS-SD

Bonjour multicast là best-effort và không đi qua các mạng. OpenClaw cũng có thể duyệt cùng beacon Gateway qua một miền DNS-SD diện rộng đã cấu hình, nên khám phá có thể bao phủ:

- `local.` trên cùng LAN
- một miền DNS-SD unicast đã cấu hình để khám phá xuyên mạng

Hướng mục tiêu:

- **Gateway** quảng bá endpoint WS của nó qua Bonjour khi plugin
  `bonjour` đi kèm được bật. Plugin tự động khởi động trên máy chủ macOS và
  là tùy chọn bật ở nơi khác.
- Client duyệt và hiển thị danh sách "chọn một Gateway", rồi lưu endpoint đã chọn.

Chi tiết khắc phục sự cố và beacon: [Bonjour](/vi/gateway/bonjour).

#### Chi tiết beacon dịch vụ

- Loại dịch vụ:
  - `_openclaw-gw._tcp` (beacon truyền tải Gateway)
- Khóa TXT (không bí mật):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (tên hiển thị do người vận hành cấu hình)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (chỉ khi TLS được bật)
  - `gatewayTlsSha256=<sha256>` (chỉ khi TLS được bật và có fingerprint)
  - `canvasPort=<port>` (cổng máy chủ canvas; hiện giống với `gatewayPort` khi máy chủ canvas được bật)
  - `tailnetDns=<magicdns>` (gợi ý tùy chọn; tự động phát hiện khi có Tailscale)
  - `sshPort=<port>` (chỉ chế độ mDNS đầy đủ; DNS-SD diện rộng có thể bỏ qua, khi đó mặc định SSH vẫn là `22`)
  - `cliPath=<path>` (chỉ chế độ mDNS đầy đủ; DNS-SD diện rộng vẫn ghi nó làm gợi ý cài đặt từ xa)

Ghi chú bảo mật:

- Bản ghi TXT Bonjour/mDNS **không được xác thực**. Client phải xem giá trị TXT chỉ là gợi ý UX.
- Định tuyến (host/port) nên ưu tiên **endpoint dịch vụ đã phân giải** (SRV + A/AAAA) hơn `lanHost`, `tailnetDns`, hoặc `gatewayPort` do TXT cung cấp.
- Ghim TLS không bao giờ được cho phép `gatewayTlsSha256` được quảng bá ghi đè pin đã lưu trước đó.
- Node iOS/Android nên yêu cầu xác nhận rõ ràng "tin cậy fingerprint này" trước khi lưu pin lần đầu (xác minh ngoài băng) bất cứ khi nào route đã chọn dựa trên bảo mật/TLS.

Bật/tắt/ghi đè:

- `openclaw plugins enable bonjour` bật quảng bá multicast LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` tắt quảng bá.
- Khi plugin Bonjour được bật và `OPENCLAW_DISABLE_BONJOUR` chưa được đặt,
  Bonjour quảng bá trên các máy chủ thông thường và tự động tắt bên trong container được phát hiện.
  Khởi động Gateway macOS với cấu hình rỗng sẽ tự động bật plugin; các triển khai Linux,
  Windows và container cần bật rõ ràng.
  Chỉ dùng `0` trên host, macvlan, hoặc mạng khác có khả năng mDNS; dùng `1` để
  buộc tắt.
- `gateway.bind` trong `~/.openclaw/openclaw.json` kiểm soát chế độ bind của Gateway.
- `OPENCLAW_SSH_PORT` ghi đè cổng SSH được quảng bá khi `sshPort` được phát ra.
- `OPENCLAW_TAILNET_DNS` xuất bản gợi ý `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` ghi đè đường dẫn CLI được quảng bá.

### 2) Tailnet (xuyên mạng)

Với các thiết lập kiểu London/Vienna, Bonjour sẽ không hữu ích. Mục tiêu "trực tiếp" được khuyến nghị là:

- Tên Tailscale MagicDNS (ưu tiên) hoặc một IP tailnet ổn định.

Nếu Gateway có thể phát hiện nó đang chạy dưới Tailscale, nó xuất bản `tailnetDns` làm gợi ý tùy chọn cho client (bao gồm cả beacon diện rộng).

Ứng dụng macOS giờ ưu tiên tên MagicDNS hơn IP Tailscale thô để khám phá Gateway. Điều này cải thiện độ tin cậy khi IP tailnet thay đổi (ví dụ sau khi Node khởi động lại hoặc CGNAT gán lại), vì tên MagicDNS tự động phân giải tới IP hiện tại.

Đối với ghép đôi Node di động, gợi ý khám phá không nới lỏng bảo mật truyền tải trên các route tailnet/public:

- iOS/Android vẫn yêu cầu một đường kết nối tailnet/public lần đầu an toàn (`wss://` hoặc Tailscale Serve/Funnel).
- IP tailnet thô được khám phá là gợi ý định tuyến, không phải quyền dùng `ws://` từ xa dạng plaintext.
- `ws://` kết nối trực tiếp LAN riêng vẫn được hỗ trợ.
- Nếu bạn muốn đường Tailscale đơn giản nhất cho Node di động, hãy dùng Tailscale Serve để cả khám phá và mã thiết lập đều phân giải tới cùng endpoint MagicDNS an toàn.

### 3) Mục tiêu thủ công / SSH

Khi không có route trực tiếp (hoặc trực tiếp bị tắt), client luôn có thể kết nối qua SSH bằng cách chuyển tiếp cổng Gateway loopback.

Xem [Truy cập từ xa](/vi/gateway/remote).

## Lựa chọn truyền tải (chính sách client)

Hành vi client được khuyến nghị:

1. Nếu một endpoint trực tiếp đã ghép đôi được cấu hình và truy cập được, hãy dùng nó.
2. Nếu không, nếu khám phá tìm thấy Gateway trên `local.` hoặc miền diện rộng đã cấu hình, cung cấp lựa chọn một chạm "Dùng Gateway này" và lưu nó làm endpoint trực tiếp.
3. Nếu không, nếu DNS/IP tailnet được cấu hình, hãy thử trực tiếp.
   Với Node di động trên route tailnet/public, trực tiếp nghĩa là endpoint an toàn, không phải `ws://` từ xa dạng plaintext.
4. Nếu không, quay về SSH.

## Ghép đôi + xác thực (truyền tải trực tiếp)

Gateway là nguồn sự thật cho việc chấp nhận Node/client.

- Yêu cầu ghép đôi được tạo/phê duyệt/từ chối trong Gateway (xem [Ghép đôi Gateway](/vi/gateway/pairing)).
- Gateway thực thi:
  - xác thực (token / cặp khóa)
  - phạm vi/ACL (Gateway không phải proxy thô tới mọi phương thức)
  - giới hạn tốc độ

## Trách nhiệm theo thành phần

- **Gateway**: quảng bá beacon khám phá, sở hữu quyết định ghép đôi, và lưu trữ endpoint WS.
- **Ứng dụng macOS**: giúp bạn chọn Gateway, hiển thị lời nhắc ghép đôi, và chỉ dùng SSH làm dự phòng.
- **Node iOS/Android**: duyệt Bonjour để thuận tiện và kết nối tới Gateway WS đã ghép đôi.

## Liên quan

- [Truy cập từ xa](/vi/gateway/remote)
- [Tailscale](/vi/gateway/tailscale)
- [Khám phá Bonjour](/vi/gateway/bonjour)
