---
read_when:
    - Bạn muốn tự động hóa theo sự kiện cho /new, /reset, /stop và các sự kiện vòng đời tác tử
    - Bạn muốn xây dựng, cài đặt hoặc gỡ lỗi hook
summary: 'Hook: tự động hóa theo sự kiện cho lệnh và sự kiện vòng đời'
title: Các móc nối
x-i18n:
    generated_at: "2026-06-27T17:08:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0259739b0547ba4826b540d392c6d6b72c6bec24fd50d5e297817694fd728438
    source_path: automation/hooks.md
    workflow: 16
---

Hook là các script nhỏ chạy khi có điều gì đó xảy ra bên trong Gateway. Chúng có thể được phát hiện từ các thư mục và được kiểm tra bằng `openclaw hooks`. Gateway chỉ tải các hook nội bộ sau khi bạn bật hook hoặc cấu hình ít nhất một mục hook, gói hook, trình xử lý cũ, hoặc thư mục hook bổ sung.

Có hai loại hook trong OpenClaw:

- **Hook nội bộ** (trang này): chạy bên trong Gateway khi các sự kiện agent được kích hoạt, như `/new`, `/reset`, `/stop`, hoặc các sự kiện vòng đời.
- **Webhook**: các endpoint HTTP bên ngoài cho phép hệ thống khác kích hoạt công việc trong OpenClaw. Xem [Webhook](/vi/automation/cron-jobs#webhooks).

Hook cũng có thể được đóng gói bên trong plugin. `openclaw hooks list` hiển thị cả hook độc lập và hook do plugin quản lý.

## Chọn đúng bề mặt

OpenClaw có một số bề mặt mở rộng trông tương tự nhau nhưng giải quyết các vấn đề khác nhau:

| Nếu bạn muốn...                                                                                                      | Dùng...                                  | Vì sao                                                                                         |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Lưu snapshot khi `/new`, ghi log `/reset`, gọi API bên ngoài sau `message:sent`, hoặc thêm tự động hóa thô cho operator | Hook nội bộ (`HOOK.md`, trang này)       | Hook dựa trên tệp dành cho hiệu ứng phụ do operator quản lý và tự động hóa lệnh/vòng đời       |
| Viết lại prompt, chặn tool, hủy tin nhắn gửi đi, hoặc thêm middleware/chính sách có thứ tự                             | Hook plugin có kiểu qua `api.on(...)`    | Hook có kiểu có hợp đồng, độ ưu tiên, quy tắc hợp nhất, và ngữ nghĩa chặn/hủy rõ ràng          |
| Thêm xuất dữ liệu chỉ dành cho telemetry hoặc khả năng quan sát                                                       | Sự kiện chẩn đoán                        | Khả năng quan sát là một bus sự kiện riêng, không phải bề mặt hook chính sách                  |

Dùng hook nội bộ khi bạn muốn tự động hóa hoạt động như một tích hợp nhỏ đã cài đặt. Dùng hook plugin có kiểu khi bạn cần kiểm soát vòng đời runtime.

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
| `command`                | Bất kỳ sự kiện lệnh nào (listener chung)                   |
| `session:compact:before` | Trước khi Compaction tóm tắt lịch sử                       |
| `session:compact:after`  | Sau khi Compaction hoàn tất                                |
| `session:patch`          | Khi thuộc tính phiên được sửa đổi                          |
| `agent:bootstrap`        | Trước khi các tệp bootstrap workspace được chèn            |
| `gateway:startup`        | Sau khi channel khởi động và hook được tải                 |
| `gateway:shutdown`       | Khi quá trình tắt Gateway bắt đầu                          |
| `gateway:pre-restart`    | Trước một lần khởi động lại Gateway dự kiến                |
| `message:received`       | Tin nhắn đến từ bất kỳ channel nào                         |
| `message:transcribed`    | Sau khi phiên âm âm thanh hoàn tất                         |
| `message:preprocessed`   | Sau khi tiền xử lý media và liên kết hoàn tất hoặc bị bỏ qua |
| `message:sent`           | Tin nhắn gửi đi đã được gửi                                |

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
| `export`   | Export được đặt tên để dùng (mặc định là `"default"`) |
| `os`       | Nền tảng bắt buộc (ví dụ: `["darwin", "linux"]`)     |
| `requires` | Các đường dẫn `bins`, `anyBins`, `env`, hoặc `config` bắt buộc |
| `always`   | Bỏ qua kiểm tra đủ điều kiện (boolean)               |
| `install`  | Phương thức cài đặt                                  |

### Triển khai trình xử lý

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send a reply on replyable surfaces
  event.messages.push("Hook executed!");
};

export default handler;
```

Mỗi sự kiện bao gồm: `type`, `action`, `sessionKey`, `timestamp`, `messages` (đẩy phản hồi vào đây chỉ trên các bề mặt có thể trả lời), và `context` (dữ liệu riêng cho sự kiện). Ngữ cảnh hook plugin agent và tool cũng có thể bao gồm `trace`, một ngữ cảnh trace chẩn đoán tương thích W3C, chỉ đọc, mà plugin có thể truyền vào log có cấu trúc để tương quan OTEL.

`event.messages` chỉ được gửi tự động trên các bề mặt có thể trả lời như
`command:*` và `message:received`. Các sự kiện chỉ dành cho vòng đời như
`agent:bootstrap`, `session:*`, `gateway:*`, hoặc `message:sent` không có
channel trả lời và bỏ qua các tin nhắn được đẩy vào.

### Điểm nổi bật về ngữ cảnh sự kiện

**Sự kiện lệnh** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Sự kiện tin nhắn** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dữ liệu riêng theo provider bao gồm `senderId`, `senderName`, `guildId`). `context.content` ưu tiên phần thân lệnh không trống cho các tin nhắn giống lệnh, rồi quay về phần thân đến thô và phần thân chung; nó không bao gồm phần bổ sung chỉ dành cho agent như lịch sử thread hoặc tóm tắt liên kết.

**Sự kiện tin nhắn** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Sự kiện tin nhắn** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Sự kiện tin nhắn** (`message:preprocessed`): `context.bodyForAgent` (phần thân đã làm giàu cuối cùng), `context.from`, `context.channelId`.

**Sự kiện bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (mảng có thể thay đổi), `context.agentId`.

**Sự kiện vá phiên** (`session:patch`): `context.sessionEntry`, `context.patch` (chỉ các trường đã thay đổi), `context.cfg`. Chỉ client đặc quyền mới có thể kích hoạt sự kiện patch.

**Sự kiện Compaction**: `session:compact:before` bao gồm `messageCount`, `tokenCount`. `session:compact:after` thêm `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` quan sát người dùng phát hành `/stop`; đây là vòng đời hủy/lệnh,
không phải cổng hoàn tất agent. Plugin cần kiểm tra câu trả lời cuối tự nhiên
và yêu cầu agent chạy thêm một lượt nên dùng hook plugin có kiểu
`before_agent_finalize` thay thế. Xem [Hook plugin](/vi/plugins/hooks).

**Sự kiện vòng đời Gateway**: `gateway:shutdown` bao gồm `reason` và `restartExpectedMs` và kích hoạt khi quá trình tắt Gateway bắt đầu. `gateway:pre-restart` bao gồm cùng ngữ cảnh nhưng chỉ kích hoạt khi việc tắt là một phần của lần khởi động lại dự kiến và có giá trị `restartExpectedMs` hữu hạn được cung cấp. Trong khi tắt, mỗi lần chờ hook vòng đời là nỗ lực tốt nhất và có giới hạn để quá trình tắt vẫn tiếp tục nếu trình xử lý bị treo. Ngân sách chờ mặc định là 5 giây cho `gateway:shutdown` và 10 giây cho `gateway:pre-restart`.

Dùng `gateway:pre-restart` cho thông báo khởi động lại ngắn khi channel vẫn còn khả dụng:

```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default async function handler(event) {
  if (event.type !== "gateway" || event.action !== "pre-restart") {
    return;
  }

  const restartInSeconds = Math.ceil(event.context.restartExpectedMs / 1000);
  await execFileAsync("openclaw", [
    "system",
    "event",
    "--mode",
    "now",
    "--text",
    `Gateway restarting in ~${restartInSeconds}s (${event.context.reason}). Checkpoint now.`,
  ]);
}
```

Giữa sự kiện `gateway:shutdown` (hoặc `gateway:pre-restart`) và phần còn lại của chuỗi tắt, gateway cũng kích hoạt hook plugin có kiểu `session_end` cho mọi phiên vẫn còn hoạt động khi tiến trình dừng. `reason` của sự kiện là `shutdown` đối với một lần dừng SIGTERM/SIGINT thông thường và `restart` khi việc đóng đã được lên lịch như một phần của lần khởi động lại dự kiến. Quá trình xả này có giới hạn để trình xử lý `session_end` chậm không thể chặn việc thoát tiến trình, và các phiên đã được hoàn tất qua replace / reset / delete / compaction sẽ bị bỏ qua để tránh kích hoạt hai lần.

## Phát hiện hook

Hook được phát hiện từ các thư mục này, theo thứ tự mức độ ưu tiên ghi đè tăng dần:

1. **Hook đóng gói sẵn**: được phát hành cùng OpenClaw
2. **Hook plugin**: hook được đóng gói bên trong plugin đã cài đặt
3. **Hook được quản lý**: `~/.openclaw/hooks/` (do người dùng cài đặt, dùng chung giữa các workspace). Thư mục bổ sung từ `hooks.internal.load.extraDirs` dùng chung mức ưu tiên này.
4. **Hook workspace**: `<workspace>/hooks/` (theo từng agent, mặc định bị tắt cho đến khi được bật rõ ràng)

Hook workspace có thể thêm tên hook mới nhưng không thể ghi đè hook đóng gói sẵn, hook được quản lý, hoặc hook do plugin cung cấp có cùng tên.

Gateway bỏ qua phát hiện hook nội bộ khi khởi động cho đến khi hook nội bộ được cấu hình. Bật hook đóng gói sẵn hoặc được quản lý bằng `openclaw hooks enable <name>`, cài đặt gói hook, hoặc đặt `hooks.internal.enabled=true` để chọn tham gia. Khi bạn bật một hook được đặt tên, Gateway chỉ tải trình xử lý của hook đó; `hooks.internal.enabled=true`, thư mục hook bổ sung, và trình xử lý cũ chọn tham gia phát hiện rộng.

### Gói hook

Gói hook là các package npm export hook qua `openclaw.hooks` trong `package.json`. Cài đặt bằng:

```bash
openclaw plugins install <path-or-spec>
```

Spec npm chỉ dùng registry (tên package + phiên bản chính xác tùy chọn hoặc dist-tag). Spec Git/URL/file và khoảng semver sẽ bị từ chối.

## Hook đóng gói sẵn

| Hook                  | Sự kiện                                           | Chức năng                                                      |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Lưu ngữ cảnh phiên vào `<workspace>/memory/`                   |
| bootstrap-extra-files | `agent:bootstrap`                                 | Chèn các tệp bootstrap bổ sung từ các mẫu glob                 |
| command-logger        | `command`                                         | Ghi nhật ký tất cả lệnh vào `~/.openclaw/logs/commands.log`    |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Gửi thông báo trò chuyện hiển thị khi Compaction phiên bắt đầu/kết thúc |
| boot-md               | `gateway:startup`                                 | Chạy `BOOT.md` khi Gateway khởi động                           |

Bật bất kỳ hook đi kèm nào:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Chi tiết session-memory

Trích xuất 15 tin nhắn người dùng/trợ lý gần nhất và lưu vào `<workspace>/memory/YYYY-MM-DD-HHMM.md` bằng ngày cục bộ của máy chủ. Việc ghi bộ nhớ chạy trong nền để các xác nhận `/new` và `/reset` không bị chậm bởi việc đọc bản ghi hội thoại hoặc tạo slug tùy chọn. Đặt `hooks.internal.entries.session-memory.llmSlug: true` để tạo slug tên tệp mô tả bằng mô hình đã cấu hình. Yêu cầu phải cấu hình `workspace.dir`.

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

Gửi các tin nhắn trạng thái ngắn vào cuộc trò chuyện hiện tại khi OpenClaw bắt đầu và hoàn tất Compaction bản ghi phiên. Điều này giúp các lượt dài bớt gây khó hiểu trên bề mặt trò chuyện vì người dùng có thể thấy rằng trợ lý đang tóm tắt ngữ cảnh và sẽ tiếp tục sau Compaction.

<a id="boot-md"></a>

### Chi tiết boot-md

Chạy `BOOT.md` từ workspace đang hoạt động khi Gateway khởi động.

## Hook Plugin

Plugin có thể đăng ký các hook có kiểu thông qua Plugin SDK để tích hợp sâu hơn:
chặn lệnh gọi công cụ, sửa đổi prompt, kiểm soát luồng tin nhắn, v.v.
Dùng hook Plugin khi bạn cần `before_tool_call`, `before_agent_reply`,
`before_install`, hoặc các hook vòng đời trong tiến trình khác.

Hook nội bộ do Plugin quản lý thì khác: chúng tham gia vào hệ thống sự kiện
lệnh/vòng đời thô của trang này và xuất hiện trong `openclaw hooks list` dưới dạng
`plugin:<id>`. Dùng chúng cho tác dụng phụ và khả năng tương thích với các gói hook, không phải
cho middleware có thứ tự hoặc cổng chính sách.

Để xem tham chiếu hook Plugin đầy đủ, hãy xem [Hook Plugin](/vi/plugins/hooks).

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
Định dạng cấu hình mảng `hooks.internal.handlers` cũ vẫn được hỗ trợ để tương thích ngược, nhưng các hook mới nên dùng hệ thống dựa trên khám phá.
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

- **Giữ handler chạy nhanh.** Hook chạy trong quá trình xử lý lệnh. Kích hoạt công việc nặng theo kiểu chạy rồi bỏ qua bằng `void processInBackground(event)`.
- **Xử lý lỗi một cách mềm dẻo.** Bọc các thao tác rủi ro trong try/catch; đừng throw để các handler khác vẫn có thể chạy.
- **Lọc sự kiện sớm.** Trả về ngay nếu loại/hành động sự kiện không liên quan.
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

Kiểm tra các binary bị thiếu (PATH), biến môi trường, giá trị cấu hình hoặc khả năng tương thích hệ điều hành.

### Hook không thực thi

1. Xác minh hook đã được bật: `openclaw hooks list`
2. Khởi động lại tiến trình Gateway để hook được tải lại.
3. Kiểm tra nhật ký Gateway: `./scripts/clawlog.sh | grep hook`

## Liên quan

- [Tham chiếu CLI: hooks](/vi/cli/hooks)
- [Webhook](/vi/automation/cron-jobs#webhooks)
- [Hook Plugin](/vi/plugins/hooks) — hook vòng đời Plugin trong tiến trình
- [Cấu hình](/vi/gateway/configuration-reference#hooks)
