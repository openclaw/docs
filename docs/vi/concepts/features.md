---
read_when:
    - Bạn muốn danh sách đầy đủ những gì OpenClaw hỗ trợ
summary: Các khả năng của OpenClaw trên các kênh, định tuyến, phương tiện và trải nghiệm người dùng.
title: Tính năng
x-i18n:
    generated_at: "2026-06-27T17:22:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b69cead6fc3c6af91e95f8080d9ca409f24c314cf97f707b67d8fdeb84cf92fa
    source_path: concepts/features.md
    workflow: 16
---

## Điểm nổi bật

<Columns>
  <Card title="Kênh" icon="message-square" href="/vi/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat và nhiều kênh khác với một Gateway duy nhất.
  </Card>
  <Card title="Plugin" icon="plug" href="/vi/tools/plugin">
    Các Plugin đi kèm bổ sung Matrix, Nextcloud Talk, Nostr, Twitch, Zalo và nhiều dịch vụ khác mà không cần cài đặt riêng trong các bản phát hành hiện tại thông thường.
  </Card>
  <Card title="Định tuyến" icon="route" href="/vi/concepts/multi-agent">
    Định tuyến đa tác nhân với các phiên được cô lập.
  </Card>
  <Card title="Phương tiện" icon="image" href="/vi/nodes/images">
    Hình ảnh, âm thanh, video, tài liệu và tạo hình ảnh/video.
  </Card>
  <Card title="Ứng dụng và UI" icon="monitor" href="/vi/platforms">
    Windows Hub, Web Control UI, ứng dụng macOS và các nút di động.
  </Card>
  <Card title="Nút di động" icon="smartphone" href="/vi/nodes">
    Các nút iOS và Android với ghép nối, giọng nói/trò chuyện và lệnh thiết bị phong phú.
  </Card>
</Columns>

## Danh sách đầy đủ

**Kênh:**

- Các kênh tích hợp sẵn bao gồm Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat và WhatsApp
- Các kênh Plugin đi kèm bao gồm Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo và Zalo Personal
- Các Plugin kênh tùy chọn được cài đặt riêng bao gồm Voice Call và các gói của bên thứ ba như WeChat
- Các Plugin kênh của bên thứ ba có thể mở rộng Gateway hơn nữa, chẳng hạn như WeChat
- Hỗ trợ trò chuyện nhóm với kích hoạt dựa trên lượt nhắc đến
- An toàn DM với danh sách cho phép và ghép nối

**Tác nhân:**

- Runtime tác nhân nhúng với truyền công cụ theo luồng
- Định tuyến đa tác nhân với các phiên được cô lập theo từng workspace hoặc người gửi
- Phiên: các cuộc trò chuyện trực tiếp được gộp vào `main` dùng chung; nhóm thì được cô lập
- Truyền theo luồng và chia đoạn cho phản hồi dài

**Xác thực và nhà cung cấp:**

- Hơn 35 nhà cung cấp mô hình (Anthropic, OpenAI, Google và nhiều nhà cung cấp khác)
- Xác thực thuê bao qua OAuth (ví dụ: OpenAI Codex)
- Hỗ trợ nhà cung cấp tùy chỉnh và tự lưu trữ (vLLM, SGLang, Ollama và mọi endpoint tương thích OpenAI hoặc tương thích Anthropic)

**Phương tiện:**

- Hình ảnh, âm thanh, video và tài liệu đầu vào và đầu ra
- Các bề mặt năng lực dùng chung cho tạo hình ảnh và tạo video
- Chép lời ghi chú thoại
- Chuyển văn bản thành giọng nói với nhiều nhà cung cấp

**Ứng dụng và giao diện:**

- WebChat và Control UI trên trình duyệt
- Ứng dụng đồng hành trên thanh menu macOS
- Nút iOS với ghép nối, Canvas, camera, ghi màn hình, vị trí và giọng nói
- Nút Android với ghép nối, trò chuyện, giọng nói, Canvas, camera và lệnh thiết bị

**Công cụ và tự động hóa:**

- Tự động hóa trình duyệt, exec, sandboxing
- Tìm kiếm web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Tác vụ Cron và lập lịch Heartbeat
- Skills, Plugin và pipeline quy trình làm việc (Lobster)

## Liên quan

<CardGroup cols={2}>
  <Card title="Tính năng thử nghiệm" href="/vi/concepts/experimental-features" icon="flask">
    Các tính năng chọn tham gia chưa được phát hành lên bề mặt mặc định.
  </Card>
  <Card title="Runtime tác nhân" href="/vi/concepts/agent" icon="robot">
    Mô hình runtime tác nhân và cách các lượt chạy được điều phối.
  </Card>
  <Card title="Kênh" href="/vi/channels" icon="message-square">
    Kết nối Telegram, WhatsApp, Discord, Slack và nhiều kênh khác từ một Gateway.
  </Card>
  <Card title="Plugin" href="/vi/tools/plugin" icon="plug">
    Các Plugin đi kèm và của bên thứ ba mở rộng OpenClaw.
  </Card>
</CardGroup>
