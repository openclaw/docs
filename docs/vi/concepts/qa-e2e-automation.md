---
read_when:
    - Hiểu cách ngăn xếp QA phối hợp với nhau
    - Mở rộng qa-lab, qa-channel hoặc một bộ điều hợp truyền tải
    - Thêm các kịch bản QA dựa trên kho mã nguồn
    - Xây dựng tự động hóa QA có độ chân thực cao hơn xoay quanh bảng điều khiển Gateway
summary: 'Tổng quan về ngăn xếp QA: qa-lab, qa-channel, các kịch bản dựa trên kho mã, các làn truyền tải trực tiếp, bộ chuyển đổi truyền tải và báo cáo.'
title: Tổng quan về QA
x-i18n:
    generated_at: "2026-05-04T02:23:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b376767b967a51cc8a45ca5ce420f78067b52e6368d2abe921ffed533f6f9ba
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Ngăn xếp QA riêng tư nhằm kiểm thử OpenClaw theo cách thực tế hơn, giống hình dạng kênh hơn so với một bài kiểm thử đơn vị đơn lẻ.

Các thành phần hiện tại:

- `extensions/qa-channel`: kênh tin nhắn tổng hợp với các bề mặt DM, kênh, chuỗi thảo luận,
  phản ứng, chỉnh sửa và xóa.
- `extensions/qa-lab`: giao diện gỡ lỗi và bus QA để quan sát bản ghi hội thoại,
  chèn tin nhắn đến và xuất báo cáo Markdown.
- `extensions/qa-matrix`, các runner Plugin trong tương lai: bộ chuyển đổi truyền tải trực tiếp
  điều khiển một kênh thật bên trong Gateway QA con.
- `qa/`: tài sản seed được repo hỗ trợ cho tác vụ khởi động và các kịch bản QA
  cơ sở.
- [Mantis](/vi/concepts/mantis): xác minh trực tiếp trước và sau cho các lỗi
  cần truyền tải thật, ảnh chụp màn hình trình duyệt, trạng thái VM và bằng chứng PR.

## Bề mặt lệnh

Mọi luồng QA chạy dưới `pnpm openclaw qa <subcommand>`. Nhiều luồng có bí danh script `pnpm qa:*`;
cả hai dạng đều được hỗ trợ.

| Lệnh                                                | Mục đích                                                                                                                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Tự kiểm tra QA đi kèm; ghi báo cáo Markdown.                                                                                                                             |
| `qa suite`                                          | Chạy các kịch bản được repo hỗ trợ trên lane Gateway QA. Bí danh: `pnpm openclaw qa suite --runner multipass` cho một VM Linux dùng một lần.                              |
| `qa coverage`                                       | In kho kiểm kê độ phủ kịch bản dạng markdown (`--json` cho đầu ra máy đọc).                                                                                               |
| `qa parity-report`                                  | So sánh hai tệp `qa-suite-summary.json` và ghi báo cáo tương đồng agentic.                                                                                                |
| `qa character-eval`                                 | Chạy kịch bản QA nhân vật trên nhiều mô hình trực tiếp với báo cáo được chấm. Xem [Báo cáo](#reporting).                                                                  |
| `qa manual`                                         | Chạy một prompt dùng một lần trên lane provider/mô hình đã chọn.                                                                                                          |
| `qa ui`                                             | Khởi động giao diện gỡ lỗi QA và bus QA cục bộ (bí danh: `pnpm qa:lab:ui`).                                                                                               |
| `qa docker-build-image`                             | Xây dựng ảnh Docker QA được dựng sẵn.                                                                                                                                     |
| `qa docker-scaffold`                                | Ghi scaffold docker-compose cho bảng điều khiển QA + lane Gateway.                                                                                                       |
| `qa up`                                             | Xây dựng trang QA, khởi động ngăn xếp dựa trên Docker, in URL (bí danh: `pnpm qa:lab:up`; biến thể `:fast` thêm `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).   |
| `qa aimock`                                         | Chỉ khởi động máy chủ provider AIMock.                                                                                                                                    |
| `qa mock-openai`                                    | Chỉ khởi động máy chủ provider `mock-openai` nhận biết kịch bản.                                                                                                          |
| `qa credentials doctor` / `add` / `list` / `remove` | Quản lý nhóm thông tin xác thực Convex dùng chung.                                                                                                                        |
| `qa matrix`                                         | Lane truyền tải trực tiếp trên một homeserver Tuwunel dùng một lần. Xem [QA Matrix](/vi/concepts/qa-matrix).                                                                 |
| `qa telegram`                                       | Lane truyền tải trực tiếp trên một nhóm Telegram riêng tư thật.                                                                                                           |
| `qa discord`                                        | Lane truyền tải trực tiếp trên một kênh guild Discord riêng tư thật.                                                                                                      |
| `qa slack`                                          | Lane truyền tải trực tiếp trên một kênh Slack riêng tư thật.                                                                                                              |
| `qa mantis`                                         | Runner xác minh trước và sau cho lỗi truyền tải trực tiếp, với bằng chứng phản ứng trạng thái Discord và smoke Crabbox desktop/trình duyệt. Xem [Mantis](/vi/concepts/mantis). |

## Luồng người vận hành

Luồng người vận hành QA hiện tại là một trang QA hai khung:

- Trái: bảng điều khiển Gateway (Giao diện điều khiển) với agent.
- Phải: QA Lab, hiển thị bản ghi hội thoại kiểu Slack và kế hoạch kịch bản.

Chạy bằng:

```bash
pnpm qa:lab:up
```

Lệnh đó xây dựng trang QA, khởi động lane Gateway dựa trên Docker và mở trang
QA Lab nơi người vận hành hoặc vòng lặp tự động hóa có thể giao cho agent một nhiệm vụ QA,
quan sát hành vi kênh thật và ghi lại những gì hoạt động, thất bại hoặc
vẫn bị chặn.

Để lặp giao diện QA Lab nhanh hơn mà không cần xây dựng lại ảnh Docker mỗi lần,
hãy khởi động ngăn xếp với gói QA Lab được gắn bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` giữ các dịch vụ Docker trên ảnh được dựng sẵn và gắn bind
`extensions/qa-lab/web/dist` vào container `qa-lab`. `qa:lab:watch`
xây dựng lại gói đó khi có thay đổi, và trình duyệt tự động tải lại khi hash tài sản QA Lab
thay đổi.

Để chạy một smoke trace OpenTelemetry cục bộ, chạy:

```bash
pnpm qa:otel:smoke
```

Script đó khởi động một bộ nhận trace OTLP/HTTP cục bộ, chạy kịch bản QA
`otel-trace-smoke` với Plugin `diagnostics-otel` được bật, sau đó
giải mã các span protobuf đã xuất và xác nhận hình dạng trọng yếu cho phát hành:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` và `openclaw.message.delivery` phải có mặt;
lượt gọi mô hình không được xuất `StreamAbandoned` trên các lượt thành công; ID chẩn đoán thô và
thuộc tính `openclaw.content.*` phải nằm ngoài trace. Nó ghi
`otel-smoke-summary.json` bên cạnh các artifact bộ QA.

QA khả năng quan sát chỉ ở dạng source-checkout. Tarball npm cố ý bỏ qua
QA Lab, nên các lane phát hành Docker của gói không chạy lệnh `qa`. Dùng
`pnpm qa:otel:smoke` từ một source checkout đã xây dựng khi thay đổi instrumentation
chẩn đoán.

Để chạy lane smoke Matrix truyền tải thật, chạy:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Tham chiếu CLI đầy đủ, danh mục profile/kịch bản, biến môi trường và bố cục artifact cho lane này nằm trong [QA Matrix](/vi/concepts/qa-matrix). Tóm tắt: nó cấp phát một homeserver Tuwunel dùng một lần trong Docker, đăng ký người dùng driver/SUT/observer tạm thời, chạy Plugin Matrix thật bên trong một Gateway QA con chỉ giới hạn cho truyền tải đó (không có `qa-channel`), rồi ghi báo cáo Markdown, bản tóm tắt JSON, artifact sự kiện quan sát được và log đầu ra kết hợp dưới `.artifacts/qa-e2e/matrix-<timestamp>/`.

Đối với các lane smoke Telegram, Discord và Slack truyền tải thật:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Chúng nhắm đến một kênh thật có sẵn với hai bot (driver + SUT). Các biến môi trường bắt buộc, danh sách kịch bản, artifact đầu ra và nhóm thông tin xác thực Convex được ghi lại trong [Tham chiếu QA Telegram, Discord và Slack](#telegram-discord-and-slack-qa-reference) bên dưới.

Trước khi dùng thông tin xác thực trực tiếp được gom nhóm, chạy:

```bash
pnpm openclaw qa credentials doctor
```

Doctor kiểm tra env broker Convex, xác thực cài đặt endpoint và xác minh khả năng truy cập admin/list khi có secret maintainer. Nó chỉ báo cáo trạng thái đã đặt/thiếu cho secret.

## Độ phủ truyền tải trực tiếp

Các lane truyền tải trực tiếp dùng chung một hợp đồng thay vì mỗi lane tự tạo hình dạng danh sách kịch bản riêng. `qa-channel` là bộ hành vi sản phẩm tổng hợp rộng và không thuộc ma trận độ phủ truyền tải trực tiếp.

| Lane     | Kiểm thử canary | Cổng mention | Bot sang bot | Chặn allowlist | Trả lời cấp cao nhất | Tiếp tục sau khởi động lại | Theo dõi chuỗi thảo luận | Cô lập chuỗi thảo luận | Quan sát phản ứng | Lệnh trợ giúp | Đăng ký lệnh gốc |
| -------- | --------------- | ------------ | ------------ | -------------- | -------------------- | -------------------------- | ------------------------ | ---------------------- | ----------------- | ------------ | ---------------- |
| Matrix   | x               | x            | x            | x              | x                    | x                          | x                        | x                      | x                 |              |                  |
| Telegram | x               | x            | x            |                |                      |                            |                          |                        |                   | x            |                  |
| Discord  | x               | x            | x            |                |                      |                            |                          |                        |                   |              | x                |
| Slack    | x               | x            | x            |                |                      |                            |                          |                        |                   |              |                  |

Điều này giữ `qa-channel` là bộ hành vi sản phẩm rộng trong khi Matrix,
Telegram và các truyền tải trực tiếp tương lai dùng chung một checklist hợp đồng truyền tải
rõ ràng.

Để chạy lane VM Linux dùng một lần mà không đưa Docker vào đường dẫn QA, chạy:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Lệnh này khởi động một guest Multipass mới, cài đặt phụ thuộc, xây dựng OpenClaw
bên trong guest, chạy `qa suite`, rồi sao chép báo cáo QA và
bản tóm tắt thông thường về `.artifacts/qa-e2e/...` trên host.
Nó dùng lại cùng hành vi chọn kịch bản như `qa suite` trên host.
Các lần chạy bộ trên host và Multipass thực thi song song nhiều kịch bản đã chọn
với các worker Gateway cô lập theo mặc định. `qa-channel` mặc định concurrency
4, bị giới hạn bởi số kịch bản đã chọn. Dùng `--concurrency <count>` để điều chỉnh
số worker, hoặc `--concurrency 1` để thực thi tuần tự.
Lệnh thoát với mã khác không khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi
bạn muốn có artifact mà không có mã thoát thất bại.
Các lần chạy trực tiếp chuyển tiếp các đầu vào auth QA được hỗ trợ và thực tế cho
guest: khóa provider dựa trên env, đường dẫn cấu hình provider trực tiếp QA và
`CODEX_HOME` khi có. Giữ `--output-dir` dưới thư mục gốc repo để guest
có thể ghi ngược qua workspace đã gắn.

## Tham chiếu QA Telegram, Discord và Slack

Matrix có một [trang riêng](/vi/concepts/qa-matrix) vì số lượng kịch bản và cấp phát homeserver dựa trên Docker của nó. Telegram, Discord và Slack nhỏ hơn — mỗi loại chỉ có một vài kịch bản, không có hệ thống profile, chạy trên các kênh thật có sẵn — nên phần tham chiếu của chúng nằm ở đây.

### Cờ CLI dùng chung

Các lane này đăng ký qua `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` và chấp nhận cùng các cờ:

| Cờ                                    | Mặc định                                                        | Mô tả                                                                                                                       |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Chỉ chạy kịch bản này. Có thể lặp lại.                                                                                     |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Nơi ghi báo cáo/tóm tắt/tin nhắn đã quan sát và nhật ký đầu ra. Đường dẫn tương đối được phân giải theo `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Gốc kho lưu trữ khi gọi từ một cwd trung lập.                                                                              |
| `--sut-account <id>`                  | `sut`                                                           | ID tài khoản tạm thời bên trong cấu hình QA Gateway.                                                                       |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` hoặc `live-frontier` (`live-openai` cũ vẫn hoạt động).                                                       |
| `--model <ref>` / `--alt-model <ref>` | mặc định của nhà cung cấp                                       | Tham chiếu model chính/thay thế.                                                                                           |
| `--fast`                              | tắt                                                             | Chế độ nhanh của nhà cung cấp khi được hỗ trợ.                                                                             |
| `--credential-source <env\|convex>`   | `env`                                                           | Xem [nhóm thông tin xác thực Convex](#convex-credential-pool).                                                             |
| `--credential-role <maintainer\|ci>`  | `ci` trong CI, nếu không thì `maintainer`                       | Vai trò được dùng khi `--credential-source convex`.                                                                        |

Mỗi lane thoát với mã khác không khi có bất kỳ kịch bản nào thất bại. `--allow-failures` ghi artifact mà không đặt mã thoát thất bại.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Nhắm tới một nhóm Telegram riêng tư thật với hai bot riêng biệt (driver + SUT). Bot SUT phải có tên người dùng Telegram; quan sát bot-với-bot hoạt động tốt nhất khi cả hai bot đều bật **Bot-to-Bot Communication Mode** trong `@BotFather`.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — ID chat dạng số (chuỗi).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Tùy chọn:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` giữ nội dung tin nhắn trong artifact tin nhắn đã quan sát (mặc định biên tập ẩn).

Kịch bản (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

Artifact đầu ra:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — bao gồm RTT theo từng phản hồi (driver gửi → quan sát phản hồi SUT), bắt đầu với canary.
- `telegram-qa-observed-messages.json` — nội dung bị biên tập ẩn trừ khi `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Nhắm tới một kênh guild Discord riêng tư thật với hai bot: bot driver do harness điều khiển và bot SUT được khởi động bởi OpenClaw Gateway con thông qua Plugin Discord đi kèm. Xác minh xử lý nhắc đến kênh, việc bot SUT đã đăng ký lệnh gốc `/help` với Discord, và các kịch bản bằng chứng Mantis chọn tham gia.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — phải khớp với ID người dùng bot SUT do Discord trả về (nếu không lane sẽ thất bại nhanh).

Tùy chọn:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` giữ nội dung tin nhắn trong artifact tin nhắn đã quan sát.

Kịch bản (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — kịch bản Mantis chọn tham gia. Tự chạy riêng vì nó chuyển SUT sang phản hồi guild luôn bật, chỉ dùng công cụ với `messages.statusReactions.enabled=true`, sau đó ghi lại dòng thời gian phản ứng REST cùng artifact trực quan HTML/PNG.

Chạy rõ ràng kịch bản phản ứng trạng thái Mantis:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Artifact đầu ra:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — nội dung bị biên tập ẩn trừ khi `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` và `discord-status-reactions-tool-only-timeline.png` khi kịch bản phản ứng trạng thái chạy.

### QA Slack

```bash
pnpm openclaw qa slack
```

Nhắm tới một kênh Slack riêng tư thật với hai bot riêng biệt: bot driver do harness điều khiển và bot SUT được khởi động bởi OpenClaw Gateway con thông qua Plugin Slack đi kèm.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Tùy chọn:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` giữ nội dung tin nhắn trong artifact tin nhắn đã quan sát.

Kịch bản (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Artifact đầu ra:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — nội dung bị biên tập ẩn trừ khi `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

### Nhóm thông tin xác thực Convex

Các lane Telegram, Discord và Slack có thể thuê thông tin xác thực từ một nhóm Convex dùng chung thay vì đọc các biến env ở trên. Truyền `--credential-source convex` (hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab lấy một lease độc quyền, gửi heartbeat cho lease đó trong suốt thời gian chạy, và giải phóng khi tắt. Các loại nhóm là `"telegram"`, `"discord"`, và `"slack"`.

Dạng payload mà broker xác thực trên `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` phải là chuỗi chat-id dạng số.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Các biến env vận hành và hợp đồng endpoint của broker Convex nằm trong [Kiểm thử → Thông tin xác thực Telegram dùng chung qua Convex](/vi/help/testing#shared-telegram-credentials-via-convex-v1) (tên mục có trước hỗ trợ Discord; ngữ nghĩa broker giống hệt nhau cho cả hai loại).

## Seed dựa trên kho lưu trữ

Tài nguyên seed nằm trong `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Các tệp này chủ ý được lưu trong git để kế hoạch QA hiển thị cho cả con người và agent.

`qa-lab` nên duy trì là một runner markdown chung. Mỗi tệp markdown kịch bản là nguồn sự thật cho một lần chạy kiểm thử và nên định nghĩa:

- siêu dữ liệu kịch bản
- siêu dữ liệu danh mục, capability, lane và rủi ro tùy chọn
- tham chiếu tài liệu và mã
- yêu cầu Plugin tùy chọn
- bản vá cấu hình Gateway tùy chọn
- `qa-flow` có thể thực thi

Bề mặt runtime tái sử dụng hỗ trợ `qa-flow` được phép duy trì chung và xuyên suốt. Ví dụ, kịch bản markdown có thể kết hợp helper phía transport với helper phía trình duyệt để điều khiển Control UI nhúng thông qua đường nối `browser.request` của Gateway mà không thêm runner trường hợp đặc biệt.

Các tệp kịch bản nên được nhóm theo capability sản phẩm thay vì thư mục cây nguồn. Giữ ID kịch bản ổn định khi di chuyển tệp; dùng `docsRefs` và `codeRefs` để truy vết triển khai.

Danh sách baseline nên đủ rộng để bao phủ:

- Chat DM và kênh
- hành vi luồng
- vòng đời hành động tin nhắn
- callback cron
- truy hồi bộ nhớ
- chuyển đổi model
- bàn giao subagent
- đọc kho lưu trữ và đọc tài liệu
- một tác vụ build nhỏ như Lobster Invaders

## Lane mock nhà cung cấp

`qa suite` có hai lane mock nhà cung cấp cục bộ:

- `mock-openai` là mock OpenClaw nhận biết kịch bản. Nó vẫn là lane mock xác định mặc định cho QA dựa trên kho lưu trữ và parity gate.
- `aimock` khởi động server nhà cung cấp dựa trên AIMock cho phạm vi bao phủ protocol, fixture, ghi/phát lại và chaos thử nghiệm. Nó mang tính bổ sung và không thay thế bộ điều phối kịch bản `mock-openai`.

Triển khai lane nhà cung cấp nằm dưới `extensions/qa-lab/src/providers/`. Mỗi nhà cung cấp sở hữu mặc định của mình, khởi động server cục bộ, cấu hình model Gateway, nhu cầu dàn dựng auth-profile, và cờ capability live/mock. Mã suite và Gateway dùng chung nên định tuyến qua registry nhà cung cấp thay vì rẽ nhánh theo tên nhà cung cấp.

## Adapter transport

`qa-lab` sở hữu một đường nối transport chung cho các kịch bản QA markdown. `qa-channel` là adapter đầu tiên trên đường nối đó, nhưng mục tiêu thiết kế rộng hơn: các kênh thật hoặc tổng hợp trong tương lai nên cắm vào cùng runner suite thay vì thêm một runner QA dành riêng cho transport.

Ở cấp kiến trúc, phần tách là:

- `qa-lab` sở hữu thực thi kịch bản chung, đồng thời worker, ghi artifact và báo cáo.
- Adapter transport sở hữu cấu hình Gateway, trạng thái sẵn sàng, quan sát đầu vào và đầu ra, hành động transport, và trạng thái transport đã chuẩn hóa.
- Các tệp kịch bản markdown dưới `qa/scenarios/` định nghĩa lần chạy kiểm thử; `qa-lab` cung cấp bề mặt runtime tái sử dụng để thực thi chúng.

### Thêm kênh

Thêm một kênh vào hệ thống QA markdown yêu cầu đúng hai thứ:

1. Một adapter transport cho kênh.
2. Một gói kịch bản kiểm thử hợp đồng kênh.

Không thêm gốc lệnh QA cấp cao mới khi host `qa-lab` dùng chung có thể sở hữu luồng.

`qa-lab` sở hữu cơ chế host dùng chung:

- gốc lệnh `openclaw qa`
- khởi động và dọn dẹp suite
- đồng thời worker
- ghi artifact
- tạo báo cáo
- thực thi kịch bản
- alias tương thích cho các kịch bản `qa-channel` cũ hơn

Runner Plugin sở hữu hợp đồng transport:

- cách `openclaw qa <runner>` được gắn bên dưới gốc `qa` dùng chung
- cách Gateway được cấu hình cho transport đó
- cách kiểm tra trạng thái sẵn sàng
- cách chèn sự kiện đầu vào
- cách quan sát tin nhắn đầu ra
- cách transcript và trạng thái transport đã chuẩn hóa được hiển thị
- cách thực thi hành động dựa trên transport
- cách xử lý đặt lại hoặc dọn dẹp riêng cho transport

Ngưỡng chấp nhận tối thiểu cho một kênh mới:

1. Giữ `qa-lab` làm chủ sở hữu của gốc `qa` dùng chung.
2. Triển khai transport runner trên seam máy chủ `qa-lab` dùng chung.
3. Giữ các cơ chế dành riêng cho transport bên trong runner plugin hoặc channel harness.
4. Gắn runner dưới dạng `openclaw qa <runner>` thay vì đăng ký một lệnh gốc cạnh tranh. Runner plugins nên khai báo `qaRunners` trong `openclaw.plugin.json` và xuất một mảng `qaRunnerCliRegistrations` khớp từ `runtime-api.ts`. Giữ `runtime-api.ts` nhẹ; CLI lazy và việc thực thi runner nên nằm sau các điểm vào riêng biệt.
5. Tạo hoặc điều chỉnh các kịch bản markdown trong các thư mục `qa/scenarios/` theo chủ đề.
6. Dùng các trình trợ giúp kịch bản chung cho những kịch bản mới.
7. Giữ các alias tương thích hiện có hoạt động trừ khi repo đang thực hiện một cuộc di trú có chủ đích.

Quy tắc quyết định rất nghiêm ngặt:

- Nếu hành vi có thể được biểu đạt một lần trong `qa-lab`, hãy đặt nó trong `qa-lab`.
- Nếu hành vi phụ thuộc vào một channel transport, hãy giữ nó trong runner plugin hoặc plugin harness đó.
- Nếu một kịch bản cần một năng lực mới mà nhiều hơn một channel có thể dùng, hãy thêm một trình trợ giúp chung thay vì một nhánh dành riêng cho channel trong `suite.ts`.
- Nếu một hành vi chỉ có ý nghĩa với một transport, hãy giữ kịch bản đó dành riêng cho transport và nêu rõ điều đó trong hợp đồng kịch bản.

### Tên trình trợ giúp kịch bản

Các trình trợ giúp chung được ưu tiên cho kịch bản mới:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Các alias tương thích vẫn còn khả dụng cho kịch bản hiện có — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — nhưng khi tạo kịch bản mới nên dùng các tên chung. Các alias tồn tại để tránh một cuộc di trú đồng loạt, không phải là mô hình cho tương lai.

## Báo cáo

`qa-lab` xuất một báo cáo giao thức Markdown từ timeline bus đã quan sát.
Báo cáo nên trả lời:

- Điều gì đã hoạt động
- Điều gì đã thất bại
- Điều gì vẫn bị chặn
- Những kịch bản theo dõi nào đáng bổ sung

Để xem inventory của các kịch bản có sẵn — hữu ích khi ước lượng công việc theo dõi hoặc nối dây một transport mới — hãy chạy `pnpm openclaw qa coverage` (thêm `--json` để có đầu ra máy đọc được).

Đối với kiểm tra ký tự và phong cách, hãy chạy cùng một kịch bản trên nhiều live model
refs và viết một báo cáo Markdown đã được đánh giá:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Lệnh này chạy các tiến trình con QA gateway cục bộ, không phải Docker. Các kịch bản character eval
nên thiết lập persona thông qua `SOUL.md`, rồi chạy các lượt người dùng thông thường
như trò chuyện, hỗ trợ workspace và tác vụ tệp nhỏ. Model ứng viên
không nên được cho biết rằng nó đang được đánh giá. Lệnh này giữ lại từng
transcript đầy đủ, ghi lại thống kê chạy cơ bản, rồi yêu cầu các model giám khảo ở chế độ fast với
lập luận `xhigh` khi được hỗ trợ để xếp hạng các lượt chạy theo độ tự nhiên, vibe và sự hài hước.
Dùng `--blind-judge-models` khi so sánh nhà cung cấp: prompt cho giám khảo vẫn nhận
mọi transcript và trạng thái chạy, nhưng candidate refs được thay bằng các
nhãn trung lập như `candidate-01`; báo cáo ánh xạ thứ hạng trở lại refs thật sau khi
phân tích cú pháp.
Các lượt chạy ứng viên mặc định dùng tư duy `high`, với `medium` cho GPT-5.5 và `xhigh`
cho các OpenAI eval refs cũ hơn có hỗ trợ. Ghi đè một ứng viên cụ thể inline bằng
`--model provider/model,thinking=<level>`. `--thinking <level>` vẫn đặt một
dự phòng toàn cục, và dạng cũ hơn `--model-thinking <provider/model=level>` được
giữ lại để tương thích.
OpenAI candidate refs mặc định dùng chế độ fast để priority processing được sử dụng khi
nhà cung cấp hỗ trợ. Thêm `,fast`, `,no-fast`, hoặc `,fast=false` inline khi một
ứng viên hoặc giám khảo riêng lẻ cần ghi đè. Chỉ truyền `--fast` khi bạn muốn
ép bật chế độ fast cho mọi model ứng viên. Thời lượng của ứng viên và giám khảo được
ghi trong báo cáo để phân tích benchmark, nhưng prompt cho giám khảo nói rõ
không xếp hạng theo tốc độ.
Cả lượt chạy model ứng viên và giám khảo đều mặc định dùng concurrency 16. Giảm
`--concurrency` hoặc `--judge-concurrency` khi giới hạn nhà cung cấp hoặc áp lực gateway
cục bộ khiến một lượt chạy quá nhiễu.
Khi không truyền candidate `--model`, character eval mặc định dùng
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, và
`google/gemini-3.1-pro-preview` khi không truyền `--model`.
Khi không truyền `--judge-model`, giám khảo mặc định là
`openai/gpt-5.5,thinking=xhigh,fast` và
`anthropic/claude-opus-4-6,thinking=high`.

## Tài liệu liên quan

- [QA ma trận](/vi/concepts/qa-matrix)
- [QA Channel](/vi/channels/qa-channel)
- [Kiểm thử](/vi/help/testing)
- [Dashboard](/vi/web/dashboard)
