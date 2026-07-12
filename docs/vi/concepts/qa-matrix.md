---
read_when:
    - Chạy pnpm openclaw qa matrix cục bộ
    - Thêm hoặc chọn các kịch bản QA cho Matrix
    - Phân loại lỗi QA Matrix, thời gian chờ hoặc quá trình dọn dẹp bị treo
summary: 'Tài liệu tham khảo dành cho người bảo trì về luồng QA trực tiếp Matrix chạy trên Docker: CLI, hồ sơ, biến môi trường, kịch bản và các tạo phẩm đầu ra.'
title: QA ma trận
x-i18n:
    generated_at: "2026-07-12T07:55:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8034570f5a52619c88bee1f6708bd710744d3cb52a1eb82726aa118844045ef
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Làn QA Matrix chạy plugin `@openclaw/matrix` đi kèm trên một homeserver Tuwunel dùng một lần trong Docker, với các tài khoản tạm thời cho trình điều khiển, SUT và trình quan sát, cùng các phòng được tạo sẵn. Đây là phạm vi kiểm thử trực tiếp trên cơ chế vận chuyển Matrix thực.

Công cụ chỉ dành cho người bảo trì. Các bản phát hành OpenClaw đóng gói không bao gồm `qa-lab`, vì vậy `openclaw qa` chỉ chạy từ bản checkout mã nguồn, nơi trình chạy đi kèm được tải trực tiếp mà không cần bước cài đặt plugin.

Để biết bối cảnh rộng hơn về khung QA, xem [tổng quan về QA](/vi/concepts/qa-e2e-automation).

## Bắt đầu nhanh

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Lệnh `pnpm openclaw qa matrix` thuần túy chạy với `--profile all` và không dừng ở lỗi đầu tiên. Chia toàn bộ danh mục thành các phân đoạn trên những tác vụ chạy song song bằng `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`.

## Hoạt động của làn

1. Cấp phát một homeserver Tuwunel dùng một lần trong Docker (ảnh mặc định `ghcr.io/matrix-construct/tuwunel:v1.5.1`, tên máy chủ `matrix-qa.test`, cổng `28008`) phía sau một trình ghi yêu cầu/phản hồi có giới hạn và che dữ liệu nhạy cảm.
2. Đăng ký ba người dùng tạm thời: `driver` (gửi lưu lượng đến), `sut` (tài khoản Matrix của OpenClaw đang được kiểm thử), `observer` (thu thập lưu lượng của bên thứ ba).
3. Tạo sẵn các phòng mà những kịch bản đã chọn yêu cầu (chính, luồng thảo luận, phương tiện, khởi động lại, phụ, danh sách cho phép, E2EE, tin nhắn trực tiếp xác minh, v.v.).
4. Chạy phép thăm dò giao thức `matrix-qa-v1` trung lập với lớp nền trên ranh giới Tuwunel đã được ghi lại. Các kiểm thử đơn vị chứng minh hợp đồng của phép thăm dò bằng fixture giao thức Matrix; máy chủ bộ điều hợp vận chuyển QA chuẩn trong [#99707](https://github.com/openclaw/openclaw/pull/99707) sở hữu việc kết nối mục tiêu Crabline thực.
5. Khởi động một Gateway OpenClaw tiến trình con với plugin Matrix thực, được giới hạn trong tài khoản SUT.
6. Chạy tuần tự các kịch bản, quan sát sự kiện thông qua các máy khách Matrix của trình điều khiển/trình quan sát và suy ra kỳ vọng về định tuyến/trạng thái từ lưu lượng đã ghi.
7. Dỡ bỏ homeserver, ghi báo cáo cùng các hiện vật bằng chứng, rồi thoát.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Cờ thông dụng

| Cờ                    | Mặc định                                      | Mô tả                                                                                                                                                                              |
| --------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Hồ sơ kịch bản. Xem [Hồ sơ](#profiles).                                                                                                                                            |
| `--fail-fast`         | tắt                                           | Dừng sau lần kiểm tra hoặc kịch bản thất bại đầu tiên.                                                                                                                             |
| `--scenario <id>`     | -                                             | Chỉ chạy kịch bản này. Có thể lặp lại. Xem [Kịch bản](#scenarios).                                                                                                                 |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Nơi ghi báo cáo, bản tóm tắt, danh mục định tuyến/trạng thái, các sự kiện quan sát được và nhật ký đầu ra. Các đường dẫn tương đối được phân giải theo `--repo-root`.                |
| `--repo-root <path>`  | `process.cwd()`                               | Thư mục gốc của kho mã khi gọi từ một thư mục làm việc trung lập.                                                                                                                  |
| `--sut-account <id>`  | `sut`                                         | ID tài khoản Matrix bên trong cấu hình Gateway QA.                                                                                                                                 |

### Cờ nhà cung cấp

Làn này sử dụng cơ chế vận chuyển Matrix thực, nhưng có thể cấu hình nhà cung cấp mô hình:

| Cờ                       | Mặc định               | Mô tả                                                                                                                                                                       |
| ------------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`        | `mock-openai` để điều phối mô phỏng có tính xác định hoặc `live-frontier` cho các nhà cung cấp tiên tiến trực tiếp. Bí danh cũ `live-openai` vẫn hoạt động.                  |
| `--model <ref>`          | mặc định của nhà cung cấp | Tham chiếu `provider/model` chính.                                                                                                                                           |
| `--alt-model <ref>`      | mặc định của nhà cung cấp | Tham chiếu `provider/model` thay thế khi các kịch bản chuyển đổi giữa chừng trong quá trình chạy.                                                                            |
| `--fast`                 | tắt                    | Bật chế độ nhanh của nhà cung cấp khi được hỗ trợ.                                                                                                                           |

QA Matrix không chấp nhận `--credential-source` hoặc `--credential-role`. Làn này cấp phát cục bộ các người dùng dùng một lần; không có nhóm thông tin xác thực dùng chung để thuê.

## Hồ sơ

| Hồ sơ            | Dùng cho                                                                                                                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (mặc định) | Toàn bộ danh mục. Chậm nhưng toàn diện.                                                                                                                                                                                                   |
| `fast`           | Tập con dùng làm cổng phát hành, thực thi hợp đồng vận chuyển trực tiếp dạng mệnh lệnh: kiểm soát đề cập, chặn theo danh sách cho phép, hình dạng phản hồi, tiếp tục sau khởi động lại, quan sát phản ứng, phân phối siêu dữ liệu phê duyệt thực thi và phản hồi E2EE cơ bản. |
| `transport`      | Các kịch bản ở cấp vận chuyển về luồng thảo luận, tin nhắn trực tiếp, phòng, tự động tham gia, đề cập/danh sách cho phép, phê duyệt và phản ứng.                                                                                           |
| `media`          | Phạm vi kiểm thử tệp đính kèm hình ảnh, âm thanh, video, PDF và EPUB.                                                                                                                                                                     |
| `e2ee-smoke`     | Phạm vi E2EE tối thiểu: phản hồi mã hóa cơ bản, lượt theo dõi trong luồng thảo luận, khởi tạo thành công.                                                                                                                                  |
| `e2ee-deep`      | Các kịch bản E2EE toàn diện về mất trạng thái, sao lưu, khóa và khôi phục.                                                                                                                                                                 |
| `e2ee-cli`       | Các kịch bản CLI `openclaw matrix encryption setup` và `verify *` được điều khiển thông qua bộ khung QA.                                                                                                                                  |

Ánh xạ chính xác nằm trong `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Kịch bản

Bộ điều hợp Matrix dùng chung cung cấp các kịch bản YAML chuẩn sau thông qua `openclaw qa suite --channel-driver live --channel matrix`:

- `channel-chat-baseline`
- `thread-follow-up`
- `thread-isolation`
- `thread-reply-override`
- `dm-shared-session`
- `dm-per-room-session`

`subagent-thread-spawn` vẫn có thể được chọn rõ ràng bằng `--scenario subagent-thread-spawn`,
nhưng chưa thuộc tập Matrix dùng chung mặc định cho đến khi bằng chứng hoàn tất tiến trình con trực tiếp ổn định.

Danh sách ID kịch bản dạng mệnh lệnh còn lại là hợp `MatrixQaScenarioId` trong `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`. Các danh mục:

- luồng thảo luận: `matrix-thread-root-preservation`, `matrix-thread-nested-reply-shape`
- cấp cao nhất / tin nhắn trực tiếp / phòng: `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- truyền phát và tiến trình công cụ: `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- phương tiện: `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- định tuyến: `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- phản ứng: `matrix-reaction-*`
- phê duyệt: `matrix-approval-*` (siêu dữ liệu thực thi/plugin, phương án dự phòng chia khối, phản ứng từ chối, luồng thảo luận và định tuyến `target: "both"`)
- khởi động lại và phát lại: `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- kiểm soát đề cập, bot với bot và danh sách cho phép: `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE: `matrix-e2ee-*` (phản hồi cơ bản, lượt theo dõi trong luồng thảo luận, khởi tạo, vòng đời khóa khôi phục, các biến thể mất trạng thái, hành vi sao lưu máy chủ, vệ sinh thiết bị, xác minh SAS / QR / tin nhắn trực tiếp, khởi động lại, che dữ liệu nhạy cảm trong hiện vật)
- CLI E2EE: `matrix-e2ee-cli-*` (thiết lập mã hóa, thiết lập có tính lũy đẳng, lỗi khởi tạo, vòng đời khóa khôi phục, nhiều tài khoản, hành trình khứ hồi phản hồi Gateway, tự xác minh)

Truyền `--scenario <id>` (có thể lặp lại) để chạy một tập được chọn thủ công; kết hợp với `--profile all` để bỏ qua việc giới hạn theo hồ sơ.

## Biến môi trường

| Biến                                     | Mặc định                                  | Tác dụng                                                                                                                                                                                                 |
| ---------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`          | `1800000` (30 phút)                       | Giới hạn trên tuyệt đối cho toàn bộ lượt chạy.                                                                                                                                                           |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`   | `45000`                                   | Giới hạn cho phản hồi canary ban đầu. CI phát hành tăng giá trị này trên các runner dùng chung để lượt Gateway đầu tiên bị chậm không khiến quá trình thất bại trước khi bắt đầu bao phủ các kịch bản.    |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS`  | `8000`                                    | Khoảng thời gian yên lặng cho các xác nhận phủ định rằng không có phản hồi. Được giới hạn ở mức `<=` thời gian chờ của lượt chạy.                                                                        |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS`  | `90000`                                   | Giới hạn thời gian dọn dẹp Docker. Thông tin lỗi hiển thị cả lệnh khôi phục `docker compose ... down --remove-orphans`.                                                                                  |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`       | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Ghi đè ảnh máy chủ gia đình khi xác thực với một phiên bản Tuwunel khác.                                                                                                                                 |
| `OPENCLAW_QA_MATRIX_PROGRESS`            | bật                                       | `0` ẩn các dòng tiến trình `[matrix-qa] ...` trên stderr. `1` buộc hiển thị chúng.                                                                                                                       |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`     | đã biên tập                               | `1` giữ lại nội dung thông báo và `formatted_body` trong `matrix-qa-observed-events.json`. Theo mặc định, nội dung được biên tập để giữ an toàn cho các hiện vật CI.                                    |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT`  | tắt                                       | `1` bỏ qua `process.exit` có tính xác định sau khi ghi hiện vật. Mặc định buộc thoát vì các handle mã hóa gốc của matrix-js-sdk có thể giữ vòng lặp sự kiện hoạt động sau khi hoàn tất ghi hiện vật.      |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`           | chưa đặt                                  | Khi được trình khởi chạy bên ngoài đặt (ví dụ: `scripts/run-node.mjs`), QA Matrix tái sử dụng đường dẫn nhật ký đó thay vì tự khởi động tee.                                                              |

## Hiện vật đầu ra

Được ghi vào `--output-dir` (mặc định là `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` để các lượt chạy liên tiếp không ghi đè lẫn nhau):

- `matrix-qa-report.md`: Báo cáo giao thức Markdown (nội dung nào đã đạt, thất bại, bị bỏ qua và lý do).
- `matrix-qa-summary.json`: Bản tóm tắt có cấu trúc, phù hợp để CI phân tích và dùng trong bảng điều khiển.
- `matrix-qa-route-state-manifest.json`: Danh mục `matrix-qa-v1` động, được lập khóa theo mã định danh kịch bản. Tệp này ghi lại hình dạng tuyến/nội dung đã biên tập, thứ tự yêu cầu, các lần thử lại đã quan sát, lỗi, tính liên tục của mã thông báo đồng bộ, cùng các nhóm trạng thái thiết bị/khóa/phương tiện/sao lưu được quan sát trong lượt chạy đó. Đây là bằng chứng có thể thực thi, không phải đường cơ sở được đưa vào kho mã.
- `matrix-qa-observed-events.json`: Các sự kiện Matrix được quan sát từ máy khách điều khiển và máy khách quan sát. Nội dung được biên tập trừ khi đặt `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; siêu dữ liệu phê duyệt được tóm tắt bằng các trường an toàn đã chọn và bản xem trước lệnh được cắt ngắn.
- `matrix-qa-output.log`: stdout/stderr kết hợp từ lượt chạy. Nếu `OPENCLAW_RUN_NODE_OUTPUT_LOG` được đặt, nhật ký của trình khởi chạy bên ngoài sẽ được tái sử dụng.

## Mẹo phân loại sự cố

- **Lượt chạy bị treo gần cuối:** các handle mã hóa gốc của `matrix-js-sdk` có thể tồn tại lâu hơn bộ kiểm thử. Theo mặc định, hệ thống buộc thực hiện `process.exit` sạch sau khi ghi hiện vật; nếu đặt `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, tiến trình có thể tiếp tục tồn tại.
- **Lỗi dọn dẹp:** tìm lệnh khôi phục đã được in ra (một lệnh gọi `docker compose ... down --remove-orphans`) rồi chạy thủ công để giải phóng cổng máy chủ gia đình.
- **Khoảng thời gian xác nhận phủ định không ổn định trong CI:** giảm `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (mặc định 8 giây) khi CI chạy nhanh; tăng giá trị này trên các runner dùng chung chạy chậm.
- **Cần nội dung đã biên tập cho báo cáo lỗi:** chạy lại với `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` và đính kèm `matrix-qa-observed-events.json`. Hãy coi hiện vật thu được là dữ liệu nhạy cảm.
- **Phiên bản Tuwunel khác:** trỏ `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` tới phiên bản đang kiểm thử. Luồng kiểm thử chỉ đưa ảnh mặc định đã ghim vào kho mã.

## Hợp đồng vận chuyển trực tiếp

Matrix là một trong ba luồng vận chuyển trực tiếp (Matrix, Telegram, Discord) dùng chung một danh sách kiểm tra hợp đồng được xác định trong [Tổng quan QA: Phạm vi bao phủ vận chuyển trực tiếp](/vi/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` vẫn là bộ kiểm thử tổng hợp rộng và được chủ ý không đưa vào ma trận đó.

## Liên quan

- [Tổng quan QA](/vi/concepts/qa-e2e-automation): toàn bộ ngăn xếp QA và hợp đồng vận chuyển trực tiếp
- [Kênh QA](/vi/channels/qa-channel): bộ điều hợp kênh tổng hợp cho các kịch bản dựa trên kho mã
- [Kiểm thử](/vi/help/testing): chạy kiểm thử và bổ sung phạm vi bao phủ QA
- [Matrix](/vi/channels/matrix): Plugin kênh đang được kiểm thử
