---
read_when:
    - Thêm hoặc sửa đổi các bản di trú của doctor
    - Đưa vào các thay đổi cấu hình phá vỡ tương thích
sidebarTitle: Doctor
summary: 'Lệnh Doctor: kiểm tra tình trạng, di trú cấu hình và các bước sửa chữa'
title: Trình chẩn đoán
x-i18n:
    generated_at: "2026-05-12T08:45:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53d67fcc5ab4a356747bc4f4af0c5d42cbdae0c89a41616aaded7589e408a017
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` là công cụ sửa chữa + di chuyển cho OpenClaw. Công cụ này sửa cấu hình/trạng thái cũ, kiểm tra tình trạng, và cung cấp các bước sửa chữa có thể thực hiện.

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

    Chạy không có lời nhắc và chỉ áp dụng các di chuyển an toàn (chuẩn hóa cấu hình + di chuyển trạng thái trên đĩa). Bỏ qua các hành động khởi động lại/dịch vụ/sandbox cần xác nhận của người dùng. Các di chuyển trạng thái legacy tự động chạy khi được phát hiện.

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

## Công cụ làm gì (tóm tắt)

<AccordionGroup>
  <Accordion title="Tình trạng, UI, và cập nhật">
    - Cập nhật pre-flight tùy chọn cho các bản cài đặt git (chỉ tương tác).
    - Kiểm tra độ mới của giao thức UI (xây dựng lại Control UI khi schema giao thức mới hơn).
    - Kiểm tra tình trạng + lời nhắc khởi động lại.
    - Tóm tắt trạng thái Skills (đủ điều kiện/thiếu/bị chặn) và trạng thái Plugin.

  </Accordion>
  <Accordion title="Cấu hình và di chuyển">
    - Chuẩn hóa cấu hình cho các giá trị legacy.
    - Di chuyển cấu hình Talk từ các trường phẳng legacy `talk.*` sang `talk.provider` + `talk.providers.<provider>`.
    - Kiểm tra di chuyển trình duyệt cho cấu hình legacy Chrome extension và mức sẵn sàng Chrome MCP.
    - Cảnh báo ghi đè provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Cảnh báo che khuất OAuth Codex (`models.providers.openai-codex`).
    - Kiểm tra điều kiện tiên quyết OAuth TLS cho hồ sơ OpenAI Codex OAuth.
    - Cảnh báo danh sách cho phép Plugin/công cụ khi `plugins.allow` hạn chế nhưng chính sách công cụ vẫn yêu cầu wildcard hoặc công cụ thuộc sở hữu Plugin.
    - Di chuyển trạng thái legacy trên đĩa (phiên/thư mục agent/xác thực WhatsApp).
    - Di chuyển khóa hợp đồng manifest Plugin legacy (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Di chuyển kho cron legacy (`jobId`, `schedule.cron`, các trường delivery/payload cấp cao nhất, payload `provider`, tác vụ webhook dự phòng đơn giản `notify: true`).
    - Dọn dẹp runtime-policy legacy toàn agent; chính sách runtime provider/model là bộ chọn tuyến đang hoạt động.
    - Dọn dẹp cấu hình Plugin cũ khi Plugin được bật; khi `plugins.enabled=false`, tham chiếu Plugin cũ được xem là cấu hình cô lập không hoạt động và được giữ nguyên.

  </Accordion>
  <Accordion title="Trạng thái và tính toàn vẹn">
    - Kiểm tra tệp khóa phiên và dọn dẹp khóa cũ.
    - Sửa transcript phiên cho các nhánh prompt-rewrite bị trùng lặp do các bản build 2026.4.24 bị ảnh hưởng tạo ra.
    - Phát hiện tombstone khôi phục-khởi động lại subagent bị kẹt, có hỗ trợ `--fix` để xóa các cờ khôi phục bị hủy cũ để khi khởi động không tiếp tục xem child là restart-aborted.
    - Kiểm tra tính toàn vẹn trạng thái và quyền (phiên, transcript, thư mục trạng thái).
    - Kiểm tra quyền tệp cấu hình (chmod 600) khi chạy cục bộ.
    - Tình trạng xác thực model: kiểm tra hết hạn OAuth, có thể làm mới token sắp hết hạn, và báo cáo trạng thái cooldown/disabled của auth-profile.
    - Phát hiện thư mục workspace bổ sung (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, dịch vụ, và supervisor">
    - Sửa image sandbox khi sandboxing được bật.
    - Di chuyển dịch vụ legacy và phát hiện gateway bổ sung.
    - Di chuyển trạng thái legacy kênh Matrix (ở chế độ `--fix` / `--repair`).
    - Kiểm tra runtime Gateway (dịch vụ đã cài nhưng không chạy; nhãn launchd được lưu cache).
    - Cảnh báo trạng thái kênh (được thăm dò từ gateway đang chạy).
    - Kiểm tra quyền theo kênh nằm dưới `openclaw channels capabilities`; ví dụ, quyền kênh thoại Discord được audit bằng `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Kiểm tra khả năng phản hồi của WhatsApp đối với tình trạng vòng lặp sự kiện Gateway suy giảm khi các client TUI cục bộ vẫn đang chạy; `--fix` chỉ dừng các client TUI cục bộ đã xác minh.
    - Sửa tuyến Codex cho các model ref legacy `openai-codex/*` trong model chính, fallback, ghi đè heartbeat/subagent/compaction, hook, ghi đè model theo kênh, và ghim tuyến phiên; `--fix` viết lại chúng thành `openai/*`, xóa các ghim runtime phiên/toàn agent cũ, và để lại các ref agent OpenAI chuẩn trên harness Codex mặc định.
    - Audit cấu hình supervisor (launchd/systemd/schtasks) với sửa chữa tùy chọn.
    - Dọn dẹp môi trường proxy nhúng cho các dịch vụ gateway đã ghi lại giá trị shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` trong khi cài đặt hoặc cập nhật.
    - Kiểm tra thực hành tốt nhất cho runtime Gateway (Node so với Bun, đường dẫn version-manager).
    - Chẩn đoán xung đột cổng Gateway (mặc định `18789`).

  </Accordion>
  <Accordion title="Xác thực, bảo mật, và ghép đôi">
    - Cảnh báo bảo mật cho chính sách DM mở.
    - Kiểm tra xác thực Gateway cho chế độ token cục bộ (đề xuất tạo token khi không có nguồn token; không ghi đè cấu hình token SecretRef).
    - Phát hiện sự cố ghép đôi thiết bị (yêu cầu ghép đôi lần đầu đang chờ, nâng cấp vai trò/phạm vi đang chờ, trôi lệch cache device-token cục bộ cũ, và trôi lệch xác thực bản ghi đã ghép đôi).

  </Accordion>
  <Accordion title="Workspace và shell">
    - Kiểm tra systemd linger trên Linux.
    - Kiểm tra kích thước tệp bootstrap workspace (cảnh báo bị cắt/gần giới hạn cho tệp ngữ cảnh).
    - Kiểm tra mức sẵn sàng Skills cho agent mặc định; báo cáo các skills được cho phép nhưng thiếu binary, env, cấu hình, hoặc yêu cầu OS, và `--fix` có thể tắt các skills không khả dụng trong `skills.entries`.
    - Kiểm tra trạng thái shell completion và tự động cài đặt/nâng cấp.
    - Kiểm tra mức sẵn sàng provider embedding tìm kiếm bộ nhớ (model cục bộ, khóa API từ xa, hoặc binary QMD).
    - Kiểm tra bản cài đặt từ mã nguồn (pnpm workspace không khớp, thiếu UI assets, thiếu binary tsx).
    - Ghi cấu hình đã cập nhật + metadata wizard.

  </Accordion>
</AccordionGroup>

## Backfill và reset UI Dreams

Cảnh Dreams trong Control UI bao gồm các hành động **Backfill**, **Reset**, và **Clear Grounded** cho quy trình grounded dreaming. Các hành động này dùng phương thức RPC kiểu gateway doctor, nhưng chúng **không** phải là một phần của sửa chữa/di chuyển CLI `openclaw doctor`.

Những việc chúng làm:

- **Backfill** quét các tệp lịch sử `memory/YYYY-MM-DD.md` trong workspace đang hoạt động, chạy lượt nhật ký grounded REM, và ghi các mục backfill có thể đảo ngược vào `DREAMS.md`.
- **Reset** chỉ xóa các mục nhật ký backfill được đánh dấu đó khỏi `DREAMS.md`.
- **Clear Grounded** chỉ xóa các mục ngắn hạn chỉ-grounded đã staged, vốn đến từ phát lại lịch sử và chưa tích lũy recall trực tiếp hoặc hỗ trợ hằng ngày.

Những việc chúng **không** tự làm:

- chúng không chỉnh sửa `MEMORY.md`
- chúng không chạy đầy đủ các di chuyển doctor
- chúng không tự động stage các ứng viên grounded vào kho promotion ngắn hạn trực tiếp trừ khi bạn chạy rõ ràng đường dẫn CLI đã staged trước

Nếu bạn muốn phát lại lịch sử grounded ảnh hưởng đến luồng promotion sâu thông thường, hãy dùng luồng CLI thay thế:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Lệnh đó stage các ứng viên bền vững grounded vào kho dreaming ngắn hạn trong khi giữ `DREAMS.md` làm bề mặt rà soát.

## Hành vi chi tiết và lý do

<AccordionGroup>
  <Accordion title="0. Cập nhật tùy chọn (bản cài đặt git)">
    Nếu đây là một git checkout và doctor đang chạy tương tác, công cụ sẽ đề nghị cập nhật (fetch/rebase/build) trước khi chạy doctor.
  </Accordion>
  <Accordion title="1. Chuẩn hóa cấu hình">
    Nếu cấu hình chứa các dạng giá trị legacy (ví dụ `messages.ackReaction` không có ghi đè theo kênh), doctor chuẩn hóa chúng vào schema hiện tại.

    Điều đó bao gồm các trường phẳng Talk legacy. Cấu hình speech Talk công khai hiện tại là `talk.provider` + `talk.providers.<provider>`, và cấu hình voice thời gian thực là `talk.realtime.*`. Doctor viết lại các dạng `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` cũ vào bản đồ provider, và viết lại các bộ chọn realtime cấp cao nhất legacy (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) vào `talk.realtime`.

    Doctor cũng cảnh báo khi `plugins.allow` không rỗng và chính sách công cụ dùng
    các mục công cụ wildcard hoặc thuộc sở hữu Plugin. `tools.allow: ["*"]` chỉ khớp các công cụ
    từ Plugin thực sự được tải; nó không bỏ qua danh sách cho phép Plugin độc quyền.
    Doctor ghi `plugins.bundledDiscovery: "compat"` cho các cấu hình danh sách cho phép
    legacy đã di chuyển để giữ nguyên hành vi provider bundled hiện có, và
    sau đó trỏ đến cài đặt `"allowlist"` chặt chẽ hơn.

  </Accordion>
  <Accordion title="2. Di chuyển khóa cấu hình legacy">
    Khi cấu hình chứa khóa đã ngừng dùng, các lệnh khác từ chối chạy và yêu cầu bạn chạy `openclaw doctor`.

    Doctor sẽ:

    - Giải thích các khóa legacy nào đã được tìm thấy.
    - Hiển thị di chuyển đã áp dụng.
    - Viết lại `~/.openclaw/openclaw.json` với schema đã cập nhật.

    Startup Gateway từ chối các định dạng cấu hình legacy và yêu cầu bạn chạy `openclaw doctor --fix`; nó không viết lại `openclaw.json` khi startup. Di chuyển kho tác vụ Cron cũng được xử lý bởi `openclaw doctor --fix`.

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
    - Với các kênh có `accounts` được đặt tên nhưng vẫn còn các giá trị kênh cấp cao nhất dành cho một tài khoản, hãy chuyển các giá trị có phạm vi tài khoản đó vào tài khoản đã được nâng cấp được chọn cho kênh đó (`accounts.default` cho hầu hết kênh; Matrix có thể giữ nguyên mục tiêu được đặt tên/mặc định khớp hiện có)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - xóa `agents.defaults.llm`; dùng `models.providers.<id>.timeoutSeconds` cho thời gian chờ chậm của nhà cung cấp/mô hình
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - xóa `browser.relayBindHost` (thiết lập relay tiện ích mở rộng cũ)
    - `models.providers.*.api: "openai"` cũ → `"openai-completions"` (quá trình khởi động Gateway cũng bỏ qua các nhà cung cấp có `api` được đặt thành giá trị enum tương lai hoặc không xác định thay vì thất bại đóng)
    - xóa `plugins.entries.codex.config.codexDynamicToolsProfile`; máy chủ ứng dụng Codex luôn giữ các công cụ không gian làm việc gốc của Codex ở dạng gốc

    Cảnh báo của Doctor cũng bao gồm hướng dẫn mặc định tài khoản cho các kênh nhiều tài khoản:

    - Nếu có hai hoặc nhiều mục `channels.<channel>.accounts` được cấu hình mà không có `channels.<channel>.defaultAccount` hoặc `accounts.default`, doctor cảnh báo rằng định tuyến dự phòng có thể chọn một tài khoản không mong muốn.
    - Nếu `channels.<channel>.defaultAccount` được đặt thành ID tài khoản không xác định, doctor cảnh báo và liệt kê các ID tài khoản đã cấu hình.

  </Accordion>
  <Accordion title="2b. Ghi đè nhà cung cấp OpenCode">
    Nếu bạn đã thêm thủ công `models.providers.opencode`, `opencode-zen`, hoặc `opencode-go`, mục đó sẽ ghi đè danh mục OpenCode tích hợp từ `@earendil-works/pi-ai`. Điều đó có thể ép các mô hình dùng sai API hoặc đưa chi phí về 0. Doctor cảnh báo để bạn có thể xóa ghi đè và khôi phục định tuyến API + chi phí theo từng mô hình.
  </Accordion>
  <Accordion title="2c. Di chuyển trình duyệt và khả năng sẵn sàng Chrome MCP">
    Nếu cấu hình trình duyệt của bạn vẫn trỏ đến đường dẫn tiện ích mở rộng Chrome đã bị xóa, doctor chuẩn hóa nó sang mô hình gắn Chrome MCP cục bộ trên máy chủ hiện tại:

    - `browser.profiles.*.driver: "extension"` trở thành `"existing-session"`
    - `browser.relayBindHost` bị xóa

    Doctor cũng kiểm tra đường dẫn Chrome MCP cục bộ trên máy chủ khi bạn dùng `defaultProfile: "user"` hoặc một hồ sơ `existing-session` đã cấu hình:

    - kiểm tra Google Chrome có được cài đặt trên cùng máy chủ cho các hồ sơ tự động kết nối mặc định hay không
    - kiểm tra phiên bản Chrome đã phát hiện và cảnh báo khi phiên bản thấp hơn Chrome 144
    - nhắc bạn bật gỡ lỗi từ xa trong trang kiểm tra của trình duyệt (ví dụ `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, hoặc `edge://inspect/#remote-debugging`)

    Doctor không thể bật thiết lập phía Chrome thay cho bạn. Chrome MCP cục bộ trên máy chủ vẫn yêu cầu:

    - trình duyệt dựa trên Chromium phiên bản 144+ trên máy chủ gateway/node
    - trình duyệt đang chạy cục bộ
    - gỡ lỗi từ xa được bật trong trình duyệt đó
    - phê duyệt lời nhắc đồng ý gắn lần đầu trong trình duyệt

    Khả năng sẵn sàng ở đây chỉ nói về các điều kiện tiên quyết để gắn cục bộ. Existing-session giữ nguyên các giới hạn tuyến Chrome MCP hiện tại; các tuyến nâng cao như `responsebody`, xuất PDF, chặn tải xuống và thao tác hàng loạt vẫn yêu cầu trình duyệt được quản lý hoặc hồ sơ CDP thô.

    Kiểm tra này **không** áp dụng cho Docker, sandbox, remote-browser hoặc các luồng headless khác. Các luồng đó tiếp tục dùng CDP thô.

  </Accordion>
  <Accordion title="2d. Điều kiện tiên quyết OAuth TLS">
    Khi một hồ sơ OpenAI Codex OAuth được cấu hình, doctor thăm dò điểm cuối ủy quyền OpenAI để xác minh rằng ngăn xếp TLS Node/OpenSSL cục bộ có thể xác thực chuỗi chứng chỉ. Nếu thăm dò thất bại với lỗi chứng chỉ (ví dụ `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, chứng chỉ hết hạn, hoặc chứng chỉ tự ký), doctor in hướng dẫn sửa lỗi theo từng nền tảng. Trên macOS với Node từ Homebrew, cách sửa thường là `brew postinstall ca-certificates`. Với `--deep`, thăm dò chạy ngay cả khi gateway khỏe mạnh.
  </Accordion>
  <Accordion title="2e. Ghi đè nhà cung cấp Codex OAuth">
    Nếu trước đây bạn đã thêm các thiết lập truyền tải OpenAI cũ dưới `models.providers.openai-codex`, chúng có thể che khuất đường dẫn nhà cung cấp Codex OAuth tích hợp mà các bản phát hành mới hơn tự động sử dụng. Doctor cảnh báo khi thấy các thiết lập truyền tải cũ đó cùng với Codex OAuth để bạn có thể xóa hoặc viết lại ghi đè truyền tải lỗi thời và lấy lại hành vi định tuyến/dự phòng tích hợp. Proxy tùy chỉnh và ghi đè chỉ header vẫn được hỗ trợ và không kích hoạt cảnh báo này.
  </Accordion>
  <Accordion title="2f. Sửa tuyến Codex">
    Doctor kiểm tra các tham chiếu mô hình `openai-codex/*` cũ. Định tuyến harness Codex gốc dùng các tham chiếu mô hình chuẩn `openai/*`; lượt tác vụ tác nhân OpenAI đi qua harness máy chủ ứng dụng Codex thay vì đường dẫn OpenClaw PI OpenAI.

    Ở chế độ `--fix` / `--repair`, doctor viết lại các tham chiếu tác nhân mặc định và từng tác nhân bị ảnh hưởng, bao gồm mô hình chính, dự phòng, ghi đè heartbeat/subagent/compaction, hook, ghi đè mô hình kênh và trạng thái tuyến phiên đã lưu lỗi thời:

    - `openai-codex/gpt-*` trở thành `openai/gpt-*`.
    - Ý định Codex chuyển sang các mục `agentRuntime.id: "codex"` theo phạm vi nhà cung cấp/mô hình cho các tham chiếu mô hình tác nhân đã sửa, để hồ sơ xác thực `openai-codex:...` vẫn có thể được chọn sau khi tham chiếu mô hình trở thành `openai/*`.
    - Cấu hình runtime toàn tác nhân lỗi thời và các ghim runtime phiên đã lưu bị xóa vì lựa chọn runtime có phạm vi theo nhà cung cấp/mô hình.
    - Chính sách runtime theo nhà cung cấp/mô hình hiện có được giữ nguyên, trừ khi tham chiếu mô hình cũ đã sửa cần định tuyến Codex để giữ đường dẫn xác thực cũ.
    - Danh sách dự phòng mô hình hiện có được giữ nguyên với các mục cũ được viết lại; các thiết lập theo mô hình đã sao chép chuyển từ khóa cũ sang khóa chuẩn `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, thông báo dự phòng và ghim hồ sơ xác thực của phiên đã lưu được sửa trên tất cả kho phiên tác nhân được phát hiện.
    - `/codex ...` nghĩa là "điều khiển hoặc liên kết một cuộc hội thoại Codex gốc từ chat."
    - `/acp ...` hoặc `runtime: "acp"` nghĩa là "dùng bộ chuyển đổi ACP/acpx bên ngoài."

  </Accordion>
  <Accordion title="2g. Dọn dẹp tuyến phiên">
    Doctor cũng quét các kho phiên tác nhân được phát hiện để tìm trạng thái tuyến tự tạo lỗi thời sau khi bạn chuyển các mô hình đã cấu hình hoặc runtime ra khỏi tuyến do Plugin sở hữu như Codex.

    `openclaw doctor --fix` có thể xóa trạng thái lỗi thời tự tạo như ghim mô hình `modelOverrideSource: "auto"`, siêu dữ liệu mô hình runtime, ID harness đã ghim, liên kết phiên CLI và ghi đè hồ sơ xác thực tự động khi tuyến sở hữu chúng không còn được cấu hình. Các lựa chọn mô hình phiên rõ ràng của người dùng hoặc cũ được báo cáo để xem xét thủ công và giữ nguyên; hãy chuyển chúng bằng `/model ...`, `/new`, hoặc đặt lại phiên khi tuyến đó không còn được mong muốn.

  </Accordion>
  <Accordion title="3. Di chuyển trạng thái cũ (bố cục đĩa)">
    Doctor có thể di chuyển các bố cục cũ trên đĩa vào cấu trúc hiện tại:

    - Kho phiên + bản ghi:
      - từ `~/.openclaw/sessions/` sang `~/.openclaw/agents/<agentId>/sessions/`
    - Thư mục tác nhân:
      - từ `~/.openclaw/agent/` sang `~/.openclaw/agents/<agentId>/agent/`
    - Trạng thái xác thực WhatsApp (Baileys):
      - từ `~/.openclaw/credentials/*.json` cũ (ngoại trừ `oauth.json`)
      - sang `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID tài khoản mặc định: `default`)

    Các di chuyển này là nỗ lực tối đa và có tính lũy đẳng; doctor sẽ phát cảnh báo khi để lại bất kỳ thư mục cũ nào làm bản sao lưu. Gateway/CLI cũng tự động di chuyển kho phiên cũ + thư mục tác nhân khi khởi động để lịch sử/xác thực/mô hình nằm trong đường dẫn theo từng tác nhân mà không cần chạy doctor thủ công. Chuẩn hóa nhà cung cấp/bản đồ nhà cung cấp Talk hiện so sánh bằng bình đẳng cấu trúc, vì vậy các khác biệt chỉ do thứ tự khóa không còn kích hoạt lặp lại các thay đổi `doctor --fix` không có tác dụng.

  </Accordion>
  <Accordion title="3a. Di chuyển manifest Plugin cũ">
    Doctor quét tất cả manifest Plugin đã cài đặt để tìm các khóa năng lực cấp cao nhất đã lỗi thời (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Khi tìm thấy, nó đề nghị chuyển chúng vào đối tượng `contracts` và viết lại tệp manifest tại chỗ. Di chuyển này có tính lũy đẳng; nếu khóa `contracts` đã có cùng giá trị, khóa cũ sẽ bị xóa mà không nhân đôi dữ liệu.
  </Accordion>
  <Accordion title="3b. Di chuyển kho cron cũ">
    Doctor cũng kiểm tra kho công việc cron (`~/.openclaw/cron/jobs.json` theo mặc định, hoặc `cron.store` khi được ghi đè) để tìm các dạng công việc cũ mà bộ lập lịch vẫn chấp nhận để tương thích.

    Các dọn dẹp cron hiện tại bao gồm:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - các trường payload cấp cao nhất (`message`, `model`, `thinking`, ...) → `payload`
    - các trường delivery cấp cao nhất (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - bí danh delivery `provider` của payload → `delivery.channel` tường minh
    - các tác vụ webhook dự phòng `notify: true` cũ đơn giản → `delivery.mode="webhook"` tường minh với `delivery.to=cron.webhook`

    Trình kiểm tra chỉ tự động di chuyển các tác vụ `notify: true` khi có thể làm vậy mà không thay đổi hành vi. Nếu một tác vụ kết hợp cơ chế notify dự phòng cũ với một chế độ delivery không phải webhook hiện có, trình kiểm tra sẽ cảnh báo và để tác vụ đó lại để rà soát thủ công.

    Trên Linux, trình kiểm tra cũng cảnh báo khi crontab của người dùng vẫn gọi `~/.openclaw/bin/ensure-whatsapp.sh` cũ. Tập lệnh cục bộ trên máy chủ đó không được OpenClaw hiện tại duy trì và có thể ghi các thông báo `Gateway inactive` sai vào `~/.openclaw/logs/whatsapp-health.log` khi cron không thể truy cập bus người dùng systemd. Gỡ mục crontab cũ bằng `crontab -e`; dùng `openclaw channels status --probe`, `openclaw doctor` và `openclaw gateway status` cho các bước kiểm tra sức khỏe hiện tại.

  </Accordion>
  <Accordion title="3c. Session lock cleanup">
    Trình kiểm tra quét mọi thư mục phiên của agent để tìm các tệp khóa ghi cũ — các tệp còn sót lại khi một phiên thoát bất thường. Với mỗi tệp khóa tìm thấy, trình kiểm tra báo cáo: đường dẫn, PID, PID còn sống hay không, tuổi của khóa và khóa có được xem là cũ hay không (PID đã chết, cũ hơn 30 phút, hoặc PID còn sống nhưng có thể chứng minh là thuộc về một tiến trình không phải OpenClaw). Ở chế độ `--fix` / `--repair`, trình kiểm tra tự động xóa các tệp khóa cũ; nếu không, trình kiểm tra in một ghi chú và hướng dẫn bạn chạy lại với `--fix`.
  </Accordion>
  <Accordion title="3d. Session transcript branch repair">
    Trình kiểm tra quét các tệp JSONL phiên của agent để tìm dạng nhánh bị nhân đôi do lỗi viết lại transcript lời nhắc ngày 2026.4.24 tạo ra: một lượt người dùng bị bỏ lại với ngữ cảnh runtime nội bộ của OpenClaw cùng một nhánh anh em đang hoạt động chứa cùng lời nhắc người dùng hiển thị. Ở chế độ `--fix` / `--repair`, trình kiểm tra sao lưu từng tệp bị ảnh hưởng bên cạnh tệp gốc và viết lại transcript về nhánh đang hoạt động để lịch sử gateway và trình đọc bộ nhớ không còn thấy các lượt trùng lặp.
  </Accordion>
  <Accordion title="4. State integrity checks (session persistence, routing, and safety)">
    Thư mục trạng thái là phần lõi vận hành. Nếu nó biến mất, bạn sẽ mất phiên, thông tin xác thực, nhật ký và cấu hình (trừ khi bạn có bản sao lưu ở nơi khác).

    Trình kiểm tra kiểm tra:

    - **Thiếu thư mục trạng thái**: cảnh báo về mất trạng thái nghiêm trọng, nhắc tạo lại thư mục và nhắc bạn rằng trình kiểm tra không thể khôi phục dữ liệu bị thiếu.
    - **Quyền của thư mục trạng thái**: xác minh khả năng ghi; đề nghị sửa quyền (và phát gợi ý `chown` khi phát hiện chủ sở hữu/nhóm không khớp).
    - **Thư mục trạng thái được đồng bộ đám mây trên macOS**: cảnh báo khi trạng thái phân giải dưới iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) hoặc `~/Library/CloudStorage/...` vì các đường dẫn được hậu thuẫn bởi đồng bộ có thể gây I/O chậm hơn và các cuộc đua khóa/đồng bộ.
    - **Thư mục trạng thái trên SD hoặc eMMC của Linux**: cảnh báo khi trạng thái phân giải tới nguồn mount `mmcblk*`, vì I/O ngẫu nhiên được hậu thuẫn bởi SD hoặc eMMC có thể chậm hơn và hao mòn nhanh hơn khi ghi phiên và thông tin xác thực.
    - **Thiếu thư mục phiên**: `sessions/` và thư mục kho phiên là bắt buộc để lưu lịch sử và tránh sự cố `ENOENT`.
    - **Transcript không khớp**: cảnh báo khi các mục phiên gần đây thiếu tệp transcript.
    - **Phiên chính "JSONL 1 dòng"**: đánh dấu khi transcript chính chỉ có một dòng (lịch sử không tích lũy).
    - **Nhiều thư mục trạng thái**: cảnh báo khi nhiều thư mục `~/.openclaw` tồn tại trên các thư mục home hoặc khi `OPENCLAW_STATE_DIR` trỏ tới nơi khác (lịch sử có thể bị tách giữa các bản cài đặt).
    - **Nhắc nhở chế độ từ xa**: nếu `gateway.mode=remote`, trình kiểm tra nhắc bạn chạy nó trên máy chủ từ xa (trạng thái nằm ở đó).
    - **Quyền tệp cấu hình**: cảnh báo nếu `~/.openclaw/openclaw.json` có thể đọc bởi nhóm/toàn hệ thống và đề nghị siết lại thành `600`.

  </Accordion>
  <Accordion title="5. Model auth health (OAuth expiry)">
    Trình kiểm tra kiểm tra các hồ sơ OAuth trong kho xác thực, cảnh báo khi token sắp hết hạn/đã hết hạn và có thể làm mới chúng khi an toàn. Nếu hồ sơ OAuth/token của Anthropic đã cũ, trình kiểm tra đề xuất khóa API Anthropic hoặc đường dẫn setup-token của Anthropic. Lời nhắc làm mới chỉ xuất hiện khi chạy tương tác (TTY); `--non-interactive` bỏ qua các lần thử làm mới.

    Khi một lần làm mới OAuth thất bại vĩnh viễn (ví dụ `refresh_token_reused`, `invalid_grant`, hoặc nhà cung cấp yêu cầu bạn đăng nhập lại), trình kiểm tra báo rằng cần xác thực lại và in chính xác lệnh `openclaw models auth login --provider ...` cần chạy.

    Trình kiểm tra cũng báo cáo các hồ sơ xác thực tạm thời không dùng được do:

    - thời gian chờ ngắn (giới hạn tốc độ/hết thời gian chờ/lỗi xác thực)
    - vô hiệu hóa dài hơn (lỗi thanh toán/tín dụng)

  </Accordion>
  <Accordion title="6. Hooks model validation">
    Nếu `hooks.gmail.model` được đặt, trình kiểm tra xác thực tham chiếu model với catalog và allowlist rồi cảnh báo khi tham chiếu đó không phân giải được hoặc không được phép.
  </Accordion>
  <Accordion title="7. Sandbox image repair">
    Khi sandboxing được bật, trình kiểm tra kiểm tra Docker image và đề nghị build hoặc chuyển sang tên cũ nếu image hiện tại bị thiếu.
  </Accordion>
  <Accordion title="7b. Plugin install cleanup">
    Trình kiểm tra xóa trạng thái dàn dựng dependency Plugin cũ do OpenClaw tạo ra ở chế độ `openclaw doctor --fix` / `openclaw doctor --repair`. Việc này bao gồm các gốc dependency được tạo cũ, thư mục giai đoạn cài đặt cũ, rác cục bộ theo package từ mã sửa dependency bundled-plugin trước đây, và các bản sao npm được quản lý của Plugin `@openclaw/*` bundled bị mồ côi hoặc khôi phục có thể che khuất manifest bundled hiện tại. Trình kiểm tra cũng liên kết lại package `openclaw` của máy chủ vào các Plugin npm được quản lý có khai báo `peerDependencies.openclaw`, để các import runtime cục bộ theo package như `openclaw/plugin-sdk/*` tiếp tục phân giải sau cập nhật hoặc sửa npm.

    Trình kiểm tra cũng có thể cài đặt lại các Plugin có thể tải xuống bị thiếu khi cấu hình tham chiếu đến chúng nhưng sổ đăng ký Plugin cục bộ không tìm thấy. Ví dụ gồm `plugins.entries` thực tế, thiết lập channel/provider/search đã cấu hình và runtime agent đã cấu hình. Trong quá trình cập nhật package, trình kiểm tra tránh chạy sửa Plugin bằng trình quản lý package trong khi package lõi đang được thay thế; chạy lại `openclaw doctor --fix` sau khi cập nhật nếu một Plugin đã cấu hình vẫn cần khôi phục. Khởi động Gateway và tải lại cấu hình không chạy trình quản lý package; cài đặt Plugin vẫn là công việc doctor/install/update tường minh.

  </Accordion>
  <Accordion title="8. Gateway service migrations and cleanup hints">
    Trình kiểm tra phát hiện các dịch vụ gateway cũ (launchd/systemd/schtasks) và đề nghị xóa chúng rồi cài đặt dịch vụ OpenClaw bằng cổng gateway hiện tại. Trình kiểm tra cũng có thể quét các dịch vụ giống gateway bổ sung và in gợi ý dọn dẹp. Các dịch vụ gateway OpenClaw được đặt tên theo hồ sơ được xem là hạng nhất và không bị đánh dấu là "bổ sung".

    Trên Linux, nếu thiếu dịch vụ gateway cấp người dùng nhưng tồn tại một dịch vụ gateway OpenClaw cấp hệ thống, trình kiểm tra không tự động cài đặt dịch vụ cấp người dùng thứ hai. Kiểm tra bằng `openclaw gateway status --deep` hoặc `openclaw doctor --deep`, sau đó xóa bản trùng lặp hoặc đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một trình giám sát hệ thống sở hữu vòng đời gateway.

  </Accordion>
  <Accordion title="8b. Startup Matrix migration">
    Khi tài khoản kênh Matrix có migration trạng thái cũ đang chờ hoặc có thể thực hiện, trình kiểm tra (ở chế độ `--fix` / `--repair`) tạo snapshot trước migration rồi chạy các bước migration nỗ lực tốt nhất: migration trạng thái Matrix cũ và chuẩn bị trạng thái mã hóa cũ. Cả hai bước đều không gây lỗi nghiêm trọng; lỗi được ghi nhật ký và quá trình khởi động tiếp tục. Ở chế độ chỉ đọc (`openclaw doctor` không có `--fix`), bước kiểm tra này bị bỏ qua hoàn toàn.
  </Accordion>
  <Accordion title="8c. Device pairing and auth drift">
    Trình kiểm tra hiện kiểm tra trạng thái ghép nối thiết bị như một phần của lượt kiểm tra sức khỏe thông thường.

    Nội dung báo cáo:

    - các yêu cầu ghép nối lần đầu đang chờ
    - các nâng cấp vai trò đang chờ cho thiết bị đã ghép nối
    - các nâng cấp phạm vi đang chờ cho thiết bị đã ghép nối
    - các sửa chữa không khớp khóa công khai khi id thiết bị vẫn khớp nhưng danh tính thiết bị không còn khớp với bản ghi đã phê duyệt
    - các bản ghi đã ghép nối thiếu token đang hoạt động cho một vai trò đã phê duyệt
    - các token đã ghép nối có phạm vi lệch khỏi baseline ghép nối đã phê duyệt
    - các mục token thiết bị được cache cục bộ cho máy hiện tại có trước một lần xoay token phía gateway hoặc mang metadata phạm vi cũ

    Trình kiểm tra không tự động phê duyệt yêu cầu ghép nối hoặc tự động xoay token thiết bị. Thay vào đó, trình kiểm tra in chính xác các bước tiếp theo:

    - kiểm tra các yêu cầu đang chờ bằng `openclaw devices list`
    - phê duyệt yêu cầu chính xác bằng `openclaw devices approve <requestId>`
    - xoay token mới bằng `openclaw devices rotate --device <deviceId> --role <role>`
    - xóa và phê duyệt lại bản ghi cũ bằng `openclaw devices remove <deviceId>`

    Điều này khép lại lỗ hổng phổ biến "đã ghép nối nhưng vẫn nhận yêu cầu ghép nối": trình kiểm tra hiện phân biệt ghép nối lần đầu với nâng cấp vai trò/phạm vi đang chờ và với lệch token/danh tính thiết bị cũ.

  </Accordion>
  <Accordion title="9. Security warnings">
    Trình kiểm tra phát cảnh báo khi một provider mở DM mà không có allowlist, hoặc khi một policy được cấu hình theo cách nguy hiểm.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Nếu chạy dưới dạng dịch vụ người dùng systemd, trình kiểm tra bảo đảm linger được bật để gateway tiếp tục sống sau khi đăng xuất.
  </Accordion>
  <Accordion title="11. Workspace status (skills, plugins, and legacy dirs)">
    Trình kiểm tra in bản tóm tắt trạng thái workspace cho agent mặc định:

    - **Trạng thái Skills**: đếm Skills đủ điều kiện, thiếu yêu cầu và bị allowlist chặn.
    - **Thư mục workspace cũ**: cảnh báo khi `~/openclaw` hoặc các thư mục workspace cũ khác tồn tại cùng workspace hiện tại.
    - **Trạng thái Plugin**: đếm Plugin đã bật/đã tắt/lỗi; liệt kê ID Plugin cho mọi lỗi; báo cáo khả năng của Plugin bundle.
    - **Cảnh báo tương thích Plugin**: đánh dấu các Plugin có vấn đề tương thích với runtime hiện tại.
    - **Chẩn đoán Plugin**: hiển thị mọi cảnh báo hoặc lỗi tại thời điểm tải do sổ đăng ký Plugin phát ra.

  </Accordion>
  <Accordion title="11b. Bootstrap file size">
    Trình kiểm tra kiểm tra xem các tệp bootstrap workspace (ví dụ `AGENTS.md`, `CLAUDE.md`, hoặc các tệp ngữ cảnh được chèn khác) có gần hoặc vượt ngân sách ký tự đã cấu hình hay không. Trình kiểm tra báo cáo số ký tự thô so với được chèn theo từng tệp, phần trăm cắt bớt, nguyên nhân cắt bớt (`max/file` hoặc `max/total`) và tổng số ký tự được chèn dưới dạng một phần của tổng ngân sách. Khi tệp bị cắt bớt hoặc gần giới hạn, trình kiểm tra in mẹo để tinh chỉnh `agents.defaults.bootstrapMaxChars` và `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Stale channel plugin cleanup">
    Khi `openclaw doctor --fix` xóa một Plugin kênh bị thiếu, nó cũng xóa cấu hình treo theo phạm vi kênh đã tham chiếu đến Plugin đó: các mục `channels.<id>`, mục tiêu Heartbeat đã đặt tên kênh, và các override `agents.*.models["<channel>/*"]`. Việc này ngăn vòng lặp khởi động Gateway khi runtime kênh đã biến mất nhưng cấu hình vẫn yêu cầu gateway bind tới nó.
  </Accordion>
  <Accordion title="11c. Shell completion">
    Trình kiểm tra kiểm tra xem tính năng hoàn thành bằng phím tab đã được cài đặt cho shell hiện tại hay chưa (zsh, bash, fish, hoặc PowerShell):

    - Nếu shell profile dùng mẫu hoàn tất động chậm (`source <(openclaw completion ...)`), doctor nâng cấp nó lên biến thể tệp đã lưu cache nhanh hơn.
    - Nếu hoàn tất được cấu hình trong profile nhưng thiếu tệp cache, doctor tự động tạo lại cache.
    - Nếu hoàn toàn chưa cấu hình hoàn tất, doctor nhắc cài đặt nó (chỉ ở chế độ tương tác; bỏ qua với `--non-interactive`).

    Chạy `openclaw completion --write-state` để tạo lại cache theo cách thủ công.

  </Accordion>
  <Accordion title="12. Kiểm tra xác thực Gateway (mã thông báo cục bộ)">
    Doctor kiểm tra mức sẵn sàng của xác thực mã thông báo Gateway cục bộ.

    - Nếu chế độ mã thông báo cần mã thông báo và không có nguồn mã thông báo nào tồn tại, doctor đề nghị tạo một mã thông báo.
    - Nếu `gateway.auth.token` do SecretRef quản lý nhưng không khả dụng, doctor cảnh báo và không ghi đè nó bằng văn bản thuần.
    - `openclaw doctor --generate-gateway-token` chỉ buộc tạo khi chưa cấu hình SecretRef mã thông báo nào.

  </Accordion>
  <Accordion title="12b. Sửa chữa chỉ đọc có nhận biết SecretRef">
    Một số luồng sửa chữa cần kiểm tra thông tin xác thực đã cấu hình mà không làm suy yếu hành vi fail-fast khi chạy.

    - `openclaw doctor --fix` hiện dùng cùng mô hình tóm tắt SecretRef chỉ đọc như các lệnh nhóm trạng thái cho các sửa chữa cấu hình có mục tiêu.
    - Ví dụ: sửa chữa Telegram `allowFrom` / `groupAllowFrom` `@username` cố gắng dùng thông tin xác thực bot đã cấu hình khi có sẵn.
    - Nếu mã thông báo bot Telegram được cấu hình qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại, doctor báo rằng thông tin xác thực đã được cấu hình nhưng không khả dụng và bỏ qua tự động phân giải thay vì gặp lỗi hoặc báo nhầm rằng mã thông báo bị thiếu.

  </Accordion>
  <Accordion title="13. Kiểm tra sức khỏe Gateway + khởi động lại">
    Doctor chạy kiểm tra sức khỏe và đề nghị khởi động lại Gateway khi nó có vẻ không khỏe.
  </Accordion>
  <Accordion title="13b. Mức sẵn sàng của tìm kiếm bộ nhớ">
    Doctor kiểm tra xem nhà cung cấp embedding tìm kiếm bộ nhớ đã cấu hình có sẵn sàng cho agent mặc định hay không. Hành vi phụ thuộc vào backend và nhà cung cấp đã cấu hình:

    - **Backend QMD**: thăm dò xem binary `qmd` có khả dụng và có thể khởi động hay không. Nếu không, in hướng dẫn sửa lỗi bao gồm gói npm và tùy chọn đường dẫn binary thủ công.
    - **Nhà cung cấp cục bộ tường minh**: kiểm tra tệp mô hình cục bộ hoặc URL mô hình từ xa/có thể tải xuống được nhận diện. Nếu thiếu, đề xuất chuyển sang nhà cung cấp từ xa.
    - **Nhà cung cấp từ xa tường minh** (`openai`, `voyage`, v.v.): xác minh có khóa API trong môi trường hoặc kho xác thực. In gợi ý sửa lỗi có thể hành động nếu thiếu.
    - **Nhà cung cấp tự động**: kiểm tra tính khả dụng của mô hình cục bộ trước, rồi thử từng nhà cung cấp từ xa theo thứ tự tự động chọn.

    Khi có kết quả thăm dò Gateway đã lưu cache (Gateway khỏe mạnh tại thời điểm kiểm tra), doctor đối chiếu kết quả đó với cấu hình CLI nhìn thấy được và ghi chú mọi sai khác. Doctor không khởi động ping embedding mới trên đường dẫn mặc định; hãy dùng lệnh trạng thái bộ nhớ sâu khi bạn muốn kiểm tra nhà cung cấp trực tiếp.

    Dùng `openclaw memory status --deep` để xác minh mức sẵn sàng của embedding khi chạy.

  </Accordion>
  <Accordion title="14. Cảnh báo trạng thái kênh">
    Nếu Gateway khỏe mạnh, doctor chạy thăm dò trạng thái kênh và báo cáo cảnh báo kèm đề xuất sửa lỗi.
  </Accordion>
  <Accordion title="15. Kiểm tra + sửa chữa cấu hình supervisor">
    Doctor kiểm tra cấu hình supervisor đã cài đặt (launchd/systemd/schtasks) để tìm mặc định bị thiếu hoặc lỗi thời (ví dụ: phụ thuộc systemd network-online và độ trễ khởi động lại). Khi phát hiện sai khớp, nó khuyến nghị cập nhật và có thể ghi lại tệp dịch vụ/tác vụ theo mặc định hiện tại.

    Ghi chú:

    - `openclaw doctor` nhắc trước khi ghi lại cấu hình supervisor.
    - `openclaw doctor --yes` chấp nhận các lời nhắc sửa chữa mặc định.
    - `openclaw doctor --repair` áp dụng các sửa lỗi được khuyến nghị mà không nhắc.
    - `openclaw doctor --repair --force` ghi đè cấu hình supervisor tùy chỉnh.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` giữ doctor ở chế độ chỉ đọc cho vòng đời dịch vụ Gateway. Nó vẫn báo cáo sức khỏe dịch vụ và chạy các sửa chữa không phải dịch vụ, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap dịch vụ, ghi lại cấu hình supervisor, và dọn dẹp dịch vụ cũ vì một supervisor bên ngoài sở hữu vòng đời đó.
    - Trên Linux, doctor không ghi lại metadata lệnh/entrypoint khi unit systemd Gateway tương ứng đang hoạt động. Nó cũng bỏ qua các unit bổ sung giống Gateway không hoạt động và không phải legacy trong quá trình quét dịch vụ trùng lặp để các tệp dịch vụ đi kèm không tạo nhiễu dọn dẹp.
    - Nếu xác thực mã thông báo yêu cầu mã thông báo và `gateway.auth.token` do SecretRef quản lý, cài đặt/sửa chữa dịch vụ của doctor xác thực SecretRef nhưng không lưu các giá trị mã thông báo văn bản thuần đã phân giải vào metadata môi trường dịch vụ supervisor.
    - Doctor phát hiện các giá trị môi trường dịch vụ được quản lý bằng `.env`/SecretRef mà các bản cài đặt LaunchAgent, systemd hoặc Windows Scheduled Task cũ đã nhúng inline, rồi ghi lại metadata dịch vụ để các giá trị đó tải từ nguồn runtime thay vì từ định nghĩa supervisor.
    - Doctor phát hiện khi lệnh dịch vụ vẫn cố định `--port` cũ sau khi `gateway.port` thay đổi và ghi lại metadata dịch vụ sang cổng hiện tại.
    - Nếu xác thực mã thông báo yêu cầu mã thông báo và SecretRef mã thông báo đã cấu hình chưa được phân giải, doctor chặn đường dẫn cài đặt/sửa chữa bằng hướng dẫn có thể hành động.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa đặt, doctor chặn cài đặt/sửa chữa cho đến khi mode được đặt tường minh.
    - Với các unit user-systemd trên Linux, kiểm tra lệch mã thông báo của doctor hiện bao gồm cả nguồn `Environment=` và `EnvironmentFile=` khi so sánh metadata xác thực dịch vụ.
    - Sửa chữa dịch vụ của doctor từ chối ghi lại, dừng hoặc khởi động lại dịch vụ Gateway từ binary OpenClaw cũ hơn khi cấu hình được ghi lần cuối bởi phiên bản mới hơn. Xem [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Bạn luôn có thể buộc ghi lại toàn bộ qua `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Chẩn đoán runtime + cổng Gateway">
    Doctor kiểm tra runtime dịch vụ (PID, trạng thái thoát gần nhất) và cảnh báo khi dịch vụ đã cài đặt nhưng thực tế không chạy. Nó cũng kiểm tra xung đột cổng trên cổng Gateway (mặc định `18789`) và báo cáo nguyên nhân có khả năng xảy ra (Gateway đã chạy, SSH tunnel).
  </Accordion>
  <Accordion title="17. Thực hành tốt nhất cho runtime Gateway">
    Doctor cảnh báo khi dịch vụ Gateway chạy trên Bun hoặc đường dẫn Node do trình quản lý phiên bản quản lý (`nvm`, `fnm`, `volta`, `asdf`, v.v.). Các kênh WhatsApp + Telegram yêu cầu Node, và đường dẫn trình quản lý phiên bản có thể hỏng sau khi nâng cấp vì dịch vụ không tải shell init của bạn. Doctor đề nghị di chuyển sang bản cài đặt Node hệ thống khi có sẵn (Homebrew/apt/choco).

    LaunchAgent macOS mới cài đặt hoặc đã sửa chữa dùng PATH hệ thống chuẩn (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) thay vì sao chép PATH shell tương tác, để các binary hệ thống do Homebrew quản lý vẫn khả dụng trong khi Volta, asdf, fnm, pnpm và các thư mục trình quản lý phiên bản khác không thay đổi Node mà tiến trình con phân giải. Dịch vụ Linux vẫn giữ các gốc môi trường tường minh (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) và thư mục user-bin ổn định, nhưng các thư mục dự phòng trình quản lý phiên bản được phỏng đoán chỉ được ghi vào PATH dịch vụ khi các thư mục đó tồn tại trên đĩa.

  </Accordion>
  <Accordion title="18. Ghi cấu hình + metadata wizard">
    Doctor lưu mọi thay đổi cấu hình và đóng dấu metadata wizard để ghi nhận lần chạy doctor.
  </Accordion>
  <Accordion title="19. Mẹo workspace (sao lưu + hệ thống bộ nhớ)">
    Doctor đề xuất hệ thống bộ nhớ workspace khi thiếu và in mẹo sao lưu nếu workspace chưa nằm trong git.

    Xem [/concepts/agent-workspace](/vi/concepts/agent-workspace) để có hướng dẫn đầy đủ về cấu trúc workspace và sao lưu git (khuyến nghị GitHub hoặc GitLab riêng tư).

  </Accordion>
</AccordionGroup>

## Liên quan

- [Runbook Gateway](/vi/gateway)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
