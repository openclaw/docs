---
read_when:
    - Chạy các bài kiểm tra nhanh trực tiếp cho ma trận mô hình / backend CLI / ACP / nhà cung cấp phương tiện đa phương tiện
    - Gỡ lỗi quá trình phân giải thông tin xác thực cho kiểm thử trực tiếp
    - Thêm kiểm thử trực tiếp mới dành riêng cho nhà cung cấp
sidebarTitle: Live tests
summary: 'Kiểm thử trực tiếp (có truy cập mạng): ma trận mô hình, backend CLI, ACP, nhà cung cấp phương tiện, thông tin xác thực'
title: 'Kiểm thử: các bộ kiểm thử trực tiếp'
x-i18n:
    generated_at: "2026-07-21T13:44:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: da7f65c0d5e9467e600f6ef6bc2fb5bc6c6a2fd3555e942b15eaac6e9c01724b
    source_path: help/testing-live.md
    workflow: 16
---

Để bắt đầu nhanh, xem các trình chạy QA, bộ kiểm thử đơn vị/tích hợp và luồng Docker, hãy xem
[Kiểm thử](/vi/help/testing). Trang này đề cập đến các kiểm thử **trực tiếp** (có truy cập mạng):
ma trận mô hình, backend CLI, ACP, nhà cung cấp phương tiện và cách xử lý thông tin xác thực.

## Kiểm thử trực tiếp so với gateway thực của bạn

Các bộ kiểm thử trực tiếp và kiểm tra nhanh đặc biệt tuyệt đối không được làm gián đoạn gateway đang
phục vụ lưu lượng thực (của bạn hoặc của người vận hành khác):

- Sử dụng gateway riêng: dùng gateway trong tiến trình (Lớp 2 bên dưới) hoặc khởi động một
  phiên bản phát triển với thư mục trạng thái biệt lập (`OPENCLAW_STATE_DIR=<scratch>`) và một
  cổng trống. Không liên kết cổng gateway mặc định (18789) khi gateway thực
  đang chạy trên cổng đó.
- Không `openclaw gateway stop`/`restart` (hoặc các lệnh tương đương
  `launchctl`/`systemctl`/tmux) một dịch vụ mà bạn không khởi động trong phiên này — đó là
  phiên bản đang hoạt động của người vận hành. Trước tiên, hãy xin phê duyệt rõ ràng.
- Cần dữ liệu thực tế? Sao chép trạng thái/DB đang hoạt động vào thư mục trạng thái phát triển và kiểm thử
  trên bản sao. Việc di chuyển tại chỗ trạng thái của gateway đang hoạt động cũng cần
  được phê duyệt rõ ràng.

## Trực tiếp: các lệnh kiểm tra nhanh cục bộ

Xuất khóa nhà cung cấp cần thiết vào môi trường tiến trình trước khi thực hiện các
kiểm tra trực tiếp đặc biệt.

Kiểm tra nhanh phương tiện an toàn:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "Kiểm tra nhanh trực tiếp OpenClaw." \
  --output /tmp/openclaw-live-smoke.mp3
```

Kiểm tra nhanh an toàn về mức độ sẵn sàng cho cuộc gọi thoại:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` là chạy thử trừ khi `--yes` cũng được cung cấp; chỉ sử dụng `--yes`
khi bạn định thực hiện một cuộc gọi thật. Đối với Twilio, Telnyx và Plivo, một
kiểm tra mức độ sẵn sàng thành công yêu cầu URL webhook công khai — URL loopback
cục bộ/riêng tư sẽ bị từ chối vì các nhà cung cấp đó không thể truy cập chúng.

## Trực tiếp: quét khả năng của Node Android

- Kiểm thử: `src/gateway/android-node.capabilities.live.test.ts`
- Tập lệnh: `pnpm android:test:integration`
- Mục tiêu: gọi **mọi lệnh hiện được công bố** bởi một Node Android đã kết nối và xác nhận hành vi theo hợp đồng của lệnh.
- Phạm vi:
  - Thiết lập thủ công/có điều kiện trước (bộ kiểm thử không cài đặt/chạy/ghép cặp ứng dụng).
  - Xác thực `node.invoke` của gateway theo từng lệnh cho Node Android đã chọn.
- Thiết lập trước bắt buộc:
  - Ứng dụng Android đã kết nối và ghép cặp với gateway.
  - Duy trì ứng dụng ở nền trước.
  - Đã cấp quyền/chấp thuận ghi nhận cho các khả năng mà bạn mong đợi vượt qua kiểm thử.
- Ghi đè mục tiêu tùy chọn:
  - `OPENCLAW_ANDROID_NODE_ID` hoặc `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Chi tiết đầy đủ về thiết lập Android: [Ứng dụng Android](/vi/platforms/android)

## Trực tiếp: kiểm tra nhanh mô hình (khóa hồ sơ)

Các kiểm thử mô hình trực tiếp được chia thành hai lớp để cô lập lỗi:

- "Mô hình trực tiếp" cho biết nhà cung cấp/mô hình có thể phản hồi bằng khóa đã cho hay không.
- "Kiểm tra nhanh Gateway" cho biết toàn bộ pipeline gateway+tác tử có hoạt động với mô hình đó hay không (phiên, lịch sử, công cụ, chính sách sandbox, v.v.).

Các danh sách mô hình tuyển chọn bên dưới nằm trong `src/agents/live-model-filter.ts` và
thay đổi theo thời gian; hãy coi các mảng ở đó là nguồn chính xác, không phải
trang này.

MiniMax M3 sử dụng `minimax/MiniMax-M3` làm tham chiếu nhà cung cấp/mô hình mặc định.

### Lớp 1: Hoàn thành trực tiếp bằng mô hình (không có gateway)

- Kiểm thử: `src/agents/models.profiles.live.test.ts`
- Mục tiêu:
  - Liệt kê các mô hình được phát hiện
  - Dùng `getApiKeyForModel` để chọn các mô hình mà bạn có thông tin xác thực
  - Chạy một lượt hoàn thành nhỏ cho mỗi mô hình (và các kiểm thử hồi quy có mục tiêu khi cần)
- Cách bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
  - Đặt `OPENCLAW_LIVE_MODELS=modern`, `small` hoặc `all` (bí danh của `modern`) để thực sự chạy bộ kiểm thử này; nếu không, bộ kiểm thử sẽ bị bỏ qua, vì vậy chỉ riêng `pnpm test:live` vẫn tập trung vào kiểm tra nhanh gateway.
- Cách chọn mô hình:
  - `OPENCLAW_LIVE_MODELS=modern` chạy danh sách ưu tiên tuyển chọn có tín hiệu cao (xem [Trực tiếp: ma trận mô hình](#live-model-matrix-what-we-cover))
  - `OPENCLAW_LIVE_MODELS=small` chạy danh sách ưu tiên các mô hình nhỏ được tuyển chọn
  - `OPENCLAW_LIVE_MODELS=all` là bí danh của `modern`
  - hoặc `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."` (danh sách cho phép phân tách bằng dấu phẩy)
  - Các lượt chạy mô hình nhỏ Ollama cục bộ mặc định dùng `http://127.0.0.1:11434`; chỉ đặt `OPENCLAW_LIVE_OLLAMA_BASE_URL` cho các điểm cuối LAN, tùy chỉnh hoặc Ollama Cloud.
  - Các lượt quét hiện đại/tất cả và mô hình nhỏ mặc định giới hạn ở độ dài danh sách tuyển chọn tương ứng; đặt `OPENCLAW_LIVE_MAX_MODELS=0` để quét toàn diện các hồ sơ đã chọn hoặc đặt một số dương để dùng giới hạn nhỏ hơn.
  - Các lượt quét toàn diện dùng `OPENCLAW_LIVE_TEST_TIMEOUT_MS` làm thời gian chờ cho toàn bộ kiểm thử mô hình trực tiếp. Mặc định: 60 phút.
  - Các phép dò mô hình trực tiếp mặc định chạy song song 20 luồng; đặt `OPENCLAW_LIVE_MODEL_CONCURRENCY` để ghi đè.
- Cách chọn nhà cung cấp:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (danh sách cho phép phân tách bằng dấu phẩy)
- Nguồn khóa:
  - Theo mặc định: kho hồ sơ và phương án dự phòng từ biến môi trường
  - Đặt `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để chỉ bắt buộc dùng **kho hồ sơ**
- Lý do tồn tại:
  - Phân biệt "API của nhà cung cấp bị lỗi / khóa không hợp lệ" với "pipeline tác tử gateway bị lỗi"
  - Chứa các kiểm thử hồi quy nhỏ, biệt lập (ví dụ: phát lại suy luận OpenAI Responses/Codex Responses + luồng gọi công cụ)

### Lớp 2: Kiểm tra nhanh Gateway + tác tử phát triển ("@openclaw" thực sự làm gì)

- Kiểm thử: `src/gateway/gateway-models.profiles.live.test.ts`
- Mục tiêu:
  - Khởi chạy một gateway trong tiến trình
  - Tạo/vá một phiên `agent:dev:*` (ghi đè mô hình cho mỗi lượt chạy)
  - Lặp qua các mô hình có khóa và xác nhận:
    - phản hồi "có ý nghĩa" (không dùng công cụ)
    - một lần gọi công cụ thực hoạt động (phép dò đọc)
    - các phép dò công cụ bổ sung tùy chọn (phép dò thực thi+đọc)
    - các đường dẫn hồi quy OpenAI (chỉ gọi công cụ -> tiếp tục) vẫn hoạt động
- Chi tiết phép dò (để bạn có thể nhanh chóng giải thích lỗi):
  - Phép dò `read`: kiểm thử ghi một tệp nonce vào không gian làm việc và yêu cầu tác tử `read` tệp đó rồi trả lại nonce.
  - Phép dò `exec+read`: kiểm thử yêu cầu tác tử dùng `exec` để ghi một nonce vào tệp tạm, sau đó dùng `read` để đọc lại.
  - phép dò hình ảnh: kiểm thử đính kèm một PNG được tạo (mèo + mã ngẫu nhiên) và mong đợi mô hình trả về `cat <CODE>`.
  - Tham chiếu triển khai: `src/gateway/gateway-models.profiles.live.test.ts` và `test/helpers/live-image-probe.ts`.
- Cách bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
- Cách chọn mô hình:
  - Mặc định: danh sách ưu tiên tuyển chọn có tín hiệu cao (`modern`)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` chạy danh sách mô hình nhỏ được tuyển chọn qua toàn bộ pipeline gateway+tác tử
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` là bí danh của `modern`
  - Hoặc đặt `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (hoặc danh sách phân tách bằng dấu phẩy) để thu hẹp
  - Các lượt quét gateway hiện đại/tất cả và mô hình nhỏ mặc định giới hạn ở độ dài danh sách tuyển chọn tương ứng; đặt `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` để quét toàn diện lựa chọn đã chỉ định hoặc đặt một số dương để dùng giới hạn nhỏ hơn.
- Cách chọn nhà cung cấp (tránh "mọi thứ qua OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (danh sách cho phép phân tách bằng dấu phẩy)
- Các phép dò công cụ + hình ảnh luôn được bật trong kiểm thử trực tiếp này:
  - phép dò `read` + phép dò `exec+read` (kiểm thử tải công cụ)
  - phép dò hình ảnh chạy khi mô hình công bố hỗ trợ đầu vào hình ảnh
  - Luồng (mức tổng quan):
    - Kiểm thử tạo một PNG nhỏ với "CAT" + mã ngẫu nhiên (`test/helpers/live-image-probe.ts`)
    - Gửi tệp qua `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway phân tích tệp đính kèm thành `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Tác tử nhúng chuyển tiếp thông điệp đa phương thức của người dùng đến mô hình
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
- Mục tiêu: xác thực pipeline Gateway + tác tử bằng backend CLI cục bộ mà không tác động đến cấu hình mặc định của bạn.
- Các giá trị mặc định dành riêng cho từng backend của kiểm tra nhanh nằm trong định nghĩa `cli-backend.ts` của Plugin sở hữu.
- Bật:
  - `pnpm test:live` (hoặc `OPENCLAW_LIVE_TEST=1` nếu gọi Vitest trực tiếp)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Giá trị mặc định:
  - Nhà cung cấp/mô hình mặc định: `claude-cli/claude-sonnet-4-6`
  - Hành vi của lệnh/đối số/hình ảnh lấy từ siêu dữ liệu của Plugin backend CLI sở hữu.
- Ghi đè (tùy chọn):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` để gửi một tệp đính kèm hình ảnh thực (các đường dẫn được chèn vào lời nhắc). Mặc định tắt trong các công thức Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` để truyền đường dẫn tệp hình ảnh dưới dạng đối số CLI thay vì chèn vào lời nhắc.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (hoặc `"list"`) để kiểm soát cách truyền đối số hình ảnh khi đặt `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` để gửi lượt thứ hai và xác thực luồng tiếp tục.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` để chọn tham gia phép dò tính liên tục trong cùng phiên Claude Sonnet -> Opus khi mô hình đã chọn hỗ trợ mục tiêu chuyển đổi. Mặc định tắt, kể cả trong các công thức Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` để chọn tham gia phép dò loopback MCP/công cụ. Mặc định tắt trong các công thức Docker.

Ví dụ:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Kiểm tra nhanh cấu hình MCP Gemini ít tốn tài nguyên:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Thao tác này không yêu cầu Gemini tạo phản hồi. Nó ghi cùng các cài đặt hệ thống
mà OpenClaw cung cấp cho Gemini, sau đó chạy `gemini --debug mcp list` để chứng minh một
máy chủ `transport: "streamable-http"` đã lưu được chuẩn hóa thành dạng MCP HTTP của Gemini
và có thể kết nối với máy chủ MCP HTTP có khả năng truyền luồng cục bộ.

Công thức Docker:

```bash
pnpm test:docker:live-cli-backend
```

Các công thức Docker cho một nhà cung cấp:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Ghi chú:

- Trình chạy Docker nằm tại `scripts/test-live-cli-backend-docker.sh`.
- Nó chạy kiểm tra smoke trực tiếp cho backend CLI bên trong image Docker của repo dưới người dùng không phải root `node`.
- Nó phân giải siêu dữ liệu kiểm tra smoke CLI từ plugin sở hữu, sau đó cài đặt gói CLI Linux tương ứng (`@anthropic-ai/claude-code` hoặc `@google/gemini-cli`) vào tiền tố có thể ghi được lưu trong bộ nhớ đệm tại `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (mặc định: `~/.cache/openclaw/docker-cli-tools`).
- `codex-cli` không còn là backend CLI được đóng gói kèm; thay vào đó, hãy dùng `openai/*` với runtime app-server Codex (xem [Trực tiếp: kiểm tra smoke harness app-server Codex](#live-codex-app-server-harness-smoke)).
- `pnpm test:docker:live-cli-backend:claude-subscription` yêu cầu OAuth đăng ký Claude Code có tính di động thông qua `~/.claude/.credentials.json` với `claudeAiOauth.subscriptionType` hoặc `CLAUDE_CODE_OAUTH_TOKEN` từ `claude setup-token`. Trước tiên, nó xác minh `claude -p` trực tiếp trong Docker, sau đó chạy hai lượt backend CLI của Gateway mà không giữ lại các biến môi trường khóa API Anthropic. Làn đăng ký này mặc định vô hiệu hóa các phép kiểm tra Claude MCP/công cụ và hình ảnh vì chúng tiêu thụ giới hạn sử dụng của gói đăng ký đã đăng nhập, đồng thời Anthropic có thể thay đổi hành vi thanh toán và giới hạn tốc độ của Claude Agent SDK / `claude -p` mà không cần bản phát hành OpenClaw.
- Claude và Gemini hỗ trợ cùng một tập phép kiểm tra (lượt văn bản, phân loại hình ảnh, lệnh gọi công cụ MCP `cron`, tính liên tục khi chuyển đổi mô hình) thông qua các cờ ở trên, nhưng không phép kiểm tra nào chạy theo mặc định - hãy chủ động bật từng cờ khi cần.

## Trực tiếp: khả năng kết nối proxy HTTP/2 của APNs

- Kiểm thử: `src/infra/push-apns-http2.live.test.ts`
- Mục tiêu: tạo đường hầm qua proxy HTTP CONNECT cục bộ đến endpoint APNs sandbox của Apple, gửi yêu cầu xác thực HTTP/2 APNs và xác nhận phản hồi `403 InvalidProviderToken` thực tế của Apple được trả về qua đường dẫn proxy.
- Bật:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Thời gian chờ tùy chọn:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Trực tiếp: kiểm tra smoke liên kết ACP (`/acp spawn ... --bind here`)

- Kiểm thử: `src/gateway/gateway-acp-bind.live.test.ts`
- Mục tiêu: xác thực luồng liên kết cuộc hội thoại ACP thực tế với một tác nhân ACP trực tiếp:
  - gửi `/acp spawn <agent> --bind here`
  - liên kết tại chỗ một cuộc hội thoại kênh tin nhắn mô phỏng
  - gửi một lượt tiếp theo thông thường trong chính cuộc hội thoại đó
  - xác minh lượt tiếp theo xuất hiện trong bản chép lời phiên ACP đã liên kết
- Bật:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Mặc định:
  - Các tác nhân ACP trong Docker: `claude,codex,gemini`
  - Tác nhân ACP cho `pnpm test:live ...` trực tiếp: `claude`
  - Kênh mô phỏng: ngữ cảnh cuộc hội thoại theo kiểu tin nhắn trực tiếp Slack
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
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1` (hoặc `on`/`true`/`yes`) để buộc bật phép kiểm tra hình ảnh; mọi giá trị khác sẽ buộc tắt phép kiểm tra này. Chạy theo mặc định cho mọi tác nhân ngoại trừ `opencode`.
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- Ghi chú:
  - Làn này sử dụng bề mặt `chat.send` của Gateway với các trường tuyến bắt nguồn mô phỏng chỉ dành cho quản trị viên, nhờ đó kiểm thử có thể đính kèm ngữ cảnh kênh tin nhắn mà không giả vờ phân phối ra bên ngoài.
  - Khi `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` chưa được đặt, kiểm thử sử dụng sổ đăng ký tác nhân tích hợp sẵn của plugin `acpx` nhúng cho tác nhân harness ACP đã chọn.
  - Theo mặc định, việc tạo Cron MCP cho phiên đã liên kết được thực hiện theo khả năng tốt nhất vì các harness ACP bên ngoài có thể hủy lệnh gọi MCP sau khi bằng chứng liên kết/hình ảnh đã đạt; đặt `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` để áp dụng nghiêm ngặt phép kiểm tra Cron sau liên kết đó.

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
- Theo mặc định, nó chạy tuần tự kiểm tra smoke liên kết ACP với các tác nhân CLI trực tiếp tổng hợp: `claude`, `codex`, rồi `gemini`.
- Dùng `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` hoặc `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` để thu hẹp ma trận.
- Nó đưa vật liệu xác thực CLI tương ứng vào container, sau đó cài đặt CLI trực tiếp được yêu cầu (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid thông qua `https://app.factory.ai/cli`, `@google/gemini-cli` hoặc `opencode-ai`) nếu còn thiếu. Bản thân backend ACP là gói `acpx/runtime` nhúng từ plugin `acpx` chính thức.
- Biến thể Docker Droid đưa `~/.factory` vào để thiết lập, chuyển tiếp `FACTORY_API_KEY` và yêu cầu khóa API đó vì xác thực OAuth/kho khóa Factory cục bộ không thể chuyển vào container. Nó sử dụng mục sổ đăng ký `droid exec --output-format acp` tích hợp sẵn của ACPX.
- Biến thể Docker OpenCode là một làn hồi quy nghiêm ngặt cho một tác nhân. Nó ghi mô hình mặc định `OPENCODE_CONFIG_CONTENT` tạm thời từ `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (mặc định `opencode/kimi-k2.6`).
- Các lệnh gọi CLI `acpx` trực tiếp chỉ là đường dẫn thủ công/giải pháp thay thế để so sánh hành vi bên ngoài Gateway. Kiểm tra smoke liên kết ACP trong Docker sử dụng backend runtime `acpx` nhúng của OpenClaw.

## Trực tiếp: kiểm tra smoke harness app-server Codex

- Mục tiêu: xác thực harness Codex do plugin sở hữu thông qua phương thức
  `agent` thông thường của Gateway:
  - tải plugin `codex` được đóng gói kèm
  - chọn một mô hình OpenAI thông qua `/model <ref> --runtime codex`
  - gửi lượt tác nhân Gateway đầu tiên với mức độ suy luận được yêu cầu
  - gửi lượt thứ hai đến cùng phiên OpenClaw và xác minh luồng app-server
    có thể tiếp tục
  - chạy `/codex status` và `/codex models` qua cùng đường dẫn lệnh
    Gateway
  - tùy chọn chạy hai phép kiểm tra shell nâng quyền đã được Guardian review: một
    lệnh vô hại cần được phê duyệt và một thao tác tải lên bí mật giả cần bị
    từ chối để tác nhân hỏi lại
- Kiểm thử: `src/gateway/gateway-codex-harness.live.test.ts`
- Bật: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Mô hình cơ sở của harness: `openai/gpt-5.6-luna`
- Mặc định chọn khóa API OpenAI mới: `openai/gpt-5.6`
- Mức suy luận mặc định: `low`
- Ghi đè mô hình: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- Ghi đè mức suy luận: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- Xác nhận mức nỗ lực của mô hình không mặc định:
  `OPENCLAW_LIVE_CODEX_HARNESS_EXPECTED_EFFORT=<level>`
- Ghi đè ma trận: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- Chế độ xác thực: `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth` (mặc định) sử dụng thông tin
  đăng nhập Codex đã sao chép; `api-key` sử dụng `OPENAI_API_KEY` thông qua app-server Codex.
- Phép kiểm tra hình ảnh tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Phép kiểm tra MCP/công cụ tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Phép kiểm tra Guardian tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Kiểm tra sức chịu tải tiếp tục tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1` thêm
  bốn lượt lịch sử, sau đó đóng và khởi động lại Gateway cùng app-server Codex
  ba lần, đồng thời yêu cầu giữ nguyên mã định danh luồng gốc và lịch sử
  cuộc hội thoại. Ghi đè các số lượng bị giới hạn bằng
  `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS_HISTORY_TURNS` (1-20) và
  `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS_RESTARTS` (1-10).
- Kiểm tra sức chịu tải phân nhánh tùy chọn: đặt `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1`
  và `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_COUNT` (1-12). Harness khởi động
  đồng thời mọi tiến trình con, chờ mọi lượt chạy kết thúc và xác minh từng
  phản hồi con duy nhất cùng danh tính luồng gốc.
- Kiểm tra sức chịu tải Compaction tùy chọn: `OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS=1`
  tạo đầu ra công cụ gốc có giới hạn, yêu cầu các sự kiện Compaction tự động,
  xác minh số lần Compaction đã lưu bền vững và khả năng nhớ lại dấu mốc ẩn, khởi động lại
  Gateway và app-server Codex vật lý, sau đó lặp lại đợt đầu ra và
  Compaction. Điều chỉnh khối lượng công việc bị giới hạn bằng
  `OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS_TURNS` (1-8) và
  `OPENCLAW_LIVE_CODEX_HARNESS_LARGE_OUTPUT_BYTES` (100000-800000).
- Phép kiểm tra từ chối chuyển tiếp vòng lặp tùy chọn:
  `OPENCLAW_LIVE_CODEX_HARNESS_DISABLE_LOOP_RELAY=1`
- Tùy chọn mức suy luận được yêu cầu có thể ánh xạ đến mức nỗ lực gần nhất mà
  Codex công bố cho mô hình đó. Ví dụ: Luna ánh xạ `minimal` thành `low`.
- Các mô hình danh mục Codex đã biết tự động suy ra chính xác mức nỗ lực gốc đó.
  Các ghi đè mô hình không xác định phải nêu mức nỗ lực ánh xạ dự kiến.
- Kiểm tra smoke buộc nhà cung cấp/mô hình là `agentRuntime.id: "codex"` để một harness Codex
  bị lỗi không thể vượt qua bằng cách âm thầm quay về OpenClaw.
- Xác thực: xác thực app-server Codex từ thông tin đăng nhập gói đăng ký Codex cục bộ hoặc
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

Kiểm tra sức chịu tải khởi động lại và lịch sử:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1 \
pnpm test:docker:live-codex-harness
```

Kiểm tra sức chịu tải phân nhánh, đầu ra lớn, Compaction và khởi động lại:

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

Bằng chứng này để `OPENCLAW_LIVE_GATEWAY_MODELS` chưa được đặt, phân giải mô hình thông qua
điểm nối lựa chọn suy luận khi onboarding mới, xác nhận `openai/gpt-5.6`, rồi
chạy một lượt Gateway thực tế với mô hình đã phân giải đó.

Ma trận OpenClaw nhúng GPT-5.6:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Ghi chú Docker:

- Trình chạy Docker nằm tại `scripts/test-live-codex-harness-docker.sh`.
- Nó truyền `OPENAI_API_KEY`, sao chép các tệp xác thực Codex CLI khi có, cài đặt
  `@openai/codex` vào một tiền tố npm
  được gắn kết và có thể ghi, đưa cây mã nguồn vào vùng tạm, rồi chỉ chạy kiểm thử trực tiếp của bộ khung Codex.
- Docker bật mặc định các phép thăm dò hình ảnh, MCP/công cụ và Guardian. Đặt
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` hoặc
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` hoặc
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` khi cần một lượt chạy gỡ lỗi
  có phạm vi hẹp hơn.
- Docker sử dụng cùng cấu hình runtime Codex tường minh, vì vậy các bí danh cũ hoặc phương án dự phòng của OpenClaw
  không thể che giấu lỗi hồi quy của bộ khung Codex.
- Các mục tiêu Matrix chạy tuần tự trong một vùng chứa. Tập lệnh Docker điều chỉnh
  thời gian chờ mặc định 35 phút theo số lượng mục tiêu; mọi thời gian chờ của shell bên ngoài hoặc CI phải
  cho phép cùng tổng thời gian đó. CI chuẩn giữ mỗi mục tiêu GPT-5.6 trong một phân đoạn riêng.

### Công thức chạy trực tiếp được khuyến nghị

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

- Kiểm thử nhanh khả năng suy nghĩ thích ứng của Google (`qa manual` từ CLI QA riêng tư - yêu cầu `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` và một bản checkout mã nguồn; xem [tổng quan về QA](/vi/concepts/qa-e2e-automation)):
  - Mặc định động của Gemini 3: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Ngân sách động của Gemini 2.5: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Ghi chú:

- `google/...` sử dụng API Gemini (khóa API).
- `google-antigravity/...` sử dụng cầu nối OAuth Antigravity (điểm cuối tác nhân kiểu Cloud Code Assist).
- `google-gemini-cli/...` sử dụng Gemini CLI cục bộ trên máy của bạn (cơ chế xác thực riêng + các đặc thù về công cụ).
- API Gemini so với Gemini CLI:
  - API: OpenClaw gọi API Gemini được Google lưu trữ qua HTTP (khóa API / xác thực hồ sơ); đây là điều hầu hết người dùng muốn nói khi nhắc đến "Gemini".
  - CLI: OpenClaw gọi một tệp nhị phân `gemini` cục bộ qua shell; nó có cơ chế xác thực riêng và có thể hoạt động khác biệt (hỗ trợ truyền phát/công cụ/chênh lệch phiên bản).

## Trực tiếp: ma trận mô hình (phạm vi bao phủ)

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

- Các nhà cung cấp `codex` và `codex-cli` bị loại khỏi lượt quét hiện đại mặc định (chúng bao phủ hành vi phần phụ trợ CLI/ACP, được kiểm thử riêng ở trên). Bản thân `openai/gpt-5.5` định tuyến qua bộ khung app-server Codex theo mặc định; xem [Trực tiếp: kiểm thử nhanh bộ khung app-server Codex](#live-codex-app-server-harness-smoke).
- `fireworks`, `google`, `openrouter` và `xai` chỉ chạy các mã định danh mô hình được tuyển chọn rõ ràng trong lượt quét hiện đại (không tự động mở rộng thành "mọi mô hình từ nhà cung cấp này").
- Đưa ít nhất một mô hình có khả năng xử lý hình ảnh (các biến thể thị giác thuộc họ Claude/Gemini/OpenAI, v.v.) vào `OPENCLAW_LIVE_GATEWAY_MODELS` để thực hiện phép thăm dò hình ảnh.

Chạy kiểm thử nhanh Gateway với công cụ + hình ảnh trên một tập hợp đa nhà cung cấp được chọn thủ công:

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

Phạm vi bao phủ bổ sung tùy chọn ngoài các danh sách được tuyển chọn (nên có, hãy chọn một mô hình có khả năng dùng "công cụ" mà bạn đã bật):

- Mistral: `mistral/...`
- Cerebras: `cerebras/...` (nếu bạn có quyền truy cập)
- LM Studio: `lmstudio/...` (cục bộ; khả năng gọi công cụ phụ thuộc vào chế độ API)

### Bộ tổng hợp / Gateway thay thế

Nếu đã bật khóa, bạn cũng có thể kiểm thử qua:

- OpenRouter: `openrouter/...` (hàng trăm mô hình; dùng `openclaw models scan` để tìm các ứng viên có khả năng dùng công cụ+hình ảnh)
- OpenCode: `opencode/...` cho Zen và `opencode-go/...` cho Go (xác thực qua `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Các nhà cung cấp khác có thể đưa vào ma trận trực tiếp (nếu bạn có thông tin xác thực/cấu hình):

- Tích hợp sẵn: `anthropic`, `cerebras`, `github-copilot`, `google`, `google-antigravity`, `google-gemini-cli`, `google-vertex`, `groq`, `mistral`, `openai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `zai`
- Qua `models.providers` (điểm cuối tùy chỉnh): `minimax` (đám mây/API), cùng với bất kỳ proxy tương thích OpenAI/Anthropic nào (LM Studio, vLLM, LiteLLM, v.v.)

<Tip>
Không mã hóa cứng "tất cả mô hình" trong tài liệu. Danh sách có thẩm quyền là bất kỳ nội dung nào `discoverModels(...)` trả về trên máy của bạn cộng với bất kỳ khóa nào hiện có.
</Tip>

## Thông tin xác thực (không bao giờ commit)

Các kiểm thử trực tiếp khám phá thông tin xác thực theo cùng cách với CLI. Ý nghĩa thực tế:

- Nếu CLI hoạt động, các kiểm thử trực tiếp sẽ tìm thấy cùng các khóa.
- Nếu kiểm thử trực tiếp báo "không có thông tin xác thực", hãy gỡ lỗi theo cùng cách bạn sẽ gỡ lỗi `openclaw models list` / lựa chọn mô hình.

- Hồ sơ xác thực theo tác nhân: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (đây là ý nghĩa của "khóa hồ sơ" trong các kiểm thử trực tiếp)
- Cấu hình: `~/.openclaw/openclaw.json` (hoặc `OPENCLAW_CONFIG_PATH`)
- Thư mục OAuth cũ: `~/.openclaw/credentials/` (được sao chép vào thư mục chính trực tiếp tạm khi có, nhưng không phải kho khóa hồ sơ chính)
- Các lượt chạy trực tiếp cục bộ sao chép cấu hình đang hoạt động (đã loại bỏ các giá trị ghi đè `agents.*.workspace` / `agentDir`) và `auth-profiles.json` của từng tác nhân - không phải phần còn lại trong thư mục của tác nhân đó, vì vậy dữ liệu `workspace/` và `sandboxes/` không bao giờ đến thư mục chính tạm - cùng với thư mục `credentials/` cũ và các tệp/thư mục xác thực CLI bên ngoài được hỗ trợ (`.claude.json`, `.claude/.credentials.json`, `.claude/settings*.json`, `.claude/backups`, `.codex/auth.json`, `.codex/config.toml`, `.gemini`, `.minimax`) vào một thư mục chính kiểm thử tạm thời.

Nếu muốn dựa vào các khóa môi trường, hãy xuất chúng trước các kiểm thử cục bộ hoặc sử dụng
các trình chạy Docker bên dưới với một `OPENCLAW_PROFILE_FILE` tường minh.

## Chạy trực tiếp Deepgram (phiên âm thanh)

- Kiểm thử: `extensions/deepgram/audio.live.test.ts`
- Bật: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Chạy trực tiếp gói lập trình BytePlus

- Kiểm thử: `extensions/byteplus/live.test.ts`
- Bật: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Ghi đè mô hình tùy chọn: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Chạy trực tiếp nội dung đa phương tiện trong quy trình làm việc ComfyUI

- Kiểm thử: `extensions/comfy/comfy.live.test.ts`
- Bật: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Phạm vi:
  - Thực hiện các đường dẫn hình ảnh, video và `music_generate` của comfy đi kèm
  - Bỏ qua từng khả năng trừ khi `plugins.entries.comfy.config.<capability>` được cấu hình
  - Hữu ích sau khi thay đổi thao tác gửi quy trình làm việc comfy, thăm dò, tải xuống hoặc đăng ký Plugin

## Chạy trực tiếp tính năng tạo hình ảnh

- Kiểm thử: `test/image-generation.runtime.live.test.ts`
- Lệnh: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Bộ khung: `pnpm test:live:media image`
- Phạm vi:
  - Liệt kê mọi Plugin nhà cung cấp tạo hình ảnh đã đăng ký
  - Sử dụng các biến môi trường của nhà cung cấp đã được xuất trước khi thăm dò
  - Mặc định ưu tiên khóa API trực tiếp/môi trường hơn hồ sơ xác thực đã lưu, để các khóa kiểm thử cũ trong `auth-profiles.json` không che khuất thông tin xác thực thực của shell
  - Bỏ qua các nhà cung cấp không có xác thực/hồ sơ/mô hình khả dụng
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
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Hành vi xác thực tùy chọn:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để buộc xác thực bằng kho hồ sơ và bỏ qua các giá trị ghi đè chỉ có trong môi trường

Đối với đường dẫn CLI được phát hành, hãy thêm một kiểm thử nhanh `infer` sau khi kiểm thử trực tiếp
nhà cung cấp/runtime vượt qua:

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
Plugin đi kèm, runtime tạo hình ảnh dùng chung và yêu cầu trực tiếp tới nhà cung cấp.
Các phần phụ thuộc của Plugin phải có sẵn trước khi tải runtime.

## Chạy trực tiếp tính năng tạo nhạc

- Kiểm thử: `extensions/music-generation-providers.live.test.ts`
- Bật: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Bộ kiểm thử: `pnpm test:live:media music`
- Phạm vi:
  - Kiểm thử đường dẫn nhà cung cấp tạo nhạc dùng chung được đóng gói
  - Hiện bao gồm `fal`, `google`, `minimax` và `openrouter`
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để buộc xác thực bằng kho hồ sơ và bỏ qua các giá trị ghi đè chỉ từ môi trường

## Tạo video trực tiếp

- Kiểm thử: `extensions/video-generation-providers.live.test.ts`
- Bật: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Bộ kiểm thử: `pnpm test:live:media video`
- Phạm vi:
  - Kiểm thử đường dẫn nhà cung cấp tạo video dùng chung được đóng gói trên `alibaba`, `byteplus`, `deepinfra`, `fal`, `google`, `minimax`, `openai`, `openrouter`, `pixverse`, `qwen`, `runway`, `together`, `vydra`, `xai`
  - Mặc định dùng đường dẫn kiểm tra nhanh an toàn cho bản phát hành: một yêu cầu chuyển văn bản thành video cho mỗi nhà cung cấp, prompt Lobster dài một giây và giới hạn thao tác cho mỗi nhà cung cấp từ `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (mặc định là `180000`)
  - Mặc định bỏ qua FAL vì độ trễ hàng đợi phía nhà cung cấp có thể chi phối thời gian phát hành; truyền `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` (hoặc xóa danh sách bỏ qua) để chạy rõ ràng
  - Sử dụng các biến môi trường của nhà cung cấp đã được xuất trước khi thăm dò
  - Theo mặc định, ưu tiên khóa API trực tiếp/từ môi trường hơn hồ sơ xác thực đã lưu, để các khóa kiểm thử cũ trong `auth-profiles.json` không che khuất thông tin xác thực thực trong shell
  - Bỏ qua các nhà cung cấp không có thông tin xác thực/hồ sơ/mô hình khả dụng
  - Theo mặc định chỉ chạy `generate`
  - Đặt `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` để cũng chạy các chế độ chuyển đổi đã khai báo khi khả dụng:
    - `imageToVideo` khi nhà cung cấp khai báo `capabilities.imageToVideo.enabled` và nhà cung cấp/mô hình đã chọn chấp nhận đầu vào ảnh cục bộ dựa trên bộ đệm trong lượt quét dùng chung
    - `videoToVideo` khi nhà cung cấp khai báo `capabilities.videoToVideo.enabled` và nhà cung cấp/mô hình đã chọn chấp nhận đầu vào video cục bộ dựa trên bộ đệm trong lượt quét dùng chung
  - Nhà cung cấp `imageToVideo` hiện được khai báo nhưng bị bỏ qua trong lượt quét dùng chung:
    - `vydra` (đầu vào ảnh cục bộ dựa trên bộ đệm không được hỗ trợ trong luồng này)
  - Phạm vi kiểm thử dành riêng cho nhà cung cấp Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - Tệp đó chạy luồng chuyển văn bản thành video `veo3` cùng một luồng chuyển ảnh thành video `kling`, theo mặc định sử dụng fixture URL ảnh từ xa (`OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` để ghi đè).
  - Phạm vi kiểm thử dành riêng cho nhà cung cấp xAI:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - Trường hợp cổ điển trước tiên tạo một khung hình đầu tiên PNG vuông cục bộ, bỏ qua hình học, yêu cầu một đoạn chuyển ảnh thành video dài một giây, thăm dò đến khi hoàn tất và xác minh bộ đệm đã tải xuống.
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - Trường hợp 1.5 tạo một khung hình đầu tiên PNG cục bộ, yêu cầu một đoạn chuyển ảnh thành video 1080P dài một giây, thăm dò đến khi hoàn tất và xác minh bộ đệm đã tải xuống.
  - Phạm vi kiểm thử trực tiếp `videoToVideo` hiện tại:
    - `runway` chỉ khi mô hình đã chọn được phân giải thành `gen4_aleph`
  - Các nhà cung cấp `videoToVideo` hiện được khai báo nhưng bị bỏ qua trong lượt quét dùng chung:
    - `alibaba`, `google`, `openai`, `qwen`, `xai` vì các đường dẫn đó hiện yêu cầu URL tham chiếu `http(s)` từ xa thay vì đầu vào cục bộ dựa trên bộ đệm
- Thu hẹp tùy chọn:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` để đưa mọi nhà cung cấp vào lượt quét mặc định, bao gồm FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` để giảm giới hạn thao tác của từng nhà cung cấp cho một lượt kiểm tra nhanh tích cực
- Hành vi xác thực tùy chọn:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để buộc xác thực bằng kho hồ sơ và bỏ qua các giá trị ghi đè chỉ từ môi trường

## Bộ kiểm thử phương tiện trực tiếp

- Lệnh: `pnpm test:live:media`
- Điểm vào: `test/e2e/qa-lab/media/hosted-media-provider-live.ts`, chạy `pnpm test:live -- <suite-test-file>` cho mỗi bộ kiểm thử đã chọn, để hành vi Heartbeat và chế độ im lặng nhất quán với các lượt chạy `pnpm test:live` khác.
- Mục đích:
  - Chạy các bộ kiểm thử trực tiếp dùng chung cho ảnh, nhạc và video qua một điểm vào gốc của kho mã
  - Tự động tải các biến môi trường còn thiếu của nhà cung cấp từ `~/.profile`
  - Theo mặc định, tự động thu hẹp từng bộ kiểm thử xuống các nhà cung cấp hiện có thông tin xác thực khả dụng
- Cờ:
  - `--providers <csv>` bộ lọc nhà cung cấp toàn cục; `--image-providers` / `--music-providers` / `--video-providers` giới hạn bộ lọc trong một bộ kiểm thử
  - `--all-providers` bỏ qua bộ lọc tự động dựa trên xác thực
  - `--allow-empty` thoát với `0` khi việc lọc không để lại nhà cung cấp nào có thể chạy
  - `--quiet` / `--no-quiet` được truyền tiếp đến `test:live`
- Ví dụ:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Liên quan

- [Kiểm thử](/vi/help/testing) - các bộ kiểm thử đơn vị, tích hợp, QA và Docker
