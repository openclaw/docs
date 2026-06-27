---
description: Real-world OpenClaw projects from the community
read_when:
    - Tìm các ví dụ sử dụng OpenClaw thực tế
    - Cập nhật các điểm nổi bật của dự án cộng đồng
summary: Các dự án và tích hợp do cộng đồng xây dựng, vận hành bằng OpenClaw
title: Trưng bày
x-i18n:
    generated_at: "2026-06-27T18:12:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 999f89403c1d022e795c0017e5aa7543a4a021ba98cf601b37ce2835136a86a1
    source_path: start/showcase.md
    workflow: 16
---

Các dự án OpenClaw không phải là bản demo đồ chơi. Mọi người đang triển khai các vòng lặp đánh giá PR, ứng dụng di động, tự động hóa nhà ở, hệ thống giọng nói, devtools và các quy trình làm việc nặng về bộ nhớ từ những kênh họ đã dùng — các bản dựng gốc trong chat trên Telegram, WhatsApp, Discord và terminal; tự động hóa thực tế cho đặt lịch, mua sắm và hỗ trợ mà không phải chờ API; cùng các tích hợp với thế giới vật lý như máy in, robot hút bụi, camera và hệ thống nhà ở.

<Info>
**Muốn được giới thiệu?** Chia sẻ dự án của bạn trong [#self-promotion trên Discord](https://discord.gg/clawd) hoặc [gắn thẻ @openclaw trên X](https://x.com/openclaw).
</Info>

## Mới từ Discord

Những điểm nổi bật gần đây trên các mảng lập trình, devtools, di động và xây dựng sản phẩm gốc trong chat.

<CardGroup cols={2}>

<Card title="Phản hồi đánh giá PR qua Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode hoàn tất thay đổi, mở một PR, OpenClaw đánh giá diff và trả lời trong Telegram bằng các đề xuất cùng một kết luận hợp nhất rõ ràng.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Phản hồi đánh giá PR của OpenClaw được gửi trong Telegram" />
</Card>

<Card title="Skill hầm rượu trong vài phút" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Yêu cầu "Robby" (@openclaw) tạo một skill hầm rượu cục bộ. Nó yêu cầu một bản xuất CSV mẫu và đường dẫn lưu trữ, rồi xây dựng và kiểm thử skill (962 chai trong ví dụ).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw xây dựng một skill hầm rượu cục bộ từ CSV" />
</Card>

<Card title="Tự động mua sắm Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Lên kế hoạch bữa ăn hằng tuần, các món thường mua, đặt khung giờ giao hàng, xác nhận đơn hàng. Không API, chỉ điều khiển trình duyệt.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tự động hóa mua sắm Tesco qua chat" />
</Card>

<Card title="SNAG ảnh chụp màn hình sang Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Dùng phím tắt chọn một vùng màn hình, Gemini vision, Markdown tức thì trong clipboard của bạn.

  <img src="/assets/showcase/snag.png" alt="Công cụ SNAG chuyển ảnh chụp màn hình sang markdown" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Ứng dụng desktop để quản lý skills và lệnh trên Agents, Claude, Codex và OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Ứng dụng Agents UI" />
</Card>

<Card title="Ghi chú giọng nói Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Bao bọc TTS của papla.media và gửi kết quả dưới dạng ghi chú giọng nói Telegram (không có tự động phát gây khó chịu).

  <img src="/assets/showcase/papla-tts.jpg" alt="Đầu ra ghi chú giọng nói Telegram từ TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Trợ lý được cài bằng Homebrew để liệt kê, kiểm tra và theo dõi các phiên OpenAI Codex cục bộ (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor trên ClawHub" />
</Card>

<Card title="Điều khiển máy in 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Điều khiển và khắc phục sự cố máy in BambuLab: trạng thái, tác vụ, camera, AMS, hiệu chỉnh và hơn thế nữa.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI trên ClawHub" />
</Card>

<Card title="Giao thông Vienna (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Giờ khởi hành theo thời gian thực, gián đoạn, trạng thái thang máy và định tuyến cho giao thông công cộng của Vienna.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien trên ClawHub" />
</Card>

<Card title="Bữa ăn trường học ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Tự động đặt bữa ăn trường học tại Vương quốc Anh qua ParentPay. Dùng tọa độ chuột để nhấp ô bảng đáng tin cậy.
</Card>

<Card title="Tải lên R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Tải lên Cloudflare R2/S3 và tạo liên kết tải xuống presigned an toàn. Hữu ích cho các phiên bản OpenClaw từ xa.

  <img src="/assets/showcase/r2-upload.png" alt="Skill tải lên R2 trên ClawHub" />
</Card>

<Card title="Ứng dụng iOS qua Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Xây dựng một ứng dụng iOS hoàn chỉnh với bản đồ và ghi âm giọng nói, triển khai lên TestFlight hoàn toàn qua chat Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="Ứng dụng iOS trên TestFlight" />
</Card>

<Card title="Trợ lý sức khỏe Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Trợ lý sức khỏe AI cá nhân tích hợp dữ liệu nhẫn Oura với lịch, cuộc hẹn và lịch tập gym.

  <img src="/assets/showcase/oura-health.png" alt="Trợ lý sức khỏe nhẫn Oura" />
</Card>

<Card title="Dream Team của Kev (hơn 14 agent)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Hơn 14 agent dưới một gateway với bộ điều phối Opus 4.5 ủy quyền cho các worker Codex. Xem [bài viết kỹ thuật](https://github.com/adam91holt/orchestrated-ai-articles) và [Clawdspace](https://github.com/adam91holt/clawdspace) để biết về sandbox cho agent.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI cho Linear tích hợp với các quy trình agentic (Claude Code, OpenClaw). Quản lý issue, dự án và quy trình làm việc từ terminal.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Đọc, gửi và lưu trữ tin nhắn qua Beeper Desktop. Dùng API MCP cục bộ của Beeper để agent có thể quản lý tất cả các cuộc chat của bạn (iMessage, WhatsApp và hơn thế nữa) ở một nơi.
</Card>

</CardGroup>

## Tự động hóa và quy trình làm việc

Lập lịch, điều khiển trình duyệt, vòng lặp hỗ trợ và phía "hãy làm việc này cho tôi" của sản phẩm.

<CardGroup cols={2}>

<Card title="Điều khiển máy lọc không khí Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code đã phát hiện và xác nhận các điều khiển máy lọc, rồi OpenClaw tiếp quản để quản lý chất lượng không khí trong phòng.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Điều khiển máy lọc không khí Winix qua OpenClaw" />
</Card>

<Card title="Ảnh chụp bầu trời đẹp" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Được kích hoạt bởi camera trên mái: yêu cầu OpenClaw chụp một bức ảnh bầu trời bất cứ khi nào trông đẹp. Nó đã thiết kế một skill và chụp ảnh.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Ảnh chụp bầu trời từ camera mái nhà được OpenClaw ghi lại" />
</Card>

<Card title="Cảnh tóm tắt buổi sáng trực quan" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Một prompt được lập lịch tạo một hình ảnh cảnh mỗi sáng (thời tiết, tác vụ, ngày tháng, bài đăng hoặc câu trích dẫn yêu thích) qua một persona OpenClaw.
</Card>

<Card title="Đặt sân padel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Trình kiểm tra tình trạng trống của Playtomic cộng với CLI đặt sân. Không bao giờ bỏ lỡ sân trống nữa.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="Ảnh chụp màn hình padel-cli" />
</Card>

<Card title="Tiếp nhận kế toán" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Thu thập PDF từ email, chuẩn bị tài liệu cho chuyên viên tư vấn thuế. Kế toán hằng tháng trên chế độ tự động.
</Card>

<Card title="Chế độ dev trên ghế sofa" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Xây dựng lại toàn bộ trang cá nhân qua Telegram trong khi xem Netflix — từ Notion sang Astro, di chuyển 18 bài viết, DNS sang Cloudflare. Chưa từng mở laptop.
</Card>

<Card title="Agent tìm việc" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Tìm kiếm danh sách việc làm, đối chiếu với từ khóa CV và trả về các cơ hội phù hợp kèm liên kết. Xây dựng trong 30 phút bằng API JSearch.
</Card>

<Card title="Trình tạo skill Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw kết nối với Jira, rồi tạo một skill mới ngay lúc đó (trước khi nó tồn tại trên ClawHub).
</Card>

<Card title="Skill Todoist qua Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Tự động hóa tác vụ Todoist và để OpenClaw tạo skill trực tiếp trong chat Telegram.
</Card>

<Card title="Phân tích TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Đăng nhập vào TradingView qua tự động hóa trình duyệt, chụp ảnh biểu đồ và thực hiện phân tích kỹ thuật theo yêu cầu. Không cần API — chỉ điều khiển trình duyệt.
</Card>

<Card title="Tự động hỗ trợ trên Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Theo dõi một kênh Slack của công ty, phản hồi hữu ích và chuyển tiếp thông báo đến Telegram. Tự động sửa một lỗi production trong ứng dụng đã triển khai mà không cần được yêu cầu.
</Card>

</CardGroup>

## Kiến thức và bộ nhớ

Các hệ thống lập chỉ mục, tìm kiếm, ghi nhớ và suy luận trên kiến thức cá nhân hoặc nhóm.

<CardGroup cols={2}>

<Card title="Học tiếng Trung xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Công cụ học tiếng Trung với phản hồi phát âm và luồng học tập qua OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Phản hồi phát âm xuezh" />
</Card>

<Card title="Kho bộ nhớ WhatsApp" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Nạp toàn bộ bản xuất WhatsApp, phiên âm hơn 1 nghìn ghi chú giọng nói, đối chiếu với nhật ký git, xuất báo cáo markdown có liên kết.
</Card>

<Card title="Tìm kiếm ngữ nghĩa Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Thêm tìm kiếm vector vào dấu trang Karakeep bằng Qdrant cùng embedding OpenAI hoặc Ollama.
</Card>

<Card title="Bộ nhớ Inside-Out-2" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Trình quản lý bộ nhớ riêng biến tệp phiên thành ký ức, rồi niềm tin, rồi một mô hình bản thân đang tiến hóa.
</Card>

</CardGroup>

## Giọng nói và điện thoại

Điểm vào ưu tiên giọng nói, cầu nối điện thoại và các quy trình làm việc nặng về phiên âm.

<CardGroup cols={2}>

<Card title="Cầu nối điện thoại Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Cầu nối từ trợ lý giọng nói Vapi sang OpenClaw HTTP. Cuộc gọi điện thoại gần thời gian thực với agent của bạn.
</Card>

<Card title="Phiên âm OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Phiên âm âm thanh đa ngôn ngữ qua OpenRouter (Gemini và hơn thế nữa). Có sẵn trên ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="Skill phiên âm OpenRouter trên ClawHub" />
</Card>

</CardGroup>

## Hạ tầng và triển khai

Đóng gói, triển khai và các tích hợp giúp OpenClaw dễ chạy và mở rộng hơn.

<CardGroup cols={2}>

<Card title="Add-on Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

OpenClaw gateway chạy trên Home Assistant OS với hỗ trợ đường hầm SSH và trạng thái bền vững.
</Card>

<Card title="Skills Home Assistant" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Điều khiển và tự động hóa thiết bị Home Assistant bằng ngôn ngữ tự nhiên.

  <img src="/assets/showcase/homeassistant.png" alt="Skills Home Assistant trên ClawHub" />
</Card>

<Card title="Đóng gói Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Cấu hình OpenClaw đã nix hóa, đầy đủ sẵn dùng cho các triển khai có thể tái lập.
</Card>

<Card title="Lịch CalDAV" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Skills lịch sử dụng khal và vdirsyncer. Tích hợp lịch tự lưu trữ.

  <img src="/assets/showcase/caldav-calendar.png" alt="Skills lịch CalDAV trên ClawHub" />
</Card>

</CardGroup>

## Nhà và phần cứng

Phần thế giới vật lý của OpenClaw: nhà ở, cảm biến, camera, máy hút bụi và các thiết bị khác.

<CardGroup cols={2}>

<Card title="Tự động hóa GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Tự động hóa nhà ở gốc Nix với OpenClaw làm giao diện, cùng các bảng điều khiển Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="Bảng điều khiển GoHome Grafana" />
</Card>

<Card title="Máy hút bụi Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Điều khiển máy hút bụi robot Roborock của bạn thông qua hội thoại tự nhiên.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Trạng thái Roborock" />
</Card>

</CardGroup>

## Dự án cộng đồng

Những thứ đã phát triển vượt ra ngoài một quy trình làm việc đơn lẻ để trở thành các sản phẩm hoặc hệ sinh thái rộng hơn.

<CardGroup cols={2}>

<Card title="Chợ StarSwap" icon="star" href="https://star-swap.com/">
  **Cộng đồng** • `marketplace` `astronomy` `webapp`

Chợ thiết bị thiên văn đầy đủ. Được xây dựng bằng và xoay quanh hệ sinh thái OpenClaw.
</Card>

</CardGroup>

## Gửi dự án của bạn

<Steps>
  <Step title="Chia sẻ">
    Đăng trong [#self-promotion trên Discord](https://discord.gg/clawd) hoặc [tweet @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Bao gồm chi tiết">
    Hãy cho chúng tôi biết nó làm gì, liên kết đến repo hoặc bản demo, và chia sẻ ảnh chụp màn hình nếu bạn có.
  </Step>
  <Step title="Được giới thiệu">
    Chúng tôi sẽ thêm các dự án nổi bật vào trang này.
  </Step>
</Steps>

## Liên quan

- [Bắt đầu](/vi/start/getting-started)
- [OpenClaw](/vi/start/openclaw)
