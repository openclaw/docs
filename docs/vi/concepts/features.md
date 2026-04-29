---
read_when:
    - Bạn muốn có danh sách đầy đủ về những gì OpenClaw hỗ trợ
summary: Các khả năng của OpenClaw trên các kênh, định tuyến, phương tiện và UX.
title: Tính năng
x-i18n:
    generated_at: "2026-04-29T22:37:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: b188d786b06e1a51d42130242e8bef6290a728783f24b2fbce513bf4d6c9ec23
    source_path: concepts/features.md
    workflow: 16
---

## Điểm nổi bật

<Columns>
  <Card title="Kênh" icon="message-square" href="/vi/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat và nhiều kênh khác với một Gateway duy nhất.
  </Card>
  <Card title="Plugin" icon="plug" href="/vi/tools/plugin">
    Các plugin đi kèm bổ sung Matrix, Nextcloud Talk, Nostr, Twitch, Zalo và nhiều kênh khác mà không cần cài đặt riêng trong các bản phát hành hiện tại thông thường.
  </Card>
  <Card title="Định tuyến" icon="route" href="/vi/concepts/multi-agent">
    Định tuyến đa agent với các phiên cô lập.
  </Card>
  <Card title="Phương tiện" icon="image" href="/vi/nodes/images">
    Hình ảnh, âm thanh, video, tài liệu, và tạo hình ảnh/video.
  </Card>
  <Card title="Ứng dụng và UI" icon="monitor" href="/vi/web/control-ui">
    UI Điều khiển Web và ứng dụng đồng hành macOS.
  </Card>
  <Card title="Nút di động" icon="smartphone" href="/vi/nodes">
    Các nút iOS và Android với ghép nối, thoại/trò chuyện, và lệnh thiết bị phong phú.
  </Card>
</Columns>

## Danh sách đầy đủ

**Kênh:**

- Các kênh tích hợp sẵn bao gồm Discord, Google Chat, iMessage (cũ), IRC, Signal, Slack, Telegram, WebChat và WhatsApp
- Các kênh plugin đi kèm bao gồm BlueBubbles cho iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo và Zalo Personal
- Các plugin kênh cài đặt riêng tùy chọn bao gồm Voice Call và các gói của bên thứ ba như WeChat
- Các plugin kênh của bên thứ ba có thể mở rộng Gateway hơn nữa, chẳng hạn như WeChat
- Hỗ trợ trò chuyện nhóm với kích hoạt dựa trên lượt nhắc đến
- An toàn DM với danh sách cho phép và ghép nối

**Agent:**

- Runtime agent nhúng với phát trực tuyến công cụ
- Định tuyến đa agent với các phiên cô lập theo từng workspace hoặc người gửi
- Phiên: các cuộc trò chuyện trực tiếp được gộp vào `main` dùng chung; các nhóm được cô lập
- Phát trực tuyến và chia đoạn cho phản hồi dài

**Xác thực và nhà cung cấp:**

- Hơn 35 nhà cung cấp mô hình (Anthropic, OpenAI, Google và nhiều hơn nữa)
- Xác thực thuê bao qua OAuth (ví dụ: OpenAI Codex)
- Hỗ trợ nhà cung cấp tùy chỉnh và tự lưu trữ (vLLM, SGLang, Ollama, và mọi endpoint tương thích OpenAI hoặc tương thích Anthropic)

**Phương tiện:**

- Nhận và gửi hình ảnh, âm thanh, video và tài liệu
- Các bề mặt năng lực dùng chung cho tạo hình ảnh và tạo video
- Phiên âm ghi chú thoại
- Chuyển văn bản thành giọng nói với nhiều nhà cung cấp

**Ứng dụng và giao diện:**

- WebChat và UI Điều khiển trên trình duyệt
- Ứng dụng đồng hành trên thanh menu macOS
- Nút iOS với ghép nối, Canvas, camera, ghi màn hình, vị trí và thoại
- Nút Android với ghép nối, trò chuyện, thoại, Canvas, camera và lệnh thiết bị

**Công cụ và tự động hóa:**

- Tự động hóa trình duyệt, exec, sandboxing
- Tìm kiếm web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Tác vụ Cron và lập lịch Heartbeat
- Skills, plugin và pipeline quy trình làm việc (Lobster)

## Liên quan

- [Tính năng thử nghiệm](/vi/concepts/experimental-features)
- [Runtime agent](/vi/concepts/agent)
