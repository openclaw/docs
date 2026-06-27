---
read_when:
    - Khởi tạo thủ công một workspace
summary: Mẫu không gian làm việc cho HEARTBEAT.md
title: Mẫu HEARTBEAT.md
x-i18n:
    generated_at: "2026-06-27T18:10:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a1ea787d67110ca53d752706b62f5ce5c4df8637897dee97ce6502f6a05eb6
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# Mẫu HEARTBEAT.md

`HEARTBEAT.md` nằm trong không gian làm việc của tác tử. Giữ tệp trống, hoặc chỉ có các chú thích và tiêu đề Markdown, khi bạn muốn OpenClaw bỏ qua các lệnh gọi mô hình Heartbeat.

Mẫu thời gian chạy mặc định là:

```markdown
# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
```

Chỉ thêm các tác vụ ngắn bên dưới phần chú thích khi bạn muốn tác tử kiểm tra điều gì đó định kỳ. Giữ hướng dẫn Heartbeat ngắn gọn vì chúng được đọc trong các lần đánh thức lặp lại.

## Liên quan

- [Cấu hình Heartbeat](/vi/gateway/config-agents)
