---
read_when:
    - Chạy pnpm openclaw qa matrix cục bộ
    - Thêm hoặc chọn các kịch bản QA Matrix
    - Phân loại lỗi Matrix QA, thời gian chờ hoặc quá trình dọn dẹp bị kẹt
summary: 'Tài liệu tham khảo dành cho người bảo trì cho luồng QA trực tiếp Matrix chạy bằng Docker: CLI, hồ sơ, biến môi trường, kịch bản và tạo tác đầu ra.'
title: QA ma trận
x-i18n:
    generated_at: "2026-05-06T09:09:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c6d836492368c470468547950d3765a64187694852222a5a1f0ae4185569abe
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Lane QA Matrix chạy Plugin `@openclaw/matrix` được đóng gói kèm với một homeserver Tuwunel dùng một lần trong Docker, cùng các tài khoản driver, SUT và observer tạm thời, cũng như các phòng được gieo sẵn. Đây là phạm vi kiểm thử trực tiếp sát với lớp vận chuyển thực tế cho Matrix.

Đây là công cụ chỉ dành cho maintainer. Các bản phát hành OpenClaw đóng gói cố ý bỏ qua `qa-lab`, nên `openclaw qa` chỉ khả dụng từ một bản checkout mã nguồn. Các bản checkout mã nguồn tải trực tiếp runner được đóng gói kèm - không cần bước cài đặt Plugin.

Để biết ngữ cảnh rộng hơn về framework QA, xem [tổng quan QA](/vi/concepts/qa-e2e-automation).

## Bắt đầu nhanh

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

`pnpm openclaw qa matrix` thuần chạy `--profile all` và không dừng ở lỗi đầu tiên. Dùng `--profile fast --fail-fast` cho gate phát hành; chia nhỏ catalog bằng `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` khi chạy toàn bộ inventory song song.

## Lane này làm gì

1. Cấp phát một homeserver Tuwunel dùng một lần trong Docker (image mặc định `ghcr.io/matrix-construct/tuwunel:v1.5.1`, tên máy chủ `matrix-qa.test`, cổng `28008`).
2. Đăng ký ba người dùng tạm thời - `driver` (gửi lưu lượng inbound), `sut` (tài khoản OpenClaw Matrix đang được kiểm thử), `observer` (ghi nhận lưu lượng bên thứ ba).
3. Gieo các phòng mà những kịch bản đã chọn yêu cầu (chính, luồng thảo luận, media, khởi động lại, phụ, danh sách cho phép, E2EE, DM xác minh, v.v.).
4. Khởi động một Gateway OpenClaw con với Plugin Matrix thật được giới hạn trong tài khoản SUT; `qa-channel` không được tải trong tiến trình con.
5. Chạy các kịch bản theo trình tự, quan sát sự kiện qua các client Matrix driver/observer.
6. Gỡ bỏ homeserver, ghi artifact báo cáo và tóm tắt, rồi thoát.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Cờ thường dùng

| Cờ                    | Mặc định                                      | Mô tả                                                                                                                              |
| --------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                        | Hồ sơ kịch bản. Xem [Hồ sơ](#profiles).                                                                                            |
| `--fail-fast`         | tắt                                          | Dừng sau lần kiểm tra hoặc kịch bản đầu tiên thất bại.                                                                              |
| `--scenario <id>`     | -                                            | Chỉ chạy kịch bản này. Có thể lặp lại. Xem [Kịch bản](#scenarios).                                                                 |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Nơi ghi báo cáo, tóm tắt, sự kiện đã quan sát và log đầu ra. Đường dẫn tương đối được phân giải theo `--repo-root`.                |
| `--repo-root <path>`  | `process.cwd()`                              | Gốc repository khi gọi từ thư mục làm việc trung lập.                                                                               |
| `--sut-account <id>`  | `sut`                                        | ID tài khoản Matrix trong cấu hình Gateway QA.                                                                                      |

### Cờ nhà cung cấp

Lane này dùng lớp vận chuyển Matrix thật, nhưng nhà cung cấp mô hình có thể cấu hình:

| Cờ                       | Mặc định             | Mô tả                                                                                                                                                      |
| ------------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`      | `mock-openai` để dispatch mock xác định hoặc `live-frontier` cho các nhà cung cấp mô hình tiên tiến trực tiếp. Alias cũ `live-openai` vẫn hoạt động.       |
| `--model <ref>`          | mặc định nhà cung cấp | Ref `provider/model` chính.                                                                                                                                |
| `--alt-model <ref>`      | mặc định nhà cung cấp | Ref `provider/model` thay thế khi kịch bản chuyển đổi giữa chừng.                                                                                          |
| `--fast`                 | tắt                  | Bật chế độ nhanh của nhà cung cấp khi được hỗ trợ.                                                                                                         |

QA Matrix không chấp nhận `--credential-source` hoặc `--credential-role`. Lane này cấp phát người dùng dùng một lần cục bộ; không có pool thông tin xác thực dùng chung để thuê.

## Hồ sơ

Hồ sơ được chọn quyết định những kịch bản nào sẽ chạy.

| Hồ sơ           | Dùng cho                                                                                                                                                                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (mặc định) | Toàn bộ catalog. Chậm nhưng đầy đủ.                                                                                                                                                                                                       |
| `fast`          | Tập con gate phát hành kiểm tra hợp đồng lớp vận chuyển trực tiếp: canary, gate mention, chặn danh sách cho phép, hình dạng trả lời, tiếp tục sau khởi động lại, follow-up luồng thảo luận, cô lập luồng thảo luận, quan sát reaction và phân phối metadata phê duyệt exec. |
| `transport`     | Các kịch bản ở cấp lớp vận chuyển cho luồng thảo luận, DM, phòng, tự tham gia, mention/danh sách cho phép, phê duyệt và reaction.                                                                                                        |
| `media`         | Phạm vi attachment hình ảnh, âm thanh, video, PDF, EPUB.                                                                                                                                                                                  |
| `e2ee-smoke`    | Phạm vi E2EE tối thiểu - trả lời được mã hóa cơ bản, follow-up luồng thảo luận, bootstrap thành công.                                                                                                                                     |
| `e2ee-deep`     | Các kịch bản E2EE đầy đủ về mất trạng thái, sao lưu, khóa và khôi phục.                                                                                                                                                                   |
| `e2ee-cli`      | Các kịch bản CLI `openclaw matrix encryption setup` và `verify *` được điều khiển qua harness QA.                                                                                                                                         |

Ánh xạ chính xác nằm trong `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Kịch bản

Danh sách ID kịch bản đầy đủ là union `MatrixQaScenarioId` trong `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Các danh mục gồm:

- luồng thảo luận - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- cấp cao nhất / DM / phòng - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming và tiến độ công cụ - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- định tuyến - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reaction - `matrix-reaction-*`
- phê duyệt - `matrix-approval-*` (metadata exec/Plugin, fallback chia đoạn, reaction từ chối, luồng thảo luận và định tuyến `target: "both"`)
- khởi động lại và phát lại - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- gate mention, bot-to-bot và danh sách cho phép - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (trả lời cơ bản, follow-up luồng thảo luận, bootstrap, vòng đời khóa khôi phục, các biến thể mất trạng thái, hành vi sao lưu máy chủ, vệ sinh thiết bị, xác minh SAS / QR / DM, khởi động lại, biên tập artifact)
- CLI E2EE - `matrix-e2ee-cli-*` (thiết lập mã hóa, thiết lập idempotent, lỗi bootstrap, vòng đời khóa khôi phục, nhiều tài khoản, vòng khứ hồi gateway-reply, tự xác minh)

Truyền `--scenario <id>` (có thể lặp lại) để chạy một tập được chọn thủ công; kết hợp với `--profile all` để bỏ qua gate hồ sơ.

## Biến môi trường

| Biến                                    | Mặc định                                  | Tác dụng                                                                                                                                                                                                  |
| --------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 phút)                       | Giới hạn trên cứng cho toàn bộ lượt chạy.                                                                                                                                                                 |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Giới hạn cho phản hồi canary ban đầu. CI phát hành tăng giá trị này trên các runner dùng chung để một lượt Gateway đầu tiên chậm không làm thất bại trước khi phạm vi kịch bản bắt đầu.                  |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Khoảng lặng cho các xác nhận phủ định không phản hồi. Bị giới hạn ở mức `≤` thời gian chờ của lượt chạy.                                                                                                  |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Giới hạn cho quá trình dọn dẹp Docker. Các bề mặt lỗi bao gồm lệnh khôi phục `docker compose ... down --remove-orphans`.                                                                                  |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Ghi đè image homeserver khi xác thực với một phiên bản Tuwunel khác.                                                                                                                                      |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | bật                                       | `0` tắt các dòng tiến trình `[matrix-qa] ...` trên stderr. `1` buộc bật chúng.                                                                                                                            |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | đã che                                    | `1` giữ lại thân thư và `formatted_body` trong `matrix-qa-observed-events.json`. Mặc định che nội dung để giữ an toàn cho các artifact CI.                                                                |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | tắt                                       | `1` bỏ qua `process.exit` tất định sau khi ghi artifact. Mặc định buộc thoát vì các handle crypto native của matrix-js-sdk có thể giữ event loop còn sống sau khi hoàn tất artifact.                     |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | chưa đặt                                  | Khi được đặt bởi một trình khởi chạy bên ngoài (ví dụ `scripts/run-node.mjs`), Matrix QA dùng lại đường dẫn log đó thay vì tự khởi động tee riêng.                                                        |

## Artifact đầu ra

Được ghi vào `--output-dir`:

- `matrix-qa-report.md` - Báo cáo giao thức Markdown (những gì đã đạt, thất bại, bị bỏ qua và lý do).
- `matrix-qa-summary.json` - Tóm tắt có cấu trúc phù hợp cho việc phân tích CI và dashboard.
- `matrix-qa-observed-events.json` - Các sự kiện Matrix quan sát được từ client driver và observer. Nội dung thân bị che trừ khi `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; metadata phê duyệt được tóm tắt với các trường an toàn được chọn và bản xem trước lệnh bị cắt ngắn.
- `matrix-qa-output.log` - stdout/stderr kết hợp từ lượt chạy. Nếu `OPENCLAW_RUN_NODE_OUTPUT_LOG` được đặt, log của trình khởi chạy bên ngoài sẽ được dùng lại thay thế.

Thư mục đầu ra mặc định là `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` để các lượt chạy nối tiếp không ghi đè lẫn nhau.

## Mẹo phân loại lỗi

- **Lượt chạy treo gần cuối:** các handle crypto native của `matrix-js-sdk` có thể sống lâu hơn harness. Mặc định buộc `process.exit` sạch sau khi ghi artifact; nếu bạn đã bỏ đặt `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, hãy dự kiến tiến trình sẽ còn tồn tại một lúc.
- **Lỗi dọn dẹp:** tìm lệnh khôi phục được in ra (một lời gọi `docker compose ... down --remove-orphans`) và chạy thủ công để giải phóng cổng homeserver.
- **Khoảng thời gian xác nhận phủ định không ổn định trong CI:** giảm `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (mặc định 8 giây) khi CI nhanh; tăng giá trị này trên các runner dùng chung chậm.
- **Cần nội dung thân đã che cho báo cáo lỗi:** chạy lại với `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` và đính kèm `matrix-qa-observed-events.json`. Xem artifact thu được là nhạy cảm.
- **Phiên bản Tuwunel khác:** trỏ `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` tới phiên bản đang được kiểm thử. Lane chỉ kiểm tra image mặc định đã ghim.

## Hợp đồng truyền tải trực tiếp

Matrix là một trong ba lane truyền tải trực tiếp (Matrix, Telegram, Discord) dùng chung một danh sách kiểm tra hợp đồng duy nhất được định nghĩa trong [Tổng quan QA → Phạm vi bao phủ truyền tải trực tiếp](/vi/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` vẫn là bộ kiểm thử tổng hợp rộng và cố ý không thuộc matrix đó.

## Liên quan

- [Tổng quan QA](/vi/concepts/qa-e2e-automation) - toàn bộ ngăn xếp QA và hợp đồng truyền tải trực tiếp
- [Kênh QA](/vi/channels/qa-channel) - adapter kênh tổng hợp cho các kịch bản dựa trên repo
- [Kiểm thử](/vi/help/testing) - chạy kiểm thử và thêm phạm vi QA
- [Matrix](/vi/channels/matrix) - Plugin kênh đang được kiểm thử
