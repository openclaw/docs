---
read_when:
    - Tìm hiểu cách ngăn xếp QA phối hợp với nhau
    - Mở rộng qa-lab, qa-channel hoặc bộ điều hợp truyền tải
    - Thêm các kịch bản kiểm thử chất lượng dựa trên kho mã nguồn
    - Xây dựng tự động hóa QA có độ chân thực cao hơn quanh bảng điều khiển Gateway
summary: 'Tổng quan về ngăn xếp QA: qa-lab, qa-channel, các kịch bản dựa trên kho lưu trữ, các lane truyền tải trực tiếp, bộ chuyển đổi truyền tải và báo cáo.'
title: Tổng quan về QA
x-i18n:
    generated_at: "2026-04-29T22:38:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: b62a5081fc2b67333f2ec6f3469e97043f048d5912858b9d8cc565c2e5fc8de2
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Ngăn xếp QA riêng tư nhằm kiểm thử OpenClaw theo cách thực tế hơn,
mang hình dạng kênh hơn so với một kiểm thử đơn vị đơn lẻ.

Các phần hiện tại:

- `extensions/qa-channel`: kênh tin nhắn tổng hợp với các bề mặt DM, kênh, luồng,
  phản ứng, chỉnh sửa và xóa.
- `extensions/qa-lab`: giao diện gỡ lỗi và bus QA để quan sát bản ghi hội thoại,
  chèn tin nhắn đến và xuất báo cáo Markdown.
- `extensions/qa-matrix`, các Plugin chạy trong tương lai: bộ điều hợp truyền tải trực tiếp
  điều khiển một kênh thật bên trong Gateway QA con.
- `qa/`: tài nguyên hạt giống được hỗ trợ bởi repo cho tác vụ khởi động và các
  kịch bản QA cơ sở.

## Bề mặt lệnh

Mọi luồng QA chạy dưới `pnpm openclaw qa <subcommand>`. Nhiều luồng có bí danh script `pnpm qa:*`;
cả hai dạng đều được hỗ trợ.

| Lệnh                                                | Mục đích                                                                                                                                                              |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Tự kiểm tra QA đi kèm; ghi báo cáo Markdown.                                                                                                                          |
| `qa suite`                                          | Chạy các kịch bản được hỗ trợ bởi repo trên làn Gateway QA. Bí danh: `pnpm openclaw qa suite --runner multipass` cho một VM Linux dùng một lần.                       |
| `qa coverage`                                       | In bản kiểm kê phạm vi kịch bản dạng markdown (`--json` cho đầu ra máy đọc).                                                                                          |
| `qa parity-report`                                  | So sánh hai tệp `qa-suite-summary.json` và ghi báo cáo cổng tương đồng tác nhân.                                                                                       |
| `qa character-eval`                                 | Chạy kịch bản QA nhân vật trên nhiều mô hình trực tiếp với báo cáo được đánh giá. Xem [Báo cáo](#reporting).                                                          |
| `qa manual`                                         | Chạy một prompt dùng một lần trên làn provider/model đã chọn.                                                                                                          |
| `qa ui`                                             | Khởi động giao diện gỡ lỗi QA và bus QA cục bộ (bí danh: `pnpm qa:lab:ui`).                                                                                            |
| `qa docker-build-image`                             | Xây dựng image Docker QA được dựng sẵn.                                                                                                                               |
| `qa docker-scaffold`                                | Ghi scaffold docker-compose cho bảng điều khiển QA + làn Gateway.                                                                                                      |
| `qa up`                                             | Xây dựng trang QA, khởi động ngăn xếp dựa trên Docker, in URL (bí danh: `pnpm qa:lab:up`; biến thể `:fast` thêm `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Chỉ khởi động máy chủ provider AIMock.                                                                                                                                |
| `qa mock-openai`                                    | Chỉ khởi động máy chủ provider `mock-openai` nhận biết kịch bản.                                                                                                       |
| `qa credentials doctor` / `add` / `list` / `remove` | Quản lý nhóm thông tin xác thực Convex dùng chung.                                                                                                                     |
| `qa matrix`                                         | Làn truyền tải trực tiếp trên homeserver Tuwunel dùng một lần. Xem [QA Matrix](/vi/concepts/qa-matrix).                                                                  |
| `qa telegram`                                       | Làn truyền tải trực tiếp trên một nhóm Telegram riêng tư thật.                                                                                                         |
| `qa discord`                                        | Làn truyền tải trực tiếp trên một kênh guild Discord riêng tư thật.                                                                                                    |

## Luồng vận hành

Luồng vận hành QA hiện tại là một trang QA hai khung:

- Bên trái: bảng điều khiển Gateway (Control UI) với agent.
- Bên phải: QA Lab, hiển thị bản ghi kiểu Slack và kế hoạch kịch bản.

Chạy bằng:

```bash
pnpm qa:lab:up
```

Lệnh đó xây dựng trang QA, khởi động làn Gateway dựa trên Docker và hiển thị
trang QA Lab, nơi người vận hành hoặc vòng lặp tự động hóa có thể giao cho agent một
nhiệm vụ QA, quan sát hành vi kênh thật và ghi lại những gì hoạt động, thất bại hoặc
vẫn bị chặn.

Để lặp nhanh hơn với giao diện QA Lab mà không cần xây dựng lại image Docker mỗi lần,
hãy khởi động ngăn xếp với gói QA Lab được bind-mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` giữ các dịch vụ Docker trên một image dựng sẵn và bind-mount
`extensions/qa-lab/web/dist` vào container `qa-lab`. `qa:lab:watch`
xây dựng lại gói đó khi có thay đổi, và trình duyệt tự động tải lại khi hash tài nguyên QA Lab
thay đổi.

Để chạy smoke trace OpenTelemetry cục bộ, hãy chạy:

```bash
pnpm qa:otel:smoke
```

Script đó khởi động bộ nhận trace OTLP/HTTP cục bộ, chạy kịch bản QA
`otel-trace-smoke` với Plugin `diagnostics-otel` được bật, sau đó
giải mã các span protobuf đã xuất và kiểm tra hình dạng trọng yếu cho phát hành:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` và `openclaw.message.delivery` phải có mặt;
các lệnh gọi mô hình không được xuất `StreamAbandoned` trên các lượt thành công; ID chẩn đoán thô và
thuộc tính `openclaw.content.*` phải nằm ngoài trace. Nó ghi
`otel-smoke-summary.json` cạnh các artifact bộ QA.

QA khả năng quan sát chỉ giữ trong checkout nguồn. Tarball npm cố ý bỏ qua
QA Lab, nên các làn phát hành Docker gói không chạy lệnh `qa`. Dùng
`pnpm qa:otel:smoke` từ một checkout nguồn đã build khi thay đổi phần đo lường
chẩn đoán.

Đối với làn smoke Matrix dùng truyền tải thật, hãy chạy:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Tham chiếu CLI đầy đủ, danh mục profile/kịch bản, biến môi trường và bố cục artifact cho làn này nằm trong [QA Matrix](/vi/concepts/qa-matrix). Tóm tắt: nó cấp phát một homeserver Tuwunel dùng một lần trong Docker, đăng ký người dùng driver/SUT/observer tạm thời, chạy Plugin Matrix thật bên trong Gateway QA con được giới hạn cho truyền tải đó (không có `qa-channel`), rồi ghi báo cáo Markdown, tóm tắt JSON, artifact sự kiện quan sát được và nhật ký đầu ra kết hợp dưới `.artifacts/qa-e2e/matrix-<timestamp>/`.

Đối với các làn smoke Telegram và Discord dùng truyền tải thật:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Cả hai nhắm tới một kênh thật đã tồn tại với hai bot (driver + SUT). Các biến môi trường bắt buộc, danh sách kịch bản, artifact đầu ra và nhóm thông tin xác thực Convex được ghi tài liệu trong [Tham chiếu QA Telegram và Discord](#telegram-and-discord-qa-reference) bên dưới.

Trước khi dùng thông tin xác thực trực tiếp trong nhóm, hãy chạy:

```bash
pnpm openclaw qa credentials doctor
```

Doctor kiểm tra môi trường broker Convex, xác thực thiết lập endpoint và xác minh khả năng truy cập admin/list khi có secret bảo trì viên. Nó chỉ báo cáo trạng thái đã đặt/thiếu cho secret.

## Phạm vi truyền tải trực tiếp

Các làn truyền tải trực tiếp dùng chung một hợp đồng thay vì mỗi làn tự tạo hình dạng danh sách kịch bản riêng. `qa-channel` là bộ kiểm thử hành vi sản phẩm tổng hợp rộng và không thuộc ma trận phạm vi truyền tải trực tiếp.

| Làn      | Canary | Chặn theo mention | Bot-to-bot | Chặn allowlist | Trả lời cấp cao nhất | Tiếp tục sau khởi động lại | Theo dõi luồng | Cô lập luồng | Quan sát phản ứng | Lệnh trợ giúp | Đăng ký lệnh native |
| -------- | ------ | ----------------- | ---------- | -------------- | -------------------- | -------------------------- | -------------- | ------------ | ------------------ | ------------ | ------------------- |
| Matrix   | x      | x                 | x          | x              | x                    | x                          | x              | x            | x                  |              |                     |
| Telegram | x      | x                 | x          |                |                      |                            |                |              |                    | x            |                     |
| Discord  | x      | x                 | x          |                |                      |                            |                |              |                    |              | x                   |

Điều này giữ `qa-channel` là bộ kiểm thử hành vi sản phẩm rộng, trong khi Matrix,
Telegram và các truyền tải trực tiếp trong tương lai dùng chung một checklist
hợp đồng truyền tải rõ ràng.

Đối với làn VM Linux dùng một lần mà không đưa Docker vào đường dẫn QA, hãy chạy:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Lệnh này khởi động một guest Multipass mới, cài đặt phụ thuộc, xây dựng OpenClaw
bên trong guest, chạy `qa suite`, rồi sao chép báo cáo QA và tóm tắt thông thường
trở lại `.artifacts/qa-e2e/...` trên host.
Nó dùng lại cùng hành vi chọn kịch bản như `qa suite` trên host.
Các lần chạy bộ kiểm thử trên host và Multipass mặc định thực thi nhiều kịch bản đã chọn song song
với các worker Gateway cô lập. `qa-channel` mặc định concurrency
4, bị giới hạn bởi số lượng kịch bản đã chọn. Dùng `--concurrency <count>` để điều chỉnh
số lượng worker, hoặc `--concurrency 1` để thực thi nối tiếp.
Lệnh thoát khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi
bạn muốn artifact mà không có mã thoát thất bại.
Các lần chạy trực tiếp chuyển tiếp những đầu vào xác thực QA được hỗ trợ và thực tế cho
guest: khóa provider dựa trên env, đường dẫn cấu hình provider trực tiếp QA và
`CODEX_HOME` khi có. Giữ `--output-dir` dưới gốc repo để guest
có thể ghi ngược qua workspace đã mount.

## Tham chiếu QA Telegram và Discord

Matrix có một [trang riêng](/vi/concepts/qa-matrix) vì số lượng kịch bản và việc cấp phát homeserver dựa trên Docker. Telegram và Discord nhỏ hơn — mỗi loại chỉ có một vài kịch bản, không có hệ thống profile, chạy trên các kênh thật đã tồn tại — nên phần tham chiếu của chúng nằm ở đây.

### Cờ CLI dùng chung

Cả hai làn đều đăng ký thông qua `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` và chấp nhận cùng các cờ:

| Cờ                                    | Mặc định                                                 | Mô tả                                                                                                                          |
| ------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `--scenario <id>`                     | —                                                         | Chỉ chạy kịch bản này. Có thể lặp lại.                                                                                        |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Nơi ghi báo cáo/tóm tắt/tin nhắn đã quan sát và nhật ký đầu ra. Đường dẫn tương đối được phân giải theo `--repo-root`.       |
| `--repo-root <path>`                  | `process.cwd()`                                           | Gốc repository khi gọi từ cwd trung lập.                                                                                      |
| `--sut-account <id>`                  | `sut`                                                     | ID tài khoản tạm thời trong cấu hình QA gateway.                                                                               |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` hoặc `live-frontier` (`live-openai` cũ vẫn hoạt động).                                                          |
| `--model <ref>` / `--alt-model <ref>` | mặc định của nhà cung cấp                                 | Tham chiếu mô hình chính/thay thế.                                                                                            |
| `--fast`                              | tắt                                                       | Chế độ nhanh của nhà cung cấp khi được hỗ trợ.                                                                                |
| `--credential-source <env\|convex>`   | `env`                                                     | Xem [Nhóm thông tin xác thực Convex](#convex-credential-pool).                                                               |
| `--credential-role <maintainer\|ci>`  | `ci` trong CI, nếu không thì `maintainer`                 | Vai trò được dùng khi `--credential-source convex`.                                                                            |

Cả hai đều thoát khác 0 khi có bất kỳ kịch bản nào thất bại. `--allow-failures` ghi tạo tác mà không đặt mã thoát thất bại.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Nhắm đến một nhóm Telegram riêng tư thật với hai bot riêng biệt (driver + SUT). Bot SUT phải có tên người dùng Telegram; quan sát bot-với-bot hoạt động tốt nhất khi cả hai bot đều bật **Chế độ giao tiếp bot-với-bot** trong `@BotFather`.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — ID chat dạng số (chuỗi).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Tùy chọn:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` giữ nội dung tin nhắn trong tạo tác tin nhắn đã quan sát (mặc định biên tập ẩn).

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
- `telegram-qa-summary.json` — bao gồm RTT theo từng phản hồi (driver gửi → quan sát phản hồi SUT) bắt đầu từ canary.
- `telegram-qa-observed-messages.json` — nội dung bị biên tập ẩn trừ khi `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Nhắm đến một kênh guild Discord riêng tư thật với hai bot: một bot driver do harness điều khiển và một bot SUT do Gateway OpenClaw con khởi động thông qua Plugin Discord đi kèm. Xác minh xử lý nhắc đến kênh và việc bot SUT đã đăng ký lệnh `/help` gốc với Discord.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — phải khớp với ID người dùng bot SUT do Discord trả về (nếu không lane sẽ thất bại nhanh).

Tùy chọn:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` giữ nội dung tin nhắn trong tạo tác tin nhắn đã quan sát.

Kịch bản (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

Tạo tác đầu ra:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — nội dung bị biên tập ẩn trừ khi `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.

### Nhóm thông tin xác thực Convex

Cả lane Telegram và Discord đều có thể thuê thông tin xác thực từ một nhóm Convex dùng chung thay vì đọc các biến env ở trên. Truyền `--credential-source convex` (hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab nhận một lease độc quyền, gửi Heartbeat cho lease đó trong suốt thời gian chạy và giải phóng khi tắt. Các loại trong pool là `"telegram"` và `"discord"`.

Dạng payload mà broker xác thực trên `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` phải là chuỗi chat-id dạng số.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Các biến env vận hành và hợp đồng endpoint của broker Convex nằm trong [Kiểm thử → Thông tin xác thực Telegram dùng chung qua Convex](/vi/help/testing#shared-telegram-credentials-via-convex-v1) (tên phần có trước hỗ trợ Discord; ngữ nghĩa broker giống hệt cho cả hai loại).

## Seed dựa trên repository

Tài sản seed nằm trong `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Những mục này được cố ý đưa vào git để kế hoạch QA hiển thị cho cả con người và agent.

`qa-lab` nên tiếp tục là một runner markdown chung. Mỗi tệp markdown kịch bản là nguồn sự thật cho một lần chạy kiểm thử và nên định nghĩa:

- metadata kịch bản
- metadata tùy chọn về danh mục, capability, lane và rủi ro
- tham chiếu tài liệu và mã
- yêu cầu Plugin tùy chọn
- bản vá cấu hình Gateway tùy chọn
- `qa-flow` có thể thực thi

Bề mặt runtime tái sử dụng hỗ trợ `qa-flow` được phép tiếp tục mang tính chung và xuyên suốt. Ví dụ, các kịch bản markdown có thể kết hợp helper phía transport với helper phía trình duyệt điều khiển Control UI nhúng thông qua seam `browser.request` của Gateway mà không cần thêm runner trường hợp đặc biệt.

Các tệp kịch bản nên được nhóm theo capability sản phẩm thay vì thư mục cây nguồn. Giữ ID kịch bản ổn định khi di chuyển tệp; dùng `docsRefs` và `codeRefs` để truy vết triển khai.

Danh sách baseline nên đủ rộng để bao phủ:

- chat DM và kênh
- hành vi thread
- vòng đời hành động tin nhắn
- callback Cron
- truy hồi bộ nhớ
- chuyển đổi mô hình
- bàn giao subagent
- đọc repository và đọc tài liệu
- một tác vụ build nhỏ như Lobster Invaders

## Lane mock nhà cung cấp

`qa suite` có hai lane mock nhà cung cấp cục bộ:

- `mock-openai` là mock OpenClaw nhận biết kịch bản. Nó vẫn là lane mock tất định mặc định cho QA dựa trên repository và các cổng tương đương.
- `aimock` khởi động một máy chủ nhà cung cấp dựa trên AIMock cho phạm vi bao phủ thử nghiệm về giao thức, fixture, ghi/phát lại và hỗn loạn. Nó là phần bổ sung và không thay thế dispatcher kịch bản `mock-openai`.

Triển khai lane nhà cung cấp nằm trong `extensions/qa-lab/src/providers/`. Mỗi nhà cung cấp sở hữu mặc định, khởi động máy chủ cục bộ, cấu hình mô hình Gateway, nhu cầu staging auth-profile và cờ capability live/mock của riêng mình. Mã suite và Gateway dùng chung nên định tuyến qua registry nhà cung cấp thay vì rẽ nhánh theo tên nhà cung cấp.

## Adapter transport

`qa-lab` sở hữu một seam transport chung cho các kịch bản QA markdown. `qa-channel` là adapter đầu tiên trên seam đó, nhưng mục tiêu thiết kế rộng hơn: các kênh thật hoặc tổng hợp trong tương lai nên cắm vào cùng runner suite thay vì thêm một runner QA riêng cho transport.

Ở cấp kiến trúc, phần tách là:

- `qa-lab` sở hữu thực thi kịch bản chung, đồng thời worker, ghi tạo tác và báo cáo.
- Adapter transport sở hữu cấu hình Gateway, trạng thái sẵn sàng, quan sát đầu vào và đầu ra, hành động transport và trạng thái transport đã chuẩn hóa.
- Các tệp kịch bản markdown trong `qa/scenarios/` định nghĩa lần chạy kiểm thử; `qa-lab` cung cấp bề mặt runtime tái sử dụng để thực thi chúng.

### Thêm một kênh

Thêm một kênh vào hệ thống QA markdown yêu cầu đúng hai thứ:

1. Một adapter transport cho kênh.
2. Một gói kịch bản kiểm thử hợp đồng kênh.

Không thêm một root lệnh QA cấp cao mới khi host `qa-lab` dùng chung có thể sở hữu luồng.

`qa-lab` sở hữu cơ chế host dùng chung:

- root lệnh `openclaw qa`
- khởi động và tháo dỡ suite
- đồng thời worker
- ghi tạo tác
- tạo báo cáo
- thực thi kịch bản
- alias tương thích cho các kịch bản `qa-channel` cũ hơn

Runner Plugin sở hữu hợp đồng transport:

- cách `openclaw qa <runner>` được mount bên dưới root `qa` dùng chung
- cách Gateway được cấu hình cho transport đó
- cách kiểm tra trạng thái sẵn sàng
- cách sự kiện đầu vào được tiêm vào
- cách quan sát tin nhắn đầu ra
- cách transcript và trạng thái transport đã chuẩn hóa được phơi bày
- cách thực thi hành động dựa trên transport
- cách xử lý reset hoặc cleanup riêng theo transport

Ngưỡng áp dụng tối thiểu cho một kênh mới:

1. Giữ `qa-lab` là chủ sở hữu của root `qa` dùng chung.
2. Triển khai runner transport trên seam host `qa-lab` dùng chung.
3. Giữ cơ chế riêng theo transport bên trong runner Plugin hoặc channel harness.
4. Mount runner dưới dạng `openclaw qa <runner>` thay vì đăng ký một root command cạnh tranh. Runner Plugin nên khai báo `qaRunners` trong `openclaw.plugin.json` và xuất mảng `qaRunnerCliRegistrations` tương ứng từ `runtime-api.ts`. Giữ `runtime-api.ts` nhẹ; CLI lazy và thực thi runner nên nằm sau các entrypoint riêng.
5. Tạo mới hoặc điều chỉnh kịch bản markdown trong các thư mục `qa/scenarios/` theo chủ đề.
6. Dùng các helper kịch bản chung cho kịch bản mới.
7. Giữ các alias tương thích hiện có hoạt động trừ khi repository đang thực hiện một cuộc di trú có chủ ý.

Quy tắc quyết định nghiêm ngặt:

- Nếu hành vi có thể được biểu đạt một lần trong `qa-lab`, hãy đặt nó trong `qa-lab`.
- Nếu hành vi phụ thuộc vào một transport kênh, giữ nó trong runner Plugin hoặc plugin harness đó.
- Nếu một kịch bản cần capability mới mà nhiều hơn một kênh có thể dùng, thêm helper chung thay vì nhánh riêng theo kênh trong `suite.ts`.
- Nếu một hành vi chỉ có ý nghĩa với một transport, giữ kịch bản riêng theo transport và nêu rõ điều đó trong hợp đồng kịch bản.

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

Các alias tương thích vẫn khả dụng cho kịch bản hiện có — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — nhưng tác giả kịch bản mới nên dùng tên chung. Các alias tồn tại để tránh một đợt di trú đồng loạt, không phải là mô hình trong tương lai.

## Báo cáo

`qa-lab` xuất một báo cáo giao thức Markdown từ dòng thời gian bus đã quan sát.
Báo cáo nên trả lời:

- Điều gì đã hoạt động
- Điều gì đã thất bại
- Điều gì vẫn bị chặn
- Những kịch bản theo dõi nào đáng thêm

Để xem danh mục các kịch bản có sẵn — hữu ích khi ước lượng công việc tiếp theo hoặc đấu nối một phương thức truyền tải mới — hãy chạy `pnpm openclaw qa coverage` (thêm `--json` để có đầu ra máy có thể đọc được).

Để kiểm tra nhân vật và phong cách, hãy chạy cùng một kịch bản trên nhiều tham chiếu mô hình trực tiếp
và ghi một báo cáo Markdown đã được chấm đánh giá:

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

Lệnh này chạy các tiến trình con Gateway QA cục bộ, không phải Docker. Các kịch bản đánh giá nhân vật nên đặt persona thông qua `SOUL.md`, rồi chạy các lượt người dùng thông thường như trò chuyện, trợ giúp workspace và tác vụ tệp nhỏ. Không nên cho mô hình ứng viên biết rằng nó đang được đánh giá. Lệnh giữ lại từng transcript đầy đủ, ghi lại thống kê chạy cơ bản, rồi yêu cầu các mô hình giám khảo ở chế độ nhanh với suy luận `xhigh` ở nơi được hỗ trợ để xếp hạng các lượt chạy theo độ tự nhiên, vibe và sự hài hước. Dùng `--blind-judge-models` khi so sánh các nhà cung cấp: prompt giám khảo vẫn nhận mọi transcript và trạng thái chạy, nhưng các tham chiếu ứng viên được thay bằng nhãn trung lập như `candidate-01`; báo cáo ánh xạ thứ hạng trở lại tham chiếu thật sau khi phân tích cú pháp.
Các lượt chạy ứng viên mặc định dùng thinking `high`, với `medium` cho GPT-5.5 và `xhigh` cho các tham chiếu đánh giá OpenAI cũ hơn có hỗ trợ. Ghi đè một ứng viên cụ thể ngay trong dòng bằng `--model provider/model,thinking=<level>`. `--thinking <level>` vẫn đặt fallback toàn cục, và dạng cũ hơn `--model-thinking <provider/model=level>` được giữ để tương thích.
Các tham chiếu ứng viên OpenAI mặc định dùng chế độ nhanh để sử dụng xử lý ưu tiên ở nơi nhà cung cấp hỗ trợ. Thêm `,fast`, `,no-fast`, hoặc `,fast=false` ngay trong dòng khi một ứng viên hoặc giám khảo riêng lẻ cần ghi đè. Chỉ truyền `--fast` khi bạn muốn buộc bật chế độ nhanh cho mọi mô hình ứng viên. Thời lượng của ứng viên và giám khảo đều được ghi trong báo cáo để phân tích benchmark, nhưng prompt giám khảo nói rõ không xếp hạng theo tốc độ.
Các lượt chạy mô hình ứng viên và giám khảo đều mặc định dùng concurrency 16. Giảm `--concurrency` hoặc `--judge-concurrency` khi giới hạn của nhà cung cấp hoặc áp lực Gateway cục bộ khiến lượt chạy quá nhiễu.
Khi không truyền ứng viên `--model`, đánh giá nhân vật mặc định dùng
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, và
`google/gemini-3.1-pro-preview` khi không truyền `--model`.
Khi không truyền `--judge-model`, các giám khảo mặc định dùng
`openai/gpt-5.5,thinking=xhigh,fast` và
`anthropic/claude-opus-4-6,thinking=high`.

## Tài liệu liên quan

- [QA ma trận](/vi/concepts/qa-matrix)
- [Kênh QA](/vi/channels/qa-channel)
- [Kiểm thử](/vi/help/testing)
- [Bảng điều khiển](/vi/web/dashboard)
