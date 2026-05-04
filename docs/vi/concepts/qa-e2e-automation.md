---
read_when:
    - Hiểu cách các thành phần trong ngăn xếp QA phối hợp với nhau
    - Mở rộng qa-lab, qa-channel hoặc bộ điều hợp truyền tải
    - Thêm các kịch bản đảm bảo chất lượng dựa trên kho lưu trữ
    - Xây dựng tự động hóa QA sát thực tế hơn cho bảng điều khiển Gateway
summary: 'Tổng quan về ngăn xếp QA: qa-lab, qa-channel, các kịch bản dựa trên kho lưu trữ, các luồng vận chuyển trực tiếp, bộ điều hợp vận chuyển và báo cáo.'
title: Tổng quan về QA
x-i18n:
    generated_at: "2026-05-04T07:04:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 067f5aa0831724659ae36d548ef2e7bd28b40aad9cef45f325a01a2748003b29
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Stack QA riêng nhằm kiểm thử OpenClaw theo cách thực tế hơn, có hình dạng giống channel hơn so với một unit test đơn lẻ.

Các phần hiện tại:

- `extensions/qa-channel`: channel thông điệp tổng hợp với các bề mặt DM, channel, thread,
  reaction, edit và delete.
- `extensions/qa-lab`: UI gỡ lỗi và bus QA để quan sát transcript,
  chèn thông điệp đến và xuất báo cáo Markdown.
- `extensions/qa-matrix`, các Plugin runner trong tương lai: adapter transport trực tiếp
  điều khiển một channel thật bên trong Gateway QA con.
- `qa/`: tài sản seed do repo hậu thuẫn cho tác vụ khởi động và các kịch bản QA
  baseline.
- [Mantis](/vi/concepts/mantis): xác minh trực tiếp trước và sau cho các lỗi
  cần transport thật, ảnh chụp màn hình trình duyệt, trạng thái VM và bằng chứng PR.

## Giao diện lệnh

Mọi luồng QA chạy dưới `pnpm openclaw qa <subcommand>`. Nhiều luồng có bí danh script `pnpm qa:*`;
cả hai dạng đều được hỗ trợ.

| Lệnh                                                | Mục đích                                                                                                                                                                                     |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Tự kiểm tra QA đi kèm; ghi báo cáo Markdown.                                                                                                                                                 |
| `qa suite`                                          | Chạy các kịch bản do repo hậu thuẫn trên lane Gateway QA. Bí danh: `pnpm openclaw qa suite --runner multipass` cho một Linux VM dùng một lần.                                               |
| `qa coverage`                                       | In inventory phạm vi bao phủ kịch bản dạng markdown (`--json` cho đầu ra máy).                                                                                                               |
| `qa parity-report`                                  | So sánh hai tệp `qa-suite-summary.json` và ghi báo cáo parity kiểu agentic.                                                                                                                  |
| `qa character-eval`                                 | Chạy kịch bản QA nhân vật trên nhiều model trực tiếp với báo cáo được chấm. Xem [Báo cáo](#reporting).                                                                                       |
| `qa manual`                                         | Chạy một prompt một lần trên lane provider/model đã chọn.                                                                                                                                    |
| `qa ui`                                             | Khởi động UI gỡ lỗi QA và bus QA cục bộ (bí danh: `pnpm qa:lab:ui`).                                                                                                                         |
| `qa docker-build-image`                             | Build image Docker QA được dựng sẵn.                                                                                                                                                         |
| `qa docker-scaffold`                                | Ghi scaffold docker-compose cho bảng điều khiển QA + lane Gateway.                                                                                                                           |
| `qa up`                                             | Build site QA, khởi động stack do Docker hậu thuẫn, in URL (bí danh: `pnpm qa:lab:up`; biến thể `:fast` thêm `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                         |
| `qa aimock`                                         | Chỉ khởi động server provider AIMock.                                                                                                                                                        |
| `qa mock-openai`                                    | Chỉ khởi động server provider `mock-openai` có nhận biết kịch bản.                                                                                                                           |
| `qa credentials doctor` / `add` / `list` / `remove` | Quản lý pool credential Convex dùng chung.                                                                                                                                                   |
| `qa matrix`                                         | Lane transport trực tiếp trên homeserver Tuwunel dùng một lần. Xem [Matrix QA](/vi/concepts/qa-matrix).                                                                                         |
| `qa telegram`                                       | Lane transport trực tiếp trên một nhóm Telegram riêng tư thật.                                                                                                                               |
| `qa discord`                                        | Lane transport trực tiếp trên một channel guild Discord riêng tư thật.                                                                                                                       |
| `qa slack`                                          | Lane transport trực tiếp trên một channel Slack riêng tư thật.                                                                                                                               |
| `qa mantis`                                         | Runner xác minh trước và sau cho lỗi transport trực tiếp, với bằng chứng reaction trạng thái Discord, smoke desktop/trình duyệt Crabbox và smoke Slack trong VNC. Xem [Mantis](/vi/concepts/mantis). |

## Luồng vận hành

Luồng vận hành QA hiện tại là một site QA hai khung:

- Trái: bảng điều khiển Gateway (Control UI) với agent.
- Phải: QA Lab, hiển thị transcript kiểu Slack và kế hoạch kịch bản.

Chạy bằng:

```bash
pnpm qa:lab:up
```

Lệnh đó build site QA, khởi động lane Gateway do Docker hậu thuẫn, và mở trang
QA Lab nơi operator hoặc vòng lặp tự động hóa có thể giao cho agent một nhiệm vụ
QA, quan sát hành vi channel thật, và ghi lại những gì hoạt động, thất bại hoặc
vẫn bị chặn.

Để lặp UI QA Lab cục bộ nhanh hơn mà không rebuild image Docker mỗi lần,
hãy khởi động stack với bundle QA Lab được bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` giữ các dịch vụ Docker trên image đã dựng sẵn và bind-mount
`extensions/qa-lab/web/dist` vào container `qa-lab`. `qa:lab:watch`
rebuild bundle đó khi có thay đổi, và trình duyệt tự động tải lại khi hash tài sản QA Lab
thay đổi.

Để chạy smoke trace OpenTelemetry cục bộ, chạy:

```bash
pnpm qa:otel:smoke
```

Script đó khởi động một receiver trace OTLP/HTTP cục bộ, chạy kịch bản QA
`otel-trace-smoke` với Plugin `diagnostics-otel` được bật, rồi
giải mã các span protobuf đã xuất và assert hình dạng trọng yếu cho release:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` và `openclaw.message.delivery` phải có mặt;
các lần gọi model không được xuất `StreamAbandoned` trên các lượt thành công; ID chẩn đoán thô và
thuộc tính `openclaw.content.*` phải không xuất hiện trong trace. Script ghi
`otel-smoke-summary.json` cạnh các artifact của bộ QA.

QA quan sát được chỉ ở source checkout. Tarball npm cố ý bỏ qua
QA Lab, nên các lane release Docker package không chạy lệnh `qa`. Dùng
`pnpm qa:otel:smoke` từ một source checkout đã build khi thay đổi instrumentation
chẩn đoán.

Đối với lane smoke Matrix dùng transport thật, chạy:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Tài liệu tham khảo CLI đầy đủ, catalog profile/kịch bản, biến môi trường và bố cục artifact cho lane này nằm trong [Matrix QA](/vi/concepts/qa-matrix). Nhìn nhanh: nó provision một homeserver Tuwunel dùng một lần trong Docker, đăng ký người dùng driver/SUT/observer tạm thời, chạy Plugin Matrix thật bên trong một Gateway QA con giới hạn trong transport đó (không có `qa-channel`), rồi ghi báo cáo Markdown, tóm tắt JSON, artifact sự kiện quan sát được và log đầu ra kết hợp dưới `.artifacts/qa-e2e/matrix-<timestamp>/`.

Đối với các lane smoke Telegram, Discord và Slack dùng transport thật:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Chúng nhắm tới một channel thật đã tồn tại với hai bot (driver + SUT). Các biến môi trường bắt buộc, danh sách kịch bản, artifact đầu ra và pool credential Convex được ghi trong [Tài liệu tham khảo QA cho Telegram, Discord và Slack](#telegram-discord-and-slack-qa-reference) bên dưới.

Để chạy VM desktop Slack đầy đủ với cứu hộ VNC, chạy:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Lệnh đó thuê một máy desktop/trình duyệt Crabbox, chạy lane Slack trực tiếp
bên trong VM, mở Slack Web trong trình duyệt VNC, chụp desktop và
sao chép `slack-qa/` cùng `slack-desktop-smoke.png` về thư mục artifact
Mantis. Dùng lại `--lease-id <cbx_...>` sau khi đăng nhập thủ công vào Slack Web
qua VNC. Với `--gateway-setup`, Mantis để lại một Gateway Slack OpenClaw
liên tục chạy bên trong VM trên cổng `38973`; nếu không có, lệnh chạy
lane QA Slack bot-to-bot bình thường và thoát sau khi chụp artifact.

Trước khi dùng credential trực tiếp trong pool, chạy:

```bash
pnpm openclaw qa credentials doctor
```

Doctor kiểm tra env broker Convex, xác thực thiết lập endpoint và xác minh khả năng truy cập admin/list khi có secret maintainer. Nó chỉ báo cáo trạng thái đã đặt/thiếu cho secret.

## Phạm vi bao phủ transport trực tiếp

Các lane transport trực tiếp dùng chung một contract thay vì mỗi lane tự phát minh dạng danh sách kịch bản riêng. `qa-channel` là bộ hành vi sản phẩm tổng hợp rộng và không phải là một phần của ma trận phạm vi bao phủ transport trực tiếp.

| Lane     | Canary | Chặn bằng mention | Bot-to-bot | Chặn allowlist | Phản hồi cấp cao nhất | Tiếp tục sau restart | Follow-up trong thread | Cô lập thread | Quan sát reaction | Lệnh trợ giúp | Đăng ký lệnh native |
| -------- | ------ | ----------------- | ---------- | -------------- | --------------------- | -------------------- | ---------------------- | -------------- | ----------------- | ------------ | ------------------- |
| Matrix   | x      | x                 | x          | x              | x                     | x                    | x                      | x              | x                 |              |                     |
| Telegram | x      | x                 | x          |                |                       |                      |                        |                |                   | x            |                     |
| Discord  | x      | x                 | x          |                |                       |                      |                        |                |                   |              | x                   |
| Slack    | x      | x                 | x          |                |                       |                      |                        |                |                   |              |                     |

Điều này giữ `qa-channel` là bộ hành vi sản phẩm rộng, trong khi Matrix,
Telegram và các transport trực tiếp tương lai dùng chung một checklist
contract transport rõ ràng.

Để chạy lane Linux VM dùng một lần mà không đưa Docker vào đường dẫn QA, chạy:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Thao tác này khởi động một guest Multipass mới, cài đặt các dependency, build OpenClaw
bên trong guest, chạy `qa suite`, rồi sao chép báo cáo QA thông thường và
bản tóm tắt về `.artifacts/qa-e2e/...` trên host.
Nó tái sử dụng cùng hành vi chọn scenario như `qa suite` trên host.
Các lần chạy suite trên host và Multipass thực thi nhiều scenario đã chọn song song
với các worker gateway cô lập theo mặc định. `qa-channel` mặc định dùng concurrency
4, giới hạn bởi số lượng scenario đã chọn. Dùng `--concurrency <count>` để điều chỉnh
số lượng worker, hoặc `--concurrency 1` để thực thi tuần tự.
Lệnh thoát với mã khác 0 khi bất kỳ scenario nào thất bại. Dùng `--allow-failures` khi
bạn muốn có artifact mà không có mã thoát báo lỗi.
Các lần chạy live chuyển tiếp những input xác thực QA được hỗ trợ và phù hợp thực tế cho
guest: khóa nhà cung cấp dựa trên env, đường dẫn cấu hình QA live provider, và
`CODEX_HOME` khi có. Giữ `--output-dir` dưới repo root để guest
có thể ghi ngược lại qua workspace đã mount.

## Tham chiếu QA cho Telegram, Discord và Slack

Matrix có một [trang riêng](/vi/concepts/qa-matrix) vì số lượng scenario và việc provisioning homeserver dựa trên Docker. Telegram, Discord và Slack nhỏ hơn — mỗi loại chỉ có vài scenario, không có hệ thống profile, chạy với các kênh thật đã tồn tại — nên phần tham chiếu của chúng nằm ở đây.

### Các cờ CLI dùng chung

Các lane này đăng ký qua `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` và chấp nhận cùng các cờ:

| Cờ                                    | Mặc định                                                       | Mô tả                                                                                                                  |
| ------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                              | Chỉ chạy scenario này. Có thể lặp lại.                                                                                 |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Nơi ghi báo cáo/bản tóm tắt/thông điệp đã quan sát và log đầu ra. Đường dẫn tương đối được phân giải theo `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                | Repo root khi gọi từ một cwd trung lập.                                                                                |
| `--sut-account <id>`                  | `sut`                                                          | Id tài khoản tạm thời bên trong cấu hình QA gateway.                                                                   |
| `--provider-mode <mode>`              | `live-frontier`                                                | `mock-openai` hoặc `live-frontier` (`live-openai` cũ vẫn hoạt động).                                                   |
| `--model <ref>` / `--alt-model <ref>` | mặc định của nhà cung cấp                                      | Ref model chính/thay thế.                                                                                              |
| `--fast`                              | tắt                                                            | Chế độ nhanh của nhà cung cấp khi được hỗ trợ.                                                                         |
| `--credential-source <env\|convex>`   | `env`                                                          | Xem [nhóm credential Convex](#convex-credential-pool).                                                                 |
| `--credential-role <maintainer\|ci>`  | `ci` trong CI, nếu không thì `maintainer`                      | Role được dùng khi `--credential-source convex`.                                                                       |

Mỗi lane thoát với mã khác 0 khi có bất kỳ scenario nào thất bại. `--allow-failures` ghi artifact mà không đặt mã thoát báo lỗi.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Nhắm đến một nhóm Telegram riêng tư thật với hai bot riêng biệt (driver + SUT). Bot SUT phải có username Telegram; quan sát bot-to-bot hoạt động tốt nhất khi cả hai bot đều bật **Bot-to-Bot Communication Mode** trong `@BotFather`.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — id chat dạng số (chuỗi).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Tùy chọn:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` giữ nội dung thông điệp trong artifact thông điệp đã quan sát (mặc định biên tập lại).

Scenario (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

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
- `telegram-qa-summary.json` — bao gồm RTT theo từng reply (driver gửi → quan sát reply của SUT), bắt đầu từ canary.
- `telegram-qa-observed-messages.json` — phần thân được biên tập lại trừ khi `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Nhắm đến một kênh guild Discord riêng tư thật với hai bot: một bot driver do harness điều khiển và một bot SUT được khởi động bởi OpenClaw gateway con thông qua Plugin Discord được đóng gói kèm. Xác minh cách xử lý mention trong kênh, rằng bot SUT đã đăng ký lệnh native `/help` với Discord, và các scenario bằng chứng Mantis dạng opt-in.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — phải khớp với id người dùng bot SUT do Discord trả về (nếu không lane sẽ thất bại sớm).

Tùy chọn:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` giữ nội dung thông điệp trong artifact thông điệp đã quan sát.

Scenario (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — scenario Mantis dạng opt-in. Chạy riêng vì nó chuyển SUT sang reply trong guild luôn bật, chỉ dùng công cụ với `messages.statusReactions.enabled=true`, rồi chụp timeline reaction REST cùng một artifact trực quan HTML/PNG.

Chạy rõ ràng scenario status-reaction của Mantis:

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
- `discord-qa-observed-messages.json` — phần thân được biên tập lại trừ khi `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` và `discord-status-reactions-tool-only-timeline.png` khi scenario status-reaction chạy.

### QA Slack

```bash
pnpm openclaw qa slack
```

Nhắm đến một kênh Slack riêng tư thật với hai bot riêng biệt: một bot driver do harness điều khiển và một bot SUT được khởi động bởi OpenClaw gateway con thông qua Plugin Slack được đóng gói kèm.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Tùy chọn:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` giữ nội dung thông điệp trong artifact thông điệp đã quan sát.

Scenario (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Artifact đầu ra:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — phần thân được biên tập lại trừ khi `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

### Nhóm credential Convex

Các lane Telegram, Discord và Slack có thể lease credential từ một nhóm Convex dùng chung thay vì đọc các env var ở trên. Truyền `--credential-source convex` (hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab lấy một lease độc quyền, Heartbeat nó trong suốt thời gian chạy, và giải phóng nó khi shutdown. Các loại pool là `"telegram"`, `"discord"` và `"slack"`.

Dạng payload mà broker xác thực trên `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` phải là chuỗi chat-id dạng số.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Các env var vận hành và contract endpoint của broker Convex nằm trong [Kiểm thử → Credential Telegram dùng chung qua Convex](/vi/help/testing#shared-telegram-credentials-via-convex-v1) (tên section có trước hỗ trợ Discord; ngữ nghĩa broker giống hệt cho cả hai loại).

## Seed dựa trên repo

Asset seed nằm trong `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Chúng được đưa vào git có chủ ý để kế hoạch QA hiển thị cho cả con người và
agent.

`qa-lab` nên tiếp tục là một runner markdown tổng quát. Mỗi file markdown scenario là
nguồn sự thật cho một lần chạy test và nên định nghĩa:

- metadata scenario
- metadata tùy chọn về category, capability, lane và risk
- ref docs và code
- yêu cầu Plugin tùy chọn
- patch cấu hình gateway tùy chọn
- `qa-flow` có thể thực thi

Bề mặt runtime tái sử dụng hỗ trợ `qa-flow` được phép tiếp tục là tổng quát
và cắt ngang nhiều phần. Ví dụ, các scenario markdown có thể kết hợp helper phía transport
với helper phía browser điều khiển Control UI nhúng thông qua
seam Gateway `browser.request` mà không cần thêm runner xử lý riêng.

Các file scenario nên được nhóm theo capability sản phẩm thay vì thư mục source tree.
Giữ ID scenario ổn định khi di chuyển file; dùng `docsRefs` và `codeRefs`
để truy vết implementation.

Danh sách baseline nên đủ rộng để bao phủ:

- chat DM và kênh
- hành vi thread
- vòng đời message action
- callback cron
- truy hồi memory
- chuyển đổi model
- bàn giao subagent
- đọc repo và đọc docs
- một tác vụ build nhỏ như Lobster Invaders

## Lane provider mock

`qa suite` có hai lane provider mock cục bộ:

- `mock-openai` là mock OpenClaw nhận biết scenario. Nó tiếp tục là lane mock
  xác định mặc định cho QA dựa trên repo và các gate parity.
- `aimock` khởi động một provider server dựa trên AIMock cho coverage giao thức,
  fixture, record/replay và chaos thử nghiệm. Nó là phần bổ sung và không
  thay thế dispatcher scenario `mock-openai`.

Implementation lane provider nằm dưới `extensions/qa-lab/src/providers/`.
Mỗi provider sở hữu mặc định, khởi động server cục bộ, cấu hình model gateway,
nhu cầu staging auth-profile, và cờ capability live/mock của nó. Code suite và
gateway dùng chung nên định tuyến qua provider registry thay vì rẽ nhánh theo
tên provider.

## Adapter transport

`qa-lab` sở hữu một seam transport tổng quát cho các scenario QA markdown. `qa-channel` là adapter đầu tiên trên seam đó, nhưng mục tiêu thiết kế rộng hơn: các kênh thật hoặc synthetic trong tương lai nên cắm vào cùng suite runner thay vì thêm runner QA riêng cho từng transport.

Ở cấp kiến trúc, phần tách như sau:

- `qa-lab` sở hữu thực thi scenario tổng quát, concurrency worker, ghi artifact và báo cáo.
- Adapter transport sở hữu cấu hình gateway, readiness, quan sát inbound và outbound, action transport, và trạng thái transport đã chuẩn hóa.
- Các file scenario markdown dưới `qa/scenarios/` định nghĩa lần chạy test; `qa-lab` cung cấp bề mặt runtime tái sử dụng để thực thi chúng.

### Thêm một kênh

Thêm một kênh vào hệ thống QA markdown cần đúng hai thứ:

1. Một adapter transport cho kênh.
2. Một gói scenario kiểm tra contract của kênh.

Không thêm root lệnh QA cấp cao mới khi host `qa-lab` dùng chung có thể sở hữu flow.

`qa-lab` sở hữu các cơ chế máy chủ dùng chung:

- gốc lệnh `openclaw qa`
- khởi động và dọn dẹp bộ kiểm thử
- mức đồng thời của worker
- ghi artifact
- tạo báo cáo
- thực thi kịch bản
- alias tương thích cho các kịch bản `qa-channel` cũ hơn

Các Plugin trình chạy sở hữu hợp đồng truyền tải:

- cách `openclaw qa <runner>` được gắn bên dưới gốc `qa` dùng chung
- cách gateway được cấu hình cho truyền tải đó
- cách kiểm tra trạng thái sẵn sàng
- cách chèn sự kiện đi vào
- cách quan sát tin nhắn đi ra
- cách hiển thị bản ghi hội thoại và trạng thái truyền tải đã chuẩn hóa
- cách thực thi các hành động dựa trên truyền tải
- cách xử lý đặt lại hoặc dọn dẹp riêng cho truyền tải

Mức tối thiểu để áp dụng một kênh mới:

1. Giữ `qa-lab` làm chủ sở hữu của gốc `qa` dùng chung.
2. Triển khai trình chạy truyền tải trên seam máy chủ `qa-lab` dùng chung.
3. Giữ các cơ chế riêng cho truyền tải bên trong Plugin trình chạy hoặc harness kênh.
4. Gắn trình chạy dưới dạng `openclaw qa <runner>` thay vì đăng ký một lệnh gốc cạnh tranh. Các Plugin trình chạy nên khai báo `qaRunners` trong `openclaw.plugin.json` và xuất một mảng `qaRunnerCliRegistrations` khớp từ `runtime-api.ts`. Giữ `runtime-api.ts` nhẹ; CLI lười tải và thực thi trình chạy nên nằm sau các entrypoint riêng.
5. Viết hoặc điều chỉnh các kịch bản markdown trong các thư mục `qa/scenarios/` theo chủ đề.
6. Dùng các helper kịch bản chung cho kịch bản mới.
7. Giữ các alias tương thích hiện có hoạt động trừ khi repo đang thực hiện một đợt di trú có chủ ý.

Quy tắc quyết định rất nghiêm ngặt:

- Nếu hành vi có thể được biểu đạt một lần trong `qa-lab`, hãy đặt nó trong `qa-lab`.
- Nếu hành vi phụ thuộc vào một truyền tải kênh, hãy giữ nó trong Plugin trình chạy hoặc harness Plugin đó.
- Nếu một kịch bản cần một khả năng mới mà nhiều hơn một kênh có thể dùng, hãy thêm một helper chung thay vì một nhánh riêng cho kênh trong `suite.ts`.
- Nếu một hành vi chỉ có ý nghĩa với một truyền tải, hãy giữ kịch bản đó là riêng cho truyền tải và thể hiện rõ điều đó trong hợp đồng kịch bản.

### Tên helper kịch bản

Các helper chung được ưu tiên cho kịch bản mới:

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

Các alias tương thích vẫn có sẵn cho kịch bản hiện có — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — nhưng khi viết kịch bản mới nên dùng các tên chung. Các alias tồn tại để tránh một đợt di trú đồng loạt, không phải là mô hình về sau.

## Báo cáo

`qa-lab` xuất một báo cáo giao thức Markdown từ dòng thời gian bus đã quan sát.
Báo cáo nên trả lời:

- Những gì đã hoạt động
- Những gì đã thất bại
- Những gì vẫn bị chặn
- Những kịch bản tiếp theo đáng thêm vào

Để xem danh mục các kịch bản có sẵn — hữu ích khi ước lượng công việc tiếp theo hoặc nối dây một truyền tải mới — hãy chạy `pnpm openclaw qa coverage` (thêm `--json` để có đầu ra máy đọc được).

Để kiểm tra nhân vật và phong cách, chạy cùng một kịch bản trên nhiều ref mô hình live
và ghi một báo cáo Markdown đã được chấm:

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

Lệnh này chạy các tiến trình con gateway QA cục bộ, không phải Docker. Các kịch bản đánh giá nhân vật
nên đặt persona thông qua `SOUL.md`, rồi chạy các lượt người dùng thông thường
như trò chuyện, trợ giúp workspace, và tác vụ tệp nhỏ. Không nên cho mô hình ứng viên
biết rằng nó đang được đánh giá. Lệnh giữ lại từng bản ghi hội thoại đầy đủ,
ghi lại các thống kê chạy cơ bản, rồi yêu cầu các mô hình chấm ở chế độ nhanh với
suy luận `xhigh` khi được hỗ trợ để xếp hạng các lượt chạy theo độ tự nhiên, vibe và tính hài hước.
Dùng `--blind-judge-models` khi so sánh các nhà cung cấp: prompt chấm vẫn nhận
mọi bản ghi hội thoại và trạng thái chạy, nhưng các ref ứng viên được thay bằng các
nhãn trung tính như `candidate-01`; báo cáo ánh xạ xếp hạng trở lại các ref thật sau
khi phân tích cú pháp.
Các lượt chạy ứng viên mặc định dùng thinking `high`, với `medium` cho GPT-5.5 và `xhigh`
cho các ref đánh giá OpenAI cũ hơn có hỗ trợ. Ghi đè một ứng viên cụ thể trực tiếp bằng
`--model provider/model,thinking=<level>`. `--thinking <level>` vẫn đặt một
fallback toàn cục, và dạng cũ hơn `--model-thinking <provider/model=level>` được
giữ để tương thích.
Các ref ứng viên OpenAI mặc định dùng chế độ nhanh để dùng xử lý ưu tiên ở nơi
nhà cung cấp hỗ trợ. Thêm trực tiếp `,fast`, `,no-fast`, hoặc `,fast=false` khi một
ứng viên hoặc mô hình chấm riêng lẻ cần ghi đè. Chỉ truyền `--fast` khi bạn muốn
bắt buộc bật chế độ nhanh cho mọi mô hình ứng viên. Thời lượng của ứng viên và mô hình chấm
được ghi trong báo cáo để phân tích benchmark, nhưng prompt chấm nêu rõ
không xếp hạng theo tốc độ.
Các lượt chạy mô hình ứng viên và mô hình chấm đều mặc định có mức đồng thời 16. Giảm
`--concurrency` hoặc `--judge-concurrency` khi giới hạn nhà cung cấp hoặc áp lực gateway
cục bộ khiến một lượt chạy quá nhiễu.
Khi không truyền `--model` ứng viên, đánh giá nhân vật mặc định dùng
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, và
`google/gemini-3.1-pro-preview` khi không truyền `--model`.
Khi không truyền `--judge-model`, các mô hình chấm mặc định là
`openai/gpt-5.5,thinking=xhigh,fast` và
`anthropic/claude-opus-4-6,thinking=high`.

## Tài liệu liên quan

- [QA ma trận](/vi/concepts/qa-matrix)
- [Kênh QA](/vi/channels/qa-channel)
- [Kiểm thử](/vi/help/testing)
- [Dashboard](/vi/web/dashboard)
