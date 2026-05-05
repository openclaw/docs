---
read_when:
    - Hiểu cách ngăn xếp QA phối hợp với nhau
    - Mở rộng qa-lab, qa-channel hoặc một bộ điều hợp truyền tải
    - Thêm các kịch bản QA dựa trên kho lưu trữ
    - Xây dựng tự động hóa QA có độ sát thực cao hơn cho bảng điều khiển Gateway
summary: 'Tổng quan về ngăn xếp QA: qa-lab, qa-channel, các kịch bản dựa trên repo, các làn truyền tải trực tiếp, bộ điều hợp truyền tải và báo cáo.'
title: Tổng quan QA
x-i18n:
    generated_at: "2026-05-05T06:17:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: d313abf9e0f13a159ce28c023e2a1c4c1518529da1354a130e9f495e65faac19
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Ngăn xếp QA riêng tư nhằm kiểm thử OpenClaw theo cách thực tế hơn,
mang hình dạng channel hơn so với một unit test đơn lẻ có thể làm được.

Các phần hiện tại:

- `extensions/qa-channel`: channel tin nhắn tổng hợp với các bề mặt DM, channel, thread,
  reaction, edit và delete.
- `extensions/qa-lab`: giao diện debugger và QA bus để quan sát bản ghi,
  chèn tin nhắn inbound và xuất báo cáo Markdown.
- `extensions/qa-matrix`, các Plugin runner trong tương lai: adapter live-transport
  điều khiển một channel thật bên trong một QA gateway con.
- `qa/`: tài nguyên seed do repo hậu thuẫn cho tác vụ khởi động và các kịch bản QA
  baseline.
- [Mantis](/vi/concepts/mantis): xác minh trực tiếp trước và sau cho các lỗi cần
  transport thật, ảnh chụp trình duyệt, trạng thái VM và bằng chứng PR.

## Bề mặt lệnh

Mọi luồng QA đều chạy dưới `pnpm openclaw qa <subcommand>`. Nhiều luồng có bí danh script `pnpm qa:*`;
cả hai dạng đều được hỗ trợ.

| Lệnh                                                | Mục đích                                                                                                                                                                                     |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Tự kiểm tra QA đi kèm; ghi một báo cáo Markdown.                                                                                                                                             |
| `qa suite`                                          | Chạy các kịch bản do repo hậu thuẫn trên làn QA gateway. Bí danh: `pnpm openclaw qa suite --runner multipass` cho một Linux VM dùng một lần.                                                 |
| `qa coverage`                                       | In inventory độ phủ kịch bản dạng markdown (`--json` cho đầu ra máy đọc).                                                                                                                    |
| `qa parity-report`                                  | So sánh hai tệp `qa-suite-summary.json` và ghi báo cáo parity agentic.                                                                                                                       |
| `qa character-eval`                                 | Chạy kịch bản QA nhân vật trên nhiều mô hình live cùng một báo cáo được chấm. Xem [Báo cáo](#reporting).                                                                                     |
| `qa manual`                                         | Chạy một prompt một lần trên làn provider/model đã chọn.                                                                                                                                     |
| `qa ui`                                             | Khởi động giao diện QA debugger và QA bus cục bộ (bí danh: `pnpm qa:lab:ui`).                                                                                                                 |
| `qa docker-build-image`                             | Xây dựng image QA Docker dựng sẵn.                                                                                                                                                           |
| `qa docker-scaffold`                                | Ghi scaffold docker-compose cho bảng điều khiển QA + làn Gateway.                                                                                                                            |
| `qa up`                                             | Xây dựng site QA, khởi động ngăn xếp do Docker hậu thuẫn, in URL (bí danh: `pnpm qa:lab:up`; biến thể `:fast` thêm `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                   |
| `qa aimock`                                         | Chỉ khởi động server provider AIMock.                                                                                                                                                        |
| `qa mock-openai`                                    | Chỉ khởi động server provider `mock-openai` nhận biết kịch bản.                                                                                                                              |
| `qa credentials doctor` / `add` / `list` / `remove` | Quản lý pool thông tin xác thực Convex dùng chung.                                                                                                                                           |
| `qa matrix`                                         | Làn live transport trên homeserver Tuwunel dùng một lần. Xem [Matrix QA](/vi/concepts/qa-matrix).                                                                                               |
| `qa telegram`                                       | Làn live transport trên một nhóm Telegram riêng tư thật.                                                                                                                                     |
| `qa discord`                                        | Làn live transport trên một channel guild Discord riêng tư thật.                                                                                                                             |
| `qa slack`                                          | Làn live transport trên một channel Slack riêng tư thật.                                                                                                                                     |
| `qa mantis`                                         | Runner xác minh trước và sau cho lỗi live transport, với bằng chứng reaction trạng thái Discord, smoke desktop/trình duyệt Crabbox và smoke Slack-in-VNC. Xem [Mantis](/vi/concepts/mantis).    |

## Luồng operator

Luồng operator QA hiện tại là một site QA hai khung:

- Trái: bảng điều khiển Gateway (Control UI) với agent.
- Phải: QA Lab, hiển thị bản ghi kiểu Slack và kế hoạch kịch bản.

Chạy bằng:

```bash
pnpm qa:lab:up
```

Lệnh đó xây dựng site QA, khởi động làn Gateway do Docker hậu thuẫn và công khai
trang QA Lab nơi một operator hoặc vòng lặp tự động hóa có thể giao cho agent một
nhiệm vụ QA, quan sát hành vi channel thật và ghi lại điều gì hoạt động, thất bại hoặc
vẫn bị chặn.

Để lặp giao diện QA Lab nhanh hơn mà không phải xây dựng lại Docker image mỗi lần,
hãy khởi động ngăn xếp với bundle QA Lab được bind-mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` giữ các dịch vụ Docker trên một image dựng sẵn và bind-mount
`extensions/qa-lab/web/dist` vào container `qa-lab`. `qa:lab:watch`
xây dựng lại bundle đó khi có thay đổi, và trình duyệt tự động tải lại khi hash tài nguyên
QA Lab thay đổi.

Để smoke trace OpenTelemetry cục bộ, chạy:

```bash
pnpm qa:otel:smoke
```

Script đó khởi động một receiver trace OTLP/HTTP cục bộ, chạy kịch bản QA
`otel-trace-smoke` với Plugin `diagnostics-otel` được bật, sau đó giải mã
các span protobuf đã xuất và assert hình dạng trọng yếu cho release:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` và `openclaw.message.delivery` phải hiện diện;
các lệnh gọi model không được xuất `StreamAbandoned` trong các lượt thành công; ID chẩn đoán thô và
thuộc tính `openclaw.content.*` phải không xuất hiện trong trace. Nó ghi
`otel-smoke-summary.json` cạnh các artifact QA suite.

QA khả năng quan sát chỉ dành cho source-checkout. Tarball npm cố ý bỏ qua
QA Lab, vì vậy các làn release Docker package không chạy lệnh `qa`. Dùng
`pnpm qa:otel:smoke` từ một source checkout đã build khi thay đổi instrumentation
chẩn đoán.

Để chạy làn smoke Matrix dùng transport thật, chạy:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Tham chiếu CLI đầy đủ, catalog profile/kịch bản, env vars và bố cục artifact cho làn này nằm trong [Matrix QA](/vi/concepts/qa-matrix). Nhìn nhanh: nó provision một homeserver Tuwunel dùng một lần trong Docker, đăng ký người dùng driver/SUT/observer tạm thời, chạy Plugin Matrix thật bên trong một QA gateway con được giới hạn cho transport đó (không có `qa-channel`), rồi ghi báo cáo Markdown, bản tóm tắt JSON, artifact observed-events và log đầu ra kết hợp dưới `.artifacts/qa-e2e/matrix-<timestamp>/`.

Đối với các làn smoke Telegram, Discord và Slack dùng transport thật:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Chúng nhắm đến một channel thật đã có sẵn với hai bot (driver + SUT). Env vars bắt buộc, danh sách kịch bản, artifact đầu ra và pool thông tin xác thực Convex được ghi lại trong [Tham chiếu QA Telegram, Discord và Slack](#telegram-discord-and-slack-qa-reference) bên dưới.

Để chạy đầy đủ Slack desktop VM với cứu hộ VNC, chạy:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Lệnh đó thuê một máy desktop/trình duyệt Crabbox, chạy làn Slack live
bên trong VM, mở Slack Web trong trình duyệt VNC, chụp desktop và
sao chép `slack-qa/`, `slack-desktop-smoke.png` và `slack-desktop-smoke.mp4`
khi có thể quay video về thư mục artifact Mantis. Dùng lại `--lease-id <cbx_...>` sau khi đăng nhập thủ công vào Slack Web
qua VNC. Với `--gateway-setup`, Mantis để một Gateway Slack OpenClaw bền vững
chạy bên trong VM trên cổng `38973`; nếu không có, lệnh sẽ chạy làn QA Slack
bot-đến-bot bình thường và thoát sau khi thu artifact.

Đối với tác vụ desktop kiểu agent/CV, chạy:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` thuê hoặc dùng lại một máy desktop/trình duyệt Crabbox, khởi động
`crabbox record --while`, điều khiển trình duyệt đang hiển thị thông qua một
`visual-driver` lồng nhau, chụp `visual-task.png`, chạy `openclaw infer image describe`
trên ảnh chụp khi `--vision-mode image-describe` được chọn, và
ghi `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` và `mantis-visual-task-report.md`.
Khi đặt `--expect-text`, vision prompt yêu cầu verdict JSON có cấu trúc
và chỉ pass khi model báo cáo bằng chứng nhìn thấy tích cực; phản hồi âm
chỉ trích lại văn bản mục tiêu sẽ làm assertion thất bại.
Dùng `--vision-mode metadata` cho một smoke không dùng model, chứng minh đường ống desktop,
trình duyệt, ảnh chụp và video mà không gọi provider hiểu hình ảnh.
Recording là artifact bắt buộc cho `visual-task`; nếu Crabbox không ghi
được `visual-task.mp4` không rỗng, tác vụ thất bại ngay cả khi visual driver
đã pass. Khi thất bại, Mantis giữ lease cho VNC trừ khi tác vụ đã
pass và `--keep-lease` không được đặt.

Trước khi dùng thông tin xác thực live dùng chung trong pool, chạy:

```bash
pnpm openclaw qa credentials doctor
```

Doctor kiểm tra env broker Convex, xác thực thiết lập endpoint và xác minh khả năng truy cập admin/list khi có maintainer secret. Nó chỉ báo cáo trạng thái đã đặt/thiếu cho secret.

## Độ phủ live transport

Các làn live transport chia sẻ một contract thay vì mỗi làn tự phát minh hình dạng danh sách kịch bản riêng. `qa-channel` là suite hành vi sản phẩm tổng hợp rộng và không thuộc ma trận độ phủ live transport.

| Lane     | Canary | Cổng nhắc đến | Bot-to-bot | Chặn allowlist | Trả lời cấp cao nhất | Tiếp tục sau khởi động lại | Theo dõi luồng | Cô lập luồng | Quan sát phản ứng | Lệnh trợ giúp | Đăng ký lệnh gốc |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

Điều này giữ `qa-channel` là bộ kiểm thử hành vi sản phẩm rộng, trong khi Matrix,
Telegram và các live transport trong tương lai dùng chung một danh sách kiểm tra
hợp đồng transport rõ ràng.

Để chạy một lane VM Linux dùng một lần mà không đưa Docker vào đường dẫn QA, hãy chạy:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Lệnh này khởi động một guest Multipass mới, cài đặt dependency, build OpenClaw
bên trong guest, chạy `qa suite`, rồi sao chép báo cáo QA thông thường và
tóm tắt trở lại `.artifacts/qa-e2e/...` trên host.
Nó tái sử dụng cùng hành vi chọn kịch bản như `qa suite` trên host.
Các lần chạy bộ kiểm thử trên host và Multipass thực thi nhiều kịch bản đã chọn song song
với các worker Gateway được cô lập theo mặc định. `qa-channel` mặc định dùng concurrency
4, giới hạn bởi số lượng kịch bản được chọn. Dùng `--concurrency <count>` để tinh chỉnh
số worker, hoặc `--concurrency 1` để thực thi tuần tự.
Lệnh thoát khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi
bạn muốn có artifact mà không có mã thoát thất bại.
Các lần chạy live chuyển tiếp những đầu vào xác thực QA được hỗ trợ và thực tế cho
guest: khóa provider dựa trên env, đường dẫn cấu hình provider live QA và
`CODEX_HOME` khi có. Giữ `--output-dir` dưới repo root để guest
có thể ghi ngược lại qua workspace đã mount.

## Tài liệu tham khảo QA cho Telegram, Discord và Slack

Matrix có một [trang riêng](/vi/concepts/qa-matrix) vì số lượng kịch bản và việc cấp phát homeserver dựa trên Docker. Telegram, Discord và Slack nhỏ hơn — mỗi bên chỉ có vài kịch bản, không có hệ thống profile, chạy với các kênh thật đã tồn tại — nên tài liệu tham khảo của chúng nằm ở đây.

### Cờ CLI dùng chung

Các lane này đăng ký qua `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` và chấp nhận cùng các cờ:

| Cờ                                    | Mặc định                                                        | Mô tả                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Chỉ chạy kịch bản này. Có thể lặp lại.                                                                                |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Nơi ghi báo cáo/tóm tắt/tin nhắn đã quan sát và log đầu ra. Đường dẫn tương đối được phân giải theo `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Repo root khi gọi từ một cwd trung lập.                                                                               |
| `--sut-account <id>`                  | `sut`                                                           | Id tài khoản tạm thời bên trong cấu hình Gateway QA.                                                                  |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` hoặc `live-frontier` (`live-openai` cũ vẫn hoạt động).                                                  |
| `--model <ref>` / `--alt-model <ref>` | provider default                                                | Ref model chính/thay thế.                                                                                             |
| `--fast`                              | off                                                             | Chế độ nhanh của provider khi được hỗ trợ.                                                                            |
| `--credential-source <env\|convex>`   | `env`                                                           | Xem [pool thông tin xác thực Convex](#convex-credential-pool).                                                        |
| `--credential-role <maintainer\|ci>`  | `ci` trong CI, nếu không là `maintainer`                         | Vai trò được dùng khi `--credential-source convex`.                                                                   |

Mỗi lane thoát khác 0 khi có bất kỳ kịch bản nào thất bại. `--allow-failures` ghi artifact mà không đặt mã thoát thất bại.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Nhắm đến một nhóm Telegram riêng tư thật với hai bot riêng biệt (driver + SUT). Bot SUT phải có username Telegram; quan sát bot-to-bot hoạt động tốt nhất khi cả hai bot đã bật **Bot-to-Bot Communication Mode** trong `@BotFather`.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — id chat dạng số (chuỗi).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Tùy chọn:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` giữ phần thân tin nhắn trong artifact tin nhắn đã quan sát (mặc định che lại).

Kịch bản (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Artifact đầu ra:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — bao gồm RTT theo từng phản hồi (driver gửi → quan sát phản hồi SUT), bắt đầu từ canary.
- `telegram-qa-observed-messages.json` — phần thân được che lại trừ khi `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Nhắm đến một kênh guild Discord riêng tư thật với hai bot: một bot driver do harness điều khiển và một bot SUT do Gateway OpenClaw con khởi động thông qua Plugin Discord đi kèm. Xác minh xử lý nhắc đến trong kênh, rằng bot SUT đã đăng ký lệnh gốc `/help` với Discord, và các kịch bản bằng chứng Mantis bật theo tùy chọn.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — phải khớp với id người dùng bot SUT do Discord trả về (nếu không lane sẽ thất bại nhanh).

Tùy chọn:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` giữ phần thân tin nhắn trong artifact tin nhắn đã quan sát.

Kịch bản (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — kịch bản Mantis bật theo tùy chọn. Chạy riêng vì nó chuyển SUT sang phản hồi guild luôn bật, chỉ dùng công cụ với `messages.statusReactions.enabled=true`, rồi thu thập một timeline phản ứng REST cùng các artifact trực quan HTML/PNG. Báo cáo Mantis trước/sau cũng giữ các artifact MP4 do kịch bản cung cấp dưới dạng `baseline.mp4` và `candidate.mp4`.

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
- `discord-qa-observed-messages.json` — phần thân được che lại trừ khi `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` và `discord-status-reactions-tool-only-timeline.png` khi kịch bản phản ứng trạng thái chạy.

### QA Slack

```bash
pnpm openclaw qa slack
```

Nhắm đến một kênh Slack riêng tư thật với hai bot riêng biệt: một bot driver do harness điều khiển và một bot SUT do Gateway OpenClaw con khởi động thông qua Plugin Slack đi kèm.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Tùy chọn:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` giữ phần thân tin nhắn trong artifact tin nhắn đã quan sát.

Kịch bản (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Artifact đầu ra:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — phần thân được che lại trừ khi `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Thiết lập workspace Slack

Lane cần hai app Slack riêng biệt trong một workspace, cùng với một kênh mà cả hai bot đều là thành viên:

- `channelId` — id `Cxxxxxxxxxx` của kênh mà cả hai bot đã được mời vào. Dùng một kênh riêng; lane sẽ đăng trong mỗi lần chạy.
- `driverBotToken` — token bot (`xoxb-...`) của app **Driver**.
- `sutBotToken` — token bot (`xoxb-...`) của app **SUT**, app này phải là một app Slack tách biệt với driver để id người dùng bot của nó là riêng biệt.
- `sutAppToken` — token cấp app (`xapp-...`) của app SUT với `connections:write`, được Socket Mode dùng để app SUT có thể nhận sự kiện.

Ưu tiên dùng một workspace Slack dành riêng cho QA thay vì tái sử dụng workspace production.

Manifest SUT dưới đây phản chiếu cài đặt production của Plugin Slack đi kèm (`extensions/slack/src/setup-shared.ts:10`). Để xem cách thiết lập kênh production như người dùng nhìn thấy, xem [Thiết lập nhanh kênh Slack](/vi/channels/slack#quick-setup); cặp Driver/SUT QA được tách riêng có chủ ý vì lane cần hai id người dùng bot riêng biệt trong một workspace.

**1. Tạo app Driver**

Đi tới [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → chọn workspace QA, dán manifest sau, rồi _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

Sao chép _Bot User OAuth Token_ (`xoxb-...`) — token đó trở thành `driverBotToken`. Driver chỉ cần đăng tin nhắn và nhận diện chính nó; không có sự kiện, không có Socket Mode.

**2. Tạo app SUT**

Lặp lại _Create New App → From a manifest_ trong cùng workspace. Bộ scope phản chiếu cài đặt production của Plugin Slack đi kèm (`extensions/slack/src/setup-shared.ts:10`):

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Sau khi Slack tạo ứng dụng, thực hiện hai việc trên trang cài đặt của ứng dụng:

- _Cài đặt vào Workspace_ → sao chép _Mã thông báo OAuth người dùng bot_ → giá trị đó trở thành `sutBotToken`.
- _Thông tin cơ bản → Mã thông báo cấp ứng dụng → Tạo mã thông báo và phạm vi_ → thêm phạm vi `connections:write` → lưu → sao chép giá trị `xapp-...` → giá trị đó trở thành `sutAppToken`.

Xác minh hai bot có ID người dùng khác nhau bằng cách gọi `auth.test` trên từng mã thông báo. Runtime phân biệt driver và SUT theo ID người dùng; dùng lại một ứng dụng cho cả hai sẽ khiến kiểm soát mention thất bại ngay lập tức.

**3. Tạo kênh**

Trong workspace QA, tạo một kênh (ví dụ `#openclaw-qa`) và mời cả hai bot từ bên trong kênh:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Sao chép ID `Cxxxxxxxxxx` từ _thông tin kênh → Giới thiệu → ID kênh_ — giá trị đó trở thành `channelId`. Kênh công khai hoạt động được; nếu bạn dùng kênh riêng tư, cả hai ứng dụng đã có `groups:history` nên các lần đọc lịch sử của harness vẫn sẽ thành công.

**4. Đăng ký thông tin xác thực**

Có hai tùy chọn. Dùng biến môi trường để gỡ lỗi trên một máy (đặt bốn biến `OPENCLAW_QA_SLACK_*` và truyền `--credential-source env`), hoặc seed pool Convex dùng chung để CI và các maintainer khác có thể thuê chúng.

Với pool Convex, ghi bốn trường vào một tệp JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Khi đã export `OPENCLAW_QA_CONVEX_SITE_URL` và `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` trong shell của bạn, đăng ký và xác minh:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Kỳ vọng `count: 1`, `status: "active"`, không có trường `lease`.

**5. Xác minh đầu cuối**

Chạy lane cục bộ để xác nhận cả hai bot có thể nói chuyện với nhau thông qua broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Một lần chạy xanh hoàn tất trong chưa đến 30 giây và `slack-qa-report.md` hiển thị cả `slack-canary` và `slack-mention-gating` ở trạng thái `pass`. Nếu lane treo khoảng 90 giây và thoát với `Convex credential pool exhausted for kind "slack"`, thì pool đang trống hoặc mọi hàng đều đang được thuê — `qa credentials list --kind slack --status all --json` sẽ cho bạn biết trường hợp nào.

### Pool thông tin xác thực Convex

Các lane Telegram, Discord và Slack có thể thuê thông tin xác thực từ pool Convex dùng chung thay vì đọc các biến môi trường ở trên. Truyền `--credential-source convex` (hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab lấy một lease độc quyền, gửi Heartbeat cho lease đó trong suốt thời gian chạy, và giải phóng khi tắt. Các loại pool là `"telegram"`, `"discord"` và `"slack"`.

Các dạng payload mà broker xác thực trên `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` phải là chuỗi chat-id dạng số.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` phải khớp `^[A-Z][A-Z0-9]+$` (ID Slack như `Cxxxxxxxxxx`). Xem [Thiết lập workspace Slack](#setting-up-the-slack-workspace) để cấp phát ứng dụng và phạm vi.

Các biến môi trường vận hành và hợp đồng endpoint broker Convex nằm trong [Kiểm thử → Thông tin xác thực Telegram dùng chung qua Convex](/vi/help/testing#shared-telegram-credentials-via-convex-v1) (tên phần có trước hỗ trợ Discord; ngữ nghĩa broker giống hệt cho cả hai loại).

## Seed được hỗ trợ bởi repo

Tài sản seed nằm trong `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Các tệp này cố ý nằm trong git để kế hoạch QA hiển thị cho cả con người và agent.

`qa-lab` nên tiếp tục là runner markdown chung. Mỗi tệp markdown kịch bản là nguồn sự thật cho một lần chạy kiểm thử và nên định nghĩa:

- siêu dữ liệu kịch bản
- siêu dữ liệu danh mục, năng lực, lane và rủi ro tùy chọn
- tham chiếu tài liệu và mã
- yêu cầu Plugin tùy chọn
- bản vá cấu hình Gateway tùy chọn
- `qa-flow` có thể thực thi

Bề mặt runtime tái sử dụng hỗ trợ `qa-flow` được phép giữ tính chung và xuyên suốt. Ví dụ, các kịch bản markdown có thể kết hợp helper phía transport với helper phía trình duyệt điều khiển Control UI nhúng thông qua đường nối `browser.request` của Gateway mà không thêm runner trường hợp đặc biệt.

Các tệp kịch bản nên được nhóm theo năng lực sản phẩm thay vì thư mục cây nguồn. Giữ ID kịch bản ổn định khi di chuyển tệp; dùng `docsRefs` và `codeRefs` để truy vết triển khai.

Danh sách baseline nên đủ rộng để bao phủ:

- DM và chat kênh
- hành vi thread
- vòng đời hành động tin nhắn
- callback cron
- truy hồi bộ nhớ
- chuyển đổi model
- chuyển giao subagent
- đọc repo và đọc tài liệu
- một tác vụ build nhỏ như Lobster Invaders

## Các lane mock provider

`qa suite` có hai lane mock provider cục bộ:

- `mock-openai` là mock OpenClaw nhận biết kịch bản. Nó vẫn là lane mock xác định mặc định cho QA dựa trên repo và các cổng parity.
- `aimock` khởi động một máy chủ provider dựa trên AIMock cho phạm vi giao thức, fixture, ghi/phát lại và chaos thử nghiệm. Nó mang tính bổ sung và không thay thế dispatcher kịch bản `mock-openai`.

Triển khai provider-lane nằm dưới `extensions/qa-lab/src/providers/`. Mỗi provider sở hữu mặc định, khởi động máy chủ cục bộ, cấu hình model Gateway, nhu cầu staging auth-profile và cờ năng lực live/mock của riêng mình. Mã suite và Gateway dùng chung nên định tuyến qua registry provider thay vì rẽ nhánh theo tên provider.

## Bộ điều hợp transport

`qa-lab` sở hữu một đường nối transport chung cho các kịch bản QA markdown. `qa-channel` là bộ điều hợp đầu tiên trên đường nối đó, nhưng mục tiêu thiết kế rộng hơn: các kênh thực hoặc tổng hợp trong tương lai nên cắm vào cùng runner suite thay vì thêm runner QA riêng theo transport.

Ở cấp kiến trúc, phần tách biệt là:

- `qa-lab` sở hữu thực thi kịch bản chung, concurrency worker, ghi artifact và báo cáo.
- Bộ điều hợp transport sở hữu cấu hình Gateway, trạng thái sẵn sàng, quan sát inbound và outbound, hành động transport và trạng thái transport đã chuẩn hóa.
- Các tệp kịch bản markdown dưới `qa/scenarios/` định nghĩa lần chạy kiểm thử; `qa-lab` cung cấp bề mặt runtime tái sử dụng để thực thi chúng.

### Thêm một kênh

Thêm một kênh vào hệ thống QA markdown yêu cầu đúng hai thứ:

1. Một bộ điều hợp transport cho kênh.
2. Một gói kịch bản kiểm tra hợp đồng kênh.

Không thêm gốc lệnh QA cấp cao mới khi host `qa-lab` dùng chung có thể sở hữu luồng.

`qa-lab` sở hữu cơ chế host dùng chung:

- gốc lệnh `openclaw qa`
- khởi động và teardown suite
- concurrency worker
- ghi artifact
- tạo báo cáo
- thực thi kịch bản
- alias tương thích cho các kịch bản `qa-channel` cũ hơn

Các Plugin runner sở hữu hợp đồng transport:

- cách `openclaw qa <runner>` được gắn dưới gốc `qa` dùng chung
- cách Gateway được cấu hình cho transport đó
- cách kiểm tra trạng thái sẵn sàng
- cách tiêm sự kiện inbound
- cách quan sát tin nhắn outbound
- cách hiển thị transcript và trạng thái transport đã chuẩn hóa
- cách thực thi các hành động dựa trên transport
- cách xử lý reset hoặc cleanup theo transport

Ngưỡng áp dụng tối thiểu cho một kênh mới:

1. Giữ `qa-lab` là chủ sở hữu của gốc `qa` dùng chung.
2. Triển khai runner transport trên đường nối host `qa-lab` dùng chung.
3. Giữ cơ chế theo transport bên trong Plugin runner hoặc channel harness.
4. Gắn runner dưới dạng `openclaw qa <runner>` thay vì đăng ký một lệnh gốc cạnh tranh. Các Plugin runner nên khai báo `qaRunners` trong `openclaw.plugin.json` và export mảng `qaRunnerCliRegistrations` tương ứng từ `runtime-api.ts`. Giữ `runtime-api.ts` gọn nhẹ; CLI lazy và thực thi runner nên nằm sau các entrypoint riêng.
5. Viết hoặc điều chỉnh kịch bản markdown dưới các thư mục `qa/scenarios/` theo chủ đề.
6. Dùng các helper kịch bản chung cho kịch bản mới.
7. Giữ các alias tương thích hiện có hoạt động trừ khi repo đang thực hiện một migration có chủ ý.

Quy tắc quyết định rất nghiêm ngặt:

- Nếu hành vi có thể được biểu đạt một lần trong `qa-lab`, hãy đặt nó trong `qa-lab`.
- Nếu hành vi phụ thuộc vào một transport kênh, hãy giữ nó trong Plugin runner hoặc plugin harness đó.
- Nếu một kịch bản cần năng lực mới mà nhiều hơn một kênh có thể dùng, hãy thêm helper chung thay vì một nhánh riêng theo kênh trong `suite.ts`.
- Nếu một hành vi chỉ có ý nghĩa với một transport, hãy giữ kịch bản theo transport và nêu rõ điều đó trong hợp đồng kịch bản.

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

Các alias tương thích vẫn khả dụng cho kịch bản hiện có — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — nhưng việc viết kịch bản mới nên dùng tên chung. Các alias tồn tại để tránh migration đồng loạt trong một thời điểm, không phải là mô hình về sau.

## Báo cáo

`qa-lab` export báo cáo giao thức Markdown từ dòng thời gian bus đã quan sát.
Báo cáo nên trả lời:

- Những gì đã hoạt động
- Những gì đã thất bại
- Những gì vẫn bị chặn
- Những kịch bản tiếp theo đáng thêm vào

Để xem inventory các kịch bản khả dụng — hữu ích khi ước lượng công việc tiếp theo hoặc nối một transport mới — chạy `pnpm openclaw qa coverage` (thêm `--json` để có đầu ra máy đọc được).

Để kiểm tra ký tự và phong cách, chạy cùng một kịch bản trên nhiều ref model live và ghi báo cáo Markdown đã được đánh giá:

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

Lệnh này chạy các tiến trình con Gateway QA cục bộ, không phải Docker. Các kịch bản đánh giá nhân vật nên đặt persona thông qua `SOUL.md`, rồi chạy các lượt người dùng thông thường như trò chuyện, trợ giúp trong workspace và các tác vụ tệp nhỏ. Không nên cho mô hình ứng viên biết rằng nó đang được đánh giá. Lệnh giữ lại từng bản ghi hội thoại đầy đủ, ghi các thống kê chạy cơ bản, rồi yêu cầu các mô hình giám khảo ở chế độ nhanh với suy luận `xhigh` khi được hỗ trợ để xếp hạng các lượt chạy theo độ tự nhiên, cảm giác và sự hài hước.
Sử dụng `--blind-judge-models` khi so sánh các nhà cung cấp: prompt của giám khảo vẫn nhận mọi bản ghi hội thoại và trạng thái chạy, nhưng các tham chiếu ứng viên được thay bằng nhãn trung lập như `candidate-01`; báo cáo ánh xạ thứ hạng trở lại các tham chiếu thật sau khi phân tích cú pháp.
Các lượt chạy ứng viên mặc định dùng mức suy nghĩ `high`, với `medium` cho GPT-5.5 và `xhigh` cho các tham chiếu đánh giá OpenAI cũ hơn có hỗ trợ. Ghi đè một ứng viên cụ thể trực tiếp bằng `--model provider/model,thinking=<level>`. `--thinking <level>` vẫn đặt giá trị dự phòng toàn cục, và dạng cũ hơn `--model-thinking <provider/model=level>` được giữ để tương thích.
Các tham chiếu ứng viên OpenAI mặc định dùng chế độ nhanh để sử dụng xử lý ưu tiên ở nơi nhà cung cấp hỗ trợ. Thêm `,fast`, `,no-fast` hoặc `,fast=false` trực tiếp khi một ứng viên hoặc giám khảo riêng lẻ cần ghi đè. Chỉ truyền `--fast` khi bạn muốn buộc bật chế độ nhanh cho mọi mô hình ứng viên. Thời lượng của ứng viên và giám khảo đều được ghi trong báo cáo để phân tích benchmark, nhưng prompt của giám khảo nêu rõ không xếp hạng theo tốc độ.
Các lượt chạy mô hình ứng viên và giám khảo đều mặc định có concurrency 16. Giảm `--concurrency` hoặc `--judge-concurrency` khi giới hạn của nhà cung cấp hoặc áp lực Gateway cục bộ khiến lượt chạy quá nhiễu.
Khi không truyền ứng viên `--model`, đánh giá nhân vật mặc định dùng `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`, `moonshot/kimi-k2.5` và `google/gemini-3.1-pro-preview` khi không truyền `--model`.
Khi không truyền `--judge-model`, các giám khảo mặc định là `openai/gpt-5.5,thinking=xhigh,fast` và `anthropic/claude-opus-4-6,thinking=high`.

## Tài liệu liên quan

- [Matrix QA](/vi/concepts/qa-matrix)
- [Kênh QA](/vi/channels/qa-channel)
- [Kiểm thử](/vi/help/testing)
- [Bảng điều khiển](/vi/web/dashboard)
