---
read_when:
    - Bạn muốn tự động hóa theo sự kiện cho /new, /reset, /stop và các sự kiện vòng đời tác nhân
    - Bạn muốn xây dựng, cài đặt hoặc gỡ lỗi các móc nối
summary: 'Móc nối: tự động hóa theo sự kiện cho các lệnh và sự kiện vòng đời'
title: Móc nối
x-i18n:
    generated_at: "2026-05-03T21:27:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15f0d120ccf7314a991da5d66e65e5c78375222a846ba01d7a04ddfe1f02cb32
    source_path: automation/hooks.md
    workflow: 16
---

Hooks là các tập lệnh nhỏ chạy khi có điều gì đó xảy ra bên trong Gateway. Chúng có thể được phát hiện từ các thư mục và được kiểm tra bằng `openclaw hooks`. Gateway chỉ tải các hook nội bộ sau khi bạn bật hooks hoặc cấu hình ít nhất một mục hook, gói hook, trình xử lý cũ, hoặc thư mục hook bổ sung.

Có hai loại hook trong OpenClaw:

- **Hook nội bộ** (trang này): chạy bên trong Gateway khi các sự kiện agent kích hoạt, như `/new`, `/reset`, `/stop`, hoặc các sự kiện vòng đời.
- **Webhooks**: các endpoint HTTP bên ngoài cho phép hệ thống khác kích hoạt công việc trong OpenClaw. Xem [Webhooks](/vi/automation/cron-jobs#webhooks).

Hook cũng có thể được đóng gói bên trong plugins. `openclaw hooks list` hiển thị cả hook độc lập và hook do plugin quản lý.

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
| `session:compact:before` | Trước khi compaction tóm tắt lịch sử                       |
| `session:compact:after`  | Sau khi compaction hoàn tất                                |
| `session:patch`          | Khi thuộc tính phiên được sửa đổi                          |
| `agent:bootstrap`        | Trước khi các tệp bootstrap của không gian làm việc được chèn |
| `gateway:startup`        | Sau khi các kênh khởi động và hooks được tải               |
| `gateway:shutdown`       | Khi quá trình tắt gateway bắt đầu                          |
| `gateway:pre-restart`    | Trước một lần khởi động lại gateway dự kiến                |
| `message:received`       | Tin nhắn đến từ bất kỳ kênh nào                            |
| `message:transcribed`    | Sau khi phiên âm âm thanh hoàn tất                         |
| `message:preprocessed`   | Sau khi tiền xử lý phương tiện và liên kết hoàn tất hoặc bị bỏ qua |
| `message:sent`           | Tin nhắn gửi đi đã được chuyển phát                        |

## Viết hooks

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
| `events`   | Mảng các sự kiện cần lắng nghe                       |
| `export`   | Export có tên cần dùng (mặc định là `"default"`)     |
| `os`       | Nền tảng bắt buộc (ví dụ: `["darwin", "linux"]`)     |
| `requires` | Các đường dẫn `bins`, `anyBins`, `env`, hoặc `config` bắt buộc |
| `always`   | Bỏ qua kiểm tra đủ điều kiện (boolean)               |
| `install`  | Phương thức cài đặt                                  |

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

Mỗi sự kiện bao gồm: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push để gửi cho người dùng), và `context` (dữ liệu theo từng sự kiện). Ngữ cảnh hook của agent và tool plugin cũng có thể bao gồm `trace`, một ngữ cảnh trace chẩn đoán chỉ đọc tương thích W3C mà plugin có thể truyền vào nhật ký có cấu trúc để tương quan OTEL.

### Điểm nổi bật về ngữ cảnh sự kiện

**Sự kiện lệnh** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Sự kiện tin nhắn** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dữ liệu theo từng provider bao gồm `senderId`, `senderName`, `guildId`). `context.content` ưu tiên nội dung lệnh không trống cho các tin nhắn giống lệnh, sau đó quay lại nội dung đến thô và nội dung chung; nó không bao gồm phần làm giàu chỉ dành cho agent như lịch sử luồng hoặc tóm tắt liên kết.

**Sự kiện tin nhắn** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Sự kiện tin nhắn** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Sự kiện tin nhắn** (`message:preprocessed`): `context.bodyForAgent` (nội dung làm giàu cuối cùng), `context.from`, `context.channelId`.

**Sự kiện bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (mảng có thể thay đổi), `context.agentId`.

**Sự kiện bản vá phiên** (`session:patch`): `context.sessionEntry`, `context.patch` (chỉ các trường đã thay đổi), `context.cfg`. Chỉ các client đặc quyền mới có thể kích hoạt sự kiện patch.

**Sự kiện Compaction**: `session:compact:before` bao gồm `messageCount`, `tokenCount`. `session:compact:after` thêm `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` quan sát việc người dùng phát hành `/stop`; đây là vòng đời hủy/lệnh, không phải cổng hoàn tất agent. Plugin cần kiểm tra câu trả lời cuối tự nhiên và yêu cầu agent thực hiện thêm một lượt nên dùng hook plugin có kiểu `before_agent_finalize` thay vào đó. Xem [Hook plugin](/vi/plugins/hooks).

**Sự kiện vòng đời Gateway**: `gateway:shutdown` bao gồm `reason` và `restartExpectedMs`, đồng thời kích hoạt khi quá trình tắt gateway bắt đầu. `gateway:pre-restart` bao gồm cùng ngữ cảnh nhưng chỉ kích hoạt khi việc tắt là một phần của lần khởi động lại dự kiến và giá trị `restartExpectedMs` hữu hạn được cung cấp. Trong quá trình tắt, mỗi lần chờ hook vòng đời là nỗ lực tốt nhất và có giới hạn để quá trình tắt tiếp tục nếu một handler bị treo.

## Phát hiện hook

Hook được phát hiện từ các thư mục này, theo thứ tự độ ưu tiên ghi đè tăng dần:

1. **Hook đi kèm**: được phát hành cùng OpenClaw
2. **Hook plugin**: hook được đóng gói bên trong plugin đã cài đặt
3. **Hook được quản lý**: `~/.openclaw/hooks/` (do người dùng cài đặt, chia sẻ giữa các không gian làm việc). Các thư mục bổ sung từ `hooks.internal.load.extraDirs` dùng chung mức ưu tiên này.
4. **Hook không gian làm việc**: `<workspace>/hooks/` (theo từng agent, bị tắt theo mặc định cho đến khi được bật rõ ràng)

Hook không gian làm việc có thể thêm tên hook mới nhưng không thể ghi đè hook đi kèm, hook được quản lý, hoặc hook do plugin cung cấp có cùng tên.

Gateway bỏ qua việc phát hiện hook nội bộ khi khởi động cho đến khi hooks nội bộ được cấu hình. Bật một hook đi kèm hoặc được quản lý bằng `openclaw hooks enable <name>`, cài đặt một gói hook, hoặc đặt `hooks.internal.enabled=true` để tham gia. Khi bạn bật một hook có tên, Gateway chỉ tải handler của hook đó; `hooks.internal.enabled=true`, thư mục hook bổ sung, và handler cũ tham gia phát hiện rộng.

### Gói hook

Gói hook là các gói npm export hooks thông qua `openclaw.hooks` trong `package.json`. Cài đặt bằng:

```bash
openclaw plugins install <path-or-spec>
```

Spec npm chỉ dùng registry (tên gói + phiên bản chính xác tùy chọn hoặc dist-tag). Spec Git/URL/file và dải semver bị từ chối.

## Hook đi kèm

| Hook                  | Sự kiện                                           | Chức năng                                                       |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Lưu ngữ cảnh phiên vào `<workspace>/memory/`                   |
| bootstrap-extra-files | `agent:bootstrap`                                 | Chèn thêm tệp bootstrap từ các mẫu glob                        |
| command-logger        | `command`                                         | Ghi nhật ký tất cả lệnh vào `~/.openclaw/logs/commands.log`    |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Gửi thông báo chat hiển thị khi compaction phiên bắt đầu/kết thúc |
| boot-md               | `gateway:startup`                                 | Chạy `BOOT.md` khi gateway khởi động                           |

Bật bất kỳ hook đi kèm nào:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Chi tiết session-memory

Trích xuất 15 tin nhắn người dùng/assistant cuối cùng, tạo slug tên tệp mô tả thông qua LLM, và lưu vào `<workspace>/memory/YYYY-MM-DD-slug.md` bằng ngày cục bộ của host. Yêu cầu cấu hình `workspace.dir`.

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

Đường dẫn được phân giải tương đối với không gian làm việc. Chỉ các tên cơ sở bootstrap được nhận diện mới được tải (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Chi tiết command-logger

Ghi nhật ký mọi lệnh slash vào `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Chi tiết compaction-notifier

Gửi các tin nhắn trạng thái ngắn vào cuộc trò chuyện hiện tại khi OpenClaw bắt đầu và kết thúc việc compact transcript phiên. Điều này giúp các lượt dài bớt khó hiểu trên bề mặt chat vì người dùng có thể thấy assistant đang tóm tắt ngữ cảnh và sẽ tiếp tục sau compaction.

<a id="boot-md"></a>

### Chi tiết boot-md

Chạy `BOOT.md` từ không gian làm việc đang hoạt động khi gateway khởi động.

## Hook plugin

Plugin có thể đăng ký hook có kiểu thông qua Plugin SDK để tích hợp sâu hơn:
chặn lời gọi công cụ, sửa đổi prompt, kiểm soát luồng tin nhắn, và nhiều hơn nữa.
Dùng hook plugin khi bạn cần `before_tool_call`, `before_agent_reply`,
`before_install`, hoặc các hook vòng đời trong tiến trình khác.

Để xem tham chiếu hook plugin đầy đủ, xem [Hook plugin](/vi/plugins/hooks).

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
Định dạng cấu hình mảng `hooks.internal.handlers` cũ vẫn được hỗ trợ để tương thích ngược, nhưng hooks mới nên dùng hệ thống dựa trên phát hiện.
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

## Phương pháp tốt nhất

- **Giữ trình xử lý chạy nhanh.** Hook chạy trong quá trình xử lý lệnh. Chạy công việc nặng theo kiểu fire-and-forget bằng `void processInBackground(event)`.
- **Xử lý lỗi nhẹ nhàng.** Bọc các thao tác rủi ro trong try/catch; không throw để các trình xử lý khác vẫn có thể chạy.
- **Lọc sự kiện sớm.** Trả về ngay nếu loại/hành động sự kiện không liên quan.
- **Dùng khóa sự kiện cụ thể.** Ưu tiên `"events": ["command:new"]` thay vì `"events": ["command"]` để giảm chi phí xử lý.

## Khắc phục sự cố

### Không phát hiện thấy hook

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

Kiểm tra các tệp nhị phân bị thiếu (PATH), biến môi trường, giá trị cấu hình hoặc khả năng tương thích hệ điều hành.

### Hook không thực thi

1. Xác minh hook đã được bật: `openclaw hooks list`
2. Khởi động lại tiến trình gateway của bạn để tải lại hook.
3. Kiểm tra nhật ký gateway: `./scripts/clawlog.sh | grep hook`

## Liên quan

- [Tham chiếu CLI: hooks](/vi/cli/hooks)
- [Webhooks](/vi/automation/cron-jobs#webhooks)
- [Plugin hooks](/vi/plugins/hooks) — các hook vòng đời Plugin trong tiến trình
- [Cấu hình](/vi/gateway/configuration-reference#hooks)
