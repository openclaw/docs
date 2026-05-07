---
read_when:
    - Thêm hoặc sửa đổi các di trú của doctor
    - Đưa vào các thay đổi cấu hình phá vỡ tương thích
sidebarTitle: Doctor
summary: 'Lệnh doctor: kiểm tra tình trạng, chuyển đổi cấu hình và các bước sửa chữa'
title: Trình chẩn đoán
x-i18n:
    generated_at: "2026-05-07T13:17:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7826cb4f3e97e56b07a5ba3b1c61860b15d6831d29012a0a16fe8f5f7014d1d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` là công cụ sửa chữa + di chuyển cho OpenClaw. Công cụ này sửa cấu hình/trạng thái lỗi thời, kiểm tra sức khỏe và cung cấp các bước sửa chữa có thể thực hiện.

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

    Chấp nhận giá trị mặc định mà không hỏi (bao gồm các bước sửa chữa khởi động lại/dịch vụ/sandbox khi áp dụng).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Áp dụng các sửa chữa được khuyến nghị mà không hỏi (sửa chữa + khởi động lại ở những nơi an toàn).

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

    Chạy không có lời nhắc và chỉ áp dụng các di chuyển an toàn (chuẩn hóa cấu hình + di chuyển trạng thái trên đĩa). Bỏ qua các thao tác khởi động lại/dịch vụ/sandbox cần xác nhận của con người. Các di chuyển trạng thái cũ tự động chạy khi được phát hiện.

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

## Công cụ làm gì (tóm tắt)

<AccordionGroup>
  <Accordion title="Sức khỏe, UI và cập nhật">
    - Cập nhật pre-flight tùy chọn cho các bản cài đặt git (chỉ tương tác).
    - Kiểm tra độ mới của giao thức UI (xây dựng lại Control UI khi schema giao thức mới hơn).
    - Kiểm tra sức khỏe + lời nhắc khởi động lại.
    - Tóm tắt trạng thái Skills (đủ điều kiện/thiếu/bị chặn) và trạng thái Plugin.

  </Accordion>
  <Accordion title="Cấu hình và di chuyển">
    - Chuẩn hóa cấu hình cho các giá trị cũ.
    - Di chuyển cấu hình Talk từ các trường phẳng `talk.*` cũ vào `talk.provider` + `talk.providers.<provider>`.
    - Kiểm tra di chuyển trình duyệt cho cấu hình Chrome extension cũ và mức sẵn sàng của Chrome MCP.
    - Cảnh báo ghi đè OpenCode provider (`models.providers.opencode` / `models.providers.opencode-go`).
    - Cảnh báo che khuất Codex OAuth (`models.providers.openai-codex`).
    - Kiểm tra điều kiện tiên quyết OAuth TLS cho hồ sơ OpenAI Codex OAuth.
    - Cảnh báo danh sách cho phép Plugin/công cụ khi `plugins.allow` hạn chế nhưng chính sách công cụ vẫn yêu cầu wildcard hoặc công cụ do Plugin sở hữu.
    - Di chuyển trạng thái cũ trên đĩa (sessions/thư mục agent/xác thực WhatsApp).
    - Di chuyển khóa hợp đồng manifest Plugin cũ (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Di chuyển kho Cron cũ (`jobId`, `schedule.cron`, các trường delivery/payload cấp cao nhất, payload `provider`, các job webhook dự phòng đơn giản `notify: true`).
    - Di chuyển runtime-policy agent cũ sang `agents.defaults.agentRuntime` và `agents.list[].agentRuntime`.
    - Dọn dẹp cấu hình Plugin lỗi thời khi Plugin được bật; khi `plugins.enabled=false`, các tham chiếu Plugin lỗi thời được xem là cấu hình cô lập bất hoạt và được giữ nguyên.

  </Accordion>
  <Accordion title="Trạng thái và tính toàn vẹn">
    - Kiểm tra tệp khóa phiên và dọn dẹp khóa lỗi thời.
    - Sửa transcript phiên cho các nhánh prompt-rewrite bị trùng lặp do các bản build 2026.4.24 bị ảnh hưởng tạo ra.
    - Phát hiện tombstone phục hồi-khởi động lại subagent bị kẹt, với hỗ trợ `--fix` để xóa các cờ phục hồi đã hủy lỗi thời để lúc khởi động không tiếp tục xem child là bị hủy do khởi động lại.
    - Kiểm tra tính toàn vẹn trạng thái và quyền (sessions, transcripts, thư mục trạng thái).
    - Kiểm tra quyền tệp cấu hình (chmod 600) khi chạy cục bộ.
    - Sức khỏe xác thực mô hình: kiểm tra OAuth hết hạn, có thể làm mới token sắp hết hạn, và báo cáo trạng thái cooldown/vô hiệu hóa auth-profile.
    - Phát hiện thư mục workspace bổ sung (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, dịch vụ và supervisor">
    - Sửa chữa ảnh sandbox khi sandboxing được bật.
    - Di chuyển dịch vụ cũ và phát hiện Gateway bổ sung.
    - Di chuyển trạng thái cũ của kênh Matrix (trong chế độ `--fix` / `--repair`).
    - Kiểm tra runtime Gateway (dịch vụ đã cài nhưng không chạy; nhãn launchd được lưu cache).
    - Cảnh báo trạng thái kênh (được thăm dò từ Gateway đang chạy).
    - Kiểm tra quyền theo kênh nằm trong `openclaw channels capabilities`; ví dụ, quyền kênh thoại Discord được kiểm tra bằng `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Kiểm tra khả năng phản hồi WhatsApp khi sức khỏe event-loop của Gateway suy giảm trong khi client TUI cục bộ vẫn đang chạy; `--fix` chỉ dừng các client TUI cục bộ đã được xác minh.
    - Sửa tuyến Codex cho các tham chiếu mô hình `openai-codex/*` cũ trong mô hình chính, fallback, ghi đè heartbeat/subagent/compaction, hook, ghi đè mô hình kênh và ghim tuyến phiên; `--fix` ghi lại chúng thành `openai/*` và chỉ chọn `agentRuntime.id: "codex"` khi Plugin Codex đã được cài đặt, bật, đóng góp harness `codex`, và có OAuth dùng được. Nếu không, công cụ chọn `agentRuntime.id: "pi"`.
    - Kiểm tra cấu hình supervisor (launchd/systemd/schtasks) với sửa chữa tùy chọn.
    - Dọn dẹp môi trường proxy nhúng cho các dịch vụ Gateway đã ghi lại giá trị shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` trong quá trình cài đặt hoặc cập nhật.
    - Kiểm tra thực hành tốt nhất cho runtime Gateway (Node so với Bun, đường dẫn trình quản lý phiên bản).
    - Chẩn đoán xung đột cổng Gateway (mặc định `18789`).

  </Accordion>
  <Accordion title="Xác thực, bảo mật và ghép đôi">
    - Cảnh báo bảo mật cho chính sách DM mở.
    - Kiểm tra xác thực Gateway cho chế độ token cục bộ (đề xuất tạo token khi không có nguồn token; không ghi đè cấu hình token SecretRef).
    - Phát hiện sự cố ghép đôi thiết bị (yêu cầu ghép đôi lần đầu đang chờ, nâng cấp vai trò/phạm vi đang chờ, trôi lệch cache device-token cục bộ lỗi thời và trôi lệch xác thực bản ghi đã ghép đôi).

  </Accordion>
  <Accordion title="Workspace và shell">
    - Kiểm tra systemd linger trên Linux.
    - Kiểm tra kích thước tệp bootstrap workspace (cảnh báo bị cắt/gần giới hạn cho tệp ngữ cảnh).
    - Kiểm tra mức sẵn sàng của Skills cho agent mặc định; báo cáo các skill được phép nhưng thiếu binary, env, cấu hình hoặc yêu cầu OS, và `--fix` có thể vô hiệu hóa các skill không khả dụng trong `skills.entries`.
    - Kiểm tra trạng thái hoàn thành shell và tự động cài đặt/nâng cấp.
    - Kiểm tra mức sẵn sàng của provider embedding tìm kiếm bộ nhớ (mô hình cục bộ, khóa API từ xa hoặc binary QMD).
    - Kiểm tra cài đặt từ nguồn (pnpm workspace không khớp, thiếu tài sản UI, thiếu binary tsx).
    - Ghi cấu hình đã cập nhật + metadata wizard.

  </Accordion>
</AccordionGroup>

## Điền bù và đặt lại Dreams UI

Cảnh Dreams trong Control UI bao gồm các hành động **Backfill**, **Reset** và **Clear Grounded** cho quy trình dreaming grounded. Các hành động này dùng các phương thức RPC kiểu gateway doctor, nhưng chúng **không** thuộc phần sửa chữa/di chuyển của CLI `openclaw doctor`.

Chúng làm gì:

- **Backfill** quét các tệp lịch sử `memory/YYYY-MM-DD.md` trong workspace đang hoạt động, chạy lượt nhật ký REM grounded, và ghi các mục điền bù có thể đảo ngược vào `DREAMS.md`.
- **Reset** chỉ xóa các mục nhật ký điền bù được đánh dấu đó khỏi `DREAMS.md`.
- **Clear Grounded** chỉ xóa các mục ngắn hạn chỉ-grounded đã được staged, đến từ phát lại lịch sử và chưa tích lũy recall trực tiếp hoặc hỗ trợ hằng ngày.

Những gì chúng **không** tự làm:

- chúng không chỉnh sửa `MEMORY.md`
- chúng không chạy đầy đủ các di chuyển doctor
- chúng không tự động stage các ứng viên grounded vào kho thăng hạng ngắn hạn trực tiếp trừ khi bạn chạy rõ ràng đường dẫn CLI staged trước

Nếu bạn muốn phát lại lịch sử grounded ảnh hưởng đến lane thăng hạng sâu bình thường, hãy dùng luồng CLI thay thế:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Lệnh đó stage các ứng viên bền vững grounded vào kho dreaming ngắn hạn trong khi giữ `DREAMS.md` làm bề mặt review.

## Hành vi chi tiết và lý do

<AccordionGroup>
  <Accordion title="0. Cập nhật tùy chọn (bản cài đặt git)">
    Nếu đây là một git checkout và doctor đang chạy tương tác, công cụ đề nghị cập nhật (fetch/rebase/build) trước khi chạy doctor.
  </Accordion>
  <Accordion title="1. Chuẩn hóa cấu hình">
    Nếu cấu hình chứa các dạng giá trị cũ (ví dụ `messages.ackReaction` không có ghi đè theo kênh), doctor chuẩn hóa chúng vào schema hiện tại.

    Điều đó bao gồm các trường phẳng Talk cũ. Cấu hình giọng nói Talk công khai hiện tại là `talk.provider` + `talk.providers.<provider>`, và cấu hình giọng nói thời gian thực là `talk.realtime.*`. Doctor ghi lại các dạng `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` cũ vào bản đồ provider, và ghi lại các bộ chọn thời gian thực cấp cao nhất cũ (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) vào `talk.realtime`.

    Doctor cũng cảnh báo khi `plugins.allow` không rỗng và chính sách công cụ dùng
    các mục công cụ wildcard hoặc do Plugin sở hữu. `tools.allow: ["*"]` chỉ khớp với công cụ
    từ các Plugin thực sự tải; nó không bỏ qua danh sách cho phép Plugin độc quyền.
    Doctor ghi `plugins.bundledDiscovery: "compat"` cho các cấu hình danh sách cho phép
    cũ đã di chuyển để giữ nguyên hành vi provider đi kèm hiện có, rồi
    trỏ tới thiết lập `"allowlist"` nghiêm ngặt hơn.

  </Accordion>
  <Accordion title="2. Di chuyển khóa cấu hình cũ">
    Khi cấu hình chứa các khóa không còn dùng, các lệnh khác từ chối chạy và yêu cầu bạn chạy `openclaw doctor`.

    Doctor sẽ:

    - Giải thích những khóa cũ nào đã được tìm thấy.
    - Hiển thị quá trình di chuyển đã áp dụng.
    - Ghi lại `~/.openclaw/openclaw.json` bằng schema đã cập nhật.

    Khởi động Gateway từ chối các định dạng cấu hình cũ và yêu cầu bạn chạy `openclaw doctor --fix`; nó không ghi lại `openclaw.json` khi khởi động. Việc di chuyển kho Cron job cũng được xử lý bởi `openclaw doctor --fix`.

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
    - Với các kênh có `accounts` được đặt tên nhưng vẫn còn các giá trị kênh cấp cao nhất cho một tài khoản, hãy chuyển các giá trị thuộc phạm vi tài khoản đó vào tài khoản được nâng cấp đã chọn cho kênh đó (`accounts.default` cho hầu hết các kênh; Matrix có thể giữ lại một đích có tên/mặc định khớp hiện có)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - xóa `agents.defaults.llm`; dùng `models.providers.<id>.timeoutSeconds` cho thời gian chờ provider/model chậm
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - xóa `browser.relayBindHost` (thiết lập relay extension cũ)
    - `models.providers.*.api: "openai"` cũ → `"openai-completions"` (khi khởi động Gateway cũng bỏ qua các provider có `api` được đặt thành giá trị enum tương lai hoặc không xác định thay vì đóng lỗi)

    Cảnh báo của doctor cũng bao gồm hướng dẫn tài khoản mặc định cho các kênh nhiều tài khoản:

    - Nếu hai hoặc nhiều mục `channels.<channel>.accounts` được cấu hình mà không có `channels.<channel>.defaultAccount` hoặc `accounts.default`, doctor cảnh báo rằng định tuyến dự phòng có thể chọn một tài khoản không mong muốn.
    - Nếu `channels.<channel>.defaultAccount` được đặt thành ID tài khoản không xác định, doctor cảnh báo và liệt kê các ID tài khoản đã cấu hình.

  </Accordion>
  <Accordion title="2b. Ghi đè provider OpenCode">
    Nếu bạn đã thêm `models.providers.opencode`, `opencode-zen`, hoặc `opencode-go` theo cách thủ công, mục đó sẽ ghi đè catalog OpenCode tích hợp từ `@mariozechner/pi-ai`. Điều đó có thể ép model dùng sai API hoặc đặt chi phí về 0. Doctor cảnh báo để bạn có thể xóa ghi đè và khôi phục định tuyến API + chi phí theo từng model.
  </Accordion>
  <Accordion title="2c. Di chuyển trình duyệt và mức sẵn sàng Chrome MCP">
    Nếu cấu hình trình duyệt của bạn vẫn trỏ đến đường dẫn Chrome extension đã bị xóa, doctor chuẩn hóa nó sang mô hình gắn Chrome MCP cục bộ trên host hiện tại:

    - `browser.profiles.*.driver: "extension"` trở thành `"existing-session"`
    - `browser.relayBindHost` bị xóa

    Doctor cũng kiểm tra đường dẫn Chrome MCP cục bộ trên host khi bạn dùng `defaultProfile: "user"` hoặc một profile `existing-session` đã cấu hình:

    - kiểm tra Google Chrome có được cài trên cùng host cho các profile tự động kết nối mặc định hay không
    - kiểm tra phiên bản Chrome được phát hiện và cảnh báo khi phiên bản đó thấp hơn Chrome 144
    - nhắc bạn bật gỡ lỗi từ xa trong trang kiểm tra của trình duyệt (ví dụ `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, hoặc `edge://inspect/#remote-debugging`)

    Doctor không thể bật thiết lập phía Chrome thay bạn. Chrome MCP cục bộ trên host vẫn yêu cầu:

    - trình duyệt dựa trên Chromium 144+ trên host gateway/node
    - trình duyệt đang chạy cục bộ
    - gỡ lỗi từ xa được bật trong trình duyệt đó
    - phê duyệt lời nhắc đồng ý gắn lần đầu trong trình duyệt

    Mức sẵn sàng ở đây chỉ nói về các điều kiện tiên quyết để gắn cục bộ. Existing-session giữ các giới hạn tuyến Chrome MCP hiện tại; các tuyến nâng cao như `responsebody`, xuất PDF, chặn tải xuống và hành động hàng loạt vẫn yêu cầu trình duyệt được quản lý hoặc profile CDP thô.

    Kiểm tra này **không** áp dụng cho Docker, sandbox, remote-browser, hoặc các luồng headless khác. Những luồng đó tiếp tục dùng CDP thô.

  </Accordion>
  <Accordion title="2d. Điều kiện tiên quyết TLS cho OAuth">
    Khi một profile OpenAI Codex OAuth được cấu hình, doctor dò endpoint ủy quyền OpenAI để xác minh rằng ngăn xếp TLS Node/OpenSSL cục bộ có thể xác thực chuỗi chứng chỉ. Nếu phép dò thất bại với lỗi chứng chỉ (ví dụ `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, chứng chỉ hết hạn, hoặc chứng chỉ tự ký), doctor in hướng dẫn sửa lỗi theo từng nền tảng. Trên macOS với Node từ Homebrew, cách sửa thường là `brew postinstall ca-certificates`. Với `--deep`, phép dò chạy ngay cả khi gateway khỏe mạnh.
  </Accordion>
  <Accordion title="2e. Ghi đè provider Codex OAuth">
    Nếu trước đây bạn đã thêm thiết lập vận chuyển OpenAI cũ dưới `models.providers.openai-codex`, chúng có thể che khuất đường dẫn provider Codex OAuth tích hợp mà các bản phát hành mới hơn tự động sử dụng. Doctor cảnh báo khi thấy các thiết lập vận chuyển cũ đó cùng với Codex OAuth để bạn có thể xóa hoặc viết lại ghi đè vận chuyển lỗi thời và khôi phục hành vi định tuyến/dự phòng tích hợp. Proxy tùy chỉnh và ghi đè chỉ header vẫn được hỗ trợ và không kích hoạt cảnh báo này.
  </Accordion>
  <Accordion title="2f. Sửa tuyến Codex">
    Doctor kiểm tra các tham chiếu model `openai-codex/*` cũ. Định tuyến native Codex harness dùng các tham chiếu model chuẩn `openai/*`; các lượt agent OpenAI đi qua Codex app-server harness thay vì đường dẫn OpenClaw PI OpenAI.

    Ở chế độ `--fix` / `--repair`, doctor viết lại các tham chiếu default-agent và theo từng agent bị ảnh hưởng, bao gồm model chính, dự phòng, ghi đè heartbeat/subagent/compaction, hook, ghi đè model kênh và trạng thái tuyến phiên đã lưu cũ:

    - `openai-codex/gpt-*` trở thành `openai/gpt-*`.
    - Runtime agent khớp trở thành `agentRuntime.id: "codex"` chỉ khi Codex đã được cài đặt, bật, đóng góp `codex` harness và có OAuth dùng được.
    - Nếu không, runtime agent khớp trở thành `agentRuntime.id: "pi"`.
    - Các danh sách model dự phòng hiện có được giữ nguyên với các mục cũ được viết lại; thiết lập theo model được sao chép sẽ chuyển từ khóa cũ sang khóa chuẩn `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, thông báo dự phòng, ghim auth-profile và ghim Codex harness trong phiên đã lưu được sửa trên mọi kho phiên agent được phát hiện.
    - `/codex ...` nghĩa là "điều khiển hoặc liên kết một cuộc hội thoại Codex native từ chat."
    - `/acp ...` hoặc `runtime: "acp"` nghĩa là "dùng adapter ACP/acpx bên ngoài."

  </Accordion>
  <Accordion title="2g. Dọn dẹp tuyến phiên">
    Doctor cũng quét các kho phiên agent được phát hiện để tìm trạng thái tuyến tự động tạo đã cũ sau khi bạn chuyển model hoặc runtime đã cấu hình khỏi một tuyến do Plugin sở hữu như Codex.

    `openclaw doctor --fix` có thể xóa trạng thái cũ tự động tạo như ghim model `modelOverrideSource: "auto"`, siêu dữ liệu model runtime, ID harness đã ghim, liên kết phiên CLI và ghi đè auth-profile tự động khi tuyến sở hữu chúng không còn được cấu hình. Các lựa chọn model phiên rõ ràng của người dùng hoặc phiên cũ được báo cáo để xem xét thủ công và giữ nguyên; chuyển chúng bằng `/model ...`, `/new`, hoặc đặt lại phiên khi tuyến đó không còn được dự định sử dụng.

  </Accordion>
  <Accordion title="3. Di chuyển trạng thái cũ (bố cục đĩa)">
    Doctor có thể di chuyển các bố cục trên đĩa cũ hơn sang cấu trúc hiện tại:

    - Kho phiên + bản ghi hội thoại:
      - từ `~/.openclaw/sessions/` sang `~/.openclaw/agents/<agentId>/sessions/`
    - Thư mục agent:
      - từ `~/.openclaw/agent/` sang `~/.openclaw/agents/<agentId>/agent/`
    - Trạng thái xác thực WhatsApp (Baileys):
      - từ `~/.openclaw/credentials/*.json` cũ (ngoại trừ `oauth.json`)
      - sang `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID tài khoản mặc định: `default`)

    Các lần di chuyển này theo nguyên tắc nỗ lực tối đa và có tính lũy đẳng; doctor sẽ phát cảnh báo khi để lại bất kỳ thư mục cũ nào làm bản sao lưu. Gateway/CLI cũng tự động di chuyển các phiên cũ + thư mục agent khi khởi động để lịch sử/xác thực/model nằm trong đường dẫn theo từng agent mà không cần chạy doctor thủ công. Xác thực WhatsApp được chủ ý chỉ di chuyển qua `openclaw doctor`. Việc chuẩn hóa provider/provider-map của Talk giờ so sánh bằng đẳng thức cấu trúc, nên các khác biệt chỉ do thứ tự khóa không còn kích hoạt lặp lại các thay đổi `doctor --fix` không có hiệu lực.

  </Accordion>
  <Accordion title="3a. Di chuyển manifest Plugin cũ">
    Doctor quét tất cả manifest Plugin đã cài đặt để tìm các khóa khả năng cấp cao nhất đã lỗi thời (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Khi tìm thấy, doctor đề nghị chuyển chúng vào đối tượng `contracts` và viết lại tệp manifest tại chỗ. Việc di chuyển này có tính lũy đẳng; nếu khóa `contracts` đã có cùng giá trị, khóa cũ sẽ bị xóa mà không nhân đôi dữ liệu.
  </Accordion>
  <Accordion title="3b. Di chuyển kho cron cũ">
    Doctor cũng kiểm tra kho công việc cron (`~/.openclaw/cron/jobs.json` theo mặc định, hoặc `cron.store` khi được ghi đè) để tìm các dạng công việc cũ mà bộ lập lịch vẫn chấp nhận vì tương thích.

    Các dọn dẹp cron hiện tại bao gồm:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - các trường payload cấp cao nhất (`message`, `model`, `thinking`, ...) → `payload`
    - các trường delivery cấp cao nhất (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - bí danh delivery `provider` trong payload → `delivery.channel` rõ ràng
    - các công việc fallback webhook cũ đơn giản `notify: true` → `delivery.mode="webhook"` rõ ràng với `delivery.to=cron.webhook`

    Doctor chỉ tự động di chuyển các tác vụ `notify: true` khi việc đó có thể thực hiện mà không làm thay đổi hành vi. Nếu một tác vụ kết hợp cơ chế dự phòng notify cũ với một chế độ gửi không phải webhook hiện có, doctor sẽ cảnh báo và để tác vụ đó lại để xem xét thủ công.

    Trên Linux, doctor cũng cảnh báo khi crontab của người dùng vẫn gọi `~/.openclaw/bin/ensure-whatsapp.sh` cũ. Script cục bộ trên máy chủ đó không được OpenClaw hiện tại duy trì và có thể ghi các thông báo `Gateway inactive` sai vào `~/.openclaw/logs/whatsapp-health.log` khi cron không thể truy cập systemd user bus. Xóa mục crontab cũ bằng `crontab -e`; dùng `openclaw channels status --probe`, `openclaw doctor` và `openclaw gateway status` cho các kiểm tra tình trạng hiện tại.

  </Accordion>
  <Accordion title="3c. Dọn dẹp khóa phiên">
    Doctor quét mọi thư mục phiên agent để tìm các tệp khóa ghi cũ — các tệp bị bỏ lại khi một phiên thoát bất thường. Với mỗi tệp khóa tìm thấy, nó báo cáo: đường dẫn, PID, PID còn sống hay không, tuổi của khóa và liệu khóa có được xem là cũ hay không (PID đã chết hoặc cũ hơn 30 phút). Ở chế độ `--fix` / `--repair`, nó tự động xóa các tệp khóa cũ; nếu không, nó in một ghi chú và hướng dẫn bạn chạy lại với `--fix`.
  </Accordion>
  <Accordion title="3d. Sửa chữa nhánh transcript phiên">
    Doctor quét các tệp JSONL phiên agent để tìm dạng nhánh trùng lặp được tạo bởi lỗi ghi lại transcript prompt ngày 2026.4.24: một lượt người dùng bị bỏ rơi có ngữ cảnh runtime nội bộ của OpenClaw cùng với một nhánh anh em đang hoạt động chứa cùng prompt người dùng hiển thị. Ở chế độ `--fix` / `--repair`, doctor sao lưu từng tệp bị ảnh hưởng cạnh tệp gốc và ghi lại transcript sang nhánh đang hoạt động để lịch sử gateway và trình đọc bộ nhớ không còn thấy các lượt trùng lặp.
  </Accordion>
  <Accordion title="4. Kiểm tra tính toàn vẹn trạng thái (lưu phiên, định tuyến và an toàn)">
    Thư mục trạng thái là lõi vận hành. Nếu nó biến mất, bạn sẽ mất phiên, thông tin xác thực, nhật ký và cấu hình (trừ khi bạn có bản sao lưu ở nơi khác).

    Doctor kiểm tra:

    - **Thiếu thư mục trạng thái**: cảnh báo về mất trạng thái nghiêm trọng, nhắc tạo lại thư mục và nhắc rằng nó không thể khôi phục dữ liệu bị thiếu.
    - **Quyền thư mục trạng thái**: xác minh khả năng ghi; đề nghị sửa quyền (và phát ra gợi ý `chown` khi phát hiện chủ sở hữu/nhóm không khớp).
    - **Thư mục trạng thái được đồng bộ đám mây trên macOS**: cảnh báo khi trạng thái trỏ vào iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) hoặc `~/Library/CloudStorage/...` vì các đường dẫn được hỗ trợ bởi đồng bộ có thể gây I/O chậm hơn và các cuộc đua khóa/đồng bộ.
    - **Thư mục trạng thái trên SD hoặc eMMC của Linux**: cảnh báo khi trạng thái trỏ tới nguồn mount `mmcblk*`, vì I/O ngẫu nhiên dựa trên SD hoặc eMMC có thể chậm hơn và mòn nhanh hơn khi ghi phiên và thông tin xác thực.
    - **Thiếu thư mục phiên**: `sessions/` và thư mục lưu phiên là bắt buộc để lưu lịch sử và tránh sự cố `ENOENT`.
    - **Không khớp transcript**: cảnh báo khi các mục phiên gần đây thiếu tệp transcript.
    - **Phiên chính "JSONL 1 dòng"**: đánh dấu khi transcript chính chỉ có một dòng (lịch sử không được tích lũy).
    - **Nhiều thư mục trạng thái**: cảnh báo khi nhiều thư mục `~/.openclaw` tồn tại trên các thư mục home hoặc khi `OPENCLAW_STATE_DIR` trỏ tới nơi khác (lịch sử có thể bị tách giữa các bản cài đặt).
    - **Nhắc nhở chế độ từ xa**: nếu `gateway.mode=remote`, doctor nhắc bạn chạy nó trên máy chủ từ xa (trạng thái nằm ở đó).
    - **Quyền tệp cấu hình**: cảnh báo nếu `~/.openclaw/openclaw.json` có thể đọc bởi nhóm/mọi người và đề nghị siết lại thành `600`.

  </Accordion>
  <Accordion title="5. Tình trạng xác thực mô hình (OAuth hết hạn)">
    Doctor kiểm tra các hồ sơ OAuth trong kho xác thực, cảnh báo khi token sắp hết hạn/đã hết hạn và có thể làm mới chúng khi an toàn. Nếu hồ sơ Anthropic OAuth/token đã cũ, nó đề xuất khóa API Anthropic hoặc đường dẫn setup-token của Anthropic. Lời nhắc làm mới chỉ xuất hiện khi chạy tương tác (TTY); `--non-interactive` bỏ qua các lần thử làm mới.

    Khi làm mới OAuth thất bại vĩnh viễn (ví dụ `refresh_token_reused`, `invalid_grant`, hoặc nhà cung cấp yêu cầu bạn đăng nhập lại), doctor báo rằng cần xác thực lại và in chính xác lệnh `openclaw models auth login --provider ...` cần chạy.

    Doctor cũng báo cáo các hồ sơ xác thực tạm thời không dùng được do:

    - thời gian chờ ngắn (giới hạn tốc độ/hết thời gian chờ/lỗi xác thực)
    - vô hiệu hóa dài hơn (lỗi thanh toán/tín dụng)

  </Accordion>
  <Accordion title="6. Xác thực mô hình hook">
    Nếu `hooks.gmail.model` được đặt, doctor xác thực tham chiếu mô hình với danh mục và danh sách cho phép, đồng thời cảnh báo khi nó không phân giải được hoặc không được phép.
  </Accordion>
  <Accordion title="7. Sửa chữa ảnh sandbox">
    Khi sandbox được bật, doctor kiểm tra ảnh Docker và đề nghị build hoặc chuyển sang tên cũ nếu thiếu ảnh hiện tại.
  </Accordion>
  <Accordion title="7b. Dọn dẹp cài đặt Plugin">
    Doctor xóa trạng thái staging dependency Plugin cũ do OpenClaw tạo ở chế độ `openclaw doctor --fix` / `openclaw doctor --repair`. Phần này bao gồm các gốc dependency được tạo cũ, thư mục install-stage cũ, mảnh vụn cục bộ trong package từ mã sửa chữa dependency bundled-plugin trước đây, và các bản sao npm được quản lý của Plugin `@openclaw/*` đóng gói bị mồ côi hoặc được khôi phục có thể che khuất manifest đóng gói hiện tại.

    Doctor cũng có thể cài đặt lại các Plugin có thể tải xuống bị thiếu khi cấu hình tham chiếu đến chúng nhưng registry Plugin cục bộ không tìm thấy. Ví dụ bao gồm `plugins.entries` thực tế, cài đặt channel/provider/search đã cấu hình và runtime agent đã cấu hình. Trong quá trình cập nhật package, doctor tránh chạy sửa chữa Plugin bằng trình quản lý package khi core package đang được thay thế; chạy lại `openclaw doctor --fix` sau khi cập nhật nếu một Plugin đã cấu hình vẫn cần khôi phục. Khởi động Gateway và tải lại cấu hình không chạy trình quản lý package; cài đặt Plugin vẫn là công việc doctor/install/update rõ ràng.

  </Accordion>
  <Accordion title="8. Di chuyển dịch vụ Gateway và gợi ý dọn dẹp">
    Doctor phát hiện các dịch vụ gateway cũ (launchd/systemd/schtasks) và đề nghị xóa chúng rồi cài đặt dịch vụ OpenClaw bằng cổng gateway hiện tại. Nó cũng có thể quét các dịch vụ giống gateway bổ sung và in gợi ý dọn dẹp. Các dịch vụ gateway OpenClaw đặt tên theo hồ sơ được xem là hạng nhất và không bị đánh dấu là "bổ sung."

    Trên Linux, nếu thiếu dịch vụ gateway cấp người dùng nhưng tồn tại dịch vụ gateway OpenClaw cấp hệ thống, doctor không tự động cài đặt dịch vụ cấp người dùng thứ hai. Kiểm tra bằng `openclaw gateway status --deep` hoặc `openclaw doctor --deep`, rồi xóa bản trùng lặp hoặc đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một trình giám sát hệ thống sở hữu vòng đời gateway.

  </Accordion>
  <Accordion title="8b. Di chuyển Startup Matrix">
    Khi một tài khoản channel Matrix có di chuyển trạng thái cũ đang chờ hoặc có thể xử lý, doctor (ở chế độ `--fix` / `--repair`) tạo ảnh chụp trước di chuyển rồi chạy các bước di chuyển theo khả năng tốt nhất: di chuyển trạng thái Matrix cũ và chuẩn bị trạng thái được mã hóa cũ. Cả hai bước đều không gây lỗi nghiêm trọng; lỗi được ghi nhật ký và khởi động tiếp tục. Ở chế độ chỉ đọc (`openclaw doctor` không có `--fix`), kiểm tra này bị bỏ qua hoàn toàn.
  </Accordion>
  <Accordion title="8c. Ghép đôi thiết bị và lệch xác thực">
    Doctor hiện kiểm tra trạng thái ghép đôi thiết bị như một phần của lượt kiểm tra tình trạng bình thường.

    Nội dung nó báo cáo:

    - yêu cầu ghép đôi lần đầu đang chờ
    - nâng cấp vai trò đang chờ cho thiết bị đã ghép đôi
    - nâng cấp phạm vi đang chờ cho thiết bị đã ghép đôi
    - sửa chữa không khớp khóa công khai khi id thiết bị vẫn khớp nhưng danh tính thiết bị không còn khớp với bản ghi đã phê duyệt
    - bản ghi đã ghép đôi thiếu token hoạt động cho vai trò đã phê duyệt
    - token đã ghép đôi có phạm vi lệch ra ngoài đường cơ sở ghép đôi đã phê duyệt
    - mục token thiết bị được lưu cache cục bộ cho máy hiện tại có trước một lần xoay vòng token phía gateway hoặc mang siêu dữ liệu phạm vi cũ

    Doctor không tự động phê duyệt yêu cầu ghép đôi hoặc tự động xoay vòng token thiết bị. Thay vào đó, nó in chính xác các bước tiếp theo:

    - kiểm tra yêu cầu đang chờ bằng `openclaw devices list`
    - phê duyệt yêu cầu chính xác bằng `openclaw devices approve <requestId>`
    - xoay vòng token mới bằng `openclaw devices rotate --device <deviceId> --role <role>`
    - xóa và phê duyệt lại bản ghi cũ bằng `openclaw devices remove <deviceId>`

    Điều này đóng lỗ hổng phổ biến "đã ghép đôi nhưng vẫn bị yêu cầu ghép đôi": doctor hiện phân biệt ghép đôi lần đầu với nâng cấp vai trò/phạm vi đang chờ và với lệch token/danh tính thiết bị cũ.

  </Accordion>
  <Accordion title="9. Cảnh báo bảo mật">
    Doctor phát cảnh báo khi một nhà cung cấp mở cho DM mà không có danh sách cho phép, hoặc khi một chính sách được cấu hình theo cách nguy hiểm.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Nếu chạy dưới dạng dịch vụ người dùng systemd, doctor đảm bảo lingering được bật để gateway vẫn hoạt động sau khi đăng xuất.
  </Accordion>
  <Accordion title="11. Trạng thái workspace (Skills, Plugin và thư mục cũ)">
    Doctor in tóm tắt trạng thái workspace cho agent mặc định:

    - **Trạng thái Skills**: đếm Skills đủ điều kiện, thiếu yêu cầu và bị chặn bởi danh sách cho phép.
    - **Thư mục workspace cũ**: cảnh báo khi `~/openclaw` hoặc các thư mục workspace cũ khác tồn tại cạnh workspace hiện tại.
    - **Trạng thái Plugin**: đếm Plugin đã bật/đã tắt/lỗi; liệt kê ID Plugin cho mọi lỗi; báo cáo khả năng của Plugin đóng gói.
    - **Cảnh báo tương thích Plugin**: đánh dấu Plugin có vấn đề tương thích với runtime hiện tại.
    - **Chẩn đoán Plugin**: hiển thị mọi cảnh báo hoặc lỗi tại thời điểm tải do registry Plugin phát ra.

  </Accordion>
  <Accordion title="11b. Kích thước tệp bootstrap">
    Doctor kiểm tra xem các tệp bootstrap workspace (ví dụ `AGENTS.md`, `CLAUDE.md`, hoặc các tệp ngữ cảnh được chèn khác) có gần hoặc vượt quá ngân sách ký tự đã cấu hình hay không. Nó báo cáo số ký tự thô so với đã chèn cho từng tệp, phần trăm cắt bớt, nguyên nhân cắt bớt (`max/file` hoặc `max/total`) và tổng ký tự đã chèn dưới dạng tỷ lệ của tổng ngân sách. Khi tệp bị cắt bớt hoặc gần giới hạn, doctor in mẹo để điều chỉnh `agents.defaults.bootstrapMaxChars` và `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Dọn dẹp Plugin channel cũ">
    Khi `openclaw doctor --fix` xóa một Plugin channel bị thiếu, nó cũng xóa cấu hình trong phạm vi channel bị treo đã tham chiếu đến Plugin đó: các mục `channels.<id>`, mục tiêu Heartbeat đã đặt tên channel và ghi đè `agents.*.models["<channel>/*"]`. Điều này ngăn các vòng lặp khởi động Gateway khi runtime channel đã biến mất nhưng cấu hình vẫn yêu cầu gateway bind vào nó.
  </Accordion>
  <Accordion title="11c. Hoàn tất shell">
    Doctor kiểm tra xem hoàn tất bằng phím tab đã được cài đặt cho shell hiện tại hay chưa (zsh, bash, fish hoặc PowerShell):

    - Nếu hồ sơ shell dùng mẫu hoàn tất động chậm (`source <(openclaw completion ...)`), doctor nâng cấp nó lên biến thể tệp được cache nhanh hơn.
    - Nếu hoàn tất được cấu hình trong hồ sơ nhưng thiếu tệp cache, doctor tự động tạo lại cache.
    - Nếu hoàn toàn chưa cấu hình hoàn tất, doctor nhắc cài đặt nó (chỉ ở chế độ tương tác; bỏ qua với `--non-interactive`).

    Chạy `openclaw completion --write-state` để tạo lại cache thủ công.

  </Accordion>
  <Accordion title="12. Kiểm tra xác thực Gateway (token cục bộ)">
    Doctor kiểm tra mức sẵn sàng xác thực token gateway cục bộ.

    - Nếu chế độ token cần token và không tồn tại nguồn token, doctor đề nghị tạo một token.
    - Nếu `gateway.auth.token` được quản lý bằng SecretRef nhưng không khả dụng, doctor cảnh báo và không ghi đè bằng văn bản thuần.
    - `openclaw doctor --generate-gateway-token` chỉ buộc tạo khi không có SecretRef token nào được cấu hình.

  </Accordion>
  <Accordion title="12b. Sửa chữa nhận biết SecretRef ở chế độ chỉ đọc">
    Một số luồng sửa chữa cần kiểm tra thông tin xác thực đã cấu hình mà không làm suy yếu hành vi thất bại nhanh của runtime.

    - `openclaw doctor --fix` hiện dùng cùng mô hình tóm tắt SecretRef chỉ đọc như các lệnh thuộc nhóm trạng thái cho các sửa chữa cấu hình có mục tiêu.
    - Ví dụ: sửa chữa `allowFrom` / `groupAllowFrom` `@username` của Telegram cố gắng dùng thông tin xác thực bot đã cấu hình khi có sẵn.
    - Nếu token bot Telegram được cấu hình qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại, doctor báo cáo rằng thông tin xác thực đã được cấu hình nhưng không khả dụng và bỏ qua tự động phân giải thay vì bị lỗi hoặc báo sai rằng token bị thiếu.

  </Accordion>
  <Accordion title="13. Kiểm tra sức khỏe Gateway + khởi động lại">
    Doctor chạy kiểm tra sức khỏe và đề xuất khởi động lại gateway khi có vẻ không khỏe.
  </Accordion>
  <Accordion title="13b. Mức độ sẵn sàng của tìm kiếm bộ nhớ">
    Doctor kiểm tra xem nhà cung cấp embedding cho tìm kiếm bộ nhớ đã cấu hình có sẵn sàng cho tác tử mặc định hay không. Hành vi phụ thuộc vào backend và nhà cung cấp đã cấu hình:

    - **Backend QMD**: kiểm tra xem binary `qmd` có khả dụng và có thể khởi động hay không. Nếu không, in hướng dẫn sửa lỗi bao gồm gói npm và tùy chọn đường dẫn binary thủ công.
    - **Nhà cung cấp cục bộ tường minh**: kiểm tra tệp mô hình cục bộ hoặc URL mô hình từ xa/có thể tải xuống được nhận diện. Nếu thiếu, đề xuất chuyển sang nhà cung cấp từ xa.
    - **Nhà cung cấp từ xa tường minh** (`openai`, `voyage`, v.v.): xác minh khóa API có trong môi trường hoặc kho xác thực. In gợi ý sửa lỗi có thể hành động nếu thiếu.
    - **Nhà cung cấp tự động**: kiểm tra tính khả dụng của mô hình cục bộ trước, rồi thử từng nhà cung cấp từ xa theo thứ tự tự động chọn.

    Khi có kết quả thăm dò gateway được lưu trong bộ nhớ đệm (gateway khỏe tại thời điểm kiểm tra), doctor đối chiếu kết quả đó với cấu hình CLI nhìn thấy được và ghi chú mọi khác biệt. Doctor không bắt đầu ping embedding mới trên đường dẫn mặc định; dùng lệnh trạng thái bộ nhớ sâu khi bạn muốn kiểm tra nhà cung cấp trực tiếp.

    Dùng `openclaw memory status --deep` để xác minh mức độ sẵn sàng của embedding lúc runtime.

  </Accordion>
  <Accordion title="14. Cảnh báo trạng thái kênh">
    Nếu gateway khỏe, doctor chạy thăm dò trạng thái kênh và báo cáo cảnh báo kèm các cách sửa được đề xuất.
  </Accordion>
  <Accordion title="15. Kiểm tra + sửa chữa cấu hình trình giám sát">
    Doctor kiểm tra cấu hình trình giám sát đã cài đặt (launchd/systemd/schtasks) để tìm các mặc định bị thiếu hoặc lỗi thời (ví dụ: phụ thuộc systemd network-online và độ trễ khởi động lại). Khi phát hiện không khớp, nó đề xuất cập nhật và có thể ghi lại tệp dịch vụ/tác vụ theo các mặc định hiện tại.

    Ghi chú:

    - `openclaw doctor` nhắc trước khi ghi lại cấu hình trình giám sát.
    - `openclaw doctor --yes` chấp nhận các lời nhắc sửa chữa mặc định.
    - `openclaw doctor --repair` áp dụng các sửa chữa được đề xuất mà không nhắc.
    - `openclaw doctor --repair --force` ghi đè cấu hình trình giám sát tùy chỉnh.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` giữ doctor ở chế độ chỉ đọc cho vòng đời dịch vụ gateway. Nó vẫn báo cáo sức khỏe dịch vụ và chạy các sửa chữa không thuộc dịch vụ, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap dịch vụ, ghi lại cấu hình trình giám sát và dọn dẹp dịch vụ cũ vì một trình giám sát bên ngoài sở hữu vòng đời đó.
    - Trên Linux, doctor không ghi lại metadata lệnh/entrypoint khi đơn vị systemd gateway khớp đang hoạt động. Nó cũng bỏ qua các đơn vị phụ không hoạt động, không phải legacy nhưng giống gateway trong quá trình quét dịch vụ trùng lặp để các tệp dịch vụ đi kèm không tạo nhiễu dọn dẹp.
    - Nếu xác thực bằng token yêu cầu token và `gateway.auth.token` được quản lý bằng SecretRef, cài đặt/sửa chữa dịch vụ của doctor xác thực SecretRef nhưng không lưu các giá trị token plaintext đã phân giải vào metadata môi trường dịch vụ của trình giám sát.
    - Doctor phát hiện các giá trị môi trường dịch vụ được quản lý dựa trên `.env`/SecretRef mà các bản cài đặt LaunchAgent, systemd hoặc Windows Scheduled Task cũ đã nhúng inline và ghi lại metadata dịch vụ để các giá trị đó tải từ nguồn runtime thay vì định nghĩa trình giám sát.
    - Doctor phát hiện khi lệnh dịch vụ vẫn ghim `--port` cũ sau khi `gateway.port` thay đổi và ghi lại metadata dịch vụ sang cổng hiện tại.
    - Nếu xác thực bằng token yêu cầu token và SecretRef token đã cấu hình chưa được phân giải, doctor chặn đường dẫn cài đặt/sửa chữa kèm hướng dẫn có thể hành động.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, doctor chặn cài đặt/sửa chữa cho đến khi mode được đặt tường minh.
    - Với các đơn vị Linux user-systemd, kiểm tra drift token của doctor hiện bao gồm cả nguồn `Environment=` và `EnvironmentFile=` khi so sánh metadata xác thực dịch vụ.
    - Các sửa chữa dịch vụ của doctor từ chối ghi lại, dừng hoặc khởi động lại dịch vụ gateway từ binary OpenClaw cũ hơn khi cấu hình được ghi lần cuối bởi phiên bản mới hơn. Xem [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Bạn luôn có thể buộc ghi lại toàn bộ qua `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Chẩn đoán runtime + cổng Gateway">
    Doctor kiểm tra runtime dịch vụ (PID, trạng thái thoát gần nhất) và cảnh báo khi dịch vụ đã được cài đặt nhưng thực tế không chạy. Nó cũng kiểm tra xung đột cổng trên cổng gateway (mặc định `18789`) và báo cáo các nguyên nhân có khả năng xảy ra (gateway đã chạy, đường hầm SSH).
  </Accordion>
  <Accordion title="17. Thực hành tốt nhất cho runtime Gateway">
    Doctor cảnh báo khi dịch vụ gateway chạy trên Bun hoặc đường dẫn Node do trình quản lý phiên bản quản lý (`nvm`, `fnm`, `volta`, `asdf`, v.v.). Các kênh WhatsApp + Telegram yêu cầu Node, và đường dẫn trình quản lý phiên bản có thể hỏng sau khi nâng cấp vì dịch vụ không tải khởi tạo shell của bạn. Doctor đề xuất di chuyển sang bản cài đặt Node hệ thống khi có sẵn (Homebrew/apt/choco).

    Các macOS LaunchAgent mới được cài đặt hoặc sửa chữa dùng PATH hệ thống chuẩn (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) thay vì sao chép PATH của shell tương tác, để Volta, asdf, fnm, pnpm và các thư mục trình quản lý phiên bản khác không thay đổi cách các tiến trình con Node được phân giải. Dịch vụ Linux vẫn giữ các gốc môi trường tường minh (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) và các thư mục user-bin ổn định, nhưng các thư mục dự phòng của trình quản lý phiên bản được suy đoán chỉ được ghi vào PATH dịch vụ khi các thư mục đó tồn tại trên đĩa.

  </Accordion>
  <Accordion title="18. Ghi cấu hình + metadata wizard">
    Doctor lưu mọi thay đổi cấu hình và đóng dấu metadata wizard để ghi lại lần chạy doctor.
  </Accordion>
  <Accordion title="19. Mẹo workspace (sao lưu + hệ thống bộ nhớ)">
    Doctor đề xuất hệ thống bộ nhớ workspace khi thiếu và in mẹo sao lưu nếu workspace chưa nằm trong git.

    Xem [/concepts/agent-workspace](/vi/concepts/agent-workspace) để có hướng dẫn đầy đủ về cấu trúc workspace và sao lưu git (khuyến nghị GitHub hoặc GitLab riêng tư).

  </Accordion>
</AccordionGroup>

## Liên quan

- [Runbook Gateway](/vi/gateway)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
