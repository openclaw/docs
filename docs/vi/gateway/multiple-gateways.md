---
read_when:
    - Chạy nhiều Gateway trên cùng một máy
    - Bạn cần cấu hình/trạng thái/cổng riêng biệt cho từng Gateway
summary: Chạy nhiều Gateway OpenClaw trên một máy chủ (cách ly, cổng và hồ sơ)
title: Nhiều Gateway
x-i18n:
    generated_at: "2026-07-12T07:55:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d5088d9bcfae6800217079365dcaec828a18ca19ac80c7ad7b4245d9059a986
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

Hầu hết các thiết lập chỉ cần một Gateway — một Gateway duy nhất xử lý nhiều kết nối nhắn tin và tác nhân. Chỉ chạy các Gateway riêng biệt với hồ sơ/cổng được cô lập khi bạn cần mức độ cô lập hoặc dự phòng cao hơn (ví dụ: bot cứu hộ).

## Bắt đầu nhanh với bot cứu hộ

Thiết lập bot cứu hộ đơn giản nhất:

- Giữ bot chính trên hồ sơ mặc định.
- Chạy bot cứu hộ với `--profile rescue`, sử dụng token bot Telegram riêng.
- Đặt bot cứu hộ trên một cổng cơ sở khác, ví dụ `19789`.

Cách này giúp bot cứu hộ vẫn có thể gỡ lỗi hoặc áp dụng các thay đổi cấu hình nếu bot chính ngừng hoạt động. Chừa ít nhất 20 cổng giữa các cổng cơ sở để các cổng trình duyệt/CDP dẫn xuất không bao giờ xung đột.

```bash
# Bot cứu hộ (bot Telegram riêng, hồ sơ riêng, cổng 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Nếu bot chính của bạn đang chạy, thông thường bạn chỉ cần làm vậy. Nếu quá trình làm quen đã cài đặt dịch vụ cứu hộ, hãy bỏ qua lệnh `gateway install` cuối cùng.

Trong quá trình chạy `openclaw --profile rescue onboard`:

- Sử dụng token bot Telegram riêng, dành riêng cho tài khoản cứu hộ (dễ giới hạn chỉ cho người vận hành, độc lập với việc cài đặt kênh/ứng dụng của bot chính và cung cấp một đường khôi phục đơn giản dựa trên tin nhắn trực tiếp).
- Giữ tên hồ sơ là `rescue`.
- Sử dụng cổng cơ sở cao hơn cổng của bot chính ít nhất 20.
- Chấp nhận không gian làm việc cứu hộ mặc định, trừ khi bạn đã tự quản lý một không gian làm việc.

### Những thay đổi do `--profile rescue onboard` thực hiện

`--profile rescue onboard` chạy quy trình làm quen thông thường nhưng ghi mọi thứ vào một hồ sơ riêng, nhờ đó bot cứu hộ có riêng:

- Tệp hồ sơ/cấu hình
- Thư mục trạng thái
- Không gian làm việc (mặc định: `~/.openclaw/workspace-rescue`)
- Tên dịch vụ được quản lý
- Cổng cơ sở (cùng các cổng dẫn xuất)
- Token bot Telegram

Ngoài ra, các lời nhắc đều giống với quy trình làm quen thông thường.

## Thiết lập nhiều Gateway tổng quát

Cùng một mô hình cô lập có thể áp dụng cho bất kỳ cặp hoặc nhóm Gateway nào trên một máy chủ — cấp cho mỗi Gateway bổ sung một hồ sơ có tên và cổng cơ sở riêng:

```bash
# chính (hồ sơ mặc định)
openclaw setup
openclaw gateway --port 18789

# Gateway bổ sung
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Cũng có thể sử dụng hồ sơ có tên cho cả hai bên:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Các dịch vụ tuân theo cùng một mô hình:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Sử dụng hướng dẫn bắt đầu nhanh với bot cứu hộ để có một kênh vận hành dự phòng; sử dụng mô hình hồ sơ tổng quát cho nhiều Gateway hoạt động lâu dài trên các kênh, đối tượng thuê, không gian làm việc hoặc vai trò vận hành khác nhau.

## Danh sách kiểm tra về cô lập

Giữ các mục sau là duy nhất cho từng phiên bản Gateway:

| Thiết lập                     | Mục đích                                           |
| ---------------------------- | -------------------------------------------------- |
| `OPENCLAW_CONFIG_PATH`       | Tệp cấu hình riêng cho từng phiên bản              |
| `OPENCLAW_STATE_DIR`         | Phiên, thông tin xác thực và bộ nhớ đệm riêng      |
| `agents.defaults.workspace`  | Thư mục gốc không gian làm việc riêng              |
| `gateway.port` (hoặc `--port`) | Duy nhất cho từng phiên bản                      |
| Các cổng trình duyệt/CDP dẫn xuất | Xem bên dưới                                  |

Việc dùng chung bất kỳ mục nào trong số này sẽ gây ra tranh chấp cấu hình và xung đột cổng.

## Ánh xạ cổng (dẫn xuất)

Cổng cơ sở = `gateway.port` (hoặc `OPENCLAW_GATEWAY_PORT` / `--port`).

- Cổng dịch vụ điều khiển trình duyệt = cổng cơ sở + 2 (chỉ local loopback).
- Máy chủ Canvas được phục vụ ngay trên máy chủ HTTP của Gateway (cùng cổng với `gateway.port`).
- Các cổng CDP của hồ sơ trình duyệt được tự động cấp phát từ `cổng điều khiển trình duyệt + 9` đến `+ 108`.

Nếu ghi đè bất kỳ mục nào trong số này trong cấu hình hoặc biến môi trường, bạn phải giữ chúng là duy nhất cho từng phiên bản.

## Lưu ý về trình duyệt/CDP (lỗi thường gặp)

- **Không** cố định `browser.cdpUrl` ở cùng một giá trị trên nhiều phiên bản.
- Mỗi phiên bản cần có cổng điều khiển trình duyệt và dải CDP riêng (dẫn xuất từ cổng Gateway của phiên bản đó).
- Đối với các cổng CDP được chỉ định rõ ràng, hãy đặt `browser.profiles.<name>.cdpPort` riêng cho từng phiên bản.
- Đối với Chrome từ xa, hãy sử dụng `browser.profiles.<name>.cdpUrl` (theo từng hồ sơ, từng phiên bản).

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

- `gateway status --deep` phát hiện các dịch vụ launchd/systemd/schtasks cũ còn sót lại từ những lần cài đặt trước.
- Văn bản cảnh báo của `gateway probe`, chẳng hạn như `multiple reachable gateway identities detected`, chỉ được xem là bình thường khi bạn chủ ý chạy nhiều Gateway được cô lập, hoặc khi OpenClaw không thể xác minh rằng các đích thăm dò có thể truy cập là cùng một Gateway. Đường hầm SSH, URL proxy hoặc URL từ xa đã cấu hình trỏ đến cùng một Gateway vẫn chỉ là một Gateway với nhiều phương thức truyền tải, ngay cả khi các cổng truyền tải khác nhau.

## Liên quan

- [Sổ tay vận hành Gateway](/vi/gateway)
- [Khóa Gateway](/vi/gateway/gateway-lock)
- [Cấu hình](/vi/gateway/configuration)
