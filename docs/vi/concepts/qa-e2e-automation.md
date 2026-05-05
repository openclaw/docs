---
read_when:
    - Hiểu cách ngăn xếp QA phối hợp với nhau
    - Mở rộng qa-lab, qa-channel hoặc bộ điều hợp truyền tải
    - Thêm các kịch bản QA dựa trên repo
    - Xây dựng tự động hóa đảm bảo chất lượng với độ chân thực cao hơn cho bảng điều khiển Gateway
summary: 'Tổng quan về stack QA: qa-lab, qa-channel, các kịch bản dựa trên kho mã, các lane truyền tải trực tiếp, bộ điều hợp truyền tải và báo cáo.'
title: Tổng quan về QA
x-i18n:
    generated_at: "2026-05-05T01:45:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83adbe934d73265a1b47ee463c98fdd3eddfb1cd063d3a46a83dfc7568df0a96
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Ngăn xếp QA riêng tư nhằm kiểm thử OpenClaw theo cách thực tế hơn,
gần với hình dạng kênh hơn so với một kiểm thử đơn vị riêng lẻ.

Các phần hiện tại:

- `extensions/qa-channel`: kênh tin nhắn tổng hợp với các bề mặt DM, kênh, luồng,
  phản ứng, chỉnh sửa và xóa.
- `extensions/qa-lab`: giao diện trình gỡ lỗi và bus QA để quan sát bản ghi hội thoại,
  chèn tin nhắn đến và xuất báo cáo Markdown.
- `extensions/qa-matrix`, các Plugin runner trong tương lai: bộ chuyển đổi truyền tải trực tiếp
  điều khiển một kênh thực bên trong một QA gateway con.
- `qa/`: tài sản seed dựa trên repo cho tác vụ khởi động và các kịch bản QA
  đường cơ sở.
- [Mantis](/vi/concepts/mantis): xác minh trực tiếp trước và sau cho các lỗi
  cần truyền tải thực, ảnh chụp màn hình trình duyệt, trạng thái VM và bằng chứng PR.

## Bề mặt lệnh

Mọi luồng QA chạy dưới `pnpm openclaw qa <subcommand>`. Nhiều luồng có bí danh script `pnpm qa:*`;
cả hai dạng đều được hỗ trợ.

| Lệnh                                                | Mục đích                                                                                                                                                                                     |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Tự kiểm tra QA đóng gói; ghi báo cáo Markdown.                                                                                                                                              |
| `qa suite`                                          | Chạy các kịch bản dựa trên repo đối với làn QA gateway. Bí danh: `pnpm openclaw qa suite --runner multipass` cho một VM Linux dùng một lần.                                                 |
| `qa coverage`                                       | In kiểm kê phạm vi kịch bản dạng markdown (`--json` cho đầu ra máy).                                                                                                                        |
| `qa parity-report`                                  | So sánh hai tệp `qa-suite-summary.json` và ghi báo cáo parity tác tử.                                                                                                                       |
| `qa character-eval`                                 | Chạy kịch bản QA nhân vật trên nhiều mô hình trực tiếp với một báo cáo được chấm. Xem [Báo cáo](#reporting).                                                                                |
| `qa manual`                                         | Chạy một prompt một lần đối với làn nhà cung cấp/mô hình đã chọn.                                                                                                                           |
| `qa ui`                                             | Khởi động giao diện trình gỡ lỗi QA và bus QA cục bộ (bí danh: `pnpm qa:lab:ui`).                                                                                                           |
| `qa docker-build-image`                             | Xây dựng image Docker QA dựng sẵn.                                                                                                                                                          |
| `qa docker-scaffold`                                | Ghi scaffold docker-compose cho bảng điều khiển QA + làn Gateway.                                                                                                                          |
| `qa up`                                             | Xây dựng trang QA, khởi động ngăn xếp dựa trên Docker, in URL (bí danh: `pnpm qa:lab:up`; biến thể `:fast` thêm `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                     |
| `qa aimock`                                         | Chỉ khởi động máy chủ nhà cung cấp AIMock.                                                                                                                                                  |
| `qa mock-openai`                                    | Chỉ khởi động máy chủ nhà cung cấp `mock-openai` có nhận biết kịch bản.                                                                                                                     |
| `qa credentials doctor` / `add` / `list` / `remove` | Quản lý nhóm thông tin xác thực Convex dùng chung.                                                                                                                                          |
| `qa matrix`                                         | Làn truyền tải trực tiếp đối với một homeserver Tuwunel dùng một lần. Xem [Matrix QA](/vi/concepts/qa-matrix).                                                                                |
| `qa telegram`                                       | Làn truyền tải trực tiếp đối với một nhóm Telegram riêng tư thực.                                                                                                                           |
| `qa discord`                                        | Làn truyền tải trực tiếp đối với một kênh guild Discord riêng tư thực.                                                                                                                      |
| `qa slack`                                          | Làn truyền tải trực tiếp đối với một kênh Slack riêng tư thực.                                                                                                                              |
| `qa mantis`                                         | Runner xác minh trước và sau cho lỗi truyền tải trực tiếp, với bằng chứng phản ứng trạng thái Discord, smoke desktop/trình duyệt Crabbox và smoke Slack-in-VNC. Xem [Mantis](/vi/concepts/mantis). |

## Luồng vận hành

Luồng vận hành QA hiện tại là một trang QA hai khung:

- Trái: bảng điều khiển Gateway (Giao diện điều khiển) với tác tử.
- Phải: QA Lab, hiển thị bản ghi hội thoại kiểu Slack và kế hoạch kịch bản.

Chạy bằng:

```bash
pnpm qa:lab:up
```

Lệnh đó xây dựng trang QA, khởi động làn Gateway dựa trên Docker và hiển thị
trang QA Lab, nơi một người vận hành hoặc vòng lặp tự động hóa có thể giao cho tác tử một
nhiệm vụ QA, quan sát hành vi kênh thực và ghi lại điều gì đã hoạt động, thất bại hoặc
vẫn bị chặn.

Để lặp giao diện QA Lab cục bộ nhanh hơn mà không cần xây dựng lại image Docker mỗi lần,
hãy khởi động ngăn xếp với gói QA Lab được bind-mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` giữ các dịch vụ Docker trên một image dựng sẵn và bind-mount
`extensions/qa-lab/web/dist` vào container `qa-lab`. `qa:lab:watch`
xây dựng lại gói đó khi có thay đổi, và trình duyệt tự động tải lại khi hash tài sản QA Lab
thay đổi.

Để chạy smoke trace OpenTelemetry cục bộ, chạy:

```bash
pnpm qa:otel:smoke
```

Script đó khởi động một bộ nhận trace OTLP/HTTP cục bộ, chạy
kịch bản QA `otel-trace-smoke` với Plugin `diagnostics-otel` được bật, sau đó
giải mã các span protobuf đã xuất và khẳng định hình dạng quan trọng cho phát hành:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` và `openclaw.message.delivery` phải có mặt;
các lệnh gọi mô hình không được xuất `StreamAbandoned` trong các lượt thành công; ID chẩn đoán thô và
thuộc tính `openclaw.content.*` phải nằm ngoài trace. Nó ghi
`otel-smoke-summary.json` bên cạnh các artifact của bộ QA.

QA khả năng quan sát chỉ áp dụng cho checkout mã nguồn. Tarball npm cố ý bỏ qua
QA Lab, vì vậy các làn phát hành Docker của gói không chạy lệnh `qa`. Dùng
`pnpm qa:otel:smoke` từ một checkout mã nguồn đã xây dựng khi thay đổi instrumentation
chẩn đoán.

Để chạy làn smoke Matrix với truyền tải thực, chạy:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Tham chiếu CLI đầy đủ, danh mục hồ sơ/kịch bản, biến môi trường và bố cục artifact cho làn này nằm trong [Matrix QA](/vi/concepts/qa-matrix). Tóm tắt: nó cấp phát một homeserver Tuwunel dùng một lần trong Docker, đăng ký người dùng driver/SUT/observer tạm thời, chạy Plugin Matrix thực bên trong một QA gateway con được giới hạn cho truyền tải đó (không có `qa-channel`), rồi ghi báo cáo Markdown, tóm tắt JSON, artifact sự kiện quan sát được và nhật ký đầu ra kết hợp dưới `.artifacts/qa-e2e/matrix-<timestamp>/`.

Để chạy các làn smoke Telegram, Discord và Slack với truyền tải thực:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Chúng nhắm đến một kênh thực đã tồn tại với hai bot (driver + SUT). Các biến môi trường bắt buộc, danh sách kịch bản, artifact đầu ra và nhóm thông tin xác thực Convex được ghi tài liệu trong [Tham chiếu QA Telegram, Discord và Slack](#telegram-discord-and-slack-qa-reference) bên dưới.

Để chạy đầy đủ VM desktop Slack với VNC cứu hộ, chạy:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Lệnh đó thuê một máy desktop/trình duyệt Crabbox, chạy làn Slack trực tiếp
bên trong VM, mở Slack Web trong trình duyệt VNC, chụp desktop và
sao chép `slack-qa/` cùng `slack-desktop-smoke.png` về thư mục artifact Mantis.
Tái sử dụng `--lease-id <cbx_...>` sau khi đăng nhập vào Slack Web thủ công
thông qua VNC. Với `--gateway-setup`, Mantis để lại một Gateway Slack OpenClaw
bền vững đang chạy bên trong VM trên cổng `38973`; nếu không có tùy chọn đó, lệnh chạy
làn QA Slack bot-đến-bot bình thường và thoát sau khi chụp artifact.

Trước khi dùng thông tin xác thực trực tiếp trong nhóm, chạy:

```bash
pnpm openclaw qa credentials doctor
```

Doctor kiểm tra env broker Convex, xác thực thiết lập endpoint và xác minh khả năng truy cập admin/list khi có secret maintainer. Nó chỉ báo cáo trạng thái đã đặt/thiếu cho secret.

## Phạm vi truyền tải trực tiếp

Các làn truyền tải trực tiếp dùng chung một hợp đồng thay vì mỗi làn tự phát minh hình dạng danh sách kịch bản riêng. `qa-channel` là bộ hành vi sản phẩm tổng hợp rộng và không thuộc ma trận phạm vi truyền tải trực tiếp.

| Làn      | Canary | Chặn theo mention | Bot-đến-bot | Chặn allowlist | Trả lời cấp cao nhất | Tiếp tục sau khởi động lại | Theo dõi luồng | Cô lập luồng | Quan sát phản ứng | Lệnh trợ giúp | Đăng ký lệnh native |
| -------- | ------ | ----------------- | ----------- | -------------- | -------------------- | -------------------------- | -------------- | ------------ | ----------------- | ------------ | ------------------- |
| Matrix   | x      | x                 | x           | x              | x                    | x                          | x              | x            | x                 |              |                     |
| Telegram | x      | x                 | x           |                |                      |                            |                |              |                   | x            |                     |
| Discord  | x      | x                 | x           |                |                      |                            |                |              |                   |              | x                   |
| Slack    | x      | x                 | x           |                |                      |                            |                |              |                   |              |                     |

Điều này giữ `qa-channel` là bộ hành vi sản phẩm rộng trong khi Matrix,
Telegram và các truyền tải trực tiếp trong tương lai dùng chung một checklist
hợp đồng truyền tải rõ ràng.

Để chạy làn VM Linux dùng một lần mà không đưa Docker vào đường dẫn QA, chạy:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Thao tác này khởi động một guest Multipass mới, cài đặt các phụ thuộc, build OpenClaw
bên trong guest, chạy `qa suite`, rồi sao chép báo cáo QA thông thường và
bản tóm tắt trở lại `.artifacts/qa-e2e/...` trên host.
Nó tái sử dụng cùng hành vi chọn kịch bản như `qa suite` trên host.
Các lần chạy bộ kiểm thử trên host và Multipass thực thi song song nhiều kịch bản đã chọn
với các worker Gateway tách biệt theo mặc định. `qa-channel` mặc định concurrency
4, bị giới hạn bởi số lượng kịch bản đã chọn. Dùng `--concurrency <count>` để tinh chỉnh
số lượng worker, hoặc `--concurrency 1` để thực thi tuần tự.
Lệnh thoát với mã khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi
bạn muốn có hiện vật mà không có mã thoát thất bại.
Các lần chạy live chuyển tiếp các đầu vào xác thực QA được hỗ trợ và thực tế cho
guest: khóa provider dựa trên env, đường dẫn cấu hình provider live QA, và
`CODEX_HOME` khi có. Giữ `--output-dir` dưới thư mục gốc repo để guest
có thể ghi ngược lại qua workspace đã mount.

## Tham chiếu QA cho Telegram, Discord và Slack

Matrix có một [trang riêng](/vi/concepts/qa-matrix) vì số lượng kịch bản và việc cấp phát homeserver dựa trên Docker. Telegram, Discord và Slack nhỏ hơn — mỗi kênh chỉ có một vài kịch bản, không có hệ thống hồ sơ, chạy với các kênh thực đã tồn tại — nên phần tham chiếu của chúng nằm ở đây.

### Cờ CLI dùng chung

Các lane này đăng ký qua `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` và chấp nhận cùng các cờ:

| Cờ                                    | Mặc định                                                        | Mô tả                                                                                                                 |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Chỉ chạy kịch bản này. Có thể lặp lại.                                                                               |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Nơi ghi báo cáo/tóm tắt/tin nhắn quan sát được và log đầu ra. Đường dẫn tương đối được resolve theo `--repo-root`.   |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Thư mục gốc repository khi gọi từ một cwd trung lập.                                                                  |
| `--sut-account <id>`                  | `sut`                                                           | Id tài khoản tạm thời bên trong cấu hình Gateway QA.                                                                  |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` hoặc `live-frontier` (`live-openai` cũ vẫn hoạt động).                                                  |
| `--model <ref>` / `--alt-model <ref>` | mặc định của provider                                           | Tham chiếu model chính/phụ.                                                                                           |
| `--fast`                              | tắt                                                             | Chế độ nhanh của provider khi được hỗ trợ.                                                                            |
| `--credential-source <env\|convex>`   | `env`                                                           | Xem [pool thông tin đăng nhập Convex](#convex-credential-pool).                                                       |
| `--credential-role <maintainer\|ci>`  | `ci` trong CI, nếu không là `maintainer`                        | Vai trò được dùng khi `--credential-source convex`.                                                                   |

Mỗi lane thoát với mã khác 0 khi có bất kỳ kịch bản nào thất bại. `--allow-failures` ghi hiện vật mà không đặt mã thoát thất bại.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Nhắm tới một nhóm Telegram riêng tư thực với hai bot riêng biệt (driver + SUT). Bot SUT phải có username Telegram; việc quan sát bot-với-bot hoạt động tốt nhất khi cả hai bot đều bật **Bot-to-Bot Communication Mode** trong `@BotFather`.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — id chat dạng số (chuỗi).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Tùy chọn:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` giữ phần thân tin nhắn trong các hiện vật tin nhắn quan sát được (mặc định biên tập lại).

Kịch bản (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

Hiện vật đầu ra:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — bao gồm RTT theo từng phản hồi (driver gửi → quan sát được phản hồi SUT) bắt đầu từ canary.
- `telegram-qa-observed-messages.json` — phần thân bị biên tập lại trừ khi `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Nhắm tới một kênh guild Discord riêng tư thực với hai bot: bot driver do harness điều khiển và bot SUT được khởi động bởi Gateway OpenClaw con thông qua Plugin Discord đi kèm. Xác minh xử lý mention trong kênh, rằng bot SUT đã đăng ký lệnh gốc `/help` với Discord, và các kịch bản bằng chứng Mantis opt-in.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — phải khớp với id người dùng bot SUT do Discord trả về (nếu không lane sẽ thất bại nhanh).

Tùy chọn:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` giữ phần thân tin nhắn trong các hiện vật tin nhắn quan sát được.

Kịch bản (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — kịch bản Mantis opt-in. Tự chạy riêng vì nó chuyển SUT sang chế độ luôn bật, chỉ dùng công cụ để trả lời trong guild với `messages.statusReactions.enabled=true`, rồi ghi lại timeline reaction REST cùng một hiện vật trực quan HTML/PNG.

Chạy kịch bản reaction trạng thái Mantis một cách tường minh:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Hiện vật đầu ra:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — phần thân bị biên tập lại trừ khi `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` và `discord-status-reactions-tool-only-timeline.png` khi kịch bản reaction trạng thái chạy.

### QA Slack

```bash
pnpm openclaw qa slack
```

Nhắm tới một kênh Slack riêng tư thực với hai bot riêng biệt: bot driver do harness điều khiển và bot SUT được khởi động bởi Gateway OpenClaw con thông qua Plugin Slack đi kèm.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Tùy chọn:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` giữ phần thân tin nhắn trong các hiện vật tin nhắn quan sát được.

Kịch bản (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Hiện vật đầu ra:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — phần thân bị biên tập lại trừ khi `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Thiết lập workspace Slack

Lane cần hai app Slack riêng biệt trong một workspace, cùng với một kênh mà cả hai bot đều là thành viên:

- `channelId` — id `Cxxxxxxxxxx` của kênh mà cả hai bot đã được mời vào. Dùng một kênh chuyên dụng; lane sẽ đăng bài ở mỗi lần chạy.
- `driverBotToken` — token bot (`xoxb-...`) của app **Driver**.
- `sutBotToken` — token bot (`xoxb-...`) của app **SUT**, phải là một app Slack riêng với driver để id người dùng bot của nó là riêng biệt.
- `sutAppToken` — token cấp app (`xapp-...`) của app SUT với `connections:write`, được Socket Mode dùng để app SUT có thể nhận sự kiện.

Ưu tiên một workspace Slack dành riêng cho QA hơn là tái sử dụng workspace production.

Manifest SUT bên dưới phản ánh bản cài production của Plugin Slack đi kèm (`extensions/slack/src/setup-shared.ts:10`). Để xem thiết lập kênh production như người dùng thấy, xem [thiết lập nhanh kênh Slack](/vi/channels/slack#quick-setup); cặp Driver/SUT QA được tách riêng có chủ ý vì lane cần hai id người dùng bot riêng biệt trong một workspace.

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

Sao chép _Bot User OAuth Token_ (`xoxb-...`) — token đó trở thành `driverBotToken`. Driver chỉ cần đăng tin nhắn và tự định danh; không cần sự kiện, không cần Socket Mode.

**2. Tạo app SUT**

Lặp lại _Create New App → From a manifest_ trong cùng workspace. Bộ scope phản ánh bản cài production của Plugin Slack đi kèm (`extensions/slack/src/setup-shared.ts:10`):

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

Sau khi Slack tạo app, thực hiện hai việc trên trang cài đặt của app:

- _Install to Workspace_ → sao chép _Bot User OAuth Token_ → token đó trở thành `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → thêm scope `connections:write` → lưu → sao chép giá trị `xapp-...` → giá trị đó trở thành `sutAppToken`.

Xác minh hai bot có id người dùng riêng biệt bằng cách gọi `auth.test` trên từng token. Runtime phân biệt driver và SUT theo id người dùng; dùng lại một app cho cả hai sẽ khiến mention-gating thất bại ngay lập tức.

**3. Tạo kênh**

Trong workspace QA, tạo một kênh (ví dụ `#openclaw-qa`) và mời cả hai bot từ bên trong kênh:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Sao chép id `Cxxxxxxxxxx` từ _channel info → About → Channel ID_ — id đó trở thành `channelId`. Kênh công khai dùng được; nếu bạn dùng kênh riêng tư thì cả hai app đã có `groups:history`, nên các lần đọc lịch sử của harness vẫn sẽ thành công.

**4. Đăng ký thông tin xác thực**

Có hai tùy chọn. Dùng biến môi trường để gỡ lỗi trên một máy (đặt bốn biến `OPENCLAW_QA_SLACK_*` và truyền `--credential-source env`), hoặc seed pool Convex dùng chung để CI và các maintainer khác có thể thuê chúng.

Đối với pool Convex, ghi bốn trường vào một tệp JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Với `OPENCLAW_QA_CONVEX_SITE_URL` và `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` được export trong shell của bạn, đăng ký và xác minh:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Kỳ vọng `count: 1`, `status: "active"`, không có trường `lease`.

**5. Xác minh end to end**

Chạy lane cục bộ để xác nhận cả hai bot có thể nói chuyện với nhau qua broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Một lần chạy xanh hoàn tất trong chưa đến 30 giây và `slack-qa-report.md` hiển thị cả `slack-canary` và `slack-mention-gating` ở trạng thái `pass`. Nếu lane treo khoảng 90 giây rồi thoát với `Convex credential pool exhausted for kind "slack"`, thì pool đang trống hoặc mọi hàng đều đã được thuê — `qa credentials list --kind slack --status all --json` sẽ cho bạn biết trường hợp nào.

### Pool thông tin xác thực Convex

Các lane Telegram, Discord và Slack có thể thuê thông tin xác thực từ pool Convex dùng chung thay vì đọc các biến môi trường ở trên. Truyền `--credential-source convex` (hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab lấy một lease độc quyền, heartbeat lease đó trong suốt thời gian chạy, và giải phóng khi tắt. Các loại pool là `"telegram"`, `"discord"` và `"slack"`.

Các dạng payload mà broker xác thực trên `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` phải là chuỗi chat-id dạng số.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` phải khớp `^[A-Z][A-Z0-9]+$` (một id Slack như `Cxxxxxxxxxx`). Xem [Thiết lập workspace Slack](#setting-up-the-slack-workspace) để cấp phát app và scope.

Các biến môi trường vận hành và hợp đồng endpoint của broker Convex nằm trong [Kiểm thử → Thông tin xác thực Telegram dùng chung qua Convex](/vi/help/testing#shared-telegram-credentials-via-convex-v1) (tên phần có trước khi hỗ trợ Discord; ngữ nghĩa broker giống hệt cho cả hai loại).

## Seed được repo hậu thuẫn

Tài sản seed nằm trong `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Chúng được đưa vào git có chủ ý để kế hoạch QA hiển thị với cả con người lẫn
agent.

`qa-lab` nên tiếp tục là một runner markdown chung. Mỗi tệp markdown scenario là
nguồn sự thật cho một lần chạy kiểm thử và nên định nghĩa:

- metadata scenario
- metadata danh mục, capability, lane và rủi ro tùy chọn
- tham chiếu tài liệu và mã
- yêu cầu plugin tùy chọn
- bản vá cấu hình gateway tùy chọn
- `qa-flow` có thể thực thi

Bề mặt runtime tái sử dụng đứng sau `qa-flow` được phép tiếp tục là chung
và xuyên suốt. Ví dụ, các scenario markdown có thể kết hợp helper phía transport
với helper phía trình duyệt điều khiển Control UI nhúng qua đường nối
Gateway `browser.request` mà không thêm runner theo trường hợp đặc biệt.

Các tệp scenario nên được nhóm theo capability sản phẩm thay vì thư mục
cây nguồn. Giữ ổn định ID scenario khi di chuyển tệp; dùng `docsRefs` và `codeRefs`
để truy vết triển khai.

Danh sách baseline nên đủ rộng để bao phủ:

- chat DM và kênh
- hành vi thread
- vòng đời hành động tin nhắn
- callback cron
- truy hồi bộ nhớ
- chuyển đổi model
- bàn giao subagent
- đọc repo và đọc tài liệu
- một tác vụ build nhỏ như Lobster Invaders

## Lane mock provider

`qa suite` có hai lane mock provider cục bộ:

- `mock-openai` là mock OpenClaw nhận biết scenario. Nó vẫn là lane mock
  xác định mặc định cho QA dựa trên repo và parity gate.
- `aimock` khởi động một provider server dựa trên AIMock cho phạm vi protocol,
  fixture, record/replay và chaos thử nghiệm. Nó là phần bổ sung và không
  thay thế bộ điều phối scenario `mock-openai`.

Triển khai provider-lane nằm dưới `extensions/qa-lab/src/providers/`.
Mỗi provider sở hữu mặc định của mình, khởi động server cục bộ, cấu hình model gateway,
nhu cầu staging auth-profile, và cờ capability live/mock. Mã suite và
gateway dùng chung nên định tuyến qua registry provider thay vì rẽ nhánh theo
tên provider.

## Bộ điều hợp transport

`qa-lab` sở hữu một seam transport chung cho các scenario QA markdown. `qa-channel` là bộ điều hợp đầu tiên trên seam đó, nhưng mục tiêu thiết kế rộng hơn: các kênh thật hoặc tổng hợp trong tương lai nên cắm vào cùng suite runner thay vì thêm một QA runner riêng cho transport.

Ở cấp kiến trúc, phần tách là:

- `qa-lab` sở hữu thực thi scenario chung, concurrency của worker, ghi artifact và báo cáo.
- Bộ điều hợp transport sở hữu cấu hình gateway, readiness, quan sát inbound và outbound, hành động transport, và trạng thái transport đã chuẩn hóa.
- Các tệp scenario Markdown dưới `qa/scenarios/` định nghĩa lần chạy kiểm thử; `qa-lab` cung cấp bề mặt runtime tái sử dụng để thực thi chúng.

### Thêm một kênh

Thêm một kênh vào hệ thống QA markdown yêu cầu đúng hai việc:

1. Một bộ điều hợp transport cho kênh.
2. Một gói scenario kiểm tra hợp đồng của kênh.

Không thêm một root lệnh QA cấp cao mới khi host `qa-lab` dùng chung có thể sở hữu flow.

`qa-lab` sở hữu cơ chế host dùng chung:

- root lệnh `openclaw qa`
- khởi động và teardown suite
- concurrency của worker
- ghi artifact
- tạo báo cáo
- thực thi scenario
- alias tương thích cho các scenario `qa-channel` cũ hơn

Runner plugin sở hữu hợp đồng transport:

- cách `openclaw qa <runner>` được mount bên dưới root `qa` dùng chung
- cách gateway được cấu hình cho transport đó
- cách readiness được kiểm tra
- cách sự kiện inbound được inject
- cách tin nhắn outbound được quan sát
- cách transcript và trạng thái transport đã chuẩn hóa được hiển thị
- cách các hành động dựa trên transport được thực thi
- cách reset hoặc dọn dẹp riêng cho transport được xử lý

Mức tối thiểu để tiếp nhận một kênh mới:

1. Giữ `qa-lab` là chủ sở hữu root `qa` dùng chung.
2. Triển khai transport runner trên seam host `qa-lab` dùng chung.
3. Giữ cơ chế riêng cho transport bên trong runner plugin hoặc channel harness.
4. Mount runner dưới dạng `openclaw qa <runner>` thay vì đăng ký một root command cạnh tranh. Runner plugin nên khai báo `qaRunners` trong `openclaw.plugin.json` và export mảng `qaRunnerCliRegistrations` tương ứng từ `runtime-api.ts`. Giữ `runtime-api.ts` nhẹ; CLI lazy và thực thi runner nên nằm sau các entrypoint riêng.
5. Tạo hoặc điều chỉnh các scenario markdown dưới các thư mục theo chủ đề `qa/scenarios/`.
6. Dùng helper scenario chung cho các scenario mới.
7. Giữ các alias tương thích hiện có hoạt động trừ khi repo đang thực hiện một migration có chủ ý.

Quy tắc quyết định rất nghiêm ngặt:

- Nếu hành vi có thể được biểu diễn một lần trong `qa-lab`, đặt nó trong `qa-lab`.
- Nếu hành vi phụ thuộc vào một transport kênh, giữ nó trong runner plugin hoặc plugin harness đó.
- Nếu một scenario cần capability mới mà nhiều hơn một kênh có thể dùng, thêm helper chung thay vì nhánh riêng cho kênh trong `suite.ts`.
- Nếu một hành vi chỉ có ý nghĩa với một transport, giữ scenario riêng cho transport và nêu rõ điều đó trong hợp đồng scenario.

### Tên helper scenario

Các helper chung được ưu tiên cho scenario mới:

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

Các alias tương thích vẫn có sẵn cho scenario hiện có — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — nhưng khi viết scenario mới nên dùng các tên chung. Các alias tồn tại để tránh một migration flag-day, không phải là mô hình về sau.

## Báo cáo

`qa-lab` export một báo cáo protocol Markdown từ timeline bus được quan sát.
Báo cáo nên trả lời:

- Điều gì đã hoạt động
- Điều gì đã thất bại
- Điều gì vẫn bị chặn
- Những scenario follow-up nào đáng thêm vào

Để xem inventory các scenario có sẵn — hữu ích khi ước lượng follow-up work hoặc nối dây một transport mới — chạy `pnpm openclaw qa coverage` (thêm `--json` để có đầu ra máy đọc được).

Để kiểm tra nhân vật và phong cách, chạy cùng scenario trên nhiều ref model live
và ghi một báo cáo Markdown đã được đánh giá:

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

Lệnh này chạy các tiến trình con Gateway QA cục bộ, không phải Docker. Các kịch bản đánh giá nhân vật nên đặt persona thông qua `SOUL.md`, rồi chạy các lượt người dùng thông thường như trò chuyện, trợ giúp workspace và các tác vụ tệp nhỏ. Không nên cho mô hình ứng viên biết rằng nó đang được đánh giá. Lệnh này giữ lại từng bản ghi cuộc hội thoại đầy đủ, ghi lại số liệu chạy cơ bản, rồi yêu cầu các mô hình giám khảo ở chế độ nhanh với suy luận `xhigh` khi được hỗ trợ để xếp hạng các lần chạy theo độ tự nhiên, vibe và tính hài hước.
Dùng `--blind-judge-models` khi so sánh các nhà cung cấp: prompt giám khảo vẫn nhận mọi bản ghi cuộc hội thoại và trạng thái chạy, nhưng tham chiếu ứng viên được thay bằng nhãn trung lập như `candidate-01`; báo cáo ánh xạ thứ hạng trở lại tham chiếu thật sau khi phân tích cú pháp.
Các lần chạy ứng viên mặc định dùng mức suy nghĩ `high`, với `medium` cho GPT-5.5 và `xhigh` cho các tham chiếu đánh giá OpenAI cũ hơn có hỗ trợ. Ghi đè một ứng viên cụ thể trực tiếp bằng `--model provider/model,thinking=<level>`. `--thinking <level>` vẫn đặt giá trị dự phòng toàn cục, và dạng cũ hơn `--model-thinking <provider/model=level>` được giữ để tương thích.
Tham chiếu ứng viên OpenAI mặc định dùng chế độ nhanh để sử dụng xử lý ưu tiên khi nhà cung cấp hỗ trợ. Thêm trực tiếp `,fast`, `,no-fast` hoặc `,fast=false` khi một ứng viên hoặc giám khảo riêng lẻ cần ghi đè. Chỉ truyền `--fast` khi bạn muốn buộc bật chế độ nhanh cho mọi mô hình ứng viên. Thời lượng của ứng viên và giám khảo đều được ghi trong báo cáo để phân tích benchmark, nhưng prompt giám khảo nêu rõ không xếp hạng theo tốc độ.
Các lần chạy mô hình ứng viên và giám khảo đều mặc định có concurrency 16. Giảm `--concurrency` hoặc `--judge-concurrency` khi giới hạn của nhà cung cấp hoặc áp lực lên Gateway cục bộ khiến lần chạy quá nhiễu.
Khi không truyền ứng viên `--model`, đánh giá nhân vật mặc định dùng
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` và
`google/gemini-3.1-pro-preview` khi không truyền `--model`.
Khi không truyền `--judge-model`, các giám khảo mặc định dùng
`openai/gpt-5.5,thinking=xhigh,fast` và
`anthropic/claude-opus-4-6,thinking=high`.

## Tài liệu liên quan

- [QA ma trận](/vi/concepts/qa-matrix)
- [Kênh QA](/vi/channels/qa-channel)
- [Kiểm thử](/vi/help/testing)
- [Bảng điều khiển](/vi/web/dashboard)
