---
summary: Chuyển hướng đến /plugins/sdk-channel-outbound
title: API tin nhắn kênh
x-i18n:
    generated_at: "2026-06-27T17:57:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16a8218a33b379f82c43c8b7e6ee5423cc7338f72f8489d55aa4c7abb2c53721
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Trang này đã được chuyển đến [API gửi đi của kênh](/vi/plugins/sdk-channel-outbound).

`openclaw/plugin-sdk/channel-message` và
`openclaw/plugin-sdk/channel-message-runtime` vẫn là các đường dẫn con tương thích
không còn được khuyến nghị cho các plugin cũ hơn. Các plugin kênh mới nên dùng
`openclaw/plugin-sdk/channel-outbound` cho vòng đời thông điệp, biên nhận, gửi
bền vững và các trình trợ giúp xem trước trực tiếp. Các đường dẫn con không còn
được khuyến nghị là những bí danh mỏng trên lõi thông điệp kênh dùng chung và
các bề mặt SDK gửi đến/gửi đi chuyên biệt; không thêm trình trợ giúp mới ở đó.

Kế hoạch gỡ bỏ: giữ các bí danh này trong suốt giai đoạn di chuyển plugin bên
ngoài, rồi gỡ bỏ chúng trong lần dọn dẹp SDK lớn tiếp theo sau khi các bên gọi
đã chuyển sang `channel-outbound`.
