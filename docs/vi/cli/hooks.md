---
read_when:
    - Bạn muốn quản lý các móc nối của tác nhân
    - Bạn muốn kiểm tra tính khả dụng của các móc nối hoặc bật các móc nối trong không gian làm việc
summary: Tài liệu tham chiếu CLI cho `openclaw hooks` (các hook tác nhân)
title: Các móc nối
x-i18n:
    generated_at: "2026-04-29T22:32:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ab6b014923dd4776767a6a0333129b85f51d008c63bb9fbdff06228d4c2f4b
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Quản lý hook của tác tử (tự động hóa theo sự kiện cho các lệnh như `/new`, `/reset` và khi Gateway khởi động).

Chạy `openclaw hooks` mà không có lệnh con tương đương với `openclaw hooks list`.

Liên quan:

- Hook: [Hook](/vi/automation/hooks)
- Hook của Plugin: [Hook của Plugin](/vi/plugins/hooks)

## Liệt kê tất cả hook

```bash
openclaw hooks list
```

Liệt kê tất cả hook được phát hiện từ các thư mục workspace, được quản lý, bổ sung và đi kèm.
Khi Gateway khởi động, Gateway không tải các trình xử lý hook nội bộ cho đến khi ít nhất một hook nội bộ được cấu hình.

**Tùy chọn:**

- `--eligible`: Chỉ hiển thị các hook đủ điều kiện (đáp ứng yêu cầu)
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

Hiển thị các yêu cầu còn thiếu đối với những hook không đủ điều kiện.

**Ví dụ (JSON):**

```bash
openclaw hooks list --json
```

Trả về JSON có cấu trúc để dùng trong chương trình.

## Lấy thông tin hook

```bash
openclaw hooks info <name>
```

Hiển thị thông tin chi tiết về một hook cụ thể.

**Đối số:**

- `<name>`: Tên hook hoặc khóa hook (ví dụ: `session-memory`)

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

## Kiểm tra điều kiện của hook

```bash
openclaw hooks check
```

Hiển thị tóm tắt trạng thái đủ điều kiện của hook (bao nhiêu hook đã sẵn sàng và chưa sẵn sàng).

**Tùy chọn:**

- `--json`: Xuất dưới dạng JSON

**Ví dụ đầu ra:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Bật một hook

```bash
openclaw hooks enable <name>
```

Bật một hook cụ thể bằng cách thêm hook đó vào cấu hình của bạn (mặc định là `~/.openclaw/openclaw.json`).

**Lưu ý:** Hook workspace bị tắt theo mặc định cho đến khi được bật tại đây hoặc trong cấu hình. Các hook do plugin quản lý hiển thị `plugin:<id>` trong `openclaw hooks list` và không thể được bật/tắt tại đây. Thay vào đó, hãy bật/tắt plugin.

**Đối số:**

- `<name>`: Tên hook (ví dụ: `session-memory`)

**Ví dụ:**

```bash
openclaw hooks enable session-memory
```

**Đầu ra:**

```
✓ Enabled hook: 💾 session-memory
```

**Việc này làm gì:**

- Kiểm tra hook có tồn tại và đủ điều kiện không
- Cập nhật `hooks.internal.entries.<name>.enabled = true` trong cấu hình của bạn
- Lưu cấu hình vào đĩa

Nếu hook đến từ `<workspace>/hooks/`, bước chọn tham gia này là bắt buộc trước khi
Gateway tải hook đó.

**Sau khi bật:**

- Khởi động lại gateway để hook được tải lại (khởi động lại ứng dụng thanh menu trên macOS, hoặc khởi động lại tiến trình gateway của bạn trong môi trường phát triển).

## Tắt một hook

```bash
openclaw hooks disable <name>
```

Tắt một hook cụ thể bằng cách cập nhật cấu hình của bạn.

**Đối số:**

- `<name>`: Tên hook (ví dụ: `command-logger`)

**Ví dụ:**

```bash
openclaw hooks disable command-logger
```

**Đầu ra:**

```
⏸ Disabled hook: 📝 command-logger
```

**Sau khi tắt:**

- Khởi động lại gateway để hook được tải lại

## Ghi chú

- `openclaw hooks list --json`, `info --json` và `check --json` ghi JSON có cấu trúc trực tiếp ra stdout.
- Không thể bật hoặc tắt các hook do Plugin quản lý tại đây; thay vào đó hãy bật hoặc tắt Plugin sở hữu chúng.

## Cài đặt gói hook

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Cài đặt gói hook thông qua trình cài đặt plugin thống nhất.

`openclaw hooks install` vẫn hoạt động như một alias tương thích, nhưng in ra
cảnh báo ngừng dùng và chuyển tiếp tới `openclaw plugins install`.

Đặc tả npm **chỉ dùng registry** (tên gói + **phiên bản chính xác** tùy chọn hoặc
**dist-tag**). Đặc tả Git/URL/file và dải semver bị từ chối. Việc cài đặt dependency chạy cục bộ trong dự án với `--ignore-scripts` để đảm bảo an toàn, ngay cả khi
shell của bạn có thiết lập cài đặt npm toàn cục.

Đặc tả trần và `@latest` vẫn ở kênh ổn định. Nếu npm phân giải một trong hai
loại đó thành bản tiền phát hành, OpenClaw sẽ dừng lại và yêu cầu bạn chọn tham gia rõ ràng bằng một
thẻ tiền phát hành như `@beta`/`@rc` hoặc một phiên bản tiền phát hành chính xác.

**Việc này làm gì:**

- Sao chép gói hook vào `~/.openclaw/hooks/<id>`
- Bật các hook đã cài đặt trong `hooks.internal.entries.*`
- Ghi lại bản cài đặt trong `hooks.internal.installs`

**Tùy chọn:**

- `-l, --link`: Liên kết một thư mục cục bộ thay vì sao chép (thêm thư mục đó vào `hooks.internal.load.extraDirs`)
- `--pin`: Ghi các bản cài đặt npm dưới dạng `name@version` đã phân giải chính xác trong `hooks.internal.installs`

**Lưu trữ được hỗ trợ:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

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

Các gói hook được liên kết được xem là hook được quản lý từ một thư mục do người vận hành cấu hình,
không phải hook workspace.

## Cập nhật gói hook

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Cập nhật các gói hook dựa trên npm được theo dõi thông qua trình cập nhật plugin thống nhất.

`openclaw hooks update` vẫn hoạt động như một alias tương thích, nhưng in ra
cảnh báo ngừng dùng và chuyển tiếp tới `openclaw plugins update`.

**Tùy chọn:**

- `--all`: Cập nhật tất cả gói hook được theo dõi
- `--dry-run`: Hiển thị những gì sẽ thay đổi mà không ghi

Khi tồn tại hash toàn vẹn đã lưu và hash artifact đã tải về thay đổi,
OpenClaw in cảnh báo và yêu cầu xác nhận trước khi tiếp tục. Dùng
`--yes` toàn cục để bỏ qua lời nhắc trong CI/lượt chạy không tương tác.

## Hook đi kèm

### session-memory

Lưu ngữ cảnh phiên vào bộ nhớ khi bạn gọi `/new` hoặc `/reset`.

**Bật:**

```bash
openclaw hooks enable session-memory
```

**Đầu ra:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Xem:** [tài liệu session-memory](/vi/automation/hooks#session-memory)

### bootstrap-extra-files

Chèn thêm các tệp bootstrap bổ sung (ví dụ `AGENTS.md` / `TOOLS.md` cục bộ trong monorepo) trong quá trình `agent:bootstrap`.

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
- [hook tự động hóa](/vi/automation/hooks)
