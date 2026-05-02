---
read_when:
    - Bạn muốn quản lý các hook của agent
    - Bạn muốn kiểm tra tính khả dụng của điểm móc hoặc bật các điểm móc của không gian làm việc
summary: Tài liệu tham khảo CLI cho `openclaw hooks` (các hook tác tử)
title: Các móc nối
x-i18n:
    generated_at: "2026-05-02T20:41:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b02c176b4a310adba3fa1fde3758f6c8a19d454aeec58e919458b3f1a66c87d
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Quản lý các hook của tác tử (tự động hóa theo sự kiện cho các lệnh như `/new`, `/reset` và lúc khởi động Gateway).

Chạy `openclaw hooks` mà không có lệnh con tương đương với `openclaw hooks list`.

Liên quan:

- Hook: [Hook](/vi/automation/hooks)
- Hook của Plugin: [Hook của Plugin](/vi/plugins/hooks)

## Liệt kê tất cả hook

```bash
openclaw hooks list
```

Liệt kê tất cả hook được phát hiện từ thư mục workspace, managed, extra và bundled.
Khởi động Gateway không tải trình xử lý hook nội bộ cho đến khi có ít nhất một hook nội bộ được cấu hình.

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

Hiển thị các yêu cầu còn thiếu đối với hook không đủ điều kiện.

**Ví dụ (JSON):**

```bash
openclaw hooks list --json
```

Trả về JSON có cấu trúc để dùng theo chương trình.

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

Hiển thị tóm tắt trạng thái đủ điều kiện của hook (bao nhiêu hook sẵn sàng so với chưa sẵn sàng).

**Tùy chọn:**

- `--json`: Xuất dưới dạng JSON

**Ví dụ đầu ra:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Bật Hook

```bash
openclaw hooks enable <name>
```

Bật một hook cụ thể bằng cách thêm hook đó vào cấu hình của bạn (`~/.openclaw/openclaw.json` theo mặc định).

**Lưu ý:** Hook workspace bị tắt theo mặc định cho đến khi được bật ở đây hoặc trong cấu hình. Các hook do Plugin quản lý hiển thị `plugin:<id>` trong `openclaw hooks list` và không thể bật/tắt ở đây. Hãy bật/tắt Plugin thay thế.

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

- Kiểm tra xem hook có tồn tại và đủ điều kiện không
- Cập nhật `hooks.internal.entries.<name>.enabled = true` trong cấu hình của bạn
- Lưu cấu hình vào đĩa

Nếu hook đến từ `<workspace>/hooks/`, bước chọn tham gia này là bắt buộc trước khi
Gateway tải hook đó.

**Sau khi bật:**

- Khởi động lại Gateway để các hook được tải lại (khởi động lại ứng dụng thanh menu trên macOS, hoặc khởi động lại tiến trình Gateway của bạn trong môi trường phát triển).

## Tắt Hook

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

- Khởi động lại Gateway để các hook được tải lại

## Ghi chú

- `openclaw hooks list --json`, `info --json` và `check --json` ghi JSON có cấu trúc trực tiếp ra stdout.
- Không thể bật hoặc tắt các hook do Plugin quản lý ở đây; hãy bật hoặc tắt Plugin sở hữu chúng thay thế.

## Cài đặt gói hook

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Cài đặt các gói hook thông qua trình cài đặt Plugin hợp nhất.

`openclaw hooks install` vẫn hoạt động như một alias tương thích, nhưng nó in
cảnh báo ngừng dùng và chuyển tiếp đến `openclaw plugins install`.

Thông số npm **chỉ dùng registry** (tên gói + tùy chọn **phiên bản chính xác** hoặc
**dist-tag**). Thông số Git/URL/file và dải semver bị từ chối. Việc cài đặt dependency
chạy cục bộ theo dự án với `--ignore-scripts` để đảm bảo an toàn, ngay cả khi
shell của bạn có cài đặt cài đặt npm toàn cục.

Thông số trần và `@latest` ở lại kênh ổn định. Nếu npm phân giải một trong hai
thành bản phát hành trước, OpenClaw sẽ dừng và yêu cầu bạn chọn tham gia rõ ràng bằng
thẻ phát hành trước như `@beta`/`@rc` hoặc một phiên bản phát hành trước chính xác.

**Việc này làm gì:**

- Sao chép gói hook vào `~/.openclaw/hooks/<id>`
- Bật các hook đã cài đặt trong `hooks.internal.entries.*`
- Ghi lại cài đặt trong `hooks.internal.installs`

**Tùy chọn:**

- `-l, --link`: Liên kết một thư mục cục bộ thay vì sao chép (thêm thư mục đó vào `hooks.internal.load.extraDirs`)
- `--pin`: Ghi lại cài đặt npm dưới dạng `name@version` đã phân giải chính xác trong `hooks.internal.installs`

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

Các gói hook được liên kết được xem là hook managed từ một thư mục do người vận hành cấu hình,
không phải là hook workspace.

## Cập nhật gói hook

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Cập nhật các gói hook dựa trên npm đang được theo dõi thông qua trình cập nhật Plugin hợp nhất.

`openclaw hooks update` vẫn hoạt động như một alias tương thích, nhưng nó in
cảnh báo ngừng dùng và chuyển tiếp đến `openclaw plugins update`.

**Tùy chọn:**

- `--all`: Cập nhật tất cả gói hook đang được theo dõi
- `--dry-run`: Hiển thị những gì sẽ thay đổi mà không ghi

Khi tồn tại hash toàn vẹn đã lưu và hash artifact được lấy về thay đổi,
OpenClaw in cảnh báo và yêu cầu xác nhận trước khi tiếp tục. Dùng
`--yes` toàn cục để bỏ qua lời nhắc trong các lượt chạy CI/không tương tác.

## Hook đi kèm

### session-memory

Lưu ngữ cảnh phiên vào bộ nhớ khi bạn phát hành `/new` hoặc `/reset`.

**Bật:**

```bash
openclaw hooks enable session-memory
```

**Đầu ra:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Xem:** [tài liệu session-memory](/vi/automation/hooks#session-memory)

### bootstrap-extra-files

Chèn các tệp bootstrap bổ sung (ví dụ `AGENTS.md` / `TOOLS.md` cục bộ trong monorepo) trong lúc `agent:bootstrap`.

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

Chạy `BOOT.md` khi Gateway khởi động (sau khi các kênh khởi động).

**Sự kiện**: `gateway:startup`

**Bật**:

```bash
openclaw hooks enable boot-md
```

**Xem:** [tài liệu boot-md](/vi/automation/hooks#boot-md)

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Hook tự động hóa](/vi/automation/hooks)
