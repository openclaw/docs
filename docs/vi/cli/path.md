---
read_when:
    - Bạn muốn đọc hoặc ghi một nút lá bên trong tệp workspace từ terminal
    - Bạn đang viết script dựa trên trạng thái workspace và muốn một cơ chế định địa chỉ ổn định, không phụ thuộc vào loại
    - Bạn đang gỡ lỗi một đường dẫn `oc://` (xác thực cú pháp, xem nó phân giải thành gì)
summary: Tài liệu tham khảo CLI cho `openclaw path` (kiểm tra và chỉnh sửa các tệp trong không gian làm việc thông qua lược đồ định địa chỉ `oc://`)
title: Đường dẫn
x-i18n:
    generated_at: "2026-06-27T17:19:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88e560c19cf34851b0237986e15b48ad7d0e32699e2c12c559dfeecf6fcf761b
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Quyền truy cập shell do Plugin cung cấp vào nền tảng định địa chỉ `oc://`: một
lược đồ đường dẫn phân phối theo loại để kiểm tra và chỉnh sửa các tệp workspace
có thể định địa chỉ (markdown, jsonc, jsonl, yaml/yml/lobster). Người tự host,
tác giả Plugin và phần mở rộng trình soạn thảo dùng nó để đọc, tìm hoặc cập nhật
một vị trí hẹp mà không phải tự viết bộ phân tích riêng cho từng loại tệp.

CLI phản chiếu các động từ công khai của nền tảng:

- `resolve` là cụ thể và chỉ khớp một kết quả.
- `find` là động từ đa kết quả cho ký tự đại diện, hợp, vị từ và mở rộng theo vị trí.
- `set` chỉ chấp nhận đường dẫn cụ thể hoặc dấu chèn; các mẫu ký tự đại diện bị
  từ chối trước khi ghi.

`path` được cung cấp bởi Plugin tùy chọn đi kèm `oc-path`. Bật nó trước lần dùng
đầu tiên:

```bash
openclaw plugins enable oc-path
```

## Vì sao dùng nó

Trạng thái OpenClaw nằm rải rác trong markdown do con người chỉnh sửa, cấu hình
JSONC có chú thích, nhật ký JSONL chỉ ghi nối tiếp và các tệp workflow/đặc tả
YAML. Script shell, hook và agent thường cần một giá trị nhỏ từ các tệp đó: một
khóa frontmatter, một thiết lập Plugin, một trường bản ghi nhật ký, một bước YAML
hoặc một mục bullet dưới một phần có tên.

`openclaw path` cung cấp cho các caller đó một địa chỉ ổn định thay vì một lệnh
grep, regex hoặc bộ phân tích dùng một lần cho từng loại tệp. Cùng một đường dẫn
`oc://` có thể được xác thực, phân giải, tìm kiếm, chạy thử và ghi từ terminal,
giúp automation hẹp dễ review hơn và an toàn hơn khi chạy lại. Nó đặc biệt hữu
ích khi bạn muốn cập nhật một lá trong khi giữ nguyên phần còn lại của chú thích,
kiểu xuống dòng và định dạng xung quanh của tệp.

Dùng nó khi thứ bạn muốn có địa chỉ logic, nhưng hình dạng tệp vật lý khác nhau:

- Một hook muốn đọc một thiết lập từ JSONC có chú thích mà không làm mất chú thích
  khi ghi giá trị trở lại.
- Một script bảo trì muốn tìm mọi trường sự kiện khớp trong nhật ký JSONL mà không
  nạp toàn bộ nhật ký vào một bộ phân tích tùy chỉnh.
- Một phần mở rộng trình soạn thảo muốn nhảy tới một phần markdown hoặc mục bullet
  theo slug, rồi render đúng dòng đã phân giải.
- Một agent muốn chạy thử một chỉnh sửa workspace rất nhỏ trước khi áp dụng, với
  các byte đã thay đổi hiển thị trong review.

Có thể bạn không cần `openclaw path` cho chỉnh sửa toàn bộ tệp thông thường, các
migration cấu hình phức tạp hoặc ghi dành riêng cho bộ nhớ. Những việc đó nên
dùng lệnh hoặc Plugin sở hữu. `path` dành cho các thao tác tệp nhỏ, có thể định
địa chỉ, nơi một lệnh terminal lặp lại được rõ ràng hơn một bộ phân tích tự chế
khác.

## Cách sử dụng

Đọc một giá trị từ tệp cấu hình do con người chỉnh sửa:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Xem trước một lần ghi mà không chạm vào đĩa:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Tìm các bản ghi khớp trong nhật ký JSONL chỉ ghi nối tiếp:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Định địa chỉ một chỉ dẫn trong markdown theo phần và mục thay vì theo số dòng:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Xác thực một đường dẫn trong CI hoặc script preflight trước khi script đọc hoặc ghi:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Các lệnh đó được thiết kế để có thể sao chép vào script shell. Dùng `--json` khi
caller cần đầu ra có cấu trúc và `--human` khi một người đang kiểm tra kết quả.

## Cách hoạt động

`openclaw path` làm bốn việc:

1. Phân tích địa chỉ `oc://` thành các ô: tệp, phần, mục, trường và phiên tùy chọn.
2. Chọn adapter loại tệp từ phần mở rộng đích (`.md`, `.jsonc`, `.jsonl`, `.yaml`, `.yml`, `.lobster` và các bí danh liên quan).
3. Phân giải các ô theo AST của loại tệp đó: heading/mục markdown, khóa object/chỉ mục array JSONC, bản ghi dòng JSONL hoặc nút map/sequence YAML.
4. Với `set`, phát ra các byte đã chỉnh sửa qua cùng adapter để những phần không
   chạm tới của tệp giữ nguyên chú thích, kiểu xuống dòng và định dạng lân cận ở
   nơi loại tệp hỗ trợ.

`resolve` và `set` yêu cầu một đích cụ thể. `find` là động từ thăm dò: nó mở rộng
ký tự đại diện, hợp, vị từ và số thứ tự thành các kết quả cụ thể mà bạn có thể
kiểm tra trước khi chọn một kết quả để ghi.

## Lệnh con

| Lệnh con                | Mục đích                                                                     |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | In kết quả khớp cụ thể tại đường dẫn (hoặc "không tìm thấy").                |
| `find <pattern>`        | Liệt kê kết quả khớp cho đường dẫn ký tự đại diện / hợp / vị từ.             |
| `set <oc-path> <value>` | Ghi một lá hoặc đích chèn tại đường dẫn cụ thể. Hỗ trợ `--dry-run`.          |
| `validate <oc-path>`    | Chỉ phân tích; in phần tách cấu trúc (tệp / phần / mục / trường).            |
| `emit <file>`           | Round-trip một tệp qua `parseXxx` + `emitXxx` (chẩn đoán độ trung thực byte). |

## Cờ toàn cục

| Cờ              | Mục đích                                                                 |
| --------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | Phân giải ô tệp theo thư mục này (mặc định: `process.cwd()`).            |
| `--file <path>` | Ghi đè đường dẫn đã phân giải của ô tệp (truy cập tuyệt đối).            |
| `--json`        | Ép đầu ra JSON (mặc định khi stdout không phải TTY).                     |
| `--human`       | Ép đầu ra cho con người (mặc định khi stdout là TTY).                    |
| `--dry-run`     | (chỉ trên `set`) in các byte sẽ được ghi mà không ghi.                   |
| `--diff`        | (với `set --dry-run`) in diff hợp nhất thay vì toàn bộ byte.             |

## Cú pháp `oc://`

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Quy tắc ô: `field` yêu cầu `item`, và `item` yêu cầu `section`. Trên cả bốn ô:

- **Đoạn được trích dẫn** — `"a/b.c"` giữ nguyên qua các dấu phân tách `/` và `.`.
  Nội dung là byte-literal; không cho phép `"` và `\` bên trong dấu nháy.
  Ô tệp cũng nhận biết dấu nháy: `oc://"skills/email-drafter"/Tools/$last`
  xem `skills/email-drafter` là một đường dẫn tệp duy nhất.
- **Vị từ** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]`. Toán tử số yêu cầu cả hai vế ép được thành số hữu hạn.
- **Hợp** — `{a,b,c}` khớp bất kỳ lựa chọn thay thế nào.
- **Ký tự đại diện** — `*` (một phân đoạn con) và `**` (không hoặc nhiều,
  đệ quy). `find` chấp nhận các ký tự này; `resolve` và `set` từ chối vì mơ hồ.
- **Theo vị trí** — `$first` / `$last` phân giải thành chỉ mục hoặc khóa đã khai báo đầu tiên / cuối cùng.
- **Số thứ tự** — `#N` cho kết quả khớp thứ N theo thứ tự tài liệu.
- **Dấu chèn** — `+`, `+key`, `+nnn` cho thao tác chèn theo khóa / theo chỉ mục
  (dùng với `set`).
- **Phạm vi phiên** — `?session=cron-daily` v.v. Độc lập với lồng ô.
  Giá trị phiên là dạng thô, không được giải mã phần trăm; chúng không được chứa
  ký tự điều khiển hoặc dấu phân tách truy vấn dành riêng (`?`, `&`, `%`).

Các ký tự dành riêng (`?`, `&`, `%`) bên ngoài các đoạn được trích dẫn, vị từ
hoặc hợp sẽ bị từ chối. Ký tự điều khiển (U+0000-U+001F, U+007F) bị từ chối ở
mọi nơi, bao gồm giá trị truy vấn `session`.

`formatOcPath(parseOcPath(path)) === path` được bảo đảm cho đường dẫn chuẩn.
Các tham số truy vấn không chuẩn bị bỏ qua, ngoại trừ giá trị `session=` không
rỗng đầu tiên.

## Định địa chỉ theo loại tệp

| Loại              | Mô hình định địa chỉ                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| Markdown          | Phần H2 theo slug, mục bullet theo slug hoặc `#N`, frontmatter qua `[frontmatter]`.              |
| JSONC/JSON        | Khóa object và chỉ mục array; dấu chấm tách các phân đoạn con lồng nhau trừ khi được trích dẫn. |
| JSONL             | Địa chỉ dòng cấp cao nhất (`L1`, `L2`, `$first`, `$last`), rồi đi xuống kiểu JSONC trong dòng.  |
| YAML/YML/.lobster | Khóa map và chỉ mục sequence; chú thích và flow style được xử lý bởi API tài liệu YAML.          |

`resolve` trả về một kết quả khớp có cấu trúc: `root`, `node`, `leaf` hoặc
`insertion-point`, với số dòng bắt đầu từ 1. Giá trị lá được hiển thị dưới dạng
văn bản cộng với `leafType` để tác giả Plugin có thể render bản xem trước mà
không phụ thuộc vào hình dạng AST theo từng loại.

## Hợp đồng mutation

`set` ghi một đích cụ thể:

- Giá trị frontmatter markdown và trường mục `- key: value` là lá chuỗi.
  Các thao tác chèn markdown thêm phần, khóa frontmatter hoặc mục trong phần và
  render một hình dạng markdown chuẩn cho tệp đã thay đổi.
- Ghi lá JSONC ép giá trị chuỗi sang kiểu lá hiện có (`string`, `number` hữu hạn,
  `true`/`false` hoặc `null`). Dùng `--value-json` khi thay thế lá JSONC/JSON/JSONL
  nên phân tích `<value>` dưới dạng JSON và có thể đổi hình dạng, chẳng hạn thay
  một shorthand SecretRef dạng chuỗi bằng một object. Thao tác chèn object và
  array JSONC phân tích `<value>` dưới dạng JSON và dùng đường chỉnh sửa
  `jsonc-parser` cho các lần ghi lá thông thường, giữ lại chú thích và định dạng
  lân cận.
- Ghi lá JSONL ép kiểu như JSONC bên trong một dòng. Thay thế cả dòng và ghi nối
  tiếp phân tích `<value>` dưới dạng JSON. JSONL đã render giữ nguyên quy ước kết
  thúc dòng LF/CRLF chiếm ưu thế của tệp.
- Ghi lá YAML ép sang kiểu scalar hiện có (`string`, `number` hữu hạn,
  `true`/`false` hoặc `null`). Thao tác chèn YAML dùng API tài liệu của gói
  `yaml` đi kèm cho cập nhật map/sequence. Tài liệu YAML sai định dạng có lỗi
  parser bị từ chối trước mutation với `parse-error`.

Dùng `--dry-run` trước các lần ghi hiển thị với người dùng khi byte chính xác là
quan trọng. Nền tảng giữ đầu ra giống hệt từng byte cho round-trip parse/emit,
nhưng một mutation có thể chuẩn hóa vùng hoặc tệp đã chỉnh sửa tùy theo loại.
Thêm `--diff` khi bạn muốn bản xem trước là một patch trước/sau tập trung thay vì
toàn bộ tệp đã render.

## Ví dụ

```bash
# Validate a path (no filesystem access)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Read a leaf
openclaw path resolve 'oc://gateway.jsonc/version'

# Wildcard search
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Dry-run a write
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Dry-run a write as a unified diff
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

Thêm ví dụ ngữ pháp:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Deep JSON/JSONC paths can use slash segments; they normalize to dotted subsegments
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Replace a JSONC leaf with a parsed object
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# Predicate search over JSONC children
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Insert into a JSONC array
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Insert a JSONC object key
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Append a JSONL event
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Resolve the last JSONL value line
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Resolve a YAML workflow step
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Update a YAML scalar
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# Address markdown frontmatter
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insert markdown frontmatter
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Find markdown item fields
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Validate a session-scoped path
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## Công thức theo loại tệp

Cùng năm động từ hoạt động trên mọi loại; lược đồ định địa chỉ sẽ phân phối theo
phần mở rộng tệp. Các ví dụ bên dưới dùng fixture từ phần mô tả PR.

### Markdown

```text
<!-- frontmatter.md -->
---
name: drafter
description: email drafting agent
tier: core
---
## Tools
- gh: GitHub CLI
- curl: HTTP client
- send_email: enabled
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
leaf @ L4: "core" (string)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
leaf @ L9: "GitHub CLI" (string)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 matches for oc://x.md/tools/*:
  oc://x.md/tools/gh           →  node @ L9 [md-item]
  oc://x.md/tools/curl         →  node @ L10 [md-item]
  oc://x.md/tools/send-email   →  node @ L11 [md-item]
```

Vị từ `[frontmatter]` trỏ tới khối YAML frontmatter; `tools`
khớp với tiêu đề `## Tools` thông qua slug, và các lá mục giữ dạng slug của chúng
ngay cả khi nguồn dùng dấu gạch dưới (`send_email` → `send-email`).

### JSONC

```text
// config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": false, "role": "chat"}
  }
}
```

```bash
$ openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --file config.jsonc --human
leaf @ L4: "true" (boolean)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: would write 142 bytes to /…/config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

Các chỉnh sửa JSONC đi qua `jsonc-parser`, nên chú thích và khoảng trắng vẫn được giữ sau một
lệnh `set`. Trước tiên hãy chạy với `--dry-run` để kiểm tra các byte trước khi ghi.

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
1 match for oc://session.jsonl/[event=action]/userId:
  oc://session.jsonl/L2/userId  →  leaf @ L2: "u1" (string)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
leaf @ L2: "2" (number)
```

Mỗi dòng là một bản ghi. Định địa chỉ bằng vị từ (`[event=action]`) khi bạn không
biết số dòng, hoặc bằng phân đoạn `LN` chính tắc khi bạn biết.

### YAML

```text
# workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify
    command: openclaw.invoke
```

```bash
$ openclaw path resolve 'oc://workflow.yaml/steps/0/id' --file workflow.yaml --human
leaf @ L3: "fetch" (string)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: would write 99 bytes to /…/workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

YAML dùng API `Document` của gói `yaml` thay vì một bộ phân tích cú pháp tự viết,
nên các vòng phân tích/xuất thông thường sẽ giữ chú thích và hình dạng soạn thảo, trong khi
các đường dẫn đã phân giải dùng cùng mô hình khóa bản đồ / chỉ mục chuỗi như JSONC. Cùng một
adapter xử lý các tệp `.yaml`, `.yml`, và `.lobster`.

## Tham chiếu lệnh con

### `resolve <oc-path>`

Đọc một lá hoặc nút duy nhất. Ký tự đại diện bị từ chối — hãy dùng `find` cho chúng.
Thoát `0` khi có kết quả khớp, `1` khi không khớp một cách hợp lệ, `2` khi có lỗi phân tích cú pháp hoặc mẫu bị từ chối.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Liệt kê mọi kết quả khớp cho mẫu ký tự đại diện / vị từ / hợp. Thoát `0`
khi có ít nhất một kết quả khớp, `1` khi không có. Ký tự đại diện ở vị trí tệp bị từ chối với
`OC_PATH_FILE_WILDCARD_UNSUPPORTED` — hãy truyền một tệp cụ thể (globbing nhiều tệp
là tính năng tiếp theo).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Ghi một lá. Dùng cùng `--dry-run` để xem trước các byte sẽ được
ghi mà không chạm vào tệp. Thêm `--diff` để xem trước unified diff.
Thoát `0` khi ghi thành công, `1` nếu tầng nền từ chối (ví dụ: chạm
cơ chế bảo vệ sentinel), `2` khi có lỗi phân tích cú pháp.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

Dấu chèn `+key` tạo phần tử con có tên nếu nó chưa
tồn tại; `+nnn` và `+` trần lần lượt dùng cho chèn theo chỉ mục và chèn nối thêm.

### `validate <oc-path>`

Kiểm tra chỉ phân tích cú pháp. Không truy cập hệ thống tệp. Hữu ích khi bạn muốn xác nhận
một đường dẫn mẫu là đúng định dạng trước khi thay biến, hoặc khi bạn muốn
phân rã cấu trúc để gỡ lỗi:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Thoát `0` khi hợp lệ, `1` khi không hợp lệ (với `code` và
`message` có cấu trúc), `2` khi có lỗi đối số.

### `emit <file>`

Đưa một tệp đi vòng qua bộ phân tích và bộ phát theo từng loại. Đầu ra phải
giống từng byte với đầu vào trên một tệp hợp lệ — sai khác cho thấy
lỗi bộ phân tích cú pháp hoặc chạm sentinel. Hữu ích để gỡ lỗi hành vi tầng nền trên
đầu vào thực tế.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Mã thoát

| Mã | Ý nghĩa                                                                    |
| ---- | -------------------------------------------------------------------------- |
| `0`  | Thành công. (`resolve` / `find`: ít nhất một kết quả khớp. `set`: ghi thành công.) |
| `1`  | Không khớp, hoặc `set` bị tầng nền từ chối (không phải lỗi cấp hệ thống).      |
| `2`  | Lỗi đối số hoặc phân tích cú pháp.                                                   |

## Chế độ đầu ra

`openclaw path` nhận biết TTY: xuất dạng dễ đọc cho người trên terminal, JSON khi
stdout được pipe hoặc chuyển hướng. `--json` và `--human` ghi đè
tự động phát hiện.

## Ghi chú

- `set` ghi byte thông qua đường phát của tầng nền, nơi tự động áp dụng
  cơ chế bảo vệ sentinel che dữ liệu. Một lá mang
  `__OPENCLAW_REDACTED__` (nguyên văn hoặc là chuỗi con) sẽ bị từ chối tại thời điểm ghi.
- Phân tích JSONC và chỉnh sửa lá dùng phụ thuộc `jsonc-parser`
  cục bộ của Plugin, nên chú thích và định dạng được giữ nguyên khi ghi lá thông thường
  thay vì đi qua đường phân tích/tái kết xuất tự viết.
- `path` không biết về LKG. Nếu tệp được LKG theo dõi, lần gọi
  observe tiếp theo sẽ quyết định có promote / recover hay không. `set --batch` cho
  multi-set nguyên tử thông qua vòng đời promote/recover của LKG được lên kế hoạch
  cùng với tầng nền khôi phục LKG.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
