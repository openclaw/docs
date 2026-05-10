---
read_when:
    - Bạn muốn kiểm tra hoặc chỉnh sửa một nút lá duy nhất trong tệp không gian làm việc từ terminal
    - Bạn đang viết script dựa trên trạng thái không gian làm việc và cần một lược đồ định địa chỉ ổn định, không phụ thuộc vào loại
    - Bạn đang quyết định có bật Plugin `oc-path` tùy chọn trên Gateway tự lưu trữ hay không
summary: 'Plugin `oc-path` đi kèm: cung cấp CLI `openclaw path` cho lược đồ định địa chỉ tệp không gian làm việc `oc://`'
title: Plugin OC Path
x-i18n:
    generated_at: "2026-05-10T19:43:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d9d34094ebfa5850266b33d6a4f443e631fb207e519c1cf5fccfb735c200a0
    source_path: plugins/oc-path.md
    workflow: 16
---

Plugin `oc-path` đi kèm bổ sung CLI [`openclaw path`](/vi/cli/path) cho cơ chế
định địa chỉ tệp workspace `oc://`. Nó được phân phối trong repo OpenClaw tại
`extensions/oc-path/` nhưng là tùy chọn — quá trình cài đặt/build để nó ở trạng
thái không hoạt động cho đến khi bạn bật nó.

Địa chỉ `oc://` trỏ tới một lá đơn lẻ (hoặc một tập lá theo ký tự đại diện) bên
trong một tệp workspace. Hiện nay Plugin hiểu ba loại tệp:

- **markdown** (`.md`, `.mdx`): frontmatter, section, item, field
- **jsonc** (`.jsonc`, `.json5`, `.json`): giữ nguyên comment và định dạng
- **jsonl** (`.jsonl`, `.ndjson`): bản ghi theo từng dòng

Người tự host và tiện ích mở rộng trình soạn thảo dùng CLI để đọc hoặc ghi một
lá đơn lẻ mà không cần script trực tiếp với SDK; agent và hook xem nó là một nền
tảng xác định để các vòng khứ hồi giữ nguyên byte và lớp bảo vệ sentinel che
dữ liệu áp dụng thống nhất trên mọi loại.

## Vì sao nên bật nó

Bật `oc-path` khi bạn muốn script, hook hoặc công cụ agent cục bộ trỏ tới một
phần chính xác của trạng thái workspace mà không phải tự tạo parser cho từng
dạng tệp. Một địa chỉ `oc://` duy nhất có thể đặt tên cho một khóa frontmatter
Markdown, một item trong section, một lá cấu hình JSONC, hoặc một field sự kiện
JSONL.

Điều đó quan trọng với các workflow của maintainer, nơi thay đổi cần nhỏ, dễ
kiểm tra và lặp lại được: xem một giá trị, tìm các bản ghi khớp, dry-run một
thao tác ghi, rồi chỉ áp dụng lá đó trong khi giữ nguyên comment, kết thúc dòng
và định dạng lân cận. Việc giữ chức năng này là một Plugin tùy chọn cung cấp
nền tảng định địa chỉ cho người dùng nâng cao mà không đưa dependency parser
hoặc bề mặt CLI vào core cho các bản cài đặt không bao giờ cần đến nó.

Các lý do thường gặp để bật nó:

- **Tự động hóa cục bộ**: shell script có thể resolve hoặc cập nhật một giá trị
  workspace bằng `openclaw path … --json` thay vì mang theo mã phân tích
  Markdown, JSONC và JSONL riêng.
- **Chỉnh sửa agent thấy được**: agent có thể hiển thị diff dry-run cho một lá
  đã định địa chỉ trước khi ghi, dễ review hơn so với việc ghi lại tệp dạng tự do.
- **Tích hợp trình soạn thảo**: trình soạn thảo có thể ánh xạ
  `oc://AGENTS.md/tools/gh` tới đúng node Markdown và số dòng mà không phải
  đoán từ văn bản heading.
- **Chẩn đoán**: `emit` đưa một tệp qua parser rồi emitter theo vòng khứ hồi, để
  bạn có thể kiểm tra liệu một loại tệp có ổn định theo byte hay không trước khi
  dựa vào các chỉnh sửa tự động.

Ví dụ cụ thể:

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Plugin này cố ý không sở hữu các ngữ nghĩa cấp cao hơn. Các Plugin bộ nhớ vẫn
sở hữu thao tác ghi bộ nhớ, các lệnh cấu hình vẫn sở hữu việc quản lý cấu hình
đầy đủ, và logic LKG vẫn sở hữu restore/promotion. `oc-path` là lớp thao tác
tệp hẹp để định địa chỉ và giữ nguyên byte mà các công cụ cấp cao hơn có thể
xây dựng xung quanh.

## Nó chạy ở đâu

Plugin chạy **trong cùng tiến trình bên trong CLI `openclaw`** trên host nơi bạn
gọi lệnh. Nó không cần Gateway đang chạy và không mở socket mạng nào — mọi verb
đều là phép biến đổi thuần trên một tệp bạn chỉ tới.

Metadata của Plugin nằm trong `extensions/oc-path/openclaw.plugin.json`:

```json
{
  "id": "oc-path",
  "name": "OC Path",
  "activation": {
    "onStartup": false,
    "onCommands": ["path"]
  },
  "commandAliases": [{ "name": "path", "kind": "cli" }]
}
```

`onStartup: false` giữ Plugin ngoài hot path của Gateway. `onCommands:
["path"]` cho CLI biết cần lazy-load Plugin vào lần đầu bạn chạy
`openclaw path …`, nên các bản cài đặt không dùng verb này sẽ không chịu chi phí.

## Bật

```bash
openclaw plugins enable oc-path
```

Khởi động lại Gateway (nếu bạn chạy một Gateway) để snapshot manifest nhận
trạng thái mới. Các lần gọi `openclaw path` thuần hoạt động ngay trên cùng host
— CLI tải Plugin theo nhu cầu.

Tắt bằng:

```bash
openclaw plugins disable oc-path
```

## Dependency

Mọi dependency parser đều nằm cục bộ trong Plugin — bật `oc-path` không kéo gói
mới vào runtime core:

| Dependency     | Mục đích                                                            |
| -------------- | ------------------------------------------------------------------- |
| `commander`    | Nối subcommand cho `resolve`, `find`, `set`, `validate`, `emit`.     |
| `jsonc-parser` | Parse JSONC + chỉnh sửa lá trong khi giữ comment và dấu phẩy cuối.  |
| `markdown-it`  | Token hóa Markdown cho mô hình section / item / field.              |

JSONL vẫn được viết thủ công — phân tích theo từng dòng đơn giản hơn bất kỳ
dependency nào, và parse JSONC theo từng dòng đã đi qua `jsonc-parser`.

## Nó cung cấp gì

| Bề mặt                        | Được cung cấp bởi                                      |
| ----------------------------- | ----------------------------------------------------- |
| CLI `openclaw path`           | `extensions/oc-path/cli-registration.ts`              |
| Parser / formatter `oc://`    | `extensions/oc-path/src/oc-path/oc-path.ts`           |
| Parse / emit / edit theo loại | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl}`     |
| Resolve / find / set chung    | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Bảo vệ redaction-sentinel     | `extensions/oc-path/src/oc-path/sentinel.ts`          |

CLI hiện là bề mặt công khai duy nhất. Các verb nền tảng là private trong
Plugin; consumer dùng CLI (hoặc tự xây Plugin của họ dựa trên SDK).

## Quan hệ với các Plugin khác

- **`memory-*`**: thao tác ghi bộ nhớ đi qua các Plugin bộ nhớ, không qua
  `oc-path`. `oc-path` là nền tảng tệp chung; các Plugin bộ nhớ đặt ngữ nghĩa
  riêng của chúng lên trên.
- **LKG**: `path` không biết về restore cấu hình Last-Known-Good. Nếu một tệp
  được LKG theo dõi, lần gọi `observe` tiếp theo quyết định promote hay recover;
  `set --batch` cho multi-set nguyên tử qua vòng đời promote/recover của LKG
  được lên kế hoạch cùng với nền tảng LKG-recovery.

## An toàn

`set` ghi byte thô qua đường emit của nền tảng, nơi tự động áp dụng lớp bảo vệ
redaction-sentinel. Một lá mang `__OPENCLAW_REDACTED__` (nguyên văn hoặc là
chuỗi con) bị từ chối khi ghi với `OC_EMIT_SENTINEL`. CLI cũng xóa sentinel
nguyên văn khỏi mọi output cho người đọc hoặc JSON mà nó in ra, thay bằng
`[REDACTED]` để các bản ghi terminal và pipeline không bao giờ rò rỉ marker.

## Liên quan

- [Tham chiếu CLI `openclaw path`](/vi/cli/path)
- [Quản lý Plugin](/vi/plugins/manage-plugins)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
