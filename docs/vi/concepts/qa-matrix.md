---
read_when:
    - Chạy pnpm openclaw qa matrix cục bộ
    - Thêm hoặc chọn các kịch bản QA Matrix
    - Phân loại sự cố lỗi QA Ma trận, hết thời gian chờ hoặc dọn dẹp bị kẹt
summary: 'Tài liệu tham khảo dành cho maintainer về lane QA trực tiếp Matrix được hỗ trợ bởi Docker: CLI, hồ sơ, biến môi trường, kịch bản và tạo tác đầu ra.'
title: QA cho Matrix
x-i18n:
    generated_at: "2026-07-04T20:34:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4f7fd98b5e7fef7a30c8820c5a1fc48c199e4d09db34255e8b2287a047b339f
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Làn QA Matrix chạy Plugin `@openclaw/matrix` được đóng gói sẵn với một homeserver Tuwunel dùng một lần trong Docker, cùng các tài khoản driver, SUT và observer tạm thời cũng như các phòng được seed sẵn. Đây là phạm vi kiểm thử thực với transport thật cho Matrix.

Đây là công cụ chỉ dành cho maintainer. Các bản phát hành OpenClaw đóng gói cố ý bỏ qua `qa-lab`, vì vậy `openclaw qa` chỉ khả dụng từ một checkout mã nguồn. Các checkout mã nguồn tải trực tiếp runner được đóng gói sẵn - không cần bước cài đặt Plugin.

Để biết bối cảnh rộng hơn về khung QA, xem [tổng quan QA](/vi/concepts/qa-e2e-automation).

## Bắt đầu nhanh

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

`pnpm openclaw qa matrix` thuần túy chạy `--profile all` và không dừng ở lỗi đầu tiên. Dùng `--profile fast --fail-fast` cho cổng phát hành; chia nhỏ catalog bằng `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` khi chạy toàn bộ inventory song song.

## Làn này làm gì

1. Cấp phát một homeserver Tuwunel dùng một lần trong Docker (image mặc định `ghcr.io/matrix-construct/tuwunel:v1.5.1`, tên máy chủ `matrix-qa.test`, cổng `28008`) phía sau một bộ ghi request/response có giới hạn và có biên tập dữ liệu nhạy cảm.
2. Đăng ký ba người dùng tạm thời - `driver` (gửi lưu lượng inbound), `sut` (tài khoản OpenClaw Matrix đang được kiểm thử), `observer` (ghi nhận lưu lượng bên thứ ba).
3. Seed các phòng mà những kịch bản được chọn yêu cầu (main, threading, media, restart, secondary, allowlist, E2EE, verification DM, v.v.).
4. Chạy probe giao thức `matrix-qa-v1` trung lập với substrate trên ranh giới Tuwunel đã ghi nhận. Unit test chứng minh hợp đồng probe với fixture giao thức Matrix; host adapter transport QA chuẩn trong [#99707](https://github.com/openclaw/openclaw/pull/99707) sở hữu wiring mục tiêu Crabline thật.
5. Khởi động một Gateway OpenClaw con với Plugin Matrix thật được giới hạn vào tài khoản SUT; `qa-channel` không được tải trong tiến trình con.
6. Chạy tuần tự các kịch bản, quan sát sự kiện qua các client Matrix driver/observer và suy ra kỳ vọng route/state từ lưu lượng đã ghi nhận.
7. Dọn dẹp homeserver, ghi báo cáo và artifact bằng chứng, rồi thoát.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Cờ thường dùng

| Cờ                    | Mặc định                                      | Mô tả                                                                                                                                                         |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Profile kịch bản. Xem [Profile](#profiles).                                                                                                                   |
| `--fail-fast`         | tắt                                           | Dừng sau check hoặc kịch bản thất bại đầu tiên.                                                                                                               |
| `--scenario <id>`     | -                                             | Chỉ chạy kịch bản này. Có thể lặp lại. Xem [Kịch bản](#scenarios).                                                                                            |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Nơi ghi báo cáo, tóm tắt, inventory route/state, sự kiện đã quan sát và log đầu ra. Đường dẫn tương đối được phân giải theo `--repo-root`.                    |
| `--repo-root <path>`  | `process.cwd()`                               | Gốc repository khi gọi từ một thư mục làm việc trung lập.                                                                                                     |
| `--sut-account <id>`  | `sut`                                         | ID tài khoản Matrix trong cấu hình Gateway QA.                                                                                                                |

### Cờ provider

Làn này dùng transport Matrix thật nhưng provider mô hình có thể cấu hình:

| Cờ                       | Mặc định         | Mô tả                                                                                                                                          |
| ------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` cho dispatch mock xác định hoặc `live-frontier` cho provider frontier trực tiếp. Alias cũ `live-openai` vẫn hoạt động.           |
| `--model <ref>`          | mặc định provider | Ref `provider/model` chính.                                                                                                                    |
| `--alt-model <ref>`      | mặc định provider | Ref `provider/model` thay thế khi kịch bản chuyển đổi giữa lúc chạy.                                                                           |
| `--fast`                 | tắt              | Bật chế độ nhanh của provider khi được hỗ trợ.                                                                                                 |

Matrix QA không chấp nhận `--credential-source` hoặc `--credential-role`. Làn này cấp phát người dùng dùng một lần cục bộ; không có pool credential dùng chung để lease.

## Profile

Profile được chọn quyết định kịch bản nào sẽ chạy.

| Profile         | Dùng cho                                                                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (mặc định) | Toàn bộ catalog. Chậm nhưng toàn diện.                                                                                                                                                                                                     |
| `fast`          | Tập con cổng phát hành kiểm tra hợp đồng transport trực tiếp: canary, mention gating, chặn allowlist, hình dạng reply, tiếp tục sau restart, follow-up thread, cô lập thread, quan sát reaction và phân phối metadata phê duyệt exec.       |
| `transport`     | Các kịch bản cấp transport về threading, DM, room, autojoin, mention/allowlist, phê duyệt và reaction.                                                                                                                                     |
| `media`         | Phạm vi attachment ảnh, âm thanh, video, PDF, EPUB.                                                                                                                                                                                        |
| `e2ee-smoke`    | Phạm vi E2EE tối thiểu - reply được mã hóa cơ bản, follow-up thread, bootstrap thành công.                                                                                                                                                 |
| `e2ee-deep`     | Các kịch bản E2EE toàn diện về mất state, backup, khóa và khôi phục.                                                                                                                                                                       |
| `e2ee-cli`      | Các kịch bản CLI `openclaw matrix encryption setup` và `verify *` được điều khiển qua harness QA.                                                                                                                                          |

Ánh xạ chính xác nằm trong `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Kịch bản

Danh sách ID kịch bản đầy đủ là union `MatrixQaScenarioId` trong `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Các danh mục gồm:

- threading - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- top-level / DM / room - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming và tiến độ công cụ - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routing - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reactions - `matrix-reaction-*`
- phê duyệt - `matrix-approval-*` (metadata exec/Plugin, fallback chia chunk, reaction từ chối, thread và routing `target: "both"`)
- restart và replay - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- mention gating, bot-to-bot và allowlist - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (reply cơ bản, follow-up thread, bootstrap, vòng đời khóa khôi phục, các biến thể mất state, hành vi backup máy chủ, vệ sinh thiết bị, xác minh SAS / QR / DM, restart, biên tập artifact)
- E2EE CLI - `matrix-e2ee-cli-*` (thiết lập mã hóa, thiết lập idempotent, lỗi bootstrap, vòng đời recovery-key, nhiều tài khoản, gateway-reply round-trip, tự xác minh)

Truyền `--scenario <id>` (có thể lặp lại) để chạy một tập được chọn thủ công; kết hợp với `--profile all` để bỏ qua profile gating.

## Biến môi trường

| Biến                                    | Mặc định                                  | Tác động                                                                                                                                                                                                  |
| --------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 phút)                       | Giới hạn trên cứng cho toàn bộ lượt chạy.                                                                                                                                                                 |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Giới hạn cho phản hồi canary ban đầu. CI phát hành tăng giá trị này trên runner dùng chung để một lượt gateway đầu tiên chậm không gây lỗi trước khi phạm vi kịch bản bắt đầu.                            |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Khoảng thời gian yên lặng cho các xác nhận âm tính không có phản hồi. Bị giới hạn ở mức `≤` thời gian chờ của lượt chạy.                                                                                  |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Giới hạn cho việc tháo dỡ Docker. Các bề mặt lỗi bao gồm lệnh khôi phục `docker compose ... down --remove-orphans`.                                                                                       |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Ghi đè ảnh homeserver khi xác thực với một phiên bản Tuwunel khác.                                                                                                                                        |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | bật                                       | `0` tắt các dòng tiến trình `[matrix-qa] ...` trên stderr. `1` buộc bật chúng.                                                                                                                            |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | đã biên tập                               | `1` giữ nội dung tin nhắn và `formatted_body` trong `matrix-qa-observed-events.json`. Mặc định biên tập để giữ an toàn cho artifact CI.                                                                   |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | tắt                                       | `1` bỏ qua `process.exit` xác định sau khi ghi artifact. Mặc định buộc thoát vì các handle mã hóa gốc của matrix-js-sdk có thể giữ event loop sống sau khi hoàn tất artifact.                             |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | chưa đặt                                  | Khi được đặt bởi launcher bên ngoài (ví dụ `scripts/run-node.mjs`), Matrix QA dùng lại đường dẫn log đó thay vì tự khởi động tee riêng.                                                                    |

## Artifact đầu ra

Được ghi vào `--output-dir`:

- `matrix-qa-report.md` - Báo cáo giao thức Markdown (những gì đã đạt, lỗi, bị bỏ qua và lý do).
- `matrix-qa-summary.json` - Tóm tắt có cấu trúc phù hợp cho phân tích CI và dashboard.
- `matrix-qa-route-state-manifest.json` - Kho `matrix-qa-v1` động được khóa theo id kịch bản. Nó ghi lại các dạng route/body đã biên tập, thứ tự yêu cầu, các lần thử lại quan sát được, lỗi, tính liên tục của sync-token, và các nhóm trạng thái thiết bị/khóa/phương tiện/sao lưu quan sát được trong lượt chạy đó. Đây là bằng chứng có thể thực thi, không phải baseline được commit.
- `matrix-qa-observed-events.json` - Các sự kiện Matrix quan sát được từ client driver và observer. Nội dung được biên tập trừ khi `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; siêu dữ liệu phê duyệt được tóm tắt bằng các trường an toàn được chọn và bản xem trước lệnh được cắt ngắn.
- `matrix-qa-output.log` - stdout/stderr kết hợp từ lượt chạy. Nếu `OPENCLAW_RUN_NODE_OUTPUT_LOG` được đặt, log của launcher bên ngoài sẽ được dùng lại thay thế.

Thư mục đầu ra mặc định là `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` để các lượt chạy liên tiếp không ghi đè lên nhau.

## Mẹo phân loại lỗi

- **Lượt chạy treo gần cuối:** các handle mã hóa gốc của `matrix-js-sdk` có thể sống lâu hơn harness. Mặc định buộc `process.exit` sạch sau khi ghi artifact; nếu bạn đã bỏ đặt `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, hãy dự kiến tiến trình sẽ còn tồn tại một lúc.
- **Lỗi dọn dẹp:** tìm lệnh khôi phục được in ra (một lệnh gọi `docker compose ... down --remove-orphans`) và chạy thủ công để giải phóng cổng homeserver.
- **Các cửa sổ xác nhận âm tính không ổn định trong CI:** giảm `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (mặc định 8 giây) khi CI nhanh; tăng giá trị này trên các runner dùng chung chậm.
- **Cần nội dung đã biên tập cho báo cáo lỗi:** chạy lại với `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` và đính kèm `matrix-qa-observed-events.json`. Xem artifact tạo ra là nhạy cảm.
- **Phiên bản Tuwunel khác:** trỏ `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` đến phiên bản đang được kiểm thử. Lane chỉ kiểm tra ảnh mặc định được ghim.

## Hợp đồng transport trực tiếp

Matrix là một trong ba lane transport trực tiếp (Matrix, Telegram, Discord) dùng chung một danh sách kiểm tra hợp đồng duy nhất được định nghĩa trong [Tổng quan QA → Phạm vi transport trực tiếp](/vi/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` vẫn là bộ kiểm thử tổng hợp rộng và được chủ ý không đưa vào ma trận đó.

## Liên quan

- [Tổng quan QA](/vi/concepts/qa-e2e-automation) - toàn bộ ngăn xếp QA và hợp đồng transport trực tiếp
- [QA Channel](/vi/channels/qa-channel) - adapter kênh tổng hợp cho các kịch bản dựa trên repo
- [Kiểm thử](/vi/help/testing) - chạy kiểm thử và thêm phạm vi QA
- [Matrix](/vi/channels/matrix) - Plugin kênh đang được kiểm thử
