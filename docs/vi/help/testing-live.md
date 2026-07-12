---
read_when:
    - Chạy các bài kiểm tra nhanh trực tiếp cho ma trận mô hình / phần phụ trợ CLI / ACP / nhà cung cấp phương tiện
    - Gỡ lỗi quá trình phân giải thông tin xác thực khi kiểm thử trực tiếp
    - Thêm kiểm thử trực tiếp mới dành riêng cho nhà cung cấp
sidebarTitle: Live tests
summary: 'Các kiểm thử trực tiếp (có truy cập mạng): ma trận mô hình, backend CLI, ACP, nhà cung cấp phương tiện, thông tin xác thực'
title: 'Kiểm thử: các bộ kiểm thử trực tiếp'
x-i18n:
    generated_at: "2026-07-12T07:59:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539fc547425f66049fc4df2af29206c281b47ecb75908936977d93020ae19890
    source_path: help/testing-live.md
    workflow: 16
---

Để bắt đầu nhanh, chạy trình kiểm thử QA, các bộ kiểm thử đơn vị/tích hợp và các luồng Docker, hãy xem
[Kiểm thử](/vi/help/testing). Trang này trình bày các kiểm thử **trực tiếp** (có truy cập mạng):
ma trận mô hình, backend CLI, ACP, nhà cung cấp phương tiện và cách xử lý thông tin xác thực.

## Trực tiếp: các lệnh kiểm tra nhanh cục bộ

Xuất khóa nhà cung cấp cần thiết vào môi trường tiến trình trước khi thực hiện các
kiểm tra trực tiếp tùy trường hợp.

Kiểm tra nhanh phương tiện an toàn:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Kiểm tra nhanh an toàn về mức độ sẵn sàng của cuộc gọi thoại:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` là một lần chạy thử trừ khi có thêm `--yes`; chỉ sử dụng `--yes`
khi bạn thực sự muốn thực hiện cuộc gọi. Đối với Twilio, Telnyx và Plivo,
kiểm tra mức độ sẵn sàng chỉ thành công khi có URL webhook công khai - các URL
loopback cục bộ/riêng tư bị từ chối vì những nhà cung cấp này không thể truy cập chúng.

## Trực tiếp: quét khả năng của Node Android

- Kiểm thử: `src/gateway/android-node.capabilities.live.test.ts`
- Tập lệnh: `pnpm android:test:integration`
- Mục tiêu: gọi **mọi lệnh hiện được quảng bá** bởi một Node Android đã kết nối và xác nhận hành vi theo hợp đồng của lệnh.
- Phạm vi:
  - Thiết lập thủ công/có điều kiện tiên quyết (bộ kiểm thử không cài đặt/chạy/ghép đôi ứng dụng).
  - Xác thực `node.invoke` của Gateway theo từng lệnh cho Node Android đã chọn.
- Thiết lập trước bắt buộc:
  - Ứng dụng Android đã kết nối và ghép đôi với Gateway.
  - Ứng dụng được giữ ở nền trước.
  - Đã cấp quyền/chấp thuận thu thập cho các khả năng mà bạn mong đợi sẽ vượt qua kiểm thử.
- Ghi đè đích tùy chọn:
  - `OPENCLAW_ANDROID_NODE_ID` hoặc `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Chi tiết đầy đủ về thiết lập Android: [Ứng dụng Android](/vi/platforms/android)

## Trực tiếp: kiểm tra nhanh mô hình (khóa hồ sơ)

Các kiểm thử mô hình trực tiếp được chia thành hai lớp để cô lập lỗi:

- "Mô hình trực tiếp" cho biết nhà cung cấp/mô hình có thể phản hồi với khóa đã cho hay không.
- "Kiểm tra nhanh Gateway" cho biết toàn bộ quy trình Gateway+tác nhân có hoạt động với mô hình đó hay không (phiên, lịch sử, công cụ, chính sách sandbox, v.v.).

Các danh sách mô hình tuyển chọn dưới đây nằm trong `src/agents/live-model-filter.ts` và
thay đổi theo thời gian; hãy coi các mảng tại đó là nguồn chính xác, không phải
trang này.

MiniMax M3 sử dụng `minimax/MiniMax-M3` làm tham chiếu nhà cung cấp/mô hình mặc định.

### Lớp 1: Hoàn thành trực tiếp bằng mô hình (không có Gateway)

- Kiểm thử: `src/agents/models.profiles.live.test.ts`
- Mục tiêu:
  - Liệt kê các mô hình được phát hiện
  - Sử dụng `getApiKeyForModel` để chọn các mô hình mà bạn có thông tin xác thực
  - Chạy một lượt hoàn thành nhỏ cho mỗi mô hình (và các kiểm thử hồi quy có mục tiêu khi cần)
- Cách bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
  - Đặt `OPENCLAW_LIVE_MODELS=modern`, `small` hoặc `all` (bí danh của `modern`) để thực sự chạy bộ kiểm thử này; nếu không, nó sẽ bị bỏ qua, nhờ đó việc chỉ chạy `pnpm test:live` vẫn tập trung vào kiểm tra nhanh Gateway.
- Cách chọn mô hình:
  - `OPENCLAW_LIVE_MODELS=modern` chạy danh sách ưu tiên tín hiệu cao đã tuyển chọn (xem [Trực tiếp: ma trận mô hình](#live-model-matrix-what-we-cover))
  - `OPENCLAW_LIVE_MODELS=small` chạy danh sách ưu tiên mô hình nhỏ đã tuyển chọn
  - `OPENCLAW_LIVE_MODELS=all` là bí danh của `modern`
  - hoặc `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."` (danh sách cho phép phân tách bằng dấu phẩy)
  - Các lượt chạy mô hình nhỏ Ollama cục bộ mặc định dùng `http://127.0.0.1:11434`; chỉ đặt `OPENCLAW_LIVE_OLLAMA_BASE_URL` cho các điểm cuối LAN, tùy chỉnh hoặc Ollama Cloud.
  - Các lượt quét modern/all và small mặc định giới hạn theo độ dài danh sách tuyển chọn tương ứng; đặt `OPENCLAW_LIVE_MAX_MODELS=0` để quét toàn bộ hồ sơ đã chọn hoặc một số dương để đặt giới hạn nhỏ hơn.
  - Các lượt quét toàn bộ sử dụng `OPENCLAW_LIVE_TEST_TIMEOUT_MS` làm thời gian chờ cho toàn bộ kiểm thử mô hình trực tiếp. Mặc định: 60 phút.
  - Các phép thăm dò mô hình trực tiếp mặc định chạy song song 20 luồng; đặt `OPENCLAW_LIVE_MODEL_CONCURRENCY` để ghi đè.
- Cách chọn nhà cung cấp:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (danh sách cho phép phân tách bằng dấu phẩy)
- Nguồn khóa:
  - Theo mặc định: kho hồ sơ và phương án dự phòng từ biến môi trường
  - Đặt `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để bắt buộc **chỉ dùng kho hồ sơ**
- Lý do tồn tại:
  - Phân biệt "API nhà cung cấp bị lỗi / khóa không hợp lệ" với "quy trình tác nhân Gateway bị lỗi"
  - Chứa các kiểm thử hồi quy nhỏ, cô lập (ví dụ: phát lại suy luận OpenAI Responses/Codex Responses + các luồng gọi công cụ)

### Lớp 2: Kiểm tra nhanh Gateway + tác nhân phát triển (những gì "@openclaw" thực sự làm)

- Kiểm thử: `src/gateway/gateway-models.profiles.live.test.ts`
- Mục tiêu:
  - Khởi chạy một Gateway trong tiến trình
  - Tạo/chỉnh sửa một phiên `agent:dev:*` (ghi đè mô hình cho mỗi lượt chạy)
  - Lặp qua các mô hình có khóa và xác nhận:
    - phản hồi "có ý nghĩa" (không có công cụ)
    - một lần gọi công cụ thực sự hoạt động (thăm dò đọc)
    - các phép thăm dò công cụ bổ sung tùy chọn (thăm dò thực thi+đọc)
    - các đường dẫn hồi quy OpenAI (chỉ gọi công cụ -> lượt tiếp theo) tiếp tục hoạt động
- Chi tiết phép thăm dò (để bạn có thể nhanh chóng giải thích lỗi):
  - Thăm dò `read`: kiểm thử ghi một tệp nonce vào không gian làm việc rồi yêu cầu tác nhân `read` tệp đó và phản hồi lại nonce.
  - Thăm dò `exec+read`: kiểm thử yêu cầu tác nhân dùng `exec` để ghi một nonce vào tệp tạm, sau đó dùng `read` để đọc lại.
  - Thăm dò hình ảnh: kiểm thử đính kèm một PNG được tạo tự động (mèo + mã ngẫu nhiên) và mong đợi mô hình trả về `cat <CODE>`.
  - Tham chiếu triển khai: `src/gateway/gateway-models.profiles.live.test.ts` và `test/helpers/live-image-probe.ts`.
- Cách bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
- Cách chọn mô hình:
  - Mặc định: danh sách ưu tiên tín hiệu cao (`modern`) đã tuyển chọn
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` chạy danh sách mô hình nhỏ đã tuyển chọn qua toàn bộ quy trình Gateway+tác nhân
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` là bí danh của `modern`
  - Hoặc đặt `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (hoặc danh sách phân tách bằng dấu phẩy) để thu hẹp
  - Các lượt quét Gateway modern/all và small mặc định giới hạn theo độ dài danh sách tuyển chọn tương ứng; đặt `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` để quét toàn bộ lựa chọn hoặc một số dương để đặt giới hạn nhỏ hơn.
- Cách chọn nhà cung cấp (tránh "mọi thứ đều qua OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (danh sách cho phép phân tách bằng dấu phẩy)
- Các phép thăm dò công cụ + hình ảnh luôn được bật trong kiểm thử trực tiếp này:
  - Thăm dò `read` + thăm dò `exec+read` (kiểm thử tải công cụ)
  - thăm dò hình ảnh chạy khi mô hình công bố hỗ trợ đầu vào hình ảnh
  - Luồng (cấp cao):
    - Kiểm thử tạo một PNG nhỏ với "CAT" + mã ngẫu nhiên (`test/helpers/live-image-probe.ts`)
    - Gửi qua `agent` bằng `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway phân tích tệp đính kèm thành `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Tác nhân nhúng chuyển tiếp thông điệp người dùng đa phương thức đến mô hình
    - Xác nhận: phản hồi chứa `cat` + mã (dung sai OCR: cho phép lỗi nhỏ)

<Tip>
Để xem những gì bạn có thể kiểm thử trên máy của mình (và các mã định danh `provider/model` chính xác), hãy chạy:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Trực tiếp: kiểm tra nhanh backend CLI (Claude, Gemini hoặc các CLI cục bộ khác)

- Kiểm thử: `src/gateway/gateway-cli-backend.live.test.ts`
- Mục tiêu: xác thực quy trình Gateway + tác nhân bằng backend CLI cục bộ mà không động đến cấu hình mặc định của bạn.
- Các giá trị mặc định của kiểm tra nhanh dành riêng cho từng backend nằm trong định nghĩa `cli-backend.ts` của Plugin sở hữu.
- Bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Mặc định:
  - Nhà cung cấp/mô hình mặc định: `claude-cli/claude-sonnet-4-6`
  - Hành vi lệnh/đối số/hình ảnh đến từ siêu dữ liệu của Plugin backend CLI sở hữu.
- Ghi đè (tùy chọn):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` để gửi tệp đính kèm hình ảnh thực (các đường dẫn được chèn vào lời nhắc). Mặc định tắt trong các công thức Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` để truyền đường dẫn tệp hình ảnh dưới dạng đối số CLI thay vì chèn vào lời nhắc.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (hoặc `"list"`) để kiểm soát cách truyền đối số hình ảnh khi `IMAGE_ARG` được đặt.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` để gửi lượt thứ hai và xác thực luồng tiếp tục.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` để chủ động tham gia phép thăm dò tính liên tục Claude Sonnet -> Opus trong cùng phiên khi mô hình đã chọn hỗ trợ đích chuyển đổi. Mặc định tắt, kể cả trong các công thức Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` để chủ động tham gia phép thăm dò MCP/công cụ qua loopback. Mặc định tắt trong các công thức Docker.

Ví dụ:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Kiểm tra nhanh cấu hình Gemini MCP ít tốn tài nguyên:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Thao tác này không yêu cầu Gemini tạo phản hồi. Nó ghi cùng các thiết lập hệ thống mà
OpenClaw cung cấp cho Gemini, sau đó chạy `gemini --debug mcp list` để chứng minh rằng
máy chủ đã lưu với `transport: "streamable-http"` được chuẩn hóa thành dạng MCP HTTP
của Gemini và có thể kết nối với máy chủ MCP HTTP có khả năng truyền luồng cục bộ.

Công thức Docker:

```bash
pnpm test:docker:live-cli-backend
```

Các công thức Docker cho từng nhà cung cấp:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Ghi chú:

- Trình chạy Docker nằm tại `scripts/test-live-cli-backend-docker.sh`.
- Trình này chạy kiểm tra nhanh backend CLI trực tiếp bên trong ảnh Docker của kho mã với người dùng `node` không phải root.
- Trình này phân giải siêu dữ liệu kiểm tra nhanh CLI từ Plugin sở hữu, sau đó cài đặt gói CLI Linux tương ứng (`@anthropic-ai/claude-code` hoặc `@google/gemini-cli`) vào một tiền tố có thể ghi và được lưu bộ nhớ đệm tại `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (mặc định: `~/.cache/openclaw/docker-cli-tools`).
- `codex-cli` không còn là backend CLI đi kèm; thay vào đó hãy sử dụng `openai/*` với runtime máy chủ ứng dụng Codex (xem [Trực tiếp: kiểm tra nhanh bộ kiểm thử máy chủ ứng dụng Codex](#live-codex-app-server-harness-smoke)).
- `pnpm test:docker:live-cli-backend:claude-subscription` yêu cầu OAuth gói đăng ký Claude Code có tính di động thông qua `~/.claude/.credentials.json` với `claudeAiOauth.subscriptionType` hoặc `CLAUDE_CODE_OAUTH_TOKEN` từ `claude setup-token`. Trước tiên, công thức này chứng minh lệnh `claude -p` trực tiếp hoạt động trong Docker, sau đó chạy hai lượt backend CLI của Gateway mà không giữ lại các biến môi trường khóa API Anthropic. Luồng gói đăng ký này mặc định tắt các phép thăm dò MCP/công cụ và hình ảnh của Claude vì chúng tiêu thụ giới hạn sử dụng của gói đăng ký đã đăng nhập và Anthropic có thể thay đổi hành vi tính phí và giới hạn tốc độ của Claude Agent SDK / `claude -p` mà không cần bản phát hành OpenClaw.
- Claude và Gemini hỗ trợ cùng một tập phép thăm dò (lượt văn bản, phân loại hình ảnh, lệnh gọi công cụ MCP `cron`, tính liên tục khi chuyển mô hình) thông qua các cờ ở trên, nhưng không phép thăm dò nào chạy theo mặc định - hãy chủ động bật từng cờ khi cần.

## Trực tiếp: khả năng truy cập proxy HTTP/2 của APNs

- Kiểm thử: `src/infra/push-apns-http2.live.test.ts`
- Mục tiêu: tạo đường hầm qua proxy HTTP CONNECT cục bộ đến điểm cuối APNs sandbox của Apple, gửi yêu cầu xác thực HTTP/2 của APNs và xác nhận phản hồi `403 InvalidProviderToken` thực từ Apple được trả về qua đường dẫn proxy.
- Bật:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Thời gian chờ tùy chọn:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Trực tiếp: kiểm tra nhanh liên kết ACP (`/acp spawn ... --bind here`)

- Kiểm thử: `src/gateway/gateway-acp-bind.live.test.ts`
- Mục tiêu: xác thực luồng liên kết cuộc trò chuyện ACP thực tế với một tác tử ACP trực tiếp:
  - gửi `/acp spawn <agent> --bind here`
  - liên kết tại chỗ một cuộc trò chuyện tổng hợp của kênh nhắn tin
  - gửi một tin nhắn tiếp theo thông thường trong chính cuộc trò chuyện đó
  - xác minh tin nhắn tiếp theo được ghi vào bản ghi phiên ACP đã liên kết
- Bật:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Mặc định:
  - Các tác tử ACP trong Docker: `claude,codex,gemini`
  - Tác tử ACP cho lệnh trực tiếp `pnpm test:live ...`: `claude`
  - Kênh tổng hợp: ngữ cảnh cuộc trò chuyện kiểu tin nhắn trực tiếp Slack
  - Phần phụ trợ ACP: `acpx`
- Ghi đè:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1` (hoặc `on`/`true`/`yes`) để buộc bật phép thăm dò hình ảnh; mọi giá trị khác sẽ buộc tắt. Theo mặc định, phép thăm dò chạy cho mọi tác tử ngoại trừ `opencode`.
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- Lưu ý:
  - Làn kiểm thử này sử dụng bề mặt `chat.send` của Gateway với các trường tuyến nguồn tổng hợp chỉ dành cho quản trị viên, để kiểm thử có thể đính kèm ngữ cảnh kênh nhắn tin mà không giả vờ phân phối ra bên ngoài.
  - Khi chưa đặt `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND`, kiểm thử sử dụng sổ đăng ký tác tử tích hợp sẵn của Plugin `acpx` nhúng cho tác tử bộ khung ACP đã chọn.
  - Theo mặc định, việc tạo MCP Cron cho phiên đã liên kết được thực hiện theo khả năng tốt nhất vì các bộ khung ACP bên ngoài có thể hủy lệnh gọi MCP sau khi bằng chứng liên kết/hình ảnh đã đạt; đặt `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` để yêu cầu nghiêm ngặt phép thăm dò Cron sau liên kết đó.

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

Các công thức Docker cho một tác tử:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Lưu ý về Docker:

- Trình chạy Docker nằm tại `scripts/test-live-acp-bind-docker.sh`.
- Theo mặc định, trình chạy thực hiện lần lượt kiểm thử nhanh liên kết ACP với các tác tử CLI trực tiếp tổng hợp: `claude`, `codex`, rồi `gemini`.
- Sử dụng `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` hoặc `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` để thu hẹp ma trận.
- Trình chạy đưa tài liệu xác thực CLI tương ứng vào bộ chứa, rồi cài đặt CLI trực tiếp được yêu cầu (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid qua `https://app.factory.ai/cli`, `@google/gemini-cli` hoặc `opencode-ai`) nếu còn thiếu. Bản thân phần phụ trợ ACP là gói `acpx/runtime` nhúng từ Plugin `acpx` chính thức.
- Biến thể Docker Droid đưa `~/.factory` vào để cung cấp thiết lập, chuyển tiếp `FACTORY_API_KEY` và yêu cầu khóa API đó vì xác thực OAuth/kho khóa Factory cục bộ không thể chuyển vào bộ chứa. Biến thể này sử dụng mục đăng ký `droid exec --output-format acp` tích hợp sẵn của ACPX.
- Biến thể Docker OpenCode là một làn hồi quy nghiêm ngặt chỉ dành cho một tác tử. Biến thể này ghi mô hình mặc định `OPENCODE_CONFIG_CONTENT` tạm thời từ `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (mặc định là `opencode/kimi-k2.6`).
- Các lệnh gọi CLI `acpx` trực tiếp chỉ là đường dẫn thủ công/giải pháp thay thế để so sánh hành vi bên ngoài Gateway. Kiểm thử nhanh liên kết ACP bằng Docker thực thi phần phụ trợ thời gian chạy `acpx` nhúng của OpenClaw.

## Trực tiếp: kiểm thử nhanh bộ khung máy chủ ứng dụng Codex

- Mục tiêu: xác thực bộ khung Codex do Plugin sở hữu thông qua phương thức Gateway
  `agent` thông thường:
  - tải Plugin `codex` đi kèm
  - chọn một mô hình OpenAI qua `/model <ref> --runtime codex`
  - gửi lượt tác tử Gateway đầu tiên với mức suy luận được yêu cầu
  - gửi lượt thứ hai đến cùng phiên OpenClaw và xác minh luồng máy chủ ứng dụng
    có thể tiếp tục
  - chạy `/codex status` và `/codex models` qua cùng đường dẫn lệnh Gateway
  - tùy chọn chạy hai phép thăm dò shell nâng quyền đã được Guardian xem xét: một
    lệnh vô hại cần được phê duyệt và một lần tải lên bí mật giả cần bị
    từ chối để tác tử hỏi lại
- Kiểm thử: `src/gateway/gateway-codex-harness.live.test.ts`
- Bật: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Mô hình cơ sở của bộ khung: `openai/gpt-5.6-luna`
- Mặc định lựa chọn khóa API OpenAI mới: `openai/gpt-5.6`
- Mức suy luận mặc định: `low`
- Ghi đè mô hình: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- Ghi đè mức suy luận: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- Ghi đè ma trận: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- Chế độ xác thực: `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth` (mặc định) sử dụng
  thông tin đăng nhập Codex đã sao chép; `api-key` sử dụng `OPENAI_API_KEY` thông qua máy chủ ứng dụng Codex.
- Phép thăm dò hình ảnh tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Phép thăm dò MCP/công cụ tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Phép thăm dò Guardian tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Kiểm thử nhanh buộc cấu hình nhà cung cấp/mô hình `agentRuntime.id: "codex"` để một bộ khung Codex
  bị hỏng không thể đạt kiểm thử bằng cách âm thầm quay về OpenClaw.
- Xác thực: xác thực máy chủ ứng dụng Codex từ thông tin đăng nhập gói thuê bao Codex cục bộ, hoặc
  `OPENAI_API_KEY` khi `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key`. Docker có thể
  sao chép `~/.codex/auth.json` và `~/.codex/config.toml` cho các lần chạy bằng gói thuê bao.

Công thức cục bộ:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.6-luna \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Công thức Docker:

```bash
pnpm test:docker:live-codex-harness
```

Ma trận Codex nguyên bản GPT-5.6:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_TARGETS='openai/gpt-5.6-sol=ultra,openai/gpt-5.6-terra=ultra,openai/gpt-5.6-luna=max' \
  pnpm test:docker:live-codex-harness
```

Mặc định khóa API OpenAI mới:

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Bằng chứng này không đặt `OPENCLAW_LIVE_GATEWAY_MODELS`, phân giải mô hình thông qua
đường nối lựa chọn suy luận trong quy trình thiết lập ban đầu mới, xác nhận `openai/gpt-5.6`, rồi
chạy một lượt Gateway thực tế với mô hình đã phân giải đó.

Ma trận OpenClaw nhúng GPT-5.6:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Lưu ý về Docker:

- Trình chạy Docker nằm tại `scripts/test-live-codex-harness-docker.sh`.
- Trình chạy chuyển `OPENAI_API_KEY`, sao chép các tệp xác thực CLI Codex khi có, cài đặt
  `@openai/codex` vào một tiền tố npm được gắn kết và có thể ghi,
  đưa cây mã nguồn vào, rồi chỉ chạy kiểm thử trực tiếp bộ khung Codex.
- Docker bật các phép thăm dò hình ảnh, MCP/công cụ và Guardian theo mặc định. Đặt
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` hoặc
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` hoặc
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` khi bạn cần một lần chạy gỡ lỗi
  có phạm vi hẹp hơn.
- Docker sử dụng cùng cấu hình thời gian chạy Codex tường minh, vì vậy các bí danh cũ hoặc cơ chế
  quay về OpenClaw không thể che giấu hồi quy của bộ khung Codex.
- Các mục tiêu trong ma trận chạy tuần tự trong một bộ chứa. Tập lệnh Docker điều chỉnh
  thời gian chờ mặc định 35 phút theo số lượng mục tiêu; mọi thời gian chờ của shell bên ngoài hoặc CI phải
  cho phép cùng tổng thời gian đó. CI chuẩn giữ mỗi mục tiêu GPT-5.6 trong một phân đoạn riêng.

### Các công thức trực tiếp được khuyến nghị

Danh sách cho phép hẹp và tường minh là nhanh nhất và ít chập chờn nhất:

- Một mô hình, trực tiếp (không qua Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- Hồ sơ trực tiếp cho mô hình nhỏ:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Hồ sơ Gateway cho mô hình nhỏ:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Kiểm thử nhanh API Ollama Cloud:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Một mô hình, kiểm thử nhanh Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Gọi công cụ trên nhiều nhà cung cấp:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Kiểm thử nhanh trực tiếp Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Tập trung vào Google (khóa API Gemini + Antigravity):
  - Gemini (khóa API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Kiểm thử nhanh suy luận thích ứng của Google (`qa manual` từ CLI QA riêng tư — yêu cầu `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` và một bản sao làm việc mã nguồn; xem [tổng quan về QA](/vi/concepts/qa-e2e-automation)):
  - Mặc định động Gemini 3: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Ngân sách động Gemini 2.5: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Lưu ý:

- `google/...` sử dụng API Gemini (khóa API).
- `google-antigravity/...` sử dụng cầu nối OAuth Antigravity (điểm cuối tác tử kiểu Cloud Code Assist).
- `google-gemini-cli/...` sử dụng CLI Gemini cục bộ trên máy của bạn (xác thực riêng và các đặc thù công cụ riêng).
- API Gemini so với CLI Gemini:
  - API: OpenClaw gọi API Gemini do Google lưu trữ qua HTTP (khóa API/xác thực hồ sơ); đây là điều phần lớn người dùng muốn nói khi nhắc đến "Gemini".
  - CLI: OpenClaw gọi một tệp nhị phân `gemini` cục bộ qua shell; tệp này có cơ chế xác thực riêng và có thể hoạt động khác biệt (truyền phát/hỗ trợ công cụ/chênh lệch phiên bản).

## Trực tiếp: ma trận mô hình (phạm vi chúng tôi kiểm thử)

Kiểm thử trực tiếp là tùy chọn bật, vì vậy không có "danh sách mô hình CI" cố định. `OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern` (và bí danh `all` tương ứng) chạy danh sách ưu tiên tuyển chọn từ `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` trong `src/agents/live-model-filter.ts`, theo thứ tự ưu tiên sau:

| Nhà cung cấp/mô hình                          | Ghi chú    |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-5`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | Gemini API |
| `google/gemini-3.5-flash`                     | Gemini API |
| `cohere/command-a-plus-05-2026`               |            |
| `moonshot/kimi-k2.7-code`                     |            |
| `anthropic/claude-opus-4-6`                   |            |
| `deepseek/deepseek-v4-flash`                  |            |
| `deepseek/deepseek-v4-pro`                    |            |
| `minimax/MiniMax-M3`                          |            |
| `openai/gpt-5.5`                              |            |
| `openrouter/openai/gpt-5.2-chat`              |            |
| `openrouter/minimax/minimax-m2.7`             |            |
| `opencode-go/glm-5`                           |            |
| `openrouter/ai21/jamba-large-1.7`             |            |
| `xai/grok-4.5`                                |            |
| `xai/grok-4.20-0309-reasoning`                |            |
| `zai/glm-5.1`                                 |            |
| `fireworks/accounts/fireworks/models/glm-5p1` |            |
| `minimax-portal/minimax-m3`                   |            |

Danh sách **mô hình nhỏ** được tuyển chọn (`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`), lấy từ `SMALL_LIVE_MODEL_PRIORITY`:

| Nhà cung cấp/mô hình          |
| ---------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

Ghi chú về danh sách hiện đại:

- Các nhà cung cấp `codex` và `codex-cli` bị loại khỏi lượt quét hiện đại mặc định (chúng bao quát hành vi phần phụ trợ CLI/ACP, được kiểm thử riêng ở trên). Bản thân `openai/gpt-5.5` mặc định được định tuyến qua bộ kiểm thử app-server Codex; xem [Trực tiếp: kiểm thử khói bộ kiểm thử app-server Codex](#live-codex-app-server-harness-smoke).
- `fireworks`, `google`, `openrouter` và `xai` chỉ chạy các mã định danh mô hình được tuyển chọn rõ ràng trong lượt quét hiện đại (không tự động mở rộng thành "mọi mô hình từ nhà cung cấp này").
- Đưa ít nhất một mô hình hỗ trợ hình ảnh (các biến thể thị giác thuộc họ Claude/Gemini/OpenAI, v.v.) vào `OPENCLAW_LIVE_GATEWAY_MODELS` để thực hiện phép thăm dò hình ảnh.

Chạy kiểm thử khói Gateway với công cụ + hình ảnh trên một tập hợp được chọn thủ công từ nhiều nhà cung cấp:

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

Phạm vi bổ sung tùy chọn ngoài các danh sách được tuyển chọn (nên có, hãy chọn một mô hình hỗ trợ "công cụ" mà bạn đã bật):

- Mistral: `mistral/...`
- Cerebras: `cerebras/...` (nếu bạn có quyền truy cập)
- LM Studio: `lmstudio/...` (cục bộ; việc gọi công cụ phụ thuộc vào chế độ API)

### Bộ tổng hợp / Gateway thay thế

Nếu đã bật các khóa, bạn cũng có thể kiểm thử qua:

- OpenRouter: `openrouter/...` (hàng trăm mô hình; dùng `openclaw models scan` để tìm các ứng viên hỗ trợ công cụ+hình ảnh)
- OpenCode: `opencode/...` cho Zen và `opencode-go/...` cho Go (xác thực qua `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Các nhà cung cấp khác mà bạn có thể đưa vào ma trận trực tiếp (nếu có thông tin xác thực/cấu hình):

- Tích hợp sẵn: `anthropic`, `cerebras`, `github-copilot`, `google`, `google-antigravity`, `google-gemini-cli`, `google-vertex`, `groq`, `mistral`, `openai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `zai`
- Qua `models.providers` (điểm cuối tùy chỉnh): `minimax` (đám mây/API), cùng mọi proxy tương thích với OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, v.v.)

<Tip>
Không mã hóa cứng "tất cả mô hình" trong tài liệu. Danh sách có thẩm quyền là bất kỳ nội dung nào `discoverModels(...)` trả về trên máy của bạn, cộng với các khóa hiện có.
</Tip>

## Thông tin xác thực (tuyệt đối không commit)

Các kiểm thử trực tiếp khám phá thông tin xác thực theo cùng cách với CLI. Các hệ quả thực tế:

- Nếu CLI hoạt động, các kiểm thử trực tiếp sẽ tìm thấy cùng các khóa.
- Nếu kiểm thử trực tiếp báo "không có thông tin xác thực", hãy gỡ lỗi theo cùng cách bạn gỡ lỗi `openclaw models list` / lựa chọn mô hình.

- Hồ sơ xác thực theo tác tử: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (đây là ý nghĩa của "khóa hồ sơ" trong các kiểm thử trực tiếp)
- Cấu hình: `~/.openclaw/openclaw.json` (hoặc `OPENCLAW_CONFIG_PATH`)
- Thư mục OAuth cũ: `~/.openclaw/credentials/` (được sao chép vào thư mục chính trực tiếp tạm dựng khi hiện diện, nhưng không phải kho khóa hồ sơ chính)
- Các lần chạy trực tiếp cục bộ sao chép cấu hình đang hoạt động (đã loại bỏ các giá trị ghi đè `agents.*.workspace` / `agentDir`) và `auth-profiles.json` của từng tác tử — không sao chép phần còn lại trong thư mục của tác tử đó, nên dữ liệu `workspace/` và `sandboxes/` không bao giờ được đưa vào thư mục chính tạm dựng — cùng với thư mục `credentials/` cũ và các tệp/thư mục xác thực CLI bên ngoài được hỗ trợ (`.claude.json`, `.claude/.credentials.json`, `.claude/settings*.json`, `.claude/backups`, `.codex/auth.json`, `.codex/config.toml`, `.gemini`, `.minimax`) vào một thư mục chính kiểm thử tạm thời.

Nếu muốn dựa vào các khóa môi trường, hãy xuất chúng trước các kiểm thử cục bộ hoặc dùng các trình chạy Docker bên dưới với một `OPENCLAW_PROFILE_FILE` rõ ràng.

## Deepgram trực tiếp (phiên âm thanh)

- Kiểm thử: `extensions/deepgram/audio.live.test.ts`
- Bật: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Gói lập trình BytePlus trực tiếp

- Kiểm thử: `extensions/byteplus/live.test.ts`
- Bật: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Ghi đè mô hình tùy chọn: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Đa phương tiện quy trình làm việc ComfyUI trực tiếp

- Kiểm thử: `extensions/comfy/comfy.live.test.ts`
- Bật: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Phạm vi:
  - Thực hiện các đường dẫn hình ảnh, video và `music_generate` đi kèm của comfy
  - Bỏ qua từng khả năng trừ khi `plugins.entries.comfy.config.<capability>` đã được cấu hình
  - Hữu ích sau khi thay đổi việc gửi quy trình làm việc comfy, thăm dò, tải xuống hoặc đăng ký plugin

## Tạo hình ảnh trực tiếp

- Kiểm thử: `test/image-generation.runtime.live.test.ts`
- Lệnh: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Bộ kiểm thử: `pnpm test:live:media image`
- Phạm vi:
  - Liệt kê mọi plugin nhà cung cấp tạo hình ảnh đã đăng ký
  - Dùng các biến môi trường của nhà cung cấp đã được xuất trước khi thăm dò
  - Mặc định ưu tiên khóa API trực tiếp/môi trường hơn hồ sơ xác thực đã lưu, để các khóa kiểm thử cũ trong `auth-profiles.json` không che khuất thông tin xác thực thực tế của shell
  - Bỏ qua các nhà cung cấp không có xác thực/hồ sơ/mô hình khả dụng
  - Chạy từng nhà cung cấp đã cấu hình qua môi trường thời gian chạy tạo hình ảnh dùng chung:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để buộc xác thực bằng kho hồ sơ và bỏ qua các giá trị ghi đè chỉ từ môi trường

Đối với đường dẫn CLI được phát hành, hãy thêm một kiểm thử khói `infer` sau khi kiểm thử trực tiếp nhà cung cấp/môi trường thời gian chạy vượt qua:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Phạm vi này bao quát việc phân tích cú pháp đối số CLI, phân giải cấu hình/tác tử mặc định, kích hoạt plugin đi kèm, môi trường thời gian chạy tạo hình ảnh dùng chung và yêu cầu trực tiếp đến nhà cung cấp. Các phần phụ thuộc của plugin phải hiện diện trước khi tải môi trường thời gian chạy.

## Tạo nhạc trực tiếp

- Kiểm thử: `extensions/music-generation-providers.live.test.ts`
- Bật: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Bộ kiểm thử: `pnpm test:live:media music`
- Phạm vi:
  - Thực hiện đường dẫn nhà cung cấp tạo nhạc dùng chung đi kèm
  - Hiện bao phủ `fal`, `google`, `minimax` và `openrouter`
  - Dùng các biến môi trường của nhà cung cấp đã được xuất trước khi thăm dò
  - Mặc định ưu tiên khóa API trực tiếp/môi trường hơn hồ sơ xác thực đã lưu, để các khóa kiểm thử cũ trong `auth-profiles.json` không che khuất thông tin xác thực thực tế của shell
  - Bỏ qua các nhà cung cấp không có xác thực/hồ sơ/mô hình khả dụng
  - Chạy cả hai chế độ môi trường thời gian chạy đã khai báo khi có:
    - `generate` với đầu vào chỉ gồm lời nhắc
    - `edit` khi nhà cung cấp khai báo `capabilities.edit.enabled`
  - `comfy` có tệp trực tiếp riêng, không nằm trong lượt quét dùng chung này
- Thu hẹp tùy chọn:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Hành vi xác thực tùy chọn:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để buộc xác thực bằng kho hồ sơ và bỏ qua các giá trị ghi đè chỉ từ môi trường

## Tạo video trực tiếp

- Kiểm thử: `extensions/video-generation-providers.live.test.ts`
- Bật: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Bộ kiểm thử: `pnpm test:live:media video`
- Phạm vi:
  - Kiểm thử đường dẫn dùng chung của các trình cung cấp tạo video được đóng gói trên `alibaba`, `byteplus`, `deepinfra`, `fal`, `google`, `minimax`, `openai`, `openrouter`, `pixverse`, `qwen`, `runway`, `together`, `vydra`, `xai`
  - Mặc định sử dụng đường dẫn kiểm tra nhanh an toàn cho bản phát hành: một yêu cầu chuyển văn bản thành video cho mỗi trình cung cấp, lời nhắc về tôm hùm dài một giây và giới hạn thời gian thao tác cho từng trình cung cấp từ `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (mặc định là `180000`)
  - Mặc định bỏ qua FAL vì độ trễ hàng đợi phía trình cung cấp có thể chiếm phần lớn thời gian phát hành; truyền `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` (hoặc xóa danh sách bỏ qua) để chạy rõ ràng
  - Sử dụng các biến môi trường của trình cung cấp đã được xuất trước khi thăm dò
  - Mặc định ưu tiên khóa API trực tiếp/từ môi trường hơn các hồ sơ xác thực đã lưu, để các khóa kiểm thử cũ trong `auth-profiles.json` không che khuất thông tin xác thực thực tế của shell
  - Bỏ qua các trình cung cấp không có thông tin xác thực/hồ sơ/mô hình khả dụng
  - Mặc định chỉ chạy `generate`
  - Đặt `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` để cũng chạy các chế độ chuyển đổi đã khai báo khi khả dụng:
    - `imageToVideo` khi trình cung cấp khai báo `capabilities.imageToVideo.enabled` và trình cung cấp/mô hình đã chọn chấp nhận đầu vào ảnh cục bộ dựa trên bộ đệm trong lượt kiểm thử dùng chung
    - `videoToVideo` khi trình cung cấp khai báo `capabilities.videoToVideo.enabled` và trình cung cấp/mô hình đã chọn chấp nhận đầu vào video cục bộ dựa trên bộ đệm trong lượt kiểm thử dùng chung
  - Trình cung cấp `imageToVideo` hiện được khai báo nhưng bị bỏ qua trong lượt kiểm thử dùng chung:
    - `vydra` (làn này không hỗ trợ đầu vào ảnh cục bộ dựa trên bộ đệm)
  - Phạm vi kiểm thử dành riêng cho trình cung cấp Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - Tệp đó chạy làn chuyển văn bản thành video `veo3` cùng với làn chuyển ảnh thành video `kling`, mặc định sử dụng một dữ liệu cố định là URL ảnh từ xa (dùng `OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` để ghi đè).
  - Phạm vi kiểm thử dành riêng cho trình cung cấp xAI:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - Trường hợp cổ điển trước tiên tạo một khung hình PNG cục bộ hình vuông, bỏ qua thông số hình học, yêu cầu một đoạn video chuyển từ ảnh dài một giây, thăm dò cho đến khi hoàn tất và xác minh bộ đệm đã tải xuống.
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - Trường hợp 1.5 tạo một khung hình PNG cục bộ, yêu cầu một đoạn video chuyển từ ảnh 1080P dài một giây, thăm dò cho đến khi hoàn tất và xác minh bộ đệm đã tải xuống.
  - Phạm vi kiểm thử trực tiếp `videoToVideo` hiện tại:
    - Chỉ `runway` khi mô hình đã chọn được phân giải thành `gen4_aleph`
  - Các trình cung cấp `videoToVideo` hiện được khai báo nhưng bị bỏ qua trong lượt kiểm thử dùng chung:
    - `alibaba`, `google`, `openai`, `qwen`, `xai` vì các đường dẫn đó hiện yêu cầu URL tham chiếu `http(s)` từ xa thay vì đầu vào cục bộ dựa trên bộ đệm
- Thu hẹp tùy chọn:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` để bao gồm mọi trình cung cấp trong lượt kiểm thử mặc định, kể cả FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` để giảm giới hạn thời gian mỗi thao tác của trình cung cấp cho một lượt kiểm tra nhanh quyết liệt
- Hành vi xác thực tùy chọn:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để buộc xác thực bằng kho hồ sơ và bỏ qua các giá trị ghi đè chỉ từ môi trường

## Bộ kiểm thử trực tiếp cho phương tiện

- Lệnh: `pnpm test:live:media`
- Điểm vào: `test/e2e/qa-lab/media/hosted-media-provider-live.ts`, chạy `pnpm test:live -- <suite-test-file>` cho mỗi bộ kiểm thử đã chọn, nhờ đó hành vi Heartbeat và chế độ yên lặng nhất quán với các lượt chạy `pnpm test:live` khác.
- Mục đích:
  - Chạy các bộ kiểm thử trực tiếp dùng chung cho hình ảnh, âm nhạc và video thông qua một điểm vào gốc của kho mã
  - Tự động tải các biến môi trường còn thiếu của trình cung cấp từ `~/.profile`
  - Mặc định tự động thu hẹp từng bộ kiểm thử còn các trình cung cấp hiện có thông tin xác thực khả dụng
- Cờ:
  - `--providers <csv>` là bộ lọc trình cung cấp toàn cục; `--image-providers` / `--music-providers` / `--video-providers` giới hạn bộ lọc vào một bộ kiểm thử
  - `--all-providers` bỏ qua bộ lọc tự động dựa trên xác thực
  - `--allow-empty` thoát với mã `0` khi việc lọc không để lại trình cung cấp nào có thể chạy
  - `--quiet` / `--no-quiet` được chuyển tiếp tới `test:live`
- Ví dụ:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Liên quan

- [Kiểm thử](/vi/help/testing) - các bộ kiểm thử đơn vị, tích hợp, QA và Docker
