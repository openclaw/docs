---
read_when:
    - Chạy các kiểm thử khói ma trận mô hình trực tiếp / phần phụ trợ CLI / ACP / media-provider
    - Gỡ lỗi quá trình phân giải thông tin xác thực cho kiểm thử trực tiếp
    - Thêm một kiểm thử trực tiếp mới dành riêng cho nhà cung cấp
sidebarTitle: Live tests
summary: 'Kiểm thử trực tiếp (có truy cập mạng): ma trận mô hình, backend CLI, ACP, nhà cung cấp phương tiện, thông tin xác thực'
title: 'Kiểm thử: bộ kiểm thử trực tiếp'
x-i18n:
    generated_at: "2026-05-06T09:16:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: a17a8065fd15c6d86ab782cb1fdb00d0b2558be2d43fb7cab3ca6e511055b82e
    source_path: help/testing-live.md
    workflow: 16
---

Để bắt đầu nhanh, trình chạy QA, bộ kiểm thử đơn vị/tích hợp và các luồng Docker, xem
[Kiểm thử](/vi/help/testing). Trang này bao quát các bộ kiểm thử **trực tiếp** (chạm mạng):
ma trận mô hình, backend CLI, ACP, và kiểm thử trực tiếp nhà cung cấp media, cộng với
xử lý thông tin xác thực.

## Trực tiếp: lệnh kiểm thử khói hồ sơ cục bộ

Nạp `~/.profile` trước các kiểm tra trực tiếp tùy biến để khóa nhà cung cấp và đường dẫn công cụ cục bộ
khớp với shell của bạn:

```bash
source ~/.profile
```

Kiểm thử khói media an toàn:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Kiểm thử khói khả năng sẵn sàng cuộc gọi thoại an toàn:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` là một lần chạy thử nếu không có thêm `--yes`. Chỉ dùng `--yes`
khi bạn chủ ý muốn thực hiện một cuộc gọi thông báo thật. Với Twilio, Telnyx và
Plivo, kiểm tra khả năng sẵn sàng thành công cần một URL Webhook công khai; các
phương án dự phòng local loopback/chỉ cục bộ/riêng tư bị từ chối theo thiết kế.

## Trực tiếp: quét khả năng của node Android

- Kiểm thử: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Mục tiêu: gọi **mọi lệnh hiện đang được quảng bá** bởi một node Android đã kết nối và xác nhận hành vi hợp đồng lệnh.
- Phạm vi:
  - Thiết lập thủ công/có điều kiện tiên quyết (bộ kiểm thử không cài đặt/chạy/ghép đôi ứng dụng).
  - Xác thực `node.invoke` từng lệnh qua Gateway cho node Android đã chọn.
- Thiết lập trước bắt buộc:
  - Ứng dụng Android đã kết nối + ghép đôi với gateway.
  - Giữ ứng dụng ở tiền cảnh.
  - Quyền/đồng ý ghi nhận đã được cấp cho các khả năng bạn kỳ vọng sẽ vượt qua.
- Ghi đè mục tiêu tùy chọn:
  - `OPENCLAW_ANDROID_NODE_ID` hoặc `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Chi tiết thiết lập Android đầy đủ: [Ứng dụng Android](/vi/platforms/android)

## Trực tiếp: kiểm thử khói mô hình (khóa hồ sơ)

Kiểm thử trực tiếp được tách thành hai lớp để chúng ta có thể cô lập lỗi:

- "Mô hình trực tiếp" cho biết nhà cung cấp/mô hình có thể trả lời bằng khóa đã cho hay không.
- "Kiểm thử khói Gateway" cho biết toàn bộ pipeline gateway+tác nhân có hoạt động với mô hình đó hay không (phiên, lịch sử, công cụ, chính sách sandbox, v.v.).

### Lớp 1: hoàn tất mô hình trực tiếp (không có gateway)

- Kiểm thử: `src/agents/models.profiles.live.test.ts`
- Mục tiêu:
  - Liệt kê các mô hình đã phát hiện
  - Dùng `getApiKeyForModel` để chọn các mô hình bạn có thông tin xác thực
  - Chạy một lượt hoàn tất nhỏ cho mỗi mô hình (và các hồi quy có mục tiêu khi cần)
- Cách bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
- Đặt `OPENCLAW_LIVE_MODELS=modern` (hoặc `all`, bí danh cho modern) để thực sự chạy bộ kiểm thử này; nếu không, nó sẽ bỏ qua để giữ `pnpm test:live` tập trung vào kiểm thử khói gateway
- Cách chọn mô hình:
  - `OPENCLAW_LIVE_MODELS=modern` để chạy danh sách cho phép hiện đại (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` là bí danh cho danh sách cho phép hiện đại
  - hoặc `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (danh sách cho phép phân tách bằng dấu phẩy)
  - Các lượt quét modern/all mặc định dùng một giới hạn được tuyển chọn có tín hiệu cao; đặt `OPENCLAW_LIVE_MAX_MODELS=0` để quét hiện đại toàn diện hoặc một số dương để dùng giới hạn nhỏ hơn.
  - Lượt quét toàn diện dùng `OPENCLAW_LIVE_TEST_TIMEOUT_MS` cho thời gian chờ của toàn bộ kiểm thử mô hình trực tiếp. Mặc định: 60 phút.
  - Các đầu dò mô hình trực tiếp mặc định chạy song song 20 luồng; đặt `OPENCLAW_LIVE_MODEL_CONCURRENCY` để ghi đè.
- Cách chọn nhà cung cấp:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (danh sách cho phép phân tách bằng dấu phẩy)
- Khóa đến từ đâu:
  - Mặc định: kho hồ sơ và phương án dự phòng env
  - Đặt `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để chỉ bắt buộc dùng **kho hồ sơ**
- Lý do tồn tại:
  - Tách "API nhà cung cấp bị hỏng / khóa không hợp lệ" khỏi "pipeline tác nhân gateway bị hỏng"
  - Chứa các hồi quy nhỏ, cô lập (ví dụ: luồng phát lại suy luận OpenAI Responses/Codex Responses + gọi công cụ)

### Lớp 2: Gateway + kiểm thử khói tác nhân dev (thứ "@openclaw" thực sự làm)

- Kiểm thử: `src/gateway/gateway-models.profiles.live.test.ts`
- Mục tiêu:
  - Khởi chạy một gateway trong tiến trình
  - Tạo/vá một phiên `agent:dev:*` (ghi đè mô hình cho mỗi lần chạy)
  - Duyệt các mô hình có khóa và xác nhận:
    - phản hồi "có ý nghĩa" (không có công cụ)
    - một lần gọi công cụ thật hoạt động (đầu dò đọc)
    - đầu dò công cụ bổ sung tùy chọn (đầu dò exec+đọc)
    - các đường dẫn hồi quy OpenAI (chỉ gọi công cụ → theo dõi tiếp) tiếp tục hoạt động
- Chi tiết đầu dò (để bạn có thể giải thích lỗi nhanh):
  - Đầu dò `read`: kiểm thử ghi một tệp nonce trong workspace và yêu cầu tác nhân `read` nó rồi vọng lại nonce.
  - Đầu dò `exec+read`: kiểm thử yêu cầu tác nhân dùng `exec` để ghi một nonce vào tệp tạm, rồi `read` nó lại.
  - Đầu dò hình ảnh: kiểm thử đính kèm một PNG được tạo (mèo + mã ngẫu nhiên) và kỳ vọng mô hình trả về `cat <CODE>`.
  - Tham chiếu triển khai: `src/gateway/gateway-models.profiles.live.test.ts` và `src/gateway/live-image-probe.ts`.
- Cách bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
- Cách chọn mô hình:
  - Mặc định: danh sách cho phép hiện đại (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` là bí danh cho danh sách cho phép hiện đại
  - Hoặc đặt `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (hoặc danh sách phân tách bằng dấu phẩy) để thu hẹp
  - Các lượt quét gateway modern/all mặc định dùng một giới hạn được tuyển chọn có tín hiệu cao; đặt `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` để quét hiện đại toàn diện hoặc một số dương để dùng giới hạn nhỏ hơn.
- Cách chọn nhà cung cấp (tránh "mọi thứ OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (danh sách cho phép phân tách bằng dấu phẩy)
- Đầu dò công cụ + hình ảnh luôn bật trong kiểm thử trực tiếp này:
  - Đầu dò `read` + đầu dò `exec+read` (áp lực công cụ)
  - đầu dò hình ảnh chạy khi mô hình quảng bá hỗ trợ đầu vào hình ảnh
  - Luồng (mức cao):
    - Kiểm thử tạo một PNG nhỏ với "CAT" + mã ngẫu nhiên (`src/gateway/live-image-probe.ts`)
    - Gửi nó qua `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway phân tích tệp đính kèm thành `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Tác nhân nhúng chuyển tiếp một thông điệp người dùng đa phương thức đến mô hình
    - Xác nhận: phản hồi chứa `cat` + mã (dung sai OCR: cho phép lỗi nhỏ)

<Tip>
Để xem bạn có thể kiểm thử gì trên máy của mình (và các id `provider/model` chính xác), chạy:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Trực tiếp: kiểm thử khói backend CLI (Claude, Codex, Gemini hoặc CLI cục bộ khác)

- Kiểm thử: `src/gateway/gateway-cli-backend.live.test.ts`
- Mục tiêu: xác thực pipeline Gateway + tác nhân bằng một backend CLI cục bộ, không chạm vào cấu hình mặc định của bạn.
- Mặc định kiểm thử khói theo backend nằm trong định nghĩa `cli-backend.ts` của Plugin sở hữu.
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
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` để gửi một tệp đính kèm hình ảnh thật (đường dẫn được chèn vào prompt). Công thức Docker mặc định tắt mục này trừ khi được yêu cầu rõ ràng.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` để truyền đường dẫn tệp hình ảnh dưới dạng đối số CLI thay vì chèn vào prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (hoặc `"list"`) để kiểm soát cách truyền đối số hình ảnh khi đặt `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` để gửi lượt thứ hai và xác thực luồng tiếp tục.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` để chọn tham gia đầu dò liên tục cùng phiên Claude Sonnet -> Opus khi mô hình đã chọn hỗ trợ mục tiêu chuyển đổi. Công thức Docker mặc định tắt mục này để có độ tin cậy tổng hợp.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` để chọn tham gia đầu dò MCP/công cụ loopback. Công thức Docker mặc định tắt mục này trừ khi được yêu cầu rõ ràng.

Ví dụ:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Kiểm thử khói cấu hình Gemini MCP rẻ:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Việc này không yêu cầu Gemini tạo phản hồi. Nó ghi cùng các thiết lập hệ thống
OpenClaw cung cấp cho Gemini, rồi chạy `gemini --debug mcp list` để chứng minh một
máy chủ `transport: "streamable-http"` đã lưu được chuẩn hóa thành hình dạng HTTP MCP
của Gemini và có thể kết nối với một máy chủ MCP streamable-HTTP cục bộ.

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
- Nó chạy kiểm thử khói backend CLI trực tiếp bên trong image Docker của repo với người dùng `node` không phải root.
- Nó phân giải metadata kiểm thử khói CLI từ phần mở rộng sở hữu, rồi cài đặt gói CLI Linux phù hợp (`@anthropic-ai/claude-code`, `@openai/codex`, hoặc `@google/gemini-cli`) vào một tiền tố có thể ghi được lưu đệm tại `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (mặc định: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` yêu cầu OAuth đăng ký Claude Code khả chuyển thông qua `~/.claude/.credentials.json` với `claudeAiOauth.subscriptionType` hoặc `CLAUDE_CODE_OAUTH_TOKEN` từ `claude setup-token`. Trước tiên nó chứng minh `claude -p` trực tiếp trong Docker, rồi chạy hai lượt backend CLI Gateway mà không giữ lại biến env khóa API Anthropic. Lane đăng ký này mặc định tắt đầu dò Claude MCP/công cụ và hình ảnh vì Claude hiện định tuyến việc dùng ứng dụng bên thứ ba qua tính phí sử dụng bổ sung thay vì giới hạn gói đăng ký thông thường.
- Kiểm thử khói backend CLI trực tiếp hiện kiểm tra cùng một luồng đầu cuối cho Claude, Codex và Gemini: lượt văn bản, lượt phân loại hình ảnh, rồi lệnh gọi công cụ MCP `cron` được xác minh qua CLI gateway.
- Kiểm thử khói mặc định của Claude cũng vá phiên từ Sonnet sang Opus và xác minh phiên được tiếp tục vẫn nhớ một ghi chú trước đó.

## Trực tiếp: khả năng kết nối proxy APNs HTTP/2

- Kiểm thử: `src/infra/push-apns-http2.live.test.ts`
- Mục tiêu: đi đường hầm qua một proxy HTTP CONNECT cục bộ đến endpoint APNs sandbox của Apple, gửi yêu cầu xác thực APNs HTTP/2 và xác nhận phản hồi thật `403 InvalidProviderToken` của Apple quay lại qua đường dẫn proxy.
- Bật:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Thời gian chờ tùy chọn:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Trực tiếp: kiểm thử khói bind ACP (`/acp spawn ... --bind here`)

- Kiểm thử: `src/gateway/gateway-acp-bind.live.test.ts`
- Mục tiêu: xác thực luồng bind cuộc hội thoại ACP thật với một agent ACP live:
  - gửi `/acp spawn <agent> --bind here`
  - bind tại chỗ một cuộc hội thoại kênh tin nhắn tổng hợp
  - gửi một lượt theo dõi thông thường trên cùng cuộc hội thoại đó
  - xác minh lượt theo dõi đi vào transcript của phiên ACP đã bind
- Bật:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Mặc định:
  - Các agent ACP trong Docker: `claude,codex,gemini`
  - Agent ACP cho `pnpm test:live ...` trực tiếp: `claude`
  - Kênh tổng hợp: ngữ cảnh cuộc hội thoại kiểu Slack DM
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
  - Lane này dùng bề mặt `chat.send` của gateway với các trường originating-route tổng hợp chỉ dành cho admin để kiểm thử có thể gắn ngữ cảnh kênh tin nhắn mà không giả vờ gửi ra bên ngoài.
  - Khi `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` chưa được đặt, kiểm thử dùng registry agent tích hợp sẵn của Plugin `acpx` được nhúng cho agent harness ACP đã chọn.
  - Việc tạo MCP cron cho phiên đã bind mặc định là best-effort vì các harness ACP bên ngoài có thể hủy lệnh gọi MCP sau khi bằng chứng bind/hình ảnh đã vượt qua; đặt `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` để làm probe cron sau bind trở nên nghiêm ngặt.

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

Các công thức Docker cho một agent:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Ghi chú Docker:

- Docker runner nằm tại `scripts/test-live-acp-bind-docker.sh`.
- Theo mặc định, nó chạy smoke ACP bind tuần tự trên các agent CLI live tổng hợp: `claude`, `codex`, rồi `gemini`.
- Dùng `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, hoặc `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` để thu hẹp ma trận.
- Nó source `~/.profile`, stage vật liệu auth CLI tương ứng vào container, rồi cài CLI live được yêu cầu (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid qua `https://app.factory.ai/cli`, `@google/gemini-cli`, hoặc `opencode-ai`) nếu còn thiếu. Bản thân backend ACP là package `acpx/runtime` được nhúng từ Plugin `acpx` chính thức.
- Biến thể Docker của Droid stage `~/.factory` cho cài đặt, chuyển tiếp `FACTORY_API_KEY`, và yêu cầu API key đó vì auth OAuth/keyring cục bộ của Factory không thể mang sang container. Nó dùng mục registry tích hợp sẵn của ACPX là `droid exec --output-format acp`.
- Biến thể Docker của OpenCode là một lane hồi quy một agent nghiêm ngặt. Nó ghi model mặc định `OPENCODE_CONFIG_CONTENT` tạm thời từ `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (mặc định `opencode/kimi-k2.6`) sau khi source `~/.profile`, và `pnpm test:docker:live-acp-bind:opencode` yêu cầu transcript assistant đã bind thay vì chấp nhận bỏ qua hậu bind chung.
- Các lệnh gọi CLI `acpx` trực tiếp chỉ là đường dẫn thủ công/khắc phục tạm thời để so sánh hành vi bên ngoài Gateway. Smoke Docker ACP bind kiểm tra backend runtime `acpx` được nhúng của OpenClaw.

## Live: smoke harness app-server Codex

- Mục tiêu: xác thực harness Codex do Plugin sở hữu thông qua phương thức gateway
  `agent` thông thường:
  - tải Plugin `codex` đi kèm
  - chọn `OPENCLAW_AGENT_RUNTIME=codex`
  - gửi lượt agent gateway đầu tiên tới `openai/gpt-5.5` với harness Codex bị ép dùng
  - gửi lượt thứ hai tới cùng phiên OpenClaw và xác minh thread app-server
    có thể tiếp tục
  - chạy `/codex status` và `/codex models` qua cùng đường dẫn lệnh gateway
  - tùy chọn chạy hai probe shell nâng quyền đã được Guardian duyệt: một lệnh
    vô hại nên được phê duyệt và một lệnh tải lên bí mật giả nên bị từ chối
    để agent hỏi lại
- Kiểm thử: `src/gateway/gateway-codex-harness.live.test.ts`
- Bật: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model mặc định: `openai/gpt-5.5`
- Probe hình ảnh tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Probe MCP/tool tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Probe Guardian tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke dùng `agentRuntime.id: "codex"` để một harness Codex bị hỏng không thể
  vượt qua bằng cách âm thầm fallback về PI.
- Auth: auth app-server Codex từ đăng nhập thuê bao Codex cục bộ. Các smoke Docker
  cũng có thể cung cấp `OPENAI_API_KEY` cho các probe không phải Codex khi áp dụng,
  cùng với `~/.codex/auth.json` và `~/.codex/config.toml` được sao chép tùy chọn.

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

- Docker runner nằm tại `scripts/test-live-codex-harness-docker.sh`.
- Nó source `~/.profile` đã mount, truyền `OPENAI_API_KEY`, sao chép các tệp auth
  CLI Codex khi có, cài `@openai/codex` vào một prefix npm đã mount có thể ghi,
  stage cây nguồn, rồi chỉ chạy kiểm thử live Codex-harness.
- Docker bật mặc định các probe hình ảnh, MCP/tool, và Guardian. Đặt
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` hoặc
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` hoặc
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` khi bạn cần một lần chạy debug
  hẹp hơn.
- Docker dùng cùng cấu hình runtime Codex rõ ràng, nên alias cũ hoặc fallback PI
  không thể che giấu hồi quy harness Codex.

### Công thức live được khuyến nghị

Allowlist hẹp, rõ ràng là nhanh nhất và ít flaky nhất:

- Một model, trực tiếp (không gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Một model, smoke gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling trên nhiều provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tập trung Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke adaptive thinking của Google:
  - Nếu khóa cục bộ nằm trong shell profile: `source ~/.profile`
  - Gemini 3 mặc định động: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 ngân sách động: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Ghi chú:

- `google/...` dùng Gemini API (API key).
- `google-antigravity/...` dùng cầu nối OAuth Antigravity (endpoint agent kiểu Cloud Code Assist).
- `google-gemini-cli/...` dùng Gemini CLI cục bộ trên máy của bạn (auth riêng + đặc thù tooling).
- Gemini API so với Gemini CLI:
  - API: OpenClaw gọi Gemini API được Google lưu trữ qua HTTP (API key / auth profile); đây là điều phần lớn người dùng hiểu là "Gemini".
  - CLI: OpenClaw shell out tới binary `gemini` cục bộ; nó có auth riêng và có thể hành xử khác (hỗ trợ streaming/tool/độ lệch phiên bản).

## Live: ma trận model (những gì chúng ta bao phủ)

Không có "danh sách model CI" cố định (live là opt-in), nhưng đây là các model **được khuyến nghị** để bao phủ thường xuyên trên máy phát triển có khóa.

### Bộ smoke hiện đại (tool calling + hình ảnh)

Đây là lần chạy "model phổ biến" mà chúng ta kỳ vọng giữ hoạt động:

- OpenAI (không phải Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (hoặc `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` và `google/gemini-3-flash-preview` (tránh các model Gemini 2.x cũ hơn)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` và `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` và `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Chạy smoke gateway với tools + hình ảnh:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: tool calling (Read + Exec tùy chọn)

Chọn ít nhất một model cho mỗi nhóm provider:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (hoặc `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (hoặc `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Phạm vi bổ sung tùy chọn (nên có):

- xAI: `xai/grok-4.3` (hoặc bản mới nhất có sẵn)
- Mistral: `mistral/`… (chọn một model có khả năng "tools" mà bạn đã bật)
- Cerebras: `cerebras/`… (nếu bạn có quyền truy cập)
- LM Studio: `lmstudio/`… (cục bộ; tool calling phụ thuộc vào chế độ API)

### Vision: gửi hình ảnh (attachment → tin nhắn đa phương thức)

Bao gồm ít nhất một model có khả năng xử lý hình ảnh trong `OPENCLAW_LIVE_GATEWAY_MODELS` (các biến thể Claude/Gemini/OpenAI có khả năng vision, v.v.) để kiểm tra probe hình ảnh.

### Aggregator / gateway thay thế

Nếu bạn đã bật khóa, chúng ta cũng hỗ trợ kiểm thử qua:

- OpenRouter: `openrouter/...` (hàng trăm model; dùng `openclaw models scan` để tìm ứng viên có khả năng tool+hình ảnh)
- OpenCode: `opencode/...` cho Zen và `opencode-go/...` cho Go (auth qua `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Các provider khác bạn có thể đưa vào ma trận live (nếu có credential/cấu hình):

- Tích hợp sẵn: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Qua `models.providers` (endpoint tùy chỉnh): `minimax` (cloud/API), cộng với mọi proxy tương thích OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, v.v.)

<Tip>
Không hardcode "tất cả model" trong tài liệu. Danh sách có thẩm quyền là bất cứ gì `discoverModels(...)` trả về trên máy của bạn cộng với các khóa đang có.
</Tip>

## Credential (không bao giờ commit)

Kiểm thử live phát hiện credential giống cách CLI làm. Hệ quả thực tế:

- Nếu CLI hoạt động, kiểm thử live sẽ tìm thấy cùng các khóa.
- Nếu một kiểm thử live báo "no creds", hãy debug giống như cách bạn debug `openclaw models list` / lựa chọn model.

- Hồ sơ xác thực theo từng tác nhân: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (đây là ý nghĩa của "khóa hồ sơ" trong các kiểm thử trực tiếp)
- Cấu hình: `~/.openclaw/openclaw.json` (hoặc `OPENCLAW_CONFIG_PATH`)
- Thư mục trạng thái cũ: `~/.openclaw/credentials/` (được sao chép vào thư mục home trực tiếp theo giai đoạn khi có, nhưng không phải kho khóa hồ sơ chính)
- Các lần chạy cục bộ trực tiếp mặc định sao chép cấu hình đang hoạt động, các tệp `auth-profiles.json` theo từng tác nhân, `credentials/` cũ, và các thư mục xác thực CLI bên ngoài được hỗ trợ vào một thư mục home kiểm thử tạm thời; các thư mục home trực tiếp theo giai đoạn bỏ qua `workspace/` và `sandboxes/`, và các ghi đè đường dẫn `agents.*.workspace` / `agentDir` bị loại bỏ để các phép dò không chạm vào không gian làm việc máy chủ thật của bạn.

Nếu bạn muốn dựa vào khóa môi trường (ví dụ đã export trong `~/.profile`), hãy chạy kiểm thử cục bộ sau khi `source ~/.profile`, hoặc dùng các trình chạy Docker bên dưới (chúng có thể mount `~/.profile` vào container).

## Deepgram trực tiếp (phiên âm âm thanh)

- Kiểm thử: `extensions/deepgram/audio.live.test.ts`
- Bật: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Kế hoạch lập trình BytePlus trực tiếp

- Kiểm thử: `extensions/byteplus/live.test.ts`
- Bật: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Ghi đè mô hình tùy chọn: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Phương tiện quy trình ComfyUI trực tiếp

- Kiểm thử: `extensions/comfy/comfy.live.test.ts`
- Bật: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Phạm vi:
  - Thực thi các đường dẫn hình ảnh, video và `music_generate` comfy đi kèm
  - Bỏ qua từng khả năng trừ khi `plugins.entries.comfy.config.<capability>` được cấu hình
  - Hữu ích sau khi thay đổi việc gửi quy trình comfy, polling, tải xuống hoặc đăng ký Plugin

## Tạo hình ảnh trực tiếp

- Kiểm thử: `test/image-generation.runtime.live.test.ts`
- Lệnh: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Phạm vi:
  - Liệt kê mọi Plugin nhà cung cấp tạo hình ảnh đã đăng ký
  - Tải các biến môi trường nhà cung cấp còn thiếu từ shell đăng nhập của bạn (`~/.profile`) trước khi dò
  - Mặc định dùng khóa API trực tiếp/môi trường trước các hồ sơ xác thực đã lưu, để các khóa kiểm thử cũ trong `auth-profiles.json` không che khuất thông tin xác thực shell thật
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để buộc xác thực bằng kho hồ sơ và bỏ qua các ghi đè chỉ từ môi trường

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

Điều này bao phủ phân tích đối số CLI, phân giải cấu hình/tác nhân mặc định, kích hoạt Plugin đi kèm, runtime tạo hình ảnh dùng chung và yêu cầu nhà cung cấp trực tiếp. Các phụ thuộc của Plugin được kỳ vọng có sẵn trước khi tải runtime.

## Tạo nhạc trực tiếp

- Kiểm thử: `extensions/music-generation-providers.live.test.ts`
- Bật: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Phạm vi:
  - Thực thi đường dẫn nhà cung cấp tạo nhạc đi kèm dùng chung
  - Hiện bao phủ Google và MiniMax
  - Tải biến môi trường nhà cung cấp từ shell đăng nhập của bạn (`~/.profile`) trước khi dò
  - Mặc định dùng khóa API trực tiếp/môi trường trước các hồ sơ xác thực đã lưu, để các khóa kiểm thử cũ trong `auth-profiles.json` không che khuất thông tin xác thực shell thật
  - Bỏ qua các nhà cung cấp không có xác thực/hồ sơ/mô hình dùng được
  - Chạy cả hai chế độ runtime đã khai báo khi có:
    - `generate` với đầu vào chỉ có prompt
    - `edit` khi nhà cung cấp khai báo `capabilities.edit.enabled`
  - Phạm vi bao phủ lane dùng chung hiện tại:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: tệp trực tiếp Comfy riêng, không thuộc sweep dùng chung này
- Thu hẹp tùy chọn:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Hành vi xác thực tùy chọn:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để buộc xác thực bằng kho hồ sơ và bỏ qua các ghi đè chỉ từ môi trường

## Tạo video trực tiếp

- Kiểm thử: `extensions/video-generation-providers.live.test.ts`
- Bật: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Phạm vi:
  - Thực thi đường dẫn nhà cung cấp tạo video đi kèm dùng chung
  - Mặc định dùng đường dẫn smoke an toàn cho phát hành: các nhà cung cấp không phải FAL, một yêu cầu văn bản-thành-video trên mỗi nhà cung cấp, prompt tôm hùm một giây, và giới hạn thao tác theo từng nhà cung cấp từ `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (mặc định là `180000`)
  - Mặc định bỏ qua FAL vì độ trễ hàng đợi phía nhà cung cấp có thể chiếm phần lớn thời gian phát hành; truyền `--video-providers fal` hoặc `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` để chạy nó một cách rõ ràng
  - Tải biến môi trường nhà cung cấp từ shell đăng nhập của bạn (`~/.profile`) trước khi dò
  - Mặc định dùng khóa API trực tiếp/môi trường trước các hồ sơ xác thực đã lưu, để các khóa kiểm thử cũ trong `auth-profiles.json` không che khuất thông tin xác thực shell thật
  - Bỏ qua các nhà cung cấp không có xác thực/hồ sơ/mô hình dùng được
  - Mặc định chỉ chạy `generate`
  - Đặt `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` để cũng chạy các chế độ biến đổi đã khai báo khi có:
    - `imageToVideo` khi nhà cung cấp khai báo `capabilities.imageToVideo.enabled` và nhà cung cấp/mô hình được chọn chấp nhận đầu vào hình ảnh cục bộ dựa trên buffer trong sweep dùng chung
    - `videoToVideo` khi nhà cung cấp khai báo `capabilities.videoToVideo.enabled` và nhà cung cấp/mô hình được chọn chấp nhận đầu vào video cục bộ dựa trên buffer trong sweep dùng chung
  - Các nhà cung cấp `imageToVideo` đã khai báo nhưng bị bỏ qua hiện tại trong sweep dùng chung:
    - `vydra` vì `veo3` đi kèm chỉ hỗ trợ văn bản và `kling` đi kèm yêu cầu URL hình ảnh từ xa
  - Phạm vi bao phủ Vydra theo nhà cung cấp:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - tệp đó chạy `veo3` văn bản-thành-video cùng với một lane `kling` mặc định dùng fixture URL hình ảnh từ xa
  - Phạm vi bao phủ trực tiếp `videoToVideo` hiện tại:
    - `runway` chỉ khi mô hình được chọn là `runway/gen4_aleph`
  - Các nhà cung cấp `videoToVideo` đã khai báo nhưng bị bỏ qua hiện tại trong sweep dùng chung:
    - `alibaba`, `qwen`, `xai` vì các đường dẫn đó hiện yêu cầu URL tham chiếu `http(s)` / MP4 từ xa
    - `google` vì lane Gemini/Veo dùng chung hiện tại dùng đầu vào cục bộ dựa trên buffer và đường dẫn đó không được chấp nhận trong sweep dùng chung
    - `openai` vì lane dùng chung hiện tại thiếu bảo đảm quyền truy cập inpaint/remix video theo tổ chức
- Thu hẹp tùy chọn:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` để bao gồm mọi nhà cung cấp trong sweep mặc định, kể cả FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` để giảm giới hạn từng thao tác của nhà cung cấp cho một lần chạy smoke quyết liệt
- Hành vi xác thực tùy chọn:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để buộc xác thực bằng kho hồ sơ và bỏ qua các ghi đè chỉ từ môi trường

## Harness phương tiện trực tiếp

- Lệnh: `pnpm test:live:media`
- Mục đích:
  - Chạy các bộ trực tiếp hình ảnh, nhạc và video dùng chung qua một điểm vào gốc repo
  - Tự động tải các biến môi trường nhà cung cấp còn thiếu từ `~/.profile`
  - Mặc định tự động thu hẹp từng bộ về các nhà cung cấp hiện có xác thực dùng được
  - Tái sử dụng `scripts/test-live.mjs`, để hành vi Heartbeat và chế độ yên lặng luôn nhất quán
- Ví dụ:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Liên quan

- [Kiểm thử](/vi/help/testing) - các bộ unit, tích hợp, QA và Docker
