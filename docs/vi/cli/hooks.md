---
read_when:
    - Bạn muốn quản lý các hook của tác nhân
    - Bạn muốn kiểm tra khả năng sẵn có của hook hoặc bật hook workspace
summary: Tài liệu tham khảo CLI cho `openclaw hooks` (các móc nối tác tử)
title: Móc nối
x-i18n:
    generated_at: "2026-05-06T17:53:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56dd1ef82458dde3280e2cdfb4f3835211726517416e90625d3272d128eb9e0e
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Quản lý các móc nối tác tử (tự động hóa theo sự kiện cho các lệnh như `/new`, `/reset` và khởi động Gateway).

Chạy `openclaw hooks` mà không có lệnh con tương đương với `openclaw hooks list`.

Liên quan:

- Móc nối: [Móc nối](/vi/automation/hooks)
- Móc nối Plugin: [Móc nối Plugin](/vi/plugins/hooks)

## Liệt kê tất cả móc nối

```bash
openclaw hooks list
```

Liệt kê tất cả móc nối đã phát hiện từ các thư mục workspace, được quản lý, bổ sung và đi kèm.
Quá trình khởi động Gateway không tải trình xử lý móc nối nội bộ cho đến khi ít nhất một móc nối nội bộ được cấu hình.

**Tùy chọn:**

- `--eligible`: Chỉ hiển thị các móc nối đủ điều kiện (đáp ứng yêu cầu)
- `--json`: Xuất dưới dạng JSON
- `-v, --verbose`: Hiển thị thông tin chi tiết, bao gồm các yêu cầu còn thiếu

**Ví dụ đầu ra:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**Ví dụ (chi tiết):**

```bash
openclaw hooks list --verbose
```

Hiển thị các yêu cầu còn thiếu cho những móc nối không đủ điều kiện.

**Ví dụ (JSON):**

```bash
openclaw hooks list --json
```

Trả về JSON có cấu trúc để dùng theo chương trình.

## Lấy thông tin móc nối

```bash
openclaw hooks info <name>
```

Hiển thị thông tin chi tiết về một móc nối cụ thể.

**Đối số:**

- `<name>`: Tên móc nối hoặc khóa móc nối (ví dụ: `session-memory`)

**Tùy chọn:**

- `--json`: Xuất dưới dạng JSON

**Ví dụ:**

```bash
openclaw hooks info session-memory
```

**Đầu ra:**

```
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## Kiểm tra điều kiện của móc nối

```bash
openclaw hooks check
```

Hiển thị tóm tắt trạng thái đủ điều kiện của móc nối (bao nhiêu móc nối sẵn sàng so với chưa sẵn sàng).

**Tùy chọn:**

- `--json`: Xuất dưới dạng JSON

**Ví dụ đầu ra:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Bật một móc nối

```bash
openclaw hooks enable <name>
```

Bật một móc nối cụ thể bằng cách thêm nó vào cấu hình của bạn (mặc định là `~/.openclaw/openclaw.json`).

**Lưu ý:** Móc nối workspace bị tắt theo mặc định cho đến khi được bật tại đây hoặc trong cấu hình. Các móc nối do Plugin quản lý hiển thị `plugin:<id>` trong `openclaw hooks list` và không thể bật/tắt tại đây. Thay vào đó, hãy bật/tắt Plugin.

**Đối số:**

- `<name>`: Tên móc nối (ví dụ: `session-memory`)

**Ví dụ:**

```bash
openclaw hooks enable session-memory
```

**Đầu ra:**

```
✓ Enabled hook: 💾 session-memory
```

**Việc này làm gì:**

- Kiểm tra xem móc nối có tồn tại và đủ điều kiện không
- Cập nhật `hooks.internal.entries.<name>.enabled = true` trong cấu hình của bạn
- Lưu cấu hình vào đĩa

Nếu móc nối đến từ `<workspace>/hooks/`, bước chọn tham gia này là bắt buộc trước khi
Gateway tải nó.

**Sau khi bật:**

- Khởi động lại gateway để móc nối được tải lại (khởi động lại ứng dụng thanh menu trên macOS, hoặc khởi động lại tiến trình gateway của bạn trong dev).

## Tắt một móc nối

```bash
openclaw hooks disable <name>
```

Tắt một móc nối cụ thể bằng cách cập nhật cấu hình của bạn.

**Đối số:**

- `<name>`: Tên móc nối (ví dụ: `command-logger`)

**Ví dụ:**

```bash
openclaw hooks disable command-logger
```

**Đầu ra:**

```
⏸ Disabled hook: 📝 command-logger
```

**Sau khi tắt:**

- Khởi động lại gateway để móc nối được tải lại

## Ghi chú

- `openclaw hooks list --json`, `info --json` và `check --json` ghi JSON có cấu trúc trực tiếp ra stdout.
- Không thể bật hoặc tắt các móc nối do Plugin quản lý tại đây; thay vào đó, hãy bật hoặc tắt Plugin sở hữu.

## Cài đặt gói móc nối

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Cài đặt các gói móc nối thông qua trình cài đặt Plugin hợp nhất.

`openclaw hooks install` vẫn hoạt động như một bí danh tương thích, nhưng nó in ra
cảnh báo ngừng dùng và chuyển tiếp đến `openclaw plugins install`.

Đặc tả npm **chỉ dùng registry** (tên gói + **phiên bản chính xác** tùy chọn hoặc
**dist-tag**). Đặc tả Git/URL/tệp và các khoảng semver bị từ chối. Cài đặt phụ thuộc
chạy cục bộ theo dự án với `--ignore-scripts` để an toàn, ngay cả khi shell của bạn
có thiết lập cài đặt npm toàn cục.

Đặc tả trần và `@latest` vẫn nằm trên kênh ổn định. Nếu npm phân giải một trong hai
thành bản phát hành trước, OpenClaw sẽ dừng và yêu cầu bạn chọn tham gia rõ ràng bằng
một thẻ phát hành trước như `@beta`/`@rc` hoặc một phiên bản phát hành trước chính xác.

**Việc này làm gì:**

- Sao chép gói móc nối vào `~/.openclaw/hooks/<id>`
- Bật các móc nối đã cài đặt trong `hooks.internal.entries.*`
- Ghi nhận cài đặt trong `hooks.internal.installs`

**Tùy chọn:**

- `-l, --link`: Liên kết một thư mục cục bộ thay vì sao chép (thêm thư mục đó vào `hooks.internal.load.extraDirs`)
- `--pin`: Ghi nhận cài đặt npm dưới dạng `name@version` đã phân giải chính xác trong `hooks.internal.installs`

**Kho lưu trữ được hỗ trợ:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Ví dụ:**

```bash
# Local directory
openclaw plugins install ./my-hook-pack

# Local archive
openclaw plugins install ./my-hook-pack.zip

# NPM package
openclaw plugins install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw plugins install -l ./my-hook-pack
```

Các gói móc nối được liên kết được xem là móc nối được quản lý từ một thư mục
do người vận hành cấu hình, không phải móc nối workspace.

## Cập nhật gói móc nối

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Cập nhật các gói móc nối dựa trên npm đang được theo dõi thông qua trình cập nhật Plugin hợp nhất.

`openclaw hooks update` vẫn hoạt động như một bí danh tương thích, nhưng nó in ra
cảnh báo ngừng dùng và chuyển tiếp đến `openclaw plugins update`.

**Tùy chọn:**

- `--all`: Cập nhật tất cả gói móc nối đang được theo dõi
- `--dry-run`: Hiển thị những gì sẽ thay đổi mà không ghi

Khi có hàm băm toàn vẹn đã lưu và hàm băm tạo tác đã tải về thay đổi,
OpenClaw in cảnh báo và yêu cầu xác nhận trước khi tiếp tục. Dùng
`--yes` toàn cục để bỏ qua lời nhắc trong CI/lần chạy không tương tác.

## Móc nối đi kèm

### session-memory

Lưu ngữ cảnh phiên vào bộ nhớ khi bạn phát hành `/new` hoặc `/reset`.

**Bật:**

```bash
openclaw hooks enable session-memory
```

**Đầu ra:** mặc định là `~/.openclaw/workspace/memory/YYYY-MM-DD-HHMM.md`. Đặt `hooks.internal.entries.session-memory.llmSlug: true` để dùng slug tên tệp do mô hình tạo.

**Xem:** [tài liệu session-memory](/vi/automation/hooks#session-memory)

### bootstrap-extra-files

Chèn các tệp bootstrap bổ sung (ví dụ `AGENTS.md` / `TOOLS.md` cục bộ của monorepo) trong `agent:bootstrap`.

**Bật:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Xem:** [tài liệu bootstrap-extra-files](/vi/automation/hooks#bootstrap-extra-files)

### command-logger

Ghi nhật ký tất cả sự kiện lệnh vào một tệp kiểm toán tập trung.

**Bật:**

```bash
openclaw hooks enable command-logger
```

**Đầu ra:** `~/.openclaw/logs/commands.log`

**Xem nhật ký:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Xem:** [tài liệu command-logger](/vi/automation/hooks#command-logger)

### boot-md

Chạy `BOOT.md` khi gateway khởi động (sau khi các kênh khởi động).

**Sự kiện**: `gateway:startup`

**Bật**:

```bash
openclaw hooks enable boot-md
```

**Xem:** [tài liệu boot-md](/vi/automation/hooks#boot-md)

## Liên quan

- [tham chiếu CLI](/vi/cli)
- [móc nối tự động hóa](/vi/automation/hooks)
