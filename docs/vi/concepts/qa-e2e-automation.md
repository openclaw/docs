---
read_when:
    - Hiểu cách ngăn xếp QA khớp nối với nhau
    - Mở rộng qa-lab, qa-channel hoặc bộ điều hợp truyền tải
    - Thêm các kịch bản QA dựa trên repo
    - Xây dựng tự động hóa QA có độ chân thực cao hơn xung quanh bảng điều khiển Gateway
summary: 'Tổng quan về ngăn xếp QA: qa-lab, qa-channel, các kịch bản dựa trên repo, các làn truyền tải trực tiếp, bộ điều hợp truyền tải và báo cáo.'
title: Tổng quan về QA
x-i18n:
    generated_at: "2026-06-27T17:25:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cc1e4c3f496e409b93d2ca2d3bf8107e5fe3bea37f89cc92d1936109f0f4e36
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Ngăn xếp QA riêng tư nhằm kiểm thử OpenClaw theo cách thực tế hơn,
có hình dạng giống kênh hơn so với một kiểm thử đơn vị đơn lẻ.

Các phần hiện tại:

- `extensions/qa-channel`: kênh tin nhắn tổng hợp với các bề mặt DM, kênh, luồng,
  phản ứng, chỉnh sửa và xóa.
- `extensions/qa-lab`: giao diện gỡ lỗi và bus QA để quan sát bản ghi hội thoại,
  chèn tin nhắn đi vào và xuất báo cáo Markdown.
- `extensions/qa-matrix`, các plugin chạy trong tương lai: bộ chuyển đổi live-transport
  điều khiển một kênh thật bên trong Gateway QA con.
- `qa/`: tài sản seed được hậu thuẫn bởi repo cho tác vụ khởi động và các kịch bản QA
  đường cơ sở.
- [Mantis](/vi/concepts/mantis): xác minh live trước và sau cho các lỗi
  cần transport thật, ảnh chụp màn hình trình duyệt, trạng thái VM và bằng chứng PR.

## Bề mặt lệnh

Mọi luồng QA chạy dưới `pnpm openclaw qa <subcommand>`. Nhiều luồng có bí danh script `pnpm qa:*`;
cả hai dạng đều được hỗ trợ.

| Lệnh                                                | Mục đích                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Tự kiểm tra QA được đóng gói không có `--qa-profile`; trình chạy hồ sơ độ trưởng thành dựa trên taxonomy với `--qa-profile smoke-ci`, `--qa-profile release`, hoặc `--qa-profile all`.                                                                                 |
| `qa suite`                                          | Chạy các kịch bản được hậu thuẫn bởi repo trên lane Gateway QA. Bí danh: `pnpm openclaw qa suite --runner multipass` cho một Linux VM dùng một lần.                                                                                                                     |
| `qa coverage`                                       | In kho kiểm kê coverage kịch bản YAML (`--json` cho đầu ra máy).                                                                                                                                                                                                        |
| `qa parity-report`                                  | So sánh hai tệp `qa-suite-summary.json` và ghi báo cáo parity kiểu agentic, hoặc dùng `--runtime-axis --token-efficiency` để ghi báo cáo parity runtime Codex-vs-OpenClaw và hiệu quả token từ một bản tóm tắt cặp runtime.                                            |
| `qa character-eval`                                 | Chạy kịch bản QA nhân vật trên nhiều model live với báo cáo được chấm. Xem [Báo cáo](#reporting).                                                                                                                                                                       |
| `qa manual`                                         | Chạy prompt một lần trên lane provider/model đã chọn.                                                                                                                                                                                                                   |
| `qa ui`                                             | Khởi động giao diện gỡ lỗi QA và bus QA cục bộ (bí danh: `pnpm qa:lab:ui`).                                                                                                                                                                                             |
| `qa docker-build-image`                             | Build image Docker QA dựng sẵn.                                                                                                                                                                                                                                         |
| `qa docker-scaffold`                                | Ghi scaffold docker-compose cho dashboard QA + lane Gateway.                                                                                                                                                                                                            |
| `qa up`                                             | Build site QA, khởi động ngăn xếp được hậu thuẫn bởi Docker, in URL (bí danh: `pnpm qa:lab:up`; biến thể `:fast` thêm `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                         |
| `qa aimock`                                         | Chỉ khởi động server provider AIMock.                                                                                                                                                                                                                                   |
| `qa mock-openai`                                    | Chỉ khởi động server provider `mock-openai` có nhận biết kịch bản.                                                                                                                                                                                                      |
| `qa credentials doctor` / `add` / `list` / `remove` | Quản lý pool thông tin xác thực Convex dùng chung.                                                                                                                                                                                                                      |
| `qa matrix`                                         | Lane transport live trên homeserver Tuwunel dùng một lần. Xem [QA Matrix](/vi/concepts/qa-matrix).                                                                                                                                                                        |
| `qa telegram`                                       | Lane transport live trên một nhóm Telegram riêng tư thật.                                                                                                                                                                                                               |
| `qa discord`                                        | Lane transport live trên một kênh guild Discord riêng tư thật.                                                                                                                                                                                                          |
| `qa slack`                                          | Lane transport live trên một kênh Slack riêng tư thật.                                                                                                                                                                                                                  |
| `qa whatsapp`                                       | Lane transport live trên các tài khoản WhatsApp Web thật.                                                                                                                                                                                                               |
| `qa mantis`                                         | Trình chạy xác minh trước và sau cho lỗi transport live, với bằng chứng status-reactions Discord, smoke desktop/trình duyệt Crabbox và smoke Slack-in-VNC. Xem [Mantis](/vi/concepts/mantis) và [Runbook Mantis Slack Desktop](/vi/concepts/mantis-slack-desktop-runbook). |

`qa run` được hậu thuẫn bởi hồ sơ đọc membership từ `taxonomy.yaml`, rồi điều phối
các kịch bản đã phân giải qua `qa suite`. `--surface` và
`--category` lọc hồ sơ đã chọn thay vì định nghĩa các lane riêng.
`qa-evidence.json` kết quả bao gồm bản tóm tắt scorecard hồ sơ với
số lượng category đã chọn và các ID coverage còn thiếu; các mục bằng chứng
riêng lẻ vẫn là nguồn sự thật cho các kiểm thử, vai trò coverage và kết quả.
ID coverage tính năng taxonomy là mục tiêu bằng chứng chính xác, không phải bí danh. Coverage
kịch bản chính đáp ứng các ID khớp; coverage phụ vẫn chỉ mang tính tư vấn.
ID coverage dùng dạng `namespace.behavior` có dấu chấm với các đoạn chữ-số/dấu gạch ngang
viết thường; ID hồ sơ, surface và category vẫn có thể dùng
các ID taxonomy có gạch ngang hoặc dấu chấm hiện có.
Bằng chứng gọn bỏ qua `execution` theo từng mục và đặt `evidenceMode: "slim"`;
`smoke-ci` mặc định dùng chế độ gọn, và `--evidence-mode full` khôi phục các mục đầy đủ:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Dùng `smoke-ci` cho bằng chứng hồ sơ xác định với các provider model mock và
server provider giả Crabline. Dùng `release` cho bằng chứng Stable/LTS trên các kênh
live. Chỉ dùng `all` cho các lần chạy bằng chứng toàn taxonomy tường minh; nó chọn
mọi category độ trưởng thành đang hoạt động và có thể được điều phối qua workflow `QA Profile
Evidence` với `qa_profile=all`. Khi một lệnh cũng cần một hồ sơ gốc OpenClaw,
đặt hồ sơ gốc trước lệnh QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Luồng operator

Luồng operator QA hiện tại là một site QA hai khung:

- Trái: dashboard Gateway (Control UI) với agent.
- Phải: QA Lab, hiển thị bản ghi hội thoại kiểu Slack và kế hoạch kịch bản.

Chạy bằng:

```bash
pnpm qa:lab:up
```

Lệnh đó build site QA, khởi động lane Gateway được hậu thuẫn bởi Docker và mở
trang QA Lab nơi một operator hoặc vòng lặp tự động hóa có thể giao cho agent một nhiệm vụ QA,
quan sát hành vi kênh thật và ghi lại những gì hoạt động, thất bại hoặc
vẫn bị chặn.

Để lặp nhanh hơn trên giao diện QA Lab cục bộ mà không phải rebuild image Docker mỗi lần,
hãy khởi động ngăn xếp với bundle QA Lab được bind-mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` giữ các dịch vụ Docker trên image dựng sẵn và bind-mount
`extensions/qa-lab/web/dist` vào container `qa-lab`. `qa:lab:watch`
rebuild bundle đó khi có thay đổi, và trình duyệt tự động tải lại khi hash tài sản QA Lab
thay đổi.

Để smoke tín hiệu OpenTelemetry cục bộ, chạy:

```bash
pnpm qa:otel:smoke
```

Script đó khởi động một receiver OTLP/HTTP cục bộ, chạy kịch bản QA `otel-trace-smoke`
với plugin `diagnostics-otel` được bật, rồi assert rằng trace,
metric và log được xuất. Nó giải mã các span trace protobuf đã xuất
và kiểm tra hình dạng quan trọng cho release:
`openclaw.run`, `openclaw.harness.run`, span gọi model theo semantic-convention GenAI mới nhất,
`openclaw.context.assembled` và `openclaw.message.delivery`
phải hiện diện. Smoke ép buộc
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, nên span gọi model
phải dùng tên `{gen_ai.operation.name} {gen_ai.request.model}`;
các lần gọi model không được xuất `StreamAbandoned` trên các lượt thành công; ID chẩn đoán thô và
thuộc tính `openclaw.content.*` phải không xuất hiện trong trace. Payload OTLP thô
không được chứa sentinel prompt, sentinel phản hồi hoặc khóa phiên QA.
Nó ghi `otel-smoke-summary.json` cạnh các artifact của bộ QA.

Để smoke OpenTelemetry có collector hậu thuẫn, chạy:

```bash
pnpm qa:otel:collector-smoke
```

Lane đó đặt một container Docker OpenTelemetry Collector thật phía trước
cùng receiver cục bộ. Dùng nó khi thay đổi nối dây endpoint, khả năng tương thích collector
hoặc hành vi xuất OTLP mà receiver trong tiến trình có thể che khuất.

Để smoke scrape Prometheus được bảo vệ, chạy:

```bash
pnpm qa:prometheus:smoke
```

Alias đó chạy kịch bản QA `docker-prometheus-smoke` với
`diagnostics-prometheus` được bật, xác minh các lượt scrape chưa xác thực bị từ chối,
rồi kiểm tra lượt scrape đã xác thực có bao gồm các họ chỉ số tối quan trọng cho bản phát hành
mà không có nội dung prompt, nội dung phản hồi, mã định danh chẩn đoán thô, token xác thực
hoặc đường dẫn cục bộ.

Để chạy liên tiếp cả hai kiểm thử smoke về khả năng quan sát, dùng:

```bash
pnpm qa:observability:smoke
```

Đối với làn OpenTelemetry có collector hỗ trợ cùng kiểm thử smoke scrape Prometheus được bảo vệ,
dùng:

```bash
pnpm qa:observability:collector-smoke
```

QA khả năng quan sát chỉ chạy từ checkout mã nguồn. Tarball npm cố ý bỏ qua
QA Lab, nên các làn phát hành Docker theo gói không chạy lệnh `qa`. Dùng
`pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke`, hoặc
`pnpm qa:observability:smoke` từ một checkout mã nguồn đã build khi thay đổi
phần đo lường chẩn đoán.

Đối với một làn smoke Matrix dùng transport thật nhưng không yêu cầu thông tin xác thực
nhà cung cấp mô hình, hãy chạy hồ sơ nhanh với nhà cung cấp OpenAI giả lập xác định:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Đối với làn nhà cung cấp live-frontier, cung cấp rõ ràng thông tin xác thực tương thích OpenAI:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

Tham chiếu CLI đầy đủ, danh mục hồ sơ/kịch bản, biến môi trường và bố cục artifact cho làn này nằm trong [QA Matrix](/vi/concepts/qa-matrix). Nhìn nhanh: nó cấp phát một homeserver Tuwunel dùng một lần trong Docker, đăng ký người dùng driver/SUT/observer tạm thời, chạy Plugin Matrix thật bên trong một Gateway QA con được giới hạn cho transport đó (không có `qa-channel`), rồi ghi báo cáo Markdown, tóm tắt JSON, artifact sự kiện đã quan sát và nhật ký đầu ra kết hợp dưới `.artifacts/qa-e2e/matrix-<timestamp>/`.

Các kịch bản bao phủ hành vi transport mà kiểm thử đơn vị không thể chứng minh từ đầu đến cuối: cổng mention, chính sách cho phép bot, danh sách cho phép, trả lời cấp cao nhất và theo luồng, định tuyến DM, xử lý reaction, chặn chỉnh sửa đầu vào, khử trùng lặp replay sau khởi động lại, khôi phục khi homeserver gián đoạn, gửi metadata phê duyệt, xử lý media, và các luồng khởi tạo/khôi phục/xác minh Matrix E2EE. Hồ sơ CLI E2EE cũng chạy `openclaw matrix encryption setup` và các lệnh xác minh qua cùng homeserver dùng một lần trước khi kiểm tra phản hồi Gateway.

Discord cũng có các kịch bản chỉ Mantis, bật theo lựa chọn, để tái hiện lỗi. Dùng
`--scenario discord-status-reactions-tool-only` cho dòng thời gian reaction trạng thái rõ ràng,
hoặc `--scenario discord-thread-reply-filepath-attachment` để tạo một luồng Discord thật và xác minh rằng `message.thread-reply` giữ nguyên một tệp đính kèm
`filePath`. Các kịch bản này không nằm trong làn Discord live mặc định
vì chúng là các phép dò tái hiện trước/sau thay vì phạm vi smoke rộng.
Quy trình Mantis cho tệp đính kèm trong luồng cũng có thể thêm video nhân chứng Discord Web
đã đăng nhập khi `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` hoặc
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` được cấu hình trong môi trường QA.
Hồ sơ viewer đó chỉ dùng để ghi hình trực quan; quyết định đạt/không đạt
vẫn đến từ oracle REST của Discord.

CI dùng cùng bề mặt lệnh trong `.github/workflows/qa-live-transports-convex.yml`.
Các lần chạy theo lịch và thủ công mặc định thực thi hồ sơ Matrix nhanh với
thông tin xác thực live-frontier do QA cung cấp, `--fast`, và
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Chạy thủ công với `matrix_profile=all` sẽ tách
thành năm shard hồ sơ.

Đối với các làn smoke transport thật của Telegram, Discord, Slack và WhatsApp:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Chúng nhắm tới một kênh thật đã tồn tại với hai bot hoặc tài khoản (driver + SUT). Các biến môi trường bắt buộc, danh sách kịch bản, artifact đầu ra và nhóm thông tin xác thực Convex được ghi lại trong [tham chiếu QA Telegram, Discord, Slack và WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) bên dưới.

Đối với một lần chạy VM desktop Slack đầy đủ với cứu hộ VNC, chạy:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Lệnh đó thuê một máy Crabbox desktop/browser, chạy làn live Slack
bên trong VM, mở Slack Web trong trình duyệt VNC, chụp desktop và
sao chép `slack-qa/`, `slack-desktop-smoke.png`, và `slack-desktop-smoke.mp4`
khi có khả năng ghi video trở lại thư mục artifact Mantis. Các lease Crabbox
desktop/browser cung cấp sẵn công cụ ghi hình và các gói hỗ trợ browser/native-build,
nên kịch bản chỉ nên cài fallback trên các lease cũ hơn. Mantis báo cáo thời gian tổng và theo từng pha trong
`mantis-slack-desktop-smoke-report.md` để các lần chạy chậm cho thấy thời gian nằm ở
khâu làm nóng lease, lấy thông tin xác thực, thiết lập từ xa, hay sao chép artifact. Tái sử dụng
`--lease-id <cbx_...>` sau khi đăng nhập thủ công vào Slack Web qua VNC;
các lease được tái sử dụng cũng giữ ấm cache pnpm store của Crabbox. Mặc định
`--hydrate-mode source` xác minh từ checkout mã nguồn và chạy cài đặt/build
bên trong VM. Chỉ dùng `--hydrate-mode prehydrated` khi workspace từ xa được tái sử dụng
đã có `node_modules` và `dist/` đã build; chế độ đó bỏ qua bước
cài đặt/build tốn kém và thất bại theo hướng an toàn khi workspace chưa sẵn sàng.
Với `--gateway-setup`, Mantis để lại một Gateway Slack OpenClaw bền vững
đang chạy bên trong VM trên cổng `38973`; nếu không có nó, lệnh chạy làn QA Slack
bot-với-bot thông thường và thoát sau khi ghi artifact.

Để chứng minh UI phê duyệt Slack native bằng bằng chứng desktop, chạy chế độ checkpoint phê duyệt Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Chế độ này loại trừ lẫn nhau với `--gateway-setup`. Nó chạy các kịch bản
phê duyệt Slack, từ chối id kịch bản không phải phê duyệt, chờ ở mỗi trạng thái phê duyệt
đang chờ và đã giải quyết, render thông điệp Slack API quan sát được vào
`approval-checkpoints/<scenario>-pending.png` và
`approval-checkpoints/<scenario>-resolved.png`, rồi thất bại nếu thiếu hoặc rỗng bất kỳ checkpoint,
bằng chứng thông điệp, xác nhận, hoặc ảnh chụp màn hình đã render nào.
Các lease CI nguội vẫn có thể hiển thị màn hình đăng nhập Slack trong `slack-desktop-smoke.png`;
các ảnh checkpoint phê duyệt là bằng chứng trực quan cho làn này.

Checklist cho operator, lệnh dispatch workflow GitHub, hợp đồng bình luận bằng chứng,
bảng quyết định hydrate-mode, diễn giải thời gian, và các bước xử lý lỗi nằm trong [Runbook Mantis Slack Desktop](/vi/concepts/mantis-slack-desktop-runbook).

Đối với một tác vụ desktop kiểu agent/CV, chạy:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` thuê hoặc tái sử dụng một máy Crabbox desktop/browser, khởi động
`crabbox record --while`, điều khiển trình duyệt hiển thị qua một
`visual-driver` lồng nhau, chụp `visual-task.png`, chạy `openclaw infer image describe`
trên ảnh chụp màn hình khi `--vision-mode image-describe` được chọn, và
ghi `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json`, và `mantis-visual-task-report.md`.
Khi `--expect-text` được đặt, prompt thị giác yêu cầu một phán quyết JSON có cấu trúc
và chỉ đạt khi mô hình báo cáo bằng chứng hiển thị tích cực; một phản hồi
phủ định chỉ trích dẫn văn bản mục tiêu sẽ làm assertion thất bại.
Dùng `--vision-mode metadata` cho một smoke không dùng mô hình, chứng minh desktop,
trình duyệt, ảnh chụp màn hình và đường ống video mà không gọi nhà cung cấp
hiểu hình ảnh. Ghi hình là artifact bắt buộc cho `visual-task`; nếu Crabbox không ghi
được `visual-task.mp4` không rỗng, tác vụ thất bại ngay cả khi visual driver
đã đạt. Khi thất bại, Mantis giữ lease cho VNC trừ khi tác vụ đã
đạt và `--keep-lease` không được đặt.

Trước khi dùng thông tin xác thực live trong pool, chạy:

```bash
pnpm openclaw qa credentials doctor
```

Doctor kiểm tra môi trường broker Convex, xác thực thiết lập endpoint, và xác minh khả năng truy cập admin/list khi có secret maintainer. Nó chỉ báo cáo trạng thái đã đặt/thiếu cho secret.

## Phạm vi transport live

Các làn transport live dùng chung một hợp đồng thay vì mỗi làn tự phát minh hình dạng danh sách kịch bản riêng. `qa-channel` là bộ kiểm thử rộng về hành vi sản phẩm tổng hợp và không thuộc ma trận phạm vi transport live.

Runner transport live nên import các id kịch bản dùng chung, helper phạm vi
baseline, và helper chọn kịch bản từ
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Làn      | Canary | Cổng mention | Bot-với-bot | Chặn danh sách cho phép | Trả lời cấp cao nhất | Trả lời trích dẫn | Tiếp tục sau khởi động lại | Theo dõi luồng | Cô lập luồng | Quan sát reaction | Lệnh trợ giúp | Đăng ký lệnh native |
| -------- | ------ | ------------ | ----------- | ----------------------- | -------------------- | ----------------- | -------------------------- | -------------- | ------------ | ----------------- | ------------ | ------------------- |
| Matrix   | x      | x            | x           | x                       | x                    |                   | x                          | x              | x            | x                 |              |                     |
| Telegram | x      | x            | x           |                         |                      |                   |                            |                |              |                   | x            |                     |
| Discord  | x      | x            | x           |                         |                      |                   |                            |                |              |                   |              | x                   |
| Slack    | x      | x            | x           | x                       | x                    |                   | x                          | x              | x            |                   |              |                     |
| WhatsApp | x      | x            |             | x                       | x                    | x                 | x                          |                |              | x                 | x            |                     |

Điều này giữ `qa-channel` làm bộ kiểm thử rộng về hành vi sản phẩm trong khi Matrix,
Telegram, và các transport live khác dùng chung một checklist hợp đồng transport rõ ràng.

Đối với một làn VM Linux dùng một lần mà không đưa Docker vào đường dẫn QA, chạy:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Lệnh này khởi động một guest Multipass mới, cài đặt phụ thuộc, build OpenClaw
bên trong guest, chạy `qa suite`, rồi sao chép báo cáo QA và
tóm tắt thông thường trở lại `.artifacts/qa-e2e/...` trên host.
Nó tái sử dụng cùng hành vi chọn kịch bản như `qa suite` trên host.
Các lần chạy bộ kiểm thử trên host và Multipass thực thi nhiều kịch bản được chọn song song
với các worker Gateway cô lập theo mặc định. `qa-channel` mặc định concurrency
4, bị giới hạn bởi số kịch bản được chọn. Dùng `--concurrency <count>` để điều chỉnh
số worker, hoặc `--concurrency 1` để chạy tuần tự.
Dùng `--pack personal-agent` để chạy gói benchmark trợ lý cá nhân. Bộ chọn
gói có tính cộng dồn với các cờ `--scenario` lặp lại: các kịch bản rõ ràng
chạy trước, rồi các kịch bản trong gói chạy theo thứ tự gói, với bản trùng lặp bị loại bỏ.
Dùng `--pack observability` khi một runner QA tùy chỉnh đã cung cấp thiết lập
OpenTelemetry collector và muốn chọn cùng lúc các kịch bản smoke chẩn đoán
OpenTelemetry và Prometheus.
Lệnh thoát khác không khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi
bạn muốn có artifact mà không có mã thoát thất bại.
Các lần chạy live chuyển tiếp các đầu vào xác thực QA được hỗ trợ và thực tế cho
guest: khóa nhà cung cấp dựa trên môi trường, đường dẫn cấu hình nhà cung cấp live QA, và
`CODEX_HOME` khi có. Giữ `--output-dir` dưới gốc repo để guest
có thể ghi ngược qua workspace được mount.

## Tham chiếu QA cho Telegram, Discord, Slack và WhatsApp

Matrix có một [trang riêng](/vi/concepts/qa-matrix) vì số lượng kịch bản và việc cấp phát homeserver dựa trên Docker. Telegram, Discord, Slack và WhatsApp chạy trên các transport thực có sẵn, nên phần tham chiếu của chúng nằm ở đây.

### Cờ CLI dùng chung

Các luồng này đăng ký qua `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` và chấp nhận cùng các cờ:

| Cờ                                    | Mặc định                                           | Mô tả                                                                                                                                                          |
| ------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Chỉ chạy kịch bản này. Có thể lặp lại.                                                                                                                         |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Nơi ghi báo cáo, bản tóm tắt, bằng chứng, artifact riêng của transport và nhật ký đầu ra. Đường dẫn tương đối được phân giải theo `--repo-root`.              |
| `--repo-root <path>`                  | `process.cwd()`                                    | Gốc repository khi gọi từ một cwd trung lập.                                                                                                                   |
| `--sut-account <id>`                  | `sut`                                              | ID tài khoản tạm thời bên trong cấu hình QA Gateway.                                                                                                           |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` hoặc `live-frontier` (`live-openai` cũ vẫn hoạt động).                                                                                           |
| `--model <ref>` / `--alt-model <ref>` | mặc định của nhà cung cấp                          | Tham chiếu model chính/thay thế.                                                                                                                               |
| `--fast`                              | tắt                                                | Chế độ nhanh của nhà cung cấp khi được hỗ trợ.                                                                                                                 |
| `--credential-source <env\|convex>`   | `env`                                              | Xem [nhóm thông tin xác thực Convex](#convex-credential-pool).                                                                                                 |
| `--credential-role <maintainer\|ci>`  | `ci` trong CI, ngược lại là `maintainer`           | Vai trò được dùng khi `--credential-source convex`.                                                                                                            |

Mỗi luồng thoát với mã khác 0 khi có bất kỳ kịch bản nào thất bại. `--allow-failures` ghi artifact mà không đặt mã thoát thất bại.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Nhắm tới một nhóm Telegram riêng tư thực với hai bot riêng biệt (driver + SUT). Bot SUT phải có username Telegram; quan sát bot-với-bot hoạt động tốt nhất khi cả hai bot đều bật **Bot-to-Bot Communication Mode** trong `@BotFather`.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - ID chat dạng số (chuỗi).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

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

Tập mặc định ngầm định luôn bao phủ canary, kiểm soát mention, phản hồi lệnh gốc, định tuyến lệnh và phản hồi nhóm bot-với-bot. Mặc định `mock-openai` cũng bao gồm các kiểm tra chuỗi trả lời tất định và truyền phát thông điệp cuối. `telegram-current-session-status-tool` vẫn là tùy chọn vì nó chỉ ổn định khi được nối luồng trực tiếp sau canary, không phải sau các phản hồi lệnh gốc tùy ý. Dùng `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` để in phân tách mặc định/tùy chọn hiện tại kèm tham chiếu hồi quy.

Artifact đầu ra:

- `telegram-qa-report.md`
- `qa-evidence.json` - các mục bằng chứng cho kiểm tra transport thực, bao gồm profile, phạm vi bao phủ, nhà cung cấp, kênh, artifact, kết quả và các trường RTT.

Các lần chạy Telegram dạng package dùng cùng hợp đồng thông tin xác thực Telegram. Đo RTT lặp lại là một phần của luồng package Telegram live thông thường; phân phối RTT được đưa vào `qa-evidence.json` dưới `result.timing` cho kiểm tra RTT đã chọn.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Khi đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, wrapper package live thuê một thông tin xác thực `kind: "telegram"`, xuất env nhóm/driver/bot SUT đã thuê vào lần chạy package đã cài đặt, gửi Heartbeat cho lease và giải phóng lease khi tắt. Wrapper package mặc định chạy 20 kiểm tra RTT của `telegram-mentioned-message-reply`, timeout RTT 30 giây và vai trò Convex `maintainer` bên ngoài CI khi Convex được chọn. Ghi đè `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` hoặc `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` để tinh chỉnh đo RTT mà không tạo lệnh RTT riêng hoặc định dạng tóm tắt riêng cho Telegram.

### QA Discord

```bash
pnpm openclaw qa discord
```

Nhắm tới một kênh guild Discord riêng tư thực với hai bot: một bot driver do harness điều khiển và một bot SUT do Gateway OpenClaw con khởi động thông qua Plugin Discord đi kèm. Xác minh xử lý mention trong kênh, rằng bot SUT đã đăng ký lệnh gốc `/help` với Discord, và các kịch bản bằng chứng Mantis tùy chọn.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - phải khớp với ID người dùng bot SUT do Discord trả về (nếu không luồng sẽ thất bại nhanh).

Tùy chọn:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` giữ nội dung thông điệp trong artifact thông điệp đã quan sát.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` chọn kênh voice/stage cho `discord-voice-autojoin`; nếu không có, kịch bản chọn kênh voice/stage hiển thị đầu tiên cho bot SUT.

Kịch bản (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - kịch bản voice tùy chọn. Chạy riêng, bật `channels.discord.voice.autoJoin` và xác minh trạng thái voice Discord hiện tại của bot SUT là kênh voice/stage mục tiêu. Thông tin xác thực Discord của Convex có thể bao gồm `voiceChannelId` tùy chọn; nếu không, runner phát hiện kênh voice/stage hiển thị đầu tiên trong guild.
- `discord-status-reactions-tool-only` - kịch bản Mantis tùy chọn. Chạy riêng vì nó chuyển SUT sang phản hồi guild luôn bật, chỉ dùng công cụ với `messages.statusReactions.enabled=true`, sau đó ghi lại timeline reaction REST cùng artifact trực quan HTML/PNG. Báo cáo trước/sau của Mantis cũng giữ các artifact MP4 do kịch bản cung cấp dưới dạng `baseline.mp4` và `candidate.mp4`.

Chạy rõ ràng kịch bản tự động tham gia voice Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Chạy rõ ràng kịch bản status-reaction Mantis:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

Artifact đầu ra:

- `discord-qa-report.md`
- `qa-evidence.json` - các mục bằng chứng cho kiểm tra transport thực.
- `discord-qa-observed-messages.json` - nội dung được biên tập trừ khi `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` và `discord-status-reactions-tool-only-timeline.png` khi kịch bản status-reaction chạy.

### QA Slack

```bash
pnpm openclaw qa slack
```

Nhắm tới một kênh Slack riêng tư thực với hai bot riêng biệt: một bot driver do harness điều khiển và một bot SUT do Gateway OpenClaw con khởi động thông qua Plugin Slack đi kèm.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Tùy chọn:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` giữ nội dung thông điệp trong artifact thông điệp đã quan sát.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` bật checkpoint phê duyệt trực quan cho Mantis. Runner ghi `<scenario>.pending.json` và `<scenario>.resolved.json`, rồi chờ các tệp `.ack.json` khớp.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` ghi đè timeout xác nhận checkpoint. Mặc định là `120000`.

Kịch bản (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - kịch bản phê duyệt exec Slack gốc tùy chọn. Yêu cầu phê duyệt exec qua Gateway, xác minh thông điệp Slack có nút phê duyệt gốc, giải quyết nó và xác minh bản cập nhật Slack đã giải quyết.
- `slack-approval-plugin-native` - kịch bản phê duyệt Plugin Slack gốc tùy chọn. Bật chuyển tiếp phê duyệt exec và Plugin cùng lúc để các sự kiện Plugin không bị chặn bởi định tuyến phê duyệt exec, rồi xác minh cùng đường dẫn UI Slack gốc đang chờ/đã giải quyết.

Artifact đầu ra:

- `slack-qa-report.md`
- `qa-evidence.json` - các mục bằng chứng cho kiểm tra transport thực.
- `slack-qa-observed-messages.json` - nội dung được biên tập trừ khi `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - chỉ khi Mantis đặt `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; chứa JSON checkpoint, JSON xác nhận và ảnh chụp màn hình đang chờ/đã giải quyết.

#### Thiết lập workspace Slack

Luồng này cần hai ứng dụng Slack riêng biệt trong một workspace, cùng với một kênh mà cả hai bot đều là thành viên:

- `channelId` - ID `Cxxxxxxxxxx` của kênh mà cả hai bot đã được mời vào. Dùng một kênh chuyên dụng; luồng đăng bài trong mỗi lần chạy.
- `driverBotToken` - token bot (`xoxb-...`) của ứng dụng **Driver**.
- `sutBotToken` - token bot (`xoxb-...`) của ứng dụng **SUT**, ứng dụng này phải là một ứng dụng Slack riêng với driver để ID người dùng bot của nó khác biệt.
- `sutAppToken` - token cấp ứng dụng (`xapp-...`) của ứng dụng SUT với `connections:write`, được Socket Mode dùng để ứng dụng SUT có thể nhận sự kiện.

Ưu tiên một workspace Slack dành riêng cho QA thay vì dùng lại workspace production.

Manifest SUT bên dưới cố ý thu hẹp cài đặt production của Plugin Slack đi kèm (`extensions/slack/src/setup-shared.ts:10`) còn các quyền và sự kiện được bao phủ bởi bộ QA Slack live. Để biết thiết lập kênh production như người dùng nhìn thấy, xem [thiết lập nhanh kênh Slack](/vi/channels/slack#quick-setup); cặp QA Driver/SUT được tách riêng có chủ ý vì luồng cần hai ID người dùng bot riêng biệt trong một workspace.

**1. Tạo ứng dụng Driver**

Truy cập [api.slack.com/apps](https://api.slack.com/apps) → _Tạo ứng dụng mới_ → _Từ manifest_ → chọn không gian làm việc QA, dán manifest sau, rồi _Cài đặt vào không gian làm việc_:

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

Sao chép _Bot User OAuth Token_ (`xoxb-...`) - giá trị đó trở thành `driverBotToken`. Trình điều khiển chỉ cần đăng tin nhắn và tự định danh; không cần sự kiện, không cần Socket Mode.

**2. Tạo ứng dụng SUT**

Lặp lại _Tạo ứng dụng mới → Từ manifest_ trong cùng không gian làm việc. Ứng dụng QA này cố ý dùng phiên bản hẹp hơn của manifest sản xuất từ Plugin Slack được đóng gói sẵn (`extensions/slack/src/setup-shared.ts:10`): các phạm vi và sự kiện phản ứng bị lược bỏ vì bộ Slack QA trực tiếp chưa bao phủ xử lý phản ứng.

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

Sau khi Slack tạo ứng dụng, thực hiện hai việc trên trang cài đặt của ứng dụng:

- _Cài đặt vào không gian làm việc_ → sao chép _Bot User OAuth Token_ → giá trị đó trở thành `sutBotToken`.
- _Thông tin cơ bản → Token cấp ứng dụng → Tạo token và phạm vi_ → thêm phạm vi `connections:write` → lưu → sao chép giá trị `xapp-...` → giá trị đó trở thành `sutAppToken`.

Xác minh hai bot có các id người dùng khác nhau bằng cách gọi `auth.test` trên từng token. Runtime phân biệt trình điều khiển và SUT theo id người dùng; dùng lại một ứng dụng cho cả hai sẽ làm cổng kiểm soát mention thất bại ngay lập tức.

**3. Tạo kênh**

Trong không gian làm việc QA, tạo một kênh (ví dụ `#openclaw-qa`) và mời cả hai bot từ bên trong kênh:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Sao chép id `Cxxxxxxxxxx` từ _thông tin kênh → Giới thiệu → ID kênh_ - giá trị đó trở thành `channelId`. Kênh công khai hoạt động được; nếu bạn dùng kênh riêng tư, cả hai ứng dụng đã có `groups:history` nên các lần đọc lịch sử của bộ kiểm thử vẫn sẽ thành công.

**4. Đăng ký thông tin xác thực**

Có hai tùy chọn. Dùng biến môi trường để gỡ lỗi trên một máy (đặt bốn biến `OPENCLAW_QA_SLACK_*` và truyền `--credential-source env`), hoặc seed nhóm Convex dùng chung để CI và các maintainer khác có thể thuê chúng.

Với nhóm Convex, ghi bốn trường vào một tệp JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Khi `OPENCLAW_QA_CONVEX_SITE_URL` và `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` đã được xuất trong shell của bạn, đăng ký và xác minh:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Kỳ vọng `count: 1`, `status: "active"`, không có trường `lease`.

**5. Xác minh đầu cuối**

Chạy lane cục bộ để xác nhận cả hai bot có thể trao đổi với nhau qua broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Một lần chạy xanh hoàn tất trong chưa tới 30 giây và `slack-qa-report.md` hiển thị cả `slack-canary` và `slack-mention-gating` ở trạng thái `pass`. Nếu lane bị treo khoảng 90 giây và thoát với `Convex credential pool exhausted for kind "slack"`, hoặc nhóm đang trống, hoặc mọi hàng đều đã được thuê - `qa credentials list --kind slack --status all --json` sẽ cho bạn biết trường hợp nào.

### QA WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Nhắm tới hai tài khoản WhatsApp Web chuyên dụng: một tài khoản trình điều khiển do
bộ kiểm thử điều khiển và một tài khoản SUT do Gateway OpenClaw con khởi động thông qua
Plugin WhatsApp được đóng gói sẵn.

Biến môi trường bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Tùy chọn:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` bật các kịch bản nhóm như
  `whatsapp-mention-gating` và `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` giữ lại nội dung tin nhắn trong
  các artifact tin nhắn đã quan sát.

Danh mục kịch bản (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Baseline và kiểm soát nhóm: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-top-level-reply-shape`,
  `whatsapp-restart-resume`, `whatsapp-group-allowlist-block`.
- Lệnh native: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Hành vi trả lời và đầu ra cuối: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-context-isolation`, `whatsapp-reply-delivery-shape`,
  `whatsapp-stream-final-message-accounting`.
- Phương tiện nhận vào và tin nhắn có cấu trúc: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`. Các kịch bản này gửi sự kiện hình ảnh, âm thanh,
  tài liệu, vị trí, liên hệ và sticker WhatsApp thật thông qua trình điều khiển.
- Bao phủ Gateway gửi ra ngoài và thao tác tin nhắn:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-message-actions`.
- Bao phủ kiểm soát truy cập: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Phê duyệt native: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Phản ứng trạng thái: `whatsapp-status-reactions`.

Danh mục hiện có 36 kịch bản. Lane mặc định `live-frontier` được
giữ nhỏ ở 10 kịch bản để bao phủ smoke nhanh. Lane mặc định `mock-openai`
chạy 31 kịch bản xác định qua transport WhatsApp thật trong khi chỉ
mock đầu ra mô hình. Các kịch bản phê duyệt và một vài kiểm tra nặng hơn/chặn
vẫn được gọi tường minh bằng id kịch bản.

Trình điều khiển QA WhatsApp quan sát các sự kiện trực tiếp có cấu trúc (`text`, `media`,
`location`, `reaction`, và `poll`) và có thể chủ động gửi phương tiện, poll,
liên hệ, vị trí và sticker. QA Lab nhập trình điều khiển đó thông qua bề mặt gói
`@openclaw/whatsapp/api.js` thay vì truy cập vào các tệp runtime WhatsApp riêng tư.
Nội dung tin nhắn được biên tập lại theo mặc định. Bao phủ poll gửi ra ngoài
và tải tệp lên chạy qua các lệnh gọi Gateway `poll` và `message.action`
xác định thay vì chỉ gọi công cụ bằng prompt mô hình.

Artifact đầu ra:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - các mục bằng chứng cho kiểm tra transport trực tiếp.
- `whatsapp-qa-observed-messages.json` - nội dung được biên tập lại trừ khi `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Nhóm thông tin xác thực Convex

Các lane Telegram, Discord, Slack và WhatsApp có thể thuê thông tin xác thực từ một nhóm Convex dùng chung thay vì đọc các biến môi trường ở trên. Truyền `--credential-source convex` (hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab nhận một lease độc quyền, gửi Heartbeat cho lease đó trong suốt thời gian chạy, và giải phóng lease khi tắt. Các loại nhóm là `"telegram"`, `"discord"`, `"slack"`, và `"whatsapp"`.

Các dạng payload mà broker xác thực trên `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` phải là chuỗi chat-id dạng số.
- Người dùng thật Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - chỉ dành cho bằng chứng Telegram Desktop của Mantis. Các lane QA Lab chung không được nhận loại này.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - số điện thoại phải là các chuỗi E.164 riêng biệt.

Quy trình bằng chứng Telegram Desktop của Mantis giữ một lease Convex
`telegram-user` độc quyền cho cả trình điều khiển TDLib CLI và nhân chứng Telegram Desktop,
rồi giải phóng lease đó sau khi xuất bản bằng chứng.

Khi một PR cần diff hình ảnh xác định, Mantis có thể dùng cùng câu trả lời mô hình mock
trên `main` và trên head của PR trong khi bộ định dạng Telegram hoặc lớp gửi
thay đổi. Mặc định chụp được tinh chỉnh cho bình luận PR: lớp Crabbox
chuẩn, ghi màn hình desktop 24fps, GIF chuyển động 24fps, và chiều rộng xem trước 1920px.
Bình luận trước/sau nên xuất bản một bundle sạch chỉ chứa các
GIF dự kiến.

Các lane Slack cũng có thể dùng nhóm. Kiểm tra dạng payload Slack hiện nằm trong trình chạy Slack QA thay vì broker; dùng `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, với id kênh Slack như `Cxxxxxxxxxx`. Xem [Thiết lập không gian làm việc Slack](#setting-up-the-slack-workspace) để cấp phát ứng dụng và phạm vi.

Các biến môi trường vận hành và hợp đồng endpoint broker Convex nằm trong [Kiểm thử → Thông tin xác thực Telegram dùng chung qua Convex](/vi/help/testing#shared-telegram-credentials-via-convex-v1) (tên mục này có trước nhóm đa kênh; ngữ nghĩa lease được dùng chung giữa các loại).

## Seed dựa trên repo

Tài nguyên seed nằm trong `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Chúng được cố ý lưu trong git để kế hoạch QA hiển thị với cả con người và
agent.

`qa-lab` nên tiếp tục là trình chạy kịch bản YAML chung. Mỗi tệp YAML kịch bản là
nguồn sự thật cho một lần chạy kiểm thử và nên định nghĩa:

- `title` cấp cao nhất
- siêu dữ liệu `scenario`
- siêu dữ liệu danh mục, capability, lane và rủi ro tùy chọn trong `scenario`
- tham chiếu tài liệu và mã trong `scenario`
- yêu cầu Plugin tùy chọn trong `scenario`
- bản vá cấu hình Gateway tùy chọn trong `scenario`
- `flow` cấp cao nhất có thể thực thi cho các kịch bản luồng, hoặc `scenario.execution.kind` /
  `scenario.execution.path` cho các kịch bản Vitest và Playwright

Bề mặt runtime có thể tái sử dụng đứng sau `flow` được phép giữ tính tổng quát
và xuyên suốt nhiều phần. Ví dụ, các kịch bản YAML có thể kết hợp helper phía truyền tải
với helper phía trình duyệt để điều khiển Control UI nhúng thông qua đường nối
`browser.request` của Gateway mà không cần thêm một trình chạy xử lý riêng theo trường hợp.

Các tệp kịch bản nên được nhóm theo năng lực sản phẩm thay vì thư mục trong cây mã nguồn.
Giữ ID kịch bản ổn định khi di chuyển tệp; dùng `docsRefs` và `codeRefs`
để truy vết triển khai.

Danh sách baseline nên đủ rộng để bao phủ:

- Trò chuyện tin nhắn trực tiếp và kênh
- hành vi luồng
- vòng đời hành động tin nhắn
- callback cron
- gọi lại bộ nhớ
- chuyển đổi mô hình
- bàn giao subagent
- đọc repo và đọc tài liệu
- một tác vụ build nhỏ như Lobster Invaders

## Các lane mock nhà cung cấp

`qa suite` có hai lane mock nhà cung cấp cục bộ:

- `mock-openai` là mock OpenClaw nhận biết kịch bản. Nó vẫn là lane mock
  xác định mặc định cho QA dựa trên repo và các cổng parity.
- `aimock` khởi động một máy chủ nhà cung cấp dựa trên AIMock cho phạm vi kiểm thử
  giao thức thử nghiệm, fixture, ghi/phát lại và chaos. Nó mang tính bổ sung và không
  thay thế bộ điều phối kịch bản `mock-openai`.

Triển khai lane nhà cung cấp nằm dưới `extensions/qa-lab/src/providers/`.
Mỗi nhà cung cấp sở hữu giá trị mặc định, khởi động máy chủ cục bộ, cấu hình mô hình gateway,
nhu cầu staging auth-profile và các cờ năng lực live/mock của riêng mình. Mã suite dùng chung và
gateway nên định tuyến qua registry nhà cung cấp thay vì phân nhánh theo
tên nhà cung cấp.

## Bộ điều hợp truyền tải

`qa-lab` sở hữu một đường nối truyền tải tổng quát cho các kịch bản QA YAML. `qa-channel` là
mặc định tổng hợp. `crabline` khởi động các máy chủ cục bộ có hình dạng nhà cung cấp và chạy
các Plugin kênh thông thường của OpenClaw trên chúng. `live` được dành cho thông tin xác thực
nhà cung cấp thật và các kênh bên ngoài.

Ở cấp kiến trúc, phần tách này là:

- `qa-lab` sở hữu thực thi kịch bản tổng quát, concurrency của worker, ghi artifact và báo cáo.
- Bộ điều hợp truyền tải sở hữu cấu hình gateway, trạng thái sẵn sàng, quan sát inbound và outbound, hành động truyền tải và trạng thái truyền tải đã chuẩn hóa.
- Các tệp kịch bản YAML dưới `qa/scenarios/` định nghĩa lần chạy kiểm thử; `qa-lab` cung cấp bề mặt runtime có thể tái sử dụng để thực thi chúng.

### Thêm một kênh

Thêm một kênh vào hệ thống QA YAML yêu cầu triển khai kênh cộng với
một gói kịch bản kiểm tra hợp đồng kênh. Để có phạm vi smoke trong CI, thêm
máy chủ nhà cung cấp giả Crabline tương ứng và phơi bày nó qua driver `crabline`.

Đừng thêm một gốc lệnh QA cấp cao mới khi host dùng chung `qa-lab` có thể sở hữu luồng đó.

`qa-lab` sở hữu cơ chế host dùng chung:

- gốc lệnh `openclaw qa`
- khởi động và teardown suite
- concurrency của worker
- ghi artifact
- tạo báo cáo
- thực thi kịch bản
- alias tương thích cho các kịch bản `qa-channel` cũ hơn

Các Plugin trình chạy sở hữu hợp đồng truyền tải:

- cách `openclaw qa <runner>` được mount bên dưới gốc `qa` dùng chung
- cách gateway được cấu hình cho truyền tải đó
- cách kiểm tra trạng thái sẵn sàng
- cách sự kiện inbound được inject
- cách tin nhắn outbound được quan sát
- cách transcript và trạng thái truyền tải đã chuẩn hóa được phơi bày
- cách các hành động dựa trên truyền tải được thực thi
- cách xử lý reset hoặc dọn dẹp riêng cho truyền tải

Ngưỡng chấp nhận tối thiểu cho một kênh mới:

1. Giữ `qa-lab` là chủ sở hữu của gốc `qa` dùng chung.
2. Triển khai trình chạy truyền tải trên đường nối host `qa-lab` dùng chung.
3. Giữ các cơ chế riêng cho truyền tải bên trong Plugin trình chạy hoặc harness kênh.
4. Mount trình chạy dưới dạng `openclaw qa <runner>` thay vì đăng ký một lệnh gốc cạnh tranh. Các Plugin trình chạy nên khai báo `qaRunners` trong `openclaw.plugin.json` và xuất một mảng `qaRunnerCliRegistrations` tương ứng từ `runtime-api.ts`. Giữ `runtime-api.ts` nhẹ; CLI lazy và thực thi trình chạy nên nằm sau các entrypoint riêng.
5. Viết hoặc điều chỉnh các kịch bản YAML dưới các thư mục theo chủ đề `qa/scenarios/`.
6. Dùng các helper kịch bản tổng quát cho kịch bản mới.
7. Giữ các alias tương thích hiện có hoạt động trừ khi repo đang thực hiện một migration có chủ đích.

Quy tắc quyết định rất nghiêm ngặt:

- Nếu hành vi có thể được biểu đạt một lần trong `qa-lab`, hãy đặt nó trong `qa-lab`.
- Nếu hành vi phụ thuộc vào một truyền tải kênh, hãy giữ nó trong Plugin trình chạy hoặc harness Plugin đó.
- Nếu một kịch bản cần một năng lực mới mà nhiều hơn một kênh có thể dùng, hãy thêm helper tổng quát thay vì một nhánh riêng cho kênh trong `suite.ts`.
- Nếu một hành vi chỉ có ý nghĩa với một truyền tải, hãy giữ kịch bản đó riêng cho truyền tải và nêu rõ điều đó trong hợp đồng kịch bản.

### Tên helper kịch bản

Các helper tổng quát được ưu tiên cho kịch bản mới:

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

Các alias tương thích vẫn có sẵn cho kịch bản hiện có - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - nhưng khi viết kịch bản mới nên dùng tên tổng quát. Các alias tồn tại để tránh migration đồng loạt trong một ngày, không phải là mô hình về sau.

## Báo cáo

`qa-lab` xuất một báo cáo giao thức Markdown từ timeline bus đã quan sát.
Báo cáo nên trả lời:

- Điều gì hoạt động
- Điều gì thất bại
- Điều gì vẫn bị chặn
- Những kịch bản tiếp theo nào đáng thêm vào

Để xem inventory các kịch bản có sẵn - hữu ích khi ước lượng công việc tiếp theo hoặc nối dây một truyền tải mới - chạy `pnpm openclaw qa coverage` (thêm `--json` để có đầu ra máy đọc được).
Khi chọn bằng chứng tập trung cho một hành vi hoặc đường dẫn tệp đã chạm tới, chạy `pnpm openclaw qa coverage --match <query>`.
Báo cáo match tìm trong metadata kịch bản, tham chiếu tài liệu, tham chiếu mã, ID coverage, Plugin và yêu cầu nhà cung cấp, rồi in các mục tiêu `qa suite --scenario ...` khớp.
Mỗi lần chạy `qa suite` ghi các artifact cấp cao nhất `qa-evidence.json`,
`qa-suite-summary.json` và `qa-suite-report.md` cho tập kịch bản đã chọn.
Các kịch bản khai báo `execution.kind: vitest` hoặc
`execution.kind: playwright` sẽ chạy đường dẫn kiểm thử tương ứng và cũng ghi
log theo từng kịch bản. Các kịch bản khai báo `execution.kind: script` sẽ chạy
producer bằng chứng tại `execution.path` thông qua `node --import tsx` (với
`${outputDir}` và `${scenarioId}` được mở rộng trong `execution.args`); producer
ghi `qa-evidence.json` của riêng nó, các mục trong đó được nhập vào đầu ra suite
và các đường dẫn artifact được phân giải tương đối so với
`qa-evidence.json` của producer đó. Khi truy cập `qa suite` thông qua
`qa run --qa-profile`, cùng `qa-evidence.json` đó cũng bao gồm phần tóm tắt
scorecard hồ sơ cho các danh mục taxonomy đã chọn.
Hãy xem nó như một công cụ hỗ trợ khám phá, không phải thay thế cho cổng kiểm tra; kịch bản đã chọn vẫn cần đúng chế độ nhà cung cấp, truyền tải live, Multipass, Testbox hoặc lane phát hành cho hành vi đang được kiểm thử.
Để biết ngữ cảnh scorecard, xem [Scorecard mức độ trưởng thành](/vi/maturity/scorecard).

Để kiểm tra tính cách và phong cách, chạy cùng một kịch bản trên nhiều tham chiếu mô hình live
và ghi một báo cáo Markdown đã được đánh giá:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Lệnh này chạy các tiến trình con gateway QA cục bộ, không phải Docker. Các kịch bản đánh giá tính cách
nên đặt persona thông qua `SOUL.md`, rồi chạy các lượt người dùng thông thường
như trò chuyện, hỗ trợ workspace và tác vụ tệp nhỏ. Không nên cho mô hình ứng viên
biết rằng nó đang được đánh giá. Lệnh giữ lại từng transcript đầy đủ,
ghi các thống kê chạy cơ bản, rồi yêu cầu các mô hình giám khảo ở chế độ fast với
lập luận `xhigh` nếu được hỗ trợ để xếp hạng các lần chạy theo độ tự nhiên, phong thái và sắc thái hài hước.
Dùng `--blind-judge-models` khi so sánh nhà cung cấp: prompt giám khảo vẫn nhận
mọi transcript và trạng thái chạy, nhưng tham chiếu ứng viên được thay bằng các
nhãn trung lập như `candidate-01`; báo cáo ánh xạ thứ hạng trở lại tham chiếu thật sau
khi phân tích.
Các lần chạy ứng viên mặc định dùng thinking `high`, với `medium` cho GPT-5.5 và `xhigh`
cho các tham chiếu đánh giá OpenAI cũ hơn có hỗ trợ. Ghi đè một ứng viên cụ thể inline bằng
`--model provider/model,thinking=<level>`. `--thinking <level>` vẫn đặt một
fallback toàn cục, và dạng cũ hơn `--model-thinking <provider/model=level>` được
giữ để tương thích.
Các tham chiếu ứng viên OpenAI mặc định dùng chế độ fast để sử dụng xử lý ưu tiên ở nơi
nhà cung cấp hỗ trợ. Thêm `,fast`, `,no-fast` hoặc `,fast=false` inline khi một
ứng viên hoặc giám khảo riêng lẻ cần ghi đè. Chỉ truyền `--fast` khi bạn muốn
bắt buộc bật chế độ fast cho mọi mô hình ứng viên. Thời lượng của ứng viên và giám khảo được
ghi trong báo cáo để phân tích benchmark, nhưng prompt giám khảo nêu rõ
không xếp hạng theo tốc độ.
Các lần chạy mô hình ứng viên và giám khảo đều mặc định concurrency 16. Giảm
`--concurrency` hoặc `--judge-concurrency` khi giới hạn nhà cung cấp hoặc áp lực gateway
cục bộ làm lần chạy quá nhiễu.
Khi không truyền ứng viên `--model`, đánh giá tính cách mặc định dùng
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` và
`google/gemini-3.1-pro-preview` khi không truyền `--model`.
Khi không truyền `--judge-model`, giám khảo mặc định là
`openai/gpt-5.5,thinking=xhigh,fast` và
`anthropic/claude-opus-4-8,thinking=high`.

## Tài liệu liên quan

- [QA ma trận](/vi/concepts/qa-matrix)
- [Scorecard mức độ trưởng thành](/vi/maturity/scorecard)
- [Gói benchmark tác nhân cá nhân](/vi/concepts/personal-agent-benchmark-pack)
- [Kênh QA](/vi/channels/qa-channel)
- [Kiểm thử](/vi/help/testing)
- [Bảng điều khiển](/vi/web/dashboard)
