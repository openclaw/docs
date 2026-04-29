---
read_when:
    - Chạy kiểm thử smoke cho ma trận mô hình trực tiếp / phần phụ trợ CLI / ACP / media-provider
    - Gỡ lỗi việc phân giải thông tin xác thực cho kiểm thử trực tiếp
    - Thêm một kiểm thử trực tiếp mới dành riêng cho nhà cung cấp
sidebarTitle: Live tests
summary: 'Kiểm thử trực tiếp (có truy cập mạng): ma trận mô hình, các backend CLI, ACP, nhà cung cấp phương tiện, thông tin xác thực'
title: 'Kiểm thử: bộ kiểm thử trực tiếp'
x-i18n:
    generated_at: "2026-04-29T22:49:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01684475a08296e08e70c339c6d1a689fad8640bf747e8c72b6854045a70451e
    source_path: help/testing-live.md
    workflow: 16
---

Để bắt đầu nhanh, trình chạy QA, bộ unit/integration và luồng Docker, hãy xem
[Kiểm thử](/vi/help/testing). Trang này đề cập đến các bộ kiểm thử **trực tiếp** (có dùng mạng):
ma trận mô hình, backend CLI, ACP và kiểm thử trực tiếp nhà cung cấp phương tiện, cùng với
cách xử lý thông tin xác thực.

## Trực tiếp: lệnh kiểm tra nhanh hồ sơ cục bộ

Nạp `~/.profile` trước các kiểm tra trực tiếp ad hoc để khóa nhà cung cấp và đường dẫn công cụ
cục bộ khớp với shell của bạn:

```bash
source ~/.profile
```

Kiểm tra nhanh phương tiện an toàn:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Kiểm tra nhanh trạng thái sẵn sàng cuộc gọi thoại an toàn:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` là một lần chạy thử nếu không có thêm `--yes`. Chỉ dùng `--yes`
khi bạn cố ý muốn thực hiện một cuộc gọi thông báo thật. Với Twilio, Telnyx và
Plivo, kiểm tra trạng thái sẵn sàng thành công yêu cầu URL webhook công khai; các
phương án dự phòng loopback/private chỉ cục bộ bị từ chối theo thiết kế.

## Trực tiếp: quét năng lực node Android

- Kiểm thử: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Mục tiêu: gọi **mọi lệnh hiện đang được quảng bá** bởi một node Android đã kết nối và xác nhận hành vi hợp đồng lệnh.
- Phạm vi:
  - Thiết lập thủ công/có điều kiện tiên quyết (bộ kiểm thử không cài đặt/chạy/ghép cặp ứng dụng).
  - Xác thực `node.invoke` Gateway theo từng lệnh cho node Android được chọn.
- Thiết lập trước bắt buộc:
  - Ứng dụng Android đã kết nối + ghép cặp với Gateway.
  - Ứng dụng được giữ ở foreground.
  - Quyền/chấp thuận ghi nhận đã được cấp cho các năng lực bạn kỳ vọng sẽ vượt qua.
- Ghi đè đích tùy chọn:
  - `OPENCLAW_ANDROID_NODE_ID` hoặc `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Chi tiết thiết lập Android đầy đủ: [Ứng dụng Android](/vi/platforms/android)

## Trực tiếp: kiểm tra nhanh mô hình (khóa hồ sơ)

Kiểm thử trực tiếp được chia thành hai lớp để chúng ta có thể cô lập lỗi:

- “Mô hình trực tiếp” cho biết nhà cung cấp/mô hình có thể trả lời được hay không với khóa đã cho.
- “Kiểm tra nhanh Gateway” cho biết toàn bộ pipeline gateway+tác tử có hoạt động với mô hình đó không (phiên, lịch sử, công cụ, chính sách sandbox, v.v.).

### Lớp 1: Hoàn tất mô hình trực tiếp (không có Gateway)

- Kiểm thử: `src/agents/models.profiles.live.test.ts`
- Mục tiêu:
  - Liệt kê các mô hình đã phát hiện
  - Dùng `getApiKeyForModel` để chọn các mô hình bạn có thông tin xác thực
  - Chạy một completion nhỏ cho mỗi mô hình (và các hồi quy có mục tiêu khi cần)
- Cách bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
- Đặt `OPENCLAW_LIVE_MODELS=modern` (hoặc `all`, bí danh cho modern) để thực sự chạy bộ này; nếu không, nó sẽ bỏ qua để giữ `pnpm test:live` tập trung vào kiểm tra nhanh Gateway
- Cách chọn mô hình:
  - `OPENCLAW_LIVE_MODELS=modern` để chạy danh sách cho phép hiện đại (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` là bí danh cho danh sách cho phép hiện đại
  - hoặc `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (danh sách cho phép phân tách bằng dấu phẩy)
  - Các lượt quét modern/all mặc định dùng một giới hạn được tuyển chọn có tín hiệu cao; đặt `OPENCLAW_LIVE_MAX_MODELS=0` cho lượt quét hiện đại toàn diện hoặc một số dương cho giới hạn nhỏ hơn.
  - Các lượt quét toàn diện dùng `OPENCLAW_LIVE_TEST_TIMEOUT_MS` làm thời gian chờ cho toàn bộ kiểm thử mô hình trực tiếp. Mặc định: 60 phút.
  - Theo mặc định, các probe mô hình trực tiếp chạy song song 20 luồng; đặt `OPENCLAW_LIVE_MODEL_CONCURRENCY` để ghi đè.
- Cách chọn nhà cung cấp:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (danh sách cho phép phân tách bằng dấu phẩy)
- Khóa đến từ đâu:
  - Theo mặc định: kho hồ sơ và phương án dự phòng env
  - Đặt `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để chỉ bắt buộc **kho hồ sơ**
- Vì sao có phần này:
  - Tách “API nhà cung cấp bị lỗi / khóa không hợp lệ” khỏi “pipeline tác tử Gateway bị lỗi”
  - Chứa các hồi quy nhỏ, cô lập (ví dụ: OpenAI Responses/Codex Responses reasoning replay + luồng gọi công cụ)

### Lớp 2: Gateway + kiểm tra nhanh tác tử dev (những gì "@openclaw" thực sự làm)

- Kiểm thử: `src/gateway/gateway-models.profiles.live.test.ts`
- Mục tiêu:
  - Khởi chạy gateway trong tiến trình
  - Tạo/vá một phiên `agent:dev:*` (ghi đè mô hình cho mỗi lần chạy)
  - Lặp qua các mô hình có khóa và xác nhận:
    - phản hồi “có ý nghĩa” (không có công cụ)
    - một lệnh gọi công cụ thật hoạt động (probe đọc)
    - các probe công cụ bổ sung tùy chọn (probe exec+read)
    - các đường dẫn hồi quy OpenAI (chỉ gọi công cụ → theo dõi tiếp) vẫn hoạt động
- Chi tiết probe (để bạn có thể giải thích lỗi nhanh):
  - probe `read`: kiểm thử ghi một tệp nonce trong workspace và yêu cầu tác tử `read` tệp đó rồi echo nonce trở lại.
  - probe `exec+read`: kiểm thử yêu cầu tác tử dùng `exec` ghi một nonce vào tệp tạm, rồi `read` lại.
  - probe hình ảnh: kiểm thử đính kèm một PNG được tạo (mèo + mã ngẫu nhiên) và kỳ vọng mô hình trả về `cat <CODE>`.
  - Tham chiếu triển khai: `src/gateway/gateway-models.profiles.live.test.ts` và `src/gateway/live-image-probe.ts`.
- Cách bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
- Cách chọn mô hình:
  - Mặc định: danh sách cho phép hiện đại (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` là bí danh cho danh sách cho phép hiện đại
  - Hoặc đặt `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (hoặc danh sách phân tách bằng dấu phẩy) để thu hẹp
  - Các lượt quét Gateway modern/all mặc định dùng một giới hạn được tuyển chọn có tín hiệu cao; đặt `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` cho lượt quét hiện đại toàn diện hoặc một số dương cho giới hạn nhỏ hơn.
- Cách chọn nhà cung cấp (tránh “mọi thứ OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (danh sách cho phép phân tách bằng dấu phẩy)
- Probe công cụ + hình ảnh luôn bật trong kiểm thử trực tiếp này:
  - probe `read` + probe `exec+read` (tạo áp lực công cụ)
  - probe hình ảnh chạy khi mô hình quảng bá hỗ trợ đầu vào hình ảnh
  - Luồng (mức cao):
    - Kiểm thử tạo một PNG nhỏ với “CAT” + mã ngẫu nhiên (`src/gateway/live-image-probe.ts`)
    - Gửi qua `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway phân tích tệp đính kèm thành `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Tác tử nhúng chuyển tiếp một tin nhắn người dùng đa phương thức đến mô hình
    - Xác nhận: phản hồi chứa `cat` + mã (dung sai OCR: cho phép lỗi nhỏ)

<Tip>
Để xem bạn có thể kiểm thử gì trên máy của mình (và các id `provider/model` chính xác), hãy chạy:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Trực tiếp: kiểm tra nhanh backend CLI (Claude, Codex, Gemini hoặc CLI cục bộ khác)

- Kiểm thử: `src/gateway/gateway-cli-backend.live.test.ts`
- Mục tiêu: xác thực pipeline Gateway + tác tử bằng một backend CLI cục bộ, mà không chạm vào cấu hình mặc định của bạn.
- Các mặc định kiểm tra nhanh riêng theo backend nằm trong định nghĩa `cli-backend.ts` của Plugin sở hữu.
- Bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Mặc định:
  - Nhà cung cấp/mô hình mặc định: `claude-cli/claude-sonnet-4-6`
  - Hành vi lệnh/args/hình ảnh đến từ metadata Plugin backend CLI sở hữu.
- Ghi đè (tùy chọn):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` để gửi tệp đính kèm hình ảnh thật (đường dẫn được chèn vào prompt). Công thức Docker mặc định tắt mục này trừ khi được yêu cầu rõ ràng.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` để truyền đường dẫn tệp hình ảnh dưới dạng args CLI thay vì chèn vào prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (hoặc `"list"`) để kiểm soát cách truyền args hình ảnh khi `IMAGE_ARG` được đặt.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` để gửi lượt thứ hai và xác thực luồng resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` để tham gia probe liên tục cùng phiên Claude Sonnet -> Opus khi mô hình được chọn hỗ trợ đích chuyển đổi. Công thức Docker mặc định tắt mục này để có độ tin cậy tổng hợp.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` để tham gia probe loopback MCP/công cụ. Công thức Docker mặc định tắt mục này trừ khi được yêu cầu rõ ràng.

Ví dụ:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Kiểm tra nhanh cấu hình Gemini MCP chi phí thấp:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Việc này không yêu cầu Gemini tạo phản hồi. Nó ghi cùng các thiết lập hệ thống
mà OpenClaw cung cấp cho Gemini, rồi chạy `gemini --debug mcp list` để chứng minh một
máy chủ `transport: "streamable-http"` đã lưu được chuẩn hóa sang dạng HTTP MCP của Gemini
và có thể kết nối với một máy chủ MCP streamable-HTTP cục bộ.

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
- Nó chạy kiểm tra nhanh backend CLI trực tiếp bên trong image Docker của repo với người dùng `node` không phải root.
- Nó phân giải metadata kiểm tra nhanh CLI từ Plugin sở hữu, rồi cài đặt gói CLI Linux tương ứng (`@anthropic-ai/claude-code`, `@openai/codex` hoặc `@google/gemini-cli`) vào một tiền tố có thể ghi được lưu cache tại `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (mặc định: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` yêu cầu OAuth gói đăng ký Claude Code có thể mang theo thông qua `~/.claude/.credentials.json` với `claudeAiOauth.subscriptionType` hoặc `CLAUDE_CODE_OAUTH_TOKEN` từ `claude setup-token`. Trước tiên nó chứng minh `claude -p` trực tiếp trong Docker, rồi chạy hai lượt backend CLI Gateway mà không giữ các biến env khóa API Anthropic. Lane gói đăng ký này mặc định tắt các probe MCP/công cụ và hình ảnh của Claude vì Claude hiện định tuyến việc sử dụng ứng dụng bên thứ ba qua tính phí sử dụng bổ sung thay vì giới hạn gói đăng ký bình thường.
- Kiểm tra nhanh backend CLI trực tiếp hiện thực hiện cùng một luồng end-to-end cho Claude, Codex và Gemini: lượt văn bản, lượt phân loại hình ảnh, rồi lệnh gọi công cụ MCP `cron` được xác minh qua CLI Gateway.
- Kiểm tra nhanh mặc định của Claude cũng vá phiên từ Sonnet sang Opus và xác minh phiên đã resume vẫn nhớ một ghi chú trước đó.

## Trực tiếp: kiểm tra nhanh bind ACP (`/acp spawn ... --bind here`)

- Kiểm thử: `src/gateway/gateway-acp-bind.live.test.ts`
- Mục tiêu: xác thực luồng bind cuộc trò chuyện ACP thật với một ACP agent trực tiếp:
  - gửi `/acp spawn <agent> --bind here`
  - bind tại chỗ một cuộc trò chuyện kênh tin nhắn tổng hợp
  - gửi một phản hồi tiếp theo thông thường trên cùng cuộc trò chuyện đó
  - xác minh phản hồi tiếp theo đi vào transcript phiên ACP đã bind
- Bật:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Mặc định:
  - ACP agents trong Docker: `claude,codex,gemini`
  - ACP agent cho lệnh trực tiếp `pnpm test:live ...`: `claude`
  - Kênh tổng hợp: ngữ cảnh cuộc trò chuyện kiểu Slack DM
  - ACP backend: `acpx`
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
  - Lane này dùng bề mặt `chat.send` của gateway với các trường originating-route tổng hợp chỉ dành cho quản trị viên để kiểm thử có thể gắn ngữ cảnh kênh tin nhắn mà không giả vờ phân phối ra bên ngoài.
  - Khi `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` chưa được đặt, kiểm thử dùng registry agent tích hợp của plugin `acpx` nhúng cho agent harness ACP đã chọn.
  - Việc tạo MCP Cron cho phiên đã bind mặc định là nỗ lực tối đa vì các harness ACP bên ngoài có thể hủy lệnh gọi MCP sau khi bằng chứng bind/hình ảnh đã đạt; đặt `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` để làm cho phép dò Cron sau bind đó trở nên nghiêm ngặt.

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

Công thức Docker cho từng agent:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Ghi chú Docker:

- Docker runner nằm tại `scripts/test-live-acp-bind-docker.sh`.
- Theo mặc định, nó chạy ACP bind smoke lần lượt trên các live CLI agents tổng hợp: `claude`, `codex`, rồi `gemini`.
- Dùng `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, hoặc `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` để thu hẹp ma trận.
- Nó source `~/.profile`, đưa vật liệu xác thực CLI phù hợp vào container, rồi cài live CLI được yêu cầu (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid qua `https://app.factory.ai/cli`, `@google/gemini-cli`, hoặc `opencode-ai`) nếu còn thiếu. Bản thân ACP backend là gói `acpx/runtime` nhúng đi kèm từ plugin `acpx`.
- Biến thể Docker Droid đưa `~/.factory` cho cài đặt, chuyển tiếp `FACTORY_API_KEY`, và yêu cầu API key đó vì xác thực OAuth/keyring cục bộ của Factory không thể mang được vào container. Nó dùng mục registry tích hợp `droid exec --output-format acp` của ACPX.
- Biến thể Docker OpenCode là một lane hồi quy nghiêm ngặt cho một agent. Nó ghi model mặc định tạm thời `OPENCODE_CONFIG_CONTENT` từ `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (mặc định `opencode/kimi-k2.6`) sau khi source `~/.profile`, và `pnpm test:docker:live-acp-bind:opencode` yêu cầu transcript assistant đã bind thay vì chấp nhận bỏ qua hậu bind chung.
- Các lệnh gọi CLI `acpx` trực tiếp chỉ là đường dẫn thủ công/giải pháp thay thế để so sánh hành vi bên ngoài Gateway. ACP bind smoke Docker kiểm thử backend runtime `acpx` nhúng của OpenClaw.

## Trực tiếp: Codex app-server harness smoke

- Mục tiêu: xác thực harness Codex do plugin sở hữu thông qua phương thức gateway
  `agent` thông thường:
  - tải plugin `codex` đi kèm
  - chọn `OPENCLAW_AGENT_RUNTIME=codex`
  - gửi lượt agent gateway đầu tiên tới `openai/gpt-5.5` với harness Codex bị ép dùng
  - gửi lượt thứ hai tới cùng phiên OpenClaw và xác minh thread app-server
    có thể tiếp tục
  - chạy `/codex status` và `/codex models` qua cùng đường dẫn lệnh gateway
  - tùy chọn chạy hai phép dò shell được leo thang và Guardian xem xét: một lệnh lành tính
    đáng lẽ được phê duyệt và một lệnh tải lên secret giả đáng lẽ bị
    từ chối để agent hỏi lại
- Kiểm thử: `src/gateway/gateway-codex-harness.live.test.ts`
- Bật: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model mặc định: `openai/gpt-5.5`
- Phép dò hình ảnh tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Phép dò MCP/công cụ tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Phép dò Guardian tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke đặt `OPENCLAW_AGENT_HARNESS_FALLBACK=none` để một harness Codex bị hỏng
  không thể vượt qua bằng cách âm thầm fallback về PI.
- Xác thực: xác thực app-server Codex từ đăng nhập đăng ký Codex cục bộ. Docker
  smokes cũng có thể cung cấp `OPENAI_API_KEY` cho các phép dò không phải Codex khi áp dụng,
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
- Nó source `~/.profile` đã mount, truyền `OPENAI_API_KEY`, sao chép các tệp xác thực Codex CLI
  khi có, cài `@openai/codex` vào một prefix npm đã mount có thể ghi,
  đưa cây nguồn vào, rồi chỉ chạy live test Codex-harness.
- Docker bật các phép dò hình ảnh, MCP/công cụ và Guardian theo mặc định. Đặt
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` hoặc
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` hoặc
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` khi bạn cần một lần chạy gỡ lỗi
  hẹp hơn.
- Docker cũng export `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, khớp với cấu hình live
  test để các alias cũ hoặc PI fallback không thể che giấu một hồi quy harness
  Codex.

### Công thức trực tiếp được khuyến nghị

Allowlist hẹp, rõ ràng là nhanh nhất và ít dễ lỗi nhất:

- Một model, trực tiếp (không gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Một model, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Gọi công cụ trên nhiều nhà cung cấp:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tập trung vào Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking smoke:
  - Nếu khóa cục bộ nằm trong shell profile: `source ~/.profile`
  - Gemini 3 mặc định động: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 ngân sách động: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Ghi chú:

- `google/...` dùng Gemini API (API key).
- `google-antigravity/...` dùng cầu nối Antigravity OAuth (điểm cuối agent kiểu Cloud Code Assist).
- `google-gemini-cli/...` dùng Gemini CLI cục bộ trên máy của bạn (xác thực riêng + các điểm đặc thù về công cụ).
- Gemini API so với Gemini CLI:
  - API: OpenClaw gọi Gemini API do Google lưu trữ qua HTTP (API key / xác thực profile); đây là điều hầu hết người dùng hiểu là “Gemini”.
  - CLI: OpenClaw gọi ra một binary `gemini` cục bộ; nó có xác thực riêng và có thể hoạt động khác (hỗ trợ streaming/công cụ/lệch phiên bản).

## Trực tiếp: ma trận model (những gì chúng ta bao phủ)

Không có “danh sách model CI” cố định (live là opt-in), nhưng đây là các model **được khuyến nghị** để bao phủ thường xuyên trên máy dev có khóa.

### Tập smoke hiện đại (gọi công cụ + hình ảnh)

Đây là lần chạy “common models” mà chúng ta kỳ vọng tiếp tục hoạt động:

- OpenAI (không phải Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (hoặc `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` và `google/gemini-3-flash-preview` (tránh các model Gemini 2.x cũ hơn)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` và `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` và `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Chạy gateway smoke với công cụ + hình ảnh:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Cơ sở: gọi công cụ (Read + Exec tùy chọn)

Chọn ít nhất một model cho mỗi họ nhà cung cấp:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (hoặc `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (hoặc `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Phạm vi bổ sung tùy chọn (nên có):

- xAI: `xai/grok-4` (hoặc bản mới nhất có sẵn)
- Mistral: `mistral/`… (chọn một model có khả năng “tools” mà bạn đã bật)
- Cerebras: `cerebras/`… (nếu bạn có quyền truy cập)
- LM Studio: `lmstudio/`… (cục bộ; gọi công cụ phụ thuộc vào chế độ API)

### Vision: gửi hình ảnh (attachment → tin nhắn đa phương thức)

Bao gồm ít nhất một model có khả năng xử lý hình ảnh trong `OPENCLAW_LIVE_GATEWAY_MODELS` (các biến thể Claude/Gemini/OpenAI có khả năng vision, v.v.) để kiểm thử phép dò hình ảnh.

### Aggregators / gateway thay thế

Nếu bạn đã bật khóa, chúng tôi cũng hỗ trợ kiểm thử qua:

- OpenRouter: `openrouter/...` (hàng trăm model; dùng `openclaw models scan` để tìm ứng viên có khả năng công cụ+hình ảnh)
- OpenCode: `opencode/...` cho Zen và `opencode-go/...` cho Go (xác thực qua `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Các nhà cung cấp khác bạn có thể đưa vào ma trận live (nếu bạn có thông tin xác thực/cấu hình):

- Tích hợp sẵn: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Qua `models.providers` (điểm cuối tùy chỉnh): `minimax` (cloud/API), cùng mọi proxy tương thích OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, v.v.)

<Tip>
Đừng hardcode "all models" trong tài liệu. Danh sách có thẩm quyền là bất cứ gì `discoverModels(...)` trả về trên máy của bạn cộng với các khóa hiện có.
</Tip>

## Thông tin xác thực (không bao giờ commit)

Live tests phát hiện thông tin xác thực theo cùng cách CLI thực hiện. Hàm ý thực tế:

- Nếu CLI hoạt động, các kiểm thử live sẽ tìm thấy cùng các khóa đó.
- Nếu một kiểm thử live báo “không có thông tin xác thực”, hãy debug giống như cách bạn debug `openclaw models list` / lựa chọn model.

- Hồ sơ xác thực theo từng agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (đây là ý nghĩa của “profile keys” trong các kiểm thử live)
- Cấu hình: `~/.openclaw/openclaw.json` (hoặc `OPENCLAW_CONFIG_PATH`)
- Thư mục trạng thái legacy: `~/.openclaw/credentials/` (được sao chép vào home live đã staging khi có, nhưng không phải kho lưu trữ profile-key chính)
- Các lần chạy live cục bộ mặc định sao chép cấu hình đang hoạt động, các tệp `auth-profiles.json` theo từng agent, `credentials/` legacy, và các thư mục xác thực CLI bên ngoài được hỗ trợ vào một home kiểm thử tạm thời; các home live đã staging bỏ qua `workspace/` và `sandboxes/`, đồng thời các ghi đè đường dẫn `agents.*.workspace` / `agentDir` bị loại bỏ để các probe không chạm vào workspace thật trên máy chủ của bạn.

Nếu bạn muốn dựa vào khóa env (ví dụ được export trong `~/.profile`), hãy chạy kiểm thử cục bộ sau `source ~/.profile`, hoặc dùng các runner Docker bên dưới (chúng có thể mount `~/.profile` vào container).

## Deepgram live (phiên âm audio)

- Kiểm thử: `extensions/deepgram/audio.live.test.ts`
- Bật: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Kiểm thử: `extensions/byteplus/live.test.ts`
- Bật: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Ghi đè model tùy chọn: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Kiểm thử: `extensions/comfy/comfy.live.test.ts`
- Bật: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Phạm vi:
  - Thực thi các đường dẫn comfy image, video và `music_generate` được đóng gói sẵn
  - Bỏ qua từng capability trừ khi `plugins.entries.comfy.config.<capability>` được cấu hình
  - Hữu ích sau khi thay đổi gửi workflow comfy, polling, tải xuống, hoặc đăng ký plugin

## Image generation live

- Kiểm thử: `test/image-generation.runtime.live.test.ts`
- Lệnh: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Phạm vi:
  - Liệt kê mọi provider plugin image-generation đã đăng ký
  - Tải các biến env provider còn thiếu từ login shell của bạn (`~/.profile`) trước khi probe
  - Mặc định dùng khóa API live/env trước các hồ sơ xác thực đã lưu, để khóa kiểm thử cũ trong `auth-profiles.json` không che khuất thông tin xác thực shell thật
  - Bỏ qua các provider không có auth/profile/model khả dụng
  - Chạy từng provider đã cấu hình qua runtime image-generation dùng chung:
    - `<provider>:generate`
    - `<provider>:edit` khi provider khai báo hỗ trợ edit
- Các provider đóng gói hiện được bao phủ:
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
- Hành vi auth tùy chọn:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để buộc auth từ kho profile và bỏ qua các ghi đè chỉ dùng env

Đối với đường dẫn CLI đã phát hành, thêm một smoke `infer` sau khi kiểm thử live provider/runtime vượt qua:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Phần này bao phủ phân tích đối số CLI, phân giải cấu hình/default-agent, kích hoạt plugin đóng gói, sửa runtime-dependency đóng gói theo nhu cầu, runtime image-generation dùng chung, và yêu cầu provider live.

## Music generation live

- Kiểm thử: `extensions/music-generation-providers.live.test.ts`
- Bật: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Phạm vi:
  - Thực thi đường dẫn provider music-generation đóng gói dùng chung
  - Hiện bao phủ Google và MiniMax
  - Tải các biến env provider từ login shell của bạn (`~/.profile`) trước khi probe
  - Mặc định dùng khóa API live/env trước các hồ sơ xác thực đã lưu, để khóa kiểm thử cũ trong `auth-profiles.json` không che khuất thông tin xác thực shell thật
  - Bỏ qua các provider không có auth/profile/model khả dụng
  - Chạy cả hai chế độ runtime đã khai báo khi có:
    - `generate` với đầu vào chỉ gồm prompt
    - `edit` khi provider khai báo `capabilities.edit.enabled`
  - Mức bao phủ shared-lane hiện tại:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: tệp live Comfy riêng, không thuộc sweep dùng chung này
- Thu hẹp tùy chọn:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Hành vi auth tùy chọn:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để buộc auth từ kho profile và bỏ qua các ghi đè chỉ dùng env

## Video generation live

- Kiểm thử: `extensions/video-generation-providers.live.test.ts`
- Bật: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Phạm vi:
  - Thực thi đường dẫn provider video-generation đóng gói dùng chung
  - Mặc định dùng đường dẫn smoke an toàn cho phát hành: các provider không phải FAL, một yêu cầu text-to-video cho mỗi provider, prompt tôm hùm một giây, và giới hạn thao tác theo từng provider từ `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (mặc định là `180000`)
  - Mặc định bỏ qua FAL vì độ trễ hàng đợi phía provider có thể chiếm phần lớn thời gian phát hành; truyền `--video-providers fal` hoặc `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` để chạy rõ ràng
  - Tải các biến env provider từ login shell của bạn (`~/.profile`) trước khi probe
  - Mặc định dùng khóa API live/env trước các hồ sơ xác thực đã lưu, để khóa kiểm thử cũ trong `auth-profiles.json` không che khuất thông tin xác thực shell thật
  - Bỏ qua các provider không có auth/profile/model khả dụng
  - Mặc định chỉ chạy `generate`
  - Đặt `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` để cũng chạy các chế độ transform đã khai báo khi có:
    - `imageToVideo` khi provider khai báo `capabilities.imageToVideo.enabled` và provider/model đã chọn chấp nhận đầu vào ảnh cục bộ dựa trên buffer trong sweep dùng chung
    - `videoToVideo` khi provider khai báo `capabilities.videoToVideo.enabled` và provider/model đã chọn chấp nhận đầu vào video cục bộ dựa trên buffer trong sweep dùng chung
  - Các provider `imageToVideo` đã khai báo nhưng bị bỏ qua hiện tại trong sweep dùng chung:
    - `vydra` vì `veo3` đóng gói chỉ hỗ trợ văn bản và `kling` đóng gói yêu cầu URL ảnh từ xa
  - Mức bao phủ riêng cho provider Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - tệp đó chạy `veo3` text-to-video cộng với một lane `kling` mặc định dùng fixture URL ảnh từ xa
  - Mức bao phủ live `videoToVideo` hiện tại:
    - `runway` chỉ khi model đã chọn là `runway/gen4_aleph`
  - Các provider `videoToVideo` đã khai báo nhưng bị bỏ qua hiện tại trong sweep dùng chung:
    - `alibaba`, `qwen`, `xai` vì các đường dẫn đó hiện yêu cầu URL tham chiếu `http(s)` / MP4 từ xa
    - `google` vì lane Gemini/Veo dùng chung hiện tại dùng đầu vào cục bộ dựa trên buffer và đường dẫn đó không được chấp nhận trong sweep dùng chung
    - `openai` vì lane dùng chung hiện tại thiếu bảo đảm truy cập video inpaint/remix riêng theo org
- Thu hẹp tùy chọn:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` để bao gồm mọi provider trong sweep mặc định, bao gồm FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` để giảm giới hạn thao tác của từng provider cho một lần chạy smoke mạnh tay
- Hành vi auth tùy chọn:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để buộc auth từ kho profile và bỏ qua các ghi đè chỉ dùng env

## Media live harness

- Lệnh: `pnpm test:live:media`
- Mục đích:
  - Chạy các bộ live image, music và video dùng chung qua một entrypoint repo-native duy nhất
  - Tự động tải các biến env provider còn thiếu từ `~/.profile`
  - Mặc định tự động thu hẹp từng bộ về các provider hiện có auth khả dụng
  - Tái sử dụng `scripts/test-live.mjs`, nên hành vi Heartbeat và chế độ quiet vẫn nhất quán
- Ví dụ:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Liên quan

- [Kiểm thử](/vi/help/testing) — các bộ unit, integration, QA và Docker
