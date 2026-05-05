---
read_when:
    - Thêm hoặc sửa đổi các chuyển đổi của doctor
    - Giới thiệu các thay đổi cấu hình phá vỡ tương thích
sidebarTitle: Doctor
summary: 'Lệnh doctor: kiểm tra tình trạng, chuyển đổi cấu hình và các bước sửa chữa'
title: Chẩn đoán
x-i18n:
    generated_at: "2026-05-05T01:47:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e374f91d00d4b43a3852de6f746b044471e80af936d464a789061a31cadd09d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` là công cụ sửa chữa + di trú cho OpenClaw. Công cụ này sửa cấu hình/trạng thái cũ, kiểm tra tình trạng hoạt động và cung cấp các bước sửa chữa có thể thực hiện.

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

    Chạy không có lời nhắc và chỉ áp dụng các di trú an toàn (chuẩn hóa cấu hình + di chuyển trạng thái trên đĩa). Bỏ qua các hành động khởi động lại/dịch vụ/sandbox cần xác nhận của con người. Các di trú trạng thái cũ sẽ tự động chạy khi được phát hiện.

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

## Chức năng (tóm tắt)

<AccordionGroup>
  <Accordion title="Sức khỏe, UI và cập nhật">
    - Cập nhật trước khi chạy tùy chọn cho các bản cài đặt git (chỉ khi tương tác).
    - Kiểm tra độ mới của giao thức UI (xây dựng lại Control UI khi schema giao thức mới hơn).
    - Kiểm tra sức khỏe + lời nhắc khởi động lại.
    - Tóm tắt trạng thái Skills (đủ điều kiện/thiếu/bị chặn) và trạng thái plugin.

  </Accordion>
  <Accordion title="Cấu hình và di trú">
    - Chuẩn hóa cấu hình cho các giá trị cũ.
    - Di trú cấu hình Talk từ các trường phẳng `talk.*` cũ sang `talk.provider` + `talk.providers.<provider>`.
    - Kiểm tra di trú trình duyệt cho cấu hình tiện ích Chrome cũ và mức sẵn sàng Chrome MCP.
    - Cảnh báo ghi đè provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Cảnh báo che khuất OAuth Codex (`models.providers.openai-codex`).
    - Kiểm tra điều kiện tiên quyết TLS OAuth cho hồ sơ OAuth OpenAI Codex.
    - Cảnh báo danh sách cho phép plugin/công cụ khi `plugins.allow` bị giới hạn nhưng chính sách công cụ vẫn yêu cầu wildcard hoặc công cụ do plugin sở hữu.
    - Di trú trạng thái cũ trên đĩa (sessions/thư mục agent/xác thực WhatsApp).
    - Di trú khóa hợp đồng manifest plugin cũ (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Di trú kho Cron cũ (`jobId`, `schedule.cron`, các trường delivery/payload cấp cao nhất, payload `provider`, các job dự phòng webhook `notify: true` đơn giản).
    - Di trú chính sách runtime agent cũ sang `agents.defaults.agentRuntime` và `agents.list[].agentRuntime`.
    - Dọn dẹp cấu hình plugin lỗi thời khi plugin được bật; khi `plugins.enabled=false`, các tham chiếu plugin lỗi thời được xem là cấu hình khoanh vùng bất hoạt và được giữ nguyên.

  </Accordion>
  <Accordion title="Trạng thái và tính toàn vẹn">
    - Kiểm tra tệp khóa phiên và dọn dẹp khóa lỗi thời.
    - Sửa chữa bản ghi phiên cho các nhánh viết lại prompt bị trùng lặp do các bản dựng 2026.4.24 bị ảnh hưởng tạo ra.
    - Phát hiện tombstone phục hồi khởi động lại subagent bị kẹt, có hỗ trợ `--fix` để xóa cờ phục hồi đã hủy lỗi thời để quá trình khởi động không tiếp tục xem tiến trình con là đã bị hủy khởi động lại.
    - Kiểm tra tính toàn vẹn trạng thái và quyền (sessions, transcripts, thư mục trạng thái).
    - Kiểm tra quyền tệp cấu hình (chmod 600) khi chạy cục bộ.
    - Sức khỏe xác thực mô hình: kiểm tra hết hạn OAuth, có thể làm mới token sắp hết hạn và báo cáo trạng thái cooldown/bị tắt của auth-profile.
    - Phát hiện thư mục workspace bổ sung (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, dịch vụ và supervisor">
    - Sửa chữa image sandbox khi sandboxing được bật.
    - Di trú dịch vụ cũ và phát hiện Gateway bổ sung.
    - Di trú trạng thái cũ của kênh Matrix (ở chế độ `--fix` / `--repair`).
    - Kiểm tra runtime Gateway (dịch vụ đã cài nhưng không chạy; nhãn launchd được lưu cache).
    - Cảnh báo trạng thái kênh (được dò từ Gateway đang chạy).
    - Kiểm tra cấu hình supervisor (launchd/systemd/schtasks) với sửa chữa tùy chọn.
    - Dọn dẹp môi trường proxy nhúng cho các dịch vụ Gateway đã thu thập giá trị shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` trong lúc cài đặt hoặc cập nhật.
    - Kiểm tra thực hành tốt nhất cho runtime Gateway (Node so với Bun, đường dẫn trình quản lý phiên bản).
    - Chẩn đoán xung đột cổng Gateway (mặc định `18789`).

  </Accordion>
  <Accordion title="Xác thực, bảo mật và ghép đôi">
    - Cảnh báo bảo mật cho chính sách DM mở.
    - Kiểm tra xác thực Gateway cho chế độ token cục bộ (đề xuất tạo token khi không có nguồn token; không ghi đè cấu hình token SecretRef).
    - Phát hiện sự cố ghép đôi thiết bị (yêu cầu ghép đôi lần đầu đang chờ, nâng cấp vai trò/phạm vi đang chờ, sai lệch cache device-token cục bộ lỗi thời và sai lệch xác thực bản ghi đã ghép đôi).

  </Accordion>
  <Accordion title="Workspace và shell">
    - Kiểm tra systemd linger trên Linux.
    - Kiểm tra kích thước tệp bootstrap workspace (cảnh báo bị cắt/gần giới hạn cho các tệp ngữ cảnh).
    - Kiểm tra mức sẵn sàng Skills cho agent mặc định; báo cáo các skill được phép nhưng thiếu binary, env, cấu hình hoặc yêu cầu OS, và `--fix` có thể tắt các skill không khả dụng trong `skills.entries`.
    - Kiểm tra trạng thái shell completion và tự động cài đặt/nâng cấp.
    - Kiểm tra mức sẵn sàng provider embedding tìm kiếm bộ nhớ (mô hình cục bộ, khóa API từ xa hoặc binary QMD).
    - Kiểm tra cài đặt từ nguồn (pnpm workspace không khớp, thiếu tài nguyên UI, thiếu binary tsx).
    - Ghi cấu hình đã cập nhật + metadata wizard.

  </Accordion>
</AccordionGroup>

## Điền bù và đặt lại UI Dreams

Cảnh Dreams của Control UI bao gồm các hành động **Backfill**, **Reset** và **Clear Grounded** cho quy trình grounded dreaming. Các hành động này dùng các phương thức RPC kiểu gateway doctor, nhưng chúng **không** phải là một phần của sửa chữa/di trú CLI `openclaw doctor`.

Những việc chúng làm:

- **Backfill** quét các tệp `memory/YYYY-MM-DD.md` lịch sử trong workspace đang hoạt động, chạy lượt nhật ký REM grounded và ghi các mục điền bù có thể hoàn tác vào `DREAMS.md`.
- **Reset** chỉ xóa các mục nhật ký điền bù đã được đánh dấu đó khỏi `DREAMS.md`.
- **Clear Grounded** chỉ xóa các mục ngắn hạn chỉ-grounded đã được đưa vào hàng chờ đến từ phát lại lịch sử và chưa tích lũy recall trực tiếp hoặc hỗ trợ hằng ngày.

Những việc chúng **không** tự làm:

- chúng không chỉnh sửa `MEMORY.md`
- chúng không chạy toàn bộ di trú doctor
- chúng không tự động đưa các ứng viên grounded vào kho promotion ngắn hạn trực tiếp trừ khi bạn chạy rõ ràng đường dẫn CLI đã đưa vào hàng chờ trước

Nếu bạn muốn phát lại lịch sử grounded ảnh hưởng đến làn promotion sâu thông thường, hãy dùng luồng CLI thay thế:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Lệnh đó đưa các ứng viên durable grounded vào kho dreaming ngắn hạn trong khi vẫn giữ `DREAMS.md` làm bề mặt xem xét.

## Hành vi chi tiết và lý do

<AccordionGroup>
  <Accordion title="0. Cập nhật tùy chọn (bản cài đặt git)">
    Nếu đây là một git checkout và doctor đang chạy tương tác, công cụ sẽ đề xuất cập nhật (fetch/rebase/build) trước khi chạy doctor.
  </Accordion>
  <Accordion title="1. Chuẩn hóa cấu hình">
    Nếu cấu hình chứa các dạng giá trị cũ (ví dụ `messages.ackReaction` không có ghi đè riêng theo kênh), doctor sẽ chuẩn hóa chúng vào schema hiện tại.

    Điều đó bao gồm các trường phẳng Talk cũ. Cấu hình Talk công khai hiện tại là `talk.provider` + `talk.providers.<provider>`. Doctor viết lại các dạng `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` cũ vào bản đồ provider.

    Doctor cũng cảnh báo khi `plugins.allow` không rỗng và chính sách công cụ dùng
    các mục công cụ wildcard hoặc do plugin sở hữu. `tools.allow: ["*"]` chỉ khớp các công cụ
    từ những plugin thật sự được tải; nó không bỏ qua danh sách cho phép plugin độc quyền.
    Doctor ghi `plugins.bundledDiscovery: "compat"` cho các cấu hình danh sách cho phép cũ đã di trú
    để giữ nguyên hành vi provider đi kèm hiện có, rồi
    trỏ tới thiết lập `"allowlist"` nghiêm ngặt hơn.

  </Accordion>
  <Accordion title="2. Di trú khóa cấu hình cũ">
    Khi cấu hình chứa các khóa đã ngừng dùng, các lệnh khác sẽ từ chối chạy và yêu cầu bạn chạy `openclaw doctor`.

    Doctor sẽ:

    - Giải thích những khóa cũ nào đã được tìm thấy.
    - Hiển thị di trú đã áp dụng.
    - Ghi lại `~/.openclaw/openclaw.json` với schema đã cập nhật.

    Gateway cũng tự động chạy các di trú doctor khi khởi động nếu phát hiện định dạng cấu hình cũ, vì vậy các cấu hình lỗi thời được sửa chữa mà không cần can thiệp thủ công. Di trú kho job Cron được xử lý bởi `openclaw doctor --fix`.

    Các di trú hiện tại:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - cấu hình configured-channel thiếu chính sách phản hồi hiển thị → `messages.groupChat.visibleReplies: "message_tool"`
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
    - Với các kênh có `accounts` được đặt tên nhưng vẫn còn các giá trị kênh cấp cao nhất cho tài khoản đơn lẻ, hãy chuyển các giá trị theo phạm vi tài khoản đó vào tài khoản được nâng cấp đã chọn cho kênh đó (`accounts.default` cho hầu hết các kênh; Matrix có thể giữ một đích được đặt tên/mặc định hiện có nếu khớp)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - xóa `agents.defaults.llm`; dùng `models.providers.<id>.timeoutSeconds` cho thời gian chờ nhà cung cấp/mô hình chậm
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - xóa `browser.relayBindHost` (thiết lập relay extension cũ)
    - `models.providers.*.api: "openai"` cũ → `"openai-completions"` (Gateway khi khởi động cũng bỏ qua các nhà cung cấp có `api` được đặt thành giá trị enum tương lai hoặc không xác định thay vì thất bại đóng)

    Cảnh báo của doctor cũng bao gồm hướng dẫn mặc định tài khoản cho các kênh nhiều tài khoản:

    - Nếu có từ hai mục `channels.<channel>.accounts` trở lên được cấu hình mà không có `channels.<channel>.defaultAccount` hoặc `accounts.default`, doctor cảnh báo rằng định tuyến dự phòng có thể chọn một tài khoản không mong muốn.
    - Nếu `channels.<channel>.defaultAccount` được đặt thành một ID tài khoản không xác định, doctor cảnh báo và liệt kê các ID tài khoản đã cấu hình.

  </Accordion>
  <Accordion title="2b. Ghi đè nhà cung cấp OpenCode">
    Nếu bạn đã thêm thủ công `models.providers.opencode`, `opencode-zen`, hoặc `opencode-go`, cấu hình đó sẽ ghi đè danh mục OpenCode tích hợp từ `@mariozechner/pi-ai`. Điều đó có thể buộc mô hình dùng sai API hoặc đưa chi phí về 0. Doctor cảnh báo để bạn có thể xóa ghi đè và khôi phục định tuyến API + chi phí theo từng mô hình.
  </Accordion>
  <Accordion title="2c. Di chuyển trình duyệt và trạng thái sẵn sàng Chrome MCP">
    Nếu cấu hình trình duyệt của bạn vẫn trỏ tới đường dẫn extension Chrome đã bị xóa, doctor chuẩn hóa nó sang mô hình gắn Chrome MCP cục bộ trên host hiện tại:

    - `browser.profiles.*.driver: "extension"` trở thành `"existing-session"`
    - `browser.relayBindHost` bị xóa

    Doctor cũng kiểm tra đường dẫn Chrome MCP cục bộ trên host khi bạn dùng `defaultProfile: "user"` hoặc một hồ sơ `existing-session` đã cấu hình:

    - kiểm tra Google Chrome có được cài trên cùng host cho các hồ sơ tự động kết nối mặc định hay không
    - kiểm tra phiên bản Chrome được phát hiện và cảnh báo khi phiên bản thấp hơn Chrome 144
    - nhắc bạn bật gỡ lỗi từ xa trong trang inspect của trình duyệt (ví dụ `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, hoặc `edge://inspect/#remote-debugging`)

    Doctor không thể bật thiết lập phía Chrome thay bạn. Chrome MCP cục bộ trên host vẫn yêu cầu:

    - một trình duyệt dựa trên Chromium 144+ trên host gateway/node
    - trình duyệt đang chạy cục bộ
    - gỡ lỗi từ xa được bật trong trình duyệt đó
    - phê duyệt lời nhắc đồng ý gắn lần đầu trong trình duyệt

    Trạng thái sẵn sàng ở đây chỉ liên quan đến các điều kiện tiên quyết để gắn cục bộ. Existing-session giữ các giới hạn tuyến Chrome MCP hiện tại; các tuyến nâng cao như `responsebody`, xuất PDF, chặn tải xuống, và hành động theo lô vẫn yêu cầu trình duyệt được quản lý hoặc hồ sơ CDP thô.

    Kiểm tra này **không** áp dụng cho Docker, sandbox, remote-browser, hoặc các luồng headless khác. Những luồng đó tiếp tục dùng CDP thô.

  </Accordion>
  <Accordion title="2d. Điều kiện tiên quyết OAuth TLS">
    Khi một hồ sơ OpenAI Codex OAuth được cấu hình, doctor thăm dò điểm cuối ủy quyền OpenAI để xác minh rằng ngăn xếp TLS Node/OpenSSL cục bộ có thể xác thực chuỗi chứng chỉ. Nếu thăm dò thất bại với lỗi chứng chỉ (ví dụ `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, chứng chỉ hết hạn, hoặc chứng chỉ tự ký), doctor in hướng dẫn khắc phục theo từng nền tảng. Trên macOS với Node từ Homebrew, cách khắc phục thường là `brew postinstall ca-certificates`. Với `--deep`, thăm dò chạy ngay cả khi gateway khỏe mạnh.
  </Accordion>
  <Accordion title="2e. Ghi đè nhà cung cấp Codex OAuth">
    Nếu trước đây bạn đã thêm thiết lập truyền tải OpenAI cũ dưới `models.providers.openai-codex`, chúng có thể che khuất đường dẫn nhà cung cấp Codex OAuth tích hợp mà các bản phát hành mới hơn dùng tự động. Doctor cảnh báo khi thấy các thiết lập truyền tải cũ đó đi cùng Codex OAuth để bạn có thể xóa hoặc viết lại ghi đè truyền tải lỗi thời và lấy lại hành vi định tuyến/dự phòng tích hợp. Proxy tùy chỉnh và ghi đè chỉ header vẫn được hỗ trợ và không kích hoạt cảnh báo này.
  </Accordion>
  <Accordion title="2f. Cảnh báo tuyến Plugin Codex">
    Khi Plugin Codex đi kèm được bật, doctor cũng kiểm tra liệu các tham chiếu mô hình chính `openai-codex/*` vẫn phân giải qua trình chạy PI mặc định hay không. Tổ hợp đó hợp lệ khi bạn muốn xác thực Codex OAuth/gói đăng ký thông qua PI, nhưng dễ bị nhầm với harness app-server Codex gốc. Doctor cảnh báo và trỏ tới dạng app-server rõ ràng: `openai/*` cộng với `agentRuntime.id: "codex"` hoặc `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor không tự động sửa điều này vì cả hai tuyến đều hợp lệ:

    - `openai-codex/*` + PI nghĩa là "dùng xác thực Codex OAuth/gói đăng ký thông qua trình chạy OpenClaw thông thường."
    - `openai/*` + `agentRuntime.id: "codex"` nghĩa là "chạy lượt nhúng thông qua app-server Codex gốc."
    - `/codex ...` nghĩa là "điều khiển hoặc liên kết một cuộc trò chuyện Codex gốc từ chat."
    - `/acp ...` hoặc `runtime: "acp"` nghĩa là "dùng bộ điều hợp ACP/acpx bên ngoài."

    Nếu cảnh báo xuất hiện, hãy chọn tuyến bạn dự định dùng và sửa cấu hình thủ công. Giữ nguyên cảnh báo khi PI Codex OAuth là có chủ đích.

  </Accordion>
  <Accordion title="2g. Dọn dẹp tuyến phiên">
    Doctor cũng quét kho phiên hoạt động để tìm trạng thái tuyến tự tạo đã lỗi thời sau khi bạn chuyển mô hình hoặc runtime mặc định/dự phòng đã cấu hình khỏi một tuyến do Plugin sở hữu, chẳng hạn như Codex.

    `openclaw doctor --fix` có thể xóa trạng thái lỗi thời tự tạo như ghim mô hình `modelOverrideSource: "auto"`, metadata mô hình runtime, ID harness đã ghim, liên kết phiên CLI, và ghi đè hồ sơ xác thực tự động khi tuyến sở hữu chúng không còn được cấu hình. Các lựa chọn mô hình phiên rõ ràng của người dùng hoặc phiên cũ được báo cáo để xem xét thủ công và giữ nguyên; chuyển chúng bằng `/model ...`, `/new`, hoặc đặt lại phiên khi tuyến đó không còn là ý định sử dụng.

  </Accordion>
  <Accordion title="3. Di chuyển trạng thái cũ (bố cục ổ đĩa)">
    Doctor có thể di chuyển các bố cục cũ trên ổ đĩa vào cấu trúc hiện tại:

    - Kho phiên + bản ghi:
      - từ `~/.openclaw/sessions/` sang `~/.openclaw/agents/<agentId>/sessions/`
    - Thư mục agent:
      - từ `~/.openclaw/agent/` sang `~/.openclaw/agents/<agentId>/agent/`
    - Trạng thái xác thực WhatsApp (Baileys):
      - từ `~/.openclaw/credentials/*.json` cũ (ngoại trừ `oauth.json`)
      - sang `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID tài khoản mặc định: `default`)

    Các lần di chuyển này là nỗ lực tốt nhất và có tính lặp lại an toàn; doctor sẽ phát cảnh báo khi để lại bất kỳ thư mục cũ nào làm bản sao lưu. Gateway/CLI cũng tự động di chuyển phiên cũ + thư mục agent khi khởi động để lịch sử/xác thực/mô hình nằm trong đường dẫn theo từng agent mà không cần chạy doctor thủ công. Chuẩn hóa nhà cung cấp talk/bản đồ nhà cung cấp hiện so sánh bằng bình đẳng cấu trúc, nên các khác biệt chỉ do thứ tự khóa không còn kích hoạt lặp lại các thay đổi `doctor --fix` không có tác dụng.

  </Accordion>
  <Accordion title="3a. Di chuyển manifest Plugin cũ">
    Doctor quét tất cả manifest Plugin đã cài đặt để tìm các khóa capability cấp cao nhất không còn dùng (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Khi tìm thấy, nó đề nghị chuyển chúng vào đối tượng `contracts` và viết lại tệp manifest tại chỗ. Quá trình di chuyển này có tính lặp lại an toàn; nếu khóa `contracts` đã có cùng các giá trị, khóa cũ sẽ bị xóa mà không nhân đôi dữ liệu.
  </Accordion>
  <Accordion title="3b. Di chuyển kho Cron cũ">
    Doctor cũng kiểm tra kho công việc cron (`~/.openclaw/cron/jobs.json` theo mặc định, hoặc `cron.store` khi bị ghi đè) để tìm các dạng công việc cũ mà bộ lập lịch vẫn chấp nhận để tương thích.

    Các dọn dẹp cron hiện tại bao gồm:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - các trường payload cấp cao nhất (`message`, `model`, `thinking`, ...) → `payload`
    - các trường delivery cấp cao nhất (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - bí danh delivery `provider` trong payload → `delivery.channel` rõ ràng
    - các công việc webhook dự phòng `notify: true` cũ đơn giản → `delivery.mode="webhook"` rõ ràng với `delivery.to=cron.webhook`

    Doctor chỉ tự động di chuyển các công việc `notify: true` khi có thể làm vậy mà không thay đổi hành vi. Nếu một công việc kết hợp dự phòng notify cũ với một chế độ delivery không phải webhook hiện có, doctor cảnh báo và để công việc đó lại để xem xét thủ công.

    Trên Linux, doctor cũng cảnh báo khi crontab của người dùng vẫn gọi `~/.openclaw/bin/ensure-whatsapp.sh` cũ. Tập lệnh cục bộ trên máy chủ đó không được OpenClaw hiện tại duy trì và có thể ghi các thông báo `Gateway inactive` sai vào `~/.openclaw/logs/whatsapp-health.log` khi cron không thể truy cập systemd user bus. Xóa mục crontab đã lỗi thời bằng `crontab -e`; dùng `openclaw channels status --probe`, `openclaw doctor`, và `openclaw gateway status` cho các lần kiểm tra tình trạng hiện tại.

  </Accordion>
  <Accordion title="3c. Dọn dẹp khóa phiên">
    Doctor quét mọi thư mục phiên tác nhân để tìm các tệp khóa ghi lỗi thời — các tệp còn sót lại khi một phiên thoát bất thường. Với mỗi tệp khóa tìm thấy, nó báo cáo: đường dẫn, PID, liệu PID còn đang chạy hay không, tuổi của khóa, và liệu khóa có được xem là lỗi thời hay không (PID đã chết hoặc cũ hơn 30 phút). Ở chế độ `--fix` / `--repair`, nó tự động xóa các tệp khóa lỗi thời; nếu không, nó in một ghi chú và hướng dẫn bạn chạy lại với `--fix`.
  </Accordion>
  <Accordion title="3d. Sửa nhánh bản ghi phiên">
    Doctor quét các tệp JSONL phiên tác nhân để tìm cấu trúc nhánh bị nhân đôi do lỗi viết lại bản ghi prompt ngày 2026.4.24 tạo ra: một lượt người dùng bị bỏ rơi có ngữ cảnh runtime nội bộ của OpenClaw cùng với một nhánh anh em đang hoạt động chứa cùng prompt người dùng hiển thị. Ở chế độ `--fix` / `--repair`, doctor sao lưu từng tệp bị ảnh hưởng bên cạnh tệp gốc và viết lại bản ghi về nhánh đang hoạt động để lịch sử gateway và các bộ đọc bộ nhớ không còn thấy các lượt trùng lặp.
  </Accordion>
  <Accordion title="4. Kiểm tra tính toàn vẹn trạng thái (lưu phiên, định tuyến và an toàn)">
    Thư mục trạng thái là trung khu vận hành. Nếu nó biến mất, bạn sẽ mất phiên, thông tin xác thực, nhật ký và cấu hình (trừ khi bạn có bản sao lưu ở nơi khác).

    Doctor kiểm tra:

    - **Thiếu thư mục trạng thái**: cảnh báo về mất trạng thái nghiêm trọng, nhắc tạo lại thư mục, và nhắc bạn rằng nó không thể khôi phục dữ liệu bị thiếu.
    - **Quyền thư mục trạng thái**: xác minh khả năng ghi; đề nghị sửa quyền (và phát ra gợi ý `chown` khi phát hiện chủ sở hữu/nhóm không khớp).
    - **Thư mục trạng thái được đồng bộ đám mây trên macOS**: cảnh báo khi trạng thái phân giải dưới iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) hoặc `~/Library/CloudStorage/...` vì các đường dẫn được đồng bộ có thể gây I/O chậm hơn và tranh chấp khóa/đồng bộ.
    - **Thư mục trạng thái SD hoặc eMMC trên Linux**: cảnh báo khi trạng thái phân giải tới nguồn gắn kết `mmcblk*`, vì I/O ngẫu nhiên dựa trên SD hoặc eMMC có thể chậm hơn và hao mòn nhanh hơn khi ghi phiên và thông tin xác thực.
    - **Thiếu thư mục phiên**: `sessions/` và thư mục lưu phiên là bắt buộc để lưu lịch sử và tránh sự cố `ENOENT`.
    - **Bản ghi không khớp**: cảnh báo khi các mục phiên gần đây thiếu tệp bản ghi.
    - **Phiên chính "JSONL 1 dòng"**: đánh dấu khi bản ghi chính chỉ có một dòng (lịch sử không được tích lũy).
    - **Nhiều thư mục trạng thái**: cảnh báo khi nhiều thư mục `~/.openclaw` tồn tại trên các thư mục home hoặc khi `OPENCLAW_STATE_DIR` trỏ đến nơi khác (lịch sử có thể bị chia tách giữa các bản cài đặt).
    - **Nhắc nhở chế độ từ xa**: nếu `gateway.mode=remote`, doctor nhắc bạn chạy nó trên máy chủ từ xa (trạng thái nằm ở đó).
    - **Quyền tệp cấu hình**: cảnh báo nếu `~/.openclaw/openclaw.json` có thể đọc bởi nhóm/mọi người và đề nghị siết chặt thành `600`.

  </Accordion>
  <Accordion title="5. Tình trạng xác thực mô hình (OAuth hết hạn)">
    Doctor kiểm tra các hồ sơ OAuth trong kho xác thực, cảnh báo khi token sắp hết hạn/đã hết hạn, và có thể làm mới chúng khi an toàn. Nếu hồ sơ OAuth/token Anthropic đã lỗi thời, nó gợi ý khóa API Anthropic hoặc đường dẫn setup-token Anthropic. Lời nhắc làm mới chỉ xuất hiện khi chạy tương tác (TTY); `--non-interactive` bỏ qua các lần thử làm mới.

    Khi làm mới OAuth thất bại vĩnh viễn (ví dụ `refresh_token_reused`, `invalid_grant`, hoặc nhà cung cấp yêu cầu bạn đăng nhập lại), doctor báo rằng cần xác thực lại và in đúng lệnh `openclaw models auth login --provider ...` cần chạy.

    Doctor cũng báo cáo các hồ sơ xác thực tạm thời không dùng được do:

    - thời gian chờ ngắn (giới hạn tốc độ/hết thời gian chờ/lỗi xác thực)
    - vô hiệu hóa dài hơn (lỗi thanh toán/tín dụng)

  </Accordion>
  <Accordion title="6. Xác thực mô hình hooks">
    Nếu `hooks.gmail.model` được đặt, doctor xác thực tham chiếu mô hình với catalog và danh sách cho phép, đồng thời cảnh báo khi nó không phân giải được hoặc không được cho phép.
  </Accordion>
  <Accordion title="7. Sửa ảnh sandbox">
    Khi sandboxing được bật, doctor kiểm tra Docker images và đề nghị xây dựng hoặc chuyển sang tên cũ nếu ảnh hiện tại bị thiếu.
  </Accordion>
  <Accordion title="7b. Dọn dẹp cài đặt Plugin">
    Doctor xóa trạng thái staging dependency plugin cũ do OpenClaw tạo ở chế độ `openclaw doctor --fix` / `openclaw doctor --repair`. Việc này bao gồm các gốc dependency được tạo đã lỗi thời, thư mục install-stage cũ, mảnh vụn cục bộ trong package từ mã sửa dependency bundled-plugin trước đây, và các bản sao npm được quản lý của các plugin `@openclaw/*` bundled bị mồ côi hoặc được khôi phục có thể che khuất manifest bundled hiện tại.

    Doctor cũng có thể cài đặt lại các plugin có thể tải xuống bị thiếu khi cấu hình tham chiếu đến chúng nhưng registry plugin cục bộ không tìm thấy. Ví dụ gồm `plugins.entries` thực tế, thiết lập channel/provider/search đã cấu hình, và runtime tác nhân đã cấu hình. Trong quá trình cập nhật package, doctor tránh chạy sửa plugin bằng package-manager khi package lõi đang được thay thế; chạy lại `openclaw doctor --fix` sau khi cập nhật nếu một plugin đã cấu hình vẫn cần khôi phục. Khởi động Gateway và tải lại cấu hình không chạy package managers; cài đặt plugin vẫn là công việc doctor/install/update rõ ràng.

  </Accordion>
  <Accordion title="8. Di chuyển dịch vụ Gateway và gợi ý dọn dẹp">
    Doctor phát hiện các dịch vụ gateway cũ (launchd/systemd/schtasks) và đề nghị xóa chúng rồi cài đặt dịch vụ OpenClaw bằng cổng gateway hiện tại. Nó cũng có thể quét các dịch vụ giống gateway bổ sung và in gợi ý dọn dẹp. Các dịch vụ gateway OpenClaw được đặt tên theo hồ sơ được xem là hạng nhất và không bị đánh dấu là "bổ sung."

    Trên Linux, nếu dịch vụ gateway cấp người dùng bị thiếu nhưng có dịch vụ gateway OpenClaw cấp hệ thống, doctor không tự động cài đặt dịch vụ cấp người dùng thứ hai. Kiểm tra bằng `openclaw gateway status --deep` hoặc `openclaw doctor --deep`, sau đó xóa bản trùng lặp hoặc đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một trình giám sát hệ thống sở hữu vòng đời gateway.

  </Accordion>
  <Accordion title="8b. Di chuyển Startup Matrix">
    Khi một tài khoản channel Matrix có quá trình di chuyển trạng thái cũ đang chờ hoặc có thể hành động, doctor (ở chế độ `--fix` / `--repair`) tạo snapshot trước di chuyển rồi chạy các bước di chuyển best-effort: di chuyển trạng thái Matrix cũ và chuẩn bị trạng thái mã hóa cũ. Cả hai bước đều không gây lỗi nghiêm trọng; lỗi được ghi nhật ký và quá trình khởi động tiếp tục. Ở chế độ chỉ đọc (`openclaw doctor` không có `--fix`), kiểm tra này bị bỏ qua hoàn toàn.
  </Accordion>
  <Accordion title="8c. Ghép nối thiết bị và lệch xác thực">
    Doctor hiện kiểm tra trạng thái ghép nối thiết bị như một phần của lượt kiểm tra tình trạng bình thường.

    Nội dung nó báo cáo:

    - yêu cầu ghép nối lần đầu đang chờ
    - nâng cấp vai trò đang chờ cho thiết bị đã ghép nối
    - nâng cấp phạm vi đang chờ cho thiết bị đã ghép nối
    - sửa lỗi public-key không khớp khi device id vẫn khớp nhưng danh tính thiết bị không còn khớp với bản ghi đã phê duyệt
    - bản ghi đã ghép nối thiếu token hoạt động cho một vai trò đã phê duyệt
    - token đã ghép nối có phạm vi lệch khỏi baseline ghép nối đã phê duyệt
    - mục device-token được cache cục bộ cho máy hiện tại có trước lần xoay token phía gateway hoặc mang metadata phạm vi lỗi thời

    Doctor không tự động phê duyệt yêu cầu ghép nối hoặc tự động xoay token thiết bị. Thay vào đó, nó in đúng các bước tiếp theo:

    - kiểm tra yêu cầu đang chờ bằng `openclaw devices list`
    - phê duyệt đúng yêu cầu bằng `openclaw devices approve <requestId>`
    - xoay token mới bằng `openclaw devices rotate --device <deviceId> --role <role>`
    - xóa và phê duyệt lại bản ghi lỗi thời bằng `openclaw devices remove <deviceId>`

    Việc này đóng lỗ hổng phổ biến "đã ghép nối nhưng vẫn nhận yêu cầu ghép nối": doctor hiện phân biệt ghép nối lần đầu với nâng cấp vai trò/phạm vi đang chờ và với lệch token/danh tính thiết bị lỗi thời.

  </Accordion>
  <Accordion title="9. Cảnh báo bảo mật">
    Doctor phát cảnh báo khi một provider mở cho DM mà không có danh sách cho phép, hoặc khi một chính sách được cấu hình theo cách nguy hiểm.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Nếu đang chạy dưới dạng dịch vụ người dùng systemd, doctor đảm bảo lingering được bật để gateway vẫn hoạt động sau khi đăng xuất.
  </Accordion>
  <Accordion title="11. Trạng thái workspace (skills, plugins và thư mục cũ)">
    Doctor in tóm tắt trạng thái workspace cho tác nhân mặc định:

    - **Trạng thái Skills**: đếm Skills đủ điều kiện, thiếu-yêu-cầu và bị danh sách-cho-phép chặn.
    - **Thư mục workspace cũ**: cảnh báo khi `~/openclaw` hoặc các thư mục workspace cũ khác tồn tại bên cạnh workspace hiện tại.
    - **Trạng thái Plugin**: đếm plugins đã bật/đã tắt/bị lỗi; liệt kê ID plugin cho mọi lỗi; báo cáo khả năng bundle plugin.
    - **Cảnh báo tương thích Plugin**: đánh dấu plugins có vấn đề tương thích với runtime hiện tại.
    - **Chẩn đoán Plugin**: hiển thị mọi cảnh báo hoặc lỗi tại thời điểm tải do registry plugin phát ra.

  </Accordion>
  <Accordion title="11b. Kích thước tệp bootstrap">
    Doctor kiểm tra liệu các tệp bootstrap workspace (ví dụ `AGENTS.md`, `CLAUDE.md`, hoặc các tệp ngữ cảnh được chèn khác) có gần hoặc vượt ngân sách ký tự đã cấu hình hay không. Nó báo cáo số ký tự thô so với đã chèn theo từng tệp, phần trăm cắt ngắn, nguyên nhân cắt ngắn (`max/file` hoặc `max/total`), và tổng số ký tự đã chèn dưới dạng tỷ lệ của tổng ngân sách. Khi các tệp bị cắt ngắn hoặc gần giới hạn, doctor in mẹo để tinh chỉnh `agents.defaults.bootstrapMaxChars` và `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Dọn dẹp plugin channel lỗi thời">
    Khi `openclaw doctor --fix` xóa một plugin channel bị thiếu, nó cũng xóa cấu hình treo theo phạm vi channel đã tham chiếu đến plugin đó: các mục `channels.<id>`, mục tiêu Heartbeat đã nêu tên channel, và ghi đè `agents.*.models["<channel>/*"]`. Điều này ngăn các vòng lặp khởi động Gateway khi runtime channel đã biến mất nhưng cấu hình vẫn yêu cầu gateway liên kết với nó.
  </Accordion>
  <Accordion title="11c. Hoàn tất shell">
    Doctor kiểm tra liệu tab completion có được cài đặt cho shell hiện tại (zsh, bash, fish, hoặc PowerShell) hay không:

    - Nếu hồ sơ shell dùng mẫu completion động chậm (`source <(openclaw completion ...)`), doctor nâng cấp nó lên biến thể tệp cache nhanh hơn.
    - Nếu completion được cấu hình trong hồ sơ nhưng tệp cache bị thiếu, doctor tự động tạo lại cache.
    - Nếu chưa có completion nào được cấu hình, doctor nhắc cài đặt nó (chỉ chế độ tương tác; bỏ qua với `--non-interactive`).

    Chạy `openclaw completion --write-state` để tạo lại cache thủ công.

  </Accordion>
  <Accordion title="12. Kiểm tra xác thực Gateway (token cục bộ)">
    Doctor kiểm tra mức sẵn sàng xác thực token gateway cục bộ.

    - Nếu chế độ token cần token và không có nguồn token nào tồn tại, doctor đề nghị tạo một token.
    - Nếu `gateway.auth.token` do SecretRef quản lý nhưng không khả dụng, doctor cảnh báo và không ghi đè nó bằng plaintext.
    - `openclaw doctor --generate-gateway-token` chỉ buộc tạo khi không có SecretRef token nào được cấu hình.

  </Accordion>
  <Accordion title="12b. Sửa chữa chỉ đọc nhận biết SecretRef">
    Một số luồng sửa chữa cần kiểm tra thông tin xác thực đã cấu hình mà không làm suy yếu hành vi fail-fast của runtime.

    - `openclaw doctor --fix` hiện dùng cùng mô hình tóm tắt SecretRef chỉ đọc như các lệnh thuộc nhóm trạng thái cho các sửa chữa cấu hình có mục tiêu.
    - Ví dụ: sửa chữa Telegram `allowFrom` / `groupAllowFrom` `@username` cố gắng dùng thông tin đăng nhập bot đã cấu hình khi có sẵn.
    - Nếu token bot Telegram được cấu hình qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại, doctor báo cáo rằng thông tin đăng nhập đã được cấu hình-nhưng-không-khả-dụng và bỏ qua tự động phân giải thay vì gặp lỗi hoặc báo sai rằng token bị thiếu.

  </Accordion>
  <Accordion title="13. Kiểm tra sức khỏe Gateway + khởi động lại">
    Doctor chạy kiểm tra sức khỏe và đề xuất khởi động lại gateway khi có vẻ không khỏe.
  </Accordion>
  <Accordion title="13b. Mức sẵn sàng tìm kiếm bộ nhớ">
    Doctor kiểm tra xem nhà cung cấp embedding tìm kiếm bộ nhớ đã cấu hình có sẵn sàng cho tác tử mặc định hay không. Hành vi phụ thuộc vào backend và nhà cung cấp đã cấu hình:

    - **Backend QMD**: thăm dò xem binary `qmd` có khả dụng và có thể khởi động hay không. Nếu không, in hướng dẫn sửa lỗi bao gồm gói npm và tùy chọn đường dẫn binary thủ công.
    - **Nhà cung cấp cục bộ tường minh**: kiểm tra tệp mô hình cục bộ hoặc URL mô hình từ xa/có thể tải xuống được nhận diện. Nếu thiếu, đề xuất chuyển sang nhà cung cấp từ xa.
    - **Nhà cung cấp từ xa tường minh** (`openai`, `voyage`, v.v.): xác minh khóa API có trong môi trường hoặc kho xác thực. In gợi ý sửa lỗi có thể hành động nếu thiếu.
    - **Nhà cung cấp tự động**: kiểm tra tính khả dụng của mô hình cục bộ trước, rồi thử từng nhà cung cấp từ xa theo thứ tự tự động chọn.

    Khi có kết quả thăm dò gateway được lưu trong bộ nhớ đệm (gateway khỏe tại thời điểm kiểm tra), doctor đối chiếu kết quả đó với cấu hình CLI có thể thấy và ghi chú mọi điểm không khớp. Doctor không khởi động ping embedding mới trên đường dẫn mặc định; dùng lệnh trạng thái bộ nhớ sâu khi bạn muốn kiểm tra nhà cung cấp trực tiếp.

    Dùng `openclaw memory status --deep` để xác minh mức sẵn sàng của embedding khi chạy.

  </Accordion>
  <Accordion title="14. Cảnh báo trạng thái kênh">
    Nếu gateway khỏe, doctor chạy thăm dò trạng thái kênh và báo cáo cảnh báo kèm các sửa lỗi được đề xuất.
  </Accordion>
  <Accordion title="15. Kiểm tra cấu hình supervisor + sửa chữa">
    Doctor kiểm tra cấu hình supervisor đã cài đặt (launchd/systemd/schtasks) để tìm các mặc định bị thiếu hoặc đã lỗi thời (ví dụ: phụ thuộc systemd network-online và độ trễ khởi động lại). Khi tìm thấy điểm không khớp, nó đề xuất cập nhật và có thể ghi lại tệp dịch vụ/tác vụ theo các mặc định hiện tại.

    Ghi chú:

    - `openclaw doctor` nhắc trước khi ghi lại cấu hình supervisor.
    - `openclaw doctor --yes` chấp nhận các lời nhắc sửa chữa mặc định.
    - `openclaw doctor --repair` áp dụng các sửa lỗi được đề xuất mà không cần lời nhắc.
    - `openclaw doctor --repair --force` ghi đè cấu hình supervisor tùy chỉnh.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` giữ doctor ở chế độ chỉ đọc cho vòng đời dịch vụ gateway. Nó vẫn báo cáo sức khỏe dịch vụ và chạy các sửa chữa không thuộc dịch vụ, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap dịch vụ, ghi lại cấu hình supervisor, và dọn dẹp dịch vụ cũ vì một supervisor bên ngoài sở hữu vòng đời đó.
    - Trên Linux, doctor không ghi lại metadata lệnh/entrypoint khi unit gateway systemd tương ứng đang hoạt động. Nó cũng bỏ qua các unit giống gateway bổ sung không hoạt động và không phải legacy trong quá trình quét dịch vụ trùng lặp để các tệp dịch vụ đồng hành không tạo nhiễu dọn dẹp.
    - Nếu xác thực bằng token yêu cầu token và `gateway.auth.token` được quản lý bằng SecretRef, quá trình cài đặt/sửa chữa dịch vụ của doctor xác thực SecretRef nhưng không lưu giá trị token văn bản thuần đã phân giải vào metadata môi trường dịch vụ supervisor.
    - Doctor phát hiện các giá trị môi trường dịch vụ được quản lý bằng `.env`/SecretRef mà các bản cài LaunchAgent, systemd, hoặc Windows Scheduled Task cũ đã nhúng inline và ghi lại metadata dịch vụ để các giá trị đó tải từ nguồn runtime thay vì định nghĩa supervisor.
    - Doctor phát hiện khi lệnh dịch vụ vẫn ghim `--port` cũ sau khi `gateway.port` thay đổi và ghi lại metadata dịch vụ sang cổng hiện tại.
    - Nếu xác thực bằng token yêu cầu token và SecretRef token đã cấu hình chưa được phân giải, doctor chặn đường dẫn cài đặt/sửa chữa kèm hướng dẫn có thể hành động.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, doctor chặn cài đặt/sửa chữa cho đến khi mode được đặt tường minh.
    - Đối với các unit user-systemd trên Linux, kiểm tra trôi lệch token của doctor giờ bao gồm cả nguồn `Environment=` và `EnvironmentFile=` khi so sánh metadata xác thực dịch vụ.
    - Sửa chữa dịch vụ của doctor từ chối ghi lại, dừng, hoặc khởi động lại dịch vụ gateway từ binary OpenClaw cũ hơn khi cấu hình được ghi lần cuối bởi phiên bản mới hơn. Xem [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Bạn luôn có thể buộc ghi lại toàn bộ qua `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Runtime Gateway + chẩn đoán cổng">
    Doctor kiểm tra runtime dịch vụ (PID, trạng thái thoát gần nhất) và cảnh báo khi dịch vụ đã cài đặt nhưng thực tế không chạy. Nó cũng kiểm tra xung đột cổng trên cổng gateway (mặc định `18789`) và báo cáo các nguyên nhân có khả năng (gateway đã chạy, đường hầm SSH).
  </Accordion>
  <Accordion title="17. Thực hành tốt nhất cho runtime Gateway">
    Doctor cảnh báo khi dịch vụ gateway chạy trên Bun hoặc đường dẫn Node do trình quản lý phiên bản quản lý (`nvm`, `fnm`, `volta`, `asdf`, v.v.). Các kênh WhatsApp + Telegram yêu cầu Node, và đường dẫn trình quản lý phiên bản có thể hỏng sau khi nâng cấp vì dịch vụ không tải init shell của bạn. Doctor đề xuất di chuyển sang bản cài Node hệ thống khi có sẵn (Homebrew/apt/choco).

    Các macOS LaunchAgent mới được cài đặt hoặc sửa chữa dùng PATH hệ thống chuẩn (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) thay vì sao chép PATH shell tương tác, nên Volta, asdf, fnm, pnpm, và các thư mục trình quản lý phiên bản khác không thay đổi Node mà tiến trình con phân giải. Dịch vụ Linux vẫn giữ các root môi trường tường minh (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) và các thư mục user-bin ổn định, nhưng các thư mục dự phòng trình quản lý phiên bản được đoán chỉ được ghi vào PATH dịch vụ khi các thư mục đó tồn tại trên đĩa.

  </Accordion>
  <Accordion title="18. Ghi cấu hình + metadata wizard">
    Doctor lưu mọi thay đổi cấu hình và đóng dấu metadata wizard để ghi lại lần chạy doctor.
  </Accordion>
  <Accordion title="19. Mẹo workspace (sao lưu + hệ thống bộ nhớ)">
    Doctor đề xuất một hệ thống bộ nhớ workspace khi thiếu và in mẹo sao lưu nếu workspace chưa nằm trong git.

    Xem [/concepts/agent-workspace](/vi/concepts/agent-workspace) để có hướng dẫn đầy đủ về cấu trúc workspace và sao lưu git (khuyến nghị GitHub hoặc GitLab riêng tư).

  </Accordion>
</AccordionGroup>

## Liên quan

- [Runbook Gateway](/vi/gateway)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
