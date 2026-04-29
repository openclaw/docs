---
read_when:
    - Bạn muốn tự động hóa hướng sự kiện cho /new, /reset, /stop và các sự kiện vòng đời tác nhân
    - Bạn muốn xây dựng, cài đặt hoặc gỡ lỗi các hook
summary: 'Các điểm móc: tự động hóa theo sự kiện cho lệnh và sự kiện vòng đời'
title: Móc nối
x-i18n:
    generated_at: "2026-04-29T22:23:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6c567ab79fbff8228d174816e9fb4613f0544ea15a99b5917190a4066af0f57
    source_path: automation/hooks.md
    workflow: 16
---

Hooks là các script nhỏ chạy khi có điều gì đó xảy ra bên trong Gateway. Chúng có thể được phát hiện từ các thư mục và được kiểm tra bằng `openclaw hooks`. Gateway chỉ tải các hook nội bộ sau khi bạn bật hook hoặc cấu hình ít nhất một mục hook, gói hook, trình xử lý cũ, hoặc thư mục hook bổ sung.

Có hai loại hook trong OpenClaw:

- **Hook nội bộ** (trang này): chạy bên trong Gateway khi các sự kiện agent kích hoạt, như `/new`, `/reset`, `/stop`, hoặc các sự kiện vòng đời.
- **Webhook**: các endpoint HTTP bên ngoài cho phép hệ thống khác kích hoạt công việc trong OpenClaw. Xem [Webhook](/vi/automation/cron-jobs#webhooks).

Hook cũng có thể được đóng gói bên trong plugin. `openclaw hooks list` hiển thị cả hook độc lập và hook do plugin quản lý.

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

| Sự kiện                  | Khi nào kích hoạt                                          |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | Lệnh `/new` được phát hành                                 |
| `command:reset`          | Lệnh `/reset` được phát hành                               |
| `command:stop`           | Lệnh `/stop` được phát hành                                |
| `command`                | Bất kỳ sự kiện lệnh nào (trình lắng nghe chung)            |
| `session:compact:before` | Trước khi Compaction tóm tắt lịch sử                       |
| `session:compact:after`  | Sau khi Compaction hoàn tất                                |
| `session:patch`          | Khi thuộc tính phiên được sửa đổi                          |
| `agent:bootstrap`        | Trước khi các tệp bootstrap workspace được chèn vào        |
| `gateway:startup`        | Sau khi các kênh khởi động và hook được tải                |
| `gateway:shutdown`       | Khi quá trình tắt gateway bắt đầu                          |
| `gateway:pre-restart`    | Trước một lần khởi động lại gateway dự kiến                |
| `message:received`       | Tin nhắn đến từ bất kỳ kênh nào                            |
| `message:transcribed`    | Sau khi phiên âm âm thanh hoàn tất                         |
| `message:preprocessed`   | Sau khi xử lý trước media và liên kết hoàn tất hoặc bị bỏ qua |
| `message:sent`           | Tin nhắn gửi đi đã được chuyển phát                        |

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

| Trường     | Mô tả                                                  |
| ---------- | ------------------------------------------------------ |
| `emoji`    | Emoji hiển thị cho CLI                                 |
| `events`   | Mảng sự kiện cần lắng nghe                             |
| `export`   | Export được đặt tên để dùng (mặc định là `"default"`)  |
| `os`       | Nền tảng bắt buộc (ví dụ: `["darwin", "linux"]`)       |
| `requires` | Các đường dẫn `bins`, `anyBins`, `env`, hoặc `config` bắt buộc |
| `always`   | Bỏ qua kiểm tra điều kiện đủ (boolean)                 |
| `install`  | Phương thức cài đặt                                    |

### Triển khai trình xử lý

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

Mỗi sự kiện bao gồm: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push để gửi cho người dùng), và `context` (dữ liệu theo từng sự kiện). Ngữ cảnh hook của agent và tool plugin cũng có thể bao gồm `trace`, một ngữ cảnh trace chẩn đoán chỉ đọc tương thích W3C mà plugin có thể truyền vào log có cấu trúc để tương quan OTEL.

### Điểm nổi bật về ngữ cảnh sự kiện

**Sự kiện lệnh** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Sự kiện tin nhắn** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dữ liệu theo nhà cung cấp bao gồm `senderId`, `senderName`, `guildId`).

**Sự kiện tin nhắn** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Sự kiện tin nhắn** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Sự kiện tin nhắn** (`message:preprocessed`): `context.bodyForAgent` (nội dung cuối cùng đã được làm giàu), `context.from`, `context.channelId`.

**Sự kiện bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (mảng có thể thay đổi), `context.agentId`.

**Sự kiện vá phiên** (`session:patch`): `context.sessionEntry`, `context.patch` (chỉ các trường đã thay đổi), `context.cfg`. Chỉ các client đặc quyền mới có thể kích hoạt sự kiện vá.

**Sự kiện Compaction**: `session:compact:before` bao gồm `messageCount`, `tokenCount`. `session:compact:after` thêm `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` quan sát việc người dùng phát hành `/stop`; đây là vòng đời hủy/lệnh, không phải cổng hoàn tất agent. Plugin cần kiểm tra một câu trả lời cuối tự nhiên và yêu cầu agent chạy thêm một lượt nên dùng hook plugin có kiểu `before_agent_finalize` thay vào đó. Xem [Hook Plugin](/vi/plugins/hooks).

**Sự kiện vòng đời Gateway**: `gateway:shutdown` bao gồm `reason` và `restartExpectedMs` và kích hoạt khi quá trình tắt gateway bắt đầu. `gateway:pre-restart` bao gồm cùng ngữ cảnh nhưng chỉ kích hoạt khi quá trình tắt là một phần của lần khởi động lại dự kiến và có giá trị `restartExpectedMs` hữu hạn được cung cấp. Trong khi tắt, mỗi lần chờ hook vòng đời là nỗ lực tốt nhất và có giới hạn để quá trình tắt tiếp tục nếu trình xử lý bị treo.

## Phát hiện hook

Hook được phát hiện từ các thư mục này, theo thứ tự tăng dần về độ ưu tiên ghi đè:

1. **Hook đi kèm**: được phát hành cùng OpenClaw
2. **Hook Plugin**: hook được đóng gói bên trong plugin đã cài đặt
3. **Hook được quản lý**: `~/.openclaw/hooks/` (do người dùng cài đặt, dùng chung giữa các workspace). Các thư mục bổ sung từ `hooks.internal.load.extraDirs` có cùng mức ưu tiên này.
4. **Hook workspace**: `<workspace>/hooks/` (theo từng agent, bị tắt mặc định cho đến khi được bật rõ ràng)

Hook workspace có thể thêm tên hook mới nhưng không thể ghi đè hook đi kèm, được quản lý, hoặc do plugin cung cấp có cùng tên.

Gateway bỏ qua việc phát hiện hook nội bộ khi khởi động cho đến khi hook nội bộ được cấu hình. Bật một hook đi kèm hoặc được quản lý bằng `openclaw hooks enable <name>`, cài đặt một gói hook, hoặc đặt `hooks.internal.enabled=true` để chọn tham gia. Khi bạn bật một hook có tên, Gateway chỉ tải trình xử lý của hook đó; `hooks.internal.enabled=true`, thư mục hook bổ sung, và trình xử lý cũ chọn tham gia phát hiện rộng.

### Gói hook

Gói hook là các gói npm export hook qua `openclaw.hooks` trong `package.json`. Cài đặt bằng:

```bash
openclaw plugins install <path-or-spec>
```

Spec npm chỉ dùng registry (tên gói + phiên bản chính xác tùy chọn hoặc dist-tag). Spec Git/URL/file và phạm vi semver bị từ chối.

## Hook đi kèm

| Hook                  | Sự kiện                        | Chức năng                                             |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Lưu ngữ cảnh phiên vào `<workspace>/memory/`          |
| bootstrap-extra-files | `agent:bootstrap`              | Chèn các tệp bootstrap bổ sung từ mẫu glob            |
| command-logger        | `command`                      | Ghi log tất cả lệnh vào `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Chạy `BOOT.md` khi gateway khởi động                  |

Bật bất kỳ hook đi kèm nào:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Chi tiết session-memory

Trích xuất 15 tin nhắn người dùng/assistant cuối cùng, tạo một slug tên tệp mô tả bằng LLM, và lưu vào `<workspace>/memory/YYYY-MM-DD-slug.md` bằng ngày cục bộ của host. Yêu cầu `workspace.dir` được cấu hình.

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

Đường dẫn được phân giải tương đối với workspace. Chỉ các basename bootstrap được nhận diện mới được tải (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Chi tiết command-logger

Ghi log mọi lệnh slash vào `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Chi tiết boot-md

Chạy `BOOT.md` từ workspace đang hoạt động khi gateway khởi động.

## Hook Plugin

Plugin có thể đăng ký hook có kiểu thông qua Plugin SDK để tích hợp sâu hơn:
chặn lời gọi công cụ, sửa đổi prompt, kiểm soát luồng tin nhắn, và nhiều hơn nữa.
Dùng hook plugin khi bạn cần `before_tool_call`, `before_agent_reply`,
`before_install`, hoặc hook vòng đời trong tiến trình khác.

Để xem tài liệu tham chiếu đầy đủ về hook plugin, xem [Hook Plugin](/vi/plugins/hooks).

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
Định dạng cấu hình mảng `hooks.internal.handlers` cũ vẫn được hỗ trợ để tương thích ngược, nhưng hook mới nên dùng hệ thống dựa trên phát hiện.
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

## Thực hành tốt nhất

- **Giữ trình xử lý nhanh.** Hook chạy trong khi xử lý lệnh. Chạy công việc nặng kiểu fire-and-forget bằng `void processInBackground(event)`.
- **Xử lý lỗi một cách nhẹ nhàng.** Bọc các thao tác rủi ro trong try/catch; đừng throw để các trình xử lý khác có thể chạy.
- **Lọc sự kiện sớm.** Trả về ngay nếu loại/hành động sự kiện không liên quan.
- **Dùng khóa sự kiện cụ thể.** Ưu tiên `"events": ["command:new"]` thay vì `"events": ["command"]` để giảm chi phí.

## Khắc phục sự cố

### Hook không được phát hiện

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

Kiểm tra binary bị thiếu (PATH), biến môi trường, giá trị cấu hình, hoặc khả năng tương thích hệ điều hành.

### Hook không thực thi

1. Xác minh hook đã được bật: `openclaw hooks list`
2. Khởi động lại tiến trình gateway để hook tải lại.
3. Kiểm tra log gateway: `./scripts/clawlog.sh | grep hook`

## Liên quan

- [Tham chiếu CLI: móc](/vi/cli/hooks)
- [Webhook](/vi/automation/cron-jobs#webhooks)
- [Móc Plugin](/vi/plugins/hooks) — các móc vòng đời Plugin trong tiến trình
- [Cấu hình](/vi/gateway/configuration-reference#hooks)
