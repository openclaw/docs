---
read_when:
    - Thêm hoặc sửa đổi các bản di trú của doctor
    - Giới thiệu các thay đổi cấu hình phá vỡ tương thích
sidebarTitle: Doctor
summary: 'Lệnh doctor: kiểm tra tình trạng, di trú cấu hình và các bước sửa chữa'
title: Trình chẩn đoán
x-i18n:
    generated_at: "2026-05-11T20:29:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4994177bb3a3751211437403becc1c68c7f07fa52a72b84c9d129c7922705522
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` là công cụ sửa chữa + di chuyển dữ liệu cho OpenClaw. Công cụ này sửa cấu hình/trạng thái cũ, kiểm tra tình trạng hoạt động và cung cấp các bước sửa chữa có thể thực hiện.

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

    Chấp nhận các mặc định mà không hỏi (bao gồm các bước sửa chữa khởi động lại/dịch vụ/sandbox khi áp dụng).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Áp dụng các sửa chữa được khuyến nghị mà không hỏi (sửa chữa + khởi động lại khi an toàn).

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

    Chạy không có lời nhắc và chỉ áp dụng các di chuyển an toàn (chuẩn hóa cấu hình + di chuyển trạng thái trên đĩa). Bỏ qua các hành động khởi động lại/dịch vụ/sandbox cần xác nhận của con người. Các di chuyển trạng thái cũ tự động chạy khi được phát hiện.

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
  <Accordion title="Tình trạng hoạt động, UI và cập nhật">
    - Cập nhật kiểm tra trước tùy chọn cho các bản cài đặt git (chỉ tương tác).
    - Kiểm tra độ mới của giao thức UI (dựng lại Control UI khi schema giao thức mới hơn).
    - Kiểm tra tình trạng hoạt động + lời nhắc khởi động lại.
    - Tóm tắt trạng thái Skills (đủ điều kiện/thiếu/bị chặn) và trạng thái plugin.

  </Accordion>
  <Accordion title="Cấu hình và di chuyển">
    - Chuẩn hóa cấu hình cho các giá trị cũ.
    - Di chuyển cấu hình Talk từ các trường phẳng `talk.*` cũ sang `talk.provider` + `talk.providers.<provider>`.
    - Kiểm tra di chuyển trình duyệt cho cấu hình Chrome extension cũ và mức sẵn sàng của Chrome MCP.
    - Cảnh báo ghi đè nhà cung cấp OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Cảnh báo che khuất OAuth Codex (`models.providers.openai-codex`).
    - Kiểm tra điều kiện tiên quyết OAuth TLS cho hồ sơ OpenAI Codex OAuth.
    - Cảnh báo danh sách cho phép Plugin/công cụ khi `plugins.allow` có tính hạn chế nhưng chính sách công cụ vẫn yêu cầu ký tự đại diện hoặc công cụ do plugin sở hữu.
    - Di chuyển trạng thái cũ trên đĩa (sessions/thư mục agent/xác thực WhatsApp).
    - Di chuyển khóa hợp đồng manifest plugin cũ (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Di chuyển kho cron cũ (`jobId`, `schedule.cron`, các trường delivery/payload cấp cao nhất, payload `provider`, tác vụ webhook dự phòng `notify: true` đơn giản).
    - Dọn dẹp runtime-policy toàn agent cũ; chính sách runtime provider/model là bộ chọn tuyến đang hoạt động.
    - Dọn dẹp cấu hình plugin cũ khi plugin được bật; khi `plugins.enabled=false`, tham chiếu plugin cũ được xem là cấu hình ngăn chứa bất hoạt và được giữ nguyên.

  </Accordion>
  <Accordion title="Trạng thái và tính toàn vẹn">
    - Kiểm tra tệp khóa phiên và dọn dẹp khóa cũ.
    - Sửa transcript phiên cho các nhánh ghi lại lời nhắc bị trùng lặp do các bản dựng 2026.4.24 bị ảnh hưởng tạo ra.
    - Phát hiện tombstone khôi phục-khởi động lại subagent bị kẹt, có hỗ trợ `--fix` để xóa các cờ khôi phục đã hủy cũ nhằm tránh startup tiếp tục xem tiến trình con là đã hủy khởi động lại.
    - Kiểm tra tính toàn vẹn trạng thái và quyền (sessions, transcripts, thư mục trạng thái).
    - Kiểm tra quyền tệp cấu hình (chmod 600) khi chạy cục bộ.
    - Tình trạng xác thực model: kiểm tra hết hạn OAuth, có thể làm mới token sắp hết hạn và báo cáo trạng thái cooldown/bị tắt của auth-profile.
    - Phát hiện thư mục workspace bổ sung (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, dịch vụ và supervisor">
    - Sửa image sandbox khi sandboxing được bật.
    - Di chuyển dịch vụ cũ và phát hiện gateway bổ sung.
    - Di chuyển trạng thái cũ của kênh Matrix (trong chế độ `--fix` / `--repair`).
    - Kiểm tra runtime Gateway (dịch vụ đã cài nhưng không chạy; nhãn launchd được lưu trong cache).
    - Cảnh báo trạng thái kênh (được thăm dò từ gateway đang chạy).
    - Kiểm tra quyền theo từng kênh nằm dưới `openclaw channels capabilities`; ví dụ, quyền kênh thoại Discord được kiểm tra bằng `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Kiểm tra khả năng phản hồi của WhatsApp khi tình trạng event-loop Gateway suy giảm trong lúc các client TUI cục bộ vẫn đang chạy; `--fix` chỉ dừng các client TUI cục bộ đã xác minh.
    - Sửa tuyến Codex cho các model ref `openai-codex/*` cũ trong model chính, fallback, ghi đè heartbeat/subagent/compaction, hook, ghi đè model theo kênh và ghim tuyến phiên; `--fix` ghi lại chúng thành `openai/*`, xóa các ghim runtime phiên/toàn agent cũ và giữ các ref agent OpenAI chính tắc trên harness Codex mặc định.
    - Kiểm tra cấu hình supervisor (launchd/systemd/schtasks) với tùy chọn sửa chữa.
    - Dọn dẹp môi trường proxy nhúng cho các dịch vụ gateway đã ghi lại giá trị shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` trong quá trình cài đặt hoặc cập nhật.
    - Kiểm tra thông lệ runtime Gateway tốt nhất (Node so với Bun, đường dẫn trình quản lý phiên bản).
    - Chẩn đoán xung đột cổng Gateway (mặc định `18789`).

  </Accordion>
  <Accordion title="Xác thực, bảo mật và ghép đôi">
    - Cảnh báo bảo mật cho chính sách DM mở.
    - Kiểm tra xác thực Gateway cho chế độ token cục bộ (đề xuất tạo token khi không có nguồn token; không ghi đè cấu hình token SecretRef).
    - Phát hiện sự cố ghép đôi thiết bị (yêu cầu ghép đôi lần đầu đang chờ, nâng cấp vai trò/phạm vi đang chờ, sai lệch cache token thiết bị cục bộ cũ và sai lệch xác thực bản ghi đã ghép đôi).

  </Accordion>
  <Accordion title="Workspace và shell">
    - Kiểm tra systemd linger trên Linux.
    - Kiểm tra kích thước tệp bootstrap workspace (cảnh báo bị cắt/gần giới hạn cho tệp ngữ cảnh).
    - Kiểm tra mức sẵn sàng của Skills cho agent mặc định; báo cáo các skill được phép nhưng thiếu binary, env, config hoặc yêu cầu OS, và `--fix` có thể tắt các skill không khả dụng trong `skills.entries`.
    - Kiểm tra trạng thái shell completion và tự động cài đặt/nâng cấp.
    - Kiểm tra mức sẵn sàng của nhà cung cấp embedding tìm kiếm bộ nhớ (model cục bộ, khóa API từ xa hoặc binary QMD).
    - Kiểm tra bản cài đặt từ nguồn (pnpm workspace không khớp, thiếu tài nguyên UI, thiếu binary tsx).
    - Ghi cấu hình đã cập nhật + metadata wizard.

  </Accordion>
</AccordionGroup>

## Điền bù và đặt lại Dreams UI

Cảnh Dreams trong Control UI bao gồm các hành động **Backfill**, **Reset** và **Clear Grounded** cho quy trình grounded dreaming. Các hành động này dùng các phương thức RPC kiểu gateway doctor, nhưng chúng **không** phải là một phần của sửa chữa/di chuyển `openclaw doctor` CLI.

Những việc chúng làm:

- **Backfill** quét các tệp `memory/YYYY-MM-DD.md` lịch sử trong workspace đang hoạt động, chạy lượt nhật ký grounded REM và ghi các mục điền bù có thể hoàn nguyên vào `DREAMS.md`.
- **Reset** chỉ xóa các mục nhật ký điền bù đã đánh dấu đó khỏi `DREAMS.md`.
- **Clear Grounded** chỉ xóa các mục ngắn hạn chỉ-grounded đã được đưa vào hàng chờ, đến từ phát lại lịch sử và chưa tích lũy recall trực tiếp hoặc hỗ trợ hằng ngày.

Những việc bản thân chúng **không** làm:

- chúng không chỉnh sửa `MEMORY.md`
- chúng không chạy toàn bộ di chuyển doctor
- chúng không tự động đưa các ứng viên grounded vào kho đề bạt ngắn hạn trực tiếp, trừ khi bạn chạy rõ ràng đường dẫn CLI đã đưa vào hàng chờ trước

Nếu bạn muốn phát lại lịch sử grounded ảnh hưởng đến lane đề bạt sâu thông thường, hãy dùng luồng CLI thay thế:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Lệnh đó đưa các ứng viên bền vững grounded vào kho dreaming ngắn hạn trong khi vẫn giữ `DREAMS.md` làm bề mặt xem xét.

## Hành vi chi tiết và lý do

<AccordionGroup>
  <Accordion title="0. Cập nhật tùy chọn (bản cài đặt git)">
    Nếu đây là một git checkout và doctor đang chạy tương tác, công cụ sẽ đề xuất cập nhật (fetch/rebase/build) trước khi chạy doctor.
  </Accordion>
  <Accordion title="1. Chuẩn hóa cấu hình">
    Nếu cấu hình chứa các dạng giá trị cũ (ví dụ `messages.ackReaction` không có ghi đè theo kênh), doctor chuẩn hóa chúng sang schema hiện tại.

    Điều đó bao gồm các trường phẳng Talk cũ. Cấu hình speech Talk công khai hiện tại là `talk.provider` + `talk.providers.<provider>`, và cấu hình realtime voice là `talk.realtime.*`. Doctor ghi lại các dạng `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` cũ vào bản đồ provider, và ghi lại các bộ chọn realtime cấp cao cũ (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) vào `talk.realtime`.

    Doctor cũng cảnh báo khi `plugins.allow` không rỗng và chính sách công cụ dùng
    ký tự đại diện hoặc các mục công cụ do plugin sở hữu. `tools.allow: ["*"]` chỉ khớp các công cụ
    từ plugin thực sự được tải; nó không bỏ qua danh sách cho phép plugin độc quyền.
    Doctor ghi `plugins.bundledDiscovery: "compat"` cho các cấu hình danh sách cho phép cũ
    đã được di chuyển để giữ nguyên hành vi nhà cung cấp đi kèm hiện có, rồi
    trỏ đến thiết lập `"allowlist"` nghiêm ngặt hơn.

  </Accordion>
  <Accordion title="2. Di chuyển khóa cấu hình cũ">
    Khi cấu hình chứa các khóa không còn được dùng, các lệnh khác sẽ từ chối chạy và yêu cầu bạn chạy `openclaw doctor`.

    Doctor sẽ:

    - Giải thích khóa cũ nào đã được tìm thấy.
    - Hiển thị di chuyển đã áp dụng.
    - Ghi lại `~/.openclaw/openclaw.json` với schema đã cập nhật.

    Startup Gateway từ chối các định dạng cấu hình cũ và yêu cầu bạn chạy `openclaw doctor --fix`; nó không ghi lại `openclaw.json` khi startup. Di chuyển kho tác vụ Cron cũng do `openclaw doctor --fix` xử lý.

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
    - bộ chọn Talk realtime cấp cao nhất cũ (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Đối với các kênh có `accounts` được đặt tên nhưng vẫn còn các giá trị kênh cấp cao nhất cho tài khoản đơn, hãy di chuyển các giá trị thuộc phạm vi tài khoản đó vào tài khoản được nâng cấp đã chọn cho kênh đó (`accounts.default` cho hầu hết kênh; Matrix có thể giữ một đích được đặt tên/mặc định khớp hiện có)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - xóa `agents.defaults.llm`; dùng `models.providers.<id>.timeoutSeconds` cho thời gian chờ nhà cung cấp/mô hình chậm
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - xóa `browser.relayBindHost` (thiết lập relay tiện ích mở rộng cũ)
    - `models.providers.*.api: "openai"` cũ → `"openai-completions"` (khởi động gateway cũng bỏ qua các nhà cung cấp có `api` được đặt thành giá trị enum trong tương lai hoặc không xác định thay vì đóng lỗi)
    - xóa `plugins.entries.codex.config.codexDynamicToolsProfile`; máy chủ ứng dụng Codex luôn giữ các công cụ workspace gốc của Codex ở dạng gốc

    Cảnh báo của Doctor cũng bao gồm hướng dẫn tài khoản mặc định cho các kênh nhiều tài khoản:

    - Nếu hai hoặc nhiều mục `channels.<channel>.accounts` được cấu hình mà không có `channels.<channel>.defaultAccount` hoặc `accounts.default`, doctor cảnh báo rằng định tuyến dự phòng có thể chọn một tài khoản ngoài dự kiến.
    - Nếu `channels.<channel>.defaultAccount` được đặt thành ID tài khoản không xác định, doctor sẽ cảnh báo và liệt kê các ID tài khoản đã cấu hình.

  </Accordion>
  <Accordion title="2b. Ghi đè nhà cung cấp OpenCode">
    Nếu bạn đã thêm `models.providers.opencode`, `opencode-zen`, hoặc `opencode-go` theo cách thủ công, nó sẽ ghi đè danh mục OpenCode tích hợp sẵn từ `@earendil-works/pi-ai`. Điều đó có thể buộc mô hình dùng sai API hoặc đặt chi phí về 0. Doctor cảnh báo để bạn có thể xóa ghi đè và khôi phục định tuyến API + chi phí theo từng mô hình.
  </Accordion>
  <Accordion title="2c. Di trú trình duyệt và mức sẵn sàng của Chrome MCP">
    Nếu cấu hình trình duyệt của bạn vẫn trỏ tới đường dẫn tiện ích mở rộng Chrome đã bị xóa, doctor sẽ chuẩn hóa nó sang mô hình đính kèm Chrome MCP cục bộ trên máy chủ hiện tại:

    - `browser.profiles.*.driver: "extension"` trở thành `"existing-session"`
    - `browser.relayBindHost` bị xóa

    Doctor cũng kiểm tra đường dẫn Chrome MCP cục bộ trên máy chủ khi bạn dùng `defaultProfile: "user"` hoặc một hồ sơ `existing-session` đã cấu hình:

    - kiểm tra Google Chrome có được cài trên cùng máy chủ cho các hồ sơ tự động kết nối mặc định hay không
    - kiểm tra phiên bản Chrome phát hiện được và cảnh báo khi thấp hơn Chrome 144
    - nhắc bạn bật gỡ lỗi từ xa trong trang kiểm tra của trình duyệt (ví dụ `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, hoặc `edge://inspect/#remote-debugging`)

    Doctor không thể bật thiết lập phía Chrome thay bạn. Chrome MCP cục bộ trên máy chủ vẫn yêu cầu:

    - trình duyệt dựa trên Chromium 144+ trên máy chủ gateway/node
    - trình duyệt đang chạy cục bộ
    - đã bật gỡ lỗi từ xa trong trình duyệt đó
    - phê duyệt lời nhắc đồng ý đính kèm đầu tiên trong trình duyệt

    Mức sẵn sàng ở đây chỉ nói về các điều kiện tiên quyết để đính kèm cục bộ. Existing-session giữ các giới hạn tuyến Chrome MCP hiện tại; các tuyến nâng cao như `responsebody`, xuất PDF, chặn tải xuống, và hành động hàng loạt vẫn yêu cầu trình duyệt được quản lý hoặc hồ sơ CDP thô.

    Kiểm tra này **không** áp dụng cho Docker, sandbox, remote-browser, hoặc các luồng headless khác. Các luồng đó tiếp tục dùng CDP thô.

  </Accordion>
  <Accordion title="2d. Điều kiện tiên quyết OAuth TLS">
    Khi một hồ sơ OpenAI Codex OAuth được cấu hình, doctor thăm dò điểm cuối ủy quyền OpenAI để xác minh rằng ngăn xếp TLS Node/OpenSSL cục bộ có thể xác thực chuỗi chứng chỉ. Nếu thăm dò thất bại với lỗi chứng chỉ (ví dụ `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, chứng chỉ hết hạn, hoặc chứng chỉ tự ký), doctor in hướng dẫn sửa lỗi theo từng nền tảng. Trên macOS với Node từ Homebrew, cách sửa thường là `brew postinstall ca-certificates`. Với `--deep`, thăm dò vẫn chạy ngay cả khi gateway khỏe mạnh.
  </Accordion>
  <Accordion title="2e. Ghi đè nhà cung cấp Codex OAuth">
    Nếu trước đây bạn đã thêm thiết lập vận chuyển OpenAI cũ dưới `models.providers.openai-codex`, chúng có thể che khuất đường dẫn nhà cung cấp Codex OAuth tích hợp mà các bản phát hành mới tự động dùng. Doctor cảnh báo khi thấy các thiết lập vận chuyển cũ đó cùng với Codex OAuth để bạn có thể xóa hoặc viết lại ghi đè vận chuyển lỗi thời và lấy lại hành vi định tuyến/dự phòng tích hợp. Proxy tùy chỉnh và ghi đè chỉ header vẫn được hỗ trợ và không kích hoạt cảnh báo này.
  </Accordion>
  <Accordion title="2f. Sửa chữa tuyến Codex">
    Doctor kiểm tra các tham chiếu mô hình `openai-codex/*` cũ. Định tuyến harness Codex gốc dùng các tham chiếu mô hình chuẩn `openai/*`; các lượt tác tử OpenAI đi qua harness máy chủ ứng dụng Codex thay vì đường dẫn OpenAI PI của OpenClaw.

    Ở chế độ `--fix` / `--repair`, doctor viết lại các tham chiếu tác tử mặc định và theo từng tác tử bị ảnh hưởng, bao gồm mô hình chính, dự phòng, ghi đè heartbeat/subagent/compaction, hook, ghi đè mô hình kênh, và trạng thái tuyến phiên đã lưu lỗi thời:

    - `openai-codex/gpt-*` trở thành `openai/gpt-*`.
    - Ý định Codex được chuyển sang các mục `agentRuntime.id: "codex"` theo phạm vi nhà cung cấp/mô hình cho các tham chiếu mô hình tác tử đã sửa để hồ sơ auth `openai-codex:...` vẫn có thể được chọn sau khi tham chiếu mô hình trở thành `openai/*`.
    - Cấu hình runtime toàn tác tử cũ và các ghim runtime phiên đã lưu bị xóa vì lựa chọn runtime có phạm vi theo nhà cung cấp/mô hình.
    - Chính sách runtime nhà cung cấp/mô hình hiện có được giữ nguyên trừ khi tham chiếu mô hình cũ đã sửa cần định tuyến Codex để giữ đường dẫn auth cũ.
    - Các danh sách dự phòng mô hình hiện có được giữ nguyên với các mục cũ được viết lại; thiết lập theo mô hình đã sao chép được chuyển từ khóa cũ sang khóa chuẩn `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, thông báo dự phòng, và ghim hồ sơ auth của phiên đã lưu được sửa trên mọi kho phiên tác tử phát hiện được.
    - `/codex ...` nghĩa là "điều khiển hoặc liên kết một cuộc hội thoại Codex gốc từ chat."
    - `/acp ...` hoặc `runtime: "acp"` nghĩa là "dùng adapter ACP/acpx bên ngoài."

  </Accordion>
  <Accordion title="2g. Dọn dẹp tuyến phiên">
    Doctor cũng quét các kho phiên tác tử phát hiện được để tìm trạng thái tuyến tự tạo lỗi thời sau khi bạn chuyển mô hình đã cấu hình hoặc runtime khỏi một tuyến do plugin sở hữu, chẳng hạn như Codex.

    `openclaw doctor --fix` có thể xóa trạng thái lỗi thời tự tạo như ghim mô hình `modelOverrideSource: "auto"`, siêu dữ liệu mô hình runtime, ID harness đã ghim, liên kết phiên CLI, và ghi đè hồ sơ auth tự động khi tuyến sở hữu chúng không còn được cấu hình. Các lựa chọn mô hình phiên do người dùng chỉ định rõ ràng hoặc cũ được báo cáo để xem xét thủ công và được giữ nguyên; chuyển chúng bằng `/model ...`, `/new`, hoặc đặt lại phiên khi tuyến đó không còn được dự định dùng.

  </Accordion>
  <Accordion title="3. Di trú trạng thái cũ (bố cục đĩa)">
    Doctor có thể di trú các bố cục trên đĩa cũ sang cấu trúc hiện tại:

    - Kho phiên + bản ghi hội thoại:
      - từ `~/.openclaw/sessions/` sang `~/.openclaw/agents/<agentId>/sessions/`
    - Thư mục tác tử:
      - từ `~/.openclaw/agent/` sang `~/.openclaw/agents/<agentId>/agent/`
    - Trạng thái auth WhatsApp (Baileys):
      - từ `~/.openclaw/credentials/*.json` cũ (ngoại trừ `oauth.json`)
      - sang `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID tài khoản mặc định: `default`)

    Các di trú này là nỗ lực tối đa và có tính lũy đẳng; doctor sẽ phát cảnh báo khi để lại bất kỳ thư mục cũ nào làm bản sao lưu. Gateway/CLI cũng tự động di trú các phiên cũ + thư mục tác tử khi khởi động để lịch sử/auth/mô hình nằm trong đường dẫn theo từng tác tử mà không cần chạy doctor thủ công. Auth WhatsApp được chủ ý chỉ di trú qua `openclaw doctor`. Chuẩn hóa nhà cung cấp Talk/bản đồ nhà cung cấp hiện so sánh bằng bình đẳng cấu trúc, nên các khác biệt chỉ do thứ tự khóa không còn kích hoạt lặp lại các thay đổi `doctor --fix` không có tác dụng.

  </Accordion>
  <Accordion title="3a. Di trú manifest plugin cũ">
    Doctor quét mọi manifest plugin đã cài đặt để tìm các khóa năng lực cấp cao nhất đã lỗi thời (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Khi tìm thấy, nó đề nghị chuyển chúng vào đối tượng `contracts` và viết lại tệp manifest tại chỗ. Di trú này có tính lũy đẳng; nếu khóa `contracts` đã có cùng các giá trị, khóa cũ sẽ bị xóa mà không nhân đôi dữ liệu.
  </Accordion>
  <Accordion title="3b. Di trú kho cron cũ">
    Doctor cũng kiểm tra kho tác vụ cron (`~/.openclaw/cron/jobs.json` theo mặc định, hoặc `cron.store` khi được ghi đè) để tìm các dạng tác vụ cũ mà bộ lập lịch vẫn chấp nhận để tương thích.

    Các dọn dẹp cron hiện tại bao gồm:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - các trường payload cấp cao nhất (`message`, `model`, `thinking`, ...) → `payload`
    - các trường delivery cấp cao nhất (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - bí danh delivery `provider` của payload → `delivery.channel` tường minh
    - các tác vụ dự phòng webhook `notify: true` cũ đơn giản → `delivery.mode="webhook"` tường minh với `delivery.to=cron.webhook`

    Doctor chỉ tự động di chuyển các tác vụ `notify: true` khi có thể làm vậy mà không thay đổi hành vi. Nếu một tác vụ kết hợp dự phòng notify cũ với một chế độ delivery không phải webhook hiện có, doctor sẽ cảnh báo và để tác vụ đó lại để xem xét thủ công.

    Trên Linux, doctor cũng cảnh báo khi crontab của người dùng vẫn gọi `~/.openclaw/bin/ensure-whatsapp.sh` cũ. Tập lệnh cục bộ trên máy chủ đó không được OpenClaw hiện tại duy trì và có thể ghi thông báo `Gateway inactive` sai vào `~/.openclaw/logs/whatsapp-health.log` khi cron không thể truy cập bus người dùng systemd. Xóa mục crontab cũ bằng `crontab -e`; dùng `openclaw channels status --probe`, `openclaw doctor`, và `openclaw gateway status` cho các kiểm tra tình trạng hiện tại.

  </Accordion>
  <Accordion title="3c. Dọn dẹp khóa phiên">
    Doctor quét mọi thư mục phiên agent để tìm các tệp khóa ghi cũ — các tệp còn sót lại khi một phiên thoát bất thường. Với mỗi tệp khóa tìm thấy, nó báo cáo: đường dẫn, PID, PID còn sống hay không, tuổi khóa, và khóa có được xem là cũ hay không (PID đã chết, cũ hơn 30 phút, hoặc một PID đang sống có thể được chứng minh là thuộc về một tiến trình không phải OpenClaw). Ở chế độ `--fix` / `--repair`, nó tự động xóa các tệp khóa cũ; nếu không, nó in ghi chú và hướng dẫn bạn chạy lại với `--fix`.
  </Accordion>
  <Accordion title="3d. Sửa nhánh bản ghi phiên">
    Doctor quét các tệp JSONL phiên agent để tìm dạng nhánh bị trùng lặp do lỗi viết lại bản ghi prompt ngày 2026.4.24 tạo ra: một lượt người dùng bị bỏ lại với ngữ cảnh runtime nội bộ OpenClaw cùng một nhánh anh em đang hoạt động chứa cùng prompt người dùng hiển thị. Ở chế độ `--fix` / `--repair`, doctor sao lưu từng tệp bị ảnh hưởng cạnh tệp gốc và viết lại bản ghi sang nhánh đang hoạt động để lịch sử Gateway và các trình đọc bộ nhớ không còn thấy các lượt trùng lặp.
  </Accordion>
  <Accordion title="4. Kiểm tra toàn vẹn trạng thái (duy trì phiên, định tuyến và an toàn)">
    Thư mục trạng thái là trục vận hành cốt lõi. Nếu nó biến mất, bạn sẽ mất phiên, thông tin xác thực, nhật ký và cấu hình (trừ khi bạn có bản sao lưu ở nơi khác).

    Doctor kiểm tra:

    - **Thiếu thư mục trạng thái**: cảnh báo về mất trạng thái nghiêm trọng, nhắc tạo lại thư mục, và nhắc rằng nó không thể khôi phục dữ liệu bị thiếu.
    - **Quyền thư mục trạng thái**: xác minh khả năng ghi; đề nghị sửa quyền (và phát gợi ý `chown` khi phát hiện chủ sở hữu/nhóm không khớp).
    - **Thư mục trạng thái đồng bộ đám mây trên macOS**: cảnh báo khi trạng thái phân giải dưới iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) hoặc `~/Library/CloudStorage/...` vì các đường dẫn được đồng bộ có thể gây I/O chậm hơn và các cuộc đua khóa/đồng bộ.
    - **Thư mục trạng thái SD hoặc eMMC trên Linux**: cảnh báo khi trạng thái phân giải tới nguồn gắn kết `mmcblk*`, vì I/O ngẫu nhiên dựa trên SD hoặc eMMC có thể chậm hơn và hao mòn nhanh hơn khi ghi phiên và thông tin xác thực.
    - **Thiếu thư mục phiên**: `sessions/` và thư mục kho phiên là bắt buộc để duy trì lịch sử và tránh lỗi `ENOENT`.
    - **Không khớp bản ghi**: cảnh báo khi các mục phiên gần đây thiếu tệp bản ghi.
    - **Phiên chính "JSONL 1 dòng"**: gắn cờ khi bản ghi chính chỉ có một dòng (lịch sử không được tích lũy).
    - **Nhiều thư mục trạng thái**: cảnh báo khi có nhiều thư mục `~/.openclaw` tồn tại trên các thư mục home hoặc khi `OPENCLAW_STATE_DIR` trỏ tới nơi khác (lịch sử có thể bị chia giữa các bản cài đặt).
    - **Nhắc nhở chế độ từ xa**: nếu `gateway.mode=remote`, doctor nhắc bạn chạy nó trên máy chủ từ xa (trạng thái nằm ở đó).
    - **Quyền tệp cấu hình**: cảnh báo nếu `~/.openclaw/openclaw.json` có thể đọc bởi nhóm/toàn thế giới và đề nghị siết lại thành `600`.

  </Accordion>
  <Accordion title="5. Tình trạng xác thực mô hình (hết hạn OAuth)">
    Doctor kiểm tra các hồ sơ OAuth trong kho xác thực, cảnh báo khi token sắp hết hạn/đã hết hạn, và có thể làm mới chúng khi an toàn. Nếu hồ sơ OAuth/token Anthropic đã cũ, nó gợi ý khóa API Anthropic hoặc đường dẫn setup-token Anthropic. Lời nhắc làm mới chỉ xuất hiện khi chạy tương tác (TTY); `--non-interactive` bỏ qua các lần thử làm mới.

    Khi làm mới OAuth thất bại vĩnh viễn (ví dụ `refresh_token_reused`, `invalid_grant`, hoặc nhà cung cấp yêu cầu bạn đăng nhập lại), doctor báo rằng cần xác thực lại và in chính xác lệnh `openclaw models auth login --provider ...` cần chạy.

    Doctor cũng báo cáo các hồ sơ xác thực tạm thời không dùng được do:

    - thời gian chờ ngắn (giới hạn tốc độ/hết thời gian chờ/lỗi xác thực)
    - vô hiệu hóa lâu hơn (lỗi thanh toán/tín dụng)

  </Accordion>
  <Accordion title="6. Xác thực mô hình hooks">
    Nếu `hooks.gmail.model` được đặt, doctor xác thực tham chiếu mô hình theo danh mục và danh sách cho phép, đồng thời cảnh báo khi nó không phân giải được hoặc không được phép.
  </Accordion>
  <Accordion title="7. Sửa image sandbox">
    Khi sandboxing được bật, doctor kiểm tra image Docker và đề nghị build hoặc chuyển sang tên cũ nếu thiếu image hiện tại.
  </Accordion>
  <Accordion title="7b. Dọn dẹp cài đặt Plugin">
    Doctor xóa trạng thái staging phụ thuộc Plugin cũ do OpenClaw tạo ra ở chế độ `openclaw doctor --fix` / `openclaw doctor --repair`. Phần này bao gồm các gốc phụ thuộc đã tạo cũ, thư mục giai đoạn cài đặt cũ, phần thừa cục bộ theo gói từ mã sửa phụ thuộc bundled-plugin trước đây, và các bản sao npm được quản lý bị mồ côi hoặc khôi phục của các Plugin `@openclaw/*` được đóng gói có thể che khuất manifest đóng gói hiện tại.

    Doctor cũng có thể cài đặt lại các Plugin có thể tải xuống bị thiếu khi cấu hình tham chiếu chúng nhưng registry Plugin cục bộ không tìm thấy. Ví dụ bao gồm `plugins.entries` thực tế, thiết lập kênh/nhà cung cấp/tìm kiếm đã cấu hình, và runtime agent đã cấu hình. Trong quá trình cập nhật gói, doctor tránh chạy sửa Plugin bằng package-manager khi gói lõi đang được thay thế; chạy lại `openclaw doctor --fix` sau khi cập nhật nếu một Plugin đã cấu hình vẫn cần khôi phục. Khởi động Gateway và tải lại cấu hình không chạy package manager; cài đặt Plugin vẫn là công việc doctor/install/update tường minh.

  </Accordion>
  <Accordion title="8. Di chuyển dịch vụ Gateway và gợi ý dọn dẹp">
    Doctor phát hiện các dịch vụ Gateway cũ (launchd/systemd/schtasks) và đề nghị xóa chúng rồi cài đặt dịch vụ OpenClaw bằng cổng Gateway hiện tại. Nó cũng có thể quét các dịch vụ giống Gateway bổ sung và in gợi ý dọn dẹp. Các dịch vụ Gateway OpenClaw có tên hồ sơ được xem là hạng nhất và không bị gắn cờ là "bổ sung."

    Trên Linux, nếu thiếu dịch vụ Gateway cấp người dùng nhưng có dịch vụ Gateway OpenClaw cấp hệ thống, doctor không tự động cài đặt dịch vụ cấp người dùng thứ hai. Kiểm tra bằng `openclaw gateway status --deep` hoặc `openclaw doctor --deep`, rồi xóa bản trùng lặp hoặc đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một trình giám sát hệ thống sở hữu vòng đời Gateway.

  </Accordion>
  <Accordion title="8b. Di chuyển Startup Matrix">
    Khi tài khoản kênh Matrix có một di chuyển trạng thái cũ đang chờ hoặc có thể thực hiện, doctor (ở chế độ `--fix` / `--repair`) tạo ảnh chụp trước di chuyển rồi chạy các bước di chuyển nỗ lực tối đa: di chuyển trạng thái Matrix cũ và chuẩn bị trạng thái mã hóa cũ. Cả hai bước đều không gây lỗi nghiêm trọng; lỗi được ghi nhật ký và quá trình khởi động tiếp tục. Ở chế độ chỉ đọc (`openclaw doctor` không có `--fix`), kiểm tra này bị bỏ qua hoàn toàn.
  </Accordion>
  <Accordion title="8c. Ghép nối thiết bị và lệch xác thực">
    Doctor hiện kiểm tra trạng thái ghép nối thiết bị như một phần của lượt kiểm tra tình trạng thông thường.

    Nội dung nó báo cáo:

    - yêu cầu ghép nối lần đầu đang chờ
    - nâng cấp vai trò đang chờ cho các thiết bị đã ghép nối
    - nâng cấp phạm vi đang chờ cho các thiết bị đã ghép nối
    - sửa lỗi không khớp khóa công khai khi id thiết bị vẫn khớp nhưng danh tính thiết bị không còn khớp bản ghi đã phê duyệt
    - bản ghi đã ghép nối thiếu token hoạt động cho một vai trò đã phê duyệt
    - token đã ghép nối có phạm vi lệch khỏi baseline ghép nối đã phê duyệt
    - mục device-token được lưu trong bộ nhớ đệm cục bộ cho máy hiện tại có từ trước một lần xoay vòng token phía Gateway hoặc mang metadata phạm vi đã cũ

    Doctor không tự động phê duyệt yêu cầu ghép nối hoặc tự động xoay vòng token thiết bị. Thay vào đó, nó in chính xác các bước tiếp theo:

    - kiểm tra yêu cầu đang chờ bằng `openclaw devices list`
    - phê duyệt đúng yêu cầu bằng `openclaw devices approve <requestId>`
    - xoay vòng token mới bằng `openclaw devices rotate --device <deviceId> --role <role>`
    - xóa và phê duyệt lại bản ghi cũ bằng `openclaw devices remove <deviceId>`

    Điều này đóng lỗ hổng phổ biến "đã ghép nối nhưng vẫn nhận yêu cầu ghép nối": doctor giờ phân biệt ghép nối lần đầu với nâng cấp vai trò/phạm vi đang chờ và với lệch token/danh tính thiết bị đã cũ.

  </Accordion>
  <Accordion title="9. Cảnh báo bảo mật">
    Doctor phát cảnh báo khi một nhà cung cấp mở cho DM mà không có danh sách cho phép, hoặc khi một chính sách được cấu hình theo cách nguy hiểm.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Nếu đang chạy như một dịch vụ người dùng systemd, doctor đảm bảo lingering được bật để gateway tiếp tục sống sau khi đăng xuất.
  </Accordion>
  <Accordion title="11. Trạng thái workspace (skills, plugins và thư mục cũ)">
    Doctor in tóm tắt trạng thái workspace cho agent mặc định:

    - **Trạng thái Skills**: đếm các skill đủ điều kiện, thiếu yêu cầu, và bị danh sách cho phép chặn.
    - **Thư mục workspace cũ**: cảnh báo khi `~/openclaw` hoặc các thư mục workspace cũ khác tồn tại cùng workspace hiện tại.
    - **Trạng thái Plugin**: đếm Plugin đã bật/đã tắt/bị lỗi; liệt kê ID Plugin cho mọi lỗi; báo cáo capability của Plugin đóng gói.
    - **Cảnh báo tương thích Plugin**: gắn cờ các Plugin có vấn đề tương thích với runtime hiện tại.
    - **Chẩn đoán Plugin**: hiển thị mọi cảnh báo hoặc lỗi lúc tải do registry Plugin phát ra.

  </Accordion>
  <Accordion title="11b. Kích thước tệp bootstrap">
    Doctor kiểm tra liệu các tệp bootstrap workspace (ví dụ `AGENTS.md`, `CLAUDE.md`, hoặc các tệp ngữ cảnh được chèn khác) có gần hoặc vượt ngân sách ký tự đã cấu hình hay không. Nó báo cáo số ký tự thô so với đã chèn theo từng tệp, phần trăm cắt ngắn, nguyên nhân cắt ngắn (`max/file` hoặc `max/total`), và tổng số ký tự đã chèn dưới dạng tỷ lệ của tổng ngân sách. Khi tệp bị cắt ngắn hoặc gần giới hạn, doctor in mẹo điều chỉnh `agents.defaults.bootstrapMaxChars` và `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Dọn dẹp Plugin kênh cũ">
    Khi `openclaw doctor --fix` xóa một Plugin kênh bị thiếu, nó cũng xóa cấu hình rời rạc theo phạm vi kênh đã tham chiếu Plugin đó: các mục `channels.<id>`, mục tiêu Heartbeat đã nêu tên kênh, và các ghi đè `agents.*.models["<channel>/*"]`. Điều này ngăn vòng lặp khởi động Gateway khi runtime kênh đã biến mất nhưng cấu hình vẫn yêu cầu gateway bind vào nó.
  </Accordion>
  <Accordion title="11c. Hoàn thành shell">
    Doctor kiểm tra liệu hoàn thành tab đã được cài đặt cho shell hiện tại hay chưa (zsh, bash, fish, hoặc PowerShell):

    - Nếu hồ sơ shell dùng mẫu hoàn thành động chậm (`source <(openclaw completion ...)`), doctor nâng cấp nó lên biến thể tệp được lưu trong bộ nhớ đệm nhanh hơn.
    - Nếu hoàn thành được cấu hình trong hồ sơ nhưng thiếu tệp bộ nhớ đệm, doctor tự động tạo lại bộ nhớ đệm.
    - Nếu chưa có hoàn thành nào được cấu hình, doctor nhắc cài đặt nó (chỉ chế độ tương tác; bỏ qua với `--non-interactive`).

    Chạy `openclaw completion --write-state` để tạo lại bộ nhớ đệm theo cách thủ công.

  </Accordion>
  <Accordion title="12. Kiểm tra xác thực Gateway (mã thông báo cục bộ)">
    Doctor kiểm tra mức độ sẵn sàng của xác thực bằng mã thông báo Gateway cục bộ.

    - Nếu chế độ mã thông báo cần mã thông báo và không có nguồn mã thông báo nào tồn tại, doctor đề nghị tạo một mã thông báo.
    - Nếu `gateway.auth.token` được quản lý bằng SecretRef nhưng không khả dụng, doctor cảnh báo và không ghi đè nó bằng văn bản thuần.
    - `openclaw doctor --generate-gateway-token` chỉ buộc tạo khi không có SecretRef mã thông báo nào được cấu hình.

  </Accordion>
  <Accordion title="12b. Sửa chữa nhận biết SecretRef chỉ đọc">
    Một số luồng sửa chữa cần kiểm tra thông tin xác thực đã cấu hình mà không làm suy yếu hành vi lỗi nhanh của runtime.

    - `openclaw doctor --fix` hiện dùng cùng mô hình tóm tắt SecretRef chỉ đọc như các lệnh họ trạng thái cho những sửa chữa cấu hình có mục tiêu.
    - Ví dụ: sửa chữa Telegram `allowFrom` / `groupAllowFrom` `@username` cố dùng thông tin xác thực bot đã cấu hình khi có sẵn.
    - Nếu mã thông báo bot Telegram được cấu hình qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại, doctor báo cáo rằng thông tin xác thực đã được cấu hình nhưng không khả dụng và bỏ qua tự động phân giải thay vì bị lỗi hoặc báo sai rằng mã thông báo bị thiếu.

  </Accordion>
  <Accordion title="13. Kiểm tra sức khỏe Gateway + khởi động lại">
    Doctor chạy kiểm tra sức khỏe và đề nghị khởi động lại Gateway khi có vẻ không khỏe.
  </Accordion>
  <Accordion title="13b. Mức độ sẵn sàng của tìm kiếm bộ nhớ">
    Doctor kiểm tra xem nhà cung cấp embedding cho tìm kiếm bộ nhớ đã cấu hình có sẵn sàng cho tác tử mặc định hay không. Hành vi phụ thuộc vào backend và nhà cung cấp đã cấu hình:

    - **Backend QMD**: thăm dò xem binary `qmd` có khả dụng và có thể khởi động hay không. Nếu không, in hướng dẫn sửa lỗi bao gồm gói npm và tùy chọn đường dẫn binary thủ công.
    - **Nhà cung cấp cục bộ rõ ràng**: kiểm tra tệp mô hình cục bộ hoặc URL mô hình từ xa/có thể tải xuống được nhận diện. Nếu thiếu, đề xuất chuyển sang nhà cung cấp từ xa.
    - **Nhà cung cấp từ xa rõ ràng** (`openai`, `voyage`, v.v.): xác minh khóa API có trong môi trường hoặc kho xác thực. In gợi ý sửa lỗi có thể hành động nếu thiếu.
    - **Nhà cung cấp tự động**: kiểm tra tính khả dụng của mô hình cục bộ trước, sau đó thử từng nhà cung cấp từ xa theo thứ tự tự động chọn.

    Khi có kết quả thăm dò Gateway trong bộ nhớ đệm (Gateway khỏe tại thời điểm kiểm tra), doctor đối chiếu kết quả đó với cấu hình mà CLI thấy được và ghi chú mọi khác biệt. Doctor không bắt đầu ping embedding mới trên đường dẫn mặc định; hãy dùng lệnh trạng thái bộ nhớ sâu khi bạn muốn kiểm tra nhà cung cấp trực tiếp.

    Dùng `openclaw memory status --deep` để xác minh mức độ sẵn sàng của embedding tại runtime.

  </Accordion>
  <Accordion title="14. Cảnh báo trạng thái kênh">
    Nếu Gateway khỏe, doctor chạy thăm dò trạng thái kênh và báo cáo cảnh báo kèm bản sửa được đề xuất.
  </Accordion>
  <Accordion title="15. Kiểm tra + sửa chữa cấu hình supervisor">
    Doctor kiểm tra cấu hình supervisor đã cài đặt (launchd/systemd/schtasks) để tìm các mặc định bị thiếu hoặc lỗi thời (ví dụ: phụ thuộc network-online của systemd và độ trễ khởi động lại). Khi tìm thấy sai khác, nó khuyến nghị cập nhật và có thể ghi lại tệp service/tác vụ theo mặc định hiện tại.

    Ghi chú:

    - `openclaw doctor` nhắc trước khi ghi lại cấu hình supervisor.
    - `openclaw doctor --yes` chấp nhận các lời nhắc sửa chữa mặc định.
    - `openclaw doctor --repair` áp dụng các bản sửa được khuyến nghị mà không nhắc.
    - `openclaw doctor --repair --force` ghi đè cấu hình supervisor tùy chỉnh.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` giữ doctor ở chế độ chỉ đọc cho vòng đời service Gateway. Nó vẫn báo cáo sức khỏe service và chạy các sửa chữa không thuộc service, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap service, ghi lại cấu hình supervisor và dọn dẹp service cũ vì một supervisor bên ngoài sở hữu vòng đời đó.
    - Trên Linux, doctor không ghi lại siêu dữ liệu lệnh/entrypoint khi unit Gateway systemd khớp đang hoạt động. Nó cũng bỏ qua các unit phụ giống Gateway không phải legacy và đang không hoạt động trong quá trình quét service trùng lặp để các tệp service đi kèm không tạo nhiễu dọn dẹp.
    - Nếu xác thực bằng mã thông báo yêu cầu mã thông báo và `gateway.auth.token` được quản lý bằng SecretRef, cài đặt/sửa chữa service của doctor xác thực SecretRef nhưng không lưu các giá trị mã thông báo văn bản thuần đã phân giải vào siêu dữ liệu môi trường service supervisor.
    - Doctor phát hiện các giá trị môi trường service do `.env` được quản lý/SecretRef hỗ trợ mà các bản cài đặt LaunchAgent, systemd hoặc Windows Scheduled Task cũ đã nhúng inline và ghi lại siêu dữ liệu service để các giá trị đó tải từ nguồn runtime thay vì định nghĩa supervisor.
    - Doctor phát hiện khi lệnh service vẫn ghim `--port` cũ sau khi `gateway.port` thay đổi và ghi lại siêu dữ liệu service sang cổng hiện tại.
    - Nếu xác thực bằng mã thông báo yêu cầu mã thông báo và SecretRef mã thông báo đã cấu hình chưa được phân giải, doctor chặn đường dẫn cài đặt/sửa chữa với hướng dẫn có thể hành động.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, doctor chặn cài đặt/sửa chữa cho đến khi chế độ được đặt rõ ràng.
    - Đối với các unit user-systemd trên Linux, kiểm tra sai lệch mã thông báo của doctor hiện bao gồm cả nguồn `Environment=` và `EnvironmentFile=` khi so sánh siêu dữ liệu xác thực service.
    - Các sửa chữa service của doctor từ chối ghi lại, dừng hoặc khởi động lại service Gateway từ binary OpenClaw cũ hơn khi cấu hình được ghi lần cuối bởi phiên bản mới hơn. Xem [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Bạn luôn có thể buộc ghi lại đầy đủ qua `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Chẩn đoán runtime + cổng Gateway">
    Doctor kiểm tra runtime của service (PID, trạng thái thoát gần nhất) và cảnh báo khi service đã được cài đặt nhưng thực tế không chạy. Nó cũng kiểm tra xung đột cổng trên cổng Gateway (mặc định `18789`) và báo cáo các nguyên nhân có khả năng (Gateway đã chạy, đường hầm SSH).
  </Accordion>
  <Accordion title="17. Thực hành tốt nhất cho runtime Gateway">
    Doctor cảnh báo khi service Gateway chạy trên Bun hoặc đường dẫn Node do trình quản lý phiên bản quản lý (`nvm`, `fnm`, `volta`, `asdf`, v.v.). Các kênh WhatsApp + Telegram yêu cầu Node, và đường dẫn của trình quản lý phiên bản có thể hỏng sau khi nâng cấp vì service không tải khởi tạo shell của bạn. Doctor đề nghị di chuyển sang bản cài đặt Node hệ thống khi có sẵn (Homebrew/apt/choco).

    Các macOS LaunchAgent mới cài đặt hoặc đã sửa chữa dùng PATH hệ thống chuẩn (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) thay vì sao chép PATH của shell tương tác, nên các binary hệ thống do Homebrew quản lý vẫn khả dụng trong khi Volta, asdf, fnm, pnpm và các thư mục trình quản lý phiên bản khác không thay đổi Node mà các tiến trình con phân giải. Các service Linux vẫn giữ các gốc môi trường rõ ràng (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) và các thư mục user-bin ổn định, nhưng các thư mục dự phòng trình quản lý phiên bản được phỏng đoán chỉ được ghi vào PATH của service khi các thư mục đó tồn tại trên đĩa.

  </Accordion>
  <Accordion title="18. Ghi cấu hình + siêu dữ liệu wizard">
    Doctor lưu mọi thay đổi cấu hình và đóng dấu siêu dữ liệu wizard để ghi lại lần chạy doctor.
  </Accordion>
  <Accordion title="19. Mẹo không gian làm việc (sao lưu + hệ thống bộ nhớ)">
    Doctor đề xuất một hệ thống bộ nhớ không gian làm việc khi bị thiếu và in mẹo sao lưu nếu không gian làm việc chưa nằm trong git.

    Xem [/concepts/agent-workspace](/vi/concepts/agent-workspace) để có hướng dẫn đầy đủ về cấu trúc không gian làm việc và sao lưu git (khuyến nghị GitHub hoặc GitLab riêng tư).

  </Accordion>
</AccordionGroup>

## Liên quan

- [Runbook Gateway](/vi/gateway)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
