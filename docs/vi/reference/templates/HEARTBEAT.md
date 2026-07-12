---
read_when:
    - Khởi tạo thủ công một không gian làm việc
summary: Mẫu không gian làm việc cho HEARTBEAT.md
title: Mẫu HEARTBEAT.md
x-i18n:
    generated_at: "2026-07-12T08:20:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1605f546995e0bdcb11f9bf905173b14aca25cfad664fe2c7644d18c2b4142e2
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# Mẫu HEARTBEAT.md

`HEARTBEAT.md` nằm trong không gian làm việc của tác nhân và chứa danh sách kiểm tra Heartbeat định kỳ. Giữ tệp trống hoặc chỉ chứa khoảng trắng, chú thích Markdown, tiêu đề ATX, mục danh sách trống (`- `, `* [ ]`) hay dấu phân cách khối mã để OpenClaw bỏ qua hoàn toàn lệnh gọi mô hình Heartbeat (`reason=empty-heartbeat-file`).

Nội dung mặc định được phân phối:

```markdown
<!-- Mẫu Heartbeat; nội dung chỉ có chú thích sẽ ngăn các lệnh gọi API Heartbeat theo lịch. -->

# Giữ tệp này trống (hoặc chỉ chứa chú thích) để bỏ qua các lệnh gọi API Heartbeat.

# Thêm tác vụ bên dưới khi bạn muốn tác nhân kiểm tra nội dung nào đó theo định kỳ.
```

Chỉ thêm các tác vụ ngắn bên dưới những dòng chú thích khi bạn muốn thực hiện kiểm tra định kỳ. Giữ nội dung ngắn gọn: mỗi nhịp chạy Heartbeat đều đọc tệp này (mặc định 30 phút một lần), vì vậy hướng dẫn dài dòng sẽ tiêu tốn token mỗi lần đánh thức.

Để chỉ thực hiện các kiểm tra đến hạn thay vì dùng danh sách kiểm tra đơn giản, hãy sử dụng khối `tasks:` có cấu trúc với các trường `interval` và `prompt` cho từng tác vụ; xem [HEARTBEAT.md](/vi/gateway/heartbeat#heartbeatmd-optional) để biết định dạng và cách hoạt động.

## Liên quan

- [Heartbeat](/vi/gateway/heartbeat)
- [Cấu hình Heartbeat](/vi/gateway/config-agents)
