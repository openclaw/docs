---
read_when:
    - Hiểu cách ngăn xếp QA khớp với nhau
    - Mở rộng qa-lab, qa-channel hoặc bộ điều hợp vận chuyển
    - Thêm các kịch bản QA được hỗ trợ bởi repo
    - Xây dựng tự động hóa QA có độ chân thực cao hơn quanh bảng điều khiển Gateway
summary: 'Tổng quan về ngăn xếp QA: qa-lab, qa-channel, các kịch bản dựa trên repo, các làn truyền tải trực tiếp, bộ điều hợp truyền tải và báo cáo.'
title: Tổng quan QA
x-i18n:
    generated_at: "2026-07-01T08:14:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33dc2c7ac1751c8728dda332476cd41cf39c3e9d1582f8c652c2670c2549b34c
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Ngăn xếp QA riêng tư nhằm kiểm thử OpenClaw theo cách thực tế hơn,
có hình dạng kênh rõ hơn so với một kiểm thử đơn vị đơn lẻ.

Các thành phần hiện tại:

- `extensions/qa-channel`: kênh tin nhắn tổng hợp với các bề mặt DM, kênh, chuỗi,
  phản ứng, chỉnh sửa và xóa.
- `extensions/qa-lab`: giao diện trình gỡ lỗi và bus QA để quan sát bản ghi hội thoại,
  chèn tin nhắn đến và xuất báo cáo Markdown.
- `extensions/qa-matrix`, các Plugin chạy trong tương lai: bộ chuyển đổi truyền tải trực tiếp
  điều khiển một kênh thật bên trong Gateway QA con.
- `qa/`: tài sản khởi tạo dựa trên repo cho tác vụ khởi động và các kịch bản QA
  đường cơ sở.
- [Mantis](/vi/concepts/mantis): xác minh trực tiếp trước và sau cho các lỗi
  cần truyền tải thật, ảnh chụp màn hình trình duyệt, trạng thái VM và bằng chứng PR.

## Bề mặt lệnh

Mọi luồng QA đều chạy dưới `pnpm openclaw qa <subcommand>`. Nhiều luồng có bí danh script `pnpm qa:*`;
cả hai dạng đều được hỗ trợ.

| Lệnh                                                | Mục đích                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Tự kiểm tra QA đóng gói không có `--qa-profile`; trình chạy hồ sơ trưởng thành dựa trên taxonomy với `--qa-profile smoke-ci`, `--qa-profile release`, hoặc `--qa-profile all`.                                                                                         |
| `qa suite`                                          | Chạy các kịch bản dựa trên repo trên làn Gateway QA. Bí danh: `pnpm openclaw qa suite --runner multipass` cho một VM Linux dùng một lần.                                                                                                                               |
| `qa coverage`                                       | In kho kiểm kê độ phủ kịch bản YAML (`--json` cho đầu ra máy đọc).                                                                                                                                                                                                      |
| `qa parity-report`                                  | So sánh hai tệp `qa-suite-summary.json` và ghi báo cáo tương đương agentic, hoặc dùng `--runtime-axis --token-efficiency` để ghi báo cáo tương đương runtime Codex-vs-OpenClaw và hiệu quả token từ một bản tóm tắt cặp runtime.                                        |
| `qa character-eval`                                 | Chạy kịch bản QA nhân vật trên nhiều mô hình trực tiếp với báo cáo được chấm. Xem [Báo cáo](#reporting).                                                                                                                                                                |
| `qa manual`                                         | Chạy một prompt một lần trên làn nhà cung cấp/mô hình đã chọn.                                                                                                                                                                                                          |
| `qa ui`                                             | Khởi động giao diện trình gỡ lỗi QA và bus QA cục bộ (bí danh: `pnpm qa:lab:ui`).                                                                                                                                                                                       |
| `qa docker-build-image`                             | Xây dựng ảnh Docker QA dựng sẵn.                                                                                                                                                                                                                                        |
| `qa docker-scaffold`                                | Ghi scaffold docker-compose cho bảng điều khiển QA + làn Gateway.                                                                                                                                                                                                       |
| `qa up`                                             | Xây dựng trang QA, khởi động ngăn xếp dựa trên Docker, in URL (bí danh: `pnpm qa:lab:up`; biến thể `:fast` thêm `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                |
| `qa aimock`                                         | Chỉ khởi động máy chủ nhà cung cấp AIMock.                                                                                                                                                                                                                              |
| `qa mock-openai`                                    | Chỉ khởi động máy chủ nhà cung cấp `mock-openai` nhận biết kịch bản.                                                                                                                                                                                                    |
| `qa credentials doctor` / `add` / `list` / `remove` | Quản lý nhóm thông tin xác thực Convex dùng chung.                                                                                                                                                                                                                      |
| `qa matrix`                                         | Làn truyền tải trực tiếp trên một homeserver Tuwunel dùng một lần. Xem [Matrix QA](/vi/concepts/qa-matrix).                                                                                                                                                                |
| `qa telegram`                                       | Làn truyền tải trực tiếp trên một nhóm Telegram riêng tư thật.                                                                                                                                                                                                          |
| `qa discord`                                        | Làn truyền tải trực tiếp trên một kênh guild Discord riêng tư thật.                                                                                                                                                                                                     |
| `qa slack`                                          | Làn truyền tải trực tiếp trên một kênh Slack riêng tư thật.                                                                                                                                                                                                             |
| `qa whatsapp`                                       | Làn truyền tải trực tiếp trên các tài khoản WhatsApp Web thật.                                                                                                                                                                                                          |
| `qa mantis`                                         | Trình chạy xác minh trước và sau cho lỗi truyền tải trực tiếp, với bằng chứng phản ứng trạng thái Discord, smoke desktop/trình duyệt Crabbox và smoke Slack-trong-VNC. Xem [Mantis](/vi/concepts/mantis) và [Runbook Mantis Slack Desktop](/vi/concepts/mantis-slack-desktop-runbook). |

`qa run` dựa trên hồ sơ đọc danh sách thành viên từ `taxonomy.yaml`, rồi chuyển
các kịch bản đã phân giải qua `qa suite`. `--surface` và
`--category` lọc hồ sơ đã chọn thay vì định nghĩa các làn riêng.
`qa-evidence.json` kết quả bao gồm bản tóm tắt scorecard hồ sơ với
số lượng danh mục đã chọn và các ID độ phủ bị thiếu; từng mục bằng chứng
vẫn là nguồn chân lý cho kiểm thử, vai trò độ phủ và kết quả.
ID độ phủ tính năng taxonomy là mục tiêu bằng chứng chính xác, không phải bí danh. Độ phủ
kịch bản chính đáp ứng các ID khớp; độ phủ phụ chỉ mang tính tham khảo.
ID độ phủ dùng dạng `namespace.behavior` phân tách bằng dấu chấm với các đoạn
chữ thường gồm chữ-số/dấu gạch ngang; ID hồ sơ, bề mặt và danh mục vẫn có thể dùng
các ID taxonomy dạng gạch ngang hoặc dấu chấm hiện có.
Bằng chứng gọn bỏ qua `execution` theo từng mục và đặt `evidenceMode: "slim"`;
`smoke-ci` mặc định là gọn, và `--evidence-mode full` khôi phục các mục đầy đủ:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Dùng `smoke-ci` cho bằng chứng hồ sơ xác định với nhà cung cấp mô hình giả lập và
máy chủ nhà cung cấp cục bộ Crabline. Dùng `release` cho bằng chứng Stable/LTS trên các
kênh trực tiếp. Chỉ dùng `all` cho các lần chạy bằng chứng toàn bộ taxonomy rõ ràng; nó chọn
mọi danh mục trưởng thành đang hoạt động và có thể được điều phối qua workflow `QA Profile
Evidence` với `qa_profile=all`. Khi một lệnh cũng cần hồ sơ gốc OpenClaw,
hãy đặt hồ sơ gốc trước lệnh QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Luồng vận hành viên

Luồng vận hành viên QA hiện tại là một trang QA hai khung:

- Bên trái: bảng điều khiển Gateway (Control UI) với agent.
- Bên phải: QA Lab, hiển thị bản ghi hội thoại kiểu Slack và kế hoạch kịch bản.

Chạy bằng:

```bash
pnpm qa:lab:up
```

Lệnh đó xây dựng trang QA, khởi động làn Gateway dựa trên Docker và hiển thị
trang QA Lab nơi vận hành viên hoặc vòng lặp tự động hóa có thể giao cho agent một nhiệm vụ QA,
quan sát hành vi kênh thật và ghi lại điều gì hoạt động, thất bại hoặc
vẫn bị chặn.

Để lặp nhanh hơn trên giao diện QA Lab cục bộ mà không cần xây dựng lại ảnh Docker mỗi lần,
hãy khởi động ngăn xếp với gói QA Lab được bind-mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` giữ các dịch vụ Docker trên một ảnh dựng sẵn và bind-mount
`extensions/qa-lab/web/dist` vào container `qa-lab`. `qa:lab:watch`
xây dựng lại gói đó khi có thay đổi, và trình duyệt tự động tải lại khi hash tài sản QA Lab
thay đổi.

Để chạy smoke tín hiệu OpenTelemetry cục bộ, chạy:

```bash
pnpm qa:otel:smoke
```

Script đó khởi động một bộ nhận OTLP/HTTP cục bộ, chạy kịch bản QA `otel-trace-smoke`
với Plugin `diagnostics-otel` được bật, rồi xác nhận trace,
metric và log đã được xuất. Nó giải mã các span trace protobuf đã xuất
và kiểm tra hình dạng trọng yếu cho phát hành:
`openclaw.run`, `openclaw.harness.run`, một span gọi mô hình theo quy ước ngữ nghĩa GenAI mới nhất,
`openclaw.context.assembled` và `openclaw.message.delivery`
phải có mặt. Smoke buộc
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, vì vậy span gọi mô hình
phải dùng tên `{gen_ai.operation.name} {gen_ai.request.model}`;
các lệnh gọi mô hình không được xuất `StreamAbandoned` trên lượt thành công; ID chẩn đoán thô và
thuộc tính `openclaw.content.*` phải không xuất hiện trong trace. Payload OTLP thô
không được chứa sentinel prompt, sentinel phản hồi hoặc khóa phiên QA.
Nó ghi `otel-smoke-summary.json` cạnh các artifact bộ QA.

Để chạy smoke OpenTelemetry có collector hỗ trợ, chạy:

```bash
pnpm qa:otel:collector-smoke
```

Làn đó đặt một container Docker OpenTelemetry Collector thật phía trước
cùng bộ nhận cục bộ. Dùng nó khi thay đổi nối dây endpoint, khả năng tương thích collector
hoặc hành vi xuất OTLP mà bộ nhận trong tiến trình có thể che khuất.

Để chạy smoke scrape Prometheus được bảo vệ, chạy:

```bash
pnpm qa:prometheus:smoke
```

Bí danh đó chạy kịch bản QA `docker-prometheus-smoke` với
`diagnostics-prometheus` được bật, xác minh các lần scrape chưa xác thực bị từ chối,
sau đó kiểm tra lần scrape đã xác thực có bao gồm các họ metric trọng yếu cho phát hành
mà không có nội dung prompt, nội dung phản hồi, mã định danh chẩn đoán thô, token xác thực
hoặc đường dẫn cục bộ.

Để chạy cả hai smoke observability liên tiếp, hãy dùng:

```bash
pnpm qa:observability:smoke
```

Đối với luồng OpenTelemetry có collector hỗ trợ cùng với smoke scrape Prometheus được bảo vệ,
hãy dùng:

```bash
pnpm qa:observability:collector-smoke
```

QA observability chỉ chạy từ checkout nguồn. Tarball npm cố ý bỏ qua
QA Lab, vì vậy các luồng phát hành Docker dạng package không chạy lệnh `qa`. Hãy dùng
`pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke`, hoặc
`pnpm qa:observability:smoke` từ một checkout nguồn đã build khi thay đổi
phần đo lường chẩn đoán.

Đối với một luồng smoke Matrix dùng transport thật không yêu cầu thông tin xác thực
model-provider, hãy chạy profile nhanh với provider OpenAI mock xác định:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Đối với luồng provider live-frontier, hãy cung cấp rõ ràng thông tin xác thực tương thích OpenAI:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

Tham chiếu CLI đầy đủ, danh mục profile/kịch bản, biến môi trường và bố cục artifact cho luồng này nằm trong [Matrix QA](/vi/concepts/qa-matrix). Tóm tắt: nó cấp phát một homeserver Tuwunel dùng một lần trong Docker, đăng ký người dùng driver/SUT/observer tạm thời, chạy Plugin Matrix thật bên trong một Gateway QA con được giới hạn cho transport đó (không có `qa-channel`), rồi ghi báo cáo Markdown, tóm tắt JSON, artifact sự kiện quan sát được và nhật ký đầu ra kết hợp dưới `.artifacts/qa-e2e/matrix-<timestamp>/`.

Các kịch bản bao phủ hành vi transport mà kiểm thử đơn vị không thể chứng minh đầu cuối: kiểm soát mention, chính sách allow-bot, danh sách cho phép, trả lời cấp cao nhất và trong thread, định tuyến DM, xử lý reaction, chặn chỉnh sửa inbound, chống trùng phát lại sau khởi động lại, phục hồi khi homeserver bị gián đoạn, phân phối metadata phê duyệt, xử lý media, và các luồng khởi tạo/phục hồi/xác minh Matrix E2EE. Profile CLI E2EE cũng chạy `openclaw matrix encryption setup` và các lệnh xác minh qua cùng homeserver dùng một lần trước khi kiểm tra phản hồi Gateway.

Discord cũng có các kịch bản opt-in chỉ dành cho Mantis để tái hiện lỗi. Dùng
`--scenario discord-status-reactions-tool-only` cho timeline reaction trạng thái rõ ràng,
hoặc `--scenario discord-thread-reply-filepath-attachment` để tạo một
thread Discord thật và xác minh rằng `message.thread-reply` giữ nguyên attachment
`filePath`. Các kịch bản này không nằm trong luồng Discord live mặc định
vì chúng là probe tái hiện trước/sau thay vì phạm vi smoke rộng.
Workflow Mantis cho attachment trong thread cũng có thể thêm video nhân chứng Discord Web
đã đăng nhập khi `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` hoặc
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` được cấu hình trong môi trường QA.
Profile viewer đó chỉ dùng để ghi hình trực quan; quyết định đạt/không đạt
vẫn đến từ oracle Discord REST.

CI dùng cùng bề mặt lệnh trong `.github/workflows/qa-live-transports-convex.yml`.
Các lần chạy theo lịch và thủ công mặc định thực thi profile Matrix nhanh với
thông tin xác thực live-frontier do QA cung cấp, `--fast`, và
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Chạy thủ công với `matrix_profile=all` sẽ fan out
thành năm shard profile.

Đối với các luồng smoke dùng transport thật của Telegram, Discord, Slack và WhatsApp:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Chúng nhắm đến một kênh thật đã tồn tại với hai bot hoặc tài khoản (driver + SUT). Các biến môi trường bắt buộc, danh sách kịch bản, artifact đầu ra và pool thông tin xác thực Convex được ghi trong [tham chiếu QA Telegram, Discord, Slack và WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) bên dưới.

Đối với một lần chạy VM desktop Slack đầy đủ với VNC rescue, hãy chạy:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Lệnh đó thuê một máy desktop/browser Crabbox, chạy luồng Slack live
bên trong VM, mở Slack Web trong trình duyệt VNC, chụp desktop và
sao chép `slack-qa/`, `slack-desktop-smoke.png`, và `slack-desktop-smoke.mp4`
khi có thể ghi video về thư mục artifact Mantis. Các lease desktop/browser Crabbox
cung cấp sẵn công cụ capture và gói trợ giúp browser/native-build,
vì vậy kịch bản chỉ nên cài fallback trên các lease cũ hơn. Mantis báo cáo
thời gian tổng và theo từng pha trong
`mantis-slack-desktop-smoke-report.md` để các lần chạy chậm cho biết thời gian nằm ở
khởi động lease, lấy thông tin xác thực, thiết lập từ xa hay sao chép artifact. Tái sử dụng
`--lease-id <cbx_...>` sau khi đăng nhập Slack Web thủ công qua VNC;
các lease tái sử dụng cũng giữ cache pnpm store của Crabbox luôn ấm. Mặc định
`--hydrate-mode source` xác minh từ checkout nguồn và chạy install/build
bên trong VM. Chỉ dùng `--hydrate-mode prehydrated` khi workspace từ xa tái sử dụng
đã có `node_modules` và `dist/` đã build; chế độ đó bỏ qua bước
install/build tốn kém và fail closed khi workspace chưa sẵn sàng.
Với `--gateway-setup`, Mantis để một Gateway Slack OpenClaw bền vững
chạy bên trong VM trên cổng `38973`; nếu không có, lệnh chạy luồng QA Slack
bot-to-bot bình thường và thoát sau khi capture artifact.

Để chứng minh UI phê duyệt Slack gốc bằng bằng chứng desktop, hãy chạy chế độ
checkpoint phê duyệt Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Chế độ này loại trừ lẫn nhau với `--gateway-setup`. Nó chạy các kịch bản
phê duyệt Slack, từ chối id kịch bản không phải phê duyệt, chờ tại mỗi trạng thái
phê duyệt pending và resolved, render thông điệp Slack API quan sát được vào
`approval-checkpoints/<scenario>-pending.png` và
`approval-checkpoints/<scenario>-resolved.png`, rồi fail nếu bất kỳ checkpoint,
bằng chứng thông điệp, xác nhận hoặc ảnh chụp đã render nào bị thiếu hoặc trống.
Các lease CI lạnh vẫn có thể hiển thị màn hình đăng nhập Slack trong `slack-desktop-smoke.png`;
ảnh checkpoint phê duyệt là bằng chứng trực quan cho luồng này.

Checklist operator, lệnh dispatch workflow GitHub, hợp đồng comment bằng chứng,
bảng quyết định hydrate-mode, diễn giải thời gian và các bước xử lý lỗi nằm trong [Mantis Slack Desktop Runbook](/vi/concepts/mantis-slack-desktop-runbook).

Đối với một tác vụ desktop kiểu agent/CV, hãy chạy:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` thuê hoặc tái sử dụng một máy desktop/browser Crabbox, khởi động
`crabbox record --while`, điều khiển trình duyệt hiển thị qua một
`visual-driver` lồng nhau, chụp `visual-task.png`, chạy `openclaw infer image describe`
trên ảnh chụp màn hình khi chọn `--vision-mode image-describe`, và
ghi `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json`, và `mantis-visual-task-report.md`.
Khi đặt `--expect-text`, prompt vision yêu cầu verdict JSON có cấu trúc
và chỉ đạt khi model báo cáo bằng chứng hiển thị tích cực; một phản hồi
tiêu cực chỉ trích dẫn văn bản mục tiêu sẽ fail assertion.
Dùng `--vision-mode metadata` cho smoke không dùng model, chứng minh desktop,
trình duyệt, ảnh chụp màn hình và đường ống video mà không gọi provider
hiểu hình ảnh. Recording là artifact bắt buộc cho `visual-task`; nếu Crabbox ghi
không có `visual-task.mp4` khác rỗng, tác vụ sẽ fail ngay cả khi visual driver
đã đạt. Khi fail, Mantis giữ lease cho VNC trừ khi tác vụ đã
đạt và chưa đặt `--keep-lease`.

Trước khi dùng thông tin xác thực live trong pool, hãy chạy:

```bash
pnpm openclaw qa credentials doctor
```

Doctor kiểm tra môi trường broker Convex, xác thực thiết lập endpoint và xác minh khả năng admin/list khi có maintainer secret. Nó chỉ báo cáo trạng thái đã đặt/thiếu cho secret.

## Phạm vi bao phủ transport live

Các luồng transport live dùng chung một hợp đồng thay vì mỗi luồng tự phát minh hình dạng danh sách kịch bản riêng. `qa-channel` là bộ kiểm thử hành vi sản phẩm tổng hợp rộng và không thuộc ma trận bao phủ transport live.

Các runner transport live nên import id kịch bản dùng chung, helper
bao phủ baseline và helper chọn kịch bản từ
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Luồng    | Canary | Kiểm soát mention | Bot-to-bot | Chặn allowlist | Trả lời cấp cao nhất | Trả lời trích dẫn | Tiếp tục sau khởi động lại | Follow-up thread | Cô lập thread | Quan sát reaction | Lệnh trợ giúp | Đăng ký lệnh gốc |
| -------- | ------ | ----------------- | ---------- | -------------- | -------------------- | ----------------- | -------------------------- | ---------------- | -------------- | ----------------- | ------------ | ---------------- |
| Matrix   | x      | x                 | x          | x              | x                    |                   | x                          | x                | x              | x                 |              |                  |
| Telegram | x      | x                 | x          |                |                      |                   |                            |                  |                |                   | x            |                  |
| Discord  | x      | x                 | x          |                |                      |                   |                            |                  |                |                   |              | x                |
| Slack    | x      | x                 | x          | x              | x                    |                   | x                          | x                | x              |                   |              |                  |
| WhatsApp | x      | x                 |            | x              | x                    | x                 | x                          |                  |                | x                 | x            |                  |

Điều này giữ `qa-channel` là bộ kiểm thử hành vi sản phẩm rộng trong khi Matrix,
Telegram và các transport live khác chia sẻ một checklist hợp đồng transport rõ ràng.

Đối với một luồng VM Linux dùng một lần mà không đưa Docker vào đường dẫn QA, hãy chạy:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Lệnh này khởi động một guest Multipass mới, cài dependencies, build OpenClaw
bên trong guest, chạy `qa suite`, rồi sao chép báo cáo QA và
tóm tắt bình thường về `.artifacts/qa-e2e/...` trên host.
Nó tái sử dụng cùng hành vi chọn kịch bản như `qa suite` trên host.
Các lần chạy suite trên host và Multipass thực thi nhiều kịch bản đã chọn song song
với các worker Gateway cô lập theo mặc định. `qa-channel` mặc định concurrency
4, bị giới hạn bởi số lượng kịch bản đã chọn. Dùng `--concurrency <count>` để tinh chỉnh
số worker, hoặc `--concurrency 1` để thực thi tuần tự.
Dùng `--pack personal-agent` để chạy pack benchmark trợ lý cá nhân. Bộ chọn
pack có tính cộng dồn với các cờ `--scenario` lặp lại: các kịch bản rõ ràng
chạy trước, sau đó các kịch bản pack chạy theo thứ tự pack với trùng lặp bị loại bỏ.
Dùng `--pack observability` khi một runner QA tùy chỉnh đã cung cấp thiết lập
collector OpenTelemetry và muốn chọn cùng lúc các kịch bản smoke chẩn đoán
OpenTelemetry và Prometheus.
Lệnh thoát khác 0 khi bất kỳ kịch bản nào fail. Dùng `--allow-failures` khi
bạn muốn có artifact mà không có mã thoát thất bại.
Các lần chạy live chuyển tiếp các đầu vào xác thực QA được hỗ trợ và thực tế cho
guest: key provider dựa trên env, đường dẫn cấu hình provider live QA, và
`CODEX_HOME` khi có. Giữ `--output-dir` dưới repo root để guest
có thể ghi ngược lại qua workspace đã mount.

## Tham chiếu QA cho Telegram, Discord, Slack và WhatsApp

Matrix có một [trang riêng](/vi/concepts/qa-matrix) vì số lượng kịch bản và việc cấp phát homeserver dựa trên Docker. Telegram, Discord, Slack và WhatsApp chạy trên các transport thực đã tồn tại, nên phần tham chiếu của chúng nằm ở đây.

### Cờ CLI dùng chung

Các lane này đăng ký qua `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` và chấp nhận cùng các cờ:

| Cờ                                    | Mặc định                                           | Mô tả                                                                                                                                                    |
| ------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Chỉ chạy kịch bản này. Có thể lặp lại.                                                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Nơi ghi báo cáo, tóm tắt, bằng chứng, artifact theo transport và nhật ký đầu ra. Đường dẫn tương đối được phân giải theo `--repo-root`.                  |
| `--repo-root <path>`                  | `process.cwd()`                                    | Gốc kho lưu trữ khi gọi từ một cwd trung lập.                                                                                                            |
| `--sut-account <id>`                  | `sut`                                              | Id tài khoản tạm thời bên trong cấu hình QA gateway.                                                                                                     |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` hoặc `live-frontier` (`live-openai` cũ vẫn hoạt động).                                                                                     |
| `--model <ref>` / `--alt-model <ref>` | mặc định của provider                              | Tham chiếu mô hình chính/thay thế.                                                                                                                       |
| `--fast`                              | tắt                                                | Chế độ nhanh của provider khi được hỗ trợ.                                                                                                               |
| `--credential-source <env\|convex>`   | `env`                                              | Xem [nhóm thông tin xác thực Convex](#convex-credential-pool).                                                                                           |
| `--credential-role <maintainer\|ci>`  | `ci` trong CI, nếu không là `maintainer`           | Vai trò được dùng khi `--credential-source convex`.                                                                                                      |

Mỗi lane thoát với mã khác 0 khi có bất kỳ kịch bản nào thất bại. `--allow-failures` ghi artifact mà không đặt mã thoát thất bại.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Nhắm tới một nhóm Telegram riêng tư thực với hai bot riêng biệt (driver + SUT). Bot SUT phải có username Telegram; quan sát bot-với-bot hoạt động tốt nhất khi cả hai bot đều bật **Bot-to-Bot Communication Mode** trong `@BotFather`.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - id chat dạng số (chuỗi).
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

Tập mặc định ngầm định luôn bao phủ canary, mention gating, phản hồi lệnh native, định địa chỉ lệnh và phản hồi nhóm bot-với-bot. Các mặc định `mock-openai` cũng bao gồm kiểm tra chuỗi phản hồi xác định và streaming thông điệp cuối. `telegram-current-session-status-tool` vẫn là tùy chọn vì nó chỉ ổn định khi được nối luồng trực tiếp sau canary, không phải sau các phản hồi lệnh native tùy ý. Dùng `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` để in phần tách mặc định/tùy chọn hiện tại cùng các tham chiếu hồi quy.

Artifact đầu ra:

- `telegram-qa-report.md`
- `qa-evidence.json` - các mục bằng chứng cho kiểm tra transport trực tiếp, bao gồm các trường profile, coverage, provider, channel, artifacts, result và RTT.

Các lần chạy Telegram theo package dùng cùng hợp đồng thông tin xác thực Telegram. Đo RTT lặp lại là một phần của lane trực tiếp Telegram package thông thường; phân phối RTT được gộp vào `qa-evidence.json` dưới `result.timing` cho kiểm tra RTT đã chọn.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Khi đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, wrapper live của package thuê một thông tin xác thực `kind: "telegram"`, xuất env nhóm/driver/bot SUT đã thuê vào lần chạy package đã cài đặt, Heartbeat lease và giải phóng lease khi tắt. Wrapper package mặc định dùng 20 lần kiểm tra RTT của `telegram-mentioned-message-reply`, thời gian chờ RTT 30 giây và vai trò Convex `maintainer` ngoài CI khi chọn Convex. Ghi đè `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` hoặc `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` để tinh chỉnh đo RTT mà không tạo lệnh RTT riêng hoặc định dạng tóm tắt riêng cho Telegram.

### QA Discord

```bash
pnpm openclaw qa discord
```

Nhắm tới một kênh guild Discord riêng tư thực với hai bot: bot driver do harness điều khiển và bot SUT được Gateway OpenClaw con khởi động qua Plugin Discord đi kèm. Xác minh xử lý mention trong kênh, rằng bot SUT đã đăng ký lệnh native `/help` với Discord, và các kịch bản bằng chứng Mantis tùy chọn.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - phải khớp với id người dùng bot SUT do Discord trả về (nếu không lane sẽ thất bại sớm).

Tùy chọn:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` giữ nội dung thông điệp trong artifact thông điệp quan sát được.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` chọn kênh voice/stage cho `discord-voice-autojoin`; nếu không có, kịch bản chọn kênh voice/stage hiển thị đầu tiên cho bot SUT.

Kịch bản (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - kịch bản voice tùy chọn. Chạy riêng, bật `channels.discord.voice.autoJoin` và xác minh trạng thái voice Discord hiện tại của bot SUT là kênh voice/stage đích. Thông tin xác thực Convex Discord có thể bao gồm `voiceChannelId` tùy chọn; nếu không, runner phát hiện kênh voice/stage hiển thị đầu tiên trong guild.
- `discord-status-reactions-tool-only` - kịch bản Mantis tùy chọn. Chạy riêng vì nó chuyển SUT sang phản hồi guild luôn bật, chỉ dùng công cụ với `messages.statusReactions.enabled=true`, rồi thu thập timeline reaction REST cùng các artifact trực quan HTML/PNG. Báo cáo trước/sau của Mantis cũng giữ các artifact MP4 do kịch bản cung cấp dưới dạng `baseline.mp4` và `candidate.mp4`.

Chạy rõ ràng kịch bản tự động tham gia voice của Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Chạy rõ ràng kịch bản reaction trạng thái Mantis:

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
- `qa-evidence.json` - các mục bằng chứng cho kiểm tra transport trực tiếp.
- `discord-qa-observed-messages.json` - nội dung được biên tập trừ khi `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` và `discord-status-reactions-tool-only-timeline.png` khi kịch bản reaction trạng thái chạy.

### QA Slack

```bash
pnpm openclaw qa slack
```

Nhắm tới một kênh Slack riêng tư thực với hai bot riêng biệt: bot driver do harness điều khiển và bot SUT được Gateway OpenClaw con khởi động qua Plugin Slack đi kèm.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Tùy chọn:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` giữ nội dung thông điệp trong artifact thông điệp quan sát được.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` bật các điểm kiểm tra phê duyệt trực quan cho Mantis. Runner ghi `<scenario>.pending.json` và `<scenario>.resolved.json`, rồi chờ các tệp `.ack.json` khớp.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` ghi đè thời gian chờ xác nhận điểm kiểm tra. Mặc định là `120000`.

Kịch bản (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - kịch bản phê duyệt exec native của Slack tùy chọn. Yêu cầu phê duyệt exec qua gateway, xác minh thông điệp Slack có các nút phê duyệt native, giải quyết nó và xác minh bản cập nhật Slack đã giải quyết.
- `slack-approval-plugin-native` - kịch bản phê duyệt Plugin native của Slack tùy chọn. Bật chuyển tiếp phê duyệt exec và Plugin cùng nhau để các sự kiện Plugin không bị chặn bởi định tuyến phê duyệt exec, rồi xác minh cùng đường dẫn UI Slack native đang chờ/đã giải quyết.

Artifact đầu ra:

- `slack-qa-report.md`
- `qa-evidence.json` - các mục bằng chứng cho kiểm tra transport trực tiếp.
- `slack-qa-observed-messages.json` - nội dung được biên tập trừ khi `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - chỉ khi Mantis đặt `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; chứa JSON điểm kiểm tra, JSON xác nhận và ảnh chụp màn hình đang chờ/đã giải quyết.

#### Thiết lập không gian làm việc Slack

Lane cần hai ứng dụng Slack riêng biệt trong một workspace, cộng với một kênh mà cả hai bot đều là thành viên:

- `channelId` - id `Cxxxxxxxxxx` của một kênh mà cả hai bot đã được mời vào. Dùng một kênh chuyên dụng; lane đăng bài trong mỗi lần chạy.
- `driverBotToken` - token bot (`xoxb-...`) của ứng dụng **Driver**.
- `sutBotToken` - token bot (`xoxb-...`) của ứng dụng **SUT**, phải là một ứng dụng Slack riêng với driver để id người dùng bot của nó khác biệt.
- `sutAppToken` - token cấp ứng dụng (`xapp-...`) của ứng dụng SUT với `connections:write`, được Socket Mode dùng để ứng dụng SUT có thể nhận sự kiện.

Ưu tiên một workspace Slack dành riêng cho QA thay vì dùng lại workspace production.

Manifest SUT dưới đây cố ý thu hẹp bản cài đặt production của Plugin Slack đi kèm (`extensions/slack/src/setup-shared.ts:10`) xuống các quyền và sự kiện được bộ Slack QA trực tiếp bao phủ. Với thiết lập kênh production như người dùng thấy, xem [thiết lập nhanh kênh Slack](/vi/channels/slack#quick-setup); cặp QA Driver/SUT được tách riêng có chủ ý vì lane cần hai id người dùng bot riêng biệt trong một workspace.

**1. Tạo ứng dụng Driver**

Truy cập [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → chọn workspace QA, dán manifest sau, rồi _Install to Workspace_:

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

Sao chép _Bot User OAuth Token_ (`xoxb-...`) - token đó trở thành `driverBotToken`. Driver chỉ cần đăng tin nhắn và tự định danh; không cần sự kiện, không cần Socket Mode.

**2. Tạo ứng dụng SUT**

Lặp lại _Create New App → From a manifest_ trong cùng workspace. Ứng dụng QA này cố ý dùng một phiên bản hẹp hơn manifest sản xuất của Plugin Slack đi kèm (`extensions/slack/src/setup-shared.ts:10`): các phạm vi và sự kiện reaction bị bỏ qua vì bộ kiểm thử Slack QA live hiện chưa bao phủ xử lý reaction.

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

- _Install to Workspace_ → sao chép _Bot User OAuth Token_ → token đó trở thành `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → thêm phạm vi `connections:write` → lưu → sao chép giá trị `xapp-...` → giá trị đó trở thành `sutAppToken`.

Xác minh hai bot có user id riêng biệt bằng cách gọi `auth.test` trên từng token. Runtime phân biệt driver và SUT theo user id; dùng lại một ứng dụng cho cả hai sẽ làm mention-gating thất bại ngay lập tức.

**3. Tạo kênh**

Trong workspace QA, tạo một kênh (ví dụ `#openclaw-qa`) và mời cả hai bot từ bên trong kênh:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Sao chép id `Cxxxxxxxxxx` từ _channel info → About → Channel ID_ - id đó trở thành `channelId`. Kênh công khai dùng được; nếu bạn dùng kênh riêng tư thì cả hai ứng dụng đã có `groups:history` nên các lượt đọc lịch sử của harness vẫn sẽ thành công.

**4. Đăng ký thông tin xác thực**

Có hai tùy chọn. Dùng biến môi trường để gỡ lỗi trên một máy (đặt bốn biến `OPENCLAW_QA_SLACK_*` và truyền `--credential-source env`), hoặc seed pool Convex dùng chung để CI và những maintainer khác có thể lease chúng.

Đối với pool Convex, ghi bốn trường vào một tệp JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Với `OPENCLAW_QA_CONVEX_SITE_URL` và `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` đã được export trong shell của bạn, đăng ký và xác minh:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Kỳ vọng `count: 1`, `status: "active"`, không có trường `lease`.

**5. Xác minh đầu cuối**

Chạy lane cục bộ để xác nhận cả hai bot có thể nói chuyện với nhau qua broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Một lượt chạy xanh hoàn tất trong chưa tới 30 giây và `slack-qa-report.md` hiển thị cả `slack-canary` và `slack-mention-gating` ở trạng thái `pass`. Nếu lane treo khoảng 90 giây rồi thoát với `Convex credential pool exhausted for kind "slack"`, thì pool đang trống hoặc mọi hàng đều đã được lease - `qa credentials list --kind slack --status all --json` sẽ cho bạn biết trường hợp nào.

### QA WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Nhắm tới hai tài khoản WhatsApp Web chuyên dụng: một tài khoản driver do
harness điều khiển và một tài khoản SUT do Gateway OpenClaw con khởi động thông qua
Plugin WhatsApp đi kèm.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Tùy chọn:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` bật các kịch bản nhóm như
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, các kịch bản hành động/media/poll nhóm, và
  `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` giữ nội dung tin nhắn trong
  artifact observed-message.

Danh mục kịch bản (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Baseline và gating nhóm: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- Lệnh gốc: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Hành vi trả lời và đầu ra cuối: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- Hành động tin nhắn theo đường dẫn người dùng: `whatsapp-agent-message-action-react` bắt đầu từ
  một DM driver thật, cho phép model gọi công cụ `message`, và quan sát
  reaction WhatsApp gốc. `whatsapp-agent-message-action-upload-file` dùng
  cùng tư thế cho `message(action=upload-file)` và quan sát media WhatsApp
  gốc. `whatsapp-group-agent-message-action-react` và
  `whatsapp-group-agent-message-action-upload-file` chứng minh các hành động
  người dùng thấy tương tự trong một nhóm WhatsApp thật.
- Fanout nhóm: `whatsapp-broadcast-group-fanout` bắt đầu từ một
  tin nhắn nhóm WhatsApp có mention và xác minh các phản hồi hiển thị riêng biệt từ `main` và
  `qa-second`.
- Kích hoạt nhóm: `whatsapp-group-activation-always` đổi một phiên nhóm thật
  sang `/activation always`, chứng minh một tin nhắn nhóm không mention có thể đánh thức
  agent, rồi khôi phục `/activation mention`. `whatsapp-group-reply-to-bot-triggers`
  seed một phản hồi bot, gửi một phản hồi trích dẫn gốc tới phản hồi đó mà không có
  mention rõ ràng, và xác minh agent thức dậy từ ngữ cảnh phản hồi đó.
- Media đến và tin nhắn có cấu trúc: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Các kịch bản này gửi sự kiện hình ảnh, âm thanh, tài liệu, vị trí, liên hệ, sticker,
  và reaction WhatsApp thật qua driver.
- Probe hợp đồng Gateway trực tiếp:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Các kịch bản này cố ý bỏ qua prompt model và
  chứng minh các hợp đồng Gateway/channel `send`, `poll`, và `message.action`
  có tính xác định.
- Bao phủ kiểm soát truy cập: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Phê duyệt gốc: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Reaction trạng thái: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

Danh mục hiện chứa 50 kịch bản. Lane mặc định `live-frontier` được
giữ nhỏ ở 10 kịch bản để bao phủ smoke nhanh. Lane mặc định `mock-openai`
chạy 44 kịch bản xác định qua transport WhatsApp thật trong khi
chỉ mock đầu ra model. Các kịch bản phê duyệt và một vài kiểm tra nặng/chặn hơn
vẫn là rõ ràng theo scenario id.

Driver WhatsApp QA quan sát các sự kiện live có cấu trúc (`text`, `media`,
`location`, `reaction`, và `poll`) và có thể chủ động gửi media, poll,
liên hệ, vị trí, và sticker. QA Lab nhập driver đó qua bề mặt package
`@openclaw/whatsapp/api.js` thay vì truy cập vào các tệp runtime WhatsApp
riêng tư. Đối với quan sát nhóm, `fromJid` là JID nhóm trong khi
`participantJid` và `fromPhoneE164` xác định người gửi tham gia. Nội dung
tin nhắn bị biên tập lại theo mặc định. Các probe Gateway trực tiếp về
poll, upload-file, media, poll nhóm, media nhóm, và reply-shape là các kiểm tra hợp đồng transport/API;
chúng không được xem là bằng chứng rằng một prompt người dùng đã khiến agent chọn
cùng hành động. Bằng chứng hành động theo đường dẫn người dùng đến từ các kịch bản như
`whatsapp-agent-message-action-react` và
`whatsapp-group-agent-message-action-react`, trong đó driver gửi một tin nhắn
WhatsApp bình thường và QA Lab quan sát artifact WhatsApp gốc phát sinh.
Báo cáo WhatsApp bao gồm tư thế của từng kịch bản (`user-path`, `direct-gateway`,
hoặc `native-approval`) để bằng chứng không bị hiểu nhầm là một hợp đồng mạnh hơn
những gì nó thực sự chứng minh.

Artifact đầu ra:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - các mục bằng chứng cho kiểm tra transport live.
- `whatsapp-qa-observed-messages.json` - nội dung bị biên tập lại trừ khi `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Pool thông tin xác thực Convex

Các lane Telegram, Discord, Slack, và WhatsApp có thể lease thông tin xác thực từ một pool Convex dùng chung thay vì đọc các biến môi trường ở trên. Truyền `--credential-source convex` (hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab lấy một lease độc quyền, gửi Heartbeat cho lease đó trong suốt thời gian chạy, và giải phóng khi shutdown. Các loại pool là `"telegram"`, `"discord"`, `"slack"`, và `"whatsapp"`.

Các shape payload mà broker xác thực trên `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` phải là chuỗi chat-id dạng số.
- Người dùng Telegram thật (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - chỉ dành cho bằng chứng Mantis Telegram Desktop. Các lane QA Lab chung không được lấy loại này.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - số điện thoại phải là các chuỗi E.164 riêng biệt.

Quy trình bằng chứng Mantis Telegram Desktop giữ một phiên thuê Convex
`telegram-user` độc quyền cho cả trình điều khiển TDLib CLI và nhân chứng
Telegram Desktop, rồi giải phóng phiên thuê đó sau khi xuất bản bằng chứng.

Khi một PR cần diff trực quan xác định, Mantis có thể dùng cùng phản hồi mô hình giả lập
trên `main` và trên head của PR trong khi bộ định dạng Telegram hoặc lớp phân phối
thay đổi. Các giá trị mặc định khi chụp được tinh chỉnh cho bình luận PR: lớp Crabbox
tiêu chuẩn, bản ghi desktop 24fps, GIF chuyển động 24fps, và chiều rộng bản xem trước 1920px.
Bình luận trước/sau nên xuất bản một gói sạch chỉ chứa các
GIF dự kiến.

Các lane Slack cũng có thể dùng pool. Kiểm tra hình dạng payload Slack hiện nằm trong trình chạy QA Slack thay vì broker; dùng `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, với id kênh Slack như `Cxxxxxxxxxx`. Xem [Thiết lập workspace Slack](#setting-up-the-slack-workspace) để cấp phát ứng dụng và scope.

Các biến môi trường vận hành và hợp đồng endpoint broker Convex nằm trong [Kiểm thử → Thông tin xác thực Telegram dùng chung qua Convex](/vi/help/testing#shared-telegram-credentials-via-convex-v1) (tên phần có trước pool đa kênh; ngữ nghĩa phiên thuê được dùng chung giữa các loại).

## Seed dựa trên repo

Tài sản seed nằm trong `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Các tài sản này được cố ý đưa vào git để kế hoạch QA hiển thị với cả con người và
agent.

`qa-lab` nên tiếp tục là trình chạy kịch bản YAML chung. Mỗi tệp YAML kịch bản là
nguồn chân lý cho một lần chạy kiểm thử và nên định nghĩa:

- `title` cấp cao nhất
- siêu dữ liệu `scenario`
- siêu dữ liệu category, capability, lane, và risk tùy chọn trong `scenario`
- tham chiếu tài liệu và mã trong `scenario`
- yêu cầu plugin tùy chọn trong `scenario`
- bản vá cấu hình gateway tùy chọn trong `scenario`
- `flow` cấp cao nhất có thể thực thi cho các kịch bản flow, hoặc `scenario.execution.kind` /
  `scenario.execution.path` cho các kịch bản Vitest và Playwright

Bề mặt runtime tái sử dụng hỗ trợ `flow` được phép tiếp tục mang tính chung
và xuyên suốt. Ví dụ, kịch bản YAML có thể kết hợp helper phía transport
với helper phía trình duyệt điều khiển Control UI nhúng thông qua
seam Gateway `browser.request` mà không cần thêm trình chạy trường hợp đặc biệt.

Các tệp kịch bản nên được nhóm theo năng lực sản phẩm thay vì thư mục cây nguồn.
Giữ ID kịch bản ổn định khi di chuyển tệp; dùng `docsRefs` và `codeRefs`
để truy vết triển khai.

Danh sách baseline nên đủ rộng để bao phủ:

- trò chuyện DM và kênh
- hành vi thread
- vòng đời hành động tin nhắn
- callback cron
- truy hồi bộ nhớ
- chuyển đổi mô hình
- bàn giao subagent
- đọc repo và đọc tài liệu
- một tác vụ build nhỏ như Lobster Invaders

## Các lane provider giả lập

`qa suite` có hai lane provider giả lập cục bộ:

- `mock-openai` là mock OpenClaw nhận biết kịch bản. Nó vẫn là lane mock
  xác định mặc định cho QA dựa trên repo và các cổng parity.
- `aimock` khởi động một máy chủ provider dựa trên AIMock cho phạm vi giao thức,
  fixture, record/replay, và chaos thử nghiệm. Nó mang tính bổ sung và không
  thay thế dispatcher kịch bản `mock-openai`.

Triển khai lane provider nằm dưới `extensions/qa-lab/src/providers/`.
Mỗi provider sở hữu các giá trị mặc định, việc khởi động máy chủ cục bộ, cấu hình mô hình gateway,
nhu cầu staging auth-profile, và cờ năng lực live/mock của nó. Mã suite và
gateway dùng chung nên định tuyến qua registry provider thay vì rẽ nhánh theo
tên provider.

## Bộ chuyển đổi transport

`qa-lab` sở hữu một seam transport chung cho các kịch bản QA YAML. `qa-channel` là
mặc định tổng hợp. `crabline` khởi động các máy chủ cục bộ có hình dạng provider và chạy
các plugin kênh bình thường của OpenClaw với chúng. `live` được dành riêng cho
thông tin xác thực provider thật và các kênh bên ngoài.

Ở cấp kiến trúc, phần tách là:

- `qa-lab` sở hữu việc thực thi kịch bản chung, đồng thời worker, ghi artifact và báo cáo.
- Adapter truyền tải sở hữu cấu hình Gateway, trạng thái sẵn sàng, quan sát đầu vào và đầu ra, hành động truyền tải và trạng thái truyền tải đã chuẩn hóa.
- Các tệp kịch bản YAML trong `qa/scenarios/` định nghĩa lần chạy kiểm thử; `qa-lab` cung cấp bề mặt runtime có thể tái sử dụng để thực thi chúng.

### Thêm kênh

Thêm kênh vào hệ thống QA YAML yêu cầu phần triển khai kênh cùng với
một gói kịch bản kiểm tra hợp đồng kênh. Để có phạm vi CI smoke, hãy thêm
máy chủ provider cục bộ Crabline tương ứng và phơi bày nó qua driver `crabline`.

Không thêm một gốc lệnh QA cấp cao mới khi host `qa-lab` dùng chung có thể sở hữu luồng này.

`qa-lab` sở hữu các cơ chế host dùng chung:

- gốc lệnh `openclaw qa`
- khởi động và dọn dẹp suite
- đồng thời worker
- ghi artifact
- tạo báo cáo
- thực thi kịch bản
- alias tương thích cho các kịch bản `qa-channel` cũ hơn

Các Plugin runner sở hữu hợp đồng truyền tải:

- cách `openclaw qa <runner>` được gắn bên dưới gốc `qa` dùng chung
- cách Gateway được cấu hình cho truyền tải đó
- cách kiểm tra trạng thái sẵn sàng
- cách tiêm sự kiện đầu vào
- cách quan sát thông điệp đầu ra
- cách phơi bày transcript và trạng thái truyền tải đã chuẩn hóa
- cách thực thi các hành động dựa trên truyền tải
- cách xử lý reset hoặc dọn dẹp riêng cho truyền tải

Ngưỡng áp dụng tối thiểu cho một kênh mới:

1. Giữ `qa-lab` là chủ sở hữu của gốc `qa` dùng chung.
2. Triển khai runner truyền tải trên seam host `qa-lab` dùng chung.
3. Giữ các cơ chế riêng cho truyền tải bên trong Plugin runner hoặc harness kênh.
4. Gắn runner dưới dạng `openclaw qa <runner>` thay vì đăng ký một lệnh gốc cạnh tranh. Các Plugin runner nên khai báo `qaRunners` trong `openclaw.plugin.json` và xuất một mảng `qaRunnerCliRegistrations` tương ứng từ `runtime-api.ts`. Giữ `runtime-api.ts` nhẹ; CLI lazy và việc thực thi runner nên nằm sau các entrypoint riêng.
5. Tạo hoặc điều chỉnh các kịch bản YAML trong các thư mục `qa/scenarios/` theo chủ đề.
6. Dùng các helper kịch bản chung cho kịch bản mới.
7. Giữ các alias tương thích hiện có hoạt động, trừ khi repo đang thực hiện một migration có chủ đích.

Quy tắc quyết định rất nghiêm ngặt:

- Nếu hành vi có thể được biểu đạt một lần trong `qa-lab`, hãy đặt nó trong `qa-lab`.
- Nếu hành vi phụ thuộc vào một truyền tải kênh, hãy giữ nó trong Plugin runner hoặc harness Plugin đó.
- Nếu một kịch bản cần một năng lực mới mà nhiều hơn một kênh có thể dùng, hãy thêm một helper chung thay vì một nhánh riêng cho kênh trong `suite.ts`.
- Nếu một hành vi chỉ có ý nghĩa với một truyền tải, hãy giữ kịch bản riêng cho truyền tải và làm rõ điều đó trong hợp đồng kịch bản.

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

Các alias tương thích vẫn khả dụng cho kịch bản hiện có - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - nhưng khi viết kịch bản mới nên dùng các tên chung. Các alias tồn tại để tránh một migration đồng loạt, không phải là mô hình trong tương lai.

## Báo cáo

`qa-lab` xuất một báo cáo giao thức Markdown từ dòng thời gian bus đã quan sát.
Báo cáo nên trả lời:

- Những gì đã hoạt động
- Những gì đã thất bại
- Những gì vẫn bị chặn
- Những kịch bản theo dõi nào đáng thêm vào

Để xem danh mục các kịch bản có sẵn - hữu ích khi ước lượng công việc theo dõi hoặc nối dây một truyền tải mới - hãy chạy `pnpm openclaw qa coverage` (thêm `--json` để có đầu ra máy đọc được).
Khi chọn bằng chứng tập trung cho một hành vi hoặc đường dẫn tệp đã chạm tới, hãy chạy `pnpm openclaw qa coverage --match <query>`.
Báo cáo khớp tìm kiếm metadata kịch bản, tham chiếu tài liệu, tham chiếu mã, ID coverage, Plugin và yêu cầu provider, sau đó in các target `qa suite --scenario ...` khớp.
Mỗi lần chạy `qa suite` ghi các artifact cấp cao nhất `qa-evidence.json`,
`qa-suite-summary.json` và `qa-suite-report.md` cho tập kịch bản đã chọn. Các kịch bản khai báo `execution.kind: vitest` hoặc
`execution.kind: playwright` sẽ chạy đường dẫn kiểm thử tương ứng và cũng ghi
log cho từng kịch bản. Các kịch bản khai báo `execution.kind: script` sẽ chạy
producer bằng chứng tại `execution.path` qua `node --import tsx` (với
`${outputDir}` và `${scenarioId}` được mở rộng trong `execution.args`); producer
ghi `qa-evidence.json` của riêng nó, các mục trong đó được nhập vào đầu ra suite
và các đường dẫn artifact của nó được phân giải tương đối với
`qa-evidence.json` của producer đó. Khi đi tới `qa suite` qua
`qa run --qa-profile`, cùng một `qa-evidence.json` cũng bao gồm phần tóm tắt
bảng điểm hồ sơ cho các danh mục taxonomy đã chọn.
Hãy xem nó là công cụ hỗ trợ khám phá, không phải thay thế gate; kịch bản được chọn vẫn cần đúng chế độ provider, truyền tải live, Multipass, Testbox hoặc làn release cho hành vi đang được kiểm thử.
Để biết ngữ cảnh bảng điểm, xem [Bảng điểm trưởng thành](/vi/maturity/scorecard).

Đối với kiểm tra ký tự và phong cách, hãy chạy cùng kịch bản trên nhiều tham chiếu mô hình live
và ghi một báo cáo Markdown đã được chấm:

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

Lệnh này chạy các tiến trình con QA gateway cục bộ, không phải Docker. Các kịch bản đánh giá nhân vật nên đặt persona thông qua `SOUL.md`, rồi chạy các lượt người dùng thông thường như chat, trợ giúp workspace và các tác vụ tệp nhỏ. Không nên cho mô hình ứng viên biết rằng nó đang được đánh giá. Lệnh này giữ lại từng bản ghi phiên đầy đủ, ghi lại các thống kê chạy cơ bản, rồi yêu cầu các mô hình giám khảo ở chế độ nhanh với suy luận `xhigh` khi được hỗ trợ để xếp hạng các lượt chạy theo độ tự nhiên, vibe và sự hài hước.
Dùng `--blind-judge-models` khi so sánh các provider: prompt của giám khảo vẫn nhận mọi bản ghi phiên và trạng thái chạy, nhưng các tham chiếu ứng viên được thay bằng nhãn trung lập như `candidate-01`; báo cáo ánh xạ thứ hạng trở lại các tham chiếu thật sau khi phân tích cú pháp.
Các lượt chạy ứng viên mặc định dùng mức suy nghĩ `high`, với `medium` cho GPT-5.5 và `xhigh` cho các tham chiếu đánh giá OpenAI cũ hơn có hỗ trợ. Ghi đè một ứng viên cụ thể trực tiếp bằng `--model provider/model,thinking=<level>`. `--thinking <level>` vẫn đặt fallback toàn cục, và dạng cũ hơn `--model-thinking <provider/model=level>` được giữ để tương thích.
Các tham chiếu ứng viên OpenAI mặc định dùng chế độ nhanh để sử dụng xử lý ưu tiên khi provider hỗ trợ. Thêm trực tiếp `,fast`, `,no-fast`, hoặc `,fast=false` khi một ứng viên hoặc giám khảo riêng lẻ cần ghi đè. Chỉ truyền `--fast` khi bạn muốn buộc bật chế độ nhanh cho mọi mô hình ứng viên. Thời lượng của ứng viên và giám khảo được ghi lại trong báo cáo để phân tích benchmark, nhưng prompt giám khảo nói rõ là không xếp hạng theo tốc độ.
Các lượt chạy mô hình ứng viên và giám khảo đều mặc định dùng concurrency 16. Giảm `--concurrency` hoặc `--judge-concurrency` khi giới hạn provider hoặc áp lực gateway cục bộ khiến lượt chạy quá nhiễu.
Khi không truyền ứng viên `--model`, đánh giá nhân vật mặc định dùng `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, và
`google/gemini-3.1-pro-preview` khi không truyền `--model`.
Khi không truyền `--judge-model`, các giám khảo mặc định dùng
`openai/gpt-5.5,thinking=xhigh,fast` và
`anthropic/claude-opus-4-8,thinking=high`.

## Tài liệu liên quan

- [QA ma trận](/vi/concepts/qa-matrix)
- [Bảng điểm mức độ trưởng thành](/vi/maturity/scorecard)
- [Gói benchmark tác nhân cá nhân](/vi/concepts/personal-agent-benchmark-pack)
- [Kênh QA](/vi/channels/qa-channel)
- [Kiểm thử](/vi/help/testing)
- [Dashboard](/vi/web/dashboard)
