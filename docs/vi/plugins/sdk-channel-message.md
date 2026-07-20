---
summary: Chuyển hướng đến /plugins/sdk-channel-outbound
title: API tin nhắn kênh
x-i18n:
    generated_at: "2026-07-20T04:41:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bf0d607bd3287233cbb1fe47c15958bf57a81267ae1e37e45a1881f56e1370cb
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Trang này đã được chuyển đến [API gửi đi của kênh](/vi/plugins/sdk-channel-outbound).

`openclaw/plugin-sdk/channel-message` vẫn là một đường dẫn con tương thích đã ngừng khuyến nghị
dành cho các plugin cũ. Các plugin kênh mới nên sử dụng
`openclaw/plugin-sdk/channel-outbound` cho vòng đời tin nhắn, biên nhận,
gửi bền vững và các trình trợ giúp xem trước trực tiếp, thay vì thêm trình trợ giúp mới vào
đường dẫn con đã ngừng khuyến nghị.

Kế hoạch loại bỏ: giữ các bí danh này trong suốt khoảng thời gian di chuyển
plugin bên ngoài, sau đó loại bỏ chúng trong đợt dọn dẹp SDK lớn tiếp theo sau khi các bên gọi đã
chuyển sang `channel-outbound`.
