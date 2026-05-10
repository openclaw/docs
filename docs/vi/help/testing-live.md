---
read_when:
    - Chạy các bài kiểm thử khói trực tiếp cho ma trận mô hình / phần phụ trợ CLI / ACP / nhà cung cấp phương tiện
    - Gỡ lỗi việc phân giải thông tin xác thực cho kiểm thử trực tiếp
    - Thêm một kiểm thử trực tiếp dành riêng cho nhà cung cấp
sidebarTitle: Live tests
summary: 'Kiểm thử live (có truy cập mạng): ma trận mô hình, backend CLI, ACP, nhà cung cấp phương tiện, thông tin xác thực'
title: 'Kiểm thử: các bộ kiểm thử trực tiếp'
x-i18n:
    generated_at: "2026-05-10T19:38:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb020672cd71d03b2cfc78b135c7c39862823c421c0f2f31bae69a42f9c3437f
    source_path: help/testing-live.md
    workflow: 16
---

Để bắt đầu nhanh, trình chạy QA, bộ kiểm thử đơn vị/tích hợp và các luồng Docker, xem
[Kiểm thử](/vi/help/testing). Trang này bao quát các bộ kiểm thử **trực tiếp** (chạm tới mạng):
ma trận mô hình, backend CLI, ACP và kiểm thử trực tiếp nhà cung cấp media, cùng với
xử lý thông tin xác thực.

## Trực tiếp: lệnh smoke hồ sơ cục bộ

Source `~/.profile` trước các kiểm tra trực tiếp tùy biến để khóa nhà cung cấp và đường dẫn
công cụ cục bộ khớp với shell của bạn:

```bash
source ~/.profile
```

Smoke media an toàn:

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
khi bạn chủ ý muốn thực hiện một cuộc gọi thông báo thật. Với Twilio, Telnyx và
Plivo, kiểm tra độ sẵn sàng thành công yêu cầu URL webhook công khai; các phương án dự phòng
loopback/private chỉ cục bộ bị từ chối theo thiết kế.

## Trực tiếp: quét năng lực Node Android

- Kiểm thử: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Mục tiêu: gọi **mọi lệnh hiện được quảng bá** bởi một Node Android đã kết nối và xác nhận hành vi hợp đồng lệnh.
- Phạm vi:
  - Thiết lập có điều kiện/thủ công trước (bộ kiểm thử không cài đặt/chạy/ghép đôi ứng dụng).
  - Xác thực Gateway `node.invoke` theo từng lệnh cho Node Android đã chọn.
- Thiết lập trước bắt buộc:
  - Ứng dụng Android đã kết nối + ghép đôi với gateway.
  - Ứng dụng được giữ ở tiền cảnh.
  - Quyền/đồng ý capture được cấp cho các năng lực bạn kỳ vọng sẽ vượt qua.
- Ghi đè mục tiêu tùy chọn:
  - `OPENCLAW_ANDROID_NODE_ID` hoặc `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Chi tiết thiết lập Android đầy đủ: [Ứng dụng Android](/vi/platforms/android)

## Trực tiếp: smoke mô hình (khóa hồ sơ)

Kiểm thử trực tiếp được chia thành hai lớp để chúng ta có thể cô lập lỗi:

- "Mô hình trực tiếp" cho biết nhà cung cấp/mô hình có thể trả lời với khóa đã cho hay không.
- "Gateway smoke" cho biết toàn bộ pipeline gateway+agent có hoạt động cho mô hình đó hay không (phiên, lịch sử, công cụ, chính sách sandbox, v.v.).

### Lớp 1: Hoàn tất mô hình trực tiếp (không có gateway)

- Kiểm thử: `src/agents/models.profiles.live.test.ts`
- Mục tiêu:
  - Liệt kê các mô hình đã phát hiện
  - Dùng `getApiKeyForModel` để chọn các mô hình mà bạn có thông tin xác thực
  - Chạy một completion nhỏ cho từng mô hình (và các hồi quy có mục tiêu khi cần)
- Cách bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
- Đặt `OPENCLAW_LIVE_MODELS=modern` (hoặc `all`, bí danh cho modern) để thực sự chạy bộ kiểm thử này; nếu không, nó sẽ bỏ qua để giữ `pnpm test:live` tập trung vào Gateway smoke
- Cách chọn mô hình:
  - `OPENCLAW_LIVE_MODELS=modern` để chạy danh sách cho phép hiện đại (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` là bí danh cho danh sách cho phép hiện đại
  - hoặc `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (danh sách cho phép phân tách bằng dấu phẩy)
  - Các lượt quét modern/all mặc định dùng một giới hạn tín hiệu cao đã tuyển chọn; đặt `OPENCLAW_LIVE_MAX_MODELS=0` để quét modern toàn diện hoặc một số dương để dùng giới hạn nhỏ hơn.
  - Các lượt quét toàn diện dùng `OPENCLAW_LIVE_TEST_TIMEOUT_MS` làm thời gian chờ cho toàn bộ kiểm thử mô hình trực tiếp. Mặc định: 60 phút.
  - Các probe mô hình trực tiếp mặc định chạy với song song 20 luồng; đặt `OPENCLAW_LIVE_MODEL_CONCURRENCY` để ghi đè.
- Cách chọn nhà cung cấp:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (danh sách cho phép phân tách bằng dấu phẩy)
- Khóa đến từ đâu:
  - Theo mặc định: kho hồ sơ và các fallback env
  - Đặt `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để chỉ bắt buộc **kho hồ sơ**
- Lý do tồn tại:
  - Tách "API nhà cung cấp bị hỏng / khóa không hợp lệ" khỏi "pipeline agent Gateway bị hỏng"
  - Chứa các hồi quy nhỏ, cô lập (ví dụ: luồng phát lại suy luận OpenAI Responses/Codex Responses + tool-call)

### Lớp 2: Gateway + smoke agent dev (những gì "@openclaw" thực sự làm)

- Kiểm thử: `src/gateway/gateway-models.profiles.live.test.ts`
- Mục tiêu:
  - Khởi động một gateway trong tiến trình
  - Tạo/vá một phiên `agent:dev:*` (ghi đè mô hình theo từng lượt chạy)
  - Lặp qua các mô hình có khóa và xác nhận:
    - phản hồi "có ý nghĩa" (không có công cụ)
    - một lệnh gọi công cụ thật hoạt động (probe đọc)
    - các probe công cụ bổ sung tùy chọn (probe exec+read)
    - các đường hồi quy OpenAI (chỉ tool-call → follow-up) tiếp tục hoạt động
- Chi tiết probe (để bạn có thể giải thích lỗi nhanh):
  - probe `read`: kiểm thử ghi một tệp nonce vào workspace và yêu cầu agent `read` nó rồi echo nonce lại.
  - probe `exec+read`: kiểm thử yêu cầu agent dùng `exec` ghi một nonce vào tệp tạm, rồi `read` nó lại.
  - probe hình ảnh: kiểm thử đính kèm một PNG đã tạo (cat + mã ngẫu nhiên) và kỳ vọng mô hình trả về `cat <CODE>`.
  - Tham chiếu triển khai: `src/gateway/gateway-models.profiles.live.test.ts` và `src/gateway/live-image-probe.ts`.
- Cách bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
- Cách chọn mô hình:
  - Mặc định: danh sách cho phép hiện đại (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` là bí danh cho danh sách cho phép hiện đại
  - Hoặc đặt `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (hoặc danh sách phân tách bằng dấu phẩy) để thu hẹp
  - Các lượt quét Gateway modern/all mặc định dùng một giới hạn tín hiệu cao đã tuyển chọn; đặt `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` để quét modern toàn diện hoặc một số dương để dùng giới hạn nhỏ hơn.
- Cách chọn nhà cung cấp (tránh "mọi thứ OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (danh sách cho phép phân tách bằng dấu phẩy)
- Probe công cụ + hình ảnh luôn bật trong kiểm thử trực tiếp này:
  - probe `read` + probe `exec+read` (áp lực công cụ)
  - probe hình ảnh chạy khi mô hình quảng bá hỗ trợ đầu vào hình ảnh
  - Luồng (mức cao):
    - Kiểm thử tạo một PNG nhỏ với "CAT" + mã ngẫu nhiên (`src/gateway/live-image-probe.ts`)
    - Gửi nó qua `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway phân tích attachment thành `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Agent nhúng chuyển tiếp một thông điệp người dùng đa phương thức tới mô hình
    - Xác nhận: phản hồi chứa `cat` + mã (dung sai OCR: cho phép lỗi nhỏ)

<Tip>
Để xem bạn có thể kiểm thử gì trên máy của mình (và các id `provider/model` chính xác), chạy:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Trực tiếp: smoke backend CLI (Claude, Codex, Gemini hoặc các CLI cục bộ khác)

- Kiểm thử: `src/gateway/gateway-cli-backend.live.test.ts`
- Mục tiêu: xác thực pipeline Gateway + agent bằng một backend CLI cục bộ, không chạm tới cấu hình mặc định của bạn.
- Mặc định smoke riêng cho backend nằm cùng định nghĩa `cli-backend.ts` của extension sở hữu.
- Bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Mặc định:
  - Nhà cung cấp/mô hình mặc định: `claude-cli/claude-sonnet-4-6`
  - Hành vi command/args/image đến từ metadata Plugin backend CLI sở hữu.
- Ghi đè (tùy chọn):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` để gửi một attachment hình ảnh thật (đường dẫn được chèn vào prompt). Công thức Docker mặc định tắt mục này trừ khi được yêu cầu rõ ràng.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` để truyền đường dẫn tệp hình ảnh dưới dạng đối số CLI thay vì chèn prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (hoặc `"list"`) để kiểm soát cách truyền đối số hình ảnh khi `IMAGE_ARG` được đặt.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` để gửi lượt thứ hai và xác thực luồng tiếp tục.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` để chọn tham gia probe tính liên tục cùng phiên Claude Sonnet -> Opus khi mô hình đã chọn hỗ trợ mục tiêu chuyển đổi. Công thức Docker mặc định tắt mục này để tăng độ tin cậy tổng hợp.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` để chọn tham gia probe loopback MCP/công cụ. Công thức Docker mặc định tắt mục này trừ khi được yêu cầu rõ ràng.

Ví dụ:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Smoke cấu hình MCP Gemini chi phí thấp:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Việc này không yêu cầu Gemini tạo phản hồi. Nó ghi cùng các thiết lập hệ thống
mà OpenClaw cung cấp cho Gemini, rồi chạy `gemini --debug mcp list` để chứng minh một
máy chủ `transport: "streamable-http"` đã lưu được chuẩn hóa sang hình dạng HTTP MCP
của Gemini và có thể kết nối tới máy chủ MCP streamable-HTTP cục bộ.

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
- Nó chạy smoke backend CLI trực tiếp bên trong image Docker của repo dưới người dùng không phải root `node`.
- Nó phân giải metadata smoke CLI từ extension sở hữu, rồi cài đặt gói CLI Linux tương ứng (`@anthropic-ai/claude-code`, `@openai/codex`, hoặc `@google/gemini-cli`) vào một prefix có thể ghi và được cache tại `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (mặc định: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` yêu cầu OAuth đăng ký Claude Code di động được thông qua `~/.claude/.credentials.json` với `claudeAiOauth.subscriptionType` hoặc `CLAUDE_CODE_OAUTH_TOKEN` từ `claude setup-token`. Trước tiên nó chứng minh `claude -p` trực tiếp trong Docker, rồi chạy hai lượt backend CLI Gateway mà không giữ lại biến env khóa API Anthropic. Lane đăng ký này mặc định tắt các probe MCP/công cụ và hình ảnh của Claude vì Claude hiện định tuyến việc dùng ứng dụng bên thứ ba qua tính phí sử dụng bổ sung thay vì giới hạn gói đăng ký thông thường.
- Smoke backend CLI trực tiếp hiện thực thi cùng một luồng đầu cuối cho Claude, Codex và Gemini: lượt văn bản, lượt phân loại hình ảnh, rồi lệnh gọi công cụ MCP `cron` được xác minh qua CLI Gateway.
- Smoke mặc định của Claude cũng vá phiên từ Sonnet sang Opus và xác minh phiên đã tiếp tục vẫn nhớ một ghi chú trước đó.

## Trực tiếp: khả năng tiếp cận proxy APNs HTTP/2

- Kiểm thử: `src/infra/push-apns-http2.live.test.ts`
- Mục tiêu: tunnel qua một proxy HTTP CONNECT cục bộ tới endpoint APNs sandbox của Apple, gửi yêu cầu xác thực APNs HTTP/2 và xác nhận phản hồi `403 InvalidProviderToken` thật của Apple quay lại qua đường proxy.
- Bật:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Thời gian chờ tùy chọn:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Trực tiếp: smoke bind ACP (`/acp spawn ... --bind here`)

- Kiểm thử: `src/gateway/gateway-acp-bind.live.test.ts`
- Mục tiêu: xác thực luồng gắn kết hội thoại ACP thực với một tác tử ACP trực tiếp:
  - gửi `/acp spawn <agent> --bind here`
  - gắn kết tại chỗ một hội thoại kênh tin nhắn tổng hợp
  - gửi một lượt theo dõi thông thường trên cùng hội thoại đó
  - xác minh lượt theo dõi được ghi vào transcript phiên ACP đã gắn kết
- Bật:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Mặc định:
  - Các tác tử ACP trong Docker: `claude,codex,gemini`
  - Tác tử ACP cho `pnpm test:live ...` trực tiếp: `claude`
  - Kênh tổng hợp: ngữ cảnh hội thoại kiểu Slack DM
  - Hậu phương ACP: `acpx`
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
  - Luồng này dùng bề mặt `chat.send` của Gateway với các trường tuyến nguồn tổng hợp chỉ dành cho quản trị, để kiểm thử có thể gắn ngữ cảnh kênh tin nhắn mà không giả vờ phân phối ra bên ngoài.
  - Khi `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` chưa được đặt, kiểm thử dùng registry tác tử tích hợp của Plugin `acpx` nhúng cho tác tử bộ kiểm thử ACP đã chọn.
  - Việc tạo MCP Cron cho phiên đã gắn kết mặc định là nỗ lực tối đa vì các bộ kiểm thử ACP bên ngoài có thể hủy lệnh gọi MCP sau khi bằng chứng gắn kết/hình ảnh đã vượt qua; đặt `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` để biến phép dò Cron sau gắn kết đó thành nghiêm ngặt.

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

Công thức Docker cho từng tác tử:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Ghi chú Docker:

- Bộ chạy Docker nằm tại `scripts/test-live-acp-bind-docker.sh`.
- Theo mặc định, nó chạy smoke gắn kết ACP lần lượt với các tác tử CLI trực tiếp tổng hợp: `claude`, `codex`, rồi `gemini`.
- Dùng `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, hoặc `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` để thu hẹp ma trận.
- Nó nạp `~/.profile`, đưa vật liệu xác thực CLI tương ứng vào container, rồi cài CLI trực tiếp được yêu cầu (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid qua `https://app.factory.ai/cli`, `@google/gemini-cli`, hoặc `opencode-ai`) nếu còn thiếu. Bản thân hậu phương ACP là gói `acpx/runtime` nhúng từ Plugin `acpx` chính thức.
- Biến thể Docker Droid đưa `~/.factory` vào để lấy cài đặt, chuyển tiếp `FACTORY_API_KEY`, và yêu cầu API key đó vì xác thực OAuth/keyring Factory cục bộ không thể mang sang container. Nó dùng mục registry `droid exec --output-format acp` tích hợp của ACPX.
- Biến thể Docker OpenCode là một luồng hồi quy nghiêm ngặt cho một tác tử duy nhất. Nó ghi mô hình mặc định `OPENCODE_CONFIG_CONTENT` tạm thời từ `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (mặc định `opencode/kimi-k2.6`) sau khi nạp `~/.profile`, và `pnpm test:docker:live-acp-bind:opencode` yêu cầu transcript trợ lý đã gắn kết thay vì chấp nhận bỏ qua sau gắn kết dạng chung.
- Các lệnh gọi CLI `acpx` trực tiếp chỉ là đường dẫn thủ công/khắc phục tạm thời để so sánh hành vi bên ngoài Gateway. Smoke gắn kết ACP bằng Docker kiểm thử hậu phương runtime `acpx` nhúng của OpenClaw.

## Trực tiếp: smoke bộ kiểm thử app-server Codex

- Mục tiêu: xác thực bộ kiểm thử Codex do Plugin sở hữu thông qua phương thức
  `agent` Gateway thông thường:
  - tải Plugin `codex` đi kèm
  - chọn `openai/gpt-5.5`, mặc định định tuyến các lượt tác tử OpenAI qua Codex
  - gửi lượt tác tử Gateway đầu tiên tới `openai/gpt-5.5` với bộ kiểm thử Codex đã chọn
  - gửi lượt thứ hai tới cùng phiên OpenClaw và xác minh luồng app-server
    có thể tiếp tục
  - chạy `/codex status` và `/codex models` qua cùng đường dẫn lệnh Gateway
  - tùy chọn chạy hai phép dò shell nâng quyền đã được Guardian xem xét: một
    lệnh lành tính nên được phê duyệt và một lần tải lên bí mật giả nên bị
    từ chối để tác tử hỏi lại
- Kiểm thử: `src/gateway/gateway-codex-harness.live.test.ts`
- Bật: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Mô hình mặc định: `openai/gpt-5.5`
- Phép dò hình ảnh tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Phép dò MCP/công cụ tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Phép dò Guardian tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke ép buộc provider/model `agentRuntime.id: "codex"` để một bộ kiểm thử
  Codex bị hỏng không thể vượt qua bằng cách âm thầm rơi về PI.
- Xác thực: xác thực app-server Codex từ đăng nhập thuê bao Codex cục bộ. Các
  smoke Docker cũng có thể cung cấp `OPENAI_API_KEY` cho những phép dò không phải Codex khi áp dụng,
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

- Bộ chạy Docker nằm tại `scripts/test-live-codex-harness-docker.sh`.
- Nó nạp `~/.profile` đã mount, truyền `OPENAI_API_KEY`, sao chép các tệp xác thực
  CLI Codex khi có, cài `@openai/codex` vào tiền tố npm đã mount có thể ghi,
  đưa cây nguồn vào, rồi chỉ chạy kiểm thử trực tiếp cho bộ kiểm thử Codex.
- Docker bật mặc định các phép dò hình ảnh, MCP/công cụ và Guardian. Đặt
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` hoặc
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` hoặc
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` khi bạn cần một lần chạy gỡ lỗi
  hẹp hơn.
- Docker dùng cùng cấu hình runtime Codex tường minh, nên các bí danh cũ hoặc đường rơi về PI
  không thể che giấu hồi quy của bộ kiểm thử Codex.

### Công thức trực tiếp được khuyến nghị

Các allowlist hẹp, tường minh là nhanh nhất và ít nhiễu nhất:

- Một mô hình, trực tiếp (không qua Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Một mô hình, smoke Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Gọi công cụ trên nhiều provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tập trung Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke suy luận thích ứng Google:
  - Nếu khóa cục bộ nằm trong hồ sơ shell: `source ~/.profile`
  - Mặc định động Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Ngân sách động Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Ghi chú:

- `google/...` dùng Gemini API (API key).
- `google-antigravity/...` dùng cầu nối OAuth Antigravity (điểm cuối tác tử kiểu Cloud Code Assist).
- `google-gemini-cli/...` dùng Gemini CLI cục bộ trên máy của bạn (xác thực riêng + các điểm đặc thù về công cụ).
- Gemini API so với Gemini CLI:
  - API: OpenClaw gọi Gemini API được Google lưu trữ qua HTTP (API key / xác thực hồ sơ); đây là điều hầu hết người dùng hiểu là "Gemini".
  - CLI: OpenClaw gọi shell tới một binary `gemini` cục bộ; nó có xác thực riêng và có thể hành xử khác (hỗ trợ streaming/công cụ/độ lệch phiên bản).

## Trực tiếp: ma trận mô hình (những gì chúng ta bao phủ)

Không có "danh sách mô hình CI" cố định (trực tiếp là opt-in), nhưng đây là các mô hình **được khuyến nghị** để bao phủ thường xuyên trên máy phát triển có khóa.

### Bộ smoke hiện đại (gọi công cụ + hình ảnh)

Đây là lần chạy "các mô hình phổ biến" mà chúng ta kỳ vọng tiếp tục hoạt động:

- OpenAI (không phải Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (hoặc `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` và `google/gemini-3-flash-preview` (tránh các mô hình Gemini 2.x cũ hơn)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` và `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` và `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Chạy smoke Gateway với công cụ + hình ảnh:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Cơ sở: gọi công cụ (Read + Exec tùy chọn)

Chọn ít nhất một mô hình cho mỗi họ provider:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (hoặc `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (hoặc `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Phạm vi bao phủ bổ sung tùy chọn (nên có):

- xAI: `xai/grok-4.3` (hoặc bản mới nhất có sẵn)
- Mistral: `mistral/`… (chọn một mô hình có khả năng dùng "công cụ" mà bạn đã bật)
- Cerebras: `cerebras/`… (nếu bạn có quyền truy cập)
- LM Studio: `lmstudio/`… (cục bộ; gọi công cụ phụ thuộc vào chế độ API)

### Thị giác: gửi hình ảnh (tệp đính kèm → tin nhắn đa phương thức)

Bao gồm ít nhất một mô hình có khả năng xử lý hình ảnh trong `OPENCLAW_LIVE_GATEWAY_MODELS` (các biến thể Claude/Gemini/OpenAI có khả năng thị giác, v.v.) để chạy phép dò hình ảnh.

### Bộ tổng hợp / Gateway thay thế

Nếu bạn đã bật khóa, chúng ta cũng hỗ trợ kiểm thử qua:

- OpenRouter: `openrouter/...` (hàng trăm mô hình; dùng `openclaw models scan` để tìm ứng viên có khả năng công cụ+hình ảnh)
- OpenCode: `opencode/...` cho Zen và `opencode-go/...` cho Go (xác thực qua `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Các provider khác bạn có thể đưa vào ma trận trực tiếp (nếu có thông tin xác thực/cấu hình):

- Tích hợp sẵn: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Qua `models.providers` (điểm cuối tùy chỉnh): `minimax` (cloud/API), cùng mọi proxy tương thích OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, v.v.)

<Tip>
Đừng hardcode "tất cả mô hình" trong tài liệu. Danh sách có thẩm quyền là bất cứ thứ gì `discoverModels(...)` trả về trên máy của bạn cộng với các khóa hiện có.
</Tip>

## Thông tin xác thực (không bao giờ commit)

Các kiểm thử trực tiếp phát hiện thông tin xác thực giống như CLI. Hệ quả thực tế:

- Nếu CLI hoạt động, các kiểm thử live sẽ tìm thấy cùng các khóa đó.
- Nếu một kiểm thử live báo "no creds", hãy gỡ lỗi theo cùng cách bạn gỡ lỗi `openclaw models list` / lựa chọn mô hình.

- Hồ sơ xác thực theo từng tác nhân: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (đây là ý nghĩa của "profile keys" trong các kiểm thử live)
- Cấu hình: `~/.openclaw/openclaw.json` (hoặc `OPENCLAW_CONFIG_PATH`)
- Thư mục trạng thái cũ: `~/.openclaw/credentials/` (được sao chép vào home live đã dàn dựng khi có, nhưng không phải kho lưu khóa hồ sơ chính)
- Các lần chạy live cục bộ mặc định sao chép cấu hình đang hoạt động, các tệp `auth-profiles.json` theo từng tác nhân, `credentials/` cũ, và các thư mục xác thực CLI bên ngoài được hỗ trợ vào một home kiểm thử tạm; các home live đã dàn dựng bỏ qua `workspace/` và `sandboxes/`, đồng thời các ghi đè đường dẫn `agents.*.workspace` / `agentDir` bị loại bỏ để các phép thăm dò không chạm vào workspace thật trên máy chủ của bạn.

Nếu bạn muốn dựa vào khóa env (ví dụ đã export trong `~/.profile`), hãy chạy kiểm thử cục bộ sau khi `source ~/.profile`, hoặc dùng các runner Docker bên dưới (chúng có thể mount `~/.profile` vào container).

## Deepgram live (phiên âm âm thanh)

- Kiểm thử: `extensions/deepgram/audio.live.test.ts`
- Bật: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Kiểm thử: `extensions/byteplus/live.test.ts`
- Bật: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Ghi đè mô hình tùy chọn: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Kiểm thử: `extensions/comfy/comfy.live.test.ts`
- Bật: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Phạm vi:
  - Thực thi các đường dẫn hình ảnh, video và `music_generate` của comfy đi kèm
  - Bỏ qua từng khả năng trừ khi `plugins.entries.comfy.config.<capability>` được cấu hình
  - Hữu ích sau khi thay đổi việc gửi workflow comfy, polling, tải xuống, hoặc đăng ký plugin

## Image generation live

- Kiểm thử: `test/image-generation.runtime.live.test.ts`
- Lệnh: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Phạm vi:
  - Liệt kê mọi Plugin nhà cung cấp tạo hình ảnh đã đăng ký
  - Tải các biến env còn thiếu của nhà cung cấp từ login shell của bạn (`~/.profile`) trước khi thăm dò
  - Mặc định ưu tiên dùng khóa API live/env trước các hồ sơ xác thực đã lưu, để các khóa kiểm thử cũ trong `auth-profiles.json` không che khuất thông tin xác thực shell thật
  - Bỏ qua các nhà cung cấp không có xác thực/hồ sơ/mô hình có thể dùng
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để buộc xác thực bằng kho hồ sơ và bỏ qua các ghi đè chỉ dùng env

Đối với đường dẫn CLI đã phát hành, hãy thêm một smoke `infer` sau khi kiểm thử live của nhà cung cấp/runtime vượt qua:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Phần này bao phủ phân tích đối số CLI, phân giải cấu hình/tác nhân mặc định, kích hoạt plugin đi kèm, runtime tạo hình ảnh dùng chung, và yêu cầu nhà cung cấp live. Các phụ thuộc Plugin được kỳ vọng đã có trước khi tải runtime.

## Music generation live

- Kiểm thử: `extensions/music-generation-providers.live.test.ts`
- Bật: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Phạm vi:
  - Thực thi đường dẫn nhà cung cấp tạo nhạc đi kèm dùng chung
  - Hiện bao phủ Google và MiniMax
  - Tải các biến env của nhà cung cấp từ login shell của bạn (`~/.profile`) trước khi thăm dò
  - Mặc định ưu tiên dùng khóa API live/env trước các hồ sơ xác thực đã lưu, để các khóa kiểm thử cũ trong `auth-profiles.json` không che khuất thông tin xác thực shell thật
  - Bỏ qua các nhà cung cấp không có xác thực/hồ sơ/mô hình có thể dùng
  - Chạy cả hai chế độ runtime đã khai báo khi có:
    - `generate` với đầu vào chỉ có prompt
    - `edit` khi nhà cung cấp khai báo `capabilities.edit.enabled`
  - Phạm vi bao phủ lane dùng chung hiện tại:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: tệp live Comfy riêng, không thuộc lượt quét dùng chung này
- Thu hẹp tùy chọn:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Hành vi xác thực tùy chọn:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để buộc xác thực bằng kho hồ sơ và bỏ qua các ghi đè chỉ dùng env

## Video generation live

- Kiểm thử: `extensions/video-generation-providers.live.test.ts`
- Bật: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Phạm vi:
  - Thực thi đường dẫn nhà cung cấp tạo video đi kèm dùng chung
  - Mặc định dùng đường dẫn smoke an toàn cho bản phát hành: các nhà cung cấp không phải FAL, một yêu cầu text-to-video cho mỗi nhà cung cấp, prompt tôm hùm dài một giây, và giới hạn thao tác theo từng nhà cung cấp từ `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (mặc định là `180000`)
  - Mặc định bỏ qua FAL vì độ trễ hàng đợi phía nhà cung cấp có thể chiếm phần lớn thời gian phát hành; truyền `--video-providers fal` hoặc `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` để chạy rõ ràng
  - Tải các biến env của nhà cung cấp từ login shell của bạn (`~/.profile`) trước khi thăm dò
  - Mặc định ưu tiên dùng khóa API live/env trước các hồ sơ xác thực đã lưu, để các khóa kiểm thử cũ trong `auth-profiles.json` không che khuất thông tin xác thực shell thật
  - Bỏ qua các nhà cung cấp không có xác thực/hồ sơ/mô hình có thể dùng
  - Mặc định chỉ chạy `generate`
  - Đặt `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` để cũng chạy các chế độ chuyển đổi đã khai báo khi có:
    - `imageToVideo` khi nhà cung cấp khai báo `capabilities.imageToVideo.enabled` và nhà cung cấp/mô hình đã chọn chấp nhận đầu vào hình ảnh cục bộ dựa trên buffer trong lượt quét dùng chung
    - `videoToVideo` khi nhà cung cấp khai báo `capabilities.videoToVideo.enabled` và nhà cung cấp/mô hình đã chọn chấp nhận đầu vào video cục bộ dựa trên buffer trong lượt quét dùng chung
  - Các nhà cung cấp `imageToVideo` đã khai báo nhưng hiện bị bỏ qua trong lượt quét dùng chung:
    - `vydra` vì `veo3` đi kèm chỉ hỗ trợ văn bản và `kling` đi kèm yêu cầu URL hình ảnh từ xa
  - Phạm vi bao phủ Vydra theo nhà cung cấp:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - tệp đó chạy text-to-video `veo3` cộng với một lane `kling` mặc định dùng fixture URL hình ảnh từ xa
  - Phạm vi bao phủ live `videoToVideo` hiện tại:
    - chỉ `runway` khi mô hình đã chọn là `runway/gen4_aleph`
  - Các nhà cung cấp `videoToVideo` đã khai báo nhưng hiện bị bỏ qua trong lượt quét dùng chung:
    - `alibaba`, `qwen`, `xai` vì các đường dẫn đó hiện yêu cầu URL tham chiếu `http(s)` / MP4 từ xa
    - `google` vì lane Gemini/Veo dùng chung hiện tại dùng đầu vào cục bộ dựa trên buffer và đường dẫn đó không được chấp nhận trong lượt quét dùng chung
    - `openai` vì lane dùng chung hiện tại thiếu bảo đảm truy cập video inpaint/remix theo từng tổ chức
- Thu hẹp tùy chọn:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` để đưa mọi nhà cung cấp vào lượt quét mặc định, bao gồm cả FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` để giảm giới hạn thao tác của từng nhà cung cấp cho một lần chạy smoke mạnh tay
- Hành vi xác thực tùy chọn:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để buộc xác thực bằng kho hồ sơ và bỏ qua các ghi đè chỉ dùng env

## Media live harness

- Lệnh: `pnpm test:live:media`
- Mục đích:
  - Chạy các bộ kiểm thử live dùng chung cho hình ảnh, nhạc và video thông qua một entrypoint gốc của repo
  - Tự động tải các biến env còn thiếu của nhà cung cấp từ `~/.profile`
  - Mặc định tự động thu hẹp từng bộ kiểm thử vào các nhà cung cấp hiện có xác thực có thể dùng
  - Tái sử dụng `scripts/test-live.mjs`, để hành vi Heartbeat và chế độ yên lặng luôn nhất quán
- Ví dụ:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Liên quan

- [Kiểm thử](/vi/help/testing) - các bộ kiểm thử đơn vị, tích hợp, QA và Docker
