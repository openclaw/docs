---
read_when:
    - Bạn muốn danh sách đầy đủ về những gì OpenClaw hỗ trợ
summary: Các khả năng của OpenClaw trên các kênh, định tuyến, phương tiện và trải nghiệm người dùng.
title: Tính năng
x-i18n:
    generated_at: "2026-05-06T09:07:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: d46085b326dd1e5f0d5531bdf8d7d84ac8c22b7fb4637b7183be2bd9d556c500
    source_path: concepts/features.md
    workflow: 16
---

## Điểm nổi bật

<Columns>
  <Card title="Channels" icon="message-square" href="/vi/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat, và nhiều kênh khác với một Gateway duy nhất.
  </Card>
  <Card title="Plugins" icon="plug" href="/vi/tools/plugin">
    Các plugin đi kèm bổ sung Matrix, Nextcloud Talk, Nostr, Twitch, Zalo, và nhiều dịch vụ khác mà không cần cài đặt riêng trong các bản phát hành hiện tại thông thường.
  </Card>
  <Card title="Routing" icon="route" href="/vi/concepts/multi-agent">
    Định tuyến đa tác nhân với các phiên cô lập.
  </Card>
  <Card title="Media" icon="image" href="/vi/nodes/images">
    Hình ảnh, âm thanh, video, tài liệu, và tạo hình ảnh/video.
  </Card>
  <Card title="Apps and UI" icon="monitor" href="/vi/web/control-ui">
    Web Control UI và ứng dụng đồng hành trên macOS.
  </Card>
  <Card title="Mobile nodes" icon="smartphone" href="/vi/nodes">
    Các nút iOS và Android với ghép nối, thoại/trò chuyện, và lệnh thiết bị phong phú.
  </Card>
</Columns>

## Danh sách đầy đủ

**Kênh:**

- Các kênh tích hợp sẵn bao gồm Discord, Google Chat, iMessage (cũ), IRC, Signal, Slack, Telegram, WebChat, và WhatsApp
- Các kênh plugin đi kèm bao gồm BlueBubbles cho iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo, và Zalo Personal
- Các plugin kênh tùy chọn được cài đặt riêng bao gồm Voice Call và các gói bên thứ ba như WeChat
- Plugin kênh bên thứ ba có thể mở rộng Gateway hơn nữa, chẳng hạn như WeChat
- Hỗ trợ trò chuyện nhóm với kích hoạt dựa trên lượt nhắc
- An toàn DM với danh sách cho phép và ghép nối

**Tác nhân:**

- Runtime tác nhân nhúng với truyền phát công cụ
- Định tuyến đa tác nhân với các phiên cô lập theo từng workspace hoặc người gửi
- Phiên: trò chuyện trực tiếp được gộp vào `main` dùng chung; nhóm được cô lập
- Truyền phát và chia đoạn cho phản hồi dài

**Xác thực và nhà cung cấp:**

- Hơn 35 nhà cung cấp mô hình (Anthropic, OpenAI, Google, và nhiều hơn nữa)
- Xác thực thuê bao qua OAuth (ví dụ: OpenAI Codex)
- Hỗ trợ nhà cung cấp tùy chỉnh và tự lưu trữ (vLLM, SGLang, Ollama, và bất kỳ endpoint tương thích OpenAI hoặc tương thích Anthropic nào)

**Media:**

- Hình ảnh, âm thanh, video, và tài liệu đầu vào và đầu ra
- Các bề mặt năng lực dùng chung cho tạo hình ảnh và tạo video
- Chuyển lời nhắn thoại thành văn bản
- Chuyển văn bản thành giọng nói với nhiều nhà cung cấp

**Ứng dụng và giao diện:**

- WebChat và Control UI trên trình duyệt
- Ứng dụng đồng hành trên thanh menu macOS
- Nút iOS với ghép nối, Canvas, camera, ghi màn hình, vị trí, và thoại
- Nút Android với ghép nối, trò chuyện, thoại, Canvas, camera, và lệnh thiết bị

**Công cụ và tự động hóa:**

- Tự động hóa trình duyệt, exec, sandboxing
- Tìm kiếm web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Tác vụ Cron và lập lịch Heartbeat
- Skills, plugin, và pipeline quy trình công việc (Lobster)

## Liên quan

<CardGroup cols={2}>
  <Card title="Experimental features" href="/vi/concepts/experimental-features" icon="flask">
    Các tính năng chọn tham gia chưa được phát hành lên bề mặt mặc định.
  </Card>
  <Card title="Agent runtime" href="/vi/concepts/agent" icon="robot">
    Mô hình runtime tác nhân và cách các lượt chạy được điều phối.
  </Card>
  <Card title="Channels" href="/vi/channels" icon="message-square">
    Kết nối Telegram, WhatsApp, Discord, Slack, và nhiều kênh khác từ một Gateway.
  </Card>
  <Card title="Plugins" href="/vi/tools/plugin" icon="plug">
    Plugin đi kèm và bên thứ ba mở rộng OpenClaw.
  </Card>
</CardGroup>
