---
read_when:
    - Khởi tạo thủ công một không gian làm việc
summary: Mẫu không gian làm việc cho TOOLS.md
title: Mẫu TOOLS.md
x-i18n:
    generated_at: "2026-04-29T23:13:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 810b088129bfd963ffe603a7e0a07d099fd2551bf13ebcb702905e1b8135d017
    source_path: reference/templates/TOOLS.md
    workflow: 16
---

# TOOLS.md - Ghi chú cục bộ

Skills xác định _cách_ công cụ hoạt động. Tệp này dành cho các chi tiết _của bạn_ — những thứ riêng với thiết lập của bạn.

## Nội dung đặt ở đây

Những thứ như:

- Tên và vị trí camera
- Máy chủ và bí danh SSH
- Giọng ưu tiên cho TTS
- Tên loa/phòng
- Biệt danh thiết bị
- Bất kỳ thứ gì dành riêng cho môi trường

## Ví dụ

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Vì sao tách riêng?

Skills được chia sẻ. Thiết lập của bạn là của riêng bạn. Giữ chúng tách biệt nghĩa là bạn có thể cập nhật skills mà không mất ghi chú, và chia sẻ skills mà không làm lộ hạ tầng của mình.

---

Thêm bất cứ điều gì giúp bạn làm việc. Đây là bảng ghi nhớ nhanh của bạn.

## Liên quan

- [Không gian làm việc của agent](/vi/concepts/agent-workspace)
