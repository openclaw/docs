---
read_when:
    - Triển khai hoặc thay đổi tính năng khám phá/quảng bá Bonjour
    - Điều chỉnh chế độ kết nối từ xa (trực tiếp so với SSH)
    - Thiết kế phát hiện Node + ghép nối cho các Node từ xa
summary: Phát hiện Node và các cơ chế truyền tải (Bonjour, Tailscale, SSH) để tìm Gateway
title: Khám phá và các phương thức truyền tải
x-i18n:
    generated_at: "2026-05-03T21:32:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41a5ed7a910ae4bbdfa21a81882c3b1af0c16622fa20a5e616b666390dccdc9c
    source_path: gateway/discovery.md
    workflow: 16
---

# Phát hiện & phương thức truyền tải

OpenClaw có hai vấn đề riêng biệt trông giống nhau ở bề mặt:

1. **Điều khiển từ xa của operator**: ứng dụng thanh menu macOS điều khiển một Gateway đang chạy ở nơi khác.
2. **Ghép đôi Node**: iOS/Android (và các Node trong tương lai) tìm Gateway và ghép đôi an toàn.

Mục tiêu thiết kế là giữ toàn bộ hoạt động phát hiện/quảng bá mạng trong **Node Gateway** (`openclaw gateway`) và giữ các client (ứng dụng mac, iOS) ở vai trò bên tiêu thụ.

## Thuật ngữ

- **Gateway**: một tiến trình Gateway chạy lâu dài duy nhất, sở hữu trạng thái (phiên, ghép đôi, sổ đăng ký Node) và chạy các kênh. Hầu hết thiết lập dùng một Gateway cho mỗi host; cũng có thể có các thiết lập nhiều Gateway cô lập.
- **Gateway WS (mặt phẳng điều khiển)**: điểm cuối WebSocket trên `127.0.0.1:18789` theo mặc định; có thể được bind vào LAN/tailnet thông qua `gateway.bind`.
- **Phương thức truyền tải WS trực tiếp**: điểm cuối Gateway WS hướng ra LAN/tailnet (không dùng SSH).
- **Phương thức truyền tải SSH (dự phòng)**: điều khiển từ xa bằng cách chuyển tiếp `127.0.0.1:18789` qua SSH.
- **Cầu nối TCP cũ (đã gỡ bỏ)**: phương thức truyền tải Node cũ hơn (xem
  [Giao thức cầu nối](/vi/gateway/bridge-protocol)); không còn được quảng bá để
  phát hiện và không còn là một phần của các bản dựng hiện tại.

Chi tiết giao thức:

- [Giao thức Gateway](/vi/gateway/protocol)
- [Giao thức cầu nối (cũ)](/vi/gateway/bridge-protocol)

## Vì sao chúng tôi giữ cả "trực tiếp" và SSH

- **WS trực tiếp** là trải nghiệm người dùng tốt nhất trên cùng mạng và trong một tailnet:
  - tự động phát hiện trên LAN qua Bonjour
  - token ghép đôi + ACL do Gateway sở hữu
  - không cần quyền truy cập shell; bề mặt giao thức có thể được giữ chặt chẽ và dễ kiểm tra
- **SSH** vẫn là phương án dự phòng phổ quát:
  - hoạt động ở bất cứ đâu bạn có quyền truy cập SSH (ngay cả qua các mạng không liên quan)
  - vượt qua được các sự cố multicast/mDNS
  - không yêu cầu cổng inbound mới ngoài SSH

## Đầu vào phát hiện (cách client biết Gateway ở đâu)

### 1) Phát hiện Bonjour / DNS-SD

Bonjour multicast là best-effort và không đi qua các mạng. OpenClaw cũng có thể duyệt cùng beacon Gateway qua một miền DNS-SD diện rộng đã cấu hình, để việc phát hiện có thể bao phủ:

- `local.` trên cùng LAN
- một miền DNS-SD unicast đã cấu hình cho phát hiện xuyên mạng

Hướng mục tiêu:

- **Gateway** quảng bá điểm cuối WS của nó qua Bonjour khi Plugin đi kèm
  `bonjour` được bật. Plugin tự động khởi động trên host macOS và
  là opt-in ở những nơi khác.
- Client duyệt và hiển thị danh sách “chọn một Gateway”, sau đó lưu điểm cuối đã chọn.

Chi tiết khắc phục sự cố và beacon: [Bonjour](/vi/gateway/bonjour).

#### Chi tiết beacon dịch vụ

- Loại dịch vụ:
  - `_openclaw-gw._tcp` (beacon phương thức truyền tải Gateway)
- Khóa TXT (không bí mật):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (tên hiển thị do operator cấu hình)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (chỉ khi TLS được bật)
  - `gatewayTlsSha256=<sha256>` (chỉ khi TLS được bật và fingerprint có sẵn)
  - `canvasPort=<port>` (cổng canvas host; hiện tại giống với `gatewayPort` khi canvas host được bật)
  - `tailnetDns=<magicdns>` (gợi ý tùy chọn; được tự động phát hiện khi có Tailscale)
  - `sshPort=<port>` (chỉ chế độ mDNS đầy đủ; DNS-SD diện rộng có thể bỏ qua, khi đó mặc định SSH vẫn là `22`)
  - `cliPath=<path>` (chỉ chế độ mDNS đầy đủ; DNS-SD diện rộng vẫn ghi nó như một gợi ý cài đặt từ xa)

Ghi chú bảo mật:

- Bản ghi TXT Bonjour/mDNS **không được xác thực**. Client phải xem giá trị TXT chỉ là gợi ý UX.
- Định tuyến (host/cổng) nên ưu tiên **điểm cuối dịch vụ đã phân giải** (SRV + A/AAAA) thay vì `lanHost`, `tailnetDns`, hoặc `gatewayPort` do TXT cung cấp.
- Ghim TLS không bao giờ được cho phép một `gatewayTlsSha256` được quảng bá ghi đè pin đã lưu trước đó.
- Node iOS/Android nên yêu cầu xác nhận rõ ràng “tin cậy fingerprint này” trước khi lưu pin lần đầu (xác minh ngoài băng) bất cứ khi nào tuyến đã chọn dựa trên bảo mật/TLS.

Bật/tắt/ghi đè:

- `openclaw plugins enable bonjour` bật quảng bá multicast LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` tắt quảng bá.
- Khi Plugin Bonjour được bật và `OPENCLAW_DISABLE_BONJOUR` chưa được đặt,
  Bonjour quảng bá trên các host thông thường và tự động tắt bên trong container được phát hiện.
  Khởi động Gateway macOS với cấu hình trống tự động bật Plugin; các triển khai Linux,
  Windows và container hóa cần bật rõ ràng.
  Chỉ dùng `0` trên host, macvlan, hoặc mạng khác có khả năng mDNS; dùng `1` để
  buộc tắt.
- `gateway.bind` trong `~/.openclaw/openclaw.json` điều khiển chế độ bind của Gateway.
- `OPENCLAW_SSH_PORT` ghi đè cổng SSH được quảng bá khi `sshPort` được phát ra.
- `OPENCLAW_TAILNET_DNS` xuất bản gợi ý `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` ghi đè đường dẫn CLI được quảng bá.

### 2) Tailnet (xuyên mạng)

Với các thiết lập kiểu London/Vienna, Bonjour sẽ không giúp được. Mục tiêu “trực tiếp” được khuyến nghị là:

- Tên Tailscale MagicDNS (ưu tiên) hoặc IP tailnet ổn định.

Nếu Gateway có thể phát hiện nó đang chạy dưới Tailscale, nó xuất bản `tailnetDns` như một gợi ý tùy chọn cho client (bao gồm cả beacon diện rộng).

Ứng dụng macOS hiện ưu tiên tên MagicDNS hơn IP Tailscale thô cho phát hiện Gateway. Điều này cải thiện độ tin cậy khi IP tailnet thay đổi (ví dụ sau khi Node khởi động lại hoặc CGNAT gán lại), vì tên MagicDNS tự động phân giải tới IP hiện tại.

Với ghép đôi Node di động, các gợi ý phát hiện không nới lỏng bảo mật truyền tải trên tuyến tailnet/công khai:

- iOS/Android vẫn yêu cầu đường kết nối tailnet/công khai an toàn lần đầu (`wss://` hoặc Tailscale Serve/Funnel).
- IP tailnet thô được phát hiện là gợi ý định tuyến, không phải quyền dùng `ws://` từ xa dạng plaintext.
- Kết nối trực tiếp `ws://` trên LAN riêng tư vẫn được hỗ trợ.
- Nếu bạn muốn đường Tailscale đơn giản nhất cho Node di động, hãy dùng Tailscale Serve để cả phát hiện và mã thiết lập đều phân giải tới cùng một điểm cuối MagicDNS an toàn.

### 3) Mục tiêu thủ công / SSH

Khi không có tuyến trực tiếp (hoặc trực tiếp bị tắt), client luôn có thể kết nối qua SSH bằng cách chuyển tiếp cổng Gateway loopback.

Xem [Truy cập từ xa](/vi/gateway/remote).

## Chọn phương thức truyền tải (chính sách client)

Hành vi client được khuyến nghị:

1. Nếu một điểm cuối trực tiếp đã ghép đôi được cấu hình và có thể truy cập, hãy dùng nó.
2. Nếu không, nếu phát hiện tìm thấy một Gateway trên `local.` hoặc miền diện rộng đã cấu hình, hãy đưa ra lựa chọn một chạm “Dùng Gateway này” và lưu nó làm điểm cuối trực tiếp.
3. Nếu không, nếu DNS/IP tailnet được cấu hình, thử trực tiếp.
   Với Node di động trên tuyến tailnet/công khai, trực tiếp nghĩa là một điểm cuối an toàn, không phải `ws://` từ xa dạng plaintext.
4. Nếu không, quay về SSH.

## Ghép đôi + xác thực (phương thức truyền tải trực tiếp)

Gateway là nguồn sự thật cho việc chấp nhận Node/client.

- Yêu cầu ghép đôi được tạo/phê duyệt/từ chối trong Gateway (xem [Ghép đôi Gateway](/vi/gateway/pairing)).
- Gateway thực thi:
  - xác thực (token / cặp khóa)
  - phạm vi/ACL (Gateway không phải proxy thô tới mọi phương thức)
  - giới hạn tốc độ

## Trách nhiệm theo thành phần

- **Gateway**: quảng bá beacon phát hiện, sở hữu quyết định ghép đôi và host điểm cuối WS.
- **Ứng dụng macOS**: giúp bạn chọn Gateway, hiển thị lời nhắc ghép đôi và chỉ dùng SSH làm phương án dự phòng.
- **Node iOS/Android**: duyệt Bonjour để tiện lợi và kết nối tới Gateway WS đã ghép đôi.

## Liên quan

- [Truy cập từ xa](/vi/gateway/remote)
- [Tailscale](/vi/gateway/tailscale)
- [Phát hiện Bonjour](/vi/gateway/bonjour)
