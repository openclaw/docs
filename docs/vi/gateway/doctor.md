---
read_when:
    - Thêm hoặc sửa đổi các bản di trú của công cụ chẩn đoán
    - Giới thiệu các thay đổi cấu hình có tính phá vỡ
sidebarTitle: Doctor
summary: 'Lệnh doctor: kiểm tra tình trạng, di trú cấu hình và các bước sửa chữa'
title: Trình chẩn đoán
x-i18n:
    generated_at: "2026-06-27T17:29:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdb5e3fb437a8678c427dee698a0ea6004b22b71c6e38cc6f75ba674fa4fcc5e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` là công cụ sửa chữa + di trú cho OpenClaw. Công cụ này sửa cấu hình/trạng thái lỗi thời, kiểm tra tình trạng hoạt động và cung cấp các bước sửa chữa có thể thực hiện.

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

    Chấp nhận các giá trị mặc định mà không hỏi (bao gồm các bước sửa chữa khởi động lại/dịch vụ/sandbox khi áp dụng).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    Áp dụng các sửa chữa được đề xuất mà không hỏi (sửa chữa + khởi động lại khi an toàn).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    Chạy các kiểm tra tình trạng hoạt động có cấu trúc cho CI hoặc tự động hóa kiểm tra trước. Chế độ này là chỉ đọc: nó không hỏi, sửa chữa, di trú cấu hình, khởi động lại dịch vụ hoặc chạm vào trạng thái.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    Cũng áp dụng các sửa chữa mạnh tay (ghi đè cấu hình supervisor tùy chỉnh).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Chạy không có lời nhắc và chỉ áp dụng các di trú an toàn (chuẩn hóa cấu hình + di chuyển trạng thái trên đĩa). Bỏ qua các hành động khởi động lại/dịch vụ/sandbox cần xác nhận của con người. Các di trú trạng thái cũ tự động chạy khi được phát hiện.

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

## Chế độ lint chỉ đọc

`openclaw doctor --lint` là phiên bản thân thiện với tự động hóa của
`openclaw doctor --fix`. Cả hai đều dùng các kiểm tra tình trạng hoạt động của doctor, nhưng tư thế vận hành khác nhau:

| Chế độ                  | Lời nhắc   | Ghi cấu hình/trạng thái | Đầu ra                              | Dùng cho                              |
| ----------------------- | ---------- | ----------------------- | ----------------------------------- | ------------------------------------- |
| `openclaw doctor`        | có         | không                   | báo cáo tình trạng thân thiện       | người kiểm tra trạng thái             |
| `openclaw doctor --fix`  | đôi khi    | có, theo chính sách sửa | nhật ký sửa chữa thân thiện         | áp dụng các sửa chữa đã được phê duyệt |
| `openclaw doctor --lint` | không      | không                   | phát hiện có cấu trúc               | CI, kiểm tra trước và cổng rà soát     |

Các kiểm tra tình trạng đã hiện đại hóa có thể cung cấp triển khai `repair()` tùy chọn.
`doctor --fix` áp dụng các sửa chữa đó khi chúng tồn tại và tiếp tục dùng luồng sửa chữa doctor hiện có cho các kiểm tra chưa được di trú.
Hợp đồng sửa chữa có cấu trúc cũng tách báo cáo sửa chữa khỏi phát hiện:
`detect()` báo cáo các phát hiện hiện tại, trong khi `repair()` có thể báo cáo thay đổi,
diff cấu hình/tệp và các tác dụng phụ không phải tệp. Điều đó giữ đường di trú mở cho
`doctor --fix --dry-run` và đầu ra diff trong tương lai mà không khiến kiểm tra lint lập kế hoạch đột biến.

Ví dụ:

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

Đầu ra JSON bao gồm:

- `ok`: liệu có phát hiện hiển thị nào đạt ngưỡng mức độ nghiêm trọng đã chọn hay không
- `checksRun`: số lượng kiểm tra tình trạng hoạt động đã thực thi
- `checksSkipped`: các kiểm tra bị bỏ qua bởi hồ sơ đã chọn, `--only` hoặc `--skip`
- `findings`: chẩn đoán có cấu trúc với `checkId`, `severity`, `message` và
  `path`, `line`, `column`, `ocPath` và `fixHint` tùy chọn

Mã thoát:

- `0`: không có phát hiện nào ở hoặc trên ngưỡng đã chọn
- `1`: một hoặc nhiều phát hiện đạt ngưỡng đã chọn
- `2`: lỗi lệnh/runtime trước khi có thể phát ra phát hiện lint

Dùng `--severity-min info|warning|error` để kiểm soát cả nội dung được in và nội dung
gây ra mã thoát lint khác không. Dùng `--all` để chạy toàn bộ danh mục lint,
bao gồm các kiểm tra sâu hơn cần bật rõ ràng và bị loại khỏi bộ tự động hóa mặc định. Dùng `--only <id>` cho các cổng kiểm tra trước hẹp và
`--skip <id>` để tạm thời loại trừ một kiểm tra gây nhiễu trong khi vẫn giữ phần còn lại của
lần chạy lint hoạt động.
Các tùy chọn đầu ra lint như `--json`, `--severity-min`, `--all`, `--only` và
`--skip` phải đi kèm với `--lint`; các lần chạy doctor và sửa chữa thông thường sẽ từ chối
chúng.

## Công cụ này làm gì (tóm tắt)

<AccordionGroup>
  <Accordion title="Tình trạng, UI và cập nhật">
    - Cập nhật kiểm tra trước tùy chọn cho bản cài đặt git (chỉ tương tác).
    - Kiểm tra độ mới của giao thức UI (xây dựng lại Control UI khi schema giao thức mới hơn).
    - Kiểm tra tình trạng + lời nhắc khởi động lại.
    - Tóm tắt trạng thái Skills (đủ điều kiện/thiếu/bị chặn) và trạng thái Plugin.

  </Accordion>
  <Accordion title="Cấu hình và di trú">
    - Chuẩn hóa cấu hình cho các giá trị cũ.
    - Di trú cấu hình Talk từ các trường phẳng `talk.*` cũ sang `talk.provider` + `talk.providers.<provider>`.
    - Kiểm tra di trú trình duyệt cho cấu hình tiện ích Chrome cũ và mức sẵn sàng Chrome MCP.
    - Cảnh báo ghi đè nhà cung cấp OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Di trú nhà cung cấp/hồ sơ OpenAI Codex cũ (`openai-codex` → `openai`) và cảnh báo che khuất cho `models.providers.openai-codex` lỗi thời.
    - Kiểm tra điều kiện tiên quyết OAuth TLS cho hồ sơ OpenAI Codex OAuth.
    - Cảnh báo danh sách cho phép Plugin/công cụ khi `plugins.allow` mang tính hạn chế nhưng chính sách công cụ vẫn yêu cầu ký tự đại diện hoặc công cụ do Plugin sở hữu.
    - Di trú trạng thái cũ trên đĩa (sessions/thư mục agent/xác thực WhatsApp).
    - Di trú khóa hợp đồng manifest Plugin cũ (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Di trú kho Cron cũ (`jobId`, `schedule.cron`, các trường delivery/payload cấp cao nhất, payload `provider`, các job Webhook dự phòng `notify: true`).
    - Dọn dẹp chính sách runtime toàn agent cũ; chính sách runtime nhà cung cấp/mô hình là bộ chọn tuyến đang hoạt động.
    - Dọn dẹp cấu hình Plugin lỗi thời khi Plugin được bật; khi `plugins.enabled=false`, các tham chiếu Plugin lỗi thời được xem là cấu hình bao chứa bất hoạt và được giữ nguyên.

  </Accordion>
  <Accordion title="Trạng thái và tính toàn vẹn">
    - Kiểm tra tệp khóa phiên và dọn dẹp khóa lỗi thời.
    - Sửa bản ghi phiên cho các nhánh viết lại prompt bị trùng lặp do các bản dựng 2026.4.24 bị ảnh hưởng tạo ra.
    - Phát hiện tombstone phục hồi khởi động lại subagent bị kẹt, với hỗ trợ `--fix` để xóa các cờ phục hồi bị hủy lỗi thời để khi khởi động không tiếp tục xem tiến trình con là đã hủy do khởi động lại.
    - Kiểm tra tính toàn vẹn trạng thái và quyền (sessions, bản ghi, thư mục trạng thái).
    - Kiểm tra quyền tệp cấu hình (chmod 600) khi chạy cục bộ.
    - Tình trạng xác thực mô hình: kiểm tra hết hạn OAuth, có thể làm mới token sắp hết hạn và báo cáo trạng thái cooldown/bị vô hiệu của hồ sơ xác thực.

  </Accordion>
  <Accordion title="Gateway, dịch vụ và supervisor">
    - Sửa image sandbox khi sandbox được bật.
    - Di trú dịch vụ cũ và phát hiện Gateway bổ sung.
    - Di trú trạng thái cũ của kênh Matrix (ở chế độ `--fix` / `--repair`).
    - Kiểm tra runtime Gateway (dịch vụ đã cài nhưng không chạy; nhãn launchd đã lưu cache).
    - Cảnh báo trạng thái kênh (được thăm dò từ Gateway đang chạy).
    - Kiểm tra quyền dành riêng cho kênh nằm dưới `openclaw channels capabilities`; ví dụ, quyền kênh thoại Discord được kiểm tra bằng `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Kiểm tra khả năng phản hồi của WhatsApp cho tình trạng vòng lặp sự kiện Gateway suy giảm trong khi client TUI cục bộ vẫn đang chạy; `--fix` chỉ dừng các client TUI cục bộ đã được xác minh.
    - Sửa tuyến Codex cho các tham chiếu mô hình `openai-codex/*` cũ trong mô hình chính, dự phòng, mô hình tạo ảnh/video, ghi đè heartbeat/subagent/compaction, hook, ghi đè mô hình kênh và ghim tuyến phiên; `--fix` viết lại chúng thành `openai/*`, di trú hồ sơ/thứ tự xác thực `openai-codex:*` sang `openai:*`, xóa các ghim runtime phiên/toàn agent lỗi thời và để lại các tham chiếu agent OpenAI chính tắc trên harness Codex mặc định.
    - Kiểm tra cấu hình supervisor (launchd/systemd/schtasks) với sửa chữa tùy chọn.
    - Dọn dẹp môi trường proxy nhúng cho các dịch vụ Gateway đã ghi lại giá trị shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` trong quá trình cài đặt hoặc cập nhật.
    - Kiểm tra thực hành tốt nhất cho runtime Gateway (Node so với Bun, đường dẫn trình quản lý phiên bản).
    - Chẩn đoán xung đột cổng Gateway (mặc định `18789`).

  </Accordion>
  <Accordion title="Xác thực, bảo mật và ghép đôi">
    - Cảnh báo bảo mật cho chính sách DM mở.
    - Kiểm tra xác thực Gateway cho chế độ token cục bộ (đề xuất tạo token khi không có nguồn token; không ghi đè cấu hình token SecretRef).
    - Phát hiện sự cố ghép đôi thiết bị (yêu cầu ghép đôi lần đầu đang chờ, nâng cấp vai trò/phạm vi đang chờ, sai lệch cache token thiết bị cục bộ lỗi thời và sai lệch xác thực bản ghi đã ghép đôi).

  </Accordion>
  <Accordion title="Workspace và shell">
    - Kiểm tra systemd linger trên Linux.
    - Kiểm tra kích thước tệp bootstrap workspace (cảnh báo bị cắt/gần giới hạn cho tệp ngữ cảnh).
    - Kiểm tra mức sẵn sàng Skills cho agent mặc định; báo cáo các skill được phép nhưng thiếu binary, env, cấu hình hoặc yêu cầu OS, và `--fix` có thể vô hiệu hóa skill không khả dụng trong `skills.entries`.
    - Kiểm tra trạng thái hoàn tất shell và tự động cài đặt/nâng cấp.
    - Kiểm tra mức sẵn sàng của nhà cung cấp embedding tìm kiếm bộ nhớ (mô hình cục bộ, khóa API từ xa hoặc binary QMD).
    - Kiểm tra bản cài đặt từ nguồn (không khớp pnpm workspace, thiếu tài sản UI, thiếu binary tsx).
    - Ghi cấu hình đã cập nhật + siêu dữ liệu wizard.

  </Accordion>
</AccordionGroup>

## Điền bù và đặt lại giao diện Dreams

Cảnh Dreams của Control UI bao gồm các hành động **Điền bù**, **Đặt lại** và **Xóa Grounded** cho quy trình dreaming grounded. Các hành động này dùng phương thức RPC kiểu Gateway doctor, nhưng chúng **không** phải là một phần của sửa chữa/di trú CLI `openclaw doctor`.

Chúng làm gì:

- **Điền bù** quét các tệp `memory/YYYY-MM-DD.md` lịch sử trong workspace đang hoạt động, chạy lượt nhật ký REM grounded và ghi các mục điền bù có thể đảo ngược vào `DREAMS.md`.
- **Đặt lại** chỉ xóa các mục nhật ký điền bù đã được đánh dấu đó khỏi `DREAMS.md`.
- **Xóa Grounded** chỉ xóa các mục ngắn hạn chỉ-grounded đã dàn dựng, đến từ phát lại lịch sử và chưa tích lũy truy hồi trực tiếp hoặc hỗ trợ hằng ngày.

Những gì chúng **không** tự làm:

- chúng không chỉnh sửa `MEMORY.md`
- chúng không chạy đầy đủ các di trú doctor
- chúng không tự động dàn dựng ứng viên grounded vào kho thăng cấp ngắn hạn trực tiếp trừ khi bạn chạy rõ ràng đường dẫn CLI đã dàn dựng trước

Nếu bạn muốn phát lại lịch sử grounded ảnh hưởng đến luồng thăng cấp sâu thông thường, hãy dùng luồng CLI thay thế:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Lệnh đó dàn dựng các ứng viên bền vững grounded vào kho dreaming ngắn hạn trong khi vẫn giữ `DREAMS.md` làm bề mặt rà soát.

## Hành vi chi tiết và lý do

<AccordionGroup>
  <Accordion title="0. Cập nhật tùy chọn (bản cài đặt git)">
    Nếu đây là một checkout git và doctor đang chạy tương tác, nó đề xuất cập nhật (fetch/rebase/build) trước khi chạy doctor.
  </Accordion>
  <Accordion title="1. Chuẩn hóa cấu hình">
    Nếu cấu hình chứa các dạng giá trị cũ (ví dụ `messages.ackReaction` không có ghi đè dành riêng cho kênh), doctor chuẩn hóa chúng vào schema hiện tại.

    Điều đó bao gồm các trường phẳng Talk cũ. Cấu hình giọng nói Talk công khai hiện tại là `talk.provider` + `talk.providers.<provider>`, và cấu hình giọng nói thời gian thực là `talk.realtime.*`. Doctor viết lại các dạng `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` cũ vào bản đồ nhà cung cấp, và viết lại các bộ chọn thời gian thực cấp cao nhất cũ (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) vào `talk.realtime`.

    Doctor cũng cảnh báo khi `plugins.allow` không rỗng và chính sách công cụ dùng
    mục ký tự đại diện hoặc mục công cụ do plugin sở hữu. `tools.allow: ["*"]` chỉ khớp các công cụ
    từ những plugin thực sự tải; nó không bỏ qua danh sách cho phép plugin độc quyền.

  </Accordion>
  <Accordion title="2. Di chuyển khóa cấu hình cũ">
    Khi cấu hình chứa các khóa đã ngừng dùng, các lệnh khác sẽ từ chối chạy và yêu cầu bạn chạy `openclaw doctor`.

    Doctor sẽ:

    - Giải thích những khóa cũ nào đã được tìm thấy.
    - Hiển thị phần di chuyển đã áp dụng.
    - Ghi lại `~/.openclaw/openclaw.json` bằng schema đã cập nhật.

    Quá trình khởi động Gateway từ chối các định dạng cấu hình cũ và yêu cầu bạn chạy `openclaw doctor --fix`; nó không ghi lại `openclaw.json` khi khởi động. Các lần di chuyển kho lưu trữ tác vụ Cron cũng được `openclaw doctor --fix` xử lý.

    Các lần di chuyển hiện tại:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - xóa `channels.webchat` và `gateway.webchat` đã loại bỏ
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` cấp cao nhất
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` cũ → `talk.provider` + `talk.providers.<provider>`
    - bộ chọn Talk thời gian thực cấp cao nhất cũ (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` và `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` và `messages.tts.providers.microsoft`
    - các trường chọn người nói TTS (`voice`/`voiceName`/`voiceId`) → `speakerVoice`/`speakerVoiceId`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` và `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` và `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Với các kênh có `accounts` được đặt tên nhưng vẫn còn các giá trị kênh cấp cao nhất cho một tài khoản, di chuyển các giá trị theo phạm vi tài khoản đó vào tài khoản được nâng cấp đã chọn cho kênh đó (`accounts.default` cho hầu hết kênh; Matrix có thể giữ một đích được đặt tên/mặc định hiện có khớp)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - xóa `agents.defaults.llm`; dùng `models.providers.<id>.timeoutSeconds` cho thời gian chờ provider/model chậm, và giữ thời gian chờ agent/run cao hơn giá trị đó khi toàn bộ lượt chạy cần kéo dài hơn
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - xóa `browser.relayBindHost` (thiết lập chuyển tiếp extension cũ)
    - `models.providers.*.api: "openai"` cũ → `"openai-completions"` (quá trình khởi động Gateway cũng bỏ qua các provider có `api` được đặt thành giá trị enum tương lai hoặc không xác định thay vì đóng theo lỗi)
    - xóa `plugins.entries.codex.config.codexDynamicToolsProfile`; app-server Codex luôn giữ các công cụ workspace gốc Codex ở dạng gốc

    Cảnh báo của Doctor cũng bao gồm hướng dẫn về mặc định tài khoản cho các kênh nhiều tài khoản:

    - Nếu hai hoặc nhiều mục `channels.<channel>.accounts` được cấu hình mà không có `channels.<channel>.defaultAccount` hoặc `accounts.default`, doctor cảnh báo rằng định tuyến dự phòng có thể chọn một tài khoản không mong đợi.
    - Nếu `channels.<channel>.defaultAccount` được đặt thành một ID tài khoản không xác định, doctor cảnh báo và liệt kê các ID tài khoản đã cấu hình.

  </Accordion>
  <Accordion title="2b. Ghi đè provider OpenCode">
    Nếu bạn đã thêm thủ công `models.providers.opencode`, `opencode-zen`, hoặc `opencode-go`, nó sẽ ghi đè danh mục OpenCode tích hợp từ `openclaw/plugin-sdk/llm`. Điều đó có thể ép model dùng sai API hoặc đưa chi phí về không. Doctor cảnh báo để bạn có thể xóa phần ghi đè và khôi phục định tuyến API + chi phí theo từng model.
  </Accordion>
  <Accordion title="2c. Di chuyển trình duyệt và trạng thái sẵn sàng của Chrome MCP">
    Nếu cấu hình trình duyệt của bạn vẫn trỏ đến đường dẫn Chrome extension đã bị xóa, doctor chuẩn hóa nó sang mô hình đính kèm Chrome MCP cục bộ trên host hiện tại:

    - `browser.profiles.*.driver: "extension"` trở thành `"existing-session"`
    - `browser.relayBindHost` bị xóa

    Doctor cũng kiểm tra đường dẫn Chrome MCP cục bộ trên host khi bạn dùng `defaultProfile: "user"` hoặc một profile `existing-session` đã cấu hình:

    - kiểm tra Google Chrome có được cài đặt trên cùng host cho các profile tự động kết nối mặc định hay không
    - kiểm tra phiên bản Chrome phát hiện được và cảnh báo khi thấp hơn Chrome 144
    - nhắc bạn bật gỡ lỗi từ xa trong trang inspect của trình duyệt (ví dụ `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, hoặc `edge://inspect/#remote-debugging`)

    Doctor không thể bật thiết lập phía Chrome thay bạn. Chrome MCP cục bộ trên host vẫn yêu cầu:

    - trình duyệt dựa trên Chromium 144+ trên host gateway/node
    - trình duyệt đang chạy cục bộ
    - đã bật gỡ lỗi từ xa trong trình duyệt đó
    - phê duyệt lời nhắc đồng ý đính kèm đầu tiên trong trình duyệt

    Trạng thái sẵn sàng ở đây chỉ liên quan đến các điều kiện tiên quyết để đính kèm cục bộ. Existing-session giữ các giới hạn tuyến Chrome MCP hiện tại; các tuyến nâng cao như `responsebody`, xuất PDF, chặn tải xuống và hành động theo lô vẫn yêu cầu trình duyệt được quản lý hoặc profile CDP thô.

    Kiểm tra này **không** áp dụng cho Docker, sandbox, remote-browser, hoặc các luồng headless khác. Các luồng đó tiếp tục dùng CDP thô.

  </Accordion>
  <Accordion title="2d. Điều kiện tiên quyết OAuth TLS">
    Khi một profile OpenAI Codex OAuth được cấu hình, doctor thăm dò endpoint ủy quyền OpenAI để xác minh rằng ngăn xếp TLS Node/OpenSSL cục bộ có thể xác thực chuỗi chứng chỉ. Nếu thăm dò thất bại với lỗi chứng chỉ (ví dụ `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, chứng chỉ hết hạn, hoặc chứng chỉ tự ký), doctor in hướng dẫn sửa lỗi theo từng nền tảng. Trên macOS với Node từ Homebrew, cách sửa thường là `brew postinstall ca-certificates`. Với `--deep`, thăm dò chạy ngay cả khi gateway khỏe mạnh.
  </Accordion>
  <Accordion title="2e. Ghi đè provider Codex OAuth">
    Nếu trước đây bạn đã thêm các thiết lập transport OpenAI cũ dưới `models.providers.openai-codex`, chúng có thể che khuất đường dẫn provider Codex OAuth tích hợp mà các bản phát hành mới hơn tự động dùng. Doctor cảnh báo khi thấy các thiết lập transport cũ đó cùng với Codex OAuth để bạn có thể xóa hoặc viết lại phần ghi đè transport lỗi thời và lấy lại hành vi định tuyến/dự phòng tích hợp. Proxy tùy chỉnh và phần ghi đè chỉ header vẫn được hỗ trợ và không kích hoạt cảnh báo này.
  </Accordion>
  <Accordion title="2f. Sửa tuyến Codex">
    Doctor kiểm tra các tham chiếu model `openai-codex/*` cũ. Định tuyến harness Codex gốc dùng các tham chiếu model `openai/*` chuẩn; các lượt agent OpenAI đi qua harness app-server Codex thay vì đường dẫn provider OpenAI của OpenClaw.

    Ở chế độ `--fix` / `--repair`, doctor ghi lại các tham chiếu default-agent và per-agent bị ảnh hưởng, bao gồm model chính, dự phòng, model tạo ảnh/video, ghi đè heartbeat/subagent/compaction, hook, ghi đè model kênh và trạng thái tuyến phiên đã lưu lỗi thời:

    - `openai-codex/gpt-*` trở thành `openai/gpt-*`.
    - Ý định Codex chuyển sang các mục `agentRuntime.id: "codex"` theo phạm vi provider/model cho các tham chiếu model agent đã sửa.
    - Cấu hình runtime whole-agent lỗi thời và các ghim runtime phiên đã lưu bị xóa vì lựa chọn runtime nằm theo phạm vi provider/model.
    - Chính sách runtime provider/model hiện có được giữ nguyên trừ khi tham chiếu model cũ đã sửa cần định tuyến Codex để giữ đường dẫn xác thực cũ.
    - Các danh sách dự phòng model hiện có được giữ lại với các mục cũ được ghi lại; các thiết lập theo model đã sao chép chuyển từ khóa cũ sang khóa `openai/*` chuẩn.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, thông báo dự phòng và ghim profile xác thực của phiên đã lưu được sửa trên tất cả kho phiên agent đã phát hiện.
    - `/codex ...` có nghĩa là "điều khiển hoặc liên kết một cuộc trò chuyện Codex gốc từ chat."
    - `/acp ...` hoặc `runtime: "acp"` có nghĩa là "dùng bộ điều hợp ACP/acpx bên ngoài."

  </Accordion>
  <Accordion title="2g. Dọn dẹp tuyến phiên">
    Doctor cũng quét các kho phiên agent đã phát hiện để tìm trạng thái tuyến tự động tạo lỗi thời sau khi bạn chuyển model hoặc runtime đã cấu hình ra khỏi một tuyến do plugin sở hữu như Codex.

    `openclaw doctor --fix` có thể xóa trạng thái lỗi thời tự động tạo như ghim model `modelOverrideSource: "auto"`, siêu dữ liệu model runtime, ID harness đã ghim, liên kết phiên CLI và ghi đè profile xác thực tự động khi tuyến sở hữu chúng không còn được cấu hình. Các lựa chọn model phiên rõ ràng của người dùng hoặc cũ được báo cáo để xem xét thủ công và được giữ nguyên; chuyển chúng bằng `/model ...`, `/new`, hoặc đặt lại phiên khi tuyến đó không còn được dự định dùng.

  </Accordion>
  <Accordion title="3. Di chuyển trạng thái cũ (bố cục đĩa)">
    Doctor có thể di chuyển các bố cục cũ trên đĩa vào cấu trúc hiện tại:

    - Kho phiên + bản ghi:
      - từ `~/.openclaw/sessions/` sang `~/.openclaw/agents/<agentId>/sessions/`
    - Thư mục agent:
      - từ `~/.openclaw/agent/` sang `~/.openclaw/agents/<agentId>/agent/`
    - Trạng thái xác thực WhatsApp (Baileys):
      - từ `~/.openclaw/credentials/*.json` cũ (trừ `oauth.json`)
      - sang `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID tài khoản mặc định: `default`)

    Các lần di chuyển này là nỗ lực tối đa và có tính lũy đẳng; doctor sẽ phát cảnh báo khi để lại bất kỳ thư mục cũ nào làm bản sao lưu. Gateway/CLI cũng tự động di chuyển kho phiên cũ + thư mục agent khi khởi động để lịch sử/xác thực/model nằm trong đường dẫn theo từng agent mà không cần chạy doctor thủ công. Xác thực WhatsApp được cố ý chỉ di chuyển qua `openclaw doctor`. Việc chuẩn hóa provider/bản đồ provider của Talk hiện so sánh bằng bình đẳng cấu trúc, nên các khác biệt chỉ về thứ tự khóa không còn kích hoạt lặp lại các thay đổi `doctor --fix` không có tác dụng.

  </Accordion>
  <Accordion title="3a. Di chuyển manifest Plugin cũ">
    Doctor quét tất cả manifest Plugin đã cài đặt để tìm các khóa capability cấp cao nhất đã lỗi thời (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Khi tìm thấy, Doctor đề nghị chuyển chúng vào đối tượng `contracts` và ghi lại tệp manifest tại chỗ. Quá trình di chuyển này có tính lũy đẳng; nếu khóa `contracts` đã có cùng các giá trị, khóa cũ sẽ bị xóa mà không nhân đôi dữ liệu.
  </Accordion>
  <Accordion title="3b. Di chuyển kho Cron cũ">
    Doctor cũng kiểm tra kho tác vụ Cron (`~/.openclaw/cron/jobs.json` theo mặc định, hoặc `cron.store` khi được ghi đè) để tìm các dạng tác vụ cũ mà bộ lập lịch vẫn chấp nhận vì tương thích.

    Các bước dọn dẹp Cron hiện tại bao gồm:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - các trường payload cấp cao nhất (`message`, `model`, `thinking`, ...) → `payload`
    - các trường delivery cấp cao nhất (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - bí danh delivery `provider` trong payload → `delivery.channel` rõ ràng
    - các tác vụ Webhook dự phòng `notify: true` cũ → delivery Webhook rõ ràng từ `cron.webhook` khi được đặt; tác vụ thông báo giữ delivery chat của chúng và nhận `delivery.completionDestination`. Khi `cron.webhook` chưa được đặt, dấu đánh dấu `notify` cấp cao nhất không hoạt động sẽ bị xóa đối với các tác vụ không có đích (delivery hiện có, bao gồm thông báo, được giữ nguyên) vì delivery runtime không bao giờ đọc nó

    Gateway cũng làm sạch các hàng Cron sai định dạng tại thời điểm tải để các tác vụ hợp lệ tiếp tục chạy. Các hàng thô sai định dạng được sao chép sang `jobs-quarantine.json` bên cạnh kho đang hoạt động trước khi bị xóa khỏi `jobs.json`; Doctor báo cáo các hàng đã cách ly để bạn có thể xem xét hoặc sửa thủ công.

    Khi khởi động, Gateway chuẩn hóa phép chiếu runtime và bỏ qua dấu đánh dấu `notify` cấp cao nhất, nhưng vẫn để cấu hình Cron đã lưu cho Doctor sửa chữa. Khi `cron.webhook` chưa được đặt, Doctor xóa dấu đánh dấu không hoạt động cho các tác vụ không có đích di chuyển (`delivery.mode` là none/vắng mặt, một đích Webhook không dùng được, hoặc delivery thông báo/chat hiện có), giữ nguyên delivery hiện có, để các lần chạy `doctor --fix` lặp lại không còn cảnh báo lại về cùng tác vụ. Nếu `cron.webhook` được đặt nhưng không phải URL HTTP(S) hợp lệ, Doctor vẫn cảnh báo và giữ lại dấu đánh dấu để bạn có thể sửa URL.

    Trên Linux, Doctor cũng cảnh báo khi crontab của người dùng vẫn gọi `~/.openclaw/bin/ensure-whatsapp.sh` cũ. Script cục bộ trên máy chủ đó không được OpenClaw hiện tại duy trì và có thể ghi các thông báo `Gateway inactive` sai vào `~/.openclaw/logs/whatsapp-health.log` khi Cron không thể truy cập systemd user bus. Xóa mục crontab lỗi thời bằng `crontab -e`; dùng `openclaw channels status --probe`, `openclaw doctor`, và `openclaw gateway status` cho các kiểm tra sức khỏe hiện tại.

  </Accordion>
  <Accordion title="3c. Dọn dẹp khóa phiên">
    Doctor quét mọi thư mục phiên agent để tìm các tệp write-lock cũ — các tệp bị bỏ lại khi một phiên thoát bất thường. Với mỗi tệp khóa tìm thấy, Doctor báo cáo: đường dẫn, PID, PID còn sống hay không, tuổi của khóa, và khóa có được xem là cũ hay không (PID đã chết, siêu dữ liệu chủ sở hữu sai định dạng, cũ hơn 30 phút, hoặc PID còn sống nhưng có thể chứng minh thuộc về một tiến trình không phải OpenClaw). Ở chế độ `--fix` / `--repair`, Doctor tự động xóa các khóa có chủ sở hữu đã chết, mồ côi, tái sử dụng, sai định dạng-và-cũ, hoặc không phải OpenClaw. Các khóa cũ vẫn thuộc sở hữu của một tiến trình OpenClaw đang chạy sẽ được báo cáo nhưng giữ nguyên để Doctor không ngắt một trình ghi transcript đang hoạt động.
  </Accordion>
  <Accordion title="3d. Sửa nhánh transcript phiên">
    Doctor quét các tệp JSONL phiên agent để tìm dạng nhánh bị nhân đôi do lỗi ghi lại prompt transcript ngày 2026.4.24 tạo ra: một lượt người dùng bị bỏ dở với ngữ cảnh runtime nội bộ OpenClaw cộng với một nhánh anh em đang hoạt động chứa cùng prompt người dùng hiển thị. Ở chế độ `--fix` / `--repair`, Doctor sao lưu từng tệp bị ảnh hưởng bên cạnh tệp gốc và ghi lại transcript về nhánh đang hoạt động để lịch sử Gateway và trình đọc bộ nhớ không còn thấy các lượt trùng lặp.
  </Accordion>
  <Accordion title="4. Kiểm tra toàn vẹn trạng thái (lưu phiên, định tuyến, và an toàn)">
    Thư mục trạng thái là thân não vận hành. Nếu nó biến mất, bạn mất phiên, thông tin xác thực, nhật ký, và cấu hình (trừ khi bạn có bản sao lưu ở nơi khác).

    Doctor kiểm tra:

    - **Thiếu thư mục trạng thái**: cảnh báo về mất trạng thái nghiêm trọng, nhắc tạo lại thư mục, và nhắc bạn rằng nó không thể khôi phục dữ liệu bị thiếu.
    - **Quyền thư mục trạng thái**: xác minh khả năng ghi; đề nghị sửa quyền (và phát gợi ý `chown` khi phát hiện chủ sở hữu/nhóm không khớp).
    - **Thư mục trạng thái đồng bộ đám mây trên macOS**: cảnh báo khi trạng thái trỏ vào iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) hoặc `~/Library/CloudStorage/...` vì các đường dẫn dựa trên đồng bộ có thể gây I/O chậm hơn và tranh chấp khóa/đồng bộ.
    - **Thư mục trạng thái trên SD hoặc eMMC Linux**: cảnh báo khi trạng thái trỏ tới nguồn mount `mmcblk*`, vì I/O ngẫu nhiên dựa trên SD hoặc eMMC có thể chậm hơn và hao mòn nhanh hơn khi ghi phiên và thông tin xác thực.
    - **Thư mục trạng thái tạm thời trên Linux**: cảnh báo khi trạng thái trỏ tới `tmpfs` hoặc `ramfs`, vì phiên, thông tin xác thực, cấu hình, và trạng thái SQLite cùng các sidecar WAL/journal của nó sẽ biến mất khi khởi động lại. Các mount Docker `overlay` cố ý không bị gắn cờ vì các lớp có thể ghi của chúng vẫn tồn tại qua các lần khởi động lại máy chủ khi container còn tồn tại.
    - **Thiếu thư mục phiên**: `sessions/` và thư mục kho phiên là bắt buộc để lưu lịch sử và tránh crash `ENOENT`.
    - **Transcript không khớp**: cảnh báo khi các mục phiên gần đây thiếu tệp transcript.
    - **Phiên chính "JSONL 1 dòng"**: gắn cờ khi transcript chính chỉ có một dòng (lịch sử không được tích lũy).
    - **Nhiều thư mục trạng thái**: cảnh báo khi nhiều thư mục `~/.openclaw` tồn tại trên các thư mục home hoặc khi `OPENCLAW_STATE_DIR` trỏ nơi khác (lịch sử có thể bị chia giữa các bản cài đặt).
    - **Nhắc chế độ từ xa**: nếu `gateway.mode=remote`, Doctor nhắc bạn chạy nó trên máy chủ từ xa (trạng thái nằm ở đó).
    - **Quyền tệp cấu hình**: cảnh báo nếu `~/.openclaw/openclaw.json` có thể đọc bởi nhóm/mọi người và đề nghị siết lại thành `600`.

  </Accordion>
  <Accordion title="5. Sức khỏe xác thực mô hình (hết hạn OAuth)">
    Doctor kiểm tra các hồ sơ OAuth trong kho xác thực, cảnh báo khi token sắp hết hạn/đã hết hạn, và có thể làm mới chúng khi an toàn. Nếu hồ sơ OAuth/token Anthropic đã cũ, Doctor đề xuất khóa API Anthropic hoặc đường dẫn setup-token Anthropic. Lời nhắc làm mới chỉ xuất hiện khi chạy tương tác (TTY); `--non-interactive` bỏ qua các lần thử làm mới.

    Khi làm mới OAuth thất bại vĩnh viễn (ví dụ `refresh_token_reused`, `invalid_grant`, hoặc nhà cung cấp yêu cầu bạn đăng nhập lại), Doctor báo cáo rằng cần xác thực lại và in chính xác lệnh `openclaw models auth login --provider ...` cần chạy.

    Doctor cũng báo cáo các hồ sơ xác thực tạm thời không dùng được do:

    - thời gian chờ ngắn (giới hạn tốc độ/hết thời gian chờ/lỗi xác thực)
    - vô hiệu hóa lâu hơn (lỗi thanh toán/tín dụng)

    Các hồ sơ OAuth Codex cũ có token nằm trong macOS Keychain (quy trình onboarding cũ trước bố cục sidecar dựa trên tệp) chỉ được sửa bởi Doctor. Chạy `openclaw doctor --fix` một lần từ terminal tương tác để di chuyển token cũ dựa trên Keychain trực tiếp vào `auth-profiles.json`; sau đó, các lượt nhúng (Telegram, Cron, điều phối sub-agent) phân giải chúng như các hồ sơ OAuth OpenAI chuẩn.

  </Accordion>
  <Accordion title="6. Xác thực mô hình hooks">
    Nếu `hooks.gmail.model` được đặt, Doctor xác thực tham chiếu mô hình theo danh mục và allowlist, rồi cảnh báo khi nó không phân giải được hoặc không được phép.
  </Accordion>
  <Accordion title="7. Sửa ảnh sandbox">
    Khi sandboxing được bật, Doctor kiểm tra ảnh Docker và đề nghị build hoặc chuyển sang tên cũ nếu thiếu ảnh hiện tại.
  </Accordion>
  <Accordion title="7b. Dọn dẹp cài đặt Plugin">
    Doctor xóa trạng thái staging dependency Plugin do OpenClaw tạo ra kiểu cũ ở chế độ `openclaw doctor --fix` / `openclaw doctor --repair`. Việc này bao gồm các gốc dependency đã tạo nhưng lỗi thời, thư mục install-stage cũ, mảnh vụn cục bộ trong package từ mã sửa dependency bundled-plugin trước đây, và các bản sao npm được quản lý của các Plugin `@openclaw/*` đi kèm bị mồ côi hoặc được khôi phục có thể che khuất manifest đi kèm hiện tại. Doctor cũng liên kết lại package `openclaw` của máy chủ vào các Plugin npm được quản lý có khai báo `peerDependencies.openclaw`, để các import runtime cục bộ trong package như `openclaw/plugin-sdk/*` tiếp tục phân giải sau cập nhật hoặc sửa npm.

    Doctor cũng có thể cài đặt lại các Plugin tải xuống bị thiếu khi cấu hình tham chiếu đến chúng nhưng registry Plugin cục bộ không tìm thấy. Ví dụ bao gồm `plugins.entries` cụ thể, các thiết lập channel/provider/search đã cấu hình, và runtime agent đã cấu hình. Trong quá trình cập nhật package, Doctor tránh chạy sửa Plugin bằng package-manager khi package lõi đang được thay thế; chạy lại `openclaw doctor --fix` sau khi cập nhật nếu một Plugin đã cấu hình vẫn cần khôi phục. Khởi động Gateway và tải lại cấu hình không chạy package manager; cài đặt Plugin vẫn là công việc Doctor/install/update rõ ràng.

  </Accordion>
  <Accordion title="8. Di chuyển dịch vụ Gateway và gợi ý dọn dẹp">
    Doctor phát hiện các dịch vụ Gateway cũ (launchd/systemd/schtasks) và đề nghị xóa chúng rồi cài đặt dịch vụ OpenClaw bằng cổng Gateway hiện tại. Doctor cũng có thể quét các dịch vụ giống Gateway bổ sung và in gợi ý dọn dẹp. Các dịch vụ Gateway OpenClaw có tên theo hồ sơ được xem là hạng nhất và không bị gắn cờ là "bổ sung".

    Trên Linux, nếu thiếu dịch vụ Gateway cấp người dùng nhưng có dịch vụ Gateway OpenClaw cấp hệ thống tồn tại, Doctor không tự động cài đặt dịch vụ cấp người dùng thứ hai. Kiểm tra bằng `openclaw gateway status --deep` hoặc `openclaw doctor --deep`, rồi xóa bản trùng lặp hoặc đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một trình giám sát hệ thống sở hữu vòng đời Gateway.

  </Accordion>
  <Accordion title="8b. Di chuyển Startup Matrix">
    Khi một tài khoản channel Matrix có di chuyển trạng thái cũ đang chờ hoặc có thể xử lý, Doctor (ở chế độ `--fix` / `--repair`) tạo ảnh chụp trước di chuyển rồi chạy các bước di chuyển best-effort: di chuyển trạng thái Matrix cũ và chuẩn bị trạng thái mã hóa cũ. Cả hai bước đều không gây lỗi nghiêm trọng; lỗi được ghi nhật ký và quá trình khởi động tiếp tục. Ở chế độ chỉ đọc (`openclaw doctor` không có `--fix`), kiểm tra này bị bỏ qua hoàn toàn.
  </Accordion>
  <Accordion title="8c. Ghép đôi thiết bị và lệch xác thực">
    Doctor hiện kiểm tra trạng thái ghép đôi thiết bị như một phần của lượt kiểm tra sức khỏe thông thường.

    Nội dung Doctor báo cáo:

    - các yêu cầu ghép đôi lần đầu đang chờ
    - các nâng cấp vai trò đang chờ cho thiết bị đã ghép đôi
    - các nâng cấp phạm vi đang chờ cho thiết bị đã ghép đôi
    - các sửa chữa không khớp khóa công khai khi id thiết bị vẫn khớp nhưng danh tính thiết bị không còn khớp bản ghi đã phê duyệt
    - bản ghi đã ghép đôi thiếu token hoạt động cho vai trò đã phê duyệt
    - token đã ghép đôi có phạm vi lệch khỏi baseline ghép đôi đã phê duyệt
    - các mục device-token được lưu cache cục bộ cho máy hiện tại có trước một lần xoay token phía Gateway hoặc mang siêu dữ liệu phạm vi lỗi thời

    Doctor không tự động phê duyệt yêu cầu ghép đôi hoặc tự động xoay token thiết bị. Thay vào đó, Doctor in chính xác các bước tiếp theo:

    - kiểm tra yêu cầu đang chờ bằng `openclaw devices list`
    - phê duyệt yêu cầu chính xác bằng `openclaw devices approve <requestId>`
    - xoay token mới bằng `openclaw devices rotate --device <deviceId> --role <role>`
    - xóa và phê duyệt lại bản ghi lỗi thời bằng `openclaw devices remove <deviceId>`

    Điều này khép lại lỗ hổng phổ biến "đã ghép đôi nhưng vẫn nhận yêu cầu ghép đôi": doctor giờ đây phân biệt ghép đôi lần đầu với các nâng cấp vai trò/phạm vi đang chờ và với độ lệch token/danh tính thiết bị đã cũ.

  </Accordion>
  <Accordion title="9. Cảnh báo bảo mật">
    Doctor phát cảnh báo khi một provider mở cho DM mà không có danh sách cho phép, hoặc khi một policy được cấu hình theo cách nguy hiểm.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Nếu chạy dưới dạng systemd user service, doctor đảm bảo linger được bật để Gateway tiếp tục hoạt động sau khi đăng xuất.
  </Accordion>
  <Accordion title="11. Trạng thái workspace (Skills, Plugin và TaskFlow)">
    Doctor in tóm tắt trạng thái workspace cho agent mặc định:

    - **Trạng thái Skills**: đếm các skills đủ điều kiện, thiếu yêu cầu và bị chặn bởi danh sách cho phép.
    - **Trạng thái Plugin**: đếm các Plugin đã bật/đã tắt/bị lỗi; liệt kê ID Plugin cho mọi lỗi; báo cáo các capability của bundle Plugin.
    - **Cảnh báo tương thích Plugin**: đánh dấu các Plugin có vấn đề tương thích với runtime hiện tại.
    - **Chẩn đoán Plugin**: hiển thị mọi cảnh báo hoặc lỗi lúc tải do plugin registry phát ra.
    - **Khôi phục TaskFlow**: hiển thị các TaskFlow được quản lý đáng ngờ cần kiểm tra thủ công hoặc hủy.

  </Accordion>
  <Accordion title="11b. Kích thước tệp bootstrap">
    Doctor kiểm tra liệu các tệp bootstrap của workspace (ví dụ `AGENTS.md`, `CLAUDE.md`, hoặc các tệp ngữ cảnh được chèn khác) có gần hoặc vượt ngân sách ký tự đã cấu hình hay không. Nó báo cáo số ký tự thô so với đã chèn theo từng tệp, phần trăm cắt bớt, nguyên nhân cắt bớt (`max/file` hoặc `max/total`) và tổng số ký tự đã chèn dưới dạng tỷ lệ của tổng ngân sách. Khi tệp bị cắt bớt hoặc gần giới hạn, doctor in mẹo để tinh chỉnh `agents.defaults.bootstrapMaxChars` và `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Dọn dẹp channel plugin đã cũ">
    Khi `openclaw doctor --fix` xóa một channel plugin bị thiếu, nó cũng xóa cấu hình theo phạm vi channel bị treo đang tham chiếu đến Plugin đó: các mục `channels.<id>`, mục tiêu Heartbeat đã đặt tên channel và các ghi đè `agents.*.models["<channel>/*"]`. Điều này ngăn vòng lặp khởi động Gateway khi runtime của channel đã biến mất nhưng cấu hình vẫn yêu cầu Gateway bind vào nó.
  </Accordion>
  <Accordion title="11c. Hoàn tất shell">
    Doctor kiểm tra liệu hoàn tất tab đã được cài đặt cho shell hiện tại hay chưa (zsh, bash, fish hoặc PowerShell):

    - Nếu hồ sơ shell dùng mẫu hoàn tất động chậm (`source <(openclaw completion ...)`), doctor nâng cấp nó lên biến thể tệp cache nhanh hơn.
    - Nếu hoàn tất được cấu hình trong hồ sơ nhưng thiếu tệp cache, doctor tự động tạo lại cache.
    - Nếu hoàn toàn chưa cấu hình hoàn tất, doctor nhắc cài đặt nó (chỉ ở chế độ tương tác; bỏ qua với `--non-interactive`).

    Chạy `openclaw completion --write-state` để tạo lại cache thủ công.

  </Accordion>
  <Accordion title="12. Kiểm tra xác thực Gateway (token cục bộ)">
    Doctor kiểm tra mức sẵn sàng xác thực token Gateway cục bộ.

    - Nếu chế độ token cần token và không có nguồn token nào, doctor đề nghị tạo một token.
    - Nếu `gateway.auth.token` được quản lý bằng SecretRef nhưng không khả dụng, doctor cảnh báo và không ghi đè bằng văn bản thuần.
    - `openclaw doctor --generate-gateway-token` chỉ ép tạo khi không có token SecretRef nào được cấu hình.

  </Accordion>
  <Accordion title="12b. Sửa chữa chỉ đọc có nhận biết SecretRef">
    Một số luồng sửa chữa cần kiểm tra thông tin xác thực đã cấu hình mà không làm suy yếu hành vi fail-fast của runtime.

    - `openclaw doctor --fix` giờ dùng cùng mô hình tóm tắt SecretRef chỉ đọc như các lệnh nhóm trạng thái cho các sửa chữa cấu hình có mục tiêu.
    - Ví dụ: sửa chữa `@username` trong Telegram `allowFrom` / `groupAllowFrom` cố gắng dùng thông tin xác thực bot đã cấu hình khi có sẵn.
    - Nếu token bot Telegram được cấu hình qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại, doctor báo rằng thông tin xác thực đã được cấu hình-nhưng-không-khả-dụng và bỏ qua tự động phân giải thay vì crash hoặc báo sai rằng token bị thiếu.

  </Accordion>
  <Accordion title="13. Kiểm tra sức khỏe Gateway + khởi động lại">
    Doctor chạy kiểm tra sức khỏe và đề nghị khởi động lại Gateway khi nó có vẻ không khỏe.
  </Accordion>
  <Accordion title="13b. Mức sẵn sàng tìm kiếm bộ nhớ">
    Doctor kiểm tra liệu provider embedding cho tìm kiếm bộ nhớ đã cấu hình có sẵn sàng cho agent mặc định hay không. Hành vi phụ thuộc vào backend và provider đã cấu hình:

    - **Backend QMD**: thăm dò liệu binary `qmd` có khả dụng và có thể khởi động hay không. Nếu không, in hướng dẫn sửa gồm package npm và tùy chọn đường dẫn binary thủ công.
    - **Provider cục bộ tường minh**: kiểm tra tệp model cục bộ hoặc URL model từ xa/có thể tải xuống được nhận diện. Nếu thiếu, gợi ý chuyển sang provider từ xa.
    - **Provider từ xa tường minh** (`openai`, `voyage`, v.v.): xác minh API key có trong môi trường hoặc kho xác thực. In gợi ý sửa có thể hành động nếu thiếu.
    - **Provider tự động cũ**: coi `memorySearch.provider: "auto"` là OpenAI, kiểm tra mức sẵn sàng OpenAI, và `doctor --fix` ghi lại thành `provider: "openai"`.

    Khi có kết quả thăm dò Gateway được cache (Gateway khỏe tại thời điểm kiểm tra), doctor đối chiếu kết quả đó với cấu hình mà CLI nhìn thấy và ghi chú mọi điểm khác biệt. Doctor không bắt đầu ping embedding mới trên đường dẫn mặc định; hãy dùng lệnh trạng thái bộ nhớ sâu khi bạn muốn kiểm tra provider trực tiếp.

    Dùng `openclaw memory status --deep` để xác minh mức sẵn sàng embedding tại runtime.

  </Accordion>
  <Accordion title="14. Cảnh báo trạng thái channel">
    Nếu Gateway khỏe, doctor chạy thăm dò trạng thái channel và báo cáo cảnh báo kèm bản sửa được gợi ý.
  </Accordion>
  <Accordion title="15. Kiểm tra + sửa chữa cấu hình supervisor">
    Doctor kiểm tra cấu hình supervisor đã cài đặt (launchd/systemd/schtasks) để tìm các mặc định bị thiếu hoặc đã lỗi thời (ví dụ: phụ thuộc network-online của systemd và độ trễ khởi động lại). Khi tìm thấy điểm không khớp, nó khuyến nghị cập nhật và có thể ghi lại tệp service/task theo các mặc định hiện tại.

    Ghi chú:

    - `openclaw doctor` nhắc trước khi ghi lại cấu hình supervisor.
    - `openclaw doctor --yes` chấp nhận các lời nhắc sửa chữa mặc định.
    - `openclaw doctor --fix` áp dụng các bản sửa được khuyến nghị mà không nhắc (`--repair` là alias).
    - `openclaw doctor --fix --force` ghi đè cấu hình supervisor tùy chỉnh.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` giữ doctor ở chế độ chỉ đọc đối với vòng đời service Gateway. Nó vẫn báo cáo sức khỏe service và chạy các sửa chữa không thuộc service, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap service, ghi lại cấu hình supervisor và dọn dẹp service cũ vì một supervisor bên ngoài sở hữu vòng đời đó.
    - Trên Linux, doctor không ghi lại metadata lệnh/entrypoint trong khi systemd Gateway unit khớp đang hoạt động. Nó cũng bỏ qua các unit giống Gateway bổ sung, không phải legacy và không hoạt động trong quá trình quét service trùng lặp để các tệp service đi kèm không tạo nhiễu dọn dẹp.
    - Nếu xác thực token yêu cầu token và `gateway.auth.token` được quản lý bằng SecretRef, cài đặt/sửa chữa service của doctor xác thực SecretRef nhưng không lưu các giá trị token văn bản thuần đã phân giải vào metadata môi trường service supervisor.
    - Doctor phát hiện các giá trị môi trường service được quản lý, dựa trên `.env`/SecretRef mà các bản cài đặt LaunchAgent, systemd hoặc Windows Scheduled Task cũ đã nhúng inline và ghi lại metadata service để các giá trị đó tải từ nguồn runtime thay vì định nghĩa supervisor.
    - Doctor phát hiện khi lệnh service vẫn ghim `--port` cũ sau khi `gateway.port` thay đổi và ghi lại metadata service sang cổng hiện tại.
    - Nếu xác thực token yêu cầu token và token SecretRef đã cấu hình chưa được phân giải, doctor chặn đường dẫn cài đặt/sửa chữa bằng hướng dẫn có thể hành động.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, doctor chặn cài đặt/sửa chữa cho đến khi mode được đặt tường minh.
    - Đối với các Linux user-systemd unit, kiểm tra độ lệch token của doctor giờ bao gồm cả nguồn `Environment=` và `EnvironmentFile=` khi so sánh metadata xác thực service.
    - Sửa chữa service của doctor từ chối ghi lại, dừng hoặc khởi động lại Gateway service từ binary OpenClaw cũ hơn khi cấu hình được ghi lần cuối bởi phiên bản mới hơn. Xem [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Bạn luôn có thể ép ghi lại toàn bộ qua `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Chẩn đoán runtime + cổng Gateway">
    Doctor kiểm tra runtime service (PID, trạng thái thoát gần nhất) và cảnh báo khi service đã được cài đặt nhưng thực tế không chạy. Nó cũng kiểm tra xung đột cổng trên cổng Gateway (mặc định `18789`) và báo cáo các nguyên nhân có khả năng xảy ra (Gateway đã chạy, SSH tunnel).
  </Accordion>
  <Accordion title="17. Thực hành tốt nhất cho runtime Gateway">
    Doctor cảnh báo khi Gateway service chạy trên Bun hoặc đường dẫn Node được quản lý theo phiên bản (`nvm`, `fnm`, `volta`, `asdf`, v.v.). Các channel WhatsApp + Telegram yêu cầu Node, và đường dẫn của trình quản lý phiên bản có thể hỏng sau khi nâng cấp vì service không tải shell init của bạn. Doctor đề nghị di chuyển sang bản cài đặt Node hệ thống khi có sẵn (Homebrew/apt/choco).

    Các macOS LaunchAgent mới cài đặt hoặc đã sửa chữa dùng PATH hệ thống chuẩn (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) thay vì sao chép PATH shell tương tác, để các binary hệ thống do Homebrew quản lý vẫn khả dụng trong khi Volta, asdf, fnm, pnpm và các thư mục trình quản lý phiên bản khác không thay đổi Node mà tiến trình con phân giải. Các service Linux vẫn giữ root môi trường tường minh (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) và các thư mục user-bin ổn định, nhưng các thư mục fallback trình quản lý phiên bản được đoán chỉ được ghi vào PATH service khi các thư mục đó tồn tại trên đĩa.

  </Accordion>
  <Accordion title="18. Ghi cấu hình + metadata wizard">
    Doctor lưu mọi thay đổi cấu hình và đóng dấu metadata wizard để ghi lại lần chạy doctor.
  </Accordion>
  <Accordion title="19. Mẹo workspace (sao lưu + hệ thống bộ nhớ)">
    Doctor gợi ý hệ thống bộ nhớ workspace khi thiếu và in mẹo sao lưu nếu workspace chưa nằm trong git.

    Xem [/concepts/agent-workspace](/vi/concepts/agent-workspace) để biết hướng dẫn đầy đủ về cấu trúc workspace và sao lưu git (khuyến nghị GitHub hoặc GitLab riêng tư).

  </Accordion>
</AccordionGroup>

## Liên quan

- [Runbook Gateway](/vi/gateway)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
