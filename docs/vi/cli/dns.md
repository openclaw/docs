---
read_when:
    - Bạn muốn phát hiện diện rộng (DNS-SD) thông qua Tailscale + CoreDNS
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Tài liệu tham chiếu CLI cho `openclaw dns` (trình trợ giúp khám phá diện rộng)
title: DNS
x-i18n:
    generated_at: "2026-04-29T22:31:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99dcf7c8c76833784a2b712b02f9e40c6c0548c37c9743a89b9d650fe503d385
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

Các helper DNS cho khám phá diện rộng (Tailscale + CoreDNS). Hiện tập trung vào macOS + Homebrew CoreDNS.

Liên quan:

- Khám phá Gateway: [Khám phá](/vi/gateway/discovery)
- Cấu hình khám phá diện rộng: [Cấu hình](/vi/gateway/configuration)

## Thiết lập

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Lập kế hoạch hoặc áp dụng thiết lập CoreDNS cho khám phá DNS-SD unicast.

Tùy chọn:

- `--domain <domain>`: miền khám phá diện rộng (ví dụ `openclaw.internal`)
- `--apply`: cài đặt hoặc cập nhật cấu hình CoreDNS và khởi động lại dịch vụ (yêu cầu sudo; chỉ macOS)

Nội dung hiển thị:

- miền khám phá đã phân giải
- đường dẫn tệp zone
- các IP tailnet hiện tại
- cấu hình khám phá `openclaw.json` được khuyến nghị
- các giá trị máy chủ định danh/miền Tailscale Split DNS cần đặt

Ghi chú:

- Nếu không có `--apply`, lệnh chỉ là helper lập kế hoạch và in ra thiết lập được khuyến nghị.
- Nếu bỏ qua `--domain`, OpenClaw dùng `discovery.wideArea.domain` từ cấu hình.
- `--apply` hiện chỉ hỗ trợ macOS và yêu cầu Homebrew CoreDNS.
- `--apply` khởi tạo tệp zone nếu cần, bảo đảm khối import CoreDNS tồn tại, và khởi động lại dịch vụ brew `coredns`.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Khám phá](/vi/gateway/discovery)
