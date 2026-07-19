---
summary: Tài liệu tham khảo chi tiết về các lĩnh vực sản phẩm và các bước kiểm tra làm cơ sở cho bảng điểm mức độ trưởng thành của OpenClaw.
title: Phân loại mức độ trưởng thành
x-i18n:
    generated_at: "2026-07-19T06:00:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dbed5794f43b230d8c8adb211734d93eb81f02623fe57df078e1dfd5a6d2586c
    source_path: maturity/taxonomy.md
    workflow: 16
---

# Phân loại mức độ trưởng thành

<div className="maturity-hero maturity-hero-compact">
  <p className="maturity-kicker">mô hình đằng sau bảng điểm</p>
  <p className="maturity-hero-title">Bề mặt &gt; danh mục &gt; khả năng &gt; bằng chứng.</p>
  <p>50 bề mặt được nhóm thành 4 họ, trong đó mỗi danh mục đều được liên kết với tài liệu chuẩn và ID phạm vi kiểm thử QA.</p>
  <p className="maturity-jump-links"><a href="#product-areas">Duyệt các khu vực sản phẩm</a> / <a href="#taxonomy-details">Mở phân loại chi tiết</a> / <a href="/vi/maturity/scorecard">Xem điểm số</a></p>
</div>

## Cách đọc trang này

Bề mặt là một khu vực sản phẩm như runtime Gateway, Discord hoặc ứng dụng macOS. Mỗi bề mặt chứa các danh mục, và mỗi danh mục chứa các bước kiểm tra ở cấp độ khả năng mà các kịch bản QA bao phủ. Sử dụng bảng điểm để đánh giá ở cấp độ bản phát hành; sử dụng trang này để xem xét mô hình nền tảng của bảng điểm.

## Các mức độ trưởng thành

<div className="maturity-level-list">
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Đã lên kế hoạch</span></span></span><span>Đã xác định được định hướng, nhưng chưa có luồng sử dụng nào được hỗ trợ.</span><span className="maturity-level-promotion">Điều kiện thăng hạng: Có vấn đề thiết kế, chủ sở hữu và bề mặt mục tiêu.</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Thử nghiệm</span></span></span><span>Đã triển khai với các hạn chế, cờ, bản dựng từ mã nguồn hoặc luồng chỉ dành cho người bảo trì.</span><span className="maturity-level-promotion">Điều kiện thăng hạng: Người bảo trì có thể chạy kịch bản từ nhánh main hiện tại.</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span></span><span>Người dùng thực có thể dùng thử, nhưng có thể xảy ra các thay đổi phá vỡ tính tương thích và trải nghiệm người dùng chưa hoàn thiện.</span><span className="maturity-level-promotion">Điều kiện thăng hạng: Có hướng dẫn thiết lập, kiểm thử cơ bản, các hạn chế đã biết và ít nhất một bằng chứng từ môi trường thực.</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span></span><span>Đã có luồng công khai và quy trình làm việc chính có thể sử dụng được với các hạn chế xác định.</span><span className="maturity-level-promotion">Điều kiện thăng hạng: Có tài liệu cài đặt/cập nhật, kiểm thử hồi quy, cẩm nang hỗ trợ và bằng chứng kịch bản thành công trên toàn bộ môi trường dự kiến.</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Ổn định</span></span></span><span>Luồng được khuyến nghị cho người dùng thông thường. Các lỗi được xem là lỗi hồi quy.</span><span className="maturity-level-promotion">Điều kiện thăng hạng: Có cổng phát hành, luồng doctor/khắc phục sự cố, tài liệu toàn diện và bằng chứng thực tế lặp lại.</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-clawesome"><span className="maturity-level-code">M5</span><span>Clawesome</span></span></span><span>Hoàn thiện, dễ sử dụng, có khả năng đo lường tốt và cạnh tranh được với quy trình làm việc tương đương tốt nhất.</span><span className="maturity-level-promotion">Điều kiện thăng hạng: Đạt mức Ổn định và vượt qua bảng điểm người dùng với các nhóm người dùng đại diện.</span></div>
</div>

## Các khu vực sản phẩm

<a id="product-areas" />

<Tabs>
  <Tab title="Cốt lõi">

    <a className="maturity-surface-link" href="#cli">
      <span className="maturity-surface-title">CLI</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Ổn định</span></span><span>7 khu vực - hoàn thành 90%</span></span>
    </a>

    <a className="maturity-surface-link" href="#gateway-runtime">
      <span className="maturity-surface-title">Runtime Gateway</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Ổn định</span></span><span>13 khu vực - hoàn thành 89%</span></span>
    </a>

    <a className="maturity-surface-link" href="#agent-runtime">
      <span className="maturity-surface-title">Runtime tác nhân</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 khu vực - hoàn thành 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#session-memory-and-context-engine">
      <span className="maturity-surface-title">Công cụ phiên, bộ nhớ và ngữ cảnh</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 khu vực - hoàn thành 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#channel-framework">
      <span className="maturity-surface-title">Khung kênh</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 khu vực - hoàn thành 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#observability">
      <span className="maturity-surface-title">Khả năng quan sát</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 khu vực - hoàn thành 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#gateway-web-app">
      <span className="maturity-surface-title">Ứng dụng web Gateway</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 lĩnh vực - hoàn thành 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#plugins">
      <span className="maturity-surface-title">Các Plugin</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>9 lĩnh vực - hoàn thành 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#security-auth-pairing-and-secrets">
      <span className="maturity-surface-title">Bảo mật, xác thực, ghép nối và bí mật</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 lĩnh vực - hoàn thành 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#automation-cron-hooks-tasks-polling">
      <span className="maturity-surface-title">Tự động hóa: cron, hook, tác vụ, thăm dò</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 lĩnh vực - hoàn thành 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#media-understanding-and-media-generation">
      <span className="maturity-surface-title">Hiểu và tạo nội dung đa phương tiện</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 lĩnh vực - hoàn thành 68%</span></span>
    </a>

    <a className="maturity-surface-link" href="#voice-and-realtime-talk">
      <span className="maturity-surface-title">Thoại và trò chuyện theo thời gian thực</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 lĩnh vực - hoàn thành 68%</span></span>
    </a>

    <a className="maturity-surface-link" href="#tui">
      <span className="maturity-surface-title">TUI</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 lĩnh vực - hoàn thành 66%</span></span>
    </a>

    <a className="maturity-surface-link" href="#clawhub">
      <span className="maturity-surface-title">ClawHub</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 lĩnh vực - hoàn thành 62%</span></span>
    </a>

    <a className="maturity-surface-link" href="#openclaw-app-sdk">
      <span className="maturity-surface-title">SDK ứng dụng OpenClaw</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 lĩnh vực - hoàn thành 53%</span></span>
    </a>

  </Tab>
  <Tab title="Nền tảng">

    <a className="maturity-surface-link" href="#linux-gateway-host">
      <span className="maturity-surface-title">Máy chủ Gateway Linux</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Ổn định</span></span><span>5 lĩnh vực - hoàn thành 89%</span></span>
    </a>

    <a className="maturity-surface-link" href="#macos-gateway-host">
      <span className="maturity-surface-title">Máy chủ Gateway macOS</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Ổn định</span></span><span>7 lĩnh vực - hoàn thành 88%</span></span>
    </a>
    <a className="maturity-surface-link" href="#android-app">
      <span className="maturity-surface-title">Ứng dụng Android</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Ổn định</span></span><span>7 lĩnh vực - hoàn thành 80%</span></span>
    </a>
    <a className="maturity-surface-link" href="#ios-app">
      <span className="maturity-surface-title">Ứng dụng iOS</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Ổn định</span></span><span>8 lĩnh vực - hoàn thành 80%</span></span>
    </a>

    <a className="maturity-surface-link" href="#docker-and-podman-hosting">
      <span className="maturity-surface-title">Lưu trữ bằng Docker và Podman</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 lĩnh vực - hoàn thành 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#windows-via-wsl2">
      <span className="maturity-surface-title">Windows qua WSL2</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>6 lĩnh vực - hoàn thành 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#raspberry-pi-and-small-linux-devices">
      <span className="maturity-surface-title">Raspberry Pi và các thiết bị Linux nhỏ</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 lĩnh vực - hoàn thành 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#macos-companion-app">
      <span className="maturity-surface-title">Ứng dụng đồng hành macOS</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>8 lĩnh vực - hoàn thành 78%</span></span>
    </a>


    <a className="maturity-surface-link" href="#native-windows">
      <span className="maturity-surface-title">Windows gốc</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 lĩnh vực - hoàn thành 66%</span></span>
    </a>

    <a className="maturity-surface-link" href="#kubernetes-hosting">
      <span className="maturity-surface-title">Lưu trữ trên Kubernetes</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 lĩnh vực - hoàn thành 61%</span></span>
    </a>


    <a className="maturity-surface-link" href="#nix-install-path">
      <span className="maturity-surface-title">Quy trình cài đặt Nix</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Thử nghiệm</span></span><span>5 lĩnh vực - hoàn thành 44%</span></span>
    </a>

    <a className="maturity-surface-link" href="#watchos-companion-surfaces">
      <span className="maturity-surface-title">Các giao diện đồng hành watchOS</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Thử nghiệm</span></span><span>5 lĩnh vực - hoàn thành 44%</span></span>
    </a>

    <a className="maturity-surface-link" href="#linux-companion-app">
      <span className="maturity-surface-title">Ứng dụng đồng hành Linux</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Đã lên kế hoạch</span></span><span>5 lĩnh vực - hoàn thành 21%</span></span>
    </a>

    <a className="maturity-surface-link" href="#native-windows-companion-app">
      <span className="maturity-surface-title">Ứng dụng đồng hành Windows gốc</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>Đã lên kế hoạch</span></span><span>5 lĩnh vực - hoàn thành 21%</span></span>
    </a>

  </Tab>
  <Tab title="Kênh">

    <a className="maturity-surface-link" href="#discord">
      <span className="maturity-surface-title">Discord</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>Ổn định</span></span><span>6 lĩnh vực - hoàn thành 87%</span></span>
    </a>

    <a className="maturity-surface-link" href="#telegram">
      <span className="maturity-surface-title">Telegram</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 lĩnh vực - hoàn thành 78%</span></span>
    </a>

    <a className="maturity-surface-link" href="#slack">
      <span className="maturity-surface-title">Slack</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 lĩnh vực - hoàn thành 78%</span></span>
    </a>

    <a className="maturity-surface-link" href="#imessage-and-bluebubbles">
      <span className="maturity-surface-title">iMessage và BlueBubbles</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 lĩnh vực - hoàn thành 78%</span></span>
    </a>

    <a className="maturity-surface-link" href="#whatsapp">
      <span className="maturity-surface-title">WhatsApp</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 lĩnh vực - hoàn thành 78%</span></span>
    </a>

    <a className="maturity-surface-link" href="#matrix">
      <span className="maturity-surface-title">Matrix</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>6 lĩnh vực - hoàn thành 67%</span></span>
    </a>

    <a className="maturity-surface-link" href="#google-chat">
      <span className="maturity-surface-title">Google Chat</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 lĩnh vực - hoàn thành 66%</span></span>
    </a>

    <a className="maturity-surface-link" href="#microsoft-teams">
      <span className="maturity-surface-title">Microsoft Teams</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 lĩnh vực - hoàn thành 66%</span></span>
    </a>

    <a className="maturity-surface-link" href="#signal">
      <span className="maturity-surface-title">Signal</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 lĩnh vực - hoàn thành 66%</span></span>
    </a>

    <a className="maturity-surface-link" href="#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels">
      <span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, các kênh khu vực</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 lĩnh vực - hoàn thành 58%</span></span>
    </a>

    <a className="maturity-surface-link" href="#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat">
      <span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>4 lĩnh vực - hoàn thành 54%</span></span>
    </a>

    <a className="maturity-surface-link" href="#voice-call-channel">
      <span className="maturity-surface-title">Kênh cuộc gọi thoại</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>Thử nghiệm</span></span><span>5 lĩnh vực - hoàn thành 44%</span></span>
    </a>

  </Tab>
  <Tab title="Nhà cung cấp và công cụ">

    <a className="maturity-surface-link" href="#browser-automation-exec-and-sandbox-tools">
      <span className="maturity-surface-title">Các công cụ tự động hóa trình duyệt, exec và sandbox</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>3 lĩnh vực - hoàn thành 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#openai-and-codex-provider-path">
      <span className="maturity-surface-title">Quy trình nhà cung cấp OpenAI và Codex</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 lĩnh vực - hoàn thành 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#web-search-tools">
      <span className="maturity-surface-title">Công cụ tìm kiếm web</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 lĩnh vực - hoàn thành 79%</span></span>
    </a>

    <a className="maturity-surface-link" href="#anthropic-provider-path">
      <span className="maturity-surface-title">Quy trình nhà cung cấp Anthropic</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 lĩnh vực - hoàn thành 78%</span></span>
    </a>

    <a className="maturity-surface-link" href="#google-provider-path">
      <span className="maturity-surface-title">Quy trình nhà cung cấp Google</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>5 lĩnh vực - hoàn thành 78%</span></span>
    </a>

    <a className="maturity-surface-link" href="#openrouter-provider-path">
      <span className="maturity-surface-title">Quy trình nhà cung cấp OpenRouter</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>Beta</span></span><span>4 lĩnh vực - hoàn thành 78%</span></span>
    </a>

    <a className="maturity-surface-link" href="#image-video-and-music-generation-tools">
      <span className="maturity-surface-title">Công cụ tạo hình ảnh, video và âm nhạc</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 lĩnh vực - hoàn thành 68%</span></span>
    </a>

    <a className="maturity-surface-link" href="#local-model-providers-ollama-vllm-sglang-lm-studio">
      <span className="maturity-surface-title">Nhà cung cấp mô hình cục bộ: Ollama, vLLM, SGLang, LM Studio</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>5 lĩnh vực - hoàn thành 68%</span></span>
    </a>

    <a className="maturity-surface-link" href="#long-tail-hosted-providers">
      <span className="maturity-surface-title">Nhà cung cấp lưu trữ ít phổ biến</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>Alpha</span></span><span>3 lĩnh vực - hoàn thành 68%</span></span>
    </a>

  </Tab>
</Tabs>

## Chi tiết

<a id="taxonomy-details" />

### Lõi

<AccordionGroup>
  <Accordion title="CLI - M4 Ổn định - 7 lĩnh vực">
    <a id="cli" />

    Các quy trình thiết lập và sửa chữa thông thường được ghi lại trong tài liệu cài đặt, CLI và Gateway. Các quy trình dành riêng cho nền tảng Windows được theo dõi trong các hàng Windows qua WSL2 và Windows gốc.

    <div className="maturity-surface-rollup"><span>Phạm vi Thử nghiệm - 4%</span><span>Chất lượng Ổn định - 83%</span><span>Mức độ hoàn thiện Ổn định - 90%</span><span><span className="maturity-lts maturity-lts-partial">Một phần - 6</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập CLI</span>
          <span>6 chức năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>17%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "17%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Mục lục](/vi/install/index), [Trình cài đặt](/vi/install/installer), [Node](/vi/install/node), [Cập nhật](/vi/install/updating)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập hướng dẫn ban đầu và xác thực</span>
          <span>5 chức năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Hướng dẫn ban đầu](/vi/cli/onboard), [Cấu hình](/vi/cli/configure), [Tổng quan về hướng dẫn ban đầu](/vi/start/onboarding-overview)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập Plugin và kênh</span>
          <span>5 chức năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Hướng dẫn ban đầu](/vi/cli/onboard), [Plugin](/vi/cli/plugins), [Kênh](/vi/cli/channels)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Quản lý dịch vụ Gateway</span>
          <span>5 chức năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>14%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "14%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Gateway](/vi/cli/gateway), [Cập nhật](/vi/install/updating), [Khắc phục sự cố](/vi/gateway/troubleshooting)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Khả năng quan sát CLI</span>
          <span>5 chức năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Trạng thái](/vi/cli/status), [Tình trạng](/vi/cli/health), [Nhật ký](/vi/cli/logs), [Chẩn đoán](/vi/gateway/diagnostics)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Doctor</span>
          <span>10 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Doctor](/vi/cli/doctor), [Doctor](/vi/gateway/doctor), [Bí mật](/vi/gateway/secrets), [Khắc phục sự cố](/vi/gateway/troubleshooting)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Cập nhật và nâng cấp</span>
          <span>5 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Cập nhật](/vi/install/updating), [Cập nhật](/vi/cli/update), [Khắc phục sự cố](/vi/gateway/troubleshooting)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Môi trường chạy Gateway - M4 Ổn định - 13 lĩnh vực">
    <a id="gateway-runtime" />

    Kiến trúc lõi, xác thực, ghép đôi, tài liệu giao thức, tài liệu daemon và cẩm nang vận hành CLI đều có phạm vi rộng và được cập nhật.

    <div className="maturity-surface-rollup"><span>Phạm vi thử nghiệm - 6%</span><span>Chất lượng ổn định - 81%</span><span>Mức độ hoàn thiện ổn định - 89%</span><span><span className="maturity-lts maturity-lts-partial">Một phần - 12</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phê duyệt và thực thi từ xa</span>
          <span>6 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Giao thức](/vi/gateway/protocol), [Tổng quan](/vi/gateway/security/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">API HTTP</span>
          <span>4 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>25%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "25%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Tổng quan](/vi/gateway/index), [API HTTP OpenAI](/vi/gateway/openai-http-api), [API HTTP OpenResponses](/vi/gateway/openresponses-http-api), [API HTTP gọi công cụ](/vi/gateway/tools-invoke-http-api), [Hook](/vi/automation/hooks), [Tổng quan](/vi/web/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Bề mặt web được lưu trữ</span>
          <span>4 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Tổng quan](/vi/gateway/index), [Kiến trúc](/vi/concepts/architecture), [Giao diện điều khiển](/vi/web/control-ui), [Trò chuyện web](/vi/web/webchat), [Canvas](/vi/refactor/canvas)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">API RPC và sự kiện của Gateway</span>
          <span>20 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Giao thức](/vi/gateway/protocol), [Tổng quan](/vi/gateway/index), [Kiến trúc](/vi/concepts/architecture)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Xác thực và ghép nối thiết bị</span>
          <span>10 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Giao thức](/vi/gateway/protocol), [Ghép nối](/vi/gateway/pairing), [Tổng quan](/vi/gateway/security/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Truy cập và khám phá mạng</span>
          <span>6 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Tổng quan](/vi/gateway/index), [Khám phá](/vi/gateway/discovery), [Giao thức](/vi/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Node và khả năng từ xa</span>
          <span>8 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Giao thức](/vi/gateway/protocol), [Kiến trúc](/vi/concepts/architecture), [Tổng quan](/vi/nodes/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Tình trạng, chẩn đoán và sửa chữa</span>
          <span>7 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Tổng quan](/vi/gateway/index), [Chẩn đoán](/vi/gateway/diagnostics), [Doctor](/vi/gateway/doctor)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Khả năng tương thích giao thức</span>
          <span>7 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Giao thức](/vi/gateway/protocol), [Kiến trúc](/vi/concepts/architecture), [TypeBox](/vi/concepts/typebox), [Giao thức cầu nối](/vi/gateway/bridge-protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Vai trò và quyền</span>
          <span>5 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Giao thức](/vi/gateway/protocol), [Chỉ mục](/vi/gateway/security/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Vòng đời Gateway</span>
          <span>7 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Chỉ mục](/vi/gateway/index), [Kiến trúc](/vi/concepts/architecture)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Các biện pháp kiểm soát bảo mật</span>
          <span>6 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Chỉ mục](/vi/gateway/security/index), [Giao thức](/vi/gateway/protocol), [Khám phá](/vi/gateway/discovery)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Kết nối WebSocket</span>
          <span>8 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Giao thức](/vi/gateway/protocol), [Kiến trúc](/vi/concepts/architecture)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Môi trường chạy Agent - M3 Beta - 9 lĩnh vực">
    <a id="agent-runtime" />

    Vòng lặp chính, mô hình, định tuyến nhà cung cấp và truyền trực tuyến công cụ là các thành phần cốt lõi, nhưng hành vi của nhà cung cấp thay đổi hằng tuần và cần được kiểm chứng theo kịch bản cho mỗi bản phát hành.

    <div className="maturity-surface-rollup"><span>Độ bao phủ Thử nghiệm - 33%</span><span>Chất lượng Beta - 78%</span><span>Mức độ hoàn thiện Beta - 79%</span><span><span className="maturity-lts maturity-lts-partial">Một phần - 6</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thực thi lượt Agent</span>
          <span>3 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>29%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "29%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Vòng lặp Agent](/vi/concepts/agent-loop), [Agent](/vi/cli/agent), [Môi trường chạy Agent](/vi/concepts/agent-runtimes)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Môi trường chạy bên ngoài và Agent phụ</span>
          <span>4 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Môi trường chạy Agent](/vi/concepts/agent-runtimes), [Anthropic](/vi/providers/anthropic), [Google](/vi/providers/google), [Agent phụ](/vi/tools/subagents)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thực thi trên nhà cung cấp được lưu trữ</span>
          <span>5 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>20%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "20%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenAI](/vi/providers/openai), [Anthropic](/vi/providers/anthropic), [Google](/vi/providers/google), [Mô hình](/vi/concepts/models)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Nhà cung cấp cục bộ và tự lưu trữ</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ollama](/vi/providers/ollama), [Mô hình](/vi/concepts/models), [Agent](/vi/cli/agent)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Lựa chọn mô hình và môi trường thực thi</span>
          <span>4 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>25%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "25%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Mô hình](/vi/concepts/models), [Mô hình](/vi/cli/models), [OpenAI](/vi/providers/openai), [Môi trường thực thi tác nhân](/vi/concepts/agent-runtimes)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Xác thực nhà cung cấp</span>
          <span>10 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>24%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "24%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Mô hình](/vi/concepts/models), [Tác nhân](/vi/cli/agent), [Mô hình](/vi/cli/models), [OpenAI](/vi/providers/openai), [Anthropic](/vi/providers/anthropic), [Google](/vi/providers/google), [Tác nhân phụ](/vi/tools/subagents)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Truyền phát và tiến độ</span>
          <span>2 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>56%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "56%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Truyền phát](/vi/concepts/streaming), [Vòng lặp tác nhân](/vi/concepts/agent-loop)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Lệnh gọi công cụ và xử lý phản hồi</span>
          <span>3 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>65%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "65%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Vòng lặp tác nhân](/vi/concepts/agent-loop), [Ollama](/vi/providers/ollama)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Các biện pháp kiểm soát thực thi công cụ</span>
          <span>6 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>50%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "50%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Sandbox so với chính sách công cụ so với chế độ đặc quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated), [Vòng lặp tác nhân](/vi/concepts/agent-loop), [Tác nhân phụ](/vi/tools/subagents)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Phiên, bộ nhớ và công cụ ngữ cảnh - M3 Beta - 9 lĩnh vực">
    <a id="session-memory-and-context-engine" />

    Tài liệu đầy đủ và hoạt động triển khai tích cực. Mức độ trưởng thành phụ thuộc vào độ bền vững của bản ghi, chất lượng Compaction và tính tương đương giữa các ứng dụng khách.

    <div className="maturity-surface-rollup"><span>Phạm vi Thử nghiệm - 30%</span><span>Chất lượng Beta - 77%</span><span>Mức độ hoàn thiện Beta - 79%</span><span><span className="maturity-lts maturity-lts-partial">Một phần - 6</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Quản lý phiên và bản ghi bằng CLI</span>
          <span>2 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Phiên](/vi/concepts/session), [Compaction quản lý phiên](/vi/reference/session-management-compaction), [Các phiên](/vi/cli/sessions)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Quản lý token</span>
          <span>3 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>20%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "20%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Compaction](/vi/concepts/compaction), [Ngữ cảnh](/vi/concepts/context), [Compaction quản lý phiên](/vi/reference/session-management-compaction)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Công cụ ngữ cảnh</span>
          <span>2 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>57%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "57%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ngữ cảnh](/vi/concepts/context), [Công cụ ngữ cảnh](/vi/concepts/context-engine)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Lịch sử liên máy khách và tính nhất quán của phiên</span>
          <span>2 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>40%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "40%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Trò chuyện web](/vi/web/webchat), [Android](/vi/platforms/android), [Định tuyến kênh](/vi/channels/channel-routing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Chẩn đoán, bảo trì và khôi phục</span>
          <span>3 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>40%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "40%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Chẩn đoán](/vi/gateway/diagnostics), [Compaction quản lý phiên](/vi/reference/session-management-compaction), [Cờ](/vi/diagnostics/flags)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Lời nhắc cốt lõi và ngữ cảnh</span>
          <span>2 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>38%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "38%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ngữ cảnh](/vi/concepts/context), [Vệ sinh bản chép lời](/vi/reference/transcript-hygiene), [Discord](/vi/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Bộ nhớ</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>46%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "46%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Cấu hình bộ nhớ](/vi/reference/memory-config), [Qmd bộ nhớ](/vi/concepts/memory-qmd), [Bộ nhớ](/vi/concepts/memory), [Discord](/vi/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Định tuyến phiên</span>
          <span>2 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>25%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "25%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Phiên](/vi/concepts/session), [Định tuyến kênh](/vi/channels/channel-routing), [Discord](/vi/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Duy trì bản ghi hội thoại</span>
          <span>2 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Compaction trong quản lý phiên](/vi/reference/session-management-compaction), [Vệ sinh bản ghi hội thoại](/vi/reference/transcript-hygiene)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Khung kênh - M3 Beta - 8 lĩnh vực">
    <a id="channel-framework" />

    Nhiều kênh dùng chung các hợp đồng phân phối và định tuyến của Gateway, nhưng hành vi của kênh thay đổi tùy theo API thượng nguồn và các ràng buộc trong chính sách tài khoản.

    <div className="maturity-surface-rollup"><span>Độ bao phủ Thử nghiệm - 13%</span><span>Chất lượng Beta - 76%</span><span>Mức độ hoàn thiện Beta - 79%</span><span><span className="maturity-lts maturity-lts-partial">Một phần - 5</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Lệnh hành động và phê duyệt của kênh</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Nhóm](/vi/channels/groups), [Discord](/vi/channels/discord), [Google Chat](/vi/channels/googlechat), [Signal](/vi/channels/signal), [Matrix](/vi/channels/matrix)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập kênh</span>
          <span>5 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>14%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "14%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Mục lục](/vi/channels/index), [Ghép nối](/vi/channels/pairing), [Khắc phục sự cố](/vi/channels/troubleshooting), [Plugin kênh SDK](/vi/plugins/sdk-channel-plugins)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Hành vi trong luồng nhóm và phòng xung quanh</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>36%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "36%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Nhóm](/vi/channels/groups), [Tin nhắn nhóm](/vi/channels/group-messages), [Sự kiện phòng xung quanh](/vi/channels/ambient-room-events), [Nhóm phát sóng](/vi/channels/broadcast-groups), [Discord](/vi/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Cổng truy cập và danh tính đầu vào</span>
          <span>5 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Nhóm truy cập](/vi/channels/access-groups), [Nhóm](/vi/channels/groups), [Discord](/vi/channels/discord), [LINE](/vi/channels/line)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Tệp đính kèm đa phương tiện và dữ liệu kênh phong phú</span>
          <span>4 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [LINE](/vi/channels/line), [Signal](/vi/channels/signal), [Google Chat](/vi/channels/googlechat), [Matrix](/vi/channels/matrix), [Discord](/vi/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Pipeline gửi đi và phản hồi</span>
          <span>4 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>38%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "38%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Nhóm](/vi/channels/groups), [Sự kiện phòng xung quanh](/vi/channels/ambient-room-events), [Discord](/vi/channels/discord), [Matrix](/vi/channels/matrix), [Cấu hình kênh](/vi/gateway/config-channels)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Định tuyến và phân phối cuộc hội thoại</span>
          <span>10 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Định tuyến kênh](/vi/channels/channel-routing), [Nhóm](/vi/channels/groups), [Discord](/vi/channels/discord), [Matrix](/vi/channels/matrix), [Khắc phục sự cố](/vi/channels/troubleshooting), [Tham chiếu cấu hình](/vi/gateway/configuration-reference)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Tình trạng hoạt động và các biện pháp kiểm soát dành cho người vận hành</span>
          <span>4 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Tình trạng hoạt động](/vi/gateway/health), [Tài liệu tham khảo cấu hình](/vi/gateway/configuration-reference), [Khắc phục sự cố](/vi/channels/troubleshooting), [Discord](/vi/channels/discord)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Khả năng quan sát - M3 Beta - 5 lĩnh vực">
    <a id="observability" />

    Đã có tài liệu về OTel, Prometheus, ghi nhật ký và chẩn đoán. Cần một vòng hoàn thiện công khai về mức độ trưởng thành cho nội dung "người vận hành nên xem xét điều gì trước tiên".

    <div className="maturity-surface-rollup"><span>Phạm vi thử nghiệm - 18%</span><span>Chất lượng Beta - 75%</span><span>Mức độ hoàn chỉnh Beta - 79%</span><span><span className="maturity-lts maturity-lts-partial">Một phần - 3</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi</span><span>Chất lượng</span><span>Mức độ hoàn chỉnh</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Tình trạng hoạt động và sửa chữa</span>
          <span>12 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>28%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "28%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Tình trạng hoạt động](/vi/gateway/health), [Telegram](/vi/channels/telegram), [Doctor](/vi/cli/doctor), [Doctor](/vi/gateway/doctor), [Đường dẫn con của SDK](/vi/plugins/sdk-subpaths), [Tình trạng hoạt động](/vi/cli/health), [Giao thức](/vi/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Ghi nhật ký</span>
          <span>5 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Nhật ký](/vi/logging), [Nhật ký](/vi/gateway/logging), [Nhật ký](/vi/cli/logs)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thu thập chẩn đoán</span>
          <span>8 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Chẩn đoán](/vi/gateway/diagnostics), [Tình trạng](/vi/gateway/health), [Bộ khung Codex](/vi/plugins/codex-harness), [Giao thức](/vi/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Xuất dữ liệu đo từ xa</span>
          <span>13 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Hook](/vi/plugins/hooks), [Opentelemetry](/vi/gateway/opentelemetry), [Nhật ký](/vi/logging), [Đường dẫn con SDK](/vi/plugins/sdk-subpaths), [Otel chẩn đoán](/vi/plugins/reference/diagnostics-otel), [Prometheus](/vi/gateway/prometheus), [Prometheus chẩn đoán](/vi/plugins/reference/diagnostics-prometheus)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Chẩn đoán phiên</span>
          <span>4 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Opentelemetry](/vi/gateway/opentelemetry), [Prometheus](/vi/gateway/prometheus), [Chẩn đoán](/vi/gateway/diagnostics), [Giao thức](/vi/gateway/protocol)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Ứng dụng web Gateway - M3 Beta - 6 lĩnh vực">
    <a id="gateway-web-app" />

    Giao diện web được lập tài liệu với các luồng ghép nối, trò chuyện, PWA, Talk, thông báo đẩy và Gateway từ xa. Nâng cấp sau khi có bảng điểm cho nhiều trình duyệt và PWA trên thiết bị di động.

    <div className="maturity-surface-rollup"><span>Phạm vi Thử nghiệm - 4%</span><span>Chất lượng Beta - 74%</span><span>Mức độ hoàn thiện Beta - 79%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Trò chuyện thời gian thực trên trình duyệt</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Giao diện điều khiển](/vi/web/control-ui), [Giao thức](/vi/gateway/protocol), [Trò chuyện](/vi/nodes/talk)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Truy cập và độ tin cậy trên trình duyệt</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Giao diện điều khiển](/vi/web/control-ui), [Bảng điều khiển](/vi/web/dashboard), [Tailscale](/vi/gateway/tailscale), [Từ xa](/vi/gateway/remote)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Cấu hình</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Giao diện điều khiển](/vi/web/control-ui), [Cấu hình](/vi/gateway/configuration)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Giao diện người dùng trên trình duyệt</span>
          <span>10 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>8%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "8%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Giao diện điều khiển](/vi/web/control-ui), [Chỉ mục](/vi/web/index), [Bảng điều khiển](/vi/web/dashboard), [Giao thức](/vi/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Cuộc trò chuyện WebChat</span>
          <span>15 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>10%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "10%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Giao diện điều khiển](/vi/web/control-ui), [Webchat](/vi/web/webchat), [Bắt đầu](/vi/start/getting-started), [Định tuyến kênh](/vi/channels/channel-routing), [Thao tác tệp an toàn](/vi/gateway/security/secure-file-operations)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Bảng điều khiển vận hành</span>
          <span>10 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>8%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "8%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Giao diện điều khiển](/vi/web/control-ui), [Tình trạng](/vi/gateway/health), [Giao thức](/vi/gateway/protocol), [Bảng điều khiển](/vi/web/dashboard)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Plugin - M3 Beta - 9 lĩnh vực">
    <a id="plugins" />

    Có tài liệu bao quát và bằng chứng mạnh mẽ về runtime nội bộ đối với manifest, cơ chế khám phá, tải, kiến trúc nhà cung cấp/công cụ và các ranh giới phê duyệt. Giữ hàng này ở mức beta cho đến khi có bằng chứng mạnh hơn về API/đường dẫn con của SDK công khai và hoạt động phân phối bên ngoài.

    <div className="maturity-surface-rollup"><span>Phạm vi Thử nghiệm - 12%</span><span>Chất lượng Beta - 72%</span><span>Mức độ hoàn thiện Beta - 79%</span><span><span className="maturity-lts maturity-lts-partial">Một phần - 7</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phát triển và đóng gói Plugin</span>
          <span>8 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Xây dựng Plugin](/vi/plugins/building-plugins), [Tổng quan SDK](/vi/plugins/sdk-overview), [Điểm vào SDK](/vi/plugins/sdk-entrypoints), [Đường dẫn con SDK](/vi/plugins/sdk-subpaths), [Manifest](/vi/plugins/manifest), [Tài liệu tham khảo](/vi/plugins/reference)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugin đi kèm</span>
          <span>5 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Danh mục Plugin](/vi/plugins/plugin-inventory), [Plugin](/vi/cli/plugins), [Nội bộ kiến trúc](/vi/plugins/architecture-internals)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugin Canvas</span>
          <span>6 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Canvas](/vi/plugins/reference/canvas), [Canvas](/vi/refactor/canvas), [Tài liệu tham khảo cấu hình](/vi/gateway/configuration-reference)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Cài đặt và chạy các Plugin</span>
          <span>6 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>35%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "35%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Kiến trúc](/vi/plugins/architecture), [Nội bộ kiến trúc](/vi/plugins/architecture-internals), [Plugin](/vi/cli/plugins)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugin kênh</span>
          <span>5 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Plugin kênh SDK](/vi/plugins/sdk-channel-plugins), [Kênh SDK gửi đến](/vi/plugins/sdk-channel-inbound), [Kênh SDK gửi đi](/vi/plugins/sdk-channel-outbound)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugin nhà cung cấp và công cụ</span>
          <span>6 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>43%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "43%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Plugin nhà cung cấp SDK](/vi/plugins/sdk-provider-plugins), [Plugin công cụ](/vi/plugins/tool-plugins), [Thêm khả năng](/vi/plugins/adding-capabilities)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phê duyệt Plugin</span>
          <span>6 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Yêu cầu quyền của Plugin](/vi/plugins/plugin-permission-requests), [Phê duyệt thực thi](/vi/tools/exec-approvals), [Plugin kênh SDK](/vi/plugins/sdk-channel-plugins)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phát hành plugin</span>
          <span>6 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Plugin](/vi/cli/plugins), [Khả năng tương thích](/vi/plugins/compatibility), [Phát hành](/vi/clawhub/publishing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Kiểm thử plugin</span>
          <span>6 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>27%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "27%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Kiểm thử SDK](/vi/plugins/sdk-testing), [Thiết lập SDK](/vi/plugins/sdk-setup), [Bộ kiểm thử Codex](/vi/plugins/codex-harness)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Bảo mật, xác thực, ghép nối và bí mật - M3 Beta - 6 lĩnh vực">
    <a id="security-auth-pairing-and-secrets" />

    Đã có tài liệu tốt và các bề mặt tăng cường bảo mật. Nâng cấp sau khi các lượt chạy thường xuyên cho kịch bản nâng cấp/bảo mật chứng minh rằng không có lỗi hồi quy trong quá trình thiết lập.

    <div className="maturity-surface-rollup"><span>Phạm vi Thử nghiệm - 16%</span><span>Chất lượng Beta - 72%</span><span>Mức độ hoàn thiện Beta - 79%</span><span><span className="maturity-lts maturity-lts-partial">Một phần - 5</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Chính sách phê duyệt và biện pháp bảo vệ công cụ</span>
          <span>2 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>50%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "50%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Phê duyệt thực thi](/vi/tools/exec-approvals), [Phê duyệt](/vi/cli/approvals), [Yêu cầu quyền của Plugin](/vi/plugins/plugin-permission-requests), [Kiểm tra kiểm toán](/vi/gateway/security/audit-checks)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Xác thực Gateway và truy cập từ xa</span>
          <span>9 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Mục lục](/vi/gateway/security/index), [Sổ tay ứng phó phơi lộ](/vi/gateway/security/exposure-runbook), [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth), [Tailscale](/vi/gateway/tailscale), [Từ xa](/vi/gateway/remote), [Tham chiếu cấu hình](/vi/gateway/configuration-reference), [Gateway](/vi/cli/gateway), [Chẩn đoán](/vi/cli/doctor), [Giao diện điều khiển](/vi/web/control-ui), [Điều khiển trình duyệt](/vi/tools/browser-control), [Kiểm tra kiểm toán](/vi/gateway/security/audit-checks)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Kiểm soát truy cập kênh</span>
          <span>3 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ghép nối](/vi/channels/pairing), [Telegram](/vi/channels/telegram), [Nhóm truy cập](/vi/channels/access-groups), [Kiểm tra kiểm toán](/vi/gateway/security/audit-checks)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Ghép nối thiết bị và Node</span>
          <span>11 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Giao thức](/vi/gateway/protocol), [Thiết bị](/vi/cli/devices), [Ghép nối](/vi/channels/pairing), [Ghép nối](/vi/gateway/pairing), [Phạm vi của toán tử](/vi/gateway/operator-scopes), [Giao diện điều khiển](/vi/web/control-ui), [Trò chuyện web](/vi/web/webchat), [Phê duyệt](/vi/cli/approvals)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Độ tin cậy của Plugin</span>
          <span>2 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Tệp kê khai](/vi/plugins/manifest), [Yêu cầu quyền của Plugin](/vi/plugins/plugin-permission-requests), [Quản lý plugin](/vi/plugins/manage-plugins), [Kiểm tra kiểm toán](/vi/gateway/security/audit-checks)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Quản lý thông tin xác thực và bí mật an toàn</span>
          <span>5 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>46%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "46%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Xác thực](/vi/gateway/authentication), [Mô hình](/vi/cli/models), [OpenAI](/vi/providers/openai), [OAuth](/vi/concepts/oauth), [Bí mật](/vi/gateway/secrets), [Bí mật](/vi/cli/secrets), [Bề mặt thông tin xác thực Secretref](/vi/reference/secretref-credential-surface), [Kiểm tra kiểm toán](/vi/gateway/security/audit-checks)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Tự động hóa: cron, hook, tác vụ, thăm dò - M3 Beta - 6 khu vực">
    <a id="automation-cron-hooks-tasks-polling" />

    Đã được lập tài liệu và có thể sử dụng, nhưng bằng chứng theo kịch bản cần bao quát việc phân phối không cần giám sát, các lần thử lại và khả năng quan sát lỗi.

    <div className="maturity-surface-rollup"><span>Độ bao phủ Thử nghiệm - 2%</span><span>Chất lượng Beta - 72%</span><span>Mức độ hoàn thiện Beta - 79%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Khu vực</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Tác vụ Cron</span>
          <span>15 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Tác vụ Cron](/vi/automation/cron-jobs), [Cron](/vi/cli/cron), [Giao thức](/vi/gateway/protocol), [Tác vụ](/vi/automation/tasks), [Discord](/vi/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Tiếp nhận sự kiện</span>
          <span>15 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Telegram](/vi/channels/telegram), [Zalo](/vi/channels/zalo), [Khắc phục sự cố](/vi/channels/troubleshooting), [iMessage từ BlueBubbles](/vi/channels/imessage-from-bluebubbles), [Tích hợp Gmail Pub/Sub](/vi/automation/cron-jobs#gmail-pubsub-integration), [Gmail Pub/Sub](/vi/automation/cron-jobs), [Webhook](/vi/cli/webhooks), [Webhook](/vi/automation/cron-jobs#webhooks), [Webhook](/vi/automation/cron-jobs)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Hook tự động hóa</span>
          <span>11 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Hook](/vi/automation/hooks), [Hook](/vi/cli/hooks), [Hook](/vi/plugins/hooks), [Yêu cầu quyền của Plugin](/vi/plugins/plugin-permission-requests), [Đường dẫn con SDK](/vi/plugins/sdk-subpaths)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Tác vụ và luồng nền</span>
          <span>10 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Tác vụ](/vi/automation/tasks), [Chỉ mục](/vi/automation/index), [Tác vụ](/vi/cli/tasks), [TaskFlow](/vi/automation/taskflow), [Môi trường chạy SDK](/vi/plugins/sdk-runtime)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Heartbeat</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>14%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "14%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Chỉ mục](/vi/automation/index), [Heartbeat](/vi/gateway/heartbeat), [Cam kết](/vi/concepts/commitments)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Điều khiển thăm dò</span>
          <span>10 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Thăm dò](/vi/cli/message), [Tin nhắn](/vi/cli/message), [Telegram](/vi/channels/telegram), [Microsoft Teams](/vi/channels/msteams), [Tiến trình nền](/vi/gateway/background-process)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Hiểu và tạo nội dung đa phương tiện - M2 Alpha - 6 khu vực">
    <a id="media-understanding-and-media-generation" />

    Có phạm vi khả năng rộng, nhưng sự khác biệt giữa các nhà cung cấp, giới hạn tệp và tính tương đương giữa Node/ứng dụng khiến bề mặt này chưa ổn định.

    <div className="maturity-surface-rollup"><span>Độ bao phủ Thử nghiệm - 2%</span><span>Chất lượng Alpha - 64%</span><span>Mức độ hoàn thiện Alpha - 68%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Tiếp nhận và truy cập nội dung đa phương tiện</span>
          <span>8 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Tổng quan về nội dung đa phương tiện](/vi/tools/media-overview), [Hiểu nội dung đa phương tiện](/vi/nodes/media-understanding), [Thao tác tệp an toàn](/vi/gateway/security/secure-file-operations), [PDF](/vi/tools/pdf), [Tạo hình ảnh](/vi/tools/image-generation), [QR](/vi/cli/qr), [LINE](/vi/channels/line), [WhatsApp](/vi/channels/whatsapp)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Xử lý nội dung đa phương tiện của kênh</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Hình ảnh](/vi/nodes/images), [Tổng quan về nội dung đa phương tiện](/vi/tools/media-overview), [Discord](/vi/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Cấu hình nội dung đa phương tiện</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Tổng quan về nội dung đa phương tiện](/vi/tools/media-overview), [Tạo hình ảnh](/vi/tools/image-generation), [Tệp kê khai](/vi/plugins/manifest), [Bộ khung Codex](/vi/plugins/codex-harness)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phân phối văn bản thành giọng nói</span>
          <span>2 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Chuyển văn bản thành giọng nói](/vi/tools/tts), [Tổng quan về nội dung đa phương tiện](/vi/tools/media-overview), [Discord](/vi/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Hiểu nội dung đa phương tiện</span>
          <span>12 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Âm thanh](/vi/nodes/audio), [Hiểu nội dung đa phương tiện](/vi/nodes/media-understanding), [Tổng quan về nội dung đa phương tiện](/vi/tools/media-overview), [WhatsApp](/vi/channels/whatsapp), [Hình ảnh](/vi/nodes/images), [Suy luận](/vi/cli/infer), [PDF](/vi/tools/pdf)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Tạo nội dung đa phương tiện</span>
          <span>17 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>5%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "5%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Tạo hình ảnh](/vi/tools/image-generation), [Tổng quan về nội dung đa phương tiện](/vi/tools/media-overview), [Skills](/vi/tools/skills), [Tạo nhạc](/vi/tools/music-generation), [Tạo video](/vi/tools/video-generation)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Giọng nói và trò chuyện thời gian thực - M2 Alpha - 6 lĩnh vực">
    <a id="voice-and-realtime-talk" />

    Có nhiều cách triển khai trên Control UI, các ứng dụng và các nhà cung cấp. Cần có bảng điểm về độ trễ, chế độ lỗi và quy trình thiết lập trước khi chuyển sang beta.

    <div className="maturity-surface-rollup"><span>Phạm vi bao phủ Thử nghiệm - 0%</span><span>Chất lượng Alpha - 61%</span><span>Mức độ hoàn thiện Alpha - 68%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Nhà cung cấp trò chuyện</span>
          <span>7 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenAI](/vi/providers/openai), [Google](/vi/providers/google), [Plugin nhà cung cấp SDK](/vi/plugins/sdk-provider-plugins), [Trò chuyện](/vi/nodes/talk), [Control UI](/vi/web/control-ui)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phiên trò chuyện thời gian thực</span>
          <span>11 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Trò chuyện](/vi/nodes/talk), [Giao diện điều khiển](/vi/web/control-ui)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Giọng nói và phiên âm</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Trò chuyện](/vi/nodes/talk), [OpenAI](/vi/providers/openai), [Google](/vi/providers/google)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Trò chuyện trong ứng dụng gốc</span>
          <span>4 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Trò chuyện](/vi/nodes/talk), [Kích hoạt bằng giọng nói](/vi/platforms/mac/voicewake)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Kích hoạt bằng giọng nói và định tuyến</span>
          <span>4 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Kích hoạt bằng giọng nói](/vi/nodes/voicewake), [Kích hoạt bằng giọng nói](/vi/platforms/mac/voicewake), [Lớp phủ giọng nói](/vi/platforms/mac/voice-overlay)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Khả năng quan sát trò chuyện</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Giao diện điều khiển](/vi/web/control-ui), [Lớp phủ giọng nói](/vi/platforms/mac/voice-overlay), [Trò chuyện](/vi/nodes/talk)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="TUI - M2 Alpha - 5 lĩnh vực">
    <a id="tui" />

    Có trong tài liệu và mã nguồn, nhưng ít nổi bật hơn với vai trò là quy trình làm việc chính của người dùng. Cần định nghĩa rõ ràng các kịch bản.

    <div className="maturity-surface-rollup"><span>Độ bao phủ Thử nghiệm - 0%</span><span>Chất lượng Alpha - 59%</span><span>Mức độ hoàn thiện Alpha - 66%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Chế độ runtime</span>
          <span>14 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [TUI](/vi/cli/tui), [TUI](/vi/web/tui), [Chỉ mục](/vi/cli/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Đầu vào và lệnh</span>
          <span>8 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [TUI](/vi/web/tui)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Quản lý phiên</span>
          <span>3 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [TUI](/vi/web/tui), [Phiên](/vi/cli/sessions)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thực thi shell cục bộ</span>
          <span>4 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [TUI](/vi/web/tui), [TUI](/vi/cli/tui)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">An toàn khi kết xuất và xuất dữ liệu</span>
          <span>4 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [TUI](/vi/web/tui), [Mã QR](/vi/cli/qr), [Nhật ký](/vi/cli/logs), [Hoàn thành](/vi/cli/completion)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="ClawHub - M2 Alpha - 4 lĩnh vực">
    <a id="clawhub" />

    Đã có tài liệu công khai và khái niệm về hệ sinh thái. Cần có các bảng điểm về cài đặt, độ tin cậy, cập nhật, khôi phục phiên bản và khả năng tương thích.

    <div className="maturity-surface-rollup"><span>Độ bao phủ Thử nghiệm - 0%</span><span>Chất lượng Alpha - 58%</span><span>Mức độ hoàn thiện Alpha - 62%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phát hành</span>
          <span>7 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Phát hành](/vi/clawhub/publishing), [Tạo Skills](/vi/tools/creating-skills), [Cộng đồng](/vi/plugins/community)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Khám phá danh mục</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Plugin](/vi/tools/plugin), [Các Plugin](/vi/cli/plugins), [Skills](/vi/cli/skills), [Skills](/vi/tools/skills), [Cộng đồng](/vi/plugins/community)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Khả năng tương thích và độ tin cậy</span>
          <span>12 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>56%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "56%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Plugin](/vi/tools/plugin), [Các Plugin](/vi/cli/plugins), [Khả năng tương thích](/vi/plugins/compatibility), [Kho Plugin](/vi/plugins/plugin-inventory), [Phát hành](/vi/clawhub/publishing), [Skills](/vi/tools/skills), [Cấu hình Skills](/vi/tools/skills-config)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Vòng đời và tình trạng của Plugin</span>
          <span>26 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Plugin](/vi/tools/plugin), [Các Plugin](/vi/cli/plugins), [Skills](/vi/cli/skills), [Skills](/vi/tools/skills), [Giao thức](/vi/gateway/protocol), [Gói](/vi/plugins/bundles), [Phân giải phần phụ thuộc](/vi/plugins/dependency-resolution)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="OpenClaw App SDK - M2 Alpha - 6 lĩnh vực">
    <a id="openclaw-app-sdk" />

    OpenClaw App SDK là một hợp đồng ứng dụng bên ngoài riêng biệt, tách khỏi môi trường chạy Gateway và Plugin SDK. Điểm số hiện tại cho thấy một lộ trình `@openclaw/sdk` thực tế nhưng vẫn còn thiếu sót về đóng gói công khai, tự động khám phá, phê duyệt, trình trợ giúp và khả năng tương thích.

    <div className="maturity-surface-rollup"><span>Độ bao phủ Thử nghiệm - 3%</span><span>Chất lượng Alpha - 54%</span><span>Mức độ hoàn thiện Alpha - 53%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">API máy khách</span>
          <span>4 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>51%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "51%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>50%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "50%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenClaw SDK](/vi/gateway/external-apps), [Thiết kế API OpenClaw SDK](/vi/gateway/external-apps)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Truy cập Gateway</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [SDK OpenClaw](/vi/gateway/external-apps), [Thiết kế API SDK OpenClaw](/vi/gateway/external-apps), [Giao thức](/vi/gateway/protocol), [Chỉ mục](/vi/gateway/security/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Cuộc hội thoại của tác nhân</span>
          <span>6 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>52%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "52%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>52%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "52%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [SDK OpenClaw](/vi/gateway/external-apps), [Thiết kế API SDK OpenClaw](/vi/gateway/external-apps), [Giao thức](/vi/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Sự kiện và phê duyệt</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>52%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "52%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>52%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "52%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [SDK OpenClaw](/vi/gateway/external-apps), [Thiết kế API SDK OpenClaw](/vi/gateway/external-apps), [Giao thức](/vi/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Trình trợ giúp tài nguyên</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>17%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "17%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [SDK OpenClaw](/vi/gateway/external-apps), [Thiết kế API SDK OpenClaw](/vi/gateway/external-apps)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Khả năng tương thích</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Thiết kế API SDK OpenClaw](/vi/gateway/external-apps), [Typebox](/vi/concepts/typebox), [Giao thức](/vi/gateway/protocol)

    </div>
      </div>
    </div>

  </Accordion>

</AccordionGroup>

### Nền tảng

<AccordionGroup>
  <Accordion title="Máy chủ Gateway Linux - M4 Ổn định - 5 lĩnh vực">
    <a id="linux-gateway-host" />

    Khuyến nghị sử dụng môi trường chạy Node, dịch vụ người dùng systemd đã được lập tài liệu và hướng dẫn về VPS/container bao quát nhiều trường hợp.

    <div className="maturity-surface-rollup"><span>Phạm vi Thử nghiệm - 0%</span><span>Chất lượng Beta - 75%</span><span>Mức độ hoàn thiện Ổn định - 89%</span><span><span className="maturity-lts maturity-lts-partial">Một phần - 4</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập và cập nhật máy chủ</span>
          <span>4 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Tổng quan](/vi/install/index), [Cập nhật](/vi/install/updating), [Linux](/vi/platforms/linux), [Tổng quan](/vi/platforms/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Môi trường chạy Gateway và điều khiển dịch vụ</span>
          <span>6 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Tổng quan](/vi/gateway/index), [Gateway](/vi/cli/gateway), [Linux](/vi/platforms/linux), [VPS](/vi/vps)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Truy cập từ xa và bảo mật</span>
          <span>6 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Từ xa](/vi/gateway/remote), [Tailscale](/vi/gateway/tailscale), [Cẩm nang xử lý phơi lộ](/vi/gateway/security/exposure-runbook), [Xác thực](/vi/gateway/authentication), [Thông tin bí mật](/vi/gateway/secrets)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Chẩn đoán và sửa chữa</span>
          <span>4 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Trạng thái](/vi/cli/status), [Nhật ký](/vi/cli/logs), [Doctor](/vi/cli/doctor), [Chẩn đoán](/vi/gateway/diagnostics), [Chỉ mục](/vi/gateway/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Mục tiêu triển khai</span>
          <span>3 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [VPS](/vi/vps), [Docker](/vi/install/docker), [Hetzner](/vi/install/hetzner), [DigitalOcean](/vi/install/digitalocean), [Kubernetes](/vi/install/kubernetes), [Podman](/vi/install/podman)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Máy chủ Gateway macOS - M4 ổn định - 7 lĩnh vực">
    <a id="macos-gateway-host" />

    Đường dẫn dịch vụ LaunchAgent, các chế độ Gateway cục bộ/từ xa, cài đặt CLI và tích hợp ứng dụng đều được ghi lại trong tài liệu.

    <div className="maturity-surface-rollup"><span>Độ bao phủ Thử nghiệm - 0%</span><span>Chất lượng Beta - 74%</span><span>Mức độ hoàn thiện Ổn định - 88%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập CLI</span>
          <span>4 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [macOS](/vi/platforms/macos), [Gateway đi kèm](/vi/platforms/mac/bundled-gateway), [Trình cài đặt](/vi/install/installer), [Node](/vi/install/node)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Tích hợp Gateway cục bộ</span>
          <span>9 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [macOS](/vi/platforms/macos), [Gateway đi kèm](/vi/platforms/mac/bundled-gateway), [Từ xa](/vi/platforms/mac/remote), [Tổng quan](/vi/gateway/index), [Gateway](/vi/cli/gateway), [Bonjour](/vi/gateway/bonjour)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Chế độ Gateway từ xa</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Từ xa](/vi/platforms/mac/remote), [Từ xa](/vi/gateway/remote), [Tailscale](/vi/gateway/tailscale)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Vòng đời dịch vụ Gateway</span>
          <span>10 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [macOS](/vi/platforms/macos), [Gateway đi kèm](/vi/platforms/mac/bundled-gateway), [Gateway](/vi/cli/gateway), [Tổng quan](/vi/gateway/index), [Cập nhật](/vi/cli/update), [Đang cập nhật](/vi/install/updating), [Gỡ cài đặt](/vi/install/uninstall), [Khắc phục sự cố](/vi/gateway/troubleshooting)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Chẩn đoán và khả năng quan sát</span>
          <span>4 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Gateway đi kèm](/vi/platforms/mac/bundled-gateway), [macOS](/vi/platforms/macos), [Gateway](/vi/cli/gateway), [Chẩn đoán](/vi/gateway/doctor), [Khắc phục sự cố](/vi/gateway/troubleshooting)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Quyền và khả năng gốc</span>
          <span>4 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [macOS](/vi/platforms/macos), [Từ xa](/vi/platforms/mac/remote)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Hồ sơ và cách ly</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Nhiều Gateway](/vi/gateway/multiple-gateways), [Chỉ mục](/vi/gateway/index), [Gateway](/vi/cli/gateway)

    </div>
      </div>
    </div>

  </Accordion>
  <Accordion title="Ứng dụng Android - M4 ổn định - 7 lĩnh vực">
    <a id="android-app" />

    Đã có bản phân phối chính thức trên Google Play, tài liệu xây dựng/chạy từ mã nguồn được duy trì và ứng dụng Android được ghi nhận là một node đồng hành thông thường dành cho người dùng.

    <div className="maturity-surface-rollup"><span>Phạm vi thử nghiệm - 0%</span><span>Chất lượng ổn định - 80%</span><span>Mức độ hoàn thiện ổn định - 80%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thu nhận phương tiện</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Android](/vi/platforms/android), [Camera](/vi/nodes/camera)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Trò chuyện trên thiết bị di động</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Android](/vi/platforms/android)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập kết nối</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Android](/vi/platforms/android), [Bonjour](/vi/gateway/bonjour), [Ghép nối](/vi/gateway/pairing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phân phối</span>
          <span>3 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Android](/vi/platforms/android)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Cài đặt</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Android](/vi/platforms/android)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Giọng nói</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Android](/vi/platforms/android), [Trò chuyện](/vi/nodes/talk)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Môi trường thực thi trên thiết bị</span>
          <span>2 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Android](/vi/platforms/android), [Khắc phục sự cố](/vi/nodes/troubleshooting), [Giao thức](/vi/gateway/protocol)

    </div>
      </div>
    </div>

  </Accordion>
  <Accordion title="Ứng dụng iOS - M4 Ổn định - 8 lĩnh vực">
    <a id="ios-app" />

    Đã có bản phân phối chính thức trên App Store, tính năng đẩy được hỗ trợ bởi relay đã được ghi tài liệu và ứng dụng iOS được mô tả là một Node đồng hành thông thường dành cho người dùng.

    <div className="maturity-surface-rollup"><span>Phạm vi Thử nghiệm - 0%</span><span>Chất lượng Ổn định - 80%</span><span>Mức độ hoàn thiện Ổn định - 80%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phương tiện và chia sẻ</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ios](/vi/platforms/ios), [Camera](/vi/nodes/camera)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Canvas và màn hình</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ios](/vi/platforms/ios), [Canvas](/vi/plugins/reference/canvas)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Trò chuyện và phiên</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ios](/vi/platforms/ios), [Trò chuyện web](/vi/web/webchat), [Giao thức](/vi/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập và chẩn đoán Gateway</span>
          <span>7 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ios](/vi/platforms/ios), [Ghép nối](/vi/channels/pairing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phân phối</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ios](/vi/platforms/ios)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Lệnh thiết bị</span>
          <span>2 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ios](/vi/platforms/ios), [Giao thức](/vi/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thông báo và hoạt động nền</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ios](/vi/platforms/ios), [Cấu hình](/vi/gateway/configuration)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Giọng nói</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ios](/vi/platforms/ios), [Trò chuyện thoại](/vi/nodes/talk)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Lưu trữ bằng Docker và Podman - M3 Beta - 4 lĩnh vực">
    <a id="docker-and-podman-hosting" />

    Đã có tài liệu cài đặt và đây là các phương thức triển khai phổ biến. Nâng cấp mức độ trưởng thành sau khi quy trình kiểm thử nhanh định kỳ cho bản phát hành ghi nhận được hành vi nâng cấp và ổ đĩa lưu trữ.

    <div className="maturity-surface-rollup"><span>Độ bao phủ Thử nghiệm - 7%</span><span>Chất lượng Beta - 71%</span><span>Mức độ hoàn thiện Beta - 79%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập container</span>
          <span>6 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Docker](/vi/install/docker), [Podman](/vi/install/podman)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Vận hành container</span>
          <span>11 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Podman](/vi/install/podman), [Môi trường chạy máy ảo Docker](/vi/install/docker-vm-runtime), [Docker](/vi/install/docker), [Hetzner](/vi/install/hetzner), [Hostinger](/vi/install/hostinger)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phát hành và xác thực image</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>29%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "29%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Docker](/vi/install/docker), [Môi trường chạy máy ảo Docker](/vi/install/docker-vm-runtime), [Xác thực bản phát hành đầy đủ](/vi/reference/full-release-validation)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Hộp cát và công cụ cho tác nhân</span>
          <span>3 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Docker](/vi/install/docker), [Môi trường chạy máy ảo Docker](/vi/install/docker-vm-runtime)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Windows qua WSL2 - M3 Beta - 6 lĩnh vực">
    <a id="windows-via-wsl2" />

    Lộ trình Windows được khuyến nghị, kèm hướng dẫn về systemd/dịch vụ người dùng và tài liệu chuỗi khởi động. Nâng cấp sau khi có các bảng điểm cài đặt/cập nhật lặp lại.

    <div className="maturity-surface-rollup"><span>Độ bao phủ Thử nghiệm - 6%</span><span>Chất lượng Alpha - 69%</span><span>Mức độ hoàn thiện Beta - 79%</span><span><span className="maturity-lts maturity-lts-partial">Một phần - 5</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập WSL</span>
          <span>6 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/vi/platforms/windows), [Bắt đầu](/vi/start/getting-started)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">CLI</span>
          <span>8 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/vi/platforms/windows), [Bắt đầu](/vi/start/getting-started), [Cập nhật](/vi/install/updating), [Khởi tạo](/vi/cli/onboard), [Chẩn đoán](/vi/cli/doctor), [Trạng thái](/vi/cli/status), [Nhật ký](/vi/cli/logs)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Vòng đời dịch vụ Gateway</span>
          <span>10 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/vi/platforms/windows), [Mục lục](/vi/gateway/index), [Chẩn đoán](/vi/gateway/doctor)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Truy cập và công khai Gateway</span>
          <span>11 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Xác thực](/vi/gateway/authentication), [Thông tin bí mật](/vi/gateway/secrets), [Truy cập từ xa](/vi/gateway/remote), [Cẩm nang vận hành công khai](/vi/gateway/security/exposure-runbook), [Windows](/vi/platforms/windows)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Chẩn đoán và sửa chữa</span>
          <span>6 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>38%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "38%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/vi/platforms/windows), [Trạng thái](/vi/cli/status), [Nhật ký](/vi/cli/logs), [Bác sĩ](/vi/cli/doctor), [Bác sĩ](/vi/gateway/doctor)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Trình duyệt và giao diện điều khiển</span>
          <span>6 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Khắc phục sự cố CDP từ xa của trình duyệt trên WSL2 Windows](/vi/tools/browser-wsl2-windows-remote-cdp-troubleshooting), [Trình duyệt](/vi/tools/browser), [Giao diện điều khiển](/vi/web/control-ui)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Raspberry Pi và các thiết bị Linux nhỏ - M3 Beta - 4 lĩnh vực">
    <a id="raspberry-pi-and-small-linux-devices" />

    Đã có tài liệu nền tảng và đường dẫn Gateway dựa trên Linux. Cần bằng chứng kiểm thử nhanh bản phát hành dành riêng cho phần cứng để nâng lên mức cao hơn.

    <div className="maturity-surface-rollup"><span>Độ bao phủ Thử nghiệm - 0%</span><span>Chất lượng Alpha - 67%</span><span>Mức độ hoàn thiện Beta - 79%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập và khả năng tương thích</span>
          <span>12 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Raspberry Pi](/vi/install/raspberry-pi), [Mục lục](/vi/install/index), [Câu hỏi thường gặp về lần chạy đầu tiên](/vi/help/faq-first-run), [Câu hỏi thường gặp](/vi/help/faq), [Linux](/vi/platforms/linux), [Trình cài đặt](/vi/install/installer)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Truy cập từ xa và xác thực</span>
          <span>9 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Raspberry Pi](/vi/install/raspberry-pi), [Xác thực](/vi/gateway/authentication), [Thông tin bí mật](/vi/gateway/secrets), [Ghép nối](/vi/gateway/pairing), [Thiết bị](/vi/cli/devices), [Truy cập từ xa](/vi/gateway/remote), [Tailscale](/vi/gateway/tailscale)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Môi trường chạy Gateway</span>
          <span>10 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Mục lục](/vi/gateway/index), [Gateway](/vi/cli/gateway), [Raspberry Pi](/vi/install/raspberry-pi), [Linux](/vi/platforms/linux), [VPS](/vi/vps)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Hiệu năng và chẩn đoán</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Raspberry Pi](/vi/install/raspberry-pi), [Linux](/vi/platforms/linux), [Tình trạng hoạt động](/vi/gateway/health), [Chẩn đoán](/vi/gateway/diagnostics)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Ứng dụng đồng hành trên macOS - M3 Beta - 8 lĩnh vực">
    <a id="macos-companion-app" />

    Đã có ứng dụng thanh menu phong phú, quyền, chế độ Node, Canvas, kích hoạt bằng giọng nói, WebChat và chế độ từ xa. Tuy nhiên, ứng dụng vẫn thay đổi đủ nhanh nên chưa thể đạt mức Ổn định.

    <div className="maturity-surface-rollup"><span>Độ bao phủ Thử nghiệm - 0%</span><span>Chất lượng Alpha - 66%</span><span>Mức độ hoàn thiện Beta - 78%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Canvas</span>
          <span>4 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Canvas](/vi/platforms/mac/canvas), [macOS](/vi/platforms/macos), [WebChat](/vi/web/webchat)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập cục bộ</span>
          <span>7 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Gateway tích hợp sẵn](/vi/platforms/mac/bundled-gateway), [macOS](/vi/platforms/macos), [Tiến trình con](/vi/platforms/mac/child-process), [Thiết lập phát triển](/vi/platforms/mac/dev-setup)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Trạng thái và cài đặt</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Thanh menu](/vi/platforms/mac/menu-bar), [Biểu tượng](/vi/platforms/mac/icon), [macOS](/vi/platforms/macos), [Tình trạng hoạt động](/vi/platforms/mac/health), [Ghi nhật ký](/vi/platforms/mac/logging), [Từ xa](/vi/platforms/mac/remote)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Khả năng gốc</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [macOS](/vi/platforms/macos), [XPC](/vi/platforms/mac/xpc), [Quyền](/vi/platforms/mac/permissions), [Ký mã](/vi/platforms/mac/signing), [Peekaboo](/vi/platforms/mac/peekaboo)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Kết nối từ xa</span>
          <span>3 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Từ xa](/vi/platforms/mac/remote), [macOS](/vi/platforms/macos), [Từ xa](/vi/gateway/remote)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Giọng nói và trò chuyện</span>
          <span>3 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Đánh thức bằng giọng nói](/vi/platforms/mac/voicewake), [Lớp phủ giọng nói](/vi/platforms/mac/voice-overlay), [Trò chuyện](/vi/nodes/talk), [macOS](/vi/platforms/macos)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">WebChat</span>
          <span>3 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Webchat](/vi/platforms/mac/webchat), [macOS](/vi/platforms/macos), [Webchat](/vi/web/webchat)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">WebChat từ xa</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Webchat](/vi/platforms/mac/webchat), [Từ xa](/vi/gateway/remote), [Từ xa](/vi/platforms/mac/remote)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Windows nguyên bản - M2 Alpha - 4 lĩnh vực">
    <a id="native-windows" />

    Các luồng CLI/Gateway cốt lõi hoạt động, nhưng tài liệu vẫn khuyến nghị WSL2 để có trải nghiệm đầy đủ và liệt kê các lưu ý khi chạy nguyên bản.

    <div className="maturity-surface-rollup"><span>Độ bao phủ Thử nghiệm - 0%</span><span>Chất lượng Alpha - 58%</span><span>Mức độ hoàn thiện Alpha - 66%</span><span><span className="maturity-lts maturity-lts-partial">Một phần - 1</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">CLI</span>
          <span>9 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Chỉ mục](/vi/install/index), [Trình cài đặt](/vi/install/installer), [Windows](/vi/platforms/windows), [Bắt đầu](/vi/start/getting-started), [Thiết lập ban đầu](/vi/cli/onboard)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Quản lý Gateway</span>
          <span>11 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/vi/platforms/windows), [Mục lục](/vi/gateway/index), [Gateway](/vi/cli/gateway), [Chẩn đoán](/vi/cli/doctor)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Mạng</span>
          <span>4 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/vi/platforms/windows), [Mục lục](/vi/gateway/index), [Gateway](/vi/cli/gateway)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Cập nhật</span>
          <span>4 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Cập nhật](/vi/install/updating), [CI](/vi/ci)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Lưu trữ trên Kubernetes - M2 Alpha - 4 lĩnh vực">
    <a id="kubernetes-hosting" />

    Lưu trữ trên Kubernetes là một lộ trình triển khai cụm riêng biệt dựa trên Kustomize. Điểm số hiện tại cho thấy đã có một lộ trình triển khai tối thiểu thực tế, nhưng vẫn còn thiếu sót về CI dành riêng cho Kubernetes, đóng gói ingress/TLS/NetworkPolicy, sao lưu/khôi phục và tăng cường bảo mật khi công khai trong môi trường sản xuất.

    <div className="maturity-surface-rollup"><span>Phạm vi Thử nghiệm - 0%</span><span>Chất lượng Alpha - 55%</span><span>Mức độ hoàn thiện Alpha - 61%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập triển khai</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Kubernetes](/vi/install/kubernetes), [Mục lục](/vi/install/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Cấu hình và thông tin bí mật</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Kubernetes](/vi/install/kubernetes), [Thông tin bí mật](/vi/gateway/secrets), [Môi trường](/vi/help/environment)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Truy cập và công khai</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Kubernetes](/vi/install/kubernetes), [Xác thực](/vi/gateway/authentication), [Từ xa](/vi/gateway/remote), [Sổ tay vận hành công khai](/vi/gateway/security/exposure-runbook)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Vòng đời cụm</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Kubernetes](/vi/install/kubernetes), [Mục lục](/vi/gateway/index)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Lộ trình cài đặt Nix - M1 Thử nghiệm - 5 lĩnh vực">
    <a id="nix-install-path" />

    Luồng cài đặt tùy chọn. Cần cam kết hỗ trợ rõ ràng hơn trước khi nâng lên alpha/beta.

    <div className="maturity-surface-rollup"><span>Phạm vi Thử nghiệm - 0%</span><span>Chất lượng Thử nghiệm - 41%</span><span>Mức độ hoàn thiện Thử nghiệm - 44%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Bàn giao cài đặt</span>
          <span>4 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Nix](/vi/install/nix), [Mục lục](/vi/install/index), [Thư mục tài liệu](/vi/start/docs-directory)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Vòng đời Plugin</span>
          <span>4 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Quản lý Plugin](/vi/plugins/manage-plugins), [Plugin](/vi/tools/plugin), [Nix](/vi/install/nix)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Kích hoạt và trải nghiệm người dùng ứng dụng</span>
          <span>7 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Nix](/vi/install/nix)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Cấu hình và trạng thái</span>
          <span>7 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Nix](/vi/install/nix), [Thiết lập](/vi/cli/setup), [Môi trường](/vi/help/environment)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Môi trường chạy dịch vụ và cơ chế bảo vệ</span>
          <span>8 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Nix](/vi/install/nix), [Thiết lập](/vi/cli/setup), [Chẩn đoán](/vi/cli/doctor), [Cập nhật](/vi/cli/update)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Các bề mặt ứng dụng đồng hành watchOS - M1 Thử nghiệm - 5 lĩnh vực">
    <a id="watchos-companion-surfaces" />

    Mã nguồn có các bề mặt ứng dụng/tiện ích mở rộng Watch; tài liệu công khai chưa giới thiệu đây là một tính năng dành cho người dùng.

    <div className="maturity-surface-rollup"><span>Độ bao phủ Thử nghiệm - 0%</span><span>Chất lượng Thử nghiệm - 41%</span><span>Mức độ hoàn thiện Thử nghiệm - 44%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phân phối và khôi phục</span>
          <span>7 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iOS](/vi/platforms/ios)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phê duyệt thực thi</span>
          <span>3 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Phê duyệt thực thi](/vi/tools/exec-approvals), [iOS](/vi/platforms/ios)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phân phối và hỗ trợ</span>
          <span>6 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iOS](/vi/platforms/ios)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thông báo và phản hồi</span>
          <span>7 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iOS](/vi/platforms/ios)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Giao diện ứng dụng trên đồng hồ</span>
          <span>3 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iOS](/vi/platforms/ios)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Ứng dụng đồng hành Linux - M0 Đã lên kế hoạch - 5 lĩnh vực">
    <a id="linux-companion-app" />

    Tài liệu cho biết các ứng dụng đồng hành Linux gốc đã được lên kế hoạch; Gateway hiện là phương thức được hỗ trợ trên Linux.

    <div className="maturity-surface-rollup"><span>Độ bao phủ Thử nghiệm - 0%</span><span>Chất lượng Thử nghiệm - 19%</span><span>Mức độ hoàn thiện Thử nghiệm - 21%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phân phối ứng dụng</span>
          <span>3 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Linux](/vi/platforms/linux), [Tổng quan](/vi/platforms/index), [Tổng quan](/vi/install/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Kết nối Gateway</span>
          <span>4 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Linux](/vi/platforms/linux), [Tổng quan](/vi/gateway/index), [Ghép nối](/vi/gateway/pairing), [Truy cập từ xa](/vi/gateway/remote)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Trò chuyện và phiên</span>
          <span>3 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Linux](/vi/platforms/linux), [Giao thức](/vi/gateway/protocol), [Trò chuyện web](/vi/web/webchat)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Khả năng trên máy tính</span>
          <span>9 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Linux](/vi/platforms/linux), [Phê duyệt thực thi](/vi/tools/exec-approvals), [Bí mật](/vi/gateway/secrets), [Tổng quan](/vi/nodes/index), [Thực thi](/vi/tools/exec), [Trò chuyện bằng giọng nói](/vi/nodes/talk), [Máy ảnh](/vi/nodes/camera)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Trạng thái và chẩn đoán</span>
          <span>7 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Linux](/vi/platforms/linux), [OpenClaw](/vi/start/openclaw), [Chẩn đoán](/vi/gateway/doctor)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Ứng dụng đồng hành Windows gốc - M0 Đã lên kế hoạch - 5 lĩnh vực">
    <a id="native-windows-companion-app" />

    Chỉ mới được lên kế hoạch.

    <div className="maturity-surface-rollup"><span>Độ bao phủ Thử nghiệm - 0%</span><span>Chất lượng Thử nghiệm - 19%</span><span>Mức độ hoàn thiện Thử nghiệm - 21%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Cài đặt và cập nhật</span>
          <span>4 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/vi/platforms/windows), [Tổng quan](/vi/install/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Kết nối Gateway</span>
          <span>3 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/vi/platforms/windows), [Tổng quan](/vi/gateway/index), [Ghép nối](/vi/gateway/pairing), [Từ xa](/vi/gateway/remote)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phiên trò chuyện</span>
          <span>2 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/vi/platforms/windows), [Giao thức](/vi/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Trạng thái và sửa chữa</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/vi/platforms/windows), [Chẩn đoán](/vi/gateway/doctor), [Tổng quan](/vi/gateway/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Công cụ máy tính và quyền</span>
          <span>10 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/vi/platforms/windows), [Tổng quan](/vi/nodes/index), [Thực thi](/vi/tools/exec), [Phê duyệt thực thi](/vi/tools/exec-approvals), [Tổng quan](/vi/gateway/security/index)

    </div>
      </div>
    </div>

  </Accordion>

</AccordionGroup>

### Kênh

<AccordionGroup>
  <Accordion title="Discord - M4 Ổn định - 6 lĩnh vực">
    <a id="discord" />

    Tài liệu chuyên sâu và phạm vi tính năng rộng. Các luồng thoại/ủy quyền nên tiếp tục được chấm điểm riêng ở mức beta/alpha.

    <div className="maturity-surface-rollup"><span>Phạm vi Thử nghiệm - 0%</span><span>Chất lượng Beta - 73%</span><span>Mức độ hoàn thiện Ổn định - 87%</span><span><span className="maturity-lts maturity-lts-partial">Một phần - 4</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập và vận hành kênh</span>
          <span>10 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Discord](/vi/channels/discord), [Discord](/vi/plugins/reference/discord), [Fly](/vi/install/fly), [Lệnh gạch chéo](/vi/tools/slash-commands), [Tình trạng](/vi/gateway/health), [Kênh](/vi/cli/channels), [Cấu hình kênh](/vi/gateway/config-channels)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Quyền truy cập và danh tính</span>
          <span>6 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Discord](/vi/channels/discord), [Ghép nối](/vi/channels/pairing), [Nhóm truy cập](/vi/channels/access-groups), [Nhóm](/vi/channels/groups)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Định tuyến và phân phối cuộc hội thoại</span>
          <span>12 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Discord](/vi/channels/discord), [Định tuyến kênh](/vi/channels/channel-routing), [Nhóm](/vi/channels/groups), [Nhóm truy cập](/vi/channels/access-groups), [Tác nhân ACP](/vi/tools/acp-agents), [Tác nhân con](/vi/tools/subagents)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phương tiện và nội dung phong phú</span>
          <span>1 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Discord](/vi/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Điều khiển gốc và phê duyệt</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Discord](/vi/channels/discord), [Lệnh dấu gạch chéo](/vi/tools/slash-commands)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thoại và cuộc gọi theo thời gian thực</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">Ổn định</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Discord](/vi/channels/discord), [OpenAI](/vi/providers/openai), [Elevenlabs](/vi/providers/elevenlabs), [Tự động hóa QA E2E](/vi/concepts/qa-e2e-automation), [Cấu hình kênh](/vi/gateway/config-channels)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Telegram - M3 Beta - 5 lĩnh vực">
    <a id="telegram" />

    Kênh cốt lõi đã đủ trưởng thành để sử dụng thường xuyên, nhưng trải nghiệm người dùng có độ biến thiên cao và các trường hợp biên về phương tiện cần được kiểm chứng định kỳ bằng các kịch bản.

    <div className="maturity-surface-rollup"><span>Phạm vi thử nghiệm - 0%</span><span>Chất lượng Alpha - 68%</span><span>Mức độ hoàn thiện Beta - 78%</span><span><span className="maturity-lts maturity-lts-full">Đầy đủ - 5</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập và vận hành kênh</span>
          <span>10 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Telegram](/vi/channels/telegram), [Cấu hình kênh](/vi/gateway/config-channels), [Kênh](/vi/cli/channels)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Truy cập và danh tính</span>
          <span>10 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Telegram](/vi/channels/telegram), [Ghép nối](/vi/channels/pairing), [Nhóm truy cập](/vi/channels/access-groups), [Nhóm](/vi/channels/groups), [Đa tác tử](/vi/concepts/multi-agent)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Định tuyến và phân phối hội thoại</span>
          <span>1 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Telegram](/vi/channels/telegram), [Nhóm](/vi/channels/groups), [Đa tác tử](/vi/concepts/multi-agent)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phương tiện và nội dung phong phú</span>
          <span>1 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Telegram](/vi/channels/telegram), [Vị trí](/vi/channels/location)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Điều khiển gốc và phê duyệt</span>
          <span>9 khả năng / được hỗ trợ LTS</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Telegram](/vi/channels/telegram), [Phê duyệt thực thi](/vi/tools/exec-approvals), [Phản ứng](/vi/tools/reactions)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Slack - M3 Beta - 5 lĩnh vực">
    <a id="slack" />

    Tài liệu kênh hạng nhất và bề mặt định tuyến. Cần bảng điểm cho các kịch bản cài đặt không gian làm việc/quản trị viên.

    <div className="maturity-surface-rollup"><span>Phạm vi Thử nghiệm - 0%</span><span>Chất lượng Alpha - 66%</span><span>Mức độ hoàn thiện Beta - 78%</span><span><span className="maturity-lts maturity-lts-full">Đầy đủ - 5</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập và vận hành kênh</span>
          <span>10 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Slack](/vi/channels/slack), [Slack](/vi/plugins/reference/slack), [Thông tin bí mật](/vi/gateway/secrets), [Tự động hóa QA E2E](/vi/concepts/qa-e2e-automation), [Khắc phục sự cố](/vi/channels/troubleshooting)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Quyền truy cập và danh tính</span>
          <span>1 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Slack](/vi/channels/slack), [Ghép nối](/vi/channels/pairing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Định tuyến và phân phối cuộc trò chuyện</span>
          <span>5 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Slack](/vi/channels/slack), [Bảo vệ khỏi vòng lặp bot](/vi/channels/bot-loop-protection), [Ghép nối](/vi/channels/pairing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phương tiện và nội dung đa dạng</span>
          <span>1 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Slack](/vi/channels/slack), [Tự động hóa QA E2E](/vi/concepts/qa-e2e-automation)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Điều khiển gốc và phê duyệt</span>
          <span>8 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Slack](/vi/channels/slack), [Lệnh dấu gạch chéo](/vi/tools/slash-commands), [Phê duyệt thực thi](/vi/tools/exec-approvals)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="iMessage và BlueBubbles - M3 Beta - 5 lĩnh vực">
    <a id="imessage-and-bluebubbles" />

    iMessage được hỗ trợ chạy qua imsg trên máy chủ macOS Messages đã đăng nhập; các cấu hình BlueBubbles cũ cần được di chuyển. Luôn hiển thị rõ các lưu ý về quyền macOS, trình bao bọc SSH, SIP/API riêng tư và quá trình di chuyển.

    <div className="maturity-surface-rollup"><span>Phạm vi Thử nghiệm - 0%</span><span>Chất lượng Alpha - 66%</span><span>Mức độ hoàn thiện Beta - 78%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập và vận hành kênh</span>
          <span>11 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [BlueBubbles iMessage](/vi/announcements/bluebubbles-imessage), [iMessage từ BlueBubbles](/vi/channels/imessage-from-bluebubbles), [Cấu hình kênh](/vi/gateway/config-channels), [iMessage](/vi/channels/imessage)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Quyền truy cập và danh tính</span>
          <span>6 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iMessage](/vi/channels/imessage), [iMessage từ BlueBubbles](/vi/channels/imessage-from-bluebubbles), [Cấu hình kênh](/vi/gateway/config-channels)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Định tuyến và phân phối cuộc hội thoại</span>
          <span>4 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iMessage](/vi/channels/imessage)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phương tiện và nội dung đa dạng</span>
          <span>7 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iMessage](/vi/channels/imessage), [iMessage từ BlueBubbles](/vi/channels/imessage-from-bluebubbles), [Cấu hình kênh](/vi/gateway/config-channels)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Điều khiển gốc và phê duyệt</span>
          <span>3 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iMessage](/vi/channels/imessage)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="WhatsApp - M3 Beta - 5 lĩnh vực">
    <a id="whatsapp" />

    Luồng cốt lõi rất quan trọng và đã được ghi chép; sự biến động của Baileys/phiên ở thượng nguồn khiến nó vẫn chưa đạt mức Ổn định.

    <div className="maturity-surface-rollup"><span>Phạm vi Thử nghiệm - 0%</span><span>Chất lượng Alpha - 66%</span><span>Mức độ hoàn thiện Beta - 78%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập và vận hành kênh</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [WhatsApp](/vi/channels/whatsapp), [Cấu hình kênh](/vi/gateway/config-channels), [WhatsApp](/vi/plugins/reference/whatsapp), [Tự động hóa QA E2E](/vi/concepts/qa-e2e-automation), [Doctor](/vi/gateway/doctor)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Truy cập và danh tính</span>
          <span>7 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [WhatsApp](/vi/channels/whatsapp), [Cấu hình kênh](/vi/gateway/config-channels), [Tự động hóa QA E2E](/vi/concepts/qa-e2e-automation), [Ghép nối](/vi/channels/pairing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Định tuyến và phân phối cuộc trò chuyện</span>
          <span>4 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [WhatsApp](/vi/channels/whatsapp), [Tin nhắn nhóm](/vi/channels/group-messages)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phương tiện và nội dung đa dạng</span>
          <span>2 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [WhatsApp](/vi/channels/whatsapp)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Điều khiển gốc và phê duyệt</span>
          <span>2 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [WhatsApp](/vi/channels/whatsapp)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Matrix - M2 Alpha - 6 lĩnh vực">
    <a id="matrix" />

    Được hỗ trợ thông qua plugin đi kèm. Cần bảng điểm cho cầu nối, xác thực và vòng đời phòng.

    <div className="maturity-surface-rollup"><span>Phạm vi Thử nghiệm - 0%</span><span>Chất lượng Alpha - 60%</span><span>Mức độ hoàn thiện Alpha - 67%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập và vận hành kênh</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Matrix](/vi/channels/matrix), [Di chuyển Matrix](/vi/channels/matrix-migration)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Quyền truy cập và danh tính</span>
          <span>7 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Matrix](/vi/channels/matrix), [Nhóm](/vi/channels/groups), [Bảo vệ khỏi vòng lặp bot](/vi/channels/bot-loop-protection)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Định tuyến và phân phối cuộc trò chuyện</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Matrix](/vi/channels/matrix)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phương tiện và nội dung phong phú</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Matrix](/vi/channels/matrix)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Điều khiển gốc và phê duyệt</span>
          <span>6 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Matrix](/vi/channels/matrix)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Mã hóa và xác minh</span>
          <span>3 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Matrix](/vi/channels/matrix), [Di chuyển Matrix](/vi/channels/matrix-migration)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Google Chat - M2 Alpha - 5 lĩnh vực">
    <a id="google-chat" />

    Kênh đã được lập tài liệu, nhưng việc thiết lập dành cho doanh nghiệp/quản trị viên làm tăng rủi ro về mức độ trưởng thành.

    <div className="maturity-surface-rollup"><span>Độ bao phủ Thử nghiệm - 0%</span><span>Chất lượng Alpha - 59%</span><span>Mức độ hoàn thiện Alpha - 66%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập và vận hành kênh</span>
          <span>16 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google Chat](/vi/channels/googlechat), [Google Chat](/vi/plugins/reference/googlechat), [Cấu hình kênh](/vi/gateway/config-channels), [Tham chiếu CLI của trình hướng dẫn](/vi/start/wizard-cli-reference), [Bí mật](/vi/gateway/secrets), [Bề mặt thông tin xác thực Secretref](/vi/reference/secretref-credential-surface), [Tình trạng](/vi/gateway/health), [Danh mục Plugin](/vi/plugins/plugin-inventory), [Mục lục](/vi/channels/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Quyền truy cập và danh tính</span>
          <span>11 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google Chat](/vi/channels/googlechat), [Ghép đôi](/vi/channels/pairing), [Nhóm truy cập](/vi/channels/access-groups), [Cấu hình kênh](/vi/gateway/config-channels), [Bảo vệ khỏi vòng lặp bot](/vi/channels/bot-loop-protection), [Định tuyến kênh](/vi/channels/channel-routing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Định tuyến và phân phối cuộc hội thoại</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google Chat](/vi/channels/googlechat), [Bảo vệ khỏi vòng lặp bot](/vi/channels/bot-loop-protection), [Nhóm truy cập](/vi/channels/access-groups), [Định tuyến kênh](/vi/channels/channel-routing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Nội dung đa phương tiện và phong phú</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google Chat](/vi/channels/googlechat), [Tin nhắn](/vi/cli/message), [Hiểu nội dung đa phương tiện](/vi/nodes/media-understanding), [Bề mặt thông tin xác thực Secretref](/vi/reference/secretref-credential-surface)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Điều khiển gốc và phê duyệt</span>
          <span>16 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google Chat](/vi/channels/googlechat), [Tin nhắn](/vi/cli/message), [Hiểu nội dung đa phương tiện](/vi/nodes/media-understanding), [Bề mặt thông tin xác thực Secretref](/vi/reference/secretref-credential-surface), [Phản ứng](/vi/tools/reactions), [Lệnh gạch chéo](/vi/tools/slash-commands), [Cấu hình tác nhân](/vi/gateway/config-agents), [Tái cấu trúc vòng đời tin nhắn](/vi/concepts/message-lifecycle-refactor)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Microsoft Teams - M2 Alpha - 5 lĩnh vực">
    <a id="microsoft-teams" />

    Các luồng xác thực/quản trị doanh nghiệp cần có bằng chứng kịch bản rõ ràng.

    <div className="maturity-surface-rollup"><span>Phạm vi thử nghiệm - 0%</span><span>Chất lượng Alpha - 59%</span><span>Mức độ hoàn thiện Alpha - 66%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập và vận hành kênh</span>
          <span>9 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Microsoft Teams](/vi/channels/msteams), [Microsoft Teams](/vi/plugins/reference/msteams), [Cấu hình kênh](/vi/gateway/config-channels), [Tình trạng](/vi/gateway/health)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Truy cập và danh tính</span>
          <span>9 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Microsoft Teams](/vi/channels/msteams), [Ghép nối](/vi/channels/pairing), [Nhóm truy cập](/vi/channels/access-groups)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Định tuyến và phân phối cuộc trò chuyện</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Microsoft Teams](/vi/channels/msteams), [Nhóm](/vi/channels/groups), [Định tuyến kênh](/vi/channels/channel-routing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phương tiện và nội dung đa dạng</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Microsoft Teams](/vi/channels/msteams)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Điều khiển gốc và phê duyệt</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Microsoft Teams](/vi/channels/msteams), [Phê duyệt thực thi nâng cao](/vi/tools/exec-approvals-advanced)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Signal - M2 Alpha - 5 lĩnh vực">
    <a id="signal" />

    Đã có tài liệu về kênh được hỗ trợ; cần bằng chứng chắc chắn hơn về việc cài đặt và kết nối lại.

    <div className="maturity-surface-rollup"><span>Phạm vi Thử nghiệm - 0%</span><span>Chất lượng Alpha - 59%</span><span>Mức độ hoàn thiện Alpha - 66%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập và vận hành kênh</span>
          <span>7 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Signal](/vi/channels/signal), [Signal](/vi/plugins/reference/signal)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Quyền truy cập và danh tính</span>
          <span>6 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Signal](/vi/channels/signal)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Định tuyến và phân phối cuộc trò chuyện</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Signal](/vi/channels/signal)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phương tiện và nội dung phong phú</span>
          <span>7 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Signal](/vi/channels/signal)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Điều khiển gốc và phê duyệt</span>
          <span>3 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Signal](/vi/channels/signal)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, các kênh khu vực - M2 Alpha - 4 lĩnh vực">
    <a id="feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels" />

    Có mức độ bao phủ khu vực đáng kể, nhưng mức hỗ trợ công khai cần được điều chỉnh theo từng loại tài khoản, sự phê duyệt từ phía thượng nguồn và bằng chứng của người bảo trì.

    <div className="maturity-surface-rollup"><span>Mức độ bao phủ Thử nghiệm - 0%</span><span>Chất lượng Alpha - 55%</span><span>Mức độ hoàn thiện Alpha - 58%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Mức độ bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập và vận hành kênh</span>
          <span>6 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Chỉ mục](/vi/channels/index), [Ghép nối](/vi/channels/pairing), [Feishu](/vi/plugins/reference/feishu), [Kiến trúc nội bộ](/vi/plugins/architecture-internals)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Quyền truy cập và danh tính</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">

    Không có tài liệu liên kết

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Định tuyến và phân phối cuộc hội thoại</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">

    Không có tài liệu liên kết

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phương tiện và nội dung đa dạng</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">

    Không có tài liệu được liên kết

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat - M2 Alpha - 4 lĩnh vực">
    <a id="mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat" />

    Các bề mặt được hỗ trợ đã tồn tại, nhưng mức độ trưởng thành có thể khác nhau tùy theo phạm vi hỗ trợ của dự án nguồn và bên bảo trì. Sẽ đánh giá riêng từng bề mặt sau.

    <div className="maturity-surface-rollup"><span>Phạm vi Thử nghiệm - 0%</span><span>Chất lượng Alpha - 53%</span><span>Mức độ hoàn thiện Alpha - 54%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập và vận hành kênh</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">

    Không có tài liệu được liên kết

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Quyền truy cập và danh tính</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">

    Không có tài liệu được liên kết

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Định tuyến và phân phối cuộc trò chuyện</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">

    Không có tài liệu được liên kết

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phương tiện và nội dung đa dạng</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">

    Không có tài liệu được liên kết

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Kênh cuộc gọi thoại - M1 Thử nghiệm - 5 lĩnh vực">
    <a id="voice-call-channel" />

    Lộ trình tùy chọn/Plugin có hành vi thời gian thực phức tạp. Cần bảng điểm theo kịch bản trước khi phát hành beta công khai.

    <div className="maturity-surface-rollup"><span>Phạm vi Thử nghiệm - 0%</span><span>Chất lượng Thử nghiệm - 41%</span><span>Mức độ hoàn thiện Thử nghiệm - 44%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập và vận hành kênh</span>
          <span>2 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Cuộc gọi thoại](/vi/cli/voicecall), [Cuộc gọi thoại](/vi/plugins/voice-call), [Giao thức](/vi/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Quyền truy cập và danh tính</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Cuộc gọi thoại](/vi/plugins/voice-call), [Cuộc gọi thoại](/vi/cli/voicecall)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Định tuyến và phân phối cuộc hội thoại</span>
          <span>1 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Cuộc gọi thoại](/vi/plugins/voice-call)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phương tiện và nội dung đa phương tiện</span>
          <span>2 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Cuộc gọi thoại](/vi/plugins/voice-call), [Danh mục Plugin](/vi/plugins/plugin-inventory)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thoại và cuộc gọi theo thời gian thực</span>
          <span>2 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Cuộc gọi thoại](/vi/plugins/voice-call)

    </div>
      </div>
    </div>

  </Accordion>

</AccordionGroup>

### Nhà cung cấp và công cụ

<AccordionGroup>
  <Accordion title="Công cụ tự động hóa trình duyệt, thực thi và sandbox - M3 Beta - 3 lĩnh vực">
    <a id="browser-automation-exec-and-sandbox-tools" />

    Các công cụ cốt lõi đã được ghi lại trong tài liệu, nhưng trải nghiệm người dùng về bảo mật và quyền trên máy chủ cần tiếp tục được chủ động xem xét trong bảng điểm.

    <div className="maturity-surface-rollup"><span>Phạm vi Thử nghiệm - 21%</span><span>Chất lượng Beta - 75%</span><span>Mức độ hoàn thiện Beta - 79%</span><span><span className="maturity-lts maturity-lts-partial">Một phần - 2</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Tự động hóa trình duyệt</span>
          <span>8 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Điều khiển trình duyệt](/vi/tools/browser-control), [Kiểm thử](/vi/help/testing), [Trình duyệt](/vi/tools/browser), [Chỉ mục](/vi/gateway/security/index), [Kiểm tra kiểm toán](/vi/gateway/security/audit-checks)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Gọi và thực thi công cụ</span>
          <span>6 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>50%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "50%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Thực thi](/vi/tools/exec), [Tiến trình nền](/vi/gateway/background-process), [API HTTP gọi công cụ](/vi/gateway/tools-invoke-http-api), [Phạm vi của toán tử](/vi/gateway/operator-scopes), [Giao thức](/vi/gateway/protocol), [Phê duyệt thực thi](/vi/tools/exec-approvals), [Phê duyệt thực thi nâng cao](/vi/tools/exec-approvals-advanced), [Đặc quyền nâng cao](/vi/tools/elevated)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Chính sách sandbox và công cụ</span>
          <span>6 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Cơ chế sandbox](/vi/gateway/sandboxing), [Sandbox so với chính sách công cụ và đặc quyền nâng cao](/vi/gateway/sandbox-vs-tool-policy-vs-elevated), [Công cụ sandbox đa tác nhân](/vi/tools/multi-agent-sandbox-tools), [Tài liệu tham chiếu bộ điều phối Codex](/vi/plugins/codex-harness-reference), [Công cụ cấu hình](/vi/gateway/config-tools)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Lộ trình nhà cung cấp OpenAI và Codex - M3 Beta - 5 lĩnh vực">
    <a id="openai-and-codex-provider-path" />

    Tài liệu chuyên sâu, lộ trình OAuth/gói đăng ký, thoại thời gian thực, hình ảnh và hành vi tương thích. Những thay đổi liên tục của nhà cung cấp khiến lộ trình này chưa thể đạt mức Ổn định nếu không có bằng chứng từ bảng điểm phát hành.

    <div className="maturity-surface-rollup"><span>Phạm vi Thử nghiệm - 26%</span><span>Chất lượng Beta - 74%</span><span>Mức độ hoàn thiện Beta - 79%</span><span><span className="maturity-lts maturity-lts-partial">Một phần - 3</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Mô hình và xác thực</span>
          <span>6 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenAI](/vi/providers/openai), [Bộ điều phối Codex](/vi/plugins/codex-harness), [Mô hình](/vi/concepts/models), [OAuth](/vi/concepts/oauth), [Tài liệu tham chiếu bộ điều phối Codex](/vi/plugins/codex-harness-reference), [Giám sát xác thực](/vi/gateway/authentication)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Khả năng tương thích của phản hồi và công cụ</span>
          <span>4 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>40%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "40%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenAI](/vi/providers/openai), [API HTTP OpenResponses](/vi/gateway/openresponses-http-api), [API HTTP OpenAI](/vi/gateway/openai-http-api), [Plugin gốc Codex](/vi/plugins/codex-native-plugins)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Bộ điều phối Codex gốc</span>
          <span>2 khả năng / được LTS hỗ trợ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Bộ điều phối Codex](/vi/plugins/codex-harness), [Môi trường chạy bộ điều phối Codex](/vi/plugins/codex-harness-runtime), [Tài liệu tham khảo bộ điều phối Codex](/vi/plugins/codex-harness-reference), [Plugin Codex gốc](/vi/plugins/codex-native-plugins)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Đầu vào hình ảnh và đa phương thức</span>
          <span>2 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenAI](/vi/providers/openai), [Tạo hình ảnh](/vi/tools/image-generation), [Hình ảnh](/vi/nodes/images)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Giọng nói và âm thanh thời gian thực</span>
          <span>2 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenAI](/vi/providers/openai), [Discord](/vi/channels/discord), [Cuộc gọi thoại](/vi/plugins/voice-call)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Công cụ tìm kiếm web - M3 Beta - 4 lĩnh vực">
    <a id="web-search-tools" />

    Có nhiều nhà cung cấp và tài liệu. Cần bằng chứng về hạn mức/lỗi/SSRF cho từng nhóm nhà cung cấp.

    <div className="maturity-surface-rollup"><span>Độ bao phủ Thử nghiệm - 9%</span><span>Chất lượng Beta - 74%</span><span>Độ hoàn thiện Beta - 79%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Nhà cung cấp dịch vụ tìm kiếm</span>
          <span>19 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>11%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "11%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Web](/vi/tools/web), [Tìm kiếm Brave](/vi/tools/brave-search), [Tavily](/vi/tools/tavily), [Tìm kiếm Exa](/vi/tools/exa-search), [Firecrawl](/vi/tools/firecrawl), [Tìm kiếm Perplexity](/vi/tools/perplexity-search), [Tìm kiếm Duckduckgo](/vi/tools/duckduckgo-search), [Tìm kiếm Searxng](/vi/tools/searxng-search), [Tìm kiếm Gemini](/vi/tools/gemini-search), [Tìm kiếm Grok](/vi/tools/grok-search), [Tìm kiếm Kimi](/vi/tools/kimi-search), [Tìm kiếm Minimax](/vi/tools/minimax-search), [Tìm kiếm Ollama](/vi/tools/ollama-search), [Đường dẫn con SDK](/vi/plugins/sdk-subpaths), [Tổng quan SDK](/vi/plugins/sdk-overview), [Tệp kê khai](/vi/plugins/manifest)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập và chẩn đoán</span>
          <span>9 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Web](/vi/tools/web), [Truy xuất web](/vi/tools/web-fetch), [Câu hỏi thường gặp](/vi/help/faq), [Chi phí sử dụng API](/vi/reference/api-usage-costs), [Tìm kiếm Brave](/vi/tools/brave-search), [Tìm kiếm Perplexity](/vi/tools/perplexity-search), [Tavily](/vi/tools/tavily), [Firecrawl](/vi/tools/firecrawl)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">An toàn mạng</span>
          <span>4 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Web](/vi/tools/web), [Truy xuất web](/vi/tools/web-fetch), [Firecrawl](/vi/tools/firecrawl), [Tìm kiếm Searxng](/vi/tools/searxng-search)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Tính khả dụng của công cụ và truy xuất</span>
          <span>11 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>25%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "25%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Công cụ cấu hình](/vi/gateway/config-tools), [Truy xuất web](/vi/tools/web-fetch), [Web](/vi/tools/web), [Câu hỏi thường gặp](/vi/help/faq)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Đường dẫn nhà cung cấp Anthropic - M3 Beta - 5 lĩnh vực">
    <a id="anthropic-provider-path" />

    Nhà cung cấp mô hình hạng nhất. Cần bằng chứng định kỳ cho các kịch bản xác thực/danh mục/gọi công cụ.

    <div className="maturity-surface-rollup"><span>Độ bao phủ Thử nghiệm - 0%</span><span>Chất lượng Beta - 71%</span><span>Độ hoàn thiện Beta - 78%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Xác thực và khôi phục nhà cung cấp</span>
          <span>9 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Anthropic](/vi/providers/anthropic), [Doctor](/vi/gateway/doctor), [Ví dụ cấu hình](/vi/gateway/configuration-examples), [Khắc phục sự cố](/vi/gateway/troubleshooting), [Bộ nhớ đệm prompt](/vi/reference/prompt-caching)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Lựa chọn mô hình và runtime</span>
          <span>10 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Anthropic](/vi/providers/anthropic), [Cấu hình tác nhân](/vi/gateway/config-agents), [Mô hình](/vi/concepts/models), [Backend CLI](/vi/gateway/cli-backends)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Truyền tải yêu cầu và ngữ nghĩa lượt tương tác</span>
          <span>10 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Anthropic](/vi/providers/anthropic), [Bộ nhớ đệm prompt](/vi/reference/prompt-caching), [Khắc phục sự cố](/vi/gateway/troubleshooting), [Backend CLI](/vi/gateway/cli-backends), [Nhà cung cấp mô hình](/vi/concepts/model-providers)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Bộ nhớ đệm prompt và ngữ cảnh</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Anthropic](/vi/providers/anthropic), [Bộ nhớ đệm prompt](/vi/reference/prompt-caching), [Khắc phục sự cố](/vi/gateway/troubleshooting), [Heartbeat](/vi/gateway/heartbeat)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Đầu vào đa phương tiện</span>
          <span>4 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Anthropic](/vi/providers/anthropic), [Cấu hình tác nhân](/vi/gateway/config-agents)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Lộ trình nhà cung cấp Google - M3 Beta - 5 lĩnh vực">
    <a id="google-provider-path" />

    Nhà cung cấp hạng nhất với các bề mặt mô hình và thời gian thực. Cần chấm điểm riêng cho Live/Talk.

    <div className="maturity-surface-rollup"><span>Phạm vi Thử nghiệm - 0%</span><span>Chất lượng Alpha - 66%</span><span>Mức độ hoàn thiện Beta - 78%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập nhà cung cấp và thông tin xác thực</span>
          <span>10 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google](/vi/providers/google), [Nhà cung cấp mô hình](/vi/concepts/model-providers)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Định tuyến mô hình và điểm cuối</span>
          <span>10 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google](/vi/providers/google), [Nhà cung cấp mô hình](/vi/concepts/model-providers), [Google](/vi/plugins/reference/google), [Tìm kiếm Gemini](/vi/tools/gemini-search)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Môi trường thực thi Gemini trực tiếp</span>
          <span>9 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google](/vi/providers/google), [Nhà cung cấp mô hình](/vi/concepts/model-providers), [Câu hỏi thường gặp về mô hình](/vi/help/faq-models), [Kiểm thử trực tiếp](/vi/help/testing-live)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Phương tiện, tìm kiếm và thời gian thực</span>
          <span>10 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google](/vi/plugins/reference/google), [Google](/vi/providers/google)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Bộ nhớ đệm prompt</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Bộ nhớ đệm prompt](/vi/reference/prompt-caching), [Google](/vi/providers/google), [Nhà cung cấp mô hình](/vi/concepts/model-providers), [Mức sử dụng token](/vi/reference/token-use)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Lộ trình nhà cung cấp OpenRouter - M3 Beta - 4 lĩnh vực">
    <a id="openrouter-provider-path" />

    Lộ trình nhà cung cấp hợp nhất đã được ghi lại trong tài liệu và mang lại giá trị, nhưng hành vi dành riêng cho từng mô hình có sự khác biệt.

    <div className="maturity-surface-rollup"><span>Phạm vi Thử nghiệm - 0%</span><span>Chất lượng Alpha - 66%</span><span>Mức độ hoàn thiện Beta - 78%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập và xác thực nhà cung cấp</span>
          <span>14 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Openrouter](/vi/providers/openrouter), [Nhà cung cấp mô hình](/vi/concepts/model-providers), [Cấu hình](/vi/cli/configure), [Xác thực](/vi/gateway/authentication), [Môi trường](/vi/help/environment), [Mô hình](/vi/cli/models), [Mô hình](/vi/concepts/models)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Môi trường chạy trò chuyện và chuẩn hóa</span>
          <span>15 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Openrouter](/vi/providers/openrouter), [Nhà cung cấp mô hình](/vi/concepts/model-providers), [Bộ nhớ đệm prompt](/vi/reference/prompt-caching)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Khôi phục và chẩn đoán nhà cung cấp</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover), [Openrouter](/vi/providers/openrouter), [Mô hình](/vi/cli/models)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Tạo nội dung đa phương tiện và giọng nói</span>
          <span>7 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">Beta</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Openrouter](/vi/providers/openrouter), [Tạo hình ảnh](/vi/tools/image-generation), [Tạo nhạc](/vi/tools/music-generation), [Tổng quan về nội dung đa phương tiện](/vi/tools/media-overview), [Tạo video](/vi/tools/video-generation), [Chuyển văn bản thành giọng nói](/vi/tools/tts)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Công cụ tạo hình ảnh, video và âm nhạc - M2 Alpha - 5 lĩnh vực">
    <a id="image-video-and-music-generation-tools" />

    Khả năng này có sẵn trên nhiều nhà cung cấp, nhưng chất lượng, độ trễ và khả năng tương thích tham số khác biệt quá nhiều để đạt mức beta nếu không có bằng chứng cho từng nhà cung cấp.

    <div className="maturity-surface-rollup"><span>Phạm vi Thử nghiệm - 0%</span><span>Chất lượng Alpha - 61%</span><span>Mức độ hoàn thiện Alpha - 68%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Định tuyến và khám phá nội dung đa phương tiện</span>
          <span>4 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Cấu hình tác nhân](/vi/gateway/config-agents), [Tạo hình ảnh](/vi/tools/image-generation), [Tạo video](/vi/tools/video-generation), [Tạo nhạc](/vi/tools/music-generation)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Vòng đời và phân phối tác vụ</span>
          <span>12 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Tổng quan về phương tiện](/vi/tools/media-overview), [Tạo hình ảnh](/vi/tools/image-generation), [Tạo video](/vi/tools/video-generation), [Tạo nhạc](/vi/tools/music-generation)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Tạo hình ảnh</span>
          <span>9 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Tạo hình ảnh](/vi/tools/image-generation), [Suy luận](/vi/cli/infer), [Tổng quan về phương tiện](/vi/tools/media-overview)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Tạo video</span>
          <span>11 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Tạo video](/vi/tools/video-generation), [Runway](/vi/providers/runway), [Pixverse](/vi/providers/pixverse), [Fal](/vi/providers/fal), [Openrouter](/vi/providers/openrouter)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Tạo nhạc</span>
          <span>6 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Tạo nhạc](/vi/tools/music-generation)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Nhà cung cấp mô hình cục bộ: Ollama, vLLM, SGLang, LM Studio - M2 Alpha - 5 lĩnh vực">
    <a id="local-model-providers-ollama-vllm-sglang-lm-studio" />

    Hữu ích và có tài liệu hướng dẫn, nhưng mức độ khác biệt giữa các môi trường còn cao.

    <div className="maturity-surface-rollup"><span>Phạm vi Thử nghiệm - 0%</span><span>Chất lượng Alpha - 61%</span><span>Mức độ hoàn thiện Alpha - 68%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Phạm vi</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Thiết lập, vòng đời và chẩn đoán nhà cung cấp</span>
          <span>12 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Mô hình cục bộ](/vi/gateway/local-models), [Lmstudio](/vi/providers/lmstudio), [Ollama](/vi/providers/ollama), [Vllm](/vi/providers/vllm), [Dịch vụ mô hình cục bộ](/vi/gateway/local-model-services), [Cấu hình tác nhân](/vi/gateway/config-agents), [Khắc phục sự cố](/vi/gateway/troubleshooting), [Doctor](/vi/gateway/doctor)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugin nhà cung cấp gốc</span>
          <span>10 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ollama](/vi/providers/ollama), [Lmstudio](/vi/providers/lmstudio)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Khả năng tương thích với runtime tương thích OpenAI</span>
          <span>8 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Vllm](/vi/providers/vllm), [Sglang](/vi/providers/sglang), [Mô hình cục bộ](/vi/gateway/local-models), [Lmstudio](/vi/providers/lmstudio)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Bộ nhớ cục bộ và embedding</span>
          <span>5 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Bộ nhớ](/vi/concepts/memory), [Doctor](/vi/gateway/doctor)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">An toàn mạng và kiểm soát prompt</span>
          <span>2 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Tổng quan](/vi/gateway/security/index), [Công cụ cấu hình](/vi/gateway/config-tools), [Mô hình cục bộ](/vi/gateway/local-models)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Các nhà cung cấp lưu trữ ít phổ biến - M2 Alpha - 3 lĩnh vực">
    <a id="long-tail-hosted-providers" />

    Có nhiều trang tài liệu/tham khảo; điểm số nên được tạo từ siêu dữ liệu của nhà cung cấp kết hợp với mức độ bao phủ kiểm thử khói trực tiếp.

    <div className="maturity-surface-rollup"><span>Độ bao phủ Thử nghiệm - 0%</span><span>Chất lượng Alpha - 61%</span><span>Mức độ hoàn thiện Alpha - 68%</span><span><span className="maturity-lts maturity-lts-none">Không có</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>Lĩnh vực</span><span>Độ bao phủ</span><span>Chất lượng</span><span>Mức độ hoàn thiện</span><span>Tài liệu</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Nhà cung cấp LLM được lưu trữ</span>
          <span>12 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Tổng quan](/vi/providers/index), [Nhà cung cấp mô hình](/vi/concepts/model-providers), [Kiểm thử trực tiếp](/vi/help/testing-live), [Thiết lập ban đầu](/vi/cli/onboard)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Nhà cung cấp phương tiện được lưu trữ</span>
          <span>8 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Tệp kê khai](/vi/plugins/manifest), [Kiểm thử trực tiếp](/vi/help/testing-live), [Tổng quan](/vi/providers/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Vận hành nhà cung cấp</span>
          <span>12 khả năng</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">Thử nghiệm</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">Alpha</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Tổng quan](/vi/providers/index), [Nhà cung cấp mô hình](/vi/concepts/model-providers), [Tệp kê khai](/vi/plugins/manifest), [Kiểm thử trực tiếp](/vi/help/testing-live), [Mô hình](/vi/cli/models)

    </div>
      </div>
    </div>

  </Accordion>

</AccordionGroup>
