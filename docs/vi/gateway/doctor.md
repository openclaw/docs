---
read_when:
    - Thêm hoặc sửa đổi các bản di trú của doctor
    - Đưa vào các thay đổi cấu hình gây phá vỡ tương thích
sidebarTitle: Doctor
summary: 'Lệnh doctor: kiểm tra tình trạng, chuyển đổi cấu hình và các bước sửa chữa'
title: Chẩn đoán
x-i18n:
    generated_at: "2026-04-30T16:28:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89150fe2b2848f1f168b42ca6b240bc0e6a0edee4f1bcad7f79d297face9c95e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` là công cụ sửa chữa + di chuyển dữ liệu cho OpenClaw. Công cụ này sửa cấu hình/trạng thái cũ, kiểm tra sức khỏe và cung cấp các bước sửa chữa có thể thực hiện.

## Bắt đầu nhanh

```bash
openclaw doctor
```

### Chế độ headless và tự động hóa

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Chấp nhận mặc định mà không nhắc hỏi (bao gồm các bước sửa chữa khởi động lại/dịch vụ/sandbox khi áp dụng).

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

    Chạy không có lời nhắc và chỉ áp dụng các di chuyển dữ liệu an toàn (chuẩn hóa cấu hình + di chuyển trạng thái trên đĩa). Bỏ qua các hành động khởi động lại/dịch vụ/sandbox cần xác nhận của con người. Các di chuyển trạng thái cũ tự động chạy khi được phát hiện.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Quét các dịch vụ hệ thống để tìm các bản cài đặt Gateway bổ sung (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Nếu bạn muốn xem lại thay đổi trước khi ghi, hãy mở tệp cấu hình trước:

```bash
cat ~/.openclaw/openclaw.json
```

## Công cụ này làm gì (tóm tắt)

<AccordionGroup>
  <Accordion title="Sức khỏe, UI và cập nhật">
    - Cập nhật trước khi chạy tùy chọn cho các bản cài đặt git (chỉ tương tác).
    - Kiểm tra độ mới của giao thức UI (xây dựng lại Control UI khi schema giao thức mới hơn).
    - Kiểm tra sức khỏe + lời nhắc khởi động lại.
    - Tóm tắt trạng thái Skills (đủ điều kiện/thiếu/bị chặn) và trạng thái plugin.

  </Accordion>
  <Accordion title="Cấu hình và di chuyển dữ liệu">
    - Chuẩn hóa cấu hình cho các giá trị cũ.
    - Di chuyển cấu hình Talk từ các trường `talk.*` phẳng cũ sang `talk.provider` + `talk.providers.<provider>`.
    - Kiểm tra di chuyển trình duyệt cho cấu hình tiện ích Chrome cũ và mức sẵn sàng Chrome MCP.
    - Cảnh báo ghi đè provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Cảnh báo che khuất OAuth Codex (`models.providers.openai-codex`).
    - Kiểm tra điều kiện tiên quyết TLS OAuth cho hồ sơ OAuth OpenAI Codex.
    - Di chuyển trạng thái cũ trên đĩa (sessions/thư mục agent/xác thực WhatsApp).
    - Di chuyển khóa hợp đồng manifest plugin cũ (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Di chuyển kho Cron cũ (`jobId`, `schedule.cron`, các trường delivery/payload cấp cao nhất, payload `provider`, các job fallback Webhook `notify: true` đơn giản).
    - Di chuyển runtime-policy agent cũ sang `agents.defaults.agentRuntime` và `agents.list[].agentRuntime`.
    - Dọn dẹp cấu hình plugin cũ khi plugin được bật; khi `plugins.enabled=false`, các tham chiếu plugin cũ được xem là cấu hình cô lập không hoạt động và được giữ nguyên.

  </Accordion>
  <Accordion title="Trạng thái và tính toàn vẹn">
    - Kiểm tra tệp khóa phiên và dọn dẹp khóa cũ.
    - Sửa bản ghi phiên cho các nhánh viết lại prompt bị trùng lặp do các bản dựng 2026.4.24 bị ảnh hưởng tạo ra.
    - Phát hiện tombstone phục hồi-khởi động lại subagent bị kẹt, có hỗ trợ `--fix` để xóa các cờ phục hồi bị hủy cũ để startup không tiếp tục xem tiến trình con là đã bị hủy khởi động lại.
    - Kiểm tra tính toàn vẹn trạng thái và quyền (sessions, transcripts, thư mục state).
    - Kiểm tra quyền tệp cấu hình (chmod 600) khi chạy cục bộ.
    - Sức khỏe xác thực mô hình: kiểm tra OAuth hết hạn, có thể làm mới token sắp hết hạn và báo cáo trạng thái cooldown/bị vô hiệu hóa của auth-profile.
    - Phát hiện thư mục workspace bổ sung (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, dịch vụ và supervisor">
    - Sửa image sandbox khi sandboxing được bật.
    - Di chuyển dịch vụ cũ và phát hiện Gateway bổ sung.
    - Di chuyển trạng thái cũ của kênh Matrix (ở chế độ `--fix` / `--repair`).
    - Kiểm tra runtime Gateway (dịch vụ đã cài nhưng không chạy; nhãn launchd đã lưu cache).
    - Cảnh báo trạng thái kênh (thăm dò từ Gateway đang chạy).
    - Kiểm tra cấu hình supervisor (launchd/systemd/schtasks) với tùy chọn sửa chữa.
    - Dọn dẹp môi trường proxy nhúng cho các dịch vụ Gateway đã ghi lại giá trị shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` trong lúc cài đặt hoặc cập nhật.
    - Kiểm tra phương pháp hay nhất cho runtime Gateway (Node so với Bun, đường dẫn trình quản lý phiên bản).
    - Chẩn đoán xung đột cổng Gateway (mặc định `18789`).

  </Accordion>
  <Accordion title="Xác thực, bảo mật và ghép đôi">
    - Cảnh báo bảo mật cho chính sách DM mở.
    - Kiểm tra xác thực Gateway cho chế độ token cục bộ (đề xuất tạo token khi không có nguồn token; không ghi đè cấu hình token SecretRef).
    - Phát hiện sự cố ghép đôi thiết bị (yêu cầu ghép đôi lần đầu đang chờ, nâng cấp vai trò/phạm vi đang chờ, drift cache device-token cục bộ cũ và drift xác thực bản ghi đã ghép đôi).

  </Accordion>
  <Accordion title="Workspace và shell">
    - Kiểm tra systemd linger trên Linux.
    - Kiểm tra kích thước tệp bootstrap workspace (cảnh báo bị cắt/gần giới hạn cho tệp ngữ cảnh).
    - Kiểm tra trạng thái completion của shell và tự động cài đặt/nâng cấp.
    - Kiểm tra mức sẵn sàng của provider embedding tìm kiếm bộ nhớ (mô hình cục bộ, khóa API từ xa hoặc binary QMD).
    - Kiểm tra cài đặt từ mã nguồn (pnpm workspace không khớp, thiếu asset UI, thiếu binary tsx).
    - Ghi cấu hình đã cập nhật + metadata wizard.

  </Accordion>
</AccordionGroup>

## Điền bù và đặt lại UI Dreams

Cảnh Dreams trong Control UI bao gồm các hành động **Backfill**, **Reset** và **Clear Grounded** cho quy trình grounded dreaming. Các hành động này dùng các phương thức RPC kiểu doctor của Gateway, nhưng chúng **không** phải là một phần của sửa chữa/di chuyển dữ liệu CLI `openclaw doctor`.

Các hành động này làm gì:

- **Backfill** quét các tệp lịch sử `memory/YYYY-MM-DD.md` trong workspace đang hoạt động, chạy lượt nhật ký REM grounded và ghi các mục điền bù có thể đảo ngược vào `DREAMS.md`.
- **Reset** chỉ xóa các mục nhật ký điền bù được đánh dấu đó khỏi `DREAMS.md`.
- **Clear Grounded** chỉ xóa các mục ngắn hạn chỉ-grounded đã stage đến từ phát lại lịch sử và chưa tích lũy recall trực tiếp hoặc hỗ trợ hằng ngày.

Các hành động này tự thân **không** làm gì:

- chúng không chỉnh sửa `MEMORY.md`
- chúng không chạy đầy đủ các di chuyển doctor
- chúng không tự động stage các ứng viên grounded vào kho promotion ngắn hạn trực tiếp trừ khi bạn chạy rõ ràng đường dẫn CLI đã stage trước

Nếu bạn muốn phát lại lịch sử grounded ảnh hưởng đến lane deep promotion thông thường, hãy dùng luồng CLI thay thế:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Lệnh đó stage các ứng viên bền vững grounded vào kho dreaming ngắn hạn trong khi giữ `DREAMS.md` làm bề mặt xem xét.

## Hành vi chi tiết và lý do

<AccordionGroup>
  <Accordion title="0. Cập nhật tùy chọn (bản cài đặt git)">
    Nếu đây là một git checkout và doctor đang chạy tương tác, công cụ sẽ đề xuất cập nhật (fetch/rebase/build) trước khi chạy doctor.
  </Accordion>
  <Accordion title="1. Chuẩn hóa cấu hình">
    Nếu cấu hình chứa các dạng giá trị cũ (ví dụ `messages.ackReaction` không có ghi đè theo kênh), doctor sẽ chuẩn hóa chúng vào schema hiện tại.

    Điều đó bao gồm các trường phẳng Talk cũ. Cấu hình Talk công khai hiện tại là `talk.provider` + `talk.providers.<provider>`. Doctor ghi lại các dạng `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` cũ vào map provider.

  </Accordion>
  <Accordion title="2. Di chuyển khóa cấu hình cũ">
    Khi cấu hình chứa các khóa không còn được dùng, các lệnh khác sẽ từ chối chạy và yêu cầu bạn chạy `openclaw doctor`.

    Doctor sẽ:

    - Giải thích những khóa cũ nào đã được tìm thấy.
    - Hiển thị di chuyển đã áp dụng.
    - Ghi lại `~/.openclaw/openclaw.json` với schema đã cập nhật.

    Gateway cũng tự động chạy các di chuyển doctor khi startup nếu phát hiện định dạng cấu hình cũ, nên cấu hình cũ được sửa mà không cần can thiệp thủ công. Di chuyển kho job Cron được xử lý bởi `openclaw doctor --fix`.

    Các di chuyển hiện tại:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → top-level `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - legacy `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` and `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` and `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` and `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` and `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Với các kênh có `accounts` được đặt tên nhưng vẫn còn các giá trị kênh cấp cao nhất kiểu tài khoản đơn lẻ, di chuyển các giá trị theo phạm vi tài khoản đó vào tài khoản được nâng cấp đã chọn cho kênh đó (`accounts.default` cho hầu hết kênh; Matrix có thể giữ một đích được đặt tên/mặc định khớp hiện có)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - remove `agents.defaults.llm`; use `models.providers.<id>.timeoutSeconds` for slow provider/model timeouts
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - remove `browser.relayBindHost` (legacy extension relay setting)
    - legacy `models.providers.*.api: "openai"` → `"openai-completions"` (gateway startup also skips providers whose `api` is set to a future or unknown enum value rather than failing closed)

    Cảnh báo của doctor cũng bao gồm hướng dẫn account-default cho các kênh nhiều tài khoản:

    - Nếu hai hoặc nhiều mục `channels.<channel>.accounts` được cấu hình mà không có `channels.<channel>.defaultAccount` hoặc `accounts.default`, doctor cảnh báo rằng định tuyến dự phòng có thể chọn một tài khoản ngoài dự kiến.
    - Nếu `channels.<channel>.defaultAccount` được đặt thành một ID tài khoản không xác định, doctor cảnh báo và liệt kê các ID tài khoản đã cấu hình.

  </Accordion>
  <Accordion title="2b. Ghi đè nhà cung cấp OpenCode">
    Nếu bạn đã thêm thủ công `models.providers.opencode`, `opencode-zen`, hoặc `opencode-go`, nó sẽ ghi đè catalog OpenCode tích hợp sẵn từ `@mariozechner/pi-ai`. Điều đó có thể buộc model dùng sai API hoặc đưa chi phí về 0. Doctor cảnh báo để bạn có thể gỡ phần ghi đè và khôi phục định tuyến API + chi phí theo từng model.
  </Accordion>
  <Accordion title="2c. Di chuyển trình duyệt và mức sẵn sàng của Chrome MCP">
    Nếu cấu hình trình duyệt của bạn vẫn trỏ tới đường dẫn tiện ích Chrome đã bị loại bỏ, doctor chuẩn hóa nó sang mô hình gắn Chrome MCP host-local hiện tại:

    - `browser.profiles.*.driver: "extension"` trở thành `"existing-session"`
    - `browser.relayBindHost` bị xóa

    Doctor cũng kiểm tra đường dẫn Chrome MCP host-local khi bạn dùng `defaultProfile: "user"` hoặc một hồ sơ `existing-session` đã cấu hình:

    - kiểm tra liệu Google Chrome có được cài trên cùng host cho các hồ sơ tự động kết nối mặc định hay không
    - kiểm tra phiên bản Chrome đã phát hiện và cảnh báo khi phiên bản đó thấp hơn Chrome 144
    - nhắc bạn bật gỡ lỗi từ xa trong trang inspect của trình duyệt (ví dụ `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, hoặc `edge://inspect/#remote-debugging`)

    Doctor không thể bật thiết lập phía Chrome giúp bạn. Chrome MCP host-local vẫn yêu cầu:

    - một trình duyệt dựa trên Chromium 144+ trên host gateway/node
    - trình duyệt chạy cục bộ
    - gỡ lỗi từ xa đã bật trong trình duyệt đó
    - phê duyệt lời nhắc đồng ý gắn lần đầu trong trình duyệt

    Mức sẵn sàng ở đây chỉ nói về các điều kiện tiên quyết để gắn cục bộ. Existing-session giữ các giới hạn tuyến Chrome MCP hiện tại; các tuyến nâng cao như `responsebody`, xuất PDF, chặn tải xuống và thao tác hàng loạt vẫn cần trình duyệt được quản lý hoặc hồ sơ CDP thô.

    Kiểm tra này **không** áp dụng cho Docker, sandbox, remote-browser, hoặc các luồng headless khác. Các luồng đó tiếp tục dùng CDP thô.

  </Accordion>
  <Accordion title="2d. Điều kiện tiên quyết OAuth TLS">
    Khi một hồ sơ OpenAI Codex OAuth được cấu hình, doctor thăm dò endpoint ủy quyền OpenAI để xác minh rằng stack TLS Node/OpenSSL cục bộ có thể xác thực chuỗi chứng chỉ. Nếu lần thăm dò thất bại với lỗi chứng chỉ (ví dụ `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, chứng chỉ hết hạn, hoặc chứng chỉ tự ký), doctor in hướng dẫn sửa lỗi theo từng nền tảng. Trên macOS với Node từ Homebrew, cách sửa thường là `brew postinstall ca-certificates`. Với `--deep`, lần thăm dò chạy ngay cả khi gateway khỏe mạnh.
  </Accordion>
  <Accordion title="2e. Ghi đè nhà cung cấp Codex OAuth">
    Nếu trước đây bạn đã thêm các thiết lập transport OpenAI cũ dưới `models.providers.openai-codex`, chúng có thể che khuất đường dẫn nhà cung cấp Codex OAuth tích hợp sẵn mà các bản phát hành mới hơn tự động dùng. Doctor cảnh báo khi thấy các thiết lập transport cũ đó cùng với Codex OAuth để bạn có thể gỡ hoặc viết lại phần ghi đè transport lỗi thời và lấy lại hành vi định tuyến/dự phòng tích hợp sẵn. Proxy tùy chỉnh và các ghi đè chỉ-header vẫn được hỗ trợ và không kích hoạt cảnh báo này.
  </Accordion>
  <Accordion title="2f. Cảnh báo tuyến Plugin Codex">
    Khi Plugin Codex đi kèm được bật, doctor cũng kiểm tra liệu các tham chiếu model chính `openai-codex/*` còn được phân giải qua PI runner mặc định hay không. Kết hợp đó hợp lệ khi bạn muốn xác thực Codex OAuth/subscription qua PI, nhưng dễ bị nhầm với harness app-server Codex gốc. Doctor cảnh báo và trỏ tới hình dạng app-server rõ ràng: `openai/*` cộng với `agentRuntime.id: "codex"` hoặc `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor không tự động sửa điều này vì cả hai tuyến đều hợp lệ:

    - `openai-codex/*` + PI nghĩa là "dùng xác thực Codex OAuth/subscription qua runner OpenClaw thông thường."
    - `openai/*` + `runtime: "codex"` nghĩa là "chạy lượt nhúng qua app-server Codex gốc."
    - `/codex ...` nghĩa là "điều khiển hoặc liên kết một cuộc hội thoại Codex gốc từ chat."
    - `/acp ...` hoặc `runtime: "acp"` nghĩa là "dùng adapter ACP/acpx bên ngoài."

    Nếu cảnh báo xuất hiện, hãy chọn tuyến bạn dự định dùng và chỉnh sửa cấu hình thủ công. Giữ nguyên cảnh báo khi PI Codex OAuth là chủ đích.

  </Accordion>
  <Accordion title="3. Di chuyển trạng thái cũ (bố cục đĩa)">
    Doctor có thể di chuyển các bố cục cũ trên đĩa vào cấu trúc hiện tại:

    - Kho session + transcript:
      - từ `~/.openclaw/sessions/` sang `~/.openclaw/agents/<agentId>/sessions/`
    - Thư mục agent:
      - từ `~/.openclaw/agent/` sang `~/.openclaw/agents/<agentId>/agent/`
    - Trạng thái xác thực WhatsApp (Baileys):
      - từ `~/.openclaw/credentials/*.json` cũ (ngoại trừ `oauth.json`)
      - sang `~/.openclaw/credentials/whatsapp/<accountId>/...` (id tài khoản mặc định: `default`)

    Các lần di chuyển này là nỗ lực tối đa và có tính lũy đẳng; doctor sẽ phát cảnh báo khi để lại bất kỳ thư mục cũ nào làm bản sao lưu. Gateway/CLI cũng tự động di chuyển session cũ + thư mục agent khi khởi động để lịch sử/xác thực/model nằm trong đường dẫn theo từng agent mà không cần chạy doctor thủ công. Xác thực WhatsApp được cố ý chỉ di chuyển qua `openclaw doctor`. Việc chuẩn hóa nhà cung cấp/bản đồ nhà cung cấp talk hiện so sánh bằng bình đẳng cấu trúc, nên các diff chỉ do thứ tự khóa không còn kích hoạt lặp lại các thay đổi `doctor --fix` không làm gì.

  </Accordion>
  <Accordion title="3a. Di chuyển manifest Plugin cũ">
    Doctor quét tất cả manifest Plugin đã cài để tìm các khóa capability cấp cao nhất đã lỗi thời (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Khi tìm thấy, nó đề nghị chuyển chúng vào đối tượng `contracts` và viết lại file manifest tại chỗ. Việc di chuyển này có tính lũy đẳng; nếu khóa `contracts` đã có cùng giá trị, khóa cũ sẽ bị xóa mà không nhân đôi dữ liệu.
  </Accordion>
  <Accordion title="3b. Di chuyển kho Cron cũ">
    Doctor cũng kiểm tra kho công việc cron (`~/.openclaw/cron/jobs.json` theo mặc định, hoặc `cron.store` khi được ghi đè) để tìm các hình dạng công việc cũ mà scheduler vẫn chấp nhận để tương thích.

    Các dọn dẹp cron hiện tại bao gồm:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - các trường payload cấp cao nhất (`message`, `model`, `thinking`, ...) → `payload`
    - các trường delivery cấp cao nhất (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias delivery `provider` trong payload → `delivery.channel` rõ ràng
    - công việc dự phòng webhook `notify: true` đơn giản kiểu cũ → `delivery.mode="webhook"` rõ ràng với `delivery.to=cron.webhook`

    Doctor chỉ tự động di chuyển các công việc `notify: true` khi có thể làm vậy mà không thay đổi hành vi. Nếu một công việc kết hợp dự phòng notify cũ với một chế độ delivery không phải webhook hiện có, doctor cảnh báo và để công việc đó cho rà soát thủ công.

  </Accordion>
  <Accordion title="3c. Dọn dẹp khóa session">
    Doctor quét mọi thư mục session agent để tìm các file khóa ghi cũ — các file bị bỏ lại khi một session thoát bất thường. Với mỗi file khóa tìm thấy, nó báo cáo: đường dẫn, PID, PID còn sống hay không, tuổi khóa, và khóa đó có được xem là cũ hay không (PID chết hoặc cũ hơn 30 phút). Ở chế độ `--fix` / `--repair`, nó tự động xóa các file khóa cũ; nếu không, nó in một ghi chú và hướng dẫn bạn chạy lại với `--fix`.
  </Accordion>
  <Accordion title="3d. Sửa nhánh transcript session">
    Doctor quét các file JSONL session agent để tìm hình dạng nhánh bị nhân đôi được tạo bởi lỗi viết lại transcript prompt ngày 2026.4.24: một lượt người dùng bị bỏ rơi có ngữ cảnh runtime nội bộ OpenClaw cộng với một nhánh anh em đang hoạt động chứa cùng prompt người dùng hiển thị. Ở chế độ `--fix` / `--repair`, doctor sao lưu từng file bị ảnh hưởng cạnh file gốc và viết lại transcript về nhánh đang hoạt động để lịch sử gateway và bộ đọc memory không còn thấy các lượt trùng lặp.
  </Accordion>
  <Accordion title="4. Kiểm tra tính toàn vẹn trạng thái (lưu session, định tuyến và an toàn)">
    Thư mục trạng thái là phần lõi vận hành. Nếu nó biến mất, bạn mất session, thông tin xác thực, log và cấu hình (trừ khi bạn có bản sao lưu ở nơi khác).

    Doctor kiểm tra:

    - **Thiếu thư mục trạng thái**: cảnh báo về mất trạng thái thảm họa, nhắc tạo lại thư mục và nhắc rằng nó không thể khôi phục dữ liệu đã mất.
    - **Quyền thư mục trạng thái**: xác minh khả năng ghi; đề nghị sửa quyền (và phát gợi ý `chown` khi phát hiện chủ sở hữu/nhóm không khớp).
    - **Thư mục trạng thái đồng bộ đám mây trên macOS**: cảnh báo khi trạng thái phân giải dưới iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) hoặc `~/Library/CloudStorage/...` vì các đường dẫn dựa trên đồng bộ có thể gây I/O chậm hơn và các cuộc đua khóa/đồng bộ.
    - **Thư mục trạng thái Linux trên SD hoặc eMMC**: cảnh báo khi trạng thái phân giải tới nguồn mount `mmcblk*`, vì I/O ngẫu nhiên dựa trên SD hoặc eMMC có thể chậm hơn và mòn nhanh hơn khi ghi session và thông tin xác thực.
    - **Thiếu thư mục session**: `sessions/` và thư mục kho session là bắt buộc để lưu lịch sử và tránh crash `ENOENT`.
    - **Transcript không khớp**: cảnh báo khi các mục session gần đây bị thiếu file transcript.
    - **Session chính "JSONL 1 dòng"**: gắn cờ khi transcript chính chỉ có một dòng (lịch sử không được tích lũy).
    - **Nhiều thư mục trạng thái**: cảnh báo khi có nhiều thư mục `~/.openclaw` tồn tại trên các thư mục home hoặc khi `OPENCLAW_STATE_DIR` trỏ tới nơi khác (lịch sử có thể bị chia giữa các bản cài).
    - **Nhắc nhở chế độ từ xa**: nếu `gateway.mode=remote`, doctor nhắc bạn chạy nó trên host từ xa (trạng thái nằm ở đó).
    - **Quyền file cấu hình**: cảnh báo nếu `~/.openclaw/openclaw.json` có thể đọc bởi group/world và đề nghị siết chặt thành `600`.

  </Accordion>
  <Accordion title="5. Tình trạng xác thực model (OAuth hết hạn)">
    Doctor kiểm tra các hồ sơ OAuth trong kho xác thực, cảnh báo khi token sắp hết hạn/đã hết hạn và có thể làm mới chúng khi an toàn. Nếu hồ sơ Anthropic OAuth/token đã cũ, nó đề xuất khóa API Anthropic hoặc đường dẫn setup-token Anthropic. Lời nhắc làm mới chỉ xuất hiện khi chạy tương tác (TTY); `--non-interactive` bỏ qua các lần thử làm mới.

    Khi làm mới OAuth thất bại vĩnh viễn (ví dụ `refresh_token_reused`, `invalid_grant`, hoặc nhà cung cấp yêu cầu bạn đăng nhập lại), doctor báo rằng cần xác thực lại và in lệnh `openclaw models auth login --provider ...` chính xác để chạy.

    Doctor cũng báo cáo các hồ sơ xác thực tạm thời không dùng được do:

    - thời gian chờ ngắn (giới hạn tốc độ/hết thời gian/lỗi xác thực)
    - vô hiệu hóa lâu hơn (lỗi thanh toán/tín dụng)

  </Accordion>
  <Accordion title="6. Xác thực model hooks">
    Nếu `hooks.gmail.model` được đặt, doctor xác thực tham chiếu model với catalog và allowlist, đồng thời cảnh báo khi nó không phân giải được hoặc không được phép.
  </Accordion>
  <Accordion title="7. Sửa chữa ảnh sandbox">
    Khi sandboxing được bật, doctor kiểm tra Docker images và đề nghị build hoặc chuyển sang các tên cũ nếu image hiện tại bị thiếu.
  </Accordion>
  <Accordion title="7b. Phụ thuộc runtime của Plugin đi kèm">
    Doctor chỉ xác minh các phụ thuộc runtime cho các Plugin đi kèm đang hoạt động trong cấu hình hiện tại hoặc được bật theo mặc định trong bundled manifest của chúng, ví dụ `plugins.entries.discord.enabled: true`, `channels.discord.enabled: true` cũ, `models.providers.*` đã cấu hình / tham chiếu model của agent, hoặc một Plugin đi kèm được bật mặc định nhưng không thuộc quyền sở hữu của provider. Nếu thiếu bất kỳ phụ thuộc nào, doctor báo cáo các package và cài đặt chúng ở chế độ `openclaw doctor --fix` / `openclaw doctor --repair`. Plugin bên ngoài vẫn dùng `openclaw plugins install` / `openclaw plugins update`; doctor không cài đặt phụ thuộc cho các đường dẫn Plugin tùy ý.

    Trong quá trình sửa chữa của doctor, các lượt cài đặt npm phụ thuộc runtime đi kèm báo cáo tiến trình spinner trong các phiên TTY và tiến trình theo dòng định kỳ trong đầu ra pipe/headless. Gateway và CLI cục bộ cũng có thể sửa chữa phụ thuộc runtime của Plugin đi kèm đang hoạt động theo yêu cầu trước khi import một Plugin đi kèm. Các lượt cài đặt này được giới hạn trong install root runtime của Plugin, chạy với scripts bị tắt, không ghi package lock, và được bảo vệ bằng lock trên install-root để các lần khởi động CLI hoặc Gateway đồng thời không mutate cùng cây `node_modules` cùng lúc.

  </Accordion>
  <Accordion title="8. Di chuyển dịch vụ Gateway và gợi ý dọn dẹp">
    Doctor phát hiện các dịch vụ gateway cũ (launchd/systemd/schtasks) và đề nghị gỡ bỏ chúng, rồi cài đặt dịch vụ OpenClaw bằng cổng gateway hiện tại. Nó cũng có thể quét các dịch vụ giống gateway bổ sung và in gợi ý dọn dẹp. Các dịch vụ gateway OpenClaw đặt tên theo profile được xem là thành phần hạng nhất và không bị gắn cờ là "extra."

    Trên Linux, nếu thiếu dịch vụ gateway cấp người dùng nhưng tồn tại một dịch vụ gateway OpenClaw cấp hệ thống, doctor không tự động cài đặt dịch vụ cấp người dùng thứ hai. Kiểm tra bằng `openclaw gateway status --deep` hoặc `openclaw doctor --deep`, sau đó gỡ bỏ bản trùng lặp hoặc đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một system supervisor sở hữu vòng đời gateway.

  </Accordion>
  <Accordion title="8b. Di chuyển Startup Matrix">
    Khi một tài khoản kênh Matrix có một lần di chuyển trạng thái legacy đang chờ hoặc có thể xử lý, doctor (ở chế độ `--fix` / `--repair`) tạo snapshot trước di chuyển rồi chạy các bước di chuyển best-effort: di chuyển trạng thái Matrix legacy và chuẩn bị trạng thái mã hóa legacy. Cả hai bước đều không gây lỗi nghiêm trọng; lỗi được ghi log và quá trình khởi động tiếp tục. Ở chế độ chỉ đọc (`openclaw doctor` không có `--fix`) kiểm tra này được bỏ qua hoàn toàn.
  </Accordion>
  <Accordion title="8c. Ghép đôi thiết bị và lệch xác thực">
    Doctor hiện kiểm tra trạng thái ghép đôi thiết bị như một phần của lượt kiểm tra sức khỏe thông thường.

    Nội dung được báo cáo:

    - yêu cầu ghép đôi lần đầu đang chờ
    - nâng cấp vai trò đang chờ cho các thiết bị đã ghép đôi
    - nâng cấp scope đang chờ cho các thiết bị đã ghép đôi
    - sửa chữa sai khớp public-key khi device id vẫn khớp nhưng danh tính thiết bị không còn khớp với bản ghi đã phê duyệt
    - bản ghi đã ghép đôi thiếu token đang hoạt động cho một vai trò đã phê duyệt
    - token đã ghép đôi có scope lệch khỏi baseline ghép đôi đã phê duyệt
    - mục device-token được cache cục bộ cho máy hiện tại có từ trước một lần xoay token phía gateway hoặc mang metadata scope cũ

    Doctor không tự phê duyệt yêu cầu ghép đôi hoặc tự xoay token thiết bị. Thay vào đó, nó in chính xác các bước tiếp theo:

    - kiểm tra yêu cầu đang chờ bằng `openclaw devices list`
    - phê duyệt đúng yêu cầu bằng `openclaw devices approve <requestId>`
    - xoay token mới bằng `openclaw devices rotate --device <deviceId> --role <role>`
    - gỡ bỏ và phê duyệt lại một bản ghi cũ bằng `openclaw devices remove <deviceId>`

    Điều này khép lại lỗ hổng phổ biến "đã ghép đôi nhưng vẫn bị yêu cầu ghép đôi": doctor giờ phân biệt ghép đôi lần đầu với nâng cấp vai trò/scope đang chờ và với token cũ/lệch danh tính thiết bị.

  </Accordion>
  <Accordion title="9. Cảnh báo bảo mật">
    Doctor phát cảnh báo khi một provider mở cho DM mà không có allowlist, hoặc khi policy được cấu hình theo cách nguy hiểm.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Nếu đang chạy như một systemd user service, doctor bảo đảm lingering được bật để gateway vẫn hoạt động sau khi đăng xuất.
  </Accordion>
  <Accordion title="11. Trạng thái workspace (skills, Plugin, và thư mục legacy)">
    Doctor in tóm tắt trạng thái workspace cho agent mặc định:

    - **Trạng thái Skills**: đếm Skills đủ điều kiện, thiếu yêu cầu, và bị allowlist chặn.
    - **Thư mục workspace legacy**: cảnh báo khi `~/openclaw` hoặc các thư mục workspace legacy khác tồn tại cùng workspace hiện tại.
    - **Trạng thái Plugin**: đếm Plugin đã bật/đã tắt/bị lỗi; liệt kê plugin IDs cho mọi lỗi; báo cáo khả năng của bundle Plugin.
    - **Cảnh báo tương thích Plugin**: gắn cờ các Plugin có vấn đề tương thích với runtime hiện tại.
    - **Chẩn đoán Plugin**: hiển thị mọi cảnh báo hoặc lỗi lúc tải do plugin registry phát ra.

  </Accordion>
  <Accordion title="11b. Kích thước tệp bootstrap">
    Doctor kiểm tra xem các tệp bootstrap workspace (ví dụ `AGENTS.md`, `CLAUDE.md`, hoặc các tệp ngữ cảnh được chèn khác) có gần hoặc vượt quá ngân sách ký tự đã cấu hình hay không. Nó báo cáo số ký tự thô so với đã chèn theo từng tệp, tỷ lệ phần trăm bị cắt, nguyên nhân cắt (`max/file` hoặc `max/total`), và tổng ký tự đã chèn dưới dạng tỷ lệ của tổng ngân sách. Khi tệp bị cắt hoặc gần giới hạn, doctor in mẹo để tinh chỉnh `agents.defaults.bootstrapMaxChars` và `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Dọn dẹp Plugin kênh cũ">
    Khi `openclaw doctor --fix` gỡ bỏ một Plugin kênh bị thiếu, nó cũng gỡ bỏ cấu hình dangling theo phạm vi kênh đã tham chiếu Plugin đó: các mục `channels.<id>`, heartbeat targets đã đặt tên kênh, và các override `agents.*.models["<channel>/*"]`. Điều này ngăn các vòng lặp khởi động Gateway khi runtime của kênh đã biến mất nhưng cấu hình vẫn yêu cầu gateway bind tới nó.
  </Accordion>
  <Accordion title="11c. Hoàn tất shell">
    Doctor kiểm tra xem tab completion đã được cài đặt cho shell hiện tại (zsh, bash, fish, hoặc PowerShell) hay chưa:

    - Nếu shell profile dùng mẫu completion động chậm (`source <(openclaw completion ...)`), doctor nâng cấp nó lên biến thể tệp được cache nhanh hơn.
    - Nếu completion được cấu hình trong profile nhưng thiếu tệp cache, doctor tự động tạo lại cache.
    - Nếu chưa cấu hình completion, doctor nhắc cài đặt nó (chỉ ở chế độ tương tác; bị bỏ qua với `--non-interactive`).

    Chạy `openclaw completion --write-state` để tạo lại cache thủ công.

  </Accordion>
  <Accordion title="12. Kiểm tra xác thực Gateway (token cục bộ)">
    Doctor kiểm tra mức sẵn sàng xác thực token gateway cục bộ.

    - Nếu chế độ token cần token và không có nguồn token nào, doctor đề nghị tạo một token.
    - Nếu `gateway.auth.token` được SecretRef quản lý nhưng không khả dụng, doctor cảnh báo và không ghi đè nó bằng plaintext.
    - `openclaw doctor --generate-gateway-token` chỉ ép tạo khi không có SecretRef token nào được cấu hình.

  </Accordion>
  <Accordion title="12b. Sửa chữa chỉ đọc nhận biết SecretRef">
    Một số luồng sửa chữa cần kiểm tra thông tin xác thực đã cấu hình mà không làm suy yếu hành vi fail-fast runtime.

    - `openclaw doctor --fix` hiện dùng cùng mô hình tóm tắt SecretRef chỉ đọc như các lệnh nhóm trạng thái cho các sửa chữa cấu hình có mục tiêu.
    - Ví dụ: sửa chữa `allowFrom` / `groupAllowFrom` `@username` của Telegram cố dùng thông tin xác thực bot đã cấu hình khi có sẵn.
    - Nếu token bot Telegram được cấu hình qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại, doctor báo cáo rằng thông tin xác thực đã cấu hình-nhưng-không-khả-dụng và bỏ qua tự động phân giải thay vì crash hoặc báo nhầm token là thiếu.

  </Accordion>
  <Accordion title="13. Kiểm tra sức khỏe Gateway + khởi động lại">
    Doctor chạy kiểm tra sức khỏe và đề nghị khởi động lại gateway khi nó có vẻ không khỏe.
  </Accordion>
  <Accordion title="13b. Mức sẵn sàng tìm kiếm bộ nhớ">
    Doctor kiểm tra xem provider embedding tìm kiếm bộ nhớ đã cấu hình có sẵn sàng cho agent mặc định hay không. Hành vi phụ thuộc vào backend và provider đã cấu hình:

    - **QMD backend**: thăm dò xem binary `qmd` có khả dụng và có thể khởi động hay không. Nếu không, in hướng dẫn sửa, bao gồm package npm và tùy chọn đường dẫn binary thủ công.
    - **Provider cục bộ rõ ràng**: kiểm tra tệp model cục bộ hoặc URL model từ xa/có thể tải xuống được nhận diện. Nếu thiếu, đề xuất chuyển sang provider từ xa.
    - **Provider từ xa rõ ràng** (`openai`, `voyage`, v.v.): xác minh API key hiện diện trong môi trường hoặc auth store. In gợi ý sửa có thể hành động nếu thiếu.
    - **Provider tự động**: kiểm tra tính khả dụng của model cục bộ trước, rồi thử từng provider từ xa theo thứ tự auto-selection.

    Khi có kết quả thăm dò gateway được cache (gateway khỏe tại thời điểm kiểm tra), doctor đối chiếu kết quả đó với cấu hình mà CLI thấy được và ghi chú mọi sai lệch. Doctor không khởi động một embedding ping mới trên đường dẫn mặc định; hãy dùng lệnh trạng thái bộ nhớ sâu khi bạn muốn kiểm tra provider trực tiếp.

    Dùng `openclaw memory status --deep` để xác minh mức sẵn sàng embedding ở runtime.

  </Accordion>
  <Accordion title="14. Cảnh báo trạng thái kênh">
    Nếu gateway khỏe, doctor chạy thăm dò trạng thái kênh và báo cáo cảnh báo kèm các cách sửa được đề xuất.
  </Accordion>
  <Accordion title="15. Kiểm toán + sửa chữa cấu hình supervisor">
    Doctor kiểm tra cấu hình supervisor đã cài đặt (launchd/systemd/schtasks) để tìm các mặc định bị thiếu hoặc lỗi thời (ví dụ: phụ thuộc systemd network-online và độ trễ khởi động lại). Khi tìm thấy sai khớp, nó khuyến nghị cập nhật và có thể ghi lại tệp dịch vụ/task theo các mặc định hiện tại.

    Ghi chú:

    - `openclaw doctor` nhắc trước khi ghi lại cấu hình supervisor.
    - `openclaw doctor --yes` chấp nhận các lời nhắc sửa chữa mặc định.
    - `openclaw doctor --repair` áp dụng các bản sửa được khuyến nghị mà không nhắc.
    - `openclaw doctor --repair --force` ghi đè các cấu hình supervisor tùy chỉnh.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` giữ doctor ở chế độ chỉ đọc đối với vòng đời dịch vụ Gateway. Nó vẫn báo cáo tình trạng dịch vụ và chạy các sửa chữa không thuộc dịch vụ, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap dịch vụ, ghi lại cấu hình supervisor và dọn dẹp dịch vụ cũ vì một supervisor bên ngoài sở hữu vòng đời đó.
    - Trên Linux, doctor không ghi lại siêu dữ liệu lệnh/entrypoint khi unit Gateway systemd khớp đang hoạt động. Nó cũng bỏ qua các unit giống Gateway bổ sung không hoạt động và không phải legacy trong quá trình quét dịch vụ trùng lặp để các tệp dịch vụ đi kèm không tạo nhiễu khi dọn dẹp.
    - Nếu xác thực bằng token yêu cầu token và `gateway.auth.token` được quản lý bằng SecretRef, quá trình cài đặt/sửa chữa dịch vụ của doctor xác thực SecretRef nhưng không lưu các giá trị token dạng văn bản thuần đã phân giải vào siêu dữ liệu môi trường dịch vụ supervisor.
    - Doctor phát hiện các giá trị môi trường dịch vụ do `.env` được quản lý/SecretRef hậu thuẫn mà các bản cài đặt LaunchAgent, systemd hoặc Windows Scheduled Task cũ đã nhúng inline, rồi ghi lại siêu dữ liệu dịch vụ để các giá trị đó tải từ nguồn runtime thay vì định nghĩa supervisor.
    - Doctor phát hiện khi lệnh dịch vụ vẫn ghim `--port` cũ sau khi `gateway.port` thay đổi và ghi lại siêu dữ liệu dịch vụ sang cổng hiện tại.
    - Nếu xác thực bằng token yêu cầu token và SecretRef token đã cấu hình chưa phân giải được, doctor chặn đường dẫn cài đặt/sửa chữa bằng hướng dẫn có thể hành động.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, doctor chặn cài đặt/sửa chữa cho đến khi mode được đặt rõ ràng.
    - Với các unit Linux user-systemd, kiểm tra lệch token của doctor hiện bao gồm cả nguồn `Environment=` và `EnvironmentFile=` khi so sánh siêu dữ liệu xác thực dịch vụ.
    - Các sửa chữa dịch vụ của doctor từ chối ghi lại, dừng hoặc khởi động lại một dịch vụ Gateway từ binary OpenClaw cũ hơn khi cấu hình được ghi lần cuối bởi một phiên bản mới hơn. Xem [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Bạn luôn có thể buộc ghi lại toàn bộ bằng `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Runtime Gateway + chẩn đoán cổng">
    Doctor kiểm tra runtime của dịch vụ (PID, trạng thái thoát gần nhất) và cảnh báo khi dịch vụ đã được cài đặt nhưng thực tế không chạy. Nó cũng kiểm tra xung đột cổng trên cổng Gateway (mặc định `18789`) và báo cáo các nguyên nhân có khả năng xảy ra (Gateway đã chạy, đường hầm SSH).
  </Accordion>
  <Accordion title="17. Các phương pháp hay nhất cho runtime Gateway">
    Doctor cảnh báo khi dịch vụ Gateway chạy trên Bun hoặc đường dẫn Node do trình quản lý phiên bản quản lý (`nvm`, `fnm`, `volta`, `asdf`, v.v.). Các kênh WhatsApp + Telegram yêu cầu Node, và đường dẫn trình quản lý phiên bản có thể hỏng sau khi nâng cấp vì dịch vụ không tải shell init của bạn. Doctor đề xuất di chuyển sang bản cài đặt Node hệ thống khi có sẵn (Homebrew/apt/choco).

    Các dịch vụ mới được cài đặt hoặc sửa chữa giữ lại các gốc môi trường rõ ràng (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) và các thư mục user-bin ổn định, nhưng các thư mục dự phòng trình quản lý phiên bản được đoán chỉ được ghi vào PATH của dịch vụ khi các thư mục đó tồn tại trên đĩa. Điều này giữ cho PATH supervisor được tạo khớp với cùng kiểm tra PATH tối thiểu mà doctor chạy sau đó.

  </Accordion>
  <Accordion title="18. Ghi cấu hình + siêu dữ liệu trình hướng dẫn">
    Doctor lưu mọi thay đổi cấu hình và đóng dấu siêu dữ liệu trình hướng dẫn để ghi lại lần chạy doctor.
  </Accordion>
  <Accordion title="19. Mẹo workspace (sao lưu + hệ thống bộ nhớ)">
    Doctor đề xuất một hệ thống bộ nhớ workspace khi thiếu và in mẹo sao lưu nếu workspace chưa nằm trong git.

    Xem [/concepts/agent-workspace](/vi/concepts/agent-workspace) để có hướng dẫn đầy đủ về cấu trúc workspace và sao lưu git (khuyến nghị GitHub hoặc GitLab riêng tư).

  </Accordion>
</AccordionGroup>

## Liên quan

- [Runbook Gateway](/vi/gateway)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
