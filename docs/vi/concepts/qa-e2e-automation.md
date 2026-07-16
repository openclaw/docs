---
doc-schema-version: 1
read_when:
    - Tìm hiểu cách các thành phần trong ngăn xếp QA phối hợp với nhau
    - Mở rộng qa-lab, qa-channel hoặc bộ điều hợp truyền tải
    - Thêm các kịch bản QA dựa trên kho lưu trữ
    - Xây dựng quy trình tự động hóa QA có độ chân thực cao hơn cho bảng điều khiển Gateway
summary: 'Tổng quan về ngăn xếp QA: qa-lab, qa-channel, các kịch bản dựa trên kho lưu trữ, các luồng truyền tải trực tiếp, bộ điều hợp truyền tải và báo cáo.'
title: Tổng quan về QA
x-i18n:
    generated_at: "2026-07-16T15:10:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8dcb506cedb57289f29938eb55b5f11ceedfaabba88364dce8249116010ce859
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Ngăn xếp QA riêng tư kiểm thử OpenClaw theo cách thực tế, mô phỏng đúng hình thái kênh mà
kiểm thử đơn vị không thể thực hiện.

Các thành phần:

- `extensions/qa-channel`: kênh tin nhắn tổng hợp với các bề mặt DM, kênh, luồng,
  phản ứng, chỉnh sửa và xóa.
- `extensions/qa-lab`: giao diện người dùng trình gỡ lỗi, bus QA, hồ sơ kịch bản và các bộ điều hợp
  truyền tải trực tiếp để quan sát bản ghi hội thoại, chèn tin nhắn gửi đến
  và xuất báo cáo Markdown.
- `qa/`: tài nguyên khởi tạo dựa trên kho lưu trữ cho tác vụ mở đầu và các kịch bản QA
  cơ sở.
- [Mantis](/vi/concepts/mantis): xác minh trực tiếp trước/sau cho các lỗi
  cần bộ truyền tải thực, ảnh chụp màn hình trình duyệt, trạng thái VM và bằng chứng PR.

## Bề mặt lệnh

Mọi luồng QA đều chạy dưới `pnpm openclaw qa <subcommand>`. Nhiều luồng có bí danh tập lệnh `pnpm qa:*`;
cả hai dạng đều hoạt động.

| Lệnh                                                | Mục đích                                                                                                                                                                                                                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Tự kiểm tra QA đi kèm mà không cần `--qa-profile`; trình chạy hồ sơ trưởng thành dựa trên hệ phân loại với `--qa-profile smoke-ci`, `--qa-profile release` hoặc `--qa-profile all`.                                                                                                  |
| `qa suite`                                          | Chạy các kịch bản dựa trên kho lưu trữ đối với làn Gateway QA. `--runner multipass` sử dụng một VM Linux dùng một lần thay vì máy chủ.                                                                                                                                         |
| `qa coverage`                                       | In danh mục phạm vi bao phủ kịch bản YAML (`--json` cho đầu ra máy; `--match <query>` để tìm kịch bản cho một hành vi bị tác động; `--tools` cho phạm vi bao phủ fixture công cụ runtime).                                                                                  |
| `qa parity-report`                                  | So sánh hai tệp `qa-suite-summary.json` cho cổng tương đương theo trục mô hình, hoặc dùng `--runtime-axis --token-efficiency` để ghi báo cáo tương đương runtime và hiệu quả token giữa Codex và OpenClaw.                                                                          |
| `qa confidence-report`                              | Phân loại các tạo tác bằng chứng QA theo một manifest thành báo cáo độ tin cậy không có mục chưa xác định.                                                                                                                                                                               |
| `qa confidence-self-test`                           | Ghi các canary đối chứng âm đã khởi tạo để chứng minh cổng độ tin cậy phát hiện được sai lệch.                                                                                                                                                                                   |
| `qa jsonl-replay`                                   | Phát lại các bản ghi hội thoại JSONL được tuyển chọn thông qua bộ kiểm thử phát lại tương đương runtime.                                                                                                                                                                                         |
| `qa character-eval`                                 | Chạy kịch bản QA nhân vật trên nhiều mô hình trực tiếp với báo cáo được đánh giá. Xem [Báo cáo](#reporting).                                                                                                                                                        |
| `qa manual`                                         | Chạy một prompt dùng một lần trên làn nhà cung cấp/mô hình đã chọn.                                                                                                                                                                                                      |
| `qa ui`                                             | Khởi động giao diện người dùng trình gỡ lỗi QA và bus QA cục bộ (bí danh: `pnpm qa:lab:ui`).                                                                                                                                                                                                |
| `qa docker-build-image`                             | Xây dựng ảnh Docker QA dựng sẵn.                                                                                                                                                                                                                                 |
| `qa docker-scaffold`                                | Ghi khung docker-compose cho bảng điều khiển QA + làn Gateway.                                                                                                                                                                                                |
| `qa up`                                             | Xây dựng trang QA, khởi động ngăn xếp dựa trên Docker và in URL (bí danh: `pnpm qa:lab:up`; biến thể `:fast` thêm `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                              |
| `qa aimock`                                         | Chỉ khởi động máy chủ nhà cung cấp AIMock.                                                                                                                                                                                                                              |
| `qa mock-openai`                                    | Chỉ khởi động máy chủ nhà cung cấp `mock-openai` nhận biết kịch bản.                                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Quản lý nhóm thông tin xác thực Convex dùng chung.                                                                                                                                                                                                                           |
| `qa discord`                                        | Làn truyền tải trực tiếp đối với một kênh guild Discord riêng tư thực.                                                                                                                                                                                                   |
| `qa matrix`                                         | Các hồ sơ Matrix của QA Lab đối với một homeserver Tuwunel dùng một lần. Xem [Các làn kiểm tra nhanh Matrix](#matrix-smoke-lanes).                                                                                                                                                      |
| `qa slack`                                          | Làn truyền tải trực tiếp đối với một kênh Slack riêng tư thực.                                                                                                                                                                                                           |
| `qa telegram`                                       | Làn truyền tải trực tiếp đối với một nhóm Telegram riêng tư thực.                                                                                                                                                                                                          |
| `qa whatsapp`                                       | Làn truyền tải trực tiếp đối với các tài khoản WhatsApp Web thực.                                                                                                                                                                                                             |
| `qa mantis`                                         | Trình chạy xác minh trước/sau cho các lỗi truyền tải trực tiếp, kèm bằng chứng phản ứng trạng thái Discord, kiểm tra nhanh desktop/trình duyệt Crabbox và kiểm tra nhanh Slack trong VNC. Xem [Mantis](/vi/concepts/mantis) và [Cẩm nang vận hành Mantis Slack Desktop](/vi/concepts/mantis-slack-desktop-runbook). |

### `qa run` dựa trên hồ sơ

`qa run` dựa trên hồ sơ đọc tư cách thành viên từ `taxonomy.yaml`, sau đó điều phối
các kịch bản đã phân giải thông qua `qa suite`. `--surface` và `--category` lọc
hồ sơ đã chọn thay vì định nghĩa các làn riêng biệt. `qa-evidence.json`
thu được bao gồm bản tóm tắt bảng điểm hồ sơ với số lượng danh mục đã chọn
và các ID phạm vi bao phủ còn thiếu; từng mục bằng chứng riêng lẻ vẫn là
nguồn chính xác cho các kiểm thử, vai trò phạm vi bao phủ và kết quả. Các ID phạm vi
bao phủ tính năng của hệ phân loại là mục tiêu bằng chứng chính xác, không phải bí danh: phạm vi bao phủ kịch bản chính
đáp ứng các ID khớp, còn phạm vi bao phủ phụ chỉ mang tính tham khảo. ID phạm vi bao phủ sử dụng
dạng `namespace.behavior` phân tách bằng dấu chấm với các phân đoạn chữ thường gồm chữ và số/dấu gạch ngang;
ID hồ sơ, bề mặt và danh mục vẫn có thể sử dụng các ID hệ phân loại hiện có
được phân tách bằng dấu gạch ngang hoặc dấu chấm.

Bằng chứng rút gọn bỏ qua `execution` theo từng mục và đặt `evidenceMode: "slim"`;
`smoke-ci` mặc định là rút gọn và `--evidence-mode full` khôi phục đầy đủ các mục:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Dùng `smoke-ci` cho bằng chứng hồ sơ tất định với các nhà cung cấp mô hình giả lập và
máy chủ nhà cung cấp cục bộ Crabline. Dùng `release` cho bằng chứng Stable/LTS đối với
các kênh trực tiếp. Chỉ dùng `all` cho các lần chạy bằng chứng toàn bộ hệ phân loại một cách rõ ràng; nó
chọn mọi danh mục trưởng thành đang hoạt động và có thể được điều phối thông qua quy trình GitHub Actions `QA
Profile Evidence` với `qa_profile=all`. Khi một
lệnh cũng cần hồ sơ gốc OpenClaw, hãy đặt hồ sơ gốc trước
lệnh QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Luồng vận hành

Luồng vận hành QA hiện tại là một trang QA hai ngăn:

- Bên trái: Bảng điều khiển Gateway (Giao diện điều khiển) với tác nhân.
- Bên phải: QA Lab, hiển thị bản ghi hội thoại kiểu Slack và kế hoạch kịch bản.

Chạy bằng:

```bash
pnpm qa:lab:up
```

Lệnh này xây dựng trang QA, khởi động làn Gateway dựa trên Docker và cung cấp
trang QA Lab, nơi người vận hành hoặc vòng lặp tự động hóa có thể giao cho tác nhân một nhiệm vụ QA,
quan sát hành vi kênh thực và ghi lại những gì hoạt động, thất bại hoặc
vẫn bị chặn.

Để lặp nhanh hơn trên giao diện người dùng QA Lab mà không cần xây dựng lại ảnh Docker mỗi lần,
hãy khởi động ngăn xếp với gói QA Lab được gắn kết bằng bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` giữ các dịch vụ Docker trên một ảnh dựng sẵn và
gắn kết bind mount `extensions/qa-lab/web/dist` vào container `qa-lab`.
`qa:lab:watch` xây dựng lại gói đó khi có thay đổi và trình duyệt tự động tải lại
khi hàm băm tài nguyên QA Lab thay đổi.

### Kiểm tra nhanh khả năng quan sát

<Note>
QA khả năng quan sát chỉ dành cho bản kiểm xuất mã nguồn. Tarball npm chủ ý
không bao gồm QA Lab (và `qa-channel`), vì vậy các làn phát hành Docker của gói
không chạy các lệnh `qa`. Chạy các lệnh này từ một bản kiểm xuất mã nguồn đã xây dựng khi
thay đổi thiết bị đo chẩn đoán.
</Note>

| Bí danh                                   | Nội dung chạy                                                                                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | Bộ nhận OpenTelemetry cục bộ cùng kịch bản `otel-trace-smoke` với `diagnostics-otel` được bật.                                      |
| `pnpm qa:otel:collector-smoke`          | Cùng một luồng phía sau một container Docker OpenTelemetry Collector thực. Sử dụng khi thay đổi cách nối endpoint hoặc khả năng tương thích collector/OTLP. |
| `pnpm qa:prometheus:smoke`              | Kịch bản `docker-prometheus-smoke` với `diagnostics-prometheus` được bật.                                                           |
| `pnpm qa:observability:smoke`           | `qa:otel:smoke` rồi đến `qa:prometheus:smoke`.                                                                                      |
| `pnpm qa:observability:collector-smoke` | `qa:otel:collector-smoke` rồi đến `qa:prometheus:smoke`.                                                                            |

`qa:otel:smoke` khởi động một bộ nhận OTLP/HTTP cục bộ, chạy một lượt agent
QA-channel tối thiểu, sau đó xác nhận rằng dấu vết, số liệu và nhật ký đã được xuất. Nó giải mã
các span dấu vết protobuf đã xuất và kiểm tra cấu trúc quan trọng đối với bản phát hành:
`openclaw.run`, `openclaw.harness.run`, một span gọi mô hình theo quy ước ngữ nghĩa GenAI mới nhất,
`openclaw.context.assembled` và `openclaw.message.delivery`
đều phải hiện diện. Bài smoke buộc
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, vì vậy span gọi mô hình
phải dùng tên `{gen_ai.operation.name} {gen_ai.request.model}`; các lệnh gọi mô hình
không được xuất `StreamAbandoned` trong các lượt thành công; các ID chẩn đoán thô
và thuộc tính `openclaw.content.*` phải không xuất hiện trong dấu vết. Lời nhắc của kịch bản
yêu cầu mô hình phản hồi bằng một dấu mốc cố định và không tiết lộ một chuỗi
bí mật cố định; payload OTLP thô không được chứa bất kỳ chuỗi nào trong số đó hoặc khóa
phiên QA được suy ra từ ID kịch bản. Nó ghi `otel-smoke-summary.json`
bên cạnh các artifact của bộ QA.

`qa:prometheus:smoke` xác minh các lần scrape không được xác thực bị từ chối, sau đó
kiểm tra lần scrape đã xác thực có chứa các họ số liệu quan trọng đối với bản phát hành
mà không chứa nội dung lời nhắc, nội dung phản hồi, mã định danh chẩn đoán thô, token
xác thực hoặc đường dẫn cục bộ.

### Các luồng smoke Matrix

Để chạy một luồng smoke Matrix với transport thực mà không yêu cầu thông tin xác thực
của nhà cung cấp mô hình, hãy chạy profile phát hành với nhà cung cấp OpenAI giả lập có tính xác định:

```bash
pnpm openclaw qa matrix --provider-mode mock-openai --profile release
```

Đối với luồng nhà cung cấp frontier trực tiếp, hãy cung cấp rõ ràng thông tin xác thực
tương thích với OpenAI:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile release
```

Lệnh `pnpm openclaw qa matrix` thuần chạy toàn bộ profile `all` và tiếp tục sau
các lỗi kịch bản. Sử dụng `--fail-fast` để có vòng phản hồi ngắn hơn hoặc lặp lại
`--scenario <id>` để chọn từng kịch bản; ID kịch bản được chỉ định rõ ràng có
độ ưu tiên cao hơn `--profile`.

| Profile      | Kịch bản | Mục đích                                                                                                                                  |
| ------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `all`        | 93        | Danh mục hoàn chỉnh (mặc định).                                                                                                              |
| `release`    | 2         | Đường cơ sở kênh quan trọng đối với bản phát hành và tải lại danh sách cho phép trực tiếp.                                                                             |
| `fast`       | 12        | Phạm vi tập trung cho luồng, phản ứng, phê duyệt, chính sách, kiểm soát bot và trả lời được mã hóa.                                               |
| `transport`  | 50        | Luồng, định tuyến DM/phòng, tự động tham gia, phê duyệt, phản ứng, khởi động lại, chính sách đề cập/danh sách cho phép, chỉnh sửa và thứ tự nhiều tác nhân.         |
| `media`      | 7         | Phạm vi cho hình ảnh, hình ảnh được tạo, giọng nói, tệp đính kèm, phương tiện không được hỗ trợ và phương tiện được mã hóa.                                              |
| `e2ee-smoke` | 8         | Phạm vi tối thiểu cho trả lời được mã hóa, luồng, khởi tạo, khôi phục, khởi động lại, biên tập và lỗi.                                       |
| `e2ee-deep`  | 18        | Mất trạng thái, sao lưu, khôi phục khóa, vệ sinh thiết bị và xác minh SAS/QR/DM.                                                            |
| `e2ee-cli`   | 9         | Các lệnh `openclaw matrix encryption setup`, khóa khôi phục, nhiều tài khoản, khứ hồi Gateway và tự xác minh thông qua harness. |

Thành phần profile và yêu cầu kênh nằm cùng các kịch bản Matrix khai báo
trong `qa/scenarios/channels/`. Lần chạy chọn trình điều khiển kênh.
Các phần triển khai trực tiếp của chúng nằm trong
`extensions/qa-lab/src/live-transports/matrix/scenarios/`.

Adapter cung cấp một homeserver Tuwunel dùng một lần trong Docker (image mặc định
`ghcr.io/matrix-construct/tuwunel:v1.5.1`, tên máy chủ `matrix-qa.test`,
cổng `28008`), đăng ký người dùng tạm thời cho trình điều khiển, SUT và trình quan sát, khởi tạo
các phòng cần thiết và ghi lại ranh giới yêu cầu/phản hồi đã được biên tập. Sau đó, nó
chạy Plugin Matrix thực bên trong một Gateway QA con có phạm vi giới hạn ở transport đó
(không có `qa-channel`) và dỡ bỏ môi trường.

Các tùy chọn thường dùng:

| Cờ                     | Mặc định           | Mục đích                                                                              |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------ |
| `--profile <profile>`    | `all`             | Chọn một trong các profile ở trên.                                                    |
| `--scenario <id>`        | -                 | Chọn một kịch bản; có thể lặp lại.                                                     |
| `--fail-fast`            | tắt               | Dừng sau lần kiểm tra hoặc kịch bản thất bại đầu tiên.                                       |
| `--allow-failures`       | tắt               | Ghi artifact mà không trả về mã thoát lỗi khi kịch bản thất bại.         |
| `--provider-mode <mode>` | `live-frontier`   | Dùng `mock-openai` để điều phối có tính xác định hoặc `live-frontier` cho nhà cung cấp trực tiếp. |
| `--model <ref>`          | mặc định của nhà cung cấp  | Đặt tham chiếu `provider/model` chính.                                          |
| `--alt-model <ref>`      | mặc định của nhà cung cấp  | Đặt mô hình thay thế được các kịch bản chuyển đổi mô hình sử dụng.                        |
| `--fast`                 | tắt               | Bật chế độ nhanh của nhà cung cấp tại nơi được hỗ trợ.                                           |
| `--output-dir <path>`    | được tạo         | Chọn thư mục báo cáo; đường dẫn tương đối được phân giải theo `--repo-root`.           |
| `--repo-root <path>`     | thư mục hiện tại | Chạy từ một thư mục làm việc trung lập.                                                |
| `--sut-account <id>`     | `sut`             | Chọn ID tài khoản Matrix trong cấu hình Gateway con.                            |

QA Matrix không thuê thông tin xác thực Matrix dùng chung: adapter tạo
người dùng dùng một lần cục bộ, vì vậy nó không chấp nhận `--credential-source` hoặc
`--credential-role`. Ghi đè image homeserver bằng
`OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`; điều chỉnh các xác nhận không phản hồi âm bằng
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (mặc định `8000`, bị giới hạn theo thời gian chờ
của kịch bản đang hoạt động). Lệnh chạy một lần thường buộc thoát sạch sau khi
xả artifact vì các handle gốc của mã hóa Matrix có thể tồn tại lâu hơn quá trình dọn dẹp; chỉ đặt
`OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` cho harness kiểm thử trực tiếp
cần lệnh trả về thay vì thoát.

Mỗi lần chạy ghi các artifact QA Lab thông thường vào thư mục đầu ra
đã chọn: `qa-suite-report.md`, `qa-suite-summary.json`, `qa-evidence.json`
và một manifest `matrix-harness-*/matrix-qa-harness.json` đã được biên tập. Nếu quá trình dọn dẹp
thất bại, hãy chạy lệnh khôi phục `docker compose ... down --remove-orphans`
được in ra. Trên các runner chậm, hãy tăng khoảng thời gian không phản hồi; trên CI nhanh, khoảng thời gian
nhỏ hơn có thể rút ngắn các xác nhận âm.

Các kịch bản bao phủ hành vi transport mà kiểm thử đơn vị không thể chứng minh từ đầu
đến cuối: kiểm soát đề cập, chính sách cho phép bot, danh sách cho phép, trả lời cấp cao nhất và theo
luồng, định tuyến DM, xử lý phản ứng, ngăn chỉnh sửa đầu vào, loại bỏ trùng lặp phát lại khi khởi động lại,
khôi phục sau gián đoạn homeserver, chuyển giao siêu dữ liệu phê duyệt,
xử lý phương tiện và các luồng khởi tạo/khôi phục/xác minh E2EE của Matrix. Profile
CLI E2EE cũng điều khiển `openclaw matrix encryption setup` và
các lệnh xác minh thông qua cùng homeserver dùng một lần trước khi kiểm tra
phản hồi của Gateway.

`matrix-room-block-streaming` và `subagent-thread-spawn` vẫn khả dụng khi
chọn rõ ràng bằng `--scenario` nhưng vẫn nằm ngoài profile `all` mặc định.

CI sử dụng cùng bề mặt lệnh trong
`.github/workflows/qa-live-transports-convex.yml`. Các lần chạy theo lịch và phát hành
thực thi các kịch bản phát hành. Các lần điều phối `matrix_profile=all` thủ công phân tán
các profile `transport`, `media`, `e2ee-smoke`, `e2ee-deep` và `e2ee-cli`;
các lần điều phối tập trung chọn `fast`, `release` hoặc `transport` trong một job.

### Các kịch bản Mantis của Discord

Discord cũng có các kịch bản chỉ dành cho Mantis và phải chủ động bật để tái hiện lỗi. Sử dụng
`--scenario discord-status-reactions-tool-only` cho dòng thời gian phản ứng trạng thái rõ ràng
hoặc `--scenario discord-thread-reply-filepath-attachment`
để tạo một luồng Discord thực và xác minh rằng `message.thread-reply`
bảo toàn tệp đính kèm `filePath`. Các kịch bản này không nằm trong luồng
Discord trực tiếp mặc định vì chúng là các phép dò tái hiện trước/sau thay vì
phạm vi smoke rộng. Quy trình Mantis cho tệp đính kèm trong luồng cũng có thể thêm
video chứng kiến từ Discord Web đã đăng nhập khi
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` hoặc
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` được cấu hình trong môi trường
QA. Profile người xem đó chỉ dành cho việc ghi hình trực quan; quyết định đạt/không đạt
vẫn đến từ oracle REST của Discord.

Đối với các luồng smoke khác dùng transport thực:

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

Chúng nhắm đến một kênh thực có sẵn với hai bot hoặc tài khoản (trình điều khiển +
SUT). Các biến môi trường bắt buộc, danh sách kịch bản, artifact đầu ra và pool
thông tin xác thực Convex cho bốn transport đó được ghi lại trong
[tài liệu tham khảo QA cho Discord, Slack, Telegram và WhatsApp](#discord-slack-telegram-and-whatsapp-qa-reference)
bên dưới.

### Các runner tác vụ trực quan và desktop Slack của Mantis

Để chạy đầy đủ máy ảo desktop Slack với khả năng cứu hộ VNC, hãy chạy:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Lệnh đó thuê một máy desktop/trình duyệt Crabbox, chạy lane trực tiếp Slack
bên trong máy ảo, mở Slack Web trong trình duyệt VNC, chụp desktop,
và sao chép `slack-qa/`, `slack-desktop-smoke.png`, cùng
`slack-desktop-smoke.mp4` (khi có thể quay video) trở lại thư mục
artifact Mantis. Các lease desktop/trình duyệt Crabbox cung cấp sẵn công cụ
chụp và các gói hỗ trợ trình duyệt/bản dựng native, vì vậy kịch bản
chỉ nên cài đặt phương án dự phòng trên các lease cũ hơn. Mantis báo cáo thời gian
tổng và theo từng giai đoạn trong `mantis-slack-desktop-smoke-report.md` để các lượt chạy chậm cho biết
thời gian được dùng cho việc khởi động lease, lấy thông tin xác thực, thiết lập từ xa hay
sao chép artifact. Tái sử dụng `--lease-id <cbx_...>` sau khi đăng nhập vào Slack Web
thủ công qua VNC; các lease được tái sử dụng cũng giữ cho bộ nhớ đệm pnpm store của Crabbox
luôn sẵn sàng. `--hydrate-mode source` mặc định xác minh từ một checkout mã nguồn và
chạy cài đặt/bản dựng bên trong máy ảo. Chỉ dùng `--hydrate-mode prehydrated` khi
workspace từ xa được tái sử dụng đã có `node_modules` và một `dist/` đã được dựng;
chế độ đó bỏ qua bước cài đặt/bản dựng tốn kém và từ chối tiếp tục khi
workspace chưa sẵn sàng. Với `--gateway-setup`, Mantis để một
Gateway Slack OpenClaw lâu dài chạy bên trong máy ảo trên cổng `38973`; nếu không có tùy chọn này,
lệnh chạy lane QA Slack bot-với-bot thông thường và thoát sau khi
chụp artifact.

Để chứng minh giao diện phê duyệt native của Slack bằng bằng chứng desktop, hãy chạy chế độ
điểm kiểm tra phê duyệt Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Chế độ này loại trừ lẫn nhau với `--gateway-setup`. Nó chạy các kịch bản
phê duyệt Slack, từ chối các ID kịch bản không phải phê duyệt, chờ tại mỗi trạng thái
phê duyệt đang chờ và đã giải quyết, kết xuất thông báo Slack API quan sát được thành
`approval-checkpoints/<scenario>-pending.png` và
`approval-checkpoints/<scenario>-resolved.png`, sau đó thất bại nếu thiếu hoặc
trống bất kỳ điểm kiểm tra, bằng chứng thông báo, xác nhận hay ảnh chụp màn hình đã kết xuất nào.
Các lease CI nguội vẫn có thể hiển thị màn hình đăng nhập Slack trong
`slack-desktop-smoke.png`; các ảnh điểm kiểm tra phê duyệt là bằng chứng
trực quan cho lane này.

Lượt chạy điểm kiểm tra mặc định giữ lại hai kịch bản phê duyệt Slack tiêu chuẩn.
Để chụp một trong hai tuyến phê duyệt Codex tùy chọn, hãy chọn rõ ràng bằng
`--scenario slack-codex-approval-exec-native` hoặc
`--scenario slack-codex-approval-plugin-native`; Mantis chấp nhận cả hai và tạo ra
cùng một cặp ảnh chụp màn hình đang chờ/đã giải quyết. Trình chạy mở rộng thời hạn
cho điểm kiểm tra và lệnh từ xa đối với từng tuyến Codex được chọn để toàn bộ
trình tự phê duyệt, hoàn tất tác vụ agent và cập nhật trạng thái đã giải quyết có thể hoàn thành.

Danh sách kiểm tra dành cho người vận hành, lệnh điều phối quy trình GitHub, hợp đồng
nhận xét bằng chứng, bảng quyết định chế độ hydrate, cách diễn giải thời gian và các bước
xử lý lỗi nằm trong
[Runbook Desktop Slack Mantis](/vi/concepts/mantis-slack-desktop-runbook).

Đối với tác vụ desktop kiểu agent/CV, hãy chạy:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.6-luna
```

`visual-task` thuê hoặc tái sử dụng một máy desktop/trình duyệt Crabbox, khởi động
`crabbox record --while`, điều khiển trình duyệt hiển thị qua một
`visual-driver` lồng nhau, chụp `visual-task.png`, chạy `openclaw infer image
describe` trên ảnh chụp màn hình khi `--vision-mode image-describe` được
chọn, và ghi `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json`, cùng
`mantis-visual-task-report.md`. Khi đặt `--expect-text`, lời nhắc thị giác
yêu cầu một phán quyết JSON có cấu trúc (`visible`, `evidence`, `reason`)
và chỉ đạt khi mô hình báo cáo `visible: true` kèm bằng chứng
trích dẫn văn bản mong đợi; phản hồi `visible: false` chỉ trích dẫn
văn bản mục tiêu vẫn không đạt kiểm tra xác nhận. Dùng `--vision-mode metadata` cho một
smoke không dùng mô hình nhằm chứng minh hệ thống desktop, trình duyệt, ảnh chụp màn hình và video
hoạt động mà không gọi nhà cung cấp khả năng hiểu hình ảnh. Bản ghi là
artifact bắt buộc đối với `visual-task`; nếu Crabbox không ghi được
`visual-task.mp4` có nội dung, tác vụ sẽ thất bại ngay cả khi trình điều khiển trực quan đã đạt. Khi
thất bại, Mantis giữ lại lease để dùng VNC, trừ khi tác vụ đã đạt
và `--keep-lease` chưa được đặt.

### Kiểm tra tình trạng nhóm thông tin xác thực

Trước khi sử dụng thông tin xác thực trực tiếp dùng chung, hãy chạy:

```bash
pnpm openclaw qa credentials doctor
```

Doctor kiểm tra env của broker Convex (`OPENCLAW_QA_CONVEX_SITE_URL`,
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`), xác thực thiết lập endpoint, chỉ báo cáo
trạng thái đã đặt/còn thiếu cho `OPENCLAW_QA_CONVEX_SECRET_CI` và
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`, đồng thời xác minh khả năng truy cập quản trị/liệt kê
khi có secret của người bảo trì.

## Phạm vi kịch bản chuẩn

`taxonomy.yaml` ở thư mục gốc định nghĩa các ID phạm vi ngữ nghĩa. Các tệp YAML kịch bản
trong `qa/scenarios/` ánh xạ từng kịch bản tới các ID đó và sở hữu siêu dữ liệu
thực thi: `channel` là yêu cầu duy nhất về kênh, còn `profiles` khai báo
tư cách thành viên của các lượt chạy có tên. Trình điều khiển kênh là một lựa chọn triển khai
có thể thay thế ở cấp lượt chạy. Các trình chạy TypeScript
truy vấn danh mục đó; chúng không duy trì song song các kho kịch bản hay phạm vi.

Đầu ra tĩnh `qa coverage` báo cáo ánh xạ từ phân loại sang kịch bản. Bằng chứng thực tế
đến từ `qa-evidence.json`, nơi ghi lại kịch bản đã thực thi,
các ID phạm vi, kênh, trình điều khiển thực sự được dùng và kết quả. Kênh và trình điều khiển là
các chiều báo cáo, không phải từ vựng ID phạm vi bổ sung hay các trục
đủ điều kiện của kịch bản.

Đối với lane máy ảo Linux dùng một lần mà không đưa Docker vào đường dẫn QA, hãy chạy:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Lệnh này khởi động một máy khách Multipass mới, cài đặt các dependency, dựng OpenClaw
bên trong máy khách, chạy `qa suite`, sau đó sao chép báo cáo QA và
bản tóm tắt thông thường trở lại `.artifacts/qa-e2e/...` trên máy chủ. Nó tái sử dụng cùng
hành vi chọn kịch bản như `qa suite` trên máy chủ.

Các lượt chạy bộ kiểm thử trên máy chủ và Multipass thực thi song song nhiều kịch bản đã chọn
với các worker Gateway cô lập theo mặc định. `qa-channel` mặc định có
mức đồng thời là 4, bị giới hạn bởi số lượng kịch bản đã chọn. Dùng `--concurrency
<count>` để điều chỉnh số worker hoặc `--concurrency 1` để thực thi tuần tự.
Dùng `--pack personal-agent` để chạy gói benchmark trợ lý cá nhân (10
kịch bản). Bộ chọn gói có tính cộng dồn với các cờ `--scenario` lặp lại:
các kịch bản được chỉ định rõ chạy trước, sau đó các kịch bản trong gói chạy theo thứ tự
của gói và loại bỏ mục trùng lặp. Dùng `--pack observability` để chọn đồng thời
các kịch bản `otel-trace-smoke` và `docker-prometheus-smoke` khi một
trình chạy QA tùy chỉnh đã cung cấp thiết lập bộ thu thập OpenTelemetry.

Lệnh thoát với mã khác 0 khi có bất kỳ kịch bản nào thất bại. Dùng `--allow-failures`
khi bạn muốn có artifact mà không nhận mã thoát báo lỗi.

Các lượt chạy trực tiếp chuyển tiếp những đầu vào xác thực QA được hỗ trợ và phù hợp
cho máy khách: khóa nhà cung cấp dựa trên env, đường dẫn cấu hình nhà cung cấp QA trực tiếp và
`CODEX_HOME` khi có. Giữ `--output-dir` trong thư mục gốc của repo để
máy khách có thể ghi trở lại qua workspace được gắn kết.

## Tham chiếu QA cho Discord, Slack, Telegram và WhatsApp

Adapter Matrix sử dụng lane dùng một lần dựa trên Docker được ghi lại ở trên.
Discord, Slack, Telegram và WhatsApp chạy trên các phương thức vận chuyển thực đã có từ trước,
nên tài liệu tham chiếu của chúng nằm ở đây.

### Các cờ CLI dùng chung

Các lane này được đăng ký qua
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` và
chấp nhận cùng các cờ:

| Cờ                                    | Mặc định                                           | Mô tả                                                                                                                                          |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Chỉ chạy kịch bản này. Có thể lặp lại.                                                                                                          |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Nơi ghi báo cáo, bản tóm tắt, bằng chứng, artifact dành riêng cho phương thức vận chuyển và nhật ký đầu ra. Đường dẫn tương đối được phân giải theo `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                    | Thư mục gốc của repo khi gọi từ cwd trung lập.                                                                                                  |
| `--sut-account <id>`                  | `sut`                                              | ID tài khoản tạm thời bên trong cấu hình Gateway QA.                                                                                            |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai`, `aimock` hoặc `live-frontier`.                                                                                                   |
| `--model <ref>` / `--alt-model <ref>` | mặc định của nhà cung cấp                           | Tham chiếu mô hình chính/thay thế.                                                                                                              |
| `--fast`                              | tắt                                                | Chế độ nhanh của nhà cung cấp tại nơi được hỗ trợ.                                                                                              |
| `--credential-source <env\|convex>`   | `env`                                              | Xem [Nhóm thông tin xác thực Convex](#convex-credential-pool).                                                                                  |
| `--credential-role <maintainer\|ci>`  | `ci` trong CI, nếu không thì `maintainer`                 | Vai trò được dùng khi `--credential-source convex`.                                                                                                      |
| `--allow-failures`                    | tắt                                                | Ghi artifact mà không trả về mã thoát báo lỗi khi các kịch bản thất bại.                                                                         |

Mỗi lane thoát với mã khác 0 khi có bất kỳ kịch bản nào thất bại. `--allow-failures` ghi
artifact mà không đặt mã thoát báo lỗi. Telegram cũng chấp nhận
`--list-scenarios` để in các ID kịch bản có sẵn rồi thoát; các lane khác
không cung cấp cờ đó.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Nhắm tới một nhóm Telegram riêng tư thực với hai bot riêng biệt (trình điều khiển +
SUT). Bot SUT phải có tên người dùng Telegram; việc quan sát bot-với-bot hoạt động
tốt nhất khi cả hai bot đều bật **Bot-to-Bot Communication Mode** trong
`@BotFather`.

Env bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - ID trò chuyện dạng số (chuỗi).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Hồ sơ `release` chọn các kịch bản YAML Telegram được duy trì; `all`
bổ sung các kiểm tra tùy chọn về phiên, mức sử dụng, chuỗi trả lời và tải streaming. Các giá trị
`--scenario` được chỉ định rõ sẽ ghi đè hồ sơ.

- `channel-canary`
- `channel-mention-gating`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-tool-only-usage-footer`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Hồ sơ `release` luôn bao quát canary, kiểm soát bằng lượt đề cập, phản hồi lệnh gốc,
định địa chỉ lệnh và phản hồi nhóm giữa các bot. `mock-openai`
cũng bao gồm bước kiểm tra bản xem trước kết quả cuối dài có tính xác định.
`telegram-current-session-status-tool` và
`telegram-tool-only-usage-footer` vẫn là tùy chọn tham gia: tùy chọn trước chỉ ổn định
khi được nối luồng trực tiếp sau canary, còn tùy chọn sau là bằng chứng Telegram thực
về phần chân trang `/usage` trên các phản hồi chỉ có công cụ. Dùng `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai` để in
phân chia mặc định/tùy chọn hiện tại cùng các tham chiếu hồi quy. Dùng `--profile all` cho mọi
kịch bản bộ điều hợp trực tiếp của Telegram.

Các kết quả đầu ra:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - các mục bằng chứng cho những bước kiểm tra lớp truyền tải trực tiếp,
  bao gồm các trường hồ sơ, phạm vi bao phủ, nhà cung cấp, kênh, thành phần đầu ra, kết quả và RTT.

Các lượt chạy Telegram của gói sử dụng cùng một hợp đồng thông tin xác thực Telegram. Việc đo RTT
lặp lại là một phần của làn trực tiếp Telegram thông thường của gói; phân phối RTT
được gộp vào `qa-evidence.json` dưới `result.timing` cho bước
kiểm tra RTT đã chọn.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Khi đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, trình bao bọc trực tiếp của gói
thuê một thông tin xác thực `kind: "telegram"`, xuất các biến môi trường của nhóm/driver/bot SUT
đã thuê vào lượt chạy gói đã cài đặt, gửi Heartbeat cho hợp đồng thuê và giải phóng hợp đồng đó
khi tắt. Trình bao bọc gói mặc định thực hiện 20 bước kiểm tra RTT với
`channel-canary`, thời gian chờ RTT là 30s và vai trò Convex
`maintainer` bên ngoài CI khi chọn Convex. Ghi đè
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
hoặc `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` để tinh chỉnh phép đo RTT mà không
tạo lệnh RTT riêng hoặc định dạng tóm tắt dành riêng cho Telegram.

### QA Discord

```bash
pnpm openclaw qa discord
```

Nhắm đến một kênh guild Discord riêng tư thực với hai bot: một bot driver
do bộ kiểm thử điều khiển và một bot SUT được Gateway OpenClaw con khởi động
thông qua Plugin Discord đi kèm. Xác minh việc xử lý lượt đề cập trong kênh, việc
bot SUT đã đăng ký lệnh gốc `/help` với Discord và
các kịch bản bằng chứng Mantis tùy chọn tham gia.

Các biến môi trường bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - phải khớp với ID người dùng của bot SUT
  do Discord trả về (nếu không, làn sẽ thất bại ngay).

Tùy chọn:

- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` chọn kênh thoại/sân khấu cho
  `discord-voice-autojoin`; nếu không có, kịch bản sẽ chọn kênh
  thoại/sân khấu đầu tiên mà bot SUT nhìn thấy.

Các kịch bản mô-đun YAML của Discord (`qa/scenarios/channels/discord-*.yaml`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - kịch bản thoại tùy chọn tham gia. Chạy độc lập, bật
  `channels.discord.voice.autoJoin` và xác minh trạng thái thoại Discord hiện tại của bot SUT
  là kênh thoại/sân khấu đích. Thông tin xác thực Discord của Convex
  có thể bao gồm `voiceChannelId` tùy chọn; nếu không, bộ điều hợp trình chạy
  sẽ phát hiện kênh thoại/sân khấu đầu tiên nhìn thấy được trong guild.
- `discord-status-reactions-tool-only` - kịch bản Mantis tùy chọn tham gia. Chạy
  độc lập vì kịch bản chuyển SUT sang phản hồi guild luôn bật, chỉ có công cụ
  bằng `messages.statusReactions.enabled=true`, sau đó ghi lại dòng thời gian
  phản ứng REST cùng các thành phần trực quan HTML/PNG. Các báo cáo trước/sau của Mantis
  cũng bảo toàn thành phần MP4 do kịch bản cung cấp dưới dạng `baseline.mp4`
  và `candidate.mp4`.
- `discord-thread-reply-filepath-attachment` - kịch bản Mantis tùy chọn tham gia; xem
  [Các kịch bản Mantis của Discord](#discord-mantis-scenarios).

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
  --model openai/gpt-5.6-luna \
  --alt-model openai/gpt-5.6-luna \
  --fast
```

Các kết quả đầu ra:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - các mục bằng chứng cho những bước kiểm tra lớp truyền tải trực tiếp.
- `discord-qa-reaction-timelines.json` và
  `discord-status-reactions-tool-only-timeline.png` khi kịch bản phản ứng trạng thái
  chạy.

### QA Slack

```bash
pnpm openclaw qa slack
```

Nhắm đến một kênh Slack riêng tư thực với hai bot riêng biệt: một bot driver
do bộ kiểm thử điều khiển và một bot SUT được Gateway OpenClaw con khởi động
thông qua Plugin Slack đi kèm.

Các biến môi trường bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Tùy chọn:

- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` bật các điểm kiểm tra phê duyệt trực quan
  cho Mantis. Bộ điều hợp ghi `<scenario>.pending.json` và
  `<scenario>.resolved.json`, sau đó chờ các tệp `.ack.json` tương ứng.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` ghi đè thời gian chờ xác nhận
  điểm kiểm tra. Mặc định là `120000`.

Các kịch bản YAML chuẩn được cung cấp thông qua bộ điều hợp trực tiếp của Slack:

- `thread-follow-up`
- `thread-isolation`

Các kịch bản mô-đun YAML của Slack (`qa/scenarios/channels/slack-*.yaml`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-channel-disabled-warning` - phép thăm dò Slack thực tùy chọn tham gia, xác nhận rằng một
  kênh bị vô hiệu hóa đã cấu hình phát cảnh báo có cấu trúc mà không phản hồi.
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-progress-commentary-true`, `slack-progress-commentary-false`,
  `slack-progress-commentary-omitted` và
  `slack-progress-commentary-verbose-dedupe` - các phép thăm dò Slack thực tùy chọn tham gia cho
  các chế độ điều khiển độc lập đối với phần bình luận/tiến trình công cụ, giá trị mặc định kế thừa
  khi bỏ qua khóa và hành vi phân phối một lần khi bật tiến trình chi tiết lâu bền.
- `slack-reaction-glyph-native` - kịch bản phản ứng của công cụ nhắn tin trực tiếp tùy chọn tham gia.
  Yêu cầu tác nhân truyền chính xác ký hiệu `✅` và xác nhận Slack đã lưu
  `white_check_mark` cho bot SUT trên tin nhắn đích.
- `slack-chart-presentation-native` - kịch bản biểu đồ di động tùy chọn tham gia,
  xác minh khối `data_visualization` gốc và văn bản trợ năng chính xác.
- `slack-table-presentation-native` - kịch bản bảng di động tùy chọn tham gia,
  xác minh khối `data_table` gốc, các hàng chính xác và văn bản trợ năng.
- `slack-table-invalid-blocks-fallback` - kịch bản truyền tải trực tiếp
  tùy chọn tham gia, gửi một bảng thô vượt giới hạn nhưng có thể đọc được về mặt cấu trúc với 101 hàng dữ liệu
  cùng hàng tiêu đề qua
  đường gửi Slack trong môi trường sản xuất, chứng minh chính Slack trả về `invalid_blocks`
  và xác minh phương án dự phòng đã lưu khi tắt định dạng là đầy đủ và không có
  khối dữ liệu gốc. Chi tiết kịch bản chỉ lưu bằng chứng an toàn về mã lỗi, số lượng và
  giá trị boolean.
- `slack-approval-exec-native` - kịch bản phê duyệt thực thi Slack gốc tùy chọn tham gia.
  Yêu cầu phê duyệt thực thi thông qua Gateway, xác minh tin nhắn Slack
  có các nút phê duyệt gốc, xử lý yêu cầu đó và xác minh bản cập nhật Slack
  sau khi xử lý.
- `slack-approval-plugin-native` - kịch bản phê duyệt Plugin Slack gốc
  tùy chọn tham gia. Bật đồng thời chuyển tiếp phê duyệt thực thi và Plugin để các sự kiện
  Plugin không bị định tuyến phê duyệt thực thi chặn, sau đó xác minh cùng
  luồng giao diện người dùng Slack gốc đang chờ/đã xử lý.
- `slack-codex-approval-exec-native` - kịch bản phê duyệt lệnh Codex Guardian
  tùy chọn tham gia. Bật Plugin Codex ở chế độ Guardian, định tuyến một
  lượt tác nhân Gateway bắt nguồn từ Slack qua bộ kiểm thử app-server Codex,
  chờ lời nhắc phê duyệt Plugin Slack gốc cho
  `openclaw-codex-app-server`, xử lý lời nhắc đó và xác minh lượt Codex
  kết thúc với các dấu mốc đầu ra lệnh và trợ lý mong đợi.
- `slack-codex-approval-plugin-native` - kịch bản phê duyệt tệp Codex Guardian
  tùy chọn tham gia. Sử dụng chỉ dẫn `apply_patch` bên ngoài không gian làm việc để Codex phát
  tuyến phê duyệt thay đổi tệp của app-server, sau đó xác minh cùng
  luồng phê duyệt Slack gốc đang chờ/đã xử lý, dấu mốc trợ lý cuối cùng và nội dung tệp
  chính xác trước khi dọn dẹp.

Các kịch bản phê duyệt Codex yêu cầu một `--model` `openai/*` hoặc `codex/*`,
thông tin xác thực mô hình trực tiếp thông thường và phương thức xác thực Codex hoặc xác thực bằng khóa API được Plugin Codex chấp nhận.
Chi tiết kịch bản bao gồm phương thức app-server Codex, khóa mô hình Codex
đã chọn, trạng thái lượt Codex cuối cùng và xác minh dấu mốc thao tác cùng với
siêu dữ liệu phê duyệt Slack đã che dữ liệu nhạy cảm.

Các kết quả đầu ra:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - các mục bằng chứng cho những bước kiểm tra lớp truyền tải trực tiếp.
- `approval-checkpoints/` - chỉ khi Mantis đặt
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; chứa JSON điểm kiểm tra,
  JSON xác nhận và ảnh chụp màn hình đang chờ/đã xử lý.

#### Thiết lập không gian làm việc Slack

Làn cần hai ứng dụng Slack riêng biệt trong một không gian làm việc, cùng một kênh mà cả hai
bot đều là thành viên:

- `channelId` - ID `Cxxxxxxxxxx` của một kênh mà cả hai bot đã được
  mời vào. Dùng một kênh chuyên dụng; làn sẽ đăng nội dung trong mỗi lượt chạy.
- `driverBotToken` - mã thông báo bot (`xoxb-...`) của ứng dụng **Driver**.
- `sutBotToken` - mã thông báo bot (`xoxb-...`) của ứng dụng **SUT**, ứng dụng này phải
  là một ứng dụng Slack tách biệt với driver để ID người dùng bot của nó khác biệt.
- `sutAppToken` - mã thông báo cấp ứng dụng (`xapp-...`) của ứng dụng SUT với
  `connections:write`, được Socket Mode sử dụng để ứng dụng SUT có thể nhận sự kiện.

Nên ưu tiên một không gian làm việc Slack dành riêng cho QA thay vì tái sử dụng không gian làm việc
sản xuất.

Tệp kê khai SUT bên dưới chủ ý thu hẹp cấu hình cài đặt sản xuất của Plugin Slack
đi kèm (`extensions/slack/src/setup-shared.ts:12`) xuống còn
các quyền và sự kiện được bộ QA Slack trực tiếp bao quát. Để biết quy trình thiết lập
kênh sản xuất như người dùng nhìn thấy, hãy xem
[Thiết lập nhanh kênh Slack](/vi/channels/slack#quick-setup); cặp Driver/SUT cho QA
được chủ ý tách riêng vì làn cần hai ID người dùng bot khác nhau trong một không gian làm việc.

**1. Tạo ứng dụng Driver**

Truy cập [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ → chọn không gian làm việc QA, dán tệp kê khai sau,
sau đó chọn _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Bot driver kiểm thử cho làn trực tiếp Slack QA của OpenClaw"
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

Sao chép _Bot User OAuth Token_ (`xoxb-...`) - giá trị này trở thành
`driverBotToken`. Driver chỉ cần đăng tin nhắn và tự định danh;
không cần sự kiện, không cần Socket Mode.

**2. Tạo ứng dụng SUT**

Lặp lại _Create New App → From a manifest_ trong cùng không gian làm việc. Ứng dụng QA này
chủ ý sử dụng phiên bản hẹp hơn của tệp kê khai sản xuất của Plugin Slack
đi kèm (`extensions/slack/src/setup-shared.ts:12`): các phạm vi
và sự kiện phản ứng được bỏ qua vì bộ QA Slack trực tiếp chưa bao quát
việc xử lý phản ứng.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "Trình kết nối OpenClaw QA SUT cho OpenClaw"
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

Sau khi Slack tạo ứng dụng, hãy thực hiện hai việc trên trang cài đặt của ứng dụng:

- _Install to Workspace_ → sao chép _Bot User OAuth Token_ → giá trị đó trở thành
  `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → thêm
  phạm vi `connections:write` → lưu → sao chép giá trị `xapp-...` → giá trị đó
  trở thành `sutAppToken`.

Xác minh hai bot có các mã định danh người dùng khác nhau bằng cách gọi `auth.test` trên từng
token. Runtime phân biệt trình điều khiển và SUT bằng mã định danh người dùng; việc dùng lại một ứng dụng
cho cả hai sẽ khiến cơ chế kiểm soát lượt đề cập thất bại ngay lập tức.

**3. Tạo kênh**

Trong không gian làm việc QA, hãy tạo một kênh (ví dụ: `#openclaw-qa`) và mời cả hai
bot từ bên trong kênh:

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Sao chép mã định danh `Cxxxxxxxxxx` từ _channel info → About → Channel ID_ - giá trị đó
trở thành `channelId`. Có thể dùng kênh công khai; nếu dùng kênh riêng tư,
cả hai ứng dụng đều đã có `groups:history` nên thao tác đọc lịch sử của bộ kiểm thử
vẫn sẽ thành công.

**4. Đăng ký thông tin xác thực**

Có hai tùy chọn. Dùng biến môi trường để gỡ lỗi trên một máy (đặt bốn
biến `OPENCLAW_QA_SLACK_*` và truyền `--credential-source env`), hoặc khởi tạo dữ liệu
cho nhóm Convex dùng chung để CI và những người bảo trì khác có thể thuê chúng.

Đối với nhóm Convex, hãy ghi bốn trường vào một tệp JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Sau khi xuất `OPENCLAW_QA_CONVEX_SITE_URL` và `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
trong shell, hãy đăng ký và xác minh:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "Khởi tạo nhóm QA Slack"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Kết quả dự kiến có `count: 1`, `status: "active"` và không có trường `lease`.

**5. Xác minh từ đầu đến cuối**

Chạy luồng cục bộ để xác nhận cả hai bot có thể giao tiếp với nhau thông qua
broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Một lượt chạy thành công hoàn tất trong thời gian ngắn hơn nhiều so với 30 giây và `qa-suite-report.md`
hiển thị cả `slack-canary` và `slack-mention-gating` ở trạng thái `pass`. Nếu
luồng bị treo khoảng 90 giây rồi thoát với `Convex credential pool exhausted
for kind "slack"`, thì nhóm đang trống hoặc mọi hàng đều đã được thuê - `qa
credentials list --kind slack --status all --json` sẽ cho biết trường hợp nào xảy ra.

### QA WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Nhắm đến hai tài khoản WhatsApp Web chuyên dụng: một tài khoản trình điều khiển do
bộ kiểm thử điều khiển và một tài khoản SUT được Gateway OpenClaw con khởi động thông qua
Plugin WhatsApp đi kèm.

Các biến môi trường bắt buộc khi `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Tùy chọn:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` bật các kịch bản nhóm như
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, các kịch bản hành động/phương tiện/thăm dò ý kiến trong nhóm
  và `whatsapp-group-allowlist-block`.

Các kịch bản YAML của WhatsApp (`qa/scenarios/channels/whatsapp-*.yaml`):

- Đường cơ sở và kiểm soát nhóm: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`, `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- Lệnh gốc: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Hành vi trả lời và đầu ra cuối cùng: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- Hành động tin nhắn theo luồng người dùng: `whatsapp-agent-message-action-react` bắt đầu
  từ một tin nhắn trực tiếp thực sự của trình điều khiển, cho phép mô hình gọi công cụ `message` và
  quan sát phản ứng gốc của WhatsApp. `whatsapp-agent-message-action-upload-file`
  sử dụng cùng phương thức cho `message(action=upload-file)` và quan sát
  phương tiện gốc của WhatsApp. `whatsapp-group-agent-message-action-react` và
  `whatsapp-group-agent-message-action-upload-file` chứng minh các hành động hiển thị cho người dùng tương tự
  trong một nhóm WhatsApp thực sự.
- Phân phối đến nhóm: `whatsapp-broadcast-group-fanout` bắt đầu từ một tin nhắn
  nhóm WhatsApp có đề cập và xác minh các phản hồi hiển thị riêng biệt từ `main`
  và `qa-second`.
- Kích hoạt nhóm: `whatsapp-group-activation-always` thay đổi một phiên nhóm thực sự
  thành `/activation always`, chứng minh một tin nhắn nhóm không có lượt đề cập sẽ đánh thức
  tác nhân, rồi khôi phục `/activation mention`.
  `whatsapp-group-reply-to-bot-triggers` khởi tạo một phản hồi của bot, gửi một phản hồi
  trích dẫn gốc đến phản hồi đó mà không đề cập rõ ràng, rồi xác minh tác nhân
  được đánh thức từ ngữ cảnh phản hồi đó.
- Phương tiện gửi đến và tin nhắn có cấu trúc: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Các kịch bản này gửi các sự kiện hình ảnh, âm thanh, tài liệu, vị trí, liên hệ,
  nhãn dán và phản ứng thực sự của WhatsApp thông qua trình điều khiển.
- Các phép thăm dò trực tiếp hợp đồng Gateway: `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-outbound-send-serialization`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Các phép thăm dò này cố ý bỏ qua việc nhắc mô hình
  và chứng minh các hợp đồng `send`, `poll` và
  `message.action` có tính xác định của Gateway/kênh.
- Phạm vi kiểm soát truy cập: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Phê duyệt gốc: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Phản ứng trạng thái: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

Danh mục hiện có 52 kịch bản. Luồng mặc định `live-frontier`
được giữ ở mức nhỏ với 8 kịch bản để kiểm tra khói nhanh. Luồng mặc định `mock-openai`
chạy 39 kịch bản một cách xác định qua phương thức vận chuyển WhatsApp thực sự
trong khi chỉ mô phỏng đầu ra của mô hình; các kịch bản phê duyệt và một số
kiểm tra nặng hơn/có tính chặn vẫn được chỉ định rõ ràng bằng mã định danh kịch bản.

Trình điều khiển QA WhatsApp quan sát các sự kiện trực tiếp có cấu trúc (`text`, `media`,
`location`, `reaction` và `poll`) và có thể chủ động gửi phương tiện, cuộc thăm dò ý kiến,
liên hệ, vị trí và nhãn dán. QA Lab nhập trình điều khiển đó thông qua
bề mặt gói `@openclaw/whatsapp/api.js` thay vì truy cập vào các tệp runtime
WhatsApp riêng tư. Đối với các quan sát nhóm, `fromJid` là JID của nhóm,
còn `participantJid` và `fromPhoneE164` xác định người gửi tham gia.
Nội dung tin nhắn được che theo mặc định. Các phép thăm dò trực tiếp Gateway về cuộc thăm dò ý kiến, tải tệp lên,
phương tiện, cuộc thăm dò ý kiến nhóm, phương tiện nhóm và hình dạng phản hồi là các
kiểm tra hợp đồng vận chuyển/API; chúng không được coi là bằng chứng rằng lời nhắc của người dùng khiến
tác nhân chọn cùng hành động. Bằng chứng hành động theo luồng người dùng đến từ các kịch bản
như `whatsapp-agent-message-action-react` và
`whatsapp-group-agent-message-action-react`, trong đó trình điều khiển gửi một tin nhắn
WhatsApp thông thường và QA Lab quan sát thành phần WhatsApp gốc thu được.
Chi tiết kịch bản WhatsApp bao gồm phương thức của từng kịch bản (`user-path`,
`direct-gateway` hoặc `native-approval`) để bằng chứng không thể bị hiểu nhầm là một
hợp đồng mạnh hơn những gì nó thực sự chứng minh.

Các thành phần đầu ra:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - các mục bằng chứng cho những phép kiểm tra vận chuyển trực tiếp.

### Nhóm thông tin xác thực Convex

Các luồng Discord, Slack, Telegram và WhatsApp có thể thuê thông tin xác thực từ một
nhóm Convex dùng chung thay vì đọc các biến môi trường ở trên. Truyền
`--credential-source convex` (hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`);
QA Lab nhận một hợp đồng thuê độc quyền, gửi Heartbeat cho hợp đồng đó trong suốt
lượt chạy và giải phóng khi tắt. Các loại nhóm là `"discord"`, `"slack"`,
`"telegram"` và `"whatsapp"`.

Các dạng payload mà broker xác thực trên `admin/add`:

- Discord (`kind: "discord"`): `{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string,
sutToken: string }` - `groupId` phải là một chuỗi mã định danh cuộc trò chuyện dạng số.
- Người dùng Telegram thực (`kind: "telegram-user"`): `{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` -
  chỉ dành cho bằng chứng Telegram Desktop của Mantis. Các luồng QA Lab chung không được nhận
  loại này.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` - các số điện thoại phải là các chuỗi E.164 khác nhau.

Quy trình bằng chứng Telegram Desktop của Mantis giữ một hợp đồng thuê Convex
`telegram-user` độc quyền cho cả trình điều khiển CLI TDLib và nhân chứng Telegram Desktop,
sau đó giải phóng hợp đồng sau khi xuất bản bằng chứng.

Khi một PR cần bản so sánh trực quan có tính xác định, Mantis có thể sử dụng cùng một phản hồi
mô hình mô phỏng trên `main` và trên phần đầu PR trong khi trình định dạng hoặc
lớp phân phối Telegram thay đổi. Các thiết lập mặc định khi ghi được điều chỉnh cho bình luận PR: lớp
Crabbox tiêu chuẩn, bản ghi màn hình 24fps, GIF chuyển động 24fps và chiều rộng bản xem trước
1920px. Các bình luận trước/sau phải xuất bản một gói sạch chỉ chứa
các GIF dự kiến.

Các luồng Slack cũng có thể sử dụng nhóm. Việc kiểm tra dạng payload Slack hiện nằm
trong trình chạy QA Slack thay vì broker; dùng `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }`, với mã định danh
kênh Slack như `Cxxxxxxxxxx`. Xem
[Thiết lập không gian làm việc Slack](#setting-up-the-slack-workspace) để cấp ứng dụng
và phạm vi.

Các biến môi trường vận hành và hợp đồng điểm cuối của broker Convex nằm trong
[Kiểm thử → Thông tin xác thực Telegram dùng chung qua Convex](/vi/help/testing#shared-telegram-credentials-via-convex-v1)
(tên mục có trước nhóm đa kênh; ngữ nghĩa thuê được dùng chung
giữa các loại).

## Dữ liệu khởi tạo do kho lưu trữ quản lý

Các tài nguyên khởi tạo nằm trong `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Chúng được cố ý lưu trong git để kế hoạch QA hiển thị cho cả con người và
tác nhân.

`qa-lab` vẫn là một trình chạy kịch bản YAML chung. Mỗi tệp YAML kịch bản là
nguồn sự thật cho một lượt kiểm thử và phải định nghĩa:

- `title` cấp cao nhất
- siêu dữ liệu `scenario`
- siêu dữ liệu tùy chọn về danh mục, khả năng, luồng và rủi ro trong `scenario`
- tài liệu và tham chiếu mã trong `scenario`
- các yêu cầu Plugin tùy chọn trong `scenario`
- bản vá cấu hình Gateway tùy chọn trong `scenario`
- `flow` cấp cao nhất có thể thực thi cho các kịch bản luồng, hoặc
  `scenario.execution.kind` / `scenario.execution.path` cho các kịch bản Vitest và
  Playwright

Bề mặt runtime có thể tái sử dụng làm nền tảng cho `flow` vẫn mang tính tổng quát và
xuyên suốt. Ví dụ, các kịch bản YAML có thể kết hợp các trình trợ giúp phía
transport với các trình trợ giúp phía trình duyệt để điều khiển Control UI được nhúng thông qua
điểm nối Gateway `browser.request` mà không cần thêm một runner cho trường hợp đặc biệt.

Các tệp kịch bản nên được nhóm theo khả năng sản phẩm thay vì thư mục trong
cây mã nguồn. Giữ ổn định ID kịch bản khi di chuyển tệp; sử dụng `docsRefs` và
`codeRefs` để truy vết triển khai.

Danh sách cơ sở nên đủ rộng để bao quát:

- DM và trò chuyện trong kênh
- hành vi luồng thảo luận
- vòng đời hành động tin nhắn
- callback cron
- truy hồi bộ nhớ
- chuyển đổi mô hình
- bàn giao cho subagent
- đọc repo và đọc tài liệu
- một tác vụ dựng nhỏ như Lobster Invaders

## Các lane mock nhà cung cấp

`qa suite` có hai lane mock nhà cung cấp cục bộ:

- `mock-openai` là mock OpenClaw nhận biết kịch bản. Đây vẫn là lane mock
  xác định mặc định cho QA dựa trên repo và các cổng kiểm tra tính tương đương.
- `aimock` khởi động máy chủ nhà cung cấp dựa trên AIMock để thử nghiệm
  giao thức, fixture, ghi/phát lại và độ bao phủ chaos. Lane này mang tính bổ sung và
  không thay thế bộ điều phối kịch bản `mock-openai`.

Phần triển khai lane nhà cung cấp nằm trong `extensions/qa-lab/src/providers/`.
Mỗi nhà cung cấp sở hữu các giá trị mặc định, quy trình khởi động máy chủ cục bộ, cấu hình mô hình Gateway,
nhu cầu chuẩn bị hồ sơ xác thực và các cờ khả năng live/mock của riêng mình. Mã dùng chung của bộ kiểm thử và
Gateway định tuyến qua registry nhà cung cấp thay vì phân nhánh theo
tên nhà cung cấp.

## Bộ điều hợp transport

`qa-lab` sở hữu một điểm nối transport tổng quát cho các kịch bản QA YAML. `qa-channel` là
mặc định mô phỏng. `crabline` khởi động các máy chủ cục bộ có hình dạng như nhà cung cấp và
chạy các plugin kênh thông thường của OpenClaw với chúng. `live` được dành cho
thông tin xác thực thật của nhà cung cấp và các kênh bên ngoài.

Ở cấp độ kiến trúc, cách phân chia là:

- `qa-lab` sở hữu việc thực thi kịch bản tổng quát, tính đồng thời của worker, ghi
  artifact và báo cáo.
- Bộ điều hợp transport sở hữu cấu hình Gateway, trạng thái sẵn sàng, quan sát đầu vào và đầu ra,
  các hành động transport và trạng thái transport đã chuẩn hóa.
- Các tệp kịch bản YAML trong `qa/scenarios/` xác định lượt chạy kiểm thử; `qa-lab`
  cung cấp bề mặt runtime có thể tái sử dụng để thực thi chúng.

### Thêm một kênh

Việc thêm một kênh vào hệ thống QA YAML yêu cầu phần triển khai kênh
cùng một gói kịch bản kiểm tra hợp đồng của kênh. Để có độ bao phủ CI smoke,
hãy thêm máy chủ nhà cung cấp cục bộ Crabline tương ứng và cung cấp máy chủ đó
qua driver `crabline`.

Không thêm gốc lệnh QA cấp cao nhất mới khi host dùng chung `qa-lab` có thể
sở hữu luồng này.

`qa-lab` sở hữu cơ chế host dùng chung:

- gốc lệnh `openclaw qa`
- khởi động và dọn dẹp bộ kiểm thử
- tính đồng thời của worker
- ghi artifact
- tạo báo cáo
- thực thi kịch bản
- các bí danh tương thích cho những kịch bản `qa-channel` cũ hơn

Các plugin runner sở hữu hợp đồng transport:

- cách `openclaw qa <runner>` được gắn bên dưới gốc dùng chung `qa`
- cách Gateway được cấu hình cho transport đó
- cách kiểm tra trạng thái sẵn sàng
- cách đưa các sự kiện đầu vào vào hệ thống
- cách quan sát các tin nhắn đầu ra
- cách cung cấp bản ghi hội thoại và trạng thái transport đã chuẩn hóa
- cách thực thi các hành động dựa trên transport
- cách xử lý việc đặt lại hoặc dọn dẹp dành riêng cho transport

Ngưỡng áp dụng tối thiểu cho một kênh mới:

1. Giữ `qa-lab` làm chủ sở hữu của gốc dùng chung `qa`.
2. Triển khai runner transport trên điểm nối host dùng chung `qa-lab`.
3. Giữ các cơ chế dành riêng cho transport bên trong plugin runner hoặc
   harness của kênh.
4. Gắn runner dưới dạng `openclaw qa <runner>` thay vì đăng ký một
   lệnh gốc cạnh tranh. Các plugin runner nên khai báo `qaRunners` trong
   `openclaw.plugin.json` và xuất một mảng `qaRunnerCliRegistrations`
   tương ứng từ `runtime-api.ts`. Giữ `runtime-api.ts` gọn nhẹ; CLI tải lười và
   việc thực thi runner nên nằm sau các điểm vào riêng biệt. Một
   `adapterFactory` tùy chọn cung cấp transport cho các kịch bản dùng chung mà không thay đổi
   danh mục kịch bản hiện có của lệnh.
5. Viết mới hoặc điều chỉnh các kịch bản YAML trong những thư mục `qa/scenarios/`
   theo chủ đề.
6. Sử dụng các trình trợ giúp kịch bản tổng quát cho kịch bản mới.
7. Giữ cho các bí danh tương thích hiện có hoạt động, trừ khi repo đang thực hiện một
   đợt di chuyển có chủ đích.

Quy tắc quyết định rất nghiêm ngặt:

- Nếu hành vi có thể được biểu đạt một lần trong `qa-lab`, hãy đặt nó vào `qa-lab`.
- Nếu hành vi phụ thuộc vào transport của một kênh, hãy giữ nó trong plugin
  runner hoặc harness plugin đó.
- Nếu một kịch bản cần khả năng mới mà nhiều kênh có thể sử dụng,
  hãy thêm trình trợ giúp tổng quát thay vì một nhánh dành riêng cho kênh trong `suite.ts`.
- Nếu một hành vi chỉ có ý nghĩa đối với một transport, hãy giữ kịch bản
  dành riêng cho transport và nêu rõ điều đó trong hợp đồng kịch bản.

### Tên trình trợ giúp kịch bản

Các trình trợ giúp tổng quát được ưu tiên cho kịch bản mới:

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

Các bí danh tương thích vẫn có sẵn cho những kịch bản hiện có -
`waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`,
`formatConversationTranscript`, `resetBus` - nhưng khi viết kịch bản mới
nên sử dụng các tên tổng quát. Các bí danh tồn tại để tránh một đợt
di chuyển đồng loạt, không phải là mô hình được áp dụng về sau.

## Báo cáo

`qa-lab` xuất một báo cáo giao thức Markdown từ dòng thời gian bus đã quan sát.
Báo cáo nên trả lời:

- Những gì đã hoạt động
- Những gì đã thất bại
- Những gì vẫn bị chặn
- Những kịch bản tiếp theo nào đáng bổ sung

Để xem danh mục các kịch bản hiện có - hữu ích khi ước lượng công việc tiếp theo
hoặc kết nối một transport mới - hãy chạy `pnpm openclaw qa coverage` (thêm `--json`
để có đầu ra máy có thể đọc). Khi chọn bằng chứng tập trung cho một
hành vi hoặc đường dẫn tệp bị tác động, hãy chạy `pnpm openclaw qa coverage --match <query>`. Báo cáo
đối sánh tìm kiếm trong metadata kịch bản, tham chiếu tài liệu, tham chiếu mã, ID độ bao phủ,
plugin và yêu cầu nhà cung cấp, sau đó in ra các mục tiêu `qa suite
--scenario ...` phù hợp.

Mỗi lượt chạy `qa suite` ghi các artifact cấp cao nhất `qa-evidence.json`,
`qa-suite-summary.json` và `qa-suite-report.md` cho tập
kịch bản đã chọn. Các kịch bản khai báo `execution.kind: vitest` hoặc
`execution.kind: playwright` sẽ chạy đường dẫn kiểm thử tương ứng và cũng ghi
nhật ký theo từng kịch bản. Các kịch bản khai báo `execution.kind: script` sẽ chạy
trình tạo bằng chứng tại `execution.path` thông qua `node --import tsx` (với
`${outputDir}` và `${scenarioId}` được mở rộng trong `execution.args`); trình
tạo này ghi `qa-evidence.json` riêng, các mục trong đó được nhập vào
đầu ra của bộ kiểm thử và các đường dẫn artifact được phân giải tương đối theo
`qa-evidence.json` của trình tạo đó. Khi truy cập `qa suite` thông qua `qa run
--qa-profile`, cùng `qa-evidence.json` đó cũng bao gồm phần tóm tắt
bảng điểm hồ sơ cho các danh mục phân loại đã chọn.

Hãy xem đầu ra độ bao phủ như một công cụ hỗ trợ khám phá, không phải phương án thay thế cổng kiểm tra;
kịch bản được chọn vẫn cần đúng chế độ nhà cung cấp, transport live,
Multipass, Testbox hoặc lane phát hành cho hành vi đang được kiểm thử. Để biết
ngữ cảnh bảng điểm, hãy xem [Bảng điểm mức độ trưởng thành](/vi/maturity/scorecard).

Để kiểm tra tính cách và phong cách, hãy chạy cùng một kịch bản trên nhiều
tham chiếu mô hình live và viết một báo cáo Markdown đã được chấm:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.6-luna,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.6-sol,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Lệnh này chạy các tiến trình con Gateway QA cục bộ, không phải Docker. Các kịch bản
đánh giá tính cách nên thiết lập persona thông qua `SOUL.md`, sau đó chạy các
lượt tương tác người dùng thông thường như trò chuyện, trợ giúp workspace và các tác vụ tệp nhỏ. Không nên
cho mô hình ứng viên biết rằng nó đang được đánh giá. Lệnh này lưu giữ
toàn bộ bản ghi hội thoại, ghi lại số liệu thống kê cơ bản của lượt chạy, sau đó yêu cầu các mô hình chấm điểm ở
chế độ nhanh với mức suy luận `xhigh` khi được hỗ trợ để xếp hạng các lượt chạy theo
độ tự nhiên, phong thái và tính hài hước. Sử dụng `--blind-judge-models` khi so sánh
các nhà cung cấp: prompt chấm điểm vẫn nhận được mọi bản ghi hội thoại và trạng thái lượt chạy, nhưng
các tham chiếu ứng viên được thay bằng nhãn trung lập như `candidate-01`; sau khi
phân tích, báo cáo ánh xạ thứ hạng trở lại các tham chiếu thật.

Các lượt chạy ứng viên mặc định dùng mức suy luận `high`, với `medium` cho GPT-5.6 Luna và
`xhigh` cho các tham chiếu đánh giá OpenAI cũ hơn có hỗ trợ. Ghi đè một
ứng viên cụ thể nội tuyến bằng `--model provider/model,thinking=<level>`; các
tùy chọn nội tuyến cũng hỗ trợ `fast`, `no-fast` và `fast=<bool>`. `--thinking
<level>` vẫn đặt giá trị dự phòng toàn cục, còn dạng `--model-thinking
<provider/model=level>` cũ hơn được giữ lại để tương thích. Các tham chiếu ứng viên OpenAI
mặc định dùng chế độ nhanh để sử dụng xử lý ưu tiên khi nhà cung cấp
hỗ trợ. Chỉ truyền `--fast` khi bạn muốn buộc bật chế độ nhanh cho
mọi mô hình ứng viên. Thời lượng chạy ứng viên và chấm điểm được ghi lại trong
báo cáo để phân tích benchmark, nhưng prompt chấm điểm nêu rõ không được xếp hạng
theo tốc độ. Các lượt chạy mô hình ứng viên và mô hình chấm điểm đều mặc định có mức đồng thời 16.
Giảm `--concurrency` hoặc `--judge-concurrency` khi giới hạn nhà cung cấp hoặc áp lực lên
Gateway cục bộ khiến lượt chạy có quá nhiều nhiễu.

Khi không truyền `--model` ứng viên, đánh giá tính cách mặc định dùng
`openai/gpt-5.6-luna`, `openai/gpt-5.2`, `openai/gpt-5`,
`anthropic/claude-opus-4-8`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` và `google/gemini-3.1-pro-preview`. Khi không
truyền `--judge-model`, các mô hình chấm điểm mặc định là
`openai/gpt-5.6-sol,thinking=xhigh,fast` và
`anthropic/claude-opus-4-8,thinking=high`.

## Tài liệu liên quan

- [Bảng điểm mức độ trưởng thành](/vi/maturity/scorecard)
- [Gói benchmark tác tử cá nhân](/vi/concepts/personal-agent-benchmark-pack)
- [Kênh QA](/vi/channels/qa-channel)
- [Kiểm thử](/vi/help/testing)
- [Bảng điều khiển](/vi/web/dashboard)
