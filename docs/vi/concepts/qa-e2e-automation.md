---
read_when:
    - Tìm hiểu cách ngăn xếp QA hoạt động cùng nhau
    - Mở rộng qa-lab, qa-channel hoặc bộ điều hợp truyền tải
    - Thêm các kịch bản QA dựa trên kho lưu trữ
    - Xây dựng tự động hóa QA có tính chân thực cao hơn quanh bảng điều khiển Gateway
summary: 'Tổng quan về ngăn xếp QA: qa-lab, qa-channel, các kịch bản dựa trên repo, các làn truyền tải trực tiếp, bộ điều hợp truyền tải và báo cáo.'
title: Tổng quan QA
x-i18n:
    generated_at: "2026-05-10T19:32:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f931d3daf9c3794bff7c5452df70c818cce19942eb1de156d27a9928bb3e0a
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Ngăn xếp QA riêng tư nhằm kiểm thử OpenClaw theo cách thực tế hơn,
có hình dạng giống channel hơn so với một bài unit test đơn lẻ có thể làm.

Các phần hiện tại:

- `extensions/qa-channel`: channel thông điệp tổng hợp với các bề mặt DM, channel, thread,
  reaction, edit và delete.
- `extensions/qa-lab`: UI debugger và bus QA để quan sát transcript,
  bơm thông điệp inbound và xuất báo cáo Markdown.
- `extensions/qa-matrix`, các Plugin runner trong tương lai: adapter live-transport điều khiển
  một channel thật bên trong Gateway QA con.
- `qa/`: tài nguyên seed dựa trên repo cho tác vụ khởi động và các kịch bản QA
  baseline.
- [Mantis](/vi/concepts/mantis): xác minh trực tiếp trước và sau cho các lỗi
  cần transport thật, ảnh chụp màn hình trình duyệt, trạng thái VM và bằng chứng PR.

## Bề mặt lệnh

Mọi luồng QA chạy dưới `pnpm openclaw qa <subcommand>`. Nhiều luồng có alias script `pnpm qa:*`;
cả hai dạng đều được hỗ trợ.

| Lệnh                                                | Mục đích                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `qa run`                                            | Tự kiểm tra QA đóng gói sẵn; ghi một báo cáo Markdown.                                                                                                                                                                                                                   |
| `qa suite`                                          | Chạy các kịch bản dựa trên repo với lane Gateway QA. Alias: `pnpm openclaw qa suite --runner multipass` cho một VM Linux dùng một lần.                                                                                                                                  |
| `qa coverage`                                       | In inventory mức bao phủ kịch bản dạng markdown (`--json` cho đầu ra máy đọc).                                                                                                                                                                                           |
| `qa parity-report`                                  | So sánh hai tệp `qa-suite-summary.json` và ghi báo cáo parity agentic.                                                                                                                                                                                                   |
| `qa character-eval`                                 | Chạy kịch bản QA nhân vật trên nhiều mô hình live với báo cáo được chấm. Xem [Báo cáo](#reporting).                                                                                                                                                                      |
| `qa manual`                                         | Chạy một prompt một lần với lane provider/model đã chọn.                                                                                                                                                                                                                 |
| `qa ui`                                             | Khởi động UI debugger QA và bus QA cục bộ (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                     |
| `qa docker-build-image`                             | Build image Docker QA dựng sẵn.                                                                                                                                                                                                                                         |
| `qa docker-scaffold`                                | Ghi scaffold docker-compose cho dashboard QA + lane Gateway.                                                                                                                                                                                                             |
| `qa up`                                             | Build site QA, khởi động ngăn xếp dựa trên Docker, in URL (alias: `pnpm qa:lab:up`; biến thể `:fast` thêm `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                      |
| `qa aimock`                                         | Chỉ khởi động server provider AIMock.                                                                                                                                                                                                                                   |
| `qa mock-openai`                                    | Chỉ khởi động server provider `mock-openai` nhận biết kịch bản.                                                                                                                                                                                                          |
| `qa credentials doctor` / `add` / `list` / `remove` | Quản lý pool credential Convex dùng chung.                                                                                                                                                                                                                              |
| `qa matrix`                                         | Lane transport live với homeserver Tuwunel dùng một lần. Xem [Matrix QA](/vi/concepts/qa-matrix).                                                                                                                                                                          |
| `qa telegram`                                       | Lane transport live với một nhóm Telegram riêng tư thật.                                                                                                                                                                                                                 |
| `qa discord`                                        | Lane transport live với một channel guild Discord riêng tư thật.                                                                                                                                                                                                         |
| `qa slack`                                          | Lane transport live với một channel Slack riêng tư thật.                                                                                                                                                                                                                 |
| `qa mantis`                                         | Runner xác minh trước và sau cho lỗi transport live, với bằng chứng reaction trạng thái Discord, smoke desktop/trình duyệt Crabbox và smoke Slack-in-VNC. Xem [Mantis](/vi/concepts/mantis) và [Runbook Mantis Slack Desktop](/vi/concepts/mantis-slack-desktop-runbook). |

## Luồng operator

Luồng operator QA hiện tại là một site QA hai khung:

- Trái: dashboard Gateway (UI điều khiển) với agent.
- Phải: QA Lab, hiển thị transcript kiểu Slack và kế hoạch kịch bản.

Chạy bằng:

```bash
pnpm qa:lab:up
```

Lệnh đó build site QA, khởi động lane Gateway dựa trên Docker và mở trang
QA Lab nơi một operator hoặc vòng lặp tự động hóa có thể giao cho agent một
nhiệm vụ QA, quan sát hành vi channel thật và ghi lại phần đã hoạt động, thất bại hoặc
vẫn bị chặn.

Để lặp UI QA Lab nhanh hơn mà không phải rebuild image Docker mỗi lần,
hãy khởi động ngăn xếp với bundle QA Lab được bind-mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` giữ các dịch vụ Docker trên một image dựng sẵn và bind-mount
`extensions/qa-lab/web/dist` vào container `qa-lab`. `qa:lab:watch`
rebuild bundle đó khi có thay đổi, và trình duyệt tự động tải lại khi hash tài nguyên QA Lab
thay đổi.

Để chạy một smoke trace OpenTelemetry cục bộ, hãy chạy:

```bash
pnpm qa:otel:smoke
```

Script đó khởi động một receiver trace OTLP/HTTP cục bộ, chạy kịch bản QA
`otel-trace-smoke` với Plugin `diagnostics-otel` được bật, sau đó
giải mã các span protobuf đã xuất và assert hình dạng quan trọng cho release:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` và `openclaw.message.delivery` phải có mặt;
các lần gọi model không được xuất `StreamAbandoned` trên các lượt thành công; ID chẩn đoán thô và
thuộc tính `openclaw.content.*` phải không xuất hiện trong trace. Script ghi
`otel-smoke-summary.json` cạnh các artifact của QA suite.

QA khả năng quan sát chỉ chạy từ source checkout. Tarball npm cố ý bỏ qua
QA Lab, vì vậy các lane release Docker của package không chạy lệnh `qa`. Dùng
`pnpm qa:otel:smoke` từ một source checkout đã build khi thay đổi instrumentation
chẩn đoán.

Để chạy một lane smoke Matrix dùng transport thật, hãy chạy:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Tham chiếu CLI đầy đủ, catalog profile/kịch bản, biến môi trường và bố cục artifact cho lane này nằm trong [Matrix QA](/vi/concepts/qa-matrix). Nhìn nhanh: nó cấp phát một homeserver Tuwunel dùng một lần trong Docker, đăng ký các user driver/SUT/observer tạm thời, chạy Plugin Matrix thật bên trong Gateway QA con được giới hạn theo transport đó (không có `qa-channel`), rồi ghi một báo cáo Markdown, summary JSON, artifact observed-events và log đầu ra kết hợp dưới `.artifacts/qa-e2e/matrix-<timestamp>/`.

Các kịch bản bao phủ hành vi transport mà unit test không thể chứng minh end to end: mention gating, chính sách allow-bot, allowlist, trả lời top-level và theo thread, định tuyến DM, xử lý reaction, chặn edit inbound, khử trùng lặp replay sau restart, phục hồi khi homeserver bị gián đoạn, phân phối metadata phê duyệt, xử lý media và các luồng bootstrap/recovery/verification Matrix E2EE. Profile CLI E2EE cũng điều khiển `openclaw matrix encryption setup` và các lệnh xác minh qua cùng homeserver dùng một lần trước khi kiểm tra phản hồi Gateway.

Discord cũng có các kịch bản opt-in chỉ dành cho Mantis để tái hiện lỗi. Dùng
`--scenario discord-status-reactions-tool-only` cho timeline reaction trạng thái rõ ràng,
hoặc `--scenario discord-thread-reply-filepath-attachment` để tạo một
thread Discord thật và xác minh rằng `message.thread-reply` giữ nguyên attachment
`filePath`. Các kịch bản này nằm ngoài lane Discord live mặc định
vì chúng là probe tái hiện trước/sau thay vì phạm vi smoke rộng.
Workflow Mantis thread-attachment cũng có thể thêm một video witness Web
Discord đã đăng nhập khi `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` hoặc
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` được cấu hình trong môi trường
QA. Profile viewer đó chỉ dùng cho capture trực quan; quyết định pass/fail
vẫn đến từ oracle REST Discord.

CI dùng cùng bề mặt lệnh trong `.github/workflows/qa-live-transports-convex.yml`. Các lần chạy theo lịch và thủ công mặc định thực thi profile Matrix nhanh với credential frontier live, `--fast` và `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. `matrix_profile=all` thủ công tách ra thành năm shard profile để catalog đầy đủ có thể chạy song song trong khi vẫn giữ một thư mục artifact cho mỗi shard.

Đối với các lane smoke Telegram, Discord và Slack dùng transport thật:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Chúng nhắm đến một channel thật đã tồn tại với hai bot (driver + SUT). Các biến môi trường bắt buộc, danh sách kịch bản, artifact đầu ra và pool credential Convex được ghi tài liệu trong [Tham chiếu QA Telegram, Discord và Slack](#telegram-discord-and-slack-qa-reference) bên dưới.

Để chạy đầy đủ VM Slack trên desktop với cứu hộ VNC, hãy chạy:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Lệnh đó thuê một máy desktop/trình duyệt Crabbox, chạy làn live Slack
bên trong VM, mở Slack Web trong trình duyệt VNC, chụp desktop, và
sao chép `slack-qa/`, `slack-desktop-smoke.png`, và `slack-desktop-smoke.mp4`
khi có thể quay video trở lại thư mục artifact Mantis. Các lease
desktop/trình duyệt Crabbox cung cấp sẵn công cụ ghi hình và các gói hỗ trợ
trình duyệt/bản dựng native, nên kịch bản chỉ nên cài đặt phương án dự phòng trên
các lease cũ hơn. Mantis báo cáo thời gian tổng và theo từng pha trong
`mantis-slack-desktop-smoke-report.md` để các lần chạy chậm cho thấy thời gian đã
được dùng cho khởi động lease, lấy thông tin xác thực, thiết lập từ xa, hay sao chép artifact. Tái sử dụng
`--lease-id <cbx_...>` sau khi đăng nhập vào Slack Web thủ công qua VNC;
các lease được tái sử dụng cũng giữ ấm bộ nhớ đệm pnpm store của Crabbox. Mặc định
`--hydrate-mode source` xác minh từ một source checkout và chạy cài đặt/bản dựng
bên trong VM. Chỉ dùng `--hydrate-mode prehydrated` khi workspace từ xa được tái sử dụng
đã có `node_modules` và `dist/` đã được build; chế độ đó bỏ qua bước
cài đặt/bản dựng tốn kém và thất bại đóng khi workspace chưa sẵn sàng.
Với `--gateway-setup`, Mantis để lại một Gateway OpenClaw Slack bền vững
đang chạy bên trong VM trên cổng `38973`; nếu không có tùy chọn này, lệnh chạy làn QA Slack
bot-với-bot bình thường và thoát sau khi chụp artifact.

Checklist cho operator, lệnh dispatch workflow GitHub, hợp đồng bình luận bằng chứng,
bảng quyết định chế độ hydrate, diễn giải thời gian, và các bước xử lý lỗi nằm trong [Runbook Desktop Mantis Slack](/vi/concepts/mantis-slack-desktop-runbook).

Để chạy một tác vụ desktop kiểu tác nhân/CV, hãy chạy:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` thuê hoặc tái sử dụng một máy desktop/trình duyệt Crabbox, khởi động
`crabbox record --while`, điều khiển trình duyệt hiển thị qua một
`visual-driver` lồng nhau, chụp `visual-task.png`, chạy `openclaw infer image describe`
trên ảnh chụp màn hình khi `--vision-mode image-describe` được chọn, và
ghi `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json`, và `mantis-visual-task-report.md`.
Khi đặt `--expect-text`, prompt thị giác yêu cầu một phán quyết JSON có cấu trúc
và chỉ đạt khi model báo cáo bằng chứng hiển thị dương tính; một phản hồi
âm tính chỉ đơn thuần trích dẫn văn bản mục tiêu sẽ khiến assertion thất bại.
Dùng `--vision-mode metadata` cho một smoke không dùng model để chứng minh đường ống desktop,
trình duyệt, ảnh chụp màn hình, và video mà không gọi nhà cung cấp hiểu hình ảnh.
Ghi hình là artifact bắt buộc cho `visual-task`; nếu Crabbox không ghi được
`visual-task.mp4` khác rỗng, tác vụ thất bại ngay cả khi visual driver
đã đạt. Khi thất bại, Mantis giữ lease cho VNC trừ khi tác vụ đã
đạt và không đặt `--keep-lease`.

Trước khi dùng thông tin xác thực live trong pool, hãy chạy:

```bash
pnpm openclaw qa credentials doctor
```

Doctor kiểm tra env broker Convex, xác thực thiết lập endpoint, và xác minh khả năng truy cập admin/list khi có secret của maintainer. Nó chỉ báo cáo trạng thái đã đặt/thiếu cho secret.

## Phạm vi bao phủ transport live

Các làn transport live chia sẻ một hợp đồng thay vì mỗi làn tự phát minh hình dạng danh sách kịch bản riêng. `qa-channel` là bộ kiểm thử hành vi sản phẩm tổng hợp rộng và không thuộc ma trận phạm vi bao phủ transport live.

| Làn      | Canary | Chặn theo lượt nhắc | Bot-với-bot | Chặn danh sách cho phép | Trả lời cấp cao nhất | Tiếp tục sau khởi động lại | Theo dõi tiếp trong thread | Cách ly thread | Quan sát reaction | Lệnh trợ giúp | Đăng ký lệnh native |
| -------- | ------ | ------------------- | ----------- | ----------------------- | -------------------- | -------------------------- | -------------------------- | -------------- | ----------------- | ------------ | ------------------- |
| Matrix   | x      | x                   | x           | x                       | x                    | x                          | x                          | x              | x                 |              |                     |
| Telegram | x      | x                   | x           |                         |                      |                            |                            |                |                   | x            |                     |
| Discord  | x      | x                   | x           |                         |                      |                            |                            |                |                   |              | x                   |
| Slack    | x      | x                   | x           | x                       | x                    | x                          | x                          | x              |                   |              |                     |

Điều này giữ `qa-channel` là bộ kiểm thử hành vi sản phẩm rộng trong khi Matrix,
Telegram, và các transport live tương lai dùng chung một checklist hợp đồng
transport rõ ràng.

Để chạy một làn VM Linux dùng một lần mà không đưa Docker vào đường dẫn QA, hãy chạy:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Lệnh này khởi động một guest Multipass mới, cài đặt dependency, build OpenClaw
bên trong guest, chạy `qa suite`, rồi sao chép báo cáo QA và
tóm tắt bình thường trở lại `.artifacts/qa-e2e/...` trên host.
Nó tái sử dụng cùng hành vi chọn kịch bản như `qa suite` trên host.
Các lần chạy bộ kiểm thử trên host và Multipass thực thi song song nhiều kịch bản đã chọn
với các worker Gateway cô lập theo mặc định. `qa-channel` mặc định concurrency
4, bị giới hạn bởi số lượng kịch bản đã chọn. Dùng `--concurrency <count>` để tinh chỉnh
số lượng worker, hoặc `--concurrency 1` để thực thi tuần tự.
Lệnh thoát khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi
bạn muốn artifact mà không có mã thoát thất bại.
Các lần chạy live chuyển tiếp các input auth QA được hỗ trợ và thực tế cho
guest: khóa nhà cung cấp dựa trên env, đường dẫn cấu hình nhà cung cấp live QA, và
`CODEX_HOME` khi có. Giữ `--output-dir` dưới thư mục gốc repo để guest
có thể ghi trả lại qua workspace được mount.

## Tham chiếu QA Telegram, Discord, và Slack

Matrix có một [trang riêng](/vi/concepts/qa-matrix) vì số lượng kịch bản và việc cấp phát homeserver dựa trên Docker. Telegram, Discord, và Slack nhỏ hơn - mỗi kênh chỉ có vài kịch bản, không có hệ thống profile, chạy trên các kênh thật đã tồn tại - nên tham chiếu của chúng nằm ở đây.

### Cờ CLI dùng chung

Các làn này đăng ký qua `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` và chấp nhận cùng các cờ:

| Cờ                                    | Mặc định                                                       | Mô tả                                                                                                                      |
| ------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                              | Chỉ chạy kịch bản này. Có thể lặp lại.                                                                                     |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Nơi ghi báo cáo/tóm tắt/tin nhắn quan sát được và log đầu ra. Đường dẫn tương đối được phân giải theo `--repo-root`.       |
| `--repo-root <path>`                  | `process.cwd()`                                                | Thư mục gốc repository khi gọi từ một cwd trung lập.                                                                        |
| `--sut-account <id>`                  | `sut`                                                          | ID tài khoản tạm thời bên trong cấu hình Gateway QA.                                                                        |
| `--provider-mode <mode>`              | `live-frontier`                                                | `mock-openai` hoặc `live-frontier` (`live-openai` legacy vẫn hoạt động).                                                    |
| `--model <ref>` / `--alt-model <ref>` | mặc định của nhà cung cấp                                      | Tham chiếu model chính/thay thế.                                                                                            |
| `--fast`                              | tắt                                                            | Chế độ nhanh của nhà cung cấp khi được hỗ trợ.                                                                              |
| `--credential-source <env\|convex>`   | `env`                                                          | Xem [pool thông tin xác thực Convex](#convex-credential-pool).                                                             |
| `--credential-role <maintainer\|ci>`  | `ci` trong CI, nếu không là `maintainer`                       | Vai trò được dùng khi `--credential-source convex`.                                                                         |

Mỗi làn thoát khác 0 khi bất kỳ kịch bản nào thất bại. `--allow-failures` ghi artifact mà không đặt mã thoát thất bại.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Nhắm tới một nhóm Telegram riêng tư thật với hai bot riêng biệt (driver + SUT). Bot SUT phải có username Telegram; quan sát bot-với-bot hoạt động tốt nhất khi cả hai bot đã bật **Chế độ Giao tiếp Bot-với-Bot** trong `@BotFather`.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - ID chat dạng số (chuỗi).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Tùy chọn:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` giữ nội dung tin nhắn trong artifact tin nhắn quan sát được (mặc định biên tập bỏ).

Kịch bản (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Tập mặc định ngầm định luôn bao phủ canary, chặn theo lượt nhắc, phản hồi lệnh native, định địa chỉ lệnh, và trả lời nhóm bot-với-bot. Mặc định `mock-openai` cũng bao gồm kiểm tra reply-chain xác định và streaming final-message. `telegram-current-session-status-tool` vẫn là opt-in vì nó chỉ ổn định khi được nối thread trực tiếp sau canary, không phải sau các phản hồi lệnh native tùy ý. Dùng `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` để in phần tách mặc định/tùy chọn hiện tại cùng các ref hồi quy.

Artifact đầu ra:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - bao gồm RTT theo từng trả lời (driver gửi → quan sát trả lời SUT) bắt đầu từ canary.
- `telegram-qa-observed-messages.json` - nội dung bị biên tập bỏ trừ khi `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Nhắm tới một kênh guild Discord riêng tư thật với hai bot: một bot driver do harness điều khiển và một bot SUT được Gateway OpenClaw con khởi động thông qua Plugin Discord được đóng gói. Xác minh việc xử lý lượt nhắc kênh, rằng bot SUT đã đăng ký lệnh native `/help` với Discord, và các kịch bản bằng chứng Mantis opt-in.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - phải khớp với id người dùng của bot SUT do Discord trả về (nếu không lane sẽ thất bại nhanh).

Tùy chọn:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` giữ phần nội dung tin nhắn trong các artifact tin nhắn quan sát được.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` chọn kênh thoại/stage cho `discord-voice-autojoin`; nếu không có, kịch bản sẽ chọn kênh thoại/stage hiển thị đầu tiên cho bot SUT.

Kịch bản (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - kịch bản thoại cần chọn bật. Chạy riêng, bật `channels.discord.voice.autoJoin`, và xác minh trạng thái thoại Discord hiện tại của bot SUT là kênh thoại/stage đích. Thông tin xác thực Convex Discord có thể bao gồm `voiceChannelId` tùy chọn; nếu không, runner sẽ phát hiện kênh thoại/stage hiển thị đầu tiên trong guild.
- `discord-status-reactions-tool-only` - kịch bản Mantis cần chọn bật. Chạy riêng vì nó chuyển SUT sang chế độ luôn bật, chỉ trả lời guild bằng công cụ với `messages.statusReactions.enabled=true`, sau đó ghi lại timeline phản ứng REST cùng các artifact trực quan HTML/PNG. Báo cáo trước/sau của Mantis cũng giữ lại các artifact MP4 do kịch bản cung cấp dưới dạng `baseline.mp4` và `candidate.mp4`.

Chạy rõ ràng kịch bản tự động tham gia thoại Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

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
- `discord-qa-observed-messages.json` - nội dung bị biên tập trừ khi `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` và `discord-status-reactions-tool-only-timeline.png` khi kịch bản phản ứng trạng thái chạy.

### QA Slack

```bash
pnpm openclaw qa slack
```

Nhắm đến một kênh Slack riêng tư thật với hai bot riêng biệt: bot driver do harness điều khiển và bot SUT được khởi động bởi Gateway OpenClaw con thông qua Plugin Slack đi kèm.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Tùy chọn:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` giữ phần nội dung tin nhắn trong các artifact tin nhắn quan sát được.

Kịch bản (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`

Artifact đầu ra:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` - nội dung bị biên tập trừ khi `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Thiết lập workspace Slack

Lane cần hai ứng dụng Slack riêng biệt trong một workspace, cùng với một kênh mà cả hai bot đều là thành viên:

- `channelId` - id `Cxxxxxxxxxx` của kênh mà cả hai bot đã được mời vào. Hãy dùng một kênh chuyên dụng; lane sẽ đăng bài mỗi lần chạy.
- `driverBotToken` - token bot (`xoxb-...`) của ứng dụng **Driver**.
- `sutBotToken` - token bot (`xoxb-...`) của ứng dụng **SUT**, phải là một ứng dụng Slack tách biệt với driver để id người dùng bot của nó khác nhau.
- `sutAppToken` - token cấp ứng dụng (`xapp-...`) của ứng dụng SUT với `connections:write`, được Socket Mode dùng để ứng dụng SUT có thể nhận sự kiện.

Nên dùng một workspace Slack chuyên cho QA thay vì dùng lại workspace production.

Manifest SUT bên dưới cố ý thu hẹp bản cài đặt production của Plugin Slack đi kèm (`extensions/slack/src/setup-shared.ts:10`) xuống các quyền và sự kiện được bộ kiểm thử QA Slack live bao phủ. Đối với thiết lập kênh production như người dùng nhìn thấy, xem [thiết lập nhanh kênh Slack](/vi/channels/slack#quick-setup); cặp QA Driver/SUT được tách riêng có chủ ý vì lane cần hai id người dùng bot riêng biệt trong một workspace.

**1. Tạo ứng dụng Driver**

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

Sao chép _Bot User OAuth Token_ (`xoxb-...`) - giá trị đó trở thành `driverBotToken`. Driver chỉ cần đăng tin nhắn và nhận diện chính nó; không có sự kiện, không có Socket Mode.

**2. Tạo ứng dụng SUT**

Lặp lại _Create New App → From a manifest_ trong cùng workspace. Ứng dụng QA này cố ý dùng một phiên bản hẹp hơn của manifest production của Plugin Slack đi kèm (`extensions/slack/src/setup-shared.ts:10`): các scope và sự kiện phản ứng bị lược bỏ vì bộ kiểm thử QA Slack live chưa bao phủ xử lý phản ứng.

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
        "pin_removed"
      ]
    }
  }
}
```

Sau khi Slack tạo ứng dụng, hãy làm hai việc trên trang cài đặt của ứng dụng:

- _Install to Workspace_ → sao chép _Bot User OAuth Token_ → giá trị đó trở thành `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → thêm scope `connections:write` → lưu → sao chép giá trị `xapp-...` → giá trị đó trở thành `sutAppToken`.

Xác minh hai bot có id người dùng riêng biệt bằng cách gọi `auth.test` trên từng token. Runtime phân biệt driver và SUT theo id người dùng; dùng lại một ứng dụng cho cả hai sẽ khiến mention-gating thất bại ngay lập tức.

**3. Tạo kênh**

Trong workspace QA, tạo một kênh (ví dụ `#openclaw-qa`) và mời cả hai bot từ trong kênh:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Sao chép id `Cxxxxxxxxxx` từ _channel info → About → Channel ID_ - giá trị đó trở thành `channelId`. Kênh công khai dùng được; nếu bạn dùng kênh riêng tư, cả hai ứng dụng đã có `groups:history` nên các lần đọc lịch sử của harness vẫn sẽ thành công.

**4. Đăng ký thông tin xác thực**

Có hai tùy chọn. Dùng biến env để debug trên một máy (đặt bốn biến `OPENCLAW_QA_SLACK_*` và truyền `--credential-source env`), hoặc seed pool Convex dùng chung để CI và các maintainer khác có thể lease chúng.

Đối với pool Convex, ghi bốn trường vào một tệp JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Với `OPENCLAW_QA_CONVEX_SITE_URL` và `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` đã được export trong shell của bạn, hãy đăng ký và xác minh:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Kỳ vọng `count: 1`, `status: "active"`, không có trường `lease`.

**5. Xác minh end to end**

Chạy lane cục bộ để xác nhận cả hai bot có thể nói chuyện với nhau thông qua broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Một lần chạy xanh hoàn tất trong chưa đến 30 giây và `slack-qa-report.md` hiển thị cả `slack-canary` và `slack-mention-gating` ở trạng thái `pass`. Nếu lane treo khoảng 90 giây rồi thoát với `Convex credential pool exhausted for kind "slack"`, thì hoặc pool đang trống hoặc mọi dòng đều đã được lease - `qa credentials list --kind slack --status all --json` sẽ cho bạn biết trường hợp nào.

### Pool thông tin xác thực Convex

Các lane Telegram, Discord, Slack và WhatsApp có thể lease thông tin xác thực từ pool Convex dùng chung thay vì đọc các biến env ở trên. Truyền `--credential-source convex` (hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab sẽ nhận một lease độc quyền, gửi Heartbeat cho lease đó trong suốt thời gian chạy, và giải phóng khi tắt. Các loại pool là `"telegram"`, `"discord"`, `"slack"` và `"whatsapp"`.

Các dạng payload mà broker xác thực trên `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` phải là chuỗi chat-id dạng số.
- Người dùng thật Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - một lease tài khoản dùng một lần độc quyền được cả driver CLI TDLib và nhân chứng trực quan Telegram Desktop sử dụng.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - số điện thoại phải là các chuỗi E.164 khác nhau.

Đối với bằng chứng Telegram trực quan bằng người dùng thật, ưu tiên một phiên Crabbox được giữ:

```bash
pnpm qa:telegram-user:crabbox -- start --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json --text /status
pnpm qa:telegram-user:crabbox -- finish --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` giữ một lease Convex `telegram-user` độc quyền cho cả driver CLI TDLib
và nhân chứng Telegram Desktop, bắt đầu ghi màn hình desktop, và giữ
Crabbox sống để thực hiện các bước tái hiện tùy ý do agent điều khiển. Agent có thể dùng `send`,
`run`, `screenshot`, và `status` cho đến khi hài lòng, sau đó `finish`
thu thập ảnh chụp màn hình, video, video/GIF đã cắt theo chuyển động, đầu ra probe TDLib,
và log trước khi giải phóng thông tin xác thực. `publish --session <file> --pr
<number>` mặc định chỉ bình luận GIF chuyển động; `--full-artifacts` là lựa chọn bật rõ ràng
cho log và đầu ra JSON. Lệnh `probe` mặc định vẫn là cách viết tắt một lệnh
cho các kiểm tra smoke `/status` nhanh.

Dùng `--mock-response-file <path>` khi một PR cần diff hình ảnh có tính quyết định:
cùng một phản hồi mô hình mock có thể chạy trên `main` và trên head của PR trong khi
bộ định dạng Telegram hoặc lớp phân phối thay đổi. Các mặc định chụp được tinh chỉnh cho
bình luận PR: lớp Crabbox tiêu chuẩn, bản ghi desktop 24fps, GIF chuyển động 24fps, và
chiều rộng preview 1920px. Bình luận trước/sau nên xuất bản một bundle sạch chỉ
chứa các GIF dự định.

Các lane Slack cũng có thể dùng pool. Kiểm tra hình dạng payload Slack hiện nằm trong Slack QA runner thay vì broker; dùng `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, với id kênh Slack như `Cxxxxxxxxxx`. Xem [Thiết lập workspace Slack](#setting-up-the-slack-workspace) để cấp phát app và scope.

Các biến môi trường vận hành và hợp đồng endpoint broker Convex nằm trong [Kiểm thử → Thông tin đăng nhập Telegram dùng chung qua Convex](/vi/help/testing#shared-telegram-credentials-via-convex-v1) (tên mục có trước pool đa kênh; ngữ nghĩa lease được dùng chung giữa các loại).

## Seed dựa trên repo

Tài nguyên seed nằm trong `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Các tài nguyên này cố ý được đưa vào git để kế hoạch QA hiển thị với cả con người và
agent.

`qa-lab` nên giữ vai trò runner markdown tổng quát. Mỗi tệp markdown scenario là
nguồn chân lý cho một lần chạy kiểm thử và nên định nghĩa:

- metadata của scenario
- metadata tùy chọn về danh mục, capability, lane, và rủi ro
- tham chiếu docs và code
- yêu cầu Plugin tùy chọn
- bản vá cấu hình Gateway tùy chọn
- `qa-flow` có thể thực thi

Bề mặt runtime tái sử dụng hỗ trợ `qa-flow` được phép giữ tính tổng quát
và xuyên suốt nhiều phần. Ví dụ, các scenario markdown có thể kết hợp helper phía transport
với helper phía trình duyệt để điều khiển Control UI nhúng thông qua
seam Gateway `browser.request` mà không thêm runner trường hợp đặc biệt.

Các tệp scenario nên được nhóm theo capability sản phẩm thay vì thư mục cây mã nguồn.
Giữ ID scenario ổn định khi di chuyển tệp; dùng `docsRefs` và `codeRefs`
để truy vết triển khai.

Danh sách baseline nên đủ rộng để bao phủ:

- chat DM và kênh
- hành vi thread
- vòng đời hành động trên tin nhắn
- callback cron
- truy hồi bộ nhớ
- chuyển đổi mô hình
- bàn giao subagent
- đọc repo và đọc docs
- một tác vụ build nhỏ như Lobster Invaders

## Lane mock của nhà cung cấp

`qa suite` có hai lane mock nhà cung cấp cục bộ:

- `mock-openai` là mock OpenClaw nhận biết scenario. Nó vẫn là lane mock
  quyết định mặc định cho QA dựa trên repo và các cổng parity.
- `aimock` khởi động một server nhà cung cấp dựa trên AIMock cho phạm vi kiểm thử giao thức thử nghiệm,
  fixture, record/replay, và chaos. Nó là phần bổ sung và không
  thay thế dispatcher scenario `mock-openai`.

Triển khai provider-lane nằm dưới `extensions/qa-lab/src/providers/`.
Mỗi nhà cung cấp sở hữu mặc định, khởi động server cục bộ, cấu hình mô hình Gateway,
nhu cầu staging auth-profile, và cờ capability live/mock của mình. Mã suite và
Gateway dùng chung nên định tuyến qua registry nhà cung cấp thay vì rẽ nhánh theo
tên nhà cung cấp.

## Bộ chuyển đổi transport

`qa-lab` sở hữu một seam transport tổng quát cho các scenario QA markdown. `qa-channel` là bộ chuyển đổi đầu tiên trên seam đó, nhưng mục tiêu thiết kế rộng hơn: các kênh thực hoặc tổng hợp trong tương lai nên cắm vào cùng runner suite thay vì thêm một runner QA riêng cho transport.

Ở cấp kiến trúc, phần tách là:

- `qa-lab` sở hữu thực thi scenario tổng quát, concurrency worker, ghi artifact, và báo cáo.
- Bộ chuyển đổi transport sở hữu cấu hình Gateway, readiness, quan sát inbound và outbound, hành động transport, và trạng thái transport đã chuẩn hóa.
- Các tệp scenario markdown dưới `qa/scenarios/` định nghĩa lần chạy kiểm thử; `qa-lab` cung cấp bề mặt runtime tái sử dụng để thực thi chúng.

### Thêm kênh

Thêm một kênh vào hệ thống QA markdown yêu cầu đúng hai thứ:

1. Một bộ chuyển đổi transport cho kênh.
2. Một gói scenario kiểm tra hợp đồng kênh.

Không thêm root lệnh QA cấp cao mới khi host `qa-lab` dùng chung có thể sở hữu flow.

`qa-lab` sở hữu cơ chế host dùng chung:

- root lệnh `openclaw qa`
- khởi động và teardown suite
- concurrency worker
- ghi artifact
- tạo báo cáo
- thực thi scenario
- alias tương thích cho các scenario `qa-channel` cũ hơn

Các Plugin runner sở hữu hợp đồng transport:

- cách `openclaw qa <runner>` được mount bên dưới root `qa` dùng chung
- cách Gateway được cấu hình cho transport đó
- cách kiểm tra readiness
- cách inject sự kiện inbound
- cách quan sát tin nhắn outbound
- cách expose transcript và trạng thái transport đã chuẩn hóa
- cách thực thi các hành động dựa trên transport
- cách xử lý reset hoặc cleanup riêng cho transport

Mức tối thiểu để áp dụng cho một kênh mới:

1. Giữ `qa-lab` làm chủ sở hữu root `qa` dùng chung.
2. Triển khai transport runner trên seam host `qa-lab` dùng chung.
3. Giữ cơ chế riêng cho transport bên trong Plugin runner hoặc harness kênh.
4. Mount runner dưới dạng `openclaw qa <runner>` thay vì đăng ký một root command cạnh tranh. Các Plugin runner nên khai báo `qaRunners` trong `openclaw.plugin.json` và export một mảng `qaRunnerCliRegistrations` khớp từ `runtime-api.ts`. Giữ `runtime-api.ts` nhẹ; CLI lazy và thực thi runner nên nằm sau các entrypoint riêng.
5. Viết hoặc điều chỉnh các scenario markdown dưới các thư mục theo chủ đề `qa/scenarios/`.
6. Dùng helper scenario tổng quát cho các scenario mới.
7. Giữ các alias tương thích hiện có hoạt động trừ khi repo đang thực hiện một migration có chủ ý.

Quy tắc quyết định rất nghiêm ngặt:

- Nếu hành vi có thể được biểu đạt một lần trong `qa-lab`, đặt nó trong `qa-lab`.
- Nếu hành vi phụ thuộc vào một transport kênh, giữ nó trong Plugin runner hoặc harness Plugin đó.
- Nếu một scenario cần capability mới mà nhiều hơn một kênh có thể dùng, thêm một helper tổng quát thay vì một nhánh riêng cho kênh trong `suite.ts`.
- Nếu một hành vi chỉ có ý nghĩa với một transport, giữ scenario riêng cho transport và làm rõ điều đó trong hợp đồng scenario.

### Tên helper scenario

Các helper tổng quát được ưu tiên cho scenario mới:

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

Các alias tương thích vẫn còn dùng được cho các scenario hiện có - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - nhưng khi viết scenario mới nên dùng các tên tổng quát. Các alias tồn tại để tránh migration đồng loạt, không phải là mô hình về sau.

## Báo cáo

`qa-lab` export báo cáo giao thức Markdown từ timeline bus đã quan sát.
Báo cáo nên trả lời:

- Điều gì đã hoạt động
- Điều gì đã thất bại
- Điều gì vẫn bị chặn
- Những scenario theo dõi nào đáng thêm vào

Để xem inventory các scenario hiện có - hữu ích khi ước lượng công việc theo dõi hoặc nối dây một transport mới - chạy `pnpm openclaw qa coverage` (thêm `--json` để có output máy đọc được).

Để kiểm tra tính cách và phong cách, chạy cùng một scenario trên nhiều ref mô hình live
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

Lệnh này chạy các tiến trình con Gateway QA cục bộ, không phải Docker. Các scenario character eval
nên đặt persona thông qua `SOUL.md`, rồi chạy các lượt người dùng thông thường
như chat, trợ giúp workspace, và tác vụ tệp nhỏ. Không nên cho mô hình ứng viên
biết rằng nó đang được đánh giá. Lệnh giữ lại từng transcript đầy đủ,
ghi lại thống kê chạy cơ bản, rồi yêu cầu các mô hình judge ở chế độ fast với
lập luận `xhigh` ở nơi được hỗ trợ để xếp hạng các lần chạy theo độ tự nhiên, vibe, và độ hài hước.
Dùng `--blind-judge-models` khi so sánh nhà cung cấp: prompt judge vẫn nhận
mọi transcript và trạng thái chạy, nhưng ref ứng viên được thay bằng các nhãn trung lập
như `candidate-01`; báo cáo ánh xạ thứ hạng trở lại ref thật sau khi
parse.
Các lần chạy ứng viên mặc định dùng thinking `high`, với `medium` cho GPT-5.5 và `xhigh`
cho các ref eval OpenAI cũ hơn có hỗ trợ. Ghi đè một ứng viên cụ thể inline bằng
`--model provider/model,thinking=<level>`. `--thinking <level>` vẫn đặt một
fallback toàn cục, và dạng cũ hơn `--model-thinking <provider/model=level>` được
giữ để tương thích.
Ref ứng viên OpenAI mặc định dùng chế độ fast để dùng xử lý ưu tiên ở nơi
nhà cung cấp hỗ trợ. Thêm `,fast`, `,no-fast`, hoặc `,fast=false` inline khi một
ứng viên hoặc judge đơn lẻ cần ghi đè. Truyền `--fast` chỉ khi bạn muốn
ép bật chế độ fast cho mọi mô hình ứng viên. Thời lượng ứng viên và judge được
ghi lại trong báo cáo để phân tích benchmark, nhưng prompt judge nói rõ
không xếp hạng theo tốc độ.
Các lần chạy mô hình ứng viên và judge đều mặc định concurrency 16. Giảm
`--concurrency` hoặc `--judge-concurrency` khi giới hạn nhà cung cấp hoặc áp lực Gateway
cục bộ làm một lần chạy quá nhiễu.
Khi không truyền `--model` ứng viên, character eval mặc định dùng
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, và
`google/gemini-3.1-pro-preview` khi không truyền `--model`.
Khi không truyền `--judge-model`, các judge mặc định là
`openai/gpt-5.5,thinking=xhigh,fast` và
`anthropic/claude-opus-4-6,thinking=high`.

## Tài liệu liên quan

- [Matrix QA](/vi/concepts/qa-matrix)
- [QA Channel](/vi/channels/qa-channel)
- [Kiểm thử](/vi/help/testing)
- [Dashboard](/vi/web/dashboard)
