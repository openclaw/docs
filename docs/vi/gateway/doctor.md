---
read_when:
    - Thêm hoặc sửa đổi các migration của doctor
    - Đưa vào các thay đổi cấu hình phá vỡ tương thích
sidebarTitle: Doctor
summary: 'Lệnh doctor: kiểm tra tình trạng, chuyển đổi cấu hình và các bước sửa chữa'
title: Trình chẩn đoán
x-i18n:
    generated_at: "2026-05-10T19:34:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417440c2f658be5848b305bffeb006ad435f069d93f7e73ffbeef9468b58e1b3
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` là công cụ sửa chữa + di chuyển cho OpenClaw. Công cụ này sửa cấu hình/trạng thái lỗi thời, kiểm tra tình trạng, và cung cấp các bước sửa chữa có thể thực hiện.

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

    Chạy mà không nhắc hỏi và chỉ áp dụng các di chuyển an toàn (chuẩn hóa cấu hình + di chuyển trạng thái trên đĩa). Bỏ qua các hành động khởi động lại/dịch vụ/sandbox cần xác nhận của con người. Các di chuyển trạng thái cũ tự động chạy khi được phát hiện.

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

## Công cụ này làm gì (tóm tắt)

<AccordionGroup>
  <Accordion title="Tình trạng, giao diện người dùng và cập nhật">
    - Cập nhật trước khi chạy tùy chọn cho bản cài đặt git (chỉ chế độ tương tác).
    - Kiểm tra độ mới của giao thức UI (xây dựng lại Control UI khi schema giao thức mới hơn).
    - Kiểm tra tình trạng + nhắc khởi động lại.
    - Tóm tắt trạng thái Skills (đủ điều kiện/thiếu/bị chặn) và trạng thái plugin.

  </Accordion>
  <Accordion title="Cấu hình và di chuyển">
    - Chuẩn hóa cấu hình cho các giá trị cũ.
    - Di chuyển cấu hình Talk từ các trường phẳng `talk.*` cũ sang `talk.provider` + `talk.providers.<provider>`.
    - Kiểm tra di chuyển trình duyệt cho cấu hình tiện ích Chrome cũ và mức sẵn sàng của Chrome MCP.
    - Cảnh báo ghi đè nhà cung cấp OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Cảnh báo che khuất OAuth Codex (`models.providers.openai-codex`).
    - Kiểm tra điều kiện tiên quyết OAuth TLS cho hồ sơ OpenAI Codex OAuth.
    - Cảnh báo danh sách cho phép Plugin/công cụ khi `plugins.allow` mang tính hạn chế nhưng chính sách công cụ vẫn yêu cầu ký tự đại diện hoặc công cụ do plugin sở hữu.
    - Di chuyển trạng thái cũ trên đĩa (sessions/thư mục agent/xác thực WhatsApp).
    - Di chuyển khóa hợp đồng manifest plugin cũ (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Di chuyển kho Cron cũ (`jobId`, `schedule.cron`, các trường delivery/payload cấp cao nhất, payload `provider`, các job dự phòng webhook đơn giản `notify: true`).
    - Dọn dẹp chính sách thời gian chạy toàn agent cũ; chính sách thời gian chạy provider/model là bộ chọn tuyến đang hoạt động.
    - Dọn dẹp cấu hình plugin lỗi thời khi plugin được bật; khi `plugins.enabled=false`, các tham chiếu plugin lỗi thời được xem là cấu hình cô lập bất hoạt và được giữ nguyên.

  </Accordion>
  <Accordion title="Trạng thái và tính toàn vẹn">
    - Kiểm tra tệp khóa phiên và dọn dẹp khóa lỗi thời.
    - Sửa transcript phiên cho các nhánh ghi lại prompt bị trùng lặp do các bản dựng 2026.4.24 bị ảnh hưởng tạo ra.
    - Phát hiện tombstone phục hồi khởi động lại subagent bị kẹt, với hỗ trợ `--fix` để xóa các cờ phục hồi bị hủy lỗi thời nhằm ngăn startup tiếp tục coi child là đã bị hủy khi khởi động lại.
    - Kiểm tra tính toàn vẹn trạng thái và quyền (sessions, transcripts, thư mục state).
    - Kiểm tra quyền tệp cấu hình (chmod 600) khi chạy cục bộ.
    - Tình trạng xác thực mô hình: kiểm tra OAuth hết hạn, có thể làm mới token sắp hết hạn, và báo cáo trạng thái cooldown/bị vô hiệu hóa của auth-profile.
    - Phát hiện thư mục workspace bổ sung (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, dịch vụ và supervisor">
    - Sửa ảnh sandbox khi sandboxing được bật.
    - Di chuyển dịch vụ cũ và phát hiện gateway bổ sung.
    - Di chuyển trạng thái cũ của kênh Matrix (ở chế độ `--fix` / `--repair`).
    - Kiểm tra thời gian chạy Gateway (dịch vụ đã cài nhưng không chạy; nhãn launchd được lưu đệm).
    - Cảnh báo trạng thái kênh (thăm dò từ gateway đang chạy).
    - Kiểm tra quyền theo từng kênh nằm trong `openclaw channels capabilities`; ví dụ, quyền kênh thoại Discord được kiểm toán bằng `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Kiểm tra khả năng phản hồi của WhatsApp đối với tình trạng vòng lặp sự kiện Gateway suy giảm trong khi client TUI cục bộ vẫn đang chạy; `--fix` chỉ dừng các client TUI cục bộ đã được xác minh.
    - Sửa tuyến Codex cho các tham chiếu mô hình `openai-codex/*` cũ trong mô hình chính, fallback, ghi đè heartbeat/subagent/compaction, hook, ghi đè mô hình kênh, và ghim tuyến phiên; `--fix` ghi lại chúng thành `openai/*`, xóa các ghim thời gian chạy phiên/toàn agent lỗi thời, và để lại các tham chiếu agent OpenAI chuẩn trên harness Codex mặc định.
    - Kiểm toán cấu hình supervisor (launchd/systemd/schtasks) với tùy chọn sửa chữa.
    - Dọn dẹp môi trường proxy nhúng cho các dịch vụ gateway đã ghi lại giá trị shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` trong khi cài đặt hoặc cập nhật.
    - Kiểm tra thực hành tốt nhất cho thời gian chạy Gateway (Node so với Bun, đường dẫn trình quản lý phiên bản).
    - Chẩn đoán xung đột cổng Gateway (mặc định `18789`).

  </Accordion>
  <Accordion title="Xác thực, bảo mật và ghép đôi">
    - Cảnh báo bảo mật cho chính sách DM mở.
    - Kiểm tra xác thực Gateway cho chế độ token cục bộ (đề nghị tạo token khi không có nguồn token; không ghi đè cấu hình token SecretRef).
    - Phát hiện sự cố ghép đôi thiết bị (yêu cầu ghép đôi lần đầu đang chờ, nâng cấp vai trò/phạm vi đang chờ, lệch bộ nhớ đệm device-token cục bộ lỗi thời, và lệch xác thực bản ghi đã ghép đôi).

  </Accordion>
  <Accordion title="Workspace và shell">
    - Kiểm tra systemd linger trên Linux.
    - Kiểm tra kích thước tệp bootstrap workspace (cảnh báo cắt ngắn/gần giới hạn cho tệp ngữ cảnh).
    - Kiểm tra mức sẵn sàng của Skills cho agent mặc định; báo cáo skills được cho phép nhưng thiếu binary, env, config, hoặc yêu cầu OS, và `--fix` có thể vô hiệu hóa skills không khả dụng trong `skills.entries`.
    - Kiểm tra trạng thái hoàn tất shell và tự động cài đặt/nâng cấp.
    - Kiểm tra mức sẵn sàng của nhà cung cấp embedding tìm kiếm bộ nhớ (mô hình cục bộ, khóa API từ xa, hoặc binary QMD).
    - Kiểm tra bản cài đặt từ mã nguồn (không khớp pnpm workspace, thiếu tài sản UI, thiếu binary tsx).
    - Ghi cấu hình đã cập nhật + metadata wizard.

  </Accordion>
</AccordionGroup>

## Điền bù và đặt lại UI Dreams

Cảnh Dreams của Control UI bao gồm các hành động **Điền bù**, **Đặt lại**, và **Xóa phần có căn cứ** cho quy trình Dreaming có căn cứ. Các hành động này dùng các phương thức RPC kiểu gateway doctor, nhưng chúng **không** thuộc phần sửa chữa/di chuyển CLI của `openclaw doctor`.

Những gì chúng làm:

- **Điền bù** quét các tệp lịch sử `memory/YYYY-MM-DD.md` trong workspace đang hoạt động, chạy lượt nhật ký REM có căn cứ, và ghi các mục điền bù có thể đảo ngược vào `DREAMS.md`.
- **Đặt lại** chỉ xóa các mục nhật ký điền bù đã được đánh dấu đó khỏi `DREAMS.md`.
- **Xóa phần có căn cứ** chỉ xóa các mục ngắn hạn chỉ-có-căn-cứ đã được stage, đến từ phát lại lịch sử và chưa tích lũy recall trực tiếp hoặc hỗ trợ hằng ngày.

Những gì tự chúng **không** làm:

- chúng không chỉnh sửa `MEMORY.md`
- chúng không chạy đầy đủ các di chuyển doctor
- chúng không tự động stage ứng viên có căn cứ vào kho thăng hạng ngắn hạn trực tiếp trừ khi bạn chạy rõ ràng đường dẫn CLI đã stage trước

Nếu bạn muốn phát lại lịch sử có căn cứ ảnh hưởng đến lane thăng hạng sâu thông thường, hãy dùng luồng CLI thay thế:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Lệnh đó stage các ứng viên bền vững có căn cứ vào kho Dreaming ngắn hạn trong khi giữ `DREAMS.md` làm bề mặt xem xét.

## Hành vi chi tiết và lý do

<AccordionGroup>
  <Accordion title="0. Cập nhật tùy chọn (bản cài đặt git)">
    Nếu đây là một checkout git và doctor đang chạy tương tác, công cụ sẽ đề nghị cập nhật (fetch/rebase/build) trước khi chạy doctor.
  </Accordion>
  <Accordion title="1. Chuẩn hóa cấu hình">
    Nếu cấu hình chứa các dạng giá trị cũ (ví dụ `messages.ackReaction` không có ghi đè theo kênh), doctor chuẩn hóa chúng vào schema hiện tại.

    Điều đó bao gồm các trường phẳng Talk cũ. Cấu hình speech Talk công khai hiện tại là `talk.provider` + `talk.providers.<provider>`, và cấu hình giọng nói realtime là `talk.realtime.*`. Doctor ghi lại các dạng `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` cũ vào bản đồ provider, và ghi lại các bộ chọn realtime cấp cao nhất cũ (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) vào `talk.realtime`.

    Doctor cũng cảnh báo khi `plugins.allow` không rỗng và chính sách công cụ dùng
    ký tự đại diện hoặc các mục công cụ do plugin sở hữu. `tools.allow: ["*"]` chỉ khớp với công cụ
    từ các plugin thực sự tải; nó không bỏ qua danh sách cho phép plugin độc quyền.
    Doctor ghi `plugins.bundledDiscovery: "compat"` cho các cấu hình danh sách cho phép cũ đã di chuyển
    để giữ nguyên hành vi nhà cung cấp đi kèm hiện có, rồi
    trỏ đến thiết lập `"allowlist"` chặt chẽ hơn.

  </Accordion>
  <Accordion title="2. Di chuyển khóa cấu hình cũ">
    Khi cấu hình chứa các khóa đã ngừng dùng, các lệnh khác từ chối chạy và yêu cầu bạn chạy `openclaw doctor`.

    Doctor sẽ:

    - Giải thích những khóa cũ nào đã được tìm thấy.
    - Hiển thị di chuyển đã áp dụng.
    - Ghi lại `~/.openclaw/openclaw.json` với schema đã cập nhật.

    Startup Gateway từ chối định dạng cấu hình cũ và yêu cầu bạn chạy `openclaw doctor --fix`; nó không ghi lại `openclaw.json` khi startup. Di chuyển kho job Cron cũng được xử lý bởi `openclaw doctor --fix`.

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
    - Với các kênh có `accounts` được đặt tên nhưng vẫn còn các giá trị kênh cấp cao nhất cho một tài khoản đơn lẻ, hãy di chuyển các giá trị thuộc phạm vi tài khoản đó vào tài khoản đã được nâng cấp được chọn cho kênh đó (`accounts.default` cho hầu hết các kênh; Matrix có thể giữ lại một đích được đặt tên/mặc định hiện có khớp)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - xóa `agents.defaults.llm`; dùng `models.providers.<id>.timeoutSeconds` cho thời gian chờ nhà cung cấp/mô hình chậm
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - xóa `browser.relayBindHost` (thiết lập relay tiện ích mở rộng cũ)
    - `models.providers.*.api: "openai"` cũ → `"openai-completions"` (Gateway khi khởi động cũng bỏ qua các nhà cung cấp có `api` được đặt thành một giá trị enum tương lai hoặc không xác định thay vì đóng lỗi)
    - xóa `plugins.entries.codex.config.codexDynamicToolsProfile`; app-server Codex luôn giữ các công cụ không gian làm việc gốc của Codex ở dạng gốc

    Cảnh báo của Doctor cũng bao gồm hướng dẫn tài khoản mặc định cho các kênh nhiều tài khoản:

    - Nếu hai hoặc nhiều mục `channels.<channel>.accounts` được cấu hình mà không có `channels.<channel>.defaultAccount` hoặc `accounts.default`, doctor cảnh báo rằng định tuyến dự phòng có thể chọn một tài khoản ngoài ý muốn.
    - Nếu `channels.<channel>.defaultAccount` được đặt thành một ID tài khoản không xác định, doctor cảnh báo và liệt kê các ID tài khoản đã cấu hình.

  </Accordion>
  <Accordion title="2b. Ghi đè nhà cung cấp OpenCode">
    Nếu bạn đã thêm thủ công `models.providers.opencode`, `opencode-zen`, hoặc `opencode-go`, mục đó sẽ ghi đè danh mục OpenCode tích hợp sẵn từ `@mariozechner/pi-ai`. Điều đó có thể ép các mô hình dùng sai API hoặc đặt chi phí về không. Doctor cảnh báo để bạn có thể xóa ghi đè và khôi phục định tuyến API + chi phí theo từng mô hình.
  </Accordion>
  <Accordion title="2c. Di chuyển trình duyệt và trạng thái sẵn sàng Chrome MCP">
    Nếu cấu hình trình duyệt của bạn vẫn trỏ tới đường dẫn tiện ích mở rộng Chrome đã bị xóa, doctor sẽ chuẩn hóa cấu hình đó sang mô hình đính kèm Chrome MCP cục bộ trên máy chủ hiện tại:

    - `browser.profiles.*.driver: "extension"` trở thành `"existing-session"`
    - `browser.relayBindHost` bị xóa

    Doctor cũng kiểm tra đường dẫn Chrome MCP cục bộ trên máy chủ khi bạn dùng `defaultProfile: "user"` hoặc một hồ sơ `existing-session` đã cấu hình:

    - kiểm tra Google Chrome có được cài đặt trên cùng máy chủ cho các hồ sơ tự động kết nối mặc định hay không
    - kiểm tra phiên bản Chrome được phát hiện và cảnh báo khi phiên bản thấp hơn Chrome 144
    - nhắc bạn bật gỡ lỗi từ xa trong trang kiểm tra của trình duyệt (ví dụ `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, hoặc `edge://inspect/#remote-debugging`)

    Doctor không thể bật thiết lập phía Chrome cho bạn. Chrome MCP cục bộ trên máy chủ vẫn yêu cầu:

    - một trình duyệt dựa trên Chromium 144+ trên máy chủ gateway/node
    - trình duyệt đang chạy cục bộ
    - gỡ lỗi từ xa được bật trong trình duyệt đó
    - phê duyệt lời nhắc đồng ý đính kèm lần đầu trong trình duyệt

    Trạng thái sẵn sàng ở đây chỉ nói về các điều kiện tiên quyết để đính kèm cục bộ. Existing-session giữ các giới hạn tuyến Chrome MCP hiện tại; các tuyến nâng cao như `responsebody`, xuất PDF, chặn tải xuống, và hành động hàng loạt vẫn yêu cầu trình duyệt được quản lý hoặc hồ sơ CDP thô.

    Kiểm tra này **không** áp dụng cho Docker, sandbox, remote-browser, hoặc các luồng headless khác. Các luồng đó tiếp tục dùng CDP thô.

  </Accordion>
  <Accordion title="2d. Điều kiện tiên quyết OAuth TLS">
    Khi một hồ sơ OpenAI Codex OAuth được cấu hình, doctor thăm dò điểm cuối ủy quyền OpenAI để xác minh ngăn xếp TLS Node/OpenSSL cục bộ có thể xác thực chuỗi chứng chỉ. Nếu thăm dò thất bại với lỗi chứng chỉ (ví dụ `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, chứng chỉ hết hạn, hoặc chứng chỉ tự ký), doctor in hướng dẫn sửa lỗi theo nền tảng. Trên macOS với Node Homebrew, cách sửa thường là `brew postinstall ca-certificates`. Với `--deep`, thăm dò vẫn chạy ngay cả khi gateway khỏe mạnh.
  </Accordion>
  <Accordion title="2e. Ghi đè nhà cung cấp Codex OAuth">
    Nếu trước đây bạn đã thêm các thiết lập vận chuyển OpenAI cũ dưới `models.providers.openai-codex`, chúng có thể che khuất đường dẫn nhà cung cấp Codex OAuth tích hợp mà các bản phát hành mới hơn tự động sử dụng. Doctor cảnh báo khi thấy các thiết lập vận chuyển cũ đó cùng với Codex OAuth để bạn có thể xóa hoặc viết lại ghi đè vận chuyển đã lỗi thời và khôi phục hành vi định tuyến/dự phòng tích hợp. Proxy tùy chỉnh và ghi đè chỉ header vẫn được hỗ trợ và không kích hoạt cảnh báo này.
  </Accordion>
  <Accordion title="2f. Sửa chữa tuyến Codex">
    Doctor kiểm tra các tham chiếu mô hình `openai-codex/*` cũ. Định tuyến harness Codex gốc dùng các tham chiếu mô hình chuẩn `openai/*`; lượt agent OpenAI đi qua harness app-server Codex thay vì đường dẫn OpenAI OpenClaw PI.

    Trong chế độ `--fix` / `--repair`, doctor viết lại các tham chiếu agent mặc định và theo từng agent bị ảnh hưởng, bao gồm mô hình chính, dự phòng, ghi đè heartbeat/subagent/compaction, hook, ghi đè mô hình kênh, và trạng thái tuyến phiên đã lưu cũ:

    - `openai-codex/gpt-*` trở thành `openai/gpt-*`.
    - Ý định Codex chuyển sang các mục `agentRuntime.id: "codex"` thuộc phạm vi nhà cung cấp/mô hình cho các tham chiếu mô hình agent đã sửa để hồ sơ xác thực `openai-codex:...` vẫn có thể được chọn sau khi tham chiếu mô hình trở thành `openai/*`.
    - Cấu hình runtime toàn agent cũ và các ghim runtime phiên đã lưu bị xóa vì lựa chọn runtime thuộc phạm vi nhà cung cấp/mô hình.
    - Chính sách runtime nhà cung cấp/mô hình hiện có được giữ nguyên trừ khi tham chiếu mô hình cũ đã sửa cần định tuyến Codex để giữ đường dẫn xác thực cũ.
    - Danh sách mô hình dự phòng hiện có được giữ lại với các mục cũ được viết lại; các thiết lập theo mô hình đã sao chép chuyển từ khóa cũ sang khóa chuẩn `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, thông báo dự phòng, và ghim hồ sơ xác thực của phiên đã lưu được sửa trên tất cả kho phiên agent được phát hiện.
    - `/codex ...` nghĩa là "điều khiển hoặc liên kết một cuộc hội thoại Codex gốc từ chat."
    - `/acp ...` hoặc `runtime: "acp"` nghĩa là "dùng bộ chuyển tiếp ACP/acpx bên ngoài."

  </Accordion>
  <Accordion title="2g. Dọn dẹp tuyến phiên">
    Doctor cũng quét các kho phiên agent được phát hiện để tìm trạng thái tuyến tự tạo cũ sau khi bạn chuyển mô hình hoặc runtime đã cấu hình ra khỏi tuyến do Plugin sở hữu, chẳng hạn như Codex.

    `openclaw doctor --fix` có thể xóa trạng thái cũ tự tạo như ghim mô hình `modelOverrideSource: "auto"`, siêu dữ liệu mô hình runtime, ID harness đã ghim, liên kết phiên CLI, và ghi đè hồ sơ xác thực tự động khi tuyến sở hữu chúng không còn được cấu hình. Các lựa chọn mô hình phiên rõ ràng của người dùng hoặc cũ được báo cáo để xem xét thủ công và giữ nguyên; hãy chuyển chúng bằng `/model ...`, `/new`, hoặc đặt lại phiên khi tuyến đó không còn được dự định sử dụng.

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

    Các di chuyển này theo kiểu nỗ lực tối đa và có tính lặp lại an toàn; doctor sẽ phát cảnh báo khi để lại bất kỳ thư mục cũ nào dưới dạng bản sao lưu. Gateway/CLI cũng tự động di chuyển phiên cũ + thư mục agent khi khởi động để lịch sử/xác thực/mô hình nằm trong đường dẫn theo từng agent mà không cần chạy doctor thủ công. Xác thực WhatsApp được cố ý chỉ di chuyển qua `openclaw doctor`. Việc chuẩn hóa nhà cung cấp/bản đồ nhà cung cấp Talk hiện so sánh theo bình đẳng cấu trúc, vì vậy các khác biệt chỉ về thứ tự khóa không còn kích hoạt lặp lại các thay đổi `doctor --fix` vô hiệu.

  </Accordion>
  <Accordion title="3a. Di chuyển manifest Plugin cũ">
    Doctor quét tất cả manifest Plugin đã cài đặt để tìm các khóa capability cấp cao nhất đã ngừng dùng (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Khi tìm thấy, nó đề nghị chuyển chúng vào đối tượng `contracts` và viết lại tệp manifest tại chỗ. Di chuyển này có tính lặp lại an toàn; nếu khóa `contracts` đã có cùng giá trị, khóa cũ sẽ bị xóa mà không nhân đôi dữ liệu.
  </Accordion>
  <Accordion title="3b. Di chuyển kho cron cũ">
    Doctor cũng kiểm tra kho công việc cron (`~/.openclaw/cron/jobs.json` theo mặc định, hoặc `cron.store` khi được ghi đè) để tìm các dạng công việc cũ mà bộ lập lịch vẫn chấp nhận để tương thích.

    Các bước dọn dẹp cron hiện tại bao gồm:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - các trường payload cấp cao nhất (`message`, `model`, `thinking`, ...) → `payload`
    - các trường phân phối cấp cao nhất (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - các alias phân phối payload `provider` → `delivery.channel` tường minh
    - các job dự phòng Webhook `notify: true` đơn giản theo kiểu cũ → `delivery.mode="webhook"` tường minh với `delivery.to=cron.webhook`

    Doctor chỉ tự động di trú các job `notify: true` khi có thể làm vậy mà không thay đổi hành vi. Nếu một job kết hợp cơ chế dự phòng notify kiểu cũ với một chế độ phân phối không phải Webhook hiện có, doctor sẽ cảnh báo và để job đó cho bạn xem xét thủ công.

    Trên Linux, doctor cũng cảnh báo khi crontab của người dùng vẫn gọi `~/.openclaw/bin/ensure-whatsapp.sh` kiểu cũ. Script cục bộ trên máy chủ đó không được OpenClaw hiện tại duy trì và có thể ghi các thông báo `Gateway inactive` sai vào `~/.openclaw/logs/whatsapp-health.log` khi cron không thể truy cập bus người dùng systemd. Xóa mục crontab cũ bằng `crontab -e`; dùng `openclaw channels status --probe`, `openclaw doctor` và `openclaw gateway status` cho các kiểm tra tình trạng hiện tại.

  </Accordion>
  <Accordion title="3c. Dọn dẹp khóa phiên">
    Doctor quét mọi thư mục phiên agent để tìm các tệp khóa ghi cũ — các tệp còn sót lại khi một phiên thoát bất thường. Với mỗi tệp khóa tìm thấy, nó báo cáo: đường dẫn, PID, PID có còn sống hay không, tuổi của khóa, và khóa có được xem là cũ hay không (PID đã chết, cũ hơn 30 phút, hoặc PID còn sống nhưng có thể chứng minh là thuộc về một tiến trình không phải OpenClaw). Ở chế độ `--fix` / `--repair`, nó tự động xóa các tệp khóa cũ; nếu không, nó in ghi chú và hướng dẫn bạn chạy lại với `--fix`.
  </Accordion>
  <Accordion title="3d. Sửa nhánh transcript phiên">
    Doctor quét các tệp JSONL phiên agent để tìm dạng nhánh bị nhân đôi do lỗi viết lại transcript prompt ngày 2026.4.24 tạo ra: một lượt người dùng bị bỏ rơi có ngữ cảnh runtime nội bộ của OpenClaw cùng với một nhánh anh em đang hoạt động chứa cùng prompt người dùng hiển thị. Ở chế độ `--fix` / `--repair`, doctor sao lưu từng tệp bị ảnh hưởng cạnh tệp gốc rồi viết lại transcript về nhánh đang hoạt động để lịch sử Gateway và trình đọc bộ nhớ không còn thấy các lượt trùng lặp.
  </Accordion>
  <Accordion title="4. Kiểm tra tính toàn vẹn trạng thái (lưu phiên, định tuyến và an toàn)">
    Thư mục trạng thái là thân não vận hành. Nếu nó biến mất, bạn sẽ mất phiên, thông tin xác thực, nhật ký và cấu hình (trừ khi bạn có bản sao lưu ở nơi khác).

    Doctor kiểm tra:

    - **Thiếu thư mục trạng thái**: cảnh báo về mất trạng thái nghiêm trọng, nhắc tạo lại thư mục và nhắc bạn rằng nó không thể khôi phục dữ liệu bị thiếu.
    - **Quyền thư mục trạng thái**: xác minh khả năng ghi; đề nghị sửa quyền (và phát gợi ý `chown` khi phát hiện chủ sở hữu/nhóm không khớp).
    - **Thư mục trạng thái đồng bộ đám mây trên macOS**: cảnh báo khi trạng thái phân giải dưới iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) hoặc `~/Library/CloudStorage/...` vì các đường dẫn được đồng bộ hóa có thể gây I/O chậm hơn và các cuộc đua khóa/đồng bộ.
    - **Thư mục trạng thái trên SD hoặc eMMC Linux**: cảnh báo khi trạng thái phân giải tới nguồn mount `mmcblk*`, vì I/O ngẫu nhiên dựa trên SD hoặc eMMC có thể chậm hơn và hao mòn nhanh hơn khi ghi phiên và thông tin xác thực.
    - **Thiếu thư mục phiên**: `sessions/` và thư mục kho phiên là bắt buộc để lưu lịch sử và tránh crash `ENOENT`.
    - **Transcript không khớp**: cảnh báo khi các mục phiên gần đây thiếu tệp transcript.
    - **Phiên chính "JSONL 1 dòng"**: đánh dấu khi transcript chính chỉ có một dòng (lịch sử không tích lũy).
    - **Nhiều thư mục trạng thái**: cảnh báo khi nhiều thư mục `~/.openclaw` tồn tại trên các thư mục home hoặc khi `OPENCLAW_STATE_DIR` trỏ tới nơi khác (lịch sử có thể bị chia giữa các bản cài đặt).
    - **Nhắc nhở chế độ từ xa**: nếu `gateway.mode=remote`, doctor nhắc bạn chạy nó trên máy chủ từ xa (trạng thái nằm ở đó).
    - **Quyền tệp cấu hình**: cảnh báo nếu `~/.openclaw/openclaw.json` có thể đọc bởi nhóm/mọi người và đề nghị siết lại thành `600`.

  </Accordion>
  <Accordion title="5. Tình trạng xác thực mô hình (hết hạn OAuth)">
    Doctor kiểm tra các hồ sơ OAuth trong kho xác thực, cảnh báo khi token sắp hết hạn/đã hết hạn, và có thể làm mới chúng khi an toàn. Nếu hồ sơ OAuth/token Anthropic đã cũ, nó gợi ý khóa API Anthropic hoặc đường dẫn setup-token Anthropic. Lời nhắc làm mới chỉ xuất hiện khi chạy tương tác (TTY); `--non-interactive` bỏ qua các lần thử làm mới.

    Khi làm mới OAuth thất bại vĩnh viễn (ví dụ `refresh_token_reused`, `invalid_grant`, hoặc một provider yêu cầu bạn đăng nhập lại), doctor báo rằng cần xác thực lại và in chính xác lệnh `openclaw models auth login --provider ...` cần chạy.

    Doctor cũng báo cáo các hồ sơ xác thực tạm thời không thể sử dụng do:

    - cooldown ngắn (giới hạn tốc độ/hết thời gian chờ/lỗi xác thực)
    - vô hiệu hóa dài hơn (lỗi thanh toán/tín dụng)

  </Accordion>
  <Accordion title="6. Xác thực mô hình hook">
    Nếu `hooks.gmail.model` được đặt, doctor xác thực tham chiếu mô hình với catalog và allowlist, rồi cảnh báo khi nó không phân giải được hoặc không được cho phép.
  </Accordion>
  <Accordion title="7. Sửa ảnh sandbox">
    Khi sandboxing được bật, doctor kiểm tra Docker image và đề nghị build hoặc chuyển sang tên kiểu cũ nếu image hiện tại bị thiếu.
  </Accordion>
  <Accordion title="7b. Dọn dẹp cài đặt Plugin">
    Doctor xóa trạng thái staging dependency Plugin do OpenClaw tạo theo kiểu cũ ở chế độ `openclaw doctor --fix` / `openclaw doctor --repair`. Việc này bao gồm các root dependency được tạo đã cũ, thư mục install-stage cũ, phần dư cục bộ theo package từ mã sửa dependency Plugin đóng gói trước đây, và các bản sao npm được quản lý của các Plugin `@openclaw/*` đóng gói bị mồ côi hoặc khôi phục có thể che khuất manifest đóng gói hiện tại.

    Doctor cũng có thể cài đặt lại các Plugin có thể tải xuống bị thiếu khi cấu hình tham chiếu đến chúng nhưng registry Plugin cục bộ không tìm thấy. Ví dụ gồm `plugins.entries` thực tế, cài đặt kênh/provider/tìm kiếm đã cấu hình và runtime agent đã cấu hình. Trong quá trình cập nhật package, doctor tránh chạy sửa Plugin bằng trình quản lý package khi package lõi đang được thay thế; chạy lại `openclaw doctor --fix` sau khi cập nhật nếu một Plugin đã cấu hình vẫn cần khôi phục. Khởi động Gateway và tải lại cấu hình không chạy trình quản lý package; cài đặt Plugin vẫn là công việc doctor/install/update tường minh.

  </Accordion>
  <Accordion title="8. Di trú dịch vụ Gateway và gợi ý dọn dẹp">
    Doctor phát hiện các dịch vụ Gateway kiểu cũ (launchd/systemd/schtasks) và đề nghị xóa chúng rồi cài đặt dịch vụ OpenClaw bằng cổng Gateway hiện tại. Nó cũng có thể quét các dịch vụ giống Gateway bổ sung và in gợi ý dọn dẹp. Các dịch vụ Gateway OpenClaw có tên theo hồ sơ được xem là hạng nhất và không bị đánh dấu là "bổ sung".

    Trên Linux, nếu thiếu dịch vụ Gateway cấp người dùng nhưng tồn tại dịch vụ Gateway OpenClaw cấp hệ thống, doctor không tự động cài đặt thêm một dịch vụ cấp người dùng thứ hai. Kiểm tra bằng `openclaw gateway status --deep` hoặc `openclaw doctor --deep`, rồi xóa bản trùng lặp hoặc đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một trình giám sát hệ thống sở hữu vòng đời Gateway.

  </Accordion>
  <Accordion title="8b. Di trú Startup Matrix">
    Khi một tài khoản kênh Matrix có di trú trạng thái kiểu cũ đang chờ hoặc có thể hành động, doctor (ở chế độ `--fix` / `--repair`) tạo snapshot trước di trú rồi chạy các bước di trú theo nỗ lực tối đa: di trú trạng thái Matrix kiểu cũ và chuẩn bị trạng thái mã hóa kiểu cũ. Cả hai bước đều không gây lỗi nghiêm trọng; lỗi được ghi nhật ký và quá trình khởi động tiếp tục. Ở chế độ chỉ đọc (`openclaw doctor` không có `--fix`), kiểm tra này bị bỏ qua hoàn toàn.
  </Accordion>
  <Accordion title="8c. Ghép đôi thiết bị và lệch xác thực">
    Doctor hiện kiểm tra trạng thái ghép đôi thiết bị như một phần của lượt kiểm tra tình trạng thông thường.

    Những gì nó báo cáo:

    - yêu cầu ghép đôi lần đầu đang chờ
    - nâng cấp vai trò đang chờ cho các thiết bị đã ghép đôi
    - nâng cấp phạm vi đang chờ cho các thiết bị đã ghép đôi
    - sửa lỗi khóa công khai không khớp khi id thiết bị vẫn khớp nhưng danh tính thiết bị không còn khớp với bản ghi đã phê duyệt
    - bản ghi đã ghép đôi thiếu token hoạt động cho một vai trò đã phê duyệt
    - token đã ghép đôi có phạm vi lệch khỏi baseline ghép đôi đã phê duyệt
    - các mục token thiết bị được cache cục bộ cho máy hiện tại có trước một lần xoay token phía Gateway hoặc mang metadata phạm vi đã cũ

    Doctor không tự động phê duyệt yêu cầu ghép đôi hoặc tự động xoay token thiết bị. Thay vào đó, nó in chính xác các bước tiếp theo:

    - kiểm tra yêu cầu đang chờ bằng `openclaw devices list`
    - phê duyệt chính xác yêu cầu bằng `openclaw devices approve <requestId>`
    - xoay token mới bằng `openclaw devices rotate --device <deviceId> --role <role>`
    - xóa và phê duyệt lại một bản ghi cũ bằng `openclaw devices remove <deviceId>`

    Điều này đóng lỗ hổng phổ biến "đã ghép đôi nhưng vẫn nhận yêu cầu ghép đôi": doctor hiện phân biệt ghép đôi lần đầu với nâng cấp vai trò/phạm vi đang chờ và với lệch token/danh tính thiết bị cũ.

  </Accordion>
  <Accordion title="9. Cảnh báo bảo mật">
    Doctor phát cảnh báo khi một provider mở với DM mà không có allowlist, hoặc khi một policy được cấu hình theo cách nguy hiểm.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Nếu chạy như một dịch vụ người dùng systemd, doctor đảm bảo lingering được bật để Gateway vẫn sống sau khi đăng xuất.
  </Accordion>
  <Accordion title="11. Trạng thái workspace (Skills, Plugin và thư mục kiểu cũ)">
    Doctor in bản tóm tắt trạng thái workspace cho agent mặc định:

    - **Trạng thái Skills**: đếm Skills đủ điều kiện, thiếu yêu cầu và bị chặn bởi allowlist.
    - **Thư mục workspace kiểu cũ**: cảnh báo khi `~/openclaw` hoặc các thư mục workspace kiểu cũ khác tồn tại cùng workspace hiện tại.
    - **Trạng thái Plugin**: đếm Plugin được bật/bị tắt/bị lỗi; liệt kê ID Plugin cho bất kỳ lỗi nào; báo cáo capability của Plugin đóng gói.
    - **Cảnh báo tương thích Plugin**: đánh dấu các Plugin có vấn đề tương thích với runtime hiện tại.
    - **Chẩn đoán Plugin**: hiển thị mọi cảnh báo hoặc lỗi trong lúc tải do registry Plugin phát ra.

  </Accordion>
  <Accordion title="11b. Kích thước tệp bootstrap">
    Doctor kiểm tra xem các tệp bootstrap workspace (ví dụ `AGENTS.md`, `CLAUDE.md`, hoặc các tệp ngữ cảnh được chèn khác) có gần hoặc vượt ngân sách ký tự đã cấu hình hay không. Nó báo cáo số ký tự thô so với số ký tự được chèn theo từng tệp, phần trăm cắt ngắn, nguyên nhân cắt ngắn (`max/file` hoặc `max/total`), và tổng số ký tự được chèn dưới dạng tỷ lệ so với tổng ngân sách. Khi các tệp bị cắt ngắn hoặc gần giới hạn, doctor in mẹo để tinh chỉnh `agents.defaults.bootstrapMaxChars` và `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Dọn dẹp Plugin kênh cũ">
    Khi `openclaw doctor --fix` xóa một Plugin kênh bị thiếu, nó cũng xóa cấu hình theo phạm vi kênh treo đang tham chiếu Plugin đó: các mục `channels.<id>`, mục tiêu Heartbeat đã nêu tên kênh, và các override `agents.*.models["<channel>/*"]`. Việc này ngăn các vòng lặp khởi động Gateway khi runtime kênh đã biến mất nhưng cấu hình vẫn yêu cầu gateway bind vào nó.
  </Accordion>
  <Accordion title="11c. Hoàn thành shell">
    Doctor kiểm tra xem hoàn thành tab đã được cài đặt cho shell hiện tại (zsh, bash, fish hoặc PowerShell) hay chưa:

    - Nếu hồ sơ shell dùng mẫu hoàn thành động chậm (`source <(openclaw completion ...)`), doctor nâng cấp nó lên biến thể tệp cache nhanh hơn.
    - Nếu hoàn thành được cấu hình trong hồ sơ nhưng thiếu tệp cache, doctor tự động tạo lại cache.
    - Nếu hoàn toàn chưa cấu hình hoàn thành, doctor nhắc cài đặt nó (chỉ chế độ tương tác; bỏ qua với `--non-interactive`).

    Chạy `openclaw completion --write-state` để tạo lại cache thủ công.

  </Accordion>
  <Accordion title="12. Kiểm tra xác thực Gateway (token cục bộ)">
    Doctor kiểm tra mức sẵn sàng xác thực bằng token của gateway cục bộ.

    - Nếu chế độ token cần một token và không có nguồn token nào tồn tại, doctor sẽ đề xuất tạo một token.
    - Nếu `gateway.auth.token` do SecretRef quản lý nhưng không khả dụng, doctor sẽ cảnh báo và không ghi đè bằng văn bản thuần.
    - `openclaw doctor --generate-gateway-token` chỉ ép tạo khi không có SecretRef token nào được cấu hình.

  </Accordion>
  <Accordion title="12b. Sửa chữa chỉ đọc có nhận biết SecretRef">
    Một số luồng sửa chữa cần kiểm tra thông tin xác thực đã cấu hình mà không làm suy yếu hành vi thất bại nhanh của runtime.

    - `openclaw doctor --fix` hiện dùng cùng mô hình tóm tắt SecretRef chỉ đọc như các lệnh thuộc nhóm trạng thái cho các sửa chữa cấu hình có mục tiêu.
    - Ví dụ: sửa chữa Telegram `allowFrom` / `groupAllowFrom` `@username` sẽ cố dùng thông tin xác thực bot đã cấu hình khi có sẵn.
    - Nếu token bot Telegram được cấu hình qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại, doctor báo rằng thông tin xác thực đã được cấu hình nhưng không khả dụng và bỏ qua tự động phân giải thay vì bị lỗi hoặc báo sai rằng token bị thiếu.

  </Accordion>
  <Accordion title="13. Kiểm tra sức khỏe Gateway + khởi động lại">
    Doctor chạy kiểm tra sức khỏe và đề xuất khởi động lại gateway khi gateway có vẻ không khỏe.
  </Accordion>
  <Accordion title="13b. Mức sẵn sàng tìm kiếm bộ nhớ">
    Doctor kiểm tra xem nhà cung cấp embedding tìm kiếm bộ nhớ đã cấu hình có sẵn sàng cho agent mặc định hay không. Hành vi phụ thuộc vào backend và nhà cung cấp đã cấu hình:

    - **Backend QMD**: thăm dò xem binary `qmd` có khả dụng và có thể khởi động hay không. Nếu không, in hướng dẫn sửa chữa bao gồm gói npm và tùy chọn đường dẫn binary thủ công.
    - **Nhà cung cấp cục bộ rõ ràng**: kiểm tra tệp mô hình cục bộ hoặc URL mô hình từ xa/có thể tải xuống được nhận diện. Nếu thiếu, đề xuất chuyển sang một nhà cung cấp từ xa.
    - **Nhà cung cấp từ xa rõ ràng** (`openai`, `voyage`, v.v.): xác minh API key có trong môi trường hoặc kho xác thực. In gợi ý sửa chữa có thể hành động nếu thiếu.
    - **Nhà cung cấp tự động**: kiểm tra mức sẵn có của mô hình cục bộ trước, rồi thử từng nhà cung cấp từ xa theo thứ tự tự động chọn.

    Khi có kết quả thăm dò gateway được lưu trong bộ nhớ đệm (gateway khỏe tại thời điểm kiểm tra), doctor đối chiếu kết quả đó với cấu hình mà CLI thấy được và ghi chú mọi sai khác. Doctor không bắt đầu ping embedding mới trên đường dẫn mặc định; hãy dùng lệnh trạng thái bộ nhớ sâu khi bạn muốn kiểm tra nhà cung cấp trực tiếp.

    Dùng `openclaw memory status --deep` để xác minh mức sẵn sàng của embedding tại runtime.

  </Accordion>
  <Accordion title="14. Cảnh báo trạng thái kênh">
    Nếu gateway khỏe, doctor chạy thăm dò trạng thái kênh và báo cáo cảnh báo kèm các sửa chữa được đề xuất.
  </Accordion>
  <Accordion title="15. Kiểm tra cấu hình supervisor + sửa chữa">
    Doctor kiểm tra cấu hình supervisor đã cài đặt (launchd/systemd/schtasks) để tìm các mặc định bị thiếu hoặc đã lỗi thời (ví dụ: phụ thuộc network-online của systemd và độ trễ khởi động lại). Khi phát hiện không khớp, doctor khuyến nghị cập nhật và có thể ghi lại tệp service/task về các mặc định hiện tại.

    Ghi chú:

    - `openclaw doctor` sẽ hỏi trước khi ghi lại cấu hình supervisor.
    - `openclaw doctor --yes` chấp nhận các lời nhắc sửa chữa mặc định.
    - `openclaw doctor --repair` áp dụng các sửa chữa được khuyến nghị mà không hỏi.
    - `openclaw doctor --repair --force` ghi đè cấu hình supervisor tùy chỉnh.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` giữ doctor ở chế độ chỉ đọc cho vòng đời service Gateway. Nó vẫn báo cáo sức khỏe service và chạy các sửa chữa không liên quan đến service, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap service, ghi lại cấu hình supervisor và dọn dẹp service cũ vì một supervisor bên ngoài sở hữu vòng đời đó.
    - Trên Linux, doctor không ghi lại siêu dữ liệu lệnh/entrypoint khi unit systemd gateway tương ứng đang hoạt động. Nó cũng bỏ qua các unit giống gateway bổ sung không hoạt động và không phải legacy trong quá trình quét service trùng lặp để các tệp service đồng hành không tạo nhiễu dọn dẹp.
    - Nếu xác thực token yêu cầu một token và `gateway.auth.token` do SecretRef quản lý, cài đặt/sửa chữa service của doctor xác thực SecretRef nhưng không lưu các giá trị token văn bản thuần đã phân giải vào siêu dữ liệu môi trường service supervisor.
    - Doctor phát hiện các giá trị môi trường service do `.env` được quản lý/SecretRef hậu thuẫn mà các cài đặt LaunchAgent, systemd hoặc Windows Scheduled Task cũ đã nhúng inline, rồi ghi lại siêu dữ liệu service để các giá trị đó được tải từ nguồn runtime thay vì định nghĩa supervisor.
    - Doctor phát hiện khi lệnh service vẫn ghim `--port` cũ sau khi `gateway.port` thay đổi và ghi lại siêu dữ liệu service sang cổng hiện tại.
    - Nếu xác thực token yêu cầu một token và SecretRef token đã cấu hình chưa được phân giải, doctor chặn đường dẫn cài đặt/sửa chữa kèm hướng dẫn có thể hành động.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, doctor chặn cài đặt/sửa chữa cho đến khi mode được đặt rõ ràng.
    - Với các unit user-systemd trên Linux, kiểm tra trôi lệch token của doctor hiện bao gồm cả nguồn `Environment=` và `EnvironmentFile=` khi so sánh siêu dữ liệu xác thực service.
    - Sửa chữa service của doctor từ chối ghi lại, dừng hoặc khởi động lại service gateway từ binary OpenClaw cũ hơn khi cấu hình được ghi lần cuối bởi phiên bản mới hơn. Xem [Xử lý sự cố Gateway](/vi/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Bạn luôn có thể ép ghi lại toàn bộ qua `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Runtime Gateway + chẩn đoán cổng">
    Doctor kiểm tra runtime service (PID, trạng thái thoát gần nhất) và cảnh báo khi service đã được cài đặt nhưng thực tế không chạy. Nó cũng kiểm tra xung đột cổng trên cổng gateway (mặc định `18789`) và báo cáo các nguyên nhân có khả năng xảy ra (gateway đã chạy, đường hầm SSH).
  </Accordion>
  <Accordion title="17. Thực hành tốt nhất cho runtime Gateway">
    Doctor cảnh báo khi service gateway chạy trên Bun hoặc đường dẫn Node do trình quản lý phiên bản quản lý (`nvm`, `fnm`, `volta`, `asdf`, v.v.). Các kênh WhatsApp + Telegram yêu cầu Node, và đường dẫn trình quản lý phiên bản có thể hỏng sau khi nâng cấp vì service không tải phần khởi tạo shell của bạn. Doctor đề xuất di chuyển sang bản cài đặt Node hệ thống khi có sẵn (Homebrew/apt/choco).

    Các LaunchAgent macOS mới được cài đặt hoặc sửa chữa dùng PATH hệ thống chuẩn (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) thay vì sao chép PATH của shell tương tác, nên các binary hệ thống do Homebrew quản lý vẫn khả dụng trong khi Volta, asdf, fnm, pnpm và các thư mục trình quản lý phiên bản khác không thay đổi Node mà các tiến trình con phân giải. Các service Linux vẫn giữ các gốc môi trường rõ ràng (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) và các thư mục user-bin ổn định, nhưng các thư mục dự phòng trình quản lý phiên bản được đoán chỉ được ghi vào PATH service khi các thư mục đó tồn tại trên đĩa.

  </Accordion>
  <Accordion title="18. Ghi cấu hình + siêu dữ liệu wizard">
    Doctor lưu mọi thay đổi cấu hình và đóng dấu siêu dữ liệu wizard để ghi nhận lần chạy doctor.
  </Accordion>
  <Accordion title="19. Mẹo workspace (sao lưu + hệ thống bộ nhớ)">
    Doctor đề xuất một hệ thống bộ nhớ workspace khi thiếu và in mẹo sao lưu nếu workspace chưa nằm trong git.

    Xem [/concepts/agent-workspace](/vi/concepts/agent-workspace) để biết hướng dẫn đầy đủ về cấu trúc workspace và sao lưu git (khuyến nghị GitHub hoặc GitLab riêng tư).

  </Accordion>
</AccordionGroup>

## Liên quan

- [Runbook Gateway](/vi/gateway)
- [Xử lý sự cố Gateway](/vi/gateway/troubleshooting)
