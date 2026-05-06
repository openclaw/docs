---
read_when:
    - Bạn muốn khám phá diện rộng (DNS-SD) thông qua Tailscale + CoreDNS
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Tài liệu tham chiếu CLI cho `openclaw dns` (các trình trợ giúp khám phá diện rộng)
title: DNS
x-i18n:
    generated_at: "2026-05-06T09:04:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 460bdcbaa2c0c0fc1a4f5bdd76b904d8ac35195a25324c66421abfdc2044bb07
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

Các trình hỗ trợ DNS cho khám phá diện rộng (Tailscale + CoreDNS). Hiện tập trung vào macOS + Homebrew CoreDNS.

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

- `--domain <domain>`: domain khám phá diện rộng (ví dụ `openclaw.internal`)
- `--apply`: cài đặt hoặc cập nhật cấu hình CoreDNS và khởi động lại dịch vụ (yêu cầu sudo; chỉ macOS)

Nội dung hiển thị:

- domain khám phá đã phân giải
- đường dẫn tệp vùng
- các IP tailnet hiện tại
- cấu hình khám phá `openclaw.json` được khuyến nghị
- các giá trị nameserver/domain Split DNS của Tailscale cần đặt

Ghi chú:

- Không có `--apply`, lệnh chỉ là trình hỗ trợ lập kế hoạch và in thiết lập được khuyến nghị.
- Nếu bỏ qua `--domain`, OpenClaw dùng `discovery.wideArea.domain` từ cấu hình.
- `--apply` hiện chỉ hỗ trợ macOS và yêu cầu Homebrew CoreDNS.
- `--apply` khởi tạo tệp vùng nếu cần, bảo đảm stanza import của CoreDNS tồn tại, và khởi động lại dịch vụ brew `coredns`.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Khám phá](/vi/gateway/discovery)
