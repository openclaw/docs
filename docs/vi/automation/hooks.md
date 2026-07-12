---
read_when:
    - Bạn muốn tự động hóa theo sự kiện cho /new, /reset, /stop và các sự kiện trong vòng đời của tác tử
    - Bạn muốn xây dựng, cài đặt hoặc gỡ lỗi các hook
summary: 'Hook: tự động hóa theo sự kiện cho các lệnh và sự kiện vòng đời'
title: Hook
x-i18n:
    generated_at: "2026-07-12T07:41:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba09acf45cc09d4ce84b9dda36af2a720ccefbfaed23a1558dd36358ce56701a
    source_path: automation/hooks.md
    workflow: 16
---

Hook là các tập lệnh nhỏ chạy bên trong Gateway khi các sự kiện của tác nhân được kích hoạt: các lệnh như `/new`, `/reset`, `/stop`, Compaction phiên, vòng đời Gateway và luồng tin nhắn. Chúng được phát hiện từ các thư mục và quản lý bằng `openclaw hooks`. Gateway chỉ tải các hook nội bộ sau khi bạn bật hook hoặc cấu hình ít nhất một mục hook, gói hook, trình xử lý cũ hoặc thư mục hook bổ sung.

OpenClaw có hai loại hook:

- **Hook nội bộ** (trang này): chạy bên trong Gateway khi các sự kiện của tác nhân được kích hoạt.
- **Webhook**: các điểm cuối HTTP bên ngoài cho phép hệ thống khác kích hoạt công việc trong OpenClaw. Xem [Webhook](/vi/automation/cron-jobs#webhooks).

Hook cũng có thể được đóng gói bên trong các plugin. `openclaw hooks list` hiển thị cả hook độc lập và hook do plugin quản lý (được hiển thị dưới dạng `plugin:<id>`).

## Chọn bề mặt phù hợp

OpenClaw có một số bề mặt mở rộng trông tương tự nhau nhưng giải quyết các vấn đề khác nhau:

| Nếu bạn muốn...                                                                                                                       | Hãy dùng...                                      | Lý do                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Lưu ảnh chụp nhanh khi chạy `/new`, ghi nhật ký `/reset`, gọi API bên ngoài sau `message:sent` hoặc thêm tự động hóa thô cho người vận hành | Hook nội bộ (`HOOK.md`, trang này)                | Hook dựa trên tệp dành cho các tác dụng phụ do người vận hành quản lý và tự động hóa lệnh/vòng đời                 |
| Viết lại lời nhắc, chặn công cụ, hủy tin nhắn gửi đi hoặc thêm middleware/chính sách có thứ tự                                         | Hook plugin có kiểu thông qua `api.on(...)`       | Hook có kiểu có hợp đồng, mức ưu tiên, quy tắc hợp nhất và ngữ nghĩa chặn/hủy rõ ràng                              |
| Thêm chức năng xuất chỉ dành cho đo từ xa hoặc khả năng quan sát                                                                      | Sự kiện chẩn đoán                                 | Khả năng quan sát sử dụng một bus sự kiện riêng, không phải bề mặt hook chính sách                                |

Dùng hook nội bộ khi bạn muốn tự động hóa hoạt động như một tích hợp nhỏ đã được cài đặt. Dùng hook plugin có kiểu khi bạn cần kiểm soát vòng đời thời gian chạy.

## Bắt đầu nhanh

```bash
# Liệt kê các hook khả dụng
openclaw hooks list

# Bật một hook
openclaw hooks enable session-memory

# Kiểm tra trạng thái hook
openclaw hooks check

# Lấy thông tin chi tiết
openclaw hooks info session-memory
```

## Loại sự kiện

Hook đăng ký một khóa cụ thể trong bảng này hoặc một tên họ sự kiện độc lập
(`command`, `session`, `agent`, `gateway`, `message`) để nhận mọi hành động
trong họ đó. Lõi OpenClaw không phát ra sự kiện nào khác, vì vậy mọi tên khác hầu
như luôn là lỗi chính tả khiến hook âm thầm không hoạt động (chỉ plugin phát ra
sự kiện tùy chỉnh mới có thể kích hoạt nó). Trình tải hook ghi cảnh báo cho các tên
như vậy (ví dụ `command:nwe`), còn `openclaw hooks info <name>` sẽ đánh dấu chúng,
nên có thể chẩn đoán được hook không bao giờ chạy.

| Sự kiện                  | Thời điểm kích hoạt                                         |
| ------------------------ | ----------------------------------------------------------- |
| `command:new`            | Lệnh `/new` được đưa ra                                     |
| `command:reset`          | Lệnh `/reset` được đưa ra                                   |
| `command:stop`           | Lệnh `/stop` được đưa ra                                    |
| `command`                | Bất kỳ sự kiện lệnh nào (trình lắng nghe chung)             |
| `session:compact:before` | Trước khi Compaction tóm tắt lịch sử                        |
| `session:compact:after`  | Sau khi Compaction hoàn tất                                 |
| `session:patch`          | Khi các thuộc tính phiên được sửa đổi                       |
| `agent:bootstrap`        | Trước khi các tệp khởi tạo không gian làm việc được chèn vào |
| `gateway:startup`        | Sau khi các kênh khởi động và hook được tải                 |
| `gateway:shutdown`       | Khi quá trình tắt Gateway bắt đầu                           |
| `gateway:pre-restart`    | Trước một lần khởi động lại Gateway dự kiến                 |
| `message:received`       | Tin nhắn đến từ bất kỳ kênh nào                             |
| `message:transcribed`    | Sau khi hoàn tất phiên âm thanh                             |
| `message:preprocessed`   | Sau khi hoàn tất hoặc bỏ qua tiền xử lý phương tiện và liên kết |
| `message:sent`           | Đã thử gửi đi (`context.success` chứa kết quả)              |

## Viết hook

### Cấu trúc hook

Mỗi hook là một thư mục chứa hai tệp:

```text
my-hook/
├── HOOK.md          # Siêu dữ liệu + tài liệu
└── handler.ts       # Phần triển khai trình xử lý
```

Tệp trình xử lý có thể là `handler.ts`, `handler.js`, `index.ts` hoặc `index.js`.

### Định dạng HOOK.md

```markdown
---
name: my-hook
description: "Mô tả ngắn về chức năng của hook này"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# Hook của tôi

Tài liệu chi tiết được đặt tại đây.
```

**Các trường siêu dữ liệu** (`metadata.openclaw`):

| Trường     | Mô tả                                                         |
| ---------- | ------------------------------------------------------------- |
| `emoji`    | Emoji hiển thị cho CLI                                        |
| `events`   | Mảng các sự kiện cần lắng nghe                                |
| `export`   | Bản xuất có tên sẽ sử dụng (mặc định là `"default"`)          |
| `os`       | Các nền tảng bắt buộc (ví dụ: `["darwin", "linux"]`)          |
| `requires` | Các đường dẫn `bins`, `anyBins`, `env` hoặc `config` bắt buộc |
| `always`   | Bỏ qua kiểm tra tính đủ điều kiện (giá trị boolean)           |
| `hookKey`  | Ghi đè khóa cấu hình (mặc định là tên hook)                   |
| `homepage` | URL tài liệu được `openclaw hooks info` hiển thị              |
| `install`  | Các phương thức cài đặt                                       |

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

Mỗi sự kiện bao gồm: `type`, `action`, `sessionKey`, `timestamp`, `messages` và `context` (dữ liệu riêng cho sự kiện). Ngữ cảnh hook plugin có kiểu dành cho hook tác nhân và công cụ cũng có thể bao gồm `trace`, một ngữ cảnh dấu vết chẩn đoán chỉ đọc tương thích với W3C mà plugin có thể chuyển vào nhật ký có cấu trúc để tương quan OTEL.

Các chuỗi được đẩy vào `event.messages` chỉ được gửi trở lại cuộc trò chuyện đối với
`command:new` và `command:reset` (được định tuyến làm phản hồi cho cuộc hội thoại
gốc), cũng như đối với `session:compact:before` / `session:compact:after`
(được gửi dưới dạng thông báo trạng thái Compaction). Mọi sự kiện khác, bao gồm
`command:stop`, `message:*`, `agent:bootstrap`, `session:patch` và
`gateway:*`, đều bỏ qua các tin nhắn được đẩy vào.

### Điểm nổi bật của ngữ cảnh sự kiện

**Sự kiện lệnh** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.senderId`, `context.workspaceDir`, `context.cfg`.

**Sự kiện lệnh** (`command:stop`): `context.sessionEntry`, `context.sessionId`, `context.commandSource`, `context.senderId`.

**Sự kiện tin nhắn** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dữ liệu riêng cho nhà cung cấp, bao gồm `senderId`, `senderName`, `guildId`). `context.content` ưu tiên phần thân lệnh không trống đối với các tin nhắn giống lệnh, sau đó dùng phần thân tin nhắn đến thô và phần thân chung làm phương án dự phòng; nó không bao gồm nội dung bổ sung chỉ dành cho tác nhân như lịch sử luồng hoặc bản tóm tắt liên kết.

**Sự kiện tin nhắn** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`, cùng với `context.error` khi gửi thất bại.

**Sự kiện tin nhắn** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Sự kiện tin nhắn** (`message:preprocessed`): `context.bodyForAgent` (phần thân cuối cùng đã được bổ sung), `context.from`, `context.channelId`.

**Sự kiện khởi tạo** (`agent:bootstrap`): `context.bootstrapFiles` (mảng có thể thay đổi), `context.agentId`.

**Sự kiện vá phiên** (`session:patch`): `context.sessionEntry`, `context.patch` (chỉ các trường đã thay đổi), `context.cfg`. Chỉ ứng dụng khách có đặc quyền mới có thể kích hoạt sự kiện vá; ngữ cảnh là một bản sao, vì vậy trình xử lý không thể thay đổi mục phiên đang hoạt động.

**Sự kiện Compaction**: `session:compact:before` bao gồm `messageCount`, `tokenCount`. `session:compact:after` bổ sung `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` quan sát việc người dùng đưa ra lệnh `/stop`; đây là vòng đời
hủy/lệnh, không phải cổng hoàn tất tác nhân. Plugin cần kiểm tra câu trả lời cuối
tự nhiên và yêu cầu tác nhân thực hiện thêm một lượt nên dùng hook plugin có kiểu
`before_agent_finalize` thay thế. Xem [Hook plugin](/vi/plugins/hooks).

**Sự kiện vòng đời Gateway**: `gateway:shutdown` bao gồm `reason` và `restartExpectedMs`, đồng thời được kích hoạt khi quá trình tắt Gateway bắt đầu. `gateway:pre-restart` bao gồm cùng ngữ cảnh nhưng chỉ được kích hoạt khi việc tắt là một phần của lần khởi động lại dự kiến và có cung cấp giá trị `restartExpectedMs` hữu hạn. Trong quá trình tắt, thời gian chờ của từng hook vòng đời được thực hiện theo khả năng tốt nhất và có giới hạn để quá trình tắt vẫn tiếp tục nếu trình xử lý bị treo. Ngân sách chờ mặc định là 5 giây cho `gateway:shutdown` và 10 giây cho `gateway:pre-restart`.

Dùng `gateway:pre-restart` cho các thông báo ngắn về việc khởi động lại khi các kênh vẫn khả dụng:

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

Giữa sự kiện `gateway:shutdown` (hoặc `gateway:pre-restart`) và phần còn lại của trình tự tắt, Gateway cũng kích hoạt hook plugin có kiểu `session_end` cho mọi phiên vẫn đang hoạt động khi tiến trình dừng. `reason` của sự kiện là `shutdown` đối với trường hợp dừng SIGTERM/SIGINT thông thường và là `restart` khi việc đóng đã được lên lịch như một phần của lần khởi động lại dự kiến. Quá trình xả này có giới hạn để trình xử lý `session_end` chậm không thể chặn việc thoát tiến trình, đồng thời các phiên đã được hoàn tất thông qua thay thế / đặt lại / xóa / Compaction sẽ bị bỏ qua để tránh kích hoạt hai lần.

## Phát hiện hook

Hook được phát hiện từ bốn nguồn:

1. **Hook đi kèm**: được phân phối cùng OpenClaw
2. **Hook plugin**: được đóng gói bên trong các plugin đã cài đặt; có thể ghi đè hook đi kèm có cùng tên
3. **Hook được quản lý**: `~/.openclaw/hooks/` (do người dùng cài đặt, dùng chung giữa các không gian làm việc); có thể ghi đè hook đi kèm và hook plugin. Các thư mục bổ sung từ `hooks.internal.load.extraDirs` có cùng mức ưu tiên này.
4. **Hook không gian làm việc**: `<workspace>/hooks/` (theo từng tác nhân, mặc định bị tắt cho đến khi được bật rõ ràng)

Hook không gian làm việc có thể thêm tên hook mới nhưng không thể ghi đè hook đi kèm, được quản lý hoặc do plugin cung cấp có cùng tên.

Gateway bỏ qua việc phát hiện hook nội bộ khi khởi động cho đến khi hook nội bộ được cấu hình. Bật một hook đi kèm hoặc được quản lý bằng `openclaw hooks enable <name>`, cài đặt gói hook hoặc đặt `hooks.internal.enabled=true` để tham gia. Khi bạn bật một hook có tên, Gateway chỉ tải trình xử lý của hook đó; `hooks.internal.enabled=true`, các thư mục hook bổ sung và trình xử lý cũ sẽ cho phép phát hiện trên diện rộng.

### Gói hook

Gói hook là các gói npm xuất hook thông qua `openclaw.hooks` trong `package.json`. Cài đặt bằng:

```bash
openclaw plugins install <path-or-spec>
```

Các đặc tả Npm chỉ được phép dùng registry (tên gói + phiên bản chính xác hoặc dist-tag tùy chọn). Các đặc tả Git/URL/tệp và khoảng semver sẽ bị từ chối. Các lệnh cũ `openclaw hooks install` và `openclaw hooks update` là những bí danh đã lỗi thời của `openclaw plugins install` / `openclaw plugins update`.

## Hook đi kèm

| Hook                  | Sự kiện                                           | Chức năng                                                       |
| --------------------- | ------------------------------------------------- | --------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Lưu ngữ cảnh phiên vào `<workspace>/memory/`                    |
| bootstrap-extra-files | `agent:bootstrap`                                 | Chèn các tệp khởi tạo bổ sung từ các mẫu glob                   |
| command-logger        | `command`                                         | Ghi nhật ký tất cả lệnh vào `~/.openclaw/logs/commands.log`     |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Gửi thông báo trò chuyện hiển thị khi Compaction phiên bắt đầu/kết thúc |
| boot-md               | `gateway:startup`                                 | Chạy `BOOT.md` khi Gateway khởi động                            |

Bật một hook đi kèm bất kỳ:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Chi tiết session-memory

Trích xuất các tin nhắn gần nhất của người dùng/trợ lý (mặc định là 15, có thể cấu hình bằng `hooks.internal.entries.session-memory.messages`) và lưu chúng vào `<workspace>/memory/YYYY-MM-DD-HHMM.md` theo ngày cục bộ của máy chủ. Việc ghi lại bộ nhớ chạy trong nền để các xác nhận `/new` và `/reset` không bị trì hoãn bởi thao tác đọc bản chép lời hoặc tạo slug tùy chọn. Đặt `hooks.internal.entries.session-memory.llmSlug: true` để tạo slug tên tệp có tính mô tả, và có thể đặt `hooks.internal.entries.session-memory.model` thành một bí danh đã cấu hình như `sonnet`, một ID mô hình thuần túy trên nhà cung cấp mặc định của tác nhân, hoặc một tham chiếu `provider/model`. Khi bỏ qua `model`, quá trình tạo slug sử dụng mô hình mặc định của tác nhân và chuyển sang slug dấu thời gian khi mô hình không khả dụng. Yêu cầu phải cấu hình `workspace.dir`.

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

`patterns` và `files` được chấp nhận làm bí danh của `paths`. Các đường dẫn được phân giải tương đối với không gian làm việc và phải nằm bên trong đó. Chỉ các tên cơ sở khởi tạo được nhận dạng mới được tải (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Chi tiết command-logger

Ghi nhật ký mỗi lệnh gạch chéo dưới dạng một dòng JSON (dấu thời gian, hành động, khóa phiên, ID người gửi, nguồn) vào `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Chi tiết compaction-notifier

Gửi các thông báo trạng thái ngắn vào cuộc trò chuyện hiện tại khi OpenClaw bắt đầu và hoàn tất Compaction bản chép lời phiên. Điều này giúp các lượt dài bớt khó hiểu trên các giao diện trò chuyện vì người dùng có thể thấy rằng trợ lý đang tóm tắt ngữ cảnh và sẽ tiếp tục sau khi Compaction hoàn tất.

<a id="boot-md"></a>

### Chi tiết boot-md

Chạy `BOOT.md` khi Gateway khởi động cho từng phạm vi tác nhân đã cấu hình, nếu tệp tồn tại trong không gian làm việc đã phân giải của tác nhân đó.

## Hook của Plugin

Các Plugin có thể đăng ký hook có kiểu thông qua Plugin SDK để tích hợp sâu hơn:
chặn các lệnh gọi công cụ, sửa đổi lời nhắc, kiểm soát luồng tin nhắn và nhiều chức năng khác.
Sử dụng hook của Plugin khi bạn cần `before_tool_call`, `before_agent_reply`,
`before_install` hoặc các hook vòng đời trong tiến trình khác.

Các hook nội bộ do Plugin quản lý thì khác: chúng tham gia vào hệ thống sự kiện
lệnh/vòng đời cấp cao của trang này và xuất hiện trong `openclaw hooks list` dưới dạng
`plugin:<id>`. Hãy dùng chúng cho các tác dụng phụ và khả năng tương thích với các gói hook, không phải
cho phần mềm trung gian có thứ tự hoặc các cổng chính sách.

Để xem tài liệu tham khảo đầy đủ về hook của Plugin, hãy xem [Hook của Plugin](/vi/plugins/hooks).

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

Các giá trị môi trường theo từng hook đáp ứng các bước kiểm tra tính đủ điều kiện `requires.env` của hook (cùng với môi trường tiến trình), và trình xử lý có thể đọc chúng từ mục cấu hình hook tương ứng:

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

Các thư mục hook bổ sung:

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
Định dạng cấu hình mảng `hooks.internal.handlers` cũ vẫn được hỗ trợ để tương thích ngược, nhưng các hook mới nên sử dụng hệ thống dựa trên cơ chế khám phá.
</Note>

## Tham khảo CLI

```bash
# Liệt kê tất cả hook (thêm --eligible, --verbose hoặc --json)
openclaw hooks list

# Hiển thị thông tin chi tiết về một hook
openclaw hooks info <hook-name>

# Hiển thị tóm tắt tính đủ điều kiện
openclaw hooks check

# Bật/tắt
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Thực hành tốt nhất

- **Giữ cho trình xử lý hoạt động nhanh.** Hook chạy trong quá trình xử lý lệnh. Hãy chạy công việc nặng theo kiểu khởi chạy rồi không chờ kết quả bằng `void processInBackground(event)`.
- **Xử lý lỗi hợp lý.** Bọc các thao tác có rủi ro trong try/catch; không ném lỗi để các trình xử lý khác có thể chạy.
- **Lọc sự kiện sớm.** Trả về ngay nếu loại/hành động của sự kiện không liên quan.
- **Sử dụng khóa sự kiện cụ thể.** Ưu tiên `"events": ["command:new"]` thay vì `"events": ["command"]` để giảm chi phí xử lý.

## Khắc phục sự cố

### Không phát hiện được hook

```bash
# Xác minh cấu trúc thư mục
ls -la ~/.openclaw/hooks/my-hook/
# Phải hiển thị: HOOK.md, handler.ts

# Liệt kê tất cả hook đã phát hiện
openclaw hooks list
```

### Hook không đủ điều kiện

```bash
openclaw hooks info my-hook
```

Kiểm tra các tệp thực thi còn thiếu (PATH), biến môi trường, giá trị cấu hình hoặc khả năng tương thích với hệ điều hành.

### Hook không thực thi

1. Xác minh hook đã được bật: `openclaw hooks list`
2. Khởi động lại tiến trình Gateway để các hook được tải lại.
3. Kiểm tra nhật ký Gateway: `openclaw logs --follow | grep -i hook`

## Liên quan

- [Tham khảo CLI: hook](/vi/cli/hooks)
- [Webhook](/vi/automation/cron-jobs#webhooks)
- [Hook của Plugin](/vi/plugins/hooks) — các hook vòng đời Plugin trong tiến trình
- [Cấu hình](/vi/gateway/configuration-reference#hooks)
