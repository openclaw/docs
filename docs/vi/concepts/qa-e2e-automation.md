---
read_when:
    - Hiểu cách ngăn xếp QA phối hợp với nhau
    - Mở rộng qa-lab, qa-channel hoặc bộ điều hợp truyền tải
    - Thêm các kịch bản đảm bảo chất lượng dựa trên kho lưu trữ
    - Xây dựng tự động hóa QA sát thực tế hơn xoay quanh bảng điều khiển Gateway
summary: 'Tổng quan về ngăn xếp QA: qa-lab, qa-channel, các kịch bản dựa trên kho lưu trữ, các luồng truyền tải trực tiếp, bộ điều hợp truyền tải và báo cáo.'
title: Tổng quan về QA
x-i18n:
    generated_at: "2026-05-03T21:30:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1446fddb00855634d34662a0a47be1e5054a9e7bfed5bc9ae21185d87094d8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Ngăn xếp QA riêng tư được thiết kế để kiểm thử OpenClaw theo cách thực tế hơn,
mang hình dạng kênh hơn so với một kiểm thử đơn vị đơn lẻ.

Các phần hiện tại:

- `extensions/qa-channel`: kênh tin nhắn tổng hợp với các bề mặt DM, kênh, luồng,
  phản ứng, chỉnh sửa và xóa.
- `extensions/qa-lab`: giao diện trình gỡ lỗi và bus QA để quan sát transcript,
  chèn tin nhắn đến và xuất báo cáo Markdown.
- `extensions/qa-matrix`, các Plugin runner trong tương lai: các bộ điều hợp transport trực tiếp
  điều khiển một kênh thật bên trong một Gateway QA con.
- `qa/`: tài sản seed do repo hậu thuẫn cho tác vụ khởi động và các kịch bản QA
  baseline.
- [Mantis](/vi/concepts/mantis): xác minh trực tiếp trước và sau cho các lỗi
  cần transport thật, ảnh chụp màn hình trình duyệt, trạng thái VM và bằng chứng PR.

## Bề mặt lệnh

Mọi luồng QA đều chạy dưới `pnpm openclaw qa <subcommand>`. Nhiều lệnh có alias script `pnpm qa:*`;
cả hai dạng đều được hỗ trợ.

| Lệnh                                                | Mục đích                                                                                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Tự kiểm tra QA đi kèm; ghi báo cáo Markdown.                                                                                                                           |
| `qa suite`                                          | Chạy các kịch bản do repo hậu thuẫn đối với lane Gateway QA. Alias: `pnpm openclaw qa suite --runner multipass` cho một VM Linux dùng một lần.                         |
| `qa coverage`                                       | In inventory phạm vi kịch bản dạng markdown (`--json` cho đầu ra máy).                                                                                                  |
| `qa parity-report`                                  | So sánh hai tệp `qa-suite-summary.json` và ghi báo cáo parity agentic.                                                                                                  |
| `qa character-eval`                                 | Chạy kịch bản QA nhân vật trên nhiều model trực tiếp với báo cáo được chấm. Xem [Báo cáo](#reporting).                                                                 |
| `qa manual`                                         | Chạy một prompt dùng một lần đối với lane provider/model đã chọn.                                                                                                       |
| `qa ui`                                             | Khởi động giao diện trình gỡ lỗi QA và bus QA cục bộ (alias: `pnpm qa:lab:ui`).                                                                                        |
| `qa docker-build-image`                             | Xây dựng image Docker QA dựng sẵn.                                                                                                                                      |
| `qa docker-scaffold`                                | Ghi scaffold docker-compose cho dashboard QA + lane Gateway.                                                                                                           |
| `qa up`                                             | Xây dựng site QA, khởi động ngăn xếp do Docker hậu thuẫn, in URL (alias: `pnpm qa:lab:up`; biến thể `:fast` thêm `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Chỉ khởi động server provider AIMock.                                                                                                                                   |
| `qa mock-openai`                                    | Chỉ khởi động server provider `mock-openai` nhận biết kịch bản.                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Quản lý pool thông tin xác thực Convex dùng chung.                                                                                                                     |
| `qa matrix`                                         | Lane transport trực tiếp đối với homeserver Tuwunel dùng một lần. Xem [Matrix QA](/vi/concepts/qa-matrix).                                                               |
| `qa telegram`                                       | Lane transport trực tiếp đối với một nhóm Telegram riêng tư thật.                                                                                                      |
| `qa discord`                                        | Lane transport trực tiếp đối với một kênh guild Discord riêng tư thật.                                                                                                 |
| `qa mantis`                                         | Runner xác minh trước và sau cho lỗi transport trực tiếp, với kịch bản phản ứng trạng thái Discord đầu tiên. Xem [Mantis](/vi/concepts/mantis).                          |

## Luồng vận hành

Luồng vận hành QA hiện tại là một site QA hai khung:

- Trái: dashboard Gateway (Control UI) với agent.
- Phải: QA Lab, hiển thị transcript kiểu Slack và kế hoạch kịch bản.

Chạy bằng:

```bash
pnpm qa:lab:up
```

Lệnh đó xây dựng site QA, khởi động lane Gateway do Docker hậu thuẫn và mở trang
QA Lab nơi một operator hoặc vòng lặp tự động hóa có thể giao cho agent một nhiệm vụ QA,
quan sát hành vi kênh thật và ghi lại những gì hoạt động, thất bại hoặc
vẫn bị chặn.

Để lặp nhanh hơn trên giao diện QA Lab mà không phải xây dựng lại image Docker mỗi lần,
hãy khởi động ngăn xếp với bundle QA Lab được gắn kết bằng bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` giữ các dịch vụ Docker trên một image dựng sẵn và bind-mount
`extensions/qa-lab/web/dist` vào container `qa-lab`. `qa:lab:watch`
xây dựng lại bundle đó khi có thay đổi, và trình duyệt tự động tải lại khi hash tài sản QA Lab
thay đổi.

Để smoke trace OpenTelemetry cục bộ, chạy:

```bash
pnpm qa:otel:smoke
```

Script đó khởi động một receiver trace OTLP/HTTP cục bộ, chạy kịch bản QA
`otel-trace-smoke` với Plugin `diagnostics-otel` được bật, sau đó
giải mã các span protobuf đã xuất và kiểm tra hình dạng quan trọng cho release:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` và `openclaw.message.delivery` phải hiện diện;
các cuộc gọi model không được xuất `StreamAbandoned` trên các lượt thành công; ID chẩn đoán thô và
các thuộc tính `openclaw.content.*` phải nằm ngoài trace. Nó ghi
`otel-smoke-summary.json` cạnh các artifact của QA suite.

QA về khả năng quan sát chỉ áp dụng cho checkout mã nguồn. Tarball npm cố ý bỏ qua
QA Lab, nên các lane release Docker package không chạy lệnh `qa`. Sử dụng
`pnpm qa:otel:smoke` từ một checkout mã nguồn đã build khi thay đổi instrumentation
chẩn đoán.

Đối với lane smoke Matrix dùng transport thật, chạy:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Tham chiếu CLI đầy đủ, danh mục profile/kịch bản, biến môi trường và bố cục artifact cho lane này nằm trong [Matrix QA](/vi/concepts/qa-matrix). Nhìn nhanh: nó cấp phát một homeserver Tuwunel dùng một lần trong Docker, đăng ký người dùng driver/SUT/observer tạm thời, chạy Plugin Matrix thật bên trong một Gateway QA con được giới hạn cho transport đó (không có `qa-channel`), rồi ghi báo cáo Markdown, tóm tắt JSON, artifact sự kiện đã quan sát và log đầu ra kết hợp dưới `.artifacts/qa-e2e/matrix-<timestamp>/`.

Đối với các lane smoke Telegram và Discord dùng transport thật:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Cả hai nhắm tới một kênh thật đã tồn tại với hai bot (driver + SUT). Các biến môi trường bắt buộc, danh sách kịch bản, artifact đầu ra và pool thông tin xác thực Convex được ghi lại trong [Tham chiếu QA Telegram và Discord](#telegram-and-discord-qa-reference) bên dưới.

Trước khi dùng thông tin xác thực trực tiếp trong pool, chạy:

```bash
pnpm openclaw qa credentials doctor
```

Doctor kiểm tra env broker Convex, xác thực thiết lập endpoint và xác minh khả năng truy cập admin/list khi có secret maintainer. Nó chỉ báo cáo trạng thái đã đặt/thiếu cho secret.

## Phạm vi transport trực tiếp

Các lane transport trực tiếp dùng chung một contract thay vì mỗi lane tự phát minh hình dạng danh sách kịch bản riêng. `qa-channel` là bộ kiểm thử hành vi sản phẩm tổng hợp rộng và không thuộc ma trận phạm vi transport trực tiếp.

| Lane     | Canary | Cổng mention | Bot-với-bot | Chặn allowlist | Trả lời cấp cao nhất | Tiếp tục sau restart | Theo dõi luồng | Cô lập luồng | Quan sát phản ứng | Lệnh trợ giúp | Đăng ký lệnh native |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |

Điều này giữ `qa-channel` làm bộ kiểm thử hành vi sản phẩm rộng trong khi Matrix,
Telegram và các transport trực tiếp trong tương lai dùng chung một checklist contract transport
rõ ràng.

Đối với lane VM Linux dùng một lần mà không đưa Docker vào đường dẫn QA, chạy:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Lệnh này khởi động một guest Multipass mới, cài dependency, xây dựng OpenClaw
bên trong guest, chạy `qa suite`, sau đó sao chép báo cáo QA và
tóm tắt thông thường về `.artifacts/qa-e2e/...` trên host.
Nó tái sử dụng cùng hành vi chọn kịch bản như `qa suite` trên host.
Các lần chạy suite trên host và Multipass thực thi nhiều kịch bản đã chọn song song
với các worker Gateway cô lập theo mặc định. `qa-channel` mặc định concurrency
4, giới hạn bởi số lượng kịch bản đã chọn. Dùng `--concurrency <count>` để điều chỉnh
số worker, hoặc `--concurrency 1` để thực thi nối tiếp.
Lệnh thoát khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi
bạn muốn có artifact mà không có mã thoát thất bại.
Các lần chạy trực tiếp chuyển tiếp những đầu vào auth QA được hỗ trợ và thực tế cho
guest: khóa provider dựa trên env, đường dẫn cấu hình provider trực tiếp QA và
`CODEX_HOME` khi có. Giữ `--output-dir` dưới gốc repo để guest
có thể ghi ngược qua workspace được mount.

## Tham chiếu QA Telegram và Discord

Matrix có một [trang riêng](/vi/concepts/qa-matrix) vì số lượng kịch bản và quá trình cấp phát homeserver do Docker hậu thuẫn. Telegram và Discord nhỏ hơn — mỗi loại chỉ có vài kịch bản, không có hệ thống profile, chạy trên các kênh thật đã tồn tại — nên tham chiếu của chúng nằm ở đây.

### Cờ CLI dùng chung

Cả hai lane đều đăng ký qua `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` và chấp nhận cùng các cờ:

| Cờ                                    | Mặc định                                                | Mô tả                                                                                                                       |
| ------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                       | Chỉ chạy kịch bản này. Có thể lặp lại.                                                                                     |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Nơi ghi báo cáo/tóm tắt/thông điệp đã quan sát và nhật ký đầu ra. Đường dẫn tương đối được phân giải theo `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                         | Gốc kho lưu trữ khi gọi từ một cwd trung lập.                                                                               |
| `--sut-account <id>`                  | `sut`                                                   | Id tài khoản tạm thời bên trong cấu hình Gateway QA.                                                                        |
| `--provider-mode <mode>`              | `live-frontier`                                         | `mock-openai` hoặc `live-frontier` (`live-openai` cũ vẫn hoạt động).                                                       |
| `--model <ref>` / `--alt-model <ref>` | mặc định của nhà cung cấp                               | Tham chiếu mô hình chính/thay thế.                                                                                         |
| `--fast`                              | tắt                                                     | Chế độ nhanh của nhà cung cấp khi được hỗ trợ.                                                                              |
| `--credential-source <env\|convex>`   | `env`                                                   | Xem [nhóm thông tin xác thực Convex](#convex-credential-pool).                                                             |
| `--credential-role <maintainer\|ci>`  | `ci` trong CI, nếu không là `maintainer`                | Vai trò được dùng khi `--credential-source convex`.                                                                         |

Cả hai đều thoát với mã khác không khi có bất kỳ kịch bản nào thất bại. `--allow-failures` ghi tạo tác mà không đặt mã thoát thất bại.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Nhắm đến một nhóm Telegram riêng tư thật với hai bot riêng biệt (driver + SUT). Bot SUT phải có tên người dùng Telegram; quan sát bot-với-bot hoạt động tốt nhất khi cả hai bot đều bật **Bot-to-Bot Communication Mode** trong `@BotFather`.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — id chat dạng số (chuỗi).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Tùy chọn:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` giữ nội dung thông điệp trong tạo tác thông điệp đã quan sát (mặc định che lại).

Kịch bản (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

Tạo tác đầu ra:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — bao gồm RTT theo từng phản hồi (driver gửi → quan sát phản hồi SUT) bắt đầu bằng canary.
- `telegram-qa-observed-messages.json` — nội dung bị che trừ khi `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Nhắm đến một kênh guild Discord riêng tư thật với hai bot: một bot driver do harness điều khiển và một bot SUT được Gateway OpenClaw con khởi động thông qua Plugin Discord đi kèm. Xác minh xử lý đề cập kênh, rằng bot SUT đã đăng ký lệnh `/help` gốc với Discord, và các kịch bản bằng chứng Mantis theo cơ chế chọn tham gia.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — phải khớp với id người dùng bot SUT do Discord trả về (nếu không lane sẽ thất bại nhanh).

Tùy chọn:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` giữ nội dung thông điệp trong tạo tác thông điệp đã quan sát.

Kịch bản (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — kịch bản Mantis theo cơ chế chọn tham gia. Chạy riêng vì nó chuyển SUT sang phản hồi guild luôn bật, chỉ dùng công cụ với `messages.statusReactions.enabled=true`, rồi ghi lại dòng thời gian reaction REST cùng với một tạo tác trực quan HTML/PNG.

Chạy rõ ràng kịch bản status-reaction Mantis:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Tạo tác đầu ra:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — nội dung bị che trừ khi `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` và `discord-status-reactions-tool-only-timeline.png` khi kịch bản status-reaction chạy.

### Nhóm thông tin xác thực Convex

Cả lane Telegram và Discord đều có thể thuê thông tin xác thực từ một nhóm Convex dùng chung thay vì đọc các biến env ở trên. Truyền `--credential-source convex` (hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab lấy một lease độc quyền, gửi Heartbeat cho lease đó trong suốt thời gian chạy, và giải phóng lease khi tắt. Các loại nhóm là `"telegram"` và `"discord"`.

Dạng payload mà broker xác thực trên `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` phải là chuỗi chat-id dạng số.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Các biến env vận hành và hợp đồng endpoint broker Convex nằm trong [Kiểm thử → Thông tin xác thực Telegram dùng chung qua Convex](/vi/help/testing#shared-telegram-credentials-via-convex-v1) (tên phần có trước khi hỗ trợ Discord; ngữ nghĩa broker giống hệt nhau cho cả hai loại).

## Seed dựa trên kho lưu trữ

Tài nguyên seed nằm trong `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Các tài nguyên này cố ý được đưa vào git để kế hoạch QA hiển thị với cả con người và agent.

`qa-lab` nên tiếp tục là một runner markdown chung. Mỗi tệp markdown kịch bản là nguồn sự thật cho một lần chạy kiểm thử và nên định nghĩa:

- siêu dữ liệu kịch bản
- siêu dữ liệu tùy chọn về danh mục, khả năng, lane và rủi ro
- tham chiếu tài liệu và mã
- yêu cầu Plugin tùy chọn
- bản vá cấu hình Gateway tùy chọn
- `qa-flow` có thể thực thi

Bề mặt runtime tái sử dụng hỗ trợ `qa-flow` được phép tiếp tục là chung và xuyên suốt. Ví dụ, các kịch bản markdown có thể kết hợp helper phía transport với helper phía trình duyệt điều khiển Control UI nhúng thông qua seam `browser.request` của Gateway mà không cần thêm runner trường hợp đặc biệt.

Các tệp kịch bản nên được nhóm theo khả năng sản phẩm thay vì thư mục cây nguồn. Giữ ID kịch bản ổn định khi di chuyển tệp; dùng `docsRefs` và `codeRefs` để truy vết triển khai.

Danh sách baseline nên đủ rộng để bao phủ:

- chat DM và kênh
- hành vi thread
- vòng đời hành động thông điệp
- callback cron
- gọi lại bộ nhớ
- chuyển đổi mô hình
- bàn giao subagent
- đọc kho lưu trữ và đọc tài liệu
- một tác vụ build nhỏ như Lobster Invaders

## Lane mock nhà cung cấp

`qa suite` có hai lane mock nhà cung cấp cục bộ:

- `mock-openai` là mock OpenClaw nhận biết kịch bản. Nó vẫn là lane mock xác định mặc định cho QA dựa trên kho lưu trữ và cổng parity.
- `aimock` khởi động một máy chủ nhà cung cấp dựa trên AIMock cho phạm vi bao phủ giao thức thử nghiệm, fixture, ghi/phát lại và chaos. Nó mang tính bổ sung và không thay thế dispatcher kịch bản `mock-openai`.

Triển khai lane nhà cung cấp nằm dưới `extensions/qa-lab/src/providers/`. Mỗi nhà cung cấp sở hữu mặc định, khởi động máy chủ cục bộ, cấu hình mô hình Gateway, nhu cầu dàn dựng auth-profile, và cờ khả năng live/mock của nó. Mã suite và Gateway dùng chung nên định tuyến qua registry nhà cung cấp thay vì rẽ nhánh theo tên nhà cung cấp.

## Adapter transport

`qa-lab` sở hữu một seam transport chung cho các kịch bản QA markdown. `qa-channel` là adapter đầu tiên trên seam đó, nhưng mục tiêu thiết kế rộng hơn: các kênh thật hoặc tổng hợp trong tương lai nên cắm vào cùng runner suite thay vì thêm một runner QA riêng cho transport.

Ở cấp kiến trúc, phần tách là:

- `qa-lab` sở hữu thực thi kịch bản chung, đồng thời worker, ghi tạo tác và báo cáo.
- Adapter transport sở hữu cấu hình Gateway, trạng thái sẵn sàng, quan sát inbound và outbound, hành động transport, và trạng thái transport đã chuẩn hóa.
- Các tệp kịch bản markdown dưới `qa/scenarios/` định nghĩa lần chạy kiểm thử; `qa-lab` cung cấp bề mặt runtime tái sử dụng để thực thi chúng.

### Thêm một kênh

Thêm một kênh vào hệ thống QA markdown yêu cầu đúng hai thứ:

1. Một adapter transport cho kênh.
2. Một gói kịch bản kiểm thử hợp đồng kênh.

Không thêm một root lệnh QA cấp cao mới khi host `qa-lab` dùng chung có thể sở hữu flow.

`qa-lab` sở hữu cơ chế host dùng chung:

- root lệnh `openclaw qa`
- khởi động và tháo dỡ suite
- đồng thời worker
- ghi tạo tác
- tạo báo cáo
- thực thi kịch bản
- alias tương thích cho các kịch bản `qa-channel` cũ hơn

Các Plugin runner sở hữu hợp đồng transport:

- cách `openclaw qa <runner>` được mount bên dưới root `qa` dùng chung
- cách Gateway được cấu hình cho transport đó
- cách kiểm tra trạng thái sẵn sàng
- cách sự kiện inbound được tiêm vào
- cách quan sát thông điệp outbound
- cách transcript và trạng thái transport đã chuẩn hóa được lộ ra
- cách thực thi hành động dựa trên transport
- cách xử lý reset hoặc dọn dẹp riêng cho transport

Mức chấp nhận tối thiểu cho một kênh mới:

1. Giữ `qa-lab` là chủ sở hữu của root `qa` dùng chung.
2. Triển khai runner transport trên seam host `qa-lab` dùng chung.
3. Giữ cơ chế riêng cho transport bên trong Plugin runner hoặc harness kênh.
4. Mount runner dưới dạng `openclaw qa <runner>` thay vì đăng ký một lệnh root cạnh tranh. Plugin runner nên khai báo `qaRunners` trong `openclaw.plugin.json` và xuất một mảng `qaRunnerCliRegistrations` khớp từ `runtime-api.ts`. Giữ `runtime-api.ts` nhẹ; CLI lazy và thực thi runner nên nằm sau các entrypoint riêng.
5. Tạo hoặc điều chỉnh các kịch bản markdown dưới thư mục `qa/scenarios/` theo chủ đề.
6. Dùng helper kịch bản chung cho các kịch bản mới.
7. Giữ các alias tương thích hiện có hoạt động trừ khi kho lưu trữ đang thực hiện một migration có chủ ý.

Quy tắc quyết định rất chặt chẽ:

- Nếu hành vi có thể được biểu đạt một lần trong `qa-lab`, đặt nó trong `qa-lab`.
- Nếu hành vi phụ thuộc vào một transport kênh, giữ nó trong Plugin runner hoặc harness Plugin đó.
- Nếu một kịch bản cần một khả năng mới mà nhiều hơn một kênh có thể dùng, thêm một helper chung thay vì một nhánh riêng cho kênh trong `suite.ts`.
- Nếu một hành vi chỉ có ý nghĩa với một transport, giữ kịch bản riêng cho transport và làm rõ điều đó trong hợp đồng kịch bản.

### Tên helper kịch bản

Các helper chung ưu tiên cho kịch bản mới:

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

Các bí danh tương thích vẫn còn khả dụng cho các kịch bản hiện có — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — nhưng việc biên soạn kịch bản mới nên dùng các tên chung. Các bí danh tồn tại để tránh một đợt di chuyển bắt buộc cùng lúc, chứ không phải là mô hình về sau.

## Báo cáo

`qa-lab` xuất báo cáo giao thức Markdown từ dòng thời gian bus đã quan sát.
Báo cáo nên trả lời:

- Điều gì hoạt động
- Điều gì thất bại
- Điều gì vẫn bị chặn
- Những kịch bản theo dõi nào đáng thêm vào

Để xem danh sách các kịch bản khả dụng — hữu ích khi ước lượng công việc theo dõi hoặc nối một transport mới — hãy chạy `pnpm openclaw qa coverage` (thêm `--json` để có đầu ra máy đọc được).

Để kiểm tra tính cách và phong cách, hãy chạy cùng một kịch bản trên nhiều tham chiếu model live
và viết báo cáo Markdown đã được chấm:

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

Lệnh này chạy các tiến trình con của QA gateway cục bộ, không phải Docker. Các kịch bản đánh giá tính cách
nên đặt persona thông qua `SOUL.md`, rồi chạy các lượt người dùng thông thường
như trò chuyện, trợ giúp workspace và các tác vụ tệp nhỏ. Không nên cho model ứng viên
biết rằng nó đang được đánh giá. Lệnh này giữ lại từng transcript đầy đủ,
ghi lại các thống kê chạy cơ bản, rồi yêu cầu các model giám khảo ở chế độ nhanh với
lập luận `xhigh` khi được hỗ trợ để xếp hạng các lần chạy theo độ tự nhiên, sắc thái và sự hài hước.
Dùng `--blind-judge-models` khi so sánh các provider: prompt cho giám khảo vẫn nhận
mọi transcript và trạng thái chạy, nhưng các tham chiếu ứng viên được thay bằng nhãn trung lập
như `candidate-01`; báo cáo ánh xạ thứ hạng trở lại các tham chiếu thật sau khi
phân tích.
Theo mặc định, các lần chạy ứng viên dùng suy nghĩ `high`, với `medium` cho GPT-5.5 và `xhigh`
cho các tham chiếu đánh giá OpenAI cũ hơn có hỗ trợ. Ghi đè một ứng viên cụ thể ngay trong dòng bằng
`--model provider/model,thinking=<level>`. `--thinking <level>` vẫn đặt một
mức dự phòng toàn cục, và dạng cũ hơn `--model-thinking <provider/model=level>` được
giữ lại để tương thích.
Các tham chiếu ứng viên OpenAI mặc định dùng chế độ nhanh để ưu tiên xử lý ở nơi
provider hỗ trợ. Thêm `,fast`, `,no-fast`, hoặc `,fast=false` ngay trong dòng khi một
ứng viên hoặc giám khảo riêng lẻ cần ghi đè. Truyền `--fast` chỉ khi bạn muốn
bật bắt buộc chế độ nhanh cho mọi model ứng viên. Thời lượng của ứng viên và giám khảo được
ghi trong báo cáo để phân tích benchmark, nhưng prompt cho giám khảo nói rõ
không xếp hạng theo tốc độ.
Các lần chạy model ứng viên và giám khảo đều mặc định dùng concurrency 16. Hạ
`--concurrency` hoặc `--judge-concurrency` khi giới hạn provider hoặc áp lực Gateway
cục bộ làm lần chạy quá nhiễu.
Khi không truyền `--model` ứng viên, đánh giá tính cách mặc định dùng
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, và
`google/gemini-3.1-pro-preview` khi không truyền `--model`.
Khi không truyền `--judge-model`, các giám khảo mặc định là
`openai/gpt-5.5,thinking=xhigh,fast` và
`anthropic/claude-opus-4-6,thinking=high`.

## Tài liệu liên quan

- [Matrix QA](/vi/concepts/qa-matrix)
- [QA Channel](/vi/channels/qa-channel)
- [Kiểm thử](/vi/help/testing)
- [Dashboard](/vi/web/dashboard)
