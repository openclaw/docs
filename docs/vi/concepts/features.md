---
read_when:
    - Bạn muốn xem danh sách đầy đủ các tính năng được OpenClaw hỗ trợ
summary: Các khả năng của OpenClaw trên các kênh, định tuyến, phương tiện và trải nghiệm người dùng.
title: Tính năng
x-i18n:
    generated_at: "2026-07-12T07:48:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bc3ebdd87a0f6ea0f3d75d029bf7cae469ecd9db84a165bd47c4896936fe303
    source_path: concepts/features.md
    workflow: 16
---

## Điểm nổi bật

<Columns>
  <Card title="Kênh" icon="message-square" href="/vi/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat và nhiều kênh khác chỉ với một Gateway.
  </Card>
  <Card title="Plugin" icon="plug" href="/vi/tools/plugin">
    Các Plugin chính thức bổ sung Matrix, Nextcloud Talk, Nostr, Twitch, Zalo và hàng chục dịch vụ khác chỉ bằng một lệnh cài đặt.
  </Card>
  <Card title="Định tuyến" icon="route" href="/vi/concepts/multi-agent">
    Định tuyến đa tác tử với các phiên biệt lập.
  </Card>
  <Card title="Phương tiện" icon="image" href="/vi/nodes/images">
    Hình ảnh, âm thanh, video, tài liệu và khả năng tạo hình ảnh/video.
  </Card>
  <Card title="Ứng dụng và giao diện người dùng" icon="monitor" href="/vi/platforms">
    Windows Hub, giao diện Control UI trên trình duyệt, ứng dụng thanh menu macOS và các Node di động.
  </Card>
  <Card title="Node di động" icon="smartphone" href="/vi/nodes">
    Các Node iOS và Android hỗ trợ ghép đôi, thoại/trò chuyện và nhiều lệnh thiết bị nâng cao.
  </Card>
</Columns>

## Danh sách đầy đủ

**Kênh:**

- iMessage, Telegram và WebChat được cung cấp cùng bản cài đặt lõi; mọi kênh khác là
  Plugin chính thức được cài đặt bằng `openclaw plugins install @openclaw/<id>` (hoặc theo yêu cầu
  trong quá trình `openclaw onboard` / `openclaw channels add`)
- Các kênh Plugin chính thức: Discord, Feishu, Google Chat, IRC, LINE, Matrix, Mattermost,
  Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Raft, Signal, Slack, SMS, Synology Chat,
  Tlon, Twitch, Voice Call, WhatsApp, Zalo và Zalo Personal
- Các kênh Plugin bên ngoài được duy trì ngoài kho lưu trữ OpenClaw: WeChat, Yuanbao và Zalo ClawBot
- Hỗ trợ trò chuyện nhóm với cơ chế kích hoạt dựa trên lượt nhắc tên
- Bảo vệ tin nhắn trực tiếp bằng danh sách cho phép và ghép đôi

**Tác tử:**

- Môi trường chạy tác tử nhúng với khả năng truyền trực tiếp hoạt động của công cụ
- Định tuyến đa tác tử với các phiên biệt lập theo từng không gian làm việc hoặc người gửi
- Phiên: các cuộc trò chuyện trực tiếp được hợp nhất vào `main` dùng chung; các nhóm được biệt lập
- Truyền trực tiếp và chia đoạn cho các phản hồi dài

**Xác thực và nhà cung cấp:**

- Hơn 35 nhà cung cấp mô hình (Anthropic, OpenAI, Google và nhiều nhà cung cấp khác)
- Xác thực gói thuê bao qua OAuth (ví dụ: OpenAI Codex)
- Hỗ trợ nhà cung cấp tùy chỉnh và tự lưu trữ (vLLM, SGLang, Ollama, llama.cpp, LM Studio và
  mọi điểm cuối tương thích với OpenAI hoặc Anthropic)

**Phương tiện:**

- Nhận và gửi hình ảnh, âm thanh, video và tài liệu
- Các bề mặt khả năng dùng chung để tạo hình ảnh và video
- Chuyển lời nhắn thoại thành văn bản
- Chuyển văn bản thành giọng nói với nhiều nhà cung cấp

**Ứng dụng và giao diện:**

- WebChat và Control UI trên trình duyệt
- Ứng dụng đồng hành trên thanh menu macOS
- Node iOS hỗ trợ ghép đôi, Canvas, camera, ghi màn hình, vị trí và giọng nói
- Node Android hỗ trợ ghép đôi, trò chuyện, giọng nói, Canvas, camera và các lệnh thiết bị

**Công cụ và tự động hóa:**

- Tự động hóa trình duyệt, thực thi lệnh và cô lập môi trường
- Tìm kiếm web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Tác vụ Cron và lập lịch Heartbeat
- Skills, Plugin và các quy trình công việc theo chuỗi (Lobster)

## Nội dung liên quan

<CardGroup cols={2}>
  <Card title="Tính năng thử nghiệm" href="/vi/concepts/experimental-features" icon="flask">
    Các tính năng tùy chọn chưa được phát hành trên bề mặt mặc định.
  </Card>
  <Card title="Môi trường chạy tác tử" href="/vi/concepts/agent" icon="robot">
    Mô hình môi trường chạy tác tử và cách các lượt chạy được điều phối.
  </Card>
  <Card title="Kênh" href="/vi/channels" icon="message-square">
    Kết nối Telegram, WhatsApp, Discord, Slack và nhiều dịch vụ khác từ một Gateway.
  </Card>
  <Card title="Plugin" href="/vi/tools/plugin" icon="plug">
    Các Plugin chính thức và bên ngoài giúp mở rộng OpenClaw.
  </Card>
</CardGroup>
