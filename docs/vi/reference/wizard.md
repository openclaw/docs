---
read_when:
    - Tra cứu một bước hoặc cờ cụ thể trong quy trình thiết lập ban đầu
    - Tự động hóa quy trình làm quen bằng chế độ không tương tác
    - Gỡ lỗi hành vi hướng dẫn thiết lập ban đầu
sidebarTitle: Onboarding Reference
summary: 'Tài liệu tham khảo đầy đủ về quy trình làm quen qua CLI: mọi bước, cờ và trường cấu hình'
title: Tài liệu tham khảo về quy trình thiết lập ban đầu
x-i18n:
    generated_at: "2026-07-16T15:13:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6c345887da0102c73f72623105d052ea9262006206dd70bae8f94aad1349423d
    source_path: reference/wizard.md
    workflow: 16
---

Đây là tài liệu tham khảo đầy đủ cho `openclaw onboard`.
Để xem tổng quan cấp cao, hãy xem [Làm quen (CLI)](/vi/start/wizard). Để biết hành vi và đầu ra
theo từng bước, hãy xem [Tài liệu tham khảo về thiết lập CLI](/vi/start/wizard-cli-reference).

## Chi tiết quy trình (chế độ cục bộ)

<Steps>
  <Step title="Đặt lại (không bắt buộc)">
    - `--reset` đặt lại trạng thái trước khi chạy thiết lập; nếu không có tùy chọn này, việc chạy lại quy trình làm quen
      sẽ giữ cấu hình hiện có và tái sử dụng cấu hình đó làm giá trị mặc định.
    - `--reset-scope` kiểm soát nội dung mà `--reset` xóa: `config` (chỉ tệp cấu hình
      ), `config+creds+sessions` (mặc định) hoặc `full` (cũng xóa
      không gian làm việc).
    - Nếu tệp cấu hình không hợp lệ, quy trình làm quen sẽ dừng và yêu cầu bạn chạy
      `openclaw doctor` trước, sau đó chạy lại thiết lập.
    - Quá trình đặt lại chuyển trạng thái vào Thùng rác (không bao giờ xóa trực tiếp).

  </Step>
  <Step title="Xác nhận rủi ro">
    - Lần chạy đầu tiên (hoặc bất kỳ lần chạy nào trước khi đặt `wizard.securityAcknowledgedAt`)
      yêu cầu bạn xác nhận rằng bạn hiểu các tác nhân rất mạnh và việc cấp
      toàn quyền truy cập hệ thống có nhiều rủi ro.
    - `--non-interactive` yêu cầu chỉ định rõ `--accept-risk`; nếu không có tùy chọn này,
      quy trình làm quen sẽ thoát với lỗi thay vì hiển thị lời nhắc.
    - Các lần chạy tương tác sẽ hiển thị lời nhắc xác nhận thay cho cờ; nếu từ chối,
      quá trình thiết lập sẽ bị hủy.

  </Step>
  <Step title="Mô hình/Xác thực">
    - **Khóa API Anthropic**: sử dụng `ANTHROPIC_API_KEY` nếu có hoặc yêu cầu nhập khóa, sau đó lưu khóa để daemon sử dụng.
    - **CLI Anthropic Claude**: đường dẫn cục bộ ưu tiên khi đã có phiên đăng nhập Claude CLI; OpenClaw vẫn hỗ trợ xác thực bằng mã thông báo thiết lập Anthropic như một phương án thay thế.
    - **Gói đăng ký OpenAI Code (Codex) (OAuth)**: quy trình qua trình duyệt; dán `code#state`.
      - Trong lần thiết lập mới chưa có mô hình chính, đặt `agents.defaults.model` thành `openai/gpt-5.6-sol` thông qua môi trường chạy Codex.
    - **Gói đăng ký OpenAI Code (Codex) (ghép nối thiết bị)**: quy trình ghép nối qua trình duyệt bằng mã thiết bị có thời hạn ngắn.
      - Trong lần thiết lập mới chưa có mô hình chính, đặt `agents.defaults.model` thành `openai/gpt-5.6-sol` thông qua môi trường chạy Codex.
    - **Khóa API OpenAI**: sử dụng `OPENAI_API_KEY` nếu có hoặc yêu cầu nhập khóa, sau đó lưu khóa trong các hồ sơ xác thực.
      - Trong lần thiết lập mới chưa có mô hình chính, đặt `agents.defaults.model` thành `openai/gpt-5.6`; mã định danh mô hình API trực tiếp không kèm tiền tố được phân giải thành cấp Sol.
    - Việc thêm hoặc xác thực lại OpenAI sẽ giữ nguyên mô hình chính đã được chỉ định rõ, bao gồm `openai/gpt-5.5`. Nếu tài khoản không cung cấp GPT-5.6, hãy chọn rõ `openai/gpt-5.5`; OpenClaw không tự động hạ cấp mô hình.
    - **OAuth xAI**: đăng nhập qua trình duyệt bằng mã thiết bị mà không cần callback localhost, vì vậy cũng hoạt động qua SSH/Docker/VPS (`--auth-choice xai-oauth`).
    - **Khóa API xAI**: yêu cầu nhập `XAI_API_KEY` (`--auth-choice xai-api-key`).
    - `--auth-choice xai-device-code` vẫn hoạt động dưới dạng bí danh tương thích chỉ dùng thủ công cho cùng quy trình OAuth xAI bằng mã thiết bị; hãy dùng `xai-oauth` cho các tập lệnh mới.
    - **OpenCode**: yêu cầu nhập `OPENCODE_API_KEY` (hoặc `OPENCODE_ZEN_API_KEY`, lấy tại https://opencode.ai/auth) và cho phép bạn chọn danh mục Zen hoặc Go.
    - **Ollama**: trước tiên cung cấp các lựa chọn **Đám mây + Cục bộ**, **Chỉ đám mây** hoặc **Chỉ cục bộ**. `Cloud only` yêu cầu nhập `OLLAMA_API_KEY` và sử dụng `https://ollama.com`; các chế độ dựa trên máy chủ yêu cầu URL cơ sở Ollama (mặc định `http://127.0.0.1:11434`), khám phá các mô hình có sẵn và tự động tải mô hình cục bộ đã chọn khi cần; `Cloud + Local` cũng kiểm tra xem máy chủ Ollama đó đã đăng nhập để truy cập đám mây hay chưa.
    - Chi tiết khác: [Ollama](/vi/providers/ollama)
    - **Khóa API**: lưu khóa cho bạn.
    - **Vercel AI Gateway (proxy đa mô hình)**: yêu cầu nhập `AI_GATEWAY_API_KEY`.
    - Chi tiết khác: [Vercel AI Gateway](/vi/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: yêu cầu Account ID, Gateway ID và `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Chi tiết khác: [Cloudflare AI Gateway](/vi/providers/cloudflare-ai-gateway)
    - **MiniMax**: cấu hình được tự động ghi; giá trị mặc định được lưu trữ là `MiniMax-M3`.
      Thiết lập bằng khóa API sử dụng `minimax/...`, còn thiết lập OAuth sử dụng
      `minimax-portal/...`.
    - Chi tiết khác: [MiniMax](/vi/providers/minimax)
    - **StepFun**: cấu hình được tự động ghi cho StepFun tiêu chuẩn hoặc Step Plan trên các điểm cuối tại Trung Quốc hoặc toàn cầu.
    - Phiên bản tiêu chuẩn hiện mặc định sử dụng `step-3.5-flash`; Step Plan cũng bao gồm `step-3.5-flash-2603`.
    - Chi tiết khác: [StepFun](/vi/providers/stepfun)
    - **Synthetic (tương thích với Anthropic)**: yêu cầu nhập `SYNTHETIC_API_KEY`.
    - Chi tiết khác: [Synthetic](/vi/providers/synthetic)
    - **Moonshot (Kimi K2)**: cấu hình được tự động ghi.
    - **Kimi Coding**: cấu hình được tự động ghi.
    - Chi tiết khác: [Moonshot AI (Kimi + Kimi Coding)](/vi/providers/moonshot)
    - **Nhà cung cấp tùy chỉnh**: hoạt động với các điểm cuối tương thích với OpenAI, tương thích với OpenAI Responses hoặc tương thích với Anthropic. Các cờ không tương tác: `--auth-choice custom-api-key`, `--custom-base-url`, `--custom-model-id`, `--custom-api-key` (không bắt buộc; dự phòng sang `CUSTOM_API_KEY`), `--custom-provider-id` (không bắt buộc; tự động suy ra từ URL cơ sở), `--custom-compatibility openai|openai-responses|anthropic` (mặc định `openai`), `--custom-image-input` / `--custom-text-input` (ghi đè việc phát hiện mô hình thị giác được suy luận).
    - **Bỏ qua**: chưa cấu hình xác thực.
    - Chọn một mô hình mặc định trong các tùy chọn được phát hiện (hoặc nhập thủ công nhà cung cấp/mô hình). Để có chất lượng tốt nhất và giảm rủi ro chèn lời nhắc, hãy chọn mô hình thế hệ mới nhất và mạnh nhất có sẵn trong ngăn xếp nhà cung cấp của bạn.
    - Quy trình làm quen chạy kiểm tra mô hình và cảnh báo nếu mô hình đã cấu hình không xác định hoặc thiếu xác thực.
    - Chế độ lưu trữ khóa API mặc định dùng các giá trị hồ sơ xác thực dạng văn bản thuần. Hãy dùng `--secret-input-mode ref` để lưu các tham chiếu dựa trên biến môi trường thay thế (ví dụ: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`); biến môi trường được tham chiếu phải được đặt sẵn, nếu không quy trình làm quen sẽ thất bại ngay.
    - Các hồ sơ xác thực nằm trong `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (khóa API + OAuth). `~/.openclaw/credentials/oauth.json` là nguồn cũ chỉ dùng để nhập.
    - Chi tiết khác: [OAuth](/vi/concepts/oauth)
    <Note>
    Mẹo cho máy chủ/hệ thống không có giao diện: hoàn tất OAuth trên một máy có trình duyệt, sau đó sao chép
    `auth-profiles.json` của tác nhân đó (ví dụ:
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` hoặc đường dẫn
    `$OPENCLAW_STATE_DIR/...` tương ứng) sang máy chủ Gateway. `credentials/oauth.json`
    chỉ là nguồn nhập cũ.
    </Note>
  </Step>
  <Step title="Không gian làm việc">
    - Mặc định là `~/.openclaw/workspace` (có thể cấu hình).
    - Tạo sẵn các tệp không gian làm việc cần thiết cho quy trình khởi tạo tác nhân.
    - Bố cục đầy đủ của không gian làm việc + hướng dẫn sao lưu: [Không gian làm việc của tác nhân](/vi/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Cổng (mặc định **18789**), địa chỉ liên kết, chế độ xác thực, khả năng truy cập qua Tailscale.
    - Khuyến nghị xác thực: giữ **Mã thông báo** ngay cả với loopback để các máy khách WS cục bộ phải xác thực.
    - Trong chế độ mã thông báo, thiết lập tương tác cung cấp:
      - **Tạo/lưu mã thông báo dạng văn bản thuần** (mặc định)
      - **Sử dụng SecretRef** (chọn dùng)
      - Bắt đầu nhanh tái sử dụng các SecretRef `gateway.auth.token` hiện có trên các nhà cung cấp `env`, `file` và `exec` để thăm dò trong quy trình làm quen/khởi tạo bảng điều khiển.
      - Nếu SecretRef đó đã được cấu hình nhưng không thể phân giải, quy trình làm quen sẽ thất bại sớm kèm thông báo khắc phục rõ ràng thay vì âm thầm làm suy giảm xác thực khi chạy.
    - Trong chế độ mật khẩu, thiết lập tương tác cũng hỗ trợ lưu trữ dạng văn bản thuần hoặc SecretRef.
    - Đường dẫn SecretRef cho mã thông báo ở chế độ không tương tác: `--gateway-token-ref-env <ENV_VAR>`.
      - Yêu cầu một biến môi trường không rỗng trong môi trường của tiến trình làm quen.
      - Không thể kết hợp với `--gateway-token`.
    - Chỉ tắt xác thực nếu bạn hoàn toàn tin cậy mọi tiến trình cục bộ.
    - Các địa chỉ liên kết không phải loopback vẫn yêu cầu xác thực.

  </Step>
  <Step title="Kênh">
    - [WhatsApp](/vi/channels/whatsapp): đăng nhập bằng mã QR không bắt buộc.
    - [Telegram](/vi/channels/telegram): mã thông báo bot.
    - [Discord](/vi/channels/discord): mã thông báo bot.
    - [Google Chat](/vi/channels/googlechat): JSON tài khoản dịch vụ + đối tượng Webhook.
    - [Mattermost](/vi/channels/mattermost) (Plugin): mã thông báo bot + URL cơ sở.
    - [Signal](/vi/channels/signal) (Plugin): cài đặt `signal-cli` không bắt buộc + cấu hình tài khoản.
    - [iMessage](/vi/channels/imessage): đường dẫn CLI `imsg` + quyền truy cập cơ sở dữ liệu Messages; sử dụng trình bao bọc SSH khi Gateway chạy ngoài máy Mac.
    - Discord, Feishu, Microsoft Teams, QQ Bot, Slack và các kênh khác được cung cấp dưới dạng
      Plugin mà quy trình làm quen có thể cài đặt cho bạn. Danh mục đầy đủ: [Kênh](/vi/channels).
    - Bảo mật tin nhắn trực tiếp: mặc định là ghép nối. Tin nhắn trực tiếp đầu tiên gửi một mã; phê duyệt qua `openclaw pairing approve <channel> <code>` hoặc sử dụng danh sách cho phép.

  </Step>
  <Step title="Tìm kiếm web">
    - Chọn một nhà cung cấp được hỗ trợ như Brave, Codex (Hosted Search), DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Parallel, Perplexity, SearXNG hoặc Tavily (hoặc bỏ qua).
    - Các nhà cung cấp dựa trên API có thể sử dụng biến môi trường hoặc cấu hình hiện có để thiết lập nhanh; thay vào đó, các nhà cung cấp không cần khóa sử dụng các điều kiện tiên quyết riêng của từng nhà cung cấp.
    - Bỏ qua bằng `--skip-search`.
    - Cấu hình sau: `openclaw configure --section web`.

  </Step>
  <Step title="Cài đặt daemon">
    - macOS: LaunchAgent
      - Yêu cầu phiên người dùng đã đăng nhập; đối với hệ thống không có giao diện, hãy sử dụng LaunchDaemon tùy chỉnh (không được cung cấp).
    - Linux (và Windows qua WSL2): đơn vị người dùng systemd
      - Quy trình làm quen cố gắng bật chế độ duy trì bằng `loginctl enable-linger <user>` để Gateway tiếp tục chạy sau khi đăng xuất.
      - Có thể yêu cầu sudo (ghi `/var/lib/systemd/linger`); trước tiên hệ thống sẽ thử không dùng sudo.
    - Windows gốc: ưu tiên Scheduled Task; nếu việc tạo tác vụ bị từ chối, OpenClaw sẽ chuyển sang mục đăng nhập theo người dùng trong thư mục Startup và khởi động Gateway ngay lập tức.
    - **Lựa chọn môi trường chạy:** Node là bắt buộc vì kho lưu trữ trạng thái môi trường chạy chuẩn sử dụng `node:sqlite`. Các dịch vụ Bun cũ được di chuyển sang Node trong quá trình sửa chữa.
    - Nếu xác thực bằng mã thông báo yêu cầu mã thông báo và `gateway.auth.token` được SecretRef quản lý, quá trình cài đặt daemon sẽ xác thực mã đó nhưng không lưu các giá trị mã thông báo dạng văn bản thuần đã phân giải vào siêu dữ liệu môi trường dịch vụ của trình giám sát.
    - Nếu xác thực bằng mã thông báo yêu cầu mã thông báo và SecretRef của mã thông báo đã cấu hình không thể phân giải, quá trình cài đặt daemon sẽ bị chặn kèm hướng dẫn có thể thực hiện.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, quá trình cài đặt daemon sẽ bị chặn cho đến khi chế độ được đặt rõ ràng.

  </Step>
  <Step title="Kiểm tra tình trạng">
    - Khởi động Gateway (nếu cần) và chạy `openclaw health`.
    - Mẹo: `openclaw status --deep` thêm phép thăm dò tình trạng Gateway trực tiếp vào đầu ra trạng thái, bao gồm cả thăm dò kênh khi được hỗ trợ (yêu cầu Gateway có thể truy cập).

  </Step>
  <Step title="Skills (khuyến nghị)">
    - Đọc các kỹ năng có sẵn và kiểm tra yêu cầu.
    - Cho phép bạn chọn trình quản lý Node: **npm / pnpm / bun**.
    - Tự động cài đặt các phần phụ thuộc không bắt buộc cho các kỹ năng tích hợp đáng tin cậy (một số kỹ năng sử dụng Homebrew trên macOS).
    - Bỏ qua các kỹ năng không có điều kiện tiên quyết về trình cài đặt Homebrew, uv hoặc Go, nhóm chúng cùng hướng dẫn thiết lập thủ công và trỏ bạn đến `openclaw doctor` sau khi điều kiện tiên quyết được cài đặt.

  </Step>
  <Step title="Hoàn tất">
    - Tóm tắt + các bước tiếp theo, bao gồm lời nhắc **Bạn muốn khởi tạo tác nhân của mình bằng cách nào?** cho Terminal, Trình duyệt hoặc để sau.

  </Step>
</Steps>

<Note>
Nếu không phát hiện GUI, quy trình thiết lập ban đầu sẽ in hướng dẫn chuyển tiếp cổng SSH cho Control UI thay vì mở trình duyệt.
Nếu thiếu tài nguyên Control UI, quy trình thiết lập ban đầu sẽ cố gắng xây dựng chúng; phương án dự phòng là `pnpm ui:build` (tự động cài đặt các phần phụ thuộc của UI).
</Note>

## Chế độ không tương tác

Sử dụng `--non-interactive --accept-risk` để tự động hóa hoặc viết tập lệnh cho quy trình thiết lập ban đầu (cờ này là xác nhận rủi ro bắt buộc; quy trình thiết lập ban đầu sẽ thoát với lỗi nếu không có cờ này):

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Thêm `--json` để nhận bản tóm tắt mà máy có thể đọc được.

SecretRef của token Gateway trong chế độ không tương tác:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` và `--gateway-token-ref-env` loại trừ lẫn nhau.

<Note>
`--json` **không** ngụ ý chế độ không tương tác. Sử dụng `--non-interactive --accept-risk` (và `--workspace`) cho các tập lệnh.
</Note>

Các ví dụ lệnh dành riêng cho từng nhà cung cấp nằm trong [Tự động hóa CLI](/vi/start/wizard-cli-automation#provider-specific-examples).
Sử dụng trang tham chiếu này để biết ngữ nghĩa của các cờ và thứ tự các bước.

### Thêm tác nhân (không tương tác)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

`main` là ID tác nhân dành riêng và không thể dùng cho `openclaw agents add`.

## RPC của trình hướng dẫn Gateway

Gateway cung cấp luồng thiết lập ban đầu qua RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Các máy khách (ứng dụng macOS, Control UI) có thể hiển thị các bước mà không cần triển khai lại logic thiết lập ban đầu.

## Thiết lập Signal (signal-cli)

Quy trình thiết lập ban đầu phát hiện xem `signal-cli` có nằm trên `PATH` hay không và nếu thiếu sẽ đề nghị cài đặt:

- Linux x86-64: tải bản dựng GraalVM gốc chính thức từ các bản phát hành GitHub `signal-cli` và lưu tại `~/.openclaw/tools/signal-cli/<version>/`.
- macOS và các kiến trúc khác: thay vào đó cài đặt qua Homebrew.
- Windows gốc: chưa được hỗ trợ; hãy chạy quy trình thiết lập ban đầu bên trong WSL2 để sử dụng đường dẫn cài đặt Linux.
- Trong cả hai trường hợp, ghi `channels.signal.cliPath` vào cấu hình của bạn.

## Nội dung trình hướng dẫn ghi

Các trường điển hình trong `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` khi truyền `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (nếu chọn Minimax)
- `tools.profile` (quy trình thiết lập ban đầu cục bộ mặc định là `"coding"` khi chưa đặt; các giá trị tường minh hiện có được giữ nguyên)
- `gateway.*` (chế độ, liên kết, xác thực, Tailscale)
- `session.dmScope` (quy trình thiết lập ban đầu cục bộ mặc định đặt giá trị này thành `"per-channel-peer"` khi chưa đặt; các giá trị tường minh hiện có được giữ nguyên. Chi tiết: [Tham chiếu thiết lập CLI](/vi/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Danh sách cho phép DM của kênh khi bạn chọn tham gia trong các lời nhắc về kênh. Discord, Matrix, Microsoft Teams và Slack phân giải tên thành ID khi có thể; các kênh khác nhận ID trực tiếp (ví dụ: ID người gửi Telegram dạng số hoặc số điện thoại WhatsApp).
- `skills.install.nodeManager`
  - `setup --node-manager` chấp nhận `npm`, `pnpm` hoặc `bun`.
  - Cấu hình thủ công vẫn có thể sử dụng `yarn` bằng cách đặt trực tiếp `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` ghi `agents.list[]` và `bindings` tùy chọn.

Thông tin xác thực WhatsApp được lưu trong `~/.openclaw/credentials/whatsapp/<accountId>/`.
Các phiên hoạt động và bản chép lời được lưu trong
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Thư mục
`~/.openclaw/agents/<agentId>/sessions/` được dùng cho dữ liệu đầu vào của quá trình di chuyển cũ
và các thành phần lưu trữ/hỗ trợ.

Một số kênh được phân phối dưới dạng plugin. Khi bạn chọn một kênh trong quá trình thiết lập, quy trình thiết lập ban đầu
sẽ nhắc cài đặt kênh đó (npm hoặc đường dẫn cục bộ) trước khi có thể cấu hình.

## Tài liệu liên quan

- Tổng quan về quy trình thiết lập ban đầu: [Thiết lập ban đầu (CLI)](/vi/start/wizard)
- Tham chiếu thiết lập CLI: [Tham chiếu thiết lập CLI](/vi/start/wizard-cli-reference)
- Thiết lập ban đầu cho ứng dụng macOS: [Thiết lập ban đầu](/vi/start/onboarding)
- Tham chiếu cấu hình: [Cấu hình Gateway](/vi/gateway/configuration)
- Nhà cung cấp: [WhatsApp](/vi/channels/whatsapp), [Telegram](/vi/channels/telegram), [Discord](/vi/channels/discord), [Google Chat](/vi/channels/googlechat), [Signal](/vi/channels/signal), [iMessage](/vi/channels/imessage)
- Skills: [Skills](/vi/tools/skills), [Cấu hình Skills](/vi/tools/skills-config)
