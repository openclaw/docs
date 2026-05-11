---
read_when:
    - Bạn muốn tự động hóa hướng sự kiện cho /new, /reset, /stop và các sự kiện vòng đời tác nhân
    - Bạn muốn xây dựng, cài đặt hoặc gỡ lỗi các hook
summary: 'Móc nối: tự động hóa theo sự kiện cho các lệnh và sự kiện vòng đời'
title: Móc nối
x-i18n:
    generated_at: "2026-05-11T20:20:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02f44dd117d52040ea1205521c6ecd4eb410510175e2312e2584a15e6df27d96
    source_path: automation/hooks.md
    workflow: 16
---

Hooks là các tập lệnh nhỏ chạy khi có điều gì đó xảy ra bên trong Gateway. Chúng có thể được phát hiện từ các thư mục và được kiểm tra bằng `openclaw hooks`. Gateway chỉ tải các hook nội bộ sau khi bạn bật hook hoặc cấu hình ít nhất một mục hook, gói hook, trình xử lý cũ, hoặc thư mục hook bổ sung.

Có hai loại hook trong OpenClaw:

- **Hook nội bộ** (trang này): chạy bên trong Gateway khi các sự kiện tác tử được kích hoạt, như `/new`, `/reset`, `/stop`, hoặc sự kiện vòng đời.
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

| Sự kiện                  | Khi nào được kích hoạt                                      |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | Lệnh `/new` được phát hành                                  |
| `command:reset`          | Lệnh `/reset` được phát hành                                |
| `command:stop`           | Lệnh `/stop` được phát hành                                 |
| `command`                | Bất kỳ sự kiện lệnh nào (trình lắng nghe chung)             |
| `session:compact:before` | Trước khi Compaction tóm tắt lịch sử                        |
| `session:compact:after`  | Sau khi Compaction hoàn tất                                 |
| `session:patch`          | Khi thuộc tính phiên được sửa đổi                           |
| `agent:bootstrap`        | Trước khi các tệp bootstrap của workspace được chèn         |
| `gateway:startup`        | Sau khi các kênh khởi động và hook được tải                 |
| `gateway:shutdown`       | Khi quá trình tắt gateway bắt đầu                           |
| `gateway:pre-restart`    | Trước một lần khởi động lại gateway dự kiến                 |
| `message:received`       | Tin nhắn đến từ bất kỳ kênh nào                             |
| `message:transcribed`    | Sau khi phiên âm âm thanh hoàn tất                          |
| `message:preprocessed`   | Sau khi tiền xử lý media và liên kết hoàn tất hoặc bị bỏ qua |
| `message:sent`           | Tin nhắn đi đã được gửi                                     |

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

| Trường     | Mô tả                                                |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji hiển thị cho CLI                               |
| `events`   | Mảng sự kiện cần lắng nghe                           |
| `export`   | Export được đặt tên để sử dụng (mặc định là `"default"`) |
| `os`       | Nền tảng bắt buộc (ví dụ: `["darwin", "linux"]`)     |
| `requires` | Đường dẫn `bins`, `anyBins`, `env`, hoặc `config` bắt buộc |
| `always`   | Bỏ qua kiểm tra điều kiện hợp lệ (boolean)           |
| `install`  | Phương thức cài đặt                                  |

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

Mỗi sự kiện bao gồm: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push để gửi cho người dùng), và `context` (dữ liệu dành riêng cho sự kiện). Ngữ cảnh hook của Plugin tác tử và công cụ cũng có thể bao gồm `trace`, một ngữ cảnh dấu vết chẩn đoán chỉ đọc tương thích W3C mà plugin có thể truyền vào nhật ký có cấu trúc để tương quan OTEL.

### Điểm nổi bật về ngữ cảnh sự kiện

**Sự kiện lệnh** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Sự kiện tin nhắn** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dữ liệu dành riêng cho provider bao gồm `senderId`, `senderName`, `guildId`). `context.content` ưu tiên phần thân lệnh không trống cho các tin nhắn giống lệnh, sau đó quay lại phần thân đến thô và phần thân chung; nó không bao gồm phần làm giàu chỉ dành cho tác tử như lịch sử luồng hoặc tóm tắt liên kết.

**Sự kiện tin nhắn** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Sự kiện tin nhắn** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Sự kiện tin nhắn** (`message:preprocessed`): `context.bodyForAgent` (phần thân đã làm giàu cuối cùng), `context.from`, `context.channelId`.

**Sự kiện bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (mảng có thể thay đổi), `context.agentId`.

**Sự kiện vá phiên** (`session:patch`): `context.sessionEntry`, `context.patch` (chỉ các trường đã thay đổi), `context.cfg`. Chỉ các client đặc quyền mới có thể kích hoạt sự kiện vá.

**Sự kiện Compaction**: `session:compact:before` bao gồm `messageCount`, `tokenCount`. `session:compact:after` thêm `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` quan sát người dùng phát hành `/stop`; đây là vòng đời hủy/lệnh, không phải cổng hoàn tất tác tử. Plugin cần kiểm tra câu trả lời cuối tự nhiên và yêu cầu tác tử thực hiện thêm một lượt nên dùng hook Plugin có kiểu `before_agent_finalize` thay thế. Xem [Hook của Plugin](/vi/plugins/hooks).

**Sự kiện vòng đời Gateway**: `gateway:shutdown` bao gồm `reason` và `restartExpectedMs` và được kích hoạt khi quá trình tắt gateway bắt đầu. `gateway:pre-restart` bao gồm cùng ngữ cảnh nhưng chỉ được kích hoạt khi việc tắt là một phần của lần khởi động lại dự kiến và có giá trị `restartExpectedMs` hữu hạn được cung cấp. Trong khi tắt, mỗi lần chờ hook vòng đời là nỗ lực tối đa và có giới hạn để quá trình tắt tiếp tục nếu một trình xử lý bị treo.

Giữa sự kiện `gateway:shutdown` (hoặc `gateway:pre-restart`) và phần còn lại của chuỗi tắt, gateway cũng kích hoạt hook Plugin có kiểu `session_end` cho mọi phiên vẫn còn hoạt động khi tiến trình dừng. `reason` của sự kiện là `shutdown` cho một lần dừng SIGTERM/SIGINT thông thường và `restart` khi việc đóng được lên lịch như một phần của lần khởi động lại dự kiến. Quá trình xả này có giới hạn để trình xử lý `session_end` chậm không thể chặn tiến trình thoát, và các phiên đã được hoàn tất thông qua thay thế / đặt lại / xóa / Compaction sẽ bị bỏ qua để tránh kích hoạt hai lần.

## Phát hiện hook

Hook được phát hiện từ các thư mục này, theo thứ tự mức ưu tiên ghi đè tăng dần:

1. **Hook đóng gói sẵn**: được phát hành cùng OpenClaw
2. **Hook của Plugin**: hook được đóng gói bên trong plugin đã cài đặt
3. **Hook được quản lý**: `~/.openclaw/hooks/` (do người dùng cài đặt, dùng chung giữa các workspace). Các thư mục bổ sung từ `hooks.internal.load.extraDirs` dùng chung mức ưu tiên này.
4. **Hook workspace**: `<workspace>/hooks/` (theo từng tác tử, mặc định bị tắt cho đến khi được bật rõ ràng)

Hook workspace có thể thêm tên hook mới nhưng không thể ghi đè hook đóng gói sẵn, hook được quản lý, hoặc hook do plugin cung cấp có cùng tên.

Gateway bỏ qua phát hiện hook nội bộ khi khởi động cho đến khi hook nội bộ được cấu hình. Bật hook đóng gói sẵn hoặc hook được quản lý bằng `openclaw hooks enable <name>`, cài đặt gói hook, hoặc đặt `hooks.internal.enabled=true` để tham gia. Khi bạn bật một hook được đặt tên, Gateway chỉ tải trình xử lý của hook đó; `hooks.internal.enabled=true`, thư mục hook bổ sung, và trình xử lý cũ tham gia phát hiện rộng.

### Gói hook

Gói hook là các gói npm export hook qua `openclaw.hooks` trong `package.json`. Cài đặt bằng:

```bash
openclaw plugins install <path-or-spec>
```

Spec npm chỉ đến từ registry (tên gói + phiên bản chính xác tùy chọn hoặc dist-tag). Spec Git/URL/tệp và khoảng semver bị từ chối.

## Hook đóng gói sẵn

| Hook                  | Sự kiện                                           | Chức năng                                                       |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Lưu ngữ cảnh phiên vào `<workspace>/memory/`                   |
| bootstrap-extra-files | `agent:bootstrap`                                 | Chèn các tệp bootstrap bổ sung từ mẫu glob                     |
| command-logger        | `command`                                         | Ghi nhật ký mọi lệnh vào `~/.openclaw/logs/commands.log`       |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Gửi thông báo chat hiển thị khi Compaction phiên bắt đầu/kết thúc |
| boot-md               | `gateway:startup`                                 | Chạy `BOOT.md` khi gateway khởi động                           |

Bật bất kỳ hook đóng gói sẵn nào:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Chi tiết session-memory

Trích xuất 15 tin nhắn người dùng/trợ lý gần nhất và lưu vào `<workspace>/memory/YYYY-MM-DD-HHMM.md` bằng ngày cục bộ của máy chủ. Việc ghi nhớ chạy trong nền để xác nhận `/new` và `/reset` không bị trì hoãn bởi việc đọc transcript hoặc tạo slug tùy chọn. Đặt `hooks.internal.entries.session-memory.llmSlug: true` để tạo slug tên tệp mô tả bằng mô hình đã cấu hình. Yêu cầu cấu hình `workspace.dir`.

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

Ghi nhật ký mọi lệnh slash vào `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Chi tiết compaction-notifier

Gửi tin nhắn trạng thái ngắn vào cuộc trò chuyện hiện tại khi OpenClaw bắt đầu và hoàn tất việc compact transcript phiên. Điều này giúp các lượt dài bớt khó hiểu trên bề mặt chat vì người dùng có thể thấy trợ lý đang tóm tắt ngữ cảnh và sẽ tiếp tục sau Compaction.

<a id="boot-md"></a>

### Chi tiết boot-md

Chạy `BOOT.md` từ workspace đang hoạt động khi gateway khởi động.

## Hook của Plugin

Plugin có thể đăng ký hook có kiểu thông qua Plugin SDK để tích hợp sâu hơn:
chặn lời gọi công cụ, sửa đổi prompt, kiểm soát luồng tin nhắn, và hơn thế nữa.
Dùng hook Plugin khi bạn cần `before_tool_call`, `before_agent_reply`,
`before_install`, hoặc các hook vòng đời trong tiến trình khác.

Để xem tham chiếu hook Plugin đầy đủ, xem [Hook của Plugin](/vi/plugins/hooks).

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
Định dạng cấu hình mảng `hooks.internal.handlers` cũ vẫn được hỗ trợ để tương thích ngược, nhưng các hook mới nên dùng hệ thống dựa trên cơ chế phát hiện.
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

- **Giữ handler chạy nhanh.** Hook chạy trong quá trình xử lý lệnh. Chạy công việc nặng theo kiểu fire-and-forget bằng `void processInBackground(event)`.
- **Xử lý lỗi một cách nhẹ nhàng.** Bọc các thao tác rủi ro trong try/catch; không throw để các handler khác vẫn có thể chạy.
- **Lọc sự kiện sớm.** Trả về ngay nếu loại/hành động sự kiện không liên quan.
- **Dùng khóa sự kiện cụ thể.** Ưu tiên `"events": ["command:new"]` thay vì `"events": ["command"]` để giảm overhead.

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

Kiểm tra các binary bị thiếu (PATH), biến môi trường, giá trị cấu hình hoặc khả năng tương thích hệ điều hành.

### Hook không thực thi

1. Xác minh hook đã được bật: `openclaw hooks list`
2. Khởi động lại tiến trình gateway để hook được tải lại.
3. Kiểm tra nhật ký gateway: `./scripts/clawlog.sh | grep hook`

## Liên quan

- [Tham chiếu CLI: hooks](/vi/cli/hooks)
- [Webhook](/vi/automation/cron-jobs#webhooks)
- [Hook Plugin](/vi/plugins/hooks) — hook vòng đời plugin trong tiến trình
- [Cấu hình](/vi/gateway/configuration-reference#hooks)
