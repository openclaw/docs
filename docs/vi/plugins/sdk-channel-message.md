---
summary: Chuyển hướng đến /plugins/sdk-channel-outbound
title: API tin nhắn kênh
x-i18n:
    generated_at: "2026-07-12T08:17:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c59ba7d1046518e0e3765db19c88ce20d555f7dabf6b054d28f4bc105d5acd
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Trang này đã được chuyển đến [API gửi đi của kênh](/vi/plugins/sdk-channel-outbound).

`openclaw/plugin-sdk/channel-message` và
`openclaw/plugin-sdk/channel-message-runtime` vẫn là các đường dẫn con tương thích
đã ngừng khuyến nghị dành cho các plugin cũ; cả hai đều là bí danh mỏng trỏ đến phần lõi
tin nhắn kênh dùng chung. Các plugin kênh mới nên sử dụng
`openclaw/plugin-sdk/channel-outbound` cho vòng đời tin nhắn, biên nhận,
gửi bền vững và các trình trợ giúp xem trước trực tiếp, thay vì thêm trình trợ giúp mới vào
các đường dẫn con đã ngừng khuyến nghị.

Kế hoạch loại bỏ: giữ các bí danh này trong suốt giai đoạn chuyển đổi
plugin bên ngoài, sau đó loại bỏ chúng trong đợt dọn dẹp SDK lớn tiếp theo sau khi các bên gọi
đã chuyển sang `channel-outbound`.
