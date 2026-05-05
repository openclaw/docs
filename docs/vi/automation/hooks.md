---
read_when:
    - Bạn muốn tự động hóa theo sự kiện cho /new, /reset, /stop và các sự kiện vòng đời của tác tử
    - Bạn muốn xây dựng, cài đặt hoặc gỡ lỗi các móc nối
summary: 'Móc nối: tự động hóa theo sự kiện cho các lệnh và sự kiện vòng đời'
title: Móc nối
x-i18n:
    generated_at: "2026-05-05T08:25:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321eb7a583d5e8c90d2c2026f6e1cf46cd207bef52213774b469a8d46b993967
    source_path: automation/hooks.md
    workflow: 16
---

Hook là các script nhỏ chạy khi có điều gì đó xảy ra bên trong Gateway. Chúng có thể được phát hiện từ các thư mục và kiểm tra bằng `openclaw hooks`. Gateway chỉ tải các hook nội bộ sau khi bạn bật hook hoặc cấu hình ít nhất một mục hook, gói hook, trình xử lý cũ, hoặc thư mục hook bổ sung.

Có hai loại hook trong OpenClaw:

- **Hook nội bộ** (trang này): chạy bên trong Gateway khi các sự kiện agent kích hoạt, như `/new`, `/reset`, `/stop`, hoặc các sự kiện vòng đời.
- **Webhook**: các endpoint HTTP bên ngoài cho phép hệ thống khác kích hoạt công việc trong OpenClaw. Xem [Webhook](/vi/automation/cron-jobs#webhooks).

Hook cũng có thể được đóng gói bên trong Plugin. `openclaw hooks list` hiển thị cả hook độc lập và hook do Plugin quản lý.

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

| Sự kiện                  | Khi nào kích hoạt                                        |
| ------------------------ | -------------------------------------------------------- |
| `command:new`            | Lệnh `/new` được phát hành                               |
| `command:reset`          | Lệnh `/reset` được phát hành                             |
| `command:stop`           | Lệnh `/stop` được phát hành                              |
| `command`                | Bất kỳ sự kiện lệnh nào (trình nghe chung)               |
| `session:compact:before` | Trước khi Compaction tóm tắt lịch sử                     |
| `session:compact:after`  | Sau khi Compaction hoàn tất                              |
| `session:patch`          | Khi thuộc tính phiên được sửa đổi                        |
| `agent:bootstrap`        | Trước khi các tệp bootstrap workspace được chèn vào      |
| `gateway:startup`        | Sau khi các kênh khởi động và hook được tải              |
| `gateway:shutdown`       | Khi quá trình tắt gateway bắt đầu                        |
| `gateway:pre-restart`    | Trước một lần khởi động lại gateway dự kiến              |
| `message:received`       | Tin nhắn đến từ bất kỳ kênh nào                          |
| `message:transcribed`    | Sau khi phiên âm âm thanh hoàn tất                       |
| `message:preprocessed`   | Sau khi tiền xử lý media và liên kết hoàn tất hoặc bị bỏ qua |
| `message:sent`           | Tin nhắn gửi đi đã được chuyển phát                      |

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

| Trường     | Mô tả                                                 |
| ---------- | ----------------------------------------------------- |
| `emoji`    | Emoji hiển thị cho CLI                                |
| `events`   | Mảng sự kiện cần lắng nghe                            |
| `export`   | Export được đặt tên để dùng (mặc định là `"default"`) |
| `os`       | Nền tảng bắt buộc (ví dụ: `["darwin", "linux"]`)      |
| `requires` | Các đường dẫn `bins`, `anyBins`, `env`, hoặc `config` bắt buộc |
| `always`   | Bỏ qua kiểm tra điều kiện hợp lệ (boolean)            |
| `install`  | Phương thức cài đặt                                   |

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

Mỗi sự kiện bao gồm: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push để gửi cho người dùng), và `context` (dữ liệu dành riêng cho sự kiện). Ngữ cảnh hook của agent và Plugin công cụ cũng có thể bao gồm `trace`, một ngữ cảnh vết chẩn đoán tương thích W3C ở chế độ chỉ đọc mà Plugin có thể truyền vào log có cấu trúc để tương quan OTEL.

### Điểm nổi bật về ngữ cảnh sự kiện

**Sự kiện lệnh** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Sự kiện tin nhắn** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dữ liệu dành riêng cho provider bao gồm `senderId`, `senderName`, `guildId`). `context.content` ưu tiên phần thân lệnh không trống cho các tin nhắn giống lệnh, sau đó rơi về phần thân đến thô và phần thân chung; nó không bao gồm phần làm giàu chỉ dành cho agent như lịch sử luồng hoặc tóm tắt liên kết.

**Sự kiện tin nhắn** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Sự kiện tin nhắn** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Sự kiện tin nhắn** (`message:preprocessed`): `context.bodyForAgent` (phần thân làm giàu cuối cùng), `context.from`, `context.channelId`.

**Sự kiện bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (mảng có thể thay đổi), `context.agentId`.

**Sự kiện bản vá phiên** (`session:patch`): `context.sessionEntry`, `context.patch` (chỉ các trường đã thay đổi), `context.cfg`. Chỉ các client đặc quyền mới có thể kích hoạt sự kiện bản vá.

**Sự kiện Compaction**: `session:compact:before` bao gồm `messageCount`, `tokenCount`. `session:compact:after` thêm `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` quan sát việc người dùng phát hành `/stop`; đây là vòng đời hủy/lệnh, không phải cổng hoàn tất agent. Plugin cần kiểm tra câu trả lời cuối tự nhiên và yêu cầu agent chạy thêm một lượt nên dùng hook Plugin có kiểu `before_agent_finalize` thay thế. Xem [Hook Plugin](/vi/plugins/hooks).

**Sự kiện vòng đời Gateway**: `gateway:shutdown` bao gồm `reason` và `restartExpectedMs` và kích hoạt khi quá trình tắt gateway bắt đầu. `gateway:pre-restart` bao gồm cùng ngữ cảnh nhưng chỉ kích hoạt khi việc tắt là một phần của lần khởi động lại dự kiến và một giá trị `restartExpectedMs` hữu hạn được cung cấp. Trong quá trình tắt, mỗi lần chờ hook vòng đời là nỗ lực tốt nhất và có giới hạn để quá trình tắt vẫn tiếp tục nếu một trình xử lý bị treo.

## Phát hiện hook

Hook được phát hiện từ các thư mục này, theo thứ tự độ ưu tiên ghi đè tăng dần:

1. **Hook đi kèm**: được phát hành cùng OpenClaw
2. **Hook Plugin**: hook được đóng gói bên trong Plugin đã cài đặt
3. **Hook được quản lý**: `~/.openclaw/hooks/` (do người dùng cài đặt, dùng chung giữa các workspace). Các thư mục bổ sung từ `hooks.internal.load.extraDirs` chia sẻ độ ưu tiên này.
4. **Hook workspace**: `<workspace>/hooks/` (theo từng agent, mặc định bị tắt cho đến khi được bật rõ ràng)

Hook workspace có thể thêm tên hook mới nhưng không thể ghi đè các hook đi kèm, được quản lý, hoặc do Plugin cung cấp có cùng tên.

Gateway bỏ qua việc phát hiện hook nội bộ khi khởi động cho đến khi hook nội bộ được cấu hình. Bật một hook đi kèm hoặc hook được quản lý bằng `openclaw hooks enable <name>`, cài đặt gói hook, hoặc đặt `hooks.internal.enabled=true` để chọn tham gia. Khi bạn bật một hook được đặt tên, Gateway chỉ tải trình xử lý của hook đó; `hooks.internal.enabled=true`, thư mục hook bổ sung, và trình xử lý cũ chọn tham gia phát hiện rộng.

### Gói hook

Gói hook là các gói npm xuất hook qua `openclaw.hooks` trong `package.json`. Cài đặt bằng:

```bash
openclaw plugins install <path-or-spec>
```

Đặc tả npm chỉ dùng registry (tên gói + phiên bản chính xác hoặc dist-tag tùy chọn). Đặc tả Git/URL/file và dải semver sẽ bị từ chối.

## Hook đi kèm

| Hook                  | Sự kiện                                           | Chức năng                                                      |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Lưu ngữ cảnh phiên vào `<workspace>/memory/`                   |
| bootstrap-extra-files | `agent:bootstrap`                                 | Chèn các tệp bootstrap bổ sung từ mẫu glob                     |
| command-logger        | `command`                                         | Ghi nhật ký tất cả lệnh vào `~/.openclaw/logs/commands.log`    |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Gửi thông báo chat hiển thị khi Compaction phiên bắt đầu/kết thúc |
| boot-md               | `gateway:startup`                                 | Chạy `BOOT.md` khi gateway khởi động                           |

Bật bất kỳ hook đi kèm nào:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Chi tiết session-memory

Trích xuất 15 tin nhắn người dùng/trợ lý gần nhất và lưu vào `<workspace>/memory/YYYY-MM-DD-HHMM.md` theo ngày cục bộ của máy chủ. Việc ghi lại bộ nhớ chạy trong nền nên xác nhận `/new` và `/reset` không bị chậm bởi quá trình đọc bản ghi hội thoại hoặc tạo slug tùy chọn. Đặt `hooks.internal.entries.session-memory.llmSlug: true` để tạo slug tên tệp mô tả bằng mô hình đã cấu hình. Yêu cầu cấu hình `workspace.dir`.

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

Ghi nhật ký mọi lệnh slash vào `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Chi tiết compaction-notifier

Gửi thông báo trạng thái ngắn vào cuộc trò chuyện hiện tại khi OpenClaw bắt đầu và hoàn tất việc nén bản ghi phiên. Điều này giúp các lượt dài bớt khó hiểu trên bề mặt chat vì người dùng có thể thấy trợ lý đang tóm tắt ngữ cảnh và sẽ tiếp tục sau Compaction.

<a id="boot-md"></a>

### Chi tiết boot-md

Chạy `BOOT.md` từ workspace đang hoạt động khi gateway khởi động.

## Hook Plugin

Plugin có thể đăng ký các hook có kiểu thông qua Plugin SDK để tích hợp sâu hơn:
chặn lời gọi công cụ, sửa đổi prompt, điều khiển luồng tin nhắn, v.v.
Dùng hook Plugin khi bạn cần `before_tool_call`, `before_agent_reply`,
`before_install`, hoặc các hook vòng đời trong tiến trình khác.

Để xem tài liệu tham khảo đầy đủ về hook Plugin, hãy xem [Hook Plugin](/vi/plugins/hooks).

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

## Thực hành tốt nhất

- **Giữ các trình xử lý chạy nhanh.** Móc nối chạy trong quá trình xử lý lệnh. Chạy tác vụ nặng theo kiểu không chờ kết quả bằng `void processInBackground(event)`.
- **Xử lý lỗi một cách êm thấm.** Bọc các thao tác rủi ro trong try/catch; không throw để các trình xử lý khác vẫn có thể chạy.
- **Lọc sự kiện sớm.** Trả về ngay nếu kiểu/hành động sự kiện không liên quan.
- **Dùng khóa sự kiện cụ thể.** Ưu tiên `"events": ["command:new"]` thay vì `"events": ["command"]` để giảm chi phí xử lý.

## Khắc phục sự cố

### Không phát hiện được móc nối

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Móc nối không đủ điều kiện

```bash
openclaw hooks info my-hook
```

Kiểm tra các tệp nhị phân bị thiếu (PATH), biến môi trường, giá trị cấu hình hoặc khả năng tương thích hệ điều hành.

### Móc nối không thực thi

1. Xác minh móc nối đã được bật: `openclaw hooks list`
2. Khởi động lại tiến trình Gateway để các móc nối được tải lại.
3. Kiểm tra nhật ký Gateway: `./scripts/clawlog.sh | grep hook`

## Liên quan

- [Tham chiếu CLI: móc nối](/vi/cli/hooks)
- [Webhook](/vi/automation/cron-jobs#webhooks)
- [Móc nối Plugin](/vi/plugins/hooks) — móc nối vòng đời Plugin trong tiến trình
- [Cấu hình](/vi/gateway/configuration-reference#hooks)
