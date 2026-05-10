---
read_when:
    - Bạn muốn đọc hoặc ghi một nút lá bên trong một tệp trong không gian làm việc từ thiết bị đầu cuối
    - Bạn đang viết tập lệnh dựa trên trạng thái không gian làm việc và muốn một cơ chế định địa chỉ ổn định, không phụ thuộc vào loại
    - Bạn đang gỡ lỗi một đường dẫn `oc://` (xác thực cú pháp, xem nó phân giải thành gì)
summary: Tài liệu tham chiếu CLI cho `openclaw path` (kiểm tra và chỉnh sửa các tệp trong không gian làm việc thông qua cơ chế định địa chỉ `oc://`)
title: Đường dẫn
x-i18n:
    generated_at: "2026-05-10T19:28:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0b965b791fa658dd04015bb7b5c8c458f6527092473c61cd701eff24a5770fe
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Quyền truy cập shell do Plugin cung cấp vào nền tảng định địa chỉ `oc://`: một
sơ đồ đường dẫn phân phối theo loại để kiểm tra và chỉnh sửa các tệp workspace
có thể định địa chỉ (markdown, jsonc, jsonl). Người tự lưu trữ, tác giả Plugin
và tiện ích mở rộng trình soạn thảo dùng nó để đọc, tìm hoặc cập nhật một vị
trí hẹp mà không phải tự viết parser riêng cho từng loại tệp.

CLI phản ánh các động từ công khai của nền tảng:

- `resolve` là cụ thể và chỉ khớp một kết quả.
- `find` là động từ nhiều kết quả cho wildcard, union, predicate và mở rộng
  theo vị trí.
- `set` chỉ chấp nhận đường dẫn cụ thể hoặc dấu chèn; mẫu wildcard bị từ chối
  trước khi ghi.

`path` được cung cấp bởi Plugin tùy chọn đi kèm `oc-path`. Bật nó trước lần
sử dụng đầu tiên:

```bash
openclaw plugins enable oc-path
```

## Vì sao nên dùng

Trạng thái OpenClaw nằm rải rác trong markdown do con người chỉnh sửa, cấu hình
JSONC có chú thích và log JSONL chỉ ghi thêm. Shell script, hook và agent thường
cần một giá trị nhỏ từ các tệp đó: khóa frontmatter, thiết lập Plugin, trường
bản ghi log hoặc mục bullet dưới một phần được đặt tên.

`openclaw path` cho những caller đó một địa chỉ ổn định thay vì một lệnh grep,
regex hoặc parser dùng một lần cho từng loại tệp. Cùng một đường dẫn `oc://` có
thể được xác thực, resolve, tìm kiếm, chạy thử và ghi từ terminal, giúp tự động
hóa phạm vi hẹp dễ review hơn và an toàn hơn khi chạy lại. Nó đặc biệt hữu ích
khi bạn muốn cập nhật một leaf trong khi vẫn giữ nguyên phần còn lại của chú
thích, line ending và định dạng xung quanh của tệp.

Dùng nó khi thứ bạn muốn có một địa chỉ logic, nhưng hình dạng tệp vật lý thay
đổi:

- Một hook muốn đọc một thiết lập từ JSONC có chú thích mà không làm mất chú
  thích khi ghi lại giá trị.
- Một script bảo trì muốn tìm mọi trường sự kiện khớp trong log JSONL mà không
  tải toàn bộ log vào parser tùy chỉnh.
- Một tiện ích mở rộng trình soạn thảo muốn nhảy đến một phần markdown hoặc mục
  bullet theo slug, rồi render đúng dòng mà nó resolve đến.
- Một agent muốn chạy thử một chỉnh sửa workspace rất nhỏ trước khi áp dụng,
  với các byte đã thay đổi hiển thị trong review.

Bạn có thể không cần `openclaw path` cho chỉnh sửa toàn bộ tệp thông thường,
migration cấu hình phức tạp hoặc ghi dành riêng cho memory. Những việc đó nên
dùng lệnh hoặc Plugin sở hữu. `path` dành cho các thao tác tệp nhỏ, có thể định
địa chỉ, nơi một lệnh terminal lặp lại được rõ ràng hơn một parser tự chế khác.

## Cách sử dụng

Đọc một giá trị từ tệp cấu hình do con người chỉnh sửa:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Xem trước thao tác ghi mà không chạm vào đĩa:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Tìm bản ghi khớp trong log JSONL chỉ ghi thêm:

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

Các lệnh đó được thiết kế để có thể sao chép vào shell script. Dùng `--json`
khi caller cần đầu ra có cấu trúc và `--human` khi một người đang kiểm tra kết
quả.

## Cách hoạt động

`openclaw path` làm bốn việc:

1. Parse địa chỉ `oc://` thành các slot: tệp, phần, mục, trường và session tùy
   chọn.
2. Chọn adapter theo loại tệp từ phần mở rộng đích (`.md`, `.jsonc`,
   `.jsonl` và các alias liên quan).
3. Resolve các slot dựa trên AST của loại tệp đó: heading/mục markdown, khóa
   object/chỉ mục array JSONC hoặc bản ghi dòng JSONL.
4. Với `set`, phát ra các byte đã chỉnh sửa qua cùng adapter để các phần không
   chạm tới của tệp giữ nguyên chú thích, line ending và định dạng lân cận ở
   nơi loại tệp hỗ trợ.

`resolve` và `set` yêu cầu một đích cụ thể. `find` là động từ thăm dò: nó mở
rộng wildcard, union, predicate và ordinal thành các kết quả cụ thể mà bạn có
thể kiểm tra trước khi chọn một kết quả để ghi.

## Lệnh con

| Lệnh con                | Mục đích                                                                     |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | In kết quả khớp cụ thể tại đường dẫn (hoặc "không tìm thấy").                |
| `find <pattern>`        | Liệt kê kết quả khớp cho đường dẫn wildcard / union / predicate.             |
| `set <oc-path> <value>` | Ghi một leaf hoặc đích chèn tại đường dẫn cụ thể. Hỗ trợ `--dry-run`.        |
| `validate <oc-path>`    | Chỉ parse; in phân rã cấu trúc (tệp / phần / mục / trường).                 |
| `emit <file>`           | Round-trip một tệp qua `parseXxx` + `emitXxx` (chẩn đoán độ trung thực byte). |

## Cờ toàn cục

| Cờ              | Mục đích                                                                 |
| --------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | Resolve slot tệp dựa trên thư mục này (mặc định: `process.cwd()`).       |
| `--file <path>` | Ghi đè đường dẫn đã resolve của slot tệp (truy cập tuyệt đối).           |
| `--json`        | Buộc đầu ra JSON (mặc định khi stdout không phải TTY).                   |
| `--human`       | Buộc đầu ra cho người đọc (mặc định khi stdout là TTY).                  |
| `--dry-run`     | (chỉ trên `set`) in các byte sẽ được ghi nhưng không ghi.                |

## Cú pháp `oc://`

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Quy tắc slot: `field` yêu cầu `item`, và `item` yêu cầu `section`. Trên cả bốn
slot:

- **Đoạn được quote** — `"a/b.c"` giữ nguyên qua dấu phân tách `/` và `.`.
  Nội dung là byte-literal; `"` và `\` không được phép bên trong quote.
  Slot tệp cũng nhận biết quote: `oc://"skills/email-drafter"/Tools/$last`
  coi `skills/email-drafter` là một đường dẫn tệp duy nhất.
- **Predicate** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]`. Phép toán số yêu cầu cả hai vế ép kiểu được thành số hữu hạn.
- **Union** — `{a,b,c}` khớp bất kỳ lựa chọn nào.
- **Wildcard** — `*` (một sub-segment) và `**` (không hoặc nhiều, đệ quy).
  `find` chấp nhận các mẫu này; `resolve` và `set` từ chối vì chúng mơ hồ.
- **Theo vị trí** — `$last` resolve thành chỉ mục cuối cùng / khóa khai báo
  cuối cùng.
- **Ordinal** — `#N` cho kết quả khớp thứ N theo thứ tự tài liệu.
- **Dấu chèn** — `+`, `+key`, `+nnn` để chèn theo khóa / theo chỉ mục
  (dùng với `set`).
- **Phạm vi session** — `?session=cron-daily` v.v. Độc lập với việc lồng slot.
  Giá trị session là raw, không percent-decode; chúng không được chứa ký tự
  điều khiển hoặc dấu phân tách query dành riêng (`?`, `&`, `%`).

Ký tự dành riêng (`?`, `&`, `%`) bên ngoài các đoạn được quote, predicate hoặc
union sẽ bị từ chối. Ký tự điều khiển (U+0000-U+001F, U+007F) bị từ chối ở mọi
nơi, bao gồm cả giá trị query `session`.

`formatOcPath(parseOcPath(path)) === path` được đảm bảo cho đường dẫn canonical.
Tham số query không canonical bị bỏ qua ngoại trừ giá trị `session=` không rỗng
đầu tiên.

## Định địa chỉ theo loại tệp

| Loại       | Mô hình định địa chỉ                                                                  |
| ---------- | ------------------------------------------------------------------------------------- |
| Markdown   | Phần H2 theo slug, mục bullet theo slug hoặc `#N`, frontmatter qua `[frontmatter]`.   |
| JSONC/JSON | Khóa object và chỉ mục array; dấu chấm tách sub-segment lồng nhau trừ khi được quote. |
| JSONL      | Địa chỉ dòng cấp cao nhất (`L1`, `L2`, `$last`), rồi đi xuống kiểu JSONC trong dòng.  |

`resolve` trả về một kết quả khớp có cấu trúc: `root`, `node`, `leaf` hoặc
`insertion-point`, với số dòng bắt đầu từ 1. Giá trị leaf được hiển thị dưới
dạng văn bản kèm `leafType` để tác giả Plugin có thể render preview mà không
phụ thuộc vào hình dạng AST theo từng loại.

## Hợp đồng mutation

`set` ghi một đích cụ thể:

- Giá trị frontmatter Markdown và trường mục `- key: value` là leaf chuỗi.
  Thao tác chèn Markdown nối thêm phần, khóa frontmatter hoặc mục trong phần và
  render một hình dạng markdown canonical cho tệp đã thay đổi.
- Ghi leaf JSONC ép kiểu giá trị chuỗi thành loại leaf hiện có (`string`, số
  `number` hữu hạn, `true`/`false` hoặc `null`). Thao tác chèn object và array
  JSONC parse `<value>` dưới dạng JSON và dùng đường dẫn chỉnh sửa
  `jsonc-parser` cho ghi leaf thông thường, bảo toàn chú thích và định dạng
  lân cận.
- Ghi leaf JSONL ép kiểu giống JSONC bên trong một dòng. Thay thế toàn dòng và
  append parse `<value>` dưới dạng JSON. JSONL được render giữ nguyên quy ước
  line-ending LF/CRLF chủ đạo của tệp.

Dùng `--dry-run` trước các thao tác ghi hiển thị với người dùng khi byte chính
xác là quan trọng. Nền tảng bảo toàn đầu ra giống hệt theo byte cho round-trip
parse/emit, nhưng một mutation có thể canonical hóa vùng hoặc tệp đã chỉnh sửa
tùy theo loại.

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

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

Thêm ví dụ ngữ pháp:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

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

Cùng năm động từ hoạt động trên các loại; sơ đồ định địa chỉ phân phối theo
phần mở rộng tệp. Các ví dụ bên dưới dùng fixture từ mô tả PR.

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

Predicate `[frontmatter]` định địa chỉ khối YAML frontmatter; `tools` khớp
heading `## Tools` qua slug, và leaf của mục giữ dạng slug của chúng ngay cả
khi nguồn dùng dấu gạch dưới (`send_email` → `send-email`).

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
`set`. Trước tiên hãy chạy với `--dry-run` để kiểm tra các byte trước khi commit.

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

Mỗi dòng là một bản ghi. Định địa chỉ bằng predicate (`[event=action]`) khi bạn không
biết số dòng, hoặc bằng phân đoạn `LN` chính tắc khi bạn biết.

## Tham chiếu lệnh con

### `resolve <oc-path>`

Đọc một nút lá hoặc nút đơn lẻ. Ký tự đại diện bị từ chối; hãy dùng `find` cho các trường hợp đó.
Thoát với `0` khi có kết quả khớp, `1` khi không tìm thấy hợp lệ, `2` khi có lỗi phân tích cú pháp hoặc mẫu bị từ chối.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Liệt kê mọi kết quả khớp cho một mẫu ký tự đại diện / predicate / union. Thoát với `0`
khi có ít nhất một kết quả khớp, `1` khi không có. Ký tự đại diện ở vị trí tệp bị từ chối với
`OC_PATH_FILE_WILDCARD_UNSUPPORTED`; hãy truyền một tệp cụ thể (khớp mẫu nhiều tệp
là một tính năng tiếp theo).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Ghi một nút lá. Kết hợp với `--dry-run` để xem trước các byte sẽ được
ghi mà không chạm vào tệp. Thoát với `0` khi ghi thành công, `1` nếu
lớp nền từ chối (ví dụ: chạm bộ bảo vệ sentinel), `2` khi có lỗi phân tích cú pháp.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

Dấu chèn `+key` tạo phần tử con có tên nếu phần tử đó chưa
tồn tại; `+nnn` và `+` trần lần lượt dùng cho chèn theo chỉ mục và chèn nối thêm.

### `validate <oc-path>`

Kiểm tra chỉ phân tích cú pháp. Không truy cập hệ thống tệp. Hữu ích khi bạn muốn xác nhận một
đường dẫn mẫu có định dạng đúng trước khi thay thế biến, hoặc khi bạn muốn
xem phân rã cấu trúc để gỡ lỗi:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Thoát với `0` khi hợp lệ, `1` khi không hợp lệ (kèm `code` và
`message` có cấu trúc), `2` khi có lỗi đối số.

### `emit <file>`

Đưa một tệp qua parser và emitter theo từng loại rồi xuất lại. Đầu ra phải
giống hệt đầu vào ở mức byte trên một tệp hợp lệ; sai khác cho thấy
lỗi parser hoặc chạm sentinel. Hữu ích để gỡ lỗi hành vi lớp nền trên
đầu vào thực tế.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Mã thoát

| Mã  | Ý nghĩa                                                                    |
| ---- | -------------------------------------------------------------------------- |
| `0`  | Thành công. (`resolve` / `find`: ít nhất một kết quả khớp. `set`: ghi thành công.) |
| `1`  | Không có kết quả khớp, hoặc `set` bị lớp nền từ chối (không có lỗi cấp hệ thống). |
| `2`  | Lỗi đối số hoặc lỗi phân tích cú pháp.                                      |

## Chế độ đầu ra

`openclaw path` nhận biết TTY: đầu ra dễ đọc cho người dùng trên terminal, JSON khi
stdout được pipe hoặc chuyển hướng. `--json` và `--human` ghi đè cơ chế
tự động phát hiện.

## Ghi chú

- `set` ghi byte qua đường dẫn emit của lớp nền, nơi tự động áp dụng
  bộ bảo vệ sentinel che thông tin. Một nút lá mang
  `__OPENCLAW_REDACTED__` (nguyên văn hoặc dưới dạng chuỗi con) sẽ bị từ chối tại thời điểm ghi.
- Phân tích cú pháp JSONC và chỉnh sửa nút lá dùng dependency `jsonc-parser`
  cục bộ của Plugin, nên chú thích và định dạng được giữ nguyên trên các lần
  ghi nút lá thông thường thay vì đi qua đường dẫn parser/render tự viết.
- `path` không biết về LKG. Nếu tệp được LKG theo dõi, lệnh observe tiếp theo
  sẽ quyết định có promote / recover hay không. `set --batch` cho thao tác
  multi-set nguyên tử qua vòng đời promote/recover của LKG được lên kế hoạch
  cùng với lớp nền phục hồi LKG.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
