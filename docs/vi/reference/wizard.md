---
read_when:
    - Tra cứu một bước thiết lập ban đầu hoặc cờ cụ thể
    - Tự động hóa quá trình thiết lập ban đầu bằng chế độ không tương tác
    - Gỡ lỗi hành vi thiết lập ban đầu
sidebarTitle: Onboarding Reference
summary: 'Tài liệu tham chiếu đầy đủ cho quy trình thiết lập ban đầu qua CLI: mọi bước, cờ và trường cấu hình'
title: Tài liệu tham khảo về quy trình thiết lập ban đầu
x-i18n:
    generated_at: "2026-05-10T19:51:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: be3e45f152700f02a212a390cdc02d5432ff531716a089f531de3bb6cc368cc9
    source_path: reference/wizard.md
    workflow: 16
---

Đây là tham chiếu đầy đủ cho `openclaw onboard`.
Để xem tổng quan cấp cao, hãy xem [Onboarding (CLI)](/vi/start/wizard).

## Chi tiết luồng (chế độ cục bộ)

<Steps>
  <Step title="Phát hiện cấu hình hiện có">
    - Nếu `~/.openclaw/openclaw.json` tồn tại, hãy chọn **Giữ giá trị hiện tại**, **Xem lại và cập nhật**, hoặc **Đặt lại trước khi thiết lập**.
    - Chạy lại onboarding **không** xóa bất cứ thứ gì trừ khi bạn chọn rõ ràng **Đặt lại**
      (hoặc truyền `--reset`).
    - CLI `--reset` mặc định là `config+creds+sessions`; dùng `--reset-scope full`
      để xóa cả workspace.
    - Nếu cấu hình không hợp lệ hoặc chứa khóa cũ, wizard sẽ dừng và yêu cầu
      bạn chạy `openclaw doctor` trước khi tiếp tục.
    - Đặt lại dùng `trash` (không bao giờ dùng `rm`) và cung cấp các phạm vi:
      - Chỉ cấu hình
      - Cấu hình + thông tin xác thực + phiên
      - Đặt lại đầy đủ (cũng xóa workspace)

  </Step>
  <Step title="Mô hình/Xác thực">
    - **Khóa API Anthropic**: dùng `ANTHROPIC_API_KEY` nếu có hoặc nhắc nhập khóa, rồi lưu khóa đó để daemon sử dụng.
    - **Khóa API Anthropic**: lựa chọn assistant Anthropic ưu tiên trong onboarding/configure.
    - **setup-token Anthropic**: vẫn có trong onboarding/configure, dù OpenClaw hiện ưu tiên tái sử dụng Claude CLI khi có thể.
    - **Gói đăng ký OpenAI Code (Codex) (OAuth)**: luồng trình duyệt; dán `code#state`.
      - Đặt `agents.defaults.model` thành `openai/gpt-5.5` thông qua runtime Codex khi model chưa được đặt hoặc đã thuộc họ OpenAI.
    - **Gói đăng ký OpenAI Code (Codex) (ghép nối thiết bị)**: luồng ghép nối trình duyệt với mã thiết bị ngắn hạn.
      - Đặt `agents.defaults.model` thành `openai/gpt-5.5` thông qua runtime Codex khi model chưa được đặt hoặc đã thuộc họ OpenAI.
    - **Khóa API OpenAI**: dùng `OPENAI_API_KEY` nếu có hoặc nhắc nhập khóa, rồi lưu khóa đó trong hồ sơ xác thực.
      - Đặt `agents.defaults.model` thành `openai/gpt-5.5` khi model chưa được đặt, là `openai/*`, hoặc `openai-codex/*`.
    - **Khóa API xAI (Grok)**: nhắc nhập `XAI_API_KEY` và cấu hình xAI làm nhà cung cấp model.
    - **OpenCode**: nhắc nhập `OPENCODE_API_KEY` (hoặc `OPENCODE_ZEN_API_KEY`, lấy tại https://opencode.ai/auth) và cho phép bạn chọn catalog Zen hoặc Go.
    - **Ollama**: trước tiên cung cấp **Đám mây + Cục bộ**, **Chỉ đám mây**, hoặc **Chỉ cục bộ**. `Cloud only` nhắc nhập `OLLAMA_API_KEY` và dùng `https://ollama.com`; các chế độ dựa trên host nhắc nhập URL cơ sở Ollama, phát hiện các model có sẵn, và tự động kéo model cục bộ đã chọn khi cần; `Cloud + Local` cũng kiểm tra host Ollama đó đã đăng nhập để truy cập đám mây hay chưa.
    - Chi tiết thêm: [Ollama](/vi/providers/ollama)
    - **Khóa API**: lưu khóa cho bạn.
    - **Vercel AI Gateway (proxy đa model)**: nhắc nhập `AI_GATEWAY_API_KEY`.
    - Chi tiết thêm: [Vercel AI Gateway](/vi/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: nhắc nhập Account ID, Gateway ID, và `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Chi tiết thêm: [Cloudflare AI Gateway](/vi/providers/cloudflare-ai-gateway)
    - **MiniMax**: cấu hình được tự động ghi; mặc định hosted là `MiniMax-M2.7`.
      Thiết lập bằng khóa API dùng `minimax/...`, còn thiết lập OAuth dùng
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
    - Chọn model mặc định từ các tùy chọn đã phát hiện (hoặc nhập provider/model thủ công). Để có chất lượng tốt nhất và giảm rủi ro prompt-injection, hãy chọn model thế hệ mới nhất mạnh nhất có trong stack provider của bạn.
    - Onboarding chạy kiểm tra model và cảnh báo nếu model đã cấu hình không xác định hoặc thiếu xác thực.
    - Chế độ lưu trữ khóa API mặc định là giá trị hồ sơ xác thực dạng văn bản thuần. Dùng `--secret-input-mode ref` để lưu ref dựa trên env thay thế (ví dụ `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Hồ sơ xác thực nằm trong `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (khóa API + OAuth). `~/.openclaw/credentials/oauth.json` chỉ là nguồn nhập cũ.
    - Chi tiết thêm: [/concepts/oauth](/vi/concepts/oauth)
    <Note>
    Mẹo cho headless/server: hoàn tất OAuth trên máy có trình duyệt, sau đó sao chép
    `auth-profiles.json` của agent đó (ví dụ
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, hoặc đường dẫn
    `$OPENCLAW_STATE_DIR/...` tương ứng) sang host Gateway. `credentials/oauth.json`
    chỉ là nguồn nhập cũ.
    </Note>
  </Step>
  <Step title="Workspace">
    - Mặc định `~/.openclaw/workspace` (có thể cấu hình).
    - Tạo sẵn các tệp workspace cần thiết cho nghi thức bootstrap của agent.
    - Bố cục workspace đầy đủ + hướng dẫn sao lưu: [Workspace của agent](/vi/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Cổng, bind, chế độ xác thực, mở truy cập qua Tailscale.
    - Khuyến nghị xác thực: giữ **Token** ngay cả với loopback để các client WS cục bộ phải xác thực.
    - Trong chế độ token, thiết lập tương tác cung cấp:
      - **Tạo/lưu token văn bản thuần** (mặc định)
      - **Dùng SecretRef** (chọn tham gia)
      - Quickstart tái sử dụng SecretRef `gateway.auth.token` hiện có trên các provider `env`, `file`, và `exec` cho probe onboarding/dashboard bootstrap.
      - Nếu SecretRef đó được cấu hình nhưng không thể phân giải, onboarding sẽ thất bại sớm với thông báo sửa lỗi rõ ràng thay vì âm thầm hạ cấp xác thực runtime.
    - Trong chế độ mật khẩu, thiết lập tương tác cũng hỗ trợ lưu trữ văn bản thuần hoặc SecretRef.
    - Đường dẫn SecretRef token không tương tác: `--gateway-token-ref-env <ENV_VAR>`.
      - Yêu cầu biến env không rỗng trong môi trường tiến trình onboarding.
      - Không thể kết hợp với `--gateway-token`.
    - Chỉ tắt xác thực nếu bạn hoàn toàn tin cậy mọi tiến trình cục bộ.
    - Bind không phải loopback vẫn yêu cầu xác thực.

  </Step>
  <Step title="Kênh">
    - [WhatsApp](/vi/channels/whatsapp): đăng nhập QR tùy chọn.
    - [Telegram](/vi/channels/telegram): token bot.
    - [Discord](/vi/channels/discord): token bot.
    - [Google Chat](/vi/channels/googlechat): JSON tài khoản dịch vụ + đối tượng Webhook.
    - [Mattermost](/vi/channels/mattermost) (Plugin): token bot + URL cơ sở.
    - [Signal](/vi/channels/signal): cài đặt `signal-cli` tùy chọn + cấu hình tài khoản.
    - [iMessage](/vi/channels/imessage): đường dẫn CLI `imsg` + quyền truy cập DB Messages; dùng wrapper SSH khi Gateway chạy ngoài máy Mac.
    - Bảo mật DM: mặc định là ghép nối. DM đầu tiên gửi một mã; phê duyệt qua `openclaw pairing approve <channel> <code>` hoặc dùng allowlist.

  </Step>
  <Step title="Tìm kiếm web">
    - Chọn provider được hỗ trợ như Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, hoặc Tavily (hoặc bỏ qua).
    - Provider dựa trên API có thể dùng biến env hoặc cấu hình hiện có để thiết lập nhanh; provider không cần khóa dùng các điều kiện tiên quyết riêng của provider đó.
    - Bỏ qua bằng `--skip-search`.
    - Cấu hình sau: `openclaw configure --section web`.

  </Step>
  <Step title="Cài đặt daemon">
    - macOS: LaunchAgent
      - Yêu cầu phiên người dùng đã đăng nhập; với headless, dùng LaunchDaemon tùy chỉnh (không được cung cấp sẵn).
    - Linux (và Windows qua WSL2): systemd user unit
      - Onboarding cố gắng bật lingering qua `loginctl enable-linger <user>` để Gateway vẫn chạy sau khi đăng xuất.
      - Có thể nhắc sudo (ghi `/var/lib/systemd/linger`); công cụ thử không dùng sudo trước.
    - **Lựa chọn runtime:** Node (khuyến nghị; bắt buộc cho WhatsApp/Telegram). Bun **không được khuyến nghị**.
    - Nếu xác thực token yêu cầu token và `gateway.auth.token` được SecretRef quản lý, cài đặt daemon sẽ xác thực token đó nhưng không lưu các giá trị token văn bản thuần đã phân giải vào metadata môi trường dịch vụ supervisor.
    - Nếu xác thực token yêu cầu token và SecretRef token đã cấu hình chưa được phân giải, cài đặt daemon sẽ bị chặn với hướng dẫn có thể thực hiện.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, cài đặt daemon sẽ bị chặn cho đến khi mode được đặt rõ ràng.

  </Step>
  <Step title="Kiểm tra sức khỏe">
    - Khởi động Gateway (nếu cần) và chạy `openclaw health`.
    - Mẹo: `openclaw status --deep` thêm probe sức khỏe gateway trực tiếp vào đầu ra trạng thái, bao gồm probe kênh khi được hỗ trợ (yêu cầu gateway có thể truy cập).

  </Step>
  <Step title="Skills (khuyến nghị)">
    - Đọc các skill có sẵn và kiểm tra yêu cầu.
    - Cho phép bạn chọn trình quản lý node: **npm / pnpm** (bun không được khuyến nghị).
    - Cài đặt các phụ thuộc tùy chọn (một số dùng Homebrew trên macOS).

  </Step>
  <Step title="Hoàn tất">
    - Tóm tắt + các bước tiếp theo, bao gồm lời nhắc **Bạn muốn hatch agent của mình như thế nào?** cho Terminal, Browser, hoặc để sau.

  </Step>
</Steps>

<Note>
Nếu không phát hiện GUI, onboarding sẽ in hướng dẫn chuyển tiếp cổng SSH cho Control UI thay vì mở trình duyệt.
Nếu thiếu asset Control UI, onboarding sẽ cố gắng build chúng; phương án dự phòng là `pnpm ui:build` (tự động cài đặt phụ thuộc UI).
</Note>

## Chế độ không tương tác

Dùng `--non-interactive` để tự động hóa hoặc viết script cho onboarding:

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

Thêm `--json` để có bản tóm tắt máy đọc được.

SecretRef token Gateway trong chế độ không tương tác:

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

Ví dụ lệnh riêng theo provider nằm trong [Tự động hóa CLI](/vi/start/wizard-cli-automation#provider-specific-examples).
Dùng trang tham chiếu này cho ngữ nghĩa flag và thứ tự bước.

### Thêm agent (không tương tác)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC wizard Gateway

Gateway cung cấp luồng onboarding qua RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Client (ứng dụng macOS, Control UI) có thể render các bước mà không cần triển khai lại logic onboarding.

## Thiết lập Signal (signal-cli)

Onboarding có thể cài đặt `signal-cli` từ GitHub releases:

- Tải xuống asset release phù hợp.
- Lưu dưới `~/.openclaw/tools/signal-cli/<version>/`.
- Ghi `channels.signal.cliPath` vào cấu hình của bạn.

Ghi chú:

- Bản build JVM yêu cầu **Java 21**.
- Bản build native được dùng khi có sẵn.
- Windows dùng WSL2; cài đặt signal-cli theo luồng Linux bên trong WSL.

## Những gì wizard ghi

Các trường điển hình trong `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (nếu chọn Minimax)
- `tools.profile` (thiết lập ban đầu cục bộ mặc định là `"coding"` khi chưa đặt; các giá trị tường minh hiện có được giữ nguyên)
- `gateway.*` (chế độ, liên kết, xác thực, tailscale)
- `session.dmScope` (chi tiết hành vi: [Tham chiếu thiết lập CLI](/vi/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Danh sách cho phép của kênh (Slack/Discord/Matrix/Microsoft Teams) khi bạn chọn tham gia trong các lời nhắc (tên được phân giải thành ID khi có thể).
- `skills.install.nodeManager`
  - `setup --node-manager` chấp nhận `npm`, `pnpm`, hoặc `bun`.
  - Cấu hình thủ công vẫn có thể dùng `yarn` bằng cách đặt trực tiếp `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` ghi `agents.list[]` và `bindings` tùy chọn.

Thông tin xác thực WhatsApp nằm trong `~/.openclaw/credentials/whatsapp/<accountId>/`.
Các phiên được lưu trong `~/.openclaw/agents/<agentId>/sessions/`.

Một số kênh được phân phối dưới dạng Plugin. Khi bạn chọn một kênh trong quá trình thiết lập,
quy trình thiết lập ban đầu sẽ nhắc cài đặt kênh đó (npm hoặc một đường dẫn cục bộ) trước khi có thể cấu hình.

## Tài liệu liên quan

- Tổng quan thiết lập ban đầu: [Thiết lập ban đầu (CLI)](/vi/start/wizard)
- Thiết lập ban đầu ứng dụng macOS: [Thiết lập ban đầu](/vi/start/onboarding)
- Tham chiếu cấu hình: [Cấu hình Gateway](/vi/gateway/configuration)
- Nhà cung cấp: [WhatsApp](/vi/channels/whatsapp), [Telegram](/vi/channels/telegram), [Discord](/vi/channels/discord), [Google Chat](/vi/channels/googlechat), [Signal](/vi/channels/signal), [iMessage](/vi/channels/imessage)
- Skills: [Skills](/vi/tools/skills), [Cấu hình Skills](/vi/tools/skills-config)
