---
read_when:
    - Bạn muốn danh sách đầy đủ những gì OpenClaw hỗ trợ
summary: Các khả năng của OpenClaw trên các kênh, định tuyến, phương tiện và UX.
title: Tính năng
x-i18n:
    generated_at: "2026-05-07T01:51:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f95185073e52f4b5b34042ea27927984bf0b040d20eb61b135514816fddc214
    source_path: concepts/features.md
    workflow: 16
---

## Điểm nổi bật

<Columns>
  <Card title="Kênh" icon="message-square" href="/vi/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat, và nhiều kênh khác với một Gateway duy nhất.
  </Card>
  <Card title="Plugin" icon="plug" href="/vi/tools/plugin">
    Các Plugin tích hợp sẵn bổ sung Matrix, Nextcloud Talk, Nostr, Twitch, Zalo, và nhiều dịch vụ khác mà không cần cài đặt riêng trong các bản phát hành hiện tại thông thường.
  </Card>
  <Card title="Định tuyến" icon="route" href="/vi/concepts/multi-agent">
    Định tuyến đa agent với các phiên biệt lập.
  </Card>
  <Card title="Phương tiện" icon="image" href="/vi/nodes/images">
    Hình ảnh, âm thanh, video, tài liệu, và tạo hình ảnh/video.
  </Card>
  <Card title="Ứng dụng và giao diện người dùng" icon="monitor" href="/vi/web/control-ui">
    Giao diện điều khiển Web và ứng dụng đồng hành trên macOS.
  </Card>
  <Card title="Node di động" icon="smartphone" href="/vi/nodes">
    Các node iOS và Android với ghép nối, giọng nói/trò chuyện, và lệnh thiết bị phong phú.
  </Card>
</Columns>

## Danh sách đầy đủ

**Kênh:**

- Các kênh tích hợp sẵn bao gồm Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat, và WhatsApp
- Các kênh Plugin tích hợp sẵn bao gồm BlueBubbles làm cầu nối iMessage cũ, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo, và Zalo Personal
- Các Plugin kênh tùy chọn được cài đặt riêng bao gồm Voice Call và các gói bên thứ ba như WeChat
- Các Plugin kênh bên thứ ba có thể mở rộng Gateway hơn nữa, chẳng hạn như WeChat
- Hỗ trợ trò chuyện nhóm với kích hoạt dựa trên lượt nhắc đến
- An toàn DM với danh sách cho phép và ghép nối

**Agent:**

- Runtime agent nhúng với phát trực tuyến công cụ
- Định tuyến đa agent với các phiên biệt lập theo từng workspace hoặc người gửi
- Phiên: các cuộc trò chuyện trực tiếp được gộp vào `main` dùng chung; nhóm được biệt lập
- Phát trực tuyến và chia đoạn cho phản hồi dài

**Xác thực và nhà cung cấp:**

- Hơn 35 nhà cung cấp mô hình (Anthropic, OpenAI, Google, và nhiều nhà cung cấp khác)
- Xác thực thuê bao qua OAuth (ví dụ: OpenAI Codex)
- Hỗ trợ nhà cung cấp tùy chỉnh và tự lưu trữ (vLLM, SGLang, Ollama, và mọi endpoint tương thích OpenAI hoặc tương thích Anthropic)

**Phương tiện:**

- Nhập và xuất hình ảnh, âm thanh, video, và tài liệu
- Các bề mặt năng lực tạo hình ảnh và tạo video dùng chung
- Chuyển lời nhắn thoại thành văn bản
- Chuyển văn bản thành giọng nói với nhiều nhà cung cấp

**Ứng dụng và giao diện:**

- WebChat và giao diện điều khiển trên trình duyệt
- Ứng dụng đồng hành trên thanh menu macOS
- Node iOS với ghép nối, Canvas, camera, ghi màn hình, vị trí, và giọng nói
- Node Android với ghép nối, trò chuyện, giọng nói, Canvas, camera, và lệnh thiết bị

**Công cụ và tự động hóa:**

- Tự động hóa trình duyệt, exec, sandboxing
- Tìm kiếm web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Tác vụ Cron và lập lịch Heartbeat
- Skills, Plugin, và pipeline quy trình làm việc (Lobster)

## Liên quan

<CardGroup cols={2}>
  <Card title="Tính năng thử nghiệm" href="/vi/concepts/experimental-features" icon="flask">
    Các tính năng chọn tham gia chưa được phát hành lên bề mặt mặc định.
  </Card>
  <Card title="Runtime agent" href="/vi/concepts/agent" icon="robot">
    Mô hình runtime agent và cách các lượt chạy được điều phối.
  </Card>
  <Card title="Kênh" href="/vi/channels" icon="message-square">
    Kết nối Telegram, WhatsApp, Discord, Slack, và nhiều kênh khác từ một Gateway.
  </Card>
  <Card title="Plugin" href="/vi/tools/plugin" icon="plug">
    Các Plugin tích hợp sẵn và bên thứ ba mở rộng OpenClaw.
  </Card>
</CardGroup>
