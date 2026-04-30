---
read_when:
    - Thêm hoặc sửa đổi các migration của doctor
    - Giới thiệu các thay đổi cấu hình phá vỡ tương thích
sidebarTitle: Doctor
summary: 'Lệnh Doctor: kiểm tra tình trạng, chuyển đổi cấu hình và các bước sửa chữa'
title: Chẩn đoán
x-i18n:
    generated_at: "2026-04-30T09:36:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: c27b8e85eb0a577e676f0e6e205262775ff37303453e64fc1bc2adaf8b51147c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` là công cụ sửa chữa + di chuyển cho OpenClaw. Công cụ này sửa cấu hình/trạng thái cũ, kiểm tra tình trạng hoạt động và cung cấp các bước sửa chữa có thể thực hiện.

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

    Chấp nhận các giá trị mặc định mà không nhắc hỏi (bao gồm các bước sửa chữa khởi động lại/dịch vụ/sandbox khi áp dụng).

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

    Cũng áp dụng các sửa chữa mạnh tay (ghi đè cấu hình supervisor tùy chỉnh).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Chạy không nhắc hỏi và chỉ áp dụng các di chuyển an toàn (chuẩn hóa cấu hình + di chuyển trạng thái trên đĩa). Bỏ qua các hành động khởi động lại/dịch vụ/sandbox cần xác nhận của con người. Các di chuyển trạng thái cũ tự động chạy khi được phát hiện.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Quét các dịch vụ hệ thống để tìm các bản cài đặt Gateway bổ sung (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Nếu bạn muốn xem lại các thay đổi trước khi ghi, hãy mở tệp cấu hình trước:

```bash
cat ~/.openclaw/openclaw.json
```

## Công cụ này làm gì (tóm tắt)

<AccordionGroup>
  <Accordion title="Tình trạng, giao diện và cập nhật">
    - Cập nhật tiền kiểm tùy chọn cho bản cài đặt git (chỉ tương tác).
    - Kiểm tra độ mới của giao thức giao diện (xây dựng lại Control UI khi schema giao thức mới hơn).
    - Kiểm tra tình trạng + lời nhắc khởi động lại.
    - Tóm tắt trạng thái Skills (đủ điều kiện/thiếu/bị chặn) và trạng thái plugin.

  </Accordion>
  <Accordion title="Cấu hình và di chuyển">
    - Chuẩn hóa cấu hình cho các giá trị cũ.
    - Di chuyển cấu hình Talk từ các trường phẳng `talk.*` cũ sang `talk.provider` + `talk.providers.<provider>`.
    - Kiểm tra di chuyển trình duyệt cho cấu hình tiện ích Chrome cũ và mức sẵn sàng Chrome MCP.
    - Cảnh báo ghi đè nhà cung cấp OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Cảnh báo che khuất OAuth Codex (`models.providers.openai-codex`).
    - Kiểm tra điều kiện tiên quyết OAuth TLS cho hồ sơ OpenAI Codex OAuth.
    - Di chuyển trạng thái cũ trên đĩa (sessions/thư mục agent/xác thực WhatsApp).
    - Di chuyển khóa hợp đồng manifest plugin cũ (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Di chuyển kho Cron cũ (`jobId`, `schedule.cron`, các trường delivery/payload cấp cao nhất, payload `provider`, các job dự phòng webhook đơn giản `notify: true`).
    - Di chuyển chính sách runtime agent cũ sang `agents.defaults.agentRuntime` và `agents.list[].agentRuntime`.
    - Dọn dẹp cấu hình plugin cũ khi plugin được bật; khi `plugins.enabled=false`, các tham chiếu plugin cũ được xem là cấu hình khoanh vùng bất hoạt và được giữ nguyên.

  </Accordion>
  <Accordion title="Trạng thái và tính toàn vẹn">
    - Kiểm tra tệp khóa phiên và dọn dẹp khóa cũ.
    - Sửa bản ghi phiên cho các nhánh viết lại prompt bị trùng lặp do các bản dựng 2026.4.24 bị ảnh hưởng tạo ra.
    - Kiểm tra tính toàn vẹn trạng thái và quyền (sessions, transcripts, thư mục trạng thái).
    - Kiểm tra quyền tệp cấu hình (chmod 600) khi chạy cục bộ.
    - Tình trạng xác thực mô hình: kiểm tra hết hạn OAuth, có thể làm mới token sắp hết hạn và báo cáo trạng thái cooldown/vô hiệu hóa của hồ sơ xác thực.
    - Phát hiện thư mục workspace bổ sung (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, dịch vụ và supervisor">
    - Sửa image sandbox khi sandboxing được bật.
    - Di chuyển dịch vụ cũ và phát hiện Gateway bổ sung.
    - Di chuyển trạng thái cũ của kênh Matrix (ở chế độ `--fix` / `--repair`).
    - Kiểm tra runtime Gateway (dịch vụ đã cài nhưng không chạy; nhãn launchd được lưu trong bộ nhớ đệm).
    - Cảnh báo trạng thái kênh (thăm dò từ Gateway đang chạy).
    - Kiểm tra cấu hình supervisor (launchd/systemd/schtasks) với tùy chọn sửa chữa.
    - Dọn dẹp môi trường proxy nhúng cho các dịch vụ Gateway đã ghi lại giá trị shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` trong khi cài đặt hoặc cập nhật.
    - Kiểm tra thông lệ tốt nhất cho runtime Gateway (Node so với Bun, đường dẫn trình quản lý phiên bản).
    - Chẩn đoán xung đột cổng Gateway (mặc định `18789`).

  </Accordion>
  <Accordion title="Xác thực, bảo mật và ghép đôi">
    - Cảnh báo bảo mật cho chính sách DM mở.
    - Kiểm tra xác thực Gateway cho chế độ token cục bộ (đề nghị tạo token khi không có nguồn token; không ghi đè cấu hình token SecretRef).
    - Phát hiện sự cố ghép đôi thiết bị (yêu cầu ghép đôi lần đầu đang chờ, nâng cấp vai trò/phạm vi đang chờ, sai lệch bộ nhớ đệm device-token cục bộ cũ và sai lệch xác thực bản ghi đã ghép đôi).

  </Accordion>
  <Accordion title="Workspace và shell">
    - Kiểm tra systemd linger trên Linux.
    - Kiểm tra kích thước tệp bootstrap workspace (cảnh báo bị cắt/gần giới hạn cho tệp ngữ cảnh).
    - Kiểm tra trạng thái hoàn thành shell và tự động cài đặt/nâng cấp.
    - Kiểm tra mức sẵn sàng của nhà cung cấp embedding tìm kiếm bộ nhớ (mô hình cục bộ, khóa API từ xa hoặc binary QMD).
    - Kiểm tra bản cài đặt từ nguồn (không khớp pnpm workspace, thiếu tài sản giao diện, thiếu binary tsx).
    - Ghi cấu hình đã cập nhật + metadata wizard.

  </Accordion>
</AccordionGroup>

## Bổ sung ngược và đặt lại giao diện Dreams

Cảnh Dreams của Control UI bao gồm các hành động **Bổ sung ngược**, **Đặt lại** và **Xóa dữ liệu có căn cứ** cho quy trình Dreaming có căn cứ. Những hành động này dùng các phương thức RPC kiểu doctor của Gateway, nhưng chúng **không** phải là một phần của sửa chữa/di chuyển CLI `openclaw doctor`.

Những việc chúng làm:

- **Bổ sung ngược** quét các tệp lịch sử `memory/YYYY-MM-DD.md` trong workspace đang hoạt động, chạy lượt nhật ký REM có căn cứ và ghi các mục bổ sung ngược có thể đảo ngược vào `DREAMS.md`.
- **Đặt lại** chỉ xóa các mục nhật ký bổ sung ngược đã đánh dấu đó khỏi `DREAMS.md`.
- **Xóa dữ liệu có căn cứ** chỉ xóa các mục ngắn hạn chỉ có căn cứ đã được staged, đến từ phát lại lịch sử và chưa tích lũy khả năng nhớ lại trực tiếp hoặc hỗ trợ hằng ngày.

Những việc chúng **không** tự làm:

- chúng không chỉnh sửa `MEMORY.md`
- chúng không chạy đầy đủ các di chuyển doctor
- chúng không tự động stage các ứng viên có căn cứ vào kho promotion ngắn hạn trực tiếp trừ khi bạn chạy rõ ràng đường dẫn CLI staged trước

Nếu bạn muốn phát lại lịch sử có căn cứ ảnh hưởng đến làn promotion sâu thông thường, hãy dùng luồng CLI thay thế:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Lệnh đó stage các ứng viên bền vững có căn cứ vào kho Dreaming ngắn hạn trong khi vẫn giữ `DREAMS.md` làm bề mặt xem xét.

## Hành vi chi tiết và lý do

<AccordionGroup>
  <Accordion title="0. Cập nhật tùy chọn (bản cài đặt git)">
    Nếu đây là một checkout git và doctor đang chạy tương tác, công cụ sẽ đề nghị cập nhật (fetch/rebase/build) trước khi chạy doctor.
  </Accordion>
  <Accordion title="1. Chuẩn hóa cấu hình">
    Nếu cấu hình chứa các dạng giá trị cũ (ví dụ `messages.ackReaction` không có ghi đè theo kênh), doctor sẽ chuẩn hóa chúng vào schema hiện tại.

    Điều đó bao gồm các trường phẳng Talk cũ. Cấu hình Talk công khai hiện tại là `talk.provider` + `talk.providers.<provider>`. Doctor ghi lại các dạng cũ `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` vào bản đồ nhà cung cấp.

  </Accordion>
  <Accordion title="2. Di chuyển khóa cấu hình cũ">
    Khi cấu hình chứa các khóa không còn được khuyến nghị, các lệnh khác sẽ từ chối chạy và yêu cầu bạn chạy `openclaw doctor`.

    Doctor sẽ:

    - Giải thích khóa cũ nào đã được tìm thấy.
    - Hiển thị di chuyển đã áp dụng.
    - Ghi lại `~/.openclaw/openclaw.json` với schema đã cập nhật.

    Gateway cũng tự động chạy các di chuyển doctor khi khởi động nếu phát hiện định dạng cấu hình cũ, nhờ đó cấu hình cũ được sửa mà không cần can thiệp thủ công. Di chuyển kho job Cron được xử lý bởi `openclaw doctor --fix`.

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
    - Với các kênh có `accounts` được đặt tên nhưng vẫn còn các giá trị kênh cấp cao nhất cho một tài khoản, chuyển các giá trị thuộc phạm vi tài khoản đó vào tài khoản được thăng cấp đã chọn cho kênh đó (`accounts.default` cho hầu hết các kênh; Matrix có thể giữ nguyên một đích được đặt tên/mặc định hiện có khớp)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - xóa `agents.defaults.llm`; dùng `models.providers.<id>.timeoutSeconds` cho timeout nhà cung cấp/mô hình chậm
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - xóa `browser.relayBindHost` (thiết lập relay tiện ích cũ)
    - `models.providers.*.api: "openai"` cũ → `"openai-completions"` (Gateway khi khởi động cũng bỏ qua các nhà cung cấp có `api` được đặt thành giá trị enum tương lai hoặc không xác định thay vì thất bại đóng)

    Cảnh báo doctor cũng bao gồm hướng dẫn mặc định tài khoản cho các kênh nhiều tài khoản:

    - Nếu hai hoặc nhiều mục `channels.<channel>.accounts` được cấu hình mà không có `channels.<channel>.defaultAccount` hoặc `accounts.default`, doctor cảnh báo rằng định tuyến dự phòng có thể chọn một tài khoản không mong muốn.
    - Nếu `channels.<channel>.defaultAccount` được đặt thành ID tài khoản không xác định, doctor cảnh báo và liệt kê các ID tài khoản đã cấu hình.

  </Accordion>
  <Accordion title="2b. Ghi đè nhà cung cấp OpenCode">
    Nếu bạn đã thêm thủ công `models.providers.opencode`, `opencode-zen`, hoặc `opencode-go`, cấu hình đó sẽ ghi đè catalog OpenCode tích hợp sẵn từ `@mariozechner/pi-ai`. Điều đó có thể buộc các mô hình dùng sai API hoặc đưa chi phí về không. Doctor cảnh báo để bạn có thể xóa ghi đè và khôi phục định tuyến API + chi phí theo từng mô hình.
  </Accordion>
  <Accordion title="2c. Di chuyển trình duyệt và mức sẵn sàng của Chrome MCP">
    Nếu cấu hình trình duyệt của bạn vẫn trỏ tới đường dẫn tiện ích Chrome đã bị gỡ bỏ, doctor chuẩn hóa cấu hình đó sang mô hình gắn Chrome MCP cục bộ trên máy chủ hiện tại:

    - `browser.profiles.*.driver: "extension"` trở thành `"existing-session"`
    - `browser.relayBindHost` bị xóa

    Doctor cũng kiểm tra đường dẫn Chrome MCP cục bộ trên máy chủ khi bạn dùng `defaultProfile: "user"` hoặc một hồ sơ `existing-session` đã cấu hình:

    - kiểm tra Google Chrome có được cài trên cùng máy chủ cho các hồ sơ tự động kết nối mặc định hay không
    - kiểm tra phiên bản Chrome được phát hiện và cảnh báo khi thấp hơn Chrome 144
    - nhắc bạn bật gỡ lỗi từ xa trong trang kiểm tra của trình duyệt (ví dụ `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, hoặc `edge://inspect/#remote-debugging`)

    Doctor không thể bật thiết lập phía Chrome thay cho bạn. Chrome MCP cục bộ trên máy chủ vẫn yêu cầu:

    - trình duyệt dựa trên Chromium 144+ trên máy chủ gateway/node
    - trình duyệt đang chạy cục bộ
    - gỡ lỗi từ xa đã bật trong trình duyệt đó
    - phê duyệt lời nhắc đồng ý gắn lần đầu trong trình duyệt

    Mức sẵn sàng ở đây chỉ liên quan đến các điều kiện tiên quyết để gắn cục bộ. Existing-session giữ nguyên các giới hạn tuyến Chrome MCP hiện tại; các tuyến nâng cao như `responsebody`, xuất PDF, chặn tải xuống và hành động hàng loạt vẫn yêu cầu trình duyệt được quản lý hoặc hồ sơ CDP thô.

    Kiểm tra này **không** áp dụng cho Docker, sandbox, remote-browser, hoặc các luồng headless khác. Các luồng đó tiếp tục dùng CDP thô.

  </Accordion>
  <Accordion title="2d. Điều kiện tiên quyết OAuth TLS">
    Khi một hồ sơ OAuth của OpenAI Codex được cấu hình, doctor thăm dò điểm cuối ủy quyền OpenAI để xác minh rằng ngăn xếp TLS Node/OpenSSL cục bộ có thể xác thực chuỗi chứng chỉ. Nếu thăm dò thất bại với lỗi chứng chỉ (ví dụ `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, chứng chỉ hết hạn, hoặc chứng chỉ tự ký), doctor in hướng dẫn sửa lỗi theo từng nền tảng. Trên macOS với Homebrew Node, cách sửa thường là `brew postinstall ca-certificates`. Với `--deep`, thăm dò vẫn chạy ngay cả khi Gateway khỏe mạnh.
  </Accordion>
  <Accordion title="2e. Ghi đè nhà cung cấp Codex OAuth">
    Nếu trước đây bạn đã thêm các thiết lập truyền tải OpenAI cũ dưới `models.providers.openai-codex`, chúng có thể che khuất đường dẫn nhà cung cấp Codex OAuth tích hợp sẵn mà các bản phát hành mới tự động dùng. Doctor cảnh báo khi thấy các thiết lập truyền tải cũ đó đi kèm Codex OAuth để bạn có thể xóa hoặc viết lại ghi đè truyền tải lỗi thời và lấy lại hành vi định tuyến/dự phòng tích hợp sẵn. Proxy tùy chỉnh và ghi đè chỉ header vẫn được hỗ trợ và không kích hoạt cảnh báo này.
  </Accordion>
  <Accordion title="2f. Cảnh báo tuyến Plugin Codex">
    Khi Plugin Codex đi kèm được bật, doctor cũng kiểm tra liệu các tham chiếu mô hình chính `openai-codex/*` có còn phân giải qua trình chạy PI mặc định hay không. Tổ hợp đó hợp lệ khi bạn muốn xác thực Codex OAuth/đăng ký qua PI, nhưng rất dễ nhầm với bộ harness app-server Codex gốc. Doctor cảnh báo và trỏ tới dạng app-server tường minh: `openai/*` cộng với `agentRuntime.id: "codex"` hoặc `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor không tự động sửa việc này vì cả hai tuyến đều hợp lệ:

    - `openai-codex/*` + PI nghĩa là "dùng xác thực Codex OAuth/đăng ký qua trình chạy OpenClaw thông thường."
    - `openai/*` + `runtime: "codex"` nghĩa là "chạy lượt nhúng qua app-server Codex gốc."
    - `/codex ...` nghĩa là "điều khiển hoặc liên kết một cuộc hội thoại Codex gốc từ chat."
    - `/acp ...` hoặc `runtime: "acp"` nghĩa là "dùng bộ chuyển đổi ACP/acpx bên ngoài."

    Nếu cảnh báo xuất hiện, hãy chọn tuyến bạn định dùng và chỉnh cấu hình thủ công. Giữ nguyên cảnh báo khi PI Codex OAuth là có chủ ý.

  </Accordion>
  <Accordion title="3. Di chuyển trạng thái cũ (bố cục đĩa)">
    Doctor có thể di chuyển các bố cục cũ trên đĩa sang cấu trúc hiện tại:

    - Kho phiên + bản ghi:
      - từ `~/.openclaw/sessions/` sang `~/.openclaw/agents/<agentId>/sessions/`
    - Thư mục agent:
      - từ `~/.openclaw/agent/` sang `~/.openclaw/agents/<agentId>/agent/`
    - Trạng thái xác thực WhatsApp (Baileys):
      - từ `~/.openclaw/credentials/*.json` cũ (ngoại trừ `oauth.json`)
      - sang `~/.openclaw/credentials/whatsapp/<accountId>/...` (id tài khoản mặc định: `default`)

    Các di chuyển này theo hướng cố gắng tối đa và có tính lũy đẳng; doctor sẽ phát cảnh báo khi để lại bất kỳ thư mục cũ nào làm bản sao lưu. Gateway/CLI cũng tự động di chuyển phiên cũ + thư mục agent khi khởi động để lịch sử/xác thực/mô hình nằm trong đường dẫn theo từng agent mà không cần chạy doctor thủ công. Xác thực WhatsApp được chủ ý chỉ di chuyển qua `openclaw doctor`. Việc chuẩn hóa nhà cung cấp/bản đồ nhà cung cấp talk hiện so sánh bằng bình đẳng cấu trúc, nên các khác biệt chỉ do thứ tự khóa không còn kích hoạt lặp lại các thay đổi `doctor --fix` không có tác dụng.

  </Accordion>
  <Accordion title="3a. Di chuyển manifest Plugin cũ">
    Doctor quét tất cả manifest Plugin đã cài để tìm các khóa năng lực cấp cao nhất đã ngừng dùng (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Khi tìm thấy, doctor đề nghị chuyển chúng vào đối tượng `contracts` và ghi lại tệp manifest tại chỗ. Di chuyển này có tính lũy đẳng; nếu khóa `contracts` đã có cùng giá trị, khóa cũ sẽ bị xóa mà không nhân đôi dữ liệu.
  </Accordion>
  <Accordion title="3b. Di chuyển kho Cron cũ">
    Doctor cũng kiểm tra kho tác vụ Cron (`~/.openclaw/cron/jobs.json` theo mặc định, hoặc `cron.store` khi bị ghi đè) để tìm các dạng tác vụ cũ mà bộ lập lịch vẫn chấp nhận để tương thích.

    Các dọn dẹp Cron hiện tại gồm:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - các trường payload cấp cao nhất (`message`, `model`, `thinking`, ...) → `payload`
    - các trường delivery cấp cao nhất (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - bí danh delivery `provider` trong payload → `delivery.channel` tường minh
    - tác vụ fallback webhook `notify: true` cũ đơn giản → `delivery.mode="webhook"` tường minh với `delivery.to=cron.webhook`

    Doctor chỉ tự động di chuyển các tác vụ `notify: true` khi có thể làm vậy mà không thay đổi hành vi. Nếu một tác vụ kết hợp fallback notify cũ với một chế độ delivery không phải webhook đã tồn tại, doctor cảnh báo và để tác vụ đó cho bạn xem xét thủ công.

  </Accordion>
  <Accordion title="3c. Dọn dẹp khóa phiên">
    Doctor quét mọi thư mục phiên agent để tìm các tệp khóa ghi lỗi thời — các tệp bị bỏ lại khi một phiên thoát bất thường. Với mỗi tệp khóa tìm được, doctor báo cáo: đường dẫn, PID, PID còn sống hay không, tuổi của khóa và khóa có được coi là lỗi thời hay không (PID đã chết hoặc cũ hơn 30 phút). Ở chế độ `--fix` / `--repair`, doctor tự động xóa các tệp khóa lỗi thời; nếu không, doctor in ghi chú và hướng dẫn bạn chạy lại với `--fix`.
  </Accordion>
  <Accordion title="3d. Sửa nhánh bản ghi phiên">
    Doctor quét các tệp JSONL phiên agent để tìm dạng nhánh bị nhân đôi do lỗi viết lại bản ghi prompt ngày 2026.4.24 tạo ra: một lượt người dùng bị bỏ rơi có ngữ cảnh runtime nội bộ OpenClaw cùng một nhánh anh em đang hoạt động chứa cùng prompt người dùng hiển thị. Ở chế độ `--fix` / `--repair`, doctor sao lưu từng tệp bị ảnh hưởng cạnh tệp gốc và viết lại bản ghi về nhánh đang hoạt động để lịch sử Gateway và trình đọc bộ nhớ không còn thấy các lượt trùng lặp.
  </Accordion>
  <Accordion title="4. Kiểm tra toàn vẹn trạng thái (lưu phiên, định tuyến và an toàn)">
    Thư mục trạng thái là lõi vận hành. Nếu nó biến mất, bạn mất phiên, thông tin xác thực, nhật ký và cấu hình (trừ khi bạn có bản sao lưu ở nơi khác).

    Doctor kiểm tra:

    - **Thiếu thư mục trạng thái**: cảnh báo về mất trạng thái thảm khốc, nhắc tạo lại thư mục và nhắc bạn rằng không thể khôi phục dữ liệu bị thiếu.
    - **Quyền thư mục trạng thái**: xác minh khả năng ghi; đề nghị sửa quyền (và phát gợi ý `chown` khi phát hiện chủ sở hữu/nhóm không khớp).
    - **Thư mục trạng thái đồng bộ đám mây trên macOS**: cảnh báo khi trạng thái phân giải dưới iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) hoặc `~/Library/CloudStorage/...` vì các đường dẫn dựa trên đồng bộ có thể gây I/O chậm hơn và xung đột khóa/đồng bộ.
    - **Thư mục trạng thái Linux SD hoặc eMMC**: cảnh báo khi trạng thái phân giải tới nguồn mount `mmcblk*`, vì I/O ngẫu nhiên dựa trên SD hoặc eMMC có thể chậm hơn và hao mòn nhanh hơn khi ghi phiên và thông tin xác thực.
    - **Thiếu thư mục phiên**: `sessions/` và thư mục kho phiên là bắt buộc để lưu lịch sử và tránh lỗi sập `ENOENT`.
    - **Bản ghi không khớp**: cảnh báo khi các mục phiên gần đây thiếu tệp bản ghi.
    - **Phiên chính "JSONL 1 dòng"**: đánh dấu khi bản ghi chính chỉ có một dòng (lịch sử không được tích lũy).
    - **Nhiều thư mục trạng thái**: cảnh báo khi nhiều thư mục `~/.openclaw` tồn tại trên các thư mục home hoặc khi `OPENCLAW_STATE_DIR` trỏ tới nơi khác (lịch sử có thể bị chia giữa các bản cài).
    - **Nhắc nhở chế độ từ xa**: nếu `gateway.mode=remote`, doctor nhắc bạn chạy nó trên máy chủ từ xa (trạng thái nằm ở đó).
    - **Quyền tệp cấu hình**: cảnh báo nếu `~/.openclaw/openclaw.json` có thể đọc bởi nhóm/thế giới và đề nghị siết lại thành `600`.

  </Accordion>
  <Accordion title="5. Sức khỏe xác thực mô hình (hết hạn OAuth)">
    Doctor kiểm tra các hồ sơ OAuth trong kho xác thực, cảnh báo khi token sắp hết hạn/đã hết hạn và có thể làm mới chúng khi an toàn. Nếu hồ sơ OAuth/token Anthropic đã lỗi thời, doctor đề xuất khóa API Anthropic hoặc đường dẫn setup-token Anthropic. Lời nhắc làm mới chỉ xuất hiện khi chạy tương tác (TTY); `--non-interactive` bỏ qua các lần thử làm mới.

    Khi làm mới OAuth thất bại vĩnh viễn (ví dụ `refresh_token_reused`, `invalid_grant`, hoặc nhà cung cấp yêu cầu bạn đăng nhập lại), doctor báo rằng cần xác thực lại và in chính xác lệnh `openclaw models auth login --provider ...` cần chạy.

    Doctor cũng báo cáo các hồ sơ xác thực tạm thời không dùng được do:

    - thời gian chờ ngắn (giới hạn tốc độ/hết thời gian/lỗi xác thực)
    - vô hiệu hóa lâu hơn (lỗi thanh toán/tín dụng)

  </Accordion>
  <Accordion title="6. Xác thực mô hình hooks">
    Nếu `hooks.gmail.model` được đặt, doctor xác thực tham chiếu mô hình với catalog và danh sách cho phép, rồi cảnh báo khi tham chiếu đó không phân giải được hoặc không được phép.
  </Accordion>
  <Accordion title="7. Sửa ảnh sandbox">
    Khi sandboxing được bật, doctor kiểm tra các ảnh Docker và đề nghị xây dựng hoặc chuyển sang tên cũ nếu ảnh hiện tại bị thiếu.
  </Accordion>
  <Accordion title="7b. Phụ thuộc runtime của Plugin đi kèm">
    Doctor chỉ xác minh các phụ thuộc runtime cho các Plugin đi kèm đang hoạt động trong cấu hình hiện tại hoặc được bật theo mặc định bởi manifest đi kèm của chúng, ví dụ `plugins.entries.discord.enabled: true`, `channels.discord.enabled: true` cũ, `models.providers.*` / tham chiếu mô hình agent đã cấu hình, hoặc một Plugin đi kèm được bật mặc định mà không có quyền sở hữu nhà cung cấp. Nếu thiếu phụ thuộc nào, doctor báo cáo các gói và cài đặt chúng ở chế độ `openclaw doctor --fix` / `openclaw doctor --repair`. Plugin bên ngoài vẫn dùng `openclaw plugins install` / `openclaw plugins update`; doctor không cài phụ thuộc cho các đường dẫn Plugin tùy ý.

    Trong quá trình sửa chữa của doctor, các lượt cài đặt npm cho phụ thuộc runtime đi kèm sẽ báo tiến trình bằng spinner trong phiên TTY và bằng các dòng tiến trình định kỳ trong đầu ra được pipe/headless. Gateway và CLI cục bộ cũng có thể sửa chữa các phụ thuộc runtime của Plugin đi kèm đang hoạt động theo yêu cầu trước khi nhập một Plugin đi kèm. Các lượt cài đặt này được giới hạn trong gốc cài đặt runtime của Plugin, chạy với script bị vô hiệu hóa, không ghi package lock, và được bảo vệ bằng khóa gốc cài đặt để các lần khởi động CLI hoặc Gateway đồng thời không sửa đổi cùng một cây `node_modules` cùng lúc.

  </Accordion>
  <Accordion title="8. Di chuyển dịch vụ Gateway và gợi ý dọn dẹp">
    Doctor phát hiện các dịch vụ gateway cũ (launchd/systemd/schtasks) và đề nghị xóa chúng rồi cài đặt dịch vụ OpenClaw bằng cổng gateway hiện tại. Nó cũng có thể quét các dịch vụ bổ sung giống gateway và in ra gợi ý dọn dẹp. Các dịch vụ gateway OpenClaw có tên theo hồ sơ được xem là hạng nhất và không bị đánh dấu là "bổ sung."

    Trên Linux, nếu thiếu dịch vụ gateway cấp người dùng nhưng có dịch vụ gateway OpenClaw cấp hệ thống, doctor không tự động cài đặt thêm dịch vụ cấp người dùng thứ hai. Kiểm tra bằng `openclaw gateway status --deep` hoặc `openclaw doctor --deep`, rồi xóa bản trùng lặp hoặc đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một trình giám sát hệ thống quản lý vòng đời gateway.

  </Accordion>
  <Accordion title="8b. Di chuyển Startup Matrix">
    Khi một tài khoản kênh Matrix có di chuyển trạng thái cũ đang chờ hoặc có thể thực hiện, doctor (ở chế độ `--fix` / `--repair`) tạo một snapshot trước di chuyển rồi chạy các bước di chuyển nỗ lực tối đa: di chuyển trạng thái Matrix cũ và chuẩn bị trạng thái mã hóa cũ. Cả hai bước đều không gây lỗi nghiêm trọng; lỗi được ghi log và quá trình khởi động tiếp tục. Ở chế độ chỉ đọc (`openclaw doctor` không có `--fix`), kiểm tra này bị bỏ qua hoàn toàn.
  </Accordion>
  <Accordion title="8c. Ghép cặp thiết bị và lệch xác thực">
    Doctor hiện kiểm tra trạng thái ghép cặp thiết bị như một phần của lượt kiểm tra sức khỏe thông thường.

    Nội dung được báo cáo:

    - yêu cầu ghép cặp lần đầu đang chờ
    - nâng cấp vai trò đang chờ cho các thiết bị đã ghép cặp
    - nâng cấp phạm vi đang chờ cho các thiết bị đã ghép cặp
    - sửa chữa không khớp khóa công khai khi id thiết bị vẫn khớp nhưng danh tính thiết bị không còn khớp với bản ghi đã phê duyệt
    - bản ghi ghép cặp thiếu token đang hoạt động cho một vai trò đã phê duyệt
    - token đã ghép cặp có phạm vi lệch khỏi đường cơ sở ghép cặp đã phê duyệt
    - mục token thiết bị được lưu cache cục bộ cho máy hiện tại có từ trước một lần xoay token phía gateway hoặc mang siêu dữ liệu phạm vi đã cũ

    Doctor không tự động phê duyệt yêu cầu ghép cặp hoặc tự động xoay token thiết bị. Nó in ra chính xác các bước tiếp theo:

    - kiểm tra yêu cầu đang chờ bằng `openclaw devices list`
    - phê duyệt yêu cầu chính xác bằng `openclaw devices approve <requestId>`
    - xoay một token mới bằng `openclaw devices rotate --device <deviceId> --role <role>`
    - xóa và phê duyệt lại một bản ghi đã cũ bằng `openclaw devices remove <deviceId>`

    Điều này đóng lỗ hổng phổ biến "đã ghép cặp nhưng vẫn bị yêu cầu ghép cặp": doctor hiện phân biệt ghép cặp lần đầu với các nâng cấp vai trò/phạm vi đang chờ và với lệch token/danh tính thiết bị đã cũ.

  </Accordion>
  <Accordion title="9. Cảnh báo bảo mật">
    Doctor phát cảnh báo khi một nhà cung cấp mở cho DM mà không có allowlist, hoặc khi một chính sách được cấu hình theo cách nguy hiểm.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Nếu đang chạy dưới dạng dịch vụ người dùng systemd, doctor đảm bảo lingering được bật để gateway vẫn hoạt động sau khi đăng xuất.
  </Accordion>
  <Accordion title="11. Trạng thái workspace (Skills, Plugin, và thư mục cũ)">
    Doctor in bản tóm tắt trạng thái workspace cho agent mặc định:

    - **Trạng thái Skills**: đếm Skills đủ điều kiện, thiếu yêu cầu, và bị chặn bởi allowlist.
    - **Thư mục workspace cũ**: cảnh báo khi `~/openclaw` hoặc các thư mục workspace cũ khác tồn tại cùng với workspace hiện tại.
    - **Trạng thái Plugin**: đếm Plugin đã bật/đã tắt/lỗi; liệt kê ID Plugin cho mọi lỗi; báo cáo khả năng của Plugin trong bundle.
    - **Cảnh báo tương thích Plugin**: đánh dấu Plugin có vấn đề tương thích với runtime hiện tại.
    - **Chẩn đoán Plugin**: hiển thị mọi cảnh báo hoặc lỗi lúc tải do registry Plugin phát ra.

  </Accordion>
  <Accordion title="11b. Kích thước tệp bootstrap">
    Doctor kiểm tra xem các tệp bootstrap của workspace (ví dụ `AGENTS.md`, `CLAUDE.md`, hoặc các tệp ngữ cảnh được chèn khác) có gần hoặc vượt ngân sách ký tự đã cấu hình hay không. Nó báo cáo số ký tự thô so với được chèn cho từng tệp, tỷ lệ phần trăm bị cắt bớt, nguyên nhân cắt bớt (`max/file` hoặc `max/total`), và tổng số ký tự được chèn dưới dạng tỷ lệ của tổng ngân sách. Khi tệp bị cắt bớt hoặc gần giới hạn, doctor in mẹo để tinh chỉnh `agents.defaults.bootstrapMaxChars` và `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Dọn dẹp Plugin kênh đã cũ">
    Khi `openclaw doctor --fix` xóa một Plugin kênh bị thiếu, nó cũng xóa cấu hình treo theo phạm vi kênh đã tham chiếu đến Plugin đó: các mục `channels.<id>`, mục tiêu heartbeat đã nêu tên kênh, và các ghi đè `agents.*.models["<channel>/*"]`. Điều này ngăn vòng lặp khởi động Gateway khi runtime kênh đã biến mất nhưng cấu hình vẫn yêu cầu gateway bind vào nó.
  </Accordion>
  <Accordion title="11c. Tự động hoàn thành shell">
    Doctor kiểm tra xem tab completion đã được cài đặt cho shell hiện tại chưa (zsh, bash, fish, hoặc PowerShell):

    - Nếu hồ sơ shell dùng mẫu completion động chậm (`source <(openclaw completion ...)`), doctor nâng cấp nó lên biến thể tệp cache nhanh hơn.
    - Nếu completion được cấu hình trong hồ sơ nhưng thiếu tệp cache, doctor tự động tạo lại cache.
    - Nếu chưa cấu hình completion, doctor nhắc cài đặt nó (chỉ ở chế độ tương tác; bị bỏ qua với `--non-interactive`).

    Chạy `openclaw completion --write-state` để tạo lại cache thủ công.

  </Accordion>
  <Accordion title="12. Kiểm tra xác thực Gateway (token cục bộ)">
    Doctor kiểm tra mức sẵn sàng xác thực token gateway cục bộ.

    - Nếu chế độ token cần token và không có nguồn token nào tồn tại, doctor đề nghị tạo một token.
    - Nếu `gateway.auth.token` do SecretRef quản lý nhưng không khả dụng, doctor cảnh báo và không ghi đè nó bằng plaintext.
    - `openclaw doctor --generate-gateway-token` chỉ buộc tạo khi không cấu hình token SecretRef nào.

  </Accordion>
  <Accordion title="12b. Sửa chữa chỉ đọc có nhận biết SecretRef">
    Một số luồng sửa chữa cần kiểm tra thông tin xác thực đã cấu hình mà không làm suy yếu hành vi fail-fast của runtime.

    - `openclaw doctor --fix` hiện dùng cùng mô hình tóm tắt SecretRef chỉ đọc như các lệnh thuộc nhóm trạng thái cho các sửa chữa cấu hình có mục tiêu.
    - Ví dụ: sửa chữa Telegram `allowFrom` / `groupAllowFrom` `@username` cố gắng dùng thông tin xác thực bot đã cấu hình khi có sẵn.
    - Nếu token bot Telegram được cấu hình qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại, doctor báo rằng thông tin xác thực đã được cấu hình nhưng không khả dụng và bỏ qua tự động phân giải thay vì crash hoặc báo sai rằng thiếu token.

  </Accordion>
  <Accordion title="13. Kiểm tra sức khỏe Gateway + khởi động lại">
    Doctor chạy kiểm tra sức khỏe và đề nghị khởi động lại gateway khi nó có vẻ không khỏe.
  </Accordion>
  <Accordion title="13b. Mức sẵn sàng tìm kiếm bộ nhớ">
    Doctor kiểm tra xem nhà cung cấp embedding tìm kiếm bộ nhớ đã cấu hình có sẵn sàng cho agent mặc định hay không. Hành vi phụ thuộc vào backend và nhà cung cấp đã cấu hình:

    - **Backend QMD**: thăm dò xem binary `qmd` có khả dụng và có thể khởi động hay không. Nếu không, in hướng dẫn sửa chữa bao gồm gói npm và tùy chọn đường dẫn binary thủ công.
    - **Nhà cung cấp cục bộ tường minh**: kiểm tra tệp mô hình cục bộ hoặc URL mô hình từ xa/có thể tải xuống đã được nhận diện. Nếu thiếu, đề xuất chuyển sang nhà cung cấp từ xa.
    - **Nhà cung cấp từ xa tường minh** (`openai`, `voyage`, v.v.): xác minh khóa API có trong môi trường hoặc kho xác thực. In gợi ý sửa chữa có thể hành động nếu thiếu.
    - **Nhà cung cấp tự động**: kiểm tra tính khả dụng của mô hình cục bộ trước, rồi thử từng nhà cung cấp từ xa theo thứ tự tự động chọn.

    Khi có kết quả thăm dò gateway được cache (gateway khỏe tại thời điểm kiểm tra), doctor đối chiếu chéo kết quả đó với cấu hình CLI thấy được và ghi chú mọi điểm khác biệt. Doctor không bắt đầu ping embedding mới trên đường dẫn mặc định; hãy dùng lệnh trạng thái bộ nhớ sâu khi bạn muốn kiểm tra nhà cung cấp trực tiếp.

    Dùng `openclaw memory status --deep` để xác minh mức sẵn sàng embedding trong runtime.

  </Accordion>
  <Accordion title="14. Cảnh báo trạng thái kênh">
    Nếu gateway khỏe, doctor chạy thăm dò trạng thái kênh và báo cáo cảnh báo kèm các sửa chữa được đề xuất.
  </Accordion>
  <Accordion title="15. Kiểm tra và sửa chữa cấu hình supervisor">
    Doctor kiểm tra cấu hình supervisor đã cài đặt (launchd/systemd/schtasks) để tìm các mặc định bị thiếu hoặc đã lỗi thời (ví dụ: phụ thuộc systemd network-online và độ trễ khởi động lại). Khi tìm thấy điểm không khớp, nó đề xuất cập nhật và có thể ghi lại tệp dịch vụ/tác vụ về các mặc định hiện tại.

    Ghi chú:

    - `openclaw doctor` nhắc trước khi ghi lại cấu hình supervisor.
    - `openclaw doctor --yes` chấp nhận các lời nhắc sửa chữa mặc định.
    - `openclaw doctor --repair` áp dụng các sửa chữa được đề xuất mà không nhắc.
    - `openclaw doctor --repair --force` ghi đè cấu hình supervisor tùy chỉnh.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` giữ doctor ở chế độ chỉ đọc cho vòng đời dịch vụ Gateway. Nó vẫn báo cáo sức khỏe dịch vụ và chạy các sửa chữa không liên quan đến dịch vụ, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap dịch vụ, ghi lại cấu hình supervisor, và dọn dẹp dịch vụ cũ vì một supervisor bên ngoài quản lý vòng đời đó.
    - Trên Linux, doctor không ghi lại siêu dữ liệu lệnh/entrypoint khi unit gateway systemd khớp đang hoạt động. Nó cũng bỏ qua các unit bổ sung giống gateway không hoạt động và không phải cũ trong quá trình quét dịch vụ trùng lặp để các tệp dịch vụ đồng hành không tạo nhiễu dọn dẹp.
    - Nếu xác thực token yêu cầu token và `gateway.auth.token` do SecretRef quản lý, cài đặt/sửa chữa dịch vụ doctor xác thực SecretRef nhưng không lưu các giá trị token plaintext đã phân giải vào siêu dữ liệu môi trường dịch vụ supervisor.
    - Doctor phát hiện các giá trị môi trường dịch vụ được quản lý bởi `.env`/SecretRef mà các cài đặt LaunchAgent, systemd, hoặc Windows Scheduled Task cũ hơn đã nhúng inline và ghi lại siêu dữ liệu dịch vụ để các giá trị đó tải từ nguồn runtime thay vì định nghĩa supervisor.
    - Doctor phát hiện khi lệnh dịch vụ vẫn ghim `--port` cũ sau khi `gateway.port` thay đổi và ghi lại siêu dữ liệu dịch vụ về cổng hiện tại.
    - Nếu xác thực token yêu cầu token và token SecretRef đã cấu hình chưa được phân giải, doctor chặn đường dẫn cài đặt/sửa chữa kèm hướng dẫn có thể hành động.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, doctor chặn cài đặt/sửa chữa cho đến khi mode được đặt tường minh.
    - Đối với các unit user-systemd trên Linux, kiểm tra lệch token của doctor hiện bao gồm cả nguồn `Environment=` và `EnvironmentFile=` khi so sánh siêu dữ liệu xác thực dịch vụ.
    - Sửa chữa dịch vụ doctor từ chối ghi lại, dừng, hoặc khởi động lại một dịch vụ gateway từ binary OpenClaw cũ hơn khi cấu hình được ghi lần cuối bởi phiên bản mới hơn. Xem [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Bạn luôn có thể buộc ghi lại toàn bộ qua `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Chẩn đoán thời gian chạy Gateway + cổng">
    Doctor kiểm tra thời gian chạy của dịch vụ (PID, trạng thái thoát gần nhất) và cảnh báo khi dịch vụ đã được cài đặt nhưng thực tế không chạy. Công cụ này cũng kiểm tra xung đột cổng trên cổng gateway (mặc định `18789`) và báo cáo các nguyên nhân có khả năng xảy ra (gateway đã chạy, đường hầm SSH).
  </Accordion>
  <Accordion title="17. Thực hành tốt nhất cho thời gian chạy Gateway">
    Doctor cảnh báo khi dịch vụ gateway chạy trên Bun hoặc đường dẫn Node được quản lý theo phiên bản (`nvm`, `fnm`, `volta`, `asdf`, v.v.). Các kênh WhatsApp + Telegram yêu cầu Node, và đường dẫn trình quản lý phiên bản có thể bị hỏng sau khi nâng cấp vì dịch vụ không tải phần khởi tạo shell của bạn. Doctor đề xuất di chuyển sang bản cài đặt Node hệ thống khi có sẵn (Homebrew/apt/choco).

    Các dịch vụ mới cài đặt hoặc đã sửa chữa giữ nguyên các gốc môi trường rõ ràng (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) và các thư mục user-bin ổn định, nhưng các thư mục dự phòng trình quản lý phiên bản được đoán chỉ được ghi vào PATH của dịch vụ khi những thư mục đó tồn tại trên đĩa. Điều này giữ cho PATH supervisor được tạo khớp với cùng bài kiểm tra PATH tối thiểu mà doctor chạy sau đó.

  </Accordion>
  <Accordion title="18. Ghi cấu hình + siêu dữ liệu trình hướng dẫn">
    Doctor lưu giữ mọi thay đổi cấu hình và đóng dấu siêu dữ liệu trình hướng dẫn để ghi lại lần chạy doctor.
  </Accordion>
  <Accordion title="19. Mẹo workspace (sao lưu + hệ thống bộ nhớ)">
    Doctor đề xuất hệ thống bộ nhớ workspace khi thiếu và in mẹo sao lưu nếu workspace chưa nằm trong git.

    Xem [/concepts/agent-workspace](/vi/concepts/agent-workspace) để có hướng dẫn đầy đủ về cấu trúc workspace và sao lưu git (khuyến nghị GitHub hoặc GitLab riêng tư).

  </Accordion>
</AccordionGroup>

## Liên quan

- [Runbook Gateway](/vi/gateway)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
