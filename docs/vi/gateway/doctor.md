---
read_when:
    - Thêm hoặc sửa đổi các bản di trú chẩn đoán
    - Giới thiệu các thay đổi cấu hình phá vỡ tương thích
sidebarTitle: Doctor
summary: 'Lệnh doctor: kiểm tra tình trạng, di trú cấu hình và các bước sửa chữa'
title: Chẩn đoán
x-i18n:
    generated_at: "2026-05-07T01:52:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: d76a31a8f2197e226894f90fb534f53acf969b75ca1dfdf438a26059880e7ab2
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` là công cụ sửa chữa + di chuyển dữ liệu cho OpenClaw. Công cụ này sửa cấu hình/trạng thái cũ, kiểm tra tình trạng, và cung cấp các bước sửa chữa có thể thực hiện được.

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

    Chấp nhận mặc định mà không hỏi (bao gồm các bước sửa chữa khởi động lại/dịch vụ/sandbox khi áp dụng).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Áp dụng các sửa chữa được đề xuất mà không hỏi (sửa chữa + khởi động lại ở nơi an toàn).

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

    Quét dịch vụ hệ thống để tìm các bản cài đặt Gateway bổ sung (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Nếu bạn muốn xem lại thay đổi trước khi ghi, hãy mở tệp cấu hình trước:

```bash
cat ~/.openclaw/openclaw.json
```

## Công cụ làm gì (tóm tắt)

<AccordionGroup>
  <Accordion title="Tình trạng, UI và cập nhật">
    - Cập nhật tiền kiểm tùy chọn cho bản cài đặt git (chỉ tương tác).
    - Kiểm tra độ mới của giao thức UI (xây dựng lại Control UI khi schema giao thức mới hơn).
    - Kiểm tra tình trạng + lời nhắc khởi động lại.
    - Tóm tắt trạng thái Skills (đủ điều kiện/thiếu/bị chặn) và trạng thái Plugin.

  </Accordion>
  <Accordion title="Cấu hình và di chuyển dữ liệu">
    - Chuẩn hóa cấu hình cho các giá trị cũ.
    - Di chuyển cấu hình Talk từ các trường phẳng `talk.*` cũ sang `talk.provider` + `talk.providers.<provider>`.
    - Kiểm tra di chuyển trình duyệt cho cấu hình tiện ích Chrome cũ và mức sẵn sàng của Chrome MCP.
    - Cảnh báo ghi đè nhà cung cấp OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Cảnh báo che khuất OAuth Codex (`models.providers.openai-codex`).
    - Kiểm tra điều kiện tiên quyết OAuth TLS cho hồ sơ OpenAI Codex OAuth.
    - Cảnh báo danh sách cho phép Plugin/công cụ khi `plugins.allow` bị hạn chế nhưng chính sách công cụ vẫn yêu cầu ký tự đại diện hoặc công cụ do Plugin sở hữu.
    - Di chuyển trạng thái cũ trên đĩa (sessions/thư mục agent/xác thực WhatsApp).
    - Di chuyển khóa hợp đồng manifest Plugin cũ (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Di chuyển kho Cron cũ (`jobId`, `schedule.cron`, các trường delivery/payload cấp cao nhất, payload `provider`, các job dự phòng Webhook đơn giản `notify: true`).
    - Di chuyển chính sách runtime agent cũ sang `agents.defaults.agentRuntime` và `agents.list[].agentRuntime`.
    - Dọn dẹp cấu hình Plugin cũ khi Plugin được bật; khi `plugins.enabled=false`, các tham chiếu Plugin cũ được coi là cấu hình ngăn chứa bất hoạt và được giữ nguyên.

  </Accordion>
  <Accordion title="Trạng thái và tính toàn vẹn">
    - Kiểm tra tệp khóa phiên và dọn dẹp khóa cũ.
    - Sửa bản ghi phiên cho các nhánh viết lại prompt bị trùng lặp do các bản dựng 2026.4.24 bị ảnh hưởng tạo ra.
    - Phát hiện tombstone phục hồi-khởi động lại subagent bị kẹt, với hỗ trợ `--fix` để xóa cờ phục hồi bị hủy cũ để quá trình khởi động không tiếp tục coi child là bị hủy do khởi động lại.
    - Kiểm tra tính toàn vẹn trạng thái và quyền (sessions, transcripts, thư mục trạng thái).
    - Kiểm tra quyền tệp cấu hình (chmod 600) khi chạy cục bộ.
    - Tình trạng xác thực mô hình: kiểm tra OAuth hết hạn, có thể làm mới token sắp hết hạn, và báo cáo trạng thái cooldown/bị vô hiệu hóa của auth-profile.
    - Phát hiện thư mục workspace bổ sung (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, dịch vụ và supervisor">
    - Sửa image sandbox khi sandboxing được bật.
    - Di chuyển dịch vụ cũ và phát hiện Gateway bổ sung.
    - Di chuyển trạng thái cũ của kênh Matrix (trong chế độ `--fix` / `--repair`).
    - Kiểm tra runtime Gateway (dịch vụ đã cài nhưng không chạy; nhãn launchd được lưu cache).
    - Cảnh báo trạng thái kênh (thăm dò từ Gateway đang chạy).
    - Kiểm tra độ phản hồi của WhatsApp đối với tình trạng event loop Gateway suy giảm khi các client TUI cục bộ vẫn đang chạy; `--fix` chỉ dừng các client TUI cục bộ đã được xác minh.
    - Sửa route Codex cho các tham chiếu mô hình `openai-codex/*` cũ trong mô hình chính, fallback, ghi đè heartbeat/subagent/compaction, hook, ghi đè mô hình kênh, và ghim route phiên; `--fix` viết lại chúng thành `openai/*` và chỉ chọn `agentRuntime.id: "codex"` khi Plugin Codex đã được cài, bật, đóng góp harness `codex`, và có OAuth dùng được. Nếu không, công cụ chọn `agentRuntime.id: "pi"`.
    - Kiểm tra cấu hình supervisor (launchd/systemd/schtasks) với sửa chữa tùy chọn.
    - Dọn dẹp môi trường proxy nhúng cho các dịch vụ Gateway đã ghi lại giá trị shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` trong lúc cài đặt hoặc cập nhật.
    - Kiểm tra thực hành tốt nhất cho runtime Gateway (Node so với Bun, đường dẫn trình quản lý phiên bản).
    - Chẩn đoán xung đột cổng Gateway (mặc định `18789`).

  </Accordion>
  <Accordion title="Xác thực, bảo mật và ghép đôi">
    - Cảnh báo bảo mật cho chính sách DM mở.
    - Kiểm tra xác thực Gateway cho chế độ token cục bộ (đề xuất tạo token khi không có nguồn token; không ghi đè cấu hình token SecretRef).
    - Phát hiện sự cố ghép đôi thiết bị (yêu cầu ghép đôi lần đầu đang chờ, nâng cấp vai trò/phạm vi đang chờ, lệch cache device-token cục bộ cũ, và lệch xác thực bản ghi đã ghép đôi).

  </Accordion>
  <Accordion title="Workspace và shell">
    - Kiểm tra systemd linger trên Linux.
    - Kiểm tra kích thước tệp bootstrap workspace (cảnh báo bị cắt/gần giới hạn cho tệp ngữ cảnh).
    - Kiểm tra mức sẵn sàng của Skills cho agent mặc định; báo cáo các skill được phép nhưng thiếu binary, env, cấu hình, hoặc yêu cầu OS, và `--fix` có thể vô hiệu hóa các skill không khả dụng trong `skills.entries`.
    - Kiểm tra trạng thái hoàn tất shell và tự động cài đặt/nâng cấp.
    - Kiểm tra mức sẵn sàng của nhà cung cấp embedding tìm kiếm bộ nhớ (mô hình cục bộ, khóa API từ xa, hoặc binary QMD).
    - Kiểm tra bản cài đặt từ nguồn (không khớp pnpm workspace, thiếu asset UI, thiếu binary tsx).
    - Ghi cấu hình đã cập nhật + metadata wizard.

  </Accordion>
</AccordionGroup>

## Điền bù và đặt lại UI Dreams

Cảnh Dreams của Control UI bao gồm các hành động **Điền bù**, **Đặt lại**, và **Xóa Grounded** cho workflow grounded dreaming. Các hành động này dùng phương thức RPC kiểu gateway doctor, nhưng chúng **không** phải là một phần của sửa chữa/di chuyển CLI `openclaw doctor`.

Chúng làm gì:

- **Điền bù** quét các tệp lịch sử `memory/YYYY-MM-DD.md` trong workspace đang hoạt động, chạy lượt nhật ký grounded REM, và ghi các mục điền bù có thể đảo ngược vào `DREAMS.md`.
- **Đặt lại** chỉ xóa các mục nhật ký điền bù được đánh dấu đó khỏi `DREAMS.md`.
- **Xóa Grounded** chỉ xóa các mục ngắn hạn chỉ-grounded đã staged đến từ phát lại lịch sử và chưa tích lũy recall trực tiếp hoặc hỗ trợ hằng ngày.

Tự thân chúng **không** làm gì:

- chúng không chỉnh sửa `MEMORY.md`
- chúng không chạy toàn bộ di chuyển doctor
- chúng không tự động stage ứng viên grounded vào kho promotion ngắn hạn trực tiếp trừ khi bạn chạy rõ ràng đường dẫn CLI staged trước

Nếu bạn muốn phát lại lịch sử grounded ảnh hưởng đến làn promotion sâu thông thường, hãy dùng luồng CLI thay thế:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Thao tác đó stage các ứng viên bền vững grounded vào kho dreaming ngắn hạn trong khi giữ `DREAMS.md` làm bề mặt review.

## Hành vi chi tiết và lý do

<AccordionGroup>
  <Accordion title="0. Cập nhật tùy chọn (bản cài đặt git)">
    Nếu đây là một git checkout và doctor đang chạy tương tác, công cụ đề xuất cập nhật (fetch/rebase/build) trước khi chạy doctor.
  </Accordion>
  <Accordion title="1. Chuẩn hóa cấu hình">
    Nếu cấu hình chứa các dạng giá trị cũ (ví dụ `messages.ackReaction` không có ghi đè riêng theo kênh), doctor chuẩn hóa chúng vào schema hiện tại.

    Điều đó bao gồm các trường phẳng Talk cũ. Cấu hình speech Talk công khai hiện tại là `talk.provider` + `talk.providers.<provider>`, và cấu hình giọng nói thời gian thực là `talk.realtime.*`. Doctor viết lại các dạng `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` cũ vào map nhà cung cấp, và viết lại các bộ chọn thời gian thực cấp cao nhất cũ (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) vào `talk.realtime`.

    Doctor cũng cảnh báo khi `plugins.allow` không rỗng và chính sách công cụ dùng
    ký tự đại diện hoặc các mục công cụ do Plugin sở hữu. `tools.allow: ["*"]` chỉ khớp các công cụ
    từ những Plugin thực sự được tải; nó không bỏ qua danh sách cho phép Plugin độc quyền.
    Doctor ghi `plugins.bundledDiscovery: "compat"` cho cấu hình danh sách cho phép cũ đã di chuyển
    để giữ hành vi nhà cung cấp bundled hiện có, rồi
    trỏ đến thiết lập `"allowlist"` chặt chẽ hơn.

  </Accordion>
  <Accordion title="2. Di chuyển khóa cấu hình cũ">
    Khi cấu hình chứa các khóa không còn được khuyến nghị dùng, các lệnh khác sẽ từ chối chạy và yêu cầu bạn chạy `openclaw doctor`.

    Doctor sẽ:

    - Giải thích các khóa cũ nào đã được tìm thấy.
    - Hiển thị di chuyển đã áp dụng.
    - Viết lại `~/.openclaw/openclaw.json` bằng schema đã cập nhật.

    Khởi động Gateway từ chối các định dạng cấu hình cũ và yêu cầu bạn chạy `openclaw doctor --fix`; nó không viết lại `openclaw.json` khi khởi động. Di chuyển kho job Cron cũng được xử lý bởi `openclaw doctor --fix`.

    Các di chuyển hiện tại:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - cấu hình kênh đã cấu hình thiếu chính sách trả lời hiển thị → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` cấp cao nhất
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` cũ → `talk.provider` + `talk.providers.<provider>`
    - bộ chọn Talk thời gian thực cấp cao nhất cũ (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Với các kênh có `accounts` được đặt tên nhưng vẫn còn các giá trị kênh cấp cao nhất cho một tài khoản, hãy chuyển các giá trị theo phạm vi tài khoản đó vào tài khoản được nâng cấp đã chọn cho kênh đó (`accounts.default` cho hầu hết các kênh; Matrix có thể giữ nguyên một đích được đặt tên/mặc định khớp hiện có)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - xóa `agents.defaults.llm`; dùng `models.providers.<id>.timeoutSeconds` cho thời gian chờ nhà cung cấp/mô hình chậm
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - xóa `browser.relayBindHost` (cài đặt relay extension cũ)
    - `models.providers.*.api: "openai"` cũ → `"openai-completions"` (khởi động Gateway cũng bỏ qua các nhà cung cấp có `api` được đặt thành giá trị enum tương lai hoặc không xác định thay vì thất bại đóng)

    Cảnh báo doctor cũng bao gồm hướng dẫn mặc định tài khoản cho các kênh nhiều tài khoản:

    - Nếu hai hoặc nhiều mục `channels.<channel>.accounts` được cấu hình mà không có `channels.<channel>.defaultAccount` hoặc `accounts.default`, doctor cảnh báo rằng định tuyến dự phòng có thể chọn một tài khoản không mong muốn.
    - Nếu `channels.<channel>.defaultAccount` được đặt thành ID tài khoản không xác định, doctor cảnh báo và liệt kê các ID tài khoản đã cấu hình.

  </Accordion>
  <Accordion title="2b. Ghi đè nhà cung cấp OpenCode">
    Nếu bạn đã thêm `models.providers.opencode`, `opencode-zen`, hoặc `opencode-go` theo cách thủ công, nó sẽ ghi đè danh mục OpenCode tích hợp sẵn từ `@mariozechner/pi-ai`. Điều đó có thể ép các mô hình vào sai API hoặc đưa chi phí về 0. Doctor cảnh báo để bạn có thể xóa phần ghi đè và khôi phục định tuyến API + chi phí theo từng mô hình.
  </Accordion>
  <Accordion title="2c. Di chuyển trình duyệt và mức sẵn sàng cho Chrome MCP">
    Nếu cấu hình trình duyệt của bạn vẫn trỏ đến đường dẫn Chrome extension đã bị xóa, doctor sẽ chuẩn hóa nó về mô hình gắn Chrome MCP cục bộ trên máy chủ hiện tại:

    - `browser.profiles.*.driver: "extension"` trở thành `"existing-session"`
    - `browser.relayBindHost` bị xóa

    Doctor cũng kiểm tra đường dẫn Chrome MCP cục bộ trên máy chủ khi bạn dùng `defaultProfile: "user"` hoặc một hồ sơ `existing-session` đã cấu hình:

    - kiểm tra Google Chrome có được cài đặt trên cùng máy chủ cho các hồ sơ tự động kết nối mặc định hay không
    - kiểm tra phiên bản Chrome phát hiện được và cảnh báo khi phiên bản đó thấp hơn Chrome 144
    - nhắc bạn bật gỡ lỗi từ xa trong trang kiểm tra của trình duyệt (ví dụ `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, hoặc `edge://inspect/#remote-debugging`)

    Doctor không thể bật cài đặt phía Chrome thay bạn. Chrome MCP cục bộ trên máy chủ vẫn yêu cầu:

    - trình duyệt dựa trên Chromium 144+ trên máy chủ gateway/node
    - trình duyệt đang chạy cục bộ
    - gỡ lỗi từ xa được bật trong trình duyệt đó
    - phê duyệt lời nhắc đồng ý gắn lần đầu trong trình duyệt

    Mức sẵn sàng ở đây chỉ nói về các điều kiện tiên quyết để gắn cục bộ. Existing-session giữ các giới hạn tuyến Chrome MCP hiện tại; các tuyến nâng cao như `responsebody`, xuất PDF, chặn tải xuống và thao tác hàng loạt vẫn yêu cầu trình duyệt được quản lý hoặc hồ sơ CDP thô.

    Kiểm tra này **không** áp dụng cho Docker, sandbox, remote-browser, hoặc các luồng headless khác. Các luồng đó tiếp tục dùng CDP thô.

  </Accordion>
  <Accordion title="2d. Điều kiện tiên quyết OAuth TLS">
    Khi một hồ sơ OpenAI Codex OAuth được cấu hình, doctor thăm dò điểm cuối ủy quyền OpenAI để xác minh rằng ngăn xếp TLS Node/OpenSSL cục bộ có thể xác thực chuỗi chứng chỉ. Nếu phép thăm dò thất bại với lỗi chứng chỉ (ví dụ `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, chứng chỉ hết hạn, hoặc chứng chỉ tự ký), doctor in hướng dẫn sửa lỗi theo từng nền tảng. Trên macOS với Node từ Homebrew, cách sửa thường là `brew postinstall ca-certificates`. Với `--deep`, phép thăm dò chạy ngay cả khi gateway khỏe mạnh.
  </Accordion>
  <Accordion title="2e. Ghi đè nhà cung cấp Codex OAuth">
    Nếu trước đây bạn đã thêm các cài đặt truyền tải OpenAI cũ dưới `models.providers.openai-codex`, chúng có thể che khuất đường dẫn nhà cung cấp Codex OAuth tích hợp sẵn mà các bản phát hành mới hơn tự động dùng. Doctor cảnh báo khi thấy các cài đặt truyền tải cũ đó đi kèm Codex OAuth để bạn có thể xóa hoặc viết lại phần ghi đè truyền tải lỗi thời và lấy lại hành vi định tuyến/dự phòng tích hợp sẵn. Proxy tùy chỉnh và ghi đè chỉ-header vẫn được hỗ trợ và không kích hoạt cảnh báo này.
  </Accordion>
  <Accordion title="2f. Sửa tuyến Codex">
    Doctor kiểm tra các tham chiếu mô hình `openai-codex/*` cũ. Định tuyến harness Codex gốc dùng tham chiếu mô hình `openai/*` chuẩn cộng với `agentRuntime.id: "codex"` để lượt chạy đi qua harness app-server Codex thay vì đường dẫn OpenAI của OpenClaw PI.

    Ở chế độ `--fix` / `--repair`, doctor viết lại các tham chiếu default-agent và per-agent bị ảnh hưởng, bao gồm mô hình chính, dự phòng, ghi đè heartbeat/subagent/compaction, hook, ghi đè mô hình kênh và trạng thái tuyến phiên đã lưu lỗi thời:

    - `openai-codex/gpt-*` trở thành `openai/gpt-*`.
    - Runtime agent khớp trở thành `agentRuntime.id: "codex"` chỉ khi Codex đã được cài đặt, được bật, đóng góp harness `codex`, và có OAuth dùng được.
    - Nếu không, runtime agent khớp trở thành `agentRuntime.id: "pi"`.
    - Các danh sách mô hình dự phòng hiện có được giữ nguyên với các mục cũ được viết lại; cài đặt theo mô hình được sao chép chuyển từ khóa cũ sang khóa `openai/*` chuẩn.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride` của phiên đã lưu, thông báo dự phòng, ghim auth-profile và ghim harness Codex được sửa trên tất cả kho phiên agent được phát hiện.
    - `/codex ...` có nghĩa là "điều khiển hoặc liên kết một cuộc hội thoại Codex gốc từ chat."
    - `/acp ...` hoặc `runtime: "acp"` có nghĩa là "dùng bộ chuyển đổi ACP/acpx bên ngoài."

  </Accordion>
  <Accordion title="2g. Dọn dẹp tuyến phiên">
    Doctor cũng quét các kho phiên agent được phát hiện để tìm trạng thái tuyến tự tạo lỗi thời sau khi bạn chuyển mô hình hoặc runtime đã cấu hình ra khỏi một tuyến do plugin sở hữu như Codex.

    `openclaw doctor --fix` có thể xóa trạng thái lỗi thời tự tạo như ghim mô hình `modelOverrideSource: "auto"`, siêu dữ liệu mô hình runtime, ID harness được ghim, liên kết phiên CLI và ghi đè auth-profile tự động khi tuyến sở hữu chúng không còn được cấu hình. Lựa chọn mô hình phiên rõ ràng của người dùng hoặc phiên cũ được báo cáo để xem xét thủ công và giữ nguyên; chuyển chúng bằng `/model ...`, `/new`, hoặc đặt lại phiên khi tuyến đó không còn được dự định dùng.

  </Accordion>
  <Accordion title="3. Di chuyển trạng thái cũ (bố cục đĩa)">
    Doctor có thể di chuyển các bố cục trên đĩa cũ hơn sang cấu trúc hiện tại:

    - Kho phiên + transcript:
      - từ `~/.openclaw/sessions/` sang `~/.openclaw/agents/<agentId>/sessions/`
    - Thư mục agent:
      - từ `~/.openclaw/agent/` sang `~/.openclaw/agents/<agentId>/agent/`
    - Trạng thái xác thực WhatsApp (Baileys):
      - từ `~/.openclaw/credentials/*.json` cũ (ngoại trừ `oauth.json`)
      - sang `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID tài khoản mặc định: `default`)

    Các lần di chuyển này là best-effort và idempotent; doctor sẽ phát cảnh báo khi để lại bất kỳ thư mục cũ nào làm bản sao lưu. Gateway/CLI cũng tự động di chuyển phiên cũ + thư mục agent khi khởi động để lịch sử/xác thực/mô hình nằm trong đường dẫn theo từng agent mà không cần chạy doctor thủ công. Chuẩn hóa nhà cung cấp/bản đồ nhà cung cấp Talk hiện so sánh bằng đẳng thức cấu trúc, nên các khác biệt chỉ do thứ tự khóa không còn kích hoạt lặp lại thay đổi `doctor --fix` không có tác dụng.

  </Accordion>
  <Accordion title="3a. Di chuyển manifest Plugin cũ">
    Doctor quét tất cả manifest plugin đã cài đặt để tìm các khóa capability cấp cao nhất đã lỗi thời (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Khi tìm thấy, nó đề xuất chuyển chúng vào đối tượng `contracts` và viết lại tệp manifest tại chỗ. Di chuyển này là idempotent; nếu khóa `contracts` đã có cùng giá trị, khóa cũ sẽ bị xóa mà không nhân đôi dữ liệu.
  </Accordion>
  <Accordion title="3b. Di chuyển kho cron cũ">
    Doctor cũng kiểm tra kho tác vụ cron (`~/.openclaw/cron/jobs.json` theo mặc định, hoặc `cron.store` khi được ghi đè) để tìm các dạng tác vụ cũ mà bộ lập lịch vẫn chấp nhận vì tương thích.

    Các dọn dẹp cron hiện tại bao gồm:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - các trường payload cấp cao nhất (`message`, `model`, `thinking`, ...) → `payload`
    - các trường gửi cấp cao nhất (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - bí danh gửi payload `provider` → `delivery.channel` rõ ràng
    - các sentinel `payload.model` cron đã lưu không hợp lệ (`"default"`, `"null"`, chuỗi trống, JSON `null`) → ghi đè mô hình bị xóa
    - tác vụ dự phòng webhook `notify: true` cũ đơn giản → `delivery.mode="webhook"` rõ ràng với `delivery.to=cron.webhook`

    Trình kiểm tra chỉ tự động di chuyển các tác vụ `notify: true` khi có thể làm vậy mà không thay đổi hành vi. Nếu một tác vụ kết hợp cơ chế dự phòng thông báo cũ với một chế độ gửi hiện có không phải webhook, trình kiểm tra sẽ cảnh báo và để tác vụ đó lại để xem xét thủ công.

    Trên Linux, trình kiểm tra cũng cảnh báo khi crontab của người dùng vẫn gọi `~/.openclaw/bin/ensure-whatsapp.sh` cũ. Tập lệnh cục bộ trên máy chủ đó không được OpenClaw hiện tại bảo trì và có thể ghi các thông báo `Gateway inactive` sai vào `~/.openclaw/logs/whatsapp-health.log` khi cron không thể truy cập bus người dùng systemd. Xóa mục crontab cũ bằng `crontab -e`; dùng `openclaw channels status --probe`, `openclaw doctor` và `openclaw gateway status` cho các kiểm tra sức khỏe hiện tại.

  </Accordion>
  <Accordion title="3c. Dọn dẹp khóa phiên">
    Trình kiểm tra quét mọi thư mục phiên tác tử để tìm các tệp khóa ghi cũ — các tệp còn sót lại khi một phiên thoát bất thường. Với mỗi tệp khóa tìm thấy, trình kiểm tra báo cáo: đường dẫn, PID, liệu PID còn đang sống hay không, tuổi khóa và liệu khóa có được xem là cũ hay không (PID đã chết hoặc cũ hơn 30 phút). Ở chế độ `--fix` / `--repair`, trình kiểm tra tự động xóa các tệp khóa cũ; nếu không, trình kiểm tra in một ghi chú và hướng dẫn bạn chạy lại với `--fix`.
  </Accordion>
  <Accordion title="3d. Sửa nhánh bản ghi phiên">
    Trình kiểm tra quét các tệp JSONL phiên tác tử để tìm dạng nhánh bị nhân đôi do lỗi viết lại bản ghi lời nhắc ngày 2026.4.24 tạo ra: một lượt người dùng bị bỏ lại với ngữ cảnh runtime nội bộ của OpenClaw cùng một nhánh anh em đang hoạt động chứa cùng lời nhắc người dùng hiển thị. Ở chế độ `--fix` / `--repair`, trình kiểm tra sao lưu từng tệp bị ảnh hưởng bên cạnh tệp gốc và viết lại bản ghi sang nhánh đang hoạt động để lịch sử gateway và bộ đọc bộ nhớ không còn thấy các lượt trùng lặp.
  </Accordion>
  <Accordion title="4. Kiểm tra tính toàn vẹn trạng thái (lưu phiên, định tuyến và an toàn)">
    Thư mục trạng thái là trung khu vận hành. Nếu nó biến mất, bạn mất phiên, thông tin xác thực, nhật ký và cấu hình (trừ khi bạn có bản sao lưu ở nơi khác).

    Trình kiểm tra kiểm tra:

    - **Thiếu thư mục trạng thái**: cảnh báo về mất trạng thái nghiêm trọng, nhắc tạo lại thư mục và nhắc rằng không thể khôi phục dữ liệu bị thiếu.
    - **Quyền thư mục trạng thái**: xác minh khả năng ghi; đề xuất sửa quyền (và phát gợi ý `chown` khi phát hiện chủ sở hữu/nhóm không khớp).
    - **Thư mục trạng thái đồng bộ đám mây trên macOS**: cảnh báo khi trạng thái trỏ vào iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) hoặc `~/Library/CloudStorage/...` vì các đường dẫn dựa trên đồng bộ có thể gây I/O chậm hơn và tranh chấp khóa/đồng bộ.
    - **Thư mục trạng thái SD hoặc eMMC trên Linux**: cảnh báo khi trạng thái trỏ tới nguồn gắn kết `mmcblk*`, vì I/O ngẫu nhiên dựa trên SD hoặc eMMC có thể chậm hơn và hao mòn nhanh hơn khi ghi phiên và thông tin xác thực.
    - **Thiếu thư mục phiên**: `sessions/` và thư mục kho phiên là bắt buộc để lưu lịch sử và tránh sự cố `ENOENT`.
    - **Bản ghi không khớp**: cảnh báo khi các mục phiên gần đây thiếu tệp bản ghi.
    - **Phiên chính "JSONL 1 dòng"**: đánh dấu khi bản ghi chính chỉ có một dòng (lịch sử không tích lũy).
    - **Nhiều thư mục trạng thái**: cảnh báo khi nhiều thư mục `~/.openclaw` tồn tại trên các thư mục home hoặc khi `OPENCLAW_STATE_DIR` trỏ tới nơi khác (lịch sử có thể bị chia tách giữa các bản cài đặt).
    - **Nhắc nhở chế độ từ xa**: nếu `gateway.mode=remote`, trình kiểm tra nhắc bạn chạy nó trên máy chủ từ xa (trạng thái nằm ở đó).
    - **Quyền tệp cấu hình**: cảnh báo nếu `~/.openclaw/openclaw.json` có thể đọc bởi nhóm/mọi người và đề xuất siết chặt thành `600`.

  </Accordion>
  <Accordion title="5. Sức khỏe xác thực mô hình (OAuth hết hạn)">
    Trình kiểm tra kiểm tra hồ sơ OAuth trong kho xác thực, cảnh báo khi mã thông báo sắp hết hạn/đã hết hạn và có thể làm mới chúng khi an toàn. Nếu hồ sơ OAuth/mã thông báo Anthropic đã cũ, trình kiểm tra gợi ý khóa API Anthropic hoặc đường dẫn mã thông báo thiết lập Anthropic. Lời nhắc làm mới chỉ xuất hiện khi chạy tương tác (TTY); `--non-interactive` bỏ qua các lần thử làm mới.

    Khi làm mới OAuth thất bại vĩnh viễn (ví dụ `refresh_token_reused`, `invalid_grant`, hoặc nhà cung cấp yêu cầu bạn đăng nhập lại), trình kiểm tra báo rằng cần xác thực lại và in chính xác lệnh `openclaw models auth login --provider ...` cần chạy.

    Trình kiểm tra cũng báo cáo các hồ sơ xác thực tạm thời không dùng được do:

    - thời gian tạm dừng ngắn (giới hạn tốc độ/hết thời gian chờ/lỗi xác thực)
    - vô hiệu hóa lâu hơn (lỗi thanh toán/tín dụng)

  </Accordion>
  <Accordion title="6. Xác thực mô hình hook">
    Nếu `hooks.gmail.model` được đặt, trình kiểm tra xác thực tham chiếu mô hình với danh mục và danh sách cho phép, rồi cảnh báo khi nó không phân giải được hoặc không được phép.
  </Accordion>
  <Accordion title="7. Sửa ảnh sandbox">
    Khi sandbox được bật, trình kiểm tra kiểm tra ảnh Docker và đề xuất xây dựng hoặc chuyển sang tên cũ nếu thiếu ảnh hiện tại.
  </Accordion>
  <Accordion title="7b. Dọn dẹp cài đặt Plugin">
    Trình kiểm tra xóa trạng thái dàn dựng phụ thuộc Plugin cũ do OpenClaw tạo ở chế độ `openclaw doctor --fix` / `openclaw doctor --repair`. Việc này bao gồm các gốc phụ thuộc được tạo đã cũ, thư mục giai đoạn cài đặt cũ, phần còn sót cục bộ trong gói từ mã sửa phụ thuộc Plugin đóng gói trước đây, và các bản sao npm được quản lý bị mồ côi hoặc khôi phục của các Plugin `@openclaw/*` đóng gói có thể che khuất manifest đóng gói hiện tại.

    Trình kiểm tra cũng có thể cài đặt lại các Plugin có thể tải xuống bị thiếu khi cấu hình tham chiếu tới chúng nhưng registry Plugin cục bộ không tìm thấy. Ví dụ bao gồm các `plugins.entries` thực tế, thiết lập kênh/nhà cung cấp/tìm kiếm đã cấu hình và runtime tác tử đã cấu hình. Trong quá trình cập nhật gói, trình kiểm tra tránh chạy sửa Plugin bằng trình quản lý gói khi gói lõi đang được thay thế; chạy lại `openclaw doctor --fix` sau khi cập nhật nếu một Plugin đã cấu hình vẫn cần khôi phục. Khởi động Gateway và tải lại cấu hình không chạy trình quản lý gói; cài đặt Plugin vẫn là công việc doctor/cài đặt/cập nhật rõ ràng.

  </Accordion>
  <Accordion title="8. Di chuyển dịch vụ Gateway và gợi ý dọn dẹp">
    Trình kiểm tra phát hiện các dịch vụ gateway cũ (launchd/systemd/schtasks) và đề xuất xóa chúng rồi cài đặt dịch vụ OpenClaw bằng cổng gateway hiện tại. Nó cũng có thể quét các dịch vụ giống gateway bổ sung và in gợi ý dọn dẹp. Các dịch vụ gateway OpenClaw có tên theo hồ sơ được xem là hạng nhất và không bị đánh dấu là "bổ sung."

    Trên Linux, nếu thiếu dịch vụ gateway cấp người dùng nhưng tồn tại dịch vụ gateway OpenClaw cấp hệ thống, trình kiểm tra không tự động cài đặt dịch vụ cấp người dùng thứ hai. Kiểm tra bằng `openclaw gateway status --deep` hoặc `openclaw doctor --deep`, rồi xóa bản trùng lặp hoặc đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một trình giám sát hệ thống sở hữu vòng đời gateway.

  </Accordion>
  <Accordion title="8b. Di chuyển khởi động Matrix">
    Khi tài khoản kênh Matrix có một di chuyển trạng thái cũ đang chờ hoặc có thể hành động, trình kiểm tra (ở chế độ `--fix` / `--repair`) tạo ảnh chụp nhanh trước di chuyển rồi chạy các bước di chuyển nỗ lực tối đa: di chuyển trạng thái Matrix cũ và chuẩn bị trạng thái mã hóa cũ. Cả hai bước đều không gây lỗi nghiêm trọng; lỗi được ghi nhật ký và quá trình khởi động tiếp tục. Ở chế độ chỉ đọc (`openclaw doctor` không có `--fix`), kiểm tra này bị bỏ qua hoàn toàn.
  </Accordion>
  <Accordion title="8c. Ghép cặp thiết bị và lệch xác thực">
    Trình kiểm tra hiện kiểm tra trạng thái ghép cặp thiết bị như một phần của lượt kiểm tra sức khỏe bình thường.

    Nội dung được báo cáo:

    - yêu cầu ghép cặp lần đầu đang chờ
    - nâng cấp vai trò đang chờ cho thiết bị đã ghép cặp
    - nâng cấp phạm vi đang chờ cho thiết bị đã ghép cặp
    - sửa không khớp khóa công khai khi id thiết bị vẫn khớp nhưng danh tính thiết bị không còn khớp bản ghi đã phê duyệt
    - bản ghi đã ghép cặp thiếu mã thông báo hoạt động cho vai trò đã phê duyệt
    - mã thông báo đã ghép cặp có phạm vi lệch khỏi đường cơ sở ghép cặp đã phê duyệt
    - các mục mã thông báo thiết bị được lưu đệm cục bộ cho máy hiện tại có từ trước một lần xoay mã thông báo phía gateway hoặc mang siêu dữ liệu phạm vi đã cũ

    Trình kiểm tra không tự động phê duyệt yêu cầu ghép cặp hoặc tự động xoay mã thông báo thiết bị. Thay vào đó, trình kiểm tra in các bước tiếp theo chính xác:

    - kiểm tra yêu cầu đang chờ bằng `openclaw devices list`
    - phê duyệt yêu cầu chính xác bằng `openclaw devices approve <requestId>`
    - xoay mã thông báo mới bằng `openclaw devices rotate --device <deviceId> --role <role>`
    - xóa và phê duyệt lại bản ghi đã cũ bằng `openclaw devices remove <deviceId>`

    Điều này khép lại lỗ hổng phổ biến "đã ghép cặp nhưng vẫn nhận yêu cầu ghép cặp": trình kiểm tra hiện phân biệt ghép cặp lần đầu với nâng cấp vai trò/phạm vi đang chờ và với lệch mã thông báo/danh tính thiết bị đã cũ.

  </Accordion>
  <Accordion title="9. Cảnh báo bảo mật">
    Trình kiểm tra phát cảnh báo khi một nhà cung cấp mở với tin nhắn trực tiếp mà không có danh sách cho phép, hoặc khi một chính sách được cấu hình theo cách nguy hiểm.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Nếu đang chạy dưới dạng dịch vụ người dùng systemd, trình kiểm tra đảm bảo linger được bật để gateway vẫn sống sau khi đăng xuất.
  </Accordion>
  <Accordion title="11. Trạng thái workspace (Skills, Plugin và thư mục cũ)">
    Trình kiểm tra in tóm tắt trạng thái workspace cho tác tử mặc định:

    - **Trạng thái Skills**: đếm Skills đủ điều kiện, thiếu yêu cầu và bị danh sách cho phép chặn.
    - **Thư mục workspace cũ**: cảnh báo khi `~/openclaw` hoặc các thư mục workspace cũ khác tồn tại cùng workspace hiện tại.
    - **Trạng thái Plugin**: đếm Plugin đã bật/đã tắt/lỗi; liệt kê ID Plugin cho mọi lỗi; báo cáo khả năng của Plugin đóng gói.
    - **Cảnh báo tương thích Plugin**: đánh dấu các Plugin có vấn đề tương thích với runtime hiện tại.
    - **Chẩn đoán Plugin**: hiển thị mọi cảnh báo hoặc lỗi tại thời điểm tải do registry Plugin phát ra.

  </Accordion>
  <Accordion title="11b. Kích thước tệp bootstrap">
    Trình kiểm tra kiểm tra liệu các tệp bootstrap workspace (ví dụ `AGENTS.md`, `CLAUDE.md`, hoặc các tệp ngữ cảnh được chèn khác) có gần hoặc vượt ngân sách ký tự đã cấu hình hay không. Trình kiểm tra báo cáo số ký tự thô so với số ký tự được chèn theo từng tệp, tỷ lệ phần trăm cắt bớt, nguyên nhân cắt bớt (`max/file` hoặc `max/total`), và tổng số ký tự được chèn dưới dạng một phần của tổng ngân sách. Khi tệp bị cắt bớt hoặc gần giới hạn, trình kiểm tra in mẹo để tinh chỉnh `agents.defaults.bootstrapMaxChars` và `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Dọn dẹp Plugin kênh đã cũ">
    Khi `openclaw doctor --fix` xóa một Plugin kênh bị thiếu, nó cũng xóa cấu hình theo phạm vi kênh bị treo đã tham chiếu tới Plugin đó: các mục `channels.<id>`, mục tiêu Heartbeat đã đặt tên kênh, và ghi đè `agents.*.models["<channel>/*"]`. Điều này ngăn vòng lặp khởi động Gateway khi runtime kênh đã mất nhưng cấu hình vẫn yêu cầu gateway bind vào nó.
  </Accordion>
  <Accordion title="11c. Hoàn tất shell">
    Trình kiểm tra kiểm tra liệu tính năng hoàn tất bằng phím tab đã được cài đặt cho shell hiện tại hay chưa (zsh, bash, fish hoặc PowerShell):

    - Nếu hồ sơ shell dùng mẫu hoàn tất động chậm (`source <(openclaw completion ...)`), trình kiểm tra nâng cấp nó lên biến thể tệp được lưu đệm nhanh hơn.
    - Nếu hoàn tất được cấu hình trong hồ sơ nhưng thiếu tệp bộ đệm, trình kiểm tra tự động tạo lại bộ đệm.
    - Nếu hoàn toàn chưa cấu hình hoàn tất, trình kiểm tra nhắc cài đặt nó (chỉ chế độ tương tác; bỏ qua với `--non-interactive`).

    Chạy `openclaw completion --write-state` để tạo lại bộ đệm thủ công.

  </Accordion>
  <Accordion title="12. Kiểm tra xác thực Gateway (mã thông báo cục bộ)">
    Trình kiểm tra kiểm tra mức sẵn sàng xác thực mã thông báo gateway cục bộ.

    - Nếu chế độ mã thông báo cần mã thông báo và không tồn tại nguồn mã thông báo, trình kiểm tra đề xuất tạo một mã thông báo.
    - Nếu `gateway.auth.token` do SecretRef quản lý nhưng không khả dụng, trình kiểm tra cảnh báo và không ghi đè bằng văn bản thuần.
    - `openclaw doctor --generate-gateway-token` buộc tạo chỉ khi không có SecretRef mã thông báo nào được cấu hình.

  </Accordion>
  <Accordion title="12b. Sửa chữa nhận biết SecretRef chỉ đọc">
    Một số luồng sửa chữa cần kiểm tra thông tin xác thực đã cấu hình mà không làm suy yếu hành vi lỗi nhanh của runtime.

    - `openclaw doctor --fix` hiện dùng cùng mô hình tóm tắt SecretRef chỉ đọc như các lệnh thuộc nhóm trạng thái cho các sửa chữa cấu hình có mục tiêu.
    - Ví dụ: sửa chữa Telegram `allowFrom` / `groupAllowFrom` `@username` cố gắng dùng thông tin xác thực bot đã cấu hình khi có sẵn.
    - Nếu token bot Telegram được cấu hình qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại, doctor báo rằng thông tin xác thực đã được cấu hình nhưng không khả dụng và bỏ qua tự động phân giải thay vì bị lỗi hoặc báo sai rằng token bị thiếu.

  </Accordion>
  <Accordion title="13. Kiểm tra tình trạng Gateway + khởi động lại">
    Doctor chạy kiểm tra tình trạng và đề xuất khởi động lại gateway khi gateway có vẻ không khỏe.
  </Accordion>
  <Accordion title="13b. Mức sẵn sàng của tìm kiếm bộ nhớ">
    Doctor kiểm tra xem nhà cung cấp embedding cho tìm kiếm bộ nhớ đã cấu hình có sẵn sàng cho tác tử mặc định hay chưa. Hành vi phụ thuộc vào backend và nhà cung cấp đã cấu hình:

    - **Backend QMD**: thăm dò xem binary `qmd` có khả dụng và có thể khởi động hay không. Nếu không, in hướng dẫn sửa, bao gồm gói npm và tùy chọn đường dẫn binary thủ công.
    - **Nhà cung cấp cục bộ tường minh**: kiểm tra tệp mô hình cục bộ hoặc URL mô hình từ xa/có thể tải xuống được nhận diện. Nếu thiếu, đề xuất chuyển sang nhà cung cấp từ xa.
    - **Nhà cung cấp từ xa tường minh** (`openai`, `voyage`, v.v.): xác minh khóa API có trong môi trường hoặc kho xác thực. In gợi ý sửa có thể hành động nếu thiếu.
    - **Nhà cung cấp tự động**: kiểm tra khả dụng của mô hình cục bộ trước, rồi thử từng nhà cung cấp từ xa theo thứ tự tự động chọn.

    Khi có kết quả thăm dò Gateway trong bộ nhớ đệm (Gateway khỏe tại thời điểm kiểm tra), doctor đối chiếu kết quả đó với cấu hình CLI nhìn thấy được và ghi chú mọi điểm khác biệt. Doctor không bắt đầu ping embedding mới trong đường dẫn mặc định; hãy dùng lệnh trạng thái bộ nhớ sâu khi bạn muốn kiểm tra nhà cung cấp trực tiếp.

    Dùng `openclaw memory status --deep` để xác minh mức sẵn sàng của embedding khi runtime.

  </Accordion>
  <Accordion title="14. Cảnh báo trạng thái kênh">
    Nếu Gateway khỏe, doctor chạy thăm dò trạng thái kênh và báo cáo cảnh báo kèm các bản sửa được đề xuất.
  </Accordion>
  <Accordion title="15. Kiểm tra + sửa cấu hình supervisor">
    Doctor kiểm tra cấu hình supervisor đã cài đặt (launchd/systemd/schtasks) để tìm các mặc định bị thiếu hoặc lỗi thời (ví dụ: phụ thuộc systemd network-online và độ trễ khởi động lại). Khi tìm thấy điểm không khớp, doctor đề xuất cập nhật và có thể ghi lại tệp service/task về các mặc định hiện tại.

    Ghi chú:

    - `openclaw doctor` hỏi trước khi ghi lại cấu hình supervisor.
    - `openclaw doctor --yes` chấp nhận các lời nhắc sửa mặc định.
    - `openclaw doctor --repair` áp dụng các bản sửa được đề xuất mà không hỏi.
    - `openclaw doctor --repair --force` ghi đè cấu hình supervisor tùy chỉnh.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` giữ doctor ở chế độ chỉ đọc đối với vòng đời dịch vụ Gateway. Nó vẫn báo cáo tình trạng dịch vụ và chạy các sửa chữa không thuộc dịch vụ, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap dịch vụ, ghi lại cấu hình supervisor và dọn dẹp dịch vụ cũ vì một supervisor bên ngoài sở hữu vòng đời đó.
    - Trên Linux, doctor không ghi lại metadata lệnh/entrypoint khi unit systemd Gateway tương ứng đang hoạt động. Nó cũng bỏ qua các unit phụ không cũ, không hoạt động nhưng giống Gateway trong quá trình quét dịch vụ trùng lặp để các tệp dịch vụ đồng hành không tạo nhiễu dọn dẹp.
    - Nếu xác thực bằng token yêu cầu token và `gateway.auth.token` được SecretRef quản lý, cài đặt/sửa dịch vụ của doctor xác thực SecretRef nhưng không lưu các giá trị token văn bản thuần đã phân giải vào metadata môi trường dịch vụ supervisor.
    - Doctor phát hiện các giá trị môi trường dịch vụ do quản lý `.env`/SecretRef hậu thuẫn mà các bản cài LaunchAgent, systemd hoặc Windows Scheduled Task cũ đã nhúng inline và ghi lại metadata dịch vụ để các giá trị đó tải từ nguồn runtime thay vì định nghĩa supervisor.
    - Doctor phát hiện khi lệnh dịch vụ vẫn ghim `--port` cũ sau khi `gateway.port` thay đổi và ghi lại metadata dịch vụ sang cổng hiện tại.
    - Nếu xác thực bằng token yêu cầu token và SecretRef token đã cấu hình chưa được phân giải, doctor chặn đường dẫn cài đặt/sửa kèm hướng dẫn có thể hành động.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, doctor chặn cài đặt/sửa cho đến khi mode được đặt tường minh.
    - Với các unit Linux user-systemd, kiểm tra lệch token của doctor hiện bao gồm cả nguồn `Environment=` và `EnvironmentFile=` khi so sánh metadata xác thực dịch vụ.
    - Sửa chữa dịch vụ của doctor từ chối ghi lại, dừng hoặc khởi động lại một dịch vụ Gateway từ binary OpenClaw cũ hơn khi cấu hình được ghi lần cuối bởi phiên bản mới hơn. Xem [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Bạn luôn có thể buộc ghi lại toàn bộ qua `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Chẩn đoán runtime + cổng Gateway">
    Doctor kiểm tra runtime dịch vụ (PID, trạng thái thoát gần nhất) và cảnh báo khi dịch vụ đã được cài đặt nhưng thực tế không chạy. Nó cũng kiểm tra xung đột cổng trên cổng Gateway (mặc định `18789`) và báo cáo các nguyên nhân có khả năng xảy ra (Gateway đã chạy, đường hầm SSH).
  </Accordion>
  <Accordion title="17. Thực hành tốt nhất cho runtime Gateway">
    Doctor cảnh báo khi dịch vụ Gateway chạy trên Bun hoặc đường dẫn Node được quản lý phiên bản (`nvm`, `fnm`, `volta`, `asdf`, v.v.). Các kênh WhatsApp + Telegram yêu cầu Node, và đường dẫn trình quản lý phiên bản có thể hỏng sau khi nâng cấp vì dịch vụ không tải khởi tạo shell của bạn. Doctor đề xuất di chuyển sang bản cài Node hệ thống khi có sẵn (Homebrew/apt/choco).

    Các macOS LaunchAgent mới được cài đặt hoặc sửa chữa dùng PATH hệ thống chuẩn (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) thay vì sao chép PATH của shell tương tác, vì vậy Volta, asdf, fnm, pnpm và các thư mục trình quản lý phiên bản khác không thay đổi Node nào mà tiến trình con phân giải. Dịch vụ Linux vẫn giữ các gốc môi trường tường minh (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) và các thư mục user-bin ổn định, nhưng các thư mục dự phòng trình quản lý phiên bản được đoán chỉ được ghi vào PATH dịch vụ khi các thư mục đó tồn tại trên đĩa.

  </Accordion>
  <Accordion title="18. Ghi cấu hình + metadata wizard">
    Doctor lưu mọi thay đổi cấu hình và đóng dấu metadata wizard để ghi lại lần chạy doctor.
  </Accordion>
  <Accordion title="19. Mẹo không gian làm việc (sao lưu + hệ thống bộ nhớ)">
    Doctor đề xuất một hệ thống bộ nhớ không gian làm việc khi thiếu và in mẹo sao lưu nếu không gian làm việc chưa nằm trong git.

    Xem [/concepts/agent-workspace](/vi/concepts/agent-workspace) để biết hướng dẫn đầy đủ về cấu trúc không gian làm việc và sao lưu git (khuyến nghị GitHub hoặc GitLab riêng tư).

  </Accordion>
</AccordionGroup>

## Liên quan

- [Runbook Gateway](/vi/gateway)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
