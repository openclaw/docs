---
read_when:
    - Tra cứu một bước thiết lập ban đầu hoặc cờ cụ thể
    - Tự động hóa thiết lập ban đầu bằng chế độ không tương tác
    - Gỡ lỗi hành vi trong quy trình thiết lập ban đầu
sidebarTitle: Onboarding Reference
summary: 'Tài liệu tham chiếu đầy đủ cho quy trình thiết lập ban đầu bằng CLI: mọi bước, cờ và trường cấu hình'
title: Tài liệu tham khảo về thiết lập ban đầu
x-i18n:
    generated_at: "2026-05-06T09:30:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce0ddb07600ef4f84c44734176e42eb6beaa00fede0be156f3bdd2ec1c0111bb
    source_path: reference/wizard.md
    workflow: 16
---

Đây là tài liệu tham chiếu đầy đủ cho `openclaw onboard`.
Để xem tổng quan cấp cao, hãy xem [Thiết lập ban đầu (CLI)](/vi/start/wizard).

## Chi tiết luồng (chế độ cục bộ)

<Steps>
  <Step title="Phát hiện cấu hình hiện có">
    - Nếu `~/.openclaw/openclaw.json` tồn tại, hãy chọn **Giữ / Sửa đổi / Đặt lại**.
    - Chạy lại quy trình thiết lập ban đầu sẽ **không** xóa gì trừ khi bạn chọn rõ ràng **Đặt lại**
      (hoặc truyền `--reset`).
    - CLI `--reset` mặc định là `config+creds+sessions`; dùng `--reset-scope full`
      để cũng xóa workspace.
    - Nếu cấu hình không hợp lệ hoặc chứa các khóa cũ, trình hướng dẫn sẽ dừng và yêu cầu
      bạn chạy `openclaw doctor` trước khi tiếp tục.
    - Đặt lại dùng `trash` (không bao giờ dùng `rm`) và cung cấp các phạm vi:
      - Chỉ cấu hình
      - Cấu hình + thông tin xác thực + phiên
      - Đặt lại toàn bộ (cũng xóa workspace)

  </Step>
  <Step title="Mô hình/Xác thực">
    - **Khóa API Anthropic**: dùng `ANTHROPIC_API_KEY` nếu có hoặc nhắc nhập khóa, rồi lưu khóa đó để daemon sử dụng.
    - **Khóa API Anthropic**: lựa chọn trợ lý Anthropic được ưu tiên trong thiết lập ban đầu/cấu hình.
    - **Anthropic setup-token**: vẫn có trong thiết lập ban đầu/cấu hình, dù OpenClaw hiện ưu tiên tái sử dụng Claude CLI khi có sẵn.
    - **Gói đăng ký OpenAI Code (Codex) (OAuth)**: luồng trình duyệt; dán `code#state`.
      - Đặt `agents.defaults.model` thành `openai-codex/gpt-5.5` khi chưa đặt mô hình hoặc mô hình đã thuộc họ OpenAI.
    - **Gói đăng ký OpenAI Code (Codex) (ghép cặp thiết bị)**: luồng ghép cặp trình duyệt với mã thiết bị tồn tại ngắn hạn.
      - Đặt `agents.defaults.model` thành `openai-codex/gpt-5.5` khi chưa đặt mô hình hoặc mô hình đã thuộc họ OpenAI.
    - **Khóa API OpenAI**: dùng `OPENAI_API_KEY` nếu có hoặc nhắc nhập khóa, rồi lưu khóa đó trong các hồ sơ xác thực.
      - Đặt `agents.defaults.model` thành `openai/gpt-5.5` khi chưa đặt mô hình, `openai/*`, hoặc `openai-codex/*`.
    - **Khóa API xAI (Grok)**: nhắc nhập `XAI_API_KEY` và cấu hình xAI làm nhà cung cấp mô hình.
    - **OpenCode**: nhắc nhập `OPENCODE_API_KEY` (hoặc `OPENCODE_ZEN_API_KEY`, lấy tại https://opencode.ai/auth) và cho phép bạn chọn danh mục Zen hoặc Go.
    - **Ollama**: trước tiên cung cấp **Cloud + Local**, **Chỉ Cloud**, hoặc **Chỉ Local**. `Cloud only` nhắc nhập `OLLAMA_API_KEY` và dùng `https://ollama.com`; các chế độ dựa trên máy chủ sẽ nhắc nhập URL cơ sở Ollama, phát hiện các mô hình có sẵn và tự động kéo mô hình cục bộ đã chọn khi cần; `Cloud + Local` cũng kiểm tra máy chủ Ollama đó đã đăng nhập để truy cập cloud hay chưa.
    - Chi tiết thêm: [Ollama](/vi/providers/ollama)
    - **Khóa API**: lưu khóa cho bạn.
    - **Vercel AI Gateway (proxy đa mô hình)**: nhắc nhập `AI_GATEWAY_API_KEY`.
    - Chi tiết thêm: [Vercel AI Gateway](/vi/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: nhắc nhập Account ID, Gateway ID, và `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Chi tiết thêm: [Cloudflare AI Gateway](/vi/providers/cloudflare-ai-gateway)
    - **MiniMax**: cấu hình được tự động ghi; mặc định được lưu trữ là `MiniMax-M2.7`.
      Thiết lập khóa API dùng `minimax/...`, còn thiết lập OAuth dùng
      `minimax-portal/...`.
    - Chi tiết thêm: [MiniMax](/vi/providers/minimax)
    - **StepFun**: cấu hình được tự động ghi cho StepFun tiêu chuẩn hoặc Step Plan trên endpoint Trung Quốc hoặc toàn cầu.
    - Tiêu chuẩn hiện bao gồm `step-3.5-flash`, và Step Plan cũng bao gồm `step-3.5-flash-2603`.
    - Chi tiết thêm: [StepFun](/vi/providers/stepfun)
    - **Synthetic (tương thích Anthropic)**: nhắc nhập `SYNTHETIC_API_KEY`.
    - Chi tiết thêm: [Synthetic](/vi/providers/synthetic)
    - **Moonshot (Kimi K2)**: cấu hình được tự động ghi.
    - **Kimi Coding**: cấu hình được tự động ghi.
    - Chi tiết thêm: [Moonshot AI (Kimi + Kimi Coding)](/vi/providers/moonshot)
    - **Bỏ qua**: chưa cấu hình xác thực.
    - Chọn một mô hình mặc định từ các tùy chọn được phát hiện (hoặc nhập thủ công nhà cung cấp/mô hình). Để có chất lượng tốt nhất và giảm rủi ro chèn prompt, hãy chọn mô hình thế hệ mới nhất mạnh nhất có sẵn trong ngăn xếp nhà cung cấp của bạn.
    - Thiết lập ban đầu chạy kiểm tra mô hình và cảnh báo nếu mô hình đã cấu hình không xác định hoặc thiếu xác thực.
    - Chế độ lưu trữ khóa API mặc định là các giá trị hồ sơ xác thực dạng văn bản thuần. Dùng `--secret-input-mode ref` để thay vào đó lưu các tham chiếu dựa trên env (ví dụ `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Hồ sơ xác thực nằm trong `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (khóa API + OAuth). `~/.openclaw/credentials/oauth.json` chỉ là nguồn nhập cũ.
    - Chi tiết thêm: [/concepts/oauth](/vi/concepts/oauth)
    <Note>
    Mẹo cho headless/máy chủ: hoàn tất OAuth trên máy có trình duyệt, rồi sao chép
    `auth-profiles.json` của tác nhân đó (ví dụ
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, hoặc đường dẫn
    `$OPENCLAW_STATE_DIR/...` tương ứng) sang máy chủ gateway. `credentials/oauth.json`
    chỉ là nguồn nhập cũ.
    </Note>
  </Step>
  <Step title="Workspace">
    - Mặc định `~/.openclaw/workspace` (có thể cấu hình).
    - Gieo các tệp workspace cần thiết cho nghi thức khởi động tác nhân.
    - Bố cục workspace đầy đủ + hướng dẫn sao lưu: [Workspace của tác nhân](/vi/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Cổng, bind, chế độ xác thực, phơi bày qua tailscale.
    - Khuyến nghị xác thực: giữ **Token** ngay cả với loopback để các máy khách WS cục bộ phải xác thực.
    - Ở chế độ token, thiết lập tương tác cung cấp:
      - **Tạo/lưu token văn bản thuần** (mặc định)
      - **Dùng SecretRef** (chọn tham gia)
      - Quickstart tái sử dụng các SecretRef `gateway.auth.token` hiện có trên các nhà cung cấp `env`, `file`, và `exec` để dò thiết lập ban đầu/khởi động dashboard.
      - Nếu SecretRef đó đã được cấu hình nhưng không thể phân giải, thiết lập ban đầu sẽ thất bại sớm với thông báo sửa lỗi rõ ràng thay vì âm thầm hạ cấp xác thực runtime.
    - Ở chế độ mật khẩu, thiết lập tương tác cũng hỗ trợ lưu trữ văn bản thuần hoặc SecretRef.
    - Đường dẫn SecretRef token không tương tác: `--gateway-token-ref-env <ENV_VAR>`.
      - Yêu cầu một biến env không rỗng trong môi trường quy trình thiết lập ban đầu.
      - Không thể kết hợp với `--gateway-token`.
    - Chỉ tắt xác thực nếu bạn hoàn toàn tin tưởng mọi quy trình cục bộ.
    - Các bind không phải loopback vẫn yêu cầu xác thực.

  </Step>
  <Step title="Kênh">
    - [WhatsApp](/vi/channels/whatsapp): đăng nhập QR tùy chọn.
    - [Telegram](/vi/channels/telegram): token bot.
    - [Discord](/vi/channels/discord): token bot.
    - [Google Chat](/vi/channels/googlechat): JSON tài khoản dịch vụ + đối tượng Webhook.
    - [Mattermost](/vi/channels/mattermost) (Plugin): token bot + URL cơ sở.
    - [Signal](/vi/channels/signal): cài đặt `signal-cli` tùy chọn + cấu hình tài khoản.
    - [BlueBubbles](/vi/channels/bluebubbles): **được khuyến nghị cho iMessage**; URL máy chủ + mật khẩu + Webhook.
    - [iMessage](/vi/channels/imessage): đường dẫn CLI `imsg` cũ + quyền truy cập DB.
    - Bảo mật DM: mặc định là ghép cặp. DM đầu tiên gửi một mã; phê duyệt qua `openclaw pairing approve <channel> <code>` hoặc dùng allowlist.

  </Step>
  <Step title="Tìm kiếm web">
    - Chọn một nhà cung cấp được hỗ trợ như Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, hoặc Tavily (hoặc bỏ qua).
    - Các nhà cung cấp dựa trên API có thể dùng biến env hoặc cấu hình hiện có để thiết lập nhanh; các nhà cung cấp không cần khóa dùng điều kiện tiên quyết riêng của nhà cung cấp đó.
    - Bỏ qua bằng `--skip-search`.
    - Cấu hình sau: `openclaw configure --section web`.

  </Step>
  <Step title="Cài đặt daemon">
    - macOS: LaunchAgent
      - Yêu cầu phiên người dùng đã đăng nhập; với headless, dùng LaunchDaemon tùy chỉnh (không được cung cấp).
    - Linux (và Windows qua WSL2): systemd user unit
      - Thiết lập ban đầu cố bật lingering qua `loginctl enable-linger <user>` để Gateway vẫn chạy sau khi đăng xuất.
      - Có thể nhắc sudo (ghi `/var/lib/systemd/linger`); trước tiên sẽ thử không dùng sudo.
    - **Chọn runtime:** Node (khuyến nghị; bắt buộc cho WhatsApp/Telegram). Bun **không được khuyến nghị**.
    - Nếu xác thực token yêu cầu token và `gateway.auth.token` được quản lý bằng SecretRef, cài đặt daemon sẽ xác thực nó nhưng không duy trì giá trị token văn bản thuần đã phân giải vào metadata môi trường dịch vụ supervisor.
    - Nếu xác thực token yêu cầu token và SecretRef token đã cấu hình không phân giải được, cài đặt daemon sẽ bị chặn với hướng dẫn có thể thực hiện.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, cài đặt daemon sẽ bị chặn cho đến khi chế độ được đặt rõ ràng.

  </Step>
  <Step title="Kiểm tra sức khỏe">
    - Khởi động Gateway (nếu cần) và chạy `openclaw health`.
    - Mẹo: `openclaw status --deep` thêm phép dò sức khỏe gateway trực tiếp vào đầu ra trạng thái, bao gồm cả phép dò kênh khi được hỗ trợ (yêu cầu gateway có thể truy cập).

  </Step>
  <Step title="Skills (được khuyến nghị)">
    - Đọc các skills có sẵn và kiểm tra yêu cầu.
    - Cho phép bạn chọn trình quản lý node: **npm / pnpm** (bun không được khuyến nghị).
    - Cài đặt các phụ thuộc tùy chọn (một số dùng Homebrew trên macOS).

  </Step>
  <Step title="Hoàn tất">
    - Tóm tắt + bước tiếp theo, bao gồm ứng dụng iOS/Android/macOS cho các tính năng bổ sung.

  </Step>
</Steps>

<Note>
Nếu không phát hiện GUI, thiết lập ban đầu in hướng dẫn chuyển tiếp cổng SSH cho Control UI thay vì mở trình duyệt.
Nếu thiếu tài nguyên Control UI, thiết lập ban đầu cố gắng build chúng; phương án dự phòng là `pnpm ui:build` (tự động cài đặt phụ thuộc UI).
</Note>

## Chế độ không tương tác

Dùng `--non-interactive` để tự động hóa hoặc viết script cho thiết lập ban đầu:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Thêm `--json` để có bản tóm tắt máy có thể đọc.

SecretRef token Gateway ở chế độ không tương tác:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` và `--gateway-token-ref-env` loại trừ lẫn nhau.

<Note>
`--json` **không** ngụ ý chế độ không tương tác. Dùng `--non-interactive` (và `--workspace`) cho script.
</Note>

Các ví dụ lệnh dành riêng cho nhà cung cấp nằm trong [Tự động hóa CLI](/vi/start/wizard-cli-automation#provider-specific-examples).
Dùng trang tham chiếu này cho ngữ nghĩa flag và thứ tự bước.

### Thêm tác nhân (không tương tác)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC trình hướng dẫn Gateway

Gateway phơi bày luồng thiết lập ban đầu qua RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Máy khách (ứng dụng macOS, Control UI) có thể render các bước mà không cần triển khai lại logic thiết lập ban đầu.

## Thiết lập Signal (signal-cli)

Thiết lập ban đầu có thể cài đặt `signal-cli` từ GitHub releases:

- Tải xuống tài nguyên release phù hợp.
- Lưu dưới `~/.openclaw/tools/signal-cli/<version>/`.
- Ghi `channels.signal.cliPath` vào cấu hình của bạn.

Ghi chú:

- Bản build JVM yêu cầu **Java 21**.
- Bản build native được dùng khi có sẵn.
- Windows dùng WSL2; cài đặt signal-cli theo luồng Linux bên trong WSL.

## Những gì trình hướng dẫn ghi

Các trường điển hình trong `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (nếu chọn Minimax)
- `tools.profile` (thiết lập ban đầu cục bộ mặc định là `"coding"` khi chưa đặt; các giá trị tường minh hiện có được giữ nguyên)
- `gateway.*` (chế độ, bind, xác thực, tailscale)
- `session.dmScope` (chi tiết hành vi: [Tham chiếu thiết lập CLI](/vi/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Danh sách cho phép của kênh (Slack/Discord/Matrix/Microsoft Teams) khi bạn chọn tham gia trong các lời nhắc (tên được phân giải thành ID khi có thể).
- `skills.install.nodeManager`
  - `setup --node-manager` chấp nhận `npm`, `pnpm` hoặc `bun`.
  - Cấu hình thủ công vẫn có thể dùng `yarn` bằng cách đặt trực tiếp `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` ghi `agents.list[]` và `bindings` tùy chọn.

Thông tin xác thực WhatsApp nằm trong `~/.openclaw/credentials/whatsapp/<accountId>/`.
Phiên được lưu trong `~/.openclaw/agents/<agentId>/sessions/`.

Một số kênh được phân phối dưới dạng Plugin. Khi bạn chọn một kênh trong quá trình thiết lập, onboarding sẽ nhắc cài đặt kênh đó (npm hoặc đường dẫn cục bộ) trước khi có thể cấu hình.

## Tài liệu liên quan

- Tổng quan thiết lập ban đầu: [Thiết lập ban đầu (CLI)](/vi/start/wizard)
- Thiết lập ban đầu cho ứng dụng macOS: [Thiết lập ban đầu](/vi/start/onboarding)
- Tham chiếu cấu hình: [Cấu hình Gateway](/vi/gateway/configuration)
- Nhà cung cấp: [WhatsApp](/vi/channels/whatsapp), [Telegram](/vi/channels/telegram), [Discord](/vi/channels/discord), [Google Chat](/vi/channels/googlechat), [Signal](/vi/channels/signal), [BlueBubbles](/vi/channels/bluebubbles) (iMessage), [iMessage](/vi/channels/imessage) (cũ)
- Skills: [Skills](/vi/tools/skills), [Cấu hình Skills](/vi/tools/skills-config)
