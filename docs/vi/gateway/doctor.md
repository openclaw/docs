---
read_when:
    - Thêm hoặc sửa đổi các di trú của lệnh doctor
    - Đưa vào các thay đổi cấu hình phá vỡ tương thích
sidebarTitle: Doctor
summary: 'Lệnh Doctor: kiểm tra sức khỏe, di chuyển cấu hình và các bước sửa chữa'
title: Trình chẩn đoán
x-i18n:
    generated_at: "2026-05-02T20:44:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 504cf06e8457315eb1df4970a877b88fdc2e32f34974ce789875373e9e030234
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` là công cụ sửa chữa + di chuyển cho OpenClaw. Công cụ này sửa cấu hình/trạng thái cũ, kiểm tra tình trạng và cung cấp các bước sửa chữa có thể thực hiện.

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

    Chạy không có lời nhắc và chỉ áp dụng các di chuyển an toàn (chuẩn hóa cấu hình + di chuyển trạng thái trên đĩa). Bỏ qua các hành động khởi động lại/dịch vụ/sandbox cần con người xác nhận. Các di chuyển trạng thái cũ chạy tự động khi được phát hiện.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Quét các dịch vụ hệ thống để tìm các bản cài đặt Gateway bổ sung (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Nếu bạn muốn xem lại thay đổi trước khi ghi, hãy mở tệp cấu hình trước:

```bash
cat ~/.openclaw/openclaw.json
```

## Công cụ này làm gì (tóm tắt)

<AccordionGroup>
  <Accordion title="Tình trạng, UI và cập nhật">
    - Cập nhật trước khi chạy tùy chọn cho bản cài đặt git (chỉ tương tác).
    - Kiểm tra độ mới của giao thức UI (xây dựng lại Control UI khi lược đồ giao thức mới hơn).
    - Kiểm tra tình trạng + lời nhắc khởi động lại.
    - Tóm tắt trạng thái Skills (đủ điều kiện/thiếu/bị chặn) và trạng thái Plugin.

  </Accordion>
  <Accordion title="Cấu hình và di chuyển">
    - Chuẩn hóa cấu hình cho các giá trị cũ.
    - Di chuyển cấu hình Talk từ các trường phẳng `talk.*` cũ sang `talk.provider` + `talk.providers.<provider>`.
    - Kiểm tra di chuyển trình duyệt cho cấu hình Chrome extension cũ và mức sẵn sàng Chrome MCP.
    - Cảnh báo ghi đè nhà cung cấp OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Cảnh báo che khuất Codex OAuth (`models.providers.openai-codex`).
    - Kiểm tra điều kiện tiên quyết OAuth TLS cho hồ sơ OpenAI Codex OAuth.
    - Cảnh báo danh sách cho phép Plugin/công cụ khi `plugins.allow` hạn chế nhưng chính sách công cụ vẫn yêu cầu ký tự đại diện hoặc công cụ thuộc sở hữu Plugin.
    - Di chuyển trạng thái cũ trên đĩa (phiên/thư mục agent/xác thực WhatsApp).
    - Di chuyển khóa hợp đồng manifest Plugin cũ (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Di chuyển kho Cron cũ (`jobId`, `schedule.cron`, các trường delivery/payload cấp cao nhất, payload `provider`, các job Webhook dự phòng đơn giản `notify: true`).
    - Di chuyển runtime-policy agent cũ sang `agents.defaults.agentRuntime` và `agents.list[].agentRuntime`.
    - Dọn dẹp cấu hình Plugin cũ khi Plugin được bật; khi `plugins.enabled=false`, các tham chiếu Plugin cũ được xem là cấu hình khoanh vùng bất hoạt và được giữ nguyên.

  </Accordion>
  <Accordion title="Trạng thái và tính toàn vẹn">
    - Kiểm tra tệp khóa phiên và dọn dẹp khóa cũ.
    - Sửa bản ghi phiên cho các nhánh viết lại prompt bị trùng lặp do các bản dựng 2026.4.24 bị ảnh hưởng tạo ra.
    - Phát hiện tombstone phục hồi-khởi động lại subagent bị kẹt, với hỗ trợ `--fix` để xóa các cờ phục hồi đã hủy cũ nhằm tránh startup tiếp tục xem tiến trình con là đã bị hủy do khởi động lại.
    - Kiểm tra tính toàn vẹn trạng thái và quyền (phiên, bản ghi, thư mục trạng thái).
    - Kiểm tra quyền tệp cấu hình (chmod 600) khi chạy cục bộ.
    - Tình trạng xác thực mô hình: kiểm tra OAuth hết hạn, có thể làm mới token sắp hết hạn, và báo cáo trạng thái cooldown/bị tắt của auth-profile.
    - Phát hiện thư mục workspace bổ sung (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, dịch vụ và supervisor">
    - Sửa ảnh sandbox khi sandboxing được bật.
    - Di chuyển dịch vụ cũ và phát hiện Gateway bổ sung.
    - Di chuyển trạng thái cũ của kênh Matrix (trong chế độ `--fix` / `--repair`).
    - Kiểm tra runtime Gateway (dịch vụ đã cài nhưng không chạy; nhãn launchd được lưu trong cache).
    - Cảnh báo trạng thái kênh (thăm dò từ Gateway đang chạy).
    - Kiểm toán cấu hình supervisor (launchd/systemd/schtasks) với sửa chữa tùy chọn.
    - Dọn dẹp môi trường proxy nhúng cho các dịch vụ Gateway đã bắt các giá trị shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` trong quá trình cài đặt hoặc cập nhật.
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
    - Kiểm tra mức sẵn sàng Skills cho agent mặc định; báo cáo các skills được phép nhưng thiếu bin, env, cấu hình hoặc yêu cầu hệ điều hành, và `--fix` có thể tắt các skills không khả dụng trong `skills.entries`.
    - Kiểm tra trạng thái shell completion và tự động cài đặt/nâng cấp.
    - Kiểm tra mức sẵn sàng của nhà cung cấp embedding tìm kiếm bộ nhớ (mô hình cục bộ, khóa API từ xa hoặc binary QMD).
    - Kiểm tra bản cài đặt từ nguồn (không khớp pnpm workspace, thiếu tài nguyên UI, thiếu binary tsx).
    - Ghi cấu hình đã cập nhật + metadata wizard.

  </Accordion>
</AccordionGroup>

## Điền bù và đặt lại Dreams UI

Cảnh Dreams trong Control UI bao gồm các hành động **Backfill**, **Reset** và **Clear Grounded** cho quy trình grounded dreaming. Các hành động này dùng các phương thức RPC kiểu gateway doctor, nhưng chúng **không** phải là một phần của sửa chữa/di chuyển CLI `openclaw doctor`.

Chúng làm gì:

- **Backfill** quét các tệp `memory/YYYY-MM-DD.md` lịch sử trong workspace đang hoạt động, chạy lượt nhật ký grounded REM và ghi các mục backfill có thể đảo ngược vào `DREAMS.md`.
- **Reset** chỉ xóa các mục nhật ký backfill đã được đánh dấu đó khỏi `DREAMS.md`.
- **Clear Grounded** chỉ xóa các mục ngắn hạn chỉ-grounded đã staging đến từ phát lại lịch sử và chưa tích lũy recall trực tiếp hoặc hỗ trợ hằng ngày.

Những việc chúng **không** tự làm:

- chúng không chỉnh sửa `MEMORY.md`
- chúng không chạy toàn bộ di chuyển doctor
- chúng không tự động staging ứng viên grounded vào kho thăng hạng ngắn hạn trực tiếp trừ khi bạn chạy rõ ràng đường dẫn CLI đã staging trước

Nếu bạn muốn phát lại lịch sử grounded ảnh hưởng đến lane thăng hạng sâu bình thường, hãy dùng luồng CLI thay thế:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Lệnh đó staging các ứng viên bền vững grounded vào kho dreaming ngắn hạn trong khi giữ `DREAMS.md` làm bề mặt xem xét.

## Hành vi chi tiết và lý do

<AccordionGroup>
  <Accordion title="0. Cập nhật tùy chọn (bản cài đặt git)">
    Nếu đây là một git checkout và doctor đang chạy tương tác, nó đề xuất cập nhật (fetch/rebase/build) trước khi chạy doctor.
  </Accordion>
  <Accordion title="1. Chuẩn hóa cấu hình">
    Nếu cấu hình chứa các dạng giá trị cũ (ví dụ `messages.ackReaction` không có ghi đè theo kênh), doctor chuẩn hóa chúng vào lược đồ hiện tại.

    Điều đó bao gồm các trường phẳng Talk cũ. Cấu hình Talk công khai hiện tại là `talk.provider` + `talk.providers.<provider>`. Doctor viết lại các dạng `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` cũ vào bản đồ nhà cung cấp.

    Doctor cũng cảnh báo khi `plugins.allow` không rỗng và chính sách công cụ dùng
    mục ký tự đại diện hoặc công cụ thuộc sở hữu Plugin. `tools.allow: ["*"]` chỉ khớp công cụ
    từ các Plugin thực sự tải; nó không bỏ qua danh sách cho phép Plugin độc quyền.

  </Accordion>
  <Accordion title="2. Di chuyển khóa cấu hình cũ">
    Khi cấu hình chứa khóa không còn được dùng, các lệnh khác sẽ từ chối chạy và yêu cầu bạn chạy `openclaw doctor`.

    Doctor sẽ:

    - Giải thích khóa cũ nào đã được tìm thấy.
    - Hiển thị di chuyển đã áp dụng.
    - Viết lại `~/.openclaw/openclaw.json` với lược đồ đã cập nhật.

    Gateway cũng tự động chạy các di chuyển doctor khi khởi động nếu phát hiện định dạng cấu hình cũ, nên cấu hình cũ được sửa mà không cần can thiệp thủ công. Di chuyển kho Cron job được xử lý bởi `openclaw doctor --fix`.

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
    - Với các kênh có `accounts` được đặt tên nhưng vẫn còn các giá trị kênh cấp cao nhất cho một tài khoản đơn lẻ, hãy di chuyển các giá trị theo phạm vi tài khoản đó vào tài khoản được thăng cấp đã chọn cho kênh đó (`accounts.default` cho hầu hết kênh; Matrix có thể giữ lại một đích có tên/mặc định khớp hiện có)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - xóa `agents.defaults.llm`; dùng `models.providers.<id>.timeoutSeconds` cho thời gian chờ nhà cung cấp/mô hình chậm
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - xóa `browser.relayBindHost` (thiết lập chuyển tiếp tiện ích mở rộng cũ)
    - `models.providers.*.api: "openai"` cũ → `"openai-completions"` (khởi động Gateway cũng bỏ qua các nhà cung cấp có `api` được đặt thành giá trị enum tương lai hoặc không xác định thay vì đóng thất bại)

    Cảnh báo của Doctor cũng bao gồm hướng dẫn tài khoản mặc định cho các kênh nhiều tài khoản:

    - Nếu hai hoặc nhiều mục `channels.<channel>.accounts` được cấu hình mà không có `channels.<channel>.defaultAccount` hoặc `accounts.default`, doctor cảnh báo rằng định tuyến dự phòng có thể chọn một tài khoản không mong muốn.
    - Nếu `channels.<channel>.defaultAccount` được đặt thành một ID tài khoản không xác định, doctor cảnh báo và liệt kê các ID tài khoản đã cấu hình.

  </Accordion>
  <Accordion title="2b. Ghi đè nhà cung cấp OpenCode">
    Nếu bạn đã thêm thủ công `models.providers.opencode`, `opencode-zen`, hoặc `opencode-go`, cấu hình đó sẽ ghi đè danh mục OpenCode tích hợp từ `@mariozechner/pi-ai`. Điều đó có thể ép các mô hình dùng sai API hoặc đưa chi phí về 0. Doctor cảnh báo để bạn có thể xóa phần ghi đè và khôi phục định tuyến API + chi phí theo từng mô hình.
  </Accordion>
  <Accordion title="2c. Di chuyển trình duyệt và mức sẵn sàng của Chrome MCP">
    Nếu cấu hình trình duyệt của bạn vẫn trỏ đến đường dẫn tiện ích Chrome đã bị xóa, doctor chuẩn hóa nó sang mô hình đính kèm Chrome MCP host-local hiện tại:

    - `browser.profiles.*.driver: "extension"` trở thành `"existing-session"`
    - `browser.relayBindHost` bị xóa

    Doctor cũng kiểm tra đường dẫn Chrome MCP host-local khi bạn dùng `defaultProfile: "user"` hoặc một hồ sơ `existing-session` đã cấu hình:

    - kiểm tra liệu Google Chrome đã được cài trên cùng máy chủ cho các hồ sơ tự động kết nối mặc định hay chưa
    - kiểm tra phiên bản Chrome được phát hiện và cảnh báo khi phiên bản đó thấp hơn Chrome 144
    - nhắc bạn bật gỡ lỗi từ xa trong trang kiểm tra của trình duyệt (ví dụ `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, hoặc `edge://inspect/#remote-debugging`)

    Doctor không thể bật thiết lập phía Chrome thay bạn. Chrome MCP host-local vẫn yêu cầu:

    - một trình duyệt dựa trên Chromium phiên bản 144+ trên máy chủ gateway/node
    - trình duyệt đang chạy cục bộ
    - gỡ lỗi từ xa được bật trong trình duyệt đó
    - phê duyệt lời nhắc đồng ý đính kèm lần đầu trong trình duyệt

    Mức sẵn sàng ở đây chỉ liên quan đến các điều kiện tiên quyết để đính kèm cục bộ. Existing-session giữ nguyên các giới hạn tuyến Chrome MCP hiện tại; các tuyến nâng cao như `responsebody`, xuất PDF, chặn tải xuống và hành động theo lô vẫn yêu cầu trình duyệt được quản lý hoặc hồ sơ CDP thô.

    Kiểm tra này **không** áp dụng cho Docker, sandbox, remote-browser hoặc các luồng headless khác. Các luồng đó tiếp tục dùng CDP thô.

  </Accordion>
  <Accordion title="2d. Điều kiện tiên quyết OAuth TLS">
    Khi một hồ sơ OpenAI Codex OAuth được cấu hình, doctor thăm dò điểm cuối ủy quyền OpenAI để xác minh rằng ngăn xếp TLS Node/OpenSSL cục bộ có thể xác thực chuỗi chứng chỉ. Nếu thăm dò thất bại với lỗi chứng chỉ (ví dụ `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, chứng chỉ hết hạn, hoặc chứng chỉ tự ký), doctor in hướng dẫn sửa lỗi theo từng nền tảng. Trên macOS với Node từ Homebrew, cách sửa thường là `brew postinstall ca-certificates`. Với `--deep`, thăm dò vẫn chạy ngay cả khi gateway khỏe mạnh.
  </Accordion>
  <Accordion title="2e. Ghi đè nhà cung cấp Codex OAuth">
    Nếu trước đây bạn đã thêm các thiết lập vận chuyển OpenAI cũ dưới `models.providers.openai-codex`, chúng có thể che khuất đường dẫn nhà cung cấp Codex OAuth tích hợp mà các bản phát hành mới hơn tự động dùng. Doctor cảnh báo khi thấy các thiết lập vận chuyển cũ đó cùng với Codex OAuth, để bạn có thể xóa hoặc viết lại phần ghi đè vận chuyển lỗi thời và khôi phục hành vi định tuyến/dự phòng tích hợp. Proxy tùy chỉnh và ghi đè chỉ tiêu đề vẫn được hỗ trợ và không kích hoạt cảnh báo này.
  </Accordion>
  <Accordion title="2f. Cảnh báo tuyến Plugin Codex">
    Khi Plugin Codex đi kèm được bật, doctor cũng kiểm tra liệu các tham chiếu mô hình chính `openai-codex/*` có vẫn phân giải qua trình chạy PI mặc định hay không. Tổ hợp đó hợp lệ khi bạn muốn xác thực Codex OAuth/đăng ký qua PI, nhưng rất dễ nhầm với bộ chạy app-server Codex gốc. Doctor cảnh báo và trỏ đến dạng app-server tường minh: `openai/*` cộng với `agentRuntime.id: "codex"` hoặc `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor không tự động sửa điều này vì cả hai tuyến đều hợp lệ:

    - `openai-codex/*` + PI nghĩa là "dùng xác thực Codex OAuth/đăng ký qua trình chạy OpenClaw thông thường."
    - `openai/*` + `agentRuntime.id: "codex"` nghĩa là "chạy lượt nhúng qua app-server Codex gốc."
    - `/codex ...` nghĩa là "điều khiển hoặc ràng buộc một cuộc trò chuyện Codex gốc từ chat."
    - `/acp ...` hoặc `runtime: "acp"` nghĩa là "dùng bộ chuyển đổi ACP/acpx bên ngoài."

    Nếu cảnh báo xuất hiện, hãy chọn tuyến bạn dự định dùng và chỉnh cấu hình thủ công. Giữ nguyên cảnh báo khi PI Codex OAuth là chủ ý.

  </Accordion>
  <Accordion title="3. Di chuyển trạng thái cũ (bố cục đĩa)">
    Doctor có thể di chuyển các bố cục cũ trên đĩa sang cấu trúc hiện tại:

    - Kho phiên + bản ghi:
      - từ `~/.openclaw/sessions/` sang `~/.openclaw/agents/<agentId>/sessions/`
    - Thư mục tác tử:
      - từ `~/.openclaw/agent/` sang `~/.openclaw/agents/<agentId>/agent/`
    - Trạng thái xác thực WhatsApp (Baileys):
      - từ `~/.openclaw/credentials/*.json` cũ (ngoại trừ `oauth.json`)
      - sang `~/.openclaw/credentials/whatsapp/<accountId>/...` (id tài khoản mặc định: `default`)

    Các lần di chuyển này là nỗ lực tối đa và có tính lũy đẳng; doctor sẽ phát cảnh báo khi để lại bất kỳ thư mục cũ nào làm bản sao lưu. Gateway/CLI cũng tự động di chuyển phiên cũ + thư mục tác tử khi khởi động để lịch sử/xác thực/mô hình nằm trong đường dẫn theo từng tác tử mà không cần chạy doctor thủ công. Xác thực WhatsApp cố ý chỉ được di chuyển qua `openclaw doctor`. Chuẩn hóa nhà cung cấp/bản đồ nhà cung cấp Talk hiện so sánh bằng đẳng thức cấu trúc, nên các khác biệt chỉ do thứ tự khóa không còn kích hoạt lặp lại các thay đổi `doctor --fix` không tác dụng.

  </Accordion>
  <Accordion title="3a. Di chuyển manifest Plugin cũ">
    Doctor quét tất cả manifest Plugin đã cài để tìm các khóa capability cấp cao nhất đã ngừng dùng (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Khi tìm thấy, nó đề nghị di chuyển chúng vào đối tượng `contracts` và viết lại tệp manifest tại chỗ. Lần di chuyển này có tính lũy đẳng; nếu khóa `contracts` đã có cùng các giá trị, khóa cũ sẽ bị xóa mà không sao chép dữ liệu.
  </Accordion>
  <Accordion title="3b. Di chuyển kho Cron cũ">
    Doctor cũng kiểm tra kho tác vụ cron (`~/.openclaw/cron/jobs.json` theo mặc định, hoặc `cron.store` khi được ghi đè) để tìm các dạng tác vụ cũ mà bộ lập lịch vẫn chấp nhận vì tương thích.

    Các bước dọn dẹp cron hiện tại bao gồm:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - các trường payload cấp cao nhất (`message`, `model`, `thinking`, ...) → `payload`
    - các trường phân phối cấp cao nhất (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias phân phối `provider` trong payload → `delivery.channel` tường minh
    - các tác vụ dự phòng webhook `notify: true` cũ đơn giản → `delivery.mode="webhook"` tường minh với `delivery.to=cron.webhook`

    Doctor chỉ tự động di chuyển các tác vụ `notify: true` khi có thể làm vậy mà không thay đổi hành vi. Nếu một tác vụ kết hợp dự phòng notify cũ với chế độ phân phối không phải webhook hiện có, doctor cảnh báo và để tác vụ đó lại cho bạn xem xét thủ công.

    Trên Linux, doctor cũng cảnh báo khi crontab của người dùng vẫn gọi `~/.openclaw/bin/ensure-whatsapp.sh` cũ. Script host-local đó không được OpenClaw hiện tại bảo trì và có thể ghi các thông báo `Gateway inactive` sai vào `~/.openclaw/logs/whatsapp-health.log` khi cron không thể truy cập systemd user bus. Xóa mục crontab lỗi thời bằng `crontab -e`; dùng `openclaw channels status --probe`, `openclaw doctor`, và `openclaw gateway status` cho các kiểm tra sức khỏe hiện tại.

  </Accordion>
  <Accordion title="3c. Dọn dẹp khóa phiên">
    Doctor quét mọi thư mục phiên tác tử để tìm các tệp khóa ghi cũ — những tệp còn sót lại khi một phiên thoát bất thường. Với mỗi tệp khóa tìm thấy, nó báo cáo: đường dẫn, PID, PID còn hoạt động hay không, tuổi khóa và khóa có được xem là cũ hay không (PID đã chết hoặc cũ hơn 30 phút). Ở chế độ `--fix` / `--repair`, nó tự động xóa các tệp khóa cũ; nếu không, nó in một ghi chú và hướng dẫn bạn chạy lại với `--fix`.
  </Accordion>
  <Accordion title="3d. Sửa nhánh bản ghi phiên">
    Doctor quét các tệp JSONL phiên tác tử để tìm cấu trúc nhánh bị trùng lặp do lỗi viết lại bản ghi lời nhắc ngày 2026.4.24 tạo ra: một lượt người dùng bị bỏ lại có ngữ cảnh runtime nội bộ của OpenClaw cùng với một nhánh anh em đang hoạt động chứa cùng lời nhắc người dùng hiển thị. Ở chế độ `--fix` / `--repair`, doctor sao lưu từng tệp bị ảnh hưởng ngay cạnh tệp gốc và viết lại bản ghi về nhánh đang hoạt động để lịch sử gateway và trình đọc bộ nhớ không còn thấy các lượt trùng lặp.
  </Accordion>
  <Accordion title="4. Kiểm tra tính toàn vẹn trạng thái (lưu phiên, định tuyến và an toàn)">
    Thư mục trạng thái là phần lõi vận hành. Nếu nó biến mất, bạn sẽ mất phiên, thông tin xác thực, nhật ký và cấu hình (trừ khi bạn có bản sao lưu ở nơi khác).

    Doctor kiểm tra:

    - **Thiếu thư mục trạng thái**: cảnh báo về mất trạng thái nghiêm trọng, nhắc tạo lại thư mục và nhắc bạn rằng nó không thể khôi phục dữ liệu đã mất.
    - **Quyền của thư mục trạng thái**: xác minh khả năng ghi; đề nghị sửa quyền (và phát gợi ý `chown` khi phát hiện chủ sở hữu/nhóm không khớp).
    - **Thư mục trạng thái đồng bộ đám mây trên macOS**: cảnh báo khi trạng thái trỏ vào iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) hoặc `~/Library/CloudStorage/...` vì các đường dẫn có đồng bộ có thể gây I/O chậm hơn và tranh chấp khóa/đồng bộ.
    - **Thư mục trạng thái trên SD hoặc eMMC của Linux**: cảnh báo khi trạng thái trỏ đến nguồn gắn kết `mmcblk*`, vì I/O ngẫu nhiên dựa trên SD hoặc eMMC có thể chậm hơn và hao mòn nhanh hơn khi ghi phiên và thông tin xác thực.
    - **Thiếu thư mục phiên**: `sessions/` và thư mục kho phiên là bắt buộc để lưu lịch sử và tránh sự cố `ENOENT`.
    - **Bản ghi không khớp**: cảnh báo khi các mục phiên gần đây thiếu tệp bản ghi.
    - **Phiên chính "JSONL 1 dòng"**: đánh dấu khi bản ghi chính chỉ có một dòng (lịch sử không được tích lũy).
    - **Nhiều thư mục trạng thái**: cảnh báo khi tồn tại nhiều thư mục `~/.openclaw` trên các thư mục home hoặc khi `OPENCLAW_STATE_DIR` trỏ đến nơi khác (lịch sử có thể bị tách giữa các bản cài đặt).
    - **Nhắc nhở chế độ từ xa**: nếu `gateway.mode=remote`, doctor nhắc bạn chạy nó trên máy chủ từ xa (trạng thái nằm ở đó).
    - **Quyền của tệp cấu hình**: cảnh báo nếu `~/.openclaw/openclaw.json` có thể được đọc bởi nhóm/mọi người và đề nghị siết lại thành `600`.

  </Accordion>
  <Accordion title="5. Sức khỏe xác thực mô hình (OAuth hết hạn)">
    Doctor kiểm tra các hồ sơ OAuth trong kho xác thực, cảnh báo khi token sắp hết hạn/đã hết hạn và có thể làm mới chúng khi an toàn. Nếu hồ sơ OAuth/token của Anthropic đã cũ, nó gợi ý khóa API Anthropic hoặc đường dẫn setup-token của Anthropic. Lời nhắc làm mới chỉ xuất hiện khi chạy tương tác (TTY); `--non-interactive` bỏ qua các lần thử làm mới.

    Khi làm mới OAuth thất bại vĩnh viễn (ví dụ `refresh_token_reused`, `invalid_grant` hoặc nhà cung cấp yêu cầu bạn đăng nhập lại), doctor báo rằng cần xác thực lại và in đúng lệnh `openclaw models auth login --provider ...` cần chạy.

    Doctor cũng báo cáo các hồ sơ xác thực tạm thời không dùng được do:

    - thời gian chờ ngắn (giới hạn tốc độ/hết thời gian chờ/lỗi xác thực)
    - vô hiệu hóa lâu hơn (lỗi thanh toán/tín dụng)

  </Accordion>
  <Accordion title="6. Xác thực mô hình hooks">
    Nếu `hooks.gmail.model` được đặt, doctor xác thực tham chiếu mô hình theo danh mục và danh sách cho phép, rồi cảnh báo khi nó không phân giải được hoặc không được phép.
  </Accordion>
  <Accordion title="7. Sửa ảnh sandbox">
    Khi sandbox được bật, doctor kiểm tra ảnh Docker và đề nghị build hoặc chuyển sang tên kế thừa nếu thiếu ảnh hiện tại.
  </Accordion>
  <Accordion title="7b. Dọn dẹp cài đặt Plugin">
    Doctor xóa trạng thái dàn dựng phụ thuộc Plugin cũ do OpenClaw tạo ra trong chế độ `openclaw doctor --fix` / `openclaw doctor --repair`. Việc này bao gồm các gốc phụ thuộc đã tạo bị cũ, thư mục giai đoạn cài đặt cũ và rác cục bộ theo gói từ mã sửa phụ thuộc Plugin đóng gói trước đây.

    Doctor cũng có thể cài đặt lại các Plugin có thể tải xuống đã được cấu hình khi cấu hình tham chiếu đến chúng nhưng registry Plugin cục bộ không tìm thấy chúng. Với việc tách Plugin đóng gói ra ngoài vào ngày 2026.5.2, doctor tự động cài đặt các Plugin có thể tải xuống mà cấu hình hiện có đang dùng, rồi dựa vào `meta.lastTouchedVersion` để chỉ chạy lượt phát hành đó một lần. Khởi động Gateway và tải lại cấu hình không chạy trình quản lý gói; cài đặt Plugin vẫn là công việc doctor/cài đặt/cập nhật rõ ràng.

  </Accordion>
  <Accordion title="8. Di chuyển dịch vụ Gateway và gợi ý dọn dẹp">
    Doctor phát hiện các dịch vụ gateway kế thừa (launchd/systemd/schtasks) và đề nghị xóa chúng rồi cài đặt dịch vụ OpenClaw bằng cổng gateway hiện tại. Nó cũng có thể quét các dịch vụ giống gateway bổ sung và in gợi ý dọn dẹp. Các dịch vụ gateway OpenClaw có tên theo hồ sơ được xem là thành phần chính thức và không bị đánh dấu là "bổ sung."

    Trên Linux, nếu thiếu dịch vụ gateway cấp người dùng nhưng tồn tại dịch vụ gateway OpenClaw cấp hệ thống, doctor không tự động cài đặt dịch vụ cấp người dùng thứ hai. Kiểm tra bằng `openclaw gateway status --deep` hoặc `openclaw doctor --deep`, rồi xóa bản trùng lặp hoặc đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một trình giám sát hệ thống sở hữu vòng đời gateway.

  </Accordion>
  <Accordion title="8b. Di chuyển Startup Matrix">
    Khi tài khoản kênh Matrix có một lần di chuyển trạng thái kế thừa đang chờ hoặc có thể hành động, doctor (ở chế độ `--fix` / `--repair`) tạo ảnh chụp trước di chuyển rồi chạy các bước di chuyển theo nỗ lực tốt nhất: di chuyển trạng thái Matrix kế thừa và chuẩn bị trạng thái mã hóa kế thừa. Cả hai bước đều không gây lỗi nghiêm trọng; lỗi được ghi nhật ký và quá trình khởi động tiếp tục. Ở chế độ chỉ đọc (`openclaw doctor` không có `--fix`), kiểm tra này bị bỏ qua hoàn toàn.
  </Accordion>
  <Accordion title="8c. Ghép nối thiết bị và lệch xác thực">
    Doctor hiện kiểm tra trạng thái ghép nối thiết bị như một phần của lượt kiểm tra sức khỏe thông thường.

    Nội dung nó báo cáo:

    - các yêu cầu ghép nối lần đầu đang chờ xử lý
    - các nâng cấp vai trò đang chờ xử lý cho thiết bị đã ghép nối
    - các nâng cấp phạm vi đang chờ xử lý cho thiết bị đã ghép nối
    - sửa lỗi khóa công khai không khớp khi id thiết bị vẫn khớp nhưng danh tính thiết bị không còn khớp với bản ghi đã phê duyệt
    - bản ghi đã ghép nối thiếu token đang hoạt động cho vai trò đã phê duyệt
    - token đã ghép nối có phạm vi lệch khỏi đường cơ sở ghép nối đã phê duyệt
    - các mục device-token được lưu cache cục bộ cho máy hiện tại có trước một lần xoay vòng token phía gateway hoặc mang metadata phạm vi đã cũ

    Doctor không tự động phê duyệt yêu cầu ghép nối hoặc tự động xoay vòng token thiết bị. Thay vào đó, Doctor in ra các bước tiếp theo chính xác:

    - kiểm tra các yêu cầu đang chờ xử lý bằng `openclaw devices list`
    - phê duyệt đúng yêu cầu bằng `openclaw devices approve <requestId>`
    - xoay vòng token mới bằng `openclaw devices rotate --device <deviceId> --role <role>`
    - xóa và phê duyệt lại bản ghi đã cũ bằng `openclaw devices remove <deviceId>`

    Điều này khép lại lỗ hổng phổ biến "đã ghép nối nhưng vẫn nhận yêu cầu ghép nối": Doctor giờ đây phân biệt ghép nối lần đầu với các nâng cấp vai trò/phạm vi đang chờ xử lý và với tình trạng token/danh tính thiết bị đã cũ hoặc bị lệch.

  </Accordion>
  <Accordion title="9. Cảnh báo bảo mật">
    Doctor phát cảnh báo khi một provider mở cho DM mà không có allowlist, hoặc khi một chính sách được cấu hình theo cách nguy hiểm.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Nếu chạy dưới dạng dịch vụ người dùng systemd, Doctor đảm bảo lingering được bật để gateway vẫn hoạt động sau khi đăng xuất.
  </Accordion>
  <Accordion title="11. Trạng thái workspace (skills, plugins và thư mục kế thừa)">
    Doctor in bản tóm tắt trạng thái workspace cho agent mặc định:

    - **Trạng thái Skills**: đếm các skill đủ điều kiện, thiếu yêu cầu và bị allowlist chặn.
    - **Thư mục workspace kế thừa**: cảnh báo khi `~/openclaw` hoặc các thư mục workspace kế thừa khác tồn tại cùng với workspace hiện tại.
    - **Trạng thái Plugin**: đếm Plugin đã bật/đã tắt/bị lỗi; liệt kê ID plugin cho mọi lỗi; báo cáo năng lực plugin trong bundle.
    - **Cảnh báo tương thích Plugin**: đánh dấu các plugin có vấn đề tương thích với runtime hiện tại.
    - **Chẩn đoán Plugin**: hiển thị mọi cảnh báo hoặc lỗi lúc tải do registry plugin phát ra.

  </Accordion>
  <Accordion title="11b. Kích thước tệp bootstrap">
    Doctor kiểm tra xem các tệp bootstrap workspace (ví dụ `AGENTS.md`, `CLAUDE.md`, hoặc các tệp ngữ cảnh được chèn khác) có gần hoặc vượt ngân sách ký tự đã cấu hình hay không. Doctor báo cáo số ký tự thô so với đã chèn theo từng tệp, phần trăm cắt ngắn, nguyên nhân cắt ngắn (`max/file` hoặc `max/total`), và tổng số ký tự đã chèn dưới dạng tỷ lệ của tổng ngân sách. Khi các tệp bị cắt ngắn hoặc gần giới hạn, Doctor in mẹo để tinh chỉnh `agents.defaults.bootstrapMaxChars` và `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Dọn dẹp plugin kênh đã cũ">
    Khi `openclaw doctor --fix` xóa một plugin kênh bị thiếu, nó cũng xóa cấu hình thuộc phạm vi kênh bị treo có tham chiếu đến plugin đó: các mục `channels.<id>`, các mục tiêu heartbeat nêu tên kênh, và các override `agents.*.models["<channel>/*"]`. Điều này ngăn vòng lặp khởi động Gateway khi runtime kênh đã biến mất nhưng cấu hình vẫn yêu cầu gateway liên kết tới nó.
  </Accordion>
  <Accordion title="11c. Tự động hoàn thành shell">
    Doctor kiểm tra xem tính năng hoàn thành bằng phím tab đã được cài đặt cho shell hiện tại hay chưa (zsh, bash, fish, hoặc PowerShell):

    - Nếu profile shell dùng mẫu hoàn thành động chậm (`source <(openclaw completion ...)`), Doctor nâng cấp nó lên biến thể tệp cache nhanh hơn.
    - Nếu completion được cấu hình trong profile nhưng thiếu tệp cache, Doctor tự động tạo lại cache.
    - Nếu chưa cấu hình completion, Doctor nhắc cài đặt (chỉ ở chế độ tương tác; bỏ qua với `--non-interactive`).

    Chạy `openclaw completion --write-state` để tạo lại cache thủ công.

  </Accordion>
  <Accordion title="12. Kiểm tra xác thực Gateway (token cục bộ)">
    Doctor kiểm tra mức sẵn sàng của xác thực token gateway cục bộ.

    - Nếu chế độ token cần token và không có nguồn token nào tồn tại, Doctor đề xuất tạo một token.
    - Nếu `gateway.auth.token` được quản lý bằng SecretRef nhưng không khả dụng, Doctor cảnh báo và không ghi đè nó bằng plaintext.
    - `openclaw doctor --generate-gateway-token` chỉ buộc tạo token khi không có SecretRef token nào được cấu hình.

  </Accordion>
  <Accordion title="12b. Sửa chữa có nhận biết SecretRef ở chế độ chỉ đọc">
    Một số luồng sửa chữa cần kiểm tra thông tin xác thực đã cấu hình mà không làm suy yếu hành vi fail-fast của runtime.

    - `openclaw doctor --fix` giờ dùng cùng mô hình tóm tắt SecretRef chỉ đọc như các lệnh thuộc nhóm trạng thái cho các sửa chữa cấu hình có mục tiêu.
    - Ví dụ: sửa chữa `allowFrom` / `groupAllowFrom` `@username` của Telegram cố gắng dùng thông tin xác thực bot đã cấu hình khi khả dụng.
    - Nếu token bot Telegram được cấu hình qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại, Doctor báo cáo rằng thông tin xác thực đã được cấu hình nhưng không khả dụng và bỏ qua tự động phân giải thay vì crash hoặc báo sai rằng token bị thiếu.

  </Accordion>
  <Accordion title="13. Kiểm tra sức khỏe Gateway + khởi động lại">
    Doctor chạy kiểm tra sức khỏe và đề xuất khởi động lại gateway khi gateway có vẻ không khỏe.
  </Accordion>
  <Accordion title="13b. Mức sẵn sàng tìm kiếm bộ nhớ">
    Doctor kiểm tra xem nhà cung cấp embedding tìm kiếm bộ nhớ đã cấu hình có sẵn sàng cho agent mặc định hay chưa. Hành vi phụ thuộc vào backend và nhà cung cấp đã cấu hình:

    - **Backend QMD**: thăm dò xem binary `qmd` có sẵn và có thể khởi động hay không. Nếu không, in hướng dẫn khắc phục bao gồm gói npm và tùy chọn đường dẫn binary thủ công.
    - **Nhà cung cấp cục bộ tường minh**: kiểm tra tệp mô hình cục bộ hoặc URL mô hình từ xa/có thể tải xuống được nhận diện. Nếu thiếu, đề xuất chuyển sang nhà cung cấp từ xa.
    - **Nhà cung cấp từ xa tường minh** (`openai`, `voyage`, v.v.): xác minh khóa API có trong môi trường hoặc kho xác thực. In gợi ý khắc phục có thể thực hiện nếu thiếu.
    - **Nhà cung cấp tự động**: kiểm tra khả dụng của mô hình cục bộ trước, sau đó thử từng nhà cung cấp từ xa theo thứ tự tự động chọn.

    Khi có kết quả thăm dò Gateway trong bộ nhớ đệm (Gateway khỏe tại thời điểm kiểm tra), doctor đối chiếu chéo kết quả đó với cấu hình mà CLI thấy được và ghi chú mọi khác biệt. Doctor không bắt đầu lượt ping embedding mới trên đường dẫn mặc định; hãy dùng lệnh trạng thái bộ nhớ sâu khi bạn muốn kiểm tra trực tiếp nhà cung cấp.

    Dùng `openclaw memory status --deep` để xác minh mức sẵn sàng embedding lúc chạy.

  </Accordion>
  <Accordion title="14. Cảnh báo trạng thái kênh">
    Nếu Gateway khỏe, doctor chạy thăm dò trạng thái kênh và báo cáo cảnh báo kèm các cách khắc phục được đề xuất.
  </Accordion>
  <Accordion title="15. Kiểm tra cấu hình supervisor + sửa chữa">
    Doctor kiểm tra cấu hình supervisor đã cài đặt (launchd/systemd/schtasks) để tìm các mặc định bị thiếu hoặc lỗi thời (ví dụ: phụ thuộc network-online của systemd và độ trễ khởi động lại). Khi phát hiện không khớp, doctor khuyến nghị cập nhật và có thể ghi lại tệp service/task theo mặc định hiện tại.

    Ghi chú:

    - `openclaw doctor` hỏi trước khi ghi lại cấu hình supervisor.
    - `openclaw doctor --yes` chấp nhận các lời nhắc sửa chữa mặc định.
    - `openclaw doctor --repair` áp dụng các cách khắc phục được khuyến nghị mà không hỏi.
    - `openclaw doctor --repair --force` ghi đè cấu hình supervisor tùy chỉnh.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` giữ doctor ở chế độ chỉ đọc cho vòng đời service Gateway. Doctor vẫn báo cáo sức khỏe service và chạy các sửa chữa không liên quan đến service, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap service, ghi lại cấu hình supervisor, và dọn dẹp service cũ vì một supervisor bên ngoài sở hữu vòng đời đó.
    - Trên Linux, doctor không ghi lại siêu dữ liệu lệnh/entrypoint khi unit Gateway systemd khớp đang hoạt động. Doctor cũng bỏ qua các unit phụ giống Gateway không hoạt động và không phải legacy trong quá trình quét service trùng lặp để các tệp service đồng hành không tạo nhiễu dọn dẹp.
    - Nếu xác thực bằng token yêu cầu token và `gateway.auth.token` được quản lý bằng SecretRef, cài đặt/sửa chữa service của doctor xác thực SecretRef nhưng không lưu giá trị token văn bản thuần đã phân giải vào siêu dữ liệu môi trường service của supervisor.
    - Doctor phát hiện các giá trị môi trường service được quản lý bằng `.env`/SecretRef mà các bản cài LaunchAgent, systemd hoặc Windows Scheduled Task cũ đã nhúng trực tiếp, rồi ghi lại siêu dữ liệu service để các giá trị đó tải từ nguồn runtime thay vì từ định nghĩa supervisor.
    - Doctor phát hiện khi lệnh service vẫn ghim `--port` cũ sau khi `gateway.port` thay đổi và ghi lại siêu dữ liệu service sang cổng hiện tại.
    - Nếu xác thực bằng token yêu cầu token và SecretRef token đã cấu hình không phân giải được, doctor chặn đường dẫn cài đặt/sửa chữa kèm hướng dẫn có thể thực hiện.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, doctor chặn cài đặt/sửa chữa cho đến khi mode được đặt tường minh.
    - Với các unit user-systemd trên Linux, kiểm tra drift token của doctor hiện bao gồm cả nguồn `Environment=` và `EnvironmentFile=` khi so sánh siêu dữ liệu xác thực service.
    - Sửa chữa service của Doctor từ chối ghi lại, dừng hoặc khởi động lại service Gateway từ binary OpenClaw cũ hơn khi cấu hình được ghi lần cuối bởi phiên bản mới hơn. Xem [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Bạn luôn có thể buộc ghi lại toàn bộ qua `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Runtime Gateway + chẩn đoán cổng">
    Doctor kiểm tra runtime service (PID, trạng thái thoát gần nhất) và cảnh báo khi service đã được cài đặt nhưng thực tế không chạy. Doctor cũng kiểm tra xung đột cổng trên cổng Gateway (mặc định `18789`) và báo cáo các nguyên nhân có khả năng xảy ra (Gateway đã chạy, đường hầm SSH).
  </Accordion>
  <Accordion title="17. Thực hành tốt nhất cho runtime Gateway">
    Doctor cảnh báo khi service Gateway chạy trên Bun hoặc đường dẫn Node do trình quản lý phiên bản quản lý (`nvm`, `fnm`, `volta`, `asdf`, v.v.). Các kênh WhatsApp + Telegram yêu cầu Node, và đường dẫn trình quản lý phiên bản có thể hỏng sau khi nâng cấp vì service không tải shell init của bạn. Doctor đề xuất di chuyển sang bản cài Node hệ thống khi có sẵn (Homebrew/apt/choco).

    Các LaunchAgent macOS mới cài đặt hoặc sửa chữa dùng PATH hệ thống chuẩn (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) thay vì sao chép PATH của shell tương tác, để Volta, asdf, fnm, pnpm và các thư mục trình quản lý phiên bản khác không thay đổi Node mà các tiến trình con phân giải. Service Linux vẫn giữ các gốc môi trường tường minh (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) và các thư mục user-bin ổn định, nhưng các thư mục dự phòng trình quản lý phiên bản được phỏng đoán chỉ được ghi vào PATH của service khi các thư mục đó tồn tại trên đĩa.

  </Accordion>
  <Accordion title="18. Ghi cấu hình + siêu dữ liệu wizard">
    Doctor lưu mọi thay đổi cấu hình và đóng dấu siêu dữ liệu wizard để ghi lại lần chạy doctor.
  </Accordion>
  <Accordion title="19. Mẹo workspace (sao lưu + hệ thống bộ nhớ)">
    Doctor đề xuất hệ thống bộ nhớ workspace khi thiếu và in mẹo sao lưu nếu workspace chưa nằm dưới git.

    Xem [/concepts/agent-workspace](/vi/concepts/agent-workspace) để biết hướng dẫn đầy đủ về cấu trúc workspace và sao lưu git (khuyến nghị GitHub hoặc GitLab riêng tư).

  </Accordion>
</AccordionGroup>

## Liên quan

- [Runbook Gateway](/vi/gateway)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
