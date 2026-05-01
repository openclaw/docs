---
read_when:
    - Bạn sử dụng Plugin voice-call và muốn các điểm vào CLI
    - Bạn muốn các ví dụ nhanh cho `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: Tài liệu tham chiếu CLI cho `openclaw voicecall` (giao diện lệnh Plugin gọi thoại)
title: Cuộc gọi thoại
x-i18n:
    generated_at: "2026-05-01T10:47:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: c040cf4cd984ad6d6dd302923494a7c8ee131390b803fe20a9894b077f08d5bb
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` là một lệnh do Plugin cung cấp. Lệnh này chỉ xuất hiện nếu Plugin cuộc gọi thoại đã được cài đặt và bật.

Khi Gateway đang chạy, các lệnh vận hành (`call`, `start`,
`continue`, `speak`, `dtmf`, `end`, và `status`) được gửi đến runtime cuộc gọi thoại
của Gateway đó. Nếu không kết nối được Gateway nào, chúng sẽ quay về dùng runtime
CLI độc lập.

Tài liệu chính:

- Plugin cuộc gọi thoại: [Cuộc gọi thoại](/vi/plugins/voice-call)

## Các lệnh phổ biến

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

Theo mặc định, `setup` in ra các kiểm tra mức độ sẵn sàng ở dạng con người dễ đọc. Dùng `--json` cho
script:

```bash
openclaw voicecall setup --json
```

Theo mặc định, `status` in các cuộc gọi đang hoạt động dưới dạng JSON. Truyền `--call-id <id>` để kiểm tra
một cuộc gọi.

Đối với nhà cung cấp bên ngoài (`twilio`, `telnyx`, `plivo`), bước thiết lập phải phân giải một URL
Webhook công khai từ `publicUrl`, một đường hầm, hoặc phần phơi bày qua Tailscale. Phương án dự phòng
phục vụ qua loopback/riêng tư bị từ chối vì nhà mạng không thể truy cập được.

`smoke` chạy cùng các kiểm tra mức độ sẵn sàng. Lệnh này sẽ không thực hiện cuộc gọi điện thoại thật
trừ khi có cả `--to` và `--yes`:

```bash
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

## Phơi bày Webhook (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Lưu ý bảo mật: chỉ phơi bày điểm cuối Webhook cho các mạng mà bạn tin tưởng. Ưu tiên Tailscale Serve thay vì Funnel khi có thể.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Plugin cuộc gọi thoại](/vi/plugins/voice-call)
