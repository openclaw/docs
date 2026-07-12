---
description: Real-world OpenClaw projects from the community
read_when:
    - Tìm kiếm các ví dụ sử dụng OpenClaw thực tế
    - Cập nhật các dự án cộng đồng nổi bật
summary: Các dự án và tích hợp do cộng đồng xây dựng, được hỗ trợ bởi OpenClaw
title: Trưng bày
x-i18n:
    generated_at: "2026-07-12T08:27:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64af6f1da52ebdccff82fe2cdb0f7a5f0cd57627b08ee796369e2933f47fbae4
    source_path: start/showcase.md
    workflow: 16
---

Các dự án OpenClaw do cộng đồng xây dựng: vòng lặp đánh giá PR, ứng dụng di động, tự động hóa gia đình, hệ thống giọng nói, công cụ phát triển và quy trình làm việc với bộ nhớ, được xây dựng theo hướng ưu tiên trò chuyện trên Telegram, WhatsApp, Discord và terminal.

<Info>
**Bạn muốn được giới thiệu?** Hãy chia sẻ dự án của bạn trong [#self-promotion trên Discord](https://discord.gg/clawd) hoặc [gắn thẻ @openclaw trên X](https://x.com/openclaw).
</Info>

## Mới từ Discord

Những dự án nổi bật gần đây trong lĩnh vực lập trình, công cụ phát triển, di động và xây dựng sản phẩm ưu tiên trò chuyện.

<CardGroup cols={2}>

<Card title="Dropage instant HTML deploy" icon="cloud-arrow-up" href="https://clawhub.ai/jiantoucn/skills/dropage-deploy">
  **@jiantoucn** • `deploy` `hosting` `skill`

Yêu cầu agent của bạn "triển khai HTML này" và nhận lại một URL công khai sau khoảng một giây. Các trang tự hết hạn sau một giờ — không cần máy chủ, không cần cấu hình, không cần đăng ký.
</Card>

<Card title="Anti-scam URL checker" icon="shield-halved" href="https://clawhub.ai/phishguard-niki/anti-scam-guard">
  **@phishguard-niki** • `security` `phishing` `skill`

Dán bất kỳ URL nào để nhận kết luận. Hơn 2,5 triệu miền lừa đảo từ 38 nguồn dữ liệu (PhishTank, OpenPhish, CERT.PL và nhiều nguồn khác), được đối chiếu cục bộ để lịch sử duyệt web không bao giờ rời khỏi máy.
</Card>

<Card title="Product-design reasoning skills" icon="pen-ruler" href="https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog">
  **@monikazapisekstudio** • `product` `reasoning` `skills`

Bộ ba dành cho công việc sản phẩm: [Đối thoại Socrates](https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog) chất vấn kỹ một câu hỏi trước khi trả lời, [Nhà chiến lược mô hình Kano](https://clawhub.ai/monikazapisekstudio/skills/kano-model-strategist) phân loại các tính năng để xác định tính năng nào xứng đáng được giữ lại, còn [Đầu ra agent dễ đọc](https://clawhub.ai/monikazapisekstudio/skills/legible-agent-output) viết lại đầu ra của agent bằng ngôn ngữ đơn giản.
</Card>

<Card title="Mailbox broker for sub-agents" icon="inbox" href="https://clawhub.ai/albzhu/skills/miab-broker">
  **@albzhu** • `multi-agent` `async` `skill`

Giúp bộ điều phối không phải chờ trong khi các agent con làm việc: một cơ chế gọi lại bất đồng bộ, trong đó kết quả được chuyển vào hộp thư thay vì chặn agent mẹ.
</Card>

<Card title="lite-mode for low-RAM machines" icon="feather" href="https://clawhub.ai/skills/lite-mode">
  **@mirajmahmudul** • `performance` `skill`

Giúp OpenClaw vẫn sử dụng được trên máy có 2–4 GB RAM: kiểm tra bộ nhớ trống và tinh giản các tính năng nặng trước khi máy bắt đầu sử dụng bộ nhớ hoán đổi. [Mã nguồn trên GitHub](https://github.com/mirajmahmudul/openclaw-lite-mode).
</Card>

<Card title="tokenomics cost tracker" icon="coins" href="https://github.com/ncz-os/tokenomics">
  **@ncz-os** • `devtools` `costs` `tokens`

Công cụ theo dõi chi phí token do một kỹ sư NVIDIA xây dựng, hỗ trợ OpenClaw như nền tảng hạng nhất: xem chính xác chi phí agent của bạn được phân bổ vào đâu, theo từng mô hình và từng phiên.
</Card>

<Card title="Excalidraw diagram generator" icon="shapes" href="https://x.com/swiftlysingh/status/2009684853827281070">
  **@swiftlysingh** • `diagrams` `excalidraw` `devtools`

Mô tả một sơ đồ trong cuộc trò chuyện và nhận lại bản phác thảo Excalidraw được tạo bằng chương trình.
</Card>

<Card title="GA4 analytics skill" icon="chart-column" href="https://x.com/jdrhyne/status/2012028725710192741">
  **@jdrhyne** • `analytics` `ga4` `skill`

Đã để OpenClaw tự xây dựng công cụ truy vấn Google Analytics, sau đó đóng gói và phát hành công cụ đó lên ClawHub.
</Card>

<Card title="ClawEval model rankings" icon="ranking-star" href="https://github.com/AIgenteur/ClawEval">
  **@AIgenteur** • `evals` `models` `devtools`

Đánh giá các mô hình trên 59 vai trò agent để trả lời câu hỏi "LLM nào phù hợp với GPU của tôi?". Một lựa chọn được cộng đồng ưa thích khi chọn mô hình cục bộ.
</Card>

<Card title="Music Craft" icon="music" href="https://clawhub.ai/luischarro/music-craft">
  **@luischarro** • `music` `generation` `skill`

Tạo bài hát không phụ thuộc nhà cung cấp: lập kế hoạch bản nhạc, cấu trúc lời bài hát và chỉnh sửa những kết quả sơ sài thay vì chỉ dùng một prompt duy nhất. Bao gồm một [biến thể MiniMax](https://clawhub.ai/luischarro/music-craft-minimax) có khả năng kiểm soát BPM, tông, cấu trúc và bản phối kết hợp.
</Card>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode hoàn tất thay đổi và mở một PR; OpenClaw đánh giá phần khác biệt rồi phản hồi trên Telegram bằng các đề xuất cùng kết luận rõ ràng về việc có nên hợp nhất hay không.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Đã yêu cầu "Robby" (@openclaw) tạo một Skills quản lý hầm rượu cục bộ. Nó yêu cầu một tệp CSV xuất mẫu và đường dẫn lưu trữ, sau đó xây dựng và kiểm thử Skills đó (962 chai trong ví dụ).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Lập kế hoạch bữa ăn hằng tuần, chọn các mặt hàng thường mua, đặt khung giờ giao hàng và xác nhận đơn hàng. Không dùng API, chỉ điều khiển trình duyệt.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Dùng phím tắt để chọn một vùng màn hình, xử lý bằng khả năng thị giác của Gemini và nhận Markdown ngay lập tức trong bảng nhớ tạm.

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Ứng dụng máy tính để quản lý Skills và lệnh trên Agents, Claude, Codex và OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Cộng đồng** • `voice` `tts` `telegram`

Bọc TTS của papla.media và gửi kết quả dưới dạng tin nhắn thoại Telegram (không tự động phát gây khó chịu).

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Tiện ích được cài đặt qua Homebrew để liệt kê, kiểm tra và theo dõi các phiên OpenAI Codex cục bộ (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Điều khiển và khắc phục sự cố máy in BambuLab: trạng thái, tác vụ, camera, AMS, hiệu chuẩn và nhiều chức năng khác.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Thông tin khởi hành theo thời gian thực, gián đoạn, trạng thái thang máy và chỉ đường cho hệ thống giao thông công cộng của Vienna.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Tự động đặt bữa ăn tại trường học ở Vương quốc Anh qua ParentPay. Sử dụng tọa độ chuột để nhấp chính xác vào các ô trong bảng.
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Tải lên Cloudflare R2/S3 và tạo liên kết tải xuống an toàn có chữ ký trước. Hữu ích cho các phiên bản OpenClaw từ xa.

  <img src="/assets/showcase/r2-upload.png" alt="R2 upload skill on ClawHub" />
</Card>

<Card title="iOS app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Xây dựng một ứng dụng iOS hoàn chỉnh có bản đồ và ghi âm, được chuẩn bị để phân phối trên App Store hoàn toàn qua trò chuyện Telegram.
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Trợ lý sức khỏe AI cá nhân tích hợp dữ liệu nhẫn Oura với lịch, các cuộc hẹn và lịch tập thể dục.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Hơn 14 agent dưới một Gateway, với bộ điều phối Opus 4.5 phân công công việc cho các agent Codex. Xem [bài viết kỹ thuật](https://github.com/adam91holt/orchestrated-ai-articles) và [Clawdspace](https://github.com/adam91holt/clawdspace) để tìm hiểu về cách cô lập agent.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI dành cho Linear, tích hợp với các quy trình làm việc tác tử (Claude Code, OpenClaw). Quản lý vấn đề, dự án và quy trình làm việc từ terminal.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Đọc, gửi và lưu trữ tin nhắn qua Beeper Desktop. Sử dụng API MCP cục bộ của Beeper để các agent có thể quản lý mọi cuộc trò chuyện của bạn (iMessage, WhatsApp và nhiều nền tảng khác) tại một nơi.
</Card>

</CardGroup>

## Tự động hóa và quy trình làm việc

Lập lịch, điều khiển trình duyệt, vòng lặp hỗ trợ và khía cạnh "cứ làm nhiệm vụ đó giúp tôi" của sản phẩm.

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code phát hiện và xác nhận các chức năng điều khiển máy lọc không khí, sau đó OpenClaw tiếp quản để quản lý chất lượng không khí trong phòng.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Pretty sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Được kích hoạt bởi camera trên mái nhà: yêu cầu OpenClaw chụp ảnh bầu trời mỗi khi khung cảnh đẹp. OpenClaw đã thiết kế một Skills và chụp ảnh.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Một prompt được lập lịch tạo một hình ảnh khung cảnh vào mỗi buổi sáng (thời tiết, nhiệm vụ, ngày tháng, bài đăng hoặc câu trích dẫn yêu thích) thông qua một nhân vật OpenClaw.
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Công cụ kiểm tra tình trạng sân trống của Playtomic cùng CLI đặt sân. Không bao giờ bỏ lỡ sân trống nữa.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **Cộng đồng** • `automation` `email` `pdf`

Thu thập tệp PDF từ email và chuẩn bị tài liệu cho chuyên gia tư vấn thuế. Kế toán hằng tháng hoạt động hoàn toàn tự động.
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Xây dựng lại toàn bộ trang web cá nhân qua Telegram trong khi xem Netflix — chuyển từ Notion sang Astro, di chuyển 18 bài đăng, chuyển DNS sang Cloudflare. Không cần mở máy tính xách tay.
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Tìm kiếm danh sách việc làm, đối chiếu với từ khóa trong CV và trả về các cơ hội phù hợp kèm liên kết. Được xây dựng trong 30 phút bằng API JSearch.
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw đã kết nối với Jira, sau đó tạo ngay một kỹ năng mới (trước khi kỹ năng đó xuất hiện trên ClawHub).
</Card>

<Card title="Todoist skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Tự động hóa các tác vụ Todoist và yêu cầu OpenClaw tạo kỹ năng trực tiếp trong cuộc trò chuyện Telegram.
</Card>

<Card title="TradingView analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Đăng nhập vào TradingView bằng tự động hóa trình duyệt, chụp ảnh màn hình biểu đồ và thực hiện phân tích kỹ thuật theo yêu cầu. Không cần API — chỉ cần điều khiển trình duyệt.
</Card>

<Card title="Car negotiation ($4,200 saved)" icon="car-side" href="https://x.com/astuyve/status/2014147784098681217">
  **@astuyve** • `negotiation` `email` `automation`

Cho OpenClaw tự xử lý các đại lý ô tô: nó đảm nhiệm quá trình thương lượng qua lại và giảm được $4,200 khỏi giá bán.
</Card>

<Card title="Flight check-in autopilot" icon="plane-departure" href="https://x.com/armanddp/status/2008767951340794245">
  **@armanddp** • `travel` `email` `automation`

Tìm chuyến bay tiếp theo trong email, hoàn tất quy trình làm thủ tục trực tuyến và chọn ghế cạnh cửa sổ — không cần ứng dụng của hãng hàng không.
</Card>

<Card title="Insurance claim filing" icon="file-signature" href="https://x.com/avi_press/status/2013066316467560521">
  **@avi_press** • `automation` `insurance` `browser`

Tự động nộp yêu cầu bồi thường bảo hiểm và lên lịch cuộc hẹn tiếp theo.
</Card>

<Card title="Idealista real estate skill" icon="building" href="https://x.com/quifago/status/2012458753786859872">
  **@quifago** • `real-estate` `api` `skill`

CLI API Idealista để truy vấn và định giá bất động sản, được đóng gói thành một kỹ năng để tác nhân có thể tìm nhà ngay trong cuộc trò chuyện.
</Card>

<Card title="Gardening business back office" icon="seedling" href="https://news.ycombinator.com/item?id=47783940">
  **@mjsweet** • `automation` `email` `invoicing`

Theo dõi Gmail để nhận lệnh công việc, phân tích ảnh bất động sản được gửi qua Telegram, tạo tệp PDF báo giá LaTeX nhiều trang và xuất hóa đơn qua Xero.
</Card>

<Card title="Slack auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Theo dõi một kênh Slack của công ty, phản hồi hữu ích và chuyển tiếp thông báo đến Telegram. Tự động sửa một lỗi trong môi trường sản xuất của ứng dụng đã triển khai mà không cần được yêu cầu.
</Card>

</CardGroup>

## Kiến thức và bộ nhớ

Các hệ thống lập chỉ mục, tìm kiếm, ghi nhớ và suy luận dựa trên kiến thức cá nhân hoặc kiến thức của nhóm.

<CardGroup cols={2}>

<Card title="xuezh Chinese learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Công cụ học tiếng Trung có phản hồi về phát âm và các quy trình học tập thông qua OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="X post analysis pipeline" icon="hashtag" href="https://x.com/andrewjiang/status/2008388427180630155">
  **@andrewjiang** • `analysis` `x` `pipeline`

Thu thập 4 triệu bài đăng từ 100 tài khoản X hàng đầu và chuyển chúng thành một quy trình phân tích có thể truy vấn.
</Card>

<Card title="Lab results to Notion" icon="flask" href="https://x.com/danpeguine/status/2013388700479058068">
  **@danpeguine** • `health` `notion` `organization`

Sắp xếp kết quả xét nghiệm máu trong nhiều năm thành một cơ sở dữ liệu Notion có cấu trúc.
</Card>

<Card title="Obsidian second brain" icon="book" href="https://notesbylex.com/openclaw-the-missing-piece-for-obsidians-second-brain">
  **@lexandstuff** • `obsidian` `whatsapp` `memory`

Trợ lý dùng hằng ngày trên WhatsApp với toàn bộ bộ nhớ được lưu dưới dạng markdown trong một kho Obsidian có kiểm soát phiên bản: theo dõi lượng calo và việc tập luyện, danh sách việc cần làm và quản lý công việc cá nhân.
</Card>

<Card title="Family history bot" icon="people-roof" href="https://news.ycombinator.com/item?id=47783940">
  **@brtkwr** • `telegram` `memory` `family`

Hoạt động trong một nhóm trò chuyện Telegram của gia đình, ghi lại câu chuyện của hơn 50 người thân và đặt các câu hỏi tiếp nối dựa trên thông tin đã biết — phản hồi bằng tiếng Nepal cho người bản ngữ.
</Card>

<Card title="WhatsApp memory vault" icon="vault">
  **Cộng đồng** • `memory` `transcription` `indexing`

Nhập toàn bộ dữ liệu xuất từ WhatsApp, phiên âm hơn 1.000 ghi chú thoại, đối chiếu với nhật ký git và xuất các báo cáo markdown có liên kết.
</Card>

<Card title="Karakeep semantic search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Bổ sung tìm kiếm vectơ cho dấu trang Karakeep bằng Qdrant kết hợp với embedding của OpenAI hoặc Ollama.
</Card>

<Card title="Inside-Out-2 memory" icon="brain">
  **Cộng đồng** • `memory` `beliefs` `self-model`

Trình quản lý bộ nhớ riêng biệt chuyển các tệp phiên thành ký ức, sau đó thành niềm tin, rồi thành một mô hình bản thân không ngừng phát triển.
</Card>

</CardGroup>

## Giọng nói và điện thoại

Các điểm truy cập ưu tiên giọng nói, cầu nối điện thoại và quy trình làm việc sử dụng nhiều nội dung phiên âm.

<CardGroup cols={2}>

<Card title="Pebble Ring one-tap voice" icon="ring" href="https://x.com/thekitze/status/2014765279650189578">
  **@thekitze** • `voice` `wearable` `hardware`

Một lần chạm vào Pebble Ring sẽ bắt đầu cuộc trò chuyện bằng giọng nói với OpenClaw — truy cập tác nhân từ thiết bị đeo.
</Card>

<Card title="Creator media studio" icon="clapperboard" href="https://x.com/cedric_chee/status/2014608153393168425">
  **@cedric_chee** • `media` `tts` `transcription`

Một studio truyền thông đầy đủ ngay trong cuộc trò chuyện: TTS, phiên âm và tự động hóa trình duyệt được kết nối với Codex 5.2 và MiniMax.
</Card>

<Card title="Action Button walkie-talkie" icon="walkie-talkie" href="https://x.com/i/status/2072766510053888497">
  **@buddyhadry** • `voice` `ios` `mobile`

Nút Action Button trên iPhone được kết nối với OpenClaw: nhấn, nói và tác nhân sẽ trả lời như bộ đàm.
</Card>

<Card title="Clawdia phone bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Cầu nối từ trợ lý giọng nói Vapi đến OpenClaw qua HTTP. Thực hiện cuộc gọi điện thoại gần như theo thời gian thực với tác nhân của bạn.
</Card>

<Card title="OpenRouter transcription" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Phiên âm âm thanh đa ngôn ngữ qua OpenRouter (Gemini và nhiều dịch vụ khác). Có sẵn trên ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter transcription skill on ClawHub" />
</Card>

</CardGroup>

## Hạ tầng và triển khai

Các giải pháp đóng gói, triển khai và tích hợp giúp OpenClaw dễ vận hành và mở rộng hơn.

<CardGroup cols={2}>

<Card title="Home Assistant add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway OpenClaw chạy trên Home Assistant OS, hỗ trợ đường hầm SSH và trạng thái bền vững.
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Điều khiển và tự động hóa các thiết bị Home Assistant bằng ngôn ngữ tự nhiên.

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant skill on ClawHub" />
</Card>

<Card title="macOS menu bar manager" icon="desktop" href="https://x.com/MagiMetal/status/2009424267801485362">
  **@MagiMetal** • `macos` `swift` `ui`

Ứng dụng thanh menu Swift nguyên bản hiển thị trạng thái tác nhân cùng các nút điều khiển nhanh.
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Cấu hình OpenClaw được chuyển đổi hoàn chỉnh sang Nix, tích hợp sẵn mọi thành phần cần thiết để triển khai có thể tái lập.
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Kỹ năng lịch sử dụng khal và vdirsyncer. Tích hợp lịch tự lưu trữ.

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV calendar skill on ClawHub" />
</Card>

</CardGroup>

## Nhà ở và phần cứng

Khía cạnh tương tác với thế giới vật lý của OpenClaw: nhà ở, cảm biến, camera, máy hút bụi và các thiết bị khác.

<CardGroup cols={2}>

<Card title="Self-built HomePod skill" icon="volume-high" href="https://x.com/localghost/status/2014763987683225685">
  **@localghost** • `homepod` `discovery` `skill`

OpenClaw tìm thấy các HomePod trên mạng cục bộ và tự viết một kỹ năng để điều khiển chúng.
</Card>

<Card title="$35 holo cube interface" icon="cube" href="https://x.com/andrewjiang/status/2013140793649734032">
  **@andrewjiang** • `hardware` `display` `fun`

Một khối lập phương ảnh nổi giá rẻ đóng vai trò là khuôn mặt vật lý của tác nhân trên bàn làm việc.
</Card>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Tự động hóa nhà ở dựa trên Nix với OpenClaw làm giao diện, kèm theo các bảng điều khiển Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Điều khiển robot hút bụi Roborock bằng hội thoại tự nhiên.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## Dự án cộng đồng

Những dự án phát triển vượt ra ngoài một quy trình làm việc đơn lẻ để trở thành các sản phẩm hoặc hệ sinh thái rộng lớn hơn.

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **Cộng đồng** • `marketplace` `astronomy` `webapp`

Sàn giao dịch thiết bị thiên văn học đầy đủ. Được xây dựng bằng và xoay quanh hệ sinh thái OpenClaw.
</Card>

<Card title="Clinch agent negotiation protocol" icon="handshake" href="https://clawhub.ai/publicstringapps/clinch">
  **@publicstringapps** • `protocol` `p2p` `skill`

Giao thức thương lượng mở giữa các tác nhân: tác nhân của bạn thương lượng giao dịch, lịch trình và thỏa thuận dịch vụ với các Node khác, sau đó ký kết quả bằng mật mã — bạn chỉ cần phê duyệt hoặc từ chối.
</Card>

</CardGroup>

## Gửi dự án của bạn

<Steps>
  <Step title="Share it">
    Đăng trong [#self-promotion trên Discord](https://discord.gg/clawd) hoặc [đăng bài trên X và nhắc đến @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Include details">
    Hãy cho chúng tôi biết dự án làm gì, cung cấp liên kết đến kho lưu trữ hoặc bản trình diễn và chia sẻ ảnh chụp màn hình nếu có.
  </Step>
  <Step title="Get featured">
    Chúng tôi sẽ thêm các dự án nổi bật vào trang này.
  </Step>
</Steps>

## Nội dung liên quan

- [Bắt đầu](/vi/start/getting-started)
- [OpenClaw](/vi/start/openclaw)
- [Toàn bộ nội dung giới thiệu trên X tại openclaw.ai](https://openclaw.ai/showcase/)
