---
read_when:
    - Bạn cần thông tin chi tiết về hoạt động của một bước `openclaw onboard` cụ thể
    - Bạn đang gỡ lỗi kết quả quy trình làm quen ban đầu hoặc tích hợp các máy khách của quy trình này
sidebarTitle: CLI reference
summary: 'Hành vi từng bước của openclaw onboard: chức năng của từng bước, cấu hình được ghi và cơ chế nội bộ'
title: Tài liệu tham khảo về thiết lập CLI
x-i18n:
    generated_at: "2026-07-16T15:15:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 96c1469c6b64f08fd9105c8b737df164d39d27d051bbb9bb4f76b9e1e057785d
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Trang này trình bày từng bước về hành vi, đầu ra và cơ chế nội bộ của quy trình thiết lập ban đầu.
Để xem hướng dẫn từng bước, hãy xem [Thiết lập ban đầu (CLI)](/vi/start/wizard). Để xem tài liệu tham chiếu đầy đủ về cờ CLI
(mọi `--flag`, ví dụ không tương tác, lệnh dành riêng cho
nhà cung cấp), hãy xem [`openclaw onboard`](/vi/cli/onboard).

## Trình hướng dẫn thực hiện những gì

Chế độ cục bộ (mặc định) hướng dẫn bạn qua:

- Thiết lập mô hình và xác thực (Anthropic, OAuth gói đăng ký OpenAI Code, xAI, OpenCode, điểm cuối tùy chỉnh và các luồng xác thực khác do nhà cung cấp quản lý)
- Vị trí không gian làm việc và các tệp khởi tạo
- Cài đặt Gateway (cổng, liên kết, xác thực, Tailscale)
- Kênh và nhà cung cấp (Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp và các kênh tích hợp sẵn hoặc kênh Plugin khác)
- Nhà cung cấp tìm kiếm web (tùy chọn)
- Cài đặt daemon (LaunchAgent, đơn vị người dùng systemd hoặc Tác vụ theo lịch gốc của Windows với phương án dự phòng là thư mục Startup)
- Kiểm tra tình trạng
- Thiết lập Skills

Chế độ từ xa cấu hình máy này để kết nối với một Gateway ở nơi khác. Chế độ này
không cài đặt hoặc sửa đổi bất kỳ thứ gì trên máy chủ từ xa.

## Chi tiết luồng cục bộ

<Steps>
  <Step title="Phát hiện cấu hình hiện có">
    - Nếu `~/.openclaw/openclaw.json` tồn tại, hãy chọn **Giữ các giá trị hiện tại**, **Xem lại và cập nhật** hoặc **Đặt lại trước khi thiết lập**.
    - Chạy lại trình hướng dẫn sẽ không xóa bất kỳ thứ gì trừ khi bạn chọn Đặt lại một cách rõ ràng (hoặc truyền `--reset`).
    - CLI `--reset` mặc định là `config+creds+sessions`; dùng `--reset-scope full` để xóa cả không gian làm việc.
    - Nếu cấu hình không hợp lệ hoặc chứa khóa cũ, trình hướng dẫn sẽ dừng lại và yêu cầu bạn chạy `openclaw doctor` trước khi tiếp tục.
    - Thao tác đặt lại chuyển trạng thái vào Thùng rác (không bao giờ xóa trực tiếp) và cung cấp các phạm vi:
      - Chỉ cấu hình
      - Cấu hình + thông tin xác thực + phiên
      - Đặt lại toàn bộ (đồng thời xóa không gian làm việc)

  </Step>
  <Step title="Mô hình và xác thực">
    - Ma trận tùy chọn đầy đủ nằm trong [Tùy chọn xác thực và mô hình](#auth-and-model-options).

  </Step>
  <Step title="Không gian làm việc">
    - Mặc định là `~/.openclaw/workspace` (có thể cấu hình).
    - Tạo sẵn các tệp không gian làm việc cần thiết cho quá trình khởi tạo lần chạy đầu tiên.
    - Bố cục không gian làm việc: [Không gian làm việc của tác nhân](/vi/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Yêu cầu nhập cổng, địa chỉ liên kết, chế độ xác thực và mức độ hiển thị qua Tailscale.
    - Khuyến nghị: duy trì bật xác thực bằng token ngay cả đối với loopback để các máy khách WS cục bộ phải xác thực.
    - Trong chế độ token, thiết lập tương tác cung cấp:
      - **Tạo/lưu token dạng văn bản thuần** (mặc định)
      - **Sử dụng SecretRef** (chủ động bật)
    - Trong chế độ mật khẩu, thiết lập tương tác cũng hỗ trợ lưu trữ dạng văn bản thuần hoặc SecretRef.
    - Đường dẫn SecretRef cho token ở chế độ không tương tác: `--gateway-token-ref-env <ENV_VAR>`.
      - Yêu cầu một biến môi trường không rỗng trong môi trường tiến trình thiết lập ban đầu.
      - Không thể kết hợp với `--gateway-token`.
    - Chỉ tắt xác thực nếu bạn hoàn toàn tin cậy mọi tiến trình cục bộ.
    - Các liên kết không phải loopback vẫn yêu cầu xác thực.

  </Step>
  <Step title="Kênh">
    - [WhatsApp](/vi/channels/whatsapp): đăng nhập bằng mã QR tùy chọn
    - [Telegram](/vi/channels/telegram): token bot
    - [Discord](/vi/channels/discord): token bot
    - [Google Chat](/vi/channels/googlechat): JSON tài khoản dịch vụ + đối tượng nhận webhook
    - [Mattermost](/vi/channels/mattermost): token bot + URL cơ sở
    - [Signal](/vi/channels/signal): cài đặt `signal-cli` tùy chọn + cấu hình tài khoản
    - [iMessage](/vi/channels/imessage): đường dẫn CLI `imsg` + quyền truy cập cơ sở dữ liệu Messages; dùng trình bao bọc SSH khi Gateway chạy ngoài máy Mac
    - Bảo mật tin nhắn trực tiếp: mặc định là ghép nối. Tin nhắn trực tiếp đầu tiên sẽ gửi một mã; phê duyệt qua
      `openclaw pairing approve <channel> <code>` hoặc dùng danh sách cho phép.
  </Step>
  <Step title="Tìm kiếm web">
    - Chọn một nhà cung cấp (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily) hoặc bỏ qua.
    - Bỏ qua bước này bằng `--skip-search`; cấu hình lại sau bằng `openclaw configure --section web`.

  </Step>
  <Step title="Cài đặt daemon">
    - macOS: LaunchAgent
      - Yêu cầu phiên người dùng đã đăng nhập; đối với hệ thống không màn hình, hãy dùng LaunchDaemon tùy chỉnh (không được cung cấp).
    - Linux và Windows qua WSL2: đơn vị người dùng systemd
      - Trình hướng dẫn thử `loginctl enable-linger <user>` để gateway tiếp tục hoạt động sau khi đăng xuất.
      - Có thể yêu cầu sudo (ghi `/var/lib/systemd/linger`); trước tiên, trình hướng dẫn sẽ thử không dùng sudo.
    - Windows gốc: ưu tiên Tác vụ theo lịch
      - Nếu việc tạo tác vụ bị từ chối, OpenClaw chuyển sang dùng một mục đăng nhập trong thư mục Startup dành cho từng người dùng và khởi động gateway ngay lập tức.
      - Tác vụ theo lịch vẫn được ưu tiên vì cung cấp trạng thái trình giám sát tốt hơn.
    - Lựa chọn môi trường chạy: bắt buộc dùng Node vì kho lưu trữ trạng thái môi trường chạy chuẩn của OpenClaw sử dụng `node:sqlite`.

  </Step>
  <Step title="Kiểm tra tình trạng">
    - Khởi động gateway (nếu cần) và chạy `openclaw health`.
    - `openclaw status --deep` thêm phép thăm dò tình trạng gateway trực tiếp vào đầu ra trạng thái, bao gồm các phép thăm dò kênh khi được hỗ trợ.

  </Step>
  <Step title="Skills">
    - Đọc các skill hiện có và kiểm tra yêu cầu.
    - Cho phép bạn chọn trình quản lý node: npm, pnpm hoặc bun.
    - Cài đặt các phần phụ thuộc tùy chọn cho những skill tích hợp sẵn đáng tin cậy khi
      trình cài đặt bắt buộc có sẵn.
    - Bỏ qua các trình cài đặt Homebrew, uv và Go không có sẵn, sau đó nhóm những
      skill bị ảnh hưởng kèm hướng dẫn thiết lập thủ công. Chạy `openclaw doctor` sau khi cài đặt
      các điều kiện tiên quyết còn thiếu.

  </Step>
  <Step title="Hoàn tất">
    - Bản tóm tắt và các bước tiếp theo, bao gồm tùy chọn ứng dụng iOS, Android và macOS.

  </Step>
</Steps>

<Note>
Nếu không phát hiện giao diện đồ họa, trình hướng dẫn sẽ in hướng dẫn chuyển tiếp cổng SSH cho Giao diện điều khiển thay vì mở trình duyệt.
Nếu thiếu tài nguyên Giao diện điều khiển, trình hướng dẫn sẽ cố gắng xây dựng chúng; phương án dự phòng là `pnpm ui:build` (tự động cài đặt các phần phụ thuộc UI).
</Note>

## Chi tiết chế độ từ xa

Chế độ từ xa cấu hình máy này để kết nối với một Gateway ở nơi khác. Chế độ này
không cài đặt hoặc sửa đổi bất kỳ thứ gì trên máy chủ từ xa.

Nội dung bạn thiết lập:

- URL gateway từ xa (`ws://...` hoặc `wss://...`)
- Token, mật khẩu hoặc không xác thực, khớp với cấu hình của Gateway từ xa

<Steps>
  <Step title="Khám phá (tùy chọn)">
    Nếu `dns-sd` (macOS) hoặc `avahi-browse` (Linux) có sẵn, quy trình thiết lập ban đầu
    cho phép tìm kiếm các tín hiệu gateway Bonjour/mDNS trước khi chuyển sang
    nhập URL thủ công. Việc khám phá DNS-SD diện rộng cũng được thử khi
    đã cấu hình. Tài liệu: [Khám phá Gateway](/vi/gateway/discovery), [Bonjour](/vi/gateway/bonjour).
  </Step>
  <Step title="Phương thức kết nối">
    Khi chọn một tín hiệu, hãy chọn WebSocket trực tiếp hoặc đường hầm SSH:
    - **Trực tiếp**: kết nối qua `wss://` và yêu cầu tin cậy
      dấu vân tay TLS đã phát hiện (ghim theo nguyên tắc tin cậy trong lần sử dụng đầu tiên; chỉ ghim nếu bạn chấp nhận).
    - **Đường hầm SSH**: in một lệnh `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
      để chạy trước, sau đó kết nối với điểm cuối đường hầm cục bộ.
  </Step>
  <Step title="Xác thực">
    Chọn token (khuyến nghị), mật khẩu hoặc không xác thực, sau đó tùy ý lưu thông tin đó
    dưới dạng SecretRef thay vì văn bản thuần.
  </Step>
</Steps>

<Note>
Nếu gateway chỉ dùng loopback và không thể được khám phá, hãy dùng đường hầm SSH hoặc tailnet theo cách thủ công.
`ws://` dạng văn bản thuần được chấp nhận cho loopback, các địa chỉ IP riêng dạng ký tự, `.local` và URL Tailnet `*.ts.net`; các tên DNS riêng khác cần `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`.
</Note>

## Tùy chọn xác thực và mô hình

Nếu một bước thiết lập nhà cung cấp thất bại trong quy trình thiết lập ban đầu tương tác (ví dụ: tùy chọn tái sử dụng CLI
khi chưa đăng nhập cục bộ), trình hướng dẫn sẽ hiển thị lỗi và quay lại trình chọn nhà cung cấp
thay vì thoát. Các lần chạy `--auth-choice` rõ ràng vẫn dừng ngay khi lỗi để phục vụ tự động hóa.

<AccordionGroup>
  <Accordion title="Khóa API Anthropic">
    Sử dụng `ANTHROPIC_API_KEY` nếu có hoặc yêu cầu nhập khóa, sau đó lưu khóa để daemon sử dụng.
  </Accordion>
  <Accordion title="Anthropic Claude CLI">
    Đường dẫn cục bộ ưu tiên trong quy trình thiết lập ban đầu/cấu hình tương tác; tái sử dụng phiên đăng nhập Claude CLI hiện có khi khả dụng.
  </Accordion>
  <Accordion title="Gói đăng ký OpenAI Code (OAuth)">
    Luồng trình duyệt; dán `code#state`.

    Trong một thiết lập mới chưa có mô hình chính, đặt `agents.defaults.model` thành
    `openai/gpt-5.6-sol` thông qua môi trường chạy Codex.

  </Accordion>
  <Accordion title="Gói đăng ký OpenAI Code (ghép nối thiết bị)">
    Luồng ghép nối trình duyệt bằng mã thiết bị có thời hạn ngắn.

    Trong một thiết lập mới chưa có mô hình chính, đặt `agents.defaults.model` thành
    `openai/gpt-5.6-sol` thông qua môi trường chạy Codex.

  </Accordion>
  <Accordion title="Khóa API OpenAI">
    Sử dụng `OPENAI_API_KEY` nếu có hoặc yêu cầu nhập khóa, sau đó lưu thông tin xác thực trong các hồ sơ xác thực.

    Trong một thiết lập mới chưa có mô hình chính, đặt `agents.defaults.model` thành
    `openai/gpt-5.6`; mã mô hình API trực tiếp không có tiền tố được phân giải sang cấp Sol.

    Việc thêm hoặc xác thực lại OpenAI sẽ giữ nguyên mô hình chính được chỉ định rõ ràng hiện có,
    bao gồm `openai/gpt-5.5`. Nếu tài khoản không cung cấp GPT-5.6,
    hãy chọn rõ ràng `openai/gpt-5.5`; OpenClaw không tự động hạ cấp mô hình đó.

  </Accordion>
  <Accordion title="OAuth xAI (Grok)">
    Đăng nhập qua trình duyệt dành cho các tài khoản SuperGrok hoặc X Premium đủ điều kiện. Đây là
    phương thức xAI được khuyến nghị cho hầu hết người dùng. OpenClaw lưu hồ sơ xác thực
    thu được cho các mô hình Grok, Grok `web_search`, `x_search` và `code_execution`.
  </Accordion>
  <Accordion title="Mã thiết bị xAI (Grok)">
    Đăng nhập qua trình duyệt thân thiện với môi trường từ xa bằng mã ngắn thay vì lệnh gọi lại
    localhost. Sử dụng phương thức này từ máy chủ SSH, Docker hoặc VPS.
  </Accordion>
  <Accordion title="Khóa API xAI (Grok)">
    Yêu cầu nhập `XAI_API_KEY` và cấu hình xAI làm nhà cung cấp mô hình. Sử dụng phương thức này
    khi bạn muốn dùng khóa API xAI Console thay vì OAuth theo gói đăng ký.
  </Accordion>
  <Accordion title="OpenCode">
    Yêu cầu nhập `OPENCODE_API_KEY` (hoặc `OPENCODE_ZEN_API_KEY`) và cho phép bạn chọn danh mục Zen hoặc Go (một khóa API dùng được cho cả hai).
    URL thiết lập: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Khóa API (chung)">
    Lưu khóa cho bạn.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Yêu cầu nhập `AI_GATEWAY_API_KEY`.
    Chi tiết thêm: [Vercel AI Gateway](/vi/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Yêu cầu nhập ID tài khoản, ID gateway và `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Chi tiết thêm: [Cloudflare AI Gateway](/vi/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Cấu hình được tự động ghi. Giá trị mặc định được lưu trữ là `MiniMax-M3`; thiết lập bằng khóa API sử dụng
    `minimax/...`, còn thiết lập OAuth sử dụng `minimax-portal/...`.
    Chi tiết thêm: [MiniMax](/vi/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Cấu hình được tự động ghi cho StepFun tiêu chuẩn hoặc Step Plan trên các điểm cuối tại Trung Quốc hoặc toàn cầu.
    Gói tiêu chuẩn hiện bao gồm `step-3.5-flash`, còn Step Plan cũng bao gồm `step-3.5-flash-2603`.
    Chi tiết thêm: [StepFun](/vi/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (tương thích Anthropic)">
    Yêu cầu nhập `SYNTHETIC_API_KEY`.
    Chi tiết thêm: [Synthetic](/vi/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (các mô hình mở trên đám mây và cục bộ)">
    Trước tiên yêu cầu nhập `Cloud + Local`, `Cloud only` hoặc `Local only`.
    `Cloud only` sử dụng `OLLAMA_API_KEY` với `https://ollama.com`.
    Các chế độ dựa trên máy chủ yêu cầu URL cơ sở (mặc định là `http://127.0.0.1:11434`), phát hiện các mô hình khả dụng và đề xuất giá trị mặc định.
    `Cloud + Local` cũng kiểm tra xem máy chủ Ollama đó đã đăng nhập để truy cập đám mây hay chưa.
    Chi tiết thêm: [Ollama](/vi/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot và Kimi Coding">
    Cấu hình Moonshot (Kimi K2) và Kimi Coding được tự động ghi.
    Chi tiết thêm: [Moonshot AI (Kimi + Kimi Coding)](/vi/providers/moonshot).
  </Accordion>
  <Accordion title="Nhà cung cấp tùy chỉnh">
    Hoạt động với các điểm cuối tương thích OpenAI, tương thích OpenAI Responses và tương thích Anthropic.

    Quy trình khởi tạo tương tác hỗ trợ cùng các lựa chọn lưu trữ khóa API như những luồng khóa API của nhà cung cấp khác:
    - **Dán khóa API ngay** (văn bản thuần)
    - **Sử dụng tham chiếu bí mật** (tham chiếu biến môi trường hoặc tham chiếu nhà cung cấp đã cấu hình, có xác thực sơ bộ)

    Quy trình khởi tạo suy luận khả năng hỗ trợ hình ảnh cho các ID mô hình thị giác phổ biến (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral và tương tự) và chỉ hỏi khi tên mô hình không xác định.

    Các cờ không tương tác:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (tùy chọn; dùng `CUSTOM_API_KEY` làm phương án dự phòng)
    - `--custom-provider-id` (tùy chọn)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (tùy chọn; mặc định `openai`)
    - `--custom-image-input` / `--custom-text-input` (tùy chọn; ghi đè khả năng đầu vào mô hình được suy luận)

  </Accordion>
  <Accordion title="Bỏ qua">
    Để xác thực ở trạng thái chưa cấu hình.
  </Accordion>
</AccordionGroup>

Hành vi của mô hình:

- Chọn mô hình mặc định từ các tùy chọn được phát hiện hoặc nhập nhà cung cấp và mô hình theo cách thủ công.
- Khi quy trình khởi tạo bắt đầu từ một lựa chọn xác thực nhà cung cấp, trình chọn mô hình sẽ tự động ưu tiên
  nhà cung cấp đó. Đối với Volcengine và BytePlus, cùng tùy chọn ưu tiên này
  cũng khớp với các biến thể gói lập trình của chúng (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Nếu bộ lọc theo nhà cung cấp ưu tiên đó không có kết quả, trình chọn sẽ quay lại
  toàn bộ danh mục thay vì không hiển thị mô hình nào.
- Trình hướng dẫn chạy kiểm tra mô hình và cảnh báo nếu mô hình đã cấu hình không xác định hoặc thiếu xác thực.

Đường dẫn thông tin xác thực và hồ sơ:

- Hồ sơ xác thực (khóa API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Nhập OAuth cũ: `~/.openclaw/credentials/oauth.json`

Chế độ lưu trữ thông tin xác thực:

- Hành vi khởi tạo mặc định lưu giữ khóa API dưới dạng giá trị văn bản thuần trong hồ sơ xác thực.
- `--secret-input-mode ref` bật chế độ tham chiếu thay vì lưu trữ khóa dạng văn bản thuần.
  Trong thiết lập tương tác, bạn có thể chọn một trong hai:
  - tham chiếu biến môi trường (ví dụ: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - tham chiếu nhà cung cấp đã cấu hình (`file` hoặc `exec`) với bí danh nhà cung cấp + ID
- Chế độ tham chiếu tương tác chạy xác thực sơ bộ nhanh trước khi lưu.
  - Tham chiếu biến môi trường: xác thực tên biến + giá trị không rỗng trong môi trường khởi tạo hiện tại.
  - Tham chiếu nhà cung cấp: xác thực cấu hình nhà cung cấp và phân giải ID được yêu cầu.
  - Nếu xác thực sơ bộ thất bại, quy trình khởi tạo hiển thị lỗi và cho phép bạn thử lại.
- Trong chế độ không tương tác, `--secret-input-mode ref` chỉ dựa trên biến môi trường.
  - Đặt biến môi trường của nhà cung cấp trong môi trường tiến trình khởi tạo.
  - Các cờ khóa nội tuyến (ví dụ: `--openai-api-key`) yêu cầu biến môi trường đó phải được đặt; nếu không, quy trình khởi tạo sẽ thất bại ngay.
  - Đối với nhà cung cấp tùy chỉnh, chế độ `ref` không tương tác lưu `models.providers.<id>.apiKey` dưới dạng `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Trong trường hợp nhà cung cấp tùy chỉnh đó, `--custom-api-key` yêu cầu phải đặt `CUSTOM_API_KEY`; nếu không, quy trình khởi tạo sẽ thất bại ngay.
- Thông tin xác thực Gateway hỗ trợ lựa chọn văn bản thuần và SecretRef trong thiết lập tương tác:
  - Chế độ token: **Tạo/lưu token dạng văn bản thuần** (mặc định) hoặc **Sử dụng SecretRef**.
  - Chế độ mật khẩu: văn bản thuần hoặc SecretRef.
- Đường dẫn SecretRef token không tương tác: `--gateway-token-ref-env <ENV_VAR>`.
- Các thiết lập văn bản thuần hiện có tiếp tục hoạt động mà không thay đổi.

<Note>
Mẹo cho môi trường không giao diện và máy chủ: hoàn tất OAuth trên máy có trình duyệt, sau đó sao chép
`auth-profiles.json` của tác nhân đó (ví dụ:
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` hoặc đường dẫn
`$OPENCLAW_STATE_DIR/...` tương ứng) sang máy chủ gateway. `credentials/oauth.json`
chỉ là nguồn nhập cũ.
</Note>

## Đầu ra và thành phần nội bộ

Các trường thường gặp trong `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` khi truyền `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (nếu chọn Minimax)
- `tools.profile` (quy trình khởi tạo cục bộ mặc định là `"coding"` khi chưa đặt; các giá trị tường minh hiện có được giữ nguyên)
- `gateway.*` (chế độ, liên kết, xác thực, tailscale)
- `session.dmScope` (quy trình khởi tạo cục bộ mặc định đặt giá trị này thành `per-channel-peer` khi chưa đặt; các giá trị tường minh hiện có được giữ nguyên)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Danh sách cho phép của kênh (Discord, iMessage, Signal, Slack, Telegram, WhatsApp) khi bạn chọn tham gia trong lời nhắc; Discord và Slack cũng phân giải tên đã nhập thành ID
- `skills.install.nodeManager`
  - Cờ `setup --node-manager` chấp nhận `npm`, `pnpm` hoặc `bun`.
  - Cấu hình thủ công vẫn có thể đặt `skills.install.nodeManager: "yarn"` sau đó.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` ghi `agents.list[]` và `bindings` tùy chọn.

Thông tin xác thực WhatsApp nằm trong `~/.openclaw/credentials/whatsapp/<accountId>/`.
Các phiên hoạt động và bản chép lời được lưu trong
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Thư mục
`~/.openclaw/agents/<agentId>/sessions/` được dùng cho dữ liệu đầu vào di chuyển cũ
và các hiện vật lưu trữ/hỗ trợ.

<Note>
Một số kênh được cung cấp dưới dạng plugin. Khi được chọn trong quá trình thiết lập, trình hướng dẫn
sẽ yêu cầu cài đặt plugin (npm hoặc đường dẫn cục bộ) trước khi cấu hình kênh.
</Note>

## Thiết lập không tương tác

`--non-interactive` yêu cầu `--accept-risk` (xác nhận rằng các tác nhân có
năng lực mạnh và quyền truy cập toàn bộ hệ thống tiềm ẩn rủi ro):

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY"
```

Tài liệu tham khảo đầy đủ về cờ và các ví dụ dành riêng cho từng nhà cung cấp: [`openclaw onboard`](/vi/cli/onboard), [Tự động hóa CLI](/vi/start/wizard-cli-automation).

## RPC của trình hướng dẫn Gateway

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Các máy khách (ứng dụng macOS và giao diện điều khiển) có thể kết xuất các bước mà không cần triển khai lại logic khởi tạo.

## Hành vi thiết lập Signal

- Tải xuống tài nguyên bản phát hành phù hợp từ các bản phát hành GitHub `signal-cli` chính thức (bản dựng gốc, chỉ Linux x86-64)
- Trên các nền tảng khác (macOS, Linux không phải x64), cài đặt qua Homebrew
- Lưu bản cài đặt từ tài nguyên phát hành trong `~/.openclaw/tools/signal-cli/<version>/`
- Ghi `channels.signal.cliPath` vào cấu hình
- Windows gốc chưa được hỗ trợ; hãy chạy quy trình khởi tạo bên trong WSL2 để nhận đường dẫn cài đặt Linux

## Tài liệu liên quan

- Trung tâm khởi tạo: [Khởi tạo (CLI)](/vi/start/wizard)
- Tự động hóa và tập lệnh: [Tự động hóa CLI](/vi/start/wizard-cli-automation)
- Tài liệu tham khảo lệnh: [`openclaw onboard`](/vi/cli/onboard)
