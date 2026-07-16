---
read_when:
    - Chạy nhiều Gateway trên cùng một máy
    - Bạn cần cấu hình/trạng thái/cổng riêng biệt cho từng Gateway
summary: Chạy nhiều Gateway OpenClaw trên một máy chủ (cách ly, cổng và hồ sơ)
title: Nhiều Gateway
x-i18n:
    generated_at: "2026-07-16T14:26:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 655fa865a98064d7c017a7c2eb08ea9a9683002d96a3dbe45a8c16cbd3c86ba1
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

Hầu hết các thiết lập chỉ cần một Gateway - một Gateway duy nhất xử lý nhiều kết nối nhắn tin và tác tử. Chỉ chạy các Gateway riêng biệt với hồ sơ/cổng được cô lập khi bạn cần mức cô lập hoặc dự phòng cao hơn (ví dụ: bot cứu hộ).

## Bắt đầu nhanh với bot cứu hộ

Thiết lập bot cứu hộ đơn giản nhất:

- Giữ bot chính trên hồ sơ mặc định.
- Chạy bot cứu hộ trên `--profile rescue`, với token bot Telegram riêng.
- Đặt bot cứu hộ trên một cổng cơ sở khác, ví dụ: `19789`.

Điều này giúp bot cứu hộ vẫn có thể gỡ lỗi hoặc áp dụng các thay đổi cấu hình nếu bot chính ngừng hoạt động. Để cách ít nhất 20 cổng giữa các cổng cơ sở để các cổng trình duyệt/CDP dẫn xuất không bao giờ xung đột.

```bash
# Bot cứu hộ (bot Telegram riêng, hồ sơ riêng, cổng 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Nếu bot chính đã chạy, thông thường bạn chỉ cần làm vậy. Nếu quy trình thiết lập ban đầu đã cài đặt dịch vụ cứu hộ, hãy bỏ qua `gateway install` cuối cùng.

Trong quá trình `openclaw --profile rescue onboard`:

- Sử dụng một token bot Telegram riêng, dành riêng cho tài khoản cứu hộ (dễ giới hạn chỉ cho người vận hành, độc lập với bản cài đặt kênh/ứng dụng của bot chính và cung cấp một đường khôi phục đơn giản dựa trên tin nhắn trực tiếp).
- Giữ tên hồ sơ `rescue`.
- Sử dụng cổng cơ sở cao hơn cổng của bot chính ít nhất 20.
- Chấp nhận không gian làm việc cứu hộ mặc định, trừ khi bạn đã tự quản lý một không gian làm việc.

### Những thay đổi do `--profile rescue onboard` thực hiện

`--profile rescue onboard` chạy quy trình thiết lập ban đầu thông thường nhưng ghi mọi thứ vào một hồ sơ riêng, vì vậy bot cứu hộ có riêng:

- Tệp hồ sơ/cấu hình
- Thư mục trạng thái
- Không gian làm việc (mặc định: `~/.openclaw/workspace-rescue`)
- Tên dịch vụ được quản lý
- Cổng cơ sở (cùng các cổng dẫn xuất)
- Token bot Telegram

Các lời nhắc còn lại giống hệt quy trình thiết lập ban đầu thông thường.

## Thiết lập nhiều Gateway tổng quát

Cùng một mô hình cô lập này hoạt động cho bất kỳ cặp hoặc nhóm Gateway nào trên một máy chủ - cấp cho mỗi Gateway bổ sung một hồ sơ có tên và cổng cơ sở riêng:

```bash
# chính (hồ sơ mặc định)
openclaw setup
openclaw gateway --port 18789

# gateway bổ sung
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Các hồ sơ có tên ở cả hai phía cũng hoạt động:

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

Sử dụng hướng dẫn bắt đầu nhanh với bot cứu hộ cho một kênh vận hành dự phòng; sử dụng mô hình hồ sơ tổng quát cho nhiều Gateway hoạt động lâu dài trên các kênh, đối tượng thuê, không gian làm việc hoặc vai trò vận hành khác nhau.

## Danh sách kiểm tra cô lập

Giữ các mục sau là duy nhất cho từng phiên bản Gateway:

| Cài đặt                      | Mục đích                              |
| ---------------------------- | ------------------------------------ |
| `OPENCLAW_CONFIG_PATH`       | Tệp cấu hình riêng cho từng phiên bản             |
| `OPENCLAW_STATE_DIR`         | Phiên, thông tin xác thực và bộ nhớ đệm riêng cho từng phiên bản |
| `agents.defaults.workspace`  | Thư mục gốc không gian làm việc riêng cho từng phiên bản          |
| `gateway.port` (hoặc `--port`) | Duy nhất cho từng phiên bản                  |
| Các cổng trình duyệt/CDP dẫn xuất    | Xem bên dưới                            |

Việc dùng chung bất kỳ mục nào trong số này sẽ gây xung đột cấu hình, trạng thái hoặc cổng. Quá trình khởi động Gateway
bắt buộc mỗi thư mục trạng thái phải có quyền sở hữu riêng, ngay cả khi
`OPENCLAW_ALLOW_MULTI_GATEWAY=1` bỏ qua cơ chế một phiên bản duy nhất cho mỗi cấu hình.

## Ánh xạ cổng (dẫn xuất)

Cổng cơ sở = `gateway.port` (hoặc `OPENCLAW_GATEWAY_PORT` / `--port`).

- Cổng dịch vụ điều khiển trình duyệt = cổng cơ sở + 2 (chỉ loopback).
- Máy chủ Canvas được phục vụ trực tiếp trên máy chủ HTTP của Gateway (cùng cổng với `gateway.port`).
- Các cổng CDP của hồ sơ trình duyệt được tự động phân bổ từ `browser control port + 9` đến `+ 108`.

Nếu ghi đè bất kỳ mục nào trong số này trong cấu hình hoặc biến môi trường, bạn phải giữ chúng là duy nhất cho từng phiên bản.

## Lưu ý về trình duyệt/CDP (lỗi thường gặp)

- **Không** cố định `browser.cdpUrl` ở cùng một giá trị trên nhiều phiên bản.
- Mỗi phiên bản cần có cổng điều khiển trình duyệt và dải CDP riêng (được dẫn xuất từ cổng Gateway của phiên bản đó).
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

- `gateway status --deep` phát hiện các dịch vụ launchd/systemd/schtasks lỗi thời từ những bản cài đặt cũ.
- Văn bản cảnh báo của `gateway probe`, chẳng hạn như `multiple reachable gateway identities detected`, chỉ được xem là bình thường khi bạn chủ ý chạy nhiều gateway được cô lập, hoặc khi OpenClaw không thể xác minh rằng các đích thăm dò có thể truy cập là cùng một gateway. Đường hầm SSH, URL proxy hoặc URL từ xa đã cấu hình trỏ đến cùng một gateway vẫn là một gateway với nhiều phương thức truyền tải, ngay cả khi các cổng truyền tải khác nhau.

## Liên quan

- [Sổ tay vận hành Gateway](/vi/gateway)
- [Khóa Gateway](/vi/gateway/gateway-lock)
- [Cấu hình](/vi/gateway/configuration)
