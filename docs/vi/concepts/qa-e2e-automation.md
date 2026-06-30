---
read_when:
    - Hiểu cách các thành phần QA phối hợp với nhau
    - Mở rộng qa-lab, qa-channel hoặc bộ chuyển đổi truyền tải
    - Thêm các kịch bản QA dựa trên repo
    - Xây dựng tự động hóa QA có độ chân thực cao hơn quanh bảng điều khiển Gateway
summary: 'Tổng quan về ngăn xếp QA: qa-lab, qa-channel, các kịch bản dựa trên repo, các làn truyền tải trực tiếp, bộ chuyển đổi truyền tải và báo cáo.'
title: Tổng quan QA
x-i18n:
    generated_at: "2026-06-30T14:08:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bffd191f985255f5c830d4e3d1c4ffa250097848195bc58d74104474448e3e1
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Ngăn xếp QA riêng tư nhằm kiểm thử OpenClaw theo cách thực tế hơn,
mang hình dạng kênh hơn so với một kiểm thử đơn vị đơn lẻ.

Các phần hiện tại:

- `extensions/qa-channel`: kênh tin nhắn tổng hợp với các bề mặt DM, kênh, chuỗi,
  reaction, chỉnh sửa và xóa.
- `extensions/qa-lab`: UI trình gỡ lỗi và bus QA để quan sát bản ghi,
  chèn tin nhắn đầu vào và xuất báo cáo Markdown.
- `extensions/qa-matrix`, các Plugin chạy trong tương lai: bộ chuyển đổi live-transport
  điều khiển một kênh thực bên trong Gateway QA con.
- `qa/`: tài sản seed dựa trên repo cho tác vụ khởi động và các kịch bản QA
  cơ sở.
- [Mantis](/vi/concepts/mantis): xác minh trực tiếp trước và sau cho các lỗi
  cần transport thực, ảnh chụp màn hình trình duyệt, trạng thái VM và bằng chứng PR.

## Bề mặt lệnh

Mọi luồng QA chạy dưới `pnpm openclaw qa <subcommand>`. Nhiều luồng có bí danh script `pnpm qa:*`;
cả hai dạng đều được hỗ trợ.

| Lệnh                                                | Mục đích                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Tự kiểm tra QA đi kèm không có `--qa-profile`; trình chạy hồ sơ độ trưởng thành dựa trên taxonomy với `--qa-profile smoke-ci`, `--qa-profile release`, hoặc `--qa-profile all`.                                                                                         |
| `qa suite`                                          | Chạy các kịch bản dựa trên repo trên làn Gateway QA. Bí danh: `pnpm openclaw qa suite --runner multipass` cho một VM Linux dùng một lần.                                                                                                                                |
| `qa coverage`                                       | In inventory phạm vi bao phủ kịch bản YAML (`--json` cho đầu ra máy đọc).                                                                                                                                                                                               |
| `qa parity-report`                                  | So sánh hai tệp `qa-suite-summary.json` và ghi báo cáo tương đồng agentic, hoặc dùng `--runtime-axis --token-efficiency` để ghi báo cáo tương đồng runtime Codex-vs-OpenClaw và hiệu quả token từ một bản tóm tắt cặp runtime.                                          |
| `qa character-eval`                                 | Chạy kịch bản QA nhân vật trên nhiều mô hình trực tiếp với báo cáo được chấm. Xem [Báo cáo](#reporting).                                                                                                                                                               |
| `qa manual`                                         | Chạy một prompt một lần trên làn nhà cung cấp/mô hình đã chọn.                                                                                                                                                                                                          |
| `qa ui`                                             | Khởi động UI trình gỡ lỗi QA và bus QA cục bộ (bí danh: `pnpm qa:lab:ui`).                                                                                                                                                                                              |
| `qa docker-build-image`                             | Xây dựng image Docker QA đã nướng sẵn.                                                                                                                                                                                                                                  |
| `qa docker-scaffold`                                | Ghi scaffold docker-compose cho bảng điều khiển QA + làn Gateway.                                                                                                                                                                                                       |
| `qa up`                                             | Xây dựng site QA, khởi động ngăn xếp dựa trên Docker, in URL (bí danh: `pnpm qa:lab:up`; biến thể `:fast` thêm `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Chỉ khởi động máy chủ nhà cung cấp AIMock.                                                                                                                                                                                                                              |
| `qa mock-openai`                                    | Chỉ khởi động máy chủ nhà cung cấp `mock-openai` nhận biết kịch bản.                                                                                                                                                                                                    |
| `qa credentials doctor` / `add` / `list` / `remove` | Quản lý nhóm thông tin xác thực Convex dùng chung.                                                                                                                                                                                                                      |
| `qa matrix`                                         | Làn transport trực tiếp trên homeserver Tuwunel dùng một lần. Xem [Matrix QA](/vi/concepts/qa-matrix).                                                                                                                                                                     |
| `qa telegram`                                       | Làn transport trực tiếp trên một nhóm Telegram riêng tư thực.                                                                                                                                                                                                           |
| `qa discord`                                        | Làn transport trực tiếp trên một kênh guild Discord riêng tư thực.                                                                                                                                                                                                      |
| `qa slack`                                          | Làn transport trực tiếp trên một kênh Slack riêng tư thực.                                                                                                                                                                                                              |
| `qa whatsapp`                                       | Làn transport trực tiếp trên các tài khoản WhatsApp Web thực.                                                                                                                                                                                                           |
| `qa mantis`                                         | Trình chạy xác minh trước và sau cho lỗi transport trực tiếp, với bằng chứng reaction trạng thái Discord, smoke desktop/trình duyệt Crabbox và smoke Slack-in-VNC. Xem [Mantis](/vi/concepts/mantis) và [Runbook Mantis Slack Desktop](/vi/concepts/mantis-slack-desktop-runbook). |

`qa run` dựa trên hồ sơ đọc thành viên từ `taxonomy.yaml`, rồi điều phối
các kịch bản đã phân giải qua `qa suite`. `--surface` và
`--category` lọc hồ sơ đã chọn thay vì định nghĩa các làn riêng.
`qa-evidence.json` thu được bao gồm tóm tắt scorecard hồ sơ với
số lượng danh mục đã chọn và ID phạm vi bao phủ bị thiếu; các mục bằng chứng
riêng lẻ vẫn là nguồn sự thật cho kiểm thử, vai trò phạm vi bao phủ và kết quả.
ID phạm vi bao phủ tính năng taxonomy là mục tiêu bằng chứng chính xác, không phải bí danh. Phạm vi bao phủ
kịch bản chính đáp ứng các ID khớp; phạm vi bao phủ phụ vẫn mang tính tư vấn.
ID phạm vi bao phủ dùng dạng `namespace.behavior` có dấu chấm với các đoạn
chữ-số thường/dấu gạch ngang; ID hồ sơ, bề mặt và danh mục vẫn có thể dùng
các ID taxonomy dạng gạch ngang hoặc có dấu chấm hiện có.
Bằng chứng gọn bỏ qua `execution` theo từng mục và đặt `evidenceMode: "slim"`;
`smoke-ci` mặc định dùng dạng gọn, và `--evidence-mode full` khôi phục các mục đầy đủ:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Dùng `smoke-ci` cho bằng chứng hồ sơ xác định với nhà cung cấp mô hình giả lập và
máy chủ nhà cung cấp cục bộ Crabline. Dùng `release` cho bằng chứng Stable/LTS trên các
kênh trực tiếp. Chỉ dùng `all` cho các lần chạy bằng chứng toàn taxonomy rõ ràng; nó chọn
mọi danh mục độ trưởng thành đang hoạt động và có thể được điều phối qua workflow `QA Profile
Evidence` với `qa_profile=all`. Khi một lệnh cũng cần hồ sơ gốc OpenClaw,
đặt hồ sơ gốc trước lệnh QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Luồng vận hành

Luồng vận hành QA hiện tại là một site QA hai khung:

- Trái: bảng điều khiển Gateway (Control UI) với agent.
- Phải: QA Lab, hiển thị bản ghi giống Slack và kế hoạch kịch bản.

Chạy bằng:

```bash
pnpm qa:lab:up
```

Lệnh đó xây dựng site QA, khởi động làn Gateway dựa trên Docker và hiển thị trang
QA Lab, nơi một người vận hành hoặc vòng lặp tự động hóa có thể giao cho agent một
nhiệm vụ QA, quan sát hành vi kênh thực và ghi lại điều gì hoạt động, thất bại hoặc
vẫn bị chặn.

Để lặp UI QA Lab cục bộ nhanh hơn mà không phải xây dựng lại image Docker mỗi lần,
khởi động ngăn xếp với bundle QA Lab được bind-mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` giữ các dịch vụ Docker trên image đã xây dựng sẵn và bind-mount
`extensions/qa-lab/web/dist` vào container `qa-lab`. `qa:lab:watch`
xây dựng lại bundle đó khi có thay đổi, và trình duyệt tự động tải lại khi hash tài sản
QA Lab thay đổi.

Để smoke tín hiệu OpenTelemetry cục bộ, chạy:

```bash
pnpm qa:otel:smoke
```

Script đó khởi động một bộ nhận OTLP/HTTP cục bộ, chạy kịch bản QA `otel-trace-smoke`
với Plugin `diagnostics-otel` được bật, rồi xác nhận traces,
metrics và logs được xuất. Nó giải mã các span trace protobuf đã xuất
và kiểm tra hình dạng trọng yếu cho phát hành:
`openclaw.run`, `openclaw.harness.run`, một span gọi mô hình theo
quy ước ngữ nghĩa GenAI mới nhất, `openclaw.context.assembled` và `openclaw.message.delivery`
phải có mặt. Smoke buộc
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, nên span gọi mô hình
phải dùng tên `{gen_ai.operation.name} {gen_ai.request.model}`;
các lần gọi mô hình không được xuất `StreamAbandoned` trên các lượt thành công; ID chẩn đoán thô và
thuộc tính `openclaw.content.*` phải không xuất hiện trong trace. Payload OTLP thô
không được chứa sentinel prompt, sentinel phản hồi hoặc khóa phiên QA.
Nó ghi `otel-smoke-summary.json` cạnh các artifact bộ QA.

Để smoke OpenTelemetry dựa trên collector, chạy:

```bash
pnpm qa:otel:collector-smoke
```

Làn đó đặt một container Docker OpenTelemetry Collector thực phía trước
cùng bộ nhận cục bộ. Dùng khi thay đổi dây nối endpoint, khả năng tương thích collector,
hoặc hành vi xuất OTLP mà bộ nhận trong tiến trình có thể che khuất.

Để smoke scrape Prometheus được bảo vệ, chạy:

```bash
pnpm qa:prometheus:smoke
```

Bí danh đó chạy kịch bản QA `docker-prometheus-smoke` với
`diagnostics-prometheus` được bật, xác minh các lượt scrape chưa xác thực bị từ chối,
sau đó kiểm tra lượt scrape đã xác thực có bao gồm các họ chỉ số trọng yếu cho bản phát hành
mà không có nội dung prompt, nội dung phản hồi, mã định danh chẩn đoán thô, token xác thực
hoặc đường dẫn cục bộ.

Để chạy liên tiếp cả hai smoke observability, hãy dùng:

```bash
pnpm qa:observability:smoke
```

Đối với tuyến OpenTelemetry có collector hỗ trợ cùng với smoke scrape Prometheus được bảo vệ,
hãy dùng:

```bash
pnpm qa:observability:collector-smoke
```

QA observability chỉ chạy từ source checkout. Tarball npm cố ý bỏ qua
QA Lab, vì vậy các tuyến phát hành Docker dạng package không chạy lệnh `qa`. Hãy dùng
`pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke`, hoặc
`pnpm qa:observability:smoke` từ một source checkout đã build khi thay đổi
instrumentation chẩn đoán.

Đối với một tuyến smoke Matrix dùng transport thật nhưng không yêu cầu thông tin xác thực
model-provider, hãy chạy profile nhanh với provider OpenAI giả lập xác định:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Đối với tuyến provider live-frontier, hãy cung cấp rõ ràng thông tin xác thực tương thích OpenAI:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

Tham chiếu CLI đầy đủ, danh mục profile/kịch bản, biến môi trường và bố cục artifact cho tuyến này nằm trong [QA Matrix](/vi/concepts/qa-matrix). Tóm tắt: tuyến này cấp phát một homeserver Tuwunel dùng một lần trong Docker, đăng ký người dùng tạm thời cho driver/SUT/observer, chạy Plugin Matrix thật bên trong một Gateway QA con được giới hạn cho transport đó (không có `qa-channel`), rồi ghi báo cáo Markdown, tóm tắt JSON, artifact sự kiện đã quan sát và log đầu ra tổng hợp dưới `.artifacts/qa-e2e/matrix-<timestamp>/`.

Các kịch bản bao phủ hành vi transport mà kiểm thử đơn vị không thể chứng minh end to end: chặn theo mention, chính sách allow-bot, allowlist, trả lời cấp cao nhất và theo thread, định tuyến DM, xử lý reaction, chặn chỉnh sửa inbound, dedupe replay sau khởi động lại, khôi phục khi homeserver bị gián đoạn, phân phối metadata phê duyệt, xử lý media và các luồng bootstrap/khôi phục/xác minh Matrix E2EE. Profile CLI E2EE cũng điều khiển `openclaw matrix encryption setup` và các lệnh xác minh qua cùng homeserver dùng một lần trước khi kiểm tra phản hồi Gateway.

Discord cũng có các kịch bản opt-in chỉ dành cho Mantis để tái hiện lỗi. Dùng
`--scenario discord-status-reactions-tool-only` cho timeline reaction trạng thái rõ ràng,
hoặc `--scenario discord-thread-reply-filepath-attachment` để tạo một thread Discord thật
và xác minh rằng `message.thread-reply` bảo toàn attachment
`filePath`. Các kịch bản này không nằm trong tuyến Discord live mặc định
vì chúng là probe tái hiện trước/sau thay vì phạm vi smoke rộng.
Workflow Mantis cho thread-attachment cũng có thể thêm video nhân chứng Discord Web
đã đăng nhập khi `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` hoặc
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` được cấu hình trong môi trường QA.
Profile viewer đó chỉ dùng để ghi hình trực quan; quyết định pass/fail
vẫn đến từ oracle Discord REST.

CI dùng cùng bề mặt lệnh trong `.github/workflows/qa-live-transports-convex.yml`.
Các lần chạy theo lịch và thủ công mặc định thực thi profile Matrix nhanh với
thông tin xác thực live-frontier do QA cung cấp, `--fast`, và
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Chạy thủ công với `matrix_profile=all` sẽ fan out
thành năm shard profile.

Đối với các tuyến smoke Telegram, Discord, Slack và WhatsApp dùng transport thật:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Chúng nhắm tới một kênh thật đã tồn tại với hai bot hoặc tài khoản (driver + SUT). Các biến môi trường bắt buộc, danh sách kịch bản, artifact đầu ra và credential pool Convex được ghi lại trong [tham chiếu QA Telegram, Discord, Slack và WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) bên dưới.

Đối với một lần chạy VM desktop Slack đầy đủ có cứu hộ VNC, hãy chạy:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Lệnh đó thuê một máy desktop/browser Crabbox, chạy tuyến Slack live
bên trong VM, mở Slack Web trong trình duyệt VNC, chụp desktop và
sao chép `slack-qa/`, `slack-desktop-smoke.png`, và `slack-desktop-smoke.mp4`
khi có thể ghi video trở lại thư mục artifact Mantis. Các lease desktop/browser Crabbox
cung cấp sẵn công cụ ghi hình và các package hỗ trợ browser/native-build,
vì vậy kịch bản chỉ nên cài fallback trên các lease cũ hơn.
Mantis báo cáo thời gian tổng và theo từng pha trong
`mantis-slack-desktop-smoke-report.md` để các lần chạy chậm cho thấy thời gian nằm ở
khâu warmup lease, lấy thông tin xác thực, thiết lập từ xa hay sao chép artifact. Tái sử dụng
`--lease-id <cbx_...>` sau khi đăng nhập Slack Web thủ công qua VNC;
các lease tái sử dụng cũng giữ cache pnpm store của Crabbox ở trạng thái ấm. Mặc định
`--hydrate-mode source` xác minh từ source checkout và chạy install/build
bên trong VM. Chỉ dùng `--hydrate-mode prehydrated` khi workspace từ xa được tái sử dụng
đã có `node_modules` và `dist/` đã build; chế độ đó bỏ qua bước
install/build tốn kém và fail closed khi workspace chưa sẵn sàng.
Với `--gateway-setup`, Mantis để lại một Gateway Slack OpenClaw
bền vững chạy bên trong VM trên cổng `38973`; nếu không có tùy chọn này, lệnh chạy
tuyến QA Slack bot-to-bot bình thường và thoát sau khi ghi artifact.

Để chứng minh UI phê duyệt Slack native bằng bằng chứng desktop, hãy chạy chế độ checkpoint phê duyệt Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Chế độ này loại trừ lẫn nhau với `--gateway-setup`. Nó chạy các kịch bản
phê duyệt Slack, từ chối các id kịch bản không phải phê duyệt, chờ ở mỗi trạng thái phê duyệt
đang chờ và đã xử lý, render tin nhắn Slack API đã quan sát vào
`approval-checkpoints/<scenario>-pending.png` và
`approval-checkpoints/<scenario>-resolved.png`, rồi fail nếu thiếu hoặc rỗng bất kỳ checkpoint,
bằng chứng tin nhắn, acknowledgement hoặc ảnh chụp màn hình đã render nào.
Các lease CI lạnh vẫn có thể hiển thị đăng nhập Slack trong `slack-desktop-smoke.png`;
ảnh checkpoint phê duyệt là bằng chứng trực quan cho tuyến này.

Checklist vận hành, lệnh dispatch workflow GitHub, hợp đồng comment bằng chứng,
bảng quyết định hydrate-mode, diễn giải thời gian và các bước xử lý lỗi nằm trong [Runbook Mantis Slack Desktop](/vi/concepts/mantis-slack-desktop-runbook).

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
Khi đặt `--expect-text`, prompt vision yêu cầu một verdict JSON có cấu trúc
và chỉ pass khi model báo cáo bằng chứng hiển thị tích cực; một phản hồi
phủ định chỉ trích dẫn văn bản mục tiêu sẽ fail assertion.
Dùng `--vision-mode metadata` cho smoke không dùng model nhằm chứng minh desktop,
trình duyệt, ảnh chụp màn hình và hệ thống video mà không gọi provider hiểu ảnh.
Ghi hình là artifact bắt buộc cho `visual-task`; nếu Crabbox không ghi được
`visual-task.mp4` không rỗng, tác vụ sẽ fail ngay cả khi visual driver
đã pass. Khi thất bại, Mantis giữ lease cho VNC trừ khi tác vụ đã
pass và không đặt `--keep-lease`.

Trước khi dùng thông tin xác thực live dạng pool, hãy chạy:

```bash
pnpm openclaw qa credentials doctor
```

Doctor kiểm tra môi trường broker Convex, xác thực thiết lập endpoint và xác minh khả năng truy cập admin/list khi có secret maintainer. Nó chỉ báo cáo trạng thái đã đặt/thiếu cho secret.

## Phạm vi transport live

Các tuyến transport live chia sẻ một hợp đồng thay vì mỗi tuyến tự phát minh hình dạng danh sách kịch bản riêng. `qa-channel` là bộ kiểm thử tổng hợp rộng cho hành vi sản phẩm và không thuộc ma trận phạm vi transport live.

Các runner transport live nên import id kịch bản dùng chung, helper phạm vi
baseline và helper chọn kịch bản từ
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Tuyến    | Canary | Chặn theo mention | Bot-to-bot | Chặn allowlist | Trả lời cấp cao nhất | Trả lời quote | Tiếp tục sau khởi động lại | Follow-up thread | Cô lập thread | Quan sát reaction | Lệnh trợ giúp | Đăng ký lệnh native |
| -------- | ------ | ----------------- | ---------- | -------------- | -------------------- | ------------- | -------------------------- | ---------------- | ------------- | ------------------ | ------------ | ------------------- |
| Matrix   | x      | x                 | x          | x              | x                    |               | x                          | x                | x             | x                  |              |                     |
| Telegram | x      | x                 | x          |                |                      |               |                            |                  |               |                    | x            |                     |
| Discord  | x      | x                 | x          |                |                      |               |                            |                  |               |                    |              | x                   |
| Slack    | x      | x                 | x          | x              | x                    |               | x                          | x                | x             |                    |              |                     |
| WhatsApp | x      | x                 |            | x              | x                    | x             | x                          |                  |               | x                  | x            |                     |

Điều này giữ `qa-channel` là bộ kiểm thử rộng cho hành vi sản phẩm, trong khi Matrix,
Telegram và các transport live khác chia sẻ một checklist hợp đồng transport rõ ràng.

Đối với một tuyến VM Linux dùng một lần mà không đưa Docker vào đường dẫn QA, hãy chạy:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Lệnh này khởi động một guest Multipass mới, cài dependencies, build OpenClaw
bên trong guest, chạy `qa suite`, rồi sao chép báo cáo QA và
tóm tắt bình thường trở lại `.artifacts/qa-e2e/...` trên host.
Nó tái sử dụng cùng hành vi chọn kịch bản như `qa suite` trên host.
Các lần chạy suite trên host và Multipass thực thi nhiều kịch bản đã chọn song song
với các worker Gateway cô lập theo mặc định. `qa-channel` mặc định concurrency
4, bị giới hạn bởi số lượng kịch bản đã chọn. Dùng `--concurrency <count>` để tinh chỉnh
số worker, hoặc `--concurrency 1` để thực thi tuần tự.
Dùng `--pack personal-agent` để chạy pack benchmark trợ lý cá nhân. Bộ chọn
pack có tính cộng thêm với các cờ `--scenario` lặp lại: kịch bản rõ ràng
chạy trước, sau đó kịch bản trong pack chạy theo thứ tự pack với các bản trùng lặp bị loại bỏ.
Dùng `--pack observability` khi một runner QA tùy chỉnh đã cung cấp thiết lập
collector OpenTelemetry và muốn chọn cùng lúc các kịch bản smoke chẩn đoán
OpenTelemetry và Prometheus.
Lệnh thoát với mã khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi
bạn muốn có artifact mà không có mã thoát thất bại.
Các lần chạy live chuyển tiếp những đầu vào xác thực QA được hỗ trợ và thực tế cho
guest: khóa provider dựa trên env, đường dẫn cấu hình provider live QA và
`CODEX_HOME` khi có. Giữ `--output-dir` dưới repo root để guest
có thể ghi ngược lại qua workspace đã mount.

## Tài liệu tham chiếu QA cho Telegram, Discord, Slack và WhatsApp

Matrix có một [trang riêng](/vi/concepts/qa-matrix) vì số lượng kịch bản của nó và việc cấp phát homeserver dựa trên Docker. Telegram, Discord, Slack và WhatsApp chạy trên các transport thực có sẵn từ trước, nên tài liệu tham chiếu của chúng nằm ở đây.

### Cờ CLI dùng chung

Các lane này đăng ký thông qua `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` và chấp nhận cùng các cờ:

| Cờ                                    | Mặc định                                           | Mô tả                                                                                                                                                  |
| ------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--scenario <id>`                     | -                                                  | Chỉ chạy kịch bản này. Có thể lặp lại.                                                                                                                 |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Nơi ghi báo cáo, tóm tắt, bằng chứng, artifact theo transport và nhật ký đầu ra. Đường dẫn tương đối được phân giải theo `--repo-root`.                |
| `--repo-root <path>`                  | `process.cwd()`                                    | Gốc kho lưu trữ khi gọi từ một cwd trung lập.                                                                                                          |
| `--sut-account <id>`                  | `sut`                                              | ID tài khoản tạm thời bên trong cấu hình QA gateway.                                                                                                   |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` hoặc `live-frontier` (`live-openai` cũ vẫn hoạt động).                                                                                   |
| `--model <ref>` / `--alt-model <ref>` | mặc định của provider                              | Ref mô hình chính/thay thế.                                                                                                                           |
| `--fast`                              | tắt                                                | Chế độ nhanh của provider khi được hỗ trợ.                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | Xem [nhóm thông tin xác thực Convex](#convex-credential-pool).                                                                                         |
| `--credential-role <maintainer\|ci>`  | `ci` trong CI, nếu không là `maintainer`           | Vai trò được dùng khi `--credential-source convex`.                                                                                                    |

Mỗi lane thoát với mã khác 0 khi có bất kỳ kịch bản nào thất bại. `--allow-failures` ghi artifact mà không đặt mã thoát thất bại.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Nhắm tới một nhóm Telegram riêng tư thực với hai bot riêng biệt (driver + SUT). Bot SUT phải có tên người dùng Telegram; quan sát bot-to-bot hoạt động tốt nhất khi cả hai bot đều bật **Bot-to-Bot Communication Mode** trong `@BotFather`.

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

Tập mặc định ngầm định luôn bao phủ canary, mention gating, phản hồi lệnh native, định địa chỉ lệnh và phản hồi nhóm bot-to-bot. Mặc định `mock-openai` cũng bao gồm các kiểm tra deterministic reply-chain và phát trực tuyến final-message. `telegram-current-session-status-tool` vẫn là opt-in vì nó chỉ ổn định khi được luồng trực tiếp sau canary, không phải sau các phản hồi lệnh native tùy ý. Dùng `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` để in phân tách mặc định/tùy chọn hiện tại cùng các ref hồi quy.

Artifact đầu ra:

- `telegram-qa-report.md`
- `qa-evidence.json` - các mục bằng chứng cho kiểm tra transport live, bao gồm các trường profile, coverage, provider, channel, artifacts, result và RTT.

Các lần chạy Telegram của package dùng cùng hợp đồng thông tin xác thực Telegram. Đo RTT lặp lại là một phần của lane Telegram live package thông thường; phân phối RTT được gộp vào `qa-evidence.json` dưới `result.timing` cho kiểm tra RTT đã chọn.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Khi đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, wrapper live package thuê thông tin xác thực `kind: "telegram"`, xuất env nhóm/driver/bot SUT đã thuê vào lần chạy package đã cài đặt, gửi Heartbeat cho lease và giải phóng khi shutdown. Wrapper package mặc định chạy 20 kiểm tra RTT của `telegram-mentioned-message-reply`, timeout RTT 30 giây và vai trò Convex `maintainer` ngoài CI khi chọn Convex. Ghi đè `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` hoặc `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` để tinh chỉnh đo RTT mà không tạo lệnh RTT riêng hoặc định dạng tóm tắt riêng cho Telegram.

### QA Discord

```bash
pnpm openclaw qa discord
```

Nhắm tới một kênh guild Discord riêng tư thực với hai bot: bot driver do harness điều khiển và bot SUT được Gateway OpenClaw con khởi động thông qua Plugin Discord đi kèm. Xác minh xử lý mention kênh, rằng bot SUT đã đăng ký lệnh native `/help` với Discord, và các kịch bản bằng chứng Mantis opt-in.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - phải khớp ID người dùng bot SUT do Discord trả về (nếu không lane sẽ fail fast).

Tùy chọn:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` giữ nội dung tin nhắn trong artifact observed-message.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` chọn kênh voice/stage cho `discord-voice-autojoin`; nếu không có, kịch bản chọn kênh voice/stage hiển thị đầu tiên cho bot SUT.

Kịch bản (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - kịch bản voice opt-in. Chạy độc lập, bật `channels.discord.voice.autoJoin`, và xác minh trạng thái voice Discord hiện tại của bot SUT là kênh voice/stage mục tiêu. Thông tin xác thực Discord Convex có thể bao gồm `voiceChannelId` tùy chọn; nếu không, runner phát hiện kênh voice/stage hiển thị đầu tiên trong guild.
- `discord-status-reactions-tool-only` - kịch bản Mantis opt-in. Chạy độc lập vì nó chuyển SUT sang phản hồi guild always-on, chỉ công cụ với `messages.statusReactions.enabled=true`, rồi ghi lại timeline reaction REST cùng artifact trực quan HTML/PNG. Báo cáo trước/sau Mantis cũng giữ artifact MP4 do kịch bản cung cấp dưới dạng `baseline.mp4` và `candidate.mp4`.

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
- `qa-evidence.json` - các mục bằng chứng cho kiểm tra transport live.
- `discord-qa-observed-messages.json` - nội dung được biên tập lại trừ khi `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` và `discord-status-reactions-tool-only-timeline.png` khi kịch bản status-reaction chạy.

### QA Slack

```bash
pnpm openclaw qa slack
```

Nhắm tới một kênh Slack riêng tư thực với hai bot riêng biệt: bot driver do harness điều khiển và bot SUT được Gateway OpenClaw con khởi động thông qua Plugin Slack đi kèm.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Tùy chọn:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` giữ nội dung tin nhắn trong artifact observed-message.
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
- `slack-approval-exec-native` - kịch bản phê duyệt exec native Slack opt-in. Yêu cầu phê duyệt exec thông qua gateway, xác minh tin nhắn Slack có nút phê duyệt native, phân giải nó, và xác minh cập nhật Slack đã phân giải.
- `slack-approval-plugin-native` - kịch bản phê duyệt Plugin native Slack opt-in. Bật chuyển tiếp phê duyệt exec và Plugin cùng lúc để sự kiện Plugin không bị chặn bởi định tuyến phê duyệt exec, rồi xác minh cùng đường dẫn UI Slack native pending/resolved.

Artifact đầu ra:

- `slack-qa-report.md`
- `qa-evidence.json` - các mục bằng chứng cho kiểm tra transport live.
- `slack-qa-observed-messages.json` - nội dung được biên tập lại trừ khi `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - chỉ khi Mantis đặt `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; chứa JSON checkpoint, JSON xác nhận và ảnh chụp màn hình pending/resolved.

#### Thiết lập workspace Slack

Lane cần hai ứng dụng Slack riêng biệt trong một workspace, cùng một kênh mà cả hai bot đều là thành viên:

- `channelId` - ID `Cxxxxxxxxxx` của kênh mà cả hai bot đã được mời vào. Dùng một kênh chuyên dụng; lane đăng bài ở mỗi lần chạy.
- `driverBotToken` - token bot (`xoxb-...`) của ứng dụng **Driver**.
- `sutBotToken` - token bot (`xoxb-...`) của ứng dụng **SUT**, phải là ứng dụng Slack riêng biệt với driver để ID người dùng bot của nó là riêng biệt.
- `sutAppToken` - token cấp ứng dụng (`xapp-...`) của ứng dụng SUT với `connections:write`, được Socket Mode dùng để ứng dụng SUT có thể nhận sự kiện.

Nên dùng một workspace Slack dành riêng cho QA thay vì tái sử dụng workspace production.

Manifest SUT bên dưới cố ý thu hẹp cài đặt production của Plugin Slack đi kèm (`extensions/slack/src/setup-shared.ts:10`) xuống các quyền và sự kiện được bộ kiểm thử QA Slack live bao phủ. Với thiết lập kênh production như người dùng thấy, xem [thiết lập nhanh kênh Slack](/vi/channels/slack#quick-setup); cặp QA Driver/SUT cố ý tách riêng vì lane cần hai ID người dùng bot riêng biệt trong một workspace.

**1. Tạo ứng dụng Driver**

Đi tới [api.slack.com/apps](https://api.slack.com/apps) → _Tạo ứng dụng mới_ → _Từ manifest_ → chọn workspace QA, dán manifest sau, rồi _Cài đặt vào Workspace_:

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

Sao chép _Bot User OAuth Token_ (`xoxb-...`) - token đó trở thành `driverBotToken`. Driver chỉ cần đăng tin nhắn và tự định danh; không cần event, không cần Socket Mode.

**2. Tạo ứng dụng SUT**

Lặp lại _Tạo ứng dụng mới → Từ manifest_ trong cùng workspace. Ứng dụng QA này cố ý dùng một phiên bản hẹp hơn của manifest production của Plugin Slack đi kèm (`extensions/slack/src/setup-shared.ts:10`): các scope và event phản ứng được bỏ qua vì bộ Slack QA trực tiếp chưa bao phủ xử lý phản ứng.

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

- _Cài đặt vào Workspace_ → sao chép _Bot User OAuth Token_ → token đó trở thành `sutBotToken`.
- _Thông tin cơ bản → App-Level Tokens → Tạo Token và Scope_ → thêm scope `connections:write` → lưu → sao chép giá trị `xapp-...` → giá trị đó trở thành `sutAppToken`.

Xác minh hai bot có user id khác nhau bằng cách gọi `auth.test` trên từng token. Runtime phân biệt driver và SUT theo user id; dùng lại một ứng dụng cho cả hai sẽ làm kiểm soát mention-gating thất bại ngay lập tức.

**3. Tạo kênh**

Trong workspace QA, tạo một kênh, ví dụ `#openclaw-qa`, và mời cả hai bot từ bên trong kênh:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Sao chép id `Cxxxxxxxxxx` từ _thông tin kênh → Giới thiệu → Channel ID_ - id đó trở thành `channelId`. Kênh công khai hoạt động được; nếu dùng kênh riêng tư thì cả hai ứng dụng đã có `groups:history`, nên các lần đọc lịch sử của harness vẫn sẽ thành công.

**4. Đăng ký thông tin xác thực**

Có hai tùy chọn. Dùng env var để debug trên một máy duy nhất, đặt bốn biến `OPENCLAW_QA_SLACK_*` và truyền `--credential-source env`, hoặc seed pool Convex dùng chung để CI và các maintainer khác có thể lease chúng.

Với pool Convex, ghi bốn trường vào một tệp JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Sau khi export `OPENCLAW_QA_CONVEX_SITE_URL` và `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` trong shell, hãy đăng ký và xác minh:

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

Một lần chạy xanh hoàn tất trong chưa tới 30 giây và `slack-qa-report.md` hiển thị cả `slack-canary` và `slack-mention-gating` ở trạng thái `pass`. Nếu lane treo khoảng 90 giây và thoát với `Convex credential pool exhausted for kind "slack"`, thì pool đang trống hoặc mọi hàng đều đã được lease - `qa credentials list --kind slack --status all --json` sẽ cho biết trường hợp nào.

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

Nhắm tới hai tài khoản WhatsApp Web chuyên dụng: một tài khoản driver do
harness điều khiển và một tài khoản SUT được Gateway con của OpenClaw khởi động thông qua
Plugin WhatsApp đi kèm.

Env bắt buộc khi dùng `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Tùy chọn:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` bật các kịch bản nhóm như
  `whatsapp-mention-gating` và `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` giữ nội dung tin nhắn trong
  artifact observed-message.

Danh mục kịch bản (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Baseline và kiểm soát nhóm: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-top-level-reply-shape`,
  `whatsapp-restart-resume`, `whatsapp-group-allowlist-block`.
- Lệnh native: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Hành vi trả lời và final-output: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-context-isolation`, `whatsapp-reply-delivery-shape`,
  `whatsapp-stream-final-message-accounting`.
- Media inbound và tin nhắn có cấu trúc: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`. Các kịch bản này gửi event hình ảnh, âm thanh,
  tài liệu, vị trí, liên hệ và sticker WhatsApp thật thông qua driver.
- Bao phủ Gateway outbound và hành động tin nhắn:
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
chạy 31 kịch bản xác định qua transport WhatsApp thật trong khi
chỉ mock đầu ra của model. Các kịch bản phê duyệt và một vài kiểm tra nặng hơn/chặn
vẫn được chạy tường minh theo id kịch bản.

Driver WhatsApp QA quan sát các event trực tiếp có cấu trúc (`text`, `media`,
`location`, `reaction`, và `poll`) và có thể chủ động gửi media, poll,
liên hệ, vị trí và sticker. QA Lab import driver đó thông qua bề mặt package
`@openclaw/whatsapp/api.js` thay vì truy cập vào các tệp runtime WhatsApp riêng tư.
Nội dung tin nhắn được biên tập ẩn theo mặc định. Bao phủ poll outbound
và upload-file chạy qua các lệnh Gateway xác định `poll` và
`message.action` thay vì chỉ gọi công cụ qua prompt model.

Artifact đầu ra:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - các mục bằng chứng cho kiểm tra transport trực tiếp.
- `whatsapp-qa-observed-messages.json` - nội dung được biên tập ẩn trừ khi `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Pool thông tin xác thực Convex

Các lane Telegram, Discord, Slack và WhatsApp có thể lease thông tin xác thực từ pool Convex dùng chung thay vì đọc các env var ở trên. Truyền `--credential-source convex` hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`; QA Lab lấy một lease độc quyền, gửi Heartbeat cho lease đó trong suốt thời gian chạy, và giải phóng khi tắt. Các kind của pool là `"telegram"`, `"discord"`, `"slack"` và `"whatsapp"`.

Các shape payload mà broker xác thực trên `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` phải là chuỗi chat-id dạng số.
- Người dùng thật Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - chỉ dành cho bằng chứng Mantis Telegram Desktop. Các lane QA Lab chung không được lấy kind này.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - số điện thoại phải là các chuỗi E.164 khác nhau.

Quy trình bằng chứng Mantis Telegram Desktop giữ một lease Convex
`telegram-user` độc quyền cho cả driver TDLib CLI và nhân chứng Telegram Desktop,
rồi giải phóng lease sau khi xuất bản bằng chứng.

Khi một PR cần diff hình ảnh xác định, Mantis có thể dùng cùng một phản hồi model mock
trên `main` và trên head của PR trong khi formatter hoặc lớp phân phối của Telegram
thay đổi. Mặc định capture được tinh chỉnh cho bình luận PR: lớp Crabbox
chuẩn, quay desktop 24fps, GIF chuyển động 24fps và chiều rộng preview 1920px.
Bình luận before/after nên xuất bản một bundle sạch chỉ chứa các GIF
dự kiến.

Các lane Slack cũng có thể dùng pool. Kiểm tra shape payload Slack hiện nằm trong runner Slack QA thay vì broker; dùng `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, với Slack channel id như `Cxxxxxxxxxx`. Xem [Thiết lập workspace Slack](#setting-up-the-slack-workspace) để cấp phát ứng dụng và scope.

Các env var vận hành và hợp đồng endpoint broker Convex nằm trong [Testing → Thông tin xác thực Telegram dùng chung qua Convex](/vi/help/testing#shared-telegram-credentials-via-convex-v1) (tên phần có từ trước pool đa kênh; ngữ nghĩa lease được dùng chung cho các kind).

## Seed dựa trên repo

Asset seed nằm trong `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Các tệp này được cố ý đưa vào git để kế hoạch QA hiển thị với cả con người và
agent.

`qa-lab` nên tiếp tục là một runner kịch bản YAML chung. Mỗi tệp YAML kịch bản là
nguồn sự thật cho một lần chạy kiểm thử và nên định nghĩa:

- `title` cấp cao nhất
- metadata `scenario`
- metadata category, capability, lane và risk tùy chọn trong `scenario`
- refs tài liệu và mã trong `scenario`
- yêu cầu Plugin tùy chọn trong `scenario`
- bản vá cấu hình Gateway tùy chọn trong `scenario`
- `flow` thực thi được cấp cao nhất cho các kịch bản flow, hoặc `scenario.execution.kind` /
  `scenario.execution.path` cho các kịch bản Vitest và Playwright

Bề mặt runtime tái sử dụng hỗ trợ `flow` được phép giữ tính tổng quát
và xuyên suốt nhiều mảng. Ví dụ, các kịch bản YAML có thể kết hợp helper phía transport
với helper phía trình duyệt để điều khiển Control UI nhúng thông qua seam
Gateway `browser.request` mà không cần thêm runner trường hợp đặc biệt.

Các tệp kịch bản nên được nhóm theo năng lực sản phẩm thay vì thư mục
cây mã nguồn. Giữ ID kịch bản ổn định khi di chuyển tệp; dùng `docsRefs` và `codeRefs`
để truy vết triển khai.

Danh sách baseline nên đủ rộng để bao phủ:

- Trò chuyện DM và kênh
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

- `mock-openai` là mock OpenClaw nhận biết kịch bản. Nó vẫn là lane mock
  xác định mặc định cho QA dựa trên repo và các gate tương đương.
- `aimock` khởi động một server provider dựa trên AIMock cho độ phủ giao thức,
  fixture, ghi/phát lại và chaos thử nghiệm. Nó là phần bổ sung và không
  thay thế dispatcher kịch bản `mock-openai`.

Triển khai provider-lane nằm dưới `extensions/qa-lab/src/providers/`.
Mỗi provider sở hữu mặc định, khởi động server cục bộ, cấu hình model Gateway,
nhu cầu staging auth-profile, và các cờ năng lực live/mock của riêng mình. Mã suite dùng chung và
gateway nên định tuyến qua registry provider thay vì rẽ nhánh theo
tên provider.

## Adapter transport

`qa-lab` sở hữu một seam transport tổng quát cho các kịch bản QA YAML. `qa-channel` là
mặc định tổng hợp. `crabline` khởi động các server cục bộ có hình dạng provider và chạy
các plugin kênh thông thường của OpenClaw trên chúng. `live` được dành cho thông tin xác thực
provider thật và các kênh bên ngoài.

Ở cấp kiến trúc, phần tách là:

- `qa-lab` sở hữu thực thi kịch bản tổng quát, concurrency worker, ghi artifact và báo cáo.
- Adapter transport sở hữu cấu hình gateway, trạng thái sẵn sàng, quan sát inbound và outbound, hành động transport, và trạng thái transport đã chuẩn hóa.
- Các tệp kịch bản YAML dưới `qa/scenarios/` định nghĩa lần chạy kiểm thử; `qa-lab` cung cấp bề mặt runtime tái sử dụng để thực thi chúng.

### Thêm một kênh

Thêm một kênh vào hệ thống QA YAML yêu cầu phần triển khai kênh cùng
một gói kịch bản kiểm tra hợp đồng kênh. Để có độ phủ CI smoke, hãy thêm
server provider cục bộ Crabline tương ứng và expose nó qua driver `crabline`.

Không thêm một gốc lệnh QA cấp cao mới khi host `qa-lab` dùng chung có thể sở hữu flow.

`qa-lab` sở hữu cơ chế host dùng chung:

- gốc lệnh `openclaw qa`
- khởi động và teardown suite
- concurrency worker
- ghi artifact
- tạo báo cáo
- thực thi kịch bản
- alias tương thích cho các kịch bản `qa-channel` cũ hơn

Plugin runner sở hữu hợp đồng transport:

- cách `openclaw qa <runner>` được mount dưới gốc `qa` dùng chung
- cách gateway được cấu hình cho transport đó
- cách kiểm tra trạng thái sẵn sàng
- cách tiêm sự kiện inbound
- cách quan sát tin nhắn outbound
- cách expose transcript và trạng thái transport đã chuẩn hóa
- cách thực thi các hành động dựa trên transport
- cách xử lý reset hoặc dọn dẹp riêng cho transport

Ngưỡng áp dụng tối thiểu cho một kênh mới:

1. Giữ `qa-lab` là owner của gốc `qa` dùng chung.
2. Triển khai runner transport trên seam host `qa-lab` dùng chung.
3. Giữ cơ chế riêng cho transport bên trong plugin runner hoặc harness kênh.
4. Mount runner dưới dạng `openclaw qa <runner>` thay vì đăng ký một lệnh gốc cạnh tranh. Plugin runner nên khai báo `qaRunners` trong `openclaw.plugin.json` và export một mảng `qaRunnerCliRegistrations` tương ứng từ `runtime-api.ts`. Giữ `runtime-api.ts` gọn nhẹ; CLI lazy và thực thi runner nên nằm sau các entrypoint riêng.
5. Viết hoặc điều chỉnh các kịch bản YAML dưới các thư mục theo chủ đề `qa/scenarios/`.
6. Dùng các helper kịch bản tổng quát cho kịch bản mới.
7. Giữ các alias tương thích hiện có hoạt động trừ khi repo đang thực hiện một migration có chủ ý.

Quy tắc quyết định rất nghiêm ngặt:

- Nếu hành vi có thể được biểu đạt một lần trong `qa-lab`, hãy đặt nó trong `qa-lab`.
- Nếu hành vi phụ thuộc vào một transport kênh, hãy giữ nó trong plugin runner hoặc plugin harness đó.
- Nếu một kịch bản cần năng lực mới mà nhiều hơn một kênh có thể dùng, hãy thêm helper tổng quát thay vì một nhánh riêng cho kênh trong `suite.ts`.
- Nếu một hành vi chỉ có ý nghĩa với một transport, hãy giữ kịch bản riêng cho transport và làm rõ điều đó trong hợp đồng kịch bản.

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

Các alias tương thích vẫn có sẵn cho kịch bản hiện có - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - nhưng việc biên soạn kịch bản mới nên dùng tên tổng quát. Các alias tồn tại để tránh một migration đồng loạt bắt buộc, không phải là mô hình về sau.

## Báo cáo

`qa-lab` export một báo cáo giao thức Markdown từ timeline bus quan sát được.
Báo cáo nên trả lời:

- Điều gì hoạt động
- Điều gì thất bại
- Điều gì vẫn bị chặn
- Những kịch bản follow-up nào đáng thêm

Để xem inventory các kịch bản có sẵn - hữu ích khi ước lượng công việc follow-up hoặc nối dây một transport mới - chạy `pnpm openclaw qa coverage` (thêm `--json` để có đầu ra máy đọc được).
Khi chọn proof tập trung cho một hành vi hoặc đường dẫn tệp được chạm tới, chạy `pnpm openclaw qa coverage --match <query>`.
Báo cáo match tìm trong metadata kịch bản, refs tài liệu, refs mã, ID độ phủ, plugin và yêu cầu provider, rồi in các target `qa suite --scenario ...` khớp.
Mỗi lần chạy `qa suite` ghi các artifact cấp cao nhất `qa-evidence.json`,
`qa-suite-summary.json`, và `qa-suite-report.md` cho tập
kịch bản đã chọn. Các kịch bản khai báo `execution.kind: vitest` hoặc
`execution.kind: playwright` chạy đường dẫn kiểm thử tương ứng và cũng ghi
log theo từng kịch bản. Các kịch bản khai báo `execution.kind: script` chạy
producer bằng chứng tại `execution.path` qua `node --import tsx` (với
`${outputDir}` và `${scenarioId}` được mở rộng trong `execution.args`); producer
ghi `qa-evidence.json` của riêng nó, các entry trong đó được nhập vào đầu ra
suite và các đường dẫn artifact của nó được resolve tương đối với
`qa-evidence.json` của producer đó. Khi truy cập `qa suite` qua
`qa run --qa-profile`, cùng `qa-evidence.json` cũng bao gồm tóm tắt scorecard
profile cho các danh mục taxonomy đã chọn.
Hãy xem nó như một công cụ hỗ trợ khám phá, không phải thay thế gate; kịch bản đã chọn vẫn cần đúng chế độ provider, transport live, Multipass, Testbox hoặc lane phát hành cho hành vi đang kiểm thử.
Để biết ngữ cảnh scorecard, xem [Scorecard mức độ trưởng thành](/vi/maturity/scorecard).

Để kiểm tra character và phong cách, chạy cùng kịch bản trên nhiều ref model live
và ghi một báo cáo Markdown đã được judge:

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

Lệnh này chạy các tiến trình con QA gateway cục bộ, không phải Docker. Các kịch bản eval character
nên đặt persona qua `SOUL.md`, rồi chạy các lượt người dùng thông thường
như chat, hỗ trợ workspace và tác vụ tệp nhỏ. Không nên nói cho model ứng viên
rằng nó đang được đánh giá. Lệnh giữ lại từng transcript đầy đủ,
ghi stats chạy cơ bản, rồi yêu cầu các model judge ở fast mode với
reasoning `xhigh` nơi được hỗ trợ để xếp hạng các lần chạy theo độ tự nhiên, vibe và sự hài hước.
Dùng `--blind-judge-models` khi so sánh provider: prompt judge vẫn nhận
mọi transcript và trạng thái chạy, nhưng ref ứng viên được thay bằng
nhãn trung lập như `candidate-01`; báo cáo ánh xạ thứ hạng trở lại ref thật sau
khi phân tích.
Các lần chạy ứng viên mặc định dùng thinking `high`, với `medium` cho GPT-5.5 và `xhigh`
cho các ref eval OpenAI cũ hơn có hỗ trợ. Ghi đè một ứng viên cụ thể inline bằng
`--model provider/model,thinking=<level>`. `--thinking <level>` vẫn đặt một
fallback toàn cục, và dạng cũ hơn `--model-thinking <provider/model=level>` được
giữ để tương thích.
Ref ứng viên OpenAI mặc định dùng fast mode để xử lý ưu tiên được dùng ở nơi
provider hỗ trợ. Thêm `,fast`, `,no-fast`, hoặc `,fast=false` inline khi một
ứng viên hoặc judge riêng lẻ cần ghi đè. Chỉ truyền `--fast` khi bạn muốn
bật fast mode bắt buộc cho mọi model ứng viên. Thời lượng ứng viên và judge được
ghi trong báo cáo để phân tích benchmark, nhưng prompt judge nói rõ
không xếp hạng theo tốc độ.
Các lần chạy model ứng viên và judge đều mặc định concurrency 16. Giảm
`--concurrency` hoặc `--judge-concurrency` khi giới hạn provider hoặc áp lực gateway
cục bộ làm một lần chạy quá nhiễu.
Khi không truyền `--model` ứng viên, character eval mặc định là
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, và
`google/gemini-3.1-pro-preview` khi không truyền `--model`.
Khi không truyền `--judge-model`, judge mặc định là
`openai/gpt-5.5,thinking=xhigh,fast` và
`anthropic/claude-opus-4-8,thinking=high`.

## Tài liệu liên quan

- [QA ma trận](/vi/concepts/qa-matrix)
- [Scorecard mức độ trưởng thành](/vi/maturity/scorecard)
- [Gói benchmark agent cá nhân](/vi/concepts/personal-agent-benchmark-pack)
- [QA Channel](/vi/channels/qa-channel)
- [Kiểm thử](/vi/help/testing)
- [Dashboard](/vi/web/dashboard)
