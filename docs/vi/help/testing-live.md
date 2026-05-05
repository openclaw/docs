---
read_when:
    - Chạy các bài kiểm thử khói cho ma trận mô hình trực tiếp / phần phụ trợ CLI / ACP / media-provider
    - Gỡ lỗi việc phân giải thông tin xác thực cho kiểm thử trực tiếp
    - Thêm một bài kiểm thử trực tiếp mới dành riêng cho nhà cung cấp
sidebarTitle: Live tests
summary: 'Kiểm thử trực tiếp (có tương tác mạng): ma trận mô hình, các backend CLI, ACP, nhà cung cấp phương tiện, thông tin xác thực'
title: 'Kiểm thử: bộ kiểm thử trực tiếp'
x-i18n:
    generated_at: "2026-05-05T01:48:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03b8ca6348137a55c8d5f67c9c166a130a75a744f6a433cb00496756b29d7016
    source_path: help/testing-live.md
    workflow: 16
---

Để bắt đầu nhanh, trình chạy QA, bộ kiểm thử đơn vị/tích hợp và luồng Docker, hãy xem
[Kiểm thử](/vi/help/testing). Trang này bao quát các bộ kiểm thử **trực tiếp** (có chạm mạng):
ma trận mô hình, backend CLI, ACP và kiểm thử trực tiếp nhà cung cấp phương tiện, cùng với
cách xử lý thông tin xác thực.

## Trực tiếp: lệnh smoke profile cục bộ

Source `~/.profile` trước các kiểm tra trực tiếp ad hoc để khóa nhà cung cấp và đường dẫn công cụ
cục bộ khớp với shell của bạn:

```bash
source ~/.profile
```

Smoke phương tiện an toàn:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke an toàn về trạng thái sẵn sàng của cuộc gọi thoại:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` là chạy thử khô trừ khi cũng có `--yes`. Chỉ dùng `--yes`
khi bạn cố ý muốn thực hiện một cuộc gọi thông báo thật. Với Twilio, Telnyx và
Plivo, kiểm tra sẵn sàng thành công yêu cầu URL Webhook công khai; các phương án dự phòng
chỉ local loopback/cục bộ riêng tư bị từ chối theo thiết kế.

## Trực tiếp: quét năng lực node Android

- Kiểm thử: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Mục tiêu: gọi **mọi lệnh hiện đang được quảng bá** bởi một node Android đã kết nối và xác nhận hành vi hợp đồng lệnh.
- Phạm vi:
  - Thiết lập thủ công/có điều kiện trước (bộ kiểm thử không cài đặt/chạy/ghép đôi ứng dụng).
  - Xác thực Gateway `node.invoke` theo từng lệnh cho node Android đã chọn.
- Thiết lập trước bắt buộc:
  - Ứng dụng Android đã kết nối + ghép đôi với Gateway.
  - Ứng dụng được giữ ở tiền cảnh.
  - Quyền/đồng ý ghi nhận đã được cấp cho các năng lực bạn kỳ vọng sẽ đạt.
- Ghi đè mục tiêu tùy chọn:
  - `OPENCLAW_ANDROID_NODE_ID` hoặc `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Chi tiết thiết lập Android đầy đủ: [Ứng dụng Android](/vi/platforms/android)

## Trực tiếp: smoke mô hình (khóa profile)

Kiểm thử trực tiếp được chia thành hai lớp để chúng ta có thể cô lập lỗi:

- “Mô hình trực tiếp” cho biết nhà cung cấp/mô hình có thể trả lời với khóa đã cho hay không.
- “Smoke Gateway” cho biết toàn bộ pipeline gateway+tác nhân có hoạt động cho mô hình đó hay không (phiên, lịch sử, công cụ, chính sách sandbox, v.v.).

### Lớp 1: Hoàn tất mô hình trực tiếp (không có Gateway)

- Kiểm thử: `src/agents/models.profiles.live.test.ts`
- Mục tiêu:
  - Liệt kê các mô hình được phát hiện
  - Dùng `getApiKeyForModel` để chọn các mô hình bạn có thông tin xác thực
  - Chạy một completion nhỏ cho từng mô hình (và các hồi quy có mục tiêu khi cần)
- Cách bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
- Đặt `OPENCLAW_LIVE_MODELS=modern` (hoặc `all`, bí danh cho modern) để thật sự chạy bộ kiểm thử này; nếu không, nó sẽ bỏ qua để giữ `pnpm test:live` tập trung vào smoke Gateway
- Cách chọn mô hình:
  - `OPENCLAW_LIVE_MODELS=modern` để chạy allowlist hiện đại (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` là bí danh cho allowlist hiện đại
  - hoặc `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist phân tách bằng dấu phẩy)
  - Các lượt quét modern/all mặc định dùng một giới hạn được tuyển chọn có tín hiệu cao; đặt `OPENCLAW_LIVE_MAX_MODELS=0` để quét hiện đại toàn diện hoặc một số dương để dùng giới hạn nhỏ hơn.
  - Các lượt quét toàn diện dùng `OPENCLAW_LIVE_TEST_TIMEOUT_MS` cho timeout của toàn bộ kiểm thử mô hình trực tiếp. Mặc định: 60 phút.
  - Probe mô hình trực tiếp chạy với song song 20 luồng theo mặc định; đặt `OPENCLAW_LIVE_MODEL_CONCURRENCY` để ghi đè.
- Cách chọn nhà cung cấp:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist phân tách bằng dấu phẩy)
- Khóa đến từ đâu:
  - Theo mặc định: kho profile và các phương án dự phòng env
  - Đặt `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để chỉ bắt buộc dùng **kho profile**
- Lý do tồn tại:
  - Tách “API nhà cung cấp bị hỏng / khóa không hợp lệ” khỏi “pipeline tác nhân Gateway bị hỏng”
  - Chứa các hồi quy nhỏ, cô lập (ví dụ: phát lại reasoning của OpenAI Responses/Codex Responses + luồng gọi công cụ)

### Lớp 2: Smoke Gateway + tác nhân dev (những gì "@openclaw" thật sự làm)

- Kiểm thử: `src/gateway/gateway-models.profiles.live.test.ts`
- Mục tiêu:
  - Khởi động Gateway trong tiến trình
  - Tạo/vá một phiên `agent:dev:*` (ghi đè mô hình theo từng lượt chạy)
  - Lặp qua các mô hình có khóa và xác nhận:
    - phản hồi “có ý nghĩa” (không công cụ)
    - một lượt gọi công cụ thật hoạt động (probe đọc)
    - các probe công cụ bổ sung tùy chọn (probe exec+đọc)
    - các đường dẫn hồi quy OpenAI (chỉ gọi công cụ → tiếp nối) tiếp tục hoạt động
- Chi tiết probe (để bạn có thể giải thích lỗi nhanh):
  - Probe `read`: kiểm thử ghi một tệp nonce trong workspace và yêu cầu tác nhân `read` tệp đó rồi echo nonce trở lại.
  - Probe `exec+read`: kiểm thử yêu cầu tác nhân dùng `exec` ghi một nonce vào tệp tạm, rồi `read` lại nó.
  - Probe hình ảnh: kiểm thử đính kèm một PNG được tạo (mèo + mã ngẫu nhiên) và kỳ vọng mô hình trả về `cat <CODE>`.
  - Tham chiếu triển khai: `src/gateway/gateway-models.profiles.live.test.ts` và `src/gateway/live-image-probe.ts`.
- Cách bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
- Cách chọn mô hình:
  - Mặc định: allowlist hiện đại (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` là bí danh cho allowlist hiện đại
  - Hoặc đặt `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (hoặc danh sách phân tách bằng dấu phẩy) để thu hẹp
  - Các lượt quét Gateway modern/all mặc định dùng một giới hạn được tuyển chọn có tín hiệu cao; đặt `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` để quét hiện đại toàn diện hoặc một số dương để dùng giới hạn nhỏ hơn.
- Cách chọn nhà cung cấp (tránh “mọi thứ OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist phân tách bằng dấu phẩy)
- Probe công cụ + hình ảnh luôn bật trong kiểm thử trực tiếp này:
  - Probe `read` + probe `exec+read` (tạo áp lực công cụ)
  - Probe hình ảnh chạy khi mô hình quảng bá hỗ trợ đầu vào hình ảnh
  - Luồng (cấp cao):
    - Kiểm thử tạo một PNG nhỏ với “CAT” + mã ngẫu nhiên (`src/gateway/live-image-probe.ts`)
    - Gửi nó qua `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway phân tích tệp đính kèm thành `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Tác nhân nhúng chuyển tiếp một thông điệp người dùng đa phương thức tới mô hình
    - Xác nhận: phản hồi chứa `cat` + mã (dung sai OCR: cho phép lỗi nhỏ)

<Tip>
Để xem bạn có thể kiểm thử gì trên máy của mình (và các id `provider/model` chính xác), chạy:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Trực tiếp: smoke backend CLI (Claude, Codex, Gemini hoặc CLI cục bộ khác)

- Kiểm thử: `src/gateway/gateway-cli-backend.live.test.ts`
- Mục tiêu: xác thực pipeline Gateway + tác nhân bằng backend CLI cục bộ, mà không chạm vào cấu hình mặc định của bạn.
- Mặc định smoke theo từng backend nằm cùng định nghĩa `cli-backend.ts` của Plugin sở hữu.
- Bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Mặc định:
  - Nhà cung cấp/mô hình mặc định: `claude-cli/claude-sonnet-4-6`
  - Hành vi lệnh/đối số/hình ảnh đến từ metadata Plugin backend CLI sở hữu.
- Ghi đè (tùy chọn):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` để gửi một tệp đính kèm hình ảnh thật (đường dẫn được chèn vào prompt). Công thức Docker mặc định tắt tùy chọn này trừ khi được yêu cầu rõ ràng.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` để truyền đường dẫn tệp hình ảnh dưới dạng đối số CLI thay vì chèn vào prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (hoặc `"list"`) để kiểm soát cách đối số hình ảnh được truyền khi đã đặt `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` để gửi lượt thứ hai và xác thực luồng tiếp tục.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` để chọn tham gia probe liên tục cùng phiên Claude Sonnet -> Opus khi mô hình đã chọn hỗ trợ mục tiêu chuyển đổi. Công thức Docker mặc định tắt tùy chọn này để tăng độ tin cậy tổng hợp.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` để chọn tham gia probe MCP/công cụ loopback. Công thức Docker mặc định tắt tùy chọn này trừ khi được yêu cầu rõ ràng.

Ví dụ:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Smoke cấu hình Gemini MCP rẻ:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Kiểm thử này không yêu cầu Gemini tạo phản hồi. Nó ghi cùng các thiết lập hệ thống
mà OpenClaw đưa cho Gemini, rồi chạy `gemini --debug mcp list` để chứng minh một
máy chủ `transport: "streamable-http"` đã lưu được chuẩn hóa thành hình dạng HTTP MCP
của Gemini và có thể kết nối tới một máy chủ MCP streamable-HTTP cục bộ.

Công thức Docker:

```bash
pnpm test:docker:live-cli-backend
```

Công thức Docker cho từng nhà cung cấp:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Ghi chú:

- Trình chạy Docker nằm tại `scripts/test-live-cli-backend-docker.sh`.
- Nó chạy smoke backend CLI trực tiếp bên trong image Docker của repo dưới người dùng `node` không phải root.
- Nó phân giải metadata smoke CLI từ Plugin sở hữu, rồi cài gói CLI Linux khớp (`@anthropic-ai/claude-code`, `@openai/codex` hoặc `@google/gemini-cli`) vào prefix có thể ghi được cache tại `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (mặc định: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` yêu cầu OAuth đăng ký Claude Code di động thông qua `~/.claude/.credentials.json` với `claudeAiOauth.subscriptionType` hoặc `CLAUDE_CODE_OAUTH_TOKEN` từ `claude setup-token`. Trước tiên nó chứng minh `claude -p` trực tiếp trong Docker, rồi chạy hai lượt backend CLI Gateway mà không giữ lại biến env khóa API Anthropic. Lane đăng ký này mặc định tắt probe Claude MCP/công cụ và hình ảnh vì Claude hiện định tuyến việc sử dụng ứng dụng bên thứ ba qua tính phí sử dụng bổ sung thay vì giới hạn gói đăng ký thông thường.
- Smoke backend CLI trực tiếp hiện thực thi cùng luồng đầu cuối cho Claude, Codex và Gemini: lượt văn bản, lượt phân loại hình ảnh, rồi lệnh gọi công cụ `cron` MCP được xác minh qua CLI Gateway.
- Smoke mặc định của Claude cũng vá phiên từ Sonnet sang Opus và xác minh phiên đã tiếp tục vẫn nhớ một ghi chú trước đó.

## Trực tiếp: khả năng truy cập proxy APNs HTTP/2

- Kiểm thử: `src/infra/push-apns-http2.live.test.ts`
- Mục tiêu: đi đường hầm qua một proxy HTTP CONNECT cục bộ tới endpoint APNs sandbox của Apple, gửi yêu cầu xác thực APNs HTTP/2 và xác nhận phản hồi thật `403 InvalidProviderToken` của Apple quay lại qua đường dẫn proxy.
- Bật:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Timeout tùy chọn:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Trực tiếp: smoke bind ACP (`/acp spawn ... --bind here`)

- Kiểm thử: `src/gateway/gateway-acp-bind.live.test.ts`
- Mục tiêu: xác thực luồng bind hội thoại ACP thực với một tác tử ACP trực tiếp:
  - gửi `/acp spawn <agent> --bind here`
  - bind tại chỗ một hội thoại kênh tin nhắn tổng hợp
  - gửi một phản hồi tiếp theo thông thường trên cùng hội thoại đó
  - xác minh phản hồi tiếp theo đi vào transcript của phiên ACP đã bind
- Bật:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Mặc định:
  - Tác tử ACP trong Docker: `claude,codex,gemini`
  - Tác tử ACP cho lệnh trực tiếp `pnpm test:live ...`: `claude`
  - Kênh tổng hợp: ngữ cảnh hội thoại kiểu Slack DM
  - Backend ACP: `acpx`
- Ghi đè:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- Ghi chú:
  - Lane này dùng bề mặt `chat.send` của gateway với các trường tuyến xuất phát tổng hợp chỉ dành cho quản trị viên để kiểm thử có thể gắn ngữ cảnh kênh tin nhắn mà không giả vờ phân phối ra bên ngoài.
  - Khi chưa đặt `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND`, kiểm thử dùng sổ đăng ký tác tử tích hợp sẵn của Plugin `acpx` được nhúng cho tác tử harness ACP đã chọn.
  - Việc tạo MCP Cron cho phiên đã bind mặc định là best-effort vì các harness ACP bên ngoài có thể hủy lệnh gọi MCP sau khi bằng chứng bind/hình ảnh đã đạt; đặt `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` để làm cho phép dò Cron sau bind đó trở nên nghiêm ngặt.

Ví dụ:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Công thức Docker:

```bash
pnpm test:docker:live-acp-bind
```

Công thức Docker cho một tác tử:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Ghi chú Docker:

- Trình chạy Docker nằm tại `scripts/test-live-acp-bind-docker.sh`.
- Theo mặc định, nó chạy smoke bind ACP lần lượt trên các tác tử CLI trực tiếp tổng hợp: `claude`, `codex`, rồi `gemini`.
- Dùng `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, hoặc `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` để thu hẹp ma trận.
- Nó source `~/.profile`, stage vật liệu xác thực CLI tương ứng vào container, rồi cài đặt CLI trực tiếp được yêu cầu (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid qua `https://app.factory.ai/cli`, `@google/gemini-cli`, hoặc `opencode-ai`) nếu còn thiếu. Bản thân backend ACP là gói `acpx/runtime` được nhúng từ Plugin `acpx` chính thức.
- Biến thể Docker của Droid stage `~/.factory` cho phần cài đặt, chuyển tiếp `FACTORY_API_KEY`, và yêu cầu khóa API đó vì xác thực OAuth/keyring cục bộ của Factory không thể chuyển nguyên trạng vào container. Nó dùng mục sổ đăng ký tích hợp sẵn `droid exec --output-format acp` của ACPX.
- Biến thể Docker của OpenCode là một lane hồi quy nghiêm ngặt cho một tác tử. Nó ghi mô hình mặc định `OPENCODE_CONFIG_CONTENT` tạm thời từ `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (mặc định `opencode/kimi-k2.6`) sau khi source `~/.profile`, và `pnpm test:docker:live-acp-bind:opencode` yêu cầu transcript trợ lý đã bind thay vì chấp nhận bỏ qua sau bind chung.
- Các lệnh gọi CLI `acpx` trực tiếp chỉ là đường dẫn thủ công/giải pháp vòng để so sánh hành vi bên ngoài Gateway. Smoke bind ACP Docker kiểm tra backend runtime `acpx` được nhúng của OpenClaw.

## Trực tiếp: smoke harness app-server Codex

- Mục tiêu: xác thực harness Codex do Plugin sở hữu thông qua phương thức gateway
  `agent` thông thường:
  - tải Plugin `codex` đi kèm
  - chọn `OPENCLAW_AGENT_RUNTIME=codex`
  - gửi lượt tác tử gateway đầu tiên tới `openai/gpt-5.5` với harness Codex bị ép dùng
  - gửi lượt thứ hai tới cùng phiên OpenClaw và xác minh thread app-server
    có thể tiếp tục
  - chạy `/codex status` và `/codex models` qua cùng đường dẫn lệnh gateway
  - tùy chọn chạy hai phép dò shell nâng quyền đã được Guardian xem xét: một lệnh lành tính
    nên được phê duyệt và một lượt tải lên khóa bí mật giả nên bị
    từ chối để tác tử hỏi lại
- Kiểm thử: `src/gateway/gateway-codex-harness.live.test.ts`
- Bật: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Mô hình mặc định: `openai/gpt-5.5`
- Phép dò hình ảnh tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Phép dò MCP/công cụ tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Phép dò Guardian tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke dùng `agentRuntime.id: "codex"` để một harness Codex bị hỏng không thể
  vượt qua bằng cách âm thầm fallback về PI.
- Xác thực: xác thực app-server Codex từ đăng nhập thuê bao Codex cục bộ. Các
  smoke Docker cũng có thể cung cấp `OPENAI_API_KEY` cho các phép dò không phải Codex khi áp dụng,
  cùng với tùy chọn sao chép `~/.codex/auth.json` và `~/.codex/config.toml`.

Công thức cục bộ:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Công thức Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Ghi chú Docker:

- Trình chạy Docker nằm tại `scripts/test-live-codex-harness-docker.sh`.
- Nó source `~/.profile` đã mount, truyền `OPENAI_API_KEY`, sao chép các tệp xác thực CLI Codex
  khi có, cài đặt `@openai/codex` vào một prefix npm đã mount có thể ghi,
  stage cây mã nguồn, rồi chỉ chạy kiểm thử trực tiếp harness Codex.
- Docker bật mặc định các phép dò hình ảnh, MCP/công cụ và Guardian. Đặt
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` hoặc
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` hoặc
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` khi bạn cần một lượt chạy gỡ lỗi
  hẹp hơn.
- Docker dùng cùng cấu hình runtime Codex tường minh, nên các bí danh cũ hoặc fallback PI
  không thể che khuất hồi quy harness Codex.

### Công thức trực tiếp được khuyến nghị

Allowlist hẹp, tường minh là nhanh nhất và ít flaky nhất:

- Một mô hình, trực tiếp (không qua gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Một mô hình, smoke gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Gọi công cụ trên nhiều provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tập trung vào Google (khóa API Gemini + Antigravity):
  - Gemini (khóa API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke adaptive thinking của Google:
  - Nếu khóa cục bộ nằm trong shell profile: `source ~/.profile`
  - Mặc định động Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Ngân sách động Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Ghi chú:

- `google/...` dùng Gemini API (khóa API).
- `google-antigravity/...` dùng cầu nối OAuth Antigravity (endpoint tác tử kiểu Cloud Code Assist).
- `google-gemini-cli/...` dùng CLI Gemini cục bộ trên máy của bạn (xác thực riêng + đặc thù công cụ riêng).
- Gemini API so với Gemini CLI:
  - API: OpenClaw gọi Gemini API được Google lưu trữ qua HTTP (khóa API / xác thực hồ sơ); đây là điều hầu hết người dùng muốn nói khi nói “Gemini”.
  - CLI: OpenClaw shell out tới binary `gemini` cục bộ; nó có xác thực riêng và có thể hành xử khác (hỗ trợ streaming/công cụ/lệch phiên bản).

## Trực tiếp: ma trận mô hình (những gì chúng ta bao phủ)

Không có “danh sách mô hình CI” cố định (trực tiếp là opt-in), nhưng đây là các mô hình **được khuyến nghị** để bao phủ thường xuyên trên máy phát triển có khóa.

### Bộ smoke hiện đại (gọi công cụ + hình ảnh)

Đây là lượt chạy “mô hình phổ biến” mà chúng ta kỳ vọng duy trì hoạt động:

- OpenAI (không phải Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (hoặc `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` và `google/gemini-3-flash-preview` (tránh các mô hình Gemini 2.x cũ hơn)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` và `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` và `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Chạy smoke gateway với công cụ + hình ảnh:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Đường cơ sở: gọi công cụ (Read + Exec tùy chọn)

Chọn ít nhất một cho mỗi họ provider:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (hoặc `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (hoặc `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Phạm vi bao phủ bổ sung tùy chọn (nên có):

- xAI: `xai/grok-4.3` (hoặc bản mới nhất có sẵn)
- Mistral: `mistral/`… (chọn một mô hình có khả năng “công cụ” mà bạn đã bật)
- Cerebras: `cerebras/`… (nếu bạn có quyền truy cập)
- LM Studio: `lmstudio/`… (cục bộ; gọi công cụ phụ thuộc vào chế độ API)

### Thị giác: gửi hình ảnh (tệp đính kèm → tin nhắn đa phương thức)

Bao gồm ít nhất một mô hình có khả năng xử lý hình ảnh trong `OPENCLAW_LIVE_GATEWAY_MODELS` (các biến thể có thị giác của Claude/Gemini/OpenAI, v.v.) để kiểm tra phép dò hình ảnh.

### Aggregator / gateway thay thế

Nếu bạn đã bật khóa, chúng ta cũng hỗ trợ kiểm thử qua:

- OpenRouter: `openrouter/...` (hàng trăm mô hình; dùng `openclaw models scan` để tìm các ứng viên có khả năng công cụ+hình ảnh)
- OpenCode: `opencode/...` cho Zen và `opencode-go/...` cho Go (xác thực qua `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Thêm các provider bạn có thể đưa vào ma trận trực tiếp (nếu bạn có thông tin xác thực/cấu hình):

- Tích hợp sẵn: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Qua `models.providers` (endpoint tùy chỉnh): `minimax` (cloud/API), cộng với bất kỳ proxy tương thích OpenAI/Anthropic nào (LM Studio, vLLM, LiteLLM, v.v.)

<Tip>
Đừng mã hóa cứng "tất cả mô hình" trong tài liệu. Danh sách có thẩm quyền là bất cứ thứ gì `discoverModels(...)` trả về trên máy của bạn cộng với các khóa có sẵn.
</Tip>

## Thông tin xác thực (không bao giờ commit)

Kiểm thử trực tiếp phát hiện thông tin xác thực theo cùng cách CLI làm. Hệ quả thực tế:

- Nếu CLI hoạt động, các kiểm thử trực tiếp sẽ tìm thấy cùng các khóa.
- Nếu một kiểm thử trực tiếp báo “no creds”, hãy debug theo cùng cách bạn debug `openclaw models list` / lựa chọn mô hình.

- Hồ sơ xác thực theo từng agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (đây là ý nghĩa của “profile keys” trong các kiểm thử trực tiếp)
- Cấu hình: `~/.openclaw/openclaw.json` (hoặc `OPENCLAW_CONFIG_PATH`)
- Thư mục trạng thái legacy: `~/.openclaw/credentials/` (được sao chép vào live home tạm khi có, nhưng không phải kho lưu trữ profile-key chính)
- Các lần chạy trực tiếp cục bộ mặc định sao chép cấu hình đang hoạt động, các tệp `auth-profiles.json` theo từng agent, `credentials/` legacy, và các thư mục xác thực CLI bên ngoài được hỗ trợ vào một test home tạm; các live home đã staging bỏ qua `workspace/` và `sandboxes/`, đồng thời các ghi đè đường dẫn `agents.*.workspace` / `agentDir` bị loại bỏ để các phép probe không chạm vào workspace thật trên máy chủ của bạn.

Nếu bạn muốn dựa vào các khóa env (ví dụ được export trong `~/.profile`), hãy chạy kiểm thử cục bộ sau `source ~/.profile`, hoặc dùng các Docker runner bên dưới (chúng có thể mount `~/.profile` vào container).

## Deepgram trực tiếp (phiên âm âm thanh)

- Kiểm thử: `extensions/deepgram/audio.live.test.ts`
- Bật: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus trực tiếp cho kế hoạch coding

- Kiểm thử: `extensions/byteplus/live.test.ts`
- Bật: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Ghi đè mô hình tùy chọn: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI trực tiếp cho phương tiện workflow

- Kiểm thử: `extensions/comfy/comfy.live.test.ts`
- Bật: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Phạm vi:
  - Kiểm tra các đường dẫn image, video và `music_generate` của comfy đi kèm
  - Bỏ qua từng năng lực trừ khi `plugins.entries.comfy.config.<capability>` được cấu hình
  - Hữu ích sau khi thay đổi thao tác gửi workflow comfy, polling, tải xuống, hoặc đăng ký Plugin

## Tạo hình ảnh trực tiếp

- Kiểm thử: `test/image-generation.runtime.live.test.ts`
- Lệnh: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Phạm vi:
  - Liệt kê mọi Plugin nhà cung cấp tạo hình ảnh đã đăng ký
  - Tải các biến env còn thiếu của nhà cung cấp từ login shell của bạn (`~/.profile`) trước khi probe
  - Mặc định dùng khóa API trực tiếp/env trước các hồ sơ xác thực đã lưu, để các khóa kiểm thử cũ trong `auth-profiles.json` không che khuất thông tin đăng nhập shell thật
  - Bỏ qua các nhà cung cấp không có xác thực/hồ sơ/mô hình dùng được
  - Chạy từng nhà cung cấp đã cấu hình qua runtime tạo hình ảnh dùng chung:
    - `<provider>:generate`
    - `<provider>:edit` khi nhà cung cấp khai báo hỗ trợ chỉnh sửa
- Các nhà cung cấp đi kèm hiện được bao phủ:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Thu hẹp tùy chọn:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Hành vi xác thực tùy chọn:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để buộc xác thực bằng kho hồ sơ và bỏ qua các ghi đè chỉ có env

Đối với đường dẫn CLI đã phát hành, hãy thêm một smoke `infer` sau khi kiểm thử trực tiếp nhà cung cấp/runtime vượt qua:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Phần này bao phủ phân tích đối số CLI, phân giải cấu hình/default-agent, kích hoạt
Plugin đi kèm, runtime tạo hình ảnh dùng chung, và yêu cầu trực tiếp tới nhà cung cấp.
Các dependency của Plugin được kỳ vọng đã có trước khi tải runtime.

## Tạo nhạc trực tiếp

- Kiểm thử: `extensions/music-generation-providers.live.test.ts`
- Bật: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Phạm vi:
  - Kiểm tra đường dẫn nhà cung cấp tạo nhạc đi kèm dùng chung
  - Hiện bao phủ Google và MiniMax
  - Tải các biến env của nhà cung cấp từ login shell của bạn (`~/.profile`) trước khi probe
  - Mặc định dùng khóa API trực tiếp/env trước các hồ sơ xác thực đã lưu, để các khóa kiểm thử cũ trong `auth-profiles.json` không che khuất thông tin đăng nhập shell thật
  - Bỏ qua các nhà cung cấp không có xác thực/hồ sơ/mô hình dùng được
  - Chạy cả hai chế độ runtime đã khai báo khi có:
    - `generate` với đầu vào chỉ có prompt
    - `edit` khi nhà cung cấp khai báo `capabilities.edit.enabled`
  - Phạm vi bao phủ lane dùng chung hiện tại:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: tệp trực tiếp Comfy riêng, không thuộc lượt quét dùng chung này
- Thu hẹp tùy chọn:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Hành vi xác thực tùy chọn:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để buộc xác thực bằng kho hồ sơ và bỏ qua các ghi đè chỉ có env

## Tạo video trực tiếp

- Kiểm thử: `extensions/video-generation-providers.live.test.ts`
- Bật: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Phạm vi:
  - Kiểm tra đường dẫn nhà cung cấp tạo video đi kèm dùng chung
  - Mặc định dùng đường dẫn smoke an toàn cho phát hành: các nhà cung cấp không phải FAL, một yêu cầu text-to-video cho mỗi nhà cung cấp, prompt lobster dài một giây, và giới hạn thao tác theo từng nhà cung cấp từ `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (mặc định là `180000`)
  - Mặc định bỏ qua FAL vì độ trễ hàng đợi phía nhà cung cấp có thể chiếm phần lớn thời gian phát hành; truyền `--video-providers fal` hoặc `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` để chạy rõ ràng
  - Tải các biến env của nhà cung cấp từ login shell của bạn (`~/.profile`) trước khi probe
  - Mặc định dùng khóa API trực tiếp/env trước các hồ sơ xác thực đã lưu, để các khóa kiểm thử cũ trong `auth-profiles.json` không che khuất thông tin đăng nhập shell thật
  - Bỏ qua các nhà cung cấp không có xác thực/hồ sơ/mô hình dùng được
  - Mặc định chỉ chạy `generate`
  - Đặt `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` để cũng chạy các chế độ chuyển đổi đã khai báo khi có:
    - `imageToVideo` khi nhà cung cấp khai báo `capabilities.imageToVideo.enabled` và nhà cung cấp/mô hình được chọn chấp nhận đầu vào hình ảnh cục bộ dựa trên buffer trong lượt quét dùng chung
    - `videoToVideo` khi nhà cung cấp khai báo `capabilities.videoToVideo.enabled` và nhà cung cấp/mô hình được chọn chấp nhận đầu vào video cục bộ dựa trên buffer trong lượt quét dùng chung
  - Các nhà cung cấp `imageToVideo` đã khai báo nhưng bị bỏ qua hiện tại trong lượt quét dùng chung:
    - `vydra` vì `veo3` đi kèm chỉ hỗ trợ text và `kling` đi kèm yêu cầu URL hình ảnh từ xa
  - Phạm vi bao phủ riêng cho Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - tệp đó chạy `veo3` text-to-video cùng một lane `kling` mặc định dùng fixture URL hình ảnh từ xa
  - Phạm vi bao phủ trực tiếp `videoToVideo` hiện tại:
    - chỉ `runway` khi mô hình được chọn là `runway/gen4_aleph`
  - Các nhà cung cấp `videoToVideo` đã khai báo nhưng bị bỏ qua hiện tại trong lượt quét dùng chung:
    - `alibaba`, `qwen`, `xai` vì các đường dẫn đó hiện yêu cầu URL tham chiếu `http(s)` / MP4 từ xa
    - `google` vì lane Gemini/Veo dùng chung hiện tại dùng đầu vào cục bộ dựa trên buffer và đường dẫn đó không được chấp nhận trong lượt quét dùng chung
    - `openai` vì lane dùng chung hiện tại thiếu bảo đảm quyền truy cập inpaint/remix video theo từng org
- Thu hẹp tùy chọn:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` để bao gồm mọi nhà cung cấp trong lượt quét mặc định, gồm cả FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` để giảm giới hạn từng thao tác của nhà cung cấp cho một lượt smoke quyết liệt
- Hành vi xác thực tùy chọn:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để buộc xác thực bằng kho hồ sơ và bỏ qua các ghi đè chỉ có env

## Harness trực tiếp cho phương tiện

- Lệnh: `pnpm test:live:media`
- Mục đích:
  - Chạy các bộ kiểm thử trực tiếp dùng chung cho image, music và video qua một entrypoint gốc của repo
  - Tự động tải các biến env còn thiếu của nhà cung cấp từ `~/.profile`
  - Mặc định tự động thu hẹp từng bộ kiểm thử tới các nhà cung cấp hiện có xác thực dùng được
  - Tái sử dụng `scripts/test-live.mjs`, để hành vi Heartbeat và chế độ quiet luôn nhất quán
- Ví dụ:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Liên quan

- [Kiểm thử](/vi/help/testing) — các bộ unit, integration, QA và Docker
