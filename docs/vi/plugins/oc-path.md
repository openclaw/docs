---
read_when:
    - Bạn muốn kiểm tra hoặc chỉnh sửa một mục lá đơn lẻ bên trong tệp workspace từ terminal
    - Bạn đang viết script dựa trên trạng thái không gian làm việc và cần một lược đồ định địa chỉ ổn định, không phụ thuộc vào loại.
    - Bạn đang quyết định có bật plugin `oc-path` tùy chọn trên Gateway tự lưu trữ hay không
summary: 'Plugin `oc-path` được đóng gói kèm: cung cấp CLI `openclaw path` cho cơ chế định địa chỉ tệp trong workspace `oc://`'
title: Plugin OC Path
x-i18n:
    generated_at: "2026-06-27T17:48:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: afb8ab86d04ef783986d05203f2c06b9cb718ad44ec31c797159ed49d9e1d5e3
    source_path: plugins/oc-path.md
    workflow: 16
---

Plugin `oc-path` đi kèm bổ sung CLI [`openclaw path`](/vi/cli/path) cho
cơ chế định địa chỉ tệp không gian làm việc `oc://`. Nó được phát hành trong repo OpenClaw tại
`extensions/oc-path/` nhưng là tùy chọn — quá trình cài đặt/xây dựng để nó ở trạng thái không hoạt động cho đến khi bạn
bật nó.

Địa chỉ `oc://` trỏ đến một nút lá duy nhất (hoặc một tập hợp nút lá theo ký tự đại diện) bên trong
một tệp không gian làm việc. Hiện tại Plugin hiểu bốn loại tệp:

- **markdown** (`.md`, `.mdx`): frontmatter, phần, mục, trường
- **jsonc** (`.jsonc`, `.json5`, `.json`): giữ nguyên chú thích và định dạng
- **jsonl** (`.jsonl`, `.ndjson`): bản ghi theo từng dòng
- **yaml** (`.yaml`, `.yml`, `.lobster`): nút ánh xạ/chuỗi/vô hướng thông qua
  API tài liệu YAML

Người tự lưu trữ và tiện ích mở rộng trình biên tập dùng CLI để đọc hoặc ghi một nút lá duy nhất
mà không cần viết script trực tiếp với SDK; agent và hook xem nó như một
nền tảng xác định để các vòng lặp khứ hồi giữ nguyên từng byte và cơ chế bảo vệ sentinel
biên tập lại được áp dụng thống nhất trên mọi loại.

## Vì sao nên bật

Bật `oc-path` khi bạn muốn script, hook hoặc công cụ agent cục bộ trỏ
đến một phần chính xác của trạng thái không gian làm việc mà không phải tự tạo parser cho từng
dạng tệp. Một địa chỉ `oc://` duy nhất có thể đặt tên cho một khóa frontmatter markdown, một mục
trong phần, một nút lá cấu hình JSONC, một trường sự kiện JSONL, hoặc một bước workflow YAML.

Điều đó quan trọng với workflow của maintainer, nơi thay đổi cần nhỏ,
dễ kiểm tra và có thể lặp lại: kiểm tra một giá trị, tìm bản ghi khớp, chạy thử
một thao tác ghi, rồi chỉ áp dụng nút lá đó trong khi giữ nguyên chú thích, kết thúc dòng và
định dạng lân cận. Giữ tính năng này dưới dạng Plugin tùy chọn cung cấp cho người dùng nâng cao
nền tảng định địa chỉ mà không đưa dependency parser hoặc bề mặt CLI vào
core cho các bản cài đặt không bao giờ cần đến nó.

Các lý do phổ biến để bật:

- **Tự động hóa cục bộ**: script shell có thể phân giải hoặc cập nhật một giá trị không gian làm việc
  bằng `openclaw path … --json` thay vì mang theo mã phân tích markdown, JSONC,
  JSONL và YAML riêng biệt.
- **Chỉnh sửa hiển thị với agent**: agent có thể hiển thị diff chạy thử cho một nút lá
  đã được định địa chỉ trước khi ghi, giúp dễ review hơn so với viết lại tệp tự do.
- **Tích hợp trình biên tập**: trình biên tập có thể ánh xạ `oc://AGENTS.md/tools/gh` đến
  đúng nút markdown và số dòng mà không phải đoán từ văn bản tiêu đề.
- **Chẩn đoán**: `emit` cho tệp đi vòng qua parser và emitter, để
  bạn có thể kiểm tra một loại tệp có ổn định theo byte hay không trước khi dựa vào các
  chỉnh sửa tự động.

Ví dụ cụ thể:

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Plugin này cố ý không sở hữu ngữ nghĩa cấp cao hơn. Các Plugin bộ nhớ
vẫn sở hữu thao tác ghi bộ nhớ, lệnh cấu hình vẫn sở hữu quản lý cấu hình
đầy đủ, và logic LKG vẫn sở hữu khôi phục/thăng cấp. `oc-path` là lớp
định địa chỉ hẹp và thao tác tệp giữ nguyên byte để các công cụ cấp cao hơn
có thể xây dựng xung quanh.

## Nơi nó chạy

Plugin chạy **trong cùng tiến trình bên trong CLI `openclaw`** trên máy chủ nơi bạn
gọi lệnh. Nó không cần Gateway đang chạy và không mở bất kỳ
socket mạng nào — mọi động từ đều là phép biến đổi thuần túy trên một tệp bạn chỉ định.

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

`onStartup: false` giữ Plugin ngoài đường nóng của Gateway. `onCommands:
["path"]` cho CLI biết cần tải Plugin một cách lười biếng vào lần đầu bạn chạy
`openclaw path …`, nên các bản cài đặt không bao giờ dùng động từ này sẽ không tốn chi phí.

## Bật

```bash
openclaw plugins enable oc-path
```

Khởi động lại Gateway (nếu bạn chạy một Gateway) để snapshot manifest nhận trạng thái
mới. Các lệnh gọi `openclaw path` trần hoạt động ngay trên cùng máy chủ —
CLI tải Plugin theo nhu cầu.

Tắt bằng:

```bash
openclaw plugins disable oc-path
```

## Dependency

Tất cả dependency parser đều cục bộ trong Plugin — bật `oc-path` không kéo
gói mới vào runtime core:

| Dependency     | Mục đích                                                               |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | Nối dây lệnh con cho `resolve`, `find`, `set`, `validate`, `emit`.     |
| `jsonc-parser` | Phân tích JSONC + chỉnh sửa nút lá trong khi giữ chú thích và dấu phẩy cuối. |
| `markdown-it`  | Token hóa Markdown cho mô hình phần / mục / trường.                    |
| `yaml`         | Phân tích / phát / chỉnh sửa `Document` YAML trong khi giữ chú thích và kiểu flow. |

JSONL vẫn được tự xử lý — phân tích theo từng dòng đơn giản hơn bất kỳ
dependency nào, và thao tác phân tích JSONC theo từng dòng đã đi qua `jsonc-parser`.

## Nó cung cấp gì

| Bề mặt                        | Được cung cấp bởi                                      |
| ----------------------------- | ------------------------------------------------------ |
| CLI `openclaw path`           | `extensions/oc-path/cli-registration.ts`               |
| Parser / formatter `oc://`    | `extensions/oc-path/src/oc-path/oc-path.ts`            |
| Phân tích / phát / chỉnh sửa theo từng loại | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}` |
| Resolve / find / set phổ dụng | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Bảo vệ sentinel biên tập lại  | `extensions/oc-path/src/oc-path/sentinel.ts`           |

CLI là bề mặt công khai duy nhất hiện nay. Các động từ nền tảng là riêng tư với
Plugin; người tiêu dùng dùng CLI (hoặc tự xây Plugin của họ dựa trên SDK).

## Quan hệ với các Plugin khác

- **`memory-*`**: thao tác ghi bộ nhớ đi qua các Plugin bộ nhớ, không qua `oc-path`.
  `oc-path` là nền tảng tệp chung; các Plugin bộ nhớ đặt ngữ nghĩa riêng của chúng
  lên trên.
- **LKG**: `path` không biết về khôi phục cấu hình Last-Known-Good. Nếu một
  tệp được LKG theo dõi, lệnh gọi `observe` tiếp theo quyết định có thăng cấp hay
  khôi phục hay không; `set --batch` cho multi-set nguyên tử đi qua vòng đời thăng cấp/khôi phục
  của LKG được lên kế hoạch cùng với nền tảng khôi phục LKG.

## An toàn

`set` ghi byte thô thông qua đường phát của nền tảng, đường này tự động áp dụng
cơ chế bảo vệ sentinel biên tập lại. Một nút lá mang
`__OPENCLAW_REDACTED__` (nguyên văn hoặc như một chuỗi con) sẽ bị từ chối tại thời điểm ghi
với `OC_EMIT_SENTINEL`. CLI cũng loại bỏ sentinel nguyên văn khỏi mọi
đầu ra cho người đọc hoặc JSON mà nó in ra, thay bằng `[REDACTED]` để bản ghi
terminal và pipeline không bao giờ rò rỉ marker này.

## Liên quan

- [Tham chiếu CLI `openclaw path`](/vi/cli/path)
- [Quản lý Plugin](/vi/plugins/manage-plugins)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
