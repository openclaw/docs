---
read_when:
    - Bạn muốn tự động hóa hướng sự kiện cho /new, /reset, /stop và các sự kiện vòng đời tác nhân
    - Bạn muốn xây dựng, cài đặt hoặc gỡ lỗi các móc nối
summary: 'Móc nối: tự động hóa theo sự kiện cho lệnh và sự kiện vòng đời'
title: Móc nối
x-i18n:
    generated_at: "2026-05-02T20:41:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00ebf65dce03c8643fc1eac84c3915aaa00133c7f007a22483a845e61f055d6b
    source_path: automation/hooks.md
    workflow: 16
---

Hooks là các script nhỏ chạy khi có sự kiện xảy ra bên trong Gateway. Chúng có thể được phát hiện từ các thư mục và được kiểm tra bằng `openclaw hooks`. Gateway chỉ tải các hook nội bộ sau khi bạn bật hook hoặc cấu hình ít nhất một mục hook, gói hook, trình xử lý cũ, hoặc thư mục hook bổ sung.

Có hai loại hook trong OpenClaw:

- **Hook nội bộ** (trang này): chạy bên trong Gateway khi các sự kiện agent kích hoạt, như `/new`, `/reset`, `/stop`, hoặc các sự kiện vòng đời.
- **Webhook**: các endpoint HTTP bên ngoài cho phép hệ thống khác kích hoạt công việc trong OpenClaw. Xem [Webhook](/vi/automation/cron-jobs#webhooks).

Hook cũng có thể được đóng gói bên trong các Plugin. `openclaw hooks list` hiển thị cả hook độc lập và hook do Plugin quản lý.

## Bắt đầu nhanh

```bash
# List available hooks
openclaw hooks list

# Enable a hook
openclaw hooks enable session-memory

# Check hook status
openclaw hooks check

# Get detailed information
openclaw hooks info session-memory
```

## Loại sự kiện

| Sự kiện                  | Khi nào kích hoạt                                         |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | Lệnh `/new` được phát hành                                 |
| `command:reset`          | Lệnh `/reset` được phát hành                               |
| `command:stop`           | Lệnh `/stop` được phát hành                                |
| `command`                | Bất kỳ sự kiện lệnh nào (trình lắng nghe chung)            |
| `session:compact:before` | Trước khi Compaction tóm tắt lịch sử                       |
| `session:compact:after`  | Sau khi Compaction hoàn tất                                |
| `session:patch`          | Khi thuộc tính phiên được sửa đổi                          |
| `agent:bootstrap`        | Trước khi các tệp khởi tạo workspace được chèn vào         |
| `gateway:startup`        | Sau khi các kênh khởi động và hook được tải                |
| `gateway:shutdown`       | Khi quá trình tắt Gateway bắt đầu                          |
| `gateway:pre-restart`    | Trước một lần khởi động lại Gateway dự kiến                |
| `message:received`       | Tin nhắn đến từ bất kỳ kênh nào                            |
| `message:transcribed`    | Sau khi hoàn tất phiên âm âm thanh                         |
| `message:preprocessed`   | Sau khi hoàn tất hoặc bỏ qua tiền xử lý media và liên kết  |
| `message:sent`           | Tin nhắn đi đã được chuyển phát                            |

## Viết hook

### Cấu trúc hook

Mỗi hook là một thư mục chứa hai tệp:

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

### Định dạng HOOK.md

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**Trường metadata** (`metadata.openclaw`):

| Trường     | Mô tả                                                   |
| ---------- | ------------------------------------------------------- |
| `emoji`    | Emoji hiển thị cho CLI                                  |
| `events`   | Mảng sự kiện cần lắng nghe                              |
| `export`   | Export có tên để sử dụng (mặc định là `"default"`)      |
| `os`       | Nền tảng bắt buộc (ví dụ: `["darwin", "linux"]`)        |
| `requires` | Các đường dẫn `bins`, `anyBins`, `env`, hoặc `config` bắt buộc |
| `always`   | Bỏ qua kiểm tra tính đủ điều kiện (boolean)             |
| `install`  | Phương thức cài đặt                                     |

### Triển khai handler

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

Mỗi sự kiện bao gồm: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push để gửi cho người dùng), và `context` (dữ liệu dành riêng cho sự kiện). Ngữ cảnh hook của agent và công cụ Plugin cũng có thể bao gồm `trace`, một ngữ cảnh dấu vết chẩn đoán tương thích W3C, chỉ đọc, mà Plugin có thể truyền vào nhật ký có cấu trúc để tương quan OTEL.

### Điểm nổi bật về ngữ cảnh sự kiện

**Sự kiện lệnh** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Sự kiện tin nhắn** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dữ liệu dành riêng cho nhà cung cấp bao gồm `senderId`, `senderName`, `guildId`). `context.content` ưu tiên phần thân lệnh không trống cho các tin nhắn giống lệnh, sau đó quay về phần thân đến thô và phần thân chung; nó không bao gồm phần làm giàu chỉ dành cho agent như lịch sử luồng hoặc tóm tắt liên kết.

**Sự kiện tin nhắn** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Sự kiện tin nhắn** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Sự kiện tin nhắn** (`message:preprocessed`): `context.bodyForAgent` (phần thân đã làm giàu cuối cùng), `context.from`, `context.channelId`.

**Sự kiện khởi tạo** (`agent:bootstrap`): `context.bootstrapFiles` (mảng có thể thay đổi), `context.agentId`.

**Sự kiện vá phiên** (`session:patch`): `context.sessionEntry`, `context.patch` (chỉ các trường đã thay đổi), `context.cfg`. Chỉ các client có đặc quyền mới có thể kích hoạt sự kiện vá.

**Sự kiện Compaction**: `session:compact:before` bao gồm `messageCount`, `tokenCount`. `session:compact:after` thêm `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` quan sát việc người dùng phát hành `/stop`; đây là vòng đời hủy/lệnh, không phải cổng hoàn tất agent. Các Plugin cần kiểm tra câu trả lời cuối tự nhiên và yêu cầu agent thực hiện thêm một lượt nên dùng hook Plugin có kiểu `before_agent_finalize` thay vào đó. Xem [Hook Plugin](/vi/plugins/hooks).

**Sự kiện vòng đời Gateway**: `gateway:shutdown` bao gồm `reason` và `restartExpectedMs`, đồng thời kích hoạt khi quá trình tắt Gateway bắt đầu. `gateway:pre-restart` bao gồm cùng ngữ cảnh nhưng chỉ kích hoạt khi quá trình tắt là một phần của lần khởi động lại dự kiến và có giá trị `restartExpectedMs` hữu hạn được cung cấp. Trong quá trình tắt, mỗi lần chờ hook vòng đời đều là nỗ lực tốt nhất và có giới hạn để quá trình tắt tiếp tục nếu handler bị treo.

## Phát hiện hook

Hook được phát hiện từ các thư mục này, theo thứ tự mức ưu tiên ghi đè tăng dần:

1. **Hook đi kèm**: được phân phối cùng OpenClaw
2. **Hook Plugin**: hook được đóng gói bên trong các Plugin đã cài đặt
3. **Hook được quản lý**: `~/.openclaw/hooks/` (do người dùng cài đặt, dùng chung giữa các workspace). Các thư mục bổ sung từ `hooks.internal.load.extraDirs` chia sẻ mức ưu tiên này.
4. **Hook workspace**: `<workspace>/hooks/` (theo từng agent, bị tắt theo mặc định cho đến khi được bật rõ ràng)

Hook workspace có thể thêm tên hook mới nhưng không thể ghi đè hook đi kèm, được quản lý, hoặc do Plugin cung cấp có cùng tên.

Gateway bỏ qua việc phát hiện hook nội bộ khi khởi động cho đến khi hook nội bộ được cấu hình. Bật hook đi kèm hoặc được quản lý bằng `openclaw hooks enable <name>`, cài đặt gói hook, hoặc đặt `hooks.internal.enabled=true` để tham gia. Khi bạn bật một hook có tên, Gateway chỉ tải handler của hook đó; `hooks.internal.enabled=true`, thư mục hook bổ sung, và handler cũ chọn tham gia phát hiện rộng.

### Gói hook

Gói hook là các gói npm export hook qua `openclaw.hooks` trong `package.json`. Cài đặt bằng:

```bash
openclaw plugins install <path-or-spec>
```

Đặc tả Npm chỉ dùng registry (tên gói + phiên bản chính xác tùy chọn hoặc dist-tag). Đặc tả Git/URL/file và dải semver bị từ chối.

## Hook đi kèm

| Hook                  | Sự kiện                        | Chức năng                                             |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Lưu ngữ cảnh phiên vào `<workspace>/memory/`          |
| bootstrap-extra-files | `agent:bootstrap`              | Chèn các tệp bootstrap bổ sung từ mẫu glob            |
| command-logger        | `command`                      | Ghi nhật ký tất cả lệnh vào `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Chạy `BOOT.md` khi Gateway khởi động                  |

Bật bất kỳ hook đi kèm nào:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Chi tiết session-memory

Trích xuất 15 tin nhắn người dùng/trợ lý gần nhất, tạo một slug tên tệp mô tả bằng LLM, và lưu vào `<workspace>/memory/YYYY-MM-DD-slug.md` bằng ngày cục bộ của máy chủ. Yêu cầu cấu hình `workspace.dir`.

<a id="bootstrap-extra-files"></a>

### Cấu hình bootstrap-extra-files

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

Đường dẫn được phân giải tương đối với workspace. Chỉ các tên cơ sở bootstrap được nhận diện mới được tải (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Chi tiết command-logger

Ghi nhật ký mọi lệnh gạch chéo vào `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Chi tiết boot-md

Chạy `BOOT.md` từ workspace đang hoạt động khi Gateway khởi động.

## Hook Plugin

Plugin có thể đăng ký hook có kiểu thông qua Plugin SDK để tích hợp sâu hơn:
chặn lời gọi công cụ, sửa đổi prompt, kiểm soát luồng tin nhắn, và hơn thế nữa.
Dùng hook Plugin khi bạn cần `before_tool_call`, `before_agent_reply`,
`before_install`, hoặc các hook vòng đời trong tiến trình khác.

Để xem tham chiếu hook Plugin đầy đủ, xem [Hook Plugin](/vi/plugins/hooks).

## Cấu hình

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

Biến môi trường theo từng hook:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

Thư mục hook bổ sung:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
Định dạng cấu hình mảng `hooks.internal.handlers` cũ vẫn được hỗ trợ để tương thích ngược, nhưng hook mới nên dùng hệ thống dựa trên khám phá.
</Note>

## Tham chiếu CLI

```bash
# List all hooks (add --eligible, --verbose, or --json)
openclaw hooks list

# Show detailed info about a hook
openclaw hooks info <hook-name>

# Show eligibility summary
openclaw hooks check

# Enable/disable
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Phương pháp hay nhất

- **Giữ trình xử lý nhanh.** Hook chạy trong quá trình xử lý lệnh. Chạy tác vụ nặng theo kiểu kích hoạt rồi bỏ qua bằng `void processInBackground(event)`.
- **Xử lý lỗi một cách nhã nhặn.** Bọc các thao tác rủi ro trong try/catch; không throw để các trình xử lý khác có thể chạy.
- **Lọc sự kiện sớm.** Trả về ngay nếu kiểu/hành động sự kiện không liên quan.
- **Dùng khóa sự kiện cụ thể.** Ưu tiên `"events": ["command:new"]` thay vì `"events": ["command"]` để giảm chi phí xử lý.

## Khắc phục sự cố

### Không phát hiện được hook

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Hook không đủ điều kiện

```bash
openclaw hooks info my-hook
```

Kiểm tra xem có thiếu tệp nhị phân (PATH), biến môi trường, giá trị cấu hình, hoặc khả năng tương thích hệ điều hành hay không.

### Hook không thực thi

1. Xác minh hook đã được bật: `openclaw hooks list`
2. Khởi động lại tiến trình Gateway của bạn để các hook được tải lại.
3. Kiểm tra nhật ký Gateway: `./scripts/clawlog.sh | grep hook`

## Liên quan

- [Tham chiếu CLI: hooks](/vi/cli/hooks)
- [Webhook](/vi/automation/cron-jobs#webhooks)
- [Hook Plugin](/vi/plugins/hooks) — các hook vòng đời Plugin trong tiến trình
- [Cấu hình](/vi/gateway/configuration-reference#hooks)
