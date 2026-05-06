---
read_when:
    - Thêm hoặc sửa đổi các bản di trú của doctor
    - Giới thiệu các thay đổi cấu hình không tương thích ngược
sidebarTitle: Doctor
summary: 'Lệnh Doctor: kiểm tra tình trạng, chuyển đổi cấu hình và các bước sửa chữa'
title: Chẩn đoán
x-i18n:
    generated_at: "2026-05-06T17:55:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e8a1e280717b7a523ba092dec2e2f7d1c13e67a5ede30d0b4bb5a3100dc0e44
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` là công cụ sửa chữa + di chuyển cho OpenClaw. Công cụ này sửa cấu hình/trạng thái cũ, kiểm tra tình trạng hoạt động và cung cấp các bước sửa chữa có thể thực hiện được.

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

    Chấp nhận các giá trị mặc định mà không nhắc (bao gồm các bước sửa chữa khởi động lại/dịch vụ/sandbox khi áp dụng).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Áp dụng các sửa chữa được khuyến nghị mà không nhắc (sửa chữa + khởi động lại ở những nơi an toàn).

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

    Chạy không có lời nhắc và chỉ áp dụng các lần di chuyển an toàn (chuẩn hóa cấu hình + di chuyển trạng thái trên đĩa). Bỏ qua các hành động khởi động lại/dịch vụ/sandbox cần xác nhận của con người. Các lần di chuyển trạng thái cũ sẽ tự động chạy khi được phát hiện.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Quét các dịch vụ hệ thống để tìm các bản cài đặt gateway bổ sung (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Nếu bạn muốn xem lại các thay đổi trước khi ghi, hãy mở tệp cấu hình trước:

```bash
cat ~/.openclaw/openclaw.json
```

## Công cụ này làm gì (tóm tắt)

<AccordionGroup>
  <Accordion title="Tình trạng hoạt động, UI và bản cập nhật">
    - Cập nhật trước khi chạy tùy chọn cho các bản cài đặt git (chỉ tương tác).
    - Kiểm tra độ mới của giao thức UI (xây dựng lại Control UI khi schema giao thức mới hơn).
    - Kiểm tra tình trạng hoạt động + lời nhắc khởi động lại.
    - Tóm tắt trạng thái Skills (đủ điều kiện/thiếu/bị chặn) và trạng thái plugin.

  </Accordion>
  <Accordion title="Cấu hình và di chuyển">
    - Chuẩn hóa cấu hình cho các giá trị cũ.
    - Di chuyển cấu hình Talk từ các trường phẳng cũ `talk.*` vào `talk.provider` + `talk.providers.<provider>`.
    - Kiểm tra di chuyển trình duyệt cho cấu hình Chrome extension cũ và mức sẵn sàng của Chrome MCP.
    - Cảnh báo ghi đè nhà cung cấp OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Cảnh báo che khuất OAuth của Codex (`models.providers.openai-codex`).
    - Kiểm tra điều kiện tiên quyết TLS của OAuth cho hồ sơ OpenAI Codex OAuth.
    - Cảnh báo danh sách cho phép Plugin/công cụ khi `plugins.allow` bị giới hạn nhưng chính sách công cụ vẫn yêu cầu wildcard hoặc công cụ do plugin sở hữu.
    - Di chuyển trạng thái cũ trên đĩa (sessions/thư mục agent/xác thực WhatsApp).
    - Di chuyển khóa hợp đồng manifest plugin cũ (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Di chuyển kho cron cũ (`jobId`, `schedule.cron`, các trường delivery/payload cấp cao nhất, payload `provider`, các job webhook dự phòng đơn giản `notify: true`).
    - Di chuyển chính sách runtime agent cũ sang `agents.defaults.agentRuntime` và `agents.list[].agentRuntime`.
    - Dọn dẹp cấu hình plugin cũ khi plugin được bật; khi `plugins.enabled=false`, các tham chiếu plugin cũ được xem là cấu hình containment bất hoạt và được giữ nguyên.

  </Accordion>
  <Accordion title="Trạng thái và tính toàn vẹn">
    - Kiểm tra tệp khóa phiên và dọn dẹp khóa cũ.
    - Sửa transcript phiên cho các nhánh viết lại prompt bị trùng lặp do các bản build 2026.4.24 bị ảnh hưởng tạo ra.
    - Phát hiện tombstone phục hồi khởi động lại subagent bị kẹt, với hỗ trợ `--fix` để xóa các cờ phục hồi đã hủy cũ nhằm tránh việc startup tiếp tục coi child là đã hủy do khởi động lại.
    - Kiểm tra tính toàn vẹn trạng thái và quyền (sessions, transcripts, thư mục trạng thái).
    - Kiểm tra quyền tệp cấu hình (chmod 600) khi chạy cục bộ.
    - Tình trạng xác thực mô hình: kiểm tra OAuth hết hạn, có thể làm mới token sắp hết hạn và báo cáo trạng thái cooldown/bị vô hiệu hóa của auth-profile.
    - Phát hiện thư mục workspace bổ sung (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, dịch vụ và supervisor">
    - Sửa image sandbox khi sandboxing được bật.
    - Di chuyển dịch vụ cũ và phát hiện gateway bổ sung.
    - Di chuyển trạng thái cũ của kênh Matrix (ở chế độ `--fix` / `--repair`).
    - Kiểm tra runtime Gateway (dịch vụ đã cài nhưng không chạy; nhãn launchd được lưu trong cache).
    - Cảnh báo trạng thái kênh (được thăm dò từ gateway đang chạy).
    - Kiểm tra khả năng phản hồi WhatsApp khi tình trạng vòng lặp sự kiện Gateway suy giảm trong lúc client TUI cục bộ vẫn chạy; `--fix` chỉ dừng các client TUI cục bộ đã được xác minh.
    - Sửa route Codex cho các tham chiếu mô hình `openai-codex/*` cũ trong mô hình chính, fallback, ghi đè heartbeat/subagent/compaction, hook, ghi đè mô hình kênh và pin route phiên; `--fix` ghi lại chúng thành `openai/*` và chỉ chọn `agentRuntime.id: "codex"` khi plugin Codex đã được cài đặt, bật, đóng góp harness `codex` và có OAuth dùng được. Nếu không, công cụ chọn `agentRuntime.id: "pi"`.
    - Kiểm toán cấu hình supervisor (launchd/systemd/schtasks) với sửa chữa tùy chọn.
    - Dọn dẹp môi trường proxy nhúng cho các dịch vụ gateway đã ghi lại giá trị shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` trong lúc cài đặt hoặc cập nhật.
    - Kiểm tra best practice runtime Gateway (Node so với Bun, đường dẫn trình quản lý phiên bản).
    - Chẩn đoán xung đột cổng Gateway (mặc định `18789`).

  </Accordion>
  <Accordion title="Xác thực, bảo mật và ghép đôi">
    - Cảnh báo bảo mật cho chính sách DM mở.
    - Kiểm tra xác thực Gateway cho chế độ token cục bộ (đề xuất tạo token khi không có nguồn token; không ghi đè cấu hình token SecretRef).
    - Phát hiện sự cố ghép đôi thiết bị (yêu cầu ghép đôi lần đầu đang chờ, nâng cấp vai trò/phạm vi đang chờ, độ lệch cache device-token cục bộ cũ và độ lệch xác thực bản ghi đã ghép đôi).

  </Accordion>
  <Accordion title="Workspace và shell">
    - Kiểm tra systemd linger trên Linux.
    - Kiểm tra kích thước tệp bootstrap workspace (cảnh báo bị cắt/gần giới hạn cho tệp ngữ cảnh).
    - Kiểm tra mức sẵn sàng của Skills cho agent mặc định; báo cáo các skill được phép nhưng thiếu binary, env, cấu hình hoặc yêu cầu OS, và `--fix` có thể vô hiệu hóa các skill không khả dụng trong `skills.entries`.
    - Kiểm tra trạng thái shell completion và tự động cài đặt/nâng cấp.
    - Kiểm tra mức sẵn sàng của nhà cung cấp embedding tìm kiếm bộ nhớ (mô hình cục bộ, khóa API từ xa hoặc binary QMD).
    - Kiểm tra bản cài đặt từ nguồn (pnpm workspace không khớp, thiếu asset UI, thiếu binary tsx).
    - Ghi cấu hình đã cập nhật + metadata wizard.

  </Accordion>
</AccordionGroup>

## Backfill và reset UI Dreams

Cảnh Control UI Dreams bao gồm các hành động **Backfill**, **Reset** và **Clear Grounded** cho quy trình grounded dreaming. Các hành động này dùng các phương thức RPC kiểu gateway doctor, nhưng chúng **không** phải là một phần của sửa chữa/di chuyển CLI `openclaw doctor`.

Những việc các hành động này làm:

- **Backfill** quét các tệp `memory/YYYY-MM-DD.md` lịch sử trong workspace đang hoạt động, chạy lượt nhật ký grounded REM và ghi các mục backfill có thể đảo ngược vào `DREAMS.md`.
- **Reset** chỉ xóa các mục nhật ký backfill đã được đánh dấu đó khỏi `DREAMS.md`.
- **Clear Grounded** chỉ xóa các mục ngắn hạn chỉ grounded đã được staged, đến từ phát lại lịch sử và chưa tích lũy live recall hoặc hỗ trợ hằng ngày.

Những việc các hành động này **không** tự làm:

- chúng không chỉnh sửa `MEMORY.md`
- chúng không chạy đầy đủ các lần di chuyển của doctor
- chúng không tự động stage các ứng viên grounded vào kho thăng hạng ngắn hạn đang hoạt động trừ khi bạn chạy rõ ràng đường dẫn CLI staged trước

Nếu bạn muốn phát lại lịch sử grounded ảnh hưởng đến lane thăng hạng sâu thông thường, hãy dùng luồng CLI thay thế:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Lệnh đó stage các ứng viên durable grounded vào kho dreaming ngắn hạn trong khi vẫn giữ `DREAMS.md` làm bề mặt xem xét.

## Hành vi chi tiết và lý do

<AccordionGroup>
  <Accordion title="0. Cập nhật tùy chọn (bản cài đặt git)">
    Nếu đây là một git checkout và doctor đang chạy tương tác, công cụ sẽ đề xuất cập nhật (fetch/rebase/build) trước khi chạy doctor.
  </Accordion>
  <Accordion title="1. Chuẩn hóa cấu hình">
    Nếu cấu hình chứa các dạng giá trị cũ (ví dụ `messages.ackReaction` không có ghi đè dành riêng cho kênh), doctor chuẩn hóa chúng vào schema hiện tại.

    Điều đó bao gồm các trường phẳng Talk cũ. Cấu hình speech Talk công khai hiện tại là `talk.provider` + `talk.providers.<provider>`, và cấu hình giọng nói realtime là `talk.realtime.*`. Doctor ghi lại các dạng `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` cũ vào map nhà cung cấp, và ghi lại các bộ chọn realtime cấp cao nhất cũ (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) vào `talk.realtime`.

    Doctor cũng cảnh báo khi `plugins.allow` không rỗng và chính sách công cụ dùng
    các mục công cụ wildcard hoặc do plugin sở hữu. `tools.allow: ["*"]` chỉ khớp các công cụ
    từ plugin thực sự được tải; nó không bỏ qua danh sách cho phép plugin độc quyền.
    Doctor ghi `plugins.bundledDiscovery: "compat"` cho các cấu hình danh sách cho phép
    cũ đã di chuyển để giữ nguyên hành vi nhà cung cấp đi kèm hiện có, rồi
    trỏ đến thiết lập `"allowlist"` nghiêm ngặt hơn.

  </Accordion>
  <Accordion title="2. Di chuyển khóa cấu hình cũ">
    Khi cấu hình chứa các khóa đã lỗi thời, các lệnh khác từ chối chạy và yêu cầu bạn chạy `openclaw doctor`.

    Doctor sẽ:

    - Giải thích các khóa cũ nào đã được tìm thấy.
    - Hiển thị lần di chuyển mà công cụ đã áp dụng.
    - Ghi lại `~/.openclaw/openclaw.json` với schema đã cập nhật.

    Startup Gateway từ chối các định dạng cấu hình cũ và yêu cầu bạn chạy `openclaw doctor --fix`; nó không ghi lại `openclaw.json` khi startup. Các lần di chuyển kho job Cron cũng do `openclaw doctor --fix` xử lý.

    Các lần di chuyển hiện tại:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - các cấu hình kênh đã cấu hình thiếu chính sách trả lời hiển thị → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` cấp cao nhất
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` cũ → `talk.provider` + `talk.providers.<provider>`
    - các bộ chọn Talk thời gian thực cấp cao nhất cũ (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Với các kênh có `accounts` được đặt tên nhưng vẫn còn các giá trị kênh cấp cao nhất dành cho một tài khoản, hãy chuyển các giá trị theo phạm vi tài khoản đó vào tài khoản đã được nâng cấp được chọn cho kênh đó (`accounts.default` cho hầu hết các kênh; Matrix có thể giữ một đích được đặt tên/mặc định hiện có khớp)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - xóa `agents.defaults.llm`; dùng `models.providers.<id>.timeoutSeconds` cho thời gian chờ dài của provider/model chậm
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - xóa `browser.relayBindHost` (thiết lập relay extension cũ)
    - `models.providers.*.api: "openai"` cũ → `"openai-completions"` (Gateway khi khởi động cũng bỏ qua các provider có `api` được đặt thành một giá trị enum tương lai hoặc không xác định thay vì thất bại đóng)

    Các cảnh báo của doctor cũng bao gồm hướng dẫn về tài khoản mặc định cho các kênh nhiều tài khoản:

    - Nếu có hai hoặc nhiều mục `channels.<channel>.accounts` được cấu hình mà không có `channels.<channel>.defaultAccount` hoặc `accounts.default`, doctor cảnh báo rằng định tuyến dự phòng có thể chọn một tài khoản không mong muốn.
    - Nếu `channels.<channel>.defaultAccount` được đặt thành một ID tài khoản không xác định, doctor cảnh báo và liệt kê các ID tài khoản đã cấu hình.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    Nếu bạn đã thêm thủ công `models.providers.opencode`, `opencode-zen`, hoặc `opencode-go`, cấu hình đó sẽ ghi đè catalog OpenCode tích hợp sẵn từ `@mariozechner/pi-ai`. Điều đó có thể buộc model dùng sai API hoặc đưa chi phí về không. Doctor cảnh báo để bạn có thể xóa phần ghi đè và khôi phục định tuyến API + chi phí theo từng model.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    Nếu cấu hình trình duyệt của bạn vẫn trỏ đến đường dẫn Chrome extension đã bị xóa, doctor sẽ chuẩn hóa nó về mô hình gắn Chrome MCP cục bộ trên máy chủ hiện tại:

    - `browser.profiles.*.driver: "extension"` trở thành `"existing-session"`
    - `browser.relayBindHost` bị xóa

    Doctor cũng kiểm tra đường dẫn Chrome MCP cục bộ trên máy chủ khi bạn dùng `defaultProfile: "user"` hoặc một hồ sơ `existing-session` đã cấu hình:

    - kiểm tra xem Google Chrome có được cài trên cùng máy chủ cho các hồ sơ tự động kết nối mặc định hay không
    - kiểm tra phiên bản Chrome được phát hiện và cảnh báo khi phiên bản đó thấp hơn Chrome 144
    - nhắc bạn bật gỡ lỗi từ xa trong trang kiểm tra của trình duyệt (ví dụ `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, hoặc `edge://inspect/#remote-debugging`)

    Doctor không thể bật thiết lập phía Chrome cho bạn. Chrome MCP cục bộ trên máy chủ vẫn yêu cầu:

    - trình duyệt dựa trên Chromium 144+ trên máy chủ gateway/node
    - trình duyệt đang chạy cục bộ
    - gỡ lỗi từ xa đã bật trong trình duyệt đó
    - phê duyệt lời nhắc đồng ý gắn lần đầu trong trình duyệt

    Trạng thái sẵn sàng ở đây chỉ nói về các điều kiện tiên quyết để gắn cục bộ. Existing-session giữ các giới hạn tuyến Chrome MCP hiện tại; các tuyến nâng cao như `responsebody`, xuất PDF, chặn tải xuống, và thao tác hàng loạt vẫn yêu cầu trình duyệt được quản lý hoặc hồ sơ CDP thô.

    Kiểm tra này **không** áp dụng cho Docker, sandbox, remote-browser, hoặc các luồng headless khác. Những luồng đó tiếp tục dùng CDP thô.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    Khi một hồ sơ OpenAI Codex OAuth được cấu hình, doctor thăm dò endpoint ủy quyền OpenAI để xác minh rằng ngăn xếp TLS Node/OpenSSL cục bộ có thể xác thực chuỗi chứng chỉ. Nếu thăm dò thất bại với lỗi chứng chỉ (ví dụ `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, chứng chỉ hết hạn, hoặc chứng chỉ tự ký), doctor in hướng dẫn sửa lỗi theo từng nền tảng. Trên macOS với Node từ Homebrew, cách sửa thường là `brew postinstall ca-certificates`. Với `--deep`, thăm dò vẫn chạy ngay cả khi gateway khỏe mạnh.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    Nếu trước đây bạn đã thêm các thiết lập truyền tải OpenAI cũ dưới `models.providers.openai-codex`, chúng có thể che khuất đường dẫn provider Codex OAuth tích hợp sẵn mà các bản phát hành mới hơn tự động dùng. Doctor cảnh báo khi thấy các thiết lập truyền tải cũ đó đi kèm Codex OAuth để bạn có thể xóa hoặc viết lại phần ghi đè truyền tải lỗi thời và lấy lại hành vi định tuyến/dự phòng tích hợp sẵn. Proxy tùy chỉnh và các ghi đè chỉ header vẫn được hỗ trợ và không kích hoạt cảnh báo này.
  </Accordion>
  <Accordion title="2f. Codex route repair">
    Doctor kiểm tra các tham chiếu model `openai-codex/*` cũ. Định tuyến bộ điều khiển Codex gốc dùng các tham chiếu model chuẩn `openai/*` cộng với `agentRuntime.id: "codex"` để lượt chạy đi qua bộ điều khiển app-server Codex thay vì đường dẫn OpenClaw PI OpenAI.

    Trong chế độ `--fix` / `--repair`, doctor viết lại các tham chiếu agent mặc định và theo từng agent bị ảnh hưởng, bao gồm model chính, dự phòng, ghi đè heartbeat/subagent/compaction, hooks, ghi đè model theo kênh, và trạng thái tuyến phiên đã lưu lỗi thời:

    - `openai-codex/gpt-*` trở thành `openai/gpt-*`.
    - Runtime agent khớp trở thành `agentRuntime.id: "codex"` chỉ khi Codex được cài đặt, bật, đóng góp bộ điều khiển `codex`, và có OAuth dùng được.
    - Nếu không, runtime agent khớp trở thành `agentRuntime.id: "pi"`.
    - Các danh sách model dự phòng hiện có được giữ lại với các mục cũ được viết lại; thiết lập theo từng model được sao chép sẽ chuyển từ khóa cũ sang khóa chuẩn `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, thông báo dự phòng, ghim hồ sơ xác thực, và ghim bộ điều khiển Codex đã lưu trong phiên được sửa trên tất cả kho phiên agent được phát hiện.
    - `/codex ...` có nghĩa là "điều khiển hoặc liên kết một cuộc trò chuyện Codex gốc từ chat."
    - `/acp ...` hoặc `runtime: "acp"` có nghĩa là "dùng adapter ACP/acpx bên ngoài."

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    Doctor cũng quét các kho phiên agent được phát hiện để tìm trạng thái tuyến tự động tạo lỗi thời sau khi bạn chuyển model đã cấu hình hoặc runtime khỏi một tuyến do Plugin sở hữu, chẳng hạn như Codex.

    `openclaw doctor --fix` có thể xóa trạng thái lỗi thời được tự động tạo như ghim model `modelOverrideSource: "auto"`, siêu dữ liệu model runtime, ID bộ điều khiển đã ghim, liên kết phiên CLI, và ghi đè hồ sơ xác thực tự động khi tuyến sở hữu chúng không còn được cấu hình. Các lựa chọn model phiên rõ ràng của người dùng hoặc cũ được báo cáo để xem xét thủ công và giữ nguyên; hãy chuyển chúng bằng `/model ...`, `/new`, hoặc đặt lại phiên khi tuyến đó không còn được dự định dùng.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor có thể di chuyển các bố cục cũ trên đĩa sang cấu trúc hiện tại:

    - Kho phiên + bản ghi hội thoại:
      - từ `~/.openclaw/sessions/` sang `~/.openclaw/agents/<agentId>/sessions/`
    - Thư mục agent:
      - từ `~/.openclaw/agent/` sang `~/.openclaw/agents/<agentId>/agent/`
    - Trạng thái xác thực WhatsApp (Baileys):
      - từ `~/.openclaw/credentials/*.json` cũ (ngoại trừ `oauth.json`)
      - sang `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID tài khoản mặc định: `default`)

    Các lần di chuyển này là nỗ lực tối đa và lũy đẳng; doctor sẽ phát cảnh báo khi để lại bất kỳ thư mục cũ nào làm bản sao lưu. Gateway/CLI cũng tự động di chuyển kho phiên + thư mục agent cũ khi khởi động để lịch sử/xác thực/model nằm trong đường dẫn theo từng agent mà không cần chạy doctor thủ công. Xác thực WhatsApp được cố ý chỉ di chuyển qua `openclaw doctor`. Việc chuẩn hóa provider/bản đồ provider của Talk giờ so sánh bằng bình đẳng cấu trúc, nên các khác biệt chỉ về thứ tự khóa không còn kích hoạt lặp lại các thay đổi `doctor --fix` không có hiệu lực.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor quét tất cả manifest Plugin đã cài đặt để tìm các khóa capability cấp cao nhất không còn dùng (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Khi tìm thấy, doctor đề nghị chuyển chúng vào đối tượng `contracts` và viết lại tệp manifest tại chỗ. Lần di chuyển này là lũy đẳng; nếu khóa `contracts` đã có cùng các giá trị, khóa cũ sẽ bị xóa mà không nhân đôi dữ liệu.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor cũng kiểm tra kho tác vụ Cron (`~/.openclaw/cron/jobs.json` theo mặc định, hoặc `cron.store` khi được ghi đè) để tìm các dạng tác vụ cũ mà bộ lập lịch vẫn chấp nhận để tương thích.

    Các dọn dẹp Cron hiện tại bao gồm:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - các trường payload cấp cao nhất (`message`, `model`, `thinking`, ...) → `payload`
    - các trường delivery cấp cao nhất (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - bí danh delivery `provider` trong payload → `delivery.channel` rõ ràng
    - các tác vụ dự phòng Webhook `notify: true` đơn giản cũ → `delivery.mode="webhook"` rõ ràng với `delivery.to=cron.webhook`

    Doctor chỉ tự động di trú các tác vụ `notify: true` khi có thể làm vậy mà không thay đổi hành vi. Nếu một tác vụ kết hợp cơ chế dự phòng notify cũ với một chế độ phân phối không phải webhook đã tồn tại, doctor sẽ cảnh báo và để tác vụ đó lại để xem xét thủ công.

    Trên Linux, doctor cũng cảnh báo khi crontab của người dùng vẫn gọi `~/.openclaw/bin/ensure-whatsapp.sh` cũ. Script cục bộ trên máy chủ đó không được OpenClaw hiện tại duy trì và có thể ghi các thông báo `Gateway inactive` sai vào `~/.openclaw/logs/whatsapp-health.log` khi cron không thể truy cập systemd user bus. Gỡ mục crontab cũ bằng `crontab -e`; dùng `openclaw channels status --probe`, `openclaw doctor`, và `openclaw gateway status` cho các kiểm tra tình trạng hiện tại.

  </Accordion>
  <Accordion title="3c. Dọn dẹp khóa phiên">
    Doctor quét mọi thư mục phiên tác tử để tìm các tệp khóa ghi cũ — những tệp bị bỏ lại khi một phiên thoát bất thường. Với mỗi tệp khóa tìm thấy, doctor báo cáo: đường dẫn, PID, PID còn sống hay không, tuổi khóa, và liệu khóa có được xem là cũ hay không (PID đã chết hoặc cũ hơn 30 phút). Ở chế độ `--fix` / `--repair`, doctor tự động xóa các tệp khóa cũ; nếu không, doctor in ghi chú và hướng dẫn bạn chạy lại với `--fix`.
  </Accordion>
  <Accordion title="3d. Sửa nhánh bản ghi phiên">
    Doctor quét các tệp JSONL phiên tác tử để tìm dạng nhánh bị nhân đôi do lỗi viết lại bản ghi lời nhắc ngày 2026.4.24 tạo ra: một lượt người dùng bị bỏ rơi có ngữ cảnh runtime nội bộ của OpenClaw cộng với một nhánh anh em đang hoạt động chứa cùng lời nhắc người dùng hiển thị. Ở chế độ `--fix` / `--repair`, doctor sao lưu từng tệp bị ảnh hưởng cạnh tệp gốc và viết lại bản ghi về nhánh đang hoạt động để lịch sử Gateway và các trình đọc bộ nhớ không còn thấy các lượt trùng lặp.
  </Accordion>
  <Accordion title="4. Kiểm tra toàn vẹn trạng thái (duy trì phiên, định tuyến và an toàn)">
    Thư mục trạng thái là trục vận hành cốt lõi. Nếu nó biến mất, bạn sẽ mất phiên, thông tin xác thực, nhật ký và cấu hình (trừ khi bạn có bản sao lưu ở nơi khác).

    Doctor kiểm tra:

    - **Thiếu thư mục trạng thái**: cảnh báo về mất trạng thái nghiêm trọng, nhắc tạo lại thư mục, và nhắc bạn rằng nó không thể khôi phục dữ liệu bị thiếu.
    - **Quyền thư mục trạng thái**: xác minh khả năng ghi; đề xuất sửa quyền (và phát gợi ý `chown` khi phát hiện chủ sở hữu/nhóm không khớp).
    - **Thư mục trạng thái được đồng bộ đám mây trên macOS**: cảnh báo khi trạng thái phân giải dưới iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) hoặc `~/Library/CloudStorage/...` vì các đường dẫn dựa trên đồng bộ có thể gây I/O chậm hơn và các cuộc đua khóa/đồng bộ.
    - **Thư mục trạng thái SD hoặc eMMC trên Linux**: cảnh báo khi trạng thái phân giải tới một nguồn gắn kết `mmcblk*`, vì I/O ngẫu nhiên dựa trên SD hoặc eMMC có thể chậm hơn và mòn nhanh hơn khi ghi phiên và thông tin xác thực.
    - **Thiếu thư mục phiên**: `sessions/` và thư mục kho phiên là bắt buộc để duy trì lịch sử và tránh lỗi `ENOENT`.
    - **Bản ghi không khớp**: cảnh báo khi các mục phiên gần đây thiếu tệp bản ghi.
    - **Phiên chính "JSONL 1 dòng"**: đánh dấu khi bản ghi chính chỉ có một dòng (lịch sử không được tích lũy).
    - **Nhiều thư mục trạng thái**: cảnh báo khi có nhiều thư mục `~/.openclaw` tồn tại trên các thư mục home hoặc khi `OPENCLAW_STATE_DIR` trỏ tới nơi khác (lịch sử có thể bị tách giữa các bản cài đặt).
    - **Nhắc nhở chế độ từ xa**: nếu `gateway.mode=remote`, doctor nhắc bạn chạy nó trên máy chủ từ xa (trạng thái nằm ở đó).
    - **Quyền tệp cấu hình**: cảnh báo nếu `~/.openclaw/openclaw.json` có thể đọc bởi nhóm/toàn thế giới và đề xuất siết lại thành `600`.

  </Accordion>
  <Accordion title="5. Tình trạng xác thực mô hình (OAuth hết hạn)">
    Doctor kiểm tra các hồ sơ OAuth trong kho xác thực, cảnh báo khi token sắp hết hạn/đã hết hạn, và có thể làm mới chúng khi an toàn. Nếu hồ sơ Anthropic OAuth/token đã cũ, doctor đề xuất khóa API Anthropic hoặc đường dẫn setup-token Anthropic. Lời nhắc làm mới chỉ xuất hiện khi chạy tương tác (TTY); `--non-interactive` bỏ qua các lần thử làm mới.

    Khi làm mới OAuth thất bại vĩnh viễn (ví dụ `refresh_token_reused`, `invalid_grant`, hoặc nhà cung cấp yêu cầu bạn đăng nhập lại), doctor báo rằng cần xác thực lại và in chính xác lệnh `openclaw models auth login --provider ...` cần chạy.

    Doctor cũng báo cáo các hồ sơ xác thực tạm thời không dùng được do:

    - thời gian chờ ngắn (giới hạn tốc độ/hết thời gian chờ/lỗi xác thực)
    - vô hiệu hóa lâu hơn (lỗi thanh toán/tín dụng)

  </Accordion>
  <Accordion title="6. Xác thực mô hình hooks">
    Nếu `hooks.gmail.model` được đặt, doctor xác thực tham chiếu mô hình với danh mục và danh sách cho phép, rồi cảnh báo khi tham chiếu đó không phân giải được hoặc không được cho phép.
  </Accordion>
  <Accordion title="7. Sửa ảnh sandbox">
    Khi sandboxing được bật, doctor kiểm tra các ảnh Docker và đề xuất xây dựng hoặc chuyển sang tên cũ nếu thiếu ảnh hiện tại.
  </Accordion>
  <Accordion title="7b. Dọn dẹp cài đặt Plugin">
    Doctor xóa trạng thái staging phụ thuộc Plugin cũ do OpenClaw tạo ở chế độ `openclaw doctor --fix` / `openclaw doctor --repair`. Phạm vi này bao gồm các gốc phụ thuộc được tạo đã cũ, thư mục giai đoạn cài đặt cũ, phần dư cục bộ theo package từ mã sửa phụ thuộc bundled-plugin trước đây, và các bản sao npm được quản lý của Plugin `@openclaw/*` đi kèm bị bỏ mồ côi hoặc đã khôi phục có thể che khuất manifest đi kèm hiện tại.

    Doctor cũng có thể cài đặt lại các Plugin có thể tải xuống bị thiếu khi cấu hình tham chiếu tới chúng nhưng registry Plugin cục bộ không tìm thấy. Ví dụ gồm `plugins.entries` vật chất, cài đặt channel/provider/search đã cấu hình, và runtime tác tử đã cấu hình. Trong lúc cập nhật package, doctor tránh chạy sửa Plugin bằng trình quản lý package trong khi package lõi đang được thay thế; chạy lại `openclaw doctor --fix` sau cập nhật nếu một Plugin đã cấu hình vẫn cần khôi phục. Khởi động Gateway và tải lại cấu hình không chạy trình quản lý package; cài đặt Plugin vẫn là công việc doctor/install/update rõ ràng.

  </Accordion>
  <Accordion title="8. Di trú dịch vụ Gateway và gợi ý dọn dẹp">
    Doctor phát hiện các dịch vụ Gateway cũ (launchd/systemd/schtasks) và đề xuất xóa chúng rồi cài đặt dịch vụ OpenClaw bằng cổng Gateway hiện tại. Doctor cũng có thể quét các dịch vụ giống Gateway dư thừa và in gợi ý dọn dẹp. Các dịch vụ Gateway OpenClaw có tên theo hồ sơ được xem là hạng nhất và không bị đánh dấu là "dư thừa."

    Trên Linux, nếu thiếu dịch vụ Gateway cấp người dùng nhưng tồn tại dịch vụ Gateway OpenClaw cấp hệ thống, doctor không tự động cài đặt dịch vụ cấp người dùng thứ hai. Kiểm tra bằng `openclaw gateway status --deep` hoặc `openclaw doctor --deep`, rồi xóa bản trùng lặp hoặc đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một trình giám sát hệ thống sở hữu vòng đời Gateway.

  </Accordion>
  <Accordion title="8b. Di trú Startup Matrix">
    Khi một tài khoản channel Matrix có di trú trạng thái cũ đang chờ hoặc có thể xử lý, doctor (ở chế độ `--fix` / `--repair`) tạo ảnh chụp trước di trú rồi chạy các bước di trú theo nỗ lực tốt nhất: di trú trạng thái Matrix cũ và chuẩn bị trạng thái mã hóa cũ. Cả hai bước đều không gây lỗi nghiêm trọng; lỗi được ghi nhật ký và quá trình khởi động tiếp tục. Ở chế độ chỉ đọc (`openclaw doctor` không có `--fix`), kiểm tra này bị bỏ qua hoàn toàn.
  </Accordion>
  <Accordion title="8c. Ghép đôi thiết bị và lệch xác thực">
    Doctor hiện kiểm tra trạng thái ghép đôi thiết bị trong lượt kiểm tra tình trạng bình thường.

    Những gì doctor báo cáo:

    - yêu cầu ghép đôi lần đầu đang chờ
    - nâng cấp vai trò đang chờ cho các thiết bị đã ghép đôi
    - nâng cấp phạm vi đang chờ cho các thiết bị đã ghép đôi
    - sửa lỗi không khớp khóa công khai khi id thiết bị vẫn khớp nhưng danh tính thiết bị không còn khớp bản ghi đã phê duyệt
    - bản ghi đã ghép đôi thiếu token đang hoạt động cho một vai trò đã phê duyệt
    - token đã ghép đôi có phạm vi lệch khỏi đường cơ sở ghép đôi đã phê duyệt
    - các mục token thiết bị được lưu đệm cục bộ cho máy hiện tại có từ trước một lần xoay vòng token phía Gateway hoặc mang siêu dữ liệu phạm vi cũ

    Doctor không tự động phê duyệt yêu cầu ghép đôi hoặc tự động xoay vòng token thiết bị. Thay vào đó doctor in các bước tiếp theo chính xác:

    - kiểm tra yêu cầu đang chờ bằng `openclaw devices list`
    - phê duyệt yêu cầu chính xác bằng `openclaw devices approve <requestId>`
    - xoay vòng token mới bằng `openclaw devices rotate --device <deviceId> --role <role>`
    - xóa và phê duyệt lại bản ghi cũ bằng `openclaw devices remove <deviceId>`

    Việc này khép lại lỗ hổng phổ biến "đã ghép đôi nhưng vẫn bị yêu cầu ghép đôi": doctor giờ phân biệt ghép đôi lần đầu với nâng cấp vai trò/phạm vi đang chờ và với lệch token/danh tính thiết bị đã cũ.

  </Accordion>
  <Accordion title="9. Cảnh báo bảo mật">
    Doctor phát cảnh báo khi một nhà cung cấp mở DM mà không có danh sách cho phép, hoặc khi một chính sách được cấu hình theo cách nguy hiểm.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Nếu chạy như một dịch vụ người dùng systemd, doctor đảm bảo linger được bật để Gateway vẫn sống sau khi đăng xuất.
  </Accordion>
  <Accordion title="11. Trạng thái workspace (Skills, Plugin và thư mục cũ)">
    Doctor in tóm tắt trạng thái workspace cho tác tử mặc định:

    - **Trạng thái Skills**: đếm Skills đủ điều kiện, thiếu yêu cầu, và bị danh sách cho phép chặn.
    - **Thư mục workspace cũ**: cảnh báo khi `~/openclaw` hoặc các thư mục workspace cũ khác tồn tại cùng workspace hiện tại.
    - **Trạng thái Plugin**: đếm Plugin được bật/bị tắt/bị lỗi; liệt kê ID Plugin cho mọi lỗi; báo cáo khả năng của Plugin gói đi kèm.
    - **Cảnh báo tương thích Plugin**: đánh dấu các Plugin có vấn đề tương thích với runtime hiện tại.
    - **Chẩn đoán Plugin**: hiển thị mọi cảnh báo hoặc lỗi tại thời điểm tải do registry Plugin phát ra.

  </Accordion>
  <Accordion title="11b. Kích thước tệp bootstrap">
    Doctor kiểm tra liệu các tệp bootstrap workspace (ví dụ `AGENTS.md`, `CLAUDE.md`, hoặc các tệp ngữ cảnh được chèn khác) có gần hoặc vượt ngân sách ký tự đã cấu hình hay không. Doctor báo cáo số ký tự thô so với số ký tự được chèn theo từng tệp, phần trăm cắt bớt, nguyên nhân cắt bớt (`max/file` hoặc `max/total`), và tổng ký tự được chèn dưới dạng một phần của tổng ngân sách. Khi các tệp bị cắt bớt hoặc gần giới hạn, doctor in mẹo để điều chỉnh `agents.defaults.bootstrapMaxChars` và `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Dọn dẹp Plugin channel cũ">
    Khi `openclaw doctor --fix` xóa một Plugin channel bị thiếu, nó cũng xóa cấu hình treo theo phạm vi channel đã tham chiếu Plugin đó: các mục `channels.<id>`, mục tiêu Heartbeat đã đặt tên channel, và ghi đè `agents.*.models["<channel>/*"]`. Việc này ngăn vòng lặp khởi động Gateway khi runtime channel đã biến mất nhưng cấu hình vẫn yêu cầu Gateway bind tới nó.
  </Accordion>
  <Accordion title="11c. Hoàn thành shell">
    Doctor kiểm tra liệu hoàn thành tab đã được cài đặt cho shell hiện tại hay chưa (zsh, bash, fish, hoặc PowerShell):

    - Nếu hồ sơ shell dùng mẫu hoàn thành động chậm (`source <(openclaw completion ...)`), doctor nâng cấp nó lên biến thể tệp lưu đệm nhanh hơn.
    - Nếu hoàn thành được cấu hình trong hồ sơ nhưng thiếu tệp lưu đệm, doctor tự động tạo lại lưu đệm.
    - Nếu chưa cấu hình hoàn thành, doctor nhắc cài đặt (chỉ ở chế độ tương tác; bị bỏ qua với `--non-interactive`).

    Chạy `openclaw completion --write-state` để tạo lại lưu đệm thủ công.

  </Accordion>
  <Accordion title="12. Kiểm tra xác thực Gateway (token cục bộ)">
    Doctor kiểm tra trạng thái sẵn sàng xác thực token Gateway cục bộ.

    - Nếu chế độ token cần token và không có nguồn token nào tồn tại, doctor đề xuất tạo một token.
    - Nếu `gateway.auth.token` được SecretRef quản lý nhưng không khả dụng, doctor cảnh báo và không ghi đè nó bằng văn bản thuần.
    - `openclaw doctor --generate-gateway-token` chỉ buộc tạo khi không có SecretRef token nào được cấu hình.

  </Accordion>
  <Accordion title="12b. Sửa chữa nhận biết SecretRef ở chế độ chỉ đọc">
    Một số luồng sửa chữa cần kiểm tra thông tin xác thực đã cấu hình mà không làm suy yếu hành vi lỗi nhanh của runtime.

    - `openclaw doctor --fix` hiện dùng cùng mô hình tóm tắt SecretRef chỉ đọc như các lệnh thuộc nhóm trạng thái để sửa chữa cấu hình có mục tiêu.
    - Ví dụ: quy trình sửa chữa Telegram `allowFrom` / `groupAllowFrom` `@username` cố gắng dùng thông tin xác thực bot đã cấu hình khi có sẵn.
    - Nếu mã thông báo bot Telegram được cấu hình qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại, doctor báo cáo rằng thông tin xác thực đã được cấu hình nhưng không khả dụng và bỏ qua tự động phân giải thay vì bị lỗi hoặc báo sai rằng mã thông báo bị thiếu.

  </Accordion>
  <Accordion title="13. Kiểm tra tình trạng Gateway + khởi động lại">
    Doctor chạy kiểm tra tình trạng và đề nghị khởi động lại gateway khi có vẻ không khỏe mạnh.
  </Accordion>
  <Accordion title="13b. Mức sẵn sàng của tìm kiếm bộ nhớ">
    Doctor kiểm tra xem nhà cung cấp embedding tìm kiếm bộ nhớ đã cấu hình có sẵn sàng cho agent mặc định hay không. Hành vi phụ thuộc vào backend và nhà cung cấp đã cấu hình:

    - **Backend QMD**: thăm dò xem binary `qmd` có sẵn và có thể khởi động hay không. Nếu không, in hướng dẫn khắc phục bao gồm gói npm và một tùy chọn đường dẫn binary thủ công.
    - **Nhà cung cấp cục bộ tường minh**: kiểm tra tệp mô hình cục bộ hoặc URL mô hình từ xa/có thể tải xuống được nhận diện. Nếu thiếu, đề xuất chuyển sang nhà cung cấp từ xa.
    - **Nhà cung cấp từ xa tường minh** (`openai`, `voyage`, v.v.): xác minh khóa API có trong môi trường hoặc kho xác thực. In gợi ý khắc phục có thể thực hiện nếu thiếu.
    - **Nhà cung cấp tự động**: kiểm tra khả dụng của mô hình cục bộ trước, rồi thử từng nhà cung cấp từ xa theo thứ tự tự động chọn.

    Khi có kết quả thăm dò gateway được lưu trong bộ nhớ đệm (gateway khỏe mạnh tại thời điểm kiểm tra), doctor đối chiếu kết quả đó với cấu hình mà CLI nhìn thấy và ghi chú mọi điểm khác biệt. Doctor không bắt đầu ping embedding mới trong đường dẫn mặc định; hãy dùng lệnh trạng thái bộ nhớ sâu khi bạn muốn kiểm tra nhà cung cấp trực tiếp.

    Dùng `openclaw memory status --deep` để xác minh mức sẵn sàng của embedding trong runtime.

  </Accordion>
  <Accordion title="14. Cảnh báo trạng thái kênh">
    Nếu gateway khỏe mạnh, doctor chạy thăm dò trạng thái kênh và báo cáo cảnh báo kèm các cách khắc phục được đề xuất.
  </Accordion>
  <Accordion title="15. Kiểm tra + sửa chữa cấu hình supervisor">
    Doctor kiểm tra cấu hình supervisor đã cài đặt (launchd/systemd/schtasks) để tìm các mặc định bị thiếu hoặc lỗi thời (ví dụ: phụ thuộc systemd network-online và độ trễ khởi động lại). Khi tìm thấy điểm không khớp, nó khuyến nghị cập nhật và có thể ghi lại tệp service/tác vụ theo các mặc định hiện tại.

    Ghi chú:

    - `openclaw doctor` nhắc trước khi ghi lại cấu hình supervisor.
    - `openclaw doctor --yes` chấp nhận các lời nhắc sửa chữa mặc định.
    - `openclaw doctor --repair` áp dụng các bản sửa được khuyến nghị mà không nhắc.
    - `openclaw doctor --repair --force` ghi đè cấu hình supervisor tùy chỉnh.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` giữ doctor ở chế độ chỉ đọc đối với vòng đời service gateway. Nó vẫn báo cáo tình trạng service và chạy các sửa chữa không liên quan đến service, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap service, ghi lại cấu hình supervisor và dọn dẹp service cũ vì một supervisor bên ngoài sở hữu vòng đời đó.
    - Trên Linux, doctor không ghi lại metadata lệnh/điểm vào trong khi unit gateway systemd khớp đang hoạt động. Nó cũng bỏ qua các unit bổ sung giống gateway không hoạt động và không phải loại cũ trong quá trình quét service trùng lặp để các tệp service đồng hành không tạo nhiễu dọn dẹp.
    - Nếu xác thực bằng mã thông báo yêu cầu mã thông báo và `gateway.auth.token` được quản lý bằng SecretRef, cài đặt/sửa chữa service của doctor xác thực SecretRef nhưng không lưu bền các giá trị mã thông báo văn bản thuần đã phân giải vào metadata môi trường service của supervisor.
    - Doctor phát hiện các giá trị môi trường service được quản lý bằng `.env`/SecretRef mà các bản cài đặt LaunchAgent, systemd hoặc Windows Scheduled Task cũ đã nhúng nội tuyến và ghi lại metadata service để các giá trị đó được tải từ nguồn runtime thay vì định nghĩa supervisor.
    - Doctor phát hiện khi lệnh service vẫn ghim `--port` cũ sau khi `gateway.port` thay đổi và ghi lại metadata service sang cổng hiện tại.
    - Nếu xác thực bằng mã thông báo yêu cầu mã thông báo và SecretRef mã thông báo đã cấu hình chưa được phân giải, doctor chặn đường dẫn cài đặt/sửa chữa kèm hướng dẫn có thể thực hiện.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, doctor chặn cài đặt/sửa chữa cho đến khi mode được đặt tường minh.
    - Đối với các unit user-systemd trên Linux, kiểm tra lệch mã thông báo của doctor hiện bao gồm cả nguồn `Environment=` và `EnvironmentFile=` khi so sánh metadata xác thực service.
    - Các sửa chữa service của doctor từ chối ghi lại, dừng hoặc khởi động lại service gateway từ binary OpenClaw cũ hơn khi cấu hình được ghi lần cuối bởi phiên bản mới hơn. Xem [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Bạn luôn có thể buộc ghi lại toàn bộ bằng `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Chẩn đoán runtime Gateway + cổng">
    Doctor kiểm tra runtime service (PID, trạng thái thoát gần nhất) và cảnh báo khi service đã được cài đặt nhưng thực tế không chạy. Nó cũng kiểm tra xung đột cổng trên cổng gateway (mặc định `18789`) và báo cáo các nguyên nhân có khả năng xảy ra (gateway đã chạy, đường hầm SSH).
  </Accordion>
  <Accordion title="17. Thực hành tốt nhất cho runtime Gateway">
    Doctor cảnh báo khi service gateway chạy trên Bun hoặc đường dẫn Node được quản lý theo phiên bản (`nvm`, `fnm`, `volta`, `asdf`, v.v.). Các kênh WhatsApp + Telegram yêu cầu Node, và đường dẫn trình quản lý phiên bản có thể hỏng sau khi nâng cấp vì service không tải phần khởi tạo shell của bạn. Doctor đề nghị di chuyển sang bản cài đặt Node hệ thống khi có sẵn (Homebrew/apt/choco).

    Các macOS LaunchAgent mới cài đặt hoặc được sửa chữa dùng PATH hệ thống chuẩn (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) thay vì sao chép PATH của shell tương tác, vì vậy Volta, asdf, fnm, pnpm và các thư mục trình quản lý phiên bản khác không thay đổi cách các tiến trình con Node được phân giải. Các service Linux vẫn giữ các gốc môi trường tường minh (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) và các thư mục user-bin ổn định, nhưng các thư mục fallback trình quản lý phiên bản được đoán chỉ được ghi vào PATH của service khi các thư mục đó tồn tại trên đĩa.

  </Accordion>
  <Accordion title="18. Ghi cấu hình + metadata trình hướng dẫn">
    Doctor lưu bền mọi thay đổi cấu hình và đóng dấu metadata trình hướng dẫn để ghi lại lần chạy doctor.
  </Accordion>
  <Accordion title="19. Mẹo workspace (sao lưu + hệ thống bộ nhớ)">
    Doctor đề xuất một hệ thống bộ nhớ workspace khi thiếu và in mẹo sao lưu nếu workspace chưa nằm trong git.

    Xem [/concepts/agent-workspace](/vi/concepts/agent-workspace) để có hướng dẫn đầy đủ về cấu trúc workspace và sao lưu git (khuyến nghị GitHub hoặc GitLab riêng tư).

  </Accordion>
</AccordionGroup>

## Liên quan

- [Runbook Gateway](/vi/gateway)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
