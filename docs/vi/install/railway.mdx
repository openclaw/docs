---
read_when:
    - Triển khai OpenClaw lên Railway
    - Bạn muốn triển khai lên đám mây chỉ bằng một cú nhấp chuột với giao diện điều khiển trên trình duyệt
summary: Triển khai OpenClaw trên Railway bằng mẫu một cú nhấp chuột
title: Railway
x-i18n:
    generated_at: "2026-07-12T08:03:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbef00b8de61545e9971b18164472c2f47fe607f69ec36f83a27a11b65ea863f
    source_path: install/railway.mdx
    workflow: 16
---

Triển khai OpenClaw trên Railway bằng mẫu một cú nhấp và truy cập thông qua Control UI trên web. Đây là cách dễ nhất để "không cần terminal trên máy chủ": Railway sẽ chạy Gateway cho bạn.

## Triển khai bằng một cú nhấp

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Triển khai trên Railway
</a>

<Steps>
  <Step title="Triển khai mẫu">
    Nhấp vào **Deploy on Railway** ở trên.
  </Step>

<Step title="Thêm ổ đĩa">
  Gắn một ổ đĩa được mount tại `/data` (bắt buộc để lưu trạng thái lâu dài).
</Step>

  <Step title="Đặt biến">
    Đặt các **Variables** bắt buộc cho dịch vụ:

    - `OPENCLAW_GATEWAY_PORT=8080` (bắt buộc -- phải khớp với cổng trong Public Networking)
    - `OPENCLAW_GATEWAY_TOKEN` (bắt buộc; hãy coi đây là bí mật quản trị)
    - `OPENCLAW_STATE_DIR=/data/.openclaw` (khuyến nghị)
    - `OPENCLAW_WORKSPACE_DIR=/data/workspace` (khuyến nghị)

  </Step>

<Step title="Bật mạng công khai">
  Trong **Public Networking**, bật **HTTP Proxy** cho dịch vụ trên cổng `8080`.
</Step>

  <Step title="Kết nối">
    Tìm URL công khai của bạn trong **Railway -> your service -> Settings -> Domains** -- có thể là miền được tạo tự động (thường là `https://<something>.up.railway.app`) hoặc miền tùy chỉnh bạn đã đính kèm.

    Mở `https://<your-railway-domain>/openclaw` và kết nối bằng bí mật dùng chung đã cấu hình. Theo mặc định, mẫu sử dụng `OPENCLAW_GATEWAY_TOKEN`; nếu bạn thay thế bằng xác thực mật khẩu, hãy dùng mật khẩu đó.

  </Step>
</Steps>

## Những gì bạn nhận được

- Gateway OpenClaw được lưu trữ + Control UI
- Lưu trữ lâu dài thông qua Railway Volume (`/data`), nhờ đó `openclaw.json`, `auth-profiles.json` của từng tác nhân, trạng thái kênh/nhà cung cấp, phiên và không gian làm việc vẫn được giữ nguyên sau khi triển khai lại

## Kết nối một kênh

Sử dụng Control UI tại `/openclaw` hoặc chạy `openclaw onboard` qua shell của Railway để xem hướng dẫn thiết lập kênh:

- [Discord](/vi/channels/discord)
- [Telegram](/vi/channels/telegram) (nhanh nhất -- chỉ cần token bot)
- [Tất cả các kênh](/vi/channels)

## Sao lưu và di chuyển

Xuất trạng thái, cấu hình, hồ sơ xác thực và không gian làm việc của bạn:

```bash
openclaw backup create
```

Lệnh này tạo một tệp lưu trữ sao lưu có thể di chuyển, bao gồm trạng thái OpenClaw và mọi không gian làm việc đã cấu hình. Xem [Sao lưu](/vi/cli/backup) để biết chi tiết.

## Các bước tiếp theo

- Thiết lập các kênh nhắn tin: [Kênh](/vi/channels)
- Cấu hình Gateway: [Cấu hình Gateway](/vi/gateway/configuration)
- Luôn cập nhật OpenClaw: [Cập nhật](/vi/install/updating)
