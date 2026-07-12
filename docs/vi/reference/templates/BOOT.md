---
read_when:
    - Thêm danh sách kiểm tra BOOT.md
summary: Mẫu không gian làm việc cho BOOT.md
title: Mẫu BOOT.md
x-i18n:
    generated_at: "2026-07-12T08:25:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1adfb4d71f1f03716a1ddc4774a4cb6ead4b8be65bd9bb34066a9e1929a36b21
    source_path: reference/templates/BOOT.md
    workflow: 16
---

# BOOT.md

Thêm các hướng dẫn khởi động ngắn gọn, rõ ràng tại đây. Hook `boot-md` đi kèm sẽ chạy tệp này một lần cho mỗi không gian làm việc của tác nhân mỗi khi Gateway khởi động, nếu tệp tồn tại và có nội dung không chỉ gồm khoảng trắng. Nhiều tác nhân dùng chung một không gian làm việc chỉ kích hoạt một lần chạy.

Hook này được cung cấp ở trạng thái tắt. Trước tiên, hãy bật hook:

```bash
openclaw hooks enable boot-md
```

Nếu một mục trong danh sách kiểm tra gửi tin nhắn, hãy dùng công cụ nhắn tin, sau đó phản hồi bằng đúng token im lặng `NO_REPLY` (không phân biệt chữ hoa chữ thường).

## Liên quan

- [Không gian làm việc của tác nhân](/vi/concepts/agent-workspace)
- [Hook](/vi/automation/hooks#boot-md)
