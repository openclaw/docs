---
read_when:
    - Thêm hoặc sửa đổi các bản di chuyển của doctor
    - Giới thiệu các thay đổi cấu hình phá vỡ tương thích
sidebarTitle: Doctor
summary: 'Lệnh Doctor: kiểm tra tình trạng, di trú cấu hình và các bước sửa chữa'
title: Chẩn đoán
x-i18n:
    generated_at: "2026-05-01T10:48:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: eef5715d485609fa60bdb4aa97ee441b053a60519b9dea03b0c8ec09db157474
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` là công cụ sửa chữa + di chuyển cho OpenClaw. Công cụ này sửa cấu hình/trạng thái đã cũ, kiểm tra sức khỏe và cung cấp các bước sửa chữa có thể thực hiện được.

## Bắt đầu nhanh

```bash
openclaw doctor
```

### Chế độ không giao diện và tự động hóa

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Chấp nhận giá trị mặc định mà không nhắc hỏi (bao gồm các bước sửa chữa khởi động lại/dịch vụ/sandbox khi áp dụng).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Áp dụng các sửa chữa được khuyến nghị mà không nhắc hỏi (sửa chữa + khởi động lại khi an toàn).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Áp dụng cả các sửa chữa mạnh tay (ghi đè cấu hình supervisor tùy chỉnh).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Chạy không có lời nhắc và chỉ áp dụng các di chuyển an toàn (chuẩn hóa cấu hình + di chuyển trạng thái trên đĩa). Bỏ qua các hành động khởi động lại/dịch vụ/sandbox cần xác nhận của con người. Các di chuyển trạng thái cũ sẽ tự động chạy khi được phát hiện.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Quét các dịch vụ hệ thống để tìm các bản cài đặt gateway bổ sung (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Nếu bạn muốn xem lại thay đổi trước khi ghi, hãy mở tệp cấu hình trước:

```bash
cat ~/.openclaw/openclaw.json
```

## Công cụ này làm gì (tóm tắt)

<AccordionGroup>
  <Accordion title="Sức khỏe, UI và cập nhật">
    - Tùy chọn cập nhật kiểm tra trước cho bản cài đặt git (chỉ tương tác).
    - Kiểm tra độ mới của giao thức UI (xây dựng lại Control UI khi schema giao thức mới hơn).
    - Kiểm tra sức khỏe + lời nhắc khởi động lại.
    - Tóm tắt trạng thái Skills (đủ điều kiện/thiếu/bị chặn) và trạng thái plugin.

  </Accordion>
  <Accordion title="Cấu hình và di chuyển">
    - Chuẩn hóa cấu hình cho các giá trị cũ.
    - Di chuyển cấu hình Talk từ các trường phẳng `talk.*` cũ sang `talk.provider` + `talk.providers.<provider>`.
    - Kiểm tra di chuyển trình duyệt cho cấu hình tiện ích Chrome cũ và mức sẵn sàng Chrome MCP.
    - Cảnh báo ghi đè nhà cung cấp OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Cảnh báo che khuất OAuth Codex (`models.providers.openai-codex`).
    - Kiểm tra điều kiện tiên quyết OAuth TLS cho hồ sơ OpenAI Codex OAuth.
    - Cảnh báo danh sách cho phép plugin/công cụ khi `plugins.allow` bị hạn chế nhưng chính sách công cụ vẫn yêu cầu wildcard hoặc công cụ thuộc sở hữu plugin.
    - Di chuyển trạng thái cũ trên đĩa (sessions/thư mục agent/xác thực WhatsApp).
    - Di chuyển khóa hợp đồng manifest plugin cũ (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Di chuyển kho cron cũ (`jobId`, `schedule.cron`, các trường delivery/payload cấp cao nhất, payload `provider`, các tác vụ webhook dự phòng đơn giản `notify: true`).
    - Di chuyển chính sách runtime agent cũ sang `agents.defaults.agentRuntime` và `agents.list[].agentRuntime`.
    - Dọn dẹp cấu hình plugin đã cũ khi plugin được bật; khi `plugins.enabled=false`, các tham chiếu plugin đã cũ được xem là cấu hình bao chứa bất hoạt và được giữ nguyên.

  </Accordion>
  <Accordion title="Trạng thái và tính toàn vẹn">
    - Kiểm tra tệp khóa phiên và dọn dẹp khóa đã cũ.
    - Sửa bản ghi phiên cho các nhánh viết lại prompt bị trùng lặp do các bản dựng 2026.4.24 bị ảnh hưởng tạo ra.
    - Phát hiện tombstone khôi phục-khởi động lại của subagent bị kẹt, có hỗ trợ `--fix` để xóa cờ khôi phục đã hủy đã cũ nhằm tránh việc khởi động tiếp tục xem child là đã hủy khởi động lại.
    - Kiểm tra tính toàn vẹn trạng thái và quyền (sessions, transcripts, thư mục trạng thái).
    - Kiểm tra quyền tệp cấu hình (chmod 600) khi chạy cục bộ.
    - Sức khỏe xác thực mô hình: kiểm tra OAuth hết hạn, có thể làm mới token sắp hết hạn và báo cáo trạng thái cooldown/bị tắt của hồ sơ xác thực.
    - Phát hiện thư mục workspace bổ sung (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, dịch vụ và supervisor">
    - Sửa image sandbox khi sandboxing được bật.
    - Di chuyển dịch vụ cũ và phát hiện gateway bổ sung.
    - Di chuyển trạng thái cũ của kênh Matrix (ở chế độ `--fix` / `--repair`).
    - Kiểm tra runtime Gateway (dịch vụ đã cài nhưng không chạy; nhãn launchd được lưu cache).
    - Cảnh báo trạng thái kênh (thăm dò từ gateway đang chạy).
    - Kiểm tra cấu hình supervisor (launchd/systemd/schtasks) với tùy chọn sửa chữa.
    - Dọn dẹp môi trường proxy nhúng cho các dịch vụ gateway đã ghi lại giá trị shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` trong quá trình cài đặt hoặc cập nhật.
    - Kiểm tra thực hành tốt nhất cho runtime Gateway (Node so với Bun, đường dẫn trình quản lý phiên bản).
    - Chẩn đoán xung đột cổng Gateway (mặc định `18789`).

  </Accordion>
  <Accordion title="Xác thực, bảo mật và ghép nối">
    - Cảnh báo bảo mật cho chính sách DM mở.
    - Kiểm tra xác thực Gateway cho chế độ token cục bộ (đề xuất tạo token khi không có nguồn token; không ghi đè cấu hình token SecretRef).
    - Phát hiện sự cố ghép nối thiết bị (yêu cầu ghép nối lần đầu đang chờ, nâng cấp vai trò/phạm vi đang chờ, lệch cache token thiết bị cục bộ đã cũ và lệch xác thực bản ghi đã ghép nối).

  </Accordion>
  <Accordion title="Workspace và shell">
    - Kiểm tra systemd linger trên Linux.
    - Kiểm tra kích thước tệp bootstrap workspace (cảnh báo bị cắt/gần giới hạn cho tệp ngữ cảnh).
    - Kiểm tra trạng thái shell completion và tự động cài đặt/nâng cấp.
    - Kiểm tra mức sẵn sàng của nhà cung cấp embedding tìm kiếm bộ nhớ (mô hình cục bộ, khóa API từ xa hoặc tệp nhị phân QMD).
    - Kiểm tra bản cài đặt từ nguồn (pnpm workspace không khớp, thiếu tài nguyên UI, thiếu tệp nhị phân tsx).
    - Ghi cấu hình đã cập nhật + metadata wizard.

  </Accordion>
</AccordionGroup>

## Điền bù và đặt lại Dreams UI

Cảnh Dreams trong Control UI bao gồm các hành động **Backfill**, **Reset** và **Clear Grounded** cho quy trình grounded dreaming. Những hành động này dùng các phương thức RPC kiểu gateway doctor, nhưng chúng **không** phải là một phần của sửa chữa/di chuyển CLI `openclaw doctor`.

Những gì chúng làm:

- **Backfill** quét các tệp `memory/YYYY-MM-DD.md` lịch sử trong workspace đang hoạt động, chạy lượt grounded REM diary và ghi các mục điền bù có thể đảo ngược vào `DREAMS.md`.
- **Reset** chỉ xóa các mục nhật ký điền bù được đánh dấu đó khỏi `DREAMS.md`.
- **Clear Grounded** chỉ xóa các mục ngắn hạn chỉ-grounded đã được đưa vào hàng chờ, đến từ phát lại lịch sử và chưa tích lũy recall trực tiếp hoặc hỗ trợ hằng ngày.

Những gì bản thân chúng **không** làm:

- chúng không chỉnh sửa `MEMORY.md`
- chúng không chạy toàn bộ di chuyển doctor
- chúng không tự động đưa các ứng viên grounded vào kho thăng hạng ngắn hạn trực tiếp trừ khi bạn chạy rõ ràng đường dẫn CLI đã đưa vào hàng chờ trước

Nếu bạn muốn phát lại lịch sử grounded ảnh hưởng đến làn thăng hạng sâu thông thường, hãy dùng luồng CLI thay thế:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Lệnh đó đưa các ứng viên bền vững grounded vào kho dreaming ngắn hạn trong khi vẫn giữ `DREAMS.md` làm bề mặt rà soát.

## Hành vi chi tiết và lý do

<AccordionGroup>
  <Accordion title="0. Cập nhật tùy chọn (bản cài đặt git)">
    Nếu đây là một checkout git và doctor đang chạy tương tác, nó sẽ đề xuất cập nhật (fetch/rebase/build) trước khi chạy doctor.
  </Accordion>
  <Accordion title="1. Chuẩn hóa cấu hình">
    Nếu cấu hình chứa các dạng giá trị cũ (ví dụ `messages.ackReaction` không có ghi đè riêng cho kênh), doctor sẽ chuẩn hóa chúng vào schema hiện tại.

    Điều đó bao gồm các trường phẳng Talk cũ. Cấu hình Talk công khai hiện tại là `talk.provider` + `talk.providers.<provider>`. Doctor viết lại các dạng cũ `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` vào bản đồ nhà cung cấp.

    Doctor cũng cảnh báo khi `plugins.allow` không rỗng và chính sách công cụ dùng
    wildcard hoặc các mục công cụ thuộc sở hữu plugin. `tools.allow: ["*"]` chỉ khớp với công cụ
    từ các plugin thật sự tải; nó không bỏ qua danh sách cho phép plugin độc quyền.

  </Accordion>
  <Accordion title="2. Di chuyển khóa cấu hình cũ">
    Khi cấu hình chứa các khóa không còn được dùng, các lệnh khác sẽ từ chối chạy và yêu cầu bạn chạy `openclaw doctor`.

    Doctor sẽ:

    - Giải thích những khóa cũ nào đã được tìm thấy.
    - Hiển thị di chuyển đã áp dụng.
    - Viết lại `~/.openclaw/openclaw.json` với schema đã cập nhật.

    Gateway cũng tự động chạy các di chuyển doctor khi khởi động nếu phát hiện định dạng cấu hình cũ, vì vậy cấu hình đã cũ được sửa mà không cần can thiệp thủ công. Di chuyển kho tác vụ cron được xử lý bởi `openclaw doctor --fix`.

    Các di chuyển hiện tại:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` cấp cao nhất
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` cũ → `talk.provider` + `talk.providers.<provider>`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` và `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` và `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` và `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` và `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Với các kênh có `accounts` được đặt tên nhưng vẫn còn các giá trị kênh cấp cao nhất cho một tài khoản, hãy chuyển các giá trị theo phạm vi tài khoản đó vào tài khoản được nâng cấp được chọn cho kênh đó (`accounts.default` cho hầu hết các kênh; Matrix có thể giữ một đích được đặt tên/mặc định khớp hiện có)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - xóa `agents.defaults.llm`; dùng `models.providers.<id>.timeoutSeconds` cho thời gian chờ nhà cung cấp/mô hình chậm
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - xóa `browser.relayBindHost` (thiết lập relay extension cũ)
    - `models.providers.*.api: "openai"` cũ → `"openai-completions"` (khởi động Gateway cũng bỏ qua các nhà cung cấp có `api` được đặt thành giá trị enum tương lai hoặc không xác định thay vì đóng bằng lỗi)

    Cảnh báo của doctor cũng bao gồm hướng dẫn mặc định tài khoản cho các kênh nhiều tài khoản:

    - Nếu hai hoặc nhiều mục `channels.<channel>.accounts` được cấu hình mà không có `channels.<channel>.defaultAccount` hoặc `accounts.default`, doctor cảnh báo rằng định tuyến dự phòng có thể chọn một tài khoản không mong muốn.
    - Nếu `channels.<channel>.defaultAccount` được đặt thành ID tài khoản không xác định, doctor cảnh báo và liệt kê các ID tài khoản đã cấu hình.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    Nếu bạn đã thêm thủ công `models.providers.opencode`, `opencode-zen`, hoặc `opencode-go`, nó sẽ ghi đè catalog OpenCode tích hợp từ `@mariozechner/pi-ai`. Điều đó có thể ép mô hình dùng sai API hoặc đưa chi phí về không. Doctor cảnh báo để bạn có thể xóa phần ghi đè và khôi phục định tuyến API + chi phí theo từng mô hình.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    Nếu cấu hình trình duyệt của bạn vẫn trỏ đến đường dẫn Chrome extension đã bị xóa, doctor sẽ chuẩn hóa nó sang mô hình gắn Chrome MCP cục bộ trên host hiện tại:

    - `browser.profiles.*.driver: "extension"` trở thành `"existing-session"`
    - `browser.relayBindHost` bị xóa

    Doctor cũng kiểm tra đường dẫn Chrome MCP cục bộ trên host khi bạn dùng `defaultProfile: "user"` hoặc một hồ sơ `existing-session` đã cấu hình:

    - kiểm tra Google Chrome có được cài trên cùng host cho các hồ sơ tự động kết nối mặc định hay không
    - kiểm tra phiên bản Chrome được phát hiện và cảnh báo khi phiên bản đó thấp hơn Chrome 144
    - nhắc bạn bật gỡ lỗi từ xa trong trang kiểm tra của trình duyệt (ví dụ `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, hoặc `edge://inspect/#remote-debugging`)

    Doctor không thể bật thiết lập phía Chrome thay bạn. Chrome MCP cục bộ trên host vẫn yêu cầu:

    - trình duyệt dựa trên Chromium 144+ trên host gateway/node
    - trình duyệt đang chạy cục bộ
    - đã bật gỡ lỗi từ xa trong trình duyệt đó
    - chấp thuận lời nhắc đồng ý gắn lần đầu trong trình duyệt

    Mức sẵn sàng ở đây chỉ nói về các điều kiện tiên quyết để gắn cục bộ. Existing-session giữ các giới hạn tuyến Chrome MCP hiện tại; các tuyến nâng cao như `responsebody`, xuất PDF, chặn tải xuống và hành động hàng loạt vẫn yêu cầu trình duyệt được quản lý hoặc hồ sơ CDP thô.

    Kiểm tra này **không** áp dụng cho Docker, sandbox, remote-browser hoặc các luồng headless khác. Các luồng đó tiếp tục dùng CDP thô.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    Khi một hồ sơ OAuth OpenAI Codex được cấu hình, doctor thăm dò endpoint ủy quyền OpenAI để xác minh rằng ngăn xếp TLS Node/OpenSSL cục bộ có thể xác thực chuỗi chứng chỉ. Nếu phép thăm dò thất bại với lỗi chứng chỉ (ví dụ `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, chứng chỉ hết hạn, hoặc chứng chỉ tự ký), doctor in hướng dẫn sửa lỗi theo từng nền tảng. Trên macOS với Node Homebrew, cách sửa thường là `brew postinstall ca-certificates`. Với `--deep`, phép thăm dò vẫn chạy ngay cả khi gateway khỏe mạnh.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    Nếu trước đây bạn đã thêm các thiết lập vận chuyển OpenAI cũ trong `models.providers.openai-codex`, chúng có thể che khuất đường dẫn nhà cung cấp OAuth Codex tích hợp mà các bản phát hành mới hơn tự động sử dụng. Doctor cảnh báo khi thấy các thiết lập vận chuyển cũ đó đi kèm OAuth Codex để bạn có thể xóa hoặc viết lại phần ghi đè vận chuyển lỗi thời và lấy lại hành vi định tuyến/dự phòng tích hợp. Proxy tùy chỉnh và ghi đè chỉ header vẫn được hỗ trợ và không kích hoạt cảnh báo này.
  </Accordion>
  <Accordion title="2f. Codex plugin route warnings">
    Khi Plugin Codex đi kèm được bật, doctor cũng kiểm tra xem các tham chiếu mô hình chính `openai-codex/*` có còn phân giải qua trình chạy PI mặc định hay không. Tổ hợp đó hợp lệ khi bạn muốn xác thực OAuth/subscription Codex qua PI, nhưng rất dễ nhầm với harness app-server Codex gốc. Doctor cảnh báo và chỉ đến dạng app-server tường minh: `openai/*` cộng với `agentRuntime.id: "codex"` hoặc `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor không tự động sửa việc này vì cả hai tuyến đều hợp lệ:

    - `openai-codex/*` + PI nghĩa là "dùng xác thực OAuth/subscription Codex qua trình chạy OpenClaw bình thường."
    - `openai/*` + `runtime: "codex"` nghĩa là "chạy lượt nhúng qua app-server Codex gốc."
    - `/codex ...` nghĩa là "điều khiển hoặc liên kết một cuộc trò chuyện Codex gốc từ chat."
    - `/acp ...` hoặc `runtime: "acp"` nghĩa là "dùng adapter ACP/acpx bên ngoài."

    Nếu cảnh báo xuất hiện, hãy chọn tuyến bạn dự định dùng và chỉnh cấu hình thủ công. Giữ nguyên cảnh báo khi PI Codex OAuth là chủ ý.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor có thể di chuyển các bố cục cũ trên đĩa sang cấu trúc hiện tại:

    - Kho phiên + bản ghi:
      - từ `~/.openclaw/sessions/` sang `~/.openclaw/agents/<agentId>/sessions/`
    - Thư mục agent:
      - từ `~/.openclaw/agent/` sang `~/.openclaw/agents/<agentId>/agent/`
    - Trạng thái xác thực WhatsApp (Baileys):
      - từ `~/.openclaw/credentials/*.json` cũ (ngoại trừ `oauth.json`)
      - sang `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID tài khoản mặc định: `default`)

    Các di chuyển này là best-effort và lũy đẳng; doctor sẽ phát cảnh báo khi để lại bất kỳ thư mục cũ nào làm bản sao lưu. Gateway/CLI cũng tự động di chuyển phiên cũ + thư mục agent khi khởi động để lịch sử/xác thực/mô hình nằm trong đường dẫn theo từng agent mà không cần chạy doctor thủ công. Chuẩn hóa nhà cung cấp/bản đồ nhà cung cấp talk giờ so sánh bằng bình đẳng cấu trúc, nên các khác biệt chỉ do thứ tự khóa không còn kích hoạt lặp lại các thay đổi `doctor --fix` không hiệu lực.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor quét tất cả manifest Plugin đã cài để tìm các khóa capability cấp cao nhất đã lỗi thời (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Khi tìm thấy, nó đề xuất chuyển chúng vào đối tượng `contracts` và ghi lại tệp manifest tại chỗ. Di chuyển này là lũy đẳng; nếu khóa `contracts` đã có cùng giá trị, khóa cũ sẽ bị xóa mà không nhân đôi dữ liệu.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor cũng kiểm tra kho công việc Cron (`~/.openclaw/cron/jobs.json` theo mặc định, hoặc `cron.store` khi được ghi đè) để tìm các dạng công việc cũ mà bộ lập lịch vẫn chấp nhận để tương thích.

    Các dọn dẹp Cron hiện tại bao gồm:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - các trường payload cấp cao nhất (`message`, `model`, `thinking`, ...) → `payload`
    - các trường giao hàng cấp cao nhất (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - bí danh giao hàng `provider` trong payload → `delivery.channel` tường minh
    - các công việc dự phòng Webhook `notify: true` cũ đơn giản → `delivery.mode="webhook"` tường minh với `delivery.to=cron.webhook`

    Doctor chỉ tự động di chuyển các công việc `notify: true` khi có thể làm vậy mà không đổi hành vi. Nếu một công việc kết hợp dự phòng notify cũ với một chế độ giao hàng không phải Webhook hiện có, doctor cảnh báo và để công việc đó lại để xem xét thủ công.

  </Accordion>
  <Accordion title="3c. Session lock cleanup">
    Doctor quét mọi thư mục phiên agent để tìm các tệp khóa ghi cũ — các tệp còn sót lại khi phiên thoát bất thường. Với mỗi tệp khóa tìm thấy, nó báo cáo: đường dẫn, PID, PID còn sống hay không, tuổi khóa và nó có được xem là cũ hay không (PID đã chết hoặc cũ hơn 30 phút). Ở chế độ `--fix` / `--repair`, nó tự động xóa các tệp khóa cũ; nếu không, nó in ghi chú và hướng dẫn bạn chạy lại với `--fix`.
  </Accordion>
  <Accordion title="3d. Session transcript branch repair">
    Doctor quét các tệp JSONL phiên agent để tìm dạng nhánh bị nhân đôi được tạo bởi lỗi viết lại bản ghi prompt 2026.4.24: một lượt người dùng bị bỏ với ngữ cảnh runtime nội bộ OpenClaw cộng với một nhánh anh em đang hoạt động chứa cùng prompt người dùng hiển thị. Ở chế độ `--fix` / `--repair`, doctor sao lưu từng tệp bị ảnh hưởng cạnh tệp gốc và viết lại bản ghi sang nhánh đang hoạt động để lịch sử gateway và trình đọc bộ nhớ không còn thấy các lượt trùng lặp.
  </Accordion>
  <Accordion title="4. State integrity checks (session persistence, routing, and safety)">
    Thư mục trạng thái là trục vận hành trung tâm. Nếu nó biến mất, bạn sẽ mất phiên, thông tin xác thực, nhật ký và cấu hình (trừ khi bạn có bản sao lưu ở nơi khác).

    Doctor kiểm tra:

    - **Thiếu thư mục trạng thái**: cảnh báo về mất trạng thái nghiêm trọng, nhắc tạo lại thư mục và nhắc bạn rằng không thể khôi phục dữ liệu bị thiếu.
    - **Quyền thư mục trạng thái**: xác minh khả năng ghi; đề xuất sửa quyền (và phát gợi ý `chown` khi phát hiện chủ sở hữu/nhóm không khớp).
    - **Thư mục trạng thái được đồng bộ đám mây trên macOS**: cảnh báo khi trạng thái phân giải dưới iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) hoặc `~/Library/CloudStorage/...` vì các đường dẫn dựa trên đồng bộ có thể gây I/O chậm hơn và tranh chấp khóa/đồng bộ.
    - **Thư mục trạng thái trên SD hoặc eMMC Linux**: cảnh báo khi trạng thái phân giải đến nguồn gắn kết `mmcblk*`, vì I/O ngẫu nhiên dựa trên SD hoặc eMMC có thể chậm hơn và hao mòn nhanh hơn khi ghi phiên và thông tin xác thực.
    - **Thiếu thư mục phiên**: `sessions/` và thư mục kho lưu phiên là bắt buộc để lưu lịch sử và tránh sự cố `ENOENT`.
    - **Bản ghi không khớp**: cảnh báo khi các mục phiên gần đây thiếu tệp bản ghi.
    - **Phiên chính "JSONL 1 dòng"**: đánh dấu khi bản ghi chính chỉ có một dòng (lịch sử không được tích lũy).
    - **Nhiều thư mục trạng thái**: cảnh báo khi tồn tại nhiều thư mục `~/.openclaw` trên các thư mục home hoặc khi `OPENCLAW_STATE_DIR` trỏ đến nơi khác (lịch sử có thể bị tách giữa các bản cài đặt).
    - **Nhắc nhở chế độ từ xa**: nếu `gateway.mode=remote`, doctor nhắc bạn chạy nó trên máy chủ từ xa (trạng thái nằm ở đó).
    - **Quyền tệp cấu hình**: cảnh báo nếu `~/.openclaw/openclaw.json` có thể đọc bởi nhóm/mọi người và đề xuất siết chặt thành `600`.

  </Accordion>
  <Accordion title="5. Tình trạng xác thực mô hình (OAuth hết hạn)">
    Doctor kiểm tra các hồ sơ OAuth trong kho xác thực, cảnh báo khi token sắp hết hạn/đã hết hạn, và có thể làm mới chúng khi an toàn. Nếu hồ sơ OAuth/token Anthropic đã cũ, nó đề xuất khóa API Anthropic hoặc đường dẫn setup-token Anthropic. Lời nhắc làm mới chỉ xuất hiện khi chạy tương tác (TTY); `--non-interactive` bỏ qua các lần thử làm mới.

    Khi làm mới OAuth thất bại vĩnh viễn (ví dụ `refresh_token_reused`, `invalid_grant`, hoặc nhà cung cấp yêu cầu bạn đăng nhập lại), doctor báo rằng cần xác thực lại và in chính xác lệnh `openclaw models auth login --provider ...` cần chạy.

    Doctor cũng báo cáo các hồ sơ xác thực tạm thời không dùng được do:

    - thời gian chờ ngắn (giới hạn tốc độ/hết thời gian chờ/lỗi xác thực)
    - vô hiệu hóa lâu hơn (lỗi thanh toán/tín dụng)

  </Accordion>
  <Accordion title="6. Xác thực mô hình hooks">
    Nếu `hooks.gmail.model` được đặt, doctor xác thực tham chiếu mô hình theo catalog và danh sách cho phép, đồng thời cảnh báo khi nó không phân giải được hoặc bị cấm.
  </Accordion>
  <Accordion title="7. Sửa ảnh sandbox">
    Khi sandboxing được bật, doctor kiểm tra ảnh Docker và đề xuất build hoặc chuyển sang tên cũ nếu thiếu ảnh hiện tại.
  </Accordion>
  <Accordion title="7b. Phụ thuộc runtime của plugin đi kèm">
    Doctor chỉ xác minh các phụ thuộc runtime cho những plugin đi kèm đang hoạt động trong cấu hình hiện tại hoặc được bật bởi mặc định manifest đi kèm của chúng, ví dụ `plugins.entries.discord.enabled: true`, `channels.discord.enabled: true` cũ, `models.providers.*` đã cấu hình / tham chiếu mô hình agent, hoặc một plugin đi kèm được bật mặc định mà không có quyền sở hữu provider. Nếu thiếu bất kỳ phụ thuộc nào, doctor báo cáo các package và cài đặt chúng ở chế độ `openclaw doctor --fix` / `openclaw doctor --repair`. Plugin bên ngoài vẫn dùng `openclaw plugins install` / `openclaw plugins update`; doctor không cài đặt phụ thuộc cho các đường dẫn plugin tùy ý.

    Trong quá trình sửa của doctor, các lần cài đặt npm phụ thuộc runtime đi kèm báo tiến trình spinner trong phiên TTY và tiến trình dạng dòng định kỳ trong đầu ra pipe/headless. Khởi động Gateway và tải lại cấu hình đi vào chế độ plugin-plan trước khi import các module runtime plugin đi kèm; các lần import runtime bình thường chỉ xác minh và không sinh sửa chữa bằng trình quản lý package. Các lần cài đặt này được giới hạn trong gốc cài đặt runtime plugin, chạy với script bị tắt, không ghi package lock, và được bảo vệ bằng khóa install-root để các lần khởi động CLI hoặc Gateway đồng thời không thay đổi cùng một cây `node_modules` cùng lúc. Các khóa cũ lỗi thời từ những lần khởi động Docker/container bị kill được thu hồi khi metadata chủ sở hữu của chúng không chứng minh được một phiên bản tiến trình hiện tại và các tệp khóa đã cũ.

  </Accordion>
  <Accordion title="8. Di chuyển dịch vụ Gateway và gợi ý dọn dẹp">
    Doctor phát hiện các dịch vụ gateway cũ (launchd/systemd/schtasks) và đề xuất xóa chúng rồi cài đặt dịch vụ OpenClaw bằng cổng gateway hiện tại. Nó cũng có thể quét các dịch vụ giống gateway bổ sung và in gợi ý dọn dẹp. Các dịch vụ gateway OpenClaw có tên theo hồ sơ được xem là hạng nhất và không bị đánh dấu là "bổ sung".

    Trên Linux, nếu thiếu dịch vụ gateway cấp người dùng nhưng tồn tại dịch vụ gateway OpenClaw cấp hệ thống, doctor không tự động cài đặt dịch vụ cấp người dùng thứ hai. Kiểm tra bằng `openclaw gateway status --deep` hoặc `openclaw doctor --deep`, rồi xóa bản trùng lặp hoặc đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một bộ giám sát hệ thống sở hữu vòng đời gateway.

  </Accordion>
  <Accordion title="8b. Di chuyển Startup Matrix">
    Khi tài khoản kênh Matrix có một di chuyển trạng thái cũ đang chờ hoặc có thể thực hiện, doctor (ở chế độ `--fix` / `--repair`) tạo snapshot trước di chuyển rồi chạy các bước di chuyển theo nỗ lực tốt nhất: di chuyển trạng thái Matrix cũ và chuẩn bị trạng thái mã hóa cũ. Cả hai bước đều không gây lỗi nghiêm trọng; lỗi được ghi log và quá trình khởi động tiếp tục. Ở chế độ chỉ đọc (`openclaw doctor` không có `--fix`), kiểm tra này bị bỏ qua hoàn toàn.
  </Accordion>
  <Accordion title="8c. Ghép đôi thiết bị và lệch xác thực">
    Doctor hiện kiểm tra trạng thái ghép đôi thiết bị như một phần của lượt kiểm tra sức khỏe thông thường.

    Nội dung được báo cáo:

    - yêu cầu ghép đôi lần đầu đang chờ
    - nâng cấp vai trò đang chờ cho thiết bị đã ghép đôi
    - nâng cấp phạm vi đang chờ cho thiết bị đã ghép đôi
    - sửa lỗi khóa công khai không khớp khi id thiết bị vẫn khớp nhưng danh tính thiết bị không còn khớp bản ghi đã phê duyệt
    - bản ghi đã ghép đôi thiếu token hoạt động cho vai trò đã phê duyệt
    - token đã ghép đôi có phạm vi lệch khỏi baseline ghép đôi đã phê duyệt
    - mục device-token được lưu cache cục bộ cho máy hiện tại có trước lần xoay vòng token phía gateway hoặc mang metadata phạm vi lỗi thời

    Doctor không tự động phê duyệt yêu cầu ghép đôi hoặc tự động xoay vòng token thiết bị. Thay vào đó, nó in chính xác các bước tiếp theo:

    - kiểm tra các yêu cầu đang chờ bằng `openclaw devices list`
    - phê duyệt đúng yêu cầu bằng `openclaw devices approve <requestId>`
    - xoay vòng token mới bằng `openclaw devices rotate --device <deviceId> --role <role>`
    - xóa và phê duyệt lại bản ghi lỗi thời bằng `openclaw devices remove <deviceId>`

    Điều này đóng lỗ hổng phổ biến "đã ghép đôi nhưng vẫn bị yêu cầu ghép đôi": doctor giờ phân biệt ghép đôi lần đầu với nâng cấp vai trò/phạm vi đang chờ và với lệch token/danh tính thiết bị lỗi thời.

  </Accordion>
  <Accordion title="9. Cảnh báo bảo mật">
    Doctor phát cảnh báo khi provider mở cho DM mà không có danh sách cho phép, hoặc khi policy được cấu hình theo cách nguy hiểm.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Nếu đang chạy như một dịch vụ người dùng systemd, doctor đảm bảo linger được bật để gateway vẫn chạy sau khi đăng xuất.
  </Accordion>
  <Accordion title="11. Trạng thái workspace (skills, plugin và thư mục cũ)">
    Doctor in tóm tắt trạng thái workspace cho agent mặc định:

    - **Trạng thái Skills**: đếm skills đủ điều kiện, thiếu yêu cầu, và bị chặn bởi danh sách cho phép.
    - **Thư mục workspace cũ**: cảnh báo khi `~/openclaw` hoặc các thư mục workspace cũ khác tồn tại cạnh workspace hiện tại.
    - **Trạng thái Plugin**: đếm plugin đã bật/đã tắt/lỗi; liệt kê ID plugin cho mọi lỗi; báo cáo khả năng plugin bundle.
    - **Cảnh báo tương thích Plugin**: đánh dấu các plugin có vấn đề tương thích với runtime hiện tại.
    - **Chẩn đoán Plugin**: hiển thị mọi cảnh báo hoặc lỗi khi tải do registry plugin phát ra.

  </Accordion>
  <Accordion title="11b. Kích thước tệp bootstrap">
    Doctor kiểm tra liệu các tệp bootstrap workspace (ví dụ `AGENTS.md`, `CLAUDE.md`, hoặc các tệp ngữ cảnh được chèn khác) có gần hoặc vượt ngân sách ký tự đã cấu hình hay không. Nó báo cáo số ký tự thô so với đã chèn theo từng tệp, phần trăm cắt bớt, nguyên nhân cắt bớt (`max/file` hoặc `max/total`), và tổng số ký tự đã chèn dưới dạng tỷ lệ của tổng ngân sách. Khi tệp bị cắt bớt hoặc gần giới hạn, doctor in mẹo điều chỉnh `agents.defaults.bootstrapMaxChars` và `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Dọn dẹp plugin kênh lỗi thời">
    Khi `openclaw doctor --fix` xóa một plugin kênh bị thiếu, nó cũng xóa cấu hình treo trong phạm vi kênh đã tham chiếu plugin đó: các mục `channels.<id>`, mục tiêu heartbeat đã đặt tên kênh, và override `agents.*.models["<channel>/*"]`. Điều này ngăn vòng lặp khởi động Gateway khi runtime kênh đã biến mất nhưng cấu hình vẫn yêu cầu gateway bind vào nó.
  </Accordion>
  <Accordion title="11c. Hoàn thành shell">
    Doctor kiểm tra liệu hoàn thành tab đã được cài đặt cho shell hiện tại hay chưa (zsh, bash, fish, hoặc PowerShell):

    - Nếu hồ sơ shell dùng mẫu hoàn thành động chậm (`source <(openclaw completion ...)`), doctor nâng cấp nó lên biến thể tệp cache nhanh hơn.
    - Nếu hoàn thành được cấu hình trong hồ sơ nhưng thiếu tệp cache, doctor tự động tạo lại cache.
    - Nếu chưa cấu hình hoàn thành nào, doctor nhắc cài đặt nó (chỉ chế độ tương tác; bỏ qua với `--non-interactive`).

    Chạy `openclaw completion --write-state` để tạo lại cache thủ công.

  </Accordion>
  <Accordion title="12. Kiểm tra xác thực Gateway (token cục bộ)">
    Doctor kiểm tra mức sẵn sàng xác thực token gateway cục bộ.

    - Nếu chế độ token cần token và không tồn tại nguồn token, doctor đề xuất tạo một token.
    - Nếu `gateway.auth.token` được SecretRef quản lý nhưng không khả dụng, doctor cảnh báo và không ghi đè nó bằng văn bản thuần.
    - `openclaw doctor --generate-gateway-token` chỉ buộc tạo khi không cấu hình token SecretRef.

  </Accordion>
  <Accordion title="12b. Sửa chữa chỉ đọc nhận biết SecretRef">
    Một số luồng sửa chữa cần kiểm tra thông tin xác thực đã cấu hình mà không làm yếu hành vi runtime fail-fast.

    - `openclaw doctor --fix` hiện dùng cùng mô hình tóm tắt SecretRef chỉ đọc như các lệnh nhóm status cho các sửa chữa cấu hình có mục tiêu.
    - Ví dụ: sửa Telegram `allowFrom` / `groupAllowFrom` `@username` cố dùng thông tin xác thực bot đã cấu hình khi có sẵn.
    - Nếu token bot Telegram được cấu hình qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại, doctor báo rằng thông tin xác thực đã được cấu hình nhưng không khả dụng và bỏ qua tự động phân giải thay vì crash hoặc báo sai rằng thiếu token.

  </Accordion>
  <Accordion title="13. Kiểm tra sức khỏe Gateway + khởi động lại">
    Doctor chạy kiểm tra sức khỏe và đề xuất khởi động lại gateway khi nó có vẻ không khỏe.
  </Accordion>
  <Accordion title="13b. Mức sẵn sàng tìm kiếm bộ nhớ">
    Doctor kiểm tra liệu provider embedding tìm kiếm bộ nhớ đã cấu hình có sẵn sàng cho agent mặc định hay không. Hành vi phụ thuộc vào backend và provider đã cấu hình:

    - **Backend QMD**: thăm dò xem binary `qmd` có khả dụng và có thể khởi động hay không. Nếu không, in hướng dẫn sửa gồm package npm và tùy chọn đường dẫn binary thủ công.
    - **Provider cục bộ rõ ràng**: kiểm tra tệp mô hình cục bộ hoặc URL mô hình từ xa/có thể tải xuống được nhận diện. Nếu thiếu, đề xuất chuyển sang provider từ xa.
    - **Provider từ xa rõ ràng** (`openai`, `voyage`, v.v.): xác minh khóa API có trong môi trường hoặc kho xác thực. In gợi ý sửa có thể hành động nếu thiếu.
    - **Provider tự động**: kiểm tra khả năng có sẵn của mô hình cục bộ trước, rồi thử từng provider từ xa theo thứ tự tự động chọn.

    Khi có kết quả thăm dò Gateway được lưu trong bộ nhớ đệm (Gateway khỏe mạnh tại thời điểm kiểm tra), doctor đối chiếu kết quả đó với cấu hình mà CLI nhìn thấy và ghi nhận mọi sai khác. Doctor không bắt đầu một lần ping embedding mới trên đường dẫn mặc định; hãy dùng lệnh trạng thái bộ nhớ sâu khi bạn muốn kiểm tra provider trực tiếp.

    Dùng `openclaw memory status --deep` để xác minh trạng thái sẵn sàng của embedding tại runtime.

  </Accordion>
  <Accordion title="14. Cảnh báo trạng thái kênh">
    Nếu Gateway khỏe mạnh, doctor chạy một thăm dò trạng thái kênh và báo cáo cảnh báo kèm bản sửa được đề xuất.
  </Accordion>
  <Accordion title="15. Kiểm tra + sửa cấu hình supervisor">
    Doctor kiểm tra cấu hình supervisor đã cài đặt (launchd/systemd/schtasks) để tìm các mặc định bị thiếu hoặc đã lỗi thời (ví dụ: phụ thuộc systemd network-online và độ trễ khởi động lại). Khi tìm thấy sai lệch, nó đề xuất cập nhật và có thể ghi lại tệp service/tác vụ theo các mặc định hiện tại.

    Ghi chú:

    - `openclaw doctor` hỏi trước khi ghi lại cấu hình supervisor.
    - `openclaw doctor --yes` chấp nhận các lời nhắc sửa mặc định.
    - `openclaw doctor --repair` áp dụng các bản sửa được đề xuất mà không hỏi.
    - `openclaw doctor --repair --force` ghi đè cấu hình supervisor tùy chỉnh.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` giữ doctor ở chế độ chỉ đọc đối với vòng đời service Gateway. Nó vẫn báo cáo tình trạng service và chạy các bản sửa không thuộc service, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap service, ghi lại cấu hình supervisor và dọn dẹp service cũ vì một supervisor bên ngoài sở hữu vòng đời đó.
    - Trên Linux, doctor không ghi lại siêu dữ liệu lệnh/entrypoint trong khi unit Gateway systemd khớp đang hoạt động. Nó cũng bỏ qua các unit bổ sung không hoạt động, không phải legacy nhưng giống Gateway trong quá trình quét service trùng lặp để các tệp service đồng hành không tạo nhiễu dọn dẹp.
    - Nếu xác thực bằng token yêu cầu token và `gateway.auth.token` được quản lý bằng SecretRef, quá trình cài đặt/sửa service của doctor xác thực SecretRef nhưng không lưu các giá trị token dạng văn bản thuần đã phân giải vào siêu dữ liệu môi trường service của supervisor.
    - Doctor phát hiện các giá trị môi trường service được quản lý dựa trên `.env`/SecretRef mà các bản cài đặt LaunchAgent, systemd hoặc Windows Scheduled Task cũ đã nhúng inline, rồi ghi lại siêu dữ liệu service để các giá trị đó tải từ nguồn runtime thay vì định nghĩa supervisor.
    - Doctor phát hiện khi lệnh service vẫn ghim `--port` cũ sau khi `gateway.port` thay đổi và ghi lại siêu dữ liệu service sang cổng hiện tại.
    - Nếu xác thực bằng token yêu cầu token và SecretRef token đã cấu hình chưa phân giải được, doctor chặn đường dẫn cài đặt/sửa với hướng dẫn có thể hành động.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, doctor chặn cài đặt/sửa cho đến khi mode được đặt rõ ràng.
    - Với các unit user-systemd trên Linux, kiểm tra lệch token của doctor hiện bao gồm cả nguồn `Environment=` và `EnvironmentFile=` khi so sánh siêu dữ liệu xác thực service.
    - Các bản sửa service của doctor từ chối ghi lại, dừng hoặc khởi động lại service Gateway từ một binary OpenClaw cũ hơn khi cấu hình được ghi lần cuối bởi phiên bản mới hơn. Xem [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Bạn luôn có thể buộc ghi lại toàn bộ qua `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Chẩn đoán runtime + cổng của Gateway">
    Doctor kiểm tra runtime của service (PID, trạng thái thoát gần nhất) và cảnh báo khi service đã được cài đặt nhưng thực tế không chạy. Nó cũng kiểm tra xung đột cổng trên cổng Gateway (mặc định `18789`) và báo cáo các nguyên nhân có khả năng xảy ra (Gateway đã chạy, đường hầm SSH).
  </Accordion>
  <Accordion title="17. Thực hành tốt nhất cho runtime của Gateway">
    Doctor cảnh báo khi service Gateway chạy trên Bun hoặc một đường dẫn Node do trình quản lý phiên bản quản lý (`nvm`, `fnm`, `volta`, `asdf`, v.v.). Các kênh WhatsApp + Telegram yêu cầu Node, và đường dẫn của trình quản lý phiên bản có thể hỏng sau khi nâng cấp vì service không tải phần khởi tạo shell của bạn. Doctor đề nghị di chuyển sang bản cài đặt Node hệ thống khi có sẵn (Homebrew/apt/choco).

    Các service mới được cài đặt hoặc sửa vẫn giữ các gốc môi trường rõ ràng (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) và các thư mục user-bin ổn định, nhưng các thư mục dự phòng trình quản lý phiên bản được đoán chỉ được ghi vào PATH của service khi các thư mục đó tồn tại trên đĩa. Điều này giữ PATH supervisor được tạo khớp với cùng kiểm tra PATH tối thiểu mà doctor chạy sau đó.

  </Accordion>
  <Accordion title="18. Ghi cấu hình + siêu dữ liệu wizard">
    Doctor lưu mọi thay đổi cấu hình và đóng dấu siêu dữ liệu wizard để ghi lại lần chạy doctor.
  </Accordion>
  <Accordion title="19. Mẹo workspace (sao lưu + hệ thống bộ nhớ)">
    Doctor đề xuất một hệ thống bộ nhớ workspace khi còn thiếu và in mẹo sao lưu nếu workspace chưa nằm trong git.

    Xem [/concepts/agent-workspace](/vi/concepts/agent-workspace) để có hướng dẫn đầy đủ về cấu trúc workspace và sao lưu git (khuyến nghị GitHub hoặc GitLab riêng tư).

  </Accordion>
</AccordionGroup>

## Liên quan

- [Runbook Gateway](/vi/gateway)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
