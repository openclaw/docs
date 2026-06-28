---
read_when:
    - Chạy kiểm thử smoke ma trận mô hình trực tiếp / backend CLI / ACP / nhà cung cấp phương tiện
    - Gỡ lỗi quá trình phân giải thông tin xác thực cho live-test
    - Thêm bài kiểm thử trực tiếp mới dành riêng cho nhà cung cấp
sidebarTitle: Live tests
summary: 'Kiểm thử trực tiếp (có truy cập mạng): ma trận mô hình, backend CLI, ACP, nhà cung cấp phương tiện, thông tin xác thực'
title: 'Kiểm thử: bộ kiểm thử live'
x-i18n:
    generated_at: "2026-06-28T20:43:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 087ec52b395131889d4ae113f304d71199c58dc9f61a1a5e1e511ae4c5b48c0b
    source_path: help/testing-live.md
    workflow: 16
---

Để bắt đầu nhanh, runner QA, bộ kiểm thử đơn vị/tích hợp và các luồng Docker, xem
[Kiểm thử](/vi/help/testing). Trang này bao quát các bộ kiểm thử **trực tiếp** (chạm mạng):
ma trận mô hình, backend CLI, ACP và kiểm thử trực tiếp nhà cung cấp phương tiện,
cùng với cách xử lý thông tin xác thực.

## Trực tiếp: lệnh smoke cục bộ

Xuất khóa nhà cung cấp cần thiết trong môi trường tiến trình trước khi chạy các
kiểm tra trực tiếp ad hoc.

Smoke phương tiện an toàn:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke độ sẵn sàng cuộc gọi thoại an toàn:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` là chạy thử khô trừ khi cũng có `--yes`. Chỉ dùng `--yes`
khi bạn cố ý muốn thực hiện một cuộc gọi thông báo thật. Với Twilio, Telnyx và
Plivo, kiểm tra độ sẵn sàng thành công cần một URL Webhook công khai; các fallback
local loopback/riêng tư chỉ cục bộ bị từ chối theo thiết kế.

## Trực tiếp: quét năng lực Node Android

- Kiểm thử: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Mục tiêu: gọi **mọi lệnh hiện đang được quảng bá** bởi một Node Android đã kết nối và xác nhận hành vi hợp đồng của lệnh.
- Phạm vi:
  - Thiết lập thủ công/có điều kiện trước (bộ kiểm thử không cài đặt/chạy/ghép đôi ứng dụng).
  - Xác thực Gateway `node.invoke` theo từng lệnh cho Node Android đã chọn.
- Thiết lập trước bắt buộc:
  - Ứng dụng Android đã kết nối + ghép đôi với Gateway.
  - Ứng dụng được giữ ở tiền cảnh.
  - Quyền/đồng ý thu thập đã được cấp cho các năng lực bạn kỳ vọng sẽ vượt qua.
- Ghi đè mục tiêu tùy chọn:
  - `OPENCLAW_ANDROID_NODE_ID` hoặc `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Chi tiết thiết lập Android đầy đủ: [Ứng dụng Android](/vi/platforms/android)

## Trực tiếp: smoke mô hình (khóa hồ sơ)

Kiểm thử trực tiếp được chia thành hai lớp để chúng ta có thể cô lập lỗi:

- "Mô hình trực tiếp" cho biết nhà cung cấp/mô hình có thể trả lời với khóa đã cho hay không.
- "Smoke Gateway" cho biết toàn bộ pipeline gateway+agent có hoạt động với mô hình đó hay không (phiên, lịch sử, công cụ, chính sách sandbox, v.v.).

### Lớp 1: Hoàn tất mô hình trực tiếp (không có Gateway)

- Kiểm thử: `src/agents/models.profiles.live.test.ts`
- Mục tiêu:
  - Liệt kê các mô hình đã phát hiện
  - Dùng `getApiKeyForModel` để chọn các mô hình bạn có thông tin xác thực
  - Chạy một hoàn tất nhỏ cho mỗi mô hình (và các hồi quy nhắm mục tiêu khi cần)
- Cách bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
- Đặt `OPENCLAW_LIVE_MODELS=modern`, `small`, hoặc `all` (bí danh của modern) để thật sự chạy bộ này; nếu không, nó sẽ bỏ qua để giữ `pnpm test:live` tập trung vào smoke Gateway
- Cách chọn mô hình:
  - `OPENCLAW_LIVE_MODELS=modern` để chạy allowlist hiện đại (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 5.1, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=small` để chạy allowlist mô hình nhỏ bị ràng buộc (các route Qwen 8B/9B tương thích cục bộ, Ollama Gemma, OpenRouter Qwen/GLM và Z.AI GLM)
  - `OPENCLAW_LIVE_MODELS=all` là bí danh của allowlist hiện đại
  - hoặc `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist phân tách bằng dấu phẩy)
  - Các lần chạy mô hình nhỏ Ollama cục bộ mặc định dùng `http://127.0.0.1:11434`; chỉ đặt `OPENCLAW_LIVE_OLLAMA_BASE_URL` cho endpoint LAN, tùy chỉnh hoặc Ollama Cloud.
  - Các lượt quét modern/all và small mặc định dùng giới hạn được tuyển chọn của chúng; đặt `OPENCLAW_LIVE_MAX_MODELS=0` để quét hồ sơ đã chọn toàn diện hoặc một số dương để dùng giới hạn nhỏ hơn.
  - Các lượt quét toàn diện dùng `OPENCLAW_LIVE_TEST_TIMEOUT_MS` cho toàn bộ timeout kiểm thử mô hình trực tiếp. Mặc định: 60 phút.
  - Probe mô hình trực tiếp mặc định chạy song song 20 luồng; đặt `OPENCLAW_LIVE_MODEL_CONCURRENCY` để ghi đè.
- Cách chọn nhà cung cấp:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist phân tách bằng dấu phẩy)
- Khóa đến từ đâu:
  - Theo mặc định: kho hồ sơ và fallback env
  - Đặt `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để chỉ bắt buộc **kho hồ sơ**
- Vì sao phần này tồn tại:
  - Tách "API nhà cung cấp bị hỏng / khóa không hợp lệ" khỏi "pipeline agent Gateway bị hỏng"
  - Chứa các hồi quy nhỏ, cô lập (ví dụ: phát lại reasoning của OpenAI Responses/Codex Responses + luồng tool-call)

### Lớp 2: Smoke Gateway + agent dev (điều "@openclaw" thật sự làm)

- Kiểm thử: `src/gateway/gateway-models.profiles.live.test.ts`
- Mục tiêu:
  - Khởi chạy một Gateway trong tiến trình
  - Tạo/vá một phiên `agent:dev:*` (ghi đè mô hình cho mỗi lần chạy)
  - Lặp qua các mô hình có khóa và xác nhận:
    - phản hồi "có ý nghĩa" (không có công cụ)
    - một lời gọi công cụ thật hoạt động (probe đọc)
    - các probe công cụ bổ sung tùy chọn (probe exec+read)
    - các đường dẫn hồi quy OpenAI (chỉ tool-call → theo dõi tiếp) tiếp tục hoạt động
- Chi tiết probe (để bạn có thể giải thích lỗi nhanh):
  - probe `read`: kiểm thử ghi một tệp nonce trong workspace và yêu cầu agent `read` tệp đó rồi echo lại nonce.
  - probe `exec+read`: kiểm thử yêu cầu agent dùng `exec` để ghi một nonce vào tệp tạm, rồi `read` lại.
  - probe hình ảnh: kiểm thử đính kèm một PNG được tạo (cat + mã ngẫu nhiên) và kỳ vọng mô hình trả về `cat <CODE>`.
  - Tham chiếu triển khai: `src/gateway/gateway-models.profiles.live.test.ts` và `test/helpers/live-image-probe.ts`.
- Cách bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
- Cách chọn mô hình:
  - Mặc định: allowlist hiện đại (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` để chạy cùng allowlist mô hình nhỏ bị ràng buộc qua toàn bộ pipeline gateway+agent
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` là bí danh của allowlist hiện đại
  - Hoặc đặt `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (hoặc danh sách phân tách bằng dấu phẩy) để thu hẹp
  - Các lượt quét Gateway modern/all và small mặc định dùng giới hạn được tuyển chọn của chúng; đặt `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` để quét lựa chọn toàn diện hoặc một số dương để dùng giới hạn nhỏ hơn.
- Cách chọn nhà cung cấp (tránh "mọi thứ OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist phân tách bằng dấu phẩy)
- Probe công cụ + hình ảnh luôn bật trong kiểm thử trực tiếp này:
  - probe `read` + probe `exec+read` (áp lực công cụ)
  - probe hình ảnh chạy khi mô hình quảng bá hỗ trợ đầu vào hình ảnh
  - Luồng (mức cao):
    - Kiểm thử tạo một PNG nhỏ với "CAT" + mã ngẫu nhiên (`test/helpers/live-image-probe.ts`)
    - Gửi qua `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway phân tích tệp đính kèm thành `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Agent nhúng chuyển tiếp một thông điệp người dùng đa phương thức đến mô hình
    - Xác nhận: phản hồi chứa `cat` + mã (dung sai OCR: cho phép lỗi nhỏ)

<Tip>
Để xem bạn có thể kiểm thử gì trên máy của mình (và các id `provider/model` chính xác), chạy:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Trực tiếp: smoke backend CLI (Claude, Gemini hoặc CLI cục bộ khác)

- Kiểm thử: `src/gateway/gateway-cli-backend.live.test.ts`
- Mục tiêu: xác thực pipeline Gateway + agent bằng backend CLI cục bộ, không chạm vào cấu hình mặc định của bạn.
- Mặc định smoke riêng theo backend nằm cùng định nghĩa `cli-backend.ts` của extension sở hữu.
- Bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Mặc định:
  - Nhà cung cấp/mô hình mặc định: `claude-cli/claude-sonnet-4-6`
  - Hành vi lệnh/args/hình ảnh đến từ metadata Plugin backend CLI sở hữu.
- Ghi đè (tùy chọn):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` để gửi một tệp đính kèm hình ảnh thật (đường dẫn được tiêm vào prompt). Công thức Docker mặc định tắt mục này trừ khi được yêu cầu rõ ràng.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` để truyền đường dẫn tệp hình ảnh dưới dạng args CLI thay vì tiêm prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (hoặc `"list"`) để kiểm soát cách truyền args hình ảnh khi đặt `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` để gửi lượt thứ hai và xác thực luồng tiếp tục.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` để chọn tham gia probe liên tục cùng phiên Claude Sonnet -> Opus khi mô hình đã chọn hỗ trợ mục tiêu chuyển đổi. Công thức Docker mặc định tắt mục này để độ tin cậy tổng hợp tốt hơn.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` để chọn tham gia probe MCP/công cụ loopback. Công thức Docker mặc định tắt mục này trừ khi được yêu cầu rõ ràng.

Ví dụ:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Smoke cấu hình MCP Gemini giá rẻ:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Phần này không yêu cầu Gemini tạo phản hồi. Nó ghi cùng các thiết lập hệ thống
mà OpenClaw cung cấp cho Gemini, rồi chạy `gemini --debug mcp list` để chứng minh
một máy chủ `transport: "streamable-http"` đã lưu được chuẩn hóa thành hình dạng
HTTP MCP của Gemini và có thể kết nối với một máy chủ MCP streamable-HTTP cục bộ.

Công thức Docker:

```bash
pnpm test:docker:live-cli-backend
```

Công thức Docker một nhà cung cấp:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Ghi chú:

- Runner Docker nằm tại `scripts/test-live-cli-backend-docker.sh`.
- Nó chạy smoke backend CLI trực tiếp bên trong image Docker của repo với người dùng `node` không phải root.
- Nó phân giải metadata smoke CLI từ extension sở hữu, rồi cài đặt gói CLI Linux tương ứng (`@anthropic-ai/claude-code` hoặc `@google/gemini-cli`) vào prefix có thể ghi được lưu cache tại `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (mặc định: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` yêu cầu OAuth đăng ký Claude Code di động thông qua `~/.claude/.credentials.json` với `claudeAiOauth.subscriptionType` hoặc `CLAUDE_CODE_OAUTH_TOKEN` từ `claude setup-token`. Trước tiên nó chứng minh `claude -p` trực tiếp trong Docker, rồi chạy hai lượt backend CLI Gateway mà không giữ các biến env khóa API Anthropic. Lane đăng ký này mặc định tắt probe Claude MCP/công cụ và hình ảnh vì nó tiêu thụ giới hạn sử dụng của gói đăng ký đã đăng nhập, và Anthropic có thể thay đổi hành vi tính phí và giới hạn tốc độ của Claude Agent SDK / `claude -p` mà không cần một bản phát hành OpenClaw.
- Smoke backend CLI trực tiếp hiện thực thi cùng một luồng đầu cuối cho Claude và Gemini: lượt văn bản, lượt phân loại hình ảnh, rồi lệnh công cụ MCP `cron` được xác minh qua CLI Gateway.
- Smoke mặc định của Claude cũng vá phiên từ Sonnet sang Opus và xác minh phiên được tiếp tục vẫn nhớ một ghi chú trước đó.

## Trực tiếp: khả năng tiếp cận proxy APNs HTTP/2

- Kiểm thử: `src/infra/push-apns-http2.live.test.ts`
- Mục tiêu: đi đường hầm qua proxy HTTP CONNECT cục bộ tới endpoint APNs sandbox của Apple, gửi yêu cầu xác thực APNs HTTP/2 và xác nhận phản hồi thật `403 InvalidProviderToken` của Apple quay lại qua đường dẫn proxy.
- Bật:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Timeout tùy chọn:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Trực tiếp: smoke bind ACP (`/acp spawn ... --bind here`)

- Kiểm thử: `src/gateway/gateway-acp-bind.live.test.ts`
- Mục tiêu: xác thực luồng bind hội thoại ACP thật với một tác nhân ACP live:
  - gửi `/acp spawn <agent> --bind here`
  - bind tại chỗ một hội thoại kênh tin nhắn tổng hợp
  - gửi một phản hồi theo dõi thông thường trên cùng hội thoại đó
  - xác minh phản hồi theo dõi đi vào bản ghi phiên ACP đã bind
- Bật:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Mặc định:
  - Tác nhân ACP trong Docker: `claude,codex,gemini`
  - Tác nhân ACP cho `pnpm test:live ...` trực tiếp: `claude`
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
  - Lane này dùng bề mặt Gateway `chat.send` với các trường originating-route tổng hợp chỉ dành cho admin, để kiểm thử có thể gắn ngữ cảnh kênh tin nhắn mà không giả vờ phân phối ra bên ngoài.
  - Khi chưa đặt `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND`, kiểm thử dùng registry tác nhân tích hợp sẵn của Plugin `acpx` nhúng cho tác nhân harness ACP đã chọn.
  - Việc tạo MCP Cron cho phiên đã bind mặc định là best-effort vì các harness ACP bên ngoài có thể hủy lệnh gọi MCP sau khi bằng chứng bind/hình ảnh đã vượt qua; đặt `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` để làm cho probe Cron sau bind trở nên nghiêm ngặt.

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

Công thức Docker một tác nhân:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Ghi chú Docker:

- Docker runner nằm tại `scripts/test-live-acp-bind-docker.sh`.
- Theo mặc định, nó chạy smoke bind ACP lần lượt trên các tác nhân CLI live tổng hợp: `claude`, `codex`, rồi `gemini`.
- Dùng `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, hoặc `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` để thu hẹp ma trận.
- Nó đưa vật liệu xác thực CLI tương ứng vào container, rồi cài CLI live được yêu cầu (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid qua `https://app.factory.ai/cli`, `@google/gemini-cli`, hoặc `opencode-ai`) nếu còn thiếu. Chính backend ACP là gói `acpx/runtime` nhúng từ Plugin `acpx` chính thức.
- Biến thể Docker của Droid đưa `~/.factory` vào cho thiết lập, chuyển tiếp `FACTORY_API_KEY`, và yêu cầu khóa API đó vì xác thực OAuth/keyring cục bộ của Factory không di động được vào container. Nó dùng mục registry tích hợp sẵn `droid exec --output-format acp` của ACPX.
- Biến thể Docker của OpenCode là một lane hồi quy nghiêm ngặt cho một tác nhân. Nó ghi một mô hình mặc định `OPENCODE_CONFIG_CONTENT` tạm thời từ `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (mặc định `opencode/kimi-k2.6`), và `pnpm test:docker:live-acp-bind:opencode` yêu cầu bản ghi trợ lý đã bind thay vì chấp nhận bỏ qua chung sau bind.
- Các lệnh gọi CLI `acpx` trực tiếp chỉ là đường dẫn thủ công/giải pháp tạm để so sánh hành vi bên ngoài Gateway. Smoke bind ACP Docker kiểm thử backend runtime `acpx` nhúng của OpenClaw.

## Live: smoke harness app-server Codex

- Mục tiêu: xác thực harness Codex do Plugin sở hữu thông qua phương thức Gateway
  `agent` thông thường:
  - tải Plugin `codex` đi kèm
  - chọn `openai/gpt-5.5`, vốn định tuyến lượt tác nhân OpenAI qua Codex theo mặc định
  - gửi lượt tác nhân Gateway đầu tiên tới `openai/gpt-5.5` với harness Codex đã chọn
  - gửi lượt thứ hai tới cùng phiên OpenClaw và xác minh thread app-server
    có thể tiếp tục
  - chạy `/codex status` và `/codex models` qua cùng đường dẫn lệnh Gateway
  - tùy chọn chạy hai probe shell leo quyền do Guardian duyệt: một lệnh lành tính
    cần được chấp thuận và một lượt tải lên khóa bí mật giả cần bị từ chối
    để tác nhân hỏi lại
- Kiểm thử: `src/gateway/gateway-codex-harness.live.test.ts`
- Bật: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Mô hình mặc định: `openai/gpt-5.5`
- Probe hình ảnh tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Probe MCP/công cụ tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Probe Guardian tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke buộc provider/model `agentRuntime.id: "codex"` để harness Codex bị hỏng
  không thể vượt qua bằng cách âm thầm fallback về OpenClaw.
- Xác thực: xác thực app-server Codex từ đăng nhập đăng ký Codex cục bộ. Smoke Docker
  cũng có thể cung cấp `OPENAI_API_KEY` cho các probe không phải Codex khi áp dụng,
  cùng các bản sao tùy chọn `~/.codex/auth.json` và `~/.codex/config.toml`.

Công thức cục bộ:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Công thức Docker:

```bash
pnpm test:docker:live-codex-harness
```

Ghi chú Docker:

- Docker runner nằm tại `scripts/test-live-codex-harness-docker.sh`.
- Nó truyền `OPENAI_API_KEY`, sao chép các tệp xác thực CLI Codex khi có, cài
  `@openai/codex` vào một tiền tố npm được mount có thể ghi,
  đưa cây nguồn vào, rồi chỉ chạy kiểm thử live harness Codex.
- Docker bật các probe hình ảnh, MCP/công cụ và Guardian theo mặc định. Đặt
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` hoặc
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` hoặc
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` khi bạn cần một lượt debug
  hẹp hơn.
- Docker dùng cùng cấu hình runtime Codex tường minh, nên các bí danh cũ hoặc fallback
  OpenClaw không thể che giấu hồi quy harness Codex.

### Công thức live được khuyến nghị

Các allowlist hẹp, tường minh là nhanh nhất và ít flaky nhất:

- Một mô hình, trực tiếp (không Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Hồ sơ trực tiếp mô hình nhỏ:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Hồ sơ Gateway mô hình nhỏ:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke Ollama Cloud API:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Một mô hình, smoke Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Gọi công cụ trên nhiều provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke trực tiếp Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Trọng tâm Google (khóa API Gemini + Antigravity):
  - Gemini (khóa API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke adaptive thinking của Google:
  - Gemini 3 dynamic mặc định: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dynamic budget: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Ghi chú:

- `google/...` dùng Gemini API (khóa API).
- `google-antigravity/...` dùng cầu nối OAuth Antigravity (endpoint tác nhân kiểu Cloud Code Assist).
- `google-gemini-cli/...` dùng CLI Gemini cục bộ trên máy của bạn (xác thực riêng + khác biệt công cụ).
- Gemini API so với Gemini CLI:
  - API: OpenClaw gọi Gemini API được Google lưu trữ qua HTTP (khóa API / xác thực hồ sơ); đây là điều hầu hết người dùng hiểu là "Gemini".
  - CLI: OpenClaw shell out tới một binary `gemini` cục bộ; nó có xác thực riêng và có thể hoạt động khác (streaming/hỗ trợ công cụ/lệch phiên bản).

## Live: ma trận mô hình (phạm vi chúng ta bao phủ)

Không có "danh sách mô hình CI" cố định (live là opt-in), nhưng đây là các mô hình **được khuyến nghị** để bao phủ thường xuyên trên máy dev có khóa.

### Bộ smoke hiện đại (gọi công cụ + hình ảnh)

Đây là lượt chạy "mô hình phổ biến" mà chúng ta kỳ vọng duy trì hoạt động:

- OpenAI (không phải Codex): `openai/gpt-5.5`
- OpenAI ChatGPT/Codex OAuth: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (hoặc `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` và `google/gemini-3-flash-preview` (tránh các mô hình Gemini 2.x cũ hơn)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` và `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` và `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1` (API chung) hoặc `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Chạy smoke Gateway với công cụ + hình ảnh:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: gọi công cụ (Read + Exec tùy chọn)

Chọn ít nhất một cho mỗi họ provider:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (hoặc `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (hoặc `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1` (API chung) hoặc `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Phạm vi bổ sung tùy chọn (nên có):

- xAI: `xai/grok-4.3` (hoặc mới nhất có sẵn)
- Mistral: `mistral/`… (chọn một mô hình có khả năng "tools" mà bạn đã bật)
- Cerebras: `cerebras/`… (nếu bạn có quyền truy cập)
- LM Studio: `lmstudio/`… (cục bộ; gọi công cụ phụ thuộc vào chế độ API)

### Thị giác: gửi hình ảnh (tệp đính kèm → tin nhắn đa phương thức)

Bao gồm ít nhất một mô hình có khả năng xử lý hình ảnh trong `OPENCLAW_LIVE_GATEWAY_MODELS` (các biến thể Claude/Gemini/OpenAI có khả năng thị giác, v.v.) để chạy probe hình ảnh.

### Bộ tổng hợp / Gateway thay thế

Nếu bạn đã bật khóa, chúng ta cũng hỗ trợ kiểm thử qua:

- OpenRouter: `openrouter/...` (hàng trăm mô hình; dùng `openclaw models scan` để tìm ứng viên có khả năng công cụ+hình ảnh)
- OpenCode: `opencode/...` cho Zen và `opencode-go/...` cho Go (xác thực qua `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Các provider khác bạn có thể đưa vào ma trận live (nếu bạn có thông tin xác thực/cấu hình):

- Tích hợp sẵn: `openai`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Qua `models.providers` (điểm cuối tùy chỉnh): `minimax` (đám mây/API), cộng với mọi proxy tương thích OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, v.v.)

<Tip>
Đừng hardcode "tất cả mô hình" trong tài liệu. Danh sách có thẩm quyền là bất cứ gì `discoverModels(...)` trả về trên máy của bạn cộng với mọi khóa có sẵn.
</Tip>

## Thông tin xác thực (không bao giờ commit)

Kiểm thử live phát hiện thông tin xác thực giống cách CLI làm. Hệ quả thực tế:

- Nếu CLI hoạt động, kiểm thử live sẽ tìm thấy cùng các khóa.
- Nếu kiểm thử live báo "không có thông tin xác thực", hãy debug giống cách bạn debug `openclaw models list` / lựa chọn mô hình.

- Hồ sơ xác thực theo agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (đây là ý nghĩa của "khóa hồ sơ" trong các kiểm thử live)
- Cấu hình: `~/.openclaw/openclaw.json` (hoặc `OPENCLAW_CONFIG_PATH`)
- Thư mục trạng thái legacy: `~/.openclaw/credentials/` (được sao chép vào home live được dàn dựng khi có, nhưng không phải kho khóa hồ sơ chính)
- Các lần chạy live cục bộ mặc định sao chép cấu hình đang hoạt động, các tệp `auth-profiles.json` theo agent, `credentials/` legacy, và các thư mục xác thực CLI bên ngoài được hỗ trợ vào một home kiểm thử tạm; các home live được dàn dựng bỏ qua `workspace/` và `sandboxes/`, đồng thời các ghi đè đường dẫn `agents.*.workspace` / `agentDir` bị loại bỏ để các probe không chạm vào workspace thật trên máy chủ của bạn.

Nếu bạn muốn dựa vào khóa môi trường, hãy export chúng trước khi kiểm thử cục bộ hoặc dùng các runner
Docker bên dưới với `OPENCLAW_PROFILE_FILE` tường minh.

## Deepgram live (phiên âm âm thanh)

- Kiểm thử: `extensions/deepgram/audio.live.test.ts`
- Bật: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Kế hoạch lập trình BytePlus live

- Kiểm thử: `extensions/byteplus/live.test.ts`
- Bật: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Ghi đè mô hình tùy chọn: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Phương tiện workflow ComfyUI live

- Kiểm thử: `extensions/comfy/comfy.live.test.ts`
- Bật: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Phạm vi:
  - Thực thi các đường dẫn hình ảnh, video và `music_generate` comfy được đóng gói
  - Bỏ qua từng capability trừ khi `plugins.entries.comfy.config.<capability>` được cấu hình
  - Hữu ích sau khi thay đổi việc gửi workflow comfy, polling, tải xuống hoặc đăng ký Plugin

## Tạo hình ảnh live

- Kiểm thử: `test/image-generation.runtime.live.test.ts`
- Lệnh: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Phạm vi:
  - Liệt kê mọi Plugin nhà cung cấp tạo hình ảnh đã đăng ký
  - Dùng các biến môi trường nhà cung cấp đã export trước khi probe
  - Mặc định dùng khóa API live/env trước các hồ sơ xác thực đã lưu, để khóa kiểm thử cũ trong `auth-profiles.json` không che khuất thông tin xác thực shell thật
  - Bỏ qua các nhà cung cấp không có xác thực/hồ sơ/mô hình dùng được
  - Chạy từng nhà cung cấp đã cấu hình qua runtime tạo hình ảnh dùng chung:
    - `<provider>:generate`
    - `<provider>:edit` khi nhà cung cấp khai báo hỗ trợ chỉnh sửa
- Các nhà cung cấp đóng gói hiện được bao phủ:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để ép xác thực bằng kho hồ sơ và bỏ qua các ghi đè chỉ có env

Đối với đường dẫn CLI đã phát hành, hãy thêm một smoke `infer` sau khi kiểm thử live
nhà cung cấp/runtime vượt qua:

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
Plugin đóng gói, runtime tạo hình ảnh dùng chung, và yêu cầu nhà cung cấp live.
Các phụ thuộc Plugin được kỳ vọng có mặt trước khi tải runtime.

## Tạo nhạc live

- Kiểm thử: `extensions/music-generation-providers.live.test.ts`
- Bật: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Phạm vi:
  - Thực thi đường dẫn nhà cung cấp tạo nhạc đóng gói dùng chung
  - Hiện bao phủ Google và MiniMax
  - Dùng các biến môi trường nhà cung cấp đã export trước khi probe
  - Mặc định dùng khóa API live/env trước các hồ sơ xác thực đã lưu, để khóa kiểm thử cũ trong `auth-profiles.json` không che khuất thông tin xác thực shell thật
  - Bỏ qua các nhà cung cấp không có xác thực/hồ sơ/mô hình dùng được
  - Chạy cả hai chế độ runtime đã khai báo khi có:
    - `generate` với đầu vào chỉ có prompt
    - `edit` khi nhà cung cấp khai báo `capabilities.edit.enabled`
  - Phạm vi bao phủ lane chung hiện tại:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: tệp live Comfy riêng, không thuộc lượt quét chung này
- Thu hẹp tùy chọn:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Hành vi xác thực tùy chọn:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để ép xác thực bằng kho hồ sơ và bỏ qua các ghi đè chỉ có env

## Tạo video live

- Kiểm thử: `extensions/video-generation-providers.live.test.ts`
- Bật: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Phạm vi:
  - Thực thi đường dẫn nhà cung cấp tạo video đóng gói dùng chung
  - Mặc định dùng luồng smoke an toàn cho phát hành: các nhà cung cấp không phải FAL, một yêu cầu text-to-video cho mỗi nhà cung cấp, prompt tôm hùm một giây, và giới hạn thao tác theo nhà cung cấp từ `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (mặc định là `180000`)
  - Mặc định bỏ qua FAL vì độ trễ hàng đợi phía nhà cung cấp có thể chiếm phần lớn thời gian phát hành; truyền `--video-providers fal` hoặc `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` để chạy tường minh
  - Dùng các biến môi trường nhà cung cấp đã export trước khi probe
  - Mặc định dùng khóa API live/env trước các hồ sơ xác thực đã lưu, để khóa kiểm thử cũ trong `auth-profiles.json` không che khuất thông tin xác thực shell thật
  - Bỏ qua các nhà cung cấp không có xác thực/hồ sơ/mô hình dùng được
  - Mặc định chỉ chạy `generate`
  - Đặt `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` để cũng chạy các chế độ biến đổi đã khai báo khi có:
    - `imageToVideo` khi nhà cung cấp khai báo `capabilities.imageToVideo.enabled` và nhà cung cấp/mô hình đã chọn chấp nhận đầu vào hình ảnh cục bộ dựa trên buffer trong lượt quét chung
    - `videoToVideo` khi nhà cung cấp khai báo `capabilities.videoToVideo.enabled` và nhà cung cấp/mô hình đã chọn chấp nhận đầu vào video cục bộ dựa trên buffer trong lượt quét chung
  - Các nhà cung cấp `imageToVideo` hiện được khai báo nhưng bị bỏ qua trong lượt quét chung:
    - `vydra` vì `veo3` đóng gói chỉ hỗ trợ văn bản và `kling` đóng gói yêu cầu URL hình ảnh từ xa
  - Phạm vi bao phủ Vydra theo nhà cung cấp:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - tệp đó chạy `veo3` text-to-video cộng với một lane `kling` mặc định dùng dữ liệu cố định URL hình ảnh từ xa
  - Phạm vi bao phủ live `videoToVideo` hiện tại:
    - chỉ `runway` khi mô hình đã chọn là `runway/gen4_aleph`
  - Các nhà cung cấp `videoToVideo` hiện được khai báo nhưng bị bỏ qua trong lượt quét chung:
    - `alibaba`, `qwen`, `xai` vì các đường dẫn đó hiện yêu cầu URL tham chiếu `http(s)` / MP4 từ xa
    - `google` vì lane Gemini/Veo dùng chung hiện tại dùng đầu vào cục bộ dựa trên buffer và đường dẫn đó không được chấp nhận trong lượt quét chung
    - `openai` vì lane dùng chung hiện tại thiếu bảo đảm quyền truy cập chỉnh sửa video theo tổ chức
- Thu hẹp tùy chọn:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` để bao gồm mọi nhà cung cấp trong lượt quét mặc định, bao gồm FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` để giảm giới hạn từng thao tác nhà cung cấp cho một lần chạy smoke quyết liệt
- Hành vi xác thực tùy chọn:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để ép xác thực bằng kho hồ sơ và bỏ qua các ghi đè chỉ có env

## Harness live cho phương tiện

- Lệnh: `pnpm test:live:media`
- Mục đích:
  - Chạy các bộ live hình ảnh, nhạc và video dùng chung qua một entrypoint gốc của repo
  - Dùng các biến môi trường nhà cung cấp đã export
  - Mặc định tự động thu hẹp từng bộ xuống các nhà cung cấp hiện có xác thực dùng được
  - Tái sử dụng `scripts/test-live.mjs`, nên hành vi Heartbeat và chế độ quiet vẫn nhất quán
- Ví dụ:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Liên quan

- [Kiểm thử](/vi/help/testing) - các bộ unit, tích hợp, QA và Docker
