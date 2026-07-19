---
read_when:
    - Chạy kiểm thử nhanh trực tiếp cho ma trận mô hình / backend CLI / ACP / nhà cung cấp phương tiện đa phương tiện
    - Gỡ lỗi quá trình phân giải thông tin xác thực cho kiểm thử trực tiếp
    - Thêm kiểm thử trực tiếp mới dành riêng cho nhà cung cấp
sidebarTitle: Live tests
summary: 'Kiểm thử trực tiếp (có truy cập mạng): ma trận mô hình, backend CLI, ACP, nhà cung cấp phương tiện, thông tin xác thực'
title: 'Kiểm thử: các bộ kiểm thử trực tiếp'
x-i18n:
    generated_at: "2026-07-19T05:58:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6b6330c4f17081429d48ff2a47b48b0a0133555c835a17cea5edf5d1f880d91e
    source_path: help/testing-live.md
    workflow: 16
---

Để bắt đầu nhanh, xem các trình chạy QA, bộ kiểm thử đơn vị/tích hợp và các luồng Docker, hãy tham khảo
[Kiểm thử](/vi/help/testing). Trang này đề cập đến các kiểm thử **trực tiếp** (có truy cập mạng):
ma trận mô hình, backend CLI, ACP, nhà cung cấp phương tiện và cách xử lý thông tin xác thực.

## Kiểm thử trực tiếp so với Gateway thực của bạn

Các bộ kiểm thử trực tiếp và kiểm tra nhanh đặc biệt tuyệt đối không được làm gián đoạn một Gateway đang
phục vụ lưu lượng thực (của bạn hoặc của một nhà vận hành khác):

- Sử dụng Gateway của riêng bạn: dùng Gateway trong tiến trình (Lớp 2 bên dưới) hoặc khởi động một
  phiên bản phát triển với thư mục trạng thái riêng biệt (`OPENCLAW_STATE_DIR=<scratch>`) và một
  cổng trống. Không liên kết cổng Gateway mặc định (18789) khi một Gateway thực
  đang chạy trên cổng đó.
- Không `openclaw gateway stop`/`restart` (hoặc các lệnh tương đương `launchctl`/`systemctl`/tmux)
  một dịch vụ mà bạn không khởi động trong phiên này — đó là
  phiên bản trực tiếp của nhà vận hành. Trước tiên, hãy nhận được sự chấp thuận rõ ràng.
- Cần dữ liệu thực tế? Sao chép trạng thái/DB trực tiếp vào thư mục trạng thái phát triển và kiểm thử
  trên bản sao. Việc di chuyển tại chỗ trạng thái của một Gateway trực tiếp cũng yêu cầu
  sự chấp thuận rõ ràng.

## Trực tiếp: các lệnh kiểm tra nhanh cục bộ

Xuất khóa nhà cung cấp cần thiết trong môi trường tiến trình trước khi thực hiện các bước
kiểm tra trực tiếp đặc biệt.

Kiểm tra nhanh phương tiện an toàn:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "Kiểm tra nhanh trực tiếp OpenClaw." \
  --output /tmp/openclaw-live-smoke.mp3
```

Kiểm tra nhanh an toàn về khả năng sẵn sàng cho cuộc gọi thoại:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` là một lần chạy thử trừ khi cũng có `--yes`; chỉ sử dụng `--yes`
khi bạn có ý định thực hiện cuộc gọi thật. Đối với Twilio, Telnyx và Plivo,
việc kiểm tra khả năng sẵn sàng thành công yêu cầu URL webhook công khai - các URL loopback
cục bộ/riêng tư bị từ chối vì những nhà cung cấp đó không thể truy cập chúng.

## Trực tiếp: rà soát khả năng của Node Android

- Kiểm thử: `src/gateway/android-node.capabilities.live.test.ts`
- Tập lệnh: `pnpm android:test:integration`
- Mục tiêu: gọi **mọi lệnh hiện được công bố** bởi một Node Android đã kết nối và xác nhận hành vi theo hợp đồng của lệnh.
- Phạm vi:
  - Thiết lập thủ công/có điều kiện tiên quyết (bộ kiểm thử không cài đặt/chạy/ghép đôi ứng dụng).
  - Xác thực `node.invoke` của Gateway theo từng lệnh cho Node Android đã chọn.
- Thiết lập trước bắt buộc:
  - Ứng dụng Android đã kết nối và ghép đôi với Gateway.
  - Duy trì ứng dụng ở tiền cảnh.
  - Đã cấp quyền/chấp thuận ghi nhận cho các khả năng mà bạn mong đợi vượt qua.
- Ghi đè mục tiêu tùy chọn:
  - `OPENCLAW_ANDROID_NODE_ID` hoặc `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Chi tiết đầy đủ về thiết lập Android: [Ứng dụng Android](/vi/platforms/android)

## Trực tiếp: kiểm tra nhanh mô hình (khóa hồ sơ)

Các kiểm thử mô hình trực tiếp được chia thành hai lớp để cô lập lỗi:

- "Mô hình trực tiếp" cho biết nhà cung cấp/mô hình có thể phản hồi với khóa đã cho hay không.
- "Kiểm tra nhanh Gateway" cho biết toàn bộ Pipeline Gateway+tác tử có hoạt động với mô hình đó hay không (phiên, lịch sử, công cụ, chính sách sandbox, v.v.).

Các danh sách mô hình được tuyển chọn bên dưới nằm trong `src/agents/live-model-filter.ts` và
thay đổi theo thời gian; hãy coi các mảng tại đó là nguồn chính xác, không phải
trang này.

MiniMax M3 sử dụng `minimax/MiniMax-M3` làm tham chiếu nhà cung cấp/mô hình mặc định.

### Lớp 1: Hoàn thành trực tiếp bằng mô hình (không có Gateway)

- Kiểm thử: `src/agents/models.profiles.live.test.ts`
- Mục tiêu:
  - Liệt kê các mô hình đã phát hiện
  - Sử dụng `getApiKeyForModel` để chọn các mô hình mà bạn có thông tin xác thực
  - Chạy một yêu cầu hoàn thành nhỏ cho mỗi mô hình (và các kiểm thử hồi quy có mục tiêu khi cần)
- Cách bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi trực tiếp Vitest)
  - Đặt `OPENCLAW_LIVE_MODELS=modern`, `small` hoặc `all` (bí danh của `modern`) để thực sự chạy bộ kiểm thử này; nếu không, bộ kiểm thử sẽ bị bỏ qua, nhờ đó riêng `pnpm test:live` vẫn tập trung vào kiểm tra nhanh Gateway.
- Cách chọn mô hình:
  - `OPENCLAW_LIVE_MODELS=modern` chạy danh sách ưu tiên tín hiệu cao đã được tuyển chọn (xem [Trực tiếp: ma trận mô hình](#live-model-matrix-what-we-cover))
  - `OPENCLAW_LIVE_MODELS=small` chạy danh sách ưu tiên mô hình nhỏ đã được tuyển chọn
  - `OPENCLAW_LIVE_MODELS=all` là bí danh của `modern`
  - hoặc `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."` (danh sách cho phép phân tách bằng dấu phẩy)
  - Các lần chạy mô hình nhỏ Ollama cục bộ mặc định dùng `http://127.0.0.1:11434`; chỉ đặt `OPENCLAW_LIVE_OLLAMA_BASE_URL` cho các điểm cuối LAN, tùy chỉnh hoặc Ollama Cloud.
  - Các lượt rà soát hiện đại/toàn bộ và mô hình nhỏ mặc định dùng độ dài danh sách được tuyển chọn tương ứng làm giới hạn; đặt `OPENCLAW_LIVE_MAX_MODELS=0` để rà soát toàn diện hồ sơ đã chọn hoặc một số dương để đặt giới hạn nhỏ hơn.
  - Các lượt rà soát toàn diện sử dụng `OPENCLAW_LIVE_TEST_TIMEOUT_MS` làm thời gian chờ cho toàn bộ kiểm thử mô hình trực tiếp. Mặc định: 60 phút.
  - Theo mặc định, các phép thăm dò mô hình trực tiếp chạy song song 20 luồng; đặt `OPENCLAW_LIVE_MODEL_CONCURRENCY` để ghi đè.
- Cách chọn nhà cung cấp:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (danh sách cho phép phân tách bằng dấu phẩy)
- Nguồn khóa:
  - Theo mặc định: kho hồ sơ và các phương án dự phòng từ môi trường
  - Đặt `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để bắt buộc **chỉ dùng kho hồ sơ**
- Lý do tồn tại:
  - Phân biệt "API của nhà cung cấp bị lỗi / khóa không hợp lệ" với "Pipeline tác tử Gateway bị lỗi"
  - Chứa các kiểm thử hồi quy nhỏ, độc lập (ví dụ: phát lại suy luận OpenAI Responses/Codex Responses + các luồng gọi công cụ)

### Lớp 2: Kiểm tra nhanh Gateway + tác tử phát triển ("@openclaw" thực sự làm gì)

- Kiểm thử: `src/gateway/gateway-models.profiles.live.test.ts`
- Mục tiêu:
  - Khởi chạy một Gateway trong tiến trình
  - Tạo/vá một phiên `agent:dev:*` (ghi đè mô hình cho mỗi lần chạy)
  - Lặp qua các mô hình có khóa và xác nhận:
    - phản hồi "có ý nghĩa" (không có công cụ)
    - một lần gọi công cụ thực sự hoạt động (thăm dò đọc)
    - các phép thăm dò công cụ bổ sung tùy chọn (thăm dò thực thi+đọc)
    - các đường dẫn hồi quy OpenAI (chỉ gọi công cụ -> theo dõi tiếp) tiếp tục hoạt động
- Chi tiết phép thăm dò (để bạn có thể nhanh chóng giải thích lỗi):
  - Phép thăm dò `read`: kiểm thử ghi một tệp nonce trong không gian làm việc và yêu cầu tác tử `read` tệp đó rồi phản hồi lại nonce.
  - Phép thăm dò `exec+read`: kiểm thử yêu cầu tác tử dùng `exec` để ghi một nonce vào tệp tạm, sau đó dùng `read` để đọc lại.
  - Phép thăm dò hình ảnh: kiểm thử đính kèm một PNG được tạo (mèo + mã ngẫu nhiên) và mong đợi mô hình trả về `cat <CODE>`.
  - Tham chiếu triển khai: `src/gateway/gateway-models.profiles.live.test.ts` và `test/helpers/live-image-probe.ts`.
- Cách bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi trực tiếp Vitest)
- Cách chọn mô hình:
  - Mặc định: danh sách ưu tiên tín hiệu cao (`modern`) đã được tuyển chọn
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` chạy danh sách mô hình nhỏ đã được tuyển chọn qua toàn bộ Pipeline Gateway+tác tử
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` là bí danh của `modern`
  - Hoặc đặt `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (hoặc danh sách phân tách bằng dấu phẩy) để thu hẹp
  - Các lượt rà soát Gateway hiện đại/toàn bộ và mô hình nhỏ mặc định dùng độ dài danh sách được tuyển chọn tương ứng làm giới hạn; đặt `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` để rà soát toàn diện lựa chọn hoặc một số dương để đặt giới hạn nhỏ hơn.
- Cách chọn nhà cung cấp (tránh "mọi thứ qua OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (danh sách cho phép phân tách bằng dấu phẩy)
- Các phép thăm dò công cụ + hình ảnh luôn được bật trong kiểm thử trực tiếp này:
  - Phép thăm dò `read` + phép thăm dò `exec+read` (kiểm thử tải công cụ)
  - phép thăm dò hình ảnh chạy khi mô hình công bố hỗ trợ đầu vào hình ảnh
  - Luồng (mức cao):
    - Kiểm thử tạo một PNG nhỏ có "CAT" + mã ngẫu nhiên (`test/helpers/live-image-probe.ts`)
    - Gửi tệp đó qua `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway phân tích tệp đính kèm thành `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Tác tử nhúng chuyển tiếp thông điệp người dùng đa phương thức đến mô hình
    - Xác nhận: phản hồi chứa `cat` + mã (dung sai OCR: cho phép lỗi nhỏ)

<Tip>
Để xem bạn có thể kiểm thử những gì trên máy của mình (và các mã định danh `provider/model` chính xác), hãy chạy:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Trực tiếp: kiểm tra nhanh backend CLI (Claude, Gemini hoặc các CLI cục bộ khác)

- Kiểm thử: `src/gateway/gateway-cli-backend.live.test.ts`
- Mục tiêu: xác thực Pipeline Gateway + tác tử bằng backend CLI cục bộ mà không tác động đến cấu hình mặc định của bạn.
- Các giá trị mặc định của kiểm tra nhanh dành riêng cho backend nằm cùng định nghĩa `cli-backend.ts` của Plugin sở hữu.
- Bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi trực tiếp Vitest)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Giá trị mặc định:
  - Nhà cung cấp/mô hình mặc định: `claude-cli/claude-sonnet-4-6`
  - Hành vi lệnh/đối số/hình ảnh đến từ siêu dữ liệu của Plugin backend CLI sở hữu.
- Ghi đè (tùy chọn):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` để gửi tệp đính kèm hình ảnh thực (các đường dẫn được chèn vào lời nhắc). Mặc định tắt trong các công thức Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` để truyền đường dẫn tệp hình ảnh dưới dạng đối số CLI thay vì chèn vào lời nhắc.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (hoặc `"list"`) để kiểm soát cách truyền đối số hình ảnh khi đặt `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` để gửi lượt thứ hai và xác thực luồng tiếp tục.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` để chọn tham gia phép thăm dò tính liên tục trong cùng phiên Claude Sonnet -> Opus khi mô hình đã chọn hỗ trợ mục tiêu chuyển đổi. Mặc định tắt, kể cả trong các công thức Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` để chọn tham gia phép thăm dò loopback MCP/công cụ. Mặc định tắt trong các công thức Docker.

Ví dụ:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Kiểm tra nhanh cấu hình MCP Gemini ít tốn kém:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Thao tác này không yêu cầu Gemini tạo phản hồi. Nó ghi cùng các cài đặt hệ thống
mà OpenClaw cung cấp cho Gemini, sau đó chạy `gemini --debug mcp list` để chứng minh rằng một
máy chủ `transport: "streamable-http"` đã lưu được chuẩn hóa thành hình dạng MCP HTTP của Gemini
và có thể kết nối với một máy chủ MCP HTTP có thể phát trực tuyến cục bộ.

Công thức Docker:

```bash
pnpm test:docker:live-cli-backend
```

Các công thức Docker dành cho một nhà cung cấp:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Ghi chú:

- Trình chạy Docker nằm tại `scripts/test-live-cli-backend-docker.sh`.
- Nó chạy smoke test trực tiếp cho backend CLI bên trong ảnh Docker của kho lưu trữ bằng người dùng không phải root `node`.
- Nó phân giải siêu dữ liệu smoke test CLI từ plugin sở hữu, sau đó cài đặt gói CLI Linux tương ứng (`@anthropic-ai/claude-code` hoặc `@google/gemini-cli`) vào một tiền tố có thể ghi được và lưu vào bộ nhớ đệm tại `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (mặc định: `~/.cache/openclaw/docker-cli-tools`).
- `codex-cli` không còn là backend CLI đi kèm; thay vào đó, hãy dùng `openai/*` với runtime app-server Codex (xem [Trực tiếp: smoke test bộ kiểm thử app-server Codex](#live-codex-app-server-harness-smoke)).
- `pnpm test:docker:live-cli-backend:claude-subscription` yêu cầu OAuth đăng ký Claude Code có tính di động thông qua `~/.claude/.credentials.json` với `claudeAiOauth.subscriptionType` hoặc `CLAUDE_CODE_OAUTH_TOKEN` từ `claude setup-token`. Trước tiên, nó xác minh `claude -p` trực tiếp trong Docker, sau đó chạy hai lượt backend CLI của Gateway mà không giữ lại các biến môi trường khóa API Anthropic. Lane đăng ký này mặc định vô hiệu hóa các phép thăm dò công cụ/MCP Claude và hình ảnh vì chúng tiêu tốn hạn mức sử dụng của gói đăng ký đã đăng nhập, đồng thời Anthropic có thể thay đổi hành vi thanh toán và giới hạn tốc độ của Claude Agent SDK / `claude -p` mà không cần một bản phát hành OpenClaw.
- Claude và Gemini hỗ trợ cùng một tập hợp phép thăm dò (lượt văn bản, phân loại hình ảnh, lệnh gọi công cụ MCP `cron`, tính liên tục khi chuyển đổi mô hình) thông qua các cờ ở trên, nhưng không phép thăm dò nào trong số đó chạy theo mặc định - hãy bật riêng từng cờ khi cần.

## Trực tiếp: khả năng kết nối proxy HTTP/2 của APNs

- Kiểm thử: `src/infra/push-apns-http2.live.test.ts`
- Mục tiêu: tạo đường hầm qua proxy HTTP CONNECT cục bộ đến điểm cuối APNs sandbox của Apple, gửi yêu cầu xác thực HTTP/2 của APNs và khẳng định phản hồi `403 InvalidProviderToken` thực từ Apple được trả về qua đường dẫn proxy.
- Bật:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Thời gian chờ tùy chọn:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Trực tiếp: smoke test liên kết ACP (`/acp spawn ... --bind here`)

- Kiểm thử: `src/gateway/gateway-acp-bind.live.test.ts`
- Mục tiêu: xác thực luồng liên kết cuộc hội thoại ACP thực với một tác nhân ACP trực tiếp:
  - gửi `/acp spawn <agent> --bind here`
  - liên kết tại chỗ một cuộc hội thoại kênh tin nhắn tổng hợp
  - gửi một nội dung theo sau thông thường trong cùng cuộc hội thoại đó
  - xác minh nội dung theo sau xuất hiện trong bản ghi phiên ACP đã liên kết
- Bật:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Mặc định:
  - Các tác nhân ACP trong Docker: `claude,codex,gemini`
  - Tác nhân ACP cho `pnpm test:live ...` trực tiếp: `claude`
  - Kênh tổng hợp: ngữ cảnh cuộc hội thoại kiểu tin nhắn trực tiếp Slack
  - Backend ACP: `acpx`
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
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1` (hoặc `on`/`true`/`yes`) để buộc bật phép thăm dò hình ảnh; mọi giá trị khác đều buộc tắt phép thăm dò này. Chạy theo mặc định cho mọi tác nhân ngoại trừ `opencode`.
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- Ghi chú:
  - Lane này sử dụng bề mặt `chat.send` của Gateway với các trường tuyến khởi nguồn tổng hợp chỉ dành cho quản trị viên để kiểm thử có thể đính kèm ngữ cảnh kênh tin nhắn mà không giả vờ phân phối ra bên ngoài.
  - Khi `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` chưa được đặt, kiểm thử sử dụng sổ đăng ký tác nhân tích hợp sẵn của plugin `acpx` nhúng cho tác nhân bộ kiểm thử ACP đã chọn.
  - Theo mặc định, việc tạo MCP Cron cho phiên đã liên kết được thực hiện theo cơ chế nỗ lực tối đa vì các bộ kiểm thử ACP bên ngoài có thể hủy lệnh gọi MCP sau khi bằng chứng liên kết/hình ảnh đã đạt; hãy đặt `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` để áp dụng nghiêm ngặt phép thăm dò Cron sau liên kết đó.

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

Các công thức Docker cho một tác nhân:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Ghi chú Docker:

- Trình chạy Docker nằm tại `scripts/test-live-acp-bind-docker.sh`.
- Theo mặc định, nó lần lượt chạy smoke test liên kết ACP dựa trên các tác nhân CLI trực tiếp tổng hợp: `claude`, `codex`, rồi `gemini`.
- Dùng `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` hoặc `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` để thu hẹp ma trận.
- Nó đưa dữ liệu xác thực CLI tương ứng vào vùng chuẩn bị trong container, sau đó cài đặt CLI trực tiếp được yêu cầu (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid qua `https://app.factory.ai/cli`, `@google/gemini-cli` hoặc `opencode-ai`) nếu còn thiếu. Bản thân backend ACP là gói `acpx/runtime` nhúng từ plugin `acpx` chính thức.
- Biến thể Docker Droid đưa `~/.factory` vào vùng chuẩn bị cho phần cài đặt, chuyển tiếp `FACTORY_API_KEY` và yêu cầu khóa API đó vì thông tin xác thực OAuth/kho khóa Factory cục bộ không thể chuyển vào container. Nó sử dụng mục đăng ký `droid exec --output-format acp` tích hợp sẵn của ACPX.
- Biến thể Docker OpenCode là một lane hồi quy nghiêm ngặt chỉ dành cho một tác nhân. Nó ghi một mô hình mặc định `OPENCODE_CONFIG_CONTENT` tạm thời từ `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (mặc định `opencode/kimi-k2.6`).
- Các lệnh gọi CLI `acpx` trực tiếp chỉ là đường dẫn thủ công/giải pháp thay thế để so sánh hành vi bên ngoài Gateway. Smoke test liên kết ACP trong Docker thực thi backend runtime `acpx` nhúng của OpenClaw.

## Trực tiếp: smoke test bộ kiểm thử app-server Codex

- Mục tiêu: xác thực bộ kiểm thử Codex do plugin sở hữu thông qua phương thức Gateway
  `agent` thông thường:
  - tải plugin `codex` đi kèm
  - chọn một mô hình OpenAI thông qua `/model <ref> --runtime codex`
  - gửi lượt tác nhân Gateway đầu tiên với cấp độ suy luận được yêu cầu
  - gửi lượt thứ hai đến cùng phiên OpenClaw và xác minh luồng app-server
    có thể tiếp tục
  - chạy `/codex status` và `/codex models` thông qua cùng đường dẫn lệnh
    Gateway
  - tùy chọn chạy hai phép thăm dò shell nâng quyền được Guardian review: một lệnh
    lành tính cần được phê duyệt và một thao tác tải lên bí mật giả cần bị
    từ chối để tác nhân hỏi lại
- Kiểm thử: `src/gateway/gateway-codex-harness.live.test.ts`
- Bật: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Mô hình cơ sở của bộ kiểm thử: `openai/gpt-5.6-luna`
- Mặc định chọn khóa API OpenAI mới: `openai/gpt-5.6`
- Mức suy luận mặc định: `low`
- Ghi đè mô hình: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- Ghi đè mức suy luận: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- Khẳng định mức nỗ lực cho mô hình không mặc định:
  `OPENCLAW_LIVE_CODEX_HARNESS_EXPECTED_EFFORT=<level>`
- Ghi đè ma trận: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- Chế độ xác thực: `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth` (mặc định) sử dụng thông tin đăng nhập Codex
  đã sao chép; `api-key` sử dụng `OPENAI_API_KEY` thông qua app-server Codex.
- Phép thăm dò hình ảnh tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Phép thăm dò MCP/công cụ tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Phép thăm dò Guardian tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Kiểm thử áp lực tiếp tục tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1` thêm
  bốn lượt lịch sử, sau đó đóng và khởi động lại Gateway cùng app-server Codex
  ba lần, đồng thời yêu cầu giữ nguyên mã định danh luồng gốc và lịch sử
  hội thoại. Ghi đè các số lượng giới hạn bằng
  `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS_HISTORY_TURNS` (1-20) và
  `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS_RESTARTS` (1-10).
- Kiểm thử áp lực phân tỏa tùy chọn: đặt `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1`
  và `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_COUNT` (1-12). Bộ kiểm thử khởi động
  đồng thời mọi tiến trình con, chờ mọi lượt chạy đạt trạng thái kết thúc và xác minh
  từng phản hồi riêng biệt của tiến trình con cùng danh tính luồng gốc.
- Kiểm thử áp lực Compaction tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS=1`
  tạo đầu ra công cụ gốc có giới hạn, yêu cầu các sự kiện Compaction tự động,
  xác minh số lượng Compaction đã lưu và khả năng nhớ lại dấu hiệu ẩn, khởi động lại
  Gateway cùng app-server Codex vật lý, rồi lặp lại đợt đầu ra và
  Compaction. Điều chỉnh khối lượng công việc giới hạn bằng
  `OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS_TURNS` (1-8) và
  `OPENCLAW_LIVE_CODEX_HARNESS_LARGE_OUTPUT_BYTES` (100000-1000000).
- Phép thăm dò từ chối chuyển tiếp vòng lặp tùy chọn:
  `OPENCLAW_LIVE_CODEX_HARNESS_DISABLE_LOOP_RELAY=1`
- Tùy chọn suy luận được yêu cầu có thể ánh xạ đến mức nỗ lực gần nhất mà Codex công bố
  cho mô hình đó. Ví dụ: Luna ánh xạ `minimal` thành `low`.
- Các mô hình danh mục Codex đã biết tự động suy ra chính xác mức nỗ lực gốc đó.
  Các giá trị ghi đè mô hình không xác định phải nêu rõ mức nỗ lực ánh xạ dự kiến.
- Smoke test buộc dùng nhà cung cấp/mô hình `agentRuntime.id: "codex"` để một bộ kiểm thử Codex
  bị hỏng không thể vượt qua bằng cách âm thầm dự phòng về OpenClaw.
- Xác thực: xác thực app-server Codex từ thông tin đăng nhập gói đăng ký Codex cục bộ, hoặc
  `OPENAI_API_KEY` khi `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key`. Docker có thể
  sao chép `~/.codex/auth.json` và `~/.codex/config.toml` cho các lượt chạy bằng gói đăng ký.

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

Kiểm thử áp lực khởi động lại và lịch sử:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1 \
pnpm test:docker:live-codex-harness
```

Kiểm thử áp lực phân tỏa, đầu ra lớn, Compaction và khởi động lại:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_COUNT=8 \
  OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS=1 \
  pnpm test:docker:live-codex-harness
```

Ma trận Codex gốc GPT-5.6:

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

Bằng chứng này để `OPENCLAW_LIVE_GATEWAY_MODELS` ở trạng thái chưa đặt, phân giải mô hình thông qua
seam chọn suy luận khi bắt đầu sử dụng mới, khẳng định `openai/gpt-5.6`, rồi
chạy một lượt Gateway thực với mô hình đã phân giải đó.

Ma trận OpenClaw nhúng GPT-5.6:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Ghi chú Docker:

- Trình chạy Docker nằm tại `scripts/test-live-codex-harness-docker.sh`.
- Nó chuyển `OPENAI_API_KEY`, sao chép các tệp xác thực Codex CLI khi có, cài đặt
  `@openai/codex` vào một tiền tố npm được gắn kết
  có thể ghi, chuẩn bị cây nguồn, sau đó chỉ chạy kiểm thử trực tiếp của bộ kiểm thử Codex.
- Docker bật mặc định các phép thăm dò hình ảnh, MCP/công cụ và Guardian. Đặt
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` hoặc
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` hoặc
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` khi cần một lượt chạy gỡ lỗi
  có phạm vi hẹp hơn.
- Docker sử dụng cùng cấu hình thời gian chạy Codex tường minh, vì vậy các bí danh cũ hoặc cơ chế
  dự phòng của OpenClaw không thể che giấu hồi quy của bộ kiểm thử Codex.
- Các đích Matrix chạy tuần tự trong một vùng chứa. Tập lệnh Docker điều chỉnh
  thời gian chờ mặc định 35 phút theo số lượng đích; mọi thời gian chờ của shell bên ngoài hoặc CI phải
  cho phép cùng tổng thời gian đó. CI chính thức giữ mỗi đích GPT-5.6 trong một phân đoạn riêng.

### Các công thức chạy trực tiếp được khuyến nghị

Danh sách cho phép hẹp, tường minh là nhanh nhất và ít chập chờn nhất:

- Một mô hình, trực tiếp (không qua Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- Hồ sơ trực tiếp cho mô hình nhỏ:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Hồ sơ Gateway cho mô hình nhỏ:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Kiểm thử khói API Ollama Cloud:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Một mô hình, kiểm thử khói Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Gọi công cụ trên nhiều nhà cung cấp:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Kiểm thử khói trực tiếp Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Tập trung vào Google (khóa API Gemini + Antigravity):
  - Gemini (khóa API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Kiểm thử khói tư duy thích ứng của Google (`qa manual` từ CLI QA riêng tư — yêu cầu `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` và một bản checkout nguồn; xem [tổng quan về QA](/vi/concepts/qa-e2e-automation)):
  - Mặc định động của Gemini 3: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Ngân sách động của Gemini 2.5: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Ghi chú:

- `google/...` sử dụng API Gemini (khóa API).
- `google-antigravity/...` sử dụng cầu nối OAuth Antigravity (điểm cuối tác nhân kiểu Cloud Code Assist).
- `google-gemini-cli/...` sử dụng Gemini CLI cục bộ trên máy của bạn (cơ chế xác thực riêng + các đặc thù về công cụ).
- API Gemini so với Gemini CLI:
  - API: OpenClaw gọi API Gemini được Google lưu trữ qua HTTP (khóa API / xác thực hồ sơ); đây là điều hầu hết người dùng muốn nói khi nhắc đến "Gemini".
  - CLI: OpenClaw gọi một tệp nhị phân `gemini` cục bộ qua shell; nó có cơ chế xác thực riêng và có thể hoạt động khác biệt (hỗ trợ truyền phát/công cụ/chênh lệch phiên bản).

## Trực tiếp: ma trận mô hình (phạm vi chúng tôi bao phủ)

Chạy trực tiếp là tùy chọn tham gia, vì vậy không có "danh sách mô hình CI" cố định. `OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern` (và bí danh `all` của chúng) chạy danh sách ưu tiên được tuyển chọn từ `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` trong `src/agents/live-model-filter.ts`, theo thứ tự ưu tiên sau:

| Nhà cung cấp/mô hình                          | Ghi chú    |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-5`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | API Gemini |
| `google/gemini-3.5-flash`                     | API Gemini |
| `cohere/command-a-plus-05-2026`               |            |
| `moonshot/kimi-k3`                            |            |
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

Danh sách **mô hình nhỏ** được tuyển chọn (`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`), từ `SMALL_LIVE_MODEL_PRIORITY`:

| Nhà cung cấp/mô hình         |
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

- Các nhà cung cấp `codex` và `codex-cli` bị loại khỏi lượt quét hiện đại mặc định (chúng bao phủ hành vi phần phụ trợ CLI/ACP và được kiểm thử riêng ở trên). Bản thân `openai/gpt-5.5` mặc định định tuyến qua bộ kiểm thử máy chủ ứng dụng Codex; xem [Trực tiếp: kiểm thử khói bộ kiểm thử máy chủ ứng dụng Codex](#live-codex-app-server-harness-smoke).
- `fireworks`, `google`, `openrouter` và `xai` chỉ chạy các ID mô hình được tuyển chọn tường minh trong lượt quét hiện đại (không tự động mở rộng thành "mọi mô hình từ nhà cung cấp này").
- Bao gồm ít nhất một mô hình hỗ trợ hình ảnh (các biến thể thị giác thuộc họ Claude/Gemini/OpenAI, v.v.) trong `OPENCLAW_LIVE_GATEWAY_MODELS` để thực hiện phép thăm dò hình ảnh.

Chạy kiểm thử khói Gateway với công cụ + hình ảnh trên một tập hợp đa nhà cung cấp được chọn thủ công:

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

Phạm vi bổ sung tùy chọn ngoài các danh sách được tuyển chọn (nên có, hãy chọn một mô hình hỗ trợ "công cụ" mà bạn đã bật):

- Mistral: `mistral/...`
- Cerebras: `cerebras/...` (nếu bạn có quyền truy cập)
- LM Studio: `lmstudio/...` (cục bộ; khả năng gọi công cụ phụ thuộc vào chế độ API)

### Trình tổng hợp / Gateway thay thế

Nếu đã bật khóa, bạn cũng có thể kiểm thử qua:

- OpenRouter: `openrouter/...` (hàng trăm mô hình; dùng `openclaw models scan` để tìm các ứng viên hỗ trợ công cụ+hình ảnh)
- OpenCode: `opencode/...` cho Zen và `opencode-go/...` cho Go (xác thực qua `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Các nhà cung cấp khác có thể đưa vào ma trận trực tiếp (nếu bạn có thông tin xác thực/cấu hình):

- Tích hợp sẵn: `anthropic`, `cerebras`, `github-copilot`, `google`, `google-antigravity`, `google-gemini-cli`, `google-vertex`, `groq`, `mistral`, `openai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `zai`
- Qua `models.providers` (điểm cuối tùy chỉnh): `minimax` (đám mây/API), cùng với mọi proxy tương thích OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, v.v.)

<Tip>
Không mã hóa cứng "tất cả mô hình" trong tài liệu. Danh sách có thẩm quyền là bất kỳ nội dung nào `discoverModels(...)` trả về trên máy của bạn cùng với các khóa hiện có.
</Tip>

## Thông tin xác thực (không bao giờ commit)

Các kiểm thử trực tiếp tìm thông tin xác thực theo cùng cách CLI thực hiện. Hệ quả thực tế:

- Nếu CLI hoạt động, các kiểm thử trực tiếp sẽ tìm được cùng các khóa.
- Nếu một kiểm thử trực tiếp báo "không có thông tin xác thực", hãy gỡ lỗi theo cùng cách bạn gỡ lỗi `openclaw models list` / lựa chọn mô hình.

- Hồ sơ xác thực theo từng tác nhân: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (đây là ý nghĩa của "khóa hồ sơ" trong các kiểm thử trực tiếp)
- Cấu hình: `~/.openclaw/openclaw.json` (hoặc `OPENCLAW_CONFIG_PATH`)
- Thư mục OAuth cũ: `~/.openclaw/credentials/` (được sao chép vào thư mục chính trực tiếp đã chuẩn bị khi có, nhưng không phải kho khóa hồ sơ chính)
- Các lượt chạy trực tiếp cục bộ sao chép cấu hình đang hoạt động (đã loại bỏ các phần ghi đè `agents.*.workspace` / `agentDir`) và `auth-profiles.json` của từng tác nhân — không phải phần còn lại trong thư mục của tác nhân đó, vì vậy dữ liệu `workspace/` và `sandboxes/` không bao giờ đến thư mục chính đã chuẩn bị — cùng với thư mục `credentials/` cũ và các tệp/thư mục xác thực CLI bên ngoài được hỗ trợ (`.claude.json`, `.claude/.credentials.json`, `.claude/settings*.json`, `.claude/backups`, `.codex/auth.json`, `.codex/config.toml`, `.gemini`, `.minimax`) vào một thư mục chính kiểm thử tạm thời.

Nếu muốn dựa vào các khóa môi trường, hãy xuất chúng trước các kiểm thử cục bộ hoặc dùng các
trình chạy Docker bên dưới với một `OPENCLAW_PROFILE_FILE` tường minh.

## Chạy trực tiếp Deepgram (phiên âm thanh)

- Kiểm thử: `extensions/deepgram/audio.live.test.ts`
- Bật: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Chạy trực tiếp gói lập trình BytePlus

- Kiểm thử: `extensions/byteplus/live.test.ts`
- Bật: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Ghi đè mô hình tùy chọn: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Chạy trực tiếp phương tiện quy trình làm việc ComfyUI

- Kiểm thử: `extensions/comfy/comfy.live.test.ts`
- Bật: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Phạm vi:
  - Thực hiện các đường dẫn comfy hình ảnh, video và `music_generate` được đóng gói
  - Bỏ qua từng khả năng trừ khi `plugins.entries.comfy.config.<capability>` được cấu hình
  - Hữu ích sau khi thay đổi việc gửi quy trình làm việc comfy, thăm dò, tải xuống hoặc đăng ký Plugin

## Chạy trực tiếp tạo hình ảnh

- Kiểm thử: `test/image-generation.runtime.live.test.ts`
- Lệnh: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Bộ kiểm thử: `pnpm test:live:media image`
- Phạm vi:
  - Liệt kê mọi Plugin nhà cung cấp tạo hình ảnh đã đăng ký
  - Sử dụng các biến môi trường nhà cung cấp đã xuất trước khi thăm dò
  - Mặc định ưu tiên các khóa API trực tiếp/môi trường hơn hồ sơ xác thực đã lưu, để các khóa kiểm thử cũ trong `auth-profiles.json` không che khuất thông tin xác thực thực trong shell
  - Bỏ qua các nhà cung cấp không có xác thực/hồ sơ/mô hình khả dụng
  - Chạy từng nhà cung cấp đã cấu hình qua thời gian chạy tạo hình ảnh dùng chung:
    - `<provider>:generate`
    - `<provider>:edit` khi nhà cung cấp khai báo hỗ trợ chỉnh sửa
- Các nhà cung cấp được đóng gói hiện được bao phủ:
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
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Hành vi xác thực tùy chọn:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để buộc xác thực bằng kho hồ sơ và bỏ qua các phần ghi đè chỉ từ môi trường

Đối với đường dẫn CLI được phát hành, hãy thêm một kiểm thử khói `infer` sau khi kiểm thử trực tiếp
nhà cung cấp/thời gian chạy vượt qua:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image \
  --prompt "Hình ảnh kiểm thử phẳng tối giản: một hình vuông màu xanh lam trên nền trắng, không có chữ." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Phạm vi này bao gồm phân tích đối số CLI, phân giải cấu hình/tác nhân mặc định, kích hoạt
Plugin được đóng gói, thời gian chạy tạo hình ảnh dùng chung và yêu cầu trực tiếp tới nhà cung cấp.
Các phần phụ thuộc của Plugin được kỳ vọng phải có trước khi tải thời gian chạy.

## Chạy trực tiếp tạo nhạc

- Kiểm thử: `extensions/music-generation-providers.live.test.ts`
- Bật: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Bộ kiểm thử: `pnpm test:live:media music`
- Phạm vi:
  - Kiểm thử đường dẫn dùng chung của nhà cung cấp tạo nhạc đi kèm
  - Hiện bao phủ `fal`, `google`, `minimax` và `openrouter`
  - Sử dụng các biến môi trường của nhà cung cấp đã được xuất trước khi thăm dò
  - Theo mặc định, ưu tiên khóa API trực tiếp/từ môi trường hơn hồ sơ xác thực đã lưu, để các khóa kiểm thử cũ trong `auth-profiles.json` không che khuất thông tin xác thực thực trong shell
  - Bỏ qua các nhà cung cấp không có thông tin xác thực/hồ sơ/mô hình khả dụng
  - Chạy cả hai chế độ runtime đã khai báo khi khả dụng:
    - `generate` với đầu vào chỉ gồm prompt
    - `edit` khi nhà cung cấp khai báo `capabilities.edit.enabled`
  - `comfy` có tệp trực tiếp riêng, không thuộc lượt quét dùng chung này
- Thu hẹp tùy chọn:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Hành vi xác thực tùy chọn:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để buộc xác thực bằng kho hồ sơ và bỏ qua các ghi đè chỉ từ môi trường

## Tạo video trực tiếp

- Kiểm thử: `extensions/video-generation-providers.live.test.ts`
- Bật: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Bộ kiểm thử: `pnpm test:live:media video`
- Phạm vi:
  - Kiểm thử đường dẫn dùng chung của nhà cung cấp tạo video đi kèm trên `alibaba`, `byteplus`, `deepinfra`, `fal`, `google`, `minimax`, `openai`, `openrouter`, `pixverse`, `qwen`, `runway`, `together`, `vydra`, `xai`
  - Mặc định sử dụng đường dẫn kiểm tra nhanh an toàn cho bản phát hành: mỗi nhà cung cấp nhận một yêu cầu chuyển văn bản thành video, prompt con tôm hùm dài một giây và giới hạn thao tác cho từng nhà cung cấp từ `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (mặc định là `180000`)
  - Mặc định bỏ qua FAL vì độ trễ hàng đợi phía nhà cung cấp có thể chi phối thời gian phát hành; truyền `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` (hoặc xóa danh sách bỏ qua) để chạy rõ ràng
  - Sử dụng các biến môi trường của nhà cung cấp đã được xuất trước khi thăm dò
  - Theo mặc định, ưu tiên khóa API trực tiếp/từ môi trường hơn hồ sơ xác thực đã lưu, để các khóa kiểm thử cũ trong `auth-profiles.json` không che khuất thông tin xác thực thực trong shell
  - Bỏ qua các nhà cung cấp không có thông tin xác thực/hồ sơ/mô hình khả dụng
  - Theo mặc định, chỉ chạy `generate`
  - Đặt `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` để cũng chạy các chế độ chuyển đổi đã khai báo khi khả dụng:
    - `imageToVideo` khi nhà cung cấp khai báo `capabilities.imageToVideo.enabled` và nhà cung cấp/mô hình đã chọn chấp nhận đầu vào ảnh cục bộ dựa trên bộ đệm trong lượt quét dùng chung
    - `videoToVideo` khi nhà cung cấp khai báo `capabilities.videoToVideo.enabled` và nhà cung cấp/mô hình đã chọn chấp nhận đầu vào video cục bộ dựa trên bộ đệm trong lượt quét dùng chung
  - Nhà cung cấp `imageToVideo` hiện đã khai báo nhưng bị bỏ qua trong lượt quét dùng chung:
    - `vydra` (đầu vào ảnh cục bộ dựa trên bộ đệm không được hỗ trợ trong luồng này)
  - Phạm vi bao phủ dành riêng cho nhà cung cấp Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - Tệp đó chạy `veo3` chuyển văn bản thành video cùng với một luồng `kling` chuyển ảnh thành video sử dụng mặc định một fixture URL ảnh từ xa (`OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` để ghi đè).
  - Phạm vi bao phủ dành riêng cho nhà cung cấp xAI:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - Trường hợp cổ điển trước tiên tạo một khung hình đầu PNG vuông cục bộ, bỏ qua thông số hình học, yêu cầu một clip chuyển ảnh thành video dài một giây, thăm dò đến khi hoàn tất và xác minh bộ đệm đã tải xuống.
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - Trường hợp 1.5 tạo một khung hình đầu PNG cục bộ, yêu cầu một clip chuyển ảnh thành video 1080P dài một giây, thăm dò đến khi hoàn tất và xác minh bộ đệm đã tải xuống.
  - Phạm vi bao phủ trực tiếp `videoToVideo` hiện tại:
    - `runway` chỉ khi mô hình đã chọn phân giải thành `gen4_aleph`
  - Các nhà cung cấp `videoToVideo` hiện đã khai báo nhưng bị bỏ qua trong lượt quét dùng chung:
    - `alibaba`, `google`, `openai`, `qwen`, `xai` vì các đường dẫn đó hiện yêu cầu URL tham chiếu `http(s)` từ xa thay vì đầu vào cục bộ dựa trên bộ đệm
- Thu hẹp tùy chọn:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` để bao gồm mọi nhà cung cấp trong lượt quét mặc định, kể cả FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` để giảm giới hạn thao tác của từng nhà cung cấp cho một lượt kiểm tra nhanh quyết liệt
- Hành vi xác thực tùy chọn:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để buộc xác thực bằng kho hồ sơ và bỏ qua các ghi đè chỉ từ môi trường

## Bộ kiểm thử media trực tiếp

- Lệnh: `pnpm test:live:media`
- Điểm vào: `test/e2e/qa-lab/media/hosted-media-provider-live.ts`, chạy `pnpm test:live -- <suite-test-file>` cho mỗi bộ đã chọn, nhờ đó hành vi Heartbeat và chế độ im lặng luôn nhất quán với các lượt chạy `pnpm test:live` khác.
- Mục đích:
  - Chạy các bộ kiểm thử trực tiếp dùng chung cho ảnh, nhạc và video thông qua một điểm vào gốc của kho mã
  - Tự động tải các biến môi trường nhà cung cấp còn thiếu từ `~/.profile`
  - Theo mặc định, tự động thu hẹp từng bộ kiểm thử còn các nhà cung cấp hiện có thông tin xác thực khả dụng
- Cờ:
  - `--providers <csv>` là bộ lọc nhà cung cấp toàn cục; `--image-providers` / `--music-providers` / `--video-providers` giới hạn bộ lọc trong một bộ kiểm thử
  - `--all-providers` bỏ qua bộ lọc tự động dựa trên xác thực
  - `--allow-empty` thoát với `0` khi việc lọc không còn nhà cung cấp nào có thể chạy
  - `--quiet` / `--no-quiet` được truyền tiếp đến `test:live`
- Ví dụ:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Liên quan

- [Kiểm thử](/vi/help/testing) - các bộ kiểm thử đơn vị, tích hợp, QA và Docker
