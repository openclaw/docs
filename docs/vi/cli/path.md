---
read_when:
    - Bạn muốn đọc hoặc ghi một nút lá trong tệp không gian làm việc từ terminal
    - Bạn đang viết tập lệnh tương tác với trạng thái không gian làm việc và muốn một cơ chế định địa ổn định, không phụ thuộc vào loại đối tượng
    - Bạn đang gỡ lỗi một đường dẫn `oc://` (xác thực cú pháp, xem đường dẫn đó được phân giải thành gì)
summary: Tài liệu tham khảo CLI cho `openclaw path` (kiểm tra và chỉnh sửa các tệp trong không gian làm việc thông qua cơ chế định địa chỉ `oc://`)
title: Đường dẫn
x-i18n:
    generated_at: "2026-07-12T07:51:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7afe5bd1c3a5fca8dd22c7d807e390e751ae7e895c54bf0e10e2734f3889436c
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Truy cập shell vào cơ chế định địa chỉ `oc://`: một cú pháp đường dẫn duy nhất được điều phối theo loại để kiểm tra và chỉnh sửa các tệp không gian làm việc có thể định địa chỉ (markdown, jsonc, jsonl, yaml/yml/lobster). Người tự lưu trữ, tác giả plugin và tiện ích mở rộng trình soạn thảo dùng cú pháp này để đọc, tìm hoặc cập nhật một vị trí hẹp mà không phải tự viết trình phân tích cú pháp riêng cho từng loại tệp.

`path` được cung cấp bởi plugin tùy chọn `oc-path` đi kèm. Hãy bật plugin này trước lần sử dụng đầu tiên:

```bash
openclaw plugins enable oc-path
```

Các động từ CLI phản ánh mô hình định địa chỉ:

- `resolve` dành cho đường dẫn cụ thể và chỉ khớp một kết quả.
- `find` là động từ cho nhiều kết quả khớp, dùng với ký tự đại diện, hợp, vị từ và mở rộng theo vị trí.
- `set` chỉ chấp nhận đường dẫn cụ thể hoặc dấu chèn; các mẫu ký tự đại diện bị từ chối trước khi ghi.
- `validate` phân tích một đường dẫn mà không truy cập hệ thống tệp.
- `emit` đưa một tệp qua chu trình phân tích + xuất lại (chẩn đoán độ trung thực theo byte).

## Tại sao nên sử dụng

Trạng thái OpenClaw được phân bố trong các tệp markdown do con người chỉnh sửa, cấu hình JSONC có chú thích, nhật ký JSONL chỉ nối thêm và các tệp quy trình công việc/đặc tả YAML. Script, hook và tác tử thường chỉ cần một giá trị nhỏ từ những tệp đó: một khóa frontmatter, một thiết lập plugin, một trường bản ghi nhật ký, một bước YAML hoặc một mục dấu đầu dòng trong phần có tên.

`openclaw path` cung cấp cho các bên gọi một địa chỉ ổn định thay vì phải dùng grep, biểu thức chính quy hoặc trình phân tích cú pháp dùng một lần cho từng loại tệp. Cùng một đường dẫn `oc://` có thể được xác thực, phân giải, tìm kiếm, chạy thử và ghi từ terminal, giúp hoạt động tự động hóa phạm vi hẹp dễ xem xét và tái hiện. Công cụ giữ nguyên phần còn lại của tệp, nên việc ghi một nút lá không làm xáo trộn chú thích, kiểu xuống dòng hoặc định dạng lân cận.

Hãy dùng công cụ này khi đối tượng bạn muốn có địa chỉ logic nhưng hình dạng tệp có thể khác nhau:

- Một hook đọc một thiết lập từ JSONC có chú thích mà không làm mất chú thích khi ghi giá trị trở lại.
- Một script bảo trì tìm mọi trường sự kiện khớp trong nhật ký JSONL mà không cần tải toàn bộ nhật ký vào trình phân tích cú pháp tùy chỉnh.
- Một trình soạn thảo chuyển đến phần markdown hoặc mục dấu đầu dòng theo slug, rồi hiển thị chính xác dòng đã phân giải.
- Một tác tử chạy thử một chỉnh sửa nhỏ trong không gian làm việc trước khi áp dụng, với các byte thay đổi hiển thị rõ khi xem xét.

Không dùng `openclaw path` cho các chỉnh sửa toàn bộ tệp thông thường, quá trình di chuyển cấu hình phức tạp hoặc thao tác ghi dành riêng cho bộ nhớ; những trường hợp đó nên dùng lệnh hoặc plugin của thành phần sở hữu. `path` dành cho các thao tác nhỏ trên tệp có thể định địa chỉ, khi một lệnh terminal có thể lặp lại hiệu quả hơn việc viết thêm một trình phân tích cú pháp riêng biệt.

## Cách sử dụng

Đọc một giá trị từ tệp cấu hình do con người chỉnh sửa:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Xem trước thao tác ghi mà không chạm vào đĩa:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Tìm các bản ghi khớp trong nhật ký JSONL chỉ nối thêm:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Định địa chỉ một chỉ dẫn trong markdown theo phần và mục thay vì theo số dòng:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Xác thực một đường dẫn trong CI hoặc script kiểm tra sơ bộ trước khi script đọc hoặc ghi:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Các lệnh này được thiết kế để có thể sao chép vào script shell. Dùng `--json` khi bên gọi cần đầu ra có cấu trúc và `--human` khi một người đang kiểm tra kết quả.

## Cách hoạt động

1. Phân tích địa chỉ `oc://` thành các vị trí: tệp, phần, mục, trường và một truy vấn phiên tùy chọn.
2. Chọn bộ điều hợp loại tệp theo phần mở rộng đích (`.md`, `.jsonc`, `.json`, `.jsonl`, `.ndjson`, `.yaml`, `.yml`, `.lobster`).
3. Phân giải các vị trí dựa trên cấu trúc của loại tệp đó: tiêu đề/mục markdown, khóa đối tượng/chỉ mục mảng JSONC, bản ghi dòng JSONL hoặc nút ánh xạ/chuỗi YAML.
4. Với `set`, xuất các byte đã chỉnh sửa qua cùng bộ điều hợp để những phần không bị tác động trong tệp giữ nguyên chú thích, kiểu xuống dòng và định dạng lân cận khi loại tệp hỗ trợ.

`resolve` và `set` yêu cầu một đích cụ thể. `find` là động từ thăm dò: nó mở rộng ký tự đại diện, hợp, vị từ và số thứ tự thành các kết quả khớp cụ thể mà bạn có thể kiểm tra trước khi chọn một kết quả để ghi.

## Lệnh con

| Lệnh con                | Mục đích                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| `resolve <oc-path>`     | In kết quả khớp cụ thể tại đường dẫn (hoặc "không tìm thấy").                              |
| `find <pattern>`        | Liệt kê kết quả khớp cho đường dẫn có ký tự đại diện / hợp / vị từ.                         |
| `set <oc-path> <value>` | Ghi một nút lá hoặc đích chèn tại đường dẫn cụ thể. Hỗ trợ `--dry-run`.                     |
| `validate <oc-path>`    | Chỉ phân tích; in cấu trúc phân rã (tệp / phần / mục / trường).                             |
| `emit <file>`           | Đưa tệp qua chu trình phân tích + xuất lại (chẩn đoán độ trung thực theo byte).             |

## Cờ toàn cục

| Cờ              | Áp dụng cho                       | Mục đích                                                                            |
| --------------- | --------------------------------- | ----------------------------------------------------------------------------------- |
| `--cwd <dir>`   | `resolve`, `find`, `set`, `emit`  | Phân giải vị trí tệp theo thư mục này (mặc định: `process.cwd()`).                   |
| `--file <path>` | `resolve`, `find`, `set`, `emit`  | Ghi đè đường dẫn đã phân giải của vị trí tệp (truy cập tuyệt đối).                   |
| `--json`        | tất cả                            | Buộc đầu ra JSON (mặc định khi stdout không phải TTY).                              |
| `--human`       | tất cả                            | Buộc đầu ra dành cho con người (mặc định khi stdout là TTY).                        |
| `--value-json`  | `set`                             | Phân tích `<value>` dưới dạng JSON để thay thế nút lá JSON/JSONC/JSONL.              |
| `--dry-run`     | `set`                             | In các byte sẽ được ghi mà không thực sự ghi.                                       |
| `--diff`        | `set` (yêu cầu `--dry-run`)       | In bản diff hợp nhất thay vì toàn bộ byte.                                           |

`validate` chỉ nhận `--json` / `--human`; lệnh này không truy cập hệ thống tệp, nên `--cwd` và `--file` không áp dụng.

## Cú pháp `oc://`

```text
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Quy tắc vị trí: `field` yêu cầu `item`, và `item` yêu cầu `section`. Trên cả bốn vị trí:

- **Phân đoạn có dấu nháy** — `"a/b.c"` không bị tách bởi dấu phân cách `/` và `.`. Nội dung được giữ nguyên theo byte; không cho phép `"` và `\` bên trong dấu nháy. Vị trí tệp cũng nhận biết dấu nháy: `oc://"skills/email-drafter"/Tools/$last` xem `skills/email-drafter` là một đường dẫn tệp duy nhất.
- **Vị từ** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`, `[k>=v]`. Các toán tử số yêu cầu cả hai vế có thể chuyển thành số hữu hạn.
- **Hợp** — `{a,b,c}` khớp với bất kỳ phương án nào.
- **Ký tự đại diện** — `*` (một phân đoạn con) và `**` (không hoặc nhiều phân đoạn, đệ quy). `find` chấp nhận các ký tự này; `resolve` và `set` từ chối vì không rõ ràng.
- **Theo vị trí** — `$first` / `$last` phân giải thành chỉ mục hoặc khóa được khai báo đầu tiên / cuối cùng.
- **Số thứ tự** — `#N` cho kết quả khớp thứ N theo thứ tự tài liệu.
- **Dấu chèn** — `+`, `+key`, `+nnn` để chèn theo khóa / chỉ mục (dùng với `set`).
- **Phạm vi phiên** — `?session=cron-daily`, v.v. Độc lập với việc lồng vị trí. Giá trị phiên là dữ liệu thô, không được giải mã phần trăm; không được chứa ký tự điều khiển hoặc dấu phân cách truy vấn dành riêng (`?`, `&`, `%`).

Các ký tự dành riêng (`?`, `&`, `%`) bên ngoài phân đoạn có dấu nháy, vị từ hoặc hợp sẽ bị từ chối. Ký tự điều khiển (U+0000-U+001F, U+007F) bị từ chối ở mọi vị trí, kể cả trong giá trị truy vấn `session`.

`formatOcPath(parseOcPath(path)) === path` được bảo đảm với các đường dẫn chuẩn tắc. Các tham số truy vấn không chuẩn tắc bị bỏ qua, ngoại trừ giá trị `session=` không rỗng đầu tiên.

Giới hạn cứng: một đường dẫn tối đa 4096 byte, nhiều nhất 4 vị trí (tệp/phần/mục/trường), nhiều nhất 64 phân đoạn con được phân tách bằng dấu chấm cho mỗi vị trí và nhiều nhất 256 cấp duyệt lồng nhau đối với đường dẫn JSON sâu. Ngoài ra, mọi tệp đầu vào JSONC/JSON lớn hơn 16 MiB đều bị từ chối kèm chẩn đoán phân tích cú pháp thay vì được phân tích, với mọi động từ tải tệp đó.

## Định địa chỉ theo loại tệp

| Loại          | Phần mở rộng tệp             | Mô hình định địa chỉ                                                                                          |
| ------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Markdown      | `.md`                        | Phần H2 theo slug, mục dấu đầu dòng theo slug hoặc `#N`, frontmatter qua `[frontmatter]`.                      |
| JSONC/JSON    | `.jsonc`, `.json`            | Khóa đối tượng và chỉ mục mảng; dấu chấm tách các phân đoạn con lồng nhau trừ khi có dấu nháy.                |
| JSONL         | `.jsonl`, `.ndjson`          | Địa chỉ dòng cấp cao nhất (`L1`, `L2`, `$first`, `$last`), sau đó đi sâu theo kiểu JSONC bên trong dòng.      |
| YAML/.lobster | `.yaml`, `.yml`, `.lobster`  | Khóa ánh xạ và chỉ mục chuỗi; chú thích và kiểu luồng được xử lý bởi API tài liệu YAML.                        |

`resolve` trả về một kết quả khớp có cấu trúc: `root`, `node`, `leaf` hoặc `insertion-point`, cùng số dòng bắt đầu từ 1. Giá trị nút lá được biểu diễn dưới dạng văn bản kèm `leafType` để tác giả plugin có thể hiển thị bản xem trước mà không phụ thuộc vào hình dạng AST riêng của từng loại.

## Hợp đồng biến đổi

`set` ghi một đích cụ thể:

- Giá trị frontmatter Markdown và trường mục `- key: value` là các nút lá chuỗi. Thao tác chèn Markdown nối thêm phần, khóa frontmatter hoặc mục trong phần và kết xuất hình dạng markdown chuẩn tắc cho tệp đã thay đổi. Không thể ghi toàn bộ nội dung phần qua `set`.
- Thao tác ghi nút lá JSONC chuyển chuỗi giá trị sang kiểu hiện có của nút lá (`string`, `number` hữu hạn, `true`/`false` hoặc `null`). Dùng `--value-json` khi thao tác thay thế nút lá JSONC/JSON/JSONL cần phân tích `<value>` dưới dạng JSON và có thể thay đổi hình dạng, chẳng hạn thay thế dạng viết tắt tham chiếu bí mật bằng chuỗi bằng một đối tượng. Thao tác chèn đối tượng và mảng JSONC phân tích `<value>` dưới dạng JSON và dùng đường dẫn chỉnh sửa `jsonc-parser` cho thao tác ghi nút lá thông thường, đồng thời giữ nguyên chú thích và định dạng lân cận.
- Thao tác ghi nút lá JSONL chuyển kiểu giống JSONC bên trong một dòng. Thay thế toàn bộ dòng và nối thêm đều phân tích `<value>` dưới dạng JSON. JSONL được kết xuất giữ nguyên quy ước xuống dòng LF/CRLF chiếm ưu thế của tệp (bỏ phiếu theo đa số trên các ký tự xuống dòng của tệp, nên tệp chủ yếu dùng CRLF vẫn giữ CRLF ngay cả khi có một vài LF riêng lẻ).
- Thao tác ghi nút lá YAML chuyển sang kiểu vô hướng hiện có (`string`, `number` hữu hạn, `true`/`false` hoặc `null`). Thao tác chèn YAML dùng API tài liệu của gói `yaml` đi kèm để cập nhật ánh xạ/chuỗi. Các tài liệu YAML không hợp lệ có lỗi phân tích cú pháp bị từ chối trước khi biến đổi với `parse-error`.

Dùng `--dry-run` trước các thao tác ghi hiển thị cho người dùng khi các byte chính xác có ý nghĩa quan trọng. Các chỉnh sửa JSONC và YAML vá tài liệu hiện có (qua `jsonc-parser` hoặc API tài liệu `yaml`), nên các byte không bị tác động thường được giữ nguyên; markdown dựng lại tệp từ cấu trúc đã phân tích trong mọi lần chỉnh sửa, điều này có thể chuẩn hóa định dạng phụ bên ngoài nút lá đã thay đổi. Thêm `--diff` khi bạn muốn xem trước dưới dạng bản vá trước/sau tập trung thay vì toàn bộ tệp đã kết xuất.

## Ví dụ

```bash
# Xác thực một đường dẫn (không truy cập hệ thống tệp)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Đọc một nút lá
openclaw path resolve 'oc://gateway.jsonc/version'

# Tìm kiếm bằng ký tự đại diện
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Chạy thử thao tác ghi
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Chạy thử thao tác ghi dưới dạng bản diff hợp nhất
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Áp dụng thao tác ghi
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Chu trình phân tích-xuất lại trung thực theo byte (chẩn đoán)
openclaw path emit ./AGENTS.md
```

Các ví dụ ngữ pháp khác:

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

Năm động từ giống nhau hoạt động trên mọi loại tệp; cơ chế định địa sẽ điều phối dựa trên
phần mở rộng của tệp.

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

Vị từ `[frontmatter]` định địa khối frontmatter YAML; `tools`
khớp với tiêu đề `## Tools` thông qua slug, còn các nút lá của mục vẫn giữ dạng slug
ngay cả khi nguồn sử dụng dấu gạch dưới (`send_email` trở thành `send-email`).

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

Các chỉnh sửa JSONC đi qua `jsonc-parser`, vì vậy chú thích và khoảng trắng vẫn được giữ nguyên sau một lần
`set`. Trước tiên, hãy chạy với `--dry-run` để kiểm tra các byte trước khi ghi thay đổi.
Các tệp `.json` sử dụng cùng bộ điều hợp và đường dẫn chỉnh sửa như `.jsonc`.

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

Mỗi dòng là một bản ghi. Hãy định địa bằng vị từ (`[event=action]`) khi bạn
không biết số dòng, hoặc bằng phân đoạn `LN` chuẩn khi bạn biết.
Các tệp `.ndjson` sử dụng cùng bộ điều hợp như `.jsonl`.

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

YAML sử dụng API `Document` của gói `yaml` thay vì một
trình phân tích cú pháp tự viết, vì vậy các vòng phân tích/xuất thông thường giữ nguyên chú thích và
hình thức biên soạn, trong khi các đường dẫn đã phân giải sử dụng cùng mô hình khóa ánh xạ / chỉ mục chuỗi như
JSONC. Cùng một bộ điều hợp xử lý các tệp `.yaml`, `.yml` và `.lobster`.

## Tham chiếu lệnh con

### `resolve <oc-path>`

Đọc một nút lá hoặc nút đơn. Ký tự đại diện sẽ bị từ chối — hãy dùng `find` cho chúng.
Thoát với mã `0` khi có kết quả khớp, `1` khi không tìm thấy kết quả một cách hợp lệ, `2` khi có lỗi phân tích cú pháp hoặc
mẫu bị từ chối.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Liệt kê mọi kết quả khớp với mẫu ký tự đại diện / vị từ / hợp. Thoát với mã `0`
khi có ít nhất một kết quả khớp, `1` khi không có kết quả nào. Ký tự đại diện ở vị trí tệp bị từ chối với
`OC_PATH_FILE_WILDCARD_UNSUPPORTED` — hãy truyền một tệp cụ thể (tính năng glob
đa tệp sẽ được bổ sung sau).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Ghi một nút lá. Kết hợp với `--dry-run` để xem trước các byte sẽ được
ghi mà không thay đổi tệp. Thêm `--diff` để xem trước bản diff hợp nhất.
Thoát với mã `0` khi ghi thành công, `1` nếu tầng nền từ chối (ví dụ:
kích hoạt điều kiện bảo vệ sentinel), `2` khi có lỗi phân tích cú pháp.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

Dấu chèn `+key` tạo nút con có tên nếu nút đó chưa
tồn tại; `+nnn` và `+` đơn lần lượt dùng để chèn theo chỉ mục và chèn nối tiếp.

### `validate <oc-path>`

Chỉ kiểm tra phân tích cú pháp. Không truy cập hệ thống tệp. Hữu ích khi bạn muốn xác nhận một
đường dẫn mẫu có định dạng hợp lệ trước khi thay thế biến, hoặc khi bạn muốn
xem cấu trúc phân rã để gỡ lỗi:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Thoát với mã `0` khi hợp lệ, `1` khi không hợp lệ (kèm `code` và
`message` có cấu trúc), `2` khi có lỗi đối số.

### `emit <file>`

Đưa một tệp qua vòng phân tích và xuất dành riêng cho từng loại. Đầu ra phải
giống đầu vào theo từng byte đối với một tệp hợp lệ; sự khác biệt cho thấy
lỗi trình phân tích cú pháp hoặc đã kích hoạt sentinel. Hữu ích để gỡ lỗi hành vi của tầng nền trên
đầu vào thực tế.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Mã thoát

| Mã  | Ý nghĩa                                                                                 |
| --- | --------------------------------------------------------------------------------------- |
| `0` | Thành công. (`resolve` / `find`: có ít nhất một kết quả khớp. `set`: ghi thành công.)    |
| `1` | Không có kết quả khớp, hoặc `set` bị tầng nền từ chối (không có lỗi cấp hệ thống).       |
| `2` | Lỗi đối số hoặc lỗi phân tích cú pháp.                                                   |

## Chế độ đầu ra

`openclaw path` nhận biết TTY: đầu ra dễ đọc cho con người trên thiết bị đầu cuối, JSON khi
stdout được truyền qua đường ống hoặc chuyển hướng. `--json` và `--human` ghi đè cơ chế
tự động phát hiện.

## Ghi chú

- `set` ghi các byte thông qua đường dẫn xuất của tầng nền, nơi tự động áp dụng
  điều kiện bảo vệ sentinel che giấu dữ liệu. Một nút lá chứa
  `__OPENCLAW_REDACTED__` (nguyên văn hoặc dưới dạng chuỗi con) sẽ bị từ chối khi
  ghi.
- Việc phân tích JSONC và chỉnh sửa nút lá sử dụng phần phụ thuộc `jsonc-parser`
  cục bộ của plugin, vì vậy chú thích và định dạng được giữ nguyên khi ghi nút lá
  thông thường thay vì đi qua đường dẫn trình phân tích/tái kết xuất tự viết.
- `path` không nhận biết việc theo dõi hoặc khôi phục cấu hình tốt gần nhất (LKG);
  vòng đời đó do thành phần khác quản lý. Nếu một tệp bạn chỉnh sửa thông qua `path`
  cũng được theo dõi bằng LKG, lần đọc cấu hình tiếp theo sẽ quyết định có nâng cấp hay
  khôi phục tệp đó; hãy xem một chỉnh sửa bằng `path` giống như mọi thao tác ghi trực tiếp khác vào
  tệp đó.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
