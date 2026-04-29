---
read_when:
    - Bạn sử dụng Plugin cuộc gọi thoại và muốn các điểm vào CLI
    - Bạn muốn các ví dụ nhanh cho `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: Tham chiếu CLI cho `openclaw voicecall` (giao diện lệnh của Plugin cuộc gọi thoại)
title: Cuộc gọi thoại
x-i18n:
    generated_at: "2026-04-29T22:35:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c8b83ef75f792920024a67b0dee1b07aff9f55486de1149266c6d94854ca0fe
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` là một lệnh do Plugin cung cấp. Lệnh này chỉ xuất hiện nếu Plugin cuộc gọi thoại đã được cài đặt và bật.

Tài liệu chính:

- Plugin cuộc gọi thoại: [Cuộc gọi thoại](/vi/plugins/voice-call)

## Các lệnh thường dùng

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

Theo mặc định, `setup` in các kiểm tra mức độ sẵn sàng ở dạng con người đọc được. Dùng `--json` cho
script:

```bash
openclaw voicecall setup --json
```

Đối với các nhà cung cấp bên ngoài (`twilio`, `telnyx`, `plivo`), quá trình thiết lập phải phân giải được một URL
Webhook công khai từ `publicUrl`, một đường hầm, hoặc khả năng công khai qua Tailscale. Phương án dự phòng phục vụ qua loopback/riêng tư
bị từ chối vì các nhà mạng không thể truy cập được.

`smoke` chạy cùng các kiểm tra mức độ sẵn sàng. Lệnh này sẽ không thực hiện cuộc gọi điện thoại thật
trừ khi có cả `--to` và `--yes`:

```bash
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

## Công khai Webhook (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Ghi chú bảo mật: chỉ công khai endpoint Webhook cho các mạng mà bạn tin cậy. Ưu tiên Tailscale Serve thay vì Funnel khi có thể.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Plugin cuộc gọi thoại](/vi/plugins/voice-call)
