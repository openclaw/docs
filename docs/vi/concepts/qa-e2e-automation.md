---
read_when:
    - Hiểu cách ngăn xếp QA phối hợp với nhau
    - Mở rộng qa-lab, qa-channel hoặc bộ điều hợp truyền tải
    - Thêm các kịch bản QA dựa trên kho lưu trữ
    - Xây dựng tự động hóa QA có độ chân thực cao hơn quanh bảng điều khiển Gateway
summary: 'Tổng quan về ngăn xếp QA: qa-lab, qa-channel, các kịch bản dựa trên repo, các làn truyền tải trực tiếp, bộ điều hợp truyền tải và báo cáo.'
title: Tổng quan về QA
x-i18n:
    generated_at: "2026-05-07T13:15:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9b767fff432112ff20cae738e40da45cdbf00a2431cb17c025e098b97eafa3e8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Ngăn xếp QA riêng tư nhằm kiểm thử OpenClaw theo cách thực tế hơn,
mô phỏng theo kênh hơn so với một kiểm thử đơn vị riêng lẻ.

Các thành phần hiện tại:

- `extensions/qa-channel`: kênh tin nhắn tổng hợp với các bề mặt DM, kênh, luồng,
  phản ứng, chỉnh sửa và xóa.
- `extensions/qa-lab`: giao diện trình gỡ lỗi và bus QA để quan sát bản ghi hội thoại,
  chèn tin nhắn đến và xuất báo cáo Markdown.
- `extensions/qa-matrix`, các Plugin trình chạy trong tương lai: bộ chuyển đổi transport trực tiếp
  điều khiển một kênh thật bên trong một Gateway QA con.
- `qa/`: tài nguyên seed được hỗ trợ bởi repo cho tác vụ khởi động và các kịch bản QA
  baseline.
- [Mantis](/vi/concepts/mantis): xác minh trực tiếp trước và sau cho các lỗi
  cần transport thật, ảnh chụp màn hình trình duyệt, trạng thái VM và bằng chứng PR.

## Bề mặt lệnh

Mọi luồng QA chạy dưới `pnpm openclaw qa <subcommand>`. Nhiều luồng có bí danh script `pnpm qa:*`;
cả hai dạng đều được hỗ trợ.

| Lệnh                                                | Mục đích                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Tự kiểm tra QA đi kèm; ghi báo cáo Markdown.                                                                                                                                                                                                                            |
| `qa suite`                                          | Chạy các kịch bản được hỗ trợ bởi repo trên làn Gateway QA. Bí danh: `pnpm openclaw qa suite --runner multipass` cho một VM Linux dùng một lần.                                                                                                                        |
| `qa coverage`                                       | In kho kiểm kê mức bao phủ kịch bản dạng markdown (`--json` cho đầu ra máy).                                                                                                                                                                                           |
| `qa parity-report`                                  | So sánh hai tệp `qa-suite-summary.json` và ghi báo cáo tương đương agentic.                                                                                                                                                                                             |
| `qa character-eval`                                 | Chạy kịch bản QA nhân vật trên nhiều mô hình trực tiếp với báo cáo đã được chấm. Xem [Báo cáo](#reporting).                                                                                                                                                             |
| `qa manual`                                         | Chạy prompt một lần trên làn provider/mô hình đã chọn.                                                                                                                                                                                                                  |
| `qa ui`                                             | Khởi động giao diện trình gỡ lỗi QA và bus QA cục bộ (bí danh: `pnpm qa:lab:ui`).                                                                                                                                                                                       |
| `qa docker-build-image`                             | Xây dựng image Docker QA dựng sẵn.                                                                                                                                                                                                                                      |
| `qa docker-scaffold`                                | Ghi scaffold docker-compose cho bảng điều khiển QA + làn Gateway.                                                                                                                                                                                                       |
| `qa up`                                             | Xây dựng site QA, khởi động ngăn xếp được Docker hỗ trợ, in URL (bí danh: `pnpm qa:lab:up`; biến thể `:fast` thêm `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                              |
| `qa aimock`                                         | Chỉ khởi động máy chủ provider AIMock.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Chỉ khởi động máy chủ provider `mock-openai` nhận biết kịch bản.                                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Quản lý pool thông tin xác thực Convex dùng chung.                                                                                                                                                                                                                      |
| `qa matrix`                                         | Làn transport trực tiếp trên một homeserver Tuwunel dùng một lần. Xem [QA Matrix](/vi/concepts/qa-matrix).                                                                                                                                                                 |
| `qa telegram`                                       | Làn transport trực tiếp trên một nhóm Telegram riêng tư thật.                                                                                                                                                                                                           |
| `qa discord`                                        | Làn transport trực tiếp trên một kênh guild Discord riêng tư thật.                                                                                                                                                                                                      |
| `qa slack`                                          | Làn transport trực tiếp trên một kênh Slack riêng tư thật.                                                                                                                                                                                                              |
| `qa mantis`                                         | Trình chạy xác minh trước và sau cho lỗi transport trực tiếp, với bằng chứng phản ứng trạng thái Discord, smoke desktop/trình duyệt Crabbox và smoke Slack-trong-VNC. Xem [Mantis](/vi/concepts/mantis) và [Runbook Mantis Slack Desktop](/vi/concepts/mantis-slack-desktop-runbook). |

## Luồng vận hành

Luồng vận hành QA hiện tại là một site QA hai khung:

- Trái: bảng điều khiển Gateway (Control UI) với agent.
- Phải: QA Lab, hiển thị bản ghi hội thoại kiểu Slack và kế hoạch kịch bản.

Chạy bằng:

```bash
pnpm qa:lab:up
```

Lệnh đó xây dựng site QA, khởi động làn Gateway được Docker hỗ trợ và mở trang
QA Lab nơi người vận hành hoặc vòng lặp tự động hóa có thể giao cho agent một
nhiệm vụ QA, quan sát hành vi kênh thật và ghi lại những gì hoạt động, thất bại hoặc
vẫn bị chặn.

Để lặp nhanh giao diện QA Lab cục bộ mà không phải xây dựng lại image Docker mỗi lần,
hãy khởi động ngăn xếp với bundle QA Lab được gắn bằng bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` giữ các dịch vụ Docker trên một image dựng sẵn và bind-mount
`extensions/qa-lab/web/dist` vào container `qa-lab`. `qa:lab:watch`
xây dựng lại bundle đó khi có thay đổi, và trình duyệt tự động tải lại khi hash tài nguyên QA Lab thay đổi.

Để chạy smoke trace OpenTelemetry cục bộ, hãy chạy:

```bash
pnpm qa:otel:smoke
```

Script đó khởi động bộ nhận trace OTLP/HTTP cục bộ, chạy kịch bản QA
`otel-trace-smoke` với Plugin `diagnostics-otel` được bật, sau đó
giải mã các span protobuf đã xuất và khẳng định hình dạng trọng yếu cho phát hành:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` và `openclaw.message.delivery` phải có mặt;
các lệnh gọi mô hình không được xuất `StreamAbandoned` trên các lượt thành công; ID chẩn đoán thô và
thuộc tính `openclaw.content.*` phải không xuất hiện trong trace. Nó ghi
`otel-smoke-summary.json` bên cạnh các artifact của bộ QA.

QA khả năng quan sát chỉ duy trì cho bản checkout nguồn. Tarball npm cố ý bỏ qua
QA Lab, nên các làn phát hành Docker package không chạy lệnh `qa`. Dùng
`pnpm qa:otel:smoke` từ một bản checkout nguồn đã được xây dựng khi thay đổi instrumentation chẩn đoán.

Để chạy một làn smoke Matrix dùng transport thật, hãy chạy:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Tham chiếu CLI đầy đủ, danh mục profile/kịch bản, biến môi trường và bố cục artifact cho làn này nằm trong [QA Matrix](/vi/concepts/qa-matrix). Tóm tắt: nó cấp phát một homeserver Tuwunel dùng một lần trong Docker, đăng ký người dùng driver/SUT/observer tạm thời, chạy Plugin Matrix thật bên trong một Gateway QA con được giới hạn cho transport đó (không có `qa-channel`), rồi ghi một báo cáo Markdown, bản tóm tắt JSON, artifact sự kiện đã quan sát và log đầu ra kết hợp dưới `.artifacts/qa-e2e/matrix-<timestamp>/`.

Các kịch bản bao phủ hành vi transport mà kiểm thử đơn vị không thể chứng minh end to end: kiểm soát mention, chính sách allow-bot, allowlist, phản hồi cấp cao nhất và theo luồng, định tuyến DM, xử lý phản ứng, chặn chỉnh sửa đến, khử trùng lặp phát lại sau khởi động lại, phục hồi khi homeserver bị gián đoạn, chuyển giao metadata phê duyệt, xử lý media và các luồng bootstrap/phục hồi/xác minh Matrix E2EE. Profile CLI E2EE cũng điều khiển `openclaw matrix encryption setup` và các lệnh xác minh qua cùng homeserver dùng một lần trước khi kiểm tra phản hồi Gateway.

Discord cũng có các kịch bản opt-in chỉ dành cho Mantis để tái hiện lỗi. Dùng
`--scenario discord-status-reactions-tool-only` cho timeline phản ứng trạng thái rõ ràng,
hoặc `--scenario discord-thread-reply-filepath-attachment` để tạo một
luồng Discord thật và xác minh rằng `message.thread-reply` bảo toàn một
tệp đính kèm `filePath`. Các kịch bản này không nằm trong làn Discord trực tiếp mặc định
vì chúng là các probe tái hiện trước/sau thay vì mức bao phủ smoke rộng.
Quy trình Mantis thread-attachment cũng có thể thêm video nhân chứng Web
Discord đã đăng nhập khi `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` hoặc
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` được cấu hình trong môi trường
QA. Profile trình xem đó chỉ phục vụ ghi hình trực quan; quyết định đạt/không đạt
vẫn đến từ oracle REST Discord.

CI dùng cùng bề mặt lệnh trong `.github/workflows/qa-live-transports-convex.yml`. Các lần chạy thủ công mặc định và theo lịch chạy profile Matrix nhanh với thông tin xác thực frontier trực tiếp, `--fast` và `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Lần chạy thủ công `matrix_profile=all` phân nhánh thành năm shard profile để danh mục đầy đủ có thể chạy song song trong khi vẫn giữ một thư mục artifact cho mỗi shard.

Đối với các làn smoke Telegram, Discord và Slack dùng transport thật:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Chúng nhắm đến một kênh thật đã tồn tại với hai bot (driver + SUT). Các biến môi trường bắt buộc, danh sách kịch bản, artifact đầu ra và pool thông tin xác thực Convex được ghi lại trong [tham chiếu QA Telegram, Discord và Slack](#telegram-discord-and-slack-qa-reference) bên dưới.

Để chạy đầy đủ VM Slack desktop với cứu hộ VNC, hãy chạy:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Lệnh đó thuê một máy desktop/browser Crabbox, chạy lane Slack live
bên trong VM, mở Slack Web trong trình duyệt VNC, chụp desktop, và
sao chép `slack-qa/`, `slack-desktop-smoke.png`, và `slack-desktop-smoke.mp4`
khi có tính năng quay video trở lại thư mục artifact Mantis. Các lease
desktop/browser Crabbox cung cấp sẵn công cụ chụp/quay và các gói helper
browser/native-build, vì vậy kịch bản chỉ nên cài đặt fallback trên các
lease cũ hơn. Mantis báo cáo tổng thời gian và thời gian theo từng phase trong
`mantis-slack-desktop-smoke-report.md` để các lần chạy chậm cho thấy thời gian
được dùng cho khởi động lease, lấy credential, thiết lập từ xa, hay sao chép
artifact. Tái sử dụng `--lease-id <cbx_...>` sau khi đăng nhập vào Slack Web
thủ công qua VNC; các lease được tái sử dụng cũng giữ cache pnpm store của
Crabbox ở trạng thái ấm. Mặc định `--hydrate-mode source` xác minh từ một source
checkout và chạy install/build bên trong VM. Chỉ dùng `--hydrate-mode prehydrated`
khi workspace từ xa được tái sử dụng đã có `node_modules` và `dist/` đã build;
chế độ đó bỏ qua bước install/build tốn kém và fail kín khi workspace chưa sẵn sàng.
Với `--gateway-setup`, Mantis để một Gateway OpenClaw Slack bền vững chạy
bên trong VM trên cổng `38973`; nếu không có tùy chọn đó, lệnh chạy lane QA Slack
bot-to-bot thông thường và thoát sau khi chụp/quay artifact.

Checklist vận hành, lệnh dispatch GitHub workflow, hợp đồng evidence-comment,
bảng quyết định hydrate-mode, cách diễn giải thời gian, và các bước xử lý lỗi
nằm trong [Runbook Mantis Slack Desktop](/vi/concepts/mantis-slack-desktop-runbook).

Để chạy một tác vụ desktop kiểu agent/CV, hãy chạy:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` thuê hoặc tái sử dụng một máy desktop/browser Crabbox, khởi động
`crabbox record --while`, điều khiển trình duyệt hiển thị thông qua một
`visual-driver` lồng nhau, chụp `visual-task.png`, chạy `openclaw infer image describe`
trên ảnh chụp màn hình khi `--vision-mode image-describe` được chọn, và
ghi `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json`, và `mantis-visual-task-report.md`.
Khi đặt `--expect-text`, prompt vision yêu cầu một verdict JSON có cấu trúc
và chỉ pass khi model báo cáo bằng chứng hiển thị tích cực; một phản hồi
tiêu cực chỉ trích dẫn lại văn bản mục tiêu sẽ fail assertion.
Dùng `--vision-mode metadata` cho một smoke không dùng model để chứng minh
đường ống desktop, trình duyệt, ảnh chụp màn hình, và video mà không gọi
provider hiểu hình ảnh. Recording là artifact bắt buộc cho `visual-task`; nếu Crabbox
không ghi được `visual-task.mp4` khác rỗng, tác vụ sẽ fail ngay cả khi visual driver
đã pass. Khi fail, Mantis giữ lease cho VNC trừ khi tác vụ đã pass và
`--keep-lease` không được đặt.

Trước khi dùng credential live dùng chung, hãy chạy:

```bash
pnpm openclaw qa credentials doctor
```

Doctor kiểm tra env của broker Convex, xác thực thiết lập endpoint, và xác minh khả năng truy cập admin/list khi có secret của maintainer. Nó chỉ báo cáo trạng thái đã đặt/thiếu cho secret.

## Phạm vi bao phủ transport live

Các lane transport live dùng chung một hợp đồng thay vì mỗi lane tự phát minh hình dạng danh sách kịch bản riêng. `qa-channel` là bộ kiểm thử hành vi sản phẩm synthetic rộng và không thuộc ma trận phạm vi bao phủ transport live.

| Lane     | Canary | Kiểm soát mention | Bot-to-bot | Chặn allowlist | Trả lời cấp cao nhất | Tiếp tục sau restart | Follow-up thread | Cô lập thread | Quan sát reaction | Lệnh trợ giúp | Đăng ký lệnh native |
| -------- | ------ | ----------------- | ---------- | -------------- | -------------------- | -------------------- | ---------------- | -------------- | ----------------- | ------------ | ------------------ |
| Matrix   | x      | x                 | x          | x              | x                    | x                    | x                | x              | x                 |              |                    |
| Telegram | x      | x                 | x          |                |                      |                      |                  |                |                   | x            |                    |
| Discord  | x      | x                 | x          |                |                      |                      |                  |                |                   |              | x                  |
| Slack    | x      | x                 | x          | x              | x                    | x                    | x                | x              |                   |              |                    |

Điều này giữ `qa-channel` là bộ kiểm thử hành vi sản phẩm rộng trong khi Matrix,
Telegram, và các transport live tương lai dùng chung một checklist hợp đồng
transport rõ ràng.

Để chạy một lane VM Linux dùng một lần mà không đưa Docker vào đường dẫn QA, hãy chạy:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Lệnh này khởi động một guest Multipass mới, cài đặt dependency, build OpenClaw
bên trong guest, chạy `qa suite`, rồi sao chép báo cáo QA và
summary thông thường trở lại `.artifacts/qa-e2e/...` trên host.
Nó tái sử dụng cùng hành vi chọn kịch bản như `qa suite` trên host.
Các lần chạy suite trên host và Multipass thực thi nhiều kịch bản đã chọn song song
với các gateway worker cô lập theo mặc định. `qa-channel` mặc định concurrency
4, được giới hạn bởi số lượng kịch bản đã chọn. Dùng `--concurrency <count>` để tinh chỉnh
số lượng worker, hoặc `--concurrency 1` để chạy tuần tự.
Lệnh thoát với mã khác 0 khi bất kỳ kịch bản nào fail. Dùng `--allow-failures` khi
bạn muốn có artifact mà không đặt mã thoát fail.
Các lần chạy live chuyển tiếp những đầu vào QA auth được hỗ trợ và thiết thực cho
guest: key provider dựa trên env, đường dẫn config provider live QA, và
`CODEX_HOME` khi có. Giữ `--output-dir` dưới repo root để guest
có thể ghi ngược lại thông qua workspace được mount.

## Tham chiếu QA Telegram, Discord, và Slack

Matrix có một [trang riêng](/vi/concepts/qa-matrix) vì số lượng kịch bản và việc provisioning homeserver dựa trên Docker. Telegram, Discord, và Slack nhỏ hơn - mỗi loại chỉ có một vài kịch bản, không có hệ thống profile, chạy trên các kênh thật đã tồn tại - nên tham chiếu của chúng nằm ở đây.

### Flag CLI dùng chung

Các lane này đăng ký thông qua `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` và chấp nhận cùng các flag:

| Flag                                  | Mặc định                                                        | Mô tả                                                                                                                 |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | Chỉ chạy kịch bản này. Có thể lặp lại.                                                                                |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Nơi ghi report/summary/tin nhắn quan sát được và output log. Đường dẫn tương đối được resolve theo `--repo-root`.     |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Repo root khi gọi từ một cwd trung lập.                                                                               |
| `--sut-account <id>`                  | `sut`                                                           | Id tài khoản tạm thời bên trong config QA Gateway.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` hoặc `live-frontier` (`live-openai` legacy vẫn hoạt động).                                              |
| `--model <ref>` / `--alt-model <ref>` | mặc định của provider                                           | Ref model chính/thay thế.                                                                                             |
| `--fast`                              | tắt                                                             | Chế độ nhanh của provider khi được hỗ trợ.                                                                            |
| `--credential-source <env\|convex>`   | `env`                                                           | Xem [pool credential Convex](#convex-credential-pool).                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` trong CI, nếu không là `maintainer`                        | Role được dùng khi `--credential-source convex`.                                                                      |

Mỗi lane thoát với mã khác 0 khi có bất kỳ kịch bản nào fail. `--allow-failures` ghi artifact mà không đặt mã thoát fail.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Nhắm tới một nhóm Telegram riêng tư thật với hai bot riêng biệt (driver + SUT). Bot SUT phải có username Telegram; quan sát bot-to-bot hoạt động tốt nhất khi cả hai bot đều bật **Bot-to-Bot Communication Mode** trong `@BotFather`.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - id chat dạng số (chuỗi).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Tùy chọn:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` giữ nội dung tin nhắn trong artifact tin nhắn quan sát được (mặc định redact).

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
- `telegram-qa-summary.json` - bao gồm RTT theo từng reply (driver gửi → quan sát reply của SUT) bắt đầu từ canary.
- `telegram-qa-observed-messages.json` - body được redact trừ khi `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Nhắm tới một kênh guild Discord riêng tư thật với hai bot: một bot driver do harness điều khiển và một bot SUT được khởi động bởi Gateway OpenClaw con thông qua Plugin Discord đi kèm. Xác minh xử lý mention trong kênh, rằng bot SUT đã đăng ký lệnh native `/help` với Discord, và các kịch bản bằng chứng Mantis opt-in.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - phải khớp với id người dùng bot SUT do Discord trả về (nếu không lane sẽ fail nhanh).

Tùy chọn:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` giữ nội dung tin nhắn trong artifact tin nhắn quan sát được.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` chọn kênh voice/stage cho `discord-voice-autojoin`; nếu không có, kịch bản chọn kênh voice/stage hiển thị đầu tiên cho bot SUT.

Kịch bản (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - kịch bản thoại cần chọn tham gia. Tự chạy độc lập, bật `channels.discord.voice.autoJoin`, và xác minh trạng thái thoại Discord hiện tại của bot SUT là kênh thoại/sân khấu đích. Thông tin xác thực Convex Discord có thể bao gồm `voiceChannelId` tùy chọn; nếu không, trình chạy sẽ phát hiện kênh thoại/sân khấu hiển thị đầu tiên trong guild.
- `discord-status-reactions-tool-only` - kịch bản Mantis cần chọn tham gia. Tự chạy độc lập vì nó chuyển SUT sang trả lời guild luôn bật, chỉ dùng công cụ với `messages.statusReactions.enabled=true`, sau đó ghi lại timeline phản ứng REST cùng các artifact trực quan HTML/PNG. Báo cáo Mantis trước/sau cũng giữ lại artifact MP4 do kịch bản cung cấp dưới dạng `baseline.mp4` và `candidate.mp4`.

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
- `discord-qa-observed-messages.json` - nội dung được biên tập lại trừ khi `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` và `discord-status-reactions-tool-only-timeline.png` khi kịch bản phản ứng trạng thái chạy.

### QA Slack

```bash
pnpm openclaw qa slack
```

Nhắm đến một kênh Slack riêng tư thật với hai bot riêng biệt: một bot điều khiển do harness kiểm soát và một bot SUT do Gateway OpenClaw con khởi động thông qua Plugin Slack đi kèm.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Tùy chọn:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` giữ nội dung tin nhắn trong artifact tin nhắn quan sát được.

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
- `slack-qa-observed-messages.json` - nội dung được biên tập lại trừ khi `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Thiết lập workspace Slack

Lane này cần hai ứng dụng Slack riêng biệt trong một workspace, cộng với một kênh mà cả hai bot đều là thành viên:

- `channelId` - id `Cxxxxxxxxxx` của kênh mà cả hai bot đã được mời vào. Hãy dùng một kênh riêng cho mục đích này; lane sẽ đăng bài trong mỗi lần chạy.
- `driverBotToken` - token bot (`xoxb-...`) của ứng dụng **Driver**.
- `sutBotToken` - token bot (`xoxb-...`) của ứng dụng **SUT**, phải là một ứng dụng Slack riêng với driver để id người dùng bot của nó khác biệt.
- `sutAppToken` - token cấp ứng dụng (`xapp-...`) của ứng dụng SUT với `connections:write`, được Socket Mode sử dụng để ứng dụng SUT có thể nhận sự kiện.

Nên dùng một workspace Slack dành riêng cho QA thay vì dùng lại workspace production.

Manifest SUT bên dưới cố ý thu hẹp bản cài đặt production của Plugin Slack đi kèm (`extensions/slack/src/setup-shared.ts:10`) xuống các quyền và sự kiện được bộ Slack QA trực tiếp bao phủ. Với thiết lập kênh production như người dùng nhìn thấy, xem [thiết lập nhanh kênh Slack](/vi/channels/slack#quick-setup); cặp QA Driver/SUT được tách riêng có chủ đích vì lane cần hai id người dùng bot riêng biệt trong cùng một workspace.

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

Sao chép _Bot User OAuth Token_ (`xoxb-...`) - giá trị đó trở thành `driverBotToken`. Driver chỉ cần đăng tin nhắn và tự định danh; không cần sự kiện, không cần Socket Mode.

**2. Tạo ứng dụng SUT**

Lặp lại _Create New App → From a manifest_ trong cùng workspace. Ứng dụng QA này cố ý dùng một phiên bản hẹp hơn của manifest production của Plugin Slack đi kèm (`extensions/slack/src/setup-shared.ts:10`): scope và sự kiện phản ứng bị lược bỏ vì bộ Slack QA trực tiếp chưa bao phủ xử lý phản ứng.

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

Sau khi Slack tạo ứng dụng, làm hai việc trên trang cài đặt của ứng dụng:

- _Install to Workspace_ → sao chép _Bot User OAuth Token_ → giá trị đó trở thành `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → thêm scope `connections:write` → lưu → sao chép giá trị `xapp-...` → giá trị đó trở thành `sutAppToken`.

Xác minh hai bot có id người dùng khác nhau bằng cách gọi `auth.test` trên từng token. Runtime phân biệt driver và SUT theo id người dùng; dùng lại một ứng dụng cho cả hai sẽ làm mention-gating thất bại ngay lập tức.

**3. Tạo kênh**

Trong workspace QA, tạo một kênh (ví dụ `#openclaw-qa`) và mời cả hai bot từ bên trong kênh:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Sao chép id `Cxxxxxxxxxx` từ _channel info → About → Channel ID_ - giá trị đó trở thành `channelId`. Kênh công khai cũng được; nếu bạn dùng kênh riêng tư, cả hai ứng dụng đã có `groups:history` nên các lượt đọc lịch sử của harness vẫn sẽ thành công.

**4. Đăng ký thông tin xác thực**

Có hai tùy chọn. Dùng env var để gỡ lỗi trên một máy (đặt bốn biến `OPENCLAW_QA_SLACK_*` và truyền `--credential-source env`), hoặc seed pool Convex dùng chung để CI và các maintainer khác có thể thuê chúng.

Với pool Convex, ghi bốn trường vào một tệp JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Sau khi export `OPENCLAW_QA_CONVEX_SITE_URL` và `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` trong shell của bạn, đăng ký và xác minh:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Kỳ vọng `count: 1`, `status: "active"`, không có trường `lease`.

**5. Xác minh đầu cuối**

Chạy lane cục bộ để xác nhận cả hai bot có thể trò chuyện với nhau qua broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Một lần chạy xanh hoàn tất trong chưa đến 30 giây và `slack-qa-report.md` hiển thị cả `slack-canary` và `slack-mention-gating` ở trạng thái `pass`. Nếu lane treo trong khoảng 90 giây rồi thoát với `Convex credential pool exhausted for kind "slack"`, thì pool đang trống hoặc mọi hàng đều đã được thuê - `qa credentials list --kind slack --status all --json` sẽ cho bạn biết trường hợp nào.

### Pool thông tin xác thực Convex

Các lane Telegram, Discord và Slack có thể thuê thông tin xác thực từ pool Convex dùng chung thay vì đọc các env var ở trên. Truyền `--credential-source convex` (hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab lấy một lease độc quyền, gửi heartbeat cho lease đó trong suốt thời gian chạy, và giải phóng khi tắt. Các loại pool là `"telegram"`, `"discord"` và `"slack"`.

Các dạng payload mà broker xác thực trên `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` phải là chuỗi chat-id dạng số.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` phải khớp `^[A-Z][A-Z0-9]+$` (một id Slack như `Cxxxxxxxxxx`). Xem [thiết lập workspace Slack](#setting-up-the-slack-workspace) để cấp phát ứng dụng và scope.

Các env var vận hành và hợp đồng endpoint broker Convex nằm trong [Kiểm thử → Thông tin xác thực Telegram dùng chung qua Convex](/vi/help/testing#shared-telegram-credentials-via-convex-v1) (tên phần có trước hỗ trợ Discord; ngữ nghĩa broker giống hệt cho cả hai loại).

## Seed dựa trên repo

Tài sản seed nằm trong `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Các tệp này được đưa vào git có chủ đích để kế hoạch QA hiển thị cho cả con người và agent.

`qa-lab` nên tiếp tục là trình chạy markdown chung. Mỗi tệp markdown kịch bản là nguồn sự thật cho một lần chạy kiểm thử và nên định nghĩa:

- metadata kịch bản
- metadata tùy chọn về danh mục, năng lực, lane và rủi ro
- tham chiếu docs và mã
- yêu cầu Plugin tùy chọn
- bản vá cấu hình Gateway tùy chọn
- `qa-flow` có thể thực thi

Bề mặt runtime tái sử dụng đứng sau `qa-flow` được phép tiếp tục là chung và cắt ngang nhiều mảng. Ví dụ, các kịch bản markdown có thể kết hợp helper phía transport với helper phía trình duyệt điều khiển Control UI nhúng thông qua seam `browser.request` của Gateway mà không cần thêm trình chạy xử lý trường hợp đặc biệt.

Các tệp kịch bản nên được nhóm theo năng lực sản phẩm thay vì thư mục cây nguồn. Giữ ổn định ID kịch bản khi di chuyển tệp; dùng `docsRefs` và `codeRefs` để truy vết triển khai.

Danh sách baseline nên đủ rộng để bao phủ:

- trò chuyện DM và kênh
- hành vi thread
- vòng đời thao tác tin nhắn
- callback cron
- truy hồi bộ nhớ
- chuyển đổi model
- bàn giao subagent
- đọc repo và đọc docs
- một tác vụ build nhỏ như Lobster Invaders

## Lane mock nhà cung cấp

`qa suite` có hai lane mock nhà cung cấp cục bộ:

- `mock-openai` là mock OpenClaw nhận biết kịch bản. Nó vẫn là lane mock xác định mặc định cho QA dựa trên repo và các cổng tương đương.
- `aimock` khởi động một máy chủ nhà cung cấp dựa trên AIMock cho phạm vi bao phủ thử nghiệm về giao thức, fixture, ghi/phát lại và chaos. Nó mang tính bổ sung và không thay thế bộ điều phối kịch bản `mock-openai`.

Triển khai lane nhà cung cấp nằm dưới `extensions/qa-lab/src/providers/`. Mỗi nhà cung cấp sở hữu các mặc định, khởi động máy chủ cục bộ, cấu hình model Gateway, nhu cầu staging auth-profile, và cờ năng lực trực tiếp/mock của mình. Mã suite dùng chung và Gateway nên định tuyến qua registry nhà cung cấp thay vì rẽ nhánh theo tên nhà cung cấp.

## Adapter transport

`qa-lab` sở hữu một seam truyền tải chung cho các kịch bản QA bằng markdown. `qa-channel` là adapter đầu tiên trên seam đó, nhưng mục tiêu thiết kế rộng hơn: các kênh thực hoặc tổng hợp trong tương lai nên cắm vào cùng trình chạy bộ kiểm thử thay vì thêm một trình chạy QA dành riêng cho truyền tải.

Ở cấp kiến trúc, phần tách biệt là:

- `qa-lab` sở hữu việc thực thi kịch bản chung, đồng thời worker, ghi artifact và báo cáo.
- Adapter truyền tải sở hữu cấu hình Gateway, trạng thái sẵn sàng, quan sát inbound và outbound, hành động truyền tải và trạng thái truyền tải đã chuẩn hóa.
- Các tệp kịch bản Markdown trong `qa/scenarios/` định nghĩa lần chạy kiểm thử; `qa-lab` cung cấp bề mặt runtime có thể tái sử dụng để thực thi chúng.

### Thêm một kênh

Thêm một kênh vào hệ thống QA Markdown yêu cầu đúng hai việc:

1. Một adapter truyền tải cho kênh.
2. Một gói kịch bản kiểm tra hợp đồng của kênh.

Không thêm một gốc lệnh QA cấp cao mới khi host `qa-lab` dùng chung có thể sở hữu luồng.

`qa-lab` sở hữu cơ chế host dùng chung:

- gốc lệnh `openclaw qa`
- khởi động và dọn dẹp bộ kiểm thử
- đồng thời worker
- ghi artifact
- tạo báo cáo
- thực thi kịch bản
- alias tương thích cho các kịch bản `qa-channel` cũ hơn

Các Plugin runner sở hữu hợp đồng truyền tải:

- cách `openclaw qa <runner>` được gắn bên dưới gốc `qa` dùng chung
- cách Gateway được cấu hình cho truyền tải đó
- cách kiểm tra trạng thái sẵn sàng
- cách các sự kiện inbound được chèn vào
- cách các tin nhắn outbound được quan sát
- cách transcript và trạng thái truyền tải đã chuẩn hóa được hiển thị
- cách các hành động có truyền tải hậu thuẫn được thực thi
- cách xử lý reset hoặc dọn dẹp dành riêng cho truyền tải

Mức tối thiểu để áp dụng cho một kênh mới:

1. Giữ `qa-lab` làm chủ sở hữu của gốc `qa` dùng chung.
2. Triển khai runner truyền tải trên seam host `qa-lab` dùng chung.
3. Giữ cơ chế dành riêng cho truyền tải bên trong Plugin runner hoặc harness của kênh.
4. Gắn runner dưới dạng `openclaw qa <runner>` thay vì đăng ký một lệnh gốc cạnh tranh. Các Plugin runner nên khai báo `qaRunners` trong `openclaw.plugin.json` và xuất một mảng `qaRunnerCliRegistrations` tương ứng từ `runtime-api.ts`. Giữ `runtime-api.ts` nhẹ; CLI lazy và thực thi runner nên nằm sau các entrypoint riêng.
5. Viết hoặc điều chỉnh các kịch bản Markdown trong các thư mục `qa/scenarios/` theo chủ đề.
6. Dùng các trình trợ giúp kịch bản chung cho kịch bản mới.
7. Giữ các alias tương thích hiện có hoạt động trừ khi repo đang thực hiện một lần di trú có chủ đích.

Quy tắc quyết định rất nghiêm ngặt:

- Nếu hành vi có thể được biểu đạt một lần trong `qa-lab`, hãy đặt nó trong `qa-lab`.
- Nếu hành vi phụ thuộc vào một truyền tải kênh, hãy giữ nó trong Plugin runner đó hoặc harness Plugin.
- Nếu một kịch bản cần một năng lực mới mà nhiều kênh có thể dùng, hãy thêm trình trợ giúp chung thay vì một nhánh dành riêng cho kênh trong `suite.ts`.
- Nếu một hành vi chỉ có ý nghĩa với một truyền tải, hãy giữ kịch bản dành riêng cho truyền tải và thể hiện rõ điều đó trong hợp đồng kịch bản.

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

Các alias tương thích vẫn có sẵn cho những kịch bản hiện có - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - nhưng khi viết kịch bản mới nên dùng các tên chung. Các alias tồn tại để tránh một lần di trú bắt buộc cùng lúc, không phải là mô hình về sau.

## Báo cáo

`qa-lab` xuất một báo cáo giao thức Markdown từ timeline bus đã quan sát.
Báo cáo nên trả lời:

- Điều gì đã hoạt động
- Điều gì đã thất bại
- Điều gì vẫn bị chặn
- Những kịch bản theo dõi nào đáng thêm vào

Để xem danh mục các kịch bản có sẵn - hữu ích khi ước lượng công việc theo dõi hoặc nối một truyền tải mới - chạy `pnpm openclaw qa coverage` (thêm `--json` để có đầu ra máy đọc được).

Để kiểm tra nhân vật và phong cách, chạy cùng kịch bản trên nhiều ref mô hình live
và viết một báo cáo Markdown đã được chấm:

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

Lệnh này chạy các tiến trình con Gateway QA cục bộ, không phải Docker. Các kịch bản đánh giá nhân vật
nên đặt persona thông qua `SOUL.md`, rồi chạy các lượt người dùng thông thường
như trò chuyện, trợ giúp workspace và các tác vụ tệp nhỏ. Không nên cho mô hình ứng viên
biết rằng nó đang được đánh giá. Lệnh giữ lại từng transcript đầy đủ,
ghi lại thống kê chạy cơ bản, rồi yêu cầu các mô hình giám khảo ở chế độ nhanh với
suy luận `xhigh` nếu được hỗ trợ để xếp hạng các lần chạy theo độ tự nhiên, vibe và sự hài hước.
Dùng `--blind-judge-models` khi so sánh các nhà cung cấp: prompt giám khảo vẫn nhận
mọi transcript và trạng thái chạy, nhưng các ref ứng viên được thay bằng nhãn trung lập
như `candidate-01`; báo cáo ánh xạ các xếp hạng trở lại ref thật sau
khi phân tích.
Các lần chạy ứng viên mặc định dùng suy nghĩ `high`, với `medium` cho GPT-5.5 và `xhigh`
cho các ref đánh giá OpenAI cũ hơn có hỗ trợ. Ghi đè một ứng viên cụ thể inline bằng
`--model provider/model,thinking=<level>`. `--thinking <level>` vẫn đặt một
fallback toàn cục, và dạng cũ hơn `--model-thinking <provider/model=level>` được
giữ để tương thích.
Các ref ứng viên OpenAI mặc định dùng chế độ nhanh để xử lý ưu tiên được dùng ở nơi
nhà cung cấp hỗ trợ. Thêm `,fast`, `,no-fast`, hoặc `,fast=false` inline khi một
ứng viên hoặc giám khảo riêng lẻ cần ghi đè. Chỉ truyền `--fast` khi bạn muốn
ép bật chế độ nhanh cho mọi mô hình ứng viên. Thời lượng của ứng viên và giám khảo
được ghi trong báo cáo để phân tích benchmark, nhưng prompt giám khảo nói rõ
không xếp hạng theo tốc độ.
Các lần chạy mô hình ứng viên và giám khảo đều mặc định đồng thời 16. Giảm
`--concurrency` hoặc `--judge-concurrency` khi giới hạn nhà cung cấp hoặc áp lực Gateway
cục bộ làm lần chạy quá nhiễu.
Khi không truyền ứng viên `--model`, đánh giá nhân vật mặc định dùng
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, và
`google/gemini-3.1-pro-preview` khi không truyền `--model`.
Khi không truyền `--judge-model`, các giám khảo mặc định là
`openai/gpt-5.5,thinking=xhigh,fast` và
`anthropic/claude-opus-4-6,thinking=high`.

## Tài liệu liên quan

- [QA ma trận](/vi/concepts/qa-matrix)
- [Kênh QA](/vi/channels/qa-channel)
- [Kiểm thử](/vi/help/testing)
- [Bảng điều khiển](/vi/web/dashboard)
