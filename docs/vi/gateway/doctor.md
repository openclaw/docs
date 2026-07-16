---
read_when:
    - Thêm hoặc sửa đổi các quá trình di chuyển của doctor
    - Giới thiệu các thay đổi cấu hình không tương thích ngược
sidebarTitle: Doctor
summary: 'Lệnh Doctor: kiểm tra tình trạng, di chuyển cấu hình và các bước sửa chữa'
title: Trình chẩn đoán
x-i18n:
    generated_at: "2026-07-16T15:15:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e5c37c31332a9128767ebf6a853aa618511b9eda7f5840a4f863ec705c58421a
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` là công cụ sửa chữa và di chuyển dữ liệu cho OpenClaw. Công cụ này sửa cấu hình/trạng thái lỗi thời, kiểm tra tình trạng và cung cấp các bước sửa chữa có thể thực hiện.

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

    Chấp nhận các giá trị mặc định mà không nhắc xác nhận (bao gồm các bước khởi động lại/sửa chữa dịch vụ/sandbox khi áp dụng).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    Áp dụng các sửa chữa được đề xuất mà không nhắc xác nhận (`--repair` là một bí danh).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    Chạy các kiểm tra tình trạng có cấu trúc cho CI hoặc tự động hóa kiểm tra sơ bộ. Chỉ đọc: không
    nhắc xác nhận, sửa chữa, di chuyển dữ liệu, khởi động lại hoặc ghi trạng thái.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    Đồng thời áp dụng các sửa chữa mạnh tay (ghi đè cấu hình trình giám sát tùy chỉnh).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Chạy mà không nhắc xác nhận, chỉ áp dụng các bước di chuyển dữ liệu an toàn (chuẩn hóa cấu hình +
    di chuyển trạng thái trên đĩa). Bỏ qua các thao tác khởi động lại/dịch vụ/sandbox cần con người
    xác nhận. Các bước di chuyển trạng thái cũ vẫn tự động chạy khi được phát hiện.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Quét các dịch vụ hệ thống để tìm những bản cài đặt Gateway bổ sung (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Để xem lại các thay đổi trước khi ghi, trước tiên hãy mở tệp cấu hình:

```bash
cat ~/.openclaw/openclaw.json
```

## Chế độ lint chỉ đọc

`openclaw doctor --lint` là chế độ tương ứng thân thiện với tự động hóa của
`openclaw doctor --fix`. Chúng dùng chung sổ đăng ký quy tắc Doctor, nhưng
không chọn hoặc xử lý các quy tắc theo cùng một cách:

| Chế độ                   | Nhắc xác nhận | Ghi cấu hình/trạng thái  | Đầu ra                  | Dùng cho                         |
| ------------------------ | ------------- | ------------------------ | ----------------------- | -------------------------------- |
| `openclaw doctor`        | có            | không                    | báo cáo tình trạng dễ đọc | con người kiểm tra trạng thái    |
| `openclaw doctor --fix`  | đôi khi      | có, theo chính sách sửa chữa | nhật ký sửa chữa dễ đọc | áp dụng các sửa chữa đã phê duyệt |
| `openclaw doctor --lint` | không         | không                    | các phát hiện có cấu trúc | CI, kiểm tra sơ bộ và cổng đánh giá |

Theo mặc định, `doctor --lint` chạy hồ sơ tự động hóa an toàn diện rộng: các kiểm tra
tĩnh, cục bộ và hữu ích trong đầu ra CI hoặc kiểm tra sơ bộ. Chế độ này bỏ qua các kiểm tra tự chọn
mang tính tư vấn, nhạy cảm với môi trường, phụ thuộc vào dịch vụ đang hoạt động, kiểm kê
tài khoản/không gian làm việc hoặc dọn dẹp dữ liệu lịch sử. Dùng `doctor --lint --all` khi muốn
kiểm toán lint đầy đủ với tất cả quy tắc đã đăng ký, bao gồm cả các kiểm tra tự chọn đó, hoặc `--only <id>` để
chạy một kiểm tra cụ thể.

`doctor --fix` không dùng hồ sơ lint mặc định và không chấp nhận
`--all`. Chế độ này chạy quy trình sửa chữa có thứ tự của Doctor: các kiểm tra tình trạng hiện đại có thể cung cấp
một phần triển khai `repair()` tùy chọn, còn các khu vực cũ vẫn dùng quy trình
sửa chữa Doctor cũ. Một số phát hiện lint được chủ ý chỉ dùng để chẩn đoán, vì vậy một
kiểm tra xuất hiện trong `--lint --all` không có nghĩa là `--fix` sẽ thay đổi khu vực đó.
Hợp đồng tách `detect()` (báo cáo phát hiện) khỏi `repair()` (báo cáo
thay đổi/diff/tác dụng phụ), qua đó mở đường cho một
`doctor --fix --dry-run` trong tương lai mà không biến các kiểm tra lint thành trình lập kế hoạch thay đổi.

Một số kiểm tra tích hợp sẵn bị tắt theo mặc định ở cấp nội bộ để chúng vẫn khả dụng cho
`--all`, `--only` và các quy trình sửa chữa Doctor mà không trở thành một phần của hồ sơ tự động hóa
`doctor --lint` mặc định. Mức độ nghiêm trọng của phát hiện vẫn được phát ra riêng cho từng
phát hiện (`info`, `warning` hoặc `error`); lựa chọn mặc định không phải là một mức độ
nghiêm trọng.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

Các trường đầu ra JSON:

- `ok`: liệu có phát hiện nào đạt ngưỡng mức độ nghiêm trọng đã chọn hay không
- `checksRun` / `checksSkipped`: số lượng (bị bỏ qua do hồ sơ, `--only` hoặc `--skip`)
- `findings`: chẩn đoán có cấu trúc với `checkId`, `severity`, `message` và các trường tùy chọn `path`, `line`, `column`, `ocPath`, `source`, `target`, `requirement`, `fixHint`

Mã thoát:

| Mã | Ý nghĩa                                                   |
| --- | --------------------------------------------------------- |
| `0`  | không có phát hiện nào đạt hoặc vượt ngưỡng đã chọn       |
| `1`  | một hoặc nhiều phát hiện đạt ngưỡng đã chọn               |
| `2`  | lệnh/runtime thất bại trước khi có thể phát ra các phát hiện |

Cờ:

- `--severity-min info|warning|error` (mặc định `warning`): kiểm soát cả nội dung được in lẫn điều kiện gây ra mã thoát khác không.
- `--all`: chạy mọi kiểm tra lint đã đăng ký, bao gồm các kiểm tra tự chọn bị loại khỏi tập tự động hóa mặc định.
- `--only <id>` (có thể lặp lại): chỉ chạy các mã định danh kiểm tra được nêu; mã định danh không xác định được báo cáo dưới dạng phát hiện lỗi.
- `--skip <id>` (có thể lặp lại): loại trừ một kiểm tra trong khi vẫn tiếp tục phần còn lại của lượt chạy.
- `--json`, `--severity-min`, `--all`, `--only` và `--skip` yêu cầu `--lint`; các lượt chạy `openclaw doctor` và `--fix` thuần túy sẽ từ chối chúng.

## Công cụ thực hiện những gì (tóm tắt)

<AccordionGroup>
  <Accordion title="Tình trạng, giao diện người dùng và bản cập nhật">
    - Cập nhật kiểm tra sơ bộ tùy chọn cho bản cài đặt từ git (chỉ ở chế độ tương tác).
    - Kiểm tra độ mới của giao thức giao diện người dùng (xây dựng lại Giao diện điều khiển khi lược đồ giao thức mới hơn).
    - Kiểm tra tình trạng + nhắc khởi động lại.
    - Chỉ hiển thị ghi chú về skill và plugin khi có sự cố; dữ liệu kiểm kê bình thường vẫn nằm trong `openclaw skills check` và `openclaw plugins list`.

  </Accordion>
  <Accordion title="Cấu hình và di chuyển dữ liệu">
    - Chuẩn hóa cấu hình cho các dạng giá trị cũ.
    - Di chuyển cấu hình Talk từ các trường `talk.*` phẳng cũ sang `talk.provider` + `talk.providers.<provider>`.
    - Kiểm tra di chuyển trình duyệt đối với cấu hình tiện ích Chrome cũ và mức độ sẵn sàng của Chrome MCP.
    - Cảnh báo ghi đè nhà cung cấp OpenCode (`models.providers.opencode` / `opencode-zen` / `opencode-go`).
    - Di chuyển nhà cung cấp/hồ sơ OpenAI Codex cũ (`openai-codex` → `openai`) và cảnh báo che khuất đối với `models.providers.openai-codex` lỗi thời.
    - Kiểm tra điều kiện tiên quyết TLS của OAuth cho hồ sơ OAuth OpenAI Codex.
    - Cảnh báo danh sách cho phép plugin/công cụ khi `plugins.allow` bị giới hạn nhưng chính sách công cụ vẫn yêu cầu ký tự đại diện hoặc công cụ do plugin sở hữu.
    - Di chuyển trạng thái cũ trên đĩa (phiên/thư mục tác nhân/xác thực WhatsApp).
    - Di chuyển khóa hợp đồng bản kê khai plugin cũ (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Di chuyển kho Cron cũ (`jobId`, `schedule.cron`, các trường phân phối/tải trọng cấp cao nhất, tải trọng `provider`, các tác vụ dự phòng Webhook `notify: true`).
    - Sửa ghim runtime Codex CLI (`agentRuntime.id: "codex-cli"` → `"codex"`) trên `agents.defaults`, `agents.list[]` và `models.providers.*` (bao gồm các mục theo từng mô hình).
    - Dọn dẹp cấu hình plugin lỗi thời khi plugin được bật; khi `plugins.enabled=false`, các tham chiếu plugin lỗi thời được giữ lại dưới dạng cấu hình cô lập không hoạt động.

  </Accordion>
  <Accordion title="Trạng thái và tính toàn vẹn">
    - Kiểm tra tệp khóa phiên và dọn dẹp khóa lỗi thời.
    - Sửa bản chép lời phiên cho các nhánh viết lại lời nhắc bị trùng lặp do những bản dựng 2026.4.24 bị ảnh hưởng tạo ra.
    - Phát hiện dấu mốc khôi phục sau khởi động lại của tác nhân phụ bị kẹt, với hỗ trợ `--fix` để xóa các cờ khôi phục bị hủy lỗi thời nhằm ngăn quá trình khởi động tiếp tục coi tác nhân con là đã bị hủy do khởi động lại.
    - Kiểm tra tính toàn vẹn và quyền của trạng thái (phiên, bản chép lời, thư mục trạng thái).
    - Kiểm tra quyền tệp cấu hình (chmod 600) khi chạy cục bộ.
    - Tình trạng xác thực mô hình: kiểm tra thời hạn OAuth, có thể làm mới token sắp hết hạn và báo cáo trạng thái tạm ngưng/vô hiệu hóa của hồ sơ xác thực.

  </Accordion>
  <Accordion title="Gateway, dịch vụ và trình giám sát">
    - Sửa image sandbox khi tính năng sandbox được bật.
    - Di chuyển dịch vụ cũ và phát hiện Gateway bổ sung.
    - Di chuyển trạng thái cũ của kênh Matrix (trong chế độ `--fix` / `--repair`).
    - Kiểm tra runtime Gateway (dịch vụ đã cài đặt nhưng không chạy; nhãn launchd được lưu đệm).
    - Cảnh báo trạng thái kênh (được thăm dò từ Gateway đang chạy).
    - Các kiểm tra quyền dành riêng cho từng kênh nằm trong `openclaw channels capabilities`; ví dụ, quyền kênh thoại Discord được kiểm toán bằng `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Kiểm tra khả năng phản hồi của WhatsApp khi tình trạng vòng lặp sự kiện Gateway suy giảm trong lúc các máy khách TUI cục bộ vẫn đang chạy; `--fix` chỉ dừng các máy khách TUI cục bộ đã được xác minh.
    - Sửa định tuyến Codex cho các tham chiếu mô hình `openai-codex/*` cũ trong mô hình chính, mô hình dự phòng, mô hình tạo hình ảnh/video, các ghi đè Heartbeat/tác nhân phụ/Compaction, hook, ghi đè mô hình theo kênh và ghim định tuyến phiên; `--fix` viết lại chúng thành `openai/*`, di chuyển hồ sơ/thứ tự xác thực `openai-codex:*` sang `openai:*`, xóa ghim runtime phiên/toàn tác nhân lỗi thời và để định tuyến hiệu dụng đã sửa xác định Codex có tương thích hay không.
    - Kiểm toán cấu hình trình giám sát (launchd/systemd/schtasks) với tùy chọn sửa chữa.
    - Dọn dẹp môi trường proxy nhúng cho các dịch vụ Gateway đã ghi nhận giá trị `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` của shell trong quá trình cài đặt hoặc cập nhật.
    - Kiểm tra runtime Gateway (dịch vụ Bun cũ không được hỗ trợ, đường dẫn trình quản lý phiên bản).
    - Chẩn đoán xung đột cổng Gateway (mặc định `18789`).

  </Accordion>
  <Accordion title="Xác thực, bảo mật và ghép nối">
    - Cảnh báo bảo mật cho chính sách tin nhắn trực tiếp mở.
    - Kiểm tra xác thực Gateway cho chế độ token cục bộ (đề nghị tạo token khi không có nguồn token; không ghi đè cấu hình SecretRef của token).
    - Phát hiện sự cố ghép nối thiết bị (yêu cầu ghép nối lần đầu đang chờ xử lý, nâng cấp vai trò/phạm vi đang chờ xử lý, độ lệch bộ nhớ đệm token thiết bị cục bộ lỗi thời và độ lệch xác thực của bản ghi đã ghép nối).

  </Accordion>
  <Accordion title="Không gian làm việc và shell">
    - Kiểm tra linger của systemd trên Linux.
    - Kiểm tra kích thước tệp khởi tạo không gian làm việc (cảnh báo cắt ngắn/gần giới hạn đối với các tệp ngữ cảnh).
    - Kiểm tra mức độ sẵn sàng của Skills cho tác nhân mặc định; báo cáo các skill được cho phép nhưng thiếu tệp nhị phân, môi trường, cấu hình hoặc yêu cầu hệ điều hành, và `--fix` có thể vô hiệu hóa các skill không khả dụng trong `skills.entries`.
    - Kiểm tra trạng thái tự động hoàn thành shell và tự động cài đặt/nâng cấp.
    - Kiểm tra mức độ sẵn sàng của nhà cung cấp embedding tìm kiếm bộ nhớ (mô hình cục bộ, khóa API từ xa hoặc tệp nhị phân QMD).
    - Kiểm tra bản cài đặt từ mã nguồn (không khớp không gian làm việc pnpm, thiếu tài nguyên giao diện người dùng, thiếu tệp nhị phân tsx).
    - Ghi cấu hình đã cập nhật + siêu dữ liệu trình hướng dẫn.

  </Accordion>
</AccordionGroup>

## Điền bù và đặt lại giao diện Dreams

Cảnh Dreams trong Control UI bao gồm các thao tác **Backfill**, **Reset** và **Clear Grounded** cho quy trình dreaming có căn cứ. Các thao tác này sử dụng những phương thức RPC kiểu doctor của Gateway nhưng **không** thuộc quy trình sửa chữa/di chuyển CLI `openclaw doctor`.

| Thao tác        | Chức năng                                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backfill       | Quét các tệp `memory/YYYY-MM-DD.md` lịch sử trong không gian làm việc đang hoạt động, chạy lượt nhật ký REM có căn cứ và ghi các mục backfill có thể hoàn tác vào `DREAMS.md`. |
| Reset          | Chỉ xóa các mục nhật ký backfill đã được đánh dấu khỏi `DREAMS.md`.                                                                                                  |
| Clear Grounded | Chỉ xóa các mục ngắn hạn chỉ dành cho nội dung có căn cứ đã được đưa vào vùng chờ từ lượt phát lại lịch sử mà chưa tích lũy khả năng truy hồi trực tiếp hoặc hỗ trợ hằng ngày.                           |

Không thao tác nào trong số này chỉnh sửa `MEMORY.md`, chạy đầy đủ các lượt di chuyển của doctor hoặc tự đưa các ứng viên có căn cứ vào kho thăng hạng ngắn hạn trực tiếp. Thay vào đó, để đưa lượt phát lại lịch sử có căn cứ vào luồng thăng hạng sâu thông thường, hãy dùng quy trình CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Lệnh này đưa các ứng viên bền vững có căn cứ vào vùng chờ trong kho dreaming ngắn hạn, trong khi `DREAMS.md` vẫn là giao diện xem xét.

## Hành vi chi tiết và lý do

<AccordionGroup>
  <Accordion title="0. Cập nhật tùy chọn (bản cài đặt git)">
    Nếu đây là một bản checkout git và doctor đang chạy ở chế độ tương tác, doctor sẽ đề nghị cập nhật (fetch/rebase/build) trước khi chạy.
  </Accordion>
  <Accordion title="1. Chuẩn hóa cấu hình">
    Doctor chuẩn hóa các dạng giá trị cũ sang lược đồ hiện tại. Cấu hình giọng nói Talk hiện tại là `talk.provider` + `talk.providers.<provider>`, với cấu hình giọng nói thời gian thực nằm trong `talk.realtime.*`. Doctor viết lại các dạng cũ `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` thành ánh xạ nhà cung cấp và viết lại các bộ chọn thời gian thực cấp cao nhất cũ (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) thành `talk.realtime`.

    Doctor cũng cảnh báo khi `plugins.allow` không trống và chính sách công cụ sử dụng ký tự đại diện hoặc các mục công cụ do plugin sở hữu. `tools.allow: ["*"]` chỉ khớp với công cụ từ các plugin thực sự được tải; nó không bỏ qua danh sách cho phép plugin độc quyền.

  </Accordion>
  <Accordion title="2. Di chuyển khóa cấu hình cũ">
    Khi cấu hình chứa một khóa không còn được khuyến nghị nhưng có lượt di chuyển đang hoạt động, các lệnh khác sẽ từ chối chạy và yêu cầu bạn chạy `openclaw doctor`. Doctor giải thích những khóa cũ nào được tìm thấy, hiển thị lượt di chuyển đã áp dụng và viết lại `~/.openclaw/openclaw.json` bằng lược đồ đã cập nhật. Quá trình khởi động Gateway từ chối các định dạng cấu hình cũ và yêu cầu bạn chạy `openclaw doctor --fix`; quá trình này không viết lại `openclaw.json` khi khởi động. Các lượt di chuyển kho tác vụ Cron cũng do `openclaw doctor --fix` xử lý.

    <Note>
      Doctor chỉ duy trì các lượt di chuyển tự động trong khoảng hai tháng sau khi một
      khóa bị loại bỏ. Các khóa cũ hơn (ví dụ như
      `routing.queue`, `routing.bindings`, `routing.agents`/`defaultAgentId`,
      `routing.transcribeAudio`, `agent.*` cấp cao nhất hoặc `identity` cấp cao nhất
      từ dạng cấu hình trước khi hỗ trợ nhiều tác nhân) không còn đường dẫn di chuyển;
      cấu hình sử dụng chúng giờ đây sẽ không vượt qua bước xác thực thay vì được viết lại. Hãy sửa
      thủ công các khóa đó theo tài liệu tham chiếu cấu hình hiện tại trước khi doctor
      có thể tiếp tục.
    </Note>

    Các lượt di chuyển đang hoạt động:

    | Khóa cũ                                                                                    | Khóa hiện tại                                                                 |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`, `gateway.webchat`                                                            | đã bị xóa (WebChat đã ngừng hoạt động)                                                 |
    | `channels.feishu.accounts.<accountId>.botName`                                                   | `channels.feishu.accounts.<accountId>.name`                                 |
    | `session.threadBindings.ttlHours`, `channels.<id>.threadBindings.ttlHours` (và theo từng tài khoản)      | `...threadBindings.idleHours`                                               |
    | `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` cũ        | `talk.provider` + `talk.providers.<provider>`                               |
    | các bộ chọn Talk thời gian thực cấp cao nhất cũ (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) | `talk.realtime`                                                              |
    | `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)                             | `messages.tts.providers.<provider>`                                          |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                  | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`   |
    | Các trường người nói TTS `voice`/`voiceName`/`voiceId`                                                 | `speakerVoice`/`speakerVoiceId`                                              |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>` (tất cả các kênh ngoại trừ Discord)                                          | `...tts.providers.<provider>`                                                |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>` (tất cả các kênh, bao gồm Discord)                          | `...voice.tts.providers.<provider>`                                          |
    | `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)     | `plugins.entries.voice-call.config.tts.providers.<provider>`                |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                | `provider: "microsoft"` / `...tts.providers.microsoft`                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                              | `"mock"`                                                                      |
    | `plugins.entries.voice-call.config.twilio.from`                                                  | `plugins.entries.voice-call.config.fromNumber`                              |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                        | `plugins.entries.voice-call.config.streaming.provider`                      |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"` (quá trình khởi động Gateway cũng bỏ qua các nhà cung cấp có `api` là một giá trị enum trong tương lai/không xác định thay vì đóng an toàn khi gặp lỗi) |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | đã bị xóa (cài đặt chuyển tiếp của tiện ích Chrome cũ)                             |
    | `mcp.servers.*.type` (các bí danh gốc CLI)                                                        | `mcp.servers.*.transport`                                                    |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | đã bị xóa (máy chủ ứng dụng Codex luôn giữ các công cụ không gian làm việc gốc Codex ở dạng nguyên bản) |
    | `commands.modelsWrite`                                                                           | đã bị xóa (`/models add` không còn được khuyến nghị)                                       |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                     | đã bị xóa (`NO_REPLY` chính xác không còn được viết lại thành văn bản dự phòng hiển thị)  |
    | `agents.defaults/list[].systemPromptOverride`                                                    | đã bị xóa (OpenClaw sở hữu lời nhắc hệ thống được tạo)                        |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | đã bị xóa (dùng `models.providers.<id>.timeoutSeconds` cho thời gian chờ của mô hình/nhà cung cấp chậm, được giữ thấp hơn giới hạn thời gian chờ của tác nhân/lượt chạy) |
    | `memorySearch` cấp cao nhất                                                                         | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path` (ở mọi cấp)                                                            | đã bị xóa (chỉ mục bộ nhớ nằm trong cơ sở dữ liệu của từng tác nhân)                       |
    | `heartbeat` cấp cao nhất                                                                            | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | ID chính sách `plugins.openai-codex`                                                                | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                 | đã bị xóa (không còn được khuyến nghị)                                                        |
    | `diagnostics.memoryPressureBundle`                                                               | `diagnostics.memoryPressureSnapshot`                                        |

    <Note>
      Các hàng `plugins.entries.voice-call.config.*` ở trên được chuẩn hóa bởi
      chính plugin Voice Call mỗi khi tải cấu hình, không phải bởi `openclaw
      doctor`. Plugin cũng ghi cảnh báo khởi động trỏ đến `openclaw
      doctor --fix`, nhưng doctor hiện không viết lại
      `openclaw.json` cho các khóa này; chính quá trình chuẩn hóa của plugin
      áp dụng thay đổi khi chạy.
    </Note>

    Hướng dẫn về tài khoản mặc định cho các kênh đa tài khoản:

    - Nếu hai hoặc nhiều mục `channels.<channel>.accounts` được cấu hình mà không có `channels.<channel>.defaultAccount` hoặc `accounts.default`, doctor sẽ cảnh báo rằng định tuyến dự phòng có thể chọn một tài khoản ngoài dự kiến.
    - Nếu `channels.<channel>.defaultAccount` được đặt thành một ID tài khoản không xác định, doctor sẽ cảnh báo và liệt kê các ID tài khoản đã cấu hình.

  </Accordion>
  <Accordion title="2b. Ghi đè nhà cung cấp OpenCode">
    Nếu bạn đã thêm thủ công `models.providers.opencode`, `opencode-zen` hoặc `opencode-go`, cấu hình đó sẽ ghi đè danh mục OpenCode tích hợp sẵn từ `openclaw/plugin-sdk/llm`. Điều này có thể buộc các mô hình sử dụng sai API hoặc đặt chi phí về 0. Doctor cảnh báo để bạn có thể xóa cấu hình ghi đè và khôi phục định tuyến API cùng chi phí theo từng mô hình.
  </Accordion>
  <Accordion title="2c. Di chuyển trình duyệt và trạng thái sẵn sàng của Chrome MCP">
    Nếu cấu hình trình duyệt vẫn trỏ đến đường dẫn tiện ích Chrome đã bị xóa, doctor sẽ chuẩn hóa cấu hình đó sang mô hình đính kèm Chrome MCP cục bộ trên máy chủ hiện tại (`browser.profiles.*.driver: "extension"` → `"existing-session"`; `browser.relayBindHost` đã bị xóa).

    Doctor cũng kiểm tra đường dẫn Chrome MCP cục bộ trên máy chủ khi bạn sử dụng `defaultProfile: "user"` hoặc một hồ sơ `existing-session` đã cấu hình:

    - kiểm tra xem Google Chrome có được cài đặt trên cùng máy chủ đối với các hồ sơ tự động kết nối mặc định hay không
    - kiểm tra phiên bản Chrome được phát hiện và cảnh báo khi phiên bản đó thấp hơn Chrome 144
    - nhắc bạn bật gỡ lỗi từ xa trong trang kiểm tra của trình duyệt (ví dụ: `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` hoặc `edge://inspect/#remote-debugging`)

    Doctor không thể bật cài đặt phía Chrome thay bạn. Chrome MCP cục bộ trên máy chủ vẫn yêu cầu trình duyệt dựa trên Chromium phiên bản 144+ trên máy chủ gateway/node, chạy cục bộ, đã bật gỡ lỗi từ xa và lời nhắc đồng ý đính kèm lần đầu đã được chấp thuận trong trình duyệt.

    Trạng thái sẵn sàng ở đây chỉ bao gồm các điều kiện tiên quyết để đính kèm cục bộ. Existing-session vẫn giữ các giới hạn định tuyến Chrome MCP hiện tại; các tuyến nâng cao như `responsebody`, xuất PDF, chặn tải xuống và thao tác hàng loạt vẫn yêu cầu trình duyệt được quản lý hoặc hồ sơ CDP thô. Kiểm tra này không áp dụng cho Docker, sandbox, trình duyệt từ xa hoặc các luồng không giao diện khác; các luồng này tiếp tục sử dụng CDP thô.

  </Accordion>
  <Accordion title="2d. Điều kiện tiên quyết về TLS cho OAuth">
    Khi một hồ sơ OAuth OpenAI Codex được cấu hình, doctor sẽ thăm dò điểm cuối ủy quyền OpenAI để xác minh rằng ngăn xếp TLS Node/OpenSSL cục bộ có thể xác thực chuỗi chứng chỉ. Nếu thăm dò thất bại do lỗi chứng chỉ (ví dụ: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, chứng chỉ hết hạn hoặc chứng chỉ tự ký), doctor sẽ in hướng dẫn khắc phục dành riêng cho nền tảng. Trên macOS với Node từ Homebrew, cách khắc phục thường là `brew postinstall ca-certificates`. Với `--deep`, quá trình thăm dò vẫn chạy ngay cả khi gateway hoạt động bình thường.
  </Accordion>
  <Accordion title="2e. Ghi đè nhà cung cấp OAuth Codex">
    Nếu trước đây bạn đã thêm các cài đặt truyền tải OpenAI cũ trong `models.providers.openai-codex`, chúng có thể che khuất đường dẫn nhà cung cấp OAuth Codex tích hợp sẵn. Doctor cảnh báo khi phát hiện các cài đặt truyền tải cũ đó cùng với OAuth Codex để bạn có thể xóa hoặc viết lại cấu hình ghi đè truyền tải lỗi thời và khôi phục hành vi định tuyến hiện tại. Proxy tùy chỉnh và cấu hình ghi đè chỉ dành cho tiêu đề vẫn được hỗ trợ và không kích hoạt cảnh báo này, nhưng các tuyến yêu cầu do người dùng tạo đó không đủ điều kiện để Codex được chọn ngầm định.
  </Accordion>
  <Accordion title="2f. Sửa chữa tuyến Codex">
    Doctor kiểm tra các tham chiếu mô hình `openai-codex/*` cũ. Định tuyến bộ khung Codex gốc sử dụng các tham chiếu mô hình `openai/*` chuẩn, nhưng chỉ riêng tiền tố không bao giờ chọn Codex. Khi chính sách runtime chưa được đặt hoặc là `auto`, chỉ tuyến HTTPS chính thức, khớp chính xác với Platform Responses hoặc ChatGPT Responses và không có cấu hình ghi đè yêu cầu do người dùng tạo mới đủ điều kiện. Xem [runtime tác tử ngầm định của OpenAI](/vi/providers/openai#implicit-agent-runtime).

    Trong chế độ `--fix` / `--repair`, doctor viết lại các tham chiếu bị ảnh hưởng của tác tử mặc định và từng tác tử, bao gồm mô hình chính, mô hình dự phòng, mô hình tạo hình ảnh/video, cấu hình ghi đè heartbeat/tác tử con/compaction, hook, cấu hình ghi đè mô hình kênh và trạng thái tuyến phiên lỗi thời đã được lưu:

    - `openai-codex/gpt-*` trở thành `openai/gpt-*`.
    - Ý định Codex được chuyển sang các mục `agentRuntime.id: "codex"` có phạm vi theo nhà cung cấp/mô hình cho các tham chiếu mô hình tác tử đã sửa.
    - Cấu hình runtime toàn tác tử lỗi thời và các ghim runtime phiên đã lưu bị xóa vì việc chọn runtime có phạm vi theo nhà cung cấp/mô hình.
    - Chính sách runtime theo nhà cung cấp/mô hình hiện có được giữ nguyên, trừ khi tham chiếu mô hình cũ đã sửa cần định tuyến Codex để giữ đường dẫn xác thực cũ.
    - Danh sách mô hình dự phòng hiện có được giữ nguyên với các mục cũ được viết lại; các cài đặt theo mô hình đã sao chép được chuyển từ khóa cũ sang khóa `openai/*` chuẩn.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, thông báo dự phòng và ghim hồ sơ xác thực của phiên đã lưu được sửa chữa trên tất cả kho phiên tác tử được phát hiện.
    - Doctor sửa riêng các ghim `agentRuntime.id: "codex-cli"` lỗi thời (một mã định danh runtime cũ riêng biệt) thành `"codex"` trên các mục mô hình `agents.defaults`, `agents.list[]` và `models.providers.*`.
    - `/codex ...` có nghĩa là "điều khiển hoặc liên kết một cuộc hội thoại Codex gốc từ cuộc trò chuyện."
    - `/acp ...` hoặc `runtime: "acp"` có nghĩa là "sử dụng bộ điều hợp ACP/acpx bên ngoài."

  </Accordion>
  <Accordion title="2g. Dọn dẹp tuyến phiên">
    Doctor cũng quét các kho phiên tác tử được phát hiện để tìm trạng thái tuyến tự động tạo đã lỗi thời sau khi bạn chuyển các mô hình hoặc runtime đã cấu hình khỏi một tuyến do plugin sở hữu, chẳng hạn như Codex.

    `openclaw doctor --fix` có thể xóa trạng thái tự động tạo đã lỗi thời như ghim mô hình `modelOverrideSource: "auto"`, siêu dữ liệu mô hình runtime, mã định danh bộ khung đã ghim, liên kết phiên CLI và cấu hình ghi đè hồ sơ xác thực tự động khi tuyến sở hữu chúng không còn được cấu hình. Các lựa chọn mô hình phiên do người dùng đặt rõ ràng hoặc lựa chọn cũ sẽ được báo cáo để xem xét thủ công và được giữ nguyên; hãy chuyển chúng bằng `/model ...`, `/new` hoặc đặt lại phiên khi tuyến đó không còn được dự định sử dụng.

  </Accordion>
  <Accordion title="3. Di chuyển trạng thái cũ (bố cục đĩa)">
    Doctor có thể di chuyển các bố cục cũ trên đĩa sang cấu trúc hiện tại:

    - Kho phiên + bản chép lời: từ `~/.openclaw/sessions/` sang `~/.openclaw/agents/<agentId>/sessions/`
    - Thư mục tác tử: từ `~/.openclaw/agent/` sang `~/.openclaw/agents/<agentId>/agent/`
    - Trạng thái xác thực WhatsApp (Baileys): từ `~/.openclaw/credentials/*.json` cũ (ngoại trừ `oauth.json`) sang `~/.openclaw/credentials/whatsapp/<accountId>/...` (mã định danh tài khoản mặc định: `default`)

    Các quá trình di chuyển này được thực hiện theo khả năng tốt nhất và có tính lũy đẳng; doctor đưa ra cảnh báo khi để lại bất kỳ thư mục cũ nào làm bản sao lưu. Gateway/CLI cũng tự động di chuyển kho phiên cũ + thư mục tác tử khi khởi động để lịch sử/xác thực/mô hình được đưa vào đường dẫn theo từng tác tử mà không cần chạy doctor thủ công. Việc di chuyển xác thực WhatsApp được chủ ý chỉ thực hiện qua `openclaw doctor`. Quá trình chuẩn hóa nhà cung cấp thoại/bản đồ nhà cung cấp so sánh theo tính bằng nhau về cấu trúc, vì vậy các khác biệt chỉ về thứ tự khóa không còn kích hoạt lặp lại các thay đổi `doctor --fix` không có tác dụng.

  </Accordion>
  <Accordion title="3a. Di chuyển manifest plugin cũ">
    Doctor quét tất cả manifest plugin đã cài đặt để tìm các khóa khả năng cấp cao nhất đã lỗi thời (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Khi tìm thấy, doctor đề nghị chuyển chúng vào đối tượng `contracts` và viết lại trực tiếp tệp manifest. Quá trình di chuyển này có tính lũy đẳng; nếu `contracts` đã có cùng các giá trị, khóa cũ sẽ bị xóa mà không nhân đôi dữ liệu.
  </Accordion>
  <Accordion title="3b. Di chuyển kho cron cũ">
    Doctor cũng kiểm tra kho tác vụ cron (`~/.openclaw/cron/jobs.json` theo mặc định hoặc `cron.store` khi bị ghi đè) để tìm các hình dạng tác vụ cũ mà bộ lập lịch vẫn chấp nhận nhằm tương thích.

    Các thao tác dọn dẹp cron hiện tại bao gồm:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - các trường tải trọng cấp cao nhất (`message`, `model`, `thinking`, ...) → `payload`
    - các trường phân phối cấp cao nhất (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - các bí danh phân phối `provider` của tải trọng → `delivery.channel` rõ ràng
    - các tác vụ dự phòng webhook `notify: true` cũ → phân phối webhook rõ ràng từ `cron.webhook` khi được đặt; các tác vụ thông báo giữ nguyên phân phối trò chuyện và nhận `delivery.completionDestination`. Khi `cron.webhook` chưa được đặt, dấu `notify` cấp cao nhất không hoạt động sẽ bị xóa đối với các tác vụ không có đích (phân phối hiện có, bao gồm thông báo, được giữ nguyên) vì phân phối runtime không bao giờ đọc dấu này.

    Gateway cũng làm sạch các hàng cron không đúng định dạng khi tải để các tác vụ hợp lệ tiếp tục chạy. Các hàng thô không đúng định dạng được sao chép sang `jobs-quarantine.json` bên cạnh kho đang hoạt động trước khi bị xóa khỏi `jobs.json`; doctor báo cáo các hàng đã cách ly để bạn có thể xem xét hoặc sửa chữa chúng theo cách thủ công.

    Khi khởi động, Gateway chuẩn hóa phép chiếu runtime và bỏ qua dấu `notify` cấp cao nhất, nhưng giữ nguyên cấu hình cron đã lưu để doctor sửa chữa. Khi `cron.webhook` chưa được đặt, doctor xóa dấu không hoạt động đối với các tác vụ không có đích di chuyển (`delivery.mode` là none/không có, đích webhook không thể sử dụng hoặc đã có phân phối thông báo/trò chuyện), đồng thời giữ nguyên phân phối hiện có, vì vậy các lần chạy `doctor --fix` lặp lại không còn cảnh báo lại về cùng một tác vụ. Nếu `cron.webhook` được đặt nhưng không phải URL HTTP(S) hợp lệ, doctor vẫn cảnh báo và giữ lại dấu để bạn có thể sửa URL.

    Trên Linux, doctor cũng cảnh báo khi crontab của người dùng vẫn gọi `~/.openclaw/bin/ensure-whatsapp.sh` cũ. Tập lệnh cục bộ trên máy chủ này không được OpenClaw hiện tại duy trì và có thể ghi sai các thông báo `Gateway inactive` vào `~/.openclaw/logs/whatsapp-health.log` khi cron không thể kết nối với bus người dùng systemd. Xóa mục crontab lỗi thời bằng `crontab -e`; sử dụng `openclaw channels status --probe`, `openclaw doctor` và `openclaw gateway status` cho các kiểm tra tình trạng hiện tại.

  </Accordion>
  <Accordion title="3c. Dọn dẹp khóa phiên">
    Doctor quét mọi thư mục phiên tác tử để tìm các tệp khóa ghi lỗi thời còn sót lại khi một phiên thoát bất thường. Với mỗi tệp khóa được tìm thấy, doctor báo cáo: đường dẫn, PID, PID còn hoạt động hay không, tuổi của khóa và khóa có được coi là lỗi thời hay không (PID đã chết, siêu dữ liệu chủ sở hữu không đúng định dạng, cũ hơn 30 phút hoặc PID còn hoạt động được chứng minh là thuộc về một tiến trình không phải OpenClaw). Trong chế độ `--fix` / `--repair`, doctor tự động xóa các khóa có chủ sở hữu đã chết, mồ côi, được tái sử dụng, có dữ liệu cũ không đúng định dạng hoặc không phải OpenClaw. Các khóa cũ vẫn thuộc sở hữu của một tiến trình OpenClaw đang hoạt động sẽ được báo cáo nhưng giữ nguyên để doctor không ngắt một trình ghi bản chép lời đang hoạt động.
  </Accordion>
  <Accordion title="3d. Sửa chữa nhánh bản chép lời phiên">
    Doctor quét các tệp JSONL phiên tác tử để tìm hình dạng nhánh trùng lặp do lỗi viết lại bản chép lời lời nhắc ngày 2026.4.24 tạo ra: một lượt người dùng bị bỏ dở có ngữ cảnh runtime nội bộ của OpenClaw cùng với một nhánh cùng cấp đang hoạt động chứa cùng lời nhắc hiển thị của người dùng. Trong chế độ `--fix` / `--repair`, doctor sao lưu từng tệp bị ảnh hưởng bên cạnh tệp gốc và viết lại bản chép lời theo nhánh đang hoạt động để lịch sử gateway và các trình đọc bộ nhớ không còn thấy các lượt trùng lặp.
  </Accordion>
  <Accordion title="4. Kiểm tra tính toàn vẹn của trạng thái (lưu giữ phiên, định tuyến và an toàn)">
    Thư mục trạng thái là trung枢 vận hành. Nếu thư mục này biến mất, bạn sẽ mất các phiên, thông tin xác thực, nhật ký và cấu hình, trừ khi có bản sao lưu ở nơi khác.

    Doctor kiểm tra:

    - **Thiếu thư mục trạng thái**: cảnh báo về nguy cơ mất trạng thái nghiêm trọng, nhắc tạo lại thư mục và lưu ý rằng không thể khôi phục dữ liệu bị thiếu.
    - **Quyền của thư mục trạng thái**: xác minh khả năng ghi; đề nghị sửa quyền (và đưa ra gợi ý `chown` khi phát hiện chủ sở hữu/nhóm không khớp).
    - **Thư mục trạng thái được đồng bộ hóa với đám mây trên macOS**: cảnh báo khi trạng thái được phân giải bên trong iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) hoặc `~/Library/CloudStorage/...`, vì các đường dẫn được hỗ trợ bằng đồng bộ hóa có thể khiến I/O chậm hơn và gây ra xung đột khóa/đồng bộ hóa.
    - **Thư mục trạng thái trên SD hoặc eMMC của Linux**: cảnh báo khi trạng thái được phân giải tới một nguồn gắn kết `mmcblk*`, vì I/O ngẫu nhiên trên SD/eMMC có thể chậm hơn và làm thiết bị hao mòn nhanh hơn khi ghi phiên và thông tin xác thực.
    - **Thư mục trạng thái khả biến trên Linux**: cảnh báo khi trạng thái được phân giải tới `tmpfs` hoặc `ramfs`, vì các phiên, thông tin xác thực, cấu hình và trạng thái SQLite (cùng các tệp phụ WAL/nhật ký) sẽ biến mất khi khởi động lại. Các điểm gắn kết Docker `overlay` chủ ý không bị gắn cờ vì lớp có thể ghi của chúng vẫn tồn tại sau khi máy chủ khởi động lại, miễn là vùng chứa vẫn còn.
    - **Thiếu thư mục phiên**: cần có `sessions/` và thư mục kho lưu trữ phiên để duy trì lịch sử và tránh sự cố `ENOENT`.
    - **Bản chép lời không khớp**: cảnh báo khi các mục phiên gần đây bị thiếu tệp bản chép lời.
    - **Phiên chính "JSONL 1 dòng"**: gắn cờ khi bản chép lời chính chỉ có một dòng (lịch sử không được tích lũy).
    - **Nhiều thư mục trạng thái**: cảnh báo khi có nhiều thư mục `~/.openclaw` trong các thư mục chính hoặc khi `OPENCLAW_STATE_DIR` trỏ đến nơi khác (lịch sử có thể bị phân tách giữa các bản cài đặt).
    - **Lời nhắc chế độ từ xa**: nếu `gateway.mode=remote`, doctor nhắc bạn chạy nó trên máy chủ từ xa (trạng thái nằm tại đó).
    - **Quyền của tệp cấu hình**: cảnh báo nếu nhóm/mọi người có thể đọc `~/.openclaw/openclaw.json` và đề nghị siết quyền thành `600`.

  </Accordion>
  <Accordion title="5. Tình trạng xác thực mô hình (OAuth hết hạn)">
    Doctor kiểm tra các hồ sơ OAuth trong kho xác thực, cảnh báo khi token sắp hết hạn/đã hết hạn và có thể làm mới chúng khi an toàn. Nếu hồ sơ OAuth/token của Anthropic đã cũ, công cụ sẽ đề xuất khóa API Anthropic hoặc đường dẫn setup-token của Anthropic. Lời nhắc làm mới chỉ xuất hiện khi chạy ở chế độ tương tác (TTY); `--non-interactive` sẽ bỏ qua các lần thử làm mới.

    Khi việc làm mới OAuth thất bại vĩnh viễn (ví dụ `refresh_token_reused`, `invalid_grant` hoặc nhà cung cấp yêu cầu bạn đăng nhập lại), doctor báo rằng cần xác thực lại và in chính xác lệnh `openclaw models auth login --provider ...` cần chạy.

    Doctor cũng báo cáo các hồ sơ xác thực tạm thời không dùng được do thời gian chờ ngắn (giới hạn tốc độ/hết thời gian/lỗi xác thực) hoặc bị vô hiệu hóa lâu hơn (lỗi thanh toán/tín dụng).

    Các hồ sơ OAuth Codex cũ có token nằm trong macOS Keychain (quy trình thiết lập ban đầu cũ trước bố cục tệp phụ dựa trên tệp) chỉ được doctor sửa chữa. Chạy `openclaw doctor --fix` một lần từ thiết bị đầu cuối tương tác để di chuyển trực tiếp các token cũ được Keychain lưu trữ vào `auth-profiles.json`; sau đó, các lượt chạy nhúng (Telegram, cron, điều phối tác tử con) sẽ phân giải chúng thành hồ sơ OAuth OpenAI chuẩn.

  </Accordion>
  <Accordion title="6. Xác thực mô hình của hook">
    Nếu `hooks.gmail.model` được đặt, doctor sẽ xác thực tham chiếu mô hình dựa trên danh mục và danh sách cho phép, đồng thời cảnh báo khi tham chiếu đó không thể được phân giải hoặc không được phép.
  </Accordion>
  <Accordion title="7. Sửa chữa ảnh sandbox">
    Khi sandbox được bật, doctor kiểm tra các ảnh Docker và đề nghị xây dựng hoặc chuyển sang tên cũ nếu thiếu ảnh hiện tại.
  </Accordion>
  <Accordion title="7b. Dọn dẹp bản cài đặt Plugin">
    Ở chế độ `openclaw doctor --fix` / `openclaw doctor --repair`, doctor xóa trạng thái dàn dựng phần phụ thuộc Plugin cũ do OpenClaw tạo ra: các thư mục gốc phần phụ thuộc đã tạo nhưng không còn dùng, các thư mục giai đoạn cài đặt cũ, phần dư thừa cục bộ trong gói từ mã sửa chữa phần phụ thuộc Plugin tích hợp trước đây và các bản sao npm được quản lý bị mồ côi hoặc đã khôi phục của những Plugin `@openclaw/*` tích hợp có thể che khuất tệp kê khai tích hợp hiện tại. Doctor cũng liên kết lại gói `openclaw` trên máy chủ vào các Plugin npm được quản lý có khai báo `peerDependencies.openclaw`, để các lệnh nhập runtime cục bộ của gói như `openclaw/plugin-sdk/*` tiếp tục được phân giải sau khi cập nhật hoặc sửa chữa npm.

    Doctor cũng có thể cài đặt lại các Plugin có thể tải xuống nhưng bị thiếu khi cấu hình tham chiếu đến chúng mà sổ đăng ký Plugin cục bộ không tìm thấy chúng (các `plugins.entries` quan trọng, cài đặt kênh/nhà cung cấp/tìm kiếm đã cấu hình, runtime tác tử đã cấu hình). Trong quá trình cập nhật gói, doctor tránh cài đặt lại các gói Plugin khi gói lõi đang được thay thế; hãy chạy lại `openclaw doctor --fix` sau khi cập nhật nếu một Plugin đã cấu hình vẫn cần được khôi phục. Ngoài ngoại lệ khởi động ảnh vùng chứa bên dưới, quá trình khởi động Gateway và tải lại cấu hình không thực hiện sửa chữa gói; việc cài đặt Plugin vẫn là thao tác doctor/cài đặt/cập nhật rõ ràng.

    Quá trình khởi động Gateway trong vùng chứa có một ngoại lệ nâng cấp hẹp: khi `openclaw gateway run` khởi động trên phiên bản OpenClaw mới, nó chạy các quá trình di chuyển trạng thái an toàn và quá trình hội tụ Plugin hậu lõi hiện có trước khi sẵn sàng, sau đó ghi lại một điểm kiểm tra cho từng phiên bản. Lượt khởi động này có thể dọn dẹp các bản ghi Plugin tích hợp đã cũ, sửa các liên kết Plugin cục bộ, cài đặt lại các gói Plugin đã cấu hình khi đường dẫn hội tụ yêu cầu và kiểm tra các payload Plugin đang hoạt động. Nếu quá trình khởi động không thể sửa chữa an toàn, hãy chạy cùng ảnh đó một lần với `openclaw doctor --fix` trên cùng trạng thái/cấu hình được gắn kết trước khi khởi động lại vùng chứa theo cách thông thường.

  </Accordion>
  <Accordion title="8. Di chuyển dịch vụ Gateway và gợi ý dọn dẹp">
    Doctor phát hiện các dịch vụ Gateway cũ (launchd/systemd/schtasks), đồng thời đề nghị xóa chúng và cài đặt dịch vụ OpenClaw bằng cổng Gateway hiện tại. Công cụ cũng có thể quét các dịch vụ bổ sung giống Gateway và in gợi ý dọn dẹp. Các dịch vụ Gateway OpenClaw được đặt tên theo hồ sơ được coi là thành phần hạng nhất và không bị gắn cờ là "bổ sung".

    Trên Linux, nếu thiếu dịch vụ Gateway cấp người dùng nhưng có dịch vụ Gateway OpenClaw cấp hệ thống, doctor sẽ không tự động cài đặt thêm dịch vụ cấp người dùng thứ hai. Kiểm tra bằng `openclaw gateway status --deep` hoặc `openclaw doctor --deep`, sau đó xóa bản trùng lặp hoặc đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi trình giám sát hệ thống quản lý vòng đời Gateway.

  </Accordion>
  <Accordion title="8b. Di chuyển Matrix khi khởi động">
    Khi tài khoản kênh Matrix có quá trình di chuyển trạng thái cũ đang chờ xử lý hoặc có thể thực hiện, doctor (ở chế độ `--fix` / `--repair`) tạo ảnh chụp nhanh trước khi di chuyển rồi chạy các bước di chuyển theo nỗ lực tối đa: di chuyển trạng thái Matrix cũ và chuẩn bị trạng thái mã hóa cũ. Cả hai bước đều không gây lỗi nghiêm trọng; lỗi được ghi nhật ký và quá trình khởi động tiếp tục. Ở chế độ chỉ đọc (`openclaw doctor` không có `--fix`), bước kiểm tra này bị bỏ qua hoàn toàn.
  </Accordion>
  <Accordion title="8c. Ghép đôi thiết bị và sai lệch xác thực">
    Doctor kiểm tra trạng thái ghép đôi thiết bị trong quá trình kiểm tra tình trạng thông thường và báo cáo:

    - các yêu cầu ghép đôi lần đầu đang chờ xử lý
    - các nâng cấp vai trò hoặc phạm vi đang chờ xử lý cho thiết bị đã ghép đôi
    - các trường hợp sửa lỗi khóa công khai không khớp, trong đó ID thiết bị vẫn khớp nhưng danh tính thiết bị không còn khớp với bản ghi đã phê duyệt
    - các bản ghi đã ghép đôi bị thiếu token đang hoạt động cho một vai trò đã phê duyệt
    - các token đã ghép đôi có phạm vi sai lệch khỏi đường cơ sở ghép đôi đã phê duyệt
    - các mục token thiết bị được lưu vào bộ nhớ đệm cục bộ cho máy hiện tại có từ trước lần xoay vòng token phía Gateway hoặc chứa siêu dữ liệu phạm vi đã cũ

    Doctor không tự động phê duyệt yêu cầu ghép đôi hoặc tự động xoay vòng token thiết bị. Công cụ in chính xác các bước tiếp theo:

    - kiểm tra các yêu cầu đang chờ xử lý bằng `openclaw devices list`
    - phê duyệt chính xác yêu cầu bằng `openclaw devices approve <requestId>`
    - xoay vòng một token mới bằng `openclaw devices rotate --device <deviceId> --role <role>`
    - xóa và phê duyệt lại một bản ghi đã cũ bằng `openclaw devices remove <deviceId>`

    Điều này phân biệt việc ghép đôi lần đầu với các nâng cấp vai trò/phạm vi đang chờ xử lý và với sai lệch token/danh tính thiết bị đã cũ, qua đó khắc phục lỗ hổng phổ biến "đã ghép đôi nhưng vẫn nhận thông báo yêu cầu ghép đôi".

  </Accordion>
  <Accordion title="9. Cảnh báo bảo mật">
    Doctor chỉ đưa ra ghi chú Bảo mật khi tìm thấy cảnh báo, chẳng hạn như một nhà cung cấp mở tin nhắn trực tiếp mà không có danh sách cho phép hoặc một chính sách được cấu hình nguy hiểm. Dùng `openclaw security audit` để xem toàn bộ danh mục bảo mật.
  </Accordion>
  <Accordion title="10. Duy trì systemd (Linux)">
    Nếu chạy dưới dạng dịch vụ người dùng systemd, doctor đảm bảo chế độ duy trì được bật để Gateway tiếp tục hoạt động sau khi đăng xuất.
  </Accordion>
  <Accordion title="11. Trạng thái không gian làm việc (Skills, Plugin và TaskFlow)">
    Doctor in các sự cố và hành động cho tác tử mặc định, không phải danh mục trạng thái khỏe mạnh:

    - **Skills**: liệt kê tên các skill được phép nhưng không sử dụng được; dùng `openclaw skills check` để xem chi tiết yêu cầu và tổng số đầy đủ.
    - **Plugin**: chỉ báo cáo các ID Plugin bị lỗi; dùng `openclaw plugins list` để xem danh mục Plugin đã tải, đã nhập, bị vô hiệu hóa và tích hợp.
    - **Cảnh báo tương thích Plugin**: gắn cờ các Plugin có vấn đề tương thích với runtime hiện tại.
    - **Chẩn đoán Plugin**: hiển thị mọi cảnh báo hoặc lỗi trong lúc tải do sổ đăng ký Plugin phát ra.
    - **Khôi phục TaskFlow**: hiển thị các TaskFlow được quản lý đáng ngờ cần kiểm tra hoặc hủy thủ công.
    - **Claude CLI**: chỉ báo cáo các sự cố về tệp nhị phân, xác thực, hồ sơ, không gian làm việc hoặc thư mục dự án; chi tiết thăm dò khỏe mạnh bị lược bỏ.

  </Accordion>
  <Accordion title="11b. Kích thước tệp khởi tạo">
    Doctor kiểm tra xem các tệp khởi tạo không gian làm việc (ví dụ `AGENTS.md`, `CLAUDE.md` hoặc các tệp ngữ cảnh được chèn khác) có gần hoặc vượt quá ngân sách ký tự đã cấu hình hay không. Công cụ báo cáo số ký tự thô so với số ký tự được chèn theo từng tệp, tỷ lệ phần trăm bị cắt bớt, nguyên nhân cắt bớt (`max/file` hoặc `max/total`) và tổng số ký tự được chèn dưới dạng tỷ lệ của tổng ngân sách. Khi tệp bị cắt bớt hoặc gần đạt giới hạn, doctor in các mẹo điều chỉnh `agents.defaults.bootstrapMaxChars` và `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Tự động hoàn thành shell">
    Doctor kiểm tra xem tính năng hoàn thành bằng phím tab đã được cài đặt cho shell hiện tại (zsh, bash, fish hoặc PowerShell) hay chưa:

    - Nếu hồ sơ shell sử dụng mẫu hoàn thành động chậm (`source <(openclaw completion ...)`), doctor sẽ nâng cấp nó lên biến thể tệp được lưu vào bộ nhớ đệm nhanh hơn.
    - Nếu tính năng hoàn thành được cấu hình trong hồ sơ nhưng thiếu tệp bộ nhớ đệm, doctor sẽ tự động tạo lại bộ nhớ đệm.
    - Nếu hoàn toàn chưa cấu hình tính năng hoàn thành, doctor sẽ nhắc cài đặt (chỉ ở chế độ tương tác; bị bỏ qua với `--non-interactive`).

    Chạy `openclaw completion --write-state` để tạo lại bộ nhớ đệm theo cách thủ công.

  </Accordion>
  <Accordion title="11d. Dọn dẹp Plugin kênh đã cũ">
    Khi `openclaw doctor --fix` xóa một Plugin kênh bị thiếu, nó cũng xóa cấu hình thuộc phạm vi kênh đang treo đã tham chiếu đến Plugin đó: các mục `channels.<id>`, các đích Heartbeat có tên kênh và các giá trị ghi đè `agents.*.models["<channel>/*"]`. Điều này ngăn vòng lặp khởi động Gateway khi runtime kênh đã biến mất nhưng cấu hình vẫn yêu cầu Gateway liên kết với nó.
  </Accordion>
  <Accordion title="12. Kiểm tra xác thực Gateway (token cục bộ)">
    Doctor kiểm tra mức độ sẵn sàng của xác thực token Gateway cục bộ.

    - Nếu chế độ token cần token nhưng không có nguồn token nào, doctor sẽ đề nghị tạo một token.
    - Nếu `gateway.auth.token` được SecretRef quản lý nhưng không khả dụng, doctor sẽ cảnh báo và không ghi đè nó bằng văn bản thuần túy.
    - `openclaw doctor --generate-gateway-token` chỉ buộc tạo khi không cấu hình SecretRef cho token.

  </Accordion>
  <Accordion title="12b. Sửa chữa chỉ đọc có nhận biết SecretRef">
    Một số quy trình sửa chữa cần kiểm tra thông tin xác thực đã cấu hình mà không làm suy yếu hành vi dừng sớm khi lỗi của runtime.

    - `openclaw doctor --fix` sử dụng cùng mô hình tóm tắt SecretRef chỉ đọc như các lệnh thuộc nhóm trạng thái để sửa chữa cấu hình có mục tiêu.
    - Ví dụ: quá trình sửa chữa Telegram `allowFrom` / `groupAllowFrom` `@username` cố gắng sử dụng thông tin xác thực bot đã cấu hình khi có sẵn.
    - Nếu token bot Telegram được cấu hình qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại, doctor báo rằng thông tin xác thực đã được cấu hình nhưng không khả dụng và bỏ qua quá trình tự động phân giải thay vì gặp sự cố hoặc báo sai rằng token bị thiếu.

  </Accordion>
  <Accordion title="13. Kiểm tra tình trạng Gateway + khởi động lại">
    Doctor chạy kiểm tra tình trạng và đề nghị khởi động lại Gateway khi có vẻ không hoạt động bình thường.
  </Accordion>
  <Accordion title="13b. Mức độ sẵn sàng của tìm kiếm bộ nhớ">
    Doctor kiểm tra xem nhà cung cấp embedding tìm kiếm bộ nhớ đã cấu hình có sẵn sàng cho tác nhân mặc định hay không. Hành vi phụ thuộc vào backend và nhà cung cấp đã cấu hình:

    - **Backend QMD**: kiểm tra xem tệp nhị phân `qmd` có khả dụng và có thể khởi động hay không. Nếu không, in hướng dẫn khắc phục, bao gồm `npm install -g @tobilu/qmd` (hoặc lệnh tương đương cho Bun) và tùy chọn đường dẫn tệp nhị phân thủ công.
    - **Nhà cung cấp cục bộ được chỉ định rõ ràng**: kiểm tra tệp mô hình cục bộ hoặc URL mô hình từ xa/có thể tải xuống được nhận dạng. Nếu thiếu, đề xuất chuyển sang nhà cung cấp từ xa.
    - **Nhà cung cấp từ xa được chỉ định rõ ràng** (`openai`, `voyage`, v.v.): xác minh khóa API có trong môi trường hoặc kho xác thực. In gợi ý khắc phục có thể thực hiện nếu khóa bị thiếu.
    - **Nhà cung cấp tự động cũ**: coi `memorySearch.provider: "auto"` là OpenAI, kiểm tra mức độ sẵn sàng của OpenAI và `doctor --fix` ghi lại thành `provider: "openai"`.

    Khi có kết quả thăm dò Gateway được lưu trong bộ nhớ đệm (Gateway hoạt động bình thường tại thời điểm kiểm tra), doctor đối chiếu kết quả đó với cấu hình hiển thị qua CLI và ghi chú mọi điểm không nhất quán. Doctor không bắt đầu một lượt ping embedding mới trên đường dẫn mặc định; hãy sử dụng lệnh trạng thái bộ nhớ chuyên sâu khi cần kiểm tra trực tiếp nhà cung cấp.

    Sử dụng `openclaw memory status --deep` để xác minh mức độ sẵn sàng của embedding trong thời gian chạy.

  </Accordion>
  <Accordion title="14. Cảnh báo trạng thái kênh">
    Nếu Gateway hoạt động bình thường, doctor chạy thăm dò trạng thái kênh và báo cáo cảnh báo kèm các cách khắc phục được đề xuất.
  </Accordion>
  <Accordion title="15. Kiểm tra + sửa chữa cấu hình trình giám sát">
    Doctor kiểm tra cấu hình trình giám sát đã cài đặt (launchd/systemd/schtasks) để tìm các giá trị mặc định bị thiếu hoặc lỗi thời (ví dụ: phần phụ thuộc network-online của systemd và độ trễ khởi động lại). Khi phát hiện điểm không khớp, doctor đề xuất cập nhật và có thể ghi lại tệp dịch vụ/tác vụ theo các giá trị mặc định hiện tại.

    Lưu ý:

    - `openclaw doctor` hỏi trước khi ghi lại cấu hình trình giám sát.
    - `openclaw doctor --yes` chấp nhận các lời nhắc sửa chữa mặc định.
    - `openclaw doctor --fix` áp dụng các bản sửa lỗi được đề xuất mà không hiển thị lời nhắc (`--repair` là bí danh).
    - `openclaw doctor --fix --force` ghi đè các cấu hình trình giám sát tùy chỉnh.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` giữ doctor ở chế độ chỉ đọc đối với vòng đời dịch vụ Gateway. Doctor vẫn báo cáo tình trạng dịch vụ và chạy các sửa chữa không liên quan đến dịch vụ, nhưng bỏ qua việc cài đặt/khởi động/khởi động lại/bootstrap dịch vụ, ghi lại cấu hình trình giám sát và dọn dẹp dịch vụ cũ vì một trình giám sát bên ngoài sở hữu vòng đời đó.
    - Trên Linux, doctor không ghi lại siêu dữ liệu lệnh/điểm vào trong khi đơn vị Gateway systemd tương ứng đang hoạt động. Doctor cũng bỏ qua các đơn vị bổ sung giống Gateway không hoạt động và không phải loại cũ trong quá trình quét dịch vụ trùng lặp, để các tệp dịch vụ đồng hành không tạo ra thông báo dọn dẹp không cần thiết.
    - Nếu xác thực bằng token yêu cầu token và `gateway.auth.token` được SecretRef quản lý, quá trình cài đặt/sửa chữa dịch vụ của doctor sẽ xác thực SecretRef nhưng không lưu các giá trị token văn bản thuần đã phân giải vào siêu dữ liệu môi trường dịch vụ của trình giám sát.
    - Doctor phát hiện các giá trị môi trường dịch vụ được quản lý bằng `.env`/SecretRef mà các bản cài đặt LaunchAgent, systemd hoặc Windows Scheduled Task cũ đã nhúng trực tiếp, rồi ghi lại siêu dữ liệu dịch vụ để các giá trị đó được tải từ nguồn thời gian chạy thay vì từ định nghĩa trình giám sát.
    - Doctor phát hiện khi lệnh dịch vụ vẫn cố định một `--port` cũ sau khi `gateway.port` thay đổi và ghi lại siêu dữ liệu dịch vụ theo cổng hiện tại.
    - Nếu xác thực bằng token yêu cầu token và SecretRef của token đã cấu hình chưa được phân giải, doctor sẽ chặn đường dẫn cài đặt/sửa chữa và cung cấp hướng dẫn có thể thực hiện.
    - Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình còn `gateway.auth.mode` chưa được đặt, doctor sẽ chặn cài đặt/sửa chữa cho đến khi chế độ được đặt rõ ràng.
    - Đối với các đơn vị user-systemd trên Linux, quá trình kiểm tra sai lệch token của doctor bao gồm cả nguồn `Environment=` và `EnvironmentFile=` khi so sánh siêu dữ liệu xác thực dịch vụ.
    - Quá trình sửa chữa dịch vụ của doctor từ chối ghi lại, dừng hoặc khởi động lại dịch vụ Gateway từ tệp nhị phân OpenClaw cũ hơn khi cấu hình được ghi gần nhất bởi một phiên bản mới hơn. Xem [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Luôn có thể buộc ghi lại toàn bộ qua `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Chẩn đoán thời gian chạy + cổng của Gateway">
    Doctor kiểm tra thời gian chạy của dịch vụ (PID, trạng thái thoát gần nhất) và cảnh báo khi dịch vụ đã được cài đặt nhưng thực tế không chạy. Doctor cũng kiểm tra xung đột cổng trên cổng Gateway (mặc định `18789`) và báo cáo các nguyên nhân có khả năng xảy ra (Gateway đã chạy, đường hầm SSH).
  </Accordion>
  <Accordion title="17. Các phương pháp hay nhất cho thời gian chạy Gateway">
    Doctor cảnh báo khi dịch vụ Gateway chạy trên Bun hoặc đường dẫn Node do trình quản lý phiên bản quản lý (`nvm`, `fnm`, `volta`, `asdf`, v.v.). Bun không thể mở kho trạng thái `node:sqlite` của OpenClaw, vì vậy quá trình sửa chữa sẽ di chuyển các dịch vụ Bun cũ sang Node. Đường dẫn của trình quản lý phiên bản có thể bị hỏng sau khi nâng cấp vì dịch vụ không tải phần khởi tạo shell. Doctor đề nghị di chuyển sang bản cài đặt Node hệ thống khi có sẵn (Homebrew/apt/choco).

    Các LaunchAgent macOS mới được cài đặt hoặc sửa chữa sử dụng PATH hệ thống chuẩn (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) thay vì sao chép PATH của shell tương tác, nhờ đó các tệp nhị phân hệ thống do Homebrew quản lý vẫn khả dụng, trong khi Volta, asdf, fnm, pnpm và các thư mục trình quản lý phiên bản khác không làm thay đổi Node mà các tiến trình con phân giải. Các dịch vụ Linux vẫn giữ các thư mục gốc môi trường rõ ràng (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) và các thư mục tệp nhị phân người dùng ổn định, nhưng các thư mục dự phòng của trình quản lý phiên bản được phỏng đoán chỉ được ghi vào PATH dịch vụ khi chúng tồn tại trên đĩa.

  </Accordion>
  <Accordion title="18. Ghi cấu hình + siêu dữ liệu trình hướng dẫn">
    Doctor lưu mọi thay đổi cấu hình và đóng dấu siêu dữ liệu trình hướng dẫn để ghi lại lần chạy doctor.
  </Accordion>
  <Accordion title="19. Mẹo về không gian làm việc (sao lưu + hệ thống bộ nhớ)">
    Doctor đề xuất một hệ thống bộ nhớ cho không gian làm việc khi còn thiếu và in mẹo sao lưu nếu không gian làm việc chưa được quản lý bằng git.

    Xem [/concepts/agent-workspace](/vi/concepts/agent-workspace) để biết hướng dẫn đầy đủ về cấu trúc không gian làm việc và sao lưu bằng git (khuyến nghị dùng GitHub hoặc GitLab riêng tư).

  </Accordion>
</AccordionGroup>

## Liên quan

- [Cẩm nang vận hành Gateway](/vi/gateway)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
