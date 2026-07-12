---
read_when:
    - Khởi tạo không gian làm việc theo cách thủ công
summary: Mẫu không gian làm việc cho TOOLS.md
title: Mẫu TOOLS.md
x-i18n:
    generated_at: "2026-07-12T08:21:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20eab78b3b117566a1d33a70873e70ff2d5099543aa44e2719dc8d0797099afe
    source_path: reference/templates/TOOLS.md
    workflow: 16
---

# TOOLS.md - Ghi chú cục bộ

Skills xác định _cách_ các công cụ hoạt động. Tệp này dành cho các thông tin cụ thể _của bạn_ — những nội dung riêng biệt trong thiết lập của bạn: tên và vị trí camera, máy chủ và bí danh SSH, giọng TTS ưa thích, tên loa/phòng, biệt danh thiết bị và mọi thông tin riêng cho môi trường.

## Ví dụ

```markdown
### Camera

- living-room → Khu vực chính, góc rộng 180°
- front-door → Lối vào, kích hoạt khi phát hiện chuyển động

### SSH

- home-server → 192.168.1.100, người dùng: admin

### TTS

- Giọng ưa thích: "Nova" (ấm áp, hơi hướng Anh)
- Loa mặc định: Kitchen HomePod
```

## Tại sao cần tách riêng?

Skills được dùng chung. Thiết lập của bạn thuộc về bạn. Việc tách riêng chúng giúp bạn có thể cập nhật Skills mà không làm mất ghi chú, đồng thời chia sẻ Skills mà không làm lộ hạ tầng của mình.

---

Hãy thêm bất cứ nội dung nào giúp bạn thực hiện công việc. Đây là tài liệu tham khảo nhanh của bạn.

## Liên quan

- [Không gian làm việc của tác nhân](/vi/concepts/agent-workspace)
