---
read_when:
    - Bạn muốn khám phá trên mạng diện rộng (DNS-SD) qua Tailscale + CoreDNS
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Tài liệu tham khảo CLI cho `openclaw dns` (các trình trợ giúp khám phá trên mạng diện rộng)
title: DNS
x-i18n:
    generated_at: "2026-07-12T07:47:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb07353df03f9d169e1aede2da0b711ffb68e8c9d21d51359e93e92cc0818ca2
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

Các tiện ích DNS để khám phá trên mạng diện rộng (Tailscale + CoreDNS). Hiện chỉ hỗ trợ macOS + CoreDNS qua Homebrew.

Liên quan:

- Khám phá Gateway: [Khám phá](/vi/gateway/discovery)
- Cấu hình khám phá trên mạng diện rộng: [Cấu hình](/vi/gateway/configuration)

## `dns setup`

Lập kế hoạch hoặc áp dụng thiết lập CoreDNS để khám phá DNS-SD đơn hướng.

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

| Tùy chọn            | Tác dụng                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------- |
| `--domain <domain>` | Miền khám phá trên mạng diện rộng (ví dụ: `openclaw.internal`).                              |
| `--apply`           | Cài đặt/cập nhật cấu hình CoreDNS và khởi động (lại) dịch vụ. Yêu cầu sudo, chỉ dành cho macOS. |

Nếu không có `--domain`, OpenClaw sử dụng `discovery.wideArea.domain` từ cấu hình.

Nếu không có `--apply`, lệnh chỉ hiển thị:

- Miền khám phá đã phân giải và đường dẫn tệp vùng
- Các địa chỉ IP tailnet hiện tại
- Cấu hình khám phá `openclaw.json` được đề xuất
- Các giá trị máy chủ tên/miền Split DNS của Tailscale cần đặt trong bảng điều khiển quản trị Tailscale

Khi có `--apply` (chỉ dành cho macOS, yêu cầu CoreDNS qua Homebrew):

- Khởi tạo tệp vùng nếu chưa có
- Thêm đoạn khai báo nhập CoreDNS nếu chưa có
- Khởi động lại dịch vụ brew `coredns`

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Khám phá](/vi/gateway/discovery)
