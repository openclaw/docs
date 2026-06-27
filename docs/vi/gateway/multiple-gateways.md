---
read_when:
    - Chạy nhiều hơn một Gateway trên cùng một máy
    - Bạn cần cấu hình/trạng thái/cổng tách biệt cho mỗi Gateway
summary: Chạy nhiều OpenClaw Gateway trên một máy chủ (cô lập, cổng và hồ sơ)
title: Nhiều Gateway
x-i18n:
    generated_at: "2026-06-27T17:30:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d6f6df481f6ba36749770199ef6eaf94eed33af2bed38d35a31f77b9dbba1913
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

Hầu hết thiết lập nên dùng một Gateway vì một Gateway duy nhất có thể xử lý nhiều kết nối nhắn tin và agent. Nếu bạn cần mức cô lập hoặc dự phòng mạnh hơn (ví dụ: bot cứu hộ), hãy chạy các Gateway riêng với hồ sơ/cổng được cô lập.

## Thiết lập được khuyến nghị tốt nhất

Với hầu hết người dùng, thiết lập bot cứu hộ đơn giản nhất là:

- giữ bot chính trên hồ sơ mặc định
- chạy bot cứu hộ trên `--profile rescue`
- dùng một bot Telegram hoàn toàn riêng cho tài khoản cứu hộ
- giữ bot cứu hộ trên một cổng cơ sở khác, chẳng hạn `19789`

Cách này giữ bot cứu hộ tách biệt với bot chính để nó có thể gỡ lỗi hoặc áp dụng
thay đổi cấu hình nếu bot chính bị ngừng hoạt động. Chừa ít nhất 20 cổng giữa
các cổng cơ sở để các cổng trình duyệt/canvas/CDP dẫn xuất không bao giờ xung đột.

## Khởi động nhanh bot cứu hộ

Dùng đây làm lộ trình mặc định trừ khi bạn có lý do mạnh để làm theo cách
khác:

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Nếu bot chính của bạn đã chạy, thông thường đó là tất cả những gì bạn cần.

Trong khi chạy `openclaw --profile rescue onboard`:

- dùng token bot Telegram riêng
- giữ hồ sơ `rescue`
- dùng cổng cơ sở cao hơn bot chính ít nhất 20 cổng
- chấp nhận không gian làm việc cứu hộ mặc định trừ khi bạn đã tự quản lý một không gian

Nếu quá trình onboarding đã cài đặt dịch vụ cứu hộ cho bạn, lệnh
`gateway install` cuối cùng là không cần thiết.

## Vì sao cách này hoạt động

Bot cứu hộ vẫn độc lập vì nó có riêng:

- hồ sơ/cấu hình
- thư mục trạng thái
- không gian làm việc
- cổng cơ sở (cộng với các cổng dẫn xuất)
- token bot Telegram

Với hầu hết thiết lập, hãy dùng một bot Telegram hoàn toàn riêng cho hồ sơ cứu hộ:

- dễ giữ ở chế độ chỉ dành cho người vận hành
- token và danh tính bot riêng
- độc lập với kênh/bản cài đặt ứng dụng của bot chính
- đường khôi phục qua DM đơn giản khi bot chính bị hỏng

## `--profile rescue onboard` thay đổi gì

`openclaw --profile rescue onboard` dùng luồng onboarding bình thường, nhưng
ghi mọi thứ vào một hồ sơ riêng.

Trên thực tế, điều đó nghĩa là bot cứu hộ có riêng:

- tệp cấu hình
- thư mục trạng thái
- không gian làm việc (mặc định là `~/.openclaw/workspace-rescue`)
- tên dịch vụ được quản lý

Các lời nhắc còn lại giống onboarding bình thường.

## Thiết lập nhiều Gateway tổng quát

Bố cục bot cứu hộ ở trên là mặc định dễ nhất, nhưng cùng mẫu cô lập đó
hoạt động cho bất kỳ cặp hoặc nhóm Gateway nào trên một máy chủ.

Với thiết lập tổng quát hơn, hãy cấp cho mỗi Gateway bổ sung một hồ sơ có tên riêng và
cổng cơ sở riêng:

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Nếu bạn muốn cả hai Gateway đều dùng hồ sơ có tên, cách đó cũng hoạt động:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Dịch vụ tuân theo cùng mẫu:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Dùng khởi động nhanh bot cứu hộ khi bạn muốn một làn dự phòng cho người vận hành. Dùng
mẫu hồ sơ tổng quát khi bạn muốn nhiều Gateway tồn tại lâu dài cho
các kênh, tenant, không gian làm việc hoặc vai trò vận hành khác nhau.

## Danh sách kiểm tra cô lập

Giữ các mục này là duy nhất cho mỗi phiên bản Gateway:

- `OPENCLAW_CONFIG_PATH` — tệp cấu hình theo từng phiên bản
- `OPENCLAW_STATE_DIR` — phiên, thông tin xác thực, bộ nhớ đệm theo từng phiên bản
- `agents.defaults.workspace` — thư mục gốc không gian làm việc theo từng phiên bản
- `gateway.port` (hoặc `--port`) — duy nhất cho mỗi phiên bản
- các cổng trình duyệt/canvas/CDP dẫn xuất

Nếu các mục này được dùng chung, bạn sẽ gặp tranh chấp cấu hình và xung đột cổng.

## Ánh xạ cổng (dẫn xuất)

Cổng cơ sở = `gateway.port` (hoặc `OPENCLAW_GATEWAY_PORT` / `--port`).

- cổng dịch vụ điều khiển trình duyệt = cơ sở + 2 (chỉ loopback)
- máy chủ canvas được phục vụ trên máy chủ HTTP của Gateway (cùng cổng với `gateway.port`)
- Các cổng CDP của hồ sơ trình duyệt tự động cấp phát từ `browser.controlPort + 9 .. + 108`

Nếu bạn ghi đè bất kỳ mục nào trong cấu hình hoặc biến môi trường, bạn phải giữ chúng duy nhất theo từng phiên bản.

## Ghi chú Browser/CDP (lỗi dễ mắc phổ biến)

- **Không** ghim `browser.cdpUrl` vào cùng giá trị trên nhiều phiên bản.
- Mỗi phiên bản cần cổng điều khiển trình duyệt và dải CDP riêng (dẫn xuất từ cổng Gateway của nó).
- Nếu bạn cần cổng CDP rõ ràng, hãy đặt `browser.profiles.<name>.cdpPort` theo từng phiên bản.
- Chrome từ xa: dùng `browser.profiles.<name>.cdpUrl` (theo hồ sơ, theo phiên bản).

## Ví dụ biến môi trường thủ công

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## Kiểm tra nhanh

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Diễn giải:

- `gateway status --deep` giúp phát hiện các dịch vụ launchd/systemd/schtasks lỗi thời từ các bản cài đặt cũ.
- Văn bản cảnh báo của `gateway probe` như `multiple reachable gateway identities detected` chỉ được mong đợi khi bạn cố ý chạy nhiều hơn một gateway được cô lập, hoặc khi OpenClaw không thể chứng minh các mục tiêu probe truy cập được là cùng một gateway. Một đường hầm SSH, URL proxy hoặc URL từ xa được cấu hình trỏ tới cùng gateway là một gateway với nhiều phương thức truyền tải, ngay cả khi các cổng truyền tải khác nhau.

## Liên quan

- [Sổ tay vận hành Gateway](/vi/gateway)
- [Khóa Gateway](/vi/gateway/gateway-lock)
- [Cấu hình](/vi/gateway/configuration)
