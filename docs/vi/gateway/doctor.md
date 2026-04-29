---
read_when:
    - Thêm hoặc sửa đổi các bản di trú của doctor
    - Giới thiệu các thay đổi cấu hình phá vỡ tương thích
sidebarTitle: Doctor
summary: 'Lệnh doctor: kiểm tra tình trạng, chuyển đổi cấu hình và các bước sửa chữa'
title: Trình kiểm tra
x-i18n:
    generated_at: "2026-04-29T22:43:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 347ce9a2f87632292319aa740389dca8763bd26dd398fb0edeb5b70cc16b949a
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` là công cụ sửa chữa + di chuyển dữ liệu cho OpenClaw. Công cụ này sửa cấu hình/trạng thái lỗi thời, kiểm tra tình trạng, và cung cấp các bước sửa chữa có thể hành động.

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

    Áp dụng các sửa chữa được khuyến nghị mà không nhắc hỏi (sửa chữa + khởi động lại ở nơi an toàn).

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

    Chạy không có lời nhắc và chỉ áp dụng các di chuyển dữ liệu an toàn (chuẩn hóa cấu hình + di chuyển trạng thái trên đĩa). Bỏ qua các hành động khởi động lại/dịch vụ/sandbox cần xác nhận của con người. Các di chuyển trạng thái cũ chạy tự động khi được phát hiện.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Quét dịch vụ hệ thống để tìm các bản cài đặt Gateway bổ sung (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Nếu muốn xem lại các thay đổi trước khi ghi, hãy mở tệp cấu hình trước:

```bash
cat ~/.openclaw/openclaw.json
```

## Công cụ làm gì (tóm tắt)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - Cập nhật kiểm tra trước tùy chọn cho bản cài đặt git (chỉ tương tác).
    - Kiểm tra độ mới của giao thức UI (xây dựng lại Control UI khi lược đồ giao thức mới hơn).
    - Kiểm tra tình trạng + lời nhắc khởi động lại.
    - Tóm tắt trạng thái Skills (đủ điều kiện/thiếu/bị chặn) và trạng thái Plugin.

  </Accordion>
  <Accordion title="Config and migrations">
    - Chuẩn hóa cấu hình cho các giá trị cũ.
    - Di chuyển cấu hình Talk từ các trường phẳng `talk.*` cũ sang `talk.provider` + `talk.providers.<provider>`.
    - Kiểm tra di chuyển trình duyệt cho cấu hình tiện ích Chrome cũ và mức sẵn sàng Chrome MCP.
    - Cảnh báo ghi đè nhà cung cấp OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Cảnh báo che khuất OAuth Codex (`models.providers.openai-codex`).
    - Kiểm tra điều kiện tiên quyết TLS OAuth cho hồ sơ OAuth OpenAI Codex.
    - Di chuyển trạng thái cũ trên đĩa (sessions/thư mục agent/xác thực WhatsApp).
    - Di chuyển khóa hợp đồng manifest Plugin cũ (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Di chuyển kho cron cũ (`jobId`, `schedule.cron`, các trường delivery/payload cấp cao nhất, payload `provider`, các job fallback webhook đơn giản `notify: true`).
    - Di chuyển runtime-policy agent cũ sang `agents.defaults.agentRuntime` và `agents.list[].agentRuntime`.
    - Dọn dẹp cấu hình Plugin lỗi thời khi Plugin được bật; khi `plugins.enabled=false`, các tham chiếu Plugin lỗi thời được xem là cấu hình bao chứa bất hoạt và được giữ lại.

  </Accordion>
  <Accordion title="State and integrity">
    - Kiểm tra tệp khóa phiên và dọn dẹp khóa lỗi thời.
    - Sửa bản ghi phiên cho các nhánh viết lại prompt bị trùng lặp do các bản build 2026.4.24 bị ảnh hưởng tạo ra.
    - Kiểm tra tính toàn vẹn trạng thái và quyền (sessions, transcripts, thư mục state).
    - Kiểm tra quyền tệp cấu hình (chmod 600) khi chạy cục bộ.
    - Tình trạng xác thực mô hình: kiểm tra thời hạn OAuth, có thể làm mới token sắp hết hạn, và báo cáo trạng thái cooldown/disabled của auth-profile.
    - Phát hiện thư mục workspace bổ sung (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Sửa ảnh sandbox khi sandboxing được bật.
    - Di chuyển dịch vụ cũ và phát hiện Gateway bổ sung.
    - Di chuyển trạng thái cũ của kênh Matrix (ở chế độ `--fix` / `--repair`).
    - Kiểm tra runtime Gateway (dịch vụ đã cài nhưng không chạy; nhãn launchd đã lưu cache).
    - Cảnh báo trạng thái kênh (thăm dò từ Gateway đang chạy).
    - Kiểm toán cấu hình supervisor (launchd/systemd/schtasks) với sửa chữa tùy chọn.
    - Dọn dẹp môi trường proxy nhúng cho các dịch vụ Gateway đã ghi lại giá trị shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` trong khi cài đặt hoặc cập nhật.
    - Kiểm tra phương pháp hay nhất runtime Gateway (Node so với Bun, đường dẫn trình quản lý phiên bản).
    - Chẩn đoán xung đột cổng Gateway (mặc định `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Cảnh báo bảo mật cho chính sách DM mở.
    - Kiểm tra xác thực Gateway cho chế độ token cục bộ (đề nghị tạo token khi không có nguồn token; không ghi đè cấu hình token SecretRef).
    - Phát hiện sự cố ghép đôi thiết bị (yêu cầu ghép đôi lần đầu đang chờ, nâng cấp vai trò/phạm vi đang chờ, lệch cache device-token cục bộ lỗi thời, và lệch xác thực bản ghi đã ghép đôi).

  </Accordion>
  <Accordion title="Workspace and shell">
    - Kiểm tra systemd linger trên Linux.
    - Kiểm tra kích thước tệp bootstrap workspace (cảnh báo bị cắt/gần giới hạn cho tệp ngữ cảnh).
    - Kiểm tra trạng thái hoàn tất shell và tự động cài đặt/nâng cấp.
    - Kiểm tra mức sẵn sàng của nhà cung cấp embedding tìm kiếm bộ nhớ (mô hình cục bộ, khóa API từ xa, hoặc binary QMD).
    - Kiểm tra bản cài đặt từ nguồn (pnpm workspace không khớp, thiếu tài nguyên UI, thiếu binary tsx).
    - Ghi cấu hình đã cập nhật + metadata wizard.

  </Accordion>
</AccordionGroup>

## Điền bù và đặt lại UI Dreams

Cảnh Dreams của Control UI bao gồm các hành động **Backfill**, **Reset**, và **Clear Grounded** cho quy trình grounded dreaming. Những hành động này dùng các phương thức RPC kiểu Gateway doctor, nhưng **không** thuộc phần sửa chữa/di chuyển của CLI `openclaw doctor`.

Những việc chúng làm:

- **Backfill** quét các tệp `memory/YYYY-MM-DD.md` lịch sử trong workspace đang hoạt động, chạy lượt nhật ký grounded REM, và ghi các mục backfill có thể đảo ngược vào `DREAMS.md`.
- **Reset** chỉ xóa các mục nhật ký backfill được đánh dấu đó khỏi `DREAMS.md`.
- **Clear Grounded** chỉ xóa các mục ngắn hạn chỉ-grounded đã được staged, đến từ phát lại lịch sử và chưa tích lũy recall trực tiếp hoặc hỗ trợ hằng ngày.

Những việc chúng **không** tự làm:

- chúng không chỉnh sửa `MEMORY.md`
- chúng không chạy đầy đủ các di chuyển doctor
- chúng không tự động stage ứng viên grounded vào kho thăng hạng ngắn hạn trực tiếp trừ khi bạn chạy rõ ràng đường dẫn CLI staged trước

Nếu muốn phát lại lịch sử grounded ảnh hưởng đến lane thăng hạng sâu bình thường, hãy dùng luồng CLI thay thế:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Lệnh đó stage các ứng viên bền vững grounded vào kho dreaming ngắn hạn trong khi vẫn giữ `DREAMS.md` làm bề mặt rà soát.

## Hành vi chi tiết và lý do

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    Nếu đây là một git checkout và doctor đang chạy tương tác, công cụ sẽ đề nghị cập nhật (fetch/rebase/build) trước khi chạy doctor.
  </Accordion>
  <Accordion title="1. Config normalization">
    Nếu cấu hình chứa các dạng giá trị cũ (ví dụ `messages.ackReaction` không có ghi đè riêng cho kênh), doctor chuẩn hóa chúng vào lược đồ hiện tại.

    Điều đó bao gồm các trường phẳng Talk cũ. Cấu hình Talk công khai hiện tại là `talk.provider` + `talk.providers.<provider>`. Doctor viết lại các dạng `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` cũ vào bản đồ nhà cung cấp.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    Khi cấu hình chứa các khóa không còn dùng, các lệnh khác sẽ từ chối chạy và yêu cầu bạn chạy `openclaw doctor`.

    Doctor sẽ:

    - Giải thích các khóa cũ nào đã được tìm thấy.
    - Hiển thị di chuyển đã áp dụng.
    - Viết lại `~/.openclaw/openclaw.json` bằng lược đồ đã cập nhật.

    Gateway cũng tự động chạy các di chuyển doctor khi khởi động nếu phát hiện định dạng cấu hình cũ, vì vậy cấu hình lỗi thời được sửa mà không cần can thiệp thủ công. Di chuyển kho job Cron được xử lý bởi `openclaw doctor --fix`.

    Các di chuyển hiện tại:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → cấp cao nhất `bindings`
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
    - Đối với các kênh có `accounts` được đặt tên nhưng vẫn còn các giá trị kênh cấp cao nhất cho một tài khoản, di chuyển các giá trị thuộc phạm vi tài khoản đó vào tài khoản được nâng cấp đã chọn cho kênh đó (`accounts.default` cho hầu hết kênh; Matrix có thể giữ lại một đích được đặt tên/mặc định hiện có khớp)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - xóa `agents.defaults.llm`; dùng `models.providers.<id>.timeoutSeconds` cho thời gian chờ nhà cung cấp/mô hình chậm
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - xóa `browser.relayBindHost` (thiết lập relay tiện ích cũ)
    - `models.providers.*.api: "openai"` cũ → `"openai-completions"` (khởi động Gateway cũng bỏ qua các nhà cung cấp có `api` được đặt thành một giá trị enum tương lai hoặc không rõ thay vì fail closed)

    Cảnh báo doctor cũng bao gồm hướng dẫn account-default cho các kênh nhiều tài khoản:

    - Nếu hai hoặc nhiều mục `channels.<channel>.accounts` được cấu hình mà không có `channels.<channel>.defaultAccount` hoặc `accounts.default`, doctor cảnh báo rằng định tuyến fallback có thể chọn một tài khoản không mong muốn.
    - Nếu `channels.<channel>.defaultAccount` được đặt thành một ID tài khoản không rõ, doctor cảnh báo và liệt kê các ID tài khoản đã cấu hình.

  </Accordion>
  <Accordion title="2b. Ghi đè nhà cung cấp OpenCode">
    Nếu bạn đã thêm `models.providers.opencode`, `opencode-zen`, hoặc `opencode-go` theo cách thủ công, cấu hình đó sẽ ghi đè danh mục OpenCode tích hợp từ `@mariozechner/pi-ai`. Điều đó có thể buộc các mô hình đi qua sai API hoặc đặt chi phí về không. Doctor cảnh báo để bạn có thể xóa ghi đè và khôi phục định tuyến API theo từng mô hình cùng chi phí.
  </Accordion>
  <Accordion title="2c. Di chuyển trình duyệt và mức sẵn sàng của Chrome MCP">
    Nếu cấu hình trình duyệt của bạn vẫn trỏ tới đường dẫn tiện ích Chrome đã bị xóa, doctor sẽ chuẩn hóa nó sang mô hình gắn Chrome MCP cục bộ trên host hiện tại:

    - `browser.profiles.*.driver: "extension"` trở thành `"existing-session"`
    - `browser.relayBindHost` bị xóa

    Doctor cũng kiểm tra đường dẫn Chrome MCP cục bộ trên host khi bạn dùng `defaultProfile: "user"` hoặc một hồ sơ `existing-session` đã cấu hình:

    - kiểm tra xem Google Chrome có được cài đặt trên cùng host cho các hồ sơ tự động kết nối mặc định hay không
    - kiểm tra phiên bản Chrome được phát hiện và cảnh báo khi phiên bản đó thấp hơn Chrome 144
    - nhắc bạn bật gỡ lỗi từ xa trong trang kiểm tra của trình duyệt (ví dụ `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, hoặc `edge://inspect/#remote-debugging`)

    Doctor không thể bật thiết lập phía Chrome thay bạn. Chrome MCP cục bộ trên host vẫn yêu cầu:

    - một trình duyệt dựa trên Chromium 144+ trên host Gateway/Node
    - trình duyệt đang chạy cục bộ
    - gỡ lỗi từ xa đã được bật trong trình duyệt đó
    - phê duyệt lời nhắc đồng ý gắn lần đầu trong trình duyệt

    Mức sẵn sàng ở đây chỉ liên quan đến các điều kiện tiên quyết để gắn cục bộ. Existing-session giữ nguyên các giới hạn tuyến Chrome MCP hiện tại; các tuyến nâng cao như `responsebody`, xuất PDF, chặn tải xuống, và hành động hàng loạt vẫn yêu cầu một trình duyệt được quản lý hoặc hồ sơ CDP thô.

    Kiểm tra này **không** áp dụng cho Docker, sandbox, remote-browser, hoặc các luồng headless khác. Những luồng đó tiếp tục dùng CDP thô.

  </Accordion>
  <Accordion title="2d. Điều kiện tiên quyết OAuth TLS">
    Khi một hồ sơ OpenAI Codex OAuth được cấu hình, doctor sẽ dò điểm cuối ủy quyền OpenAI để xác minh rằng ngăn xếp TLS Node/OpenSSL cục bộ có thể xác thực chuỗi chứng chỉ. Nếu phép dò thất bại do lỗi chứng chỉ (ví dụ `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, chứng chỉ hết hạn, hoặc chứng chỉ tự ký), doctor sẽ in hướng dẫn khắc phục theo từng nền tảng. Trên macOS với Node từ Homebrew, cách khắc phục thường là `brew postinstall ca-certificates`. Với `--deep`, phép dò vẫn chạy ngay cả khi Gateway khỏe mạnh.
  </Accordion>
  <Accordion title="2e. Ghi đè nhà cung cấp Codex OAuth">
    Nếu trước đây bạn đã thêm các thiết lập vận chuyển OpenAI cũ dưới `models.providers.openai-codex`, chúng có thể che khuất đường dẫn nhà cung cấp Codex OAuth tích hợp mà các bản phát hành mới hơn tự động dùng. Doctor cảnh báo khi thấy những thiết lập vận chuyển cũ đó đi cùng Codex OAuth để bạn có thể xóa hoặc viết lại ghi đè vận chuyển đã lỗi thời và lấy lại hành vi định tuyến/dự phòng tích hợp. Proxy tùy chỉnh và ghi đè chỉ header vẫn được hỗ trợ và không kích hoạt cảnh báo này.
  </Accordion>
  <Accordion title="2f. Cảnh báo tuyến Codex Plugin">
    Khi Codex Plugin đi kèm được bật, doctor cũng kiểm tra xem các tham chiếu mô hình chính `openai-codex/*` có còn phân giải qua PI runner mặc định hay không. Tổ hợp đó hợp lệ khi bạn muốn dùng xác thực Codex OAuth/gói đăng ký qua PI, nhưng dễ bị nhầm với harness app-server Codex gốc. Doctor cảnh báo và trỏ tới dạng app-server tường minh: `openai/*` cộng với `agentRuntime.id: "codex"` hoặc `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor không tự động sửa điều này vì cả hai tuyến đều hợp lệ:

    - `openai-codex/*` + PI nghĩa là "dùng xác thực Codex OAuth/gói đăng ký qua runner OpenClaw thông thường."
    - `openai/*` + `runtime: "codex"` nghĩa là "chạy lượt nhúng qua app-server Codex gốc."
    - `/codex ...` nghĩa là "điều khiển hoặc liên kết một cuộc hội thoại Codex gốc từ chat."
    - `/acp ...` hoặc `runtime: "acp"` nghĩa là "dùng bộ chuyển đổi ACP/acpx bên ngoài."

    Nếu cảnh báo xuất hiện, hãy chọn tuyến bạn đã dự định và chỉnh sửa cấu hình thủ công. Giữ nguyên cảnh báo khi PI Codex OAuth là chủ đích.

  </Accordion>
  <Accordion title="3. Di chuyển trạng thái cũ (bố cục đĩa)">
    Doctor có thể di chuyển các bố cục cũ trên đĩa sang cấu trúc hiện tại:

    - Kho phiên + bản ghi:
      - từ `~/.openclaw/sessions/` sang `~/.openclaw/agents/<agentId>/sessions/`
    - Thư mục tác nhân:
      - từ `~/.openclaw/agent/` sang `~/.openclaw/agents/<agentId>/agent/`
    - Trạng thái xác thực WhatsApp (Baileys):
      - từ `~/.openclaw/credentials/*.json` cũ (trừ `oauth.json`)
      - sang `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID tài khoản mặc định: `default`)

    Các lần di chuyển này theo cơ chế nỗ lực tối đa và có tính lũy đẳng; doctor sẽ phát cảnh báo khi để lại bất kỳ thư mục cũ nào làm bản sao lưu. Gateway/CLI cũng tự động di chuyển kho phiên cũ + thư mục tác nhân khi khởi động, để lịch sử/xác thực/mô hình nằm trong đường dẫn theo từng tác nhân mà không cần chạy doctor thủ công. Xác thực WhatsApp được chủ ý chỉ di chuyển qua `openclaw doctor`. Chuẩn hóa nhà cung cấp/bản đồ nhà cung cấp Talk hiện so sánh theo bình đẳng cấu trúc, nên các khác biệt chỉ do thứ tự khóa không còn kích hoạt lại các thay đổi `doctor --fix` không có tác dụng.

  </Accordion>
  <Accordion title="3a. Di chuyển manifest Plugin cũ">
    Doctor quét tất cả manifest Plugin đã cài đặt để tìm các khóa năng lực cấp cao nhất đã ngừng dùng (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Khi tìm thấy, nó đề xuất chuyển chúng vào đối tượng `contracts` và ghi lại tệp manifest tại chỗ. Lần di chuyển này có tính lũy đẳng; nếu khóa `contracts` đã có cùng các giá trị, khóa cũ sẽ bị xóa mà không nhân đôi dữ liệu.
  </Accordion>
  <Accordion title="3b. Di chuyển kho Cron cũ">
    Doctor cũng kiểm tra kho tác vụ Cron (`~/.openclaw/cron/jobs.json` theo mặc định, hoặc `cron.store` khi được ghi đè) để tìm các dạng tác vụ cũ mà bộ lập lịch vẫn chấp nhận để tương thích.

    Các bước dọn dẹp Cron hiện tại bao gồm:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - các trường payload cấp cao nhất (`message`, `model`, `thinking`, ...) → `payload`
    - các trường phân phối cấp cao nhất (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias phân phối `provider` trong payload → `delivery.channel` tường minh
    - các tác vụ dự phòng Webhook `notify: true` cũ đơn giản → `delivery.mode="webhook"` tường minh với `delivery.to=cron.webhook`

    Doctor chỉ tự động di chuyển các tác vụ `notify: true` khi có thể làm vậy mà không thay đổi hành vi. Nếu một tác vụ kết hợp dự phòng thông báo cũ với một chế độ phân phối không phải Webhook hiện có, doctor sẽ cảnh báo và để tác vụ đó cho bạn xem xét thủ công.

  </Accordion>
  <Accordion title="3c. Dọn dẹp khóa phiên">
    Doctor quét mọi thư mục phiên của tác nhân để tìm các tệp khóa ghi cũ không còn hợp lệ — các tệp bị bỏ lại khi một phiên thoát bất thường. Với mỗi tệp khóa tìm thấy, nó báo cáo: đường dẫn, PID, PID còn sống hay không, tuổi khóa và khóa có được xem là cũ không còn hợp lệ hay không (PID đã chết hoặc cũ hơn 30 phút). Ở chế độ `--fix` / `--repair`, nó tự động xóa các tệp khóa cũ không còn hợp lệ; nếu không, nó in ghi chú và hướng dẫn bạn chạy lại với `--fix`.
  </Accordion>
  <Accordion title="3d. Sửa nhánh bản ghi phiên">
    Doctor quét các tệp JSONL phiên của tác nhân để tìm dạng nhánh bị nhân đôi do lỗi ghi lại bản ghi prompt ngày 2026.4.24 tạo ra: một lượt người dùng bị bỏ lại với ngữ cảnh runtime nội bộ OpenClaw cùng một nhánh anh em đang hoạt động chứa cùng prompt người dùng hiển thị. Ở chế độ `--fix` / `--repair`, doctor sao lưu từng tệp bị ảnh hưởng bên cạnh bản gốc và ghi lại bản ghi sang nhánh đang hoạt động để lịch sử Gateway và trình đọc bộ nhớ không còn thấy các lượt bị nhân đôi.
  </Accordion>
  <Accordion title="4. Kiểm tra tính toàn vẹn trạng thái (lưu phiên, định tuyến và an toàn)">
    Thư mục trạng thái là thân não vận hành. Nếu nó biến mất, bạn sẽ mất phiên, thông tin xác thực, nhật ký và cấu hình (trừ khi bạn có bản sao lưu ở nơi khác).

    Doctor kiểm tra:

    - **Thiếu thư mục trạng thái**: cảnh báo về việc mất trạng thái nghiêm trọng, nhắc tạo lại thư mục và nhắc bạn rằng nó không thể khôi phục dữ liệu bị thiếu.
    - **Quyền thư mục trạng thái**: xác minh khả năng ghi; đề xuất sửa quyền (và phát gợi ý `chown` khi phát hiện chủ sở hữu/nhóm không khớp).
    - **Thư mục trạng thái đồng bộ đám mây trên macOS**: cảnh báo khi trạng thái phân giải bên dưới iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) hoặc `~/Library/CloudStorage/...` vì các đường dẫn dựa trên đồng bộ có thể khiến I/O chậm hơn và gây tranh chấp khóa/đồng bộ.
    - **Thư mục trạng thái SD hoặc eMMC trên Linux**: cảnh báo khi trạng thái phân giải tới một nguồn gắn kết `mmcblk*`, vì I/O ngẫu nhiên dựa trên SD hoặc eMMC có thể chậm hơn và hao mòn nhanh hơn khi ghi phiên và thông tin xác thực.
    - **Thiếu thư mục phiên**: `sessions/` và thư mục kho phiên là bắt buộc để lưu lịch sử và tránh sự cố `ENOENT`.
    - **Bản ghi không khớp**: cảnh báo khi các mục phiên gần đây thiếu tệp bản ghi.
    - **Phiên chính "JSONL 1 dòng"**: gắn cờ khi bản ghi chính chỉ có một dòng (lịch sử không được tích lũy).
    - **Nhiều thư mục trạng thái**: cảnh báo khi có nhiều thư mục `~/.openclaw` trên các thư mục home hoặc khi `OPENCLAW_STATE_DIR` trỏ tới nơi khác (lịch sử có thể bị chia tách giữa các bản cài đặt).
    - **Nhắc nhở chế độ từ xa**: nếu `gateway.mode=remote`, doctor nhắc bạn chạy nó trên máy chủ từ xa (trạng thái nằm ở đó).
    - **Quyền tệp cấu hình**: cảnh báo nếu `~/.openclaw/openclaw.json` có thể đọc bởi nhóm/mọi người và đề xuất siết chặt thành `600`.

  </Accordion>
  <Accordion title="5. Sức khỏe xác thực mô hình (OAuth hết hạn)">
    Doctor kiểm tra các hồ sơ OAuth trong kho xác thực, cảnh báo khi token sắp hết hạn/đã hết hạn và có thể làm mới chúng khi an toàn. Nếu hồ sơ OAuth/token Anthropic đã cũ, nó đề xuất khóa API Anthropic hoặc đường dẫn token thiết lập Anthropic. Prompt làm mới chỉ xuất hiện khi chạy tương tác (TTY); `--non-interactive` bỏ qua các lần thử làm mới.

    Khi làm mới OAuth thất bại vĩnh viễn (ví dụ `refresh_token_reused`, `invalid_grant`, hoặc nhà cung cấp yêu cầu bạn đăng nhập lại), doctor báo rằng cần xác thực lại và in đúng lệnh `openclaw models auth login --provider ...` cần chạy.

    Doctor cũng báo cáo các hồ sơ xác thực tạm thời không dùng được do:

    - thời gian chờ ngắn (giới hạn tốc độ/hết thời gian chờ/lỗi xác thực)
    - vô hiệu hóa lâu hơn (lỗi thanh toán/tín dụng)

  </Accordion>
  <Accordion title="6. Xác thực mô hình hook">
    Nếu `hooks.gmail.model` được đặt, doctor xác thực tham chiếu mô hình với danh mục và danh sách cho phép, đồng thời cảnh báo khi nó không phân giải được hoặc không được phép.
  </Accordion>
  <Accordion title="7. Sửa ảnh sandbox">
    Khi sandbox được bật, doctor kiểm tra các ảnh Docker và đề xuất xây dựng hoặc chuyển sang tên cũ nếu ảnh hiện tại bị thiếu.
  </Accordion>
  <Accordion title="7b. Phụ thuộc runtime của Plugin đi kèm">
    Doctor chỉ xác minh các phụ thuộc runtime cho những Plugin đi kèm đang hoạt động trong cấu hình hiện tại hoặc được bật theo mặc định trong manifest đi kèm của chúng, ví dụ `plugins.entries.discord.enabled: true`, `channels.discord.enabled: true` cũ, hoặc một nhà cung cấp đi kèm được bật mặc định. Nếu thiếu bất kỳ phụ thuộc nào, doctor báo cáo các gói và cài đặt chúng ở chế độ `openclaw doctor --fix` / `openclaw doctor --repair`. Plugin bên ngoài vẫn dùng `openclaw plugins install` / `openclaw plugins update`; doctor không cài đặt phụ thuộc cho các đường dẫn Plugin tùy ý.

    Trong quá trình sửa chữa doctor, các lần cài đặt npm cho phụ thuộc runtime đi kèm báo cáo tiến trình spinner trong phiên TTY và tiến trình theo dòng định kỳ trong đầu ra pipe/headless. Gateway và CLI cục bộ cũng có thể sửa chữa các phụ thuộc runtime của plugin đi kèm đang hoạt động theo yêu cầu trước khi import một plugin đi kèm. Các lần cài đặt này được giới hạn trong gốc cài đặt runtime của plugin, chạy với script bị tắt, không ghi package lock, và được bảo vệ bằng khóa gốc cài đặt để các lần khởi động CLI hoặc Gateway đồng thời không thay đổi cùng cây `node_modules` cùng lúc.

  </Accordion>
  <Accordion title="8. Gateway service migrations and cleanup hints">
    Doctor phát hiện các dịch vụ gateway cũ (launchd/systemd/schtasks) và đề nghị xóa chúng rồi cài đặt dịch vụ OpenClaw bằng cổng gateway hiện tại. Nó cũng có thể quét các dịch vụ giống gateway bổ sung và in gợi ý dọn dẹp. Các dịch vụ gateway OpenClaw có tên theo hồ sơ được xem là hạng nhất và không bị gắn cờ là "bổ sung."

    Trên Linux, nếu thiếu dịch vụ gateway cấp người dùng nhưng tồn tại dịch vụ gateway OpenClaw cấp hệ thống, doctor không tự động cài đặt dịch vụ cấp người dùng thứ hai. Kiểm tra bằng `openclaw gateway status --deep` hoặc `openclaw doctor --deep`, rồi xóa bản trùng lặp hoặc đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một supervisor hệ thống sở hữu vòng đời gateway.

  </Accordion>
  <Accordion title="8b. Startup Matrix migration">
    Khi tài khoản kênh Matrix có một quá trình di chuyển trạng thái cũ đang chờ hoặc có thể thực hiện, doctor (ở chế độ `--fix` / `--repair`) tạo một snapshot trước di chuyển rồi chạy các bước di chuyển nỗ lực tốt nhất: di chuyển trạng thái Matrix cũ và chuẩn bị trạng thái mã hóa cũ. Cả hai bước đều không gây lỗi nghiêm trọng; lỗi được ghi log và quá trình khởi động tiếp tục. Ở chế độ chỉ đọc (`openclaw doctor` không có `--fix`), bước kiểm tra này bị bỏ qua hoàn toàn.
  </Accordion>
  <Accordion title="8c. Device pairing and auth drift">
    Doctor hiện kiểm tra trạng thái ghép nối thiết bị như một phần của lượt kiểm tra sức khỏe thông thường.

    Nội dung báo cáo:

    - yêu cầu ghép nối lần đầu đang chờ
    - nâng cấp vai trò đang chờ cho các thiết bị đã ghép nối
    - nâng cấp phạm vi đang chờ cho các thiết bị đã ghép nối
    - sửa chữa không khớp khóa công khai khi id thiết bị vẫn khớp nhưng danh tính thiết bị không còn khớp với bản ghi đã phê duyệt
    - bản ghi đã ghép nối thiếu token đang hoạt động cho vai trò đã phê duyệt
    - token đã ghép nối có phạm vi lệch khỏi đường cơ sở ghép nối đã phê duyệt
    - mục token thiết bị được cache cục bộ cho máy hiện tại có trước lần xoay token phía gateway hoặc mang metadata phạm vi cũ

    Doctor không tự động phê duyệt yêu cầu ghép nối hoặc tự động xoay token thiết bị. Thay vào đó, nó in chính xác các bước tiếp theo:

    - kiểm tra các yêu cầu đang chờ bằng `openclaw devices list`
    - phê duyệt yêu cầu chính xác bằng `openclaw devices approve <requestId>`
    - xoay token mới bằng `openclaw devices rotate --device <deviceId> --role <role>`
    - xóa và phê duyệt lại bản ghi cũ bằng `openclaw devices remove <deviceId>`

    Điều này khép lại lỗ hổng phổ biến "đã ghép nối nhưng vẫn bị yêu cầu ghép nối": doctor hiện phân biệt ghép nối lần đầu với nâng cấp vai trò/phạm vi đang chờ và với độ lệch token/danh tính thiết bị cũ.

  </Accordion>
  <Accordion title="9. Security warnings">
    Doctor phát cảnh báo khi một provider mở cho DM mà không có allowlist, hoặc khi một chính sách được cấu hình theo cách nguy hiểm.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Nếu chạy dưới dạng dịch vụ người dùng systemd, doctor đảm bảo lingering được bật để gateway tiếp tục hoạt động sau khi đăng xuất.
  </Accordion>
  <Accordion title="11. Workspace status (skills, plugins, and legacy dirs)">
    Doctor in bản tóm tắt trạng thái workspace cho agent mặc định:

    - **Trạng thái Skills**: đếm Skills đủ điều kiện, thiếu yêu cầu, và bị chặn bởi allowlist.
    - **Thư mục workspace cũ**: cảnh báo khi `~/openclaw` hoặc các thư mục workspace cũ khác tồn tại cùng workspace hiện tại.
    - **Trạng thái Plugin**: đếm plugin đã bật/tắt/lỗi; liệt kê ID plugin cho mọi lỗi; báo cáo năng lực plugin bundle.
    - **Cảnh báo tương thích Plugin**: gắn cờ các plugin có vấn đề tương thích với runtime hiện tại.
    - **Chẩn đoán Plugin**: hiển thị mọi cảnh báo hoặc lỗi trong lúc tải do registry plugin phát ra.

  </Accordion>
  <Accordion title="11b. Bootstrap file size">
    Doctor kiểm tra xem các tệp bootstrap của workspace (ví dụ `AGENTS.md`, `CLAUDE.md`, hoặc các tệp ngữ cảnh được chèn khác) có gần hoặc vượt quá ngân sách ký tự đã cấu hình không. Nó báo cáo số ký tự thô so với số ký tự đã chèn theo từng tệp, phần trăm cắt ngắn, nguyên nhân cắt ngắn (`max/file` hoặc `max/total`), và tổng số ký tự đã chèn dưới dạng tỷ lệ của tổng ngân sách. Khi tệp bị cắt ngắn hoặc gần giới hạn, doctor in mẹo để tinh chỉnh `agents.defaults.bootstrapMaxChars` và `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Stale channel plugin cleanup">
    Khi `openclaw doctor --fix` xóa một plugin kênh bị thiếu, nó cũng xóa cấu hình treo trong phạm vi kênh đã tham chiếu plugin đó: các mục `channels.<id>`, mục tiêu Heartbeat đã đặt tên kênh, và override `agents.*.models["<channel>/*"]`. Điều này ngăn các vòng lặp khởi động Gateway khi runtime kênh đã biến mất nhưng cấu hình vẫn yêu cầu gateway bind vào nó.
  </Accordion>
  <Accordion title="11c. Shell completion">
    Doctor kiểm tra xem tab completion đã được cài đặt cho shell hiện tại chưa (zsh, bash, fish, hoặc PowerShell):

    - Nếu hồ sơ shell dùng mẫu completion động chậm (`source <(openclaw completion ...)`), doctor nâng cấp nó lên biến thể tệp cache nhanh hơn.
    - Nếu completion được cấu hình trong hồ sơ nhưng thiếu tệp cache, doctor tự động tạo lại cache.
    - Nếu hoàn toàn chưa cấu hình completion, doctor nhắc cài đặt nó (chỉ chế độ tương tác; bị bỏ qua với `--non-interactive`).

    Chạy `openclaw completion --write-state` để tạo lại cache thủ công.

  </Accordion>
  <Accordion title="12. Gateway auth checks (local token)">
    Doctor kiểm tra mức sẵn sàng xác thực token gateway cục bộ.

    - Nếu chế độ token cần token và không tồn tại nguồn token, doctor đề nghị tạo một token.
    - Nếu `gateway.auth.token` do SecretRef quản lý nhưng không khả dụng, doctor cảnh báo và không ghi đè bằng plaintext.
    - `openclaw doctor --generate-gateway-token` chỉ buộc tạo khi không cấu hình SecretRef token.

  </Accordion>
  <Accordion title="12b. Read-only SecretRef-aware repairs">
    Một số luồng sửa chữa cần kiểm tra thông tin xác thực đã cấu hình mà không làm suy yếu hành vi runtime fail-fast.

    - `openclaw doctor --fix` hiện dùng cùng mô hình tóm tắt SecretRef chỉ đọc như các lệnh nhóm trạng thái cho sửa chữa cấu hình có mục tiêu.
    - Ví dụ: sửa chữa `allowFrom` / `groupAllowFrom` `@username` của Telegram cố dùng thông tin xác thực bot đã cấu hình khi có sẵn.
    - Nếu token bot Telegram được cấu hình qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại, doctor báo rằng thông tin xác thực đã được cấu hình-nhưng-không-khả dụng và bỏ qua tự động phân giải thay vì crash hoặc báo sai rằng token bị thiếu.

  </Accordion>
  <Accordion title="13. Gateway health check + restart">
    Doctor chạy kiểm tra sức khỏe và đề nghị khởi động lại gateway khi có vẻ không khỏe.
  </Accordion>
  <Accordion title="13b. Memory search readiness">
    Doctor kiểm tra xem provider embedding tìm kiếm bộ nhớ đã cấu hình có sẵn sàng cho agent mặc định không. Hành vi phụ thuộc vào backend và provider đã cấu hình:

    - **Backend QMD**: thăm dò xem binary `qmd` có khả dụng và có thể khởi động không. Nếu không, in hướng dẫn sửa, bao gồm package npm và tùy chọn đường dẫn binary thủ công.
    - **Provider cục bộ rõ ràng**: kiểm tra tệp model cục bộ hoặc URL model từ xa/có thể tải xuống được nhận diện. Nếu thiếu, đề xuất chuyển sang provider từ xa.
    - **Provider từ xa rõ ràng** (`openai`, `voyage`, v.v.): xác minh API key có trong môi trường hoặc kho xác thực. In gợi ý sửa có thể thực hiện nếu thiếu.
    - **Provider tự động**: kiểm tra tính khả dụng của model cục bộ trước, rồi thử từng provider từ xa theo thứ tự tự động chọn.

    Khi có kết quả thăm dò gateway được cache (gateway khỏe tại thời điểm kiểm tra), doctor đối chiếu kết quả đó với cấu hình mà CLI nhìn thấy và ghi chú mọi khác biệt. Doctor không khởi động ping embedding mới trên đường dẫn mặc định; hãy dùng lệnh trạng thái bộ nhớ sâu khi bạn muốn kiểm tra provider trực tiếp.

    Dùng `openclaw memory status --deep` để xác minh mức sẵn sàng embedding lúc runtime.

  </Accordion>
  <Accordion title="14. Channel status warnings">
    Nếu gateway khỏe, doctor chạy thăm dò trạng thái kênh và báo cáo cảnh báo kèm bản sửa được đề xuất.
  </Accordion>
  <Accordion title="15. Supervisor config audit + repair">
    Doctor kiểm tra cấu hình supervisor đã cài đặt (launchd/systemd/schtasks) để tìm giá trị mặc định bị thiếu hoặc lỗi thời (ví dụ: phụ thuộc systemd network-online và độ trễ khởi động lại). Khi tìm thấy điểm không khớp, nó khuyến nghị cập nhật và có thể ghi lại tệp/tác vụ dịch vụ theo giá trị mặc định hiện tại.

    Ghi chú:

    - `openclaw doctor` nhắc trước khi ghi lại cấu hình supervisor.
    - `openclaw doctor --yes` chấp nhận các lời nhắc sửa chữa mặc định.
    - `openclaw doctor --repair` áp dụng bản sửa được khuyến nghị mà không nhắc.
    - `openclaw doctor --repair --force` ghi đè cấu hình supervisor tùy chỉnh.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` giữ doctor ở chế độ chỉ đọc cho vòng đời dịch vụ gateway. Nó vẫn báo cáo sức khỏe dịch vụ và chạy các sửa chữa không thuộc dịch vụ, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap dịch vụ, ghi lại cấu hình supervisor, và dọn dẹp dịch vụ cũ vì một supervisor bên ngoài sở hữu vòng đời đó.
    - Trên Linux, doctor không ghi lại metadata lệnh/entrypoint khi unit gateway systemd tương ứng đang hoạt động. Nó cũng bỏ qua các unit giống gateway bổ sung không hoạt động và không phải cũ trong quá trình quét dịch vụ trùng lặp để các tệp dịch vụ đi kèm không tạo nhiễu dọn dẹp.
    - Nếu xác thực token yêu cầu token và `gateway.auth.token` do SecretRef quản lý, cài đặt/sửa chữa dịch vụ doctor xác thực SecretRef nhưng không lưu giá trị token plaintext đã phân giải vào metadata môi trường dịch vụ supervisor.
    - Doctor phát hiện các giá trị môi trường dịch vụ được quản lý bằng `.env`/SecretRef mà các bản cài đặt LaunchAgent, systemd, hoặc Windows Scheduled Task cũ đã nhúng inline và ghi lại metadata dịch vụ để các giá trị đó tải từ nguồn runtime thay vì định nghĩa supervisor.
    - Doctor phát hiện khi lệnh dịch vụ vẫn ghim `--port` cũ sau khi `gateway.port` thay đổi và ghi lại metadata dịch vụ sang cổng hiện tại.
    - Nếu xác thực token yêu cầu token và SecretRef token đã cấu hình chưa được phân giải, doctor chặn đường dẫn cài đặt/sửa chữa với hướng dẫn có thể thực hiện.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` được cấu hình và `gateway.auth.mode` chưa được đặt, doctor chặn cài đặt/sửa chữa cho đến khi mode được đặt rõ ràng.
    - Đối với các unit user-systemd trên Linux, kiểm tra độ lệch token của doctor hiện bao gồm cả nguồn `Environment=` và `EnvironmentFile=` khi so sánh metadata xác thực dịch vụ.
    - Sửa chữa dịch vụ doctor từ chối ghi lại, dừng, hoặc khởi động lại dịch vụ gateway từ binary OpenClaw cũ hơn khi cấu hình được ghi lần cuối bởi phiên bản mới hơn. Xem [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Bạn luôn có thể buộc ghi lại toàn bộ qua `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Thời gian chạy Gateway + chẩn đoán cổng">
    Doctor kiểm tra thời gian chạy của dịch vụ (PID, trạng thái thoát gần nhất) và cảnh báo khi dịch vụ đã được cài đặt nhưng thực tế không chạy. Doctor cũng kiểm tra xung đột cổng trên cổng Gateway (mặc định `18789`) và báo cáo các nguyên nhân có khả năng xảy ra (Gateway đã chạy, đường hầm SSH).
  </Accordion>
  <Accordion title="17. Các thực hành tốt nhất cho thời gian chạy Gateway">
    Doctor cảnh báo khi dịch vụ Gateway chạy trên Bun hoặc đường dẫn Node do trình quản lý phiên bản quản lý (`nvm`, `fnm`, `volta`, `asdf`, v.v.). Các kênh WhatsApp + Telegram yêu cầu Node, và đường dẫn của trình quản lý phiên bản có thể hỏng sau khi nâng cấp vì dịch vụ không tải phần khởi tạo shell của bạn. Doctor đề nghị chuyển sang bản cài đặt Node hệ thống khi có sẵn (Homebrew/apt/choco).

    Các dịch vụ mới cài đặt hoặc đã sửa chữa giữ lại các gốc môi trường rõ ràng (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) và các thư mục user-bin ổn định, nhưng các thư mục dự phòng của trình quản lý phiên bản được đoán chỉ được ghi vào PATH của dịch vụ khi các thư mục đó tồn tại trên đĩa. Điều này giữ cho PATH supervisor được tạo ra khớp với cùng quy trình kiểm tra PATH tối thiểu mà Doctor chạy sau đó.

  </Accordion>
  <Accordion title="18. Ghi cấu hình + siêu dữ liệu trình hướng dẫn">
    Doctor lưu mọi thay đổi cấu hình và đóng dấu siêu dữ liệu trình hướng dẫn để ghi lại lần chạy Doctor.
  </Accordion>
  <Accordion title="19. Mẹo workspace (sao lưu + hệ thống bộ nhớ)">
    Doctor đề xuất một hệ thống bộ nhớ workspace khi chưa có và in mẹo sao lưu nếu workspace chưa nằm trong git.

    Xem [/concepts/agent-workspace](/vi/concepts/agent-workspace) để biết hướng dẫn đầy đủ về cấu trúc workspace và sao lưu git (khuyến nghị GitHub hoặc GitLab riêng tư).

  </Accordion>
</AccordionGroup>

## Liên quan

- [Runbook Gateway](/vi/gateway)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
