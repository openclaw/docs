---
read_when:
    - Thêm hoặc sửa đổi các bản di trú của lệnh doctor
    - Đưa vào các thay đổi cấu hình phá vỡ tương thích
sidebarTitle: Doctor
summary: 'Lệnh doctor: kiểm tra tình trạng, di chuyển cấu hình và các bước sửa chữa'
title: Công cụ chẩn đoán
x-i18n:
    generated_at: "2026-05-03T10:36:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20b2cb3c3cd88e01050cb285a08a020603642439bd35668b7414360801fc03ff
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

    Áp dụng các sửa chữa được khuyến nghị mà không nhắc hỏi (sửa chữa + khởi động lại ở những nơi an toàn).

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

    Quét dịch vụ hệ thống để tìm các bản cài đặt gateway bổ sung (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Nếu bạn muốn xem lại thay đổi trước khi ghi, hãy mở tệp cấu hình trước:

```bash
cat ~/.openclaw/openclaw.json
```

## Công cụ làm gì (tóm tắt)

<AccordionGroup>
  <Accordion title="Sức khỏe, UI và bản cập nhật">
    - Cập nhật pre-flight tùy chọn cho bản cài đặt git (chỉ tương tác).
    - Kiểm tra độ mới của giao thức UI (xây dựng lại Control UI khi schema giao thức mới hơn).
    - Kiểm tra sức khỏe + lời nhắc khởi động lại.
    - Tóm tắt trạng thái Skills (đủ điều kiện/thiếu/bị chặn) và trạng thái Plugin.

  </Accordion>
  <Accordion title="Cấu hình và di chuyển dữ liệu">
    - Chuẩn hóa cấu hình cho các giá trị cũ.
    - Di chuyển cấu hình talk từ các trường phẳng `talk.*` cũ sang `talk.provider` + `talk.providers.<provider>`.
    - Kiểm tra di chuyển trình duyệt cho cấu hình Chrome extension cũ và mức sẵn sàng Chrome MCP.
    - Cảnh báo ghi đè provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Cảnh báo che khuất OAuth của Codex (`models.providers.openai-codex`).
    - Kiểm tra điều kiện tiên quyết OAuth TLS cho hồ sơ OpenAI Codex OAuth.
    - Cảnh báo allowlist Plugin/công cụ khi `plugins.allow` bị hạn chế nhưng chính sách công cụ vẫn yêu cầu ký tự đại diện hoặc công cụ do Plugin sở hữu.
    - Di chuyển trạng thái cũ trên đĩa (phiên/thư mục agent/xác thực WhatsApp).
    - Di chuyển khóa hợp đồng manifest Plugin cũ (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Di chuyển kho cron cũ (`jobId`, `schedule.cron`, các trường delivery/payload cấp cao nhất, payload `provider`, các tác vụ webhook dự phòng đơn giản `notify: true`).
    - Di chuyển runtime-policy agent cũ sang `agents.defaults.agentRuntime` và `agents.list[].agentRuntime`.
    - Dọn dẹp cấu hình Plugin cũ khi Plugin được bật; khi `plugins.enabled=false`, các tham chiếu Plugin cũ được coi là cấu hình cách ly bất hoạt và được giữ lại.

  </Accordion>
  <Accordion title="Trạng thái và tính toàn vẹn">
    - Kiểm tra tệp khóa phiên và dọn dẹp khóa cũ.
    - Sửa chữa transcript phiên cho các nhánh prompt-rewrite trùng lặp do các bản build 2026.4.24 bị ảnh hưởng tạo ra.
    - Phát hiện tombstone phục hồi khởi động lại của subagent bị kẹt, có hỗ trợ `--fix` để xóa các cờ phục hồi đã hủy cũ để quá trình khởi động không tiếp tục coi tiến trình con là đã bị hủy khi khởi động lại.
    - Kiểm tra tính toàn vẹn trạng thái và quyền (phiên, transcript, thư mục trạng thái).
    - Kiểm tra quyền tệp cấu hình (chmod 600) khi chạy cục bộ.
    - Sức khỏe xác thực mô hình: kiểm tra OAuth hết hạn, có thể làm mới token sắp hết hạn và báo cáo trạng thái cooldown/vô hiệu hóa của auth-profile.
    - Phát hiện thư mục workspace bổ sung (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, dịch vụ và trình giám sát">
    - Sửa chữa ảnh sandbox khi sandboxing được bật.
    - Di chuyển dịch vụ cũ và phát hiện gateway bổ sung.
    - Di chuyển trạng thái cũ của kênh Matrix (ở chế độ `--fix` / `--repair`).
    - Kiểm tra runtime Gateway (dịch vụ đã cài đặt nhưng không chạy; nhãn launchd được lưu trong bộ nhớ đệm).
    - Cảnh báo trạng thái kênh (được thăm dò từ gateway đang chạy).
    - Kiểm tra cấu hình trình giám sát (launchd/systemd/schtasks) với tùy chọn sửa chữa.
    - Dọn dẹp môi trường proxy nhúng cho các dịch vụ gateway đã ghi lại các giá trị shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` trong quá trình cài đặt hoặc cập nhật.
    - Kiểm tra thực hành tốt nhất cho runtime Gateway (Node so với Bun, đường dẫn trình quản lý phiên bản).
    - Chẩn đoán xung đột cổng Gateway (mặc định `18789`).

  </Accordion>
  <Accordion title="Xác thực, bảo mật và ghép đôi">
    - Cảnh báo bảo mật cho chính sách DM mở.
    - Kiểm tra xác thực Gateway cho chế độ token cục bộ (đề xuất tạo token khi không có nguồn token; không ghi đè cấu hình SecretRef của token).
    - Phát hiện sự cố ghép đôi thiết bị (yêu cầu ghép đôi lần đầu đang chờ, nâng cấp vai trò/phạm vi đang chờ, sai lệch bộ nhớ đệm token thiết bị cục bộ đã cũ, và sai lệch xác thực bản ghi đã ghép đôi).

  </Accordion>
  <Accordion title="Không gian làm việc và shell">
    - Kiểm tra systemd linger trên Linux.
    - Kiểm tra kích thước tệp bootstrap không gian làm việc (cảnh báo bị cắt ngắn/gần giới hạn cho các tệp ngữ cảnh).
    - Kiểm tra mức sẵn sàng của Skills cho agent mặc định; báo cáo các skill được phép nhưng thiếu bin, env, cấu hình hoặc yêu cầu hệ điều hành, và `--fix` có thể tắt các skill không khả dụng trong `skills.entries`.
    - Kiểm tra trạng thái shell completion và tự động cài đặt/nâng cấp.
    - Kiểm tra mức sẵn sàng của nhà cung cấp embedding tìm kiếm bộ nhớ (mô hình cục bộ, khóa API từ xa hoặc binary QMD).
    - Kiểm tra bản cài đặt từ mã nguồn (pnpm workspace không khớp, thiếu tài sản UI, thiếu binary tsx).
    - Ghi cấu hình đã cập nhật + siêu dữ liệu wizard.

  </Accordion>
</AccordionGroup>

## Điền bù và đặt lại giao diện người dùng Dreams

Cảnh Dreams trong Control UI bao gồm các hành động **Điền bù**, **Đặt lại**, và **Xóa mục có căn cứ** cho quy trình dreaming có căn cứ. Các hành động này dùng những phương thức RPC kiểu doctor của gateway, nhưng chúng **không** phải là một phần của sửa chữa/di chuyển `openclaw doctor` trong CLI.

Những việc chúng làm:

- **Điền bù** quét các tệp lịch sử `memory/YYYY-MM-DD.md` trong không gian làm việc đang hoạt động, chạy lượt nhật ký REM có căn cứ, và ghi các mục điền bù có thể đảo ngược vào `DREAMS.md`.
- **Đặt lại** chỉ xóa các mục nhật ký điền bù đã đánh dấu đó khỏi `DREAMS.md`.
- **Xóa mục có căn cứ** chỉ xóa các mục ngắn hạn chỉ có căn cứ đã được đưa vào vùng staging, đến từ phát lại lịch sử và chưa tích lũy thu hồi trực tiếp hoặc hỗ trợ hằng ngày.

Những việc chúng **không** tự làm:

- chúng không chỉnh sửa `MEMORY.md`
- chúng không chạy đầy đủ các di chuyển doctor
- chúng không tự động đưa các ứng viên có căn cứ vào kho thăng hạng ngắn hạn trực tiếp trừ khi bạn chạy rõ ràng đường dẫn CLI có staging trước

Nếu bạn muốn phát lại lịch sử có căn cứ ảnh hưởng đến làn thăng hạng sâu thông thường, hãy dùng luồng CLI thay vào đó:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Lệnh đó đưa các ứng viên bền vững có căn cứ vào kho dreaming ngắn hạn trong khi vẫn giữ `DREAMS.md` làm bề mặt đánh giá.

## Hành vi chi tiết và lý do

<AccordionGroup>
  <Accordion title="0. Cập nhật tùy chọn (bản cài đặt git)">
    Nếu đây là một git checkout và doctor đang chạy tương tác, nó sẽ đề xuất cập nhật (fetch/rebase/build) trước khi chạy doctor.
  </Accordion>
  <Accordion title="1. Chuẩn hóa cấu hình">
    Nếu cấu hình chứa các dạng giá trị cũ (ví dụ `messages.ackReaction` không có ghi đè riêng theo kênh), doctor sẽ chuẩn hóa chúng vào schema hiện tại.

    Điều đó bao gồm các trường phẳng Talk cũ. Cấu hình Talk công khai hiện tại là `talk.provider` + `talk.providers.<provider>`. Doctor ghi lại các dạng `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` cũ vào bản đồ nhà cung cấp.

    Doctor cũng cảnh báo khi `plugins.allow` không rỗng và chính sách công cụ dùng
    ký tự đại diện hoặc mục công cụ thuộc sở hữu Plugin. `tools.allow: ["*"]` chỉ khớp với các công cụ
    từ các plugin thực sự tải; nó không bỏ qua allowlist Plugin độc quyền.

  </Accordion>
  <Accordion title="2. Di chuyển khóa cấu hình cũ">
    Khi cấu hình chứa các khóa không còn dùng nữa, các lệnh khác sẽ từ chối chạy và yêu cầu bạn chạy `openclaw doctor`.

    Doctor sẽ:

    - Giải thích những khóa cũ nào đã được tìm thấy.
    - Hiển thị quá trình di chuyển đã áp dụng.
    - Ghi lại `~/.openclaw/openclaw.json` với schema đã cập nhật.

    Gateway cũng tự động chạy các di chuyển doctor khi khởi động nếu phát hiện định dạng cấu hình cũ, vì vậy cấu hình lỗi thời được sửa chữa mà không cần can thiệp thủ công. Di chuyển kho tác vụ Cron được xử lý bằng `openclaw doctor --fix`.

    Các di chuyển hiện tại:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - cấu hình kênh đã cấu hình thiếu chính sách trả lời hiển thị → `messages.groupChat.visibleReplies: "message_tool"`
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
    - Với các kênh có `accounts` được đặt tên nhưng vẫn còn các giá trị kênh cấp cao nhất kiểu một tài khoản, hãy chuyển các giá trị theo phạm vi tài khoản đó vào tài khoản được nâng cấp đã chọn cho kênh đó (`accounts.default` cho hầu hết kênh; Matrix có thể giữ nguyên một đích được đặt tên/mặc định hiện có khớp)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - xóa `agents.defaults.llm`; dùng `models.providers.<id>.timeoutSeconds` cho thời gian chờ provider/model chậm
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - xóa `browser.relayBindHost` (thiết lập relay extension cũ)
    - `models.providers.*.api: "openai"` cũ → `"openai-completions"` (quá trình khởi động Gateway cũng bỏ qua các provider có `api` được đặt thành giá trị enum tương lai hoặc không xác định thay vì đóng lỗi)

    Cảnh báo của doctor cũng bao gồm hướng dẫn tài khoản mặc định cho kênh nhiều tài khoản:

    - Nếu hai hoặc nhiều mục `channels.<channel>.accounts` được cấu hình mà không có `channels.<channel>.defaultAccount` hoặc `accounts.default`, doctor cảnh báo rằng định tuyến dự phòng có thể chọn một tài khoản ngoài dự kiến.
    - Nếu `channels.<channel>.defaultAccount` được đặt thành ID tài khoản không xác định, doctor cảnh báo và liệt kê các ID tài khoản đã cấu hình.

  </Accordion>
  <Accordion title="2b. Ghi đè provider OpenCode">
    Nếu bạn đã thêm thủ công `models.providers.opencode`, `opencode-zen`, hoặc `opencode-go`, nó sẽ ghi đè danh mục OpenCode tích hợp từ `@mariozechner/pi-ai`. Điều đó có thể buộc model dùng sai API hoặc đưa chi phí về không. Doctor cảnh báo để bạn có thể xóa ghi đè và khôi phục định tuyến API + chi phí theo từng model.
  </Accordion>
  <Accordion title="2c. Di chuyển trình duyệt và mức sẵn sàng Chrome MCP">
    Nếu cấu hình trình duyệt của bạn vẫn trỏ tới đường dẫn Chrome extension đã bị xóa, doctor chuẩn hóa nó sang mô hình đính kèm Chrome MCP cục bộ trên host hiện tại:

    - `browser.profiles.*.driver: "extension"` trở thành `"existing-session"`
    - `browser.relayBindHost` bị xóa

    Doctor cũng kiểm tra đường dẫn Chrome MCP cục bộ trên host khi bạn dùng `defaultProfile: "user"` hoặc một hồ sơ `existing-session` đã cấu hình:

    - kiểm tra Google Chrome có được cài đặt trên cùng host cho các hồ sơ tự động kết nối mặc định hay không
    - kiểm tra phiên bản Chrome phát hiện được và cảnh báo khi thấp hơn Chrome 144
    - nhắc bạn bật gỡ lỗi từ xa trong trang kiểm tra của trình duyệt (ví dụ `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, hoặc `edge://inspect/#remote-debugging`)

    Doctor không thể bật thiết lập phía Chrome thay bạn. Chrome MCP cục bộ trên host vẫn yêu cầu:

    - trình duyệt dựa trên Chromium 144+ trên host gateway/node
    - trình duyệt đang chạy cục bộ
    - đã bật gỡ lỗi từ xa trong trình duyệt đó
    - chấp thuận lời nhắc đồng ý đính kèm đầu tiên trong trình duyệt

    Mức sẵn sàng ở đây chỉ nói về các điều kiện tiên quyết để đính kèm cục bộ. Existing-session giữ các giới hạn tuyến Chrome MCP hiện tại; các tuyến nâng cao như `responsebody`, xuất PDF, chặn tải xuống, và thao tác hàng loạt vẫn yêu cầu trình duyệt được quản lý hoặc hồ sơ CDP thô.

    Kiểm tra này **không** áp dụng cho Docker, sandbox, remote-browser, hoặc các luồng headless khác. Các luồng đó tiếp tục dùng CDP thô.

  </Accordion>
  <Accordion title="2d. Điều kiện tiên quyết OAuth TLS">
    Khi một hồ sơ OpenAI Codex OAuth được cấu hình, doctor thăm dò endpoint ủy quyền OpenAI để xác minh rằng ngăn xếp TLS Node/OpenSSL cục bộ có thể xác thực chuỗi chứng chỉ. Nếu thăm dò thất bại với lỗi chứng chỉ (ví dụ `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, chứng chỉ hết hạn, hoặc chứng chỉ tự ký), doctor in hướng dẫn sửa lỗi theo từng nền tảng. Trên macOS với Node từ Homebrew, cách sửa thường là `brew postinstall ca-certificates`. Với `--deep`, thăm dò vẫn chạy ngay cả khi gateway khỏe mạnh.
  </Accordion>
  <Accordion title="2e. Ghi đè provider Codex OAuth">
    Nếu trước đây bạn đã thêm các thiết lập truyền tải OpenAI cũ trong `models.providers.openai-codex`, chúng có thể che khuất đường dẫn provider Codex OAuth tích hợp mà các bản phát hành mới hơn tự động sử dụng. Doctor cảnh báo khi thấy các thiết lập truyền tải cũ đó đi kèm Codex OAuth để bạn có thể xóa hoặc viết lại ghi đè truyền tải đã lỗi thời và lấy lại hành vi định tuyến/dự phòng tích hợp. Proxy tùy chỉnh và ghi đè chỉ header vẫn được hỗ trợ và không kích hoạt cảnh báo này.
  </Accordion>
  <Accordion title="2f. Cảnh báo tuyến Plugin Codex">
    Khi Plugin Codex đi kèm được bật, doctor cũng kiểm tra xem các tham chiếu model chính `openai-codex/*` có còn phân giải qua PI runner mặc định hay không. Tổ hợp đó hợp lệ khi bạn muốn xác thực Codex OAuth/subscription thông qua PI, nhưng dễ bị nhầm với harness app-server Codex gốc. Doctor cảnh báo và trỏ tới dạng app-server tường minh: `openai/*` cộng với `agentRuntime.id: "codex"` hoặc `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor không tự động sửa điều này vì cả hai tuyến đều hợp lệ:

    - `openai-codex/*` + PI nghĩa là "dùng xác thực Codex OAuth/subscription thông qua runner OpenClaw bình thường."
    - `openai/*` + `agentRuntime.id: "codex"` nghĩa là "chạy lượt nhúng thông qua app-server Codex gốc."
    - `/codex ...` nghĩa là "điều khiển hoặc liên kết một cuộc trò chuyện Codex gốc từ chat."
    - `/acp ...` hoặc `runtime: "acp"` nghĩa là "dùng adapter ACP/acpx bên ngoài."

    Nếu cảnh báo xuất hiện, hãy chọn tuyến bạn định dùng và sửa cấu hình thủ công. Giữ nguyên cảnh báo khi PI Codex OAuth là chủ ý.

  </Accordion>
  <Accordion title="3. Di chuyển trạng thái cũ (bố cục đĩa)">
    Doctor có thể di chuyển các bố cục cũ trên đĩa sang cấu trúc hiện tại:

    - Kho phiên + bản ghi:
      - từ `~/.openclaw/sessions/` sang `~/.openclaw/agents/<agentId>/sessions/`
    - Thư mục tác nhân:
      - từ `~/.openclaw/agent/` sang `~/.openclaw/agents/<agentId>/agent/`
    - Trạng thái xác thực WhatsApp (Baileys):
      - từ `~/.openclaw/credentials/*.json` cũ (ngoại trừ `oauth.json`)
      - sang `~/.openclaw/credentials/whatsapp/<accountId>/...` (id tài khoản mặc định: `default`)

    Các lần di chuyển này theo nguyên tắc cố gắng tối đa và có tính lặp lại an toàn; doctor sẽ phát cảnh báo khi để lại bất kỳ thư mục cũ nào làm bản sao lưu. Gateway/CLI cũng tự động di chuyển kho phiên cũ + thư mục tác nhân khi khởi động để lịch sử/xác thực/model nằm trong đường dẫn theo từng tác nhân mà không cần chạy doctor thủ công. Xác thực WhatsApp được chủ ý chỉ di chuyển qua `openclaw doctor`. Việc chuẩn hóa provider/bản đồ provider của talk hiện so sánh bằng bình đẳng cấu trúc, nên các khác biệt chỉ do thứ tự khóa không còn kích hoạt lặp lại các thay đổi `doctor --fix` không có tác dụng.

  </Accordion>
  <Accordion title="3a. Di chuyển manifest Plugin cũ">
    Doctor quét tất cả manifest Plugin đã cài đặt để tìm các khóa khả năng cấp cao nhất đã ngừng dùng (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Khi tìm thấy, nó đề nghị chuyển chúng vào đối tượng `contracts` và ghi lại trực tiếp tệp manifest. Di chuyển này có tính lặp lại an toàn; nếu khóa `contracts` đã có cùng các giá trị, khóa cũ bị xóa mà không nhân đôi dữ liệu.
  </Accordion>
  <Accordion title="3b. Di chuyển kho cron cũ">
    Doctor cũng kiểm tra kho tác vụ cron (`~/.openclaw/cron/jobs.json` theo mặc định, hoặc `cron.store` khi bị ghi đè) để tìm các dạng tác vụ cũ mà bộ lập lịch vẫn chấp nhận vì tương thích.

    Các dọn dẹp cron hiện tại bao gồm:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - trường payload cấp cao nhất (`message`, `model`, `thinking`, ...) → `payload`
    - trường gửi cấp cao nhất (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - bí danh gửi `provider` của payload → `delivery.channel` tường minh
    - tác vụ dự phòng webhook `notify: true` cũ đơn giản → `delivery.mode="webhook"` tường minh với `delivery.to=cron.webhook`

    Doctor chỉ tự động di chuyển các tác vụ `notify: true` khi có thể làm vậy mà không thay đổi hành vi. Nếu một tác vụ kết hợp dự phòng notify cũ với một chế độ gửi không phải webhook hiện có, doctor cảnh báo và để tác vụ đó lại để xem xét thủ công.

    Trên Linux, doctor cũng cảnh báo khi crontab của người dùng vẫn gọi `~/.openclaw/bin/ensure-whatsapp.sh` cũ. Script cục bộ trên host đó không được OpenClaw hiện tại bảo trì và có thể ghi thông báo `Gateway inactive` sai vào `~/.openclaw/logs/whatsapp-health.log` khi cron không thể tiếp cận systemd user bus. Xóa mục crontab lỗi thời bằng `crontab -e`; dùng `openclaw channels status --probe`, `openclaw doctor`, và `openclaw gateway status` cho các kiểm tra sức khỏe hiện tại.

  </Accordion>
  <Accordion title="3c. Dọn dẹp khóa phiên">
    Doctor quét mọi thư mục phiên agent để tìm các tệp khóa ghi cũ — các tệp bị bỏ lại khi một phiên thoát bất thường. Với mỗi tệp khóa tìm thấy, công cụ báo cáo: đường dẫn, PID, PID có còn đang chạy hay không, tuổi của khóa, và khóa đó có được xem là cũ hay không (PID đã chết hoặc cũ hơn 30 phút). Ở chế độ `--fix` / `--repair`, công cụ tự động xóa các tệp khóa cũ; nếu không, công cụ in ghi chú và hướng dẫn bạn chạy lại với `--fix`.
  </Accordion>
  <Accordion title="3d. Sửa chữa nhánh bản ghi phiên">
    Doctor quét các tệp JSONL phiên agent để tìm hình dạng nhánh bị trùng lặp do lỗi viết lại bản ghi prompt ngày 2026.4.24 tạo ra: một lượt người dùng bị bỏ rơi có ngữ cảnh runtime nội bộ của OpenClaw cùng với một nhánh anh em đang hoạt động chứa cùng prompt người dùng hiển thị. Ở chế độ `--fix` / `--repair`, doctor sao lưu từng tệp bị ảnh hưởng cạnh tệp gốc và viết lại bản ghi về nhánh đang hoạt động để lịch sử Gateway và các trình đọc bộ nhớ không còn thấy các lượt trùng lặp.
  </Accordion>
  <Accordion title="4. Kiểm tra tính toàn vẹn trạng thái (lưu phiên, định tuyến và an toàn)">
    Thư mục trạng thái là thân não vận hành. Nếu nó biến mất, bạn sẽ mất phiên, thông tin xác thực, nhật ký và cấu hình (trừ khi bạn có bản sao lưu ở nơi khác).

    Doctor kiểm tra:

    - **Thiếu thư mục trạng thái**: cảnh báo về mất trạng thái nghiêm trọng, nhắc tạo lại thư mục, và nhắc bạn rằng công cụ không thể khôi phục dữ liệu bị thiếu.
    - **Quyền thư mục trạng thái**: xác minh khả năng ghi; đề xuất sửa quyền (và phát gợi ý `chown` khi phát hiện chủ sở hữu/nhóm không khớp).
    - **Thư mục trạng thái macOS được đồng bộ qua đám mây**: cảnh báo khi trạng thái được phân giải dưới iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) hoặc `~/Library/CloudStorage/...` vì các đường dẫn dựa trên đồng bộ có thể gây I/O chậm hơn và các cuộc đua khóa/đồng bộ.
    - **Thư mục trạng thái Linux SD hoặc eMMC**: cảnh báo khi trạng thái được phân giải tới một nguồn gắn kết `mmcblk*`, vì I/O ngẫu nhiên dựa trên SD hoặc eMMC có thể chậm hơn và hao mòn nhanh hơn khi ghi phiên và thông tin xác thực.
    - **Thiếu thư mục phiên**: `sessions/` và thư mục kho phiên là bắt buộc để lưu lịch sử và tránh lỗi sập `ENOENT`.
    - **Bản ghi không khớp**: cảnh báo khi các mục phiên gần đây bị thiếu tệp bản ghi.
    - **Phiên chính "JSONL 1 dòng"**: đánh dấu khi bản ghi chính chỉ có một dòng (lịch sử không được tích lũy).
    - **Nhiều thư mục trạng thái**: cảnh báo khi tồn tại nhiều thư mục `~/.openclaw` trên các thư mục home hoặc khi `OPENCLAW_STATE_DIR` trỏ tới nơi khác (lịch sử có thể bị chia giữa các bản cài đặt).
    - **Nhắc nhở chế độ từ xa**: nếu `gateway.mode=remote`, doctor nhắc bạn chạy công cụ trên máy chủ từ xa (trạng thái nằm ở đó).
    - **Quyền tệp cấu hình**: cảnh báo nếu `~/.openclaw/openclaw.json` có thể đọc bởi nhóm/mọi người và đề xuất siết lại thành `600`.

  </Accordion>
  <Accordion title="5. Sức khỏe xác thực mô hình (OAuth hết hạn)">
    Doctor kiểm tra các hồ sơ OAuth trong kho xác thực, cảnh báo khi token sắp hết hạn/đã hết hạn, và có thể làm mới chúng khi an toàn. Nếu hồ sơ OAuth/token của Anthropic đã cũ, công cụ đề xuất khóa API Anthropic hoặc đường dẫn setup-token Anthropic. Lời nhắc làm mới chỉ xuất hiện khi chạy tương tác (TTY); `--non-interactive` bỏ qua các lần thử làm mới.

    Khi làm mới OAuth thất bại vĩnh viễn (ví dụ `refresh_token_reused`, `invalid_grant`, hoặc nhà cung cấp yêu cầu bạn đăng nhập lại), doctor báo rằng cần xác thực lại và in lệnh `openclaw models auth login --provider ...` chính xác cần chạy.

    Doctor cũng báo cáo các hồ sơ xác thực tạm thời không dùng được do:

    - thời gian hồi ngắn (giới hạn tốc độ/hết thời gian chờ/lỗi xác thực)
    - vô hiệu hóa lâu hơn (lỗi thanh toán/tín dụng)

  </Accordion>
  <Accordion title="6. Xác thực mô hình hooks">
    Nếu `hooks.gmail.model` được đặt, doctor xác thực tham chiếu mô hình với catalog và danh sách cho phép, rồi cảnh báo khi nó không phân giải được hoặc không được phép.
  </Accordion>
  <Accordion title="7. Sửa chữa ảnh sandbox">
    Khi sandbox được bật, doctor kiểm tra ảnh Docker và đề xuất build hoặc chuyển sang tên cũ nếu ảnh hiện tại bị thiếu.
  </Accordion>
  <Accordion title="7b. Dọn dẹp cài đặt Plugin">
    Doctor xóa trạng thái dàn dựng phụ thuộc Plugin do OpenClaw tạo theo kiểu cũ ở chế độ `openclaw doctor --fix` / `openclaw doctor --repair`. Việc này bao gồm các gốc phụ thuộc đã tạo bị cũ, các thư mục giai đoạn cài đặt cũ, và mảnh vụn cục bộ trong package từ mã sửa chữa phụ thuộc Plugin đóng gói trước đây.

    Doctor cũng có thể cài đặt lại các Plugin có thể tải xuống đã cấu hình khi cấu hình tham chiếu đến chúng nhưng sổ đăng ký Plugin cục bộ không tìm thấy. Với việc ngoại hóa Plugin đóng gói ngày 2026.5.2, doctor tự động cài đặt các Plugin có thể tải xuống mà cấu hình hiện có đã dùng, rồi dựa vào `meta.lastTouchedVersion` để chỉ chạy lượt phát hành đó một lần. Khởi động Gateway và tải lại cấu hình không chạy trình quản lý package; cài đặt Plugin vẫn là công việc doctor/install/update rõ ràng.

  </Accordion>
  <Accordion title="8. Di chuyển dịch vụ Gateway và gợi ý dọn dẹp">
    Doctor phát hiện các dịch vụ Gateway kiểu cũ (launchd/systemd/schtasks) và đề xuất xóa chúng rồi cài đặt dịch vụ OpenClaw bằng cổng Gateway hiện tại. Công cụ cũng có thể quét các dịch vụ giống Gateway thừa và in gợi ý dọn dẹp. Các dịch vụ Gateway OpenClaw có tên theo hồ sơ được xem là hạng nhất và không bị đánh dấu là "thừa."

    Trên Linux, nếu thiếu dịch vụ Gateway cấp người dùng nhưng có một dịch vụ Gateway OpenClaw cấp hệ thống, doctor không tự động cài đặt dịch vụ cấp người dùng thứ hai. Kiểm tra bằng `openclaw gateway status --deep` hoặc `openclaw doctor --deep`, sau đó xóa bản trùng lặp hoặc đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một trình giám sát hệ thống sở hữu vòng đời Gateway.

  </Accordion>
  <Accordion title="8b. Di chuyển khởi động Matrix">
    Khi tài khoản kênh Matrix có một di chuyển trạng thái cũ đang chờ hoặc có thể thực hiện, doctor (ở chế độ `--fix` / `--repair`) tạo một ảnh chụp nhanh trước di chuyển rồi chạy các bước di chuyển nỗ lực tối đa: di chuyển trạng thái Matrix cũ và chuẩn bị trạng thái mã hóa cũ. Cả hai bước đều không gây lỗi nghiêm trọng; lỗi được ghi nhật ký và quá trình khởi động tiếp tục. Ở chế độ chỉ đọc (`openclaw doctor` không có `--fix`), kiểm tra này bị bỏ qua hoàn toàn.
  </Accordion>
  <Accordion title="8c. Ghép nối thiết bị và lệch xác thực">
    Doctor hiện kiểm tra trạng thái ghép nối thiết bị như một phần của lượt kiểm tra sức khỏe thông thường.

    Nội dung được báo cáo:

    - yêu cầu ghép nối lần đầu đang chờ
    - nâng cấp vai trò đang chờ cho các thiết bị đã ghép nối
    - nâng cấp phạm vi đang chờ cho các thiết bị đã ghép nối
    - sửa chữa không khớp khóa công khai khi id thiết bị vẫn khớp nhưng danh tính thiết bị không còn khớp với bản ghi đã phê duyệt
    - bản ghi đã ghép nối thiếu token đang hoạt động cho một vai trò đã phê duyệt
    - token đã ghép nối có phạm vi lệch khỏi đường cơ sở ghép nối đã phê duyệt
    - các mục token thiết bị được lưu đệm cục bộ cho máy hiện tại có trước một lần xoay token phía Gateway hoặc mang metadata phạm vi cũ

    Doctor không tự động phê duyệt yêu cầu ghép nối hoặc tự động xoay token thiết bị. Thay vào đó, công cụ in các bước tiếp theo chính xác:

    - kiểm tra yêu cầu đang chờ bằng `openclaw devices list`
    - phê duyệt yêu cầu chính xác bằng `openclaw devices approve <requestId>`
    - xoay token mới bằng `openclaw devices rotate --device <deviceId> --role <role>`
    - xóa và phê duyệt lại bản ghi cũ bằng `openclaw devices remove <deviceId>`

    Điều này khép lại lỗ hổng phổ biến "đã ghép nối nhưng vẫn bị yêu cầu ghép nối": doctor hiện phân biệt ghép nối lần đầu với nâng cấp vai trò/phạm vi đang chờ và với độ lệch token/danh tính thiết bị cũ.

  </Accordion>
  <Accordion title="9. Cảnh báo bảo mật">
    Doctor phát cảnh báo khi một nhà cung cấp mở cho tin nhắn trực tiếp mà không có danh sách cho phép, hoặc khi một chính sách được cấu hình theo cách nguy hiểm.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Nếu chạy như một dịch vụ người dùng systemd, doctor đảm bảo linger được bật để Gateway tiếp tục chạy sau khi đăng xuất.
  </Accordion>
  <Accordion title="11. Trạng thái workspace (Skills, Plugin và thư mục cũ)">
    Doctor in tóm tắt trạng thái workspace cho agent mặc định:

    - **Trạng thái Skills**: đếm các Skills đủ điều kiện, thiếu yêu cầu và bị chặn bởi danh sách cho phép.
    - **Thư mục workspace cũ**: cảnh báo khi `~/openclaw` hoặc các thư mục workspace cũ khác tồn tại cạnh workspace hiện tại.
    - **Trạng thái Plugin**: đếm Plugin đã bật/đã tắt/lỗi; liệt kê ID Plugin cho mọi lỗi; báo cáo khả năng của Plugin gói.
    - **Cảnh báo tương thích Plugin**: đánh dấu các Plugin có vấn đề tương thích với runtime hiện tại.
    - **Chẩn đoán Plugin**: hiển thị mọi cảnh báo hoặc lỗi lúc tải do sổ đăng ký Plugin phát ra.

  </Accordion>
  <Accordion title="11b. Kích thước tệp bootstrap">
    Doctor kiểm tra liệu các tệp bootstrap workspace (ví dụ `AGENTS.md`, `CLAUDE.md`, hoặc các tệp ngữ cảnh được tiêm khác) có gần hoặc vượt ngân sách ký tự đã cấu hình hay không. Công cụ báo cáo số ký tự thô so với đã tiêm theo từng tệp, phần trăm cắt ngắn, nguyên nhân cắt ngắn (`max/file` hoặc `max/total`), và tổng số ký tự đã tiêm dưới dạng tỷ lệ của tổng ngân sách. Khi tệp bị cắt ngắn hoặc gần giới hạn, doctor in mẹo điều chỉnh `agents.defaults.bootstrapMaxChars` và `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Dọn dẹp Plugin kênh cũ">
    Khi `openclaw doctor --fix` xóa một Plugin kênh bị thiếu, công cụ cũng xóa cấu hình trong phạm vi kênh bị treo đã tham chiếu đến Plugin đó: các mục `channels.<id>`, mục tiêu Heartbeat đã đặt tên kênh, và các ghi đè `agents.*.models["<channel>/*"]`. Điều này ngăn vòng lặp khởi động Gateway khi runtime kênh đã mất nhưng cấu hình vẫn yêu cầu Gateway bind tới nó.
  </Accordion>
  <Accordion title="11c. Hoàn tất shell">
    Doctor kiểm tra liệu tính năng hoàn tất tab đã được cài đặt cho shell hiện tại hay chưa (zsh, bash, fish, hoặc PowerShell):

    - Nếu hồ sơ shell dùng mẫu hoàn tất động chậm (`source <(openclaw completion ...)`), doctor nâng cấp nó lên biến thể tệp lưu đệm nhanh hơn.
    - Nếu hoàn tất được cấu hình trong hồ sơ nhưng thiếu tệp lưu đệm, doctor tự động tạo lại bộ nhớ đệm.
    - Nếu chưa cấu hình hoàn tất, doctor nhắc cài đặt nó (chỉ chế độ tương tác; bỏ qua với `--non-interactive`).

    Chạy `openclaw completion --write-state` để tạo lại bộ nhớ đệm thủ công.

  </Accordion>
  <Accordion title="12. Kiểm tra xác thực Gateway (token cục bộ)">
    Doctor kiểm tra mức sẵn sàng xác thực token Gateway cục bộ.

    - Nếu chế độ token cần token và không có nguồn token nào tồn tại, doctor đề xuất tạo một token.
    - Nếu `gateway.auth.token` do SecretRef quản lý nhưng không khả dụng, doctor cảnh báo và không ghi đè nó bằng bản rõ.
    - `openclaw doctor --generate-gateway-token` chỉ buộc tạo khi không cấu hình token SecretRef nào.

  </Accordion>
  <Accordion title="12b. Sửa chữa chỉ đọc có nhận biết SecretRef">
    Một số luồng sửa chữa cần kiểm tra thông tin xác thực đã cấu hình mà không làm suy yếu hành vi runtime fail-fast.

    - `openclaw doctor --fix` hiện dùng cùng mô hình tóm tắt SecretRef chỉ đọc như các lệnh nhóm trạng thái cho các sửa chữa cấu hình có mục tiêu.
    - Ví dụ: sửa chữa `allowFrom` / `groupAllowFrom` `@username` của Telegram cố gắng dùng thông tin xác thực bot đã cấu hình khi có.
    - Nếu token bot Telegram được cấu hình qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại, doctor báo rằng thông tin xác thực đã được cấu hình nhưng không khả dụng và bỏ qua tự động phân giải thay vì sập hoặc báo nhầm token là bị thiếu.

  </Accordion>
  <Accordion title="13. Kiểm tra tình trạng Gateway + khởi động lại">
    Doctor chạy kiểm tra tình trạng và đề nghị khởi động lại Gateway khi có vẻ không khỏe.
  </Accordion>
  <Accordion title="13b. Mức sẵn sàng của tìm kiếm bộ nhớ">
    Doctor kiểm tra xem nhà cung cấp embedding tìm kiếm bộ nhớ đã cấu hình có sẵn sàng cho tác nhân mặc định hay không. Hành vi phụ thuộc vào backend và nhà cung cấp đã cấu hình:

    - **Backend QMD**: thăm dò xem binary `qmd` có khả dụng và có thể khởi động hay không. Nếu không, in hướng dẫn khắc phục bao gồm gói npm và tùy chọn đường dẫn binary thủ công.
    - **Nhà cung cấp cục bộ tường minh**: kiểm tra tệp mô hình cục bộ hoặc URL mô hình từ xa/có thể tải xuống được nhận diện. Nếu thiếu, đề xuất chuyển sang nhà cung cấp từ xa.
    - **Nhà cung cấp từ xa tường minh** (`openai`, `voyage`, v.v.): xác minh khóa API có trong môi trường hoặc kho xác thực. In gợi ý khắc phục có thể thực hiện nếu bị thiếu.
    - **Nhà cung cấp tự động**: kiểm tra khả năng có sẵn của mô hình cục bộ trước, rồi thử từng nhà cung cấp từ xa theo thứ tự tự động chọn.

    Khi có kết quả thăm dò Gateway được lưu trong bộ nhớ đệm (Gateway khỏe tại thời điểm kiểm tra), doctor đối chiếu kết quả đó với cấu hình hiển thị được qua CLI và ghi chú mọi sai lệch. Doctor không khởi động lượt ping embedding mới trên đường dẫn mặc định; hãy dùng lệnh trạng thái bộ nhớ sâu khi bạn muốn kiểm tra nhà cung cấp trực tiếp.

    Dùng `openclaw memory status --deep` để xác minh mức sẵn sàng của embedding tại thời gian chạy.

  </Accordion>
  <Accordion title="14. Cảnh báo trạng thái kênh">
    Nếu Gateway khỏe, doctor chạy thăm dò trạng thái kênh và báo cáo cảnh báo kèm các bản sửa được đề xuất.
  </Accordion>
  <Accordion title="15. Kiểm tra + sửa chữa cấu hình supervisor">
    Doctor kiểm tra cấu hình supervisor đã cài đặt (launchd/systemd/schtasks) để tìm các mặc định bị thiếu hoặc lỗi thời (ví dụ: phụ thuộc systemd network-online và độ trễ khởi động lại). Khi phát hiện không khớp, nó đề xuất cập nhật và có thể ghi lại tệp dịch vụ/tác vụ theo các mặc định hiện tại.

    Ghi chú:

    - `openclaw doctor` nhắc trước khi ghi lại cấu hình supervisor.
    - `openclaw doctor --yes` chấp nhận các lời nhắc sửa chữa mặc định.
    - `openclaw doctor --repair` áp dụng các bản sửa được đề xuất mà không nhắc.
    - `openclaw doctor --repair --force` ghi đè cấu hình supervisor tùy chỉnh.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` giữ doctor ở chế độ chỉ đọc đối với vòng đời dịch vụ Gateway. Nó vẫn báo cáo tình trạng dịch vụ và chạy các sửa chữa không liên quan đến dịch vụ, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap dịch vụ, ghi lại cấu hình supervisor và dọn dẹp dịch vụ kế thừa vì một supervisor bên ngoài sở hữu vòng đời đó.
    - Trên Linux, doctor không ghi lại siêu dữ liệu lệnh/entrypoint khi unit Gateway systemd khớp đang hoạt động. Nó cũng bỏ qua các unit bổ sung không hoạt động giống Gateway nhưng không phải kế thừa trong quá trình quét dịch vụ trùng lặp để các tệp dịch vụ đồng hành không tạo nhiễu dọn dẹp.
    - Nếu xác thực bằng token yêu cầu token và `gateway.auth.token` do SecretRef quản lý, cài đặt/sửa chữa dịch vụ của doctor xác thực SecretRef nhưng không lưu các giá trị token văn bản thuần đã phân giải vào siêu dữ liệu môi trường dịch vụ supervisor.
    - Doctor phát hiện các giá trị môi trường dịch vụ được quản lý bằng `.env`/SecretRef mà các bản cài đặt LaunchAgent, systemd hoặc Windows Scheduled Task cũ hơn đã nhúng nội tuyến và ghi lại siêu dữ liệu dịch vụ để các giá trị đó tải từ nguồn thời gian chạy thay vì định nghĩa supervisor.
    - Doctor phát hiện khi lệnh dịch vụ vẫn ghim `--port` cũ sau khi `gateway.port` thay đổi và ghi lại siêu dữ liệu dịch vụ sang cổng hiện tại.
    - Nếu xác thực bằng token yêu cầu token và SecretRef token đã cấu hình không phân giải được, doctor chặn đường dẫn cài đặt/sửa chữa kèm hướng dẫn có thể thực hiện.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, doctor chặn cài đặt/sửa chữa cho đến khi mode được đặt tường minh.
    - Với các unit user-systemd trên Linux, kiểm tra sai lệch token của doctor hiện bao gồm cả nguồn `Environment=` và `EnvironmentFile=` khi so sánh siêu dữ liệu xác thực dịch vụ.
    - Sửa chữa dịch vụ của Doctor từ chối ghi lại, dừng hoặc khởi động lại dịch vụ Gateway từ binary OpenClaw cũ hơn khi cấu hình được ghi lần cuối bởi phiên bản mới hơn. Xem [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Bạn luôn có thể buộc ghi lại toàn bộ qua `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Chẩn đoán thời gian chạy Gateway + cổng">
    Doctor kiểm tra thời gian chạy dịch vụ (PID, trạng thái thoát gần nhất) và cảnh báo khi dịch vụ đã được cài đặt nhưng không thực sự đang chạy. Nó cũng kiểm tra xung đột cổng trên cổng Gateway (mặc định `18789`) và báo cáo các nguyên nhân có khả năng xảy ra (Gateway đã chạy, đường hầm SSH).
  </Accordion>
  <Accordion title="17. Thực hành tốt nhất cho thời gian chạy Gateway">
    Doctor cảnh báo khi dịch vụ Gateway chạy trên Bun hoặc đường dẫn Node do trình quản lý phiên bản quản lý (`nvm`, `fnm`, `volta`, `asdf`, v.v.). Các kênh WhatsApp + Telegram yêu cầu Node, và đường dẫn trình quản lý phiên bản có thể hỏng sau khi nâng cấp vì dịch vụ không tải shell init của bạn. Doctor đề nghị di chuyển sang bản cài đặt Node hệ thống khi có sẵn (Homebrew/apt/choco).

    LaunchAgent macOS mới cài đặt hoặc đã sửa chữa dùng PATH hệ thống chuẩn (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) thay vì sao chép PATH shell tương tác, nên Volta, asdf, fnm, pnpm và các thư mục trình quản lý phiên bản khác không thay đổi việc các tiến trình con Node được phân giải. Các dịch vụ Linux vẫn giữ các gốc môi trường tường minh (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) và các thư mục user-bin ổn định, nhưng các thư mục dự phòng trình quản lý phiên bản được đoán chỉ được ghi vào PATH dịch vụ khi các thư mục đó tồn tại trên đĩa.

  </Accordion>
  <Accordion title="18. Ghi cấu hình + siêu dữ liệu trình hướng dẫn">
    Doctor lưu mọi thay đổi cấu hình và đóng dấu siêu dữ liệu trình hướng dẫn để ghi lại lần chạy doctor.
  </Accordion>
  <Accordion title="19. Mẹo workspace (sao lưu + hệ thống bộ nhớ)">
    Doctor đề xuất hệ thống bộ nhớ workspace khi bị thiếu và in mẹo sao lưu nếu workspace chưa nằm trong git.

    Xem [/concepts/agent-workspace](/vi/concepts/agent-workspace) để biết hướng dẫn đầy đủ về cấu trúc workspace và sao lưu git (khuyến nghị GitHub hoặc GitLab riêng tư).

  </Accordion>
</AccordionGroup>

## Liên quan

- [Runbook Gateway](/vi/gateway)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
