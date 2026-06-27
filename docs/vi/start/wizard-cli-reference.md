---
read_when:
    - Bạn cần hoạt động chi tiết cho openclaw onboard
    - Bạn đang gỡ lỗi kết quả thiết lập ban đầu hoặc tích hợp các ứng dụng khách thiết lập ban đầu
sidebarTitle: CLI reference
summary: Tham chiếu đầy đủ về luồng thiết lập CLI, thiết lập xác thực/mô hình, đầu ra và nội bộ
title: Tham chiếu thiết lập CLI
x-i18n:
    generated_at: "2026-06-27T18:13:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6e46c81dd51ee9f1ce492dedc2911d449f507a136bd8805bc157915684a1941
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Trang này là tài liệu tham chiếu đầy đủ cho `openclaw onboard`.
Để xem hướng dẫn ngắn, xem [Onboarding (CLI)](/vi/start/wizard).

## Trình hướng dẫn thực hiện gì

Chế độ cục bộ (mặc định) hướng dẫn bạn qua:

- Thiết lập mô hình và xác thực (OAuth thuê bao OpenAI Code, Anthropic Claude CLI hoặc khóa API, cùng các tùy chọn MiniMax, GLM, Ollama, Moonshot, StepFun và AI Gateway)
- Vị trí workspace và các tệp bootstrap
- Cài đặt Gateway (cổng, bind, xác thực, Tailscale)
- Kênh và nhà cung cấp (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage và các Plugin kênh được đóng gói khác)
- Cài đặt daemon (LaunchAgent, systemd user unit hoặc Windows Scheduled Task gốc với phương án dự phòng thư mục Startup)
- Kiểm tra sức khỏe
- Thiết lập Skills

Chế độ từ xa cấu hình máy này để kết nối đến một Gateway ở nơi khác.
Nó không cài đặt hoặc sửa đổi bất kỳ thứ gì trên máy chủ từ xa.

## Chi tiết luồng cục bộ

<Steps>
  <Step title="Phát hiện cấu hình hiện có">
    - Nếu `~/.openclaw/openclaw.json` tồn tại, chọn Giữ, Sửa đổi hoặc Đặt lại.
    - Chạy lại trình hướng dẫn sẽ không xóa gì trừ khi bạn chọn Đặt lại rõ ràng (hoặc truyền `--reset`).
    - CLI `--reset` mặc định là `config+creds+sessions`; dùng `--reset-scope full` để xóa cả workspace.
    - Nếu cấu hình không hợp lệ hoặc chứa khóa cũ, trình hướng dẫn sẽ dừng và yêu cầu bạn chạy `openclaw doctor` trước khi tiếp tục.
    - Đặt lại dùng `trash` và cung cấp các phạm vi:
      - Chỉ cấu hình
      - Cấu hình + thông tin xác thực + phiên
      - Đặt lại toàn bộ (cũng xóa workspace)

  </Step>
  <Step title="Mô hình và xác thực">
    - Ma trận tùy chọn đầy đủ nằm trong [Tùy chọn xác thực và mô hình](#auth-and-model-options).

  </Step>
  <Step title="Workspace">
    - Mặc định `~/.openclaw/workspace` (có thể cấu hình).
    - Tạo sẵn các tệp workspace cần cho nghi thức bootstrap lần chạy đầu tiên.
    - Bố cục workspace: [Workspace của agent](/vi/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Hỏi cổng, bind, chế độ xác thực và phơi bày qua Tailscale.
    - Khuyến nghị: giữ xác thực bằng token được bật ngay cả với loopback để các máy khách WS cục bộ phải xác thực.
    - Ở chế độ token, thiết lập tương tác cung cấp:
      - **Tạo/lưu token dạng văn bản thuần** (mặc định)
      - **Dùng SecretRef** (chọn tham gia)
    - Ở chế độ mật khẩu, thiết lập tương tác cũng hỗ trợ lưu trữ dạng văn bản thuần hoặc SecretRef.
    - Đường dẫn SecretRef token không tương tác: `--gateway-token-ref-env <ENV_VAR>`.
      - Yêu cầu một biến môi trường không rỗng trong môi trường tiến trình onboarding.
      - Không thể kết hợp với `--gateway-token`.
    - Chỉ tắt xác thực nếu bạn hoàn toàn tin tưởng mọi tiến trình cục bộ.
    - Các bind không phải loopback vẫn yêu cầu xác thực.

  </Step>
  <Step title="Kênh">
    - [WhatsApp](/vi/channels/whatsapp): đăng nhập QR tùy chọn
    - [Telegram](/vi/channels/telegram): token bot
    - [Discord](/vi/channels/discord): token bot
    - [Google Chat](/vi/channels/googlechat): JSON tài khoản dịch vụ + đối tượng Webhook
    - [Mattermost](/vi/channels/mattermost): token bot + URL cơ sở
    - [Signal](/vi/channels/signal): cài đặt `signal-cli` tùy chọn + cấu hình tài khoản
    - [iMessage](/vi/channels/imessage): đường dẫn CLI `imsg` + quyền truy cập Messages DB; dùng trình bọc SSH khi Gateway chạy ngoài máy Mac
    - Bảo mật DM: mặc định là ghép đôi. DM đầu tiên gửi một mã; phê duyệt qua
      `openclaw pairing approve <channel> <code>` hoặc dùng allowlist.
  </Step>
  <Step title="Cài đặt daemon">
    - macOS: LaunchAgent
      - Yêu cầu phiên người dùng đã đăng nhập; với môi trường headless, dùng LaunchDaemon tùy chỉnh (không được phân phối kèm).
    - Linux và Windows qua WSL2: systemd user unit
      - Trình hướng dẫn thử `loginctl enable-linger <user>` để Gateway vẫn hoạt động sau khi đăng xuất.
      - Có thể yêu cầu sudo (ghi `/var/lib/systemd/linger`); nó thử không dùng sudo trước.
    - Windows gốc: ưu tiên Scheduled Task
      - Nếu việc tạo tác vụ bị từ chối, OpenClaw sẽ dự phòng sang mục đăng nhập thư mục Startup theo từng người dùng và khởi động Gateway ngay lập tức.
      - Scheduled Tasks vẫn được ưu tiên vì cung cấp trạng thái giám sát tốt hơn.
    - Chọn runtime: Node (khuyến nghị; bắt buộc cho WhatsApp và Telegram). Bun không được khuyến nghị.

  </Step>
  <Step title="Kiểm tra sức khỏe">
    - Khởi động Gateway (nếu cần) và chạy `openclaw health`.
    - `openclaw status --deep` thêm phép thăm dò sức khỏe Gateway trực tiếp vào đầu ra trạng thái, bao gồm các phép thăm dò kênh khi được hỗ trợ.

  </Step>
  <Step title="Skills">
    - Đọc các Skills có sẵn và kiểm tra yêu cầu.
    - Cho phép bạn chọn trình quản lý node: npm, pnpm hoặc bun.
    - Cài đặt các phụ thuộc tùy chọn (một số dùng Homebrew trên macOS).

  </Step>
  <Step title="Hoàn tất">
    - Tóm tắt và các bước tiếp theo, bao gồm tùy chọn ứng dụng iOS, Android và macOS.

  </Step>
</Steps>

<Note>
Nếu không phát hiện GUI, trình hướng dẫn in hướng dẫn chuyển tiếp cổng SSH cho Control UI thay vì mở trình duyệt.
Nếu thiếu tài sản Control UI, trình hướng dẫn sẽ cố gắng xây dựng chúng; phương án dự phòng là `pnpm ui:build` (tự động cài đặt phụ thuộc UI).
</Note>

## Chi tiết chế độ từ xa

Chế độ từ xa cấu hình máy này để kết nối đến một Gateway ở nơi khác.

<Info>
Chế độ từ xa không cài đặt hoặc sửa đổi bất kỳ thứ gì trên máy chủ từ xa.
</Info>

Những gì bạn thiết lập:

- URL Gateway từ xa (`ws://...`)
- Token nếu Gateway từ xa yêu cầu xác thực (khuyến nghị)

<Note>
- Nếu Gateway chỉ cho phép loopback, dùng đường hầm SSH hoặc tailnet.
- Gợi ý khám phá:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Tùy chọn xác thực và mô hình

<AccordionGroup>
  <Accordion title="Khóa API Anthropic">
    Dùng `ANTHROPIC_API_KEY` nếu có hoặc hỏi khóa, sau đó lưu để daemon sử dụng.
  </Accordion>
  <Accordion title="Thuê bao OpenAI Code (OAuth)">
    Luồng trình duyệt; dán `code#state`.

    Đặt `agents.defaults.model` thành `openai/gpt-5.5` thông qua runtime Codex khi mô hình chưa được đặt hoặc đã thuộc họ OpenAI.

  </Accordion>
  <Accordion title="Thuê bao OpenAI Code (ghép đôi thiết bị)">
    Luồng ghép đôi trình duyệt với mã thiết bị tồn tại trong thời gian ngắn.

    Đặt `agents.defaults.model` thành `openai/gpt-5.5` thông qua runtime Codex khi mô hình chưa được đặt hoặc đã thuộc họ OpenAI.

  </Accordion>
  <Accordion title="Khóa API OpenAI">
    Dùng `OPENAI_API_KEY` nếu có hoặc hỏi khóa, sau đó lưu thông tin xác thực trong hồ sơ xác thực.

    Đặt `agents.defaults.model` thành `openai/gpt-5.5` khi mô hình chưa được đặt, là `openai/*`, hoặc là tham chiếu mô hình Codex cũ.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    Đăng nhập bằng trình duyệt cho các tài khoản SuperGrok hoặc X Premium đủ điều kiện. Đây là
    đường dẫn xAI được khuyến nghị cho hầu hết người dùng. OpenClaw lưu hồ sơ xác thực
    thu được cho các mô hình Grok, Grok `web_search`, `x_search` và `code_execution`.
  </Accordion>
  <Accordion title="Mã thiết bị xAI (Grok)">
    Đăng nhập bằng trình duyệt thân thiện với môi trường từ xa bằng mã ngắn thay vì callback
    localhost. Dùng cách này từ SSH, Docker hoặc máy chủ VPS.
  </Accordion>
  <Accordion title="Khóa API xAI (Grok)">
    Hỏi `XAI_API_KEY` và cấu hình xAI làm nhà cung cấp mô hình. Dùng cách này
    khi bạn muốn khóa API xAI Console thay vì OAuth thuê bao.
  </Accordion>
  <Accordion title="OpenCode">
    Hỏi `OPENCODE_API_KEY` (hoặc `OPENCODE_ZEN_API_KEY`) và cho phép bạn chọn catalog Zen hoặc Go.
    URL thiết lập: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Khóa API (chung)">
    Lưu khóa cho bạn.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Hỏi `AI_GATEWAY_API_KEY`.
    Chi tiết thêm: [Vercel AI Gateway](/vi/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Hỏi ID tài khoản, ID Gateway và `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Chi tiết thêm: [Cloudflare AI Gateway](/vi/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Cấu hình được tự động ghi. Mặc định hosted là `MiniMax-M3`; thiết lập bằng khóa API dùng
    `minimax/...`, và thiết lập OAuth dùng `minimax-portal/...`.
    Chi tiết thêm: [MiniMax](/vi/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Cấu hình được tự động ghi cho StepFun tiêu chuẩn hoặc Step Plan trên endpoint Trung Quốc hoặc toàn cầu.
    Tiêu chuẩn hiện bao gồm `step-3.5-flash`, và Step Plan cũng bao gồm `step-3.5-flash-2603`.
    Chi tiết thêm: [StepFun](/vi/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (tương thích Anthropic)">
    Hỏi `SYNTHETIC_API_KEY`.
    Chi tiết thêm: [Synthetic](/vi/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (mô hình mở Cloud và cục bộ)">
    Trước tiên hỏi `Cloud + Local`, `Cloud only` hoặc `Local only`.
    `Cloud only` dùng `OLLAMA_API_KEY` với `https://ollama.com`.
    Các chế độ dựa trên host hỏi URL cơ sở (mặc định `http://127.0.0.1:11434`), khám phá mô hình có sẵn và đề xuất mặc định.
    `Cloud + Local` cũng kiểm tra xem host Ollama đó đã đăng nhập để truy cập Cloud hay chưa.
    Chi tiết thêm: [Ollama](/vi/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot và Kimi Coding">
    Cấu hình Moonshot (Kimi K2) và Kimi Coding được tự động ghi.
    Chi tiết thêm: [Moonshot AI (Kimi + Kimi Coding)](/vi/providers/moonshot).
  </Accordion>
  <Accordion title="Nhà cung cấp tùy chỉnh">
    Hoạt động với các endpoint tương thích OpenAI và tương thích Anthropic.

    Onboarding tương tác hỗ trợ cùng các lựa chọn lưu trữ khóa API như các luồng khóa API nhà cung cấp khác:
    - **Dán khóa API ngay** (văn bản thuần)
    - **Dùng tham chiếu bí mật** (tham chiếu env hoặc tham chiếu nhà cung cấp đã cấu hình, có xác thực preflight)

    Cờ không tương tác:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (tùy chọn; dự phòng sang `CUSTOM_API_KEY`)
    - `--custom-provider-id` (tùy chọn)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (tùy chọn; mặc định `openai`)
    - `--custom-image-input` / `--custom-text-input` (tùy chọn; ghi đè năng lực đầu vào mô hình được suy luận)

  </Accordion>
  <Accordion title="Bỏ qua">
    Để xác thực chưa được cấu hình.
  </Accordion>
</AccordionGroup>

Hành vi mô hình:

- Chọn mô hình mặc định từ các tùy chọn được phát hiện, hoặc nhập thủ công nhà cung cấp và mô hình.
- Onboarding nhà cung cấp tùy chỉnh suy luận hỗ trợ hình ảnh cho các ID mô hình phổ biến và chỉ hỏi khi tên mô hình không rõ.
- Khi onboarding bắt đầu từ một lựa chọn xác thực nhà cung cấp, bộ chọn mô hình tự động ưu tiên
  nhà cung cấp đó. Với Volcengine và BytePlus, cùng tùy chọn ưu tiên đó
  cũng khớp các biến thể coding-plan của chúng (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Nếu bộ lọc nhà cung cấp được ưu tiên đó sẽ rỗng, bộ chọn dự phòng sang
  catalog đầy đủ thay vì không hiển thị mô hình nào.
- Trình hướng dẫn chạy kiểm tra mô hình và cảnh báo nếu mô hình đã cấu hình không xác định hoặc thiếu xác thực.

Đường dẫn thông tin xác thực và hồ sơ:

- Hồ sơ xác thực (khóa API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Nhập OAuth cũ: `~/.openclaw/credentials/oauth.json`

Chế độ lưu trữ thông tin xác thực:

- Hành vi onboarding mặc định lưu khóa API dưới dạng giá trị văn bản thuần trong hồ sơ xác thực.
- `--secret-input-mode ref` bật chế độ tham chiếu thay vì lưu trữ khóa văn bản thuần.
  Trong thiết lập tương tác, bạn có thể chọn một trong hai:
  - tham chiếu biến môi trường (ví dụ `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - tham chiếu provider đã cấu hình (`file` hoặc `exec`) với bí danh provider + id
- Chế độ tham chiếu tương tác chạy bước xác thực preflight nhanh trước khi lưu.
  - Tham chiếu env: xác thực tên biến + giá trị không rỗng trong môi trường onboarding hiện tại.
  - Tham chiếu provider: xác thực cấu hình provider và phân giải id được yêu cầu.
  - Nếu preflight thất bại, onboarding hiển thị lỗi và cho phép bạn thử lại.
- Trong chế độ không tương tác, `--secret-input-mode ref` chỉ được hỗ trợ bằng env.
  - Đặt biến môi trường của provider trong môi trường tiến trình onboarding.
  - Các cờ khóa inline (ví dụ `--openai-api-key`) yêu cầu biến môi trường đó phải được đặt; nếu không, onboarding sẽ thất bại nhanh.
  - Với provider tùy chỉnh, chế độ `ref` không tương tác lưu `models.providers.<id>.apiKey` dưới dạng `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Trong trường hợp provider tùy chỉnh đó, `--custom-api-key` yêu cầu `CUSTOM_API_KEY` phải được đặt; nếu không, onboarding sẽ thất bại nhanh.
- Thông tin xác thực Gateway hỗ trợ lựa chọn văn bản thuần và SecretRef trong thiết lập tương tác:
  - Chế độ token: **Tạo/lưu token văn bản thuần** (mặc định) hoặc **Dùng SecretRef**.
  - Chế độ mật khẩu: văn bản thuần hoặc SecretRef.
- Đường dẫn token SecretRef không tương tác: `--gateway-token-ref-env <ENV_VAR>`.
- Các thiết lập văn bản thuần hiện có tiếp tục hoạt động không thay đổi.

<Note>
Mẹo cho môi trường không giao diện và máy chủ: hoàn tất OAuth trên máy có trình duyệt, rồi sao chép
`auth-profiles.json` của agent đó (ví dụ
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, hoặc đường dẫn
`$OPENCLAW_STATE_DIR/...` tương ứng) sang máy chủ Gateway. `credentials/oauth.json`
chỉ là nguồn nhập legacy.
</Note>

## Đầu ra và nội bộ

Các trường điển hình trong `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` khi truyền `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (nếu chọn Minimax)
- `tools.profile` (onboarding cục bộ mặc định là `"coding"` khi chưa đặt; các giá trị rõ ràng hiện có được giữ nguyên)
- `gateway.*` (chế độ, bind, xác thực, tailscale)
- `session.dmScope` (onboarding cục bộ mặc định đặt giá trị này là `per-channel-peer` khi chưa đặt; các giá trị rõ ràng hiện có được giữ nguyên)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Danh sách cho phép của kênh (Slack, Discord, Matrix, Microsoft Teams) khi bạn chọn bật trong các prompt (tên được phân giải thành ID khi có thể)
- `skills.install.nodeManager`
  - Cờ `setup --node-manager` chấp nhận `npm`, `pnpm`, hoặc `bun`.
  - Cấu hình thủ công vẫn có thể đặt `skills.install.nodeManager: "yarn"` sau đó.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` ghi `agents.list[]` và `bindings` tùy chọn.

Thông tin xác thực WhatsApp nằm trong `~/.openclaw/credentials/whatsapp/<accountId>/`.
Phiên được lưu trong `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Một số kênh được phân phối dưới dạng plugin. Khi được chọn trong quá trình thiết lập, trình hướng dẫn
sẽ nhắc cài đặt plugin (npm hoặc đường dẫn cục bộ) trước khi cấu hình kênh.
</Note>

RPC của trình hướng dẫn Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Máy khách (ứng dụng macOS và Control UI) có thể render các bước mà không cần triển khai lại logic onboarding.

Hành vi thiết lập Signal:

- Tải xuống release asset phù hợp
- Lưu dưới `~/.openclaw/tools/signal-cli/<version>/`
- Ghi `channels.signal.cliPath` trong cấu hình
- Bản dựng JVM yêu cầu Java 21
- Bản dựng native được dùng khi có sẵn
- Windows dùng WSL2 và tuân theo luồng signal-cli của Linux bên trong WSL

## Tài liệu liên quan

- Trung tâm onboarding: [Onboarding (CLI)](/vi/start/wizard)
- Tự động hóa và script: [Tự động hóa CLI](/vi/start/wizard-cli-automation)
- Tham chiếu lệnh: [`openclaw onboard`](/vi/cli/onboard)
